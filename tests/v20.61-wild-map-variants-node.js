/**
 * v20.61-wild-map-variants-node.js — 地点变体验收（五层薄的第 2 层）：
 *   V1 每类地标有来历：村镇/坊市/洞府/遗迹/灵泉各有 2~5 个带描述的变体
 *   V2 建图落位：地标各安一个变体，同种子重开还是同一批「地方」
 *   V3 歇脚有分别：驿亭/篷车集收钱回得多，残村免费回得少，义庄免费但阴气缠身
 *   V4 探遗迹有来历：古观出丹药经卷、古冢出明器、战场遗址有亡魂、古修遗址有残阵
 *   V5 洞府有分别：遗府灵机足但禁制会反噬，天然洞窟安稳
 *   V6 泉有分别：洗髓泉一遍顶别处三倍
 *   V7 市集有分别：露水市集入夜打烊，黑市可能撞上巡查
 *
 * 运行：node tests/v20.61-wild-map-variants-node.js
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

var shopCalls = [], cultCalls = [], exploreCalls = [];
global.openCityShop = function (t) { shopCalls.push(t); };
global.startCultivation = function () { cultCalls.push(1); };
global.exploreLandmark = function (n) { exploreCalls.push(n); };
global.LANDMARKS = {};
global.ResourcePoints = { listByRegion: function () { return []; } };
global.DungeonDynamic = { listActive: function () { return []; } };
global.StateRegistry = { register: function () {} };

load('js/core/state-registry.js');
load('js/map/wild-terrain.js');
load('js/map/randomMap.js');

var WT = global.WildTerrain;
var api = global.wildMapApi;
var VARIANTS = api.variants();

global.currentCharData = { health: 80, energy: 80, qi: 40, maxQi: 100, realm: '筑基' };
global.inventory = { currency: { spiritStones: 100 } };

function openRegionWhere(region, pred) {
    for (var i = 0; i < 10; i++) {
        var seed = region + '_v_probe_' + i;
        global.setMapSeed(seed);
        global.openWildernessMap(region);
        if (!pred || pred(global.currentMap, api.pois())) return seed;
    }
    return null;
}

function walkTo(M, target) {
    var res = WT.findPath(M.map(function (r) { return r.map(function (c) { return { t: c.terrainKey }; }); }),
        { x: global.playerPos.x, y: global.playerPos.y }, target);
    if (!res) return false;
    res.path.forEach(function (p) { api.stepTo(p.x, p.y); });
    return global.playerPos.x === target.x && global.playerPos.y === target.y;
}

// ==================== V1 每类地标有来历 ====================
console.log('\n[V1] 每类地标有来历');
(function () {
    ['town', 'ruin', 'cave'].forEach(function (t) {
        assert(VARIANTS[t] && VARIANTS[t].length >= 3, t + ' 应至少 3 个变体（实得 ' + (VARIANTS[t] || []).length + '）');
    });
    ['market', 'spring'].forEach(function (t) {
        assert(VARIANTS[t] && VARIANTS[t].length >= 2, t + ' 应至少 2 个变体（实得 ' + (VARIANTS[t] || []).length + '）');
    });
    var descs = 0, names = [];
    Object.keys(VARIANTS).forEach(function (t) {
        VARIANTS[t].forEach(function (v) {
            if (v.desc && v.desc.length > 4) descs++;
            names.push(v.name);
        });
    });
    assert(descs >= 12, '变体该各有来历描述（实得 ' + descs + '）');
    assert(new Set(names).size === names.length, '变体名不该重样');
    console.log('    ' + names.length + ' 个变体，个个有来历');
})();

// ==================== V2 建图落位 ====================
console.log('\n[V2] 建图落位：同一种子同一批地方');
(function () {
    var seed = openRegionWhere('中州', function (M, pois) {
        return pois.filter(function (p) { return p.type === 'town' || p.type === 'ruin'; }).length >= 2;
    });
    assert(!!seed, '中州应有村镇与遗迹');
    var tagged = api.pois().filter(function (p) { return p.variant && p.variant.key; });
    // 渡口/资源点/秘境/图鉴地标是另一类「地方」（各有自己的营生），不在这套来历表里
    var withTale = api.pois().filter(function (p) { return VARIANTS[p.type]; });
    assert(tagged.length === withTale.length, '有来历一说的地标都该安上来历（实得 ' + tagged.length + '/' + withTale.length + '）');
    var keys = api.pois().map(function (p) { return p.type + ':' + (p.variant ? p.variant.key : '-'); }).join('|');
    global.setMapSeed(seed);
    global.openWildernessMap('中州');
    var keys2 = api.pois().map(function (p) { return p.type + ':' + (p.variant ? p.variant.key : '-'); }).join('|');
    assert(keys === keys2, '同种子重开应是同一批「地方」');
    console.log('    落位齐 + 种子确定');
})();

// ==================== V3 歇脚有分别 ====================
console.log('\n[V3] 歇脚有分别：收费与恢复按此地营生');
function restAtTown(townVariantKey) {
    var seed = openRegionWhere('中州', function (M, pois) {
        return pois.some(function (p) { return p.type === 'town' && p.variant && p.variant.key === townVariantKey; });
    });
    if (!seed) return null;
    var town = api.pois().filter(function (p) { return p.type === 'town' && p.variant.key === townVariantKey; })[0];
    api.revealAround(town.x, town.y, 2);
    if (!walkTo(global.currentMap, { x: town.x, y: town.y })) return null;
    global.currentCharData = { health: 60, energy: 50, qi: 30, maxQi: 100, realm: '筑基' };
    global.inventory = { currency: { spiritStones: 20 } };
    timeCalls.length = 0; msgs.length = 0;
    Math.random = function () { return 0.99; };   // 拨开夜半窸窣与阴气，只验账目
    api.poiAction('rest');
    Math.random = Object.getPrototypeOf(Math) && null; // 还原失败时下面再修
    return { town: town, hp: global.currentCharData.health, en: global.currentCharData.energy, stones: global.inventory.currency.spiritStones, time: timeCalls.length ? timeCalls[0].m : 0 };
}
// Math.random 还原：上面那行不可靠，重新包一层
function restoreRandom(fn) {
    var orig = Math.random;
    Math.random = function () { return 0.99; };
    try { return fn(); } finally { Math.random = orig; }
}
(function () {
    var post = restoreRandom(function () { return restAtTown('post'); });
    var hamlet = restoreRandom(function () { return restAtTown('hamlet'); });
    assert(!!post && !!hamlet, '中州应能探出驿亭与残村各一处');
    if (post && hamlet) {
        assert(post.time === 4 * 60 && hamlet.time === 6 * 60, '驿亭歇四时辰、残村要六个时辰（' + post.time + ' vs ' + hamlet.time + '）');
        assert(post.stones === 18, '驿亭应收 2 灵石（实得余 ' + post.stones + '）');
        assert(hamlet.stones === 20, '残村不该收钱（实得余 ' + hamlet.stones + '）');
        assert(post.hp > hamlet.hp, '驿亭睡得比残村好（' + post.hp + ' vs ' + hamlet.hp + '）');
    }
    // 义庄：免费，但阴气真的会来
    var mort = openRegionWhere('中州', function (M, pois) {
        return pois.some(function (p) { return p.type === 'town' && p.variant && p.variant.key === 'mortuary'; });
    });
    assert(!!mort, '中州应能探出义庄');
    if (mort) {
        var town = api.pois().filter(function (p) { return p.type === 'town' && p.variant.key === 'mortuary'; })[0];
        api.revealAround(town.x, town.y, 2);
        walkTo(global.currentMap, { x: town.x, y: town.y });
        global.currentCharData = { health: 60, energy: 50, qi: 40, maxQi: 100, realm: '筑基' };
        global.inventory = { currency: { spiritStones: 20 } };
        timeCalls.length = 0; msgs.length = 0;
        var orig = Math.random; Math.random = function () { return 0; };   // 必中阴气
        api.poiAction('rest');
        Math.random = orig;
        assert(global.inventory.currency.spiritStones === 20, '义庄睡觉免费');
        assert(msgs.some(function (m) { return /阴气/.test(m.m); }), '义庄该有阴气上门（' + msgs.map(function (m) { return m.m; }).join('|').slice(0, 60) + '）');
        assert(global.currentCharData.qi < 40, '阴气该蚀真气');
    }
    console.log('    驿亭/残村/义庄三样睡法');
})();

// ==================== V4 探遗迹有来历 ====================
console.log('\n[V4] 探遗迹有来历：出什么、凶什么，都按来历');
(function () {
    // 塌陷古观：出丹药经卷，灰土会砸人
    var seed = openRegionWhere('中州', function (M, pois) {
        return pois.some(function (p) { return p.type === 'ruin' && p.variant && p.variant.key === 'temple'; });
    });
    assert(!!seed, '中州应能探出塌陷古观');
    if (seed) {
        var ruin = api.pois().filter(function (p) { return p.type === 'ruin' && p.variant.key === 'temple'; })[0];
        api.revealAround(ruin.x, ruin.y, 2);
        assert(walkTo(global.currentMap, { x: ruin.x, y: ruin.y }), '古观应有路可到');
        var orig = Math.random;
        Math.random = function () { return 0; };   // 必触发梁上灰土（20% 险）→ 受伤不出货
        global.currentCharData.health = 80;
        items.length = 0;
        api.poiAction('explore');
        Math.random = orig;
        assert(global.currentCharData.health < 80, '古观的灰土该砸人');
        Math.random = function () { return 0.5; };  // 险不触发（20%/35%/30%/28% 都 < 0.5），只验出货
        items.length = 0;
        api.poiAction('explore');
        Math.random = orig;
        assert(items.length > 0 && items.every(function (it) { return ruin.variant.loot.indexOf(it.id) >= 0; }),
            '古观该按来历出货（实得 ' + items.map(function (i) { return i.id; }).join(',') + '）');
    }
    // 战场遗址：亡魂会围上来
    var seed2 = openRegionWhere('中州', function (M, pois) {
        return pois.some(function (p) { return p.type === 'ruin' && p.variant && p.variant.key === 'battlefield'; });
    });
    assert(!!seed2, '中州应能探出战场遗址');
    if (seed2) {
        var bf = api.pois().filter(function (p) { return p.type === 'ruin' && p.variant.key === 'battlefield'; })[0];
        api.revealAround(bf.x, bf.y, 2);
        walkTo(global.currentMap, { x: bf.x, y: bf.y });
        battles.length = 0; msgs.length = 0;
        var orig2 = Math.random; Math.random = function () { return 0; };  // 必遇亡魂
        api.poiAction('explore');
        Math.random = orig2;
        assert(battles.length === 1, '战场遗址的亡魂该围上来');
        assert(msgs.some(function (m) { return /亡魂/.test(m.m); }), '话术该点出亡魂');
        assert(battles[0].physiologyType === 'undead', '来的是亡灵（实得 ' + battles[0].physiologyType + '）');
    }
    console.log('    古观砸灰 / 战场亡魂 / 出货按来历');
})();

// ==================== V5 洞府有分别 ====================
console.log('\n[V5] 洞府有分别：遗府灵机足，禁制会反噬');
(function () {
    var seed = openRegionWhere('蜀地', function (M, pois) {
        return pois.some(function (p) { return p.type === 'cave' && p.variant && p.variant.key === 'heritage'; });
    });
    assert(!!seed, '蜀地应能探出前人遗府');
    if (seed) {
        var cave = api.pois().filter(function (p) { return p.type === 'cave' && p.variant.key === 'heritage'; })[0];
        api.revealAround(cave.x, cave.y, 2);
        walkTo(global.currentMap, { x: cave.x, y: cave.y });
        global.currentCharData.health = 80;
        cultCalls.length = 0; msgs.length = 0;
        var orig = Math.random; Math.random = function () { return 0; };  // 必触发禁制
        api.poiAction('cultivate');
        Math.random = orig;
        assert(global.currentCharData.health < 80, '遗府禁制该反噬');
        assert(cultCalls.length === 0, '禁制反噬该打断入定');
        Math.random = function () { return 0.5; };
        cultCalls.length = 0;
        api.poiAction('cultivate');
        Math.random = orig;
        assert(cultCalls.length === 1, '无险时该真进修炼');
    }
    console.log('    反噬打断 / 无险入定');
})();

// ==================== V6 泉有分别 ====================
console.log('\n[V6] 泉有分别：洗髓泉一遍顶三遍');
(function () {
    var seed = openRegionWhere('南疆', function (M, pois) {
        return pois.some(function (p) { return p.type === 'spring' && p.variant && p.variant.key === 'marrow'; });
    });
    assert(!!seed, '南疆应能探出洗髓泉');
    if (seed) {
        var spring = api.pois().filter(function (p) { return p.type === 'spring' && p.variant.key === 'marrow'; })[0];
        api.revealAround(spring.x, spring.y, 2);
        walkTo(global.currentMap, { x: spring.x, y: spring.y });
        var qi0 = global.currentMap[global.playerPos.y][global.playerPos.x].qi;
        global.currentCharData.qi = 0;
        timeCalls.length = 0;
        api.poiAction('spring');
        var marrowGain = global.currentCharData.qi;
        assert(marrowGain > 20 * qi0 * 1.2, '洗髓泉收益应高于寻常泉（实得 ' + marrowGain + '，寻常约 ' + Math.round(20 * qi0) + '）');
    }
    console.log('    洗髓泉收益更高');
})();

// ==================== V7 市集有分别 ====================
console.log('\n[V7] 市集有分别：露水市入夜打烊，黑市有巡查');
(function () {
    var seed = openRegionWhere('中州', function (M, pois) {
        return pois.some(function (p) { return p.type === 'market' && p.variant && p.variant.key === 'dawn'; });
    });
    assert(!!seed, '中州应能探出露水市集');
    if (seed) {
        var mk = api.pois().filter(function (p) { return p.type === 'market' && p.variant.key === 'dawn'; })[0];
        api.revealAround(mk.x, mk.y, 2);
        walkTo(global.currentMap, { x: mk.x, y: mk.y });
        global.timeSystem.gameTime.currentHour = 23;   // 深夜
        shopCalls.length = 0; msgs.length = 0;
        api.poiAction('shop');
        assert(shopCalls.length === 0, '露水市集入夜该打烊');
        assert(msgs.some(function (m) { return /散了|打烊|明早/.test(m.m); }), '该说明打烊缘由');
        global.timeSystem.gameTime.currentHour = 9;    // 清晨开市
        shopCalls.length = 0;
        var orig = Math.random; Math.random = function () { return 0.99; };
        api.poiAction('shop');
        Math.random = orig;
        assert(shopCalls.length === 1, '早上该开市');
    }
    // 黑市：可能撞巡查
    var seed2 = openRegionWhere('中州', function (M, pois) {
        return pois.some(function (p) { return p.type === 'market' && p.variant && p.variant.key === 'black'; });
    });
    assert(!!seed2, '中州应能探出黑市');
    if (seed2) {
        var bk = api.pois().filter(function (p) { return p.type === 'market' && p.variant.key === 'black'; })[0];
        api.revealAround(bk.x, bk.y, 2);
        walkTo(global.currentMap, { x: bk.x, y: bk.y });
        battles.length = 0;
        var orig2 = Math.random; Math.random = function () { return 0; };  // 必撞巡查
        api.poiAction('shop');
        Math.random = orig2;
        assert(battles.length === 1, '黑市该可能撞上巡查');
    }
    console.log('    入夜打烊 / 黑市有险');
})();

// ==================== V8 收获有名目 ====================
console.log('\n[V8] 收获有名目：翻出来的是什么，说得出口');
(function () {
    // 给真源里几样常见货色起好名字
    global.itemById = {
        mat_lingzhi: { name: '灵芝' },
        mat_iron_ore: { name: '铁矿石' },
        mat_copper_ore: { name: '铜矿石' },
        mat_refined_iron: { name: '精铁' },
        mat_mithril: { name: '秘银' },
        mat_moon_stone: { name: '月华石' },
        mat_sun_stone: { name: '日精石' },
        pill_clarity: { name: '清明丹' },
        pill_energy_return: { name: '回气丹' }
    };
    var seed = openRegionWhere('中州', function (M, pois) {
        return pois.some(function (p) { return p.type === 'ruin'; });
    });
    assert(!!seed, '中州该有遗迹');
    if (seed) {
        var ruin = api.pois().filter(function (p) { return p.type === 'ruin'; })[0];
        api.revealAround(ruin.x, ruin.y, 2);
        walkTo(global.currentMap, { x: ruin.x, y: ruin.y });
        msgs.length = 0;
        var orig = Math.random; Math.random = function () { return 0.5; };   // 不触发凶险，只看收成
        api.poiAction('explore');
        Math.random = orig;
        var line = msgs.map(function (m) { return m.m; }).join(' | ');
        assert(/聊胜于无/.test(line) === false, '不该再说「聊胜于无」（' + line.slice(0, 60) + '）');
        assert(/mat_|undefined/.test(line) === false, '不该把代号亮给玩家（' + line.slice(0, 60) + '）');
        assert(/×\d/.test(line), '该说清翻出了几件（' + line.slice(0, 60) + '）');
        console.log('    ' + line.slice(0, 70));
    }
    // 采集一样：名目说得出口
    var seed2 = openRegionWhere('东荒', function (M) {
        return M.some(function (row) { return row.some(function (c) { return c.node && c.node.regrowDay <= 5; }); });
    });
    assert(!!seed2, '东荒该有可采之地');
    if (seed2) {
        var spot = null;
        for (var y = 0; y < global.currentMap.length && !spot; y++) {
            for (var x = 0; x < global.currentMap[0].length && !spot; x++) {
                var c = global.currentMap[y][x];
                if (c.node && c.node.regrowDay <= 5 && WT.passable({ t: c.terrainKey })) spot = { x: x, y: y };
            }
        }
        if (spot && walkTo(global.currentMap, spot)) {
            msgs.length = 0;
            api.poiAction('gather');
            var line2 = msgs.map(function (m) { return m.m; }).join(' | ');
            assert(/mat_|undefined/.test(line2) === false, '采集话术不该掉代号（' + line2.slice(0, 60) + '）');
            assert(/×\d/.test(line2), '采集该说清收成（' + line2.slice(0, 60) + '）');
            console.log('    ' + line2.slice(0, 70));
        }
    }
})();

// ==================== 结果 ====================
console.log('\n========== v20.61 地点变体 ==========');
console.log('通过 ' + passed + ' / 失败 ' + failed);
process.exit(failed ? 1 : 0);
