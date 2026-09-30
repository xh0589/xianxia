#!/usr/bin/env node
/**
 * cdp.mjs — 极简 CDP 驱动（零依赖，只用 node 内置 WebSocket）
 *
 * 为什么不用内置 Playwright MCP：
 *   该工具在 page.evaluate 抛异常时会把标签页丢到 about:blank，
 *   表现为"浏览器反复开/关"，且探查失败会连带丢掉游戏会话。
 *   本文件走原生 CDP，脚本抛异常只影响这一次命令，不影响浏览器与页面。
 *
 * 用法：
 *   node tools/playtest/cdp.mjs launch  [--port 9222] [--profile .scratch/cdp-profile]
 *   node tools/playtest/cdp.mjs shot    <outPng> [--full] [--port 9222]
 *   node tools/playtest/cdp.mjs eval   <jsFile|-> [--port 9222]
 *   node tools/playtest/cdp.mjs text   [--port 9222]          页面可见文字
 *   node tools/playtest/cdp.mjs click  <selector> [--port 9222]
 *   node tools/playtest/cdp.mjs clickat <x> <y>                  按坐标点（find 的输出）
 *   node tools/playtest/cdp.mjs type   <text> [--enter]          真键盘事件打字
 *   node tools/playtest/cdp.mjs dialogs                         处理挂起的原生对话框
 *   node tools/playtest/cdp.mjs find   <text>                按文字定位可点元素
 *   node tools/playtest/cdp.mjs logs   [--port 9222]          控制台错误
 *   node tools/playtest/cdp.mjs stop   [--port 9222]
 *
 * 关键设计：
 *   - eval 一律包 try/catch，异常作为 {__err} 返回，绝不让页面崩
 *   - 所有命令都先确认页面存在（about:blank 直接报错而非乱操作）
 *   - 每次调用都是独立进程 → 天然幂等，崩了不影响下一次
 *   - 原生 confirm()/alert() 会把 CDP 调用挂死（页面 JS 停等），
 *     所以每个交互命令都挂 Page.javascriptDialogOpening 监听，
 *     弹窗一出现就按 acceptDialog 策略自动应答，并把文案记到窗口
 *     ——否则「突破」这种带 confirm() 的按钮一点就超时，后续全废
 */

import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// 本文件是 ESM（.mjs），没有 __dirname
const __dirname = dirname(fileURLToPath(import.meta.url));
import { setTimeout as sleep } from 'node:timers/promises';

// ---------- 参数 ----------
const argv = process.argv.slice(2);
const cmd = argv[0];
function flag(name, dflt) {
  const i = argv.indexOf('--' + name);
  return i >= 0 ? (argv[i + 1] ?? true) : dflt;
}
const PORT = Number(flag('port', 9222));
const CHROME = flag(
  'chrome',
  process.env.PROGRAMFILES
    ? process.env.PROGRAMFILES + '\\Google\\Chrome\\Application\\chrome.exe'
    : process.env['PROGRAMFILES(X86)'] + '\\Google\\Chrome\\Application\\chrome.exe'
);

// ---------- 粘性视口 ----------
// Emulation.setDeviceMetricsOverride 是**会话级**的：设置它的 CDP 连接一关就失效。
// 所以把期望视口记在状态文件里，让每条命令在动手前自己重放一遍。
const VP_STATE = join(__dirname, '..', '..', '.scratch', 'cdp-viewport.json');
function readViewport() {
  try { return JSON.parse(readFileSync(VP_STATE, 'utf8')); } catch (e) { return null; }
}
function writeViewport(v) {
  try {
    if (!existsSync(path.dirname(VP_STATE))) mkdirSync(path.dirname(VP_STATE), { recursive: true });
    writeFileSync(VP_STATE, JSON.stringify(v), 'utf8');
  } catch (e) { /* 存不上就退化成非粘性，不影响正确性 */ }
}
const viewportSteps = () => {
  const v = readViewport();
  if (!v) return [];
  return [v.reset
    ? { method: 'Emulation.clearDeviceMetricsOverride' }
    : { method: 'Emulation.setDeviceMetricsOverride', params: { width: v.width, height: v.height, deviceScaleFactor: 1, mobile: false } }];
};

/**
 * 在一条连接内「重放粘性视口 + 读回实际尺寸」。
 * ⚠️ Emulation.setDeviceMetricsOverride 绑在**连接**上：另开连接去读，
 *    innerWidth 会弹回窗口实际宽度（我为此白查一轮，误以为覆盖失效）。
 *    所以设置与读取必须同一 session。
 */
