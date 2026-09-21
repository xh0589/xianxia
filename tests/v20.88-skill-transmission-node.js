/**
 * v20.88-skill-transmission-node.js — 功法传承担系门禁
 *
 * 覆盖：
 *   A 持有网：50 门功法（尤其 23 门无主功法）在门派功法池中全部可解析、有人认领；
 *     ensureHolders 后掌门/长老 combat.skills 带真实功法名；SECT_DEEP_DATA masters 合并
 *   B 请教：情分+灵石扣费、领悟检定成功→learned、失败→heard 线索、每日一次冷却
 *   C 门槛：好感60/情分30 入口、三品需化神、灵石/情分不足拒收且不扣费
 *   D 传授：NPC 真学会（combat.skills 入档）、情分/好感/敬重上涨、玩家得历练、三品需对方金丹、冷却
 *   E 持久化：StateRegistry 导出/导入回环
 *   F 接线：请教/传授入口进请求菜单、执行分发接管、fixedDef.skills 不再被丢、脚本已挂载
 *
 * 运行：node tests/v20.88-skill-transmission-node.js
 */
'use strict';

var path = require('path');
var fs = require('fs');
var vm = require('vm');

var ROOT = path.resolve(__dirname, '..');
function loadScript(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

var passed = 0, failed = 0;
function ok(cond, label) {
    if (cond) passed++;
    else { failed++; console.log('[FAIL] ' + label); }
}

// ============ 桩世界 ============
var msgs = [];
var dayNow = 100;
var timeCalls = [];
var npcs = {};
var modalLog = [];

function fakeEl(id) {
    return {
        id: id || '', className: '', innerHTML: '', style: {}, dataset: {},
        classList: { add: function () {}, remove: function () {}, contains: function () { return false; } },
        appendChild: function () {}, remove: function () { modalLog.push('remove:' + (this.id || '?')); },
        querySelector: function () { return null; }
    };
}
var bodyChildren = [];
var W = {
    console: { log: function () {}, warn: function () {}, error: function () {} },
    localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
    document: {
        createElement: function () { return fakeEl(); },
        getElementById: function (id) { return id === 'skill-tx-modal' ? (W.__modal || null) : null; },
        querySelector: function () { return null; },
        addEventListener: function () {},
        body: { appendChild: function (el) { bodyChildren.push(el); W.__modal = el; modalLog.push('append'); } }
    },
    showMessage: function (t) { msgs.push(String(t)); },
    timeSystem: {
        advanceTime: function (m, label) { timeCalls.push({ m: m, label: label }); },
        getAbsoluteDay: function () { return dayNow; }
    },
    npcManager: {
        getNPC: function (id) { return npcs[id] || null; },
        getAllNPCs: function () { return Object.keys(npcs).map(function (k) { return npcs[k]; }); }
    },
    currentCharData: { name: '测试子', realm: '元婴', tempering: 0 },
    inventory: { currency: { spiritStones: 5000 } },
    Math: Math, JSON: JSON, Date: Date, parseInt: parseInt, String: String, Object: Object, Array: Array
};
W.window = W;
vm.createContext(W);

function load(rel) {
    var src = loadScript(rel);
    vm.runInContext(src, W, { filename: rel });
}

// 假 NPC 工厂（模拟 npc-system 的 relationship/combat 接口）
function makeNPC(id, name, opts) {
    opts = opts || {};
    return {
        id: id, name: name,
        relationship: {
            affection: opts.affection != null ? opts.affection : 20,
            favor: opts.favor != null ? opts.favor : 0,
            favorMax: 100, respect: 0,
            flags: { has: function () { return false; } }
        },
        combat: { level: opts.level || 40, realm: opts.realm || '金丹', layer: 5, attack: 50, defense: 50, speed: 40, skills: (opts.skills || []).slice() },
        changeFavor: function (n) { this.relationship.favor = Math.max(0, Math.min(this.relationship.favorMax, this.relationship.favor + n)); return this.relationship.favor; },
        changeAffection: function (n) { this.relationship.affection = Math.max(-100, Math.min(100, this.relationship.affection + n)); },
        changeRespect: function (n) { this.relationship.respect = Math.max(0, Math.min(100, this.relationship.respect + n)); },
        recordPlayerAction: function () {}
    };
}

// ============ 加载真实脚本 ============
load('js/core/state-registry.js');
load('js/equipment.js');            // skillPages / findSkillById
load('js/core/knowledge-system.js'); // KnowledgeSystem
ok(!!W.skillPages && !!W.KnowledgeSystem, '桩世界：skillPages 与 KnowledgeSystem 就绪');

// ============ A 持有网（先验静态池，再验功能） ============
load('js/npcs/skill-transmission.js');
var ST = W.SkillTransmission;
ok(!!ST && typeof ST.ensureHolders === 'function', 'A SkillTransmission 模块导出');

// A1 池内每个名称都必须能在 skillPages 解析（防错别字造成哑弹持有者）
var poolNames = {};
Object.keys(ST.SECT_SKILL_POOLS).forEach(function (sect) {
    ST.SECT_SKILL_POOLS[sect].forEach(function (n) { poolNames[n] = sect; });
});
var badNames = Object.keys(poolNames).filter(function (n) {
    var id = W.KnowledgeSystem.resolveSkillId(n, n);
    return !(id && W.KnowledgeSystem.hasDefinition(id));
});
ok(badNames.length === 0, 'A 门派功法池全部名称可解析（坏名：' + badNames.join(',') + '）');

// A2 23 门无主功法全部被认领
var ORPHANS = ['五毒经','万蛊噬心','化血神功','幽冥鬼爪','噬魂术','回春术','金针渡穴','九转还魂','清心咒','金刚伏魔','炼器入门','神匠心得','丹道初解','九转丹诀','符箓大全','穿云箭','流星赶月','八卦阵','天罗地网','追魂夺命','盘古开天斧','女娲补天诀','鸿蒙至尊功'];
var unclaimed = ORPHANS.filter(function (n) { return !poolNames[n]; });
ok(unclaimed.length === 0, 'A 23 门无主功法全部有门派认领（漏：' + unclaimed.join(',') + '）');

// A3 三大本命持有者正确
ok(ST.SECT_SKILL_POOLS['大隐阁'].indexOf('盘古开天斧') >= 0, 'A 盘古开天斧 → 大隐阁（隐世高人）');
ok(ST.SECT_SKILL_POOLS['药王谷'].indexOf('女娲补天诀') >= 0, 'A 女娲补天诀 → 药王谷（医道至高）');
ok(ST.SECT_SKILL_POOLS['逍遥派'].indexOf('鸿蒙至尊功') >= 0, 'A 鸿蒙至尊功 → 逍遥派（隐世仙门）');

// A4 功能：ensureHolders 后掌门带真实功法、长老带非三品
W.sectsData = {
    '药王谷': { type: '正道', power: '小' },
    '逍遥派': { type: '中立', power: '极小' },
    '少林寺': { type: '正道', power: '巨擘' }
};
W.SECT_DEEP_DATA = { '药王谷': { masters: [{ id: 'yw_master_1', name: '孙思邈', skills: ['回春术', '金针渡穴', '九转还魂'] }] } };
npcs['sect_leader_药王谷'] = makeNPC('sect_leader_药王谷', '药老人', { realm: '元婴', skills: ['内功', '剑法'] });
npcs['sect_elder_药王谷_0'] = makeNPC('sect_elder_药王谷_0', '赵长老', { realm: '筑基' });
npcs['sect_leader_逍遥派'] = makeNPC('sect_leader_逍遥派', '无崖子', { realm: '大乘' });
npcs['sect_leader_少林寺'] = makeNPC('sect_leader_少林寺', '释玄慈', { realm: '元婴' });
ST.ensureHolders();
var ywLeader = npcs['sect_leader_药王谷'].combat.skills;
ok(ywLeader.indexOf('女娲补天诀') >= 0 && ywLeader.indexOf('回春术') >= 0, 'A 药王谷掌门持有女娲补天诀+回春术（含 SECT_DEEP_DATA 合并）');
ok(ywLeader.indexOf('内功') >= 0, 'A 原有泛称技能保留（不破坏旧切磋数据）');
ok(npcs['sect_leader_逍遥派']._holdsUltimate === true, 'A 逍遥派掌门标记为本命三品持有者');
ok(npcs['sect_leader_逍遥派'].combat.skills.indexOf('鸿蒙至尊功') >= 0, 'A 逍遥派掌门持有鸿蒙至尊功');
var elderSkills = npcs['sect_elder_药王谷_0'].combat.skills;
ok(elderSkills.length >= 1 && elderSkills.every(function (n) {
    var id = W.KnowledgeSystem.resolveSkillId(n, n);
    var def = id && W.findSkillById ? W.findSkillById(id) : null;
    return !def || def.grade !== '三品';
}), 'A 长老只会非三品（三品是掌门压箱底）');
ST.ensureHolders();
ok(npcs['sect_leader_少林寺'].combat.skills.filter(function (n) { return n === '金刚伏魔'; }).length === 1, 'A ensureHolders 幂等（重复调用不叠技能）');

// ============ B 请教（成功线） ============
var target = npcs['sect_leader_药王谷'];
target.relationship.affection = 70;
target.relationship.favor = 40;
var stonesBefore = W.inventory.currency.spiritStones;
W.__txRng = function () { return 0.01; };  // 必成
var id31 = W.KnowledgeSystem.resolveSkillId('回春术', '回春术');
ok(ST.pickRequest('sect_leader_药王谷', id31) === true, 'B 请教回春术执行成功');
ok(W.KnowledgeSystem.knows(id31, 'learned'), 'B 领悟检定通过 → learned（可装备）');
ok(target.relationship.favor === 30, 'B 九品扣情分 10（40→30）');
ok(W.inventory.currency.spiritStones === stonesBefore - 100, 'B 九品扣灵石 100');
ok(timeCalls.some(function (t) { return t.m === 120 && t.label === '请教功法'; }), 'B 请教耗半个时辰');
ok(ST._store().req['sect_leader_药王谷'] === dayNow, 'B 冷却入账（每人每日一次）');
msgs = [];
ok(ST.pickRequest('sect_leader_药王谷', id31) === false && msgs.join('').indexOf('今日') >= 0, 'B 当日重复请教被拦');

// ============ B2 请教（失败线 → heard 线索） ============
var id33 = W.KnowledgeSystem.resolveSkillId('九转还魂', '九转还魂');
dayNow = 101;
W.__txRng = function () { return 0.99; };  // 必败
msgs = [];
ST.pickRequest('sect_leader_药王谷', id33);
ok(W.KnowledgeSystem.getState(id33) === 'heard', 'B 检定失败 → 只录「听闻」线索，不白送 learned');
ok(msgs.join('').indexOf('皮毛') >= 0, 'B 失败话术告知线索已录');

// ============ C 门槛 ============
var stranger = makeNPC('sect_elder_少林寺_0', '钱长老', { skills: ['金刚伏魔'] });
npcs[stranger.id] = stranger;
stranger.relationship.affection = 10; stranger.relationship.favor = 0;
msgs = [];
ok(ST.openRequestUI(stranger.id) === false && msgs.join('').indexOf('还不够熟') >= 0, 'C 好感/情分不足进不了请教面板');
stranger.relationship.affection = 70; stranger.relationship.favor = 60;
var id50 = W.KnowledgeSystem.resolveSkillId('鸿蒙至尊功', '鸿蒙至尊功');
stranger.combat.skills.push('鸿蒙至尊功');
msgs = [];
ok(ST.pickRequest(stranger.id, id50) === false && msgs.join('').indexOf('化神') >= 0, 'C 元婴请教三品被境界门槛拦下');
var stonesC = W.inventory.currency.spiritStones;
ok(stranger.relationship.favor === 60 && W.inventory.currency.spiritStones === stonesC, 'C 门槛拦截不扣费');
W.currentCharData.realm = '化神';
W.__txRng = function () { return 0.0; };
ok(ST.pickRequest(stranger.id, id50) === true && W.KnowledgeSystem.knows(id50, 'learned'), 'C 化神后可请教三品（鸿蒙至尊功到手）');
// 情分/灵石不足
var poor = makeNPC('sect_elder_少林寺_1', '孙长老', { skills: ['金刚伏魔'] });
npcs[poor.id] = poor;
poor.relationship.affection = 70; poor.relationship.favor = 15;
msgs = [];
var id35 = W.KnowledgeSystem.resolveSkillId('金刚伏魔', '金刚伏魔');
ok(ST.pickRequest(poor.id, id35) === false && msgs.join('').indexOf('情分不足') >= 0, 'C 情分不够五品束脩被拒');
W.inventory.currency.spiritStones = 10;
poor.relationship.favor = 40;
msgs = [];
ok(ST.pickRequest(poor.id, id35) === false && msgs.join('').indexOf('灵石不足') >= 0, 'C 灵石不够被拒');
W.inventory.currency.spiritStones = 5000;
// 不会的功法不能硬请教
msgs = [];
ok(ST.pickRequest(poor.id, id33) === false && msgs.join('').indexOf('并不会') >= 0, 'C 不能请教对方不会的功法');

// ============ D 传授（玩家→NPC） ============
W.currentCharData.realm = '元婴';
var student = makeNPC('sect_disciple_药王谷_0', '小药童', { realm: '筑基', affection: 40, favor: 5 });
npcs[student.id] = student;
W.currentCharData.tempering = 0;
dayNow = 102;
ok(ST.pickTeach(student.id, id31) === true, 'D 传授回春术执行成功');
ok(student.combat.skills.indexOf('回春术') >= 0, 'D NPC 真学会（combat.skills 入档，切磋/serialize 可见）');
ok(student.relationship.favor === 15 && student.relationship.respect === 4, 'D 传授后情分+10、敬重+4');
ok(W.currentCharData.tempering === 25, 'D 教学相长：玩家历练+25（九品）');
ok(ST._store().taught[student.id].indexOf('回春术') >= 0 && ST._store().stats.transmitted === 1, 'D 传授账本入账');
msgs = [];
// 冷却拦截要走「玩家已学会」的功法（未学会的会先被 knows 检查拦下）
var id34 = W.KnowledgeSystem.resolveSkillId('清心咒', '清心咒');
W.KnowledgeSystem.unlock(id34, 'learned', { source: 'test' });
ok(ST.pickTeach(student.id, id34) === false && msgs.join('').indexOf('今日') >= 0, 'D 每人每日只能讲一次功');
// 自己没学的不能教
var id26 = W.KnowledgeSystem.resolveSkillId('五毒经', '五毒经');
dayNow = 103;
msgs = [];
ok(ST.pickTeach(student.id, id26) === false && msgs.join('').indexOf('还没学会') >= 0, 'D 自己没学会的功法教不了');
// 三品需对方金丹以上
W.KnowledgeSystem.unlock(id50, 'learned', { source: 'test' });
dayNow = 104;
msgs = [];
ok(ST.pickTeach(student.id, id50) === false && msgs.join('').indexOf('金丹') >= 0, 'D 筑基 NPC 承接不住三品');
var elderStudent = makeNPC('sect_elder_药王谷_9', '李长老', { realm: '金丹', affection: 40 });
npcs[elderStudent.id] = elderStudent;
dayNow = 105;
W.currentCharData.tempering = 0;
ok(ST.pickTeach(elderStudent.id, id50) === true && W.currentCharData.tempering === 60, 'D 金丹长老可受三品，玩家历练+60');
// 好感不足
var cold = makeNPC('sect_disciple_药王谷_1', '冷脸弟子', { realm: '炼气', affection: 5 });
npcs[cold.id] = cold;
msgs = [];
ok(ST.openTeachUI(cold.id) === false && msgs.join('').indexOf('交情尚浅') >= 0, 'D 好感<30 进不了传授面板');

// ============ E 持久化 ============
var exported = null;
var out = W.StateRegistry.exportAll();
ok(out && out.skillTransmission && out.skillTransmission.data, 'E StateRegistry 已注册 skillTransmission');
exported = out.skillTransmission.data;
ok(exported.stats.transmitted === 2 && exported.req['sect_leader_药王谷'] === 101, 'E 导出含传授/请教账本');
// 模拟读档：清空后 import 回灌
W.StateRegistry.resetAll();
ok(ST._store().stats.transmitted === 0, 'E reset 清空账本');
W.StateRegistry.importAll({ skillTransmission: exported });
ok(ST._store().stats.transmitted === 2 && ST._store().taught[student.id].indexOf('回春术') >= 0, 'E import 回环恢复账本');

// ============ F 接线（静态源断言） ============
var npcSrc = loadScript('js/npcs/npc-system.js');
var sectSrc = loadScript('js/sects/sect-internal.js');
var html = loadScript('仙侠.html');
ok(npcSrc.indexOf("id: 'transmit_skill', name: '传授功法'") >= 0, 'F 请求菜单新增「传授功法」');
ok(npcSrc.indexOf("transmit_skill: { name: '传授功法'") >= 0, 'F 高级请求类型表新增 transmit_skill');
ok(npcSrc.indexOf("transmit_skill: function(npcId) { closeNpcModal(); return callAdvancedRequest(npcId, 'transmit_skill'); }") >= 0, 'F 深谈处理器接线');
ok(/case 'teach_skill':[\s\S]{0,400}SkillTransmission\.openRequestUI/.test(npcSrc), 'F teach_skill 执行分发改走传功面板');
ok(/case 'transmit_skill':[\s\S]{0,300}SkillTransmission\.openTeachUI/.test(npcSrc), 'F transmit_skill 执行分发接线');
ok(npcSrc.indexOf('result.skipReopen') >= 0 && npcSrc.indexOf('if (result.msg) showMessage') >= 0, 'F callAdvancedRequest 尊重 skipReopen/静默结果（面板不被重开的对话盖住）');
ok(sectSrc.indexOf('fixedDef.skills') >= 0 && sectSrc.indexOf('leaderNPC.combat.skills = (leaderNPC.combat.skills || []).concat(fixedDef.skills)') >= 0, 'F 固定人设顶层 skills 不再被注册流程丢弃');
ok(sectSrc.indexOf('SkillTransmission.ensureHolders') >= 0, 'F 门派NPC注册完即铺持有网');
var iNpc = html.indexOf('js/npcs/npc-system.js');
var iTx = html.indexOf('js/npcs/skill-transmission.js');
ok(iTx > iNpc && iTx > 0, 'F 传功脚本已挂载且晚于 npc-system');

console.log('passed=' + passed + ' failed=' + failed);
process.exit(failed > 0 ? 1 : 0);
