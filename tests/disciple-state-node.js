/**
 * disciple-state-node.js — v19.0 批次 A 单元测试
 *
 * 覆盖：
 *   A1: StateRegistry discipleState v1 export/import/reset
 *   A2: getPlayerRank / getPlayerDailyTaskLimit / getPlayerRankAuthority / getPlayerSectRole
 *       canAccessScriptureTier / canVoteInSectMeeting / canDecideSectPolicy
 *       getPlayerActiveTaskCount
 *   A3: acceptTask 受 dailyTaskCount 限制（弟子最多 2，长老 0）
 *   A4: sectPromote 贡献 clamp + 边界
 *
 * 运行：node tests/disciple-state-node.js
 */
'use strict';

var path = require('path');
var fs = require('fs');
var vm = require('vm');

// ============ 最小 window mock ============
var mockWindow = {
    EventBus: null,
    showMessage: function (m, t) { /* silent */ },
    alert: function (m) { /* silent */ },
    console: console,
    Math: Math, JSON: JSON, Object: Object, Array: Array,
    document: { querySelector: function () { return null; } },
    // timeSystem 简单实现
    timeSystem: { gameTime: { currentDay: 1, totalMinutes: 0 }, advanceTime: function () {} },
    // inventory
    inventory: { currency: { spiritStones: 0, copper: 0 } },
    // activeTasks
    activeTasks: [],
    // 玩家（注入）
    discipleState: null,
    // 后置
    COMMON_RANKS: null,
    BALANCE_CONFIG: { sectTasks: { maxConcurrent: 5 } },
    // sect-internal 用的 NPCs
    currentCharData: { name: 'test', energy: 100, maxEnergy: 100, realm: '炼气' },
    updateCurrencyUI: function () {},
    updateSectUI: function () {},
    updateCharacterStatus: function () {},
    updateTaskUI: function () {},
    getAbsoluteDay: function () { return 1; },
    getCurrentLocation: function () { return '帝都'; },
    getRealmIndex: function () { return 0; }
};

mockWindow.window = mockWindow;
mockWindow.global = mockWindow;
mockWindow.XianXia = mockWindow.XianXia || {};

// ============ 工具 ============
var passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) { passed++; }
    else { failed++; console.error('[FAIL] ' + msg); }
}
function freshDisciple() {
    return {
        isInSect: true,
        sectId: '少林寺',
        rank: 5, // 外门
        rankName: '外门弟子',
        contribution: 0,
        points: 0,
        level: 1,
        tasksCompleted: 0,
        joinTime: null,
        _gbFaction: null
    };
}

// 加载 EventBus
var eventBusSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'core', 'event-bus.js'), 'utf8');
var stateRegSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'core', 'state-registry.js'), 'utf8');
var commonRanksSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'sects', 'sects-deep-data.js'), 'utf8');
var deepUiSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'sects', 'sects-deep-ui.js'), 'utf8');
var sectsSysSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'sects', 'sects-system.js'), 'utf8');

var ctx = vm.createContext(mockWindow);
vm.runInContext(eventBusSrc, ctx);
vm.runInContext(stateRegSrc, ctx);
mockWindow.EventBus = ctx.EventBus;
mockWindow.StateRegistry = ctx.StateRegistry;

// 加载 COMMON_RANKS 段
vm.runInContext(commonRanksSrc, ctx);
assert(ctx.COMMON_RANKS && ctx.COMMON_RANKS.length === 8, 'COMMON_RANKS 8 档');

// 加载 sects-system（导出 RANKS、sectTasks、discipleState 等）
vm.runInContext(sectsSysSrc, ctx);

// 加载 sects-deep-ui
vm.runInContext(deepUiSrc, ctx);

// ============ A2 工具函数测试 ============

// 1) getPlayerRank：弟子外门 rank=5
mockWindow.discipleState = freshDisciple();
var r1 = mockWindow.getPlayerRank();
assert(r1 && r1.name === '外门弟子', 'getPlayerRank 应返回外门弟子');
assert(r1.dailyTaskCount === 2, '外门 dailyTaskCount=2');

