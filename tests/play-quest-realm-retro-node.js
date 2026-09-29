/**
 * tests/play-quest-realm-retro-node.js
 * 试玩批次 · 「先升到目标境界、再接那章任务」死锁的回归防护（对应 P1c）
 *
 * 病根（2026-09-29 实机试玩坐实）：
 *   玩家先打坐+演武场把炼气肝到 3 层，再去接主线第 2 章《炼气筑基》——
 *   而该章目标正是 cultivation_realm 炼气3层。
 *   questObjectiveMatches(:2081) 要求突破事件的 toLayer 精确等于目标 layer，
 *   人已在 3 层 ⇒ 那个事件永远不来；升到 4 层又因 !== 3 而不匹配 ⇒ 0/1 永久卡死。
 *   acceptQuest 的 NEW-21 追溯块(:534-542) 此前只认 join_sect 一种 type，漏了这两类。
 *
 * 修法：acceptQuest 接取当场按 currentCharData.realm/layer 对账这两类目标
 *       （不另立规则，走同一条 advanceQuestObjectivesFromEvent 事件桥）。
 *
 * 手法：真 js/quest/quest-system.js 装进 vm 沙箱真跑（沿用 wave140 那套"宽松 DOM"桩，
 *      不让下游渲染搅局——那一步连栽过三次，见该文件 :55-112 的注释）。
 * ⚠️ 本套 0 条真 Chrome 屏证：读的都是沙箱返回值。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');

let passed = 0, failed = 0;
function ok(c, m) { if (c) { passed++; console.log('  ✓ ' + m); } else { failed++; console.log('  [FAIL] ' + m); } }
function eq(a, b, m) { ok(a === b, m + '（实际=' + JSON.stringify(a) + ' 期望=' + JSON.stringify(b) + '）'); }
const load = rel => {
    const p = path.isAbsolute(rel) ? rel : path.join(ROOT, rel);
    return fs.readFileSync(p, 'utf8');
};

// ============ 沙箱：真源码 + 宽松 DOM + 桩 EventBus/QuestRegistry ============
function 建沙箱(初始境界, 初始层) {
    const listeners = {};
    const 账 = {};
    const 宽松 = () => ({
        innerHTML: '', textContent: '', className: '', value: '', id: '', href: '',
        style: new Proxy({}, { get: () => '', set: () => true }),
        dataset: new Proxy({}, { get: () => '', set: () => true }),
        classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
        children: [], childNodes: [], firstChild: null, lastChild: null, parentNode: null,
        appendChild() {}, removeChild() {}, insertBefore() {}, replaceChild() {},
        remove() {}, setAttribute() {}, getAttribute: () => null, removeAttribute() {},
        addEventListener() {}, removeEventListener() {}, dispatchEvent() {},
        querySelector: () => 宽松(), querySelectorAll: () => [], closest: () => null,
        getBoundingClientRect: () => ({ top: 0, left: 0, width: 0, height: 0 }),
        scrollIntoView() {}, focus() {}, blur() {}, click() {},
    });
    const 沙 = {
        console: { log() {}, warn() {}, error() {} },
        setTimeout, clearTimeout,
        localStorage: { _d: {}, getItem(k) { return this._d[k] === undefined ? null : this._d[k]; }, setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; } },
        saveToStorage: function (k, v) { try { this.localStorage.setItem(k, v); return true; } catch (e) { return false; } },
        currentCharData: { realm: 初始境界, layer: 初始层, essence: 0, tempering: 0, qi: 100, maxQi: 100 },
        // acceptQuest 尾部要报一句"接取任务：X"（quest-system.js:588），不给桩整条路走不完
        showMessage: function () {},
        updateCharacterStatus: function () {},
    };
    沙.window = 沙; 沙.globalThis = 沙; 沙.global = 沙;
    沙.document = {
        getElementById: () => 宽松(), querySelector: () => 宽松(), querySelectorAll: () => [],
        createElement: () => 宽松(), createDocumentFragment: () => 宽松(),
        body: 宽松(), documentElement: 宽松(), addEventListener() {}, removeEventListener() {},
    };
    沙.EventBus = {
        on(type, fn) { (listeners[type] = listeners[type] || []).push(fn); },
        emit(type, data) { (listeners[type] || []).forEach(fn => { try { fn(data); } catch (e) { throw e; } }); },
    };
    沙.QuestRegistry = {
        get(id) { return 账[id] || null; },
        all() { return Object.keys(账).map(k => 账[k]); },
        register(q) { 账[q.id] = q; },
    };
    vm.createContext(沙);
    vm.runInContext(load('js/quest/quest-system.js'), 沙, { filename: 'js/quest/quest-system.js' });
    // 静默下游渲染：推进在 :2136 之前，渲染不参与置位判定（沿用 wave140 的判例）。
    // acceptQuest 尾部固定刷这 5 个 UI（quest-system.js:589-595），
    // 它们一路摸到 renderXEmpty 等全局渲染助手——**照清单一次静默，别一个个试出来**
    // （我先漏了 updateRandomQuestUI、再漏 updateNpcQuestUI，连栽两次才读完 :589-595）。
    try {
        vm.runInContext([
            'updateQuestUI = function () {};',
            'updateQuestTracker = function () {};',
            'updateMainQuestUI = function () {};',
            'updateDailyQuestUI = function () {};',
            'updateRandomQuestUI = function () {};',
            'updateNpcQuestUI = function () {};',
        ].join('\n'), 沙);
    } catch (e) { /* 让断言自己说话 */ }
    return { 沙, listeners, 真册: 沙.QuestRegistry };
}

