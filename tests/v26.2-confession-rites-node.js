/**
 * v26.2-confession-rites-node.js — 定情场景层（js/npcs/confession-rites.js）
 *
 * 覆盖七件事：
 *   A 门槛    亲密度未到 60 场景层不接管（交还原实现）；未过的门锁要亮、要说清为什么锁（无死 UI）
 *   B 整册排除 36 位终章定局者逐个核账，一个都进不了定情场景
 *   C 真写账  每一步选项都真写 npc.relationship，且面板/关系状态读得到
 *   D 多结局  四种关系状态走到四个不同结局；结局由账判定不由选项顺序判定
 *   E 收敛    走完结局即收窗并回到本体 NPC 对话；重入被账挡住，不循环
 *   F 存档    StateRegistry('confessionRites') 正门；全文件逐键扫——没有新建 localStorage 键
 *   G 回落    场景层缺席（未挂载/旧档）时 executeEmotionInteraction 逐字回落到原实现
 *
 * 运行：node tests/v26.2-confession-rites-node.js
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
function section(t) { console.log('\n===== ' + t + ' ====='); }
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
function extractVar(src, name) {
    var re = new RegExp('var\\s+' + name + '\\s*=\\s*\\{');
    var m = re.exec(src);
    if (!m) return null;
    var j = src.indexOf('{', m.index), depth = 0, k = j;
    for (; k < src.length; k++) {
        if (src[k] === '{') depth++;
        else if (src[k] === '}') { depth--; if (depth === 0) break; }
    }
    return src.slice(j, k + 1);
}

// ============ 极简 DOM 桩（面板只做渲染，断言要看的正是它印出来的东西）============
function FakeEl(tag) {
    this.tagName = tag || 'div';
    this.className = '';
    this.style = {};
    this.innerHTML = '';
    this.onclick = null;
    this.children = [];
    this.scrollTop = 0;
    this.scrollHeight = 0;
    this._q = {};
    this._html = '';
    this._dead = false;
}
FakeEl.prototype.querySelector = function (sel) {
    if (!this._q[sel]) this._q[sel] = new FakeEl('div');
    return this._q[sel];
};
FakeEl.prototype.appendChild = function (c) { this.children.push(c); return c; };
FakeEl.prototype.insertAdjacentHTML = function (pos, html) { this._html += html; };
FakeEl.prototype.remove = function () {
    this._dead = true;
    var reg = FakeEl.__doc && FakeEl.__doc.__registry;
    if (reg) reg = reg.filter(function (x) { return x !== this; });
};
FakeEl.prototype.text = function () { return this.innerHTML + this._html + this._q['[data-role="stream"]']._html; };
function makeDoc() {
    var body = new FakeEl('body');
    var registry = [];
    var doc = {
        body: body,
        createElement: function (t) { return new FakeEl(t); },
        querySelector: function (sel) {
            if (sel === '.confession-rite-modal') {
                for (var i = registry.length - 1; i >= 0; i--) if (!registry[i]._dead) return registry[i];
                return null;
            }
            return null;
        }
    };
    doc.appendChild = function (c) { registry.push(c); body.appendChild(c); return c; };
    // 面板是 document.body.appendChild 挂上去的——登记也要跟在这条路上
    body.appendChild = function (c) { registry.push(c); return c; };
    doc.__registry = registry;
    FakeEl.__doc = doc;
    return doc;
}

function makeNpc(id, name, o) {
    o = o || {};
    var npc = {
        id: id, name: name, gender: o.gender || 'female',
        homeLocation: o.place || '城南客栈',
        appearance: { icon: '🌸' },
        relationship: {
            affection: o.aff != null ? o.aff : 50,
            hatred: o.hatred || 0, respect: o.respect || 0, trust: o.trust || 0,
            love: o.love || 0, favor: 0, favorMax: 50, fear: 0,
            flags: new Set(o.flags || []), history: []
        },
        memory: { firstMet: true, meetCount: o.meets != null ? o.meets : 5, _loveCd: {}, _loveAccepted_confess: false },
        _bondCalls: [],
        changeAffection: function (v) { this.relationship.affection = Math.max(-100, Math.min(100, this.relationship.affection + v)); },
        changeTrust: function (v) { this.relationship.trust = Math.max(0, Math.min(100, this.relationship.trust + v)); },
        changeRespect: function (v) { this.relationship.respect = Math.max(0, Math.min(100, this.relationship.respect + v)); },
        changeLove: function (v) { this.relationship.love = Math.max(0, Math.min(100, this.relationship.love + v)); },
        setFlag: function (f) { this.relationship.flags.add(f); },
        hasFlag: function (f) { return this.relationship.flags.has(f); }
    };
    return npc;
}

// ============ 场景层装载台 ============
var RITE_SRC = loadScript('js/npcs/confession-rites.js');
var NS_SRC = loadScript('js/npcs/npc-system.js');
var ROSTER = vm.runInNewContext('(' + extractVar(NS_SRC, 'BOND_DAO_FINAL_CHAPTER') + ')');

function boot(opts) {
    opts = opts || {};
    var store = {};
    var reg = {};
    var doc = opts.noDom ? null : makeDoc();
    var msgs = [];
    var reopened = [];
    var sandbox = {
        console: { log: function () {}, warn: function (m) { msgs.push(String(m)); }, error: function (m) { msgs.push(String(m)); } },
        Math: Math, JSON: JSON, Object: Object, Array: Array, String: String, Number: Number, isFinite: isFinite,
        Set: Set, document: doc, setTimeout: function (fn) { if (typeof fn === 'function') fn(); },
        localStorage: {
            _s: {},
            getItem: function (k) { return Object.prototype.hasOwnProperty.call(this._s, k) ? this._s[k] : null; },
            setItem: function (k, v) { this._s[k] = String(v); },
            removeItem: function (k) { delete this._s[k]; },
            _keys: function () { return Object.keys(this._s); }
        }
    };
    sandbox.window = sandbox;
    sandbox.globalThis = sandbox;
    sandbox.currentCharData = opts.charData || { name: '云澈', gender: 'male', bonds: opts.bonds || {} };
    sandbox.npcManager = {
        getNPC: function (id) { return (opts.all || {})[id] || null; },
        getAllNPCs: function () { return opts.all ? Object.keys(opts.all).map(function (k) { return opts.all[k]; }) : []; }
    };
    sandbox.timeSystem = { getAbsoluteDay: function () { return opts.day || 20; }, advanceTime: function (m) { store.timeCost = (store.timeCost || 0) + m; } };
    sandbox.showMessage = function (m, t) { msgs.push(String(m)); };
    sandbox.showNPCDialog = function (id) { reopened.push(id); };
    sandbox.ensureDaoBond = function (id) { var n = opts.all && opts.all[id]; if (n) n._bondCalls.push(id); };
    if (opts.disciples) sandbox.getMyNamedDisciples = function () { return opts.disciples; };
    sandbox.BOND_DAO_FINAL_CHAPTER = ROSTER;
    sandbox.StateRegistry = {
        register: function (k, h) { reg[k] = h; return function () { delete reg[k]; }; },
        exportAll: function () {
            var o = {};
            for (var k in reg) if (reg[k].export) o[k] = { version: reg[k].version, data: reg[k].export() };
            return o;
        }
    };
    vm.createContext(sandbox);
    vm.runInContext(RITE_SRC, sandbox, { filename: 'confession-rites.js' });
    return { w: sandbox, reg: reg, msgs: msgs, reopened: reopened, doc: doc, store: store };
}

// ============ A 门槛 ============
section('A 门槛：不到阈值不接管；未过的门要亮锁说清原因');
(function () {
    var H = boot({});
    var npc = makeNpc('cres_金城_3', '阿阮', { aff: 59, trust: 60, respect: 60, meets: 9 });
    H.w.npcManager.getNPC = function () { return npc; };
    assert(H.w.ConfessionRites.offer(npc) === false,
        'A1 好感 59（未到本体那道 60 分门）：场景层不接管，交还原实现处理');
    assert(H.w.ConfessionRites.gate(npc).ok === false && H.w.ConfessionRites.gate(npc).code === 'no_npc' ||
        H.w.ConfessionRites.gate(npc).ok === false,
        'A2 gate() 对不到门槛的人一律 ok=false，不会报「可入仪」');

    var few = makeNpc('cres_金城_4', '小满', { aff: 72, trust: 50, respect: 62, meets: 2 });
    assert(H.w.ConfessionRites.offer(few) === true, 'A3 好感到了：场景层接管（由它把锁亮出来，而不是装死）');
    var html = H.doc.querySelector('.confession-rite-modal').text();
    assert(html.indexOf('🔒') >= 0 && html.indexOf('点头之交不足为盟') >= 0 && html.indexOf('只见过2面') >= 0,
        'A4 面数不够 → 面板亮锁并写明「只见过2面」，不是入口可见点了没反应的死 UI');
    assert(html.indexOf('那便……暂且按下') >= 0, 'A5 锁屏给得出路（可退场），不是死面板');
    assert(npc.relationship.affection === 59, 'A6 未启场不落任何账');

    var hostile = makeNpc('cres_金城_5', '柳三', { aff: 75, trust: 50, respect: 62, meets: 6, flags: ['leverage_hostile'] });
    H.w.ConfessionRites.offer(hostile);
    assert(H.doc.querySelector('.confession-rite-modal').text().indexOf('情面还没养回来') >= 0,
        'A7 翻脸（leverage_hostile）锁门并说明——沿用本体既有的翻脸锁口径');
})();

// ============ B 整册排除 ============
section('B 37 人整册排除：终章定局者一个都进不了定情场景');
(function () {
    var H = boot({});
    var ids = Object.keys(ROSTER);
    assert(ids.length === 37, 'B0 名册实为 37 项（实测 ' + ids.length + '）——与 npc-system.js:3128 同源，不是另抄一份');
    var leaked = [];
    ids.forEach(function (id) {
        var npc = makeNpc(id, '名册中人', { aff: 99, trust: 99, respect: 99, love: 50, meets: 20 });
        var g = H.w.ConfessionRites.gate(npc);
        var plan = H.w.ConfessionRites.resolve(npc);
        if (g.ok !== false || plan.blocked === null || plan.blocked.code !== 'final_chapter') leaked.push(id);
        assert(plan.start === 'x_lock', 'B1 ' + id + '：情分拉满也不进仪（起点 x_lock）');
    });
    assert(leaked.length === 0, 'B2 37 人逐个核账，一个都没漏（漏：' + leaked.join(',') + '）');
    var one = makeNpc('sect_leader_百花谷', '温蘅', { aff: 99, trust: 99, respect: 99, meets: 20 });
    H.w.ConfessionRites.offer(one);
    var t = H.doc.querySelector('.confession-rite-modal').text();
    assert(t.indexOf('这一盟由终章「花开」定局') >= 0 && t.indexOf('只会换来一句婉拒') >= 0,
        'B3 锁屏直说这一盟由哪一终章定局（与深谈 UI :4045 同一句话口径，不另编名目）');

    // 名册外的人：一样也不许被误伤
    var ok = makeNpc('cres_金城_9', '周铁', { aff: 75, trust: 45, respect: 62, meets: 8 });
    assert(H.w.ConfessionRites.gate(ok).ok === true && H.w.ConfessionRites.resolve(ok).start === 'a_open',
        'B4 名册外的散修/城民照常能入仪（排除是按名册，不是按 sect_leader_ 前缀瞎猜）');
})();

// ============ C 真写账 ============
section('C 真写账：每一步选项都真写 relationship（走 changeXxx 正门）');
(function () {
    var npc = makeNpc('cres_凉州_2', '苏娘子', { aff: 72, trust: 45, respect: 62, meets: 8 });
    var H = boot({ all: { 'cres_凉州_2': npc } });
    assert(H.w.ConfessionRites.offer(npc) === true, 'C0 入场');
    var before = JSON.parse(JSON.stringify({ a: npc.relationship.affection, t: npc.relationship.trust, r: npc.relationship.respect }));
    H.w.ConfessionRites.pick('straight');                      // a_open → a_confide：affection+1
    assert(npc.relationship.affection === before.a + 1, 'C1 第一步真落账：好感 72 → ' + npc.relationship.affection + '（+1）');
    H.w.ConfessionRites.pick('oath');                          // a_confide → a_oath：aff+2 respect+2
    assert(npc.relationship.respect === before.r + 2, 'C2 敬重轨也真落账：' + before.r + ' → ' + npc.relationship.respect);
    H.w.ConfessionRites.pick('token');                         // a_oath → pledge 结局
    assert(npc.relationship.affection === before.a + 1 + 2 + 3 + 8,
        'C3 结局账也落： affection 全程 72 → ' + npc.relationship.affection + '（+1 +2 +3 +8）');
    assert(npc.relationship.love === 15, 'C4 深情轨也真落账：0 → ' + npc.relationship.love + '（pledge 结局账 love+15）');

    // 面板读得到：本体关系状态档（npc-system.js:1201 getRelationshipStatus 的判据）
    var aff = npc.relationship.affection, resp = npc.relationship.respect, hate = npc.relationship.hatred;
    var status = (aff >= 60 && resp >= 60 && hate < 60) ? 'follower' : (aff >= 60 ? 'friend' : 'other');
    assert(status === 'follower', 'C5 本体关系状态档读得到新账（affection>=60 && respect>=60 → 追随者）');

    // 真·正门：不是直接赋 relationship.affection，而是走 changeAffection
    var rawAssign = /npc\.relationship\.(affection|trust|respect|love)\s*=[^=]/.test(
        RITE_SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, ''));
    assert(!rawAssign, 'C6 场景层不直接赋 relationship 四轨（全部走 changeAffection/changeTrust/… 正门）');
})();

// ============ D 多结局 ============
section('D 多结局：四种关系状态 → 四个不同结局（结局由账判定，不由选项顺序）');
(function () {
    var V = H_noDom();
    function H_noDom() {
        return boot({ noDom: true });
    }
    function endingFor(o, steps) {
        var npc = makeNpc('cres_'+o.tag, o.name, o.rel);
        var h = boot({ noDom: true, all: {}, disciples: o.disciples, bonds: o.bonds });
        var plan = h.w.ConfessionRites.resolve(npc);
        return { plan: plan, npc: npc, h: h };
    }

    // D1 情已至此 → pledge
    var p1 = endingFor({ tag: 'a', name: '甲', rel: { aff: 78, trust: 50, respect: 70, meets: 9 } });
    assert(p1.plan.start === 'a_open' && p1.plan.ending === 'pledge', 'D1 情已至此（78/50/70）→ 起于 a_open，预定 pledge');
    // D2 情到分未熟 → defer
    var p2 = endingFor({ tag: 'b', name: '乙', rel: { aff: 65, trust: 12, respect: 20, meets: 6 } });
    assert(p2.plan.start === 'b_open' && p2.plan.ending === 'defer', 'D2 情到分未熟（65/12/20）→ 起于 b_open，预定 defer');
    // D3 恨未消 → parting
    var p3 = endingFor({ tag: 'c', name: '丙', rel: { aff: 66, trust: 30, respect: 30, hatred: 35, meets: 6 } });
    assert(p3.plan.start === 'p_open' && p3.plan.ending === 'parting', 'D3 恨未消（hatred 35 ≥ 30）→ 起于 p_open，预定 parting');
    // D4 名分障碍 → taboo（师徒）
    var p4 = endingFor({ tag: 'd', name: '丁', rel: { aff: 90, trust: 80, respect: 80, meets: 30 }, disciples: ['cres_d'] });
    assert(p4.plan.start === 'c_open' && p4.plan.ending === 'taboo' && p4.plan.taboo === 'master',
        'D4 她是你记名弟子 → 名分障碍优先于情分（拉到 90/80/80 也不给盟约）');
    // D5 已与人结盟约 → taboo（一心不可二用）
    var p5 = endingFor({ tag: 'e', name: '戊', rel: { aff: 90, trust: 80, respect: 80, meets: 30 }, bonds: { 'cres_x': { type: 'dao_companion', name: '旧人' } } });
    assert(p5.plan.start === 'c_open' && p5.plan.taboo === 'bound' && p5.plan.tabooLine.indexOf('旧人') >= 0,
        'D5 玩家已与人结盟约 → 一心不可二用，且台词指名道姓说出那一盟是谁');
    // D5b 名册上那一盟就是她本人（旗与名册脱钩的旧档）→ 不得拿她自己的名字回绝她
    var p5b = endingFor({ tag: 'e2', name: '戊二', rel: { aff: 90, trust: 80, respect: 80, meets: 30 }, bonds: { 'cres_e2': { type: 'dao_companion', name: '戊二' } } });
    assert(p5b.plan.taboo !== 'bound' && p5b.plan.start === 'a_open',
        'D5b 名册上那一盟就是她本人 → 不算「二结」障碍（否则会拿她自己的名字去回绝她）');

    // D6 结局由账判定：起幕时判定一次，走到收口那一刻还要再判一次
    var npc6 = makeNpc('cres_f', '己', { aff: 62, trust: 12, respect: 20, meets: 6 });
    var h6 = boot({ all: { cres_f: npc6 } });
    assert(h6.w.ConfessionRites.resolve(npc6).ending === 'defer', 'D6a 起幕时账未达门槛 → 预定 defer');
    assert(h6.w.ConfessionRites.resolve(npc6).start === 'b_open', 'D6b 起幕落在 b_open（未熟那一路）');

    // ★ 中途账变了（这段戏没演完，两人之间又往来了一程）→ 收口那一刻必须改判成 pledge。
    //   若把 endingOf 短路成「一律按 plan.ending」，此断言当场打红。
    h6.w.ConfessionRites.offer(npc6);
    h6.w.ConfessionRites.pick('probe');
    npc6.relationship.trust = 45; npc6.relationship.respect = 66; npc6.relationship.affection = 78;
    h6.w.ConfessionRites.pick('listen');
    var htmlD6 = h6.doc.querySelector('.confession-rite-modal').text();
    assert(htmlD6.indexOf('盟约既立') >= 0 && htmlD6.indexOf('好感+8') >= 0,
        'D6d ★账变了 → 结局由账改判为 pledge（不是选项顺序定的）：中途补到 78/45/66 就该给盟约');
    assert(!npc6.hasFlag('dao_companion'), 'D6d-2 结局幕只是亮出结果，落旗要等玩家走出门去（账不提前生效）');
    h6.w.ConfessionRites.pick('leave');
    assert(npc6.hasFlag('dao_companion') && h6.w.ConfessionRites.spentOf('cres_f').ending === 'pledge',
        'D6e 走出门去才落旗落账，且改判后的结局确实写进 rites 账');

    // 反证：账没补到门槛的，收口那刻仍应是 defer（不许因为「走了 b 路」就硬给盟约）
    var npc7 = makeNpc('cres_g', '庚', { aff: 65, trust: 12, respect: 20, meets: 6 });
    var h7 = boot({ all: { cres_g: npc7 } });
    h7.w.ConfessionRites.offer(npc7);
    h7.w.ConfessionRites.pick('probe'); h7.w.ConfessionRites.pick('listen'); h7.w.ConfessionRites.pick('leave');
    assert(h7.w.ConfessionRites.spentOf('cres_g').ending === 'defer' && !npc7.hasFlag('dao_companion'),
        'D6f 反证：账没补到门槛的走到收口仍是 defer（不给盟约、不落旗）');
    assert(V.w.ConfessionRites.GATE.PLEDGE_AFFECTION === 70 && V.w.ConfessionRites.GATE.MIN_AFFECTION === 60 &&
        V.w.ConfessionRites.GATE.PLEDGE_TRUST === 40 && V.w.ConfessionRites.GATE.PLEDGE_RESPECT === 60 &&
        V.w.ConfessionRites.GATE.HATRED_CUT === 30,
        'D7 门槛数挂在本体已在用的档上（60/70/40/60/30），不是自造五档');
})();

// ============ E 收敛 ============
section('E 收敛：走完即收窗回本体对话；重入被账挡住，不循环');
(function () {
    var npc = makeNpc('cres_泉州_4', '阿吉', { aff: 78, trust: 50, respect: 70, meets: 9 });
    var H = boot({ all: { 'cres_泉州_4': npc }, day: 33 });
    H.w.ConfessionRites.offer(npc);
    H.w.ConfessionRites.pick('straight');
    H.w.ConfessionRites.pick('oath');
    H.w.ConfessionRites.pick('token');                 // → pledge 结局幕
    var midAff = npc.relationship.affection;
    H.w.ConfessionRites.pick('leave');                 // 走出门去 → 收尾
    assert(H.doc.querySelector('.confession-rite-modal') === null, 'E1 结局出口点完，面板真的收掉了');
    assert(H.reopened.length === 1 && H.reopened[0] === 'cres_泉州_4',
        'E2 收尾回到本体 NPC 对话（showNPCDialog），不卡在场景里');
    assert(H.store.timeCost === 60, 'E3 一场定情之仪真扣一个时辰（60 分钟，行为约束来自世界本身）');
    assert(npc.hasFlag('dao_companion') && npc.memory._loveAccepted_confess === true,
        'E4 pledge 落承诺旗与道侣旗（否则结契后深谈反被 :3196 拦成「还没到那一步」）');
    assert(npc._bondCalls.length === 1, 'E5 道侣名册走 ensureDaoBond 正门落笔（旗与册同源）');
    assert(H.w.ConfessionRites.spentOf('cres_泉州_4').ending === 'pledge', 'E6 这一场记进 rites 账');

    // 重入：门开，但只复述结局、不二次落账
    var again = H.w.ConfessionRites.offer(npc);
    assert(again === true, 'E7 再点「倾诉心意」：场景层仍接管（给锁屏与解释，不装死）');
    var t = H.doc.querySelector('.confession-rite-modal').text();
    assert(t.indexOf('🔒') >= 0 && t.indexOf('她早已收下') >= 0,
        'E8 结契后再点：锁屏说「那句话她早已收下，余下的是道侣之盟」——不发新账、不重演一场');
    assert(npc.relationship.affection === midAff, 'E9 重入不二次落账（好感停在 ' + npc.relationship.affection + '）');
    assert(npc._bondCalls.length === 1, 'E10 重入不二次写名册');
    assert(npc.hasFlag('dao_companion'), 'E11 结契态稳定（旗在，bond_dao 深谈再点也只是重述）');

    // 未结契的一路（defer）也只此一次：第二次复述上一回的结果，不再开场
    var npcD = makeNpc('cres_幽州_2', '阿棠', { aff: 65, trust: 12, respect: 20, meets: 6 });
    var HD = boot({ all: { 'cres_幽州_2': npcD }, day: 40 });
    HD.w.ConfessionRites.offer(npcD);
    HD.w.ConfessionRites.pick('probe'); HD.w.ConfessionRites.pick('listen'); HD.w.ConfessionRites.pick('leave');
    assert(HD.w.ConfessionRites.spentOf('cres_幽州_2').ending === 'defer' && !npcD.hasFlag('dao_companion'),
        'E12 defer 路：这一场结清了，但不给盟约（不落 dao_companion，也不写名册）');
    var affD = npcD.relationship.affection;
    HD.w.ConfessionRites.offer(npcD);
    var td = HD.doc.querySelector('.confession-rite-modal').text();
    assert(td.indexOf('这一场你已开过') >= 0 && td.indexOf('请君先立') >= 0 && npcD.relationship.affection === affD,
        'E13 defer 路重入：锁屏复述「请君先立」并停手——一夜只开一次场，反复点不会白赚好感');
})();

// ============ F 存档 ============
section('F 存档：StateRegistry 正门；无平行 localStorage 键');
(function () {
    var H = boot({});
    assert(!!H.reg.confessionRites, 'F1 场景层自己注册进 StateRegistry（不是 game-state 里加键名）');
    assert(typeof H.reg.confessionRites.export === 'function' && typeof H.reg.confessionRites.import === 'function' &&
        typeof H.reg.confessionRites.reset === 'function', 'F2 export/import/reset 三件齐（:17-30 的签名）');

    var npc = makeNpc('cres_幽州_7', '阿棠', { aff: 78, trust: 50, respect: 70, meets: 9 });
    H.w.currentCharData.bonds = {};
    H.w.ConfessionRites.offer(npc);
    H.w.ConfessionRites.pick('straight'); H.w.ConfessionRites.pick('oath'); H.w.ConfessionRites.pick('token'); H.w.ConfessionRites.pick('leave');
    var snap = H.w.StateRegistry.exportAll();
    assert(!!snap.confessionRites && !!snap.confessionRites.data.rites['cres_幽州_7'] &&
        snap.confessionRites.data.rites['cres_幽州_7'].ending === 'pledge' &&
        snap.confessionRites.data.rites['cres_幽州_7'].day === 20,
        'F3 结局与日子随 StateRegistry 快照往返（真源是注册表，GameState.exportAll 自动收）');

    // 旧档：没有这个键 / 空 / 脏数据，都不许炸，且不得当成「已启过」
    var H2 = boot({});
    H2.reg.confessionRites.import(undefined);
    assert(H2.w.ConfessionRites.ledger().rites && Object.keys(H2.w.ConfessionRites.ledger().rites).length === 0,
        'F4 旧档（无该键）读得进来：账清空，不报错');
    H2.reg.confessionRites.import({ rites: { x: { ending: '瞎写的' }, y: null, z: { ending: 'defer', day: 'abc' } } });
    var led = H2.w.ConfessionRites.ledger();
    assert(!led.rites.x && !led.rites.y && led.rites.z && led.rites.z.day === 0,
        'F5 脏档被清洗：不在册的结局 id 丢弃、null 丢弃、非数字日子归零');
    H2.reg.confessionRites.reset();
    assert(Object.keys(H2.w.ConfessionRites.ledger().rites).length === 0, 'F6 reset 清空（新开局不留残迹）');

    // ★ 无平行存档：逐键扫
    var src = RITE_SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    var lsHits = src.match(/localStorage\.\w+\s*\(/g) || [];
    assert(lsHits.length === 0, 'F7 ★场景层一次都没碰 localStorage（逐键扫：命中 ' + lsHits.length + ' 处）');
    assert(!/saveToStorage\s*\(/.test(src), 'F8 也没借 saveToStorage 另立键');
    var hk = boot({});
    hk.w.ConfessionRites.offer(makeNpc('cres_x_1', '甲', { aff: 78, trust: 50, respect: 70, meets: 9 }));
    hk.w.ConfessionRites.pick('straight');
    assert(hk.w.localStorage._keys().length === 0, 'F9 跑完整场之后 localStorage 仍是零键（新存档键 = 0）');
})();

// ============ G 回落 ============
section('G 回落：场景层缺席时 executeEmotionInteraction 逐字回落到原实现');
(function () {
    var msgs = [];
    function loveCtx(npc, day) {
        var c = vm.createContext({
            window: { npcManager: { getNPC: function () { return npc; } }, timeSystem: { getAbsoluteDay: function () { return day; } }, Personality16: null, currentCharData: {} },
            showMessage: function (m) { msgs.push(m); },
            npcNotCoLocated: function () { return false; },
            Math: Math, Set: Set, Number: Number, console: console
        });
        vm.runInContext(extractFn(NS_SRC, 'executeEmotionInteraction') + ';globalThis.__ei=executeEmotionInteraction;', c);
        return c;
    }
    var npc = makeNpc('x', '温姑娘', { aff: 65, meets: 9 });
    var c = loveCtx(npc, 10);
    assert(c.window.ConfessionRites === undefined, 'G0 沙箱里没有 ConfessionRites（模拟未挂载 / 旧档）');
    c.__ei('x', 'confess');
    assert(npc.memory._loveAccepted_confess === true && npc.memory._loveCd.confess === 10 &&
        npc.relationship.affection === 70 && npc.relationship.love === 8,
        'G1 原实现一字未改：aff 65→70、love+8、承诺旗落、3 日冷却从今日起算');
    assert(msgs.join('|').indexOf('我……我需要时间考虑') >= 0 && msgs.join('|').indexOf('好感度+5') >= 0,
        'G2 回落时上屏的仍是原来那句文案与「好感度+5」（不是新场景的话）');

    // 好感不到 60：场景层在场也不接管，原实现的婉拒与情面-2 仍在
    var npc2 = makeNpc('x', '温姑娘', { aff: 50, meets: 9 });
    var msgs2 = [];
    var c2 = vm.createContext({
        window: { npcManager: { getNPC: function () { return npc2; } }, timeSystem: { getAbsoluteDay: function () { return 10; } },
            currentCharData: {}, ConfessionRites: { offer: function () { return false; } } },
        showMessage: function (m) { msgs2.push(m); },
        npcNotCoLocated: function () { return false; },
        Math: Math, Set: Set, Number: Number, console: console
    });
    vm.runInContext(extractFn(NS_SRC, 'executeEmotionInteraction') + ';globalThis.__ei=executeEmotionInteraction;', c2);
    c2.__ei('x', 'confess');
    assert(npc2.relationship.affection === 48 && !(npc2.memory._loveCd || {}).confess &&
        msgs2.join('|').indexOf('情面-2') >= 0,
        'G3 场景层 offer 返回 false 时原实现照旧：情面真折 -2、冷却不白记、文案含「情面-2」');

    // 接缝本身：场景层在场且接管时，原实现一行都不执行
    var npc3 = makeNpc('x', '温姑娘', { aff: 65, meets: 9 });
    var msgs3 = [];
    var took = false;
    var c3 = vm.createContext({
        window: { npcManager: { getNPC: function () { return npc3; } }, timeSystem: { getAbsoluteDay: function () { return 10; } },
            currentCharData: {}, ConfessionRites: { offer: function () { took = true; return true; } } },
        showMessage: function (m) { msgs3.push(m); },
        npcNotCoLocated: function () { return false; },
        Math: Math, Set: Set, Number: Number, console: console
    });
    vm.runInContext(extractFn(NS_SRC, 'executeEmotionInteraction') + ';globalThis.__ei=executeEmotionInteraction;', c3);
    c3.__ei('x', 'confess');
    assert(took && npc3.relationship.affection === 65 && npc3.memory._loveAccepted_confess === false && msgs3.length === 0,
        'G4 场景层接管时，原实现一次都没跑（好感未被原实现的 +5 偷改）');

    // 源码层面的接缝断言：兜底行必须逐字还在
    var seam = NS_SRC.slice(NS_SRC.indexOf("case 'confess':"), NS_SRC.indexOf("case 'confess':") + 1400);
    assert(seam.indexOf("window.ConfessionRites && typeof window.ConfessionRites.offer === 'function'") >= 0,
        'G5 接缝在位（先问场景层）');
    assert(seam.indexOf("if (aff >= 60) { showMessage('💕 ' + name + ' 怔住了") >= 0,
        'G6 兜底那一行逐字未改（原实现仍是最后的退路）');
    assert(NS_SRC.indexOf('window.BOND_DAO_FINAL_CHAPTER = BOND_DAO_FINAL_CHAPTER;') >= 0,
        'G7 名册挂上 window（场景层整册排除的依据只有这一个来源，不是另抄一份名单）');
})();

// ============ H 仙侠分寸（文案自检）============
section('H 仙侠分寸：不说现代话；伦常有具体台词');
(function () {
    var lines = [];
    Object.keys(boot({}).w.ConfessionRites.NODES).forEach(function (k) {
        var n = boot({}).w.ConfessionRites.NODES[k];
        n.desc.forEach(function (l) { lines.push(l.text); });
        n.choices.forEach(function (c) { lines.push(c.text); });
    });
    var all = lines.join('｜');
    ['喜欢你', '我爱你', '谈恋爱', '男朋友', '女朋友', '告白', '做我女朋友', '交往'].forEach(function (w) {
        assert(all.indexOf(w) < 0, 'H1 场景文案不含现代告白词「' + w + '」');
    });
    assert(all.indexOf('名分') >= 0 && all.indexOf('道途') >= 0 && all.indexOf('门规') >= 0,
        'H2 用的是仙侠词：名分 / 道途 / 门规');
    var src = RITE_SRC;
    assert(src.indexOf('师徒之间行此礼') >= 0 && src.indexOf('道侣之盟一生只结一结') >= 0,
        'H3 两条伦常各有具体台词（师徒之别 / 一盟不可二结），不是一句通用拒绝');
    assert(src.indexOf('名分是给外人看的') >= 0 && src.indexOf('门外的话，我不听') >= 0,
        'H4 玩家侧也有据理力争的余地（伦常是压力不是判决）');
})();

console.log('\n============== 小结：通过 ' + passed + ' / 失败 ' + failed + ' ==============');
if (failed) process.exit(1);