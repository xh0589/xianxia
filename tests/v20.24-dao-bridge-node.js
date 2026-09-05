/**
 * v20.24-dao-bridge-node.js — 道侣名册的桥：
 * 结契落笔（旗与册同源）、旧档补票、道侣相约（日历约定栏首客）、
 * 三处历史死线修复（出师永远不可达成 / NPC 婚配恒跑不动 / 孤单提醒永不发）、
 * 请教扣情面 + 虚夸 buff 文案拆除
 *
 * 运行：node tests/v20.24-dao-bridge-node.js
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

function makeNpc(id, name, opts) {
    opts = opts || {};
    var npc = {
        id: id, name: name,
        relationship: { affection: opts.aff != null ? opts.aff : 50, flags: new Set(), history: [] },
        affDelta: 0,
        setFlag: function (f) { this.relationship.flags.add(f); },
        hasFlag: function (f) { return this.relationship.flags.has(f); },
        changeAffection: function (n) { this.affDelta += n; this.relationship.affection += n; }
    };
    if (opts.flagDao) npc.relationship.flags.add('dao_companion');
    return npc;
}

function makeDaoWorld(opts) {
    opts = opts || {};
    var npcs = opts.npcs || {};
    var logs = [];
    var advanced = [];
    var lineageCalls = [];
    var w = {
        console: { log: function () {}, warn: function () {}, error: function () {} },
        JSON: JSON, Object: Object, Array: Array, Math: Math, Number: Number, Boolean: Boolean,
        isFinite: isFinite, Date: Date, String: String, Set: Set,
        currentCharData: { bonds: opts.bonds || {}, energy: opts.energy != null ? opts.energy : 100, tempering: 0 },
        npcManager: { getNPC: function (id) { return npcs[id] || null; }, getAllNPCs: function () { return Object.keys(npcs).map(function (k) { return npcs[k]; }); } },
        NPCLineage: { recordPlayerDaoCompanion: function (id) { lineageCalls.push(id); } },
        gameLog: { add: function (m) { logs.push(String(m)); } },
        showMessage: function (m) { logs.push(String(m)); },
        getAbsoluteDay: function () { return opts.day != null ? opts.day : 10; },
        timeSystem: { getAbsoluteDay: function () { return opts.day != null ? opts.day : 10; },
            advanceTime: function (n, w2) { advanced.push(n); }, onNewDaySubscribe: function () {} },
        __dateRng: opts.rng != null ? function () { return opts.rng; } : undefined,
        EventBus: null, StateRegistry: null
    };
    w.window = w;
    var ctx = vm.createContext(w);
    vm.runInContext(loadScript('js/core/world-calendar.js'), ctx);
    vm.runInContext(loadScript('js/core/dao-bridge.js'), ctx);
    return { w: w, ctx: ctx, logs: logs, advanced: advanced, lineageCalls: lineageCalls, npcs: npcs };
}

// ============ A 名册落笔 ============
var wa = makeNpc('sect_leader_百花谷', '温蘅');
var W1 = makeDaoWorld({ npcs: { 'sect_leader_百花谷': wa } });
var r1 = W1.w.ensureDaoBond('sect_leader_百花谷');
var b1 = W1.w.currentCharData.bonds['sect_leader_百花谷'];
assert(r1 === true && b1 && b1.type === 'dao_companion' && b1.name === '温蘅' && b1.day === 10,
    'A1 结契落笔：旗落即入册，名/日在案（婚后制度自此有据）');
assert(wa.hasFlag('dao_companion') && W1.lineageCalls.length === 1 && W1.lineageCalls[0] === 'sect_leader_百花谷',
    'A2 落笔同时补旗、请家谱系统记名（NPC 婚配的先有鸡问题解开）');
assert((wa.relationship.love || 0) === 30,
    'A2b v20.36 深情账：许下终身的一刻深情打底 30——往后的深情靠真诚里程碑积');
var r1b = W1.w.ensureDaoBond('sect_leader_百花谷');
assert(r1b === false && W1.lineageCalls.length === 1,
    'A3 再落一笔被幂等拦下——册上已有人，不重不漏');

// ============ B 旧档补票 ============
var oldA = makeNpc('sect_leader_天山派', '琤霄凌', { flagDao: true });
var oldB = makeNpc('sect_leader_茅山派', '昴既明');
var W2 = makeDaoWorld({ npcs: { 'sect_leader_天山派': oldA, 'sect_leader_茅山派': oldB } });
var fixed = W2.w.daoCompanionSweep();
assert(fixed === 1 && W2.w.currentCharData.bonds['sect_leader_天山派'] &&
    !W2.w.currentCharData.bonds['sect_leader_茅山派'],
    'B1 旧档补票：婚礼办过、册上无名的照补；没办过的不硬点鸳鸯');
assert(W2.logs.join('|').indexOf('补登名册') >= 0 && W2.w.daoCompanionSweep() === 0,
    'B2 补票如实记一笔账，再进一次门不重复补');

// ============ C 道侣相约 ============
var cn = makeNpc('sect_leader_百花谷', '温蘅');
var W3 = makeDaoWorld({ npcs: { 'sect_leader_百花谷': cn },
    bonds: { 'sect_leader_百花谷': { type: 'dao_companion', name: '温蘅', day: 4, lastMetDay: 4 } },
    rng: 0.05, energy: 100, day: 10 });
var t1 = W3.w.daoDateTick();
var pending = W3.w.WorldCalendar.list({ category: 'npc_appointment' });
assert(t1 === true && pending.length === 1 && pending[0].dueAbsoluteDay === 12 &&
    W3.logs.join('|').indexOf('一帖') >= 0,
    'C1 道侣下帖：日历"约定"栏有了第一位常客（后日湖上相候）');
assert(W3.w.daoDateTick() === false && W3.w.WorldCalendar.list({ category: 'npc_appointment' }).length === 1,
    'C2 已有约在身不再叠帖——一次只赴一场');
var fired = W3.w.WorldCalendar.consumeDue(12);
assert(fired.length === 1 && cn.relationship.affection === 55 && cn.affDelta === 5 &&
    (cn.relationship.trust || 0) === 1 &&
    W3.w.currentCharData.energy === 100 && W3.advanced.length === 1 &&
    W3.w.currentCharData.bonds['sect_leader_百花谷'].lastMetDay === 10,
    'C3 到期赴约（无弹窗环境自动赴）：好感+5、信任+1（v20.33 到场即真）、时辰 30、"记得你来过"落账——v20.29 游玩不榨精力，赴约不扣分文（赶路的账由正常赶路结）');
// 爽约路径：人不去，人才是最重的账
var sn = makeNpc('sect_leader_五仙教', '蓝凤凰');
var W4 = makeDaoWorld({ npcs: { 'sect_leader_五仙教': sn },
    bonds: { 'sect_leader_五仙教': { type: 'dao_companion', name: '蓝凤凰', day: 2, lastMetDay: 2 } },
    rng: 0.05, energy: 10, day: 10 });
W4.w.daoDateTick();
W4.w.daoDateAcceptBy('sect_leader_五仙教');
assert(sn.affDelta === 5 && W4.w.currentCharData.energy === 10,
    'C4 只剩 10 点精力也赴得成约：游玩不是苦役，+5、精力不动——"累到误帖"不再是一种账');
var sn2 = makeNpc('sect_leader_昆仑派', '云清');
var W4b = makeDaoWorld({ npcs: { 'sect_leader_昆仑派': sn2 },
    bonds: { 'sect_leader_昆仑派': { type: 'dao_companion', name: '云清', day: 2, lastMetDay: 2 } },
    rng: 0.05, day: 10 });
W4b.w.daoDateStand({ npcId: 'sect_leader_昆仑派' });
assert(sn2.affDelta === -4 && W4b.logs.join('|').indexOf('散灯') >= 0,
    'C4b 主动爽约仍是最重的账：人等到散灯，好感-4——不赴约的代价从来不在精力上');
var W5 = makeDaoWorld({ npcs: { 'sect_leader_百花谷': makeNpc('sect_leader_百花谷', '温蘅') },
    bonds: { 'sect_leader_百花谷': { type: 'dao_companion', name: '温蘅', day: 1 } },
    rng: 0.9, day: 10 });
assert(W5.w.daoDateTick() === false && W5.w.WorldCalendar.list({ category: 'npc_appointment' }).length === 0,
    'C5 帖子不是天天有（ rng 高值不发）——无道侣时更不发');
var W6 = makeDaoWorld({ npcs: {}, bonds: {}, rng: 0.01, day: 10 });
assert(W6.w.daoDateTick() === false, 'C6 册上无道侣，日历清净');

// ============ D 教与学：情面真扣、虚夸文案拆除 ============
var gsrc = loadScript('js/npcs/npc-system.js');
var gnpc = makeNpc('qingxu', '清虚道人', { aff: 50 });
var gd = vm.createContext({ window: { currentCharData: { tempering: 0 }, npcManager: { getNPC: function () { return gnpc; } },
    updateCharacterStatus: function () {} }, showMessage: function (m) { gd._m = m; }, console: console, Set: Set });
gd.window.currentCharData = { tempering: 0 };
vm.runInContext(extractFn(gsrc, 'showCultivationGuide') + ';window.showCultivationGuide=showCultivationGuide;', gd);
gd.window.currentCharData = { tempering: 0 };
gd.window.npcManager = { getNPC: function () { return gnpc; } };
gnpc.relationship.affection = 50; gnpc.affDelta = 0;
gd.window.showCultivationGuide('qingxu', '突破指导');
assert(gnpc.affDelta === -10 && gnpc.relationship.affection === 40 && gd._m.indexOf('情面-10') >= 0,
    'D1 请教折情面：配置标价的"好感 10"从此真扣——教人意愿是有限资源');
assert(loadScript('js/npcs/npc-system.js').indexOf('下次战斗攻击+5%') < 0 &&
    loadScript('js/npcs/npc-system.js').indexOf('下次突破成功率+5%') < 0,
    'D2 两处虚夸 buff 文案（说了不兑现的"下次+5%"）已从源码拆除');

// ============ E 出师可达 ============
var msrc = loadScript('js/sects/master-teach.js');
var me = vm.createContext({ GRAD_AFFECTION: 60, GRAD_PLAYER_TIER: 3,
    _stageIndex: function () { return 2; }, _playerTier: function () { return 3; }, Number: Number });
vm.runInContext(extractFn(msrc, '_npcAffection') + '\n' + extractFn(msrc, '_canGraduate') +
    ';globalThis.__can=_canGraduate;', me);
assert(me.__can({ relationship: { affection: 70 } }) === true &&
    me.__can({ relationship: { affection: 30 } }) === false &&
    me.__can({ relationship: { affection: 65 }, _graduated: true }) === false,
    'E1 弟子出师从此可达：读对好感真源（70 过、30 不过、已出师不重复）');

// ============ F NPC 婚配跑通 ============
var lsrc = loadScript('js/npcs/npc-lineage.js');
var A = makeNpc('npc_a', '甲', { aff: 85 }), B = makeNpc('npc_b', '乙', { aff: 82 });
A.location = B.location = '长安城';
var lf = vm.createContext({ getNpc: function (id) { return id === 'npc_a' ? A : id === 'npc_b' ? B : null; },
    ensureLineage: function (n) { n.lineage = n.lineage || { daoCompanion: null }; return n.lineage; },
    areCloseRelatives: function () { return false; }, getCurrentDay: function () { return 5; },
    EventBus: null, showMessage: function () {}, Number: Number, isFinite: isFinite, global: { EventBus: null } });
vm.runInContext(extractFn(lsrc, 'marry') + ';globalThis.__marry=marry;', lf);
var mr = lf.__marry('npc_a', 'npc_b');
assert(mr.ok === true && A.lineage.daoCompanion === 'npc_b' && B.lineage.daoCompanion === 'npc_a' &&
    A.hasFlag('dao_companion'),
    'F1 NPC 间婚配死码修活：读对 relationship.affection，两家记名、旗也落');
var C = makeNpc('npc_c', '丙', { aff: 40 }), D = makeNpc('npc_d', '丁', { aff: 90 });
C.location = D.location = '长安城';
lf.getNpc = function (id) { return { npc_a: A, npc_b: B, npc_c: C, npc_d: D }[id] || null; };
lf.ensureLineage = function (n) { n.lineage = n.lineage || { daoCompanion: null }; return n.lineage; };
var mr2 = lf.__marry('npc_c', 'npc_d');
assert(mr2.ok === false && mr2.reason === 'affection-low', 'F2 好感不足 80 照样不娶——门槛是真的');

// ============ G 孤单提醒计时修活 ============
var dsrc = loadScript('js/sects/dao-companion-deep.js');
var pn = makeNpc('sect_leader_金刚宗', '赫渊');
pn._companionData = { lastInteraction: 0, mood: 70, needs: { talk: 0, accompany: 0, gift: 0 } };
var dw = { window: { currentCharData: { bonds: { 'sect_leader_金刚宗': { type: 'dao_companion', name: '赫渊', day: 4, lastMetDay: 4 } } },
    npcManager: { getNPC: function () { return pn; } }, getAbsoluteDay: function () { return 10; },
    showMessage: function (m) { dw._msgs.push(m); } }, showMessage: null, Math: Math };
dw._msgs = [];
dw.Math = { random: function () { return 0.05; }, min: Math.min, max: Math.max, floor: Math.floor };
var dc = vm.createContext(dw);
vm.runInContext(extractFn(dsrc, 'updateDaoCompanionDeep') + ';window.updateDaoCompanionDeep=updateDaoCompanionDeep;', dc);
dw.window.updateDaoCompanionDeep();
assert(dw._msgs.join('|').indexOf('散步') >= 0 && dw._msgs.join('|').indexOf('孤单') >= 0,
    'G1 结契六日未见（第 4 日结、今第 10 日）：散步邀约与孤单提醒真发了——此前永为 0 的计时基准修活');

// ============ H 静态接线 ============
assert(loadScript('仙侠.html').indexOf('js/core/dao-bridge.js') >= 0, 'H1 桥已挂上页面');
assert(loadScript('js/core/game-state.js').indexOf('daoCompanionSweep') >= 0, 'H2 读档尾补票接线在案');
assert(loadScript('js/npcs/npc-personal-events.js').indexOf('ensureDaoBond(ev.eventDef.npcId)') >= 0,
    'H3 结局回调后统一落笔——八条线一处不漏');
assert(loadScript('js/npcs/npc-system.js').indexOf('if (window.ensureDaoBond) window.ensureDaoBond(npcId)') >= 0,
    'H4 深谈结契同一路写点');
assert(loadScript('js/app.js').indexOf('function formBond') >= 0, 'H5 原 formBond 门槛求婚路径原样保留（求道的礼数没拆）');

console.log('v20.24 dao-bridge: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
