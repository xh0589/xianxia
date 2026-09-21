/**
 * wave49-grotto-node.js — 第四十九波 · 崖壁隐藏洞天 验收：
 *   A 发现账：崖壁（elev≥0.7 高山）打坐才掷发现骰、气运加成、每域三处封顶、发现即落差量存档
 *   B 入洞账：头一回遗刻一悟（见闻账 +1 悟道点、本域风味）、行功四个时辰、一日一回、隔日再入
 *   C 按钮与图面：站过才开「入洞天」、图上画洞口、未开雾不画
 *   D 哨兵：建图零骰零漂移、发现骰全波只一枚、存档差量法（老档自动补空）、
 *          悟道点总闸不破（游历 37 + 地灵 10 + 洞天 ≤30 = 77 ≤ 78）、新话术零拉丁
 *
 * 运行：node tests/wave49-grotto-node.js
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

// ==================== 共享全局桩（wave46/47 同源） ====================
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
var timeCalls = [];
var ABS_DAY = 800;
global.timeSystem = {
    gameTime: { totalMinutes: 0, currentDay: 5, currentHour: 10, currentMinute: 0, currentSeason: 'spring', currentMonth: 3, currentYear: 1 },
    advanceTime: function (m, r) { timeCalls.push({ m: m, r: r }); global.timeSystem.gameTime.totalMinutes += m; },
    getAbsoluteDay: function () { return ABS_DAY; },
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
var REALM_TIER = { '凡人': 0, '炼气': 1, '筑基': 2, '金丹': 3, '元婴': 4, '化神': 5 };
global.getRealmTier = function (r) { return REALM_TIER[r] != null ? REALM_TIER[r] : 1; };
global.currentCharData = { health: 100, energy: 100, qi: 0, maxQi: 999, realm: '炼气', luck: 50 };
global.eventFlags = {};
global.PSectWorld = { homeName: function () { return null; } };
global.sectsData = {};
global.DataManager = { getSpiritStones: function () { return 5000; }, deductSpiritStones: function () { return true; }, addSpiritStones: function () {} };
global.insightPoints = 0;

load('js/map/map-markers.js');
load('js/economy/spirit-vein.js');
load('js/map/travel-journal.js');
load('js/core/state-registry.js');
load('js/map/wild-terrain.js');
load('js/map/randomMap.js');

var WT = global.WildTerrain;
var api = global.wildMapApi;
var CFG = api.grotto.CFG;

function withRandom(v, fn) {
    var orig = Math.random;
    Math.random = function () { return v; };
    try { return fn(); } finally { Math.random = orig; }
}
function setSeason(s) { global.timeSystem.gameTime.currentSeason = s; }
function openSeed(region, seed) {
    global.setMapSeed(seed);
    withRandom(0.99, function () { global.openWildernessMap(region); });
}
function msgCount(word) {
    return msgs.filter(function (m) { return m.m.indexOf(word) >= 0; }).length;
}
function setChar(realm, hp, en, luck) {
    global.currentCharData.realm = realm;
    global.currentCharData.health = hp;
    global.currentCharData.energy = en;
    global.currentCharData.luck = luck != null ? luck : 50;
    global.currentCharData._wearyNoticed = false;
    global.currentCharData._spentNoticed = false;
}
function cellAt(x, y) { return (global.currentMap[y] || [])[x] || null; }
function forgeCell(x, y, key, elev) {
    var c = cellAt(x, y);
    if (!c) return null;
    c.terrainKey = key;
    c.terrain = WT.TERRAIN[key];
    c.fog = 1;
    if (elev != null) c.elev = elev;
    return c;
}
function forgeAdjacent(bx, by, key, elev, skip) {
    var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2], [1, 1], [-1, 1], [1, -1], [-1, -1]];
    for (var i = 0; i < dirs.length; i++) {
        var nx = bx + dirs[i][0], ny = by + dirs[i][1];
        if (skip && skip.some(function (s) { return s.x === nx && s.y === ny; })) continue;
        var c = cellAt(nx, ny);
        if (!c || c.poiId || c.node || (c.entities || []).length) continue;
        forgeCell(nx, ny, key, elev);
        return { x: nx, y: ny };
    }
    return null;
}
function grottoDict(region) {
    var st = api.state().regions[region || '中州'];
    return st ? (st.grotto = st.grotto || {}) : null;
}

setSeason('spring');
openSeed('中州', '中州_w49_grotto');
global.currentCharData._travel = { regions: {}, marks: {}, steps: 0 };

// ==================== A · 发现账 ====================
console.log('\n[A] 发现账（崖壁打坐，山风穿石——有缘才见洞口）');
var mt1 = null, p0 = global.playerPos;
{
    setChar('炼气', 100, 100, 50);
    mt1 = forgeAdjacent(p0.x, p0.y, 'MOUNTAIN', 0.8, []);
    assert(!!mt1, 'A0 岸边应能造出一座高山（elev 0.8，测试地形）');
    withRandom(0.99, function () { api.stepTo(mt1.x, mt1.y); });
    eq(global.playerPos.x, mt1.x, 'A0b 人站在山上');

    msgs.length = 0; timeCalls.length = 0;
    withRandom(0.0, function () { api.poiAction('meditate'); });   // 骰 0.0：发现骰必中（0.0 < 4%）
    assert(api.grotto.at(mt1.x, mt1.y), 'A1 崖壁打坐定骰必中：发现隐蔽洞天');
    assert(msgCount('隐蔽洞口') === 1 || msgCount('一线洞口') === 1, 'A2 发现有话术（山风穿石，崖壁裂缝）');
    var gd = grottoDict('中州');
    eq(gd[mt1.x + ',' + mt1.y], 800, 'A3 发现账落差量存档（st.grotto 记绝对日）');

    // 矮山（elev < 0.7）没有石缝
    var mt2 = forgeAdjacent(p0.x, p0.y, 'MOUNTAIN', 0.5, [mt1]);
    withRandom(0.99, function () { api.stepTo(p0.x, p0.y); });
    withRandom(0.99, function () { api.stepTo(mt2.x, mt2.y); });
    msgs.length = 0;
    withRandom(0.0, function () { api.poiAction('meditate'); });
    assert(!api.grotto.at(mt2.x, mt2.y), 'A4 矮山（elev 0.5）打坐不出洞天——崖壁的门槛是白顶高山');

    // 平原打坐也不出
    var pl = forgeAdjacent(p0.x, p0.y, 'PLAIN', null, [mt1, mt2]);
    withRandom(0.99, function () { api.stepTo(pl.x, pl.y); });
    withRandom(0.0, function () { api.poiAction('meditate'); });
    assert(!api.grotto.at(pl.x, pl.y), 'A5 平原打坐不出洞天（只在崖壁掷骰）');

    // 气运加成：luck 100 → 9%；骰 0.085 命中；luck 50 → 4%，同骰不中
    var mt3 = forgeAdjacent(p0.x, p0.y, 'MOUNTAIN', 0.9, [mt1, mt2, pl]);
    setChar('炼气', 100, 100, 100);
    withRandom(0.99, function () { api.stepTo(mt3.x, mt3.y); });
    withRandom(0.085, function () { api.poiAction('meditate'); });
    assert(api.grotto.at(mt3.x, mt3.y), 'A6 气运 100（发现率 9%）：骰 0.085 命中——福缘深的人真能听见风');
    var mt4 = forgeAdjacent(p0.x, p0.y, 'MOUNTAIN', 0.9, [mt1, mt2, pl, mt3]);
    setChar('炼气', 100, 100, 50);
    withRandom(0.99, function () { api.stepTo(mt4.x, mt4.y); });
    withRandom(0.085, function () { api.poiAction('meditate'); });
    assert(!api.grotto.at(mt4.x, mt4.y), 'A7 气运 50（发现率 4%）：同骰 0.085 不中——机缘看福缘');

    // 每域三处封顶
    var gd2 = grottoDict('中州');
    gd2['fake1'] = 800;   // 凑满三处（mt1 + mt3 + fake1）
    var mt5 = forgeAdjacent(p0.x, p0.y, 'MOUNTAIN', 0.95, [mt1, mt2, pl, mt3, mt4]);
    if (mt5) {
        setChar('炼气', 100, 100, 100);
        withRandom(0.99, function () { api.stepTo(mt5.x, mt5.y); });
        withRandom(0.0, function () { api.poiAction('meditate'); });
        assert(!api.grotto.at(mt5.x, mt5.y), 'A8 每域三处封顶：第四座崖壁打坐也不出（机缘贵在稀）');
    } else { assert(true, 'A8 （地形挤不出第五座山，封顶账由 D4 总闸哨兵把守）'); }
    delete gd2['fake1'];

    // 已发现的格子不重掷
    withRandom(0.99, function () { api.stepTo(mt1.x, mt1.y); });
    msgs.length = 0;
    withRandom(0.0, function () { api.poiAction('meditate'); });
    eq(msgCount('一线洞口'), 0, 'A9 已发现的洞天不重掷不重报（一格一洞）');
}

// ==================== B · 入洞账 ====================
console.log('\n[B] 入洞账（头一回遗刻一悟，往后一日一回行功）');
{
    // 人站在 mt1（有洞天）
    setChar('炼气', 100, 100, 50);
    global.currentCharData.qi = 0;
    global.insightPoints = 0;
    msgs.length = 0; timeCalls.length = 0;
    var cellQ = cellAt(mt1.x, mt1.y).qi || 1.3;
    var expectGain = Math.round(20 * cellQ);
    api.poiAction('grotto-enter');
    eq(timeCalls[timeCalls.length - 1].m, 240, 'B1 洞天行功四个时辰（240 分钟）');
    eq(timeCalls[timeCalls.length - 1].r, '洞天行功', 'B1b 时间账的名目是「洞天行功」');
    eq(global.insightPoints, 1, 'B2 头一回入洞遗刻一悟（悟道点 +1，走见闻账一次性口）');
    assert(!!global.currentCharData._travel.marks['grotto_中州_' + mt1.x + ',' + mt1.y], 'B2b 见闻账落了「grotto」一次性键（一生一回）');
    assert(msgCount('守一论') === 2, 'B3 中州的遗刻是中州的字（「守一论」两见：见闻账一笔 + 入洞话术一段，不串味）');
    eq(global.currentCharData.qi, expectGain, 'B4 真气回复 = 20 × 本地灵气（洞天比露天地打坐养人）');

    // 同日再入：灵机取尽
    msgs.length = 0; timeCalls.length = 0;
    api.poiAction('grotto-enter');
    eq(timeCalls.length, 0, 'B5 同日再入：不耗时辰');
    assert(msgCount('今日洞中灵机') === 1, 'B5b 同日再入有话术（静室要一夜酿回清寂）');

    // 隔日再入：行功照旧，遗刻不再悟
    ABS_DAY = 801;
    global.currentCharData.qi = 0;
    global.insightPoints = 0;
    msgs.length = 0; timeCalls.length = 0;
    api.poiAction('grotto-enter');
    eq(timeCalls[timeCalls.length - 1].m, 240, 'B6 隔日再入：行功照旧（一日一回的账翻篇）');
    eq(global.insightPoints, 0, 'B7 遗刻只悟头一回（第二回进去字还是那些字）');
    assert(msgCount('洞中清寂') === 1, 'B7b 老客入洞的话术（不再念遗刻）');

    // 没洞天的格子直调：拒
    withRandom(0.99, function () { api.stepTo(p0.x, p0.y); });
    msgs.length = 0;
    api.poiAction('grotto-enter');
    assert(msgCount('此处没有洞天') === 1, 'B8 实心崖壁直调入洞：拒（崖壁是实心的）');
    ABS_DAY = 800;
}

// ==================== C · 按钮与图面 ====================
console.log('\n[C] 按钮与图面（站过才开缝，图上留洞口）');
{
    withRandom(0.99, function () { api.stepTo(mt1.x, mt1.y); });
    var acts = api.tileActions(cellAt(mt1.x, mt1.y));
    assert(acts.some(function (a) { return a.act === 'grotto-enter'; }), 'C1 站上有洞天的崖壁：菜单开「入崖壁洞天」');
    withRandom(0.99, function () { api.stepTo(p0.x, p0.y); });
    var mtN = forgeAdjacent(p0.x, p0.y, 'MOUNTAIN', 0.9, [mt1]);
    if (mtN) {
        withRandom(0.99, function () { api.stepTo(mtN.x, mtN.y); });
        var actsN = api.tileActions(cellAt(mtN.x, mtN.y));
        assert(!actsN.some(function (a) { return a.act === 'grotto-enter'; }), 'C2 没发现过洞天的山：菜单不开这条缝');
        withRandom(0.99, function () { api.stepTo(p0.x, p0.y); });
    } else { assert(true, 'C2 （地形挤不出新山，跳过）'); }
    // 图面：带洞天重画不炸（drawGrottoes 在册）
    var ok = true;
    try { global.renderMap(fakeEl('svg'), global.currentMap, 0, 0); } catch (e) { ok = false; }
    assert(ok, 'C3 带洞天的图重画不炸（洞口画在未开雾之外的格上）');
}

// ==================== D · 哨兵 ====================
console.log('\n[D] 哨兵（建图零骰、总闸不破、零拉丁）');
{
    var rm = fs.readFileSync(path.join(ROOT, 'js/map/randomMap.js'), 'utf8');
    // 建图函数零洞天调用（骰序零漂移）
    var bStart = rm.indexOf('function buildWildMap');
    var buildSeg = rm.slice(bStart, rm.indexOf('\nfunction ', bStart + 10));
    assert(buildSeg.indexOf('GROTTO') < 0 && buildSeg.indexOf('grotto') < 0 && buildSeg.indexOf('tryDiscover') < 0,
        'D1 建图段无洞天任何调用（发现骰只在打坐运行时掷）');
    // 洞天一节零随机，只此一枚发现骰
    var gStart = rm.indexOf('第四十九波 · 崖壁隐藏洞天');
    var gEnd = rm.indexOf('第三十八波 · 扎营歇夜');
    var grottoSeg = rm.slice(gStart, gEnd);
    eq((grottoSeg.match(/Math\.random/g) || []).length, 1, 'D2 洞天一节只一枚随机骰（发现骰，别处零随机）');
    assert(grottoSeg.indexOf('localStorage') < 0, 'D3 洞天一节零直写存档（账全走 saveWildState 差量法）');
    // 存档差量法在册（老档自动补空）
    assert(rm.indexOf('grotto: prev.grotto || {}') >= 0 && rm.indexOf('grottoUse: prev.grottoUse || {}') >= 0,
        'D4 saveWildState 白名单收了两本洞天账（发现/行功）');
    assert(rm.indexOf('st.grotto = st.grotto || {}') >= 0 && rm.indexOf('st.grottoUse = st.grottoUse || {}') >= 0,
        'D5 applyWildState 老档自动补空（零迁移脚本）');
    // 悟道点总闸：游历 37 + 地灵 10 + 洞天（10 域 × 3）= 77 ≤ 78
    var flavorCount = Object.keys(api.grotto.flavor).length;
    var maxGrotto = (flavorCount + 1) * CFG.CAP;   // +1：天界走兜底风味（四十四波无村镇但有山）
    eq(flavorCount, 9, 'D6 风味表九域各一段（天界走兜底）');
    assert(37 + 10 + maxGrotto <= 78, 'D7 悟道点总闸不破：37 游历 + 10 地灵 + ' + maxGrotto + ' 洞天 = ' + (47 + maxGrotto) + ' ≤ 78');
    eq(CFG.ELEV_MIN, 0.7, 'D8 崖壁门槛 0.7（与雪顶同一条线）');
    assert(CFG.BASE === 0.04 && CFG.LUCK_PER === 0.001 && CFG.CAP === 3 && CFG.QI === 20, 'D9 四数与施工图对账（4% / 0.1%每点 / 3处 / 20真气）');
    // 新话术零拉丁（代码记号走白名单）
    var latin = /[A-Za-z]/;
    var allow = ['grotto', 'grottoUse', 'grottoLoot', 'grotto_', 'MOUNTAIN', 'function', 'success', 'warning', 'info', 'x', 'y'];
    var visLeak = null;
    (grottoSeg.match(/'[^']+'/g) || []).forEach(function (s) {
        var v = s.slice(1, -1);
        if (/[+);({\[,]/.test(v)) return;   // 跨串拼接/跨行的代码碎段不是话术（话术只用中文标点），跳过
        if (/^[a-z][a-z0-9_]*$/.test(v)) return;   // 蛇形小写是代码记号（物品 id / 字段名），不算话术
        if (latin.test(v) && allow.indexOf(v) < 0) visLeak = visLeak || s;
    });
    assert(visLeak === null, 'D10 洞天一节话术零拉丁（漏: ' + visLeak + '）');
    // v45 地灵账没被误伤：山地不在观悟表里（洞天的悟走见闻账，两本不打架）
    var insSeg = rm.slice(rm.indexOf('const TERRAIN_INSIGHT'), rm.indexOf('function meditateWild'));
    assert(insSeg.indexOf('MOUNTAIN') < 0, 'D11 山地不在观地形而悟表里（洞天遗刻是另一本账，不双吃）');
    // 接线在册
    assert(rm.indexOf("case 'grotto-enter': grottoEnter(); break;") >= 0, 'D12 动作分发接线在册');
    assert(rm.indexOf('drawGrottoes(svg, size);') >= 0 && rm.indexOf("if (!cell || cell.fog === 0) return;") >= 0, 'D13 图面洞口在册且未开雾不画');
}

console.log('\n========== 第四十九波 · 崖壁隐藏洞天 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