async function applyViewportAndRead(t) {
  const v = readViewport();
  if (!v) return null;
  const steps = [v.reset
    ? { method: 'Emulation.clearDeviceMetricsOverride' }
    : { method: 'Emulation.setDeviceMetricsOverride', params: { width: v.width, height: v.height, deviceScaleFactor: 1, mobile: false } },
    { method: 'Runtime.evaluate', params: { expression: 'window.innerWidth + "x" + window.innerHeight' } }];
  const out = await session(t.webSocketDebuggerUrl, steps, 15000);
  const last = out[out.length - 1];
  return (last && last.result && last.result.value) || null;
}
async function httpJson(path) {
  const r = await fetch(`http://127.0.0.1:${PORT}${path}`);
  if (!r.ok) throw new Error(`HTTP ${r.status} ${path}`);
  return r.json();
}

async function getTarget() {
  const list = await httpJson('/json/list');
  const page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
  if (!page) throw new Error('没有可用的 page target（浏览器是否已 launch？）');
  return page;
}

/**
 * 在**一条连接内**依次执行多条命令。confirm() 阻塞时，
 * Page.enable 与 evaluate 必须在同一条连接上才能收到对话框事件。
 * steps: [{method, params}, ...]  返回每步的结果数组。
 */
/**
 * 在**一条连接内**依次执行多条命令。
 * confirm() 阻塞时，Page.enable 与 evaluate 必须在同一条连接上，
 * 才收得到 javascriptDialogOpening 事件并及时应答。
 */
async function session(wsUrl, steps, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    let ws;
    try {
      ws = new WebSocket(wsUrl);
    } catch (e) {
      reject(new Error('WebSocket 建立失败: ' + e.message));
      return;
    }
    const results = new Array(steps.length);
    const idToStep = new Map();
    let idx = 0;
    let nextId = Math.floor(Math.random() * 1e9);

    const timer = setTimeout(() => {
      try { ws.close(); } catch {}
      reject(new Error('session 超时 ' + timeoutMs + 'ms（停在第 ' + (idx + 1) + '/' + steps.length + ' 步）'));
    }, timeoutMs);

    const pump = () => {
      if (idx >= steps.length) {
        clearTimeout(timer);
        try { ws.close(); } catch {}
        resolve(results);
        return;
      }
      const id = nextId++;
      idToStep.set(id, idx);
      ws.send(JSON.stringify({ id, method: steps[idx].method, params: steps[idx].params || {} }));
    };

    ws.onopen = pump;

    ws.onmessage = (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }

      if (msg.method === 'Page.javascriptDialogOpening') {
        const accept = !process.env.CDP_DIALOG_DECLINE;
        const txt = (msg.params && msg.params.message || '').slice(0, 300);
        console.error('  [对话框] ' + (accept ? '已确认' : '已取消') + '：' + txt.replace(/\n/g, ' | '));
        try {
          ws.send(JSON.stringify({
            id: nextId++, method: 'Page.handleJavaScriptDialog', params: { accept },
          }));
        } catch {}
        return;
      }
      if (msg.method === 'Page.javascriptDialogClosed') return;

      if (!idToStep.has(msg.id)) return;
      const i = idToStep.get(msg.id);
      idToStep.delete(msg.id);
      if (msg.error) {
        clearTimeout(timer);
        try { ws.close(); } catch {}
        reject(new Error(steps[i].method + ' → ' + JSON.stringify(msg.error)));
        return;
      }
      results[i] = msg.result;
      idx++;
      pump();
    };

    ws.onerror = (e) => {
      clearTimeout(timer);
      reject(new Error('连接错误: ' + (e.message || 'unknown')));
    };
  });
}

/**
 * 交互动作统���走这一条：在**同一连接**里 Page.enable → 派发事件。
 *
 * 为什么不能继续用 send()（一条命令一条连接）：
 *   原生 confirm()/alert() 会让页面 JS 停等，此时派发事件的那次调用
 *   永远收不到回应 → 命令超时，页面被永久卡住，后续全部命令跟着挂。
 *   session() 在同一连接上 Page.enable 并监听 javascriptDialogOpening，
 *   弹窗一出现就自动应答（CDP_DIALOG_DECLINE=1 可改为取消），
 *   点「突破」这种带 confirm() 的按钮才点得动。
 */
async function act(t, steps) {
  const all = [{ method: 'Page.enable' }].concat(steps);
  return session(t.webSocketDebuggerUrl, all, 30000);
}

async function clickAt(t, x, y) {
  await act(t, [
    { method: 'Input.dispatchMouseEvent', params: { type: 'mouseMoved', x, y, buttons: 0 } },
    { method: 'Input.dispatchMouseEvent', params: { type: 'mousePressed', x, y, button: 'left', clickCount: 1, buttons: 1 } },
    { method: 'Input.dispatchMouseEvent', params: { type: 'mouseReleased', x, y, button: 'left', clickCount: 1, buttons: 0 } },
  ]);
}

