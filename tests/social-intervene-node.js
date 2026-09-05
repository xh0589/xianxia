/**
 * social-intervene-node.js — v20.5 玩家介入恩怨回归
 *
 * 覆盖：
 *   A: 调停门禁（无仇怨 / 不同地 / 灵石不足各有明确话术且不消耗）
 *   B: 调停成败（rng 注入可复现；成=敌意清零+好感升+声望，败=两头减好感）
 *   C: 添油加醋（假话必达+败露反噬）/ 澄清（无嫌隙拒绝；成功降敌意）
 *   D: 对话面板注入（现场有按钮；远程给需亲至锁定，不整栏消失）
 *   E: 失真开关（难度设置关闭后传闻照扩散但不改口）
 *
 * 运行：node tests/social-intervene-node.js
 */
'use strict';

var path = require('path');
var fs = require('fs');
var vm = require('vm');

var mockWindow = {
    console: console,
    Math: Math, JSON: JSON, Object: Object, Array: Array,
    document: { querySelector: function () { return null; } },
    timeSystem: null,
    currentCharData: null,
    npcManager: null,
    DataManager: null,
    NPCLife: null,
    showMessage: null,
    gameLog: null,
    addFame: null,
    adjustNPCRelationshipPair: null,
    setNPCRelationshipPair: null,
    StateRegistry: null,
    localStorage: null
};
mockWindow.window = mockWindow;
mockWindow.global = mockWindow;
mockWindow.XianXia = mockWindow.XianXia || {};

function loadScript(rel) {
    return fs.readFileSync(path.resolve(__dirname, '..', 'js', rel), 'utf8');
}
var ctx = vm.createContext(mockWindow);
vm.runInContext(loadScript('npcs/personality16.js'), ctx);
vm.runInContext(loadScript('npcs/personality-driver.js'), ctx);
vm.runInContext(loadScript('npcs/social-intervene.js'), ctx);

// ---- 轻量关系真源镜像（与 npc-system.js 同名 API 同语义，此处不载整个 npc-system）----
function pairSet(a, b, type, s) {
    a.npcRelationships[b.id] = { relation: type, strength: s };
    b.npcRelationships[a.id] = { relation: type, strength: s };
}
mockWindow.setNPCRelationshipPair = function (a, b, type, s) { pairSet(a, b, type, Math.round(s)); return true; };
mockWindow.adjustNPCRelationshipPair = function (a, b, delta) {
    var cur = a.npcRelationships[b.id] || { relation: 'neutral', strength: 0 };
    var rel = cur.relation, s = cur.strength;
    if (rel === 'enemy' && delta > 0) {
        s = Math.max(0, s - delta);
        if (s <= 20) { rel = 'neutral'; s = Math.max(0, 20 - s); }
    } else {
        s = Math.max(0, Math.min(100, s + delta));
        if (rel === 'neutral' && s >= 40) rel = 'friend';
    }
    pairSet(a, b, rel, s);
    return { relation: rel, strength: s };
};

// ---- 桩：货币/时间/日志/声望 ----
var state = { stones: 1000, minutes: 0, fame: 0, msgs: [] };
mockWindow.DataManager = {
    deductSpiritStones: function (n) { if (state.stones < n) return false; state.stones -= n; return true; },
    addSpiritStones: function (n) { state.stones += n; }
};
mockWindow.timeSystem = { advanceTime: function (m) { state.minutes += m; } };
mockWindow.gameLog = { add: function () {} };
mockWindow.addFame = function (n) { state.fame += n; };
mockWindow.showMessage = function (t) { state.msgs.push(t); };

// ---- 桩：NPC ----
function mkNpc(id, name, loc) {
    return {
        id: id, name: name, location: loc,
        npcRelationships: {}, relationship: { affection: 30 },
        changeAffection: function (d) { this.relationship.affection += d; }
    };
}
var A = mkNpc('npcA', '沈孤鸿', '帝都');
var B = mkNpc('npcB', '陆九渊', '帝都');
var C = mkNpc('npcC', '温蘅', '帝都');
pairSet(A, B, 'enemy', 60);
mockWindow.npcManager = {
    getAllNPCs: function () { return [A, B, C]; },
    getNPC: function (id) { return [A, B, C].find(function (n) { return n.id === id; }) || null; }
};
mockWindow.NPCLife = {
    _rumors: [],
    getRumorLog: function () { return this._rumors; }
};
mockWindow.NPCLife._rumors.push({ id: 'r7-npcC', day: 7, npcId: 'npcC', npcName: '温蘅', type: 'cultivate', summary: '温蘅闭关三日未出', result: 'success', location: '百花谷', distorted: true });
mockWindow.currentCharData = { name: '玩家', location: '帝都', lifeSkills: { '口才': 50 }, fame: 100 };

var passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) { passed++; } else { failed++; console.error('[FAIL] ' + msg); }
}

// ============ A: 门禁 ============
assert(typeof mockWindow.SocialIntervene.mediateNpcs === 'function', '模块就绪');
var targets = mockWindow.SocialIntervene.mediationTargets(A);
assert(targets.length === 1 && targets[0].npcId === 'npcB', '现场仇家列入调解目标');
assert(mockWindow.SocialIntervene.canMediate('npcA', 'npcC').ok === false, '无仇怨者不可调停');
B.location = '百花谷';
var gateLoc = mockWindow.SocialIntervene.canMediate('npcA', 'npcB');
assert(!gateLoc.ok && gateLoc.reason.indexOf('同地') >= 0, '不同地不可调停且说明缘由');
B.location = '帝都';

// ============ B: 成败可复现 ============
var stonesBefore = state.stones, minBefore = state.minutes, fameBefore = state.fame;
var rOk = mockWindow.SocialIntervene.mediateNpcs('npcA', 'npcB', { randomSource: function () { return 0; } });
assert(rOk && rOk.success === true, 'rng=0 必成');
assert(A.npcRelationships.npcB.relation === 'neutral', '成功后敌意清零转普通');
assert(A.relationship.affection === 35 && B.relationship.affection === 35, '成则双方好感+5');
assert(state.stones === stonesBefore - 50 && state.minutes === minBefore + 120, '成本=灵石50+120分钟');
assert(state.fame === fameBefore + 3, '成则声望+3');

pairSet(A, B, 'enemy', 60);
var affA0 = A.relationship.affection;
var rFail = mockWindow.SocialIntervene.mediateNpcs('npcA', 'npcB', { randomSource: function () { return 0.99; } });
assert(rFail && rFail.success === false, 'rng=0.99 必败');
assert(A.relationship.affection === affA0 - 3 && B.relationship.affection === affA0 - 3, '败则两头减好感');
assert(A.npcRelationships.npcB.strength === 57 && A.npcRelationships.npcB.relation === 'enemy', '败后仅微缓3点敌意');

// 灵石不足：条件不满足且不消耗时间
pairSet(A, B, 'enemy', 60);
state.stones = 10;
var minB2 = state.minutes;
assert(mockWindow.SocialIntervene.mediateNpcs('npcA', 'npcB') === false, '灵石不足拒绝且不办事');
assert(state.minutes === minB2, '被拒时不消耗时间');
state.stones = 1000;

// ============ C: 传闻操纵 ============
// 无嫌隙不可澄清
assert(mockWindow.SocialIntervene.playRumorAction('npcA', 'npcC', 'clear') === false, '无仇怨无从澄清（且不扣钱）');
// 添油加醋：无人察觉（rng 高）
var r1 = mockWindow.SocialIntervene.playRumorAction('npcA', 'npcC', 'stoke', { randomSource: function () { return 0.99; } });
assert(r1 && r1.success && !r1.exposed, '添油加醋必达且未败露');
assert(A.npcRelationships.npcC.relation === 'enemy', '听者对当事人起恶感（结仇）');
assert(A.relationship.affection > 32, '听者记你的"情"');
// 败露反噬：先恢复关系，rng=0 触发败露
A.npcRelationships.npcC = null; delete A.npcRelationships.npcC; delete C.npcRelationships.npcA;
var affC0 = C.relationship.affection, fameC0 = state.fame;
var r2 = mockWindow.SocialIntervene.playRumorAction('npcA', 'npcC', 'stoke', { randomSource: function () { return 0; } });
assert(r2 && r2.exposed === true, 'rng=0 触发败露');
assert(C.relationship.affection === affC0 - 10, '败露后当事人恨你');
assert(state.fame === fameC0 - 5, '败露有损名声');
// 澄清成功：rng=0 → 必成（prob≥40）
pairSet(A, C, 'enemy', 70);
var r3 = mockWindow.SocialIntervene.playRumorAction('npcA', 'npcC', 'clear', { randomSource: function () { return 0; } });
assert(r3 && r3.success === true, '澄清在 rng=0 必成');
assert(A.npcRelationships.npcC.relation === 'neutral', '澄清成功敌意清零');
assert(C.relationship.affection >= affC0 - 10 + 8, '澄清成功当事人念你的好');

