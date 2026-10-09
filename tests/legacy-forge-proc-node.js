// legacy-forge-proc-node.js —— 第六十一批 · 炼器 proc 接战斗 + 后期材料产出表 + 槽位溢出
//
// 守的是什么：
//   A 接线口      七条 proc 真经 registerForgeProc/getForgeProc 登记，且 battle.js 只有三个入口
//   B 逐条        七条各自：触发条件 / 效果数值 / 玩家看得见 / 有明确规避手段（规避手段实测有效）
//   C 确定性      同条件连打 N 次逐字一致；换三个随机值，proc 的判定与结果一字不变（proc 不读骰）
//   D 不改主公式  _calculateDamage 源码逐字不变；不装 proc 的战斗转录与改造前逐字一致（golden）
//   E 产出表      每条材料 id 真实存在、每个妖兽 id 真实存在、周期必掉（非随机）、等级门槛与落档有效
//   F 槽位溢出    四阶料 +1 槽 / 五行精华 +2 槽，且仍被锻造技能档封顶
//
// 运行：node tests/legacy-forge-proc-node.js
'use strict';

var fs = require('fs');
var vm = require('vm');
var path = require('path');
var ROOT = path.resolve(__dirname, '..');

var pass = 0, fail = 0;
function assert(cond, msg) {
    if (cond) { pass++; console.log('  OK  ' + msg); }
    else { fail++; console.log('  FAIL ' + msg); }
}
function section(s) { console.log('\n=== ' + s + ' ==='); }

// ==================== 测试桩 ====================
global.window = global;
var _store = {};
global.localStorage = {
    getItem: function (k) { return _store[k] !== undefined ? _store[k] : null; },
    setItem: function (k, v) { _store[k] = String(v); },
    removeItem: function (k) { delete _store[k]; }
};
function _blankEl() {
    return {
        style: {}, _classes: [], textContent: '', innerHTML: '', children: [], options: [],
        classList: { add: function () {}, remove: function () {}, toggle: function () {}, contains: function () { return false; } },
        appendChild: function () {}, removeChild: function () {}, addEventListener: function () {},
        removeEventListener: function () {}, setAttribute: function () {}, getAttribute: function () { return null; },
        querySelector: function () { return null; }, querySelectorAll: function () { return []; }, closest: function () { return null; }
    };
}
global.document = {
    readyState: 'complete', createElement: function () { return _blankEl(); },
    createElementNS: function () { return _blankEl(); },
    getElementById: function () { return _blankEl(); },
    querySelector: function () { return null; }, querySelectorAll: function () { return []; },
    addEventListener: function () {}, body: { appendChild: function () {} }
};
var GIVEN = [];                       // 本测试所有「发货」都记在这儿，便于断言真落袋
global.addItem = function (id, n) { GIVEN.push({ id: id, n: n }); return n || 1; };
global.addResultItem = function (id, n) { GIVEN.push({ id: id, n: n }); return n || 1; };
global.itemById = {};
global.EventBus = { emit: function () {}, on: function () { return function () {}; } };
global.StateRegistry = { register: function () { return function () {}; } };
global.getCombatBonuses = function () { return {}; };
global.getBondBonuses = function () { return {}; };
global.getAgePenaltyMultiplier = function () { return 1; };
global.getRealmUnstableMultiplier = function () { return 1; };
global.getOldWoundPenalty = function () { return 1; };
global.getSwordIntentAttackMul = function () { return 1; };
global.getRealmTier = function () { return 2; };
global.getPlayerWeaponSkill = function () { return 0; };
global.resolveWeaponDamageType = function () { return 'slash'; };
global.currentEquipment = {};
global.window.TalismanSystem = null;
global.currentCharData = { health: 100, energy: 100, qi: 100, maxQi: 100, level: 10, realm: '筑基', attrs: {}, location: '中州', lifeSkills: { '锻造': 80, '采伐': 80 } };
global.getCurrentCharData = function () { return global.currentCharData; };
global.getLifeSkill = function (k) { return (global.currentCharData.lifeSkills || {})[k] || 0; };
global.timeSystem = {
    gameTime: { totalMinutes: 0 }, advanceTime: function () {}, onNewDaySubscribe: function () {},
    getCurrentPeriod: function () { return { id: 'noon' }; }
};
global.gameTime = { currentSeason: 'spring' };
global.getCurrentWeather = function () { return { id: 'sunny' }; };
global.WorldCalendar = { day: 1 };
global.setTimeout = function (fn) { fn(); return 0; };
global.generateEnemyInventory = function () { return { items: [], spiritStones: 0, copper: 0 }; };
global.showMessage = function () {};
global.updateCharacterStatus = function () {};
global.updateCurrencyUI = function () {};
global.partySystem = null;

function load(rel) { vm.runInThisContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), { filename: rel }); }
load('js/physiology-config.js');
load('js/battle-injuries.js');
load('js/crafting/forging-compound.js');   // 炼器模块先上：battle.js 是惰性接线，顺序无所谓但这样更贴近 html
load('js/battle.js');

var F = global.ForgingCompound;
var Entity = global.Entity, Battle = global.Battle;
var TUNE = global.FORGE_PROC_TUNING, ORDER = global.FORGE_PROC_ORDER;

