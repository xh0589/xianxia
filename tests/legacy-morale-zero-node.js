/**
 * legacy-morale-zero-node.js — 门派士气/资源「零值被当默认值」回归门：
 *
 * 旧写法 `data.morale || 50` —— JS 里 `0 || 50 === 50`。士气/资源**能到 0**
 * （灾难连着压：-35/-30/-25/-20/-8 都往 0 顶，下限就是 0），于是谷底加减士气，
 * 实际是在给一个不存在的 50 加减：减 15 得 35（谷底反涨）、加 15 得 65（一键半满）。
 * 上一批只修了事件抽取那一处（generateSectEvent），结算的 15 处仍按 50 加减 ——
 * 抽「妖兽肆虐」想压士气，压的是 50 那条线。本测试把两边钉在同一口径上。
 *
 * 运行：node tests/legacy-morale-zero-node.js
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

// 每个沙箱是一个独立 context，effect 闭包锁在**它自己那个 context** 里 ——
// 所以结算必须「建世界 → 改账 → 用**同一个世界**的 SECT_EVENTS_POOL 去结算」。
// 借别的世界的池子来调 effect，账会写到那个世界的空对象上，测出来全是假绿。
function makeWorld(rng) {
    var msgs = [];
    var w = {
        console: { log: function () {}, warn: function () {}, error: function () {} },
        JSON: JSON, Object: Object, Array: Array, String: String, Boolean: Boolean,
        Number: Number, isFinite: isFinite,
        Math: {
            random: function () { return rng != null ? rng : 0.5; },
            min: Math.min, max: Math.max, floor: Math.floor, ceil: Math.ceil, abs: Math.abs
        },
        discipleState: { isInSect: false, sectId: null, rank: 0, contribution: 0, points: 0 },
        SECT_INTERNAL: { '少林寺': {} },
        showMessage: function (m) { msgs.push(String(m)); },
        __msgs: msgs
    };
    w.window = w;
    vm.runInContext(loadScript('js/sects/sect-events.js'), vm.createContext(w));
    return w;
}

// 只读结构/常量用的参照世界（读 .type / .minMorale 这类死数据，不调 effect）
var REF = makeWorld();
function poolDef(id) { return REF.SECT_EVENTS_POOL[id]; }
function sectEventWeight(ev, morale) { return REF.sectEventWeight(ev, morale); }

// 结算一桩事件，回读结算后的账
function settle(setup, eventId) {
    var w = makeWorld();
    w.SECT_INTERNAL['少林寺'] = setup;
    var res = w.SECT_EVENTS_POOL[eventId].effect('少林寺');
    return { w: w, data: w.SECT_INTERNAL['少林寺'], text: String(res) };
}

// ============ 零值：士气正好是 0 时，各加减路径得到什么 ============
// 判据：谷底（0）加减应从 0 起算，而不是从 50 起算。
// 旧写法下这些全部会得 35 / 65 / 70 / 45 —— 与期望值逐条不同，所以每条都能抓回归。
assert(settle({ morale: 0, resources: 100, disciples: 20, influence: 50 }, 'inner_dispute').data.morale === 0,
    '零值 1/8 内部纷争 −15：谷底钳在 0（不是旧写法的 35）');
assert(settle({ morale: 0, resources: 100, disciples: 20, influence: 50 }, 'poor_harvest').data.morale === 0,
    '零值 2/8 岁收歉薄 −8：谷底钳在 0（不是旧写法的 42）');
assert(settle({ morale: 0, resources: 100, disciples: 20, influence: 50 }, 'demon_beast_rampage').data.morale === 0,
    '零值 3/8 妖兽肆虐 −30：谷底钳在 0（不是旧写法的 20）');
assert(settle({ morale: 0, resources: 100, disciples: 20, influence: 50 }, 'plague').data.morale === 0,
    '零值 4/8 瘟疫蔓延 −25：谷底钳在 0（不是旧写法的 25）');
assert(settle({ morale: 0, resources: 100, disciples: 20, influence: 50 }, 'spirit_vein_collapse').data.morale === 0,
    '零值 5/8 灵脉崩塌 −35：谷底钳在 0（不是旧写法的 15）');
assert(settle({ morale: 0, resources: 100, disciples: 20, influence: 50 }, 'hostile_attack').data.morale === 0,
    '零值 6/8 外敌入侵 −20：谷底钳在 0（不是旧写法的 30）');

assert(settle({ morale: 0, resources: 100, disciples: 20, influence: 50 }, 'disciple_breakthrough').data.morale === 15,
    '零值 7/8 弟子突破 +15：从 0 涨到 15（不是旧写法的 65）');
assert(settle({ morale: 0, resources: 100, disciples: 20, influence: 50 }, 'grand_festival').data.morale === 25,
    '零值 8/8 门派庆典 +25：从 0 涨到 25（不是旧写法的 75）');

// 谷底不能被「一键半满」：7 桩加士气事件逐一验，不抽样
[['elder_lecture', 5], ['sect_exam', 5], ['new_disciples', 5],
 ['ancestor_worship', 10], ['treasure_found', 10], ['holy_land_open', 20],
 ['master_return', 30]].forEach(function (pair) {
    var got = settle({ morale: 0, resources: 100, disciples: 20, influence: 50 }, pair[0]).data.morale;
    assert(got === pair[1],
        '零值 谷底加士气 ' + pair[0] + ' +' + pair[1] + '：实得 ' + got + '，不该从 50 起算');
});

// 谷底不能被「打不疼」：6 桩减士气事件逐一验
[['inner_dispute', 0], ['poor_harvest', 0], ['hostile_attack', 0],
 ['plague', 0], ['demon_beast_rampage', 0], ['spirit_vein_collapse', 0]].forEach(function (pair) {
    var got = settle({ morale: 0, resources: 100, disciples: 20, influence: 50 }, pair[0]).data.morale;
    assert(got === 0, '零值 谷底减士气 ' + pair[0] + '：实得 ' + got + '（旧写法会给 50 减，谷底反涨）');
});

// 谷底往上抬一格再压：那一次减就该真减（旧写法在这里是 50 减，看起来「对」，
//   所以单看 -15 那条在士气 60 时也过——只有从 0 起算才分得清）
assert(settle({ morale: 10, resources: 100, disciples: 20, influence: 50 }, 'inner_dispute').data.morale === 0,
    '零值 士气 10 − 15：钳在 0（旧写法得 35，谷底直接被抬回三成半）');
assert(settle({ morale: 10, resources: 100, disciples: 20, influence: 50 }, 'hostile_attack').data.morale === 0,
    '零值 士气 10 − 20：钳在 0（旧写法得 30）');

// ============ 一致性：抽取与结算读的是同一个 morale ============
// 士气 0 时：抽取那侧（上一批修过的 generateSectEvent）按真实 0 算，
//   结算这侧也必须按 0 加减。两边读的不是同一个数，就是本病灶。
(function () {
    var w = makeWorld(0.5);
    w.SECT_INTERNAL['少林寺'] = { morale: 0, resources: 100, disciples: 20, influence: 50 };
    var ok = true;
    for (var i = 0; i < 400; i++) if (!w.generateSectEvent('少林寺')) ok = false;
    assert(ok, '一致性 士气 0：抽取照常出桩（0 没被当成 50，门开在 minMorale 0 那档）');
})();

// 抽取侧资格门用的是真实 0：inner_dispute 的 minMorale 是 20，士气 0 抽不到它
(function () {
    var w = makeWorld(0.0);
    w.SECT_INTERNAL['少林寺'] = { morale: 0, resources: 100, disciples: 20, influence: 50 };
    var hitInner = false;
    for (var i = 0; i < 400; i++) {
        var e = w.generateSectEvent('少林寺');
        if (e && e.id === 'inner_dispute') hitInner = true;
    }
    assert(!hitInner, '一致性 士气 0：minMorale 20 的内部纷争被门挡住（门读的是真 0，不是 50）');
})();

// 抽取侧灾难倾向：用已导出的纯权重口径量，而不是靠抽签反推
assert(sectEventWeight(poolDef('demon_beast_rampage'), 0) === 4, '一致性 士气 0 时灾难权重是 4（谷底重灾）');
assert(sectEventWeight(poolDef('demon_beast_rampage'), 30) === 2.5, '一致性 士气 30 时灾难权重是 2.5');
assert(sectEventWeight(poolDef('demon_beast_rampage'), 60) === 1, '一致性 士气 60 以上灾难权重回落到 1');
assert(sectEventWeight(poolDef('grand_festival'), 0) === 1, '一致性 非灾难事件权重恒为 1，与士气无关');

// 同一笔账，抽取按 0、结算也按 0：谷底连撞三场灾难，门派当夜就该趴在 0 上
(function () {
    var r = settle({ morale: 0, resources: 100, disciples: 20, influence: 50 }, 'spirit_vein_collapse');
    r = settle(r.data, 'demon_beast_rampage');
    r = settle(r.data, 'plague');
    assert(r.data.morale === 0, '一致性 谷底连撞三场灾难：士气停在 0（旧写法会停在 20/25 上下，谷底永远爬不出来）');
    assert(r.data.resources === 0, '一致性 谷底三场灾难：资源一并见底 0（旧写法的 `resources || 100` 会把它抬回 50）');
})();

// 抽取与结算同源的端到端证据：把抽取那颗骰子的落点扫一遍，
//   凡抽中「会动士气」的桩，结算都必须从真实 0 起算（涨不到 50 以上、也压不下去又弹回）。
(function () {
    var MORALE_IDS = {
        disciple_breakthrough: 15, elder_lecture: 5, inner_dispute: -15, treasure_found: 10,
        hostile_attack: -20, demon_beast_rampage: -30, plague: -25, spirit_vein_collapse: -35,
        holy_land_open: 20, grand_festival: 25, master_return: 30, sect_exam: 5,
        new_disciples: 5, ancestor_worship: 10, poor_harvest: -8
    };
    var drawn = {}, bad = [];
    for (var i = 1; i <= 95; i++) {
        var w = makeWorld(i / 100);
        w.SECT_INTERNAL['少林寺'] = { morale: 0, resources: 100, disciples: 20, influence: 50 };
        var e = w.generateSectEvent('少林寺');
        if (!e || !MORALE_IDS.hasOwnProperty(e.id)) continue;
        if (drawn.hasOwnProperty(e.id)) continue;
        drawn[e.id] = true;
        w.SECT_EVENTS_POOL[e.id].effect('少林寺');
        var want = Math.max(0, Math.min(100, 0 + MORALE_IDS[e.id]));
        var got = w.SECT_INTERNAL['少林寺'].morale;
        if (got !== want) bad.push(e.id + ' 得 ' + got + ' 期望 ' + want);
    }
    var n = Object.keys(drawn).length;
    assert(bad.length === 0,
        '一致性 抽到的 ' + n + ' 桩士气事件，结算后全部从真实 0 起算' + (bad.length ? ' —— 例外：' + bad.join('；') : ''));
    assert(n >= 8, '一致性 抽取扫了 95 个落点，命中 ' + n + ' 桩士气事件（覆盖度够，不是只撞一桩）');
})();

// ============ 钳位：Math.min / Math.max 边界没被破坏 ============
// 上限：士气 95 撞 +30 仍钳在 100（不是 125）
assert(settle({ morale: 95, resources: 100, disciples: 20, influence: 50 }, 'master_return').data.morale === 100,
    '钳位 士气 95 + 老祖出关 +30：钳在 100');
assert(settle({ morale: 90, resources: 100, disciples: 20, influence: 50 }, 'disciple_breakthrough').data.morale === 100,
    '钳位 士气 90 + 弟子突破 +15：钳在 100');
// 下限：士气 3 撞 −35 仍钳在 0（不是 -32）
assert(settle({ morale: 3, resources: 100, disciples: 20, influence: 50 }, 'spirit_vein_collapse').data.morale === 0,
    '钳位 士气 3 − 灵脉崩塌 35：钳在 0');
assert(settle({ morale: 3, resources: 100, disciples: 20, influence: 50 }, 'inner_dispute').data.morale === 0,
    '钳位 士气 3 − 内部纷争 15：钳在 0');
// 中间值不被钳位吃掉：加减都精确
assert(settle({ morale: 50, resources: 100, disciples: 20, influence: 50 }, 'disciple_breakthrough').data.morale === 65,
    '钳位 士气 50 + 15 = 65：中间值不受钳位影响');
assert(settle({ morale: 50, resources: 100, disciples: 20, influence: 50 }, 'hostile_attack').data.morale === 30,
    '钳位 士气 50 − 20 = 30：中间值不受钳位影响');
assert(settle({ morale: 50, resources: 100, disciples: 20, influence: 50 }, 'holy_land_open').data.morale === 70,
    '钳位 士气 50 + 20 = 70：中间值不受钳位影响');
assert(settle({ morale: 100, resources: 100, disciples: 20, influence: 50 }, 'master_return').data.morale === 100,
    '钳位 士气 100 + 30：仍 100，不溢出');
// 资源钳位
assert(settle({ morale: 50, resources: 10, disciples: 20, influence: 50 }, 'spirit_vein_collapse').data.resources === 0,
    '钳位 资源 10 − 60：钳在 0');
assert(settle({ morale: 50, resources: 0, disciples: 20, influence: 50 }, 'hostile_attack').data.resources === 0,
    '钳位 资源 0 − 30：钳在 0（旧写法的 `resources || 100` 会得 70）');
assert(settle({ morale: 50, resources: 0, disciples: 20, influence: 50 }, 'treasure_found').data.resources === 50,
    '钳位 资源 0 + 50 = 50（旧写法的 `resources || 100` 会得 150）');
assert(settle({ morale: 50, resources: 0, disciples: 20, influence: 50 }, 'grand_festival').data.resources === 30,
    '钳位 资源 0 + 庆典 30 = 30（旧写法得 130）');
assert(settle({ morale: 50, resources: 0, disciples: 20, influence: 50 }, 'poor_harvest').data.resources === 0,
    '钳位 资源 0 − 歉薄 25：钳在 0（旧写法得 75）');

// 影响力 / 弟子数：一开始我按「这两个只加不减」判它们不是活陷阱，
//   后经 grep 推翻 —— sects-system.js:2134 是 Math.max(0, … - cost.influence)、
//   sect-cities.js:280 是 Math.max(0, … - 5)，两个都能到 0。所以也是同一个坑，一并钉住。
assert(settle({ morale: 50, resources: 100, disciples: 20, influence: 0 }, 'master_return').data.influence === 20,
    '零值 影响力 0 + 老祖出关 +20 = 20（旧写法的 `influence || 50` 会得 70）');
assert(settle({ morale: 50, resources: 100, disciples: 20, influence: 0 }, 'friendly_visit').data.influence === 5,
    '零值 影响力 0 + 友派来访 +5 = 5（旧写法会得 55）');
assert(settle({ morale: 50, resources: 100, disciples: 20, influence: 0 }, 'arena_open').data.influence === 8,
    '零值 影响力 0 + 演武设擂 +8 = 8（旧写法会得 58）');
assert(settle({ morale: 50, resources: 100, disciples: 0, influence: 50 }, 'plague').data.disciples === 5,
    '零值 弟子 0 − 瘟疫 3：按 0 减、再被 Math.max(5,…) 收在 5（旧写法的 `disciples || 20` 会得 17，凭空添弟子）');
assert(settle({ morale: 50, resources: 100, disciples: 0, influence: 50 }, 'new_disciples').data.disciples === 2,
    '零值 弟子 0 + 新弟子入门 +2 = 2（旧写法会得 22）');
assert(settle({ morale: 50, resources: 100, disciples: 3, influence: 50 }, 'new_disciples').data.disciples === 5,
    '弟子 3 + 2 = 5：中间值不受钳位影响');
assert(settle({ morale: 50, resources: 100, disciples: 7, influence: 50 }, 'plague').data.disciples === 5,
    '弟子 7 − 3 = 4，被 Math.max(5,…) 收在 5：原钳位没被破坏');

// ============ helper 口径：null/缺失/非数才落默认值，0 不落 ============
// 口径与上一批在 generateSectEvent 里立的那套逐字一致：
//   null/undefined → 50；非有限数（NaN）→ 50；0 → 就是 0
(function () {
    function plus15After(raw) {
        var w = makeWorld();
        w.SECT_INTERNAL['少林寺'] = raw;
        w.SECT_EVENTS_POOL['disciple_breakthrough'].effect('少林寺');
        return w.SECT_INTERNAL['少林寺'].morale;
    }
    assert(plus15After({}) === 65, 'helper 缺失键：按 50 起算，+15 = 65');
    assert(plus15After({ morale: null }) === 65, 'helper morale=null：按 50 起算，+15 = 65');
    assert(plus15After({ morale: undefined }) === 65, 'helper morale=undefined：按 50 起算，+15 = 65');
    assert(plus15After({ morale: 0 }) === 15, 'helper morale=0：按 0 起算，+15 = 15（关键区分）');
    assert(plus15After({ morale: NaN }) === 65, 'helper morale=NaN：非数落回 50，+15 = 65');
    assert(plus15After({ morale: 'abc' }) === 65, 'helper morale=\'abc\'：非数落回 50，+15 = 65');
    assert(plus15After({ morale: '40' }) === 55, 'helper morale=\'40\'（字符串数字）：被 Number 化，+15 = 55');
    assert(plus15After({ morale: Infinity }) === 65, 'helper morale=Infinity：非有限数落回 50，+15 = 65');
    assert(plus15After({ morale: -Infinity }) === 65, 'helper morale=-Infinity：非有限数落回 50，+15 = 65');
})();

// 抽取侧同一套口径（上一批那处已修，本测试把两侧钉在一起防再分叉）
(function () {
    function gateOpen(raw) {
        var w = makeWorld(0.5);
        w.SECT_INTERNAL['少林寺'] = raw;
        return !!w.generateSectEvent('少林寺');
    }
    assert(gateOpen({ morale: 0 }) === true, 'helper 一致性 抽取侧：士气 0 照样抽得到（0 没被当成 50）');
    assert(gateOpen({}) === true, 'helper 一致性 抽取侧：缺失键落 50，抽得到');
    assert(gateOpen({ morale: NaN }) === true, 'helper 一致性 抽取侧：非数落回 50，抽得到');
})();

// ---- 抽取侧与 _moraleOf 的口径逐档比对（本文件最硬的一条）----
// 抽取侧那份是「同一套口径的第二份拷贝」：tests/wave142-fix-wiring-node.js Ⓒ10 逐字钉住它那两行，
//   Ⓔ0 还拿它当 .replace() 锚点去复现「改前」源码 —— 所以两边不是同一个函数调用，是两份字面。
//   纯字符串比对锁不住「两份字面以后会不会走偏」，这里改成量行为：
//   用专属池那道 maxMorale 上限门当探针（专属事件的资格是 readMorale <= maxMorale），
//   在一组门槛上取「抽不抽得到探针」的签名，分别喂给抽取侧和 _moraleOf 那一侧，
//   两边签名逐位相同 ⇒ 两边读到的 morale 是同一个数。
//   ⚠️ 门槛刻意避开 0：extract 侧那句 `morale <= (eev.maxMorale || 100)` 对 maxMorale=0 会回落成 100，
//   拿 0 当探针量的是那处 falsy 兜底、不是士气口径，会量歪。
//   探针的 minMorale 压到 -2000（`|| 0` 对它不生效），把**下限门彻底放开**，
//   只留上限门 maxMorale 单独约束 —— 签名只反映「读到的 morale 有多大」，不被另一道门串味。
(function () {
    var GATES = [-1000, -999, -500, -1, 0.5, 1, 19, 20, 21, 49, 50, 51, 99, 100, 101];
    var GATE_FLOOR = -2000; // 探针下限门，压到谁都拦不住的位置（`-2000 || 0` 仍是 -2000）
    // 逐门槛取签名：探针权重恒 1、池总权 30 上下，骰子递进扫满 [0,1) 保证探针那段一定走到
    function signatureExtraction(raw) {
        var it = (arguments.length === 0)
            ? { resources: 100, disciples: 20, influence: 50 }
            : { morale: raw, resources: 100, disciples: 20, influence: 50 };
        var out = [];
        for (var g = 0; g < GATES.length; g++) {
            // 一个门槛一个沙箱就够：generateSectEvent 每次都从 Math.random 现取骰子，
            // 而 Math 是我传进去的那个对象引用 —— 换掉 random 就能接着扫下一格，
            // 不用为 400 次掷骰各建一个 vm（那要 40 秒）。
            var env = makeWorld();
            env.SECT_INTERNAL['少林寺'] = it;
            env.SECT_EXCLUSIVE_EVENTS = {
                '少林寺': {
                    probe: {
                        type: 'bonus', icon: 'p', name: '探针',
                        desc: function () { return 'p'; },
                        effect: function () { return 'p'; },
                        minMorale: GATE_FLOOR, maxMorale: GATES[g]
                    }
                }
            };
            // 骰子递进：一格一格扫过整个 [0,1)，保证探针那段权重一定被走到
            var seen = false;
            for (var i = 1; i <= 400 && !seen; i++) {
                env.Math.random = (function (v) { return function () { return v; }; }(i / 400));
                var e = env.generateSectEvent('少林寺');
                if (e && e.id === 'probe') seen = true;
            }
            out.push(seen ? 1 : 0);
        }
        return out.join('');
    }
    function signatureHelper(raw) {
        var m = (raw === undefined) ? 50 : (raw == null ? 50 : Number(raw));
        if (!isFinite(m)) m = 50;
        var out = [];
        for (var g = 0; g < GATES.length; g++) out.push((m >= GATE_FLOOR && m <= GATES[g]) ? 1 : 0);
        return out.join('');
    }
    var CASES = [
        { label: '士气 0', v: 0 },
        { label: '士气 1', v: 1 },
        { label: '士气 20', v: 20 },
        { label: '士气 50', v: 50 },
        { label: '士气 99', v: 99 },
        { label: '士气 100', v: 100 },
        { label: '士气 -999', v: -999 },
        { label: '士气 \'40\'（字符串数字）', v: '40' },
        { label: '士气 NaN', v: NaN },
        { label: '士气 Infinity', v: Infinity },
        { label: '士气 \'abc\'', v: 'abc' },
        { label: '士气 null', v: null },
        { label: ' morale 键为 undefined', v: undefined },
        { label: 'morale 键整个不存在', missing: true }
    ];
    var mismatch = [];
    CASES.forEach(function (c) {
        var a = c.missing ? signatureExtraction() : signatureExtraction(c.v);
        var b = c.missing ? signatureHelper(undefined) : signatureHelper(c.v);
        if (a !== b) mismatch.push(c.label + ' 抽取侧 ' + a + ' ≠ 结算侧 ' + b);
    });
    assert(mismatch.length === 0,
        '口径一致 抽取侧与结算侧逐档读出同一个 morale（14 组输入 × 15 道门槛）'
        + (mismatch.length ? ' —— 不一致：' + mismatch.join('；') : ''));
    // 顺带证明门槛不是摆设：士气 0 与士气 50 的签名必须真的不同，否则上面是恒真的空转
    assert(signatureExtraction(0) !== signatureExtraction(50),
        '口径一致 探针有分辨力：士气 0 与士气 50 的门槛签名不同（不是恒真）');
    assert(signatureExtraction(0) === signatureHelper(0),
        '口径一致 士气 0：抽取侧签名与结算侧签名逐位相同');
})();

// 不存在的门派：结算不写账、不炸（旧写法的 || 50 也返回 50，这里一并守住）
(function () {
    var w = makeWorld();
    w.SECT_INTERNAL = {};
    var t = String(w.SECT_EVENTS_POOL['inner_dispute'].effect('不存在的门'));
    assert(typeof t === 'string' && t.length > 0, 'helper 门派不存在：结算照返回话术，不抛不写账');
})();

// ============ 结构门：旧写法不得回流 ============
var src = loadScript('js/sects/sect-events.js');
var codeOnly = src.split('\n').filter(function (l) {
    var s = l.trim();
    return s && s.charAt(0) !== '/' && s.slice(-2) !== '*/' && s.indexOf('//') < 0;
}).join('\n');
assert(!/data\.morale\s*\|\|/.test(codeOnly), '结构 本文件代码里已无 `data.morale ||` 旧写法');
assert(!/data\.resources\s*\|\|/.test(codeOnly), '结构 本文件代码里已无 `data.resources ||` 旧写法');
assert(!/data\.influence\s*\|\|/.test(codeOnly), '结构 本文件代码里已无 `data.influence ||` 旧写法');
assert(!/data\.disciples\s*\|\|/.test(codeOnly), '结构 本文件代码里已无 `data.disciples ||` 旧写法');
// 抽取侧那份「第二份拷贝」必须在（wave142 Ⓒ10 逐字钉它、Ⓔ0 拿它当 replace 锚点）；
// 口径是否一致不靠这段文字，靠上面那 14 组 × 15 门槛的行为比对。
assert(/var morale = \(data\.morale == null\) \? 50 : Number\(data\.morale\)/.test(codeOnly)
    && /if \(!isFinite\(morale\)\) morale = 50;/.test(codeOnly),
    '结构 generateSectEvent 仍持有那段 `== null` 口径（与 _moraleOf 同一套，改一处必改另一处）');
assert((codeOnly.match(/_moraleOf\(/g) || []).length === 16, '结构 _moraleOf 共 16 处：定义 1 + 结算 15');
assert((codeOnly.match(/_resourcesOf\(/g) || []).length === 7, '结构 _resourcesOf 共 7 处：定义 1 + 资源 6');
assert((codeOnly.match(/_influenceOf\(/g) || []).length === 4, '结构 _influenceOf 共 4 处：定义 1 + 影响力 3');
assert((codeOnly.match(/_disciplesOf\(/g) || []).length === 3, '结构 _disciplesOf 共 3 处：定义 1 + 弟子 2');

console.log('---');
console.log('legacy-morale-zero: ' + passed + ' 通过, ' + failed + ' 失败');
process.exit(failed ? 1 : 0);