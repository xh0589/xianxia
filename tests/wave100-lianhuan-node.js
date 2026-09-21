/**
 * wave100-lianhuan-node.js — 第一百波 · 连环手 验收：
 *   用户点账：「这些行为会不会限制的太死？要不要使用组合？」——方案全做（甲乙丙丁戊）：
 *   A 上头+卖绽：怒气冲头的人不分真假——上头时钩必咬（无论性子），反手 ×1.8、行动条 -30
 *   B 心散+跪地：心气散了的人更容易跪——触发线 12%→20%，肯跪概率 35%→55%
 *   C 脚乱+撩拨：踩着蒺藜站不稳——撩拨必中、耗力翻倍（16/10 对 8/5）
 *   D 眼瞎+人盾：两眼糊着泪更不敢下刀——犹豫 30%→50%，砍也多半砍着人盾（70%→85%）
 *   E 看穿也有代价：老练的看穿卖绽要收步换架势（条 -10）；眼毒的纵身/拂袖也费力（精力 -5）——没有纯白干的招
 *   F 对面也连环：上头的敌人重手耗头减一成（27/36 对 30/40）；心散的敌人更早想着跑（血线 40、念头 60%）
 *   G 壮胆改递减：一场三嗓——+15/+8/+4，不再一刀切
 *   H 哨兵：档位闸未动、无人工计数器、牌面提示在案、挂全量回归
 *
 * 运行：node tests/wave100-lianhuan-node.js
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
    b._foeTauntPromptDone = true;
    b._foeTricks.feignUsed = true;
    b._foeTricks.smoke = 0;
    b._surrenderAsked = true;
}
function hasLog(b, kw) {
    return b.log.some(function (l) { return String(l.msg).indexOf(kw) >= 0; });
}
var ALLY = { name: '刀客同伙', attrs: { strength: 25, dexterity: 20, intelligence: 10, willpower: 10, constitution: 25, meridian: 10 } };

// ==================== A · 上头 + 卖绽 ====================
console.log('\n[A] 连环手·上头+卖绽：怒气冲头的人不分真假');
var bA1 = newBattle(mkPlayer(), mkEnemy('刀客·王五', { subtype: 'bladesman', aiBehavior: 'aggressive' }));
bA1._foeRage = 1;
bA1.player._baitPose = true;
quietGates(bA1);
var foeA = bA1._findActor(bA1.enemy);
var barA = foeA.bar;
seqRnd([0.5, 0.6]);   // 性子骰给老练——上头了也照样咬钩（连环压过性子）
bA1._enemyMainAct();
Math.random = origRnd;
assert(hasLog(bA1, '不分真假'), 'A1 上头时钩必咬（战报写明「怒气冲头的人不分真假」）');
eq(bA1.player._backstabWindow, 1, 'A2 老练的性子也咬了钩——反手窗口打开');
assert((bA1._nextPlayerHitMul || 0) >= 1.8, 'A3 扑得太猛刀势又空——反手这一下 ×1.8');
eq(foeA.bar, barA - 30, 'A4 他慢半拍（行动条 -30，条可欠账不夹 0）');
// 反手的倍率真兑现（刚挨了一刀带着剧痛——先把疼痛账清了再出招，不然疼得使不出手）
bA1.isPlayerTurn = true;
if (bA1.player.physiology) bA1.player.physiology.painLoad = 0;
stubRnd(0.5);   // 命中骰过、闪避骰不过（0.01 会撞上闪避）
bA1._executeAttack(bA1.player, bA1.enemy, 'abdomen', 'slash');
Math.random = origRnd;
assert(hasLog(bA1, '偷袭！（×1.8）'), 'A5 反手一刀真按 ×1.8 结账（战报点名倍率）');
eq(bA1.player._backstabWindow, 0, 'A6 窗口用完即收（一次性真账）');
// 没上头的老练：看穿要付架势钱（乙），但钩不咬
var bA7 = newBattle(mkPlayer(), mkEnemy('刀客·王五', { subtype: 'bladesman' }));
bA7.player._baitPose = true;
quietGates(bA7);
var foeA7 = bA7._findActor(bA7.enemy);
var barA7 = foeA7.bar;
seqRnd([0.5, 0.6]);   // 老练
bA7._enemyMainAct();
Math.random = origRnd;
eq(bA7.player._backstabWindow, undefined, 'A7 没上头的老练还是不上当');
eq(foeA7.bar, barA7 - 10, 'A8 但看穿也有代价——收步换架势花了功夫（行动条 -10）');
assert(hasLog(bA7, '行动条 -10'), 'A9 战报把这笔代价写给他看');
// 没上头的性急：照旧 ×1.5 口径（不吃连环加成）
var bA10 = newBattle(mkPlayer(), mkEnemy('刀客·王五', { subtype: 'bladesman' }));
bA10.player._baitPose = true;
quietGates(bA10);
seqRnd([0.01, 0.6]);   // 性急
bA10._enemyMainAct();
Math.random = origRnd;
eq(bA10.player._backstabWindow, 1, 'A10 性急的照旧抢进露旧力');
assert(!bA10._nextPlayerHitMul, 'A11 没上头就没有 ×1.8 的加成（连环是挣来的不是白给的）');

// ==================== B · 心散 + 跪地 ====================
console.log('\n[B] 连环手·心散+跪地：气散了的人更容易跪');
function lowBloodEnemy(b, pct) {
    if (b.enemy.physiology) {
        b.enemy.physiology.bloodVolume = (b.enemy.physiology.maxBloodVolume || 100) * pct / 100;
    }
    return b;
}
var bB1 = lowBloodEnemy(newBattle(mkPlayer(), mkEnemy('山贼·张三', { subtype: 'bandit', evil: true })), 15);
bB1._foeDisheartened = 1;
stubRnd(0.4);   // 0.4 < 0.55：心散的人过半肯跪
assert(bB1._tryEnemySurrender() === true, 'B1 血 15%（老线 12 之上、新线 20 之下）+心散——他跪了');
Math.random = origRnd;
eq(bB1._pendingPrompt.kind, 'surrender', 'B2 时间轴停住——杀与放还是你来定');
assert(hasLog(bB1, '心气早被你打散了'), 'B3 战报点明这是攻心话的连环');
// 心没散：老线照旧（12% 以下才跪、35% 概率）
var bB4 = lowBloodEnemy(newBattle(mkPlayer(), mkEnemy('山贼·张三', { subtype: 'bandit', evil: true })), 15);
stubRnd(0.1);
eq(bB4._tryEnemySurrender(), false, 'B4 心没散的人血 15% 还撑着（老线 12% 未动）');
Math.random = origRnd;
// 心散了也有底线：两成之上不跪
var bB5 = lowBloodEnemy(newBattle(mkPlayer(), mkEnemy('山贼·张三', { subtype: 'bandit', evil: true })), 25);
bB5._foeDisheartened = 2;
stubRnd(0.1);
eq(bB5._tryEnemySurrender(), false, 'B5 心散了血还有两成五——没到跪的份上');
Math.random = origRnd;

// ==================== C · 脚乱 + 撩拨 ====================
console.log('\n[C] 连环手·脚乱+撩拨：站不稳躲不开轻活儿');
var bC1 = newBattle(mkPlayer(), mkEnemy('精英刀客', { type: 'elite', subtype: 'bladesman' }));
bC1.isPlayerTurn = true;
bC1.enemy.stamina = 100; bC1.enemy.qi = 100;
bC1._foeStumble = 1;
stubRnd(0.5);
assert(bC1.playerHarass() === true, 'C1 撩拨照旧是真动作（⚡40）');
Math.random = origRnd;
eq(bC1.enemy.stamina, 84, 'C2 踩着蒺藜被撩——精力耗翻倍（100→84）');
eq(bC1.enemy.qi, 90, 'C3 真气也耗翻倍（100→90）');
assert(hasLog(bC1, '趁他脚下正乱'), 'C4 战报点名这是连环');
// 没脚乱：老账不动
var bC5 = newBattle(mkPlayer(), mkEnemy('精英刀客', { type: 'elite', subtype: 'bladesman' }));
bC5.isPlayerTurn = true;
bC5.enemy.stamina = 100; bC5.enemy.qi = 100;
stubRnd(0.5);
bC5.playerHarass();
Math.random = origRnd;
eq(bC5.enemy.stamina, 92, 'C5 没脚乱就是老耗头（精力 -8）');
eq(bC5.enemy.qi, 95, 'C6 真气 -5 照旧');

// ==================== D · 眼瞎 + 人盾 ====================
console.log('\n[D] 连环手·眼瞎+人盾：看不见的人更不敢下刀');
var origBlindFn = TAL.getEnemyBlindTurns;
var bD1 = newBattle(mkPlayer(), mkEnemy('头目·赵大', { subtype: 'bandit', evil: true }), [ALLY]);
bD1._humanShield = bD1.enemyAllies[0];
quietGates(bD1);
TAL.getEnemyBlindTurns = function () { return 2; };
stubRnd(0.4);   // 瞎着：0.4 < 0.5 → 不敢下手（不瞎的话 0.4 是拽人盾）
var hpD1 = bD1.player.health;
bD1._enemyMainAct();
Math.random = origRnd;
assert(hasLog(bD1, '两眼糊着泪'), 'D1 两眼糊着泪——刀抬到一半没敢出手（犹豫抬到五成）');
eq(bD1.player.health, hpD1, 'D2 你这一下毫发无损');
// 瞎着还砍：多半砍着人盾（0.6 < 0.85）
var bD3 = newBattle(mkPlayer(), mkEnemy('头目·赵大', { subtype: 'bandit', evil: true }), [ALLY]);
bD3._humanShield = bD3.enemyAllies[0];
quietGates(bD3);
stubRnd(0.6);   // cry 不触发（0.6≥0.3），盾骰 0.6 < 0.85 → 砍着人盾
bD3._enemyMainAct();
Math.random = origRnd;
assert(hasLog(bD3, '模糊的影子'), 'D3 瞎着眼挥刀——冲的是影子，砍着的还是人盾（八成五）');
TAL.getEnemyBlindTurns = origBlindFn;
// 没瞎：老三七/四七口径不动
var bD4 = newBattle(mkPlayer(), mkEnemy('头目·赵大', { subtype: 'bandit', evil: true }), [ALLY]);
bD4._humanShield = bD4.enemyAllies[0];
quietGates(bD4);
stubRnd(0.4);
bD4._enemyMainAct();
Math.random = origRnd;
assert(hasLog(bD4, '挡在身前'), 'D4 没瞎的 0.4 照旧是拽人盾挡刀（老三七/四七口径未动）');

// ==================== E · 看穿也有代价 ====================
console.log('\n[E] 看穿也有代价：没有纯白干的招');
var bE1 = newBattle(mkPlayer(), mkEnemy('眼毒的杀手', { subtype: 'bladesman' }));
bE1.enemy.stamina = 100;
stubRnd(0.9);   // 眼毒
eq(bE1.receiveCaltrop(), false, 'E1 眼毒的纵身绕开蒺藜（照旧白撒）');
Math.random = origRnd;
eq(bE1.enemy.stamina, 95, 'E2 但这一跃也费了力气（精力 -5）');
assert(hasLog(bE1, '白撒了'), 'E3 战报口径没变（旧账照认）');
var bE4 = newBattle(mkPlayer(), mkEnemy('眼毒的杀手', { subtype: 'bladesman' }));
bE4.enemy.stamina = 100;
stubRnd(0.9);   // 眼毒
eq(bE4.receiveAsh(), 0, 'E4 眼毒的袖子拂开灶灰（照旧白撒）');
Math.random = origRnd;
eq(bE4.enemy.stamina, 95, 'E5 这一拂也费了力气（精力 -5）');
var bE6 = newBattle(mkPlayer(), mkEnemy('老练的刀客', { subtype: 'bladesman' }));
bE6.enemy.stamina = 100;
stubRnd(0.5);   // 老练
eq(bE6.receiveAsh(), 0, 'E6 老练的侧脸闭气——这个不费什么力');
Math.random = origRnd;
eq(bE6.enemy.stamina, 100, 'E7 闭气是省力的活儿，不扣精力（代价账分得清）');
// 老练看穿卖绽的代价在 A8 已验（条 -10）
assert(true, 'E8 老练看穿卖绽的架势钱见 A8（行动条 -10）');

// ==================== F · 对面也连环 ====================
console.log('\n[F] 对面也连环：上头砸重手不计本钱，心散的人早想跑');
var bF1 = newBattle(mkPlayer(), mkEnemy('寨主·坐山雕', { type: 'boss', subtype: 'bandit', evil: true }));
bF1.enemy.qi = 36;   // 头目重手要 40——平时砸不出来
stubRnd(0.1);
eq(bF1._foeHeavyStrike(bF1.enemy, 'aggressive', 100, 0), null, 'F1 真气 36 < 40：平时这记重手出不来');
Math.random = origRnd;
bF1._foeRage = 1;
stubRnd(0.1);
var hsF2 = bF1._foeHeavyStrike(bF1.enemy, 'aggressive', 100, 0);
Math.random = origRnd;
assert(hsF2 !== null, 'F2 上头的人下手不计本钱——耗头减一成（40→36）就砸得出来');
eq(bF1.enemy.qi, 0, 'F3 砸完真气见底（真账，烧的是他自己的）');
// 心散的更早想着跑
var bF4 = newBattle(mkPlayer(), mkEnemy('遁修·滑头', { subtype: 'escapee', abilities: ['escape'] }));
lowBloodEnemy(bF4, 35);   // 血 35%：老线 30 之上——平时不跑
bF4._foeDisheartened = 1;
quietGates(bF4);
stubRnd(0.25);   // cry(0.25<0.3 只加日志)→遁念 0.25<0.6→遁速骰 0.25<0.35
bF4._enemyMainAct();
Math.random = origRnd;
eq(bF4.enemy._fled, true, 'F4 心散了血 35% 就想着跑（血线 30→40、念头 45%→60%）');
// 心没散：老线照旧
var bF5 = newBattle(mkPlayer(), mkEnemy('遁修·滑头', { subtype: 'escapee', abilities: ['escape'] }));
lowBloodEnemy(bF5, 35);
quietGates(bF5);
stubRnd(0.25);
bF5._enemyMainAct();
Math.random = origRnd;
assert(!bF5.enemy._fled && !hasLog(bF5, '脚底抹油'), 'F5 心没散血 35%——老线 30% 未动，他还撑着打');

// ==================== G · 壮胆三嗓递减 ====================
console.log('\n[G] 壮胆三嗓：一嗓比一嗓弱，但永远续得上');
var bG1 = newBattle(mkPlayer(), mkEnemy('刀客·王五', { subtype: 'bladesman' }));
bG1.isPlayerTurn = true;
bG1.player.stamina = 50;
stubRnd(0.5);
assert(bG1.playerTaunt('rally') === true, 'G1 头一嗓：气（+15）');
eq(bG1.player.stamina, 65, 'G2 头一嗓真回 15（50→65）');
bG1.isPlayerTurn = true;
assert(bG1.playerTaunt('rally') === true, 'G3 第二嗓还喊得出来（不再一刀切）');
eq(bG1.player.stamina, 73, 'G4 第二嗓只回 8——连自己都半信半疑');
assert(hasLog(bG1, '半信半疑'), 'G5 战报如实写这一嗓的成色');
bG1.isPlayerTurn = true;
assert(bG1.playerTaunt('rally') === true, 'G6 第三嗓：只剩气音也续得上');
eq(bG1.player.stamina, 77, 'G7 第三嗓回 4（一口气吊着）');
eq(bG1._rallyCount, 3, 'G8 嗓数记在账上（递减走真账，不是一场一回的死闸）');
Math.random = origRnd;

// ==================== H · 哨兵 ====================
console.log('\n[H] 哨兵：档位闸、真账口径、牌面提示、回归挂名');
var bSrc = src('js/battle.js');
var aSrc = src('js/app.js');
assert(bSrc.indexOf('第一百波·连环手') >= 0, 'H1 引擎里挂着第一百波的号');
assert(bSrc.indexOf("if (tier === 'foe') return null;") >= 0, 'H2 重手档位闸未动（普通杂兵没这份身手）');
assert(bSrc.indexOf('var _escThr100 = (this._foeDisheartened > 0) ? 40 : 30;') >= 0, 'H3 遁逃老线 30% 还在（心散才抬到 40%）');
assert(bSrc.indexOf('Math.random() >= (_dsh100 ? 0.55 : 0.35)') >= 0, 'H4 跪地老概率 35% 还在（心散才抬到 55%）');
['每日', '次数已用完', '今日限'].forEach(function (kw) {
    assert(bSrc.indexOf(kw) < 0, 'H5 无人工计数器口径「' + kw + '」');
});
assert(aSrc.indexOf('连环：他正上头') >= 0, 'H6 牌面提示：上头时卖绽亮连环');
assert(aSrc.indexOf('脚下正乱') >= 0, 'H7 牌面提示：脚乱时撩拨亮连环');
assert(aSrc.indexOf('两眼糊着') >= 0, 'H8 牌面提示：眼瞎时人盾亮连环');
assert(aSrc.indexOf('一嗓比一嗓弱') >= 0, 'H9 牌面话术跟上递减账');
assert(aSrc.indexOf('百口难辨】') >= 0 || aSrc.indexOf('攻心无用') >= 0, 'H10 魔头标下攻心话有死心提示');
var runAll = src('tests/run-all.sh');
assert(runAll.indexOf('wave100-lianhuan-node.js') >= 0, 'H11 本套已挂全量回归');

console.log('\n========== wave100 结果：' + passed + ' 通过 / ' + failed + ' 失败 ==========');
if (failed > 0) process.exit(1);