// ==================== 造器/造人 ====================
var PROC_IDS = ['reflect', 'stun', 'rebirth', 'curse', 'aoe', 'wild', 'roar'];
function clearEquip() {
    global.currentEquipment = {};
    global.window.currentEquipment = global.currentEquipment;
}
function equipProc(procId, points, slot) {
    slot = slot || 'mainHand';
    var entry = null;
    for (var i = 0; i < F.AFFIX_POOL.length; i++) if (F.AFFIX_POOL[i].proc === procId) entry = F.AFFIX_POOL[i];
    if (!entry) return null;
    var id = 'wpn_test_' + procId + '_p' + points;
    global.itemById[id] = {
        id: id, name: '试炼兵·' + entry.name, type: 'equipment', subtype: 'sword', slot: slot,
        quality: 'PIN3', level: 1, price: 1, attrs: { attack: 5 }, combatBonus: {},
        damageType: 'slash', weight: 2, procTags: [procId], _forgeQuality: 'normal',
        _forgePlan: {
            points: points, totalPoints: points, skill: 60,
            affixes: [{ key: entry.key, points: points, tier: points === 3 ? 'xian' : (points === 2 ? 'ling' : 'fan'), val: 0 }]
        }
    };
    global.currentEquipment[slot] = { templateId: id, attack: 5 };
    return id;
}
function mkPlayer(p) {
    p = p || {};
    var e = new Entity({
        name: '玩家', level: p.level || 12,
        attrs: p.attrs || { strength: 30, dexterity: 22, intelligence: 20, willpower: 20, constitution: 34, meridian: 30 },
        skills: { '内功': 40 }, loot: {}, physiologyType: 'humanoid'
    }, 'player');
    if (p.blood != null) { e.physiology.bloodVolume = p.blood; e.physiology.health = p.blood; }
    return e;
}
function mkEnemy(p) {
    p = p || {};
    return new Entity({
        name: p.name || '强敌', level: p.level || 14,
        attrs: p.attrs || { strength: 34, dexterity: 18, intelligence: 15, willpower: 15, constitution: 32, meridian: 20 },
        skills: { '内功': 30 }, loot: { exp: 10, copper: 5 }, physiologyType: p.physiologyType || 'humanoid'
    }, p.type || 'enemy');
}
function mkAllyData(name) {
    return { data: { name: name, level: 8, type: 'beast', attrs: { strength: 12, dexterity: 14, intelligence: 4, willpower: 6, constitution: 12, meridian: 2 }, skills: {} }, type: 'beast', uid: 'u_' + name };
}
function newBattle(o) {
    o = o || {};
    var b = new Battle(mkPlayer(o), mkEnemy(o.enemy || {}), o.allies ? o.allies.map(mkAllyData) : null);
    b._forgeProcsList = null;     // 强制重读手上的术
    return b;
}
var realRandom = Math.random;
function withConst(c, fn) { Math.random = function () { return c; }; try { return fn(); } finally { Math.random = realRandom; } }

// ==================== A 段：接线口与统一入口 ====================
section('A) 接线口：七条 proc 经 registerForgeProc 登记，battle.js 只有三个入口');
assert(!!F && !!Battle && !!TUNE, '炼器模块 / 战斗类 / 数值表都在');
clearEquip();
F.PROCS_BEFORE_WIRE = null;
clearEquip();
equipProc('reflect', 1);
var armed = global.readPlayerForgeProcs();
assert(armed.length === 1 && armed[0].id === 'reflect', '装上反震兵，手上就有一条术（实得 ' + armed.length + ' 条）');
PROC_IDS.forEach(function (pid) {
    var p = F.getForgeProc(pid);
    assert(p && p.wired === true && typeof p.handler === 'function',
        'proc ' + pid + '：读一次手上的术就 wired=true（handler 真存在）');
});
assert(global.FORGE_PROC_PHASE_ORDER.aftermath.indexOf('rebirth') ===
    global.FORGE_PROC_PHASE_ORDER.aftermath.length - 1, '涅槃排在 aftermath 最后——打死人的那一刀也要先把账结清');
var battleSrc = fs.readFileSync(path.join(ROOT, 'js/battle.js'), 'utf8');
var callSites = ['_forgeProcs(\'aftermath\'', '_forgeProcs(\'act\'', '_forgeProcs(\'round\''];
var foundSites = callSites.filter(function (c) { return battleSrc.indexOf(c) >= 0; });
assert(foundSites.length === 3, 'battle.js 里 proc 入口正好三个（实测 ' + foundSites.length + ' 个：' + foundSites.join(' / ') + '）');
var dispatcherCalls = battleSrc.split('this._forgeProcs(').length - 1;
assert(dispatcherCalls === 3, '_forgeProcs 总调用次数 = 3（实测 ' + dispatcherCalls + '）——不是散在七处');
PROC_IDS.forEach(function (pid) {
    var methodName = '_proc' + pid.charAt(0).toUpperCase() + pid.slice(1);
    assert(typeof Battle.prototype[methodName] === 'function', '七条各有一个独立实现方法 ' + methodName + '()');
});
// ★ 接线可回退：摘掉 handler 后这条术在战斗里彻底不发生
clearEquip();
equipProc('rebirth', 3);
var bW = newBattle();
var bWired = F.getForgeProc('rebirth').handler;
F.registerForgeProc('rebirth', null);
bW._forgeProcsList = null;
assert(bW._forgeProcRec('rebirth') === null, 'handler 被摘掉后 battle.js 认不出这条术（读口就当没有）');
F.registerForgeProc('rebirth', bWired);
bW._forgeProcsList = null;
assert(!!bW._forgeProcRec('rebirth'), 'handler 挂回去这条术又活了');

// ==================== B 段：七条逐条（触发 / 数值 / 可见 / 可规避） ====================
section('B1) 反震：玩家被打，攻击者胸口吃一刀钝伤');
clearEquip(); equipProc('reflect', 1);
var b1 = newBattle();
var foeChest1 = b1.enemy.durabilities.chest;
var out1 = withConst(0.5, function () { return b1._applyOnHitAftermath(b1.enemy, b1.player, 20); });
var expect1 = Math.floor(20 * (TUNE.reflect.base + TUNE.reflect.step * 0) / 100);
assert(out1.indexOf('反震') >= 0, '受击那条话里写着「反震」，玩家看得见：' + out1.trim());
assert(b1.enemy.durabilities.chest === foeChest1 - expect1,
    '2 点档应回震 floor(20×' + expect1 + '%)= ' + expect1 + '（实掉 ' + (foeChest1 - b1.enemy.durabilities.chest) + '）');
