/**
 * v20.45-sect-story-node.js — 门派故事弧验收：
 * 三门样板（少林/武当/修罗宫）各三折结构齐；贡献职级逐段解锁（拜门/内门500/亲传1000）；
 * 一幕只演一次、选项当场落账；未入门不演、无头环境不弹不记；进度随档（白名单成对）。
 *
 * 运行：node tests/v20.45-sect-story-node.js
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

function makeWorld(opts) {
    opts = opts || {};
    var msgs = [], modals = [], hooks = [];
    var w = {
        console: { log: function () {}, warn: function () {}, error: function () {} },
        JSON: JSON, Object: Object, Array: Array, Math: Math, Number: Number, String: String,
        currentCharData: { luck: 50, _sectStory: opts.story || {} },
        discipleState: { isInSect: opts.inSect !== false, sectId: opts.sect || '少林寺',
            contribution: opts.contrib != null ? opts.contrib : 0 },
        timeSystem: { onNewDaySubscribe: function (fn) { hooks.push(fn); } },
        showMessage: function (m) { msgs.push(String(m)); },
        showModal: opts.noModal ? undefined : function (t, b) { modals.push({ t: t, b: b }); },
        updateCharacterStatus: function () {},
        __msgs: msgs, __modals: modals, __hooks: hooks
    };
    w.window = w;
    var ctx = vm.createContext(w);
    vm.runInContext(loadScript('js/sects/sect-story-arc.js'), ctx);
    return w;
}

// ============ S 三门样板结构 ============
var W0 = makeWorld({});
var arcs = W0.SECT_STORY_ARCS;
assert(arcs['少林寺'] && arcs['武当派'] && arcs['修罗宫'],
    'S1 三门样板齐——正道少林、道门武当、邪道修罗宫');
assert(['少林寺', '武当派', '修罗宫'].every(function (s) {
    var st = arcs[s].stages;
    return st.length === 3 && st.every(function (g) {
        return g.title && g.scenes.length >= 2 && g.choices.length >= 2
            && g.choices.every(function (c) { return c.text && c.result; });
    });
}), 'S2 每门三折，每折有景有择有果——故事不是过场，是要选的');
assert(arcs['少林寺'].stages[0].scenes.join('').indexOf('监斋僧') >= 0
    && arcs['武当派'].stages[0].scenes.join('').indexOf('宋远桥') >= 0
    && arcs['修罗宫'].stages[0].scenes.join('').indexOf('绯泪') >= 0,
    'S3 三门各有各的人——不是换个名字的同一个故事');

// ============ S 职级解锁 ============
assert(W0.getSectStoryPendingStage('少林寺') === 0, 'S4 拜门即开演——第一折不设贡献门槛');
var W1 = makeWorld({ contrib: 499 });
assert(W1.getSectStoryPendingStage('少林寺') === 0, 'S5 贡献 499 的新弟子——也是从第一折演起');
var W2 = makeWorld({ contrib: 500 });
assert(W2.getSectStoryPendingStage('少林寺') === 0, 'S6a 贡献 500 但第一折未演——戏从头开，不跳折');
W2._resolveSectStory('少林寺', 0, 0);
assert(W2.getSectStoryPendingStage('少林寺') === 1, 'S6b 第一折演完、贡献已足——内门折接着开门');
var W3 = makeWorld({ contrib: 1200, story: { '少林寺': { stage: 1, choices: {} } } });
assert(W3.getSectStoryPendingStage('少林寺') === 2, 'S7 前两折演过、贡献过千——亲传折开门');

// ============ S 一幕一次，当场落账 ============
var W4 = makeWorld({ contrib: 0 });
assert(W4.checkSectStory() === true && W4.__modals.length === 1
    && W4.__modals[0].b.indexOf('灶下旧僧') >= 0,
    'S8 新日开演——弹窗演的是当前该演的折');
assert(W4._resolveSectStory('少林寺', 0, 0) === true
    && W4.discipleState.contribution === 20
    && W4.currentCharData.luck === 51
    && W4.currentCharData._sectStory['少林寺'].stage === 0,
    'S9 择一即落账：贡献+20、气运+1、进度记账（选项后果不藏数）');
assert(W4._resolveSectStory('少林寺', 0, 1) === false, 'S10 一幕只演一次——同一折不能换个选项重演');
assert(W4.getSectStoryPendingStage('少林寺') === null, 'S11 演完当前折——下一折等贡献到位');
assert(W4.__msgs.join('').indexOf('铜佛牌') >= 0 || W4.__msgs.join('').indexOf('监斋僧') >= 0,
    'S12 果有果的讲法——结局文案随选择而不同');

// ============ S 门外与无头 ============
var W5 = makeWorld({ inSect: false });
assert(W5.checkSectStory() === false, 'S13 未入门不演——故事跟着门派走');
var W6 = makeWorld({ sect: '查无此派' }); // v20.51 起 36 门全有自己的戏——「无本」的只剩查无此派
assert(W6.checkSectStory() === false && W6.__modals.length === 0,
    'S14 无本的门派不强演——查无此派不弹空白戏');
var W6b = makeWorld({ sect: '逍遥派' });
assert(W6b.checkSectStory() === true && W6b.__modals.length === 1,
    'S14b 三十六门全有本——逍遥派也能开演自己的戏');
var W7 = makeWorld({ noModal: true });
assert(W7.checkSectStory() === false && !W7.currentCharData._sectStory['少林寺'],
    'S15 无头环境不弹不记——改日再来，进度不空转');

// ============ S 存档纪律 ============
var gs = loadScript('js/core/game-state.js');
assert(gs.indexOf('sectStory: charData._sectStory') >= 0
    && gs.indexOf('_sectStory: (saveData.sectStory') >= 0,
    'S16 故事进度入白名单——演过的戏随档走，读档不重演不丢戏');
var html = loadScript('仙侠.html');
assert(html.indexOf('sect-story-arc.js') >= 0, 'S17 挂载在案——每日新日钩子自动开演');

console.log('---');
console.log('v20.45 sect-story: ' + passed + ' 通过, ' + failed + ' 失败');
process.exit(failed ? 1 : 0);
