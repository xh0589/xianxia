/**
 * wave75-lore-shelf-node.js — 第七十五波 · 游历残页册 验收：
 *   A 倒推账：匣中之物与开匣同一条定数公式、残页与到手即现一字同源、页序页戳、坏账不炸、册子对野图零写
 *   B 册子账：summary 数得对、拼齐的域收完整旧事、差几张如实报、化外之地走回退、弹窗内容齐
 *   C 入口账：图鉴面板挂册子段（带拾得数）、缺册静默、图鉴六类老账不动
 *   D 打开账：野图账缺席如实拒、空册满册都翻得开、翻册不弹碎嘴
 *   E 哨兵：零骰零写档零经济零悟道点零拉丁、randomMap 一字未动、挂载序在册
 *
 * 运行：node tests/wave75-lore-shelf-node.js
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
var msgs = [], modals = [];
global.showMessage = function (m, t) { msgs.push({ m: String(m), t: t }); };
global.showModal = function (t, html) { modals.push({ t: String(t), html: String(html) }); };
var ABS_DAY = 800;
global.timeSystem = {
    gameTime: { totalMinutes: 0, currentDay: 5, currentHour: 10, currentMinute: 0, currentSeason: 'spring', currentMonth: 3, currentYear: 1 },
    advanceTime: function () {},
    getAbsoluteDay: function () { return ABS_DAY; },
    onNewDaySubscribe: function () {}
};
global.addItemToInventory = function () { return true; };
global.itemById = {
    pill_qi_gather: { id: 'pill_qi_gather', name: '聚气丹' },
    pill_big_recovery: { id: 'pill_big_recovery', name: '大还丹' },
    attack_talisman: { id: 'attack_talisman', name: '攻击符' },
    mat_dark_iron: { id: 'mat_dark_iron', name: '玄铁' },
    mat_meteorite: { id: 'mat_meteorite', name: '陨铁' },
    mat_purple_gold: { id: 'mat_purple_gold', name: '紫金' },
    mat_peach_fruit: { id: 'mat_peach_fruit', name: '仙桃' },
    food_jade_nectar: { id: 'food_jade_nectar', name: '玉液琼浆' },
    mat_heaven_heart_flower: { id: 'mat_heaven_heart_flower', name: '天心花' }
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
global.insightPoints = 0;

load('js/map/map-markers.js');
load('js/economy/spirit-vein.js');
load('js/map/travel-journal.js');
load('js/core/state-registry.js');
load('js/map/wild-terrain.js');
load('js/map/randomMap.js');
load('js/map/lore-shelf.js');
load('js/extensions/codex-tutorial.js');

var api = global.wildMapApi;
var LORE = api.lore;
var LOOT = api.grotto.LOOT;
var LS = global.LoreShelf;

function withRandom(v, fn) {
    var orig = Math.random;
    Math.random = function () { return v; };
    try { return fn(); } finally { Math.random = orig; }
}
global.setMapSeed('天下_w75_shelf');
function enter(region) { withRandom(0.99, function () { global.openWildernessMap(region); }); }
// 直接立域账（册子是纯读端，测试不必真走一遍进域路——进域只在对手戏那一步用）
function seedBoxes(region, cells) {
    var st = api.state();
    if (!st.regions[region]) {
        // applyWildState 同款全形空账（老档自动补空的形状）
        st.regions[region] = { fog: '', dead: {}, gathered: {}, visited: {}, leySeen: {}, oasis: {}, pool: {}, grotto: {}, grottoUse: {}, grottoLoot: {}, nemesis: null, notes: {}, px: -1, py: -1 };
    }
    st.regions[region].grottoLoot = {};
    cells.forEach(function (c) { st.regions[region].grottoLoot[c[0]] = c[1]; });
}
function clearAll() {
    var st = api.state();
    for (var r in st.regions) { st.regions[r].grottoLoot = {}; }
}
function lastModal() { return modals.length ? modals[modals.length - 1] : null; }
function derive(region, cell) {
    var xy = cell.split(',');
    var pool = LOOT[region] || api.grotto.LOOT_FALLBACK;
    return pool[(Number(xy[0]) * 17 + Number(xy[1]) * 31 + LORE.hash(region)) % pool.length];
}

// ==================== A · 倒推账 ====================
console.log('\n[A] 倒推账（册子与石室一本账）');
eq(LS.deriveItem('中州', '5,7'), derive('中州', '5,7'), 'A1 匣中之物倒推=开匣同款定数公式');
eq(LS.deriveItem('中州', '5,7'), LS.deriveItem('中州', '5,7'), 'A2 同匣同物（倒推是定数）');
var rmSrc = fs.readFileSync(path.join(ROOT, 'js/map/randomMap.js'), 'utf8');
assert(rmSrc.indexOf('(gx * 17 + gy * 31 + h) % pool.length') >= 0, 'A3 开匣公式源码钉位（册子抄的就是这条）');
assert(LOOT['天界'] === undefined && api.grotto.LOOT_FALLBACK.length === 3, 'A4 化外之地走仙家遗宝回退池');
eq(LS.deriveItem('天界', '3,4'), api.grotto.LOOT_FALLBACK[(3 * 17 + 4 * 31 + LORE.hash('天界')) % 3], 'A5 天界的匣子倒推走回退池');
enter('中州');   // 人在中州——好与「到手即现」的真源对笔迹（真进域立真账）
seedBoxes('中州', [['5,7', 801], ['12,3', 802], ['20,9', 803]]);
var pages = LS.pagesOf('中州');
eq(pages.length, 3, 'A6 中州三匣三页');
var live = LORE.story(pages[0].itemId, 'grotto');   // 到手即现的真源（lexical 域=中州）
assert(pages[0].owner === live.owner && pages[0].why === live.why && pages[0].echo === live.echo,
    'A7 册上残页与到手即现一字同源（主人/缘由/页尾三段全同）');
assert(LCFG_WHY().indexOf(pages[0].why) >= 0, 'A8 缘由出自洞天池（不串赃物池）');
function LCFG_WHY() { return LORE.CFG.GROTTO_WHY; }
eq(pages[0].cell < pages[1].cell && pages[1].cell < pages[2].cell, true, 'A9 册页按匣位排定（不乱翻）');
eq(pages[0].cell, '12,3', 'A10a 排定后头一页是「12,3」匣');
eq(pages[0].day, 802, 'A10 页上记着拾得的日子（第 802 天）');
eq(LS.pagesOf('南疆').length, 0, 'A11 没去过的域册页是空的');
var noName = LS.deriveItem('东南海域', '2,2');
seedBoxes('东南海域', [['2,2', 805]]);
var pg2 = LS.pagesOf('东南海域');
assert(pg2.length === 1 && (pg2[0].name === '旧物' || global.itemById[pg2[0].itemId]), 'A12 货名录缺位退回「旧物」（不炸）');
var snapBefore = JSON.stringify(api.state());
LS.pagesOf('中州'); LS.summary(); LS.fullStory('中州'); modals.length = 0; LS.open();
eq(JSON.stringify(api.state()), snapBefore, 'A13 翻册对野图账零写（纯读端）');

// ==================== B · 册子账 ====================
console.log('\n[B] 册子账（拾得的旧事收成一册）');
clearAll();
seedBoxes('中州', [['5,7', 801], ['12,3', 802], ['20,9', 803]]);
var s1 = LS.summary();
eq(s1.pages, 3, 'B1 拾得三张');
eq(s1.full, 1, 'B2 中州拼成一段完整旧事');
eq(s1.walked, 1, 'B3 走过一域（有匣才算）');
seedBoxes('西漠', [['4,4', 806], ['9,9', 807]]);
var s2 = LS.summary();
eq(s2.pages, 5, 'B4 西漠添两张——共五张');
eq(s2.full, 1, 'B5 西漠没拼齐不算');
eq(s2.walked, 2, 'B6 走过两域');
eq(s2.capTotal, 27, 'B7 九域满册二十七张（账写在明处）');
var fs1 = LS.fullStory('中州');
eq(fs1.complete, true, 'B8 中州拼齐');
eq(fs1.text, LORE.FULL['中州'], 'B9 完整旧事一字不改动（守一论的那段）');
var fs2 = LS.fullStory('西漠');
eq(fs2.complete, false, 'B10 西漠没拼齐');
eq(fs2.missing, 1, 'B11 还差一张如实报');
seedBoxes('天界', [['1,1', 810], ['2,2', 811], ['3,3', 812]]);
var fs3 = LS.fullStory('天界');
eq(fs3.complete && fs3.text === LORE.FULL_FALLBACK, true, 'B12 化外之地拼齐走游记回退（正册九域各有各的旧事）');
modals.length = 0;
LS.open();
var m = lastModal();
assert(m && m.t.indexOf('残页册') >= 0, 'B13 册子弹窗报号');
assert(m.html.indexOf('聚气丹') >= 0 || m.html.indexOf('大还丹') >= 0 || m.html.indexOf('攻击符') >= 0, 'B14 册页写着货名');
assert(m.html.indexOf('页尾一行小字') >= 0, 'B15 册页收着页尾小字');
assert(m.html.indexOf(LORE.FULL['中州'].slice(0, 12)) >= 0, 'B16 拼齐的域收起完整旧事');
assert(m.html.indexOf('还差 1 张') >= 0, 'B17 没拼齐的域写着还差几张');
assert(m.html.indexOf('已拾 3/3') >= 0, 'B18 每域页数挂在册首');
assert(m.html.indexOf('赃物上的残页随事一现') >= 0, 'B19 赃物残页收不住——册尾如实说明');
clearAll();
modals.length = 0;
LS.open();
assert(lastModal().html.indexOf('册子还空着') >= 0 && lastModal().html.indexOf('崖壁洞天') >= 0, 'B20 空册指路（白顶高山打坐寻洞天）');

// ==================== C · 入口账 ====================
console.log('\n[C] 入口账（册子收在图鉴面板里）');
clearAll();
seedBoxes('中州', [['5,7', 801], ['12,3', 802], ['20,9', 803]]);
seedBoxes('西漠', [['4,4', 806], ['9,9', 807]]);
modals.length = 0;
global.openCodexPanel();
var cm = lastModal();
assert(cm && cm.html.indexOf('游历残页册') >= 0, 'C1 图鉴面板挂着残页册');
assert(cm.html.indexOf('拾得 5 张') >= 0 && cm.html.indexOf('拼成旧事 1 域') >= 0, 'C2 面板口上就报拾得数');
assert(cm.html.indexOf('openLoreShelf()') >= 0, 'C3 翻开册子的按钮在册');
eq(global.Codex.listTypes().length, 6, 'C4 图鉴六类老账一个不涨（册子另立门户）');
assert(cm.html.indexOf('📚') >= 0, 'C5 六类条目照旧陈列');
var savedLS = global.LoreShelf;
delete global.LoreShelf;
modals.length = 0;
global.openCodexPanel();
assert(lastModal().html.indexOf('游历残页册') < 0, 'C6 册子模块缺位——图鉴面板静默（不挂死链）');
global.LoreShelf = savedLS;
eq(typeof global.openLoreShelf, 'function', 'C7 全局入口在册');
var htmlSrc = fs.readFileSync(path.join(ROOT, '仙侠.html'), 'utf8');
assert(htmlSrc.indexOf('js/map/lore-shelf.js') > htmlSrc.indexOf('js/map/randomMap.js'), 'C8 页面挂载在野图之后（册子读野图的账）');

// ==================== D · 打开账 ====================
console.log('\n[D] 打开账（翻册不弹碎嘴）');
var savedApi = global.wildMapApi;
delete global.wildMapApi;
msgs.length = 0;
eq(LS.open(), false, 'D1 野图账缺席——册子翻不开');
assert(msgs.length === 1 && msgs[0].m.indexOf('翻不开') >= 0, 'D2 拒得实话实说');
global.wildMapApi = savedApi;
modals.length = 0; msgs.length = 0;
eq(LS.open(), true, 'D3 册子在——翻得开');
eq(msgs.length, 0, 'D4 翻册全在弹窗里，不弹碎嘴');

// ==================== E · 哨兵 ====================
console.log('\n[E] 哨兵（新账干净）');
var src = fs.readFileSync(path.join(ROOT, 'js/map/lore-shelf.js'), 'utf8');
eq((src.match(/Math\.random/g) || []).length, 0, 'E1 册子零骰（倒推与残页全是定数）');
assert(src.indexOf('saveWildState') < 0 && src.indexOf('localStorage') < 0, 'E2 零写档（纯读端——账是开匣账的老账）');
assert(src.indexOf('grottoLoot =') < 0 && src.indexOf('grottoLoot[') < 0, 'E3 开匣账只读不改');
assert(src.indexOf('insightPoints') < 0 && src.indexOf('markOnce') < 0, 'E4 悟道点零发放（旧事不换点）');
assert(src.indexOf('copper') < 0 && src.indexOf('spiritStones') < 0 && src.indexOf('RewardService') < 0 && src.indexOf('EconomyTransaction') < 0, 'E5 零经济（旧事不换钱）');
assert(src.indexOf('currentCharData') < 0, 'E6 册子不碰角色账（零新存档字段）');
var latin = /[A-Za-z]/;
var leak = null;
(src.match(/'[^']+'/g) || []).forEach(function (s) {
    var v = s.slice(1, -1);
    if (/[+);({\[,?<>]/.test(v)) return;
    if (v.indexOf('\\') >= 0) return;
    if (/typeof|===|!==/.test(v)) return;
    if (/^[a-z0-9]+(?:[-_: ][a-z0-9]+)*$/.test(v)) return;
    if (latin.test(v)) leak = leak || s;
});
eq(leak, null, 'E7 册子话术零拉丁（漏: ' + leak + '）');
eq(rmSrc.indexOf('第七十五波'), -1, 'E8 野图正典一字未动（册子在自家新文件里）');
var ctSrc = fs.readFileSync(path.join(ROOT, 'js/extensions/codex-tutorial.js'), 'utf8');
assert(ctSrc.indexOf('window.LoreShelf && typeof window.LoreShelf.summary') >= 0, 'E9 图鉴面板的接线带守卫');
eq((ctSrc.match(/第七十五波/g) || []).length, 1, 'E10 图鉴只添了册子一段（一处接线）');

console.log('\n========== 第七十五波 · 游历残页册 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
