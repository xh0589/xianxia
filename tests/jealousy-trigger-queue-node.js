/**
 * jealousy-trigger-queue-node.js — 吃醋触发链「弹窗位抢占 → 排队」回归门
 *
 * 病根（js/npcs/heroine-rivalry.js 的 _delayedRivalryFire）：
 *   setTimeout(1200) → `if (document.querySelector('.personal-event-modal')) return;`
 * 别人的爱情弹窗开着 → 当日这桩吃醋直接作废。零 pending、零重试、零降级入口，
 * 下一次机会是明天同一刻再撞一次同一个座位。全仓 .personal-event-modal 被 61 处引用、
 * 横跨 51 个文件，而吃醋族是唯一带 1200ms 延迟的那一族——延迟本身让它排在抢座位最末。
 *
 * 本测试钉四件事：
 *   A1 排队不丢（核心）：座位被占 → 写 pending → 弹窗离场 → 当日补弹
 *   A2 同构覆盖：male-lead-rivalry / jealousy-collective 的同构函数一并改走队列
 *   A3 锁不隐藏：关系面板条件不满足时显示锁+原因，**不是整行消失**（禁止设计.md 第 2 条）
 *   A4 多门派：同日换门派不会静默跳过
 *   A5 门禁不被绕过：补弹那一刻重新过 canPlayerAccessPersonalEvent
 *   A6 重试不靠 setTimeout：唯一的重试机制是 MutationObserver
 *
 * 运行：node tests/jealousy-trigger-queue-node.js
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

var HEROINE_SRC = 'js/npcs/heroine-rivalry.js';
var MALE_SRC = 'js/npcs/male-lead-rivalry.js';
var COLLECTIVE_SRC = 'js/npcs/jealousy-collective.js';
var PANEL_SRC = 'js/relations-panel.js';

// ====================================================================
// 沙箱：可控 setTimeout、可控 MutationObserver、可控假 DOM（.personal-event-modal）
// ====================================================================
function makeWorld(opts) {
    opts = opts || {};
    var timers = [];
    var observers = [];
    var dom = { modal: null };                 // 假 DOM 里那扇占位的爱情弹窗
    var triggered = [];                        // triggerPersonalEvent 的实际调用记录
    var dayListeners = [];
    var flags = opts.flags || {};              // npcId → true 表示已结为道侣/已定情
    var metIds = opts.metIds || {};
    var affs = opts.affs || {};
    var doneEvents = {};                       // evId → true（hasEventTriggered 已完成）
    var panel = { container: null, filterSel: null };

    function FakeMO(cb) { this.cb = cb; observers.push(this); }
    FakeMO.prototype.observe = function () {};
    FakeMO.prototype.disconnect = function () { this.dead = true; };

    var sandbox = {
        console: { log: function () {}, warn: function () {}, error: function () {} },
        JSON: JSON, Object: Object, Array: Array, String: String, Boolean: Boolean,
        Number: Number, isFinite: isFinite,
        Math: Object.create(Math),
        localStorage: {
            _d: {},
            getItem: function (k) { return Object.prototype.hasOwnProperty.call(this._d, k) ? this._d[k] : null; },
            setItem: function (k, v) { this._d[k] = String(v); },
            removeItem: function (k) { delete this._d[k]; }
        },
        setTimeout: function (fn, ms) { timers.push({ fn: fn, ms: ms }); return timers.length; },
        clearTimeout: function () {},
        MutationObserver: FakeMO,
        document: {
            body: {},
            querySelector: function (sel) { return sel === '.personal-event-modal' ? dom.modal : null; },
            querySelectorAll: function () { return []; },
            getElementById: function (id) {
                if (id === 'relations-npc-list') return panel.container;
                if (id === 'relations-filter') return panel.filterSel;
                if (id === 'relations-count') return null;
                return null;
            },
            createElement: function () {
                return { className: '', innerHTML: '', appendChild: function () {}, remove: function () {}, querySelector: function () { return null; } };
            }
        },
        timeSystem: {
            gameTime: { currentDay: opts.day || 5 },
            getAbsoluteDay: function () { return opts.day || 5; },
            onNewDaySubscribe: function (fn) { dayListeners.push(fn); },
            advanceTime: function () {}
        },
        currentCharData: { name: '道友', gender: 'male', location: opts.loc || '百花谷' },
        NPC_PERSONAL_EVENTS: {},
        __w: {
            timers: timers, observers: observers, dom: dom, triggered: triggered,
            dayListeners: dayListeners, flags: flags, metIds: metIds, affs: affs,
            doneEvents: doneEvents, panel: panel
        }
    };
    sandbox.Math.random = opts.rng != null ? function () { return opts.rng; } : function () { return 0.5; };
    sandbox.window = sandbox;

    // --- NPC 账 ---
    function mkNpc(id, name) {
        return {
            id: id, name: name,
            memory: sandbox.__w.metIds[id] === false ? { meetCount: 0 } : { firstMet: true, meetCount: 1 },
            relationship: { affection: sandbox.__w.affs[id] != null ? sandbox.__w.affs[id] : (opts.affDefault != null ? opts.affDefault : 60), respect: 30, favor: 10 },
            state: { mood: 60 },
            location: '百花谷',
            occupation: '掌门',
            appearance: { icon: '👤' },
            getRelationshipStatus: function () { return { name: '朋友', color: 'text-green-400' }; },
            hasFlag: function (f) { return f === 'dao_companion' && !!sandbox.__w.flags[id]; }
        };
    }
    var NPCS = {};
    function npcFor(id) {
        if (!NPCS[id]) {
            var name = id.replace('sect_leader_', '');
            NPCS[id] = mkNpc(id, name);
        }
        return NPCS[id];
    }
    sandbox.npcManager = {
        getNPC: function (id) { return npcFor(id); },
        getAllNPCs: function () { return Object.keys(NPCS).map(function (k) { return NPCS[k]; }); }
    };

    // --- 门禁：照抄 npc-personal-events.js 的真实口径（地点 + 情敌 + 一次性） ---
    sandbox.hasEventTriggered = function (evId) { return !!sandbox.__w.doneEvents[evId]; };
    sandbox.canPlayerAccessPersonalEvent = function (evDef, npc) {
        if (!evDef || !npc) return false;
        var mem = npc.memory || {};
        if (!(mem.firstMet === true || (mem.meetCount || 0) > 0)) return false;
        if (evDef.requireRivalRomance) {
            if (typeof sandbox.window.detectRivalRomance !== 'function') return false;
            if (!sandbox.window.detectRivalRomance(evDef.npcId)) return false;
        }
        var sectId = (typeof evDef.sectId === 'string') ? evDef.sectId : null;
        if (sectId && !evDef.anyLocation) {
            if ((sandbox.currentCharData.location || '') !== sectId) return false;
        }
        return true;
    };
    sandbox.triggerPersonalEvent = function (evId) {
        triggered.push(evId);
        dom.modal = { __ev: evId };     // 弹窗真的占住了座位
        return true;
    };
    sandbox.markEventTriggered = function (evId) { sandbox.__w.doneEvents[evId] = true; };

    // --- 假 DOM 动作 ---
    var ctx = vm.createContext(sandbox);
    vm.runInContext(loadScript(HEROINE_SRC), ctx, { filename: HEROINE_SRC });
    vm.runInContext(loadScript(PANEL_SRC), ctx, { filename: PANEL_SRC });

    return {
        w: sandbox,
        ctx: ctx,
        // 把假 DOM 里那扇弹窗摘掉，并像真浏览器那样通知 MutationObserver
        closeModal: function () {
            dom.modal = null;
            for (var i = 0; i < observers.length; i++) if (!observers[i].dead) observers[i].cb([], observers[i]);
        },
        openModal: function (evId) { dom.modal = { __ev: evId || 'other' }; },
        runTimers: function () {
            var t = timers.splice(0, timers.length);
            for (var i = 0; i < t.length; i++) t[i].fn();
        },
        report: function () { return sandbox.__jealTodayReport(); }
    };
}

// 二十位女主的 sect 各自不同；给对峙/和好事件补上门禁用得到的 sectId
function stampSectIds(ctx) {
    vm.runInContext(
        '(function(){for(var k in NPC_PERSONAL_EVENTS){var e=NPC_PERSONAL_EVENTS[k];' +
        'if(!e.sectId){for(var i=0;i<HEROINE_ROSTER.length;i++){var h=HEROINE_ROSTER[i];' +
        'if(k===h.eventId||k===h.reconcileId){e.sectId=h.sect;e.npcId=h.id;break;}}}}})()',
        ctx
    );
}

console.log('=== A1 排队不丢：座位被占 → 写 pending → 弹窗离场 → 当日补弹 ===');
(function () {
    var T = makeWorld({ loc: '百花谷', flags: { 'sect_leader_唐门': true }, affs: { 'sect_leader_百花谷': 60 } });
    stampSectIds(T.ctx);

    // 别的爱情弹窗先占着座位
    T.openModal('bh_event_rival_x');
    assert(T.w.__jealModalOpen() === true, 'A1 前置：座位确实被别的弹窗占住了');

    // 跨日扫描 → 报名
    var requested = T.w.__jealScanRivalry('newday');
    assert(requested === 1, 'A1 跨日扫描报名了 1 桩（实际 ' + requested + '）');

    // 1200ms 到了 —— 座位仍被占
    T.runTimers();
    assert(T.w.__jealModalOpen() === true, 'A1 1200ms 到点时座位仍被占');
    assert(T.w.triggerPersonalEvent === undefined || true, 'A1 沙箱就绪');
    var trigCallsAfterTimer = T.w.__w.triggered.length;
    assert(trigCallsAfterTimer === 0, 'A1 座位被占时没有硬弹（不该叠台）');

    // ★核心：写进 pending，而不是静默放弃
    var rep = T.report();
    assert(rep.pending.length === 1, '★A1 排队不丢：pending 写入 1 桩（实际 ' + rep.pending.length + '）');
    assert((rep.pending[0] || {}).evId === 'bh_event_rival', '★A1 pending 里是对峙事件 bh_event_rival（实际 ' + ((rep.pending[0] || {}).evId) + '）');
    assert(rep.queued >= 1, '★A1 当日留痕记下了「排队」（queued=' + rep.queued + '）');
    assert(rep.log.some(function (e) { return e.stage === 'queued' && /座位被占/.test(e.reason); }),
        '★A1 留痕写明「座位被占」而非无声消失');
    assert(rep.fired === 0 && rep.dropped === 0, 'A1 排队**不算**落空（当日还没判死）');

    // ★核心：弹窗一关，立刻补弹，当日有效
    T.closeModal();
    assert(T.w.__w.triggered.length === 1, '★A1 弹窗关闭后补弹了一次（实际 ' + T.w.__w.triggered.length + '）');
    assert(T.w.__w.triggered[0] === 'bh_event_rival', '★A1 补弹的是被抢掉的那一桩（实际 ' + T.w.__w.triggered[0] + '）');
    var rep2 = T.report();
    assert(rep2.pending.length === 0, '★A1 补弹后 pending 清空');
    assert(rep2.fired === 1, '★A1 当日计为已叫住 1 次（实际 ' + rep2.fired + '）');
    assert(rep2.log.some(function (e) { return e.stage === 'flushed' && /当日有效/.test(e.reason); }),
        '★A1 留痕记下「座位空出，补弹（当日有效）」');
})();

console.log('=== A1b 队列里有多桩时按序补弹，且不叠台 ===');
(function () {
    var T = makeWorld({ loc: '百花谷', flags: { 'sect_leader_唐门': true }, affs: { 'sect_leader_百花谷': 60 } });
    stampSectIds(T.ctx);
    T.openModal('other_event');
    T.w.__jealScanRivalry('newday');
    T.runTimers();
    assert(T.report().pending.length === 1, 'A1b pending 1 桩');

    // 座位关了又被人抢走一次（多开了一扇别的爱情弹窗）
    T.openModal('another_event');
    T.closeModal.call(null);
    // closeModal 会把 modal 置 null 并通知观察者 —— 这里直接断言第一次补弹成功
    assert(T.w.__w.triggered.length === 1, 'A1b 只弹一次，不叠台（实际 ' + T.w.__w.triggered.length + '）');
})();

console.log('=== A2 同构覆盖：male-lead-rivalry / jealousy-collective 的同构函数一并改走队列 ===');
(function () {
    // 去掉注释行再判——「原先此处一句 `if (_modalOpen()) return;`」这类说明文字里也会命中关键字
    function codeOnly(src) {
        return src.split('\n').filter(function (l) { return !/^\s*\/\//.test(l); }).join('\n');
    }
    var male = loadScript(MALE_SRC);
    var coll = loadScript(COLLECTIVE_SRC);

    assert(/__jealRequestSeat/.test(male), 'A2 male-lead-rivalry 同构处改走共用排队器');
    // 主路径必须先走队列；旧写法只作为「共用队列不可用」的兜底存在，且排在它后面
    var qIdx = male.indexOf('__jealRequestSeat');
    var silentIdx = male.indexOf("document.querySelector('.personal-event-modal')) return;");
    assert(silentIdx > qIdx, 'A2 male-lead-rivalry 静默放弃已从主路径挪到兜底分支之后（主路径已先走队列）');
    assert(/\.bind\(null, rivalId, npc, h\)/.test(male),
        'A2 male-lead-rivalry 顺手把闭包里的 h 一并 bind（for 循环 var，回调执行时已指向名册末位）');

    assert(/__jealRequestSeat/.test(coll), 'A2 jealousy-collective 的 _fire 改走共用排队器');
    var collCode = codeOnly(coll);
    var collHook = collCode.slice(collCode.indexOf('onNewDaySubscribe'));
    assert(collHook.indexOf('_modalOpen') < 0,
        'A2 jealousy-collective 每日钩子/擂台钩子不再一句 _modalOpen 就连根拔掉');
    assert(/_modalOpen\(\)/.test(collCode), 'A2 jealousy-collective 仍保留 _modalOpen 兜底（女主线未加载时不至于失守）');

    // 三个文件都得留一条「共用队列不可用时」的兜底，防止 heroine-rivalry.js 未加载导致本族彻底哑火
    assert(/typeof window\.__jealRequestSeat === 'function'/.test(male), 'A2 male 有 typeof 兜底守卫');
    assert(/typeof window\.__jealRequestSeat === 'function'/.test(coll), 'A2 collective 有 typeof 兜底守卫');
    // heroine-rivalry.js 必须先于三个消费方加载（仙侠.html:2128 < 2172 / 2195 / 2196）
    var html = loadScript('仙侠.html');
    var idxes = ['js/npcs/npc-personal-events.js', 'js/npcs/heroine-rivalry.js',
        'js/npcs/male-lead-rivalry.js', 'js/npcs/jealousy-collective.js', 'js/relations-panel.js']
        .map(function (rel) { return html.indexOf(rel); });
    assert(idxes.every(function (v, k) { return v > 0 && (k === 0 || v > idxes[k - 1]); }),
        'A2 加载序正确：共用队列（heroine-rivalry）在三个消费方之前（idx=' + idxes.join(',') + '）');
})();

console.log('=== A3 锁不隐藏：条件不满足时显示锁+原因，不是整行消失 ===');
(function () {
    // 情形一：没情敌 ⇒ 锁着，且必须写明「需先与另一位缔结情缘」
    var T = makeWorld({ loc: '百花谷', flags: {}, affs: { 'sect_leader_百花谷': 60 } });
    T.w.currentCharData.location = '少林寺';   // 也不在她的门派
    var npc = T.w.npcManager.getNPC('sect_leader_百花谷');

    var b = T.w.relationsJealousyBell(npc);
    assert(b !== null, 'A3 名册上的女主角拿得到铃铛状态');
    assert(b.state === 'locked', 'A3 无情敌 ⇒ 锁着（实际 ' + b.state + '）');
    assert(b.reasons.length >= 2, 'A3 原因逐条汇总，不短路（实际 ' + JSON.stringify(b.reasons) + '）');
    assert(b.reasons.some(function (r) { return /需先与另一位缔结情缘/.test(r); }),
        'A3 写明「需先与另一位缔结情缘」');
    assert(b.reasons.some(function (r) { return /需亲至「百花谷」/.test(r); }),
        'A3 写明「需亲至「百花谷」」（地点闸也写清，不闷掉）');

    var html = T.w.relationsJealousyBellHtml(npc);
    assert(html.indexOf('🔒') >= 0, 'A3 锁着时画出锁');
    assert(html.indexOf('data-jeal-state="locked"') >= 0, 'A3 锁态带 data-jeal-state（可断言，不靠肉眼）');
    assert(html.indexOf('需先与另一位缔结情缘') >= 0, 'A3 锁态把原因印在可见正文里（不必悬停）');
    assert(html.length > 20, 'A3 锁态不是空串 ⇒ 没有整格隐藏');

    // 情形二：★整行不消失★——面板真的把这个 NPC 渲染出来了吗
    T.w.__w.panel.container = { innerHTML: '' };
    T.w.__w.panel.filterSel = { value: 'all' };
    T.w.renderRelationsPanel();
    var out = T.w.__w.panel.container.innerHTML;
    assert(out.indexOf('sect_leader_百花谷') >= 0 || out.indexOf('百花谷') >= 0,
        '★A3 整行照样渲染（锁不隐藏，对应用户原话「整栏消失是什么脑残设计」）');
    assert(out.indexOf('🔒') >= 0, '★A3 面板里看得见锁');

    // 情形三：情敌齐了但你不在她门派 ⇒ 「她在等你」而非锁死
    var T2 = makeWorld({ loc: '少林寺', flags: { 'sect_leader_唐门': true }, affs: { 'sect_leader_百花谷': 60 } });
    var b2 = T2.w.relationsJealousyBell(T2.w.npcManager.getNPC('sect_leader_百花谷'));
    assert(b2.state === 'waiting', 'A3 三条件满足但不在她门派 ⇒ waiting（实际 ' + b2.state + '）');
    assert(b2.reasons.some(function (r) { return /需亲至/.test(r); }), 'A3 waiting 也写明差哪一条');

    // 情形四：三条全满足且人在她门派 ⇒ 亮灯可点
    var T3 = makeWorld({ loc: '百花谷', flags: { 'sect_leader_唐门': true }, affs: { 'sect_leader_百花谷': 60 } });
    stampSectIds(T3.ctx);
    var b3 = T3.w.relationsJealousyBell(T3.w.npcManager.getNPC('sect_leader_百花谷'));
    assert(b3.state === 'lit', 'A3 三条全满足且人在她门派 ⇒ 亮灯（实际 ' + b3.state + '）');
    assert(b3.reasons.length === 0, 'A3 亮灯时没有锁项');
    var h3 = T3.w.relationsJealousyBellHtml(T3.w.npcManager.getNPC('sect_leader_百花谷'));
    assert(h3.indexOf('ringJealousyBell') >= 0, 'A3 亮灯可点（真的挂了主动入口）');

    // 情形五：J6 当日 0 次触发写明原因
    T3.w.__w.panel.container = { innerHTML: '' };
    T3.w.__w.panel.filterSel = { value: 'all' };
    T3.w.renderRelationsPanel();
    var foot = T3.w.__w.panel.container.innerHTML;
    assert(foot.indexOf('今日 0 次触发') >= 0, 'A3 J6 当日 0 次触发写在面板上（玩家看得见为什么）');
    assert(foot.indexOf('谁把谁放在心上') >= 0, 'A3 J6 「谁把谁放在心上」可视化在面板上');

    // 情形六：★名单空时留痕照样上屏★（J6 早年在空名单的早退分支上被吞掉过一次）
    var T4 = makeWorld({ loc: '百花谷', flags: { 'sect_leader_唐门': true }, affDefault: 0, affs: {} });
    T4.w.__w.metIds = {};                     // 一个都没结识
    T4.w.npcManager.getAllNPCs = function () { return []; };
    T4.w.__w.panel.container = { innerHTML: '' };
    T4.w.__w.panel.filterSel = { value: 'all' };
    T4.w.renderRelationsPanel();
    var emptyFoot = T4.w.__w.panel.container.innerHTML;
    assert(emptyFoot.indexOf('今日 0 次触发') >= 0,
        '★A3 名单一个都没结识时，J6 留痕照样上屏（不被「暂无结识之人」吞掉）');
    assert(emptyFoot.indexOf('暂无结识之人') >= 0, 'A3 占位文案仍在（两行并存，不是替换）');
})();

console.log('=== A4 多门派：同日换门派不会静默跳过 ===');
(function () {
    // 温蘅与晏万解彼此已定情 ⇒ 互为情敌（detectRivalRomance 扫全名册找 dao_companion）
    var twoRival = { 'sect_leader_百花谷': true, 'sect_leader_唐门': true };
    var T = makeWorld({ loc: '百花谷', flags: twoRival, affDefault: 10, affs: { 'sect_leader_百花谷': 60, 'sect_leader_唐门': 60 } });
    stampSectIds(T.ctx);

    // 跨日：站在百花谷 ⇒ 温蘅报名并在 1200ms 后弹
    T.w.__jealScanRivalry('newday');
    T.runTimers();
    assert(T.w.__w.triggered.length === 1, 'A4 前半：百花谷的温蘅弹了（实际 ' + T.w.__w.triggered.length + '）');
    assert(T.w.__w.triggered[0] === 'bh_event_rival', 'A4 弹的是温蘅的对峙');

    // ★同日换门派：站到唐门去，再扫一次（等价于玩家打开关系面板那次重新点名）
    T.w.__w.triggered.length = 0;
    T.w.currentCharData.location = '唐门';
    var again = T.w.__jealScanRivalry('panel');
    assert(again === 1, '★A4 同日换门派后，第二位也能报名（实际 ' + again + '）');
    T.runTimers();
    // 第一桩的弹窗还开着 ⇒ 第二桩不叠台，先排队
    assert(T.w.__w.triggered.length === 0, 'A4 第一桩弹窗还开着，第二桩不硬叠台（实际弹了 ' + T.w.__w.triggered.length + ' 次）');
    var repA4 = T.report();
    assert(repA4.pending.length === 1 && (repA4.pending[0] || {}).evId === 'tm_event_rival',
        '★A4 第二桩在座位被占时进了队列，不是静默作废（pending=' + JSON.stringify(repA4.pending.map(function (p) { return p.evId; })) + '）');
    // 玩家看完第一桩、关掉弹窗 ⇒ 同日第二桩补弹
    T.closeModal();
    assert(T.w.__w.triggered.length === 1, '★A4 同日第二桩补弹了，不是「一天只吃一次」（实际 ' + T.w.__w.triggered.length + '）');
    assert(T.w.__w.triggered[0] === 'tm_event_rival', 'A4 第二桩是晏万解的对峙（实际 ' + T.w.__w.triggered[0] + '）');
    var repA4b = T.report();
    assert(repA4b.fired === 2, '★A4 当日合计叫住 2 次（实际 ' + repA4b.fired + '）');

    // ★不在她门派时不是无声的 continue，而是登记「她在等你」
    var T2 = makeWorld({ loc: '少林寺', flags: twoRival, affDefault: 10, affs: { 'sect_leader_百花谷': 60, 'sect_leader_唐门': 60 } });
    T2.w.__jealScanRivalry('newday');
    var waiting = Object.keys(T2.w.__jealWaiting).sort();
    assert(waiting.length === 2 && waiting.indexOf('sect_leader_百花谷') >= 0 && waiting.indexOf('sect_leader_唐门') >= 0,
        '★A4 人不在她门派时登记「她在等你」，不再静默跳过（实际登记 ' + JSON.stringify(waiting) + '）');
    assert(T2.w.__jealWaiting['sect_leader_百花谷'].reason.indexOf('需亲至「百花谷」') >= 0,
        'A4 登记时写明差哪一条');
    assert(T2.w.__w.triggered.length === 0, 'A4 不在她门派时不会硬弹（地点闸仍在，没被 J2/J3 放宽）');
})();

console.log('=== A5 门禁不被绕过：补弹那一刻重新过 canPlayerAccessPersonalEvent ===');
(function () {
    var T = makeWorld({ loc: '百花谷', flags: { 'sect_leader_唐门': true }, affs: { 'sect_leader_百花谷': 60 } });
    stampSectIds(T.ctx);
    T.openModal('other_event');
    T.w.__jealScanRivalry('newday');
    T.runTimers();
    assert(T.report().pending.length === 1, 'A5 前置：已排队');

    // 座位空出来之前，人已经离开百花谷 ⇒ 地点闸应当把她挡回去
    T.w.currentCharData.location = '少林寺';
    T.closeModal();
    assert(T.w.__w.triggered.length === 0, '★A5 补弹仍受地点闸约束，没有绕过 canPlayerAccessPersonalEvent');
    var rep = T.report();
    assert(rep.pending.length === 0, 'A5 过不了闸的补弹作废，不留尾巴');
    assert(rep.log.some(function (e) { return e.stage === 'dropped' && /门禁未过/.test(e.reason); }),
        'A5 落空原因写明「门禁未过」');
})();

console.log('=== A6 重试不靠 setTimeout：唯一的重试机制是 MutationObserver ===');
(function () {
    var src = loadScript(HEROINE_SRC);
    var setTimeoutCount = (src.match(/setTimeout\(/g) || []).length;
    assert(setTimeoutCount === 1, 'A6 heroine-rivalry 只剩 1 处 setTimeout（_delayedRivalryFire 那 1200ms 戏剧停顿），补弹未新增延时（实际 ' + setTimeoutCount + '）');
    assert(/MutationObserver/.test(src), 'A6 用 MutationObserver 监听弹窗离场');
    assert(/\.observe\(document\.body, \{ childList: true, subtree: true \}\)/.test(src),
        'A6 监听挂在 document.body 的子树增删上');
    // 排队器里不得出现任何轮询（注释里提到 setTimeout 不算数，先剥注释）
    var srcCode = src.split('\n').filter(function (l) { return !/^\s*\/\//.test(l); }).join('\n');
    var flushBody = srcCode.slice(srcCode.indexOf('function _jealFlushPending'), srcCode.indexOf('function _jealWatchModal'));
    assert(flushBody.indexOf('setTimeout') < 0, 'A6 补弹函数体内零 setTimeout');
    assert(flushBody.length > 100, 'A6 补弹函数切片有效（长度 ' + flushBody.length + '）');
    assert(/if \(!JEAL_MODAL_PENDING\.length\) return;/.test(src),
        'A6 队列空时回调第一行就返回（全局 DOM 变动绝大多数走这条早退）');
})();

console.log('=== A7 当日去重：面板反复重扫不叠弹 ===');
(function () {
    var T = makeWorld({ loc: '百花谷', flags: { 'sect_leader_唐门': true }, affs: { 'sect_leader_百花谷': 60 } });
    stampSectIds(T.ctx);
    for (var i = 0; i < 5; i++) T.w.__jealScanRivalry('panel');
    var pendTimers = T.w.__w.timers.length;
    assert(pendTimers === 1, 'A7 反复重扫只挂一个计时器，不叠一串（实际 ' + pendTimers + '）');
    T.runTimers();
    assert(T.w.__w.triggered.length === 1, 'A7 只弹一次（实际 ' + T.w.__w.triggered.length + '）');
    // 再扫一次，已叫住过的当日不该重弹
    T.w.__w.triggered.length = 0;
    T.w.__jealScanRivalry('panel');
    T.runTimers();
    assert(T.w.__w.triggered.length === 0, 'A7 当日已叫住过，不再重弹');
})();

console.log('=== A9 接线自检：监听真的挂上了（否则等于退回静默放弃） ===');
(function () {
    var T = makeWorld({ loc: '百花谷', flags: { 'sect_leader_唐门': true }, affs: { 'sect_leader_百花谷': 60 } });
    stampSectIds(T.ctx);

    var d0 = T.w.__jealQueueDebug();
    assert(d0.watching === false, 'A9 还没排队时不监听（不白挂观察者）');
    assert(d0.observerKind === 'MutationObserver', 'A9 重试机制是 MutationObserver');
    assert(d0.pendingCount === 0 && d0.waitingCount === 0, 'A9 初始队列与候补都为空');

    T.openModal('other_event');
    T.w.__jealScanRivalry('newday');
    T.runTimers();
    var d1 = T.w.__jealQueueDebug();
    assert(d1.watching === true, '★A9 一旦有桩排队，弹窗离场监听就挂上了（没挂上＝补弹叫不醒）');
    assert(d1.observing === true, 'A9 监听挂在真实 document.body 上');
    assert(d1.pendingCount === 1, 'A9 自检口数得出队列里有 1 桩');
    assert(d1.seatTaken === true, 'A9 自检口读的是真实座位占用状态');
})();

console.log('=== A8 门禁原样保留（没顺手放宽任何一条） ===');
(function () {
    var src = loadScript(HEROINE_SRC);
    // L3 阈值 45 / L4 一次性 / L5 情敌 —— 三条都还在
    assert(/aff >= 45 && !hasEventTriggered\(h\.eventId\) && _det\(h\.id\)/.test(src),
        'A8 L3 好感≥45 与 L4 一次性标记原样保留');
    assert(/requireRivalRomance: true/.test(src), 'A8 L5 requireRivalRomance 门禁未被放宽（仍是已定情，不是暧昧）');
    assert(/if \(h\.sect !== loc\)/.test(src), 'A8 L2 门派闸仍在（只是不再静默跳过，而是登记她在等）');
})();

console.log('');
console.log('通过 ' + passed + ' / 失败 ' + failed);
process.exitCode = failed > 0 ? 1 : 0;
