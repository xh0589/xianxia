/**
 * wave42-wildmarket-node.js — 第四十二波 · 把账补圆 验收：
 *   A 野市开张：地域名开店挂野市旗、城铺老路径分毫不动
 *   B 买价认行情：野市买价=行价×本地行情倍率（与时价标签同一本账）、当日一口价（缓存修复）
 *   C 卖价认行情：野市回购的地区倍率走行情真源、两界别名归天空城、城铺回购老路径不动
 *   D 称号出口：面板元素与渲染点在册、进店掌柜照称号称呼、无称号不硬塞
 *   E 哨兵：接线在册、新话术零拉丁、买价管线不双算
 *
 * 运行：node tests/wave42-wildmarket-node.js
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

// ==================== 共享全局桩 ====================
global.window = global;
var els = {};
function fakeEl() {
    var el = {
        children: [], style: {}, className: '', id: '',
        appendChild: function (c) { this.children.push(c); return c; },
        remove: function () {}, addEventListener: function () {},
        querySelectorAll: function () { return []; },
        closest: function () { return null; },
        _html: '', textContent: ''
    };
    Object.defineProperty(el, 'innerHTML', {
        get: function () { return this._html; },
        set: function (v) { this._html = String(v); },
        configurable: true
    });
    return el;
}
var bodyKids = [];
global.document = {
    readyState: 'complete',
    createElement: function () { return fakeEl(); },
    getElementById: function (id) { if (!els[id]) els[id] = fakeEl(); return els[id]; },
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
    addEventListener: function () {},
    body: { appendChild: function (m) { bodyKids.push(m); } }
};
global.localStorage = { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} };
var msgs = [];
global.showMessage = function (m, t) { msgs.push({ m: String(m), t: t }); };
global.gameLog = { entries: [], add: function () {} };
global.alert = function () {};
global.prompt = function () { return null; };
global.getAbsoluteDay = function () { return 100; };
global.timeSystem = {
    gameTime: { currentDay: 7, totalMinutes: 0 },
    advanceTime: function () {},
    getAbsoluteDay: function () { return 100; },
    onNewDaySubscribe: function () {}
};
// 货样：前缀决定行当（mat_草=药材 / mat_铁=矿材 / pill_=丹药）
global.itemById = {
    mat_lingzhi: { id: 'mat_lingzhi', name: '灵芝', basePrice: 100, price: 100, type: 'material', icon: '🍄' },
    mat_iron_ore: { id: 'mat_iron_ore', name: '玄铁矿', basePrice: 100, price: 100, type: 'material', icon: '⛏️' },
    pill_small_recovery: { id: 'pill_small_recovery', name: '疗伤丹', basePrice: 50, price: 50, type: 'pill', icon: '💊' }
};
// 城数据桩：金城是座真城（买 0.9 卖 1.05），地域名查无城数据
var currentLoc = '金城';
global.locationSystem = {
    cityData: { '金城': { region: '西荒', priceModifier: { buy: 0.9, sell: 1.05 }, specialties: [] } },
    getCurrentLocation: function () { return currentLoc; },
    getCityPriceModifier: function (city, type) {
        var c = this.cityData[city];
        return (c && c.priceModifier && c.priceModifier[type]) || 1.0;
    },
    getCityData: function (city) { return this.cityData[city] || null; },
    getCityRegion: function (city) { var c = this.cityData[city]; return (c && c.region) || null; }
};
global.inventory = { slots: [], currency: { spiritStones: 10000, copper: 0 } };
global.currentCharData = { name: '测试散修', realm: '金丹', location: '金城' };
global.playerReputation = 0;

// 真模块上场：世界循环（地域→商城别名）、行情真源、世界事件（买价管线）、商店
load('js/core/world-loop.js');
load('js/extensions/market-dynamic.js');
load('js/world-events.js');
load('js/enhanced-shop.js');
load('js/map/travel-journal.js');

var MD = global.MarketDynamic;

// 定骰：波动归零（fluctuation = 1），价格全由倍率说话
var origRandom = Math.random;
Math.random = function () { return 0.5; };

// ==================== A · 野市开张 ====================
console.log('\n[A] 野市开张（地域名开店、城铺老路径不动）');
var wmShopId, wmShop, cityShopId, cityShop;
{
    if (typeof global.initShopSystem === 'function' && !global.shopManager) global.initShopSystem();
    wmShopId = global.ensureCityShop('西漠', 'general', { wildMarket: true });
    wmShop = global.shopManager.getShop(wmShopId);
    assert(!!wmShop, 'A1 地域名开得出野市（西漠·坊市）');
    eq(wmShop._wildMarket, true, 'A2 野市旗挂上（回购认行情的凭据）');
    eq(wmShop._cityName, '西漠', 'A3 店铺自己的城=脚下地域');
    eq(wmShop.location, '西漠', 'A4 店铺位置=脚下地域（回购报价的锚）');

    cityShopId = global.ensureCityShop('金城', 'general');
    cityShop = global.shopManager.getShop(cityShopId);
    assert(!!cityShop && !cityShop._wildMarket, 'A5 城里开店不挂野市旗（老路径分毫不动）');
    eq(cityShop._cityName, '金城', 'A6 城铺的城还是城');
}

// ==================== B · 买价认行情 ====================
console.log('\n[B] 买价认行情（与时价标签同一本账、当日一口价）');
{
    // 南疆野市：药材行情 0.7（CITY_BASE_BIAS 真源）
    var njId = global.ensureCityShop('南疆', 'general', { wildMarket: true });
    var njShop = global.shopManager.getShop(njId);
    var zzId = global.ensureCityShop('中州', 'general', { wildMarket: true });
    var zzShop = global.shopManager.getShop(zzId);
    var herb = global.itemById.mat_lingzhi;
    var pNJ = njShop.getItemPrice(herb);
    var pZZ = zzShop.getItemPrice(herb);
    var mulNJ = MD.priceMul('南疆', 'mat_lingzhi');
    var mulZZ = MD.priceMul('中州', 'mat_lingzhi');
    eq(mulNJ, 0.7, 'B1 行情真源：南疆药材 ×0.70（贱处）');
    eq(pNJ, Math.round(100 * global.getCombinedShopPriceMultiplier('南疆', 'mat_lingzhi')), 'B2 南疆野市买价=行价×本地行情（管线同一本账）');
    assert(pNJ < pZZ, 'B3 同一株灵芝：南疆野市卖得比中州野市便宜（价差是真的）');
    eq(pZZ, 100, 'B4 中州药材行情 ×1.00：买价就是行价');

    // 矿在西漠（→西荒）贱
    var wmIron = wmShop.getItemPrice(global.itemById.mat_iron_ore);
    eq(wmIron, Math.round(100 * MD.priceMul('西荒', 'mat_iron_ore')), 'B5 西漠野市的矿按西荒行情开价（别名表真生效 ×0.70）');
    eq(wmIron, 70, 'B6 玄铁矿西漠买价 70（行价 100）');

    // 当日一口价：缓存修复——第二眼看的是同一个价
    var pNJ2 = njShop.getItemPrice(herb);
    eq(pNJ2, pNJ, 'B7 当日第二眼买价不变（旧账缓存裸价、乘数全丢——已修）');

    // 城铺买价：城市系数与行情都在，且不双算
    var pCity = cityShop.getItemPrice(herb);
    var expectCity = Math.round(100 * global.getCombinedShopPriceMultiplier('金城', 'mat_lingzhi'));
    eq(pCity, expectCity, 'B8 金城铺买价=行价×金城系数（0.9×西荒药材1.05）——城铺口径未变');
    assert(pCity < 100 && pCity > 80, 'B9 金城买价在九成上下（0.9×1.05≈0.945，无双算痕迹）');

    // 时价标签认店不认人：野市里标签显示的就是脚下地域的价
    var tag = global.__buildShopPriceTag('西漠');
    assert(tag.indexOf('西荒') >= 0 || tag.indexOf('矿材') >= 0, 'B10 时价标签传了地域就按地域报（认店不认人）');
}

// ==================== C · 卖价认行情 ====================
console.log('\n[C] 卖价认行情（回购走真源、两界归天空、城铺不动）');
{
    var T = global.TradeService;
    eq(T.getRegionMultiplier('中州', { wildMarket: true, itemId: 'mat_lingzhi' }), MD.priceMul('中州', 'mat_lingzhi'), 'C1 中州野市回购药材：地区倍率=行情真源');
    eq(T.getRegionMultiplier('南疆', { wildMarket: true, itemId: 'mat_lingzhi' }), 0.7, 'C2 南疆野市回购药材 ×0.70（贱处卖不上价——方向对了）');
    eq(T.getRegionMultiplier('西漠', { wildMarket: true, itemId: 'mat_iron_ore' }), 0.7, 'C3 西漠野市回购矿 ×0.70（别名→西荒）');
    eq(T.getRegionMultiplier('魔界', { wildMarket: true, itemId: 'mat_iron_ore' }), 0.85, 'C4 魔界野市归天空城行价（矿 ×0.85，别名补行生效）');
    eq(T.getRegionMultiplier('灵界', { wildMarket: true, itemId: 'mat_lingzhi' }), 1.0, 'C5 灵界野市归天空城行价（药材 ×1.00）');
    eq(T.getRegionMultiplier('金城', null), 1.05, 'C6 城铺回购老路径分毫不动（金城卖系数 1.05）');
    eq(T.getRegionMultiplier('金城'), 1.05, 'C7 不传第二参的老调用照旧（向后兼容）');

    // 跑单帮闭环核算：南疆收药材（买70）→ 中州出手（回购率×1.0）比 南疆出手（×0.7）多赚
    var rate = T.getBaseBuybackRate ? T.getBaseBuybackRate('general') : 0.35;
    var sellZZ = Math.floor(100 * rate * T.getRegionMultiplier('中州', { wildMarket: true, itemId: 'mat_lingzhi' }));
    var sellNJ = Math.floor(100 * rate * T.getRegionMultiplier('南疆', { wildMarket: true, itemId: 'mat_lingzhi' }));
    assert(sellZZ > sellNJ, 'C8 同一株灵芝中州出手比南疆多卖（' + sellZZ + '>' + sellNJ + '，脚程换差价成立）');
    var buyNJ = 70;
    assert(buyNJ > sellZZ, 'C9 低买高卖仍亏（买70卖' + sellZZ + '）——回购率没动，无印钞口，赚的是零成本货的脚力钱');

    // quoteSell 全链：野市旗真递进报价单
    var slot = { uid: 'u_w42', templateId: 'mat_lingzhi', count: 1, getTemplate: function () { return global.itemById.mat_lingzhi; } };
    global.inventory.slots.push(slot);
    var quote = T.quoteSell(zzId, 'u_w42', 1);
    assert(!!quote, 'C10 野市报价单开得出来');
    eq(quote.regionMul, 1.0, 'C11 报价单地区倍率=中州药材行情（1.00）');
    var njShop2 = global.shopManager.getShop(njId);
    var quoteNJ = T.quoteSell(njId, 'u_w42', 1);
    eq(quoteNJ.regionMul, 0.7, 'C12 南疆野市报价单地区倍率 ×0.70（同一件货两个价）');
    global.inventory.slots.pop();
}

// ==================== D · 称号出口 ====================
console.log('\n[D] 称号出口（面板在册、进店有称呼）');
{
    // 面板：元素与渲染点（app.js 重，走源码哨兵；页面元素真查）
    var appSrc = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
    assert(appSrc.indexOf("getElementById('char-travel-title')") > 0 && appSrc.indexOf('travelTitle()') > 0, 'D1 面板渲染点在册（境界旁挂称号）');
    var htmlSrc = fs.readFileSync(path.join(ROOT, '仙侠.html'), 'utf8');
    assert(htmlSrc.indexOf('id="char-travel-title"') > 0, 'D2 页面元素在册');

    // 进店称呼：真开一家野市看模态——掌柜的眼神跟着名分走
    global.currentCharData._travel = { regions: {}, marks: {}, steps: 100 };   // 初出茅庐
    bodyKids.length = 0;
    var opened = false;
    try { global.showShopDialog(wmShop); opened = bodyKids.length > 0; } catch (e) { opened = false; }
    assert(opened, 'D3 野市模态开得出来（运行时地基）');
    if (opened) {
        assert(bodyKids[0].innerHTML.indexOf('掌柜的') < 0, 'D4 初出茅庐：刚走百里的新人，掌柜的懒得认（名分是长出来的）');
    }
    global.currentCharData._travel = { regions: { '中州': 1, '东荒': 1, '南疆': 1, '西漠': 1, '北冥': 1 }, marks: {}, steps: 0 };   // 行走山河
    bodyKids.length = 0;
    try { global.showShopDialog(wmShop); } catch (e) {}
    assert(bodyKids.length > 0 && bodyKids[0].innerHTML.indexOf('走过不少地方吧') >= 0, 'D5 五域在身：掌柜的打量靴上风尘，让里面坐');
    global.currentCharData._travel = { regions: { '中州': 1, '东荒': 1, '南疆': 1, '西漠': 1, '北冥': 1, '蜀地': 1, '东南海域': 1, '灵界': 1, '魔界': 1 }, marks: {}, steps: 0 };   // 踏遍九州
    bodyKids.length = 0;
    try { global.showShopDialog(wmShop); } catch (e) {}
    assert(bodyKids.length > 0 && bodyKids[0].innerHTML.indexOf('蓬荜生辉') >= 0, 'D6 九域踏遍：掌柜的迎到门口腰弯得很低（招呼随名分长）');
    global.currentCharData._travel = { regions: {}, marks: {}, steps: 0 };   // 无名号
    bodyKids.length = 0;
    try { global.showShopDialog(wmShop); } catch (e) {}
    assert(bodyKids.length > 0 && bodyKids[0].innerHTML.indexOf('掌柜的') < 0, 'D7 没出门没称号：不硬塞招呼');
    delete global.currentCharData._travel;
}

// ==================== E · 哨兵 ====================
console.log('\n[E] 哨兵（接线在册、零拉丁、不双算）');
{
    var es = fs.readFileSync(path.join(ROOT, 'js/enhanced-shop.js'), 'utf8');
    var rm = fs.readFileSync(path.join(ROOT, 'js/map/randomMap.js'), 'utf8');
    var wl = fs.readFileSync(path.join(ROOT, 'js/core/world-loop.js'), 'utf8');
    assert(rm.indexOf("window.openCityShop((v && v.key === 'black') ? 'special' : 'general', currentRegionForMap || undefined)") > 0, 'E1 野市真传脚下地域、黑市开真黑市柜');
    assert(fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8').indexOf('function openCityShop(shopType, cityOverride)') > 0, 'E2 开店入口收地域参数（老调用不传照旧）');
    assert(wl.indexOf("'灵界': '天空'") > 0 && wl.indexOf("'魔界': '天空'") > 0, 'E3 两界别名补行在册');
    assert(es.indexOf('function ensureCityShop(cityName, shopType, opts)') > 0, 'E4 开店函数收opts（野市旗有出处）');
    // 买价管线不双算：野市倍率只经 getCombinedShopPriceMultiplier 一道（v20.53 货架零预烘照旧）
    assert(es.indexOf('Math.floor(price * buyMod)') < 0, 'E5 货架仍旧零预烘（买价系数只走结算一道）');
    var iCache = es.indexOf('this._priceCache[cacheKey] = price;');
    var iSpeech = es.indexOf("window.getPlayerSpeechDiscount");
    assert(iCache > iSpeech, 'E6 价格缓存写在全部乘数之后（当日一口价）');
    // 零拉丁：称呼表四句全查
    var gSeg = es.slice(es.indexOf('var SHOP_TITLE_GREET'), es.indexOf('function showShopDialog'));
    var gLits = gSeg.match(/'[^']*'/g) || [];
    assert(gLits.length >= 8 && gLits.every(function (s) { return !/[A-Za-z]/.test(s); }), 'E7 称呼表话术零拉丁');
    assert(gSeg.indexOf('初出茅庐') < 0, 'E8 称呼表里真没有新人档（不认就是不认）');
    var panel = appSrc0().match(/🎏[^;]*/);
    function appSrc0() { return fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8'); }
    assert(panel && !/[A-Za-z]/.test(panel[0].split("'")[0]), 'E9 面板称号前缀零拉丁');
}

Math.random = origRandom;

console.log('\n========== 第四十二波 · 把账补圆 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
