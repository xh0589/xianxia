/**
 * wave74-city-faces-node.js — 第七十四波 · 市井人物有脸 验收：
 *   A 花名册账：同城同角色永远同一张脸、换城换脸、称呼对角色、零骰、名字纯中文
 *   B 营生有脸：应募/上工/辞工/旷工辞人的话里都点名东家、弹窗挂东家、缺册退回老话
 *   C 摆摊有脸：成交报过客称呼、同脸再上门认熟客、价钱客流分毫不动、缺册退回「一位过客」
 *   D 赁屋有脸：签约报牙人与街坊、退租收屋点名、弹窗挂两张脸、缺册退回老话
 *   E 贩货有脸：柜上管事有名有姓（回执+贩货单开场）、缺册退回「掌柜」
 *   F 哨兵：花名册零骰零经济零存档、四本账零新字段、话术零拉丁、挂载序在册
 *
 * 运行：node tests/wave74-city-faces-node.js
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
var msgs = [], logs = [], timeCalls = [], modals = [], repCalls = [], trades = [];
global.showMessage = function (m, t) { msgs.push({ m: String(m), t: t }); };
global.showModal = function (t, html) { modals.push({ t: String(t), html: String(html) }); };
global.gameLog = { add: function (m) { logs.push(String(m)); } };
global.confirm = function () { return true; };
var ABS_DAY = 800;
global.timeSystem = {
    gameTime: { totalMinutes: 600, currentDay: 100 },
    advanceTime: function (m) { timeCalls.push(m); },
    getAbsoluteDay: function () { return ABS_DAY; },
    onNewDaySubscribe: function () {}
};
global.EventBus = { emit: function () {}, on: function () { return function () {}; } };
global.addReputation = function (c, n) { repCalls.push({ c: c, n: n }); };
var CITY_DB = {
    '洛水城': { name: '洛水城', buildings: ['shop', 'inn', 'library', 'medical_clinic', 'fire_department'] },
    '炎城': { name: '炎城', buildings: ['market', 'inn'] },
    '金城': { name: '金城', buildings: ['shop', 'inn', 'mining'] },
    '太虚山': { name: '太虚山', buildings: ['cultivation', 'temple'] }
};
global.locationSystem = {
    getCityData: function (c) { return CITY_DB[c] || null; },
    getCurrentLocation: function () { return global.currentCharData.location; },
    getCityPriceModifier: function () { return 1; }
};
global.MarketDynamic = {
    CITIES: ['中州', '南疆'],
    priceMul: function () { return 1; },
    notePlayerTrade: function (id, q, b) { trades.push({ id: id, q: q, b: b }); }
};
global.updateCurrencyUI = function () {};
global.updateCharacterStatus = function () {};
global.updateInventoryUI = function () {};
global.getCurrentCityName = function () { return global.currentCharData.location; };
global.itemById = {
    mat_herb1: { id: 'mat_herb1', name: '灵露草', icon: '🌿', price: 40, category: 'material', subtype: 'herb' }
};
function makeSlot(id, count) {
    return { uid: 'u_' + id, templateId: id, count: count, getTemplate: function () { return global.itemById[id] || null; } };
}
global.currentCharData = {
    mood: 80, energy: 100, maxEnergy: 100, karma: 0, copper: 500,
    lifeSkills: { '学识': 40, '医术': 40, '口才': 10 }, location: '洛水城'
};
global.inventory = { currency: { spiritStones: 1000, copper: 500 }, slots: [] };

function load(rel) {
    vm.runInThisContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), { filename: rel });
}
load('js/economy/economy-transaction.js');
load('js/core/reward-service.js');
load('js/city-facilities/city-faces.js');
load('js/economy/peddler-service.js');
load('js/city-facilities/street-stall.js');
load('js/city-facilities/city-lodging.js');
load('js/city-facilities/city-jobs.js');
load('js/core/scenario-engine.js');
load('js/city-facilities/facility-batch2.js');
load('js/city-facilities/facility-batch3.js');
load('js/city-facilities/facility-peddler-contract.js');

var CF = global.CityFaces;
var SS = global.StreetStall;
var CL = global.CityLodging;
var CJ = global.CityJobs;
var PD = global.PeddlerService;
var SE = global.scenarioEngine;

function logCount(w) { return logs.filter(function (m) { return m.indexOf(w) >= 0; }).length; }
function msgCount(w) { return msgs.filter(function (m) { return m.m.indexOf(w) >= 0; }).length; }
var origRandom = Math.random;
function withRandom(v, fn) {
    Math.random = function () { return v; };
    try { return fn(); } finally { Math.random = origRandom; }
}
function reset(city, slots) {
    if (SS.session()) SS.close();
    if (CL.ledger()) CL.quit();
    if (CJ.ledger()) CJ.quitJob();
    var c = global.currentCharData;
    c.mood = 80; c.energy = 100; c.copper = 500;
    c.lifeSkills = { '学识': 40, '医术': 40, '口才': 10 };
    c.location = city || '洛水城';
    delete c._lodging; delete c._employ; delete c._peddler;
    global.inventory = { currency: { spiritStones: 1000, copper: 500 }, slots: slots || [makeSlot('mat_herb1', 5)] };
    msgs.length = 0; logs.length = 0; timeCalls.length = 0; modals.length = 0; repCalls.length = 0; trades.length = 0;
    ABS_DAY = 800;
}

// ==================== A · 花名册账 ====================
console.log('\n[A] 花名册账（街坊认脸，脸不能天天换）');
var f1 = CF.face('洛水城', 'shopkeeper');
var f2 = CF.face('洛水城', 'shopkeeper');
eq(f1.name, f2.name, 'A1 同城同角色两回对脸——同一张脸（定死）');
assert(f1.surname && f1.name.indexOf(f1.surname) === 0, 'A2 名字带姓（姓打头）');
eq(f1.title, '掌柜', 'A3 铺子的东家称掌柜');
eq(CF.face('洛水城', 'tutor').title, '先生', 'A4 蒙馆的称先生');
eq(CF.face('洛水城', 'doctor').title, '郎中', 'A5 医馆的称郎中');
eq(CF.face('洛水城', 'watch_head').title, '更头', 'A6 巡夜的班头称更头');
eq(CF.face('洛水城', 'broker').title, '牙人', 'A7 立契的称牙人');
eq(CF.face('洛水城', 'merchant_clerk').title, '管事', 'A8 商行柜上的称管事');
eq(f1.addr, f1.surname + '掌柜', 'A9 市井称呼=姓+称呼（王掌柜这么叫）');
assert(f1.full.indexOf('掌柜·') === 0, 'A10 招牌写法在册');
var cities = ['洛水城', '炎城', '金城', '帝都·长安', '青木城', '冰原城', '鲛人镇', '万毒谷'];
var faces = {};
cities.forEach(function (ct) { faces[CF.face(ct, 'shopkeeper').name] = 1; });
assert(Object.keys(faces).length >= 4, 'A11 八座城的掌柜至少四张脸（千城千面不撞衫）');
var rolled = 0;
Math.random = function () { rolled++; return 0.5; };
CF.face('洛水城', 'shopkeeper'); CF.passerby('洛水城', 800, 0); CF.face('炎城', 'broker');
Math.random = origRandom;
eq(rolled, 0, 'A12 对脸全程零骰（脸是播种定死的）');
var latin = /[A-Za-z]/;
assert(!latin.test(f1.name + f1.addr + f1.full), 'A13 名字纯中文');
var p1 = CF.passerby('洛水城', 800, 0);
var p1b = CF.passerby('洛水城', 800, 0);
eq(p1.addr, p1b.addr, 'A14 同日同摊同一位过客（不换个脸说谎）');
var pseen = {};
for (var pi = 0; pi < 6; pi++) { pseen[CF.passerby('洛水城', 800, pi).addr] = 1; }
assert(Object.keys(pseen).length >= 2, 'A15 一场摊六位过客不止一张脸');
assert(CF.SURNAMES.indexOf(p1.surname) >= 0 && CF.STREET_TITLES.indexOf(p1.title) >= 0, 'A16 过客的姓与称呼都在池子里');
eq(CF.face('', 'shopkeeper'), null, 'A17 没城名不对脸（不硬造）');
eq(CF.face('洛水城', ''), null, 'A18 没角色不对脸');

// ==================== B · 营生有脸 ====================
console.log('\n[B] 营生有脸（东家有名有姓）');
reset('洛水城');
var boss = CF.face('洛水城', 'shopkeeper').addr;
CJ.apply('shop_assistant');
assert(logCount(boss) >= 1 && logCount('亲自点了头') >= 1, 'B1 应募回执点名东家（' + boss + '亲自点了头）');
CJ.work();
assert(logCount('点了工册') >= 1 && logs[logs.length - 1].indexOf(boss) >= 0, 'B2 上工回执点名东家（点了工册）');
CJ.quitJob();
assert(logCount(boss + '点点头') >= 1, 'B3 辞工是东家亲自点的头');
CJ.apply('shop_assistant');
ABS_DAY = 810;
CJ.onNewDay();
assert(logCount(boss + '托人捎话') >= 1, 'B4 辞人的话是东家托人捎的');
CJ.apply('night_watch');
var boss2 = CF.face('洛水城', 'watch_head').addr;
assert(logCount(boss2) >= 1 && boss2 !== boss, 'B5 更夫巡夜的东家另有一张脸（' + boss2 + '）');
CJ.open();
var jm = modals[modals.length - 1];
assert(jm.html.indexOf('东家' + boss2) >= 0, 'B6 弹窗挂着当家的名字');
CJ.quitJob();
modals.length = 0;
CJ.open();
var jm2 = modals[modals.length - 1];
assert(jm2.html.indexOf('东家' + CF.face('洛水城', 'shopkeeper').addr) >= 0, 'B7 招工红纸每张都写东家');
// 缺册退回老话
var savedCF = global.CityFaces;
delete global.CityFaces;
reset('洛水城');
eq(CJ.apply('shop_assistant'), true, 'B8 花名册缺席——应募照旧');
assert(logCount('亲自点了头') === 0, 'B9 缺册不点名（退回无名老话）');
CJ.work();
assert(logs[logs.length - 1].indexOf('工钱') >= 0, 'B10 缺册上工账照走');
global.CityFaces = savedCF;

// ==================== C · 摆摊有脸 ====================
console.log('\n[C] 摆摊有脸（摊前过客叫得出称呼）');
reset('洛水城');
withRandom(0.5, function () { SS.open(); });
var buyer0 = CF.passerby('洛水城', 800, 0);
var stonesBefore = global.inventory.currency.spiritStones;
SS.stage('u_mat_herb1');
assert(logs[logs.length - 1].indexOf(buyer0.addr) >= 0, 'C1 成交回执点名过客（' + buyer0.addr + '买走了货）');
eq(global.inventory.currency.spiritStones, stonesBefore + 26, 'C2 价钱分毫不动（灵露草还是二十六灵石——脸不改账）');
eq(SS.session().foot, 2, 'C3 客流分毫不动');
// 熟客：同一张脸再上门（头一回记脸，第二回才认熟）
var realPasserby = CF.passerby;
CF.passerby = function () { return { surname: '王', addr: '王婶子', title: '婶子' }; };
SS.stage('u_mat_herb1');
eq(logCount('又是这位'), 0, 'C4a 头一回上门只是记下这张脸');
SS.stage('u_mat_herb1');
assert(logCount('又是这位') >= 1, 'C4 同一张脸再上门——摊前认熟了（末卖自动收摊，认熟话在成交回执里）');
CF.passerby = realPasserby;
// 缺册退回老话
delete global.CityFaces;
reset('洛水城');
withRandom(0.5, function () { SS.open(); });
SS.stage('u_mat_herb1');
assert(logs[logs.length - 1].indexOf('一位过客') >= 0, 'C5 花名册缺席——退回「一位过客」老话');
global.CityFaces = savedCF;

// ==================== D · 赁屋有脸 ====================
console.log('\n[D] 赁屋有脸（立契的牙人、隔壁的街坊）');
reset('洛水城');
var broker = CF.face('洛水城', 'broker').addr;
var nb = CF.face('洛水城', 'neighbor').addr;
CL.sign('side');
assert(logCount(broker) >= 1 && logCount('立契的') >= 1, 'D1 签约回执点名牙人（' + broker + '立契）');
assert(logCount(nb) >= 1 && logCount('街坊') >= 1, 'D2 隔壁街坊有名有姓（' + nb + '）');
CL.open();
var lm = modals[modals.length - 1];
assert(lm.html.indexOf('立契牙人：' + broker) >= 0 && lm.html.indexOf('隔壁街坊：' + nb) >= 0, 'D3 弹窗挂着两张脸');
CL.quit();
assert(logCount(broker + '收屋收得客客气气') >= 1, 'D4 退租是牙人收的屋');
CL.sign('side');
global.inventory.currency.spiritStones = 10;
ABS_DAY = 830;
CL.onNewDay();
assert(logCount(broker + '上门收了屋') >= 1, 'D5 收屋的是同一位牙人（脸不换）');
// 缺册
delete global.CityFaces;
reset('洛水城');
eq(CL.sign('side'), true, 'D6 花名册缺席——签约照旧');
assert(logCount('牙人') === 0, 'D7 缺册不点名');
global.CityFaces = savedCF;

// ==================== E · 贩货有脸 ====================
console.log('\n[E] 贩货有脸（商行柜上的管事）');
reset('洛水城');
var clerk = CF.face('洛水城', 'merchant_clerk').addr;
var rb = PD.buy(0);
assert(rb.messages.join('').indexOf(clerk) >= 0 && rb.messages.join('').indexOf('压低嗓子') >= 0, 'E1 进货回执是管事点的行情（' + clerk + '压低嗓子）');
global.currentCharData.location = '金城';
var rs = PD.sell(0);
assert(rs.success && rs.messages.join('').indexOf('亲手兑的钱') >= 0, 'E2 出手回执是管事亲手兑的钱');
global.currentCharData.location = '洛水城';
SE.cancel();
var st = SE.start('contract_hall', 'peddler_run');
assert(st.desc.indexOf(clerk + '把今日贩货单摊开') >= 0, 'E3 贩货单是管事摊开的（开场点名）');
assert(st.desc.indexOf(clerk + '又道') >= 0, 'E4 规矩是管事讲的');
// 缺册退回「掌柜」
delete global.CityFaces;
SE.cancel();
var st2 = SE.start('contract_hall', 'peddler_run');
assert(st2.desc.indexOf('掌柜把今日贩货单摊开') >= 0, 'E5 花名册缺席——退回「掌柜」老话');
global.CityFaces = savedCF;

// ==================== F · 哨兵 ====================
console.log('\n[F] 哨兵（脸是纯口吻账）');
var src = fs.readFileSync(path.join(ROOT, 'js/city-facilities/city-faces.js'), 'utf8');
eq((src.match(/Math\.random/g) || []).length, 0, 'F1 花名册零骰（脸按城+角色播种）');
assert(src.indexOf('localStorage') < 0 && src.indexOf('saveWildState') < 0 && src.indexOf('wildState') < 0, 'F2 零直写存档（名字现算不落账）');
assert(src.indexOf('copper') < 0 && src.indexOf('spiritStones') < 0 && src.indexOf('.credit(') < 0 && src.indexOf('RewardService') < 0, 'F3 花名册不碰钱（纯口吻账，经济分毫不动）');
assert(src.indexOf('insightPoints') < 0, 'F4 悟道点零发放');
var leak = null;
(src.match(/'[^']+'/g) || []).forEach(function (s) {
    var v = s.slice(1, -1);
    if (/[+);({\[,?<>]/.test(v)) return;
    if (v.indexOf('\\') >= 0) return;
    if (/typeof|===|!==/.test(v)) return;
    if (v === '_faces_' || v === '_street_') return;   // 播种盐（代码种子，不是话术）
    if (/^[a-z0-9]+(?:[-_: ][a-z0-9]+)*$/.test(v)) return;
    if (/[A-Za-z]/.test(v)) leak = leak || s;
});
eq(leak, null, 'F5 花名册话术零拉丁（漏: ' + leak + '）');
// 四本账零新存档字段
reset('洛水城');
var kb = Object.keys(global.currentCharData).sort().join(',');
withRandom(0.5, function () { SS.open(); SS.stage('u_mat_herb1'); SS.close(); });
CL.sign('side');
CJ.apply('shop_assistant');
PD.buy(0);
var known = ['_employ', '_lodging', '_peddler'];
var ka = Object.keys(global.currentCharData).sort().join(',');
var added = ka.split(',').filter(function (k) { return kb.split(',').indexOf(k) < 0; });
assert(added.every(function (k) { return known.indexOf(k) >= 0; }), 'F6 四本账跑一遍——添的只有三本老契（脸不落任何新字段）');
var htmlSrc = fs.readFileSync(path.join(ROOT, '仙侠.html'), 'utf8');
assert(htmlSrc.indexOf('js/city-facilities/city-faces.js') > htmlSrc.indexOf('js/city-facilities/city-jobs.js'), 'F7 花名册挂载在同批四账之后（一处排齐）');
// 四本账的接线都有守卫（缺册不炸）
['js/city-facilities/city-jobs.js', 'js/city-facilities/street-stall.js', 'js/city-facilities/city-lodging.js', 'js/economy/peddler-service.js', 'js/city-facilities/facility-peddler-contract.js'].forEach(function (f, i) {
    var s = fs.readFileSync(path.join(ROOT, f), 'utf8');
    assert(s.indexOf('CityFaces') < 0 || s.indexOf("typeof window.CityFaces") >= 0 || s.indexOf('window.CityFaces &&') >= 0, 'F8-' + (i + 1) + ' ' + f.split('/').pop() + ' 认脸带守卫（缺册照走老话）');
});

console.log('\n========== 第七十四波 · 市井人物有脸 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
