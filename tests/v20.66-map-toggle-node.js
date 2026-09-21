/**
 * v20.66-map-toggle-node.js — 地图标记开关 + 快捷键默认关闭：
 *   T1 路线/里数/位面注记收进 #world-overlay 图层，默认隐藏（图面清爽），按钮与设置勾选同步
 *   T2 开关翻转：舆图按钮 toggleMapOverlay、设置勾选 toggleMapOverlayFromSettings 走同一份偏好
 *      （localStorage xianxia_map_overlay），刷新页面（重读偏好）后状态不丢
 *   T3 快捷键默认关闭：字母键不再切面板；设置里打开后才生效；关掉又失效
 *   T4 Esc 是「取消」不是「快捷键」：不受开关影响，照旧关弹窗
 *   T5 源码/页面哨兵：设置面板两个开关键都在、默认不勾选；initSettings 会同步两者
 *
 * 运行：node tests/v20.66-map-toggle-node.js
 */
'use strict';

var fs = require('fs');
var vm = require('vm');
var path = require('path');
var ROOT = path.resolve(__dirname, '..');

var passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) passed++;
    else { failed++; console.error('[FAIL] ' + msg); }
}
function load(rel) {
    vm.runInThisContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), { filename: rel });
}

// ==================== DOM / 环境桩 ====================
global.window = global;
function makeEl(tag) {
    var el = {
        tagName: String(tag || 'div').toUpperCase(),
        style: {}, id: '', className: '', innerHTML: '', textContent: '', checked: false,
        children: [], _attrs: {},
        classList: {
            add: function () {}, remove: function () {},
            contains: function (c) { return String(el.className).split(' ').indexOf(c) >= 0; }
        },
        appendChild: function (c) { el.children.push(c); return c; },
        removeChild: function (c) { var i = el.children.indexOf(c); if (i >= 0) el.children.splice(i, 1); },
        setAttribute: function (k, v) {
            el._attrs[k] = v;
            if (k === 'id') el.id = v;
            if (k === 'class') el.className = v;
        },
        getAttribute: function (k) { return el._attrs[k] !== undefined ? el._attrs[k] : null; },
        addEventListener: function () {}, removeEventListener: function () {},
        remove: function () { el._removed = (el._removed || 0) + 1; },
        scrollIntoView: function () {},
        querySelector: function (sel) {
            var isId = sel.charAt(0) === '#';
            var want = sel.replace(/^[#.]/, '');
            function walk(node) {
                for (var i = 0; i < (node.children || []).length; i++) {
                    var c = node.children[i];
                    if (isId ? c.id === want : String(c.className || '').split(' ').indexOf(want) >= 0) return c;
                    var deep = walk(c);
                    if (deep) return deep;
                }
                return null;
            }
            return walk(el);
        },
        querySelectorAll: function () { return []; }
    };
    return el;
}
var els = {};
function reg(id, tag) { var e = makeEl(tag || 'div'); e.id = id; els[id] = e; return e; }
var svgMap = reg('world-map', 'svg');
var btnOverlay = reg('btn-map-overlay', 'button');
var cbOverlay = reg('setting-map-overlay', 'input');
var cbShortcuts = reg('setting-shortcuts', 'input');
reg('game-world', 'div');

var listeners = {};
var modalQuery = null;   // 测试 Esc 时临时给 document.querySelectorAll 塞弹窗
global.document = {
    readyState: 'complete',
    getElementById: function (id) { return els[id] || null; },
    querySelector: function () { return null; },
    querySelectorAll: function (sel) { return (modalQuery && sel === '.fixed.inset-0') ? [modalQuery] : []; },
    createElement: function (t) { return makeEl(t); },
    createElementNS: function (ns, t) { return makeEl(t); },
    addEventListener: function (type, fn) { (listeners[type] = listeners[type] || []).push(fn); },
    removeEventListener: function () {},
    body: makeEl('body')
};
var store = {};
global.localStorage = {
    getItem: function (k) { return store[k] !== undefined ? store[k] : null; },
    setItem: function (k, v) { store[k] = String(v); },
    removeItem: function (k) { delete store[k]; }
};
var messages = [];
global.showMessage = function (m, t) { messages.push({ msg: String(m), type: t || 'info' }); };
function hasMsg(kw) { return messages.some(function (m) { return m.msg.indexOf(kw) >= 0; }); }
global.timeSystem = { advanceTime: function () {}, onNewDaySubscribe: function () {} };
global.EventBus = { emit: function () {}, on: function () {} };
global.updateCharacterStatus = function () {};

load('js/regions.js');
load('js/map/world-map.js');
load('js/core/keyboard-shortcuts.js');

// ==================== T1 标注图层默认隐藏 ====================
console.log('\n[T1] 标注收进图层，默认关');
assert(global.WorldMap.overlayVisible() === false, '路线标记偏好默认关');
global.WorldMap.renderRoutes('world-map');
var overlay = svgMap.querySelector('#world-overlay');
assert(!!overlay, 'renderRoutes 建出 #world-overlay 图层');
assert(overlay.style.display === 'none', '默认关：图层隐藏');
var routeGs = overlay.children.filter(function (c) { return String(c.className).indexOf('world-route-g') >= 0; });
assert(routeGs.length === global.WorldMap.borders.length, '11 条关隘路线全在图层里（' + routeGs.length + '）');
var notes = overlay.children.filter(function (c) { return c.tagName === 'TEXT' && String(c.textContent).indexOf('位面') >= 0; });
assert(notes.length === 2, '灵界/魔界两条位面注记也在图层里');
assert(btnOverlay.textContent.indexOf('路线标记：关') >= 0, '舆图按钮文案显示「关」');
assert(cbOverlay.checked === false, '设置勾选同步为关');

// ==================== T2 开关翻转与持久化 ====================
console.log('\n[T2] 开关翻转');
messages.length = 0;
global.toggleMapOverlay();
assert(global.WorldMap.overlayVisible() === true, '点按钮开：偏好翻为开');
assert(overlay.style.display === '', '图层显示出来');
assert(store['xianxia_map_overlay'] === '1', '偏好落 localStorage');
assert(btnOverlay.textContent.indexOf('路线标记：开') >= 0, '按钮文案变「开」');
assert(btnOverlay.className.indexOf('yellow') >= 0, '开启态按钮高亮');
assert(cbOverlay.checked === true, '设置勾选跟着变开');
assert(hasMsg('路线标记已开'), '开启有提示');

global.toggleMapOverlay();
assert(global.WorldMap.overlayVisible() === false && overlay.style.display === 'none', '再点一下关回去');
assert(store['xianxia_map_overlay'] === '0', '关闭态也落盘');

// 设置面板里的开关键：勾上 → 生效
cbOverlay.checked = true;
global.toggleMapOverlayFromSettings();
assert(global.WorldMap.overlayVisible() === true && overlay.style.display === '', '设置勾选能开图层');

// 重进地图（refresh 走 applyOverlayVisibility）状态不丢
overlay.style.display = 'none';   // 模拟一次重渲染前的旧状态
global.WorldMap.refresh('world-map');
assert(overlay.style.display === '', 'refresh 按偏好恢复显示');
cbOverlay.checked = false;
global.WorldMap.refresh('world-map');
assert(global.WorldMap.overlayVisible() === true, 'refresh 不偷改偏好');
global.WorldMap.setOverlayVisible(false, true);

// ==================== T3 快捷键默认关闭 ====================
console.log('\n[T3] 快捷键默认关');
var onKeyDown = (listeners['keydown'] || [])[0];
assert(typeof onKeyDown === 'function', 'keydown 监听已挂上');
var panelCalls = [];
global.switchPanel = function (p) { panelCalls.push(p); };
function press(key, code) {
    var pd = 0;
    onKeyDown({ key: key, code: code || '', target: { tagName: 'DIV' }, preventDefault: function () { pd++; } });
    return pd;
}
assert(global.isShortcutsEnabled() === false, '快捷键偏好默认关');
press('m'); press('b'); press('c');
assert(panelCalls.length === 0, '默认关：字母键不切面板');
assert(cbShortcuts.checked === false, '设置勾选默认不勾');

// 设置里打开
cbShortcuts.checked = true;
messages.length = 0;
global.toggleShortcuts();
assert(global.isShortcutsEnabled() === true, '开关键打开后偏好为开');
assert(JSON.parse(store['xianxia_settings']).shortcutsEnabled === true, '偏好写进 xianxia_settings');
assert(hasMsg('快捷键已开启'), '开启有提示');
press('m', 'KeyM');
assert(panelCalls.length === 1 && panelCalls[0] === 'map', '开了之后 M 切地图');
press('q', 'KeyQ');
assert(panelCalls[1] === 'quests', 'Q 切任务');

// 再关掉
cbShortcuts.checked = false;
global.toggleShortcuts();
press('m');
assert(panelCalls.length === 2, '关掉后字母键又失效');

// 输入框内永不响应（开着也不行）
global.setShortcutsEnabled(true);
panelCalls.length = 0;
onKeyDown({ key: 'm', code: 'KeyM', target: { tagName: 'INPUT' }, preventDefault: function () {} });
assert(panelCalls.length === 0, '输入框内不响应');
global.setShortcutsEnabled(false);

// ==================== T4 Esc 不受开关影响 ====================
console.log('\n[T4] Esc 照旧');
modalQuery = makeEl('div');
press('Escape');
assert(modalQuery._removed === 1, '快捷键关着，Esc 也能关弹窗');
modalQuery = null;

// ==================== T5 页面/源码哨兵 ====================
console.log('\n[T5] 哨兵');
var html = fs.readFileSync(path.join(ROOT, '仙侠.html'), 'utf8');
assert(html.indexOf('id="btn-map-overlay"') >= 0 && html.indexOf('onclick="toggleMapOverlay()"') >= 0, '舆图上有路线标记按钮');
var scInput = html.slice(html.indexOf('id="setting-shortcuts"'), html.indexOf('id="setting-shortcuts"') + 200);
assert(scInput.indexOf('checked') < 0, '快捷键开关键默认不勾选');
var moInput = html.slice(html.indexOf('id="setting-map-overlay"'), html.indexOf('id="setting-map-overlay"') + 200);
assert(moInput.indexOf('onchange="toggleMapOverlayFromSettings()"') >= 0 && moInput.indexOf('checked') < 0, '地图标记开关键在设置里且默认不勾选');
var appSrc = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
var initFn = appSrc.slice(appSrc.indexOf('function initSettings('));
initFn = initFn.slice(0, initFn.indexOf('\n}') + 2);
assert(initFn.indexOf('syncShortcutsCheckbox') >= 0 && initFn.indexOf('applyOverlayVisibility') >= 0, 'initSettings 同步两个新开关');
var ksSrc = fs.readFileSync(path.join(ROOT, 'js/core/keyboard-shortcuts.js'), 'utf8');
assert(ksSrc.indexOf('_shortcutsEnabled()') < ksSrc.indexOf('SHORTCUTS[key]'), '快捷键闸门在字母键分发之前');
var escAt = ksSrc.indexOf("key === 'escape'"), gateAt = ksSrc.indexOf('if (!_shortcutsEnabled()) return;');
assert(escAt >= 0 && gateAt > escAt, 'Esc 分支在闸门之前（不受开关影响）');
var wmSrc = fs.readFileSync(path.join(ROOT, 'js/map/world-map.js'), 'utf8');
assert(wmSrc.indexOf('overlay.appendChild(g)') >= 0 && wmSrc.indexOf('overlay.appendChild(planeNote)') >= 0, '路线与位面注记都挂进图层');
assert(wmSrc.indexOf('svg.appendChild(planeNote)') < 0, '旧版直挂 svg 的注记已迁走');

console.log('\n========== 结果：' + passed + ' 通过 / ' + failed + ' 失败 ==========');
process.exit(failed ? 1 : 0);
