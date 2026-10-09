/**
 * npc-open-flag-node.js — 「启途」旗标（pe_open_*）接上消费端的回归防护
 *
 * 病根（实测，见 .scratch/open-flag-progress/）：NPC 事件后果 8 类里，只有第 ⑧ 类「启途」
 *   结算后不留任何可读状态——只写 npc.relationship.flags 的 pe_open_<npcId>_<value>
 *   和 eventFlags.pe_route_<npcId>，两本账全仓零读方。其余七类结算的是 affection/hate/
 *   fear/trust/love/favor/respect 与灵石/精力，那些轨与真资源全仓有读方。
 *
 * 度量：988 场 / 2938 个选项里 open 类 76 个选项、73 面旗标。
 *   逐个跑它所属事件的 effects() 看分支返不返 ending：
 *     · 33 面 分支自带 ending 且已挂 endingMap ⇒ 后果已兑现，旗标只是冗余记账。
 *     · 40 面 分支不返 ending，旗标当时真无人读。
 *   本套件断言：40 面全部有账可查（已接 / 立场已由好感交付 / 注明为何不接），一条不许漏。
 *
 * 手法：按 仙侠.html 全部 script 的真实挂载顺序装进 vm 沙箱真跑；
 *       存档那条走真实的 npcManager.serialize → deserialize 往返，不用桩。
 */
'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');
var ROOT = path.resolve(__dirname, '..');

var passed = 0, failed = 0;
function ok(c, m) { if (c) { passed++; console.log('  ✓ ' + m); } else { failed++; console.log('  [FAIL] ' + m); } }
function head(t) { console.log('\n===== ' + t + ' ====='); }

