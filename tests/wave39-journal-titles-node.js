/**
 * wave39-journal-titles-node.js — 第三十九波 · 见闻成就与称号 验收：
 *   A 档案快照：游历三字段真读 _travel 派生账、TravelJournal 缺席保守 0
 *   B 成就点亮：五枚游历成就按账点亮、奖励走真通道入账、不重复发、走一步当场点亮
 *   C 称号阶梯：纯派生不落档、优先级排序、侧栏行真带称号
 *   D 哨兵：钩子在册、防幽灵键全表校验、新话术零拉丁
 *
 * 运行：node tests/wave39-journal-titles-node.js
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
function load(rel) {
    vm.runInThisContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), { filename: rel });
}

// ==================== 共享全局桩 ====================
global.window = global;
var msgs = [];
global.showMessage = function (m, t) { msgs.push({ m: String(m), t: t }); };
var logs = [];
global.gameLog = { entries: logs, add: function (m, t) { logs.push({ m: String(m), t: t }); } };
var els = {};
function fakeEl() {
    return { innerHTML: '', textContent: '', style: {}, classList: { add: function () {}, remove: function () {} } };
}
global.document = {
    readyState: 'complete',
    getElementById: function (id) { if (!els[id]) els[id] = fakeEl(); return els[id]; },
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
    createElement: function () { return fakeEl(); },
    body: { appendChild: function () {} }
};
global.localStorage = { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} };
global.timeSystem = {
    advanceTime: function () {},
    getAbsoluteDay: function () { return 10; },
    onNewDaySubscribe: function () {}
};
global.getAbsoluteDay = function () { return 10; };
global.updateInsightUI = function () {};
global.updateCharacterStatus = function () {};
// 钱包真账（applyReward 走 XianXia.DataManager 通道）
var wallet = { stones: 1000, copper: 0 };
global.XianXia = {
    DataManager: {
        getSpiritStones: function () { return wallet.stones; },
        setSpiritStones: function (n) { wallet.stones = n; },
        getCopper: function () { return wallet.copper; },
        setCopper: function (n) { wallet.copper = n; }
    }
};
// 名气/业障走 RewardService 真账
var rewardCalls = [];
global.RewardService = { apply: function (r, o) { rewardCalls.push({ r: r, source: o && o.source }); return true; } };
global.currentCharData = { name: '测试散修', realm: '筑基' };
global.discipleState = {};
global.learnedSecrets = [];

load('js/map/travel-journal.js');
load('js/achievement-system.js');

var TJ = global.TravelJournal;
var AS = global;

function setTravel(regions, landmarks, steps) {
    var rg = {}, mk = {};
    for (var i = 0; i < regions; i++) rg[TJ.REGIONS[i]] = 100 + i;
    for (var j = 0; j < landmarks; j++) mk['lm_test_' + j] = 1;
    global.currentCharData._travel = { regions: rg, marks: mk, steps: steps };
}
function ach(id) { return global.achievementManager.getAchievement(id); }

// ==================== A · 档案快照 ====================
console.log('\n[A] 档案快照（游历三字段只读派生、缺席保守 0）');
{
    delete global.currentCharData._travel;
    var p0 = global.buildAchievementProfile();
    eq(p0.travelRegions, 0, 'A1 空账：走过域数保守 0');
    eq(p0.travelLandmarks, 0, 'A2 空账：地标数保守 0');
    eq(p0.travelSteps, 0, 'A3 空账：步数保守 0');

    // TravelJournal 缺席也不炸（成就系统单独在场的老环境）
    var savedTJ = global.TravelJournal;
    global.TravelJournal = undefined;
    var pNone = null, threw = false;
    try { pNone = global.buildAchievementProfile(); } catch (e) { threw = true; }
    assert(!threw, 'A4 游历账模块缺席：拼档案不炸');
    eq(pNone && pNone.travelSteps, 0, 'A5 缺席时三字段照样是数值 0（不产幽灵键）');
    global.TravelJournal = savedTJ;

    setTravel(5, 6, 340);
    var p1 = global.buildAchievementProfile();
    eq(p1.travelRegions, 5, 'A6 五域在账：快照读得 5');
    eq(p1.travelLandmarks, 6, 'A7 六处地标在账：快照读得 6');
    eq(p1.travelSteps, 340, 'A8 三百四十步在账：快照读得 340');
    var s = TJ.summary();
    eq(p1.travelRegions, s.regions, 'A9 快照与侧栏小账同源（一笔账两个出口不打架）');
}

// ==================== B · 成就点亮 ====================
console.log('\n[B] 成就点亮（按账亮、真发奖、不重复）');
{
    global.initAchievementSystem();
    setTravel(5, 6, 340);
    var w0 = wallet.stones, t0 = global.currentCharData.tempering || 0, r0 = rewardCalls.length;
    global.checkAchievementsNow();
    assert(ach('travel_100').isCompleted, 'B1 百里脚程：「初出茅庐」点亮');
    assert(ach('travel_landmarks').isCompleted, 'B2 六处地标：「百闻不如一见」点亮');
    assert(ach('travel_regions5').isCompleted, 'B3 五域足迹：「行走山河」点亮');
    assert(!ach('travel_regions9').isCompleted, 'B4 五域不到九域：「踏遍九州」不亮（门槛是真的）');
    assert(!ach('travel_8000').isCompleted, 'B5 三百四十步不到八千里：「万里独行」不亮');
    eq(wallet.stones - w0, 250, 'B6 灵石奖励真进钱包（50+80+120=250，走统一货币入口）');
    eq((global.currentCharData.tempering || 0) - t0, 30, 'B7 历练奖励真落角色账（初出茅庐 30）');
    var fameSum = rewardCalls.slice(r0).reduce(function (a, c) { return a + (c.r.fame || 0); }, 0);
    eq(fameSum, 13, 'B8 名气奖励走 RewardService 真账（5+8=13）');
    assert(rewardCalls.slice(r0).every(function (c) { return c.source === 'achievement'; }), 'B9 奖励来路记着「成就」（有名义）');

    // 不重复发
    var w1 = wallet.stones, r1 = rewardCalls.length;
    global.checkAchievementsNow();
    global.checkAchievementsNow();
    eq(wallet.stones, w1, 'B10 再查两轮：分文不重发（一生一次）');
    eq(rewardCalls.length, r1, 'B11 名气账也不重记');

    // 走一步当场点亮（钩子真接上：99 步 → 第 100 步）
    // 只把「初出茅庐」一枚压回未亮态重走（预设成就是共享实例，整表重置会连坐别枚的账）
    setTravel(0, 0, 99);
    var a100 = ach('travel_100');
    a100.isCompleted = false; a100.isUnlocked = false; a100.progress = 0;
    var realCheck = global.checkAchievementsNow;
    var checkCalls = 0;
    global.checkAchievementsNow = function () { checkCalls++; return realCheck(); };
    msgs.length = 0;
    TJ.noteStep();
    eq(TJ.summary().steps, 100, 'B12 第九十九步之后再走一步：账上满百');
    assert(checkCalls > 0, 'B13 记账当场递了成就墙（不用等次日结算）');
    assert(ach('travel_100').isCompleted, 'B14 满百步当场点亮「初出茅庐」');
    assert(msgs.some(function (m) { return m.m.indexOf('成就解锁') >= 0; }), 'B15 点亮有一条合并话术（不弹风暴）');
    global.checkAchievementsNow = realCheck;

    // 顶格两枚
    setTravel(9, 12, 8000);
    var w2 = wallet.stones;
    global.checkAchievementsNow();
    assert(ach('travel_regions9').isCompleted, 'B16 九域踏遍：「踏遍九州」点亮');
    assert(ach('travel_8000').isCompleted, 'B17 八千里路：「万里独行」点亮');
    eq(wallet.stones - w2, 400, 'B18 顶格两枚灵石入账（200+200）');
    assert(ach('travel_100').isCompleted && ach('travel_landmarks').isCompleted && ach('travel_regions5').isCompleted, 'B19 五枚全亮（一轮大游历走完该有的名分都在）');
}

// ==================== C · 称号阶梯 ====================
console.log('\n[C] 称号阶梯（纯派生、先比大再比小）');
{
    delete global.currentCharData._travel;
    eq(TJ.travelTitle(), '', 'C1 没出过门：无名号（不硬塞）');
    setTravel(0, 0, 99);
    eq(TJ.travelTitle(), '', 'C2 九十九步：还差一步，不预支名分');
    setTravel(0, 0, 100);
    eq(TJ.travelTitle(), '初出茅庐', 'C3 满百步：初出茅庐');
    setTravel(5, 0, 100);
    eq(TJ.travelTitle(), '行走山河', 'C4 五域压过百步（先比大）');
    setTravel(5, 6, 100);
    eq(TJ.travelTitle(), '见多识广', 'C5 六地标压过五域');
    setTravel(5, 6, 8000);
    eq(TJ.travelTitle(), '万里独行', 'C6 八千里压过地标');
    setTravel(9, 12, 8000);
    eq(TJ.travelTitle(), '踏遍九州', 'C7 九域封顶（阶梯最高档）');

    // 称号纯派生：删账即失，不落任何存档字段
    var rawBefore = JSON.stringify(global.currentCharData._travel);
    TJ.travelTitle();
    eq(JSON.stringify(global.currentCharData._travel), rawBefore, 'C8 算称号不动账本（只读派生零迁移）');

    // 侧栏行真带称号
    TJ.render();
    var line = els['wild-travel-journal'].innerHTML;
    assert(line.indexOf('踏遍九州') >= 0, 'C9 侧栏游历见闻行带上了称号');
    assert(line.indexOf('域 9/9') >= 0 && line.indexOf('步 8000') >= 0, 'C10 原有三本小账照旧显示');
    setTravel(0, 0, 0);
    TJ.render();
    assert(els['wild-travel-journal'].innerHTML.indexOf('text-amber-300') < 0, 'C11 无名号时侧栏不挂空牌子');
}

// ==================== D · 哨兵 ====================
console.log('\n[D] 哨兵（钩子在册、防幽灵键、零拉丁）');
{
    var tjs = fs.readFileSync(path.join(ROOT, 'js/map/travel-journal.js'), 'utf8');
    eq((tjs.match(/checkAchievementsNow/g) || []).length >= 2, true, 'D1 记账两处都接了成就墙钩子（发点处 + 步数处）');
    assert(tjs.indexOf('travelTitle: travelTitle') > 0 && tjs.indexOf('TITLE_LADDER: TITLE_LADDER') > 0, 'D2 称号出口对外可查');
    var asrc = fs.readFileSync(path.join(ROOT, 'js/achievement-system.js'), 'utf8');
    ['travel_100', 'travel_landmarks', 'travel_regions5', 'travel_regions9', 'travel_8000'].forEach(function (id) {
        assert(asrc.indexOf("'" + id + "'") > 0, 'D3·' + id + ' 在册');
    });
    assert(asrc.indexOf('p.travelRegions = _achNum(ts.regions)') > 0, 'D4 快照字段真读游历账');

    // 防幽灵键全表校验（与 v20.11 同法）：每条条件路径在快照上有定义且为数值
    var profile = global.buildAchievementProfile();
    var ghost = null;
    global.PresetAchievements.forEach(function (a) {
        Object.keys(a.requirements || {}).forEach(function (k) {
            var v = a.getNestedValue(profile, k);
            if (typeof v !== 'number') ghost = a.id + ' → ' + k;
        });
    });
    assert(ghost === null, 'D5 全部成就条件路径在档案快照上有定义（幽灵: ' + ghost + '）');

    // 新话术零拉丁
    var latin = /[A-Za-z]/;
    var names = global.PresetAchievements.filter(function (a) { return a.id.indexOf('travel_') === 0; });
    assert(names.length === 5, 'D6 游历成就恰五枚');
    assert(names.every(function (a) { return !latin.test(a.name) && !latin.test(a.description); }), 'D7 成就名目与说明零拉丁');
    assert(TJ.TITLE_LADDER.every(function (x) { return !latin.test(x.t); }), 'D8 称号文案零拉丁');

    // 称号不带属性：整个模块没有往角色数据上写战力字段
    assert(tjs.indexOf('attack') < 0 && tjs.indexOf('defense') < 0 && tjs.indexOf('bonus') < 0, 'D9 称号只是名分（模块内零属性词）');
    // 零随机：模块内不许出现 Math.random（零漂移铁律）
    assert(tjs.indexOf('Math.random') < 0, 'D10 游历账模块零随机数');
}

console.log('\n========== 第三十九波 · 见闻成就与称号 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
