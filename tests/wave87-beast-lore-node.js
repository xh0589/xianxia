/**
 * wave87-beast-lore-node.js — 第八十七波 · 兽径手记（打听系统）验收：
 *   A 亲遇成识：野外真打一场（不论胜负）→ 手记落确讯；战终钩子接在驯养侧（battle.js 零改动）
 *   B 酒楼打听：请兽贩子喝一壶（铜钱50+一个时辰，不设日限——成本就是闸）；
 *     一成五概率听来稀有传闻（只报大概地区）；本地见闻优先；问过必落账
 *   C 图鉴降格：栖息地不再白给——确讯标地区+地皮、传闻标「传闻在X」、没听过的如实标「行踪不明」；
 *     进度账（已收服 x/y · 已知兽径 a/b）上头行；进化来路与铺子门照写（公开知识）
 *   D 手记随档：StateRegistry 'beastLore' 注册、导出导入往返、零新 localStorage 键
 *   E 哨兵：战斗文件零改动、第八十六波成果原样、骰子只在打听时掷、新话术零中英混排
 *
 * 运行：node tests/wave87-beast-lore-node.js
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

// ==================== 世界桩 ====================
global.window = global;
var msgs = [], timeCalls = [];
global.showMessage = function (m) { msgs.push(String(m)); };
global.gameLog = { add: function (m) { msgs.push(String(m)); } };
global.showModal = function (t) { msgs.push('[modal]' + t); };
global.document = {
    createElement: function () { return { id: '', className: '', innerHTML: '', style: {}, classList: { add: function () {}, remove: function () {}, contains: function () { return false; } }, appendChild: function () {}, remove: function () {}, onclick: null }; },
    getElementById: function () { return null; },
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
    addEventListener: function () {},
    body: { appendChild: function () {} },
    readyState: 'complete'
};
var store = {};
global.localStorage = {
    getItem: function (k) { return store[k] !== undefined ? store[k] : null; },
    setItem: function (k, v) { store[k] = String(v); },
    removeItem: function (k) { delete store[k]; }
};
var CUR_DAY = 100;
global.getAbsoluteDay = function () { return CUR_DAY; };
global.WorldCalendar = { get day() { return CUR_DAY; } };
global.timeSystem = {
    gameTime: { totalMinutes: 600 },
    advanceTime: function (m, r) { timeCalls.push({ m: m, r: String(r || '') }); },
    getAbsoluteDay: function () { return CUR_DAY; },
    onNewDaySubscribe: function () {}
};
global.EventBus = { emit: function () {}, on: function () {} };
global.updateInventoryUI = function () {};
global.updateCurrencyUI = function () {};
global.updateCharacterStatus = function () {};
global.renderBeastList = function () {};
global.renderBeastTemplates = function () {};
global.getLifeSkill = function () { return 0; };
global.growLifeSkill = function () {};
global.itemById = {};
global.currentCharData = { realm: '金丹', spiritStones: 1000, copper: 200, combatAbilities: [] };
global.inventory = { currency: { spiritStones: 1000, copper: 200 }, slots: [], maxSlots: 30 };
var REALMS = { '炼气': 0, '筑基': 1, '金丹': 2, '元婴': 3, '化神': 4, '炼虚': 5 };
global.REALM_CONFIG = REALMS;
global.getRealmIndex = function (r) { return REALMS[r] != null ? REALMS[r] : -1; };
var registered = {};
global.StateRegistry = {
    register: function (key, api) { registered[key] = api; }
};

load('js/beast-taming.js');
load('js/extensions/beast-ecosystem.js');
load('js/extensions/beast-lore.js');

var LORE = global.BeastLore;
var ECO = global.BeastEcosystem;
var origRnd = Math.random;
function stubRnd(seq) {
    var s = seq.slice();
    Math.random = function () { return s.length > 1 ? s.shift() : s[0]; };
}
function clearLore() {
    Object.keys(LORE.getState().sightings).forEach(function (k) { delete LORE.getState().sightings[k]; });
    msgs.length = 0;
}

// ==================== A · 亲遇成识 ====================
console.log('\n[A] 亲遇成识（跟兽真打过一场，就认得它住哪）');
clearLore();
var s1 = LORE.learnFromSighting('spirit_fox', '中州', 'FOREST', '亲自交手');
eq(s1 && s1.vague, false, 'A1 确讯落账（地区+地皮）');
eq(LORE.getLore('spirit_fox').terrain, 'FOREST', 'A2 地皮原样记档');
eq(LORE.getLore('spirit_fox').day, 100, 'A3 落账带日子（手记是编年的）');
assert(LORE.loreLineFor('spirit_fox').indexOf('中州（林海）') >= 0, 'A4 图鉴话术：地区+中文地皮');
var keep = LORE.learnFromSighting('spirit_fox', '南疆', null, '兽贩子传闻');
eq(keep && keep.region, '中州', 'A4b 传闻盖不过手里的确讯（返回的仍是确讯那笔）');
eq(LORE.getLore('spirit_fox').vague, false, 'A5 手里的确讯不被模糊话降格');
LORE.learnFromSighting('kunpeng', '北冥', null, '兽贩子传闻');
eq(LORE.getLore('kunpeng').vague, true, 'A6 传闻先记个大概');
LORE.learnFromSighting('kunpeng', '北冥', 'SNOW', '亲自交手');
eq(LORE.getLore('kunpeng').vague, false, 'A7 亲身交手把传闻坐实成确讯');
eq(LORE.learnFromSighting('spirit_fox', null, 'FOREST'), null, 'A8 缺地区不落账（没头没尾的话不记）');
eq(LORE.learnFromSighting(null, '中州', 'FOREST'), null, 'A9 缺兽名不落账');
// 战终钩子：打赢打输都学（钩子在驯养侧，battle.js 零改动）
clearLore();
global.currentBattle = { enemy: { name: '风狼', _beastTemplateId: 'wind_wolf', _ecoRegion: '西漠', _ecoTerrain: 'DESERT' }, allyBeast: null };
global.onBeastBattleEnd(true);
eq(LORE.getLore('wind_wolf') && LORE.getLore('wind_wolf').region, '西漠', 'A10 打赢一场学会兽径');
eq(LORE.getLore('wind_wolf').source, '亲自交手', 'A11 来路记「亲自交手」（与传闻分账）');
clearLore();
global.currentBattle = { enemy: { name: '黑熊', _beastTemplateId: 'black_bear', _ecoRegion: '东荒', _ecoTerrain: 'FOREST' }, allyBeast: null };
global.onBeastBattleEnd(false);
eq(LORE.getLore('black_bear') && LORE.getLore('black_bear').region, '东荒', 'A12 打输了也长了见识（没带灵兽出战照样学）');
delete global.currentBattle;
// 地图侧哨兵：名种出身地与地皮随敌数据进战斗
assert(src('js/map/randomMap.js').indexOf('_spiritData._ecoRegion = currentRegionForMap') >= 0 && src('js/map/randomMap.js').indexOf('_spiritData._ecoTerrain = t') >= 0, 'A13 地图给名种盖出身地戳（进战斗即随敌数据走）');
var btSrc = src('js/beast-taming.js');
assert(btSrc.indexOf('learnFromSighting') >= 0, 'A14 战终钩子接在驯养侧（不在战斗文件里）');

// ==================== B · 酒楼打听 ====================
console.log('\n[B] 酒楼打听（请兽贩子喝一壶——真金白银加真工夫，不设日限）');
clearLore();
eq(LORE.RARE_CHANCE, 0.15, 'B1 稀有传闻概率一成五');
eq(LORE.RARE_TEMPLATE_IDS.length, 7, 'B2 稀有名录七只（传说三只+位面四兽）');
assert(LORE.RARE_TEMPLATE_IDS.indexOf('kunpeng') >= 0 && LORE.RARE_TEMPLATE_IDS.indexOf('cloud_horn_deer') >= 0, 'B3 鲲鹏与位面兽都在传闻名录');
// 常见档：确讯（地区+地皮），本地见闻优先
stubRnd([0.5, 0, 0, 0]);
var r1 = LORE.askBeastLore('中州');
Math.random = origRnd;
eq(r1.ok, true, 'B4 打听得着话');
eq(r1.vague, false, 'B5 常见兽给确讯');
eq(r1.region, '中州', 'B6 兽贩子先说本地脚程里的见闻');
assert(!!r1.terrain, 'B7 确讯带地皮');
var e1 = ECO.BEAST_DISTRIBUTION.filter(function (d) { return d.name === r1.name; })[0];
assert(e1 && e1.regions.indexOf(r1.region) >= 0 && e1.terrains.indexOf(r1.terrain) >= 0, 'B8 话不瞎编：地区地皮都在该兽分布账上');
eq(LORE.getLore(r1.templateId).vague, false, 'B9 问过必落账（确讯）');
assert(r1.line.indexOf('兽贩子') >= 0, 'B10 话术是人话（兽贩子拿筷子蘸酒画给你看）');
// 稀有档：只报大概地区
clearLore();
stubRnd([0.05, 0, 0, 0]);
var r2 = LORE.askBeastLore('中州');
Math.random = origRnd;
eq(r2.vague, true, 'B11 一成五概率听来稀有传闻');
assert(LORE.RARE_TEMPLATE_IDS.indexOf(r2.templateId) >= 0, 'B12 传闻必是稀有名录里的兽');
eq(r2.terrain, null, 'B13 稀有的说不准地皮（只报地区）');
eq(LORE.getLore(r2.templateId).vague, true, 'B14 传闻落账记「大概」');
assert(LORE.loreLineFor(r2.templateId).indexOf('传闻在「') >= 0 && LORE.loreLineFor(r2.templateId).indexOf('确切处不明') >= 0, 'B15 图鉴如实标「传闻在X · 确切处不明」');
assert(r2.line.indexOf('谁也说不准') >= 0, 'B16 传闻话术不打包票');
// 无本地兽的地区也能问出话（兽贩子走南闯北）
clearLore();
stubRnd([0.5, 0, 0, 0]);
var r3 = LORE.askBeastLore('天界');
Math.random = origRnd;
eq(r3.ok, true, 'B17 天上没兽也有得聊（回落全域见闻）');
assert(!!r3.region, 'B18 回落时地区照给');
// 打听入口账（app.js 侧）：成本+工夫+不设日限
var appSrc = src('js/app.js');
assert(appSrc.indexOf('askBeastTrail') >= 0 && appSrc.indexOf('tavernRumor') >= 0, 'B19 酒楼两个喝法：听闲话（老账）/打听兽径（新账）');
assert(appSrc.indexOf('< 50') >= 0 && appSrc.indexOf('deductCopper(50)') >= 0, 'B20 打听收 50 铜钱（钱不够兽贩子不接话）');
assert(appSrc.indexOf("advanceTime(60, '酒楼打听兽径')") >= 0, 'B21 打听耗一个时辰（成本就是闸）');
assert(appSrc.indexOf('_lastAskDay') < 0 && appSrc.indexOf('次数已用完') < 0, 'B22 不设人为日限计数器（设计宪法：约束来自世界本身）');
assert(appSrc.indexOf('打听兽径') >= 0, 'B23 酒楼弹窗挂出新口子');

// ==================== C · 图鉴降格 ====================
console.log('\n[C] 图鉴降格（栖息地不白给——手记里有什么图鉴写什么）');
assert(appSrc.indexOf('loreLineFor') >= 0 && appSrc.indexOf('distOfTemplate') >= 0, 'C1 图鉴栖息地行走手记（第八十六波的白给口径撤了）');
assert(LORE.loreLineFor('没有这种兽').indexOf('❓ 行踪不明') >= 0, 'C2 没听过的如实标「行踪不明 · 酒楼可打听」');
assert(appSrc.indexOf('已收服 ') >= 0 && appSrc.indexOf('已知兽径 ') >= 0, 'C3 进度账上头行（收集的目标感）');
assert(appSrc.indexOf('培养进化而得') >= 0, 'C4 进化来路照写（公开知识不算剧透）');
assert(appSrc.indexOf('灵兽坊亦售幼兽') >= 0, 'C5 铺子门照写');
assert(src('js/extensions/beast-lore.js').indexOf('TERRAIN_CN') >= 0, 'C6 地形中文表唯一真源在手记模块');

// ==================== D · 手记随档 ====================
console.log('\n[D] 手记随档（零新 localStorage 键）');
assert(!!registered.beastLore, 'D1 StateRegistry 注册在册');
clearLore();
LORE.learnFromSighting('ice_serpent', '北冥', 'SNOW', '亲自交手');
LORE.learnFromSighting('golden_crow', '南疆', null, '兽贩子传闻');
var snap = registered.beastLore.export();
registered.beastLore.reset();
eq(LORE.getLore('ice_serpent'), null, 'D2 reset 真清账');
registered.beastLore.import(JSON.parse(JSON.stringify(snap)));
eq(LORE.getLore('ice_serpent').terrain, 'SNOW', 'D3 导出导入往返：确讯原样');
eq(LORE.getLore('golden_crow').vague, true, 'D4 往返：传闻档位原样');
eq(LORE.knownCount(), 2, 'D5 进度账随档走');
registered.beastLore.import(null);
eq(LORE.knownCount(), 2, 'D6 坏档不炸不清（import null 原样）');
var storeKeys = Object.keys(store).filter(function (k) { return k.indexOf('lore') >= 0 || k.indexOf('Lore') >= 0; });
eq(storeKeys.length, 0, 'D7 零新 localStorage 键（手记骑 StateRegistry 的整包存读档）');

// ==================== E · 哨兵 ====================
console.log('\n[E] 哨兵');
assert(src('js/battle.js').indexOf('第八十七波') < 0 && src('js/battle.js').indexOf('learnFromSighting') < 0, 'E1 战斗文件零改动（学账钩子在驯养侧战终口）');
var loreSrc = src('js/extensions/beast-lore.js');
var learnSeg = loreSrc.slice(loreSrc.indexOf('function learnFromSighting'), loreSrc.indexOf('// ---------- 问：酒楼打听'));
eq((learnSeg.match(/Math\.random/g) || []).length, 0, 'E2 亲遇成识零骰（学是定数，只有打听掷骰）');
eq((loreSrc.match(/Math\.random/g) || []).length, 4, 'E3 打听四枚骰：稀有否/挑兽/挑地区/挑地皮（不多不少）');
var ecoSrc = src('js/extensions/beast-ecosystem.js');
assert(ecoSrc.indexOf("TERRAIN_ALIASES.FORD = 'WATER'") >= 0 && ecoSrc.indexOf('19 兽') >= 0, 'E4 第八十六波成果原样（水岸别名+19 兽）');
assert(src('仙侠.html').indexOf('js/extensions/beast-lore.js') >= 0, 'E5 页面加载表挂上手记模块');
var leak = null;
[loreSrc].forEach(function (txt) {
    (txt.match(/'[^']+'/g) || []).forEach(function (s) {
        var v = s.slice(1, -1);
        if (/[+);({\[,?<>]/.test(v)) return;
        if (/^[a-z0-9_]+(?:[-_:. ][a-z0-9_]+)*$/i.test(v)) return;
        if (/^[A-Za-z0-9_\-:.\/# ]+$/.test(v)) return;
        if (/[A-Za-z]/.test(v) && /[一-龥]/.test(v)) leak = leak || s;
    });
});
eq(leak, null, 'E6 新话术零中英混排（漏: ' + leak + '）');

console.log('\n========== 第八十七波 · 兽径手记 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
