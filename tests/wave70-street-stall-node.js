/**
 * wave70-street-stall-node.js — 第七十波 · 街边摆摊 验收：
 *   A 开摊账：非商埠不挂摊、占地钱/精力/时辰真花、摊上再开被拦、零新存档字段
 *   B 街面遭遇：一枚骰四段（骤雨/地痞/大客/晴）、声望挡地痞、掏不出钱掉心境、客流账算得死
 *   C 钱货账：钱货同笔交割、货币认货（吃食铜钱灵材灵石）、单价公式（六五折×口舌×声望×耐久×城价）、
 *             任务信物/秘籍/钱票不上摊、客流尽自动收摊、卖出真动行情
 *   D 商道账：卖满三件长商道、不满不长、满百不溢、走统一结算通道
 *   E 面板接线：城市面板钩子在册有守卫、商埠挂摊口、仙山静默、异地面板不串
 *   F 哨兵：全文恰一枚骰、零存档零悟道点零发票子、话术零拉丁、挂载序在册
 *
 * 运行：node tests/wave70-street-stall-node.js
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
var msgs = [], logs = [], timeCalls = [], modals = [], trades = [];
global.showMessage = function (m, t) { msgs.push({ m: String(m), t: t }); };
global.showModal = function (t, html) { modals.push({ t: String(t), html: String(html) }); };
global.gameLog = { add: function (m) { logs.push(String(m)); } };
var ABS_DAY = 800;
global.timeSystem = {
    gameTime: { totalMinutes: 600 },
    advanceTime: function (m, r) { timeCalls.push({ m: m, r: String(r || '') }); },
    getAbsoluteDay: function () { return ABS_DAY; },
    onNewDaySubscribe: function () {}
};
global.EventBus = { emit: function () {}, on: function () {} };
var REP_VAL = 0;
global.getReputationValue = function () { return REP_VAL; };
var CITY_SELL_MOD = 1;
var CITY_DB = {
    '洛水城': { name: '洛水城', buildings: ['shop', 'inn', 'tea_house'] },
    '炎城': { name: '炎城', buildings: ['market', 'inn'] },
    '太虚山': { name: '太虚山', buildings: ['cultivation', 'temple'] }
};
global.locationSystem = {
    getCityData: function (c) { return CITY_DB[c] || null; },
    getCityPriceModifier: function () { return CITY_SELL_MOD; }
};
global.MarketDynamic = { notePlayerTrade: function (id, q, isBuy) { trades.push({ id: id, q: q, isBuy: isBuy }); } };
global.updateCurrencyUI = function () {};
global.updateCharacterStatus = function () {};
global.updateInventoryUI = function () {};
global.getCurrentCityName = function () { return global.currentCharData.location; };

global.itemById = {
    mat_herb1: { id: 'mat_herb1', name: '灵露草', icon: '🌿', price: 40, category: 'material', subtype: 'herb' },
    food_bun: { id: 'food_bun', name: '胡麻饼', icon: '🍞', price: 10, category: 'food', subtype: 'food' },
    wpn_old: { id: 'wpn_old', name: '旧铁剑', icon: '🗡️', price: 100, category: 'weapon', type: 'weapon' },
    quest_token: { id: 'quest_token', name: '门主信物', icon: '🎫', price: 999, category: 'quest' },
    book_manual: { id: 'book_manual', name: '残卷秘籍', icon: '📕', price: 500, category: 'secret_art', subtype: 'manual' },
    coin_note: { id: 'coin_note', name: '钱票', icon: '💴', price: 100, category: 'currency' },
    mat_junk: { id: 'mat_junk', name: '烂布头', icon: '🧻', price: 0, category: 'material' }
};

function makeSlot(id, count, dur) {
    return {
        uid: 'u_' + id, templateId: id, count: count,
        durability: dur == null ? undefined : dur,
        getTemplate: function () { return global.itemById[id] || null; }
    };
}

global.currentCharData = {
    mood: 80, energy: 100, maxEnergy: 100, karma: 0, copper: 500,
    lifeSkills: { '口才': 0 }, location: '洛水城'
};
global.inventory = { currency: { spiritStones: 1000, copper: 500 }, slots: [] };

function load(rel) {
    vm.runInThisContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), { filename: rel });
}
load('js/economy/economy-transaction.js');
load('js/core/reward-service.js');
load('js/city-facilities/street-stall.js');

var SS = global.StreetStall;

function msgCount(w) { return msgs.filter(function (m) { return m.m.indexOf(w) >= 0; }).length; }
function logCount(w) { return logs.filter(function (m) { return m.indexOf(w) >= 0; }).length; }
function lastLog() { return logs.length ? logs[logs.length - 1] : ''; }
var origRandom = Math.random;
function withRandom(v, fn) {
    Math.random = function () { return v; };
    try { return fn(); } finally { Math.random = origRandom; }
}
function reset(city, slots, opts) {
    opts = opts || {};
    if (SS.session()) SS.close();
    var c = global.currentCharData;
    c.mood = 80; c.energy = opts.energy == null ? 100 : opts.energy;
    c.copper = opts.copper == null ? 500 : opts.copper;
    c.lifeSkills = { '口才': opts.speech == null ? 0 : opts.speech };
    delete c.lifeSkills['商道'];
    if (opts.shangdao != null) c.lifeSkills['商道'] = opts.shangdao;
    c.location = city || '洛水城';
    REP_VAL = opts.rep || 0;
    CITY_SELL_MOD = opts.sellMod || 1;
    global.inventory = {
        currency: { spiritStones: opts.stones == null ? 1000 : opts.stones, copper: opts.copper == null ? 500 : opts.copper },
        slots: slots || [makeSlot('mat_herb1', 2), makeSlot('food_bun', 3), makeSlot('wpn_old', 1)]
    };
    msgs.length = 0; logs.length = 0; timeCalls.length = 0; modals.length = 0; trades.length = 0;
}
function slotById(id) {
    var s = global.inventory.slots;
    for (var i = 0; i < s.length; i++) { if (s[i] && s[i].templateId === id) return s[i]; }
    return null;
}
function openWith(v) { return withRandom(v == null ? 0.5 : v, function () { return SS.open(); }); }

// ==================== A · 开摊账 ====================
console.log('\n[A] 开摊账（支摊真花代价）');
reset('太虚山');
eq(SS.open(), false, 'A1 仙山支不得摊（没有红尘买卖）');
assert(msgCount('仙山佛窟') >= 1, 'A2 回绝话术说得明白');
eq(SS.session(), null, 'A3 没开成就没有摊');
reset('洛水城');
eq(openWith(0.5), true, 'A4 商埠城开摊成功');
assert(!!SS.session(), 'A5 摊子在场');
eq(global.inventory.currency.copper, 498, 'A6 占地钱两枚铜真扣（钱袋子）');
eq(global.currentCharData.copper, 498, 'A7 占地钱两本账一致（角色账同步）');
eq(global.currentCharData.energy, 90, 'A8 支摊耗精力十');
eq(timeCalls[timeCalls.length - 1].m, 120, 'A9 一场摊守两个时辰');
eq(SS.open(), false, 'A10 摊还支着再开被拦（先收这场）');
assert(msgCount('还支着') >= 1, 'A11 拦得有话');
// 精力不足（检查在占地钱之前——钱不该扣）
reset('洛水城', null, { energy: 5 });
eq(SS.open(), false, 'A12 精力不够支不起摊');
eq(global.inventory.currency.copper, 500, 'A13 没开成钱分毫不动');
// 没货
reset('洛水城', []);
eq(SS.open(), false, 'A14 空行囊支摊被拦');
assert(msgCount('能上摊的货') >= 1, 'A15 拦得实话实说');
// 付不起占地钱
reset('洛水城', null, { copper: 1 });
eq(SS.open(), false, 'A16 占地钱都凑不出——开不成摊');
eq(global.currentCharData.energy, 100, 'A17 没开成精力分毫不动');
// 零新存档字段
reset('洛水城');
var keysBefore = Object.keys(global.currentCharData).join(',');
openWith(0.5);
eq(Object.keys(global.currentCharData).join(','), keysBefore, 'A18 支摊不给角色账添一个字段（摊是当场的事）');
// market 键也算商埠
reset('炎城');
eq(SS.marketCityOk('炎城'), true, 'A19 有市集的城也算商埠');
eq(SS.marketCityOk('太虚山'), false, 'A20 仙山不算');

// ==================== B · 街面遭遇（一枚骰四段） ====================
console.log('\n[B] 街面遭遇（摊前的事谁也说不准）');
reset('洛水城');
openWith(0.05);
eq(SS.session().event, 'rain', 'B1 骰出骤雨');
eq(SS.session().foot, 1, 'B2 雨浇掉一半客流（三客剩一客，向下取整）');
assert(logCount('骤雨') >= 1, 'B3 雨天如实报');
reset('洛水城', null, { rep: 0, copper: 500 });
openWith(0.15);
eq(SS.session().event, 'thug_paid', 'B4 低声望遇地痞——破财免灾');
eq(global.inventory.currency.copper, 498 - 15, 'B5 地痞「借」走十五铜（占地钱照扣，两笔分明）');
reset('洛水城', null, { rep: 50 });
openWith(0.15);
eq(SS.session().event, 'thug_off', 'B6 声望过了四十——地痞赔笑走开');
eq(global.inventory.currency.copper, 498, 'B7 没被借走一个子儿');
eq(SS.session().foot, 5, 'B8 看热闹的反倒多了一位真买主（声望五十本就招一位，地痞那场再添一位）');
reset('洛水城', null, { rep: 0, copper: 10 });
openWith(0.15);
eq(SS.session().event, 'thug_broke', 'B9 掏不出钱——被掀了摊架');
eq(global.currentCharData.mood, 75, 'B10 人丢大了，心境下挫五');
eq(global.inventory.currency.copper, 10 - 2, 'B11 钱没被借走（本就借不出），只扣了占地钱');
reset('洛水城');
openWith(0.30);
eq(SS.session().event, 'vip', 'B12 大客临门');
eq(SS.session().foot, 5, 'B13 大客带来两位（三加二）');
reset('洛水城');
openWith(0.5);
eq(SS.session().event, 'clear', 'B14 天公作美平常开摊');
eq(SS.session().foot, 3, 'B15 基础客流三位');
// 客流账：口才声望招客、封顶
reset('洛水城', null, { speech: 80 });
eq(SS.footfall(), 6, 'B16 口才八十招来三位（三加一加二，封顶六）');
reset('洛水城', null, { speech: 80, rep: 100 });
eq(SS.footfall(), 6, 'B17 声望再高也挤不下（客流封顶六是死的）');
reset('洛水城', null, { speech: 80 });
openWith(0.05);
eq(SS.session().foot, 3, 'B18 雨天客流减半（六剩三）');
reset('洛水城', null, { speech: 80, rep: 100 });
openWith(0.30);
eq(SS.session().foot, 8, 'B19 大客临门封顶放到八（六加二）');
// 客流计算零骰、全文一枚骰
reset('洛水城');
var rolled = 0;
Math.random = function () { rolled++; return 0.5; };
SS.footfall(); SS.footfall(); SS.unitPrice(global.inventory.slots[0]);
Math.random = origRandom;
eq(rolled, 0, 'B20 算客流算价钱不掷骰（骰只在开摊那一刻掷一回）');

// ==================== C · 钱货账 ====================
console.log('\n[C] 钱货账（钱货同笔，概不赊欠）');
reset('洛水城');
openWith(0.5);
var stonesBefore = global.inventory.currency.spiritStones;
eq(SS.stage('u_mat_herb1'), true, 'C1 灵露草上摊卖出一件');
eq(global.inventory.currency.spiritStones, stonesBefore + 26, 'C2 灵材换灵石：四十底价×六五折=二十六，真入账');
eq(slotById('mat_herb1').count, 1, 'C3 货真离囊（二剩一）');
eq(SS.session().foot, 2, 'C4 一位过客买走了（客流三剩二）');
eq(SS.session().sold, 1, 'C5 摊上卖出一件记一件');
assert(logCount('灵露草') >= 1 && logCount('二十六') === 0 && lastLog().indexOf('26 灵石') >= 0, 'C6 成交回执报货名报价钱');
eq(trades.length, 1, 'C7 卖出真动行情（供需模型吃到真单）');
eq(trades[0].isBuy, false, 'C8 行情记的是「卖」');
// 吃食换铜钱
var copperBefore = global.inventory.currency.copper;
SS.stage('u_food_bun');
eq(global.inventory.currency.copper, copperBefore + 6, 'C9 吃食换铜钱：十底价×六五折取整=六铜（货币认货）');
eq(global.currentCharData.copper, global.inventory.currency.copper, 'C10 铜钱两本账一致');
// 口舌与城价
reset('洛水城', [makeSlot('mat_herb1', 5)], { speech: 100 });
openWith(0.5);
eq(SS.unitPrice(slotById('mat_herb1')), 31, 'C11 口才满百加价两成（四十×零点六五×一点二，向下取整）');
reset('洛水城', [makeSlot('mat_herb1', 5)], { sellMod: 1.5 });
openWith(0.5);
eq(SS.unitPrice(slotById('mat_herb1')), 39, 'C12 本城物价系数进价（四十×零点六五×一点五）');
// 耐久折价
reset('洛水城', [makeSlot('wpn_old', 1, 50)]);
openWith(0.5);
eq(SS.unitPrice(slotById('wpn_old')), 52, 'C13 旧剑带伤打八折（一百×零点六五×零点八）');
// 大客加价一成
reset('洛水城', [makeSlot('mat_herb1', 5)]);
openWith(0.30);
eq(SS.unitPrice(slotById('mat_herb1')), 28, 'C14 大客临门出价爽利一成（二十六变二十八）');
// 底价保一
reset('洛水城', [makeSlot('mat_junk', 1)]);
eq(SS.open(), false, 'C15 没价钱的破烂上不了摊（空摊拦在前头）');
// 任务信物/秘籍/钱票不上摊
reset('洛水城', [makeSlot('quest_token', 1), makeSlot('book_manual', 1), makeSlot('coin_note', 1), makeSlot('mat_herb1', 1)]);
var names = SS.sellables().map(function (s) { return s.templateId; });
eq(names.join(','), 'mat_herb1', 'C16 摊上只收能卖的货（信物/秘籍/钱票一概不上摊）');
openWith(0.5);
eq(SS.stage('u_quest_token'), false, 'C17 硬把信物往摊上塞——不成');
// 客流尽自动收摊
reset('洛水城', [makeSlot('mat_herb1', 9)]);
openWith(0.5);
SS.stage('u_mat_herb1'); SS.stage('u_mat_herb1');
eq(SS.session().foot, 1, 'C18 卖到只剩一位客');
eq(SS.stage('u_mat_herb1'), true, 'C19 最后一件成交');
eq(SS.session(), null, 'C20 客流尽了摊自动收（不赖着）');
reset('洛水城');
eq(SS.stage('u_mat_herb1'), false, 'C21 摊收了再点卖——如实回绝');
// 提前收摊
reset('洛水城', [makeSlot('mat_herb1', 5)]);
openWith(0.5);
SS.close();
eq(SS.session(), null, 'C22 提前收摊摊子就没了（时辰不退回——摆摊的都知道）');
eq(timeCalls.length, 1, 'C23 时辰只在支摊时走一笔');

// ==================== D · 商道账 ====================
console.log('\n[D] 商道账（卖出门道长见识）');
reset('洛水城', [makeSlot('mat_herb1', 9)]);
openWith(0.5);
SS.stage('u_mat_herb1'); SS.stage('u_mat_herb1');
eq(global.currentCharData.lifeSkills['商道'], undefined, 'D1 卖两件还不算入门（差一件）');
SS.stage('u_mat_herb1');
eq(global.currentCharData.lifeSkills['商道'], 1, 'D2 卖满三件自动收摊——商道长一分');
reset('洛水城', [makeSlot('mat_herb1', 9)]);
openWith(0.5);
SS.stage('u_mat_herb1'); SS.stage('u_mat_herb1'); SS.close();
eq(global.currentCharData.lifeSkills['商道'], undefined, 'D3 两件收摊不长（账算得死）');
reset('洛水城', [makeSlot('mat_herb1', 9)], { shangdao: 100 });
openWith(0.5);
SS.stage('u_mat_herb1'); SS.stage('u_mat_herb1'); SS.stage('u_mat_herb1');
eq(global.currentCharData.lifeSkills['商道'], 100, 'D4 商道满百不溢');
// 长进走统一结算通道
reset('洛水城', [makeSlot('mat_herb1', 9)]);
var specs = [];
var realApply = global.RewardService.apply;
global.RewardService.apply = function (spec, ctx) { specs.push(spec); return realApply.call(global.RewardService, spec, ctx); };
openWith(0.5);
SS.stage('u_mat_herb1'); SS.stage('u_mat_herb1'); SS.stage('u_mat_herb1');
global.RewardService.apply = realApply;
assert(specs.some(function (s) { return s.lifeSkill && s.lifeSkill.name === '商道'; }), 'D5 商道长进走统一结算（不偷写角色账）');
assert(specs.some(function (s) { return s.take && s.take[0] && s.take[0].count === 1; }), 'D6 货离囊也走统一结算（钱货同笔）');

// ==================== E · 面板接线 ====================
console.log('\n[E] 面板接线（摊口挂在商埠面板上）');
reset('洛水城');
var ph = SS.panelHtml('洛水城');
assert(ph.indexOf('街边支个摊') >= 0 && ph.indexOf('StreetStall.open()') >= 0, 'E1 商埠面板挂摊口');
assert(ph.indexOf('比铺子回购公道') >= 0, 'E2 摊口把贵贱讲在明处');
eq(SS.panelHtml('太虚山'), '', 'E3 仙山面板一个字不占');
eq(SS.panelHtml('炎城'), '', 'E4 人在洛水，炎城的摊口不串场');
var locSrc = fs.readFileSync(path.join(ROOT, 'js/location-system.js'), 'utf8');
assert(locSrc.indexOf('window.StreetStall.panelHtml(cityName)') >= 0 && locSrc.indexOf('catch (eStall)') >= 0, 'E5 面板钩子在案且有守卫');
reset('洛水城');
openWith(0.5);
var modal = modals[modals.length - 1];
assert(modal && modal.html.indexOf("stage('u_mat_herb1')") >= 0, 'E6 摊面模态挂着货和卖按钮');
assert(modal.html.indexOf('灵露草') >= 0 && modal.html.indexOf('26 灵石') >= 0, 'E7 摊面报货名报价钱');
assert(modal.html.indexOf('胡麻饼') >= 0 && modal.html.indexOf('铜钱') >= 0, 'E8 吃食标的是铜钱');
eq(typeof global.openStreetStall, 'function', 'E9 全局入口在册');

// ==================== F · 哨兵 ====================
console.log('\n[F] 哨兵（新账干净）');
var src = fs.readFileSync(path.join(ROOT, 'js/city-facilities/street-stall.js'), 'utf8');
eq((src.match(/Math\.random/g) || []).length, 1, 'F1 全文恰一枚骰（只在开摊掷一回——街面遭遇）');
assert(src.indexOf('localStorage') < 0 && src.indexOf('saveWildState') < 0 && src.indexOf('wildState') < 0, 'F2 零直写存档（摊是当场的事）');
assert(src.indexOf('insightPoints') < 0 && src.indexOf('markOnce') < 0, 'F3 悟道点零发放（总闸已满）');
assert(src.indexOf('addSpiritStones') < 0 && src.indexOf('.credit(') < 0, 'F4 零直接发票子（钱货同笔走统一结算）');
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
eq(leak, null, 'F5 摊上话术零拉丁（漏: ' + leak + '）');
var htmlSrc = fs.readFileSync(path.join(ROOT, '仙侠.html'), 'utf8');
assert(htmlSrc.indexOf('js/city-facilities/street-stall.js') > htmlSrc.indexOf('js/city-facilities/festival-fair.js'), 'F6 页面挂载在庙会之后（同批新账排一处）');
eq(SS.CFG.RATE, 0.65, 'F7 摊价六五折钉死');
eq(SS.CFG.FOOT_CAP, 6, 'F8 客流封顶钉死（摊价公道但不放量——防通胀的闸）');
assert(SS.CFG.RATE > 0.35, 'F9 摊价高过铺子回购上限（这就是摆摊的理由）');
assert(src.indexOf('var session = null') >= 0, 'F10 摊面账是模块内当场账（不落任何存档）');

console.log('\n========== 第七十波 · 街边摆摊 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
