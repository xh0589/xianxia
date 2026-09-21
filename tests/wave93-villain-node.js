/**
 * wave93-villain-node.js — 第九十三波 · 卑鄙流仪 验收：
 *   A 先手之利：身法快过对面最快者三成——开局条+50，抢在对面反应过来之前动手（偷袭要能偷袭）；
 *     对面快得离谱则反被抢（先手是抢来的，双向的账）
 *   B 迷烟散：石灰掺松烟扬进眼里——敌主 2 回合命中 -30（真打真失准）；扣条 80；随敌行动回数消散
 *   C 淬毒入刃：毒药的第二种用法——淬在刃上，接下来 3 次见血渗毒（2 回合×10，与撒毒同一本敌毒账）
 *   D 装死诱敌：扣满条躺下——他刀上留三分力（挨打减半），你下次出手暴起偷袭 ×1.5（一次性买卖）
 *   E 黑货摊：黑市货架常备脏活儿（暗器/毒药/迷烟散/机关件）——卑鄙流仪要能补货（此前散修有钱没处买）
 *   F 哨兵：九十二波行动条原样、下作活儿零新骰、无人工计数器、零中英混排
 *
 * 运行：node tests/wave93-villain-node.js
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
function newBattle(p, e) {
    TAL.reset();
    msgs.length = 0;
    var b = new Battle(p || mkPlayer(), e || mkEnemy());
    global.currentBattle = b;
    return b;
}
function spySpend(b) {
    var spent = [];
    var orig = b.spendActionCost;
    b.spendActionCost = function (ent, cost) { spent.push({ e: ent, c: cost }); return orig.call(this, ent, cost); };
    return spent;
}

// ==================== A · 先手之利 ====================
console.log('\n[A] 先手之利（腿快，偷袭才叫偷袭）');
var bFast = newBattle(mkPlayer(60), mkEnemy());
assert(bFast.log.some(function (l) { return l.msg.indexOf('抢了个先手') >= 0; }), 'A1 身法碾压（≥1.3 倍）抢开局先手（条+50 上战报）');
assert(bFast._findActor(bFast.player).bar >= 100, 'A2 先手是真先手（你的条已经满了）');
var bSlow = newBattle(mkPlayer(10), mkEnemy('疾风刺客', 12, { strength: 30, dexterity: 70, intelligence: 15, willpower: 15, constitution: 30, meridian: 20 }));
assert(bSlow.log.some(function (l) { return l.msg.indexOf('抢在你反应过来') >= 0; }), 'A3 对面快得离谱——反被抢先手（双向的账）');
assert(bSlow.turn >= 1, 'A4 被抢的先手是真出手（回合账已翻）');
var bEven = newBattle();
assert(!bEven.log.some(function (l) { return l.msg.indexOf('先手') >= 0 && l.msg.indexOf('抢') >= 0; }), 'A5 身法相当没有先手账（+50 只给悬殊的）');

// ==================== B · 迷烟散 ====================
console.log('\n[B] 迷烟散（石灰掺松烟——扬进眼里，招式全凭瞎摸）');
var SMOKE = { name: '迷烟散', effect: { blind_enemy: 2 } };
var bSm = newBattle();
var spSm = spySpend(bSm);
stubRnd(0.2);   // 第九十四波：吃不吃烟看性子——0.2 落在性急段（兜头糊实瞎两回）
eq(TAL.apply(SMOKE), true, 'B1 迷烟扬得出去');
eq(TAL.debugState().enemyBlindTurns, 1, 'B2 性急的瞎两回合——撒完时间轴推进，他瞎着打了一回、账翻到 1');
Math.random = origRnd;
assert(spSm.some(function (x) { return x.c === 80; }), 'B3 迷烟扣条 80（与撒毒同档）');
// 真打真失准：同一骰 0.5——没迷烟打得着，迷了烟打不着
var bHit = newBattle();
stubRnd(0.65);
var rHit = bHit._executeAttack(bHit.enemy, bHit.player, 'chest', 'slash');
Math.random = origRnd;
assert(rHit && !rHit.missed, 'B4 没迷烟：骰 0.65 这一刀打得着（基础命中 91 上下）');
var bBl = newBattle();
stubRnd(0.2);   // 性急的兜头糊实（瞎两回）——推进一回后还剩一回瞎着
TAL.apply(SMOKE);
stubRnd(0.65);
var rBl = bBl._executeAttack(bBl.enemy, bBl.player, 'chest', 'slash');
Math.random = origRnd;
assert(rBl && rBl.missed === true, 'B5 迷了烟：同一骰这一刀劈空（91-30=61 < 65，命中账真兑现）');
// 随敌行动回数消散
TAL.reset();
stubRnd(0.2);   // 性急的兜头糊实（2 回）
TAL.apply(SMOKE);
Math.random = origRnd;
eq(TAL.debugState().enemyBlindTurns, 1, 'B6 撒完推进：头一回瞎打已用掉（2→1，计时挂敌行动末尾）');
TAL.tickEnemyBlind();
eq(TAL.debugState().enemyBlindTurns, 0, 'B7 第二回瞎打完，眼睛睁开（N 回合就瞎 N 次，不多不少）');
assert(src('js/battle.js').indexOf('tickEnemyBlind') >= 0, 'B8 迷烟计时挂在敌主行动边界（_endEnemyMainAction）');
global.currentBattle = null;
TAL.reset();
eq(TAL.apply(SMOKE), false, 'B9 战外扬迷烟——没目标，不白撒');

// ==================== C · 淬毒入刃 ====================
console.log('\n[C] 淬毒入刃（毒药的第二种用法：见血渗毒）');
var bV = newBattle();
eq(bV.setVenomBlade(3), true, 'C1 毒淬上刃口（3 次账立在玩家身上）');
eq(bV.player._venomBlade, 3, 'C2 三次见血渗毒');
stubRnd(0.5);
var rV1 = bV._executeAttack(bV.player, bV.enemy, 'chest', 'slash');
Math.random = origRnd;
if (rV1 && rV1.damage > 0) {
    eq(bV.player._venomBlade, 2, 'C3 见血一次扣一次毒账');
    var pst = TAL.debugState();
    assert(pst.enemyPoison && pst.enemyPoison.dmg === 10, 'C4 渗的是温和刃毒（2 回合×10，与撒毒粉同一本敌毒账）');
    assert(String(rV1.msg || '').indexOf('渗进伤口') >= 0, 'C5 战报写明毒渗进去了');
} else {
    assert(false, 'C3 淬毒见血才渗（这一刀该打实：' + JSON.stringify(rV1 && rV1.msg) + '）');
}
// 毒账用完就不再渗
bV.player._venomBlade = 0;
TAL.reset();
stubRnd(0.5);
bV._executeAttack(bV.player, bV.enemy, 'chest', 'slash');
Math.random = origRnd;
eq(TAL.debugState().enemyPoison, null, 'C6 毒账用完，刃就是普通刃（不无限渗）');
// app.js 侧哨兵：淬毒吃一份毒药、扣 60 条
var appSrc = src('js/app.js');
assert(appSrc.indexOf("battleVillainTrick('venom')") >= 0 || appSrc.indexOf("battleVillainTrick(\\'venom\\')") >= 0, 'C7 下作抽屉里挂着淬毒口子');
assert(appSrc.indexOf('setVenomBlade(3)') >= 0 && appSrc.indexOf('special_poison') >= 0, 'C8 淬毒真吃行囊里的毒药（不是凭空抹）');

// ==================== D · 装死诱敌（第九十四波改版：躺下是真的，信不信看性子） ====================
console.log('\n[D] 装死诱敌（他信不信看性子——反应在敌人那一动里见分晓）');
var bF0 = newBattle();
stubRnd(0.5);
var rF0 = bF0._executeAttack(bF0.enemy, bF0.player, 'chest', 'slash');
Math.random = origRnd;
var dmgNormal = rF0 && rF0.damage || 0;
// 性急的当真：留力挨刀 + 给你留偷袭窗
var bF = newBattle();
stubRnd(0.2);   // 平衡性子 reckless .375——0.2 落在性急段
eq(bF.playerFeign(), true, 'D1 装死装得下去');
assert(bF.log.some(function (l) { return l.msg.indexOf('栽倒在地') >= 0; }), 'D2 战报有画面（兵刃脱手踉跄栽倒）');
assert(bF.log.some(function (l) { return l.msg.indexOf('当真了') >= 0; }), 'D3 性急的当真了——凑近翻看「尸体」');
assert(bF.log.some(function (l) { return l.msg.indexOf('留了三分力') >= 0; }), 'D4 留力是真留力（那一下伤害减半当场兑现）');
eq(bF.player._backstabWindow, 1, 'D5 你留着暴起偷袭的窗（×1.5）');
Math.random = origRnd;
var spF = spySpend(bF);
bF.playerFeign();
assert(spF.some(function (x) { return x.c === 100; }), 'D6 装死扣满条 100（躺下不是白躺）');
// 老练的不上当：白装
var bFc = newBattle();
stubRnd(0.5);   // cautious 段
bFc.playerFeign();
Math.random = origRnd;
assert(bFc.log.some(function (l) { return l.msg.indexOf('没上当') >= 0 && l.msg.indexOf('白装') >= 0; }), 'D7 老练的没上当——停在三步开外（白装了）');
assert(!bFc.player._backstabWindow, 'D8 没上当就没有偷袭窗（反应各不相同）');
// 眼毒的一眼识破
var bFs = newBattle();
stubRnd(0.9);   // sharp 段
bFs.playerFeign();
Math.random = origRnd;
assert(bFs.log.some(function (l) { return l.msg.indexOf('一眼识破') >= 0; }), 'D9 眼毒的一眼识破（装死反被将军）');
// 一次性账本：留力打完就清，没有永久光环
var bF2 = newBattle();
bF2._foeLulled = 1;
stubRnd(0.5);
var rF2 = bF2._executeAttack(bF2.enemy, bF2.player, 'chest', 'slash');
eq(bF2._foeLulled, 0, 'D10 留力账当场清（一次性买卖）');
var rF2b = bF2._executeAttack(bF2.enemy, bF2.player, 'chest', 'slash');
Math.random = origRnd;
assert(rF2 && rF2.damage > 0 && rF2.damage <= Math.ceil(dmgNormal * 0.5) + 1, 'D11 留力那一下真减半（' + (rF2 && rF2.damage) + ' vs 平时 ' + dmgNormal + '）');
assert(!rF2b || rF2b.missed || rF2b.damage === 0 || rF2b.damage > Math.ceil(dmgNormal * 0.5) + 1, 'D12 第二刀不再留力（不能躺着吃一整场）');
// 暴起偷袭 ×1.5：同骰对账
var bF3 = newBattle();
stubRnd(0.5);
var baseDmg = bF3._calculateDamage(bF3.player, bF3.enemy, 0);
bF3.player._backstabWindow = 1;
var feignDmg = bF3._calculateDamage(bF3.player, bF3.enemy, 0);
Math.random = origRnd;
eq(feignDmg, Math.floor(baseDmg * 1.5), 'D13 暴起偷袭 ×1.5（同骰对账：' + baseDmg + '→' + feignDmg + '）');
eq(bF3.player._backstabWindow, 0, 'D14 偷袭完窗当场关');
assert(bF3.log.some(function (l) { return l.msg.indexOf('暴起') >= 0; }), 'D15 暴起那一下战报点名');
// 姿态账：已经躺着不能再躺；轮不到你动躺不下
var bF4 = newBattle();
bF4.player._feignPose = true;
eq(bF4.playerFeign(), false, 'D16 已经躺着了不能再装一遍（别演两遍）');
var bF5 = newBattle();
bF5.isPlayerTurn = false;
eq(bF5.playerFeign(), false, 'D17 轮不到你动就躺不下（时机闸一视同仁）');

// ==================== E · 黑货摊 ====================
console.log('\n[E] 黑货摊（黑市常备脏活儿——卑鄙流仪要能补货）');
var shopSrc = src('js/enhanced-shop.js');
assert(shopSrc.indexOf('BLACK_GOODS') >= 0 && shopSrc.indexOf("this.type === 'special'") >= 0, 'E1 黑市货架常备黑货四件');
['special_hidden_weapon', 'special_poison', 'special_smoke', 'special_mechanism'].forEach(function (id) {
    assert(shopSrc.indexOf("'" + id + "'") >= 0, 'E2 黑货清单里有 ' + id);
});
var smokeItem = global.itemById['special_smoke'];
assert(smokeItem && smokeItem.name === '迷烟散', 'E3 迷烟散入物品册');
eq(smokeItem && smokeItem.subtype, 'poison', 'E4 迷烟散走毒物管线（背包使用即符箓效果线，零新路）');
assert(appSrc.indexOf('💨 迷烟×') >= 0 && appSrc.indexOf('🖤 下作') >= 0, 'E5 战斗栏摆出迷烟快手钮与下作抽屉');

// ==================== F · 哨兵 ====================
console.log('\n[F] 哨兵');
var bSrc = src('js/battle.js');
assert(bSrc.indexOf('_advanceTimeline()') >= 0 && bSrc.indexOf('spendActionCost') >= 0, 'F1 九十二波行动条原样');
assert(bSrc.indexOf('playerFeign()') >= 0 && bSrc.indexOf('setVenomBlade(n)') >= 0, 'F2 下作两式是引擎正门（app 只管按钮和物品）');
var vilSeg = bSrc.slice(bSrc.indexOf('// 第九十三波·卑鄙流仪两个引擎口'), bSrc.indexOf('// ===== 第九十四波·见招拆招'));
eq((vilSeg.match(/Math\.random/g) || []).length, 0, 'F3 下作账本零骰（淬毒装死的账是定数；对面怎么反应才掷社交骰）');
assert(vilSeg.indexOf('次数已用完') < 0 && vilSeg.indexOf('每日') < 0, 'F4 无人工计数器（淬毒三次是毒量，装死一回是买卖，都是世界账）');
var leak = null;
[vilSeg, bSrc.slice(bSrc.indexOf('// 第九十三波·先手之利'), bSrc.indexOf('} catch (eFirst)')),
 appSrc.slice(appSrc.indexOf('// 第九十三波·卑鄙流仪'), appSrc.indexOf('function battleFlee'))].forEach(function (txt) {
    (txt.match(/'[^']+'/g) || []).forEach(function (s) {
        var v = s.slice(1, -1);
        if (/[+);({\[,?<>]/.test(v)) return;
        if (/^[a-z0-9_]+(?:[-_:. ][a-z0-9_]+)*$/i.test(v)) return;
        if (/^[A-Za-z0-9_\-:.\/#% ]+$/.test(v)) return;
        if (/[A-Za-z]/.test(v) && /[一-龥]/.test(v)) leak = leak || s;
    });
});
eq(leak, null, 'F5 新话术零中英混排（漏: ' + leak + '）');
assert(src('tests/run-all.sh').indexOf('wave93-villain-node.js') >= 0, 'F6 本套已挂全量回归');
delete global.currentBattle;

console.log('\n========== 第九十三波 · 卑鄙流仪 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
