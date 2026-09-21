/**
 * wave44-tianjie-node.js — 第四十四波 · 天界 验收：
 *   A 闸门与登天：凡躯/渡劫一律拒、飞升金仙真开得、来路记账、面板按钮在册
 *   B 天界地皮：图真建、无镇无市、仙府灵泉玉液池、灵气如潮（打坐产出实测碾压凡间）
 *   C 见闻守卫与回尘：天界不污染九州见闻账、步数照记、回入尘世落回来路
 *   D 零漂移铁证与哨兵：同种子建中州→逛天界→再建中州，地形指纹逐格相等；零拉丁；零新档（除 _tianjieFrom）
 *
 * 运行：node tests/wave44-tianjie-node.js
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

// ==================== 共享全局桩（wave43 同源） ====================
global.window = global;

var els = {};
function fakeEl(tag) {
    var el = {
        tag: tag || '', children: [], style: {}, _attrs: {}, parentNode: null,
        setAttribute: function (k, v) { this._attrs[k] = v; },
        getAttribute: function (k) { return this._attrs[k]; },
        appendChild: function (c) { this.children.push(c); c.parentNode = this; return c; },
        removeChild: function (c) { var i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return c; },
        remove: function () {},
        get firstChild() { return this.children[0] || null; },
        addEventListener: function () {}, removeEventListener: function () {},
        closest: function () { return null; },
        scrollIntoView: function () {},
        classList: { add: function () {}, remove: function () {}, toggle: function () {} },
        _html: '',
        textContent: ''
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
global.timeSystem = {
    gameTime: { totalMinutes: 0, currentDay: 5, currentHour: 10, currentMinute: 0, currentSeason: 'spring', currentMonth: 3, currentYear: 1 },
    advanceTime: function () {},
    getAbsoluteDay: function () { return 700; },
    onNewDaySubscribe: function () {}
};
global.addItemToInventory = function () { return true; };
global.updateCharacterStatus = function () {};
global.updateCurrencyUI = function () {};
global.updateInsightUI = function () {};
global.getEffectiveMax = function () { return 100; };
global.generateRandomEnemy = function (level, type) { return { name: '敌' + level, hp: 100, level: level }; };
global.openBattleWithEntity = function () {};
global.ResourcePoints = { listByRegion: function () { return []; } };
global.DungeonDynamic = { listActive: function () { return []; } };
global.StateRegistry = { register: function () {} };
global.currentCharData = { health: 100, energy: 100, qi: 50, maxQi: 100, realm: '金丹', fame: 40 };
global.eventFlags = {};
global.PSectWorld = { homeName: function () { return null; } };
global.sectsData = {};
global.DataManager = { getSpiritStones: function () { return 5000; }, deductSpiritStones: function () { return true; }, addSpiritStones: function () {} };

load('js/regions.js');
load('js/qi-environment.js');
load('js/map/map-markers.js');
load('js/economy/spirit-vein.js');
load('js/map/travel-journal.js');
load('js/core/state-registry.js');
load('js/map/wild-terrain.js');
load('js/map/randomMap.js');
load('js/endgame/ascension-epilogue.js');

var WT = global.WildTerrain;
var api = global.wildMapApi;

function withRandom(v, fn) {
    var orig = Math.random;
    Math.random = function () { return v; };
    try { return fn(); } finally { Math.random = orig; }
}
function openSeed(region, seed) {
    global.setMapSeed(seed);
    withRandom(0.99, function () { global.openWildernessMap(region); });
}
function msgCount(word) {
    return msgs.filter(function (m) { return m.m.indexOf(word) >= 0; }).length;
}
function mapFingerprint() {
    return global.currentMap.map(function (r) { return r.map(function (c) { return c.terrainKey; }).join(''); }).join('|');
}
function countTerrain(key) {
    var n = 0;
    global.currentMap.forEach(function (r) { r.forEach(function (c) { if (c.terrainKey === key) n++; }); });
    return n;
}
function avgQi() {
    var sum = 0, n = 0;
    global.currentMap.forEach(function (r) { r.forEach(function (c) { sum += c.qi; n++; }); });
    return sum / n;
}
function adjacentWalkable() {
    var M = global.currentMap, p = global.playerPos;
    var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (var i = 0; i < dirs.length; i++) {
        var nx = p.x + dirs[i][0], ny = p.y + dirs[i][1];
        var row = M[ny]; var c = row ? row[nx] : null;
        if (c && !c.poiId && WT.passable({ t: c.terrainKey })) return { x: nx, y: ny };
    }
    return null;
}

// ==================== A · 闸门与登天 ====================
console.log('\n[A] 闸门与登天（非仙躯不能立足）');
{
    openSeed('中州', '中州_w44_gate');
    global.currentCharData.realm = '金丹';
    msgs.length = 0;
    withRandom(0.99, function () { global.openWildernessMap('天界'); });
    eq(global.currentRegionForMap, '中州', 'A1 金丹凡躯开天界：拒（人还在中州）');
    eq(msgCount('非仙躯不能立足'), 1, 'A2 拒得有话术（界膜之上罡风如刃）');
    global.currentCharData.realm = '渡劫';
    withRandom(0.99, function () { global.openWildernessMap('天界'); });
    eq(global.currentRegionForMap, '中州', 'A3 渡劫期未飞升：照样拒（渡过天劫才算仙躯）');

    // 飞升真开得
    global.currentCharData.realm = '飞升';
    openSeed('东荒', '东荒_w44_from');
    msgs.length = 0;
    assert(global.enterTianjie() === true, 'A4 飞升者登天成行');
    eq(global.currentRegionForMap, '天界', 'A5 脚下真是天界（图开出来了）');
    eq(global.currentCharData._tianjieFrom, '东荒', 'A6 来路记档（回尘世就落回东荒）');
    eq(msgCount('九天到了'), 1, 'A7 登天有话术');

    // 金仙也开得
    global.currentCharData.realm = '金仙';
    openSeed('中州', '中州_w44_jx');
    withRandom(0.99, function () { global.openWildernessMap('天界'); });
    eq(global.currentRegionForMap, '天界', 'A8 金仙照样登天');

    // 凡人直驱 enterTianjie 也拒
    global.currentCharData.realm = '凡人';
    msgs.length = 0;
    eq(global.enterTianjie(), false, 'A9 凡人直驱登天函数：拒');
    eq(msgCount('非仙躯不能登天'), 1, 'A10 拒得有话术');

    // 面板与飞升话术接线（源码哨兵）
    var cult = fs.readFileSync(path.join(ROOT, 'js/cultivation/cultivation.js'), 'utf8');
    assert(cult.indexOf('window.enterTianjie()') > 0 && cult.indexOf('登上天界') > 0, 'A11 修行面板「登上天界」按钮在册');
    var epi = fs.readFileSync(path.join(ROOT, 'js/endgame/ascension-epilogue.js'), 'utf8');
    assert(epi.indexOf('天界之路已开') > 0, 'A12 飞升话术指了路');
    global.currentCharData.realm = '飞升';
}

// ==================== B · 天界地皮 ====================
console.log('\n[B] 天界地皮（无俗市、仙府玉液、灵气如潮）');
{
    openSeed('天界', '天界_w44_land');
    assert(global.currentMap && global.currentMap.length > 0, 'B1 天界图真建得出来');
    var towns = global.currentPois.filter(function (p) { return p.type === 'town'; });
    var markets = global.currentPois.filter(function (p) { return p.type === 'market'; });
    eq(towns.length, 0, 'B2 天界无村镇（仙人不设俗市）');
    eq(markets.length, 0, 'B3 天界无坊市（没有买卖就没有镖与行情）');
    var caves = global.currentPois.filter(function (p) { return p.type === 'cave'; });
    assert(caves.length >= 2, 'B4 仙府两座（落脚处就是道场）');
    assert(caves.every(function (c) { return /仙府|云宫/.test(c.name); }), 'B5 仙府有名有姓（凌霄仙府/紫霄云宫之属）');
    var springs = global.currentPois.filter(function (p) { return p.type === 'spring'; });
    assert(springs.length >= 1, 'B6 灵泉在册（spring 权重 6，处处灵机）');
    assert(countTerrain('QIPOOL') >= 1, 'B7 玉液池地块真撒出来了（淬体现成动作直接可用）');
    var qTian = avgQi();
    openSeed('中州', '中州_w44_qi');
    var qMortal = avgQi();
    assert(qTian > qMortal * 2, 'B8 灵气如潮：天界均值 ' + qTian.toFixed(2) + ' 碾压凡间 ' + qMortal.toFixed(2) + '（打坐产出 8×qi 同式自涨）');
    openSeed('天界', '天界_w44_land');
    var nodeCount = 0;
    global.currentMap.forEach(function (r) { r.forEach(function (c) { if (c.node) nodeCount++; }); });
    assert(nodeCount > 0, 'B9 采集节点照生（兜底货池，天界也有灵草矿脉）');
    var rm = fs.readFileSync(path.join(ROOT, 'js/map/randomMap.js'), 'utf8');
    assert(rm.includes("'天界': { beast: ['云鲸', '天鹏'], person: ['巡天仙官'] }"), 'B10 遭遇风味在册（云鲸天鹏巡天仙官）');
    assert(rm.includes("'天界': '香火贡队'") && rm.includes("'天界': '凌霄巡值'"), 'B11 香火贡队与凌霄巡值在册');
    assert(rm.includes("'天界':   { name: '罡风'") || rm.includes("'天界':   { name: '罡风', icon: '🌬️'"), 'B12 罡风漂移在册');
}

// ==================== C · 见闻守卫与回尘 ====================
console.log('\n[C] 见闻守卫与回尘（仙界的风景不记九州账）');
{
    global.currentCharData._travel = { regions: {}, marks: {}, steps: 0 };
    var insightBefore = Number(global.window.insightPoints) || 0;
    openSeed('天界', '天界_w44_journal');
    eq(Object.keys(global.currentCharData._travel.regions).length, 0, 'C1 登天不进见闻账（域数纹丝不动）');
    eq((Number(global.window.insightPoints) || 0) - insightBefore, 0, 'C2 初至悟道点分文不发（天界不是「初至一域」）');
    eq(global.TravelJournal.summary().regionTotal, 9, 'C3 侧栏仍是「域 x/9」（名录没被污染）');
    // 步数照记：脚下的路都算数
    var t = adjacentWalkable();
    var stepsBefore = global.TravelJournal.summary().steps;
    if (t) withRandom(0.99, function () { api.stepTo(t.x, t.y); });
    eq(global.TravelJournal.summary().steps, stepsBefore + (t ? 1 : 0), 'C4 天界步行数照记（万里独行的账不分仙界凡间）');

    // 回尘世
    global.currentCharData._tianjieFrom = '东荒';
    withRandom(0.99, function () { global.renderWildSidebar(); });
    var exitHtml = els['wild-exit-list'].innerHTML;
    assert(exitHtml.indexOf('leave-tianjie') >= 0 && exitHtml.indexOf('回入尘世') >= 0, 'C5 天界侧栏有「回入尘世」钮');
    msgs.length = 0;
    assert(global.leaveTianjie() === true, 'C6 回尘世成行');
    eq(global.currentRegionForMap, '东荒', 'C7 落回来时的地界（东荒）');
    eq(msgCount('人间烟火气'), 1, 'C8 回尘有话术');
    delete global.currentCharData._tianjieFrom;
    global.leaveTianjie();
    eq(global.currentRegionForMap, '中州', 'C9 来路账缺失：缺省落中州（不把人丢在天上）');
    var rm2 = fs.readFileSync(path.join(ROOT, 'js/map/randomMap.js'), 'utf8');
    assert(rm2.includes("act === 'leave-tianjie'") && rm2.includes('window.leaveTianjie()'), 'C10 侧栏点击分发接线在册');
}

// ==================== D · 零漂移铁证与哨兵 ====================
console.log('\n[D] 零漂移铁证与哨兵');
{
    // 铁证：同种子建中州 → 逛天界 → 再建中州，地形指纹逐格相等
    openSeed('中州', '中州_w44_drift');
    var fp1 = mapFingerprint();
    openSeed('天界', '天界_w44_drift');
    var t = adjacentWalkable();
    if (t) withRandom(0.5, function () { api.stepTo(t.x, t.y); });
    openSeed('中州', '中州_w44_drift');
    var fp2 = mapFingerprint();
    eq(fp2, fp1, 'D1 九域零漂移铁证：逛过天界再建中州，同种子地形指纹逐格相等');

    var tj = fs.readFileSync(path.join(ROOT, 'js/map/travel-journal.js'), 'utf8');
    assert(tj.indexOf("'天界'") < 0 && tj.indexOf('REGIONS.indexOf(region) < 0') > 0, 'D2 见闻账名录没有天界，守卫在档（只认名录内九州）');
    var epi = fs.readFileSync(path.join(ROOT, 'js/endgame/ascension-epilogue.js'), 'utf8');
    var fields = epi.match(/cd\._[A-Za-z]+/g) || [];
    var newFields = fields.filter(function (f) { return ['cd._tianjieFrom'].indexOf(f) < 0 && ['cd._ascensionDay', 'cd._unlockedTianjie', 'cd._mortalOrigin', 'cd._foundationBonus'].indexOf(f) < 0; });
    assert(newFields.length === 0, 'D3 尾声模块新存档字段只有 _tianjieFrom（余者皆旧账）');
    // 闸门在 DOM 操作之前（拒了连界面都不该动）
    var rm = fs.readFileSync(path.join(ROOT, 'js/map/randomMap.js'), 'utf8');
    var iFn = rm.indexOf('function openWildernessMap(regionName)');
    var iGate = rm.indexOf("regionName === '天界'", iFn);
    var iDom = rm.indexOf("getElementById('random-map-section')", iFn);
    assert(iGate > iFn && iGate < iDom, 'D4 境界闸在函数最前（拒人于 DOM 之前）');
    var ascLine = rm.slice(rm.indexOf('const _asc ='), rm.indexOf('const _asc =') + 120);
    assert(ascLine.indexOf("realm === '飞升'") > 0 && ascLine.indexOf("realm === '金仙'") > 0 && ascLine.indexOf('_unlockedTianjie') < 0, 'D5 闸只认现境界（转世凡人拿旧旗也混不上去）');
    var wt = fs.readFileSync(path.join(ROOT, 'js/map/wild-terrain.js'), 'utf8');
    assert(wt.indexOf("'天界':   { sea: -0.10") > 0 && wt.indexOf("'天界': ['凌霄', '紫霄', '斗率']") > 0, 'D6 天界地皮与命名在册');
    assert(wt.indexOf("var isTianjie = region === '天界'") > 0, 'D7 无俗市分支在册（只影响天界自己的种子）');
    eq(global.getQiConcentration('天界'), 2.5, 'D8 灵气账在册：天界 2.5（凡间 default 0.8）');
    eq(global.mapData['天界'].cities.length, 0, 'D9 天界无凡间城市（城市系统零牵连）');
    // 新话术零拉丁
    var latin = /[A-Za-z]/;
    var visMsgs = ['界膜之上罡风如刃，非仙躯不能立足——待飞升之后，天界之路自开。', '非仙躯不能登天。',
        '🌅 天光分开，你踏罡风而上——九天到了。灵气如潮水漫过周身，凡尘的尘土气从袍角褪尽。',
        '🌅 你拨开云层往下落——脚下又是中州的山河。人间烟火气扑面而来。',
        '🌅 回入尘世（返回来时的地界）', '九天罡风扫过云原，仙躯也觉得罡刃割面。'];
    assert(visMsgs.every(function (s) { return !latin.test(s); }), 'D10 新话术零拉丁');
    // 天界无俗市动作：随便一格野地的脚下动作里，打尖/逛市/护镖/行情一概没有
    openSeed('天界', '天界_w44_acts');
    var plainCell = null;
    for (var y = 0; y < global.currentMap.length && !plainCell; y++) {
        for (var x = 0; x < global.currentMap[y].length; x++) {
            var c = global.currentMap[y][x];
            if (!c.poiId && WT.passable({ t: c.terrainKey })) { plainCell = c; break; }
        }
    }
    var acts = api.tileActions(plainCell);
    assert(!acts.some(function (a) { return ['rest', 'shop', 'escort-job', 'escort-long', 'ask-market', 'ask-road'].indexOf(a.act) >= 0; }), 'D11 天界无俗市动作（无镇无市，自然无柜台无镖）');
}

console.log('\n========== 第四十四波 · 天界 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
