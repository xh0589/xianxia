// ==================== legacy-choice-memory-node.js ====================
// 「抉择记忆」断言验收：js/quest/choice-memory.js（表）+ js/quest/qi-arc1.js（序幕守阵眼那笔）
//
// 覆盖五组：
//   A 完整性   玩家可达的每个 choiceId 都在表里（探针法实测差集为空）
//   B 新键可达 本轮补的 15 键 + qi_yu_guard 都能被真正的 recordChoice 传到
//   C stat合法 每个带 stat 的键，stat 都在 playerChoices.stats 的 8 个白名单内
//   D 端到端   recordChoice → stats 有值 → checkEndingFromChoices 产出 _endingModifiers
//   E 守阵眼   qi-arc1.js settleQiBattle：胜=记一笔 / 败=不记 / 重入不重记
//   F 硬约束   本轮所涉文件零掷骰、测试自身零空 catch
//
// 探针法沿用 .scratch/fix-choice-progress/_verify-01.js：
//   表从运行时 window.IMPORTANT_CHOICES 读（不是正则解析源码），
//   按 仙侠.html 真实 script 顺序 eval 全量 js，把 window.recordChoice 包成探针收集实际传出的 id，
//   再与表求差集。装载台内联自 .scratch/docA-core-progress/_measure-core.cjs，测试不依赖 .scratch。
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');

