/**
 * wave67-mood-current-node.js — 第六十七波 · 心境通电 + 历法时钟根治 验收：
 *   A 梯度账：五档倍率与门槛一个不差、越界钳位、乱值兜底、结算单文案
 *   B 每日归位：向常人底色 50 回落（高处的开心会淡、低处的郁结自己解）、不越界、心灰意冷报信一次（防刷屏旗）
 *   C 修炼接线：打坐收益链挂了心境乘数（在丹毒之后、定境浮动之前）、弹窗把心境挂在脸上、切片骰数不涨
 *   D 历法时钟：WorldCalendar.day 有真钟报真天数、没钟照旧 undefined（老读者 ||0 兜底全有效）、不可枚举
 *   E 哨兵：心境账零骰零存档零悟道点、饥饿账与统一结算的老写法未动、话术零拉丁
 *
 * 运行：node tests/wave67-mood-current-node.js
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

// ==================== 世界桩 ====================
global.window = global;
var msgs = [];
global.showMessage = function (m, t) { msgs.push({ m: String(m), t: t }); };
var daySubs = [];
global.timeSystem = {
    gameTime: { totalMinutes: 800 * 1440 + 600 },
    advanceTime: function () {},
    onNewDaySubscribe: function (fn) { daySubs.push(fn); }
};
global.currentCharData = { mood: 80 };
global.console = global.console || console;

vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'js/core/mood-system.js'), 'utf8'), { filename: 'mood-system.js' });

var MS = global.MoodSystem;
var CFG = MS.CFG;

function setMood(m) { global.currentCharData.mood = m; delete global.currentCharData._moodLowNoticed; msgs.length = 0; }
function msgCount(word) {
    return msgs.filter(function (m) { return m.m.indexOf(word) >= 0; }).length;
}

// ==================== A · 梯度账 ====================
console.log('\n[A] 梯度账（五档倍率，门槛一个不差）');
eq(CFG.BASE, 50, 'A1 常人底色 50');
eq(CFG.DAILY_DRIFT, 2, 'A2 每日回落 2 点');
eq(CFG.TIERS.length, 5, 'A3 五档梯度');
setMood(95);
eq(MS.cultivationMul(), 1.10, 'A4 神思不倦（≥90）真元 ×1.10');
eq(MS.label(), '神思不倦', 'A5 档位名在册');
setMood(90);
eq(MS.cultivationMul(), 1.10, 'A6 90 是神思不倦的下沿（含）');
setMood(89);
eq(MS.cultivationMul(), 1.05, 'A7 89 落回心情舒畅');
setMood(70);
eq(MS.cultivationMul(), 1.05, 'A8 心情舒畅（≥70）×1.05');
setMood(69);
eq(MS.cultivationMul(), 1.00, 'A9 69 落到平平常常');
setMood(40);
eq(MS.cultivationMul(), 1.00, 'A10 平平常常（≥40）×1.00');
setMood(39);
eq(MS.cultivationMul(), 0.95, 'A11 心烦意乱（≥20）×0.95');
setMood(19);
eq(MS.cultivationMul(), 0.90, 'A12 心灰意冷（<20）×0.90');
setMood(0);
eq(MS.cultivationMul(), 0.90, 'A13 心境见底也是 ×0.90（不无限跌落）');
// 钳位与兜底
setMood(150);
eq(MS.moodNow(), 100, 'A14 越上界钳到 100');
setMood(-5);
eq(MS.moodNow(), 0, 'A15 越下界钳到 0');
global.currentCharData.mood = undefined;
eq(MS.moodNow(), 80, 'A16 没记心境的按开局基数 80');
global.currentCharData.mood = '心乱如麻';
eq(MS.moodNow(), CFG.BASE, 'A17 乱值兜底回常人底色（不炸不 NaN）');
// 结算单文案
setMood(50);
eq(MS.cultivationNote(), '', 'A18 平平常常不开口（不增不减不刷存在感）');
setMood(95);
var noteUp = MS.cultivationNote();
assert(noteUp.indexOf('神思不倦') >= 0 && noteUp.indexOf('+10%') >= 0, 'A19 高档文案报档位报折头');
setMood(10);
var noteDown = MS.cultivationNote();
assert(noteDown.indexOf('心灰意冷') >= 0 && noteDown.indexOf('-10%') >= 0, 'A20 低档文案如实报减');

// ==================== B · 每日归位 ====================
console.log('\n[B] 每日归位（心境是要养的）');
assert(daySubs.length === 1, 'B1 挂上了每日钩子（与饥饿账同款订阅）');
setMood(80);
MS.dailyTick();
eq(global.currentCharData.mood, 78, 'B2 高处的开心会淡（80 → 78）');
MS.dailyTick();
eq(global.currentCharData.mood, 76, 'B3 一日一落，落得住');
setMood(50);
MS.dailyTick();
eq(global.currentCharData.mood, 50, 'B4 底色上纹丝不动');
setMood(30);
MS.dailyTick();
eq(global.currentCharData.mood, 32, 'B5 低处的郁结也会慢慢自己解（30 → 32）');
setMood(52);
MS.dailyTick();
eq(global.currentCharData.mood, 50, 'B6 回落不越底色（52 → 50 刹住）');
setMood(48);
MS.dailyTick();
eq(global.currentCharData.mood, 50, 'B7 回暖也不越底色（48 → 50 刹住）');
setMood(100);
MS.dailyTick();
eq(global.currentCharData.mood, 98, 'B8 满心境一日回落 2');
setMood(1);
MS.dailyTick();
eq(global.currentCharData.mood, 3, 'B9 谷底一日回暖 2（跌不破 0）');
// 心灰意冷报信
setMood(15);
MS.dailyTick();
eq(global.currentCharData.mood, 17, 'B10 谷底回升照走');
eq(msgCount('心灰意冷'), 1, 'B11 心灰意冷报一次信（指路茶馆瓦舍）');
assert(global.currentCharData._moodLowNoticed === true, 'B12 报信旗落下（运行时旗，零存档）');
MS.dailyTick();
eq(msgCount('心灰意冷'), 1, 'B13 次日不重复唠叨（防刷屏）');
global.currentCharData.mood = 41;
MS.dailyTick();
assert(global.currentCharData._moodLowNoticed === false, 'B14 回暖过 40 销旗（迟滞——不在门槛上横跳）');
global.currentCharData.mood = 15;
global.currentCharData._moodLowNoticed = false;
msgs.length = 0;
MS.dailyTick();
eq(msgCount('心灰意冷'), 1, 'B15 再跌回去还会再报（旗销了就能再报）');

// ==================== C · 修炼接线 ====================
console.log('\n[C] 修炼接线（打坐收成折进心境）');
var appSrc = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
var cmStart = appSrc.indexOf('function cultivationMeditate');
var cmSeg = appSrc.slice(cmStart, appSrc.indexOf('\nfunction ', cmStart + 10));
assert(cmSeg.indexOf('window.MoodSystem.cultivationMul()') >= 0, 'C1 打坐收益链挂了心境乘数');
assert(cmSeg.indexOf('essenceGain = Math.floor(essenceGain * _moodMul);') >= 0, 'C2 乘数真作用于真元（不是算了不用——v20.48 假效果的老教训）');
assert(cmSeg.indexOf('MoodSystem.cultivationNote()') >= 0 && cmSeg.indexOf('mutationText += _moodNote') >= 0, 'C3 结算单报心境账（档位与折头上脸）');
var ppIdx = cmSeg.indexOf('_ppPen');
var moodIdx = cmSeg.indexOf('MoodSystem');
var medRollIdx = cmSeg.indexOf('_medRoll');
assert(ppIdx >= 0 && ppIdx < moodIdx && moodIdx < medRollIdx, 'C4 心境乘在丹毒之后、定境浮动之前（乘法链次序有据）');
eq((cmSeg.match(/Math\.random/g) || []).length, 3, 'C5 打坐切片仍三枚骰（定境浮动/奇遇两枚老骰——心境账零骰不添）');
assert(cmSeg.indexOf('_moodMul !== 1') >= 0, 'C6 平平常常不进乘法链（×1.00 不折腾账）');
// 洞府弹窗的心境行
var scStart = appSrc.indexOf('function startCultivation');
var scSeg = appSrc.slice(scStart, appSrc.indexOf('\nfunction ', scStart + 10));
assert(scSeg.indexOf('当前心境：') >= 0 && scSeg.indexOf('window.MoodSystem.label()') >= 0, 'C7 打坐前弹窗把心境与折头挂在脸上');
assert(scSeg.indexOf('MoodSystem.moodNow()') >= 0, 'C8 弹窗报当下分数（玩家自己算得清这笔账）');

// ==================== D · 历法时钟 ====================
console.log('\n[D] 历法时钟（「今天」不再是恒零）');
function loadCalendar(world) {
    world.window = world;
    vm.createContext(world);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/core/world-calendar.js'), 'utf8'), world, { filename: 'world-calendar.js' });
    return world.WorldCalendar;
}
var baseWorld = {
    console: { log: function () {}, warn: function () {}, error: function () {} },
    setTimeout: function (fn) { try { fn(); } catch (e) {} return 0; },
    localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
    JSON: JSON, Math: Math, Object: Object, Array: Array, Number: Number, String: String, isFinite: isFinite, Date: Date
};
// 有真钟：报真天数
var w1 = Object.assign({}, baseWorld);
w1.timeSystem = { getAbsoluteDay: function () { return 800; } };
var cal1 = loadCalendar(w1);
eq(cal1.day, 800, 'D1 有真钟报真天数（行情过期/图鉴日戳从此有日子可算）');
w1.timeSystem.getAbsoluteDay = function () { return 801; };
eq(cal1.day, 801, 'D2 现算不缓存（钟走一天，day 跟一天）');
// 全局钟优先
var w2 = Object.assign({}, baseWorld);
w2.getAbsoluteDay = function () { return 900; };
w2.timeSystem = { getAbsoluteDay: function () { return 800; } };
eq(loadCalendar(w2).day, 900, 'D3 全局真钟优先（与洞府设施 _today 同口径）');
// 没钟：照旧 undefined，老读者兜底不破
var w3 = Object.assign({}, baseWorld);
var cal3 = loadCalendar(w3);
eq(cal3.day, undefined, 'D4 没钟的世界 day 照旧 undefined（不硬造日子）');
eq((cal3.day || 0), 0, 'D5 老读者的 ||0 兜底原样有效');
assert(!cal3.day, 'D6 if(day) 守卫的读者走原退路（不误伤无钟测试世界）');
// 不可枚举：序列化与遍历不受扰
eq(Object.keys(cal1).indexOf('day'), -1, 'D7 day 不可枚举（导出面还是原来那份）');
eq(JSON.stringify(cal1).indexOf('day'), -1, 'D8 序列化不带 day（getter 不进 JSON）');
assert(typeof cal1.register === 'function' && typeof cal1.consumeDue === 'function', 'D9 老门面完整（register/consumeDue 都在）');
// 读者侧一字未动（修的是源头，不是读者）
var mdSrc = fs.readFileSync(path.join(ROOT, 'js/extensions/market-dynamic.js'), 'utf8');
eq((mdSrc.match(/WorldCalendar\.day/g) || []).length, 2, 'D10 行情两处读法原样（源头通电，读者不动）');

// ==================== E · 哨兵 ====================
console.log('\n[E] 哨兵（新账干净，老账未动）');
var msSrc = fs.readFileSync(path.join(ROOT, 'js/core/mood-system.js'), 'utf8');
eq((msSrc.match(/Math\.random/g) || []).length, 0, 'E1 心境账零骰（梯度与回落全是定数）');
assert(msSrc.indexOf('localStorage') < 0 && msSrc.indexOf('StateRegistry') < 0, 'E2 零直写存档（心境本就在角色账上，报信旗是运行时的）');
assert(msSrc.indexOf('insightPoints') < 0 && msSrc.indexOf('markOnce') < 0, 'E3 悟道点零发放（总闸已满）');
assert(msSrc.indexOf('addSpiritStones') < 0 && msSrc.indexOf('.credit(') < 0 && msSrc.indexOf('deductCopper') < 0, 'E4 心境账零票子（只读心境，不碰钱袋）');
// 话术零拉丁（代码记号走过滤）
var latin = /[A-Za-z]/;
var visLeak = null;
(msSrc.match(/'[^']+'/g) || []).forEach(function (s) {
    var v = s.slice(1, -1);
    if (/[+);({\[,]/.test(v)) return;
    if (/^[a-z0-9]+(?:[-_: ][a-z0-9]+)*$/.test(v)) return;
    if (latin.test(v)) visLeak = visLeak || s;
});
assert(visLeak === null, 'E5 心境账话术零拉丁（漏: ' + visLeak + '）');
// 老账未动
var satSrc = fs.readFileSync(path.join(ROOT, 'js/core/satiety.js'), 'utf8');
assert(satSrc.indexOf('c.mood = Math.max(0, (c.mood || 50) - 5);') >= 0, 'E6 饥饿掉心境的老账一字未动（写入方各归各）');
var rsSrc = fs.readFileSync(path.join(ROOT, 'js/core/reward-service.js'), 'utf8');
assert(rsSrc.indexOf('mood: signedInt(spec.mood)') >= 0, 'E7 统一结算的心境键原样（六十五波的老账）');
var wcSrc = fs.readFileSync(path.join(ROOT, 'js/core/world-calendar.js'), 'utf8');
assert(wcSrc.indexOf("Object.defineProperty(api, 'day'") >= 0 && wcSrc.indexOf('enumerable: false') >= 0, 'E8 历法 day 走不可枚举 getter（导出面不涨）');
var htmlSrc = fs.readFileSync(path.join(ROOT, '仙侠.html'), 'utf8');
assert(htmlSrc.indexOf('js/core/mood-system.js') > htmlSrc.indexOf('js/core/satiety.js'), 'E9 页面挂载在饥饿账之后（同款日钩路数）');
var tlSrc = fs.readFileSync(path.join(ROOT, 'js/city-facilities/teahouse-leisure.js'), 'utf8');
assert(tlSrc.indexOf('function addMood(') >= 0, 'E10 茶馆消遣的发心境账原样（读者来了，写者没动）');

console.log('\n========== 第六十七波 · 心境通电 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
