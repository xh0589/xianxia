/**
 * v20.65-plane-gate-node.js — 位面闸门补漏（地区列表「前往」白屏修复）：
 *   G1 拦下不白屏：旧版 travelToCityFromList 先扣时间精力、先藏地图面板、再调 enterCity，
 *      境界被拦下时玩家对着一片空白还收到「来到了XX」的假成功；现在先进城后结账，
 *      被拦下就原样返回（不扣账、不藏面板、不谎报抵达）。
 *   G2 位面不接脚力：灵界/魔界从地区列表「前往」直接进城是后门（元婴+白省 80 真气渡界账），
 *      现在指路位面之门。
 *   G3 传送阵不上界外坐标：旧版只查 accessLevel，元婴+花 100 灵石仍能传进位面；
 *      现在位面坐标不上阵盘，列表也不再显示。
 *   G4 疆界兜底不漏位面：world-map setOut「不知身在何方」的兜底旧版会直开位面野外图；
 *      位面住客出门探野照常放行。
 *
 * 运行：node tests/v20.65-plane-gate-node.js
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
function makeEl() {
    return {
        style: {}, id: '', className: '', innerHTML: '', textContent: '',
        classList: { add: function () {}, remove: function () {}, contains: function () { return false; } },
        appendChild: function () {}, removeChild: function () {},
        setAttribute: function () {}, getAttribute: function () { return null; },
        addEventListener: function () {}, removeEventListener: function () {},
        querySelector: function () { return null; },
        querySelectorAll: function () { return []; },
        scrollIntoView: function () {}
    };
}
global.document = {
    getElementById: function () { return null; },
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
    createElement: function () { return makeEl(); },
    createElementNS: function () { return makeEl(); },
    addEventListener: function () {},
    removeEventListener: function () {},
    body: makeEl(),
    readyState: 'complete'
};
global.localStorage = { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} };
global.alert = function () {};
var messages = [];
global.showMessage = function (m, t) { messages.push({ msg: String(m), type: t || 'info' }); };
function hasMsg(kw) { return messages.some(function (m) { return m.msg.indexOf(kw) >= 0; }); }
var timeCalls = [];
global.timeSystem = { advanceTime: function (m, r) { timeCalls.push({ m: m, r: r }); }, onNewDaySubscribe: function () {} };
global.EventBus = { emit: function () {} };
global.updateCharacterStatus = function () {};

load('js/regions.js');
load('js/location-system.js');
load('js/map/high-planes.js');
load('js/map/world-map.js');

// app.js 太重不整载——把涉事函数抠出来真跑（与浏览器同一份源码）
var appSrc = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
function extractFn(name) {
    var i = appSrc.indexOf('function ' + name + '(');
    if (i < 0) { assert(false, 'app.js 里应能抠出函数：' + name); return ''; }
    var j = appSrc.indexOf('{', i), d = 0, k = j;
    for (; k < appSrc.length; k++) {
        var c = appSrc[k];
        if (c === '{') d++;
        else if (c === '}') { d--; if (d === 0) break; }
    }
    return appSrc.slice(i, k + 1);
}
var fnTravel = extractFn('travelToCityFromList');
var fnTeleport = extractFn('teleportToCity');
var fnTeleportUI = extractFn('showTeleportUI');
vm.runInThisContext(fnTravel);
vm.runInThisContext(fnTeleport);
vm.runInThisContext(fnTeleportUI);

global.currentCharData = {
    name: '测试', realm: '金丹', layer: 1, qi: 200, energy: 100, health: 100,
    location: '帝都·长安', spiritStones: 1000
};

// ==================== G1/G2 地区列表「前往」 ====================
console.log('\n[G1/G2] 地区列表「前往」');
global.locationSystem.enterCity('帝都·长安');

// 位面城：金丹点「前往」灵界——指路位面之门，不扣账不谎报
messages.length = 0; timeCalls.length = 0;
global.travelToCityFromList('灵界·蓬莱仙境', '灵界');
assert(hasMsg('位面之门'), '位面城点「前往」该指路位面之门');
assert(!hasMsg('来到了'), '位面城被拦下不该有「来到了」假成功');
assert(timeCalls.length === 0, '被拦下不扣时间');
assert(global.currentCharData.energy === 100, '被拦下不扣精力');
assert(global.locationSystem.getCurrentLocation() !== '灵界·蓬莱仙境', '被拦下人没进位面');

// 元婴+从列表直进位面也是后门（白省 80 真气渡界账）——一样拦
global.currentCharData.realm = '元婴';
messages.length = 0; timeCalls.length = 0;
var qiBefore = global.currentCharData.qi;
global.travelToCityFromList('灵界·蓬莱仙境', '灵界');
assert(global.locationSystem.getCurrentLocation() !== '灵界·蓬莱仙境', '元婴也不能从列表白走进位面');
assert(global.currentCharData.qi === qiBefore, '列表「前往」不结渡界账，也就不该扣真气');
assert(hasMsg('位面之门'), '元婴点位面城一样指路位面之门');

// 人间门槛城（东海龙宫·金丹以上）：金丹可进
messages.length = 0; timeCalls.length = 0;
global.travelToCityFromList('东海龙宫', '东荒');
assert(global.locationSystem.getCurrentLocation() === '东海龙宫', '金丹进得了东海龙宫');
assert(hasMsg('来到了东海龙宫'), '进成了才报抵达');
assert(timeCalls.some(function (x) { return x.m === 30; }), '进成了才结 30 分钟脚程');
assert(global.currentCharData.energy === 95, '进成了才扣 5 点精力');

// 炼气点「前往」东海龙宫：拦下，不白屏不假成功
global.currentCharData.realm = '炼气';
global.currentCharData.energy = 100;
global.locationSystem.enterCity('洛水城');
messages.length = 0; timeCalls.length = 0;
global.travelToCityFromList('东海龙宫', '东荒');
assert(hasMsg('境界不足'), '门槛城被拦下时报境界不足');
assert(!hasMsg('来到了'), '门槛城被拦下不该有「来到了」假成功');
assert(timeCalls.length === 0, '门槛城被拦下不扣时间');
assert(global.currentCharData.energy === 100, '门槛城被拦下不扣精力');
assert(global.locationSystem.getCurrentLocation() === '洛水城', '被拦下人留在原地');

// 无门槛城照常
messages.length = 0; timeCalls.length = 0;
global.travelToCityFromList('洛水城', '中州');
assert(global.locationSystem.getCurrentLocation() === '洛水城' && hasMsg('来到了洛水城'), '无门槛城照常进');

// ==================== G1b 门槛解析（「XX以上」旧版恒放行） ====================
console.log('\n[G1b] 门槛解析');
var chk = global.locationSystem.checkAccessRequirement;
assert(chk('金丹以上', '炼气', 1) === false, '「金丹以上」该拦住炼气');
assert(chk('金丹以上', '金丹', 1) === true, '「金丹以上」含金丹本境');
assert(chk('筑基以上', '筑基', 3) === true, '「筑基以上」放筑基');
assert(chk('筑基以上', '炼气', 9) === false, '「筑基以上」拦炼气九层');
assert(chk('炼气三层以上', '炼气', 1) === false, '「炼气三层以上」拦炼气一层');
assert(chk('炼气三层以上', '炼气', 3) === true, '「炼气三层以上」放炼气三层');
assert(chk('元婴', '金丹', 9) === false, '「元婴」拦金丹（位面口径不回退）');
assert(chk('元婴', '元婴', 1) === true, '「元婴」放元婴');
assert(chk('化神', '化神', 1) === true, '「化神」放化神');
assert(chk('all', '炼气', 1) === true, '「all」恒放行');
assert(chk('贵宾许可', '炼气', 1) === true, '认不出的门槛字样放行不锁人');

// ==================== G3 传送阵 ====================
console.log('\n[G3] 传送阵不上界外坐标');
global.currentCharData.realm = '元婴';
global.currentCharData.spiritStones = 1000;
messages.length = 0; timeCalls.length = 0;
global.teleportToCity('灵界·蓬莱仙境');
assert(hasMsg('位面之门'), '传送去位面该指路位面之门');
assert(global.currentCharData.spiritStones === 1000, '传送被拦下不扣灵石');
assert(global.locationSystem.getCurrentLocation() !== '灵界·蓬莱仙境', '传送被拦下人没进位面');
assert(timeCalls.length === 0, '传送被拦下不推时间');

var teleHtml = '';
global.showBuildingEffectDialog = function (title, h) { teleHtml = h; };
global.showTeleportUI();
assert(teleHtml.indexOf('灵界·') < 0 && teleHtml.indexOf('魔界·') < 0, '传送列表不再显示位面地点');
assert(teleHtml.indexOf('帝都·长安') >= 0, '传送列表人间城镇照常');

// ==================== G4 疆界兜底 ====================
console.log('\n[G4] 疆界兜底不漏位面');
var opened = [];
global.openWildernessMap = function (r) { opened.push(r); };

// 人间住客点位面野外：拦下且不开图
global.currentCharData.location = '帝都·长安';
messages.length = 0; opened.length = 0;
var r1 = global.WorldMap.setOut('灵界');
assert(r1 === false && opened.length === 0, '人间住客脚力到不了灵界野外');
assert(hasMsg('位面之门'), '拦下时指路位面之门');

// 位面住客出门探野：放行
global.locationSystem.enterCity('灵界·蓬莱仙境');
messages.length = 0; opened.length = 0;
var r2 = global.WorldMap.setOut('灵界');
assert(r2 === true && opened.indexOf('灵界') >= 0, '位面住客出得了自家野外');

// 不知身在何方的兜底：也不能直开位面
var origGet = global.locationSystem.getCurrentLocation;
global.locationSystem.getCurrentLocation = function () { return null; };
global.currentCharData.location = '';
messages.length = 0; opened.length = 0;
var r3 = global.WorldMap.setOut('魔界');
assert(r3 === false && opened.length === 0, '位置不明的兜底不该直开位面野外图');
global.locationSystem.getCurrentLocation = origGet;

// 跨境照常（中州 → 东荒）
global.locationSystem.enterCity('帝都·长安');
global.currentCharData.location = '帝都·长安';
global.currentCharData.energy = 100;
opened.length = 0;
var r4 = global.WorldMap.setOut('东荒');
assert(r4 === true && opened.indexOf('东荒') >= 0, '人间跨境照常走疆界账');

// ==================== G5 源码哨兵 ====================
console.log('\n[G5] 源码哨兵');
assert(fnTravel.indexOf('getPlaneOf') >= 0, 'travelToCityFromList 带位面闸门');
assert(fnTravel.indexOf('enterCity(cityName)') < fnTravel.indexOf('advanceTime'), '先进城后结账（enterCity 在 advanceTime 之前）');
assert(fnTeleport.indexOf('getPlaneOf') >= 0, 'teleportToCity 带位面闸门');
assert(fnTeleportUI.indexOf('getPlaneOf') >= 0, 'showTeleportUI 过滤位面地点');
var wmSrc = fs.readFileSync(path.join(ROOT, 'js/map/world-map.js'), 'utf8');
var setOutSrc = wmSrc.slice(wmSrc.indexOf('function setOut'));
assert(setOutSrc.indexOf('isPlane(target)') < setOutSrc.indexOf('if (!from)'), '位面闸门前置于「位置不明」兜底');

console.log('\n========== 结果：' + passed + ' 通过 / ' + failed + ' 失败 ==========');
process.exit(failed ? 1 : 0);
