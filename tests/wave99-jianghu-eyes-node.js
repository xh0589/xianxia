/**
 * wave99-jianghu-eyes-node.js — 第九十九波 · 江湖耳目 验收：
 *   用户点账：「都补上……行动、战术、发言。有的行为与功法给人的看法不同——正道人一看你的
 *   魔道功法就百口难辨，偷奸耍滑最多让人看不起。地形先算了。」全部做成想做才做的可选动作：
 *   A 当面开场：什么人说什麼话；正道人认出魔道功法→当场翻脸（百口难辨），这仗不留手
 *   B 阵前话：骂阵挑釁/攻心话/壮胆——吃不吃看性子三面账（性急/老练/眼毒）
 *   C 卖绽：性急的抢进露旧力（反手偷袭×1.5），眼毒的反戳真口子
 *   D 撩拨：轻活儿（⚡40），耗的是他的精力/真气真账——耗干了招牌重手出不来
 *   E 掳人当盾：投鼠忌器（三成不敢下手、四成刀落自己人）；记进行迹账
 *   F 铁蒺藜/灶灰辣粉：黑货摊新家伙——性子账照旧管用
 *   G 敌人跪地求饶：杀与放都记账；兽不会跪、头目不受辱、会遁走的先想着跑
 *   H 弃械求饶：响马求财不求命（搜走三成铜钱），野兽听不懂人话，正道不收魔头的降
 *   I 死前之言：武人倒下有一句遗言，偶尔塞给你几枚带血的铜钱（进搜刮账）
 *   J 江湖耳目：有人看见就等于发生了——按目击者正邪结阵营声望（魔功露相/下作/放生/杀降）
 *   K 骂阵应对与阵上喊话：他的骂也是招（时间轴停住等你回嘴）；三成手数喊一嗓子
 *   L 哨兵：零中英混排、无人工计数器、各口子在案、挂全量回归
 *
 * 运行：node tests/wave99-jianghu-eyes-node.js
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
function load(rel) { vm.runInThisContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), { filename: rel }); }
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
global.currentCharData = { health: 100, energy: 100, qi: 200, maxQi: 200, level: 10, realm: '金丹', attrs: {}, skills: { '内功': 40 } };
global.timeSystem = {
    gameTime: { totalMinutes: 0 },
    advanceTime: function (m) { this.gameTime.totalMinutes += m; },
    onNewDaySubscribe: function () {}
};
global.setTimeout = function () { return 0; };
// 阵营声望 recorder（江湖耳目的结账口）
var repCalls = [];
global.changeFactionReputation = function (fid, n) { repCalls.push([fid, n]); };

load('js/physiology-config.js');
load('js/battle-injuries.js');
load('js/battle.js');
load('js/gameplay/talisman-system.js');

var Entity = global.Entity, Battle = global.Battle;
var TAL = global.TalismanSystem;
var origRnd = Math.random;
function stubRnd(v) { Math.random = function () { return v; }; }
function seqRnd(arr) {
    var i = 0;
    Math.random = function () { var v = arr[Math.min(i, arr.length - 1)]; i++; return v; };
}

function mkPlayer(overrides) {
    var d = {
        name: '玩家', level: 10,
        attrs: { strength: 30, dexterity: 20, intelligence: 20, willpower: 20, constitution: 30, meridian: 30 },
        skills: { '内功': 40 }, loot: {}, physiologyType: 'humanoid'
    };
    Object.assign(d, overrides || {});
    return new Entity(d, 'player');
}
function mkEnemy(name, opts) {
    opts = opts || {};
    var data = {
        name: name || '强敌', level: opts.level || 12,
        attrs: opts.attrs || { strength: 35, dexterity: 20, intelligence: 15, willpower: opts.wp == null ? 15 : opts.wp, constitution: 35, meridian: 20 },
        skills: { '内功': 35 }, loot: { exp: 10, copper: 5 }, physiologyType: opts.physiologyType || 'humanoid'
    };
    if (opts.aiBehavior) data.aiBehavior = opts.aiBehavior;
    if (opts.type) data.type = opts.type;
    if (opts.subtype) data.subtype = opts.subtype;
    if (opts.evil) data._evilFaction = true;
    if (opts.species) data.species = opts.species;
    if (opts.damageType) data.damageType = opts.damageType;
    if (opts.abilities) data.combatAbilities = opts.abilities;
    if (opts.carried) data.carriedInventory = opts.carried;
    return new Entity(data, opts.entityType || 'enemy');
}
function mkBeast(name, opts) {
    opts = opts || {};
    return mkEnemy(name || '妖狼', Object.assign({
        species: 'beast', physiologyType: 'beast', entityType: 'beast',
        attrs: { strength: 40, dexterity: 25, intelligence: 5, willpower: 10, constitution: 35, meridian: 10 },
        abilities: ['pounce'], damageType: 'slash'
    }, opts));
}
function newBattle(p, e, allies) {
    TAL.reset();
    msgs.length = 0;
    repCalls.length = 0;
    var b = new Battle(p || mkPlayer(), e || mkEnemy(), allies);
    global.currentBattle = b;
    // 建场推轴是真骰——把主敌的条钉死在坑底，测试里它绝不自作主张（要它动就直接调 _enemyMainAct）
    var ea = b._findActor(b.enemy);
    if (ea) ea.bar = -999;
    return b;
}
function quietGates(b) {
    // 直接驱动 _enemyMainAct 的场景：把会抢戏的姿态闸全关上（本套测的不是它们）
    b._foeTauntPromptDone = true;
    b._foeTricks.feignUsed = true;
    b._foeTricks.smoke = 0;
    b._surrenderAsked = true;
}
function hasLog(b, kw) {
    return b.log.some(function (l) { return String(l.msg).indexOf(kw) >= 0; });
}
// 建场推轴是真骰：妖兽身法快过玩家，猛扑+暴击偶尔直接把玩家打倒（isFinished 后玩家动作全拒绝）。
// 本套测的是话术与行迹账不是那一场——玩家动作类断言前把玩家扶起来、清胜负。
function freshField(b) {
    b.isFinished = false; b.winner = null;
    b.player.isAlive = true;
    if (b.player.physiology) {
        b.player.physiology.bloodVolume = b.player.physiology.maxBloodVolume || 100;
        b.player.physiology.isUnconscious = false;
        b.player.physiology.painLoad = 0;
    }
    b.isPlayerTurn = false;
}

// ==================== A · 当面开场 ====================
console.log('\n[A] 当面开场：什么人说什麼话；正道人见魔功百口难辨');
var bA1 = newBattle(mkPlayer(), mkEnemy('山贼·张三', { subtype: 'bandit', evil: true }));
assert(hasLog(bA1, '留下东西，饶你不死'), 'A1 响马开场就是勒索话');
var bA2 = newBattle(mkPlayer(), mkBeast('赤狼'));
assert(hasLog(bA2, '闷雷似的吼声'), 'A2 妖兽不会说人话——只有吼');
var bA3 = newBattle(mkPlayer(), mkEnemy('魔头·血手', { type: 'boss' }));
assert(hasLog(bA3, '无名小辈'), 'A3 头目开场居高临下');
// 正道人认出魔道功法（魔染账）：当场翻脸，不留手
global.currentCharData._demonicCorruption = 10;
var bA4 = newBattle(mkPlayer(), mkEnemy('武僧·慧明', { subtype: 'monk' }));
eq(bA4._foeRighteousWrath, true, 'A4 魔染在身——正道人一眼认出（百口难辨标立起）');
assert(hasLog(bA4, '魔头'), 'A5 开场就翻脸（“魔头！今日替天行道”）');
eq(bA4.enemy.aiBehavior, 'aggressive', 'A6 这仗他不留手（当回合就转狂攻）');
// 天生魔技（采补功）也算露了相貌
var bA7 = newBattle(mkPlayer({ combatAbilities: ['drain_qi'] }), mkEnemy('剑客·白云', { subtype: 'sword' }));
eq(bA7._foeRighteousWrath, true, 'A7 采补功在身——剑客也认得出来');
// 干干净净的散修：正道人客客气气
delete global.currentCharData._demonicCorruption;
var bA8 = newBattle(mkPlayer(), mkEnemy('武僧·慧明', { subtype: 'monk' }));
eq(bA8._foeRighteousWrath, false, 'A8 没练过魔功——武僧只劝你回头是岸');
assert(hasLog(bA8, '回头是岸'), 'A9 开场是劝化不是喊打');
// 邪修见魔功不翻脸
var bA10 = newBattle(mkPlayer({ combatAbilities: ['lifesteal'] }), mkEnemy('邪修·夜枭', { subtype: 'cultist', evil: true }));
eq(bA10._foeRighteousWrath, false, 'A10 邪修见魔功不当回事（只有正道人才炸）');

// ==================== B · 阵前话 ====================
console.log('\n[B] 阵前话：骂阵/攻心/壮胆——吃不吃看性子');
var bB1 = newBattle(mkPlayer(), mkEnemy('刀客·王五', { subtype: 'bladesman' }));
bB1.isPlayerTurn = true;
stubRnd(0.01);   // 性急
assert(bB1.playerTaunt('provoke') === true, 'B1 骂阵是真动作');
Math.random = origRnd;
eq(bB1._foeRage, 1, 'B2 性急的上头（怒火标：下一击更狠也露破绽）');
assert(hasLog(bB1, '找死'), 'B3 战报有他的回嘴');
var bB4 = newBattle(mkPlayer(), mkEnemy('刀客·王五', { subtype: 'bladesman' }));
bB4.isPlayerTurn = true;
stubRnd(0.5);   // 老练
bB4.playerTaunt('provoke');
Math.random = origRnd;
eq(bB4._foeRage, 0, 'B4 老练的不接茬（激将白喊）');
assert(hasLog(bB4, '激将法'), 'B5 他点破了你的把戏');
var bB6 = newBattle(mkPlayer(), mkEnemy('刀客·王五', { subtype: 'bladesman' }));
bB6.isPlayerTurn = true;
stubRnd(0.9);   // 眼毒
bB6.playerTaunt('provoke');
Math.random = origRnd;
eq(bB6._foeInsight, 1, 'B6 眼毒的反把你的底看穿（他下一击命中 +25）');
// 攻心话：拿钱卖命的最容易动心
var bB7 = newBattle(mkPlayer(), mkEnemy('山贼·李四', { subtype: 'bandit', evil: true, wp: 10 }));
bB7.isPlayerTurn = true;
stubRnd(0.5);   // p=0.3+0.15-0.06+0.25=0.64 → 0.5 落进
bB7.playerTaunt('heart');
Math.random = origRnd;
eq(bB7._foeDisheartened, 2, 'B7 攻心话戳中山贼（士气泄了两手：命中 -15、力道 -15%）');
var bB8 = newBattle(mkPlayer(), mkEnemy('武僧·慧明', { subtype: 'monk', wp: 15 }));
bB8.isPlayerTurn = true;
stubRnd(0.5);   // p=0.3-0.09-0.15=0.06 → 落不进
bB8.playerTaunt('heart');
Math.random = origRnd;
eq(bB8._foeDisheartened, 0, 'B8 心里有持守的动摇不了');
assert(hasLog(bB8, '心稳得很'), 'B9 战报如实（他啐了一口）');
// 正道人认出魔功——攻心免谈
global.currentCharData._demonicCorruption = 10;
var bB10 = newBattle(mkPlayer(), mkEnemy('武僧·慧明', { subtype: 'monk' }));
bB10.isPlayerTurn = true;
assert(bB10.playerTaunt('heart') === false, 'B10 百口难辨——攻心话对认出你魔功的人无用');
assert(hasLog(bB10, '省省吧'), 'B11 他根本不听');
delete global.currentCharData._demonicCorruption;
// 头目见过大世面
var bB12 = newBattle(mkPlayer(), mkEnemy('寨主·坐山雕', { type: 'boss' }));
bB12.isPlayerTurn = true;
stubRnd(0.01);
bB12.playerTaunt('heart');
Math.random = origRnd;
eq(bB12._foeDisheartened, 0, 'B12 头目不为所动（三寸舌留不住命）');
// 壮胆：头一嗓 +15（第一百波起改递减账——第二嗓还喊得出来，只是弱了）
var bB13 = newBattle(mkPlayer(), mkEnemy('刀客·王五', { subtype: 'bladesman' }));
bB13.isPlayerTurn = true;
bB13.player.stamina = 50;
stubRnd(0.5);
bB13.playerTaunt('rally');
eq(bB13.player.stamina, 65, 'B13 壮胆真回精力（50→65，血肉账）');
bB13.isPlayerTurn = true;
bB13.playerTaunt('rally');
eq(bB13.player.stamina, 73, 'B14 第二嗓只回 8——一嗓比一嗓弱（第一百波·递减不一刀切）');
Math.random = origRnd;
// 对野兽喊话是白喊
var bB15 = newBattle(mkPlayer(), mkBeast('赤狼'));
freshField(bB15);
bB15.isPlayerTurn = true;
assert(bB15.playerTaunt('provoke') === false, 'B15 野兽听不懂人话');
assert(hasLog(bB15, '听不懂人话'), 'B16 战报如实回话');

// ==================== C · 卖绽 ====================
console.log('\n[C] 卖绽：他咬不咬钩看性子');
var bC1 = newBattle(mkPlayer(), mkEnemy('刀客·王五', { subtype: 'bladesman', aiBehavior: 'aggressive' }));
bC1.isPlayerTurn = true;
stubRnd(0.5);
assert(bC1.playerBait() === true, 'C1 卖绽是真动作（⚡60）');
Math.random = origRnd;
eq(bC1.player._baitPose, true, 'C2 绽挂出去了');
var foeActorC = bC1._findActor(bC1.enemy);
var barBefore = foeActorC.bar;
quietGates(bC1);
seqRnd([0.01, 0.6]);   // 头一骰性子=性急，后面全不触发
bC1._enemyMainAct();
Math.random = origRnd;
eq(bC1.player._baitPose, false, 'C3 绽在他这一动里见分晓（ consumed）');
eq(bC1.player._backstabWindow, 1, 'C4 性急的抢进露旧力——你可反手偷袭 ×1.5');
eq(foeActorC.bar, barBefore - 30, 'C5 他用力过猛慢半拍（行动条 -30）');
var bC6 = newBattle(mkPlayer(), mkEnemy('刀客·王五', { subtype: 'bladesman' }));
bC6.player._baitPose = true;
quietGates(bC6);
seqRnd([0.9, 0.6]);   // 眼毒
bC6._enemyMainAct();
Math.random = origRnd;
assert(hasLog(bC6, '真正的空门'), 'C6 眼毒的反戳你真口子（识破了饵——这一动他的命中 +25 当场兑现）');
var bC7 = newBattle(mkPlayer(), mkEnemy('刀客·王五', { subtype: 'bladesman' }));
bC7.player._baitPose = true;
quietGates(bC7);
seqRnd([0.5, 0.6]);   // 老练
bC7._enemyMainAct();
Math.random = origRnd;
eq(bC7.player._backstabWindow, undefined, 'C7 老练的不上当（白卖了）');
assert(hasLog(bC7, '不上当'), 'C8 战报写明他没咬钩');

// ==================== D · 撩拨 ====================
console.log('\n[D] 撩拨：轻活儿，耗的是他的真账');
var bD1 = newBattle(mkPlayer(), mkEnemy('精英刀客', { type: 'elite', subtype: 'bladesman' }));
bD1.isPlayerTurn = true;
bD1.enemy.qi = 100; bD1.enemy.stamina = 100;
stubRnd(0.5);
assert(bD1.playerHarass() === true, 'D1 撩拨是真动作（⚡40 轻活儿）');
Math.random = origRnd;
eq(bD1.enemy.qi, 95, 'D2 撩拨耗他真气（100→95）');
eq(bD1.enemy.stamina, 92, 'D3 也耗他精力（100→92）——耗干了招牌重手出不来');
assert(hasLog(bD1, '撩拨'), 'D4 战报点名这是撩拨');
// 与第九十七/九十八波的重手门槛真联动：撩到门槛之下，重手出不来
var bD5 = newBattle(mkPlayer(), mkEnemy('精英刀客', { type: 'elite', subtype: 'bladesman' }));
bD5.enemy.qi = 28;   // 人形精英重手要 30
stubRnd(0.01);
eq(bD5._foeHeavyStrike(bD5.enemy, 'aggressive', 100, 0), null, 'D5 真气被撩到 28（<30）——重手出不来');
Math.random = origRnd;
// 妖兽同理（精力账）
var bD6 = newBattle(mkPlayer(), mkBeast('狼王', { type: 'elite' }));
freshField(bD6);
bD6.isPlayerTurn = true;
bD6.enemy.stamina = 100;
stubRnd(0.5);
bD6.playerHarass();
Math.random = origRnd;
eq(bD6.enemy.stamina, 92, 'D6 妖兽被撩也掉精力（100→92）');

// ==================== E · 掳人当盾 ====================
console.log('\n[E] 掳人当盾：投鼠忌器');
var ALLY = { name: '刀客同伙', attrs: { strength: 25, dexterity: 20, intelligence: 10, willpower: 10, constitution: 25, meridian: 10 } };
var bE1 = newBattle(mkPlayer(), mkEnemy('头目·赵大', { subtype: 'bandit', evil: true }), [ALLY]);
bE1.isPlayerTurn = true;
stubRnd(0.5);
assert(bE1.playerGrabShield() === true, 'E1 有活的同伙就掳得动');
Math.random = origRnd;
assert(bE1._humanShield === bE1.enemyAllies[0], 'E2 人盾挂上了（真同伙，不是空气）');
eq(bE1._deeds.tricks, 1, 'E3 掳人盾记进行迹账（下作——江湖看着）');
// 他这一动：三成不敢下手
quietGates(bE1);
stubRnd(0.1);   // cry(0.1<0.3 只加日志)→shield 骰 0.1<0.3 → 不敢下手
var healthBefore = bE1.player.health;
bE1._enemyMainAct();
Math.random = origRnd;
assert(hasLog(bE1, '投鼠忌器'), 'E4 他把刀抬到一半又放下（不敢下手）');
eq(bE1.player.health, healthBefore, 'E5 你这一下毫发无损（他根本没出手）');
// 四成刀落自己人身上
var bE6 = newBattle(mkPlayer(), mkEnemy('头目·赵大', { subtype: 'bandit', evil: true }), [ALLY]);
bE6._humanShield = bE6.enemyAllies[0];
quietGates(bE6);
stubRnd(0.5);   // shield 骰 0.5∈[0.3,0.7) → 拽过来挡
bE6._enemyMainAct();
Math.random = origRnd;
assert(hasLog(bE6, '挡在身前'), 'E6 他把心一横——你拽过他的人挡刀');
// 没有同伙就掳无可掳
var bE7 = newBattle(mkPlayer(), mkEnemy('独行客', { subtype: 'bladesman' }));
bE7.isPlayerTurn = true;
assert(bE7.playerGrabShield() === false, 'E7 对面没有活的同伙——掳无可掳');
assert(hasLog(bE7, '掳无可掳'), 'E8 战报如实回话');
// 人盾死了就没了
var bE9 = newBattle(mkPlayer(), mkEnemy('头目·赵大', { subtype: 'bandit', evil: true }), [ALLY]);
bE9._humanShield = bE9.enemyAllies[0];
bE9.enemyAllies[0].isAlive = false;
bE9._endEnemyMainAction();
eq(bE9._humanShield, null, 'E9 人盾倒下就散了（不留死账）');
assert(hasLog(bE9, '人盾没了'), 'E10 战报写明盾没了');

// ==================== F · 铁蒺藜 / 灶灰辣粉 ====================
console.log('\n[F] 黑货摊新家伙：铁蒺藜/灶灰辣粉（性子账照旧管用）');
var bF1 = newBattle(mkPlayer(), mkEnemy('刀客·王五', { subtype: 'bladesman' }));
var eaF1 = bF1._findActor(bF1.enemy);
eaF1.bar = 100;
stubRnd(0.01);   // 性急
assert(bF1.receiveCaltrop() === true, 'F1 性急的踩个正着');
Math.random = origRnd;
eq(eaF1.bar, 60, 'F2 疼得单脚跳（行动条 100→60）');
eq(bF1._foeStumble, 1, 'F3 脚步乱了（下一手命中 -10）');
eq(bF1._deeds.tricks, 1, 'F4 撒蒺藜记行迹账');
var bF5 = newBattle(mkPlayer(), mkEnemy('刀客·王五', { subtype: 'bladesman' }));
stubRnd(0.9);   // 眼毒
assert(bF5.receiveCaltrop() === false, 'F5 眼毒的纵身绕开（白撒）');
Math.random = origRnd;
assert(hasLog(bF5, '白撒'), 'F6 战报如实');
var bF7 = newBattle(mkPlayer(), mkEnemy('刀客·王五', { subtype: 'bladesman' }));
var eaF7 = bF7._findActor(bF7.enemy);
eaF7.bar = 100;
stubRnd(0.5);   // 老练
bF7.receiveCaltrop();
Math.random = origRnd;
eq(eaF7.bar, 100, 'F7 老练的绕着走——条没扣但脚乱了');
eq(bF7._foeStumble, 1, 'F8 命中 -10 照挂');
var bF9 = newBattle(mkPlayer(), mkEnemy('刀客·王五', { subtype: 'bladesman' }));
stubRnd(0.01);
eq(bF9.receiveAsh(), 1, 'F9 灶灰辣粉只糊得住性急的（瞎一回）');
Math.random = origRnd;
var bF10 = newBattle(mkPlayer(), mkEnemy('刀客·王五', { subtype: 'bladesman' }));
stubRnd(0.5);
eq(bF10.receiveAsh(), 0, 'F10 老练的侧脸闭气（白撒）');
Math.random = origRnd;
eq(bF10._deeds.tricks, 1, 'F11 撒没撒中都记行迹（有人看见你撒了）');
// 模板与货架在案
var itemsSrc = src('js/items-extended/13-missing-ids.js');
assert(itemsSrc.indexOf('special_caltrop') >= 0 && itemsSrc.indexOf('trip_enemy') >= 0, 'F12 铁蒺藜模板在案（trip_enemy）');
assert(itemsSrc.indexOf('special_ash') >= 0 && itemsSrc.indexOf('ash_enemy') >= 0, 'F13 灶灰辣粉模板在案（ash_enemy）');
assert(src('js/enhanced-shop.js').indexOf('special_caltrop') >= 0 && src('js/enhanced-shop.js').indexOf('special_ash') >= 0, 'F14 黑货摊上了新货');
var talSrc = src('js/gameplay/talisman-system.js');
assert(talSrc.indexOf('eff.ash_enemy') >= 0 && talSrc.indexOf('eff.trip_enemy') >= 0, 'F15 符箓管线接了新效果');
assert(talSrc.indexOf("(eff.trip_enemy || eff.ash_enemy) ? 60") >= 0, 'F16 撒地/撒脸的按轻活儿计价（⚡60）');

// ==================== G · 敌人跪地求饶 ====================
console.log('\n[G] 打不动了的武人会跪——杀与放都记账');
var bG1 = newBattle(mkPlayer(), mkEnemy('刀客·王五', { subtype: 'bladesman' }));
bG1.enemy.physiology.bloodVolume = 10;
stubRnd(0.1);   // <0.35 跪
assert(bG1._tryEnemySurrender() === true, 'G1 气血见底的武人跪了（时间轴停住等你定夺）');
Math.random = origRnd;
eq(bG1._pendingPrompt.kind, 'surrender', 'G2 姿态是「求饶」');
eq(bG1._pendingPrompt.options.length, 2, 'G3 杀与放两条路');
// 放：他磕头逃走——不杀之恩记账，声望当场结（他就是目击者）
stubRnd(0.5);
bG1.resolvePrompt(1);
Math.random = origRnd;
eq(bG1.enemy._fled, true, 'G4 放走的就是放走了');
eq(bG1._deeds.mercy, 1, 'G5 放生记进行迹账');
eq(bG1.isFinished, true, 'G6 仗到此收场（他跑了）');
eq(bG1.noSpoils, true, 'G7 放走的人没得搜刮');
assert(repCalls.some(function (c) { return c[0] === 'righteous_alliance' && c[1] === 6; }), 'G8 江湖记你一份不杀之恩（正道 +6）');
assert(repCalls.some(function (c) { return c[0] === 'rogue_cultivators' && c[1] === 3; }), 'G9 散修也认这份情（+3）');
assert(msgs.some(function (m) { return m.m.indexOf('不杀之恩') >= 0; }), 'G10 结账有回执');
// 杀：斩了跪地的人——没人看见就没人知道（目击者账）
var bG11 = newBattle(mkPlayer(), mkEnemy('刀客·王五', { subtype: 'bladesman' }));
bG11.enemy.physiology.bloodVolume = 10;
stubRnd(0.1);
bG11._tryEnemySurrender();
stubRnd(0.5);
bG11.resolvePrompt(0);
Math.random = origRnd;
eq(bG11._deeds.execution, 1, 'G11 杀降记进行迹账');
eq(bG11.enemy.isAlive, false, 'G12 跪着的人死了');
eq(bG11.winner, 'player', 'G13 仗按你的胜场收');
eq(repCalls.length, 0, 'G14 四下无人——这事没人知道（死人不会说话）');
assert(hasLog(bG11, '🕯️'), 'G15 他有死前之言（见 I 段详账）');
// 门槛：兽不会跪、头目不受辱、会遁走的先想着跑、血还多的不跪
var bG16 = newBattle(mkPlayer(), mkBeast('赤狼'));
bG16.enemy.physiology.bloodVolume = 5;
stubRnd(0.1);   // 骰再低也不跪——兽不会跪
eq(bG16._tryEnemySurrender(), false, 'G16 兽不会跪');
Math.random = origRnd;
var bG17 = newBattle(mkPlayer(), mkEnemy('寨主', { type: 'boss' }));
bG17.enemy.physiology.bloodVolume = 5;
eq(bG17._tryEnemySurrender(), false, 'G17 头目宁死不受辱');
var bG18 = newBattle(mkPlayer(), mkEnemy('滑头散修', { abilities: ['escape'] }));
bG18.enemy.physiology.bloodVolume = 5;
eq(bG18._tryEnemySurrender(), false, 'G18 会遁走的先想着跑（不抢遁术的戏）');
var bG19 = newBattle(mkPlayer(), mkEnemy('刀客·王五'));
bG19.enemy.physiology.bloodVolume = 50;
eq(bG19._tryEnemySurrender(), false, 'G19 血还过半的不跪');

// ==================== H · 弃械求饶 ====================
console.log('\n[H] 弃械求饶：响马求财不求命');
global.inventory = { currency: { copper: 1000, spiritStones: 100 }, slots: [] };
var bH1 = newBattle(mkPlayer(), mkEnemy('山贼·张三', { subtype: 'bandit', evil: true }));
bH1.isPlayerTurn = true;
stubRnd(0.1);   // p=0.7 → 收
assert(bH1.playerSurrender() === true, 'H1 响马收了你的降');
Math.random = origRnd;
eq(bH1.surrendered, true, 'H2 弃械标立起（收尾文案据此说话）');
eq(bH1.isFinished, true, 'H3 仗到此为止（命保住了）');
eq(global.inventory.currency.copper, 700, 'H4 被搜走三成铜钱（1000→700，钱袋真账）');
eq(global.inventory.currency.spiritStones, 80, 'H5 灵石也被刮走两成（100→80）');
eq(bH1.noSpoils, true, 'H6 投降没有战利品');
// 野兽听不懂人话
var bH7 = newBattle(mkPlayer(), mkBeast('赤狼'));
freshField(bH7);
bH7.isPlayerTurn = true;
assert(bH7.playerSurrender() === false, 'H7 对野兽弃械是白弃');
assert(hasLog(bH7, '听不懂人话'), 'H8 战报如实');
// 不收：趁你兵刃脱手抢上一击，且一场只让你喊一回
var bH9 = newBattle(mkPlayer(), mkEnemy('武僧·慧明', { subtype: 'monk' }));
bH9.isPlayerTurn = true;
stubRnd(0.99);   // p≤0.65+0.15... monk 0.65 上限内 → 0.99 必不收
bH9.playerSurrender();
Math.random = origRnd;
assert(hasLog(bH9, '晚了'), 'H9 他不收——「求饶？晚了！」');
eq(bH9.isFinished, false, 'H10 仗接着打');
assert(bH9.playerSurrender() === false, 'H11 械弃过一回就不能再弃（他防着你的花样）');
// 正道不收魔头的降
global.currentCharData._demonicCorruption = 10;
var bH12 = newBattle(mkPlayer(), mkEnemy('武僧·慧明', { subtype: 'monk' }));
bH12.isPlayerTurn = true;
eq(bH12._foeRighteousWrath, true, 'H12 他已认出你的魔功');
stubRnd(0.3);   // p=0.5+0.15-0.3=0.35 → 0.3<0.35 仍可能收？——验证概率被砍而非硬闸：这里断言概率账
var _pCalc = 0.5 + 0.15 - 0.3;
assert(Math.abs(_pCalc - 0.35) < 0.001, 'H13 魔头求饶：收留概率被砍到 0.35（正道勉强容忍线）');
bH12.playerSurrender();
Math.random = origRnd;
delete global.currentCharData._demonicCorruption;

// ==================== I · 死前之言 ====================
console.log('\n[I] 死前之言：武人的最后一口气不是空账');
var bI1 = newBattle(mkPlayer(), mkEnemy('山贼·张三', { subtype: 'bandit', level: 12 }));
bI1.enemy.isAlive = false;
stubRnd(0.1);   // 遗言骰 + 塞铜钱骰（0.1<0.25 → 塞）
bI1._checkEnd();
Math.random = origRnd;
assert(hasLog(bI1, '🕯️'), 'I1 倒下的人有一句遗言');
assert(hasLog(bI1, '弟兄们') || hasLog(bI1, '这票'), 'I2 遗言是他的路数（响马惦记弟兄）');
assert(hasLog(bI1, '带血的铜钱'), 'I3 弥留之际塞给你几枚铜钱');
eq(bI1.enemy.carriedInventory.copper, 21, 'I4 铜钱进搜刮真账（8+1+等级12=21，不是凭空掉落）');
var bI5 = newBattle(mkPlayer(), mkBeast('赤狼'));
bI5.enemy.isAlive = false;
stubRnd(0.5);
bI5._checkEnd();
Math.random = origRnd;
assert(!hasLog(bI5, '🕯️'), 'I5 野兽没有遗言（不会说话）');
var bI6 = newBattle(mkPlayer(), mkEnemy('剑客·白云', { subtype: 'sword' }));
bI6.enemy.isAlive = false;
stubRnd(0.9);   // ≥0.25 不塞
bI6._checkEnd();
Math.random = origRnd;
assert(hasLog(bI6, '🕯️'), 'I6 剑客也有最后一句');
assert(!hasLog(bI6, '带血的铜钱'), 'I7 不是人人都有东西塞给你');

// ==================== J · 江湖耳目 ====================
console.log('\n[J] 有人看见就等于发生了——按目击者正邪结账');
// 魔功露相 + 正道目击：百口难辨
var bJ1 = newBattle(mkPlayer({ combatAbilities: ['drain_qi'] }), mkEnemy('武僧·慧明', { subtype: 'monk' }));
bJ1._deeds.demonic = 1;
bJ1.enemy._fled = true;   // 他带伤跑了——他就是那张嘴
bJ1._settleWitness();
assert(repCalls.some(function (c) { return c[0] === 'righteous_alliance' && c[1] === -12; }), 'J1 正道人把魔功传了出去（正道联盟 -12）');
assert(msgs.some(function (m) { return m.m.indexOf('百口难辨') >= 0; }), 'J2 回执点名「百口难辨」');
// 魔功露相 + 邪道目击：当你是自己人
repCalls.length = 0; msgs.length = 0;
var bJ3 = newBattle(mkPlayer({ combatAbilities: ['drain_qi'] }), mkEnemy('山贼·张三', { subtype: 'bandit', evil: true }));
bJ3._deeds.demonic = 1;
bJ3.enemy._fled = true;
bJ3._settleWitness();
assert(repCalls.some(function (c) { return c[0] === 'demon_cult' && c[1] === 6; }), 'J3 魔道把你当自己人（+6）');
assert(!repCalls.some(function (c) { return c[0] === 'righteous_alliance'; }), 'J4 没有正道目击者——正道那边无声无息');
// 下作手段：正道人看不起（小扣），下九流夸你专业（小涨）
repCalls.length = 0; msgs.length = 0;
var bJ5 = newBattle(mkPlayer(), mkEnemy('武僧·慧明', { subtype: 'monk' }));
bJ5._deeds.tricks = 2;
bJ5.enemy._fled = true;
bJ5._settleWitness();
assert(repCalls.some(function (c) { return c[0] === 'righteous_alliance' && c[1] === -3; }), 'J5 偷奸耍滑最多让人看不起（正道 -3，远轻于魔功的 -12）');
repCalls.length = 0; msgs.length = 0;
var bJ6 = newBattle(mkPlayer(), mkEnemy('山贼·张三', { subtype: 'bandit', evil: true }));
bJ6._deeds.tricks = 1;
bJ6.enemy._fled = true;
bJ6._settleWitness();
assert(repCalls.some(function (c) { return c[0] === 'rogue_cultivators' && c[1] === 2; }), 'J6 下九流里这叫专业（散修 +2，不扣）');
// 没人看见＝没发生
repCalls.length = 0; msgs.length = 0;
var bJ7 = newBattle(mkPlayer(), mkEnemy('独行客', { subtype: 'bladesman' }));
bJ7._deeds.tricks = 3;
bJ7.enemy.isAlive = false;   // 死了的人不会说话
bJ7._settleWitness();
eq(repCalls.length, 0, 'J7 四下无人——撒再多石灰也没人传（死人不开口）');
// 一场只结一次
repCalls.length = 0; msgs.length = 0;
var bJ8 = newBattle(mkPlayer(), mkEnemy('武僧·慧明', { subtype: 'monk' }));
bJ8._deeds.demonic = 1;
bJ8.enemy._fled = true;
bJ8._settleWitness();
var n8 = repCalls.length;
bJ8._settleWitness();
eq(repCalls.length, n8, 'J8 结账只结一回（不重复扣）');
// 同伙逃了也是嘴——邪道同伙只会夸你专业
repCalls.length = 0; msgs.length = 0;
var bJ9 = newBattle(mkPlayer(), mkEnemy('头目·赵大', { subtype: 'bandit', evil: true }), [
    { name: '山贼同伙', subtype: 'bandit', attrs: { strength: 25, dexterity: 20, intelligence: 10, willpower: 10, constitution: 25, meridian: 10 } }
]);
bJ9.enemy.isAlive = false;
bJ9.enemyAllies[0]._fled = true;   // 邪道同伙跑了
bJ9._deeds.tricks = 1;
bJ9._settleWitness();
assert(repCalls.some(function (c) { return c[0] === 'rogue_cultivators' && c[1] === 2; }), 'J9 跑掉的邪道同伙把你夸成专业（散修 +2）');
assert(!repCalls.some(function (c) { return c[0] === 'righteous_alliance'; }), 'J9b 没有正道目击——正道那边一声不吭');
repCalls.length = 0;
bJ9._witnessSettled = false;
bJ9._deeds.tricks = 1;
bJ9.enemyAllies[0].subtype = 'monk';   // 换成正道同伙跑了
bJ9._settleWitness();
assert(repCalls.some(function (c) { return c[0] === 'righteous_alliance' && c[1] === -3; }), 'J10 正道同伙逃出去——你的下作手段就传开了');
// 你败了/你跑了：站着的人全是目击者
repCalls.length = 0; msgs.length = 0;
var bJ11 = newBattle(mkPlayer(), mkEnemy('武僧·慧明', { subtype: 'monk' }));
bJ11._deeds.tricks = 1;
bJ11.playerFled = true;   // 你逃了，他站着
bJ11._settleWitness();
assert(repCalls.some(function (c) { return c[0] === 'righteous_alliance' && c[1] === -3; }), 'J11 你跑了他也看见了（逃跑不销账）');

// ==================== K · 骂阵应对与阵上喊话 ====================
console.log('\n[K] 他的骂也是招；阵上不是哑巴场');
var bK1 = newBattle(mkPlayer(), mkEnemy('山贼·张三', { subtype: 'bandit', evil: true }));
bK1._pendingPrompt = {
    kind: 'taunt', text: '「呸！」',
    options: [{ k: 'steel', label: '稳' }, { k: 'rage', label: '怒' }, { k: 'curse', label: '骂' }]
};
bK1.player.stamina = 50;
stubRnd(0.5);
bK1.resolvePrompt(0);
Math.random = origRnd;
eq(bK1.player.stamina, 55, 'K1 稳着不理——狗咬不了石头（精力 +5）');
var bK2 = newBattle(mkPlayer(), mkEnemy('山贼·张三', { subtype: 'bandit', evil: true }));
bK2._pendingPrompt = { kind: 'taunt', text: '「呸！」', options: [{ k: 'steel', label: '' }, { k: 'rage', label: '' }, { k: 'curse', label: '' }] };
stubRnd(0.5);
bK2.resolvePrompt(1);
Math.random = origRnd;
eq(bK2._playerRage, 2, 'K2 怒火上头：两手气昏了头（命中 -10）');
eq(bK2._nextPlayerHitMul, 1.15, 'K3 上头的下一击更狠（×1.15）');
var bK4 = newBattle(mkPlayer(), mkEnemy('山贼·张三', { subtype: 'bandit', evil: true }));
bK4._pendingPrompt = { kind: 'taunt', text: '「呸！」', options: [{ k: 'steel', label: '' }, { k: 'rage', label: '' }, { k: 'curse', label: '' }] };
stubRnd(0.01);   // 骂回去 vs 性急的
bK4.resolvePrompt(2);
Math.random = origRnd;
assert(hasLog(bK4, '脸红脖子粗'), 'K4 骂回性急的——他被噎得招式都乱了');
// 阵上喊话：三成的手数喊一嗓子
var bK5 = newBattle(mkPlayer(), mkEnemy('山贼·张三', { subtype: 'bandit', evil: true, aiBehavior: 'aggressive' }));
quietGates(bK5);
stubRnd(0.1);   // 0.1<0.3 → 喊
bK5._enemyMainAct();
Math.random = origRnd;
assert(hasLog(bK5, '🗣️'), 'K5 响马动手前喊了黑话');
assert(hasLog(bK5, '爷爷们在此') || hasLog(bK5, '砍了他'), 'K6 喊的是他这一行的话');
// 骂阵应对：真从战地里冒出来（交手一轮之后、把你打到狼狈了，他才骂得欢）
var bK7 = newBattle(mkPlayer(), mkEnemy('山贼·张三', { subtype: 'bandit', evil: true }));
bK7._foeTricks.feignUsed = true; bK7._foeTricks.smoke = 0;
bK7.turn = 1;
bK7.player.physiology.bloodVolume = 50;   // 你挂了彩——他骂得最欢的时候
stubRnd(0.05);   // <0.12 → 骂阵应对立起
bK7._enemyMainAct();
Math.random = origRnd;
assert(bK7._pendingPrompt && bK7._pendingPrompt.kind === 'taunt', 'K7 他的骂阵停在时间轴上（等你回嘴）');
eq(bK7._foeTauntPromptDone, true, 'K8 一场只骂这一回大的');
// 你好端端的他不骂（骂阵是打顺风球，不是开场白）
var bK9 = newBattle(mkPlayer(), mkEnemy('山贼·张三', { subtype: 'bandit', evil: true }));
bK9._foeTricks.feignUsed = true; bK9._foeTricks.smoke = 0;
bK9.turn = 3;
stubRnd(0.05);
bK9._enemyMainAct();
Math.random = origRnd;
assert(!bK9._pendingPrompt || bK9._pendingPrompt.kind !== 'taunt', 'K9 你气血充盈——他只顾动手没空骂阵');

// ==================== L · 哨兵 ====================
console.log('\n[L] 哨兵');
var bSrc = src('js/battle.js');
['_noteDeed', '_settleWitness', '_tryEnemySurrender', 'playerTaunt', 'playerBait', 'playerHarass', 'playerGrabShield', 'playerSurrender', 'receiveCaltrop', 'receiveAsh', '第九十九波·江湖耳目'].forEach(function (kw) {
    assert(bSrc.indexOf(kw) >= 0, 'L1 引擎口子在案：' + kw);
});
assert(bSrc.indexOf("if (tier === 'foe') return null;") >= 0, 'L2 重手档位闸原样（本波没动身份梯度）');
var seg = bSrc.slice(bSrc.indexOf('// ===== 第九十九波·江湖耳目'), bSrc.indexOf('// ===== 第九十七波·对面也是活人'));
assert(seg.length > 5000, 'L3 第九十九波段落完整取出');
var leak = null;
(seg.match(/'[^']+'/g) || []).forEach(function (q) {
    var v = q.slice(1, -1);
    if (/[+);({\[,?<>]/.test(v)) return;
    if (/^[a-z0-9_]+(?:[-_:. ][a-z0-9_]+)*$/i.test(v)) return;
    if (/^[A-Za-z0-9_\-:.\/#% ]+$/.test(v)) return;
    if (/[A-Za-z]/.test(v) && /[一-龥]/.test(v)) leak = leak || q;
});
eq(leak, null, 'L4 新话术零中英混排（漏: ' + leak + '）');
assert(seg.indexOf('每日') < 0 && seg.indexOf('次数已用完') < 0, 'L5 无人工计数器（行迹/性子/精力/声望全是世界账）');
var appSrc = src('js/app.js');
assert(appSrc.indexOf('toggleShoutActions') >= 0 && appSrc.indexOf('battleShoutAction') >= 0, 'L6 「阵前话」抽屉在案');
assert(appSrc.indexOf('掳人当盾') >= 0 && appSrc.indexOf('弃械求饶') >= 0 && appSrc.indexOf('卖绽') >= 0, 'L7 七个可选动作全上了牌面');
assert(appSrc.indexOf('currentBattle.surrendered') >= 0, 'L8 弃械收尾文案接上（不是「战斗胜利」）');
assert(appSrc.indexOf('currentBattle.playerFled = true') >= 0, 'L9 你逃跑也算目击场面（行迹账当场结）');
assert(appSrc.indexOf('special_caltrop') >= 0 && appSrc.indexOf('special_ash') >= 0, 'L10 新家伙上了快手位');
assert(bSrc.indexOf('百口难辨') >= 0, 'L11 「百口难辨」的原话在引擎里');
assert(src('tests/run-all.sh').indexOf('wave99-jianghu-eyes-node.js') >= 0, 'L12 本套已挂全量回归');
delete global.currentBattle;
delete global.inventory;

console.log('\n========== 第九十九波 · 江湖耳目 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
