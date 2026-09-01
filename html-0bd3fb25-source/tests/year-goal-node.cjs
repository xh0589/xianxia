/**
 * year-goal-node.js — v19.0 批次 C 单元测试
 *
 * 覆盖：
 *   C1: 5 个目标 + choose + tickDay + 跨年结算
 *   C2: 进度计算（按 metric）
 *   C3: 结算奖励发放（灵石/贡献）
 *   C4: StateRegistry 持久化
 *
 * 运行：node tests/year-goal-node.js
 */
'use strict';

var path = require('path');
var fs = require('fs');
var vm = require('vm');

var mockWindow = {
    EventBus: null,
    showMessage: function () {},
    alert: function () {},
    console: console,
    Math: Math, JSON: JSON, Object: Object, Array: Array,
    document: { querySelector: function () { return null; } },
    timeSystem: { gameTime: { currentDay: 1, totalMinutes: 0 }, advanceTime: function () {} },
    inventory: { currency: { spiritStones: 100, copper: 0 } },
    activeTasks: [],
    discipleState: null,
    COMMON_RANKS: null,
    SECT_INTERNAL: {},
    currentCharData: { name: 'test', energy: 100, maxEnergy: 100, spiritStones: 100 },
    updateCurrencyUI: function () {},
    updateSectUI: function () {},
    updateCharacterStatus: function () {},
    updateTaskUI: function () {},
    getAbsoluteDay: function () { return mockWindow._absDay || 1; },
    getCurrentLocation: function () { return '帝都'; },
    getRealmIndex: function () { return 0; },
    addFame: function () {},
    addExp: function () {},
    showModal: function () {}
};
mockWindow._absDay = 1;
mockWindow.window = mockWindow;
mockWindow.global = mockWindow;
mockWindow.XianXia = mockWindow.XianXia || {};

var eventBusSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'core', 'event-bus.js'), 'utf8');
var stateRegSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'core', 'state-registry.js'), 'utf8');
var yrSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'sects', 'sect-year-goal.js'), 'utf8');

var ctx = vm.createContext(mockWindow);
vm.runInContext(eventBusSrc, ctx);
vm.runInContext(stateRegSrc, ctx);
vm.runInContext(yrSrc, ctx);
mockWindow.EventBus = ctx.EventBus;
mockWindow.StateRegistry = ctx.StateRegistry;
mockWindow.SectYearGoal = ctx.SectYearGoal;

// 注入 SECT_INTERNAL mock
mockWindow.SECT_INTERNAL['少林寺'] = {
    name: '少林寺', resources: 100, influence: 50, morale: 50, disciples: 20,
    meetings: [], policyBuffs: []
};
mockWindow.SECT_INTERNAL['武当派'] = {
    name: '武当派', resources: 100, influence: 60, morale: 60, disciples: 25,
    meetings: [], policyBuffs: []
};

var passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) { passed++; }
    else { failed++; console.error('[FAIL] ' + msg); }
}
function setDay(d) { mockWindow._absDay = d; }
function freshDs(rank) {
    return {
        isInSect: true, sectId: '少林寺',
        rank: rank, rankName: '外门弟子',
        contribution: 0, points: 0, level: 1, tasksCompleted: 0,
        joinTime: null, _gbFaction: null
    };
}

// ============ C1 5 个目标 ============
assert(mockWindow.SectYearGoal.SECT_YEAR_GOALS.length === 5, '5 个目标');
var goal = mockWindow.SectYearGoal.SECT_YEAR_GOALS[0];
assert(goal.id === 'expand_territory', '第 0 个是开疆拓土');

// ============ C2 choose ============
mockWindow.discipleState = freshDs(5);
setDay(1);
var r_c2 = mockWindow.SectYearGoal.choose('cultivate_disciples');
assert(r_c2 === true, 'choose 应成功');
var st = mockWindow.SectYearGoal._getStore()['少林寺'];
assert(st.goalId === 'cultivate_disciples', 'goalId 已设');
assert(st.year === 1, 'year=1');
assert(st.startedDay === 1, 'startedDay=1');

// 重复选：同一年已选 → choose 仍会改（简化版）
var r_c2_2 = mockWindow.SectYearGoal.choose('expand_territory');
assert(r_c2_2 === true, '二次选择覆盖');

// 未入宗
mockWindow.discipleState.isInSect = false;
var r_no = mockWindow.SectYearGoal.choose('expand_territory');
assert(r_no === false, '未入宗应拒');

// ============ C3 tickDay 进度推进 ============
mockWindow.discipleState = freshDs(5);
mockWindow.SECT_INTERNAL['少林寺'].disciples = 20;
setDay(1);
mockWindow.SectYearGoal.choose('cultivate_disciples');
st = mockWindow.SectYearGoal._getStore()['少林寺'];
assert(st.currentValue === 20, '基线值=20');

