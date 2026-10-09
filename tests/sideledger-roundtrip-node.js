/**
 * tests/sideledger-roundtrip-node.js
 * ①存档丢键批 · 断言套件
 *
 * 病灶（实测，不是推测）：
 *   applyFullGameState 开头 clearCharacterStorage() 先把 37 键角色级键全删，
 *   而「键」能不能被读档后刷新认出来，取决于**三条回灌通路**之一有没有覆盖它：
 *     ① writeKey('<key>', saveData.<字段>)              —— 结构化字段那条
 *     ② SIDE_LEDGER_KEYS 原文随槽往返                     —— 本批补的
 *     ③ 模块自己在 apply 里 saveToStorage（如 xianxia_personal_event_flags）
 *   三条都不覆盖 ⇒ 每次读档抹一次，**键从此不在盘上**。
 *   而 xianxia_sect_diplomacy / xianxia_tracked_quests 栽得最重：它们**有** StateRegistry
 *   模块（collect 收得好好的），但那个模块的 import 只改内存、**不回写键**；
 *   读档后刷新，initSectDiplomacy()（sect-visit.js:640，由 app.js:11902 在加载时调）
 *   读到 null 就 **Math.random 重生成整张外交矩阵** 并写回盘上 ⇒ 玩家真账被覆盖。
 *
 * 四组断言：
 *   [A] 往返      SIDE_LEDGER_KEYS 里每个键都能原文往返（写→collect→序列化→反序列化→apply→读回）
 *   [B] 清得掉收不回  clearCharacterStorage 之后能救回来；★含 apply 中途抛错的情形
 *   [C] 同类扫描   白名单里每个键都被 collect 收进过；★「登记了但没 collect」要能被抓出来
 *   [D] 注释真实性  ②批修的那四条注释所指的 file:line 真的还在那个位置
 *
 * 手法：[A][B] 用 vm 沙箱装真 js/core/game-state.js + state-registry.js（真删真写）；
 *       [C] 按 仙侠.html 的真实 script 顺序 eval 全量 js，用**差分法**判覆盖
 *           （同一个键在盘上/不在盘上各 collect 一次，结果逐字节比对）；
 *       [D] 纯文本核对。全程只读工作树，E 段收尾做 byte-exact 复核。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');

let passed = 0, failed = 0;
function ok(c, m) { if (c) { passed++; console.log('  ✓ ' + m); } else { failed++; console.log('  [FAIL] ' + m); } }
function eq(a, b, m) { ok(a === b, m + (a === b ? '' : '（实际=' + JSON.stringify(a) + ' 期望=' + JSON.stringify(b) + '）')); }

const GS_SRC = fs.readFileSync(path.join(ROOT, 'js/core/game-state.js'), 'utf8');
const SR_SRC = fs.readFileSync(path.join(ROOT, 'js/core/state-registry.js'), 'utf8');
const 读 = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const 行 = (rel, n) => 读(rel).split(/\r?\n/)[n - 1] || '';

// 白名单里的键各有各的合法形状：差分/往返都用它当哨兵，不能拿随手编的值去试
const 样本 = {
    xianxia_merged_skills: JSON.stringify([{ id: 'merged_probe_a', name: '两仪合参诀' }]),
    xianxia_asm_ledger: JSON.stringify([{ h: '甲', g: '乙', day: 12 }]),
    xianxia_collective_ledger: JSON.stringify({ lanterns: { 金城: 1 }, weddingDone: true }),
    xianxia_rival_chain_cd: JSON.stringify({ npc_甲: 40 }),
    xianxia_sect_diplomacy: JSON.stringify({ 青玄宗: { 赤焰门: { relation: 88, trade: 7, conflicts: 3, lastEvent: 9, treaties: ['互市'] } } }),
    xianxia_tracked_quests: JSON.stringify([{ id: 'main_001', name: '初入仙途' }]),
    xianxia_storyline_choices: JSON.stringify({ npc_甲: { seg4: 'immortal' } }),
    xianxia_mail_system: JSON.stringify({ inbox: [{ id: 'm1', from: '师尊' }], outbox: [], favorites: [] }),
    xianxia_quick_moves: JSON.stringify(['art_01', '', '', '', '', '']),
};

function 建沙箱(源码, 初值) {
    const 存 = new Map(Object.entries(初值 || {}));
    const 沙 = {
        console: { log() {}, warn() {}, error() {} },
        localStorage: {
            getItem: k => (存.has(k) ? 存.get(k) : null),
            setItem: (k, v) => { 存.set(k, String(v)); },
            removeItem: k => { 存.delete(k); },
            key: i => Array.from(存.keys())[i],
            get length() { return 存.size; },
        },
        saveToStorage(k, v) { 存.set(k, String(v)); return true; },
        _rehydrate: [],
    };
    沙.window = 沙;
    沙.rehydrateMergedSkills = function () { 沙._rehydrate.push('merged'); return 0; };
    沙._asmLedgerReload = function () { 沙._rehydrate.push('asm'); return []; };
    沙._collectiveLedgerReload = function () { 沙._rehydrate.push('collective'); return {}; };
    vm.createContext(沙);
    vm.runInContext(SR_SRC, 沙, { filename: 'state-registry.js' });
    vm.runInContext(源码 || GS_SRC, 沙, { filename: 'js/core/game-state.js' });
    return { 沙, 存, GS: 沙.GameState };
}

function 满仓(键表) {
    const o = { xianxia_save: JSON.stringify({ charName: '旧角色', realm: '筑基' }) };
    (键表 || []).forEach(k => { o[k] = 样本[k]; });
    return o;
}
function 造角色() {
    return { name: '无名', gender: '男', mainAttributes: { 悟性: 10 }, combatSkills: {}, lifeSkills: {},
        spiritualRoots: { 金: 5 }, attrs: {}, realm: '炼气', layer: 1 };
}

console.log('\n========== ①存档丢键批 · sideledger 往返 ==========');

// ================= [A] 往返 =================
console.log('\n[A] SIDE_LEDGER_KEYS 里每个键都能原文往返');
let 旁账名单 = null;
{
    const A0 = 建沙箱();
    旁账名单 = A0.GS.SIDE_LEDGER_KEYS;
    eq(Array.isArray(旁账名单) && 旁账名单.length > 0, true, 'A0 SIDE_LEDGER_KEYS 已导出（非空数组，实读 ' + 旁账名单.length + ' 本）');
    const 不在白名单 = 旁账名单.filter(k => A0.GS.CHARACTER_STORAGE_KEYS.indexOf(k) < 0);
    eq(不在白名单.length, 0, 'A0b 旁账里每一本都在 CHARACTER_STORAGE_KEYS 内（旁账是白名单的子集，不新增角色级键）'
        + (不在白名单.length ? '（游离: ' + 不在白名单.join('、') + '）' : ''));

    const A = 建沙箱(GS_SRC, 满仓(旁账名单));
    A.沙.currentCharData = 造角色();
    const 档 = A.GS.collectFullGameState();
    ok(!!档, 'A1 collectFullGameState 跑通');
    const 缺 = 旁账名单.filter(k => !档.sideLedgers || 档.sideLedgers[k] == null);
    eq(缺.length, 0, 'A2 ★每一本都进了 sideLedgers（现读 ' + Object.keys(档.sideLedgers || {}).length + ' 格）'
        + (缺.length ? '（缺: ' + 缺.join('、') + '）' : ''));

    // 存的是**原文**，不是二次序列化的结果（再套一层 JSON.stringify 会写出 "[[...]]"）
    const 双重 = 旁账名单.filter(k => {
        const v = 档.sideLedgers[k];
        return v === 样本[k] ? false : (() => { try { return JSON.stringify(JSON.parse(v)) !== v; } catch (e) { return true; } })();
    });
    eq(双重.length, 0, 'A3 每本存的都是原文（不是套了第二层 JSON 的串）' + (双重.length ? '（双重编码: ' + 双重.join('、') + '）' : ''));

    // ★ serialize → deserialize 一圈（真跑 JSON 往返，模拟存盘/读盘）
    const 线 = JSON.stringify(档);
    const 解 = JSON.parse(线);
    ok(!!解.sideLedgers, 'A4 存档序列化 → 反序列化后 sideLedgers 仍在');

    // 换成「浏览器里现役的是别人」的状态，再 apply
    旁账名单.forEach(k => A.存.set(k, '"别人的账"'));
    const 回 = A.GS.applyFullGameState(解);
    eq(回, true, 'A5 applyFullGameState 收下这一槽');
    const 错 = 旁账名单.filter(k => A.存.get(k) !== 样本[k]);
    eq(错.length, 0, 'A6 ★读档后每一本都一字不差地回到盘上（开头的 clearCharacterStorage 抹过，靠 sideLedgers 灌回来）'
        + (错.length ? '（不一致: ' + 错.join('、') + '）' : ''));

    // 老档没有 sideLedgers 这一格 ⇒ 整段跳过。
    // ⚠️ 注意这里**不是**「键保持原样」：applyFullGameState 开头本来就要 clearCharacterStorage()
    // 清掉上一角色的键（game-state.js:878 明写「杜绝 A/B 槽通过 localStorage 串状态」），
    // 所以正确判据是「**不被写成空值**」（不是 '' / {} / null），而不是「原封不动」。
    const 老档 = JSON.parse(JSON.stringify(解));
    delete 老档.sideLedgers;
    旁账名单.forEach(k => A.存.set(k, '"现役角色的账"'));
    A.GS.applyFullGameState(老档);
    const 被写空 = 旁账名单.filter(k => {
        const v = A.存.get(k);
        return v === '' || v === '{}' || v === '[]' || v === 'null' || v === '""';
    });
    eq(被写空.length, 0, 'A7 老档没有 sideLedgers 格时整段跳过，不会拿**空值**去盖账'
        + (被写空.length ? '（被写空: ' + 被写空.join('、') + '）' : ''));
    eq(旁账名单.filter(k => !A.存.has(k)).length, 旁账名单.length,
        'A7b 而这 ' + 旁账名单.length + ' 本是被 clearCharacterStorage **删掉**的（读档换档要清上一角色，这是设计），'
        + '不是被写成空串——B 段已证明同一份槽在带 sideLedgers 时能一字不差地灌回来');

    // 档是浏览器本地数据，但回灌口不该有往任意键上写的能力
    const 坏档 = JSON.parse(JSON.stringify(解));
    坏档.sideLedgers.xianxia_settings = '{"lang":"EN"}';
    A.存.set('xianxia_settings', '{"lang":"zh"}');
    A.GS.applyFullGameState(坏档);
    eq(A.存.get('xianxia_settings'), '{"lang":"zh"}', 'A8 档里塞一个不在旁账单上的键也写不进去（回灌只认 SIDE_LEDGER_KEYS）');
}

// ================= [B] 清得掉、收不回 =================
console.log('\n[B] clearCharacterStorage 之后救得回来（含中途抛错）');
{
    const B = 建沙箱(GS_SRC, 满仓(旁账名单));
    B.沙.currentCharData = 造角色();
    const 档 = B.GS.collectFullGameState();

    // B1 光清
    B.GS.clearCharacterStorage({ alsoAccount: false });
    const 清后还在 = 旁账名单.filter(k => B.存.has(k));
    eq(清后还在.length, 0, 'B1 clearCharacterStorage 真把旁账删了（证明「清得掉」这半句成立）'
        + (清后还在.length ? '（还在: ' + 清后还在.join('、') + '）' : ''));

    // B2 清完再灌
    B.GS.applyFullGameState(档);
    const B2错 = 旁账名单.filter(k => B.存.get(k) !== 样本[k]);
    eq(B2错.length, 0, 'B2 ★清掉之后 apply 能全部救回来' + (B2错.length ? '（救不回: ' + B2错.join('、') + '）' : ''));

    // B3 ★中途抛错：xianxia_save 已在 protectKeys 里，抛错也不该把玩家主档赔进去
    const B3 = 建沙箱(GS_SRC, 满仓(旁账名单));
    B3.沙.currentCharData = 造角色();
    const 档3 = B3.GS.collectFullGameState();
    const 盘上原文 = B3.存.get('xianxia_save');
    // 在 apply 的**无 try 区**里埋一个抛错点：loadedChar 字面量读 saveData.soulState（game-state.js:949），
    // 它在 clearCharacterStorage（:893）之后、末尾 writeKey('xianxia_save')（:1523）之前
    Object.defineProperty(档3, 'soulState', { get() { throw new Error('中途抛错试验'); }, enumerable: true });
    let 抛了 = false;
    try { B3.GS.applyFullGameState(档3); } catch (e) { 抛了 = true; }
    ok(抛了, 'B3 试验成立：apply 确实在中途抛了错（埋点生效）');
    eq(B3.存.get('xianxia_save'), 盘上原文,
        'B4 ★中途抛错后，玩家的主档 xianxia_save 仍是**上一份完整档**（它在 protectKeys 里，全程没被删）'
        + '——这就是 :1416-1420 那个「删掉且不回写」的洞已被前批堵上的证据');
    ok(B3.存.get('xianxia_save') !== null, 'B5 主档键确实还在盘上（不是「键不存在」）');

    // B6 旁账在抛错后确实被清了，但能用槽里的原文救回来 —— writeKey/saveToStorage 就是那条救援路
    const 抛后没了 = 旁账名单.filter(k => !B3.存.has(k));
    ok(抛后没了.length > 0, 'B6 抛错后旁账键确实处于「已删」状态（现读 ' + 抛后没了.length + '/' + 旁账名单.length + ' 本）');
    let 救不回 = [];
    抛后没了.forEach(k => {
        const raw = 档3.sideLedgers && 档3.sideLedgers[k];
        if (raw == null) { 救不回.push(k + '(槽里没有)'); return; }
        B3.沙.saveToStorage(k, raw);            // 与 game-state.js 回灌段同一条单源写入口
        if (B3.存.get(k) !== raw) 救不回.push(k);
    });
    eq(救不回.length, 0, 'B7 ★这 ' + 抛后没了.length + ' 本都能用档里的原文经 saveToStorage 救回来'
        + (救不回.length ? '（救不回: ' + 救不回.join('、') + '）' : ''));
    eq(旁账名单.filter(k => B3.存.get(k) === 样本[k]).length, 旁账名单.length,
        'B8 全部旁账都回到了与样本一字不差的状态');
}

// ================= [C] 同类扫描 =================
console.log('\n[C] 白名单覆盖扫描：每个键都被 collect 收进过');
const 全量 = (() => {
    // 按 仙侠.html 的真实 script 顺序 eval 全量 js，读运行时对象
    const html = 读('仙侠.html');
    const order = (html.match(/src="([^"]+\.js)"/g) || []).map(s => s.slice(5, -1));
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
        set() { return true; }, apply() { return perm; }, construct() { return perm; },
    });
    const el = () => ({
        classList: { add() {}, remove() {}, contains: () => false, toggle() {} }, style: {}, dataset: {},
        appendChild() {}, removeChild() {}, remove() {}, querySelectorAll: () => [], querySelector: () => null,
        closest: () => null, addEventListener() {}, removeEventListener() {}, setAttribute() {},
        getAttribute: () => null, innerHTML: '', textContent: '', value: '', checked: false,
        children: [], childNodes: [], getBoundingClientRect: () => ({ left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0 }),
        focus() {}, click() {}, scrollIntoView() {}, getContext: () => null, insertAdjacentHTML() {},
    });
    const bodyEl = el();
    const w = {
        console: { log() {}, warn() {}, error() {} }, Math, Date, JSON, Object, Array, String, Number,
        Boolean, Error, RegExp, TypeError, RangeError, isNaN, isFinite, parseInt, parseFloat,
        encodeURIComponent, decodeURIComponent, setTimeout, clearTimeout, setInterval, clearInterval,
        setImmediate, clearImmediate, Promise, URL, URLSearchParams, Uint8Array, Int32Array, Float32Array,
        Map, Set, WeakMap, WeakSet, Symbol, Proxy, Reflect, Intl,
        structuredClone: o => JSON.parse(JSON.stringify(o)), performance: { now: () => 0 },
        document: {
            querySelectorAll: () => [], querySelector: () => null, getElementById: () => null,
            getElementsByClassName: () => [], getElementsByTagName: () => [], body: bodyEl, head: bodyEl,
            documentElement: bodyEl, addEventListener() {}, removeEventListener() {}, dispatchEvent() {},
            cookie: '', readyState: 'complete', activeElement: null, createElement: el,
            createDocumentFragment: el, createEvent: () => ({ initEvent() {} }),
        },
        localStorage: {
            _d: {}, getItem(k) { return k in this._d ? this._d[k] : null; }, setItem(k, v) { this._d[k] = String(v); },
            removeItem(k) { delete this._d[k]; }, clear() { this._d = {}; }, key: () => null,
            get length() { return Object.keys(this._d).length; },
        },
        sessionStorage: { getItem: () => null, setItem() {}, removeItem() {}, clear() {} },
        navigator: { userAgent: 'node-sideledger', language: 'zh-CN', platform: 'win32' },
        location: { href: 'http://127.0.0.1:8931/', search: '', hash: '', reload() {} },
        alert() {}, confirm: () => true, prompt: () => '', open: () => null, close() {},
        addEventListener() {}, removeEventListener() {}, dispatchEvent() {},
        getComputedStyle: () => ({ getPropertyValue: () => '' }),
        requestAnimationFrame: () => 0, cancelAnimationFrame() {},
        matchMedia: () => ({ matches: false, addListener() {}, removeListener() {} }),
        currentCharData: {}, inventory: { slots: [], currency: {}, items: {} }, allItems: {},
    };
    w.window = w; w.globalThis = w; w.self = w; w.top = w; w.parent = w;
    const ctx = new Proxy(w, {
        has() { return true; },
        get(t, k) { if (k === Symbol.unscopables) return undefined; if (k in t) return t[k]; return perm; },
        set(t, k, v) { t[k] = v; return true; },
    });
    vm.createContext(ctx);
    let loaded = 0;
    order.forEach(rel => {
        const fp = path.join(ROOT, rel.replace(/\//g, path.sep));
        if (!fs.existsSync(fp)) return;
        try { vm.runInContext(fs.readFileSync(fp, 'utf8'), ctx, { filename: rel, timeout: 20000 }); loaded++; } catch (e) { /* 单文件加载失败不阻断扫描 */ }
    });
    return { ctx, loaded, total: order.length };
})();
{
    ok(全量.loaded >= 340, 'C0 全量 js 按 仙侠.html 顺序 eval 成功（' + 全量.loaded + '/' + 全量.total + ' 个脚本）');
    const GS = 全量.ctx.GameState;
    const LS = 全量.ctx.localStorage;
    ok(!!GS && !!GS.CHARACTER_STORAGE_KEYS, 'C0b GameState 挂上了，白名单 ' + (GS ? GS.CHARACTER_STORAGE_KEYS.length : 0) + ' 键');

    const 白名单 = GS.CHARACTER_STORAGE_KEYS;
    // ★差分必须先把「每次 collect 都变的字段」剔掉，否则尺会靠时钟抖动翻红。
    //   saveData.timestamp 是 Date.now()（game-state.js:220）——同一毫秒内两次 collect 逐字节相同、
    //   跨一毫秒就不同。实测踩过：C2b 在基准下靠「碰巧同毫秒」判成 false，
    //   一旦文件变长（注入多一行）就跨了毫秒、翻成 true，看着像尺抓到了回归，其实是尺自己在抖。
    //   gameTime 同理（可能带实时分量）。剔掉这两个再比。
    const 易变字段 = ['timestamp', 'gameTime'];
    const 稳定 = v => { const c = Object.assign({}, v); 易变字段.forEach(k => { delete c[k]; }); return c; };
    const 快照 = () => {
        const d = GS.collectFullGameState();
        try { return JSON.stringify(稳定(d)); } catch (e) { return '__x__'; }
    };

    // ★差分法（**只管 localStorage 那一条道**）：这个键在盘上/不在盘上各 collect 一次，
    //   剔掉易变字段后逐字节比对。变了 ⇒ collect 的值**取自这个键**；没变 ⇒ 没取。
    //
    // ⚠️⚠️ 这条道**看不见**「值取自内存模块态」的键：inventory 读 window.inventory.slots、
    //   npc_records 读 window._npcRecords、beasts/quest_progress/world_events/social_cooldowns…
    //   都是从内存快照进 saveData 的，往 localStorage 里塞哨兵对它们毫无影响。
    //   所以「差分没反应」**不等于**「没被 collect 收」，只等于「不是从盘上取的」。
    //   （踩过的坑：第一版把差分当全集，得出「37 键全部被收」的结论，其实那 15 键是
    //     timestamp 抖动帮它判的 true——真实情况是这 15 键走内存道，差分本来就看不见。）
    //   因此下面拆成 C1a（盘上道）与 C1b（内存道），两条合起来才盖得住 37 键。
    const 盘上道 = [], 内存道 = [];
    白名单.forEach(k => {
        const v = 样本[k] != null ? 样本[k] : JSON.stringify({ __哨__: k });
        LS.removeItem(k); const a = 快照();
        LS.setItem(k, v); const b = 快照();
        LS.removeItem(k);
        (a === b ? 内存道 : 盘上道).push(k);
    });

    const writeKey键集 = new Set((GS_SRC.match(/writeKey\('([A-Za-z_$][\w$]*)'/g) || [])
        .map(s => s.slice("writeKey('".length, -1)));
    const 旁账键集 = new Set(旁账名单);

    // C1a 走盘上道的键：collect 真的读了它，那它就必须有一条回灌通路，否则读档即丢
    const 盘上道无回灌 = 盘上道.filter(k => !writeKey键集.has(k) && !旁账键集.has(k)
        && k !== 'xianxia_personal_event_flags');
    eq(盘上道无回灌.length, 0,
        'C1a ★走 localStorage 道的 ' + 盘上道.length + ' 个键，每个都有回灌通路（writeKey / 旁账 / 模块自写）'
        + '——读档后键会回到盘上'
        + (盘上道无回灌.length ? '（★读了却灌不回来: ' + 盘上道无回灌.join('、') + '）' : ''));

    // C1b 走内存道的键：差分看不见，得靠「apply 里有 writeKey 回写」证明它在存档契约内
    const 设计上不落盘 = ['xianxia_game_time', 'xianxia_professions', 'borrowRecords'];
    const 内存道无回灌 = 内存道.filter(k => !writeKey键集.has(k) && 设计上不落盘.indexOf(k) < 0);
    eq(内存道无回灌.length, 0,
        'C1b ★走内存道的 ' + 内存道.length + ' 个键，每个都在 applyFullGameState 里有 writeKey 回写'
        + '（差分看不见内存道，改用回写口证明）'
        + (内存道无回灌.length ? '（★内存道却没回写: ' + 内存道无回灌.join('、') + '）' : ''));

    eq(盘上道.length + 内存道.length, 白名单.length,
        'C1c 两条道合起来正好盖住全部 ' + 白名单.length + ' 键（盘上 ' + 盘上道.length + ' + 内存 ' + 内存道.length + '），无重复无遗漏');
    console.log('      （盘上道 ' + 盘上道.length + ' 键 / 内存道 ' + 内存道.length + ' 键'
        + '；内存道 = ' + 内存道.join('、') + '）');

    // C2 ★抓回归能力：往白名单里塞一个**谁也不收**的键，这把尺必须把它抓出来。
    //   这才是「登记了但没 collect 的要能被抓出来」那句话的正解——不是靠逐键人肉核对，
    //   而是证明**这套扫描本身**在遇到这种键时会亮红灯。
    const 注入 = GS_SRC.replace(
        /'borrowRecords'\s*\n(\s*\];)/,
        "'borrowRecords',\n        'xianxia__从未被采集的哨兵键'\n$1");
    ok(注入 !== GS_SRC, 'C2a 注入成功：往 CHARACTER_STORAGE_KEYS 末尾加一个谁也不收的键');
    if (注入 !== GS_SRC) {
        const T = 建沙箱(注入, {});
        T.沙.currentCharData = 造角色();
        // 同样先剔易变字段，否则这里也会靠时钟抖动给出假结论
        const 稳 = v => { const c = Object.assign({}, v); 易变字段.forEach(k => { delete c[k]; }); return c; };
        const 扫 = () => {
            const k = 'xianxia__从未被采集的哨兵键';
            T.存.delete(k);
            const a = (() => { try { return JSON.stringify(稳(T.GS.collectFullGameState())); } catch (e) { return '__x__'; } })();
            T.存.set(k, JSON.stringify({ __哨__: 1 }));
            const b = (() => { try { return JSON.stringify(稳(T.GS.collectFullGameState())); } catch (e) { return '__x__'; } })();
            T.存.delete(k);
            return a !== b;
        };
        eq(扫(), false, 'C2b ★差分法对「登记了但 collect 零覆盖」的键判 false（=能被抓出来）；'
            + '若这里翻成 true，说明差分被易变字段污染了（timestamp 那次踩过），先修尺再谈尺');
        ok(T.GS.CHARACTER_STORAGE_KEYS.indexOf('xianxia__从未被采集的哨兵键') >= 0, 'C2c 注入的键确实进了白名单（否则 C2b 的 false 是因为键没登记，试验无效）');
        // 而它会在读档时被真删 ⇒ 三条通路一条都不覆盖
        T.存.set('xianxia__从未被采集的哨兵键', JSON.stringify({ __哨__: 1 }));
        T.GS.clearCharacterStorage({ alsoAccount: false });
        eq(T.存.has('xianxia__从未被采集的哨兵键'), false, 'C2d 而它在读档/新开局时照旧被删 —— 这就是「登记了但收不回」的完整病状');
    }

    // C3 三条通路的静态覆盖账（键必须落在 ①②③ 之一，否则就是下一个病灶）
    const gs = GS_SRC;
    const apply内自写 = /saveToStorage\('(xianxia_personal_event_flags)'/.test(gs) ? new Set(['xianxia_personal_event_flags']) : new Set();
    const 通路 = k => writeKey键集.has(k) || 旁账键集.has(k) || apply内自写.has(k);
    // xianxia_game_time 是设计上就不落盘的（time-system.js:113 明写「禁止自动持久化」），
    // 进程内账在 saveData.gameTime；xianxia_professions 全仓无写无读；borrowRecords 全仓无写盘。
    const 无通路 = 白名单.filter(k => !通路(k) && 设计上不落盘.indexOf(k) < 0);
    eq(无通路.length, 0, 'C3 ★白名单里没有「三条回灌通路都不覆盖」的键（那类键每次读档抹一次）'
        + (无通路.length ? '（★漏网: ' + 无通路.join('、') + '）' : ''));
    const 特批 = 设计上不落盘.filter(k => 白名单.indexOf(k) >= 0);
    eq(特批.length, 3, 'C4 三条通路都不覆盖但**设计上就如此**的键 = ' + 特批.length + ' 个：' + 特批.join('、')
        + '（game_time 见 time-system.js:113「禁止自动持久化」，账在 saveData.gameTime；另两个全仓无写无读）');

    // C5 乙类键的病根仍在模块侧：import 只改内存、不回写键。列出名单，供下一批照单处理。
    const 乙类 = ['xianxia_sect_diplomacy', 'xianxia_tracked_quests', 'xianxia_storyline_choices', 'xianxia_mail_system', 'xianxia_quick_moves'];
    const 乙类已上单 = 乙类.filter(k => 旁账名单.indexOf(k) >= 0);
    eq(乙类已上单.length, 乙类.length, 'C5 ★乙类五键（有 StateRegistry 模块但 import 不回写键）全部上了旁账单：' + 乙类已上单.join('、'));
    const sv = 读('js/sects/sect-visit.js');
    const imp = sv.slice(sv.indexOf("register('sectDiplomacy'"), sv.indexOf("register('sectDiplomacy'") + 700);
    ok(imp.indexOf('saveSectDiplomacy') < 0, 'C5b 病根仍在模块侧（证据）：sectDiplomacy 的 import 里确实没有 saveSectDiplomacy() —— 所以 game-state 侧必须补旁账回灌，不能指望模块自己写');
    const qs = 读('js/quest/quest-system.js');
    const qimp = qs.slice(qs.indexOf("register('trackedQuests'"), qs.indexOf("register('trackedQuests'") + 700);
    ok(qimp.indexOf('saveTrackedQuests') < 0, 'C5c 同上：trackedQuests 的 import 里没有 saveTrackedQuests()');

    // C6 resetAll 的漏网键（有名字，供下一批）
    const 无reset = (全量.ctx.StateRegistry && 全量.ctx.StateRegistry.diagnostics)
        ? 全量.ctx.StateRegistry.diagnostics().filter(d => !d.hasReset).map(d => d.key) : [];
    eq(无reset.join(','), 'sectCrisis', 'C6 resetAll() 唯一漏掉的注册键 = sectCrisis（实测注册处在 js/sects/sect-crisis-engine.js:400，'
        + '只有 export/import 没有 reset ⇒ 新开局残留门派危机账。★该文件在本批禁改清单内，只报不改）');
}

// ================= [D] 注释真实性 =================
console.log('\n[D] ②批四条注释指向的 file:line 真的还在那个位置');
{
    // ②a beast-ecosystem.js 的「妖兽材料结算口」指针
    const be = 读('js/extensions/beast-ecosystem.js');
    ok(/battle\.js:5375/.test(be), 'D1a ②a 的注释现在写的是 battle.js:5375');
    ok(/settleLateMaterial/.test(行('js/battle.js', 5375)),
        'D1b ★battle.js:5375 现在真的是 settleLateMaterial 的守卫行（现读：' + 行('js/battle.js', 5375).trim().slice(0, 60) + '）');
    ok(!/battle\.js:5171\s*·\s*妖兽被打死结算时调/.test(be),
        'D1c ★旧的**指针**已改掉：注释里不再有「battle.js:5171 · 妖兽被打死结算时调…」这一行'
        + '（5171 这个数只作为「原注记写的是它」的说明留在括号里，不再是指向源码的指针）');
    ok(/_applyOnHitAftermath/.test(行('js/battle.js', 5171)),
        'D1d 反向钉住：battle.js:5171 确实是 _applyOnHitAftermath（证明 D1c 的更正是必要的，不是随手挪的数）');

    // ②b forging-compound.js 四跳链路
    const fc = 读('js/crafting/forging-compound.js');
    ok(/→ app\.js:10606 globalStartBattle/.test(fc) && !/app\.js:10607 globalStartBattle/.test(fc),
        'D2a ②b 的第二跳指针是 app.js:10606（10607 那个数只作为「原注记写的是它」的说明留在括号里，不再是指针）');
    ok(/type === 'beast' && extra/.test(行('js/app.js', 10606)), 'D2b ★app.js:10606 现在真的是接住第二参那行（现读：' + 行('js/app.js', 10606).trim().slice(0, 60) + '）');
    ok(/startBattle\('wild_beast', beastId\)/.test(行('js/app.js', 9476)), 'D2c ★app.js:9476 现在真的是 startBattle(\'wild_beast\', beastId)');
    ok(/_pinned = spawnOpts/.test(行('js/battle.js', 2184)), 'D2d ★battle.js:2184 现在真的是读 spawnOpts 点名那行');
    ok(/lookupBeastTemplate\(_pinned\)/.test(行('js/battle.js', 2186)), 'D2e ★battle.js:2186 现在真的是 lookupBeastTemplate 的调用行（注释里已注明实调在 2186）');
    ok(/enemyData\._beastTemplateId\s*=/.test(行('js/battle.js', 2403)), 'D2f ★battle.js:2403 现在真的是写 enemyData._beastTemplateId 那行（旧注记的 2390 是 physiologyType）');
    ok(/physiologyType: physiologyType/.test(行('js/battle.js', 2390)), 'D2g 反向钉住：battle.js:2390 确实是 physiologyType（证明 D2f 的更正是必要的，不是随手挪的）');
    ok(/this\._beastTemplateId = data\._beastTemplateId/.test(行('js/battle.js', 567)), 'D2h ★battle.js:567 现在真的是实体存下 _beastTemplateId 那行');
    ok(/settleLateMaterial === 'function'/.test(行('js/battle.js', 5375)), 'D2i ★battle.js:5375 仍是结算口守卫');
    ok(/var _lm = window\.ForgingCompound\.settleLateMaterial\('beast'/.test(行('js/battle.js', 5376)), 'D2j ★battle.js:5376 现在真的是 settleLateMaterial(\'beast\', …) 的实调行');
    ok(/name: this\.enemy\.name,/.test(行('js/battle.js', 5380)), 'D2k ★battle.js:5380 现在真的是把 name 传进去那一行（旧注记说 5363 = _consumeFormationBuff）');
    const wantId行 = fc.split(/\r?\n/).findIndex(l => /var wantId = c\.beastId/.test(l)) + 1;
    ok(wantId行 > 0 && /var wantId = c\.beastId/.test(行('js/crafting/forging-compound.js', wantId行)),
        'D2l ★ID 分支入口 var wantId = c.beastId 现在在 forging-compound.js:' + wantId行 + '（注释改用内容锚点，不再写死行号，所以本行随文件增删也不会失效）');

    // ②c beast-ability-live-node.js 的 C1 说明
    const bl = 读('tests/beast-ability-live-node.js');
    ok(/C1（beast-mechanic-families 模板数 ≥ 48 棘轮）/.test(bl), 'D3a ②c 的 C1 条目已改成「≥ 48 棘轮」的描述');
    ok(!/★真锁，但那个文件不在本批可写清单内/.test(bl), 'D3b 旧的「★真锁 / 不在可写清单内」说法已删');
    const bmf = 读('tests/beast-mechanic-families-node.js');
    ok(/var FLOOR = \{ templates: 48 \}/.test(bmf), 'D3c ★beast-mechanic-families-node.js 里 FLOOR.templates = 48 真的在（棘轮下限）');
    ok(/ok\(NOW\.templates >= FLOOR\.templates/.test(bmf), 'D3d ★C1 现在真的是 `NOW.templates >= FLOOR.templates`（棘轮，不是 === 48 的真锁）');
    // 「eq(NOW.templates, BEFORE.templates」这个串在文件里确实还有一处 —— 但它在**注释**里
    // （第 82 行「原判据：eq(NOW.templates, BEFORE.templates /* 48 */)」），
    // 那是前批留下的「改前判据」说明。所以这里只钉**可执行断言**那一行。
    const 断言行号 = bmf.split(/\r?\n/).findIndex(l => /^\s*ok\(NOW\.templates >= FLOOR\.templates,/.test(l)) + 1;
    ok(断言行号 > 0, 'D3e ★C1 的可执行断言确实只有 >= 那一行（beast-mechanic-families-node.js:' + 断言行号 + '）');
    ok(!/^\s*(ok|eq)\(\s*NOW\.templates\s*,\s*BEFORE\.templates/m.test(bmf),
        'D3e2 没有任何「可执行的」eq(NOW.templates, BEFORE.templates…) —— 文件里那处同名字符串只在注释里（改前判据的说明）');
    ok(fs.existsSync(path.join(ROOT, 'tests/beast-count-floor-node.js')), 'D3f 注释里点名的抓回归实验 tests/beast-count-floor-node.js 确实存在');
    const bn = 读('tests/beast-count-floor-node.js');
    ok(bn.indexOf('J2') < 0, 'D3g ★如实登记：beast-count-floor-node.js 里**没有 J2** —— '
        + 'beast-mechanic-families-node.js:265 注释点的「J2」是个不存在的锚点（照着找会走空）');
    ok(/predicate\(\{ templates: FLOOR\.templates - 1 \}, FLOOR\) === false/.test(bn),
        'D3h ★真正的抓回归实验在 **O 段**：把总数砍到下限以下，判据必须翻成 false（beast-count-floor-node.js 的 O 段，不是 J2）');

    // ②d sect-morale 批（本批禁改 js/sects/*，只钉住「真值在哪」，供下一批照单修注释）
    const ce = 读('js/sects/sect-crisis-events.js');
    ok(/门内还算安稳/.test(行('js/sects/sect-crisis-events.js', 491)),
        'D4a ★「门内还算安稳（morale 不塌）——才谈得上大考」现在在 sect-crisis-events.js:491（旧注释 :46 写的 :478 是江湖人面面台词，已走空）');
    ok(/与 :478 注释/.test(行('js/sects/sect-crisis-events.js', 46)),
        'D4b ★如实登记：sect-crisis-events.js:46 仍带着过时的 :478 指针 —— ★本批禁改 js/sects/*，只报不改，下一批照此行修');
    ok(/门内还算安稳/.test(ce), 'D4c 那句因果说明确实还在文件里（不是被删了，只是行号漂了）');
    ok(/ownSect/.test(行('js/sects/sect-crisis-engine.js', 256)),
        'D4d ★sect-crisis-engine.js:261 注释点的 :256 是对的（该行确有 ownSect 判断）—— 免得下一批把对的那条也一起改了');
    const sw2 = 读('js/sects/sect-visit.js');
    ok(/wireDaily/.test(sw2) === false, 'D4e ★sect-visit.js 里**没有** wireDaily —— sect-crisis-engine.js:262 注释说的「sect-visit.js:461 + :403 wireDaily」把文件都点错了（wireDaily 真身在 sect-crisis-engine.js:412）');
    ok(/wireDaily/.test(行('js/sects/sect-crisis-engine.js', 412)), 'D4f ★wireDaily 真身在 sect-crisis-engine.js:412');
}

// ================= [E] 工作树未被本套污染 =================
console.log('\n[E] 自查');
ok(读('js/core/game-state.js') === GS_SRC, 'E1 工作树 js/core/game-state.js 未被本套污染（C2 的注入全在内存里做）');
ok(读('js/sects/sect-visit.js').indexOf('saveSectDiplomacy') > 0, 'E2 js/sects/sect-visit.js 未被本套碰过（禁改清单）');

console.log('\n通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);