let passed = 0; const failures = []; const notes = [];
function ok(cond, msg) { if (cond) { passed++; } else { failures.push(msg); console.log('  ✗ ' + msg); } }
function note(s) { notes.push(String(s)); console.log('  · ' + s); }
function read(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// 本轮 choice-memory.js 补录的 15 键（5 族 × 3）
const NEW_KEYS = [
    'qi_h4_life_farm', 'qi_h4_life_trade', 'qi_h4_life_teach',
    'qi_h4_peddler_news', 'qi_h4_peddler_sword', 'qi_h4_peddler_tea',
    'qi_h5_fight_leave', 'qi_h5_fight_part', 'qi_h5_fight_watch',
    'qi_h5_teller_fix', 'qi_h5_teller_go', 'qi_h5_teller_tip',
    'qi_knock2b_burn', 'qi_knock2b_look', 'qi_knock2b_pillow'
];
// 新键的 questId 归属（按 main_ 编号升序）
const NEW_KEY_QUEST = {
    qi_knock2b_burn: 'main_052', qi_knock2b_look: 'main_052', qi_knock2b_pillow: 'main_052',
    qi_h4_life_farm: 'main_053', qi_h4_life_trade: 'main_053', qi_h4_life_teach: 'main_053',
    qi_h4_peddler_news: 'main_053', qi_h4_peddler_sword: 'main_053', qi_h4_peddler_tea: 'main_053',
    qi_h5_fight_leave: 'main_054', qi_h5_fight_part: 'main_054', qi_h5_fight_watch: 'main_054',
    qi_h5_teller_fix: 'main_054', qi_h5_teller_go: 'main_054', qi_h5_teller_tip: 'main_054',
    qi_yu_guard: 'main_010'
};
// 本轮补录的 16 键：15 新键 + qi_yu_guard（qi-arc1.js 补的那笔）
const ALL_16 = NEW_KEYS.concat(['qi_yu_guard']);

// recordChoice 里的 tagNames 白名单（choice-memory.js:197-201），抄一份用于断言 tags 不渲染成 #抉择
const TAG_NAMES = {
    mercy: '慈悲', ruthless: '冷酷', helpful: '善良', selfish: '自私', wise: '明智',
    reckless: '鲁莽', loyal: '忠诚', cowardly: '怯懦', decisive: '果决', cautious: '谨慎',
    pragmatic: '权宜', dao_heart: '道心', brave: '孤勇', honest: '实话',
    compassionate: '悲悯', curious: '好奇'
};

// ==================== 装载台（内联 _measure-core.cjs） ====================
function makePerm() {
    const perm = new Proxy(function () {}, {
        get(t, k) {
            if (k === Symbol.toPrimitive) return () => 0;
            if (k === 'toString') return () => '';
            if (k === 'valueOf') return () => 0;
            if (k === Symbol.iterator) return function* () { };
            if (k === 'then') return undefined;
            if (k === Symbol.toStringTag) return 'Obj';
            return perm;
        },
        set() { return true; }, apply() { return perm; }, construct() { return perm; }
    });
    return perm;
}
function el() {
    return {
        classList: { add() { }, remove() { }, contains: () => false, toggle() { } },
        style: {}, dataset: {}, appendChild() { }, removeChild() { }, remove() { },
        querySelectorAll: () => [], querySelector: () => null, closest: () => null,
        addEventListener() { }, removeEventListener() { }, setAttribute() { }, getAttribute: () => null,
        innerHTML: '', textContent: '', value: '', checked: false, children: [], childNodes: [],
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0 }),
        focus() { }, click() { }, scrollIntoView() { }, getContext: () => null, insertAdjacentHTML() { }
    };
}
function boot() {
    const html = read('仙侠.html');
    const order = (html.match(/src="([^"]+\.js)"/g) || []).map(s => s.slice(5, -1));
    const perm = makePerm();
    const bodyEl = el();
    const w = {
        console, Math, Date, JSON, Object, Array, String, Number, Boolean, Error, RegExp, TypeError, RangeError,
        isNaN, isFinite, parseInt, parseFloat, encodeURIComponent, decodeURIComponent,
        btoa: (s) => Buffer.from(String(s), 'binary').toString('base64'),
        atob: (s) => Buffer.from(String(s), 'base64').toString('binary'),
        setTimeout, clearTimeout, setInterval, clearInterval, setImmediate, clearImmediate, Promise, URL, URLSearchParams,
        Uint8Array, Int32Array, Float32Array, Map, Set, WeakMap, WeakSet, Symbol, Proxy, Reflect, Intl,
        structuredClone: (o) => JSON.parse(JSON.stringify(o)),
        performance: { now: () => 0 },
        document: {
            querySelectorAll: () => [], querySelector: () => null, getElementById: () => null,
            getElementsByClassName: () => [], getElementsByTagName: () => [],
            body: bodyEl, head: bodyEl, documentElement: bodyEl,
            addEventListener() { }, removeEventListener() { }, dispatchEvent() { }, cookie: '',
            readyState: 'complete', activeElement: null, createEvent: () => ({ initEvent() { } }),
            createElement: el, createDocumentFragment: el
        },
        localStorage: {
            _d: {}, getItem(k) { return k in this._d ? this._d[k] : null; },
            setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; },
            clear() { this._d = {}; }, key: () => null, get length() { return Object.keys(this._d).length; }
        },
        sessionStorage: { getItem: () => null, setItem() { }, removeItem() { }, clear() { } },
        navigator: { userAgent: 'node-choice-memory', language: 'zh-CN', platform: 'win32', clipboard: {} },
        location: { href: 'file:///choice.html', search: '', hash: '', reload() { } },
        alert() { }, confirm: () => true, prompt: () => '', open: () => null, close() { },
        addEventListener() { }, removeEventListener() { }, dispatchEvent() { },
        getComputedStyle: () => ({ getPropertyValue: () => '' }),
        requestAnimationFrame: () => 0, cancelAnimationFrame() { },
        matchMedia: () => ({ matches: false, addListener() { }, removeListener() { } }),
        AudioContext: function () {
            return { createOscillator: () => ({ connect() { }, start() { }, stop() { } }), createGain: () => ({ connect() { }, gain: {} }), destination: {}, currentTime: 0, resume() { } };
        },
        fetch: () => new Promise(() => { }), XMLHttpRequest: function () { return { open() { }, send() { }, setRequestHeader() { } }; },
        Image: function () { }, FileReader: function () { return { readAsText() { }, addEventListener() { } }; },
        currentCharData: {}, inventory: { slots: [], currency: {}, items: {} }, allItems: {}
    };
    w.window = w; w.globalThis = w; w.self = w; w.top = w; w.parent = w;
    const ctx = new Proxy(w, {
        has() { return true; },
        get(t, k) { if (k === Symbol.unscopables) return undefined; if (k in t) return t[k]; return perm; },
        set(t, k, v) { t[k] = v; return true; }
    });
    vm.createContext(ctx);
    const errs = [];
    // 全量 js 自带的 console 噪声（模块已加载播报、背包已满…）压掉，只留 warn/error 便于定位
    const realLog = console.log, realWarn = console.warn;
    console.log = () => { }; console.warn = () => { };
    for (const rel of order) {
        const fp = path.join(ROOT, rel.replace(/\//g, path.sep));
        if (!fs.existsSync(fp)) { errs.push('MISSING ' + rel); continue; }
        try { vm.runInContext(fs.readFileSync(fp, 'utf8'), ctx, { filename: rel, timeout: 20000 }); }
        catch (e) { errs.push(rel + ' :: ' + (e && e.message)); }
    }
    console.log = realLog; console.warn = realWarn;
    return { ctx: ctx, w: w, mounted: order.length, errs: errs, restoreConsole: function () { console.log = realLog; console.warn = realWarn; } };
}

const BOOT = boot();
const W = BOOT.w;
ok(BOOT.mounted > 300, 'F0 装载台按 仙侠.html 顺序 eval 全量 js（' + BOOT.mounted + ' 个 script）');
ok(BOOT.errs.length === 0, 'F0b 全量 js 装载零硬错误' + (BOOT.errs.length ? '：' + BOOT.errs.slice(0, 3).join(' | ') : ''));
const TABLE = W.IMPORTANT_CHOICES;
const PC = W.playerChoices;
ok(!!TABLE && !!PC, 'F0c 运行时对象挂载（window.IMPORTANT_CHOICES / window.playerChoices）');

const TABLE_KEYS = Object.keys(TABLE).sort();
const STAT_WL = Object.keys(PC.stats);

// recordChoice 引用模块作用域的 playerChoices，不是 window.playerChoices —— 只能原地清
function resetChoices() {
    PC.history.length = 0;
    STAT_WL.forEach(k => { PC.stats[k] = 0; });
    W.localStorage.removeItem('xianxia_choices');
}

// ==================== A 完整性：探针实测差集 ====================
// 入口枚举（源码 btn() 字符串里出现的 window.qiXxx(...) 字面量 onclick，不含拼接）→ DFS 点按钮 → 收集 id
const PROBE_FILES = ['qi-arc1.js', 'qi-arc2.js', 'qi-arc3.js', 'qi-arc4.js', 'qi-finale.js'];
const PROBE_PRESETS = [
    null, { qi_route: 'follow' }, { qi_route: 'oppose' }, { qi_route: 'ignore' },
    { qi_route: 'follow', qi_finale_follow: true }, { qi_route: 'ignore', qi_finale_follow: true },
    { qi_route: 'oppose', qi_betrayal: true }, { qi_knock2: 'closed' }, { qi_knock3: 'wine' },
    { qi_prologue_done: true, qi_scene: 'yu_battle_pending' }
];
function runProbe() {
    const modals = [];
    const captured = [];
    const realRecord = W.recordChoice;
    const realStartBattle = W.startBattle;
    const realBodyInsert = W.document.body.insertAdjacentHTML;
    const realBodyAppend = W.document.body.appendChild;
    const realCreate = W.document.createElement;
    W.recordChoice = function (id) { captured.push(id); };
    W.startBattle = function (e) { if (e && e._qiBeat === 'yu') { try { W.settleQiBattle(true, 'yu'); } catch (x) { throw new Error('probe: settleQiBattle 抛出 ' + x.message); } } };
    const realLocalSet = W.localStorage.setItem;
    function mkEl() {
        const base = el();
        base.insertAdjacentHTML = (p, h) => { modals.push(String(h)); };
        return base;
    }
    W.document.body.insertAdjacentHTML = (p, h) => { modals.push(String(h)); };
    W.document.body.appendChild = n => { if (n && n.outerHTML) modals.push(String(n.outerHTML)); };
    W.document.createElement = mkEl;
    W.localStorage.setItem = () => { };

    const harvest = () => {
        const res = [];
        for (const h of modals) {
            let m, r = /onclick="([^"]+)"/g;
            while ((m = r.exec(h))) res.push(m[1]);
            r = /onclick='([^']+)'/g;
            while ((m = r.exec(h))) res.push(m[1]);
        }
        modals.length = 0;
        return res;
    };
    const snap = () => JSON.stringify({ f: W.eventFlags, c: W.inventory && W.inventory.currency });
    const restore = s => { const o = JSON.parse(s); W.eventFlags = o.f; if (W.inventory) W.inventory.currency = o.c; };
    const fresh = p => {
        W.eventFlags = p ? JSON.parse(JSON.stringify(p)) : {};
        W.inventory = W.inventory || {};
        W.inventory.currency = { spiritStones: 999999, gold: 999999, silver: 999999 };
        W.currentCharData = W.currentCharData || {};
        W.currentCharData.gender = 'male';
        W.currentCharData.realm = '渡劫';
        modals.length = 0;
    };
    const run = code => vm.runInContext('(' + code + ')', BOOT.ctx, { timeout: 8000 });

    // 入口枚举：源码里 onclick 字面量形式的 window.qiXxx(...) 调用
    const zeroArgs = [], withArgs = [], seen = new Set();
    for (const f of PROBE_FILES) {
        const src = read('js/quest/' + f);
        let r = /'(window\.qi[A-Za-z0-9_]*\(\))'/g, m;
        while ((m = r.exec(src))) if (!seen.has(m[1])) { seen.add(m[1]); zeroArgs.push(m[1]); }
        r = /'(window\.qi[A-Za-z0-9_]*\([^']*\))'/g;
        while ((m = r.exec(src))) {
            const c = m[1].replace(/\\'/g, "'");
            if (/\+/.test(c)) continue;
            if (!/^window\.[A-Za-z0-9_]+\([\d,]*('[^']*'(,\s*'[^']*')*)?\)$/.test(c)) continue;
            if (seen.has(c)) continue;
            seen.add(c); withArgs.push(c);
        }
    }
    const entries = withArgs.concat(zeroArgs);
    const hit = new Map();
    const dfs = (depth, p, b) => {
        if (depth > 18 || b.n <= 0) return;
        for (const btn of harvest()) {
            if (b.n-- <= 0) return;
            const st = snap(), before = captured.length;
            try { run(btn); } catch (e) { throw new Error('probe: 点按钮炸了 ' + btn + ' :: ' + e.message); }
            for (let k = before; k < captured.length; k++) {
                if (!hit.has(captured[k])) hit.set(captured[k], []);
                hit.get(captured[k]).push(p + ' -> ' + btn);
            }
            dfs(depth + 1, p + ' -> ' + btn, b);
            restore(st);
        }
    };
    for (const e of entries) for (const pre of PROBE_PRESETS) {
        fresh(pre); captured.length = 0;
        try { run(e); } catch (err) { continue; }
        const tag = (pre ? 'P' + JSON.stringify(pre) + ' ' : '') + e;
        for (let k = 0; k < captured.length; k++) {
            if (!hit.has(captured[k])) hit.set(captured[k], []);
            hit.get(captured[k]).push(tag);
        }
        dfs(0, tag, { n: 700 });
    }
    W.recordChoice = realRecord;
    W.startBattle = realStartBattle;
    W.localStorage.setItem = realLocalSet;
    W.document.body.insertAdjacentHTML = realBodyInsert;
    W.document.body.appendChild = realBodyAppend;
    W.document.createElement = realCreate;
    return { hit: hit, entries: entries, captured: captured };
}
const realConsole = { log: console.log, warn: console.warn };
console.log = () => { }; console.warn = () => { };
const PROBE = runProbe();
console.log = realConsole.log; console.warn = realConsole.warn;
const REACH = [...PROBE.hit.keys()].filter(k => !/_undefined$/.test(k)).sort();
const ARTIFACTS = [...PROBE.hit.keys()].filter(k => /_undefined$/.test(k));
const NOT_IN_TABLE = REACH.filter(k => !TABLE[k]);
const IN_TABLE = REACH.filter(k => !!TABLE[k]);
const NEVER_PASSED = TABLE_KEYS.filter(k => REACH.indexOf(k) < 0);