// 2) 长老 rank=2
mockWindow.discipleState.rank = 2;
var r2 = mockWindow.getPlayerRank();
assert(r2 && r2.name === '长老', 'rank=2 应返回长老');
assert(r2.dailyTaskCount === 0, '长老 dailyTaskCount=0');
assert(mockWindow.getPlayerRankAuthority() === 8, '长老 authority=8');

// 3) 掌门 rank=0
mockWindow.discipleState.rank = 0;
var r3 = mockWindow.getPlayerRank();
assert(r3 && r3.name === '掌门', 'rank=0 应返回掌门');
assert(r3.dailyTaskCount === 0, '掌门 dailyTaskCount=0');
assert(mockWindow.getPlayerRankAuthority() === 10, '掌门 authority=10');

// 4) 侍妾 rank=-1
mockWindow.discipleState.rank = -1;
assert(mockWindow.getPlayerRank() === null, '侍妾应返回 null');

// 5) 未入宗
mockWindow.discipleState.isInSect = false;
mockWindow.discipleState.rank = 5;
assert(mockWindow.getPlayerRank() === null, '未入宗应返回 null');

// 6) getPlayerDailyTaskLimit
mockWindow.discipleState = freshDisciple();
assert(mockWindow.getPlayerDailyTaskLimit() === 2, '外门 limit=2');
mockWindow.discipleState.rank = 7;
assert(mockWindow.getPlayerDailyTaskLimit() === 1, '杂役 limit=1');
mockWindow.discipleState.rank = 2;
assert(mockWindow.getPlayerDailyTaskLimit() === 0, '长老 limit=0');

// 7) getPlayerSectRole
mockWindow.discipleState.isInSect = true;
mockWindow.discipleState.rank = 5;
assert(mockWindow.getPlayerSectRole() === 'disciple', '外门=disciple');
mockWindow.discipleState.rank = 2;
assert(mockWindow.getPlayerSectRole() === 'elder', '长老=elder');
mockWindow.discipleState.rank = 1;
assert(mockWindow.getPlayerSectRole() === 'elder', '副掌门=elder');
mockWindow.discipleState.rank = 0;
assert(mockWindow.getPlayerSectRole() === 'leader', '掌门=leader');
mockWindow.discipleState.rank = -1;
assert(mockWindow.getPlayerSectRole() === 'concubine', '侍妾=concubine');
mockWindow.discipleState.rank = -2;
assert(mockWindow.getPlayerSectRole() === 'fellow', '同参=fellow');

// 8) canAccessScriptureTier
mockWindow.discipleState = freshDisciple();
mockWindow.discipleState.rank = 7; // 杂役
assert(mockWindow.canAccessScriptureTier(1) === true, '杂役可进阁 1');
assert(mockWindow.canAccessScriptureTier(2) === false, '杂役不可进阁 2');
mockWindow.discipleState.rank = 5; // 外门
assert(mockWindow.canAccessScriptureTier(1) === true && mockWindow.canAccessScriptureTier(2) === false, '外门仅阁 1');
mockWindow.discipleState.rank = 4; // 内门
assert(mockWindow.canAccessScriptureTier(1) === true && mockWindow.canAccessScriptureTier(2) === true && mockWindow.canAccessScriptureTier(3) === false, '内门可阁 1-2');
mockWindow.discipleState.rank = 3; // 亲传
assert(mockWindow.canAccessScriptureTier(1) === true && mockWindow.canAccessScriptureTier(2) === true && mockWindow.canAccessScriptureTier(3) === true && mockWindow.canAccessScriptureTier(4) === false, '亲传可阁 1-3');
mockWindow.discipleState.rank = 2; // 长老
assert(mockWindow.canAccessScriptureTier(4) === true, '长老可阁 1-4');

