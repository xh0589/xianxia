/**
 * v20.53-planes-node.js — 高位面做实验收：
 *   P1 地点真源：灵界/魔界四地进了 cityData（此前 enterPlane 只改一个野字符串，城市面板打不开）
 *   P2 跨界走 enterCity：currentLocation/visited/事件同步，境界不够进不去，真气白扣会退回
 *   P3 回程与界内移动：记下人间落脚点，渡回不迷路；御剑劈不开界膜
 *   P4 位面营生：采撷得位面材（真气/时间照扣）、探幽出真强敌（不再按玩家 layer 重掷）
 *   P5 位面灵气：灵界/魔界灵气浓度进表（此前落 default 0.8，比人间还稀薄）
 *   P6 位面日结：灵界灵机涤尘回真气，魔界浊气蚀体扣真气
 *   P7 高阶灵兽：人间名册到元婴就断，位面兽补上高阶档且只在自家位面出没
 *   P8 主线接通：灵界魔气/魔仙决战有接取路径，决战挂在魔界探幽上
 *   P9 挂载哨兵：位面之门入口、旅程屏障、寿元出口接线在案
 *
 * 运行：node tests/v20.53-planes-node.js
 */
'use strict';

var fs = require('fs');
var vm = require('vm');
var path = require('path');
var ROOT = path.resolve(__dirname, '..');

var passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) passed++;
    else { failed++; console.error('[FAIL] ' + msg); }
}
function load(rel) {
    vm.runInThisContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), { filename: rel });
}

global.window = global;
global.document = {
    getElementById: function () { return null; },
    querySelectorAll: function () { return []; },
    addEventListener: function () {},
    removeEventListener: function () {},
    readyState: 'complete'
};
global.localStorage = { getItem: function () { return null; }, setItem: function () {} };
global.alert = function () {};
var messages = [];
global.showMessage = function (m, t) { messages.push({ msg: m, type: t }); };
var emitted = [];
global.EventBus = { emit: function (e, d) { emitted.push({ e: e, d: d }); } };
var battles = [];
var timeCalls = [];
global.timeSystem = {
    advanceTime: function (m, r) { timeCalls.push({ m: m, r: r }); },
    onNewDaySubscribe: function (fn) { global.__planeDayHook = fn; }
};

// ==================== P1 地点真源 ====================
console.log('\n[P1] 地点真源');
load('js/regions.js');
load('js/location-system.js');
load('js/qi-environment.js');
load('js/map/high-planes.js');

var LS = global.locationSystem;
assert(!!LS, 'locationSystem 已挂载');
var planeCities = ['灵界·蓬莱仙境', '灵界·九天罡风带', '魔界·九幽深渊', '魔界·血海荒原'];
planeCities.forEach(function (name) {
    var d = LS.getCityData(name);
    assert('地点入真源：' + name, !!d && !!d.desc && Array.isArray(d.buildings) && d.buildings.length > 0);
});
assert('灵界区域入地图（可反查区划）', global.mapData['灵界'] && global.mapData['灵界'].cities.length === 2);
assert('魔界区域入地图', global.mapData['魔界'] && global.mapData['魔界'].cities.length === 2);
assert('境界闸门交给 accessLevel（元婴/化神）',
    LS.getCityAccessLevel('灵界·蓬莱仙境') === '元婴' && LS.getCityAccessLevel('魔界·九幽深渊') === '化神');
assert('位面物价成账（仙材在灵界卖得贵）', LS.getCityPriceModifier('灵界·蓬莱仙境', 'sell') > 1.5);

// ==================== P2 跨界走 enterCity ====================
console.log('\n[P2] 跨界走 enterCity');
global.currentCharData = { name: '测试', realm: '元婴', layer: 1, qi: 200, location: '帝都·长安', health: 100, maxHealth: 100 };
assert('元婴可渡灵界', global.enterPlane('灵界') === true);
assert('落点进位面地点', global.locationSystem.getCurrentLocation() === '灵界·蓬莱仙境');
assert('角色位置同步（不再是野字符串）', global.currentCharData.location === '灵界·蓬莱仙境');
assert('跨界发 location:visited（任务可推进）', emitted.some(function (x) { return x.e === 'location:visited'; }));
assert('跨界真气照扣 80', global.currentCharData.qi === 120);
assert('跨界耗时 120 分钟入账', timeCalls.some(function (x) { return x.m === 120; }));