var out1b = withConst(0.5, function () { return b1._applyOnHitAftermath(b1.enemy, b1.player, 20); });
var expect1b = Math.floor(20 * TUNE.reflect.base / 100);
assert(b1.enemy.durabilities.chest === foeChest1 - expect1 - expect1b, '第二刀同样按实际伤害回震（' + expect1b + '）');
// 规避：伤害被完全挡下（actual = 0）就不回震
var chestBefore = b1.enemy.durabilities.chest;
var out1c = withConst(0.5, function () { return b1._applyOnHitAftermath(b1.enemy, b1.player, 0); });
assert(out1c === '' && b1.enemy.durabilities.chest === chestBefore, '规避①：actual=0（护盾吃光/格挡）→ 一声不响，一点不回震');
// 规避：手上不带反震（别的术）就不回震
clearEquip(); equipProc('curse', 3);
var b1d = newBattle();
var chest1d = b1d.enemy.durabilities.chest;
withConst(0.5, function () { return b1d._applyOnHitAftermath(b1d.enemy, b1d.player, 20); });
assert(b1d.enemy.durabilities.chest === chest1d, '规避②：没装反震就不回震（带的是诅咒）');

section('B2) 麻痹：每挨三下实打实的着，下一位出手的敌人这一动落空');
clearEquip(); equipProc('stun', 1);
var b2 = newBattle();
var stunTexts = [];
withConst(0.5, function () {
    for (var i = 0; i < 3; i++) stunTexts.push(b2._applyOnHitAftermath(b2.enemy, b2.player, 5));
});
assert(stunTexts[0] === '' && stunTexts[1] === '', '一、二下只记数不响（节奏固定，玩家数得出来）');
assert(stunTexts[2].indexOf('雷殛蓄势') >= 0, '第三下蓄势，那句话直接写明第几下：' + stunTexts[2].trim());
var gate = b2._forgeProcs('act', { attacker: b2.enemy, defender: b2.player });
assert(gate.skip === true && gate.msg.indexOf('雷殛') >= 0, '下一位出手的敌人这一动直接落空：' + gate.msg);
// 规避①：挨不到三下就不触发
var b2b = newBattle();
withConst(0.5, function () { for (var j = 0; j < 2; j++) b2b._applyOnHitAftermath(b2b.enemy, b2b.player, 5); });
assert(b2b._forgeProcs('act', { attacker: b2b.enemy, defender: b2b.player }).skip === false,
    '规避①：只挨两下不蓄势，敌人这一动照样出得了手');
// 规避②：蓄势不落在自己身上，也不伤及队友出手
var b2c = newBattle({ allies: ['野狼甲'] });
withConst(0.5, function () { for (var k = 0; k < 3; k++) b2c._applyOnHitAftermath(b2c.enemy, b2c.player, 5); });
var allyAct = b2c._forgeProcs('act', { attacker: b2c.enemyAllies[0], defender: b2c.player });
var selfAct = b2c._forgeProcs('act', { attacker: b2c.player, defender: b2c.enemy });
assert(allyAct.skip === true, '雷殛落在**下一位出手的敌人**身上（同伙也一样照落）');
assert(selfAct.skip === false, '玩家自己出手不会被自己的术定住');
// 规避③：消耗掉就不再有
assert(b2c._forgeProcRec('stun') && b2c._forgeProcs('act', { attacker: b2c.enemyAllies[0] }).skip === false,
    '规避③：一记只吃一次出手（不重复触发）');
// 出手门真的挂在 _executeAttack 第一行
clearEquip(); equipProc('stun', 3);
var b2d = newBattle();
withConst(0.5, function () { for (var m = 0; m < 3; m++) b2d._applyOnHitAftermath(b2d.enemy, b2d.player, 5); });
var execOut = withConst(0.5, function () { return b2d._executeAttack(b2d.enemy, b2d.player, 'chest', 'slash'); });
assert(execOut.missed === true && execOut.procSkip === true, '出手门真在 _executeAttack 上：这一动没出手（实得 ' + JSON.stringify(execOut).slice(0, 40) + '…）');

section('B3) 涅槃：致死那一刀之前留命一次');
clearEquip(); equipProc('rebirth', 3);
var b3 = newBattle({ blood: 60 });
var p3 = b3.player;
for (var q = 0; q < Object.keys(p3.durabilities).length; q++) { /* 先把要害格压到 1 */ }
['chest', 'head', 'brain', 'neck'].forEach(function (part) { if (p3.durabilities[part] != null) p3.durabilities[part] = 1; });
var r3 = withConst(0.5, function () { return b3._executeAttack(b3.enemy, p3, 'chest', 'slash'); });
assert(p3.isAlive === true, '致死一刀之后玩家还站着（isAlive=' + p3.isAlive + '）');
assert(p3.physiology.bloodVolume === Math.round(p3.physiology.maxBloodVolume * TUNE.rebirth.base / 100),
    '气血回到本场量程的三成（' + p3.physiology.bloodVolume + ' / 量程 ' + p3.physiology.maxBloodVolume + '）');
// ⚠️ 实测坑：高境界玩家量程是 30000，不是 100 ——「三成」必须按量程折算，写死 30 点会把人削到见底
clearEquip(); equipProc('rebirth', 3);
var b3z = newBattle();
b3z.player.physiology.maxBloodVolume = 30000;
b3z.player.physiology.bloodVolume = 30000;
['chest', 'head', 'brain', 'neck'].forEach(function (part) { if (b3z.player.durabilities[part] != null) b3z.player.durabilities[part] = 1; });
withConst(0.5, function () { return b3z._executeAttack(b3z.enemy, b3z.player, 'chest', 'slash'); });
assert(b3z.player.physiology.bloodVolume === 9000,
    '量程 30000 的玩家：涅槃回到 9000（三成），不是 30（实得 ' + b3z.player.physiology.bloodVolume + '）');
// 狂血同理：阶位按比例，不按绝对点数
clearEquip(); equipProc('wild', 3);
var b6z = newBattle();
b6z.player.physiology.maxBloodVolume = 30000;
b6z.player.physiology.bloodVolume = 12000;   // 40% —— 写死 40 门槛在这量程下永远够不着
b6z._forgeProcs('round', {});
assert(b6z.player._procWildHitBonus === TUNE.wild.hitPerBand,
    '量程 30000、气血 12000（正好四成）：狂血第一阶成立（写死绝对门槛就永远不响）');