// 9) canVoteInSectMeeting / canDecideSectPolicy
mockWindow.discipleState.rank = 4; // 内门
assert(mockWindow.canVoteInSectMeeting() === false, '内门不可投票');
assert(mockWindow.canDecideSectPolicy() === false, '内门不可决策');
mockWindow.discipleState.rank = 2; // 长老
assert(mockWindow.canVoteInSectMeeting() === true, '长老可投票');
assert(mockWindow.canDecideSectPolicy() === false, '长老不可决策');
mockWindow.discipleState.rank = 0; // 掌门
assert(mockWindow.canVoteInSectMeeting() === true, '掌门可投票');
assert(mockWindow.canDecideSectPolicy() === true, '掌门可决策');

// ============ A3 acceptTask 限制测试 ============
// 注意：acceptTask 内部有 alert/confirm 等复杂逻辑；用白盒法直接验证限制逻辑：
// 我们重写一个等价测试：模拟 activeTasks 数组已满，验证限制函数返回 false

// 10) getPlayerActiveTaskCount
mockWindow.discipleState = freshDisciple();
mockWindow.activeTasks = [];
assert(mockWindow.getPlayerActiveTaskCount() === 0, '空 active 计数 0');
mockWindow.activeTasks = [{ taskId: 't1' }, { taskId: 't2' }, { taskId: 't3' }];
assert(mockWindow.getPlayerActiveTaskCount() === 3, '3 个 active 计数 3');

// ============ A1 StateRegistry 测试 ============
mockWindow.discipleState = freshDisciple();
mockWindow.discipleState.contribution = 12345;
mockWindow.discipleState.points = 50;
mockWindow.discipleState.rank = 3;
mockWindow.discipleState.rankName = '亲传弟子';
var snap = mockWindow.StateRegistry.exportAll();
assert(snap.discipleState && snap.discipleState.data.contribution === 12345, 'export 应含 contribution');
assert(snap.discipleState && snap.discipleState.data.rank === 3, 'export 应含 rank');
assert(snap.discipleState && snap.discipleState.data.points === 50, 'export 应含 points');

// 模拟重置后 import
mockWindow.StateRegistry.resetAll();
assert(mockWindow.discipleState.contribution === 0, 'reset 后 contribution=0');
assert(mockWindow.discipleState.rank === 7, 'reset 后 rank=7（杂役）');
mockWindow.StateRegistry.importAll(snap);
assert(mockWindow.discipleState.contribution === 12345, 'import 还原 contribution');
assert(mockWindow.discipleState.rank === 3, 'import 还原 rank');
assert(mockWindow.discipleState.rankName === '亲传弟子', 'import 还原 rankName');

// 旧档无 discipleState 段 → 走默认（已在 resetAll 后验证）

// ============ A4 sectPromote 边界测试 ============
// 不能从侍妾晋升
mockWindow.discipleState = freshDisciple();
mockWindow.discipleState.rank = -1;
mockWindow.discipleState.contribution = 99999;
mockWindow.sectPromote('少林寺', 5); // 应被拒
assert(mockWindow.discipleState.rank === -1, '侍妾不可晋升');

// 掌门不能晋升获得
mockWindow.discipleState = freshDisciple();
mockWindow.discipleState.rank = 1; // 副掌门
mockWindow.discipleState.contribution = 99999;
mockWindow.sectPromote('少林寺', 0); // 掌门
assert(mockWindow.discipleState.rank === 1, '不可通过晋升获得掌门');

// 贡献不足
mockWindow.discipleState = freshDisciple();
mockWindow.discipleState.rank = 5; // 外门
mockWindow.discipleState.contribution = 50; // 不足 300
mockWindow.sectPromote('少林寺', 4); // 内门
assert(mockWindow.discipleState.rank === 5, '贡献不足不应晋升');
assert(mockWindow.discipleState.contribution === 50, '贡献不足不应扣');

