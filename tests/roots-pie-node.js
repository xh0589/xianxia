/**
 * roots-pie-node.js — v20.10 灵根饼图口径统一
 *
 * 覆盖：
 *   A pieRoots：任意输入精确 100 / 幂等 / 无数据兜底
 *   B guessRoots：三境界估算总和精确 100
 *   C haveChild 遗传：对抗 rng 300 胎全部精确 100（201 红叉根除）
 *   D normalizeRootPie 自愈：旧"总和 260 强度"就地归饼，已是饼不动
 *   E StateRegistry 读档自愈：旧档后代灵根 import 即归饼
 *   F 族谱面板：后代行显示主根+占比
 *   G 静态：削峰旧代码清除；app.js 匹配灵根文案如实换算
 *
 * 运行：node tests/roots-pie-node.js
 */
'use strict';

var path = require('path');
var fs = require('fs');
var vm = require('vm');

var passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) passed++;
    else { failed++; console.error('[FAIL] ' + msg); }
}

// 种子 rng 注入（可复现，且证明与随机源无关的守恒律）
var seed = 987654321;
function sRnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
var seededMath = Object.create(Math);
seededMath.random = sRnd;

var mockWindow = {
    EventBus: null, StateRegistry: null,
    showMessage: function () {}, showModal: function () {},
    console: { log: function () {} },
    Math: seededMath, JSON: JSON, Object: Object, Array: Array,
    document: { querySelector: function () { return null; } },
    timeSystem: { gameTime: { currentDay: 1 }, advanceTime: function () {} },
    currentCharData: null, discipleState: null, npcManager: null,
    setFlag: function () {},
    XianXia: { nameGenerator: null, personality16: null }
};
mockWindow._absDay = 1;
mockWindow.getAbsoluteDay = function () { return mockWindow._absDay; };
mockWindow.window = mockWindow;
mockWindow.global = mockWindow;

var ROOTS = ['metal', 'wood', 'water', 'fire', 'earth'];
function rootSum(r) { return ROOTS.reduce(function (a, k) { return a + (Number(r && r[k]) || 0); }, 0); }