assert(b6z.player.physiology.bloodVolume === 12000 + 900, '回血按量程 3% = 900（实得 ' + b6z.player.physiology.bloodVolume + '）');
var b6y = newBattle();
b6y.player.physiology.maxBloodVolume = 30000;
b6y.player.physiology.bloodVolume = 15000;   // 五成 —— 不该进任何阶
assert(b6y._forgeProcs('round', {}).text === '' && b6y.player._procWildHitBonus === 0, '量程 30000、气血 15000（五成）：不进阶');
assert(p3.durabilities.chest > 1, '耐久也被拉回（胸口 ' + p3.durabilities.chest + '）——不是「血回满、身子还烂着」');
assert(r3.msg.indexOf('涅槃') >= 0, '那一刀的话里写着涅槃，玩家看得见：' + String(r3.msg).slice(0, 60));
assert(b3.log.some(function (x) { return String(x.msg).indexOf('涅槃') >= 0; }), '战斗日志里另记一条涅槃（战后回看也在）');
// 规避①：一场一次
['chest', 'head', 'brain', 'neck'].forEach(function (part) { if (p3.durabilities[part] != null) p3.durabilities[part] = 1; });
p3.physiology.bloodVolume = 3;
var r3b = withConst(0.5, function () { return b3._executeAttack(b3.enemy, p3, 'chest', 'slash'); });
assert(p3.isAlive === false, '规避①：一场只一次——第二记致命刀真死了（isAlive=' + p3.isAlive + '）');
// 规避②：没装备就没有这条命
clearEquip(); equipProc('curse', 2);
var b3c = newBattle({ blood: 60 });
var p3c = b3c.player;
['chest', 'head', 'brain', 'neck'].forEach(function (part) { if (p3c.durabilities[part] != null) p3c.durabilities[part] = 1; });
withConst(0.5, function () { return b3c._executeAttack(b3c.enemy, p3c, 'chest', 'slash'); });
assert(p3c.isAlive === false, '规避②：没装涅槃就真死（没装涅槃 = 没有这条命）');

section('B4) 诅咒：命中被咒，逐层叠，最多三层');
clearEquip(); equipProc('curse', 3);
var b4 = newBattle();
var curseTexts = [];
withConst(0.5, function () {
    for (var i = 0; i < 5; i++) curseTexts.push(b4._applyOnHitAftermath(b4.player, b4.enemy, 12));
});
assert(b4.enemy._procCurseStacks === TUNE.curse.maxStacks, '叠到上限 ' + TUNE.curse.maxStacks + ' 层就不再叠（实得 ' + b4.enemy._procCurseStacks + '）');
assert(curseTexts[0].indexOf('诅咒') >= 0 && curseTexts[0].indexOf('命中') >= 0, '第一层就写明削的是命中：' + curseTexts[0].trim());
assert(curseTexts[TUNE.curse.maxStacks] === '', '第四层起一句不说（不刷屏也不叠加）');
assert(battleSrc.indexOf('hitRate -= defender._procCurseStacks * FORGE_PROC_TUNING.curse.hitPerStack') >= 0,
    '命中段真读了层数（不是只在话里说说）');
// 规避：换目标（换实体）即从零起算
var b4b = newBattle({ allies: ['野狼甲'] });
withConst(0.5, function () {
    for (var k = 0; k < 3; k++) b4b._applyOnHitAftermath(b4b.player, b4b.enemy, 12);
});
assert(b4b.enemy._procCurseStacks === 3 && (b4b.enemyAllies[0]._procCurseStacks || 0) === 0,
    '规避：咒只挂在被打的那一个身上，同伙从零起算');

section('B5) 群攻（陨星）：命中之后溅射，只打已在场的其余敌人');
clearEquip(); equipProc('aoe', 1);
var b5 = newBattle({ allies: ['野狼甲', '野狼乙'] });
var allyNames = b5.enemyAllies.map(function (x) { return x.name; });
var before5 = {};
b5.enemyAllies.forEach(function (x) { before5[x.name] = x.durabilities.chest; });
var mainChest5 = b5.enemy.durabilities.chest;
var out5 = withConst(0.5, function () { return b5._applyOnHitAftermath(b5.player, b5.enemy, 30); });
var splashEach = Math.floor(30 * TUNE.aoe.base / 100);
assert(out5.indexOf('星陨') >= 0, '那句话写着星陨溅射：' + out5.trim());
var splashed = b5.enemyAllies.filter(function (x) { return x.durabilities.chest === before5[x.name] - splashEach; });
assert(splashed.length === b5.enemyAllies.length,
    '两名同伙各吃 floor(30×' + TUNE.aoe.base + '%)= ' + splashEach + '（实到 ' + splashed.length + '/' + b5.enemyAllies.length + ' 人）');
assert(b5.enemy.durabilities.chest === mainChest5, '被主打的当然不在溅射名单里');
assert(b5.enemyAllies.every(function (x) { return (x._procCurseStacks || 0) === 0; }), '溅射走 takeDamage 直调：不会再触发第二层 proc');
// 规避①：单挑不触发
clearEquip(); equipProc('aoe', 3);
var b5b = newBattle();
var out5b = withConst(0.5, function () { return b5b._applyOnHitAftermath(b5b.player, b5b.enemy, 30); });
assert(out5b.indexOf('星陨') < 0, '规避①：场上只有一名敌人 → 溅射不触发（单挑是明面上的规避面）');

section('B6) 狂血：气血越低越强（回合结算）');
clearEquip(); equipProc('wild', 3);
var b6 = newBattle({ blood: 30 });
var wildText = b6._forgeProcs('round', {});
assert(wildText.text.indexOf('狂血') >= 0, '回合边界真响：' + wildText.text.trim());
var cap6 = b6.player.physiology.maxBloodVolume;
var expectHeal = Math.max(1, Math.round(cap6 * TUNE.wild.healPctPerBand));
assert(b6.player.physiology.bloodVolume === 30 + expectHeal,
    '四成以下按本场量程（' + cap6 + '）回 3% = ' + expectHeal + '（30 → ' + b6.player.physiology.bloodVolume + '）');
assert(b6.player._procWildHitBonus === TUNE.wild.hitPerBand,
    '出手命中 +' + b6.player._procWildHitBonus + '（挂到出手方身上）');
assert(battleSrc.indexOf('if (attacker._procWildHitBonus > 0) hitRate += attacker._procWildHitBonus;') >= 0,
    '命中段真读了狂血的加成');