note('表键(运行时) ' + TABLE_KEYS.length + ' ＝ qi_* ' + TABLE_KEYS.filter(k => k.indexOf('qi_') === 0).length
    + ' + 非qi ' + TABLE_KEYS.filter(k => k.indexOf('qi_') !== 0).length);
note('入口枚举 ' + PROBE.entries.length + ' 个 × 旗标预设 ' + PROBE_PRESETS.length + ' 组');
note('玩家可达 choiceId(去重) ' + REACH.length + '   表内 ' + TABLE_KEYS.length + '   探针伪影 ' + ARTIFACTS.length);
note('A 表里+真被传到 ' + IN_TABLE.length + ' ／ B 表里有但本探针未走到 ' + NEVER_PASSED.length + ' ／ C 真被传到但表里没有 ' + NOT_IN_TABLE.length);
ok(NOT_IN_TABLE.length === 0, 'A1 玩家可达的每个 choiceId 都在 IMPORTANT_CHOICES 里（差集为空）'
    + (NOT_IN_TABLE.length ? '：缺 ' + NOT_IN_TABLE.join(',') : ''));
ok(ARTIFACTS.length === 0, 'A2 探针零 _undefined 伪影');
ok(REACH.length === IN_TABLE.length + NOT_IN_TABLE.length, 'A3 校验恒等式 real == inBoth + notInTable');
ok(REACH.length >= 60, 'A4 探针覆盖度不退化（可达 ' + REACH.length + ' ≥ 60）');
// B 组是探针覆盖不到的那批：qi-arc2.js:394-395 的 onclick 用字符串拼接生成（'window.qiBossFate(' + n + ...），
// 入口正则按设计跳过拼接，故 8 个 boss 键 + 终幕 6 键进不了入口表；main_025_* 由 quest-system.js:641/644 记录，
// 不在这 5 个文件里。逐条核过 record 站点都在，不是漏登记。
ok(NEVER_PASSED.every(k => /^(qi_boss\d_(slay|spare)|qi_ending_|qi_eve_|qi_hesitation_|qi_knock2_escort|main_025_)/.test(k)),
    'A5 B 组全是「拼接 onclick / 非 qi-arc 文件」造成的探针盲区，无真漏登记'
    + (NEVER_PASSED.filter(k => !/^(qi_boss\d_(slay|spare)|qi_ending_|qi_eve_|qi_hesitation_|qi_knock2_escort|main_025_)/.test(k)).length
        ? '：意外项 ' + NEVER_PASSED.filter(k => !/^(qi_boss\d_(slay|spare)|qi_ending_|qi_eve_|qi_hesitation_|qi_knock2_escort|main_025_)/.test(k)).join(',') : ''));

