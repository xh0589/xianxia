/**
 * wave97-foe-living-node.js — 第九十七波 · 对面也是活人 验收：
 *   幻想自己是 NPC 想用各种招式，撞上的五堵墙逐一拆掉（用户点账：再想想战斗功能，
 *   幻想自己是 NPC，想用各种招式，会不会发现各种奇怪的限制）：
 *   A 真气账：人形敌人有真气（40+等级×6），平砍回气与玩家同式；妖兽没有（靠天生技）
 *   B 招牌重手：精英/boss/带词缀的烧自己真气出重手（×1.5/×1.8），普通杂兵仍是平砍——
 *     档位走身份不走全局数值；真气烧干只能平砍回气；剧痛/低龄/妖兽出不了手
 *   C 重手条价：与玩家招式同一本行动条价（round(100×倍率) 夹 60~150），重招收势久
 *   D 行囊是真的：濒死掏出怀里的丹药干咽（hp_recovery 真账、单次封顶六成气血），
 *     吃一颗少一颗——打死他搜刮到的就是剩下的
 *   E 同伙也是活人：数据透传（绝技/种系/生理/携带物不再被没收），带遁术的濒死自行脱身，
 *     怀里绷带用一次（战地止血）
 *   F 守御普及：重伤+剧痛任何武人都可能架势喘口气（不再是守御系专利）
 *   G 哨兵：档位闸在案、零中英混排、挂全量回归
 *
 * 运行：node tests/wave97-foe-living-node.js
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
function mkEnemy(name, opts) {
    opts = opts || {};
    var data = {
        name: name || '强敌', level: opts.level || 12,
        attrs: opts.attrs || { strength: 35, dexterity: 20, intelligence: 15, willpower: 15, constitution: 35, meridian: 20 },
        skills: { '内功': 35 }, loot: { exp: 10, copper: 5 }, physiologyType: opts.physiologyType || 'humanoid'
    };
    if (opts.aiBehavior) data.aiBehavior = opts.aiBehavior;
    if (opts.type) data.type = opts.type;                     // 原始档位 enemy/elite/boss
    if (opts.affix) data._affix = opts.affix;                 // 野外词缀强敌
    if (opts.species) data.species = opts.species;
    if (opts.damageType) data.damageType = opts.damageType;
    if (opts.carried) data.carriedInventory = opts.carried;
    if (opts.abilities) data.combatAbilities = opts.abilities;
    return new Entity(data, opts.entityType || 'enemy');
}
function newBattle(p, e, allies) {
    TAL.reset();
    msgs.length = 0;
    var b = new Battle(p || mkPlayer(), e || mkEnemy(), allies);
    global.currentBattle = b;
    return b;
}
function hasLog(b, kw) {
    return b.log.some(function (l) { return String(l.msg).indexOf(kw) >= 0; });
}
function countLog(b, kw) {
    return b.log.filter(function (l) { return String(l.msg).indexOf(kw) >= 0; }).length;
}

// ==================== A · 真气账 ====================
console.log('\n[A] 敌人的真气账（武人有真气，妖兽没有）');
var bA1 = newBattle(mkPlayer(), mkEnemy('刀客', { level: 12 }));
eq(bA1.enemy.maxQi, 112, 'A1 人形敌人真气上限=40+等级×6（12级=112）');
eq(bA1.enemy.qi, 112, 'A2 进场真气是满的');
var bA3 = newBattle(mkPlayer(), mkEnemy('妖狼', { level: 12, species: 'beast', physiologyType: 'beast', entityType: 'beast' }));
eq(bA3.enemy.maxQi, 0, 'A3 妖兽没有真气账（靠天生技吃饭）');
eq(bA3.enemy.qi, 0, 'A4 妖兽真气为零');
var bA5 = newBattle(mkPlayer(), mkEnemy('寨主', { level: 12, type: 'boss' }));
eq(bA5.enemy._enemyType, 'boss', 'A5 原始档位随实体留档（boss）');
// 平砍回气（与玩家普攻回气同式：6 + (上限-现有)/20 取整）
var bA6 = newBattle(mkPlayer(), mkEnemy('刀客', { level: 12 }));
bA6.enemy.qi = 50;
stubRnd(0.5);
bA6._enemyMainAct();
Math.random = origRnd;
eq(bA6.enemy.qi, 59, 'A6 平砍回气 50→59（6+floor(62/20)=9，与玩家同式）');
var bA7 = newBattle(mkPlayer(), mkEnemy('刀客', { level: 12 }));
bA7.enemy.qi = 110;
stubRnd(0.5);
bA7._enemyMainAct();
Math.random = origRnd;
eq(bA7.enemy.qi, 112, 'A7 回气不越上限（110→112 封顶）');

// ==================== B · 招牌重手（档位走身份） ====================
console.log('\n[B] 招牌重手（精英/boss 烧自己真气——杂兵仍是平砍）');
var bB1 = newBattle(mkPlayer(), mkEnemy('精英刀客', { level: 12, type: 'elite', damageType: 'slash' }));
stubRnd(0.3);   // balanced 血足 want=0.4——0.3 落进
var hs1 = bB1._foeHeavyStrike(bB1.enemy, 'balanced', 100, 0);
Math.random = origRnd;
assert(hs1 && hs1.tier === 'elite', 'B1 精英出得了招牌重手');
eq(hs1 && hs1.mult, 1.5, 'B2 精英重手 ×1.5');
eq(hs1 && hs1.apCost, 150, 'B3 重手条价=round(100×1.5)=150（与玩家招式同一本价）');
eq(bB1.enemy.qi, 82, 'B4 重手烧自己真气 112→82（不是无限预算）');
assert(hs1 && ['断岳斩', '拖刀势', '力劈华山'].indexOf(hs1.name) >= 0, 'B5 刀客的重手名号在刀路池里（' + (hs1 && hs1.name) + '）');
eq(bB1._foeMoveName(bB1.enemy), hs1.name, 'B6 一人定一招（名号不换来换去）');
var bB7 = newBattle(mkPlayer(), mkEnemy('杂兵', { level: 12 }));
stubRnd(0.01);
eq(bB7._foeHeavyStrike(bB7.enemy, 'aggressive', 100, 0), null, 'B7 普通杂兵没这份身手（骰再低也不出重手）');
Math.random = origRnd;
var bB8 = newBattle(mkPlayer(), mkEnemy('魔头', { level: 20, type: 'boss', damageType: 'blunt' }));
stubRnd(0.3);
var hs8 = bB8._foeHeavyStrike(bB8.enemy, 'balanced', 100, 0);
Math.random = origRnd;
eq(hs8 && hs8.mult, 1.8, 'B8 boss 重手 ×1.8');
eq(hs8 && hs8.apCost, 150, 'B9 boss 条价封顶 150（重招收势久）');
eq(bB8.enemy.qi, 120, 'B10 boss 重手烧真气 40（160→120）');
eq(hs8 && hs8.bonus.hitBonus, 10, 'B11 boss 重手命中 +10（精英 +5）');
assert(hs8 && ['开山掌', '碎骨拳', '崩字诀'].indexOf(hs8.name) >= 0, 'B12 钝击名家出掌路名号（' + (hs8 && hs8.name) + '）');
// 各道门槛
var bB13 = newBattle(mkPlayer(), mkEnemy('少年精英', { level: 5, type: 'elite' }));
stubRnd(0.01);
eq(bB13._foeHeavyStrike(bB13.enemy, 'aggressive', 100, 0), null, 'B13 真气没入门（5级）驱动不了重手');
var bB14 = newBattle(mkPlayer(), mkEnemy('力竭精英', { level: 12, type: 'elite' }));
bB14.enemy.qi = 20;
eq(bB14._foeHeavyStrike(bB14.enemy, 'aggressive', 100, 0), null, 'B14 真气不够（20<30）只能平砍');
var bB15 = newBattle(mkPlayer(), mkEnemy('重伤精英', { level: 12, type: 'elite' }));
eq(bB15._foeHeavyStrike(bB15.enemy, 'aggressive', 100, 70), null, 'B15 剧痛（70≥60）提不起劲');
Math.random = origRnd;
// 第九十八波改口径：妖兽 boss 也使重手——但烧的是精力、出的是爪/撞/角，不是人的刀掌枪（详见 wave98 套件）
var bB16 = newBattle(mkPlayer(), mkEnemy('妖兽头目', { level: 12, type: 'boss', species: 'beast', physiologyType: 'beast', entityType: 'beast', damageType: 'blunt' }));
stubRnd(0.01);
var hs16 = bB16._foeHeavyStrike(bB16.enemy, 'aggressive', 100, 0);
Math.random = origRnd;
assert(hs16 && hs16.beast === true, 'B16 妖兽 boss 的重手是妖兽路数（烧精力，不烧真气）');
assert(hs16 && ['蛮撞', '横扫千军', '塌山压'].indexOf(hs16.name) >= 0, 'B16b 名号在妖兽钝路池里（' + (hs16 && hs16.name) + '）');
eq(bB16.enemy.qi, 0, 'B16c 妖兽没有真气账——一点没动');
var bB17 = newBattle(mkPlayer(), mkEnemy('带词缀的', { level: 12, affix: '嗜血' }));
stubRnd(0.3);
var hs17 = bB17._foeHeavyStrike(bB17.enemy, 'balanced', 100, 0);
Math.random = origRnd;
assert(hs17 && hs17.tier === 'elite', 'B17 带词缀的野外强敌按精英档出手');
// 游斗的专挑你虚的时候下重手
var bB18 = newBattle(mkPlayer(), mkEnemy('游斗精英', { level: 12, type: 'elite', aiBehavior: 'opportunist' }));
bB18.player.physiology.bloodVolume = 40;   // 玩家虚了
stubRnd(0.5);   // want=0.55——0.5 落进
assert(bB18._foeHeavyStrike(bB18.enemy, 'opportunist', 100, 0), 'B18 玩家半血下游斗的敢下重手（want 0.55）');
Math.random = origRnd;
var bB19 = newBattle(mkPlayer(), mkEnemy('游斗精英', { level: 12, type: 'elite', aiBehavior: 'opportunist' }));
bB19.player.physiology.bloodVolume = 100;  // 玩家满状态
stubRnd(0.5);   // want=0.25——0.5 落不进
eq(bB19._foeHeavyStrike(bB19.enemy, 'opportunist', 100, 0), null, 'B19 玩家满状态游斗的收着手（want 0.25）');
Math.random = origRnd;

// ==================== C · 重手条价（走完整时间轴） ====================
console.log('\n[C] 重手条价与完整动作流');
var bC1 = newBattle(mkPlayer(), mkEnemy('精英刀客', { level: 12, type: 'elite' }));
var fakeActor = { e: bC1.enemy, side: 'enemy', kind: 'enemyMain', bar: 250, rate: 10 };
stubRnd(0.3);   // 重手骰落进（balanced want 0.4）
bC1._resolveActor(fakeActor);
Math.random = origRnd;
assert(hasLog(bC1, '招牌重手'), 'C1 重手真出手了（战报点名）');
eq(fakeActor.bar, 100, 'C2 这一动的条按重手价扣（250-150=100，不是白拿的 100）');
eq(bC1._foeLastAp, 0, 'C3 条价账当场清');
eq(bC1.enemy.qi, 82, 'C4 真气账同步烧掉（112→82）');
// 真气烧干后：只能平砍回气，条价回到 100
var bC5 = newBattle(mkPlayer(), mkEnemy('精英刀客', { level: 12, type: 'elite' }));
bC5.enemy.qi = 10;
var fakeActor5 = { e: bC5.enemy, side: 'enemy', kind: 'enemyMain', bar: 250, rate: 10 };
stubRnd(0.3);
bC5._resolveActor(fakeActor5);
Math.random = origRnd;
assert(!hasLog(bC5, '招牌重手'), 'C5 真气不够这一动只能平砍');
eq(fakeActor5.bar, 150, 'C6 平砍条价照旧 100（250-100）');
eq(bC5.enemy.qi, 21, 'C7 平砍回气 10→21（6+floor(102/20)=11）');

// ==================== D · 行囊是真的（濒死掏丹） ====================
console.log('\n[D] 怀里的丹药真能吃（吃一颗少一颗）');
var bD1 = newBattle(mkPlayer(), mkEnemy('揣丹的', { level: 12, carried: { items: ['pill_small_recovery'], spiritStones: 0, copper: 0 } }));
bD1.enemy.physiology.bloodVolume = 20;
stubRnd(0.5);   // <0.7 掏丹
bD1._enemyMainAct();
Math.random = origRnd;
eq(bD1.enemy.physiology.bloodVolume, 50, 'D1 小还丹真回血 20→50（hp_recovery 30 真账）');
eq(bD1.enemy.carriedInventory.items.length, 0, 'D2 吃一颗少一颗（行囊空了——搜刮到的就是剩下的）');
assert(hasLog(bD1, '干咽下去'), 'D3 战报有画面（摸出丹药干咽）');
assert(!hasLog(bD1, '的攻击'), 'D4 吃药这一动不打人（整动用来吃药）');
var bD5 = newBattle(mkPlayer(), mkEnemy('揣两种丹的', { level: 12, carried: { items: ['pill_small_recovery', 'pill_big_recovery'], spiritStones: 0, copper: 0 } }));
bD5.enemy.physiology.bloodVolume = 20;
stubRnd(0.5);
bD5._enemyMainAct();
Math.random = origRnd;
eq(bD5.enemy.physiology.bloodVolume, 80, 'D5 先吃贵的（大还丹 80，药力单次封顶六成：20+60=80）');
eq(bD5.enemy.carriedInventory.items.join(','), 'pill_small_recovery', 'D6 小还丹还留在怀里');
var bD7 = newBattle(mkPlayer(), mkEnemy('揣还魂丹的', { level: 12, carried: { items: ['pill_nine_revival'], spiritStones: 0, copper: 0 } }));
bD7.enemy.physiology.bloodVolume = 10;
stubRnd(0.5);
bD7._enemyMainAct();
Math.random = origRnd;
eq(bD7.enemy.physiology.bloodVolume, 70, 'D7 还魂丹药力单次封顶六成（10+60=70，濒死不能一口灌满）');
var bD8 = newBattle(mkPlayer(), mkEnemy('揣矿石的', { level: 12, carried: { items: ['mat_iron_ore'], spiritStones: 0, copper: 0 } }));
bD8.enemy.physiology.bloodVolume = 20;
stubRnd(0.5);
bD8._enemyMainAct();
Math.random = origRnd;
assert(!hasLog(bD8, '干咽'), 'D8 怀里没丹就吃不上（矿石不能当饭）');
eq(bD8.enemy.carriedInventory.items.length, 1, 'D9 没吃的东西一件不少');
var bD10 = newBattle(mkPlayer(), mkEnemy('硬气的', { level: 12, carried: { items: ['pill_small_recovery'], spiritStones: 0, copper: 0 } }));
bD10.enemy.physiology.bloodVolume = 20;
stubRnd(0.9);   // >0.7 咬牙不掏
bD10._enemyMainAct();
Math.random = origRnd;
assert(!hasLog(bD10, '干咽'), 'D10 七成把握才掏丹——这一回他咬牙抡刀');
eq(bD10.enemy.carriedInventory.items.length, 1, 'D11 没吃就不少');
var bD12 = newBattle(mkPlayer(), mkEnemy('血厚的', { level: 12, carried: { items: ['pill_small_recovery'], spiritStones: 0, copper: 0 } }));
bD12.enemy.physiology.bloodVolume = 60;
stubRnd(0.1);
bD12._enemyMainAct();
Math.random = origRnd;
assert(!hasLog(bD12, '干咽'), 'D12 血还过半不掏丹（濒死才摸怀里，不到 30 不吃）');

// ==================== E · 同伙也是活人 ====================
console.log('\n[E] 同伙不是二等公民');
var bE1 = newBattle(mkPlayer(), mkEnemy('头目', { level: 12 }), [
    { name: '妖狼', type: 'beast', combatAbilities: ['pounce'], damageType: 'pierce', carriedInventory: { items: ['mat_fang'], spiritStones: 0, copper: 0 }, attrs: { strength: 30, dexterity: 25, intelligence: 5, willpower: 10, constitution: 30, meridian: 10 } }
]);
var wolf = bE1.enemyAllies[0];
assert(wolf && wolf.combatAbilities.indexOf('pounce') >= 0, 'E1 同伙的绝技不再被没收（猛扑带进场）');
eq(wolf && wolf.species, 'beast', 'E2 妖兽同伙认妖兽种系');
eq(wolf && wolf.physiologyType, 'beast', 'E3 妖兽同伙按妖兽生理挨打（不再按人形）');
eq(wolf && wolf.damageType, 'pierce', 'E4 同伙的兵刃路数带进场（穿刺）');
assert(wolf && wolf.carriedInventory && wolf.carriedInventory.items[0] === 'mat_fang', 'E5 同伙的携带物带进场');
eq(wolf && wolf.maxQi, 0, 'E6 妖兽同伙没有真气账');
var bE7 = newBattle(mkPlayer(), mkEnemy('头目', { level: 12 }), [
    { name: '刀客同伙', combatAbilities: ['venom'], attrs: { strength: 30, dexterity: 20, intelligence: 10, willpower: 10, constitution: 30, meridian: 10 } }
]);
var henchman = bE7.enemyAllies[0];
eq(henchman.hasAbility('venom'), true, 'E7 人形同伙的绝技真在场（施毒可触发）');
eq(henchman.maxQi, 112, 'E8 人形同伙也有真气账（跟头目同级 12）');
// 带遁术的同伙濒死自行脱身
var bE9 = newBattle(mkPlayer(), mkEnemy('头目', { level: 12 }), [
    { name: '滑头同伙', combatAbilities: ['escape'], attrs: { strength: 20, dexterity: 30, intelligence: 10, willpower: 10, constitution: 20, meridian: 10 } }
]);
var slip = bE9.enemyAllies[0];
slip.physiology.bloodVolume = 20;
stubRnd(0.3);   // <0.4 逃
bE9._enemyAllyAct(slip);
Math.random = origRnd;
eq(slip.isAlive, false, 'E9 带遁术的同伙濒死脱身（离场）');
eq(slip._fled, true, 'E10 逃了的就是逃了（_fled 标）');
assert(hasLog(bE9, '夺路而逃'), 'E11 战报写明他跑了');
assert(bE9.enemy.isAlive && !bE9.isFinished, 'E12 只是这一位走了——主敌照打，仗没完');
// 怀里绷带用一次
var bE13 = newBattle(mkPlayer(), mkEnemy('头目', { level: 12 }), [
    { name: '带伤同伙', attrs: { strength: 25, dexterity: 20, intelligence: 10, willpower: 10, constitution: 25, meridian: 10 } }
]);
var hurt = bE13.enemyAllies[0];
hurt.physiology.bloodVolume = 40;
hurt.physiology.wounds.push({ id: 'w_ally_1', partId: 'chest', bleeding: true, stabilized: false, stabilization: 0, externalBleedRate: 8, internalBleedRate: 0 });
stubRnd(0.9);
bE13._enemyAllyAct(hurt);
Math.random = origRnd;
eq(hurt._fieldBandageUsed, true, 'E13 同伙会自己包扎（手里那包绷带是真账）');
assert(hasLog(bE13, '缠住了伤口'), 'E14 战报有画面（缩到阵后缠伤）');
var logN = bE13.log.length;
stubRnd(0.9);
bE13._enemyAllyAct(hurt);
Math.random = origRnd;
eq(countLog(bE13, '缠住了伤口'), 1, 'E15 绷带就一包——第二次不再包（照常出手）');
assert(bE13.log.length > logN, 'E16 第二动是出手（有新增战报）');

// ==================== F · 守御普及 ====================
console.log('\n[F] 守御不再是守御系专利');
var bF1 = newBattle(mkPlayer(), mkEnemy('狂战士', { level: 12, aiBehavior: 'aggressive' }));
bF1.enemy.physiology.bloodVolume = 32;
bF1.enemy.physiology.painLoad = 50;
bF1._foeTricks.feignUsed = true;   // 低血先掷装死（九十四波姿态闸在前）——这位已经演过一回，本场不再演
stubRnd(0.1);   // <0.15 本能闸
bF1._enemyMainAct();
Math.random = origRnd;
assert(hasLog(bF1, '凝神防御'), 'F1 狂攻路数重伤剧痛也会架起架势喘口气');
eq(bF1.enemy._guardTurns, 1, 'F2 守御标真立起来');
var bF3 = newBattle(mkPlayer(), mkEnemy('壮汉', { level: 12, aiBehavior: 'aggressive' }));
bF3.enemy.physiology.bloodVolume = 100;
bF3.enemy.physiology.painLoad = 0;
stubRnd(0.05);
bF3._enemyMainAct();
Math.random = origRnd;
assert(!hasLog(bF3, '凝神防御'), 'F3 好端端的不摆架势（本能只在重伤剧痛时发作）');

// ==================== G · 哨兵 ====================
console.log('\n[G] 哨兵');
var bSrc = src('js/battle.js');
['_foeHeavyStrike', '_foeMoveName', '_foeLastAp', '行囊是真的', '夺路而逃', '同伙不是二等公民'].forEach(function (kw) {
    assert(bSrc.indexOf(kw) >= 0, 'G1 引擎口子在案：' + kw);
});
assert(bSrc.indexOf("if (tier === 'foe') return null;") >= 0, 'G2 档位闸在案——普通杂兵不出重手（不做全局数值放大）');
assert(bSrc.indexOf('Math.min(_pillHeal, Math.max(1, Math.round(_bloodCap * 0.6)))') >= 0, 'G3 丹药单次封顶六成（还魂丹也不能一口灌满）');
var seg = bSrc.slice(bSrc.indexOf('// ===== 第九十七波·对面也是活人'), bSrc.indexOf('// v10.0：使用招式攻击指定部位'));
var leak = null;
(seg.match(/'[^']+'/g) || []).forEach(function (q) {
    var v = q.slice(1, -1);
    if (/[+);({\[,?<>]/.test(v)) return;
    if (/^[a-z0-9_]+(?:[-_:. ][a-z0-9_]+)*$/i.test(v)) return;
    if (/^[A-Za-z0-9_\-:.\/#% ]+$/.test(v)) return;
    if (/[A-Za-z]/.test(v) && /[一-龥]/.test(v)) leak = leak || q;
});
eq(leak, null, 'G4 新话术零中英混排（漏: ' + leak + '）');
assert(seg.indexOf('每日') < 0 && seg.indexOf('次数已用完') < 0, 'G5 无人工计数器（真气/丹药/绷带都是世界账）');
assert(src('tests/run-all.sh').indexOf('wave97-foe-living-node.js') >= 0, 'G6 本套已挂全量回归');
delete global.currentBattle;

console.log('\n========== 第九十七波 · 对面也是活人 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
