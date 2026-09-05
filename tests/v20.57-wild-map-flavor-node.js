/**
 * v20.57-wild-map-flavor-node.js — 野外地图补味验收（接 v20.56 舆图化的下一批）：
 *   F1 地形出什么：每种地皮都有自己的活物名录，地区加味并入同池
 *   F2 撒布随地形：图上野兽/行人的名字按脚下地皮取，不再满天下同一种「狼」
 *   F3 遭遇随地形：途中撞上谁由地皮说了算（道上多遇人，水泽火山必是活物）
 *   F4 四时入图：春嫩/夏暖/秋赭/冬灰各有色调，冬季雪线冻土赶路更慢
 *   F5 舆图题跋：图名随地区、落地区首字小印、罗盘指北、外粗内细边框——仍零描边方块
 *   F6 已见注记：走过认得的地标，迷雾里也留个灰字名
 *
 * 运行：node tests/v20.57-wild-map-flavor-node.js
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

// ==================== 测试桩（与 v20.56 同源） ====================
global.window = global;

var els = {};
function fakeEl(tag) {
    return {
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
}
Object.defineProperty(fakeEl.prototype, 'innerHTML', {
    get: function () { return this._html; },
    set: function (v) { this._html = String(v); }
});

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

var battles = [];
global.openBattleWithEntity = function (e) { battles.push(e); };

global.exploreLandmark = function () {};
global.LANDMARKS = {
    lm_test: { name: '古剑峰', region: '蜀地', icon: '🗡️', type: 'cultivation_spot' }
};
global.ResourcePoints = { listByRegion: function () { return []; } };
global.DungeonDynamic = { listActive: function () { return []; } };
global.StateRegistry = { register: function () {} };

load('js/core/state-registry.js');
load('js/map/wild-terrain.js');
load('js/map/randomMap.js');

var WT = global.WildTerrain;
var api = global.wildMapApi;

// 受控随机：按队列吐值，队尾循环
function withRandom(seq, fn) {
    var orig = Math.random, i = 0;
    Math.random = function () { var v = seq[Math.min(i, seq.length - 1)]; i++; return v; };
    try { return fn(); } finally { Math.random = orig; }
}

// ==================== F1 地形出什么 ====================
console.log('\n[F1] 地形出什么：每种地皮有自己的活物名录');
global.setMapSeed('flavor_seed');
global.openWildernessMap('南疆');
var MAP = global.currentMap;
var named = 0, emptyPool = 0;
Object.keys(WT.TERRAIN).forEach(function (k) {
    var f = api.habitatFlavor({ terrainKey: k });
    if (!f.beasts.length) { emptyPool++; console.error('    ' + k + ' 无兽名'); }
    if (k !== 'WATER' && !f.persons.length) { emptyPool++; console.error('    ' + k + ' 无人名'); }
});
assert(emptyPool === 0, '每种地形都该有兽名（水域可无人）');
assert(api.habitatFlavor({ terrainKey: 'SWAMP' }).beasts.indexOf('蛊虫群') >= 0, '南疆的沼泽该并进地区兽名（蛊虫群）');
assert(api.habitatFlavor({ terrainKey: 'SWAMP' }).beasts.indexOf('毒蟒') >= 0, '沼泽该有本底的毒蟒');
// 地区加味要真起作用：同一片地皮，换个地区名录就该不一样
var nanjiangBeasts = api.habitatFlavor({ terrainKey: 'FOREST' }).beasts.join(',');
global.openWildernessMap('北冥');
var beimingBeasts = api.habitatFlavor({ terrainKey: 'FOREST' }).beasts.join(',');
assert(nanjiangBeasts !== beimingBeasts, '同一片林海，南疆与北冥的活物名录应不同');
global.openWildernessMap('南疆');
console.log('    12 种地形 × 兽/人名录齐备，地区加味并入');

// ==================== F2 撒布随地形 ====================
console.log('\n[F2] 撒布随地形：名字按脚下地皮取');
(function () {
    var ok = true, checked = 0;
    MAP.forEach(function (row) {
        row.forEach(function (c) {
            (c.entities || []).forEach(function (e) {
                if (e.symbol === '🐾') {
                    checked++;
                    var pool = api.habitatFlavor(c).beasts;
                    if (pool.indexOf(e.name) < 0) { ok = false; console.error('    ' + c.terrainKey + ' 上冒出「' + e.name + '」'); }
                    if (e.habitat !== c.terrainKey) { ok = false; console.error('    兽未记栖息地'); }
                } else if (e.kind === 'person') {
                    checked++;
                    var pool2 = api.habitatFlavor(c).persons;
                    if (pool2.length && pool2.indexOf(e.name) < 0) { ok = false; console.error('    ' + c.terrainKey + ' 上的人「' + e.name + '」不在名录'); }
                }
            });
        });
    });
    assert(checked > 10, '应有足够实体可查（实得 ' + checked + '）');
    assert(ok, '所有活物名字都应来自脚下地皮的名录');
    // 同一地皮该有几种叫法，别又变成一种「狼」
    var kinds = {};
    MAP.forEach(function (row) { row.forEach(function (c) { (c.entities || []).forEach(function (e) {
        if (e.symbol === '🐾') (kinds[e.name] = kinds[e.name] || []).push(1);
    }); }); });
    assert(Object.keys(kinds).length >= 3, '一张图上该有好几种活物（实得 ' + Object.keys(kinds).length + ' 种）');
    console.log('    实体 ' + checked + ' 个全入名录，共 ' + Object.keys(kinds).length + ' 种');
})();

// ==================== F3 遭遇随地形 ====================
console.log('\n[F3] 遭遇随地形：撞上谁由地皮说了算');
function walkTo(target) {
    var res = WT.findPath(MAP.map(function (r) { return r.map(function (c) { return { t: c.terrainKey }; }); }),
        { x: global.playerPos.x, y: global.playerPos.y }, target);
    if (!res) return false;
    res.path.forEach(function (p) { api.stepTo(p.x, p.y); });
    return global.playerPos.x === target.x && global.playerPos.y === target.y;
}
function findCell(pred) {
    for (var y = 0; y < MAP.length; y++) for (var x = 0; x < MAP[0].length; x++) if (pred(MAP[y][x], x, y)) return { x: x, y: y };
    return null;
}
(function () {
    // 沼泽/火山/水边：必是活物，话里带地皮名
    var wild = findCell(function (c) { return c.fog > 0 && (c.terrainKey === 'SWAMP' || c.terrainKey === 'VOLCANO' || c.terrainKey === 'FORD'); })
        || findCell(function (c) { return (c.terrainKey === 'SWAMP' || c.terrainKey === 'VOLCANO' || c.terrainKey === 'FORD'); });
    assert(!!wild, '南疆图上应有可落脚的险地');
    if (wild) {
        api.revealAround(wild.x, wild.y, 2);
        assert(walkTo(wild), '险地应有路可达');
        msgs.length = 0; battles.length = 0;
        var fired = withRandom([0, 0.9, 0.5], function () { return global.rollWildEncounter(); });
        assert(fired, '受控随机下应触发遭遇');
        assert(msgs.some(function (m) { return /沼泽|火山|浅滩/.test(m.m); }), '遭遇话术应点出地皮（实得 ' + msgs.map(function (m) { return m.m; }).join(' | ') + '）');
        var pool = api.habitatFlavor(MAP[global.playerPos.y][global.playerPos.x]).beasts;
        assert(battles.length === 1 && pool.indexOf(battles[0].name) >= 0, '撞上的应是本地活物（实得 ' + (battles[0] || {}).name + '）');
    }
    // 古道：多半是人
    var road = findCell(function (c) { return c.terrainKey === 'ROAD'; });
    if (road) {
        api.revealAround(road.x, road.y, 2);
        walkTo(road);
        msgs.length = 0; battles.length = 0;
        withRandom([0, 0.9, 0.5], function () { global.rollWildEncounter(); });
        var cellNow = MAP[global.playerPos.y][global.playerPos.x];
        if (cellNow.terrainKey === 'ROAD') {
            assert(msgs.some(function (m) { return /古道/.test(m.m); }), '古道遭遇话术应点出「古道」');
            var ppl = api.habitatFlavor(cellNow).persons;
            assert(battles.length === 1 && ppl.indexOf(battles[0].name) >= 0, '古道上撞上的应是人（实得 ' + (battles[0] || {}).name + '）');
        }
    }
})();

// ==================== F4 四时入图 ====================
console.log('\n[F4] 四时入图：季节改色，冬天雪路更慢');
(function () {
    var fills = {};
    ['spring', 'summer', 'autumn', 'winter'].forEach(function (s) {
        global.timeSystem.gameTime.currentSeason = s;
        var t = api.seasonTint();
        fills[s] = t.fill;
        assert(!!t.fill && !!t.name, s + ' 应有自己的色调');
    });
    assert(new Set(Object.values(fills)).size === 4, '四季色调应各不相同');
    // 冬季：雪线/冻土赶路更慢，平地照旧
    global.timeSystem.gameTime.currentSeason = 'winter';
    assert(api.seasonTravelMul({ terrainKey: 'SNOW' }) === 1.15, '冬季雪线应 ×1.15');
    assert(api.seasonTravelMul({ terrainKey: 'FROZEN' }) === 1.15, '冬季冻土应 ×1.15');
    assert(api.seasonTravelMul({ terrainKey: 'PLAIN' }) === 1, '冬季平地不应加耗时');
    global.timeSystem.gameTime.currentSeason = 'summer';
    assert(api.seasonTravelMul({ terrainKey: 'SNOW' }) === 1, '夏季雪线不应加耗时');

    // 真走一步：结账应含季节系数
    global.timeSystem.gameTime.currentSeason = 'winter';
    var near = null;
    var px = global.playerPos.x, py = global.playerPos.y;
    [[1, 0], [-1, 0], [0, 1], [0, -1]].some(function (d) {
        var c = MAP[py + d[1]] && MAP[py + d[1]][px + d[0]];
        if (c && WT.passable({ t: c.terrainKey })) { near = { x: px + d[0], y: py + d[1], cell: c }; return true; }
        return false;
    });
    assert(!!near, '脚下应有相邻可走格');
    if (near) {
        timeCalls.length = 0;
        api.stepTo(near.x, near.y);
        var expect = Math.round((near.cell.terrain.moveCost || 1) * 10 * api.seasonTravelMul(near.cell));
        assert(timeCalls.length === 1 && timeCalls[0].m === expect,
            '赶路结账应含季节系数（实得 ' + (timeCalls[0] || {}).m + ' 应为 ' + expect + '）');
    }

    // 画面：冬季色调 + 零星雪沫（无天象时）
    global.openWildernessMap('蜀地');
    global.renderMap(els['random-map-svg'], global.currentMap, 0, 0);
    var tint = 0, flakes = 0;
    (function walk(n) {
        (n.children || []).forEach(function (c) {
            if (c.tag === 'rect' && c._attrs['fill'] === '#d6ecf7') tint++;
            if (c.tag === 'circle' && c._attrs['class'] === 'wild-snow') flakes++;
            walk(c);
        });
    })(els['random-map-svg']);
    assert(tint >= 1, '冬季应有整幅色调罩层');
    assert(flakes >= 5, '冬日无雪也该飘点雪沫（实得 ' + flakes + '）');
    assert(String(els['wild-env-info'].textContent).indexOf('冬') >= 0, '侧栏天时应报季节');
    global.timeSystem.gameTime.currentSeason = 'spring';
    console.log('    四季色调齐备，冬季雪路 ×1.15 已结进耗时');
})();

// ==================== F5 舆图题跋 ====================
console.log('\n[F5] 舆图题跋：图名 / 小印 / 罗盘 / 边框');
(function () {
    global.renderMap(els['random-map-svg'], global.currentMap, 0, 0);
    var texts = [], goldFrames = 0, strokedRects = 0;
    (function walk(n) {
        (n.children || []).forEach(function (c) {
            if (c.tag === 'text') texts.push(c.textContent);
            if (c.tag === 'path' && c._attrs['stroke'] === '#caa96a') goldFrames++;
            if (c.tag === 'rect' && c._attrs['stroke'] !== undefined) strokedRects++;
            walk(c);
        });
    })(els['random-map-svg']);
    var joined = texts.join('|');
    assert(joined.indexOf('《蜀地山河舆图》') >= 0, '图名应随地区（实得 ' + joined.slice(0, 60) + '）');
    assert(texts.indexOf('蜀') >= 0, '应有一方落地区首字的小印');
    assert(texts.indexOf('北') >= 0, '应有罗盘指北');
    assert(goldFrames >= 3, '外粗内细边框 + 题签应有三道金线（实得 ' + goldFrames + '）');
    assert(strokedRects === 0, '题跋不得引入描边方块（格线门禁），实得 ' + strokedRects);
    // 题跋不挡点击
    var blocked = false;
    (function walk(n) {
        (n.children || []).forEach(function (c) {
            if (c._attrs['pointer-events'] === undefined && c.tag !== 'svg') { /* 子节点各自声明 */ }
            walk(c);
        });
    })(els['random-map-svg']);
    assert(!blocked, '题跋不应拦截点击');
    console.log('    图名/小印/罗盘/边框齐备，方块仍零描边');
})();

