/**
 * pill-usable-node.js — 突破丹「拿得到但吃不掉」两处阻断的收口断言：
 *   B1 ★能吃★：每一张突破丹在物品详情里都有可用入口，且走真实 useItem 真的吃得掉
 *   B2 ★主路认账★：突破按钮走的是仪式路由（不是 _performBreakthroughNew 直调），
 *                 且仪式真读到已服下的 bonus 并清零
 *   B3 ★不欺骗★：界面写明「吃丹只算下一次」，且全库不再有"突破准备界面"那句假话
 *   B4 ★锁不隐藏★：吃不了的丹是亮锁 + 写清原因，不是整格消失
 *   B5 ★无数值变更★：所有成功率数字一个都没改
 *
 * 运行：node tests/pill-usable-node.js
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
function section(t) { console.log('\n[' + t + ']'); }

// ==================== 世界桩 ====================
var created = [];   // 收集 document.createElement 造出来的节点，好读回 showItemMenu 的 innerHTML
var W = {
    console: { log: function () {}, warn: function () {}, error: function () {} },
    setTimeout: function () { return 0; }, clearTimeout: function () {},
    setInterval: function () { return 0; }, clearInterval: function () {},
    localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
    document: {
        createElement: function (tag) {
            var el = {
                tagName: String(tag).toUpperCase(), style: {}, dataset: {}, innerHTML: '', textContent: '',
                classList: { add: function () {}, remove: function () {}, contains: function () { return false; } },
                appendChild: function () {}, removeChild: function () {}, remove: function () {},
                addEventListener: function () {}, setAttribute: function () {}, getAttribute: function () { return null; },
                querySelector: function () { return null; }, querySelectorAll: function () { return []; },
                closest: function () { return null; }, focus: function () {}
            };
            created.push(el);
            return el;
        },
        getElementById: function () { return null; },
        querySelector: function () { return null; },
        querySelectorAll: function () { return []; },
        addEventListener: function () {},
        body: { appendChild: function () {}, innerHTML: '' },
        head: { appendChild: function () {} },
        documentElement: { style: {} }
    },
    alert: function () {}, confirm: function () { return true; },
    inventory: { currency: { spiritStones: 0, copper: 0 }, slots: [] },
    currentCharData: null,
    EconomyTransaction: {
        getBalance: function () { return 999999; },
        debit: function () { return true; },
        removeByTemplate: function () { return true; },
        run: function (f) { return f(); }
    }
};
W.window = W;
W.self = W;
W.globalThis = W;
W.EventBus = { emit: function () {}, on: function () {} };
W.StateRegistry = { register: function () {} };
W.showMessage = function () {};
W.updateCharacterStatus = function () {};
W.updateInventoryUI = function () {};
W.showEffect = function () {};
W.doAutoSave = function () {};
W.timeSystem = { advanceTime: function () {} };
W.MoodSystem = { breakthroughBonus: function () { return 0; } };
W._bottleneckBonus = 0;
W.hasOwnProperty = Object.prototype.hasOwnProperty;

vm.createContext(W);
// 未知全局兜底：命中即说明该模块引用了一个本测试用不到的浏览器 API，不让它崩
var perm = new Proxy({}, {
    get: function (t, k) {
        if (k in t) return t[k];
        if (k === Symbol.toPrimitive) return function () { return 0; };
        if (typeof k === 'symbol') return undefined;
        return perm;
    },
    has: function () { return true; }
});
function load(rel) {
    try { vm.runInContext(loadScript(rel), W, { filename: rel }); }
    catch (e) {
        if (e instanceof ReferenceError) { vm.runInContext('window.__' + Math.random().toString(36).slice(2) + ' = __perm;', W); return; }
        throw e;
    }
}
// 扫源码时先剥掉注释：注释里为了说明问题会引用旧文案/旧函数名，
// 那是"记录"不是"界面/代码"，混进来会让断言自己打自己的脸。
function stripComments(src) {
    return String(src)
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/(^|[^:\\])\/\/.*$/gm, function (m, p1) { return p1; });
}

// ==================== 装配 ====================
load('js/items.js');
['01-pills', '02-weapons', '03-armor', '04-materials', '05-talismans', '06-arts', '07-food', '08-special']
    .forEach(function (f) { load('js/items-extended/' + f + '.js'); });
load('js/items-extended.js');
['13-missing-ids', '14-ability-manuals', '15-root-refine', '16-dangling-ids', '17-lead-tokens', '18-grade-expansion']
    .forEach(function (f) { load('js/items-extended/' + f + '.js'); });
load('js/data.js');
load('js/cultivation/breakthrough-system.js');
load('js/cultivation/breakthrough-ritual.js');
load('js/inventory.js');

var PILLS = (W.extendedBreakthroughPills || []).filter(function (p) {
    return p && p.subtype === 'breakthrough';
});
var REALMS = (W.REALM_CONFIG && W.REALM_CONFIG.realms || []).map(function (r) { return r.name; });

// 往背包塞东西，返回 uid
var uidSeq = 0;
function give(templateId, count) {
    var slot = { uid: 'u' + (++uidSeq), templateId: templateId, count: count || 1 };
    W.inventory.slots.push(slot);
    return slot.uid;
}
function slotOf(templateId) {
    return (W.inventory.slots || []).filter(function (s) { return s && s.templateId === templateId; })[0];
}
// 跑真 showItemMenu，回读它生成的那块 HTML
function menuHtml(uid) {
    created.length = 0;
    W.showItemMenu(uid);
    for (var i = created.length - 1; i >= 0; i--) {
        if (created[i].innerHTML && created[i].innerHTML.indexOf('<button') >= 0) return created[i].innerHTML;
    }
    return created.length ? (created[created.length - 1].innerHTML || '') : '';
}

// ============================================================
section('B1 能吃：详情里有入口，且真 useItem 吃得掉');
// ============================================================
PILLS.forEach(function (p) {
    W.inventory.slots = [];
    var uid = give(p.id, 2);
    var html = menuHtml(uid);
    var usable = p.implemented !== false
        && p.effect && (typeof p.effect.breakthrough_bonus === 'number' || typeof p.effect.breakthrough_bonus === 'string');

    if (usable) {
        ok(html.indexOf("useItem('" + uid + "')") >= 0, 'B1 ' + p.name + '(' + p.id + ') 详情里有可点的「使用」入口');
        ok(html.indexOf('>使用<') >= 0, 'B1 ' + p.name + ' 按钮文案是「使用」');
        // 真跑一次 useItem
        W.currentCharData = { realm: '炼气', layer: 1, _breakthroughPillBonus: 0 };
        var before = W.currentCharData._breakthroughPillBonus;
        var r = W.useItem(uid);
        var slot = slotOf(p.id);
        ok(r === true, 'B1 ' + p.name + ' 真 useItem 返回 true');
        ok(slot && slot.count === 1, 'B1 ' + p.name + ' 真扣掉一颗（剩 ' + (slot ? slot.count : '?') + '）');
        var expect = typeof p.effect.breakthrough_bonus === 'number'
            ? p.effect.breakthrough_bonus
            : null;   // 随机档区间固定，不在断言里钉死具体值
        if (expect !== null) {
            ok(Math.abs((W.currentCharData._breakthroughPillBonus - before) - expect) < 1e-9,
                'B1 ' + p.name + ' 加成入账 +' + expect + '（实得 +' + (W.currentCharData._breakthroughPillBonus - before).toFixed(4) + '）');
        } else {
            ok(W.currentCharData._breakthroughPillBonus > before,
                'B1 ' + p.name + ' 随机档确有加成入账（+' + (W.currentCharData._breakthroughPillBonus - before).toFixed(4) + '）');
        }
    } else {
        ok(html.indexOf("useItem('" + uid + "')") < 0, 'B1 ' + p.name + ' 未实装的丹不给可点的入口');
    }
});
// 逐境：每一境至少有>=1 张真吃得下的丹
REALMS.slice(0, -1).forEach(function (realm) {
    var list = (W.getBreakthroughPillsForRealm ? W.getBreakthroughPillsForRealm(realm) : []) || [];
    var eatable = list.filter(function (x) {
        var t = W.itemById[x.id];
        return t && t.implemented !== false && t.effect &&
            (typeof t.effect.breakthrough_bonus === 'number' || typeof t.effect.breakthrough_bonus === 'string');
    });
    ok(eatable.length > 0, 'B1 ' + realm + ' 至少有一张真吃得下的丹（共 ' + list.length + ' 张候选）');
});
console.log('     突破丹共 ' + PILLS.length + ' 张，逐张验过');

// ============================================================
section('B2 主路认账：按钮走仪式路由，仪式读到 bonus 并清零');
// ============================================================
['js/app.js', 'js/house-panel.js'].forEach(function (f) {
    var s = stripComments(loadScript(f));            // 剥注释：注释里引用旧函数名不算接线
    // 抓「尝试突破」那个按钮的 onclick
    var idx = s.indexOf('尝试突破');
    ok(idx > 0, f + ' 找得到「尝试突破」按钮');
    var win = s.lastIndexOf('onclick=', idx);
    var frag = s.slice(win, idx);
    var pIdx = frag.indexOf('performBreakthrough');
    var nIdx = frag.indexOf('_performBreakthroughNew');
    ok(pIdx >= 0, f + ' 按钮接的是 performBreakthrough 路由');
    ok(nIdx < 0 || pIdx < nIdx, f + ' performBreakthrough 在前、_performBreakthroughNew 只作兜底');
    ok(!/if\(typeof window\._performBreakthroughNew==='function'\)\{ ?if\(window\._performBreakthroughNew\(\)\)/.test(frag),
        f + ' 不再直调 _performBreakthroughNew 当主路');
});
// 真跑：压 bonus → 走路由 → 仪式读到并清零
function prepChar(realm) {
    W.currentCharData = {
        realm: realm, layer: 9, essence: 1e12, tempering: 1e12, qi: 1e9,
        energy: 100, spiritStones: 1e9, maxQi: 1e9, fortune: 0, _failedBreakthroughs: 0
    };
    W.inventory.slots = [];
    var next = REALMS[REALMS.indexOf(realm) + 1];
    var req = W.BREAKTHROUGH_MATERIALS[realm + '→' + next] || W.BREAKTHROUGH_MATERIALS['default'];
    W.inventory.slots = (req.items || []).map(function (it, i) {
        return { uid: 'm' + i, templateId: it.id, count: it.count };
    });
    W.EconomyTransaction.getBalance = function () { return 1e9; };
}
['炼气', '化神', '炼虚', '合体', '大乘'].forEach(function (realm) {
    prepChar(realm);
    var base = W.getBreakthroughRitualBaseRate(realm);
    W.currentCharData._breakthroughPillBonus = 0;
    if (W.breakthroughState) W.breakthroughState.inProgress = false;
    W.performBreakthrough();                       // 唯一路由
    var bare = W.breakthroughState.successRate;
    ok(W.breakthroughState.targetRealm === REALMS[REALMS.indexOf(realm) + 1],
        'B2 ' + realm + ' 路由进的是仪式（目标 ' + W.breakthroughState.targetRealm + '）');
    ok(bare >= base - 1e-9, 'B2 ' + realm + ' 裸成功率 ' + bare.toFixed(4) + ' ≥ 仪式基准 ' + base);

    if (W.breakthroughState) W.breakthroughState.inProgress = false;
    W.currentCharData._breakthroughPillBonus = 0.20;
    W.performBreakthrough();
    var withPill = W.breakthroughState.successRate;
    // 顶到 [0.1,0.95] 闸时要按闸算，不能拿裸增量对
    var wantDelta = Math.min(0.95, bare + 0.20) - bare;
    ok(Math.abs((withPill - bare) - wantDelta) < 1e-9,
        'B2 ' + realm + ' 压 0.20 后成功率涨 ' + wantDelta.toFixed(2) +
        '（' + bare.toFixed(2) + ' → ' + withPill.toFixed(2) + '）');
    ok(W.currentCharData._breakthroughPillBonus === 0,
        'B2 ' + realm + ' bonus 读后归 0（实得 ' + W.currentCharData._breakthroughPillBonus + '）');
    // 标准路径不读这个字段——两路必须分开，才说明路由这一步是真的
    if (W.breakthroughState) W.breakthroughState.inProgress = false;
    W.currentCharData._breakthroughPillBonus = 0.20;
    var nsIdx = REALMS.indexOf(realm);
    W._performBreakthroughNew();
    ok(W.currentCharData._breakthroughPillBonus === 0.20,
        'B2 ' + realm + ' 对照：标准路径不读 bonus（故必须走仪式才生效）');
    if (W.breakthroughState) W.breakthroughState.inProgress = false;
});

// ============================================================
section('B3 不欺骗：写明"吃丹只算下一次"');
// ============================================================
W.inventory.slots = [];
var huashen = PILLS.filter(function (p) { return p.id === 'pill_huashen'; })[0] || PILLS[0];
var hUid = give(huashen.id, 1);
var hHtml = menuHtml(hUid);
ok(hHtml.indexOf('下一次') >= 0, 'B3 详情写明加成计入「下一次」突破');
ok(hHtml.indexOf('面板') >= 0 && (hHtml.indexOf('定死') >= 0 || hHtml.indexOf('本次无效') >= 0),
    'B3 详情写明"仪式面板开着时再吃对本次无效"——不让玩家以为吃了立刻生效');
ok(hHtml.indexOf('只能在突破准备界面使用') < 0, 'B3 那句假话「只能在突破准备界面使用」已从界面消失');
// 全库扫一遍这句话，确认没有第二处
var htmlHits = 0;
['js/inventory.js', 'js/app.js', 'js/house-panel.js', 'js/cultivation/breakthrough-ritual.js'].forEach(function (f) {
    if (stripComments(loadScript(f)).indexOf('只能在突破准备界面使用') >= 0) htmlHits++;
});
ok(htmlHits === 0, 'B3 全库无「只能在突破准备界面使用」残留（注释外命中 ' + htmlHits + ' 处）');
// 也不能出现"仪式里可以服用"的假入口
ok(hHtml.indexOf('仪式') < 0 || hHtml.indexOf('定死') >= 0 || hHtml.indexOf('本次无效') >= 0,
    'B3 没把"仪式面板可服用"说成可用入口');

// ============================================================
section('B4 锁不隐藏：吃不了的是亮锁 + 原因，不是整格消失');
// ============================================================
// 造一张"有 subtype 但没有 breakthrough_bonus"的丹（护心丹就是这种）
var DEAD = { id: 'zz_dead_bt_probe', name: '探针丹', type: 'consumable', subtype: 'breakthrough', category: 'consumable', quality: 'PIN9', level: 1, price: 1, effect: { something_else: true }, stackable: true, maxStack: 1, desc: '探针' };
W.itemById[DEAD.id] = DEAD;
W.inventory.slots = [];
var dUid = give(DEAD.id, 1);
var dHtml = menuHtml(dUid);
ok(dHtml.indexOf('🔒 服用不了') >= 0, 'B4 吃不了的丹亮出「🔒 服用不了」');
ok(dHtml.indexOf('breakthrough_bonus') >= 0, 'B4 当场写清为什么（提到缺哪个效果键）');
ok(dHtml.indexOf('disabled') >= 0, 'B4 锁是真 disabled，不是能点的假按钮');
ok(dHtml.indexOf("useItem('" + dUid + "')") < 0, 'B4 吃不了的不给 useItem 入口');
ok(dHtml.indexOf('<button') >= 0, 'B4 不是整格消失（弹窗里仍有按钮：关闭/收藏/丢弃/锁）');
ok(dHtml.indexOf('关闭') >= 0, 'B4 关闭按钮仍在——格子没被抹掉');
// 已实装的普通消耗品不受牵连
W.inventory.slots = [];
var smallUid = give('pill_small_recovery', 1);
var sHtml = menuHtml(smallUid);
ok(sHtml.indexOf("useItem('" + smallUid + "')") >= 0, 'B4 对照：小还丹仍正常有「使用」');
// 医疗类仍按原样挡住（它们有疗伤界面，不属本批）
W.inventory.slots = [];
var medUid = give('med_bandage', 1);
var mHtml = menuHtml(medUid);
ok(mHtml.indexOf("useItem('" + medUid + "')") < 0, 'B4 医疗类绷带仍不给「使用」（疗伤界面另有其人，未被本批波及）');
ok(mHtml.indexOf('请在疗伤界面使用') >= 0, 'B4 医疗类仍写明去向');

// ============================================================
section('B5 无数值变更：成功率一个都没改');
// ============================================================
var ritual = loadScript('js/cultivation/breakthrough-ritual.js');
ok(/0\.8 - \(currentIndex \* 0\.05\)/.test(ritual), 'B5 仪式基准率仍是 0.8 - 境界序×0.05');
ok(/Math\.min\(0\.95, Math\.max\(0\.1, baseRate\)\)/.test(ritual), 'B5 上下限闸仍是 [0.1, 0.95]');
ok(/breakthroughState\.breakthroughCost = 100 \* \(currentIndex \+ 1\)|100 \* \(currentIndex \+ 1\)/.test(ritual),
    'B5 突破灵石消耗仍是 100 ×（境界序+1）');
ok(/fortune\) \|\| 0\) >= 30/.test(ritual), 'B5 燃机缘门槛仍是 fortune ≥ 30');
ok(/breakthrough_bonus\)\); window\.currentCharData\._breakthroughPillBonus = 0/.test(ritual)
    || /_breakthroughPillBonus\) { baseRate \+= _cd14\._breakthroughPillBonus; _cd14\._breakthroughPillBonus = 0; }/.test(ritual),
    'B5 bonus 读后清零这一行未被改动');
// 标准路径的系数也钉死（那边一个数都没碰）——真相是 getBaseSuccessRate 的历练比例阶梯，
// 不是"0.5 + 比例×0.5"（那是本测试最初想当然写的，实测 :90-98 是五档 0.20/0.30/0.40/0.50/0.60）
var bsys = stripComments(loadScript('js/cultivation/breakthrough-system.js'));
['if (ratio < 0.3) return 0.20;', 'if (ratio < 0.5) return 0.30;', 'if (ratio < 0.7) return 0.40;',
    'if (ratio < 0.9) return 0.50;', 'return 0.60;'].forEach(function (line) {
    ok(bsys.indexOf(line) >= 0, 'B5 标准路径阶梯未改：' + line);
});
ok(/rate \+= Math\.min\(0\.15, failures \* 0\.05\)/.test(bsys), 'B5 失败次数补偿仍是 min(0.15, 次×0.05)');
ok(/calculateBreakthroughRate\(charData, \[\]\)/.test(bsys),
    'B5 标准路径仍旧不吃丹（第二个参数恒空数组）——正因如此主路必须改走仪式');
// 每张丹的加成数值逐张钉死
var EXPECT_BONUS = {
    pill_peiyuan: 0.10, pill_zhuji: 0.12, pill_ningyuan: 0.15, pill_jieying: 0.18,
    pill_huashen: 0.20, pill_xukong: 0.23, pill_hebi: 0.25, pill_dacheng: 0.27,
    pill_pojing: 0.10, pill_wudao: '5~15%随机'
};
Object.keys(EXPECT_BONUS).forEach(function (id) {
    var t = W.itemById[id];
    ok(!!t, 'B5 ' + id + ' 仍在册');
    ok(t && t.effect && t.effect.breakthrough_bonus === EXPECT_BONUS[id],
        'B5 ' + id + ' 加成仍是 ' + EXPECT_BONUS[id] + '（实得 ' + (t && t.effect && t.effect.breakthrough_bonus) + '）');
});
// 护心丹仍是废弃态（本批没顺手复活它）
var hx = W.itemById.pill_huxin;
ok(hx && hx.deprecated === true && hx.implemented === false, 'B5 护心丹仍是废弃态（未实装）');
// 我这三个文件里没出现任何新的成功率字面量
['js/inventory.js', 'js/app.js', 'js/house-panel.js'].forEach(function (f) {
    var s = loadScript(f);
    var s2 = s.replace(/0\.95|0\.8 - |baseRate \+=|successRate =/g, '');
    ok(!/breakthrough_bonus\s*[:=]\s*0\./.test(s2), f + ' 没往里塞任何突破加成数值');
});

// ============================================================
console.log('\n========== 突破丹可服用 · 主路认账 ==========');
console.log('通过 ' + passed + ' / 失败 ' + failed);
process.exit(failed ? 1 : 0);