// 日结：disciples+10 → 进度 30/30 完成
setDay(2);
mockWindow.SECT_INTERNAL['少林寺'].disciples = 30;
mockWindow.SectYearGoal.tickDay('少林寺', 2);
st = mockWindow.SectYearGoal._getStore()['少林寺'];
assert(st.currentValue === 30, 'tickDay 后 currentValue=30');

// ============ C4 跨年检测（day 361 触发 settleYear）============
setDay(361);
mockWindow.SectYearGoal.tickDay('少林寺', 361);
st = mockWindow.SectYearGoal._getStore()['少林寺'];
assert(st.year === 2, '跨年到 year=2');
assert(st.history.length === 1, '历史 +1');
assert(st.history[0].completed === true, '历史 [0] 已完成');
assert(st.history[0].goalId === 'cultivate_disciples', '历史 [0] goalId');
assert(st.goalId === null, '新一年 goalId 重置');

// 未跨年（day 100）不应结算
setDay(100);
mockWindow.SectYearGoal.choose('expand_territory');
st = mockWindow.SectYearGoal._getStore()['少林寺'];
var histBefore = st.history.length;
setDay(150);
mockWindow.SectYearGoal.tickDay('少林寺', 150);
st = mockWindow.SectYearGoal._getStore()['少林寺'];
assert(st.history.length === histBefore, '未跨年不结算');

// ============ C5 奖励发放 ============
mockWindow.discipleState = freshDs(5);
mockWindow.discipleState.contribution = 0;
mockWindow.inventory.currency.spiritStones = 0;
setDay(1);
mockWindow.SECT_INTERNAL['少林寺'].disciples = 30; // 已达成
mockWindow.SectYearGoal.choose('cultivate_disciples');
var st3 = mockWindow.SectYearGoal._getStore()['少林寺'];
mockWindow.SectYearGoal.settleYear('少林寺', 1);
var st3after = mockWindow.SectYearGoal._getStore()['少林寺'];
assert(st3after.history[st3after.history.length - 1].completed === true, '已达成');
// cultivate_disciples 奖励：spiritStones: 3000, contribution: 100
assert(mockWindow.inventory.currency.spiritStones === 3000, '灵石奖励 3000');
assert(mockWindow.discipleState.contribution === 100, '贡献奖励 100');

// 未达成
mockWindow.inventory.currency.spiritStones = 0;
mockWindow.discipleState.contribution = 0;
setDay(2);
mockWindow.SECT_INTERNAL['少林寺'].disciples = 20;
mockWindow.SectYearGoal.choose('expand_territory'); // target=200
var st4 = mockWindow.SectYearGoal._getStore()['少林寺'];
mockWindow.SectYearGoal.settleYear('少林寺', 1);
assert(mockWindow.inventory.currency.spiritStones === 0, '未达成无奖励');

// ============ C6 StateRegistry 持久化 ============
setDay(10);
mockWindow.SectYearGoal.choose('grand_tournament');
var snap = mockWindow.StateRegistry.exportAll();
assert(snap.sectYearGoal && snap.sectYearGoal.data['少林寺'].goalId === 'grand_tournament', 'StateRegistry 含 year goal');
mockWindow.StateRegistry.resetAll();
var st5 = mockWindow.SectYearGoal._getStore()['少林寺'];
assert(!st5 || !st5.goalId, 'reset 后空');
mockWindow.StateRegistry.importAll(snap);
var st6 = mockWindow.SectYearGoal._getStore()['少林寺'];
assert(st6 && st6.goalId === 'grand_tournament', 'import 恢复');

// ============ C7 addTournamentWin / addAlly 钩子 ============
mockWindow.SectYearGoal.addTournamentWin('少林寺');
var st7 = mockWindow.SectYearGoal._getStore()['少林寺'];
assert(st7.tournamentWins === 1, 'tournamentWins=1');
mockWindow.SectYearGoal.addAlly('少林寺');
assert(st7.allies === 1, 'allies=1');

// ============ C8 getProgress / renderProgressCard ============
mockWindow.SECT_INTERNAL['少林寺'].disciples = 30;
setDay(20);
mockWindow.SectYearGoal.choose('cultivate_disciples');
var prog = mockWindow.SectYearGoal.getProgress('少林寺');
assert(prog > 0 && prog <= 1, 'progress 在 [0,1]');
var card = mockWindow.SectYearGoal.renderProgressCard('少林寺');
assert(card.indexOf('本年目标') >= 0, 'card 含本年目标');

// 未选目标时
mockWindow.StateRegistry.resetAll();
var card2 = mockWindow.SectYearGoal.renderProgressCard('少林寺');
assert(card2.indexOf('未选定') >= 0, '未选时显示"未选定"');

// ============ 收尾 ============
console.log('=========================================');
console.log('year-goal v19.0 batch-C: ' + passed + ' passed, ' + failed + ' failed');
console.log('=========================================');
if (failed > 0) process.exit(1);
