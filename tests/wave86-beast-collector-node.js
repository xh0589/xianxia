/**
 * wave86-beast-collector-node.js — 第八十六波 · 散修寻兽录 验收：
 *   A 地区账清死名：「东海」「天空」从来不是舆图域名——挂死名的兽野外永遇不到（玄龟此前无铺无野等于绝户）
 *   B 水岸落脚：深水格不可通行撒不了兽——浅滩/沉船/冰川别名接通，水兽真能生成；水岸兽况对齐山线
 *   C 坊市独苗入表：火焰虎/影豹野外有了正门（灵兽坊八货架此前就这两只野外绝迹）；19 兽全桥得回模板
 *   D 图鉴寻兽图：栖息地不白给（第八十七波改口径：亲遇/打听见兽径手记，图鉴只写手记里有的）；进化形态标来路；铺子兽标灵兽坊
 *   E 哨兵：精确收服桥原样、位面四兽原样、战斗文件零改动、地图骰序原样、新话术零中英混排
 *
 * 运行：node tests/wave86-beast-collector-node.js
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
var msgs = [];
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
    advanceTime: function () {},
    getAbsoluteDay: function () { return CUR_DAY; },
    onNewDaySubscribe: function () {}
};
global.EventBus = { emit: function () {}, on: function () {} };
global.updateInventoryUI = function () {};
global.updateCurrencyUI = function () {};
global.updateCharacterStatus = function () {};
global.renderBeastList = function () {};
global.getLifeSkill = function () { return 0; };
global.growLifeSkill = function () {};
global.itemById = {};
global.currentCharData = { realm: '金丹', spiritStones: 1000, copper: 0, combatAbilities: [] };
global.inventory = { currency: { spiritStones: 1000, copper: 0 }, slots: [], maxSlots: 30 };
var REALMS = { '炼气': 0, '筑基': 1, '金丹': 2, '元婴': 3, '化神': 4, '炼虚': 5 };
global.REALM_CONFIG = REALMS;
global.getRealmIndex = function (r) { return REALMS[r] != null ? REALMS[r] : -1; };

load('js/beast-taming.js');
load('js/extensions/beast-ecosystem.js');
load('js/map/wild-terrain.js');

var ECO = global.BeastEcosystem;
var WT = global.WildTerrain;
var DIST = ECO.BEAST_DISTRIBUTION;
function byId(id) { return DIST.filter(function (d) { return d.id === id; })[0]; }
function poolNames(region, terrain) {
    return ECO.getBeastPoolForRegion(region, terrain).map(function (d) { return d.name; });
}
function roll(region, terrain, v) {
    return ECO.rollDistributedBeast(region, terrain, function () { return v; });
}

// 舆图上真实存在的域名（regions.js 七域 + 三位面）——分布表只许写真名
var REAL_REGIONS = ['中州', '东荒', '南疆', '西漠', '北冥', '蜀地', '东南海域', '灵界', '魔界', '天界'];

// ==================== A · 地区账清死名 ====================
console.log('\n[A] 地区账：死名清出分布表（挂死名的兽野外永遇不到）');
var deadName = null;
DIST.forEach(function (d) {
    d.regions.forEach(function (r) { if (REAL_REGIONS.indexOf(r) < 0) deadName = deadName || (d.name + '→' + r); });
});
eq(deadName, null, 'A1 19 兽地区名全是舆图真名（漏: ' + deadName + '）');
assert(byId('beast_dragonturtle').regions.indexOf('东荒') >= 0 && byId('beast_dragonturtle').regions.indexOf('东南海域') >= 0, 'A2 龙龟改住东荒·东南海域（东海是城不是域）');
assert(byId('beast_xuangui').regions.indexOf('东海') < 0 && byId('beast_xuangui').regions.length > 0, 'A3 玄龟脱绝户：有真实栖地（此前无铺无野无处可遇）');
assert(byId('beast_thunderbeast').regions.indexOf('天空') < 0 && byId('beast_thunderbeast').regions.length > 0, 'A4 雷兽落户真山（「天空」不是域名，此前只剩高级兽潮一条缝）');
assert(byId('beast_thundereagle').regions.indexOf('天空') < 0, 'A5 雷鹰清死名（东荒/东南海域山地照旧）');
assert(byId('beast_crane').regions.indexOf('天空') < 0 && byId('beast_crane').regions.indexOf('中州') >= 0, 'A6 仙鹤留中州（灵泉/平原）');
assert(byId('beast_kunpeng').regions.indexOf('北冥') >= 0 && byId('beast_kunpeng').regions.indexOf('天空') < 0, 'A7 鲲鹏守北冥（水/山/雪三线）');

// ==================== B · 水岸落脚 ====================
console.log('\n[B] 水岸账：深水撒不了兽，浅滩沉船才是水兽的家');
eq(WT.passable({ t: 'WATER' }), false, 'B1 深水格确实不可通行（旧分布写 WATER 等于白写的根因）');
eq(WT.passable({ t: 'FORD' }), true, 'B2 浅滩可落脚');
eq(WT.passable({ t: 'WRECK' }), true, 'B3 沉船可落脚');
eq(WT.passable({ t: 'GLACIER' }), true, 'B4 冰川可落脚');
var r1 = roll('东荒', 'FORD', 0);
eq(r1 && r1.name, '龙龟', 'B5 东荒浅滩遇龙龟（FORD→WATER 别名接通）');
var r2 = roll('东南海域', 'WRECK', 0);
eq(r2 && r2.name, '龙龟', 'B6 东南海域沉船遇水兽（WRECK→WATER）');
assert(poolNames('东南海域', 'WATER').indexOf('玄龟') >= 0, 'B7 玄龟在东南海域水域名录');
var r3 = roll('北冥', 'GLACIER', 0);
eq(r3 && r3.name, '冰蛇', 'B8 北冥冰川遇冰蛇（GLACIER→SNOW）');
assert(poolNames('北冥', 'SNOW').indexOf('鲲鹏') >= 0, 'B9 鲲鹏雪线名录照旧（冰川别名同池）');
assert(src('js/map/randomMap.js').indexOf("t === 'FORD' || t === 'WRECK') { beastP = 0.06") >= 0, 'B10 水岸兽况对齐山线（0.03 底账→0.06，水兽不再等于无家可归）');
// 幽脉蟒的魔界沼泽照旧（SWAMP 本就可通行，别名不动它）
var r4 = roll('魔界', 'SWAMP', 0);
eq(r4 && r4.name, '幽脉蟒', 'B11 魔界沼泽遇幽脉蟒（第八十五波正门原样）');

// ==================== C · 坊市独苗入表 ====================
console.log('\n[C] 火焰虎/影豹野外入表（灵兽坊八货架此前就这两只野外绝迹）');
eq(DIST.length, 19, 'C1 分布表 17+2=19 兽');
assert(poolNames('南疆', 'VOLCANO').indexOf('火焰虎') >= 0, 'C2 南疆火山有火焰虎（模板账：南疆/西漠/炎城）');
assert(poolNames('西漠', 'DESERT').indexOf('火焰虎') >= 0 && poolNames('西漠', 'DESERT').indexOf('风狼') >= 0, 'C3 西漠荒漠火焰虎与风狼同域');
var r5 = roll('南疆', 'VOLCANO', 0.99);
eq(r5 && r5.name, '火焰虎', 'C4 火山池末位真 roll 得出来（火凤/金乌/火焰虎三兽同池）');
assert(poolNames('南疆', 'FOREST').indexOf('影豹') >= 0, 'C5 南疆林海有影豹（模板账：南疆/万毒谷/迷雾森林）');
assert(poolNames('蜀地', 'FOREST').indexOf('影豹') >= 0, 'C6 蜀地林海有影豹');
var r6 = roll('南疆', 'FOREST', 0.99);
eq(r6 && r6.name, '影豹', 'C7 林海池 roll 得出影豹');
eq(ECO.TEMPLATE_TO_ECO.flame_tiger, 'beast_flametiger', 'C8 火焰虎模板映射在册');
eq(ECO.TEMPLATE_TO_ECO.shadow_panther, 'beast_shadowpanther', 'C9 影豹模板映射在册');
eq(ECO.BEAST_NAME_TO_ID['火焰虎'], 'beast_flametiger', 'C10 中文名映射在册');
eq(ECO.BEAST_NAME_TO_ID['影豹'], 'beast_shadowpanther', 'C11 中文名映射在册');
// 战斗数据 + 收服桥（名字精确匹配，第八十五波口径）
var ftData = ECO.buildWildBeastData(byId('beast_flametiger'));
eq(ftData && ftData._beastTemplateId, 'flame_tiger', 'C12 火焰虎桥得回模板');
eq(ftData.level, 20, 'C13 等级从分布账（20 级炼气档）');
eq(global.getBeastTemplateIdFromEnemy(ftData), 'flame_tiger', 'C14 战后收服桥精确命中火焰虎');
var spData = ECO.buildWildBeastData(byId('beast_shadowpanther'));
eq(global.getBeastTemplateIdFromEnemy(spData), 'shadow_panther', 'C15 战后收服桥精确命中影豹');
// 19 兽全桥（分布表 ↔ 模板表逐只对账，无一悬空）
var allBridge = DIST.every(function (e) { return !!ECO.buildWildBeastData(e); });
eq(allBridge, true, 'C16 19 兽全部桥得回模板');
// 灵兽坊双门并行（铺子照卖，野外照遇——两扇门不互斥）
assert(!!global.BEAST_SHOP_STOCK.flame_tiger && !!global.BEAST_SHOP_STOCK.shadow_panther, 'C17 灵兽坊货架原样（入表不撤铺）');

// ==================== D · 图鉴寻兽图 ====================
// 第八十七波改口径：栖息地不再白给——图鉴只写兽径手记里有的（亲遇/打听得来），
// 未识的如实标「行踪不明」。地形中文表随之移进 beast-lore.js（TERRAIN_CN 唯一真源）。
console.log('\n[D] 图鉴寻兽图（第八十七波：栖息地靠走出来问出来，图鉴只写手记里有的）');
var appSrc = src('js/app.js');
var loreSrc = src('js/extensions/beast-lore.js');
assert(appSrc.indexOf('_evolvedFrom') >= 0 && appSrc.indexOf('distOfTemplate') >= 0 && appSrc.indexOf('loreLineFor') >= 0, 'D1 图鉴走兽径手记反查（进化来路口径保留）');
assert(loreSrc.indexOf('❓ 行踪不明') >= 0 && loreSrc.indexOf('传闻在「') >= 0, 'D2 手记三档话术在册：确讯/传闻/行踪不明');
var terrainCnOk = ['平原', '林海', '山地', '雪线', '水岸', '冻土', '荒漠', '沼泽', '火山', '灵泉'].every(function (cn) {
    return loreSrc.indexOf("'" + cn + "'") >= 0;
});
assert(terrainCnOk, 'D3 地形全中文（WATER 写「水岸」——浅滩沉船都算，不甩英文键名给玩家）');
assert(appSrc.indexOf('培养进化而得') >= 0, 'D4 进化形态标来路（狼王/炎虎王/成年火凤野外遇不到是设计，图鉴写明）');
assert(appSrc.indexOf('灵兽坊亦售幼兽') >= 0 && appSrc.indexOf('灵兽坊售幼兽') >= 0, 'D5 铺子门在图鉴挂账');
// 每只进化形态都有来路可标（evolve.to 全部指向在册模板）
var evoCover = ['wind_wolf_king', 'flame_tiger_king', 'fire_phoenix_adult'].every(function (to) {
    return !!global.BEAST_TEMPLATES[to];
});
eq(evoCover, true, 'D6 三条进化链的形态全在册（来路标注不悬空）');
// 分布兽名字与模板名一字不差（图鉴反查靠名字，错一个字栖息地就空）
var nameOk = DIST.every(function (d) {
    return Object.keys(global.BEAST_TEMPLATES).some(function (k) { return global.BEAST_TEMPLATES[k].name === d.name; });
});
eq(nameOk, true, 'D7 19 兽分布名与模板名一字不差');

// ==================== E · 哨兵 ====================
console.log('\n[E] 哨兵');
var ecoSrc = src('js/extensions/beast-ecosystem.js');
assert(ecoSrc.indexOf("TERRAIN_ALIASES.FORD = 'WATER'") >= 0 && ecoSrc.indexOf("TERRAIN_ALIASES.GLACIER = 'SNOW'") >= 0, 'E1 水岸别名三笔在册');
assert(ecoSrc.indexOf("StateRegistry.register('beastEcosystem'") >= 0, 'E2 生态随档注册原样');
assert(src('js/battle.js').indexOf('第八十六波') < 0, 'E3 战斗文件本波零改动（寻兽账全在生态/地图/图鉴侧）');
var rmSrc = src('js/map/randomMap.js');
assert(rmSrc.indexOf('!c.ley && _eco && _eco.rollDistributedBeast && rng() < 0.3') >= 0, 'E4 第八十四波地图接线与短路序原样（种子骰不漂移）');
eq((rmSrc.match(/const roll = rng\(\);/g) || []).length, 1, 'E5 兽况主骰仍是一次（水岸账只改概率表，不加骰）');
// 位面四兽正门原样（第八十五波的账不回退）
assert(poolNames('灵界', 'SPIRIT_SPRING').indexOf('云角鹿') >= 0 && poolNames('魔界', 'DESERT').indexOf('血鬃魔犬') >= 0, 'E6 位面兽栖地原样');
// 新话术零中英混排（分布表 + 别名段）
var leak = null;
[ecoSrc.slice(ecoSrc.indexOf('var BEAST_DISTRIBUTION'), ecoSrc.indexOf('// ============== 2.')),
 ecoSrc.slice(ecoSrc.indexOf('var TERRAIN_ALIASES'), ecoSrc.indexOf('function rollDistributedBeast'))].forEach(function (txt) {
    (txt.match(/'[^']+'/g) || []).forEach(function (s) {
        var v = s.slice(1, -1);
        if (/[+);({\[,?<>]/.test(v)) return;
        if (/^[a-z0-9_]+(?:[-_:. ][a-z0-9_]+)*$/i.test(v)) return;
        if (/^[A-Za-z0-9_\-:.\/# ]+$/.test(v)) return;
        if (/[A-Za-z]/.test(v) && /[一-龥]/.test(v)) leak = leak || s;
    });
});
eq(leak, null, 'E7 新话术零中英混排（漏: ' + leak + '）');

console.log('\n========== 第八十六波 · 散修寻兽录 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
