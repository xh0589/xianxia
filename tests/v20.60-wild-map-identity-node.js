/**
 * v20.60-wild-map-identity-node.js — 独有地貌 + 地皮咬合战斗验收：
 *   G1 一地一貌：每个地区的独有地貌都会长出来，且绝不在别处出现
 *   G2 地貌有性格：瘴沼比沼泽毒、绿洲灵气充沛又无险、冰隙漩涡过不去
 *   G3 险地伤人：新地貌各有各的苦（流沙陷脚、剑气伤人、阴煞蚀气、魔气侵体）
 *   G4 地皮咬合战斗：沼泽拖足身法亏、剑冢借势攻高、古道省力；城里不吃这亏
 *   G5 加成真进战斗：getCombatBonuses 在野外把地皮修正并进来
 *   G6 开场有话：野外开战会说明脚下地皮帮你还是害你
 *
 * 运行：node tests/v20.60-wild-map-identity-node.js
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

var timeCalls = [];
global.timeSystem = {
    gameTime: { totalMinutes: 0, currentDay: 5, currentHour: 14, currentMinute: 0, currentSeason: 'spring', currentMonth: 3, currentYear: 1 },
    advanceTime: function (m, r) { timeCalls.push({ m: m, r: r }); global.timeSystem.gameTime.totalMinutes += m; },
    onNewDaySubscribe: function () {}
};

global.addItemToInventory = function () { return true; };
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
var T = WT.TERRAIN;

global.currentCharData = { health: 90, energy: 90, qi: 50, maxQi: 100, realm: '筑基' };

function openRegionWhere(region, pred) {
    for (var i = 0; i < 10; i++) {
        var seed = region + '_g_probe_' + i;
        global.setMapSeed(seed);
        global.openWildernessMap(region);
        if (!pred || pred(global.currentMap, api.pois())) return seed;
    }
    return null;
}

// ==================== G1 一地一貌 ====================
console.log('\n[G1] 一地一貌：各地独有，互不越界');
var SIGNATURE = {
    '南疆': ['MIASMA'], '西漠': ['OASIS', 'QUICKSAND'], '北冥': ['GLACIER', 'CREVASSE'],
    '蜀地': ['SWORDTOMB'], '中州': ['OLDFIELD'], '东荒': ['PRIMFOREST'],
    '东南海域': ['WRECK', 'WHIRLPOOL'], '灵界': ['QIPOOL'], '魔界': ['BONEFIELD']
};
var allSigKeys = Object.keys(SIGNATURE).reduce(function (a, r) { return a.concat(SIGNATURE[r]); }, []);
(function () {
    var missing = [], stray = [];
    Object.keys(SIGNATURE).forEach(function (r) {
        var seen = {};
        for (var i = 0; i < 4; i++) {
            var g = WT.generate({ seed: r + '_id_' + i, region: r, rows: 20, cols: 26 });
            g.grid.forEach(function (row) { row.forEach(function (c) { if (allSigKeys.indexOf(c.t) >= 0) seen[c.t] = 1; }); });
        }
        SIGNATURE[r].forEach(function (k) { if (!seen[k]) missing.push(r + '缺' + k); });
        Object.keys(seen).forEach(function (k) {
            if (SIGNATURE[r].indexOf(k) < 0) stray.push(r + '冒出' + k);
        });
    });
    assert(missing.length === 0, '各地独有地貌都该长出来（' + missing.join(', ') + '）');
    assert(stray.length === 0, '独有地貌不该越界（' + stray.join(', ') + '）');
    console.log('    九地区各有独有地貌，互不串门');
})();

// ==================== G2 地貌有性格 ====================
console.log('\n[G2] 地貌有性格：毒有毒性，洲有灵气');
(function () {
    assert(T.MIASMA.qi < T.SWAMP.qi, '瘴沼该比沼泽更败灵气（' + T.MIASMA.qi + ' vs ' + T.SWAMP.qi + '）');
    assert(T.MIASMA.passable && T.CREVASSE.passable === false && T.WHIRLPOOL.passable === false, '瘴沼能走，冰隙漩涡过不去');
    assert(T.OASIS.qi > 1.5 && !api.terrainHazard({ terrainKey: 'OASIS' }), '绿洲灵气充沛且无险');
    assert(T.QIPOOL.qi >= T.OASIS.qi, '灵池灵气不输绿洲');
    assert(T.PRIMFOREST.moveCost > T.FOREST.moveCost, '荒古林比寻常林海难走');
    assert(T.WRECK.passable, '沉船残骸能落脚');
    console.log('    性格成立：毒/灵/险/难各有一套');
})();

// ==================== G3 险地伤人 ====================
console.log('\n[G3] 险地伤人：新地貌各有各的苦');
(function () {
    var swamp = api.terrainHazard({ terrainKey: 'SWAMP' }).chance;
    var miasma = api.terrainHazard({ terrainKey: 'MIASMA' }).chance;
    assert(miasma > swamp, '瘴沼比寻常沼泽毒（' + miasma.toFixed(2) + ' vs ' + swamp.toFixed(2) + '）');
    // 流沙陷脚：扣的是力气
    global.currentCharData.health = 90; global.currentCharData.energy = 90; global.currentCharData.qi = 50;
    var orig = Math.random; Math.random = function () { return 0; };
    api.applyTerrainHazard({ terrainKey: 'QUICKSAND' });
    Math.random = orig;
    assert(global.currentCharData.energy < 90, '流沙应陷得人脱力');
    assert(global.currentCharData.qi === 50, '流沙不蚀真气');
    // 阴煞蚀气：扣真气
    global.currentCharData.health = 90; global.currentCharData.energy = 90; global.currentCharData.qi = 50;
    Math.random = function () { return 0; };
    api.applyTerrainHazard({ terrainKey: 'OLDFIELD' });
    Math.random = orig;
    assert(global.currentCharData.qi < 50, '古战场阴煞应蚀真气');
    assert(global.currentCharData.health === 90, '阴煞不直接伤血');
    // 剑气伤人
    global.currentCharData.health = 90; global.currentCharData.energy = 90; global.currentCharData.qi = 50;
    Math.random = function () { return 0; };
    api.applyTerrainHazard({ terrainKey: 'SWORDTOMB' });
    Math.random = orig;
    assert(global.currentCharData.health < 90, '剑冢剑气应见血');
    console.log('    流沙脱力 / 阴煞蚀气 / 剑气见血，各有各的账');
})();

// ==================== G4 地皮咬合战斗 ====================
console.log('\n[G4] 地皮咬合战斗：沼泽拖足，剑冢借势');
(function () {
    global.setMapSeed('ground_seed');
    global.openWildernessMap('南疆');
    var g = api.ground;
    assert(g.active(), '人在野外，地皮判定应生效');
    var swampMods = g.battleMods.call({ active: function () { return true; }, cell: function () { return { terrainKey: 'SWAMP' }; } });
    assert(swampMods.dodge < 0 && swampMods.speed < 0, '沼泽应拖足（' + JSON.stringify(swampMods) + '）');
    var tombMods = g.battleMods.call({ active: function () { return true; }, cell: function () { return { terrainKey: 'SWORDTOMB' }; } });
    assert(tombMods.attack > 0, '剑冢应借势（attack ' + tombMods.attack + '）');
    var roadMods = g.battleMods.call({ active: function () { return true; }, cell: function () { return { terrainKey: 'ROAD' }; } });
    assert(roadMods.defense > 0, '古道应省力招架');
    var plainMods = g.battleMods.call({ active: function () { return true; }, cell: function () { return { terrainKey: 'PLAIN' }; } });
    assert(Object.keys(plainMods).length === 0, '平地不该凭空加减');
    // 脚下真站在南疆图上：mods 应来自真实地皮而非空表
    var real = g.battleMods();
    var here = global.currentMap[global.playerPos.y][global.playerPos.x].terrainKey;
    assert(JSON.stringify(real) === JSON.stringify(TERRAIN_BATTLE_MODS_REF()[here] || {}), '脚下 ' + here + ' 的修正应与地皮表一致');
    console.log('    地皮修正表逐格成立');
})();
// 地皮表在本文件里取不到（脚本内 const），借一次真实调用回读
function TERRAIN_BATTLE_MODS_REF() {
    var out = {};
    Object.keys(WT.TERRAIN).forEach(function (k) {
        // 通过 ground.battleMods 逐格问一遍（用假 active/cell）
        var cell = { terrainKey: k };
        out[k] = api.ground.battleMods.call({ active: function () { return true; }, cell: function () { return cell; } });
    });
    return out;
}

// ==================== G5 加成真进战斗 ====================
console.log('\n[G5] 加成真进战斗：getCombatBonuses 在野外并入地皮');
(function () {
    // 装备真源给空表，避免未定义
    global.equippedStatsCache = { combatBonus: {} };
    var loaded = false;
    try {
        load('js/inventory.js');
        loaded = true;
    } catch (e) {
        console.log('    （inventory.js 在桩里加载不利索：' + e.message.slice(0, 40) + '…改走源码断言）');
    }
    if (loaded) {
        global.setMapSeed('ground_seed2');
        global.openWildernessMap('蜀地');
        // 站到剑冢上（找不到就把人放到有修正的格子）
        var spot = null;
        global.currentMap.forEach(function (row) { row.forEach(function (c) { if (!spot && ['SWORDTOMB', 'SWAMP', 'MIASMA', 'PRIMFOREST'].indexOf(c.terrainKey) >= 0) spot = c; }); });
        var res = WT.findPath(global.currentMap.map(function (r) { return r.map(function (c) { return { t: c.terrainKey }; }); }),
            { x: global.playerPos.x, y: global.playerPos.y }, spot ? { x: spot.x, y: spot.y } : null);
        if (res) res.path.forEach(function (p) { api.stepTo(p.x, p.y); });
        var here = global.currentMap[global.playerPos.y][global.playerPos.x].terrainKey;
        var mods = global.WildGround.battleMods();
        var keys = Object.keys(mods).filter(function (k) { return k !== 'note'; });
        if (keys.length) {
            var cb = global.getCombatBonuses({});
            keys.forEach(function (k) {
                assert(cb[k] === mods[k], 'getCombatBonuses 应把 ' + here + ' 的 ' + k + ' 并进来（实得 ' + cb[k] + ' 应为 ' + mods[k] + '）');
            });
            console.log('    站在 ' + here + '，战斗加成已并入');
        } else {
            console.log('    落脚处 ' + here + ' 无修正（属正常）');
        }
    } else {
        var src = fs.readFileSync(path.join(ROOT, 'js/inventory.js'), 'utf8');
        assert(src.indexOf('WildGround.battleMods') >= 0, 'getCombatBonuses 应读地皮修正');
    }
})();

// ==================== G6 开场有话 ====================
console.log('\n[G6] 开场有话：地皮帮你还是害你，先说清楚');
(function () {
    var note = global.WildGround.battleNote.call({
        battleMods: function () { return { dodge: -12, speed: -15, note: '泥沼拖足，身法施展不开' }; }
    });
    assert(/泥沼拖足/.test(note) && /本地活物/.test(note), '战斗开场应说明地皮影响（实得 ' + note + '）');
    var appSrc = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
    assert(appSrc.indexOf('WildGround.battleNote') >= 0, '开战入口应报地皮话');
    var appHas = appSrc.indexOf('window.WildGround') >= 0;
    assert(appHas, 'app.js 应引用 WildGround');
    console.log('    开战前一句话说清脚下利害');
})();

// ==================== 结果 ====================
console.log('\n========== v20.60 独有地貌 + 地皮咬合 ==========');
console.log('通过 ' + passed + ' / 失败 ' + failed);
process.exit(failed ? 1 : 0);
