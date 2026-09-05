/**
 * v20.30-jealousy-deep-node.js — 吃醋扩容包（接线验收）：
 * 32 桩结构齐、效果函数全分支可跑；余波只认 festival-bridge 账本
 * （declined/stood 才作伤、spent 为证才点名、看过一次账上落旗不再重复）；
 * 试探→敲打链、小心眼 30 日重入、节日伤十二日窗口。
 *
 * 运行： node tests/v20.30-jealousy-deep-node.js
 */
'use strict';

var path = require('path');
var fs = require('fs');
var vm = require('vm');

var passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) passed++;
    else { failed++; console.error('[FAIL] ' + msg); }
}
function loadScript(rel) { return fs.readFileSync(path.resolve(__dirname, '..', rel), 'utf8'); }

function makeNpc(id, name, opts) {
    opts = opts || {};
    return {
        id: id, name: name, gender: opts.gender || 'female',
        relationship: { affection: opts.aff != null ? opts.aff : 50, trust: 0, flags: new Set() },
        memory: {},
        setFlag: function () {}, hasFlag: function () { return false; },
        changeAffection: function (n) { this.relationship.affection += n; }
    };
}
function daoBond(name) { return { type: 'dao_companion', name: name, day: 3, lastMetDay: 3 }; }

var BH = 'sect_leader_百花谷', JG = 'sect_leader_金刚宗';

function makeWorld(opts) {
    opts = opts || {};
    var npcs = opts.npcs || {};
    var w = {
        console: { log: function () {}, warn: function () {}, error: function () {} },
        JSON: JSON, Object: Object, Array: Array,
        Math: { random: function () { return (opts.rng != null ? opts.rng : 0.9); },
                min: Math.min, max: Math.max, floor: Math.floor, round: Math.round },
        Number: Number, Boolean: Boolean, String: String, Set: Set, parseInt: parseInt,
        currentCharData: { location: opts.loc || '', gender: 'male',
            bonds: opts.bonds || {}, energy: 100 },
        npcManager: { getNPC: function (id) { return npcs[id] || null; } },
        timeSystem: {
            getAbsoluteDay: function () { return w.__day; },
            advanceTime: function () {},
            onNewDaySubscribe: function (fn) { w.__dayHooks.push(fn); }
        },
        __day: opts.day != null ? opts.day : 100,
        __dayHooks: [],
        __flags: opts.flags || {},          // hasEventTriggered 账
        __fired: [],                        // triggerPersonalEvent 账
        detectRivalRomance: opts.rival === undefined ? function () { return null; } : opts.rival,
        _ambientRearmOk: function (npc, ev) { return npc.__rearm === true; },
        document: { querySelector: function () { return opts.modal ? {} : null; } },
        setTimeout: function (fn) { fn(); }, // 延迟弹出口在测试里即刻兑现
        NPC_PERSONAL_EVENTS: {},
        hasEventTriggered: function (id) { return !!w.__flags[id]; },
        // 与真门禁同语义的门禁桩（地点/结识/情敌/前置事件）
        canPlayerAccessPersonalEvent: function (eventDef, npc) {
            if (!eventDef || !npc) return false;
            npc.memory.firstMet = true; // 测试环境默认结识过
            if ((w.currentCharData.location || '') !== eventDef.npcId.slice('sect_leader_'.length)) return false;
            if (eventDef.requireRivalRomance && !w.detectRivalRomance(eventDef.npcId)) return false;
            if (eventDef.requireEventDone && !w.__flags[eventDef.requireEventDone]) return false;
            return true;
        },
        triggerPersonalEvent: function (id) {
            var ev = w.NPC_PERSONAL_EVENTS[id];
            if (!ev || !w.canPlayerAccessPersonalEvent(ev, w.npcManager.getNPC(ev.npcId))) return false;
            w.__fired.push(id);
            return true;
        },
        HEROINE_ROSTER: [
            { id: BH, name: '温蘅', sect: '百花谷' },
            { id: 'sect_leader_修罗宫', name: '绯泪', sect: '修罗宫' },
            { id: 'sect_leader_天山派', name: '琤霄凌', sect: '天山派' },
            { id: 'sect_leader_五仙教', name: '蓝凤凰', sect: '五仙教' }
        ]
    };
    w.window = w;
    w.MALE_LEAD_ROSTER = [
        { id: 'sect_leader_铸剑山庄', name: '冶砚', sect: '铸剑山庄' },
        { id: 'sect_leader_药王谷', name: '芩木', sect: '药王谷' },
        { id: 'sect_leader_茅山派', name: '昴既明', sect: '茅山派' },
        { id: JG, name: '赫渊', sect: '金刚宗' }
    ];
    var ctx = vm.createContext(w);
    vm.runInContext(loadScript('js/npcs/jealousy-deep.js'), ctx);
    return w;
}
function rivalFor(rival) {
    return function (id) { return id === rival.id ? null : rival; };
}
function daoOf(id, name) { return { id: id, name: name, isDaoCompanion: true, gender: 'female' }; }
function confessOf(id, name) { return { id: id, name: name, isDaoCompanion: false, gender: 'female' }; }

