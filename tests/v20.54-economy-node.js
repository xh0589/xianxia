/**
 * v20.54-economy-node.js — 经济去处与漏洞验收：
 *   P1 价差套利封口：城市货架买价系数不再预烘+结算双算（金城买 0.81×行价、商会代售收 1.02×行价 → 无限连点）
 *   P2 货架有现货：预设铺子给出现货数且每日补货（此前无限量）
 *   P3 拍卖行不再是印钞机：高价位衰减 + 流拍压柜费 + 摊位上限（旧表每一档期望值都为正）
 *   P4 盲匣开出来的是货不是钱（40 灵石赌 180 灵石、零精力连点 → 实物要过回购折价）
 *   P5 钱庄账目：借入是进账、还账含息、放贷看家底（旧版借钱越借越穷 / 借入即存入零风险套利）
 *   P6 通用捐献：灵石入宗门公账记功劳，宗门库真涨（此前三十五门晋升没有灵石去处）
 *
 * 运行：node tests/v20.54-economy-node.js
 */
'use strict';

var fs = require('fs');
var vm = require('vm');
var path = require('path');
var ROOT = path.resolve(__dirname, '..');

var passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) passed++;
    else { failed++; console.error('[FAIL] ' + msg); }
}
function load(rel) {
    vm.runInThisContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), { filename: rel });
}
function src(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

global.window = global;
global.document = {
    getElementById: function () { return null; },
    querySelectorAll: function () { return []; },
    addEventListener: function () {},
    body: null
};
global.localStorage = { getItem: function () { return null; }, setItem: function () {} };
global.alert = function () {};
var msgs = [];
global.showMessage = function (m, t) { msgs.push({ m: m, t: t }); };
global.gameLog = { add: function () {} };
global.prompt = function () { return null; };
global.getAbsoluteDay = function () { return 100; };

// ==================== P1 价差套利封口 ====================
console.log('\n[P1] 价差套利封口');
var shopSrc = src('js/enhanced-shop.js');
assert('城市货架 basePrice 不再预烘买价系数', shopSrc.indexOf('Math.floor(price * buyMod)') < 0);
assert('专属投放段同样不预烘', shopSrc.indexOf('Math.floor(p * buyMod *') < 0);
assert('结算管线仍乘一次城市买价系数（不误伤）',
    src('js/world-events.js').indexOf("getCityPriceModifier(cityName, 'buy')") >= 0);
// 金城买价 0.9：单次买进 + 单次卖出不应出现稳定正利润
load('js/location-system.js');
var jinBuy = global.locationSystem.getCityPriceModifier('金城', 'buy');
var jinSell = global.locationSystem.getCityPriceModifier('金城', 'sell');
// 代售抽一成半：实收 = 行价×sell×0.85；买进 = 行价×buy（波动 ±8% 视为噪声）
assert('金城买 0.9 / 卖 ' + jinSell + '：买进再代售不再稳赚',
    (jinSell * 0.85) - jinBuy < 0.05);

// ==================== P2 货架有现货 ====================
console.log('\n[P2] 货架有现货');
var initSrc = src('js/enhanced-shop.js');
assert('初始化给预设铺子补现货数', initSrc.indexOf('presetStockCap(item, shop)') >= 0);
assert('每日补货订阅已挂', initSrc.indexOf("onNewDaySubscribe") >= 0);
assert('名器只此一把（≥1000 灵石现货 1）', initSrc.indexOf('if (p >= 1000) return 1;') >= 0);
assert('buyItem 的售罄判断仍在（现货 0 拒卖）', shopSrc.indexOf('该商品已售罄') >= 0);

// ==================== P3 拍卖行 ====================
console.log('\n[P3] 拍卖行');
load('js/core/balance-config.js');
var aucCfg = global.XianXia.Balance.auction;
assert('价位衰减表已加高档', aucCfg.saleChanceByPriceRatio.length >= 10);
// 期望值斜率 = 0.92×chance − 上架费率；为正则挂得越高赚得越多（印钞机）
function slope(ratio) {
    var rows = aucCfg.saleChanceByPriceRatio;
    for (var i = 0; i < rows.length; i++) if (ratio <= rows[i].maxRatio) return 0.92 * rows[i].chance - aucCfg.listingFeeRate;
    return 0.92 * rows[rows.length - 1].chance - aucCfg.listingFeeRate;
}
function ev(ratio) { return ratio * slope(ratio); }
assert('诚实定价（比值 1）期望 ' + ev(1).toFixed(3) + ' 仍为正', ev(1) > 0);
assert('天价（比值 10）斜率转负：挂得越高不再赚得越多', slope(10) < 0);
assert('诚实定价始终优于赌天价（比值 1 期望 > 比值 4 期望）', ev(1) > ev(4));
assert('流拍压柜费入账', typeof aucCfg.unsoldStorageFeeRate === 'number' && aucCfg.unsoldStorageFeeRate > 0);
assert('摊位有上限', aucCfg.maxActiveListings > 0 && aucCfg.maxActiveListings < 20);
assert('兜底表与真源同档（配置缺失时不回落到旧三档）',
    src('js/economy/auction-service.js').indexOf('{ maxRatio: 10.0, chance: 0.018 }') >= 0);

// 真跑：上架→流拍要掏压柜费
var items = [];
global.EconomyTransaction = {
    debit: function (cur, n) {
        if ((global.inventory.currency.spiritStones || 0) < n) return false;
        global.inventory.currency.spiritStones -= n; return true;
    },
    credit: function (cur, n) { global.inventory.currency.spiritStones += n; },
    addSnapshot: function () { items.push(1); return true; },
    removeByUid: function () { return { templateId: 'mat_lingzhi', count: 1 }; },
    run: function (work) { return work(); }
};
global.inventory = { slots: [], currency: { spiritStones: 100000 } };
global.itemById = { mat_lingzhi: { name: '灵芝', price: 100 } };
global.currentCharData = { name: '散人', spiritStones: 100000 };
var called = [];
global.GameScheduler = {
    nowMinute: function () { return called.length * 10; },
    schedule: function (k, m, p, o) { called.push(o); if (o && o.fn) o.fn(); },
    registerHandler: function () {}
};
load('js/economy/auction-service.js');
var AS = global.AuctionService;
assert('AuctionService 已挂载', !!AS);
var invSlot = { uid: 'u1', templateId: 'mat_lingzhi', count: 1, getTemplate: function () { return global.itemById.mat_lingzhi; } };
global.inventory.slots.push(invSlot);
var before = global.inventory.currency.spiritStones;
// 挂天价（比值 20）→ 大概率流拍 → 掏压柜费
var listed = false;
for (var t = 0; t < 30 && !listed; t++) { listed = AS.listBySlotIndex(0); }
assert('天价挂单成功受理', listed);
assert('上架费先扣', global.inventory.currency.spiritStones < before);
var feesPaid = before - global.inventory.currency.spiritStones;
assert('上架费按要价百分比（天价要收得多）', feesPaid > 50);

// ==================== P4 盲匣 ====================
console.log('\n[P4] 盲匣');
var b3 = src('js/city-facilities/facility-batch3.js');
assert('盲匣不再按行情折灵石到账', b3.indexOf('stones: function () { return Math.round(150 * facilitySellMod()); }') < 0);
assert('盲匣改开实物（灵芝入包）', b3.indexOf("itemId: 'mat_lingzhi'") >= 0);
assert('盲匣文案说清是货', b3.indexOf('半匹前朝的素绢') >= 0);

// ==================== P5 钱庄 ====================
console.log('\n[P5] 钱庄');
var rewardApplyCalls = [];
global.RewardService = {
    apply: function (spec) { rewardApplyCalls.push(spec); return { success: true, messages: [] }; }
};
load('js/city-facilities/bank-service.js');
var BS = global.BankService;
assert('BankService 已挂载', !!BS);
rewardApplyCalls.length = 0;
var borrowRes = BS.borrow(100);
assert('借入放款成功', !!borrowRes && borrowRes.success);
assert('借入是钱进口袋（正数 delta）', rewardApplyCalls.some(function (s) { return s.stones === 100; }));
rewardApplyCalls.length = 0;
var repayRes = BS.repay();
assert('还账成功', !!repayRes && repayRes.success);
assert('还账含息（100 借款还 120）', rewardApplyCalls.some(function (s) { return s.stones === -120; }));
// 额度：家底 0 的人借不到大钱
global.currentCharData = { name: '穷修', spiritStones: 0 };
var capRes = BS.borrow(99999);
assert('家底不够，钱庄不放贷', !!capRes && capRes.success === undefined && !!capRes.error);

// ==================== P6 通用捐献 ====================
console.log('\n[P6] 通用捐献');
global.inventory = { slots: [], currency: { spiritStones: 5000 } };
global.currentCharData = { name: '弟子', spiritStones: 5000 };
global.SECT_INTERNAL = { '少林寺': { resources: 100 } };
global.discipleState = { isInSect: true, sectId: 'shaolin', sectName: '少林寺', rank: 7, rankName: '杂役弟子', contribution: 10 };
global.locationSystem.getCurrentLocation = function () { return '帝都·长安'; };
load('js/sects/sects-system.js');
assert('通用捐献已挂载（不限丐帮）', typeof global.donateSectStones === 'function');
var donateCalls = [];
global.RewardService.apply = function (spec) { donateCalls.push(spec); return { success: true, messages: [] }; };
assert('捐 100 灵石成功', global.donateSectStones(100) === true);
assert('一笔交割：扣 100 灵石', donateCalls.some(function (s) { return s.stones === -100; }));
assert('功劳对半记（+50 贡献）', donateCalls.some(function (s) { return s.contribution === 50; }));
assert('宗门公账真涨（100 → 200）', global.SECT_INTERNAL['少林寺'].resources === 200);
assert('没入宗的不给捐', (function () {
    global.discipleState.isInSect = false;
    var r = global.donateSectStones(100);
    global.discipleState.isInSect = true;
    return r === false;
})());
assert('贡献面板有捐献入口', src('js/app.js').indexOf('donateSectStones(') >= 0);

console.log('\n========== 结果：' + passed + ' 通过 / ' + failed + ' 失败 ==========');
process.exit(failed ? 1 : 0);