// 铺一条主线任务（走真注册表，桩册没用——见 wave140 :96-99 的注释）
function 铺题(册, id, objectives) {
    const q = {
        id, title: '炼气筑基', type: 'main',
        description: '修炼功法，突破到炼气期三层，为筑基做准备。',
        objectives, accepted: false, turnedIn: false, completed: false,
        rewards: { exp: 300, spiritStones: 300 },
    };
    册.register(q);
    return q;
}

console.log('【试玩批次·P1c】先升到目标境界再接任务，不该再死锁\n');

// ============ [1] 病态重现：已在炼气3层，接 main_002（目标炼气3层）============
console.log('[1] 已在炼气3层时接取 main_002（目标 cultivation_realm 炼气3层）');
{
    const { 沙, 真册 } = 建沙箱('炼气', 3);
    const q = 铺题(真册, 'main_002', [
        { type: 'cultivation_realm', realm: '炼气', layer: 3, count: 1, completed: false },
    ]);
    沙.acceptQuest('main_002');
    const o = q.objectives[0];
    eq(o.completed, true, '现状已达标 → 接取当场回溯，目标 completed 置上');
    eq(o.currentCount, 1, '计数补成 1');
    eq(q.completed, true, '整条任务升 completed（可交付）');
    ok(真册.get('main_002').accepted === true, '任务标记为已接取');
}

// ============ [2] 反例：没到目标境界时不该误判完成 ============
console.log('\n[2] 只有炼气1层时接取 main_002（不应被回溯）');
{
    const { 沙, 真册 } = 建沙箱('炼气', 1);
    const q = 铺题(真册, 'main_002', [
        { type: 'cultivation_realm', realm: '炼气', layer: 3, count: 1, completed: false },
    ]);
    沙.acceptQuest('main_002');
    eq(q.objectives[0].completed, false, '尚未达标 → 保持未完成');
    eq(q.completed, false, '整条任务不应升 completed');
}

// ============ [3] 跨境界目标：已筑基时接「突破至金丹」 ============
console.log('\n[3] 已在筑基2层时接取 breakthrough_realm 金丹 的任务');
{
    const { 沙, 真册 } = 建沙箱('筑基', 2);
    const q = 铺题(真册, 'main_010', [
        { type: 'breakthrough_realm', toRealm: '金丹', count: 1, completed: false },
    ]);
    沙.acceptQuest('main_010');
    eq(q.objectives[0].completed, false, '还没到金丹 → 不回溯');
}

console.log('\n[4] 已在金丹1层时接取 breakthrough_realm 金丹 的任务');
{
    const { 沙, 真册 } = 建沙箱('金丹', 1);
    const q = 铺题(真册, 'main_010', [
        { type: 'breakthrough_realm', toRealm: '金丹', count: 1, completed: false },
    ]);
    沙.acceptQuest('main_010');
    eq(q.objectives[0].completed, true, '已在金丹 → 回溯补上');
}

