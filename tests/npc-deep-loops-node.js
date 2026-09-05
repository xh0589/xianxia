/**
 * npc-deep-loops-node.js — v20.6 NPC 闭环深化回归
 *
 * 覆盖四条闭环：
 *   ① 玩家进传闻网：pushDeed 入池；任务完成/突破事件自动成传闻
 *   ② 关系边产事件：仇家寻衅（rng 注入必发）→ 嫌隙+传闻+性格渐硬+在场弹窗；
 *      好友回访升温；分劝需声望服人；帮一头两头落账
 *   ③ 传闻改行为：mood 随转述走（失真不改立场）；信任度按五维分化——
 *      同一堆风声，实感重情者信、算计多疑者疑；坏名声婉拒同行
 *   ④ 性格可被事件改变：driftPersonality 钳位 [-90,90]、非法维度拒绝
 *
 * 运行：node tests/npc-deep-loops-node.js
 */
'use strict';

var path = require('path');
var fs = require('fs');
var vm = require('vm');

function loadScript(rel) {
    return fs.readFileSync(path.resolve(__dirname, '..', 'js', rel), 'utf8');
}

var mockWindow = {
    console: console,
    Math: Math, JSON: JSON, Object: Object, Array: Array,
    document: { addEventListener: function () {}, querySelector: function () { return null; } },
    timeSystem: null,
    currentCharData: null,
    npcManager: null,
    NPCLife: null,
    showMessage: null,
    showModal: null,
    gameLog: null,
    addFame: null,
    setNPCRelationshipPair: null,
    adjustNPCRelationshipPair: null,
    EventBus: null,
    StateRegistry: null,
    localStorage: null
};
mockWindow.window = mockWindow;
mockWindow.global = mockWindow;

// ---- 桩：日历 / 日志 / 弹窗 ----
var state = { day: 10, minutes: 0, fame: 30, msgs: [], modals: [] };
mockWindow.timeSystem = {
    getAbsoluteDay: function () { return state.day; },
    advanceTime: function (m) { state.minutes += m; },
    onNewDaySubscribe: function (fn) { state.subs = (state.subs || []).concat([fn]); }
};
mockWindow.gameLog = { add: function () {} };
mockWindow.showMessage = function (t) { state.msgs.push(t); };
mockWindow.showModal = function (title, html) { state.modals.push({ title: title, html: html }); };
mockWindow.addFame = function (n) { state.fame += n; };

// ---- 桩：关系真源镜像（与 npc-system.js 同名 API 同语义）----
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

// ---- 桩：NPC（性格按 trustFactor 设计取值）----
// 信任者：S 眼见为实 + F 重情 − A 沉稳 → 0.5+0.15+0.10-0.15 = 0.60
// 多疑者：N 揣摩 − T 算计 + T起伏 → 0.5-0.10-0.20+0.15 = 0.35
// 传声筒：S+F+T起伏 → 0.5+0.15+0.10+0.15 = 0.90
function mkNpc(id, name, loc, p16) {
    return {
        id: id, name: name, location: loc,
        personality16: p16 || { mind: 0, energy: 0, nature: 0, tactics: 0, identity: 0 },
        npcRelationships: {}, relationship: { affection: 30 },
        changeAffection: function (d) { this.relationship.affection += d; }
    };
}
var TRUST_P16 = { mind: 0, energy: 80, nature: 80, tactics: 0, identity: -80 };
var SKEPTIC_P16 = { mind: 0, energy: -80, nature: -80, tactics: 0, identity: 80 };
var GOSSIP_P16 = { mind: 90, energy: 80, nature: 80, tactics: 0, identity: 80 };

var npcs = [];
mockWindow.npcManager = {
    getAllNPCs: function () { return npcs; },
    getNPC: function (id) { return npcs.find(function (n) { return n.id === id; }) || null; }
};
mockWindow.currentCharData = { name: '玩家', location: '帝都', lifeSkills: { '口才': 50 }, fame: 30, realm: '筑基' };

// ---- 招募桩：player-rumor 加载时即包装此函数 ----
var recruitCalls = [];
mockWindow.recruitNPCFromDialog = function (npcId) { recruitCalls.push(npcId); };

