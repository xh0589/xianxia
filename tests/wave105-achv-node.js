/**
 * wave105-achv-node.js — 第一百零五波 · 成就体检 验收：
 *   用户点账：「再看看成就，缺不缺，以及BUG(一开局点进去就完成?)：
 *             🤝广结善缘 ✓ 与 10 位侠客交好（2/6） / 🍵高朋满座 ✓ 与 30 位侠客交好（2/6）」
 *   诊断两病：
 *     病一（白送）：「交好数」错借图鉴账的「结识数」（好感>0 就算）——开局几百人入册，
 *                   寒暄几句就把 10/30 位的成就秒点亮。交好改用关系面板同槛：好感≥20。
 *     病二（错账上脸）：面板把「本类完成数/本类总数」（2/6）错挂在每一行描述后面，
 *                   读起来像成就自身进度。类账挪回类标题，行账改挂每枚成就的真进度（当前/目标）。
 *   A 白送锁：好感全员<20 → 交好 0 枚不点亮；图鉴账 npcs 再大也灌不进交好（两本账分家）
 *   B 真进度：好感≥20 的够 10 位才亮广结善缘、够 30 位才亮高朋满座
 *   C 面板：行内挂（当前/目标）真进度；类目标挂类账；旧的错挂法绝迹
 *   E 补缺口：占山→修缮→安置的营造一路此前零成就——新增安身立命/百工居肆/琼楼玉宇三枚
 *   D 哨兵：幽灵键防线仍在、满配世界口径已改 npcManager、挂全量回归
 *
 * 运行：node tests/wave105-achv-node.js
 */
'use strict';

var path = require('path');
var fs = require('fs');
var vm = require('vm');
var ROOT = path.resolve(__dirname, '..');

var passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) { passed++; console.log('  ✓ ' + msg); }
    else { failed++; console.error('  ✗ ' + msg); }
}
function eq(a, b, msg) { assert(a === b, msg + '（实际=' + JSON.stringify(a) + ' 期望=' + JSON.stringify(b) + '）'); }
function src(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// —— 世界桩（与 v20.11 同款口径） ——
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
    currentCharData: {},
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
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/core/event-bus.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/core/state-registry.js'), 'utf8'), ctx);
mockWindow.EventBus = ctx.EventBus;
mockWindow.StateRegistry = ctx.StateRegistry;
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/achievement-system.js'), 'utf8'), ctx);
var AS = mockWindow;

// 造一批 NPC：highN 个好感 20+（真交好），lowN 个好感 1~19（只是打过照面）
function makeCrowd(highN, lowN) {
    var arr = [];
    for (var i = 0; i < highN; i++) arr.push({ relationship: { affection: 20 + (i % 40) } });
    for (var j = 0; j < lowN; j++) arr.push({ relationship: { affection: 1 + (j % 19) } });
    return { getAllNPCs: function () { return arr; } };
}

AS.initAchievementSystem();
var mgr = AS.achievementManager;

// ==================== A · 白送锁 ====================
console.log('\n[A] 白送锁：打过照面不算交好，图鉴账灌不进人事账');
AS.npcManager = makeCrowd(0, 120);   // 一百二十个都只有一面之缘（好感 1~19）
var pA = AS.buildAchievementProfile();
eq(pA.friends, 0, 'A1 一百二十个一面之缘——交好数为 0（旧口径这里会白送 120）');
AS.getCollectionStats = function () { return { items: 5, npcs: 999 }; };
var pA2 = AS.buildAchievementProfile();
eq(pA2.friends, 0, 'A2 图鉴「结识 999」也灌不进交好账（两本账分家）');
eq(pA2.uniqueItems, 5, 'A3 图鉴的物品账照旧借用（收藏成就不受牵连）');
AS.checkAchievementsNow();
eq(mgr.getAchievement('social_butterfly').isCompleted, false, 'A4 广结善缘没被白送');
eq(mgr.getAchievement('friends_30').isCompleted, false, 'A5 高朋满座没被白送');

// ==================== C · 面板（先验未点亮时的进度脸） ====================
console.log('\n[C] 面板：行账各归各，类账挪回类标题');
AS.renderAchievementPanel();
var html = elStore['achievement-list'].innerHTML;
assert(html.indexOf('与 10 位侠客交好（0/10）') >= 0, 'C1 广结善缘行内挂自己的真进度（0/10）');
assert(html.indexOf('与 30 位侠客交好（0/30）') >= 0, 'C2 高朋满座行内挂自己的真进度（0/30）');
assert(html.indexOf('交好（0/6）') < 0, 'C3 旧的错挂法绝迹——描述后面不再是类账（0/6）');
assert(html.indexOf('人事 <span class="text-xs text-gray-500 font-normal">已点亮 0/9') >= 0, 'C4 类账挪回类标题（人事 已点亮 0/9——一百零六/一百零七波补知己档与队伍两枚后共九枚）');

// ==================== B · 真进度 ====================
console.log('\n[B] 真进度：好感≥20 才算一位交好');
AS.npcManager = makeCrowd(9, 100);
AS.checkAchievementsNow();
eq(AS.buildAchievementProfile().friends, 9, 'B1 九位真交好——账面上就是 9');
eq(mgr.getAchievement('social_butterfly').isCompleted, false, 'B2 差一位也不亮（10 位才够）');
AS.npcManager = makeCrowd(10, 100);
AS.checkAchievementsNow();
eq(mgr.getAchievement('social_butterfly').isCompleted, true, 'B3 第十位处出交情——广结善缘点亮');
eq(mgr.getAchievement('friends_30').isCompleted, false, 'B4 高朋满座还得再处二十位');
AS.npcManager = makeCrowd(30, 100);
AS.checkAchievementsNow();
eq(mgr.getAchievement('friends_30').isCompleted, true, 'B5 三十位交好——高朋满座点亮');
AS.renderAchievementPanel();
var html2 = elStore['achievement-list'].innerHTML;
assert(html2.indexOf('与 30 位侠客交好 <span class="text-yellow-600">已成</span>') >= 0, 'B6 点亮的挂「已成」，不再挂半截进度');
assert(html2.indexOf('已点亮 2/9') >= 0, 'B7 类标题的类账跟着走（人事 2/9）');

// ==================== E · 洞府成就（补缺口：营造一路此前零覆盖） ====================
console.log('\n[E] 洞府成就：从占山到仙府，一路有了自己的名分');
AS.npcManager = makeCrowd(0, 0);
AS.checkAchievementsNow();
eq(mgr.getAchievement('house_first').isCompleted, false, 'E1 无宅之人——安身立命不亮');
eq(mgr.getAchievement('house_palace').isCompleted, false, 'E2 琼楼玉宇更不亮');
AS.playerHouse = { type: 'ruin' };
AS.checkAchievementsNow();
eq(mgr.getAchievement('house_first').isCompleted, true, 'E3 破山洞也算安身——占山即点亮');
eq(mgr.getAchievement('house_palace').isCompleted, false, 'E4 破山洞离仙府还远（宅档 0/4）');
AS.CaveFacilities = { getFacilities: function () { return [{}, {}, {}, {}]; } };
AS.checkAchievementsNow();
eq(mgr.getAchievement('house_facilities').isCompleted, true, 'E5 四处设施安置齐——百工居肆点亮');
AS.playerHouse = { type: 'palace' };
AS.checkAchievementsNow();
eq(mgr.getAchievement('house_palace').isCompleted, true, 'E6 修缮到仙府——琼楼玉宇点亮');
AS.renderAchievementPanel();
var htmlE = elStore['achievement-list'].innerHTML;
assert(htmlE.indexOf('洞府') >= 0 && htmlE.indexOf('安身立命') >= 0 && htmlE.indexOf('琼楼玉宇') >= 0, 'E7 成就墙上有了「洞府」一类，三枚都在');
delete AS.playerHouse;
delete AS.CaveFacilities;

// ==================== D · 哨兵 ====================
console.log('\n[D] 哨兵');
var asSrc = src('js/achievement-system.js');
assert(asSrc.indexOf('一百零五波') >= 0, 'D1 改动挂着第一百零五波的号');
assert(asSrc.indexOf('faff >= 20') >= 0 && asSrc.indexOf('p.friends = _achNum(stats.npcs)') < 0, 'D2 交好账认好感≥20，旧的借图鉴口径已拆');
var pEmpty = (AS.currentCharData = {}, AS.npcManager = undefined, AS.buildAchievementProfile());
eq(typeof pEmpty.friends, 'number', 'D3 幽灵键防线不破：空世界 friends 仍是数（0）');
eq(pEmpty.friends, 0, 'D4 空世界交好 0 位');
var v11 = src('tests/v20.11-achievements-node.js');
assert(v11.indexOf('getAllNPCs') >= 0 && v11.indexOf('第一百零五波') >= 0, 'D5 v20.11 满配世界已改喂 npcManager 真源');
assert(src('tests/run-all.sh').indexOf('wave105-achv-node.js') >= 0, 'D6 本套已挂全量回归');

console.log('\n========== wave105 结果：' + passed + ' 通过 / ' + failed + ' 失败 ==========');
if (failed > 0) process.exit(1);
