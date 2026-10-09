'use strict';
/**
 * tests/jealousy-deep-repeat-node.js
 *
 * 「第二个吃醋系统」的次数脱钩断言。
 *
 * 病根（实测，不是 flag 本身）：真正把 36 桩试探钉死一辈子的是 hasEventTriggered(evId)
 * ——personalEventFlags[evId]，由 npc-personal-events.js:1419 在事件演完那一刻落 true，
 * 而 jealousy-deep 的每日钩子拿它当闸。`flag: '<prefix>_e_probe_done'` 全仓没有一处引擎读它
 * （只是十一个路由测试断言过它的命名），所以 flag 一个字符都没改，改的是那道一次性判定。
 *
 * 本套钉六件事：
 *   A1 ★次数脱钩（核心）★：放开的那 17 桩，同一角色在条件满足时能第二次触发；
 *      且不是靠「把一次性旗洗白」做到的——hasEventTriggered 全程为真。
 *   A2 不可预知：各人各的数法（散开的间隔），不能靠「今天一定出」预判；概率闸原样不动。
 *   A3 ★不可重来的桩仍保留 flag★：明写永久撤销前提的那 19 桩，隔多久也不许再演；
 *      并把「分类所依据的原句」与该桩的 effects 文本对上——分类不许脱离文本。
 *   A4 排队不丢：座位被占时不静默丢弃（复用上一批的 window.__jealRequestSeat）。
 *   A5 ★面板不整栏隐藏★：条件不满足时是「亮锁 + 列原因」，不是整栏消失（禁止设计.md 第 2 条）。
 *   A6 门禁未放宽：requireRivalRomance / minAffection / requireEventDone / canPlayerAccess 一条没松。
 *
 * 运行：node tests/jealousy-deep-repeat-node.js
 */
var path = require('path');
var fs = require('fs');
var vm = require('vm');