// ============ A 规模与结构 ============
var W = makeWorld({});
var all = Object.assign({}, W.JEALOUSY_PROBE_EVENTS, W.JEALOUSY_COLD_EVENTS,
    W.JEALOUSY_AFTERMATH_EVENTS, W.JEALOUSY_SULK_EVENTS);
assert(Object.keys(all).length === 32, 'A1 八人×四类=32 桩，一桩不少');
assert(Object.keys(W.JEALOUSY_PROBE_EVENTS).length === 8
    && Object.keys(W.JEALOUSY_COLD_EVENTS).length === 8
    && Object.keys(W.JEALOUSY_AFTERMATH_EVENTS).length === 8
    && Object.keys(W.JEALOUSY_SULK_EVENTS).length === 8,
    'A2 四类各 8 桩：试探/敲打/余波/小心眼');
var structOk = true, effectOk = true, optionCount = 0;
Object.keys(all).forEach(function (k) {
    var ev = all[k];
    if (ev.id !== k || !ev.npcId || !ev.title || !ev.scenes) { structOk = false; return; }
    var sel = null;
    ev.scenes.forEach(function (s) { if (s.speaker === 'player_select') sel = s; });
    if (!sel || !sel.options || sel.options.length < 2) { structOk = false; return; }
    optionCount += sel.options.length;
    sel.options.forEach(function (o) {
        var r = ev.effects(W.npcManager.getNPC(ev.npcId) || makeNpc(ev.npcId, 'x'), o.effect);
        if (!r || typeof r.affection !== 'number' || typeof r.msg !== 'string') effectOk = false;
    });
});
assert(structOk, 'A3 每桩都有 id/npcId/title 与至少两个选项的选择场景');
assert(effectOk, 'A4 全部效果函数逐分支跑通，返回 {affection, msg}');
assert(optionCount === 88, 'A5 回应合计 88 个（试探/敲打/余波各3×8，小心眼2×8）');

// ============ B 余波门禁与账本 ============
var bonds = {};
bonds[BH] = daoBond('温蘅'); bonds[JG] = daoBond('赫渊');
var npcs = {}; npcs[BH] = makeNpc(BH, '温蘅', { aff: 60 }); npcs[JG] = makeNpc(JG, '赫渊', { aff: 60, gender: 'male' });
var W2 = makeWorld({ loc: '百花谷', npcs: npcs, bonds: bonds, day: 190 });
assert(W2._jealFindWound(BH) === null, 'B1 无亏欠账（没推过帖）时，「余波」不开门——不许凭空吃醋');
bonds[BH].festival = { qixi_0: { status: 'declined', dueDay: 187, fname: '七夕' } };
bonds[JG].festival = { qixi_0: { status: 'spent', dueDay: 187, fname: '七夕' } };
var wound = W2._jealFindWound(BH);
assert(wound && wound.fkey === 'qixi_0', 'B2 推了帖的道侣，节过后的伤挂得上账');
assert(wound.spentName === '赫渊', 'B3 那一夜确实陪了谁——账本 spent 为证才点名，不编造');
bonds[BH].festival.qixi_0.dueDay = 150; // 伤过了十二日窗口
assert(W2._jealFindWound(BH) === null, 'B4 节过了十二日以上才回家门——伤不翻旧账，窗口内才算数');
bonds[BH].festival.qixi_0.dueDay = 188;
var afterEv = W2.NPC_PERSONAL_EVENTS['bh_event_after'];
assert(W2.canPlayerAccessPersonalEvent(afterEv, npcs[BH]) === true,
    'B5 有伤+人在百花谷 → 门禁放行（requireFestivalWound 生效）');
