/**
 * v20.9 灵兽坊真实购入 + 藏经阁口径统一 + 培养日限清除
 *
 * 覆盖：
 *   A 灵兽坊货架（在售模板真实、进化形态不上架）
 *   B buyBeast 经济账（DataManager 真源 / 退回背包 / 退回 charData）、失败不动账
 *   C 购入兽形态与驯化口径（Lv.1、亲和45、天赋、乘具复制）
 *   D trainBeast 日限计数器已删、精力成为唯一闸门、无 _trainCount 残留
 *   E canAccessScriptureTier 真源分层矩阵（rank→maxTier 全表）
 *   F 面板回退口径与真源全表一致（含无职位 -1/-2 对齐）
 *   G 静态：maxRank 平行判断清零、app.js 复制判断清零、灵兽坊接线、UI 接线
 *
 * 运行：node tests/v20.9-beast-library-node.js
 */
'use strict';

var path = require('path');
var fs = require('fs');
var vm = require('vm');

var ROOT = path.resolve(__dirname, '..');
function loadScript(rel) { return fs.readFileSync(path.join(ROOT, 'js', rel), 'utf8'); }

var assertions = 0, failures = [];
function ok(cond, label) { assertions++; if (!cond) failures.push(label); }
function eq(actual, expected, label) {
    assertions++;
    if (actual !== expected) failures.push(label + ' (got ' + actual + ', want ' + expected + ')');
}

// ============ A-D：灵兽坊（beast-taming 真链路） ============
var beastMock = {
    console: console,
    Math: Math, JSON: JSON, Object: Object, Array: Array,
    localStorage: {
        _s: {},
        getItem: function (k) { return this._s[k] || null; },
        setItem: function (k, v) { this._s[k] = String(v); }
    },
    timeSystem: { advanceTime: function () {} },
    showMessage: function () {},
    renderBeastList: function () {},
    inventory: { currency: { spiritStones: 0 } },
    currentCharData: { energy: 100, spiritStones: 0 }
};
beastMock.window = beastMock;
var beastsCtx = vm.createContext(beastMock);
vm.runInContext(loadScript('beast-taming.js'), beastsCtx);

var BT = beastMock;
ok(Object.keys(BT.BEAST_SHOP_STOCK).length >= 8, 'A1 货架在售种类 ≥8');
var badStock = Object.keys(BT.BEAST_SHOP_STOCK).filter(function (id) {
    var t = BT.BEAST_TEMPLATES[id];
    return !t || t.catchable === false || !isFinite(BT.BEAST_SHOP_STOCK[id].price) || BT.BEAST_SHOP_STOCK[id].price <= 0;
});
eq(badStock.length, 0, 'A2 在售模板全部真实可购 [' + badStock.join(',') + ']');
['wind_wolf_king', 'flame_tiger_king', 'fire_phoenix_adult'].forEach(function (ev) {
    ok(!BT.BEAST_SHOP_STOCK[ev], 'A3 进化形态不上架：' + ev);
});
var prices = Object.keys(BT.BEAST_SHOP_STOCK).map(function (id) { return BT.BEAST_SHOP_STOCK[id].price; });
var cheapest = Math.min.apply(null, prices), dearest = Math.max.apply(null, prices);
ok(cheapest >= 150 && dearest >= 2000, 'A4 幼兽付血脉钱：价格区间有分量（' + cheapest + '–' + dearest + '）');

// B1：DataManager 真源扣款
beastMock.XianXia = { DataManager: {
    _bal: 500,
    deductSpiritStones: function (n) { if (this._bal >= n) { this._bal -= n; return true; } return false; }
} };
beastMock.tamedBeasts.length = 0;
var r1 = BT.buyBeast('wind_wolf');
ok(r1 === true, 'B1 有钱购入成功');
eq(beastMock.XianXia.DataManager._bal, 300, 'B2 DataManager 真扣 200');
eq(beastMock.tamedBeasts.length, 1, 'B3 灵兽入队');
var r2 = BT.buyBeast('fire_phoenix');
ok(r2 === false, 'B4 钱不够买不起火凤');
eq(beastMock.XianXia.DataManager._bal, 300, 'B5 失败不动账');
eq(beastMock.tamedBeasts.length, 1, 'B6 失败不塞兽');

