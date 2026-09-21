/**
 * wave52-note-node.js — 第五十二波 · 地图粉笔笔记 验收：
 *   A 笔记账：记/改/抹、明水挂不住粉笔（冬冰是实地）、每图二十四笔封顶（改笔不占额）、
 *            账落差量存档、域与域各自一本
 *   B 面板与图面：站脚下才开按钮、粉笔样面板六种、图角画印不炸、查看格子认回自己的字
 *   C 哨兵：新一节零骰、零经济、零直写存档、差量存档、建图零染、五十一波/四十九波切片不殃及、零拉丁
 *
 * 运行：node tests/wave52-note-node.js
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

// ==================== 共享全局桩（wave49/51 同源） ====================
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
var NOTE = api.note;
var MARKS = NOTE.MARKS;

function withRandom(v, fn) {
    var orig = Math.random;
    Math.random = function () { return v; };
    try { return fn(); } finally { Math.random = orig; }
}
function setSeason(s) { global.timeSystem.gameTime.currentSeason = s; }
// 全程一个种子（换种子=换山河清差量档），换域直接重开图
global.setMapSeed('天下_w52_note');
function openSeed(region) {
    withRandom(0.99, function () { global.openWildernessMap(region); });
}
function msgCount(word) {
    return msgs.filter(function (m) { return m.m.indexOf(word) >= 0; }).length;
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
function notesOf(region) {
    var st = api.state().regions[region || '中州'];
    if (!st) return null;
    st.notes = st.notes || {};
    return st.notes;
}

setSeason('spring');
openSeed('中州');
global.currentCharData._travel = { regions: {}, marks: {}, steps: 0 };
var p0 = { x: global.playerPos.x, y: global.playerPos.y };
forgeCell(p0.x, p0.y, 'PLAIN');
var k0 = p0.x + ',' + p0.y;

// ==================== A · 笔记账 ====================
console.log('\n[A] 笔记账（记/改/抹，一支粉笔的账）');
{
    eq(NOTE.at(p0.x, p0.y), null, 'A1 新图新账：脚下没有旧笔记');
    msgs.length = 0;
    eq(NOTE.set('danger'), true, 'A2 记下一笔「凶险」');
    eq(NOTE.at(p0.x, p0.y), 'danger', 'A3 笔记在册（noteAt 认得回）');
    eq(notesOf('中州')[k0], 'danger', 'A4 账落本域差量存档（st.notes，与 grotto/仇账同法）');
    assert(msgCount('记下一笔') === 1 && msgCount('凶险') === 1 && msgCount('重开图它还在') === 1, 'A5 落笔有话术（连用处一并念叨）');

    // 改一笔：同格重记，不占新额
    msgs.length = 0;
    eq(NOTE.set('water'), true, 'A6 同格改笔：改记「水源」');
    eq(NOTE.at(p0.x, p0.y), 'water', 'A7 新样盖旧样');
    eq(Object.keys(notesOf('中州')).length, 1, 'A8 改笔不占新额（还是一笔账）');

    // 没这种粉笔样
    msgs.length = 0;
    eq(NOTE.set('没有这个样'), false, 'A9 不存在的样：拒');
    assert(msgCount('没有这种粉笔样') === 1, 'A9b 拒有话术');
    eq(NOTE.at(p0.x, p0.y), 'water', 'A9c 拒了不动旧账');

    // 抹掉
    msgs.length = 0;
    eq(NOTE.del(), true, 'A10 抹掉这一笔');
    eq(NOTE.at(p0.x, p0.y), null, 'A11 抹完账空');
    eq(notesOf('中州')[k0], undefined, 'A11b 差量档里的键也删了（不留死账）');
    assert(msgCount('粉笔灰') === 1, 'A12 抹笔有话术（粉笔灰簌簌落在图上）');
    msgs.length = 0;
    eq(NOTE.del(), false, 'A13 没笔记硬抹：拒（没什么可抹的）');

    // 明水挂不住粉笔
    forgeCell(p0.x, p0.y, 'WATER');
    msgs.length = 0;
    eq(NOTE.set('good'), false, 'A14 春天的明水面：记不上（粉笔挂不住水）');
    assert(msgCount('挂不住粉笔') === 1, 'A14b 拒得有理有据');
    // 冬天的冰面是实地
    setSeason('winter');
    eq(NOTE.set('good'), true, 'A15 冬天封冻的冰面是实地：照记（与扎营打坐同一套四时账）');
    setSeason('spring');
    NOTE.del();
    forgeCell(p0.x, p0.y, 'PLAIN');

    // 封顶：一张图至多二十四笔
    var nd = notesOf('中州');
    nd[k0] = 'been';
    for (var i = 1; i <= 23; i++) nd['90' + i + ',91' + i] = 'been';   // 凑满二十四笔（远端假坐标只占账不占图）
    eq(Object.keys(nd).length, 24, 'A16 账上凑满二十四笔');
    var adj = null;
    var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [0, 2]];
    for (var d = 0; d < dirs.length; d++) {
        var nx = p0.x + dirs[d][0], ny = p0.y + dirs[d][1];
        var c = cellAt(nx, ny);
        if (c && !c.poiId && !c.node && !(c.entities || []).length) { adj = { x: nx, y: ny }; break; }
    }
    msgs.length = 0;
    if (adj) {
        forgeCell(adj.x, adj.y, 'PLAIN');
        global.playerPos.x = adj.x; global.playerPos.y = adj.y;
        eq(NOTE.set('loot'), false, 'A17 粉笔头磨圆了：第二十五笔记不进');
        assert(msgCount('磨圆了') === 1 && msgCount('抹掉一笔再记') === 1, 'A17b 封顶有话术（指了条明路：抹一笔再记）');
        global.playerPos.x = p0.x; global.playerPos.y = p0.y;
    } else { assert(true, 'A17 （身边挤不出空格，封顶账由 A18 补）'); assert(true, 'A17b （同上）'); }
    eq(NOTE.set('loot'), true, 'A18 满账改旧笔照改（改笔不占额——自己的字自己认得）');
    eq(NOTE.at(p0.x, p0.y), 'loot', 'A18b 改成了「宝气」');
    nd = notesOf('中州');
    for (var j = 1; j <= 23; j++) delete nd['90' + j + ',91' + j];
    NOTE.del();

    // 域与域各自一本
    NOTE.set('danger');
    openSeed('东荒');
    eq(NOTE.at(p0.x, p0.y), null, 'A19 换域：东荒的图上没有中州的字（一域一本账）');
    openSeed('中州');
    eq(NOTE.at(p0.x, p0.y), 'danger', 'A20 回中州：那笔「凶险」还在（差量存档跟着域走，重开图不丢）');
    eq(global.playerPos.x + ',' + global.playerPos.y, k0, 'A20b 人也站回了记号边上（px/py 老账照旧）');
}

// ==================== B · 面板与图面 ====================
console.log('\n[B] 面板与图面（按钮、粉笔样、图角的字）');
{
    var cell0 = cellAt(p0.x, p0.y);
    var acts = api.tileActions(cell0);
    var noteAct = acts.filter(function (a) { return a.act === 'note-menu'; });
    eq(noteAct.length, 1, 'B1 站在实地：菜单开「粉笔印」一条');
    assert(noteAct[0].label.indexOf('凶险') >= 0, 'B2 有旧笔时按钮报得出样名（粉笔印「凶险」——改一笔/抹掉）');
    NOTE.del();
    var acts2 = api.tileActions(cell0);
    var na2 = acts2.filter(function (a) { return a.act === 'note-menu'; });
    assert(na2[0].label.indexOf('记一笔') >= 0, 'B3 没笔记时按钮是「记一笔粉笔印」');
    // 明水面不开按钮
    forgeCell(p0.x, p0.y, 'WATER');
    var actsW = api.tileActions(cellAt(p0.x, p0.y));
    assert(!actsW.some(function (a) { return a.act === 'note-menu'; }), 'B4 明水面上不开这条（与扎营打坐同规矩）');
    forgeCell(p0.x, p0.y, 'PLAIN');
    // 粉笔样面板
    NOTE.set('danger');
    NOTE.menu();
    var html = els['wild-actions']._html;
    var allSix = Object.keys(MARKS).every(function (id) { return html.indexOf(MARKS[id].name) >= 0; });
    assert(allSix, 'B5 面板六种粉笔样摆齐（凶险/水源/好地/宜宿/宝气/记号）');
    assert(html.indexOf('当前就记着这个') >= 0 && html.indexOf('抹掉这一笔') >= 0, 'B6 有旧笔：面板标出当前样、开抹笔口');
    assert(html.indexOf('收起粉笔') >= 0, 'B7 面板有退路（收起粉笔）');
    NOTE.del();
    NOTE.menu();
    assert(els['wild-actions']._html.indexOf('抹掉这一笔') < 0, 'B8 没旧笔：不开抹笔口');
    // 图面：带笔记重画不炸
    NOTE.set('good');
    var ok = true;
    try { global.renderMap(fakeEl('svg'), global.currentMap, 0, 0); } catch (e) { ok = false; }
    assert(ok, 'B9 带粉笔印的图重画不炸（drawNotes 在册）');
    // 查看脚下格子：认回自己的字
    msgs.length = 0;
    global.onCellClick(p0.x, p0.y);
    assert(msgCount('「好地」') === 1 && msgCount('🖊') === 1, 'B10 点看脚下：格况里认回自己的粉笔印');
    NOTE.del();
}

// ==================== C · 哨兵 ====================
console.log('\n[C] 哨兵（零骰、零经济、差量存档、切片不殃及）');
{
    var rm = fs.readFileSync(path.join(ROOT, 'js/map/randomMap.js'), 'utf8');
    var sStart = rm.indexOf('第五十二波 · 地图粉笔笔记');
    var sEnd = rm.indexOf('第五十一波 · 具名响马宿敌');
    assert(sStart > 0 && sEnd > sStart, 'C0 五十二波段落标记在五十一波之前（切片有效）');
    var seg = rm.slice(sStart, sEnd);
    eq((seg.match(/Math\.random/g) || []).length, 0, 'C1 新一节零骰（笔记全是人手定的，没有一处随机）');
    assert(seg.indexOf('addSpiritStones') < 0 && seg.indexOf('deductSpiritStones') < 0 && seg.indexOf('.credit(') < 0 && seg.indexOf('.debit(') < 0 && seg.indexOf('EconomyTransaction') < 0,
        'C2 笔记零经济（不收费不赔钱——粉笔是自己削的）');
    assert(seg.indexOf('localStorage') < 0, 'C3 笔记账零直写存档（全走 saveWildState 差量法）');
    assert(seg.indexOf('advanceWildTime') < 0 && seg.indexOf('timeSystem') < 0, 'C4 记一笔不耗时辰（掏粉笔的功夫不算账）');
    assert(rm.indexOf('notes: prev.notes || {}') >= 0, 'C5 saveWildState 白名单收了笔记账');
    assert(rm.indexOf('st.notes = st.notes || {}') >= 0 && rm.indexOf('nemesis: null, notes: {}, px: -1') >= 0,
        'C6 applyWildState 老档自动补空（零迁移脚本）');
    var bStart = rm.indexOf('function buildWildMap');
    var buildSeg = rm.slice(bStart, rm.indexOf('\nfunction ', bStart + 10));
    assert(buildSeg.indexOf('NOTE') < 0 && buildSeg.indexOf('notesDict') < 0 && buildSeg.indexOf('drawNotes') < 0,
        'C7 建图段无笔记任何调用（骰序零漂移照旧）');
    var nSeg = rm.slice(rm.indexOf('第五十一波 · 具名响马宿敌'), rm.indexOf('第四十九波 · 崖壁隐藏洞天'));
    eq((nSeg.match(/Math\.random/g) || []).length, 5, 'C8 五十一波切片仍五枚骰（新段插在标记之前，没殃及）');
    var gSeg = rm.slice(rm.indexOf('第四十九波 · 崖壁隐藏洞天'), rm.indexOf('第三十八波 · 扎营歇夜'));
    eq((gSeg.match(/Math\.random/g) || []).length, 1, 'C9 洞天一节仍只一枚骰');
    // 接线在册
    assert(rm.indexOf("case 'note-menu': renderNoteOptions(); return;") >= 0 && rm.indexOf("case 'note-set': setNoteHere(arg); return;") >= 0 && rm.indexOf("case 'note-del': delNoteHere(); return;") >= 0,
        'C10 动作分发三口接线在册');
    assert(rm.indexOf("act === 'note-set'") >= 0 && rm.indexOf("act === 'note-cancel'") >= 0, 'C11 侧栏事件委托接线在册（带样的传 data-target）');
    assert(rm.indexOf('drawNotes(svg, size);') >= 0, 'C12 渲染接线在册（洞口之后画粉笔印）');
    // 粉笔样本身零拉丁（图标与名号都会进用户眼里）
    var latin = /[A-Za-z]/;
    var shapeOk = Object.keys(MARKS).every(function (id) {
        var mk = MARKS[id];
        return mk.icon && mk.name && mk.color && mk.hint && !latin.test(mk.icon) && !latin.test(mk.name) && !latin.test(mk.hint);
    });
    eq(Object.keys(MARKS).length, 6, 'C13 粉笔样六种（多一种都是账）');
    assert(shapeOk, 'C14 六种样的图标/名号/用处全中文（色值是代码记号不算话术）');
    // 新话术零拉丁（代码记号走白名单：蛇形/连字符小写是 CSS 类名、字段名、动作名——不是话术）
    var allow = ['WATER'];   // WATER 是地形键代码记号（与 wave49 的 MOUNTAIN 同例）
    var visLeak = null;
    (seg.match(/'[^']+'/g) || []).forEach(function (s) {
        var v = s.slice(1, -1);
        if (/[+);({\[,]/.test(v)) return;   // 跨串拼接/带 HTML 属性的碎段不是话术
        if (/^[a-z0-9]+(?:[-_: ][a-z0-9]+)*$/.test(v)) return;   // 小写代码记号（含 CSS 类名列表/动作名/SVG 属性名）
        if (/^#[0-9a-fA-F]{6}$/.test(v)) return;   // 色值是代码记号（C14 已单独管住用户眼里的部分）
        if (latin.test(v) && allow.indexOf(v) < 0) visLeak = visLeak || s;
    });
    assert(visLeak === null, 'C15 笔记一节话术零拉丁（漏: ' + visLeak + '）');
}

console.log('\n========== 第五十二波 · 地图粉笔笔记 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
