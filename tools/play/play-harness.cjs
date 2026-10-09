/**
 * ==================== 无头试玩机（玩家视角体检） ====================
 * 用宽容 DOM 桩把 315 个脚本按 scripts.manifest.json 的加载顺序全部拉起，
 * 然后像一个"啥都想体验"的玩家一样把能点的都点一遍：
 *   开机 → 创角 → 逐面板切换 → 修炼/采集/采矿/伐木/钓鱼 → 城市旅行 →
 *   30 天推进 → 各系统 UI 打开器 → 存读档 → 状态体检（NaN/负数/幽灵字段）
 * 每一步 try/catch，异常与 console.error/warn 全部落账。
 * 运行：node tools/play/play-harness.cjs [天数]
 * 只读试玩，不改任何游戏源码。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '../..');
const DAYS = parseInt(process.argv[2] || '30', 10);

// ---------- 落账 ----------
const LOAD_ERRORS = [];      // 脚本加载期异常
const BOOT_ERRORS = [];      // DOMContentLoaded 期异常
const UI_LOG = [];           // alert/confirm/prompt
const CONSOLE_NOISE = [];    // console.error/warn
const PLAY_ERRS = [];        // 试玩动作异常
const PLAY_LOG = [];         // 试玩动作成功流水

// ---------- DOM 宽容桩 ----------
function makeEl(tag, id) {
    const listeners = {};
    const el = {
        tagName: (tag || 'div').toUpperCase(), id: id || '', nodeName: (tag || 'div').toUpperCase(),
        nodeType: 1, value: '', checked: false, textContent: '', innerHTML: '', outerHTML: '',
        className: '', disabled: false, hidden: false, selected: false, href: '', src: '',
        offsetWidth: 100, offsetHeight: 30, clientWidth: 100, clientHeight: 30,
        scrollWidth: 100, scrollHeight: 100, scrollTop: 0, scrollLeft: 0,
        innerWidth: 100, innerHeight: 30,
        style: new Proxy({}, { get: (t, k) => (k in t ? t[k] : ''), set: (t, k, v) => { t[k] = v; return true; } }),
        classList: {
            _s: new Set(),
            add(...c) { c.forEach(x => this._s.add(x)); },
            remove(...c) { c.forEach(x => this._s.delete(x)); },
            toggle(c, f) { if (f === undefined) f = !this._s.has(c); f ? this._s.add(c) : this._s.delete(c); return f; },
            contains(c) { return this._s.has(c); }
        },
        dataset: {}, attributes: {}, children: [], childNodes: [], parentNode: null, parentElement: null,
        firstChild: null, lastChild: null, nextSibling: null, previousSibling: null,
        appendChild(c) { this.children.push(c); this.childNodes.push(c); if (c) c.parentNode = this; this.firstChild = this.children[0] || null; this.lastChild = this.children[this.children.length - 1] || null; return c; },
        removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) { this.children.splice(i, 1); this.childNodes.splice(i, 1); } return c; },
        insertBefore(c) { return this.appendChild(c); },
        remove() { if (this.parentNode) this.parentNode.removeChild(this); },
        setAttribute(k, v) { this.attributes[k] = String(v); if (k === 'id') this.id = String(v); },
        getAttribute(k) { return k in this.attributes ? this.attributes[k] : null; },
        removeAttribute(k) { delete this.attributes[k]; },
        hasAttribute(k) { return k in this.attributes; },
        addEventListener(t, f) { (listeners[t] = listeners[t] || []).push(f); },
        removeEventListener(t, f) { if (listeners[t]) listeners[t] = listeners[t].filter(x => x !== f); },
        dispatchEvent(e) { (listeners[e && e.type] || []).forEach(f => { try { f.call(this, e); } catch (err) { CONSOLE_NOISE.push(['dispatchEvent:' + (e && e.type), String(err && err.message)]); } }); return true; },
        click() { this.dispatchEvent({ type: 'click', target: this, preventDefault() {}, stopPropagation() {} }); },
        querySelector() { return makeEl('div'); },
        querySelectorAll(sel) { return specialQSA(sel); },
        getElementsByTagName() { return []; },
        getElementsByClassName() { return []; },
        closest() { return null; },
        focus() {}, blur() {}, scrollIntoView() {}, scrollTo() {},
        getBoundingClientRect() { return { top: 0, left: 0, right: 100, bottom: 30, width: 100, height: 30, x: 0, y: 0 }; },
        getContext() { return canvasCtx(); },
        insertAdjacentHTML() {}, insertAdjacentElement() {},
        contains() { return false; },
        cloneNode() { return makeEl(tag, id); },
        animate() { return { finished: Promise.resolve(), cancel() {}, onfinish: null }; },
        _listeners: listeners
    };
    return el;
}
function canvasCtx() {
    const noop = () => {};
    return new Proxy({}, {
        get: (t, k) => {
            if (k === 'measureText') return () => ({ width: 10 });
            if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => ({ addColorStop: noop });
            if (k === 'getImageData') return () => ({ data: [] });
            if (k === 'canvas') return { width: 100, height: 100 };
            if (typeof k === 'string' && /^(fillStyle|strokeStyle|font|lineWidth|globalAlpha|textAlign|textBaseline)$/.test(k)) return t[k];
            return noop;
        },
        set: (t, k, v) => { t[k] = v; return true; }
    });
}

// 特殊 querySelectorAll：创角属性输入框（generateAttributeInputs 靠 innerHTML 生成，桩里没有真子节点）
function specialQSA(sel) {
    const A = globalThis.__ATTRS;
    if (A && /input/.test(sel)) {
        let cat = null;
        if (sel.indexOf('main-attributes-container') >= 0) cat = 'main';
        else if (sel.indexOf('combat-skills-container') >= 0) cat = 'combat';
        else if (sel.indexOf('life-skills-container') >= 0) cat = 'life';
        if (cat && A[cat]) {
            return A[cat].map(name => { const i = makeEl('input'); i.dataset.attr = name; i.value = '10'; return i; });
        }
    }
    return [];
}

const elCache = {};
const docListeners = {};
const documentMock = {
    readyState: 'loading', title: '仙路长青', hidden: false, visibilityState: 'visible',
    cookie: '', domain: 'localhost', referrer: '',
    getElementById(id) { if (!elCache[id]) elCache[id] = makeEl('div', id); return elCache[id]; },
    querySelector(sel) { return makeEl('div'); },
    querySelectorAll(sel) { return specialQSA(sel); },
    createElement(t) { return makeEl(t); },
    createElementNS(ns, t) { return makeEl(t); },
    createTextNode(t) { return { nodeType: 3, textContent: String(t) }; },
    createDocumentFragment() { return makeEl('#fragment'); },
    addEventListener(t, f) { (docListeners[t] = docListeners[t] || []).push(f); },
    removeEventListener(t, f) { if (docListeners[t]) docListeners[t] = docListeners[t].filter(x => x !== f); },
    dispatchEvent(e) { (docListeners[e && e.type] || []).forEach(f => { try { f(e); } catch (err) { BOOT_ERRORS.push([String(e && e.type), String(err && err.stack || err).split('\n').slice(0, 3).join(' | ')]); } }); return true; },
    execCommand() { return false; },
    getSelection() { return { removeAllRanges() {}, addRange() {}, toString: () => '' }; },
    activeElement: null,
    currentScript: Object.assign(makeEl('script'), { src: '' })
};
documentMock.body = makeEl('body');
documentMock.head = makeEl('head');
documentMock.documentElement = makeEl('html');
documentMock.activeElement = documentMock.body;

const storageMock = {
    _s: {},
    getItem(k) { return k in this._s ? this._s[k] : null; },
    setItem(k, v) { this._s[String(k)] = String(v); },
    removeItem(k) { delete this._s[String(k)]; },
    clear() { this._s = {}; },
    key(i) { return Object.keys(this._s)[i] || null; },
    get length() { return Object.keys(this._s).length; }
};

// ---------- 全局 window 环境 ----------
globalThis.window = globalThis;
globalThis.document = documentMock;
globalThis.localStorage = storageMock;
globalThis.sessionStorage = { _s: {}, getItem(k) { return this._s[k] || null; }, setItem(k, v) { this._s[k] = String(v); }, removeItem(k) { delete this._s[k]; } };
Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'Mozilla/5.0 (play-harness)', language: 'zh-CN', platform: 'Linux x86_64', onLine: true, clipboard: { writeText: () => Promise.resolve() } }, writable: true, configurable: true });
globalThis.location = { href: 'http://127.0.0.1:8000/', protocol: 'http:', host: '127.0.0.1:8000', hostname: '127.0.0.1', port: '8000', pathname: '/', search: '', hash: '', origin: 'http://127.0.0.1:8000', reload() {}, assign() {}, replace() {} };
globalThis.history = { pushState() {}, replaceState() {}, back() {}, forward() {}, state: null, length: 1 };
globalThis.screen = { width: 1920, height: 1080, availWidth: 1920, availHeight: 1080 };
globalThis.innerWidth = 1920; globalThis.innerHeight = 1080;
globalThis.outerWidth = 1920; globalThis.outerHeight = 1080;
globalThis.devicePixelRatio = 1;
globalThis.scrollX = 0; globalThis.scrollY = 0; globalThis.pageXOffset = 0; globalThis.pageYOffset = 0;
globalThis.alert = m => UI_LOG.push(['alert', String(m).slice(0, 200)]);
globalThis.confirm = m => { UI_LOG.push(['confirm', String(m).slice(0, 200)]); return true; };
globalThis.prompt = m => { UI_LOG.push(['prompt', String(m).slice(0, 200)]); return null; };
globalThis.matchMedia = () => ({ matches: false, media: '', addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
globalThis.getComputedStyle = () => ({ getPropertyValue: () => '', setProperty() {} });
globalThis.requestAnimationFrame = () => 0;   // 从不回调：动画帧里的死循环烧不到试玩机
globalThis.cancelAnimationFrame = () => {};
globalThis.scrollTo = () => {}; globalThis.scrollBy = () => {};
globalThis.getSelection = () => documentMock.getSelection();
globalThis.MutationObserver = class { observe() {} disconnect() {} takeRecords() { return []; } };
globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
globalThis.IntersectionObserver = class { constructor(cb) { this.cb = cb; } observe() {} unobserve() {} disconnect() {} };
globalThis.Event = class Event { constructor(t, o) { this.type = t; Object.assign(this, o || {}); } preventDefault() {} stopPropagation() {} };
globalThis.CustomEvent = class CustomEvent { constructor(t, o) { this.type = t; this.detail = (o || {}).detail; } preventDefault() {} stopPropagation() {} };
globalThis.Image = class { constructor() { this.style = {}; } set src(v) { this._src = v; if (this.onload) setTimeout(() => { try { this.onload(); } catch (e) {} }, 0); } get src() { return this._src; } };
globalThis.Audio = class { constructor() {} play() { return Promise.resolve(); } pause() {} load() {} canPlayType() { return ''; } addEventListener() {} };
globalThis.AudioContext = class { constructor() { this.state = 'running'; this.destination = {}; } createOscillator() { return { connect() {}, start() {}, stop() {}, frequency: { value: 0, setValueAtTime() {} }, type: '' }; } createGain() { return { connect() {}, gain: { value: 1, setValueAtTime() {}, linearRampToValueAtTime() {} } }; } resume() { return Promise.resolve(); } close() { return Promise.resolve(); } };
globalThis.webkitAudioContext = globalThis.AudioContext;
globalThis.speechSynthesis = { speak() {}, cancel() {}, pause() {}, resume() {}, getVoices: () => [], addEventListener() {} };
globalThis.fetch = () => Promise.reject(new Error('play-harness: offline'));
globalThis.XMLHttpRequest = class { open() {} send() {} setRequestHeader() {} addEventListener() {} };
globalThis.print = () => {};
const winListeners = {};
globalThis.addEventListener = (t, f) => { (winListeners[t] = winListeners[t] || []).push(f); };
globalThis.removeEventListener = (t, f) => { if (winListeners[t]) winListeners[t] = winListeners[t].filter(x => x !== f); };
globalThis.dispatchEvent = (e) => { (winListeners[e && e.type] || []).forEach(f => { try { f(e); } catch (err) { CONSOLE_NOISE.push(['window.dispatchEvent:' + (e && e.type), String(err && err.message).slice(0, 200)]); } }); return true; };
globalThis.__UI_LOG = UI_LOG;

const realWarn = console.warn.bind(console), realError = console.error.bind(console);
console.warn = (...a) => { CONSOLE_NOISE.push(['warn', a.map(String).join(' ').slice(0, 240)]); };
console.error = (...a) => { CONSOLE_NOISE.push(['error', a.map(String).join(' ').slice(0, 240)]); };
process.on('unhandledRejection', r => CONSOLE_NOISE.push(['unhandledRejection', String(r && r.message || r).slice(0, 240)]));

// ---------- 按 manifest 顺序加载全部脚本 ----------
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts.manifest.json'), 'utf8'));
const scripts = manifest.entries.filter(e => e.kind === 'script').map(e => e.src);
let loaded = 0;
for (const rel of scripts) {
    const file = path.join(ROOT, rel);
    let code;
    try { code = fs.readFileSync(file, 'utf8'); } catch (e) { LOAD_ERRORS.push([rel, '文件读不到: ' + e.message]); continue; }
    try { vm.runInThisContext(code, { filename: rel }); loaded++; }
    catch (e) { LOAD_ERRORS.push([rel, String(e && e.stack || e).split('\n').slice(0, 3).join(' | ')]); }
}
vm.runInThisContext('globalThis.__ATTRS = (typeof attributes !== "undefined") ? attributes : null;', { filename: 'harness:attrs' });

// ---------- 开机（DOMContentLoaded） ----------
documentMock.readyState = 'complete';
documentMock.dispatchEvent({ type: 'DOMContentLoaded' });

// ---------- 试玩驱动（跑在共享词法域里，能直呼顶层函数） ----------
const PANELS = ['character', 'skills', 'equipment', 'inventory', 'map', 'activities', 'quests',
    'beasts', 'party', 'house', 'factions', 'calendar', 'achievements', 'settings'];
const driver = `
(function () {
    var P = globalThis.__PLAY = { log: [], errs: [] };
    function step(name, fn) {
        try { var r = fn(); P.log.push([name, r === undefined ? '' : String(r).slice(0, 140)]); return r; }
        catch (e) { P.errs.push([name, String(e && e.stack || e).split('\\n').slice(0, 3).join(' | ')]); }
    }
    globalThis.__step = step;

    // —— 开机：创角进游戏 ——
    step('创角 startGame', function () {
        document.getElementById('char-name').value = '云游散人';
        if (typeof selectGender === 'function') selectGender('男');
        startGame();
        return (window.currentCharData && window.currentCharData.name) || '?';
    });

    // —— 每个主面板都切一遍 ——
    var PANELS = ${JSON.stringify(PANELS)};
    PANELS.forEach(function (id) { step('切面板 ' + id, function () { switchPanel(id); }); });

    // —— 各系统 UI 打开器（静态页面上真按钮）——
    ['openCodexPanel','openWorldJournalPanel','openCultivationUI','openCraftingUI','openEnhancementUI',
     'openJoinSectUI','openSectTaskUI','openBountyBoard','openDaoCompanionPanel','openDisciplePanel',
     'openFacilityUI','openTokenShelf','refreshWorldEventsPanel','showChoiceHistory','toggleMapOverlay',
     'expandInventory','toggleBatchSellMode','cycleSortOrder'].forEach(function (fnName) {
        step('点开 ' + fnName, function () {
            if (typeof window[fnName] !== 'function') throw new Error('函数不存在(按钮会空点)');
            window[fnName]();
        });
    });

    // —— 核心日常动作 ——
    step('打坐 startCultivation', function () { startCultivation(); });
    step('采药 gatherHerbs', function () { gatherHerbs(); });
    step('采矿 mineOre', function () { mineOre(); });
    step('伐木 chopWood', function () { chopWood(); });
    step('钓鱼 goFishing', function () { goFishing('river'); });

    // —— 城市旅行：把 mapData 里的城挨个走一遍（上限 10 座）——
    step('城市旅行', function () {
        var md = window.mapData || {}; var n = 0;
        Object.keys(md).forEach(function (region) {
            (md[region].cities || []).forEach(function (city) {
                if (n++ >= 10) return;
                try { selectCity(city, region); } catch (e) { P.errs.push(['selectCity ' + city, String(e && e.message || e).slice(0, 160)]); }
            });
        });
        return '走了' + Math.min(n, 10) + '座城';
    });

    // —— 时间推进 N 天（玩家肝日常：真打坐 cultivationMeditate，不是只开弹窗）——
    step('推进${DAYS}天', function () {
        var traj = [];
        var prevHp = null;
        for (var d = 0; d < ${DAYS}; d++) {
            try { advanceTime(1440, '试玩推进'); } catch (e) { P.errs.push(['advanceTime第' + d + '天', String(e && e.message || e).slice(0, 160)]); break; }
            var hpAfterDay = Math.round((window.currentCharData || {}).health);
            if (prevHp !== null && hpAfterDay < prevHp - 2) traj.push('日' + d + ':夜裡掉血 ' + prevHp + '→' + hpAfterDay);
            prevHp = hpAfterDay;
            try { cultivationMeditate('half'); } catch (e) { P.errs.push(['第' + d + '天打坐', String(e && e.message || e).slice(0, 160)]); }
            var hpAfterMed = Math.round((window.currentCharData || {}).health);
            if (hpAfterMed < hpAfterDay) traj.push('日' + d + ':打坐掉血 ' + hpAfterDay + '→' + hpAfterMed);
            if (d % 5 === 0) {
                var hpB = Math.round((window.currentCharData || {}).health);
                try { gatherHerbs(); } catch (e) { P.errs.push(['第' + d + '天采药', String(e && e.message || e).slice(0, 160)]); }
                var hpA = Math.round((window.currentCharData || {}).health);
                if (hpA < hpB) traj.push('日' + d + ':采药掉血 ' + hpB + '→' + hpA);
            }
        }
        var c = window.currentCharData || {};
        globalThis.__TRAJ = traj;
        return 'day=' + c.day + ' realm=' + c.realm + c.layer + '层 essence=' + (c.essence || 0) + ' | 掉血轨迹:' + (traj.slice(0, 12).join('，') || '无');
    });

    // —— 存档 → 篡改 → 读档回环（账真能还原吗）——
    step('存读档回环', function () {
        saveGame();
        var raw = localStorage.getItem('xianxia_saves');
        if (!raw) return '没找到档';
        var saves = JSON.parse(raw);
        var slot = Array.isArray(saves) ? saves[0] : (saves && saves.slots ? saves.slots[0] : saves);
        var data = slot && (slot.data || slot);
        var before = (window.currentCharData.essence || 0);
        var beforeStone = (window.currentCharData.spiritStones || 0);
        window.currentCharData.essence = before + 99999;
        window.currentCharData.spiritStones = 123456;
        loadSaveData(data);
        var c = window.currentCharData || {};
        var okE = (c.essence || 0) === before, okS = (c.spiritStones || 0) === beforeStone;
        return '真元 ' + before + '→' + (c.essence || 0) + (okE ? '✓' : '✗没还原') + ' | 灵石 ' + beforeStone + '→' + (c.spiritStones || 0) + (okS ? '✓' : '✗没还原');
    });

    // —— 状态体检：NaN / 负数 / 越界 ——
    step('状态体检', function () {
        var c = window.currentCharData || {}; var bad = [];
        Object.keys(c).forEach(function (k) {
            var v = c[k];
            if (typeof v === 'number' && (isNaN(v) || !isFinite(v))) bad.push(k + '=NaN');
        });
        ['health','energy','qi','mood'].forEach(function (k) {
            if (typeof c[k] === 'number' && c[k] < 0) bad.push(k + '=' + c[k] + '(负数)');
        });
        if (typeof c.spiritStones === 'number' && c.spiritStones < 0) bad.push('灵石=' + c.spiritStones + '(负数)');
        if (typeof c.copper === 'number' && c.copper < 0) bad.push('铜钱=' + c.copper + '(负数)');
        return bad.length ? bad.join('; ') : '干净';
    });

    // —— 诊断账：天数/修炼/心情 三本账对不对得上 ——
    step('诊断:时间账', function () {
        var c = window.currentCharData || {};
        var ts = window.timeSystem || {};
        var tsDay = (typeof ts.getCurrentDay === 'function') ? ts.getCurrentDay() : (ts.day !== undefined ? ts.day : '?');
        var gt = (typeof window.getGameTime === 'function') ? JSON.stringify(window.getGameTime()).slice(0, 120) : '无getGameTime';
        return 'charData.day=' + c.day + ' | timeSystem.day=' + tsDay + ' | ' + gt;
    });
    step('诊断:修炼账', function () {
        var c = window.currentCharData || {};
        var keys = Object.keys(c).filter(function (k) { return /exp|essence|cultiv|真元|level/i.test(k); });
        var s = keys.map(function (k) { return k + '=' + (typeof c[k] === 'object' ? JSON.stringify(c[k]).slice(0, 60) : c[k]); }).join(' ');
        var sk = window.currentSkills || {};
        return s + ' | 运功栏=' + JSON.stringify(Object.keys(sk).map(function (k) { return k + ':' + (sk[k] ? (sk[k].id || sk[k].name || 'obj') : 'null'); })).slice(0, 160);
    });
    step('诊断:心情账', function () {
        var c = window.currentCharData || {};
        var ms = window.MoodSystem || {};
        var extra = '';
        try { if (typeof ms.moodNow === 'function') extra = ' | MoodSystem:' + ms.moodNow() + '(' + (typeof ms.label === 'function' ? ms.label() : '?') + ') 打坐乘数=' + (typeof ms.cultivationMul === 'function' ? ms.cultivationMul() : '?'); } catch (e) { extra = ' | MoodSystem查询炸:' + e.message; }
        return 'mood=' + c.mood + '/' + (c.maxMood || 100) + ' energy=' + c.energy + ' health=' + c.health + extra;
    });
})();
`;
try { vm.runInThisContext(driver, { filename: 'harness:driver' }); }
catch (e) { PLAY_ERRS.push(['driver崩溃', String(e && e.stack || e).split('\n').slice(0, 4).join(' | ')]); }

// ---------- 汇总输出 ----------
const PLAY = globalThis.__PLAY || { log: [], errs: [] };
const out = {
    脚本加载: { 应载: scripts.length, 实载: loaded, 加载期异常: LOAD_ERRORS },
    开机异常: BOOT_ERRORS,
    动作异常: PLAY.errs.concat(PLAY_ERRS),
    动作流水: PLAY.log,
    弹窗: UI_LOG.slice(0, 40),
    console噪音: { 总数: CONSOLE_NOISE.length, 样本: CONSOLE_NOISE.slice(0, 60) },
    存档键: Object.keys(storageMock._s),
    角色快照: (() => { try { const c = globalThis.currentCharData || {}; return { name: c.name, day: c.day, realm: c.realm, layer: c.layer, exp: c.exp, hp: c.health, qi: c.qi, mood: c.mood, 灵石: c.spiritStones, 铜钱: c.copper, 位置: c.location }; } catch (e) { return '取不到:' + e.message; } })()
};
fs.writeFileSync(path.join(__dirname, 'play-report.json'), JSON.stringify(out, null, 1), 'utf8');
realError('\n==== 试玩汇总 ====');
console.info = (...a) => process.stdout.write(a.join(' ') + '\n');
process.stdout.write(`脚本 ${loaded}/${scripts.length} 加载成功；加载期异常 ${LOAD_ERRORS.length}；开机异常 ${BOOT_ERRORS.length}；动作异常 ${PLAY.errs.length + PLAY_ERRS.length}；console噪音 ${CONSOLE_NOISE.length}\n`);
process.stdout.write(`成功动作 ${PLAY.log.length} 步；弹窗 ${UI_LOG.length}；存档键 ${Object.keys(storageMock._s).length} 个\n`);
process.stdout.write('报告已写 tools/play/play-report.json\n');
process.exit(0);
