/**
 * v20.58-wild-map-hazard-node.js — 野外环境之苦 + 采集细分验收：
 *   H1 环境之苦：险地每落一格结一次账，瘴气/寒气/暑渴真扣气血精力真气
 *   H2 险地有情有理：夜里更凶、雨天瘴气更毒、修为高者扛得住；无苦之地不伤人
 *   H3 采集细分：林泽出药草、山漠出矿苗、灵泉边捡灵机之物、平原也有稀疏药草
 *   H4 采之物皆真：节点产出的物品模板必须存在（真源就绪时筛掉空名目）
 *   H5 脚下有警示：站上险地侧栏应明说此地伤人；采集按钮按品类叫得出名字
 *
 * 运行：node tests/v20.58-wild-map-hazard-node.js
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

// ==================== 测试桩（与 v20.56/57 同源） ====================
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
    // innerHTML 访问器必须落在实例上——本桩返回独立字面量，不继承 fakeEl.prototype
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

// 按条件找图：加渡口之后同种子可能换一张山河，测试不该绑死某个种子
function openRegionWhere(region, pred) {
    for (var i = 0; i < 8; i++) {
        var seed = region + '_probe_' + i;
        global.setMapSeed(seed);
        global.openWildernessMap(region);
        if (pred(global.currentMap)) return seed;
    }
    return null;
}

function withRandom(seq, fn) {
    var orig = Math.random, i = 0;
    Math.random = function () { var v = seq[Math.min(i, seq.length - 1)]; i++; return v; };
    try { return fn(); } finally { Math.random = orig; }
}

// 玩家身板（凡人起步，好让概率看得清）
global.currentCharData = { health: 90, energy: 90, qi: 50, maxQi: 100, realm: '凡人' };
global.getRealmTier = function (realm) {
    var order = ['凡人', '炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'];
    return Math.max(0, order.indexOf(realm));
};

// ==================== H1 环境之苦 ====================
console.log('\n[H1] 环境之苦：险地真扣气血精力');
(function () {
    var cell = { terrainKey: 'SWAMP' };
    // 受控随机：概率判定用第一枚骰子（0 < chance 必中）
    var before = { hp: global.currentCharData.health, en: global.currentCharData.energy };
    msgs.length = 0;
    withRandom([0], function () { api.applyTerrainHazard(cell); });
    assert(global.currentCharData.health < before.hp, '沼泽瘴气应扣气血（' + before.hp + '→' + global.currentCharData.health + '）');
    assert(global.currentCharData.energy < before.en, '瘴气应扣精力');
    assert(msgs.some(function (m) { return /瘴气/.test(m.m); }), '中瘴应明说缘由');
    // 雪线寒气扣精力真气，不扣血
    global.currentCharData.health = 90; global.currentCharData.energy = 90; global.currentCharData.qi = 50;
    msgs.length = 0;
    withRandom([0], function () { api.applyTerrainHazard({ terrainKey: 'SNOW' }); });
    assert(global.currentCharData.energy < 90, '寒气应扣精力');
    assert(global.currentCharData.qi < 50, '寒气应冻得真气涣散');
    assert(global.currentCharData.health === 90, '寒气不该直接扣血');
    // 走一步就该结账：把人放在险地邻格再走过去
    var seed = openRegionWhere('南疆', function (M) {   // 南疆沼泽倾向最高
        return M.some(function (row, y) { return row.some(function (c, x) {
            if (c.terrainKey !== 'SWAMP') return false;
            return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(function (d) {
                var nb = M[y + d[1]] && M[y + d[1]][x + d[0]];
                return nb && WT.passable({ t: nb.terrainKey });
            });
        }); });
    });
    assert(!!seed, '南疆应能探出一张有沼泽的图');
    var MAP = global.currentMap;
    var spot = null;
    for (var y = 0; y < MAP.length && !spot; y++) {
        for (var x = 0; x < MAP[0].length; x++) {
            if (MAP[y][x].terrainKey !== 'SWAMP') continue;
            var d = [[1, 0], [-1, 0], [0, 1], [0, -1]];
            for (var i = 0; i < d.length; i++) {
                var ny = y + d[i][1], nx = x + d[i][0];
                var nb = MAP[ny] && MAP[ny][nx];
                if (nb && WT.passable({ t: nb.terrainKey })) { spot = { from: { x: nx, y: ny }, to: { x: x, y: y } }; break; }
            }
        }
    }
    assert(!!spot, '南疆图上应有可落脚的沼泽邻格');
    if (spot) {
        var stepRes = WT.findPath(MAP.map(function (r) { return r.map(function (c) { return { t: c.terrainKey }; }); }),
            { x: global.playerPos.x, y: global.playerPos.y }, spot.from);
        if (stepRes) stepRes.path.forEach(function (p) { api.stepTo(p.x, p.y); });
        var hp0 = global.currentCharData.health;
        var msgBefore = msgs.length;
        withRandom([0], function () { api.stepTo(spot.to.x, spot.to.y); });
        assert(global.playerPos.x === spot.to.x && global.playerPos.y === spot.to.y, '应已踏进沼泽');
        assert(global.currentCharData.health < hp0 || msgs.length > msgBefore, '踏进险地那一步应结环境账');
    }
    console.log('    瘴气/寒气真扣状态，落脚即结账');
})();

// ==================== H2 险地有情有理 ====================
console.log('\n[H2] 夜里更凶、高人无惧、坦途无苦');
(function () {
    // 凡人白天 vs 夜里
    global.currentCharData.realm = '凡人';
    global.timeSystem.gameTime.currentHour = 14;
    var day = api.terrainHazard({ terrainKey: 'SWAMP' }).chance;
    global.timeSystem.gameTime.currentHour = 23;
    var night = api.terrainHazard({ terrainKey: 'SWAMP' }).chance;
    global.timeSystem.gameTime.currentHour = 14;
    assert(night > day, '夜里瘴气应更凶（' + day.toFixed(3) + ' → ' + night.toFixed(3) + '）');
    // 修为高者扛得住
    global.currentCharData.realm = '渡劫';
    var master = api.terrainHazard({ terrainKey: 'SWAMP' }).chance;
    assert(master < day, '渡劫修士应比凡人扛得住（' + day.toFixed(3) + ' → ' + master.toFixed(3) + '）');
    assert(Math.abs(master - day * 0.46) < 1e-9, '渡劫应吃满六成减免（实得 ' + master.toFixed(4) + '）');
    global.currentCharData.realm = '凡人';
    // 坦途与灵泉无苦
    ['PLAIN', 'ROAD', 'SPRING', 'FOREST'].forEach(function (k) {
        assert(api.terrainHazard({ terrainKey: k }) === null, k + ' 不该凭空伤人');
    });
    console.log('    夜 ×1.5 / 渡劫 -60% / 平原古道灵泉无苦');
})();

// ==================== H3 采集细分 ====================
console.log('\n[H3] 采集细分：出什么跟地皮走');
(function () {
    openRegionWhere('北冥', function (M) {   // 北冥雪原多、灵泉多
        var kinds = {};
        M.forEach(function (row) { row.forEach(function (c) { if (c.node) kinds[c.node.kind] = 1; }); });
        return Object.keys(kinds).length >= 2;
    });
    var MAP = global.currentMap;
    var seen = {};
    MAP.forEach(function (row) { row.forEach(function (c) { if (c.node) (seen[c.node.kind + '@' + c.terrainKey] = seen[c.node.kind + '@' + c.terrainKey] || []).push(c.node); }); });
    var keys = Object.keys(seen);
    assert(keys.length >= 2, '一张图上该有不止一种采集（实得 ' + keys.join(', ') + '）');
    // 规则成立：林泽/雪原是药草、山是矿、灵泉是灵机之物
    var okRule = true;
    MAP.forEach(function (row) { row.forEach(function (c) {
        if (!c.node) return;
        var t = c.terrainKey, k = c.node.kind;
        if ((t === 'FOREST' || t === 'SWAMP' || t === 'SNOW' || t === 'FROZEN' || t === 'PLAIN' || t === 'WATER') && k !== 'herb') okRule = false;
        if ((t === 'MOUNTAIN' || t === 'DESERT' || t === 'VOLCANO') && k !== 'mine') okRule = false;
        if (t === 'SPRING' && k !== 'spirit') okRule = false;
    }); });
    assert(okRule, '节点品类应跟地皮对应');
    // 图标与按钮文案
    var spiritNode = null;
    MAP.forEach(function (row) { row.forEach(function (c) { if (c.node && c.node.kind === 'spirit' && !spiritNode) spiritNode = c; }); });
    if (spiritNode) assert(spiritNode.node.icon === '💠', '灵机之物的图标应是 💠');
    console.log('    节点品类 ' + keys.length + ' 类：' + keys.join(', '));
})();

// ==================== H4 采之物皆真 ====================
console.log('\n[H4] 采之物皆真：节点名目必须是真物品');
(function () {
    // 给个真源：只认这几件
    global.window.itemById = { mat_lingzhi: { id: 'mat_lingzhi' }, mat_iron_ore: { id: 'mat_iron_ore' }, mat_spirit_source: { id: 'mat_spirit_source' } };
    global.setMapSeed('realitem_seed');
    global.openWildernessMap('中州');
    var bad = [];
    global.currentMap.forEach(function (row) { row.forEach(function (c) {
        (c.node ? c.node.items : []).forEach(function (id) { if (!global.window.itemById[id]) bad.push(id); });
    }); });
    assert(bad.length === 0, '节点不应产出不存在的物品（实得 ' + bad.join(',') + '）');
    // 采集真能进包
    var target = null;
    for (var y = 0; y < global.currentMap.length && !target; y++) {
        for (var x = 0; x < global.currentMap[0].length; x++) {
            var c = global.currentMap[y][x];
            if (c.node && c.node.regrowDay <= 5 && c.fog > 0) { target = { x: x, y: y }; break; }
        }
    }
    if (target) {
        var res = WT.findPath(global.currentMap.map(function (r) { return r.map(function (c) { return { t: c.terrainKey }; }); }),
            { x: global.playerPos.x, y: global.playerPos.y }, target);
        if (res) res.path.forEach(function (p) { api.stepTo(p.x, p.y); });
        items.length = 0;
        api.gatherWildNode();
        var ghost = items.filter(function (it) { return !global.window.itemById[it.id]; });
        assert(items.length > 0 && ghost.length === 0, '采到的应全是真物品（实得 ' + items.map(function (i) { return i.id; }).join(',') + '）');
    }
    delete global.window.itemById;
    console.log('    空名目已被真源筛掉，采集件件入包');
})();

// ==================== H5 脚下有警示 ====================
console.log('\n[H5] 脚下有警示：险地明说伤人，按钮叫得出品类');
(function () {
    openRegionWhere('南疆', function (M) { return M.some(function (row) { return row.some(function (c) { return c.terrainKey === 'SWAMP'; }); }); });
    var MAP = global.currentMap;
    var swamp = null;
    for (var y = 0; y < MAP.length && !swamp; y++) for (var x = 0; x < MAP[0].length; x++) if (MAP[y][x].terrainKey === 'SWAMP') { swamp = { x: x, y: y }; break; }
    assert(!!swamp, '南疆应有沼泽');
    if (swamp) {
        var r = WT.findPath(MAP.map(function (rr) { return rr.map(function (c) { return { t: c.terrainKey }; }); }),
            { x: global.playerPos.x, y: global.playerPos.y }, swamp);
        if (r) r.path.forEach(function (p) { api.stepTo(p.x, p.y); });
        global.renderMap(els['random-map-svg'], MAP, 0, 0);
        assert(String(els['wild-tile-info']._html).indexOf('⚠️') >= 0, '站在沼泽上脚下应挂警示');
        assert(String(els['wild-tile-info']._html).indexOf('瘴气') >= 0, '警示应说明是瘴气');
    }
    // 按钮品类名
    var spiritCell = null, mineCell = null;
    MAP.forEach(function (row) { row.forEach(function (c) {
        if (c.node && c.node.regrowDay <= 5 && !spiritCell && c.node.kind === 'spirit') spiritCell = c;
        if (c.node && c.node.regrowDay <= 5 && !mineCell && c.node.kind === 'mine') mineCell = c;
    }); });
    var acts = api.tileActions({ terrainKey: 'SPRING', node: { kind: 'spirit', regrowDay: 0 } });
    assert(acts.length && /灵机之物/.test(acts[0].label), '灵机之物按钮应叫得出名（实得 ' + (acts[0] || {}).label + '）');
    var acts2 = api.tileActions({ terrainKey: 'MOUNTAIN', node: { kind: 'mine', regrowDay: 0 } });
    assert(acts2.length && /矿石/.test(acts2[0].label), '矿石按钮应叫得出名');
    console.log('    警示与品类名齐备');
})();

// ==================== 结果 ====================
console.log('\n========== v20.58 野外环境之苦 ==========');
console.log('通过 ' + passed + ' / 失败 ' + failed);
process.exit(failed ? 1 : 0);
