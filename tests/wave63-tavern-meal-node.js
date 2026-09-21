/**
 * wave63-tavern-meal-node.js — 第六十三波 · 酒楼点菜吃饭 验收：
 *   A 饱腹账：一顿饭补精力气血、饭劲顶四个时辰、封不超上限、话术把账讲明
 *   B 吃饱脚程：耗多少省多少——爬山省回 1、湿寒多耗的顶回来、平路不耗不省（吃饭吃不成刷精力）、力竭不救
 *   C 酒楼点菜：30 铜钱真扣、七城各有各的招牌菜、缺城回落通用话术、钱不够被拒、菜单按钮在册
 *   D 哨兵：新一节零骰、零存档、零发票子；stepTo 骰数不涨、判空计数不破；喝酒做东老账一字未动
 *
 * 运行：node tests/wave63-tavern-meal-node.js
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

// ==================== 共享全局桩（wave62 同源，另加铜钱桩） ====================
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
global.openBattleWithEntity = function () {};
global.addItemToInventory = function () { return true; };
global.itemById = {};
global.inventory = { currency: { spiritStones: 100 }, slots: [] };
global.EconomyTransaction = { getBalance: function () { return 100; }, debit: function () { return true; }, credit: function () { return true; } };
// 铜钱真源镜像（与 city-depth 同法）：扣款留痕
var copperCalls = [];
global.XianXia = {
    DataManager: {
        getSpiritStones: function () { return 100; },
        deductSpiritStones: function () { return true; },
        addSpiritStones: function () {},
        deductCopper: function (n) {
            copperCalls.push(n);
            if ((global.currentCharData.copper || 0) < n) return false;
            global.currentCharData.copper -= n;
            return true;
        }
    }
};
global.updateCharacterStatus = function () {};
global.updateCurrencyUI = function () {};
global.updateStatusPanel = function () {};
global.updateInsightUI = function () {};
global.getEffectiveMax = function () { return 100; };
global.generateRandomEnemy = function (level, type) { return { name: '敌' + level, type: type, hp: 100, level: level }; };
global.ResourcePoints = { listByRegion: function () { return []; } };
global.DungeonDynamic = { listActive: function () { return []; } };
global.StateRegistry = { register: function () {} };
var REALM_TIER = { '凡人': 0, '炼气': 1, '筑基': 2, '金丹': 3, '元婴': 4, '化神': 5 };
global.getRealmTier = function (r) { return REALM_TIER[r] != null ? REALM_TIER[r] : 1; };
global.currentCharData = { health: 100, maxHealth: 100, energy: 100, qi: 0, maxQi: 999, realm: '炼气', luck: 50, copper: 500, location: '帝都·长安' };
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
load('js/city-facilities/city-voices.js');
load('js/building-effects.js');

var WT = global.WildTerrain;
var api = global.wildMapApi;
var MEAL = api.meal;
var MCFG = MEAL.CFG;
var TAVERN = global.buildingEffects.buildingEffectsRegistry['tavern'];

function withRandom(v, fn) {
    var orig = Math.random;
    Math.random = function () { return v; };
    try { return fn(); } finally { Math.random = orig; }
}
// 全程一个种子（换种子=换山河清差量档）
global.setMapSeed('天下_w63_meal');
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
    global.currentCharData._wetUntil = 0;
    global.currentCharData._chillUntil = 0;
    global.currentCharData._fedUntil = 0;
}
function cellAt(x, y) { return (global.currentMap[y] || [])[x] || null; }
function forgeCell(x, y, key) {
    var c = cellAt(x, y);
    if (!c) return null;
    c.terrainKey = key;
    c.terrain = WT.TERRAIN[key];
    c.fog = 1;
    c.poiId = null;
    c.entities.length = 0;
    return c;
}
function forgeAdjacent(bx, by, key, skip) {
    var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2]];
    for (var i = 0; i < dirs.length; i++) {
        var nx = bx + dirs[i][0], ny = by + dirs[i][1];
        if (skip && skip.some(function (s) { return s.x === nx && s.y === ny; })) continue;
        var c = cellAt(nx, ny);
        if (!c || c.poiId || c.node || (c.entities || []).length) continue;
        return forgeCell(nx, ny, key);
    }
    return null;
}
// 走一格并回报精力净耗
function walkSpend(cell) {
    var before = global.currentCharData.energy;
    withRandom(0.99, function () { api.stepTo(cell.x, cell.y); });
    return before - global.currentCharData.energy;
}

global.timeSystem.gameTime.currentSeason = 'spring';
openSeed('中州');
global.currentCharData._travel = { regions: {}, marks: {}, steps: 0 };

// ==================== A · 饱腹账 ====================
console.log('\n[A] 饱腹账（一顿热饭的账）');
{
    eq(MCFG.EN, 40, 'A0 一顿补精力 40');
    eq(MCFG.HP, 10, 'A0b 顺带补气血 10');
    eq(MCFG.FED_MIN, 240, 'A0c 饭劲顶四个时辰（240 分钟）');
    eq(MCFG.STEP_SAVE, 1, 'A0d 每格至多省回 1 精力');
    setChar(50, 30);
    msgs.length = 0;
    eq(MEAL.feed('热汤热菜摆了一桌'), true, 'A1 吃饭账成了');
    eq(global.currentCharData.energy, 70, 'A2 精力 30 → 70');
    eq(global.currentCharData.health, 60, 'A2b 气血 50 → 60');
    eq(global.currentCharData._fedUntil, global.timeSystem.gameTime.totalMinutes + 240, 'A3 饭劲记到四个时辰后（运行时旗，与湿衣风寒同法）');
    assert(MEAL.isFed(), 'A3b 饱腹在身');
    assert(msgCount('热汤热菜') === 1 && msgCount('精力 +40') === 1 && msgCount('四个时辰') === 1, 'A4 话术把账讲明（补多少、顶多久、怎么省）');
    // 封不超上限
    setChar(95, 90);
    MEAL.feed('又是一顿');
    eq(global.currentCharData.energy, 100, 'A5 精力封顶不超（90+40 → 100）');
    eq(global.currentCharData.health, 100, 'A5b 气血封顶不超（95+10 → 100）');
    // 兜底菜话术
    setChar(50, 50);
    msgs.length = 0;
    MEAL.feed();
    assert(msgCount('热汤热菜摆了一桌') === 1, 'A6 没递菜名也有兜底话术（不空口）');
    // 饭劲过期
    global.timeSystem.advanceTime(241);
    eq(MEAL.isFed(), false, 'A7 四个时辰一过饭劲自散');
}

// ==================== B · 吃饱脚程 ====================
console.log('\n[B] 吃饱脚程（耗多少省多少——吃饭吃不成刷精力的路子）');
{
    var p = global.playerPos;
    var used = [];
    // 基线：爬山一格耗 1（moveCost≥2 的老账）
    setChar(100, 100);
    var m1 = forgeAdjacent(p.x, p.y, 'MOUNTAIN', used);
    used.push(m1);
    var spendM = walkSpend(m1);
    eq(spendM, 1, 'B1 基线：爬山一格耗 1 精力（老账）');
    // 吃饱爬山：省回 1，净耗 0
    setChar(100, 100);
    global.currentCharData._fedUntil = global.timeSystem.gameTime.totalMinutes + 999;
    var m2 = forgeAdjacent(global.playerPos.x, global.playerPos.y, 'MOUNTAIN', used);
    used.push(m2);
    eq(walkSpend(m2), 0, 'B2 吃饱爬山：耗的 1 点省回来（净耗 0——力气是饭吃出来的）');
    // 吃饱走平路：不耗也就不省——精力分毫不动（防刷账）
    setChar(100, 100);
    global.currentCharData._fedUntil = global.timeSystem.gameTime.totalMinutes + 999;
    var b1 = forgeAdjacent(global.playerPos.x, global.playerPos.y, 'PLAIN', used);
    used.push(b1);
    var spendP = walkSpend(b1);
    eq(spendP, 0, 'B3 吃饱走平路：不耗不省（净 0）');
    eq(global.currentCharData.energy, 100, 'B3b 精力分毫未涨——平路刷不出精力（守恒）');
    // 吃饱 + 湿衣：湿的 +1 被饭劲顶掉
    setChar(100, 100);
    global.currentCharData._fedUntil = global.timeSystem.gameTime.totalMinutes + 999;
    global.currentCharData._wetUntil = global.timeSystem.gameTime.totalMinutes + 999;
    var b2 = forgeAdjacent(global.playerPos.x, global.playerPos.y, 'PLAIN', used);
    used.push(b2);
    eq(walkSpend(b2), 0, 'B4 吃饱 + 湿衣：湿衣多耗的 1 点被饭劲顶掉（吃饱了抗造）');
    // 吃饱 + 湿 + 病：2 - 1 = 1
    setChar(100, 100);
    global.currentCharData._fedUntil = global.timeSystem.gameTime.totalMinutes + 999;
    global.currentCharData._wetUntil = global.timeSystem.gameTime.totalMinutes + 999;
    global.currentCharData._chillUntil = global.timeSystem.gameTime.totalMinutes + 999;
    var b3 = forgeAdjacent(global.playerPos.x, global.playerPos.y, 'PLAIN', used);
    used.push(b3);
    eq(walkSpend(b3), 1, 'B5 吃饱 + 湿 + 病：三本账各记各的（2 耗 1 省，净 1）');
    // 力竭不救：精力见底，吃饱也走不出精气神
    setChar(100, 0);
    global.currentCharData._fedUntil = global.timeSystem.gameTime.totalMinutes + 999;
    var b4 = forgeAdjacent(global.playerPos.x, global.playerPos.y, 'PLAIN', used);
    used.push(b4);
    msgs.length = 0;
    withRandom(0.99, function () { api.stepTo(b4.x, b4.y); });
    eq(global.currentCharData.energy, 0, 'B6 力竭的 0 不能被饭劲抹掉（吃饱抵不了垮账）');
    eq(global.currentCharData.health, 98, 'B6b 力竭硬撑照旧伤身（气血 -2 老账）');
    assert(msgCount('精力耗尽') === 1, 'B7 力竭话术照旧报');
    global.currentCharData._fedUntil = 0;
}

// ==================== C · 酒楼点菜 ====================
console.log('\n[C] 酒楼点菜（大城酒楼的第三个口子）');
{
    // 帝都：金齑玉脍
    global.currentCharData.location = '帝都·长安';
    global.currentCharData.copper = 500;
    global.currentCharData._fedUntil = 0;
    copperCalls.length = 0; msgs.length = 0; timeCalls.length = 0;
    eq(TAVERN.meal(), true, 'C1 点菜成了');
    eq(copperCalls.length, 1, 'C1b 铜钱真扣一笔（走 DataManager 真源，与喝酒做东同路）');
    eq(copperCalls[0], 30, 'C2 一顿 30 铜钱（喝酒 20 / 做东 40——一个价体系）');
    eq(global.currentCharData.copper, 470, 'C2b 钱袋子对账（500 → 470）');
    assert(MEAL.isFed(), 'C3 饭劲上身（酒楼那头真调了野外的饱腹账）');
    assert(msgCount('金齑玉脍') === 1, 'C4 帝都吃帝都的菜（金齑玉脍——分城口吻老账）');
    eq(timeCalls[timeCalls.length - 1].m, 30, 'C4b 吃饭花半个时辰（30 分钟真跳）');
    // 洛水城：锦鲤莼羹
    global.currentCharData.location = '洛水城';
    global.currentCharData._fedUntil = 0;
    msgs.length = 0;
    TAVERN.meal();
    assert(msgCount('锦鲤') === 1 && msgCount('莼羹') === 1, 'C5 洛水城吃洛水城的菜（新炙锦鲤配莼羹）');
    // 缺城回落
    global.currentCharData.location = '无名小城';
    global.currentCharData._fedUntil = 0;
    msgs.length = 0;
    TAVERN.meal();
    assert(msgCount('热汤热菜摆了一桌') === 1, 'C6 没配菜的城回落通用话术（缺城缺键回落——口吻包的老规矩）');
    // 钱不够
    global.currentCharData.location = '帝都·长安';
    global.currentCharData.copper = 10;
    global.currentCharData._fedUntil = 0;
    copperCalls.length = 0; msgs.length = 0;
    eq(TAVERN.meal(), false, 'C7 钱不够被拒');
    eq(copperCalls.length, 1, 'C7b 拒归拒，问过的账有一笔（扣款函数回了 false）');
    eq(global.currentCharData.copper, 10, 'C7c 一枚没扣');
    eq(MEAL.isFed(), false, 'C7d 没吃上就没饭劲');
    assert(msgCount('吃饭需30铜钱') === 1, 'C8 拒绝话术报价明白');
    // 菜单按钮在册、老按钮没被挤掉
    global.currentCharData.copper = 500;
    var dlgHtml = '';
    global.showBuildingEffectDialog = function (t, html) { dlgHtml = String(html); };
    TAVERN.open();
    assert(dlgHtml.indexOf('点菜吃饭') >= 0 && dlgHtml.indexOf('(30铜钱)') >= 0, 'C9 酒楼菜单头一个就是点菜吃饭（报价挂在脸上）');
    assert(dlgHtml.indexOf('喝酒听情报') >= 0 && dlgHtml.indexOf('结识NPC') >= 0, 'C10 喝酒与做东两个老口子照旧在（新按钮不挤老按钮）');
    assert(dlgHtml.indexOf('省回 1 精力') >= 0, 'C11 按钮把饭劲的账讲明（每格至多省回 1）');
    // 七城招牌菜
    var mealCities = Object.keys(global.CITY_VOICES).filter(function (c) {
        return global.CITY_VOICES[c].tavern && global.CITY_VOICES[c].tavern.meal;
    });
    eq(mealCities.length, 7, 'C12 有酒楼口吻的七城都配了招牌菜');
    var latin = /[A-Za-z]/;
    assert(mealCities.every(function (c) { return !latin.test(global.CITY_VOICES[c].tavern.meal); }), 'C13 七道菜全中文');
}

// ==================== D · 哨兵 ====================
console.log('\n[D] 哨兵（零骰、零存档、老切片不殃及）');
{
    var rm = fs.readFileSync(path.join(ROOT, 'js/map/randomMap.js'), 'utf8');
    var sStart = rm.indexOf('============ 第六十三波');
    var sEnd = rm.indexOf('window.wildMapApi = {');
    assert(sStart > 0 && sEnd > sStart, 'D0 六十三波段落标记有效（锚在横幅上）');
    var seg = rm.slice(sStart, sEnd);
    eq((seg.match(/Math\.random/g) || []).length, 0, 'D1 吃饭一节零骰（补多少、省多少、顶多久全是定数）');
    assert(seg.indexOf('localStorage') < 0 && seg.indexOf('saveWildState') < 0 && seg.indexOf('wildState') < 0,
        'D2 饱腹零直写存档（运行时旗——读档清账，与湿衣风寒同法）');
    assert(seg.indexOf('.credit(') < 0 && seg.indexOf('addSpiritStones') < 0 && seg.indexOf('.debit(') < 0,
        'D3 野外这头零票子（铜钱只在酒楼那头动——两本账各归各）');
    assert(seg.indexOf('insightPoints') < 0 && seg.indexOf('markOnce') < 0, 'D4 悟道点零发放（总闸已满）');
    // stepTo：骰数不涨、判空计数不破（五十九波 D8 的账）、接线在册
    var stStart = rm.indexOf('function stepTo');
    var stSeg = rm.slice(stStart, rm.indexOf('\nfunction ', stStart + 10));
    eq((stSeg.match(/Math\.random/g) || []).length, 1, 'D5 stepTo 仍一枚骰（护镖夜袭骰）');
    eq((stSeg.match(/_cdStep\.energy != null/g) || []).length, 5, 'D6 判空写法仍五处（省账走 Number+isFinite 的新写法，不占老计数）');
    assert(stSeg.indexOf('isFedNow()') >= 0 && stSeg.indexOf('Math.min(MEAL_STEP_SAVE, _spentStep)') >= 0,
        'D7 省账接线在册且带封顶（耗多少省多少——_spentStep 卡死刷精力的路子）');
    // 老切片不殃及
    var w59 = rm.slice(rm.indexOf('============ 第五十九波'), rm.indexOf('============ 对外暴露'));
    eq((w59.match(/Math\.random/g) || []).length, 1, 'D8 五十九波切片仍一枚骰');
    var w62s = rm.indexOf('============ 第六十二波');
    assert(w62s > 0 && w62s < sStart, 'D9 六十三波段落在六十二波段之后（切片各归各）');
    var bStart = rm.indexOf('function buildWildMap');
    var buildSeg = rm.slice(bStart, rm.indexOf('\nfunction ', bStart + 10));
    assert(buildSeg.indexOf('MEAL') < 0 && buildSeg.indexOf('isFedNow') < 0 && buildSeg.indexOf('makeFed') < 0,
        'D10 建图段无吃饭任何调用（骰序零漂移照旧）');
    assert(rm.indexOf('meal: {') >= 0 && rm.indexOf('feed: makeFed') >= 0, 'D11 对账出口在册（meal.CFG / isFed / feed）');
    assert(rm.indexOf('fed: prev') < 0 && rm.indexOf('prev.fed') < 0, 'D12 存档白名单没收饱腹（本就是零新字段）');
    assert(rm.indexOf('nemesis: null, notes: {}, px: -1') >= 0, 'D13 默认域对象串一字未动');
    // 话术零拉丁（代码记号走过滤）
    var latin = /[A-Za-z]/;
    var visLeak = null;
    (seg.match(/'[^']+'/g) || []).forEach(function (s) {
        var v = s.slice(1, -1);
        if (/[+);({\[,]/.test(v)) return;
        if (/^[a-z0-9]+(?:[-_: ][a-z0-9]+)*$/.test(v)) return;   // 小写代码记号（energy 之类）
        if (latin.test(v)) visLeak = visLeak || s;
    });
    assert(visLeak === null, 'D14 吃饭一节话术零拉丁（漏: ' + visLeak + '）');
    // building-effects：新口子在册、老口子一字未动
    var be = fs.readFileSync(path.join(ROOT, 'js/building-effects.js'), 'utf8');
    assert(be.indexOf('meal: function()') >= 0 && be.indexOf("useBuildingEffect('tavern', 'meal')") >= 0,
        'D15 酒楼点菜动作与按钮接线在册');
    assert(be.indexOf('generateTavernIntel()') >= 0 && be.indexOf("useBuildingEffect('tavern', 'drink')") >= 0 && be.indexOf("useBuildingEffect('tavern', 'meet_npc')") >= 0,
        'D16 喝酒听情报与做东的老账一字未动（真传闻池照旧）');
    assert(be.indexOf('window.wildMapApi.meal.feed(dish)') >= 0, 'D17 酒楼调野外饱腹账接线在册（菜话术递过去）');
    // city-voices：meal 键七个、老键没被挤掉
    var cv = fs.readFileSync(path.join(ROOT, 'js/city-facilities/city-voices.js'), 'utf8');
    eq((cv.match(/meal: '/g) || []).length, 7, 'D18 口吻包添了七道招牌菜（一城一味）');
    eq((cv.match(/meet: '/g) || []).length, 7, 'D19 七城结识词原样（添菜没挤掉老词）');
}

console.log('\n========== 第六十三波 · 酒楼点菜吃饭 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