var W3 = makeWorld({ loc: '金刚宗', npcs: npcs, bonds: bonds, day: 190 });
assert(W3.canPlayerAccessPersonalEvent(afterEv, npcs[BH]) === false,
    'B6 人在别派时推不开百花谷的余波门（余波只在自家门里发生）');

// ============ C 每日钩子：余波弹出 + 一次性落旗 ============
var W4 = makeWorld({ loc: '百花谷', npcs: npcs, bonds: bonds, day: 190 });
bonds[BH].festival = { qixi_0: { status: 'declined', dueDay: 187, fname: '七夕' } };
bonds[JG].festival = { qixi_0: { status: 'spent', dueDay: 187, fname: '七夕' } };
delete npcs[BH].memory.firstMet; npcs[BH].memory = {};
W4.__dayHooks.forEach(function (fn) { fn(); });
assert(W4.__fired.join(',') === 'bh_event_after', 'C1 节后第二日人恰在其门中 → 余波弹出，一天只此一桩');
var composed = W4.NPC_PERSONAL_EVENTS['bh_event_after'];
assert(composed.scenes.length === 4 && composed.scenes[2].text.indexOf('赫渊') >= 0,
    'C2 场景实时拼装：节令景 + 当面对话 + 有实证时点出那一夜陪了谁');
assert(composed.desc.indexOf('七夕') >= 0 && npcs[BH].memory._jealAfterCtx.status === 'declined',
    'C3 拼装把节名与账本状态带进场景与效果上下文');
assert(bonds[BH].festival.qixi_0.aftermathFired === true,
    'C4 弹出成功才落旗——账格记「这伤当面看过了」，来年此节才再记一回合');
W4.__fired.length = 0; W4.__dayHooks.forEach(function (fn) { fn(); });
assert(W4.__fired.indexOf('bh_event_after') === -1, 'C5 落旗之后不重复弹同一节的旧伤（若弹，弹的是别的账——各账各算）');

// ============ D 试探 → 敲打 链 ============
var npcs5 = {}; npcs5[BH] = makeNpc(BH, '温蘅', { aff: 55 });
var W5 = makeWorld({ loc: '百花谷', npcs: npcs5, bonds: {}, rng: 0.01,
    rival: rivalFor({ id: JG, name: '赫渊', isDaoCompanion: true, gender: 'male' }) });
W5.__dayHooks.forEach(function (fn) { fn(); });
assert(W5.__fired.join(',') === 'bh_event_probe', 'D1 有情敌+好感≥40+在其门中 → 试探弹出');
W5.__flags['bh_event_probe'] = true; W5.__fired.length = 0;
W5.__dayHooks.forEach(function (fn) { fn(); });
assert(W5.__fired.join(',') === 'bh_event_cold', 'D2 试探已发生 + 情敌已成道侣（公开事实）→ 敲打');
var npcs6 = {}; npcs6[BH] = makeNpc(BH, '温蘅', { aff: 55 });
var W6 = makeWorld({ loc: '百花谷', npcs: npcs6, bonds: {}, rng: 0.01,
    rival: rivalFor({ id: JG, name: '赫渊', isDaoCompanion: false, gender: 'male' }) });
W6.__dayHooks.forEach(function (fn) { fn(); });
assert(W6.__fired.indexOf('bh_event_cold') === -1, 'D3 情敌只是表白未成契 → 敲打不出（事实未公开，不兴师问罪）');
assert(W6.canPlayerAccessPersonalEvent(W6.NPC_PERSONAL_EVENTS['bh_event_cold'], npcs6[BH]) === false,
    'D4 敲打另有 requireEventDone 门：没经试探，直接摆谱的门也锁死');

