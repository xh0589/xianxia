/**
 * tests/play-quest-realm-retro-node.js
 * v25.1 · 试玩问题清单 P1c / P1d / P25 回归防护
 *
 * 为什么要有这一套（试玩问题清单.md 实测坐实的三条主线死账）：
 *   [1] P1c「先升到目标境界、再接那章任务」→ 该章主线永久卡 0/1：
 *       cultivation_realm 匹配要求事件 toLayer 精确等于目标层，人已在 3 层则事件永不再来。
 *       修法：acceptQuest 当场按 currentCharData.realm/layer 对账（同一条事件桥，合成精确负载）。
 *   [2] P1d 账本里没有的任务，模板不复位 → 卡「进行中」且无法重接：
 *       _syncTemplatesFromLedger 旧版是单向「灌」，两条都不命中就留着脏值，
 *       acceptQuest 的重复门再把重接顶回来——玩家无任何出路。修法：不命中一律复位。
 *   [3] P25 主线第 3 章《首次猎妖》kill 妖兽×5：野生妖兽名（赤炎狼/幽冥虎）不含「妖兽」二字，
 *       旧字符串互 contain 永远失配——猎妖入口（app.js huntWildBeasts）修好后杀再多也不计数。
 *       修法：目标为「妖兽/野兽」时认种系账（enemyType/species === 'beast'）。
 *
 * 手法：真 js/quest/quest-system.js 装进 vm 沙箱真跑（照 wave140 同款姿势），
 *       渲染函数静默掉（推进之后的刷屏不该有机会说话）。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');

let passed = 0, failed = 0;
function ok(c, m) { if (c) { passed++; console.log('  ✓ ' + m); } else { failed++; console.log('  [FAIL] ' + m); } }

const load = rel => fs.readFileSync(path.isAbsolute(rel) ? rel : path.join(ROOT, rel), 'utf8');

// 九境尺（与 js/data.js REALM_CONFIG.realms 同名单同顺序；getRealmIndex 在真游戏里来自 breakthrough-system.js）
const REALMS = ['炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'];
function 桩GetRealmIndex(name) { return REALMS.indexOf(name); } // 飞升/金仙/凡人 → -1，与真函数同款

function 建沙箱() {
    const listeners = {};
    const 账 = {};
    const 沙 = {
        console: { log() {}, warn() {}, error() {} },
        setTimeout, clearTimeout,
        localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
        saveToStorage: function (k, v) { try { this.localStorage.setItem(k, v); return true; } catch (e) { return false; } },
        showMessage: () => {},
        getRealmIndex: 桩GetRealmIndex,
    };
    沙.window = 沙; 沙.globalThis = 沙; 沙.global = 沙;
    const 宽松 = () => ({
        innerHTML: '', textContent: '', className: '', value: '', id: '',
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
        content: { firstChild: null },
    });
    沙.document = {
        getElementById: () => 宽松(), querySelector: () => 宽松(), querySelectorAll: () => [],
        createElement: () => 宽松(), createDocumentFragment: () => 宽松(),
        body: 宽松(), documentElement: 宽松(),
        addEventListener() {}, removeEventListener() {},
    };
    沙.EventBus = {
        on(type, fn) { (listeners[type] = listeners[type] || []).push(fn); },
        emit(type, data) { (listeners[type] || []).forEach(fn => fn(data)); },
    };
    vm.createContext(沙);
    vm.runInContext(load('js/quest/quest-system.js'), 沙, { filename: 'js/quest/quest-system.js' });
    // 推进之后的下游渲染不许说话（wave140 踩坑记录：裸 vm 没有 HTML 解析器，tpl.content.firstChild 必炸）
    vm.runInContext([
        'updateQuestUI = function () {};', 'updateQuestTracker = function () {};',
        'updateMainQuestUI = function () {};', 'updateDailyQuestUI = function () {};',
        'updateRandomQuestUI = function () {};', 'updateNpcQuestUI = function () {};',
    ].join(' '), 沙);
    // playerQuestProgress 是模块内 let——沙箱对象上拿不到，只能在同上下文里跑语句改它
    const run = (code) => vm.runInContext(code, 沙);
    return { 沙, listeners, 册: 沙.QuestRegistry, run };
}

function 造题(册, id, objectives) {
    const q = { id, title: '测试题·' + id, type: 'main', description: '', objectives, accepted: false, turnedIn: false, completed: false };
    册.register(q);
    return q;
}

console.log('\n========== v25.1 · P1c/P1d/P25 任务主线死账回归 ==========');

// ============ [1] P1c：接取当场对账既成境界 ============
console.log('\n[1] P1c 先升到目标境界、再接那章任务');
{
    const { 沙, 册 } = 建沙箱();
    const q = 造题(册, 'retro_realm_3', [{ type: 'cultivation_realm', realm: '炼气', layer: 3, count: 1, completed: false, currentCount: 0 }]);
    沙.currentCharData = { realm: '炼气', layer: 3 };
    const r = 沙.acceptQuest('retro_realm_3');
    ok(r === true, '1a 接取成功');
    ok(q.objectives[0].completed === true, '1b 人已在炼气3层 → 接取当场对账 1/1（旧行为：永久 0/1）');
    ok(q.completed === true, '1c 目标全满 → 任务级 completed 置真（交付按钮门槛）');
}
{   // 反例：层数不足不回溯
    const { 沙, 册 } = 建沙箱();
    const q = 造题(册, 'retro_realm_no', [{ type: 'cultivation_realm', realm: '炼气', layer: 3, count: 1, completed: false, currentCount: 0 }]);
    沙.currentCharData = { realm: '炼气', layer: 2 };
    沙.acceptQuest('retro_realm_no');
    ok(q.objectives[0].completed === false, '1d 反例：炼气2层对「炼气3层」不回溯（不许放水）');
}
{   // 更高境界视为已达成
    const { 沙, 册 } = 建沙箱();
    const q = 造题(册, 'retro_realm_over', [{ type: 'cultivation_realm', realm: '炼气', layer: 3, count: 1, completed: false, currentCount: 0 }]);
    沙.currentCharData = { realm: '筑基', layer: 1 };
    沙.acceptQuest('retro_realm_over');
    ok(q.objectives[0].completed === true, '1e 筑基1层对「炼气3层」→ 已达成，回溯记账');
}
{   // breakthrough_realm 同款回溯
    const { 沙, 册 } = 建沙箱();
    const q = 造题(册, 'retro_bt', [{ type: 'breakthrough_realm', fromRealm: '炼气', toRealm: '筑基', count: 1, completed: false, currentCount: 0 }]);
    沙.currentCharData = { realm: '筑基', layer: 1 };
    沙.acceptQuest('retro_bt');
    ok(q.objectives[0].completed === true, '1f 已筑基再接「突破至筑基」→ 回溯记账');
    const { 沙: 沙2, 册: 册2 } = 建沙箱();
    const q2 = 造题(册2, 'retro_bt_no', [{ type: 'breakthrough_realm', fromRealm: '炼气', toRealm: '筑基', count: 1, completed: false, currentCount: 0 }]);
    沙2.currentCharData = { realm: '炼气', layer: 9 };
    沙2.acceptQuest('retro_bt_no');
    ok(q2.objectives[0].completed === false, '1g 反例：还在炼气 →「突破至筑基」不回溯');
}
{   // 九境之外（飞升/凡人，getRealmIndex=-1）不炸不溯
    const { 沙, 册 } = 建沙箱();
    const q = 造题(册, 'retro_feisheng', [{ type: 'cultivation_realm', realm: '炼气', layer: 3, count: 1, completed: false, currentCount: 0 }]);
    沙.currentCharData = { realm: '飞升', layer: 1 };
    let 炸 = null;
    try { 沙.acceptQuest('retro_feisheng'); } catch (e) { 炸 = e; }
    ok(炸 === null, '1h 飞升期接任务不抛异常（getRealmIndex=-1 有守卫）');
    ok(q.objectives[0].completed === false, '1i 九境尺查无此境 → 不走回溯（留给事件桥正门）');
}

// ============ [2] P1d：账本不命中 → 模板一律复位 ============
console.log('\n[2] P1d 账本里没有的任务，模板必须复位');
{
    const { 沙, 册, run } = 建沙箱();
    const q = 造题(册, 'ghost_quest', [{ type: 'kill', target: '妖兽', count: 5, completed: true, currentCount: 5 }]);
    沙.allQuests.push(q);   // _syncTemplatesFromLedger 遍历 allQuests（window.allQuests 同引用）
    q.accepted = true; q.completed = true; q.turnedIn = true;   // 脏值：账本里没有它
    run('playerQuestProgress.activeQuests = []; playerQuestProgress.completedQuests = []; playerQuestProgress.questState = {};');
    沙._syncTemplatesFromLedger();
    ok(q.accepted === false && q.completed === false && q.turnedIn === false, '2a 账本两条都不命中 → accepted/completed/turnedIn 全复位');
    ok(q.objectives[0].currentCount === 0 && q.objectives[0].completed === false, '2b 目标计数归零（旧行为：卡「进行中」且重复门顶死重接）');
}
{   // 反例：账本内且已满的目标保持原状
    const { 沙, 册, run } = 建沙箱();
    const q = 造题(册, 'live_quest', [{ type: 'kill', target: '妖兽', count: 5, completed: true, currentCount: 5 }]);
    沙.allQuests.push(q);
    q.accepted = false;
    run("playerQuestProgress.activeQuests = ['live_quest']; playerQuestProgress.completedQuests = [];"
        + "playerQuestProgress.questState = { live_quest: { objectives: [{ currentCount: 5, completed: true }] } };");
    沙._syncTemplatesFromLedger();
    ok(q.accepted === true, '2c 账本命中 → accepted 置回');
    ok(q.objectives[0].currentCount === 5 && q.objectives[0].completed === true, '2d 反例护栏：账本内已满的目标不被复位误伤');
}

// ============ [3] P25：「妖兽」目标认种系账 ============
console.log('\n[3] P25 kill 妖兽 认 beast 种系（猎妖入口杀的兽要计数）');
{
    const { 沙 } = 建沙箱();
    const obj = { type: 'kill', target: '妖兽', count: 5 };
    ok(沙.questObjectiveMatches(obj, 'enemy:defeated', { enemyId: '赤炎狼', enemyType: 'beast', species: 'beast', tags: [] }) === true,
        '3a 野生妖兽（名字不含「妖兽」二字）命中「妖兽」目标');
    ok(沙.questObjectiveMatches(obj, 'enemy:defeated', { enemyId: '攻山妖兽', enemyType: 'beast', species: 'beast', tags: [] }) === true,
        '3b 名字带「妖兽」的照旧命中（旧行为不回退）');
    ok(沙.questObjectiveMatches(obj, 'enemy:defeated', { enemyId: '山贼头目', enemyType: 'enemy', species: 'human', tags: [] }) === false,
        '3c 反例：山贼不误伤「妖兽」目标');
    const obj2 = { type: 'kill', target: '铁山', count: 1 };
    ok(沙.questObjectiveMatches(obj2, 'enemy:defeated', { enemyId: '铁山', enemyType: 'enemy', species: 'human', tags: [] }) === true,
        '3d 具名击杀目标不受种系桥影响');
}

console.log('\n========== 小结：通过 ' + passed + ' / 失败 ' + failed + ' ==========');
process.exit(failed > 0 ? 1 : 0);
