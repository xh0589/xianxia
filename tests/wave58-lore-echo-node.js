/**
 * wave58-lore-echo-node.js — 第五十八波 · 残页回响 验收：
 *   A 回响账：三匣开齐那一刻，三张残页拼成一段完整的旧事——每域一段写死的故事，
 *            酬一回气血精力真气（与洞天行功同一本账）；回响只响一回，重进旧洞不再响
 *   B 池子账：九域各一段故事 + 天界兜底，全中文；两匣不响三匣响；酬的数与出口对得上
 *   C 哨兵：新一节零骰、零存档、零经济、零悟道点、话术零拉丁；老切片骰数不涨；建图零染；接线在册
 *
 * 运行：node tests/wave58-lore-echo-node.js
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

// ==================== 共享全局桩（wave57 同源） ====================
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
global.EconomyTransaction = {
    getBalance: function () { return 1000; },
    debit: function () { return true; },
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
global.DataManager = { getSpiritStones: function () { return 1000; }, deductSpiritStones: function () { return true; }, addSpiritStones: function () {} };
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
var ECHO_CFG = LORE.ECHO_CFG;
var FULL = LORE.FULL;

function withRandom(v, fn) {
    var orig = Math.random;
    Math.random = function () { return v; };
    try { return fn(); } finally { Math.random = orig; }
}
// 全程一个种子（换种子=换山河清差量档），换域直接重开图
global.setMapSeed('天下_w58_echo');
function openSeed(region) {
    withRandom(0.99, function () { global.openWildernessMap(region); });
}
function msgCount(word) {
    return msgs.filter(function (m) { return m.m.indexOf(word) >= 0; }).length;
}
function setChar(realm, hp, en, qi) {
    global.currentCharData.realm = realm;
    global.currentCharData.health = hp;
    global.currentCharData.energy = en;
    global.currentCharData.qi = qi || 0;
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
// 发现并入洞一回（发现骰必中）
function digAndEnter(skip) {
    var p = global.playerPos;
    var mt = forgeAdjacent(p.x, p.y, 'MOUNTAIN', 0.8, skip);
    withRandom(0.99, function () { api.stepTo(mt.x, mt.y); });
    withRandom(0.0, function () { api.poiAction('meditate'); });
    return mt;
}

global.timeSystem.gameTime.currentSeason = 'spring';
openSeed('中州');
global.currentCharData._travel = { regions: {}, marks: {}, steps: 0 };

// ==================== A · 回响账 ====================
console.log('\n[A] 回响账（三张残页拼一段完整的旧事）');
{
    // 头一匣：只有残页，没有回响
    setChar('炼气', 100, 100, 0);
    msgs.length = 0; bagCalls.length = 0;
    var m1 = digAndEnter([]);
    assert(api.grotto.at(m1.x, m1.y), 'A0 头一处洞天发现（四十九波老账）');
    api.poiAction('grotto-enter');
    eq(bagCalls.length, 1, 'A1 头一匣开出遗宝');
    assert(msgCount('已拾得 1 张') === 1, 'A1b 残页带拾页数（五十七波老账）');
    eq(msgCount('遗韵入体'), 0, 'A2 一张不响（回响要三张拼起来才认得出是同一个人）');

    // 第二匣：还是只有残页
    setChar('炼气', 100, 100, 0);
    msgs.length = 0; bagCalls.length = 0;
    var m2 = digAndEnter([m1]);
    api.poiAction('grotto-enter');
    eq(bagCalls.length, 1, 'A3 第二匣开出遗宝');
    assert(msgCount('已拾得 2 张') === 1, 'A3b 拾页数报到两张');
    eq(msgCount('遗韵入体'), 0, 'A4 两张也不响');

    // 第三匣：残页集齐，回响响一回
    setChar('炼气', 50, 40, 10);   // 摆低了身子，好对回响滋养的账
    msgs.length = 0; bagCalls.length = 0;
    var m3 = digAndEnter([m1, m2]);
    api.poiAction('grotto-enter');
    eq(bagCalls.length, 1, 'A5 第三匣开出遗宝');
    assert(msgCount('已拾得 3 张') === 1, 'A5b 拾页数报满三张');
    eq(msgCount('遗韵入体'), 1, 'A6 三张集齐：回响响一回');
    var story = FULL['中州'];
    assert(!!story && msgCount(story) === 1, 'A7 拼出的是中州那段完整的旧事（守一论手记——与石室遗刻同源）');
    var em = null;
    msgs.forEach(function (m) { if (m.m.indexOf('遗韵入体') >= 0) em = m; });
    assert(em && em.m.indexOf('+' + ECHO_CFG.HP) >= 0 && em.m.indexOf('+' + ECHO_CFG.EN) >= 0 && em.m.indexOf('+' + ECHO_CFG.QI) >= 0,
        'A8 滋养的数报在话术里（气血+' + ECHO_CFG.HP + ' 精力+' + ECHO_CFG.EN + ' 真气+' + ECHO_CFG.QI + '）');
    // 总账只验「涨」：入洞行功、时辰流逝的被动账、回响三笔混在一起，精确增量在 B 段直调里对
    assert(global.currentCharData.health > 50 && global.currentCharData.energy > 40 && global.currentCharData.qi > 10,
        'A9 三样都涨了（行功+回响，身子不会白入这一趟洞）');
    assert(msgCount('不换钱不换悟道点') === 1, 'A11b 话术把守恒讲明（旧事换的是一口暖气）');
    eq(global.insightPoints >= 0, true, 'A11c 悟道点账不掺和（回响不发点）');

    // 回响只响一回：重进第三洞，匣早开过了
    msgs.length = 0; bagCalls.length = 0;
    api.poiAction('grotto-enter');
    eq(bagCalls.length, 0, 'A12 重进旧洞不再开匣（一洞一匣的老账）');
    eq(msgCount('遗韵入体'), 0, 'A13 回响不重响（开匣是一次性事件，天然只响一回——不用记账）');
    // 重进头一洞也一样
    setChar('炼气', 100, 100, 0);
    withRandom(0.99, function () { api.stepTo(m1.x, m1.y); });
    msgs.length = 0;
    api.poiAction('grotto-enter');
    eq(msgCount('遗韵入体'), 0, 'A14 头一洞重进也不响（回响只在第三匣到手那一刻）');
}

// ==================== B · 池子账 ====================
console.log('\n[B] 池子账（九域各一段，天界有兜底）');
{
    var flavorKeys = Object.keys(api.grotto.flavor);
    eq(Object.keys(FULL).length, 9, 'B1 九域各一段完整旧事');
    var sameSet = flavorKeys.every(function (k) { return !!FULL[k]; }) && Object.keys(FULL).every(function (k) { return flavorKeys.indexOf(k) >= 0; });
    assert(sameSet, 'B2 故事池与遗刻池同一套地域（有遗刻的域就有回响）');
    var latin = /[A-Za-z]/;
    var allPure = Object.keys(FULL).every(function (k) { return FULL[k] && !latin.test(FULL[k]); }) && !!LORE.FULL_FALLBACK && !latin.test(LORE.FULL_FALLBACK);
    assert(allPure, 'B3 十段故事全中文（一个拉丁字母都没有）');
    var refsFlavor = FULL['中州'].indexOf('守一') >= 0 && FULL['西漠'].indexOf('戈') >= 0 && FULL['蜀地'].indexOf('断剑') >= 0;
    assert(refsFlavor, 'B4 回响与石室遗刻对得上（中州守一论/西漠戈壁春/蜀地断剑——三张残页拼的就是刻字的人）');
    eq(ECHO_CFG.CAP, 3, 'B5 回响的门槛=每域洞天上限（三匣开齐才算集齐）');
    assert(ECHO_CFG.HP === 15 && ECHO_CFG.EN === 25 && ECHO_CFG.QI === 40, 'B6 滋养三数与施工图对账（15/25/40）');
    // 直调：两匣不响，三匣响
    msgs.length = 0;
    eq(LORE.echo(2), false, 'B7 直调两匣：不响');
    eq(msgCount('遗韵入体'), 0, 'B7b 不响就没话术');
    eq(LORE.echo(3), true, 'B8 直调三匣：响');
    assert(msgCount(FULL['中州']) === 1, 'B8b 响的是当前域的故事');
    // 滋养的精确增量（直调不掺时辰被动账）：50/40/10 → 65/65/50
    setChar('炼气', 50, 40, 10);
    msgs.length = 0;
    LORE.echo(3);
    eq(global.currentCharData.health, 50 + ECHO_CFG.HP, 'B8c 气血 +15 分毫不差');
    eq(global.currentCharData.energy, 40 + ECHO_CFG.EN, 'B8d 精力 +25 分毫不差');
    eq(global.currentCharData.qi, 10 + ECHO_CFG.QI, 'B8e 真气 +40 分毫不差');
    // 换域直调：故事跟着域走
    openSeed('西漠');
    msgs.length = 0;
    LORE.echo(3);
    assert(msgCount(FULL['西漠']) === 1 && msgCount(FULL['中州']) === 0, 'B9 换域响换域的故事（各域的前辈各归各）');
    ABS_DAY = 800;
}

// ==================== C · 哨兵 ====================
console.log('\n[C] 哨兵（零骰、零存档、零经济、老切片不殃及）');
{
    var rm = fs.readFileSync(path.join(ROOT, 'js/map/randomMap.js'), 'utf8');
    var sStart = rm.indexOf('============ 第五十八波');
    var sEnd = rm.indexOf('第四十九波 · 崖壁隐藏洞天');
    assert(sStart > 0 && sEnd > sStart, 'C0 五十八波段落标记有效（锚在横幅上）');
    var seg = rm.slice(sStart, sEnd);
    eq((seg.match(/Math\.random/g) || []).length, 0, 'C1 回响一节零骰（故事写死在池里，拼不拼得出全看开没开齐）');
    assert(seg.indexOf('localStorage') < 0 && seg.indexOf('saveWildState') < 0 && seg.indexOf('wildState') < 0,
        'C2 回响零直写存档（门槛从开匣账现推——零新字段）');
    assert(seg.indexOf('addSpiritStones') < 0 && seg.indexOf('.credit(') < 0 && seg.indexOf('.debit(') < 0 && seg.indexOf('EconomyTransaction') < 0,
        'C3 回响零经济（酬的是气血精力真气，与洞天行功同一本账——不动票子）');
    assert(seg.indexOf('insightPoints') < 0 && seg.indexOf('markOnce') < 0, 'C4 悟道点零发放（总闸已满）');
    // 老切片骰数不涨
    var nSeg = rm.slice(rm.indexOf('第五十一波 · 具名响马宿敌'), sEnd);
    eq((nSeg.match(/Math\.random/g) || []).length, 5, 'C5 五十一波切片仍五枚骰（五十七/五十八两段都零骰）');
    var lSeg = rm.slice(rm.indexOf('============ 第五十七波'), sEnd);
    eq((lSeg.match(/Math\.random/g) || []).length, 0, 'C6 五十七波切片连五十八波一起仍零骰');
    var gSeg = rm.slice(sEnd, rm.indexOf('第三十八波 · 扎营歇夜'));
    eq((gSeg.match(/Math\.random/g) || []).length, 1, 'C7 洞天一节仍只一枚骰（发现骰）');
    var bStart = rm.indexOf('function buildWildMap');
    var buildSeg = rm.slice(bStart, rm.indexOf('\nfunction ', bStart + 10));
    assert(buildSeg.indexOf('LORE_FULL') < 0 && buildSeg.indexOf('loreEcho') < 0, 'C8 建图段无回响任何调用（骰序零漂移照旧）');
    // 接线与出口在册
    assert(rm.indexOf('loreEchoCheck(Object.keys(done).length)') >= 0, 'C9 开匣路接线在册（第三匣到手即响）');
    assert(rm.indexOf('echo: loreEchoCheck') >= 0 && rm.indexOf('FULL: LORE_FULL_STORIES') >= 0, 'C10 对账出口在册（lore.echo / lore.FULL）');
    assert(rm.indexOf('prev.lore') < 0 && rm.indexOf('lore: prev') < 0, 'C11 存档白名单没收回响（本就是零新字段）');
    assert(rm.indexOf('nemesis: null, notes: {}, px: -1') >= 0, 'C12 默认域对象串一字未动');
    // 话术零拉丁（代码记号走过滤）
    var latin = /[A-Za-z]/;
    var visLeak = null;
    (seg.match(/'[^']+'/g) || []).forEach(function (s) {
        var v = s.slice(1, -1);
        if (/[+);({\[,]/.test(v)) return;
        if (/^[a-z0-9]+(?:[-_: ][a-z0-9]+)*$/.test(v)) return;   // 小写代码记号
        if (latin.test(v)) visLeak = visLeak || s;
    });
    assert(visLeak === null, 'C13 回响一节话术零拉丁（漏: ' + visLeak + '）');
}

console.log('\n========== 第五十八波 · 残页回响 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
