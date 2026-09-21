/**
 * v20.96-perf-node.js — 性能清账验收：
 *   Q1 脚本缓加载：251 个脚本全部 defer，解析不再被串行阻塞；顺序保持、兜底脚本仍最先
 *   Q2 渲染刹车：四张整屏面板（背包/货币/角色/战斗）一帧合并成一次；无 rAF 环境直调不变
 *   Q3 跨日日志合批：连过 N 天只汇总一条，不再一天刷一条
 *   Q4 旧账不清：战斗日志封顶（v20.94）与队伍战报封顶仍在
 *
 * 运行：node tests/v20.96-perf-node.js
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

// ==================== Q1 脚本缓加载 ====================
console.log('\n[Q1] 251 个脚本全部 defer');
(function () {
    var html = loadScript('仙侠.html');
    var all = (html.match(/<script [^>]*src=/g) || []).length;
    var deferred = (html.match(/<script defer src=/g) || []).length;
    ok(all > 0 && all === deferred, 'Q1 外部脚本个个带 defer（' + deferred + '/' + all + '）');
    ok(html.indexOf('<script src=') < 0, 'Q1 不该有不带 defer 的外部脚本');
    // 顺序保持：兜底最先、数据在系统前、系统在接线前（抽查六对）
    var order = [
        ['js/core/error-guard.js', 'js/items.js'],
        ['js/items.js', 'js/items-extended.js'],
        ['js/items-extended/17-lead-tokens.js', 'js/items-extended/18-grade-expansion.js'],
        ['js/equipment.js', 'js/qin-arts.js'],
        ['js/qin-arts.js', 'js/city-facilities/facility-qin-venue.js'],
        ['js/sects/sects-system.js', 'js/sects/sect-facilities.js']
    ];
    order.forEach(function (pair) {
        var a = html.indexOf(pair[0]), b = html.indexOf(pair[1]);
        ok(a >= 0 && b >= 0 && a < b, 'Q1 加载序保持：' + pair[0] + ' 在 ' + pair[1] + ' 之前');
    });
    // 第八十二波·FIX-02：内联 tailwind 配置块已删（defer 时序下从没生效过，冷启动必抛 ReferenceError）——内联脚本归零
    var inline = (html.match(/<script>/g) || []).length;
    ok(inline === 0, 'Q1 内联脚本应为零枚——tailwind 配置块已删（实得 ' + inline + '）');
    // DOMContentLoaded 初始化口径不破：defer 脚本求值完才轮到 DCL，app.js 的注释口径仍然成立
    ok(/DOMContentLoaded 发生时所有 classic script 已完成求值/.test(loadScript('js/app.js')), 'Q1 初始化口径注释仍在（defer 语义与之一致）');
})();

// ==================== Q2 渲染刹车 ====================
console.log('\n[Q2] 一帧只画一次');
(function () {
    // 带 rAF 的世界桩：验证合帧
    var W = {
        console: { log: function () {}, warn: function () {}, error: function () {} },
        setTimeout: function () { return 0; },
        localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
        document: { createElement: function () { return { style: {}, classList: { add: function () {}, remove: function () {} }, dataset: {} }; }, getElementById: function () { return null; }, querySelector: function () { return null; }, querySelectorAll: function () { return []; }, addEventListener: function () {}, body: { appendChild: function () {} } },
        alert: function () {}
    };
    W.window = W;
    var frames = [];
    W.requestAnimationFrame = function (fn) { frames.push(fn); return frames.length; };
    vm.createContext(W);
    vm.runInContext(loadScript('js/global-utils.js'), W, { filename: 'global-utils.js' });
    ok(typeof W.coalesceRender === 'function' && typeof W.flushCoalescedRenders === 'function', 'Q2 刹车与冲账两个闸口都该导出');
    var drew = { inventory: 0, currency: 0 };
    function drawInv() { drew.inventory++; }
    function drawCur() { drew.currency++; }
    // 同帧连喊六回背包、三回货币——一帧结算后各只画一次
    for (var i = 0; i < 6; i++) W.coalesceRender('inventory', drawInv);
    for (var j = 0; j < 3; j++) W.coalesceRender('currency', drawCur);
    ok(frames.length === 1, 'Q2 同帧多次呼叫只该排一帧（实排 ' + frames.length + '）');
    ok(drew.inventory === 0 && drew.currency === 0, 'Q2 帧未到不提前画');
    frames[0]();
    ok(drew.inventory === 1 && drew.currency === 1, 'Q2 一帧结算各画一次（实画 ' + drew.inventory + '/' + drew.currency + '）');
    // 下一帧再喊再画
    W.coalesceRender('inventory', drawInv);
    frames[1]();
    ok(drew.inventory === 2, 'Q2 新帧新账');
    // 冲账：攒着的立刻画掉
    W.coalesceRender('currency', drawCur);
    W.flushCoalescedRenders();
    ok(drew.currency === 2, 'Q2 冲账该把攒下的立刻画掉');
    // 一帧里后喊的盖先喊的（同名同函数，画的是最新状态）
    var v1 = 0, v2 = 0;
    W.coalesceRender('k', function () { v1++; });
    W.coalesceRender('k', function () { v2++; });
    W.flushCoalescedRenders();
    ok(v1 === 0 && v2 === 1, 'Q2 同名后账盖前账（画面永远是最新状态）');

    // 无 rAF 环境（node 测试桩）：直调，行为与旧版一致
    var W2 = {
        console: W.console, setTimeout: W.setTimeout, localStorage: W.localStorage, document: W.document, alert: function () {}
    };
    W2.window = W2;
    vm.createContext(W2);
    vm.runInContext(loadScript('js/global-utils.js'), W2, { filename: 'global-utils.js' });
    var direct = 0;
    W2.coalesceRender('x', function () { direct++; });
    ok(direct === 1, 'Q2 无 rAF 环境该直调（测试桩行为不变）');

    // 四张热面板都上了刹车
    var invSrc = loadScript('js/inventory.js');
    ok(/function updateInventoryUI\(\) \{\s*\n\s*if \(typeof window\.coalesceRender === 'function'\) window\.coalesceRender\('inventory'/.test(invSrc), 'Q2 背包面板上刹车');
    ok(/window\.coalesceRender\('currency', _updateCurrencyUIImpl\)/.test(invSrc), 'Q2 货币面板上刹车');
    var appSrc = loadScript('js/app.js');
    ok(/window\.coalesceRender\('charstatus', _updateCharacterStatusImpl\)/.test(appSrc), 'Q2 角色面板上刹车');
    ok(/window\.coalesceRender\('battle', _updateBattleUIImpl\)/.test(appSrc), 'Q2 战斗面板上刹车');
    // 对外名字一个没变（234 处调用点零改动）
    ok((invSrc.match(/function _updateInventoryUIImpl\(\)/) || []).length === 1 && /window\.updateInventoryUI = updateInventoryUI/.test(invSrc), 'Q2 背包对外名不变');
    ok((appSrc.match(/function _updateCharacterStatusImpl\(\)/) || []).length === 1, 'Q2 角色面板对外名不变');
    ok((appSrc.match(/function _updateBattleUIImpl\(\)/) || []).length === 1, 'Q2 战斗面板对外名不变');
})();

// ==================== Q3 跨日日志合批 ====================
console.log('\n[Q3] 连过三十天不刷三十条');
(function () {
    var tsSrc = loadScript('js/time-system.js');
    ok(/连过 ' \+ \(newDay - _dayFrom\) \+ ' 天/.test(tsSrc), 'Q3 跨日循环该整跳汇总一条');
    ok(!/console\.log\('新的一天开始了！第' \+ oldDay/.test(tsSrc), 'Q3 逐日刷屏的旧日志该退役');
    ok(/for \(var _d = gameTime\.currentDay \+ 1; _d <= newDay; _d\+\+\)/.test(tsSrc), 'Q3 逐日 onNewDay 语义原样保留（F-10 的账不动，只省日志）');
})();

// ==================== Q4 旧账不清 ====================
console.log('\n[Q4] 此前的封顶还在');
(function () {
    var appSrc = loadScript('js/app.js');
    ok(/BATTLE_LOG_MAX = 200/.test(appSrc) && /slice\(-BATTLE_LOG_MAX\)/.test(appSrc), 'Q4 战斗日志 200 条封顶仍在');
    var partySrc = loadScript('js/party-system.js');
    ok(/battleLog\.length > 100/.test(partySrc), 'Q4 队伍战报封顶仍在');
    var glSrc = appSrc.slice(0, 2000);
    ok(/maxEntries: 100/.test(glSrc) && /children\.length > 20/.test(glSrc), 'Q4 全局日志账本 100 条、屏显 20 条的旧闸仍在');
})();

// ==================== 结果 ====================
console.log('\n========== v20.96 性能清账 ==========');
console.log('通过 ' + passed + ' / 失败 ' + failed);
process.exit(failed ? 1 : 0);
