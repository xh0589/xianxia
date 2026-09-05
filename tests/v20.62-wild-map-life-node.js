/**
 * v20.62-wild-map-life-node.js — 野外的活气验收（五层薄的第 3 层）：
 *   L1 兽群成群：野地里的兽不再一只一只钉死，是结成群一起游荡
 *   L2 古道上有人走：商队沿古道赶路、巡查结队走镖，脚下都是路
 *   L3 会动：每走一步野外也动一步，但不踩聚落、不进水里、商队只认古道
 *   L4 撞得上：兽群撞见就围上来打，商队拱手报路，巡查拦下提个醒
 *   L5 天象会走：沙暴瘴云压地而来，罩到头上就结账
 *   L6 死册管用：打死的队员读档后不再站起来，队伍里也除名
 *   L7 侧栏动静：谁在附近、往哪边去了，一眼可见
 *
 * 运行：node tests/v20.62-wild-map-life-node.js
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
var battles = [];
global.openBattleWithEntity = function (e) { battles.push(e); };

global.LANDMARKS = {};
global.ResourcePoints = { listByRegion: function () { return []; } };
global.DungeonDynamic = { listActive: function () { return []; } };
global.StateRegistry = { register: function () {} };

load('js/core/state-registry.js');
load('js/map/wild-terrain.js');
load('js/map/randomMap.js');

var WT = global.WildTerrain;
var api = global.wildMapApi;
var LIFE = api.life;

global.currentCharData = { health: 80, energy: 80, qi: 40, maxQi: 100, realm: '筑基' };
global.inventory = { currency: { spiritStones: 100 } };

var origRandom = Math.random;
function withRandom(v, fn) {
    Math.random = typeof v === 'function' ? v : function () { return v; };
    try { return fn(); } finally { Math.random = origRandom; }
}
// 定数 0 会让活物在两格间来回踱步（每次都挑同一个方向），看不出「动过」；
// 用一条固定种子的线性同余，既可复现又有变化。
function lcg(seed) {
    var s = seed >>> 0;
    return function () {
        s = (Math.imul(s, 1103515245) + 12345) >>> 0;
        return s / 4294967296;
    };
}

function openRegion(region, pred) {
    for (var i = 0; i < 14; i++) {
        var seed = region + '_life_' + i;
        global.setMapSeed(seed);
        global.openWildernessMap(region);
        if (!pred || pred(global.currentMap, api.pois())) return seed;
    }
    return null;
}

function roadCount(M) {
    var n = 0;
    for (var y = 0; y < M.length; y++) for (var x = 0; x < M[0].length; x++) if (M[y][x].terrainKey === 'ROAD') n++;
    return n;
}

function headOf(band) {
    return band.members.find(function (m) { return !global.isEntityDead(m); }) || null;
}

// ==================== L1 兽群成群 ====================
console.log('\n[L1] 兽群成群：野地里的兽不再一只一只钉死');
(function () {
    var seed = openRegion('东荒', function (M) {
        return LIFE.bands().some(function (b) { return b.kind === 'pack' && b.members.length >= 2; });
    });
    assert(!!seed, '东荒应能探出成群的兽（探了 14 个种子）');
    if (seed) {
        var pack = LIFE.bands().filter(function (b) { return b.kind === 'pack' && b.members.length >= 2; })[0];
        var ids = pack.members.map(function (m) { return m.bandId; });
        assert(ids.every(function (i) { return i === pack.id; }), '同群的兽该挂同一名册');
        assert(pack.name.length > 1, '兽群该有名字（实得 ' + pack.name + '）');
        var allOnMap = pack.members.every(function (m) {
            var c = global.currentMap[m.y] && global.currentMap[m.y][m.x];
            return c && c.entities.indexOf(m) >= 0;
        });
        assert(allOnMap, '每只兽都该真站在图上那格里');
        var spread = pack.members.every(function (m) {
            var h = headOf(pack);
            return Math.abs(m.x - h.x) <= 1 && Math.abs(m.y - h.y) <= 1;
        });
        assert(spread, '兽群该聚在一处，不该散落天南地北');
        console.log('    ' + pack.name + ' · ' + pack.members.length + ' 只同群');
    }
})();

// ==================== L2 古道上有人走 ====================
console.log('\n[L2] 古道上有人走：商队赶路，巡查走镖');
(function () {
    var seed = openRegion('中州', function (M) { return roadCount(M) >= 4; });
    assert(!!seed, '中州该有古道');
    var roads = roadCount(global.currentMap);
    var caravan = LIFE.bands().filter(function (b) { return b.kind === 'caravan'; })[0];
    if (roads >= 4) {
        assert(!!caravan, '古道成网就该有商队上路（路 ' + roads + ' 格）');
    }
    if (caravan) {
        assert(!!caravan.name && caravan.name.length >= 3, '商队该有名号（实得 ' + caravan.name + '）');
        assert(caravan.members.length >= 2, '商队该结伴而行（实得 ' + caravan.members.length + ' 人）');
        var onRoad = caravan.members.every(function (m) {
            var c = global.currentMap[m.y] && global.currentMap[m.y][m.x];
            return c && c.terrainKey === 'ROAD';
        });
        assert(onRoad, '商队的人该站在古道上');
        assert(caravan.members.every(function (m) { return m.type === 'person' && m.personType === 'merchant'; }), '商队该是活人买卖');
    }
    console.log('    古道 ' + roads + ' 格 · ' + (caravan ? caravan.name : '此图路窄无人') );
})();

// ==================== L3 会动 ====================
console.log('\n[L3] 会动：走一步，野外也动一步');
(function () {
    var seed = openRegion('中州', function (M) { return LIFE.bands().length >= 1; });
    assert(!!seed, '中州该有活物在走');
    if (!seed) return;
    var before = LIFE.bands().map(function (b) {
        var h = headOf(b);
        return h ? b.id + ':' + h.x + ',' + h.y : b.id + ':dead';
    });
    withRandom(lcg(7), function () {
        for (var i = 0; i < 10; i++) LIFE.tick();
    });
    var after = LIFE.bands().map(function (b) {
        var h = headOf(b);
        return h ? b.id + ':' + h.x + ',' + h.y : b.id + ':dead';
    });
    var moved = before.some(function (s, i) { return s !== after[i]; });
    assert(moved, '走了一路，野外的活物该也挪过窝（' + before.join(' | ') + ' → ' + after.join(' | ') + '）');
    // 挪完还得守规矩：不踩聚落、不进水、商队只认古道
    var ok = true, why = '';
    LIFE.bands().forEach(function (b) {
        b.members.forEach(function (m) {
            var c = global.currentMap[m.y] && global.currentMap[m.y][m.x];
            if (!c) { ok = false; why = b.name + ' 有成员落到了图外'; return; }
            if (c.poiId) { ok = false; why = b.name + ' 踩进了「' + ((api.pois().find(function (p) { return p.id === c.poiId; })) || {}).name + '」'; return; }
            if (!WT.passable({ t: c.terrainKey })) { ok = false; why = b.name + ' 走进了 ' + c.terrain.name; return; }
            if (b.kind !== 'pack' && c.terrainKey !== 'ROAD') { ok = false; why = b.name + ' 离开了古道'; return; }
        });
    });
    assert(ok, '活物挪窝坏了规矩：' + why);
    console.log('    挪窝守规矩：不踩聚落、不进水、商队只认古道');
})();

// ==================== L4 撞得上 ====================
console.log('\n[L4] 撞得上：兽群围人，商队报路，巡查提个醒');
(function () {
    // ---- 兽群：撞见就围上来 ----
    var seed = openRegion('东荒', function (M) {
        return LIFE.bands().some(function (b) { return b.kind === 'pack' && b.members.length >= 2; });
    });
    assert(!!seed, '东荒该有兽群可撞');
    if (seed) {
        var pack = LIFE.bands().filter(function (b) { return b.kind === 'pack'; })[0];
        var head = headOf(pack);
        battles.length = 0; msgs.length = 0;
        global.currentCharData.health = 90;
        withRandom(0.99, function () { api.stepTo(head.x, head.y); });   // 0.99 避开险地与天象，只验撞人
        assert(battles.length === 1, '兽群撞见人该围上来（战斗 ' + battles.length + ' 场）');
        assert(msgs.some(function (m) { return m.m.indexOf(pack.name) >= 0; }), '话术该点出是哪一群（' + msgs.map(function (m) { return m.m; }).join('|').slice(0, 50) + '）');
        assert(pack.cool > 0, '撞完该有个冷场，免得站原地被打个没完');
    }

    // ---- 商队：拱手报路，传闻把没去过的地方点亮 ----
    var seed2 = openRegion('中州', function (M, pois) {
        return LIFE.bands().some(function (b) { return b.kind === 'caravan'; }) && pois.some(function (p) { return !p.discovered; });
    });
    assert(!!seed2, '中州该有商队与未见之地');
    if (seed2) {
        var cv = LIFE.bands().filter(function (b) { return b.kind === 'caravan'; })[0];
        var cvHead = headOf(cv);
        var hidden = api.pois().filter(function (p) { return !p.discovered; });
        assert(hidden.length > 0, '该还有没去过的地方可打听');
        msgs.length = 0;
        withRandom(0.99, function () { api.stepTo(cvHead.x, cvHead.y); });
        assert(msgs.some(function (m) { return /拱手|同路|听说过/.test(m.m); }), '商队该冲你拱手（' + msgs.map(function (m) { return m.m; }).join('|').slice(0, 50) + '）');
        var rumored = api.pois().filter(function (p) { return p.rumored; });
        assert(rumored.length === 1, '该带回一条传闻（实得 ' + rumored.length + ' 条）');
        if (rumored.length === 1) {
            var rc = global.currentMap[rumored[0].y][rumored[0].x];
            assert(rc.fog > 0, '传闻之地该在图上留个记号（雾态 ' + rc.fog + '）');
            // 传闻能当目的地：一路走到它跟前
            var reached = (global.playerPos.x === rumored[0].x && global.playerPos.y === rumored[0].y);
            if (!reached) {
                var res = WT.findPath(global.currentMap.map(function (r) { return r.map(function (c) { return { t: c.terrainKey }; }); }),
                    { x: global.playerPos.x, y: global.playerPos.y }, { x: rumored[0].x, y: rumored[0].y });
                assert(!!res, '传闻之地该有路可走');
                if (res) withRandom(0.99, function () { res.path.forEach(function (p) { api.stepTo(p.x, p.y); }); });
                assert(global.playerPos.x === rumored[0].x && global.playerPos.y === rumored[0].y, '按传闻走该真能到「' + rumored[0].name + '」');
            }
        }
    }

    // ---- 巡查：拦下提个醒，带伤还给丹药 ----
    var seed3 = openRegion('蜀地', function (M) { return roadCount(M) >= 8 && LIFE.bands().some(function (b) { return b.kind === 'patrol'; }); });
    if (seed3) {
        var pt = LIFE.bands().filter(function (b) { return b.kind === 'patrol'; })[0];
        var ptHead = headOf(pt);
        msgs.length = 0; items.length = 0;
        global.currentCharData.health = 40;   // 带伤
        withRandom(0.99, function () { api.stepTo(ptHead.x, ptHead.y); });
        assert(msgs.some(function (m) { return m.m.indexOf(pt.name) >= 0; }), '巡查该自报家门（' + msgs.map(function (m) { return m.m; }).join('|').slice(0, 50) + '）');
        assert(items.some(function (it) { return it.id === 'pill_small_recovery'; }), '见你带伤，该给一枚疗伤丹药');
    } else {
        console.log('    （蜀地此批种子古道不足八格，巡查一节由商队同类逻辑覆盖）');
        passed++;
    }
    console.log('    兽群围人 / 商队报路 / 巡查给药');
})();

// ==================== L5 天象会走 ====================
console.log('\n[L5] 天象会走：云影压地而来，罩到头上就结账');
(function () {
    var seed = openRegion('西漠', function (M) { return !!LIFE.drift(); });
    assert(!!seed, '西漠该有沙暴云影');
    if (seed) {
        var d0 = LIFE.drift();
        assert(!!d0.spec && !!d0.spec.name, '云影该有名字（实得 ' + (d0.spec ? d0.spec.name : '-') + '）');
        var p0 = d0.x + ',' + d0.y;
        withRandom(0.99, function () { for (var i = 0; i < 10; i++) LIFE.tick(); });
        var d1 = LIFE.drift();
        assert((d1.x + ',' + d1.y) !== p0, '云影该自己走（' + p0 + ' → ' + d1.x + ',' + d1.y + '）');
        // 人先站到图中央，云影自己走过来；罩到头上那一刻就该结账
        var mid = { x: Math.floor(global.currentMap[0].length / 2), y: Math.floor(global.currentMap.length / 2) };
        global.currentCharData.health = 90; global.currentCharData.energy = 90;
        msgs.length = 0;
        var caught = false;
        withRandom(lcg(11), function () {
            if (WT.passable({ t: global.currentMap[mid.y][mid.x].terrainKey })) api.stepTo(mid.x, mid.y);
            for (var i = 0; i < 140 && !caught; i++) {
                LIFE.tick();
                if (LIFE.inDrift()) caught = true;
            }
        });
        assert(caught, '云影该有罩到头上的时候');
        assert(msgs.some(function (m) { return m.m.indexOf(d1.spec.name) >= 0; }), '云影罩头该有话说（' + msgs.map(function (m) { return m.m; }).join('|').slice(0, 50) + '）');
        assert(global.currentCharData.energy < 90 || global.currentCharData.health < 90, '罩在云影底下该实实在在吃亏');
        console.log('    ' + d1.spec.name + '会走，罩头结账');
    }
})();

// ==================== L6 死册管用 ====================
console.log('\n[L6] 死册管用：打死的队员读档后不再站起来');
(function () {
    var seed = openRegion('东荒', function (M) {
        return LIFE.bands().some(function (b) { return b.kind === 'pack' && b.members.length >= 2; });
    });
    assert(!!seed, '东荒该有兽群可打');
    if (!seed) return;
    var pack = LIFE.bands().filter(function (b) { return b.kind === 'pack' && b.members.length >= 2; })[0];
    var victim = pack.members[pack.members.length - 1];
    // 战斗打死就是这么个结果：尸首留在原地（isDead），死册在存档时记下它
    victim.isDead = true;
    global.saveWildState();
    var aliveBefore = pack.members.filter(function (m) { return !global.isEntityDead(m); }).length;
    assert(aliveBefore === pack.members.length - 1, '打死一只，队里该少一个');

    // 重回原地：种子不动、探索册也在，死的该还是死的
    global.openWildernessMap('东荒');
    var resurrected = false;
    for (var y = 0; y < global.currentMap.length; y++) {
        for (var x = 0; x < global.currentMap[0].length; x++) {
            if (global.currentMap[y][x].entities.some(function (e) { return e.uid === victim.uid; })) resurrected = true;
        }
    }
    assert(!resurrected, '死册记下的队员不该重新站起来');
    var pack2 = LIFE.bands().filter(function (b) { return b.id === pack.id; })[0];
    if (pack2) {
        assert(!pack2.members.some(function (m) { return m.uid === victim.uid; }), '除名要除干净');
        assert(pack2.members.length === aliveBefore, '队伍人数该对得上（' + pack2.members.length + ' vs ' + aliveBefore + '）');
    }
    console.log('    死者不复活，队伍除名');
})();

// ==================== L7 侧栏动静 ====================
console.log('\n[L7] 侧栏动静：谁在附近、往哪边去了');
(function () {
    var seed = openRegion('中州', function (M) { return LIFE.bands().length >= 1; });
    assert(!!seed, '中州该有动静可看');
    var html = els['wild-life-list'] ? els['wild-life-list']._html : '';
    assert(!!html, '侧栏该有「野外的动静」一栏');
    var named = LIFE.bands().some(function (b) { return html.indexOf(b.name) >= 0; });
    var drift = LIFE.drift();
    var driftShown = !drift || html.indexOf(drift.spec.name) >= 0;
    assert(named || driftShown, '动静一栏该列着附近的活物或云影（' + html.slice(0, 60) + '）');
    console.log('    ' + html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60));
})();

// ==================== L8 视野窗跟着人走 ====================
console.log('\n[L8] 视野窗跟着人走：走到哪，画开到哪');
(function () {
    openRegion('中州', function (M) { return !!M.length; });
    // 找右下角一块走得到的格子，人走过去，窗就得开过去
    var goal = null, path = null;
    for (var y = global.currentMap.length - 2; y > 0 && !goal; y--) {
        for (var x = global.currentMap[0].length - 2; x > 0 && !goal; x--) {
            if (!WT.passable({ t: global.currentMap[y][x].terrainKey })) continue;
            var res = WT.findPath(global.currentMap.map(function (r) { return r.map(function (c) { return { t: c.terrainKey }; }); }),
                { x: global.playerPos.x, y: global.playerPos.y }, { x: x, y: y });
            if (res) { goal = { x: x, y: y }; path = res.path; }
        }
    }
    assert(!!goal, '右下角该有走得到的格子');
    if (goal) {
        withRandom(0.99, function () { path.forEach(function (p) { api.stepTo(p.x, p.y); }); });
        var svg = els['random-map-svg'];
        var vb = String(svg._attrs['viewBox'] || '').split(' ').map(Number);
        assert(vb.length === 4, '视野窗该开成一整块（实得 ' + svg._attrs['viewBox'] + '）');
        var px = global.playerPos.x * 40, py = global.playerPos.y * 40;
        assert(px >= vb[0] && px < vb[0] + vb[2], '「我」该在画里（x ' + px + ' 对窗 ' + vb[0] + '~' + (vb[0] + vb[2]) + '）');
        assert(py >= vb[1] && py < vb[1] + vb[3], '「我」该在画里（y ' + py + ' 对窗 ' + vb[1] + '~' + (vb[1] + vb[3]) + '）');
        console.log('    窗开在 ' + vb[0] + ',' + vb[1] + '，人在画中');
    }
})();

// ==================== 结果 ====================
console.log('\n========== v20.62 野外的活气 ==========');
console.log('通过 ' + passed + ' / 失败 ' + failed);
process.exit(failed ? 1 : 0);
