/**
 * v20.89-ley-line-node.js — 灵脉强怪区验收：
 *   L1 落脉有理：脉眼扎在灵气前 10% 的高地，离出生点与地标够远，一图至多三眼
 *   L2 灵脉养强敌：脉上活物密度更高、等级压着玩家境界走，人形挂精英/魔头名号，妖兽淬体改名
 *   L3 遭遇更凶：灵脉地上遭遇率随灵蕴抬升，来的是精英/魔头或淬体妖兽，报「灵气激荡」
 *   L4 战备透传：携带物/战斗技能/生理类型/伤害类型随实体进场——搜刮不再永远空手
 *   L5 初见有播报：灵脉之眼每域只报一次，账随存档走
 *
 * 运行：node tests/v20.89-ley-line-node.js
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

// ==================== 测试桩（野外地图桩 v20.58 + 战斗桩 v20.64 合流） ====================
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
        querySelector: function () { return null; },
        querySelectorAll: function () { return []; },
        _classes: [],
        classList: {
            add: function () {}, remove: function () {}, toggle: function () {},
            contains: function (c) { return el._classes.indexOf(c) >= 0; }
        },
        _html: '',
        textContent: '',
        options: []
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
global.window.alert = function () {};

global.timeSystem = {
    gameTime: { totalMinutes: 0, currentDay: 5, currentHour: 14, currentMinute: 0, currentSeason: 'spring', currentMonth: 3, currentYear: 1 },
    advanceTime: function (m) { this.gameTime.totalMinutes += m; },
    onNewDaySubscribe: function () {}
};

global.addItemToInventory = function () { return true; };
global.updateCharacterStatus = function () {};
global.updateCurrencyUI = function () {};
global.updatePartyUI = function () {};
global.updateBattleUI = function () {};
global.getEffectiveMax = function () { return 100; };
global.exploreLandmark = function () {};
global.LANDMARKS = {};
global.ResourcePoints = { listByRegion: function () { return []; } };
global.DungeonDynamic = { listActive: function () { return []; } };

// 战斗侧桩（battle.js 能在 node 里立起来）
global.itemById = {};
global.EventBus = { emit: function () {}, on: function () {} };
global.getCombatBonuses = function () { return {}; };
global.getBondBonuses = function () { return {}; };
global.getPlayerWeaponSkill = function () { return 0; };
global.resolveWeaponDamageType = function () { return 'slash'; };
global.currentEquipment = {};
global.window.TalismanSystem = null;
global.getCurrentCharData = function () { return global.currentCharData; };
global.currentCharData = { health: 100, energy: 100, qi: 100, maxQi: 100, level: 10, realm: '凡人', attrs: {} };
global.getRealmTier = function (realm) {
    var order = ['凡人', '炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'];
    return Math.max(0, order.indexOf(realm));
};
global.setTimeout = function (fn) { fn(); return 0; };

// 敌人生成器要问背包系统拿携带物——给个按等级发钱的真桩
global.generateEnemyInventory = function (o) {
    var lv = (o && o.level) || 1;
    return { items: [{ id: 'mat_lingzhi', qty: 1 }], spiritStones: lv * 2, copper: lv * 5 };
};

load('js/core/state-registry.js');
load('js/physiology-config.js');
load('js/battle-injuries.js');
load('js/battle.js');
load('js/map/wild-terrain.js');
load('js/map/randomMap.js');

// battle.js 自带真·敌人生成器——包一层记账，断言打在真货上
var realGen = global.generateRandomEnemy;
var genCalls = [];
global.generateRandomEnemy = function (level, type, opts) {
    var d = realGen(level, type, opts);
    genCalls.push({ level: level, type: type || 'enemy', data: d });
    return d;
};

var WT = global.WildTerrain;
var api = global.wildMapApi;
var Entity = global.Entity;

function withRandom(seq, fn) {
    var orig = Math.random, i = 0;
    Math.random = function () { var v = seq[Math.min(i, seq.length - 1)]; i++; return v; };
    try { return fn(); } finally { Math.random = orig; }
}

// 探一张「有灵脉之眼」的图：不绑死种子
function openLeyMap() {
    var regions = ['南疆', '东荒', '北冥', '中州', '西漠'];
    for (var ri = 0; ri < regions.length; ri++) {
        for (var i = 0; i < 10; i++) {
            var seed = regions[ri] + '_ley_' + i;
            global.setMapSeed(seed);
            global.openWildernessMap(regions[ri]);
            var eyes = [];
            global.currentMap.forEach(function (row) { row.forEach(function (c) { if (c.leyEye) eyes.push(c); }); });
            if (eyes.length >= 1) return { region: regions[ri], seed: seed, eyes: eyes };
        }
    }
    return null;
}

function leyCells(M) {
    var out = [];
    M.forEach(function (row) { row.forEach(function (c) { if (c.ley) out.push(c); }); });
    return out;
}

// ==================== L1 落脉有理 ====================
console.log('\n[L1] 落脉有理：脉眼扎在灵气高地，远出生远地标');
var found = openLeyMap();
assert(!!found, '五个域各探十个种子，该能探出一张有灵脉之眼的图');
if (found) {
    var MAP = global.currentMap;
    var thr = api.ley.threshold(MAP);
    var eyes = found.eyes;
    assert(eyes.length >= 1 && eyes.length <= 3, '一图脉眼该在 1~3 只（实得 ' + eyes.length + '）');
    var start = { x: global.playerPos.x, y: global.playerPos.y };
    var okEye = eyes.every(function (e) {
        return e.qi >= thr && WT.passable({ t: e.terrainKey }) && !e.poiId
            && (Math.abs(e.x - start.x) + Math.abs(e.y - start.y)) >= 6
            && e.ley >= 1 && e.ley <= 3;
    });
    assert(okEye, '每只眼该：灵气进前 10% · 可通行 · 不压地标 · 离出生点 ≥6 · 灵蕴 1~3 重');
    // 眼与眼之间拉开距离
    var apart = true;
    for (var a = 0; a < eyes.length; a++) for (var b = a + 1; b < eyes.length; b++) {
        if (Math.abs(eyes[a].x - eyes[b].x) + Math.abs(eyes[a].y - eyes[b].y) < 6) apart = false;
    }
    assert(apart, '两眼之间该拉开 ≥6 格，灵脉不该连成一片超级区');
    // 所有灵脉格：可通行、不压地标、必在某只眼的两格之内
    var leys = leyCells(MAP);
    var okRing = leys.every(function (c) {
        if (!WT.passable({ t: c.terrainKey }) || c.poiId) return false;
        return eyes.some(function (e) { return Math.abs(e.x - c.x) + Math.abs(e.y - c.y) <= 2; });
    });
    assert(okRing, '灵脉格该全是眼周两格内的可通行实地（共 ' + leys.length + ' 格）');
    // 同种子重建：灵脉落点分毫不差
    var snap1 = leys.map(function (c) { return c.x + ',' + c.y + ':' + c.ley; }).sort().join('|');
    global.setMapSeed(found.seed);
    global.openWildernessMap(found.region);
    var snap2 = leyCells(global.currentMap).map(function (c) { return c.x + ',' + c.y + ':' + c.ley; }).sort().join('|');
    assert(snap1 === snap2 && snap1.length > 0, '同种子重建灵脉该分毫不差（确定性）');
    console.log('    ' + found.region + ' 种子 ' + found.seed + '：' + eyes.length + ' 眼 ' + leys.length + ' 格灵脉，重建一致');
} else {
    console.log('    没探到有灵脉的图，后续断言跳过');
}

// ==================== L2 灵脉养强敌 ====================
console.log('\n[L2] 灵脉养强敌：密度更高、等级压人、名号唬人');
(function () {
    global.currentCharData.realm = '凡人';
    var samples = 0, okLevel = true, okMark = true, okName = true, okMerchant = true;
    var leyCellN = 0, leyEntN = 0, plainCellN = 0, plainEntN = 0;
    var regions = ['南疆', '东荒', '北冥', '中州', '西漠'];
    for (var ri = 0; ri < regions.length && samples < 4; ri++) {
        for (var i = 0; i < 10 && samples < 4; i++) {
            global.setMapSeed(regions[ri] + '_spawn_' + i);
            global.openWildernessMap(regions[ri]);
            var MAP = global.currentMap;
            var eyes = [];
            MAP.forEach(function (row) { row.forEach(function (c) { if (c.leyEye) eyes.push(c); }); });
            if (!eyes.length) continue;
            MAP.forEach(function (row) {
                row.forEach(function (c) {
                    if (!WT.passable({ t: c.terrainKey })) return;
                    var isLey = !!c.ley;
                    var ents = (c.entities || []).filter(function (en) { return String(en.uid || '').indexOf('e_') === 0; });
                    if (isLey) { leyCellN++; leyEntN += ents.length; } else { plainCellN++; plainEntN += ents.length; }
                    if (!isLey) return;
                    ents.forEach(function (en) {
                        samples++;
                        var d = en.data || {};
                        if ((d.level || 0) < 4 + 2 * c.ley) okLevel = false;
                        if (d._leyElite !== c.ley) okMark = false;
                        if (en.kind === 'beast' || en.symbol === '👹') {
                            if (String(en.name).indexOf('灵脉·') !== 0) okName = false;
                        } else {
                            if (en.symbol !== '⚔️') okName = false;
                            if (!/^精英·|^魔头·/.test(String(d.name || ''))) okName = false;
                            if (en.personType !== 'normal') okMerchant = false;
                            if (c.ley >= 3 && String(d.name || '').indexOf('魔头·') !== 0) okMerchant = false;
                        }
                    });
                });
            });
        }
    }
    assert(samples >= 3, '灵脉格上该真撒出活物（实得 ' + samples + ' 个样本）');
    assert(okLevel, '灵脉活物等级该 ≥ 4+2×灵蕴（等级压着灵蕴走）');
    assert(okMark, '灵脉活物该带 _leyElite 标记且与所在格灵蕴一致');
    assert(okName, '妖兽该改名「灵脉·」挂 👹；修士该挂 ⚔️ 与精英/魔头名号');
    assert(okMerchant, '灵脉上不该有商贩闲人；三重灵蕴该是魔头坐镇');
    // 密度：同一批图里，灵脉格出活物的密度该明显高于普通格（beastP/personP ×3）
    var leyRate = leyCellN ? leyEntN / leyCellN : 0;
    var plainRate = plainCellN ? plainEntN / plainCellN : 0;
    assert(leyCellN > 0 && leyRate > plainRate * 1.5, '灵脉格活物密度该远高于普通格（灵脉 ' + leyRate.toFixed(3) + '/格 vs 普通 ' + plainRate.toFixed(3) + '/格）');
    // 生成器真被按精英/魔头调用过
    var eliteCalls = genCalls.filter(function (g) { return g.type === 'elite' || g.type === 'boss'; });
    assert(eliteCalls.length > 0, '建图时该真按精英/魔头规格叫过生成器（实得 ' + eliteCalls.length + ' 次）');
    console.log('    灵脉样本 ' + samples + ' 个 · 精英/魔头调用 ' + eliteCalls.length + ' 次');
})();

// ==================== L3 遭遇更凶 ====================
console.log('\n[L3] 遭遇更凶：灵脉地上更常撞、撞上来的是强敌');
(function () {
    var captured = null;
    global.openBattleWithEntity = function (e) { captured = e; };
    global.currentCharData.realm = '筑基';
    var plainCell = { terrainKey: 'PLAIN', qi: 1.0, terrain: { name: '平原' } };
    var leyCell2 = { terrainKey: 'PLAIN', ley: 2, qi: 1.8, terrain: { name: '平原' } };

    // 普通地：0.09 的骰子撞不上 0.05 的底率
    captured = null;
    var r1 = withRandom([0.09], function () { return api.ley.encounter(plainCell); });
    assert(r1 === false && !captured, '普通地 0.09 的骰子不该撞上 5% 底率');

    // 灵脉二重：底率抬到 15%，0.09 撞上；来的是精英
    captured = null; msgs.length = 0;
    var r2 = withRandom([0.09, 0.7], function () { return api.ley.encounter(leyCell2); });
    assert(r2 === true && !!captured, '灵脉二重 0.09 的骰子该撞上（底率已抬到 15%）');
    if (captured) {
        assert(captured._leyElite === 2, '撞上的该带二重灵脉标（实得 ' + captured._leyElite + '）');
        assert((captured.level || 0) >= 8, '筑基撞上二重灵脉，来者等级该 ≥8（实得 ' + captured.level + '）');
        assert(/^精英·|^魔头·/.test(String(captured.name || '')), '人形强敌该挂精英/魔头名号（实得 ' + captured.name + '）');
    }
    assert(msgs.some(function (m) { return /灵气激荡/.test(m.m); }), '灵脉遭遇该报「灵气激荡」');

    // 灵脉上的妖兽：淬体改名
    captured = null; msgs.length = 0;
    var leyCell1 = { terrainKey: 'FOREST', ley: 1, qi: 1.5, terrain: { name: '密林' } };
    withRandom([0.09, 0.1], function () { api.ley.encounter(leyCell1); });
    assert(!!captured && String(captured.name || '').indexOf('灵脉·') === 0, '灵脉撞上的妖兽该淬体改名「灵脉·」（实得 ' + (captured || {}).name + '）');
    assert(captured && captured._leyElite === 1, '淬体妖兽该带灵脉标');

    // 三重灵蕴：人形直接按魔头规格来
    captured = null;
    var leyCell3 = { terrainKey: 'PLAIN', ley: 3, qi: 2.2, terrain: { name: '平原' } };
    withRandom([0.09, 0.7], function () { api.ley.encounter(leyCell3); });
    assert(!!captured && /^魔头·/.test(String(captured.name || '')), '三重灵蕴撞上人形该是魔头（实得 ' + (captured || {}).name + '）');
    console.log('    底率 +5%/重 · 精英/魔头按灵蕴升格 · 妖兽淬体改名');
})();

// ==================== L4 战备透传 ====================
console.log('\n[L4] 战备透传：携带物/绝技/生理随实体进场');
(function () {
    // 等级公式单测
    global.currentCharData.realm = '凡人';
    assert(api.ley.level(1, function () { return 0; }) >= 6, '凡人一重灵脉保底该 ≥6 级');
    global.currentCharData.realm = '化神';
    assert(api.ley.level(1, function () { return 0; }) >= 13, '化神一重灵脉该 ≥13 级（灵脉地不随修为变白菜地）');
    var l1 = api.ley.level(1, function () { return 0.99; }), l3 = api.ley.level(3, function () { return 0.99; });
    assert(l3 > l1, '灵蕴越高等级越狠（' + l1 + ' → ' + l3 + '）');
    global.currentCharData.realm = '凡人';
    // 淬体账
    var buffed = api.ley.buff({ name: '狼', attrs: { strength: 100, constitution: 50 } }, 2);
    assert(buffed.attrs.strength === 126 && buffed.attrs.constitution === 63, '二重淬体该 ×1.26 取整（实得 ' + buffed.attrs.strength + '/' + buffed.attrs.constitution + '）');
    assert(buffed.name === '灵脉·狼' && buffed._leyElite === 2, '淬体该改名打标');
    // 实体透传：真生成器 → Entity，携带物/绝技/生理/伤害类型一件不丢
    var d = realGen(12, 'elite');
    assert(!!d.carriedInventory && (d.carriedInventory.items || []).length > 0, '生成器该给出非空携带物（真源就绪）');
    var e = new Entity(d, 'enemy');
    assert(e.carriedInventory === d.carriedInventory, '携带物该原样随实体进场——搜刮不再空手');
    assert(Array.isArray(e.combatAbilities) && e.combatAbilities.length === (d.combatAbilities || []).length, '战斗绝技该整份带进场');
    assert(e.physiologyType === d.physiologyType, '生理类型该挂在实体上（尸体结算按此分流）');
    assert(e.damageType === d.damageType, '伤害类型该随实体进场');
    assert(e._affix === (d._affix || null) && e.subtype === (d.subtype || null), '词缀与亚型该随实体进场');
    if ((d.combatAbilities || []).length) {
        assert(e.hasAbility(d.combatAbilities[0]), 'hasAbility 该查得到带进场的绝技');
    }
    // 静态接线：野外点人开打那条路必须整包透传
    var app = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
    assert(/new Entity\(Object\.assign\(\{\}, data/.test(app), 'openBattleWithEntity 该整包透传敌数据，不再九选一');
    var rm = fs.readFileSync(path.join(ROOT, 'js/map/randomMap.js'), 'utf8');
    assert(/markLeyZones\(currentMap, currentPois, rng, gen\.start\)/.test(rm) && /scatterEntities\(currentMap/.test(rm), '建图该先落脉再撒活物');
    assert(/wild-pulse/.test(rm) && /灵脉之地/.test(rm), '灵脉该有青光环视觉与侧栏警示');
    console.log('    等级公式/淬体账/实体透传/接线全验');
})();

// ==================== L5 初见有播报 ====================
console.log('\n[L5] 初见有播报：每域每眼只报一次，账随存档走');
(function () {
    global.currentCharData.realm = '凡人';
    var f = openLeyMap();
    assert(!!f, '该能再探出一张有灵脉之眼的图');
    if (!f) return;
    var eye = f.eyes[0];
    msgs.length = 0;
    api.revealAround(eye.x, eye.y, 1);
    var n1 = msgs.filter(function (m) { return /灵脉之眼/.test(m.m); }).length;
    assert(n1 === 1, '初次照面该播报一声（实得 ' + n1 + '）');
    msgs.length = 0;
    api.revealAround(eye.x, eye.y, 1);
    var n2 = msgs.filter(function (m) { return /灵脉之眼/.test(m.m); }).length;
    assert(n2 === 0, '同一只眼不该反复念叨（实得 ' + n2 + '）');
    // 账随存档走
    global.saveWildState();
    var st = api.state().regions[f.region];
    assert(!!st && !!st.leySeen && st.leySeen[eye.x + ',' + eye.y] === 1, '见过的眼该记进域账（leySeen）');
    var raw = JSON.stringify(st);
    assert(/leySeen/.test(raw), '存档结构里该带着 leySeen 字段');
    console.log('    播报一次入账，重进不念旧');
})();

// ==================== 结果 ====================
console.log('\n========== v20.89 灵脉强怪区 ==========');
console.log('通过 ' + passed + ' / 失败 ' + failed);
process.exit(failed ? 1 : 0);
