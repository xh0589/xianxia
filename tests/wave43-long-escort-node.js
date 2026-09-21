/**
 * wave43-long-escort-node.js — 第四十三波 · 跨域大镖 验收：
 *   A 接长线单：有陆路邻域才发、账全（域∈邻域/酬650/限14天/货跟行情）、一单一了长短互斥
 *   B 货在身上：长线镖全域携带（本图镖换域即休眠的老行为不动）、日15%夜22%、扎营+0.12
 *   C 交割与到期：目标域任一镇子交割650+名气2、别的域不算数、到期撤镖、过界话术、镖旗长线态
 *   D 哨兵：常数在册、过界钩子零随机、零新存档字段、零拉丁
 *
 * 运行：node tests/wave43-long-escort-node.js
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

// ==================== 共享全局桩（wave41 同源） ====================
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
var timeCalls = [];
var absDayVal = 600;
global.timeSystem = {
    gameTime: { totalMinutes: 0, currentDay: 5, currentHour: 10, currentMinute: 0, currentSeason: 'spring', currentMonth: 3, currentYear: 1 },
    advanceTime: function (m, reason) { global.timeSystem.gameTime.totalMinutes += m; timeCalls.push({ m: m, reason: reason }); },
    getAbsoluteDay: function () { return absDayVal; },
    onNewDaySubscribe: function () {}
};
global.addItemToInventory = function () { return true; };
global.updateCharacterStatus = function () {};
global.updateCurrencyUI = function () {};
global.updateInsightUI = function () {};
global.getEffectiveMax = function () { return 100; };
var REALM_TIER = { '凡人': 0, '炼气': 1, '筑基': 2, '金丹': 3, '元婴': 4, '化神': 5 };
global.getRealmTier = function (r) { return REALM_TIER[r] != null ? REALM_TIER[r] : 1; };
global.realmScaledEnemyLevel = function (cd) { return (REALM_TIER[(cd || {}).realm] != null ? REALM_TIER[cd.realm] : 1) * 3; };
var genCalls = [];
global.generateRandomEnemy = function (level, type) {
    genCalls.push({ level: level, type: type });
    return { name: '黑衣修士' + level, hp: 100, level: level, physiologyType: 'humanoid' };
};
var battles = [];
global.openBattleWithEntity = function (foe) { battles.push(foe); global.currentBattle = { enemy: foe }; };
var credits = [];
global.EconomyTransaction = { credit: function (kind, n) { credits.push({ kind: kind, n: n }); } };
var rewardCalls = [];
global.RewardService = { apply: function (r, o) { rewardCalls.push({ r: r, source: o && o.source }); return true; } };
global.DataManager = { getSpiritStones: function () { return 5000; }, deductSpiritStones: function () { return true; }, addSpiritStones: function () {} };
global.ResourcePoints = { listByRegion: function () { return []; } };
global.DungeonDynamic = { listActive: function () { return []; } };
global.StateRegistry = { register: function () {} };
global.currentCharData = { health: 100, energy: 100, qi: 50, maxQi: 100, realm: '金丹' };
global.eventFlags = {};
global.PSectWorld = { homeName: function () { return null; } };
global.sectsData = {};
var MD_TABLE = null;
global.MarketDynamic = {
    CITIES: ['中州', '南疆', '东海', '西荒', '北冥', '天空'],
    CATEGORIES: ['丹药', '药材', '矿材', '法器', '食物', '符箓'],
    priceMul: function (city, cat) {
        if (!MD_TABLE) return 1;
        var t = MD_TABLE[cat];
        if (!t) return 1;
        return t[city] != null ? t[city] : 1;
    }
};
// 世界地图接壤桩：中州通南疆（赤水廊桥）；南疆通中州；边地无邻
var NEIGHBORS = {
    '中州': [{ region: '南疆', route: '赤水廊桥', li: 300, kind: 'bridge' }],
    '南疆': [{ region: '中州', route: '赤水廊桥', li: 300, kind: 'bridge' }],
    '东南海域': []
};
global.WorldMap = {
    neighborsOf: function (r) { return NEIGHBORS[r] || []; },
    renderExits: function () {}
};

load('js/map/map-markers.js');
load('js/economy/spirit-vein.js');
load('js/map/travel-journal.js');
load('js/core/state-registry.js');
load('js/map/wild-terrain.js');
load('js/map/randomMap.js');

var WT = global.WildTerrain;
var api = global.wildMapApi;
var CFG = api.escort.CFG;

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
function removePoi(id) {
    var arr = global.currentPois;
    for (var i = arr.length - 1; i >= 0; i--) if (arr[i] && arr[i].id === id) arr.splice(i, 1);
}
function footTown(variantKey, variantName) {
    var p = global.playerPos;
    var cell = global.currentMap[p.y][p.x];
    cell.terrainKey = 'ROAD';
    cell.terrain = WT.TERRAIN.ROAD;
    cell.poiId = 'w43_town';
    removePoi('w43_town');
    global.currentPois.push({
        id: 'w43_town', type: 'town', name: '测试篷车集', icon: '🏘️', x: p.x, y: p.y, discovered: true,
        variant: { key: variantKey, name: variantName, rest: { cost: 4, stones: 3 } }, variantName: variantName
    });
    return cell;
}
function clearFootTown() {
    global.currentMap[global.playerPos.y][global.playerPos.x].poiId = null;
    removePoi('w43_town');
}
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
// 在相邻格摆一处镇子（交割靶子）
function plantTown(id, name) {
    var t = adjacentPlain();
    if (!t) return null;
    var cell = global.currentMap[t.y][t.x];
    cell.poiId = id;
    removePoi(id);
    global.currentPois.push({ id: id, type: 'town', name: name, icon: '🏘️', x: t.x, y: t.y, discovered: true });
    return t;
}
function longLedger(toRegion, fee, days) {
    return { long: true, fromRegion: '中州', toRegion: toRegion || '南疆', cargo: '药材', fee: fee || 650, deadlineDay: absDayVal + (days != null ? days : 14), takenDay: absDayVal };
}

openSeed('中州', '中州_w43_long');
MD_TABLE = { '药材': { '南疆': 0.70, '中州': 1.20 }, '矿材': { '西荒': 0.70, '东海': 1.15 } };

// ==================== A · 接长线单 ====================
console.log('\n[A] 接长线单（有陆路邻域才发、账全、一单一了）');
{
    var cell = footTown('caravan', '篷车集');
    var acts = api.tileActions(cell);
    assert(acts.some(function (a) { return a.act === 'escort-long'; }), 'A1 中州通南疆：篷车集出「跨域大镖」');
    var lbl = acts.filter(function (a) { return a.act === 'escort-long'; })[0].label;
    assert(lbl.indexOf('650') >= 0 && lbl.indexOf('14') >= 0, 'A2 招子上写明酬金与限期（明码标价）');
    assert(acts.some(function (a) { return a.act === 'escort-job'; }), 'A3 本图护镖照旧同在（长短两单并列可选）');

    delete global.currentCharData._escort;
    msgs.length = 0;
    withRandom(0.5, function () { api.poiAction('escort-long'); });
    var e = api.escort.ledger();
    assert(!!e && e.long === true, 'A4 长线单接成了（账挂上）');
    eq(e.toRegion, '南疆', 'A5 目的域=陆路邻域（接壤账是真源）');
    eq(e.fee, 650, 'A6 酬金 650（压过本图封顶 600——大镖就得值当）');
    eq(e.deadlineDay, absDayVal + 14, 'A7 限期十四天（扣着过界门+横穿一域的真实脚程）');
    eq(e.cargo, '药材', 'A8 货照旧跟行情走（价差最大的行当）');
    assert(msgs.some(function (m) { return m.m.indexOf('赤水廊桥') >= 0 && m.m.indexOf('650') >= 0; }), 'A9 接单话术把关隘、酬金、交割规矩都说清');

    // 一单一了：长短互斥
    msgs.length = 0;
    withRandom(0.5, function () { api.poiAction('escort-long'); });
    eq(msgCount('一单一了'), 1, 'A10 长线在手拒第二单长线');
    msgs.length = 0;
    withRandom(0.5, function () { api.poiAction('escort-job'); });
    eq(msgCount('一单一了'), 1, 'A11 长线在手也拒本图单（一只手押一单）');
    var eStill = api.escort.ledger();
    eq(eStill && eStill.fee, 650, 'A12 拒归拒，原单分毫未动');

    // 边地无邻域：发不出去
    global.currentCharData._escort = null;
    openSeed('东南海域', '海域_w43_long');
    footTown('caravan', '篷车集');
    assert(!api.tileActions(global.currentMap[global.playerPos.y][global.playerPos.x]).some(function (a) { return a.act === 'escort-long'; }), 'A13 边地无陆路邻域：大镖招子不挂');
    msgs.length = 0;
    withRandom(0.5, function () { api.escort.takeLong(); });
    eq(api.escort.ledger(), null, 'A14 直驱也发不出（账不落）');
    eq(msgCount('边地'), 1, 'A15 拒得有话术');
    clearFootTown();
    openSeed('中州', '中州_w43_long2');
}

// ==================== B · 货在身上（全域携带） ====================
console.log('\n[B] 货在身上（长线镖全域携带、骰更凶）');
{
    global.currentCharData._escort = longLedger('南疆', 650, 14);
    openSeed('南疆', '南疆_w43_long');
    eq(api.escort.carrying(), true, 'B1 过了界门货还在身上：目标域里携带');
    openSeed('中州', '中州_w43_long3');
    eq(api.escort.carrying(), true, 'B2 路过别域也携带（截道的跟一路）');
    global.timeSystem.gameTime.currentHour = 10;
    battles.length = 0;
    withRandom(0.14, function () { api.escort.step(); });
    eq(battles.length, 1, 'B3 白日骰 0.14 < 15%：大镖被截（比本图镖 12% 更凶）');
    battles.length = 0;
    withRandom(0.16, function () { api.escort.step(); });
    eq(battles.length, 0, 'B4 白日骰 0.16：平安（15% 不是步步劫）');
    global.timeSystem.gameTime.currentHour = 23;
    battles.length = 0;
    withRandom(0.20, function () { api.escort.step(); });
    eq(battles.length, 1, 'B5 夜里骰 0.20 < 22%：夜路截大镖');
    global.timeSystem.gameTime.currentHour = 10;

    // 老行为哨兵：本图镖换域即休眠
    global.currentCharData._escort = { region: '蜀地', toId: 'x', toName: '外镇', fee: 200, deadlineDay: absDayVal + 5, takenDay: absDayVal, steps: 17 };
    eq(api.escort.carrying(), false, 'B6 本图镖在别域：休眠不携带（v41 老行为分毫不动）');
    battles.length = 0;
    withRandom(0.001, function () { api.escort.step(); });
    eq(battles.length, 0, 'B7 休眠的镖不掷截镖骰');

    // 扎营：长线 +0.12（同一颗骰 0.21：长线中、本图线不中）
    global.currentCharData._escort = { region: global.currentRegionForMap, toId: 'x', toName: '外镇', fee: 200, deadlineDay: absDayVal + 5, takenDay: absDayVal, steps: 17 };
    var p = global.playerPos;
    var campCell = global.currentMap[p.y][p.x];
    campCell.terrainKey = 'PLAIN'; campCell.terrain = WT.TERRAIN.PLAIN; campCell.poiId = null;
    battles.length = 0;
    withRandom(0.21, function () { api.poiAction('camp'); });
    eq(battles.length, 0, 'B8 本图镖平原扎营：骰 0.21 不中（10%+10%=20%）');
    global.currentCharData._escort = longLedger('蜀地', 650, 14);
    battles.length = 0; msgs.length = 0;
    withRandom(0.21, function () { api.poiAction('camp'); });
    eq(battles.length, 1, 'B9 长线镖同骰就中（10%+12%=22%，大镖更招风）');
    assert(battles[0]._escortRaider === true, 'B10 劫营的是截镖的（不是野物）');
    global.currentCharData._escort = null;
}

// ==================== C · 交割与到期 ====================
console.log('\n[C] 交割与到期（认域不认镇、别的域不算数）');
{
    openSeed('南疆', '南疆_w43_deliver');
    global.currentCharData._escort = longLedger('南疆', 650, 14);
    var t = plantTown('w43_target', '瘴水镇');
    credits.length = 0; rewardCalls.length = 0; msgs.length = 0;
    assert(!!t && withRandom(0.99, function () { return api.stepTo(t.x, t.y); }), 'C1 一脚踩进南疆的镇子');
    eq(credits.length, 1, 'C2 大镖交割：酬金一笔入账');
    eq(credits[0] && credits[0].n, 650, 'C3 分毫不少（650）');
    eq(global.currentCharData._escort, null, 'C4 交割账清');
    assert(rewardCalls.some(function (c) { return c.r.fame === 2 && c.source === 'escort'; }), 'C5 大镖名气 +2（比本图镖高一头）');
    eq(msgCount('跨域大镖，圆满'), 1, 'C6 交割话术点明是大镖');
    removePoi('w43_target');
    global.currentMap[t.y][t.x].poiId = null;

    // 别的域不算数
    openSeed('中州', '中州_w43_wrong');
    global.currentCharData._escort = longLedger('南疆', 650, 14);
    var t2 = plantTown('w43_wrong', '中州镇');
    credits.length = 0;
    withRandom(0.99, function () { api.stepTo(t2.x, t2.y); });
    eq(credits.length, 0, 'C7 人在中州踩镇子：南疆的大镖交割不得（认域不认镇）');
    assert(!!api.escort.ledger(), 'C8 镖账还在手上');
    removePoi('w43_wrong');
    global.currentMap[t2.y][t2.x].poiId = null;

    // 目标域的非镇子 POI 也不算
    openSeed('南疆', '南疆_w43_notown');
    global.currentCharData._escort = longLedger('南疆', 650, 14);
    var t3 = adjacentPlain();
    global.currentMap[t3.y][t3.x].poiId = 'w43_ruin';
    global.currentPois.push({ id: 'w43_ruin', type: 'ruin', name: '荒冢', icon: '🗿', x: t3.x, y: t3.y, discovered: true });
    credits.length = 0;
    withRandom(0.99, function () { api.stepTo(t3.x, t3.y); });
    eq(credits.length, 0, 'C9 踩的是遗迹不是镇子：不交割（收货人在市集）');
    removePoi('w43_ruin');
    global.currentMap[t3.y][t3.x].poiId = null;

    // 到期撤镖
    global.currentCharData._escort = longLedger('南疆', 650, -1);
    credits.length = 0; msgs.length = 0;
    withRandom(0.99, function () { api.escort.step(); });
    eq(global.currentCharData._escort, null, 'C10 误了限期：大镖照样撤');
    eq(credits.length, 0, 'C11 撤镖分文未入');

    // 过界话术：进对域 / 进错域
    global.currentCharData._escort = longLedger('南疆', 650, 14);
    msgs.length = 0;
    openSeed('南疆', '南疆_w43_arrive');
    eq(msgCount('脚下已是南疆'), 1, 'C12 带着大镖进目标域：提醒寻镇交割');
    msgs.length = 0;
    openSeed('中州', '中州_w43_pass');
    eq(msgCount('只是路过'), 1, 'C13 带着大镖进别域：提醒莫耽搁');

    // 镖旗长线态
    global.currentCharData._escort = longLedger('南疆', 650, 9);
    withRandom(0.99, function () { global.renderWildSidebar(); });
    var line = els['wild-escort-line'].innerHTML;
    assert(line.indexOf('大镖') >= 0 && line.indexOf('南疆') >= 0, 'C14 镖旗长线态：货与目的域都在');
    assert(line.indexOf('酬 650') >= 0 && line.indexOf('余 9 日') >= 0, 'C15 酬金与余日挂旗');
    assert(line.indexOf('poi-goto') < 0, 'C16 长线旗没有指路钮（目标是域不是点）');
    openSeed('南疆', '南疆_w43_flag');
    global.currentCharData._escort = longLedger('南疆', 650, 9);
    withRandom(0.99, function () { global.renderWildSidebar(); });
    assert(els['wild-escort-line'].innerHTML.indexOf('已到·寻镇交割') >= 0, 'C17 进了目标域：旗上催交割');
    global.currentCharData._escort = null;
}

// ==================== D · 哨兵 ====================
console.log('\n[D] 哨兵（常数、零随机钩子、零新账、零拉丁）');
{
    var rm = fs.readFileSync(path.join(ROOT, 'js/map/randomMap.js'), 'utf8');
    assert(rm.includes('ESCORT_LONG_FEE = 650') && rm.includes('ESCORT_LONG_DAYS = 14') && rm.includes('ESCORT_LONG_AMBUSH_DAY = 0.15') && rm.includes('ESCORT_LONG_AMBUSH_NIGHT = 0.22') && rm.includes('ESCORT_LONG_CAMP_MOD = 0.12') && rm.includes('ESCORT_LONG_FAME = 2'), 'D1 长线六常数在册');
    assert(rm.includes("case 'escort-long': takeEscortLongJob(); break;"), 'D2 长线单接了动作分发');
    assert(rm.includes('WorldMap.neighborsOf(currentRegionForMap)'), 'D3 邻域读接壤真源（不自造地理）');
    // 过界钩子零随机（挂在建图段里，一颗骰都不许吃）
    var hook = rm.slice(rm.indexOf('带着大镖过界'), rrmNext(rm, rm.indexOf('带着大镖过界')));
    function rrmNext(s, i) { var j = s.indexOf('currentPois = gen.pois', i); return j > 0 ? j : i + 600; }
    assert(hook.indexOf('Math.random') < 0, 'D4 过界钩子零随机数（建图骰序零漂移）');
    // v41+v43 镖段新存档字段仍只有 _escort
    var seg = rm.slice(rm.indexOf('第四十一波 · 真路真镖'), rm.indexOf('function exploreWildRuin'));
    var fields = seg.match(/cd\._[A-Za-z]+|currentCharData\._[A-Za-z]+/g) || [];
    assert(fields.every(function (f) { return /_escort$/.test(f); }), 'D5 镖段新存档字段只有 _escort 一个');
    assert(rm.includes('function escortCarrying()'), 'D6 携带口独立成函数（本图/长线两态一个口）');
    // 玩家可见新话术零拉丁
    var visLeak = null;
    global.currentCharData._escort = null;
    openSeed('中州', '中州_w43_latin');
    footTown('caravan', '篷车集');
    msgs.length = 0;
    withRandom(0.5, function () { api.escort.takeLong(); });
    msgs.forEach(function (m) { if (/[A-Za-z]/.test(m.m)) visLeak = visLeak || m.m; });
    withRandom(0.01, function () { api.escort.step(); });
    msgs.forEach(function (m) { if (/[A-Za-z]/.test(m.m)) visLeak = visLeak || m.m; });
    assert(visLeak === null, 'D7 长线新话术零拉丁（漏: ' + visLeak + '）');
    var sideHtml = els['wild-escort-line'].innerHTML.replace(/<[^>]*>/g, '');
    assert(!/[A-Za-z]/.test(sideHtml), 'D8 镖旗长线态可见文字零拉丁');
    clearFootTown();
    global.currentCharData._escort = null;
}

console.log('\n========== 第四十三波 · 跨域大镖 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
