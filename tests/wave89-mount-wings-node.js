/**
 * wave89-mount-wings-node.js — 第八十九波 · 翅膀与甲壳 验收：
 *   A 御空掠险：会飞的坐骑（雷鹰/火凤/云角鹿/罡风鹤/鲲鹏）驮人掠过漩涡/冰隙——
 *     此前 mount.fly 是笔死数据，天险对谁都是墙；掠过按 20 分钟/格结时间（不是 moveCost 99 的 990 分钟）
 *   B 龙龟渡水：会水的坐骑甲壳即舟——渡水不耗精力、不湿衣（泅渡每格 -4 精力还浑身透湿）；
 *     但龟不会飞，漩涡照样是墙
 *   C 点击口径：天险格不走寻路（与水格同款）——贴着它一格一格掠；寻路失败的话术给飞坐骑留了指引
 *   D 引路两本账：travel 是倍率账，只取最好一笔（两只风狼 0.8+0.8=1.6 会让「wolfMul<1」判断失效，
 *     狼越多走得越慢——荒谬）；加成的账（寻宝/侦察/负重）照旧求和
 *   E 鹰眼助访：随行带雷鹰打听兽径，稀有传闻概率 15%→25%（读生态账，不另立名册）；骰子仍是四枚
 *   F 哨兵：战斗文件零改动、四十六/四十七波泅渡踏水账原样、八十八波成果原样、新话术零中英混排
 *
 * 运行：node tests/wave89-mount-wings-node.js
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
function src(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// ==================== 测试桩（与野外地图四套同款） ====================
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
        _html: '', textContent: ''
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
global.showMessage = function (m, t) { msgs.push({ m: String(m), t: t }); };
var timeCalls = [];
global.timeSystem = {
    gameTime: { totalMinutes: 0, currentDay: 5, currentHour: 14, currentMinute: 0, currentSeason: 'spring', currentMonth: 3, currentYear: 1 },
    advanceTime: function (m, r) { timeCalls.push({ m: m, r: r }); global.timeSystem.gameTime.totalMinutes += m; },
    onNewDaySubscribe: function () {}
};
global.WorldCalendar = { day: 5 };
global.addItemToInventory = function () { return true; };
global.updateCharacterStatus = function () {};
global.updateCurrencyUI = function () {};
global.getEffectiveMax = function () { return 100; };
global.generateRandomEnemy = function (level, type) {
    return { name: (type === 'beast' ? '野狼' : '黑衣修士') + level, hp: 100, physiologyType: 'humanoid', level: level };
};
global.openCityShop = function () {};
global.startCultivation = function () {};
global.exploreLandmark = function () {};
global.LANDMARKS = {};
global.ResourcePoints = { listByRegion: function () { return []; }, getPoint: function () { return null; } };
global.DungeonDynamic = { listActive: function () { return []; } };
global.StateRegistry = { register: function () {} };
global.currentCharData = { realm: '炼气', energy: 100, hp: 100, spiritStones: 100, copper: 100 };
global.inventory = { currency: { spiritStones: 100, copper: 100 }, slots: [], maxSlots: 30 };

// 坐骑桩：一个开关换三种脚力（无坐骑 / 会飞 / 会水）——须在 beast-taming 加载后再挂，
// 否则会被它的真 getActiveMount 导出盖掉
var MOUNT = null;
var EAGLE = { name: '雷鹰', templateId: 'thunder_eagle', mount: { speed: 2.5, fly: true } };
var TURTLE = { name: '龙龟', templateId: 'dragon_turtle', mount: { speed: 0.8, water: true } };

load('js/core/state-registry.js');
load('js/map/wild-terrain.js');
load('js/map/randomMap.js');
load('js/beast-taming.js');
load('js/extensions/beast-ecosystem.js');
load('js/extensions/beast-lore.js');
global.getActiveMount = function () { return MOUNT; };

var WT = global.WildTerrain;
var ECO = global.BeastEcosystem;
var LORE = global.BeastLore;
var origRnd = Math.random;

// 建一张东南海域的图（漩涡独有地貌），找一个「漩涡格 + 可通行邻居」做试验场
global.setMapSeed('wave89_wings_seed');
global.openWildernessMap('东南海域');
var MAP = global.currentMap;
assert(MAP && MAP.length > 0, '前置：东南海域图开得出来');

function findSpotWithNeighbor(targetKey) {
    for (var y = 1; y < MAP.length - 1; y++) {
        for (var x = 1; x < MAP[0].length - 1; x++) {
            if (MAP[y][x].terrainKey !== targetKey) continue;
            var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
            for (var d = 0; d < dirs.length; d++) {
                var nx = x + dirs[d][0], ny = y + dirs[d][1];
                if (MAP[ny] && MAP[ny][nx] && WT.passable({ t: MAP[ny][nx].terrainKey })) {
                    return { target: { x: x, y: y }, stand: { x: nx, y: ny } };
                }
            }
        }
    }
    return null;
}
function walkTo(pos) {
    var grid = MAP.map(function (r) { return r.map(function (c) { return { t: c.terrainKey }; }); });
    var res = WT.findPath(grid, { x: global.playerPos.x, y: global.playerPos.y }, pos);
    if (!res) return false;
    for (var i = 0; i < res.path.length; i++) {
        if (!global.wildMapApi.stepTo(res.path[i].x, res.path[i].y)) return false;
    }
    return true;
}

// ==================== A · 御空掠险 ====================
console.log('\n[A] 御空掠险（漩涡冰隙从前是墙，会飞的坐骑掠过去）');
var spot = findSpotWithNeighbor('WHIRLPOOL');
assert(!!spot, 'A0 东南海域图上有漩涡格且贴得到（种子图必有）');
if (spot) {
    MOUNT = null;
    assert(walkTo(spot.stand), 'A0b 走到漩涡旁边');
    eq(global.wildMapApi.stepTo(spot.target.x, spot.target.y), false, 'A1 没坐骑：漩涡是墙（照旧「过不去」）');
    MOUNT = TURTLE;
    eq(global.wildMapApi.stepTo(spot.target.x, spot.target.y), false, 'A2 龙龟会水不会飞——漩涡照样是墙');
    MOUNT = EAGLE;
    msgs.length = 0; timeCalls.length = 0;
    eq(global.wildMapApi.stepTo(spot.target.x, spot.target.y), true, 'A3 雷鹰驮着人掠过漩涡（fly 不再是死数据）');
    eq(global.playerPos.x, spot.target.x, 'A4 人真站在了漩涡上头（天上）');
    var aloftCost = timeCalls.filter(function (c) { return c.r === '野外赶路'; }).map(function (c) { return c.m; });
    assert(aloftCost.length === 1 && aloftCost[0] <= 60, 'A5 掠过按御空的账结时间（≤60 分钟，不是 moveCost 99 的 990）');
    assert(msgs.some(function (m) { return m.m.indexOf('漩涡在脚下打转') >= 0; }), 'A6 头一回掠险有画面话术');
    // 再掠一格不重复念（话术一场一回由源码旗保证）
    assert(src('js/map/randomMap.js').indexOf('_aloftNoticed = true') >= 0, 'A7 掠险话术一场一回（开图翻篇）');
    MOUNT = null;
}
// 冰隙同款（北冥图）
global.setMapSeed('wave89_wings_seed');
global.openWildernessMap('北冥');
var MAP2 = global.currentMap;
MAP = MAP2;
var crev = null;
for (var y2 = 1; y2 < MAP.length - 1 && !crev; y2++) {
    for (var x2 = 1; x2 < MAP[0].length - 1; x2++) {
        if (MAP[y2][x2].terrainKey !== 'CREVASSE') continue;
        var nb = [[y2, x2 + 1], [y2, x2 - 1], [y2 + 1, x2], [y2 - 1, x2]].filter(function (p) {
            return MAP[p[0]] && MAP[p[0]][p[1]] && WT.passable({ t: MAP[p[0]][p[1]].terrainKey });
        })[0];
        if (nb) { crev = { target: { x: x2, y: y2 }, stand: { x: nb[1], y: nb[0] } }; break; }
    }
}
assert(!!crev, 'A8 北冥图上有冰隙格且贴得到');
if (crev) {
    MOUNT = null;
    walkTo(crev.stand);
    eq(global.wildMapApi.stepTo(crev.target.x, crev.target.y), false, 'A9 没坐骑：冰隙是墙');
    MOUNT = EAGLE;
    eq(global.wildMapApi.stepTo(crev.target.x, crev.target.y), true, 'A10 雷鹰掠过冰隙（一振翼就从裂口上头过去）');
    MOUNT = null;
}

// ==================== B · 龙龟渡水 ====================
console.log('\n[B] 龙龟渡水（甲壳即舟——不湿不累）');
// 回东南海域找水格
global.setMapSeed('wave89_wings_seed');
global.openWildernessMap('东南海域');
MAP = global.currentMap;
var wspot = findSpotWithNeighbor('WATER');
assert(!!wspot, 'B0 图上有水格且贴得到');
if (wspot) {
    walkTo(wspot.stand);
    // 泅渡对照：没坐骑，下水耗精力
    global.currentCharData.energy = 100;
    global.currentCharData.realm = '炼气';   // 低境界不会踏水
    MOUNT = null;
    msgs.length = 0;
    eq(global.wildMapApi.stepTo(wspot.target.x, wspot.target.y), true, 'B1 没坐骑也下得了水（泅渡老账原样）');
    var swimEn = global.currentCharData.energy;
    assert(swimEn < 100, 'B2 泅渡真耗精力（老账不打折）');
    // 走回岸，换龙龟
    walkTo(wspot.stand);
    global.currentCharData.energy = 100;
    MOUNT = TURTLE;
    msgs.length = 0; timeCalls.length = 0;
    eq(global.wildMapApi.stepTo(wspot.target.x, wspot.target.y), true, 'B3 龙龟驮人渡水');
    eq(global.currentCharData.energy, 100, 'B4 甲壳即舟——精力分毫未耗（泅渡的账不适用）');
    assert(msgs.some(function (m) { return m.m.indexOf('龟甲即舟') >= 0; }), 'B5 头一回乘龟渡水有画面话术');
    var carryCost = timeCalls.filter(function (c) { return c.r === '野外赶路'; }).map(function (c) { return c.m; });
    assert(carryCost.length === 1 && carryCost[0] <= 40, 'B6 渡水按踏水的速度结账（20 分钟/格上下，不比泅渡慢）');
    assert(!msgs.some(function (m) { return m.m.indexOf('下水了') >= 0; }), 'B7 坐骑驮着不念泅渡的经');
    // 飞坐骑掠水同样不耗精力
    walkTo(wspot.stand);
    global.currentCharData.energy = 100;
    MOUNT = EAGLE;
    eq(global.wildMapApi.stepTo(wspot.target.x, wspot.target.y), true, 'B8 雷鹰贴水掠过也行');
    eq(global.currentCharData.energy, 100, 'B9 掠水同样分毫未耗');
    MOUNT = null;
    // 湿衣账：坐骑驮着不湿（源码哨兵——运行时旗无出口，认账不认脸）
    var rmSrc = src('js/map/randomMap.js');
    assert(rmSrc.indexOf('_isWater && !_treading && !_carried') >= 0, 'B10 湿衣账认「坐骑驮着不湿」（makeWet 让开 _carried）');
    assert(rmSrc.indexOf('!((_isWater && _treading) || _carried || _aloft)) applyTerrainHazard') >= 0, 'B11 危险表让开坐骑（踏水者脚底不沾水，驮着的同理）');
}

// ==================== C · 点击口径 ====================
console.log('\n[C] 点击口径（天险格与水格同款：贴着它一格一格过）');
var rmSrcC = src('js/map/randomMap.js');
assert(rmSrcC.indexOf("dist === 1 && (cell.terrainKey === 'WATER' || isAloftCell(cell))") >= 0, 'C1 贴格点击放行天险（寻路眼里天险仍是墙）');
assert(rmSrcC.indexOf('天险横在当中') >= 0, 'C2 寻路失败的话术给飞坐骑留了指引（走到旁边再点它）');
assert(rmSrcC.indexOf('function isAloftCell') >= 0 && rmSrcC.indexOf('window.getActiveMount') >= 0, 'C3 天险格判定读真坐骑账（不是拍脑袋）');

// ==================== D · 引路两本账 ====================
console.log('\n[D] 引路两本账（倍率取最好一笔，加成照旧求和）');
global.tamedBeasts = [];
eq(ECO.getActiveBeastBuff('travel'), 0, 'D1 无兽 travel 0');
global.tamedBeasts = [{ templateId: 'wind_wolf', name: '风狼' }];
eq(ECO.getActiveBeastBuff('travel'), 0.8, 'D2 一只风狼引路 ×0.8');
global.tamedBeasts = [{ templateId: 'wind_wolf', name: '风狼' }, { templateId: 'wind_wolf', name: '风狼' }];
eq(ECO.getActiveBeastBuff('travel'), 0.8, 'D3 两只风狼还是一笔 0.8（旧账求和成 1.6，消费端「<1 才提速」整个失效——狼越多走得越慢，荒谬）');
assert(src('js/travel-system.js').indexOf('wolfMul && wolfMul < 1') >= 0, 'D4 消费端判断原样（源头改对，不用动消费端）');
global.tamedBeasts = [{ templateId: 'spirit_fox', name: '灵狐' }, { templateId: 'spirit_fox', name: '灵狐' }];
eq(ECO.getActiveBeastBuff('treasure'), 0.1, 'D5 加成的账照旧求和（两只灵狐寻宝 +10%——兽多力量大）');
global.tamedBeasts = [{ templateId: 'thunder_eagle', name: '雷鹰' }];
eq(ECO.getActiveBeastBuff('scout'), 1.0, 'D6 雷鹰侦察账原样');
global.tamedBeasts = [];

// ==================== E · 鹰眼助访 ====================
console.log('\n[E] 鹰眼助访（带着雷鹰打听，稀有传闻更容易听真）');
eq(LORE.SCOUT_RARE_BONUS, 0.1, 'E1 鹰眼加成一成（15%→25%）');
eq(LORE.RARE_CHANCE, 0.15, 'E2 底盘概率原样');
// 无雷鹰：骰 0.20 → 常见档
global.tamedBeasts = [];
Math.random = (function () { var s = [0.20, 0, 0, 0]; return function () { return s.length > 1 ? s.shift() : s[0]; }; })();
var r1 = LORE.askBeastLore('中州');
eq(r1.vague, false, 'E3 没带雷鹰，骰 0.20 听来的是常见见闻');
// 带雷鹰：同一骰 0.20 → 稀有档
global.tamedBeasts = [{ templateId: 'thunder_eagle', name: '雷鹰' }];
Math.random = (function () { var s = [0.20, 0, 0, 0]; return function () { return s.length > 1 ? s.shift() : s[0]; }; })();
var r2 = LORE.askBeastLore('中州');
Math.random = origRnd;
eq(r2.vague, true, 'E4 带着雷鹰，同一骰听来的是稀有传闻（鹰眼助访真兑现）');
assert(r2.line.indexOf('雷鹰') >= 0, 'E5 稀有话术点破鹰眼（天上的眼睛印证兽贩子的话）');
var loreSrc = src('js/extensions/beast-lore.js');
eq((loreSrc.match(/Math\.random/g) || []).length, 4, 'E6 打听仍是四枚骰（加成改的是门槛不是骰数）');
assert(loreSrc.indexOf("getActiveBeastBuff('scout')") >= 0, 'E7 加成读生态账（不另立名册）');
global.tamedBeasts = [];

// ==================== F · 哨兵 ====================
console.log('\n[F] 哨兵');
var rmSrc = src('js/map/randomMap.js');
assert(src('js/battle.js').indexOf('第八十九波') < 0, 'F1 战斗文件零改动（脚力账全在地图/生态/手记侧）');
assert(rmSrc.indexOf('SWIM_GATE') >= 0 && rmSrc.indexOf('WATERWALK_TIER') >= 0 && rmSrc.indexOf('泅水一格一格来') >= 0, 'F2 四十六/四十七波泅渡踏水账原样（坐骑是第三条路，不拆老路）');
assert(rmSrc.indexOf("cell.terrainKey !== 'WATER'") >= 0, 'F3 水格放行口原样（漩涡冰隙只在飞坐骑时开口）');
var btSrc = src('js/beast-taming.js');
assert(btSrc.indexOf('getBeastPenCap') >= 0 && btSrc.indexOf('tal_beast_seal') >= 0, 'F4 八十八波成果原样（魂印+缚兽符）');
assert(src('tests/run-all.sh').indexOf('wave89-mount-wings-node.js') >= 0, 'F5 本套已挂全量回归');
// 新话术零中英混排（本波新段）
var leak = null;
[rmSrc.slice(rmSrc.indexOf('function activeMountNow'), rmSrc.indexOf('const _isWater = cell.terrainKey')),
 loreSrc.slice(loreSrc.indexOf('var SCOUT_RARE_BONUS'), loreSrc.indexOf('var _state'))].forEach(function (txt) {
    (txt.match(/'[^']+'/g) || []).forEach(function (s) {
        var v = s.slice(1, -1);
        if (/[+);({\[,?<>]/.test(v)) return;
        if (/^[a-z0-9_]+(?:[-_:. ][a-z0-9_]+)*$/i.test(v)) return;
        if (/^[A-Za-z0-9_\-:.\/# ]+$/.test(v)) return;
        if (/[A-Za-z]/.test(v) && /[一-龥]/.test(v)) leak = leak || s;
    });
});
eq(leak, null, 'F6 新话术零中英混排（漏: ' + leak + '）');

console.log('\n========== 第八十九波 · 翅膀与甲壳 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
