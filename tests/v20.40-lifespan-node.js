/**
 * v20.40-lifespan-node.js — 寿元做深验收：
 * 历法对齐世界历（360 日一年）；凶兆四档各报一次（一年/百日/三十/十日）；
 * 延寿两途（突破抬上限/延寿丹接线既有）；大限只落幕一次；暮年衰老罚分档。
 *
 * 运行：node tests/v20.40-lifespan-node.js
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
    var msgs = [], appended = [];
    var displayEl = { innerHTML: '', style: {} };
    var w = {
        console: { log: function () {}, warn: function () {}, error: function () {} },
        JSON: JSON, Object: Object, Array: Array, Math: Math, Number: Number,
        String: String, Boolean: Boolean, isFinite: isFinite,
        document: {
            getElementById: function (id) { return id === 'lifespan-display' ? displayEl : null; },
            createElement: function () { return { style: {}, innerHTML: '' }; },
            body: { appendChild: function (m) { appended.push(m); } },
            addEventListener: function () {}
        },
        localStorage: { getItem: function () { return null; }, setItem: function () {} },
        showMessage: function (m) { msgs.push(String(m)); },
        __msgs: msgs, __appended: appended, __displayEl: displayEl
    };
    w.window = w;
    var ctx = vm.createContext(w);
    vm.runInContext(loadScript('js/lifespan-system.js'), ctx);
    return w;
}

// ============ L1 历法口径 ============
var W1 = makeWorld();
var p1 = W1.playerLifespan;
var age0 = p1.currentAge;
W1.updatePlayerLifespan(360);
assert(Math.abs((p1.currentAge - age0) - 1) < 1e-9
    && Math.abs(p1.remainingDays - (p1.maxAge - p1.currentAge) * 360) < 1e-6,
    'L1 世界历 360 日一年——走 360 日长一岁，余日同尺（不再按 365 偷跑）');
var src = loadScript('js/lifespan-system.js');
assert(src.indexOf('/ 365') < 0 && src.indexOf('* 365') < 0,
    'L1b 全文件无 365 残留——节日账与寿元账同一把尺');

// ============ L2 凶兆四档，各报一次 ============
var W2 = makeWorld();
var p2 = W2.playerLifespan;
p2.maxAge = 100; p2.currentAge = 96.9; p2.remainingDays = (100 - 96.9) * 360;
W2.updatePlayerLifespan(0);
assert(W2.__msgs.length === 0, 'L2a 余年尚多——凶兆不扰人');
p2.currentAge = 99.0; // 余 360 日
W2.updatePlayerLifespan(0);
assert(W2.__msgs.length === 1 && W2.__msgs[0].indexOf('不足一年') >= 0, 'L2b 余一年：第一道凶兆');
p2.currentAge = 99.75; // 余 90 日
W2.updatePlayerLifespan(0);
assert(W2.__msgs.length === 2 && W2.__msgs[1].indexOf('不足百日') >= 0, 'L2c 余百日：第二道凶兆');
p2.currentAge = 99.95; // 余 18 日
W2.updatePlayerLifespan(0);
assert(W2.__msgs.length === 3 && W2.__msgs[2].indexOf('不足三十日') >= 0, 'L2d 余三十日：第三道凶兆');
p2.currentAge = 99.98; // 余 7.2 日
W2.updatePlayerLifespan(0);
assert(W2.__msgs.length === 4 && W2.__msgs[3].indexOf('不足十日') >= 0, 'L2e 余十日：最后一道凶兆');
var n = W2.__msgs.length;
W2.updatePlayerLifespan(0);
assert(W2.__msgs.length === n, 'L2f 各档只报一次——死讯不刷屏，暮年一步步暗下去');

// ============ L3 延寿途 ============
var W3 = makeWorld();
var p3 = W3.playerLifespan;
var max0 = p3.maxAge;
assert(W3.extendLifespan(50, '延寿丹') === true && p3.maxAge === max0 + 50
    && W3.__msgs.join('').indexOf('延寿丹') >= 0,
    'L3 延寿丹一路：上限抬 50 年，来路标在话里（普通服用由物品效果接线，大限弹窗亦可用）');
p3.currentAge = 60;
W3.increaseLifespanOnBreakthrough('金丹');
assert(p3.maxAge === 500 && W3.__msgs.join('').indexOf('金丹') >= 0,
    'L3b 突破一路：金丹寿元 500 年抬上限——修行的甜头是真的');

// ============ L4 大限只落幕一次 ============
var W4 = makeWorld();
var p4 = W4.playerLifespan;
p4.maxAge = 100; p4.currentAge = 100;
W4.updatePlayerLifespan(0);
assert(W4.__appended.length === 1, 'L4 寿元尽时落幕弹窗——三途（延寿丹/二周目/接受）摆在面前');
W4.updatePlayerLifespan(0);
assert(W4.__appended.length === 1 && W4.__msgs.join('').indexOf('寿元已尽') >= 0,
    'L4b 落幕只一次——第二声只剩提醒，不重弹');

// ============ L5 永生与衰老罚 ============
var W5 = makeWorld();
var p5 = W5.playerLifespan;
p5.isImmortal = true;
var age5 = p5.currentAge;
W5.updatePlayerLifespan(360);
assert(p5.currentAge === age5 && W5.getAgePenaltyMultiplier() === 1.0,
    'L5 永生者不受寿账管——日子不添岁，战力不打折');
var W6 = makeWorld();
var p6 = W6.playerLifespan;
p6.maxAge = 100;
p6.currentAge = 85; W6.updatePlayerLifespan(0);
assert(Math.abs(W6.getAgePenaltyMultiplier() - 0.92) < 1e-9, 'L5b 八旬：战力九二（衰老是渐进的账）');
p6.currentAge = 95; W6.updatePlayerLifespan(0);
assert(Math.abs(W6.getAgePenaltyMultiplier() - 0.85) < 1e-9, 'L5c 九旬：战力八五');

// ============ L6 将死之相上脸 ============
var W7 = makeWorld();
var p7 = W7.playerLifespan;
p7.maxAge = 100; p7.currentAge = 99.95;
W7.updatePlayerLifespan(0);
assert(W7.__displayEl.style.color === '#f87171', 'L6 三十日内寿元——面板红给你看');
p7.currentAge = 99.5; // 余 180 日，一年档内
W7.updatePlayerLifespan(0);
assert(W7.__displayEl.style.color === '#fbbf24', 'L6b 一年内寿元——面板先黄再红');

console.log('---');
console.log('v20.40 lifespan: ' + passed + ' 通过, ' + failed + ' 失败');
process.exit(failed ? 1 : 0);