// C：购入兽形态（驯化口径）
var b0 = beastMock.tamedBeasts[0];
eq(b0.templateId, 'wind_wolf', 'C1 模板正确');
eq(b0.level, 1, 'C2 幼兽从 Lv.1 起养');
eq(b0.affection, 45, 'C3 驯化幼兽亲和 45');
ok(typeof b0.trait === 'string' && b0.trait.length > 0, 'C4 个体天赋有值');
ok(Array.isArray(b0.skills) && b0.skills.length === 2, 'C5 模板技能带入');
ok(b0.mount && b0.mount.speed === 1.5, 'C6 乘具数据复制');

// C7：无 DataManager → 退回背包真源
delete beastMock.XianXia;
beastMock.inventory.currency.spiritStones = 1000;
beastMock.currentCharData.spiritStones = 1000;
var r3 = BT.buyBeast('spirit_fox');
ok(r3 === true, 'C7 无 DataManager 退回背包购入');
eq(beastMock.inventory.currency.spiritStones, 740, 'C8 背包扣 260');
eq(beastMock.currentCharData.spiritStones, 740, 'C9 charData 镜像同步');
// C10：背包也不够 → 退回 charData 独立路径也拒绝
beastMock.inventory.currency.spiritStones = 10;
var r4 = BT.buyBeast('dragon_turtle');
ok(r4 === false, 'C10 两头都不够则拒');

// D：培养日限计数器已删，精力是唯一闸门
beastMock.tamedBeasts.length = 0;
BT.captureBeast && beastMock.tamedBeasts.push({ templateId: 'wind_wolf', name: '风狼', level: 1, exp: 0, affection: 50, skills: ['风刃'], combatAbilities: [], trait: { id: 'fierce', name: '凶猛', attr: 'strength', mul: 1.12 }, mount: null });
beastMock.currentCharData.energy = 100;
var ok4 = BT.trainBeast(0), ok5 = BT.trainBeast(0), ok6 = BT.trainBeast(0), ok7 = BT.trainBeast(0);
ok(ok4 && ok5 && ok6 && ok7, 'D1 同日第四次培养不再被日限拦下');
eq(beastMock.currentCharData.energy, 80, 'D2 精力=唯一成本闸门（4×5）');
beastMock.currentCharData.energy = 4;
ok(BT.trainBeast(0) === false, 'D3 精力耗尽自然练不动');
var btSrc = loadScript('beast-taming.js');
ok(btSrc.indexOf('_trainCount') < 0 && btSrc.indexOf('今日培养次数已满') < 0, 'D4 日限计数器源码残留归零');
ok(/每日|日限/.test(btSrc) === false || btSrc.indexOf('不设日限') >= 0, 'D5 驭兽无隐藏日计数器');

// ============ E-F：藏经阁口径 ============
var libMock = {
    console: console, Math: Math, JSON: JSON, Object: Object, Array: Array,
    showMessage: function () {},
    timeSystem: { gameTime: { currentDay: 1 }, advanceTime: function () {} },
    inventory: { currency: { spiritStones: 100 } },
    currentCharData: { spiritStones: 100 },
    activeTasks: [],
    discipleState: null,
    COMMON_RANKS: null,
    EventBus: null, StateRegistry: null
};
libMock.window = libMock;
var libCtx = vm.createContext(libMock);
vm.runInContext(loadScript('core/event-bus.js'), libCtx);
vm.runInContext(loadScript('core/state-registry.js'), libCtx);
vm.runInContext(loadScript('sects/sects-deep-data.js'), libCtx);
vm.runInContext(loadScript('sects/sects-system.js'), libCtx);
libMock.EventBus = libCtx.EventBus;
libMock.StateRegistry = libCtx.StateRegistry;
libMock.COMMON_RANKS = libCtx.COMMON_RANKS;

function canAt(rank, tier) {
    libMock.discipleState = { isInSect: true, sectId: '少林寺', rank: rank, rankName: 'x', contribution: 0 };
    return libCtx.canAccessScriptureTier(tier);
}
ok(canAt(2, 4) === true && canAt(2, 3) === true, 'E1 长老可读镇派阁');
ok(canAt(3, 4) === false && canAt(3, 3) === true, 'E2 亲传可读核心阁、不可读镇派阁');
ok(canAt(4, 3) === false && canAt(4, 2) === true, 'E3 内门止步二层');
ok(canAt(5, 2) === false && canAt(5, 1) === true, 'E4 外门止步一层');
ok(canAt(-1, 1) === false && canAt(-2, 4) === false, 'E5 无职位（侍妾/同参）不可入');

