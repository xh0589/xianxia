/**
 * v20.93-sect-transmit-node.js — 藏经阁·镇派亲传验收：
 *   Q1 数据面：打狗棒法归位（四层三品·掌门独承）、31 派镇派功法标亲传、5 家藏书门派照旧阁中可读
 *   Q2 楼层门：地位越高可入层数越多（杂役一层 → 长老四层），口径不分叉
 *   Q3 传人门：镇派神功阁中可见书名不落纸册——掌门/副掌门天然在传，长老须请掌门亲传
 *   Q4 请亲传全流程：职位/好感/贡献三道门真拦截真扣账，受传后即可参悟，抄本永不开闸
 *   Q5 周边一致：可阅览计数过传人门、亲传账随弟子状态存档、鲁有脚不会打狗棒法
 *
 * 运行：node tests/v20.93-sect-transmit-node.js
 */
'use strict';

var path = require('path');
var fs = require('fs');
var vm = require('vm');

var ROOT = path.resolve(__dirname, '..');
function loadScript(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

var passed = 0, failed = 0;
function ok(cond, label) {
    if (cond) passed++;
    else { failed++; console.log('[FAIL] ' + label); }
}

// ============ 世界桩 ============
var W = {
    console: { log: function () {}, warn: function () {}, error: function () {} },
    setTimeout: function (fn) { try { fn(); } catch (e) {} return 0; },
    localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
    document: {
        createElement: function () { return { style: {}, classList: { add: function () {}, remove: function () {}, contains: function () { return false; } }, dataset: {}, innerHTML: '' }; },
        getElementById: function () { return null; },
        querySelector: function () { return null; },
        querySelectorAll: function () { return []; },
        addEventListener: function () {},
        body: { appendChild: function () {} }
    },
    alert: function () {}
};
W.window = W;
var state = { msgs: [], logs: [], minutes: 0 };
W.timeSystem = {
    gameTime: { totalMinutes: 8 * 60, currentDay: 9 },
    advanceTime: function (m) { state.minutes += m; this.gameTime.totalMinutes += m; }
};
W.gameLog = { add: function (t) { state.logs.push(String(t)); } };
W.showMessage = function (t) { state.msgs.push(String(t)); };
W.showModal = function (title, body) { state.modal = { title: title, body: body }; };
W.addItem = function () { return true; };
W.saveSectData = function () { state.saved = (state.saved || 0) + 1; };
W.sectsData = {};
W.discipleState = { isInSect: true, sectId: '丐帮', rank: 2, rankName: '长老', contribution: 5000, artInsights: {} };
W.currentCharData = { name: '测试长老', attrs: { intelligence: 20 }, qi: 100 };
var leaderNpc = { name: '萧峰', relationship: { affection: 70 }, changeAffection: function (n) { this.relationship.affection += n; } };
W.npcManager = { getNPC: function (id) { return id === 'sect_leader_丐帮' ? leaderNpc : null; } };

vm.createContext(W);
function load(rel) { vm.runInContext(loadScript(rel), W, { filename: rel }); }
load('js/sects/sect-facilities.js');
load('js/sects/sect-internal.js');

var ARTS = W.SECT_SPECIFIC_ARTS;
function findArt(sect, id) { return (ARTS[sect] || []).filter(function (a) { return a.id === id; })[0] || null; }
function ds() { return W.discipleState; }

// ==================== Q1 数据面 ====================
console.log('\n[Q1] 数据面：打狗棒法归位 + 亲传标记');
(function () {
    var dgb = findArt('丐帮', 'art_gaibang_staff');
    ok(!!dgb && dgb.tier === 4 && dgb.grade === '三品' && dgb.transmit === 'leader', 'Q1 打狗棒法该是四层三品·掌门独承（实得 tier' + (dgb && dgb.tier) + ' ' + (dgb && dgb.grade) + ' ' + (dgb && dgb.transmit) + '）');
    ok(!!findArt('丐帮', 'art_gb_huntian') && findArt('丐帮', 'art_gb_huntian').tier === 2, 'Q1 丐帮二层该有混天功顶上（打狗棒法升层不留空板）');
    var xl = findArt('丐帮', 'art_gb_xianglong');
    ok(!!xl && xl.tier === 4 && xl.transmit === 'direct', 'Q1 降龙十八掌·残篇该是四层·掌门亲传');
    var direct = 0, leader = 0, free4 = 0, sectsWith4 = 0;
    var LIBSECTS = ['少林寺', '天书阁', '大隐阁', '侠隐阁', '全真教'];
    Object.keys(ARTS).forEach(function (sect) {
        var t4 = (ARTS[sect] || []).filter(function (a) { return (a.tier || 1) === 4; });
        if (t4.length) sectsWith4++;
        t4.forEach(function (a) {
            if (a.transmit === 'direct') direct++;
            else if (a.transmit === 'leader') leader++;
            else { free4++; ok(LIBSECTS.indexOf(sect) >= 0, 'Q1 无亲传标记的四层功法只该出自五家藏书门派（' + sect + '·' + a.name + '）'); }
        });
    });
    ok(direct === 31, 'Q1 该有 31 部镇派功法标掌门亲传（实得 ' + direct + '）');
    ok(leader === 1, 'Q1 掌门独承该只有打狗棒法一部（实得 ' + leader + '）');
    ok(free4 === 5, 'Q1 五家藏书门派的镇派功法该照旧阁中可读（实得 ' + free4 + '）');
    ok(sectsWith4 >= 36, 'Q1 三十六派都该有镇派层功法（实得 ' + sectsWith4 + '）');
})();

// ==================== Q2 楼层门 ====================
console.log('\n[Q2] 楼层门：地位越高入得越深');
(function () {
    // 无 canAccessScriptureTier 桩时走 maxRank 回退（与真源同数值口径）
    ds().rank = 7; ok(W.sectArtTransmitOK && !vm.runInContext('libTierUnlocked(2)', W), 'Q2 杂役弟子进不得二层');
    ds().rank = 5; ok(!vm.runInContext('libTierUnlocked(2)', W), 'Q2 外门弟子进不得二层');
    ds().rank = 4; ok(vm.runInContext('libTierUnlocked(2)', W) && !vm.runInContext('libTierUnlocked(3)', W), 'Q2 内门弟子止于二层');
    ds().rank = 3; ok(vm.runInContext('libTierUnlocked(3)', W) && !vm.runInContext('libTierUnlocked(4)', W), 'Q2 亲传弟子止于三层');
    ds().rank = 2; ok(vm.runInContext('libTierUnlocked(4)', W), 'Q2 长老入得四层镇派阁');
    ds().rank = 0; ok(vm.runInContext('libTierUnlocked(4)', W), 'Q2 掌门四层通行');
})();

// ==================== Q3 传人门 ====================
console.log('\n[Q3] 传人门：镇派神功不落纸册');
(function () {
    var tok = W.sectArtTransmitOK;
    ok(typeof tok === 'function', 'Q3 传人门判定该导出全局');
    var shaolinT4 = (ARTS['少林寺'] || []).filter(function (a) { return a.tier === 4; })[0];
    ds().rank = 2;
    ok(!!shaolinT4 && tok(shaolinT4) === true, 'Q3 少林镇派功法（藏书门派）长老照旧可读');
    var xl = findArt('丐帮', 'art_gb_xianglong'), dgb = findArt('丐帮', 'art_gaibang_staff');
    ds().rank = 2; ds().artTransmits = undefined;
    ok(tok(xl) === false, 'Q3 长老未受亲传读不得降龙残篇');
    ok(tok(dgb) === false, 'Q3 长老读不得打狗棒法');
    ds().rank = 1;
    ok(tok(xl) === true, 'Q3 副掌门天然在传（降龙残篇可读）');
    ok(tok(dgb) === false, 'Q3 副掌门也读不得打狗棒法——棒在帮主');
    ds().rank = 0;
    ok(tok(dgb) === true && tok(xl) === true, 'Q3 掌门两部全通');
    ds().rank = 2; ds().artTransmits = { art_gb_xianglong: { day: 9, from: '萧峰' } };
    ok(tok(xl) === true, 'Q3 受过亲传的长老读得降龙残篇');
    ok(tok(dgb) === false, 'Q3 受过别的亲传也不解锁打狗棒法');
    // 翻阅/参悟被传人门拦下
    ds().artTransmits = undefined;
    state.msgs.length = 0;
    W.sectLibBrowse('art_gb_xianglong');
    ok(state.msgs.join('').indexOf('掌门亲传') >= 0 && !(ds().artInsights && ds().artInsights['art_gb_xianglong']), 'Q3 未受传翻阅该被拦且不落阅账');
    W.sectLibStudy('art_gb_xianglong');
    ok(state.msgs.join('').indexOf('掌门亲传') >= 0, 'Q3 未受传参悟该被拦');
    // 掌门请抄本也不行——口授心传不落纸册
    ds().rank = 0;
    state.msgs.length = 0;
    W.sectLibCopy('art_gaibang_staff');
    ok(state.msgs.join('').indexOf('不落纸册') >= 0, 'Q3 亲传功法连掌门也无抄本可请');
    ds().rank = 2;
})();

// ==================== Q4 请掌门亲传 ====================
console.log('\n[Q4] 请掌门亲传：三道门 + 真扣账');
(function () {
    ds().rank = 3; ds().contribution = 9999; leaderNpc.relationship.affection = 90;
    state.msgs.length = 0;
    W.sectLibRequestTransmit('art_gb_xianglong');
    ok(!ds().artTransmits && state.msgs.join('').indexOf('长老') >= 0, 'Q4 亲传弟子位分不够请不了（须长老入阁）');
    ds().rank = 2;
    leaderNpc.relationship.affection = 40;
    state.msgs.length = 0;
    W.sectLibRequestTransmit('art_gb_xianglong');
    ok(!ds().artTransmits && ds().contribution === 9999 && state.msgs.join('').indexOf('好感') >= 0, 'Q4 掌门好感不足被拒不扣贡献');
    leaderNpc.relationship.affection = 70;
    ds().contribution = 100;
    state.msgs.length = 0;
    W.sectLibRequestTransmit('art_gb_xianglong');
    ok(!ds().artTransmits && ds().contribution === 100, 'Q4 贡献不足被拒不扣账');
    ds().contribution = 5000;
    state.minutes = 0; state.msgs.length = 0;
    W.sectLibRequestTransmit('art_gb_xianglong');
    ok(!!ds().artTransmits && !!ds().artTransmits['art_gb_xianglong'], 'Q4 三道门齐过该受传落账');
    ok(ds().contribution === 2000, 'Q4 亲传该扣贡献 3000（实扣 ' + (5000 - ds().contribution) + '）');
    ok(state.minutes === 240, 'Q4 祖师堂口授该结四个时辰（实得 ' + state.minutes + ' 分钟）');
    ok(leaderNpc.relationship.affection === 73, 'Q4 承掌门之信该有好感回响（+3）');
    ok(ds().artInsights['art_gb_xianglong'] && ds().artInsights['art_gb_xianglong'].heard === true, 'Q4 口授心传即已阅——回来即可参悟');
    ok(state.msgs.join('').indexOf('祖师堂') >= 0 && state.logs.join('').indexOf('打狗') < 0, 'Q4 受传该有仪式文案');
    // 幂等：再请不重扣
    state.msgs.length = 0;
    W.sectLibRequestTransmit('art_gb_xianglong');
    ok(ds().contribution === 2000 && state.msgs.join('').indexOf('已得') >= 0, 'Q4 已受传再请该幂等不重扣');
    // 受传后参悟通路打开
    ds().artInsights['art_gb_xianglong'].m = 0;
    W.currentCharData.qi = 100;
    var before = ds().artInsights['art_gb_xianglong'].m;
    W.sectLibStudy('art_gb_xianglong');
    ok(ds().artInsights['art_gb_xianglong'].m > before && W.currentCharData.qi === 80, 'Q4 受传后参悟真涨掌握度真耗真气');
    // leader 独承功法没有「请传」通道
    state.msgs.length = 0;
    W.sectLibRequestTransmit('art_gaibang_staff');
    ok(!ds().artTransmits['art_gaibang_staff'] && state.msgs.join('').indexOf('非掌门亲传之例') >= 0, 'Q4 打狗棒法无请传之路——帮主之位传谁棒法传谁');
})();

// ==================== Q5 周边一致 ====================
console.log('\n[Q5] 周边一致');
(function () {
    // 真源桩：与 sects-system.canAccessScriptureTier 同口径（长老+四层/亲传三层/内门二层/其余一层）
    W.canAccessScriptureTier = function (tier) {
        var r = ds().rank;
        var max = r <= 2 ? 4 : r === 3 ? 3 : r === 4 ? 2 : 1;
        return tier <= max;
    };
    // 可阅览计数过传人门（app.js 藏经阁播报的数据源）
    ds().rank = 2; ds().artTransmits = undefined;
    var readable = W.getReadableSectArts('丐帮');
    var ids = readable.map(function (a) { return a.id; });
    ok(ids.indexOf('art_gb_xianglong') < 0 && ids.indexOf('art_gaibang_staff') < 0, 'Q5 未受传的长老「可阅览」计数不该含镇派神功');
    ok(ids.indexOf('art_gb_tongbei') >= 0 && ids.indexOf('art_gb_huntian') >= 0, 'Q5 一、二层功法照常可读');
    ds().artTransmits = { art_gb_xianglong: { day: 9 } };
    readable = W.getReadableSectArts('丐帮');
    ids = readable.map(function (a) { return a.id; });
    ok(ids.indexOf('art_gb_xianglong') >= 0 && ids.indexOf('art_gaibang_staff') < 0, 'Q5 受传后降龙残篇入账、打狗棒法仍旧独承');
    // 亲传账随弟子状态存档
    var ssSrc = loadScript('js/sects/sects-system.js');
    ok(/artTransmits: ds\.artTransmits/.test(ssSrc) && /ds\.artTransmits = data\.artTransmits/.test(ssSrc) && /ds\.artTransmits = \{\};/.test(ssSrc), 'Q5 亲传账该在弟子状态导出/导入/重置三处都走账');
    // 面板：长老看得到书名、看不到册
    state.modal = null;
    ds().artTransmits = undefined;
    W.openSectLibraryPanel();
    var body = (state.modal && state.modal.body) || '';
    ok(body.indexOf('降龙十八掌·残篇') >= 0 && body.indexOf('须掌门亲传') >= 0, 'Q5 面板该见书名不见册（镇派神功锁文案在）');
    ok(body.indexOf('请掌门亲传') >= 0, 'Q5 长老面板该有请传按钮');
    ok(body.indexOf('打狗棒法') >= 0 && body.indexOf('历代掌门亲传独承') >= 0, 'Q5 打狗棒法该标掌门独承');
    // 深数据与事件文案归位：执法长老不会打狗棒法，棒会文案不违祖制
    var ddSrc = loadScript('js/sects/sects-deep-data.js');
    var lu = ddSrc.match(/鲁有脚[\s\S]{0,220}?skills: \[([^\]]*)\]/);
    ok(!!lu && lu[1].indexOf('打狗棒法') < 0, 'Q5 执法长老鲁有脚不该会打狗棒法（帮主独承）');
    ok(/萧峰[\s\S]{0,220}?skills: \[[^\]]*打狗棒法/.test(ddSrc), 'Q5 帮主萧峰会打狗棒法（棒在帮主）');
    var evSrc = loadScript('js/sects/sect-exclusive-events.js');
    ok(evSrc.indexOf('只传帮主之位') >= 0, 'Q5 打狗棒会文案该守祖制（压轴帮主亲演，妙处只传帮主）');
})();

// ==================== 结果 ====================
console.log('\n========== v20.93 镇派亲传 ==========');
console.log('通过 ' + passed + ' / 失败 ' + failed);
process.exit(failed ? 1 : 0);
