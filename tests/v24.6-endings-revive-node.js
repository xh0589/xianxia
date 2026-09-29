/**
 * ==================== v24.6 结局系统复活 + 任务账本幽灵清扫 ====================
 * 追查「布告委托列表偶现空白」（TASK-02）时牵出的更大活 bug：
 *   ① checkEndingCondition 读 window.playerQuestProgress——真账本是 quest-system.js 顶层
 *      let（词法全局，从不挂 window），于是 completedMainQuests 恒 0 → allCompleted 恒 false，
 *      飞升（默认结局）/隐退/混沌之主三结局永不可达。F-1 把门槛 35→20 修活了，却栽在这行
 *      幽灵读上——与 v24.5 八处 window 幽灵同病族。改为词法读。
 *   ② NPCQuestSystem.acceptQuest 往 window.playerQuestProgress 塞对象条目——同名幽灵假账本，
 *      形状还与真账本不兼容（对象 vs 字符串 id）。NPC 委托是独立子系统，改记实例态
 *      this.acceptedQuests，不再污染全局名。
 *   ③ content-validator validateQuestRefs 读 global.playerQuestProgress——幻影恒 undefined，
 *      活跃任务引用校验池多年恒空。改走官方快照口 exportQuestState()，字符串 id 经
 *      window.allQuests 注册表还原成模板再验。
 *   ④ TASK-02 结案棘轮：wave82 已把 switchPanel('quests') 接上 updateRandomQuestUI，
 *      且该函数结构上不可能渲染空白（20 单→卡片；0 单→renderXEmpty「布告栏空着」）。
 * 判决不动（记录在案）：game-state.js 三处 global.playerQuestProgress 兜底支（有活的
 *   exportQuestState/importQuestState 正门，死枝带守卫不咬人，留作桩位）；app.js:2779 同款
 *   守卫兜底；acceptNPCQuest 每次接委托 +2 好感可重复刷（数值另案）；NPCQuestSystem
 *   .completedQuests 不持久化（另案）。
 * 运行：node tests/v24.6-endings-revive-node.js
 */
'use strict';

var fs = require('fs');
var vm = require('vm');
var path = require('path');
var ROOT = path.resolve(__dirname, '..');

var passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) { passed++; console.log('  ✓ ' + msg); }
    else { failed++; console.error('  ✗ ' + msg); }
}
function src(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }
function 剥注释(s) {
    return s.split(/\r?\n/).filter(function (l) { return l.trim().indexOf('//') !== 0; }).join('\n');
}
function sliceFn(source, sig) {
    var at = source.indexOf(sig);
    if (at < 0) return null;
    var open = source.indexOf('{', at);
    var i = open, depth = 0, end = -1;
    for (; i < source.length; i++) {
        var c = source[i];
        if (c === '{') depth++;
        else if (c === '}') { depth--; if (!depth) { end = i; break; } }
    }
    return end < 0 ? null : source.slice(open + 1, end);
}