// ---- 加载真链路 ----
var ctx = vm.createContext(mockWindow);
vm.runInContext(loadScript('core/event-bus.js'), ctx);
vm.runInContext(loadScript('core/state-registry.js'), ctx);
vm.runInContext(loadScript('npcs/personality16.js'), ctx);
vm.runInContext(loadScript('npcs/personality-driver.js'), ctx);
vm.runInContext(loadScript('npcs/npc-life-actor.js'), ctx);
vm.runInContext(loadScript('npcs/player-rumor.js'), ctx);
vm.runInContext(loadScript('npcs/npc-rel-events.js'), ctx);

var passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) { passed++; } else { failed++; console.error('[FAIL] ' + msg); }
}

// ============ ① 玩家事迹进传闻池 ============
assert(typeof mockWindow.PlayerRumor.pushDeed === 'function', 'PlayerRumor 就绪');
assert(typeof mockWindow.NPCRelEvents.tickDay === 'function', 'NPCRelEvents 就绪');
assert(mockWindow.recruitNPCFromDialog.__prWrapped === true, '招募入口已被包装');

var deed = mockWindow.PlayerRumor.pushDeed('bad', '你在集市强买了凡人的货');
assert(deed && deed.npcId === 'player' && deed.mood === 'bad', '事迹入池并带善恶定性');
assert(mockWindow.NPCLife.getRumorLog(5)[0].id === deed.id, '事迹居传闻池最前');

// EventBus 驱动：任务完成自动成名
mockWindow.EventBus.emit('quest:completed', { questName: '寻回失牛' });
var top = mockWindow.NPCLife.getRumorLog(3)[0];
assert(top && top.npcId === 'player' && top.mood === 'good' && top.summary.indexOf('寻回失牛') >= 0, '任务完成自动成善闻');
mockWindow.EventBus.emit('cultivation:breakthrough', { realm: '金丹' });
var top2 = mockWindow.NPCLife.getRumorLog(3)[0];
assert(top2 && top2.mood === 'good' && top2.summary.indexOf('金丹') >= 0, '突破天象成善闻');

// ============ ③ 失真不改立场 + 信任分化 ============
var listener = mkNpc('nL', '耳顺', '帝都', GOSSIP_P16);      // 转述者（性格鲜明必走形）
var trusting = mkNpc('nT', '实诚人', '帝都', TRUST_P16);
var skeptic = mkNpc('nS', '多疑客', '帝都', SKEPTIC_P16);
npcs.push(listener, trusting, skeptic);
function hear(npc, rid) {
    var st = mockWindow.NPCLife._store()[npc.id] = mockWindow.NPCLife._store()[npc.id] || { lastActionDay: 0, actionHistory: [] };
    if (!Array.isArray(st.heard)) st.heard = [];
    st.heard.unshift(rid);
}
// 丑事发生在别处（帝都茶楼之外），帝都的耳顺才有转述价值
mockWindow.currentCharData.location = '百花谷';
var badDeed = mockWindow.PlayerRumor.pushDeed('bad', '你收人钱财却误了人时辰');
mockWindow.currentCharData.location = '帝都';
// 底层：mood 随转述走
var raw = mockWindow.P16Driver.distortRumor(listener, badDeed, { day: 10, location: '帝都' });
assert(raw && raw.distorted === true && raw.mood === 'bad', '失真变体保留善恶定性');
// 真链路：耳顺在帝都听闻丑事后讲给两位听众，各自按性格失真入池
hear(listener, badDeed.id);
var vT = mockWindow.NPCLife._spreadRumor(listener, trusting, 10);
var vS = mockWindow.NPCLife._spreadRumor(listener, skeptic, 10);
assert(vT && vT.distorted && vT.mood === 'bad' && vT.variantOf === badDeed.id, '变体入池可溯源且定性不失');
assert(mockWindow.PlayerRumor.knownPlayerRumors('nT').length === 1, '听过即知情（经变体溯源）');
assert(mockWindow.PlayerRumor.knownPlayerRumors('nS').length === 1, '多疑者同样听到');
assert(mockWindow.PlayerRumor.knownPlayerRumors('nL').length >= 1, '传话人自己也听过原闻');
var attT = mockWindow.PlayerRumor.playerRumorAttitude('nT');
var attS = mockWindow.PlayerRumor.playerRumorAttitude('nS');
assert(attT < attS && attT < 0 && attS < 0, '同一桩丑事，实诚人信得更重');
assert(Math.abs(attT) > Math.abs(attS), '信任度按五维分化（数值不同）');