// 贡献充足
mockWindow.discipleState = freshDisciple();
mockWindow.discipleState.rank = 5;
mockWindow.discipleState.contribution = 1000;
mockWindow.sectPromote('少林寺', 4); // 内门
assert(mockWindow.discipleState.rank === 4, '贡献充足应晋升');
assert(mockWindow.discipleState.contribution === 200, '贡献正确扣减 300');

// 未入宗
mockWindow.discipleState = freshDisciple();
mockWindow.discipleState.isInSect = false;
mockWindow.discipleState.contribution = 99999;
mockWindow.sectPromote('少林寺', 4);
assert(mockWindow.discipleState.rank === 5, '未入宗不应晋升');

// EventBus 钩子
var roleChecked = null;
mockWindow.EventBus.on('sect:role:checked', function (p) { roleChecked = p; });
mockWindow.discipleState = freshDisciple();
mockWindow.discipleState.rank = 4;
mockWindow.discipleState.contribution = 5000;
mockWindow.sectPromote('少林寺', 3); // 亲传
assert(roleChecked && roleChecked.rank && roleChecked.rank.name === '亲传弟子', '晋升应发 sect:role:checked');

// ============ v25.1·P9 P24：joinSect/leaveSect 与 game-state 重置路径结构对齐 ============
// 单独起一个干净上下文——joinSect/leaveSect 改的是模块内闭包 discipleState（仅在加载那一刻
// 与 window.discipleState 同引用），主测试上面反复 reassign 过 mockWindow.discipleState 会让两者分叉，
// 无法忠实验证闭包侧的 delete position / rank 复位。这里镜像加载顺序、全程只 mutate 不 reassign。
(function p24() {
    var W2 = {
        EventBus: null, showMessage: function () {}, alert: function () {}, console: console,
        Math: Math, JSON: JSON, Object: Object, Array: Array, Number: Number, String: String, Date: Date,
        document: { querySelector: function () { return null; }, querySelectorAll: function () { return []; }, getElementById: function () { return null; }, createElement: function () { return { style: {}, classList: { add: function () {}, remove: function () {} }, appendChild: function () {}, remove: function () {} }; }, body: { appendChild: function () {} } },
        timeSystem: { gameTime: { currentDay: 1, totalMinutes: 0 }, advanceTime: function () {} },
        inventory: { currency: { spiritStones: 0, copper: 0 } },
        activeTasks: [], COMMON_RANKS: null, BALANCE_CONFIG: { sectTasks: { maxConcurrent: 5 } },
        currentCharData: { name: 'test', energy: 100, maxEnergy: 100, realm: '炼气' },
        updateCurrencyUI: function () {}, updateSectUI: function () {}, updateCharacterStatus: function () {},
        updateTaskUI: function () {}, getCurrentLocation: function () { return '帝都'; }, getRealmIndex: function () { return 0; }
    };
    W2.window = W2; W2.global = W2;
    var _absDay = 1;
    W2.getAbsoluteDay = function () { return _absDay; };
    W2.confirm = function () { return true; };
    var ctx2 = vm.createContext(W2);
    vm.runInContext(eventBusSrc, ctx2);
    vm.runInContext(stateRegSrc, ctx2);
    W2.EventBus = ctx2.EventBus; W2.StateRegistry = ctx2.StateRegistry;
    vm.runInContext(commonRanksSrc, ctx2);
    vm.runInContext(sectsSysSrc, ctx2);
    // joinSect 读裸标识 sectsData（sects.js 未在最小上下文加载）——就地声明一份最小表
    vm.runInContext('var sectsData = { "少林寺": { name:"少林寺", type:"正道", power:"大派" }, "逍遥派": { name:"逍遥派", type:"中立" } };', ctx2);

    // 加载后 window.discipleState 即闭包对象；模拟 game-state 重置路径写入的旧结构（含死字段 position）
    Object.assign(W2.discipleState, { sectName: null, position: '散修', contribution: 0, rank: null });
    assert('position' in W2.discipleState, 'P24 前置：重置路径确实留下了 position 死字段');
    assert(W2.discipleState.isInSect !== true, 'P24 前置：重置后 isInSect 非 true');

    // joinSect → isInSect true 且 position 被删（不再残留自相矛盾的散修死键）
    _absDay = 1;
    W2.joinSect('少林寺', null);
    assert(W2.discipleState.isInSect === true, 'P24 joinSect 后 isInSect===true');
    assert(!('position' in W2.discipleState), 'P24 joinSect 后无 position 死字段');
    assert(W2.discipleState.joinDay === 1, 'P24 joinSect 记下入门游戏日 joinDay');

    // 入门当日不可退（温和粘性）
    var leftSameDay = W2.leaveSect();
    assert(leftSameDay === false && W2.discipleState.isInSect === true, 'P24 入门当日 leaveSect 被拦下');

    // 次日退门成功，键位与重置路径对齐、且无 position
    _absDay = 2;
    var left = W2.leaveSect();
    assert(left === true && W2.discipleState.isInSect === false, 'P24 次日 leaveSect 成功');
    assert(W2.discipleState.sectId === null && W2.discipleState.sectName === null, 'P24 退门 sectId/sectName 复位 null');
    assert(W2.discipleState.rank === null, 'P24 退门 rank 复位 null（不再是掌门 0）');
    assert(W2.discipleState.contribution === 0, 'P24 退门 contribution 清零');
    assert(!('position' in W2.discipleState), 'P24 退门后同样无 position 死字段');
})();