// ==================== B 新键可达 ====================
const NOT_REACHED_16 = ALL_16.filter(k => REACH.indexOf(k) < 0);
ok(NOT_REACHED_16.length === 0, 'B1 本轮 16 键（15 新键 + qi_yu_guard）都能被真正 recordChoice 传到'
    + (NOT_REACHED_16.length ? '：没走到 ' + NOT_REACHED_16.join(',') : ''));
const MISSING_IN_TABLE_16 = ALL_16.filter(k => !TABLE[k]);
ok(MISSING_IN_TABLE_16.length === 0, 'B2 本轮 16 键全部在表里' + (MISSING_IN_TABLE_16.length ? '：缺 ' + MISSING_IN_TABLE_16.join(',') : ''));
note('B 命中路径样本：' + ALL_16.map(k => k + ' ← ' + (PROBE.hit.get(k) || ['<未命中>'])[0]).join(' ;; ').slice(0, 900));
// 表里缺键时下面几条要报「红」而不是炸栈：统一走 def() 取空对象
function def(k) { return TABLE[k] || {}; }
// 每键的 tag 必须落在 recordChoice 的 tagNames 内，否则渲染成 #抉择 噪声
const BAD_TAG_16 = ALL_16.filter(k => (def(k).tags || []).some(t => !TAG_NAMES[t]));
ok(BAD_TAG_16.length === 0, 'B3 本轮 16 键的 tags 全落在 tagNames 白名单内'
    + (BAD_TAG_16.length ? '：' + BAD_TAG_16.join(',') : ''));