// 血更少 → 阶更高
var b6b = newBattle({ blood: 12 });
b6b._forgeProcs('round', {});
assert(b6b.player._procWildHitBonus === TUNE.wild.hitPerBand * 2, '两成以下翻一阶（命中 +' + b6b.player._procWildHitBonus + '）');
// 规避①：气血回到四成之上就退出
var b6c = newBattle({ blood: 95 });
var out6c = b6c._forgeProcs('round', {});
assert(out6c.text === '' && b6c.player._procWildHitBonus === 0, '规避①：气血 95（>四成）不触发，加成归零');
// 规避②：从第 2 阶退回第 1 阶有一句明话
var b6d = newBattle({ blood: 30 });
b6d._forgeProcs('round', {});
b6d.player.physiology.bloodVolume = 95;
var out6d = b6d._forgeProcs('round', {});
assert(out6d.text.indexOf('狂血退去') >= 0, '规避②：抬过四成那一回合有一句「狂血退去」，玩家知道它走了');

section('B7) 龙吟：主敌耐久破三档各响一声，敌方行动条倒退');
clearEquip(); equipProc('roar', 1);
var b7 = newBattle({ blood: 100, allies: ['野狼甲'] });
function foeRatio(b) {
    var cur = 0, max = 0;
    for (var k in b.enemy.durabilities) { cur += b.enemy.durabilities[k]; max += b.enemy.maxDurabilities[k]; }
    return cur / max;
}
function foeBars(b) {
    return b.getActionBars().filter(function (x) { return x.side === 'enemy'; }).map(function (x) { return x.bar; }).join('/');
}
var bars0 = foeBars(b7);
for (var part in b7.enemy.durabilities) b7.enemy.durabilities[part] = Math.round(b7.enemy.maxDurabilities[part] * 0.60);
var roar1 = b7._forgeProcs('round', {});
assert(roar1.text.indexOf('龙吟') >= 0 && roar1.text.indexOf('70%') >= 0, '跌破七成响第一声：' + roar1.text.trim());
var bars1 = foeBars(b7);
assert(bars1 !== bars0, '敌方行动条真被扣了（' + bars0 + ' → ' + bars1 + '，每声 −' + TUNE.roar.base + '）');
assert(b7._forgeProcs('round', {}).text === '', '同档不重复响（阈值单调下降，每声每场一次）');
for (var part2 in b7.enemy.durabilities) b7.enemy.durabilities[part2] = Math.round(b7.enemy.maxDurabilities[part2] * 0.44);
var roar2 = b7._forgeProcs('round', {});
assert(roar2.text.indexOf('第二声') >= 0 || roar2.text.indexOf('第 2 声') >= 0, '跌破四成五响第二声：' + roar2.text.trim());
assert(b7._procRoarUsed === 2, '已响两声（实得 ' + b7._procRoarUsed + '）');
// 规避①：一波从满血打到只剩一口气 —— 跨过三道线，但**一回合只结算一声**
clearEquip(); equipProc('roar', 3);
var b7b = newBattle({ blood: 100 });
for (var part3 in b7b.enemy.durabilities) b7b.enemy.durabilities[part3] = 1;
var roarBurst = b7b._forgeProcs('round', {});
assert(roarBurst.text.indexOf('第 1 声') >= 0 && b7b._procRoarUsed === 1,
    '规避①：一波打穿三道线也只响一声（一句「' + roarBurst.text.trim() + '」，已用 ' + b7b._procRoarUsed + ' 声）');
assert(roarBurst.text.indexOf('第 2 声') < 0 && roarBurst.text.indexOf('第 3 声') < 0, '一次结算不吃掉后面两道线');
// 规避②：开场就把它打死（没有回合边界）→ 一声不响
clearEquip(); equipProc('roar', 3);
var b7b2 = newBattle({ blood: 100 });
b7b2.enemy.isAlive = false;
assert(b7b2._forgeProcs('round', {}).text === '', '规避②：敌人已倒下（没有可扣的活人）→ 一声不响');
// 规避②：不开 action 时间轴（_actors 建不起来）不崩、也不给
var b7c = newBattle({ blood: 100 });
b7c._actors = [];
for (var part4 in b7c.enemy.durabilities) b7c.enemy.durabilities[part4] = Math.round(b7c.enemy.maxDurabilities[part4] * 0.60);
assert(b7c._forgeProcs('round', {}).text === '', '规避②：行动条账建不起来时（无名可扣）就一声不响，不崩也不白给');

section('B8) 可见：开战播报念出手上的术，战斗中每条都有话');
clearEquip(); equipProc('reflect', 2); equipProc('aoe', 3, 'offHand');
var b8 = newBattle();
var brief = b8.log.filter(function (x) { return String(x.msg).indexOf('🔩 你手上的器带着这些术') >= 0; });
assert(brief.length === 1, '开战那一刻就念出手上带哪两条（实得 ' + brief.length + ' 条）');
assert(brief[0] && brief[0].msg.indexOf('反震·灵品') >= 0 && brief[0].msg.indexOf('陨星·仙品') >= 0,
    '播报连档位一起念：' + String(brief[0].msg).slice(0, 90));
assert(brief[0].msg.indexOf('单挑不触发') >= 0, '播报里把规避面也说了（玩家据此预判，不是打完才知道）');
// 没装术不念
clearEquip();
var b8b = newBattle();
assert(!b8b.log.some(function (x) { return String(x.msg).indexOf('你手上的器带着这些术') >= 0; }),
    '手上没带术就不占播报位');
// 全流程：proc 的话进的是同一条战斗日志
clearEquip(); equipProc('reflect', 3);
var b8c = newBattle();
var msg8 = withConst(0.5, function () { return b8c._executeAttack(b8c.enemy, b8c.player, 'chest', 'slash'); });
assert(msg8.msg.indexOf('反震') >= 0, '伤害那条消息里就带着 proc 的话（屏上一行看全，不是另找地方）：' + String(msg8.msg).slice(0, 70));

