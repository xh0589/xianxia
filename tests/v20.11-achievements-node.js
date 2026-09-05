/**
 * v20.11-achievements-node.js — 成就墙做实（v20.11）
 *
 * 覆盖：
 *   A 结构：≥30 枚、id 唯一、奖励键白名单
 *   B 防幽灵键全表校验：每条达成条件路径在档案快照上有定义且为数值
 *   C 白送回归锁：空世界一次检查不得点亮任何成就；每日钩子已挂
 *   D 满配世界：32/33 点亮（善恶业障天然互斥）、积分=完成集重算、
 *     奖励金额=完成集应发和、二次检查不重复发奖
 *   E 并档：版本新增成就对旧档可见、完成状态保留、积分重算一致
 *   F 面板渲染：分类标题 + 隐藏成就 ??? + 汇总行
 *   G 静态：初始化无 serialize 回环；击杀计数写入点/持久化字段/页面入口齐备
 *
 * 运行：node tests/v20.11-achievements-node.js
 */
'use strict';

var path = require('path');
var fs = require('fs');
var vm = require('vm');

var passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) passed++;
    else { failed++; console.error('[FAIL] ' + msg); }
}

// —— 世界桩 ——
var copperPool = 0, stonesPool = 0;
var rsLog = { fame: 0, karma: 0 };
var newDayHooks = [];

var elStore = {};
function fakeEl(id) {
    if (!elStore[id]) elStore[id] = { id: id, innerHTML: '', textContent: '' };
    return elStore[id];
}

var mockWindow = {
    console: { log: function () {} },
    JSON: JSON, Object: Object, Array: Array, Math: Math, Number: Number, isFinite: isFinite,
    gameLog: { entries: [], add: function () {} },
    showMessage: function () {},
    currentCharData: null,
    XianXia: {},
    timeSystem: { onNewDaySubscribe: function (fn) { newDayHooks.push(fn); } },
    REALM_CONFIG: { realms: [
        { name: '炼气' }, { name: '筑基' }, { name: '金丹' }, { name: '元婴' },
        { name: '化神' }, { name: '炼虚' }, { name: '合体' }, { name: '大乘' }, { name: '渡劫' }
    ] },
    document: {
        querySelector: function () { return null; },
        querySelectorAll: function () { return []; },
        getElementById: function (id) { return fakeEl(id); }
    },
    dayNow: 0
};
mockWindow.getRealmIndex = function (name) {
    return mockWindow.REALM_CONFIG.realms.findIndex(function (r) { return r.name === name; });
};
mockWindow.getAbsoluteDay = function () { return mockWindow.dayNow; };
mockWindow.XianXia.DataManager = {
    getCopper: function () { return copperPool; },
    setCopper: function (v) { copperPool = v; },
    getSpiritStones: function () { return stonesPool; },
    setSpiritStones: function (v) { stonesPool = v; }
};
mockWindow.RewardService = {
    apply: function (r) {
        if (r && r.fame) rsLog.fame += r.fame;
        if (r && r.karma) rsLog.karma += r.karma;
        return { success: true };
    }
};
mockWindow.window = mockWindow;
mockWindow.global = mockWindow;