// 没听过 = 无感
assert(mockWindow.PlayerRumor.playerRumorAttitude('nZ') === 0, '未听过者印象为零');

// 面板：风声可见，🌀 标失真
var sec = mockWindow.PlayerRumor.getPlayerRumorSection(trusting, 'nT');
assert(sec.indexOf('他们耳朵里你的风声') >= 0 && sec.indexOf('🌀') >= 0, '面板展示失真风声');
assert(mockWindow.PlayerRumor.getPlayerRumorSection(mkNpc('nZ', '路人戊', '帝都'), 'nZ') === '', '无风声整块不显');

// 坏名声有牙齿：连听三桩丑事的实诚人婉拒同行
for (var i = 0; i < 3; i++) {
    hear(trusting, mockWindow.PlayerRumor.pushDeed('bad', '你又欠人一顿酒钱').id);
}
assert(mockWindow.PlayerRumor.playerRumorAttitude('nT') <= -0.55, '丑事堆叠后恶名成立');
var beforeCalls = recruitCalls.length;
mockWindow.recruitNPCFromDialog('nT');
assert(recruitCalls.length === beforeCalls, '恶名者婉拒同行（原招募未被调用）');
assert(state.msgs[state.msgs.length - 1].indexOf('婉拒') >= 0, '婉拒有话术');
// 好名声放行
var hero = mkNpc('nH', '欣赏者', '帝都', TRUST_P16);
npcs.push(hero);
for (var g = 0; g < 3; g++) {
    hear(hero, mockWindow.PlayerRumor.pushDeed('good', '你护送商队出了山').id);
}
mockWindow.recruitNPCFromDialog('nH');
assert(recruitCalls.length === beforeCalls + 1 && recruitCalls[recruitCalls.length - 1] === 'nH', '好名声正常招募');

// ============ ② 关系边产事件：仇家寻衅 ============
npcs.length = 0;
npcs.push(trusting, skeptic, listener, hero);
var D1 = mkNpc('d1', '赵铁剑', '帝都', { mind: 0, energy: 0, nature: 0, tactics: 0, identity: 0 });
var D2 = mkNpc('d2', '钱快刀', '帝都', { mind: 0, energy: 0, nature: 0, tactics: 0, identity: 0 });
npcs.push(D1, D2);
pairSet(D1, D2, 'enemy', 50);
var aff10 = D1.relationship.affection;
var fired = mockWindow.NPCRelEvents.tickDay(11, { randomSource: function () { return 0; } });
assert(fired === 1, 'rng=0 恰发一起事件');
assert(D1.npcRelationships.d2.strength === 56, '寻衅后嫌隙加深6点');
var topR = mockWindow.NPCLife.getRumorLog(3)[0];
assert(topR && topR.mood === 'bad' && topR.summary.indexOf('当街动起手') >= 0, '械斗进传闻池（定性为恶）');
assert(D1.personality16.nature === -3 && D2.personality16.nature === -3, '刀头见血双方本性渐硬');
assert(mockWindow.NPCRelEvents.duelPending() && mockWindow.NPCRelEvents.duelPending().aId === 'd1', '在场弹窗挂起待决');
assert(state.modals.length === 1 && state.modals[0].title.indexOf('街头械斗') >= 0, '弹窗只在玩家在场时弹出');

// —— 分劝：人微言轻 ——
mockWindow.currentCharData.fame = 30;
var okSep = mockWindow.NPCRelEvents.duelResolve('d1', 'd2', 'sep');
assert(okSep === false, '声望不足分劝失败');
assert(D1.relationship.affection === aff10 - 1 && D2.relationship.affection === aff10 - 1, '分劝失败两头各减一分薄面');

// —— 分劝：声望服人 ——
mockWindow.currentCharData.fame = 60;
var aff11 = D1.relationship.affection, fameB = state.fame;
var okSep2 = mockWindow.NPCRelEvents.duelResolve('d1', 'd2', 'sep');
assert(okSep2 === true, '声望足够分劝成行');
assert(D1.npcRelationships.d2.strength === 44, '分劝后嫌隙降12点');
assert(D1.relationship.affection === aff11 + 2 && D2.relationship.affection === aff11 + 2, '分劝成双方念你的好');
assert(state.fame === fameB + 2, '分劝成声望+2');
assert(D1.personality16.nature === 0 && D2.personality16.nature === 0, '有人出头，本性又软回几分');

