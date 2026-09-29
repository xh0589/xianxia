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
 *   node tools/playtest/cdp.mjs find   <text>                按文字定位可点元素
 *   node tools/playtest/cdp.mjs logs   [--port 9222]          控制台错误
 *   node tools/playtest/cdp.mjs stop   [--port 9222]
 *
 * 关键设计：
 *   - eval 一律包 try/catch，异常作为 {__err} 返回，绝不让页面崩
 *   - 所有命令都先确认页面存在（about:blank 直接报错而非乱操作）
 *   - 每次调用都是独立进程 → 天然幂等，崩了不影响下一次
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
    for (const type of ['mousePressed', 'mouseReleased']) {
      await send(t.webSocketDebuggerUrl, 'Input.dispatchMouseEvent', {
        type, x: info.x, y: info.y, button: 'left', clickCount: 1,
      });
    }
    await sleep(500);
    console.log(JSON.stringify(info, null, 2));
  },

  /** find：按可见文字找可点元素，报出稳定选择器 */
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