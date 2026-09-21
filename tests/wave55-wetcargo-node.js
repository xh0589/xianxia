/**
 * wave55-wetcargo-node.js — 第五十五波 · 泅渡湿衣损货 验收：
 *   A 湿衣账：泅水/涉浅滩才湿（踏水/冰面不湿）、湿着走陆地每格多耗一点、一个时辰自然干、
 *            扎营烤火与客栈歇脚即刻干、力竭账不被湿衣抹掉（精力 0 是 0 不是 100）
 *   B 损货账：押镖泅渡/涉滩货浸水（一回折一成、三回封顶）、踏水不湿货、
 *            交割折价走既有酬金减账（兑付行一字未动）、干镖分文不少（四十一波老账原样）
 *   C 哨兵：新段零骰、stepTo 骰数不涨、泅渡切片零染、零直写存档、零发票子、建图零染、话术零拉丁
 *
 * 运行：node tests/wave55-wetcargo-node.js
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

// ==================== 共享全局桩（wave54 同源，另加经济真账记录仪） ====================
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
var ABS_DAY = 800;
global.timeSystem = {
    gameTime: { totalMinutes: 0, currentDay: 5, currentHour: 10, currentMinute: 0, currentSeason: 'spring', currentMonth: 3, currentYear: 1 },
    advanceTime: function (m) { global.timeSystem.gameTime.totalMinutes += m; },
    getAbsoluteDay: function () { return ABS_DAY; },
    onNewDaySubscribe: function () {}
};
global.openBattleWithEntity = function () {};
global.addItemToInventory = function () { return true; };
global.updateCharacterStatus = function () {};
global.updateCurrencyUI = function () {};
global.updateInsightUI = function () {};
global.getEffectiveMax = function () { return 100; };
global.generateRandomEnemy = function (level, type) { return { name: '敌' + level, type: type, hp: 100, level: level }; };
global.ResourcePoints = { listByRegion: function () { return []; } };
global.DungeonDynamic = { listActive: function () { return []; } };
global.StateRegistry = { register: function () {} };
// 经济真账记录仪：入笔画痕（交割折价对账用）
var credits = [];
global.EconomyTransaction = {
    credit: function (kind, n) { credits.push({ kind: kind, n: n }); return true; },
    debit: function () { return true; },
    getBalance: function () { return 0; }
};
var REALM_TIER = { '凡人': 0, '炼气': 1, '筑基': 2, '金丹': 3, '元婴': 4, '化神': 5 };
global.getRealmTier = function (r) { return REALM_TIER[r] != null ? REALM_TIER[r] : 1; };
global.currentCharData = { health: 100, energy: 100, qi: 0, maxQi: 999, realm: '炼气', luck: 50 };
global.eventFlags = {};
global.PSectWorld = { homeName: function () { return null; } };
global.sectsData = {};
global.DataManager = { getSpiritStones: function () { return 0; }, deductSpiritStones: function () { return true; }, addSpiritStones: function () {} };
global.insightPoints = 0;
global.inventory = { currency: { spiritStones: 100 }, slots: [] };

load('js/map/map-markers.js');
load('js/economy/spirit-vein.js');
load('js/map/travel-journal.js');
load('js/core/state-registry.js');
load('js/map/wild-terrain.js');
load('js/map/randomMap.js');

var WT = global.WildTerrain;
var api = global.wildMapApi;
var WET = api.wet;
var CFG = WET.CFG;

function withRandom(v, fn) {
    var orig = Math.random;
    Math.random = function () { return v; };
    try { return fn(); } finally { Math.random = orig; }
}
function setSeason(s) { global.timeSystem.gameTime.currentSeason = s; }
global.setMapSeed('天下_w55_wet');
function openSeed(region) {
    withRandom(0.99, function () { global.openWildernessMap(region); });
}
function msgCount(word) {
    return msgs.filter(function (m) { return m.m.indexOf(word) >= 0; }).length;
}
function setChar(realm, hp, en) {
    var cd = global.currentCharData;
    cd.realm = realm; cd.health = hp; cd.energy = en;
    cd._wearyNoticed = false; cd._spentNoticed = false; cd._wetUntil = 0;
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
    var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2], [1, 1], [-1, 1], [1, -1], [-1, -1]];
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
function minutes() { return global.timeSystem.gameTime.totalMinutes; }

setSeason('spring');
openSeed('中州');
global.currentCharData._travel = { regions: {}, marks: {}, steps: 0 };
var p0 = { x: global.playerPos.x, y: global.playerPos.y };
forgeCell(p0.x, p0.y, 'PLAIN');
var w1 = forgeAdjacent(p0.x, p0.y, 'WATER', []);

// ==================== A · 湿衣账 ====================
console.log('\n[A] 湿衣账（水里过来的没有不湿的）');
{
    // 泅水即湿（炼气下水）
    setChar('炼气', 100, 100);
    msgs.length = 0;
    withRandom(0.99, function () { api.stepTo(w1.x, w1.y); });
    assert(WET.isWet(), 'A1 泅水的人浑身透湿（湿衣账上身）');
    eq(global.currentCharData._wetUntil, minutes() + CFG.DRY_MIN, 'A2 湿衣贴身一个时辰（' + CFG.DRY_MIN + ' 分钟）');
    assert(msgCount('浑身透湿') === 1, 'A3 头一回湿身有话术（连怎么干都说清了）');

    // 连着泅：话术只念一回，湿账续着（不能用 setChar——那会把湿账一并清了，只补精力）
    global.currentCharData.energy = 100;
    msgs.length = 0;
    withRandom(0.99, function () { api.stepTo(p0.x, p0.y); });   // 上岸一格（湿着走）
    withRandom(0.99, function () { api.stepTo(w1.x, w1.y); });   // 再下水
    eq(msgCount('浑身透湿'), 0, 'A4 湿着再下水不重复念叨（一场一回）');
    assert(WET.isWet(), 'A4b 湿账续上了（每回下水都刷新一个时辰）');

    // 湿着走陆地：每格多耗一点
    setChar('炼气', 100, 100);
    WET.make('测试湿身');
    withRandom(0.99, function () { api.stepTo(p0.x, p0.y); });   // 平原格（moveCost 1，干的走不耗）
    eq(global.currentCharData.energy, 100 - CFG.STEP_EN, 'A5 湿衣坠身：平原一格也多耗 ' + CFG.STEP_EN + ' 点精力（干的走平原分文不耗）');

    // 干着走同格做对照
    setChar('炼气', 100, 100);
    global.timeSystem.advanceTime(CFG.DRY_MIN + 1);   // 时辰到，自然干
    assert(!WET.isWet(), 'A6 赶够一个时辰的路：湿衣自然干');
    withRandom(0.99, function () { api.stepTo(w1.x, w1.y); });
    withRandom(0.99, function () { api.stepTo(p0.x, p0.y); });
    setChar('炼气', 100, 100);
    withRandom(0.99, function () { api.stepTo(w1.x, w1.y); });   // 再湿
    setChar('炼气', 100, 100);
    withRandom(0.99, function () { api.stepTo(p0.x, p0.y); });

    // 力竭账不被湿衣抹掉（精力 0 是 0 不是 100——wave46 C8 的教训钉死在这）
    setChar('炼气', 100, 0);
    WET.make('测试湿身');
    withRandom(0.99, function () { api.stepTo(w1.x, w1.y); });   // 水里（回岸的路永远开着）
    setChar('炼气', 100, 0);
    WET.make('测试湿身');
    var hpBefore = global.currentCharData.health;
    withRandom(0.99, function () { api.stepTo(p0.x, p0.y); });
    eq(global.currentCharData.energy, 0, 'A7 精力见底还湿着：湿衣扣不出油水（0 就是 0，不许翻回 100）');
    eq(global.currentCharData.health, hpBefore - 2, 'A8 力竭硬撑 -2 血的账照收（湿衣不救人也不害命）');

    // 踏水者脚不沾水（金丹）
    setChar('金丹', 100, 100);
    msgs.length = 0;
    withRandom(0.99, function () { api.stepTo(w1.x, w1.y); });
    assert(!WET.isWet(), 'A9 金丹踏水如地：脚不沾水，衣不沾湿');

    // 冬天冰面不湿
    setSeason('winter');
    setChar('炼气', 100, 100);
    withRandom(0.99, function () { api.stepTo(p0.x, p0.y); });
    withRandom(0.99, function () { api.stepTo(w1.x, w1.y); });   // 冬天的水面是河冰
    assert(!WET.isWet(), 'A10 冬天从冰上过：冰面是实地，不湿');
    setSeason('spring');
    withRandom(0.99, function () { api.stepTo(p0.x, p0.y); });

    // 涉浅滩也湿
    var f1 = forgeAdjacent(p0.x, p0.y, 'FORD', [w1]);
    setChar('炼气', 100, 100);
    msgs.length = 0;
    withRandom(0.99, function () { api.stepTo(f1.x, f1.y); });
    assert(WET.isWet(), 'A11 涉过浅滩：下半身湿透（浅滩淹到膝腰，没有不湿的）');
    assert(msgCount('涉过浅滩') === 1, 'A11b 涉滩湿身另有话术');

    // 扎营烤干
    msgs.length = 0;
    withRandom(0.99, function () { api.stepTo(p0.x, p0.y); });
    withRandom(0.99, function () { api.poiAction('camp'); });
    assert(!WET.isWet(), 'A12 扎营生了火：湿衣当场烤干');
    assert(msgCount('烤干') === 1, 'A12b 烤干有话术');

    // 客栈烘干
    WET.make('测试湿身');
    var c0 = cellAt(p0.x, p0.y);
    c0.poiId = 'town_w55';
    global.currentPois.push({ id: 'town_w55', type: 'town', name: '烘衣镇', icon: '🏘️', x: p0.x, y: p0.y, discovered: true, visited: true });
    global.inventory.currency.spiritStones = 100;
    msgs.length = 0;
    withRandom(0.99, function () { api.poiAction('rest'); });
    assert(!WET.isWet(), 'A13 客栈歇脚：湿衣凑着灶火烘干');
    assert(msgCount('烘干') === 1, 'A13b 烘干有话术');
    global.currentPois = global.currentPois.filter(function (x) { return x.id !== 'town_w55'; });
    c0.poiId = null;
    setChar('炼气', 100, 100);
}

// ==================== B · 损货账 ====================
console.log('\n[B] 损货账（镖货跟着人过水，交割折价）');
function setEscort(fee) {
    global.currentCharData._escort = {
        region: global.currentRegionForMap, cargo: '药材', toId: 'w55_target', toName: '落雁镇',
        fee: fee || 200, deadlineDay: ABS_DAY + 5, takenDay: ABS_DAY, steps: 10
    };
    return global.currentCharData._escort;
}
{
    // 泅渡浸货
    var e = setEscort(200);
    msgs.length = 0;
    withRandom(0.99, function () { api.stepTo(w1.x, w1.y); });
    eq(e.wet, 1, 'B1 押镖泅渡：货浸了头一回水');
    assert(msgCount('镖货跟着浸了水') === 1 && msgCount('每浸一回折一成') === 1, 'B2 浸货有话术（折价的规矩当场说清）');
    withRandom(0.99, function () { api.stepTo(p0.x, p0.y); });
    withRandom(0.99, function () { api.stepTo(w1.x, w1.y); });
    eq(e.wet, 2, 'B3 再泅一回：浸水记第二笔');
    eq(msgCount('镖货跟着浸了水'), 1, 'B4 提醒一场只念一回（账照记，不刷屏）');
    withRandom(0.99, function () { api.stepTo(p0.x, p0.y); });
    withRandom(0.99, function () { api.stepTo(w1.x, w1.y); });
    withRandom(0.99, function () { api.stepTo(p0.x, p0.y); });
    withRandom(0.99, function () { api.stepTo(w1.x, w1.y); });
    eq(e.wet, CFG.ESCORT_MAX, 'B5 浸水封顶三回（再湿货也就那样了）');
    withRandom(0.99, function () { api.stepTo(p0.x, p0.y); });

    // 交割折价：200 - 200×0.1×3 = 140
    var t = forgeAdjacent(p0.x, p0.y, 'PLAIN', [w1, f1]);
    var tc = cellAt(t.x, t.y);
    tc.poiId = 'w55_target';
    global.currentPois.push({ id: 'w55_target', type: 'town', name: '落雁镇', icon: '🏘️', x: t.x, y: t.y, discovered: true });
    credits.length = 0; msgs.length = 0;
    withRandom(0.99, function () { api.stepTo(t.x, t.y); });
    eq(credits.length, 1, 'B6 交割照旧走经济真账（唯一兑付口没开第二个）');
    eq(credits[0].n, 140, 'B7 湿三回折三成：200 结 140（折价=既有酬金的减账，零增发）');
    assert(msgCount('折去 60 灵石') === 1 && msgCount('结清 140 灵石') === 1, 'B8 折价话术把账算给玩家看（捏了捏浸过水的货角）');
    eq(global.currentCharData._escort, null, 'B9 交割账清');

    // 干镖分文不少（四十一波老账原样）
    setEscort(236);
    var t2 = forgeAdjacent(p0.x, p0.y, 'PLAIN', [w1, f1, t]);
    var tc2 = cellAt(t2.x, t2.y);
    tc2.poiId = 'w55_target2';
    global.currentPois.push({ id: 'w55_target2', type: 'town', name: '望山驿', icon: '🏘️', x: t2.x, y: t2.y, discovered: true });
    global.currentCharData._escort.toId = 'w55_target2';
    global.currentCharData._escort.toName = '望山驿';
    credits.length = 0; msgs.length = 0;
    withRandom(0.99, function () { api.stepTo(t2.x, t2.y); });
    eq(credits[0].n, 236, 'B10 干镖分文不少（236 一个子儿不扣——没湿的货不折价）');
    eq(msgCount('折去'), 0, 'B10b 干镖话术不提折价（老账一字未动）');

    // 踏水送货：金丹的镖不湿
    setEscort(200);
    setChar('金丹', 100, 100);
    e = global.currentCharData._escort;
    withRandom(0.99, function () { api.stepTo(w1.x, w1.y); });
    assert(!e.wet, 'B11 金丹踏水送货：脚不沾水，货也不湿');
    withRandom(0.99, function () { api.stepTo(p0.x, p0.y); });

    // 涉浅滩送货：滩里推镖车，货照样湿
    setChar('炼气', 100, 100);
    e = global.currentCharData._escort;
    msgs.length = 0;
    withRandom(0.99, function () { api.stepTo(f1.x, f1.y); });
    eq(e.wet, 1, 'B12 涉水过浅滩：镖车推过滩，货浸一层');
    withRandom(0.99, function () { api.stepTo(p0.x, p0.y); });
    global.currentCharData._escort = null;
    global.currentPois = global.currentPois.filter(function (x) { return x.id !== 'w55_target' && x.id !== 'w55_target2'; });
    tc.poiId = null; tc2.poiId = null;
}

// ==================== C · 哨兵 ====================
console.log('\n[C] 哨兵（零新骰、切片零染、零发票子）');
{
    var rm = fs.readFileSync(path.join(ROOT, 'js/map/randomMap.js'), 'utf8');
    // wave46 的泅渡切片原样：零骰、零新存档字段（湿衣账全在切片之外）
    var swimSeg = rm.slice(rm.indexOf('const _isWater = cell.terrainKey'), rm.indexOf('const _cdStep = window.currentCharData'));
    assert(swimSeg.indexOf('Math.random') < 0, 'C1 四十六波泅渡切片仍零骰');
    assert(swimSeg.indexOf('currentCharData._') < 0 && swimSeg.indexOf('cd._') < 0, 'C2 泅渡切片仍零新存档字段（湿衣是运行时旗，写在切片外）');
    // 新段零骰（锚在段落横幅上——文件头的常数注释也带波名，别切错）
    var sStart = rm.indexOf('============ 第五十五波');
    var sEnd = rm.indexOf('第五十三波 · 睡卧养身解状态异常');
    assert(sStart > 0 && sEnd > sStart, 'C3 五十五波段落标记有效');
    var seg = rm.slice(sStart, sEnd);
    eq((seg.match(/Math\.random/g) || []).length, 0, 'C4 新一节零骰（湿与折全是定数）');
    assert(seg.indexOf('localStorage') < 0 && seg.indexOf('saveWildState') < 0 && seg.indexOf('wildState') < 0,
        'C5 湿衣账零直写存档、零新持久字段（_wetUntil 与 _wearyNoticed 同法；镖货 wet 记在镖账既有对象里）');
    assert(seg.indexOf('addSpiritStones') < 0 && seg.indexOf('.credit(') < 0, 'C6 新一节零发票子（折价只发生在交割口，是减账）');
    // stepTo 骰数不涨（原有的一枚是护镖截道骰）
    var stStart = rm.indexOf('function stepTo');
    var stSeg = rm.slice(stStart, rm.indexOf('\nfunction ', stStart + 10));
    eq((stSeg.match(/Math\.random/g) || []).length, 1, 'C7 stepTo 骰数不涨（湿账零新骰）');
    // 四十一波兑付行一字未动
    assert(rm.indexOf("window.EconomyTransaction.credit('spiritStones', Number(e.fee)") >= 0,
        'C8 交割兑付行一字未动（折价改的是付款前的 e.fee——唯一兑付口还是那一个）');
    // 建图段零染
    var bStart = rm.indexOf('function buildWildMap');
    var buildSeg = rm.slice(bStart, rm.indexOf('\nfunction ', bStart + 10));
    assert(buildSeg.indexOf('WET') < 0 && buildSeg.indexOf('wet') < 0 && buildSeg.indexOf('makeWet') < 0, 'C9 建图段无湿账任何调用（骰序零漂移照旧）');
    // 接线在册
    assert(stSeg.indexOf('makeWet(') >= 0 && stSeg.indexOf('wetEscortCargo(') >= 0 && stSeg.indexOf('isWetNow()') >= 0,
        'C10 行路接线在册（泅水/涉滩湿身、湿走陆地坠精力）');
    var dryCount = (rm.match(/dryOff\(/g) || []).length;
    assert(dryCount >= 3 && rm.indexOf('dry: dryOff') >= 0, 'C11 烤干接口在册（定义+扎营+客栈三处调用，出口另挂（无括号不计））');
    assert(rm.indexOf('_cargoWetNoticed = false;') >= 0 && rm.indexOf('WET_DRY_MIN = 60') >= 0 && rm.indexOf('ESCORT_WET_MAX = 3') >= 0,
        'C12 常数与翻篇接线在册（60 分钟 / 封顶三回）');
    // 数对账
    assert(CFG.DRY_MIN === 60 && CFG.STEP_EN === 1 && CFG.ESCORT_PER === 0.1 && CFG.ESCORT_MAX === 3, 'C13 四数与施工图对账');
    // 新话术零拉丁
    var latin = /[A-Za-z]/;
    var visLeak = null;
    (seg.match(/'[^']+'/g) || []).forEach(function (s) {
        var v = s.slice(1, -1);
        if (/[+);({\[,]/.test(v)) return;
        if (/^[a-z0-9]+(?:[-_: ][a-z0-9]+)*$/.test(v)) return;   // 小写代码记号
        if (latin.test(v)) visLeak = visLeak || s;
    });
    assert(visLeak === null, 'C14 湿账一节话术零拉丁（漏: ' + visLeak + '）');
    // 各波切片不殃及
    var gSeg = rm.slice(rm.indexOf('第四十九波 · 崖壁隐藏洞天'), rm.indexOf('第三十八波 · 扎营歇夜'));
    eq((gSeg.match(/Math\.random/g) || []).length, 1, 'C15 洞天一节仍只一枚骰');
    var rSeg = rm.slice(rm.indexOf('第五十三波 · 睡卧养身解状态异常'), rm.indexOf('function wildCamp'));
    eq((rSeg.match(/Math\.random/g) || []).length, 0, 'C16 睡卧一节仍零骰');
}

console.log('\n========== 第五十五波 · 泅渡湿衣损货 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
