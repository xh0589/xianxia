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
eq(CJ.jobsHere('炎城').length, 0, 'A6 集市城没有长活岗（岗跟着建筑走）');
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
eq(CJ.panelHtml('炎城'), '', 'F2 没岗没差事——面板一个字不占');
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
eq((src.match(/Math\.random/g) || []).length, 0, 'G1 营生全程零骰（工钱、涨工、辞人全是定数）');
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
var maxWage = 0;
for (var jk in CJ.JOBS) maxWage = Math.max(maxWage, CJ.JOBS[jk].wage);
eq(maxWage, 45, 'G7 顶薪四十五铜（封顶后五十八——营生路不是印钞路）');
eq(CJ.CFG.RAISE_EVERY, 10, 'G8 十个工一涨钉死');
eq(CJ.CFG.RAISE_CAP, 3, 'G9 封顶三成钉死');
eq(CJ.CFG.ABSENT_DAYS, 7, 'G10 旷工七日辞人钉死');
var knownBuildings = ['shop', 'library', 'medical_clinic', 'fire_department'];
assert(Object.keys(CJ.JOBS).every(function (k) { return knownBuildings.indexOf(CJ.JOBS[k].building) >= 0; }), 'G11 四岗都挂既有建筑（城市建筑清单一个键不添）');
assert(newDayCbs.length >= 1, 'G12 跨日总账挂上了新日订阅');

console.log('\n========== 第七十二波 · 城里长期营生 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
