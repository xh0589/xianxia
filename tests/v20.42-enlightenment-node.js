/**
 * v20.42-enlightenment-node.js — 悟道树做深验收：
 * 平铺+5 → 真树（二层结构+前置门槛）；功能节点有牙（突破+5%、悟道点+1）；
 * 面板挂锁；领悟随档走（白名单进出成对）。
 *
 * 运行：node tests/v20.42-enlightenment-node.js
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

function makeWorld(points) {
    var msgs = [];
    var w = {
        console: { log: function () {}, warn: function () {}, error: function () {} },
        JSON: JSON, Object: Object, Array: Array, Math: Math, Number: Number, String: String,
        currentCharData: {},
        insightPoints: points != null ? points : 100,
        showMessage: function (m) { msgs.push(String(m)); },
        updateInsightUI: function () {}, updateCharacterStatus: function () {},
        __msgs: msgs
    };
    w.window = w;
    var ctx = vm.createContext(w);
    vm.runInContext(loadScript('js/cultivation/enlightenment-tree.js'), ctx);
    return w;
}

// ============ E 基础领悟 ============
var W1 = makeWorld(50);
assert(W1.enlightenNode('physique') === true && W1.insightPoints === 45
    && W1.getEnlightenmentBonus().constitution === 5,
    'E1 基础节点：体魄强化扣 5 点，体质+5 永久落账');
assert(W1.enlightenNode('physique') === false, 'E2 领悟不复购——同一节点只悟一次');
assert(W1.enlightenNode('nope') === false, 'E3 无此节点不扣账');
var W1b = makeWorld(2);
assert(W1b.enlightenNode('physique') === false && W1b.insightPoints === 2
    && W1b.__msgs.join('').indexOf('悟道点不足') >= 0,
    'E4 点数不足不扣账——价是硬的');

// ============ E 前置门槛：树的枝干从根上长 ============
var W2 = makeWorld(100);
assert(W2.enlightenNode('insight_break') === false
    && W2.__msgs.join('').indexOf('道心初固') >= 0,
    'E5 悟破境关需道心底子——前置未悟，挂锁说缘由');
assert(W2.enlightenNode('profound') === false
    && W2.__msgs.join('').indexOf('任意 3 脉') >= 0,
    'E6 道心通明需悟透三脉——顶层不是花钱就够');
W2.enlightenNode('will');
assert(W2.enlightenNode('insight_break') === true, 'E7 道心初固既悟，悟破境关开门');
W2.enlightenNode('physique');
W2.enlightenNode('perception');
assert(W2.enlightenNode('profound') === true
    && W2.getEnlightenmentBonus().strength === 5 && W2.getEnlightenmentBonus().meridian === 5,
    'E8 三脉悟透，道心通明——六维+5 全落账');

// ============ E 功能节点有牙 ============
var W3 = makeWorld(100);
assert(W3.getEnlightenmentFlag('breakthrough') === false && W3.getInsightGainBonus() === 0,
    'E9 未悟功能节点——突破不加稳、悟道不多得');
W3.enlightenNode('will');
W3.enlightenNode('insight_break');
W3.enlightenNode('physique');
W3.enlightenNode('insight_meditation');
assert(W3.getEnlightenmentFlag('breakthrough') === true, 'E10 悟破境关：突破成功率+5% 的旗立起来');
assert(W3.getInsightGainBonus() === 1, 'E11 静功生慧：突破所得悟道点+1');

// ============ G 存档纪律与接线 ============
var gs = loadScript('js/core/game-state.js');
assert(gs.indexOf('enlightenedNodes: Array.isArray(charData._enlightenedNodes)') >= 0
    && gs.indexOf('_enlightenedNodes: Array.isArray(saveData.enlightenedNodes)') >= 0,
    'G1 领悟入白名单——存读档不再把一棵悟过的树清零');
var cul = loadScript('js/cultivation/cultivation.js');
assert(cul.indexOf("getEnlightenmentFlag('breakthrough')") >= 0
    && cul.indexOf('getInsightGainBonus') >= 0,
    'G2 两个功能节点真接进突破流程——成功率与悟道点都读得到旗');
assert(cul.indexOf('getEnlightenmentLockReason') >= 0 && cul.indexOf('🔒') >= 0,
    'G3 面板挂锁——锁着的节点看得见锁与缘由');

console.log('---');
console.log('v20.42 enlightenment: ' + passed + ' 通过, ' + failed + ' 失败');
process.exit(failed ? 1 : 0);