// ============ E 小心眼：30 日重入 ============
var npcs7 = {}; npcs7[BH] = makeNpc(BH, '温蘅', { aff: 60 });
var W7 = makeWorld({ loc: '百花谷', npcs: npcs7, bonds: {}, rng: 0.01,
    rival: rivalFor({ id: JG, name: '赫渊', isDaoCompanion: false, gender: 'male' }),
    flags: { bh_event_probe: true, bh_event_sulk: true } });
W7.__dayHooks.forEach(function (fn) { fn(); });
assert(W7.__fired.length === 0, 'E1 小心眼是旧事——已发生且未到重入期，不翻来覆去发');
npcs7[BH].__rearm = true; W7.__dayHooks.forEach(function (fn) { fn(); });
assert(W7.__fired.join(',') === 'bh_event_sulk', 'E2 隔够日子（重入闸开）→ 同一桩小心眼还会再撞见');

// ============ F 文案覆盖：八人余波逐人可弹、场景按节令换装 ============
var SECTS = { bh: '百花谷', xl: '修罗宫', ts: '天山派', wx: '五仙教',
    lu: '铸剑山庄', su: '药王谷', ms: '茅山派', jg: '金刚宗' };
var placeholderSeen = false;
Object.keys(SECTS).forEach(function (p) {
    var sect = SECTS[p], id = 'sect_leader_' + sect;
    var npc = makeNpc(id, sect); npc.memory = {};
    var bb = {}; bb[id] = daoBond(sect);
    bb[id].festival = { chuxi_0: { status: 'stood', dueDay: 359, fname: '除夕' } };
    var npcsMap = {}; npcsMap[id] = npc;
    var Wt = makeWorld({ loc: sect, npcs: npcsMap, bonds: bb, day: 361 });
    Wt.__dayHooks.forEach(function (fn) { fn(); });
    var ev2 = Wt.NPC_PERSONAL_EVENTS[p + '_event_after'];
    var ok = Wt.__fired.indexOf(p + '_event_after') === 0
        && ev2.scenes.length >= 3
        && ev2.scenes[0].text.length > 10 && ev2.scenes[0].text !== '（触发时按节令与账本实时生成）'
        && ev2.scenes[1].text.length > 10;
    if (!ok) placeholderSeen = true;
});
assert(!placeholderSeen, 'F1 八人余波均可按除夕账弹出，场景第一二句均为专属文案（不留占位）');

// ============ G 一次性与重演语义 ============
var probeOnce = W.NPC_PERSONAL_EVENTS['bh_event_probe'];
assert(!probeOnce.ambient, 'G1 试探/敲打是一次性事件（非 ambient，演完入册不再重复）');
assert(W.NPC_PERSONAL_EVENTS['bh_event_sulk'].ambient === true
    && W.NPC_PERSONAL_EVENTS['bh_event_after'].ambient === true,
    'G2 小心眼与余波标 ambient：是日常与账后追补，不吃「大事占半日」的时辰账');
assert(Object.keys(W.JEALOUSY_AFTERMATH_EVENTS).every(function (k) {
    return W.JEALOUSY_AFTERMATH_EVENTS[k].requireFestivalWound === true;
}), 'G3 八桩余波全部挂 requireFestivalWound——吃醋的根必须是账本里的真亏欠');

// ============ H 每日优先级：余波 > 试探 ============
var npcs9 = {}; npcs9[BH] = makeNpc(BH, '温蘅', { aff: 60 }); npcs9[BH].memory = {};
var bonds9 = {}; bonds9[BH] = daoBond('温蘅');
bonds9[BH].festival = { qixi_0: { status: 'declined', dueDay: 187, fname: '七夕' } };
var W9 = makeWorld({ loc: '百花谷', npcs: npcs9, bonds: bonds9, day: 190, rng: 0.01,
    rival: rivalFor(daoOf(JG, '赫渊')) });
W9.__dayHooks.forEach(function (fn) { fn(); });
assert(W9.__fired.join(',') === 'bh_event_after',
    'H1 账上有伤的日子，余波必弹——试探概率再顺手也不能顶掉它');
assert(W.JEALOUSY_SULK_EVENTS['bh_event_sulk'].repeatEvery === 30,
    'H2 小心眼重入周期按 30 日落地（与计划文档一致）');

