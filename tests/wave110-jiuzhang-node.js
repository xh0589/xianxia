/**
 * wave110-jiuzhang-node.js — 第一百一十波 · 救账（外包实机 BUG 单核对与修复）验收：
 *   用户点账：FIX_NOTES.md（12 轮实机测试、34+ 条）「你再看看新BUG，核对并修改」。
 *   本波修复：NEW-98/99/100/104/105/106/107/108/109（存档桥与任务/队伍双账本家族）、
 *             NEW-49（八处通配删除）、NEW-50（交付按钮无入口）、NEW-53（晋升按钮互斥）、
 *             NEW-60（信件未转义）、NEW-101/52（showChoiceDialog 无真身）、NEW-103（副职业幽灵）、
 *             FIX-05（战斗被残留弹窗拦截）、「叫错名字」族（addExp/addInsightPoints/openSectTasks）。
 *   核对为已修（早前波次）：FIX-01 主路/FIX-02/FIX-03/FIX-04/MED-01/TASK-01/游商-01 钱包同步/NEW-54（一百零七波）。
 *   Q 任务账本   P 队伍账本   E 导出/存档桥   M 弹窗纪律   C 选择对话框   G 杂项哨兵
 *
 * 运行：node tests/wave110-jiuzhang-node.js
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
function eq(a, b, msg) { assert(a === b, msg + '（实际=' + JSON.stringify(a) + ' 期望=' + JSON.stringify(b) + '）'); }
function load(rel) { vm.runInThisContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), { filename: rel }); }
function src(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// ==================== 测试桩 ====================
global.window = global;
global.XianXia = {};
var els = {};
function fakeEl(tag) {
    var el = {
        tag: tag || '', children: [], style: {}, attrs: {},
        setAttribute: function (k, v) { this.attrs[k] = String(v); },
        getAttribute: function (k) { return this.attrs[k] !== undefined ? this.attrs[k] : null; },
        appendChild: function (c) { this.children.push(c); return c; },
        removeChild: function () {}, remove: function () {}, addEventListener: function () {}, removeEventListener: function () {},
        closest: function () { return null; }, scrollIntoView: function () {},
        classList: { add: function () {}, remove: function () {}, toggle: function () {}, contains: function () { return true; } },
        _html: '', textContent: '', options: [], value: '', checked: false
    };
    Object.defineProperty(el, 'innerHTML', {
        get: function () { return this._html; },
        set: function (v) { this._html = String(v); },
        configurable: true
    });
    return el;
}
global.document = {
    readyState: 'complete',
    createElementNS: function (ns, tag) { return fakeEl(tag); },
    createElement: function (tag) { return fakeEl(tag); },
    getElementById: function (id) { if (!els[id]) els[id] = fakeEl(); return els[id]; },
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
    addEventListener: function () {},
    body: { appendChild: function () {} }
};
var store = {};
global.localStorage = {
    getItem: function (k) { return store[k] !== undefined ? store[k] : null; },
    setItem: function (k, v) { store[k] = String(v); },
    removeItem: function (k) { delete store[k]; }
};
var msgs = [];
global.showMessage = function (m) { msgs.push(String(m)); };
var modals = [];
global.showModal = function (title, body) { modals.push({ title: String(title), body: String(body) }); };
global.EventBus = { emit: function () {}, on: function () {}, off: function () {} };
global.addItem = function () { return true; };
global.updateCurrencyUI = function () {};
global.updateCharacterStatus = function () {};
global.switchPanel = function () {};
var _day = 500;
global.getAbsoluteDay = function () { return _day; };
global.timeSystem = { advanceTime: function () {}, getAbsoluteDay: function () { return _day; }, gameTime: { currentDay: _day, totalMinutes: _day * 1440 } };
global.currentCharData = { name: '核账人', realm: '筑基', layer: 3, location: '洛水城', lifeSkills: {}, tempering: 0 };
global.inventory = { currency: { spiritStones: 100, copper: 100 }, maxSlots: 30, slots: [] };

load('js/global-utils.js');
load('js/quest/quest-system.js');
load('js/party-system.js');
// global-utils 带着真 showMessage/showModal 进场——捕获桩要排在加载之后换装，否则被真身顶掉
global.showMessage = function (m) { msgs.push(String(m)); };
global.showModal = function (title, body) { modals.push({ title: String(title), body: String(body) }); };

// ==================== Q · 任务账本（NEW-99/100/105/109/50） ====================
console.log('\n[Q] 任务账本：账本是真源，模板只是渲染缓存');
var QS = window.questSystem;
var idA = window.allQuests[0].id, idB = window.allQuests[1].id;
// 旧档现场复刻：main 任务重复两颗（NEW-100 的真实样本形状）
store['xianxia_quest_progress'] = JSON.stringify({ activeQuests: [idA, idB, idA], completedQuests: [], totalCompleted: 0 });
QS.initQuestSystem();
var snap = QS.getQuestProgressSnapshot();
eq(snap.activeQuests.length, 2, 'Q1 读档去重——同一任务两颗只认一颗（旧档实样 main_001×2）');
eq(QS.findQuestById(idA).accepted, true, 'Q2 账本回灌模板：账里接过的，模板 accepted 真置上（NEW-105）');
eq(QS.findQuestById(idB).accepted, true, 'Q3 第二条也回灌');
msgs.length = 0;
eq(QS.acceptQuest(idA), false, 'Q4 刷新后重接同一任务——账本闸门拦下（此前模板布尔每刷新归 false，能无限重接）');
assert(msgs.join('').indexOf('已经接取') >= 0, 'Q5 拦得明白');
eq(QS.getQuestProgressSnapshot().activeQuests.length, 2, 'Q6 账本没被塞进第三颗');
// 真接口：存档桥认的两颗名（NEW-99/109 的根修——此前全库无定义，collect 落空壳、apply 写幻影）
eq(typeof window.exportQuestState, 'function', 'Q7 exportQuestState 有真身（game-state 的守卫不再恒假）');
eq(typeof window.importQuestState, 'function', 'Q8 importQuestState 有真身');
var idC = window.allQuests[2].id;
window.importQuestState({ activeQuests: [idC], completedQuests: [idA], totalCompleted: 1 });
eq(QS.findQuestById(idA).turnedIn, true, 'Q9 载入即换账：上一角色的任务状态随账本走（NEW-109——此前内存永远是旧角色的账）');
eq(QS.findQuestById(idC).accepted, true, 'Q10 新账本的任务模板同步回灌');
eq((store['xianxia_quest_progress'] || '').indexOf(idC) >= 0, true, 'Q11 裸键同步落新账（读档→刷新不再清空）');
// 交付门与交付按钮（NEW-50）
msgs.length = 0;
eq(QS.turnInQuest(idA), false, 'Q12 已交付的任务不能再交（重复领赏回路掐断）');
var qC = QS.findQuestById(idC);
qC.completed = true;   // 模拟事件桥把目标做满
var done = QS.getCompletedQuests();
assert(done.some(function (q) { return q.id === idC; }), 'Q13 做满未交付的任务真进「可交付」列表（旧谓词自我排除，列表恒空）');
assert(src('js/quest/quest-system.js').indexOf("(isCompleted || (quest.completed && !quest.turnedIn))") >= 0, 'Q14 活跃列表也给交付按钮（此前交付在面板上无任何入口）');
// 目标进度随账落盘（NEW-105 的 [2/10] 归零病）
if (qC.objectives && qC.objectives[0]) { qC.objectives[0].currentCount = 2; }
QS.saveQuestProgress();
var raw = JSON.parse(store['xianxia_quest_progress']);
assert(raw.questState && raw.questState[idC] && raw.questState[idC].objectives[0].currentCount === 2, 'Q15 目标进度（2/N）随账落盘——读档不再归零');

// ==================== P · 队伍账本（NEW-98） ====================
console.log('\n[P] 队伍账本：就地灌，不重绑');
var PS = window.partySystem;
var identityBefore = (window.partyData === PS.partyData);
window.importPartyState({
    members: [{ id: 'm1', name: '甲', level: 3, relationship: { affection: 60, trust: 0, loyalty: 50 } }],
    maxMembers: 4, leaderId: 'm1', formation: 'attack',
    battleLog: [], fallen: [{ id: 'f1', name: '殁者', level: 2, cause: '战死' }],
    totalBattles: 5, wonBattles: 3
});
eq(PS.partyData.members.length, 1, 'P1 读档灌进模块正主（此前重绑 window 属性，正主原地不动）');
eq(typeof PS.partyData.members[0].gainExp, 'function', 'P2 灌进来的是真 PartyMember 实例（方法齐全）');
eq(identityBefore && window.partyData === PS.partyData, true, 'P3 window.partyData 与 partySystem.partyData 仍是同一颗对象——不再分叉');
eq(PS.partyData.formation, 'attack', 'P4 阵型账跟上');
eq(PS.partyData.totalBattles, 5, 'P5 战绩账跟上');
var exp = window.exportPartyState();
eq(exp.members.length, 1, 'P6 exportPartyState 出口有真身（collect 不再读孤儿镜像）');
eq(exp.members[0].gainExp, undefined, 'P7 导出是纯数据（JSON 安全）');

// ==================== E · 存档桥与导出（NEW-104/106/107/108） ====================
console.log('\n[E] 存档桥：载入不删键、导出不吃槽、灵根与时辰有账');
var gsSrc = src('js/core/game-state.js');
assert(gsSrc.indexOf('if (val == null) return;') >= 0 && gsSrc.indexOf('第一百一十波 · NEW-104') >= 0, 'E1 writeKey 缺格跳过——「载入即删键」根除（NEW-104）');
assert(gsSrc.indexOf("typeof global.importQuestState === 'function'") >= 0 && gsSrc.indexOf("typeof global.importPartyState === 'function'") >= 0, 'E2 存档桥的两颗守卫如今都有真身接（幻影分支永不走）');
assert(gsSrc.indexOf('roots: fullState.roots || fullState.spiritualRoots || {}') >= 0, 'E3 buildSaveMeta 带灵根摘要——自动档列表不再恒「金-%」（NEW-107）');
var appSrc = src('js/app.js');
assert(appSrc.indexOf('saveGame({ autoMode: true, silent: true })') >= 0, 'E4 导出走只取数据的路（NEW-106）');
assert(appSrc.indexOf('s.timestamp === saveData.timestamp') < 0, 'E5 「导出一份＝槽里少一份」的 splice 已拆');
assert(appSrc.indexOf('last-auto-save-time') >= 0 && appSrc.indexOf('_maxAuto') >= 0, 'E6 「上次保存/上次自动保存」从槽账回填（NEW-108）');

// ==================== M · 弹窗纪律（NEW-49 + FIX-05） ====================
console.log('\n[M] 弹窗纪律：通配删除绝迹，开战先收残窗');
assert(appSrc.indexOf("querySelector('.fixed.inset-0") < 0, 'M1 app.js 五处通配删除全换成保护版（NEW-49）');
assert(src('js/travel-system.js').indexOf("querySelector('.fixed.inset-0") < 0, 'M2 travel-system 那处也换了');
assert(src('js/npcs/npc-system.js').indexOf("querySelector('.fixed.inset-0") < 0, 'M3 npc-system 那处也换了');
assert((appSrc.match(/closeRuntimeModals\(\)/g) || []).length >= 7, 'M4 保护版收口处处挂上（≥7 处）');
assert(Array.isArray(window.STATIC_PANEL_IDS) && window.STATIC_PANEL_IDS.indexOf('reincarnation-modal') >= 0, 'M5 静态面板保护名单在（转世/战斗/交互三块永不删）');
var gsBattle = appSrc.indexOf('function globalStartBattle');
assert(appSrc.slice(gsBattle, gsBattle + 400).indexOf('closeRuntimeModals') >= 0, 'M6 开战即收残窗（FIX-05：演武场训练弹窗不再拦战斗按钮）');
var obe = appSrc.indexOf('function openBattleWithEntity');
assert(appSrc.slice(obe, obe + 300).indexOf('closeRuntimeModals') >= 0, 'M7 实体战口子同样先收窗');

// ==================== C · 选择对话框（NEW-101） ====================
console.log('\n[C] 选择对话框：钱不能被默默扣走');
eq(typeof window.showChoiceDialog, 'function', 'C1 showChoiceDialog 有真身（此前全库无定义，垂危确认弹窗永不出现、兜底直接扣一半灵石）');
var picked = null;
modals.length = 0;
window.showChoiceDialog({
    title: '某人 垂危', text: '已垂危7天。',
    options: [{ text: '🛡️ 救治', value: 'heal' }, { text: '💀 任其离世', value: 'die' }],
    onChoose: function (v) { picked = v; }
});
eq(modals.length, 1, 'C2 对话框真弹了');
assert(modals[0].body.indexOf('__choiceDialogPick(1)') >= 0, 'C3 选项各自带真回调');
window.__choiceDialogPick(1);
eq(picked, 'die', 'C4 点哪个就是哪个（三条路都选得到了）');
eq(window.__choiceDialogCfg, null, 'C5 选完即清，不留悬账');

// ==================== G · 杂项哨兵（NEW-53/60/103、叫错名字族、FIX 核对） ====================
console.log('\n[G] 杂项：晋升钮、信纸转义、幽灵调用、叫错名字族');
var sduSrc = src('js/sects/sects-deep-ui.js');
assert(sduSrc.indexOf('var isNext = r.id === currentRank - 1;') >= 0 && sduSrc.indexOf('var isLocked = r.id < currentRank;') < 0, 'G1 晋升按钮的互斥死结解开（NEW-53：反向梯度按「下一级」认）');
var mailSrc = src('js/mail-system-ui.js');
assert(mailSrc.indexOf('function _esc(') >= 0 && mailSrc.indexOf('_esc(m.subject') >= 0 && mailSrc.indexOf("MAIL_BODY_CAP = 500") >= 0, 'G2 信纸进 DOM 先转义 + 500 字长度门（NEW-60）');
var hpSrc = src('js/map/high-planes.js');
assert(hpSrc.indexOf('window.addExp(') < 0 && (hpSrc.match(/window\.gainExp\(/g) || []).length === 2, 'G3 血池/位面打坐的修为奖励接上真名 gainExp——「修为+300」不再是空话');
assert(hpSrc.indexOf("typeof window.addInsightPoints === 'function'") < 0 && hpSrc.indexOf('window.insightPoints = (window.insightPoints || 0) + insight') >= 0, 'G4 位面顿悟的领悟点真落账');
assert(src('js/sects/sects-system.js').indexOf('window.gainExp(rewards.exp)') >= 0, 'G5 长者事务的修为奖励接上真名');
assert(src('js/npcs/npc-system.js').indexOf('window.openSectTaskUI()') >= 0, 'G6 长老「👑 请示」指向真函数（openSectTasks 查无此人）');
assert(src('js/enhancement.js').indexOf('addProfessionExp') < 0 && src('js/house-system.js').indexOf('addProfessionExp(') < 0, 'G7 副职业幽灵调用清干净（NEW-103：真账是 growLifeSkill）');
assert(src('js/crafting.js').indexOf('window.canCraftWithProfession = function') >= 0, 'G8 合成置灰的门槛有真身——「可合成」点下去才吃闭门羹的病修了');
// 核对为已修的（早前波次），立哨兵防回归
assert(src('仙侠.html').indexOf('第八十二波·FIX-02') >= 0, 'G9 FIX-02 tailwind 冷启动报错已修（八十二波碑还在）');
assert(appSrc.indexOf('function showCityTravelUI()') >= 0, 'G10 FIX-03 前往城市已修（真函数在）');
assert(src('js/city-facilities/festival-fair.js').indexOf('第八十二波·FIX-04') >= 0, 'G11 FIX-04 灯谜跨午夜已修（先锁题再耗时）');
assert(src('js/party-system.js').indexOf('_memberRecordAction') >= 0, 'G12 NEW-54 战后结算吞账已修（一百零七波）');
assert(src('tests/run-all.sh').indexOf('wave110-jiuzhang-node.js') >= 0, 'G13 本套已挂全量回归');

console.log('\n========== wave110 结果：' + passed + ' 通过 / ' + failed + ' 失败 ==========');
if (failed > 0) process.exit(1);