// —— 帮一头 ——
mockWindow.setNPCRelationshipPair(D1, D2, 'enemy', 50);
var aff12 = D1.relationship.affection, aff22 = D2.relationship.affection, fameC = state.fame;
var okLeft = mockWindow.NPCRelEvents.duelResolve('d1', 'd2', 'left');
assert(okLeft === true, '帮一头成行');
assert(D1.npcRelationships.d2.strength === 58, '帮一头嫌隙更深8点');
assert(D1.relationship.affection === aff12 + 4 && D2.relationship.affection === aff22 - 6, '帮的记情，对面记名');
assert(state.fame === fameC + 1, '帮一头声望+1');

// —— 人不在场（不同地）不干预 ——
D2.location = '百花谷';
assert(mockWindow.NPCRelEvents.duelResolve('d1', 'd2', 'sep') === false, '人已走开则干预落空');
D2.location = '帝都';

// 不同地的仇家：rng=0 也不该打扰玩家（弹窗数不变）
var modalCount = state.modals.length;
D2.location = '百花谷';
mockWindow.NPCRelEvents.tickDay(12, { randomSource: function () { return 0; } });
assert(D1.npcRelationships.d2.strength === 58 + 6, '不同地仇家照打（世界不因玩家缺席而停）');
assert(state.modals.length === modalCount, '不在场不弹窗');
D2.location = '帝都';
// 清场，避免影响后续
delete D1.npcRelationships.d2; delete D2.npcRelationships.d1;

// —— 好友回访 ——
var F1 = mkNpc('f1', '旧友甲', '帝都'), F2 = mkNpc('f2', '故交乙', '百花谷');
npcs.push(F1, F2);
pairSet(F1, F2, 'friend', 30);
mockWindow.NPCRelEvents.tickDay(13, { randomSource: function () { return 0; } });
assert(F1.npcRelationships.f2.strength === 32, '回访情谊升温2点');
var topF = mockWindow.NPCLife.getRumorLog(2)[0];
assert(topF && topF.mood === 'good' && topF.summary.indexOf('吃茶') >= 0, '回访化作正面见闻');

// rng 高时一切安静（概率制无配额）
var quietFired = mockWindow.NPCRelEvents.tickDay(14, { randomSource: function () { return 0.999; } });
assert(quietFired === 0, 'rng 高时不发事件（概率制）');

// ============ ④ 性格漂移钳位 ============
assert(mockWindow.driftPersonality(F1, 'bogus', 5, 'x') === false, '非法维度拒绝漂移');
mockWindow.driftPersonality(F1, 'nature', 200, '滔天大变');
assert(F1.personality16.nature === 90, '正向漂移钳位 90');
mockWindow.driftPersonality(F1, 'nature', -500, '再大的变');
assert(F1.personality16.nature === -90, '负向漂移钳位 -90');

// ============ ⑤ 威压轨接通（v20.37：fear 从死变量通电） ============
var nsys = loadScript('npcs/npc-system.js');
var slev = loadScript('npcs/secret-leverage.js');
assert(nsys.indexOf("action === 'attack'") >= 0 && /attack[\s\S]{0,80}changeFear\(10\)/.test(nsys),
    'N1 威压涨路：动手打人，挨过打的人怕你（attack → fear+10）');
assert(nsys.indexOf('应你不是因为情分，是因为怕') >= 0 && /fear < requestCost \* 2/.test(nsys),
    'N2 威压有牙：情分不够时威压二比一代付——代付减半、勉强的情记怨');
assert(/fear >= 60[\s\S]{0,120}intimidated/.test(nsys),
    'N3 威压露出：怕到 60，关系形态就叫「畏惧」（情深者先被前几档接住）');
assert(/rel\(npc, 'fear', 15, 0, 100\)/.test(slev),
    'N4 威压涨路：要挟得手威压+15——顺从不是信服，是怕');

console.log('=========================================');
console.log('npc-deep-loops v20.6: ' + passed + ' passed, ' + failed + ' failed');
console.log('=========================================');
if (failed > 0) process.exit(1);
