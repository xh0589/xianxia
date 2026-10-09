/**
 * wave72-city-jobs-node.js — 第七十二波 · 城里长期营生 验收：
 *   A 应募账：差事跟着建筑走、门槛拦人、应募免费、一人一口活、无真钟不上工册
 *   B 上工账：工钱铜钱真入（双账）、精力时辰真花、一日一工、人在外头拒上工、四岗各有各的长进
 *   C 涨工账：做满十个工涨一成、封顶三成、辞工重应归零
 *   D 旷工辞人账：七日不裁八日裁、上工刷新旷工账、无真钟不裁人、辞工自愿
 *   E 归一化：_employ 单字段、坏账当没应过募、只认不补写、老档零成本
 *   F 面板接线：钩子在册有守卫、招工口只挂有岗的城、弹窗列岗
 *   G 哨兵：零骰零直写存档零悟道点、工钱只走统一结算、话术零拉丁、挂载序在册
 *
 * 运行：node tests/wave72-city-jobs-node.js
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
var msgs = [], logs = [], timeCalls = [], modals = [], repCalls = [], newDayCbs = [], specs = [];
global.showMessage = function (m, t) { msgs.push({ m: String(m), t: t }); };
global.showModal = function (t, html) { modals.push({ t: String(t), html: String(html) }); };
global.gameLog = { add: function (m) { logs.push(String(m)); } };
var ABS_DAY = 800;
global.timeSystem = {
    gameTime: { totalMinutes: 600 },
    advanceTime: function (m, r) { timeCalls.push({ m: m, r: String(r || '') }); },
    getAbsoluteDay: function () { return ABS_DAY; },
    onNewDaySubscribe: function (fn) { newDayCbs.push(fn); }
};
global.EventBus = { emit: function () {}, on: function () {} };
global.addReputation = function (c, n) { repCalls.push({ c: c, n: n }); };
var CITY_DB = {
    '洛水城': { name: '洛水城', buildings: ['shop', 'inn', 'library', 'medical_clinic', 'fire_department'] },
    '炎城': { name: '炎城', buildings: ['market', 'inn'] },
    '太虚山': { name: '太虚山', buildings: ['cultivation', 'temple'] }
};
global.locationSystem = { getCityData: function (c) { return CITY_DB[c] || null; } };
global.updateCurrencyUI = function () {};
global.updateCharacterStatus = function () {};
global.getCurrentCityName = function () { return global.currentCharData.location; };

global.currentCharData = {
    mood: 80, energy: 100, maxEnergy: 100, karma: 0, copper: 500,
    lifeSkills: { '学识': 10, '医术': 10, '口才': 10 }, location: '洛水城'
};
global.inventory = { currency: { spiritStones: 1000, copper: 500 }, slots: [] };

function load(rel) {
    vm.runInThisContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), { filename: rel });
}
load('js/economy/economy-transaction.js');
load('js/core/reward-service.js');
load('js/city-facilities/city-jobs.js');

var CJ = global.CityJobs;

function msgCount(w) { return msgs.filter(function (m) { return m.m.indexOf(w) >= 0; }).length; }
function logCount(w) { return logs.filter(function (m) { return m.indexOf(w) >= 0; }).length; }
function reset(city, opts) {
    opts = opts || {};
    ABS_DAY = opts.day == null ? 800 : opts.day;
    var c = global.currentCharData;
    c.mood = opts.mood == null ? 80 : opts.mood;
    c.energy = opts.energy == null ? 100 : opts.energy;
    c.copper = opts.copper == null ? 500 : opts.copper;
    c.lifeSkills = { '学识': opts.xueshi == null ? 10 : opts.xueshi, '医术': opts.yishu == null ? 10 : opts.yishu, '口才': 10 };
    c.location = city || '洛水城';
    delete c._employ;
    global.inventory.currency = { spiritStones: 1000, copper: opts.copper == null ? 500 : opts.copper };
    msgs.length = 0; logs.length = 0; timeCalls.length = 0; modals.length = 0; repCalls.length = 0; specs.length = 0;
}
function copper() { return global.inventory.currency.copper; }
function emp() { return global.currentCharData._employ || null; }

// ==================== A · 应募账 ====================
console.log('\n[A] 应募账（差事跟着铺面走）');
reset('洛水城');
eq(CJ.apply('shop_assistant'), true, 'A1 应募铺子伙计成功');
var l = emp();
assert(l && l.job === 'shop_assistant' && l.city === '洛水城' && l.signedDay === 800 && l.lastWorkDay === 799 && l.shifts === 0, 'A2 工账字段齐（岗/城/上工册日——应募当日算没上过工，当天就能开工）');
eq(copper(), 500, 'A3 应募不要钱（东家不收份子）');
eq(global.inventory.currency.spiritStones, 1000, 'A4 灵石也分毫不动');
assert(logCount('25 铜') >= 1, 'A5 上工册回执报工钱');
reset('炎城');
// ★2026-10-04 由「炎城零岗」改为「炎城的岗＝名册里挂在炎城实有建筑上的那些」（B 类·判据过时）★
// 原判据：`jobsHere('炎城').length === 0` —— 拿炎城当「一岗没有」的反证城。
// 现判据：反证城换成**真的一岗没有**的太虚山（它的建筑是 cultivation / temple，一个都不在岗表里）；
//   炎城则按规则本身判——它的建筑是 market / inn，名册里挂在这两样上的岗一个都不能少、一个都不许多。
// 为什么该改——先查清「为什么变」：差事名册从四行扩到十三行（「岗跟着城里实有的建筑走，一个键不添」），
//   新行里有 `guide 向导带路`（building: `inn`，日薪 35）。本测试自己的 CITY_DB 里炎城正是
//   `['market', 'inn']`——炎城有客栈，于是它现在**理应**有一岗。原判据量的是一个已经不存在的事实。
// 纪律本身没破：`jobsHere`（city-jobs.js:193）仍然是「JOBS 里 building 落在本城建筑表内的那些」，
//   一行都没改。所以这里改成按规则判，并**另立一条真反证**（太虚山零岗），覆盖面比原来只多不少。
var 炎城岗 = CJ.jobsHere('炎城').map(function (j) { return j.key; });
eq(炎城岗.join(','), 'guide', 'A6 炎城（market+inn）只有「向导带路」这一岗——名册挂 inn 的行都到齐、没有多出没有的');
reset('太虚山');
eq(CJ.jobsHere('太虚山').length, 0, 'A6b 真反证：太虚山（cultivation+temple，一个都不在岗表里）真的零岗——'
    + '「岗跟着建筑走」这条纪律仍在，不是名册一扩就没处钉了');
eq(CJ.apply('shop_assistant'), false, 'A7 没岗的城应募被拒');
assert(msgCount('差事跟着铺面走') >= 1, 'A8 拒得有话');
reset('太虚山');
eq(CJ.jobsHere('太虚山').length, 0, 'A9 仙山没有雇长活的人家');
reset('洛水城');
eq(CJ.apply('tutor'), false, 'A10 学识不够——蒙馆不收（门槛是真的）');
assert(msgCount('学识 30') >= 1, 'A11 拒语报出门槛与现状');
reset('洛水城', { xueshi: 35 });
eq(CJ.apply('tutor'), true, 'A12 学识够了蒙馆收人');
reset('洛水城', { yishu: 10 });
eq(CJ.apply('clinic_helper'), false, 'A13 医术不够——医馆不收');
reset('洛水城');
CJ.apply('shop_assistant');
eq(CJ.apply('night_watch'), false, 'A14 一人一口活（再应被拦）');
assert(msgCount('先辞工') >= 1, 'A15 拦得有话');
eq(CJ.apply('账房先生'), false, 'A16 岗册外的差事不存在');
reset('洛水城', { day: 0 });
eq(CJ.apply('shop_assistant'), false, 'A17 没有真钟不上工册（日子无从记起）');

// ==================== B · 上工账 ====================
console.log('\n[B] 上工账（钱、力、时辰是一件事）');
reset('洛水城');
CJ.apply('shop_assistant');
eq(CJ.work(), true, 'B1 上工');
eq(copper(), 525, 'B2 工钱二十五铜真入（钱袋子）');
eq(global.currentCharData.copper, 525, 'B3 铜钱两本账一致');
eq(global.currentCharData.energy, 80, 'B4 精力真耗二十');
eq(timeCalls[timeCalls.length - 1].m, 240, 'B5 一工四个时辰真花');
eq(emp().shifts, 1, 'B6 工数记一');
eq(emp().lastWorkDay, 800, 'B7 工册记日戳');
eq(CJ.work(), false, 'B8 一日一工——再上被拦');
assert(msgCount('上过了') >= 1, 'B9 拦得有人话');
eq(copper(), 525, 'B10 被拦不再给钱');
ABS_DAY = 801;
eq(CJ.work(), true, 'B11 隔日再上工');
eq(copper(), 550, 'B12 又一笔二十五铜');
reset('洛水城');
CJ.apply('shop_assistant');
global.currentCharData.location = '炎城';
eq(CJ.work(), false, 'B13 人在外头——这儿没你的岗');
reset('洛水城', { energy: 10 });
CJ.apply('shop_assistant');
eq(CJ.work(), false, 'B14 精力不够上不了工');
eq(copper(), 500, 'B15 没上成分文不入');
eq(emp().shifts, 0, 'B16 没上成工数不动');
reset('洛水城');
CJ.apply('shop_assistant');
ABS_DAY = 0;
eq(CJ.work(), false, 'B17 没有真钟铺面不开工');
// 四岗各有各的长进
reset('洛水城', { xueshi: 35 });
CJ.apply('tutor');
CJ.work();
eq(copper(), 540, 'B18 蒙馆工钱四十铜');
eq(global.currentCharData.mood, 82, 'B19 教书心里干净——心境+2');
eq(global.currentCharData.lifeSkills['学识'], 35, 'B20 教书教的是存货——学识原地（不白长）');
reset('洛水城', { yishu: 35 });
CJ.apply('clinic_helper');
CJ.work();
eq(copper(), 545, 'B21 医馆工钱四十五铜');
eq(global.currentCharData.lifeSkills['医术'], 36, 'B22 手上见真章——医术+1');
reset('洛水城');
CJ.apply('night_watch');
repCalls.length = 0;
CJ.work();
assert(repCalls.length === 1 && repCalls[0].n === 2 && repCalls[0].c === '洛水城', 'B23 巡夜街坊感激——本城声望+2（真走声望账）');
reset('洛水城');
CJ.apply('shop_assistant');
CJ.work();
eq(global.currentCharData.lifeSkills['口才'], 11, 'B24 伙计练嘴皮子——口才+1');
// 上工走统一结算（钱、力、声望一张单）
reset('洛水城');
CJ.apply('shop_assistant');
var realApply = global.RewardService.apply;
global.RewardService.apply = function (spec, ctx) { specs.push(spec); return realApply.call(global.RewardService, spec, ctx); };
CJ.work();
global.RewardService.apply = realApply;
assert(specs.length === 1 && specs[0].copper === 25 && specs[0].energy === -20 && specs[0].cityReputation === 1, 'B25 钱、力、声望同笔结算（一张单走统一通道）');

// ==================== C · 涨工账 ====================
console.log('\n[C] 涨工账（做久了东家涨工钱）');
reset('洛水城');
CJ.apply('shop_assistant');
eq(CJ.wageOf('shop_assistant'), 25, 'C1 新工钱是底价');
for (var d = 801; d <= 810; d++) { ABS_DAY = d; global.currentCharData.energy = 100; CJ.work(); }
eq(emp().shifts, 10, 'C2 十日十工');
eq(CJ.wageOf('shop_assistant'), 27, 'C3 做满十个工涨一成（二十五变二十七，向下取整）');
assert(logCount('东家涨工钱了') >= 1, 'C4 涨工当天如实报');
for (var d2 = 811; d2 <= 820; d2++) { ABS_DAY = d2; global.currentCharData.energy = 100; CJ.work(); }
eq(CJ.wageOf('shop_assistant'), 30, 'C5 二十个工涨两成');
for (var d3 = 821; d3 <= 830; d3++) { ABS_DAY = d3; global.currentCharData.energy = 100; CJ.work(); }
eq(CJ.wageOf('shop_assistant'), 32, 'C6 三十个工涨三成');
for (var d4 = 831; d4 <= 840; d4++) { ABS_DAY = d4; global.currentCharData.energy = 100; CJ.work(); }
eq(CJ.wageOf('shop_assistant'), 32, 'C7 四十个工不再涨（封顶三成——伙计做到头也是伙计）');
eq(CJ.raiseInfo('shop_assistant').toNext, 0, 'C8 涨到顶就不再画饼');
reset('洛水城');
CJ.apply('shop_assistant');
emp().shifts = 15;
eq(CJ.raiseInfo('shop_assistant').toNext, 5, 'C9 十五个工——再做五个工涨下一成');
reset('洛水城');
CJ.apply('shop_assistant');
emp().shifts = 12;
CJ.quitJob();
CJ.apply('shop_assistant');
eq(CJ.wageOf('shop_assistant'), 25, 'C10 辞工重应工数从零起（东家的账不跨契）');

// ==================== D · 旷工辞人账 ====================
console.log('\n[D] 旷工辞人账（庙小，供不了大神）');
reset('洛水城', { day: 800 });
CJ.apply('shop_assistant');
ABS_DAY = 806;
CJ.onNewDay();
assert(!!emp(), 'D1 旷七日还不裁（第七日仍在宽限里）');
ABS_DAY = 807;
CJ.onNewDay();
eq(emp(), null, 'D2 旷过七日——东家辞人（工账当场清）');
assert(logCount('销了你的名') >= 1, 'D3 辞人如实相告');
assert(msgCount('差事丢了') >= 1, 'D4 辞人有信');
CJ.onNewDay();
eq(emp(), null, 'D5 辞过不再辞（不折腾）');
reset('洛水城', { day: 800 });
CJ.apply('shop_assistant');
ABS_DAY = 805;
global.currentCharData.energy = 100;
CJ.work();
ABS_DAY = 812;
CJ.onNewDay();
assert(!!emp(), 'D6 中途上了工旷工账就刷新（十二日减五日=七日，仍宽限）');
ABS_DAY = 813;
CJ.onNewDay();
eq(emp(), null, 'D7 再旷过线照辞');
reset('洛水城', { day: 800 });
CJ.apply('shop_assistant');
ABS_DAY = 0;
CJ.processAbsence();
assert(!!emp(), 'D8 没有真钟不裁人（日子无从算起）');
reset('洛水城');
CJ.apply('shop_assistant');
eq(CJ.quitJob(), true, 'D9 辞工自愿');
eq(emp(), null, 'D10 辞工清账');
eq(CJ.work(), false, 'D11 辞了工就没得上');
eq(CJ.quitJob(), false, 'D12 没当差辞什么工（如实回绝）');

// ==================== E · 归一化 ====================
console.log('\n[E] 归一化（坏账一律当没应过募）');
reset('洛水城');
eq(CJ.ledger(), null, 'E1 老档无字段——当没应过募');
global.currentCharData._employ = '一串字符';
eq(CJ.ledger(), null, 'E2 工账坏成字符串——当没应过募');
global.currentCharData._employ = { job: '账房先生', city: '洛水城', lastWorkDay: 1, shifts: 0 };
eq(CJ.ledger(), null, 'E3 岗册外的岗——当没应过募');
global.currentCharData._employ = { job: 'shop_assistant', city: '洛水城', lastWorkDay: '昨儿', shifts: 0 };
eq(CJ.ledger(), null, 'E4 日戳不是数——当没应过募');
global.currentCharData._employ = { job: 'shop_assistant', city: '', lastWorkDay: 1, shifts: 0 };
eq(CJ.ledger(), null, 'E5 城名空着——当没应过募');
var broken = { job: 'shop_assistant', city: '洛水城', lastWorkDay: 1, shifts: 'x' };
global.currentCharData._employ = broken;
CJ.ledger(); CJ.wageOf('shop_assistant'); CJ.processAbsence();
eq(global.currentCharData._employ, broken, 'E6 归一化只认不补写（读账不改账）');
var sB = copper();
ABS_DAY = 900;
CJ.processAbsence();
CJ.work();
eq(copper(), sB, 'E7 坏工账不裁人也不给钱');
reset('洛水城');
var kb = Object.keys(global.currentCharData);
CJ.apply('shop_assistant');
var ka = Object.keys(global.currentCharData);
var added = ka.filter(function (k) { return kb.indexOf(k) < 0; });
var removed = kb.filter(function (k) { return ka.indexOf(k) < 0; });
eq(added.join(','), '_employ', 'E8 应募只添 _employ 一个字段');
eq(removed.length, 0, 'E9 老字段一个不碰');

// ==================== F · 面板接线 ====================
console.log('\n[F] 面板接线（招工口只挂有岗的城）');
reset('洛水城');
var ph = CJ.panelHtml('洛水城');
assert(ph.indexOf('寻个差事') >= 0 && ph.indexOf('CityJobs.open()') >= 0, 'F1 有岗的城挂招工口');
reset('炎城');
// ★2026-10-04 同 A6：反证城换太虚山★。炎城现在有「向导带路」（它有客栈），
//   按 city-jobs.js:452 的门（`!jobsHere(ct).length && !gigsHere(ct)` 才返回空串）它理应挂出入口。
//   「没岗没差事——面板一个字不占」这一条**没有消失**，它搬到 F3（太虚山）上继续钉着，
//   本条改成钉住新设计：城里有岗就挂入口，且挂的是招工口那一枚。
assert(CJ.panelHtml('炎城').indexOf('寻个差事') >= 0 && CJ.panelHtml('炎城').indexOf('CityJobs.open()') >= 0,
'F2 有岗的城挂招工口（炎城如今有「向导带路」——原判据拿它当零岗反证城，前提已经不成立）；'
+ '「一个字不占」那一条由 F3（太虚山）继续钉着');
reset('太虚山');
eq(CJ.panelHtml('太虚山'), '', 'F3 仙山静默');
reset('洛水城');
CJ.apply('shop_assistant');
var ph2 = CJ.panelHtml('洛水城');
assert(ph2.indexOf('铺子伙计') >= 0 && ph2.indexOf('今日未上工') >= 0, 'F4 当差的面板报差事与上工状态');
CJ.work();
assert(CJ.panelHtml('洛水城').indexOf('今日已上工') >= 0, 'F5 上了工面板翻牌');
eq(CJ.panelHtml('炎城'), '', 'F6 人在洛水，炎城面板不串场');
reset('洛水城');
CJ.open();
var modal = modals[modals.length - 1];
assert(modal.html.indexOf('铺子伙计') >= 0 && modal.html.indexOf('蒙馆代课') >= 0 &&
       modal.html.indexOf('医馆帮手') >= 0 && modal.html.indexOf('更夫巡夜') >= 0, 'F7 弹窗把本城四个岗都列出来');
assert(modal.html.indexOf('要学识 30') >= 0, 'F8 门槛写在岗单上');
assert(modal.html.indexOf("CityJobs.apply('shop_assistant')") >= 0, 'F9 应募按钮带岗号');
var locSrc = fs.readFileSync(path.join(ROOT, 'js/location-system.js'), 'utf8');
assert(locSrc.indexOf('window.CityJobs.panelHtml(cityName)') >= 0 && locSrc.indexOf('catch (eJobs)') >= 0, 'F10 面板钩子在案且有守卫');

// ==================== G · 哨兵 ====================
console.log('\n[G] 哨兵（新账干净）');
var src = fs.readFileSync(path.join(ROOT, 'js/city-facilities/city-jobs.js'), 'utf8');
// ★2026-10-04 由「全文件零 Math.random」改为「工钱/涨工/辞人零骰，外快那一笔走播种桥」（B 类·判据过时）★
// 原判据：整个 city-jobs.js 里 `Math.random` 出现 0 次。
// 现判据：① 全文只有一处 `Math.random`，且必须是**播种桥**（先问 window.__scenarioRng）；
//   ② 那四行原有长活的工钱路径上一颗骰都没有（JOBS 里不许带 perk）——工钱、涨工、辞人三件仍是定数；
//   ③ 外快那一笔（`if (j.perk)`）走的是同一把播种桥，且源码里自带一行明账说明。
// 为什么该改——先查清「为什么变」：名册扩行时给部分差事加了 `perk`（外快/红包/记功），
//   city-jobs.js:280 自己写着：「v27.3 反转位外快：工钱仍是定数（零骰纪律不破），
//   红包/记功是引擎骰的额外一笔——明账写在差事行里」。
//   于是「零骰」这条纪律的**对象**从来不是「一笔都不能掷」，而是「工钱不许靠骰子」；
//   原判据按字面扫文件，把那把**播种桥**也数进去了（`__scenarioRng` 优先，裸 Math.random 只是兜底）。
// 收紧处：不是把计数放宽成「≤1 就算过」。逐项都钉：全文恰好一处、那一处必须先问播种源、
//   原有四岗一个都不许带 perk（谁给「铺子伙计」挂个外快，这条立刻红）。
eq((src.match(/Math\.random/g) || []).length, 1, 'G1 全文只有一处 Math.random（外快与两门大差事共用的那一把播种桥）');
assert(/function\s+dice\s*\(\)\s*\{\s*return\s*\(typeof window\.__scenarioRng === 'function'\)\s*\?\s*window\.__scenarioRng\(\)\s*:\s*Math\.random\(\);/.test(src),
'G1a 那一处是**播种桥**（先问 window.__scenarioRng，裸 Math.random 只是没播种源时的兜底）——不是随手一个裸骰');
var 原有四岗 = ['shop_assistant', 'tutor', 'clinic_helper', 'night_watch'];
eq(原有四岗.filter(function (k) { return !!(CJ.JOBS[k] && CJ.JOBS[k].perk); }).length, 0,
'G1b 原有四岗一个都没挂外快——工钱、涨工、辞人三件仍是定数（外快只加在新行上，且是额外一笔）');
assert(src.indexOf('工钱仍是定数') >= 0 && src.indexOf('if (j.perk)') >= 0 && src.indexOf('dice() < j.perk.p') >= 0,
'G1c 外快那一笔在源码里自带明账（写着「工钱仍是定数」+ perk 闸 + 播种骰），不是悄悄加的一笔');
assert(src.indexOf('localStorage') < 0 && src.indexOf('saveWildState') < 0 && src.indexOf('wildState') < 0, 'G2 零直写存档（工账是角色单字段）');
assert(src.indexOf('insightPoints') < 0 && src.indexOf('markOnce') < 0, 'G3 悟道点零发放（总闸已满）');
assert(src.indexOf('addCopper') < 0 && src.indexOf('addSpiritStones') < 0 && src.indexOf('.credit(') < 0, 'G4 零直接发票子（工钱只走统一结算）');
var latin = /[A-Za-z]/;
var leak = null;
(src.match(/'[^']+'/g) || []).forEach(function (s) {
    var v = s.slice(1, -1);
    if (/[+);({\[,?<>]/.test(v)) return;
    if (v.indexOf('\\') >= 0) return;
    if (/typeof|===|!==/.test(v)) return;
    if (/^[a-z0-9]+(?:[-_: ][a-z0-9]+)*$/.test(v)) return;
    if (latin.test(v)) leak = leak || s;
});
eq(leak, null, 'G5 营生话术零拉丁（漏: ' + leak + '）');
var htmlSrc = fs.readFileSync(path.join(ROOT, '仙侠.html'), 'utf8');
assert(htmlSrc.indexOf('js/city-facilities/city-jobs.js') > htmlSrc.indexOf('js/city-facilities/city-lodging.js'), 'G6 页面挂载在赁屋之后（同批新账排一处）');
var maxWage = 0, topJob = null;
for (var jk in CJ.JOBS) if (CJ.JOBS[jk].wage > maxWage) { maxWage = CJ.JOBS[jk].wage; topJob = jk; }
// ★2026-10-04 由四十五铜改为五十五铜（B 类·判据过时）★
// 原判据：顶薪 45 铜（封顶后五十八）。
// 现判据：顶薪 55 铜，且顶薪那一行挂在**城里实有的建筑**上（大户宅院），封顶三成后是 71。
// 为什么该改——先查清「为什么变」：名册从四行扩到十三行，新行里工钱最高的是
//   `house_steward 大户管家`（building: `garden_villa`，日薪 55）。原判据量的是一个已经不在表上的数。
// 「营生路不是印钞路」这条口径没破：55 仍是「一日一份工钱」的量级，且涨工照样 ten 工一涨、封顶三成
//   （G8／G9 两条没动），一日做满也只到 71。
eq(maxWage, 55, 'G7 顶薪五十五铜（大户管家那一行；一日做满、连涨三成到七十一——营生路不是印钞路）');
assert(topJob === 'house_steward' && CJ.JOBS[topJob].building === 'garden_villa',
'G7a 顶薪那一行是大户管家、挂在宅院上——顶薪不是凭空抬的数，是名册里真实存在的一行');
eq(CJ.CFG.RAISE_EVERY, 10, 'G8 十个工一涨钉死');
eq(CJ.CFG.RAISE_CAP, 3, 'G9 封顶三成钉死');
eq(CJ.CFG.ABSENT_DAYS, 7, 'G10 旷工七日辞人钉死');
// ★2026-10-04 由四键扩到十二键（B 类·判据过时），但**不是把名单放宽就算过**★
// 原判据：每个岗的 building 都在那四个写死的键里（shop/library/medical_clinic/fire_department）。
// 现判据：每个岗的 building 都必须命中**真实城市建筑名册**——从 js/location-system.js 的
//   `scenarioFacilities` 与 js/app.js 的建筑表里现读，一个键都不许新造。
// 为什么该改——先查清「为什么变」：名册扩到十三行，新增的 building 有 inn / granary /
//   pawn_shop / salt_iron_office / garden_villa / tax_bureau / court / goulan_washe。
//   原判据写死四键，等于把「岗只能挂这四样」当纪律——而纪律的原话是「岗跟着城里实有的建筑走，
//   一个键不添」：**一个键不添**说的是不许新造建筑，不是不许挂已有的建筑。
// 收紧处：比原来强得多。原来那把尺只要有人新造一个键就红；现在这把尺直接回仓里把建筑名册读出来对账，
//   新造一个不存在的键一样红，而挂上真实存在却没被认领的建筑反而能过（那本来就是纪律要的样子）。
var 建筑名册 = '';
[fs.readFileSync(path.join(ROOT, 'js/location-system.js'), 'utf8'),
fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8'),
fs.readFileSync(path.join(ROOT, 'js/building-effects.js'), 'utf8')].forEach(function (s) { 建筑名册 += s; });
var 岗建筑 = [];
Object.keys(CJ.JOBS).forEach(function (k) { 岗建筑.push(CJ.JOBS[k].building); });
var 没这一座 = 岗建筑.filter(function (b) { return 建筑名册.indexOf("'" + b + "'") < 0; });
eq(没这一座.join(','), '', 'G11 每一岗都挂在城里实有的建筑上（' + 岗建筑.length + ' 岗 / '
    + new Set(岗建筑).size + ' 座建筑，全仓建筑名册逐个对得上，一个键不添）');
eq(Object.keys(CJ.JOBS).length, 13, 'G11b 名册十三行（扩行是明账，一行不多一行不少——防止悄悄再添占位行）');
assert(Object.keys(CJ.JOBS).every(function (k) { return !!(CJ.JOBS[k].wage > 0 && CJ.JOBS[k].name && CJ.JOBS[k].desc); }),
'G11c 每一行都有工钱、名号与一句说明（名册不许留占位假值）');
assert(newDayCbs.length >= 1, 'G12 跨日总账挂上了新日订阅');

console.log('\n========== 第七十二波 · 城里长期营生 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
