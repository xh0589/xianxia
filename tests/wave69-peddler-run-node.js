/**
 * wave69-peddler-run-node.js — 第六十九波 · 跑单帮贩货 验收：
 *   A 货单账：城折大区（长安空格账根治）、贩货单按城+日定死（零骰）、价=基价×行情、行情话术、指路真区
 *   B 进货账：灵石原子扣、钱不够整笔不成交、三担封顶、货账字段齐、买卖真动供需
 *   C 出手账：同城来回必亏（防对倒）、跨区价差真赚、赚单商道+1、亏单不给、卖价认实时行情
 *   D 账本归一：_peddler 单字段、坏账当无货、归一化只认不补写、老档无字段当场开账
 *   E 剧本接线：贩货契在册不撞号、灵雨赌老戏未殃及、引擎钩子真扣真入、失败不推进、时间真走
 *   F 哨兵：新文件零骰零存档零悟道点零发票子、话术零拉丁、挂载序在册、行情老导出一个不缺
 *
 * 运行：node tests/wave69-peddler-run-node.js
 */
'use strict';

var path = require('path');
var fs = require('fs');
var vm = require('vm');

var ROOT = path.resolve(__dirname, '..');
function loadScript(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

var passed = 0, failed = 0;
function ok(cond, label) {
    if (cond) { passed++; console.log('  ✓ ' + label); }
    else { failed++; console.error('  ✗ ' + label); }
}
function eq(a, b, label) { ok(a === b, label + '（实际=' + JSON.stringify(a) + ' 期望=' + JSON.stringify(b) + '）'); }

// ==================== 世界桩（六十六波同式） ====================
var W = {
    console: { log: function () {}, warn: function () {}, error: function () {} },
    setTimeout: function (fn) { try { fn(); } catch (e) {} return 0; },
    localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
    document: {
        createElement: function () { return { style: {}, classList: { add: function () {}, remove: function () {}, contains: function () { return false; } }, dataset: {}, innerHTML: '' }; },
        getElementById: function () { return null; },
        querySelector: function () { return null; },
        addEventListener: function () {},
        body: { appendChild: function () {} }
    },
    alert: function () {}
};
W.window = W;

var state = { logs: [], minutes: 0, city: '洛水城', day: 800, handlers: {} };
W.timeSystem = {
    gameTime: { totalMinutes: state.day * 1440 + 600, currentDay: 7 },
    advanceTime: function (m) { state.minutes += m; this.gameTime.totalMinutes += m; },
    getAbsoluteDay: function () { return state.day; }
};
W.advanceTime = function (m) { state.minutes += m; };
W.gameLog = { add: function (t) { state.logs.push(String(t)); } };
W.showMessage = function () {};
W.getRealmTier = function () { return 3; };
W.getCurrentCityName = function () { return state.city; };
W.locationSystem = { getCurrentLocation: function () { return state.city; } };

var cd = {
    name: '测试货郎', realm: '金丹', layer: 1, location: '洛水城',
    health: 100, maxHealth: 100, qi: 100, maxQi: 200, energy: 100, maxEnergy: 100,
    mood: 80, tempering: 0, karma: 0, notoriety: 0, fame: 0,
    lifeSkills: { '学识': 20 }
};
W.currentCharData = cd;
W.inventory = { currency: { spiritStones: 1000, copper: 500 }, slots: [] };
W.currentEquipment = {};
W.itemById = {};
W.EventBus = { emit: function () {}, on: function () {} };
W.StateRegistry = { register: function (id, h) { state.handlers[id] = h; } };
W.updateCurrencyUI = function () {};
W.updateCharacterStatus = function () {};

vm.createContext(W);
function load(rel) { vm.runInContext(loadScript(rel), W, { filename: rel }); }
load('js/regions.js');
load('js/economy/economy-transaction.js');
load('js/core/reward-service.js');
load('js/extensions/market-dynamic.js');
load('js/economy/peddler-service.js');
load('js/core/scenario-engine.js');
load('js/city-facilities/facility-batch2.js');
load('js/city-facilities/facility-batch3.js');
load('js/city-facilities/facility-arena-book.js');
load('js/city-facilities/facility-peddler-contract.js');

var PD = W.PeddlerService;
var MD = W.MarketDynamic;
var SE = W.scenarioEngine;

function fresh(city, day) {
    SE.cancel();
    if (state.handlers.marketConfig && state.handlers.marketConfig.reset) state.handlers.marketConfig.reset();
    cd.mood = 80; cd.energy = 100; cd.qi = 100;
    cd.lifeSkills = { '学识': 20 };
    delete cd._peddler;
    W.inventory.currency = { spiritStones: 1000, copper: 500 };
    state.minutes = 0; state.logs.length = 0;
    state.city = city || '洛水城'; state.day = day || 800;
    cd.location = state.city;
}
function stones() { return W.inventory.currency.spiritStones; }
function lots() { return (cd._peddler && cd._peddler.lots) || null; }
// 在指定城找一天，让贩货单上出现指定行当的货
function findDayWithCat(city, cat, from, to) {
    for (var d = from; d <= to; d++) {
        state.city = city; cd.location = city; state.day = d;
        var ls = PD.todayLots(city);
        for (var i = 0; i < ls.length; i++) { if (ls[i].cat === cat) return { day: d, idx: i, lot: ls[i] }; }
    }
    return null;
}

// ==================== A · 货单账 ====================
console.log('\n[A] 货单账（单子是柜上定死的）');
fresh();
eq(MD.regionFor('帝都·长安'), '中州', 'A1 长安折得进大区（户口册空格账根治——v23.2 起首善之区不再空转）');
eq(MD.regionFor('洛水城'), '中州', 'A2 洛水折中州');
eq(MD.regionFor('炎城'), '南疆', 'A3 炎城折南疆');
eq(MD.regionFor('金城'), '西荒', 'A4 金城折西荒');
eq(MD.regionFor('野外'), null, 'A5 折不进的地方如实报无（不硬认）');
fresh('洛水城', 800);
var l1 = PD.todayLots(), l2 = PD.todayLots();
eq(JSON.stringify(l1.map(function (x) { return x.cargoId + x.price; })),
   JSON.stringify(l2.map(function (x) { return x.cargoId + x.price; })), 'A6 同日同城两回看单，一字不差（掌柜不换单说谎）');
eq(l1.length, 3, 'A7 贩货单一日三担');
eq(new Set(l1.map(function (x) { return x.cargoId; })).size, 3, 'A8 三担不重样');
var zeroDice = (function () {
    var rolled = 0, orig = Math.random;
    Math.random = function () { rolled++; return 0.5; };
    for (var d = 800; d < 810; d++) { state.day = d; PD.todayLots('洛水城'); }
    Math.random = orig;
    return rolled === 0;
})();
ok(zeroDice, 'A9 建单零骰（单子按城+日播种，不是摇出来的）');
state.day = 800;
var daySets = {};
for (var d = 800; d < 812; d++) { state.day = d; daySets[PD.todayLots('洛水城').map(function (x) { return x.cargoId; }).join(',')] = 1; }
ok(Object.keys(daySets).length >= 2, 'A10 换日换单（十二天里不止一张贩货单）');
fresh('洛水城', 800);
// 中州地面价钉死：基价×地域偏向（药材40/矿材55/食物30/符箓45×0.95→43/丹药70/法器90×0.9→81）
var PRICES_ZHONGZHOU = { cd_herb: 40, cd_ore: 55, cd_grain: 30, cd_paper: 43, cd_pill: 70, cd_blade: 81 };
var priceOk = PD.todayLots().every(function (x) { return x.price === PRICES_ZHONGZHOU[x.cargoId]; });
ok(priceOk, 'A11 进价=基价×本地行情（中州地面价一枚一枚对得上）');
ok(PD.mulFor('药材', '炎城') < PD.mulFor('药材', '洛水城'), 'A12 南疆药材贱于中州（行情真源的地域偏向在说话）');
var notesOk = PD.todayLots().every(function (x) {
    return ['本地价贱', '本地价高', '行情平平'].indexOf(x.note) >= 0;
});
ok(notesOk, 'A13 行情话术三档在册（贱/贵/平）');
var best = PD.bestRegionFor('药材');
ok(best && MD.CITIES.indexOf(best.region) >= 0 && best.mul >= PD.mulFor('药材', '洛水城'), 'A14 指路的「最俏地界」是真大区且价不低于本地');

// ==================== B · 进货账 ====================
console.log('\n[B] 进货账（钱货两讫，概不赊账）');
fresh('洛水城', 800);
var t0 = PD.todayLots(), p0 = t0[0].price;
var rb = PD.buy(0);
ok(rb.success === true, 'B1 进货成交');
eq(stones(), 1000 - p0, 'B2 灵石真扣（扣的就是单上行价）');
eq(lots().length, 1, 'B3 货上肩（货账入册）');
var lot0 = lots()[0];
ok(lot0.cargoId === t0[0].cargoId && lot0.base === t0[0].base && lot0.buyPrice === p0 &&
   lot0.buyCity === '洛水城' && lot0.buyDay === 800 && lot0.buyRegion === '中州',
   'B4 货账字段齐（货名/基价/进价/进城/进日/大区一样不缺）');
ok(rb.messages.join('').indexOf(t0[0].name) >= 0, 'B5 成交回执报货名');
PD.buy(1); PD.buy(2);
eq(lots().length, 3, 'B6 三担上肩');
var before = stones();
var rFull = PD.buy(0);
ok(rFull.success === false && rFull.error.indexOf('三担') >= 0, 'B7 三担齐了再进货被拦（跑单帮靠脚力吃饭）');
eq(stones(), before, 'B8 被拦分文不动');
fresh('洛水城', 800);
W.inventory.currency.spiritStones = 1;
var rPoor = PD.buy(0);
ok(rPoor.success === false && rPoor.error.indexOf('赊账') >= 0, 'B9 钱不够如实回绝（商行概不赊账）');
eq(stones(), 1, 'B10 没成交钱分毫不动');
eq(cd._peddler, undefined, 'B11 没成交货账不落一笔');
fresh('洛水城', 800);
var tB12 = PD.todayLots(), catB12 = tB12[0].cat;
var supBefore = MD.getIndex('中州', catB12).supply;
var mulBefore = PD.mulFor(catB12, '洛水城');
PD.buy(0);
ok(MD.getIndex('中州', catB12).supply < supBefore, 'B12 进货真动供需（扫货supply降——v23.2 行情接线吃到真单了）');
ok(PD.mulFor(catB12, '洛水城') > mulBefore, 'B13 扫货抬价（第二担比第一担贵——市场不是死水）');
fresh('洛水城', 800);
var rIdx = PD.buy(5);
ok(rIdx.success === false && rIdx.error.indexOf('贩货单') >= 0, 'B14 单外索引如实回绝（单子定死不能凭空添）');
fresh('洛水城', 800);
state.city = ''; cd.location = '';   // 人离了城（fresh 对空城名有默认，这里明着置空）
var rNoCity = PD.buy(0);
ok(rNoCity.success === false && rNoCity.error.indexOf('不在城') >= 0, 'B15 人不在城里柜台不接单');

// ==================== C · 出手账 ====================
console.log('\n[C] 出手账（价差是脚力的钱）');
fresh('洛水城', 800);
var rEmpty = PD.sell(0);
ok(rEmpty.success === false && rEmpty.error.indexOf('没货') >= 0, 'C1 空肩膀来柜前如实回绝');
fresh('洛水城', 800);
var tC = PD.todayLots(), buyP = tC[0].price;
PD.buy(0);
var holdBefore = PD.holdings();
var sellP = holdBefore[0].sellPrice;
ok(sellP < buyP, 'C2 同城买卖必亏（九二折明折——对倒刷钱的路堵死）');
var rs = PD.sell(0);
ok(rs.success === true, 'C3 出手成交');
eq(stones(), 1000 - buyP + sellP, 'C4 灵石真入（入的就是柜上报价）');
eq(rs.profit, sellP - buyP, 'C5 赚赔账算得明白（出手价-进货价）');
ok(rs.profit < 0, 'C6 同城来回如实报亏（不谎称赚了）');
eq(cd._peddler, null, 'C7 货出完账本收干净（不留空壳）');
eq(cd.lifeSkills['商道'], undefined, 'C8 亏本的买卖不长商道');
// 跨区真赚：金城进矿（西荒矿材贱），洛水出手（中州平价）
var hit = findDayWithCat('金城', '矿材', 800, 840);
ok(!!hit, 'C9 金城贩货单上找得到玄铁锭（四十天里总有一日）');
fresh('金城', hit.day);
var buyJin = PD.todayLots()[hit.idx].price;
PD.buy(hit.idx);
state.city = '洛水城'; cd.location = '洛水城';
var holdLuo = PD.holdings();
ok(holdLuo[0].sellPrice > buyJin, 'C10 西荒进的矿在中州卖得上价（地域价差是真的）');
var rs2 = PD.sell(0);
ok(rs2.success === true && rs2.profit > 0, 'C11 跨区贩货净赚（价差落袋）');
ok(rs2.messages.join('').indexOf('净赚') >= 0, 'C12 赚单回执报喜');
eq(cd.lifeSkills['商道'], 1, 'C13 赚了的买卖长一分商道（名录外行当也能长熟——驭兽同例）');
// 卖价认实时行情
fresh('洛水城', 800);
var hitPill = findDayWithCat('洛水城', '丹药', 800, 840);
ok(!!hitPill, 'C14 洛水贩货单上找得到丹料');
fresh('洛水城', hitPill.day);
PD.buy(hitPill.idx);
var spBefore = PD.holdings()[0].sellPrice;
MD.applyWorldEvent('spirit_tide', { cities: ['中州'] });
ok(PD.holdings()[0].sellPrice > spBefore, 'C15 灵气潮起丹料俏——出手价当场跟着涨（卖价认实时行情不认死数）');
// 出手动供需
fresh('洛水城', 800);
var tC16 = PD.todayLots(), cat16 = tC16[0].cat;
PD.buy(0);
var demBefore = MD.getIndex('中州', cat16).demand;
PD.sell(0);
ok(MD.getIndex('中州', cat16).demand < demBefore, 'C16 抛货压价（demand降——买卖两头都真动行情）');
// 多担只清一担
fresh('洛水城', 800);
PD.buy(0); PD.buy(1);
var id1 = lots()[1].cargoId;
PD.sell(0);
eq(lots().length, 1, 'C17 出手只清肩上那一担');
eq(lots()[0].cargoId, id1, 'C18 剩下的还是原来第二担（不错杀）');
var rOver = PD.sell(2);
ok(rOver.success === false && rOver.error.indexOf('这一件') >= 0, 'C19 越界索引如实回绝');
// 商道封顶
fresh('洛水城', 800);
cd.lifeSkills['商道'] = 100;
var hitOre = findDayWithCat('金城', '矿材', 800, 840);
fresh('金城', hitOre.day);
cd.lifeSkills['商道'] = 100;
PD.buy(hitOre.idx);
state.city = '洛水城'; cd.location = '洛水城';
PD.sell(0);
eq(cd.lifeSkills['商道'], 100, 'C20 商道满百不溢（长进封顶）');

// ==================== D · 账本归一 ====================
console.log('\n[D] 账本归一（坏账一律当无货）');
fresh('洛水城', 800);
eq(PD.ledger().length, 0, 'D1 老档无字段——货账当场是空的（迁移零成本）');
cd._peddler = { lots: '不是数组' };
eq(PD.ledger().length, 0, 'D2 货账坏成字符串——当无货');
cd._peddler = null;
eq(PD.ledger().length, 0, 'D3 货账是 null——当无货');
cd._peddler = { lots: [
    { cargoId: 'cd_herb', cat: '药材', base: 40, buyPrice: 38, buyCity: '炎城', buyDay: 700 },
    { cargoId: 'cd_ore', base: NaN, buyPrice: 10 },
    { base: 40, buyPrice: 10 },
    null
] };
eq(PD.ledger().length, 1, 'D4 好坏混账只认好货（坏条目当场滤掉）');
eq(PD.ledger()[0].cargoId, 'cd_herb', 'D5 认下的是字段齐的那担');
ok(cd._peddler.lots.length === 4, 'D6 归一化只认不补写（读账不改账——押镖同款纪律）');
var h = PD.holdings();
ok(h.length === 1 && h[0].name === '青露草' && h[0].buyCity === '炎城', 'D7 持仓报价单认好货（名字/进城都对得上）');
delete cd._peddler;
var rD8 = PD.buy(0);
ok(rD8.success === true && lots().length === 1, 'D8 无字段的老档进货当场开账（不需要任何迁移仪式）');

// ==================== E · 剧本接线 ====================
console.log('\n[E] 剧本接线（契约所第三出戏）');
fresh('洛水城', 800);
var FAC = SE.facilities['contract_hall'];
ok(!!FAC, 'E1 契约所在册');
var ids = FAC.scenarios.map(function (s) { return s.id; });
ok(ids.indexOf('peddler_run') >= 0, 'E2 贩货契挂上契约所柜台');
eq(ids.length, new Set(ids).size, 'E3 戏号无重复');
ok(ids.indexOf('contract_bet') >= 0 && ids.indexOf('peddler_run') > ids.indexOf('contract_bet'), 'E4 灵雨赌老戏在前未殃及（贩货契排在后面）');
ok(!!SE.facilities['arena_stage'] && !!SE.facilities['escort_office'], 'E5 同批增补的别家设施无恙');
var PR = FAC.scenarios.filter(function (s) { return s.id === 'peddler_run'; })[0];
eq(typeof PR.nodes.pr_start.desc, 'function', 'E6 柜台话术是现算的（单子与持仓跟着行情走）');
var st = SE.start('contract_hall', 'peddler_run');
ok(st.desc.indexOf('贩货单') >= 0 && st.desc.indexOf('肩上') >= 0, 'E7 开戏话术把单子摊开');
var namesOnBoard = PD.todayLots().every(function (x) { return st.desc.indexOf(x.name) >= 0; });
ok(namesOnBoard, 'E8 当日三担货名都上了柜面话术');
eq(st.choices.length, 7, 'E9 柜前七个选项（三进三出一走人）');
// 真买
fresh('洛水城', 800);
SE.start('contract_hall', 'peddler_run');
var tE = PD.todayLots(), pE = tE[0].price;
var resBuy = SE.choose(0);
ok(!resBuy.error, 'E10 柜上进货成交（引擎钩子通路）');
eq(stones(), 1000 - pE, 'E11 经引擎买——灵石照样真扣');
eq(lots().length, 1, 'E12 经引擎买——货照样上肩');
eq(state.minutes, 20, 'E13 每笔交割花二十分钟（时间在剧本层真走）');
// 失败不推进
SE.cancel();
fresh('洛水城', 800);
SE.start('contract_hall', 'peddler_run');
var resErr = SE.choose(3);
ok(!!resErr.error && resErr.error.indexOf('没货') >= 0, 'E14 空肩膀点出手——柜台回绝原样上屏');
eq(stones(), 1000, 'E15 回绝分文不动');
eq(SE.activeState.history.length, 0, 'E16 回决不推进历史（没成交的事不留案底）');
// 真卖
fresh('洛水城', 800);
var tE18 = PD.todayLots(), pE18 = tE18[0].price;
PD.buy(0);
SE.cancel();
SE.start('contract_hall', 'peddler_run');
var sellQuote = PD.holdings()[0].sellPrice;
var resSell = SE.choose(3);
ok(!resSell.error, 'E17 柜前出手成交');
eq(stones(), 1000 - pE18 + sellQuote, 'E17b 经引擎卖——灵石真入（进价出价的账对得平）');
eq(cd._peddler, null, 'E18 出手后货账收干净');
// 走人
SE.cancel();
fresh('洛水城', 800);
SE.start('contract_hall', 'peddler_run');
var resLeave = SE.choose(6);
ok(!resLeave.error && stones() === 1000 && !lots(), 'E19 离了柜前——分文不动货不动');

// ==================== F · 哨兵 ====================
console.log('\n[F] 哨兵（新账干净）');
var srcSvc = loadScript('js/economy/peddler-service.js');
var srcFac = loadScript('js/city-facilities/facility-peddler-contract.js');
eq((srcSvc.match(/Math\.random/g) || []).length, 0, 'F1 贩货服务零骰（单看播种、价看行情、账是定数）');
eq((srcFac.match(/Math\.random/g) || []).length, 0, 'F2 贩货契剧本零骰（贩货不是赌——全剧本无 roll）');
ok(srcFac.indexOf('roll') < 0, 'F3 剧本里连 roll 字面都没有');
[srcSvc, srcFac].forEach(function (s, i) {
    ok(s.indexOf('localStorage') < 0 && s.indexOf('saveWildState') < 0 && s.indexOf('wildState') < 0, 'F' + (4 + i) + ' 零直写存档（货账走角色单字段）');
});
ok(srcSvc.indexOf('insightPoints') < 0 && srcSvc.indexOf('markOnce') < 0 && srcFac.indexOf('insightPoints') < 0, 'F6 悟道点零发放（总闸已满）');
ok(srcSvc.indexOf('addSpiritStones') < 0 && srcSvc.indexOf('.credit(') < 0 && srcFac.indexOf('addSpiritStones') < 0, 'F7 零直接发票子（进出全走统一结算）');
var latin = /[A-Za-z]/;
function scanLatin(src) {
    var leak = null;
    (src.match(/'[^']+'/g) || []).forEach(function (s) {
        var v = s.slice(1, -1);
        if (/[+);({\[,?<>]/.test(v)) return;
        if (v.indexOf('\\') >= 0) return;
        if (/typeof|===|!==/.test(v)) return;   // 夹在两个代码串之间的判断式片段，不是话术
        if (v === '_peddler_') return;   // 播种盐（与斗法台 '_book_' 同款代码种子）
        if (/^[a-z0-9]+(?:[-_: ][a-z0-9]+)*$/.test(v)) return;
        if (latin.test(v)) leak = leak || s;
    });
    return leak;
}
eq(scanLatin(srcSvc), null, 'F8 贩货服务话术零拉丁');
eq(scanLatin(srcFac), null, 'F9 贩货契话术零拉丁');
var htmlSrc = loadScript('仙侠.html');
ok(htmlSrc.indexOf('js/economy/peddler-service.js') > htmlSrc.indexOf('js/core/reward-service.js'), 'F10 服务挂在统一结算之后');
ok(htmlSrc.indexOf('js/city-facilities/facility-peddler-contract.js') > htmlSrc.indexOf('js/city-facilities/facility-arena-book.js'), 'F11 剧本挂在增补通道同批之后');
var mdSrc = loadScript('js/extensions/market-dynamic.js');
ok(['priceMul:', 'adjustFromTrade:', 'notePlayerTrade:', 'tickDay:', 'applyWorldEvent:', 'listActiveEvents:'].every(function (k) { return mdSrc.indexOf(k) >= 0; }), 'F12 行情老导出一个不缺（本波只添 regionFor 一口）');
ok(mdSrc.indexOf('regionFor: _marketCityFor') >= 0, 'F13 折算口径导出在册（贩货与 v23.2 接线共用一口）');

console.log('\n========== 第六十九波 · 跑单帮贩货 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