/** 建一条 CDP 连接，发一条命令，收一条同 id 的结果 */
async function send(wsUrl, method, params = {}, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    let ws;
    try {
      ws = new WebSocket(wsUrl);
    } catch (e) {
      reject(new Error('WebSocket 建立失败: ' + e.message));
      return;
    }
    const timer = setTimeout(() => {
      try { ws.close(); } catch {}
      reject(new Error(method + ' 超时 ' + timeoutMs + 'ms'));
    }, timeoutMs);

    ws.onopen = () => {
      const id = Math.floor(Math.random() * 1e9);
      ws.send(JSON.stringify({ id, method, params }));
      ws.onmessage = (ev) => {
        let msg;
        try { msg = JSON.parse(ev.data); } catch { return; }

        // 对话框事件：confirm() 一旦阻塞，必须立刻应答，否则整条命令挂死。
        // Page.handleJavaScriptDialog 由 CDP 保证送达。
        if (msg.method === 'Page.javascriptDialogOpening') {
          const accept = !process.env.CDP_DIALOG_DECLINE;
          const txt = (msg.params && msg.params.message || '').slice(0, 240);
          console.error('  [对话框] ' + (accept ? '已确认' : '已取消') + '：' + txt.replace(/\n/g, ' | '));
          try {
            ws.send(JSON.stringify({
              id: Math.floor(Math.random() * 1e9),
              method: 'Page.handleJavaScriptDialog',
              params: { accept },
            }));
          } catch {}
          return;
        }
        if (msg.method === 'Page.javascriptDialogClosed') return;

        if (msg.id !== id) return;
        clearTimeout(timer);
        try { ws.close(); } catch {}
        if (msg.error) reject(new Error(method + ' → ' + JSON.stringify(msg.error)));
        else resolve(msg.result);
      };
    };
    ws.onerror = (e) => {
      clearTimeout(timer);
      reject(new Error(method + ' 连接错误: ' + (e.message || 'unknown')));
    };
  });
}

/** 确保拿到的不是 about:blank —— 这是之前误操作频发的根源 */
async function requireLivePage() {
  const t = await getTarget();
  if (!t.url || t.url === 'about:blank') {
    throw new Error('当前标签页是 about:blank。先用 launch/goto 打开游戏页，不要在空页上操作。');
  }
  return t;
}

