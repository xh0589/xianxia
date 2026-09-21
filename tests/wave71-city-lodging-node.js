/**
 * wave71-city-lodging-node.js — 第七十一波 · 城里赁屋落脚 验收：
 *   A 签约账：无客栈不赁、头月租原子真扣、凑不出拒签、一人只有一处家、契书字段齐
 *   B 月钱账：到期自动缴、没到期不催、连月各缴一笔、缴不出收屋、收屋当天不送晨间、无真钟不催租
 *   C 晨间账：住家里心境小涨、人在外头不涨、满百不溢、零骰
 *   D 打盹账：免费、费时、精力封顶、满精力拒盹、没屋/人在外头拒盹
 *   E 退租账：退租清账、当月不退、退后福利停、可再签
 *   F 归一化：_lodging 单字段、坏账当没赁过、只认不补写、老档零成本
 *   G 哨兵：零骰零直写存档零悟道点、灵石只出不进、话术零拉丁、挂载序在册
 *
 * 运行：node tests/wave71-city-lodging-node.js
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

// ==================== 世界桩 ====================
global.window = global;
var msgs = [], logs = [], timeCalls = [], modals = [], newDayCbs = [];
global.showMessage = function (m, t) { msgs.push({ m: String(m), t: t }); };
global.showModal = function (t, html) { modals.push({ t: String(t), html: String(html) }); };
global.gameLog = { add: function (m) { logs.push(String(m)); } };
var ABS_DAY = 800;
global.timeSystem = {
    gameTime: { totalMinutes: 600 },
    advanceTime: function (m, r) { timeCalls.push({ m: m, r: String(r || '') }); },
    getAbsoluteDay: function () { return ABS_DAY; },
    onNewDaySubscribe: function (fn) { newDayCbs.push(fn); }
};
global.EventBus = { emit: function () {}, on: function () {} };
var CITY_DB = {
    '洛水城': { name: '洛水城', buildings: ['shop', 'inn', 'tea_house'] },
    '炎城': { name: '炎城', buildings: ['market', 'inn'] },
    '太虚山': { name: '太虚山', buildings: ['cultivation', 'temple'] }
};
global.locationSystem = { getCityData: function (c) { return CITY_DB[c] || null; } };
global.updateCurrencyUI = function () {};
global.updateCharacterStatus = function () {};
global.getCurrentCityName = function () { return global.currentCharData.location; };

global.currentCharData = {
    mood: 80, energy: 60, maxEnergy: 100, karma: 0, copper: 500,
    lifeSkills: {}, location: '洛水城'
};
global.inventory = { currency: { spiritStones: 1000, copper: 500 }, slots: [] };

function load(rel) {
    vm.runInThisContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), { filename: rel });
}
load('js/economy/economy-transaction.js');
load('js/core/reward-service.js');
load('js/city-facilities/city-lodging.js');

var CL = global.CityLodging;

function msgCount(w) { return msgs.filter(function (m) { return m.m.indexOf(w) >= 0; }).length; }
function logCount(w) { return logs.filter(function (m) { return m.indexOf(w) >= 0; }).length; }
function reset(city, opts) {
    opts = opts || {};
    ABS_DAY = opts.day == null ? 800 : opts.day;
    var c = global.currentCharData;
    c.mood = opts.mood == null ? 80 : opts.mood;
    c.energy = opts.energy == null ? 60 : opts.energy;
    c.copper = 500;
    c.location = city || '洛水城';
    delete c._lodging;
    global.inventory.currency = { spiritStones: opts.stones == null ? 1000 : opts.stones, copper: 500 };
    msgs.length = 0; logs.length = 0; timeCalls.length = 0; modals.length = 0;
}
function stones() { return global.inventory.currency.spiritStones; }
var origRandom = Math.random;

// ==================== A · 签约账 ====================
console.log('\n[A] 签约账（推门是自己的门）');
reset('太虚山');
eq(CL.sign('side'), false, 'A1 仙山赁不到屋（没有客栈就没有长租的生意）');
assert(msgCount('客栈') >= 1, 'A2 回绝话术说得明白');
eq(global.currentCharData._lodging, undefined, 'A3 没签成契书不落一笔');
reset('洛水城');
eq(CL.sign('side'), true, 'A4 有客栈的城签约成功');
eq(stones(), 970, 'A5 头一个月租钱三十灵石真扣（栈舍厢房）');
var l = global.currentCharData._lodging;
assert(l && l.city === '洛水城' && l.tier === 'side' && l.signedDay === 800 && l.nextDueDay === 830, 'A6 契书字段齐（城/档次/签日/到期日=签日加三十）');
assert(logCount('赁下了') >= 1 && logCount('三十') === 0 && logs[logs.length - 1].indexOf('30 灵石') >= 0, 'A7 签约回执报城名报月钱');
reset('洛水城', { stones: 10 });
eq(CL.sign('court'), false, 'A8 凑不出头月租——牙人把契书收回去');
eq(stones(), 10, 'A9 没签成分文不动');
eq(global.currentCharData._lodging, undefined, 'A10 没签成不落契书');
reset('洛水城');
CL.sign('side');
eq(CL.sign('court'), false, 'A11 一人只有一处家（再签被拦）');
assert(msgCount('只有一处家') >= 1, 'A12 拦得有话');
eq(CL.sign('阁楼'), false, 'A13 没登记的屋子不签');
reset('洛水城');
CL.sign('court');
eq(stones(), 920, 'A14 小院月钱八十真扣');
var ph = CL.panelHtml('洛水城');
assert(ph.indexOf('小院') >= 0 && ph.indexOf('到期') >= 0, 'A15 签了约的面板报家门与到期');
eq(CL.panelHtml('炎城'), '', 'A16 人在洛水，炎城的面板不串场');

// ==================== B · 月钱账 ====================
console.log('\n[B] 月钱账（到期自动缴，缴不出收屋）');
reset('洛水城', { day: 800 });
CL.sign('side');
ABS_DAY = 810;
CL.processDue();
eq(stones(), 970, 'B1 没到期不催租');
ABS_DAY = 830;
CL.processDue();
eq(stones(), 940, 'B2 到期日真缴一笔');
eq(global.currentCharData._lodging.nextDueDay, 860, 'B3 缴讫顺延三十天');
CL.processDue();
eq(stones(), 940, 'B4 同日再算不重复扣');
ABS_DAY = 860;
CL.onNewDay();
eq(stones(), 910, 'B5 连月各缴一笔（跨日总账走通）');
// 缴不出——收屋
reset('洛水城', { day: 800, stones: 100 });
CL.sign('side');
eq(stones(), 70, 'B5b 签约先缴头月（一百剩七十）');
ABS_DAY = 830;
global.inventory.currency.spiritStones = 20;
CL.onNewDay();
eq(global.currentCharData._lodging, null, 'B6 缴不出月钱——收屋（契书当场清）');
assert(msgCount('收了屋') >= 1, 'B7 收屋如实相告');
eq(global.currentCharData.mood, 80, 'B8 收屋当天不送晨间心境（没家的人没得接）');
global.inventory.currency.spiritStones = 10;
ABS_DAY = 860;
CL.processDue();
eq(stones(), 10, 'B9 收屋之后不再扣钱');
// 无真钟不催租
reset('洛水城', { day: 0 });
CL.sign('side');
eq(global.currentCharData._lodging.nextDueDay, 0, 'B10 没有真钟的日子契书不记到期（无从算起）');
ABS_DAY = 900;
CL.processDue();
eq(stones(), 970, 'B11 无钟契不催租（不白扣人钱）');

// ==================== C · 晨间账 ====================
console.log('\n[C] 晨间账（有家的人心气落得慢）');
reset('洛水城');
CL.sign('side');
global.currentCharData.mood = 70;
CL.morning();
eq(global.currentCharData.mood, 72, 'C1 住在赁屋里——晨间心境+2（厢房）');
reset('洛水城');
CL.sign('court');
global.currentCharData.mood = 70;
CL.morning();
eq(global.currentCharData.mood, 73, 'C2 小院晨间心境+3');
reset('洛水城');
CL.sign('side');
global.currentCharData.location = '野外';
global.currentCharData.mood = 70;
CL.morning();
eq(global.currentCharData.mood, 70, 'C3 人在外头屋空着——晨间没人接');
reset('洛水城');
global.currentCharData.mood = 70;
CL.morning();
eq(global.currentCharData.mood, 70, 'C4 没赁屋没晨间');
reset('洛水城', { mood: 99 });
CL.sign('side');
CL.morning();
eq(global.currentCharData.mood, 100, 'C5 心境满百不溢');
reset('洛水城');
CL.sign('side');
var rolled = 0;
Math.random = function () { rolled++; return 0.5; };
CL.morning(); CL.processDue(); CL.daysToDue();
Math.random = origRandom;
eq(rolled, 0, 'C6 晨间与租账全程零骰（月钱是定数，心气是定数）');

// ==================== D · 打盹账 ====================
console.log('\n[D] 打盹账（自己的床睡得踏实）');
reset('洛水城');
CL.sign('side');
global.currentCharData.energy = 50;
var sBefore = stones(), cBefore = global.inventory.currency.copper;
eq(CL.nap(), true, 'D1 回屋打盹');
eq(stones(), sBefore, 'D2 打盹不要钱（灵石分毫不动）');
eq(global.inventory.currency.copper, cBefore, 'D3 铜钱也分毫不动');
eq(global.currentCharData.energy, 80, 'D4 精力真回（五十加三十）');
eq(timeCalls[timeCalls.length - 1].m, 60, 'D5 一个时辰真花（时间是唯一的价）');
reset('洛水城');
CL.sign('court');
global.currentCharData.energy = 50;
CL.nap();
eq(global.currentCharData.energy, 90, 'D6 小院床好——精力加四十');
reset('洛水城');
CL.sign('side');
global.currentCharData.energy = 95;
CL.nap();
eq(global.currentCharData.energy, 100, 'D7 精力封顶不超');
reset('洛水城');
CL.sign('side');
global.currentCharData.energy = 100;
eq(CL.nap(), false, 'D8 精神正足躺不下（满精力拒盹）');
assert(msgCount('睡不着') >= 1, 'D9 拒得有人话');
reset('洛水城');
eq(CL.nap(), false, 'D10 没赁屋没得盹');
reset('洛水城');
CL.sign('side');
global.currentCharData.location = '炎城';
eq(CL.nap(), false, 'D11 人在外头——你的家不在这儿');
assert(msgCount('家在') >= 1, 'D12 回绝报出家的城');

// ==================== E · 退租账 ====================
console.log('\n[E] 退租账（当月租钱不退）');
reset('洛水城');
CL.sign('side');
var s0 = stones();
eq(CL.quit(), true, 'E1 退租');
eq(global.currentCharData._lodging, null, 'E2 契书当场清');
eq(stones(), s0, 'E3 当月租钱不退（契书上写明的）');
assert(logCount('不退') >= 1, 'E4 退租话术把「不退」讲在明处');
global.currentCharData.mood = 70;
CL.morning();
eq(global.currentCharData.mood, 70, 'E5 退租后晨间停');
eq(CL.nap(), false, 'E6 退租后没得盹');
eq(CL.quit(), false, 'E7 没赁屋退什么租（如实回绝）');
reset('洛水城');
CL.sign('side');
CL.quit();
global.currentCharData.location = '炎城';
eq(CL.sign('court'), true, 'E8 退租之后可以在别处再签（换城安家）');
eq(global.currentCharData._lodging.city, '炎城', 'E9 新契书是新城的');

// ==================== F · 归一化 ====================
console.log('\n[F] 归一化（坏账一律当没赁过）');
reset('洛水城');
eq(CL.ledger(), null, 'F1 老档无字段——当没赁过（迁移零成本）');
global.currentCharData._lodging = '一串字符';
eq(CL.ledger(), null, 'F2 契书坏成字符串——当没赁过');
global.currentCharData._lodging = { city: '洛水城', tier: '别墅', signedDay: 1, nextDueDay: 31 };
eq(CL.ledger(), null, 'F3 没登记的档次——当没赁过');
global.currentCharData._lodging = { city: '洛水城', tier: 'side', signedDay: 1, nextDueDay: '月底' };
eq(CL.ledger(), null, 'F4 到期日不是数——当没赁过');
global.currentCharData._lodging = { city: '', tier: 'side', signedDay: 1, nextDueDay: 31 };
eq(CL.ledger(), null, 'F5 城名空着——当没赁过');
var broken = { city: '洛水城', tier: 'side', signedDay: 1, nextDueDay: 'x' };
global.currentCharData._lodging = broken;
CL.ledger(); CL.morning(); CL.processDue();
eq(global.currentCharData._lodging, broken, 'F6 归一化只认不补写（读账不改账——押镖同款纪律）');
var sBroken = stones();
CL.processDue();
eq(stones(), sBroken, 'F7 坏契书不催租（不白扣人钱）');
reset('洛水城');
var kb = Object.keys(global.currentCharData);
CL.sign('side');
var ka = Object.keys(global.currentCharData);
var added = ka.filter(function (k) { return kb.indexOf(k) < 0; });
var removed = kb.filter(function (k) { return ka.indexOf(k) < 0; });
eq(added.join(','), '_lodging', 'F8 签约只添 _lodging 一个字段');
eq(removed.length, 0, 'F9 老字段一个不碰');

// ==================== G · 哨兵 ====================
console.log('\n[G] 哨兵（新账干净）');
var src = fs.readFileSync(path.join(ROOT, 'js/city-facilities/city-lodging.js'), 'utf8');
eq((src.match(/Math\.random/g) || []).length, 0, 'G1 赁屋全程零骰（租是定数，晨间是定数）');
assert(src.indexOf('localStorage') < 0 && src.indexOf('saveWildState') < 0 && src.indexOf('wildState') < 0, 'G2 零直写存档（契书是角色单字段）');
assert(src.indexOf('insightPoints') < 0 && src.indexOf('markOnce') < 0, 'G3 悟道点零发放（总闸已满）');
assert(src.indexOf('addSpiritStones') < 0 && src.indexOf('.credit(') < 0 && src.indexOf('addCopper') < 0, 'G4 灵石只出不进（赁屋是花钱的去处，不是营生路）');
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
eq(leak, null, 'G5 赁屋话术零拉丁（漏: ' + leak + '）');
var htmlSrc = fs.readFileSync(path.join(ROOT, '仙侠.html'), 'utf8');
assert(htmlSrc.indexOf('js/city-facilities/city-lodging.js') > htmlSrc.indexOf('js/city-facilities/street-stall.js'), 'G6 页面挂载在摆摊之后（同批新账排一处）');
var locSrc = fs.readFileSync(path.join(ROOT, 'js/location-system.js'), 'utf8');
assert(locSrc.indexOf('window.CityLodging.panelHtml(cityName)') >= 0 && locSrc.indexOf('catch (eLodge)') >= 0, 'G7 面板钩子在案且有守卫');
assert(newDayCbs.length >= 1, 'G8 跨日总账挂上了新日订阅（月钱与晨间都吃真钟）');
eq(CL.TIERS.side.rent, 30, 'G9 厢房月钱钉死三十');
eq(CL.TIERS.court.rent, 80, 'G10 小院月钱钉死八十');
eq(CL.MONTH_DAYS, 30, 'G11 一个月三十天（与历法同口径）');

console.log('\n========== 第七十一波 · 城里赁屋落脚 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