const BAD_QUEST_16 = ALL_16.filter(k => def(k).questId !== NEW_KEY_QUEST[k]);
ok(BAD_QUEST_16.length === 0, 'B4 本轮 16 键的 questId 归属正确'
    + (BAD_QUEST_16.length ? '：' + BAD_QUEST_16.map(k => k + '→' + def(k).questId + '（应 ' + NEW_KEY_QUEST[k] + '）').join(',') : ''));
const NO_DESC_16 = ALL_16.filter(k => !def(k).description);
ok(NO_DESC_16.length === 0, 'B5 本轮 16 键 description 非空' + (NO_DESC_16.length ? '：' + NO_DESC_16.join(',') : ''));
// description 逐字抄 qi-arc3.js 的 btn() 选项原文（去首 emoji；价签按 qi_liu_buy 既有处理去掉）
const DESC_SRC = {
    qi_knock2b_look: '举到灯前，再看一遍',
    qi_knock2b_pillow: '原样折好，压在枕头底下',
    qi_knock2b_burn: '烧了——门缝里进来的东西，不问来历',
    qi_h4_life_farm: '种地——把南坡那块荒了十年的田翻出来',
    qi_h4_life_trade: '营生——街口支个摊，卖茶也代写家书',
    qi_h4_life_teach: '开蒙——把邻居的孩子们叫来，教认字',
    qi_h4_peddler_news: '买南边粮道的消息',
    qi_h4_peddler_sword: '把闲着的飞剑卖给他',
    qi_h4_peddler_tea: '都不买——留他喝碗茶，听他白说',
    qi_h5_fight_part: '劝一句——石头轮流用，一天一家',
    qi_h5_fight_watch: '站着听完——世俗的事，世俗自己了',
    qi_h5_fight_leave: '打水回家——锅里的粥要糊了',
    qi_h5_teller_tip: '赏他十灵石——段子糙，饭碗不糙',
    qi_h5_teller_fix: '纠一句——「她不是图痛快」',
    qi_h5_teller_go: '不听——转身去买菜'
};
const BAD_DESC = NEW_KEYS.filter(k => def(k).description !== DESC_SRC[k]);
ok(BAD_DESC.length === 0, 'B6 15 新键 description 与 qi-arc3.js 选项原文逐字一致'
    + (BAD_DESC.length ? '：' + BAD_DESC.map(k => k + '「' + def(k).description + '」≠「' + DESC_SRC[k] + '」').join(' | ') : ''));
// 反向：qi-arc3.js 源码里必须真的存在这些选项原文（防抄错源 / 防源码改了表没跟）
const ARC3 = read('js/quest/qi-arc3.js');
const NOT_IN_SRC = NEW_KEYS.filter(k => ARC3.indexOf(DESC_SRC[k]) < 0);
ok(NOT_IN_SRC.length === 0, 'B7 15 新键 description 在 qi-arc3.js 源文本里找得到'
    + (NOT_IN_SRC.length ? '：' + NOT_IN_SRC.join(',') : ''));