// ---------- 沙箱：按 仙侠.html 全部 script 的真实顺序 eval ----------
function 建沙箱(留真NPC) {
    var noop = function () { };
    var 警告 = [];
    var el = function () {
        return {
            classList: { add: noop, remove: noop }, style: {}, appendChild: noop, remove: noop,
            querySelectorAll: function () { return []; }, addEventListener: noop, setAttribute: noop,
            innerHTML: '', textContent: '', querySelector: function () { return null; },
            getBoundingClientRect: function () { return { left: 0, top: 0, width: 0, height: 0 }; },
            scrollTop: 0, scrollHeight: 0
        };
    };
    var w = {
        console: {
            log: noop,
            warn: function (m) { 警告.push(String(m)); },
            error: noop, info: noop
        },
        Math: Math, Date: Date, JSON: JSON, Object: Object, Array: Array, String: String,
        Number: Number, Boolean: Boolean, Error: Error, RegExp: RegExp, Symbol: Symbol,
        Set: Set, Map: Map, WeakMap: WeakMap, Proxy: Proxy, Reflect: Reflect, Intl: Intl,
        isNaN: isNaN, parseInt: parseInt, parseFloat: parseFloat, isFinite: isFinite,
        setTimeout: noop, clearTimeout: noop, setInterval: noop, clearInterval: noop, Promise: Promise,
        NPC_PERSONAL_EVENTS: {}, NPC_ENDING_SETS: {}, NPC_ENDING_CALLBACKS: {},
        timeSystem: { onNewDaySubscribe: noop, gameTime: { currentDay: 1, totalMinutes: 0 }, getAbsoluteDay: function () { return 1; } },
        currentCharData: {
            name: '测试道人', gender: 'male', location: '少林寺', realm: '金丹', layer: 5,
            karma: 0, fame: 0, energy: 100, maxEnergy: 100, spiritStones: 500,
            spiritualRoots: {}, mutatedRoots: {}, mainAttributes: {}, lifeSkills: {}, b: {}, inventory: []
        },
        sectsData: {}, eventFlags: {},
        showMessage: noop, showModal: noop, esc: function (x) { return String(x == null ? '' : x); },
        addItem: function () { return true; },
        giveWithReceipt: function () { return { got: 1, count: 1, name: 'x' }; },
        addItemFailPhraseFor: function () { return ''; },
        addItemToInventory: noop, removeItemFromInventory: noop, hasItem: function () { return false; },
        applyBuff: noop, startBattle: noop, showChoiceDialog: noop, getAbsoluteDay: function () { return 1; },
        driftPersonality: noop, EventBus: { on: noop, emit: noop }, playerName: '测试道人',
        detectRivalRomance: function () { return null; }, _rivalSexFlavor: function () { return ''; },
        _jealTrustDiscount: noop, _jealWriteback: function () { return {}; }, _jealGuestInfo: function () { return null; },
        localStorage: { getItem: function () { return null; }, setItem: noop, removeItem: noop },
        saveToStorage: function () { return true; }, loadFromStorage: function () { return null; },
        navigator: { userAgent: 'node', language: 'zh-CN' }, performance: { now: function () { return Date.now(); } },
        location: { href: 'http://127.0.0.1/', search: '', hash: '' }, innerWidth: 1280, innerHeight: 720,
        document: {
            readyState: 'complete',
            querySelectorAll: function () { return []; }, querySelector: function () { return null; },
            createElement: el, getElementById: function () { return null; },
            body: el(), head: el(), addEventListener: noop, removeEventListener: noop
        }
    };
    if (!留真NPC) {
        var 册 = {};
        w.npcManager = {
            getNPC: function (id) { return 册[id] || null; },
            getAllNPCs: function () { return Object.keys(册).map(function (k) { return 册[k]; }); },
            detectRivalRomance: function () { return null; },
            _册: 册
        };
    }
    w.window = w; w.globalThis = w; w.global = w; w.self = w;
    w.document.body.classList = { add: noop, remove: noop, toggle: noop, contains: function () { return false; } };
    var ctx = vm.createContext(w);
    var html = fs.readFileSync(path.join(ROOT, '仙侠.html'), 'utf8');
    var 全部 = (html.match(/src="([^"]+\.js)"/g) || []).map(function (s) { return s.slice(5, -1); });
    var 缺 = [];
    全部.forEach(function (rel) {
        var fp = path.join(ROOT, rel.replace(/\//g, path.sep));
        if (!fs.existsSync(fp)) { 缺.push(rel); return; }
        try { vm.runInContext(fs.readFileSync(fp, 'utf8'), ctx, { filename: rel, timeout: 60000 }); }
        catch (e) { 缺.push(rel + ' :: ' + e.message); }
    });
    return { w: w, 警告: 警告, 装载问题: 缺, 脚本数: 全部.length };
}

function 造NPC(id) {
    var flags = new Set();
    return {
        id: id, name: 'NPC', appearance: { icon: '👤' },
        relationship: { affection: 0, hatred: 0, favor: 0, favorMax: 50, respect: 0, love: 0, fear: 0, trust: 0, flags: flags, history: [] },
        memory: { playerActions: [], impressions: {}, questsGiven: [], firstMet: true, meetCount: 3 },
        secrets: {}, unlockSecret: function () { return false; },
        setFlag: function (f) { flags.add(f); }, hasFlag: function (f) { return flags.has(f); }
    };
}

var 沙 = 建沙箱(false);
var W = 沙.w;
var E = W.NPC_PERSONAL_EVENTS;

console.log('\n========== 启途接线 · NPC「启途」旗标消费端回归 ==========');

// ============ [0] 装载 ============
head('[0] 装载与导出面');
ok(Object.keys(E).length === 988, 'NPC_PERSONAL_EVENTS 实装 ' + Object.keys(E).length + ' 场（期望 988）');
var 严重 = 沙.装载问题.filter(function (m) { return m.indexOf('::') >= 0 && m.indexOf('MutationObserver') < 0 && m.indexOf('addEventListener') < 0; });
ok(严重.length === 0, '352 个脚本装载无意外错误（意外：' + (严重.slice(0, 3).join(' | ') || '无') + '）');
['peOpenFlagName', 'peOpenNoteKey', 'peRouteKey', 'hasOpenRoute', 'openRoutesOf', 'openRouteCount',
    'openRouteLabel', 'applyEventEffects'].forEach(function (k) {
    ok(typeof W[k] === 'function', '读侧 API 已挂 window：' + k);
});
ok(!!W.NPC_OPEN_ROUTE_FOLLOWS && !!W.NPC_OPEN_ROUTE_LEDGER_NOTE, '两张台账表都在（FOLLOWS / LEDGER_NOTE）');

// ============ [1] ★零孤儿：每面 pe_open_ 旗标都有账可查 ============
head('[1] ★零孤儿 —— 73 面旗标逐条有账（已接 / 立场已交付 / 注明不接）');

// 实测：全部 open 选项 → 旗标 → 分支是否自带 ending 且已挂 endingMap
var openVals = new Set();
Object.keys(W.NPC_EFFECT_MAP).forEach(function (v) {
    if (W.NPC_EFFECT_MAP[v].split(':')[0] === 'open') openVals.add(v);
});
var flagsAll = {}, openOptions = 0;
Object.keys(E).forEach(function (id) {
    var ev = E[id]; if (!ev) return;
    (ev.scenes || []).forEach(function (s) {
        (s.options || []).forEach(function (o) {
            var spec = W.NPC_EFFECT_MAP[o.effect];
            if (!spec || spec.split(':')[0] !== 'open') return;
            openOptions++;
            var f = 'pe_open_' + (ev.npcId || 'unknown') + '_' + o.effect;
            (flagsAll[f] = flagsAll[f] || { npc: ev.npcId || 'unknown', value: o.effect, served: false }).served =
                (flagsAll[f] && flagsAll[f].served) || false;
            var ret = null;
            try { ret = ev.effects(造NPC(ev.npcId || 'x'), o.effect); } catch (e) { }
            if (ret && ret.ending && ev.endingMap && ev.endingMap[ret.ending]) flagsAll[f].served = true;
        });
    });
});
var allFlags = Object.keys(flagsAll).sort();
ok(openOptions === 76, 'open 类选项 ' + openOptions + ' 个（期望 76）');
ok(allFlags.length === 73, 'open 类旗标 ' + allFlags.length + ' 面（期望 73）');

// 消费端表实际读到的旗（FOLLOWS 里逐条列出来的）
var wired = {};
Object.keys(W.NPC_OPEN_ROUTE_FOLLOWS).forEach(function (evId) {
    var ev = E[evId];
    ok(!!ev, '消费端事件存在：' + evId + (ev ? '' : ' ← 表里写了一个不存在的事件'));
    (W.NPC_OPEN_ROUTE_FOLLOWS[evId] || []).forEach(function (r) {
        var f = 'pe_open_' + r.npc + '_' + r.value;
        (wired[f] = wired[f] || []).push(evId);
        ok(!!(r.line && r.line.length > 8), '消费端 ' + evId + ' 对 ' + f + ' 有一条玩家看得见的说法');
        ok(typeof r.aff === 'number', '消费端 ' + evId + ' 对 ' + f + ' 给了额外好感 ' + r.aff);
    });
});
var stanceVals = W.NPC_OPEN_ROUTE_LEDGER_NOTE.stance || [];
var noFollowupVals = W.NPC_OPEN_ROUTE_LEDGER_NOTE.noFollowup || [];
var selfTermVals = W.NPC_OPEN_ROUTE_LEDGER_NOTE.selfTerminal || [];
stanceVals.concat(noFollowupVals, selfTermVals).forEach(function (v) {
    ok(openVals.has(v), '台账里点名的取值确实登记为 open 类：' + v);
});
var 台账取值 = stanceVals.concat(noFollowupVals, selfTermVals);
var 重复记账 = {};
台账取值.forEach(function (v) { if (重复记账[v]) ok(false, '取值在台账里被重复记账：' + v); 重复记账[v] = 1; });
ok(Object.keys(重复记账).length === 台账取值.length, '台账三类取值互不重叠（共 ' + 台账取值.length + ' 个）');

// 逐面旗标判账
var 未接 = [], 已接 = [], 已兑现 = [], 立场交付 = [];
allFlags.forEach(function (f) {
    if (wired[f]) { 已接.push(f); return; }
    if (flagsAll[f].served) { 已兑现.push(f); return; }
    var v = flagsAll[f].value;
    if (stanceVals.indexOf(v) >= 0) { 立场交付.push(f); return; }
    if (noFollowupVals.indexOf(v) >= 0) { 未接.push(f); return; }
    未接.push(f);
});
var 漏账 = 未接.filter(function (f) { return 台账取值.indexOf(flagsAll[f].value) < 0; });
ok(漏账.length === 0, '★没有任何一面旗标无账可查（漏账：' + (漏账.join(',') || '无') + '）');
ok(已接.length >= 4, '已接上真实消费端的旗标 ' + 已接.length + ' 面：\n        ' + 已接.join('\n        '));
var 末选 = allFlags.filter(function (f) { return !wired[f] && !flagsAll[f].served && selfTermVals.indexOf(flagsAll[f].value) >= 0; });
console.log('        分支自带 ending·后果已兑现（旗标为冗余记账）: ' + 已兑现.length + ' 面');
console.log('        对局立场·差别已由同分支好感交付            : ' + 立场交付.length + ' 面');
console.log('        已注明「所属关系查无以它为前情的后续事件」  : ' + (未接.length - 末选.length) + ' 面');
console.log('        已注明「写在本场末选·本场无重演可读」      : ' + 末选.length + ' 面（' + 末选.join(', ') + '）');
ok(已接.length + 已兑现.length + 立场交付.length + 未接.length === allFlags.length,
    '四类账目相加等于旗标总数：' + 已接.length + '+' + 已兑现.length + '+' + 立场交付.length + '+' + 未接.length +
    '=' + allFlags.length);

// 消费端挂载点：全游戏唯一的 effects() 调用点必须走 applyEventEffects
head('[1b] 消费端挂载点 —— 不装饰事件对象（挂载顺序会把它冲掉）');
var 源 = fs.readFileSync(path.join(ROOT, 'js/npcs/npc-personal-events.js'), 'utf8');
ok(/applyEventEffects\(ev\.eventDef, npc, choice\.effect\)/.test(源),
    'handlePersonalEventChoice 改调 applyEventEffects（读侧接在唯一调用点上）');
ok(!/ev\.eventDef\.effects\(npc, choice\.effect\)/.test(源),
    '原始直调 ev.eventDef.effects 的写法已从选择分支里去掉');
var html = fs.readFileSync(path.join(ROOT, '仙侠.html'), 'utf8');
var 序 = (html.match(/src="([^"]+\.js)"/g) || []).map(function (s) { return s.slice(5, -1); });
var 我 = 序.indexOf('js/npcs/npc-personal-events.js');
var 后 = ['js/npcs/shaolin-pojie-events.js', 'js/npcs/jealousy-deep.js', 'js/npcs/heroine-aftermath.js', 'js/npcs/wujiu-jealousy.js']
    .map(function (p) { return 序.indexOf(p); });
ok(后.every(function (i) { return i > 我; }),
    '本文件（#' + (我 + 1) + '）早于全部消费端文件（' + 后.map(function (i) { return '#' + (i + 1); }).join('/') + '）——所以装饰事件对象会被冲掉，改挂调用点是对的做法');

// ============ [2] ★存得住：走真实 npcManager.serialize → deserialize ============
head('[2] ★存得住 —— 真·存档往返（不用桩）');
var 沙真 = 建沙箱(true);
var W2 = 沙真.w;
if (typeof W2.initNPCSystem === 'function') { try { W2.initNPCSystem(); } catch (e) { } }
var M = W2.npcManager;
ok(!!M && typeof M.serialize === 'function' && typeof M.deserialize === 'function',
    '真实 npcManager 装上了（含 serialize/deserialize）');
var 全体 = M && typeof M.getAllNPCs === 'function' ? M.getAllNPCs() : [];
ok(全体.length > 0, '真实 NPC ' + 全体.length + ' 个');
var 目标 = 全体.filter(function (n) { return String(n.id).indexOf('sect_leader_') === 0 || n.id === 'shaolin_wujiu'; })[0] || 全体[0];

// 真结算一个 open 选项，让旗与注记账都落下来
var 试值 = null, 试Ev = null;
Object.keys(W2.NPC_PERSONAL_EVENTS).forEach(function (id) {
    if (试值) return;
    var ev = W2.NPC_PERSONAL_EVENTS[id];
    if (!ev || ev.npcId !== 目标.id) return;
    (ev.scenes || []).forEach(function (s) {
        (s.options || []).forEach(function (o) {
            if (试值) return;
            var spec = W2.NPC_EFFECT_MAP[o.effect];
            if (spec && spec.split(':')[0] === 'open') { 试值 = o.effect; 试Ev = ev; }
        });
    });
});
ok(!!试值, '在 ' + 目标.id + ' 的事件里找到一个 open 取值来结算：' + 试值);
W2.eventFlags = {};
W2.settleNpcEventConsequence(目标, 试Ev, 试值, { trustTouched: false, loveTouched: false });
var 旗 = 'pe_open_' + 目标.id + '_' + 试值;
ok(目标.hasFlag(旗), '结算后旗已落：' + 旗);
ok(!!W2.eventFlags['pe_open_note_' + 目标.id + '_' + 试值],
    '注记账里有「约的原话」：' + JSON.stringify(W2.eventFlags['pe_open_note_' + 目标.id + '_' + 试值]));
ok(W2.eventFlags['pe_route_' + 目标.id] >= 1, '路线账 +1（现 ' + W2.eventFlags['pe_route_' + 目标.id] + '）');

// ★ 真往返
var blob = M.serialize();
var 存档条 = blob.filter(function (x) { return x && x.id === 目标.id; })[0];
ok(!!存档条 && Array.isArray(存档条.relationship.flags), 'serialize 后该 NPC 的 flags 是数组');
ok(存档条.relationship.flags.indexOf(旗) >= 0, '★存档条目里带着 pe_open_ 旗（读档不丢的前置）');
var 注账快照 = JSON.parse(JSON.stringify(W2.eventFlags));
W2.eventFlags = {};
M.deserialize(JSON.parse(JSON.stringify(blob)));
var 读回 = M.getNPC(目标.id);
ok(!!读回, 'deserialize 后 getNPC(' + 目标.id + ') 找得到人');
ok(读回.hasFlag(旗), '★读档后旗还在：' + 旗);
ok(读回.relationship.flags instanceof Set, '读档后 flags 恢复成 Set（npc-system.js:1559）');
ok(W2.openRoutesOf(读回).indexOf(试值) >= 0, '★读档后 openRoutesOf 仍列出这条路：' + 试值);
ok(W2.hasOpenRoute(目标.id, 试值) === true, '★读档后 hasOpenRoute 仍为真');
W2.eventFlags = 注账快照;   // GameState 读档时按 eventFlags 灌回（core/game-state.js）
ok(W2.openRouteLabel(目标.id, 试值) !== '', '★读档后 openRouteLabel 仍能说出那桩约：' + W2.openRouteLabel(目标.id, 试值));
ok(W2.openRouteCount(目标.id) >= 1, '★读档后路线账仍数得出来：' + W2.openRouteCount(目标.id));

// ============ [3] ★旗标不同后果不同 ============
head('[3] ★旗标不同·后果不同 —— 每条消费端在旗 0 / 旗 1 两态下产出可观测差异');
function 跑消费端(evId, npcId, value, 开旗) {
    var ev = E[evId];
    var npc = 造NPC(npcId);
    npc.relationship.affection = 10; npc.relationship.trust = 5;
    W.npcManager._册[npcId] = npc;              // 真的在册，读旗走的是注册表那条路
    W.eventFlags = {};
    if (开旗) npc.setFlag('pe_open_' + npcId + '_' + value);
    // 走真实挂载点（含旗标读侧）
    var out = W.applyEventEffects(ev, npc, 'witness');
    return {
        aff: (Number(out.affection) || 0),
        rel: npc.relationship.affection,
        msg: String(out.msg || ''),
        hits: out.openRouteHits || []
    };
}
var 接的条数 = 0;
Object.keys(W.NPC_OPEN_ROUTE_FOLLOWS).forEach(function (evId) {
    (W.NPC_OPEN_ROUTE_FOLLOWS[evId] || []).forEach(function (r) {
        接的条数++;
        var 无 = 跑消费端(evId, r.npc, r.value, false);
        var 有 = 跑消费端(evId, r.npc, r.value, true);
        var 旗 = 'pe_open_' + r.npc + '_' + r.value;
        var 差 = 有.aff - 无.aff;
        var 文差 = 有.msg.indexOf('已开的路应验') >= 0 && 无.msg.indexOf('已开的路应验') < 0;
        ok(差 === r.aff && 有.rel - 无.rel === r.aff && 文差,
            evId + ' × ' + 旗 + '：好感 ' + 无.aff + '→' + 有.aff +
            '（NPC 轨 ' + 无.rel + '→' + 有.rel + '）、文案 ' + (文差 ? '多了应验提示' : '没差异') +
            '、命中 ' + JSON.stringify(有.hits));
    });
});
ok(接的条数 >= 4, '共 ' + 接的条数 + ' 条消费端接线逐条验过（≥4）');

// 反向：不读旗就一定回到 0 差异之外——把旗读旁路掉，两态必须同结果（证明差异确实来自读旗）
head('[3b] 差异确实来自读旗 —— 把读旁路掉，两态同结果');
var 某 = W.NPC_OPEN_ROUTE_FOLLOWS['wujiu_event_j09'][0];
function 跑旁路(npcId, value, 开旗) {
    var npc = 造NPC(npcId); npc.relationship.affection = 10;
    W.npcManager._册[npcId] = npc;
    if (开旗) npc.setFlag('pe_open_' + npcId + '_' + value);
    var 真读 = W.hasOpenRoute;
    W.hasOpenRoute = function () { return false; };      // 旁路：旗读一律当没开
    try {
        var out = W.applyEventEffects(E['wujiu_event_j09'], npc, 'witness');
        return { aff: Number(out.affection) || 0, msg: String(out.msg || '') };
    } finally { W.hasOpenRoute = 真读; }
}
var b0 = 跑旁路(某.npc, 某.value, false), b1 = 跑旁路(某.npc, 某.value, true);
ok(b0.aff === b1.aff && b0.msg === b1.msg,
    '读旗被旁路后，开/不开旗结果完全一致（aff ' + b0.aff + '=' + b1.aff + '）——差异确实来自那一次读取，不是别处顺带变的');
ok(b0.aff === 0, '旁路下额外好感为 0（原本是 ' + 某.aff + '）');

// 结算侧：首落与重落的回执不同 + 首落给一笔信任
head('[3c] 结算侧 —— 首落与重落的回执不同，首落另给一笔信任');
var ns = 造NPC('shaolin_wujiu');
W.npcManager._册['shaolin_wujiu'] = ns;
W.eventFlags = {};
// 用真事件（有 scenes），注记账才拿得到「约的原话」
var 真Ev = E['wujiu_event_008'];
ok(!!真Ev, '结算侧取真事件 wujiu_event_008（带 scenes，注记账才录得到原话）');
var o1 = W.settleNpcEventConsequence(ns, 真Ev, 'friend', { trustTouched: false, loveTouched: false });
var o2 = W.settleNpcEventConsequence(ns, 真Ev, 'friend', { trustTouched: false, loveTouched: false });
ok(o1 && o1.deltas.trust === 1, '首落给信任 +1（实得 ' + (o1 && o1.deltas.trust) + '）');
ok(o2 && o2.deltas.trust === undefined, '重落不再重复给信任（不给就是不给，不装作给了）');
ok(o1.lines.some(function (l) { return l.text.indexOf('路线已开') >= 0; }) &&
    o2.lines.some(function (l) { return l.text.indexOf('又走了一遍') >= 0; }),
    '首落说「路线已开」、重落说「又走了一遍」——玩家看得出区别');
ok(o2.lines.some(function (l) { return l.text.indexOf('头一回说的是') >= 0; }),
    '重落时把头一回那桩约的原话念出来（不是空口说"又走了一遍"）');
ok(W.openRouteLabel('shaolin_wujiu', 'friend') !== '', '注记账里有约的原话：' + W.openRouteLabel('shaolin_wujiu', 'friend'));
// 注记账不得被第二次结算覆写——第一次说的才是那桩约
var 首句 = W.openRouteLabel('shaolin_wujiu', 'friend');
W.settleNpcEventConsequence(造NPC('shaolin_wujiu'), 真Ev, 'friend', { trustTouched: false, loveTouched: false });
ok(W.openRouteLabel('shaolin_wujiu', 'friend') === 首句, '第二次结算没有覆写头一回那桩约的原话');

// ============ [4] 纪律 ============
head('[4] 纪律 —— 零骰 / 无空 catch / 零 Math.random');
var 起 = 源.indexOf('NPC_EFFECT_KINDS = {');
var 止 = 源.indexOf('window.handlePersonalEventChoice = function');
var 新码 = 源.slice(起, 止);
ok(新码.indexOf('Math.random') < 0, '受控枚举与消费端代码 0 处 Math.random（零骰）');
var 空catch = (新码).match(/catch\s*\([^)]*\)\s*\{\s*\}/g);
ok(!空catch, '无空 catch（实得 ' + (空catch ? 空catch.length : 0) + ' 处）');
var catch数 = (新码.match(/\bcatch\s*\(/g) || []).length;
var 有话catch = (新码.match(/catch\s*\([^)]*\)\s*\{[^}]*console\.(warn|error)/g) || []).length;
ok(catch数 === 有话catch, '每个 catch 都有 console 告警交代（catch ' + catch数 + ' 处 / 有话 ' + 有话catch + ' 处）');

console.log('\n------------------------------------------');
console.log('通过 ' + passed + ' / 失败 ' + failed);
if (failed > 0) { console.log('本套件红。'); process.exit(1); }
console.log('本套件全绿。');
process.exit(0);
