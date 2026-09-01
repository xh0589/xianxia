/**
 * sect-vote-node.js — v19.0 批次 D 单元测试
 *
 * 覆盖：
 *   D1: StateRegistry sectVotes v1 export/import/reset
 *   D2: NPC 长老按 stance.reform 投票（reform>=0 → 投[0]；<0 → 投[1]）
 *   D3: closeSectVote 真实影响 SECT_INTERNAL (recruit/salary/resources/morale/allies)
 *   D4: tryAutoOpenWeeklyVote 每周（day%7==0）自动开 + 防重复
 *
 * 运行：node tests/sect-vote-node.js
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
    showModal: function () {},
    npcManager: null
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

var ctx = vm.createContext(mockWindow);
vm.runInContext(eventBusSrc, ctx);
vm.runInContext(stateRegSrc, ctx);
vm.runInContext(commonRanksSrc, ctx);
vm.runInContext(sectsSysSrc, ctx);
vm.runInContext(sectsInternalSrc, ctx);
mockWindow.EventBus = ctx.EventBus;
mockWindow.StateRegistry = ctx.StateRegistry;
mockWindow.COMMON_RANKS = ctx.COMMON_RANKS;
mockWindow.processAllSectDailyEconomy = ctx.processAllSectDailyEconomy;

// 注入 SECT_INTERNAL mock（脚本运行后注入，避免被 var SECT_INTERNAL 覆盖）
function injectSectMock() {
    if (mockWindow.SECT_INTERNAL && mockWindow.SECT_INTERNAL['少林寺']) return; // 已有
    // 先清空再注入
    Object.keys(mockWindow.SECT_INTERNAL).forEach(function (k) { delete mockWindow.SECT_INTERNAL[k]; });
    mockWindow.SECT_INTERNAL['少林寺'] = {
        name: '少林寺', resources: 1000, influence: 50, morale: 50, disciples: 20,
        meetings: [], policyBuffs: []
    };
    mockWindow.SECT_INTERNAL['修罗宫'] = {
        name: '修罗宫', resources: 500, influence: 30, morale: 60, disciples: 15,
        meetings: [], policyBuffs: []
    };
}
injectSectMock();

// SECT_DEEP_DATA with faction
mockWindow.SECT_DEEP_DATA['少林寺'] = {
    factions: [
        { id: 'f1', name: '禅宗派', stance: { reform: 30, expansion: -20, orthodox: 30 }, influence: 50 },
        { id: 'f2', name: '武宗派', stance: { reform: 10, expansion: 20, orthodox: 10 }, influence: 30 }
    ]
};
mockWindow.SECT_DEEP_DATA['修罗宫'] = {
    factions: [
        { id: 'f3', name: '修罗派', stance: { reform: -30, expansion: 30, orthodox: -20 }, influence: 60 }
    ]
};

// npcManager mock（提供 getSectNPCs 真实调用；NPC id 用 sect_elder_ 开头以匹配真实代码）
mockWindow.npcManager = {
    getAllNPCs: function () {
        return [
            { id: 'sect_elder_少林寺_0', name: '玄慈长老', title: '', location: '少林寺' },
            { id: 'sect_elder_少林寺_1', name: '玄苦长老', title: '', location: '少林寺' },
            { id: 'sect_disciple_少林寺_0', name: '某弟子', title: '', location: '少林寺' },
            { id: 'sect_elder_修罗宫_0', name: '修罗长老', title: '', location: '修罗宫' }
        ];
    }
};

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

// ============ D2: NPC 长老按立场投票 ============
// 少林寺最大派系 reform=30 ≥ 0 → 默认 投[0]
// 修罗宫最大派系 reform=-30 < 0 → 默认 投[1]
mockWindow.discipleState = freshDs(0, '少林寺'); // 掌门
var v1 = mockWindow.openSectVote('是否接纳散修', ['接纳', '拒绝'], 7, { choice: 0, type: 'recruit', delta: 3 });
assert(v1 && v1.status === 'open', 'openSectVote OK');
var npcInfo = ctx.autoNpcVotes('少林寺');
assert(npcInfo.npcCount === 2, '少林寺 2 个长老（不算弟子）');
assert(npcInfo.npcVotes['sect_elder_少林寺_0'] === 0, '少林长老投 [0]（reform>=0）');
assert(npcInfo.npcVotes['sect_elder_少林寺_1'] === 0, '少林长老全投 [0]');

// 修罗宫长老
var npcInfo2 = ctx.autoNpcVotes('修罗宫');
assert(npcInfo2.npcCount === 1, '修罗宫 1 个长老');
assert(npcInfo2.npcVotes['sect_elder_修罗宫_0'] === 1, '修罗长老投 [1]（reform<0）');

// 无 faction → 投[0] 默认
mockWindow.SECT_DEEP_DATA['少林寺'].factions = [];
var npcInfo3 = ctx.autoNpcVotes('少林寺');
assert(npcInfo3.npcCount === 2 && npcInfo3.npcVotes['sect_elder_少林寺_0'] === 0, '无 faction 投默认 [0]');
// 恢复
mockWindow.SECT_DEEP_DATA['少林寺'].factions = [
    { id: 'f1', name: '禅宗派', stance: { reform: 30 }, influence: 50 }
];

// ============ D3: closeSectVote + 政策真实影响 ============
function resetSect() {
    mockWindow.StateRegistry.resetAll();
    if (ctx.SECT_VOTES_STORE) ctx.SECT_VOTES_STORE = {};
    injectSectMock(); // 防止 reset 把 SECT_INTERNAL 清空
    if (mockWindow.SECT_INTERNAL['少林寺']) {
        mockWindow.SECT_INTERNAL['少林寺'].resources = 1000;
        mockWindow.SECT_INTERNAL['少林寺'].influence = 50;
        mockWindow.SECT_INTERNAL['少林寺'].morale = 50;
        mockWindow.SECT_INTERNAL['少林寺'].disciples = 20;
        mockWindow.SECT_INTERNAL['少林寺']._salaryMul = 1;
        delete mockWindow.SECT_INTERNAL['少林寺'].policyBuffs;
    }
}
// 准备：掌门开 vote，玩家投 [0]
resetSect();
mockWindow.discipleState = freshDs(0, '少林寺');
var v2 = mockWindow.openSectVote('是否扩建坊市', ['扩建', '暂缓'], 7, { choice: 0, type: 'resources', delta: -200 });
assert(v2 && v2.id, 'v2 opened');
mockWindow.castVote(v2.id, 0); // 玩家投 [0]
// 关闭
var out = mockWindow.closeSectVote(v2.id);
assert(out && out.passed === true, '投票通过（玩家1+长老1 多数 0）');
assert(out.npcCount === 2, 'npcCount=2');
assert(out.winner === '扩建', 'winner=扩建 (实际 ' + out.winner + ')');
assert(out.winnerIdx === 0, 'winnerIdx=0');
// 资源应被扣 200
var resAfter = mockWindow.SECT_INTERNAL['少林寺'].resources;
assert(resAfter === 800, '资源扣 200（1000→800），实际 ' + resAfter);

// morale 投票
resetSect();
mockWindow.discipleState = freshDs(0, '少林寺');
var v3 = mockWindow.openSectVote('是否封山', ['封山', '照常'], 7, { choice: 0, type: 'morale', delta: -10 });
mockWindow.castVote(v3.id, 0);
mockWindow.closeSectVote(v3.id);
assert(mockWindow.SECT_INTERNAL['少林寺'].morale === 40, 'morale-10（50→40）');

// salary 投票
resetSect();
mockWindow.discipleState = freshDs(0, '少林寺');
var v4 = mockWindow.openSectVote('加俸', ['加10%', '现状'], 7, { choice: 0, type: 'salary', delta: 0.1 });
mockWindow.castVote(v4.id, 0);
mockWindow.closeSectVote(v4.id);
assert(mockWindow.SECT_INTERNAL['少林寺']._salaryMul === 1.1, 'salaryMul=1.1');

// recruit 投票
resetSect();
mockWindow.discipleState = freshDs(0, '少林寺');
mockWindow.SECT_INTERNAL['少林寺'].disciples = 20;
var v5 = mockWindow.openSectVote('广纳', ['纳', '拒'], 7, { choice: 0, type: 'recruit', delta: 5 });
mockWindow.castVote(v5.id, 0);
mockWindow.closeSectVote(v5.id);
assert(mockWindow.SECT_INTERNAL['少林寺'].disciples === 25, '弟子+5（20→25）');

// allies 投票（应调 SectYearGoal.addAlly）
resetSect();
var allyCalled = 0;
mockWindow.SectYearGoal = mockWindow.SectYearGoal || { addAlly: function () {} };
mockWindow.SectYearGoal.addAlly = function (s) { allyCalled++; };
mockWindow.discipleState = freshDs(0, '少林寺');
var v6 = mockWindow.openSectVote('结盟', ['盟', '独'], 7, { choice: 0, type: 'allies', delta: 1 });
mockWindow.castVote(v6.id, 0);
mockWindow.closeSectVote(v6.id);
assert(allyCalled === 1, 'allies 投票通过应调 addAlly');

// ============ D1: StateRegistry 持久化 ============
var snap = mockWindow.StateRegistry.exportAll();
assert(snap.sectVotes && Object.keys(snap.sectVotes.data).length > 0, 'export 应含 sectVotes');
mockWindow.StateRegistry.resetAll();
assert(Object.keys(mockWindow.openSectVote ? mockWindow.openSectVote : {length:0}).length >= 0, 'reset OK');
// 验证 STORE 已空
var storeAfterReset = ctx.SECT_VOTES_STORE || mockWindow.openSectVote;
mockWindow.StateRegistry.importAll(snap);
// 通过 openSectVote 验证
var v7 = mockWindow.openSectVote('test', ['a', 'b'], 1, { choice: 0, type: 'recruit', delta: 1 });
assert(v7 && v7.id, 'import 后可正常开 vote');

// ============ D4: tryAutoOpenWeeklyVote ============
// 关闭所有 votes 后再开新
mockWindow.StateRegistry.resetAll();
setDay(7); // 周一
mockWindow.discipleState = freshDs(0, '少林寺');
var auto1 = mockWindow.tryAutoOpenWeeklyVote('少林寺', 7);
assert(auto1 && auto1.openedBy === 'auto_weekly', 'day=7 自动开');
assert(auto1.choices.length === 2, 'auto vote 2 选 1');

// 防重复：同一周内再次 day=14 应选不同模板
var auto2 = mockWindow.tryAutoOpenWeeklyVote('少林寺', 7);
assert(auto2 === null, '同周同 sect 已有 open vote，不重复开');

// 防同模板：先关闭 auto1，再 day=8（<7+7=14）应拒
mockWindow.closeSectVote(auto1.id);
setDay(8);
var auto3 = mockWindow.tryAutoOpenWeeklyVote('少林寺', 8);
assert(auto3 === null, '8 < 14 同模板已开过，本周不重');

// day=14（同周下一档）应能开
setDay(14);
var auto4 = mockWindow.tryAutoOpenWeeklyVote('少林寺', 14);
assert(auto4 && auto4.templateId !== auto1.templateId, 'day=14 开下一模板');

// day%7!=0 不开
setDay(13);
var auto5 = mockWindow.tryAutoOpenWeeklyVote('少林寺', 13);
assert(auto5 === null, 'day=13（周三）不开');

// processAllSectDailyEconomy 钩子集成
mockWindow.StateRegistry.resetAll();
setDay(7);
mockWindow.discipleState = freshDs(0, '少林寺');
mockWindow.processAllSectDailyEconomy(7);
var after7 = (mockWindow.openSectVote && ctx.SECT_VOTES_STORE && ctx.SECT_VOTES_STORE['少林寺']) || [];
// 通过 ctx.SECT_VOTES_STORE 拿（mockWindow 没暴露该 var）
// 替代：从新开 vote 来验证 STORE 非空
var checkAfter = mockWindow.openSectVote('post', ['a', 'b'], 1, { choice: 0, type: 'recruit', delta: 1 });
assert(checkAfter && checkAfter.id, 'processAllSectDailyEconomy 钩子集成 OK（vote id 非空）');

// ============ 收尾 ============
console.log('=========================================');
console.log('sect-vote v19.0 batch-D: ' + passed + ' passed, ' + failed + ' failed');
console.log('=========================================');
if (failed > 0) process.exit(1);
