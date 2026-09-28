/**
 * wave133-realm-tier-single-scale-node.js — 第一百三十三批 · DES-92 尾「档位这把尺也只认一把」
 *
 * 病根（本批实测）：js/sects/sect-join-flow.js 的 getRealmTier 自带一份十档境界表，排在「渡劫」就断，
 *   认不出的名一律回落 1（炼气）。全仓 70 处拿它判门槛/算数值，于是修到 飞升(10)/金仙(11) 的老角色
 *   反被当成炼气：进不了天书阁（门槛 9）、开不了山（4）、占不了灵脉（3）、御不起剑（2）、拜不了渡劫师。
 *   js/quest/qi-arc2.js:234 早就把这行写进注释（「getRealmTier 对飞升后境界按炼气处理，会误锁」）——本批把注释落成代码。
 * 另一笔：js/sects/sects-deep-ui.js 拜师核对「尺没就绪」那一支回的是 `true`（测不了＝开大门），与第一百二十七批
 *   mail-system 那笔 `return 999` 同族；本批一并收口。
 *
 * 覆盖（沙箱装真文件真跑；每一关都带控制组与改前复现）：
 *   A 控制组·档位与尺同源：十二境逐名 getRealmTier == realmIndex；null/空/未知名/数字四支读数钉死
 *   B 零漂移对账：前十档逐名与改前基线一字不差 ⇒ 本批只挪了 飞升/金仙 两档（把假值改回真值）
 *   C 改前复现：把借尺那一行回打旧抄表 ⇒ 飞升/金仙 立刻复现回落 1（回打确有落在源码上）
 *   D 尺未就绪那一支：不装尺 ⇒ 十二境一律 0（判不了即不够格，不放行）＋ warn 恰一次 ＋ 生产装载顺序钉
 *   E 拜师门：控制组／双处回打复现「通关者拜不了渡劫师」／门牌写错放行／不装尺拦下并念出原因／旧体 `: true` 敞口复现／层数账仍在
 *   F 七扇门槛：天书阁·大隐阁入门、灵脉、本命法宝、御剑、渡界（灵界/魔界）、卦阵、试炼第五层——飞升/金仙 现在过，低境照旧拦
 *   G 形状棘轮＋哨兵：全仓自抄境界序存量 25→24（本批缩一枚）；虚标「真仙」、错字「练气」、等值判门钉住；
 *     「序→数」那一族在 凡人..渡劫 一档不挪
 *
 * 跑这套件必须知道的三个坑（都踩过）：
 *   1) js/global-utils.js:131 会把 window.showMessage 换成真实现（只往 DOM 节点里写）——装完文件要钉回探针版，否则「屏上念了哪句」测不到。
 *   2) getRealmTier 由 js/sects/sect-join-flow.js 导出：单装门槛本（divination 等）时它是 undefined，走的是 `: 0` 那一支，
 *      不是生产形态；F 段每扇都必须连带装 sect-join-flow.js。
 *   3) src() 先把 CRLF 归一成 \n，多行回打字面串才对得上（js/event-system.js 整本 CRLF，本批两本也各有一处行尾差异）。
 *
 * 运行：node tests/wave133-realm-tier-single-scale-node.js
 */
'use strict';

var fs = require('fs');
var vm = require('vm');
var path = require('path');
var ROOT = path.resolve(__dirname, '..');

var 通 = 0, 红 = [];
function ok(cond, label) {
    通 += cond ? 1 : 0;
    if (!cond) 红.push(label);
    console.log((cond ? '  ✓ ' : '  ✗ ') + label);
}
function eq(a, b, label) { ok(a === b, label + '（实际=' + JSON.stringify(a) + ' 期望=' + JSON.stringify(b) + '）'); }
function src(rel) {
    return fs.readFileSync(path.join(ROOT, rel), 'utf8').replace(/\r\n/g, '\n');
}
function has(s, sub, label) { ok(String(s).indexOf(sub) >= 0, label); }

