/**
 * v20.17-buildings-node.js — 城市建筑全线接通
 *
 * 覆盖：
 *   A 卡面全覆盖：每城清单里每一处设施都有建筑卡面定义（此前 19 种在城中根本显示不出来）
 *   B 点击路由：城清单全部设施 id 逐一点击，永不抛错（含旧栈溢出回归锁）；
 *     情景设施走情境弹窗、七衙门走各府衙实现、老建筑走各自既有路由
 *   C 回弹断开：未知建筑调建筑界面不再互相回弹（旧代码 useBuilding↔openBuildingUI 死循环）
 *   D 七衙不白送：税课司/粮仓/镇邪司气力不足如实拒绝、动手必耗真气；
 *     工曹署/盐铁局样板行为不回归；情境设施 12 处注册齐全
 *   E 静态：回弹分支已删、死按钮已除、衙门分类与描述齐全、衙门成本在案
 *
 * 运行：node tests/v20.17-buildings-node.js
 */
'use strict';

var path = require('path');
var fs = require('fs');
var vm = require('vm');

var passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) passed++;
    else { failed++; console.error('[FAIL] ' + msg); }
}

function fakeEl() {
    var el = {
        style: {}, classList: { add: function () {}, remove: function () {}, toggle: function () {} },
        children: [], appendChild: function (c) { el.children.push(c); return c; },
        querySelector: function () { return null; }, querySelectorAll: function () { return []; },
        addEventListener: function () {}, focus: function () {}, remove: function () {},
        setAttribute: function () {}, insertAdjacentHTML: function () {},
        innerHTML: '', textContent: '', className: '', id: ''
    };
    return el;
}

// ==================== 主世界桩 ====================
var toasts = [];
var logs = [];
var advCalls = [];
var calls = {};   // 点击捕获表：函数名 → 调用次数与最近参数
function capture(name) {
    return function () {
        calls[name] = (calls[name] || 0) + 1;
        calls[name + ':lastArg'] = arguments.length ? arguments[0] : undefined;
    };
}

var SCENARIO_IDS = ['money_house', 'contract_hall', 'escort_office', 'charity_hall',
    'arena_stage', 'observatory', 'stele_forest', 'oddity_museum', 'pawn_shop',
    'auction_house', 'black_market', 'garden_villa'];
var OFFICE_IDS = ['tax_bureau', 'granary', 'court', 'exorcist_bureau',
    'medical_clinic', 'works_bureau', 'salt_iron_office'];
var NEW_IDS = SCENARIO_IDS.concat(OFFICE_IDS);