// ==================== C stat 合法性 ====================
ok(STAT_WL.length === 8, 'C1 stats 白名单 8 项（choice-memory.js:7 字面量）');
const BAD_STAT = TABLE_KEYS.filter(k => TABLE[k].stat && STAT_WL.indexOf(TABLE[k].stat) < 0);
ok(BAD_STAT.length === 0, 'C2 表内每个带 stat 的键，stat 都在白名单内'
    + (BAD_STAT.length ? '：' + BAD_STAT.map(k => k + '→' + TABLE[k].stat).join(',') : ''));
const WITH_STAT = TABLE_KEYS.filter(k => !!TABLE[k].stat);
note('C 带 stat 的键 ' + WITH_STAT.length + ' 个；用到的 stat：' + [...new Set(WITH_STAT.map(k => TABLE[k].stat))].join(','));
const NO_PRODUCER = STAT_WL.filter(s => !WITH_STAT.some(k => TABLE[k].stat === s));
ok(NO_PRODUCER.length <= 1 && (NO_PRODUCER.length === 0 || NO_PRODUCER[0] === 'helper_count'),
    'C3 无 stat 生产者的白名单项只剩 helper_count（已知死项，本轮只记录不改）'
    + (NO_PRODUCER.length ? '：' + NO_PRODUCER.join(',') : ''));
if (NO_PRODUCER.length) note('C 【只记录不修】helper_count 全表 0 个 stat 指向 ⇒ helperRatio 只由 selfish_count 那一笔（qi_alliance_sign）反向拉动；给它挂生产键会改结局倾向，本轮不动。');
// 15 新键 stat 全留空 ⇒ 补键对 checkEndingFromChoices 的四项 ratio 与 tendency 零漂移
const NEW_WITH_STAT = NEW_KEYS.filter(k => def(k).stat);
ok(NEW_WITH_STAT.length === 0, 'C4 15 新键 stat 全留空（补键不漂移结局倾向）'
    + (NEW_WITH_STAT.length ? '：' + NEW_WITH_STAT.join(',') : ''));

// ==================== D 端到端 ====================
{
    const msgs = [];
    const realMsg = W.showMessage;
    W.showMessage = (m, t) => { msgs.push(t + '|' + String(m)); };
    try {
        // D1 单笔落账：stat 有值、history 有条目、字段齐
        resetChoices();
        W.recordChoice('qi_boss1_spare', '万毒谷');
        ok(PC.history.length === 1 && PC.stats.mercy_count === 1, 'D1 recordChoice → stats 涨、history 落一条');
        ok(STAT_WL.filter(s => s !== 'mercy_count').every(s => PC.stats[s] === 0), 'D1b 只涨该键的 stat，其余 7 项零漂移');
        const h = PC.history[0];
        ok(h.choiceId === 'qi_boss1_spare' && h.questId === 'main_012' && !!h.description
            && typeof h.timestamp === 'number' && typeof h.day === 'number', 'D2 history 条目字段齐（choiceId/questId/description/timestamp/day）');
        ok(/📜 选择已记录/.test(msgs.join('|')), 'D3 落账后有「📜 选择已记录」提示');

        // D4 _endingModifiers 由 recordChoice 内部自动调 checkEndingFromChoices 产出
        const em = W._endingModifiers;
        ok(!!em, 'D4 recordChoice 末尾自动调 checkEndingFromChoices → window._endingModifiers 有值');
        ok(em && em.mercyRatio === 1 && em.helperRatio === 0.5 && em.daoRatio === 0.5 && em.wisdomRatio === 0.5
            && em.tendency === '中庸行者' && em.totalChoices === 1, 'D5 只记一笔仁慈：mercyRatio=1，其余三项 0.5，tendency 中庸行者');

        // D6 再补道心/入魔 → daoRatio 抬过 0.6 → tendency 翻成「仁心证道」
        W.recordChoice('qi_alliance_tear', '守脉盟');
        W.recordChoice('qi_interlude_answer', '她的信');
        W.recordChoice('main_025_flee', '宗门守卫战');
        ok(PC.stats.dao_heart_count === 2 && PC.stats.demon_heart_count === 1, 'D6 道心 2 / 入魔 1 落账');
        ok(Math.abs(W._endingModifiers.daoRatio - 2 / 3) < 1e-9, 'D7 daoRatio = 2/3');
        ok(W._endingModifiers.tendency === '仁心证道', 'D8 mercyRatio≥0.75 且 daoRatio≥0.6 → tendency 判「仁心证道」');
        ok(W._endingModifiers.totalChoices === PC.history.length && W._endingModifiers.totalChoices === 4, 'D9 totalChoices 与 history 等长');

        // D10 四项 ratio 恒在 [0,1] 且有限
        const RS = ['mercyRatio', 'helperRatio', 'daoRatio', 'wisdomRatio'];
        ok(RS.every(k => typeof W._endingModifiers[k] === 'number' && isFinite(W._endingModifiers[k])
            && W._endingModifiers[k] >= 0 && W._endingModifiers[k] <= 1), 'D10 四项 ratio 恒在 [0,1]');

        // D11 无效 id：history 不涨、stat 不动、弹 warning（这正是补键前的症状）
        const beforeN = PC.history.length;
        const snapStats = JSON.stringify(PC.stats);
        msgs.length = 0;
        W.recordChoice('qi_totally_bogus_id');
        ok(PC.history.length === beforeN && JSON.stringify(PC.stats) === snapStats, 'D11 无效 id 不写 history、不动 stats');
        ok(/选择记录失败：无效的选择ID/.test(msgs.join('|')) && /warning/.test(msgs.join('|')), 'D12 无效 id 弹 warning（玩家看得见，不是静默丢）');

        // D13 15 新键逐个落账：只进 history、stats 零变化
        resetChoices();
        NEW_KEYS.forEach(k => W.recordChoice(k, '枯竭年代'));
        ok(PC.history.length === 15, 'D13 15 新键各落一条 history');
        ok(STAT_WL.every(s => PC.stats[s] === 0), 'D14 15 新键零 stat ⇒ 四项 ratio 全 0.5、tendency 中庸行者（补键对结局零漂移）');
        ok(W._endingModifiers.tendency === '中庸行者' && W._endingModifiers.totalChoices === 15
            && W._endingModifiers.mercyRatio === 0.5, 'D15 15 新键后 tendency 仍是中庸行者、totalChoices=15');

        // D16 真写盘：localStorage 里存下来的 stats/history 与内存一致
        const raw = W.localStorage.getItem('xianxia_choices');
        let saved = null, parsed = false;
        try { saved = JSON.parse(raw); parsed = true; } catch (e) { saved = { parseError: e.message }; }
        ok(parsed && saved && saved.stats && saved.history && saved.history.length === 15
            && STAT_WL.every(s => saved.stats[s] === 0), 'D16 saveChoiceMemory 真写盘且内容与内存一致');

        // D17 getReferencedDialogue 只认在册键（history 里混进野键不炸）
        resetChoices();
        PC.history.push({ choiceId: 'qi_ghost_key', questId: 'x', description: '野键' });
        let ref = null, threw = '';
        try { ref = W.getReferencedDialogue('elder_01', '原话。'); } catch (e) { threw = e.message; }
        ok(!threw && ref === '原话。', 'D17 history 里的野键被跳过，NPC 引用不炸' + (threw ? '：' + threw : ''));
    } finally {
        W.showMessage = realMsg;
        resetChoices();
    }
}

