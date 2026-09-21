/**
 * wave59-chill-node.js — 第五十九波 · 湿衣染风寒 验收：
 *   A 风寒账：夜里湿身才问骰（25%）、冬天整日算冷但水面封冻湿不了身、已病不重复中、骰不中不病
 *   B 带病行走：陆地每格多耗 1（与湿衣两本账叠加=2）、力竭的 0 不能被抹掉、扛过四个时辰自己散
 *   C 暖睡发汗：扎营/客栈住店/柴房凑合都治（有灶就能发汗）、没病不废话
 *   D 哨兵：新一节恰一枚骰、零存档、零经济、零悟道点、话术零拉丁；老切片骰数不涨；建图零染；接线在册
 *
 * 运行：node tests/wave59-chill-node.js
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

// ==================== 共享全局桩（wave55/57 同源，另加钱袋与城镇桩） ====================
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
var battles = [];
global.openBattleWithEntity = function (foe) { battles.push(foe); };
global.addItemToInventory = function () { return true; };
global.itemById = {};
global.inventory = { currency: { spiritStones: 100 }, slots: [] };
global.EconomyTransaction = {
    getBalance: function () { return global.inventory.currency.spiritStones; },
    debit: function (c, amt) { if (global.inventory.currency.spiritStones < amt) return false; global.inventory.currency.spiritStones -= amt; return true; },
    credit: function (c, amt) { global.inventory.currency.spiritStones += amt; return true; }
};
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
global.DataManager = { getSpiritStones: function () { return global.inventory.currency.spiritStones; }, deductSpiritStones: function () { return true; }, addSpiritStones: function () {} };
global.insightPoints = 0;
global.currentPois = [];

load('js/map/map-markers.js');
load('js/economy/spirit-vein.js');
load('js/map/travel-journal.js');
load('js/core/state-registry.js');
load('js/map/wild-terrain.js');
load('js/map/randomMap.js');

var WT = global.WildTerrain;
var api = global.wildMapApi;
var CHILL = api.wet.chill;
var CCFG = CHILL.CFG;

function withRandom(v, fn) {
    var orig = Math.random;
    Math.random = function () { return v; };
    try { return fn(); } finally { Math.random = orig; }
}
// 全程一个种子（换种子=换山河清差量档）
global.setMapSeed('天下_w59_chill');
function openSeed(region) {
    withRandom(0.99, function () { global.openWildernessMap(region); });
}
function msgCount(word) {
    return msgs.filter(function (m) { return m.m.indexOf(word) >= 0; }).length;
}
function setChar(hp, en) {
    global.currentCharData.health = hp;
    global.currentCharData.energy = en;
    global.currentCharData._wearyNoticed = false;
    global.currentCharData._spentNoticed = false;
}
function clearFlags() {
    global.currentCharData._wetUntil = 0;
    global.currentCharData._chillUntil = 0;
}
function chillOn(min) {
    global.currentCharData._chillUntil = global.timeSystem.gameTime.totalMinutes + (min || 999);
}
function wetOn(min) {
    global.currentCharData._wetUntil = global.timeSystem.gameTime.totalMinutes + (min || 60);
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
// 走一格并回报精力花销（摆好身子再走）
function walkSpend(cell) {
    setChar(100, 100);
    var before = global.currentCharData.energy;
    withRandom(0.99, function () { api.stepTo(cell.x, cell.y); });
    return before - global.currentCharData.energy;
}
function setSeason(s, h) {
    global.timeSystem.gameTime.currentSeason = s;
    global.timeSystem.gameTime.currentHour = h;
}

setSeason('spring', 10);
openSeed('中州');
global.currentCharData._travel = { regions: {}, marks: {}, steps: 0 };

// ==================== A · 风寒账 ====================
console.log('\n[A] 风寒账（什么时候会病）');
{
    eq(CCFG.CHANCE, 0.25, 'A0 风寒骰 25%（湿了又冷，四回里病一回）');
    eq(CCFG.MIN, 240, 'A0b 病程四个时辰（240 分钟——与洞天行功同一个时辰账）');
    eq(CCFG.STEP_EN, 1, 'A0c 带病每格多耗 1 精力');
    assert(CCFG.NIGHT_FROM === 19 && CCFG.NIGHT_TO === 5, 'A0d 夜里=十九点到五点');
    // 春天白天：湿了也不病（天暖）
    setSeason('spring', 10);
    clearFlags(); msgs.length = 0;
    eq(CHILL.isCold(), false, 'A1 春日白天不算冷');
    withRandom(0.0, function () { api.wet.make('白天泅水'); });
    assert(msgCount('浑身透湿') === 1, 'A1b 湿身照旧（五十五波老账）');
    eq(msgCount('染上了风寒'), 0, 'A2 天暖湿了不病（骰都不问）');
    eq(CHILL.isChilled(), false, 'A2b 身上没病');
    // 春夜：骰中即病
    setSeason('spring', 22);
    clearFlags(); msgs.length = 0;
    eq(CHILL.isCold(), true, 'A3 夜里算冷（十九点过后）');
    var r = withRandom(0.0, function () { return CHILL.roll(); });
    eq(r, true, 'A4 夜里湿身骰 0.0：染上风寒');
    eq(msgCount('染上了风寒'), 1, 'A4b 病有话术（身上发热、头昏沉沉）');
    assert(CHILL.isChilled(), 'A5 病在身上（运行时旗，与湿衣同法）');
    eq(global.currentCharData._chillUntil, global.timeSystem.gameTime.totalMinutes + CCFG.MIN, 'A5b 病程记到四个时辰后');
    assert(msgCount('暖睡一夜') === 1 && msgCount('硬扛') === 1, 'A5c 话术把两条治路都说明白（暖睡发汗/硬扛自散）');
    // 骰不中：夜里湿了也未必病
    clearFlags(); msgs.length = 0;
    var r2 = withRandom(0.99, function () { return CHILL.roll(); });
    eq(r2, false, 'A6 骰 0.99 不中：这一回扛住了（25% 不是回回都病）');
    eq(msgCount('染上了风寒'), 0, 'A6b 不病就没话术');
    // 冬天整日算冷
    setSeason('winter', 10);
    eq(CHILL.isCold(), true, 'A7 冬天白天也算冷');
    // 已病不重复中
    setSeason('spring', 22);
    clearFlags(); chillOn(999); msgs.length = 0;
    var r3 = withRandom(0.0, function () { return CHILL.roll(); });
    eq(r3, false, 'A8 已经病着不再中（一场风寒没好，不会叠加成两场）');
    eq(msgCount('染上了风寒'), 0, 'A8b 不重复报病');
    // 冬天泅水：水面封冻，湿都湿不了（五十五波冰面老账）——风寒自然无从染起
    setSeason('winter', 10);
    clearFlags(); msgs.length = 0;
    var p0 = global.playerPos;
    var w1 = forgeAdjacent(p0.x, p0.y, 'WATER', []);
    setChar(100, 100);
    withRandom(0.99, function () { api.stepTo(w1.x, w1.y); });
    eq(api.wet.isWet(), false, 'A9 冬天踏的是冰面：湿不了身（冰封的河不算水路）');
    eq(msgCount('染上了风寒'), 0, 'A9b 湿不了身自然病不了');
    // 春夜泅水（走 stepTo 全链）：湿了，骰 0.99 没病
    setSeason('spring', 22);
    clearFlags(); msgs.length = 0;
    withRandom(0.99, function () { api.stepTo(w1.x, w1.y); });
    assert(api.wet.isWet() && msgCount('浑身透湿') === 1, 'A10 春夜泅水湿身（泅在水里）');
    eq(msgCount('染上了风寒'), 0, 'A10b 骰 0.99 没病（湿身话术与风寒话术两本账）');
}

// ==================== B · 带病行走 ====================
console.log('\n[B] 带病行走（病着赶路，步步发沉）');
{
    setSeason('spring', 10);
    var p = global.playerPos;
    // 基线：没病没湿走一格平原
    clearFlags();
    var b0 = forgeAdjacent(p.x, p.y, 'PLAIN', [w1]);
    var spend0 = walkSpend(b0);
    // 带病：多耗 1
    chillOn(999);
    var b1 = forgeAdjacent(global.playerPos.x, global.playerPos.y, 'PLAIN', [w1, b0]);
    var spend1 = walkSpend(b1);
    chillOn(999);   // walkSpend 的 setChar 不碰运行时旗，但稳妥起见再摆一遍
    eq(spend1 - spend0, CCFG.STEP_EN, 'B1 带病走陆地：每格多耗 1 精力');
    // 病 + 湿叠加：多耗 2（两本账各记各的）
    chillOn(999); wetOn(60);
    var b2 = forgeAdjacent(global.playerPos.x, global.playerPos.y, 'PLAIN', [w1, b0, b1]);
    var spend2 = walkSpend(b2);
    chillOn(999); wetOn(60);
    eq(spend2 - spend0, CCFG.STEP_EN + api.wet.CFG.STEP_EN, 'B2 病湿叠加：多耗 2（湿衣 1 + 风寒 1——两本账不打架）');
    // 力竭的 0 不能被抹掉（五十五波栽过的跟头，这里同款判空）
    chillOn(999);
    var b3 = forgeAdjacent(global.playerPos.x, global.playerPos.y, 'PLAIN', [w1, b0, b1, b2]);
    setChar(100, 0);
    chillOn(999);
    withRandom(0.99, function () { api.stepTo(b3.x, b3.y); });
    eq(global.currentCharData.energy, 0, 'B3 精力见底是 0 不是 100：带病账不能把力竭抹掉');
    eq(global.currentCharData.health, 98, 'B3b 力竭硬撑照旧伤身（气血 -2/格，老账不被新账盖掉）');
    assert(msgCount('精力耗尽') === 1, 'B4 力竭的话术照旧报');
    // 扛过病程自己散
    chillOn(CCFG.MIN);
    assert(CHILL.isChilled(), 'B5 病程内还病着');
    global.timeSystem.advanceTime(CCFG.MIN + 1);
    eq(CHILL.isChilled(), false, 'B6 扛过四个时辰：风寒自己散了（不用药不用睡）');
    clearFlags();
    var b4 = forgeAdjacent(global.playerPos.x, global.playerPos.y, 'PLAIN', [w1, b0, b1, b2, b3]);
    var spend3 = walkSpend(b4);
    eq(spend3, spend0, 'B7 病好走路回基线（多耗的账随病走）');
}

// ==================== C · 暖睡发汗 ====================
console.log('\n[C] 暖睡发汗（有灶就能治）');
{
    // 扎营：烤干 + 发汗一起治
    clearFlags(); chillOn(9999); wetOn(60);
    msgs.length = 0;
    withRandom(0.99, function () { api.poiAction('camp'); });
    assert(msgCount('烤干') >= 1, 'C1 扎营先把湿衣烤干（五十五波老账）');
    assert(msgCount('发了一身汗') === 1, 'C2 守着火睡一夜：风寒发汗散透');
    eq(CHILL.isChilled(), false, 'C3 病好了');
    eq(api.wet.isWet(), false, 'C3b 衣也干了');
    // 没病不废话
    clearFlags();
    msgs.length = 0;
    withRandom(0.99, function () { api.poiAction('camp'); });
    eq(msgCount('发了一身汗'), 0, 'C4 没病扎营不报发汗账（没状态不念叨，五十三波的规矩）');
    // 客栈住店：暖睡发汗
    var p = global.playerPos;
    var c0 = cellAt(p.x, p.y);
    c0.poiId = 'town_w59';
    global.currentPois.push({ id: 'town_w59', type: 'town', name: '落脚镇', icon: '🏘️', x: p.x, y: p.y, discovered: true, visited: true });
    global.inventory.currency.spiritStones = 100;
    clearFlags(); chillOn(9999);
    msgs.length = 0;
    withRandom(0.99, function () { api.poiAction('rest'); });
    assert(msgCount('暖暖和和') === 1 && msgCount('散透') === 1, 'C5 客栈住店：暖睡一夜发汗治风寒');
    eq(CHILL.isChilled(), false, 'C6 病好了（房钱里包着灶火）');
    // 柴房凑合也治（柴房也有灶——五十五波的原话）
    global.inventory.currency.spiritStones = 0;
    clearFlags(); chillOn(9999);
    msgs.length = 0;
    withRandom(0.99, function () { api.poiAction('rest'); });
    eq(CHILL.isChilled(), false, 'C7 没钱睡柴房也治（有灶就能发汗——穷病不起，但治得起）');
    assert(msgCount('发了一身汗') >= 1, 'C7b 柴房的发汗账照报');
    global.currentPois = global.currentPois.filter(function (x) { return x.id !== 'town_w59'; });
    c0.poiId = null;
    global.inventory.currency.spiritStones = 100;
}

// ==================== D · 哨兵 ====================
console.log('\n[D] 哨兵（恰一枚骰、零存档、老切片不殃及）');
{
    var rm = fs.readFileSync(path.join(ROOT, 'js/map/randomMap.js'), 'utf8');
    var sStart = rm.indexOf('============ 第五十九波');
    var sEnd = rm.indexOf('============ 对外暴露');
    assert(sStart > 0 && sEnd > sStart, 'D0 五十九波段落标记有效（锚在横幅上）');
    var seg = rm.slice(sStart, sEnd);
    eq((seg.match(/Math\.random/g) || []).length, 1, 'D1 新一节恰一枚骰（风寒骰——冷不冷、病没病全是定数，只有中不中问骰）');
    assert(seg.indexOf('localStorage') < 0 && seg.indexOf('saveWildState') < 0 && seg.indexOf('wildState') < 0,
        'D2 风寒零直写存档（运行时旗，与湿衣同法——读档病好）');
    assert(seg.indexOf('addSpiritStones') < 0 && seg.indexOf('.credit(') < 0 && seg.indexOf('.debit(') < 0 && seg.indexOf('EconomyTransaction') < 0,
        'D3 风寒零经济（病是身子的事，不动票子）');
    assert(seg.indexOf('insightPoints') < 0 && seg.indexOf('markOnce') < 0, 'D4 悟道点零发放（总闸已满）');
    // 接线在册：湿身上身问骰、走路耗账、两处暖睡治账
    assert(rm.indexOf('try { maybeCatchChill(); } catch (eChill) {}') >= 0, 'D5 湿身路接线在册（makeWet 里问骰）');
    var stStart = rm.indexOf('function stepTo');
    var stSeg = rm.slice(stStart, rm.indexOf('\nfunction ', stStart + 10));
    eq((stSeg.match(/Math\.random/g) || []).length, 1, 'D6 stepTo 切片仍恰一枚骰（护镖夜袭骰——风寒的骰不在走路里）');
    assert(stSeg.indexOf('isChilledNow()') >= 0, 'D7 带病行走接线在册（stepTo 里认病旗）');
    eq((stSeg.match(/_cdStep\.energy != null/g) || []).length, 5, 'D8 stepTo 里五块精力账全用显式判空写法（基线/泅渡门槛/湿衣/风寒/力竭——力竭的 0 谁也抹不掉）');
    assert(rm.indexOf("cureChill('扎营守着火") >= 0, 'D9 扎营治账接线在册');
    var rStart = rm.indexOf('function restAtWildTown');
    var rSeg = rm.slice(rStart, rm.indexOf('\nfunction ', rStart + 10));
    eq((rSeg.match(/Math\.random/g) || []).length, 2, 'D10 客栈切片仍两枚骰（夜里动静那两枚——发汗零骰）');
    assert(rSeg.indexOf("cureChill('在客栈暖暖和和") >= 0, 'D11 客栈治账接线在册（柴房也有灶）');
    // 老切片不殃及
    var wSeg = rm.slice(rm.indexOf('============ 第五十五波'), rm.indexOf('第五十三波 · 睡卧养身解状态异常'));
    eq((wSeg.match(/Math\.random/g) || []).length, 0, 'D12 五十五波切片仍零骰（湿衣节里的问骰是一句调用，骰在五十九波段里）');
    var rlSeg = rm.slice(rm.indexOf('第五十三波 · 睡卧养身解状态异常'), rm.indexOf('function wildCamp'));
    eq((rlSeg.match(/Math\.random/g) || []).length, 0, 'D13 五十三波切片仍零骰');
    var bStart = rm.indexOf('function buildWildMap');
    var buildSeg = rm.slice(bStart, rm.indexOf('\nfunction ', bStart + 10));
    assert(buildSeg.indexOf('CHILL') < 0 && buildSeg.indexOf('chill') < 0, 'D14 建图段无风寒任何调用（骰序零漂移照旧）');
    // 零新存档字段 + 出口在册
    assert(rm.indexOf('chill: prev') < 0 && rm.indexOf('prev.chill') < 0 && rm.indexOf('prev._chill') < 0,
        'D15 存档白名单没收风寒（本就是运行时旗——零新字段）');
    assert(rm.indexOf('nemesis: null, notes: {}, px: -1') >= 0, 'D16 默认域对象串一字未动');
    assert(rm.indexOf('chill: {') >= 0 && rm.indexOf('roll: maybeCatchChill') >= 0 && rm.indexOf('cure: cureChill') >= 0,
        'D17 对账出口在册（wet.chill.roll / cure / isChilled / isCold / CFG）');
    // 话术零拉丁（代码记号走过滤）
    var latin = /[A-Za-z]/;
    var visLeak = null;
    (seg.match(/'[^']+'/g) || []).forEach(function (s) {
        var v = s.slice(1, -1);
        if (/[+);({\[,]/.test(v)) return;
        if (/^[a-z0-9]+(?:[-_: ][a-z0-9]+)*$/.test(v)) return;   // 小写代码记号（winter/字段名）
        if (latin.test(v)) visLeak = visLeak || s;
    });
    assert(visLeak === null, 'D18 风寒一节话术零拉丁（漏: ' + visLeak + '）');
}

console.log('\n========== 第五十九波 · 湿衣染风寒 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