// ==================== 沙箱 ====================
function 造沙箱(装, 覆盖) {
    装 = 装 || []; 覆盖 = 覆盖 || {};
    var S = {
        console: { log: function () { }, warn: function () { S.warns.push.apply(S.warns, arguments); }, error: function () { } },
        Math: Math, JSON: JSON, Object: Object, Array: Array, Date: Date, String: String,
        Number: Number, Boolean: Boolean, isFinite: isFinite, parseInt: parseInt,
        parseFloat: parseFloat, RegExp: RegExp, setTimeout: function (fn) { try { fn(); } catch (e) { } return 0; },
        clearTimeout: function () { }, setInterval: function () { return 0; }, clearInterval: function () { },
        requestAnimationFrame: function () { }
    };
    S.window = S;
    S.msgs = []; S.warns = []; S.items = []; S.timeCalls = [];
    function fakeEl() {
        var el = { children: [], style: {}, className: '', id: '', classList: { toggle: function () { }, add: function () { }, remove: function () { }, contains: function () { return false; } }, appendChild: function (c) { this.children.push(c); return c; }, remove: function () { }, addEventListener: function () { }, setAttribute: function () { }, getAttribute: function () { return null; }, querySelector: function () { return null; }, querySelectorAll: function () { return []; }, closest: function () { return null; }, _html: '', textContent: '' };
        Object.defineProperty(el, 'innerHTML', { get: function () { return this._html; }, set: function (v) { this._html = String(v); }, configurable: true });
        return el;
    }
    var els = {};
    S.document = {
        readyState: 'complete',
        createElement: function () { return fakeEl(); },
        createElementNS: function () { return fakeEl(); },
        getElementById: function (id) { if (!els[id]) els[id] = fakeEl(); return els[id]; },
        querySelector: function () { return null; }, querySelectorAll: function () { return []; },
        addEventListener: function () { }, removeEventListener: function () { },
        body: { appendChild: function () { }, insertAdjacentHTML: function () { }, contains: function () { return true; } }
    };
    var store = {};
    S.localStorage = {
        getItem: function (k) { return store[k] !== undefined ? store[k] : null; },
        setItem: function (k, v) { store[k] = String(v); },
        removeItem: function (k) { delete store[k]; }
    };
    S.alert = function () { }; S.confirm = function () { return true; }; S.prompt = function () { return null; };
    S.showMessage = function (m) { S.msgs.push(String(m)); };
    S.gameLog = { entries: [], add: function (t) { S.gameLog.entries.push(String(t)); } };
    S.EventBus = { emit: function () { }, on: function () { } };
    S.GameEvents = { emit: function () { }, on: function () { } };
    S.updateCharacterStatus = function () { };
    S.timeSystem = {
        gameTime: { currentDay: 10, currentHour: 8, currentMinute: 0, totalMinutes: 1000 },
        advanceTime: function (m, r) { S.timeCalls.push({ m: m, r: String(r || '') }); },
        getAbsoluteDay: function () { return 100; }
    };
    S.inventory = { slots: [], currency: { spiritStones: 5000, copper: 0 } };
    S.currentCharData = {
        name: '尺下探针', realm: '筑基', layer: 3, location: '洛水城',
        energy: 999, health: 100, maxHealth: 100, qi: 500, spiritStones: 5000, mood: 50, karma: 0,
        attrs: {}, lifeSkills: {}, bonds: {}, flags: {}
    };
    S.addItem = function (id, n) { S.items.push([id, n]); return n || 1; };
    S.addItemToInventory = S.addItem;
    S.getEffectiveMax = function () { return 100; };
    S.playerHouse = null;
    S.sectsData = {
        '大隐阁': { name: '大隐阁', type: '正道' },
        '天书阁': { name: '天书阁', type: '正道' }
    };
    S.discipleState = { isInSect: true, contribution: 9999 };
    S.startBattle = function () { S.battles = (S.battles || 0) + 1; return true; };
    var ctx = vm.createContext(S);
    function load(rel, 改写) {
        var code = 改写 ? 改写(src(rel)) : src(rel);
        vm.runInContext(code, ctx, { filename: rel });
    }
    if (!覆盖.不装尺) load('js/global-utils.js');
    装.forEach(function (项) {
        var rel = typeof 项 === 'string' ? 项 : 项.f;
        load(rel, (typeof 项 === 'object' && 项.改) ? 项.改 : 覆盖[rel]);
    });
    S.showMessage = function (m) { S.msgs.push(String(m)); };
    return { S: S, ctx: ctx, load: load };
}
function 定境界(S, 名, 层) { S.currentCharData.realm = 名; S.currentCharData.layer = 层 || 1; }
function 念了(S, 串) { return S.msgs.some(function (m) { return m.indexOf(串) >= 0; }); }
function 清了(S) { S.msgs = []; }

