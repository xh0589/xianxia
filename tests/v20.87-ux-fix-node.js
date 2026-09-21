/**
 * v20.87-ux-fix-node.js — 体验层急救包门禁
 *
 * 覆盖：
 *   A 灵根滑块触屏化：pointer 事件 + 指针捕获，mouse 专属事件不再出现在滑块层
 *   B 页面骨架：viewport 允许双指缩放、滑块 touch-action、异常兜底脚本最先加载
 *   C 全局异常兜底：脚本错误/Promise 拒绝 → 玩家话术提示；节流防刷屏；资源 404 不打扰
 *   D 存档失败可见：手动档两处写入失败都有提示，不再静默吞掉
 *   E 定期自动存档开关是真的：关了就停、持久化、突破/飞升保底档不受影响、复选框回显
 *   F 设置页文案与实现一致：不再宣称「每5分钟」，onchange 接线
 *   G 灵气引导取消钮：清定时器再关窗（此前每取消一次泄漏一个 30ms 空转）
 *
 * 运行：node tests/v20.87-ux-fix-node.js
 */
'use strict';

var path = require('path');
var fs = require('fs');
var vm = require('vm');

var ROOT = path.resolve(__dirname, '..');
function loadScript(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

var passed = 0, failed = 0;
function ok(cond, label) {
    if (cond) passed++;
    else { failed++; console.log('[FAIL] ' + label); }
}

var html = loadScript('仙侠.html');
var appSrc = loadScript('js/app.js');
var guardSrc = loadScript('js/core/error-guard.js');
var autoSrc = loadScript('js/core/auto-save.js');
var qiSrc = loadScript('js/qi-environment.js');

// ============ A 滑块触屏化 ============
ok(appSrc.indexOf("handle.addEventListener('pointerdown'") >= 0, 'A 滑块按下改用 pointerdown');
ok(appSrc.indexOf("window.addEventListener('pointermove'") >= 0, 'A 滑块拖动改用 pointermove');
ok(appSrc.indexOf("window.addEventListener('pointerup'") >= 0, 'A 滑块松手改用 pointerup');
ok(appSrc.indexOf('setPointerCapture') >= 0, 'A 拖动加指针捕获（手指滑出滑块也不断）');
ok(appSrc.indexOf("handle.addEventListener('mousedown'") < 0 && appSrc.indexOf("window.addEventListener('mousemove'") < 0, 'A mouse 专属事件已从滑块层移除');

// ============ B 页面骨架 ============
ok(/name="viewport"[^>]*content="[^"]*initial-scale=1\.0"/.test(html) && html.indexOf('maximum-scale=1.0') < 0, 'B viewport 不再禁用双指缩放');
ok(html.indexOf('.slider-handle { touch-action: none; }') >= 0, 'B 滑块 touch-action:none（拖动不触发页面滚动）');
var iGuard = html.indexOf('js/core/error-guard.js');
var iUtils = html.indexOf('js/global-utils.js');
ok(iGuard > 0 && iGuard < iUtils, 'B 异常兜底脚本先于所有业务脚本加载');

// ============ C 全局异常兜底（真跑） ============
function makeGuardWorld() {
    var listeners = {};
    var toasts = [];
    var W = {
        console: { log: function () {}, warn: function () {}, error: function () {} },
        localStorage: { getItem: function () { return null; }, setItem: function () {} },
        addEventListener: function (type, fn) { (listeners[type] = listeners[type] || []).push(fn); },
        showMessage: function (t) { toasts.push(String(t)); }
    };
    W.window = W;
    vm.createContext(W);
    vm.runInContext(guardSrc, W, { filename: 'error-guard.js' });
    return { W: W, listeners: listeners, toasts: toasts };
}
var g = makeGuardWorld();
ok((g.listeners['error'] || []).length === 1 && (g.listeners['unhandledrejection'] || []).length === 1, 'C error 与 unhandledrejection 兜底都挂上了');
g.listeners['error'][0]({ target: g.W, message: 'boom', filename: 'http://x/js/app.js', lineno: 12, error: new Error('boom') });
ok(g.toasts.length === 1 && g.toasts[0].indexOf('app.js:12') >= 0 && g.toasts[0].indexOf('进度不受影响') >= 0, 'C 脚本错误 → 玩家话术提示（含出处，安抚进度）');
g.listeners['error'][0]({ target: g.W, message: 'boom', filename: 'http://x/js/app.js', lineno: 12, error: new Error('boom') });
ok(g.toasts.length === 1, 'C 同一错误 10 秒内只报一次（节流防刷屏）');
g.listeners['error'][0]({ target: g.W, message: 'other', filename: 'http://x/js/battle.js', lineno: 3, error: new Error('other') });
ok(g.toasts.length === 2, 'C 不同错误照常上报');
g.listeners['error'][0]({ target: { src: 'images/missing.png' } });
ok(g.toasts.length === 2, 'C 资源加载失败只记录不打扰玩家');
g.listeners['unhandledrejection'][0]({ reason: new Error('异步炸了') });
ok(g.toasts.length === 3 && g.toasts[2].indexOf('异步炸了') >= 0, 'C Promise 未处理拒绝也有提示');

// ============ D 存档失败可见 ============
ok(appSrc.indexOf("setItem('xianxia_save', JSON.stringify(saveData)); } catch (e) {}") < 0, 'D 手动档写入的空吞 catch 已移除');
var quotaHits = (appSrc.match(/存储空间可能已满/g) || []).length;
ok(quotaHits >= 2, 'D 两处存档写入失败都有「存储空间可能已满」提示（实得 ' + quotaHits + '）');
ok(/try \{\s*localStorage\.setItem\('xianxia_saves'/.test(appSrc), 'D 槽位表写入已包进 try/catch');

// ============ E 定期自动存档开关（真跑） ============
function makeAutoWorld(preOff) {
    var store = {};
    if (preOff) store['xianxia_autosave_off'] = '1';
    var dayNow = 0, saveCalls = 0, newDayCb = null, toasts = [];
    var checkbox = { checked: null };
    var W = {
        console: { log: function () {}, warn: function () {}, error: function () {} },
        localStorage: {
            getItem: function (k) { return store[k] !== undefined ? store[k] : null; },
            setItem: function (k, v) { store[k] = String(v); }
        },
        document: { getElementById: function (id) { return id === 'auto-save' ? checkbox : null; } },
        timeSystem: {
            onNewDaySubscribe: function (cb) { newDayCb = cb; },
            getAbsoluteDay: function () { return dayNow; }
        },
        saveGame: function () { saveCalls++; return { charName: '测试子', realm: '炼气', timestamp: 1000 + saveCalls, roots: {} }; },
        currentCharData: { name: '测试子', realm: '炼气' },   // doAutoSave 第一道门：没有角色不存
        showMessage: function (t) { toasts.push(String(t)); }
    };
    W.window = W;
    vm.createContext(W);
    vm.runInContext(autoSrc, W, { filename: 'auto-save.js' });
    return {
        W: W, store: store, toasts: toasts, checkbox: checkbox,
        setDay: function (d) { dayNow = d; },
        tick: function () { newDayCb(); },
        calls: function () { return saveCalls; }
    };
}
var a = makeAutoWorld(false);
ok(a.checkbox.checked === true, 'E 默认开启时复选框回显为勾上');
a.setDay(7); a.tick();
ok(a.calls() === 1 && JSON.parse(a.store['xianxia_auto_saves']).length === 1, 'E 第 7 游戏日定期档照存');
a.W.toggleAutoSave(false);
ok(a.store['xianxia_autosave_off'] === '1', 'E 关闭状态持久化');
a.setDay(14); a.tick();
ok(a.calls() === 1, 'E 关了之后定期档真的停（第 14 日不存）');
a.W.doAutoSave('breakthrough');
ok(a.calls() === 2, 'E 突破保底档不受开关影响（防崩底线永在）');
a.W.toggleAutoSave(true);
a.setDay(21); a.tick();
ok(a.calls() === 3, 'E 重新开启后定期档恢复');
var a2 = makeAutoWorld(true);
ok(a2.checkbox.checked === false, 'E 上次关过的玩家，复选框回显为不勾');

// ============ F 设置页文案 ============
ok(html.indexOf('每5分钟') < 0, 'F 假承诺「每5分钟」已从设置页移除');
ok(html.indexOf('定期自动存档（每 7 游戏日）') >= 0, 'F 文案改为与实现一致');
ok(html.indexOf('onchange="toggleAutoSave(this.checked)"') >= 0, 'F 复选框 onchange 接线');
ok(html.indexOf('突破、飞升、转世时另有保底存档') >= 0, 'F 保底档说明在开关下方');

// ============ G 灵气引导取消钮 ============
ok(qiSrc.indexOf('qi-guide-cancel') >= 0 && qiSrc.indexOf("onclick=\"this.closest('.fixed').remove()\"") < 0, 'G 取消钮不再是只删 DOM 的裸 onclick');
ok(/cancelBtn\.onclick = function\(\) \{\s*clearInterval\(timer\);\s*modal\.remove\(\);/.test(qiSrc), 'G 取消先清 30ms 定时器再关窗');

console.log('passed=' + passed + ' failed=' + failed);
process.exit(failed > 0 ? 1 : 0);