// ============ [5] 边界：同境界但层数不够，不该算达成 ============
console.log('\n[5] 炼气2层时接「炼气3层」（层数不足，不算达标）');
{
    const { 沙, 真册 } = 建沙箱('炼气', 2);
    const q = 铺题(真册, 'main_002', [
        { type: 'cultivation_realm', realm: '炼气', layer: 3, count: 1, completed: false },
    ]);
    沙.acceptQuest('main_002');
    eq(q.objectives[0].completed, false, '层数不足 → 不回溯');
}

// ============ [6] 回归护栏：join_sect 的旧路径仍生效 ============
console.log('\n[6] 已在门派里时接 join_sect 任务（旧 NEW-21 行为不能被改坏）');
{
    const { 沙, 真册 } = 建沙箱('炼气', 1);
    沙.discipleState = { isInSect: true, sectId: '少林寺', rank: 7, rankName: '杂役弟子' };
    const q = 铺题(真册, 'main_001', [
        { type: 'join_sect', sectId: null, count: 1, completed: false },
    ]);
    沙.acceptQuest('main_001');
    eq(q.objectives[0].completed, true, '已在门派 → join_sect 仍能回溯');
}

// ============ [7] 无角色时不得抛 ============
console.log('\n[7] currentCharData 为空时接取 realm 类目标（不得抛）');
{
    const { 沙, 真册 } = 建沙箱('炼气', 1);
    沙.currentCharData = null;
    const q = 铺题(真册, 'main_002', [
        { type: 'cultivation_realm', realm: '炼气', layer: 3, count: 1, completed: false },
    ]);
    let threw = null;
    try { 沙.acceptQuest('main_002'); } catch (e) { threw = String(e); }
    ok(threw === null, '无角色时不抛异常' + (threw ? '（实际抛出：' + threw + '）' : ''));
}

// ============ [8] 账本→模板 必须双向（PLAY-1d）============
console.log('\n[8] 账本里没有的任务，模板必须被复位（否则卡在进行中且无法重接）');
{
    const { 沙, 真册 } = 建沙箱('炼气', 3);

    // ⚠️ 用**真题册**里的 main_001 / main_002，别自己 register：
    //    findQuestById 走的是真注册表，我再 register 一遍同名题会拿到另一个对象，
    //    脏值设不上去（我为此白跑一轮：断言全反，allQuests 实为 13 条真题）。
    const 真题 = vm.runInContext("({q1: findQuestById('main_001'), q2: findQuestById('main_002')})", 沙);
    ok(!!(真题.q1 && 真题.q2), '真题册里有 main_001 与 main_002');

    // 账本：只有 main_001，且它的目标已满
    vm.runInContext([
        "playerQuestProgress.activeQuests = ['main_001'];",
        'playerQuestProgress.completedQuests = [];',
        'playerQuestProgress.questState = { main_001: { objectives: [{ currentCount: 1, completed: true }] } };',
        // 人为把 main_002 弄脏：accepted=true 但账本没它（实测病态）
        "var _q2 = findQuestById('main_002'); _q2.accepted = true; _q2.objectives[0].currentCount = 0; _q2.objectives[0].completed = false;",
    ].join('\n'), 沙);

    const 脏 = vm.runInContext("({q1: findQuestById('main_001').accepted, q2: findQuestById('main_002').accepted})", 沙);
    eq(脏.q2, true, '前置：main_002 已被弄脏（accepted=true 而账本没它）');

    vm.runInContext('_syncTemplatesFromLedger();', 沙);

    const q1 = vm.runInContext("findQuestById('main_001')", 沙);
    const q2 = vm.runInContext("findQuestById('main_002')", 沙);
    eq(q1.accepted, true, '账本内的 main_001 保持已接取');
    eq(q2.accepted, false, '账本外的 main_002 被复位为未接取（关键）');
    eq(q2.objectives[0].completed, false, '其目标一并复位');
    eq(q2.objectives[0].currentCount, 0, '其计数归零');

    // 复位后必须能重接，且这次会走回溯（已在炼气3层）
    vm.runInContext("window.acceptQuest('main_002')", 沙);
    const q2b = vm.runInContext("findQuestById('main_002')", 沙);
    eq(q2b.accepted, true, '复位后可重新接取');
    eq(q2b.objectives[0].completed, true, '重接时回溯生效（已在 3 层）');
    eq(q2b.completed, true, '整条升 completed，可交付');
}

console.log('\n────────────────────────');
console.log('通过 ' + passed + ' / 失败 ' + failed);
if (failed) { console.log('本套有断言未通过 ❌'); process.exit(1); }
console.log('本套全绿 ✅');