var 十二境 = ['凡人', '炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫', '飞升', '金仙'];
// ⚠️ 这十档是**改前基线**（sect-join-flow.js 旧抄表的读数，来自 .scratch/probe-realm-tier-133.cjs 实测），不是第二把尺；
//    B 段拿它比对正是为了证明本批没挪动表内任何一档。
var 改前十档基线 = { '凡人': 0, '炼气': 1, '筑基': 2, '金丹': 3, '元婴': 4, '化神': 5, '炼虚': 6, '合体': 7, '大乘': 8, '渡劫': 9 };

var 尺行新 = '    var i = window.realmIndex(realm);';
var 尺行旧 = "    var i = ['凡人', '炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'].indexOf(String(realm));";
var 拜师新 = '        var meetRealm = 有尺 && window.realmAtLeast(player.realm, req.realm) && (player.layer || 1) >= (req.layer || 1);';
var 拜师旧 = "        var meetRealm = (typeof window.getRealmTier === 'function')\n            ? window.getRealmTier(player.realm) >= window.getRealmTier(req.realm) && (player.layer || 1) >= (req.layer || 1)\n            : true;";
var 回打尺 = function (s) { return s.indexOf(尺行新) < 0 ? s : s.replace(尺行新, 尺行旧); };
var 回打拜师 = function (s) { return s.indexOf(拜师新) < 0 ? s : s.replace(拜师新, 拜师旧); };

// ==================== A 控制组·档位与那把尺同源 ====================
console.log('\n[A] 控制组：getRealmTier 十二境逐名等于 realmIndex');
(function () {
    var w = 造沙箱(['js/sects/sect-join-flow.js']);
    var S = w.S;
    ok(typeof S.realmIndex === 'function' && typeof S.getRealmTier === 'function', 'A0 尺与档位都在（真文件装进来）');
    eq(S.REALM_ORDER.length, 12, 'A0b 尺是十二境（凡人..金仙）');
    十二境.forEach(function (名, n) {
        eq(S.getRealmTier(名), n, 'A1·' + 名 + ' 档位＝尺序 ' + n);
        eq(S.getRealmTier(名), S.realmIndex(名), 'A2·' + 名 + ' 与 window.realmIndex 同读数');
    });
    eq(S.getRealmTier(null), 0, 'A3 null→0（凡人）');
    eq(S.getRealmTier(''), 0, 'A4 空串→0（凡人）');
    eq(S.getRealmTier('真仙'), 1, 'A5 表外名仍按旧保守值 1（别顺手挪 NPC 挂的虚标档）');
    eq(S.getRealmTier('乱写的境'), 1, 'A5b 乱名同样保守 1');
    eq(S.getRealmTier(' 金丹 '), 3, 'A5c 尺会 trim，带空格的境名照样认（realmIndex 本体口径）');
    [1, 3, 5, 9].forEach(function (n) { eq(S.getRealmTier(n), n, 'A6 数字入参 ' + n + ' 照旧原样（不钳不折）'); });
    eq(S.getRealmTier(0), 0, 'A6b 数字 0→0');
    eq(S.getRealmTier(-3), 0, 'A6c 负数→0（下界）');
    eq(S.getRealmTier(12), 11, 'A6d 数字封顶改吃尺顶（旧写法钳到 9，本批钳到 11）');
    eq(S.getRealmTier('飞升'), 10, 'A7 飞升＝10（旧写法折回 1，本批的病根）');
    eq(S.getRealmTier('金仙'), 11, 'A7b 金仙＝11');
})();

