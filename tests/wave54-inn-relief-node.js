/**
 * wave54-inn-relief-node.js — 第五十四波 · 客栈住店也解状态 验收：
 *   A 野镇客栈：给钱打尖=正经床铺（与野营同账 30/30/20）、柴房凑合减半（15/15/10）、没病不废话
 *   B 城中客栈：通用口按 40/40/30 走账、梯度不倒挂（柴房 < 野营 < 客栈 < 解毒拔净）
 *   C 哨兵：打尖函数零新骰、五十三波切片不殃及、app.js 接线在册、建图零染、话术零拉丁
 *
 * 运行：node tests/wave54-inn-relief-node.js
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

// ==================== 共享全局桩（wave53 同源，另摆钱袋） ====================
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
var REALM_TIER = { '凡人': 0, '炼气': 1, '筑基': 2, '金丹': 3, '元婴': 4, '化神': 5 };
global.getRealmTier = function (r) { return REALM_TIER[r] != null ? REALM_TIER[r] : 1; };
global.currentCharData = { health: 100, energy: 100, qi: 0, maxQi: 999, realm: '炼气', luck: 50 };
global.eventFlags = {};
global.PSectWorld = { homeName: function () { return null; } };
global.sectsData = {};
global.DataManager = { getSpiritStones: function () { return 0; }, deductSpiritStones: function () { return true; }, addSpiritStones: function () {} };
global.insightPoints = 0;
// 钱袋：spendSpiritStones 走 inventory.currency（打尖付钱的老口）
global.inventory = { currency: { spiritStones: 100 }, slots: [] };

load('js/map/map-markers.js');
load('js/economy/spirit-vein.js');
load('js/map/travel-journal.js');
load('js/core/state-registry.js');
load('js/map/wild-terrain.js');
load('js/map/randomMap.js');

var WT = global.WildTerrain;
var api = global.wildMapApi;
var RL = api.relief;
var CFG = RL.CFG;

function withRandom(v, fn) {
    var orig = Math.random;
    Math.random = function () { return v; };
    try { return fn(); } finally { Math.random = orig; }
}
global.setMapSeed('天下_w54_inn');
withRandom(0.99, function () { global.openWildernessMap('中州'); });
global.currentCharData._travel = { regions: {}, marks: {}, steps: 0 };

function msgCount(word) {
    return msgs.filter(function (m) { return m.m.indexOf(word) >= 0; }).length;
}
function cellAt(x, y) { return (global.currentMap[y] || [])[x] || null; }
function setPhys(poison, shock, pain, wounds) {
    global._playerPhysiology = {
        physiology: {
            type: 'humanoid', bloodVolume: 100, health: 100, circulation: 100, consciousness: 100,
            breathing: 100, painLoad: pain || 0, neuralShock: shock || 0, poisonLoad: poison || 0,
            oxygenDebt: 0, wounds: wounds || [], parts: {}, state: 'alert'
        }
    };
    global._playerEntity = undefined;
    return global._playerPhysiology.physiology;
}

// ==================== A · 野镇客栈 ====================
console.log('\n[A] 野镇客栈（给钱是床，没钱是柴房）');
var p0 = { x: global.playerPos.x, y: global.playerPos.y };
{
    // 脚下造一座镇子（wave38 同法：真 POI 挂进名录）
    var c0 = cellAt(p0.x, p0.y);
    c0.poiId = 'town_w54';
    global.currentPois.push({ id: 'town_w54', type: 'town', name: '落脚镇', icon: '🏘️', x: p0.x, y: p0.y, discovered: true, visited: true });

    // 给了钱：正经床铺，与野营同账
    global.inventory.currency.spiritStones = 100;
    var phys = setPhys(40, 40, 50, []);
    msgs.length = 0;
    withRandom(0.99, function () { api.poiAction('rest'); });   // 骰 0.99：夜里无动静
    eq(phys.poisonLoad, 40 - CFG.POISON, 'A1 打尖给了钱：压毒与野营同账（-30）');
    eq(phys.neuralShock, 40 - CFG.SHOCK, 'A2 安神同账（-30）');
    eq(phys.painLoad, 50 - CFG.PAIN, 'A3 缓痛同账（-20）');
    assert(msgCount('睡卧导引') === 1, 'A4 客栈里也报养身账（睡卧导引一句收）');
    assert(msgCount('歇了一觉') === 1, 'A4b 打尖的老话术照旧');
    eq(global.inventory.currency.spiritStones, 97, 'A5 房钱照付（3 灵石——养身不额外收钱，床钱里包着）');

    // 没钱：柴房凑合，缓解减半
    global.inventory.currency.spiritStones = 0;
    phys = setPhys(40, 40, 50, []);
    msgs.length = 0;
    withRandom(0.99, function () { api.poiAction('rest'); });
    eq(phys.poisonLoad, 40 - CFG.SHED.POISON, 'A6 柴房凑合：压毒减半（-15——柴堆里睡不踏实）');
    eq(phys.neuralShock, 40 - CFG.SHED.SHOCK, 'A7 柴房安神减半（-15）');
    eq(phys.painLoad, 50 - CFG.SHED.PAIN, 'A8 柴房缓痛减半（-10）');
    assert(msgCount('柴房凑合') === 1 && msgCount('睡卧导引') === 1, 'A9 柴房两本话术都在');

    // 轻症一夜压净（柴房也能压净 15 以内的）
    global.inventory.currency.spiritStones = 100;
    phys = setPhys(10, 0, 0, []);
    msgs.length = 0;
    withRandom(0.99, function () { api.poiAction('rest'); });
    eq(phys.poisonLoad, 0, 'A10 轻毒打尖一觉压净');
    assert(msgCount('毒气压净了') === 1, 'A10b 压净的话术认得出');

    // 没病不废话
    phys = setPhys(0, 0, 0, []);
    msgs.length = 0;
    withRandom(0.99, function () { api.poiAction('rest'); });
    eq(msgCount('睡卧导引'), 0, 'A11 身上干净：打尖不念叨养身账');

    global.currentPois = global.currentPois.filter(function (x) { return x.id !== 'town_w54'; });
    c0.poiId = null;
}

// ==================== B · 城中客栈与梯度 ====================
console.log('\n[B] 城中客栈（安睡一宿，压得比野地狠一档）');
{
    eq(CFG.INN.POISON, 40, 'B1 城中客栈压毒 40（正经床铺热汤热饭）');
    eq(CFG.INN.SHOCK, 40, 'B2 安神 40');
    eq(CFG.INN.PAIN, 30, 'B3 缓痛 30');
    var phys = setPhys(100, 100, 100, []);
    var parts = RL.sleep(CFG.INN.POISON, CFG.INN.SHOCK, CFG.INN.PAIN);
    eq(phys.poisonLoad, 60, 'B4 满毒 100：客栈一宿压到 60（重毒不是一觉的事）');
    eq(phys.neuralShock, 60, 'B5 神魂同账');
    eq(phys.painLoad, 70, 'B6 疼痛同账');
    assert(parts && parts.length === 3, 'B7 三样状态三句话');
    // 梯度不倒挂：柴房 < 野营 < 客栈 < 解毒拔净
    assert(CFG.SHED.POISON < CFG.POISON && CFG.POISON < CFG.INN.POISON && CFG.INN.POISON < 100,
        'B8 梯度不倒挂：柴房 15 < 野营 30 < 客栈 40 < 解毒拔净（花钱买的是舒服，不是仙丹）');
    // 深伤在客栈也指去医馆（与 restAtInn 危急伤话术同一世界观）
    phys = setPhys(0, 0, 0, [{ depth: 4, severity: 60, bleeding: false }]);
    parts = RL.sleep(CFG.INN.POISON, CFG.INN.SHOCK, CFG.INN.PAIN);
    assert(parts && parts.join('').indexOf('寻医士') >= 0, 'B9 深伤睡哪儿都睡不好——话术指去医士');
}

// ==================== C · 哨兵 ====================
console.log('\n[C] 哨兵（零新骰、接线在册、切片不殃及）');
{
    var rm = fs.readFileSync(path.join(ROOT, 'js/map/randomMap.js'), 'utf8');
    var app = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
    // 打尖函数：仍是原有两枚骰（变体风险 + 夜里动静），养身账零新骰
    var rStart = rm.indexOf('function restAtWildTown');
    var rSeg = rm.slice(rStart, rm.indexOf('\nfunction ', rStart + 10));
    eq((rSeg.match(/Math\.random/g) || []).length, 2, 'C1 打尖函数仍只两枚骰（养账是定数，零新增）');
    assert(rSeg.indexOf('rich ? campRelief() : sleepRelief(') >= 0, 'C2 打尖接线在册（给钱同营账、柴房减半）');
    assert(rSeg.indexOf('localStorage') < 0 && rSeg.indexOf('saveWildState') < 0, 'C3 养身账零直写存档（生理负荷归既有存读档管）');
    // 五十三波切片不殃及
    var sStart = rm.indexOf('第五十三波 · 睡卧养身解状态异常');
    var sEnd = rm.indexOf('function wildCamp');
    var seg = rm.slice(sStart, sEnd);
    eq((seg.match(/Math\.random/g) || []).length, 0, 'C4 睡卧一节（含五十四波加档）仍零骰');
    assert(rm.indexOf('const _rl = campRelief();') >= 0, 'C5 野营老接线一字未动');
    // app.js 城中客栈接线
    assert(app.indexOf('window.wildMapApi.relief.sleep(') >= 0 && app.indexOf('relief.CFG.INN') >= 0,
        'C6 城中客栈接线在册（app.js 调野图真源的口与数——数值不两头各记一本）');
    assert(app.indexOf('睡卧导引') >= 0, 'C7 城中客栈也报同一句养身话术');
    // 通用口出口在册
    assert(rm.indexOf('sleep: sleepRelief') >= 0 && rm.indexOf('INN: { POISON: INN_POISON_RELIEF') >= 0 && rm.indexOf('SHED: { POISON: SHED_POISON_RELIEF') >= 0,
        'C8 通用口与两档常数都挂了出口（测试与 app.js 共用一本真源）');
    // 建图段一字不染
    var bStart = rm.indexOf('function buildWildMap');
    var buildSeg = rm.slice(bStart, rm.indexOf('\nfunction ', bStart + 10));
    assert(buildSeg.indexOf('RELIEF') < 0 && buildSeg.indexOf('sleepRelief') < 0 && buildSeg.indexOf('SHED') < 0, 'C9 建图段无养身任何调用（骰序零漂移照旧）');
    // 新话术零拉丁
    var latin = /[A-Za-z]/;
    var visLeak = null;
    (seg.match(/'[^']+'/g) || []).forEach(function (s) {
        var v = s.slice(1, -1);
        if (/[+);({\[,]/.test(v)) return;
        if (/^[a-z0-9]+(?:[-_: ][a-z0-9]+)*$/.test(v)) return;   // 小写代码记号
        if (/^#[0-9a-fA-F]{6}$/.test(v)) return;
        if (latin.test(v)) visLeak = visLeak || s;
    });
    assert(visLeak === null, 'C10 睡卧一节话术零拉丁（漏: ' + visLeak + '）');
}

console.log('\n========== 第五十四波 · 客栈住店也解状态 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