// ==================== E 守阵眼那笔（qi-arc1.js settleQiBattle） ====================
// 探针 DFS 走过全弧，恩列/搁浅列已被塞满（_push 上限 60），先原地清空再量
function resetLedger() {
    const L = W.qiLedgerProbe();
    L.graces.length = 0; L.vendettas.length = 0; L.stranded.length = 0; L.hearts.length = 0;
}
function freshArc1() {
    W.eventFlags = {};
    W.inventory = { currency: { spiritStones: 5000, gold: 0, silver: 0 } };
    W.currentCharData = { realm: '渡劫', gender: 'male', name: '测试' };
    const cap = [];
    W.recordChoice = function (id) { cap.push(id); };
    W.startBattle = function (e) { cap.__enemy = e; };
    return cap;
}
{
    const realStartBattle = W.startBattle;
    // E1 败北：不写抉择记忆（败是可再战，那一刻选择尚未做出）
    const cap = freshArc1();
    resetLedger();
    W.qiStartPrologue();
    W.qiSceneChoice('chen', 'sit');
    W.qiSceneChoice('liu', 'move');
    cap.length = 0;                                    // 前两场已入账，从守阵眼这一拍开始计
    W.qiSceneChoice('yu', 'guard');
    ok(!!cap.__enemy && cap.__enemy._isQiStory === true && cap.__enemy._qiBeat === 'yu', 'E1 守阵眼走真仗接线（_isQiStory / _qiBeat=yu）');
    const graces0 = W.qiLedgerProbe().graces.length;
    W.settleQiBattle(false, 'yu');
    ok(cap.length === 0, 'E2 败北分支不写抉择记忆（cap 空）'
        + (cap.length ? '：实到 ' + JSON.stringify(cap) : ''));
    ok(W.eventFlags['qi_scene'] === 'yu' && !W.eventFlags['_qi_yu'], 'E3 败北把 qi_scene 拨回 yu 供再战，_qi_yu 未落');
    ok(W.qiLedgerProbe().graces.length === graces0, 'E4 败北不入恩列');

    // E5 再战取胜：本轮补的那一笔必须真的传到 recordChoice
    W.qiSceneChoice('yu', 'guard');
    W.settleQiBattle(true, 'yu');
    ok(cap.length === 1 && cap[0] === 'qi_yu_guard', 'E5 取胜 → 记 qi_yu_guard 恰好一笔'
        + (cap.length !== 1 ? '：实到 ' + JSON.stringify(cap) : ''));
    ok(W.eventFlags['_qi_yu'] === 'guard', 'E6 取胜落旗 _qi_yu=guard（旗消费方 qi-arc2.js:148 等照旧读旗）');
    const graces1 = W.qiLedgerProbe().graces.length;
    ok(graces1 === graces0 + 1, 'E7 取胜入恩列（虞松子一笔）'
        + '：恩列 ' + graces0 + ' → ' + graces1);

    // E8 幂等闸：赢了之后这一拍已落定，场景入口与结算口都得挡住二次记账
    W.qiSceneChoice('yu', 'guard');
    W.settleQiBattle(true, 'yu');
    ok(cap.length === 1, 'E8 胜后再点同一场 / 再结算一次都不重复记账（仍是一笔）'
        + (cap.length !== 1 ? '：实到 ' + JSON.stringify(cap) : ''));
    ok(W.qiLedgerProbe().graces.length === graces1, 'E8b 二次结算不再插恩列'
        + '：恩列 ' + graces1 + ' → ' + W.qiLedgerProbe().graces.length);

    // E9 另一拍「没有上山」仍照旧记账（本轮没碰它，不回归）
    const cap2 = freshArc1();
    resetLedger();
    W.qiStartPrologue();
    W.qiSceneChoice('chen', 'pass');
    W.qiSceneChoice('liu', 'pass');
    cap2.length = 0;
    W.qiSceneChoice('yu', 'pass');
    ok(cap2.length === 1 && cap2[0] === 'qi_yu_pass', 'E9 不帮（qi_yu_pass）照旧记账，不回归'
        + (cap2.length !== 1 ? '：实到 ' + JSON.stringify(cap2) : ''));
    W.startBattle = realStartBattle;
}

