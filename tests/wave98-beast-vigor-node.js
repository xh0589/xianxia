/**
 * wave98-beast-vigor-node.js — 第九十八波 · 妖兽力气账 验收：
 *   用户点账：「那妖兽出招都消耗什么？」——此前答案是「什么都不耗」（天生技全是被动触发，
 *   妖兽精英/boss 平砍和普通野狼一个打法）。本波接上世界已有的活账：精力（stamina）。
 *   A 妖兽重手烧精力：精英 35 / boss 50，烧干只能平砍；幼兽/剧痛/普通野狼出不了手
 *   B 名号是妖兽路数：爪/撞/角（撕裂爪、蛮撞、穿甲角…），不是人的刀掌枪
 *   C 回气分家：妖兽平砍回精力比人形回真气慢（4+亏空/25，血肉不是风箱）；出重手那一动不回
 *   D 采补功协同：玩家采补功吸的就是这本精力账——妖王被吸干就只能干挠爪子（真联动，非新账）
 *   E 人形照旧烧真气：两本资源互不串账
 *   F 条价与哨兵：重手条价与玩家招式同一本价；零中英混排；挂全量回归
 *
 * 运行：node tests/wave98-beast-vigor-node.js
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
function near(a, b, msg) { assert(Math.abs(a - b) < 0.001, msg + '（实际=' + a + ' 期望≈' + b + '）'); }
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

function mkPlayer(overrides) {
    var d = {
        name: '玩家', level: 10,
        attrs: { strength: 30, dexterity: 20, intelligence: 20, willpower: 20, constitution: 30, meridian: 30 },
        skills: { '内功': 40 }, loot: {}, physiologyType: 'humanoid'
    };
    Object.assign(d, overrides || {});
    return new Entity(d, 'player');
}
function mkBeast(name, opts) {
    opts = opts || {};
    var data = {
        name: name || '妖狼', level: opts.level || 12,
        attrs: opts.attrs || { strength: 40, dexterity: 25, intelligence: 5, willpower: 10, constitution: 35, meridian: 10 },
        skills: {}, loot: { exp: 10, copper: 5 },
        physiologyType: 'beast', species: 'beast',
        combatAbilities: opts.abilities || ['pounce'],
        damageType: opts.damageType || 'slash'
    };
    if (opts.type) data.type = opts.type;
    if (opts.aiBehavior) data.aiBehavior = opts.aiBehavior;
    return new Entity(data, 'beast');
}
function newBattle(p, e) {
    TAL.reset();
    msgs.length = 0;
    var b = new Battle(p || mkPlayer(), e || mkBeast());
    global.currentBattle = b;
    return b;
}
function hasLog(b, kw) {
    return b.log.some(function (l) { return String(l.msg).indexOf(kw) >= 0; });
}
// 建场推轴是真骰：妖兽身法快过玩家，首击带猛扑+暴击偶尔直接把玩家打倒（isFinished 后
// _enemyMainAct 会直接返回）。本套测的是精力账不是那一场——行动类断言前把玩家扶起来、清胜负。
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

// ==================== A · 妖兽重手烧精力 ====================
console.log('\n[A] 妖兽重手烧精力（不是人的真气账）');
var bA1 = newBattle(mkPlayer(), mkBeast('精英狼王', { type: 'elite' }));
eq(bA1.enemy.maxStamina, 117.5, 'A1 妖兽精力上限=100+体质×0.5（体质35=117.5）');
// 妖兽身法快过玩家——开战推轴时它可能已先动过一手；对账前把精力归满（钉死初始条件）
bA1.enemy.stamina = bA1.enemy.maxStamina;
stubRnd(0.3);   // balanced 血足 want=0.4
var hs1 = bA1._foeHeavyStrike(bA1.enemy, 'balanced', 100, 0);
Math.random = origRnd;
assert(hs1 && hs1.beast === true, 'A2 妖兽精英出得了重手（妖兽路数标）');
eq(hs1 && hs1.mult, 1.5, 'A3 精英重手 ×1.5（与人形精英同档）');
eq(hs1 && hs1.apCost, 150, 'A4 条价与玩家招式同一本价（round(100×1.5)=150）');
near(bA1.enemy.stamina, 82.5, 'A5 重手烧精力 117.5→82.5（精英一口 35）');
eq(bA1.enemy.qi, 0, 'A6 妖兽没有真气账可烧（qi 恒 0）');
var bA7 = newBattle(mkPlayer(), mkBeast('兽潮头目', { type: 'boss', damageType: 'blunt' }));
bA7.enemy.stamina = bA7.enemy.maxStamina;   // 归满再对账（开战推轴可能已先烧过一口）
stubRnd(0.3);
var hs7 = bA7._foeHeavyStrike(bA7.enemy, 'balanced', 100, 0);
Math.random = origRnd;
eq(hs7 && hs7.mult, 1.8, 'A7 妖兽 boss 重手 ×1.8');
near(bA7.enemy.stamina, 67.5, 'A8 boss 一口烧 50（117.5→67.5）');
eq(hs7 && hs7.bonus.hitBonus, 10, 'A9 boss 重手命中 +10');
var bA10 = newBattle(mkPlayer(), mkBeast('普通野狼', {}));
stubRnd(0.01);
eq(bA10._foeHeavyStrike(bA10.enemy, 'aggressive', 100, 0), null, 'A10 普通野狼没这份气血（重手是身份的体现）');
Math.random = origRnd;
var bA11 = newBattle(mkPlayer(), mkBeast('幼兽', { type: 'elite', level: 5 }));
stubRnd(0.01);
eq(bA11._foeHeavyStrike(bA11.enemy, 'aggressive', 100, 0), null, 'A11 幼兽气血未成（5级出不了重手）');
Math.random = origRnd;
var bA12 = newBattle(mkPlayer(), mkBeast('力竭狼王', { type: 'elite' }));
bA12.enemy.stamina = 20;
stubRnd(0.01);
eq(bA12._foeHeavyStrike(bA12.enemy, 'aggressive', 100, 0), null, 'A12 精力不够（20<35）只能干挠爪子');
Math.random = origRnd;
var bA13 = newBattle(mkPlayer(), mkBeast('重伤狼王', { type: 'elite' }));
stubRnd(0.01);
eq(bA13._foeHeavyStrike(bA13.enemy, 'aggressive', 100, 70), null, 'A13 剧痛（70≥60）提不起劲');
Math.random = origRnd;

// ==================== B · 名号是妖兽路数 ====================
console.log('\n[B] 妖兽的名号是爪/撞/角，不是人的刀掌枪');
var bB1 = newBattle(mkPlayer(), mkBeast('裂风狼王', { type: 'elite', damageType: 'slash' }));
var nm1 = bB1._foeMoveName(bB1.enemy);
assert(['撕裂爪', '噬咬', '裂风爪'].indexOf(nm1) >= 0, 'B1 爪路名号在妖兽池里（' + nm1 + '）');
eq(bB1._foeMoveName(bB1.enemy), nm1, 'B2 一头兽定一招（名号不换来换去）');
var bB3 = newBattle(mkPlayer(), mkBeast('铁角犀', { type: 'elite', damageType: 'pierce' }));
assert(['穿甲角', '贯骨刺', '一点角芒'].indexOf(bB3._foeMoveName(bB3.enemy)) >= 0, 'B3 角路名号在妖兽刺池里');
var bB4 = newBattle(mkPlayer(), mkBeast('黑风寨主', { type: 'elite', damageType: 'slash', attrs: { strength: 35, dexterity: 20, intelligence: 15, willpower: 15, constitution: 35, meridian: 20 } }));
bB4.enemy.species = 'human'; bB4.enemy.physiologyType = 'humanoid';
assert(['断岳斩', '拖刀势', '力劈华山'].indexOf(bB4._foeMoveName(bB4.enemy)) >= 0, 'B4 人形强敌仍走人的刀路池（两本名号不串）');

// ==================== C · 回气分家 ====================
console.log('\n[C] 妖兽平砍回精力（比真气回得慢——血肉不是风箱）');
var bC1 = newBattle(mkPlayer(), mkBeast('普通野狼', {}));
freshField(bC1);
bC1.enemy.stamina = 50;
stubRnd(0.5);
bC1._enemyMainAct();
Math.random = origRnd;
near(bC1.enemy.stamina, 56, 'C1 平砍回精力 50→56（4+floor(67.5/25)=6，比人形真气回得慢）');
var bC2 = newBattle(mkPlayer(), mkBeast('喘匀的', {}));
freshField(bC2);
bC2.enemy.stamina = 115;
stubRnd(0.5);
bC2._enemyMainAct();
Math.random = origRnd;
near(bC2.enemy.stamina, 117.5, 'C2 回气不越上限（115→117.5 封顶）');
// 出重手那一动不回气（烧出去的就是烧出去的）
var bC3 = newBattle(mkPlayer(), mkBeast('精英狼王', { type: 'elite' }));
freshField(bC3);
bC3.enemy.stamina = bC3.enemy.maxStamina;   // 归满再对账
var fakeActor = { e: bC3.enemy, side: 'enemy', kind: 'enemyMain', bar: 250, rate: 10 };
stubRnd(0.3);
bC3._resolveActor(fakeActor);
Math.random = origRnd;
assert(hasLog(bC3, '一声低吼'), 'C3 妖兽重手战报是吼出来的（不是「真气一运」）');
near(bC3.enemy.stamina, 82.5, 'C4 重手那一动只烧不回（117.5→82.5，没有回气贴补）');
eq(fakeActor.bar, 100, 'C5 这一动的条按重手价扣（250-150=100）');

// ==================== D · 采补功协同（真联动，非新账） ====================
console.log('\n[D] 采补功吸的就是这本精力账（吸干妖王，它就只能干挠爪子）');
var bD1 = newBattle(mkPlayer({ combatAbilities: ['drain_qi'] }), mkBeast('妖王', { type: 'boss', level: 14 }));
var stamBefore = bD1.enemy.stamina;
stubRnd(0.5);
bD1._executeAttack(bD1.player, bD1.enemy, 'chest', 'slash');
Math.random = origRnd;
near(bD1.enemy.stamina, stamBefore - (6 + 14), 'D1 玩家采补功命中——妖王精力被吸走 20（6+等级14）');
// 被吸到不够重手门槛：妖王空有一身气血也出不了重手
bD1.enemy.stamina = 40;   // boss 重手要 50
stubRnd(0.01);
eq(bD1._foeHeavyStrike(bD1.enemy, 'aggressive', 100, 0), null, 'D2 精力被吸到 40（<50）——妖王这一下只能干挠爪子');
Math.random = origRnd;
bD1.enemy.stamina = 60;
stubRnd(0.01);
assert(bD1._foeHeavyStrike(bD1.enemy, 'aggressive', 100, 0), 'D3 缓过劲来（60≥50）重手又活了');
Math.random = origRnd;

// ==================== E · 人形照旧烧真气 ====================
console.log('\n[E] 两本资源互不串账');
var bE1 = newBattle(mkPlayer(), new Entity({
    name: '精英刀客', level: 12, type: 'elite',
    attrs: { strength: 35, dexterity: 20, intelligence: 15, willpower: 15, constitution: 35, meridian: 20 },
    skills: { '内功': 35 }, loot: {}, physiologyType: 'humanoid'
}, 'enemy'));
bE1.enemy.qi = bE1.enemy.maxQi;   // 归满再对账
var stamE = bE1.enemy.stamina;
stubRnd(0.3);
var hsE = bE1._foeHeavyStrike(bE1.enemy, 'balanced', 100, 0);
Math.random = origRnd;
assert(hsE && !hsE.beast, 'E1 人形精英的重手是人形路数');
eq(bE1.enemy.qi, 82, 'E2 人形烧真气（112→82）');
near(bE1.enemy.stamina, stamE, 'E3 人形的精力一点没动（两本账不串）');

// ==================== F · 哨兵 ====================
console.log('\n[F] 哨兵');
var bSrc = src('js/battle.js');
assert(bSrc.indexOf('第九十八波·妖兽平砍回精力') >= 0 && bSrc.indexOf('撕裂爪') >= 0 && bSrc.indexOf('蛮撞') >= 0, 'F1 妖兽重手与名号池在案');
assert(bSrc.indexOf('isBeast ? (tier === \'boss\' ? 50 : 35)') >= 0, 'F2 妖兽重手价目写死在资源分支（精英35/boss50）');
assert(bSrc.indexOf('4 + Math.floor(((enemy.maxStamina || 0) - (enemy.stamina || 0)) / 25)') >= 0, 'F3 妖兽回精力慢于人形回真气（4+亏空/25）');
assert(bSrc.indexOf('defender.stamina = Math.max(0, tgtStamina - pDrainCost)') >= 0, 'F4 采补功吸精力的老账原样（协同不是新造的）');
var seg = bSrc.slice(bSrc.indexOf('// ===== 第九十七波·对面也是活人'), bSrc.indexOf('// v10.0：使用招式攻击指定部位'));
var leak = null;
(seg.match(/'[^']+'/g) || []).forEach(function (q) {
    var v = q.slice(1, -1);
    if (/[+);({\[,?<>]/.test(v)) return;
    if (/^[a-z0-9_]+(?:[-_:. ][a-z0-9_]+)*$/i.test(v)) return;
    if (/^[A-Za-z0-9_\-:.\/#% ]+$/.test(v)) return;
    if (/[A-Za-z]/.test(v) && /[一-龥]/.test(v)) leak = leak || q;
});
eq(leak, null, 'F5 新话术零中英混排（漏: ' + leak + '）');
assert(seg.indexOf('每日') < 0 && seg.indexOf('次数已用完') < 0, 'F6 无人工计数器（精力/真气都是世界账）');
assert(src('tests/run-all.sh').indexOf('wave98-beast-vigor-node.js') >= 0, 'F7 本套已挂全量回归');
delete global.currentBattle;

console.log('\n========== 第九十八波 · 妖兽力气账 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
