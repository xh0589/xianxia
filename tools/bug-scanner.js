#!/usr/bin/env node
/**
 * bug-scanner.js — 无框架巨型库静态断链扫描器（v1.0 · 2026-10-04）
 *
 * 面向「仙路长青」这类全局变量接缝风格的纯 JS 工程（无模块系统、
 * defer 串行加载、文件间靠 window.* / 顶层 function 互通）。
 * 不需要 100% 准确率——只产出「疑似 BUG 的文件与行号」供人工快判。
 *
 * 用法：  node tools/bug-scanner.js [根目录]     （默认 .）
 * 输出：  控制台摘要 + tools/bug-report.txt 明细
 *
 * 检测维度（按置信度排）：
 *   [A] SCRIPT-MISSING   html 引用了不存在的 js 文件（必真）
 *   [B] EXPORT-UNDEF     window.X = X 且 X 在全部挂载文件中无定义（顶层炸断）
 *   [C] SUSPEND-CONSUMED 悬空文件（不在加载序列）导出的全局被挂载文件消费
 *   [D] CONSUME-GHOST    挂载文件消费 window.X，但 X 无任何挂载方定义（静默失联）
 *   [E] INLINE-UNBOUND   onclick="fn()" 内联处理器（含模板串里的）fn 未挂全局
 *   [F] DOM-ID-MISSING   getElementById('X') 字面量，X 不在 html id ∪ 模板 id ∪ 动态赋 id
 *   [G] DEAD-FILE        js/ 存在但未挂载（信息项：断链温床，对账用）
 *   [H] DUP-EXPORT       同名 window.X 多文件重复挂载（后覆盖先，提示性）
 *
 * 已知盲区（不追求覆盖，防误报优先）：
 *   - Object.assign(window, {...}) / globalThis['X'] 动态键（已尽力收但保不齐）
 *   - 字符串拼接的 id / 拼接函数名一律跳过（前缀拼接是合法模式）
 *   - 顶层 const/let 不进 window —— 消费点只认 var/function/显式 window.X =
 */

'use strict';
const fs = require('fs');
const path = require('path');

const JS_KW_SHARED = new Set(['if', 'else', 'return', 'undefined', 'typeof', 'for', 'while', 'switch', 'catch', 'void', 'new', 'function', 'var', 'let', 'const', 'do', 'try', 'window', 'document', 'this', 'event', 'true', 'false', 'null']);

