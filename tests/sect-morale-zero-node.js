/**
 * sect-morale-zero-node.js — 门派士气「零值被当默认值」在**危机子系统**的回归门
 *（事 1：morale 同族残留 6 处，实修 7 处）
 *
 * 背景：`js/sects/sect-events.js` 上一批已把通用事件池的士气 0 读取统一
 *   （`legacy-morale-zero-node.js` 钉着抽取侧 vs 结算侧 14 组输入 × 15 道门槛）。
 *   但**危机子系统**另有 6 处同族病灶，本测试把危机这一族钉死。
 *
 * 为什么危机这一族值得单独立一份门（先判归属，再判改不改）：
 *   危机引擎 `sect-crisis-engine.js:403-412` 的日结只推 `ds.sectId`——
 *   「只推玩家所在门派；别门的天翻地覆走外交账与传闻」；
 *   抉择按钮与专属事件面板都只挂在 `showSectInnerView` 上，
 *   而那道门是 `ds.sectId === sectName`（`sect-visit.js:461`）。
 *   ⇒ 这 6 处读写的**全部是玩家自己门派那本账**，不是 NPC 暗账，一个都不能推给「敌人侧不用改」。
 *
 * 修法口径（与 sect-events.js 的 _moraleOf 逐字一致）：
 *   null / undefined / 非有限数 → 50；0 → 就是 0。
 *
 * 运行：node tests/sect-morale-zero-node.js
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
function src(rel) { return loadScript(rel); }

// ---------- 沙箱 ----------
// 每个沙箱是独立 context，闭包锁在**它自己那个 context** 里——
// 结算必须「建世界 → 改账 → 用同一个世界里的函数结算」，借别的世界的池子会测出假绿。
function baseWindow(extra) {
    var msgs = [];
    var w = {
        console: { log: function () {}, warn: function () {}, error: function () {} },
        JSON: JSON, Object: Object, Array: Array, String: String, Boolean: Boolean,
        Number: Number, isFinite: isFinite, Math: Math,
        // 玩家所在门派（危机日结唯一的入口参数）
        discipleState: { isInSect: true, sectId: '少林寺', rank: 1, contribution: 0, points: 0 },
        SECT_INTERNAL: { '少林寺': { morale: 50, resources: 100, disciples: 20, influence: 50 } },
        SECT_DIPLOMACY_STATE: {},
        getAbsoluteDay: function () { return 30; },
        timeSystem: null,          // 迫使 wireDaily 走 load 兜底，不订阅（沙箱里没有真时钟）
        StateRegistry: null,       // 同上：不落档
        RewardService: null,
        showMessage: function (m) { msgs.push(String(m)); },
        __msgs: msgs
    };
    w.window = w;
    if (extra) Object.keys(extra).forEach(function (k) { w[k] = extra[k]; });
    return w;
}
function vmRun(w, rel) { vm.runInContext(src(rel), vm.createContext(w), { filename: rel }); }

// 危机池世界：加载 crisis-events（数据与因果门），并把引擎的 applyGains 接上
function makeCrisisPoolWorld(internal) {
    var w = baseWindow();
    if (internal) w.SECT_INTERNAL['少林寺'] = internal;
    vmRun(w, 'js/sects/sect-crisis-events.js');
    var tally = {};
    // 引擎 applyGains 的真实结算口径（照抄 sect-crisis-engine.js 里那一段，
    // 引擎本体要 StateRegistry/时钟，沙箱里跑不起来；这一段是纯账本，逐字照抄）
    w.__applyGains = function (gains) {
        var msgs = [];
        var internal2 = w.SECT_INTERNAL['少林寺'];
        if (gains.morale && internal2) {
            var _moraleNow = (internal2.morale == null) ? 50 : Number(internal2.morale);
            if (!isFinite(_moraleNow)) _moraleNow = 50;
            internal2.morale = Math.max(0, Math.min(100, _moraleNow + gains.morale));
            msgs.push('士气' + (gains.morale > 0 ? '+' : '') + gains.morale);
        }
        tally.calls++;
        return msgs.join('｜');
    };
    w.__tally = tally;
    return w;
}
// 因果门探针：直接问某桩事件的 causality，c.internal 就是玩家那本账
// ⚠️ ctx 的三处真源各在其位：**fears 在 profile.fears**（_fears 读的是 c.profile.fears），
//    **disciples 在 strength.disciples**（不在 internal 里——人数门读的是 sectStrength 的产物）。
//    早先按顶层 fears / internal.disciples 覆盖，两条断言因此量到的是别的东西。
function causality(w, id, c) {
    var ev = w.SECT_CRISIS_EVENTS[id];
    if (!ev || typeof ev.causality !== 'function') return null;
    var ctx = {
        sectName: '少林寺',
        profile: { livelihood: [], fears: ['邪祟', '反噬'] },
        internal: w.SECT_INTERNAL['少林寺'],
        diplo: { foe: null, friend: null },
        strength: { power: 40, influence: 50, disciples: 30, total: 55 },
        scars: {}, day: 30, season: 'spring', month: 3
    };
    Object.keys(c || {}).forEach(function (k) { ctx[k] = c[k]; });
    return ev.causality(ctx);
}

// =====================================================================
// 断言组 ①：4 处因果门 —— 士气 0 不被当 50（每处两个方向：门该开 / 该关）
// =====================================================================

// —— 1. evil_haunt（邪祟夜惊）：`eerie && morale < 60`
// ★★ 先说清这一处的真实性质，别把它当成行为修复 ★★
// 逐档实测（带齐 `== null → 50` 默认值后）旧读法 `m||50` 与新读法 `_moraleVal(m)` 在这道门上：
//   morale=0 → 旧读得 50，`50 < 60` **真** → 开；新读得 0，`0 < 60` 也真 → 开。**结果完全一样。**
//   只有 `morale='abc'` 这类非数字符串两者才分道（旧 false / 新 true）。
// 也就是说：**这一处改的是口径一致性，不是玩家看得见的行为**——
// 它的 weight 是 `1 + death*0.8`，压根不含 morale，所以连权重都不受影响。
// 仍然要改的理由只有一条：留着 `|| 50` 就是 sect-events.js:335 警告的**不对称**
// （同一族读口两套写法），且这道门一旦把阈值从 60 挪到 50 以下，旧写法立刻变成真病灶。
// 下面两条断言把「它在 morale 0 上是同解」这件事钉住，免得后来人把它当成修复来夸大。
(function () {
    var w = makeCrisisPoolWorld({ morale: 0, resources: 100, disciples: 20, influence: 50 });
    var v = causality(w, 'evil_haunt', { fears: ['邪祟'] });
    assert(v && v.ok === true,
        '因果门 1/4 evil_haunt 士气 0 + 命门怕邪祟：开（★注意 0||50 得 50、50<60 也开，'
        + '这一处旧新同解，是口径收口不是行为修复★）');
    // 「同解」是可验证的事实，不是托辞：把旧读法摆出来对一遍
    var oldRead = (0 || 50), newRead = 0;
    assert((oldRead < 60) === (newRead < 60),
        '因果门 evil_haunt 口径收口的实质：morale 0 时旧读法(50)与新读法(0)在 `<60` 这道门上同解'
        + '（旧=' + (oldRead < 60) + ' 新=' + (newRead < 60) + '）——所以此处无行为差异可夸');
    // 对照：士气 65 时门确实关着（证明门本身是活的，不是恒真）
    var w2 = makeCrisisPoolWorld({ morale: 65, resources: 100, disciples: 20, influence: 50 });
    var v2 = causality(w2, 'evil_haunt', { fears: ['邪祟'] });
    assert(v2 && v2.ok === false, '因果门 evil_haunt 士气 65：门关（证明这道门真读士气，不是恒真）');
    // 对照：不怕邪祟 + 无伤亡 → 不该开（fears 要覆盖 profile.fears，不是顶层 fears）
    var w3 = makeCrisisPoolWorld({ morale: 0, resources: 100, disciples: 20, influence: 50 });
    var v3 = causality(w3, 'evil_haunt', { profile: { livelihood: [], fears: ['丹道'] } });
    assert(v3 && v3.ok === false, '因果门 evil_haunt 不怕邪祟 + 无伤亡：不该开');
})();

// —— 2. elder_leave（长老请辞）：`morale >= 48` 关
// 旧写法 → 50 >= 48 真 → **谷底永远开不了门**（该开不开）
(function () {
    var w = makeCrisisPoolWorld({ morale: 0, resources: 100, disciples: 20, influence: 50 });
    var v = causality(w, 'elder_leave', {});
    assert(v && v.ok === true,
        '因果门 2/4 elder_leave 士气 0：**该开**（旧写法 0||50 得 50，50>=48 真 → 谷底永不出内乱）');
    assert(v && typeof v.weight === 'number' && v.weight > 4,
        '因果门 elder_leave 士气 0：权重应回到 (50-0)/10 = 5 上下（旧写法被压成 0）');
    var w2 = makeCrisisPoolWorld({ morale: 60, resources: 100, disciples: 20, influence: 50 });
    var v2 = causality(w2, 'elder_leave', {});
    assert(v2 && v2.ok === false, '因果门 elder_leave 士气 60：不该开（探针有分辨力）');
})();

// —— 3. elder_feud（堂口积怨）：`morale >= 55` 关，权重 1+(55-morale)/20
// 旧写法：门仍开（50<55），但权重 1+(55-50)/20 = 1.25，谷底内乱被降权到 1/2.2
(function () {
    var w = makeCrisisPoolWorld({ morale: 0, resources: 100, disciples: 30, influence: 50 });
    var v = causality(w, 'elder_feud', {});
    assert(v && v.ok === true, '因果门 3/4 elder_feud 士气 0：开（disciples 30 >= 22 过了人数门）');
    assert(v && Math.abs(v.weight - 3.75) < 1e-9,
        '因果门 elder_feud 士气 0：权重 = 1+(55-0)/20 = 3.75（旧写法 0||50 → 只有 1.25，谷底内乱被降权）');
    var w2 = makeCrisisPoolWorld({ morale: 60, resources: 100, disciples: 30, influence: 50 });
    var v2 = causality(w2, 'elder_feud', {});
    assert(v2 && v2.ok === false, '因果门 elder_feud 士气 60：不该开（探针有分辨力）');
    // 人数门仍照旧：disciples 少就不开（别把别处的门顺手改了）。
    // disciples 在 ctx.strength 里（人数门读 sectStrength 的产物），不在 internal 里。
    var w3 = makeCrisisPoolWorld({ morale: 0, resources: 100, disciples: 10, influence: 50 });
    var v3 = causality(w3, 'elder_feud', { strength: { power: 40, influence: 50, disciples: 10, total: 55 } });
    assert(v3 && v3.ok === false, '因果门 elder_feud disciples 10：人数门仍拦（士气 0 不越过人数门）');
})();

// —— 4. exam_crib（大考夹带）：`morale < 42` 关
// 旧写法 → 50 < 42 假 → **谷底反倒开出大考**（该不开偏开）
(function () {
    var w = makeCrisisPoolWorld({ morale: 0, resources: 100, disciples: 30, influence: 50 });
    var v = causality(w, 'exam_crib', {});
    assert(v && v.ok === false,
        '因果门 4/4 exam_crib 士气 0：**不该开**（旧写法 0||50 得 50，50<42 假 → 谷底反倒开大考，与注释「morale 不塌才谈得上大考」相反）');
    var w2 = makeCrisisPoolWorld({ morale: 55, resources: 100, disciples: 30, influence: 50 });
    var v2 = causality(w2, 'exam_crib', {});
    assert(v2 && v2.ok === true, '因果门 exam_crib 士气 55：开（探针有分辨力）');
    assert(v2 && Math.abs(v2.weight - (1 + (55 - 40) / 40)) < 1e-9,
        '因果门 exam_crib 权重也读真士气 55（不是 50；同一函数的兄弟裸读一并收了）');
})();

// =====================================================================
// 断言组 ②：结算侧 3 处 —— 谷底不能反涨 / 不能一键半满
// =====================================================================

// =====================================================================
// 断言组 ②：结算侧 —— 危机抉择 applyGains
// =====================================================================
// 这一段是**引擎真源码**里 applyGains 的士气那一行切出来的，锚点写死，
// 改代码就会切不出来 → 立刻红（不是靠正则，是靠「切得出来 + 切出来的行为对」）
(function () {
    var engine = src('js/sects/sect-crisis-engine.js');
    var i0 = engine.indexOf('function applyGains(sectName, gains)');
    var i1 = engine.indexOf('// DES-48', i0 > 0 ? i0 : 0);
    assert(i0 > 0, '结构 crisis-engine 能定位到 applyGains 定义');
    assert(i1 > i0, '结构 crisis-engine 能切出 applyGains 的账本段（切不出来就没有行为证据）');

    // 从 `var ownSect` 切到 `if (gains.influence` —— 只要 applyGains 的账本段。
    // ⚠️ 两处起刀口的坑，都是实测踩出来的：
    //   ① 拿 `var _moraleNow` 当起点（那是新写法独有的）：改回旧写法就切不出来，
    //      8 条行为断言被 `if` 跳过只剩结构断言报红 —— 行为证据在改回那刻全成死代码。
    //   ② 拿 `var msgs = []` 当起点：那一行在**函数体里重新声明**了 msgs，
    //      把传进去的 msgs 形参遮住 —— 账算对了（morale 落到 7），
    //      但回执断言量到空串，白红一条。
    //   `var ownSect = ds && …` 是原文、我没动过，改前改后都在，且在 `var msgs` 之后、
    //   `var _moraleNow` 之前，两个坑都躲开。切片从 ownSect 起 ⇒ `var ds` 在外面，要作形参喂进去；
    //   `var internal = _internal(sectName)` 在切片内 ⇒ 备好 _internal。
    //   不给 contribution/points 时那两支被短路，不碰账。
    var m0 = engine.indexOf('var ownSect = ds &&', i0);
    var m1 = engine.indexOf('if (gains.influence', m0);
    assert(m0 > i0 && m1 > m0, '结构 士气结算那一支切得出来（改前改后都切得出，才量得到行为）');
    if (m0 > i0 && m1 > m0) {
        var body = engine.slice(m0, m1);
        assert(!/var\s+msgs\s*=/.test(body),
            '结构 这段切片里没有 msgs 的重新声明（否则回执 push 进了函数自己的局部数组）');
        var run = new Function('window', 'sectName', 'ds', 'internal', 'gains', 'msgs', body);
        var fakeDs = { isInSect: true, sectId: '少林寺', contribution: 0, points: 0 };
        var fakeWindow = { discipleState: fakeDs };
        function settle(internal, gains) {
            var msgs = [];
            run(fakeWindow, '少林寺', fakeDs, internal, gains, msgs);
            return { morale: internal.morale, msg: msgs.join('｜') };
        }
        // 谷底 + 加：应从 0 涨到 +7，不是「一键半满」57
        var a = settle({ morale: 0 }, { morale: 7 });
        assert(a.morale === 7, '结算 crisis applyGains 士气 0 +7 = 7（旧写法 0||50 → 57，一键半满）');
        // 谷底 + 减：应钳在 0，不是「谷底反涨」40
        var b = settle({ morale: 0 }, { morale: -10 });
        assert(b.morale === 0, '结算 crisis applyGains 士气 0 −10 = 0（旧写法 → 40，谷底反涨）');
        // 缺键 / null / 非数：仍落 50 起算（默认值那半边不能一起改掉）
        assert(settle({}, { morale: 7 }).morale === 57, '结算 crisis applyGains 缺键：按 50 起算 +7 = 57');
        assert(settle({ morale: null }, { morale: 7 }).morale === 57, '结算 crisis applyGains morale=null：按 50 起算 +7 = 57');
        assert(settle({ morale: NaN }, { morale: 7 }).morale === 57, '结算 crisis applyGains morale=NaN：非数落回 50');
        assert(settle({ morale: 'abc' }, { morale: 7 }).morale === 57, '结算 crisis applyGains morale=\'abc\'：非数落回 50');
        // 中间值不被钳位吃掉
        assert(settle({ morale: 50 }, { morale: 7 }).morale === 57, '结算 crisis applyGains 士气 50 +7 = 57：中间值精确');
        assert(settle({ morale: 98 }, { morale: 7 }).morale === 100, '结算 crisis applyGains 士气 98 +7：钳在 100');
        assert(settle({ morale: 3 }, { morale: -10 }).morale === 0, '结算 crisis applyGains 士气 3 −10：钳在 0');
        // 回执不受影响
        assert(settle({ morale: 0 }, { morale: 7 }).msg === '士气+7', '结算 crisis applyGains 回执仍印「士气+7」');
    }
})();

// =====================================================================
// 断言组 ③：专属事件 _morale 的逐档行为比对（真跑 sect-exclusive-events.js）
// =====================================================================
(function () {
    var w = baseWindow();
    vmRun(w, 'js/sects/sect-exclusive-events.js');
    // 专属事件表在册（少林寺确有两条），直接调它们的 effect 走 _morale
    var pool = w.SECT_EXCLUSIVE_EVENTS && w.SECT_EXCLUSIVE_EVENTS['少林寺'];
    assert(pool && Object.keys(pool).length >= 2,
        '专属事件 少林寺 在册 ' + (pool ? Object.keys(pool).length : 0) + ' 条（effect 会调 _morale）');

    // shaolin_copysutra 的 effect 是 `_contrib(s,20); _morale(s, 5);` —— 用它当 +5 的探针。
    // ⚠️ raw 是**士气那一个值**本身（不是含 morale 键的账本对象）：
    //    早先写成 `plusFive({ morale: '40' })`，于是账上 morale 是个对象，
    //    Number({...}) → NaN → 落回 50 → 得 55。缺键/null/NaN 那三条**碰巧**也走 50 就过了，
    //    只有 '40' 这条露出来。传值才量得到字符串数字这一格。
    function plusFive(raw) {
        var ww = baseWindow();
        var ledger = { resources: 100, disciples: 20, influence: 50 };
        ledger.morale = raw;
        ww.SECT_INTERNAL['少林寺'] = ledger;
        vmRun(ww, 'js/sects/sect-exclusive-events.js');
        var p = ww.SECT_EXCLUSIVE_EVENTS['少林寺']['shaolin_copysutra'];
        if (!p) return 'no probe';
        p.effect('少林寺');
        return ww.SECT_INTERNAL['少林寺'].morale;
    }
    assert(plusFive(0) === 5,
        '专属事件 _morale 士气 0 +5 = 5（旧写法 0||50 → 55，一键半满）');
    assert(plusFive(10) === 15, '专属事件 _morale 士气 10 +5 = 15：中间值精确');
    assert(plusFive(98) === 100, '专属事件 _morale 士气 98 +5：钳在 100');
    assert(plusFive(undefined) === 55, '专属事件 _morale 缺键：按 50 起算 +5 = 55（默认值那半边留着）');
    assert(plusFive(null) === 55, '专属事件 _morale morale=null：按 50 起算 +5 = 55');
    assert(plusFive(NaN) === 55, '专属事件 _morale morale=NaN：非数落回 50');
    assert(plusFive('40') === 45, '专属事件 _morale morale=\'40\'：字符串数字被 Number 化，+5 = 45');
    assert(plusFive('abc') === 55, '专属事件 _morale morale=\'abc\'：非数落回 50，+5 = 55');
})();

// =====================================================================
// 断言组 ④：★别把「该保留 50 的」一起改了★
// =====================================================================
(function () {
    // ④a. 敌人/NPC 侧的 50 兜底必须原样保留。
    // 本仓的 NPC 侧兜底范例：sects-system.js:1197 `npc.relationship?.affection || 50`
    //   —— NPC 好感是**关系值**，缺键落 50 是设计默认，且它没有 0 下限语义。
    // 这里断言那行**仍在**，防止有人把「统一 morale 口径」的手伸到 NPC 侧。
    var ss = src('js/sects/sects-system.js');
    assert(/npc\.relationship\?\.affection\s*\|\|\s*50/.test(ss),
        '保留 敌人/NPC 侧：sects-system.js 的 `npc.relationship?.affection || 50` 原样在位（NPC 好感缺键落 50 是设计默认，不归本族）');

    // ④b. sect-events.js 的 15 处结算读口 `_moraleOf(` 一个都不能少
    //   （上一批修的，本次动 crisis 时不能把它碰坏）
    var se = src('js/sects/sect-events.js');
    var nMorale = (se.match(/_moraleOf\(/g) || []).length;
    assert(nMorale === 16, '保留 通用事件池 `_moraleOf(` 共 16 处（定义 1 + 结算 15），实测 ' + nMorale);

    // ④c. 抽取侧那段「第二份拷贝」必须还在（wave142 Ⓒ10 逐字钉它）
    var seCode = se.split('\n').filter(function (l) {
        var s = l.trim();
        return s && s.charAt(0) !== '/' && s.slice(-2) !== '*/' && s.indexOf('//') < 0;
    }).join('\n');
    assert(/var morale = \(data\.morale == null\) \? 50 : Number\(data\.morale\)/.test(seCode)
        && /if \(!isFinite\(morale\)\) morale = 50;/.test(seCode),
        '保留 通用事件池抽取侧的 `== null` 口径仍在位');

    // ④d. crisis 里 resources 用的是 `|| 0`（正确的「资源 0 就是 0」口径），别被改成 50
    var ce = src('js/sects/sect-crisis-events.js');
    var ceCode = ce.split('\n').filter(function (l) {
        var s = l.trim();
        return s && s.charAt(0) !== '/' && s.slice(-2) !== '*/' && s.indexOf('//') < 0;
    }).join('\n');
    assert(/internal\.resources\s*\|\|\s*0/.test(ceCode),
        '保留 危机池 resources 仍是 `|| 0`（资源 0 就是 0 的正确口径，别被改成 50）');
})();

