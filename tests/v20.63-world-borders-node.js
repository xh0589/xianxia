/**
 * v20.63-world-borders-node.js — 天下疆界验收（五层薄的第 5 层）：
 *   W1 疆界成图：九州谁与谁接壤成一张连着的图，位面不入疆界
 *   W2 关隘有名：每条边界有一道关、有里数、有路上光景，关名不重样
 *   W3 不接壤走不通：跨不了境就说清该怎么取道，时辰也不结
 *   W4 过境结账：里数折时辰、脚力折力气，到了就站在那一州的山河里
 *   W5 关隘有事：关卒盘查、商队搭伙，路上真有光景
 *   W6 位面走不通：灵界魔界只走位面之门
 *   W7 图上有路：九州之间的路画出来，「你在此」跟着人挪州
 *   W8 野外栏出境：只列接壤的邻州，关名里数写明
 *   W9 接线齐：列表入境与野外栏出境都走同一套疆界账
 *
 * 运行：node tests/v20.63-world-borders-node.js
 */
'use strict';

var fs = require('fs');
var vm = require('vm');
var path = require('path');
var ROOT = path.resolve(__dirname, '..');

var passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) passed++;
    else { failed++; console.error('[FAIL] ' + msg); }
}
function load(rel) {
    vm.runInThisContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), { filename: rel });
}

// ==================== 测试桩 ====================
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
        addEventListener: function (t, fn) { (this._listeners = this._listeners || {})[t] = fn; },
        removeEventListener: function () {},
        // 够用的选择器：按 class 找一个后代（测「你在此」挪窝用）
        querySelector: function (sel) {
            var want = String(sel || '').replace(/^\./, '');
            var found = null;
            (function scan(node) {
                if (found) return;
                for (var i = 0; i < node.children.length; i++) {
                    var c = node.children[i];
                    var cls = (c._attrs && c._attrs['class']) || '';
                    if (cls.split(/\s+/).indexOf(want) >= 0) { found = c; return; }
                    scan(c);
                }
            })(el);
            return found;
        },
        closest: function () { return null; },
        scrollIntoView: function () {},
        // classList 要记真账：WorldMap.currentRegion() 靠「random-map-section 没挂 hidden」
        // 判断人是不是站在野外，桩里丢了 contains 就会静默跌回「按城池反查州」
        _classes: [],
        classList: {
            add: function (c) { var cs = String(c).split(/\s+/); for (var i = 0; i < cs.length; i++) if (cs[i] && this._cls().indexOf(cs[i]) < 0) this._cls().push(cs[i]); },
            remove: function (c) { var cs = String(c).split(/\s+/); for (var i = 0; i < cs.length; i++) { var a = this._cls(), k = a.indexOf(cs[i]); if (k >= 0) a.splice(k, 1); } },
            toggle: function (c) { var a = this._cls(), k = a.indexOf(c); if (k >= 0) a.splice(k, 1); else a.push(c); },
            contains: function (c) { return this._cls().indexOf(c) >= 0; },
            _cls: function () { return el._classes; }
        },
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
global.showMessage = function (m, t) { msgs.push({ m: m, t: t }); };
global.window.showMessage = global.showMessage;

var timeCalls = [];
global.timeSystem = {
    gameTime: { totalMinutes: 0, currentDay: 5, currentHour: 14, currentMinute: 0, currentSeason: 'spring', currentMonth: 3, currentYear: 1 },
    advanceTime: function (m, r) { timeCalls.push({ m: m, r: r }); global.timeSystem.gameTime.totalMinutes += m; },
    onNewDaySubscribe: function () {}
};

var items = [];
global.addItemToInventory = function (id, n) { items.push({ id: id, n: n }); return true; };
global.updateCharacterStatus = function () {};
global.updateCurrencyUI = function () {};
global.getEffectiveMax = function () { return 100; };
global.generateRandomEnemy = function (level, type) {
    return { name: (type === 'beast' ? '野狼' : '黑衣修士') + level, hp: 100, physiologyType: 'humanoid', level: level };
};
global.openBattleWithEntity = function () {};
global.itemById = {
    mat_lingzhi: { name: '灵芝' },
    pill_small_recovery: { name: '小还丹' }
};
global.LANDMARKS = {};
global.ResourcePoints = { listByRegion: function () { return []; } };
global.DungeonDynamic = { listActive: function () { return []; } };
global.StateRegistry = { register: function () {} };
global.locationSystem = { getCurrentLocation: function () { return '帝都 · 长安'; } };