// ==================== F6 已见注记 ====================
console.log('\n[F6] 已见注记：走过认得的地标留个灰字名');
(function () {
    var poi = api.pois()[0];
    assert(!!poi, '应有地标可试');
    var cell = global.currentMap[poi.y][poi.x];
    var wasFog = cell.fog;
    poi.discovered = true;
    cell.fog = 1;
    global.renderMap(els['random-map-svg'], global.currentMap, 0, 0);
    var muted = [];
    (function walk(n) {
        (n.children || []).forEach(function (c) {
            if (c.tag === 'text' && c._attrs['fill'] === '#9aa5b1') muted.push(c.textContent);
            walk(c);
        });
    })(els['random-map-svg']);
    assert(muted.indexOf(poi.name) >= 0, '已见地标在迷雾里应留灰字名（实得 ' + muted.join('|') + '）');
    // 可见时仍用亮字
    cell.fog = wasFog === 0 ? 2 : wasFog;
    global.renderMap(els['random-map-svg'], global.currentMap, 0, 0);
    var bright = [];
    (function walk(n) {
        (n.children || []).forEach(function (c) {
            if (c.tag === 'text' && c._attrs['fill'] === '#fde68a') bright.push(c.textContent);
            walk(c);
        });
    })(els['random-map-svg']);
    assert(bright.indexOf(poi.name) >= 0, '可见地标仍应亮字标注');
    console.log('    灰字记忆 / 亮字眼前，两态齐备');
})();

// ==================== 结果 ====================
console.log('\n========== v20.57 野外地图补味 ==========');
console.log('通过 ' + passed + ' / 失败 ' + failed);
process.exit(failed ? 1 : 0);
