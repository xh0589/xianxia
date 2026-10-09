/**
 * v26.9-npc-effect-enum-node.js — NPC 事件后果受控枚举回归防护
 *
 * 病根（实测）：988 场个人事件、2938 个选项，effect 全是裸字符串、659 个不同取值，
 *   引擎层不认任何取值——每个事件自带 effects() 闭包 switch(choice)，漏一个 case 就静默什么都不发生。
 *   玩家在 988 场里几乎只看得到「好感 +N」。
 *
 * 修法：NPC_EFFECT_KINDS（8 类，每类真结算、含 13 个子分支）
 *      + NPC_EFFECT_SPEC（659 取值映射）
 *      + 兼容层（未登记走老路径 + console 警告，可逐步收敛）。
 *
 * 手法：按 仙侠.html 全部 352 个 script 的真实挂载顺序装进 vm 沙箱真跑，
 *       对着 988 场事件的真实选项逐个结算，比对七本账的差分。
 * ⚠️ 只装 js/npcs/ 的薄沙箱会静默丢掉 50 场（988→938），别用那种姿势量覆盖。
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
function 建沙箱() {
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
        npcManager: { getNPC: function () { return null; }, getAllNPCs: function () { return []; }, detectRivalRomance: function () { return null; } },
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
    return { w: w, ctx: ctx, 警告: 警告, 装载问题: 缺, 脚本数: 全部.length };
}

var 沙 = 建沙箱();
var W = 沙.w;
var E = W.NPC_PERSONAL_EVENTS;

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
function 快照(npc) {
    var r = npc.relationship;
    return {
        affection: r.affection, hatred: r.hatred, favor: r.favor, respect: r.respect,
        love: r.love, fear: r.fear, trust: r.trust,
        flags: r.flags.size,
        impressions: Object.keys(npc.memory.impressions).length,
        // 玩家账记「记在哪本账的哪一页」——只记账本名会把不同取值的知情账算成同一本
        efp: Object.keys(W.eventFlags).sort().join('|'),
        negative: (W._negativeChoiceCount && W._negativeChoiceCount[npc.id]) || 0,
        stones: W.currentCharData.spiritStones, energy: W.currentCharData.energy
    };
}
function 差(a, b) {
    var d = {};
    Object.keys(b).forEach(function (k) {
        if (a[k] === b[k]) return;
        d[k] = (typeof a[k] === 'number' && typeof b[k] === 'number') ? (b[k] - a[k]) : ('→' + b[k]);
    });
    return d;
}
function 签名(d) {
    return Object.keys(d).sort().map(function (k) {
        if (typeof d[k] === 'number') return k + d[k];
        return k + '=' + d[k];
    }).join(',');
}
function 结算差分(value, guard, prime) {
    var npc = 造NPC('diff_' + value);
    // prime = 中局状态：七轨都已开账。0 底轨在 0 处减不动，只在满盘 NPC 上测分支差异
    // 会把「真的不同」误判成「都一样」——所以空盘与满盘两种都测。
    if (prime) {
        npc.relationship.trust = 20; npc.relationship.respect = 30;
        npc.relationship.love = 15; npc.relationship.favor = 10;
        npc.relationship.hatred = 5; npc.relationship.fear = 5;
    }
    W.currentCharData.spiritStones = 500; W.currentCharData.energy = 100;
    W.eventFlags = {}; W._negativeChoiceCount = {};
    var b = 快照(npc);
    var out = W.settleNpcEventConsequence(npc, { id: 'd', npcId: 'diff_' + value }, value,
        guard || { trustTouched: false, loveTouched: false });
    var d = 差(b, 快照(npc));
    return { out: out, d: d, lines: out ? out.lines.length : 0 };
}

console.log('\n========== v26.9 · NPC 事件后果受控枚举回归 ==========');

// ============ [0] 装载 ============
head('[0] 装载（988 场，不能用只装 js/npcs/ 的薄沙箱）');
ok(Object.keys(E).length === 988, 'NPC_PERSONAL_EVENTS 实装 ' + Object.keys(E).length + ' 场（期望 988）');
var 严重 = 沙.装载问题.filter(function (m) { return m.indexOf('::') >= 0 && m.indexOf('MutationObserver') < 0 && m.indexOf('addEventListener') < 0; });
ok(严重.length === 0, '352 个脚本装载无意外错误（意外：' + (严重.slice(0, 3).join(' | ') || '无') + '）');
ok(!!W.NPC_EFFECT_KINDS && !!W.NPC_EFFECT_MAP && !!W.NPC_EFFECT_SPEC && !!W.NPC_EFFECT_COMPAT,
    '四个导出面都在：KINDS / SPEC / MAP / COMPAT');
ok(typeof W.settleNpcEventConsequence === 'function', '结算入口 settleNpcEventConsequence 已挂 window');
ok(typeof W.renderNpcEventConsequence === 'function', '渲染入口 renderNpcEventConsequence 已挂 window');

// ============ [1] 枚举完整：登记的每个类型都有真实结算函数 ============
head('[1] 枚举完整 —— 没有「登记了但不处理」');
var KINDS = W.NPC_EFFECT_KINDS;
var 类型名 = Object.keys(KINDS);
ok(类型名.length >= 6, '受控类型 ' + 类型名.length + ' 类（≥6，每类一类语义，不是 1 个万能类）');
var 空实现 = [], 无标签 = [];
类型名.forEach(function (k) {
    var d = KINDS[k];
    if (!d || typeof d.settle !== 'function') { 空实现.push(k); return; }
    if (typeof d.label !== 'string' || !d.label) 无标签.push(k);
    var src = String(d.settle);
    var 体 = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '').replace(/\{[\s\S]*\}/, '').trim();
    if (!体) 空实现.push(k + '(空体)');
});
ok(空实现.length === 0, '每个类型都有 settle() 且不是空实现（空转名单：' + (空实现.join(',') || '无') + '）');
ok(无标签.length === 0, '每个类型都有玩家可见的中文标签（缺标签：' + (无标签.join(',') || '无') + '）');
var 坏引用 = [];
Object.keys(W.NPC_EFFECT_SPEC).forEach(function (s) { if (!KINDS[s.split(':')[0]]) 坏引用.push(s); });
ok(坏引用.length === 0, 'SPEC 没有指向未定义类型的条目（坏引用：' + (坏引用.join(',') || '无') + '）');
var 假条目 = [];
Object.keys(W.NPC_EFFECT_MAP).forEach(function (v) {
    var 命中 = false;
    Object.keys(E).forEach(function (id) {
        if (命中) return;
        (E[id].scenes || []).forEach(function (s) {
            (s.options || []).forEach(function (o) { if (o.effect === v) 命中 = true; });
        });
    });
    if (!命中) 假条目.push(v);
});
ok(假条目.length === 0, '映射表没有「登记了但运行时不存在」的假条目（假：' + (假条目.join(',') || '无') + '）');

// 覆盖比例（用真实 988 场量，不用薄沙箱）
var 真取值 = new Set(), 真选项 = 0, 未登记 = new Set();
Object.keys(E).forEach(function (id) {
    (E[id].scenes || []).forEach(function (s) {
        (s.options || []).forEach(function (o) {
            真选项++;
            if (typeof o.effect === 'string') { 真取值.add(o.effect); if (!W.NPC_EFFECT_MAP[o.effect]) 未登记.add(o.effect); }
        });
    });
});
ok(真选项 === 2938, '选项总数 ' + 真选项 + '（期望 2938）');
ok(真取值.size === 659, '不同 effect 取值 ' + 真取值.size + ' 个（期望 659）');
var 已盖选项 = 0;
Object.keys(E).forEach(function (id) {
    (E[id].scenes || []).forEach(function (s) { (s.options || []).forEach(function (o) { if (W.NPC_EFFECT_MAP[o.effect]) 已盖选项++; }); });
});
ok(未登记.size === 0, '全部 ' + 真取值.size + ' 个取值都已登记（未登记：' + (Array.from(未登记).slice(0, 5).join(',') || '无') + '）');
console.log('        覆盖选项 ' + 已盖选项 + '/' + 真选项 + ' (' + (100 * 已盖选项 / 真选项).toFixed(1) + '%)');

// 每类真结算抽检
head('[1b] 每类真结算 —— 跑一次看账本动不动');
var 每类样本 = {};
Object.keys(E).forEach(function (id) {
    var ev = E[id]; if (!ev) return;
    (ev.scenes || []).forEach(function (s) {
        (s.options || []).forEach(function (o) {
            var spec = W.NPC_EFFECT_MAP[o.effect]; if (!spec) return;
            var kind = spec.split(':')[0];
            if (!每类样本[kind]) 每类样本[kind] = { ev: ev, value: o.effect };
        });
    });
});
类型名.forEach(function (k) {
    var smp = 每类样本[k];
    if (!smp) { ok(false, k + '：找不到样本选项'); return; }
    var npc = 造NPC('probe_' + k);
    W.currentCharData.spiritStones = 500; W.currentCharData.energy = 100;
    W.eventFlags = {}; W._negativeChoiceCount = {};
    var b = 快照(npc);
    var out = W.settleNpcEventConsequence(npc, smp.ev, smp.value, { trustTouched: false, loveTouched: false });
    var d = 差(b, 快照(npc));
    ok(!!out && Object.keys(d).length > 0,
        k + ' 结算 "' + smp.value + '" 真动了账本：{' + 签名(d) + '}');
});

// ============ [2] 兼容层：未登记取值走原路径且不报错 ============
head('[2] 兼容层 —— 未登记的旧 effect 走原路径 + 有警告');
var npc2 = 造NPC('compat_probe');
W.currentCharData.spiritStones = 500; W.currentCharData.energy = 100; W.eventFlags = {}; W._negativeChoiceCount = {};
var 警前 = 沙.警告.length;
var 兼前 = W.NPC_EFFECT_COMPAT.unknownOptions;
var b2 = 快照(npc2);
var outUnknown = W.settleNpcEventConsequence(npc2, { id: 'probe_ev', npcId: 'compat_probe' }, 'zzz_未登记的旧取值', {});
ok(outUnknown === null, '未登记取值返回 null（老路径继续，只改好感）');
ok(Object.keys(差(b2, 快照(npc2))).length === 0, '未登记取值不擅自动任何账本');
ok(W.NPC_EFFECT_COMPAT.unknown['zzz_未登记的旧取值'] === 1, '兼容层记下了未登记取值的计数');
ok(W.NPC_EFFECT_COMPAT.unknownOptions === 兼前 + 1, '兼容层记下了未登记选项数');
ok(沙.警告.slice(警前).some(function (m) { return m.indexOf('未登记') >= 0 && m.indexOf('zzz_未登记的旧取值') >= 0; }),
    '兼容层有 console 告警（不是空 catch，有话交代）');
var 警数1 = 沙.警告.length;
W.settleNpcEventConsequence(npc2, { id: 'probe_ev2', npcId: 'compat_probe' }, 'zzz_未登记的旧取值', {});
ok(沙.警告.length === 警数1, '同一未登记取值只告警一次（第二轮无新告警，不刷屏）');
var 警数2 = 沙.警告.length;
W.settleNpcEventConsequence(造NPC('ok_probe'), { id: 'p', npcId: 'ok_probe' }, 'vow', {});
ok(沙.警告.length === 警数2, '已登记取值不产生兼容层告警');

// ============ [3] ★真差异化 ============
head('[3] ★真差异化 —— 同一类型下不同取值效果确实不同（不是都只加好感）');
var 同类组 = {
    pledge: ['vow', 'accept', 'tell'], warmth: ['stay', 'hold', 'silent', 'hug'],
    respect: ['learn', 'praise', 'shield'], insight: ['ask', 'probe', 'read'],
    distance: ['refuse', 'ignore', 'quit'], open: ['friend', 'unseal']
};
Object.keys(同类组).forEach(function (kind) {
    var sigs = 同类组[kind].map(function (v) { return v + '→{' + 签名(结算差分(v).d) + '}'; });
    var uniq = {}; sigs.forEach(function (s) { uniq[s] = 1; });
    ok(Object.keys(uniq).length >= 2, kind + ' 同类不同取值产生不同差分（' + sigs.join('  ') + '）');
});
var spite分支 = { humiliate: 'mock', harm: 'stab', betray: 'deflect', quarrel: 'argue' };
var spiteSigs = {};
Object.keys(spite分支).forEach(function (br) { spiteSigs[br] = 签名(结算差分(spite分支[br]).d); });
var spiteUniq = {}; Object.keys(spiteSigs).forEach(function (b) { spiteUniq[spiteSigs[b]] = 1; });
ok(Object.keys(spiteUniq).length === 4, 'spite 四分支走四套不同账本组合：\n        ' +
    Object.keys(spiteSigs).map(function (b) { return b + '(' + spite分支[b] + ')→{' + spiteSigs[b] + '}'; }).join('\n        '));
ok(spiteSigs.harm.indexOf('fear') >= 0, 'spite:harm 真的写到 fear（不是只加好感）');
ok(spiteSigs.humiliate.indexOf('fear') < 0, 'spite:humiliate 不动 fear（分支确实不同）');

var cost分支 = { coin: 'pay', labor: 'haul', risk: 'spar' };
var costSigs = {};
Object.keys(cost分支).forEach(function (br) { costSigs[br] = 签名(结算差分(cost分支[br]).d); });
var costUniq = {}; Object.keys(costSigs).forEach(function (b) { costUniq[costSigs[b]] = 1; });
ok(Object.keys(costUniq).length === 3, 'cost 三分支动三种真资源：\n        ' +
    Object.keys(costSigs).map(function (b) { return b + '(' + cost分支[b] + ')→{' + costSigs[b] + '}'; }).join('\n        '));
ok(/stones/.test(costSigs.coin), 'cost:coin 扣的是灵石（真资源）');
ok(/energy/.test(costSigs.labor), 'cost:labor 扣的是精力（真资源）');
ok(/energy/.test(costSigs.risk) && /fear/.test(costSigs.risk), 'cost:risk 扣精力且留恐惧');

// 满盘 NPC 上再测一次：0 底轨在 0 处减不动，那不是分支没区别，是账本还没开
var spiteFull = {};
Object.keys(spite分支).forEach(function (br) { spiteFull[br] = 结算差分(spite分支[br], null, true).d; });
var spiteFullUniq = {}; Object.keys(spiteFull).forEach(function (b) { spiteFullUniq[签名(spiteFull[b])] = 1; });
ok(Object.keys(spiteFullUniq).length === 4, '满盘 NPC 上 spite 四分支仍是四套账本：\n        ' +
    Object.keys(spiteFull).map(function (b) { return b + '(' + spite分支[b] + ')→{' + 签名(spiteFull[b]) + '}'; }).join('\n        '));
ok(spiteFull.quarrel.trust < 0, '争执分支在满盘上真砸 trust（' + spiteFull.quarrel.trust + '）');
ok(spiteFull.humiliate.trust === undefined, '嘲讽分支不动 trust（两分支账本真的不同）');
ok(spiteFull.betray.trust < 0, '背叛分支在满盘上真砸 trust（' + spiteFull.betray.trust + '）');
ok(spiteFull.harm.fear > 0 && spiteFull.humiliate.fear === undefined, '只有伤人分支留恐惧');
var 同类满盘 = { warmth: ['stay', 'hold', 'silent', 'hug'], pledge: ['vow', 'accept', 'tell'] };
Object.keys(同类满盘).forEach(function (kind) {
    var sigs = 同类满盘[kind].map(function (v) { return v + '→{' + 签名(结算差分(v, null, true).d) + '}'; });
    var uniq = {}; sigs.forEach(function (s) { uniq[s] = 1; });
    ok(Object.keys(uniq).length >= 2, kind + ' 满盘上同类不同取值仍不同（' + sigs.join('  ') + '）');
});
// 没有任何一类是「所有取值都只加好感」
var 只动好感 = [];
类型名.forEach(function (k) {
    var vals = Object.keys(W.NPC_EFFECT_MAP).filter(function (v) { return W.NPC_EFFECT_MAP[v].split(':')[0] === k; });
    var 只 = 0;
    vals.forEach(function (v) {
        var ks = Object.keys(结算差分(v).d);
        if (ks.length === 0 || ks.every(function (x) { return x === 'affection'; })) 只++;
    });
    if (vals.length > 0 && 只 === vals.length) 只动好感.push(k);
});
ok(只动好感.length === 0, '没有任何一类是「所有取值都只加好感」（' + (只动好感.join(',') || '无') + '）');
var hugD = 结算差分('hug').d, holdD = 结算差分('hold').d;
ok(Math.abs(hugD.love || 0) > Math.abs(holdD.love || 0), '同类内权重不同→实际数值不同（hug love+' + (hugD.love || 0) + ' vs hold love+' + (holdD.love || 0) + '）');

// ★成败判据：场内差异化
head('[3c] ★场内差异化 —— 同一场的选项后果是否真的不同（这是本任务的成败判据）');
var 抉择场 = 0, 场内同 = 0, 场内异 = 0;
var 场内同样本 = [];
Object.keys(E).forEach(function (id) {
    var ev = E[id]; if (!ev) return;
    (ev.scenes || []).forEach(function (s, si) {
        var os = s.options || []; if (os.length < 2) return;
        抉择场++;
        var sigs = os.map(function (o) { return 签名(结算差分(o.effect, null, true).d); });
        var uniq = {}; sigs.forEach(function (x) { uniq[x] = 1; });
        if (Object.keys(uniq).length === 1) {
            场内同++;
            if (场内同样本.length < 8) 场内同样本.push(id + ' 场[' + si + '] → {' + sigs[0] + '}');
        } else 场内异++;
    });
});
ok(抉择场 === 978, '含 2+ 选项的抉择场 ' + 抉择场 + ' 场（988 场里 10 场是单选/无选项，其余全部纳入实测）');
ok(场内同 === 0, '★没有任何一场的选项后果完全相同（假选择 0 场；仍同的：' +
    (场内同样本.length ? 场内同样本.join(' | ') : '无') + '）');
ok(场内异 / (场内异 + 场内同) >= 0.99, '★场内差异化率 ' + (100 * 场内异 / (场内异 + 场内同)).toFixed(1) + '%（≥99%）');

// 全局等价桶体检
head('[3d] 全局等价桶体检');
var 桶 = {};
Object.keys(W.NPC_EFFECT_MAP).forEach(function (v) {
    var s = 签名(结算差分(v, null, true).d);
    (桶[s] = 桶[s] || []).push(W.NPC_EFFECT_MAP[v]);
});
var 全局签 = Object.keys(桶);
var 最大桶签 = 全局签.slice().sort(function (a, b) { return 桶[b].length - 桶[a].length; })[0];
var 最大分支 = {};
桶[最大桶签].forEach(function (spec) { 最大分支[spec] = (最大分支[spec] || 0) + 1; });
var 最大分支桶 = Object.keys(最大分支).sort(function (a, b) { return 最大分支[b] - 最大分支[a]; })[0];
ok(全局签.length >= 150, '659 个取值共 ' + 全局签.length + ' 种可分辨后果（≥150，不是 8 类模板）');
ok(桶[最大桶签].length <= 130, '最大等价桶 ' + 桶[最大桶签].length + ' 个取值（≤130），主要落在 ' + 最大分支桶);
ok(全局签.filter(function (s) { return 桶[s].length > 130; }).length === 0, '没有分支桶膨胀到 130 个取值以上（膨胀即退化）');

// 全量逐个结算
head('[3b] 全量实测 —— 2938 个真实选项逐个结算');
var 跑过 = 0, 抛错 = 0, 有差分 = 0, 差分种类 = {}, label种类 = {}, line数 = 0;
var 抛错样本 = [];
Object.keys(E).forEach(function (id) {
    var ev = E[id]; if (!ev || !ev.npcId) return;
    (ev.scenes || []).forEach(function (s) {
        (s.options || []).forEach(function (o) {
            var npc = 造NPC(ev.npcId);
            W.currentCharData.spiritStones = 500; W.currentCharData.energy = 100;
            W.eventFlags = {}; W._negativeChoiceCount = {};
            var b = 快照(npc);
            var out;
            try { out = W.settleNpcEventConsequence(npc, ev, o.effect, { trustTouched: false, loveTouched: false }); }
            catch (e) { 抛错++; if (抛错样本.length < 3) 抛错样本.push(id + '/' + o.effect + ': ' + e.message); return; }
            跑过++;
            if (!out) return;
            line数 += out.lines.length;
            var ks = 签名(差(b, 快照(npc)));
            if (Object.keys(差(b, 快照(npc))).length > 0) { 有差分++; 差分种类[ks] = (差分种类[ks] || 0) + 1; }
            else { 差分种类['(无变化)'] = (差分种类['(无变化)'] || 0) + 1; }
            label种类[out.label] = (label种类[out.label] || 0) + 1;
        });
    });
});
ok(跑过 === 2938, '988 场事件的 ' + 跑过 + ' 个真实选项全部结算过（不抛错）');
ok(抛错 === 0, '结算 0 抛错（样本：' + (抛错样本.join(' | ') || '无') + '）');
ok(有差分 === 跑过, '每一个选项都让真账本动了（' + 有差分 + '/' + 跑过 + '，无账本变化的：' + (差分种类['(无变化)'] || 0) + '）');
ok(Object.keys(差分种类).length >= 15, '产生了 ' + Object.keys(差分种类).length + ' 种不同账本差分（不是一种模板）');
ok(Object.keys(label种类).length === 类型名.length, '八类标签都真实出现过：' + JSON.stringify(label种类));
ok(line数 > 跑过, '结算行共 ' + line数 + ' 条（多于选项数，玩家看得见的东西确实变多了）');
console.log('        差分种类前 8：' + Object.keys(差分种类).sort(function (a, b) { return 差分种类[b] - 差分种类[a]; }).slice(0, 8)
    .map(function (k) { return '{' + k + '}×' + 差分种类[k]; }).join(' '));

// ============ [4] 可见 ============
head('[4] 可见 —— 后果真的画进对话流');
var 挂上的 = [];
var 假msgArea = {
    appendChild: function (n) { 挂上的.push(n.innerHTML); },
    set scrollTop(v) { }, get scrollHeight() { return 0; }
};
var 假ev = { msgArea: 假msgArea };
var o4 = 结算差分('vow').out;
W.renderNpcEventConsequence(假ev, o4);
ok(挂上的.length === 1, '渲染函数往对话流挂了 1 个结算块');
ok(挂上的[0].indexOf('后果·立誓') >= 0, '结算块印出后果类型（后果·立誓）——玩家知道自己选了什么后果');
ok(挂上的[0].indexOf('信任') >= 0, '结算块印出具体账本变化（信任）');
ok(挂上的[0].indexOf('承诺落笔') >= 0, '结算块印出落笔的承诺旗');
ok(挂上的[0].indexOf(o4.value) >= 0, '结算块印出原始 effect 取值（可追溯）');
类型名.forEach(function (k) {
    var v = 每类样本[k] ? 每类样本[k].value : 类型名[k];
    W.currentCharData.spiritStones = 500; W.currentCharData.energy = 100; W.eventFlags = {};
    var out = W.settleNpcEventConsequence(造NPC('vis_' + k), { id: 'v', npcId: 'vis_' + k }, v, {});
    挂上的 = [];
    W.renderNpcEventConsequence(假ev, out);
    ok(挂上的.length === 1 && 挂上的[0].indexOf('后果·' + KINDS[k].label) >= 0,
        k + ' 的后果在对话流里可见（后果·' + KINDS[k].label + '，取值 ' + v + '）');
});
ok(typeof W.renderNpcEventConsequence(假ev, null) === 'undefined', '无结算结果时不渲染（不塞假 UI）');

// ============ [5] 防双计 ============
head('[5] 防双计 —— 闭包已写 trust/love 时不重复写');
var npc5 = 造NPC('guard_probe');
npc5.relationship.trust = 10;
var o5 = W.settleNpcEventConsequence(npc5, { id: 'g', npcId: 'guard_probe' }, 'vow', { trustTouched: true, loveTouched: false });
ok(npc5.relationship.trust === 10, 'guard.trustTouched=true 时 trust 不再被加（仍为 10）');
ok(o5 && o5.lines.some(function (l) { return l.text.indexOf('不重复计') >= 0; }), '并且如实印出「不重复计」');
ok(o5 && o5.lines.some(function (l) { return l.text.indexOf('承诺落笔') >= 0; }), '承诺旗照落（不因为信任被占就不记）');
var npc5b = 造NPC('guard_probe2');
npc5b.relationship.love = 7;
W.settleNpcEventConsequence(npc5b, { id: 'g2', npcId: 'guard_probe2' }, 'hug', { trustTouched: false, loveTouched: true });
ok(npc5b.relationship.love === 7, 'guard.loveTouched=true 时 love 不再被加（仍为 7）');

// ============ [6] 零骰 & 空 catch 纪律 ============
head('[6] 纪律 —— 零骰 / 无空 catch');
var 源 = fs.readFileSync(path.join(ROOT, 'js/npcs/npc-personal-events.js'), 'utf8');
var 起始 = 源.indexOf('NPC_EFFECT_KINDS = {');
var 止 = 源.indexOf('window.handlePersonalEventChoice = function');
var 新码 = 源.slice(起始, 止);
var 调起点 = 源.indexOf('// ===== v26.9 受控枚举结算');
var 调止 = 源.indexOf('// 记录冷却天数');
var 调码 = 源.slice(调起点, 调止);
ok(新码.indexOf('Math.random') < 0 && 调码.indexOf('Math.random') < 0, '新增枚举代码 0 处 Math.random（零骰）');
var 空catch = (新码 + 调码).match(/catch\s*\([^)]*\)\s*\{\s*\}/g);
ok(!空catch, '新增枚举代码没有空 catch（实得 ' + (空catch ? 空catch.length : 0) + ' 处）');
// 只数真正的 catch 子句——effect 取值里有个叫 "catch" 的，不能当关键字算
var catch数 = ((新码 + 调码).match(/\bcatch\s*\(/g) || []).length;
var 有话catch = ((新码 + 调码).match(/catch\s*\([^)]*\)\s*\{[^}]*console\.(warn|error)/g) || []).length;
ok(catch数 === 有话catch, '每个 catch 都有 console 告警交代（catch 子句 ' + catch数 + ' 处 / 有话 ' + 有话catch + ' 处）');

console.log('\n------------------------------------------');
console.log('通过 ' + passed + ' / 失败 ' + failed);
if (failed > 0) { console.log('本套件红。'); process.exit(1); }
console.log('本套件全绿。');
process.exit(0);
