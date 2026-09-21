/**
 * wave45-terrain-insight-node.js — 第四十五波 · 地灵相应 验收：
 *   A 观地形而悟：十种奇景地形头一回打坐各有一悟、一生一次账、零随机（毒骰铁证）、悟道点总闸
 *   B 山地落石与林海荆棘：危险表补齐、夜晚与境界修正照走既有管线、真踩真掉血
 *   C 哨兵：零新存档字段、建图段零新调用（零漂移）、零拉丁
 *
 * 运行：node tests/wave45-terrain-insight-node.js
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
global.timeSystem = {
    gameTime: { totalMinutes: 0, currentDay: 5, currentHour: 10, currentMinute: 0, currentSeason: 'spring', currentMonth: 3, currentYear: 1 },
    advanceTime: function () {},
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
global.currentCharData = { health: 100, energy: 100, qi: 50, maxQi: 100, realm: '金丹' };
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
function footCell(terrainKey) {
    var p = global.playerPos;
    var cell = global.currentMap[p.y][p.x];
    cell.terrainKey = terrainKey;
    cell.terrain = WT.TERRAIN[terrainKey];
    cell.poiId = null;
    return cell;
}
function insight() { return Number(global.window.insightPoints) || 0; }
function meditate() { withRandom(0.99, function () { api.poiAction('meditate'); }); }

openSeed('蜀地', '蜀地_w45_insight');
global.currentCharData._travel = { regions: {}, marks: {}, steps: 0 };
global.window.insightPoints = 0;
global.timeSystem.gameTime.currentHour = 10;   // 白日（夜里打坐会被遭遇打断，顿悟账测不准）

// ==================== A · 观地形而悟 ====================
console.log('\n[A] 观地形而悟（机缘贵在初遇，不在枯坐）');
{
    footCell('SWORDTOMB');
    msgs.length = 0;
    meditate();
    eq(insight(), 1, 'A1 剑冢头一回打坐：悟了（悟道点 +1）');
    assert(msgs.some(function (m) { return m.m.indexOf('剑冢') >= 0 && m.m.indexOf('剑意') >= 0; }), 'A2 顿悟话术有景有理（万剑余气、剑意明了）');
    eq(global.currentCharData._travel.marks['terrain_SWORDTOMB'], 1, 'A3 悟账落在游历见闻的一次性账上（markOnce 真源）');
    msgs.length = 0;
    meditate();
    eq(insight(), 1, 'A4 同地枯坐第二回：悟道点分文不涨（一生一次）');
    eq(msgCount('吐纳'), 1, 'A5 第二回只有吐纳账，没有第二次悟');

    footCell('VOLCANO');
    meditate();
    eq(insight(), 2, 'A6 换个奇景（火山）又悟一回——一地一本账');

    footCell('PLAIN');
    msgs.length = 0;
    meditate();
    eq(insight(), 2, 'A7 平原打坐：无奇景可悟（平原不产顿悟，账不滥发）');

    // 毒骰铁证：顿悟全程零随机
    footCell('QIPOOL');
    var origRandom = Math.random;
    var threw = null;
    Math.random = function () { throw new Error('毒骰：谁掷谁死'); };
    try { api.poiAction('meditate'); } catch (e) { threw = e; }
    Math.random = origRandom;
    assert(threw === null, 'A8 毒骰之下顿悟照成（零随机铁证，不搅建图骰序）');
    eq(insight(), 3, 'A9 玉液池的悟真落了账');

    // 表册与总闸
    var rm = fs.readFileSync(path.join(ROOT, 'js/map/randomMap.js'), 'utf8');
    var tbl = rm.slice(rm.indexOf('const TERRAIN_INSIGHT'), rm.indexOf('function meditateWild'));
    var keys = (tbl.match(/^    [A-Z]+:/gm) || []).map(function (s) { return s.trim().replace(':', ''); });
    eq(keys.length, 10, 'A10 奇景顿悟恰十种（总闸：游历37+地灵10=47，不过悟道树78）');
    assert(keys.every(function (k) { return !!WT.TERRAIN[k]; }), 'A11 十种全是真在册的地形（无幽灵键）');
    assert(global.TravelJournal.summary().marks >= 3, 'A12 侧栏小账数得上这些悟（marks 含 terrain_*）');
}

// ==================== B · 山地落石与林海荆棘 ====================
console.log('\n[B] 山地落石与林海荆棘（险地才像险地）');
{
    var hM = api.terrainHazard({ terrainKey: 'MOUNTAIN' });
    assert(hM && hM.hazard.name === '落石', 'B1 山地危险在册：落石');
    eq(hM.hazard.hp, 4, 'B2 落石真掉血（4 点）');
    var hF = api.terrainHazard({ terrainKey: 'FOREST' });
    assert(hF && hF.hazard.name === '荆棘', 'B3 林海危险在册：荆棘');
    assert(api.terrainHazard({ terrainKey: 'PLAIN' }) === null, 'B4 平原无险（照旧）');

    // 夜晚更凶：×1.5（既有管线自动吃到新两行）
    global.timeSystem.gameTime.currentHour = 10;
    var dayC = api.terrainHazard({ terrainKey: 'MOUNTAIN' }).chance;
    global.timeSystem.gameTime.currentHour = 23;
    var nightC = api.terrainHazard({ terrainKey: 'MOUNTAIN' }).chance;
    assert(Math.abs(nightC / dayC - 1.5) < 1e-9, 'B5 夜里落石 ×1.5（走的是既有管线，不是各算各的）');
    global.timeSystem.gameTime.currentHour = 10;

    // 境界减免：金丹比炼气扛得住
    var chanceJindan = api.terrainHazard({ terrainKey: 'MOUNTAIN' }).chance;
    global.currentCharData.realm = '炼气';
    var chanceLianqi = api.terrainHazard({ terrainKey: 'MOUNTAIN' }).chance;
    assert(chanceJindan < chanceLianqi, 'B6 修为高者险地伤他不动（既有减免照吃新两行）');
    global.currentCharData.realm = '金丹';

    // 真踩真掉：定骰 0.01 踩山地
    var p = global.playerPos;
    var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    var mtn = null;
    for (var i = 0; i < dirs.length && !mtn; i++) {
        var nx = p.x + dirs[i][0], ny = p.y + dirs[i][1];
        var c = global.currentMap[ny] && global.currentMap[ny][nx];
        if (c && !c.poiId && !c.node) { c.terrainKey = 'MOUNTAIN'; c.terrain = WT.TERRAIN.MOUNTAIN; mtn = { x: nx, y: ny }; }
    }
    global.currentCharData.health = 100;
    msgs.length = 0;
    withRandom(0.01, function () { api.stepTo(mtn.x, mtn.y); });
    eq(global.currentCharData.health, 96, 'B7 骰 0.01 踩山地：落石砸实（气血 100→96）');
    eq(msgCount('落石入体'), 1, 'B8 落石有话术（碎石擦肩，半边身子发麻）');
    global.currentCharData.health = 100;
    withRandom(0.99, function () { api.stepTo(p.x, p.y); });   // 回原地（平原，无险）
    withRandom(0.99, function () { api.stepTo(mtn.x, mtn.y); });
    eq(global.currentCharData.health, 100, 'B9 骰 0.99：这片山坡安静得很（6% 不是步步砸）');

    // 荆棘：踩林海掉 1 血
    var p2 = global.playerPos;
    var fst = null;
    for (var j = 0; j < dirs.length && !fst; j++) {
        var fx = p2.x + dirs[j][0], fy = p2.y + dirs[j][1];
        var fc = global.currentMap[fy] && global.currentMap[fy][fx];
        if (fc && !fc.poiId && !fc.node && !(fx === mtn.x && fy === mtn.y)) { fc.terrainKey = 'FOREST'; fc.terrain = WT.TERRAIN.FOREST; fst = { x: fx, y: fy }; }
    }
    global.currentCharData.health = 100;
    msgs.length = 0;
    withRandom(0.01, function () { api.stepTo(fst.x, fst.y); });
    eq(global.currentCharData.health, 99, 'B10 林海荆棘：划破手背（-1 气血，比落石轻——林子缠人不杀人）');
    eq(msgCount('荆棘入体'), 1, 'B11 荆棘有话术');
}

// ==================== C · 哨兵 ====================
console.log('\n[C] 哨兵（零新账、零漂移、零拉丁）');
{
    var rm = fs.readFileSync(path.join(ROOT, 'js/map/randomMap.js'), 'utf8');
    // v45 两段（顿悟表+钩子、危险表新两行）零新存档字段
    var seg1 = rm.slice(rm.indexOf('第四十五波 · 地灵相应'), rm.indexOf('function springRitual'));
    assert(seg1.indexOf('cd._') < 0 && seg1.indexOf('currentCharData._') < 0, 'C1 顿悟段零新存档字段（账全在游历见闻的 marks 里）');
    assert(seg1.indexOf('Math.random') < 0, 'C2 顿悟段零随机数');
    // 建图段无 v45 调用（骰序零漂移）
    var buildSeg = rm.slice(rm.indexOf('function buildWildMap'), rm.indexOf('function stepTo'));
    assert(buildSeg.indexOf('TERRAIN_INSIGHT') < 0, 'C3 建图段无顿悟表调用（零漂移）');
    assert(rm.includes("markOnce('terrain_'") && rm.includes('window.TravelJournal.markOnce'), 'C4 顿悟账走游历见闻真源（不另立账本）');
    assert(rm.includes("MOUNTAIN:   { id: 'rockfall'") && rm.includes("FOREST:     { id: 'bramble'"), 'C5 危险表新两行在册（走既有 applyTerrainHazard 管线）');
    // 玩家可见话术零拉丁
    var latin = /[A-Za-z]/;
    var visLeak = null;
    var tblSeg = rm.slice(rm.indexOf('const TERRAIN_INSIGHT'), rm.indexOf('function meditateWild'));
    (tblSeg.match(/'[^']+'/g) || []).forEach(function (s) { if (latin.test(s.slice(1, -1))) visLeak = s; });
    (rm.slice(rm.indexOf("MOUNTAIN:   { id: 'rockfall'"), rm.indexOf("SWAMP:      { id: 'miasma'")).match(/'[^']+'/g) || []).forEach(function (s) {
        if (latin.test(s.slice(1, -1)) && ['rockfall', 'bramble'].indexOf(s.slice(1, -1)) < 0) visLeak = visLeak || s;
    });
    assert(visLeak === null, 'C6 新话术零拉丁（漏: ' + visLeak + '）');
    // 总闸哨兵：悟道树 78 点总账没被顶爆（37+10=47）
    var tj = fs.readFileSync(path.join(ROOT, 'js/map/travel-journal.js'), 'utf8');
    assert(tj.indexOf('37 点') > 0, 'C7 游历账 37 点封顶注记未动（地灵 10 点另有闸，合计 47 < 78）');
}

console.log('\n========== 第四十五波 · 地灵相应 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