// ==================== B 零漂移对账 ====================
console.log('\n[B] 零漂移：表内十档一档不挪，只有被折回的两档改回真值');
(function () {
    var w = 造沙箱(['js/sects/sect-join-flow.js']);
    var S = w.S;
    Object.keys(改前十档基线).forEach(function (名) {
        eq(S.getRealmTier(名), 改前十档基线[名], 'B1·' + 名 + ' 与改前逐名同读数');
    });
    ok(['凡人', '炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'].every(function (名, n) {
        return S.getRealmTier(名) === n;
    }), 'B2 单调性照旧（档位序与境名序同向）');
    var 挪动 = 十二境.filter(function (名) {
        return 名 in 改前十档基线 ? S.getRealmTier(名) !== 改前十档基线[名] : true;
    });
    eq(挪动.join(','), '飞升,金仙', 'B3 全表比对：本批唯一被挪的是顶端两档（假值→真值）');
})();

// ==================== C 改前复现 ====================
console.log('\n[C] 改前复现：把借尺那一行回打旧抄表，顶端两档立刻折回炼气');
(function () {
    has(src('js/sects/sect-join-flow.js'), 尺行新, 'C0 回打目标确实在源码里（回打不是空转）');
    ok(src('js/sects/sect-join-flow.js').indexOf(尺行旧) < 0, 'C0b 旧抄表字面已不在 js/sects/sect-join-flow.js');
    var 新w = 造沙箱(['js/sects/sect-join-flow.js']);
    var 旧w = 造沙箱([{ f: 'js/sects/sect-join-flow.js', 改: 回打尺 }]);
    eq(新w.S.getRealmTier('飞升'), 10, 'C1 新码：飞升＝10');
    eq(旧w.S.getRealmTier('飞升'), 1, 'C2 回打即复现：飞升被折回 1（炼气）');
    eq(旧w.S.getRealmTier('金仙'), 1, 'C2b 回打即复现：金仙同样折回 1');
    eq(新w.S.getRealmTier('渡劫'), 旧w.S.getRealmTier('渡劫'), 'C3 控制组：回打前后 渡劫 读数一字未变（旧表数得到它）');
    eq(新w.S.getRealmTier('炼虚'), 旧w.S.getRealmTier('炼虚'), 'C3b 控制组：炼虚同样一字未变');
})();

// ==================== D 尺未就绪那一支 ====================
console.log('\n[D] 尺没就绪：判不了即不够格（回 0），不许开大门');
(function () {
    var w = 造沙箱(['js/sects/sect-join-flow.js'], { 不装尺: true });
    var S = w.S;
    ok(typeof S.realmIndex === 'undefined', 'D0 控制组：这局确实没装尺');
    var 读数 = 十二境.map(function (名) { return S.getRealmTier(名); });
    ok(读数.every(function (v) { return v === 0; }), 'D1 十二境一律 0＝凡人（全序下界，任何门槛都拦下）·' + 读数.join(','));
    eq(S.warns.length, 1, 'D2 只在第一声缺尺时 warn 一次（不刷屏）');
    has(S.warns[0], 'js/global-utils.js 未加载', 'D2b warn 念得出病根');
    var 页 = src('仙侠.html');
    var 尺线 = 页.indexOf('js/global-utils.js'), 档线 = 页.indexOf('js/sects/sect-join-flow.js');
    ok(尺线 >= 0 && 档线 >= 0 && 尺线 < 档线, 'D3 生产装载顺序：global-utils 先于 sect-join-flow ⇒ D1 那一支生产走不到');
    // 拦下的效果：元婴门（开山）与金丹门（灵脉）都读不到数 ⇒ 一律拒
    var w2 = 造沙箱(['js/sects/sect-join-flow.js', 'js/economy/spirit-vein.js', 'js/cultivation/divination.js'], { 不装尺: true });
    定境界(w2.S, '金仙', 9); 清了(w2.S);
    eq(w2.S.claimSpiritVein(), false, 'D4 不装尺 ⇒ 灵脉照旧拦（不是放行）');
    has(w2.S.msgs.join('|'), '需金丹以上方可占据灵脉。', 'D4c 拦下时念的是原门牌，不编新话');
    清了(w2.S);
    eq(w2.S.openDivination(), false, 'D4b 不装尺 ⇒ 卦阵照旧拦');
    has(w2.S.msgs.join('|'), '元婴方可感应天机。', 'D4d 卦阵那一扇也念原门牌');
})();

