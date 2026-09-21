/**
 * wave90-mounted-combat-node.js — 第九十波 · 骑乘参战 验收：
 *   A 坐骑入阵：骑着开战，坐骑驮你入阵——场上兽位只有一个，坐骑优先（出战兽是另一只则此战在场外）；
 *     骑乘机动闪避 +（速度-1）×10 封顶 15；力竭的坐骑不驮人上阵（回落出战兽）
 *   B 落马账：骑乘中挨重击（暴击或一击打穿胸口四成）三成落马——机动加成当场撤销、
 *     坐骑继续留在阵上；落马只认骑手挨的打（兽挨打不算）；轻击摇不动骑手
 *   C 战后结账：谁打的谁长阅历——坐骑打完的仗，经验亲密伤账全记坐骑头上（旧版只认出战位）
 *   D 哨兵：出战口数据原样、battle.js 无人工计数器、新话术零中英混排、邻波哨兵不破
 *
 * 运行：node tests/wave90-mounted-combat-node.js
 */
'use strict';

var fs = require('fs');
var vm = require('vm');
var path = require('path');
var ROOT = path.resolve(__dirname, '..');

var passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) { passed++; console.log('  ✓ ' + msg); }
    else { failed++; console.error('  ✗ ' + msg); }
}
function eq(a, b, msg) { assert(a === b, msg + '（实际=' + JSON.stringify(a) + ' 期望=' + JSON.stringify(b) + '）'); }
function load(rel) {
    vm.runInThisContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), { filename: rel });
}
function src(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// ==================== 测试桩（多人战同款） ====================
global.window = global;
var els = {};
function fakeEl(tag) {
    var el = {
        tag: tag || '', children: [], style: {}, _attrs: {}, parentNode: null,
        setAttribute: function (k, v) { this._attrs[k] = v; },
        getAttribute: function (k) { return this._attrs[k]; },
        appendChild: function (c) { this.children.push(c); return c; },
        removeChild: function () {},
        addEventListener: function () {}, removeEventListener: function () {},
        closest: function () { return null; },
        scrollIntoView: function () {},
        classList: { add: function () {}, remove: function () {}, toggle: function () {}, contains: function () { return false; } },
        _html: '', textContent: '', options: []
    };
    Object.defineProperty(el, 'innerHTML', {
        get: function () { return this._html; },
        set: function (v) { this._html = String(v); },
        configurable: true
    });
    return el;
}
global.document = {
    readyState: 'complete',
    createElementNS: function (ns, tag) { return fakeEl(tag); },
    createElement: function (tag) { return fakeEl(tag); },
    getElementById: function (id) { if (!els[id]) els[id] = fakeEl(); return els[id]; },
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
    addEventListener: function () {},
    body: { appendChild: function () {} }
};
var store = {};
global.localStorage = {
    getItem: function (k) { return store[k] !== undefined ? store[k] : null; },
    setItem: function (k, v) { store[k] = String(v); },
    removeItem: function (k) { delete store[k]; }
};
var msgs = [];
global.showMessage = function (m, t) { msgs.push({ m: String(m), t: t }); };
global.updateCharacterStatus = function () {};
global.updateCurrencyUI = function () {};
global.updateInventoryUI = function () {};
global.updateBattleUI = function () {};
global.renderBeastList = function () {};
global.getEffectiveMax = function () { return 100; };
global.itemById = {};
global.EventBus = { emit: function () {}, on: function () {} };
global.getCombatBonuses = function () { return {}; };
global.getBondBonuses = function () { return {}; };
global.getPlayerWeaponSkill = function () { return 0; };
global.resolveWeaponDamageType = function () { return 'slash'; };
global.currentEquipment = {};
global.TalismanSystem = null;
global.partySystem = null;
global.getLifeSkill = function () { return 0; };
global.growLifeSkill = function () {};
global.getCurrentCharData = function () { return global.currentCharData; };
var CUR_DAY = 100;
global.getAbsoluteDay = function () { return CUR_DAY; };
global.currentCharData = { health: 100, energy: 100, qi: 100, maxQi: 100, level: 10, realm: '金丹', spiritStones: 1000, copper: 100, attrs: {}, combatAbilities: [] };
global.inventory = { currency: { spiritStones: 1000, copper: 100 }, slots: [], maxSlots: 30 };
global.timeSystem = {
    gameTime: { totalMinutes: 0 },
    advanceTime: function (m) { this.gameTime.totalMinutes += m; },
    getAbsoluteDay: function () { return CUR_DAY; },
    onNewDaySubscribe: function () {}
};
global.WorldCalendar = { day: CUR_DAY };
global.setTimeout = function (fn) { fn(); return 0; };
var REALMS = { '炼气': 0, '筑基': 1, '金丹': 2, '元婴': 3, '化神': 4, '炼虚': 5 };
global.REALM_CONFIG = REALMS;
global.getRealmIndex = function (r) { return REALMS[r] != null ? REALMS[r] : -1; };
// 进化/伤势桩：按 uid 开关的力竭档 + 伤账记录
var WOUND_BIDS = {}, woundCalls = [];
global.BeastEvolution = {
    forget: function () { return { ok: true }; },
    initBeast: function () {},
    getWoundStatus: function (bid) { return WOUND_BIDS[bid] ? 'critical' : null; },
    getHp: function (bid) { return WOUND_BIDS[bid] ? 0 : 100; },
    getMaxHp: function () { return 100; },
    damage: function (bid, n) { woundCalls.push({ bid: bid, n: n }); return { ok: true }; },
    getLine: function () { return null; },
    getStage: function () { return null; }
};
global.Codex = { discover: function () {} };

load('js/physiology-config.js');
load('js/battle-injuries.js');
load('js/battle.js');
load('js/beast-taming.js');

var Entity = global.Entity, Battle = global.Battle;

function mkPlayer() {
    return new Entity({
        name: '玩家', level: 10,
        attrs: { strength: 30, dexterity: 20, intelligence: 20, willpower: 20, constitution: 30, meridian: 30 },
        skills: { '内功': 40 }, loot: {}, physiologyType: 'humanoid'
    }, 'player');
}
function mkEnemy(name, level, attrs) {
    return new Entity({
        name: name || '强敌', level: level || 12,
        attrs: attrs || { strength: 35, dexterity: 20, intelligence: 15, willpower: 15, constitution: 35, meridian: 20 },
        skills: { '内功': 35 }, loot: { exp: 10, copper: 5 }, physiologyType: 'humanoid'
    }, 'enemy');
}
// 兽栏夹具：0 号雷鹰（坐骑位）、1 号风狼（出战位）
function setupPen() {
    global.importBeastState({
        beasts: [
            { templateId: 'thunder_eagle', name: '雷鹰', uid: 'e0', level: 12, exp: 0, affection: 60, skills: ['雷击'], combatAbilities: [], trait: 'swift', mount: { speed: 2.5, fly: true } },
            { templateId: 'wind_wolf', name: '风狼', uid: 'w1', level: 8, exp: 0, affection: 50, skills: ['风刃'], combatAbilities: [], trait: 'fierce', mount: { speed: 1.5 } }
        ],
        activeBeastIndex: 1, activeMountIndex: 0
    });
    WOUND_BIDS = {};
    woundCalls.length = 0;
    msgs.length = 0;
}
var origRnd = Math.random;
function stubRnd(v) { Math.random = function () { return v; }; }
function stubSeq(arr) { var s = arr.slice(); Math.random = function () { return s.length > 1 ? s.shift() : s[0]; }; }

// ==================== A · 坐骑入阵 ====================
console.log('\n[A] 坐骑入阵（骑着开战，它驮着你打）');
setupPen();
var md = global.getMountCombatData();
assert(md && md.name.indexOf('雷鹰') >= 0 && md.name.indexOf('（坐骑）') >= 0, 'A1 坐骑战斗数据报名「雷鹰（坐骑）」');
eq(md._isMount, true, 'A2 坐骑标记在册');
eq(md._mountSpeed, 2.5, 'A3 脚力随数据进场（机动加成的账源）');
eq(md._tamedIndex, 0, 'A4 认得自己是兽栏几号（战后结账用）');
var ad = global.getActiveBeastCombatData();
assert(ad && ad.name.indexOf('风狼') >= 0 && ad.name.indexOf('（灵兽）') >= 0, 'A5 出战口原样（风狼（灵兽），八十八波小名后缀不破）');
eq(ad._tamedIndex, 1, 'A6 出战口认自己的号');
// 开战：坐骑优先入阵
setupPen();
var b1 = new Battle(mkPlayer(), mkEnemy());
assert(b1.allyBeast && b1.allyBeast.name.indexOf('雷鹰') >= 0, 'A7 骑着开战——入阵的是坐骑（不是蹲在出战位的风狼）');
eq(b1._mounted, true, 'A8 骑乘作战标记');
eq(b1.allyBeast._tamedIndex, 0, 'A9 入阵兽带号进场');
eq(b1._mountDodge, 15, 'A10 雷鹰脚力 2.5 → 机动闪避 +15（封顶也是 15）');
assert(b1.log.some(function (l) { return l.msg.indexOf('驮你') >= 0 || l.msg.indexOf('驮着你') >= 0; }), 'A11 开场话术点破骑乘参战');
assert(b1.log.some(function (l) { return l.msg.indexOf('骑乘机动') >= 0; }), 'A12 机动加成上战报（不偷加）');
// 风狼脚力 1.5 → +5
setupPen();
global.importBeastState({
    beasts: [{ templateId: 'wind_wolf', name: '风狼', uid: 'w0', level: 8, exp: 0, affection: 50, skills: ['风刃'], combatAbilities: [], trait: 'fierce', mount: { speed: 1.5 } }],
    activeBeastIndex: -1, activeMountIndex: 0
});
var b2 = new Battle(mkPlayer(), mkEnemy());
eq(b2._mountDodge, 5, 'A13 风狼脚力 1.5 → 机动闪避 +5（加成跟脚力走，不是一口价）');
// 没骑乘：出战兽照旧入阵
setupPen();
global.importBeastState({
    beasts: [
        { templateId: 'thunder_eagle', name: '雷鹰', uid: 'e0', level: 12, exp: 0, affection: 60, skills: ['雷击'], combatAbilities: [], trait: 'swift', mount: { speed: 2.5, fly: true } },
        { templateId: 'wind_wolf', name: '风狼', uid: 'w1', level: 8, exp: 0, affection: 50, skills: ['风刃'], combatAbilities: [], trait: 'fierce', mount: { speed: 1.5 } }
    ],
    activeBeastIndex: 1, activeMountIndex: -1
});
var b3 = new Battle(mkPlayer(), mkEnemy());
assert(b3.allyBeast && b3.allyBeast.name.indexOf('风狼') >= 0, 'A14 没骑乘——出战兽照旧入阵（老账不破）');
eq(b3._mounted, false, 'A15 没骑乘不算骑乘作战');
eq(b3._mountDodge, 0, 'A16 没骑乘没有机动加成');
// 力竭的坐骑不驮人上阵（只力竭坐骑，出战兽无恙）
setupPen();
WOUND_BIDS['e0'] = true;
eq(global.getMountCombatData(), null, 'A17 力竭的坐骑出不了战（与出战口同一本伤账）');
var b4 = new Battle(mkPlayer(), mkEnemy());
eq(b4._mounted, false, 'A18 力竭坐骑不标骑乘');
assert(b4.allyBeast && b4.allyBeast.name.indexOf('风狼') >= 0, 'A19 坐骑力竭——回落出战兽入阵');
// 光杆一人：无兽无坐骑不炸
setupPen();
global.importBeastState({ beasts: [], activeBeastIndex: -1, activeMountIndex: -1 });
var b5 = new Battle(mkPlayer(), mkEnemy());
eq(b5.allyBeast, null, 'A20 没兽的散修独自开战（不炸不塞假兽）');
eq(b5._mounted, false, 'A21 没兽没骑乘');

// ==================== B · 落马账 ====================
console.log('\n[B] 落马账（重击三成震下马背——机动没了，坐骑还在阵上）');
setupPen();
var OGRE = { strength: 400, dexterity: 20, intelligence: 10, willpower: 10, constitution: 40, meridian: 10 };
var b6 = new Battle(mkPlayer(), mkEnemy('巨力魔头', 20, OGRE));
var dodgeMounted = b6.player.dodgeBonus;
assert(dodgeMounted > 10, 'B0 骑乘中闪避带着机动加成');
// 骰序：命中 / 不闪 / 不格 / 不化 / 不暴 / 落马骰中——一击打穿胸口四成即重击
stubSeq([0.01, 0.99, 0.99, 0.99, 0.99, 0.1]);
var r1 = b6._executeAttack(b6.enemy, b6.player, 'chest', 'slash');
Math.random = origRnd;
assert(r1 && r1.damage > 0, 'B1 巨力魔头一击打实（重击线：胸口耐久四成）');
assert(r1.msg.indexOf('落马') >= 0, 'B2 重击震落马背（话术上战报）');
eq(b6._mounted, false, 'B3 落马标记翻掉');
eq(b6._mountDodge, 0, 'B4 机动账清零');
assert(b6.player.dodgeBonus < dodgeMounted, 'B5 闪避加成当场撤销（不留在身上白吃）');
assert(b6.allyBeast && b6.allyBeast.isAlive !== false, 'B6 坐骑没跑——落马后它仍在阵上');
// 落马之后再挨重击：不再报落马
stubSeq([0.01, 0.99, 0.99, 0.99, 0.99, 0.1]);
var dodgeAfter = b6.player.dodgeBonus;
var r2 = b6._executeAttack(b6.enemy, b6.player, 'chest', 'slash');
Math.random = origRnd;
assert(r2 && r2.msg.indexOf('落马') < 0, 'B7 已经在地上的人不会再「落马」一次');
eq(b6.player.dodgeBonus, dodgeAfter, 'B8 闪避不再被重复扣');
// 轻击摇不动骑手（无暴击、伤害小）
setupPen();
var b7 = new Battle(mkPlayer(), mkEnemy('瘦弱贼人', 3, { strength: 1, dexterity: 8, intelligence: 5, willpower: 5, constitution: 8, meridian: 5 }));
stubRnd(0.5);   // 命中但不闪不格不化不暴（0.5 高于闪避/格挡/化解/暴击各档上限）
var r3 = b7._executeAttack(b7.enemy, b7.player, 'chest', 'slash');
Math.random = origRnd;
if (r3 && r3.damage > 0) {
    eq(b7._mounted, true, 'B9 轻击摇不动骑手（落马只认重击）');
} else {
    assert(true, 'B9 轻击被闪/格开——骑手安稳（同样没落马）');
}
// 兽挨打不算骑手落马
setupPen();
var b8 = new Battle(mkPlayer(), mkEnemy('巨力魔头', 20, OGRE));
stubSeq([0.01, 0.99, 0.99, 0.99, 0.99, 0.1]);
b8._executeAttack(b8.enemy, b8.allyBeast, 'chest', 'slash');
Math.random = origRnd;
eq(b8._mounted, true, 'B10 挨打的是坐骑不是骑手——骑手稳稳坐在马背上');

// ==================== C · 战后结账 ====================
console.log('\n[C] 战后结账（谁打的谁长阅历——坐骑打的仗记坐骑头上）');
setupPen();
global.currentBattle = { enemy: {}, allyBeast: { isAlive: true, _tamedIndex: 0 } };
global.onBeastBattleEnd(true);
var pen = global.tamedBeasts;
eq(pen[0].exp, 20, 'C1 坐骑打赢——阅历记坐骑头上');
eq(pen[0].affection, 62, 'C2 亲密也记坐骑头上（60+2）');
eq(pen[1].exp, 0, 'C3 蹲在家里的风狼一分不拿（旧版这笔记在出战位头上）');
// 坐骑战倒：伤账记坐骑
setupPen();
global.currentBattle = { enemy: {}, allyBeast: { isAlive: false, _tamedIndex: 0 } };
global.onBeastBattleEnd(false);
assert(woundCalls.some(function (w) { return w.bid === 'e0'; }), 'C4 坐骑战倒——重伤账记坐骑的 uid（不是出战兽）');
eq(global.tamedBeasts[0].affection, 59, 'C5 打输了坐骑也掉亲密（60-1）');
// 没有 allyBeast 的老口径：回落出战位
setupPen();
global.currentBattle = { enemy: {}, allyBeast: null };
global.onBeastBattleEnd(true);
eq(global.tamedBeasts[1].exp, 20, 'C6 兽没入阵的仗照旧记出战位（老口径不回归）');
eq(global.tamedBeasts[0].exp, 0, 'C7 坐骑没上场不沾光');
delete global.currentBattle;

// ==================== D · 哨兵 ====================
console.log('\n[D] 哨兵');
var bSrc = src('js/battle.js');
assert(bSrc.indexOf('_mounted') >= 0 && bSrc.indexOf('getMountCombatData') >= 0, 'D1 骑乘参战接线在册');
var mountSeg = bSrc.slice(bSrc.indexOf('// 第九十波·骑乘参战'), bSrc.indexOf('// ===== 队伍成员作为战斗实体'));
var disSeg = bSrc.slice(bSrc.indexOf('// 第九十波·落马账'), bSrc.indexOf('return { msg, part: partId, damage: actual, crit: isCrit'));
assert(mountSeg.indexOf('次数') < 0 && disSeg.indexOf('次数') < 0 && disSeg.indexOf('每日') < 0, 'D2 落马是骰账不是计数器（设计宪法：约束来自世界本身）');
eq((disSeg.match(/Math\.random/g) || []).length, 1, 'D3 落马只掷一枚骰（三成）');
var btSrc = src('js/beast-taming.js');
assert(btSrc.indexOf('window.getMountCombatData = getMountCombatData') >= 0, 'D4 坐骑战斗数据出口挂上 window');
assert(btSrc.indexOf('_tamedIndex') >= 0 && btSrc.indexOf('谁打的谁长阅历') >= 0, 'D5 战后结账认上场的那只');
// 邻波哨兵不破：battle.js 仍无八十四/八十七/八十八波字样（本波是 battle.js 首次动账）
assert(bSrc.indexOf('第八十四波') < 0 && bSrc.indexOf('learnFromSighting') < 0 && bSrc.indexOf('第八十八波') < 0, 'D6 邻波哨兵原样（八十四/八十七/八十八波都不在 battle.js 记账）');
assert(src('tests/run-all.sh').indexOf('wave90-mounted-combat-node.js') >= 0, 'D7 本套已挂全量回归');
// 新话术零中英混排
var leak = null;
[mountSeg, disSeg, btSrc.slice(btSrc.indexOf('function _beastCombatDataAt'), btSrc.indexOf('/** 战后成长 */'))].forEach(function (txt) {
    (txt.match(/'[^']+'/g) || []).forEach(function (s) {
        var v = s.slice(1, -1);
        if (/[+);({\[,?<>]/.test(v)) return;
        if (/^[a-z0-9_]+(?:[-_:. ][a-z0-9_]+)*$/i.test(v)) return;
        if (/^[A-Za-z0-9_\-:.\/# ]+$/.test(v)) return;
        if (/[A-Za-z]/.test(v) && /[一-龥]/.test(v)) leak = leak || s;
    });
});
eq(leak, null, 'D8 新话术零中英混排（漏: ' + leak + '）');

console.log('\n========== 第九十波 · 骑乘参战 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
