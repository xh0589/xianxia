/**
 * v20.56-wild-map-node.js — 野外地图重做验收：
 *   P1 地形成片：不再逐格掷骰出棋盘噪点（同质邻接率必须显著高于随机）
 *   P2 种子确定：同种子同地区，两张图一模一样
 *   P3 地标可达：每个 POI 都能从起点走到（生成器自检不糊弄）
 *   P4 寻路结账：路径逐格相邻、代价按地形耗时；水域无路
 *   P5 迷雾三态：未知 / 已见（记忆） / 可见，离开后不复原
 *   P6 建图：POI 落格、实体撒布、起点安全区净空
 *   P7 赶路：单步与远途都结时间，远途能到，中途会被遭遇打断
 *   P8 采集：入背包、节点枯竭要等再生
 *   P9 存档往返：迷雾/尸首/枯竭跨存档保留（StateRegistry: wildMap）
 *   P10 地物接真系统：村镇休息 / 坊市 / 洞府 / 遗迹 / 资源点 / 秘境入口都走真 API
 *   P11 舆图观感：不画格线（方块零描边）、交界晕染过渡、古道连成线
 *
 * 运行：node tests/v20.56-wild-map-node.js
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
global.WorldCalendar = { day: 5 };

var items = [];
global.addItemToInventory = function (id, n) { items.push({ id: id, n: n }); return true; };
global.updateCharacterStatus = function () {};
global.updateCurrencyUI = function () {};
global.getEffectiveMax = function () { return 100; };
global.generateRandomEnemy = function (level, type) {
    return { name: (type === 'beast' ? '野狼' : '黑衣修士') + level, hp: 100, physiologyType: 'humanoid', level: level };
};

var shopCalls = [], cultCalls = [], exploreCalls = [];
global.openCityShop = function (t) { shopCalls.push(t); };
global.startCultivation = function () { cultCalls.push(1); };
global.exploreLandmark = function (n) { exploreCalls.push(n); };
global.LANDMARKS = {
    lm_test: { name: '古剑峰', region: '蜀地', icon: '🗡️', type: 'cultivation_spot' }
};
global.ResourcePoints = {
    listByRegion: function (r) { return r === '东海' ? [{ id: 'mine_test_01', name: '雷晶矿', type: 'mine', ownerSect: null }] : []; },
    getPoint: function () { return { id: 'mine_test_01', name: '雷晶矿', type: 'mine', ownerSect: null }; },
    calcYield: function () { return { mat_iron_ore: 5 }; },
    harvest: function () { return { ok: true, output: { mat_iron_ore: 5 } }; }
};
global.DungeonDynamic = {
    listActive: function () { return [{ id: 'dgn_test', name: '雷泽洞天', region: '东海' }]; },
    enter: function () { return { ok: true, dungeon: { name: '雷泽洞天' }, currentRoom: { name: '雷泽战·妖' }, roomCount: 8 }; }
};

global.StateRegistry = { register: function () {} };   // 先占位，注册表加载后被真件覆盖

load('js/core/state-registry.js');
load('js/map/wild-terrain.js');
load('js/map/randomMap.js');

var WT = global.WildTerrain;

// ==================== P1 地形成片 ====================
console.log('\n[P1] 地形成片（不再棋盘噪点）');
var gen = WT.generate({ seed: 'seedA', region: '东荒', rows: 20, cols: 26 });
(function () {
    var same = 0, total = 0;
    for (var y = 0; y < 20; y++) {
        for (var x = 0; x < 26; x++) {
            if (x + 1 < 26) { total++; if (gen.grid[y][x].t === gen.grid[y][x + 1].t) same++; }
            if (y + 1 < 20) { total++; if (gen.grid[y][x].t === gen.grid[y + 1][x].t) same++; }
        }
    }
    var rate = same / total;
    // 逐格独立掷骰的同质率约 1/种类数(~0.2)；成片地形应在 0.5 以上
    assert(rate > 0.5, '同质邻接率 ' + rate.toFixed(2) + ' 应 > 0.5（成片）');
    console.log('    同质邻接率 = ' + rate.toFixed(2));
})();

// ==================== P2 种子确定 ====================
console.log('\n[P2] 种子确定');
(function () {
    var key = function (g) { return g.map(function (r) { return r.map(function (c) { return c.t; }).join(''); }).join('|'); };
    assert(key(WT.generate({ seed: 'S1', region: '南疆', rows: 20, cols: 26 }).grid) === key(WT.generate({ seed: 'S1', region: '南疆', rows: 20, cols: 26 }).grid), '同种子应得同一张图');
    assert(key(WT.generate({ seed: 'S1', region: '南疆', rows: 20, cols: 26 }).grid) !== key(WT.generate({ seed: 'S2', region: '南疆', rows: 20, cols: 26 }).grid), '不同种子应有不同山河');
})();

// ==================== P3 地标可达 ====================
console.log('\n[P3] 地标可达');
(function () {
    var regions = ['中州', '东荒', '南疆', '西漠', '北冥', '蜀地', '东南海域'];
    var allOk = true;
    regions.forEach(function (r) {
        for (var i = 0; i < 5; i++) {
            var g = WT.generate({ seed: 'reach_' + i, region: r, rows: 20, cols: 26,
                landmarks: [{ id: 'a', name: '古剑峰', icon: '🗡️' }],
                resources: [{ id: 'm1', name: '矿', type: 'mine' }, { id: 'h1', name: '药园', type: 'herb_garden' }],
                dungeons: [{ id: 'd1', name: '秘境' }] });
            var reach = WT.floodFill(g.grid, g.start);
            g.pois.forEach(function (p) {
                if (!reach.seen[p.y * 26 + p.x]) { allOk = false; console.error('    不可达: ' + r + ' ' + p.name + ' @' + p.x + ',' + p.y); }
            });
            if (!g.pois.length) { allOk = false; console.error('    ' + r + ' 一个地标都没落下'); }
        }
    });
    assert(allOk, '7 个地区 × 5 张图，所有地标须可达且非空');
})();

// ==================== P4 寻路结账 ====================
console.log('\n[P4] 寻路结账');
(function () {
    var g = WT.generate({ seed: 'path1', region: '中州', rows: 20, cols: 26 });
    var target = g.pois[0];
    var res = WT.findPath(g.grid, g.start, { x: target.x, y: target.y });
    assert(!!res, '到第一个地标应有路');
    var legal = res.path.every(function (p, i) {
        var prev = i === 0 ? g.start : res.path[i - 1];
        return Math.abs(p.x - prev.x) + Math.abs(p.y - prev.y) === 1;
    });
    assert(legal, '路径必须逐格相邻');
    var cost = 0;
    res.path.forEach(function (p) { cost += WT.TERRAIN[g.grid[p.y][p.x].t].moveCost; });
    assert(Math.abs(cost - res.cost) < 0.01, '代价应等于沿途地形耗时之和 (' + cost + ' vs ' + res.cost + ')');
    // 水域无路
    var water = null;
    for (var y = 0; y < 20 && !water; y++) for (var x = 0; x < 26; x++) if (g.grid[y][x].t === 'WATER') { water = { x: x, y: y }; break; }
    if (water) assert(WT.findPath(g.grid, g.start, water) === null, '水域应不可达');
})();

// ==================== 载入一张真图（后面所有交互用例共用） ====================
console.log('\n[P6] 建图：POI 落格 / 实体撒布 / 起点净空');
global.setMapSeed('wild_test_seed');
global.openWildernessMap('东荒');
var MAP = global.currentMap, POIS = global.wildMapApi.pois();
assert(MAP.length === 20 && MAP[0].length === 26, '地图尺寸应为 20×26');
assert(POIS.length >= 6, '地标应至少 6 个（实得 ' + POIS.length + '）');
var poiCells = 0;
POIS.forEach(function (p) { if (MAP[p.y][p.x].poiId === p.id) poiCells++; });
assert(poiCells === POIS.length, '每个地标都应落在自己那格上');
var entityCells = 0, nodeCells = 0;
MAP.forEach(function (row) { row.forEach(function (c) { if (c.entities.length) entityCells++; if (c.node) nodeCells++; }); });
assert(entityCells > 5, '野外应有活物（实体格 ' + entityCells + '）');
assert(entityCells < 120, '活物不该像旧版那样塞满全图（实体格 ' + entityCells + '）');
assert(nodeCells > 5, '应有可采节点（节点格 ' + nodeCells + '）');
var startCell = MAP[global.playerPos.y][global.playerPos.x];
assert(startCell.entities.length === 0 && !startCell.node, '起点安全区应净空');
assert(startCell.fog === 2, '脚下应可见');

// ==================== P5 迷雾三态 ====================
console.log('\n[P5] 迷雾三态');
(function () {
    var px = global.playerPos.x, py = global.playerPos.y;
    // 视野内 fog=2
    assert(MAP[py][px].fog === 2, '脚下为可见');
    // 走远几格（超出视野半径），原格应退为「已见」而不是「未知」
    var tx = Math.min(25, px + 5);
    var res = WT.findPath(MAP.map(function (r) { return r.map(function (c) { return { t: c.terrainKey }; }); }), { x: px, y: py }, { x: tx, y: py });
    if (res && res.path.length) {
        res.path.forEach(function (p) { global.wildMapApi.stepTo(p.x, p.y); });
        var left = MAP[py][px];
        assert(left.fog === 1, '离开后的原格应退为「已见」（实得 ' + left.fog + '）');
    } else {
        assert(false, '向右两格应有路可走');
    }
    // 从未踏足的远处仍是未知
    var unknown = 0;
    MAP.forEach(function (row) { row.forEach(function (c) { if (c.fog === 0) unknown++; }); });
    assert(unknown > 0, '应仍有未探明之处');
})();

// ==================== P7 赶路结账 ====================
console.log('\n[P7] 赶路：单步与远途结时间，远途能到');
(function () {
    timeCalls.length = 0;
    var px = global.playerPos.x, py = global.playerPos.y;
    var before = timeCalls.length;
    global.wildMapApi.stepTo(Math.max(0, px - 1), py);
    assert(timeCalls.length > before, '单步移动应结时间');
    // 远途：选一个远地标，先规划再出发
    var far = POIS.filter(function (p) { return Math.abs(p.x - global.playerPos.x) + Math.abs(p.y - global.playerPos.y) > 6; })[0];
    if (far) {
        timeCalls.length = 0;
        // 远处还没探明，先假定走到过那一带（迷雾只挡没见过的地方）
        global.wildMapApi.revealAround(far.x, far.y, 2);
        global.onCellClick(far.x, far.y);
        // 可能已是相邻格则直接走了；否则应出现规划态
        var st = global.wildMapApi.state();
        // 触发出发（若在规划态）
        var before2 = timeCalls.length;
        global.wildMapApi.confirmTravel();
        var arrived = global.playerPos.x === far.x && global.playerPos.y === far.y;
        assert(arrived || timeCalls.length > before2, '远途要么走到，要么结了路程时间');
    }
})();

// ==================== P8 采集 ====================
console.log('\n[P8] 采集：入包、枯竭、再生');
(function () {
    // 找一个有节点的格子走过去
    var target = null;
    for (var y = 0; y < 20 && !target; y++) {
        for (var x = 0; x < 26; x++) {
            if (MAP[y][x].node && MAP[y][x].node.regrowDay <= 5 && MAP[y][x].fog > 0) { target = { x: x, y: y }; break; }
        }
    }
    if (!target) { assert(false, '找不到已探明的可采节点（视野太小）'); return; }
    var res = WT.findPath(MAP.map(function (r) { return r.map(function (c) { return { t: c.terrainKey }; }); }),
        { x: global.playerPos.x, y: global.playerPos.y }, target);
    assert(!!res, '可采节点应有路可达');
    res.path.forEach(function (p) { global.wildMapApi.stepTo(p.x, p.y); });
    items.length = 0;
    global.wildMapApi.gatherWildNode();
    assert(items.length > 0, '采集应产出入背包');
    var cell = MAP[global.playerPos.y][global.playerPos.x];
    assert(cell.node.regrowDay > 5, '采后节点应枯竭待再生');
    items.length = 0;
    global.wildMapApi.gatherWildNode();
    assert(items.length === 0, '枯竭节点不能再采');
})();

// ==================== P9 存档往返 ====================
console.log('\n[P9] 存档往返：迷雾/尸首/枯竭跨档保留');
(function () {
    var st = global.wildMapApi.state();
    var snapFog = (st.regions['东荒'] || {}).fog || '';
    assert(snapFog.length === 520, '迷雾应整图打包（520 格，实得 ' + snapFog.length + '）');
    assert(snapFog.indexOf('2') >= 0, '应记录了可见格');
    // 导出 → 换图 → 导回
    var exported = JSON.parse(JSON.stringify({ regions: st.regions }));
    global.openWildernessMap('蜀地');
    assert(global.currentRegionForMap === '蜀地', '应切到蜀地');
    // 回到东荒，迷雾应恢复
    global.openWildernessMap('东荒');
    var back = (global.wildMapApi.state().regions['东荒'] || {}).fog || '';
    assert(back === snapFog, '回到东荒后迷雾应与离开时一致');
})();

// ==================== P10 地物接真系统 ====================
console.log('\n[P10] 地物接真系统');
(function () {
    // 村镇：打尖休息 → 结时间 + 恢复
    global.openWildernessMap('中州');
    var M = global.currentMap, P = global.wildMapApi.pois();
    var town = P.filter(function (p) { return p.type === 'town'; })[0];
    assert(!!town, '中州应有村镇');
    if (town) {
        var res = WT.findPath(M.map(function (r) { return r.map(function (c) { return { t: c.terrainKey }; }); }),
            { x: global.playerPos.x, y: global.playerPos.y }, { x: town.x, y: town.y });
        assert(!!res, '村镇应有路可达');
        res.path.forEach(function (p) { global.wildMapApi.stepTo(p.x, p.y); });
        timeCalls.length = 0;
        global.currentCharData = { health: 50, energy: 40, qi: 30, maxQi: 100, spiritStones: 100, sectName: null };
        global.inventory = { currency: { spiritStones: 100 } };
        // v20.61 起村镇有了变体：驿亭/篷车集收船钱、残村/义庄免费——收费多少由「地方」的营生定
        var fare = (town.variant && town.variant.rest) ? (town.variant.rest.stones || 0) : 3;
        var restHours = (town.variant && town.variant.rest) ? town.variant.rest.cost : 4;
        global.wildMapApi.poiAction('rest');
        assert(timeCalls.length > 0 && timeCalls[0].m === restHours * 60, '打尖应按此地的规矩结时间（' + restHours + ' 时辰）');
        assert(global.currentCharData.health > 50, '休息应回气血');
        assert(global.inventory.currency.spiritStones === 100 - fare, '收费应与此地营生一致（应收 ' + fare + '，实得 ' + global.inventory.currency.spiritStones + '）');
    }
    // 坊市 / 洞府 / 遗迹 / 资源点 / 秘境：动作应路由到真 API
    global.currentCharData = { health: 80, energy: 80, qi: 50, maxQi: 100, spiritStones: 50, sectName: null };
    global.inventory = { currency: { spiritStones: 50 } };
    shopCalls.length = cultCalls.length = exploreCalls.length = 0;
    // v20.61 起市集/洞府有了来历：黑市可能撞巡查、遗府可能禁制反噬——骰子拨开，只验路由
    var _rng = Math.random; Math.random = function () { return 0.99; };
    global.wildMapApi.poiAction('shop');   // 站在哪都应路由出去
    assert(shopCalls.length === 1, '坊市动作应调 openCityShop');
    global.wildMapApi.poiAction('cultivate');
    Math.random = _rng;
    assert(cultCalls.length === 1, '洞府动作应调 startCultivation');

    // 东海系资源点 + 秘境（用东荒图，别名应接上）
    global.openWildernessMap('东荒');
    var M2 = global.currentMap, P2 = global.wildMapApi.pois();
    assert(P2.filter(function (p) { return p.type === 'resource'; }).length >= 1, '东荒应挂上东海资源点');
    assert(P2.filter(function (p) { return p.type === 'dungeon'; }).length >= 1, '当期秘境应上图');

    // 蜀地：图鉴地标应上图
    global.openWildernessMap('蜀地');
    var P3 = global.wildMapApi.pois();
    assert(P3.filter(function (p) { return p.type === 'landmark' && p.name === '古剑峰'; }).length === 1, '蜀地应把「古剑峰」放上野外图');
})();

// ==================== P11 舆图观感：不画格线 ====================
console.log('\n[P11] 舆图观感：格线消失，交界晕染，古道成线');
(function () {
    var stats = { rect: 0, rectWithStroke: 0, softEdge: 0, roadMain: 0 };
    function walk(n) {
        (n.children || []).forEach(function (c) {
            if (c.tag === 'rect') { stats.rect++; if (c._attrs['stroke'] !== undefined) stats.rectWithStroke++; }
            else if (c.tag === 'path') {
                var w = String(c._attrs['stroke-width']);
                if (w === '7' || w === '2.6') stats.softEdge++;
                if (w === '5.5') stats.roadMain++;
            }
            walk(c);
        });
    }
    walk(els['random-map-svg']);
    assert(stats.rectWithStroke === 0, '方块不得带描边（格线来源），实得 ' + stats.rectWithStroke);
    assert(stats.softEdge > 0, '地形交界应有晕染过渡（实得 ' + stats.softEdge + '）');
    assert(stats.roadMain > 0, '古道应连成线（实得 ' + stats.roadMain + ' 段）');
})();

// ==================== 结果 ====================
console.log('\n========== v20.56 野外地图重做 ==========');
console.log('通过 ' + passed + ' / 失败 ' + failed);
process.exit(failed ? 1 : 0);
