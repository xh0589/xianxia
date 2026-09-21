/**
 * wave47-season-terrain-node.js — 第四十七波 · 四时改地 验收：
 *   A 冬冰：封冻河面成路（20 分/格、精力 1、无泅渡门槛）、冰裂走既有管线、漩涡照旧是墙、
 *          渡口冬歇、冰上扎营打坐放行、冰道撞陆生活物、泅渡账冬天全程不触发
 *   B 春汛：浅滩耗时 ×1.5（30→45 分）、湿寒概率 ×1.5（0.06→0.09）、首次涉水话术一场一回
 *   C 夏瘴：沼泽 0.10→0.13、瘴沼 0.20→0.26
 *   D 秋如常：全乘子归一，水照旧是泅渡的水
 *   E 换季：水中入冬能走出来、冰上入春泅得回岸、冬天寻路穿冰、春天寻路照旧拒水
 *   F 哨兵：wild-terrain 既有行原样、RIVER_ICE 纯新增、建图段零季节调用（骰序零漂移）、
 *          渡口/v46 常数未动、saveWildState 字段未变、新话术零拉丁、梯度不倒挂
 *
 * 运行：node tests/wave47-season-terrain-node.js
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
function load(rel) {
    vm.runInThisContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), { filename: rel });
}

// ==================== 共享全局桩（wave46 同源） ====================
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
function setSeason(s) { global.timeSystem.gameTime.currentSeason = s; }
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
function forgeAdjacent(bx, by, key, skip) {
    var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (var i = 0; i < dirs.length; i++) {
        var nx = bx + dirs[i][0], ny = by + dirs[i][1];
        if (skip && skip.some(function (s) { return s.x === nx && s.y === ny; })) continue;
        var c = cellAt(nx, ny);
        if (!c || c.poiId || c.node || (c.entities || []).length) continue;
        forgeCell(nx, ny, key);
        return { x: nx, y: ny };
    }
    return null;
}
function seasonGrid() {
    return global.currentMap.map(function (r) { return r.map(function (c) { return { t: api.season.key(c) }; }); });
}

openSeed('中州', '中州_w47_season');
global.currentCharData._travel = { regions: {}, marks: {}, steps: 0 };
var CFG = api.season.CFG;
var SW = api.swim.CFG;

// ==================== A · 冬冰 ====================
console.log('\n[A] 冬冰（河面封冻，冰面就是冬天的渡口）');
var w1 = null, w2 = null;
{
    setSeason('winter');
    openSeed('中州', '中州_w47_ice');
    var p = global.playerPos;
    setChar('炼气', 100, 100);
    w1 = forgeAdjacent(p.x, p.y, 'WATER', []);
    assert(!!w1, 'A0 岸边应能造出一格水（测试地形）');
    w2 = forgeAdjacent(w1.x, w1.y, 'WATER', [{ x: p.x, y: p.y }]);
    assert(!!w2, 'A0b 水中应能再造一格水');

    eq(api.season.key({ terrainKey: 'WATER' }), 'RIVER_ICE', 'A1 冬天季节覆层：水面在账上是河冰');
    eq(api.season.key({ terrainKey: 'WHIRLPOOL' }), 'WHIRLPOOL', 'A1b 漩涡不映射（活水冻不实，照旧是墙）');

    msgs.length = 0; timeCalls.length = 0;
    var ok = withRandom(0.99, function () { return api.stepTo(w1.x, w1.y); });
    eq(ok, true, 'A2 冬天邻格上冰：真走过去了');
    eq(global.playerPos.x, w1.x, 'A2b 人站在冰格上');
    eq(timeCalls[timeCalls.length - 1].m, 20, 'A3 冰行每格 20 分钟（河冰 moveCost 2 ×10，与雇舟同速）');
    eq(global.currentCharData.energy, 99, 'A4 冰行每格精力 -1（吃陆账，不是泅渡的 -4）');
    assert(msgCount('河面封了冻') === 1, 'A5 头一回踏上冬冰有风味（冰面是路，当心冰裂）');
    assert(msgCount('下水了') === 0 && msgCount('泅水一格一格') === 0, 'A6 泅渡账冬天全程不触发（冰上没有泅渡）');

    msgs.length = 0;
    withRandom(0.99, function () { api.stepTo(w2.x, w2.y); });
    eq(msgCount('河面封了冻'), 0, 'A7 第二格冰不再念经（一场一回）');

    // 无泅渡门槛：精力 10 照走（冰是实地）
    setChar('炼气', 100, 10);
    var okLow = withRandom(0.99, function () { return api.stepTo(w1.x, w1.y); });
    eq(okLow, true, 'A8 精力 10 也上得了冰（泅渡的入水门槛管不着冰面）');

    // 冰裂：定骰必中，走既有危险管线（炼气减免 ×0.94 → 0.0752，骰 0.01 命中）
    setChar('炼气', 100, 100);
    withRandom(0.99, function () { api.stepTo(p.x, p.y); });
    global.timeSystem.gameTime.currentHour = 10;
    msgs.length = 0;
    withRandom(0.01, function () { api.stepTo(w1.x, w1.y); });
    eq(global.currentCharData.health, 96, 'A9 定骰 0.01 冰行：冰裂咬中（气血 -4）');
    eq(global.currentCharData.energy, 97, 'A9b 冰裂再扣精力 2（100-1 步账-2 险账=97）');
    var hzW = api.terrainHazard({ terrainKey: 'WATER' });
    assert(hzW && hzW.hazard.name === '冰裂', 'A10 冬天水面查危险表：出的是冰裂（有效地形口径）');
    setSeason('spring');
    var hzS = api.terrainHazard({ terrainKey: 'WATER' });
    assert(hzS && hzS.hazard.name === '暗流', 'A11 春天同查：暗流原样回来（v46 的账没被吃掉）');
    setSeason('winter');

    // 漩涡冬天照旧是墙
    var wp = forgeAdjacent(global.playerPos.x, global.playerPos.y, 'WHIRLPOOL', [w1, w2]);
    msgs.length = 0;
    eq(api.stepTo(wp.x, wp.y), false, 'A12 漩涡冬天仍是墙');
    assert(msgCount('过不去') === 1, 'A12b 漩涡拒行话术照旧');
    forgeCell(wp.x, wp.y, 'WATER');

    // 渡口冬歇：直接调 ferryTravel 也被拦，不扣一个子儿不耗一刻钟
    msgs.length = 0; timeCalls.length = 0;
    api.ferryTravel('nonexistent-ferry');
    assert(msgCount('拖上了岸') === 1, 'A13 冬天雇舟：船家冬歇（船拖上了岸，冰面就是渡口）');
    eq(timeCalls.length, 0, 'A13b 冬歇拒行不耗时');

    // 冰上扎营打坐放行（冰是实地）
    var actsIce = api.tileActions(cellAt(w1.x, w1.y));
    assert(actsIce.some(function (a) { return a.act === 'camp'; }), 'A14 冬天冰格上有扎营按钮');
    assert(actsIce.some(function (a) { return a.act === 'meditate'; }), 'A14b 冬天冰格上有打坐按钮');
    setSeason('spring');
    var actsWater = api.tileActions(cellAt(w1.x, w1.y));
    assert(!actsWater.some(function (a) { return a.act === 'camp'; }) && !actsWater.some(function (a) { return a.act === 'meditate'; }),
        'A15 春天同格是水面：扎营打坐照旧收起（v46 规矩没破）');
    setSeason('winter');

    // 冰道遭遇：撞的是陆上活物
    var fl = api.habitatFlavor({ terrainKey: 'RIVER_ICE' });
    assert(fl.beasts.indexOf('冰狼') >= 0 && fl.beasts.indexOf('水蛟') < 0, 'A16 冰道遭遇池是陆生（冰狼在、水蛟不在）');

    // 冰上直调打坐不再被「踩水打坐」拦
    withRandom(0.99, function () { api.stepTo(w1.x, w1.y); });
    msgs.length = 0; timeCalls.length = 0;
    api.poiAction('meditate');
    eq(msgCount('踩水打坐'), 0, 'A17 冬天冰上直调打坐：不拦（踩水定不下心是春天的事）');
}

// ==================== B · 春汛 ====================
console.log('\n[B] 春汛（浅滩淹到腰，过得去过得慢）');
{
    setSeason('spring');
    openSeed('中州', '中州_w47_ford');
    var p = global.playerPos;
    setChar('凡人', 100, 100);   // 凡人 tier 0：危险概率零减免，好对账
    var fd = forgeAdjacent(p.x, p.y, 'FORD', []);
    assert(!!fd, 'B0 岸边应能造出一格浅滩（测试地形）');

    near(api.seasonTravelMul({ terrainKey: 'FORD' }), 1.5, 'B1 春天浅滩耗时 ×1.5');
    setSeason('winter');
    near(api.seasonTravelMul({ terrainKey: 'FORD' }), 1, 'B2 冬天浅滩照旧（冬账只管雪线冻土）');
    setSeason('summer');
    near(api.seasonTravelMul({ terrainKey: 'FORD' }), 1, 'B2b 夏天浅滩照旧');
    setSeason('spring');

    msgs.length = 0; timeCalls.length = 0;
    withRandom(0.99, function () { api.stepTo(fd.x, fd.y); });
    eq(timeCalls[timeCalls.length - 1].m, 45, 'B3 春天蹚浅滩：3×10×1.5=45 分钟/格');
    assert(msgCount('春汛涨了水') === 1, 'B4 头一回春天涉水有话术（耗时多五成，湿寒更易上身）');
    msgs.length = 0;
    withRandom(0.99, function () { api.stepTo(p.x, p.y); });
    withRandom(0.99, function () { api.stepTo(fd.x, fd.y); });
    eq(msgCount('春汛涨了水'), 0, 'B5 第二回不念经（一场一回）');

    setChar('凡人', 100, 100);
    near(api.terrainHazard({ terrainKey: 'FORD' }).chance, 0.09, 'B6 春天浅滩湿寒 0.06×1.5=0.09');
    setSeason('winter');
    near(api.terrainHazard({ terrainKey: 'FORD' }).chance, 0.06, 'B7 冬天浅滩湿寒照旧 0.06');
}

// ==================== C · 夏瘴 ====================
console.log('\n[C] 夏瘴（暑热蒸瘴，沼泽毒气最凶）');
{
    setSeason('summer');
    setChar('凡人', 100, 100);
    near(api.terrainHazard({ terrainKey: 'SWAMP' }).chance, 0.13, 'C1 夏天沼泽瘴气 0.10×1.3=0.13');
    near(api.terrainHazard({ terrainKey: 'MIASMA' }).chance, 0.26, 'C2 夏天瘴沼 0.20×1.3=0.26');
    setSeason('spring');
    near(api.terrainHazard({ terrainKey: 'SWAMP' }).chance, 0.10, 'C3 春天沼泽照旧 0.10（春汛不蒸瘴）');
    setSeason('summer');
    near(api.terrainHazard({ terrainKey: 'MOUNTAIN' }).chance, 0.06, 'C4 夏天山地落石照旧（暑瘴只咬沼泽瘴沼）');
}

// ==================== D · 秋如常 ====================
console.log('\n[D] 秋如常（没有惩罚，本身就是远行的季节）');
{
    setSeason('autumn');
    setChar('凡人', 100, 100);
    near(api.seasonTravelMul({ terrainKey: 'FORD' }), 1, 'D1 秋天浅滩耗时照旧');
    near(api.seasonTravelMul({ terrainKey: 'SNOW' }), 1, 'D2 秋天雪线照旧（冬账不预支）');
    near(api.terrainHazard({ terrainKey: 'SWAMP' }).chance, 0.10, 'D3 秋天沼泽照旧');
    eq(api.season.key({ terrainKey: 'WATER' }), 'WATER', 'D4 秋天水面就是水面（覆层只在冬天）');
    assert(api.terrainHazard({ terrainKey: 'WATER' }).hazard.name === '暗流', 'D5 秋天泅渡照吃暗流');
}

// ==================== E · 换季 ====================
console.log('\n[E] 换季（人在水里天冷了、人在冰上天暖了，都困不死）');
{
    setSeason('spring');
    openSeed('中州', '中州_w47_turn');
    var p = global.playerPos;
    setChar('炼气', 100, 100);
    var wA = forgeAdjacent(p.x, p.y, 'WATER', []);
    var wB = forgeAdjacent(wA.x, wA.y, 'WATER', [{ x: p.x, y: p.y }]);

    // 春：泅渡上 wA；冬来了：冰上照走，寻路也穿冰
    withRandom(0.99, function () { api.stepTo(wA.x, wA.y); });
    eq(global.playerPos.x, wA.x, 'E1 春天泅渡到 wA（v46 原样）');
    setSeason('winter');
    var okOut = withRandom(0.99, function () { return api.stepTo(p.x, p.y); });
    eq(okOut, true, 'E2 人在水里冬天来了：照样走得动（冰与岸都是路）');
    var okIce = withRandom(0.99, function () { return api.stepTo(wA.x, wA.y); });
    eq(okIce, true, 'E3 再上 wA 已是冰行');
    var resW = WT.findPath(seasonGrid(), { x: p.x, y: p.y }, { x: wB.x, y: wB.y });
    assert(!!resW && resW.path.length >= 2, 'E4 冬天寻路穿冰：两格外的水面规划得出来');
    setSeason('spring');
    var resS = WT.findPath(seasonGrid(), { x: p.x, y: p.y }, { x: wB.x, y: wB.y });
    eq(resS, null, 'E5 春天寻路照旧拒水（passable 一字未改）');

    // 冬：站上冰；春来了：冰化人落水，泅得回岸（回岸的路永远开着）
    setSeason('winter');
    withRandom(0.99, function () { api.stepTo(wA.x, wA.y); });
    eq(global.playerPos.x, wA.x, 'E6 冬天站上冰面');
    setSeason('spring');
    setChar('炼气', 100, 100);
    var okSwimOut = withRandom(0.99, function () { return api.stepTo(p.x, p.y); });
    eq(okSwimOut, true, 'E7 冰上入春落了水：泅得回岸（永不困死铁律不破）');
    eq(global.playerPos.x, p.x, 'E7b 人已上岸');
    setSeason('spring');
}

// ==================== F · 哨兵 ====================
console.log('\n[F] 哨兵（零漂移、零新账、零拉丁）');
{
    var rm = fs.readFileSync(path.join(ROOT, 'js/map/randomMap.js'), 'utf8');
    var wt = fs.readFileSync(path.join(ROOT, 'js/map/wild-terrain.js'), 'utf8');
    // 地形真源：既有行原样，RIVER_ICE 纯新增
    assert(/WATER:\s*\{[^}]*moveCost: 99,[^}]*passable: false/.test(wt), 'F1 wild-terrain 的水墙原样（99/false 一字未动）');
    assert(/FORD:\s*\{[^}]*moveCost: 3,[^}]*passable: true/.test(wt), 'F2 浅滩原样（3/true）');
    assert(/RIVER_ICE:\s*\{[^}]*moveCost: 2,[^}]*passable: true/.test(wt), 'F3 河冰在册（2/true，纯新增一行）');
    assert(/WHIRLPOOL:\s*\{[^}]*passable: false/.test(wt), 'F4 漩涡仍是墙');
    // 建图函数零季节调用（骰序零漂移）——只切 buildWildMap 函数本体；渲染/图例段的河冰显示引用不吃骰子，不在本哨兵口径
    var bStart = rm.indexOf('function buildWildMap');
    var buildSeg = rm.slice(bStart, rm.indexOf('\nfunction ', bStart + 10));
    assert(buildSeg.indexOf('seasonTerrainKey') < 0 && buildSeg.indexOf('isFrozenNow') < 0 && buildSeg.indexOf('_iceEntryNoticed') < 0 && buildSeg.indexOf('RIVER_ICE') < 0,
        'F5 建图段无季节覆层任何调用（建图骰序零漂移）');
    // 覆层纯函数零随机
    var helperSeg = rm.slice(rm.indexOf('function isFrozenNow'), rm.indexOf('// 冬天雪线/冻土赶路更慢'));
    assert(helperSeg.indexOf('Math.random') < 0, 'F6 季节覆层是纯函数（零随机数）');
    // 存档字段清单未变
    var saveSeg = rm.slice(rm.indexOf('function saveWildState'), rm.indexOf('function applyWildState'));
    assert(saveSeg.indexOf('season') < 0 && saveSeg.indexOf('frozen') < 0 && saveSeg.indexOf('ice') < 0,
        'F7 saveWildState 零新字段（地形本就不入档，季节在 timeSystem 里）');
    // v46 与渡口常数未动
    assert(SW.SWIM_MIN === 25 && SW.SWIM_EN === 4 && SW.GATE === 15 && SW.FORCE_HP === 5 && SW.WALK_MIN === 20 && SW.WALK_EN === 1 && SW.WALK_TIER === 3,
        'F8 v46 泅渡踏水七数未动');
    assert(rm.includes('const FERRY_FARE = 5;') && rm.includes('const FERRY_MIN_PER_CELL = 20;'), 'F9 渡口账未动（5 灵石 / 20 分钟）');
    assert(CFG.FORD_SPRING_MUL === 1.5 && CFG.FORD_SPRING_HAZ_MUL === 1.5 && CFG.SWAMP_SUMMER_HAZ_MUL === 1.3 && CFG.ICE_MOVE === 2,
        'F10 四时改地四数与施工图对账（1.5/1.5/1.3/2）');
    assert(CFG.ICE_MOVE * 10 === 20 && 20 <= SW.SWIM_MIN, 'F11 梯度不倒挂（冰行 20 分 ≤ 泅渡 25 分；与雇舟同速省船钱）');
    // 新话术零拉丁（只扫本波新增的五段话术字面量）
    var latin = /[A-Za-z]/;
    var newMsgs = [
        rm.slice(rm.indexOf('🧊 河面封了冻'), rm.indexOf('🧊 河面封了冻') + 120).split("'")[0],
        rm.slice(rm.indexOf('🌊 春汛涨了水'), rm.indexOf('🌊 春汛涨了水') + 120).split("'")[0],
        rm.slice(rm.indexOf('⛴️ 河面封了冻'), rm.indexOf('⛴️ 河面封了冻') + 120).split("'")[0],
        rm.slice(rm.indexOf('❄️ 冬歇'), rm.indexOf('❄️ 冬歇') + 120).split("'")[0],
        rm.slice(rm.indexOf('⛴️ 渡口（冬歇'), rm.indexOf('⛴️ 渡口（冬歇') + 60).split("'")[0]
    ];
    var leak = null;
    newMsgs.forEach(function (raw) {
        var s = raw.replace(/<[^>]*>/g, '');   // 告示里的 HTML 标签是代码记号，不算话术
        if (latin.test(s)) leak = leak || s;
    });
    assert(leak === null && newMsgs.every(function (s) { return s.length > 4; }), 'F12 五段新话术零拉丁（漏: ' + leak + '）');
    // v45/v46 的老哨兵口径没被本波吃掉
    ['PLAIN', 'ROAD', 'SPRING'].forEach(function (k) {
        setSeason('spring');
        assert(api.terrainHazard({ terrainKey: k }) === null, 'F13 ' + k + ' 照旧无险（春）');
    });
    setSeason('winter');
    assert(api.terrainHazard({ terrainKey: 'MOUNTAIN' }).hazard.name === '落石', 'F14 冬天山地落石还在册');
    setSeason('spring');
}

console.log('\n========== 第四十七波 · 四时改地 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
