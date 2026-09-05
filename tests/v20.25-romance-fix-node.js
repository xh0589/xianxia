/**
 * v20.25-romance-fix-node.js — 情账清算（系统死线 + 名实不符）：
 * 双修入口与位分升档、八线坏结局门槛可达、绯泪定情落旗、
 * 道侣代词/约会标价/发帖轮转、告白冷却只记成功、撕破脸锁门与重开、
 * 恋爱大事件耗时辰、日常小事入萌芽期且可重入、吃醋名单统一
 *
 * 运行：node tests/v20.25-romance-fix-node.js
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
function extractFn(src, name) {
    var head = 'function ' + name + '(';
    var i = src.indexOf(head);
    if (i < 0) return null;
    var j = src.indexOf('{', i), depth = 0, k = j;
    for (; k < src.length; k++) {
        if (src[k] === '{') depth++;
        else if (src[k] === '}') { depth--; if (depth === 0) break; }
    }
    return src.slice(i, k + 1);
}
// 提取某事件定义体内联的 effects: function(npc, choice) {...}
function extractEffects(src, eventId) {
    var anchor = "'" + eventId + "'";
    var i = src.indexOf(anchor);
    if (i < 0) return null;
    var eIdx = src.indexOf('effects: function(npc, choice)', i);
    if (eIdx < 0) return null;
    var j = src.indexOf('{', eIdx), depth = 0, k = j;
    for (; k < src.length; k++) {
        if (src[k] === '{') depth++;
        else if (src[k] === '}') { depth--; if (depth === 0) break; }
    }
    return 'function(npc, choice) ' + src.slice(j, k + 1);
}
function runEffects(src, eventId, npcId, neg, choice) {
    var code = extractEffects(src, eventId);
    if (!code) return { error: 'no-effects' };
    var cnt = {}; cnt[npcId] = neg;
    var ctx = vm.createContext({ window: { _negativeChoiceCount: cnt }, Math: Math,
        JG_NPC_ID: npcId, MS_NPC_ID: npcId, SU_NPC_ID: npcId, LU_NPC_ID: npcId,
        WUXIAN_NPC_ID: npcId, TIANSHAN_NPC_ID: npcId, BAIHUA_NPC_ID: npcId });
    vm.runInContext('__f=' + code + ';', ctx);
    return ctx.__f({ relationship: {}, setFlag: function () {}, hasFlag: function () { return false; } }, choice);
}
function makeNpc(id, name, opts) {
    opts = opts || {};
    var npc = {
        id: id, name: name, gender: opts.gender || 'female',
        relationship: { affection: opts.aff != null ? opts.aff : 50, flags: new Set(), history: [] },
        memory: opts.memory || {},
        affDelta: 0, loveDelta: 0,
        setFlag: function (f) { this.relationship.flags.add(f); },
        hasFlag: function (f) { return this.relationship.flags.has(f); },
        changeAffection: function (n) { this.affDelta += n; this.relationship.affection += n; },
        changeLove: function (n) { this.loveDelta += n; }
    };
    return npc;
}
function makeDaoWorld(opts) {
    opts = opts || {};
    var npcs = opts.npcs || {};
    var logs = [], advanced = [];
    var w = {
        console: { log: function () {}, warn: function () {}, error: function () {} },
        JSON: JSON, Object: Object, Array: Array, Math: Math, Number: Number, Boolean: Boolean,
        isFinite: isFinite, Date: Date, String: String, Set: Set,
        currentCharData: { bonds: opts.bonds || {}, energy: opts.energy != null ? opts.energy : 100, tempering: 0 },
        npcManager: { getNPC: function (id) { return npcs[id] || null; }, getAllNPCs: function () { return Object.keys(npcs).map(function (k) { return npcs[k]; }); } },
        NPCLineage: { recordPlayerDaoCompanion: function () {} },
        gameLog: { add: function (m) { logs.push(String(m)); } },
        showMessage: function (m) { logs.push(String(m)); },
        getAbsoluteDay: function () { return opts.day != null ? opts.day : 10; },
        timeSystem: { getAbsoluteDay: function () { return opts.day != null ? opts.day : 10; },
            advanceTime: function (n) { advanced.push(n); }, onNewDaySubscribe: function () {} },
        __dateRng: opts.rng != null ? function () { return opts.rng; } : undefined,
        showModal: opts.showModal || undefined,
        EventBus: null, StateRegistry: null
    };
    w.window = w;
    var ctx = vm.createContext(w);
    vm.runInContext(loadScript('js/core/world-calendar.js'), ctx);
    vm.runInContext(loadScript('js/core/dao-bridge.js'), ctx);
    return { w: w, logs: logs, advanced: advanced };
}

// ============ A 双修入口：位分升档跑通 ============
var ssrc = loadScript('js/sects/sects-system.js');
var daoBond = { type: 'dao_companion', level: 1, bondHeart: 9 };
var dNpc = makeNpc('sect_leader_金刚宗', '赫渊', { aff: 85 });
var sctx = vm.createContext({
    window: {
        currentCharData: { bonds: { 'sect_leader_金刚宗': daoBond }, energy: 100, essence: 0 },
        npcManager: { getNPC: function () { return dNpc; } },
        timeSystem: { advanceTime: function (n) { sctx.__adv.push(n); } },
        showMessage: function (m) { sctx.__msgs.push(m); }
    },
    addPlayerExp: function () {}, Math: { random: function () { return 0.99; } },
    __adv: [], __msgs: [], Math: Math
});
sctx.Math = Math;
vm.runInContext(extractFn(ssrc, 'dualCultivate') + ';globalThis.__dc=dualCultivate;', sctx);
var dcOk = sctx.__dc('sect_leader_金刚宗');
assert(dcOk === true && daoBond.level === 2 && daoBond.bondHeart === 0 &&
    sctx.window.currentCharData.energy === 80 && sctx.__adv[0] === 60 && dNpc.affDelta === 2,
    'A1 双修跑通且情分圆满升档：精力-20、时辰60、好感+2、位分 1→2（子嗣/合击高档解锁）');
assert(sctx.__msgs.join('|').indexOf('位分升至 2 档') >= 0, 'A2 升档如实报喜');
assert(loadScript('仙侠.html').indexOf('openDaoCompanionPanel') >= 0,
    'A3 道侣面板按钮已挂上工具条——双修全游戏零调用（唯一位分入口永不可达）的死线拆了');
assert(loadScript('js/sects/dao-companion-deep.js').indexOf('window.openDaoCompanionPanel = openDaoCompanionPanel') >= 0,
    'A4 面板导出在案，onclick 找得到人');

// ============ B 八线坏结局：三度伤透即寒心 ============
var LINES = [
    { file: 'js/npcs/jingang-events.js', ev: 'jg_event_013', npc: 'sect_leader_金刚宗', bad: '错过', good: '破戒同道' },
    { file: 'js/npcs/maoshan-events.js', ev: 'ms_event_013', npc: 'sect_leader_茅山派', bad: '错过', good: '符箓同道' },
    { file: 'js/npcs/yaowang-events.js', ev: 'su_event_013', npc: 'sect_leader_药王谷', bad: '错过', good: '医毒同道' },
    { file: 'js/npcs/zhujian-events.js', ev: 'lu_event_013', npc: 'sect_leader_铸剑山庄', bad: '错过', good: null },
    { file: 'js/npcs/wuxian-events.js', ev: 'wx_event_013', npc: 'sect_leader_五仙教', bad: '蛊噬', good: '同蛊' },
    { file: 'js/npcs/tianshan-events.js', ev: 'ts_event_013', npc: 'sect_leader_天山派', bad: '断鸣', good: null },
    { file: 'js/npcs/baihua-events-main.js', ev: 'bh_event_014', npc: 'sect_leader_百花谷', bad: '花冢', good: null },
    { file: 'js/npcs/npc-personal-events.js', ev: 'xl_event_033', npc: 'sect_leader_修罗宫', bad: '霜烬', good: '共主' }
];
var loverChoice = { 'xl_event_033': 'lover_carry' };
LINES.forEach(function (L) {
    var src = loadScript(L.file);
    var ch = loverChoice[L.ev] || 'lover_travel';
    var r3 = runEffects(src, L.ev, L.npc, 3, ch);
    var r2 = runEffects(src, L.ev, L.npc, 2, ch);
    assert(r3 && r3.ending === L.bad, 'B[' + L.ev + '] 攒满 3 度负选，恋人选项真转坏结局「' + L.bad + '」');
    assert(r2 && r2.ending !== L.bad && !!r2.ending, 'B[' + L.ev + '] 只伤两次仍够得着定情（' + (r2 && r2.ending) + '）——门槛不冤枉人');
});
// 负选项数量：每线至少攒得到 3（含吃醋线负选）
var negInv = [
    ['js/npcs/jingang-events.js', ['aff = -3', 'aff = -4']],
    ['js/npcs/maoshan-events.js', ['aff = -3', 'aff = -5']],
    ['js/npcs/yaowang-events.js', ['aff = -4', 'aff = -5']],
    ['js/npcs/wuxian-events.js', ['aff = -1', 'aff = -4']]
];
negInv.forEach(function (N) {
    var src = loadScript(N[0]);
    assert(N[1].every(function (s) { return src.indexOf(s) >= 0; }),
        'B+ ' + N[0] + ' 补上了真负选项——此前该线一个能数的负选都没有');
});

// ============ C 绯泪定情落旗 ============
var psrc = loadScript('js/npcs/npc-personal-events.js');
var cbAnchor = psrc.indexOf("registerEndingCallback('sect_leader_修罗宫', function(endingName, npc) {");
assert(cbAnchor >= 0, 'C1 修罗宫有了结局回调（八线独缺它，旗永落不下）');
if (cbAnchor >= 0) {
    var fStart = psrc.indexOf('function(endingName, npc) {', cbAnchor);
    var d = 0, k = psrc.indexOf('{', fStart);
    for (; k < psrc.length; k++) { if (psrc[k] === '{') d++; else if (psrc[k] === '}') { d--; if (d === 0) break; } }
    var cbSrc = psrc.slice(fStart, k + 1);
    var xlNpc = makeNpc('sect_leader_修罗宫', '绯泪');
    var cctx = vm.createContext({ window: { showMessage: function () {} } });
    vm.runInContext('__cb=' + cbSrc + ';', cctx);
    cctx.__cb('共主', xlNpc);
    cctx.__cb('归心', xlNpc);
    assert(xlNpc.hasFlag('dao_companion'), 'C2 共主/归心定情——dao_companion 旗落（回访/双修/护法自此可达）');
    var bnNpc = makeNpc('sect_leader_修罗宫', '绯泪');
    vm.runInContext('__cb=' + cbSrc + ';', cctx);
    cctx.__cb('比邻', bnNpc); cctx.__cb('归处', bnNpc);
    assert(!bnNpc.hasFlag('dao_companion'), 'C3 比邻（朋友）与归处（常伴）不点道侣旗——名册只认真结契');
    assert(psrc.indexOf("if (window.ensureDaoBond && npc && typeof npc.hasFlag === 'function' && npc.hasFlag('dao_companion'))") >= 0,
        'C4 旗落即有统一落笔进名册（v20.24 焊点在案）');
    assert(loadScript('js/npcs/heroine-aftermath.js').indexOf('男玩家无法入门、无法结契') < 0 &&
        loadScript('js/npcs/heroine-male-context.js').indexOf('意志≥40 且 真气上限≥80') < 0,
        'C5 两处谎话注释拆除（男玩家其实可走情伤四问破例入修罗宫——按现行代码校注）');
}

// ============ D 道侣代词/标价/轮转发帖 ============
var mN = makeNpc('sect_leader_金刚宗', '赫渊', { gender: 'male' });
var Wm = makeDaoWorld({ npcs: { 'sect_leader_金刚宗': mN },
    bonds: { 'sect_leader_金刚宗': { type: 'dao_companion', name: '赫渊', day: 3, lastMetDay: 3 } } });
Wm.w.daoDateAccept({ npcId: 'sect_leader_金刚宗' });
assert(Wm.logs.join('|').indexOf('他说到第三刻') >= 0 && Wm.logs.join('|').indexOf('她说到第三刻') < 0,
    'D1 男主道侣赴约文案写"他"——旧版硬编码女字旁，把赫渊写成了"她"（上批亲手埋的雷，拆了）');
var mN2 = makeNpc('sect_leader_金刚宗', '赫渊', { gender: 'male' });
var Wm2 = makeDaoWorld({ npcs: { 'sect_leader_金刚宗': mN2 },
    bonds: { 'sect_leader_金刚宗': { type: 'dao_companion', name: '赫渊', day: 3 } }, energy: 5 });
Wm2.w.daoDateAccept({ npcId: 'sect_leader_金刚宗' });
assert(mN2.affDelta === 5 && Wm2.w.currentCharData.energy === 5 &&
    Wm2.logs.join('|').indexOf('精力不支') < 0,
    'D2 v20.29 现实化：只剩 5 点精力也赴得成约——"精力不支误帖"的假分支已拆，游玩不榨精力');
Wm2.w.daoDateStand({ npcId: 'sect_leader_金刚宗' });
assert(Wm2.logs.join('|').indexOf('他在亭里坐到散灯') >= 0 && mN2.affDelta === 1,
    'D2b 爽约文案写"他"（人称仍随人走）、照扣好感——误帖只剩人没去这一条真原因');
var dbSrc = loadScript('js/core/dao-bridge.js');
assert(dbSrc.indexOf('耗时半日') >= 0 && dbSrc.indexOf('advanceTime(30') >= 0 &&
    dbSrc.indexOf('精力15') < 0 && dbSrc.indexOf('约40时辰') < 0,
    'D3 约会帖标价与实际扣账一致（半日时辰、不标精力）——"约40"虚标与"精力15"假价签都清掉了');
var W2 = makeDaoWorld({ npcs: { 'sect_leader_百花谷': makeNpc('sect_leader_百花谷', '温蘅'), 'sect_leader_金刚宗': makeNpc('sect_leader_金刚宗', '赫渊', { gender: 'male' }) },
    bonds: { 'sect_leader_百花谷': { type: 'dao_companion', name: '温蘅', day: 2 }, 'sect_leader_金刚宗': { type: 'dao_companion', name: '赫渊', day: 2 } },
    rng: 0.05, day: 10 });
W2.w.daoDateTick();
var p1 = W2.w.WorldCalendar.getNextByCategory('npc_appointment');
assert(p1 && p1.payload.npcId === 'sect_leader_百花谷', 'D4 两位道侣：第 10 日帖子发给轮值第一位（按日轮转，只请头一位的日子过去了）');
var W3 = makeDaoWorld({ npcs: { 'sect_leader_百花谷': makeNpc('sect_leader_百花谷', '温蘅'), 'sect_leader_金刚宗': makeNpc('sect_leader_金刚宗', '赫渊', { gender: 'male' }) },
    bonds: { 'sect_leader_百花谷': { type: 'dao_companion', name: '温蘅', day: 2 }, 'sect_leader_金刚宗': { type: 'dao_companion', name: '赫渊', day: 2 } },
    rng: 0.05, day: 11 });
W3.w.daoDateTick();
var p2 = W3.w.WorldCalendar.getNextByCategory('npc_appointment');
assert(p2 && p2.payload.npcId === 'sect_leader_金刚宗', 'D5 换一日，帖子轮到另一位——名册上人人有份');

// ============ E 告白：冷却只记成功、败则折情面、牵手先告白（掌门也不例外） ============
var nsys = loadScript('js/npcs/npc-system.js');
function loveCtx(npc, day) {
    var msgs = [];
    var c = vm.createContext({
        window: { npcManager: { getNPC: function () { return npc; } },
            timeSystem: { getAbsoluteDay: function () { return day; } },
            Personality16: null, currentCharData: {} },
        showMessage: function (m) { msgs.push(m); },
        npcNotCoLocated: function () { return false; },
        Math: Math, Set: Set, Number: Number, console: console
    });
    c.__npc = npc;
    vm.runInContext(extractFn(nsys, 'executeEmotionInteraction') + ';globalThis.__ei=executeEmotionInteraction;globalThis.__msgs=' + 'null;', c);
    return { c: c, msgs: msgs };
}
var fN = makeNpc('x', '温姑娘', { aff: 50 });
var E1 = loveCtx(fN, 10);
E1.c.__ei('x', 'confess');
assert(fN.affDelta === -2 && !(fN.memory._loveCd || {})['confess'] && E1.msgs.join('|').indexOf('情面-2') >= 0,
    'E1 告白被拒：情面真折（-2），冷却不再白记——旧版被拒反锁 3 日，试探零成本');
fN.relationship.affection = 65;
E1.c.__ei('x', 'confess');
assert(fN.memory._loveAccepted_confess === true && fN.memory._loveCd['confess'] === 10 && fN.affDelta === 3,
    'E2 攒够好感再告白成功：旗落、冷却 3 日从今日才起算');
E1.c.__ei('x', 'confess');
assert(E1.msgs.join('|').indexOf('心绪还没平复') >= 0 && fN.affDelta === 3,
    'E3 成功后的冷却是真的：3 日内不能重刷好感');
var sN = makeNpc('sect_leader_百花谷', '温蘅', { aff: 90 });
var E2 = loveCtx(sN, 10);
var before2 = sN.affDelta;
E2.c.__ei('sect_leader_百花谷', 'intimate');
assert(E2.msgs.join('|').indexOf('还没到那一步') >= 0 && sN.affDelta === before2,
    'E4 掌门人免告白后门拆除：想牵手，先告白——执一教之旗也是血肉之躯');
var mN3 = makeNpc('sect_leader_药王谷', '芩木', { aff: 75, gender: 'male', memory: { _loveAccepted_confess: true } });
var E3 = loveCtx(mN3, 10);
E3.c.__ei('sect_leader_药王谷', 'intimate');
assert(E3.msgs.join('|').indexOf('他没有拒绝') >= 0 && mN3.memory._loveCd['intimate'] === 10,
    'E5 男主道侣牵手文案写"他"；成功后冷却起账');
assert(loadScript('js/npcs/male-lead-reconcile.js').indexOf('他推来的茶') >= 0,
    'E6 芩木和好事件描述改回"他"（照抄女主文案写"她"的旧笔误）');

// ============ F 撕破脸锁门与重开 ============
var gateCtx = vm.createContext({ window: { currentCharData: { location: '百花谷' }, detectRivalRomance: null },
    Number: Number });
vm.runInContext(extractFn(psrc, 'getPersonalEventSectId') + '\n' + extractFn(psrc, 'canPlayerAccessPersonalEvent') +
    ';globalThis.__gate=canPlayerAccessPersonalEvent;', gateCtx);
var gN = makeNpc('sect_leader_百花谷', '温蘅', { aff: 30 });
gN.memory = { firstMet: true }; gN.setFlag('leverage_hostile');
assert(gateCtx.__gate({ npcId: 'sect_leader_百花谷', id: 'bh_event_001' }, gN) === false,
    'F1 拿把柄要挟翻过脸的人：私人线锁门（好感 30 < 50）——旧版勒索锁的是空气');
gN.relationship.affection = 55;
assert(gateCtx.__gate({ npcId: 'sect_leader_百花谷', id: 'bh_event_001' }, gN) === true && !gN.hasFlag('leverage_hostile'),
    'F2 情面养回五成：门重开，旧怨旗销——有仇可解，不是永久死刑');
var gN2 = makeNpc('sect_leader_天山派', '琤霄凌', { aff: 90 });
gN2.memory = { firstMet: true };
assert(gateCtx.__gate({ npcId: 'sect_leader_天山派', id: 'ts_event_001' }, gN2) === false,
    'F3 门禁其余照常：人不在其地（玩家在百花谷），天山的门也不开');
assert(loadScript('js/npcs/secret-leverage.js').indexOf('私人情谊线已锁') >= 0,
    'F4 翻脸当场如实告知锁门规则——名实相符');

// ============ G 日常小事：入萌芽期、可重入、主线占时辰 ============
var ambCtx = vm.createContext({ window: { timeSystem: { getAbsoluteDay: function () { return ambCtx.__day; } }, NPC_PERSONAL_EVENTS: {} }, __day: 20, Number: Number });
vm.runInContext(extractFn(psrc, '_ensureAmbientTag') + '\n' + extractFn(psrc, '_ambientRearmOk') +
    ';globalThis.__tag=_ensureAmbientTag;globalThis.__ok=_ambientRearmOk;', ambCtx);
var ev15 = { id: 'xl_event_015' }; ambCtx.__tag(ev15);
assert(ev15.ambient === true && ev15.repeatEvery === 14, 'G1 绯泪的日常小事就地认定（14 日可重遇）');
var ev32 = { id: 'bh_event_032' }; ambCtx.__tag(ev32);
assert(ev32.ambient === true, 'G2 温蘅的靠近小事同样认定');
var ev14 = { id: 'bh_event_014' }; ambCtx.__tag(ev14);
assert(!ev14.ambient, 'G3 终章大事不是日常——不许被重入机制放回去');
var gNpc = makeNpc('x', '温蘅'); gNpc.memory = { _ambientLastDay: { xl_event_015: 10 } };
assert(ambCtx.__ok(gNpc, ev15) === false, 'G4 距上次只隔 10 日（未满 14），不重发——不会茶也递得太勤');
ambCtx.__day = 25;
assert(ambCtx.__ok(gNpc, ev15) === true, 'G5 隔满 14 日，那盏安神茶才会再递来一次');
var gFresh = makeNpc('y', '温蘅'); gFresh.memory = {};
assert(ambCtx.__ok(gFresh, ev15) === false, 'G6 没记日子的不发——宁可漏发不白送好感');
assert(psrc.indexOf('if (ev.ambient) return true;') >= 0,
    'G7 链头判定给日常放行：萌芽期（终章未至）也能碰上日常——旧版被 014 终章整线锁死');
var bsrc = loadScript('js/npcs/baihua-personal-events.js');
assert(bsrc.indexOf('_ambientRearmOk(npc, ev)') >= 0 && bsrc.indexOf('_ensureAmbientTag(ev)') >= 0,
    'G8 自动触发器认账：已发生过的日常走重入闸门，不再一次性绝版');
assert(psrc.indexOf("advanceTime(20, '与'") >= 0 && psrc.indexOf('_finEv.ambient') >= 0,
    'G9 恋爱主线大事件各耗一段时辰（递盏茶不记账，赴一场心事要时辰）');
assert(psrc.indexOf('她的日常（18件') < 0 && psrc.indexOf('她的靠近（12件') < 0 &&
    psrc.indexOf('她的日常（10件') >= 0 && psrc.indexOf('她的靠近（8件') >= 0,
    'G10 栏目计数如实改账（18→10、12→8——目录和货架对得上）');

// ============ H 吃醋名单统一 ============
var hsrc = loadScript('js/npcs/heroine-rivalry.js');
assert(hsrc.indexOf("typeof window.detectRivalRomance === 'function'") >= 0 &&
    (hsrc.match(/_det\(h\.id\)/g) || []).length === 2,
    'H1 女主吃醋自动探测改走全局八人版——情敌是男主时女主照样撞破');
var msrc2 = loadScript('js/npcs/male-lead-rivalry.js');
assert(msrc2.indexOf("window.detectRivalRomance = _detectRivalRomanceAll") >= 0,
    'H2 全局版仍在男主入门文件里挂帅（含四位男主）');

// ============ I 静态接线 ============
assert((psrc + bsrc).indexOf('negCount >= 3') >= 0 && loadScript('js/npcs/baihua-events-main.js').indexOf('negCount >= 5') < 0,
    'I1 全库坏结局门槛统一为 3（无一处漏网 5）');
assert((function () {
    var files = ['jingang-events.js', 'maoshan-events.js', 'yaowang-events.js', 'wuxian-events.js', 'tianshan-events.js', 'zhujian-events.js'];
    return files.every(function (f) { return loadScript('js/npcs/' + f).indexOf('negCount >= 5') < 0; });
})(), 'I2 男主六线也全数换闸');
assert(loadScript('仙侠.html').indexOf('openDaoCompanionPanel') >= 0,
    'I3 工具条按钮（静态）——双修/相伴一按即达');

// ============ J 日常小事重入日头随档往返 ============
// _ambientLastDay 若不在 NPC serialize/deserialize 白名单，读档后已发生的日常小事（含小心眼）永不再触发。
assert((function () {
    var ser = nsys.slice(nsys.indexOf('serialize() {'), nsys.indexOf('static deserialize'));
    var des = nsys.slice(nsys.indexOf('static deserialize'), nsys.indexOf('static deserialize') + 6000);
    return ser.indexOf('_ambientLastDay') >= 0 && des.indexOf('_ambientLastDay') >= 0;
})(), 'J1 重入日头 _ambientLastDay 进 serialize 与 deserialize 双白名单（读档不丢）');
assert((function () {
    var ser = nsys.slice(nsys.indexOf('serialize() {'), nsys.indexOf('static deserialize'));
    var des = nsys.slice(nsys.indexOf('static deserialize'), nsys.indexOf('static deserialize') + 6000);
    var keys = ['_branchState', '_choiceHistory', '_events'];
    return keys.every(function (k) { return ser.indexOf(k) >= 0 && des.indexOf(k) >= 0; });
})(), 'J2 深谈分支/选择史/记忆事件三个旧记忆键同入双白名单（读档不清零）');

console.log('v20.25 romance-fix: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
