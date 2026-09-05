/**
 * v20.47-yaowang-entry-node.js — 药王谷入门验收：
 * 大大的"医术达标"禁止牌已拆——硬门槛废除，改由药童认草考核定职位；
 * 医术扎实入内门，不懂医理先做杂役，认错草才有回话。其他门派硬门槛不误伤。
 *
 * 运行：node tests/v20.47-yaowang-entry-node.js
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
global.mapData = { 中州:{}, 东荒:{}, 南疆:{}, 西漠:{}, 北冥:{}, 蜀地:{}, 东南海域:{} };
global.document = { querySelectorAll: function () { return []; }, getElementById: function () { return null; } };
global.localStorage = { getItem: function () { return null; }, setItem: function () {} };

var lastModal = null;
var joined = null;
var messages = [];
global.showModal = function (title, html) { lastModal = { title: title, html: html }; };
global.showMessage = function (msg, type) { messages.push({ msg: msg, type: type }); };
global.currentCharData = {
    gender: 'male',
    mainAttributes: { '灵巧': 25, '悟性': 25, '体质': 20, '力量': 35 },
    attrs: { dexterity: 25, constitution: 35, strength: 35 },
    combatSkills: {},
    lifeSkills: { '医术': 0, '锻造': 0 },
    spiritualRoots: {}, mutatedRoots: {},
    fame: 0, karma: 0, notoriety: 0
};
load('js/sects/sects.js');
global.joinSect = function (id, evalResult) { joined = { id: id, evalResult: evalResult }; return true; };
load('js/sects/sect-join-flow.js');

// ============ Y 禁止牌拆除 ============
var src = fs.readFileSync(path.join(ROOT, 'js/sects/sect-join-flow.js'), 'utf8');
assert(src.indexOf('药王谷要求医术达标') < 0,
    'Y1 「药王谷要求医术达标」的禁止文案已从代码里拆掉');
var req0 = checkSectRequirements('药王谷');
assert(req0.pass === true,
    'Y2 医术为零也过基础门槛——不再有一行红字把人在山门外吓退');
var ev0 = evaluateSectEntry('药王谷', global.currentCharData);
assert(ev0.result !== '拒绝',
    'Y3 完整评估不再拒收医术为零的人——准入交给考核，不由数字卡死');

// ============ Y 考核接通 ============
lastModal = null;
showSectGuardTrial('药王谷');
assert(lastModal && lastModal.html.indexOf('断肠草') >= 0 && lastModal.html.indexOf('yaoWangHerb') >= 0,
    'Y4 药王谷考核接通——药童当场认草，不再是死路弹窗');

// 医术扎实 + 认对草 → 内门
global.currentCharData.lifeSkills['医术'] = 25;
messages.length = 0;
yaoWangHerb('middle');
assert(lastModal && lastModal.title.indexOf('🎉') >= 0 && lastModal.html.indexOf('可入内门') >= 0,
    'Y5 认对草且医术扎实——药童点头，可入内门');
global._guardTrialSectId = '药王谷';
joined = null;
finishGuardTrialAsInnerDisciple();
assert(joined && joined.id === '药王谷' && joined.evalResult.rank === 4,
    'Y6 内门入门落实——职位 4，不是挂名');

// 不懂医理 + 认对草 → 杂役（有路，不拒人）
global.currentCharData.lifeSkills['医术'] = 0;
yaoWangHerb('middle');
assert(lastModal && lastModal.title.indexOf('📝') >= 0 && lastModal.html.indexOf('杂役') >= 0,
    'Y7 认对草但不懂医理——先做杂役学，门没关死');
joined = null;
finishGuardTrialJoin();
assert(joined && joined.id === '药王谷' && joined.evalResult.rank === 7,
    'Y8 杂役入门落实——职位 7');

// 认错草 → 叙事回话，不是红字禁令
yaoWangHerb('left');
assert(lastModal && lastModal.html.indexOf('摇头') >= 0 &&
       lastModal.html.indexOf('医术达标') < 0 && lastModal.html.indexOf('医书') >= 0,
    'Y9 认错草——药童摇头让你回去看书，不弹禁止牌');

// ============ Y 他门硬门槛不误伤 ============
assert(checkSectRequirements('金刚宗').pass === false, 'Y10 金刚宗体质门槛照旧');
assert(checkSectRequirements('铸剑山庄').pass === false, 'Y11 铸剑山庄锻造门槛照旧');
assert(checkSectRequirements('修罗宫').pass === false, 'Y12 修罗宫性别门槛照旧');

console.log('---');
console.log('v20.47 yaowang-entry: ' + passed + ' 通过, ' + failed + ' 失败');
process.exit(failed ? 1 : 0);