// ============ D: 面板注入 ============
pairSet(A, B, 'enemy', 60);
var htmlOn = mockWindow.SocialIntervene.getInterventionButtons(A, 'npcA', false);
assert(htmlOn.indexOf('居中调停') >= 0 && htmlOn.indexOf('陆九渊') >= 0, '现场：出现调停按钮（点名仇家）');
assert(htmlOn.indexOf('添油加醋') >= 0 && htmlOn.indexOf('温蘅') >= 0, '现场：出现传闻操作按钮（点题人物）');
var htmlOff = mockWindow.SocialIntervene.getInterventionButtons(A, 'npcA', true);
assert(htmlOff.indexOf('需亲至') >= 0 && htmlOff.indexOf('onclick') < 0, '远程：栏在但锁死（不整栏消失，无假按钮）');
var htmlNone = mockWindow.SocialIntervene.getInterventionButtons(C, 'npcC', false);
// C 无仇家但有传闻话题（池里 npcC 被排除，若 B 无传闻则应为空）
assert(htmlNone.indexOf('居中调停') < 0, '无仇家者不出现调停按钮');

// ============ E: 失真开关（走 actor 真链路） ============
var actorCtx = vm.createContext(Object.assign({}, mockWindow, {
    EventBus: null, StateRegistry: null, NPCLife: null, P16Driver: mockWindow.P16Driver,
    timeSystem: mockWindow.timeSystem, currentCharData: mockWindow.currentCharData,
    npcManager: mockWindow.npcManager, showMessage: mockWindow.showMessage, document: mockWindow.document
}));
actorCtx.window = actorCtx; actorCtx.global = actorCtx;
vm.runInContext(loadScript('core/event-bus.js'), actorCtx);
vm.runInContext(loadScript('core/state-registry.js'), actorCtx);
vm.runInContext(loadScript('npcs/personality16.js'), actorCtx);
vm.runInContext(loadScript('npcs/personality-driver.js'), actorCtx);
vm.runInContext(loadScript('npcs/npc-life-actor.js'), actorCtx);
// 两个性格鲜明的 NPC：E 张扬者携带"别处新闻"，I 听者必走形
var carrier = { id: 'car', name: '张扬子', location: '帝都', personality16: { mind: 90, energy: 0, nature: 0, tactics: 0, identity: 0 } };
var listener = { id: 'lst', name: '沉默某', location: '帝都', personality16: { mind: -90, energy: 0, nature: 0, tactics: 0, identity: 0 } };
var far = { id: 'far', name: '路人丁', location: '百花谷', personality16: { mind: 0, energy: 0, nature: 0, tactics: 0, identity: 0 } };
actorCtx.npcManager = { getAllNPCs: function () { return [carrier, listener, far]; }, getNPC: function () { return null; } };
actorCtx.NPCLife._rumors().push({ id: 'rX-far', day: 1, npcId: 'far', npcName: '路人丁', type: 'cultivate', summary: '路人丁在百花谷摔了一跤', result: 'success', location: '百花谷' });
actorCtx.NPCLife._store()['car'] = { lastActionDay: 1, actionHistory: [], heard: ['rX-far'] };
var vOn = actorCtx.NPCLife._spreadRumor(carrier, listener, 2);
assert(vOn && vOn.distorted === true, '默认开启：转述走形');
actorCtx._settings = { rumorDistortion: false };
var vOff = actorCtx.NPCLife._spreadRumor(carrier, listener, 3);
assert(vOff && vOff.distorted === false && vOff.summary === '路人丁在百花谷摔了一跤', '开关关闭：只扩散不改口');
assert(vOff && vOff.variantOf === 'rX-far', '关闭失真仍可溯源原闻');

console.log('=========================================');
console.log('social-intervene v20.5: ' + passed + ' passed, ' + failed + ' failed');
console.log('=========================================');
if (failed > 0) process.exit(1);