// ============ [A] 源码接线棘轮 ============
console.log('--- [A] 源码接线 ---');
(function () {
    var qs = 剥注释(src('js/quest/quest-system.js'));
    var ceBody = sliceFn(qs, 'function checkEndingCondition');
    assert(!!ceBody, 'A0 checkEndingCondition 切片成功');
    assert(ceBody.indexOf("typeof playerQuestProgress !== 'undefined'") >= 0 && ceBody.indexOf('window.playerQuestProgress') < 0,
        'A1 结局判定改读词法真账本（window.playerQuestProgress 幽灵读清除）');
    assert(/questId === 'main_035'/.test(qs) && /checkEndingCondition\(\)/.test(qs),
        'A2 触发链在账：交 main_035 → checkEndingCondition → showEndingScreen');

    var ns = 剥注释(src('js/npcs/npc-system.js'));
    var aqBody = sliceFn(ns, 'acceptQuest(questId)');
    assert(!!aqBody && aqBody.indexOf('this.acceptedQuests') >= 0 && aqBody.indexOf('window.playerQuestProgress') < 0,
        'A3 NPCQuestSystem.acceptQuest 改记实例态（假账本停写全局幽灵名）');
    assert(ns.indexOf('window.playerQuestProgress') < 0,
        'A4 npc-system.js 全文件棘轮：window.playerQuestProgress 真代码归零');

    var cv = 剥注释(src('js/core/content-validator.js'));
    var vqBody = sliceFn(cv, 'function validateQuestRefs');
    assert(!!vqBody && /typeof global\.exportQuestState === 'function'/.test(vqBody) && vqBody.indexOf('global.playerQuestProgress') < 0,
        'A5 validateQuestRefs 改走 exportQuestState 官方快照口（幻影读清除）');

    var app = 剥注释(src('js/app.js'));
    assert(/updateRandomQuestUI\(\)/.test(app),
        'A6 TASK-02 结案棘轮：switchPanel 进任务页即刷布告委托（wave82 接线仍在）');
})();

// ============ [B] 行为面：三结局复活 ============
console.log('--- [B] checkEndingCondition 行为 ---');
(function () {
    var qs = src('js/quest/quest-system.js');
    var body = sliceFn(qs, 'function checkEndingCondition');
    assert(!!body, 'B0 切片成功');
    // 新函数：注入词法账本（与浏览器里顶层 let 同名可见等效）
    var newFn = new Function('window', 'playerQuestProgress', 'return (function checkEndingCondition() {' + body + '});');
    // 改前对照：把账本读取行还原成旧的 window 幽灵读
    var oldBody = body.replace(/var questProgress = [^;]+;/, 'var questProgress = window.playerQuestProgress;');
    assert(oldBody !== body, 'B0b 改前对照体构造成功');
    var oldFn = new Function('window', 'playerQuestProgress', 'return (function checkEndingCondition() {' + oldBody + '});');

    function 账本(nMain) {
        var done = [];
        for (var i = 1; i <= nMain; i++) done.push('main_' + (i < 10 ? '00' : '0') + i);
        return { activeQuests: [], completedQuests: done, totalCompleted: nMain };
    }
    function 角色(o) {
        return Object.assign({ realm: '金丹', layer: 3, _killCount: 0, bonds: {} }, o || {});
    }
    var 有道侣 = { n1: { type: 'dao_companion' } };

    // 改前对照：主线全通也判不出飞升——结局系统是死的
    var w1 = { currentCharData: 角色() };
    assert(oldFn(w1, 账本(20))() === null,
        'B1 改前对照：20 主线全通，window 幽灵读令 allCompleted 恒 false → 返回 null（病是真的）');

    // 改后：飞升（默认结局）复活
    assert(newFn(w1, 账本(20))() === 'ascension',
        'B2 改后：20 主线全通、无道侣、无杀孽 → ascension 飞升结局可达');

    // 隐退复活
    var w2 = { currentCharData: 角色({ bonds: 有道侣 }) };
    assert(newFn(w2, 账本(20))() === 'retire',
        'B3 有道侣 + 全通 → retire 隐退结局可达');

    // 混沌之主复活（最难：全通 + 杀孽 50-150 + 道侣）
    var w3 = { currentCharData: 角色({ bonds: 有道侣, _killCount: 60 }) };
    assert(newFn(w3, 账本(20))() === 'chaos',
        'B4 有道侣 + 全通 + 杀孽 60 → chaos 混沌之主可达');

    // 原本就活的两个结局不被误伤
    assert(newFn({ currentCharData: 角色({ _killCount: 100 }) }, 账本(0))() === 'demon',
        'B5 杀孽 ≥100 → demon 入魔照旧（不依赖任务账）');
    assert(newFn({ currentCharData: 角色({ realm: '炼气', layer: 0 }) }, 账本(0))() === 'reincarnation',
        'B6 炼气 0 层 → reincarnation 轮回照旧');

    // 门槛仍诚实：19 单主线不触发
    assert(newFn(w1, 账本(19))() === null,
        'B7 19 主线（差一单）→ null，门槛 20 不掺水');

    // 沙箱里账本完全缺失也不炸（typeof 守卫）
    var bareFn = new Function('window', 'return (function checkEndingCondition() {' + body + '});');
    assert(bareFn({ currentCharData: 角色() })() === null,
        'B8 账本未定义时 typeof 守卫安静早退（不炸不谎报）');
})();

