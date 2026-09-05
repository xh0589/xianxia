/**
 * v20.12-bonds-node.js — 道侣/子嗣闭环修复
 *
 * 覆盖：
 *   A 双修情分阶梯：攒满 10 情分+好感≥80 升档（旧版 bond.level 永远升不过 1）
 *   B 好感不足不升档（情投意合才是道侣）
 *   C 死结终结端到端：双修升档 → 位分≥2 → haveChild 成功 → 诞育再增情分
 *   D 位分不足仍拒生（门槛没有被拆掉，只是变成了可够得着的）
 *   E 存档往返：bonds/children/killCount/collectionClaimed 入档、回灌、
 *     成就档案跨档读到道侣位分与子嗣数
 *   F 静态：三处接线齐备
 *
 * 运行：node tests/v20.12-bonds-node.js
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

var mockWindow = {
    console: { log: function () {}, warn: function () {} },
    JSON: JSON, Object: Object, Array: Array, Math: Math, Number: Number,
    isFinite: isFinite, Date: Date, String: String,
    gameLog: { entries: [], add: function () {} },
    showMessage: function () {},
    currentCharData: null, discipleState: null, currentSkills: {},
    timeSystem: {
        gameTime: { currentDay: 5 },
        advanceTime: function () {},
        onNewDaySubscribe: function () {}
    },
    getAbsoluteDay: function () { return 42; },
    localStorage: {
        _m: {},
        getItem: function (k) { return this._m[k] !== undefined ? this._m[k] : null; },
        setItem: function (k, v) { this._m[k] = String(v); },
        removeItem: function (k) { delete this._m[k]; }
    },
    document: { querySelector: function () { return null; }, querySelectorAll: function () { return []; } },
    stones: 500
};
mockWindow.DataManager = {
    deductSpiritStones: function (n) {
        if (mockWindow.stones < n) return false;
        mockWindow.stones -= n; return true;
    }
};
var npcMap = {};
mockWindow.npcManager = {
    getNPC: function (id) { return npcMap[id] || null; }
};
mockWindow.window = mockWindow;
mockWindow.global = mockWindow;

function mkNpc(id, name, aff) {
    npcMap[id] = {
        id: id, name: name,
        relationship: { affection: aff },
        changeAffection: function (d) { this.relationship.affection += d; }
    };
}
mkNpc('n1', '婉儿', 90);
mkNpc('n2', '阿禾', 40); // 15 次双修后好感 40+30=70，仍不到 80

var ctx = vm.createContext(mockWindow);
function load(rel) {
    vm.runInContext(fs.readFileSync(path.resolve(__dirname, '..', rel), 'utf8'), ctx);
}
load('js/core/event-bus.js');
mockWindow.EventBus = ctx.EventBus;
load('js/core/state-registry.js');
mockWindow.StateRegistry = ctx.StateRegistry;
load('js/core/game-state.js');
load('js/achievement-system.js');
load('js/sects/sects-system.js');
load('js/npcs/marriage-offspring.js');

assert(typeof mockWindow.dualCultivate === 'function', 'L1 双修入口就绪');
assert(typeof mockWindow.haveChild === 'function', 'L2 诞育入口就绪');
assert(mockWindow.GameState && typeof mockWindow.GameState.collectFullGameState === 'function', 'L3 存档系统就绪');

// ============ A: 双修情分阶梯 ============
mockWindow.currentCharData = {
    name: '我', energy: 999999, qi: 100, essence: 0,
    bonds: { n1: { type: 'dao_companion', name: '婉儿' } }
};
var bond1 = mockWindow.currentCharData.bonds.n1;
var okCount = 0;
for (var i = 0; i < 9; i++) if (mockWindow.dualCultivate('n1')) okCount++;
assert(okCount === 9, 'A1 双修前 9 次均成功');
assert(bond1.bondHeart === 9 && !bond1.level, 'A2 第 9 次：情分 9 未满，位分未升（不白送）');
assert(mockWindow.dualCultivate('n1') === true, 'A3 第 10 次双修成功');
assert(bond1.level === 2 && bond1.bondHeart === 0, 'A4 情分圆满升位分至 2（旧版此处永远到不了）');

// ============ B: 情投意合才升档 ============
mockWindow.currentCharData = {
    name: '我', energy: 999999, qi: 100,
    bonds: { n2: { type: 'dao_companion', name: '阿禾' } }
};
var bond2 = mockWindow.currentCharData.bonds.n2;
for (var i2 = 0; i2 < 15; i2++) mockWindow.dualCultivate('n2');
assert(!bond2.level && bond2.bondHeart === 15, 'B1 好感始终不足 80：情分攒过 10 也不升档，只往上涨');

// ============ D: 位分门槛仍在（先 D 后 C，C 会把 A 线推进） ============
mockWindow.currentCharData = {
    name: '我', _children: [],
    bonds: { n1: { type: 'dao_companion', name: '婉儿' } } // level 未升
};
assert(mockWindow.haveChild() === false, 'D1 位分不足（<2）仍拒生——门槛没拆，只是可够着了');

// ============ C: 死结终结端到端 ============
mockWindow.currentCharData = {
    name: '沈', gender: 'male', _children: [],
    bonds: { n1: { type: 'dao_companion', name: '婉儿', level: 2 } }
};
mockWindow.stones = 500;
assert(mockWindow.haveChild() === true, 'C1 位分 2 后诞育成功（旧版此路永不可达）');
assert(mockWindow.currentCharData._children.length === 1, 'C2 子嗣入列');
assert(mockWindow.stones === 300, 'C3 灵石 200 调养费真实扣减');
var cdBond = mockWindow.currentCharData.bonds.n1;
assert(cdBond.level === 3, 'C4 诞育增情分：位分 2→3');
// 上限 3 守卫
mockWindow.currentCharData._children = [{}, {}, {}];
assert(mockWindow.haveChild() === false, 'C5 子嗣上限 3 如实生效');

// ============ E: 存档往返 ============
mockWindow.currentCharData = {
    name: '沈', gender: 'male', realm: '筑基', layer: 3,
    essence: 10, tempering: 40, health: 90, qi: 80, energy: 70,
    spiritStones: 321, copper: 456, karma: 5, luck: 55,
    mainAttributes: {}, combatSkills: {}, lifeSkills: {},
    spiritualRoots: { metal: 20, wood: 20, water: 20, fire: 20, earth: 20 },
    _killCount: 7,
    _collectionClaimed: { skills10: true },
    bonds: { n1: { type: 'dao_companion', name: '婉儿', level: 3, bondHeart: 4 } },
    _children: [{ name: '沈婉灵', grown: false }]
};
var save = mockWindow.GameState.collectFullGameState();
assert(save && save.bonds && save.bonds.n1 && save.bonds.n1.level === 3, 'E1 道侣关系入档（含位分与情分）');
assert(save.bonds.n1.bondHeart === 4, 'E1b 情分进度也入档（升档进度不随重开档清零）');
assert(Array.isArray(save.children) && save.children.length === 1, 'E2 子嗣入档');
assert(save.killCount === 7 && save.collectionClaimed.skills10 === true, 'E3 击杀/收藏领奖记录入档（v20.11 字段回归）');
// 内存侧"重开档"模拟：全部清空
mockWindow.currentCharData.bonds = {};
mockWindow.currentCharData._children = [];
mockWindow.currentCharData._killCount = 0;
mockWindow.currentCharData._collectionClaimed = {};
mockWindow.GameState.applyFullGameState(save, {});
var rcd = mockWindow.currentCharData;
assert(rcd.bonds && rcd.bonds.n1 && rcd.bonds.n1.level === 3, 'E4 读档回道侣（旧版读档即除名）');
assert(rcd.bonds.n1.bondHeart === 4, 'E4b 情分进度跨档守恒');
assert(rcd._children.length === 1, 'E5 读档回子嗣');
assert(rcd._killCount === 7 && rcd._collectionClaimed.skills10 === true, 'E6 击杀/收藏领奖跨档守恒');
var prof = mockWindow.buildAchievementProfile();
assert(prof.daoBond === 3, 'E7 成就档案跨档读到道侣三档（上批"道侣类成就因断档不敢设"的根因已除）');
assert(prof.children === 1, 'E8 成就档案跨档读到子嗣数');
mockWindow.checkAchievementsNow();
var mgr = mockWindow.achievementManager;
assert(mgr.getAchievement('dao_join').isCompleted && mgr.getAchievement('dao_deep').isCompleted && mgr.getAchievement('child_first').isCompleted,
    'E9 道侣三成就经真实链路点亮（凤求凰/情深似海/血脉相承）');

// ============ F: 静态 ============
var ssSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'sects', 'sects-system.js'), 'utf8');
assert(ssSrc.indexOf('bond.bondHeart') >= 0 && ssSrc.indexOf('情分圆满') >= 0, 'F1 双修情分阶梯已接线');
var moSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'npcs', 'marriage-offspring.js'), 'utf8');
assert(moSrc.indexOf('bond≥2') >= 0, 'F2 诞育门槛保留（修复走"可达"而非"拆除"）');
var gsSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'core', 'game-state.js'), 'utf8');
assert(gsSrc.indexOf('bonds: charData.bonds') >= 0 && gsSrc.indexOf('children: Array.isArray(charData._children)') >= 0,
    'F3 存档白名单含道侣与子嗣');

console.log('v20.12 bonds: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