load('js/regions.js');
load('js/core/state-registry.js');
load('js/map/wild-terrain.js');
load('js/map/world-map.js');
load('js/map/randomMap.js');

var WM = global.WorldMap;
var api = global.wildMapApi;
var MORTAL = ['中州', '东荒', '南疆', '西漠', '北冥', '蜀地', '东南海域'];

var origRandom = Math.random;
function withRandom(v, fn) {
    Math.random = typeof v === 'function' ? v : function () { return v; };
    try { return fn(); } finally { Math.random = origRandom; }
}
// 依次吐数：第 N 次调用返回 seq[N]（用尽后回退 0.99，避免误触别的事）
function seq() {
    var list = Array.prototype.slice.call(arguments), i = 0;
    return function () { return i < list.length ? list[i++] : 0.99; };
}

function standIn(region) {
    global.setMapSeed(region + '_world_0');
    global.openWildernessMap(region);
}

function spentTime() { return timeCalls.reduce(function (s, c) { return s + c.m; }, 0); }

// ==================== W1 疆界成图 ====================
console.log('\n[W1] 疆界成图：九州连成一块大陆');
(function () {
    MORTAL.forEach(function (r) {
        var ns = WM.neighborsOf(r);
        assert(ns.length >= 1, r + ' 该至少与一州接壤（实得 ' + ns.length + '）');
    });
    // 图是连着的：从中州走遍九州
    var seen = {}, queue = ['中州'];
    seen['中州'] = true;
    while (queue.length) {
        WM.neighborsOf(queue.shift()).forEach(function (n) {
            if (!seen[n.region]) { seen[n.region] = true; queue.push(n.region); }
        });
    }
    var missed = MORTAL.filter(function (r) { return !seen[r]; });
    assert(missed.length === 0, '九州该连成一片，走不到的：' + missed.join('、'));
    // 位面不在疆界之内
    assert(WM.isPlane('灵界') && WM.isPlane('魔界'), '灵界魔界该算位面');
    assert(WM.neighborsOf('灵界').length === 0 && WM.neighborsOf('魔界').length === 0, '位面不该有脚力可走的邻州');
    // 边界两头都得是真实的州
    var bad = WM.borders.filter(function (b) { return b.a === b.b || !WM.knownRegion(b.a) || !WM.knownRegion(b.b); });
    assert(bad.length === 0, '边界两头都该是真实的州');
    console.log('    ' + WM.borders.length + ' 条疆界，九州全连着');
})();

// ==================== W2 关隘有名 ====================
console.log('\n[W2] 关隘有名：一道关、一段里数、一路光景');
(function () {
    var names = [];
    WM.borders.forEach(function (b) {
        assert(!!b.route && b.route.length >= 2, b.a + '→' + b.b + ' 该有一道关名');
        assert(b.li >= 100 && b.li <= 500, b.route + ' 的里数该在百里到五百里之间（实得 ' + b.li + '）');
        assert(!!b.blurb && b.blurb.length >= 10, b.route + ' 该写明路上光景');
        names.push(b.route);
    });
    assert(new Set(names).size === names.length, '关名不该重样');
    console.log('    ' + names.slice(0, 4).join(' / ') + ' ……');
})();