// 浏览器原生 window.* —— 不是幽灵全局（白名单）
const BROWSER_BUILTINS = new Set(['addEventListener', 'removeEventListener', 'requestAnimationFrame', 'cancelAnimationFrame', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'localStorage', 'sessionStorage', 'scrollTo', 'scrollBy', 'scrollX', 'scrollY', 'pageXOffset', 'pageYOffset', 'innerWidth', 'innerHeight', 'outerWidth', 'outerHeight', 'devicePixelRatio', 'matchMedia', 'getComputedStyle', 'MutationObserver', 'ResizeObserver', 'IntersectionObserver', 'navigator', 'location', 'history', 'screen', 'performance', 'console', 'document', 'crypto', 'fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'Blob', 'File', 'FileReader', 'FormData', 'Headers', 'Request', 'Response', 'URL', 'URLSearchParams', 'DOMParser', 'XMLSerializer', 'AbortController', 'Image', 'Audio', 'Notification', 'Worker', 'SharedWorker', 'Intl', 'btoa', 'atob', 'alert', 'confirm', 'prompt', 'open', 'close', 'stop', 'print', 'focus', 'blur', 'getSelection', 'visualViewport', 'styleSheets', 'postMessage', 'dispatchEvent', 'CustomEvent', 'Event', 'ErrorEvent', 'Promise', 'queueMicrotask', 'structuredClone', 'reportError', 'onerror', 'self', 'top', 'parent', 'frames', 'frameElement', 'origin', 'isSecureContext']);

// ───────────────────── 工具：注释剥离（引号感知，保字符串） ─────────────────────
function stripComments(code) {
    // 1) 剥 /* */ 块注释：字符替空格、换行保留——行号与原文严格对齐（行号是本工具的命根）
    let s = code.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '));
    // 2) 行内 // ：单双引号奇偶感知（模板串里 http:// 不误伤）
    return s.split('\n').map(line => {
        let inS = false, inD = false, inT = false;
        for (let i = 0; i < line.length - 1; i++) {
            const c = line[i];
            if (c === "'" && !inD && !inT) inS = !inS;
            else if (c === '"' && !inS && !inT) inD = !inD;
            else if (c === '`' && !inS && !inD) inT = !inT;
            else if (c === '/' && line[i + 1] === '/' && !inS && !inD && !inT) {
                return line.slice(0, i);
            }
        }
        return line;
    }).join('\n');
}

// ───────────────────── 工具：行号定位（在原文里找 token 所在行） ─────────────────────
function lineOf(raw, idx) { return raw.slice(0, idx).split('\n').length; }

// ───────────────────── 采集单文件 ─────────────────────
function scanFile(fp) {
    const raw = fs.readFileSync(fp, 'utf8');
    const code = stripComments(raw);
    const f = {
        path: fp, raw,
        // 顶层（零缩进）定义 —— var/function/class 是全局接缝真源
        topDefs: new Map(),      // name -> line（顶层 function/var/class）
        winAssign: new Map(),    // name -> line（任意缩进 window.X = —— 运行时真挂载）
        winAlias: new Map(),     // name -> line（Object.assign(window,{X:..}) / globalThis.X =）
        consumes: new Map(),     // name -> [lines]（window.X 读访问：调用/取值/守卫）
        getsById: new Map(),     // id  -> [lines]（getElementById/querySelector('#X') 字面量）
        tplIds: new Map(),       // id  -> line（任意字符串里 id="X"——动态 DOM 真源）
        dynIdAssign: new Map(),  // id  -> line（.id = 'X' / setAttribute('id','X')）
        inlineFns: new Map(),   // fn  -> [lines]（onclick="fn(" 含模板串内——内联必走全局）
        iifeAliases: new Set(), // IIFE 形参名（对应 window 实参的 global/w 等）
    };

    // 顶层定义：零缩进的 function X / var X / class X（const/let 不进 window，不收）
    for (const m of code.matchAll(/^function\s+([A-Za-z_$][\w$]*)/gm)) f.topDefs.set(m[1], lineOf(code, m.index));
    for (const m of code.matchAll(/^var\s+([A-Za-z_$][\w$]*)/gm)) f.topDefs.set(m[1], lineOf(code, m.index));
    for (const m of code.matchAll(/^class\s+([A-Za-z_$][\w$]*)/gm)) f.topDefs.set(m[1], lineOf(code, m.index));

    // window.X = …（任意缩进；右侧形态后面统一判。同时记录行缩进供 [B] 顶层判定）
    for (const m of code.matchAll(/(?:^|[^.\w$])window\.([A-Za-z_$][\w$]*)\s*=\s*([^=][^\n;]{0,60})/g)) {
        f.winAssign.set(m[1], lineOf(code, m.index));
        f._assignRHS = f._assignRHS || new Map();
        const lineStart = code.lastIndexOf('\n', m.index) + 1;
        const indent = code.slice(lineStart, lineStart + 300).match(/^\s*/)[0].length;
        f._assignRHS.set(m[1], { rhs: m[2], indent });
    }
    // globalThis.X = / Object.assign(window, {X:
    for (const m of code.matchAll(/globalThis\.([A-Za-z_$][\w$]*)\s*=/g)) f.winAlias.set(m[1], lineOf(code, m.index));
    for (const m of code.matchAll(/Object\.assign\(\s*window\s*,\s*\{([\s\S]{0,400}?)\}/g)) {
        for (const n of m[1].matchAll(/([A-Za-z_$][\w$]*)\s*:/g)) f.winAlias.set(n[1], lineOf(code, m.index));
    }

    // —— IIFE 参数化挂载：`(function (global) { … global.X = … })(window)` ——
    // 184 个文件用这形态（state-registry 等）。把「对应 window 实参的形参名」
    // 的 aliasName.X = 也算 window 挂载。取参数首位配对实参首位（window）。
    const iifeHeads = [...code.matchAll(/\(\s*function\s*\(([^)()]*)\)\s*\{/g)]
        .filter(m => lineOf(code, m.index) === 0 || true);
    for (const m of iifeHeads) {
        const params = m[1].split(',').map(s => s.trim()).filter(Boolean);
        if (!params.length) continue;
        // 尾部实参判定（宽松近似）：})(window / })(typeof window / }(window / }, window)
        // —— UMD 兼容形态也算；全文级近似，防误报优先
        const tailCall = /\}\s*\)?\s*\(\s*(?:typeof\s+window|window\b|global\b|this\b)/.test(code)
            || /\}\s*,\s*window\s*\)/.test(code);
        if (tailCall && /^[A-Za-z_$][\w$]*$/.test(params[0])) {
            f.iifeAliases.add(params[0]);
        }
    }
    // —— 变量缩写挂载：`var W = window;` 后 `W.X = …` 同为 window 挂载 ——
    // 35 个文件用 W/WM/win 等短名缩写（sect-governance/qi-finale 等）。
    for (const m of code.matchAll(/(?:var|let|const)\s+([A-Za-z_$][\w$]*)\s*=\s*window\b/g)) {
        f.iifeAliases.add(m[1]);
    }
    for (const al of f.iifeAliases) {
        for (const m of code.matchAll(new RegExp('(?:^|[^.\\w$=(])' + al + '\\.([A-Za-z_$][\\w$]*)\\s*=(?!=)', 'g'))) {
            const name = m[1];
            if (!f.winAlias.has(name)) f.winAlias.set(name, lineOf(code, m.index));
        }
    }

    // window.X 消费（读）：调用 / 属性链 / 真值守卫
    // 注意：不能在正则里用 (?!\s*=) 排除赋值——贪婪回溯会把名字截短绕过前瞻。
    // 改为逐个匹配后按「匹配尾后原文」判定是否 = 赋值。
    for (const m of code.matchAll(/(?:^|[^.\w$=(])window\.([A-Za-z_$][\w$]*)/g)) {
        const after = code.slice(m.index + m[0].length, m.index + m[0].length + 4);
        if (/^\s*=(?!=)/.test(after)) continue; // 这是赋值行本体，不是消费
        const name = m[1];
        if (BROWSER_BUILTINS.has(name)) continue; // 原生 API 不是幽灵
        if (!f.consumes.has(name)) f.consumes.set(name, []);
        f.consumes.get(name).push(lineOf(code, m.index));
    }
    // IIFE 别名消费同样剔除（global.X 读——大多与 window.X 同名重复，忽略即可）

    // getElementById('X') / querySelector('#X') —— 仅字面量
    for (const m of code.matchAll(/getElementById\(\s*['"]([\w-]+)['"]\s*\)/g)) {
        if (!f.getsById.has(m[1])) f.getsById.set(m[1], []);
        f.getsById.get(m[1]).push(lineOf(code, m.index));
    }
    for (const m of code.matchAll(/querySelector\(\s*['"]#([\w-]+)['"]\s*\)/g)) {
        if (!f.getsById.has(m[1])) f.getsById.set(m[1], []);
        f.getsById.get(m[1]).push(lineOf(code, m.index));
    }

    // 字符串里的 id="X"（模板串/拼接 html——动态 DOM 真源，包括转义形态 id=\"X\"）
    for (const m of code.matchAll(/id=\\?["']([\w-]+)\\?["']/g)) f.tplIds.set(m[1], lineOf(code, m.index));
    // 动态赋 id：.id = 'X' / setAttribute('id', 'X') / 对象字面量 { id: 'X' }（Modal.open 体系）
    for (const m of code.matchAll(/\.id\s*=\s*['"]([\w-]+)['"]/g)) f.dynIdAssign.set(m[1], lineOf(code, m.index));
    for (const m of code.matchAll(/setAttribute\(\s*['"]id['"]\s*,\s*['"]([\w-]+)['"]/g)) f.dynIdAssign.set(m[1], lineOf(code, m.index));
    for (const m of code.matchAll(/\{\s*id:\s*['"]([\w-]+)['"]/g)) f.dynIdAssign.set(m[1], lineOf(code, m.index));

    // 内联处理器（含模板串）：onclick="fn(" 等 12 种事件
    // 复合表达式（onclick="if(x)fn()"）会误抓关键字——排除之
    const EV = 'onclick|oninput|onchange|onsubmit|onload|onerror|onfocus|onblur|onkeydown|onkeyup|onmousedown|onmouseup';
    const JS_KW = JS_KW_SHARED;
    const reInline = new RegExp(`(?:${EV})=\\\\?["']\\s*([A-Za-z_$][\\w$]*)\\s*\\(`, 'g'); // 分支必须 (?:…) 包住——裸 | 会拆出「onclick 独立分支」，捕获组恒 undefined（噪声真根）
    for (const m of code.matchAll(reInline)) {
        if (JS_KW.has(m[1])) continue;
        if (!f.inlineFns.has(m[1])) f.inlineFns.set(m[1], []);
        f.inlineFns.get(m[1]).push(lineOf(code, m.index));
    }
    return f;
}

// ───────────────────── 主流程 ─────────────────────
function main() {
    const root = path.resolve(process.argv[2] || '.');
    // 1) 找主 html（优先 仙侠.html，否则最大的 .html）
    let html = path.join(root, '仙侠.html');
    if (!fs.existsSync(html)) {
        const cands = fs.readdirSync(root).filter(x => x.endsWith('.html')).map(x => [x, fs.statSync(path.join(root, x)).size]);
        if (!cands.length) { console.error('未找到 .html'); process.exit(1); }
        cands.sort((a, b) => b[1] - a[1]); html = path.join(root, cands[0][0]);
    }
    const htmlRaw = fs.readFileSync(html, 'utf8');
    const htmlCode = stripComments(htmlRaw);
    const htmlIds = new Map(); // id -> line
    for (const m of htmlCode.matchAll(/id="([\w-]+)"/g)) htmlIds.set(m[1], lineOf(htmlRaw, m.index));

    // 挂载序列（保持加载顺序）
    const mounted = [...htmlCode.matchAll(/src="(js\/[^"]+)"/g)].map(m => m[1]).filter(p => fs.existsSync(path.join(root, p)));
    // [A] 引用缺文件
    const missingScripts = [...htmlCode.matchAll(/src="(js\/[^"]+)"/g)].map(m => m[1]).filter(p => !fs.existsSync(path.join(root, p)));

    // 悬空文件：js/ 全量 - 挂载
    const allJs = [];
    (function walk(d) {
        for (const e of fs.readdirSync(d, { withFileTypes: true })) {
            const p = path.join(d, e.name);
            if (e.isDirectory()) walk(p);
            else if (e.name.endsWith('.js')) allJs.push(path.relative(root, p).replace(/\\/g, '/'));
        }
    })(path.join(root, 'js'));
    const suspended = allJs.filter(p => !mounted.includes(p)).sort();

    // 2) 扫描全部文件（挂载+悬空都要：悬空文件是 [C] 的供方）
    const files = {};
    for (const p of [...mounted, ...suspended]) {
        try { files[p] = scanFile(path.join(root, p)); } catch (e) { /* 读不了的跳过 */ }
    }

    // 3) 全局定义集（挂载文件运行时可见：顶层 var/function + 显式 window./globalThis 挂载 + assign 别名）
    const definedGlobal = new Map(); // name -> 首个定义（文件:行）
    for (const p of mounted) {
        const f = files[p];
        for (const [n, l] of f.topDefs) if (!definedGlobal.has(n)) definedGlobal.set(n, `${p}:${l}`);
        for (const [n, l] of f.winAssign) if (!definedGlobal.has(n)) definedGlobal.set(n, `${p}:${l}(window=)`);
        for (const [n, l] of f.winAlias) if (!definedGlobal.has(n)) definedGlobal.set(n, `${p}:${l}(alias)`);
    }

    const R = []; // 报告行
    const rep = (lv, tag, loc, msg) => R.push(`[${lv}][${tag}] ${loc}  ${msg}`);

    // [A]
    for (const p of missingScripts) rep('必真', 'SCRIPT-MISSING', html, `引用的 ${p} 文件不存在`);
    // [G]
    for (const p of suspended) rep('信息', 'DEAD-FILE', p, `未进加载序列（${allJs.length - mounted.length}/${allJs.length} 悬空）`);

    // [B] EXPORT-UNDEF：顶层（零缩进）window.X = X 裸标识符，X 全局无定义
    // 只判顶层：函数内赋值 RHS 引用局部/闭包变量是合法形态，不算断链。
    const LITERALS = new Set(['null', 'true', 'false', 'undefined', 'this', 'window', 'document', 'Math', 'JSON', 'Date', 'globalThis', 'Infinity', 'NaN', 'self', 'top', 'parent', 'new', 'typeof', 'void', 'delete']);
    for (const p of mounted) {
        const f = files[p];
        if (!f._assignRHS) continue;
        if (/vendor\//.test(p)) continue; // vendor 压缩库：局部变量直挂 window 是正常打包形态
        for (const [n, v] of f._assignRHS) {
            if (v.indent > 0) continue;               // 函数内赋值：局部 RHS 合法
            const bare = v.rhs.match(/^\s*([A-Za-z_$][\w$]*)\s*[;,)]?\s*$/);
            if (!bare) continue;                       // = function/{/'/数字…：直挂值，不是符号引用
            if (LITERALS.has(bare[1])) continue;       // null/true/false 等字面量
            if (definedGlobal.has(bare[1])) continue;  // 跨文件全局定义 OK
            if (f.topDefs.has(bare[1])) continue;      // 本文件提升 OK
            rep('高', 'EXPORT-UNDEF', `${p}:${f.winAssign.get(n)}`, `window.${n} = ${bare[1]}，但符号 ${bare[1]} 全局无定义——该行抛 ReferenceError，此文件其后顶层语句全部静默失效`);
        }
    }

    // [C] SUSPEND-CONSUMED：悬空文件的导出被挂载文件消费
    const suspExports = new Map(); // name -> [悬空文件]
    for (const p of suspended) {
        const f = files[p];
        for (const n of f.winAssign.keys()) { if (!suspExports.has(n)) suspExports.set(n, []); if (!suspExports.get(n).includes(p)) suspExports.get(n).push(p); }
        for (const [n] of f.topDefs) { if (!suspExports.has(n)) suspExports.set(n, []); if (!suspExports.get(n).includes(p)) suspExports.get(n).push(p); }
    }
    for (const p of mounted) {
        const f = files[p];
        for (const [n, lines] of f.consumes) {
            if (suspExports.has(n) && !definedGlobal.has(n)) {
                rep('高', 'SUSPEND-CONSUMED', `${p}:${lines[0]}`, `消费 window.${n}，其唯一定义在悬空文件 ${suspExports.get(n).join('/')}（未加载）→ 运行时 undefined，功能静默失联`);
            }
        }
    }

    // [D] CONSUME-GHOST：挂载文件消费的全局，挂载方谁也没定义（悬空方也没定义）
    // 双档：typeof 守卫式 → 低（__scenarioRng 这类「可选注入点」也是守卫形态，
    // 设计 or 失联分不清，降档给人判）；直接调用/取值 → 中
    for (const p of mounted) {
        const f = files[p];
        for (const [n, lines] of f.consumes) {
            if (definedGlobal.has(n) || suspExports.has(n)) continue;
            const first = (f.raw.split('\n')[lines[0] - 1] || '');
            const guarded = /typeof\s+window\./.test(first);
            const lv = guarded ? '低' : '中';
            const note = guarded ? '（守卫式消费：可能是有意留的可选注入点）' : '';
            rep(lv, 'CONSUME-GHOST', `${p}:${lines[0]}`, `消费 window.${n}（${lines.length} 处）但全工程无定义——若非动态注入则是幽灵全局${note}`);
        }
    }

    // [E] INLINE-UNBOUND：内联 fn 未挂全局（html + 全部 js 模板里的 onclick 都收）
    const inlineAll = new Map(); // fn -> [来源…]
    // html 里 onclick="if(window.X)…" 是 TA 的守卫式合法写法——关键字同样排除
    for (const m of htmlCode.matchAll(/(?:onclick|oninput|onchange|onsubmit|onkeydown|onkeyup|onerror|onload|onfocus|onblur|onmousedown|onmouseup)="(\w+)\(/g)) {
        if (JS_KW_SHARED.has(m[1])) continue;
        if (!inlineAll.has(m[1])) inlineAll.set(m[1], []);
        inlineAll.get(m[1]).push(`${html}:${lineOf(htmlRaw, m.index)}`);
    }
    for (const p of mounted) {
        for (const [fn, lines] of files[p].inlineFns) {
            if (!inlineAll.has(fn)) inlineAll.set(fn, []);
            for (const l of lines) inlineAll.get(fn).push(`${p}:${l}`);
        }
    }
    for (const [fn, srcs] of inlineAll) {
        if (definedGlobal.has(fn) || suspExports.has(fn)) continue;
        rep('高', 'INLINE-UNBOUND', srcs[0], `内联 onclick 调 ${fn}()，但 ${fn} 未挂 window（点击必抛 fn is not defined）共 ${srcs.length} 处`);
    }

    // [F] DOM-ID-MISSING：字面量 getElementById 无 id 源
    const idSources = new Set(htmlIds.keys());
    for (const p of mounted) {
        for (const id of files[p].tplIds.keys()) idSources.add(id);
        for (const id of files[p].dynIdAssign.keys()) idSources.add(id);
    }
    for (const p of mounted) {
        const f = files[p];
        for (const [id, lines] of f.getsById) {
            if (idSources.has(id)) continue;
            rep('中', 'DOM-ID-MISSING', `${p}:${lines[0]}`, `getElementById('${id}') 字面量，但 id 无静态来源（非 html 非模板非动态赋值）`);
        }
    }

    // [H] DUP-EXPORT：多挂载文件重复 window.X =
    const dupMap = new Map();
    for (const p of mounted) for (const [n, l] of files[p].winAssign) {
        if (!dupMap.has(n)) dupMap.set(n, []);
        dupMap.get(n).push(`${p}:${l}`);
    }
    for (const [n, locs] of dupMap) if (locs.length > 1) {
        rep('低', 'DUP-EXPORT', locs[locs.length - 1], `window.${n} 被 ${locs.length} 个文件挂载（加载序后者覆盖前者）`);
    }

    // ───────── 输出 ─────────
    const byTag = {};
    for (const line of R) { const t = line.match(/\[.*\]\[([A-Z-]+)\]/)[1]; byTag[t] = (byTag[t] || 0) + 1; }
    const out = [];
    out.push(`# bug-scan ${new Date().toISOString().slice(0, 19)}  root=${root}`);
    out.push(`# 挂载 ${mounted.length} / 全量 ${allJs.length} 悬空 ${suspended.length} · html id ${htmlIds.size} · 内联 fn ${inlineAll.size}`);
    out.push('# 汇总：' + Object.entries(byTag).map(([k, v]) => `${k}=${v}`).join(' '));
    out.push('');
    // 排序：必真>高>中>低>信息
    const lvOrder = { '必真': 0, '高': 1, '中': 2, '低': 3, '信息': 4 };
    R.sort((a, b) => lvOrder[a.match(/\[(.*?)\]/)[1]] - lvOrder[b.match(/\[(.*?)\]/)[1]]);
    out.push(...R);
    const outFile = path.join(root, 'tools', 'bug-report.txt');
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, out.join('\n'), 'utf8');
    console.log(`扫描完成：${R.length} 条（去信息项 ${R.filter(x => !x.includes('[信息]')).length} 条疑似）`);
    console.log('明细 → ' + outFile);
    for (const [k, v] of Object.entries(byTag)) console.log(`  ${k.padEnd(16)} ${v}`);
}

main();