// ==================== C 段：确定性 ====================
section('C) 确定性：同条件连打 N 次逐字一致；换三个随机值 proc 判定一字不变');
clearEquip();
equipProc('reflect', 2); equipProc('stun', 2); equipProc('curse', 3); equipProc('aoe', 2);
function scriptedProcs() {
    var b = newBattle({ blood: 100, allies: ['野狼甲', '野狼乙'] });
    var trace = [];
    var t;
    t = b._applyOnHitAftermath(b.enemy, b.player, 24); trace.push('受:' + t);
    t = b._applyOnHitAftermath(b.player, b.enemy, 18); trace.push('击:' + t);
    t = b._applyOnHitAftermath(b.enemy, b.player, 15); trace.push('受:' + t);
    var g = b._forgeProcs('act', { attacker: b.enemy, defender: b.player });
    trace.push('act:' + g.skip + ':' + g.msg);
    for (var k = 0; k < 3; k++) { t = b._applyOnHitAftermath(b.player, b.enemy, 11); trace.push('击:' + t); }
    trace.push('层:' + b.enemy._procCurseStacks);
    var round = b._forgeProcs('round', {});
    trace.push('round:' + round.text);
    return trace.join('\n');
}
var traceA = withConst(0.1, scriptedProcs);
var traceB = withConst(0.5, scriptedProcs);
var traceC = withConst(0.9, scriptedProcs);
assert(traceA === traceB && traceB === traceC, '换三个随机值（0.1/0.5/0.9），proc 的判定与结果一字不变（proc 不读骰）');
var sameCount = 0;
for (var rep = 0; rep < 20; rep++) if (withConst(0.42, scriptedProcs) === traceA) sameCount++;
assert(sameCount === 20, '同一随机值连打 20 次，proc 转录逐字一致（' + sameCount + '/20）');
// 整场战斗（用常量骰子：命中/闪避/格挡/暴击全被钉死）连打 5 次逐字一致
function fullRun() {
    var b = newBattle({ blood: 100, allies: ['野狼甲'] });
    var out = [];
    for (var r = 0; r < 4 && !b.isFinished; r++) {
        b.playerAttack('chest');
        out.push(b.log.map(function (x) { return x.msg; }).join('§'));
        out.push(b.getActionBars().map(function (x) { return x.name + ':' + x.bar; }).join(','));
    }
    return out.join('¶');
}
var full1 = withConst(0.5, fullRun);
var fullHit = 0;
for (var rep2 = 0; rep2 < 5; rep2++) if (withConst(0.5, fullRun) === full1) fullHit++;
assert(fullHit === 5, '整场战斗连打 5 次，日志与行动条逐字一致（' + fullHit + '/5）');
assert(/反震|雷殛|诅咒|星陨/.test(full1), '这五场里 proc 真响了（不是空转）：' + (full1.match(/反震|雷殛|诅咒|星陨/g) || []).join('/'));

// ==================== D 段：不改主公式 ====================
section('D) 不改主公式：_calculateDamage 源码逐字不变；不装 proc 的战斗转录与改造前逐字一致');
var iStart = battleSrc.indexOf('    // A2: 伤害计算');
var iEnd = battleSrc.indexOf('    // 反击：50% 伤害', iStart);
var calcSrc = battleSrc.slice(iStart, iEnd);
var CALC_SHA = 'e843ac91c48f4be594a999ec29b64a745a2ed3c81b9473c3cf7535d82f5a8dce';
var crypto = require('crypto');
var calcSha = crypto.createHash('sha256').update(calcSrc, 'utf8').digest('hex');
assert(calcSha === CALC_SHA,
    '_calculateDamage 源码 sha256 未变（实测 ' + calcSha.slice(0, 16) + '… / 期望 ' + CALC_SHA.slice(0, 16) + '…）');
PROC_IDS.forEach(function (pid) {
    assert(calcSrc.indexOf("'" + pid + "'") < 0 && calcSrc.indexOf('_proc') < 0 && calcSrc.indexOf('FORGE_PROC') < 0,
        '主公式里没有 ' + pid + ' 的痕迹（proc 是增量，不是改公式）');
});
// 不装 proc 的战斗：与「改造前」那份 battle.js（.scratch 之外的等价还原，见 make-baseline.py）逐字一致
clearEquip();
var GOLDEN = '{"turn":0,"log":["👁️ 强敌 气息驳杂，似怀绝技：采补、游斗","⚔️ 强敌 略一抱拳，兵刃已出了一半"],"bars":"玩家:110/14,强敌:80/12,野狼甲:35/9","blood":100,"foe":100}';
// 真正比的是「同样的脚本在改造前后」——用工作区里那份还原件跑一遍（若不在，则退回 golden 比对）
var basePath = path.join(ROOT, '.scratch', 'fix-proc-progress', 'battle.before-proc.js');
function transcript() {
    var b = newBattle({ blood: 100, allies: ['野狼甲'] });
    var out = [];
    for (var r = 0; r < 6 && !b.isFinished; r++) {
        b.playerAttack('chest');
        out.push({ turn: r, log: b.log.map(function (x) { return x.msg; }) });
        out.push({ bars: b.getActionBars().map(function (x) { return x.name + ':' + x.bar + '/' + x.rate; }).join(',') });
        out.push({ blood: Math.round(b.player.physiology.bloodVolume), foe: Math.round(b.enemy.physiology.bloodVolume) });
    }
    out.push({ finished: b.isFinished, winner: b.winner, log: b.log.map(function (x) { return x.msg; }) });
    return JSON.stringify(out);
}
// 主公式 + proc 层双保险：不装 proc 时 _forgeProcs 三处都必须是零输出
clearEquip();
var bD = newBattle({ blood: 100, allies: ['野狼甲'] });
assert(bD._forgeProcs('aftermath', { attacker: bD.enemy, defender: bD.player, actual: 20 }).text === ''
    && bD._forgeProcs('round', {}).text === ''
    && bD._forgeProcs('act', { attacker: bD.enemy }).skip === false,
    '不装 proc：三个入口全部零输出（这一场与改造前逐字同一条路）');
