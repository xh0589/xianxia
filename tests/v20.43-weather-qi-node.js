/**
 * v20.43-weather-qi-node.js — 天象与灵气咬合验收：
 * 天时合地灵则灵气共鸣+10%（读真账不编造）；天象播报有味不复读；
 * 枯竭警示有纪律（跌破一档报一次，回春再报，不刷屏）。
 * 加载顺序与线上一致：qi-environment 先，weather-effects 后。
 *
 * 运行：node tests/v20.43-weather-qi-node.js
 */
'use strict';

var path = require('path');
var fs = require('fs');
var vm = require('vm');

var passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) passed++;
    else { failed++; console.error('[FAIL] ' + msg); }
}
function loadScript(rel) { return fs.readFileSync(path.resolve(__dirname, '..', rel), 'utf8'); }

function makeWorld() {
    var msgs = [];
    var w = {
        console: { log: function () {}, warn: function () {}, error: function () {} },
        JSON: JSON, Object: Object, Array: Array, Math: Math, Number: Number, String: String,
        Boolean: Boolean, isFinite: isFinite,
        document: {
            getElementById: function () { return null; },
            createElement: function () { return { style: {}, className: '' }; },
            body: { appendChild: function () {} }
        },
        setTimeout: function () {},
        showMessage: function (m) { msgs.push(String(m)); },
        currentCharData: { location: '蓬莱仙岛' },
        __msgs: msgs
    };
    w.window = w;
    var ctx = vm.createContext(w);
    vm.runInContext(loadScript('js/qi-environment.js'), ctx);   // 线上顺序：灵气先
    vm.runInContext(loadScript('js/weather-effects.js'), ctx);  // 天气后
    return w;
}

// ============ Q 天时地灵共鸣 ============
var W1 = makeWorld();
W1.updateWeather('rainy'); // 雨天属水
assert(Math.abs(W1.getQiConcentration('蓬莱仙岛') - 2.2) < 1e-9,
    'Q1 雨天临海岛——天时合地灵，灵气 2.0×1.1 共鸣（读真账，不编造）');
W1.updateWeather('sunny'); // 晴属火
assert(Math.abs(W1.getQiConcentration('蓬莱仙岛') - 2.0) < 1e-9,
    'Q2 火天临水地——天时不合，共鸣不起，灵气原样');
W1.updateWeather('rainy');
assert(Math.abs(W1.getQiConcentration('帝都·长安') - 1.0) < 1e-9,
    'Q3 混杂之地不与天时共鸣——长安红尘，灵气本杂');
assert(W1.getWeatherQiResonance('water') === 1.1 && W1.getWeatherQiResonance('fire') === 1.0
    && W1.getWeatherQiResonance('mixed') === 1.0 && W1.getWeatherQiResonance('') === 1.0,
    'Q4 共鸣判断本身：合则 1.1，不合/无属/混杂皆 1.0');
W1.updateWeather('snowy');
assert(W1.getCurrentWeather().name === '下雪' && W1.getWeatherQiResonance('water') === 1.1,
    'Q5 天象可钦定（剧情/测试用）——雪亦属水，海岛共鸣');

// ============ Q 天象有味 ============
var W2 = makeWorld();
W2.updateWeather('stormy');
var m2 = W2.__msgs.join('');
assert(m2.indexOf('雷雨') >= 0 && m2.indexOf('——') >= 0,
    'Q6 天象播报带味——不再是干巴巴一句"今日天气"');
var W3 = makeWorld();
W3.updateWeather('foggy');
assert(W3.__msgs.join('').indexOf('雾') >= 0 && W3.__msgs.join('').indexOf('——') >= 0,
    'Q7 各天象各有说法——雾有雾的讲法');

// ============ D 枯竭警示纪律 ============
var W4 = makeWorld();
W4.depleteQi(80); // 100 → 20，跌破 30
assert(W4.__msgs.length === 1 && W4.__msgs[0].indexOf('枯竭') >= 0,
    'D1 灵气跌破一档——报一次');
W4.depleteQi(1);
W4.depleteQi(1);
assert(W4.__msgs.length === 1,
    'D2 档内不刷屏——灾讯一次就够，天天喊就成了噪音');
W4.restoreWorldQi(80); // 18 → 98，跨过 30 回春
assert(W4.__msgs.length === 2 && W4.__msgs[1].indexOf('回春') >= 0,
    'D3 灵气回春——再报一次好消息');
W4.depleteQi(80); // 再跌破
assert(W4.__msgs.length === 3, 'D4 警示清旗后再跌破，重新作数——随账走，不是一次性');
assert(W4.globalQiLevel >= 0 && W4.globalQiLevel <= 100, 'D5 世界灵气有界——0~100 钳位');

// ============ G 接线纪律 ============
var wsrc = loadScript('js/weather-effects.js');
var qsrc = loadScript('js/qi-environment.js');
assert(wsrc.indexOf("window.getWeatherQiResonance = getWeatherQiResonance") >= 0
    && qsrc.indexOf('window.getWeatherQiResonance') >= 0,
    'G1 共鸣桥两头接上——天气出判断，灵气读判断');
assert(['sunny','cloudy','rainy','stormy','snowy','windy','foggy'].every(function (id) {
    var line = wsrc.split('\n').find(function (l) { return l.indexOf("id: '" + id + "'") >= 0; });
    return line && line.indexOf('qiElement') >= 0;
}), 'G2 七种天象皆带五行属性——共鸣有真源');

console.log('---');
console.log('v20.43 weather-qi: ' + passed + ' 通过, ' + failed + ' 失败');
process.exit(failed ? 1 : 0);
