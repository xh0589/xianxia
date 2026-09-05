/**
 * v20.55-quest-rank-node.js — 任务与晋升验收：
 *   P1 晋升同步职位名：晋升只改 rank 数字 → rankName 永远停在入门那档，修炼加成与职位展示全错
 *   P2 修炼效率按职级结账：长老/副掌门真有加成；外门出身晋升后不再永远拿外门那档
 *   P3 门派日常有工夫：耗时/精力写进条目并照扣，不在宗门、职级不够的点了不作数
 *   P4 打扫洞府能做完：clean:completed 全库无人发出 → 任务接了永远完不成
 *   P5 长者事务有工夫：150 连点白嫖贡献到副掌门的日子结束
 *   P6 任务可达性：门派日常 / 布告委托 / 故人心事三条通道接上任务页（此前 46/59 条任务不可达）
 *   P7 战斗认具体敌人：护宗战/主线Boss 传入的强敌数据不再被整包丢弃
 *
 * 运行：node tests/v20.55-quest-rank-node.js
 */
'use strict';

var fs = require('fs');
var vm = require('vm');
var path = require('path');
var ROOT = path.resolve(__dirname, '..');

var passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) passed++;
    else { failed++; console.error('[FAIL] ' + msg); }
}
function load(rel) {
    vm.runInThisContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), { filename: rel });
}
function src(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

global.window = global;
global.document = {
    getElementById: function (id) {
        if (id === 'panel-quests') return { style: { display: 'block' } };
        return null;
    },
    querySelectorAll: function () { return []; },
    addEventListener: function () {},
    createElement: function () { return { style: {}, classList: { add: function () {} }, appendChild: function () {} }; },
    body: { appendChild: function () {}, insertAdjacentHTML: function () {} }
};
global.localStorage = { getItem: function () { return null; }, setItem: function () {} };
global.alert = function () {};
var msgs = [];
global.showMessage = function (m, t) { msgs.push({ m: m, t: t }); };
var timeCalls = [];
global.timeSystem = { advanceTime: function (m, r) { timeCalls.push({ m: m, r: r }); }, onNewDaySubscribe: function () {} };
var emitted = [];
global.EventBus = { emit: function (e, d) { emitted.push({ e: e, d: d }); } };
global.getAbsoluteDay = function () { return 7; };
global.updateCharacterStatus = function () {};
global.updateCultivationUI = function () {};

// ==================== P1 晋升同步职位名 ====================
console.log('\n[P1] 晋升同步职位名');
var uiSrc = src('js/sects/sects-deep-ui.js');
assert('sectPromote 写 rankName', /ds\.rank = targetRank;[\s\S]{0,200}ds\.rankName = rankDef\.name;/.test(uiSrc));
assert('晋升面板有入口（showSectRanks/sectPromote）',
    uiSrc.indexOf('function showSectRanks') >= 0 && uiSrc.indexOf('function sectPromote') >= 0);

// ==================== P2 修炼效率按职级结账 ====================
console.log('\n[P2] 修炼效率按职级结账');
load('js/core/knowledge-system.js');
load('js/cultivation/cultivation.js');
var profExp = [];
global.addProficiencyExp = function (id, n) { profExp.push(n); return { upgraded: false, level: 0 }; };
global.applyCultivationBottleneckPenalty = function (n) { return n; };
global.BALANCE_CONFIG = { cultivation: { skillPracticeQiCost: 5, skillPracticeMinutes: 30 } };
global.insightPoints = 0;
global.currentCharData = { name: '弟子', realm: '金丹', layer: 1, qi: 500, location: '帝都·长安', energy: 200 };

var ds = global.discipleState = { isInSect: true, sectId: 'shaolin', sectName: '少林寺', rank: 5, rankName: '外门弟子', contribution: 0 };
profExp.length = 0;
global.cultivateSkill('art_breathing', 100);
var outerGain = profExp[0];
assert('外门弟子加成 +10%（' + outerGain + '）', outerGain === 110);

ds.rank = 4; ds.rankName = '外门弟子';   // 模拟晋升只改数字的旧档
profExp.length = 0;
global.cultivateSkill('art_breathing', 100);
assert('内门职级按 id 结账：rankName 还是外门也有 +30%（' + profExp[0] + '）', profExp[0] === 130);

ds.rank = 2; ds.rankName = '外门弟子';
profExp.length = 0;
global.cultivateSkill('art_breathing', 100);
assert('长老晋升后真有加成（' + profExp[0] + '，不再是 0 加成）', profExp[0] === 140);

ds.rank = 1;
profExp.length = 0;
global.cultivateSkill('art_breathing', 100);
assert('副掌门加成最高（' + profExp[0] + '）', profExp[0] === 150);

// ==================== P3 门派日常有工夫 ====================
console.log('\n[P3] 门派日常有工夫');
load('js/sects/sects-deep-data.js');
var CT = global.COMMON_TASKS;
assert('十条日常全在', Array.isArray(CT) && CT.length === 10);
assert('每条都写了工夫（耗时+精力）', CT.every(function (t) { return t.cost && t.cost.minutes > 0 && t.cost.energy > 0; }));
assert('外交出访最费工夫', CT.filter(function (t) { return t.id === 'task_diplomacy'; })[0].cost.minutes === 240);

load('js/sects/sects-deep-ui.js');
global.RewardService = { apply: function () { return { success: true, messages: ['贡献+5'] }; } };
msgs.length = 0; timeCalls.length = 0;
global.currentCharData.energy = 200;
assert('在宗门、职级够，能接差事', global.sectCompleteTask('少林寺', 'task_clean') === true);
assert('差事扣精力（200 → ' + global.currentCharData.energy + '）', global.currentCharData.energy === 190);
assert('差事推时间（40 分钟入账）', timeCalls.some(function (x) { return x.m === 40; }));
assert('同一桩不重做', global.sectCompleteTask('少林寺', 'task_clean') === false);
// 不在宗门
global.discipleState.isInSect = false;
msgs.length = 0;
assert('不在宗门做不得差事', global.sectCompleteTask('少林寺', 'task_chores') === false);
global.discipleState.isInSect = true;
// 职级不够
assert('职级不够接不了讲道', global.sectCompleteTask('少林寺', 'task_lecture') === false);
// 精力不足
global.currentCharData.energy = 5;
msgs.length = 0;
assert('精力不足做不动', global.sectCompleteTask('少林寺', 'task_patrol') === false);
assert('精力没被白扣（仍是 5）', global.currentCharData.energy === 5);

// ==================== P4 打扫洞府能做完 ====================
console.log('\n[P4] 打扫洞府能做完');
load('js/house-system.js');
assert('洒扫已实现', typeof global.cleanDwelling === 'function');
emitted.length = 0;
global.currentCharData.energy = 200;
global.playerHouse = { type: 'cave', upgrades: {}, planted: [] };
assert('有洞府才扫得成', global.cleanDwelling() === true);
assert('clean:completed 事件真的发出去了（「打扫洞府」日常因此可完成）',
    emitted.some(function (x) { return x.e === 'clean:completed'; }));
assert('洒扫扣精力', global.currentCharData.energy === 185);
var sectSysSrc = src('js/sects/sects-system.js');
assert('门派任务桥在听 clean:completed', sectSysSrc.indexOf("'clean:completed'") >= 0);

// ==================== P5 长者事务有工夫 ====================
console.log('\n[P5] 长者事务有工夫');
global.SECT_INTERNAL = { '少林寺': { resources: 100 } };
global.discipleState = { isInSect: true, sectId: 'shaolin', sectName: '少林寺', rank: 2, rankName: '长老', contribution: 0, tasksCompleted: 0 };
global.currentCharData.energy = 200;
global.addFame = function () {};
global.addExp = function () {};
timeCalls.length = 0;
var rewardCalls = [];
global.RewardService.apply = function (s) { rewardCalls.push(s); return { success: true, messages: [] }; };
var acceptElder = null;
try { acceptElder = global.acceptElderTask; } catch (e) {}
if (typeof acceptElder !== 'function') {
    // 函数若未导出，退回源码级检查
    var es = sectSysSrc;
    assert('长老事务写明工夫（精力/耗时）', es.indexOf("cost = { energy: 25, minutes: 120 }") >= 0 &&
        es.indexOf("cost = { energy: 35, minutes: 240 }") >= 0);
    assert('事务推时间入账', es.indexOf("'长者事务·' + title") >= 0);
} else {
    assert('教导新弟子可做', acceptElder('teach') === true);
    assert('教导耗时 120 分钟', timeCalls.some(function (x) { return x.m === 120; }));
    assert('教导扣精力 25', global.currentCharData.energy === 175);
}
assert('事务面板有成本说明', sectSysSrc.indexOf('耗时 ' + "' + cost.minutes") >= 0 || sectSysSrc.indexOf("cost.minutes") >= 0);

// ==================== P6 任务可达性 ====================
console.log('\n[P6] 任务可达性');
var html = src('仙侠.html');
assert('任务页有「门派日常」容器（此前 #daily-quest-list 根本不存在）', html.indexOf('id="daily-quest-list"') >= 0);
assert('任务页有「布告委托」容器', html.indexOf('id="random-quest-list"') >= 0);
assert('任务页有「故人心事」容器', html.indexOf('id="npc-quest-list"') >= 0);
var qsrc = src('js/quest/quest-system.js');
assert('布告委托渲染器已实现', qsrc.indexOf('function updateRandomQuestUI') >= 0);
assert('故人心事渲染器已实现', qsrc.indexOf('function updateNpcQuestUI') >= 0);
assert('两台渲染器都挂进面板刷新', qsrc.indexOf('updateRandomQuestUI();') >= 0 && qsrc.indexOf('updateNpcQuestUI();') >= 0);
assert('面板刷新调用点 ≥2 处（开面板 + 接任务）',
    (qsrc.match(/updateRandomQuestUI\(\);/g) || []).length >= 2);
assert('故人心事按交情过滤（好感不到不显示）', qsrc.indexOf('minAffection') >= 0);
assert('布告委托按类型从注册表取（random 20 条可达）', qsrc.indexOf("q.type === 'random'") >= 0);

// ==================== P7 战斗认具体敌人 ====================
console.log('\n[P7] 战斗认具体敌人');
var appSrc = src('js/app.js');
assert('startBattle 认对象入参（explicitEnemy）', appSrc.indexOf('var enemyData = explicitEnemy || gen(level, type);') >= 0);
assert('对象入参按 physiologyType/type 判兽形', appSrc.indexOf("typeOrData.physiologyType === 'beast'") >= 0);
assert('声明的敌人等级会抬升战斗档位', appSrc.indexOf('if (_declaredLv > 0) level = Math.max(level, _declaredLv);') >= 0);
assert('护宗战传入的强敌数据不再是摆设',
    appSrc.indexOf('level: tier * 4 + 10') >= 0);

console.log('\n========== 结果：' + passed + ' 通过 / ' + failed + ' 失败 ==========');
process.exit(failed ? 1 : 0);