// ==================== E 拜师门 ====================
console.log('\n[E] 拜师门：fail-open 收口（旧写法尺没就绪回 true＝开大门）');
(function () {
    var 派 = 'js/sects/sects-deep-ui.js', 档 = 'js/sects/sect-join-flow.js';
    has(src(派), 拜师新, 'E0 回打目标确实在源码里');
    ok(src(派).indexOf(拜师旧) < 0, 'E0b 旧写法 `: true` 已不在 js/sects/sects-deep-ui.js');

    var w = 造沙箱([档, 派]);
    var 门 = { realm: '筑基', layer: 5 };
    定境界(w.S, '炼气', 9);
    var 不够 = w.S.checkMasterRequirement(w.S.currentCharData, 门, 0);
    eq(不够.ok, false, 'E1 控制组：炼气九层拜不了「筑基五层」的门（层数也不够）');
    eq(不够.missing.join(','), '筑基5层', 'E1b 缺项念得出门牌');
    定境界(w.S, '筑基', 5);
    eq(w.S.checkMasterRequirement(w.S.currentCharData, 门, 0).ok, true, 'E1c 控制组：筑基五层恰过门');

    定境界(w.S, '飞升', 1);
    var 高 = w.S.checkMasterRequirement(w.S.currentCharData, { realm: '渡劫', layer: 1 }, 0);
    eq(高.ok, true, 'E2 飞升拜「渡劫一层」的师——过（本批修的就是这一扇）');
    var 旧 = 造沙箱([{ f: 档, 改: 回打尺 }, { f: 派, 改: 回打拜师 }]);
    定境界(旧.S, '飞升', 1);
    var 旧判 = 旧.S.checkMasterRequirement(旧.S.currentCharData, { realm: '渡劫', layer: 1 }, 0);
    eq(旧判.ok, false, 'E2b 两处一起回打即复现：通关老角色反被当成炼气、拜不进渡劫师的门');
    eq(旧判.missing.join(','), '渡劫1层', 'E2c 复现时拒的是境界缺项（不是层数）');

    定境界(w.S, '筑基', 9);
    eq(w.S.checkMasterRequirement(w.S.currentCharData, { realm: '金霞', layer: 1 }, 0).ok, true,
        'E3 门牌本身认不出（「金霞」那境查无此账）⇒ 放行，别拿一张写错的门牌锁人');

    var 无尺 = 造沙箱([派], { 不装尺: true });
    定境界(无尺.S, '金仙', 9);
    var 无尺判 = 无尺.S.checkMasterRequirement(无尺.S.currentCharData, 门, 0);
    eq(无尺判.ok, false, 'E4 尺没就绪 ⇒ 不够格（新写法）');
    has(无尺判.missing.join(','), '境界尺未加载，暂按不够格办', 'E4b 拦下时把「为什么拦」念到屏上');
    var 敞口旧 = 造沙箱([{ f: 派, 改: 回打拜师 }], { 不装尺: true });
    定境界(敞口旧.S, '凡人', 1);
    eq(敞口旧.S.checkMasterRequirement(敞口旧.S.currentCharData, 门, 0).ok, true,
        'E5 旧写法回打即复现敞口：尺没就绪时凡人也「可拜」——测不了换成了开大门');

    定境界(w.S, '筑基', 4);
    var 层 = w.S.checkMasterRequirement(w.S.currentCharData, 门, 0);
    eq(层.ok, false, 'E6 境界够但层数不够 ⇒ 仍拦（层数账没被尺吞掉）');
    eq(层.missing.join(','), '筑基5层', 'E6b 缺项仍念原门牌');
})();

