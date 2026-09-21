/**
 * wave46-swim-node.js — 第四十六波 · 泅渡与踏水 验收：
 *   A 泅渡账：真下水真扣、入水门槛、水中硬撑改烧血、暗流走既有管线、漩涡照旧是墙、寻路眼里水仍是墙
 *   B 踏水账：金丹履水如地（省力、免暗流、无门槛）、筑基以下没这待遇、首次风味话术一场一回
 *   C 水上规矩：扎营打坐收起、采集照旧、力竭也游得回岸（永不困死）、寻路能从水上找回岸
 *   D 哨兵：wild-terrain 一字未动、建图段零新调用（零漂移）、零新存档字段、零拉丁、渡口三线数未动
 *
 * 运行：node tests/wave46-swim-node.js
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

// ==================== 共享全局桩（wave45 同源） ====================
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
global.timeSystem = {
    gameTime: { totalMinutes: 0, currentDay: 5, currentHour: 10, currentMinute: 0, currentSeason: 'spring', currentMonth: 3, currentYear: 1 },
    advanceTime: function (m, r) { timeCalls.push({ m: m, r: r }); global.timeSystem.gameTime.totalMinutes += m; },
    getAbsoluteDay: function () { return 800; },
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
global.currentCharData = { health: 100, energy: 100, qi: 50, maxQi: 100, realm: '炼气' };
global.eventFlags = {};
global.PSectWorld = { homeName: function () { return null; } };
global.sectsData = {};
global.DataManager = { getSpiritStones: function () { return 5000; }, deductSpiritStones: function () { return true; }, addSpiritStones: function () {} };

load('js/map/map-markers.js');
load('js/economy/spirit-vein.js');
load('js/map/travel-journal.js');
load('js/core/state-registry.js');
load('js/map/wild-terrain.js');
load('js/map/randomMap.js');

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
function setChar(realm, hp, en) {
    global.currentCharData.realm = realm;
    global.currentCharData.health = hp;
    global.currentCharData.energy = en;
    global.currentCharData._wearyNoticed = false;
    global.currentCharData._spentNoticed = false;
}
function cellAt(x, y) { return (global.currentMap[y] || [])[x] || null; }
function forgeCell(x, y, key) {
    var c = cellAt(x, y);
    if (!c) return null;
    c.terrainKey = key;
    c.terrain = WT.TERRAIN[key];
    c.fog = 1;
    return c;
}
// 从 (bx,by) 出发找一格可改造的邻格（无 POI、无采集点、无实体、已是普通可改地形）
function forgeAdjacentWater(bx, by, skip) {
    var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (var i = 0; i < dirs.length; i++) {
        var nx = bx + dirs[i][0], ny = by + dirs[i][1];
        if (skip && skip.some(function (s) { return s.x === nx && s.y === ny; })) continue;
        var c = cellAt(nx, ny);
        if (!c || c.poiId || c.node || (c.entities || []).length) continue;
        forgeCell(nx, ny, 'WATER');
        return { x: nx, y: ny };
    }
    return null;
}

openSeed('中州', '中州_w46_swim');
global.currentCharData._travel = { regions: {}, marks: {}, steps: 0 };
var CFG = api.swim.CFG;

// ==================== A · 泅渡账 ====================
console.log('\n[A] 泅渡账（下水是力气活，水会记账）');
var w1 = null, w2 = null;
{
    setChar('炼气', 100, 100);
    var p = global.playerPos;
    w1 = forgeAdjacentWater(p.x, p.y, []);
    assert(!!w1, 'A0 岸边应能造出一格水（测试地形）');

    msgs.length = 0; timeCalls.length = 0;
    var ok = withRandom(0.99, function () { return api.stepTo(w1.x, w1.y); });
    eq(ok, true, 'A1 邻格下水：真游过去了');
    eq(global.playerPos.x, w1.x, 'A1b 人站在水格上');
    eq(global.currentCharData.energy, 96, 'A2 泅渡每格耗精力 4（100→96）');
    eq(timeCalls[timeCalls.length - 1].m, 25, 'A3 泅渡每格 25 分钟（无天象拖累时的原账）');
    assert(msgCount('下水了') === 1 && msgCount('莫贪远') === 1, 'A4 头一回下水有告诫（莫贪远岸，寻渡口）');

    // 第二格水（A6 硬撑、B 段踏水都要用）
    w2 = forgeAdjacentWater(w1.x, w1.y, [{ x: p.x, y: p.y }]);
    assert(!!w2, 'A5 水中应能再造一格水');
    msgs.length = 0;
    withRandom(0.99, function () { api.stepTo(w2.x, w2.y); });
    eq(msgCount('下水了'), 0, 'A6 第二格不再念经（风味话术一场一回）');

    // 入水门槛：回到岸上，精力不足 15 不给下水
    withRandom(0.99, function () { api.stepTo(w1.x, w1.y); });
    withRandom(0.99, function () { api.stepTo(p.x, p.y); });
    eq(global.playerPos.x, p.x, 'A7 从水里走回岸上照旧可行（上岸的路永远开着）');
    setChar('炼气', 100, 10);
    msgs.length = 0;
    var refused = withRandom(0.99, function () { return api.stepTo(w1.x, w1.y); });
    eq(refused, false, 'A8 精力 10 想下水：拒（气力不济就是送命）');
    eq(global.playerPos.x, p.x, 'A8b 人还在岸上');
    assert(msgCount('气力不济') === 1, 'A9 拒行有话术（歇到精力足 15，或寻渡口）');

    // 水中力竭硬撑：门槛拦不住已经在水里的人，但改烧气血
    setChar('炼气', 100, 100);
    withRandom(0.99, function () { api.stepTo(w1.x, w1.y); });
    global.currentCharData.energy = 10;
    global.currentCharData.health = 100;
    msgs.length = 0;
    withRandom(0.99, function () { api.stepTo(w2.x, w2.y); });
    eq(global.currentCharData.health, 95, 'A10 水中力竭硬撑：每格改烧 5 气血（100→95）');
    eq(global.currentCharData.energy, 10, 'A10b 精力见底不再扣精力（烧的是血）');
    assert(msgCount('硬撑') === 1, 'A11 硬撑有警告（快上岸或寻渡船）');

    // 暗流：既有危险管线（夜×1.5、雨×1.3、境界减免）自动吃到水
    var hzW = api.terrainHazard({ terrainKey: 'WATER' });
    assert(hzW && hzW.hazard.name === '暗流' && hzW.hazard.hp === 3, 'A12 危险表水行在册：暗流（hp 3）');
    assert(hzW.hazard.hint.indexOf('踏水者无惧') >= 0, 'A13 警示话术把踏水的活路也说了');
    setChar('炼气', 100, 100);
    withRandom(0.99, function () { api.stepTo(w1.x, w1.y); });   // 先回 w1（从 w2 邻格）
    withRandom(0.99, function () { api.stepTo(p.x, p.y); });
    global.timeSystem.gameTime.currentHour = 10;
    msgs.length = 0;
    withRandom(0.01, function () { api.stepTo(w1.x, w1.y); });
    eq(global.currentCharData.health, 97, 'A14 定骰 0.01 泅渡：暗流卷中（气血 -3，管线原样生效）');

    // 漩涡照旧是墙；寻路眼里水照旧是墙
    var wp = forgeAdjacentWater(global.playerPos.x, global.playerPos.y, [w1, w2]);
    forgeCell(wp.x, wp.y, 'WHIRLPOOL');
    msgs.length = 0;
    var refusedWp = api.stepTo(wp.x, wp.y);
    eq(refusedWp, false, 'A15 漩涡仍是墙（不给游的机会）');
    assert(msgCount('过不去') === 1, 'A15b 漩涡拒行话术照旧');
    forgeCell(wp.x, wp.y, 'WATER');
    var grid = global.currentMap.map(function (r) { return r.map(function (c) { return { t: c.terrainKey }; }); });
    eq(WT.findPath(grid, { x: p.x, y: p.y }, w1), null, 'A16 寻路仍拒水（passable 一字未改，绕路/渡口逻辑全不动）');
    eq(WT.passable({ t: 'WATER' }), false, 'A17 passable(WATER) 照旧 false');
}

// ==================== B · 踏水账 ====================
console.log('\n[B] 踏水账（金丹以上，境界在走路上显贵贱）');
{
    var p = global.playerPos;
    // 回岸、开新图（风味账翻篇）
    openSeed('中州', '中州_w46_walk');
    p = global.playerPos;
    var wA = forgeAdjacentWater(p.x, p.y, []);
    var wB = forgeAdjacentWater(wA.x, wA.y, [{ x: p.x, y: p.y }]);

    setChar('金丹', 100, 100);
    msgs.length = 0; timeCalls.length = 0;
    withRandom(0.99, function () { api.stepTo(wA.x, wA.y); });
    assert(msgCount('履水如平地') === 1, 'B1 金丹首次踏水有风味（真元托底，脚底不沾湿）');
    eq(global.currentCharData.energy, 99, 'B2 踏水每格只耗精力 1（100→99）');
    eq(timeCalls[timeCalls.length - 1].m, 20, 'B3 踏水每格 20 分钟（与雇舟同速，省的是船钱）');

    // 免暗流铁证：骰子灌铅必中，踏水者毫发无损；同骰同格，泅渡者中招
    setChar('金丹', 100, 100);
    withRandom(0.99, function () { api.stepTo(wB.x, wB.y); });
    global.currentCharData.health = 100;
    withRandom(0.0, function () { api.stepTo(wA.x, wA.y); });   // 骰 0.0：危险必中（若掷的话）
    eq(global.currentCharData.health, 100, 'B4 骰子灌铅必中，踏水者不掉血（暗流压根没掷——脚不沾水）');
    setChar('炼气', 100, 100);
    withRandom(0.99, function () { api.stepTo(p.x, p.y); });
    withRandom(0.0, function () { api.stepTo(wA.x, wA.y); });
    eq(global.currentCharData.health, 97, 'B5 同骰同格对照：泅渡者照吃暗流（-3 血）');

    // 无入水门槛：真元自足，气力不济也踏得上去
    setChar('金丹', 100, 100);
    withRandom(0.99, function () { api.stepTo(p.x, p.y); });
    setChar('金丹', 100, 5);
    var okLow = withRandom(0.99, function () { return api.stepTo(wA.x, wA.y); });
    eq(okLow, true, 'B6 金丹精力 5 也下水（踏水没有泅渡的门槛）');

    // 元婴同享、筑基没份
    openSeed('中州', '中州_w46_walk2');
    p = global.playerPos;
    var wC = forgeAdjacentWater(p.x, p.y, []);
    setChar('元婴', 100, 100);
    withRandom(0.99, function () { api.stepTo(wC.x, wC.y); });
    eq(global.currentCharData.energy, 99, 'B7 元婴同样踏水（精力 -1）');
    withRandom(0.99, function () { api.stepTo(p.x, p.y); });
    setChar('筑基', 100, 100);
    withRandom(0.99, function () { api.stepTo(wC.x, wC.y); });
    eq(global.currentCharData.energy, 96, 'B8 筑基踏不了水，照泅（精力 -4）——境界的贵贱就在这');
}

// ==================== C · 水上规矩 ====================
console.log('\n[C] 水上规矩（立不住的地方不装能立住）');
{
    // 按钮账：水格上扎营打坐收起，采集照旧
    var actsW = api.tileActions({ terrainKey: 'WATER', terrain: WT.TERRAIN.WATER, poiId: null, node: { kind: 'herb', icon: '🌿', regrowDay: 0 } });
    assert(actsW.some(function (a) { return a.act === 'gather'; }), 'C1 水格有采集点照样采（水草也是货）');
    assert(!actsW.some(function (a) { return a.act === 'camp'; }), 'C2 水格上不给扎营按钮');
    assert(!actsW.some(function (a) { return a.act === 'meditate'; }), 'C3 水格上不给打坐按钮');
    var actsL = api.tileActions({ terrainKey: 'PLAIN', terrain: WT.TERRAIN.PLAIN, poiId: null, node: null });
    assert(actsL.some(function (a) { return a.act === 'camp'; }) && actsL.some(function (a) { return a.act === 'meditate'; }), 'C4 陆格扎营打坐照旧（没误伤）');

    // 直调也拒：poiAction 走后门进来一样拦
    openSeed('中州', '中州_w46_rules');
    var p = global.playerPos;
    var wD = forgeAdjacentWater(p.x, p.y, []);
    setChar('金丹', 100, 100);
    withRandom(0.99, function () { api.stepTo(wD.x, wD.y); });
    msgs.length = 0; timeCalls.length = 0;
    api.poiAction('camp');
    assert(msgCount('水上扎不了营') === 1, 'C5 站在水上调扎营：拒（先上岸再说）');
    eq(timeCalls.length, 0, 'C5b 拒了就不耗一个时辰');
    msgs.length = 0;
    api.poiAction('meditate');
    assert(msgCount('踩水打坐') === 1, 'C6 站在水上调打坐：拒（定不下心）');

    // 永不困死：精力 0 也能爬回岸（吃既有力竭账）；寻路从水上也能找回岸
    global.currentCharData.energy = 0;
    global.currentCharData.health = 100;
    var okOut = withRandom(0.99, function () { return api.stepTo(p.x, p.y); });
    eq(okOut, true, 'C7 精力见底也上得了岸（力竭账照收，人绝不困死在水里）');
    eq(global.currentCharData.health, 98, 'C8 力竭硬撑每格 -2 血（既有账原样生效）');
    setChar('金丹', 100, 100);
    withRandom(0.99, function () { api.stepTo(wD.x, wD.y); });
    var grid = global.currentMap.map(function (r) { return r.map(function (c) { return { t: c.terrainKey }; }); });
    var back = WT.findPath(grid, { x: wD.x, y: wD.y }, { x: p.x, y: p.y });
    assert(!!back && back.path.length >= 1, 'C9 寻路从水上起点也能规划回岸（点远处陆地就走得动）');
    withRandom(0.99, function () { api.stepTo(p.x, p.y); });

    // 非相邻水格点击：指路话术（不再干巴巴一句过不去）
    var far = forgeCell(p.x + 2 >= global.currentMap[0].length ? p.x - 2 : p.x + 2, p.y, 'WATER');
    msgs.length = 0;
    global.onCellClick(far === cellAt(p.x - 2, p.y) ? p.x - 2 : p.x + 2, p.y);
    assert(msgCount('水面寻路不得') === 1, 'C10 远处水面点不动时给指路（贴岸泅过去/金丹踏水/寻渡口）');
}

// ==================== D · 哨兵 ====================
console.log('\n[D] 哨兵（零漂移、零新账、零拉丁）');
{
    var rm = fs.readFileSync(path.join(ROOT, 'js/map/randomMap.js'), 'utf8');
    var wt = fs.readFileSync(path.join(ROOT, 'js/map/wild-terrain.js'), 'utf8');
    // 地形真源一字未动：水仍是 passable:false moveCost:99
    assert(/WATER:\s*\{[^}]*moveCost: 99,[^}]*passable: false/.test(wt), 'D1 wild-terrain 的水墙原样（passable:false / moveCost:99 一字未动）');
    assert(/WHIRLPOOL:\s*\{[^}]*passable: false/.test(wt), 'D2 漩涡仍是墙');
    // 建图段零新调用（骰序零漂移）
    var buildSeg = rm.slice(rm.indexOf('function buildWildMap'), rm.indexOf('function stepTo'));
    assert(buildSeg.indexOf('SWIM_') < 0 && buildSeg.indexOf('WATERWALK') < 0 && buildSeg.indexOf('_waterEntryNoticed') < 0,
        'D3 建图段无泅渡踏水任何调用（建图骰序零漂移）');
    // 泅渡段零随机、零新存档字段
    var swimSeg = rm.slice(rm.indexOf('const _isWater = cell.terrainKey'), rm.indexOf('const _cdStep = window.currentCharData'));
    assert(swimSeg.indexOf('Math.random') < 0, 'D4 泅渡分支零随机数（暗流骰在既有 applyTerrainHazard 里）');
    assert(swimSeg.indexOf('currentCharData._') < 0 && swimSeg.indexOf('cd._') < 0, 'D5 泅渡分支零新存档字段（风味账是运行时变量，开图即翻篇）');
    // 新话术零拉丁（地形键与危险 id 是代码记号，不算话术）
    var latin = /[A-Za-z]/;
    var visLeak = null;
    var segs = [swimSeg, rm.slice(rm.indexOf('// 第四十六波 · 泅渡与踏水：水格不走寻路'), rm.indexOf('const res = WildTerrain.findPath(currentMap'))];
    var hzStart = rm.indexOf("WATER:      { id: 'undercurrent'");
    segs.push(rm.slice(hzStart, rm.indexOf('\n', hzStart)));   // 只切 WATER 一行，别淌进邻行既有的 hazard id
    segs.forEach(function (seg) {
        (seg.match(/'[^']+'/g) || []).forEach(function (s) {
            var v = s.slice(1, -1);
            if (latin.test(v) && ['WATER', 'WHIRLPOOL', 'CREVASSE', 'undercurrent', 'function', 'warning', 'info'].indexOf(v) < 0) visLeak = visLeak || s;   // 第八十九波：漩涡/冰隙与水同为地形键（代码记号，不算话术）
        });
    });
    assert(visLeak === null, 'D6 新话术零拉丁（漏: ' + visLeak + '）');
    // 点击拦截在寻路之前（第八十九波扩口径：天险格贴着掠与水格同款，拦截仍在寻路之前）
    assert(rm.includes("dist === 1 && (cell.terrainKey === 'WATER' || isAloftCell(cell))"), 'D7 邻格水/天险点击拦截在册（onCellClick）');
    // 渡口三线数未动（泅渡不抢船家生意）
    assert(rm.includes('const FERRY_FARE = 5;') && rm.includes('const FERRY_MIN_PER_CELL = 20;'), 'D8 渡口账未动（船钱 5 / 每格 20 分钟）');
    assert(CFG.SWIM_MIN === 25 && CFG.SWIM_EN === 4 && CFG.GATE === 15 && CFG.FORCE_HP === 5 &&
        CFG.WALK_MIN === 20 && CFG.WALK_EN === 1 && CFG.WALK_TIER === 3, 'D9 泅渡踏水七数与施工图对账（25/4/15/5/20/1/金丹3）');
    assert(CFG.SWIM_MIN > 20, 'D10 泅渡慢于雇舟（25 > 20，人力不如帆——梯度不倒挂）');
    // v20.58 的无险名单没被误伤
    ['PLAIN', 'ROAD', 'SPRING'].forEach(function (k) {
        assert(api.terrainHazard({ terrainKey: k }) === null, 'D11 ' + k + ' 照旧无险');
    });
    assert(api.terrainHazard({ terrainKey: 'MOUNTAIN' }) !== null && api.terrainHazard({ terrainKey: 'FOREST' }) !== null,
        'D12 四十五波的落石荆棘还在册');
}

console.log('\n========== 第四十六波 · 泅渡与踏水 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