var ROOT = path.resolve(__dirname, '..');
var passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) passed++;
    else { failed++; console.error('[FAIL] ' + msg); }
}
function loadScript(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

var DEEP_SRC = loadScript('js/npcs/jealousy-deep.js');
var ASM_SRC = loadScript('js/npcs/jealousy-assembly.js');
var PE_SRC = loadScript('js/npcs/npc-personal-events.js');

// 十九桩「不可重来」的分类依据原句，逐桩钉在测试里（改了文本就要改这里，改了就该红）
var ONESHOT_BASIS = {
    jg: '划满五划那日，我开口说最后一次话',
    em: '从今往后，你的卯，我不点了',
    hs: '凳子',
    wd: '脚印，我不数了',
    dy: '二十年，我数签头那颗从来不吃',
    yin: '不建档，不附页，不核',
    pi: '从今日起，批注只记硝磺',
    lie: '挪到影子不叠的柱子那儿去',
    kl: '今日你替我把礼正回来了',
    ty: '从今日起，你名下的引，站名照册',
    xue: '从今日起，不数你了',
    long: '从今日起，卡在喉咙里的调子，不练了',
    sj: '改校一只从没上过户的新雀',
    shu: '私卷没有。今日，立了',
    heng: '改在你不路过的时辰',
    gai: '笑而不答，是讯房最重的规矩',
    shao: '从明日起，头排不设了',
    tai: '今日的档，我不记你那一栏了',
    xiang: '往后的夜曲，改个时辰。改在没有人的时辰'
};
// 十七桩「情境可复现」的复现理由原句，逐桩钉在测试里
var REPEAT_BASIS = {
    bh: '脉象我可以再诊一回',
    xl: '一笔一笔，当面写',
    ts: '它再双鸣一次',
    wx: '往后的账，你自己掂量',
    lu: '我信你一回。就一回',
    su: '我一诊就知道',
    ms: '三日内我再卜一次',
    tm: '往后你每来一回，我验一回',
    pl: '记满一页——满一页的日子，你自己来数',
    xy: '往后的封泥上，我得多写一行小字',
    song: '往后你的档，你自己写，我核',
    qing: '往后每回新炒，头一包是你的',
    yan: '复核的期限',
    xie: '再翻开的时候',
    dq: '戴着，就知道',
    tz: '吹到你来为止',
    qz: '改日面结'
};

var CAST = [
    ['sect_leader_百花谷', '温蘅', '百花谷'],
    ['sect_leader_唐门', '唐霜令', '唐门'],
    ['sect_leader_少林寺', '竺照禅', '少林寺'],
    ['sect_leader_飞蝎坞', '拓银沙', '飞蝎坞']
];

// ====================================================================
// 沙箱：可控历法 / 可控 setTimeout / 可控假 DOM / 共用排队器的忠实替身
// ====================================================================
function makeWorld(opts) {
    opts = opts || {};
    var st = {
        day: opts.day || 20,
        modal: false,          // 假 DOM 里那扇占位的爱情弹窗
        timers: [],
        dayCbs: [],
        fired: [],             // triggerPersonalEvent 的实际调用记录
        firedToday: {},
        pending: [],           // 共用排队器的候补
        trig: {},              // personalEventFlags（真引擎那本账）
        store: {}
    };
    var roster = CAST.map(function (c) {
        return { id: c[0], name: c[1], sect: c[2], eventPrefix: '', role: 'heroine', isMaleLead: false };
    });
    if (opts.extraSameSect) {
        // 「同门派两个候选」那一格用替身造：真名册一派只有一位掌门，这一格是为了
        // 断言「名册不是按固定顺序被扫的」才存在的。
        roster.push({ id: 'sect_leader_百花谷', name: '温蘅替身', sect: '百花谷', eventPrefix: '', role: 'heroine', isMaleLead: false });
    }

    var npcs = {};
    roster.forEach(function (r, idx) {
        npcs[r.id + (idx === CAST.length ? '#2' : '')] = {
            id: r.id, name: r.name, location: r.sect,
            memory: { firstMet: true, meetCount: 3, lastMeetGameMinute: (st.day - 9) * 1440 },
            relationship: { affection: opts.aff === undefined ? 60 : opts.aff, trust: 30 },
            npcRelationships: {},
            hasFlag: function () { return false; }
        };
    });
    var npcGet = (function () {
        var map = {};
        var k = 0;
        roster.forEach(function (r, idx) { map[(idx === CAST.length ? r.id + '#2' : r.id)] = r.id; });
        return map;
    })();

    var PE = null;
    var timers = st.timers;

    var w = {
        _settings: { socialEventPanel: true },
        currentCharData: { location: opts.loc || '百花谷', bonds: {}, gender: 'female', name: '测试者' },
        npcManager: { getNPC: function (id) { return npcs[id] || null; } },
        timeSystem: {
            gameTime: {
                get currentDay() { return st.day; },
                get totalMinutes() { return st.day * 1440; }
            },
            getAbsoluteDay: function () { return st.day; },
            onNewDaySubscribe: function (cb) { st.dayCbs.push(cb); }
        },
        GameScheduler: { nowMinute: function () { return st.day * 1440; } },
        HEROINE_ROSTER: roster.slice(0, CAST.length),
        MALE_LEAD_ROSTER: [],
        saveGameData: function () {},
        inventory: { currency: { copper: 500, spiritStones: 0 } },
        updateCurrencyUI: function () {},
        detectRivalRomance: function (npcId) {
            if (!opts.rival) return null;
            return { id: opts.rival, name: '另一个人', isDaoCompanion: !!opts.rivalBond };
        },
        _jealHasFeelings: function () { return true; },
        _jealAllRivals: function (excludeId) {
            return roster.filter(function (r) { return r.id !== excludeId; })
                .map(function (r) { return { id: r.id, name: r.name, sect: r.sect, affection: 40 }; });
        },
        _jealRosterAll: function () {
            return roster.map(function (r) { return { id: r.id, name: r.name, sect: r.sect, eventPrefix: '', role: r.role }; });
        },
        _jealGuestInfo: function (id) { return { name: id, icon: '👤', gender: '' }; },
        _jealPartySuspects: function () { return null; },
        _jealEnsureAcquaintance: function () { return null; },
        _jealWriteback: function () { return { relation: 'neutral', strength: 0, text: '' }; }
    };

    var sbx;
    // ---- 共用排队器：照 heroine-rivalry.js 的语义复刻，含那道 hasEventTriggered 闸 ----
    function hasTrig(id) { return st.trig[id] === true; }
    function markTrig(id) { st.trig[id] = true; }
    function fireOnce(job) {
        if (st.firedToday[job.evId]) return false;                       // 当日去重
        if (!PE[job.evId]) return false;
        if (hasTrig(job.evId)) return false;                             // ★就是这道闸挡掉可重演的桩★
        var npc = w.npcManager.getNPC(job.npcId);
        if (!npc) return false;
        if (typeof sbx.canPlayerAccessPersonalEvent === 'function'
            && !sbx.canPlayerAccessPersonalEvent(PE[job.evId], npc)) return false;
        if (sbx.triggerPersonalEvent(job.evId)) { st.firedToday[job.evId] = st.day; return true; }
        return false;
    }
    w.__jealModalOpen = function () { return st.modal; };
    w.__jealRequestSeat = function (evId, npcId, name) {
        if (!PE[evId]) return 'dropped';
        if (!st.modal) return fireOnce({ evId: evId, npcId: npcId, name: name }) ? 'fired' : 'dropped';
        for (var i = 0; i < st.pending.length; i++) {
            if (st.pending[i].evId === evId && st.pending[i].npcId === npcId) return 'queued';
        }
        st.pending.push({ evId: evId, npcId: npcId, name: name });
        return 'queued';
    };
    w.__jealFlushPending = function () {
        while (st.pending.length && !st.modal) { fireOnce(st.pending.shift()); }
    };

    var sandbox = {
        window: w,
        console: { log() {}, warn() {}, error() {} },
        document: {
            querySelector: function (sel) {
                return (sel === '.personal-event-modal' && st.modal) ? { cls: 'personal-event-modal' } : null;
            },
            createElement: function () { return { style: {}, classList: { add() {} }, setAttribute() {}, appendChild() {} }; },
            body: { appendChild() {}, removeChild() {} }
        },
        setTimeout: function (fn, ms) { timers.push({ fn: fn, ms: ms }); return timers.length; },
        clearTimeout: function () {},
        localStorage: {
            getItem: function (k) { return (k in st.store) ? st.store[k] : null; },
            setItem: function (k, v) { st.store[k] = String(v); }
        },
        NPC_PERSONAL_EVENTS: PE,
        // 真实加载序里 heroine-rivalry.js 把 HEROINE_ROSTER 摆成裸全局，_jealRoster() 读的就是它
        HEROINE_ROSTER: roster.slice(0, CAST.length),
        MALE_LEAD_ROSTER: [],
        // 真引擎在场景演完那一刻 markEventTriggered（npc-personal-events.js:1419），这里同拍
        triggerPersonalEvent: function (id) { st.fired.push({ id: id, day: st.day }); markTrig(id); return true; },
        MutationObserver: function () { this.observe = function () {}; this.disconnect = function () {}; }
    };
    sandbox.self = sandbox;
    sandbox.globalThis = sandbox;
    w.window = w;
    sbx = sandbox;

    vm.createContext(sandbox);
    vm.runInContext(PE_SRC, sandbox, { filename: 'npc-personal-events.js' });   // 仙侠.html:2099
    // npc-personal-events.js 自己在顶层 var 了 NPC_PERSONAL_EVENTS，会顶掉沙箱里那个同名引用——
    // 重新取一次，别对着废引用断言。
    PE = sandbox.NPC_PERSONAL_EVENTS;
    // npc-personal-events.js 顶层也 var 了 triggerPersonalEvent（真实现会去操作 DOM）——
    // 换成本测试的可控桩：记一次调用 + 落那本 personalEventFlags，与真引擎同拍（场景演完那一刻）。
    sandbox.triggerPersonalEvent = function (id) { st.fired.push({ id: id, day: st.day }); markTrig(id); return true; };
    w.triggerPersonalEvent = sandbox.triggerPersonalEvent;
    vm.runInContext(DEEP_SRC, sandbox, { filename: 'jealousy-deep.js' });      // 仙侠.html:2175

    // 一次性旗换成可控真源（真引擎那本 personalEventFlags，随存档走）
    sandbox.hasEventTriggered = hasTrig;
    sandbox.markEventTriggered = markTrig;
    w.hasEventTriggered = hasTrig;
    w.markEventTriggered = markTrig;

    function runTimers() {
        var t = timers.splice(0, timers.length);
        t.forEach(function (x) { try { x.fn(); } catch (e) { /* 沙箱缺桩，按引擎的 typeof 守卫静默跳过 */ } });
    }
    function newDay(n) {
        st.day += (n || 1);
        st.firedToday = {};
        st.dayCbs.slice().forEach(function (cb) { try { cb(); } catch (e) { console.error('[hook] ' + e.message); } });
        runTimers();
    }
    return {
        w: w, sandbox: sandbox, st: st, PE: PE, npcs: npcs, roster: roster,
        runTimers: runTimers, newDay: newDay,
        hasTrig: hasTrig, markTrig: markTrig,
        firedIds: function () { return st.fired.map(function (f) { return f.id; }); },
        npc: function (id) {
            if (!npcs[id]) {
                npcs[id] = {
                    id: id, name: id, memory: { firstMet: true, meetCount: 3 },
                    relationship: { affection: 60, trust: 30 }, hasFlag: function () { return false; }
                };
            }
            return npcs[id];
        }
    };
}

// 引擎的每日钩子只在 Math.random 落到 0.3/0.25/0.22 之下时才出手；这里把随机按需喂定。
function pinRandom(world, v) {
    world.w.__pinnedRandom = v;
    vm.runInContext('Math.random = function(){ return window.__pinnedRandom; };', world.sandbox);
}

// ====================================================================
console.log('=== A1 次数脱钩（核心）：放开的那批，同一角色能第二次触发 ===');
// ====================================================================
(function () {
    var W = makeWorld({ rival: 'sect_leader_唐门', loc: '百花谷', day: 20 });
    pinRandom(W, 0.0);

    var P = W.PE['bh_event_probe'];
    assert(!!P, 'A1 温蘅的试探桩在事件池里');
    assert(P.repeatable === true, 'A1 温蘅（脉象可再诊一回）归入可情境复现那档');
    var gapNeed = P.repeatEvery;
    assert(gapNeed >= 12 && gapNeed <= 21, 'A1 间隔是她自己数得出的日数（' + gapNeed + ' 日），不是配额');
    assert(!P.ambient, 'A1 可复现不等于 ambient：主线链与一次相处 20 时辰的代价原样留着');

    W.newDay(0);                                   // 第 20 日：首演
    assert(W.firedIds().indexOf('bh_event_probe') >= 0, 'A1 第 20 日首演成功');

    // ★这里是最关键的一条：旗是真在的，不是被洗白的★
    assert(W.hasTrig('bh_event_probe') === true, 'A1 演完之后 hasEventTriggered 为真（没动那本账）');

    W.st.fired = [];
    W.newDay(1);                                   // 第 21 日：日子不够
    assert(W.firedIds().indexOf('bh_event_probe') < 0,
        'A1 第 21 日不再来（账上那段日子还没攒够）——不可预知的第一层：不是冷却一过就必来');

    W.st.fired = [];
    W.newDay(gapNeed - 2);                          // 差一日
    assert(W.firedIds().indexOf('bh_event_probe') < 0, 'A1 差一日仍然不来');

    W.st.fired = [];
    W.newDay(1);                                   // 攒够了
    assert(W.firedIds().indexOf('bh_event_probe') >= 0,
        '★A1 同一角色（温蘅）在条件满足时第二次触发——全套次数不再是一辈子一次★');
    assert(W.hasTrig('bh_event_probe') === true, 'A1 第二次触发没有靠洗白任何旗');

    // 再来一轮：第三次也要能来（不是「第二次特供」）
    W.st.fired = [];
    W.newDay(gapNeed);
    assert(W.firedIds().indexOf('bh_event_probe') >= 0, 'A1 第三次照样触发（不是配额制的一次性补给）');

    // 概率闸原样不动
    W.st.fired = [];
    pinRandom(W, 0.9);
    W.newDay(gapNeed);
    assert(W.firedIds().indexOf('bh_event_probe') < 0, 'A1 概率闸没被我顺手调高（0.9 > 0.3 不出手）');
})();

// ====================================================================
console.log('=== A2 不可预知：各人各的数法，不能靠「今天一定出」预判 ===');
// ====================================================================
(function () {
    var W = makeWorld({ rival: 'sect_leader_唐门' });
    var gaps = {};
    var ids = Object.keys(W.PE).filter(function (k) { return /_event_probe$/.test(k); });
    assert(ids.length === 36, 'A2 试探桩恰好 36（实得 ' + ids.length + '）');
    ids.forEach(function (id) { gaps[W.PE[id].repeatEvery] = (gaps[W.PE[id].repeatEvery] || 0) + 1; });
    var repIds = ids.filter(function (id) { return W.PE[id].repeatable; });
    var repGaps = {};
    repIds.forEach(function (id) { repGaps[W.PE[id].repeatEvery] = true; });
    var distinct = Object.keys(repGaps);
    assert(distinct.length >= 5,
        'A2 十七桩的间隔散开在多个值上（' + distinct.length + ' 个，实得 ' + JSON.stringify(distinct.sort()) + '）——不是一条固定冷却');
    assert(ids.filter(function (id) { return W.PE[id].repeatEvery !== undefined; }).length === repIds.length,
        'A2 只有可复现的那批写间隔；一次性那批一个都不写（不装样子）');

// 各自最早能再演的那一天，各不相同 —— 玩家没法把日子背下来
    var E = makeWorld({ rival: 'sect_leader_唐门', day: 20 });
    var earliest = {};
    repIds.forEach(function (id) {
        var ev = E.PE[id];
        var fakeNpc = { id: ev.npcId, memory: { _ambientLastDay: {} } };
        fakeNpc.memory._ambientLastDay[id] = 20;
        E.markTrig(id);
        var d2 = 20;
        while (d2 < 20 + 60) {
            E.st.day = d2;
            if (E.w._jealProbeRearm(ev, fakeNpc).ok) break;
            d2++;
        }
        E.st.day = 20;
        earliest[d2] = (earliest[d2] || 0) + 1;
    });
    var earliestKeys = Object.keys(earliest).sort(function (a, b) { return a - b; });
    assert(earliestKeys.length >= 5,
        'A2 同一天演过去，十七桩最早能再演的日子落在 ' + earliestKeys.length + ' 个不同的天（' + earliestKeys.join('/') + '）');
    assert(Math.min.apply(null, earliestKeys.map(Number)) >= 12,
        'A2 最早的也要等 12 日以上（不是明天就又来）');

    // 同一套条件下结果不是恒定的：出不出手仍由那道概率闸说了算，不是日历说了算
    var gateHits = 0, gateMiss = 0;
    [0.05, 0.9, 0.05, 0.9, 0.9, 0.05, 0.9, 0.05, 0.9, 0.9, 0.05, 0.9].forEach(function (gateVal) {
        var R = makeWorld({ rival: 'sect_leader_唐门', loc: '百花谷', day: 20 });
        R.w.__gate = gateVal;
        vm.runInContext('Math.random = function(){ return window.__gate; };', R.sandbox);
        R.st.fired = [];
        R.newDay(0);
        if (R.firedIds().indexOf('bh_event_probe') >= 0) gateHits++; else gateMiss++;
    });
    assert(gateHits > 0 && gateMiss > 0,
        'A2 完全相同的一套条件下，出手与不出手都出现过（来 ' + gateHits + ' 次 / 不来 ' + gateMiss + ' 次）——既不是每次必过，也不是某天一定来');

    // 反向钉：名册顺序真的被打散了（源码级）
    var src = DEEP_SRC;
    assert(/for \(var sh = roster\.length - 1; sh > 0; sh--\)/.test(src), 'A2 每日钩子把名册洗了牌（不然第一位永远先撞上那 30%）');
    assert(src.indexOf('Math.random() < 0.3') >= 0, 'A2 试探那道 30% 闸还在原处');
})();

// ====================================================================
console.log('=== A3 不可重来的桩仍保留 flag：十九桩逐桩对依据原句 ===');
// ====================================================================
(function () {
    var W = makeWorld({ rival: 'sect_leader_唐门' });
    var ONESHOT = W.w.JEAL_PROBE_ONESHOT || {};
    var keys = Object.keys(ONESHOT);
    assert(keys.length === 19, 'A3 不可重来的一档恰好 19 桩（实得 ' + keys.length + '）');

    var miss = [];
    keys.forEach(function (pfx) {
        var ev = W.PE[pfx + '_event_probe'];
        if (!ev) { miss.push(pfx + '(桩不在池里)'); return; }
        if (ev.repeatable !== false) miss.push(pfx + '(没标成一次性)');
        if (ev.flag !== pfx + '_e_probe_done') miss.push(pfx + '(flag 名被改了：' + ev.flag + ')');
        if (ev.repeatEvery !== undefined) miss.push(pfx + '(给一次性桩写了间隔)');
        // 分类必须与文本对得上：那一段「永久撤销前提」的原句就在这桩的 effects 里
        var body = '';
        try {
            var fake = { id: ev.npcId, name: 'Ta', relationship: { trust: 0 } };
            Object.keys(ev.effects(fake, 'tell') || {}).forEach(function () { });
            var opts = (ev.scenes.filter(function (s) { return s.options; })[0] || { options: [] }).options;
            opts.forEach(function (o) {
                var r = ev.effects(fake, o.effect);
                if (r && r.msg) body += r.msg;
            });
        } catch (e) { body = ''; }
        if (body.indexOf(ONESHOT_BASIS[pfx]) < 0) miss.push(pfx + '(文本里找不到依据原句「' + ONESHOT_BASIS[pfx] + '」)');
    });
    assert(miss.length === 0, 'A3 十九桩逐桩：flag 原样、标成一次性、且分类依据的原句确在本桩文本里（异常：' + miss.join(' / ') + '）');

    var repMiss = [];
    Object.keys(REPEAT_BASIS).forEach(function (pfx) {
        var ev = W.PE[pfx + '_event_probe'];
        if (!ev) { repMiss.push(pfx + '(桩不在池里)'); return; }
        if (ev.repeatable !== true) repMiss.push(pfx + '(没标成可复现)');
        var body = '';
        try {
            var fake = { id: ev.npcId, name: 'Ta', relationship: { trust: 0 } };
            var opts = (ev.scenes.filter(function (s) { return s.options; })[0] || { options: [] }).options;
            opts.forEach(function (o) {
                var r = ev.effects(fake, o.effect);
                if (r && r.msg) body += r.msg;
            });
        } catch (e) { body = ''; }
        if (body.indexOf(REPEAT_BASIS[pfx]) < 0) repMiss.push(pfx + '(文本里找不到复现理由「' + REPEAT_BASIS[pfx] + '」)');
    });
    assert(Object.keys(REPEAT_BASIS).length === 17, 'A3 可复现的一档恰好 17 桩');
    assert(repMiss.length === 0, 'A3 十七桩逐桩：标成可复现、且复现理由的原句确在本桩文本里（异常：' + repMiss.join(' / ') + '）');

    // 不是一刀切
    assert(keys.length !== 36 && keys.length !== 0, 'A3 分档不是一刀切（' + keys.length + ' / 36）');

    // 一千日后也不许再演
    var B = makeWorld({ rival: 'sect_leader_唐门', day: 20 });
    pinRandom(B, 0.0);
    B.newDay(0);
    var oncePfx = keys[0];
    var onceEv = B.PE[oncePfx + '_event_probe'];
    var onceId = oncePfx + '_event_probe';
    var onceNpc = B.npc(onceEv.npcId);
    B.markTrig(onceId);
    if (!onceNpc.memory._ambientLastDay) onceNpc.memory._ambientLastDay = {};
    onceNpc.memory._ambientLastDay[onceId] = 20;
    B.st.fired = [];
    B.newDay(1000);
    assert(B.firedIds().indexOf(onceId) < 0,
        'A3 不可重来的一桩隔一千日也不许再演（' + onceId + '）');
})();

// ====================================================================
console.log('=== A4 排队不丢：座位被占时不静默丢弃，复用上一批的排队器 ===');
// ====================================================================
(function () {
    var src = DEEP_SRC, asrc = ASM_SRC;

    // 旧写法两处都该绝迹
    assert(!/if \(document\.querySelector && document\.querySelector\('\.personal-event-modal'\)\) return;/.test(src),
        'A4 jealousy-deep 里那句「命中即 return」已经没有了');
    assert(!/if \(document\.querySelector && document\.querySelector\('\.personal-event-modal'\)\) return;/.test(asrc),
        'A4 jealousy-assembly 里那句「命中即 return」已经没有了');
    assert(src.indexOf('__jealRequestSeat') >= 0, 'A4 jealousy-deep 真的调了上一批的共用排队器（不是自己重写一份）');
    assert(asrc.indexOf('__jealRequestSeat') >= 0, 'A4 jealousy-assembly 也调共用排队器');

    // 行为一：座位被占，探试探走共用队列 ⇒ 排队，不丢
    var W = makeWorld({ rival: 'sect_leader_唐门', loc: '百花谷', day: 20 });
    pinRandom(W, 0.0);
    W.st.modal = true;                        // 别人的爱情弹窗占着
    W.newDay(0);
    assert(W.st.pending.length === 1 && W.st.pending[0].evId === 'bh_event_probe',
        'A4 座位被占：这一桩进了共用候补（' + JSON.stringify(W.st.pending) + '），没有被静默作废');
    assert(W.firedIds().length === 0, 'A4 座位被占：此刻确实没弹（不抢别人的场）');

    // 座位一空，候补补弹（同一日）
    W.st.modal = false;
    W.w.__jealFlushPending();
    assert(W.firedIds().indexOf('bh_event_probe') >= 0, 'A4 座位空出来：候补当场补弹');

    // 行为二：可重演的桩，共用队列会判 already-done（它有一道 hasEventTriggered 闸），
    //         jealousy-deep 落回本文件原路照样发出来 —— 这就是「不能全交出去」的实测证据
    var W2 = makeWorld({ rival: 'sect_leader_唐门', loc: '百花谷', day: 20 });
    pinRandom(W2, 0.0);
    W2.newDay(0);
    assert(W2.hasTrig('bh_event_probe'), 'A2/A4 铺垫：首演已落旗');
    W2.st.fired = [];
    var gap = W2.PE['bh_event_probe'].repeatEvery;
    W2.newDay(gap);
    assert(W2.firedIds().indexOf('bh_event_probe') >= 0,
        'A4 共用队列挡掉（已演过），本文件原路仍把这一桩发出来 —— 没有第三份排队器，也没有丢');

    // 行为三：座位被占且共用队列不在场（极简环境）⇒ 留痕，账目不清零
    var W3 = makeWorld({ rival: 'sect_leader_唐门', loc: '百花谷', day: 20 });
    delete W3.w.__jealRequestSeat;
    delete W3.w.__jealModalOpen;
    pinRandom(W3, 0.0);
    W3.st.modal = true;
    W3.newDay(0);
    var seat = W3.w.__jealDeepSeat();
    assert(seat.deferredCount >= 1, 'A4 共用队列不在场时：本文件自己留痕（' + seat.deferredCount + ' 条）');
    assert(seat.deferred[0].evId === 'bh_event_probe', 'A4 留痕里写明是哪一桩被让了');
    assert(W3.hasTrig('bh_event_probe') === false, 'A4 让位不落旗 ⇒ 这一桩仍然欠着，改日必然重来');

    // 行为四：assembly 的余波不许「先销账再发」——销账只在 onBooked 回调里（真弹出去那一刻）
    var markAt = asrc.indexOf('pend.entry.after = true;');
    var cbAt = asrc.indexOf('_asmFire(afterEv, function () {');
    assert(markAt > 0 && cbAt > 0 && markAt > cbAt,
        'A4 assembly 的销账写在 onBooked 回调里（在发射之后），不在发射之前');
    assert(asrc.split('pend.entry.after = true;').length - 1 === 1, 'A4 assembly 只销一次账（没有第二条裸赋值）');
})();

// ====================================================================
console.log('=== A5 面板不整栏隐藏（禁止设计.md 第 2 条）===');
// ====================================================================
(function () {
    var W = makeWorld({ rival: 'sect_leader_唐门', loc: '百花谷', day: 20 });
    var npc = W.npc('sect_leader_百花谷');
    var html = W.sandbox.getPersonalEventButtons(npc, 'sect_leader_百花谷');

    // 情形一：无情敌 ⇒ 试探那一行亮锁并列原因，不是整栏消失
    var W0 = makeWorld({ rival: null, loc: '百花谷', day: 20 });
    var h0 = W0.sandbox.getPersonalEventButtons(W0.npc('sect_leader_百花谷'), 'sect_leader_百花谷');
    assert(h0.indexOf('<details') >= 0 && h0.indexOf('📜 个人事件') >= 0, 'A5 条件不满足时整栏仍在（不是空白）');
    assert(h0.indexOf('🔒') >= 0, 'A5 条件不满足时画出锁');
    assert(h0.indexOf('需先与另一位缔结情缘') >= 0, 'A5 锁着还写清楚为什么锁');
    assert(h0.indexOf('？？？') >= 0, 'A5 锁着的那一行照样占位，不静默消失');
    assert(h0.length > 200, 'A5 面板不是空串（禁止「整栏隐藏」）');

    // 情形二：人不在她门派 ⇒ 地点原因写出来
    var W2 = makeWorld({ rival: 'sect_leader_唐门', loc: '少林寺', day: 20 });
    var h2 = W2.sandbox.getPersonalEventButtons(W2.npc('sect_leader_百花谷'), 'sect_leader_百花谷');
    assert(h2.indexOf('需亲至「百花谷」') >= 0, 'A5 地点闸写明差哪一条');

    // 情形三：好感不足 ⇒ 好感闸写出来
    var W3 = makeWorld({ rival: 'sect_leader_唐门', loc: '百花谷', day: 20, aff: 12 });
    var h3 = W3.sandbox.getPersonalEventButtons(W3.npc('sect_leader_百花谷'), 'sect_leader_百花谷');
    assert(h3.indexOf('好感≥40（当前12）') >= 0, 'A5 好感闸写明差多少');

    // 情形四：本批没有把任何一桩从池子里摘掉（总数没少）
    var probeIds = Object.keys(W.PE).filter(function (k) { return /_event_probe$/.test(k); });
    assert(probeIds.length === 36, 'A5 三十六桩试探全在事件池里（摘掉一桩就是整行消失）');

    // 情形五：演过的那一桩在面板上是「已完成」这一行，不是空白
    var W4 = makeWorld({ rival: 'sect_leader_唐门', loc: '百花谷', day: 20 });
    W4.markTrig('bh_event_probe');
    var h4 = W4.sandbox.getPersonalEventButtons(W4.npc('sect_leader_百花谷'), 'sect_leader_百花谷');
    assert(h4.indexOf('双营') >= 0 && h4.indexOf('已完成') >= 0, 'A5 演过的桩在面板上留一行「已完成」，不是消失');
})();

// ====================================================================
console.log('=== A6 门禁未放宽 ===');
// ====================================================================
(function () {
    var W = makeWorld({ rival: 'sect_leader_唐门', loc: '百花谷', day: 20 });
    var bad = [];
    Object.keys(W.PE).forEach(function (id) {
        var ev = W.PE[id];
        if (!/_event_probe$/.test(id)) return;
        if (ev.requireRivalRomance !== true) bad.push(id + '(失去「需先与另一位缔结情缘」)');
        if (ev.minAffection !== 40) bad.push(id + '(好感线被动了：' + ev.minAffection + ')');
    });
    assert(bad.length === 0, 'A6 三十六桩试探的「有情敌 + 好感≥40」一条没松（异常：' + bad.join(' / ') + '）');

    var badC = [];
    Object.keys(W.PE).forEach(function (id) {
        var ev = W.PE[id];
        if (!/_event_cold$/.test(id)) return;
        var pfx = id.slice(0, id.indexOf('_event_cold'));
        if (ev.requireEventDone !== pfx + '_event_probe') badC.push(id + '(前情=' + ev.requireEventDone + ')');
    });
    assert(badC.length === 0, 'A6 三十六桩敲打仍以各自的试探为前情（异常：' + badC.join(' / ') + '）');

    var badS = [];
    Object.keys(W.PE).forEach(function (id) {
        var ev = W.PE[id];
        if (!/_event_sulk$/.test(id)) return;
        if (ev.requireRivalRomance !== true || ev.minAffection !== 45 || ev.ambient !== true) badS.push(id);
    });
    assert(badS.length === 0, 'A6 三十六桩小心眼原样（ambient + 有情敌 + 好感≥45）');

    // 门禁不过 ⇒ 试探不发
    var G = makeWorld({ rival: 'sect_leader_唐门', loc: '百花谷', day: 20 });
    G.sandbox.canPlayerAccessPersonalEvent = function () { return false; };
    G.w.canPlayerAccessPersonalEvent = G.sandbox.canPlayerAccessPersonalEvent;
    pinRandom(G, 0.0);
    G.newDay(0);
    assert(G.firedIds().length === 0, 'A6 canPlayerAccessPersonalEvent 判否 ⇒ 一桩都不发（补弹那一刻也重过）');

    // 没情敌 ⇒ 试探不发
    var N = makeWorld({ rival: null, loc: '百花谷', day: 20 });
    pinRandom(N, 0.0);
    N.newDay(0);
    assert(N.firedIds().length === 0, 'A6 世上没有第二个对你有心的人 ⇒ 试探不发');

    // 好感不够 ⇒ 试探不发
    var L = makeWorld({ rival: 'sect_leader_唐门', loc: '百花谷', day: 20, aff: 39 });
    pinRandom(L, 0.0);
    L.newDay(0);
    assert(L.firedIds().length === 0, 'A6 好感 39 < 40 ⇒ 试探不发');

    // 源码级：先过 canPlayerAccess 再 triggerPersonalEvent，顺序没反
    var src = DEEP_SRC;
    var ia = src.indexOf('canPlayerAccessPersonalEvent(ev, npcInst)) return;');
    var it = src.indexOf('triggerPersonalEvent(evId)) {', ia);
    assert(ia > 0 && it > ia, 'A6 _jealFire 里门禁判定排在触发之前');
})();

// ====================================================================
console.log('=== A7 装配（assembly）那一族：座位被占不许永久作废 ===');
// ====================================================================
(function () {
    var W = makeWorld({ rival: 'sect_leader_唐门', loc: '百花谷', day: 20 });
    vm.runInContext(ASM_SRC, W.sandbox, { filename: 'jealousy-assembly.js' });
    pinRandom(W, 0.0);
    // 先种一笔 5 天前的照面
    W.st.store['xianxia_asm_ledger'] = JSON.stringify([{ h: 'sect_leader_百花谷', g: 'sect_leader_唐门', day: 15, choice: 'both', after: false }]);
    W.w._asmLedgerReload();
    W.st.modal = true;                      // 座位被占
    W.newDay(0);
    var led = W.w._asmLedgerGet();
    assert(led.every(function (e) { return e.after === false; }),
        'A7 座位被占：装配余波那一回合仍欠着（账没被提前销掉）');
    assert(Object.keys(W.PE).filter(function (k) { return k.indexOf('asm_after') === 0; }).length === 0,
        'A7 座位被占：不白装配一份声口');
    assert(W.w.__jealAsmSeat().deferredCount >= 1, 'A7 座位被占：留痕可查');

    W.st.modal = false;                     // 座位空出来，改日补演（窗口 3~10 日）
    W.newDay(1);
    assert(Object.keys(W.PE).filter(function (k) { return k.indexOf('asm_after') === 0; }).length === 1,
        'A7 座位空出来后的第二天：那一回合补演（没被作废）');
    assert(W.w._asmLedgerGet().every(function (e) { return e.after === true; }), 'A7 真的演出去才销账');
})();

// ====================================================================
console.log('=== A8 零新增存档键 ===');
// ====================================================================
(function () {
    var src = DEEP_SRC;
    assert(/npc\.memory\._ambientLastDay/.test(src), 'A8 再武装的日戳写进既有的 _ambientLastDay 账格');
    var newKeys = src.match(/localStorage\.setItem\(\s*['"][^'"]*jeal[^'"]*['"]/gi) || [];
    assert(newKeys.length === 0, 'A8 本文件没往 localStorage 另起新键（实得 ' + JSON.stringify(newKeys) + '）');
    assert(src.indexOf('JEAL_PROBE_GAP_MIN') >= 0 && src.indexOf('JEAL_PROBE_GAP_SPREAD') >= 0,
        'A8 间隔来自世界日头的散值，不是计数器');
    assert(!/JEAL_PROBE_COUNTER|probeCount|playCount/i.test(src), 'A8 没有偷偷记次数');
})();

console.log('');
console.log('通过 ' + passed + ' / 失败 ' + failed);
if (failed > 0) process.exit(1);
