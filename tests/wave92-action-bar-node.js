/**
 * wave92-action-bar-node.js — 第九十二波 · 行动条 验收：
 *   A 引擎骨架：全员一条行动条按时间攒（速率=身法脚力），满 100 出手；不同动作扣不同条
 *     （普攻 100 / 招式随劲力 60~150 / 暗器 60 / 毒 80 / 控制 100 / 乾坤 150 / 医疗逃跑 100）
 *   B 全员遵守：敌主/敌同伴/队员/灵兽各攒各的条，快的先动多动；先手是抢来的（玩家不再白拿）；
 *     骑乘脚力延伸到行动条；回合账（毒/冷却/生理）在敌主行动边界翻篇
 *   C 家什扣条：符箓管线按轻重扣条（暗器快活 60，乾坤翻盘手 150，护体符不扣）
 *   D 哨兵：旧 setTimeout 回合链绝迹、enemyTurn 兼容壳在册、UI 行动条面板挂出、零中英混排
 *
 * 运行：node tests/wave92-action-bar-node.js
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

// ==================== 测试桩 ====================
global.window = global;
var els = {};
function fakeEl(tag) {
    var el = {
        tag: tag || '', children: [], style: {}, parentNode: null,
        setAttribute: function () {}, getAttribute: function () { return null; },
        appendChild: function (c) { this.children.push(c); return c; },
        removeChild: function () {}, addEventListener: function () {}, removeEventListener: function () {},
        closest: function () { return null; }, scrollIntoView: function () {},
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
global.getEffectiveMax = function () { return 100; };
global.itemById = {};
global.EventBus = { emit: function () {}, on: function () {} };
global.getCombatBonuses = function () { return {}; };
global.getBondBonuses = function () { return {}; };
global.getPlayerWeaponSkill = function () { return 0; };
global.resolveWeaponDamageType = function () { return 'slash'; };
global.currentEquipment = {};
global.partySystem = null;
global.getCurrentCharData = function () { return global.currentCharData; };
global.currentCharData = { health: 100, energy: 100, qi: 200, maxQi: 200, level: 10, realm: '金丹', attrs: {} };
global.timeSystem = {
    gameTime: { totalMinutes: 0 },
    advanceTime: function (m) { this.gameTime.totalMinutes += m; },
    onNewDaySubscribe: function () {}
};
global.setTimeout = function () { return 0; };   // 不执行回调：推进全在时间轴里同步走完

load('js/physiology-config.js');
load('js/battle-injuries.js');
load('js/battle.js');
load('js/gameplay/talisman-system.js');

var Entity = global.Entity, Battle = global.Battle;
var TAL = global.TalismanSystem;

function mkPlayer(dex) {
    return new Entity({
        name: '玩家', level: 10,
        attrs: { strength: 30, dexterity: dex == null ? 20 : dex, intelligence: 20, willpower: 20, constitution: 30, meridian: 30 },
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
function mkAllyData(name) {
    return { data: { name: name, level: 8, type: 'beast', attrs: { strength: 12, dexterity: 14, intelligence: 4, willpower: 6, constitution: 12, meridian: 2 }, skills: {} }, type: 'beast', uid: 'u_' + name };
}
function newBattle(p, e, allies) {
    TAL.reset();
    msgs.length = 0;
    var b = new Battle(p || mkPlayer(), e || mkEnemy(), allies);
    global.currentBattle = b;
    return b;
}
// 记录扣条账
function spySpend(b) {
    var spent = [];
    var orig = b.spendActionCost;
    b.spendActionCost = function (ent, cost) { spent.push({ e: ent, c: cost }); return orig.call(this, ent, cost); };
    return spent;
}
// 数谁动了手（桩掉 _executeAttack，只记名不真打）
function spyAttacks(b) {
    var hits = [];
    var orig = Battle.prototype._executeAttack;
    Battle.prototype._executeAttack = function (atk, def, part, dt) {
        hits.push(atk && atk.name);
        return { msg: '跳过', missed: false };
    };
    return { hits: hits, restore: function () { Battle.prototype._executeAttack = orig; } };
}

// ==================== A · 引擎骨架 ====================
console.log('\n[A] 引擎骨架（全员一条行动条，满 100 出手，动作按轻重扣条）');
var bA = newBattle();
assert(Array.isArray(bA._actors) && bA._actors.length === 2, 'A1 时间轴上两个人（你与敌主）');
eq(bA.isPlayerTurn, true, 'A2 同速开局平条——玩家侧优先（平手才让你先，不是白送）');
eq(bA.turn, 0, 'A3 开局没人动过手');
assert(bA._findActor(bA.player).bar >= 100, 'A4 轮到你时你的条是满的（≥100 才叫轮到）');
assert(bA._findActor(bA.enemy).bar >= 100, 'A5 敌主的条也攒满了在等你（同速同时满）');
// 普攻扣 100
var spA = spySpend(bA);
bA.playerAttack('chest');
assert(spA.some(function (x) { return x.e === bA.player && x.c === 100; }), 'A6 普攻是 100 点的动作（一刀挥出条清空）');
eq(bA.turn, 1, 'A7 推进中敌主行动过一次（敌主行动＝回合边界）');
// 招式条价随劲力：0.7 倍轻招 70、1.2 倍 120、1.8 倍封顶 150；apCost 明写优先
var bM = newBattle();
var spM = spySpend(bM);
bM.playerAttackWithMove('chest', { name: '掠影剑', moveId: 'm1', damageMult: 0.7, qiCost: 0, staminaCost: 0 });
assert(spM.some(function (x) { return x.c === 70; }), 'A8 轻灵快招只扣 70（条剩得多，回手快）');
var bM2 = newBattle();
var spM2 = spySpend(bM2);
bM2.playerAttackWithMove('chest', { name: '开山击', moveId: 'm2', damageMult: 1.2, qiCost: 0, staminaCost: 0 });
assert(spM2.some(function (x) { return x.c === 120; }), 'A9 中等劲力扣 120（跟 damageMult 走）');
var bM3 = newBattle();
var spM3 = spySpend(bM3);
bM3.playerAttackWithMove('chest', { name: '焚天大招', moveId: 'm3', damageMult: 2.5, qiCost: 0, staminaCost: 0 });
assert(spM3.some(function (x) { return x.c === 150; }), 'A10 再重的招也封顶 150（扣成负数收势久，但不无限）');
var bM4 = newBattle();
var spM4 = spySpend(bM4);
bM4.playerAttackWithMove('chest', { name: '点穴手', moveId: 'm4', damageMult: 1.0, apCost: 40, qiCost: 0, staminaCost: 0 });
assert(spM4.some(function (x) { return x.c === 40; }), 'A11 招式明写 apCost 的按明账走（轻功点穴 40 点快活）');
// 兼容壳
var bC0 = newBattle();
var okShell = true;
try { bC0.enemyTurn(); } catch (e) { okShell = false; }
assert(okShell, 'A12 enemyTurn 兼容壳＝推进时间轴（老调用口不炸）');

// ==================== B · 全员遵守 ====================
console.log('\n[B] 全员遵守（敌主/同伴/队员/灵兽各攒各的条，快者先动多动）');
// 先手是抢来的：快敌开局就动手
var bF = newBattle(mkPlayer(10), mkEnemy('疾风客', 12, { strength: 30, dexterity: 60, intelligence: 15, willpower: 15, constitution: 30, meridian: 20 }));
assert(bF.turn >= 1, 'B1 快敌抢了先手——你还没动，它已经出手（先手不是白送的）');
assert(bF.log.some(function (l) { return l.msg.indexOf('疾风客') >= 0 && l.msg.indexOf('攻击了') >= 0; }), 'B2 抢到的先手是真攻击（战报有账）');
eq(bF.isPlayerTurn, true, 'B3 抢完先手时间轴停回你手上');
// 敌方同伴各有行动条
var bP = newBattle(mkPlayer(), mkEnemy('头狼', 10), [mkAllyData('野狼甲'), mkAllyData('野狼乙')]);
eq(bP._actors.length, 4, 'B4 兽群三个敌人＋你＝四条行动条');
var spP = spyAttacks(bP);
bP.playerAttack('chest');
spP.restore();
eq(spP.hits.filter(function (n) { return n === '野狼甲'; }).length, 1, 'B5 野狼甲攒满条扑了一次');
eq(spP.hits.filter(function (n) { return n === '野狼乙'; }).length, 1, 'B6 野狼乙也各按各的条动手（不再排队跟班）');
// 快者多动：高身法敌人一轮里出手比你多
var bS = newBattle(mkPlayer(10), mkEnemy('闪电手', 12, { strength: 20, dexterity: 80, intelligence: 15, willpower: 15, constitution: 30, meridian: 20 }));
var spS = spyAttacks(bS);
for (var atkI = 0; atkI < 3 && !bS.isFinished; atkI++) {
    if (bS.isPlayerTurn) bS.playerAttack('chest');
}
spS.restore();
var foeHits = spS.hits.filter(function (n) { return n === '闪电手'; }).length;
var myHits = spS.hits.filter(function (n) { return n === '玩家'; }).length;
assert(foeHits > myHits, 'B7 身法碾压的敌人出手比你密（' + foeHits + ' vs ' + myHits + '——速度终于有了声音）');
// 骑乘脚力延伸到行动条（先量没骑的基线，再挂坐骑桩）
var bR0 = newBattle();
var baseRate = bR0._findActor(bR0.player).rate;
global.getActiveMount = function () { return { name: '雷鹰', mount: { speed: 2.5, fly: true } }; };
global.getMountCombatData = function () {
    return { name: '雷鹰（坐骑）', level: 12, attrs: { strength: 12, dexterity: 22, constitution: 10, willpower: 10, intelligence: 8, meridian: 8 }, skills: { '雷击': 44 }, physiologyType: 'beast', _tamedIndex: 0, _isMount: true, _mountSpeed: 2.5 };
};
var bR = newBattle();
var mountRate = bR._findActor(bR.player).rate;
eq(mountRate, baseRate + 8, 'B8 骑着雷鹰行动条攒得快（速率+（脚力-1）×5＝+8）');
eq(bR._mounted, true, 'B9 坐骑照旧入阵（九十波的账不破）');
delete global.getActiveMount; delete global.getMountCombatData;
// 死了的退出时间轴
var bD = newBattle(mkPlayer(), mkEnemy('头狼', 10), [mkAllyData('死狼')]);
bD.enemyAllies[0].isAlive = false;
var barsD = bD.getActionBars();
var deadBar = barsD.filter(function (x) { return x.name.indexOf('死狼') >= 0; })[0];
eq(deadBar.alive, false, 'B10 倒下的不再攒条（行动条面板如实标「倒」）');
// 回合账在敌主行动边界翻篇
var bT = newBattle();
var spT = spyAttacks(bT);
bT.playerAttack('chest');
bT.playerAttack('chest');
spT.restore();
var foeMain = spT.hits.filter(function (n) { return n === '强敌'; }).length;
eq(bT.turn, foeMain, 'B11 回合数＝敌主行动次数（毒/冷却/生理的回合账挂在敌主行动边界）');

// ==================== C · 家什扣条 ====================
console.log('\n[C] 家什扣条（轻家什便宜，翻盘手昂贵）');
var HIDDEN = { name: '暗器', effect: { attack_damage: 45 } };
var POISON = { name: '毒药', effect: { poison_enemy: 3 } };
var STUN = { name: '定身符', effect: { stun: 1 } };
var TWIST = { name: '乾坤符', effect: { twist_fate: 1 } };
var GUARD = { name: '护身符·大', effect: { defense_boost: 15, duration: 3 } };
var bH = newBattle(); var spH = spySpend(bH);
TAL.apply(HIDDEN);
assert(spH.some(function (x) { return x.c === 60; }), 'C1 暗器 60 点（快活）');
var bPs = newBattle(); var spPs = spySpend(bPs);
TAL.apply(POISON);
assert(spPs.some(function (x) { return x.c === 80; }), 'C2 撒毒 80 点');
var bSt = newBattle(); var spSt = spySpend(bSt);
TAL.apply(STUN);
assert(spSt.some(function (x) { return x.c === 100; }), 'C3 控制符 100 点（一整副身家的动作）');
global.restoreBodyDurability = function () {};
var bTw = newBattle(); var spTw = spySpend(bTw);
TAL.apply(TWIST);
assert(spTw.some(function (x) { return x.c === 150; }), 'C4 乾坤符 150 点（翻盘手最贵）');
var bGu = newBattle(); var spGu = spySpend(bGu);
TAL.apply(GUARD);
eq(spGu.length, 0, 'C5 护体符不扣条（战前功课，照旧）');

// ==================== D · 哨兵 ====================
console.log('\n[D] 哨兵');
var bSrc = src('js/battle.js');
assert(bSrc.indexOf('setTimeout(() => this.enemyTurn()') < 0, 'D1 旧的 setTimeout 回合链绝迹（时间轴同步推进）');
assert(bSrc.indexOf('_advanceTimeline()') >= 0 && bSrc.indexOf('_initTimeline()') >= 0, 'D2 时间轴引擎接线在册');
assert(bSrc.indexOf('enemyTurn() {') >= 0, 'D3 兼容壳还在（老调用口不断）');
assert(bSrc.indexOf('_enemyAlliesAct()') < 0 || bSrc.indexOf('每只同伴各有自己的行动条') >= 0, 'D4 旧「同伴排队轮一遍」退役');
var appSrc = src('js/app.js');
assert(appSrc.indexOf('_renderActionBars') >= 0 && appSrc.indexOf('getActionBars') >= 0, 'D5 行动条面板渲染接线');
assert(appSrc.indexOf('攒满 100 出手') >= 0, 'D6 面板把价目表写给玩家看（不藏账）');
assert(src('仙侠.html').indexOf('battle-timeline-bars') >= 0, 'D7 战斗页挂出行动条容器');
var tlSeg = bSrc.slice(bSrc.indexOf('// ---------- 第九十二波 · 行动条引擎'), bSrc.indexOf('// v10.0：使用招式攻击指定部位'));
assert(tlSeg.indexOf('次数已用完') < 0 && tlSeg.indexOf('每日') < 0, 'D8 行动条不是计数器（约束来自时间本身）');
var leak = null;
[tlSeg, appSrc.slice(appSrc.indexOf('function _renderActionBars'), appSrc.indexOf('function _updateBattleUIImpl'))].forEach(function (txt) {
    (txt.match(/'[^']+'/g) || []).forEach(function (s) {
        var v = s.slice(1, -1);
        if (/[+);({\[,?<>]/.test(v)) return;
        if (/^[a-z0-9_]+(?:[-_:. ][a-z0-9_]+)*$/i.test(v)) return;
        if (/^[A-Za-z0-9_\-:.\/#% ]+$/.test(v)) return;
        if (/[A-Za-z]/.test(v) && /[一-龥]/.test(v)) leak = leak || s;
    });
});
eq(leak, null, 'D9 新话术零中英混排（漏: ' + leak + '）');
assert(src('tests/run-all.sh').indexOf('wave92-action-bar-node.js') >= 0, 'D10 本套已挂全量回归');
delete global.currentBattle;

console.log('\n========== 第九十二波 · 行动条 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