var mockWindow = {
    console: { log: function () {}, warn: function () {}, error: function () {} },
    JSON: JSON, Object: Object, Array: Array, Math: Math, Number: Number,
    isFinite: isFinite, Date: Date, String: String, setTimeout: function () { return 0; }, clearTimeout: function () {},
    addEventListener: function () {},
    gameLog: { entries: [], add: function (m, t) { logs.push(String(m)); } },
    showMessage: function (m) { toasts.push(String(m)); },
    currentCharData: { name: '测', realm: '炼气', layer: 3, qi: 100, tempering: 0, flags: {} },
    timeSystem: { advanceTime: function (m, r) { advCalls.push({ mins: m, reason: String(r || '') }); } },
    getRealmTier: function () { return 1; },
    XianXia: { DataManager: {
        getCopper: function () { return 500; },
        getSpiritStones: function () { return 500; },
        deductCopper: function () { return true; }, deductSpiritStones: function () { return true; }
    } },
    localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
    document: {
        readyState: 'complete', addEventListener: function () {},
        getElementById: function () { return null; }, createElement: function () { return fakeEl(); },
        querySelector: function () { return null; }, querySelectorAll: function () { return []; },
        body: fakeEl()
    },
    // 情境引擎桩（真实内容在情境模块，本测试考的是"门有没有接上"）
    scenarioEngine: { facilities: {} },
    openFacilityScenario: capture('openFacilityScenario'),
    openScenarioPanel: capture('openScenarioPanel'),
    // 各建筑既有实现的桩
    openCityShop: capture('openCityShop'),
    openEnhancementHall: capture('openEnhancementHall'),
    switchPanel: capture('switchPanel'),
    visitTeaHouse: capture('visitTeaHouse'),
    openGuildHall: capture('openGuildHall'),
    openLibrary: capture('openLibrary'),
    startBattle: capture('startBattle'),
    gatherHerbs: capture('gatherHerbs'),
    mineOre: capture('mineOre'),
    openHouseholdRegistry: capture('openHouseholdRegistry'),
    openFireDepartment: capture('openFireDepartment'),
    openBountyHall: capture('openBountyHall'),
    openTaxBureau: capture('openTaxBureau'),
    openGranary: capture('openGranary'),
    openCourt: capture('openCourt'),
    openExorcistBureau: capture('openExorcistBureau'),
    openMedicalClinic: capture('openMedicalClinic'),
    openWorksBureau: capture('openWorksBureau'),
    openSaltIronOffice: capture('openSaltIronOffice')
};
SCENARIO_IDS.forEach(function (id) { mockWindow.scenarioEngine.facilities[id] = { name: id, scenarios: [] }; });
mockWindow.window = mockWindow;
mockWindow.global = mockWindow;
// 防双击护栏用 Date.now：测试连点要拨过 600ms 护栏窗口。
// 本测试进程内真实 Date.now 只被沙箱防双击消费，直接加偏移最干净（new Date 等构造不受影响）
var clockOffset = 0;
var realNow = Date.now;
Date.now = function () { return realNow() + clockOffset; };
function unbypassGuard() { clockOffset += 700; }

var ctx = vm.createContext(mockWindow);
function load(rel) { vm.runInContext(fs.readFileSync(path.resolve(__dirname, '..', rel), 'utf8'), ctx); }
load('js/building-effects.js');
load('js/location-system.js');

var LS = mockWindow.locationSystem;
assert(!!LS && !!LS.BUILDING_TYPES && !!LS.cityData, 'LS location-system 就位');

// ============ A: 卡面全覆盖 ============
var typeIds = {};
Object.keys(LS.BUILDING_TYPES).forEach(function (k) { typeIds[LS.BUILDING_TYPES[k].id] = 1; });
var missing = [];
var allCityIds = {};
Object.keys(LS.cityData).forEach(function (city) {
    (LS.cityData[city].buildings || []).forEach(function (bid) {
        allCityIds[bid] = 1;
        if (!typeIds[bid]) missing.push(city + ':' + bid);
    });
});
assert(missing.length === 0, 'A1 每城设施清单里的每一处都有卡面定义，列多少挂多少（缺失: ' + missing.slice(0, 5).join(', ') + '）');
var newMissing = NEW_IDS.filter(function (id) { return !typeIds[id]; });
assert(newMissing.length === 0, 'A2 v20.17 新挂 19 种设施卡面齐备（缺: ' + newMissing.join(',') + '）');
var officeCount = Object.keys(LS.BUILDING_TYPES).filter(function (k) { return LS.BUILDING_TYPES[k].category === 'office'; }).length;
assert(officeCount >= 7, 'A3 七衙门单列"衙门"分类（实际 ' + officeCount + ' 种）');

// ============ B: 全量点击永不炸 + 路由正确 ============
var allIds = Object.keys(allCityIds);
var errs = [];
allIds.forEach(function (id) {
    calls = {};
    try { LS.useBuilding(id); }
    catch (e) { errs.push(id + ' → ' + (e instanceof RangeError ? 'STACK-OVERFLOW(互弹复发!) ' : '') + e.message); }
});
assert(errs.length === 0, 'B1 全部 ' + allIds.length + ' 种设施逐一点击，无一抛错（错误: ' + errs.slice(0, 3).join(' / ') + '）');

