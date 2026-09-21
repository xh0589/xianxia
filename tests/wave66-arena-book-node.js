/**
 * wave66-arena-book-node.js — 第六十六波 · 斗法台台下赌盘 验收：
 *   A 开盘：第三出戏在册、主戏头一位不动、对阵按城+日定死（同日同场、庄家不说谎）、开盘零骰
 *   B 押注账：热手冷门四路真结算（赢兑输没）、铜钱原子入账、心境输赢两路、钱不够整笔不成交
 *   C 庄家抽头：两边期望都低于本金（0.6×32=19.2、0.4×48=19.2 < 20）——押注不是营生路
 *   D 只看不押：白凑热闹心境小涨、铜钱分毫不动
 *   E 老钉：斗法两路全走 roll、概率不破 0.85、外卡戏在册、必胜节点不复生
 *   F 哨兵：新文件零骰、零存档、零悟道点、零直写心境、话术零拉丁、加载序在增补通道之后
 *
 * 运行：node tests/wave66-arena-book-node.js
 */
'use strict';

var path = require('path');
var fs = require('fs');
var vm = require('vm');

var ROOT = path.resolve(__dirname, '..');
function loadScript(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

var passed = 0, failed = 0;
function ok(cond, label) {
    if (cond) { passed++; console.log('  ✓ ' + label); }
    else { failed++; console.error('  ✗ ' + label); }
}
function eq(a, b, label) { ok(a === b, label + '（实际=' + JSON.stringify(a) + ' 期望=' + JSON.stringify(b) + '）'); }

// ==================== 世界桩（v20.90 同式） ====================
var W = {
    console: { log: function () {}, warn: function () {}, error: function () {} },
    setTimeout: function (fn) { try { fn(); } catch (e) {} return 0; },
    localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
    document: {
        createElement: function () { return { style: {}, classList: { add: function () {}, remove: function () {}, contains: function () { return false; } }, dataset: {}, innerHTML: '' }; },
        getElementById: function () { return null; },
        querySelector: function () { return null; },
        addEventListener: function () {},
        body: { appendChild: function () {} }
    },
    alert: function () {}
};
W.window = W;

var state = { logs: [], minutes: 0, city: '帝都·长安', day: 800 };
W.timeSystem = {
    gameTime: { totalMinutes: state.day * 1440 + 600, currentDay: 7 },
    advanceTime: function (m) { state.minutes += m; this.gameTime.totalMinutes += m; },
    getAbsoluteDay: function () { return state.day; }
};
W.advanceTime = function (m) { state.minutes += m; };
W.gameLog = { add: function (t) { state.logs.push(String(t)); } };
W.showMessage = function () {};
W.getRealmTier = function () { return 3; };
W.addReputation = function () {};
W.getReputationValue = function () { return 0; };
W.getCurrentCityName = function () { return state.city; };

var cd = {
    name: '测试赌客', realm: '金丹', layer: 1, location: '帝都·长安',
    health: 100, maxHealth: 100, qi: 100, maxQi: 200, energy: 100, maxEnergy: 100,
    mood: 80, tempering: 0, karma: 0, notoriety: 0, fame: 0,
    lifeSkills: { '音律': 0, '口才': 20, '学识': 20 }
};
W.currentCharData = cd;
W.inventory = { currency: { spiritStones: 100, copper: 500 }, slots: [] };
W.currentEquipment = {};
W.itemById = {};
W.EventBus = { emit: function () {}, on: function () {} };
W.StateRegistry = { register: function () {} };
W.updateCurrencyUI = function () {};
W.updateCharacterStatus = function () {};

vm.createContext(W);
function load(rel) { vm.runInContext(loadScript(rel), W, { filename: rel }); }
load('js/economy/economy-transaction.js');
load('js/core/reward-service.js');
load('js/core/scenario-engine.js');
load('js/city-facilities/facility-batch2.js');   // 真主戏（duel）
load('js/city-facilities/facility-batch3.js');   // 真增补通道 + 外卡戏
load('js/city-facilities/facility-arena-book.js');

var SE = W.scenarioEngine;
var FAC = SE.facilities['arena_stage'];
var BOOK = null;
(FAC.scenarios || []).forEach(function (s) { if (s.id === 'arena_book') BOOK = s; });

function fresh() {
    SE.cancel();
    cd.mood = 80; cd.energy = 100; cd.qi = 100;
    W.inventory.currency = { spiritStones: 100, copper: 500 };
    state.minutes = 0; state.logs.length = 0; state.city = '帝都·长安'; state.day = 800;
    cd.location = '帝都·长安';
    delete W.__scenarioRng;
}
function logsHave(word) {
    return state.logs.some(function (l) { return l.indexOf(word) >= 0; });
}
function startBook() { return SE.start('arena_stage', 'arena_book'); }

// ==================== A · 开盘 ====================
console.log('\n[A] 开盘（第三出戏，主戏不动，对阵定死）');
fresh();
ok(!!BOOK, 'A1 台下赌盘挂上斗法台（第三出戏在册）');
var ids = FAC.scenarios.map(function (s) { return s.id; });
eq(ids[0], 'duel', 'A2 主戏「上台挑战」仍在头一位（老验收按位次点单）');
ok(ids.indexOf('arena_wildcard') >= 0 && ids.indexOf('arena_book') >= 0, 'A3 外卡与赌盘两出添头都在');
eq(ids.length, new Set(ids).size, 'A4 戏号无重复');
var abStart = BOOK.nodes.ab_start;
eq(abStart.choices.length, 4, 'A5 赌盘四面：押热手/押冷门/只看不押/走人');
ok(abStart.choices[0].text.indexOf('押热手') >= 0 && abStart.choices[1].text.indexOf('押冷门') >= 0, 'A6 热手冷门两面报价挂脸上');
// 对阵按城+日定死：同日开盘两回是同一场
var d1 = startBook().desc;
SE.cancel();
var d2 = startBook().desc;
eq(d1, d2, 'A7 同日开盘两回，对阵一字不差（庄家不换个对阵说谎）');
ok(d1.indexOf('二十铜') >= 0 && d1.indexOf('台子钱') >= 0, 'A8 开盘话术把注金与抽头讲在明处');
ok(d1.indexOf('连胜') >= 0, 'A9 热手的连胜场次挂在牌上');
// 换日换城：对阵跟着换
SE.cancel();
var days = {};
for (var i = 0; i < 6; i++) {
    state.day = 800 + i;
    var st = startBook();
    days[st.desc] = 1;
    SE.cancel();
}
ok(Object.keys(days).length >= 2, 'A10 换日换对阵（六天里不止一场戏）');
state.day = 800;
var dImperial = startBook().desc;
SE.cancel();
state.city = '鲛人镇'; cd.location = '鲛人镇';
var dJiaoren = startBook().desc;
SE.cancel();
state.city = '帝都·长安'; cd.location = '帝都·长安';
ok(!!dJiaoren && dJiaoren.indexOf('二十铜') >= 0 && dJiaoren.indexOf('台子钱') >= 0, 'A11 换城重开盘照样把规矩讲全（两城撞同一场对阵也合法——播种使然）');
// 开盘零骰
fresh();
var rolled = 0, origRandom = Math.random;
Math.random = function () { rolled++; return 0.5; };
W.__scenarioRng = function () { rolled++; return 0.5; };
startBook();
Math.random = origRandom;
delete W.__scenarioRng;
SE.cancel();
eq(rolled, 0, 'A12 开盘看牌零骰（对阵是播种定数，骰只在开注后掷）');

// ==================== B · 押注账 ====================
console.log('\n[B] 押注账（赢兑输没，原子结算）');
// 热手赢
fresh();
W.__scenarioRng = function () { return 0.01; };
startBook();
var r = SE.choose(0);
ok(r && !r.error, 'B1 押热手出手成功' + (r && r.error ? '：' + r.error : ''));
eq(W.inventory.currency.copper, 512, 'B2 押中热手：本 20 + 利 12 净入账（500 → 512，连本带利 32）');
eq(cd.mood, 86, 'B3 赢盘心境 +6');
eq(state.minutes, 45, 'B4 看完整场 45 分钟真跳（time 在分支里——外层不殃及）');
ok(logsHave('兑'), 'B5 庄家当众兑付的话术上账');
// 热手输
fresh();
W.__scenarioRng = function () { return 0.99; };
startBook();
r = SE.choose(0);
ok(r && !r.error, 'B6 押热手输了也结算干净');
eq(W.inventory.currency.copper, 480, 'B7 输盘注金照收（500 → 480，分文不还）');
eq(cd.mood, 76, 'B8 输盘心境 -4（输钱的郁闷是真的）');
eq(state.minutes, 45, 'B9 输路一样看完一场');
ok(logsHave('废纸'), 'B10 输盘话术如实报（注单成废纸）');
// 冷门赢（rng 0.39 < 0.4）
fresh();
W.__scenarioRng = function () { return 0.39; };
startBook();
r = SE.choose(1);
eq(W.inventory.currency.copper, 528, 'B11 押中冷门：500 - 20 + 48 = 528（一赔二点四兑现）');
eq(cd.mood, 86, 'B12 冷门赢盘心境同涨');
// 冷门输（rng 0.41 >= 0.4）
fresh();
W.__scenarioRng = function () { return 0.41; };
startBook();
r = SE.choose(1);
eq(W.inventory.currency.copper, 480, 'B13 冷门没押中：注金照收');
// 钱不够
fresh();
W.inventory.currency.copper = 10;
startBook();
r = SE.choose(0);
ok(r && r.error && r.error.indexOf('铜钱不足') >= 0, 'B14 钱不够整笔不成交（' + (r && r.error) + '）');
eq(W.inventory.currency.copper, 10, 'B15 没成交钱分毫不动');
eq(cd.mood, 80, 'B16 没成交心境分毫不动');
eq(state.minutes, 0, 'B17 没成交时间也不跳（原子结算）');

// ==================== C · 庄家抽头 ====================
console.log('\n[C] 庄家抽头（期望低于本金——押注不是营生路）');
var c0 = abStart.choices[0].effects, c1 = abStart.choices[1].effects;
eq(c0.cost.copper, 20, 'C1 一张注单 20 铜钱');
eq(c0.roll.prob, 0.6, 'C2 热手胜率 0.6');
eq(c0.roll.win.copper, 32, 'C3 热手连本带利回 32');
eq(c1.roll.prob, 0.4, 'C4 冷门胜率 0.4');
eq(c1.roll.win.copper, 48, 'C5 冷门连本带利回 48');
ok(c0.roll.prob * c0.roll.win.copper < 20, 'C6 热手期望 19.2 < 本金 20（台子钱含在赔率里）');
ok(c1.roll.prob * c1.roll.win.copper < 20, 'C7 冷门期望 19.2 < 本金 20（两边抽头对称）');
eq(c0.roll.win.mood, 6, 'C8 赢盘心境 +6 在册');
eq(c0.roll.lose.mood, -4, 'C9 输盘心境 -4 在册（走统一结算，非直写）');
eq(c0.roll.win.time, 45, 'C10 赢路 time 在分支里');
eq(c0.roll.lose.time, 45, 'C11 输路 time 也在分支里（外层 time 进不了 roll 分支——引擎老规矩）');

// ==================== D · 只看不押 ====================
console.log('\n[D] 只看不押（白凑热闹）');
fresh();
startBook();
r = SE.choose(2);
ok(r && !r.error, 'D1 白看出手成功');
eq(W.inventory.currency.copper, 500, 'D2 白看铜钱分毫不动');
eq(cd.mood, 83, 'D3 看斗法看得血热（心境 +3）');
eq(state.minutes, 30, 'D4 看一场 30 分钟');
ok(logsHave('白看'), 'D5 话术把「热闹白看、钱没动」讲明白');

// ==================== E · 老钉 ====================
console.log('\n[E] 老钉（主戏与外卡一字未动）');
fresh();
var duFight = FAC.scenarios[0].nodes.du_fight.choices;
ok(duFight.every(function (c) { return c.effects && c.effects.roll; }), 'E1 斗法两路仍全走成败签（sect-buildings C12 同款）');
var duProbs = duFight.map(function (c) { return typeof c.effects.roll.prob === 'function' ? c.effects.roll.prob() : c.effects.roll.prob; });
ok(duProbs.every(function (p) { return p < 0.85; }), 'E2 斗法概率仍破不了 0.85（金丹三层实测 ' + duProbs.map(function (p) { return p.toFixed(2); }).join('/') + '）');
var duJson = JSON.stringify(FAC);
ok(duJson.indexOf('du_win_fast') < 0 && duJson.indexOf('du_win_steady') < 0, 'E3 必胜节点不复生（C11 同款哨兵）');
var wild = null;
FAC.scenarios.forEach(function (s) { if (s.id === 'arena_wildcard') wild = s; });
ok(!!wild && wild.nodes.aw_start.choices[0].effects.roll.win.stones === 120, 'E4 外卡踢馆彩头 120 灵石原样（v20.19 老账）');
ok(!!SE.facilities['contract_hall'], 'E5 契约所等十一家增补未被殃及（batch3 加载无恙）');

// ==================== F · 哨兵 ====================
console.log('\n[F] 哨兵（新文件干净）');
var src = loadScript('js/city-facilities/facility-arena-book.js');
eq((src.match(/Math\.random/g) || []).length, 0, 'F1 赌盘文件零直掷骰（胜负全走引擎随机源，测试可注入复现）');
ok(src.indexOf('localStorage') < 0, 'F2 零直写存档');
ok(src.indexOf('insightPoints') < 0 && src.indexOf('markOnce') < 0, 'F3 悟道点零发放（总闸已满）');
ok(src.indexOf('.mood =') < 0 && src.indexOf('addCopper') < 0 && src.indexOf('.credit(') < 0, 'F4 零直写心境、零直接发票子（全走统一结算通道）');
ok(src.indexOf('facilityAugment(') >= 0, 'F5 走增补通道挂戏（不重注册、不碰主戏）');
// 话术零拉丁（代码记号走过滤，播种记号走白名单）
var latin = /[A-Za-z]/;
var visLeak = null;
(src.match(/'[^']+'/g) || []).forEach(function (s) {
    var v = s.slice(1, -1);
    if (/[+);({\[,]/.test(v)) return;
    if (/^[a-z0-9]+(?:[-_: ][a-z0-9]+)*$/.test(v)) return;
    if (v === '_book_') return;                                    // 播种记号（城+日哈希用）
    if (latin.test(v)) visLeak = visLeak || s;
});
ok(visLeak === null, 'F6 赌盘话术零拉丁（漏: ' + visLeak + '）');
var htmlSrc = loadScript('仙侠.html');
ok(htmlSrc.indexOf('facility-arena-book.js') > htmlSrc.indexOf('facility-batch3.js'), 'F7 页面加载序在增补通道之后（挂戏不扑空）');
ok(htmlSrc.indexOf('facility-batch3.js') > htmlSrc.indexOf('facility-batch2.js'), 'F8 增补通道在主戏之后（老序未动）');

console.log('\n========== 第六十六波 · 斗法台台下赌盘 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
