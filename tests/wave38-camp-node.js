/**
 * wave38-camp-node.js — 第三十八波 · 扎营与昼夜行路 验收：
 *   A 力竭账：精力 <20 每格耗时 ×1.3、精力 0 硬撑每格掉血 2、话术只说一次、恢复后翻篇
 *   B 扎营歇夜：时间真推到次日清晨六点、恢复真入账、夜袭骰按地形修正、走现成遭遇通道开真战斗
 *   C 源码哨兵：强制遭遇的参数向后兼容、老调用一字未动
 *
 * 运行：node tests/wave38-camp-node.js
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

// ==================== 共享全局桩（wave36 同源） ====================
global.window = global;

var els = {};
function fakeEl(tag) {
    var el = {
        tag: tag || '', children: [], style: {}, _attrs: {}, parentNode: null,
        setAttribute: function (k, v) { this._attrs[k] = v; },
        getAttribute: function (k) { return this._attrs[k]; },
        appendChild: function (c) { this.children.push(c); c.parentNode = this; return c; },
        removeChild: function (c) { var i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return c; },
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
var timeCalls = [];   // advanceTime 全录：{ m, reason }
global.timeSystem = {
    gameTime: { totalMinutes: 0, currentDay: 5, currentHour: 14, currentMinute: 0, currentSeason: 'spring', currentMonth: 3, currentYear: 1 },
    advanceTime: function (m, reason) { global.timeSystem.gameTime.totalMinutes += m; timeCalls.push({ m: m, reason: reason }); },
    getAbsoluteDay: function () { return 400; },
    onNewDaySubscribe: function () {}
};
global.addItemToInventory = function () { return true; };
global.updateCharacterStatus = function () {};
global.updateCurrencyUI = function () {};
global.updateInsightUI = function () {};
global.getEffectiveMax = function () { return 100; };
global.generateRandomEnemy = function (level, type) {
    return { name: (type === 'beast' ? '野狼' : '黑衣修士') + level, hp: 100, physiologyType: 'humanoid', level: level };
};
var battles = [];
global.openBattleWithEntity = function (foe) { battles.push(foe); };
global.ResourcePoints = { listByRegion: function () { return []; } };
global.DungeonDynamic = { listActive: function () { return []; } };
global.StateRegistry = { register: function () {} };
var REALM_TIER = { '凡人': 0, '炼气': 1, '筑基': 2, '金丹': 3, '元婴': 4, '化神': 5 };
global.getRealmTier = function (r) { return REALM_TIER[r] != null ? REALM_TIER[r] : 1; };
var wallet = { stones: 5000 };
global.DataManager = {
    getSpiritStones: function () { return wallet.stones; },
    deductSpiritStones: function (n) { if (wallet.stones >= n) { wallet.stones -= n; return true; } return false; },
    addSpiritStones: function (n) { wallet.stones += n; }
};
global.currentCharData = { health: 100, energy: 100, qi: 50, maxQi: 100, realm: '金丹' };
global.eventFlags = {};
global.PSectWorld = { homeName: function () { return null; } };
global.sectsData = {};

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
// 从当前位置找一格相邻的平原（moveCost 1、无 POI、可走）
function adjacentPlain() {
    var M = global.currentMap, p = global.playerPos;
    var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (var i = 0; i < dirs.length; i++) {
        var nx = p.x + dirs[i][0], ny = p.y + dirs[i][1];
        var row = M[ny]; var c = row ? row[nx] : null;
        if (c && c.terrainKey === 'PLAIN' && !c.poiId && WT.passable({ t: c.terrainKey })) return { x: nx, y: ny };
    }
    return null;
}
function stepPlain() {
    var t = adjacentPlain();
    if (!t) return false;
    return withRandom(0.99, function () { return api.stepTo(t.x, t.y); });
}
function lastTravel() {
    for (var i = timeCalls.length - 1; i >= 0; i--) {
        if (timeCalls[i].reason === '野外赶路') return timeCalls[i].m;
    }
    return null;
}
function msgCount(word) {
    return msgs.filter(function (m) { return m.m.indexOf(word) >= 0; }).length;
}

openSeed('蜀地', '蜀地_w38_camp');

// ==================== A · 力竭账 ====================
console.log('\n[A] 力竭账（腿沉耗时三成、硬撑真伤身、话术只说一次）');
{
    // 精力充足：平原一格 10 分钟，无提醒
    global.currentCharData.energy = 50;
    msgs.length = 0;
    assert(stepPlain(), 'A0 寻得相邻平原格（测试地基）');
    eq(lastTravel(), 10, 'A1 精力充足：平原一格 10 分钟（基准不变）');
    eq(msgCount('力竭'), 0, 'A2 精力充足无力竭话术');

    // 精力 <20：耗时 ×1.3，话术说一次
    global.currentCharData.energy = 10;
    msgs.length = 0;
    assert(stepPlain(), 'A3 力竭状态仍可赶路（不是瘫倒）');
    eq(lastTravel(), 13, 'A4 精力不足两成：每格耗时 ×1.3（10 → 13 分钟）');
    eq(msgCount('力竭'), 1, 'A5 头一步有力竭话术');
    timeCalls.length = 0; msgs.length = 0;
    stepPlain();
    eq(lastTravel(), 13, 'A6 腿沉是持续状态（下一格照样 ×1.3）');
    eq(msgCount('力竭'), 0, 'A7 话术只说一次（不刷屏）');

    // 精力恢复：提醒账翻篇，再力竭会再说
    global.currentCharData.energy = 50;
    stepPlain();
    assert(!global.currentCharData._wearyNoticed, 'A8 精力养回来，力竭提醒账翻篇');
    global.currentCharData.energy = 10;
    msgs.length = 0;
    stepPlain();
    eq(msgCount('力竭'), 1, 'A9 再次力竭，话术会再说一回');

    // 精力 0：硬撑掉血
    global.currentCharData.energy = 0;
    global.currentCharData.health = 100;
    msgs.length = 0;
    stepPlain();
    eq(global.currentCharData.health, 98, 'A10 精力耗尽硬撑：每格气血 -2（真伤身）');
    eq(msgCount('硬撑'), 1, 'A11 硬撑话术说一次');
    msgs.length = 0;
    stepPlain();
    eq(global.currentCharData.health, 96, 'A12 再走再掉（持续代价）');
    eq(msgCount('硬撑'), 0, 'A13 硬撑话术不刷屏');
    eq(lastTravel(), 13, 'A14 精力 0 也在「不足两成」档里（耗时 ×1.3 照算）');

    // energy 字段缺失：按满精力口径，不误伤
    var savedEnergy = global.currentCharData.energy;
    delete global.currentCharData.energy;
    global.currentCharData.health = 100;
    timeCalls.length = 0;
    stepPlain();
    eq(global.currentCharData.health, 100, 'A15 角色没有精力字段：按满算，不误伤');
    eq(lastTravel(), 10, 'A16 也不误加耗时');
    global.currentCharData.energy = savedEnergy;
}

// ==================== B · 扎营歇夜 ====================
console.log('\n[B] 扎营歇夜（时间真跳、恢复真入账、夜袭骰按地形修正）');
{
    var p = global.playerPos;
    var cell = global.currentMap[p.y][p.x];
    cell.terrainKey = 'PLAIN';
    cell.terrain = WT.TERRAIN.PLAIN;
    cell.poiId = null;

    // 脚下动作里有扎营
    var acts = api.tileActions(cell);
    assert(acts.some(function (a) { return a.act === 'camp'; }), 'B1 野地脚下有「扎营歇夜」');

    // 夜里十点半天亮账：22:30 → 次日 06:00 = 450 分钟
    global.timeSystem.gameTime.currentHour = 22;
    global.timeSystem.gameTime.currentMinute = 30;
    global.currentCharData.energy = 30;
    global.currentCharData.health = 50;
    timeCalls.length = 0; msgs.length = 0;
    withRandom(0.99, function () { api.poiAction('camp'); });   // 骰 0.99：平原夜袭率 0.10，不中
    var campCall = timeCalls.filter(function (t) { return t.reason === '扎营歇夜'; })[0];
    assert(!!campCall && campCall.m === 450, 'B2 二十二点半扎营：时间真推到次日清晨六点（450 分钟）');
    eq(global.currentCharData.energy, 90, 'B3 精力 +60 真入账（30 → 90）');
    eq(global.currentCharData.health, 70, 'B4 气血 +20 真入账（50 → 70）');
    eq(msgCount('一觉到天亮'), 1, 'B5 安稳夜有话术');
    eq(battles.length, 0, 'B6 骰不中不开战');

    // 白天扎营：14:00 → 次日 06:00 = 960 分钟（白天扎营 = 歇掉一整天，没有套利空间）
    global.timeSystem.gameTime.currentHour = 14;
    global.timeSystem.gameTime.currentMinute = 0;
    timeCalls.length = 0;
    withRandom(0.99, function () { api.poiAction('camp'); });
    var campCall2 = timeCalls.filter(function (t) { return t.reason === '扎营歇夜'; })[0];
    assert(!!campCall2 && campCall2.m === 960, 'B7 午后扎营：一觉十六个钟头（时间是真的代价）');

    // 恢复封顶
    global.currentCharData.energy = 80;
    global.currentCharData.health = 95;
    withRandom(0.99, function () { api.poiAction('camp'); });
    eq(global.currentCharData.energy, 100, 'B8 精力恢复封顶 100（不是无限泵）');
    eq(global.currentCharData.health, 100, 'B9 气血恢复封顶 100');

    // 夜袭骰 · 地形修正：同一颗骰 0.12——平原（0.10）不中，山地（0.20）中
    cell.terrainKey = 'PLAIN';
    cell.terrain = WT.TERRAIN.PLAIN;
    msgs.length = 0; battles.length = 0;
    withRandom(0.12, function () { api.poiAction('camp'); });
    eq(battles.length, 0, 'B10 平原开阔（15%-5%）：骰 0.12 不中夜袭');
    cell.terrainKey = 'MOUNTAIN';
    cell.terrain = WT.TERRAIN.MOUNTAIN;
    msgs.length = 0; battles.length = 0;
    withRandom(0.12, function () { api.poiAction('camp'); });
    eq(battles.length, 1, 'B11 山地藏东西（15%+5%）：同一颗骰中了夜袭');
    eq(msgCount('摸营'), 1, 'B12 夜袭有话术（帐外有东西摸营）');
    assert(battles[0] && battles[0].name, 'B13 摸营的是真敌人（现成遭遇引擎生成，进真战斗）');

    // 有正经落脚处不扎营
    cell.terrainKey = 'PLAIN';
    cell.terrain = WT.TERRAIN.PLAIN;
    cell.poiId = 'town_fake';
    global.currentPois.push({ id: 'town_fake', type: 'town', name: '测试镇', icon: '🏘️', x: p.x, y: p.y, discovered: true });
    timeCalls.length = 0; msgs.length = 0;
    api.poiAction('camp');
    eq(timeCalls.filter(function (t) { return t.reason === '扎营歇夜'; }).length, 0, 'B14 镇子上不扎营（时间分毫未动）');
    eq(msgCount('正经落脚处'), 1, 'B15 拒得有话术');
    cell.poiId = null;
    global.currentPois = global.currentPois.filter(function (x) { return x.id !== 'town_fake'; });

    // 睡饱了力竭提醒翻篇
    global.currentCharData.energy = 10;
    stepPlain();
    assert(global.currentCharData._wearyNoticed === true, 'B16 力竭走一步，提醒账挂上');
    withRandom(0.99, function () { api.poiAction('camp'); });
    assert(!global.currentCharData._wearyNoticed, 'B17 扎营睡饱，力竭提醒账翻篇');
}

// ==================== C · 源码哨兵 ====================
console.log('\n[C] 源码哨兵（强制遭遇向后兼容、老调用一字未动）');
{
    var rm = fs.readFileSync(path.join(ROOT, 'js/map/randomMap.js'), 'utf8');
    assert(rm.includes('function rollWildEncounter(overrideCell, force)'), 'C1 遭遇引擎添强制参数（骰子可由调用方先掷）');
    assert(rm.includes('if (!force && Math.random() >= p) return false;'), 'C2 不传 force 时骰序与概率分毫未动（向后兼容）');
    assert(rm.includes('if (rollWildEncounter()) { stopped'), 'C3 行程中的老调用一字未动（单参数照旧）');
    assert(rm.includes('CAMP_RAID_BASE = 0.15'), 'C4 夜袭基础率在册（15%）');
    assert(rm.includes('PLAIN: -0.05, ROAD: -0.05, FORD: -0.05') && rm.includes('MOUNTAIN: 0.05, FOREST: 0.05, SWAMP: 0.05, PRIMFOREST: 0.05'), 'C5 地形修正表在册（开阔 -5%、藏地 +5%）');
    assert(rm.includes("case 'camp': wildCamp(); break;"), 'C6 扎营接了动作分发');
    assert(rm.includes('cost *= 1.3') && rm.includes('harmChar(2, 0, 0)'), 'C7 力竭账两个数在册（耗时 ×1.3、硬撑 -2 气血）');
    assert(rm.includes('function minutesToDawn'), 'C8 天亮账独立函数（推到次日清晨六点）');
    assert(rm.includes('rollWildEncounter(cell, true)'), 'C9 夜袭走强制遭遇（骰子扎营自己掷，召敌走现成通道）');
}

console.log('\n========== 第三十八波 · 扎营与昼夜行路 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