// ---------- 各命令 ----------
const commands = {
  async launch() {
    const profile = resolve(String(flag('profile', '.scratch/cdp-profile')));
    if (!existsSync(profile)) mkdirSync(profile, { recursive: true });
    if (existsSync(CHROME)) {
      // 已有实例就直接复用，避免"又开一个窗口"
      try {
        await httpJson('/json/version');
        console.log('浏览器已在运行，复用。CDP 端点 http://127.0.0.1:' + PORT);
        return;
      } catch {}
      const child = spawn(
        CHROME,
        [
          '--remote-debugging-port=' + PORT,
          '--user-data-dir=' + profile,
          '--no-first-run',
          '--no-default-browser-check',
          // ↓↓↓ 关键：不加这三条，headless 下 document.visibilityState === 'hidden'，
          // requestAnimationFrame 永不触发 ⇒ 走 rAF 的渲染看着"不刷新"，
          // 会被误判成 UI bug（我栽过一次：状态栏 stale 报成缺陷，代码其实是对的）。
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=Translate,OptimizationGuideModelDownloading',
          'http://127.0.0.1:8931/%E4%BB%99%E4%BE%A0.html',
        ],
        { detached: true, stdio: 'ignore' }
      );
      child.unref();
      for (let i = 0; i < 40; i++) {
        await sleep(500);
        try {
          await httpJson('/json/version');
          console.log('已启动 Chrome，CDP 端点 http://127.0.0.1:' + PORT);
          console.log('profile: ' + profile);
          return;
        } catch {}
      }
      throw new Error('启动超时，未能连上 CDP');
    }
    throw new Error('找不到 Chrome：' + CHROME);
  },

  async goto() {
    const url = String(flag('url', 'http://127.0.0.1:8931/%E4%BB%99%E4%BE%A0.html'));
    const t = await getTarget();
    // ⚠️ 必须先禁缓存：python http.server 不发 Cache-Control，Chrome 会缓存 app.js 等脚本。
    //    换了一份 js/ 之后 goto 仍加载旧脚本，导致"修复没生效"的假结论（我为此白查一轮）。
    await session(t.webSocketDebuggerUrl, [
      { method: 'Network.enable' },
      { method: 'Network.setCacheDisabled', params: { cacheDisabled: true } },
      { method: 'Page.enable' },
      { method: 'Page.navigate', params: { url } },
    ], 30000);
    await sleep(3000);
    const [t2] = await session(t.webSocketDebuggerUrl, [
      { method: 'Runtime.evaluate', params: { expression: 'location.href' } },
    ], 10000);
    console.log('已打开 ' + ((t2 && t2.result && t2.result.value) || url) + '（已禁用缓存）');
  },

  /** eval：代码从 stdin 读（也支持 --file 传脚本路径）。异常绝不外泄，作为 {__err} 返回 */
  async eval() {
    const f = flag('file', null);
    const code = f ? readFileSync(resolve(String(f)), 'utf8') : readFileSync(0, 'utf8');
    if (!code.trim()) {
      console.error('用法:  echo "<js>" | node tools/playtest/cdp.mjs eval   或   node tools/playtest/cdp.mjs eval --file x.js');
      return;
    }
    const t = await requireLivePage();
    // 双层包裹：内层抓用户代码异常，外层再兜一层，保证 evaluate 永远 resolve
    // 内层是 async：脚本里可以直接 await（配合 CDP 的 awaitPromise）
    const wrapped =
      `(() => { try { return (async () => { const __v = await (async function(){ ${code} })();
        return JSON.stringify({ok:true, v: __v === undefined ? null : __v}); })(); }
        catch (e) { return JSON.stringify({ok:false, err: (e && e.message) || String(e),
          stack: (e && e.stack || '').split('\\n').slice(0,4).join(' | ')}); }
      })()`;
    // Page.enable 与 evaluate 必须同连接，否则 confirm() 的事件收不到；
    // 粘性视口的重放也必须在这同一条连接里（Emulation 覆盖绑连接，另开连接无效）
    const v = readViewport();
    const vpStep = !v ? null : (v.reset
      ? { method: 'Emulation.clearDeviceMetricsOverride' }
      : { method: 'Emulation.setDeviceMetricsOverride', params: { width: v.width, height: v.height, deviceScaleFactor: 1, mobile: false } });
    const probe = 'window.innerWidth + "x" + window.innerHeight';
    const base = [
      { method: 'Page.enable' },
      ...(vpStep ? [vpStep] : []),
      { method: 'Runtime.evaluate', params: { expression: wrapped, returnByValue: true, awaitPromise: true } },
      { method: 'Runtime.evaluate', params: { expression: probe } },
    ];
    const steps = await session(t.webSocketDebuggerUrl, base);
    const res = steps[steps.length - 2]; // 倒数第 2 步才是 evaluate 的结果
    const txt = res && res.result && res.result.value;
    if (txt === undefined) {
      console.log(JSON.stringify({ ok: false, err: 'Runtime.evaluate 无返回值', raw: res }, null, 2));
      return;
    }
    let out;
    try { out = JSON.parse(txt); } catch { out = { ok: false, err: '返回非 JSON', raw: txt }; }
    console.log(JSON.stringify(out, null, 2));
    // 把实际视口一并打出来：粘性视口是「同连接内」才生效的，
    // 少了这行，跨命令的视口失效会被误读成"mobile 没起作用"。
    const lastStep = steps[steps.length - 1];
    const vp = lastStep && lastStep.result && lastStep.result.value;
    if (v) console.log('（视口 ' + vp + (v.reset ? '，已重置' : '，粘性 ' + v.width + '×' + v.height) + '）');
  },

  async text() {
    const t = await requireLivePage();
    const r = await send(t.webSocketDebuggerUrl, 'Runtime.evaluate', {
      expression: 'document.body ? document.body.innerText : ""',
      returnByValue: true,
    });
    console.log((r && r.result && r.result.value) || '(空)');
  },

  async shot() {
    const out = resolve(String(flag('out', argv[1] || '.scratch/shot.png')));
    if (!existsSync(dirname(out))) mkdirSync(dirname(out), { recursive: true });
    const t = await requireLivePage();
    const full = !!flag('full', false);
    const v = readViewport();

    // ⚠️ 两处必须同连接，否则窄屏截图全白做：
    //   ① 粘性视口（mobile 记下的）绑在连接上，getLayoutMetrics 另开连接读不到；
    //   ② captureScreenshot 不带 clip 时按**窗口实际像素**出图，
    //      于是「已切到 390×844」却截出 2048 宽的图。
    //   所以：设视口 → 量尺寸 → 截图，全在一条 session 里顺序发。
    const vpStep = !v ? null : (v.reset
      ? { method: 'Emulation.clearDeviceMetricsOverride' }
      : { method: 'Emulation.setDeviceMetricsOverride', params: { width: v.width, height: v.height, deviceScaleFactor: 1, mobile: false } });

    const steps = [
      ...(vpStep ? [vpStep] : []),
      { method: 'Page.getLayoutMetrics' },
    ];
    const first = await session(t.webSocketDebuggerUrl, steps, 20000);
    const metrics = first[first.length - 1];
    const mvs = metrics.cssVisualViewport || {};
    const vw = Math.ceil(mvs.clientWidth || (metrics.cssLayoutViewport && metrics.cssLayoutViewport.clientWidth) || 1280);
    const vh = Math.ceil(mvs.clientHeight || (metrics.cssLayoutViewport && metrics.cssLayoutViewport.clientHeight) || 800);

    const clipH = full ? Math.min(20000, Math.ceil(metrics.cssContentSize.height)) : vh;
    const shotSteps = [
      ...(vpStep ? [vpStep] : []),
      { method: 'Page.captureScreenshot', params: { format: 'png', clip: { x: 0, y: 0, width: vw, height: clipH, scale: 1 } } },
    ];
    const out2 = await session(t.webSocketDebuggerUrl, shotSteps, 60000);
    const r = out2[out2.length - 1];
    if (!r || !r.data) {
      console.error('【失败】截图没拿到数据（视口 ' + vw + '×' + clipH + '）');
      return;
    }
    writeFileSync(out, Buffer.from(r.data, 'base64'));
    console.log('已保存 ' + out + '（视口 ' + vw + '×' + clipH + (full ? '，整页' : '') + '）');
  },

  /** click：不用 Playwright 的可见性/拦截判定，直接派发真实鼠标事件 */
  async click() {
    const sel = String(argv[1]);
    const t = await requireLivePage();
    const js = `(() => {
      const el = document.querySelector(${JSON.stringify(sel)});
      if (!el) return {ok:false, err:'选择器没匹配到元素'};
      el.scrollIntoView({block:'center'});
      const r = el.getBoundingClientRect();
      const x = r.left + r.width/2, y = r.top + r.height/2;
      const top = document.elementFromPoint(x, y);
      return {ok:true, x, y, w:r.width, h:r.height,
        文字:(el.innerText||el.textContent||'').trim().slice(0,60),
        该点最上层元素: top ? top.tagName + '.' + String(top.className).slice(0,60) : null,
        是否被遮挡: !(top === el || el.contains(top))};
    })()`;
    const r = await send(t.webSocketDebuggerUrl, 'Runtime.evaluate', { expression: js, returnByValue: true });
    const v = r && r.result && r.result.value;
    let info;
    try { info = typeof v === 'string' ? JSON.parse(v) : v; } catch { info = { 解析失败: v }; }
    if (!info || info.ok !== true) { console.log(JSON.stringify(info, null, 2)); return; }
    await clickAt(t, info.x, info.y);   // 走 session：带 confirm() 的按钮才点得动
    await sleep(500);
    console.log(JSON.stringify(info, null, 2));
  },

  /**
   * dialogs：解冻被原生对话框卡住的页面。
   *
   * 为什么会卡住：原生 confirm()/alert() 让页面 JS 停等，等你点确定。
   * 若那次派发事件的连接没开 Page.enable（老版本 click/clickat 就是这样，
   * 一条命令一条连接），弹窗事件没人应答，页面就永久停在那里——
   * 此后连 eval 都超时，因为整个渲染进程都在等那个对话框。
   *
   * 用法：
   *   dialogs            应答所有挂起对话框（默认接受）
   *   dialogs --decline  改为取消（CDP_DIALOG_DECLINE 同效）
   */
  async dialogs() {
    const t = await requireLivePage();
    const accept = !flag('decline', false) && !process.env.CDP_DIALOG_DECLINE;
    // 顺序要紧：页面被冻住时 Page.enable 自己也会超时，
    // 所以先无条件发一次 handleJavaScriptDialog 把冻解开，再开 enable 接住后续的。
    // 「No dialog is showing」是良性情形——上一条命令的连接断开时浏览器
    // 已把对话框自动关掉了，此时该做的是确认页面还活着。
    let r;
    try {
      r = await session(t.webSocketDebuggerUrl, [
        { method: 'Page.handleJavaScriptDialog', params: { accept } },
        { method: 'Page.enable' },
      ], 15000);
    } catch (e) {
      if (/No dialog is showing/.test(e.message)) {
        r = await session(t.webSocketDebuggerUrl, [{ method: 'Page.enable' }], 15000)
          .catch(e2 => [{ error: { message: e2.message } }]);
      } else throw e;
    }
    console.log('已向页面发出 handleJavaScriptDialog（accept=' + accept + '）。'
      + (r && r[0] && r[0].error ? ' 注意：Page.enable 报 ' + JSON.stringify(r[0].error) : '')
      + ' 若仍超时，说明没有挂起对话框。');
  },

  /**
   * find：按可见文字找可点元素，报出稳定选择器
   */
  async find() {
    const needle = String(argv[1]);
    const t = await requireLivePage();
    const js = `(() => {
      const n = ${JSON.stringify(needle)};
      const out = [];
      document.querySelectorAll('button, [onclick], a, [role=button]').forEach(function(el, i){
        const txt = (el.innerText || el.textContent || '').trim();
        if (txt.indexOf(n) < 0) return;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        out.push({ 序号: i, 文字: txt.replace(/\\s+/g,' ').slice(0,70),
          tag: el.tagName, 可见: el.offsetParent !== null,
          onclick: (el.getAttribute('onclick')||'').slice(0,120),
          x: Math.round(r.left + r.width/2), y: Math.round(r.top + r.height/2) });
      });
      return out;
    })()`;
    const r = await send(t.webSocketDebuggerUrl, 'Runtime.evaluate', { expression: js, returnByValue: true });
    const v = r && r.result && r.result.value;
    let arr;
    try { arr = typeof v === 'string' ? JSON.parse(v) : v; } catch { arr = { 解析失败: v }; }
    console.log(JSON.stringify(arr, null, 2));
  },

  /**
   * clicktext：按可见文字直接点，彻底绕开坐标漂移。
   * 为什么要有这条——这个游戏的列表/折叠/情境窗会随操作重排，
   * 「先 find 拿坐标、再 clickat」两步之间坐标经常已经漂了
   * （点到了旁边的行、折叠标题、甚至 null）。批量 grind 时这一步
   * 几乎必然踩空。clicktext 在**同一次 Runtime.evaluate** 里
   * 定位 → scrollIntoView → 重算 rect → 回传坐标，再由 CDP 派发
   * 真实鼠标事件到那个坐标，坐标必然是当下的。
   * 用法：clicktext <文字> [--nth N] [--within <容器选择器>]
   */
  async clicktext() {
    // argv 里混着命令名与 flag 及其值，needle 取第一个既非 flag、
    // 也非纯数字、且不是命令名本身的参数
    const self = 'clicktext';
    const needle = String(argv.find(a => a !== self && a !== '--nth' && a !== '--within' && !/^\d+$/.test(a) && !a.startsWith('--')) || '');
    if (!needle) return console.error('用法: clicktext <文字> [--nth N] [--within <选择器>]');
    const nthIdx = (() => { const i = argv.indexOf('--nth'); return i >= 0 ? Number(argv[i + 1]) || 0 : 0; })();
    const within = (() => { const i = argv.indexOf('--within'); return i >= 0 ? argv[i + 1] : ''; })();
    const t = await requireLivePage();
    const js = `(() => {
      const n = ${JSON.stringify(needle)};
      const scope = ${JSON.stringify(within)} ? document.querySelector(${JSON.stringify(within)}) : document;
      if (!scope) return {ok:false, err:'容器没找到 ' + ${JSON.stringify(within)}};
      const cands = [...scope.querySelectorAll('button,[onclick],a,[role=button]')]
        .filter(el => (el.innerText||el.textContent||'').trim().indexOf(n) >= 0);
      if (!cands.length) return {ok:false, err:'没找到含「'+n+'」的可点元素'};
      const el = cands[${nthIdx}] || cands[0];
      const label = (el.innerText||'').trim().replace(/\\s+/g,' ').slice(0,40);
      el.scrollIntoView({ block:'center' });
      const r = el.getBoundingClientRect();
      const x = Math.round(r.left + r.width/2), y = Math.round(r.top + r.height/2);
      const top = document.elementFromPoint(x,y);
      return {ok:true, x, y, label,
        hit: top ? top.tagName+'.'+String(top.className).slice(0,40) : 'null',
        hitIsTarget: top === el || el.contains(top)};
    })()`;
    const r = await send(t.webSocketDebuggerUrl, 'Runtime.evaluate', { expression: js, returnByValue: true });
    const info = (r && r.result && r.result.value) || { ok: false, err: '定位失败' };
    if (!info.ok) { console.log(JSON.stringify(info, null, 2)); return; }
    await clickAt(t, info.x, info.y);
    await sleep(400);
    console.log('已点「' + info.label + '」@(' + info.x + ',' + info.y + ')，落点=' + info.hit + '，命中目标=' + info.hitIsTarget);
  },

  /**
   * clickat：按 find 报出的坐标点。
   * 为什么要有这条——这个游戏大量元素的 onclick 内嵌中文名册
   * （`toggleSectRegion('南疆')`、`travelToSectFromList('百花谷')`），
   * 选择器里必须带引号，PowerShell 5.1 会把引号吃掉，于是 find 能看见、
   * click 却点不着。本命令直接吃 find 输出的 x/y，中间不经过选择器。
   * 用法：clickat <x> <y>
   */
  async clickat() {
    const x = Number(argv[1]);
    const y = Number(argv[2]);
    if (!isFinite(x) || !isFinite(y)) return console.error('用法: clickat <x> <y>（坐标取自 find 的输出）');
    const t = await requireLivePage();
    // 先报落点是谁，避免"点了没反应"时不知道点到了什么
    const probe = await send(t.webSocketDebuggerUrl, 'Runtime.evaluate', {
      expression: `(()=>{const e=document.elementFromPoint(${x},${y});return e?e.tagName+'.'+String(e.className).slice(0,50)+' ['+(e.innerText||'').trim().replace(/\\s+/g,' ').slice(0,40)+']':'null'})()`,
      returnByValue: true,
    });
    const top = (probe && probe.result && probe.result.value) || '(读不到)';
    // 走 session 而非 send：带 confirm() 的按钮（如「尝试突破」）点下去会弹原生对话框，
    // 单发连接收不到 javascriptDialogOpening，页面就永久停等 → 后面连 eval 都超时。
    await clickAt(t, x, y);
    await sleep(400);
    console.log('已在 (' + x + ',' + y + ') 点击；该点最上层元素 = ' + top);
  },
  /**
   * type：像玩家一样往当前焦点里打字。
   * 为什么要有这条——建号页的「姓名」是纯文字输入，不给 type 就只能靠
   * evaluate 直接写 .value，那是 `FIX_NOTES.md:1273` 明令禁止的
   * 「evaluate 造物」，也违反 `强制规则.md` 的「UI 是真理」。
   * 这里派发真实的 Input.dispatchKeyEvent（含 keyDown/char/keyUp），
   * 走的是和玩家键盘完全同一条路，页面自己的 input 监听会正常触发。
   * 另 --enter 在打完字后回车。
   */
  async type() {
    const text = argv.slice(1).filter(a => a !== '--enter').join(' ');
    const pressEnter = argv.includes('--enter');
    const t = await requireLivePage();
    // 逐字符派发：keyDown → char → keyUp，与真实键盘事件序列一致
    for (const ch of String(text)) {
      await send(t.webSocketDebuggerUrl, 'Input.dispatchKeyEvent', { type: 'keyDown', text: ch, unmodifiedText: ch });
      await send(t.webSocketDebuggerUrl, 'Input.dispatchKeyEvent', { type: 'keyUp' });
      await sleep(25);
    }
    if (pressEnter) {
      await send(t.webSocketDebuggerUrl, 'Input.dispatchKeyEvent', { type: 'rawKeyDown', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, key: 'Enter', code: 'Enter' });
      await send(t.webSocketDebuggerUrl, 'Input.dispatchKeyEvent', { type: 'char', text: '\r' });
      await send(t.webSocketDebuggerUrl, 'Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, key: 'Enter', code: 'Enter' });
    }
    await sleep(200);
    // 回读实际落进输入框的值，让「打进去了没有」可核对
    const r = await send(t.webSocketDebuggerUrl, 'Runtime.evaluate', {
      expression: '(()=>{const a=document.activeElement;return a?((a.id||a.tagName)+"="+String(a.value!==undefined?a.value:(a.innerText||"")).slice(0,40)):"(无焦点)"})()',
      returnByValue: true,
    });
    console.log('已输入 ' + text.length + ' 字；焦点处 = ' + ((r && r.result && r.result.value) || '(读不到)'));
  },

  /**
   * mobile：切到手机视口（默认 390×844，iPhone 14 尺寸）。
   * 不加 --reset 就一直是窄屏，后续 shot/front 都在手机尺寸下跑。
   * 用途：这个游戏此前**没有任何窄屏验证手段**——布局里全是 flex + 固定宽度
   * （w-20 进度条、w-8 数值、w-14 标签、长中文描述），窄屏必然挤。
   */
  async mobile() {
    const reset = !!flag('reset', false);
    const w = Number(flag('width', 390));
    const h = Number(flag('height', 844));
    // 粘性：记到状态文件，后续每条命令自己重放（Emulation 覆盖是会话级的）
    writeViewport({ width: w, height: h, reset });
    const t = await getTarget();
    await sleep(700);
    const [r] = await session(t.webSocketDebuggerUrl, [
      { method: 'Runtime.evaluate', params: { expression: 'window.innerWidth + "x" + window.innerHeight' } },
    ], 10000);
    console.log(reset
      ? '已恢复默认视口：' + (r && r.result && r.result.value) + '（已记录，后续命令同样生效）'
      : '已切到手机视口 ' + w + '×' + h + ' → 实际 ' + (r && r.result && r.result.value) + '（已记录为粘性，后续命令自动沿用）');
  },

  /**
   * front：把页面切到前台并强制可见。
   *
   * ⚠️ 必读：headless Chrome 默认 document.visibilityState === 'hidden'，
   * 此时 requestAnimationFrame 永不触发——凡是走 rAF 的渲染
   * （如 global-utils.js 的 coalesceRender 合并器）在页面上看着"不刷新"，
   * 极易被误判成 UI bug。**下任何"界面没更新"的结论之前先跑这个。**
   * 我为此误判过一次：把状态栏 stale 报成了缺陷，实际代码完全正确。
   */
  async front() {
    const t = await getTarget();
    await session(t.webSocketDebuggerUrl, [
      { method: 'Page.bringToFront' },
      { method: 'Page.setWebLifecycleState', params: { state: 'active' } },
    ], 15000);
    await sleep(600);
    const [vis] = await session(t.webSocketDebuggerUrl, [
      { method: 'Runtime.evaluate', params: { expression: 'document.visibilityState + "|" + document.hidden' } },
    ], 15000);
    const v = (vis && vis.result && vis.result.value) || '';
    if (String(v).indexOf('visible') >= 0) {
      console.log('页面可见性：' + v + '  ✓ 可正常观察 rAF 渲染');
    } else {
      console.log('页面可见性：' + v + '  ★仍隐藏★');
      console.log('  rAF 队列不会触发，走 rAF 的渲染看着像"不刷新"。');
      console.log('  修法：关闭浏览器后用带防后台化参数的方式重开（launch 已内置该组参数，');
      console.log('        若你是复用旧实例，需先 stop 再 launch）。');
    }
  },

  /**
   * probe：一次性采集页面健康状况。
   * 这是查 bug 的主力命令——一次拿到存档键、角色状态、报错、DOM 健康度，
   * 避免反复注入单点探查（单点探查正是之前出错的根源）。
   */
  async probe() {
    const t = await requireLivePage();
    const js = `(() => {
      const o = {};
      // 1) localStorage 存档
      const ls = [];
      try { for (let i = 0; i < localStorage.length; i++) {
              const k = localStorage.key(i);
              ls.push(k + '=' + (localStorage.getItem(k) || '').length + 'B'); } }
      catch (e) { ls.push('读失败: ' + e.message); }
      o.存档键 = ls;
      // 2) 角色
      try {
        const c = window.currentCharData || {};
        const ds = window.discipleState;
        o.角色 = {
          姓名: c.name || c.charName, 所在地: c.location, 境界: c.realm, 层: c.layer,
          真元essence: c.essence, 历练tempering: c.tempering,
          真气qi: c.qi, 真气上限maxQi: c.maxQi, 精力: c.energy, 生命: c.health,
        };
        o.门派 = ds ? { isInSect: ds.isInSect, sectId: ds.sectId, rank: ds.rank,
                        rankName: ds.rankName, contribution: ds.contribution } : '(无 discipleState)';
      } catch (e) { o.角色 = '读失败: ' + e.message; }
      // 3) 落档状态
      try { const el = document.getElementById('continue-save-state');
            o.落档指示 = el ? (el.textContent || '(元素在但文字为空)') : '(无此元素)'; }
      catch (e) { o.落档指示 = '读失败: ' + e.message; }
      // 4) DOM 健康度：残留遮罩 / 不可见拦截层
      try {
        const ovs = [];
        document.querySelectorAll('.fixed.inset-0').forEach(function(el, i) {
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          ovs.push({ i, 可见: el.offsetParent !== null, display: cs.display,
                     visibility: cs.visibility, opacity: cs.opacity,
                     尺寸: Math.round(r.width) + 'x' + Math.round(r.height),
                     内容: (el.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 50) });
        });
        o.遮罩层 = ovs;
      } catch (e) { o.遮罩层 = '读失败: ' + e.message; }
      // 5) 当前面板
      try { const p = document.querySelector('.panel.active, [data-panel].active');
            o.当前面板 = p ? (p.id || p.getAttribute('data-panel')) : '(未识别)'; }
      catch (e) { o.当前面板 = '读失败: ' + e.message; }
      // 6) 可见文字长度
      try { o.可见文字长度 = document.body ? document.body.innerText.length : 0; } catch (e) {}
      return o;
    })()`;
    const r = await send(t.webSocketDebuggerUrl, 'Runtime.evaluate', { expression: js, returnByValue: true });
    const v = r && r.result && r.result.value;
    let obj;
    try { obj = typeof v === 'string' ? JSON.parse(v) : v; } catch { obj = { 解析失败: v }; }
    console.log(JSON.stringify(obj, null, 2));
  },

  async stop() {
    const list = await httpJson('/json/list');
    for (const t of list) {
      if (t.type === 'page') {
        try { await send(t.webSocketDebuggerUrl, 'Browser.close'); } catch {}
      }
    }
    console.log('已请求关闭浏览器');
  },
};

// ---------- 入口 ----------
if (!cmd || !commands[cmd]) {
  console.error('用法: node tools/playtest/cdp.mjs <' + Object.keys(commands).join('|') + '> [参数]');
  console.error('例: node tools/playtest/cdp.mjs launch');
  process.exit(1);
}

commands[cmd]().catch((e) => {
  console.error('【失败】' + e.message);
  process.exit(1);
});