// ============ [C] 行为面：NPC 委托接取改记实例态 ============
console.log('--- [C] NPCQuestSystem.acceptQuest 行为 ---');
(function () {
    var ns = src('js/npcs/npc-system.js');
    var body = sliceFn(ns, 'acceptQuest(questId)');
    assert(!!body, 'C0 切片成功');
    var mk = function () {        var q = { id: 'quest_gather_herbs', title: '采集草药', npcId: 'healer_01' };
        return { quests: new Map([[q.id, q]]), acceptQuest: new Function('questId', body) };
    };
    var sys = mk();
    var r1 = sys.acceptQuest.call(sys, 'quest_gather_herbs');
    assert(r1 === true && Array.isArray(sys.acceptedQuests) && sys.acceptedQuests.length === 1
        && sys.acceptedQuests[0].id === 'quest_gather_herbs' && sys.acceptedQuests[0].status === 'active',
        'C1 接委托真记账：实例态 acceptedQuests 收下带 status/acceptedAt 的条目');
    var r2 = sys.acceptQuest.call(sys, 'quest_gather_herbs');
    assert(r2 === true && sys.acceptedQuests.length === 1,
        'C2 重复接同一单不重复入账（去重照旧）');
    assert(sys.acceptQuest.call(sys, 'quest_nope') === false,
        'C3 不存在的委托照旧返回 false');
    // 关键：不再往全局名塞假账本——用干净的 global.window 验证
    var 存窗 = global.window;
    global.window = {};
    var sys2 = mk();
    sys2.acceptQuest.call(sys2, 'quest_gather_herbs');
    assert(global.window.playerQuestProgress === undefined,
        'C4 window.playerQuestProgress 零写入（真账本的同名幽灵不再被假形状污染）');
    global.window = 存窗;
})();

// ============ [D] 行为面：内容校验活跃任务池复活 ============
console.log('--- [D] content-validator 行为 ---');
(function () {
    function 跑(sandboxGlobal) {
        var logs = [];
        var sb = Object.assign({
            console: { error: function (m) { logs.push(String(m)); }, warn: function (m) { logs.push(String(m)); }, info: function () {} },
            allItems: [], allRecipes: [], itemById: {}
        }, sandboxGlobal);
        var ctx = vm.createContext(sb);
        vm.runInContext(src('js/core/content-validator.js'), ctx, { filename: 'content-validator.js' });
        return { report: sb.CONTENT_VALIDATION_REPORT, logs: logs };
    }
    var 坏模板 = { id: 'rq_bad', title: '采灵芝', type: 'random', objectives: [{ itemId: 'item_不存在', currentCount: 0 }] };
    var 好模板 = { id: 'rq_good', title: '采草药', type: 'random', objectives: [{ itemId: 'herb_01', currentCount: 0 }] };

    // 改前对照：账本幻影恒 undefined——就算活跃任务引用了不存在物品也查不出
    var r0 = 跑({ allQuests: [坏模板], questsData: [] });
    assert(r0.report && !r0.report.issues.some(function (x) { return x.code === 'QUEST_ITEM_REF'; }),
        'D1 改前对照形态：没有 exportQuestState 时活跃任务池为空（旧代码读幻影也是这个效果，不炸）');

    // 改后：接上官方快照口，坏引用真被查出来
    var r1 = 跑({
        allQuests: [坏模板, 好模板], questsData: [],
        itemById: { herb_01: { id: 'herb_01' } },
        exportQuestState: function () { return { activeQuests: ['rq_bad'], completedQuests: [], totalCompleted: 0 }; }
    });
    assert(r1.report.issues.some(function (x) { return x.code === 'QUEST_ITEM_REF' && x.message.indexOf('rq_bad') >= 0 && x.message.indexOf('item_不存在') >= 0; }),
        'D2 改后：活跃任务引用不存在物品被真查出（字符串 id 经 allQuests 还原成模板）');

    // 好引用不误报
    var r2 = 跑({
        allQuests: [好模板], questsData: [],
        itemById: { herb_01: { id: 'herb_01' } },
        exportQuestState: function () { return { activeQuests: ['rq_good'], completedQuests: [], totalCompleted: 1 }; }
    });
    assert(!r2.report.issues.some(function (x) { return x.code === 'QUEST_ITEM_REF'; }),
        'D3 合法引用不误报');

    // 快照口炸了也不带崩校验器
    var r3 = 跑({
        allQuests: [], questsData: [],
        exportQuestState: function () { throw new Error('账本没就绪'); }
    });
    assert(r3.report && r3.report.issues.every(function (x) { return x.code !== 'QUEST_ITEM_REF'; }),
        'D4 exportQuestState 抛错时安静跳过（try/catch 兜住，不出假警报）');
})();

