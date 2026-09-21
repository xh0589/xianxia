/**
 * wave60-ice-road-node.js — 第六十波 · 商队冬天抄冰道 验收：
 *   A 冰道认账：冬天封冻的水面，商队/兽群当实地、巡查不认；开春一律不认；占格聚落照旧不踩
 *   B 挪窝账：冬天商队真挪上冰、队员跟着上冰；开春同一格挪不动；兽群踏冰过河；巡查守老路
 *   C 见闻账：冬天看见商队踏冰赶路报一回（一场一回），春天不报，不重复报
 *   D 名单账：冰道遭遇名单添了「商队」，明水面名单一字未动
 *   E 哨兵：新一节零骰、零存档、零经济；moveBand/tickWildLife 骰数不涨；落位段零染（建图骰序不漂）；接线在册
 *
 * 运行：node tests/wave60-ice-road-node.js
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

// ==================== 共享全局桩（wave59 同源） ====================
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
global.itemById = {};
global.inventory = { currency: { spiritStones: 100 }, slots: [] };
global.EconomyTransaction = { getBalance: function () { return 100; }, debit: function () { return true; }, credit: function () { return true; } };
global.updateCharacterStatus = function () {};
global.updateCurrencyUI = function () {};
global.updateInsightUI = function () {};
global.getEffectiveMax = function () { return 100; };
global.generateRandomEnemy = function (level, type) { return { name: '敌' + level, type: type, hp: 100, level: level }; };
global.ResourcePoints = { listByRegion: function () { return []; } };
global.DungeonDynamic = { listActive: function () { return []; } };
global.StateRegistry = { register: function () {} };
var REALM_TIER = { '凡人': 0, '炼气': 1, '筑基': 2, '金丹': 3, '元婴': 4, '化神': 5 };
global.getRealmTier = function (r) { return REALM_TIER[r] != null ? REALM_TIER[r] : 1; };
global.currentCharData = { health: 100, energy: 100, qi: 0, maxQi: 999, realm: '炼气', luck: 50 };
global.eventFlags = {};
global.PSectWorld = { homeName: function () { return null; } };
global.sectsData = {};
global.DataManager = { getSpiritStones: function () { return 100; }, deductSpiritStones: function () { return true; }, addSpiritStones: function () {} };
global.insightPoints = 0;

load('js/map/map-markers.js');
load('js/economy/spirit-vein.js');
load('js/map/travel-journal.js');
load('js/core/state-registry.js');
load('js/map/wild-terrain.js');
load('js/map/randomMap.js');

var WT = global.WildTerrain;
var api = global.wildMapApi;
var LIFE = api.life;

function withRandom(v, fn) {
    var orig = Math.random;
    Math.random = function () { return v; };
    try { return fn(); } finally { Math.random = orig; }
}
// 全程一个种子（换种子=换山河清差量档）
global.setMapSeed('天下_w60_ice');
function openSeed(region) {
    withRandom(0.99, function () { global.openWildernessMap(region); });
}
function setSeason(s) { global.timeSystem.gameTime.currentSeason = s; }
function msgCount(word) {
    return msgs.filter(function (m) { return m.m.indexOf(word) >= 0; }).length;
}
function cellAt(x, y) { return (global.currentMap[y] || [])[x] || null; }
// 把一格强做成水面（腾掉占格与聚落——测试图用完即弃）
function forceWater(x, y) {
    var c = cellAt(x, y);
    if (!c) return null;
    c.terrainKey = 'WATER';
    c.terrain = WT.TERRAIN.WATER;
    c.poiId = null;
    c.entities.length = 0;
    c.fog = 1;
    return c;
}
function headOf(band) {
    for (var i = 0; i < band.members.length; i++) if (!global.isEntityDead(band.members[i])) return band.members[i];
    return null;
}
// 把成员挪到某格（连同占格账）
function placeAt(m, x, y) {
    var from = cellAt(m.x, m.y);
    if (from) { var i = from.entities.indexOf(m); if (i >= 0) from.entities.splice(i, 1); }
    m.x = x; m.y = y;
    var c = cellAt(x, y);
    if (c && c.entities.indexOf(m) < 0) c.entities.push(m);
}
// 把某成员四邻全做成水（挪窝只剩冰道可走/无路可走）
function moat(m) {
    var dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    var n = 0;
    dirs.forEach(function (d) { if (forceWater(m.x + d[0], m.y + d[1])) n++; });
    return n;
}
function distToPlayer(m) {
    return Math.max(Math.abs(m.x - global.playerPos.x), Math.abs(m.y - global.playerPos.y));
}
function findBand(kind) {
    var bs = LIFE.bands().filter(function (b) { return b.kind === kind && headOf(b) && distToPlayer(headOf(b)) >= 3; });
    return bs.length ? bs[0] : (LIFE.bands().filter(function (b) { return b.kind === kind && headOf(b); })[0] || null);
}

setSeason('spring');
openSeed('中州');
global.currentCharData._travel = { regions: {}, marks: {}, steps: 0 };

// ==================== A · 冰道认账 ====================
console.log('\n[A] 冰道认账（冬天封冻的河面就是道）');
{
    var water = { terrainKey: 'WATER', poiId: null, entities: [] };
    var road = { terrainKey: 'ROAD', poiId: null, entities: [] };
    var cv = { kind: 'caravan', members: [] };
    var pk = { kind: 'pack', members: [] };
    var pt = { kind: 'patrol', members: [] };
    setSeason('winter');
    eq(LIFE.iceRoad(cv, water), true, 'A1 冬天商队认冰道（封冻的河面当实地走）');
    eq(LIFE.iceRoad(pk, water), true, 'A2 冬天兽群也踏冰（狼群过河追猎）');
    eq(LIFE.iceRoad(pt, water), false, 'A3 巡查不抄冰道（官差守老路）');
    setSeason('spring');
    eq(LIFE.iceRoad(cv, water), false, 'A4 开春冰化水涨：商队不认水面（季节真的在改走法）');
    setSeason('winter');
    eq(LIFE.iceRoad(cv, road), false, 'A5 冰道只认封冻的河面（古道归 bandCanStand 的老账管）');
    eq(LIFE.iceRoad(cv, { terrainKey: 'WATER', poiId: 'town_x', entities: [] }), false, 'A6 冰面上的聚落照旧不踩');
    var stranger = { name: '路人', isDead: false };
    eq(LIFE.iceRoad(cv, { terrainKey: 'WATER', poiId: null, entities: [stranger] }), false, 'A7 有外人占着的冰格不挤');
    var own = { name: '自家伙计', isDead: false };
    eq(LIFE.iceRoad({ kind: 'caravan', members: [own] }, { terrainKey: 'WATER', poiId: null, entities: [own] }), true, 'A8 自家队员站着不算占');
    eq(LIFE.iceRoad(null, water), false, 'A9 坏参数不炸（无队无格都不认）');
    eq(LIFE.iceRoad(cv, null), false, 'A9b 坏参数不炸（空格）');
}

// ==================== B · 挪窝账 ====================
console.log('\n[B] 挪窝账（冬天真上冰，开春挪不动）');
{
    var cv = findBand('caravan');
    assert(!!cv, 'B0 图上有商队（活物是建图时撒的老账）');
    var head = headOf(cv);
    var hx = head.x, hy = head.y;
    var n = moat(head);
    assert(n >= 1, 'B0b 商队四邻做成了水面（挪窝只剩冰道一道题）');
    // 开春：四面是水，一步挪不动
    setSeason('spring');
    LIFE.move(cv);
    eq(head.x, hx, 'B1 开春商队守着古道不动（水面不是道——老规矩没破）');
    eq(head.y, hy, 'B1b 原地没挪');
    // 冬天：头一个方向就是冰，全队上冰
    setSeason('winter');
    LIFE.move(cv);
    var hc = cellAt(head.x, head.y);
    assert(head.x !== hx || head.y !== hy, 'B2 冬天商队挪上了冰道（抄近路赶货）');
    eq(hc.terrainKey, 'WATER', 'B2b 脚下是封冻的河面');
    if (cv.members.length >= 2) {
        var onIce = cv.members.filter(function (m) {
            return !global.isEntityDead(m) && (cellAt(m.x, m.y) || {}).terrainKey === 'WATER';
        }).length;
        assert(onIce >= 2, 'B3 队员跟着上冰（整车队都抄了冰道，不只头一个）');
    }
    // 兽群踏冰
    var pk = findBand('pack');
    if (pk) {
        var ph = headOf(pk), px0 = ph.x, py0 = ph.y;
        moat(ph);
        setSeason('winter');
        LIFE.move(pk);
        eq(((cellAt(ph.x, ph.y) || {}).terrainKey), 'WATER', 'B4 冬天兽群踏冰过河（狼群也懂冰道的账）');
    } else {
        console.log('  （图上没撒出兽群，B4 跳过——冰道认账 A2 已直调对过）');
    }
    // 巡查守老路
    var pt = findBand('patrol');
    if (pt) {
        var th = headOf(pt), tx0 = th.x, ty0 = th.y;
        moat(th);
        setSeason('winter');
        LIFE.move(pt);
        eq(th.x, tx0, 'B5 巡查冬天也不上冰（四面是水就原地守着——官差守老路）');
        eq(th.y, ty0, 'B5b 原地没挪');
    } else {
        console.log('  （图上没撒出巡查，B5 跳过——冰道认账 A3 已直调对过）');
    }
}

// ==================== C · 见闻账 ====================
console.log('\n[C] 见闻账（看见商队踏冰，报一回）');
{
    var cv = findBand('caravan');
    var head = headOf(cv);
    // 在玩家近旁铺一条冰河（十字水面），把商队摆上去
    var px = global.playerPos.x, py = global.playerPos.y;
    var tx = px + 2, ty = py;
    forceWater(tx, ty);
    [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(function (d) { forceWater(tx + d[0], ty + d[1]); });
    cv.members.forEach(function (m, i) { if (!global.isEntityDead(m)) placeAt(m, tx, ty); });
    cv.cool = 0;
    // 春天不报
    setSeason('spring');
    msgs.length = 0;
    withRandom(0.0, function () { LIFE.tick(); });
    eq(msgCount('踏着冰面赶路'), 0, 'C1 春天河是河：商队踏冰的见闻不报（冰都没有）');
    // 冬天报一回
    setSeason('winter');
    msgs.length = 0;
    withRandom(0.0, function () { LIFE.tick(); });
    eq(msgCount('踏着冰面赶路'), 1, 'C2 冬天看见商队踏冰赶路：报一回');
    var cm = msgs.filter(function (m) { return m.m.indexOf('踏着冰面赶路') >= 0; })[0];
    assert(cm.m.indexOf(cv.name) >= 0, 'C2b 见闻报得出商队的幌子（' + cv.name + '）');
    assert(cm.m.indexOf('冬天的道比夏天的近') >= 0, 'C2c 话术把季节的账讲明白');
    eq(cm.t, 'info', 'C2d 纯见闻话术（info——不动任何账）');
    // 不重复报
    msgs.length = 0;
    withRandom(0.0, function () { LIFE.tick(); });
    eq(msgCount('踏着冰面赶路'), 0, 'C3 一场一回（再看第二眼不念叨）');
}

// ==================== D · 名单账 ====================
console.log('\n[D] 名单账（冰道遭遇名单添了商队）');
{
    var fl = api.habitatFlavor({ terrainKey: 'RIVER_ICE' });
    assert(fl.persons.indexOf('商队') >= 0, 'D1 冬天冰上撞得见商队（遭遇名单在册）');
    assert(fl.persons.indexOf('冰道行旅') >= 0 && fl.persons.indexOf('贩皮货商') >= 0, 'D2 冰道的老名单一字未动');
    assert(fl.beasts.indexOf('冰狼') >= 0 && fl.beasts.indexOf('水蛟') < 0, 'D3 冰面兽名单照旧是陆生（四十七波老账）');
    var fw = api.habitatFlavor({ terrainKey: 'WATER' });
    assert(fw.persons.indexOf('商队') < 0, 'D4 明水面撞不见商队（商队只在冰道上——两本账不混；地域加味的人物是另一本老账）');
}

// ==================== E · 哨兵 ====================
console.log('\n[E] 哨兵（零骰、落位零染、老切片不殃及）');
{
    var rm = fs.readFileSync(path.join(ROOT, 'js/map/randomMap.js'), 'utf8');
    var sStart = rm.indexOf('============ 第六十波');
    var sEnd = rm.indexOf('function makeBandMember');
    assert(sStart > 0 && sEnd > sStart, 'E0 六十波段落标记有效（锚在横幅上）');
    var seg = rm.slice(sStart, sEnd);
    eq((seg.match(/Math\.random/g) || []).length, 0, 'E1 冰道一节零骰（认不认冰全是定数：季节+地形+队伍种类）');
    assert(seg.indexOf('localStorage') < 0 && seg.indexOf('saveWildState') < 0 && seg.indexOf('wildState') < 0,
        'E2 冰道零直写存档（见闻是运行时旗，与湿衣风寒同法——零新字段）');
    assert(seg.indexOf('addSpiritStones') < 0 && seg.indexOf('.credit(') < 0 && seg.indexOf('.debit(') < 0 && seg.indexOf('EconomyTransaction') < 0,
        'E3 冰道零经济（抄近路省的是脚程，不动票子）');
    assert(seg.indexOf('insightPoints') < 0 && seg.indexOf('markOnce') < 0, 'E4 悟道点零发放（总闸已满）');
    // 挪窝与巡查的骰数不涨
    var mStart = rm.indexOf('function moveBand');
    var mSeg = rm.slice(mStart, rm.indexOf('\nfunction ', mStart + 10));
    eq((mSeg.match(/Math\.random/g) || []).length, 1, 'E5 moveBand 仍一枚骰（散不走老路的那枚——冰道零骰）');
    eq((mSeg.match(/bandOnIce/g) || []).length, 3, 'E6 挪窝三处全接冰道（选路/古道例外/队员跟随）');
    var tStart = rm.indexOf('function tickWildLife');
    var tSeg = rm.slice(tStart, rm.indexOf('\nfunction ', tStart + 10));
    eq((tSeg.match(/Math\.random/g) || []).length, 1, 'E7 tickWildLife 仍一枚骰（挪不挪窝的速度骰——见闻零骰）');
    assert(tSeg.indexOf('_iceCaravanNoticed') >= 0, 'E8 冰道见闻接线在册（巡查函数里认旗）');
    // 落位零染：撒活物与建图段一字不动（建图骰序零漂移）
    var sStart2 = rm.indexOf('function seedWildLife');
    var seedSeg = rm.slice(sStart2, rm.indexOf('\nfunction ', sStart2 + 10));
    assert(seedSeg.indexOf('bandOnIce') < 0 && seedSeg.indexOf('_iceCaravanNoticed') < 0 && seedSeg.indexOf('isFrozenNow') < 0,
        'E9 落位段零染（商队出生照旧沿古道——建图骰序不漂，冰道只管挪窝）');
    var bStart = rm.indexOf('function buildWildMap');
    var buildSeg = rm.slice(bStart, rm.indexOf('\nfunction ', bStart + 10));
    assert(buildSeg.indexOf('bandOnIce') < 0 && buildSeg.indexOf('_iceCaravanNoticed') < 0, 'E10 建图段无冰道任何调用');
    var cStart = rm.indexOf('function bandCanStand');
    var cSeg = rm.slice(cStart, rm.indexOf('\nfunction ', cStart + 10));
    assert(cSeg.indexOf('bandOnIce') < 0 && cSeg.indexOf('isFrozenNow') < 0, 'E11 站账老函数一字未动（冰道是旁挂的新账，不改老账）');
    // 复位与出口在册
    assert(rm.indexOf('_iceCaravanNoticed = false;') >= 0, 'E12 开图复位接线在册（换一张图见闻翻篇）');
    assert(rm.indexOf('iceRoad: bandOnIce') >= 0 && rm.indexOf('move: moveBand') >= 0, 'E13 对账出口在册（life.iceRoad / life.move）');
    assert(rm.indexOf("'冰道行旅', '贩皮货商', '商队'") >= 0, 'E14 冰道遭遇名单接线在册');
    assert(rm.indexOf('prev.ice') < 0 && rm.indexOf('ice: prev') < 0, 'E15 存档白名单没收冰道（本就是零新字段）');
    assert(rm.indexOf('nemesis: null, notes: {}, px: -1') >= 0, 'E16 默认域对象串一字未动');
    // 话术零拉丁（代码记号走过滤）
    var latin = /[A-Za-z]/;
    var visLeak = null;
    (seg.match(/'[^']+'/g) || []).forEach(function (s) {
        var v = s.slice(1, -1);
        if (/[+);({\[,]/.test(v)) return;
        if (/^[a-z0-9]+(?:[-_: ][a-z0-9]+)*$/.test(v)) return;   // 小写代码记号
        if (v === 'WATER') return;   // 大写地形键是代码记号（与五十二波同例）
        if (latin.test(v)) visLeak = visLeak || s;
    });
    assert(visLeak === null, 'E17 冰道一节话术零拉丁（漏: ' + visLeak + '）');
}

console.log('\n========== 第六十波 · 商队冬天抄冰道 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
