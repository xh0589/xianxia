/**
 * arts-combat-bonus-node.js — 「113 门功法练到顶，战斗加成 +0」专项验收
 *
 * 复核结论（本批实测，2026-10-04，真实 Chrome 走 UI：reload → 点「↩ 继续仙途」）：
 *   · 病灶 A「塞 learnedSecrets 得 0/59」= 误报。learnedSecrets 是 techniqueKnowledge
 *     的**派生镜像**（knowledge-system.js:313-330 由 unlock() 单向生成），不是权威字段；
 *     _skillPageArts 只读 techniqueKnowledge，塞 skill_XX 进去本就不该被认。
 *     ★但底下压着更狠的真病：game-state.js:1097 判 `if (saveData.techniqueKnowledge)`，
 *       存档里那字段是 `{}`——**空对象 truthy** ⇒ 走 importData({})，旧档 learnedSecrets
 *       永不迁移 ⇒ :1104 syncLearnedSecretsList() 把 49 条覆盖成 0。秘籍物品已消耗、功法账
 *       被读档抹掉 ⇒ 不可恢复。**该行在 js/core/ 禁改区，本文件只在此留证据锚。**
 *   · 病灶 B「combatBonus() 没有 attack 通道」= 误报（口径错）。attack 是百分点口径，
 *     走乘区 weaponPct() → app.js:5240 `attack × (1 + pct/100)`；150 是 **+150%（×2.5）**。
 *     往 combatBonus() 塞 attack 会变成平加点数，与乘区两把尺打架。
 *   · 病灶 C「32 门无 MANUAL_TO_SKILL」= 不是缺口，只是「秘籍这条路」没覆盖它们。
 *   · ★真正的 +0：effect 词表与数据实词不符，59 门里 27 门解析结果是 {}。
 *
 * 运行：node tests/arts-combat-bonus-node.js
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

global.window = global;
global.document = {
    getElementById: function () { return null; },
    querySelectorAll: function () { return []; },
    addEventListener: function () {},
    removeEventListener: function () {}
};
global.localStorage = { getItem: function () { return null; }, setItem: function () {} };
global.alert = function () {};
global.showMessage = function () {};
global.mapData = { 中州:{}, 东荒:{}, 南疆:{}, 西漠:{}, 北冥:{}, 蜀地:{}, 东南海域:{} };

load('js/core/knowledge-system.js');
load('js/equipment.js');            // 功法表 skillPages + findSkillById
load('js/cultivation/art-effects.js');
load('js/items-extended/06-arts.js');

// ============ 基准：全量功法规模 ============
function allSkillPages() {
    var out = [];
    (global.skillPages || []).forEach(function (page) {
        (page || []).forEach(function (sk) { if (sk && sk.id) out.push(sk); });
    });
    return out;
}
var ALL = allSkillPages();
var M2S = global.KnowledgeSystem.MANUAL_TO_SKILL;
var ARTS = global.extendedArts || [];

assert(ALL.length === 59, 'B1 skillPages 59 门（实测基准，不是抄来的数字）');
// 浏览器实测 49 条；隔离加载只有 47——另 2 条是 items-extended/16-dangling-ids.js:80
// 把两件悬空 id 的 secret_art 补进 extendedArts 的，那份脚本本测试没加载。
assert(ARTS.length === 47, 'B2 结构化秘籍 47 条（浏览器实测 49，另 2 条由 16-dangling-ids.js 补入）');
assert(fs.readFileSync(path.join(ROOT, 'js/items-extended/16-dangling-ids.js'), 'utf8')
    .indexOf("window.extendedArts.push(it)") >= 0, 'B2b 那 2 条的来处有据');
assert(ALL.every(function (s) { return !!s.effect; }), 'B3 59 门全部带 effect 串（没有空壳）');

// ============ 1 · 识别率：学会的功法必须全部被认，不是 0/59 ============
// 走「秘籍研读」真链路：learnFromManual 把秘籍 id 解析成 skill_XX 落进 techniqueKnowledge。
function learnAll() {
    ALL.forEach(function (sk) {
        var manual = null;
        for (var mid in M2S) { if (M2S[mid] === sk.id) { manual = mid; break; } }
        global.KnowledgeSystem.learnFromManual(manual || sk.id, sk.name, { source: 'manual', completeness: 100 });
    });
    // 无秘籍映射的 32 门走 NPC 授艺那条真链路（npcs/skill-transmission.js:320 同款 unlock）
    ALL.forEach(function (sk) {
        global.KnowledgeSystem.unlock(sk.id, 'learned', { source: 'npc_teaching', completeness: 100 });
    });
}
learnAll();

var sAll = global.ArtEffects.summarize(true);
var recognized = sAll.learned.filter(function (l) { return String(l.id).indexOf('skill_') === 0; }).map(function (l) { return l.id; });
assert(recognized.length === ALL.length,
    '1A 59 门全部被认（实测 ' + recognized.length + '/' + ALL.length + '，不得为 0）');
assert(global.ArtEffects.learnedCount() >= ALL.length,
    '1B learnedCount 如实 ≥ 59（实测 ' + global.ArtEffects.learnedCount() + '）');

// ★老档认账：只往 learnedSecrets 落秘籍 id（秘籍已消耗、旧档只留这层）时，运功层也要出力。
//   这是病灶 A 里本模块能修的那一半——认账口径此前严于功法栏（equipment.js:374-379）。
var savedTk = JSON.stringify(global.KnowledgeSystem.techniqueKnowledge);
global.KnowledgeSystem.importData({});                 // 知识账清空
global.learnedSecrets = ['art_hun_yuan', 'art_zhu_xian_sword', 'art_shi_xue'];
var sLegacy = global.ArtEffects.summarize(true);
var legacyIds = sLegacy.learned.map(function (l) { return l.id; });
var legacySkills = legacyIds.filter(function (id) { return String(id).indexOf('skill_') === 0; });
assert(legacySkills.indexOf('skill_06') >= 0,
    '1C 秘籍 id 在册 ⇒ 对应运功层（skill_06 混元功）也被认，不只认秘籍层');
assert(legacySkills.indexOf('skill_47') >= 0,
    '1D 同上：art_zhu_xian_sword ⇒ skill_47 诛仙剑阵');
assert(sLegacy.learned.length === 6 && legacySkills.length === 3,
    '1E 三本秘籍 ⇒ 秘籍层3 + 运功层3（同门两层同组归一，不是 0 也不是重复计数）；实测 '
    + sLegacy.learned.length + '/' + legacySkills.length);
global.KnowledgeSystem.importData(JSON.parse(savedTk));
global.ArtEffects.summarize(true);

// 词表补齐：解析器读不出数值的门，逐条点名为 0 —— 这是「练到顶 +0」的直接证据
var parser = global.ArtEffects.parseSkillEffect;
var unparsed = ALL.filter(function (sk) { return Object.keys(parser(sk.effect) || {}).length === 0; });
var UTILITY_DOMAINS = ['治疗', '击杀恢复', '锻造成功率', '炼制成功率', '符箓伤害', '射术伤害', '控制', '全属性', '意志'];
// 战斗域以外、ArtEffects 确无消费端的门（逐条点名，改数据时此单会立刻红）
var DEFERRED_IDS = ['skill_30', 'skill_31', 'skill_32', 'skill_33', 'skill_34', 'skill_36', 'skill_37',
    'skill_38', 'skill_39', 'skill_40', 'skill_41', 'skill_42', 'skill_43', 'skill_44', 'skill_45',
    'skill_46', 'skill_49', 'skill_50', 'skill_52', 'skill_55'];
var unparsedCombat = unparsed.filter(function (sk) { return DEFERRED_IDS.indexOf(sk.id) < 0; });
assert(unparsedCombat.length === 0,
    '1F 战斗域功法 effect 串全部可解析（实测漏 ' + unparsedCombat.length + ' 门：'
    + unparsedCombat.map(function (s) { return s.id + '/' + s.effect; }).join('、') + '）');
var unparsedIds = unparsed.map(function (s) { return s.id; }).sort();
assert(unparsedIds.join(',') === DEFERRED_IDS.join(','),
    '1G 读不出数值的门只剩非战斗域那 ' + DEFERRED_IDS.length + ' 门（治疗/锻造/炼制/射术/符箓/控制/'
    + '全属性/意志 + 2 门散文式）——ArtEffects 无对应消费端，如实记账不假装通电；实测 ' + unparsedIds.join(','));
assert(unparsedIds.length === 20,
    '1G2 补齐前 28 门、补齐后 20 门（战斗域净减 8 门：长兵×2 全系×1 毒系×2 吸血×1 反击×1 闪避×1）');

// ============ 2 · attack 通道路径与口径 ============
var appSrc = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
var invSrc = fs.readFileSync(path.join(ROOT, 'js/inventory.js'), 'utf8');

assert(!Object.prototype.hasOwnProperty.call(global.ArtEffects.combatBonus(), 'attack'),
    '2A combatBonus() 不含 attack —— 那是加值制通道，attack 是百分点，硬塞会变成平加点数（两把尺打架）');
assert(appSrc.indexOf('ArtEffects.weaponPct') >= 0, '2B 攻击走乘区：buildPlayerBattleEntity 读 weaponPct');
assert(appSrc.indexOf('(1 + _wpMul / 100)') >= 0,
    '2C ★口径证据★：乘区算法是 attack × (1 + pct/100) ⇒ 剑攻 150 是 **+150%（×2.5）**，不是 ×1.5');
assert(invSrc.indexOf('ArtEffects.combatBonus()') >= 0
    && invSrc.indexOf('ArtEffects.attrBonus()') >= 0,
    '2D 加值制两路（战斗加成/六维底蕴）仍并入 getCombatBonuses/getFinalAttributes');

// 数值口径实例化：诛仙剑诀 sword 150 → 持剑时实体攻击 ×2.5
assert(global.ArtEffects.weaponPct('sword') === 150, '2E 剑攻取最高一门 150（百分点原值）');
var base = 1000;
assert(Math.floor(base * (1 + global.ArtEffects.weaponPct('sword') / 100)) === 2500,
    '2F 1000 攻 × (1+150/100) = 2500（+150% 口径落到实体上的样子）');
assert(global.ArtEffects.weaponPct('fist') > 0 && global.ArtEffects.weaponPct('spear') > 0,
    '2G 拳/枪/剑各走各的武器类（不串味：spear 来自「长兵伤害」实词）');
assert(global.ArtEffects.weaponPct('') === 0,
    '2H 无武器时只有通用攻击百分点算数（数据里无此句式，故为 0——不是漏接）');

// ============ 3 · 无 NaN：任何叠加后战斗属性都是有限数 ============
function finiteDeep(o, pathStr) {
    for (var k in o) {
        if (!Object.prototype.hasOwnProperty.call(o, k)) continue;
        var v = o[k];
        if (typeof v === 'number') {
            assert(isFinite(v), '3 数值有限：' + pathStr + '.' + k + ' = ' + v);
        } else if (v && typeof v === 'object') {
            finiteDeep(v, pathStr + '.' + k);
        }
    }
}
finiteDeep(global.ArtEffects.summarize(true), 'summarize');
finiteDeep(global.ArtEffects.combatBonus(), 'combatBonus');
finiteDeep(global.ArtEffects.attrBonus(), 'attrBonus');
finiteDeep(global.ArtEffects.elemMap(), 'elem');
finiteDeep(global.ArtEffects.weaponPct('sword'), 'weaponPct.sword');
finiteDeep(global.ArtEffects.regenPct(), 'regenPct');
finiteDeep(global.ArtEffects.maxQiBonus(), 'maxQiBonus');

// 逐门单练一遍：每门单独学会时也必须全是有限数（防单门脏值被平均掉）
var dirty = [];
ALL.forEach(function (sk) {
    global.KnowledgeSystem.importData({});
    global.learnedSecrets = [];
    global.KnowledgeSystem.unlock(sk.id, 'learned', { source: 'manual' });
    var s = global.ArtEffects.summarize(true);
    var bag = [s.flat, s.pct, s.elem, global.ArtEffects.combatBonus(), global.ArtEffects.attrBonus()];
    bag.forEach(function (b) {
        for (var k in b) {
            if (typeof b[k] === 'number' && !isFinite(b[k])) dirty.push(sk.id + ':' + k + '=' + b[k]);
        }
    });
});
assert(dirty.length === 0, '3B 59 门逐门单练无 NaN/Infinity（实测脏值 ' + dirty.length + ' 处）');
global.KnowledgeSystem.importData(JSON.parse(savedTk));
global.learnedSecrets = global.KnowledgeSystem.syncLearnedSecretsList();

// ============ 4 · 位置分化：不同品级/类型给不同数，不是全门派一刀切 ============
function learnedOnly(id) {
    global.KnowledgeSystem.importData({});
    global.learnedSecrets = [];
    global.KnowledgeSystem.unlock(id, 'learned', { source: 'manual' });
    return global.ArtEffects.summarize(true);
}
// ============ 4 · 位置分化：不同品级/类型给不同数，不是全门派一刀切 ============
function vector(id) {
    var s = learnedOnly(id);
    var v = [];
    ['sword', 'fist', 'dao', 'spear', 'odd', 'attack', 'defensePct', 'dodgePct', 'critPct',
     'qiRegen', 'hpRegen', 'maxQiPct', 'lifesteal', 'venom', 'allElem'].forEach(function (k) { v.push(s.pct[k] || 0); });
    ['defense', 'dodge', 'counter', 'maxQi', 'allAttr'].forEach(function (k) { v.push(s.flat[k] || 0); });
    ['fire', 'ice', 'water', 'metal', 'void', 'dragon', 'demon'].forEach(function (k) { v.push(s.elem[k] || 0); });
    return v;
}
function firstOf(grade) { return ALL.filter(function (x) { return x.grade === grade; })[0]; }
var g3 = vector(firstOf('三品').id), g5 = vector(firstOf('五品').id), g8 = vector(firstOf('八品').id);
var distinct = {};
[g3, g5, g8].forEach(function (v) { distinct[v.join(',')] = 1; });
assert(Object.keys(distinct).length === 3,
    '4A 三品/五品/八品三档的加成向量两两不同：'
    + firstOf('三品').id + '/' + firstOf('五品').id + '/' + firstOf('八品').id
    + ' = ' + JSON.stringify([g3, g5, g8]));
assert(g5.join(',') !== g8.join(',') && g3.join(',') !== g8.join(','),
    '4B 不是一刀切：三档各有各的数（不是同一个向量复制三份）');
assert(g3.some(function (v, i) { return v > 0 && (g8[i] === 0 || v !== g8[i]); }),
    '4C 三品档在八品档为 0 的维度上出力（高阶功法确实多担一路）');

// 逐门向量两两不同：59 门不允许塌成少数几把尺
var vecCount = {};
ALL.forEach(function (sk) { var v = vector(sk.id); vecCount[v.join(',')] = (vecCount[v.join(',')] || 0) + 1; });
var buckets = Object.keys(vecCount).length;
assert(buckets >= 25,
    '4D 59 门逐门向量至少 ' + buckets + ' 种（塌成 ' + buckets + ' 把尺即为"一刀切"嫌疑；纯 +0 的门算一桶）');

// 类型分化：同类型的门也各给各的数
var byType = {};
ALL.forEach(function (sk) {
    var s = learnedOnly(sk.id);
    var tot = 0;
    ['sword', 'fist', 'dao', 'spear', 'odd', 'attack', 'defensePct', 'dodgePct', 'qiRegen', 'maxQiPct', 'hpRegen', 'critPct', 'lifesteal', 'venom', 'allElem']
        .forEach(function (k) { tot += s.pct[k] || 0; });
    ['defense', 'dodge', 'counter', 'maxQi', 'allAttr'].forEach(function (k) { tot += s.flat[k] || 0; });
    Object.keys(s.elem).forEach(function (k) { tot += s.elem[k]; });
    if (tot > 0) byType[sk.type] = (byType[sk.type] || 0) + tot;
});
var typeVals = Object.keys(byType).map(function (k) { return byType[k]; });
assert(new Set(typeVals).size >= typeVals.length - 1,
    '4E 各类型总加成互不相同（类型分化）: ' + JSON.stringify(byType));

// 专精语义：同键跨功法取最高而非叠加；同门两层归一（点数吸收百分比）
global.KnowledgeSystem.importData({});
global.learnedSecrets = [];
global.KnowledgeSystem.unlock('skill_09', 'learned', { source: 'manual' });
var daoPage = global.ArtEffects.summarize(true).pct.dao;
global.KnowledgeSystem.unlock('art_ten_thousand_sword', 'learned', { source: 'manual' });
var daoPlus = global.ArtEffects.summarize(true).pct.dao;
assert(daoPage === 25 && daoPlus === 25,
    '4F 同键取最高一门而非叠加（烈焰刀 25 与万剑归宗同组不变成 50）');
global.KnowledgeSystem.importData({});
global.learnedSecrets = [];
global.KnowledgeSystem.unlock('skill_06', 'learned', { source: 'manual' });
var sameArt = global.ArtEffects.maxQiBonus();
assert(sameArt.flat === 25 && sameArt.pct === 0,
    '4G 同门两层归一：混元功秘籍+25点 与 运功层+20% 只出点数 25（不双算）');

// ============ 5 · 认账口径与全库一致（病灶 A 的可改半边） ============
var eqSrc = fs.readFileSync(path.join(ROOT, 'js/equipment.js'), 'utf8');
var artSrc = fs.readFileSync(path.join(ROOT, 'js/cultivation/art-effects.js'), 'utf8');
assert(artSrc.indexOf('_artLearned') >= 0, '5A ArtEffects 有单一掌握判定 _artLearned');
assert(artSrc.indexOf('function _knowManual') < 0, '5B 同文件内第二把「算不算学会」的尺已删（_knowManual）');
assert(artSrc.indexOf("ls.indexOf(mid) >= 0") >= 0, '5C 老档反查：秘籍 id 在册即认运功层');
assert(eqSrc.indexOf('window.learnedSecrets.indexOf(skill.id) >= 0') >= 0,
    '5D 功法栏本来就认 learnedSecrets——本模块此前严于它，裂缝的另一半在案');

// 融合回写：新词表键必须能被 cultivation 的效果句生成器原样写回（不许第二把尺）
var culSrc = fs.readFileSync(path.join(ROOT, 'js/cultivation/cultivation.js'), 'utf8');
assert(culSrc.indexOf('_MERGE_FLAT_TEXT') >= 0 && culSrc.indexOf('_MERGE_EFFECT_TEXT') >= 0,
    '5E 融合效果串生成器分了百分点/点数两档（点数键不能被写成 +N%）');
['lifesteal: \'吸血\'', 'venom: \'毒系伤害\'', 'allElem: \'全系伤害\''].forEach(function (frag) {
    assert(culSrc.indexOf(frag) >= 0, '5F 融合写回认得新键：' + frag);
});
assert(parser('反击+20').counter === 20 && parser('反击+20').counter !== undefined, '5G 反击+20 读出点数 20');
assert(parser('闪避+45').dodge === 45, '5H 闪避+45 读出点数 45');
assert(parser('闪避+45%').dodge === undefined && parser('闪避+45%').dodgePct === 45,
    '5I 点数/百分点不串味：闪避+45% 只进 dodgePct');
assert(parser('长兵伤害+55%').spear === 55, '5J 长兵伤害 读进 spear 实词通道');
assert(parser('全系伤害+45%').allElem === 45, '5K 全系伤害读出 allElem');

// ============ 6 · 病灶 A 根因留证（禁改区，本批不动） ============
var gsSrc = fs.readFileSync(path.join(ROOT, 'js/core/game-state.js'), 'utf8');
assert(gsSrc.indexOf('if (saveData.techniqueKnowledge)') >= 0,
    '6A ★未修·留证★ game-state.js:1097 仍以空对象 {} 判真 ⇒ 旧档 learnedSecrets 读档即被抹；'
    + '该文件在 js/core/ 禁改区，已上报主代理裁决');

console.log('\n========================================');
console.log('arts-combat-bonus: ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);