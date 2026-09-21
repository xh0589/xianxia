/**
 * wave80-direction-arts-node.js — 第八十波 · 功法方向扩库（毒/灼通道）+ 专精账拉直 验收：
 *   A 新库账：九门方向功法入册、id 全库唯一、品级阶梯与老账同款、effect 键全在解析器口径内
 *   B 毒灼通道：poison_boost/burn_boost ≥10 → hasVenom/hasBurn 有一即真；9 不开闸；老三十八门不白拿
 *   C 汇总与文案：跨功法有一即真合并、describe 报「施毒/灼烧」、专精语义老规矩不叠
 *   D 专精账拉直：乘数 = 1+灵根/100（单灵根80%按80%加成）、天根暗乘移除、面板文案如实
 *   E 接线哨兵：app.js 战斗实体授予 venom/burn 走吸血同款先例、新账零骰零写档、拉丁扫描
 *
 * 运行：node tests/wave80-direction-arts-node.js
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
global.currentCharData = { realm: '筑基', layer: 1, spiritualRoots: { metal: 20, wood: 20, water: 20, fire: 20, earth: 20 } };
global.currentSkills = {};
global.updateCharacterStatus = function () {};
global.learnedSecrets = [];
global.skillPages = [];

load('js/items-extended/06-arts.js');
load('js/cultivation/art-effects.js');
load('js/cultivation/cultivation.js');

var arts = global.extendedArts;
function byId(id) { for (var i = 0; i < arts.length; i++) if (arts[i].id === id) return arts[i]; return null; }
function learn() { global.learnedSecrets = Array.prototype.slice.call(arguments); global.ArtEffects.summarize(true); }

// ==================== A · 新库账 ====================
console.log('\n[A] 新库账（九门方向功法）');
var NEW_IDS = ['art_wu_du', 'art_du_chang', 'art_wan_du', 'art_lie_yan', 'art_fen_tian', 'art_jin_wu', 'art_zhan_shou', 'art_shi_xue', 'art_you_ying'];
eq(arts.length, 47, 'A1 全库 47 门（老三十八 + 新九门，一门不多一门不少）');
var seen = {}, dup = null;
arts.forEach(function (a) { if (seen[a.id]) dup = a.id; seen[a.id] = 1; });
eq(dup, null, 'A2 id 全库唯一（漏: ' + dup + '）');
NEW_IDS.forEach(function (id, n) { assert(!!byId(id), 'A3.' + (n + 1) + ' 新功法在册：' + id); });
// 品级阶梯与老账同款：PIN7 十级档 1500-2000、PIN5 十六至十八级档 5000-6000、PIN3 顶级档 28-30 级 30000-32000
function ladderOk(a) {
    if (a.quality === 'PIN7') return a.level === 10 && a.price >= 1500 && a.price <= 2000;
    if (a.quality === 'PIN5') return a.level >= 16 && a.level <= 18 && a.price >= 5000 && a.price <= 6000;
    if (a.quality === 'PIN3') return a.level >= 28 && a.level <= 30 && a.price >= 30000 && a.price <= 32000;
    return false;
}
NEW_IDS.forEach(function (id, n) { assert(ladderOk(byId(id)), 'A4.' + (n + 1) + ' 品级/等级/价钱守老阶梯：' + id); });
// effect 键全在解析器口径内（写了没人读的键 = 假账，禁止）
var KNOWN_KEYS = ['poison_boost', 'burn_boost', 'fist_attack_boost', 'lifesteal_boost', 'all_attr_boost', 'qi_regen_boost', 'fire_damage_boost', 'counter_boost', 'dodge_boost', 'speed_boost'];
var badKey = null;
NEW_IDS.forEach(function (id) {
    Object.keys(byId(id).effect).forEach(function (k) { if (KNOWN_KEYS.indexOf(k) < 0) badKey = id + ':' + k; });
});
eq(badKey, null, 'A5 新功法 effect 键全在汇总器口径内（漏: ' + badKey + '）');
// 元素标记在词表内（metal/wood/water/fire/earth/neutral——虚属不在功法词表，噬血/幽影记无属）
var ELEM_OK = ['metal', 'wood', 'water', 'fire', 'earth', 'neutral'];
var badElem = null;
NEW_IDS.forEach(function (id) {
    Object.keys(byId(id).elements).forEach(function (k) { if (ELEM_OK.indexOf(k) < 0) badElem = id + ':' + k; });
});
eq(badElem, null, 'A6 元素标记不越词表（漏: ' + badElem + '）');
eq(byId('art_wu_du').elements.wood, 1.0, 'A7 毒功记木（毒从草木生——世界逻辑撑标记）');
eq(byId('art_jin_wu').elements.fire, 1.0, 'A8 金乌诀记火');
eq(arts.filter(function (a) { return a.quality === 'PIN3'; }).length, 5, 'A9 三品账从三门扩到五门（顶级方向不再只有剑）');

// ==================== B · 毒灼通道 ====================
console.log('\n[B] 毒灼通道（≥10 开闸，吸血同款先例）');
learn('art_wu_du');
eq(global.ArtEffects.hasVenom(), true, 'B1 五毒功上身 → 施毒开闸（poison_boost 12 ≥ 10）');
eq(global.ArtEffects.hasBurn(), false, 'B2 毒功不带灼烧（两本账各走各的）');
learn('art_lie_yan');
eq(global.ArtEffects.hasBurn(), true, 'B3 烈焰掌上身 → 灼烧开闸（burn_boost 12）');
eq(global.ArtEffects.hasVenom(), false, 'B4 火掌不带毒');
// 闸在 9 与 10 之间
var savedArts = global.extendedArts;
global.extendedArts = [
    { id: 'art_fake9', name: '试毒九分', effect: { poison_boost: 9, burn_boost: 9 } },
    { id: 'art_fake10', name: '试毒十分', effect: { poison_boost: 10, burn_boost: 10 } }
];
learn('art_fake9');
eq(global.ArtEffects.hasVenom() || global.ArtEffects.hasBurn(), false, 'B5 加成 9 不开闸（能力是有无账，闸口 10）');
learn('art_fake10');
eq(global.ArtEffects.hasVenom() && global.ArtEffects.hasBurn(), true, 'B6 加成 10 恰好开闸');
global.extendedArts = savedArts;
// 老三十八门不白拿毒灼（学遍老库，只该亮吸血一盏——血饮刀法 lifesteal 15）
var OLD_IDS = arts.map(function (a) { return a.id; }).filter(function (id) { return NEW_IDS.indexOf(id) < 0; });
learn.apply(null, OLD_IDS);
eq(global.ArtEffects.hasVenom(), false, 'B7 老三十八门无一施毒（毒灼是新开的方向，不追溯发帽）');
eq(global.ArtEffects.hasBurn(), false, 'B8 老三十八门无一灼烧');
eq(global.ArtEffects.hasLifesteal(), true, 'B9 老吸血账原样（血饮刀法仍亮）');

// ==================== C · 汇总与文案 ====================
console.log('\n[C] 汇总与文案');
learn('art_wan_du', 'art_jin_wu');
eq(global.ArtEffects.hasVenom() && global.ArtEffects.hasBurn(), true, 'C1 毒火双修 → 两闸齐开（有一即真跨功法合并）');
var desc = global.ArtEffects.describe();
assert(desc.indexOf('施毒') >= 0 && desc.indexOf('灼烧') >= 0, 'C2 面板文案报得出「施毒/灼烧」');
var s = global.ArtEffects.summarize();
eq(s.elem.fire, 50, 'C3 火伤加成走专精语义取最高（金乌 50 盖过焚天 30——老规矩不叠）');
eq(s.flat.allAttr, 3, 'C4 万毒归元 all_attr 30 ÷10 折点原样');
learn('art_zhan_shou');
var cb = global.ArtEffects.combatBonus();
eq(cb.counter, 20, 'C5 沾手功反击 20 进战斗加成口');
eq(cb.dodge, 10, 'C6 沾手功闪避 10 同口');
learn('art_you_ying', 'art_zhan_shou');
eq(global.ArtEffects.combatBonus().dodge, 45, 'C7 幽影步闪避 45 盖过沾手 10（跨功法同键取最高）');

// ==================== D · 专精账拉直 ====================
console.log('\n[D] 专精账拉直（1 + 灵根/100，天根移除）');
near(global.getRootSpeedMultiplier({ fire: 80 }, 'fire'), 1.8, 'D1 单灵根 80% 就按 +80% 加成（用户定稿原话口径）');
near(global.getRootSpeedMultiplier({ fire: 100 }, 'fire'), 2.0, 'D2 满百 → ×2.0，无暗乘无跳变');
near(global.getRootSpeedMultiplier({ fire: 50 }, 'fire'), 1.5, 'D3 五成 → ×1.5（线性连续）');
near(global.getRootSpeedMultiplier({ fire: 0 }, 'fire'), 1.0, 'D4 零根走基准（修不修得由灵根门槛闸）');
var culSrc = fs.readFileSync(path.join(ROOT, 'js/cultivation/cultivation.js'), 'utf8');
assert(culSrc.indexOf('天根') < 0 && culSrc.indexOf('heaven root') < 0 && culSrc.indexOf('mul *= 1.1') < 0, 'D5 天根暗乘连根拔除（老 AI 无逻辑设定清除）');
assert(culSrc.indexOf('0.8 + value / 200') < 0 && culSrc.indexOf('1 + value / 100') >= 0, 'D6 老 0.8 起步折损公式清除，线性新账在位');
var appSrc = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
assert(appSrc.indexOf("匹配灵根+' + val + '% '") >= 0 && appSrc.indexOf('Math.round(val / 2)') < 0, 'D7 打坐面板如实报占比即加成（不再拿占比冒充半数）');
near(global.getRootBalanceMultiplier({ metal: 20, wood: 20, water: 20, fire: 20, earth: 20 }), 1.0, 'D8 混元均衡账分毫未动（第七十九波定稿不受牵连）');

// ==================== E · 接线哨兵 ====================
console.log('\n[E] 接线哨兵');
assert(appSrc.indexOf("hasVenom") >= 0 && appSrc.indexOf("playerEntity.combatAbilities.push('venom')") >= 0, 'E1 战斗实体授予施毒（吸血同款先例，守卫式接线）');
assert(appSrc.indexOf("hasBurn") >= 0 && appSrc.indexOf("playerEntity.combatAbilities.push('burn')") >= 0, 'E2 战斗实体授予灼烧');
var aeSrc = fs.readFileSync(path.join(ROOT, 'js/cultivation/art-effects.js'), 'utf8');
var seg = aeSrc.slice(aeSrc.indexOf('第八十波·毒灼通道'), aeSrc.indexOf('var pages = _skillPageArts();'));
eq((seg.match(/Math\.random/g) || []).length, 0, 'E3 毒灼通道零骰');
assert(seg.indexOf('localStorage') < 0 && seg.indexOf('currentCharData') < 0, 'E4 毒灼通道零写档（纯派生读数口）');
var bSrc = fs.readFileSync(path.join(ROOT, 'js/battle.js'), 'utf8');
assert(bSrc.indexOf("hasAbility('venom')") >= 0 && bSrc.indexOf("hasAbility('burn')") >= 0, 'E5 战斗端 venom/burn 钩子本就是现成的（本波零改战斗文件）');
assert(bSrc.indexOf('第八十波') < 0, 'E6 战斗文件本波零改动（禁止全局数值缩放的老规矩）');
// 老三十八门牌面一字未动（抽三门哨兵行比对）
var sentinels = [
    ["'art_blood_dao'", 'dao_attack_boost: 50, lifesteal_boost: 15'],
    ["'art_hun_yuan'", 'neutral: 1.0'],
    ["'art_divine_movement'", 'speed_boost: 80, dodge_boost: 40']
];
sentinels.forEach(function (sn, n) {
    var line = artsSrcLine(sn[0]);
    assert(line && line.indexOf(sn[1]) >= 0, 'E7.' + (n + 1) + ' 老功法哨兵行原样：' + sn[0]);
});
function artsSrcLine(idQuote) {
    var src = fs.readFileSync(path.join(ROOT, 'js/items-extended/06-arts.js'), 'utf8');
    return src.split('\n').filter(function (l) { return l.indexOf(idQuote) >= 0; })[0] || '';
}
// 新九门牌面话零拉丁（emoji 图标不算话术）
var leak = null;
NEW_IDS.forEach(function (id) {
    var a = byId(id);
    [a.name, a.desc].forEach(function (txt) {
        if (/[A-Za-z]/.test(txt)) leak = leak || (id + ':' + txt);
    });
});
eq(leak, null, 'E8 新功法名牌/牌面话零拉丁（漏: ' + leak + '）');

console.log('\n========== 第八十波 · 方向扩库 + 专精账拉直 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