// ============ I 飞鸽补账：窗口过期、人没回门，账追到纸上 ============
var sent = [];
function mailStub() { return { sendNPCMail: function (npc, body, imp) { sent.push({ id: npc.id, body: body, imp: imp }); } }; }
var npcsI = {}; npcsI[BH] = makeNpc(BH, '温蘅', { aff: 60 }); npcsI[JG] = makeNpc(JG, '赫渊', { aff: 60, gender: 'male' });
var bondsI = {}; bondsI[BH] = daoBond('温蘅'); bondsI[JG] = daoBond('赫渊');
bondsI[BH].festival = { qixi_0: { status: 'declined', dueDay: 150, fname: '七夕' } };
var WI = makeWorld({ loc: '修罗宫', npcs: npcsI, bonds: bondsI, day: 190 }); // 人远在别派，回不了百花谷
WI.MailSystem = mailStub();
WI.__dayHooks.forEach(function (fn) { fn(); });
assert(sent.length === 1 && sent[0].id === BH && sent[0].body.indexOf('七夕过了') === 0,
    'I1 窗口过了十二日人一直没回门——余波不静默作废，Ta 的飞鸽信追上来（人不拘在其门中）');
assert(bondsI[BH].festival.qixi_0.letterSent === true && bondsI[BH].festival.qixi_0.aftermathFired === true,
    'I2 信寄成才落旗——旗在既有账格内（letterSent），零新增存档键');
WI.__dayHooks.forEach(function (fn) { fn(); });
assert(sent.length === 1, 'I3 落旗之后不重复寄——一年此节只此一信');
var bondsI2 = {}; bondsI2[BH] = daoBond('温蘅'); bondsI2[JG] = daoBond('赫渊');
bondsI2[BH].festival = { qixi_0: { status: 'stood', dueDay: 150, fname: '七夕' } };
bondsI2[JG].festival = { qixi_0: { status: 'spent', dueDay: 150, fname: '七夕' } };
var WI2 = makeWorld({ loc: '修罗宫', npcs: npcsI, bonds: bondsI2, day: 190 });
WI2.MailSystem = mailStub(); sent.length = 0;
WI2.__dayHooks.forEach(function (fn) { fn(); });
assert(sent.length === 1 && sent[0].body.indexOf('赫渊') >= 0,
    'I4 账上有 spent 实证才在信里点名——铁律不破，无实证绝不编造');
var bondsI3 = {}; bondsI3[BH] = daoBond('温蘅');
bondsI3[BH].festival = { qixi_0: { status: 'declined', dueDay: 188, fname: '七夕' } }; // gap=2，窗口内
var WI3 = makeWorld({ loc: '修罗宫', npcs: npcsI, bonds: bondsI3, day: 190 });
WI3.MailSystem = mailStub(); sent.length = 0;
WI3.__dayHooks.forEach(function (fn) { fn(); });
assert(sent.length === 0 && !bondsI3[BH].festival.qixi_0.letterSent,
    'I5 窗口内的伤归当面余波管——信不抢跑，也不作废');

// ============ K 信任折价：信任是话语的成色 ============
var K1 = { affection: 4, msg: '好。' };
W._jealTrustDiscount({ id: 'bh_event_probe' }, { relationship: { trust: 3 } }, 'reassure', K1);
assert(K1.affection === 2 && K1.msg.indexOf('只敢信一半') >= 0,
    'K1 信任被谎言磨到 10 以下——安抚只算一半（4→2），搪塞的梯度从此真有牙');
var K2 = { affection: 4, msg: '好。' };
W._jealTrustDiscount({ id: 'bh_event_probe' }, { relationship: { trust: 30 } }, 'reassure', K2);
assert(K2.affection === 4 && K2.msg === '好。',
    'K2 信任足时话语原色——折价只罚谎言，不罚所有人');
var K3 = { affection: -6, msg: '哼。' };
W._jealTrustDiscount({ id: 'bh_event_probe' }, { relationship: { trust: 0 } }, 'deflect', K3);
assert(K3.affection === -6 && K3.msg === '哼。',
    'K3 反呛的扣分与坦白、立誓均不经折价——只动安抚类的正加成');

