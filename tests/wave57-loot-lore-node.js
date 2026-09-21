/**
 * wave57-loot-lore-node.js — 第五十七波 · 遗宝残页 验收：
 *   A 洞天残页：开匣到手即现残页——主人/缘由/页尾三段全在池子里，走定数哈希，带本域拾页数
 *   B 赃物残页：三胜了结翻出的赃物也带残页（走「失主」那本账）；行囊塞不下不现残页
 *   C 定数账：同货同域同来历永远同一段残页；两本缘由池不串；坏参数不炸
 *   D 哨兵：新一节零骰、零存档、零经济、零悟道点、话术零拉丁；老切片骰数不涨；建图零染；接线在册
 *
 * 运行：node tests/wave57-loot-lore-node.js
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

// ==================== 共享全局桩（wave50/51 同源） ====================
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
var bagCalls = [];
var bagOk = true;
global.addItemToInventory = function (id, n) { bagCalls.push({ id: id, n: n }); return bagOk; };
global.itemById = {
    pill_qi_gather: { id: 'pill_qi_gather', name: '聚气丹' },
    pill_big_recovery: { id: 'pill_big_recovery', name: '大还丹' },
    attack_talisman: { id: 'attack_talisman', name: '攻击符' }
};
var purseBalance = 1000;
global.EconomyTransaction = {
    getBalance: function (c) { return c === 'spiritStones' ? purseBalance : 0; },
    debit: function (c, amt) { if (purseBalance < amt) return false; purseBalance -= amt; return true; },
    credit: function () { return true; }
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
global.DataManager = { getSpiritStones: function () { return purseBalance; }, deductSpiritStones: function () { return true; }, addSpiritStones: function () {} };
global.insightPoints = 0;

load('js/map/map-markers.js');
load('js/economy/spirit-vein.js');
load('js/map/travel-journal.js');
load('js/core/state-registry.js');
load('js/map/wild-terrain.js');
load('js/map/randomMap.js');

var WT = global.WildTerrain;
var api = global.wildMapApi;
var LORE = api.lore;
var LCFG = LORE.CFG;
var NEM = api.nemesis;
var LOOT = api.grotto.LOOT;

function withRandom(v, fn) {
    var orig = Math.random;
    Math.random = function () { return v; };
    try { return fn(); } finally { Math.random = orig; }
}
// 全程一个种子（换种子=换山河清差量档），换域直接重开图
global.setMapSeed('天下_w57_lore');
function openSeed(region) {
    withRandom(0.99, function () { global.openWildernessMap(region); });
}
function msgCount(word) {
    return msgs.filter(function (m) { return m.m.indexOf(word) >= 0; }).length;
}
function findMsg(word) {
    for (var i = 0; i < msgs.length; i++) if (msgs[i].m.indexOf(word) >= 0) return msgs[i];
    return null;
}
function setChar(realm, hp, en) {
    global.currentCharData.realm = realm;
    global.currentCharData.health = hp;
    global.currentCharData.energy = en;
    global.currentCharData._wearyNoticed = false;
    global.currentCharData._spentNoticed = false;
}
function cellAt(x, y) { return (global.currentMap[y] || [])[x] || null; }
function forgeCell(x, y, key, elev) {
    var c = cellAt(x, y);
    if (!c) return null;
    c.terrainKey = key;
    c.terrain = WT.TERRAIN[key];
    c.fog = 1;
    if (elev != null) c.elev = elev;
    return c;
}
function forgeAdjacent(bx, by, key, elev, skip) {
    var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2], [1, 1], [-1, 1], [1, -1], [-1, -1]];
    for (var i = 0; i < dirs.length; i++) {
        var nx = bx + dirs[i][0], ny = by + dirs[i][1];
        if (skip && skip.some(function (s) { return s.x === nx && s.y === ny; })) continue;
        var c = cellAt(nx, ny);
        if (!c || c.poiId || c.node || (c.entities || []).length) continue;
        forgeCell(nx, ny, key, elev);
        return { x: nx, y: ny };
    }
    return null;
}
function ledger(region) {
    var st = api.state().regions[region];
    return st ? st.nemesis : undefined;
}
// 与生产同一套定数：货名+地域+来历 → 哈希取池
function loreHashT(s) {
    var h = 0; s = String(s || '');
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 9973;
    return h;
}
function expectStory(id, region, kind) {
    var seed = String(id) + '|' + region + '|';
    var whyPool = kind === 'spoils' ? LCFG.SPOIL_WHY : LCFG.GROTTO_WHY;
    return {
        owner: LCFG.OWNERS[loreHashT(seed + 'owner') % LCFG.OWNERS.length],
        why: whyPool[loreHashT(seed + 'why') % whyPool.length],
        echo: LCFG.ECHOES[loreHashT(seed + 'echo') % LCFG.ECHOES.length]
    };
}

global.timeSystem.gameTime.currentSeason = 'spring';
openSeed('中州');
global.currentCharData._travel = { regions: {}, marks: {}, steps: 0 };

// ==================== A · 洞天残页 ====================
console.log('\n[A] 洞天残页（开匣到手，旧物自己讲来历）');
var grottoLootId = null;
{
    setChar('炼气', 100, 100);
    var p0 = global.playerPos;
    var mt1 = forgeAdjacent(p0.x, p0.y, 'MOUNTAIN', 0.8, []);
    withRandom(0.99, function () { api.stepTo(mt1.x, mt1.y); });
    withRandom(0.0, function () { api.poiAction('meditate'); });   // 发现骰必中
    assert(api.grotto.at(mt1.x, mt1.y), 'A0 崖壁打坐发现洞天（四十九波的老账照好使）');

    msgs.length = 0; bagCalls.length = 0;
    api.poiAction('grotto-enter');
    eq(bagCalls.length, 1, 'A1 供案下开出一匣遗宝（入囊一件）');
    grottoLootId = bagCalls[0].id;
    assert(msgCount('前辈遗宝') === 1, 'A2 老话术一字未动（尘封多年，今日归你）');
    eq(msgCount('匣底还压着半张残页'), 1, 'A3 开匣即现残页（一条，不多不少）');
    var lm = findMsg('匣底还压着半张残页');
    eq(lm.t, 'info', 'A3b 残页是见闻话术（info——不是得失账）');
    var es = expectStory(grottoLootId, '中州', 'grotto');
    assert(lm.m.indexOf(es.owner) >= 0, 'A4 残页报得出主人（' + es.owner + '）');
    assert(lm.m.indexOf(es.why) >= 0, 'A5 缘由在洞天那本账里（留在洞里的四种缘故之一）');
    assert(LCFG.GROTTO_WHY.indexOf(es.why) >= 0, 'A5b 缘由确在池内（不是现编的）');
    assert(lm.m.indexOf(es.echo) >= 0 && LCFG.ECHOES.indexOf(es.echo) >= 0, 'A6 页尾小字在池内（' + es.echo + '）');
    assert(lm.m.indexOf('已拾得 1 张') >= 0, 'A7 带本域拾页数（第一张——从开匣账现推，零新存档字段）');
    var st = LORE.story(grottoLootId, 'grotto');
    assert(st.owner === es.owner && st.why === es.why && st.echo === es.echo, 'A8 生产出口与测试同算一段残页（定数哈希对得上）');
    eq(LORE.hash('聚气丹'), loreHashT('聚气丹'), 'A9 哈希与选件同一套算法（h*31+c 模 9973）');
}

// ==================== B · 赃物残页 ====================
console.log('\n[B] 赃物残页（贼窝里的东西，各有各的失主）');
{
    withRandom(0.0, function () { NEM.forge(); });   // 中州结仇必中
    var nemName = NEM.active().name;
    ledger('中州').wins = 2;   // 摆到决战前夜
    ABS_DAY = 802;
    battles.length = 0;
    withRandom(0.0, function () { NEM.ambush(); });
    eq(battles.length, 1, 'B0 仇家拦道（三照面）');
    msgs.length = 0; bagCalls.length = 0;
    global.insightPoints = 0;
    NEM.settle(true);
    assert(msgCount('梁子了结') === 1, 'B1 三胜了结照旧');
    eq(bagCalls.length, 1, 'B2 赃物一件（名号哈希定数选件，五十波老账）');
    var spId = bagCalls[0].id;
    assert(LOOT['中州'].indexOf(spId) >= 0, 'B2b 赃物在中州特产池里');
    eq(msgCount('里夹着半张褪色的残页'), 1, 'B3 赃物也带残页（一条）');
    var sm = findMsg('里夹着半张褪色的残页');
    var es2 = expectStory(spId, '中州', 'spoils');
    assert(sm.m.indexOf(es2.owner) >= 0, 'B4 残页报得出失主（' + es2.owner + '）');
    assert(sm.m.indexOf(es2.why) >= 0 && LCFG.SPOIL_WHY.indexOf(es2.why) >= 0, 'B5 缘由走「失物」那本账（被劫/当粮/遭难三选——不串洞天的账）');
    assert(sm.m.indexOf(es2.echo) >= 0, 'B6 页尾小字照旧在池内');
    eq(global.insightPoints, 0, 'B7 残页零悟道点（总闸已满——旧事不换点）');
    eq(msgCount('木匣'), 0, 'B8 赃物残页不借洞天的话术（两本账两套口）');

    // 行囊塞不下：赃物留在山上，残页也不现（东西都没拿到，看什么残页）
    openSeed('东荒');
    withRandom(0.0, function () { NEM.forge(); });
    ledger('东荒').wins = 2;
    ABS_DAY = 804;
    withRandom(0.0, function () { NEM.ambush(); });
    msgs.length = 0; bagCalls.length = 0; bagOk = false;
    NEM.settle(true);
    assert(msgCount('只得留在山上') === 1, 'B9 塞不下：赃物留山上（五十一波老账）');
    eq(msgCount('残页'), 0, 'B10 东西没到手就不现残页');
    bagOk = true;
}

// ==================== C · 定数账 ====================
console.log('\n[C] 定数账（同货同域永远同一段，坏参数不炸）');
{
    var s1 = LORE.story('pill_qi_gather', 'grotto');
    var s2 = LORE.story('pill_qi_gather', 'grotto');
    assert(s1.owner === s2.owner && s1.why === s2.why && s1.echo === s2.echo, 'C1 同货同域同来历：残页分毫不差（天荒地老不变）');
    var overlap = LCFG.GROTTO_WHY.filter(function (w) { return LCFG.SPOIL_WHY.indexOf(w) >= 0; });
    eq(overlap.length, 0, 'C2 两本缘由池不串（留在洞里的 ≠ 被劫走的）');
    var latin = /[A-Za-z]/;
    var allPure = LCFG.OWNERS.concat(LCFG.GROTTO_WHY, LCFG.SPOIL_WHY, LCFG.ECHOES).every(function (s) { return s && !latin.test(s); });
    assert(allPure, 'C3 四本池子全中文（残页是给玩家读的，一个拉丁字母都没有）');
    assert(LCFG.OWNERS.length === 8 && LCFG.ECHOES.length === 8 && LCFG.GROTTO_WHY.length === 4 && LCFG.SPOIL_WHY.length === 3,
        'C4 池子规模有账（主 8 × 洞天缘 4 / 失物缘 3 × 页尾 8——组合数百，段段定数）');
    var threw = false;
    try { LORE.show(null, null); LORE.show(undefined, 'spoils'); } catch (e) { threw = true; }
    assert(!threw, 'C5 坏参数不炸（残页是添头，添头不能拖垮正账）');
    var bad = LORE.story(undefined, undefined);
    assert(LCFG.OWNERS.indexOf(bad.owner) >= 0 && LCFG.ECHOES.indexOf(bad.echo) >= 0, 'C5b 坏参数也拼得出池内残页');
    msgs.length = 0;
    LORE.show('no_such_item', 'spoils');
    assert(msgCount('【旧物】') === 1, 'C6 查无此货报名「旧物」（不炸不空）');
    msgs.length = 0;
    LORE.show('pill_qi_gather', 'grotto', 0);
    eq(msgCount('已拾得'), 0, 'C7 拾页数没到不挂计数（零张不说零张）');
    // 地域进种子：同货换域，残页跟着换（东荒的聚气丹与中州的不是一段旧事）
    var inDong = LORE.story('pill_qi_gather', 'grotto');   // 此刻人在东荒
    openSeed('蜀地');
    var inShu = LORE.story('pill_qi_gather', 'grotto');
    assert(inDong.owner !== inShu.owner || inDong.why !== inShu.why || inDong.echo !== inShu.echo,
        'C8 地域进种子（同货换域换故事——各地的旧物各有各的来历）');
    assert(LCFG.OWNERS.indexOf(inShu.owner) >= 0, 'C8b 换域拼出的仍在池内');
    ABS_DAY = 800;
}

// ==================== D · 哨兵 ====================
console.log('\n[D] 哨兵（零骰、零存档、零经济、老切片不殃及）');
{
    var rm = fs.readFileSync(path.join(ROOT, 'js/map/randomMap.js'), 'utf8');
    var sStart = rm.indexOf('============ 第五十七波');
    var sEnd = rm.indexOf('第四十九波 · 崖壁隐藏洞天');
    assert(sStart > 0 && sEnd > sStart, 'D0 五十七波段落标记有效（锚在横幅上）');
    var seg = rm.slice(sStart, sEnd);
    eq((seg.match(/Math\.random/g) || []).length, 0, 'D1 残页一节零骰（哈希是定数，不是骰）');
    assert(seg.indexOf('localStorage') < 0 && seg.indexOf('saveWildState') < 0 && seg.indexOf('wildState') < 0,
        'D2 残页零直写存档（不入账——到手那一刻现出，随一次性事件走）');
    assert(seg.indexOf('addSpiritStones') < 0 && seg.indexOf('.credit(') < 0 && seg.indexOf('.debit(') < 0 && seg.indexOf('EconomyTransaction') < 0,
        'D3 残页零经济（旧事不换钱）');
    assert(seg.indexOf('insightPoints') < 0 && seg.indexOf('markOnce') < 0, 'D4 悟道点零发放（总闸已满）');
    // 老切片骰数不涨（五十七波段落在五十一波切片内，靠零骰保平安）
    var nSeg = rm.slice(rm.indexOf('第五十一波 · 具名响马宿敌'), sEnd);
    eq((nSeg.match(/Math\.random/g) || []).length, 5, 'D5 五十一波切片仍五枚骰（残页段零骰没添账）');
    var gSeg = rm.slice(sEnd, rm.indexOf('第三十八波 · 扎营歇夜'));
    eq((gSeg.match(/Math\.random/g) || []).length, 1, 'D6 洞天一节仍只一枚骰（发现骰）');
    var bStart = rm.indexOf('function buildWildMap');
    var buildSeg = rm.slice(bStart, rm.indexOf('\nfunction ', bStart + 10));
    assert(buildSeg.indexOf('LORE') < 0 && buildSeg.indexOf('loreHash') < 0 && buildSeg.indexOf('showLootLore') < 0,
        'D7 建图段无残页任何调用（骰序零漂移照旧）');
    // 接线在册：两条到手路都挂残页
    assert(rm.indexOf("showLootLore(id, 'grotto', Object.keys(done).length)") >= 0, 'D8 开匣路接线在册（遗宝到手即现残页）');
    assert(rm.indexOf("showLootLore(id, 'spoils')") >= 0, 'D9 赃物路接线在册（了结翻赃即现残页）');
    // 零新存档字段：白名单与默认域对象一字未动
    assert(rm.indexOf('grottoLoot: prev.grottoLoot || {},') >= 0 && rm.indexOf('lore: prev.') < 0 && rm.indexOf('prev.lore') < 0,
        'D10 存档白名单没收残页（本就是零新字段——残页随货现，不落账）');
    assert(rm.indexOf('nemesis: null, notes: {}, px: -1') >= 0, 'D11 默认域对象串一字未动（老档自动补空的账没被殃及）');
    // 话术零拉丁（代码记号走过滤）
    var latin = /[A-Za-z]/;
    var visLeak = null;
    (seg.match(/'[^']+'/g) || []).forEach(function (s) {
        var v = s.slice(1, -1);
        if (/[+);({\[,]/.test(v)) return;
        if (/^[a-z0-9]+(?:[-_: ][a-z0-9]+)*$/.test(v)) return;   // 小写代码记号（kind 值/字段名）
        if (latin.test(v)) visLeak = visLeak || s;
    });
    assert(visLeak === null, 'D12 残页一节话术零拉丁（漏: ' + visLeak + '）');
    // 出口在册
    assert(rm.indexOf('lore: {') >= 0 && rm.indexOf('story: lootStoryText') >= 0 && rm.indexOf('show: showLootLore') >= 0,
        'D13 测试对账出口在册（lore.story / lore.show / lore.hash）');
}

console.log('\n========== 第五十七波 · 遗宝残页 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