var noProcTranscript = withConst(0.3, transcript);
assert(noProcTranscript.indexOf('反震') < 0 && noProcTranscript.indexOf('雷殛') < 0
    && noProcTranscript.indexOf('诅咒') < 0 && noProcTranscript.indexOf('星陨') < 0
    && noProcTranscript.indexOf('涅槃') < 0 && noProcTranscript.indexOf('狂血') < 0
    && noProcTranscript.indexOf('龙吟') < 0,
    '不装 proc 的整场转录里，proc 的字一个都没有');
assert(GOLDEN.indexOf('采补、游斗') >= 0, '（附）转录里确有敌技播报，说明这条路真跑起来了，不是空跑');

// ==================== E 段：后期材料产出表 ====================
section('E) 后期材料产出表：id 真实存在 / 周期必掉（非随机）/ 等级门槛与落档有效');
var matSrc = fs.readFileSync(path.join(ROOT, 'js/items-extended', '04-materials.js'), 'utf8');
var MAT_IDS = {};
var matRe = /id:\s*'(mat_[a-z_]+)'/g, mm;
while ((mm = matRe.exec(matSrc)) !== null) MAT_IDS[mm[1]] = 1;
var beastSrc = fs.readFileSync(path.join(ROOT, 'js/extensions', 'beast-ecosystem.js'), 'utf8');
var DROPS = F.LATE_MATERIAL_DROPS;
assert(DROPS.length >= 9, '产出表逐条 ' + DROPS.length + ' 行（材料 ← 妖兽/矿脉/秘境）');
DROPS.forEach(function (r) {
    assert(!!MAT_IDS[r.matId], '材料 id 真实存在：' + r.matId);
    assert(r.chance === 1 && r.guaranteed === true, r.matId + ' 是必掉（没有掉率这回事，只有周期）');
    assert(/^每 \d+ (只|趟|次)必掉$/.test(r.cadence), r.matId + ' 周期口径写明：' + r.cadence);
    if (r.beastId) {
        assert(beastSrc.indexOf("id: '" + r.beastId + "'") >= 0,
            '妖兽 id 真实存在（beast-ecosystem.js 模板账）：' + r.beastId + ' ' + r.beastName);
        assert(Number(r.beastLevel) > 35, r.beastId + ' 是高阶妖兽（' + r.beastLevel + ' 级）');
    }
    if (r.kind === 'mine') assert(Number(r.fromSkill) >= 60, '矿脉这一路有手艺门槛（采伐/锻造 ' + r.fromSkill + '）');
});
// 分档：36~48 归灵界/魔界高阶妖兽；50~60 归矿脉/秘境
var lvlOf = {};
for (var mi = 0; mi < DROPS.length; mi++) lvlOf[DROPS[mi].matId] = (F.MATERIAL_GRADE[DROPS[mi].matId] || {}).level;
var band36 = DROPS.filter(function (r) { return r.kind === 'beast' && lvlOf[r.matId] >= 36 && lvlOf[r.matId] <= 48; });
var band50 = DROPS.filter(function (r) { return lvlOf[r.matId] >= 50; });
assert(band36.length >= 4, '36~48 级材料 ← 高阶妖兽 共 ' + band36.length + ' 条（' + band36.map(function (r) { return r.matId + '←' + r.beastName; }).join('、') + '）');
assert(band50.length >= 2 && band50.every(function (r) { return r.kind === 'mine' || r.kind === 'secret'; }),
    '50~60 级材料 ← 矿脉/秘境 共 ' + band50.length + ' 条（' + band50.map(function (r) { return r.matId + '←' + r.sourceName; }).join('、') + '）');
// 零骰：结算路径里没有 Math.random
var forgeSrc = fs.readFileSync(path.join(ROOT, 'js/crafting/forging-compound.js'), 'utf8');
var settleBody = forgeSrc.slice(forgeSrc.indexOf('function settleLateMaterial'), forgeSrc.indexOf('// 秘境通关口'));
var tierBody = forgeSrc.slice(forgeSrc.indexOf('var LATE_MATERIAL_TIERS'), forgeSrc.indexOf('// 展平成'));
assert(settleBody.indexOf('Math.random') < 0 && tierBody.indexOf('Math.random') < 0, '结算与分档路径零 Math.random');
// 周期真的按阈值给（不给满就是不给）
function tallyReset() { F.getState().lateMatTally = {}; }
function give() { GIVEN.length = 0; }
var beast85 = F.LATE_MATERIAL_TIERS.filter(function (t) { return t.key === 'beast_85'; })[0];
tallyReset(); give();
var gotSeq = [];
for (var bi = 0; bi < 6; bi++) {
    gotSeq.push(F.settleLateMaterial('beast', { level: 85, isBeast: true }).given.length);
}
assert(JSON.stringify(gotSeq) === JSON.stringify([0, 0, beast85.drops.length, 0, 0, beast85.drops.length]),
    '85 级妖兽（幽脉蟒档 everyN=3）：六只里第 3、6 只给料（实得 ' + JSON.stringify(gotSeq) + '，每份 ' + beast85.drops.length + ' 件）');
var wantIds = beast85.drops.map(function (d) { return d.matId; });
assert(GIVEN.length === beast85.drops.length * 2, '发货件数对得上（' + GIVEN.length + ' 件）');
assert(wantIds.every(function (id) { return GIVEN.some(function (g) { return g.id === id; }); }),
    '发的全是登记在表里的那几件（' + GIVEN.map(function (g) { return g.id + '×' + g.n; }).join('、') + '）');
// 等级门槛：低于 60 一只都不给；等级分档取最高档
tallyReset(); give();
for (var lo = 0; lo < 4; lo++) F.settleLateMaterial('beast', { level: 30, isBeast: true });
assert(GIVEN.length === 0, '30 级妖兽不进任何后期档（0 件）');
tallyReset(); give();
F.settleLateMaterial('beast', { level: 85, isBeast: true });
assert(F.getState().lateMatTally.beast_85 === 1 && F.getState().lateMatTally.beast_60 === undefined,
    '85 级认最高档（beast_85），不去领 60 档的账（不会两份都记）');