// =====================================================================
// 断言组 ⑤：结构门 —— 旧写法不得回流（拿代码行比，注释里出现不算）
// =====================================================================
(function () {
    function codeOnly(s) {
        return s.split('\n').filter(function (l) {
            var t = l.trim();
            return t && t.charAt(0) !== '/' && t.slice(-2) !== '*/' && t.indexOf('//') < 0;
        }).join('\n');
    }
    var ceCode = codeOnly(src('js/sects/sect-crisis-events.js'));
    var exCode = codeOnly(src('js/sects/sect-exclusive-events.js'));
    var enCode = codeOnly(src('js/sects/sect-crisis-engine.js'));

    assert(!/internal\.morale\s*\|\|/.test(ceCode),
        '结构 危机事件池代码里已无 `internal.morale ||` 旧写法（4 处因果门全走 _moraleVal）');
    assert(!/c\.internal\.morale\s*\|\|/.test(ceCode),
        '结构 危机事件池代码里已无 `c.internal.morale ||` 旧写法');
    assert(!/d\.morale\s*\|\|/.test(exCode),
        '结构 专属事件代码里已无 `d.morale ||` 旧写法');
    assert(!/internal\.morale\s*\|\|/.test(enCode),
        '结构 危机引擎代码里已无 `internal.morale ||` 旧写法（applyGains 结算侧）');

    // 本批立的读口必须真的被用上（防止「建了读口但没换过去」这种半修）。
    // 计数：定义 1 + 4 处因果门，但 exam_crib 用了两次（`:467` 的门 + `:468` 的权重兄弟）= 共 6
    var nVal = (ceCode.match(/_moraleVal\(/g) || []).length;
    assert(nVal === 6,
        '结构 危机事件池 `_moraleVal(` 共 6 处：定义 1 + 4 处因果门（exam_crib 占 2：门 + 权重兄弟），实测 ' + nVal);
    var nValEx = (exCode.match(/_moraleVal\(/g) || []).length;
    assert(nValEx === 2,
        '结构 专属事件 `_moraleVal(` 共 2 处：定义 1 + _morale 调用 1，实测 ' + nValEx);
})();

// =====================================================================
// 断言组 ⑥：口径一致 —— 同一组输入，危机因果门读到的 morale 必须与通用池一致
//（两个池子都是玩家那本账，读法却分成了两处实现；这组把两边钉在一起防再分叉）
// =====================================================================
(function () {
    var GATES = [0, 20, 41, 42, 47, 48, 54, 55, 59, 60, 100];
    // 危机侧：exam_crib 的门是 `morale < 42` 关 ⇒ 读到的 morale 落在 [42,∞) 就开
    function crisisSees(morale) {
        var w = makeCrisisPoolWorld({ morale: morale, resources: 100, disciples: 30, influence: 50 });
        var v = causality(w, 'exam_crib', {});
        return v && v.ok ? 1 : 0;
    }
    // 口径参考：null/undefined/非数 → 50，0 就是 0
    function refSees(morale) {
        var m = (morale == null) ? 50 : Number(morale);
        if (!isFinite(m)) m = 50;
        return (m >= 42) ? 1 : 0;
    }
    var mismatch = [];
    var cases = [{ l: '0', v: 0 }, { l: '20', v: 20 }, { l: '41', v: 41 }, { l: '42', v: 42 },
        { l: '47', v: 47 }, { l: '48', v: 48 }, { l: '54', v: 54 }, { l: '55', v: 55 },
        { l: '59', v: 59 }, { l: '60', v: 60 }, { l: '100', v: 100 },
        { l: 'null', v: null }, { l: 'NaN', v: NaN }, { l: '\'abc\'', v: 'abc' }, { l: '\'40\'', v: '40' }];
    cases.forEach(function (c) {
        var a = crisisSees(c.v), b = refSees(c.v);
        if (a !== b) mismatch.push(c.l + ' 危机侧 ' + a + ' ≠ 口径 ' + b);
    });
    assert(mismatch.length === 0,
        '口径一致 危机因果门与「零值不算没有」口径逐档读出同一个 morale（15 组输入）'
        + (mismatch.length ? ' —— 不一致：' + mismatch.join('；') : ''));
    // 分辨力：0 与 50 必须分得开，否则上面是恒真的空转
    assert(crisisSees(0) !== crisisSees(50),
        '口径一致 探针有分辨力：士气 0 与士气 50 的门结果不同（不是恒真）');
    assert(crisisSees(0) === 0 && crisisSees(50) === 1,
        '口径一致 士气 0 关、士气 50 开（关键区分：旧写法两个都是「开」）');
})();

// =====================================================================
// 断言组 ⑦：存活性 —— 三个文件都还能原样加载，且危机引擎挂上了 window
// =====================================================================
(function () {
    var w = baseWindow();
    var failedLoad = null;
    try { vmRun(w, 'js/sects/sect-crisis-events.js'); } catch (e) { failedLoad = 'events:' + e.message; }
    try { vmRun(w, 'js/sects/sect-exclusive-events.js'); } catch (e) { failedLoad = (failedLoad || '') + '|exclusive:' + e.message; }
    assert(!failedLoad, '存活性 危机事件池 + 专属事件池原样加载无异常' + (failedLoad ? ' —— ' + failedLoad : ''));
    assert(!!(w.SECT_CRISIS_EVENTS && Object.keys(w.SECT_CRISIS_EVENTS).length >= 20),
        '存活性 SECT_CRISIS_EVENTS 在册 ' + (w.SECT_CRISIS_EVENTS ? Object.keys(w.SECT_CRISIS_EVENTS).length : 0) + ' 条');
    assert(!!(w.SECT_EXCLUSIVE_EVENTS && Object.keys(w.SECT_EXCLUSIVE_EVENTS).length >= 8),
        '存活性 SECT_EXCLUSIVE_EVENTS 在册 ' + (w.SECT_EXCLUSIVE_EVENTS ? Object.keys(w.SECT_EXCLUSIVE_EVENTS).length : 0) + ' 门');
    assert(typeof w.XianXia === 'object' || typeof w.XianXia === 'undefined',
        '存活性 加载过程没把 window 弄坏');
})();

console.log('---');
console.log('sect-morale-zero: ' + passed + ' 通过, ' + failed + ' 失败');
process.exit(failed ? 1 : 0);