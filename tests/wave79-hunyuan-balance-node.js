/**
 * wave79-hunyuan-balance-node.js — 第七十九波 · 混元均衡账 + 主修元素读键修正 验收：
 *   A 读键账：主修元素读真槽位（skill_main）、没运功法报 'none' 不冒充无属性、老键回退、藏经阁偏路原样
 *   B 专精账：单元素根倍率拉直为 1+灵根/100（第八十波·用户定稿，天根暗乘移除）
 *   C 混元几何平均账（《混元计算.md》定稿）：五行相乘缺一不可、完美均衡1.0、单灵根保底0.1、金四成例63.3%逐位对上、零骰
 *   D 混元功账：元素标记改无属、牌面讲账、价钱效果老账不动、混沌诀太虚拳同列
 *   E 接线与哨兵：打坐结算单口径、对敌克制不动、灵根门槛原样、零新档零拉丁
 *
 * 运行：node tests/wave79-hunyuan-balance-node.js
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
function near(a, b, msg) { assert(Math.abs(a - b) < 1e-9, msg + '（实际=' + a + ' 期望≈' + b + '）'); }
function load(rel) {
    vm.runInThisContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), { filename: rel });
}

// ==================== 世界桩 ====================
global.window = global;
global.showMessage = function () {};
global.document = {
    createElement: function () { return { style: {}, classList: { add: function () {}, remove: function () {} } }; },
    getElementById: function () { return null; },
    querySelector: function () { return null; },
    addEventListener: function () {},
    body: { appendChild: function () {} }
};
var store = {};
global.localStorage = {
    getItem: function (k) { return store[k] !== undefined ? store[k] : null; },
    setItem: function (k, v) { store[k] = String(v); },
    removeItem: function (k) { delete store[k]; }
};
global.timeSystem = { gameTime: { totalMinutes: 0 }, advanceTime: function () {}, getAbsoluteDay: function () { return 800; }, onNewDaySubscribe: function () {} };
global.EventBus = { emit: function () {}, on: function () {} };
global.currentCharData = {
    realm: '筑基', layer: 1,
    spiritualRoots: { metal: 20, wood: 20, water: 20, fire: 20, earth: 20 }
};
global.currentSkills = {};
global.updateCharacterStatus = function () {};

load('js/cultivation/cultivation.js');

var origRandom = Math.random;
function wearMain(art) { global.currentSkills = art ? { skill_main: art } : {}; }
function setRoots(r) { global.currentCharData.spiritualRoots = r; }

// ==================== A · 读键账 ====================
console.log('\n[A] 读键账（主修元素终于读得到真槽位）');
wearMain({ id: 'art_fire_heart', name: '离火诀', elements: { fire: 1.0 } });
eq(global._getMainTechniqueElement(), 'fire', 'A1 运着火法——主修元素如实报火（此前恒报无属性，专精账空转）');
wearMain(null);
eq(global._getMainTechniqueElement(), 'none', 'A2 没运功法报「没运」——不冒充无属性（混元账不白送）');
wearMain({ id: 'art_hun_yuan', name: '混元功', elements: { neutral: 1.0 } });
eq(global._getMainTechniqueElement(), 'neutral', 'A3 混元功在主修槽——报无属性（混元类）');
global.currentSkills = { main: { id: 'x', name: '旧账功法', elements: { water: 1.0 } } };
eq(global._getMainTechniqueElement(), 'water', 'A4 老键回退仍在（旧世界不炸）');
global.currentSkills = {};
global.discipleState = { artInsights: { art_sect_x: { m: 5 } } };
global.SECT_SPECIFIC_ARTS = { '某派': [{ id: 'art_sect_x', type: '内功·某某' }] };
eq(global._getMainTechniqueElement(), 'metal', 'A5 弟子藏经阁偏路原样（掌握度最高的门派功法按类型推断）');
delete global.discipleState; delete global.SECT_SPECIFIC_ARTS;
// 真源整合：修炼经验=基准×倍率
wearMain({ id: 'art_fire_heart', name: '离火诀', elements: { fire: 1.0 } });
setRoots({ metal: 0, wood: 0, water: 0, fire: 100, earth: 0 });
eq(global.calculateCultivationExpFromRoots(global.currentCharData, 30), 60, 'A6 火灵根满百+火法：30×2.0=60（专精账真跑起来了）');
wearMain(null);
eq(global.calculateCultivationExpFromRoots(global.currentCharData, 30), 30, 'A7 没运功法：基准速度分毫不动');
wearMain({ id: 'art_hun_yuan', name: '混元功', elements: { neutral: 1.0 } });
setRoots({ metal: 20, wood: 20, water: 20, fire: 20, earth: 20 });
eq(global.calculateCultivationExpFromRoots(global.currentCharData, 30), 30, 'A8 完美均衡+混元功：30×1.0=30（混元效率的顶就是基准——它的价值在功法自身效果）');

// ==================== B · 专精账（第八十波·用户定稿拉直：1 + 灵根/100） ====================
console.log('\n[B] 专精账（乘数 = 1 + 灵根/100，占比即加成）');
near(global.getRootSpeedMultiplier({ fire: 100 }, 'fire'), 2.0, 'B1 灵根满百 → +100%（1+100/100=2.0，无暗乘）');
near(global.getRootSpeedMultiplier({ fire: 80 }, 'fire'), 1.8, 'B2 单灵根80%就按80%加成（用户原话口径）');
near(global.getRootSpeedMultiplier({ fire: 81 }, 'fire'), 1.81, 'B3 81 → 1.81（线性连续，无闸口跳变）');
near(global.getRootSpeedMultiplier({ fire: 0 }, 'fire'), 1.0, 'B4 没火根 → 基准速度（修不修得由灵根门槛闸，canUseTechniqueByRoots 原样）');
near(global.getRootSpeedMultiplier(null, 'fire'), 1.0, 'B5 没有灵根账——基准（老宽待）');
near(global.getRootEffectMultiplier({ fire: 100 }, 'fire'), 1.15, 'B6 效果倍率老公式原样（0.95+root/500）');
near(global.getRootEffectMultiplier({ fire: 100 }, 'neutral'), 1.0, 'B7 效果倍率的无属性分支原样（混元账只动速度这一本）');

// ==================== C · 混元几何平均账（《混元计算.md》定稿） ====================
console.log('\n[C] 混元几何平均账（五行相乘，缺一不可）');
near(global.getRootBalanceMultiplier({ metal: 20, wood: 20, water: 20, fire: 20, earth: 20 }), 1.0, 'C1 完美均衡：几何结果100% → 倍率1.0（文档验算①）');
near(global.getRootBalanceMultiplier({ metal: 0, wood: 0, water: 0, fire: 100, earth: 0 }), 0.1, 'C2 单灵根：乘积有零归零 → 保底10%（用户最终决定）');
near(global.getRootBalanceMultiplier({ metal: 40, wood: 15, water: 15, fire: 15, earth: 15 }), 0.1 + 0.9 * 0.6328125, 'C3 金四成其余各一成五：几何≈63.3% → 倍率≈0.6695（文档验算③逐位对上）');
near(global.getRootBalanceMultiplier({ fire: 100 }), 0.1, 'C4 缺键按零算——四行为零也是保底10%（练是练得成，逼你补短板）');
near(global.getRootBalanceMultiplier(null), 1.0, 'C5 没有灵根账——基准宽待（缺数据不当罪证）');
near(global.getRootSpeedMultiplier({ metal: 20, wood: 20, water: 20, fire: 20, earth: 20 }, 'neutral'), 1.0, 'C6 速度倍率的无属性分支=混元账（同一本账两个口）');
near(global.getRootSpeedMultiplier({ metal: 20, wood: 20, water: 20, fire: 20, earth: 20 }, 'none'), 1.0, 'C7 「没运功法」不吃混元账（混元是功法的性质）');
near(global.getRootSpeedMultiplier({ fire: 100 }, undefined), 1.0, 'C8 元素缺省走基准（老调用方语义不变）');
eq(global.getRootBalancePct({ metal: 20, wood: 20, water: 20, fire: 20, earth: 20 }), 100, 'C9 混元效率百分数：全圆100');
eq(global.getRootBalancePct({ metal: 0, wood: 0, water: 0, fire: 100, earth: 0 }), 0, 'C10 单灵根0');
eq(global.getRootBalancePct({ metal: 40, wood: 15, water: 15, fire: 15, earth: 15 }), 63, 'C11 金四成其余一成五 → 63（面板口径与文档63.3%同账）');
var rolled = 0;
Math.random = function () { rolled++; return 0.5; };
global.getRootBalanceMultiplier({ metal: 20, wood: 20, water: 20, fire: 20, earth: 20 });
global.getRootBalancePct({ metal: 20, wood: 20, water: 20, fire: 20, earth: 20 });
global.getRootSpeedMultiplier({ fire: 50 }, 'fire');
global._getMainTechniqueElement();
Math.random = origRandom;
eq(rolled, 0, 'C12 三本账全程零骰（偏度是加法，倍率是定数）');

// ==================== D · 混元功账 ====================
console.log('\n[D] 混元功账（名字终于配得上机制）');
var artsSrc = fs.readFileSync(path.join(ROOT, 'js/items-extended/06-arts.js'), 'utf8');
var hunLine = artsSrc.split('\n').filter(function (l) { return l.indexOf("'art_hun_yuan'") >= 0; })[0];
assert(hunLine.indexOf('neutral: 1.0') >= 0, 'D1 混元功改标无属（此前标土——「混元」二字没有机制撑腰）');
assert(hunLine.indexOf('灵根越均衡') >= 0, 'D2 牌面把账讲明白（灵根越均衡，行功越顺）');
assert(hunLine.indexOf('max_qi_boost: 25') >= 0 && hunLine.indexOf('price: 200') >= 0 && hunLine.indexOf('PIN8') >= 0, 'D3 真气上限/价钱/品级老账分毫未动（只改元素标记与牌面话）');
assert(artsSrc.indexOf("'art_chaos'") >= 0 && artsSrc.split('\n').filter(function (l) { return l.indexOf("'art_chaos'") >= 0; })[0].indexOf('neutral') >= 0, 'D4 混沌诀本就是无属（混元类同列）');
assert(artsSrc.split('\n').filter(function (l) { return l.indexOf("'art_taixu_fist'") >= 0; })[0].indexOf('neutral') >= 0, 'D5 太虚拳同列');
// 整合：混元功上主修 → 全链吃均衡账
wearMain({ id: 'art_hun_yuan', name: '混元功', elements: { neutral: 1.0 } });
setRoots({ metal: 10, wood: 10, water: 10, fire: 60, earth: 10 });
eq(global.calculateCultivationExpFromRoots(global.currentCharData, 30), 8, 'D6 偏饼+混元功：几何18.75%→倍率0.26875→30×0.26875取整=8（全链整合，短板真疼）');

// ==================== E · 接线与哨兵 ====================
console.log('\n[E] 接线与哨兵');
var appSrc = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
assert(appSrc.indexOf('五行均衡×') >= 0 && appSrc.indexOf('getRootBalanceMultiplier') >= 0, 'E1 打坐结算单亮均衡口径（混元在运时报饼的圆度）');
assert(appSrc.indexOf("element !== 'neutral' && element !== 'none'") >= 0, 'E2 「没运功法」不误报匹配灵根（口径分清）');
var bSrc = fs.readFileSync(path.join(ROOT, 'js/battle.js'), 'utf8');
assert(bSrc.indexOf('0.2.2 #2 五行相克') >= 0, 'E3 对敌元素克制老账原样（那是战术账，不是修炼账）');
eq(global.canUseTechniqueByRoots({ fire: 50 }, 'fire'), true, 'E4 灵根门槛原样：有火根修得火法');
eq(global.canUseTechniqueByRoots({ fire: 0 }, 'fire'), false, 'E5 没火根修不得火法（老闸不动）');
eq(global.canUseTechniqueByRoots({ metal: 1 }, 'neutral'), true, 'E6 混元类有任一灵根即可修（最自由的门槛原样）');
var culSrc = fs.readFileSync(path.join(ROOT, 'js/cultivation/cultivation.js'), 'utf8');
var segStart = culSrc.indexOf('第七十九波·混元均衡账');
var segEnd = culSrc.indexOf('// effect mult (v9.8 separate from speed)');
var seg = culSrc.slice(segStart, segEnd);
eq((seg.match(/Math\.random/g) || []).length, 0, 'E7 新账零骰');
assert(seg.indexOf('currentCharData') < 0 && seg.indexOf('localStorage') < 0, 'E8 新账零写档（纯派生读数口）');
assert(culSrc.indexOf("'混元功': '土'") < 0 && culSrc.indexOf('SKILL_ELEMENT_MAP') < 0, 'E9 老配对谱死账已清（第八十一波：中文键映射谱永不可命中，连同「混元功记土」死行一并删除）');
var leak = null;
(seg.match(/'[^']+'/g) || []).forEach(function (s) {
    var v = s.slice(1, -1);
    if (/[+);({\[,?<>]/.test(v)) return;
    if (/^[a-z0-9]+(?:[-_: ][a-z0-9]+)*$/.test(v)) return;
    if (/[A-Za-z]/.test(v)) leak = leak || s;
});
eq(leak, null, 'E10 新账话术零拉丁（漏: ' + leak + '）');
assert(bSrc.indexOf('第七十九波') < 0, 'E11 战斗文件本波零改动（修炼账不进战斗——禁止全局数值缩放的老规矩）');

console.log('\n========== 第七十九波 · 混元均衡账 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
