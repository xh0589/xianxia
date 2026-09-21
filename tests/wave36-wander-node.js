/**
 * wave36-wander-node.js — 第三十六波 · 散修游历账 验收：
 *   A 悟道账合一：真源挪上角色数据（随存档走），模块变量只当无角色兜底
 *   B 游历见闻单元：初至一域 / 亲至地标 / 步数里程碑，全是一次性账、零随机
 *   C 野外图接线：建图记域、走步记步、绿洲歇脚、灵池淬体、图鉴入口、水面不撒点
 *   D 源码哨兵：死出口删净、新账口在位、骰序不搅（山河不因水面改动挪位）
 *
 * 运行：node tests/wave36-wander-node.js
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

// ==================== A · 悟道账合一（真实 cultivation.js 进隔离沙箱） ====================
console.log('\n[A] 悟道账合一（真源在角色数据，刷新不丢账）');

function makeCultSandbox(charData) {
    var sandbox = {
        console: { log: function () {}, error: function () {} },
        Math: Math, Number: Number, String: String, JSON: JSON, Object: Object, Array: Array,
        parseInt: parseInt, parseFloat: parseFloat, isFinite: isFinite, Boolean: Boolean,
        Date: Date, RegExp: RegExp, Error: Error, isNaN: isNaN,
        alert: function () {}, confirm: function () { return true; },
        document: {
            getElementById: function () { return null; },
            querySelector: function () { return null; },
            createElement: function () { return { style: {}, classList: { add: function () {}, remove: function () {} }, appendChild: function () {} }; }
        },
        localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} }
    };
    sandbox.window = sandbox;
    if (charData) sandbox.currentCharData = charData;
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/cultivation/cultivation.js'), 'utf8'), sandbox);
    return sandbox;
}
{
    // 有角色：读写都落在角色数据上
    var cd = { insightPoints: 7 };
    var W = makeCultSandbox(cd);
    eq(W.insightPoints, 7, 'A1 有角色时 window.insightPoints 读的就是角色账');
    W.insightPoints = 12;
    eq(cd.insightPoints, 12, 'A2 写也落在角色账上（不再是刷新就没的模块变量）');
    eq(W.insightPoints, 12, 'A3 访问器读写同源');

    // 「刷新页面」：换一个全新沙箱，角色数据带过去——账还在
    var W2 = makeCultSandbox(cd);
    eq(W2.insightPoints, 12, 'A4 模拟重开页面：悟道点随角色数据活下来（旧账合一前必丢）');

    // 无角色：兜底变量接住，不炸
    var W3 = makeCultSandbox(null);
    eq(W3.insightPoints, 0, 'A5 无角色时读兜底（0），不炸');
    W3.insightPoints = 3;
    eq(W3.insightPoints, 3, 'A6 无角色时写兜底，仍可用');

    // 藏经阁那本「幽灵账」：写的字段与真源同名，合账后直接可读
    var cd2 = {};
    var W4 = makeCultSandbox(cd2);
    cd2.insightPoints = (cd2.insightPoints || 0) + 1;   // app.js/藏经阁的写法原样模拟
    eq(W4.insightPoints, 1, 'A7 旧幽灵账（charData.insightPoints）合账后即刻可读可用');

    // 消费口照旧：spendInsightPoint 没钱不办事
    var cd3 = { insightPoints: 0 };
    var W5 = makeCultSandbox(cd3);
    assert(W5.spendInsightPoint() === false, 'A8 零点消费被拒（闸走的是合账后的读数）');

    // 源码哨兵：裸写死绝（除兜底 let 与访问器定义处）
    var cv = fs.readFileSync(path.join(ROOT, 'js/cultivation/cultivation.js'), 'utf8');
    assert(!cv.includes('insightPoints += ') && !cv.includes('insightPoints--'), 'A9 cultivation.js 里裸加裸减死绝（全走 window 访问器）');
    var es = fs.readFileSync(path.join(ROOT, 'js/event-system.js'), 'utf8');
    assert(es.includes('window.insightPoints = (window.insightPoints || 0) + 1') && !/\n\s*insightPoints \+=/.test(es), 'A10 顿悟事件改写合账后的账口');
    assert(cv.includes('cd.insightPoints = n') || cv.includes('cd.insightPoints'), 'A11 访问器真源钉在角色数据字段上');
}

// ==================== B · 游历见闻单元（真实 travel-journal.js 进隔离沙箱） ====================
console.log('\n[B] 游历见闻单元（一次性账、零随机、无角色不炸）');

function makeJournalSandbox(charData) {
    var msgs = [];
    var sandbox = {
        console: { log: function () {}, error: function () {} },
        Math: Math, Number: Number, String: String, JSON: JSON, Object: Object, Array: Array,
        parseInt: parseInt, isFinite: isFinite, Boolean: Boolean, Error: Error, isNaN: isNaN,
        document: { getElementById: function () { return null; } },
        showMessage: function (m, t) { msgs.push({ m: String(m), t: t }); }
    };
    sandbox.window = sandbox;
    if (charData) sandbox.currentCharData = charData;
    sandbox.timeSystem = { getAbsoluteDay: function () { return 200; } };
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/map/travel-journal.js'), 'utf8'), sandbox);
    return { W: sandbox, msgs: msgs };
}
{
    var cd = {};
    var J = makeJournalSandbox(cd);
    var TJ = J.W.TravelJournal;

    // 初至一域
    assert(TJ.noteRegion('蜀地') === true, 'B1 初至蜀地：账落一笔');
    eq(cd._travel.regions['蜀地'], 200, 'B2 记下的是初至那天的绝对日');
    eq(J.W.insightPoints, 1, 'B3 初至发 1 点悟道（走 window.insightPoints 账口）');
    assert(J.msgs.some(function (m) { return m.m.indexOf('初至「蜀地」') >= 0; }), 'B4 发点有话术名目');
    assert(TJ.noteRegion('蜀地') === false, 'B5 再进同一域：不重复发（一生一回）');
    eq(J.W.insightPoints, 1, 'B6 点数纹丝不动');
    TJ.noteRegion('中州');
    eq(J.W.insightPoints, 2, 'B7 换一个域：照常记一笔发一点');

    // 亲至地标
    assert(TJ.noteLandmark({ id: 'lm_1', type: 'landmark', name: '古剑峰' }) === true, 'B8 亲至地标记账成功');
    eq(J.W.insightPoints, 4, 'B9 地标发 2 点（百闻不如一见）');
    assert(TJ.noteLandmark({ id: 'lm_1', type: 'landmark', name: '古剑峰' }) === false, 'B10 同一地标第二次不发');
    assert(TJ.noteLandmark({ id: 't_1', type: 'town', name: '小镇' }) === false, 'B11 非地标 POI 不走这本账');
    eq(cd._travel.marks['lm_lm_1'], 1, 'B12 地标账键在 marks 里（与里程碑、灵池同簿）');

    // 步数里程碑
    for (var i = 0; i < 99; i++) TJ.noteStep();
    eq(cd._travel.steps, 99, 'B13 走一步记一步（99 步在账）');
    var ipBefore = J.W.insightPoints;
    TJ.noteStep();   // 第 100 步：正踩过百里线
    eq(J.W.insightPoints, ipBefore + 1, 'B14 过百里线发 1 点（里程碑 step_100）');
    eq(cd._travel.marks['step_100'], 1, 'B15 里程碑账键落簿');
    var ip100 = J.W.insightPoints;
    for (var k = 0; k < 50; k++) TJ.noteStep();
    eq(J.W.insightPoints, ip100, 'B16 过线之后再走：同一档不再发');

    // 通用一次性账（灵池初出用的就是它）
    assert(TJ.markOnce('pool_灵界_3_4', 1, '初次自灵池中出定') === true, 'B17 markOnce 首回成立');
    assert(TJ.markOnce('pool_灵界_3_4', 1, '初次自灵池中出定') === false, 'B18 markOnce 二回拒（外场小账也一次性）');

    // 汇总
    var s = TJ.summary();
    eq(s.regions, 2, 'B19 汇总：走过 2 域');
    eq(s.regionTotal, 9, 'B20 汇总：全域共 9');
    eq(s.landmarks, 1, 'B21 汇总：亲至地标 1 处');
    eq(s.steps, 150, 'B22 汇总：步数如实（99+1+50）');

    // 无角色：全部安静收场
    var J0 = makeJournalSandbox(null);
    assert(J0.W.TravelJournal.noteRegion('蜀地') === false, 'B23 无角色不炸（建图先于读档也安全）');
    assert(J0.W.TravelJournal.noteStep() === false, 'B24 无角色走步也不炸');
    assert(J0.W.TravelJournal.noteLandmark({ id: 'x', type: 'landmark' }) === false, 'B25 无角色地标也不炸');

    // 零随机：骰子毒掉也照走（建图期调用不搅骰序）
    var cdR = {};
    var JR = makeJournalSandbox(cdR);
    var origRandom = Math.random;
    var poison = function () { throw new Error('travel-journal 不许吃随机数'); };
    JR.W.Math = { random: poison, round: Math.round, max: Math.max, min: Math.min, floor: Math.floor, abs: Math.abs };
    var okNoRnd = true;
    try {
        JR.W.TravelJournal.noteRegion('南疆');
        JR.W.TravelJournal.noteStep();
        JR.W.TravelJournal.noteLandmark({ id: 'lm_2', type: 'landmark', name: '剑冢' });
    } catch (e) { okNoRnd = false; }
    Math.random = origRandom;
    assert(okNoRnd && cdR._travel.regions['南疆'] === 200, 'B26 全程零随机（在 buildWildMap 里调用不挪山河一格）');
}

// ==================== 野外图沙箱（wave35 同源桩） ====================
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
var absDayVal = 200;
global.timeSystem = {
    gameTime: { totalMinutes: 0, currentDay: 5, currentHour: 14, currentMinute: 0, currentSeason: 'spring', currentMonth: 3, currentYear: 1 },
    advanceTime: function (m) { global.timeSystem.gameTime.totalMinutes += m; },
    getAbsoluteDay: function () { return absDayVal; },
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
global.currentCharData = { health: 90, energy: 60, qi: 50, maxQi: 100, realm: '金丹' };
global.eventFlags = {};
global.PSectWorld = { homeName: function () { return null; } };
global.sectsData = {};
global.openSectManagementUI = function () {};
global.selectSect = function () {};
var bestiaryCalls = 0;
global.showLandmarkBestiary = function () { bestiaryCalls++; };

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
function walkTo(M, target) {
    var res = WT.findPath(M.map(function (r) { return r.map(function (c) { return { t: c.terrainKey }; }); }),
        { x: global.playerPos.x, y: global.playerPos.y }, target);
    if (!res) return false;
    res.path.forEach(function (p) { api.stepTo(p.x, p.y); });
    return global.playerPos.x === target.x && global.playerPos.y === target.y;
}
function openSeed(region, seed) {
    global.setMapSeed(seed);
    withRandom(0.99, function () { global.openWildernessMap(region); });
}
// 找一张「某类 POI 走得到」的图
function openWithReachablePoi(region, typeFilter) {
    for (var i = 0; i < 12; i++) {
        openSeed(region, region + '_w36_' + i);
        var poi = api.pois().filter(typeFilter)[0];
        if (!poi) continue;
        var ok = withRandom(0.99, function () { return walkTo(global.currentMap, { x: poi.x, y: poi.y }); });
        if (ok) return poi;
    }
    return null;
}

// ==================== C · 野外图接线 ====================
console.log('\n[C] 野外图接线（建图记域、走步记步、绿洲灵池、图鉴入口、水面不撒点）');
{
    // 初至一域：建图即记账
    var ip0 = Number(global.insightPoints) || 0;
    openSeed('蜀地', '蜀地_w36_main');
    var tjc = global.currentCharData._travel;
    assert(!!tjc && tjc.regions['蜀地'] === 200, 'C1 进蜀地建图：见闻账记下初至');
    eq(Number(global.insightPoints) - ip0, 1, 'C2 初至发 1 点悟道（真进账）');
    var ip1 = Number(global.insightPoints) || 0;
    openSeed('蜀地', '蜀地_w36_main');
    eq(Number(global.insightPoints), ip1, 'C3 重进同域：一分不发（账已记过）');
    openSeed('中州', '中州_w36_main');
    eq(Number(global.insightPoints), ip1 + 1, 'C4 初至中州：再记一笔再发一点');

    // 走步记账
    openSeed('蜀地', '蜀地_w36_walk');
    var steps0 = global.currentCharData._travel.steps;
    var M = global.currentMap;
    var p0 = global.playerPos;
    var nbr = null;
    [[1, 0], [-1, 0], [0, 1], [0, -1]].some(function (d) {
        var nx = p0.x + d[0], ny = p0.y + d[1];
        var row = M[ny]; var c = row ? row[nx] : null;
        if (c && WT.passable({ t: c.terrainKey })) { nbr = { x: nx, y: ny }; return true; }
        return false;
    });
    assert(!!nbr, 'C5 起点旁有可走的一格');
    if (nbr) {
        withRandom(0.99, function () { api.stepTo(nbr.x, nbr.y); });
        eq(global.currentCharData._travel.steps, steps0 + 1, 'C6 走一步，见闻账上多一步');
    }

    // 亲至地标：脚踩上去才记账
    var lm = openWithReachablePoi('蜀地', function (p) { return p.type === 'landmark'; });
    assert(!!lm, 'C7 蜀地寻得一处走得到的地标（古剑峰/剑冢）');
    if (lm) {
        assert(!!global.currentCharData._travel.marks['lm_' + lm.id], 'C8 亲至地标：账上留痕（' + lm.name + '）');
    }

    // 侧栏一行小账
    global.renderTravelJournal();
    var tjHtml = els['wild-travel-journal'] ? els['wild-travel-journal']._html : '';
    assert(tjHtml.indexOf('游历见闻') >= 0 && tjHtml.indexOf('域 ') >= 0 && tjHtml.indexOf('步 ') >= 0, 'C9 侧栏游历见闻行真渲染（域/地标/步）');

    // 绿洲歇脚：西漠，把脚下格改成绿洲验动作与账
    openSeed('西漠', '西漠_w36_oasis');
    var cell = global.currentMap[global.playerPos.y][global.playerPos.x];
    cell.terrainKey = 'OASIS';
    cell.terrain = WT.TERRAIN.OASIS;
    var acts = api.tileActions(cell);
    assert(acts.some(function (a) { return a.act === 'oasis-rest'; }), 'C10 站上绿洲，脚下有「歇脚」');
    global.currentCharData.health = 50; global.currentCharData.energy = 50;
    msgs.length = 0;
    api.poiAction('oasis-rest');
    eq(global.currentCharData.health, 80, 'C11 歇脚真回气血（+30）');
    eq(global.currentCharData.energy, 90, 'C12 歇脚真回精力（+40）');
    var st = api.state().regions['西漠'];
    eq(st.oasis[global.playerPos.x + ',' + global.playerPos.y], 200, 'C13 一日一回的账落在差量存档里');
    global.currentCharData.health = 50;
    msgs.length = 0;
    api.poiAction('oasis-rest');
    eq(global.currentCharData.health, 50, 'C14 当日再歇被拒（水留给后来人）');
    assert(msgs.some(function (m) { return m.m.indexOf('今日已在这处水边歇过') >= 0; }), 'C15 拒了有话术');
    absDayVal = 201;
    api.poiAction('oasis-rest');
    eq(global.currentCharData.health, 80, 'C16 过了一天又能歇（日账翻新）');
    // absDayVal 停在 201：灵池的日账从这一刻起记，当日二淬才会被拒

    // 灵池淬体：真回真气 + 头一回出池记见闻
    cell.terrainKey = 'QIPOOL';
    cell.terrain = WT.TERRAIN.QIPOOL;
    cell.qi = 2;
    var acts2 = api.tileActions(cell);
    assert(acts2.some(function (a) { return a.act === 'pool-bathe'; }), 'C17 站上灵池，脚下有「淬体」');
    global.currentCharData.qi = 10;
    var ipPool = Number(global.insightPoints) || 0;
    api.poiAction('pool-bathe');
    eq(global.currentCharData.qi, 60, 'C18 灵池淬体真回真气（25×灵蕴2 = 50）');
    eq(Number(global.insightPoints) - ipPool, 1, 'C19 头一回出池：见闻账发 1 点');
    assert(!!global.currentCharData._travel.marks['pool_西漠_' + global.playerPos.x + ',' + global.playerPos.y], 'C20 灵池初出的账键在簿');
    global.currentCharData.qi = 10;
    api.poiAction('pool-bathe');
    eq(global.currentCharData.qi, 10, 'C21 当日再淬被拒（池水要一夜酿回来）');
    eq(Number(global.insightPoints) - ipPool, 1, 'C22 拒了也不再发点（双闸：日账+一次性账）');

    // 图鉴入口：侧栏按钮 → showLandmarkBestiary
    bestiaryCalls = 0;
    api.poiAction('bestiary');
    eq(bestiaryCalls, 1, 'C23 「地标探索图鉴」按钮真接线（数据委托 → showLandmarkBestiary）');

    // 水面不撒点：东南海域全图扫一遍
    openSeed('东南海域', '海域_w36_water');
    var waterNodes = 0, waterCells = 0;
    global.currentMap.forEach(function (row) {
        row.forEach(function (c) {
            if (c.terrainKey === 'WATER') { waterCells++; if (c.node) waterNodes++; }
        });
    });
    assert(waterCells > 0, 'C24 东南海域图上有水（扫描有效）');
    eq(waterNodes, 0, 'C25 水面上一个采集点都没有（白撒修净）');
}

// ==================== D · 源码哨兵 ====================
console.log('\n[D] 源码哨兵（死出口删净、账口在位、骰序不搅）');
{
    var rm = fs.readFileSync(path.join(ROOT, 'js/map/randomMap.js'), 'utf8');
    assert(!rm.includes('function tryBeastAmbush') && !rm.includes('window.tryBeastAmbush'), 'D1 兽扑死码删净（凶险走兽群游荡与途中遭遇的真接线）');
    assert(!rm.includes('function regenerateMap') && !rm.includes('window.regenerateMap'), 'D2 重生成死码删净（一域一图，山河不重生成）');
    assert(!rm.includes('window.openCityUI'), 'D3 进城死出口删净（进城走关隘真路）');
    assert(rm.includes('function oasisRest') && rm.includes('function poolBathe'), 'D4 绿洲歇脚/灵池淬体在位');
    assert(rm.includes("case 'oasis-rest'") && rm.includes("case 'pool-bathe'") && rm.includes("case 'bestiary'"), 'D5 三个新脚下动作都接了分发');
    var iRegion = rm.indexOf('TravelJournal.noteRegion(region)');
    assert(iRegion > 0 && iRegion < rm.indexOf('scatterGatherNodes(currentMap'), 'D6 记域在撒点之前落笔（零随机，不搅骰序）');
    assert(rm.includes('TravelJournal.noteStep()') && rm.includes('TravelJournal.noteLandmark(poi)'), 'D7 走步与亲至地标的钩子都在');
    assert(rm.includes('oasis: prev.oasis || {}') && rm.includes('pool: prev.pool || {}'), 'D8 日账随差量存档走（读档不丢「今日已歇」）');
    assert(rm.includes('st.oasis = st.oasis || {}') && rm.includes('st.pool = st.pool || {}'), 'D9 读档兜底补账（老存档没有这字段也不炸）');
    assert(rm.includes("ghost: true") && rm.indexOf('rng() >= rule.p || rule.ghost') > 0, 'D10 水面点「骰照掷、点不落」——骰序保住，山河不因这条改动挪位');
    var tj = fs.readFileSync(path.join(ROOT, 'js/map/travel-journal.js'), 'utf8');
    assert(tj.includes('if (j.regions[region]) return false') && tj.includes('if (j.marks[key]) return false'), 'D11 见闻账两道一次性闸在位（域账+marks 账）');
    assert(!tj.includes('Math.random'), 'D12 见闻账全程零随机（建图期调用安全）');
    var html = fs.readFileSync(path.join(ROOT, '仙侠.html'), 'utf8');
    assert(html.includes('js/map/travel-journal.js'), 'D13 游历账模块真进了页面（脚本引用在位）');
    assert(html.includes('id="wild-travel-journal"') && html.includes('data-act="bestiary"'), 'D14 侧栏有见闻行容器与图鉴按钮');
    var hp = fs.readFileSync(path.join(ROOT, 'js/map/high-planes.js'), 'utf8');
    assert(hp.includes('function flyTravel') && hp.includes('window.flyTravel'), 'D15 御剑飞行留着（位面套测试在用它，不是死码）');
    var le = fs.readFileSync(path.join(ROOT, 'js/map/landmark-explore.js'), 'utf8');
    assert(le.includes('window.showLandmarkBestiary'), 'D16 地标图鉴出口还在（这下有了真入口）');
    var cv2 = fs.readFileSync(path.join(ROOT, 'js/cultivation/cultivation.js'), 'utf8');
    assert(cv2.includes('_ipChar') && cv2.includes('cd.insightPoints = n'), 'D17 悟道点访问器钉在角色数据上（换人不串账、刷新不丢账）');
}

console.log('\n========== 第三十六波 · 散修游历账 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