// ==================== F 硬约束 ====================
{
    const SELF = read('tests/legacy-choice-memory-node.js');
    const ARC1 = read('js/quest/qi-arc1.js');
    ok(!/Math\.random/.test(SELF), 'F1 本测试零掷骰（断言不掷骰）');
    ok(!/Math\.random/.test(ARC1), 'F2 js/quest/qi-arc1.js 零掷骰');
    const EMPTY_CATCH = SELF.match(/catch\s*\([^)]*\)\s*\{\s*\}/g) || [];
    ok(EMPTY_CATCH.length === 0, 'F3 本测试零空 catch（异常一律显式处理）'
        + (EMPTY_CATCH.length ? '：' + EMPTY_CATCH.length + ' 处' : ''));
    // 结算函数体内的 record 只有这一笔；败北分支源码里不得出现 record(
    const settle = ARC1.slice(ARC1.indexOf('W.settleQiBattle = function'), ARC1.indexOf('function _sceneZhou'));
    ok((settle.match(/record\(/g) || []).length === 1, 'F4 settleQiBattle 内 record 恰好一处（qi_yu_guard）');
    const loseBranch = settle.slice(settle.indexOf('} else {'));
    ok(loseBranch.indexOf('record(') < 0, 'F5 败北分支源码零 record（败是可再战，不是选择）');
    note('F 【只记录不修】settleQiBattle 顶部转发 _qiSettleExtra 那处既有空 catch（吞异常不落 console），本轮未动。');
}

// ==================== G 只记录不修 ====================
// checkEndingFromChoices 的 tendency 阈值 vs quest-system.js:827 自陈的「35 步要求」：谁是正主无法判定，
// 改任一边都可能踩对方的测试。本轮只落档，不动。
{
    const QS = read('js/quest/quest-system.js');
    const qsLines = QS.split('\n').filter(l => /35\s*(步|次)/.test(l));
    note('G 【只记录不修】quest-system.js 里提到「35 步」的行 ' + qsLines.length + ' 处；'
        + 'checkEndingFromChoices 的 tendency 阈值（0.75/0.25/0.4）与之无对照关系，两边都不动。');
}

console.log('legacy-choice-memory: ' + passed + ' passed, ' + failures.length + ' failed');
if (notes.length) { console.log('--- 实测/只记录 ---'); notes.forEach(n => console.log('  · ' + n)); }
if (failures.length) failures.forEach(f => console.log('  FAIL: ' + f));
// 全量 js 装载后有 setInterval/setTimeout 挂着（世界层日结轮询），必须显式退出，否则进程不收尾
process.exit(failures.length ? 1 : 0);