/**
 * wave78-skill-combos-node.js — 第七十八波 · 功法组合全链通电 验收：
 *   A 检测账：真源是运功三槽+参悟册、同型死局解开（运一悟一即点亮）、一门没运不算、老接口未动
 *   B 牌面账：八套组合牌面与账本对得上（风火并一笔、冰封改实话说）、十六门功法全是库中真货
 *   C 汇总河账：点数键（暴击/破防/格挡/闪避/命中）真进战斗加成汇总、百分数键不串门
 *   D 战斗实体账：减伤真减（封顶五成）、反击率真加（封顶六十）、攻击防御百分数老账原样、敌我不串
 *   E 恢复账：生生不息接进每日自然恢复（与功法掌握同一本加法）
 *   F 接线与哨兵：检测源头修正钉位、运功页户口行在册、零骰零新档零经济零拉丁、老导出一个不缺
 *
 * 运行：node tests/wave78-skill-combos-node.js
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
var msgs = [];
global.showMessage = function (m) { msgs.push(String(m)); };
global.document = {
    createElement: function () { return { style: {}, classList: { add: function () {}, remove: function () {} }, innerHTML: '', textContent: '' }; },
    getElementById: function () { return null; },
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
global.setTimeout = function (fn) { return 0; };
global.setInterval = function () { return 0; };
global.timeSystem = { gameTime: { totalMinutes: 0, currentDay: 5 }, advanceTime: function () {}, getAbsoluteDay: function () { return 800; } };
global.currentCharData = { name: '测试修士', realm: '金丹', layer: 1, mood: 80, health: 100, maxHealth: 100, attrs: {}, lifeSkills: {} };
global.getCurrentCharData = function () { return global.currentCharData; };
global.inventory = { currency: { spiritStones: 100, copper: 100 }, slots: [] };
global.currentEquipment = {};
global.currentSkills = {};
global.learnedSecrets = [];
// 十六门组合功法的真名册（id 用库中真号，name 是组合谱认的名字）
var ARTS = {
    art_nine_yang: '九阳神功', art_nine_yin: '九阴真经',
    art_dugu_sword: '独孤九剑', art_wan_jian: '万剑归宗',
    art_taiji_sword: '太极剑法', art_taiji_gong: '太极玄功',
    art_pofeng_dao: '破风刀法', art_liehuo_sword: '烈火剑法',
    art_xuanbing: '玄冰诀', art_bingshuang_sword: '冰霜剑法',
    art_houtu: '厚土诀', art_jingang_palm: '金刚掌',
    art_qingmu: '青木诀', art_qingfeng_sword: '清风剑法',
    art_jinfeng: '金锋诀', art_zhuxian: '诛仙剑诀'
};
global.itemById = {};
Object.keys(ARTS).forEach(function (id) { global.itemById[id] = { id: id, name: ARTS[id], type: 'secret_art' }; });
// battle.js 加载所需（v20.64/wave73 同款桩）
global.getBondBonuses = function () { return {}; };
global.getPlayerWeaponSkill = function () { return 0; };
global.resolveWeaponDamageType = function () { return 'slash'; };
global.getCombatBonuses = undefined;
global.getDerivedCombatStats = function () { return { counter: 0 }; };
global.currentEquipment = {};
global.window.currentEquipment = global.currentEquipment;
global.window.TalismanSystem = null;
global.window.partySystem = { partyData: { members: [], formation: 'default', fallen: [], battleLog: [] }, processPostBattleRelationships: function () {} };

load('js/cultivation/cultivation.js');
load('js/inventory.js');
load('js/physiology-config.js');
load('js/battle-injuries.js');
load('js/battle.js');

var GC = global.getCombatBonuses;
var Entity = global.Entity, Battle = global.Battle;
var origRandom = Math.random;
function withRandom(v, fn) {
    Math.random = function () { return v; };
    try { return fn(); } finally { Math.random = origRandom; }
}
function wear(main, sub1, sub2) {
    global.currentSkills = {};
    if (main) global.currentSkills.skill_main = { id: main, name: ARTS[main] };
    if (sub1) global.currentSkills.skill_sub1 = { id: sub1, name: ARTS[sub1] };
    if (sub2) global.currentSkills.skill_sub2 = { id: sub2, name: ARTS[sub2] };
}
function learn(ids) { global.learnedSecrets = ids.slice(); }
function comboIds() { return global.getActiveSkillCombos().map(function (c) { return c.id; }); }
function reset() { wear(null); learn([]); msgs.length = 0; global.currentCharData.realm = '凡人'; }
function mkPlayer() {
    return new Entity({
        name: '玩家', level: 10,
        attrs: { strength: 30, dexterity: 20, intelligence: 20, willpower: 20, constitution: 30, meridian: 30 },
        skills: { '内功': 40 }, loot: {}, physiologyType: 'humanoid'
    }, 'player');
}
function mkEnemy() {
    return new Entity({
        name: '强敌', level: 10,
        attrs: { strength: 30, dexterity: 20, intelligence: 15, willpower: 15, constitution: 30, meridian: 20 },
        skills: { '内功': 35 }, loot: {}, physiologyType: 'humanoid'
    }, 'enemy');
}

// ==================== A · 检测账 ====================
console.log('\n[A] 检测账（真源找对了，死局解开了）');
reset();
eq(comboIds().length, 0, 'A1 没运没悟——一套不亮');
wear('art_taiji_gong', null, 'art_taiji_sword');
eq(comboIds().join(','), 'taiji_domain', 'A2 太极玄功+太极剑法同运——太极领域点亮');
reset();
wear('art_nine_yang', null, null);
learn(['art_nine_yin']);
eq(comboIds().join(','), 'yin_yang_merge', 'A3 同型死局解开：九阳在身上运着、九阴参悟过——阴阳融合点亮（此前物理上凑不齐）');
reset();
wear(null);
learn(['art_nine_yang', 'art_nine_yin']);
eq(comboIds().length, 0, 'A4 两门都只在书里、一门没运——不算配合（道理全在书里不等于阴阳互济）');
reset();
wear('art_dugu_sword', null, null);
learn(['art_wan_jian']);
eq(comboIds().join(','), 'sword_rain', 'A5 独孤九剑运着、万剑归宗悟过——万剑归宗点亮');
reset();
wear('art_taiji_gong', 'art_qingfeng_sword', 'art_taiji_sword');
learn(['art_qingmu']);
var ids6 = comboIds();
assert(ids6.indexOf('taiji_domain') >= 0 && ids6.indexOf('wood_recovery') >= 0, 'A6 多套并行各点各的（太极两门在身上，生生不息一门在运一门悟过）');
// 老接口原样
var old = global.checkSkillCombinations({ skill_main: { name: '九阳神功' }, skill_sub2: { name: '九阴真经' } });
eq(old.length, 1, 'A7 老检测接口原样能用（按传入账查——签名未动）');
var oldB = global.getSkillCombinationBonuses({ skill_main: { name: '厚土诀' }, skill_sub2: { name: '金刚掌' } });
eq(oldB.defense, 40, 'A8 老加成接口原样（不动如山防御40）');
// 真源修正钉位
var appSrc = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
assert(appSrc.indexOf('window.getSkillComboTotals') >= 0 && appSrc.indexOf('第七十八波·源头修正') >= 0, 'A9 战斗实体的检测源头已修正（真运功账，不再读空口袋）');
assert(appSrc.indexOf('currentCharData.currentSkills || currentCharData.skills') >= 0, 'A10 老读法留作回退（缺新桥不炸旧档世界）');
// 零骰
var rolled = 0;
Math.random = function () { rolled++; return 0.5; };
wear('art_taiji_gong', null, 'art_taiji_sword');
global.getActiveSkillCombos(); global.getSkillComboTotals(); global.getSkillComboFlatBonus(); global.getSkillComboRegenPct();
Math.random = origRandom;
eq(rolled, 0, 'A11 检测全程零骰（组合是定数）');
reset();

// ==================== B · 牌面账 ====================
console.log('\n[B] 牌面账（牌面写什么，账上就有什么）');
var SC = global.SKILL_COMBINATIONS;
eq(SC.length, 8, 'B1 组合还是八套（改账不添不减）');
var wf = SC.filter(function (c) { return c.id === 'wind_fire'; })[0];
eq(wf.bonus.attack, 40, 'B2 风火连天并成一笔攻击40（风与火不再各记一笔空账）');
eq(Object.keys(wf.bonus).length, 1, 'B3 火账风账没人读的日子结束了（就一笔）');
assert(wf.desc.indexOf('伤害+40%') >= 0, 'B4 牌面「伤害+40%」与账对得上');
var ice = SC.filter(function (c) { return c.id === 'ice_freeze'; })[0];
eq(ice.bonus.hit, 20, 'B5 冰封万里改说实话：命中+20');
eq(ice.bonus.block, 10, 'B6 格挡+10');
assert(ice.desc.indexOf('冰冻') < 0 && ice.desc.indexOf('命中+20') >= 0, 'B7 牌面不再挂兑不出的「冰冻」（战斗谱里本无此机制——改牌面不改谎话）');
var taiji = SC.filter(function (c) { return c.id === 'taiji_domain'; })[0];
eq(taiji.bonus.damage_reduce, 20, 'B8 太极领域减伤20在账');
eq(taiji.bonus.counter, 15, 'B9 反击15在账');
var wood = SC.filter(function (c) { return c.id === 'wood_recovery'; })[0];
eq(wood.bonus.health_regen, 50, 'B10 生生不息血气恢复50在账');
eq(wood.bonus.qi_regen, 30, 'B11 真气恢复30在账');
// 十六门全是库中真货
var artsSrc = fs.readFileSync(path.join(ROOT, 'js/items-extended/06-arts.js'), 'utf8');
var missing = [];
SC.forEach(function (c) { c.skills.forEach(function (n) { if (artsSrc.indexOf("'" + n + "'") < 0) missing.push(n); }); });
eq(missing.length, 0, 'B12 组合用的功法门门是库中真货（缺: ' + missing + '）');

// ==================== C · 汇总河账 ====================
console.log('\n[C] 汇总河账（点数键真进战斗加成）');
reset();
wear('art_jinfeng', null, null);
learn(['art_zhuxian']);
var flat1 = global.getSkillComboFlatBonus();
eq(flat1.crit, 20, 'C1 金锋锐气：暴击20进点数账');
eq(flat1.penetrate, 30, 'C2 破击30进点数账');
var gc1 = GC({ attack: 100 });
eq(gc1.crit, 20, 'C3 汇总河真吃到暴击（面板与战斗同一条河）');
eq(gc1.penetrate, 30, 'C4 破防也在河里');
eq(gc1.attack, 100, 'C5 点数账不碰攻击（金锋没有攻击承诺——一分不添）');
reset();
wear('art_houtu', null, null);
learn(['art_jingang_palm']);
var gc2 = GC({});
eq(gc2.block, 20, 'C6 不动如山：格挡20进河');
eq(gc2.defense, undefined, 'C7 防御40是百分数账——不串进点数河（两本分明）');
reset();
wear('art_xuanbing', null, 'art_bingshuang_sword');
var gc3 = GC({});
eq(gc3.hit, 20, 'C8 冰封万里：命中20进河');
eq(gc3.block, 10, 'C9 格挡10进河');
reset();
wear('art_taiji_gong', null, 'art_taiji_sword');
var flat4 = global.getSkillComboFlatBonus();
eq(Object.keys(flat4).length, 0, 'C10 太极领域没有点数键——空表（减伤反击走实体账）');
reset();
var gc5 = GC({ attack: 50 });
eq(gc5.attack, 50, 'C11 没组合——老账分毫不动');

// ==================== D · 战斗实体账 ====================
console.log('\n[D] 战斗实体账（减伤反击真兑现）');
var bt = new Battle(mkPlayer(), mkEnemy());
var p = mkPlayer(), e = mkEnemy();
function dmgTo(def, atk) { return withRandom(0.5, function () { return bt._calculateDamage(atk, def, 0); }); }
p._skillComboBonus = null;
var raw = dmgTo(p, e);
p._skillComboBonus = { damage_reduce: 20 };
eq(dmgTo(p, e), Math.max(1, Math.floor(raw * 0.8)), 'D1 太极领域减伤真减（挨打少两成）');
p._skillComboBonus = { damage_reduce: 90 };
eq(dmgTo(p, e), Math.max(1, Math.floor(raw * 0.5)), 'D2 减伤封顶五成（牌面20，堆到90也只吃50——闸是死的）');
p._skillComboBonus = { damage_reduce: 20 };
var e2 = mkEnemy();
e2._skillComboBonus = { damage_reduce: 20 };
var rawE = withRandom(0.5, function () { return bt._calculateDamage(p, e2, 0); });
var e3 = mkEnemy();
var rawE0 = withRandom(0.5, function () { return bt._calculateDamage(p, e3, 0); });
eq(rawE, rawE0, 'D3 敌人没有组合账（减伤只认玩家实体——敌我不串）');
var weak = { type: 'player', getAttack: function () { return 1; } };
var wall = { type: 'enemy', getDefense: function () { return 100; } };
p._skillComboBonus = { damage_reduce: 50 };
eq(withRandom(0.5, function () { return bt._calculateDamage(wall, p, 0); }) >= 1, true, 'D4 减到骨头也保底一分');
// 反击率
p._skillComboBonus = null;
eq(withRandom(0.05, function () { return bt._tryCounter(p, e, 'chest'); }), null, 'D5 没组合没反击账——骰再好也不反（老账）');
p._skillComboBonus = { counter: 15 };
assert(withRandom(0.10, function () { return bt._tryCounter(p, e, 'chest'); }) !== null, 'D6 太极领域反击15——骰10反出去了');
eq(withRandom(0.20, function () { return bt._tryCounter(p, e, 'chest'); }), null, 'D7 骰20超出15——不反（概率是真的）');
global.getDerivedCombatStats = function () { return { counter: 50 }; };
p._skillComboBonus = { counter: 15 };
assert(withRandom(0.59, function () { return bt._tryCounter(p, e, 'chest'); }) !== null, 'D8 反击封顶六十——骰59仍反（50+15=60封顶点）');
eq(withRandom(0.61, function () { return bt._tryCounter(p, e, 'chest'); }), null, 'D9 骰61过线——不反（以柔克刚不是必反）');
global.getDerivedCombatStats = function () { return { counter: 0 }; };
// 百分数老账原样
p._skillComboBonus = { attack: 50 };
var atkWith = withRandom(0.5, function () { return p.getAttack(); });
p._skillComboBonus = null;
var atkNo = withRandom(0.5, function () { return p.getAttack(); });
eq(atkWith, Math.floor(atkNo * 1.5), 'D10 万剑归宗攻击+50%老账原样（实体乘数未动）');
// 新块零骰
var bSrc = fs.readFileSync(path.join(ROOT, 'js/battle.js'), 'utf8');
var segDR = bSrc.slice(bSrc.indexOf('第七十八波·太极领域兑现：玩家挨打'), bSrc.indexOf('return Math.max(1, damage);', bSrc.indexOf('第七十八波·太极领域兑现')));
eq(segDR.indexOf('Math.random'), -1, 'D11 减伤块零骰');
var segCtr = bSrc.slice(bSrc.indexOf('第七十八波·太极领域兑现：组合的反击率'), bSrc.indexOf('if (rate <= 0 || Math.random()'));
eq(segCtr.indexOf('Math.random'), -1, 'D12 反击块零骰（骰还是老那一枚）');

// ==================== E · 恢复账 ====================
console.log('\n[E] 恢复账（生生不息进自然恢复）');
reset();
wear('art_qingmu', null, null);
learn(['art_qingfeng_sword']);
var rg = global.getSkillComboRegenPct();
eq(rg.hp, 50, 'E1 血气恢复50（牌面数）');
eq(rg.qi, 30, 'E2 真气恢复30');
reset();
var rg0 = global.getSkillComboRegenPct();
eq(rg0.hp, 0, 'E3 没组合——恢复账是零');
eq(rg0.qi, 0, 'E4 真气也是零');
var tsSrc = fs.readFileSync(path.join(ROOT, 'js/time-system.js'), 'utf8');
assert(tsSrc.indexOf('getSkillComboRegenPct') >= 0 && tsSrc.indexOf('eCmbR') >= 0, 'E5 自然恢复接线带守卫（在案）');
var posA = tsSrc.indexOf('sectSignatureQiRegenPct');
var posB = tsSrc.indexOf('getSkillComboRegenPct');
var posC = tsSrc.indexOf('var _hpRec');
assert(posA > 0 && posB > posA && posC > posB, 'E6 加法次序钉位：功法掌握→开山秘艺→组合技→算账（同一本加法）');

// ==================== F · 接线与哨兵 ====================
console.log('\n[F] 接线与哨兵');
var culSrc = fs.readFileSync(path.join(ROOT, 'js/cultivation/cultivation.js'), 'utf8');
var seg = culSrc.slice(culSrc.indexOf('第七十八波 · 组合技全链通电'), culSrc.indexOf('// 0.2.2 #2 五行相克伤害倍率'));
eq((seg.match(/Math\.random/g) || []).length, 0, 'F1 新桥零骰');
assert(seg.indexOf('currentCharData') < 0, 'F2 检测不碰角色账（零新存档字段——运功账与参悟册都是老账）');
assert(seg.indexOf('spiritStones') < 0 && seg.indexOf('copper') < 0, 'F3 组合账零经济');
var invSrc = fs.readFileSync(path.join(ROOT, 'js/inventory.js'), 'utf8');
assert(invSrc.indexOf('getSkillComboFlatBonus') >= 0 && invSrc.indexOf('eCmb') >= 0, 'F4 汇总河接线带守卫');
assert(appSrc.indexOf('组合技·') >= 0 && appSrc.indexOf('getActiveSkillCombos') >= 0, 'F5 运功页户口行在册（点亮的组合挂脸上）');
// 第八十一波·死账清理：getElementInteraction（功法间相性查询）按用户铁律「不准五行相克」删除，不再列入保留名单
['checkSkillCombinations', 'getSkillCombinationBonuses', 'mergeSkills', 'getElementalDamageMul'].forEach(function (fn) {
    assert(typeof global[fn] === 'function', 'F6 老导出在位：' + fn);
});
assert(typeof global.getElementInteraction === 'undefined', 'F6b 功法间相性查询已删（零调用死函数+铁律不准相克）');
var latin = /[A-Za-z]/;
var leak = null;
(SC.map(function (c) { return "'" + c.desc + "'"; }).join(' ').match(/'[^']+'/g) || []).forEach(function (s) {
    var v = s.slice(1, -1);
    if (latin.test(v)) leak = leak || s;
});
eq(leak, null, 'F7 八套牌面零拉丁');
var leak2 = null;
(seg.match(/'[^']+'/g) || []).forEach(function (s) {
    var v = s.slice(1, -1);
    if (/[+);({\[,?<>]/.test(v)) return;
    if (v.indexOf('\\') >= 0) return;
    if (/typeof|===|!==/.test(v)) return;
    if (/^[a-z0-9]+(?:[-_: ][a-z0-9]+)*$/.test(v)) return;
    if (latin.test(v)) leak2 = leak2 || s;
});
eq(leak2, null, 'F8 新桥话术零拉丁（漏: ' + leak2 + '）');
assert(appSrc.indexOf('playerEntity._skillComboBonus = _skillComboBonus') >= 0, 'F9 实体透传老线未动（百分数账照走）');
assert(appSrc.indexOf('_aaMul') >= 0, 'F10 阴阳融合全属性并账老线未动');

console.log('\n========== 第七十八波 · 功法组合全链通电 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
