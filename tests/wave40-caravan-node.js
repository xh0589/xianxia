/**
 * wave40-caravan-node.js — 第四十波 · 商队行情 验收：
 *   A 驿亭问路：动作只出在驿亭变体、指路走 shareRumor 真揭示、没路可指先拒不扣时
 *   B 行情牌：动作只出在篷车集、纯读 MarketDynamic 真源、贱贵挑对城、缺席安静收场不扣时
 *   C 商队闲话：价差最大的行当上闲话、运行时骰半开半闭、原拱手话术一字不动
 *   D 哨兵：接线在册、零新存档字段、建图段零新随机（零漂移）、老调用未动
 *
 * 运行：node tests/wave40-caravan-node.js
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

// ==================== 共享全局桩（wave38 同源） ====================
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
var modals = [];
global.document = {
    readyState: 'complete',
    createElementNS: function (ns, tag) { return fakeEl(tag); },
    createElement: function (tag) { return fakeEl(tag); },
    getElementById: function (id) { if (!els[id]) els[id] = fakeEl(); return els[id]; },
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
    addEventListener: function () {},
    body: { appendChild: function (m) { modals.push(m); } }
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
    advanceTime: function (m, reason) { global.timeSystem.gameTime.totalMinutes += m; timeCalls.push({ m: m, reason: reason }); },
    getAbsoluteDay: function () { return 400; },
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
global.DataManager = { getSpiritStones: function () { return 5000; }, deductSpiritStones: function () { return true; }, addSpiritStones: function () {} };
global.currentCharData = { health: 100, energy: 100, qi: 50, maxQi: 100, realm: '金丹' };
global.eventFlags = {};
global.PSectWorld = { homeName: function () { return null; } };
global.sectsData = {};
// 行情真源桩：MD_TABLE 为 null 时全平（×1），否则按表取倍率
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
function lastCall(reason) {
    for (var i = timeCalls.length - 1; i >= 0; i--) {
        if (timeCalls[i].reason === reason) return timeCalls[i].m;
    }
    return null;
}
function msgCount(word) {
    return msgs.filter(function (m) { return m.m.indexOf(word) >= 0; }).length;
}
// ⚠️ currentPois 是建图时挂上 window 的同一个数组引用——只能原地增删，
// 一旦 filter 重赋值就和模块内部脱钩（桩自己看不见自己造的镇子）
function removePoi(id) {
    var arr = global.currentPois;
    for (var i = arr.length - 1; i >= 0; i--) if (arr[i] && arr[i].id === id) arr.splice(i, 1);
}
// 把脚下这格改造成指定变体的镇子
function footTown(variantKey, variantName) {
    var p = global.playerPos;
    var cell = global.currentMap[p.y][p.x];
    cell.terrainKey = 'ROAD';
    cell.terrain = WT.TERRAIN.ROAD;
    cell.poiId = 'w40_town';
    removePoi('w40_town');
    global.currentPois.push({
        id: 'w40_town', type: 'town', name: '测试镇', icon: '🏘️', x: p.x, y: p.y, discovered: true,
        variant: { key: variantKey, name: variantName, rest: { cost: 4, stones: 3 } }, variantName: variantName
    });
    return cell;
}
function clearFootTown() {
    var p = global.playerPos;
    global.currentMap[p.y][p.x].poiId = null;
    removePoi('w40_town');
}

openSeed('中州', '中州_w40_caravan');

// ==================== A · 驿亭问路 ====================
console.log('\n[A] 驿亭问路（老话兑现：官道消息真有出处）');
{
    var cell = footTown('post', '驿亭');
    var acts = api.tileActions(cell);
    assert(acts.some(function (a) { return a.act === 'ask-road'; }), 'A1 驿亭脚下有「讨碗粗茶问路」');
    assert(!acts.some(function (a) { return a.act === 'ask-market'; }), 'A2 驿亭不出行情牌（那是篷车集的买卖）');

    cell = footTown('caravan', '篷车集');
    acts = api.tileActions(cell);
    assert(acts.some(function (a) { return a.act === 'ask-market'; }), 'A3 篷车集脚下有「打听各处行情」');
    assert(!acts.some(function (a) { return a.act === 'ask-road'; }), 'A4 篷车集不出问路（各有各的老话）');

    cell = footTown('hamlet', '残村');
    acts = api.tileActions(cell);
    assert(!acts.some(function (a) { return a.act === 'ask-road' || a.act === 'ask-market'; }), 'A5 残村两样都没有（没什么可买就是没什么可问）');

    // 全探过 → 先拒不扣时
    footTown('post', '驿亭');
    var savedDisc = {};
    global.currentPois.forEach(function (p) { savedDisc[p.id] = p.discovered; p.discovered = true; });
    timeCalls.length = 0; msgs.length = 0;
    api.poiAction('ask-road');
    eq(lastCall('驿亭问路'), null, 'A6 没路可指：先拒不扣时（不白喝人家的茶）');
    eq(msgCount('没新鲜事'), 1, 'A7 拒得有话术');

    // 有未探之处 → 扣时、真揭示、话术带名带方位
    var p = global.playerPos;
    var ruinX = Math.min(p.x + 3, global.currentMap[0].length - 1);
    var ruinY = Math.min(p.y + 2, global.currentMap.length - 1);
    global.currentPois.push({ id: 'w40_ruin', type: 'ruin', name: '测试古冢', icon: '🗿', x: ruinX, y: ruinY, discovered: false });
    timeCalls.length = 0; msgs.length = 0;
    withRandom(0.99, function () { api.poiAction('ask-road'); });
    eq(lastCall('驿亭问路'), 60, 'A8 问路真扣一个时辰（60 分钟）');
    var told = global.currentPois.find(function (x) { return x.id === 'w40_ruin'; });
    assert(told && told.discovered === true && told.rumored === true, 'A9 指的路真上图（走 shareRumor 既有揭示账，不新立）');
    var dx = ruinX - p.x, dy = ruinY - p.y;
    var ns = dy < 0 ? '北' : dy > 0 ? '南' : '';
    var ew = dx < 0 ? '西' : dx > 0 ? '东' : '';
    var dir = (ew && ns) ? ew + ns : (ew || ns || '不远处');
    assert(msgs.some(function (m) { return m.m.indexOf('测试古冢') >= 0 && m.m.indexOf(dir) >= 0; }), 'A10 话术带地名带方位「' + dir + '」（驿丞指得明白）');
    removePoi('w40_ruin');
    global.currentPois.forEach(function (x) { if (savedDisc[x.id] != null) x.discovered = savedDisc[x.id]; });
    clearFootTown();
}

// ==================== B · 行情牌 ====================
console.log('\n[B] 行情牌（纯读真源、贱贵挑对城、缺席不扣时）');
{
    MD_TABLE = {
        '药材': { '南疆': 0.70, '中州': 1.20 },
        '矿材': { '西荒': 0.70, '东海': 1.15 }
    };
    var rows = api.trade.spreads(global.MarketDynamic);
    var yc = rows.find(function (r) { return r.cat === '药材'; });
    assert(yc && yc.loCity === '南疆' && yc.hiCity === '中州' && Math.abs(yc.spread - 0.5) < 1e-9, 'B1 扫真源：药材最贱南疆（×0.70）最贵中州（×1.20）');
    assert(rows.every(function (r) { return ['药材', '矿材'].indexOf(r.cat) >= 0; }), 'B2 全城同价的行当不上账（丹药等四处皆 ×1，没价差就没话说）');

    var html = api.trade.html();
    assert(html.indexOf('贱·南疆 ×0.70') >= 0 && html.indexOf('贵·中州 ×1.20') >= 0, 'B3 行情牌贱处绿贵处红、数字上卡面');
    assert(html.indexOf('手里的药材') >= 0 && html.indexOf('往中州出手最划算') >= 0, 'B4 行尾一句人话（手里的货往贵处出手——不教亏本转手）');
    assert(html.indexOf('丹药') < 0, 'B5 平价行当不上牌面');

    // 通过脚下动作真弹牌
    footTown('caravan', '篷车集');
    modals.length = 0; timeCalls.length = 0;
    withRandom(0.99, function () { api.poiAction('ask-market'); });
    eq(lastCall('听商队讲行情'), 60, 'B6 打听行情真扣一个时辰');
    assert(modals.length === 1 && modals[0].innerHTML.indexOf('商队行情') >= 0 && modals[0].innerHTML.indexOf('贱·南疆') >= 0, 'B7 行情牌真弹出（模态里有账）');

    // 行情账缺席：先拒不扣时
    var savedMD = global.MarketDynamic;
    global.MarketDynamic = undefined;
    timeCalls.length = 0; msgs.length = 0; modals.length = 0;
    api.poiAction('ask-market');
    eq(lastCall('听商队讲行情'), null, 'B8 行情账缺席：不扣时辰');
    eq(modals.length, 0, 'B9 也不弹空牌');
    eq(msgCount('问不着'), 1, 'B10 拒得有话术');
    global.MarketDynamic = savedMD;

    // 全平年份：如实说没利钱
    MD_TABLE = null;
    html = api.trade.html();
    assert(html.indexOf('价格平平') >= 0 && html.indexOf('没利钱') >= 0, 'B11 各处价平：如实说跑单帮没利钱（不硬编行情）');
    MD_TABLE = { '药材': { '南疆': 0.70, '中州': 1.20 }, '矿材': { '西荒': 0.70, '东海': 1.15 }, '丹药': { '北冥': 0.95 } };
    html = api.trade.html();
    assert(html.indexOf('其余行当各处价平') >= 0, 'B12 有价差也有平价：牌面分得清（其余行当不必费脚）');
    clearFootTown();
}

// ==================== C · 商队闲话 ====================
console.log('\n[C] 商队闲话（价差最大的上闲话、骰半开半闭）');
{
    MD_TABLE = { '药材': { '南疆': 0.70, '中州': 1.20 }, '矿材': { '西荒': 0.70, '东海': 1.15 } };
    var tip = api.trade.tip();
    assert(tip.indexOf('药材') >= 0 && tip.indexOf('南疆') >= 0 && tip.indexOf('中州') >= 0, 'C1 闲话挑价差最大的行当（药材 0.5 > 矿材 0.45）');
    var savedMD = global.MarketDynamic;
    global.MarketDynamic = undefined;
    eq(api.trade.tip(), '', 'C2 行情账缺席：闲话闭嘴');
    global.MarketDynamic = savedMD;
    MD_TABLE = null;
    eq(api.trade.tip(), '', 'C3 各处价平：没闲话可捎');
    MD_TABLE = { '药材': { '南疆': 0.95, '中州': 1.0 } };
    eq(api.trade.tip(), '', 'C4 价差不够一成：不值当说（门槛是真的）');
    MD_TABLE = { '药材': { '南疆': 0.70, '中州': 1.20 } };

    // 真遭遇商队：骰 0.2 捎闲话，骰 0.9 不捎，拱手话术都在
    var p = global.playerPos;
    var bands = api.life.bands();
    bands.length = 0;
    bands.push({ id: 'bandT', kind: 'caravan', name: '测试商队', cool: 0, members: [{ x: p.x, y: p.y, hp: 10, name: '测试商队伙计', data: {} }] });
    global.currentPois.forEach(function (x) { x.discovered = true; });   // 清场：不给指路话术搅局
    msgs.length = 0;
    withRandom(0.2, function () { api.life.contact(0); });
    eq(msgCount('冲你拱手'), 1, 'C5 撞上商队：拱手话术照旧一字不动');
    eq(msgCount('伙计压低声音'), 1, 'C6 骰 0.2：捎带一句真行情');
    bands[0].cool = 0;
    msgs.length = 0;
    withRandom(0.9, function () { api.life.contact(0); });
    eq(msgCount('冲你拱手'), 1, 'C7 再撞一回：拱手照旧');
    eq(msgCount('伙计压低声音'), 0, 'C8 骰 0.9：这回没闲话（半数时候，不是每回都叨叨）');
    bands.length = 0;
}

// ==================== D · 哨兵 ====================
console.log('\n[D] 哨兵（接线在册、零新账、零漂移）');
{
    var rm = fs.readFileSync(path.join(ROOT, 'js/map/randomMap.js'), 'utf8');
    assert(rm.includes("case 'ask-market': askCaravanMarket(); break;") && rm.includes("case 'ask-road': askPostRoad(); break;"), 'D1 两个新动作接了分发');
    assert(rm.includes("if (vk === 'caravan') {") && rm.includes("out.push({ act: 'ask-market'") && rm.includes("if (vk === 'post') out.push({ act: 'ask-road'"), 'D2 动作按变体分发（篷车集/驿亭各归各）');
    assert(rm.includes('MARKET_SPREAD_MIN = 0.1'), 'D3 价差门槛在册（一成）');
    assert(rm.includes('shareRumor({ members: [] })'), 'D4 问路复用现成选点（不复制逻辑）');
    assert(rm.includes('function shareRumor(band)'), 'D5 shareRumor 老签名未动');
    // v40 新段零持久化字段、零随机数（行情牌是纯读，不该有任何写账与骰子）
    var seg = rm.slice(rm.indexOf('第四十波 · 商队行情'), rm.indexOf('// 商队闲话一句'));
    assert(seg.indexOf('currentCharData._') < 0 && seg.indexOf('cd._') < 0 && seg.indexOf('wildState') < 0, 'D6 问路问行情段零新存档字段（消息不落档）');
    assert(seg.indexOf('Math.random') < 0, 'D7 问路问行情段零随机数（纯读真源）');
    // 建图段没被碰：v40 的新随机只在 bandContact（运行时遭遇），不在建图函数里
    var buildSeg = rm.slice(rm.indexOf('function buildWildMap'), rm.indexOf('function stepTo'));
    assert(buildSeg.indexOf('caravanMarketTip') < 0 && buildSeg.indexOf('askCaravanMarket') < 0, 'D8 建图段无 v40 新调用（骰序零漂移）');
    assert(rm.includes('if (Math.random() < 0.5) {\n            const tip = caravanMarketTip();') || rm.includes('const tip = caravanMarketTip();'), 'D9 商队闲话接在 bandContact（运行时骰）');
    // 玩家可见新话术零拉丁：直取运行时产物（行情牌剥标签、闲话、两句拒辞）
    var visLeak = null;
    function scanVis(s, tag) {
        var vis = String(s).replace(/<[^>]*>/g, '');
        if (/[A-Za-z]/.test(vis) && !visLeak) visLeak = tag + ': ' + vis.slice(0, 30);
    }
    MD_TABLE = { '药材': { '南疆': 0.70, '中州': 1.20 } };
    scanVis(api.trade.html(), '行情牌');
    scanVis(api.trade.tip(), '商队闲话');
    var savedMD2 = global.MarketDynamic;
    global.MarketDynamic = undefined;
    msgs.length = 0; api.trade.askMarket();
    msgs.forEach(function (m) { scanVis(m.m, '拒辞·行情'); });
    global.MarketDynamic = savedMD2;
    global.currentPois.forEach(function (x) { x.discovered = true; });
    msgs.length = 0; api.trade.askRoad();
    msgs.forEach(function (m) { scanVis(m.m, '拒辞·问路'); });
    assert(visLeak === null, 'D10 玩家可见新话术零拉丁（漏: ' + visLeak + '）');
}

console.log('\n========== 第四十波 · 商队行情 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
