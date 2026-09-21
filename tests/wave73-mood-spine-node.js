/**
 * wave73-mood-spine-node.js — 第七十三波 · 心境贯通修行主线 验收：
 *   A 心境新账：突破加减点五档、战斗折头五档、门槛值定死、无心境按开局默认、全程零骰
 *   B 闭关接线：收成认心境（×0.90–×1.10）、闭关静心（关内心气不涨不落不报信）、出关回执报折头、无心境账老公式原样
 *   C 突破接线：标准路径加在封顶之前、[0.05,0.95] 老闸不破、仪式路径同款接线（源码钉位）、无心境账老公式原样
 *   D 战斗接线：只有玩家的刀认心、敌方伤害分毫不动、平平常常一分不添、保底一分、新块零骰
 *   E 老账回归：每日归位/心灰报信/回暖销旗（六十七波行为一字不变，豁免只在关内）
 *   F 哨兵：心境文件零骰、只读闭关旗不写、四处接线块零骰、零新存档字段、悟道点零发放
 *
 * 运行：node tests/wave73-mood-spine-node.js
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
function near(a, b, msg) { assert(Math.abs(a - b) < 1e-9, msg + '（实际=' + a + ' 期望≈' + b + '）'); }

// ==================== 世界桩 ====================
global.window = global;
var msgs = [], timeCalls = [], newDayCbs = [];
global.showMessage = function (m, t) { msgs.push({ m: String(m), t: t }); };
global.showModal = function () {};
global.gameLog = { add: function () {} };
global.timeSystem = {
    gameTime: { totalMinutes: 0, currentDay: 100 },
    advanceTime: function (m) { timeCalls.push(m); this.gameTime.totalMinutes += m; },
    getAbsoluteDay: function () { return 800; },
    onNewDaySubscribe: function (fn) { newDayCbs.push(fn); },
    getSeasonBonus: undefined
};
global.confirm = function () { return true; };
global.document = {
    querySelector: function () { return null; },
    getElementById: function () { return null; },
    createElement: function () { return { style: {}, classList: { add: function () {}, remove: function () {} }, innerHTML: '' }; },
    body: { appendChild: function () {} }
};
global.setTimeout = function (fn) { try { fn(); } catch (e) {} return 0; };
global.EventBus = { emit: function () {}, on: function () { return function () {}; } };
global.updateCurrencyUI = function () {};
global.updateCharacterStatus = function () {};
global.getCurrentCityName = function () { return '洛水城'; };
global.inventory = { currency: { spiritStones: 1000, copper: 500 }, slots: [] };
global.currentCharData = {
    name: '测试修士', realm: '筑基', layer: 1, mood: 80,
    health: 100, maxHealth: 100, qi: 100, maxQi: 100, energy: 100, maxEnergy: 100,
    essence: 0, tempering: 70, location: '洛水城', lifeSkills: {}, attrs: {}
};
global.REALM_CONFIG = {
    realms: [
        { name: '炼气', index: 0, qiBase: 50, essenceBase: 30, temperingBase: 5 },
        { name: '筑基', index: 1, qiBase: 100, essenceBase: 900, temperingBase: 70 },
        { name: '金丹', index: 2, qiBase: 200, essenceBase: 10000, temperingBase: 430 },
        { name: '元婴', index: 3, qiBase: 400, essenceBase: 90000, temperingBase: 1600 },
        { name: '化神', index: 4, qiBase: 800, essenceBase: 500000, temperingBase: 4000 }
    ],
    layerMultipliers: [1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.4, 2.6]
};
global.getRealmIndex = function (r) {
    var rs = global.REALM_CONFIG.realms;
    for (var i = 0; i < rs.length; i++) { if (rs[i].name === r) return i; }
    return 0;
};
global.getEssenceGainByRealm = function () { return 5; };
// battle.js 加载所需（v20.64 同款桩）
global.getBondBonuses = function () { return {}; };
global.getPlayerWeaponSkill = function () { return 0; };
global.resolveWeaponDamageType = function () { return 'slash'; };
global.getCombatBonuses = function () { return {}; };
global.getDerivedCombatStats = function () { return { counter: 0 }; };
global.currentEquipment = {};
global.window.currentEquipment = global.currentEquipment;
global.window.TalismanSystem = null;
global.getCurrentCharData = function () { return global.currentCharData; };
global.window.partySystem = {
    partyData: { members: [], formation: 'default', fallen: [], battleLog: [] },
    processPostBattleRelationships: function () {}
};

function load(rel) {
    vm.runInThisContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), { filename: rel });
}
load('js/core/mood-system.js');
load('js/cultivation/breakthrough-system.js');
load('js/cultivation/long-retreat.js');
load('js/physiology-config.js');
load('js/battle-injuries.js');
load('js/battle.js');

var MS = global.MoodSystem;
var origRandom = Math.random;
function withRandom(v, fn) {
    Math.random = function () { return v; };
    try { return fn(); } finally { Math.random = origRandom; }
}
function setMood(m) { global.currentCharData.mood = m; }
function msgCount(w) { return msgs.filter(function (x) { return x.m.indexOf(w) >= 0; }).length; }

// ==================== A · 心境新账 ====================
console.log('\n[A] 心境新账（三本梯度全是定数）');
setMood(95); eq(MS.breakthroughBonus(), 0.05, 'A1 神思不倦冲境 +5 个百分点');
setMood(90); eq(MS.breakthroughBonus(), 0.05, 'A2 九十整是神思的门槛（含）');
setMood(80); eq(MS.breakthroughBonus(), 0.02, 'A3 心情舒畅 +2');
setMood(70); eq(MS.breakthroughBonus(), 0.02, 'A4 七十整是舒畅的门槛（含）');
setMood(50); eq(MS.breakthroughBonus(), 0, 'A5 平平常常不增不减');
setMood(30); eq(MS.breakthroughBonus(), -0.02, 'A6 心烦意乱 -2');
setMood(10); eq(MS.breakthroughBonus(), -0.05, 'A7 心灰意冷 -5');
setMood(95); eq(MS.combatMul(), 1.05, 'A8 神思不倦刀更利（×1.05）');
setMood(70); eq(MS.combatMul(), 1.02, 'A9 心情舒畅 ×1.02');
setMood(50); eq(MS.combatMul(), 1.00, 'A10 平平常常刀是老刀（×1.00）');
setMood(20); eq(MS.combatMul(), 0.98, 'A11 心烦意乱 ×0.98');
setMood(0); eq(MS.combatMul(), 0.95, 'A12 心灰意冷刀发钝（×0.95）');
delete global.currentCharData.mood;
eq(MS.breakthroughBonus(), 0.02, 'A13 没记心境的人按开局默认八十算（老档宽待）');
setMood(80);
var rolled = 0;
Math.random = function () { rolled++; return 0.5; };
MS.breakthroughBonus(); MS.combatMul(); MS.cultivationMul(); MS.tier(); MS.moodNow();
Math.random = origRandom;
eq(rolled, 0, 'A14 三本新账全程零骰（梯度是定数）');

// ==================== B · 闭关接线 ====================
console.log('\n[B] 闭关接线（进关带进去的心气，决定这场效率）');
function runRetreat(mood) {
    setMood(mood);
    global.currentCharData.health = 100;
    global.inventory.currency.spiritStones = 1000;
    msgs.length = 0; timeCalls.length = 0;
    delete global.currentCharData._moodLowNoticed;
    return withRandom(0.5, function () { return global.startLongRetreat(7); });
}
// 日产真源：突破系统导出的 getEssenceGainByRealm（筑基=8），闭关公式 base×350×加成
var DAILY = global.getEssenceGainByRealm(1) * 350;
var rHigh = runRetreat(95);
eq(rHigh.essence, Math.floor(DAILY * 1.1) * 7, 'B1 神思不倦闭关：日收 ×1.10（2800→3080），七日 21560（真元账认心境）');
var rMid = runRetreat(50);
eq(rMid.essence, DAILY * 7, 'B2 平平常常闭关：老收成一分不添（2800×7）');
var rLow = runRetreat(10);
eq(rLow.essence, Math.floor(DAILY * 0.9) * 7, 'B3 心灰意冷闭关：日收 ×0.90（2800→2520，坐也白坐几分）');
assert(msgCount('闭关结束') >= 1 && msgCount('心灰意冷') >= 1, 'B4 出关回执报心境折头（心灰意冷写在脸上）');
runRetreat(50);
assert(msgCount('真元+') >= 1 && msgCount('心境「') === 0, 'B5 平平常常不开口（与打坐结算单同一张嘴）');
eq(global.insightPoints, undefined, 'B6 闭关不发票子也不发悟道点（老账原样）');
// 无心境账 → 老公式
var savedMS = global.MoodSystem;
delete global.MoodSystem;
var rNo = runRetreat(95);
eq(rNo.essence, DAILY * 7, 'B7 心境账缺席——闭关老公式原样（向后兼容）');
global.MoodSystem = savedMS;
// 闭关静心
setMood(90);
global._isInLongRetreat = true;
MS.dailyTick();
eq(global.currentCharData.mood, 90, 'B8 关内心气不落（九十还是九十——闭关静心）');
setMood(30);
MS.dailyTick();
eq(global.currentCharData.mood, 30, 'B9 关内郁结也不自己解（不涨不落，账停在进关那天）');
setMood(10);
delete global.currentCharData._moodLowNoticed;
msgs.length = 0;
MS.dailyTick();
eq(global.currentCharData._moodLowNoticed, undefined, 'B10 关内不报心灰的信（人在关里，报给谁听）');
eq(msgCount('心灰意冷'), 0, 'B11 关内报信静默');
global._isInLongRetreat = false;
setMood(90);
MS.dailyTick();
eq(global.currentCharData.mood, 88, 'B12 出了关回落照旧（九十落回八十八——六十七波老账不动）');

// ==================== C · 突破接线 ====================
console.log('\n[C] 突破接线（神思不倦的关冲得稳）');
function btRate(mood, cdOver) {
    setMood(mood);
    var c = Object.assign({ realm: '筑基', layer: 1, tempering: 70, _failedBreakthroughs: 0 }, cdOver || {});
    return global.calculateBreakthroughRate(c, []);
}
var base = btRate(50);
near(base, 0.6 * 0.97, 'C1 平平常常：基础 0.60×境界惩罚 0.97=0.582（老公式分毫不动）');
near(btRate(95), base + 0.05, 'C2 神思不倦 +5 个百分点');
near(btRate(80), base + 0.02, 'C3 心情舒畅 +2');
near(btRate(30), base - 0.02, 'C4 心烦意乱 -2');
near(btRate(10), base - 0.05, 'C5 心灰意冷 -5');
eq(global.calculateBreakthroughRate({ realm: '筑基', layer: 1, tempering: 70, _failedBreakthroughs: 0 },
    ['huashen_dan', 'huashen_dan', 'huashen_dan', 'jieying_dan', 'ningyuan_dan', 'zhuji_dan', 'peiyuan_dan', 'pojing_dan']), 0.95,
    'C6 丹药堆成山也破不了 0.95 的老闸（心境加成在封顶之前）');
setMood(95);
var capped = global.calculateBreakthroughRate({ realm: '筑基', layer: 1, tempering: 70, _failedBreakthroughs: 0 },
    ['huashen_dan', 'huashen_dan', 'huashen_dan', 'jieying_dan', 'ningyuan_dan', 'zhuji_dan', 'peiyuan_dan', 'pojing_dan']);
eq(capped, 0.95, 'C7 神思不倦加满丹药——还是 0.95（闸是死的）');
setMood(50);
delete global.MoodSystem;
near(btRate(95), 0.6 * 0.97, 'C8 心境账缺席——突破率老公式原样（向后兼容）');
global.MoodSystem = MS;
// 两条路径都接了线（源码钉位：加成在封顶之前）
var btSrc = fs.readFileSync(path.join(ROOT, 'js/cultivation/breakthrough-system.js'), 'utf8');
assert(btSrc.indexOf('breakthroughBonus') > 0 && btSrc.indexOf('breakthroughBonus') < btSrc.indexOf('Math.min(0.95, Math.max(0.05'), 'C9 标准路径：心境项在封顶之前（源码钉位）');
var ritSrc = fs.readFileSync(path.join(ROOT, 'js/cultivation/breakthrough-ritual.js'), 'utf8');
assert(ritSrc.indexOf('breakthroughBonus') > 0 && ritSrc.indexOf('breakthroughBonus') < ritSrc.indexOf('Math.min(0.95, Math.max(0.1'), 'C10 仪式路径：同款接线、也在封顶之前（两条突破路都认心）');
near(btRate(30, { _failedBreakthroughs: 3 }), (0.6 + 0.15) * 0.97 - 0.02, 'C11 失败补偿与心境各算各的（三败 +15% 进了境界惩罚的乘法，心烦 -2% 在封顶前照扣）');

// ==================== D · 战斗接线 ====================
console.log('\n[D] 战斗接线（只有玩家的刀认心）');
var Entity = global.Entity, Battle = global.Battle;
function mkPlayer() {
    return new Entity({
        name: '玩家', level: 10,
        attrs: { strength: 30, dexterity: 20, intelligence: 20, willpower: 20, constitution: 30, meridian: 30 },
        skills: { '内功': 40 }, loot: {}, physiologyType: 'humanoid'
    }, 'player');
}
function mkEnemy() {
    return new Entity({
        name: '强敌', level: 10,
        attrs: { strength: 30, dexterity: 20, intelligence: 15, willpower: 15, constitution: 30, meridian: 20 },
        skills: { '内功': 35 }, loot: {}, physiologyType: 'humanoid'
    }, 'enemy');
}
var p = mkPlayer(), e = mkEnemy();
var bt = new Battle(p, e);
function dmgOf(atk, def, mood) {
    setMood(mood);
    return withRandom(0.5, function () { return bt._calculateDamage(atk, def, 0); });
}
var dMid = dmgOf(p, e, 50);
var dHigh = dmgOf(p, e, 95);
var dLow = dmgOf(p, e, 10);
var rawBase = Math.floor(p.getAttack() - e.getDefense() * 0.3);
eq(dMid, rawBase, 'D1 平平常常：老伤害一分不添（×1.00 不进乘法）');
eq(dHigh, Math.max(1, Math.floor(rawBase * 1.05)), 'D2 神思不倦刀更利（×1.05 向下取整）');
eq(dLow, Math.max(1, Math.floor(rawBase * 0.95)), 'D3 心灰意冷刀发钝（×0.95 向下取整）');
var eAtkMid = dmgOf(e, p, 50);
var eAtkLow = dmgOf(e, p, 10);
eq(eAtkMid, eAtkLow, 'D4 敌方的刀不认心（心灰意冷挨的打一样疼——这本账只有玩家有）');
var weak = { type: 'player', getAttack: function () { return 1; } };
var wall = { type: 'enemy', getDefense: function () { return 100; } };
eq(dmgOf(weak, wall, 10), 1, 'D5 保底一分（钝到骨子里也破得了皮）');
delete global.MoodSystem;
var dNo = withRandom(0.5, function () { setMood(95); return bt._calculateDamage(p, e, 0); });
global.MoodSystem = MS;
eq(dNo, rawBase, 'D6 心境账缺席——战斗老伤害原样（向后兼容）');
// 战斗块零骰（源码钉位：新块在两记老乘法之间，块内无骰）
var bSrc = fs.readFileSync(path.join(ROOT, 'js/battle.js'), 'utf8');
var segStart = bSrc.indexOf('第七十三波·境由心转：心烦意乱刀发钝');
var segEnd = bSrc.indexOf('v20.48 功法元素伤通电', segStart);
assert(segStart > 0 && segEnd > segStart, 'D7 战斗接线块在五行相克之后、功法元素伤之前（源码钉位）');
eq(bSrc.slice(segStart, segEnd).indexOf('Math.random'), -1, 'D8 心境块零骰（伤害的骰还是老那一枚 ±1）');

// ==================== E · 老账回归（六十七波行为一字不变） ====================
console.log('\n[E] 老账回归（回落、报信、销旗照旧）');
setMood(80);
MS.dailyTick();
eq(global.currentCharData.mood, 78, 'E1 高处回落照旧（八十落七十八）');
setMood(30);
MS.dailyTick();
eq(global.currentCharData.mood, 32, 'E2 低处回暖照旧（三十回三十二）');
setMood(50);
MS.dailyTick();
eq(global.currentCharData.mood, 50, 'E3 底色不动（五十就是五十）');
setMood(15);
delete global.currentCharData._moodLowNoticed;
msgs.length = 0;
MS.dailyTick();
eq(global.currentCharData.mood, 17, 'E4 谷底也在回暖（十五回十七——郁结会慢慢自己解）');
eq(global.currentCharData._moodLowNoticed, true, 'E5 回暖路上仍在心灰线内——报信旗立了');
var n1 = msgCount('心灰意冷');
eq(n1, 1, 'E6 报了一次信');
MS.dailyTick();
eq(msgCount('心灰意冷'), n1, 'E7 有旗不重报（防刷屏老账）');
setMood(41);
MS.dailyTick();
eq(global.currentCharData.mood, 43, 'E8 回暖继续');
eq(global.currentCharData._moodLowNoticed, false, 'E9 回暖过四十销旗（迟滞老账）');

// ==================== F · 哨兵 ====================
console.log('\n[F] 哨兵（新账干净）');
var msSrc = fs.readFileSync(path.join(ROOT, 'js/core/mood-system.js'), 'utf8');
eq((msSrc.match(/Math\.random/g) || []).length, 0, 'F1 心境文件零骰（三本梯度全是定数）');
assert(msSrc.indexOf('window._isInLongRetreat') >= 0 && msSrc.indexOf('_isInLongRetreat =') < 0, 'F2 闭关旗只读不写（旗是老账立的，心境账只是认它）');
var lrSrc = fs.readFileSync(path.join(ROOT, 'js/cultivation/long-retreat.js'), 'utf8');
assert(lrSrc.indexOf('global._isInLongRetreat = true') >= 0, 'F3 闭关旗的真源在闭关账里（老位置未动）');
var lrSeg = lrSrc.slice(lrSrc.indexOf('第七十三波·境由心转：闭关收成认心境'), lrSegEnd(lrSrc));
function lrSegEnd(s) { return s.indexOf('var mainSkillId = global.currentSkills'); }
eq(lrSeg.indexOf('Math.random'), -1, 'F4 闭关心境块零骰（顿悟/心魔的老骰一枚不添）');
eq((lrSrc.match(/Math\.random/g) || []).length, 1, 'F5 闭关全文仍只有一枚骰（每日顿悟/心魔那一枚老的）');
var btSeg = btSrc.slice(btSrc.indexOf('第七十三波·境由心转'), btSrc.indexOf('// 封顶'));
eq(btSeg.indexOf('Math.random'), -1, 'F6 突破心境块零骰（悟道丹的老骰不相干）');
assert(msSrc.indexOf('insightPoints') < 0, 'F7 心境账不碰悟道点（总闸已满）');
var btSeg2 = btSrc.slice(btSrc.indexOf('第七十三波·境由心转'), btSrc.indexOf('return Math.min(0.95'));
eq(btSeg2.indexOf('currentCharData'), -1, 'F8 突破心境块不直写角色账（只读梯度）');
var latin = /[A-Za-z]/;
var leak = null;
(msSrc.match(/'[^']+'/g) || []).forEach(function (s) {
    var v = s.slice(1, -1);
    if (/[+);({\[,?<>]/.test(v)) return;
    if (v.indexOf('\\') >= 0) return;
    if (/typeof|===|!==/.test(v)) return;
    if (/^[a-z0-9]+(?:[-_: ][a-z0-9]+)*$/.test(v)) return;
    if (latin.test(v)) leak = leak || s;
});
eq(leak, null, 'F9 心境话术零拉丁（漏: ' + leak + '）');
assert(typeof MS.BT_BONUS === 'object' && MS.BT_BONUS.length === 5 && MS.COMBAT_MUL.length === 5, 'F10 两张新梯度表五档齐全（对外可查）');

console.log('\n========== 第七十三波 · 心境贯通修行主线 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
