/**
 * sect-management-node.js — v19.0 批次 B 单元测试
 *
 * 覆盖：
 *   B1: 藏经阁 getReadableSectArts 按玩家 rankId 过滤
 *   B2: acceptElderTask 仅长老+可接（教弟子 / 外交出访）
 *   B3: 议事投票 open / cast / close
 *   B4: 掌门决策 applyLeaderPolicy
 *   B5: openSectManagementUI 模态按 role 显示不同按钮
 *
 * 运行：node tests/sect-management-node.js
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
    inventory: { currency: { spiritStones: 100, copper: 1000 } },
    activeTasks: [],
    discipleState: null,
    COMMON_RANKS: null,
    SECT_INTERNAL: {},
    BALANCE_CONFIG: { sectTasks: { maxConcurrent: 5 } },
    currentCharData: { name: 'test', energy: 100, maxEnergy: 100, realm: '炼气', spiritStones: 100 },
    updateCurrencyUI: function () {},
    updateSectUI: function () {},
    updateCharacterStatus: function () {},
    updateTaskUI: function () {},
    getAbsoluteDay: function () { return 1; },
    getCurrentLocation: function () { return '帝都'; },
    getRealmIndex: function () { return 0; },
    addFame: function () {},
    addExp: function () {},
    changeFactionReputation: function () {}
};

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

// 注入 SECT_INTERNAL mock（含 resources 字段）
mockWindow.SECT_INTERNAL['少林寺'] = {
    name: '少林寺', resources: 1000, influence: 50, morale: 50, disciples: 20,
    meetings: [], policyBuffs: []
};

var passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) { passed++; }
    else { failed++; console.error('[FAIL] ' + msg); }
}
function freshDs(rank) {
    return {
        isInSect: true, sectId: '少林寺',
        rank: rank, rankName: '外门弟子',
        contribution: 1000, points: 0, level: 1, tasksCompleted: 0,
        joinTime: null, _gbFaction: null
    };
}

// ============ B1: getReadableSectArts ============
mockWindow.discipleState = freshDs(5); // 外门
var arts_outer = mockWindow.getReadableSectArts('少林寺');
assert(Array.isArray(arts_outer), '外门 getReadableSectArts 应返回数组');
assert(arts_outer.length > 0, '外门应至少看到 1 部');
assert(arts_outer.every(function (a) { return a.tier <= 1; }), '外门只能看 tier=1');

mockWindow.discipleState = freshDs(4); // 内门
var arts_inner = mockWindow.getReadableSectArts('少林寺');
assert(arts_inner.every(function (a) { return a.tier <= 2; }), '内门只看 tier=1/2');
assert(arts_inner.length >= arts_outer.length, '内门可见数 >= 外门');

mockWindow.discipleState = freshDs(3); // 亲传
var arts_qt = mockWindow.getReadableSectArts('少林寺');
assert(arts_qt.every(function (a) { return a.tier <= 3; }), '亲传只看 tier<=3');

mockWindow.discipleState = freshDs(2); // 长老
var arts_elder = mockWindow.getReadableSectArts('少林寺');
assert(arts_elder.every(function (a) { return a.tier <= 4; }), '长老看全部 tier<=4');
assert(arts_elder.length === 3, '少林长老应看全 3 部（tier 1/2/4）');

// 未入宗 → 空
mockWindow.discipleState.isInSect = false;
assert(mockWindow.getReadableSectArts('少林寺').length === 0, '未入宗应为空');

// ============ B2: acceptElderTask ============
mockWindow.discipleState = freshDs(5); // 外门
mockWindow.SECT_INTERNAL['少林寺'].resources = 1000;
var r_b2_outer = mockWindow.acceptElderTask('teach');
assert(r_b2_outer === false, '外门不能接长老任务');

mockWindow.discipleState = freshDs(2); // 长老
var before = { stones: mockWindow.inventory.currency.spiritStones, contrib: mockWindow.discipleState.contribution, res: mockWindow.SECT_INTERNAL['少林寺'].resources };
var r_b2_teach = mockWindow.acceptElderTask('teach');
assert(r_b2_teach === true, '长老可接教弟子');
assert(mockWindow.discipleState.contribution === before.contrib + 80, '教弟子贡献+80');
assert(mockWindow.inventory.currency.spiritStones === before.stones + 30, '教弟子灵石+30');
assert(mockWindow.SECT_INTERNAL['少林寺'].resources === before.res, '教弟子不扣宗门资源');

var r_b2_dip = mockWindow.acceptElderTask('diplomacy');
assert(r_b2_dip === true, '长老可接外交');
assert(mockWindow.SECT_INTERNAL['少林寺'].resources === before.res - 50, '外交扣宗门 50');

// 资源不足
mockWindow.SECT_INTERNAL['少林寺'].resources = 10;
var r_b2_nores = mockWindow.acceptElderTask('diplomacy');
assert(r_b2_nores === false, '资源不足应拒');

mockWindow.SECT_INTERNAL['少林寺'].resources = 1000; // 恢复
// 掌门也能接
mockWindow.discipleState = freshDs(0);
assert(mockWindow.acceptElderTask('teach') === true, '掌门可接长老任务');

// ============ B3: openSectVote / castVote / closeSectVote ============
mockWindow.discipleState = freshDs(2); // 长老
var r_b3_outer = mockWindow.openSectVote('测试', ['a', 'b'], 7);
assert(r_b3_outer === null, '长老不能开启投票');

mockWindow.discipleState = freshDs(0); // 掌门
var v1 = mockWindow.openSectVote('是否接纳散修', ['接纳', '拒绝'], 7);
assert(v1 && v1.status === 'open', '掌门开启投票');
assert(v1.choices.length === 2, '投票 2 选 1');

var castEld = null;
mockWindow.discipleState = freshDs(2); // 长老投
var c1 = mockWindow.castVote(v1.id, 0);
assert(c1 === true, '长老可投');
var castEld2 = mockWindow.castVote(v1.id, 1);
assert(castEld2 === true, '长老可改投'); // 改投而非禁止（更友好）
assert(v1.votes['player'] === 1, '改投后选择更新为 1');

mockWindow.discipleState = freshDs(5); // 外门想投
var c_outer = mockWindow.castVote(v1.id, 0);
assert(c_outer === false, '外门不可投');

mockWindow.discipleState = freshDs(0); // 掌门投
var c_leader = mockWindow.castVote(v1.id, 0);
assert(c_leader === true, '掌门也可投');

// 关闭
var out = mockWindow.closeSectVote(v1.id);
assert(out && out.passed === true, '投票通过（玩家一票够多数）');
assert(out.winner === '接纳', '多数 = 接纳');
assert(v1.status === 'closed', '投票关闭');

var c2 = mockWindow.castVote(v1.id, 0);
assert(c2 === false, '已关闭投票不可再投');

// ============ B4: applyLeaderPolicy ============
mockWindow.discipleState = freshDs(2); // 长老
var r_b4_outer = mockWindow.applyLeaderPolicy('invite_disciple');
assert(r_b4_outer === false, '长老不可决策');

mockWindow.discipleState = freshDs(0); // 掌门
mockWindow.SECT_INTERNAL['少林寺'].resources = 1000;
mockWindow.SECT_INTERNAL['少林寺'].disciples = 20;
var r_b4_inv = mockWindow.applyLeaderPolicy('invite_disciple');
assert(r_b4_inv === true, '掌门可下达广招弟子');
assert(mockWindow.SECT_INTERNAL['少林寺'].disciples === 23, '弟子数+3');
assert(mockWindow.SECT_INTERNAL['少林寺'].resources === 800, '扣 200 资源');

var r_b4_train = mockWindow.applyLeaderPolicy('upgrade_training');
assert(r_b4_train === true, '掌门可下达修缮演武场');
assert(mockWindow.SECT_INTERNAL['少林寺'].policyBuffs && mockWindow.SECT_INTERNAL['少林寺'].policyBuffs.length === 1, 'policyBuffs 添加');

// 资源不足
mockWindow.SECT_INTERNAL['少林寺'].resources = 0;
var r_b4_nores = mockWindow.applyLeaderPolicy('invite_disciple');
assert(r_b4_nores === false, '资源不足应拒');

// ============ B5: openSectManagementUI ============
mockWindow.discipleState = freshDs(5); // 外门
var thrown5 = false;
try { mockWindow.openSectManagementUI(); } catch (e) { thrown5 = true; }
assert(!thrown5, 'openSectManagementUI 外门不抛错');

mockWindow.discipleState = freshDs(2); // 长老
thrown5 = false;
try { mockWindow.openSectManagementUI(); } catch (e) { thrown5 = true; }
assert(!thrown5, 'openSectManagementUI 长老不抛错');

mockWindow.discipleState = freshDs(0); // 掌门
thrown5 = false;
try { mockWindow.openSectManagementUI(); } catch (e) { thrown5 = true; }
assert(!thrown5, 'openSectManagementUI 掌门不抛错');

// 未入宗
mockWindow.discipleState.isInSect = false;
thrown5 = false;
try { mockWindow.openSectManagementUI(); } catch (e) { thrown5 = true; }
assert(!thrown5, 'openSectManagementUI 未入宗不抛错');

// ============ 收尾 ============
console.log('=========================================');
console.log('sect-management v19.0 batch-B: ' + passed + ' passed, ' + failed + ' failed');
console.log('=========================================');
if (failed > 0) process.exit(1);
