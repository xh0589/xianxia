/**
 * wave104-shanju-node.js — 第一百零四波 · 山居营造 验收：
 *   用户点账：「幻想自己是玩家，想在洞府里干各种事……这些东西都是要材料修的，最开始只有破山洞。」
 *   A 占山：破山洞免费领——灵田一畦、储物五格、修炼不加成一分；占两处不行
 *   B 修缮图样：一级一级修（灵石补差价+工料真扣+工期真耗时）；材料不齐不动工；跳级不修
 *   C 设施工料单：十二处设施每处一份材料账；安置先点工料——不齐不动工、落位才耗料；加成接真账
 *   D 面板：占山卡、破山洞的冷落（阵工坊插不住旗）、静室睁眼见图样、修缮扩建钮
 *   E 哨兵：老账未动、宅价未动、旧购宅路照走、挂全量回归、无人工计数器
 *
 * 运行：node tests/wave104-shanju-node.js
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
function near(a, b, msg) { assert(Math.abs(a - b) < 1e-9, msg + '（实际=' + a + ' 期望≈' + b + '）'); }
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
        removeChild: function () {}, remove: function () {}, addEventListener: function () {}, removeEventListener: function () {},
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

var _day = 100;
global.getAbsoluteDay = function () { return _day; };
var advanced = [];
global.timeSystem = { advanceTime: function (m, r) { advanced.push([m, r]); }, getAbsoluteDay: function () { return _day; } };

var _cur = '洛水城';
global.locationSystem = { getCurrentLocation: function () { return _cur; } };
global.openWildernessMap = function () {};

global.inventory = { currency: { spiritStones: 200000 }, maxSlots: 30, slots: [] };
for (var _i = 0; _i < 8; _i++) global.inventory.slots.push({ templateId: 'mat_lingzhi', count: 2 });
function give(itemId, count) { global.inventory.slots.push({ itemId: itemId, templateId: itemId, count: count }); }
function matCount(itemId) {
    var c = 0;
    global.inventory.slots.forEach(function (s) { if (s && s.templateId === itemId) c += s.count; });
    return c;
}

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

load('js/regions.js');
load('js/map/world-map.js');
load('js/house-system.js');
load('js/extensions/cave-facilities.js');
load('js/crafting/compound-ui.js');
load('js/house-panel.js');

var HP = global.HousePanelUI;
function renderPanel() {
    var c = fakeEl('div'), s = fakeEl('div');
    HP.render(c, s);
    return { html: c.innerHTML, shopHtml: s.innerHTML, container: c };
}
function resetHouse() { importHouseState(null); }

// ==================== A · 占山 ====================
console.log('\n[A] 占山：最开始只有破山洞——免费的，也是寒酸的');
resetHouse();
eq(claimRuin(), true, 'A1 占山成功——破山洞是免费的');
eq(global.playerHouse.type, 'ruin', 'A2 宅型落账：破山洞');
eq(global.playerHouse.location, 'taixu', 'A3 宅基落在脚下这州的山里（人在洛水城→中州太虚山麓）');
eq(claimRuin(), false, 'A4 占两处山没意义——第二次被如实拦下');
eq(global.inventory.maxSlots, 35, 'A5 储物五格真入账（30→35）');
eq(getHousePlotSlots(), 1, 'A6 灵田就一畦');
near(getHouseBonus('cultivation'), 1.05, 'A7 破山洞底子不加成一分——倍率里只有太虚中脉的+5%（第一百零六波地脉入账）');
assert(src('js/core/world-loop.js').indexOf("ruin: 'ruin_cave'") >= 0, 'A8 日结把破山洞认到 0 设施位那一档');
eq(global.CaveFacilities.CAVE_LEVELS['ruin_cave'].slots, 0, 'A9 破山洞 0 设施位——修缮起来才有地方安置');

// ==================== B · 修缮图样 ====================
console.log('\n[B] 修缮图样：灵石+工料+工期，一级一级修，不许跳');
var r0 = getRepairRecipe('ruin');
assert(r0 && r0.target === 'cave', 'B1 破山洞的下一张图样：修成简易洞府');
eq(repairHouse('courtyard'), false, 'B2 跳级不修——庭院图样是从简易洞府修起的');
assert(msgs[msgs.length - 1].m.indexOf('一级一级') >= 0, 'B3 拦得明白：修缮得一级一级来');
msgs.length = 0;
eq(repairHouse('cave'), false, 'B4 工料不齐不动工（木材铁矿石都没有）');
assert(msgs[msgs.length - 1].m.indexOf('工料不齐') >= 0 && msgs[msgs.length - 1].m.indexOf('木材 0/20') >= 0, 'B5 缺什么、缺几个，报得清清楚楚');
give('mat_wood', 20); give('mat_iron_ore', 10);
var stonesB = global.inventory.currency.spiritStones;
advanced.length = 0;
eq(repairHouse('cave'), true, 'B6 工料齐了——动工！');
eq(global.playerHouse.type, 'cave', 'B7 修成简易洞府');
eq(global.inventory.currency.spiritStones, stonesB - 300, 'B8 灵石真扣（修缮 300，比买现成的 1000 便宜——力气换的钱）');
eq(matCount('mat_wood'), 0, 'B9 木材二十根真耗掉');
eq(matCount('mat_iron_ore'), 0, 'B10 铁矿石十块真耗掉');
assert(advanced.some(function (a) { return a[0] === 240 && a[1] === '修缮洞府'; }), 'B11 工期真耗时（四个时辰进了世界钟）');
eq(global.playerHouse.location, 'taixu', 'B12 修缮不挪窝——宅基还在太虚山麓');
give('mat_spirit_wood', 5); give('mat_refined_iron', 5);
eq(repairHouse('courtyard'), true, 'B13 再修一级：庭院洞府（灵木5+精铁5+灵石4000）');
eq(global.playerHouse.type, 'courtyard', 'B14 落账庭院');
var chain = ['ruin', 'cave', 'courtyard', 'mansion', 'palace'];
var chainOk = chain.slice(0, 4).every(function (from, i) {
    var rec = getRepairRecipe(from);
    return rec && rec.target === chain[i + 1];
});
assert(chainOk && getRepairRecipe('palace') === null, 'B15 图样链一级扣一级（破山洞→洞府→庭院→庄园→仙府），顶配没有下一张');

// ==================== C · 设施工料单 ====================
console.log('\n[C] 设施工料单：安置先点料——不齐不动工，落位才耗料');
var FAC = global.CaveFacilities.FACILITIES;
eq(Object.keys(FAC).length, 12, 'C1 设施账十二处（老八处+新四处）');
['fac_weapon_rack', 'fac_field_bell', 'fac_spring_bath', 'fac_tea_stove'].forEach(function (fid) {
    assert(FAC[fid] && (FAC[fid].materials || []).length > 0, 'C2 新设施在账带工料单（' + (FAC[fid] ? FAC[fid].name : fid) + '）');
});
assert(Object.keys(FAC).every(function (fid) { return (FAC[fid].materials || []).length > 0; }), 'C3 十二处设施每处都要材料（没有白来的）');
global.CaveFacilities.ensureCave('player', 'stone_room');   // 庭院=石室 2 设施位
var stonesC = global.inventory.currency.spiritStones;
msgs.length = 0;
window._caveInstall('fac_field_bell');
eq(global.CaveFacilities.getFacilities('player').length, 0, 'C4 材料不齐——安置不动工（田钟要木材6铜矿2）');
assert(msgs[msgs.length - 1].m.indexOf('工料不齐') >= 0, 'C5 缺料报得明白');
eq(global.inventory.currency.spiritStones, stonesC, 'C6 没动工就不收工料费（灵石一分未动）');
give('mat_wood', 6); give('mat_copper_ore', 2);
advanced.length = 0;
window._caveInstall('fac_field_bell');
eq(global.CaveFacilities.getFacilities('player').length, 1, 'C7 料齐动工——田钟安置落位');
eq(matCount('mat_wood'), 0, 'C8 木材真耗掉');
eq(global.inventory.currency.spiritStones, stonesC - 200, 'C9 工料费 200 灵石真扣');
assert(advanced.some(function (a) { return a[0] === 120; }), 'C10 工期两个时辰真耗时');
eq(global.CaveFacilities.getBuff('player', 'fieldSpeedPct'), 10, 'C11 田钟的账是真的（灵田提速10%进了设施账）');
give('mat_refined_iron', 4); give('mat_wood', 6);
window._caveInstall('fac_weapon_rack');
near(getHouseBonus('forging'), 1.08, 'C12 兵器架的账是真的（炼器+8 真算进洞府加成）');
near(getHouseBonus('cultivation'), 1.2 * (1 + (5 + 0) / 100) * 1.05, 'C13 兵器架的修炼+5% 也真算（庭院1.2×架1.05×中脉1.05——第一百零六波地脉入账）');
global.CaveFacilities.uninstall('player', 1);                      // 石室就两个位——腾一位挂浴池验省力账
global.CaveFacilities.install('player', 'fac_spring_bath');        // 引擎落位口照旧免费（材料账在安置口结）
eq(global.CaveFacilities.getBuff('player', 'cleanDiscount'), 8, 'C14 灵泉浴池的省力账在设施账上');
global.currentCharData.energy = 100;
eq(cleanDwelling(), true, 'C15 洒扫照旧能干');
eq(global.currentCharData.energy, 100 - 7, 'C16 有浴池洒扫真省力（15-8=7 精力）');

// ==================== D · 面板 ====================
console.log('\n[D] 面板：占山卡、破山洞的冷落、睁眼见图样');
resetHouse();
HP._cancelSite(); HP.selectTab('jing');
var rD = renderPanel();
assert(rD.html.indexOf('🪨 破山洞') >= 0 && rD.html.indexOf('免费占山') >= 0, 'D1 置产铺子头一张卡：破山洞免费占');
assert(rD.html.indexOf('claimRuin()') >= 0, 'D2 占山钮在卡上');
eq((rD.html.match(/buyHouse\(/g) || []).length, 4, 'D3 现成宅院照旧四档（破山洞不走买卖——第一百零二波 F2 口径保住）');
assert(rD.html.indexOf('一级一级修成洞府→庭院→庄园→仙府') >= 0, 'D4 卡上把修缮的路说在前头');
claimRuin();
HP.selectTab('jing');
var rD5 = renderPanel();
assert(rD5.html.indexOf('🪨 漏风的石壁') >= 0, 'D5 门牌如实报：漏风的石壁（没有星）');
assert(rD5.html.indexOf('修缮图样：简易洞府') >= 0 && rD5.html.indexOf('动工（补差价灵石 300）') >= 0, 'D6 静室一睁眼就见图样（材料存够几个报几个）');
assert(rD5.html.indexOf('木材 0/20') >= 0, 'D7 工料如实报存够几个（背包没木材——红字 0/20）');
HP.selectTab('zhen');
var rD8 = renderPanel();
assert(rD8.html.indexOf('石壁漏风，设施无处安放') >= 0, 'D8 阵工坊插不住阵旗——先把山洞修缮起来');
HP.selectTab('jing');
HP._toggleTradeUp();
var rD9 = renderPanel();
assert(rD9.html.indexOf("repairHouse('cave')") >= 0, 'D9 门牌「修缮扩建」展开的也是图样（不是掏钱换现成的）');
HP._toggleTradeUp();
give('mat_wood', 20); give('mat_iron_ore', 10);
repairHouse('cave');
HP.selectTab('zhen');
var rD10 = renderPanel();
assert(rD10.html.indexOf('设施布置') >= 0 && rD10.html.indexOf('石壁漏风') < 0, 'D10 修成洞府——阵工坊开门了');

// ==================== E · 哨兵 ====================
console.log('\n[E] 哨兵：老账未动、旧路照走、挂名');
var hsSrc = src('js/house-system.js');
var hpSrc = src('js/house-panel.js');
var cfSrc = src('js/extensions/cave-facilities.js');
var cuSrc = src('js/crafting/compound-ui.js');
assert(hsSrc.indexOf('第一百零四波') >= 0 && hpSrc.indexOf('一百零四波') >= 0 && cfSrc.indexOf('一百零四波') >= 0 && cuSrc.indexOf('一百零四波') >= 0, 'E1 四处改动都挂着第一百零四波的号');
assert(hsSrc.indexOf('openCaveWorksUI()') >= 0 && hsSrc.indexOf('function getHouseStatusHtml') >= 0, 'E2 老账未动（v23.0 A14 / wave101 G9/G10 哨兵保住）');
assert(hsSrc.indexOf('price: 1000') >= 0 && hsSrc.indexOf('price: 5000') >= 0 && hsSrc.indexOf('price: 20000') >= 0 && hsSrc.indexOf('price: 100000') >= 0, 'E3 四档宅价一分未动');
resetHouse();
var stonesE = global.inventory.currency.spiritStones;
eq(buyHouse('cave'), true, 'E4 旧的买现成宅院路照走（v20.44 H1 口径）');
eq(global.inventory.currency.spiritStones, stonesE - 1000, 'E5 现成宅院照原价 1000');
var runAll = src('tests/run-all.sh');
assert(runAll.indexOf('wave104-shanju-node.js') >= 0, 'E6 本套已挂全量回归');
['每日限', '次数已用完'].forEach(function (kw) {
    assert(hpSrc.indexOf(kw) < 0 && hsSrc.indexOf(kw) < 0, 'E7 无人工计数器口径「' + kw + '」');
});

console.log('\n========== wave104 结果：' + passed + ' 通过 / ' + failed + ' 失败 ==========');
if (failed > 0) process.exit(1);