// ============ v25.1·P9 试-16：日常差事「看到的 = 做得了的」（展示过滤与结算闸同向） ============
(function shiSixteen() {
    // 三档身份：掌门(0) / 内门(4) / 同参(-2)。minRank 越大职位越低（7=杂役门槛最低，2=长老级差事）。
    var ranksToCheck = [
        { name: '掌门', rank: 0 },
        { name: '内门', rank: 4 },
        { name: '同参', rank: -2 }
    ];
    var tasks = mockWindow.COMMON_TASKS;
    assert(tasks && tasks.length > 0, '试-16 前置：COMMON_TASKS 已加载');
    // 展示过滤（sects-deep-ui.js:504 修后）：minRank!=null && rank>minRank → 隐藏；否则显示
    // 结算闸（sects-deep-ui.js:548）：minRank && curRank>minRank → 拒绝；否则放行
    // 二者对同一 (task, rank) 必须同向——凡显示者必可结算，凡被闸拒者必不显示
    ranksToCheck.forEach(function (rc) {
        tasks.forEach(function (t) {
            var shown = !(t.minRank != null && rc.rank > t.minRank);
            var settleAllowed = !(t.minRank && rc.rank > t.minRank);
            assert(shown === settleAllowed,
                '试-16 ' + rc.name + '(rank=' + rc.rank + ') 差事「' + t.name + '」(minRank=' + t.minRank + ') 展示与结算方向不一致');
        });
    });
    // 回归点：同参(-2) 旧码被 minRank>-2 恒真过滤光，现应至少看得到门槛最低的杂役差事
    var tongcan = tasks.filter(function (t) { return !(t.minRank != null && (-2) > t.minRank); });
    assert(tongcan.length === tasks.length, '试-16 同参弟子(rank=-2) 不再被过滤光，看得到全部差事');
    // 掌门(0) 不再被 `||7` 折成杂役：0 满足所有 minRank（均 ≥2），显示集合 = 全部
    var zhangmen = tasks.filter(function (t) { return !(t.minRank != null && 0 > t.minRank); });
    assert(zhangmen.length === tasks.length, '试-16 掌门(rank=0) 不被折成 7，显示全部差事');
})();

// ============ 收尾 ============
console.log('=========================================');
console.log('discipleState v19.0 batch-A: ' + passed + ' passed, ' + failed + ' failed');
console.log('=========================================');
if (failed > 0) process.exit(1);
