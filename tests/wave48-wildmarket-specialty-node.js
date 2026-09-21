/**
 * wave48-wildmarket-specialty-node.js — 第四十八波 · 野市地域特产 验收：
 *   A 货架认地域：九域野市各自上特产（名字命中强上、库存加厚）、类目偏向填架
 *   B 偏向顺序：本地行当的货排在别处货前头
 *   C 城铺不动：城档在案的城照旧走城档特产（老路径分毫不动）
 *   D 行情仍真源：买价管线零新乘子（v42 的账原样）
 *   E 吆喝：掌柜话术出口在册、零拉丁、黑市不吆喝、天界无表
 *   F 哨兵：v42 野市旗/回购行情分支原样、秘籍黑市规矩未动、保底货未动、上限未动
 *
 * 运行：node tests/wave48-wildmarket-specialty-node.js
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

// ==================== 共享全局桩（wave42 同源，货样加厚） ====================
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
global.document = {
    readyState: 'complete',
    createElement: function () { return fakeEl(); },
    getElementById: function (id) { if (!els[id]) els[id] = fakeEl(); return els[id]; },
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
    addEventListener: function () {},
    body: { appendChild: function () {} }
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
function it(id, name, type, price) { return { id: id, name: name, type: type, basePrice: price, price: price, icon: '📦' }; }
global.itemById = {
    // 药材（mat_ 草类 → 行情「药材」）
    mat_lingzhi: it('mat_lingzhi', '灵芝', 'material', 100),
    mat_ginseng: it('mat_ginseng', '人参', 'material', 150),
    mat_he_shou_wu: it('mat_he_shou_wu', '何首乌', 'material', 120),
    mat_scutellaria: it('mat_scutellaria', '黄芩', 'material', 60),
    mat_liquorice: it('mat_liquorice', '甘草', 'material', 40),
    mat_dragon_saliva: it('mat_dragon_saliva', '龙涎草', 'material', 800),
    mat_phoenix_blood_grass: it('mat_phoenix_blood_grass', '凤血草', 'material', 900),
    mat_snow_lotus: it('mat_snow_lotus', '雪莲', 'material', 500),
    mat_earth_spirit_root: it('mat_earth_spirit_root', '地灵根', 'material', 700),
    mat_blood_bodhi: it('mat_blood_bodhi', '血菩提', 'herb', 600),
    // 矿石（mat_ 铁类 → 行情「矿材」）
    mat_iron_ore: it('mat_iron_ore', '铁矿', 'material', 50),
    mat_copper_ore: it('mat_copper_ore', '铜矿', 'material', 45),
    mat_dark_iron: it('mat_dark_iron', '玄铁', 'material', 300),
    mat_meteorite: it('mat_meteorite', '陨铁', 'material', 600),
    mat_cold_iron: it('mat_cold_iron', '寒铁', 'material', 350),
    // 皮货魔材
    mat_beast_skin: it('mat_beast_skin', '兽皮', 'material', 80),
    mat_beast_bone: it('mat_beast_bone', '兽骨', 'material', 70),
    mat_demon_beast_core: it('mat_demon_beast_core', '妖兽内丹', 'material', 1000),
    mat_demon_beast_skin: it('mat_demon_beast_skin', '妖兽皮', 'material', 400),
    // 丹符
    pill_small_recovery: it('pill_small_recovery', '小还丹', 'pill', 50),
    pill_qi_powder: it('pill_qi_powder', '补气散', 'pill', 20),
    pill_energy_powder: it('pill_energy_powder', '精力散', 'pill', 20),
    pill_qi_gather: it('pill_qi_gather', '聚气丹', 'pill', 80),
    pill_qi_return: it('pill_qi_return', '回灵丹', 'pill', 200),
    tal_attack: it('tal_attack', '攻击符', 'talisman', 60),
    // 兵甲
    wpn_steel_sword: it('wpn_steel_sword', '青钢剑', 'sword', 400),
    wpn_dragon_spring: it('wpn_dragon_spring', '龙泉剑', 'sword', 2000),
    arm_cloud: it('arm_cloud', '云纹甲', 'equipment', 300),
    // 吃食杂项
    food_steamed_bun: it('food_steamed_bun', '馒头', 'food', 5),
    food_jade_nectar: it('food_jade_nectar', '琼浆玉液', 'food', 500),
    spec_spirit_source_pearl: it('spec_spirit_source_pearl', '灵源珠', 'special', 800)
};
var currentLoc = '金城';
global.locationSystem = {
    cityData: {
        '金城': { region: '西荒', priceModifier: { buy: 0.9, sell: 1.05 }, specialties: [] },
        '洛水城': { region: '中州', priceModifier: { buy: 1.0, sell: 1.0 }, specialties: ['灵芝'] }
    },
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

load('js/core/world-loop.js');
load('js/extensions/market-dynamic.js');
load('js/world-events.js');
load('js/enhanced-shop.js');

var MD = global.MarketDynamic;
var RS = global.REGION_SPECIALTIES;

// 定骰 0.5：库存 = 1+floor(0.5×4) = 3；特产名中 +2 = 5；洗牌序固定
var origRandom = Math.random;
Math.random = function () { return 0.5; };

function shelf(region, type) {
    return global.generateCityShopInventory(region, type || 'general');
}
function find(pool, id) {
    for (var i = 0; i < pool.length; i++) if (pool[i].id === id) return { item: pool[i], idx: i };
    return null;
}

// ==================== A · 货架认地域 ====================
console.log('\n[A] 货架认地域（南药北皮西漠铁，一地一市的货色）');
{
    var nj = shelf('南疆');
    var njQ = find(nj, 'mat_scutellaria');
    assert(!!njQ, 'A1 南疆野市货架有黄芩（特产强上）');
    eq(njQ.item.stock, 5, 'A2 特产库存加厚（定骰底货 3 + 名中 2 = 5）');
    assert(!!find(nj, 'mat_liquorice') && !!find(nj, 'mat_blood_bodhi') && !!find(nj, 'mat_dragon_saliva'),
        'A3 南疆四样特产名全命中（黄芩甘草血菩提龙涎草）');

    var xm = shelf('西漠');
    var xmT = find(xm, 'mat_dark_iron');
    assert(!!xmT && xmT.item.stock === 5, 'A4 西漠野市玄铁强上且库存加厚（矿出戈壁）');
    assert(!!find(xm, 'mat_iron_ore') && !!find(xm, 'mat_meteorite'), 'A5 西漠铁矿陨铁也在架（名字命中）');

    var bm = shelf('北冥');
    assert(!!find(bm, 'mat_cold_iron') && !!find(bm, 'mat_beast_skin') && !!find(bm, 'mat_snow_lotus'),
        'A6 北冥货架寒铁兽皮雪莲俱全（苦寒地的行当）');

    var sd = shelf('蜀地');
    assert(!!find(sd, 'wpn_steel_sword') && !!find(sd, 'wpn_dragon_spring'), 'A7 蜀地野市上剑（青钢龙泉都在架）');

    var dh = shelf('东荒');
    assert(!!find(dh, 'mat_lingzhi') && !!find(dh, 'mat_ginseng'), 'A8 东荒货架灵芝人参加了厚（林海草药）');

    var zz = shelf('中州');
    assert(!!find(zz, 'pill_qi_gather') && !!find(zz, 'tal_attack') && !!find(zz, 'pill_qi_return'),
        'A9 中州货架聚气丹攻击符回灵丹（中原丹火符窑）');

    var lj = shelf('灵界');
    assert(!!find(lj, 'mat_earth_spirit_root'), 'A10 灵界货架有地灵根（灵物成色）');
    var mj = shelf('魔界');
    assert(!!find(mj, 'mat_demon_beast_core') && !!find(mj, 'mat_demon_beast_skin'), 'A11 魔界货架内丹妖皮俱全（魔货）');

    var dn = shelf('东南海域');
    assert(!!find(dn, 'food_jade_nectar') && !!find(dn, 'spec_spirit_source_pearl'), 'A12 东南海域琼浆灵源珠在架（珠贝水产）');

    assert(nj.length <= 28 + 6, 'A13 货架上限照旧（填架 ≤28，外加六样保底日常不受上限——老规矩）');
    assert(shelf('南疆', 'special').length <= 18 + 6, 'A14 黑市上限照旧（填架 ≤18 + 保底段）');
}

// ==================== B · 类目偏向 ====================
console.log('\n[B] 类目偏向（本地行当排前头，别处货凑后）');
{
    var sd = shelf('蜀地');
    var iSword = find(sd, 'wpn_steel_sword').idx;
    var iFood = find(sd, 'food_jade_nectar');
    assert(iFood === null || iSword < iFood.idx, 'B1 蜀地：剑排在琼浆前头（weapon/sword 偏向先行）');
    var nj = shelf('南疆');
    var iHerb = find(nj, 'mat_scutellaria').idx;
    var iSwordNj = find(nj, 'wpn_steel_sword');
    assert(iSwordNj === null || iHerb < iSwordNj.idx, 'B2 南疆：药材排在剑前头（剑不在南疆行当里）');
    var bm = shelf('北冥');
    var iArmor = find(bm, 'arm_cloud');
    var iPill = find(bm, 'pill_qi_gather');
    assert(iArmor !== null && (iPill === null || iArmor.idx < iPill.idx), 'B3 北冥：甲在丹前（armor/equipment 在行当里先行，丹药不在北冥偏向）');
}

// ==================== C · 城铺老路径不动 ====================
console.log('\n[C] 城铺老路径不动（城档在案的城，跟地域特产表无关）');
{
    var jc = shelf('金城');
    var jcIron = find(jc, 'mat_dark_iron');
    assert(jcIron === null || jcIron.item.stock === 3, 'C1 金城（城档 region=西荒）玄铁不吃地域特产加厚——城铺走城档，不进野市这支');
    var ls = shelf('洛水城');
    var lsLz = find(ls, 'mat_lingzhi');
    assert(!!lsLz && lsLz.item.stock === 5, 'C2 洛水城城档特产「灵芝」照旧强上加厚（老路径原样好使）');
    var ca = shelf('帝都·长安');
    assert(ca.length > 0 && ca.length <= 28, 'C3 城档查无、又不是地域名的店：照旧出货架不炸（兜底路径没误伤）');
    assert(!RS['金城'] && !RS['帝都·长安'], 'C4 特产表只收地域名（城名不在表里，误伤不着）');
}

// ==================== D · 行情仍真源 ====================
console.log('\n[D] 行情仍真源（买价管线零新乘子）');
{
    if (typeof global.initShopSystem === 'function' && !global.shopManager) global.initShopSystem();
    var njId = global.ensureCityShop('南疆', 'general', { wildMarket: true });
    var njShop = global.shopManager.getShop(njId);
    var zzId = global.ensureCityShop('中州', 'general', { wildMarket: true });
    var zzShop = global.shopManager.getShop(zzId);
    var herb = global.itemById.mat_lingzhi;
    eq(MD.priceMul('南疆', 'mat_lingzhi'), 0.7, 'D1 行情真源：南疆药材 ×0.70 原样');
    var pNJ = njShop.getItemPrice(herb);
    var pZZ = zzShop.getItemPrice(herb);
    eq(pNJ, Math.round(100 * global.getCombinedShopPriceMultiplier('南疆', 'mat_lingzhi')), 'D2 南疆野市买价=行价×本地行情（v42 管线同一本账）');
    assert(pNJ < pZZ, 'D3 同一株灵芝南疆贱中州贵——货架偏了，价差还是行情说了算');
    var src = fs.readFileSync(path.join(ROOT, 'js/enhanced-shop.js'), 'utf8');
    var tableSeg = src.slice(src.indexOf('var REGION_SPECIALTIES'), src.indexOf('// ==================== v15.1'));
    // 只扫表体代码行（注释里引行情旧账的数字是文档，不是新乘子）
    var tableCode = tableSeg.split('\n').filter(function (l) { return l.trim().indexOf('//') !== 0; }).join('\n');
    assert(tableCode.indexOf('Mul') < 0 && tableCode.indexOf('price') < 0 && /\d\.\d/.test(tableCode) === false,
        'D4 特产表零价格乘子（货架只管上什么货，价钱一个数不碰）');
    eq((src.match(/getCombinedShopPriceMultiplier\(/g) || []).length, 1, 'D5 买价管线仍只有一处调行情（不双算）');
}

// ==================== E · 掌柜吆喝 ====================
console.log('\n[E] 掌柜吆喝（逛市一句话报本地行市）');
{
    assert(!!RS, 'E1 特产表挂上全局（逛市话术与货架同一本账）');
    var regions = ['中州', '东荒', '南疆', '西漠', '北冥', '蜀地', '东南海域', '灵界', '魔界'];
    var shape = regions.every(function (r) {
        return RS[r] && Array.isArray(RS[r].names) && RS[r].names.length > 0 && Array.isArray(RS[r].cats) && RS[r].cats.length > 0 && typeof RS[r].blurb === 'string' && RS[r].blurb.length > 6;
    });
    assert(shape, 'E2 九域各有特产名/行当/吆喝（三样俱全）');
    var latin = /[A-Za-z]/;
    var leak = null;
    regions.forEach(function (r) { if (latin.test(RS[r].blurb)) leak = leak || RS[r].blurb; });
    assert(leak === null, 'E3 九段吆喝零拉丁（漏: ' + leak + '）');
    assert(!RS['天界'], 'E4 天界不在表（仙界不生村镇，没有野市——四十四波的账）');
    var rm = fs.readFileSync(path.join(ROOT, 'js/map/randomMap.js'), 'utf8');
    assert(rm.indexOf('REGION_SPECIALTIES[currentRegionForMap]') >= 0, 'E5 逛市话术接线在册（wildShop）');
    assert(rm.indexOf("!(v && v.key === 'black')") >= 0, 'E6 黑市不吆喝（黑市有黑市的话风）');
}

// ==================== F · 哨兵 ====================
console.log('\n[F] 哨兵（v42 的账原样、老规矩原样）');
{
    var src = fs.readFileSync(path.join(ROOT, 'js/enhanced-shop.js'), 'utf8');
    assert(src.indexOf("if (opts && opts.wildMarket) shop._wildMarket = true;") >= 0, 'F1 v42 野市旗原样（回购认行情的凭据）');
    assert(src.indexOf('opts.wildMarket && window.MarketDynamic') >= 0, 'F2 v42 回购走行情真源的分支原样');
    assert(src.indexOf('var REGION_SHOP_BIAS = {') >= 0, 'F3 老类目表留着当兜底（没删账）');
    assert(src.indexOf('emptyChance: 0.4, priceMul: 3.0') >= 0, 'F4 黑市秘籍规矩未动（v15.1：40% 空手、价×3）');
    assert(src.indexOf("var guarantees = ['pill_small_recovery', 'pill_qi_powder', 'pill_energy_powder', 'mat_iron_ore', 'mat_lingzhi', 'food_steamed_bun'];") >= 0,
        'F5 保底日常货单未动');
    assert(src.indexOf("var target = shopType === 'general' ? 28 : 18;") >= 0, 'F6 货架上限未动（28/18）');
    assert(src.indexOf('window.REGION_SPECIALTIES = REGION_SPECIALTIES;') >= 0, 'F7 特产表出口在册');
    // 货架不入档（v15.1 的老规矩）：开店函数零 localStorage
    var ensureSeg = src.slice(src.indexOf('function ensureCityShop'), src.indexOf('window.generateCityShopInventory'));
    assert(ensureSeg.indexOf('localStorage') < 0, 'F8 开店零存档写入（货架隔日重生，零迁移照旧）');
}

Math.random = origRandom;
console.log('\n========== 第四十八波 · 野市地域特产 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
