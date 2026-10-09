/**
 * wave68-festival-fair-node.js — 第六十八波 · 庙会民俗节日 验收：
 *   A 历法账：四节按日对号、360 天一年翻得回、复用节日桥口径、WorldCalendar.day 优先
 *   B 入口账：非节日面板静默、逢节挂摊、进城招呼一声不重复、不在城里不招呼
 *   C 灯谜账：谜面按城+日定死（零骰）、猜中长学识养心境、猜差点谜底、一日一盏
 *   D 河灯小吃花灯：铜钱只出不进、原子结算（钱不够整笔不成交）、每日限次、四节各吃各的
 *   E 分节口吻：四节场景/小吃/河灯/花灯词各是各的、零拉丁
 *   F 哨兵：新文件零骰零存档零悟道点零发票子、面板钩子有守卫、挂载序在册
 *
 * 运行：node tests/wave68-festival-fair-node.js
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
var msgs = [], timeCalls = [], modals = [];
global.showMessage = function (m, t) { msgs.push({ m: String(m), t: t }); };
global.showModal = function (t, html) { modals.push({ t: String(t), html: String(html) }); };
var ABS_DAY = 1;
global.timeSystem = {
    gameTime: { totalMinutes: 600 },
    advanceTime: function (m, r) { timeCalls.push({ m: m, r: String(r || '') }); },
    getAbsoluteDay: function () { return ABS_DAY; },
    onNewDaySubscribe: function () {}
};
global.EventBus = { emit: function () {}, on: function () {} };
global.inventory = { currency: { spiritStones: 100, copper: 500 }, slots: [] };
global.itemById = {};
global.updateCurrencyUI = function () {};
global.updateCharacterStatus = function () {};
global.getCurrentCityName = function () { return global.currentCharData.location; };
var KNOWN_CITIES = { '帝都·长安': 1, '洛水城': 1 };
global.locationSystem = { getCityData: function (c) { return KNOWN_CITIES[c] ? { name: c } : null; } };
global.currentCharData = {
    mood: 80, energy: 60, maxEnergy: 100, karma: 0, copper: 500,
    lifeSkills: { '学识': 20 }, location: '帝都·长安'
};

function load(rel) {
    vm.runInThisContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), { filename: rel });
}
load('js/economy/economy-transaction.js');
load('js/core/reward-service.js');
load('js/city-facilities/festival-fair.js');

var FF = global.FestivalFair;

function msgCount(word) { return msgs.filter(function (m) { return m.m.indexOf(word) >= 0; }).length; }
function lastMsg() { return msgs.length ? msgs[msgs.length - 1].m : ''; }
function reset(day, city) {
    ABS_DAY = day;
    var c = global.currentCharData;
    c.mood = 80; c.energy = 60; c.karma = 0; c.copper = 500;
    c.lifeSkills = { '学识': 20 }; c.location = city || '帝都·长安';
    delete c._fairRiddleDay; delete c._fairLanternDay; delete c._fairFoodDay; delete c._fairWatchDay; delete c._fairInviteDay;
    global.inventory.currency = { spiritStones: 100, copper: 500 };
    msgs.length = 0; timeCalls.length = 0; modals.length = 0;
    delete global.WorldCalendar;
}

// ==================== A · 历法账 ====================
console.log('\n[A] 历法账（日历上的节，一天不差）');
reset(1);
eq(FF.todayFestival().name, '上元灯节', 'A1 岁首第一日是上元灯节');
reset(187);
eq(FF.todayFestival().name, '七夕', 'A2 七月七是七夕（187=6×30+7）');
reset(225);
eq(FF.todayFestival().name, '中秋', 'A3 八月十五是中秋（225=7×30+15）');
reset(360);
eq(FF.todayFestival().name, '除夕', 'A4 岁尾三百六十是除夕');
reset(361);
eq(FF.todayFestival().name, '上元灯节', 'A5 翻过一年又是上元（360 天一轮）');
reset(100);
eq(FF.todayFestival(), null, 'A6 平常日子没有节（不硬造庙会）');
eq(FF.isFestivalDay(), false, 'A7 平常日子如实报「不是节」');
// 复用节日桥口径
reset(1);
var defsBackup = global.FESTIVAL_DEFS;
global.FESTIVAL_DEFS = [{ key: 'shangyuan', name: '自定义节', doy: 50 }];
reset(50);
eq(FF.todayFestival().name, '自定义节', 'A8 优先读节日桥的现成口径（不另造一本历）');
global.FESTIVAL_DEFS = defsBackup;
// WorldCalendar.day 优先（六十七波修通的时钟）
reset(1);
global.WorldCalendar = { day: 225 };
eq(FF.todayFestival().name, '中秋', 'A9 历法真钟优先（WorldCalendar.day 说的是中秋就是中秋）');
// 回落表与节日桥同源
var fbSrc = fs.readFileSync(path.join(ROOT, 'js/core/festival-bridge.js'), 'utf8');
assert(fbSrc.indexOf('doy: 1') >= 0 && fbSrc.indexOf('doy: (7 - 1) * 30 + 7') >= 0 &&
    fbSrc.indexOf('doy: (8 - 1) * 30 + 15') >= 0 && fbSrc.indexOf('doy: 360') >= 0,
    'A10 回落表的四个日子与节日桥一字同源（1/187/225/360）');

// ==================== B · 入口账 ====================
console.log('\n[B] 入口账（非节日静默，逢节挂摊）');
reset(100);
// ★2026-10-04 由「整块面板一个字不占」改为「庙会那一块不占」（C 类·量错对象）★
// 原判据：`panelHtml('帝都·长安') === ''` —— 平常日子整块面板必须是空串。
// 现判据：平常日子**庙会那一块**一个字不占（不出现节名／不出现「去逛庙会」／不出现那个记账锚），
//   闲趣场那一块照旧在——它是常年挂着的一条入口，不是庙会摊。
// 为什么该改——先查清「为什么错」：festival-fair.js 的 panelHtml（:249）如今是**两段**：
//   :253-262 庙会摊（`todayFestival()` 有值且同城才画）；:263-267 闲趣场（`inCity()` 就画，常年）。
//   原判据量的是整块返回值，等于把「庙会非节日静默」和「面板必须整块为空」当成一件事。
//   实测：day=100（平常日）那一块里 `openFestivalFair()`／`庙会正开`／`festival-fair-used` 三样一个都没有，
//   回来的整串只有闲趣场那一枚入口——庙会那一条纪律**一字未破**。
// 收紧处：原来只判「整块空」，现在逐项判庙会那三样都不在（谁把庙会摊提前挂上照样红），
//   并另立一条把闲趣场那一枚钉住，免得日后有人为了哄这条断言把闲趣场也删了。
var 平日 = FF.panelHtml('帝都·长安');
eq([平日.indexOf('去逛庙会') >= 0, 平日.indexOf('openFestivalFair()') >= 0,
平日.indexOf('庙会正开') >= 0, 平日.indexOf('festival-fair-used') >= 0].join(','), 'false,false,false,false',
'B1 平常日子庙会那一块一个字不占（节名/入口/记账锚三样都不在——庙会摊没搭）');
assert(平日.indexOf('闲趣场') >= 0 && 平日.indexOf('FestivalFair.leisure()') >= 0,
'B1b 闲趣场那一枚照旧挂着（它是常年入口，不是庙会摊——原来那句「整块一个字不占」把这条一起判没了）');
reset(1);
var ph = FF.panelHtml('帝都·长安');
assert(ph.indexOf('上元灯节') >= 0 && ph.indexOf('去逛庙会') >= 0 && ph.indexOf('openFestivalFair()') >= 0, 'B2 逢节面板挂出庙会摊（节名+入口都在）');
assert(ph.indexOf('猜灯谜') >= 0 && ph.indexOf('放河灯') >= 0 && ph.indexOf('元宵') >= 0, 'B3 摊子上写明有什么（上元写的是元宵）');
eq(FF.panelHtml('洛水城'), '', 'B4 人在帝都，洛水的面板不挂帝都的庙会（各城各挂各的）');
// 招呼
reset(1);
FF.maybeInvite();
eq(msgCount('庙会'), 1, 'B5 逢节进城招呼一声（一年就这一日）');
FF.maybeInvite();
eq(msgCount('庙会'), 1, 'B6 同日不重复唠叨');
reset(1, '野外');
FF.maybeInvite();
eq(msgCount('庙会'), 0, 'B7 人不在城里不招呼（野外没有庙会）');
reset(100);
FF.maybeInvite();
eq(msgCount('庙会'), 0, 'B8 平常日子不招呼');
// 面板钩子在册
var locSrc = fs.readFileSync(path.join(ROOT, 'js/location-system.js'), 'utf8');
assert(locSrc.indexOf('window.FestivalFair.panelHtml(cityName)') >= 0 && locSrc.indexOf('catch (eFair)') >= 0, 'B9 城市面板钩子在案且有守卫（模块没加载就静默）');
// 打开
reset(100);
eq(FF.open(), false, 'B10 平常日子点开如实回绝（棚子还没搭）');
reset(1);
eq(FF.open(), true, 'B11 节日打开庙会');
var fairModal = modals[modals.length - 1];
assert(fairModal.t.indexOf('上元灯节') >= 0, 'B12 庙会弹窗报节名');
assert(fairModal.html.indexOf('猜灯谜') >= 0 && fairModal.html.indexOf('放河灯') >= 0 && fairModal.html.indexOf('看花灯') >= 0, 'B13 四个摊子都在单上');

// ==================== C · 灯谜账 ====================
console.log('\n[C] 灯谜账（谜面定死，零骰）');
reset(1);
var r1 = FF.todayRiddle();
var r1b = FF.todayRiddle();
eq(r1.q, r1b.q, 'C1 同日同城谜面一字不差（掌柜不换谜说谎）');
var seen = {};
[1, 2, 3, 7, 11, 13, 17, 19, 23, 29, 31, 37].forEach(function (d) { ABS_DAY = d; seen[FF.todayRiddle().q] = 1; });
assert(Object.keys(seen).length >= 3, 'C2 换日换谜（十二天里不止一盏灯）');
reset(1);
var r = FF.todayRiddle();
// 零骰
var rolled = 0, origRandom = Math.random;
Math.random = function () { rolled++; return 0.5; };
FF.act('riddle');
FF.answer(r.ans);
Math.random = origRandom;
eq(rolled, 0, 'C3 猜灯谜全程零骰（对错是定数，不是运气）');
var askModal = modals[0];
assert(askModal && askModal.t.indexOf('猜灯谜') >= 0 && askModal.html.indexOf(r.q) >= 0, 'C4 谜面上墙（走马灯下的纱灯）');
r.opts.forEach(function (o) { assert(askModal.html.indexOf(o) >= 0, 'C5 谜底三选都在（「' + o + '」）'); });
var resModal = modals[modals.length - 1];
assert(resModal.t.indexOf('中了') >= 0, 'C6 猜中如实报喜');
assert(resModal.html.indexOf(r.why) >= 0, 'C7 掌柜讲谜底（比猜中还长见识）');
eq(global.currentCharData.mood, 88, 'C8 猜中心境 +8');
eq(global.currentCharData.lifeSkills['学识'], 22, 'C9 猜中长学识 +2');
eq(timeCalls[timeCalls.length - 1].m, 15, 'C10 猜灯花一刻钟');
eq(global.currentCharData._fairRiddleDay, 1, 'C11 一日一盏记了旗（运行时旗）');
// 同日再猜
msgs.length = 0; modals.length = 0;
FF.act('riddle');
eq(msgCount('已经猜过'), 1, 'C12 同日再猜被拦（掌柜的谜库一年就这么几盏）');
eq(modals.length, 0, 'C13 被拦不弹窗不耗时间');
// 猜差（换个节：七夕）
reset(187);
var r2 = FF.todayRiddle();
FF.act('riddle');
FF.answer((r2.ans + 1) % 3);
var loseModal = modals[modals.length - 1];
assert(loseModal.t.indexOf('差一层') >= 0, 'C14 猜差如实报（不谎称中了）');
assert(loseModal.html.indexOf(r2.opts[r2.ans]) >= 0, 'C15 猜差点破谜底（听讲解也是长见识）');
eq(global.currentCharData.mood, 82, 'C16 猜差也有参与之乐（心境 +2）');
eq(global.currentCharData.lifeSkills['学识'], 20, 'C17 猜差不长学识（没解出来就是没解出来）');
eq(global.currentCharData._fairRiddleDay, 187, 'C18 猜差也占今日的灯（一日一盏，不分中没中）');

// ==================== D · 河灯小吃花灯 ====================
console.log('\n[D] 河灯小吃花灯（铜钱只出不进）');
reset(1);
FF.act('lantern');
eq(global.inventory.currency.copper, 495, 'D1 河灯 5 铜钱真扣（经济事务原子入账）');
eq(global.currentCharData.karma, 1, 'D2 放灯积一分因果');
eq(global.currentCharData.mood, 88, 'D3 寄了思念心境 +8');
assert(lastMsg().indexOf('走马灯') >= 0, 'D4 上元放的是走马灯（分节词接上）');
eq(timeCalls[timeCalls.length - 1].m, 20, 'D5 放灯花二十分钟');
msgs.length = 0;
FF.act('lantern');
eq(msgCount('已经放过'), 1, 'D6 一日一盏河灯（心意到了就好）');
// 钱不够
reset(1);
global.inventory.currency.copper = 3;
global.currentCharData.copper = 3;
FF.act('lantern');
eq(msgCount('没凑出来'), 1, 'D7 钱不够如实回绝（摊主也不催）');
eq(global.inventory.currency.copper, 3, 'D8 没成交钱分毫不动');
eq(global.currentCharData.mood, 80, 'D9 没成交心境分毫不动');
eq(global.currentCharData._fairLanternDay, undefined, 'D10 没成交不占今日的灯');
// 小吃
reset(1);
FF.act('food');
eq(global.inventory.currency.copper, 490, 'D11 小吃 10 铜钱真扣');
eq(global.currentCharData.energy, 90, 'D12 精力 60 → 90');
eq(global.currentCharData.mood, 86, 'D13 心境 +6');
assert(lastMsg().indexOf('元宵') >= 0, 'D14 上元吃元宵');
reset(225);
FF.act('food');
assert(lastMsg().indexOf('月饼') >= 0, 'D15 中秋吃月饼');
reset(360);
FF.act('food');
assert(lastMsg().indexOf('年糕') >= 0, 'D16 除夕吃年糕');
reset(187);
FF.act('food');
assert(lastMsg().indexOf('巧果') >= 0, 'D17 七夕吃巧果');
// 精力封顶
reset(1);
global.currentCharData.energy = 95;
FF.act('food');
eq(global.currentCharData.energy, 100, 'D18 精力封顶不超');
// 花灯
reset(1);
var copperBefore = global.inventory.currency.copper;
FF.act('watch');
eq(global.inventory.currency.copper, copperBefore, 'D19 看花灯不要钱（热闹是白凑的）');
eq(global.currentCharData.mood, 85, 'D20 看灯心境 +5');
assert(lastMsg().indexOf('鱼龙灯') >= 0, 'D21 上元的灯市有上元的景');
msgs.length = 0;
FF.act('watch');
eq(msgCount('看过了'), 1, 'D22 一日看一回（再看就该收摊喽）');
// 散场
reset(100);
msgs.length = 0;
FF.act('riddle');
eq(msgCount('棚子已经拆了'), 1, 'D23 节过完了摊子不赖着（如实散场）');

// ==================== E · 分节口吻 ====================
console.log('\n[E] 分节口吻（四节各是各的）');
var META = FF.FEST_META;
var latin = /[A-Za-z]/;
var bad = [];
['shangyuan', 'qixi', 'zhongqiu', 'chuxi'].forEach(function (k) {
    var m = META[k];
    if (!m) { bad.push(k + '(缺)'); return; }
    ['scene', 'food', 'foodDesc', 'watch', 'lantern'].forEach(function (f) {
        if (typeof m[f] !== 'string' || !m[f]) bad.push(k + '.' + f + '(缺)');
        else if (latin.test(m[f])) bad.push(k + '.' + f + '(混拉丁)');
    });
});
assert(bad.length === 0, 'E1 四节五样词齐且全中文（违例: ' + bad.slice(0, 3) + '）');
var foods = ['shangyuan', 'qixi', 'zhongqiu', 'chuxi'].map(function (k) { return META[k].food; });
eq(new Set(foods).size, 4, 'E2 四节的小吃各是各的（元宵/巧果/月饼/年糕）');
var watches = ['shangyuan', 'qixi', 'zhongqiu', 'chuxi'].map(function (k) { return META[k].watch; });
eq(new Set(watches).size, 4, 'E3 四节的灯景各是各的（不是一套话换皮）');
// 灯谜池
var RB = FF.RIDDLES;
eq(RB.length, 6, 'E4 灯谜六盏');
var rbad = [];
RB.forEach(function (r, i) {
    if (r.opts.length !== 3) rbad.push(i + '(三选不齐)');
    if (r.ans < 0 || r.ans > 2) rbad.push(i + '(答案越界)');
    [r.q, r.why].concat(r.opts).forEach(function (s) { if (latin.test(s)) rbad.push(i + '(混拉丁)'); });
});
assert(rbad.length === 0, 'E5 每盏灯谜三选一齐、答案在册、全中文（违例: ' + rbad.slice(0, 3) + '）');

// ==================== F · 哨兵 ====================
console.log('\n[F] 哨兵（新账干净）');
var src = fs.readFileSync(path.join(ROOT, 'js/city-facilities/festival-fair.js'), 'utf8');
// ★2026-10-04 由「全文件零 Math.random」改为「庙会那本账零 Math.random」（C 类·量错对象）★
// 原判据：整个 festival-fair.js 里 `Math.random` 出现 0 次。
// 现判据：庙会本体（`var LZ = {` 之前）零 `Math.random`；闲趣那族只许有一处，且那一处必须是
//   **播种桥**——`typeof window.__scenarioRng === 'function' ? window.__scenarioRng() : Math.random()`，
//   即优先吃引擎的播种骰，裸 Math.random 只是没有播种源时的兜底。
// 为什么该改——先查清「为什么错」：闲趣名册（风筝/蹴鞠/投壶/卖春联）是后来并进同一本账的，
//   它的 `dice()` 桥在 festival-fair.js:410，落在 `var LZ = {`（:404）之后。
//   那处 `Math.random` 不是「庙会开始掷骰了」，而是播种桥的兜底分支——全仓同款写法，恰恰是**不掷裸骰**的那一套。
//   原判据把两族当一族，于是「闲趣引进了播种桥」被判成「庙会破纪」。
// 收紧处：不是把计数放宽成「≤1」。庙会那族的 0 一字未松；闲趣那族逐行核「只有播种桥这一处」，
//   多一处、或那一处不先问 __scenarioRng，当场判红。
var 闲趣起 = src.indexOf('var LZ = {');
assert(闲趣起 > 0, '闲趣名册的起点找得到（`var LZ = {`）——这一刀切不动就说明源码搬家了，本条即刻判红');
var 庙会本体 = src.slice(0, 闲趣起);
var 闲趣本体 = src.slice(闲趣起);
eq((庙会本体.match(/Math\.random/g) || []).length, 0, 'F1 庙会全程零骰（节看历法、谜看播种、账是定数）');
eq((闲趣本体.match(/Math\.random/g) || []).length, 1, 'F1b 闲趣那族只有一处 Math.random');
assert(/function\s+dice\s*\(\)\s*\{\s*return\s*\(typeof window\.__scenarioRng === 'function'\)\s*\?\s*window\.__scenarioRng\(\)\s*:\s*Math\.random\(\);/.test(闲趣本体),
'F1c 那一处是**播种桥**（先问 window.__scenarioRng，裸 Math.random 只是没播种源时的兜底）'
+ '——全仓同款写法；不是「庙会开口掷骰」，也不是随手一个裸骰');
assert(src.indexOf('localStorage') < 0 && src.indexOf('saveWildState') < 0 && src.indexOf('wildState') < 0, 'F2 零直写存档（每日限次是运行时旗）');
assert(src.indexOf('insightPoints') < 0 && src.indexOf('markOnce') < 0, 'F3 悟道点零发放（总闸已满）');
assert(src.indexOf('addSpiritStones') < 0 && src.indexOf('.credit(') < 0 && src.indexOf('addCopper') < 0, 'F4 铜钱只出不进（庙会不发票子——灯谜中彩只发心境学识）');
var visLeak = null;
(src.match(/'[^']+'/g) || []).forEach(function (s) {
    var v = s.slice(1, -1);
    if (/[+);({\[,]/.test(v)) return;
    if (v.indexOf('\\') >= 0) return;
    if (/^[a-z0-9]+(?:[-_: ][a-z0-9]+)*$/.test(v)) return;
    if (latin.test(v)) visLeak = visLeak || s;
});
assert(visLeak === null, 'F5 庙会话术零拉丁（漏: ' + visLeak + '）');
var htmlSrc = fs.readFileSync(path.join(ROOT, '仙侠.html'), 'utf8');
assert(htmlSrc.indexOf('js/city-facilities/festival-fair.js') > htmlSrc.indexOf('js/city-facilities/teahouse-leisure.js'), 'F6 页面挂载在茶馆消遣之后（同批新账排一处）');
var fbSrc2 = fs.readFileSync(path.join(ROOT, 'js/core/festival-bridge.js'), 'utf8');
assert(fbSrc2.indexOf('global.FESTIVAL_DEFS') >= 0, 'F7 节日桥的口径导出一字未动（庙会是读者不是改者）');

console.log('\n========== 第六十八波 · 庙会民俗节日 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