var ctx = vm.createContext(mockWindow);
vm.runInContext(fs.readFileSync(path.resolve(__dirname, '..', 'js', 'core', 'event-bus.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.resolve(__dirname, '..', 'js', 'core', 'state-registry.js'), 'utf8'), ctx);
mockWindow.EventBus = ctx.EventBus;
mockWindow.StateRegistry = ctx.StateRegistry;
vm.runInContext(fs.readFileSync(path.resolve(__dirname, '..', 'js', 'achievement-system.js'), 'utf8'), ctx);
var AS = mockWindow;

// ============ A: 结构 ============
var presets = AS.PresetAchievements;
assert(presets.length >= 30, 'A1 成就总数 ≥30（实际 ' + presets.length + '）');
var ids = {};
var dup = null;
for (var i = 0; i < presets.length; i++) {
    if (ids[presets[i].id]) dup = presets[i].id;
    ids[presets[i].id] = 1;
}
assert(dup === null, 'A2 id 全表唯一（重复: ' + dup + '）');
var ALLOWED_REWARD = { exp: 1, gold: 1, copper: 1, stones: 1, fame: 1, karma: 1, items: 1, special: 1 };
var badReward = null;
presets.forEach(function (a) {
    Object.keys(a.reward || {}).forEach(function (k) { if (!ALLOWED_REWARD[k]) badReward = a.id + '.' + k; });
});
assert(badReward === null, 'A3 奖励键全在发放器支持范围内（越界: ' + badReward + '）');

// ============ B: 防幽灵键全表校验 ============
mockWindow.currentCharData = {};
mockWindow.dayNow = 0;
var profileEmpty = AS.buildAchievementProfile();
var ghost = null;
presets.forEach(function (a) {
    Object.keys(a.requirements || {}).forEach(function (k) {
        var v = profileEmpty[k];
        if (typeof v !== 'number') ghost = a.id + ' → ' + k + ' (' + typeof v + ')';
    });
});
assert(ghost === null, 'B1 每条条件路径在档案快照上有定义（幽灵: ' + ghost + '）');
assert(profileEmpty.ascended === 0 && profileEmpty.realmIdx === 0 && profileEmpty.sectRankId === 9,
    'B2 空世界保守下界：未飞升/炼气/野身');

// ============ C: 白送回归锁 ============
AS.initAchievementSystem();
assert(newDayHooks.length === 1, 'C1 每日补查钩子已挂（' + newDayHooks.length + '）');
AS.checkAchievementsNow();
var mgr = mockWindow.achievementManager;
assert(mgr.getCompletedAchievements().length === 0, 'C2 空世界检查后 0 点亮（serialize 回环白送 bug 已锁死）');
// 手动触发每日钩子：仍 0 点亮
newDayHooks[0]();
assert(mgr.getCompletedAchievements().length === 0, 'C3 每日钩子同样不误点亮');

// ============ D: 满配世界 ============
mockWindow.currentCharData = {
    realm: '飞升', tempering: 500, luck: 90, karma: -80, fame: 90, notoriety: 60,
    _killCount: 400,
    // v20.12 情缘真源：三档道侣 + 二子（child_three 需 3 子故不亮）
    bonds: { np1: { type: 'dao_companion', name: '道侣', level: 3 } },
    _children: [{ name: '甲' }, { name: '乙' }],
    // v20.16 后天改命真源：三次重塑（破而后立/洗尽铅华满配应亮）
    _rootRefines: 3
};
copperPool = 20000; stonesPool = 3000;
mockWindow.learnedSecrets = new Array(25);
mockWindow.getCollectionStats = function () { return { items: 50, npcs: 35 }; };
mockWindow.discipleState = { isInSect: true, rank: 1, contribution: 600 };
mockWindow.tamedBeasts = [
    { level: 20 }, { level: 5 }, { level: 12 }, { level: 20 }, { level: 8 }
];
mockWindow.CityDepth = { progress: function () { return { trialBest: 18, swordIntent: 12 }; } };
mockWindow.dayNow = 400;
// 池先垫资：财富成就本身要求池里有 1 万铜/2 千灵石，核账用「终值−垫资」
var copperSeed = 20000, stonesSeed = 3000;
AS.checkAchievementsNow();
var completed = mgr.getCompletedAchievements();
// 两枚天然留白：业障 -80 时「仁者寿」不成立；二子之时无「兰阶玉盈」，其余全亮
var SKIP_IDS = { benevolent: 1, child_three: 1 };
var expectDone = presets.filter(function (p) { return !SKIP_IDS[p.id]; }).map(function (p) { return p.id; });
var missing = expectDone.filter(function (id) { return completed.indexOf(id) < 0; });
assert(missing.length === 0, 'D1 满配点亮 ' + expectDone.length + '/' + presets.length + '（缺: ' + missing.join(',') + '）');
assert(mgr.getAchievement('benevolent').isCompleted === false, 'D2 业障 -80 时善名成就正确不点亮');
// 积分 = 完成集重算（增量与重算同账本）
var expectPts = 0;
mgr.getAllAchievements().forEach(function (a) { if (a.isCompleted) expectPts += a.points; });
assert(mgr.totalPoints === expectPts, 'D3 成就积分=完成集直和（' + mgr.totalPoints + '/' + expectPts + '）');
// 奖励金额 = 完成集应发和，且二次检查不重复
var expectCopper = 0, expectStones = 0, expectFame = 0;
mgr.getAllAchievements().forEach(function (a) {
    if (!a.isCompleted) return;
    expectCopper += (a.reward.gold || 0) + (a.reward.copper || 0);
    expectStones += (a.reward.stones || 0);
    expectFame += (a.reward.fame || 0);
});
assert(copperPool - copperSeed === expectCopper, 'D4 铜钱奖励=完成集应发和（' + (copperPool - copperSeed) + '/' + expectCopper + '）');
assert(stonesPool - stonesSeed === expectStones, 'D5 灵石奖励=完成集应发和（' + (stonesPool - stonesSeed) + '/' + expectStones + '）');
assert(rsLog.fame === expectFame, 'D6 名气奖励经统一发放通道且只发一次（' + rsLog.fame + '/' + expectFame + '）');
var copperBefore = copperPool;
AS.checkAchievementsNow();
assert(copperPool === copperBefore && rsLog.fame === expectFame, 'D7 重复检查不二次发奖');

// ============ E: 并档（版本新增成就对旧档可见） ============
var snap = mockWindow.StateRegistry.exportAll();
snap = JSON.parse(JSON.stringify(snap)); // 模拟落盘往返
// 模拟版本更新：定义里新增一枚，快照（旧档）里没有
mgr.addAchievement(new AS.Achievement('test_future', '来日之证', '占位', {
    category: 'general', requirements: { killCount: 999999 }, points: 7, hidden: true
}));
mockWindow.StateRegistry.importAll(snap);
assert(!!mgr.getAchievement('test_future'), 'E1 新增成就读旧档后仍可见（旧版 clear+覆盖缺陷已修）');
assert(mgr.getAchievement('test_future').isCompleted === false, 'E2 新增成就不因旧档虚位被误点亮');
assert(mgr.getAchievement('ascension').isCompleted === true, 'E3 旧档完成状态保留');
assert(mgr.getAchievement('benevolent').isCompleted === false, 'E4 未完成状态也如实保留');
var rePts = 0;
mgr.getAllAchievements().forEach(function (a) { if (a.isCompleted) rePts += a.points; });
assert(mgr.totalPoints === rePts, 'E5 并档后积分账本按完成集重算一致');

// ============ H: 弹窗风暴修复（用户实测：击败敌人弹一堆） ============
var toasts = [];
mockWindow.showMessage = function (m) { toasts.push(String(m)); };
// H1 单枚点亮：只弹一条（v20.15：解锁名与奖励合并成一句话，旧版此处弹两条）
assert(mgr.getAchievement('benevolent').isCompleted === false, 'H0 前置：仁者寿仍未点亮');
mockWindow.currentCharData.karma = 60;
toasts.length = 0;
AS.checkAchievementsNow();
assert(mgr.getAchievement('benevolent').isCompleted === true, 'H1a 业障转善后仁者寿点亮');
assert(toasts.length === 1 && toasts[0].indexOf('成就解锁') >= 0 && toasts[0].indexOf('仁者寿') >= 0,
    'H1b 单枚检查恰好弹一条且含成就名（实际 ' + toasts.length + ' 条）');
// H2 多枚同刻点亮：合并为一条汇总，不逐条轰炸
mgr.addAchievement(new AS.Achievement('test_bulk1', '批量甲', '', { category: 'general', requirements: { killCount: 400 }, reward: { gold: 1 } }));
mgr.addAchievement(new AS.Achievement('test_bulk2', '批量乙', '', { category: 'general', requirements: { killCount: 399 }, reward: { gold: 1 } }));
toasts.length = 0;
AS.checkAchievementsNow();
assert(mgr.getAchievement('test_bulk1').isCompleted && mgr.getAchievement('test_bulk2').isCompleted, 'H2a 两枚同刻点亮');
assert(toasts.length === 1 && toasts[0].indexOf('成就解锁 2 枚') >= 0, 'H2b ≥2 枚只弹一条汇总（实际 ' + toasts.length + ' 条）');
assert(!toasts.some(function (t) { return t.indexOf('成就解锁: 批量甲') >= 0; }), 'H2c 汇总时不再逐条弹');
// H3 读档静默补课：早已满足的成就在载入时补发一条汇总，不积压到首战
mgr.addAchievement(new AS.Achievement('test_bulk9', '补课专送', '', { category: 'general', requirements: { killCount: 400 } }));
var snap2 = JSON.parse(JSON.stringify(mockWindow.StateRegistry.exportAll()));
mgr.achievements.delete('test_bulk9'); // 模拟：定义里有、刚导出的快照里没有 → 读档时该成就应被静默补点亮
toasts.length = 0;
mockWindow.StateRegistry.importAll(snap2);
assert(mgr.getAchievement('test_bulk9') && mgr.getAchievement('test_bulk9').isCompleted, 'H3a 读档即静默补课点亮（战斗时不再补爆）');
assert(toasts.every(function (t) { return t.indexOf('批量') < 0 || t.indexOf('🏅 成就解锁') >= 0; }), 'H3b 补课不逐条轰炸（' + toasts.join(' | ') + '）');
// H4 单枚+奖励只弹一条：解锁名与奖励合并（v20.15 残留通道——旧版单枚点亮弹"解锁"+"奖励"两条）
mgr.addAchievement(new AS.Achievement('test_solo', '孤峰独步', '', { category: 'general', requirements: { notoriety: 77 }, reward: { gold: 4 } }));
mockWindow.currentCharData.notoriety = 80;
toasts.length = 0;
AS.checkAchievementsNow();
assert(mgr.getAchievement('test_solo').isCompleted === true, 'H4a 孤峰独步点亮');
assert(toasts.length === 1, 'H4b 单枚点亮含奖励播报也只弹一条（旧版两条；实际 ' + toasts.length + ' 条）');
assert(toasts[0].indexOf('孤峰独步') >= 0 && toasts[0].indexOf('奖励') >= 0 && toasts[0].indexOf('铜钱+4') >= 0,
    'H4c 一条提示里解锁名与奖励都在（' + toasts[0] + '）');
// H5 用户现象路径复现：连续多场战斗逐场点亮（每场跨一档）——旧版每场弹 2 条、越打越刷屏
var kb = mockWindow.currentCharData._killCount || 0;
var dripIds = [];
for (var hb = 1; hb <= 5; hb++) {
    var did = 'test_drip' + hb;
    dripIds.push(did);
    mgr.addAchievement(new AS.Achievement(did, '滴灌' + hb, '', { category: 'combat', requirements: { killCount: kb + hb }, points: 1 }));
}
var maxPerBattle = 0;
for (var hb2 = 1; hb2 <= 5; hb2++) {
    mockWindow.currentCharData._killCount = kb + hb2; // 模拟第 hb2 场胜利 +1 击杀并检查
    toasts.length = 0;
    AS.checkAchievementsNow();
    if (toasts.length > maxPerBattle) maxPerBattle = toasts.length;
}
assert(dripIds.every(function (id) { return mgr.getAchievement(id).isCompleted; }), 'H5a 五场五档逐场点亮属实');
assert(maxPerBattle <= 1, 'H5b 逐场点亮时每一场至多 1 条提示（最坏 ' + maxPerBattle + ' 条，封顶生效）');

// ============ F: 面板渲染 ============
AS.renderAchievementPanel();
var listHtml = fakeEl('achievement-list').innerHTML;
var summaryTxt = fakeEl('achievement-summary').textContent;
assert(listHtml.indexOf('战阵') >= 0 && listHtml.indexOf('因果') >= 0, 'F1 面板按分类分节');
assert(listHtml.indexOf('？？？') >= 0, 'F2 隐藏未完成成就显示为 ???');
assert(summaryTxt.indexOf('已点亮') >= 0 && summaryTxt.indexOf('成就点') >= 0, 'F3 汇总行含进度与积分');
assert(listHtml.indexOf('旗开得胜') >= 0 && listHtml.indexOf('✓') >= 0, 'F4 已完成成就带勾与名称');

// ============ G: 静态集成 ============
var src = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'achievement-system.js'), 'utf8');
assert(src.indexOf('deserialize(achievement.serialize())') < 0, 'G1 初始化 serialize 回环（条件丢失白送 bug）已根除');
assert(src.indexOf('importMerged') >= 0, 'G2 读档走并档而非清档覆盖');
var appSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'app.js'), 'utf8');
assert(appSrc.indexOf('checkAchievementsNow') >= 0 && appSrc.indexOf('_killCount = (window.currentCharData._killCount || 0) + 1') >= 0,
    'G3 战斗胜利处：击杀计数唯一写入点 + 档案快照检查');
assert(appSrc.indexOf("renderAchievementPanel") >= 0, 'G4 面板切换接线成就墙渲染');
var gsSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'core', 'game-state.js'), 'utf8');
assert(gsSrc.indexOf('killCount: charData._killCount') >= 0 && gsSrc.indexOf('_killCount: n(saveData.killCount, 0)') >= 0,
    'G5 击杀计数入档且回灌（收藏/成就跨档守恒）');
assert(gsSrc.indexOf('collectionClaimed:') >= 0 && gsSrc.indexOf('_collectionClaimed:') >= 0,
    'G6 收藏领奖记录入档且回灌');
var htmlSrc = fs.readFileSync(path.resolve(__dirname, '..', '仙侠.html'), 'utf8');
assert(htmlSrc.indexOf('data-panel="achievements"') >= 0 && htmlSrc.indexOf('id="panel-achievements"') >= 0,
    'G7 页面有成就入口与面板容器');

console.log('v20.11 achievements: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
