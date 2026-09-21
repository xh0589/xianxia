/**
 * v21.1-luck-attr-node.js — 气运升格主要属性验收：
 *   Q1 属性面板：气运行入「主要属性」栏（档位称号/说明/进度条），开面板即刷新（改过运不必重进存档）
 *   Q2 档位函数：六档称号边界精确（0/20/40/60/80/100）
 *   Q3 气运通电：奇遇触发率随气运缩放（0→×0.5，50→×1.0，100→×1.5），运行时双验
 *   Q4 口径一致：存档白名单早已带 luck（不改档结构）、面板与 HUD 同源读 currentCharData.luck
 *
 * 运行：node tests/v21.1-luck-attr-node.js
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

var appSrc = loadScript('js/app.js');

// ==================== Q1 属性面板接线 ====================
console.log('\n[Q1] 气运入主要属性栏');
(function () {
    ok(/function getLuckTier\(luck\)/.test(appSrc), 'Q1 档位函数该在 app.js 定义');
    ok(/function luckAttrRowHtml\(luck\)/.test(appSrc), 'Q1 属性行渲染函数该在 app.js 定义');
    ok(/function refreshLuckAttrRow\(\)/.test(appSrc), 'Q1 面板刷新入口该在 app.js 定义');
    ok(appSrc.indexOf('luckAttrRowHtml(charData.luck') >= 0, 'Q1 populateGameWorld 该把气运行画进主要属性栏');
    ok(/data-luck-row/.test(appSrc), 'Q1 气运行该带标记（刷新时能找到旧行）');
    var sp = appSrc.slice(appSrc.indexOf('function switchPanel'), appSrc.indexOf('function switchPanel') + 2500);
    ok(sp.indexOf("panelId === 'character'") >= 0 && sp.indexOf('refreshLuckAttrRow') >= 0, 'Q1 打开角色面板该刷新气运（随开随新）');
    ok(appSrc.indexOf('window.getLuckTier = getLuckTier') >= 0 && appSrc.indexOf('window.refreshLuckAttrRow = refreshLuckAttrRow') >= 0, 'Q1 档位与刷新该导出');
    // 行内文案：说明按钮 + 档位称号 + 进度条（从渲染函数源码验证）
    var row = appSrc.slice(appSrc.indexOf('function luckAttrRowHtml'), appSrc.indexOf('function refreshLuckAttrRow'));
    ok(row.indexOf('气运') >= 0 && row.indexOf('showTooltip') >= 0, 'Q1 气运行该有名字与说明按钮');
    ok(row.indexOf('getLuckTier(luck)') >= 0 && row.indexOf('bg-purple-500') >= 0, 'Q1 气运行该有档位称号与进度条');
    ok(row.indexOf('Math.round(luck)') >= 0, 'Q1 数值该取整显示');
})();

// ==================== Q2 档位边界 ====================
console.log('\n[Q2] 六档称号边界');
(function () {
    // 从 app.js 抽出 getLuckTier 单独跑（app.js 整体依赖 DOM，不能直接 vm）
    var m = appSrc.match(/function getLuckTier\(luck\) \{[\s\S]*?\n\}/);
    ok(!!m, 'Q2 档位函数该可抽取');
    var getLuckTier = eval('(' + m[0] + ')');
    ok(getLuckTier(0) === '天煞孤星' && getLuckTier(19) === '天煞孤星', 'Q2 0-19 该是天煞孤星');
    ok(getLuckTier(20) === '命途多舛' && getLuckTier(39) === '命途多舛', 'Q2 20-39 该是命途多舛');
    ok(getLuckTier(40) === '平顺之命' && getLuckTier(59) === '平顺之命', 'Q2 40-59 该是平顺之命（初始 50 落此档）');
    ok(getLuckTier(60) === '洪福渐至' && getLuckTier(79) === '洪福渐至', 'Q2 60-79 该是洪福渐至');
    ok(getLuckTier(80) === '紫气东来' && getLuckTier(99) === '紫气东来', 'Q2 80-99 该是紫气东来');
    ok(getLuckTier(100) === '天眷之人' && getLuckTier(150) === '天眷之人', 'Q2 100+ 该是天眷之人（上不封顶不破档）');
})();

// ==================== Q3 奇遇触发率随气运缩放 ====================
console.log('\n[Q3] 气运通电：机缘更勤');
(function () {
    // 复用 v20.94 世界桩的最小子集，跑真 qiyu-encounters.js
    var W = {
        console: { log: function () {}, warn: function () {}, error: function () {} },
        setTimeout: function (fn) { try { fn(); } catch (e) {} return 0; },
        localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
        document: {
            createElement: function () { return { style: {}, classList: { add: function () {}, remove: function () {} }, dataset: {}, innerHTML: '', remove: function () {} }; },
            getElementById: function () { return null; },
            querySelector: function () { return null; },
            querySelectorAll: function () { return []; },
            addEventListener: function () {},
            body: { appendChild: function () {} }
        },
        alert: function () {}
    };
    W.window = W;
    var state = { modals: [] };
    W.timeSystem = { gameTime: { totalMinutes: 8 * 60, currentDay: 5 }, advanceTime: function () {}, onNewDaySubscribe: function () {} };
    W.gameLog = { add: function () {} };
    W.showMessage = function () {};
    W.showModal = function (t, b) { state.modals.push(String(t)); };
    W.getRealmTier = function () { return 3; };
    W.getCurrentCityName = function () { return '帝都·长安'; };
    W.EventBus = { on: function () {}, emit: function () {} };
    W.StateRegistry = { register: function () {} };
    W.updateCurrencyUI = function () {};
    W.updateCharacterStatus = function () {};
    var cd = {
        name: '测试客', realm: '筑基', layer: 5, location: '帝都·长安', gender: 'male',
        health: 100, maxHealth: 100, qi: 100, maxQi: 200, energy: 100, maxEnergy: 100,
        karma: 0, fame: 0, luck: 50, combatSkills: {}, lifeSkills: {}, bonds: {}
    };
    W.currentCharData = cd;
    W.inventory = { currency: { spiritStones: 500, copper: 500 }, slots: [] };
    W.currentEquipment = {};
    W.itemById = {};
    W.allItems = [];
    W.addItem = function () { return true; };
    W.getLifeSkill = function () { return 0; };
    W.getEquippedItem = function () { return null; };
    W.locationSystem = { getCurrentLocation: function () { return cd.location; } };
    vm.createContext(W);
    vm.runInContext(loadScript('js/extensions/qiyu-encounters.js'), W, { filename: 'qiyu-encounters.js' });
    var QE = W.QiyuEncounters;
    ok(!!QE && typeof QE.maybeTrigger === 'function', 'Q3 奇遇模块该照常加载（改动不破接口）');

    // 缩放公式：chance × (0.5 + luck/100)。city 基础 0.04：
    //   luck=0   → 0.02；luck=50 → 0.04；luck=100 → 0.06
    // rng 固定 0.05：气运 0/50 撞不上，气运 100 撞得上——同一颗骰子，命不同
    function roll(luck) {
        QE.state().done = {}; QE.state().lastDay = -99;
        cd.luck = luck;
        W.__qiyuRng = function () { return 0.05; };
        var before = state.modals.length;
        var q = QE.maybeTrigger('city');
        if (q) QE.choose(-1);   // 走开清 pending，不影响 done/lastDay 复位
        QE.state().done = {}; QE.state().lastDay = -99;
        return state.modals.length > before;
    }
    ok(roll(0) === false, 'Q3 天煞孤星（气运0）：0.05 的骰子该撞不上机缘（0.04×0.5=0.02）');
    ok(roll(50) === false, 'Q3 平顺之命（气运50）：口径不变（0.04×1.0），老档体验分毫不动');
    ok(roll(100) === true, 'Q3 天眷之人（气运100）：同一颗骰子该撞得上（0.04×1.5=0.06）');
    // 缺省口径：存档没有 luck 字段也不崩（视为 50）
    cd.luck = undefined;
    QE.state().done = {}; QE.state().lastDay = -99;
    W.__qiyuRng = function () { return 0.03; };
    var qDef = QE.maybeTrigger('city');
    ok(qDef !== undefined, 'Q3 luck 缺省该视为 50 不崩（0.03 < 0.04 照常触发）');
    if (qDef) QE.choose(-1);
})();

// ==================== Q4 口径一致 ====================
console.log('\n[Q4] 一处数值，处处同源');
(function () {
    var gs = loadScript('js/core/game-state.js');
    ok(gs.indexOf('luck: charData.luck') >= 0 && gs.indexOf('luck: n(saveData.luck, 50)') >= 0, 'Q4 存档白名单早已带 luck（本次不改档结构，旧档直接可读）');
    var div = loadScript('js/cultivation/divination.js');
    ok(div.indexOf('cd.luck') >= 0, 'Q4 占卜问命仍读同一份 luck');
    var cult = loadScript('js/cultivation/cultivation.js');
    ok(cult.indexOf('window.currentCharData.luck') >= 0, 'Q4 修炼页气运显示与新属性行同源（currentCharData.luck）');
    // 面板行不做二次持久化：refreshLuckAttrRow 只读不写
    var fn = appSrc.slice(appSrc.indexOf('function refreshLuckAttrRow'), appSrc.indexOf('window.getLuckTier'));
    ok(fn.indexOf('.luck =') < 0 && fn.indexOf('doAutoSave') < 0, 'Q4 刷新函数只读不写（不引入新状态）');
})();

// ==================== 结果 ====================
console.log('\n========== v21.1 气运升格主要属性 ==========');
console.log('通过 ' + passed + ' / 失败 ' + failed);
process.exit(failed ? 1 : 0);
