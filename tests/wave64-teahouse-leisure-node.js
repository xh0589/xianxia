/**
 * wave64-teahouse-leisure-node.js — 第六十四波 · 茶馆消遣 验收：
 *   A 菜单：六个口子报价挂脸上、听书照旧走老账、消遣不发悟道点的纪律句在册
 *   B 粗茶雅座：铜钱灵石真扣、心境精力真气真补、封顶不超、分城闲话词条接上了
 *   C 棋局：彩头先付、赢得双倍、输也长记性、钱不够/累得下不动都如实拒绝
 *   D 题诗写生：每日各一次（运行时旗，零新存档字段）、分城墨趣、败笔也有宽慰
 *   E 分城口吻：五城棋/诗/画键齐、八城瓦舍氛围词在册、idle 数组仍两条（v21.5 老钉不破）
 *   F 哨兵：新文件恰三枚骰、零存档、零悟道点；visitTeaHouse 老函数一字未动（M8 老账）
 *
 * 运行：node tests/wave64-teahouse-leisure-node.js
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

// ==================== 世界桩 ====================
global.window = global;
var msgs = [];
global.showMessage = function (m, t) { msgs.push({ m: String(m), t: t }); };
var timeCalls = [];
var ABS_DAY = 800;
global.timeSystem = {
    gameTime: { totalMinutes: ABS_DAY * 1440 + 600, currentDay: 5, currentHour: 10, currentSeason: 'spring' },
    advanceTime: function (m, r) { timeCalls.push({ m: m, r: String(r || '') }); this.gameTime.totalMinutes += m; },
    getAbsoluteDay: function () { return ABS_DAY; }
};
var copperCalls = [], stoneCalls = [];
global.XianXia = {
    DataManager: {
        getSpiritStones: function () { return (global.currentCharData.spiritStones || 0); },
        deductSpiritStones: function (n) {
            stoneCalls.push(n);
            if ((global.currentCharData.spiritStones || 0) < n) return false;
            global.currentCharData.spiritStones -= n;
            return true;
        },
        addSpiritStones: function () { assert(false, '茶馆消遣不该凭空加灵石'); },
        // 铜钱桩与真源同款双写（global-utils getCopper/setCopper 语义）：读角色面额、写两面
        getCopper: function () {
            return (global.currentCharData && typeof global.currentCharData.copper === 'number')
                ? global.currentCharData.copper : ((global.inventory.currency || {}).copper || 0);
        },
        setCopper: function (amount) {
            amount = Math.max(0, amount);
            if (global.currentCharData) global.currentCharData.copper = amount;
            if (global.inventory && global.inventory.currency) global.inventory.currency.copper = amount;
        },
        deductCopper: function (n) {
            copperCalls.push(n);
            var cur = this.getCopper();
            if (cur < n) return false;
            this.setCopper(cur - n);
            return true;
        }
    }
};
global.inventory = { currency: { spiritStones: 100, copper: 500 }, slots: [] };
global.itemById = {};
global.EventBus = { emit: function () {}, on: function () {} };
global.updateCurrencyUI = function () {};
global.updateCharacterStatus = function () {};
global.getEffectiveMax = function () { return 100; };
global.getCurrentCityName = function () { return global.currentCharData.location; };
var dlg = null, closeCalls = 0, storyCalls = 0;
global.showBuildingEffectDialog = function (t, html) { dlg = { t: String(t), html: String(html) }; };
global.closeBuildingDialog = function () { closeCalls++; };
global.visitTeaHouse = function () { storyCalls++; return true; };
global.currentCharData = {
    mood: 50, energy: 60, qi: 10, maxQi: 200, copper: 500, spiritStones: 100,
    lifeSkills: { '学识': 20, '口才': 10, '音律': 0 }, location: '帝都·长安'
};

load('js/economy/economy-transaction.js');
load('js/core/reward-service.js');
load('js/city-facilities/city-voices.js');
load('js/city-facilities/teahouse-leisure.js');

var TL = global.TeaHouseLeisure;
var CFG = TL.CFG;
var RS = global.RewardService;

function withRandom(v, fn) {
    var orig = Math.random, calls = 0;
    Math.random = function () { calls++; return v; };
    try { fn(calls); } finally { Math.random = orig; }
    return calls;
}
function msgCount(word) {
    return msgs.filter(function (m) { return m.m.indexOf(word) >= 0; }).length;
}
function lastMsg() { return msgs.length ? msgs[msgs.length - 1].m : ''; }
function reset(hp) {
    var c = global.currentCharData;
    c.mood = 50; c.energy = 60; c.qi = 10; c.copper = 500; c.spiritStones = 100;
    c.lifeSkills = { '学识': 20, '口才': 10, '音律': 0 };
    c.location = '帝都·长安';
    delete c._teaPoemDay; delete c._teaPaintDay;
    msgs.length = 0; timeCalls.length = 0; copperCalls.length = 0; stoneCalls.length = 0;
    global.inventory.currency = { spiritStones: 100, copper: 500 };
    if (hp) hp();
}

// ==================== A · 菜单 ====================
console.log('\n[A] 菜单（六个口子，报价挂在脸上）');
reset();
TL.open();
assert(dlg && dlg.t.indexOf('茶馆') >= 0, 'A1 菜单弹窗开了（茶馆·消遣）');
['story', 'tea', 'room', 'go', 'poem', 'paint'].forEach(function (k) {
    assert(dlg.html.indexOf("TeaHouseLeisure.act('" + k + "')") >= 0, 'A2-' + k + ' 「' + k + '」按钮在册');
});
assert(dlg.html.indexOf('10 灵石') >= 0 && dlg.html.indexOf('3 铜钱') >= 0 && dlg.html.indexOf('2 灵石') >= 0 && dlg.html.indexOf('彩头 10 铜钱') >= 0,
    'A3 四个带价口子的报价全挂在按钮上');
assert(dlg.html.indexOf('每日一次') >= 0, 'A4 题诗写生的每日限次写在脸上');
assert(dlg.html.indexOf('消遣不长悟道点') >= 0, 'A5 纪律句在册（茶馆买的是半日闲，不是道行）');
TL.act('story');
eq(storyCalls, 1, 'A6 听书口子原样转给老账（visitTeaHouse 一字未改地干活）');
TL.act('乱点');
assert(msgCount('没这个点子') === 1, 'A7 乱点如实回绝不炸');
assert(closeCalls >= 2, 'A8 点单先收菜单（不留两层窗）');

// ==================== B · 粗茶雅座 ====================
console.log('\n[B] 粗茶雅座（花小钱买松快）');
reset();
withRandom(0, function () { TL.act('tea'); });   // vo 取闲话池第一条
eq(global.currentCharData.copper, 497, 'B1 粗茶 3 铜钱真扣（500 → 497）');
eq(global.currentCharData.mood, 56, 'B2 心境 50 → 56');
eq(global.currentCharData.energy, 75, 'B3 精力 60 → 75');
eq(timeCalls[timeCalls.length - 1].m, 30, 'B4 坐了半个时辰（30 分钟真跳）');
assert(msgCount('举子') === 1, 'B5 帝都茶馆说帝都的闲话（v21.5 写好的 idle 词条终于接上了）');
assert(lastMsg().indexOf('精力+15') >= 0 && lastMsg().indexOf('心境+6') >= 0, 'B6 话术把账讲明');
// 封顶
reset(function () { global.currentCharData.energy = 95; });
withRandom(0, function () { TL.act('tea'); });
eq(global.currentCharData.energy, 100, 'B7 精力封顶不超（95+15 → 100）');
// 没钱
reset(function () { global.currentCharData.copper = 2; });
TL.act('tea');
assert(msgCount('粗茶也要') === 1 && timeCalls.length === 0, 'B8 钱不够如实拒绝，时间分毫不动');
// 雅座
reset();
TL.act('room');
eq(global.currentCharData.spiritStones, 98, 'B9 雅座 2 灵石真扣（100 → 98）');
eq(global.currentCharData.mood, 60, 'B10 心境 50 → 60');
eq(global.currentCharData.energy, 100, 'B11 精力 60+40 封顶 100');
eq(global.currentCharData.qi, 30, 'B12 真气 10 → 30');
eq(timeCalls[timeCalls.length - 1].m, 60, 'B13 雅座静坐一个时辰');
reset(function () { global.currentCharData.spiritStones = 1; });
TL.act('room');
assert(msgCount('雅座茶资') === 1 && timeCalls.length === 0, 'B14 灵石不够帘子不掀');

// ==================== C · 棋局 ====================
console.log('\n[C] 棋局（彩头是茶客的钱袋，不凭空印）');
reset();
withRandom(0.01, function () { TL.act('go'); });   // 学识20 → 胜率 0.45，必胜签
eq(global.currentCharData.copper, 510, 'C1 赢：彩头 10 付出、双倍 20 奉还，净 +10（500 → 510）');
eq(global.inventory.currency.copper, 510, 'C2 经济真源与角色面额双写同源（两本账对得齐）');
eq(global.currentCharData.lifeSkills['学识'], 23, 'C3 赢棋长学识 +3（统一结算通道）');
eq(global.currentCharData.mood, 60, 'C4 赢棋心境 +10');
eq(global.currentCharData.energy, 55, 'C5 对弈耗神（精力 -5）');
eq(timeCalls[timeCalls.length - 1].m, 60, 'C6 一局棋一个时辰');
assert(msgCount('老翰林') === 1, 'C7 帝都的棋客是帝都的腔（分城 chess 词接上）');
assert(lastMsg().indexOf('赢') >= 0, 'C8 赢路话术如实报');
// 输路
reset();
withRandom(0.99, function () { TL.act('go'); });
eq(global.currentCharData.copper, 490, 'C9 输棋彩头照付（500 → 490）');
eq(global.inventory.currency.copper, 490, 'C10 输棋没有回钱（两本账都停在 490，分文不还）');
eq(global.currentCharData.lifeSkills['学识'], 21, 'C11 输棋也长一点记性（学识 +1）');
eq(global.currentCharData.mood, 55, 'C12 输棋心境 +5（棋是输熟的）');
assert(lastMsg().indexOf('输了') >= 0, 'C13 输路话术如实报（不谎报军情）');
// 钱不够：骰子都不许掷
reset(function () { global.currentCharData.copper = 5; });
var origRandom = Math.random, rolled = 0;
Math.random = function () { rolled++; return 0.5; };
TL.act('go');
Math.random = origRandom;
eq(rolled, 0, 'C14 彩头不够连骰子都不掷（先收钱后开局）');
eq(global.currentCharData.energy, 60, 'C15 没开局不耗精力');
assert(msgCount('没钱下什么彩棋') === 1, 'C16 拒绝话术带茶客的奚落（有滋味）');
// 太累
reset(function () { global.currentCharData.energy = 3; });
TL.act('go');
assert(msgCount('累得捏不稳棋子') === 1 && global.currentCharData.copper === 500, 'C17 累得下不动：如实拒绝、彩头不收');

// ==================== D · 题诗写生 ====================
console.log('\n[D] 题诗写生（每日各一次，运行时旗零存档）');
reset();
withRandom(0.01, function () { TL.act('poem'); });
eq(global.currentCharData._teaPoemDay, ABS_DAY, 'D1 题诗记了今日的旗（运行时旗，读档清账）');
eq(global.currentCharData.lifeSkills['学识'], 22, 'D2 好诗长学识 +2');
eq(global.currentCharData.mood, 58, 'D3 好诗心境 +8');
eq(global.currentCharData.energy, 57, 'D4 弄墨耗神（精力 -3）');
eq(timeCalls[timeCalls.length - 1].m, 30, 'D5 题诗半个时辰');
assert(msgCount('馆阁气') === 1, 'D6 帝都题诗有帝都的评（分城 poem 词接上）');
// 同日再来
var enBefore = global.currentCharData.energy;
TL.act('poem');
assert(msgCount('今日的诗已经题过了') === 1, 'D7 同日再题被拦（墨迹未干）');
eq(global.currentCharData.energy, enBefore, 'D8 被拦不耗精力不跳时间');
// 写生独立
reset();
withRandom(0.01, function () { TL.act('poem'); TL.act('paint'); });
eq(global.currentCharData._teaPaintDay, ABS_DAY, 'D9 题诗用过，写生照旧可用（两本日历各记各的）');
assert(msgCount('朱门') === 1, 'D10 帝都写生有帝都的景（分城 paint 词接上）');
TL.act('paint');
assert(msgCount('今日已经画过一幅') === 1, 'D11 同日再画被拦');
// 隔夜重置
reset();
withRandom(0.01, function () { TL.act('poem'); });
ABS_DAY = 801;
msgs.length = 0;
withRandom(0.01, function () { TL.act('poem'); });
eq(msgCount('已经题过了'), 0, 'D12 隔夜再题不拦（日历翻页）');
eq(global.currentCharData._teaPoemDay, 801, 'D13 旗跟着翻页');
// 败笔
reset();
withRandom(0.99, function () { TL.act('poem'); });
eq(global.currentCharData.lifeSkills['学识'], 21, 'D14 败笔也练过（学识 +1）');
eq(global.currentCharData.mood, 54, 'D15 败笔心境 +4（店家把墙擦出一块新白）');
assert(msgCount('打油诗') === 1, 'D16 败笔话术如实报（不谎称好诗）');
// 太累
reset(function () { global.currentCharData.energy = 2; });
TL.act('paint');
assert(msgCount('手抖得握不住笔') === 1 && global.currentCharData._teaPaintDay === undefined, 'D17 累得画不动：拒绝且不打今日旗（歇足了还能画）');

// ==================== E · 分城口吻 ====================
console.log('\n[E] 分城口吻（键齐、词真、老钉不破）');
var VOICES = global.CITY_VOICES;
var TEA_CITIES = ['帝都·长安', '洛水城', '青木城', '青城山', '鲛人镇'];
var WASHE_CITIES = ['帝都·长安', '洛水城', '青木城', '炎城', '万毒谷', '金城', '冰原城', '鲛人镇'];
var latin = /[A-Za-z]/;
var inkBad = [];
TEA_CITIES.forEach(function (c) {
    var h = VOICES[c] && VOICES[c].teaHouse;
    if (!h) { inkBad.push(c + '(无茶馆口吻)'); return; }
    if (!h.idle || h.idle.length !== 2) inkBad.push(c + '(idle 不是两条——v21.5 老钉)');
    ['chess', 'poem', 'paint'].forEach(function (k) {
        if (typeof h[k] !== 'string' || !h[k]) inkBad.push(c + '.' + k + '(缺)');
        else if (latin.test(h[k])) inkBad.push(c + '.' + k + '(混拉丁)');
    });
});
assert(inkBad.length === 0, 'E1 五座茶馆城棋/诗/画键齐且全中文、idle 仍两条（违例: ' + inkBad.slice(0, 3) + '）');
var crowdBad = [];
Object.keys(VOICES).forEach(function (c) {
    var g = VOICES[c].goulan_washe;
    if (!g) return;
    if (WASHE_CITIES.indexOf(c) < 0) crowdBad.push(c + '(城无瓦舍却配了氛围词)');
    if (typeof g.crowd !== 'string' || !g.crowd || latin.test(g.crowd)) crowdBad.push(c + '.crowd(缺或混拉丁)');
});
assert(crowdBad.length === 0, 'E2 瓦舍氛围词只在挂瓦舍的城（违例: ' + crowdBad.slice(0, 3) + '）');
var crowdCount = Object.keys(VOICES).filter(function (c) { return !!VOICES[c].goulan_washe; }).length;
eq(crowdCount, 8, 'E3 八座瓦舍城一座不落');
assert(!VOICES['佛国遗址'].goulan_washe && !VOICES['万剑宗'].goulan_washe, 'E4 佛国剑冢不配瓦舍词（与建筑清单同口径）');

// ==================== F · 哨兵 ====================
console.log('\n[F] 哨兵（新账干净，老账未动）');
var tl = fs.readFileSync(path.join(ROOT, 'js/city-facilities/teahouse-leisure.js'), 'utf8');
eq((tl.match(/Math\.random/g) || []).length, 2, 'F1 茶馆消遣恰两枚骰（棋局一枚、题诗写生共用一枚墨账骰，茶与雅座是定数）');
assert(tl.indexOf('localStorage') < 0 && tl.indexOf('saveWildState') < 0 && tl.indexOf('wildState') < 0, 'F2 零直写存档（每日限次是运行时旗）');
assert(tl.indexOf('insightPoints') < 0 && tl.indexOf('markOnce') < 0, 'F3 悟道点零发放（总闸已满）');
assert(tl.indexOf('addSpiritStones') < 0 && tl.indexOf('.credit(') < 0, 'F4 新文件不直接发票子（赢棋彩头走统一结算通道）');
// 话术零拉丁（代码记号走过滤）
var visLeak = null;
(tl.match(/'[^']+'/g) || []).forEach(function (s) {
    var v = s.slice(1, -1);
    if (/[+);({\[,]/.test(v)) return;
    if (v.indexOf('\\') >= 0) return;                              // 菜单里转义引号的按钮记号（代码片段非话术）
    if (/^[a-z0-9]+(?:[-_: ][a-z0-9]+)*$/.test(v)) return;
    if (latin.test(v)) visLeak = visLeak || s;
});
assert(visLeak === null, 'F5 茶馆消遣话术零拉丁（漏: ' + visLeak + '）');
var appSrc = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
var teaIdx = appSrc.indexOf('function visitTeaHouse');
var teaSeg = appSrc.slice(teaIdx, teaIdx + 1800);
assert(teaSeg.indexOf('renderRumorPanel') >= 0 && teaSeg.indexOf('deductSpiritStones') >= 0, 'F6 老听书函数一字未动（传闻真源与茶资老账都在——city-depth M8 同款哨兵）');
assert(appSrc.indexOf('function openTeaHouseMenu()') >= 0 && appSrc.indexOf('window.openTeaHouseMenu = openTeaHouseMenu;') >= 0, 'F7 菜单入口写好并导出');
assert(appSrc.indexOf("action: 'openTeaHouseMenu'") >= 0, 'F8 设施卡面改走菜单（老 action 不再直跳听书）');
var locSrc = fs.readFileSync(path.join(ROOT, 'js/location-system.js'), 'utf8');
assert(locSrc.indexOf('window.TeaHouseLeisure.open') >= 0 && locSrc.indexOf('else window.visitTeaHouse();') >= 0, 'F9 城中点击先开菜单、菜单缺失回落老听书（双保险）');
var htmlSrc = fs.readFileSync(path.join(ROOT, '仙侠.html'), 'utf8');
assert(htmlSrc.indexOf('js/city-facilities/teahouse-leisure.js') > htmlSrc.indexOf('js/city-facilities/city-voices.js'), 'F10 页面挂载在口吻包之后（取词不扑空）');
var rsSrc = fs.readFileSync(path.join(ROOT, 'js/core/reward-service.js'), 'utf8');
assert(rsSrc.indexOf('mood: signedInt(spec.mood)') >= 0 && rsSrc.indexOf("messages.push('心境'") >= 0, 'F11 统一结算通道收了心境键（死水池打通）');

console.log('\n========== 第六十四波 · 茶馆消遣 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