// ==================== W3 不接壤走不通 ====================
console.log('\n[W3] 不接壤走不通：跨不了境就得一站一站走');
(function () {
    standIn('西漠');
    timeCalls.length = 0; msgs.length = 0;
    var ok = withRandom(0.99, function () { return WM.setOut('东南海域'); });
    assert(ok === false, '西漠直取东南海域该走不通');
    assert(spentTime() === 0, '走不通就不该结时辰（实得 ' + spentTime() + ' 分钟）');
    assert(global.currentRegionForMap === '西漠', '人还该站在西漠');
    var line = msgs.map(function (m) { return m.m; }).join('|');
    assert(/不接壤/.test(line), '该说清不接壤（' + line.slice(0, 60) + '）');
    assert(/取道/.test(line) && /南疆/.test(line), '该指条路出来（' + line.slice(0, 80) + '）');
    // 两站就能到：先南疆再出海
    timeCalls.length = 0;
    withRandom(0.99, function () { WM.setOut('南疆'); });
    assert(global.currentRegionForMap === '南疆', '取道南疆该真到南疆');
    console.log('    西漠出海须取道南疆，一步跨不过去');
})();

// ==================== W4 过境结账 ====================
console.log('\n[W4] 过境结账：里数折时辰，脚力折力气');
(function () {
    standIn('中州');
    global.currentCharData = { health: 90, energy: 90, qi: 40, maxQi: 100, realm: '筑基' };
    timeCalls.length = 0; msgs.length = 0;
    var ok = withRandom(0.99, function () { return WM.setOut('蜀地'); });   // 剑阁栈道 180 里，路上无事
    assert(ok === true, '中州往蜀地该走得通');
    assert(spentTime() === 180 * 2, '一百八十里该折六个时辰（实得 ' + spentTime() + ' 分钟）');
    assert(global.currentCharData.energy === 90 - Math.round(180 / 25), '脚力该按里数扣（余 ' + global.currentCharData.energy + '）');
    assert(global.currentRegionForMap === '蜀地', '到了该站在蜀地地界');
    var line = msgs.map(function (m) { return m.m; }).join('|');
    assert(/剑阁栈道/.test(line), '该点出走的是哪道关');
    assert(/蜀地地界/.test(line), '该说到站');
    // 同一州不算赶路
    timeCalls.length = 0;
    withRandom(0.99, function () { WM.setOut('蜀地'); });
    assert(spentTime() === 0, '在同一州里不该再结赶路的账');
    // 脚力不济出不了门（人在蜀地，回中州也要走剑阁栈道）
    global.currentCharData.energy = 2;
    msgs.length = 0;
    var ok2 = withRandom(0.99, function () { return WM.setOut('中州'); });
    assert(ok2 === false, '脚力不济该出不了远门');
    assert(/脚力不济/.test(msgs.map(function (m) { return m.m; }).join('|')), '该提醒先歇脚');
    console.log('    中州→蜀地：六个时辰 · 力气 -7');
})();

// ==================== W5 关隘有事 ====================
console.log('\n[W5] 关隘有事：关卒盘查、商队搭伙');
(function () {
    standIn('中州');
    global.currentCharData = { health: 90, energy: 90, qi: 40, maxQi: 100, realm: '筑基' };
    timeCalls.length = 0; msgs.length = 0;
    // 第一掷命中关口事，第二掷点第一样：关卒盘查（多磨半个时辰，费力气）
    withRandom(seq(0, 0), function () { WM.setOut('北冥'); });
    var mins = timeCalls.map(function (c) { return c.m; });
    assert(spentTime() === 360 * 2 + 30, '赶路加盘查该是七个时辰半（实得 ' + mins.join(',') + '）');
    assert(mins.indexOf(30) >= 0, '盘查那半个时辰该单独记账');
    assert(msgs.some(function (m) { return /关卒盘查/.test(m.m); }), '该有盘查这回事');
    // 商队搭伙：南疆走瘴沙古道去西漠，掷中第二样（得干粮）
    standIn('南疆');
    items.length = 0; msgs.length = 0; timeCalls.length = 0;
    withRandom(seq(0, 0.5), function () { WM.setOut('西漠'); });
    assert(items.some(function (it) { return it.id === 'pill_small_recovery'; }), '同路商队该分你干粮');
    assert(msgs.some(function (m) { return /商队搭了段伙/.test(m.m); }), '该说清是商队搭伙');
    assert(/小还丹/.test(msgs.map(function (m) { return m.m; }).join('|')), '名目该叫得出口');
    console.log('    盘查多磨半时辰 / 搭伙分得小还丹');
})();