// 真气不足：白扣要退回
emitted.length = 0;
global.currentCharData.qi = 30;
assert('真气不足渡不了界', global.enterPlane('魔界') === false);
assert('没扣真气', global.currentCharData.qi === 30);

// 化神以下进不了魔界
global.currentCharData.realm = '元婴'; global.currentCharData.qi = 500;
assert('元婴进不了魔界', global.enterPlane('魔界') === false);

// ==================== P3 回程与界内移动 ====================
console.log('\n[P3] 回程与界内移动');
assert('界内移动到罡风带', global.planeTravel('灵界·九天罡风带') === true);
assert('落点已换', global.locationSystem.getCurrentLocation() === '灵界·九天罡风带');
assert('渡回人间落在来时城', global.returnToMortal() === true);
assert('回到帝都·长安', global.locationSystem.getCurrentLocation() === '帝都·长安');
assert('御剑飞不进位面', global.flyTravel('灵界·蓬莱仙境') === false);
assert('御剑在位面内也飞不出去', (function () {
    global.enterPlane('灵界');
    var r = global.flyTravel('帝都·长安');
    global.returnToMortal();
    return r === false;
})());

// ==================== P4 位面营生 ====================
console.log('\n[P4] 位面营生');
var added = [];
global.addItem = function (id, n) { added.push({ id: id, n: n }); };
global.startBattle = function (e) { battles.push(e); };
global.enterPlane('灵界');
var qiBefore = global.currentCharData.qi;
assert('仙田采撷有收成', global.planeGather('灵界') === true);
assert('采撷真气照扣', global.currentCharData.qi < qiBefore);
assert('采撷拿到的是灵界材', added.length > 0 && added.every(function (x) { return typeof x.id === 'string'; }));
assert('人间没有仙田', global.returnToMortal() === true && global.planeGather('灵界') === false);

// 探幽：强敌档位写死，不随玩家 layer 重掷
global.enterPlane('魔界');
battles.length = 0;
var gotEnemy = null;
for (var i = 0; i < 60 && !gotEnemy; i++) {
    global.planeExplore();
    if (battles.length) gotEnemy = battles[battles.length - 1];
}
assert('魔界探幽能遇上强敌', !!gotEnemy);
assert('强敌档位是真化神级（等级 ≥60，不按玩家 layer 重掷）', !!gotEnemy && Number(gotEnemy.level) >= 60);
assert('强敌名字来自位面（魔物/魔修）', !!gotEnemy && (gotEnemy.name === '血原魔物' || gotEnemy.name === '夺食魔修'));

// ==================== P5 位面灵气 ====================
console.log('\n[P5] 位面灵气');
assert('灵界灵气入表（4.5，非 default 0.8）', global.getQiConcentration('灵界·蓬莱仙境') > 4);
assert('魔界浊气入表（3.6）', global.getQiConcentration('魔界·九幽深渊') > 3);
assert('无 account 地点仍走 default', global.getQiConcentration('查无此地') < 1);

// ==================== P6 位面日结 ====================
console.log('\n[P6] 位面日结');
assert('新日钩子已注册', typeof global.__planeDayHook === 'function');
global.currentCharData.location = '灵界·蓬莱仙境';
global.currentCharData.qi = 50;
global.currentCharData.maxQi = 200;
global.getEffectiveMax = function () { return 200; };
var qi0 = global.currentCharData.qi;
global.__planeDayHook();
assert('灵界灵机涤尘回真气（' + qi0 + ' → ' + global.currentCharData.qi + '）', global.currentCharData.qi > qi0);
global.currentCharData.location = '魔界·血海荒原';
global.currentCharData.qi = 100;
global.__planeDayHook();
assert('魔界浊气蚀体扣真气（100 → ' + global.currentCharData.qi + '）', global.currentCharData.qi === 85);
global.currentCharData.location = '帝都·长安';
global.currentCharData.qi = 100;
global.__planeDayHook();
assert('人间不受位面日结影响', global.currentCharData.qi === 100);

