/**
 * wave77-equipment-sets-node.js — 第七十七波 · 套装有名有魂 验收：
 *   A 套装谱：三套立号、毕业线十三件各归各套一件不落不重、成员全是物品库现货、档位递增
 *   B 感应账：两件起感应、一件不响、非套货不认、脱下即散、只认穿着不认行囊
 *   C 回响账：档位累积、数目与谱面钉死、无套装空表
 *   D 接线账：战斗加成汇总真吃到回响（inventory 真加载）、装备页户口行在册、穿脱钩子在册
 *   E 提点账：头一回对账只记不报、升档报名号、凑齐报全文、拆套不报
 *   F 哨兵：零骰零档零经济零拉丁、物品库零新货、老基线一分不添
 *
 * 运行：node tests/wave77-equipment-sets-node.js
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

// ==================== 世界桩 ====================
global.window = global;
var msgs = [];
global.showMessage = function (m) { msgs.push(String(m)); };
global.document = {
    createElement: function () { return { style: {}, classList: { add: function () {}, remove: function () {} }, innerHTML: '', textContent: '' }; },
    getElementById: function () { return null; },
    querySelector: function () { return null; },
    addEventListener: function () {},
    body: { appendChild: function () {} }
};
var store = {};
global.localStorage = {
    getItem: function (k) { return store[k] !== undefined ? store[k] : null; },
    setItem: function (k, v) { store[k] = String(v); },
    removeItem: function (k) { delete store[k]; }
};
global.timeSystem = { gameTime: { totalMinutes: 0 }, advanceTime: function () {}, getAbsoluteDay: function () { return 800; } };
global.currentCharData = { realm: '金丹', location: '洛水城' };
global.currentEquipment = {};
global.inventory = { currency: { spiritStones: 100, copper: 100 }, slots: [] };
global.itemById = {};
global.StateRegistry = { register: function () {} };
global.EventBus = { emit: function () {}, on: function () {} };
global.updateCurrencyUI = function () {};
global.updateInventoryUI = function () {};

load('js/equipment/equipment-sets.js');
load('js/inventory.js');

var ES = global.EquipmentSets;
var GC = global.getCombatBonuses;

// 毕业线十三件（v20.91 铺好的现货，一个不多一个不少）
var GRAD_13 = ['wpn_heaven_ask', 'wpn_nirvana_staff', 'arm_heaven_ring', 'arm_dao_ring', 'arm_heaven_crown',
    'arm_cloud_shoes', 'arm_nine_turn_robe', 'arm_primordial_pendant', 'arm_immortal_seal',
    'arm_pangu_shield', 'arm_starry_necklace', 'arm_xuan_belt', 'arm_jiao_gauntlets'];

function wear(ids) {
    global.currentEquipment = {};
    var slots = ['mainHand', 'offHand', 'head', 'neck', 'body', 'waist', 'hands', 'feet', 'ring1', 'ring2', 'acc1', 'acc2'];
    ids.forEach(function (id, i) {
        global.currentEquipment[slots[i % slots.length]] = { id: id, name: id };
    });
}
function clearWear() { global.currentEquipment = {}; }

// ==================== A · 套装谱 ====================
console.log('\n[A] 套装谱（三套立号，十三件各归各套）');
eq(ES.SETS.length, 3, 'A1 三个名号（问天/合道/开天）');
var allPieces = [];
var dup = {};
ES.SETS.forEach(function (s) { s.pieces.forEach(function (p) { allPieces.push(p); if (dup[p]) dup[p] = 2; dup[p] = 1; }); });
eq(allPieces.length, 13, 'A2 十三件毕业装全入了套');
eq(Object.keys(dup).filter(function (k) { return dup[k] === 2; }).length, 0, 'A3 一件货只属一套（不脚踏两条船）');
eq(allPieces.slice().sort().join(','), GRAD_13.slice().sort().join(','), 'A4 套谱与毕业线十三件一字对账（一件不落一件不多）');
var expSrc = fs.readFileSync(path.join(ROOT, 'js/items-extended/18-grade-expansion.js'), 'utf8');
assert(GRAD_13.every(function (id) { return expSrc.indexOf("'" + id + "'") >= 0; }), 'A5 套员全是物品库现货（零新货——九品谱老账一字不动）');
var byId = {};
ES.SETS.forEach(function (s) { byId[s.id] = s; });
assert(byId['heaven_ask'] && byId['heaven_ask'].pieces.length === 4, 'A6 问天套四件（剑修）');
assert(byId['dao_merge'] && byId['dao_merge'].pieces.length === 5, 'A7 合道套五件（法修）');
assert(byId['pangu_open'] && byId['pangu_open'].pieces.length === 4, 'A8 开天套四件（体修）');
var thrOk = ES.SETS.every(function (s) {
    var last = 1;
    return s.thresholds.every(function (t) { var ok = t.n > last && t.n <= s.pieces.length && t.line; last = t.n; return ok; }) &&
        s.thresholds[s.thresholds.length - 1].n === s.pieces.length;
});
assert(thrOk, 'A9 档位严格递增、顶档就是全套、每档有说法');
var bonusOk = ES.SETS.every(function (s) {
    return s.thresholds.every(function (t) {
        return Object.keys(t.bonus).length > 0 && Object.keys(t.bonus).every(function (k) { return Number(t.bonus[k]) > 0; });
    });
});
assert(bonusOk, 'A10 回响全是正数（套装只添不减——不穿才是不添）');
assert(ES.SETS.every(function (s) { return s.full && s.name && s.icon && s.school; }), 'A11 每套有名号有图标有门派有全套说法');
eq(ES.statusLine(), '', 'A12 光着身子——户口行是空的');

// ==================== B · 感应账 ====================
console.log('\n[B] 感应账（两件起感应，脱下即散）');
clearWear();
eq(ES.activeSets().length, 0, 'B1 没穿没套');
wear(['wpn_heaven_ask']);
eq(ES.activeSets().length, 0, 'B2 一件不响（两件起感应）');
wear(['wpn_heaven_ask', 'arm_heaven_ring']);
var a2 = ES.activeSets();
eq(a2.length, 1, 'B3 两件成套感应');
eq(a2[0].id, 'heaven_ask', 'B4 感应的是问天套');
eq(a2[0].count, 2, 'B5 件数如实');
wear(['wpn_heaven_ask', 'arm_heaven_ring', 'mat_peach_fruit']);
eq(ES.activeSets()[0].count, 2, 'B6 非套货不充数（仙桃不是剑）');
wear(['wpn_heaven_ask', 'arm_heaven_ring', 'arm_pangu_shield', 'arm_xuan_belt']);
var a4 = ES.activeSets();
eq(a4.length, 2, 'B7 两套并行各算各的（问天两件+开天两件）');
wear(['wpn_heaven_ask', 'arm_heaven_ring']);
wear(['wpn_heaven_ask']);
eq(ES.activeSets().length, 0, 'B8 脱下即散（现推不落账）');
// 只认穿着不认行囊
clearWear();
global.inventory.slots = [{ id: 'wpn_heaven_ask', count: 1 }, { id: 'arm_heaven_ring', count: 1 }];
eq(ES.activeSets().length, 0, 'B9 套装塞在行囊里不算数（穿在身上才算）');
global.inventory.slots = [];
// 克隆体也认（equipItem 存的是浅克隆）
global.currentEquipment = { mainHand: { id: 'wpn_heaven_ask', enhancementLevel: 5 }, ring1: { id: 'arm_heaven_ring', refineLevel: 2 } };
eq(ES.activeSets().length, 1, 'B10 强化过的克隆体照认（货号在就算）');
clearWear();

// ==================== C · 回响账 ====================
console.log('\n[C] 回响账（档位累积，数目钉死）');
wear(['wpn_heaven_ask', 'arm_heaven_ring']);
eq(JSON.stringify(ES.combatBonus()), JSON.stringify({ crit: 8 }), 'C1 问天两件：暴击+8（就这一口）');
wear(['wpn_heaven_ask', 'arm_heaven_ring', 'arm_heaven_crown']);
var b3 = ES.combatBonus();
eq(b3.crit, 8, 'C2 三件档累积——两件的账不丢（暴击仍是8）');
eq(b3.attack, 40, 'C3 三件添攻击40');
eq(b3.hit, 10, 'C4 三件添命中10');
wear(['wpn_heaven_ask', 'arm_heaven_ring', 'arm_heaven_crown', 'arm_cloud_shoes']);
var b4 = ES.combatBonus();
eq(b4.attack, 120, 'C5 问天全套：攻击40+80=120（档位累积）');
eq(b4.crit, 20, 'C6 暴击8+12=20');
eq(b4.penetrate, 10, 'C7 全套才有破防10');
wear(['wpn_nirvana_staff', 'arm_dao_ring', 'arm_nine_turn_robe', 'arm_primordial_pendant', 'arm_immortal_seal']);
var b5 = ES.combatBonus();
eq(b5.defense, 180, 'C8 合道全套：防御40+60+80=180');
eq(b5.block, 27, 'C9 格挡12+15=27');
eq(b5.dodge, 10, 'C10 全套才有闪避10');
wear(['arm_pangu_shield', 'arm_starry_necklace', 'arm_xuan_belt', 'arm_jiao_gauntlets']);
var b6 = ES.combatBonus();
eq(b6.defense, 90, 'C11 开天全套：防御30+60=90');
eq(b6.attack, 30, 'C12 开天全套带攻击30（体修也咬人）');
clearWear();
eq(Object.keys(ES.combatBonus()).length, 0, 'C13 没套装——空表（老基线一分不添）');

// ==================== D · 接线账 ====================
console.log('\n[D] 接线账（回响真进战斗派生表）');
assert(typeof GC === 'function', 'D1 战斗加成汇总函数在位（inventory 真加载）');
clearWear();
var base0 = GC({ attack: 100 });
eq(base0.attack, 100, 'D2 没套装——老账原样（100 还是 100）');
eq(base0.crit, undefined, 'D3 没套装——暴击键根本不出现');
wear(['wpn_heaven_ask', 'arm_heaven_ring']);
var base2 = GC({ attack: 100 });
eq(base2.crit, 8, 'D4 两件问天——汇总口真吃到暴击8');
eq(base2.attack, 100, 'D5 两件档没攻击账——攻击分毫不添');
wear(['wpn_heaven_ask', 'arm_heaven_ring', 'arm_heaven_crown', 'arm_cloud_shoes']);
var base4 = GC({ attack: 100 });
eq(base4.attack, 220, 'D6 全套问天——100+120=220（回响进的是同一条汇总河）');
eq(base4.penetrate, 10, 'D7 破防也在');
clearWear();
var invSrc = fs.readFileSync(path.join(ROOT, 'js/inventory.js'), 'utf8');
assert(invSrc.indexOf('window.EquipmentSets.combatBonus') >= 0 && invSrc.indexOf('catch (eSet)') >= 0, 'D8 汇总口接线带守卫（缺模块静默）');
var eqSrc = fs.readFileSync(path.join(ROOT, 'js/equipment.js'), 'utf8');
eq((eqSrc.match(/typeof window\.EquipmentSets\.noteChange/g) || []).length, 2, 'D9 穿与脱两处都对了账（各带一道守卫）');
var appSrc = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
assert(appSrc.indexOf('equip-set-line') >= 0 && appSrc.indexOf('EquipmentSets.statusLine') >= 0, 'D10 装备页户口行接线在册');
var htmlSrc = fs.readFileSync(path.join(ROOT, '仙侠.html'), 'utf8');
assert(htmlSrc.indexOf('id="equip-set-line"') >= 0, 'D11 户口行的位置在页面上了');
assert(htmlSrc.indexOf('js/equipment/equipment-sets.js') > htmlSrc.indexOf('js/equipment/bonded-artifact.js'), 'D12 挂载排在本命法宝之后（装备账一处排齐）');

// ==================== E · 提点账 ====================
console.log('\n[E] 提点账（成套那一声，只响一回礼）');
wear(['wpn_heaven_ask', 'arm_heaven_ring']);
msgs.length = 0;
ES.noteChange();
eq(msgs.length, 0, 'E1 头一回对账只记不报（读档穿着的不算新凑）');
wear(['wpn_heaven_ask', 'arm_heaven_ring', 'arm_heaven_crown']);
msgs.length = 0;
ES.noteChange();
eq(msgs.length, 1, 'E2 升档报一声');
assert(msgs[0].indexOf('问天三件') >= 0, 'E3 报的是新档的说法');
wear(['wpn_heaven_ask', 'arm_heaven_ring', 'arm_heaven_crown', 'arm_cloud_shoes']);
msgs.length = 0;
ES.noteChange();
eq(msgs.length, 2, 'E4 凑齐全套报两条（档位说法+全套名号）');
assert(msgs[1].indexOf('问天剑出鞘') >= 0, 'E5 全套的说法有名有姓');
wear(['wpn_heaven_ask', 'arm_heaven_ring']);
msgs.length = 0;
ES.noteChange();
eq(msgs.length, 0, 'E6 拆套不吭声（只报喜不报丧——散了的账自己看户口行）');
wear(['wpn_heaven_ask', 'arm_heaven_ring']);
msgs.length = 0;
ES.noteChange();
eq(msgs.length, 0, 'E7 原样不动不唠叨（同一副行头不重复报）');
clearWear();

// ==================== F · 哨兵 ====================
console.log('\n[F] 哨兵（新账干净）');
var src = fs.readFileSync(path.join(ROOT, 'js/equipment/equipment-sets.js'), 'utf8');
eq((src.match(/Math\.random/g) || []).length, 0, 'F1 套装账零骰（谱是死的，感应是数的）');
assert(src.indexOf('localStorage') < 0 && src.indexOf('saveWildState') < 0, 'F2 零直写存档（套装状况现推——脱下即散）');
assert(src.indexOf('currentCharData') < 0, 'F3 不碰角色账（零新存档字段）');
assert(src.indexOf('spiritStones') < 0 && src.indexOf('copper') < 0 && src.indexOf('RewardService') < 0 && src.indexOf('.credit(') < 0, 'F4 零经济（回响进战力不进钱袋）');
assert(src.indexOf('insightPoints') < 0, 'F5 悟道点零发放');
var latin = /[A-Za-z]/;
var leak = null;
(src.match(/'[^']+'/g) || []).forEach(function (s) {
    var v = s.slice(1, -1);
    if (/[+);({\[,?<>]/.test(v)) return;
    if (v.indexOf('\\') >= 0) return;
    if (/typeof|===|!==/.test(v)) return;
    if (/^[a-z0-9]+(?:[-_: ][a-z0-9]+)*$/.test(v)) return;
    if (latin.test(v)) leak = leak || s;
});
eq(leak, null, 'F6 套装话术零拉丁（漏: ' + leak + '）');
eq(expSrc.indexOf('第七十七波'), -1, 'F7 物品库一字未动（零新货——套谱认的全是现货）');
assert(src.indexOf('第七十七波') >= 0, 'F8 新账注脚在册');
var setMarker = ['js/equipment.js', 'js/inventory.js', 'js/app.js'].map(function (f) {
    return (fs.readFileSync(path.join(ROOT, f), 'utf8').match(/第七十七波/g) || []).length;
});
eq(setMarker.join(','), '1,1,1', 'F9 三处接线各一笔（不多不少）');
eq((src.match(/id: '/g) || []).length, 3, 'F10 套谱就三套（没夹带私货）');

console.log('\n========== 第七十七波 · 套装有名有魂 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