// ============ [E] 行为面：TASK-02 布告委托永不空白 ============
console.log('--- [E] updateRandomQuestUI 行为 ---');
(function () {
    var qs = src('js/quest/quest-system.js');
    var body = sliceFn(qs, 'function updateRandomQuestUI');
    assert(!!body, 'E0 切片成功');
    var fn = new Function('document', 'window', 'renderXEmpty', '_qgStatusOf', '_qgAcceptBtn',
        '_qgTurnInBtn', '_qgTrackBtn', '_qgCardHtml', '_qgPrioName', '_qgPrioId', '_qgProgressOf',
        '_qgRewardText', '_qgObjectiveHtml', 'QG_LIST_CAP', '_qgFoldTail', '_qgMountBar',
        'return function updateRandomQuestUI() {' + body + '};');
    function 装(quest数) {
        var list = { innerHTML: '旧内容' };
        var 空态 = [];
        var quests = [];
        for (var i = 0; i < quest数; i++) quests.push({ id: 'rq_' + i, title: '委托' + i, type: 'random' });
        var f = fn(
            { getElementById: function (id) { return id === 'random-quest-list' ? list : null; } },
            { allQuests: quests },
            function (el, o) { 空态.push(o); },
            function () { return 'todo'; },
            function () { return '<button>接下</button>'; },
            function () { return ''; }, function () { return ''; },
            function (o) { return '<div class="card">' + (o.actions || '') + '</div>'; },
            function () { return '常'; }, function () { return 'normal'; }, function () { return ''; },
            function () { return ''; }, function () { return ''; },
            8,
            function (cards) { return cards.map(function (c) { return c.html; }).join(''); },
            function () {}
        );
        f();
        return { list: list, 空态: 空态 };
    }
    var r20 = 装(20);
    var 接下数 = (r20.list.innerHTML.match(/接下/g) || []).length;
    assert(接下数 === 20,
        'E1 20 条布告委托全部渲染出「接下」钮（实得 ' + 接下数 + '，旧「偶现空白」在此结构下不可能）');
    var r0 = 装(0);
    assert(r0.空态.length === 1 && r0.空态[0].title === '布告栏空着',
        'E2 0 条时走 renderXEmpty 诚实空态（「布告栏空着」+ 来由 + 下一步，不是白屏）');
})();

console.log('\nv24.6-endings-revive：' + passed + ' 通过 / ' + failed + ' 失败');
process.exit(failed ? 1 : 0);
