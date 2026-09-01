/**
 * tournament-node.js — v19.1 批次 A+B+C 单元测试
 *
 * 覆盖：
 *   A: openTournament / joinTournament / runTournament / getTournamentStatus / getTournamentHistory + StateRegistry
 *   B: NPC 真实参赛（power 算法 + 势力调整）
 *   C: 玩家参与 + addTournamentWin 钩 + 真实宗门影响
 *
 * 运行：node tests/tournament-node.js
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
    SECT_DEEP_DATA: {},
    SECT_INTERNAL: {},
    currentCharData: null,
    updateCurrencyUI: function () {},
    updateSectUI: function () {},
    updateCharacterStatus: function () {},
    updateTaskUI: function () {},
    getAbsoluteDay: function () { return mockWindow._absDay || 1; },
    getCurrentLocation: function () { return '帝都'; },
    getRealmIndex: function () { return 0; },
    addFame: function () {},
    addExp: function () {},
    showModal: function () {},
    npcManager: null,
    SectYearGoal: null
};
mockWindow._absDay = 1;
mockWindow.window = mockWindow;
mockWindow.global = mockWindow;
mockWindow.XianXia = mockWindow.XianXia || {};

var eventBusSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'core', 'event-bus.js'), 'utf8');
var stateRegSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'core', 'state-registry.js'), 'utf8');
var commonRanksSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'sects', 'sects-deep-data.js'), 'utf8');
var sectsSysSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'sects', 'sects-system.js'), 'utf8');
var sectsInternalSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'sects', 'sect-internal.js'), 'utf8');
var tournamentSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'sects', 'sect-tournament.js'), 'utf8');

var ctx = vm.createContext(mockWindow);
vm.runInContext(eventBusSrc, ctx);
vm.runInContext(stateRegSrc, ctx);
vm.runInContext(commonRanksSrc, ctx);
vm.runInContext(sectsSysSrc, ctx);
vm.runInContext(sectsInternalSrc, ctx);
vm.runInContext(tournamentSrc, ctx);

mockWindow.EventBus = ctx.EventBus;
mockWindow.StateRegistry = ctx.StateRegistry;
mockWindow.COMMON_RANKS = ctx.COMMON_RANKS;
mockWindow.processAllSectDailyEconomy = ctx.processAllSectDailyEconomy;
mockWindow.Tournament = ctx.Tournament;
mockWindow.getPlayerSectRole = ctx.getPlayerSectRole;
mockWindow.openTournament = ctx.Tournament && ctx.Tournament.openTournament;
mockWindow.joinTournament = ctx.Tournament && ctx.Tournament.joinTournament;
mockWindow.runTournament = ctx.Tournament && ctx.Tournament.runTournament;
mockWindow.playerParticipate = ctx.Tournament && ctx.Tournament.playerParticipate;
mockWindow.getTournamentStatus = ctx.Tournament && ctx.Tournament.getTournamentStatus;
mockWindow.getTournamentHistory = ctx.Tournament && ctx.Tournament.getTournamentHistory;
mockWindow.Tournament_tickDay = ctx.Tournament && ctx.Tournament.tickDay;

// 注入 SECT_INTERNAL
function injectSectMock() {
    if (!mockWindow.SECT_INTERNAL) mockWindow.SECT_INTERNAL = {};
    if (mockWindow.SECT_INTERNAL['少林寺']) return;
    Object.keys(mockWindow.SECT_INTERNAL).forEach(function (k) { delete mockWindow.SECT_INTERNAL[k]; });
    mockWindow.SECT_INTERNAL['少林寺'] = { name: '少林寺', resources: 1000, influence: 50, morale: 50, disciples: 20 };
    mockWindow.SECT_INTERNAL['武当派'] = { name: '武当派', resources: 500, influence: 60, morale: 60, disciples: 18 };
}
injectSectMock();

// SECT_YEAR_GOAL 钩（v19.0）
var addTournamentWinCount = 0;
mockWindow.SectYearGoal = { addTournamentWin: function () { addTournamentWinCount++; } };

// npcManager
mockWindow.npcManager = {
    getNPC: function (id) {
        var all = this.getAllNPCs();
        return all.find(function (n) { return n.id === id; }) || null;
    },
    getAllNPCs: function () {
        return [
            { id: 'a', name: '甲', location: '少林寺', combat: { realm: '炼气', layer: 5, attack: 20, defense: 15, health: 100 } },
            { id: 'b', name: '乙', location: '少林寺', combat: { realm: '炼气', layer: 6, attack: 22, defense: 18, health: 110 } },
            { id: 'c', name: '丙', location: '少林寺', combat: { realm: '炼气', layer: 4, attack: 18, defense: 12, health: 90 } },
            { id: 'd', name: '丁', location: '少林寺', combat: { realm: '筑基', layer: 1, attack: 35, defense: 28, health: 200 } },
            { id: 'e', name: '外派戊', location: '武当派', combat: { realm: '炼气', layer: 5, attack: 20, defense: 15, health: 100 } }
        ];
    }
};

// getSectNPCs 仿真
function getSectNPCs(sectName) {
    return mockWindow.npcManager.getAllNPCs().filter(function (n) { return n.location === sectName; });
}
mockWindow.getSectNPCs = getSectNPCs;

var passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) { passed++; }
    else { failed++; console.error('[FAIL] ' + msg); }
}
function setDay(d) { mockWindow._absDay = d; }
function freshDs(rank, sect) {
    return {
        isInSect: true, sectId: sect || '少林寺',
        rank: rank, rankName: '外门弟子',
        contribution: 0, points: 0, level: 1, tasksCompleted: 0,
        joinTime: null, _gbFaction: null
    };
}

// ============ 批次 A：openTournament + joinTournament + runTournament ============

// 1) 弟子开不了
mockWindow.discipleState = freshDs(5, '少林寺');
setDay(1);
var r1 = mockWindow.openTournament('少林寺', 'season');
assert(r1 === null, '弟子开不了大比');

mockWindow.discipleState = freshDs(0, '少林寺'); // 掌门
var ev1 = mockWindow.openTournament('少林寺', 'season');
assert(ev1 && ev1.tier === 'season', '掌门开小比 OK');
assert(ev1.status === 'open', '初始状态 open');
assert(ev1.contestants.length === 0, '初始 0 参赛');

// 2) 重复开
var ev1_dup = mockWindow.openTournament('少林寺', 'year');
assert(ev1_dup === null, '已有赛事时不能开新赛事');

// 3) NPC 报名
var r3a = mockWindow.joinTournament(ev1.id, 'a');
var r3b = mockWindow.joinTournament(ev1.id, 'b');
var r3c = mockWindow.joinTournament(ev1.id, 'c');
var r3d = mockWindow.joinTournament(ev1.id, 'd');
assert(r3a && r3b && r3c && r3d, '4 NPC 报名');
assert(mockWindow.getTournamentStatus(ev1.id).contestants.length === 4, 'contestants 4');

// 4) 重复报名应拒
var r3_dup = mockWindow.joinTournament(ev1.id, 'a');
assert(r3_dup === false, '重复报名应拒');

// 5) 外部 sect NPC 不能报
var r3_outsider = mockWindow.joinTournament(ev1.id, 'e');
assert(r3_outsider === false, '外派 NPC 不能报名');

// 6) runTournament < 2 人
var ev2 = mockWindow.openTournament('少林寺', 'year'); // null（已有赛事）
assert(ev2 === null, '已存在赛事');
// 改测：取消后开新赛事但 < 2 人
var st1 = mockWindow.Tournament._store();
st1['少林寺'].currentEvent = null;
var ev3 = mockWindow.openTournament('少林寺', 'year');
mockWindow.joinTournament(ev3.id, 'a');
var r6 = mockWindow.runTournament(ev3.id);
assert(r6 === null, '< 2 人应拒');

// ============ 批次 B：runTournament 真实战斗 ============

// 7) 4 NPC 2 轮出冠军
hardReset();
mockWindow.discipleState = freshDs(0, '少林寺');
setDay(2);
var ev4 = mockWindow.openTournament('少林寺', 'season');
assert(ev4 && ev4.tier === 'season', '4 NPC 出冠军');
mockWindow.joinTournament(ev4.id, 'a');
mockWindow.joinTournament(ev4.id, 'b');
mockWindow.joinTournament(ev4.id, 'c');
mockWindow.joinTournament(ev4.id, 'd');
var res4 = mockWindow.runTournament(ev4.id);
assert(res4 && res4.winner, '4 NPC 出冠军');
assert(['a', 'b', 'c', 'd'].indexOf(res4.winner.id) >= 0, '冠军在 4 NPC 中');
assert(res4.totalRounds === 2, '4 NPC 2 轮 (2 -> 1)');

// 8) bracket 记录
var st4 = mockWindow.Tournament._store()['少林寺'];
assert(st4.history.length === 1, 'history +1 (实际 ' + st4.history.length + ')');
var h = st4.history[0];
assert(h.winnerId === res4.winner.id, 'history 记录 winnerId');
assert(h.contestants === 4, 'history 记录 4 参赛');
assert(h.tier === 'season', 'history 记录 tier');

// 9) 实力差异：筑基 d 必胜炼气
hardReset();
mockWindow.discipleState = freshDs(0, '少林寺');
setDay(3);
var ev5 = mockWindow.openTournament('少林寺', 'year');
mockWindow.joinTournament(ev5.id, 'a'); // 炼气
mockWindow.joinTournament(ev5.id, 'd'); // 筑基
var res5 = mockWindow.runTournament(ev5.id);
assert(res5.winner.id === 'd', '实力差应筑基胜（实际 ' + res5.winner.id + '）');

// ============ 批次 C：玩家参与 + 宗门影响 ============
function resetCurrent() {
    var st = mockWindow.Tournament._store();
    if (st['少林寺']) st['少林寺'].currentEvent = null;
}

// 10) 玩家作为弟子参赛
mockWindow.discipleState = freshDs(0, '少林寺'); // 掌门先开赛事
setDay(10);
addTournamentWinCount = 0;
mockWindow.SECT_INTERNAL['少林寺'].resources = 1000;
mockWindow.SECT_INTERNAL['少林寺'].morale = 50;
mockWindow.currentCharData = { name: '玩家', realm: '筑基', layer: 5, health: 100, maxHealth: 100, qi: 100, maxQi: 100 };
resetCurrent();
var ev6 = mockWindow.openTournament('少林寺', 'season');
assert(ev6, '掌门开 ev6');
// 玩家降为弟子参赛
mockWindow.discipleState = freshDs(5, '少林寺'); // 弟子
var pJoin = mockWindow.playerParticipate(ev6.id);
assert(pJoin === true, '弟子可参赛');
var st6 = mockWindow.getTournamentStatus(ev6.id);
assert(st6.contestants.some(function (c) { return c.type === 'player'; }), '玩家在 contestants');
mockWindow.joinTournament(ev6.id, 'a');
mockWindow.joinTournament(ev6.id, 'd');
mockWindow.runTournament(ev6.id);
var h6 = mockWindow.Tournament._store()['少林寺'].history[st6.contestants.length === 3 ? 0 : 0]; // 取最新一条
// 宗门影响
assert(mockWindow.SECT_INTERNAL['少林寺'].morale >= 60, 'morale 提升（50+5+10=65）');
assert(mockWindow.SECT_INTERNAL['少林寺'].resources === 1100, '资源+100');

// 11) addTournamentWin 钩被调
assert(addTournamentWinCount >= 1, 'addTournamentWin 钩被调（≥1）');

// 12) 侍妾不可参赛
hardReset();
mockWindow.discipleState = freshDs(0, '少林寺'); // 掌门开
var ev7 = mockWindow.openTournament('少林寺', 'season');
mockWindow.joinTournament(ev7.id, 'a');
mockWindow.joinTournament(ev7.id, 'b');
mockWindow.discipleState.rank = -1; // 侍妾
var pReject = mockWindow.playerParticipate(ev7.id);
assert(pReject === false, '侍妾不可参赛');

// ============ 批次 D：tickDay 周期调度 ============

// ============ 批次 D：tickDay 周期调度 ============

function hardReset() {
    mockWindow.StateRegistry.resetAll();
    injectSectMock();
    var st = mockWindow.Tournament._store();
    Object.keys(st).forEach(function (k) { st[k].currentEvent = null; st[k].lastSeason = 0; st[k].lastYear = 0; st[k].history = []; });
}

// 13) day=90 自动开小比（需掌门在场）
hardReset();
// 注意：discipleState 必须在 scripts 加载后设置（sects-system.js 末尾会覆盖 window.discipleState）
mockWindow.discipleState = freshDs(0, '少林寺'); // 掌门
setDay(90);
mockWindow.Tournament_tickDay('少林寺', 90);
var st90 = mockWindow.Tournament._store()['少林寺'];
assert(st90.currentEvent && st90.currentEvent.tier === 'season', 'day=90 自动开小比');
assert(st90.lastSeason === 90, 'lastSeason=90 (实际 ' + st90.lastSeason + ')');
// 应自动报名 NPC
assert(st90.currentEvent.contestants.length > 0, 'autoEnrollNpcs 报名 NPC (实际 ' + st90.currentEvent.contestants.length + ')');

// 14) day=180 lastSeason 不变（90 周期只触发一次）
hardReset();
mockWindow.discipleState = freshDs(0, '少林寺');
// 先开过一次（手动）
setDay(90);
mockWindow.Tournament_tickDay('少林寺', 90);
setDay(180);
mockWindow.Tournament_tickDay('少林寺', 180);
var st180 = mockWindow.Tournament._store()['少林寺'];
assert(!st180.currentEvent || st180.currentEvent.tier !== 'season', 'day=180 不开小比（已开过）');

// 15) day=360 自动开大比
hardReset();
mockWindow.discipleState = freshDs(0, '少林寺');
setDay(360);
mockWindow.Tournament_tickDay('少林寺', 360);
var st360 = mockWindow.Tournament._store()['少林寺'];
assert(st360.currentEvent && st360.currentEvent.tier === 'year', 'day=360 自动开大比');

// 16) 弟子在场不开赛事
hardReset();
mockWindow.discipleState = freshDs(5, '少林寺'); // 弟子
setDay(90);
mockWindow.Tournament_tickDay('少林寺', 90);
var stDis = mockWindow.Tournament._store()['少林寺'];
assert(!stDis.currentEvent, '弟子在场不开赛事');

// 17) 过期赛事自动关闭
hardReset();
mockWindow.discipleState = freshDs(0, '少林寺');
setDay(1);
var evX = mockWindow.openTournament('少林寺', 'season');
mockWindow.joinTournament(evX.id, 'a');
mockWindow.joinTournament(evX.id, 'b');
setDay(10);
mockWindow.Tournament_tickDay('少林寺', 10); // expiresDay=8, 过期
var stAfter = mockWindow.Tournament._store()['少林寺'];
assert(stAfter.history.length === 1, '过期赛事自动跑完');

// ============ renderTournamentPanel 不抛错 ============
var html = mockWindow.Tournament.renderTournamentPanel('少林寺');
assert(html.length > 0, 'renderTournamentPanel OK');

// ============ StateRegistry 持久化（放在所有会修改数据的测试之后）============
var snap = mockWindow.StateRegistry.exportAll();
assert(snap.sectTournaments && Object.keys(snap.sectTournaments.data).length > 0, 'StateRegistry 含 sectTournaments');
assert(snap.sectTournaments.data['少林寺'].history.length > 0, 'export 快照含历史');
mockWindow.StateRegistry.resetAll();
mockWindow.StateRegistry.importAll(snap);
var re = mockWindow.getTournamentHistory('少林寺');
assert(re.length > 0, 'import 后历史恢复');

// ============ 收尾 ============
console.log('=========================================');
console.log('tournament v19.1: ' + passed + ' passed, ' + failed + ' failed');
console.log('=========================================');
if (failed > 0) process.exit(1);