calls = {}; unbypassGuard(); LS.useBuilding('money_house');
assert(calls.openFacilityScenario === 1 && calls['openFacilityScenario:lastArg'] === 'money_house',
    'B2 情景设施点击直达情境弹窗（钱庄）');
calls = {}; unbypassGuard(); LS.useBuilding('salt_iron_office');
assert(calls.openSaltIronOffice === 1, 'B3 七衙门点击直达府衙实现（盐铁局）');
calls = {}; unbypassGuard(); LS.useBuilding('tax_bureau');
assert(calls.openTaxBureau === 1, 'B4 税课司点击直达');
calls = {}; unbypassGuard(); LS.useBuilding('shop');
assert(calls.openCityShop === 1, 'B5 老坊市路由不回归');
calls = {}; unbypassGuard(); LS.useBuilding('household_registry');
assert(calls.openHouseholdRegistry === 1, 'B6 情境交互三司路由不回归（户籍司）');
calls = {}; unbypassGuard(); LS.useBuilding('inn');
assert(!calls.openFacilityScenario && !toasts.join('|').match(/栈|溢出/), 'B7 客栈走建筑效果自有路径，不经情境弹窗');

// ============ C: 回弹断开 ============
var ubCalls = 0;
var origUB = LS.useBuilding;
mockWindow.locationSystem.useBuilding = function () { ubCalls++; return origUB.apply(this, arguments); };
var toastBase = toasts.length;
mockWindow.buildingEffects.openBuildingUI('nonexistent_hall');
assert(ubCalls === 0, 'C1 未知建筑不再回弹 useBuilding（旧代码此处无限互跳至栈溢出）');
assert(toasts.length === toastBase + 1 && toasts[toasts.length - 1].indexOf('暂无可为') >= 0,
    'C2 未知建筑如实播报"且往别处看看"，不再无声无息');
ubCalls = 0;
mockWindow.buildingEffects.openBuildingUI('inn');
assert(ubCalls === 0, 'C3 在册建筑走自有效果，同样不回弹');
mockWindow.locationSystem.useBuilding = origUB;

// ============ D: 七衙不白送 + 情境注册齐全 ===================
var appSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'app.js'), 'utf8');
function extractFn(src, name) {
    var head = 'function ' + name + '(';
    var i = src.indexOf(head);
    if (i < 0) return null;
    var j = src.indexOf('{', i), depth = 0, k = j;
    for (; k < src.length; k++) {
        if (src[k] === '{') depth++;
        else if (src[k] === '}') { depth--; if (depth === 0) break; }
    }
    return src.slice(i, k + 1);
}

function officeCtx(player) {
    var w = {
        console: { log: function () {}, warn: function () {} },
        JSON: JSON, Object: Object, Array: Array, Math: Math, Number: Number, String: String, isFinite: isFinite, Date: Date,
        currentCharData: player,
        gameLog: { add: function (m) { (w._log = w._log || []).push(String(m)); } },
        timeSystem: { advanceTime: function () {} },
        showMessage: function (m) { (w._log = w._log || []).push(String(m)); }
    };
    w.window = w;
    return vm.createContext(w);
}
function gateTest(fnName, expectGain) {
    var src = extractFn(appSrc, fnName);
    assert(!!src, fnName + ' 源码可提取');
    // 气力不足 → 拒
    var poor = { qi: 5, tempering: 0 };
    var c1 = officeCtx(poor);
    vm.runInContext(src + '\n' + fnName + '();', c1);
    var poorLog = (c1.window._log || []).join('|');
    assert(poor.tempering === 0 && poor.qi === 5 && poorLog.indexOf('改日再来') >= 0,
        fnName + ' 真气不济如实拒绝：历练分文不涨（' + poorLog.slice(0, 30) + '）');
    // 气力足 → 扣 10 真气换有限历练
    var rich = { qi: 50, tempering: 0 };
    var c2 = officeCtx(rich);
    vm.runInContext(src + '\n' + fnName + '();', c2);
    assert(rich.qi === 40 && rich.tempering >= expectGain[0] && rich.tempering <= expectGain[1],
        fnName + ' 动手必耗 10 真气，历练 +' + rich.tempering + ' 落在 [' + expectGain + '] 内');
}
gateTest('openTaxBureau', [5, 5]);
gateTest('openGranary', [3, 3]);
gateTest('openExorcistBureau', [5, 10]);