// ==================== F 七扇门槛 ====================
console.log('\n[F] 门槛抽查：飞升/金仙 不再被当成炼气（真文件真跑）');
(function () {
    var 档 = 'js/sects/sect-join-flow.js';
    function 局(境, 层, 装, 跑, 改档) {
        var 项 = [改档 ? { f: 档, 改: 回打尺 } : 档].concat(装 || []);
        var w = 造沙箱(项);
        定境界(w.S, 境, 层); 清了(w.S);
        return 跑(w.S);
    }

    // F1 入门评估：大隐阁（门槛写 4）与天书阁（门槛写 9）
    ok(局('金丹', 1, [], function (S) { return S.evaluateSectEntry('大隐阁', S.currentCharData).result === '拒绝'; }),
        'F1a 控制组：金丹入门大隐阁仍被拒（门槛数字 4＝元婴，门牌写「金丹以上」——差一档那笔等裁，本批不动）');
    ok(局('元婴', 1, [], function (S) { return S.evaluateSectEntry('大隐阁', S.currentCharData).result !== '拒绝'; }),
        'F1b 控制组：元婴过大隐阁境界门（入门身份由通用流程定，此处只认境界这一关）');
    eq(局('飞升', 1, [], function (S) { var r = S.evaluateSectEntry('天书阁', { realm: '飞升', karma: 150 }); return r.reason; }),
        '道友功德圆满，请入阁一观', 'F1c 飞升进得了天书阁（旧写法被当炼气，拒于「只收渡劫以上」）');
    eq(局('大乘', 1, [], function (S) { return S.evaluateSectEntry('天书阁', { realm: '大乘', karma: 150 }).reason; }),
        '天书阁只收渡劫以上修士', 'F1d 控制组：大乘仍拒（渡劫之下）');
    eq(局('飞升', 1, [], function (S) { return S.evaluateSectEntry('大隐阁', { realm: '飞升', karma: 0 }).result === '拒绝'; }, 回打尺),
        true, 'F1e 回打尺行即复现：飞升被当炼气 ⇒ 大隐阁拒客（同一条门的改前基线）');

    // F2 灵脉（金丹门）
    eq(局('筑基', 1, ['js/economy/spirit-vein.js'], function (S) { delete S.currentCharData._spiritVein; return S.claimSpiritVein(); }),
        false, 'F2a 控制组：筑基占不了灵脉');
    has(局('筑基', 1, ['js/economy/spirit-vein.js'], function (S) { delete S.currentCharData._spiritVein; S.claimSpiritVein(); return S.msgs.join('|'); }),
        '需金丹以上方可占据灵脉。', 'F2b 拦下语照旧');
    eq(局('金仙', 1, ['js/economy/spirit-vein.js'], function (S) { delete S.currentCharData._spiritVein; return S.claimSpiritVein(); }),
        true, 'F2c 金仙占得动灵脉（旧写法折回炼气 ⇒ 占不了）');

    // F3 本命法宝（金丹门）
    has(局('炼气', 1, ['js/equipment/bonded-artifact.js'], function (S) { S.currentCharData._bondedArtifact = null; S.forgeBondedArtifact('青莲'); return S.msgs.join('|'); }),
        '需金丹以上方可凝聚本命法宝。', 'F3a 控制组：炼气凝不了本命法宝');
    ok(局('飞升', 1, ['js/equipment/bonded-artifact.js'], function (S) {
        S.currentCharData._bondedArtifact = null; S.forgeBondedArtifact('青莲');
        return S.msgs.join('|').indexOf('需金丹以上') < 0;
    }), 'F3b 飞升不再被那句「需金丹以上」挡在门外');
    has(局('飞升', 1, ['js/equipment/bonded-artifact.js'], function (S) {
        S.currentCharData._bondedArtifact = null; S.forgeBondedArtifact('青莲'); return S.msgs.join('|');
    }, 回打尺), '需金丹以上方可凝聚本命法宝。', 'F3c 回打即复现：飞升被当炼气、凝不了法宝');

    // F4 御剑（筑基门）与渡界（灵界元婴门 / 魔界化神门）
    has(局('炼气', 9, ['js/map/high-planes.js'], function (S) { S.flyTravel('金城'); return S.msgs.join('|'); }),
        '筑基方可御剑飞行。', 'F4a 控制组：炼气御不起剑');
    eq(局('飞升', 1, ['js/map/high-planes.js'], function (S) { return S.flyTravel('金城'); }), true,
        'F4b 飞升御剑照走（旧写法折回炼气 ⇒ 一步一拐走地面）');
    has(局('金丹', 1, ['js/map/high-planes.js'], function (S) { S.enterPlane('灵界'); return S.msgs.join('|'); }),
        '感应不到那道界膜', 'F4c 控制组：金丹渡不了灵界');
    ok(局('元婴', 1, ['js/map/high-planes.js'], function (S) { S.enterPlane('灵界'); return S.msgs.join('|').indexOf('感应不到那道界膜') < 0; }),
        'F4d 元婴渡得进灵界');
    has(局('元婴', 9, ['js/map/high-planes.js'], function (S) { S.currentCharData.location = '洛水城'; S.enterPlane('魔界'); return S.msgs.join('|'); }),
        '浊气太重', 'F4e 控制组：元婴渡魔界被劝退（门槛数字 5；十档尺下 5 正是化神 ⇒ 门牌与数字这一档相合，本批不挪）');
    ok(局('化神', 1, ['js/map/high-planes.js'], function (S) { S.currentCharData.location = '洛水城'; S.enterPlane('魔界'); return S.msgs.join('|').indexOf('浊气太重') < 0; }),
        'F4e2 化神恰过魔界门（十档与十二档在这一档读数相同）');
    ok(局('金仙', 1, ['js/map/high-planes.js'], function (S) { S.enterPlane('魔界'); return S.msgs.join('|').indexOf('浊气太重') < 0; }),
        'F4f 金仙进得了魔界（旧写法折回炼气 ⇒ 进不去）');

    // F5 卦阵（元婴门）
    has(局('筑基', 9, ['js/cultivation/divination.js'], function (S) { S.openDivination(); return S.msgs.join('|'); }),
        '元婴方可感应天机。', 'F5a 控制组：筑基起不了卦');
    ok(局('飞升', 1, ['js/cultivation/divination.js'], function (S) { S.openDivination(); return S.msgs.join('|').indexOf('元婴方可感应天机') < 0; }),
        'F5b 飞升起得了卦');

    // F6 山门试炼第五层（元婴门）
    has(局('金丹', 1, ['js/sects/sect-trials.js'], function (S) { S.startTrialFloor('tr_1', 5); return S.msgs.join('|'); }),
        '之下站不住', 'F6a 控制组：金丹站不住第五层');
    ok(局('飞升', 1, ['js/sects/sect-trials.js'], function (S) { S.startTrialFloor('tr_2', 5); return S.msgs.join('|').indexOf('站不住') < 0; }),
        'F6b 飞升进得第五层');
    has(局('飞升', 1, ['js/sects/sect-trials.js'], function (S) { S.startTrialFloor('tr_3', 5); return S.msgs.join('|'); }, 回打尺),
        '之下站不住', 'F6c 回打即复现：飞升被当炼气，第五层站不住');
})();

