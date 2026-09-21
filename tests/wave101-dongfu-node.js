/**
 * wave101-dongfu-node.js — 第一百零一波 · 洞府翻新 验收：
 *   用户点账：「洞府页设计的非常怪」——方案全做（甲乙丙丁戊）：
 *   A 无府者看铺：置产铺子卡片化（四档宅子对比着买），不再是灰按钮堆
 *   B 布局图：有府者页首鸟瞰四间屋子（静室/灵田圃/库房/阵工坊），点屋子切页签
 *   C 灵田格子化：一畦一格——空畦下种（选种条）、青苗计日、熟了发亮、蔫了发红
 *   D 静室收纳修炼：打坐五档/突破/引导灵气/长期闭关/洒扫/精修全住进静室；心境账与倍率明细签在案
 *   E 阵工坊一级化：设施/阵法/傀儡三间直接嵌进页签（借 compound-ui 的 _cwSection），套娃窗取消
 *   F 库房：储物进度条+家具已摆/铺子分列+扩容
 *   G 哨兵：app.js 跳静室与整页接管、compound-ui 兜底刷新、script 挂载、house-system 老账未动、挂全量回归
 *
 * 运行：node tests/wave101-dongfu-node.js
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
        classList: { add: function () {}, remove: function () {}, toggle: function () {}, contains: function () { return false; } },
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
global.growLifeSkill = function () {};
global.addProfessionExp = function () {};
global.getLifeSkill = function () { return 0; };

// 世界日历桩：天数由测试拨
var _day = 100;
global.getAbsoluteDay = function () { return _day; };
global.timeSystem = { advanceTime: function () {}, getAbsoluteDay: function () { return _day; } };

// 背包桩
global.inventory = {
    currency: { spiritStones: 200000 },
    maxSlots: 30,
    slots: []
};
for (var _i = 0; _i < 8; _i++) global.inventory.slots.push({ templateId: 'mat_lingzhi', count: 2 });

// 打坐时长账（与 app.js CULTIVATE_DURATIONS 同口径）
global.CULTIVATE_DURATIONS = [
    { id: 'short', label: '5分钟', shortLabel: '5m', minutes: 5, multiplier: 1, qiCost: 5 },
    { id: 'half', label: '半小时', shortLabel: '30m', minutes: 30, multiplier: 6.5, qiCost: 20 },
    { id: 'hour', label: '一时辰', shortLabel: '2h', minutes: 120, multiplier: 27, qiCost: 60 },
    { id: 'five_hour', label: '五时辰', shortLabel: '10h', minutes: 600, multiplier: 140, qiCost: 200 },
    { id: 'day', label: '一天', shortLabel: '24h', minutes: 1440, multiplier: 350, qiCost: 400 }
];
global.currentCharData = { qi: 300, energy: 100 };
// 心境桩（第六十七波口径）
global.MoodSystem = {
    label: function () { return '心平气和'; },
    moodNow: function () { return 62; },
    cultivationMul: function () { return 1.1; },
    cultivationNote: function () { return ''; }
};

load('js/house-system.js');
load('js/house-panel.js');

var HP = global.HousePanelUI;
function renderPanel() {
    var c = fakeEl('div'), s = fakeEl('div');
    HP.render(c, s);
    return { html: c.innerHTML, shopHtml: s.innerHTML, container: c };
}

// ==================== A · 无府者看铺（戊） ====================
console.log('\n[A] 置产铺子：没府的人看到的是一个铺子，不是灰按钮堆');
global.playerHouse = null;
var rA = renderPanel();
assert(rA.html.indexOf('还没有自己的洞府') >= 0, 'A1 开门见山：还没有自己的洞府');
['简易洞府', '庭院洞府', '灵山庄园', '仙府'].forEach(function (nm) {
    assert(rA.html.indexOf(nm) >= 0, 'A2 四档宅子都上了卡片（' + nm + '）');
});
assert((rA.html.match(/buyHouse\(/g) || []).length === 4, 'A3 每张卡一个购买口（四档各一）');
assert(rA.html.indexOf('没置产也照样能打坐修炼') >= 0, 'A4 实话实说：没置产也能打坐（不逼买）');
assert(rA.html.indexOf('灵田 8 畦') >= 0, 'A5 卡片带对比账（仙府灵田 8 畦）');

// ==================== B · 布局图 + 页签（甲/乙） ====================
console.log('\n[B] 布局图：有府的人页首是一座能走的宅子');
buyHouse('courtyard');   // 庭院洞府：修炼×1.2 灵田4畦
eq(!!(global.playerHouse && global.playerHouse.type), true, 'B1 购得庭院洞府（老账口 buyHouse 未动）');
HP.selectTab('jing');
var rB = renderPanel();
assert(rB.html.indexOf('庭院洞府') >= 0, 'B2 门牌报宅名');
['静室', '灵田圃', '库房', '阵工坊'].forEach(function (nm) {
    assert(rB.html.indexOf(nm) >= 0, 'B3 布局图四间屋子都在（' + nm + '）');
});
assert((rB.html.match(/HousePanelUI\._setTab\(/g) || []).length >= 8, 'B4 屋子和页签都能点（每间两个口：图+签）');
assert(rB.html.indexOf('修炼 ×1.26') >= 0, 'B5 静室屋面挂当前修炼倍率（庭院×1.2，再吃太虚中脉+5%——第一百零六波地脉入账）');
assert(rB.html.indexOf('心境：心平气和') >= 0, 'B6 屋面报心境（第六十七波的账上了墙）');
assert(rB.html.indexOf('修缮扩建') >= 0, 'B7 门牌上有扩建口（第一百零四波：换购改修缮——材料+差价修出来）');
// 换购展开
HP._toggleTradeUp();
var rB8 = renderPanel();
assert(rB8.html.indexOf('灵山庄园') >= 0 && rB8.html.indexOf('补差价') >= 0, 'B8 换购展开：只列更高级的（灵山庄园补差价）');
assert(rB8.html.indexOf('简易洞府') < 0, 'B9 已低于当前的不列（简易洞府不见了）');
HP._toggleTradeUp();

// ==================== C · 静室（丁） ====================
console.log('\n[C] 静室：修炼和它的加成住同一个屋檐下');
HP.selectTab('jing');
var rC = renderPanel();
assert(rC.html.indexOf('当前心境：心平气和（62/100）') >= 0, 'C1 心境账上脸（档位+分数）');
assert(rC.html.indexOf('打坐真元 +10%') >= 0, 'C2 折头如实报（+10%）');
assert(rC.html.indexOf('修炼倍率') >= 0 && rC.html.indexOf('宅底 ×1.2') >= 0, 'C3 倍率明细签：宅底一项在案');
var durCount = (rC.html.match(/cultivationMeditate\(/g) || []).length;
eq(durCount, 5, 'C4 打坐五档全在静室里（5分钟到一天）');
assert(rC.html.indexOf('耗气 400') >= 0, 'C5 每档标耗气（一天档400）');
assert(rC.html.indexOf('当前真气 300') >= 0, 'C6 报当前真气（买不买得起自己看）');
assert(rC.html.indexOf('尝试突破') >= 0 && rC.html.indexOf('引导灵气') >= 0 && rC.html.indexOf('长期闭关') >= 0, 'C7 突破/引导灵气/长期闭关三门住进静室');
assert(rC.html.indexOf('洒扫洞府') >= 0 && rC.html.indexOf('精修静室') >= 0, 'C8 洒扫与精修也在（老账口 cleanDwelling/upgradeHouse 未动）');

// ==================== D · 灵田格子化（丙） ====================
console.log('\n[D] 灵田圃：一畦一格，从下种到蔫全看得见');
HP.selectTab('tian');
var rD = renderPanel();
assert(rD.html.indexOf('共 4 畦') >= 0, 'D1 畦数如实（庭院4畦）');
assert(rD.html.indexOf('熟后 3 日不采即蔫') >= 0, 'D2 蔫账写在脸上（灵植不等懒汉）');
eq((rD.html.match(/空畦/g) || []).length >= 1, true, 'D3 空畦看得见');
assert(rD.html.indexOf('空畦·下种') >= 0, 'D4 下一畦亮着「下种」口');
// 点畦选种
HP._pickPlot(0);
var rD5 = renderPanel();
assert(rD5.html.indexOf('选种') >= 0 && rD5.html.indexOf('灵芝') >= 0 && rD5.html.indexOf('无需种子') >= 0, 'D5 选种条：四样作物带天数/收成/种子账（灵草无需种子）');
assert(rD5.html.indexOf('种子够(16)') >= 0, 'D6 种子存够几个报几个（背包8格×2个灵芝种=16）');
// 种下去
plantCrop('spirit_grass');
HP.selectTab('tian');
_day = 100;
var rD7 = renderPanel();
assert(rD7.html.indexOf('灵草') >= 0 && rD7.html.indexOf('还有') >= 0, 'D7 种下的青苗计日（还有 N 天）');
// 熟了发亮
var plot0 = global.playerHouse.planted[0];
_day = plot0.readyDay;
var rD8 = renderPanel();
assert(rD8.html.indexOf('可收获') >= 0 && rD8.html.indexOf('harvestCrop(0)') >= 0, 'D8 熟了发亮——整畦就是收获钮');
// 蔫了发红
_day = plot0.readyDay + 4;
var rD9 = renderPanel();
assert(rD9.html.indexOf('蔫了·减半') >= 0, 'D9 蔫了发红（蔫账上格，不再是一行小字）');
_day = plot0.readyDay;
harvestCrop(0);
HP.selectTab('tian');
var rD10 = renderPanel();
assert(addedItems.some(function (a) { return a[0] === 'mat_spirit_grass'; }), 'D10 收获真入账（老账口 harvestCrop 未动）');
assert(rD10.html.indexOf('一键收获') >= 0 && rD10.html.indexOf('开新畦') >= 0, 'D11 一键收获与开新畦都在');

// ==================== E · 库房（家具/储物） ====================
console.log('\n[E] 库房：储物一条杠，家具摆没摆分得清');
HP.selectTab('ku');
var rE = renderPanel();
assert(rE.html.indexOf('储物 ') >= 0 && rE.html.indexOf('洞府供 +') >= 0, 'E1 储物用量+洞府供几格都在');
assert(rE.html.indexOf('屋里还空着') >= 0, 'E2 没家具如实说（不装样子）');
assert(rE.html.indexOf('聚灵蒲团') >= 0 && rE.html.indexOf('buyFurniture(') >= 0, 'E3 铺子列未置办的（蒲团/暖玉炉/聚灵灯）');
buyFurniture('mat');
HP.selectTab('ku');
var rE4 = renderPanel();
assert(rE4.html.indexOf('已摆放') >= 0 && rE4.html.indexOf('洞府修炼效率+5%') >= 0, 'E4 置办过的挂「已摆放」+加成说明');
assert(rE4.html.indexOf('扩库房') >= 0, 'E5 扩容口在库房');
HP.selectTab('jing');
var rE6 = renderPanel();
assert(rE6.html.indexOf('聚灵蒲团 +0.05') >= 0, 'E6 静室倍率签跟着家具走（+0.05 上脸）');
assert(rE6.html.indexOf('静室 <span class="text-xs">🧘</span>') >= 0, 'E7 蒲团摆进静室——布局图屋面上挂了角标');

// ==================== F · 阵工坊一级化（乙） ====================
console.log('\n[F] 阵工坊：设施/阵法/傀儡不再藏在两层窗后');
HP.selectTab('zhen');
delete global._cwSection;
var rF1 = renderPanel();
assert(rF1.html.indexOf('工坊尚未开门') >= 0 && rF1.html.indexOf('openCaveWorksUI()') >= 0, 'F1 深作三门没加载时有兜底（老弹窗还开着）');
global._cwSection = function (tab) { return '<div class="cw-sec">SEC-' + tab + '</div>'; };
HP.selectTab('zhen');
var rF2 = renderPanel();
assert(rF2.html.indexOf('SEC-fac') >= 0 && rF2.html.indexOf('SEC-fmt') >= 0 && rF2.html.indexOf('SEC-pup') >= 0, 'F2 设施/阵法/傀儡三间直接嵌进页签');
assert(rF2.html.indexOf('设施布置') >= 0 && rF2.html.indexOf('护持阵法') >= 0 && rF2.html.indexOf('傀儡工坊') >= 0, 'F3 三间各有门牌');
assert(rF2.html.indexOf('openCaveWorksUI') < 0, 'F4 深作按钮退休——这一页不再套娃');
delete global._cwSection;

// ==================== G · 哨兵 ====================
console.log('\n[G] 哨兵：接线、兜底、老账未动、挂名');
var appSrc = src('js/app.js');
var cuSrc = src('js/crafting/compound-ui.js');
var hsSrc = src('js/house-system.js');
var htmlSrc = src('仙侠.html');
var hpSrc = src('js/house-panel.js');
assert(hpSrc.indexOf('第一百零一波') >= 0, 'G1 新面板挂着第一百零一波的号');
assert(appSrc.indexOf("window.HousePanelUI.render(container, shop)") >= 0, 'G2 app.renderHouseStatus 整页接管（新面板优先，老路兜底）');
var scIdx = appSrc.indexOf('function startCultivation');
var scSeg = appSrc.slice(scIdx, appSrc.indexOf('\nfunction ', scIdx + 10));
assert(scSeg.indexOf("HousePanelUI.selectTab('jing')") >= 0 && scSeg.indexOf("switchPanel('house')") >= 0, 'G3 有家者点修炼直接进静室（弹窗入口改跳）');
assert(scSeg.indexOf('当前心境：') >= 0 && scSeg.indexOf('MoodSystem.moodNow()') >= 0, 'G4 无府者的老弹窗一字未动（第六十七波 C7/C8 口径保住）');
assert(cuSrc.indexOf('window._cwSection = function') >= 0, 'G5 compound-ui 出借三间账目 HTML');
assert(cuSrc.indexOf('HousePanelUI.refresh') >= 0, 'G6 弹窗宿主不在时深作动作回头刷新洞府页（安置/布阵/造傀儡不哑火）');
assert(htmlSrc.indexOf('<script defer src="js/house-panel.js"></script>') >= 0, 'G7 新面板挂进页面（在 house-system 与 compound-ui 之后）');
assert(htmlSrc.indexOf('js/house-panel.js') > htmlSrc.indexOf('js/crafting/compound-ui.js'), 'G8 加载次序对（先系统后面板）');
assert(hsSrc.indexOf('openCaveWorksUI()') >= 0, 'G9 house-system 老账未动（v23.0 A14 哨兵保住）');
assert(hsSrc.indexOf('function getHouseStatusHtml') >= 0, 'G10 老面板函数还在（兜底路没拆）');
var runAll = src('tests/run-all.sh');
assert(runAll.indexOf('wave101-dongfu-node.js') >= 0, 'G11 本套已挂全量回归');
['每日限', '次数已用完'].forEach(function (kw) {
    assert(hpSrc.indexOf(kw) < 0, 'G12 新面板无人工计数器口径「' + kw + '」');
});

console.log('\n========== wave101 结果：' + passed + ' 通过 / ' + failed + ' 失败 ==========');
if (failed > 0) process.exit(1);