// 工曹署样板行为不回归（真实加载 facility-batch2，桩掉情境引擎注册表）
var b2Window = {
    console: { log: function () {}, warn: function () {} },
    JSON: JSON, Object: Object, Array: Array, Math: Math, Number: Number, String: String, isFinite: isFinite, Date: Date,
    gameLog: { add: function () {} },
    showMessage: function () {},
    timeSystem: { advanceTime: function () {} },
    currentCharData: { qi: 5, tempering: 0 },
    scenarioEngine: { register: function (id, cfg) { b2Window._reg = b2Window._reg || {}; b2Window._reg[id] = cfg; } },
    document: { readyState: 'complete', addEventListener: function () {}, getElementById: function () { return null; },
        createElement: function () { return fakeEl(); }, querySelector: function () { return null; }, body: fakeEl() }
};
b2Window.window = b2Window;
var b2Ctx = vm.createContext(b2Window);
vm.runInContext(fs.readFileSync(path.resolve(__dirname, '..', 'js', 'city-facilities', 'facility-batch2.js'), 'utf8'), b2Ctx);
var regIds = Object.keys(b2Window._reg || {});
var scenMissing = SCENARIO_IDS.filter(function (id) { return regIds.indexOf(id) < 0; });
assert(scenMissing.length === 0, 'D1 情境引擎 12 处设施注册齐全，点击即有内容（缺: ' + scenMissing.join(',') + '）');
b2Window.currentCharData = { qi: 5, tempering: 0 };
vm.runInContext('openWorksBureau();', b2Ctx);
assert(b2Window.currentCharData.tempering === 0, 'D2 工曹署样板：气力不足分文不给（既有规矩不回归）');
b2Window.currentCharData = { qi: 50, tempering: 0 };
vm.runInContext('openWorksBureau();', b2Ctx);
assert(b2Window.currentCharData.qi === 40 && b2Window.currentCharData.tempering === 3,
    'D3 工曹署样板：扣 10 真气换历练 +3 照旧');

// ============ E: 静态 ============
var beSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'building-effects.js'), 'utf8');
assert(beSrc.indexOf('locationSystem.useBuilding') < 0, 'E1 建筑界面源码里回弹调用已根除');
var lsSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'location-system.js'), 'utf8');
assert(lsSrc.indexOf('🔍 深入') < 0 && lsSrc.indexOf('openScenarioPanel(') < 0,
    'E2 从未显示过的"深入"死按钮已摘除，只留单一使用入口');
assert(lsSrc.indexOf("office: '🏛️ 衙门'") >= 0 || lsSrc.indexOf('衙门') >= 0, 'E3 衙门分类挂牌');
assert(lsSrc.indexOf("officialOffices") >= 0 && lsSrc.indexOf('openFacilityScenario') >= 0,
    'E4 七衙门路由表与情景设施动态路由双双在案');
var descOk = NEW_IDS.every(function (id) { return lsSrc.indexOf("'" + id + "': '") >= 0; });
assert(descOk, 'E5 新挂 19 种设施均有卡面描述（不做无名招牌）');
var taxSrc = extractFn(appSrc, 'openTaxBureau') + extractFn(appSrc, 'openGranary') + extractFn(appSrc, 'openExorcistBureau');
assert((taxSrc.match(/\(player\.qi \|\| 0\) < 10/g) || []).length === 3 &&
    (taxSrc.match(/player\.qi -= 10/g) || []).length === 3,
    'E6 三衙成本改动在案（气力门槛 + 扣减成对，杜绝只涨不回）');

console.log('v20.17 buildings: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