// ============ L 被晾提醒：三十日未见，账实驱动 ============
assert(Object.keys(W.JEALOUSY_NEGLECT_EVENTS).length === 8
    && Object.keys(W.JEALOUSY_NEGLECT_EVENTS).every(function (k) {
        var ev = W.JEALOUSY_NEGLECT_EVENTS[k];
        return ev.requireDaoCompanion === true && ev.ambient === true && ev.scenes.length === 3;
    }),
    'L1 八桩被晾提醒齐——皆挂道侣门、ambient 不吃时辰、景语+开口+两选项三段');
var npcsL = {}; npcsL[BH] = makeNpc(BH, '温蘅', { aff: 60 });
var bondsL = {}; bondsL[BH] = daoBond('温蘅'); bondsL[BH].lastMetDay = 100;
var WL = makeWorld({ loc: '百花谷', npcs: npcsL, bonds: bondsL, day: 135 }); // 三十五日未见
WL.__dayHooks.forEach(function (fn) { fn(); });
assert(WL.__fired.join(',') === 'bh_event_neglect' && bondsL[BH].neglectFiredDay === 135,
    'L2 道侣三十日未见、你回门——Ta 不闹，只让你看 Ta 怎么数的日子（一轮一桩，落旗当日）');
WL.__fired.length = 0; WL.__dayHooks.forEach(function (fn) { fn(); });
assert(WL.__fired.length === 0, 'L3 本轮缺席已看过——不翻来覆去数落');
bondsL[BH].lastMetDay = 140; // 又见了一面，账翻新
var WL2 = makeWorld({ loc: '百花谷', npcs: npcsL, bonds: bondsL, day: 175 }); // 新一轮三十五日
WL2.__dayHooks.forEach(function (fn) { fn(); });
assert(WL2.__fired.join(',') === 'bh_event_neglect',
    'L4 再见一面账翻新——下一轮三十日不见，才重新作数');
bondsL[BH].lastMetDay = 170; bondsL[BH].neglectFiredDay = 0;
var WL3 = makeWorld({ loc: '百花谷', npcs: npcsL, bonds: bondsL, day: 180 }); // 只隔十日
WL3.__dayHooks.forEach(function (fn) { fn(); });
assert(WL3.__fired.indexOf('bh_event_neglect') === -1, 'L5 未满三十日不提这茬——短暂的忙不兴师问罪');
var bondsL2 = {}; bondsL2[BH] = { type: 'friend', name: '温蘅', lastMetDay: 100 };
var WL4 = makeWorld({ loc: '百花谷', npcs: npcsL, bonds: bondsL2, day: 135 });
WL4.__dayHooks.forEach(function (fn) { fn(); });
assert(WL4.__fired.length === 0, 'L6 非道侣不算这笔账——被晾只属于许过终身的人');

// ============ M 面板分类：日常可重演不谎报"已完成"（v20.35） ============
var peSrc = loadScript('js/npcs/npc-personal-events.js');
assert(peSrc.indexOf('已上演·可重演') >= 0 && peSrc.indexOf('日常可重演') >= 0
    && peSrc.indexOf('日子到了自然来') >= 0,
    'M1 面板把日常桩单列「日常相处（可重演）」：演过标「已上演·可重演」、账本驱动桩标「日子到了自然来」');
assert(/oneShotList[\s\S]{0,200}triggeredCount/.test(peSrc)
    && peSrc.indexOf("getEventChain(ev) === 'main' && !ev.ambient") >= 0,
    'M2 「已完成 X/Y」只数一次性事件，日常桩不进主链不占名额');
assert(/requireRivalRomance[\s\S]{0,300}tell[\s\S]{0,120}vow[\s\S]{0,160}love/.test(peSrc)
    || /tell' \|\| choice\.effect === 'vow'[\s\S]{0,200}love/.test(peSrc),
    'M3 v20.36 深情账接在吃醋结算处：坦白/立誓是真诚里程碑——深情+1');
var sectSysSrc = loadScript('js/sects/sects-system.js');
assert(sectSysSrc.indexOf('love) || 0) >= 50') >= 0 && sectSysSrc.indexOf('totalExp * 1.5') >= 0,
    'M4 深情共鸣：深情满 50 双修经验×1.5——深情有牙，不是摆设');

console.log('---');
console.log('v20.30 jealousy-deep: ' + passed + ' 通过, ' + failed + ' 失败');
process.exit(failed ? 1 : 0);