// ==================== G 形状棘轮 + 哨兵 ====================
console.log('\n[G] 形状棘轮：抄表只准缩；序→数那一族一档不挪');
(function () {
    function 扫目录(dir, filter) {
        var out = [];
        fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).forEach(function (e) {
            var p = path.join(dir, e.name);
            if (e.isDirectory()) { if (e.name !== 'node_modules') out.push.apply(out, 扫目录(p, filter)); return; }
            if (!/\.js$/.test(e.name)) return;
            src(p).split(/\r?\n/).forEach(function (行, n) {
                var 头 = 行.trim();
                if (/^\/\/|^\*|^\/\*/.test(头)) return;   // 注释里引用旧表是记账，不是活的抄写
                if (filter(行)) out.push(p.replace(/\\/g, '/') + ':' + (n + 1));
            });
        });
        return out;
    }
    var 抄表 = 扫目录('js', function (行) { return /\[\s*['"](?:凡人|炼气)['"]/.test(行); });
    // 基线＝第一百三十二批实测 25；本批删掉 js/sects/sect-join-flow.js 那份十档 ⇒ 24。
    //   其余全属「序→数」那一族（伤害倍率／概率／敌级／收入／数组下标）＝数值账，按用户禁令只钉不动。
    var 基线抄表 = 24;
    ok(抄表.length <= 基线抄表, 'G1 全仓自抄境界序数组存量 ' + 抄表.length + ' 处 ≤ 基线 ' + 基线抄表 + ' 处（只准缩；明细：\n      ' + 抄表.join('\n      ') + '）');
    ok(抄表.every(function (处) { return 处.indexOf('sect-join-flow') < 0; }), 'G1b js/sects/sect-join-flow.js 那份抄表已销账');
    var 虚标 = 扫目录('js', function (行) { return 行.indexOf('真仙') >= 0; });
    ok(虚标.length <= 5, 'G2 虚标档位「真仙」存量 ' + 虚标.length + ' 处 ≤ 基线 5（明细：\n      ' + 虚标.join('\n      ') + '）');
    var 错字 = 扫目录('js', function (行) { return 行.indexOf('练气') >= 0; });
    ok(错字.length <= 8, 'G3 错字境界名「练气」存量 ' + 错字.length + ' 处 ≤ 基线 8（明细：\n      ' + 错字.join('\n      ') + '）');
    var 等值门 = 扫目录('js', function (行) {
        return /\.realm\s*===\s*['"](?:筑基|金丹|元婴|化神|炼虚|合体|大乘|渡劫)['"]/.test(行);
    });
    ok(等值门.length <= 0, 'G4 拿等值判境界门（把更高那一境拒掉那一族）存量 ' + 等值门.length + ' ≤ 基线 0（明细：\n      ' + 等值门.join('\n      ') + '）');
    var 放行门 = 扫目录('js', function (行) {
        return /getRealmTier\([^)]*\)\s*>=\s*getRealmTier\(|:\s*true;?\s*$/.test(行) && 行.indexOf('meetRealm') >= 0;
    });
    ok(放行门.length <= 0, 'G5 拜师那类「判不了即放行」存量 ' + 放行门.length + ' ≤ 基线 0（明细：\n      ' + 放行门.join('\n      ') + '）');

    // 序→数抽查：同一档位在数值支路上读数照旧（概率/倍率吃的是 getRealmTier 的数）
    var w = 造沙箱(['js/sects/sect-join-flow.js', 'js/quest/bounty-board.js']);
    ['凡人', '炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'].forEach(function (名) {
        eq(w.S.getRealmTier(名), 改前十档基线[名], 'G6·' + 名 + ' 数值支路取数不变（ bounty 倍率表那族按同一档位）');
    });
    ok(w.S.getRealmTier('飞升') === 10 && w.S.getRealmTier('金仙') === 11, 'G6b 数值支路只在顶端两档取到真值（登记为「假值→真值」，非平衡调整）');

    // 哨兵：本批只改两本 js，且不留第二把尺
    ['js/sects/sect-join-flow.js', 'js/sects/sects-deep-ui.js'].forEach(function (f) {
        has(src(f), '第一百三十三批', 'G7 ' + f + ' 的行级批次标记在册');
    });
    ok(src('js/sects/sects-deep-ui.js').indexOf('window.realmAtLeast') >= 0, 'G8 拜师核对改借那把尺（window.realmAtLeast）');
    var 存档字段 = src('js/sects/sect-join-flow.js').match(/cd\._[A-Za-z]+|currentCharData\._[A-Za-z]+/g) || [];
    ok(存档字段.length <= (function () {
        // 与改前同一本文件比：回打旧体后匹配数应相同 ⇒ 本批没往角色档里塞新字段
        var 旧 = 回打尺(src('js/sects/sect-join-flow.js'));
        return (旧.match(/cd\._[A-Za-z]+|currentCharData\._[A-Za-z]+/g) || []).length;
    })(), 'G9 零新存档字段（本批只换读法，不动档）');
})();

console.log('\n' + (红.length ? '✗ 失败 ' + 红.length + ' 项：\n  - ' + 红.join('\n  - ') : '✓ 全通过') +
    '\n合计 ' + 通 + ' 通过 / ' + 红.length + ' 失败');
process.exit(红.length ? 1 : 0);
