/**
 * wave102-zedi-node.js — 第一百零二波 · 择地而居（一百零三波改定：洞府在野不在城）验收：
 *   用户点账：「距离感还是不够——洞府可以选一个地方来建，从洞府去不同地方耗时不同」；
 *   再点账：「城市里的可不是洞府，洞府应该是在野外……在地图上固定几个位置，方便计算路途。」
 *   A 择山购地：天下洞天七处（每州一座）；买宅可指明山场；老口子传城名认到那州的山；没指明落脚下这州
 *   B 老档归一：一百零二波存的城名、更早的没有坐落——统统认到对应州的洞天，其余分毫不动
 *   C 迁址：现价三成迁址费；同山不迁；查无此山不迁；钱不够不迁
 *   D isAtHome 按州界算：人在本州=在山脚下；人在他州/位面=在外；判不出人在哪儿一律按在家算
 *   E 面板·距离感：人在他州挂黄牌（取道哪座关、几里、几分钟——天下疆界同一本账）；屋里身件事全被拦
 *   F 择山单：七处洞天带州名/危险度/山场记述；你在的那州标出来；他州报关隘路线
 *   G 路引：从洞府下山去各州的关隘路线/里数/脚程；人在本州每州一粒「动身」走 setOut 关隘路
 *   H 哨兵：house-system 老账未动、世界舆图挂 🏠 幡、城市列表不再标家、挂全量回归、无人工计数器
 *
 * 运行：node tests/wave102-zedi-node.js
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
function load(rel) { vm.runInThisContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), { filename: rel }); }
function src(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// ==================== 测试桩 ====================
global.window = global;
var els = {};
function fakeEl(tag) {
    var el = {
        tag: tag || '', children: [], style: {}, parentNode: null, className: '',
        setAttribute: function () {}, getAttribute: function () { return null; },
        appendChild: function (c) { this.children.push(c); return c; },
        removeChild: function () {}, addEventListener: function () {}, removeEventListener: function () {},
        closest: function () { return null; }, scrollIntoView: function () {},
        classList: { add: function () {}, remove: function () {}, toggle: function () {}, contains: function () { return true; } },
        _html: '', textContent: '', options: []
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
    createElementNS: function (ns, tag) { return fakeEl(tag); },
    createElement: function (tag) { return fakeEl(tag); },
    getElementById: function (id) { if (!els[id]) els[id] = fakeEl(); return els[id]; },
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
    addEventListener: function () {},
    body: { appendChild: function () {} }
};
var store = {};
global.localStorage = {
    getItem: function (k) { return store[k] !== undefined ? store[k] : null; },
    setItem: function (k, v) { store[k] = String(v); },
    removeItem: function (k) { delete store[k]; }
};
var msgs = [];
global.showMessage = function (m, t) { msgs.push({ m: String(m), t: t }); };
global.updateCurrencyUI = function () {};
global.updateCharacterStatus = function () {};
global.EventBus = { emit: function () {}, on: function () {} };
var addedItems = [];
global.addItem = function (id, n) { addedItems.push([id, n]); return true; };
global.addItemToInventory = function (id, n) { addedItems.push([id, n]); return true; };
global.growLifeSkill = function () {};
global.addProfessionExp = function () {};
global.getLifeSkill = function () { return 0; };

// 世界日历桩
var _day = 100;
global.getAbsoluteDay = function () { return _day; };
var advanced = [];
global.timeSystem = { advanceTime: function (m, r) { advanced.push([m, r]); }, getAbsoluteDay: function () { return _day; } };

// 人在哪儿：测试拨的当前城
var _cur = '洛水城';
global.locationSystem = { getCurrentLocation: function () { return _cur; } };
// 开野外图的口子：记下动身/回山叫了哪一州
var wildOpens = [];
global.openWildernessMap = function (reg) { wildOpens.push(reg); };

// 背包桩
global.inventory = { currency: { spiritStones: 200000 }, maxSlots: 30, slots: [] };
for (var _i = 0; _i < 8; _i++) global.inventory.slots.push({ templateId: 'mat_lingzhi', count: 2 });

// 打坐时长账（与 app.js CULTIVATE_DURATIONS 同口径）
global.CULTIVATE_DURATIONS = [
    { id: 'short', label: '5分钟', shortLabel: '5m', minutes: 5, multiplier: 1, qiCost: 5 },
    { id: 'half', label: '半小时', shortLabel: '30m', minutes: 30, multiplier: 6.5, qiCost: 20 },
    { id: 'hour', label: '一时辰', shortLabel: '2h', minutes: 120, multiplier: 27, qiCost: 60 },
    { id: 'five_hour', label: '五时辰', shortLabel: '10h', minutes: 600, multiplier: 140, qiCost: 200 },
    { id: 'day', label: '一天', shortLabel: '24h', minutes: 1440, multiplier: 350, qiCost: 400 }
];
global.currentCharData = { qi: 300, energy: 100, health: 100 };
global.MoodSystem = {
    label: function () { return '心平气和'; },
    moodNow: function () { return 62; },
    cultivationMul: function () { return 1.1; },
    cultivationNote: function () { return ''; }
};

load('js/regions.js');          // 天下舆图（mapData / 州名录 / 危险度）
load('js/map/world-map.js');    // 天下疆界（关隘/里数/时辰/取道路线——回府与动身走这本账）
load('js/house-system.js');
load('js/house-panel.js');

var HP = global.HousePanelUI;
function renderPanel() {
    var c = fakeEl('div'), s = fakeEl('div');
    HP.render(c, s);
    return { html: c.innerHTML, shopHtml: s.innerHTML, container: c };
}
function resetHouse() { importHouseState(null); }
function giveHouse(siteId) {
    importHouseState({ type: 'cave', upgrades: {}, furniture: [], planted: [], storageApplied: 10, location: siteId });
}

// ==================== A · 择山购地 ====================
console.log('\n[A] 择山购地：天下洞天七处，洞府扎在野外的山里');
resetHouse();
var stones0 = global.inventory.currency.spiritStones;
eq(buyHouse('cave', 'wuyu'), true, 'A1 指明雾屿岛购地成功');
eq(global.playerHouse.location, 'wuyu', 'A2 宅基落账：坐落雾屿岛');
eq(getHouseSite().region, '东南海域', 'A3 洞天带州籍（雾屿岛属东南海域）');
eq(global.inventory.currency.spiritStones, stones0 - 1000, 'A4 宅价照旧账扣（1000灵石，v20.44 H1 口径未动）');
resetHouse();
buyHouse('cave', '青木城');
eq(global.playerHouse.location, 'canglin', 'A5 老口子传城名也认——青木城属东荒，宅基落苍林深谷');
resetHouse();
eq(buyHouse('cave', '蓬莱仙岛'), true, 'A6 传的是东荒的海上仙岛名——认到东荒的山');
eq(global.playerHouse.location, 'canglin', 'A7 落账苍林深谷');
resetHouse();
buyHouse('cave');
eq(global.playerHouse.location, 'taixu', 'A8 没指明山场——人在洛水城（中州），宅基落太虚山麓');
_cur = null;
resetHouse();
buyHouse('cave');
eq(global.playerHouse.location, 'taixu', 'A9 判不出人在哪儿——落太虚山麓（天下之中）');
_cur = '洛水城';

// ==================== B · 老档归一 ====================
console.log('\n[B] 老档归一：城名坐落认到州里的洞天，旧账分毫不动');
importHouseState({ type: 'cave', upgrades: {}, furniture: ['mat'], planted: [], storageApplied: 10, location: '帝都 · 长安' });
eq(global.playerHouse.location, 'taixu', 'B1 一百零二波存的城名（长安）——认到中州的洞天');
assert(global.playerHouse.furniture.indexOf('mat') >= 0, 'B2 归一只认坐落，家具旧账分毫不动');
_cur = '金城';
importHouseState({ type: 'courtyard', upgrades: {}, furniture: [], planted: [], storageApplied: 20 });
eq(global.playerHouse.location, 'yumen', 'B3 更早的档没有坐落——人在金城（西漠），认到玉门隐峡');
_cur = '洛水城';
store['xianxia_house'] = JSON.stringify({ type: 'cave', upgrades: {}, furniture: [], planted: [], storageApplied: 10 });
initHouseSystem();
eq(global.playerHouse.location, 'taixu', 'B4 initHouseSystem 读出的老档同样归一（人在中州落太虚山麓）');

// ==================== C · 迁址 ====================
console.log('\n[C] 迁址：拆阵搬田都是钱——现价三成，灵植法宝收移一株不损');
giveHouse('taixu');
var stonesC = global.inventory.currency.spiritStones;
eq(relocateHouse('hanshuang'), true, 'C1 迁去寒霜崖窟成功');
eq(global.playerHouse.location, 'hanshuang', 'C2 坐落改账');
eq(global.inventory.currency.spiritStones, stonesC - 300, 'C3 迁址费=简易洞府现价1000的三成（300灵石）');
eq(relocateHouse('hanshuang'), false, 'C4 已经坐在寒霜崖窟——同山不迁');
eq(relocateHouse('查无此山'), false, 'C5 天下洞天就七处——查无此山不迁');
global.inventory.currency.spiritStones = 10;
eq(relocateHouse('wuyu'), false, 'C6 灵石不够不迁');
global.inventory.currency.spiritStones = 200000;
resetHouse();
eq(relocateHouse('wuyu'), false, 'C7 没宅子迁什么址');

// ==================== D · isAtHome（按州界算） ====================
console.log('\n[D] 人在不在家：同州=在山脚下，他州/位面=在外，判不出=不拦');
giveHouse('taixu');
_cur = '洛水城';
eq(isAtHome(), true, 'D1 人在洛水城（中州），宅在太虚山麓（中州）——同州算在家');
_cur = '帝都 · 长安';
eq(isAtHome(), true, 'D2 长安也在中州——州内城乡都算山脚下');
_cur = '青木城';
eq(isAtHome(), false, 'D3 人在东荒——宅在中州的山里，不在家');
_cur = '灵界·蓬莱仙境';
eq(isAtHome(), false, 'D4 人在灵界——更不在家');
_cur = null;
eq(isAtHome(), true, 'D5 判不出人在哪儿——按在家算（老沙箱不拦人）');
resetHouse();
eq(isAtHome(), true, 'D6 没宅子的人无所谓在不在家');
_cur = '洛水城';

// ==================== E · 面板·距离感 ====================
console.log('\n[E] 面板：人在他州挂黄牌——取道哪座关、几里、几分钟，屋里身件事全被拦');
giveHouse('taixu');
_cur = '青木城';   // 人在东荒
HP.selectTab('jing');
var rE = renderPanel();
assert(rE.html.indexOf('你人在东荒地界') >= 0 && rE.html.indexOf('中州 · 太虚山麓') >= 0, 'E1 黄牌报清两头：人在东荒，宅在中州太虚山麓');
assert(rE.html.indexOf('取道青木官道') >= 0 && rE.html.indexOf('240 里') >= 0 && rE.html.indexOf('480 分钟') >= 0, 'E2 回府路账=疆界关隘账（东荒↔中州青木官道240里，60里≈两个时辰）');
assert(rE.html.indexOf('HousePanelUI._goHome()') >= 0, 'E3 黄牌上挂着回府钮');
eq((rE.html.match(/cultivationMeditate\(/g) || []).length, 0, 'E4 人在他州——打坐钮按不动（一个都不给点）');
assert((rE.html.match(/HousePanelUI\._away\(\)/g) || []).length >= 5, 'E5 打坐五档+突破/引导/闭关/洒扫全换成「先回府」的提醒');
wildOpens.length = 0;
HP._goHome();
eq(wildOpens[0], '中州', 'E6 回府=走疆界的关隘路（东荒↔中州接壤，直接过关开中州山河）');
assert(advanced.some(function (a) { return a[0] === 480; }), 'E7 过关真结时辰账（240里=480分钟进了世界钟）');
assert(rE.html.indexOf('📍 坐落：中州 · 太虚山麓（野外的山场，不在城里）') >= 0, 'E8 门牌报坐落——明说是野外的山场');
_cur = '洛水城';   // 回中州了
var rE9 = renderPanel();
eq((rE9.html.match(/cultivationMeditate\(/g) || []).length, 5, 'E9 回了本州——打坐五档全亮回来');
assert(rE9.html.indexOf('人在中州地界') >= 0 && rE9.html.indexOf('出城上山便到家') >= 0, 'E10 同州挂绿牌：出城上山便到家');
assert(rE9.html.indexOf('HousePanelUI._away()') < 0, 'E11 在家没有一个钮被拦');

// ==================== F · 择山单 ====================
console.log('\n[F] 择山单：七处洞天带州名/危险度/山场记述');
resetHouse();
_cur = '洛水城';
var rF0 = renderPanel();
eq((rF0.html.match(/HousePanelUI\._pickSite\('buy'/g) || []).length, 4, 'F1 置产铺子四档宅子都带「择山购地」');
eq((rF0.html.match(/buyHouse\(/g) || []).length, 4, 'F2 急着落脚的「就建在脚下这座山」照旧一键（第一百零一波 A3 口径保住）');
assert(rF0.html.indexOf('就建在脚下这座山（中州 · 太虚山麓）') >= 0, 'F3 就近置办报的是脚下这州的山');
HP._pickSite('buy', 'cave');
var rF = renderPanel();
assert(rF.html.indexOf('择一处山场') >= 0 && rF.html.indexOf('就建这儿') >= 0, 'F4 择山单开出来：标题+落槌钮');
['太虚山麓', '苍林深谷', '丹霞洞天', '玉门隐峡', '寒霜崖窟', '青城后山', '雾屿岛'].forEach(function (nm) {
    assert(rF.html.indexOf(nm) >= 0, 'F5 七处洞天都在单上（' + nm + '）');
});
assert(rF.html.indexOf('洞府建在野外的山里，不在城中') >= 0, 'F6 单头把话说明：洞府在野不在城');
assert(rF.html.indexOf('你就在此州') >= 0, 'F7 你所在的州标出来（人在中州）');
assert(rF.html.indexOf('接壤，走青木官道（240 里 · 约 480 分钟）') >= 0, 'F8 接壤的州报关隘路线（东荒苍林深谷）');
assert(rF.html.indexOf('须取道') >= 0, 'F9 不接壤的州说要一站一站走（须取道）');
assert(rF.html.indexOf('灵界') < 0 && rF.html.indexOf('魔界') < 0, 'F10 位面不上单——不是脚力能到的地方');
HP._siteConfirm('wuyu');
eq(global.playerHouse && global.playerHouse.location, 'wuyu', 'F11 落槌雾屿岛——宅基真落在选中的山');
HP._pickSite('relocate', '');
var rF12 = renderPanel();
assert(rF12.html.indexOf('迁址') >= 0 && rF12.html.indexOf('迁址费 300 灵石') >= 0, 'F12 迁址单把价钱说在前头（三成迁址费）');
assert(rF12.html.indexOf('已在') >= 0 && rF12.html.indexOf('一株不损') >= 0, 'F13 现坐落标「已在」；灵植法宝收移的实话写在单上');
HP._cancelSite();
var rF14 = renderPanel();
assert(rF14.html.indexOf('📍 坐落：东南海域 · 雾屿岛') >= 0, 'F14 再想想——收起择山单回到宅子页');

// ==================== G · 路引 ====================
console.log('\n[G] 路引：从洞府下山，各州脚程一目了然');
_cur = '鲛人镇';   // 人在东南海域——在宅子本州
HP._toggleRoads();
var rG = renderPanel();
assert(rG.html.indexOf('路引') >= 0 && rG.html.indexOf('从「东南海域 · 雾屿岛」下山出门') >= 0, 'G1 路引挂出门牌');
assert(rG.html.indexOf('蓬莱渡海 → 青木官道') >= 0 && rG.html.indexOf('440 里') >= 0 && rG.html.indexOf('880 分钟') >= 0, 'G2 隔州的路按关隘账拼（雾屿岛→中州：渡海200里+官道240里=440里880分钟）');
eq((rG.html.match(/HousePanelUI\._depart\(/g) || []).length, 6, 'G3 其余六州每州一粒动身钮');
wildOpens.length = 0;
HP._depart('东荒');
eq(wildOpens[0], '东荒', 'G4 人在本州点动身——接壤的州直接过关开山河（疆界账原样接住）');
_cur = '洛水城';   // 人在中州，宅在东南海域
var rG5 = renderPanel();
assert(rG5.html.indexOf('人在外') >= 0, 'G5 人在他州——动身钮如实说「人在外」（先回府才走得了）');
HP._toggleRoads();

// ==================== H · 哨兵 ====================
console.log('\n[H] 哨兵：老账未动、舆图挂家、城市列表退标、挂名、无人工计数器');
var hsSrc = src('js/house-system.js');
var hpSrc = src('js/house-panel.js');
var appSrc = src('js/app.js');
var wmSrc = src('js/map/world-map.js');
assert(hsSrc.indexOf('openCaveWorksUI()') >= 0, 'H1 house-system 老账未动（v23.0 A14 哨兵保住）');
assert(hsSrc.indexOf('function getHouseStatusHtml') >= 0, 'H2 老面板函数还在（兜底路没拆）');
assert(hsSrc.indexOf('第一百零三波') >= 0 && hpSrc.indexOf('一百零三波') >= 0, 'H3 引擎与面板都挂着改定波的号');
assert(wmSrc.indexOf('drawCaveMarkers') >= 0 && wmSrc.indexOf('🏠') >= 0, 'H4 世界舆图给洞府所在州挂 🏠 幡（与山门幡同一套路）');
assert(wmSrc.indexOf('drawCaveMarkers(doc, svg);') >= 0, 'H5 🏠 幡挂在 refresh 链上（开图就画）');
assert(appSrc.indexOf('_houseCityNorm') < 0, 'H6 城市列表不再标家（洞府不在城里）');
var runAll = src('tests/run-all.sh');
assert(runAll.indexOf('wave102-zedi-node.js') >= 0, 'H7 本套已挂全量回归');
['每日限', '次数已用完'].forEach(function (kw) {
    assert(hpSrc.indexOf(kw) < 0 && hsSrc.indexOf(kw) < 0, 'H8 无人工计数器口径「' + kw + '」');
});
assert(hsSrc.indexOf('price: 1000') >= 0 && hsSrc.indexOf('price: 100000') >= 0, 'H9 四档宅价一分未动（1000/5000/20000/100000）');
eq(Object.keys(global.CAVE_SITES).length, 7, 'H10 天下洞天就七处（每州一座，不多不少）');

console.log('\n========== wave102(改定) 结果：' + passed + ' 通过 / ' + failed + ' 失败 ==========');
if (failed > 0) process.exit(1);
