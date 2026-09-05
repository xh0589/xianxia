/**
 * v20.59-wild-map-ferry-node.js — 渡口行舟 + 足迹留痕验收：
 *   U1 渡口上图：海区/内河地区生成渡口 POI，必临水、必在主陆可达
 *   U2 渡口成网：海区两处成渡网，雇舟往来有得选
 *   U3 雇舟结账：船钱真扣、行程真结、人真到对岸，水路上的事单独算
 *   U4 未见的渡口不上船：没去过的埠头不在清单里
 *   U5 足迹留痕：亲脚到过的地物金环标记、侧栏记「已至」，跨存档仍在
 *
 * 运行：node tests/v20.59-wild-map-ferry-node.js
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

// ==================== 测试桩（与 v20.56/57/58 同源） ====================
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
global.showMessage = function (m, t) { msgs.push({ m: m, t: t }); };

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
global.exploreLandmark = function () {};
global.LANDMARKS = {};
global.ResourcePoints = { listByRegion: function () { return []; } };
global.DungeonDynamic = { listActive: function () { return []; } };
global.StateRegistry = { register: function () {} };

load('js/core/state-registry.js');
load('js/map/wild-terrain.js');
load('js/map/randomMap.js');

var WT = global.WildTerrain;
var api = global.wildMapApi;

global.currentCharData = { health: 90, energy: 90, qi: 50, maxQi: 100, realm: '筑基' };

// 按条件找图
function openRegionWhere(region, pred) {
    for (var i = 0; i < 10; i++) {
        var seed = region + '_probe_' + i;
        global.setMapSeed(seed);
        global.openWildernessMap(region);
        if (!pred || pred(global.currentMap, global.wildMapApi.pois())) return seed;
    }
    return null;
}

function nearWater(M, x, y) {
    return [[0, -1], [0, 1], [-1, 0], [1, 0]].some(function (d) {
        var n = M[y + d[1]] && M[y + d[1]][x + d[0]];
        return n && n.terrainKey === 'WATER';
    });
}

function walkTo(M, target) {
    var res = WT.findPath(M.map(function (r) { return r.map(function (c) { return { t: c.terrainKey }; }); }),
        { x: global.playerPos.x, y: global.playerPos.y }, target);
    if (!res) return false;
    res.path.forEach(function (p) { api.stepTo(p.x, p.y); });
    return global.playerPos.x === target.x && global.playerPos.y === target.y;
}

// ==================== U1 渡口上图 ====================
console.log('\n[U1] 渡口上图：临水、可达、有名字');
(function () {
    var regions = ['东南海域', '南疆', '中州', '北冥'];
    var okAll = true, ferryRegions = 0;
    regions.forEach(function (r) {
        var gotAny = false;
        for (var i = 0; i < 6 && !gotAny; i++) {
            var g = WT.generate({ seed: r + '_ferry_' + i, region: r, rows: 20, cols: 26 });
            var ferries = g.pois.filter(function (p) { return p.type === 'ferry'; });
            if (!ferries.length) continue;
            gotAny = true;
            ferryRegions++;
            var reach = WT.floodFill(g.grid, g.start);
            ferries.forEach(function (f) {
                var cell = g.grid[f.y][f.x];
                var wet = [[0, -1], [0, 1], [-1, 0], [1, 0]].some(function (d) {
                    var n = g.grid[f.y + d[1]] && g.grid[f.y + d[1]][f.x + d[0]];
                    // 古道穿水会把渡口边上的水面凿成浅滩，也算临水
                    return n && (n.t === 'WATER' || n.t === 'FORD');
                });
                if (!wet) { okAll = false; console.error('    ' + r + ' 渡口「' + f.name + '」不临水'); }
                if (!reach.seen[f.y * 26 + f.x]) { okAll = false; console.error('    ' + r + ' 渡口「' + f.name + '」不可达'); }
            });
        }
        if (!gotAny) { okAll = false; console.error('    ' + r + ' 六张图连一个渡口都没有'); }
    });
    assert(ferryRegions === regions.length, '四类地区都该摆得下渡口（实得 ' + ferryRegions + '）');
    assert(okAll, '渡口必须临水且可达');
    console.log('    ' + ferryRegions + ' 类地区各有渡口，全临水全可达');
})();

// ==================== U2 渡口成网 ====================
console.log('\n[U2] 渡口成网：海区两处起步');
(function () {
    var withTwo = 0;
    for (var i = 0; i < 6; i++) {
        var g = WT.generate({ seed: 'net_' + i, region: '东南海域', rows: 20, cols: 26 });
        if (g.pois.filter(function (p) { return p.type === 'ferry'; }).length >= 2) withTwo++;
    }
    assert(withTwo >= 2, '东南海域六张图里该有至少两张摆出双渡口（实得 ' + withTwo + '）');
    console.log('    六图里 ' + withTwo + ' 张成双渡网');
})();

// ==================== U3 雇舟结账 ====================
console.log('\n[U3] 雇舟结账：船钱、行程、到岸');
global.setMapSeed('ferry_play_seed');
var seed2 = openRegionWhere('东南海域', function (M, pois) {
    return pois.filter(function (p) { return p.type === 'ferry'; }).length >= 2;
});
assert(!!seed2, '东南海域应能探出双渡口的图');
var MAP = global.currentMap;
var FER = api.pois().filter(function (p) { return p.type === 'ferry'; });
var A = FER[0], B = FER[1];
assert(!!A && !!B, '应有两处渡口可试');
if (A && B) {
    // 都得见过：先点亮两处
    api.revealAround(A.x, A.y, 2);
    api.revealAround(B.x, B.y, 2);
    assert(walkTo(MAP, { x: A.x, y: A.y }), '渡口 A 应有路可走到');
    global.inventory = { currency: { spiritStones: 50 } };
    api.poiAction('ferry');
    var listHtml = String(els['wild-actions']._html);
    assert(listHtml.indexOf(B.name) >= 0, '埠头清单应列出去处「' + B.name + '」（实得 ' + listHtml.slice(0, 80) + '）');
    assert(listHtml.indexOf('灵石') >= 0, '清单应写明船钱');
    timeCalls.length = 0;
    api.ferryTravel(B.id);
    assert(global.playerPos.x === B.x && global.playerPos.y === B.y, '应已渡到对岸「' + B.name + '」');
    assert(timeCalls.length === 1 && timeCalls[0].m > 0, '雇舟应结行程（实得 ' + JSON.stringify(timeCalls) + '）');
    assert(timeCalls.length && timeCalls[0].m === 30 + (Math.abs(B.x - A.x) + Math.abs(B.y - A.y)) * 20,
        '行程应按水路距离结（实得 ' + (timeCalls[0] || {}).m + '）');
    assert(global.inventory.currency.spiritStones === 45, '船钱 ' + 5 + ' 灵石应真扣（实得 ' + global.inventory.currency.spiritStones + '）');
    console.log('    渡水 ' + timeCalls[0].m + ' 分钟 · 船钱已收 · 已靠岸');
}

// ==================== U4 未见的渡口不上船 ====================
console.log('\n[U4] 未见的渡口不上船');
(function () {
    var C = api.pois().filter(function (p) { return p.type === 'ferry' && p.id !== B.id; })[0];
    assert(!!C, '应有另一处渡口可试');
    if (C) {
        // 站在 A（回程），把 C 的 discovered 抹掉
        assert(walkTo(MAP, { x: A.x, y: A.y }), '应能走回渡口 A');
        C.discovered = false;
        api.poiAction('ferry');
        var html = String(els['wild-actions']._html);
        assert(html.indexOf(C.name) < 0, '没见过的渡口不该出现在清单里');
        console.log('    清单只列见过的埠头');
    }
})();

// ==================== U5 足迹留痕 ====================
console.log('\n[U5] 足迹留痕：到过的地方图上记得');
(function () {
    var target = api.pois().filter(function (p) { return p.type === 'town' || p.type === 'market'; })[0];
    assert(!!target, '应有村镇/坊市可试');
    if (target) {
        api.revealAround(target.x, target.y, 2);
        assert(walkTo(MAP, { x: target.x, y: target.y }), '应能走到该地');
        assert(api.poiIsVisited(target.id), '到过就该记下足迹');
        // 侧栏记「已至」
        global.renderMap(els['random-map-svg'], MAP, 0, 0);
        assert(String(els['wild-poi-list']._html).indexOf('已至') >= 0, '侧栏地标应记「已至」');
        // 图上金环
        var rings = 0;
        (function walk(n) {
            (n.children || []).forEach(function (c) {
                if (c.tag === 'circle' && c._attrs['stroke'] === '#fde68a' && c._attrs['fill'] === 'none') rings++;
                walk(c);
            });
        })(els['random-map-svg']);
        assert(rings >= 1, '到过的地物应有金环印记（实得 ' + rings + '）');
        // 跨存档仍在
        var exported = JSON.parse(JSON.stringify({ regions: api.state().regions }));
        global.openWildernessMap('蜀地');
        api.state().regions = exported.regions;   // 读档：换种子会清探索，这里不能动种子
        global.openWildernessMap('东南海域');
        assert(api.poiIsVisited(target.id), '读档回来足迹应在');
        console.log('    金环印记 + 侧栏「已至」+ 跨存档保留');
    }
})();

// ==================== 结果 ====================
console.log('\n========== v20.59 渡口行舟 ==========');
console.log('通过 ' + passed + ' / 失败 ' + failed);
process.exit(failed ? 1 : 0);