// ==================== W6 位面走不通 ====================
console.log('\n[W6] 位面走不通：灵界魔界只走位面之门');
(function () {
    standIn('中州');
    timeCalls.length = 0; msgs.length = 0;
    var ok = withRandom(0.99, function () { return WM.setOut('灵界'); });
    assert(ok === false, '脚力到不了灵界');
    assert(/位面之门/.test(msgs.map(function (m) { return m.m; }).join('|')), '该指去寻位面之门');
    assert(spentTime() === 0, '不该结时辰');
    console.log('    位面之门另走一道');
})();

// ==================== W7 图上有路 ====================
console.log('\n[W7] 图上有路：「你在此」跟着人挪州');
(function () {
    var svg = els['world-map'];
    assert(!!svg, '舆图该在');
    var groups = [];
    (function scan(n) { n.children.forEach(function (c) { if ((c._attrs && c._attrs['class'] || '') === 'world-route-g') groups.push(c); scan(c); }); })(svg);
    assert(groups.length === WM.borders.length, '十一条疆界该都画上路（实得 ' + groups.length + '）');
    var texts = [];
    (function scan(n) { n.children.forEach(function (c) { if (c.textContent) texts.push(c.textContent); scan(c); }); })(svg);
    assert(texts.indexOf('青木官道 · 240 里') >= 0, '关名与里数该落在图上');
    assert(texts.some(function (t) { return /位面之上/.test(t); }), '位面该在图上留一句话');
    // 「你在此」只有一枚，且跟着人挪州
    function hereMarks() {
        var out = [];
        (function scan(n) { n.children.forEach(function (c) { if ((c._attrs && c._attrs['class'] || '') === 'world-here') out.push(c); scan(c); }); })(svg);
        return out;
    }
    standIn('中州');
    assert(hereMarks().length === 1, '「你在此」该只有一枚（实得 ' + hereMarks().length + '）');
    standIn('东南海域');
    assert(hereMarks().length === 1, '挪州之后仍该只有一枚（实得 ' + hereMarks().length + '）');
    console.log('    ' + WM.borders.length + ' 道关上图，「你在此」随人挪');
})();

// ==================== W8 野外栏出境 ====================
console.log('\n[W8] 野外栏出境：只列接壤的邻州');
(function () {
    standIn('中州');
    var html = els['wild-exit-list'] ? els['wild-exit-list']._html : '';
    assert(!!html, '野外栏该有「出此境往」');
    assert(/寒江关/.test(html) && /剑阁栈道/.test(html), '邻州该连着关名一起列出来');
    assert(html.indexOf('东南海域') < 0, '不接壤的州不该混进清单');
    var buttons = html.split('data-act="world-exit"').length - 1;
    assert(buttons === 5, '中州该有五个邻口（实得 ' + buttons + '）');
    console.log('    中州五口：' + html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60));
})();

// ==================== W9 接线齐 ====================
console.log('\n[W9] 接线齐：列表入境与野外栏出境走同一套账');
(function () {
    var rm = fs.readFileSync(path.join(ROOT, 'js/map/randomMap.js'), 'utf8');
    var app = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
    assert(/world-exit/.test(rm) && /WorldMap\.setOut/.test(rm), '野外栏的出境按钮该接上疆界账');
    assert(/WorldMap\.setOut/.test(app), '地区列表的「前往」也该走疆界账');
    assert(/WorldMap\.renderExits/.test(rm), '侧栏该画得出出境清单');
    // 侧栏按钮真点下去，走的是同一套结账
    standIn('中州');
    global.currentCharData = { health: 90, energy: 90, qi: 40, maxQi: 100, realm: '筑基' };
    timeCalls.length = 0;
    withRandom(0.99, function () { WM.setOut('东荒'); });
    assert(global.currentRegionForMap === '东荒' && spentTime() === 240 * 2, '青木官道二百四十里该折八个时辰');
    console.log('    一套疆界账，两处入口');
})();

// ==================== 结果 ====================
console.log('\n========== v20.63 天下疆界 ==========');
console.log('通过 ' + passed + ' / 失败 ' + failed);
process.exit(failed ? 1 : 0);
