/**
 * wave41-escort-node.js — 第四十一波 · 真路真镖 验收：
 *   A 接镖：篷车集独有、目的地是本图真镇子、货跟行情走、酬金限期按公式、一单一了
 *   B 截镖：日 12% 夜 18%、人形响马等级=境界+1、真战斗不挂切磋、胜负结算各归各
 *   C 送达与到期：踩上目标镇酬金走经济真账、误期撤镖零收入、带镖扎营夜袭+10%、侧栏镖旗
 *   D 哨兵：接线在册、除 _escort 外零新存档字段、建图段零漂移、零拉丁
 *
 * 运行：node tests/wave41-escort-node.js
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

// ==================== 共享全局桩（wave40 同源） ====================
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
var absDayVal = 500;
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
// 经济真账监账
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
// ⚠️ currentPois 是建图时挂上 window 的同一个数组引用——只能原地增删
function footTown(variantKey, variantName) {
    var p = global.playerPos;
    var cell = global.currentMap[p.y][p.x];
    cell.terrainKey = 'ROAD';
    cell.terrain = WT.TERRAIN.ROAD;
    cell.poiId = 'w41_town';
    removePoi('w41_town');
    global.currentPois.push({
        id: 'w41_town', type: 'town', name: '测试篷车集', icon: '🏘️', x: p.x, y: p.y, discovered: true,
        variant: { key: variantKey, name: variantName, rest: { cost: 4, stones: 3 } }, variantName: variantName
    });
    return cell;
}
function clearFootTown() {
    global.currentMap[global.playerPos.y][global.playerPos.x].poiId = null;
    removePoi('w41_town');
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
function stepPlain() {
    var t = adjacentPlain();
    if (!t) return false;
    return withRandom(0.99, function () { return api.stepTo(t.x, t.y); });
}

openSeed('中州', '中州_w41_escort');
MD_TABLE = { '药材': { '南疆': 0.70, '中州': 1.20 }, '矿材': { '西荒': 0.70, '东海': 1.15 } };

// ==================== A · 接镖 ====================
console.log('\n[A] 接镖（篷车集独有、真镇子真路程、货跟行情走）');
{
    var cell = footTown('caravan', '篷车集');
    var acts = api.tileActions(cell);
    assert(acts.some(function (a) { return a.act === 'escort-job'; }), 'A1 篷车集脚下有「接一趟护镖」');
    cell = footTown('post', '驿亭');
    assert(!api.tileActions(cell).some(function (a) { return a.act === 'escort-job'; }), 'A2 驿亭不接镖（那是篷车集的买卖）');

    footTown('caravan', '篷车集');
    delete global.currentCharData._escort;
    msgs.length = 0;
    withRandom(0.5, function () { api.poiAction('escort-job'); });
    var e = api.escort.ledger();
    assert(!!e, 'A3 接镖成单（账挂上了）');
    eq(e.region, global.currentRegionForMap, 'A4 镖账记着本域（跨域休眠的凭据）');
    var target = global.currentPois.find(function (x) { return x.id === e.toId; });
    assert(target && target.type === 'town' && target.id !== 'w41_town', 'A5 目的地是本图另一处真镇子');
    assert(target.discovered === true && target.rumored === true, 'A6 雇主画路：目标真上图（复用揭示账）');
    eq(e.fee, Math.min(CFG.cap, CFG.base + CFG.perStep * e.steps), 'A7 酬金=起步60+每格8，封顶600（按真实路程定死）');
    eq(e.deadlineDay, absDayVal + 2 + Math.ceil(e.steps / 50), 'A8 限期=今日+2+每五十格宽限一日');
    eq(e.cargo, '药材', 'A9 货跟行情走：挑价差最大的行当（药材 0.5 > 矿材 0.45）');
    assert(msgs.some(function (m) { return m.m.indexOf('药材') >= 0 && m.m.indexOf(String(e.fee)) >= 0; }), 'A10 接单话术把货、酬金、限期都说清');

    // 一单一了
    var fee0 = e.fee;
    msgs.length = 0;
    withRandom(0.5, function () { api.poiAction('escort-job'); });
    eq(api.escort.ledger().fee, fee0, 'A11 一单在手拒第二单（原单分毫未动）');
    eq(msgCount('一单一了'), 1, 'A12 拒得有镖行规矩话术');

    // 行情缺席 → 杂货
    global.currentCharData._escort = null;
    var savedMD = global.MarketDynamic;
    global.MarketDynamic = undefined;
    withRandom(0.5, function () { api.escort.take(); });
    eq(api.escort.ledger().cargo, '杂货', 'A13 行情账缺席：押的是杂货（拒单不至于）');
    global.MarketDynamic = savedMD;

    // 坏账归一化
    global.currentCharData._escort = { junk: 1 };
    eq(api.escort.ledger(), null, 'A14 坏账当无镖（归一化只认字段）');
    global.currentCharData._escort = { region: '别域', toId: 'x', toName: '外镇', fee: 100, deadlineDay: 9999 };
    eq(api.escort.activeHere(), false, 'A15 别域的镖本图休眠（不掷截镖骰）');
    clearFootTown();
}

// ==================== B · 截镖 ====================
console.log('\n[B] 截镖（日12%夜18%、人形响马、真战斗不切磋）');
{
    global.currentCharData._escort = { region: global.currentRegionForMap, cargo: '药材', toId: 'nowhere', toName: '外镇', fee: 200, deadlineDay: absDayVal + 5, takenDay: absDayVal, steps: 17 };
    global.timeSystem.gameTime.currentHour = 10;
    battles.length = 0; genCalls.length = 0; msgs.length = 0;
    withRandom(0.05, function () { api.escort.step(); });
    eq(battles.length, 1, 'B1 白日骰 0.05 < 12%：截镖的真来了');
    eq(genCalls[0].type, 'enemy', 'B2 来的是人不是兽（响马走人形口）');
    eq(genCalls[0].level, 10, 'B3 响马等级=境界档+1（金丹 9+1，敢截镖的都是好手）');
    assert(battles[0]._escortRaider === true && /截镖的/.test(battles[0].name), 'B4 敌人挂截镖旗、名带帮派字号');
    assert(!battles[0]._isSpar && !global.currentBattle._isSpar, 'B5 这是生死仗不是切磋（不挂切磋语义）');
    eq(msgCount('此路是我开'), 1, 'B6 截镖有话术');

    battles.length = 0;
    withRandom(0.5, function () { api.escort.step(); });
    eq(battles.length, 0, 'B7 白日骰 0.5：平安赶路（12% 不是步步劫）');

    // 夜里更凶：同一颗骰 0.15，白日不中、夜里中
    battles.length = 0;
    withRandom(0.15, function () { api.escort.step(); });
    eq(battles.length, 0, 'B8 骰 0.15 白日不中（>12%）');
    global.timeSystem.gameTime.currentHour = 23;
    withRandom(0.15, function () { api.escort.step(); });
    eq(battles.length, 1, 'B9 同一颗骰夜里中（18%>15%，夜路更凶）');
    global.timeSystem.gameTime.currentHour = 10;

    // 胜结算：镖续走
    var e0 = global.currentCharData._escort;
    msgs.length = 0;
    api.escort.settle(true);
    eq(global.currentCharData._escort, e0, 'B10 打赢：镖在人在，账分毫未动');
    eq(msgCount('镖在，人在'), 1, 'B11 胜有话术');

    // 败结算：货损账清
    msgs.length = 0;
    api.escort.settle(false);
    eq(global.currentCharData._escort, null, 'B12 打输：货损账清（酬金化为乌有）');
    assert(msgs.some(function (m) { return m.m.indexOf('200') >= 0 && m.m.indexOf('化为乌有') >= 0; }), 'B13 败话术把损失的酬金说在明处');
    msgs.length = 0;
    api.escort.settle(true);
    eq(msgs.length, 0, 'B14 无镖时结算安静收场（不误报）');

    // stepTo 集成：骰 0.99 一路无事，镖账还在；接线不炸
    global.currentCharData._escort = { region: global.currentRegionForMap, cargo: '药材', toId: 'nowhere', toName: '外镇', fee: 200, deadlineDay: absDayVal + 5, takenDay: absDayVal, steps: 17 };
    battles.length = 0;
    assert(stepPlain(), 'B15 带镖赶路一步（集成不炸）');
    eq(battles.length, 0, 'B16 骰 0.99：这步平安');
    assert(!!api.escort.ledger(), 'B17 镖账随行走存活');
}

// ==================== C · 送达与到期 ====================
console.log('\n[C] 送达与到期（唯一兑付口是送达）');
{
    // 踩上目标镇 → 结账
    var t = adjacentPlain();
    var cell = global.currentMap[t.y][t.x];
    cell.poiId = 'w41_target';
    global.currentPois.push({ id: 'w41_target', type: 'town', name: '落雁镇', icon: '🏘️', x: t.x, y: t.y, discovered: true, variant: { key: 'hamlet', name: '残村' }, variantName: '残村' });
    global.currentCharData._escort = { region: global.currentRegionForMap, cargo: '药材', toId: 'w41_target', toName: '落雁镇', fee: 236, deadlineDay: absDayVal + 5, takenDay: absDayVal, steps: 22 };
    credits.length = 0; rewardCalls.length = 0; msgs.length = 0;
    assert(withRandom(0.99, function () { return api.stepTo(t.x, t.y); }), 'C1 一脚踩进落雁镇');
    eq(credits.length, 1, 'C2 酬金走经济真账（一笔入账）');
    eq(credits[0] && credits[0].kind, 'spiritStones', 'C3 入的是灵石账');
    eq(credits[0] && credits[0].n, 236, 'C4 分毫不少（236=60+8×22）');
    eq(global.currentCharData._escort, null, 'C5 送达账清');
    assert(rewardCalls.some(function (c) { return c.r.fame === 1 && c.source === 'escort'; }), 'C6 名气 +1 走统一发放通道（名义「护镖」）');
    eq(msgCount('圆满'), 1, 'C7 送达有话术');
    removePoi('w41_target');
    cell.poiId = null;

    // 误期撤镖
    global.currentCharData._escort = { region: global.currentRegionForMap, cargo: '药材', toId: 'nowhere', toName: '外镇', fee: 200, deadlineDay: absDayVal - 1, takenDay: absDayVal - 9, steps: 17 };
    credits.length = 0; msgs.length = 0;
    withRandom(0.99, function () { api.escort.step(); });
    eq(global.currentCharData._escort, null, 'C8 误了限期：雇主撤镖，账清');
    eq(credits.length, 0, 'C9 撤镖分文未入（白走一趟是真代价）');
    eq(msgCount('撤了'), 1, 'C10 撤镖有话术');

    // 带镖扎营：夜袭 +10%（同一颗骰：不带镖不中、带镖中）
    var p = global.playerPos;
    var campCell = global.currentMap[p.y][p.x];
    campCell.terrainKey = 'PLAIN'; campCell.terrain = WT.TERRAIN.PLAIN; campCell.poiId = null;
    global.currentCharData._escort = null;
    battles.length = 0;
    withRandom(0.15, function () { api.poiAction('camp'); });
    eq(battles.length, 0, 'C11 平原不带镖：骰 0.15 夜袭不中（10%）');
    global.currentCharData._escort = { region: global.currentRegionForMap, cargo: '药材', toId: 'nowhere', toName: '外镇', fee: 200, deadlineDay: absDayVal + 5, takenDay: absDayVal, steps: 17 };
    battles.length = 0; msgs.length = 0;
    withRandom(0.15, function () { api.poiAction('camp'); });
    eq(battles.length, 1, 'C12 同一颗骰带镖就中（10%+10%，劫镖劫的就是夜里）');
    assert(battles[0]._escortRaider === true, 'C13 夜袭 camp 来的也是截镖的（不是野物）');
    eq(msgCount('火把围了营地'), 1, 'C14 劫营有话术');

    // 侧栏镖旗
    global.currentCharData._escort = { region: global.currentRegionForMap, cargo: '药材', toId: 'w41_flag', toName: '望山驿', fee: 244, deadlineDay: absDayVal + 3, takenDay: absDayVal, steps: 23 };
    global.currentPois.push({ id: 'w41_flag', type: 'town', name: '望山驿', icon: '🏘️', x: p.x + 4, y: p.y + 3, discovered: true, variant: { key: 'post', name: '驿亭' }, variantName: '驿亭' });
    withRandom(0.99, function () { global.renderWildSidebar(); });
    var line = els['wild-escort-line'].innerHTML;
    assert(line.indexOf('药材') >= 0 && line.indexOf('望山驿') >= 0, 'C15 侧栏镖旗：货与目的地都在');
    assert(line.indexOf('酬 244') >= 0 && line.indexOf('余 3 日') >= 0, 'C16 酬金与余日挂在旗上');
    assert(line.indexOf('poi-goto') >= 0 && line.indexOf('东南') >= 0, 'C17 镖旗可点（复用指路接线）、带方位');
    global.currentCharData._escort = null;
    withRandom(0.99, function () { global.renderWildSidebar(); });
    eq(els['wild-escort-line'].innerHTML, '', 'C18 无镖时旗收起（不挂空牌）');
    removePoi('w41_flag');
}

// ==================== D · 哨兵 ====================
console.log('\n[D] 哨兵（接线在册、零漂移、零拉丁）');
{
    var rm = fs.readFileSync(path.join(ROOT, 'js/map/randomMap.js'), 'utf8');
    assert(rm.includes("case 'escort-job': takeEscortJob(); break;"), 'D1 接镖接了动作分发');
    assert(rm.includes("if (!escortDeliverHere(cell)) stepEscortCheck(); } catch (eEscort) {}"), 'D2 送达优先、截镖随后（stepTo 真接线）');
    assert(rm.includes('ESCORT_FEE_CAP = 600') && rm.includes('ESCORT_AMBUSH_DAY = 0.12') && rm.includes('ESCORT_AMBUSH_NIGHT = 0.18') && rm.includes('ESCORT_CAMP_MOD = 0.10'), 'D3 四个数在册（封顶600、日12%、夜18%、扎营+10%）');
    assert(rm.includes("window.EconomyTransaction.credit('spiritStones', Number(e.fee)"), 'D4 酬金走经济真账（唯一兑付口）');
    // 建图段零漂移：v41 的任何函数不许出现在建图段里
    var buildSeg = rm.slice(rm.indexOf('function buildWildMap'), rm.indexOf('function stepTo'));
    assert(buildSeg.indexOf('takeEscortJob') < 0 && buildSeg.indexOf('spawnEscortRaiders') < 0 && buildSeg.indexOf('stepEscortCheck') < 0, 'D5 建图段无 v41 调用（骰序零漂移）');
    // 新段除 _escort 外零存档字段
    var seg = rm.slice(rm.indexOf('第四十一波 · 真路真镖'), rm.indexOf('function exploreWildRuin'));
    var fields = seg.match(/cd\._[A-Za-z]+|currentCharData\._[A-Za-z]+/g) || [];
    assert(fields.every(function (f) { return /_escort$/.test(f); }), 'D6 v41 段新存档字段只有 _escort 一个');
    var app = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
    assert(app.indexOf('window.settleEscortRaid(true)') > 0 && app.indexOf('window.settleEscortRaid(false)') > 0, 'D7 app.js 胜负两处结算钩子都在');
    assert(app.indexOf('currentBattle.enemy._escortRaider') > 0, 'D8 钩子认敌人身上的截镖旗（整包透传老路）');
    var htmlFile = fs.readFileSync(path.join(ROOT, '仙侠.html'), 'utf8');
    assert(htmlFile.indexOf('wild-escort-line') > 0, 'D9 侧栏镖旗元素在页面里');
    // 玩家可见新话术零拉丁：直取运行时产物
    var visLeak = null;
    msgs = [];
    global.currentCharData._escort = null;
    footTown('caravan', '篷车集');
    withRandom(0.5, function () { api.escort.take(); });
    msgs.forEach(function (m) { if (/[A-Za-z]/.test(m.m)) visLeak = m.m; });
    withRandom(0.01, function () { api.escort.step(); });
    msgs.forEach(function (m) { if (/[A-Za-z]/.test(m.m)) visLeak = visLeak || m.m; });
    global.currentCharData._escort = { region: global.currentRegionForMap, cargo: '药材', toId: 'x', toName: '外镇', fee: 1, deadlineDay: absDayVal - 1 };
    api.escort.step();
    msgs.forEach(function (m) { if (/[A-Za-z]/.test(m.m)) visLeak = visLeak || m.m; });
    var sideHtml = els['wild-escort-line'].innerHTML;
    assert(visLeak === null, 'D10 玩家可见新话术零拉丁（漏: ' + visLeak + '）');
    assert(!/[A-Za-z]/.test(sideHtml.replace(/<[^>]*>/g, '').replace(/poi-goto|w41[A-Za-z_]*/g, '')), 'D11 镖旗可见文字零拉丁');
    clearFootTown();
}

console.log('\n========== 第四十一波 · 真路真镖 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
