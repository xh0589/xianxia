/**
 * wave50-grotto-loot-node.js — 第五十波 · 洞天遗宝 验收：
 *   A 开匣账：头一回入洞开匣（定数选件、一件入囊、账落差量存档）、一洞只开一回、
 *            行囊满了匣子留着（账不落、腾出地方再来取）
 *   B 货池账：九域各一池、件件是真货（对着物品真源逐一验身）、不出秘籍
 *   C 哨兵：洞天一节仍只一枚骰（选件走定数）、零货币增发、存档差量法、话术零拉丁、全域至多三十匣
 *
 * 运行：node tests/wave50-grotto-loot-node.js
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

// ==================== 共享全局桩（wave49 同源，背包换成记录仪） ====================
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
// 背包记录仪：塞得下返回 true，塞不下返回 false（与 inventory.js addItem 同语义）
var bagCalls = [];
var bagOk = true;
global.addItemToInventory = function (id, n) { bagCalls.push({ id: id, n: n }); return bagOk; };
global.itemById = {
    pill_qi_gather: { id: 'pill_qi_gather', name: '聚气丹' },
    pill_big_recovery: { id: 'pill_big_recovery', name: '大还丹' },
    attack_talisman: { id: 'attack_talisman', name: '攻击符' }
};
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
var CFG = api.grotto.CFG;
var LOOT = api.grotto.LOOT;

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
function grottoDict(region, field) {
    var st = api.state().regions[region || '中州'];
    if (!st) return null;
    st[field] = st[field] || {};
    return st[field];
}
// 与生产同一套定数：地域哈希 + 坐标 → 池内选件
function expectLootId(region, x, y) {
    var pool = LOOT[region] || api.grotto.LOOT_FALLBACK;
    var h = 0, rg = String(region);
    for (var i = 0; i < rg.length; i++) h = (h * 31 + rg.charCodeAt(i)) % 9973;
    return pool[(x * 17 + y * 31 + h) % pool.length];
}

global.timeSystem.gameTime.currentSeason = 'spring';
openSeed('中州', '中州_w50_loot');
global.currentCharData._travel = { regions: {}, marks: {}, steps: 0 };

// ==================== A · 开匣账 ====================
console.log('\n[A] 开匣账（一洞一匣，塞不下就留着）');
var mt1 = null, p0 = global.playerPos;
{
    setChar('炼气', 100, 100);
    mt1 = forgeAdjacent(p0.x, p0.y, 'MOUNTAIN', 0.8, []);
    withRandom(0.99, function () { api.stepTo(mt1.x, mt1.y); });
    withRandom(0.0, function () { api.poiAction('meditate'); });   // 发现骰必中
    assert(api.grotto.at(mt1.x, mt1.y), 'A0 崖壁打坐发现洞天（四十九波的老账照好使）');

    msgs.length = 0; timeCalls.length = 0; bagCalls.length = 0;
    global.insightPoints = 0;
    api.poiAction('grotto-enter');
    eq(bagCalls.length, 1, 'A1 头一回入洞：供案下开出一匣遗宝（入囊一件）');
    eq(bagCalls[0].n, 1, 'A2 一匣一件（机缘有数，不批发）');
    eq(bagCalls[0].id, expectLootId('中州', mt1.x, mt1.y), 'A3 选件走定数（坐标+地域哈希，与生产同一套算法）');
    assert(LOOT['中州'].indexOf(bagCalls[0].id) >= 0, 'A4 开出的货在中州池里（聚气丹/大还丹/攻击符）');
    var ld = grottoDict('中州', 'grottoLoot');
    eq(ld[mt1.x + ',' + mt1.y], 800, 'A5 开匣账落差量存档（st.grottoLoot 记绝对日）');
    assert(msgCount('木匣') === 1 && msgCount('前辈遗宝') === 1, 'A6 开匣有话术（尘封多年，今日归你）');
    var name = global.itemById[bagCalls[0].id].name;
    assert(msgCount('【' + name + '】') === 1, 'A7 话术报的是货真名实的名字（' + name + '）');
    eq(timeCalls[timeCalls.length - 1].m, 240, 'A8 遗宝归遗宝，行功账照结（四个时辰）');
    eq(global.insightPoints, 1, 'A9 头一回遗刻一悟照旧（悟道点 +1，两本账各自记）');

    // 一洞只开一回：隔日再入，匣子不重来
    ABS_DAY = 801;
    msgs.length = 0; bagCalls.length = 0;
    api.poiAction('grotto-enter');
    eq(bagCalls.length, 0, 'A10 隔日再入：不再开匣（一洞一匣，账在差量存档里）');
    eq(msgCount('木匣'), 0, 'A10b 老客入洞只见清寂不见匣');

    // 行囊满：匣子留着，账不落，腾出地方再来取
    var mt2 = forgeAdjacent(p0.x, p0.y, 'MOUNTAIN', 0.85, [mt1]);
    ABS_DAY = 800;
    setChar('炼气', 100, 100);
    withRandom(0.99, function () { api.stepTo(p0.x, p0.y); });
    withRandom(0.99, function () { api.stepTo(mt2.x, mt2.y); });
    withRandom(0.0, function () { api.poiAction('meditate'); });
    assert(api.grotto.at(mt2.x, mt2.y), 'A11 第二处洞天发现（每域三处封顶之内）');
    bagOk = false; bagCalls.length = 0; msgs.length = 0;
    api.poiAction('grotto-enter');
    eq(grottoDict('中州', 'grottoLoot')[mt2.x + ',' + mt2.y], undefined, 'A12 塞不下：开匣账不落（这匣不算开过）');
    assert(msgCount('行囊已塞得满满当当') === 1, 'A12b 塞不下有话术（腾出地方再来取，前辈不急）');
    bagOk = true; bagCalls.length = 0; msgs.length = 0;
    api.poiAction('grotto-enter');
    eq(bagCalls.length, 1, 'A13 腾出地方再入：匣子还在，这回取走了');
    eq(grottoDict('中州', 'grottoLoot')[mt2.x + ',' + mt2.y], 800, 'A13b 取走才落账');
}

// ==================== B · 货池账 ====================
console.log('\n[B] 货池账（九域各一池，件件是真货）');
{
    var regions = ['中州', '东荒', '南疆', '西漠', '北冥', '蜀地', '东南海域', '灵界', '魔界'];
    eq(Object.keys(LOOT).length, 9, 'B1 货池九域各一座（天界走兜底池）');
    var shapeOk = regions.every(function (r) { return LOOT[r] && LOOT[r].length === 3; });
    assert(shapeOk, 'B2 每池三件（全域至多三十匣的账由此来）');
    assert(api.grotto.LOOT_FALLBACK.length === 3, 'B3 兜底池也是三件（蟠桃果/琼浆玉液/天心花——仙家遗宝）');
    // 件件对着物品真源验身
    var catalog = ['js/items.js', 'js/items-extended.js'].map(function (f) {
        try { return fs.readFileSync(path.join(ROOT, f), 'utf8'); } catch (e) { return ''; }
    }).join('\n');
    fs.readdirSync(path.join(ROOT, 'js/items-extended')).forEach(function (f) {
        if (/\.js$/.test(f)) catalog += '\n' + fs.readFileSync(path.join(ROOT, 'js/items-extended', f), 'utf8');
    });
    var allIds = regions.map(function (r) { return LOOT[r]; }).reduce(function (a, b) { return a.concat(b); }, []).concat(api.grotto.LOOT_FALLBACK);
    var ghost = allIds.filter(function (id) { return catalog.indexOf("'" + id + "'") < 0; });
    eq(ghost.length, 0, 'B4 三十件遗宝件件在册（对着物品真源逐一验身，幽灵货: ' + ghost.join(',') + '）');
    var manual = allIds.filter(function (id) { return id.indexOf('art_') === 0 || id.indexOf('manual') >= 0; });
    eq(manual.length, 0, 'B5 池里零秘籍（v15.1 三条渠道账不动，洞天不开新的功法口子）');
    var uniq = {};
    allIds.forEach(function (id) { uniq[id] = (uniq[id] || 0) + 1; });
    assert(Object.keys(uniq).length >= 24, 'B6 三十件里至少二十四样不同（九域遗宝各有面貌，不是一货发天下）');
}

// ==================== C · 哨兵 ====================
console.log('\n[C] 哨兵（零新骰、零发票子、差量存档、零拉丁）');
{
    var rm = fs.readFileSync(path.join(ROOT, 'js/map/randomMap.js'), 'utf8');
    var gStart = rm.indexOf('第四十九波 · 崖壁隐藏洞天');
    var gEnd = rm.indexOf('第三十八波 · 扎营歇夜');
    var grottoSeg = rm.slice(gStart, gEnd);
    eq((grottoSeg.match(/Math\.random/g) || []).length, 1, 'C1 洞天一节仍只一枚骰（发现骰——选件走定数零新骰）');
    assert(grottoSeg.indexOf('addSpiritStones') < 0 && grottoSeg.indexOf('deductSpiritStones') < 0,
        'C2 遗宝零货币增发（不开匣子外的票子）');
    assert(grottoSeg.indexOf('localStorage') < 0, 'C3 开匣账零直写存档（全走 saveWildState 差量法）');
    assert(rm.indexOf('grottoLoot: prev.grottoLoot || {}') >= 0, 'C4 saveWildState 白名单收了开匣账');
    assert(rm.indexOf('st.grottoLoot = st.grottoLoot || {}') >= 0, 'C5 applyWildState 老档自动补空（零迁移脚本）');
    // 全域至多三十匣：10 域（九域+天界兜底）× 每域 3 处 × 一洞一匣
    var maxBoxes = (Object.keys(api.grotto.flavor).length + 1) * CFG.CAP;
    eq(maxBoxes, 30, 'C6 全域至多三十匣（10 域 × 3 处 × 一洞一匣——总账有数）');
    // 新话术零拉丁
    var latin = /[A-Za-z]/;
    var visLeak = null;
    var allow = ['grottoLoot'];   // 差量存档字段名是代码记号，不算话术
    var lootFn = rm.slice(rm.indexOf('function tryGrantGrottoLoot'), rm.indexOf('// ============ 第三十八波'));
    (lootFn.match(/'[^']+'/g) || []).forEach(function (s) {
        var v = s.slice(1, -1);
        if (/[+);({\[,]/.test(v)) return;
        if (/^[a-z][a-z0-9_]*$/.test(v)) return;   // 蛇形小写是代码记号（字段名/物品 id）
        if (latin.test(v) && allow.indexOf(v) < 0) visLeak = visLeak || s;
    });
    assert(visLeak === null, 'C7 开匣话术零拉丁（漏: ' + visLeak + '）');
    // 建图段依旧一字不染
    var bStart = rm.indexOf('function buildWildMap');
    var buildSeg = rm.slice(bStart, rm.indexOf('\nfunction ', bStart + 10));
    assert(buildSeg.indexOf('GROTTO') < 0 && buildSeg.indexOf('grotto') < 0, 'C8 建图段无洞天任何调用（骰序零漂移照旧）');
}

console.log('\n========== 第五十波 · 洞天遗宝 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