// ==================== P7 高阶灵兽 ====================
console.log('\n[P7] 高阶灵兽');
load('js/beast-taming.js');
var planeBeasts = ['cloud_horn_deer', 'gangwind_crane', 'bloodmare_hound', 'nethervein_serpent'];
assert('位面灵兽入册（四只）', planeBeasts.every(function (id) { return global.BEAST_TEMPLATES[id]; }));
assert('位面兽最高到炼虚档（人间名册到元婴就断）',
    global.BEAST_TEMPLATES.nethervein_serpent.realm === '炼虚');
assert('位面兽只在自家位面出没',
    global.canCaptureInCurrentLocation('cloud_horn_deer') === false);
global.currentCharData.location = '灵界·蓬莱仙境';
assert('到灵界就能遇上云角鹿', global.canCaptureInCurrentLocation('cloud_horn_deer') === true);
assert('灵界遇不上魔界犬', global.canCaptureInCurrentLocation('bloodmare_hound') === false);

// ==================== P8 主线接通 ====================
console.log('\n[P8] 主线接通');
var arc = load('js/quest/main-storyline-arc.js');
var src = fs.readFileSync(path.join(ROOT, 'js/quest/main-storyline-arc.js'), 'utf8');
assert('主线第三章不再指向不存在的天界', src.indexOf("location: '天界'") < 0);
assert('主线第三章改指灵界', src.indexOf("location: '灵界'") >= 0);
assert('接取链覆盖四章（008/009 不再悬空）',
    src.indexOf("'main_006', 'main_007', 'main_008', 'main_009'") >= 0);
var qsrc = fs.readFileSync(path.join(ROOT, 'js/quest/quest-system.js'), 'utf8');
assert('visit 目标支持地域前缀匹配（灵界 → 灵界·蓬莱仙境）',
    qsrc.indexOf("data.locationName.indexOf(obj.location) === 0") >= 0);

// ==================== P9 挂载哨兵 ====================
console.log('\n[P9] 挂载哨兵');
var hp = fs.readFileSync(path.join(ROOT, 'js/map/high-planes.js'), 'utf8');
assert('跨界改走 enterCity（不再裸写 location）',
    hp.indexOf('locationSystem.enterCity(target)') >= 0 && hp.indexOf('cd.location = plane') < 0);
assert('渡回人间有实现', hp.indexOf('function returnToMortal') >= 0);
assert('位面之门面板有实现', hp.indexOf('function openPlanePanel') >= 0);
var cult = fs.readFileSync(path.join(ROOT, 'js/cultivation/cultivation.js'), 'utf8');
assert('修行界面接线位面之门', cult.indexOf('window.openPlanePanel()') >= 0);
var travel = fs.readFileSync(path.join(ROOT, 'js/travel-system.js'), 'utf8');
assert('旅程屏障：跨界不许用脚走', travel.indexOf('getPlaneOf') >= 0);
var life = fs.readFileSync(path.join(ROOT, 'js/lifespan-system.js'), 'utf8');
assert('寿元出口已挂（血池淬体要还的）', life.indexOf('function spendLifespan') >= 0);
var loc = fs.readFileSync(path.join(ROOT, 'js/location-system.js'), 'utf8');
assert('位面特色功能已入开关（仙田/魔材矿脉/魔功阁/血池）',
    loc.indexOf("'仙田'") >= 0 && loc.indexOf("'魔材矿脉'") >= 0 && loc.indexOf("'魔功阁'") >= 0 && loc.indexOf("'血池'") >= 0);

// ==================== P10 传送阵不绕闸 ====================
console.log('\n[P10] 传送阵不绕闸');
var appSrc = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
assert('传送阵入口带境界闸（位面地点不因花钱而失效）',
    appSrc.indexOf('window.locationSystem.checkAccessRequirement') >= 0);
assert('checkAccessRequirement 已导出（闸门真能被调用）',
    fs.readFileSync(path.join(ROOT, 'js/location-system.js'), 'utf8').indexOf('checkAccessRequirement,') >= 0);
assert('渡界落脚点入存档白名单',
    fs.readFileSync(path.join(ROOT, 'js/core/game-state.js'), 'utf8').indexOf('mortalOrigin:') >= 0 &&
    fs.readFileSync(path.join(ROOT, 'js/core/game-state.js'), 'utf8').indexOf('_mortalOrigin: saveData.mortalOrigin') >= 0);

console.log('\n========== 结果：' + passed + ' 通过 / ' + failed + ' 失败 ==========');
process.exit(failed ? 1 : 0);