var ctx = vm.createContext(mockWindow);
vm.runInContext(fs.readFileSync(path.resolve(__dirname, '..', 'js', 'core', 'event-bus.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.resolve(__dirname, '..', 'js', 'core', 'state-registry.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.resolve(__dirname, '..', 'js', 'npcs', 'npc-lineage.js'), 'utf8'), ctx);
mockWindow.EventBus = ctx.EventBus;
mockWindow.StateRegistry = ctx.StateRegistry;
mockWindow.NpcLineage = ctx.NpcLineage;
var NL = ctx.NpcLineage;

// npcManager mock
var npcList = [];
var nId = 0;
function makeNpc(opts) {
    nId++;
    var base = {
        id: 'n' + nId, name: 'NPC' + nId, gender: 'male', age: 30, location: '少林寺',
        affection: 100, contribution: 0,
        spiritualRoots: { metal: 40, wood: 25, water: 15, fire: 12, earth: 8 },
        mutatedRoots: { thunder: false, wind: false, ice: false },
        personality16: { mind: 0, energy: 0, nature: 0, tactics: 0, identity: 0 },
        combat: { realm: '炼气', layer: 1, skills: [] },
        setFlag: function (f) {}, hasFlag: function () { return false; }
    };
    for (var k in (opts || {})) base[k] = opts[k];
    npcList.push(base);
    return base;
}
mockWindow.npcManager = {
    getNPC: function (id) { return npcList.find(function (n) { return n.id === id; }) || null; },
    getAllNPCs: function () { return npcList.slice(); },
    addNPC: function (n) { npcList.push(n); return n; }
};

// ============ A: pieRoots ============
assert(rootSum(NL._pieRoots({ metal: 80, wood: 60, water: 50, fire: 40, earth: 30 })) === 100, 'A1 旧强度饼(260)归一精确 100');
assert(rootSum(NL._pieRoots({})) === 100, 'A2 无数据兜底成均衡饼 100');
assert(rootSum(NL._pieRoots(null)) === 100, 'A3 null 兜底 100');
var p1 = NL._pieRoots({ metal: 33, wood: 33, water: 34, fire: 0, earth: 0 });
var p2 = NL._pieRoots(p1);
assert(ROOTS.every(function (k) { return p1[k] === p2[k]; }), 'A4 幂等：饼再归不动');
assert(rootSum(NL._pieRoots({ metal: 100, wood: 0, water: 0, fire: 0, earth: 0 })) === 100 && NL._pieRoots({ metal: 100 }).metal === 100, 'A5 单灵根=占比100 保真');
assert(NL._pieRoots({ metal: 1, wood: 1, water: 1, fire: 1, earth: 1 }).metal === 20, 'A6 均衡饼各行 20');

// ============ B: guessRoots ============
['炼气', '筑基', '金丹'].forEach(function (realm) {
    assert(rootSum(NL._guessRoots({ combat: { realm: realm } })) === 100, 'B 估算 ' + realm + ' 总和 100');
});
assert(NL._guessRoots({ combat: { realm: '金丹' } }).metal > NL._guessRoots({ combat: { realm: '炼气' } }).metal, 'B4 境界越高主根越纯');

// ============ C: 遗传守恒（对抗 rng 300 胎） ============
// 三组极端父母：全零 / 双亲各自身兼双强根 / 旧口径超标饼
var extremes = [
    [{ metal: 0, wood: 0, water: 0, fire: 0, earth: 0 }, { metal: 0, wood: 0, water: 0, fire: 0, earth: 0 }],
    [{ metal: 90, wood: 0, water: 0, fire: 10, earth: 0 }, { metal: 10, wood: 0, water: 0, fire: 90, earth: 0 }],
    [{ metal: 80, wood: 60, water: 50, fire: 40, earth: 30 }, { metal: 30, wood: 40, water: 50, fire: 60, earth: 80 }]
];
var broke = 0, kidsAll = 0;
for (var e = 0; e < extremes.length; e++) {
    var fa = makeNpc({ spiritualRoots: extremes[e][0] });
    var mo = makeNpc({ spiritualRoots: extremes[e][1], gender: 'female' });
    var mr = NL.marry(fa.id, mo.id);
    assert(mr.ok === true, 'C marry 组' + e + ' 成 (reason=' + mr.reason + ')');
    for (var t = 0; t < 100; t++) {
        var kid = NL.haveChild(fa.id, mo.id);
        if (!kid) continue;
        kidsAll++;
        var s = rootSum(kid.spiritualRoots);
        var badRow = ROOTS.some(function (k) { return kid.spiritualRoots[k] < 0 || kid.spiritualRoots[k] > 100; });
        if (s !== 100 || badRow) broke++;
    }
}
assert(kidsAll >= 250, 'C1 300 胎掷骰产出充分（' + kidsAll + '）');
assert(broke === 0, 'C2 每胎总和精确 100 且单行∈[0,100]（违规 ' + broke + '/' + kidsAll + '）');
// 组2 特例：孩子应常在金/火上有大份额（父母强根遗传方向）
var g2kids = npcList.filter(function (n) { return n.lineage && n.lineage.parents && n.lineage.parents.length === 2; });
assert(g2kids.length > 0, 'C3 后代可经 lineage 找回');

// ============ D: normalizeRootPie 自愈 ============
var legacyNpc = { spiritualRoots: { metal: 80, wood: 60, water: 50, fire: 40, earth: 30 } };
NL.normalizeRootPie(legacyNpc);
assert(rootSum(legacyNpc.spiritualRoots) === 100, 'D1 旧强度(260)就地归饼');
var snapshot = JSON.stringify(legacyNpc.spiritualRoots);
NL.normalizeRootPie(legacyNpc);
assert(JSON.stringify(legacyNpc.spiritualRoots) === snapshot, 'D2 幂等：归过的饼不再动');
var evenNpc = { spiritualRoots: { metal: 20, wood: 20, water: 20, fire: 20, earth: 20 } };
NL.normalizeRootPie(evenNpc);
assert(evenNpc.spiritualRoots.metal === 20, 'D3 均衡饼原样保留');

// ============ E: 读档自愈 ============
// 造一对道侣生子后把后代灵根改回旧口径，模拟旧档，再走 StateRegistry import
var pf = makeNpc({ affection: 100 }), pm = makeNpc({ affection: 100, gender: 'female' });
NL.marry(pf.id, pm.id);
var kidE = null, guard = 0;
while (!kidE && guard++ < 400) kidE = NL.haveChild(pf.id, pm.id);
assert(!!kidE, 'E1 先造一个后代');
kidE.spiritualRoots = { metal: 70, wood: 55, water: 45, fire: 35, earth: 25 }; // 旧档：总和 230
var snapE = mockWindow.StateRegistry.exportAll();
assert(snapE.npcLineageIndex && rootSum(kidE.spiritualRoots) === 230, 'E2 快照含索引，此时仍是旧口径 230');
mockWindow.StateRegistry.importAll(snapE);
assert(rootSum(kidE.spiritualRoots) === 100, 'E3 import 即自愈归饼 100');

// ============ F: 族谱面板主根 ============
var html = NL.renderLineagePanel(pf.id);
assert(html.indexOf('族谱') >= 0 && html.indexOf('主根') >= 0 && html.indexOf('%') >= 0, 'F1 后代行带主根占比');

// ============ G: 静态 ============
var src = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'npcs', 'npc-lineage.js'), 'utf8');
assert(src.indexOf('total > 200') < 0 && src.indexOf('200 / total') < 0, 'G1 削峰旧算法清除');
assert(src.indexOf('总和恒 100') >= 0 || src.indexOf('总和精确 100') >= 0, 'G2 饼图口径有注释锚点');
var appSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'app.js'), 'utf8');
assert(appSrc.indexOf("匹配灵根+' + Math.round(val / 2)") >= 0, 'G3 匹配灵根文案如实换算加成');

console.log('roots-pie v20.10: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