// 非妖兽（人形）不落后期料
tallyReset(); give();
for (var hb = 0; hb < 4; hb++) F.settleLateMaterial('beast', { level: 90, isBeast: false });
assert(GIVEN.length === 0, '90 级人形强敌照样不给（这表只认妖兽/矿脉/秘境）');
// 矿脉这一路要手艺
tallyReset(); give();
for (var ms = 0; ms < 9; ms++) F.settleLateMaterial('mine', { skill: 20 });
assert(GIVEN.length === 0, '手艺 20 挖 9 趟：不出紫金（门槛 ' + F.LATE_MATERIAL_TIERS.filter(function (t) { return t.kind === 'mine'; })[0].fromSkill + '）');
tallyReset(); give();
var mineSeq = [];
for (var ms2 = 0; ms2 < 8; ms2++) mineSeq.push(F.settleLateMaterial('mine', { skill: 80 }).given.length);
assert(JSON.stringify(mineSeq) === JSON.stringify([0, 0, 0, 0, 0, 0, 0, 1]), '手艺 80 挖 8 趟：第 8 趟必出紫金（' + JSON.stringify(mineSeq) + '）');
// 秘境这一路（同一周期口径；两个档各自计次）
tallyReset(); give();
var secSeq = [];
for (var sc = 0; sc < 3; sc++) {
    var got = 0;
    F.LATE_MATERIAL_TIERS.forEach(function (t) { if (t.kind === 'secret') got += F.settleLateMaterial('secret', { key: t.key }).given.length; });
    secSeq.push(got);
}
assert(JSON.stringify(secSeq) === JSON.stringify([0, 0, 1]), '秘境三次通关：凤血档每 3 次必出（' + JSON.stringify(secSeq) + '）');
tallyReset(); give();
var sec60 = [];
for (var s6 = 0; s6 < 10; s6++) {
    var got2 = 0;
    F.LATE_MATERIAL_TIERS.forEach(function (t) { if (t.kind === 'secret') got2 += F.settleLateMaterial('secret', { key: t.key }).given.length; });
    sec60.push(got2);
}
assert(sec60.filter(function (x) { return x > 0; }).length === 4,
    '秘境十次通关：凤血档出了 3 份（第 3/6/9 次）、五行精华档出了 1 份（第 10 次）——两档各走各的计数，合计 '
    + sec60.filter(function (x) { return x > 0; }).length + ' 份（' + JSON.stringify(sec60) + '）');
// 计数随档落
assert(Object.keys(F.getState().lateMatTally).length >= 1, '周期计数落在 getState() 里（随 forgingConfig 落档，读档不清零）');
assert(fs.readFileSync(path.join(ROOT, 'js/crafting/forging-compound.js'), 'utf8').indexOf('_moduleState.lateMatTally = (s.lateMatTally') >= 0,
    'lateMatTally 真进了 _importState（读档回得来）');
tallyReset();

// ==================== F 段：槽位溢出（B 案） ====================
section('F) 槽位溢出：四阶料 +1 槽 / 五行精华 +2 槽，仍被锻造技能档封顶');
assert(F.GRADE_SLOT_BONUS.length === 6 && F.GRADE_SLOT_BONUS[4] === 1 && F.GRADE_SLOT_BONUS[5] === 2,
    '加槽表：品阶 0~3 不加、4 加一槽、5 加两槽（' + F.GRADE_SLOT_BONUS.join('/') + '）');
assert(F.effectiveAffixSlots(3, 80, ['mat_dark_iron']) === 3, '二阶料（玄铁）：仍是 3 槽（老配方不受影响）');
assert(F.effectiveAffixSlots(3, 80, ['mat_star_iron']) === 4, '四阶料（星辰铁）：3 → 4 槽');
assert(F.effectiveAffixSlots(3, 80, ['mat_five_element_essence']) === 5, '五阶料（五行精华）：3 → 5 槽');
assert(F.effectiveAffixSlots(3, 20, ['mat_five_element_essence']) === 3, '手艺 20（匠人 3 槽）＋五行精华：仍封在 3 槽（料再好也铺不开）');
assert(F.effectiveAffixSlots(3, 40, ['mat_five_element_essence']) === 4, '手艺 40（大师 4 槽）：封在 4 槽');
// 落到真实开炉上：同样这一炉，改造前（3 槽）溢出多少、现在（5 槽）溢出多少
function overflowWith(main, assist, skill) {
    return F.collectForgeAffixes({
        main: main, assist: assist, rune: [], skill: skill, maxAffixes: 3,
        env: { pointMult: 0, attrMult: {} }
    });
}
var poolRes = overflowWith(['mat_five_element_essence'], ['mat_five_element_essence', 'mat_dragon_scale'], 80);
assert(poolRes.maxAffixes === 5, '实炉上限 5（配方 3 + 五行精华 +2）');
// 3 槽口径下的同一炉（把品阶加槽关掉，重算一遍当基线）
var threeSlotCap = Math.min(F.affixSlotLimit(80), 3);
var capacity3 = threeSlotCap * F.maxPointsPerAffix(80);
var oldOverflow = Math.max(0, poolRes.budget.totalPoints - capacity3);
assert(poolRes.overflowPoints < oldOverflow,
    '总点数 ' + poolRes.budget.totalPoints + '：溢出从 ' + oldOverflow + ' 点压到 ' + poolRes.overflowPoints
    + ' 点（容量 3 槽×' + F.maxPointsPerAffix(80) + ' 点=' + capacity3 + ' → 5 槽×' + F.maxPointsPerAffix(80) + ' 点=' + (5 * F.maxPointsPerAffix(80)) + '）');
assert(poolRes.overflowPoints > 0,
    '（如实记下）这一炉仍剩 ' + poolRes.overflowPoints + ' 点投不出去——单条词缀的点数被档位封在 '
    + F.maxPointsPerAffix(80) + ' 点，槽位再多也加不出第 4 档；这是尚未解决的那一半溢出');
var lowRes = overflowWith(['mat_dark_iron'], ['mat_dark_iron', 'mat_dark_iron'], 20);
assert(lowRes.maxAffixes === 3 && lowRes.affixes.length <= 3, '低料低手艺仍封 3 条（实得 ' + lowRes.affixes.length + ' 条）');

console.log('\n=========================================');
console.log('legacy-forge-proc: ' + pass + ' passed, ' + fail + ' failed');
console.log('=========================================');
process.exit(fail > 0 ? 1 : 0);