// F：面板回退口径（LIB_TIERS.maxRank，无 canAccessScriptureTier 时）与真源全表一致
var libSrc = loadScript('sects/sect-facilities.js');
var t0 = libSrc.indexOf('var LIB_TIERS');
var t1 = libSrc.indexOf('window.getSectArtAttrBonuses');
ok(t0 > 0 && t1 > t0, 'F0 分层配置段可定位');
var libSlice = libSrc.slice(t0, t1);
// 切片内 libToday 调 getFacilityGameDay——测试切片里给它打桩
var fbMock = { console: console, Math: Math, Object: Object, Array: Array, getFacilityGameDay: function () { return 1; } };
fbMock.window = fbMock;
var fbCtx = vm.createContext(fbMock);
vm.runInContext(libSlice + '\n; window.__LIB_TIERS = LIB_TIERS; window.__libTierUnlocked = libTierUnlocked;', fbCtx);
var TIERS = fbMock.window.__LIB_TIERS;
eq(TIERS.length, 4, 'F1 四层俱在');
var TIERS_BY_TIER = {}; TIERS.forEach(function (t) { TIERS_BY_TIER[t.tier] = t; });
eq(TIERS_BY_TIER[3].maxRank, 3, 'F2 核心阁 maxRank=亲传（v20.9 从 4 收紧）');
eq(TIERS_BY_TIER[4].maxRank, 2, 'F3 镇派阁 maxRank=长老（v20.9 从 3 收紧）');
var mismatch = [];
[-2, -1, 0, 1, 2, 3, 4, 5, 6, 7].forEach(function (r) {
    [1, 2, 3, 4].forEach(function (t) {
        fbMock.discipleState = { rank: r };
        if (fbMock.window.__libTierUnlocked(t) !== canAt(r, t)) mismatch.push('rank' + r + '/tier' + t);
    });
});
eq(mismatch.length, 0, 'F4 回退口径与真源全表一致 [' + mismatch.join(',') + ']');

// ============ G：静态接线 ============
ok(/libTierUnlocked\(art\.tier \|\| 1\)/.test(libSrc) && (libSrc.match(/libTierUnlocked/g) || []).length >= 5, 'G1 面板/翻阅/参悟/请抄本全部改走 libTierUnlocked');
ok(libSrc.indexOf("'及以上方可入内") >= 0, 'G2 门禁文案保留');
var appSrc = loadScript('app.js');
var openLib = appSrc.slice(appSrc.indexOf('function openLibrary'), appSrc.indexOf('window.openMedicineShop'));
ok(openLib.indexOf('canAccessScriptureTier') >= 0 && openLib.indexOf('rankId === 3') < 0 && openLib.indexOf("'elder' || role === 'leader'") < 0, 'G3 app.js 复制判断清零，探测走真源');
var bsStart = appSrc.indexOf('function openBeastShop');
var bsSlice = appSrc.slice(bsStart, appSrc.indexOf('function openEnchantShop'));
ok(bsSlice.indexOf('BEAST_SHOP_STOCK') >= 0 && bsSlice.indexOf('buyBeastFromShop') >= 0 && bsSlice.indexOf('showModal') >= 0, 'G4 灵兽坊=真货架面板');
ok(bsSlice.indexOf("switchPanel('beasts')") >= 0, 'G5 缺依赖仍退回面板');
ok(appSrc.indexOf("desc: '驯化幼兽出售'") >= 0, 'G6 建筑卡文案与真购入对齐');
// 面板按钮字符串可在 window 上解析（onclick 全局可达）
ok(typeof beastMock.buyBeastFromShop === 'function' && typeof beastMock.buyBeast === 'function', 'G7 购买函数全局导出');

console.log('v20.9-beast-library: ' + assertions + ' passed, ' + failures.length + ' failed');
if (failures.length) { failures.forEach(function (f) { console.log('  ✗ ' + f); }); process.exit(1); }
