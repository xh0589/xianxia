/**
 * wave81-art-wiring-node.js — 第八十一波 · 功法断线接通 + 死账清理 验收：
 *   A 运功页元素标记账：59 页全有标、词表内、名含元素意象随名/无意象随门类老约定
 *   B 专精桥（真实装备流）：学秘籍→装运功页→主修元素如实报——专精账第一次在真实玩法里通电；
 *     老档序列化对象（没有元素字段）走知识账回查桥；没运功法报「没运」原样
 *   C 九门户口：方向秘艺九门映射/在册/槽位归类/同名同组，学五毒功可装可运、施毒开闸
 *   D 老档认账：知识记在旧秘籍 id 上也认得新运功页（只读不补写）；列表折算接线在案
 *   E 死键功法修正：九阳神功两笔死键改真键、御风剑诀风标归木、万剑归宗群攻死键拔除、牌面不撒「百毒不侵」的谎
 *   F 死账清理：功法间相性查询/中文键元素谱/相生表删除；对敌克制表与倍率原样保留（战术账不动）
 *   G 灵根门槛真闸：元素标记让 v12.1 领域规则第一次生效——没对应灵根装不上对应元素页
 *   H 哨兵：桥零骰零写档、新页话术零拉丁、战斗文件零改动
 *
 * 运行：node tests/wave81-art-wiring-node.js
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
global.updateCharacterStatus = function () {};
global.skillPages = [];

load('js/core/knowledge-system.js');
load('js/equipment.js');
load('js/cultivation/cultivation.js');
load('js/items-extended/06-arts.js');
load('js/cultivation/art-effects.js');

var KS = global.KnowledgeSystem;
function setRoots(r) { global.currentCharData.spiritualRoots = r; }
function learn(artId, name) { return KS.learnFromManual(artId, name, { source: 'manual', state: 'learned', completeness: 100 }); }
function allPages() {
    var out = [];
    (global.skillPages || []).forEach(function (pg) { (pg || []).forEach(function (sk) { if (sk && sk.id) out.push(sk); }); });
    return out;
}

// ==================== A · 运功页元素标记账 ====================
console.log('\n[A] 运功页元素标记账');
var pages = allPages();
eq(pages.length, 59, 'A1 运功页 59 张全在册（老 50 + 方向秘艺 9）');
var VOCAB = ['metal', 'wood', 'water', 'fire', 'earth', 'neutral'];
var untagged = pages.filter(function (p) { return VOCAB.indexOf(p.element) < 0; });
eq(untagged.length, 0, 'A2 页页有元素标记且不越五行词表（漏: ' + untagged.map(function (p) { return p.id; }).join(',') + '）');
function el(id) { return (global.findSkillById(id) || {}).element; }
eq(el('skill_14'), 'fire', 'A3 离火心法记火（名含元素意象随名）');
eq(el('skill_10'), 'water', 'A4 寒冰诀记水');
eq(el('skill_18'), 'metal', 'A5 万剑归宗记金（剑归金）');
eq(el('skill_06'), 'neutral', 'A6 混元功记无属（混元=五行未分，第七十九波定稿口径）');
eq(el('skill_50'), 'neutral', 'A7 鸿蒙至尊功记无属');
eq(el('skill_49'), 'earth', 'A8 女娲补天诀记土（抟土补天，名有据）');
eq(el('skill_31'), 'wood', 'A9 回春术记木（医道随木，门类老约定）');
eq(el('skill_38'), 'fire', 'A10 丹道初解记火（炉火炼丹）');

// ==================== B · 专精桥（真实装备流） ====================
console.log('\n[B] 专精桥（专精账第一次在真实玩法里通电）');
eq(global._getMainTechniqueElement(), 'none', 'B1 没运功法报「没运」（第七十九波口径原样）');
learn('art_fire_heart', '离火诀');
eq(global.equipSkill('skill_14', 'skill_main'), true, 'B2 学离火诀→装离火心法页（真实装备流）');
eq(global._getMainTechniqueElement(), 'fire', 'B3 主修元素如实报火（此前槽中页无元素标，恒报无属——专精账空转）');
setRoots({ metal: 0, wood: 0, water: 0, fire: 100, earth: 0 });
eq(global.calculateCultivationExpFromRoots(global.currentCharData, 30), 60, 'B4 火满百运火法：30×2.0=60（第八十波线性账真吃到）');
setRoots({ metal: 0, wood: 0, water: 100, fire: 0, earth: 0 });
eq(global.calculateCultivationExpFromRoots(global.currentCharData, 30), 30, 'B5 水满百运火法：没火根走基准（线性账不罚不奖）');
// 老档序列化对象：槽里的页没有 element 字段 → 知识账回查桥
global.currentSkills.skill_main = { id: 'skill_14', name: '离火心法', type: '内功' };
eq(global._getMainTechniqueElement(), 'fire', 'B6 老档装备对象没元素字段——桥凭知识账上记的秘籍回查出火');
// 桥的回退路：知识条目没记秘籍 id，凭参悟册反查映射谱
KS.techniqueKnowledge['skill_14'].manualId = null;
global.learnedSecrets = ['art_nine_yang'];
eq(global._getMainTechniqueElement(), 'fire', 'B7 条目没记秘籍——凭参悟册反查（九阳神功归离火页，报火，确定论）');
global.learnedSecrets = [];
KS.techniqueKnowledge['skill_14'].manualId = 'art_fire_heart';
// 混元页走均衡账
learn('art_hun_yuan', '混元功');
global.currentSkills.skill_main = global.findSkillById('skill_06');
eq(global._getMainTechniqueElement(), 'neutral', 'B8 混元功页报无属（混元类）');
setRoots({ metal: 20, wood: 20, water: 20, fire: 20, earth: 20 });
eq(global.calculateCultivationExpFromRoots(global.currentCharData, 30), 30, 'B9 全圆饼+混元功：×1.0（第七十九波几何账分毫未动）');

// ==================== C · 九门户口 ====================
console.log('\n[C] 九门户口（方向秘艺上运功栏）');
var NINE = [
    ['art_wu_du', 'skill_51', '五毒功', '内功', 'skill_main'],
    ['art_wan_du', 'skill_52', '万毒归元诀', '内功', 'skill_main'],
    ['art_fen_tian', 'skill_53', '焚天诀', '内功', 'skill_main'],
    ['art_jin_wu', 'skill_54', '金乌诀', '内功', 'skill_main'],
    ['art_shi_xue', 'skill_55', '噬血功', '内功', 'skill_main'],
    ['art_du_chang', 'skill_56', '断肠毒掌', '拳掌', 'skill_sub2'],
    ['art_lie_yan', 'skill_57', '烈焰掌', '拳掌', 'skill_sub2'],
    ['art_zhan_shou', 'skill_58', '沾手功', '轻功', 'skill_sub1'],
    ['art_you_ying', 'skill_59', '幽影步', '轻功', 'skill_sub1']
];
NINE.forEach(function (row, n) {
    eq(KS.MANUAL_TO_SKILL[row[0]], row[1], 'C1.' + (n + 1) + ' 映射在册：' + row[2]);
    var pg = global.findSkillById(row[1]);
    assert(pg && pg.name === row[2] && pg.type === row[3], 'C2.' + (n + 1) + ' 运功页在册同名同型：' + row[2]);
    eq(global.getSkillSlotForType(row[3]), row[4], 'C3.' + (n + 1) + ' 槽位归类：' + row[2] + '→' + row[4]);
});
setRoots({ metal: 20, wood: 20, water: 20, fire: 20, earth: 20 });
learn('art_wu_du', '五毒功');
eq(global.equipSkill('skill_51', 'skill_main'), true, 'C4 学五毒功→装得上主修槽（不再是学了运不了的二等功法）');
eq(global._getMainTechniqueElement(), 'wood', 'C5 五毒功页报木（毒从草木生）');
eq(global.ArtEffects.hasVenom(), true, 'C6 施毒闸原样开（第八十波通道不受户口迁移影响）');
// 同名同组：秘籍层与运功页层双表述不双算
learn('art_fen_tian', '焚天诀');
global.currentSkills.skill_sub2 = null;
var s = global.ArtEffects.summarize(true);
eq(s.elem.fire, 30, 'C7 焚天诀两层表述同组取最高（火伤30一份，不双算）');

// ==================== D · 老档认账 ====================
console.log('\n[D] 老档认账（只读不补写）');
KS.techniqueKnowledge = {};
KS.unlock('art_wan_du', 'learned', { source: 'migrate', manualId: 'art_wan_du' });
eq(KS.canEquip('skill_52'), true, 'D1 老档知识记在旧秘籍 id 上——新运功页也认（canEquip 别名回查）');
eq(KS.canEquip('skill_53'), false, 'D2 没学的不白认（焚天诀页照旧关着）');
eq(KS.getEntry('skill_52'), null, 'D3 认账不补写（新 id 下不造条目，存档零改动）');
var appSrc = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
assert(appSrc.indexOf('第八十一波·老档认账') >= 0 && appSrc.indexOf("resolveSkillId(id)") >= 0, 'D4 运功候选列表把旧秘籍 id 折算回页 id（老档看得见装得上）');

// ==================== E · 死键功法修正 ====================
console.log('\n[E] 死键功法修正（牌面不撒谎，数值不空转）');
var dangSrc = fs.readFileSync(path.join(ROOT, 'js/items-extended/16-dangling-ids.js'), 'utf8');
assert(dangSrc.indexOf('neigong_boost') < 0 && dangSrc.indexOf('max_qi_boost: 60') >= 0, 'E1 九阳神功死键改真键（内功底蕴→真气上限60，汇总器读得到）');
assert(dangSrc.indexOf('hp_regen_boost: 15') >= 0 && dangSrc.indexOf('百毒不侵') < 0, 'E2 血气回复键名对齐口径；「百毒不侵」谎言摘牌（没有免疫机制不吹）');
assert(dangSrc.indexOf('wind: 1.0') < 0 && dangSrc.indexOf("name: '御风剑诀'") >= 0, 'E3 御风剑诀风标归木（风不在五行灵根词表，清风剑法同例）');
var artsSrc = fs.readFileSync(path.join(ROOT, 'js/items-extended/06-arts.js'), 'utf8');
assert(artsSrc.indexOf('aoe_attack') < 0, 'E4 万剑归宗群攻死键拔除（全库没有群攻机制，剑攻+100%真键原样）');
// 真跑账：九阳神功的键汇总器真读得出
global.window.extendedArts.push({ id: 'art_jiuyang', name: '九阳神功', effect: { max_qi_boost: 60, hp_regen_boost: 15 }, elements: { fire: 1.0 } });
global.learnedSecrets = ['art_jiuyang'];
var sj = global.ArtEffects.summarize(true);
eq(sj.flat.maxQi, 60, 'E5 九阳真气上限60进账（此前两笔死键学了白学）');
eq(sj.pct.hpRegen, 15, 'E6 血气回复15%进账');
global.learnedSecrets = [];
global.window.extendedArts.pop();
global.ArtEffects.summarize(true);

// ==================== F · 死账清理 ====================
console.log('\n[F] 死账清理（该删的删，该留的留）');
eq(typeof global.getElementInteraction, 'undefined', 'F1 功法间相性查询已删（零调用死函数+铁律「不准五行相克」）');
eq(typeof global.SKILL_ELEMENT_MAP, 'undefined', 'F2 中文键元素谱已删（键永远查不中的死账）');
eq(typeof global.ELEMENT_INTERACTIONS.mutual_generation, 'undefined', 'F3 相生表已删（唯一消费方就是被删的相性查询）');
assert(global.ELEMENT_INTERACTIONS.mutual_restriction && global.ELEMENT_INTERACTIONS.mutual_restriction['火'] === '金', 'F4 克制表保留（对敌战术账的唯一真源）');
eq(global.getElementalDamageMul('火', '金'), 1.15, 'F5 对敌克制倍率原样（战斗端老账分毫不碰）');
eq(global.getElementalDamageMul('neutral', '金'), 1.0, 'F6 无属不参与克制原样');
var culSrc = fs.readFileSync(path.join(ROOT, 'js/cultivation/cultivation.js'), 'utf8');
assert(culSrc.indexOf('mutual_generation') < 0, 'F7 源里相生表零残留');
assert(typeof global.mergeSkills === 'function', 'F8 功法融合留门不开（函数在位，本波不接——另一批的活）');

// ==================== G · 灵根门槛真闸 ====================
console.log('\n[G] 灵根门槛真闸（v12.1 领域规则第一次真生效）');
learn('art_wu_du', '五毒功');
setRoots({ metal: 0, wood: 0, water: 0, fire: 100, earth: 0 });
global.currentSkills.skill_main = null;
eq(global.equipSkill('skill_51', 'skill_main'), false, 'G1 纯火灵根装不上木属五毒功（没对应灵根修不了对应功法——世界规则，不是配额）');
setRoots({ metal: 0, wood: 1, water: 0, fire: 99, earth: 0 });
eq(global.equipSkill('skill_51', 'skill_main'), true, 'G2 有一分木根就装得上（闸只问有无，不问多寡）');
learn('art_hun_yuan', '混元功');
assert(global.equipSkill('skill_06', 'skill_main') && global._getMainTechniqueElement() === 'neutral', 'G3 无属页人人装得上（混元类门槛最宽原样）');

// ==================== H · 哨兵 ====================
console.log('\n[H] 哨兵');
var segStart = culSrc.indexOf('第八十一波·专精桥');
var segEnd = culSrc.indexOf('return \'neutral\';\n    } catch (e) {');
var seg = culSrc.slice(segStart, segEnd > segStart ? segEnd : culSrc.length);
assert(seg.length > 100, 'H0 桥段切片有效');
eq((seg.match(/Math\.random/g) || []).length, 0, 'H1 专精桥零骰');
assert(seg.indexOf('localStorage') < 0, 'H2 专精桥零写档（知识账只读）');
var bSrc = fs.readFileSync(path.join(ROOT, 'js/battle.js'), 'utf8');
assert(bSrc.indexOf('第八十一波') < 0, 'H3 战斗文件本波零改动（禁止全局数值缩放的老规矩）');
// 新页话术零拉丁
var leak = null;
pages.filter(function (p) { return p.id >= 'skill_51'; }).forEach(function (p) {
    [p.name, p.desc, p.effect].forEach(function (txt) {
        if (/[A-Za-z]/.test(String(txt))) leak = leak || (p.id + ':' + txt);
    });
});
eq(leak, null, 'H4 方向秘艺九页话术零拉丁（漏: ' + leak + '）');
var eqSrc = fs.readFileSync(path.join(ROOT, 'js/equipment.js'), 'utf8');
assert(eqSrc.indexOf('第11页：方向秘艺') >= 0, 'H5 新页段落有波次锚点');
assert(eqSrc.indexOf('window.currentSkills = currentSkills') >= 0, 'H6 运功账导出原样（读键口径没动）');

console.log('\n========== 第八十一波 · 功法断线接通 + 死账清理 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
