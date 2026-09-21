/**
 * wave53-relief-node.js — 第五十三波 · 睡卧养身解状态异常 验收：
 *   A 野外状态病：瘴气命中真上毒（毒素负荷）、魔气命中真震神魂、封顶一百、别的险不上状态、没实体不炸
 *   B 扎营养身：一夜周天压毒三十/安神三十/缓痛二十、压净与压不尽两套话术、没病不废话、
 *            深伤指去医士（不越权奇迹）、夜袭也照结（觉是先睡的）
 *   C 哨兵：新一节零骰、零经济、零直写存档、危害函数仍只一枚骰、建图零染、各波切片不殃及、
 *          梯度不倒挂（睡一觉是「压」不是「拔净」）、话术零拉丁
 *
 * 运行：node tests/wave53-relief-node.js
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

// ==================== 共享全局桩（wave52 同源，另摆生理实体） ====================
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
var RL = api.relief;
var CFG = RL.CFG;

function withRandom(v, fn) {
    var orig = Math.random;
    Math.random = function () { return v; };
    try { return fn(); } finally { Math.random = orig; }
}
global.setMapSeed('天下_w53_relief');
function openSeed(region) {
    withRandom(0.99, function () { global.openWildernessMap(region); });
}
function msgCount(word) {
    return msgs.filter(function (m) { return m.m.indexOf(word) >= 0; }).length;
}
function cellAt(x, y) { return (global.currentMap[y] || [])[x] || null; }
// 生理实体桩：照 game-state 读档恢复的形状摆
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

openSeed('中州');
global.currentCharData._travel = { regions: {}, marks: {}, steps: 0 };

// ==================== A · 野外状态病 ====================
console.log('\n[A] 野外状态病（瘴气真入体，魔气真震神）');
{
    var phys = setPhys(0, 0, 0, []);
    msgs.length = 0;
    withRandom(0.0, function () { api.applyTerrainHazard({ terrainKey: 'SWAMP' }); });
    eq(phys.poisonLoad, CFG.MIASMA_POISON, 'A1 春天沼泽瘴气命中：毒素负荷 +' + CFG.MIASMA_POISON + '（话术早写了毒雾钻进口鼻，如今真落地）');
    assert(msgCount('毒气入了体') === 1 && msgCount('瘴气入体') === 1, 'A2 入体有话术（瘴气入体 + 毒气入了体）');

    msgs.length = 0;
    withRandom(0.0, function () { api.applyTerrainHazard({ terrainKey: 'MIASMA' }); });
    eq(phys.poisonLoad, CFG.MIASMA_POISON * 2, 'A3 瘴沼深处再中一发：毒上叠毒（负荷累积）');
    eq(phys.neuralShock, 0, 'A3b 瘴气只毒不震神（一本账一本账记）');

    msgs.length = 0;
    withRandom(0.0, function () { api.applyTerrainHazard({ terrainKey: 'BONEFIELD' }); });
    eq(phys.neuralShock, CFG.DEMON_SHOCK, 'A4 骨原魔气命中：神魂震荡 +' + CFG.DEMON_SHOCK + '（魔气顺七窍往里钻）');
    eq(phys.poisonLoad, CFG.MIASMA_POISON * 2, 'A4b 魔气不上毒账（毒是毒，神是神）');
    assert(msgCount('神魂受震') === 1, 'A5 魔气入体话术另有一句');

    phys.poisonLoad = 99;
    withRandom(0.0, function () { api.applyTerrainHazard({ terrainKey: 'SWAMP' }); });
    eq(phys.poisonLoad, 100, 'A6 毒素负荷封顶一百（毒不死人于账外）');

    phys = setPhys(0, 0, 0, []);
    withRandom(0.0, function () { api.applyTerrainHazard({ terrainKey: 'FOREST' }); });
    eq(phys.poisonLoad, 0, 'A7 林海荆棘只是皮外伤：不上状态账（只有瘴/魔入体）');
    eq(phys.neuralShock, 0, 'A7b 神魂也安然');
    withRandom(0.99, function () { api.applyTerrainHazard({ terrainKey: 'SWAMP' }); });
    eq(phys.poisonLoad, 0, 'A8 骰不中 hazard 不触发：毒自然也不上身');

    // 没生理实体（新档没挨过打）：伤害照结，状态无声略过
    global._playerPhysiology = null;
    global._playerEntity = undefined;
    global.currentCharData.health = 100;
    msgs.length = 0;
    var fired = withRandom(0.0, function () { return api.applyTerrainHazard({ terrainKey: 'MIASMA' }); });
    assert(fired === true, 'A9 没生理实体：hazard 照触发（气血精力照扣）');
    assert(global.currentCharData.health < 100, 'A9b 皮外伤的账不赖生理实体');
    eq(msgCount('毒气入了体'), 0, 'A9c 没实体就不谎报入体（无声略过，不炸）');
    setPhys(0, 0, 0, []);
}

// ==================== B · 扎营养身 ====================
console.log('\n[B] 扎营养身（一觉周天，压毒安神缓痛）');
var p0 = { x: global.playerPos.x, y: global.playerPos.y };
function forgeHere(key) {
    var c = cellAt(global.playerPos.x, global.playerPos.y);
    c.terrainKey = key; c.terrain = WT.TERRAIN[key]; c.fog = 2;
    c.poiId = null; c.node = null; c.entities = [];
    return c;
}
forgeHere('PLAIN');
{
    // 三样状态各压一层
    var phys = setPhys(40, 40, 50, []);
    msgs.length = 0;
    withRandom(0.99, function () { api.poiAction('camp'); });   // 平原夜袭率 0.10，骰 0.99 不中
    eq(phys.poisonLoad, 40 - CFG.POISON, 'B1 一夜安睡压毒 -' + CFG.POISON + '（40 → 10）');
    eq(phys.neuralShock, 40 - CFG.SHOCK, 'B2 一夜安睡安神 -' + CFG.SHOCK + '（40 → 10）');
    eq(phys.painLoad, 50 - CFG.PAIN, 'B3 一夜安睡缓痛 -' + CFG.PAIN + '（50 → 30，睡比醒着松一层）');
    assert(msgCount('睡卧导引') === 1, 'B4 养身有话术（睡卧导引一句收账）');
    assert(msgCount('毒气压下去一截') === 1 && msgCount('余毒还伏在血里') === 1, 'B5 压不尽的毒有交代（要拔净得靠解毒的方子——与毒术系统不打架；「一截」措辞随五十四波通用口，量仍是 30）');
    assert(msgCount('神魂安定了些') === 1 && msgCount('疼痛松了一层') === 1, 'B6 神与痛各有一句');

    // 轻症一夜压净
    phys = setPhys(20, 10, 15, []);
    msgs.length = 0;
    withRandom(0.99, function () { api.poiAction('camp'); });
    eq(phys.poisonLoad, 0, 'B7 毒 20：一夜压净');
    eq(phys.neuralShock, 0, 'B8 神 10：一夜睡安稳');
    eq(phys.painLoad, 0, 'B9 痛 15：一觉不那么疼了');
    assert(msgCount('毒气压净了') === 1 && msgCount('神魂睡安稳了') === 1 && msgCount('不那么疼了') === 1, 'B10 压净的话术是另一套（不拿「三成」糊弄）');

    // 没病不废话
    phys = setPhys(0, 0, 0, []);
    msgs.length = 0;
    withRandom(0.99, function () { api.poiAction('camp'); });
    eq(msgCount('睡卧导引'), 0, 'B11 身上干净：扎营不念叨养身账（没病不废话）');

    // 深伤指去医士
    phys = setPhys(0, 0, 0, [{ depth: 4, severity: 60, bleeding: false, clottingProgress: 100, stabilization: 0 }]);
    msgs.length = 0;
    withRandom(0.99, function () { api.poiAction('camp'); });
    assert(msgCount('寻医士') === 1, 'B12 深处的旧伤睡不好——话术指去医士（不越权奇迹）');
    eq(phys.wounds.length, 1, 'B12b 深伤没被睡觉抹掉（伤账归时辰与医士管）');
    phys = setPhys(0, 0, 0, [{ depth: 2, severity: 30, bleeding: false, clottingProgress: 100, stabilization: 0 }]);
    msgs.length = 0;
    withRandom(0.99, function () { api.poiAction('camp'); });
    eq(msgCount('寻医士'), 0, 'B13 浅伤不咋呼（皮肉伤睡一觉就好——时辰账自己在磨）');

    // 夜袭也照结：觉是先睡的
    phys = setPhys(40, 0, 0, []);
    msgs.length = 0;
    withRandom(0.0, function () { api.poiAction('camp'); });   // 骰 0.0：夜袭必中
    eq(phys.poisonLoad, 40 - CFG.POISON, 'B14 半夜被摸营：养身账照结（觉是先睡的，架是后打的）');
    assert(msgCount('睡卧导引') === 1 && msgCount('摸营') === 1, 'B14b 两本话术都在（养身的与摸营的）');
    setPhys(0, 0, 0, []);
}

// ==================== C · 哨兵 ====================
console.log('\n[C] 哨兵（零骰、零经济、梯度不倒挂）');
{
    var rm = fs.readFileSync(path.join(ROOT, 'js/map/randomMap.js'), 'utf8');
    var sStart = rm.indexOf('第五十三波 · 睡卧养身解状态异常');
    var sEnd = rm.indexOf('function wildCamp');
    assert(sStart > 0 && sEnd > sStart, 'C0 五十三波段落标记在野营函数之前（切片有效）');
    var seg = rm.slice(sStart, sEnd);
    eq((seg.match(/Math\.random/g) || []).length, 0, 'C1 新一节零骰（压多少全是定数）');
    assert(seg.indexOf('addSpiritStones') < 0 && seg.indexOf('deductSpiritStones') < 0 && seg.indexOf('.credit(') < 0 && seg.indexOf('.debit(') < 0,
        'C2 养身零经济（睡一觉不花钱——最便宜的养身法子）');
    assert(seg.indexOf('localStorage') < 0 && seg.indexOf('saveWildState') < 0,
        'C3 养身账零直写存档（生理负荷归既有存读档管，本波零新字段）');
    assert(seg.indexOf('insightPoints') < 0 && seg.indexOf('markOnce') < 0, 'C4 悟道点零发放（总闸已满）');
    // 危害函数仍只一枚骰（上状态的分支零随机）
    var hStart = rm.indexOf('function applyTerrainHazard');
    var hSeg = rm.slice(hStart, rm.indexOf('\nfunction ', hStart + 10));
    eq((hSeg.match(/Math\.random/g) || []).length, 1, 'C5 危害结算仍只一枚骰（瘴毒/魔震是命中后的定账）');
    assert(hSeg.indexOf("h.id === 'miasma'") >= 0 && hSeg.indexOf("h.id === 'demon'") >= 0, 'C6 上状态只认瘴/魔两种 hazard id（别的险不掺和）');
    // 建图段一字不染
    var bStart = rm.indexOf('function buildWildMap');
    var buildSeg = rm.slice(bStart, rm.indexOf('\nfunction ', bStart + 10));
    assert(buildSeg.indexOf('RELIEF') < 0 && buildSeg.indexOf('campRelief') < 0 && buildSeg.indexOf('playerPhys') < 0 && buildSeg.indexOf('MIASMA_POISON') < 0,
        'C7 建图段无养身任何调用（骰序零漂移照旧）');
    // 各波切片不殃及
    var gSeg = rm.slice(rm.indexOf('第四十九波 · 崖壁隐藏洞天'), rm.indexOf('第三十八波 · 扎营歇夜'));
    eq((gSeg.match(/Math\.random/g) || []).length, 1, 'C8 洞天一节仍只一枚骰');
    var nSeg = rm.slice(rm.indexOf('第五十一波 · 具名响马宿敌'), rm.indexOf('第四十九波 · 崖壁隐藏洞天'));
    eq((nSeg.match(/Math\.random/g) || []).length, 5, 'C9 五十一波切片仍五枚骰');
    var tSeg = rm.slice(rm.indexOf('第五十二波 · 地图粉笔笔记'), rm.indexOf('第五十一波 · 具名响马宿敌'));
    eq((tSeg.match(/Math\.random/g) || []).length, 0, 'C10 五十二波切片仍零骰');
    // 接线与梯度
    assert(rm.indexOf('const _rl = campRelief();') >= 0 && rm.indexOf('睡卧导引：') >= 0, 'C11 扎营接线在册（野营函数里真调了养身账）');
    assert(CFG.POISON === 30 && CFG.SHOCK === 30 && CFG.PAIN === 20, 'C12 三数与施工图对账（30/30/20）');
    assert(CFG.MIASMA_POISON === 4 && CFG.DEMON_SHOCK === 4, 'C13 野外入体两数对账（瘴毒 4 / 魔震 4——轻病睡一夜就好，重病多夜）');
    assert(CFG.POISON < 100, 'C14 梯度不倒挂：睡一觉至多压三十，满毒要四夜（解毒的方子仍是快车道）');
    // 新话术零拉丁（代码记号走既有过滤）
    var latin = /[A-Za-z]/;
    var visLeak = null;
    (seg.match(/'[^']+'/g) || []).forEach(function (s) {
        var v = s.slice(1, -1);
        if (/[+);({\[,]/.test(v)) return;
        if (/^[a-z0-9]+(?:[-_: ][a-z0-9]+)*$/.test(v)) return;   // 小写代码记号
        if (/^#[0-9a-fA-F]{6}$/.test(v)) return;
        if (latin.test(v)) visLeak = visLeak || s;
    });
    assert(visLeak === null, 'C15 养身一节话术零拉丁（漏: ' + visLeak + '）');
}

console.log('\n========== 第五十三波 · 睡卧养身解状态异常 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
