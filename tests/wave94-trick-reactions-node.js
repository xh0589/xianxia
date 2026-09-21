/**
 * wave94-trick-reactions-node.js — 第九十四波 · 见招拆招 验收：
 *   姿态不是固定效果，是社交动作——不同性子不同反应（用户校正落地）
 *   A 性子从哪来：具名对手读五维性格档（personality16），杂兵从打架路数读（aiBehavior/subtype/邪派/老江湖）
 *   B 你装死，他三种反应：性急的当真（留力+你留偷袭窗）/ 老练的不上当（白装）/ 眼毒的识破（命中+25）
 *   C 你撒迷烟，他三种反应：兜头糊实瞎两回 / 侧脸闭气一回 / 袖子扫开白撒
 *   D 对面也会使坏：掏石灰/装死——姿态摆出来时间轴停住，出应对面板，怎么接由你挑（真扣条真吃物品）
 *   E 账本全是一次性：留力打完就清、迷眼随手数消散，没有永久光环
 *   F 哨兵：引擎口子齐全、旧固定账本(_feigning)清零、UI 挂上、零中英混排
 *
 * 运行：node tests/wave94-trick-reactions-node.js
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

// ==================== 测试桩（行动条同款；setTimeout 不执行回调） ====================
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
global.setTimeout = function () { return 0; };

load('js/physiology-config.js');
load('js/battle-injuries.js');
load('js/battle.js');
load('js/gameplay/talisman-system.js');
load('js/items-extended/13-missing-ids.js');

var Entity = global.Entity, Battle = global.Battle;
var TAL = global.TalismanSystem;
var origRnd = Math.random;
function stubRnd(v) { Math.random = function () { return v; }; }
function seqRnd(arr) {
    Math.random = (function () { var s = arr.slice(); return function () { return s.length > 1 ? s.shift() : s[0]; }; })();
}

function mkPlayer(dex) {
    return new Entity({
        name: '玩家', level: 10,
        attrs: { strength: 30, dexterity: dex == null ? 20 : dex, intelligence: 20, willpower: 20, constitution: 30, meridian: 30 },
        skills: { '内功': 40 }, loot: {}, physiologyType: 'humanoid'
    }, 'player');
}
function mkEnemy(name, opts) {
    opts = opts || {};
    var data = {
        name: name || '强敌', level: opts.level || 12,
        attrs: opts.attrs || { strength: 35, dexterity: 20, intelligence: 15, willpower: 15, constitution: 35, meridian: 20 },
        skills: { '内功': 35 }, loot: { exp: 10, copper: 5 }, physiologyType: 'humanoid'
    };
    if (opts.aiBehavior) data.aiBehavior = opts.aiBehavior;
    if (opts.subtype) data.subtype = opts.subtype;
    if (opts.personality16) data.personality16 = opts.personality16;
    if (opts.evil) data._evilFaction = true;
    return new Entity(data, 'enemy');
}
function newBattle(p, e) {
    TAL.reset();
    msgs.length = 0;
    var b = new Battle(p || mkPlayer(), e || mkEnemy());
    global.currentBattle = b;
    return b;
}
function hasLog(b, kw) {
    return b.log.some(function (l) { return String(l.msg).indexOf(kw) >= 0; });
}

// ==================== A · 性子从哪来 ====================
console.log('\n[A] 打架性子（具名读五维性格档，杂兵读路数）');
var eP16 = mkEnemy('柳惊鸿', { personality16: { mind: -30, energy: 10, nature: 20, tactics: 90, identity: 90 } });
var bA1 = newBattle(mkPlayer(), eP16);
assert(bA1.enemy._personality && bA1.enemy._personality.tactics === 90, 'A1 五维性格档随实体进场（Entity 认 personality16）');
stubRnd(0.6);
eq(bA1._rollPersona(), 'reckless', 'A2 谋略高+自我高——性急冒进（骰 0.6 落在性急段）');
Math.random = origRnd;
var bA3 = newBattle(mkPlayer(), mkEnemy('老狐', { personality16: { mind: 40, energy: -10, nature: 0, tactics: -90, identity: -90 } }));
stubRnd(0.5);
eq(bA3._rollPersona(), 'cautious', 'A3 谋略低+自我低——老成持重');
Math.random = origRnd;
var bA4 = newBattle(mkPlayer(), mkEnemy('电眼', { personality16: { mind: 0, energy: 100, nature: 0, tactics: 0, identity: 0 } }));
stubRnd(0.9);
eq(bA4._rollPersona(), 'sharp', 'A4 精力爆表——眼疾手快看得破');
Math.random = origRnd;
// 杂兵没有性格档：从打架路数读
var bA5 = newBattle(mkPlayer(), mkEnemy('狂战', { aiBehavior: 'aggressive' }));
stubRnd(0.4);
eq(bA5._rollPersona(), 'reckless', 'A5 狂攻路数的杂兵——性急');
Math.random = origRnd;
var bA6 = newBattle(mkPlayer(), mkEnemy('铁壁', { aiBehavior: 'defensive' }));
stubRnd(0.4);
eq(bA6._rollPersona(), 'cautious', 'A6 死守路数的杂兵——老练');
Math.random = origRnd;
var bA7 = newBattle(mkPlayer(), mkEnemy('游斗客', { aiBehavior: 'opportunist' }));
stubRnd(0.8);
eq(bA7._rollPersona(), 'sharp', 'A7 游斗找缝的杂兵——眼毒');
Math.random = origRnd;
var wBal = (function () { var b = newBattle(); return b._foePersona(); })();
var wSum = wBal.reckless + wBal.cautious + wBal.sharp;
assert(Math.abs(wSum - 1) < 1e-9, 'A8 三面权重归一（和=' + wSum.toFixed(4) + '）');
assert(wBal.reckless > 0 && wBal.cautious > 0 && wBal.sharp > 0, 'A9 谁都不是铁板一块（三面都有底数）');
var bA10 = newBattle(mkPlayer(), mkEnemy('狂战', { aiBehavior: 'aggressive' }));
eq(bA10._personaWord(), '性急的家伙', 'A10 性子有 product 话术（性急的家伙）');
var bA11 = newBattle(mkPlayer(), mkEnemy('铁壁', { aiBehavior: 'defensive' }));
eq(bA11._personaWord(), '老练的家伙', 'A11 老练的家伙');
var bA12 = newBattle(mkPlayer(), mkEnemy('游斗客', { aiBehavior: 'opportunist' }));
eq(bA12._personaWord(), '眼毒的家伙', 'A12 眼毒的家伙');

// ==================== B · 你装死，他三种反应 ====================
console.log('\n[B] 你装死——他信不信看性子');
var bB1 = newBattle();
stubRnd(0.2);   // 平衡性子 .375/.375/.25——0.2 性急
bB1.playerFeign();
Math.random = origRnd;
assert(hasLog(bB1, '当真了'), 'B1 性急的当真——收着刀凑近');
assert(hasLog(bB1, '留了三分力'), 'B2 留力当场兑现（那一下伤害减半）');
eq(bB1.player._backstabWindow, 1, 'B3 你留着暴起偷袭的窗');
assert(!bB1.player._feignPose, 'B4 姿态账在他反应后当场清（不躺着打一整场）');
var bB5 = newBattle();
stubRnd(0.5);   // cautious 段
bB5.playerFeign();
Math.random = origRnd;
assert(hasLog(bB5, '没上当'), 'B5 老练的不上当——停在三步开外');
assert(!bB5.player._backstabWindow, 'B6 白装就是白装（没有偷袭窗）');
var bB7 = newBattle();
stubRnd(0.9);   // sharp 段
bB7.playerFeign();
Math.random = origRnd;
assert(hasLog(bB7, '一眼识破'), 'B7 眼毒的一眼识破——「装死？我送你真死！」');
// 识破账兑现：同一骰平时劈空，识破了格外狠（命中 +25，一次性）
var bB8 = newBattle();
stubRnd(0.78);
var rCtl = bB8._executeAttack(bB8.enemy, bB8.player, 'eyes', 'slash');
assert(rCtl && rCtl.missed === true, 'B8 没识破：骰 0.78 点眼睛这一刀劈空');
bB8._foeInsight = 1;
var rIns = bB8._executeAttack(bB8.enemy, bB8.player, 'eyes', 'slash');
Math.random = origRnd;
assert(rIns && !rIns.missed, 'B9 识破了：同一骰这一下命中 +25 扎实');
eq(bB8._foeInsight, 0, 'B10 识破账一次性——用完当场清');
// 偷袭窗兑现：同骰对账 ×1.5
var bB11 = newBattle();
stubRnd(0.5);
var baseD = bB11._calculateDamage(bB11.player, bB11.enemy, 0);
bB11.player._backstabWindow = 1;
var stabD = bB11._calculateDamage(bB11.player, bB11.enemy, 0);
Math.random = origRnd;
eq(stabD, Math.floor(baseD * 1.5), 'B11 暴起偷袭 ×1.5（同骰对账：' + baseD + '→' + stabD + '）');
eq(bB11.player._backstabWindow, 0, 'B12 窗用完当场关');
assert(hasLog(bB11, '暴起'), 'B13 暴起那一下战报点名');

// ==================== C · 你撒迷烟，他三种反应 ====================
console.log('\n[C] 迷烟散——吃不吃看性子（receiveSmoke）');
var bC1 = newBattle();
stubRnd(0.2);
eq(bC1.receiveSmoke(), 2, 'C1 性急的兜头糊实——瞎两回');
Math.random = origRnd;
assert(hasLog(bC1, '兜头糊'), 'C2 战报有画面');
var bC3 = newBattle();
stubRnd(0.5);
eq(bC3.receiveSmoke(), 1, 'C3 老练的侧脸闭气——只瞎一回');
Math.random = origRnd;
assert(hasLog(bC3, '侧脸闭气'), 'C4 战报点明他只吃了小半');
var bC5 = newBattle();
stubRnd(0.9);
eq(bC5.receiveSmoke(), 0, 'C5 眼毒的袖子扫开——白撒');
Math.random = origRnd;
assert(hasLog(bC5, '白撒'), 'C6 战报写明白撒了');
// 路数影响反应：狂攻的杂兵更容易糊实
var bC7 = newBattle(mkPlayer(), mkEnemy('狂战', { aiBehavior: 'aggressive' }));
stubRnd(0.4);   // aggressive 权重 .545/.273/.182——0.4 仍是性急段
eq(bC7.receiveSmoke(), 2, 'C7 狂攻路数吃烟吃得更实（同骰在性急段）');
Math.random = origRnd;
var bC8 = newBattle(mkPlayer(), mkEnemy('游斗客', { aiBehavior: 'opportunist' }));
stubRnd(0.8);
eq(bC8.receiveSmoke(), 0, 'C8 游斗路数同骰落在眼毒段——袖子扫开');
Math.random = origRnd;
// 走符箓管线（物品照旧吃，白撒也吃——烟撒出去了收不回）
var SMOKE = { name: '迷烟散', effect: { blind_enemy: 2 } };
var bC9 = newBattle();
stubRnd(0.2);
eq(TAL.apply(SMOKE), true, 'C9 符箓管线接上性格反应（性急的：真瞎）');
Math.random = origRnd;
assert(TAL.debugState().enemyBlindTurns > 0, 'C10 瞎账进了敌瞎簿');
var bC11 = newBattle();
stubRnd(0.9);
eq(TAL.apply(SMOKE), true, 'C11 眼毒的白撒——烟散照旧用掉（撒出去收不回）');
Math.random = origRnd;
eq(TAL.debugState().enemyBlindTurns, 0, 'C12 白撒就是没瞎账');
assert(msgs.some(function (m) { return m.m.indexOf('白撒') >= 0; }), 'C13 玩家侧如实回话（白撒了）');
TAL.reset();

// ==================== D · 对面也会使坏（姿态→停轴→你挑怎么接） ====================
console.log('\n[D] 对面的下作活儿——姿态摆出来，怎么接由你挑');
var bD1 = newBattle(mkPlayer(), mkEnemy('游斗客', { aiBehavior: 'opportunist' }));
eq(bD1._foeTricks.smoke, 1, 'D1 游斗辈怀里揣着一包石灰（就一包）');
var bD1b = newBattle();
eq(bD1b._foeTricks.smoke, 0, 'D2 老实杂兵没这东西（不是人人都会使坏）');
// 掏石灰：姿态摆出、时间轴停住
var bD3 = newBattle(mkPlayer(), mkEnemy('游斗客', { aiBehavior: 'opportunist' }));
stubRnd(0.2);   // <0.3 掏石灰
eq(bD3._tryEnemyTrick(), true, 'D3 他摸出石灰兜头撒来');
Math.random = origRnd;
assert(bD3._pendingPrompt && bD3._pendingPrompt.kind === 'smoke', 'D4 应对姿态挂在账上（等你挑）');
eq(bD3._pendingPrompt.options.length, 4, 'D5 四条接法随你挑');
eq(bD3._foeTricks.smoke, 0, 'D6 石灰就一包——撒完就没了');
assert(hasLog(bD3, '石灰粉'), 'D7 战报有画面');
// 停轴：这一动的条到你选完才扣（思索不占账）——新开一场（石灰还在怀里）
var bD8 = newBattle(mkPlayer(), mkEnemy('游斗客', { aiBehavior: 'opportunist' }));
var fakeActor = { e: bD8.enemy, side: 'enemy', kind: 'enemyMain', bar: 150, rate: 10 };
stubRnd(0.2);
bD8._resolveActor(fakeActor);
Math.random = origRnd;
eq(fakeActor.bar, 150, 'D8 时间轴真停住——他这一动的条一点没扣');
assert(!!bD8._pendingPrompt, 'D9 姿态还挂着（没被吃掉）');
// 四条接法逐一兑现（推进桩掉，账干净）
function smokeResolve(idx) {
    var b = newBattle(mkPlayer(), mkEnemy('游斗客', { aiBehavior: 'opportunist' }));
    b._advanceTimeline = function () {};   // 桩掉推进：只看这一动的账
    var ea = b._findActor(b.enemy);
    ea.bar = 200;
    stubRnd(0.2);
    b._tryEnemyTrick();
    b.resolvePrompt(idx);
    Math.random = origRnd;
    return { b: b, bar: ea.bar };
}
var rAvert = smokeResolve(0);
eq(rAvert.bar, 40, 'D10 扭头纵跃：你耗条 60 他也慢半拍（200-60-100=40）');
assert(hasLog(rAvert.b, '扭头纵身跃开'), 'D11 战报有画面');
var rSleeve = smokeResolve(1);
eq(rSleeve.b._playerBlindHalf, 1, 'D12 抬袖遮面：下一手命中 -15');
eq(rSleeve.bar, 100, 'D13 袖子不吃条（200-100）');
var rTank = smokeResolve(2);
eq(rTank.b._playerBlind, 2, 'D14 闭眼硬吃：两手命中 -30');
eq(rTank.b._nextPlayerHitMul, 1.2, 'D15 怒火中烧：下一刀 ×1.2');
var rLeap = smokeResolve(3);
eq(rLeap.bar, 50, 'D16 闭眼后跃：他扑空慢半拍（200-50-100=50）');
// 装死：狗急跳墙（气血不足一半才会演）
var bD17 = newBattle();
bD17.enemy.physiology.bloodVolume = 30;
stubRnd(0.2);   // <0.35
eq(bD17._tryEnemyTrick(), true, 'D17 半血的他兵刃脱手栽倒——真倒还是装的？');
Math.random = origRnd;
eq(bD17._pendingPrompt.kind, 'feign', 'D18 应对面板挂上');
var probeOpt = bD17._pendingPrompt.options.filter(function (o) { return o.needItem === 'special_hidden_weapon'; })[0];
assert(!!probeOpt, 'D19 试探要吃真暗器（needItem 挂着，不是凭空弹）');
eq(bD17._foeTricks.feignUsed, true, 'D20 一场就演这一回（装死账立住）');
eq(bD17._tryEnemyTrick(), false, 'D21 演过就不再演（没有二连装死）');
// 装死的四条接法
function feignResolve(idx, seq) {
    var b = newBattle();
    b.enemy.physiology.bloodVolume = 30;
    b._advanceTimeline = function () {};
    var ea = b._findActor(b.enemy);
    ea.bar = 200;
    seqRnd(seq);   // 头一骰是他演不演（<0.35），后面才是你的遭遇骰
    b._tryEnemyTrick();
    b.resolvePrompt(idx);
    Math.random = origRnd;
    return { b: b, bar: ea.bar };
}
var rFinFoe = feignResolve(0, [0.2, 0.2]);   // 补刀——他是装的（<0.5）
assert(hasLog(rFinFoe.b, '装的'), 'D22 抢上前补刀——他猛地睁眼就地一滚（装的！）');
eq(rFinFoe.b._foeBackstabPending, 0, 'D23 他的暴起反击当场打出来（偷袭账不留夜）');
var rFinReal = feignResolve(0, [0.2, 0.9]);  // 补刀——真倒了
assert(hasLog(rFinReal.b, '真倒了'), 'D24 同一招换个骰：他是真倒了（反应不是剧本）');
var rWatch = feignResolve(1, [0.2]);
eq(rWatch.bar, 50, 'D25 退开看一会儿：「尸体」熬不住爬起来（他白耗半拍 200-50-100）');
var rProbeDuck = feignResolve(2, [0.2, 0.2]);
eq(rProbeDuck.bar, 70, 'D26 暗器试探：装死的沉不住气就地滚开（200-30-100）');
var bProbeHit = newBattle();
bProbeHit.enemy.physiology.bloodVolume = 30;
bProbeHit._advanceTimeline = function () {};
var bloodBefore = bProbeHit.enemy.physiology.bloodVolume;
seqRnd([0.2, 0.9]);
bProbeHit._tryEnemyTrick();
bProbeHit.resolvePrompt(2);
Math.random = origRnd;
assert(bProbeHit.enemy.physiology.bloodVolume < bloodBefore, 'D27 真倒的挨实一枚暗器（45 点穿伤是真伤）');
var rCallFoe = feignResolve(3, [0.2, 0.2]);
eq(rCallFoe.bar, 50, 'D28 叫阵点破：他骂骂咧咧爬起来（200-50-100）');
var bCallStill = newBattle();
bCallStill.enemy.physiology.bloodVolume = 30;
bCallStill._advanceTimeline = function () {};
var pa = bCallStill._findActor(bCallStill.player);
pa.bar = 10;
seqRnd([0.2, 0.9]);   // ≥0.5：地上没人应——你分了神，他先缓过气
bCallStill._tryEnemyTrick();
bCallStill.resolvePrompt(3);
Math.random = origRnd;
assert(pa.bar >= 40, 'D29 没人应你分了神——他先缓过一口气（你条 +30）');
// 面板账：没姿态就别乱选
var bD30 = newBattle();
eq(bD30.resolvePrompt(0), false, 'D30 没有姿态时选择口不开（不乱扣账）');

// ==================== E · 账本全是一次性 ====================
console.log('\n[E] 一次性账本（没有永久光环）');
var bE1 = newBattle();
bE1._playerBlind = 2;
stubRnd(0.5);
bE1.playerAttack('chest');
eq(bE1._playerBlind, 1, 'E1 石灰迷眼随你的手数消散（两手账打一手剩一手）');
bE1.playerAttack('chest');
eq(bE1._playerBlind, 0, 'E2 第二手打完眼睛睁开');
Math.random = origRnd;
var bE3 = newBattle();
bE3._playerBlindHalf = 1;
stubRnd(0.5);
bE3.playerAttack('chest');
Math.random = origRnd;
eq(bE3._playerBlindHalf, 0, 'E3 袖子挡的半瞎账也是一手清');
// 迷眼是真失准：同一骰平时打得着，迷了眼打不着
var bE4 = newBattle();
stubRnd(0.85);
var rE4 = bE4._executeAttack(bE4.player, bE4.enemy, 'chest', 'slash');
assert(rE4 && !rE4.missed, 'E4 没迷眼：骰 0.85 这一刀打得着');
bE4._playerBlind = 2;
var rE5 = bE4._executeAttack(bE4.player, bE4.enemy, 'chest', 'slash');
Math.random = origRnd;
assert(rE5 && rE5.missed === true, 'E5 迷了眼：同一骰劈空（命中 -30 真兑现）');
// 怒火一刀 ×1.2 同骰对账
var bE6 = newBattle();
stubRnd(0.5);
var e6base = bE6._calculateDamage(bE6.player, bE6.enemy, 0);
bE6._nextPlayerHitMul = 1.2;
var e6rage = bE6._calculateDamage(bE6.player, bE6.enemy, 0);
Math.random = origRnd;
eq(e6rage, Math.floor(e6base * 1.2), 'E6 带着石灰的仇 ×1.2（同骰对账）');
eq(bE6._nextPlayerHitMul, 0, 'E7 怒火一刀打完账就清');
assert(hasLog(bE6, '石灰的仇'), 'E8 战报点名这一刀的来历');
// 敌方偷袭账：他补刀那下 ×1.5，一次性
var bE9 = newBattle();
stubRnd(0.5);
var e9base = bE9._calculateDamage(bE9.enemy, bE9.player, 0);
bE9._foeBackstabPending = 1;
var e9stab = bE9._calculateDamage(bE9.enemy, bE9.player, 0);
Math.random = origRnd;
eq(e9stab, Math.floor(e9base * 1.5), 'E9 他暴起偷袭你也是 ×1.5（下作活儿两头都使）');
eq(bE9._foeBackstabPending, 0, 'E10 他的偷袭账同样一次性');

// ==================== F · 哨兵 ====================
console.log('\n[F] 哨兵');
var bSrc = src('js/battle.js');
['_foePersona', '_rollPersona', 'receiveSmoke', '_tryEnemyTrick', 'resolvePrompt', '_endPlayerAction'].forEach(function (fn) {
    assert(bSrc.indexOf(fn) >= 0, 'F1 引擎口子在正门：' + fn);
});
assert(bSrc.indexOf('_feigning') < 0, 'F2 旧固定账本清零（_feigning 不留残渣——反应全走性子）');
assert(bSrc.indexOf('_pendingPrompt') >= 0 && bSrc.indexOf('if (this._pendingPrompt) return;') >= 0, 'F3 时间轴真停在姿态上（条不扣轴不走）');
var appSrc = src('js/app.js');
assert(appSrc.indexOf('_renderBattlePrompt') >= 0 && appSrc.indexOf('battlePromptChoose') >= 0, 'F4 应对面板与选择口都挂上了');
assert(appSrc.indexOf('battle-prompt-panel') >= 0 && src('仙侠.html').indexOf('battle-prompt-panel') >= 0, 'F5 面板有窝（战斗栏里的容器）');
assert(appSrc.indexOf('needItem') >= 0 && appSrc.indexOf('special_hidden_weapon') >= 0, 'F6 试探真吃行囊里的暗器（按钮灰着不硬弹）');
assert(src('js/gameplay/talisman-system.js').indexOf('receiveSmoke') >= 0, 'F7 迷烟散走性格反应（不再是固定两回）');
assert(bSrc.indexOf('_personality') >= 0 && appSrc.indexOf('npcManager.getNPC') >= 0, 'F8 具名对手的五维性格档一路带进战斗');
var seg = bSrc.slice(bSrc.indexOf('// ===== 第九十四波·见招拆招'), bSrc.indexOf('// v10.0：使用招式攻击指定部位'));
var leak = null;
(seg.match(/'[^']+'/g) || []).forEach(function (q) {
    var v = q.slice(1, -1);
    if (/[+);({\[,?<>]/.test(v)) return;
    if (/^[a-z0-9_]+(?:[-_:. ][a-z0-9_]+)*$/i.test(v)) return;
    if (/^[A-Za-z0-9_\-:.\/#% ]+$/.test(v)) return;
    if (/[A-Za-z]/.test(v) && /[一-龥]/.test(v)) leak = leak || q;
});
eq(leak, null, 'F9 新话术零中英混排（漏: ' + leak + '）');
assert(seg.indexOf('每日') < 0 && seg.indexOf('次数已用完') < 0, 'F10 无人工计数器（石灰就一包、装死一场一回——都是世界账）');
assert(src('tests/run-all.sh').indexOf('wave94-trick-reactions-node.js') >= 0, 'F11 本套已挂全量回归');
delete global.currentBattle;

console.log('\n========== 第九十四波 · 见招拆招 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
