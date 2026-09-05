/**
 * v20.39-cultivation-depth-node.js — 修炼味做深（占卜四问 + 走火化解）验收：
 * 卦阵四问各有门槛与真源（灾问日历真约、人问名册真账、事问行情真价，卦不编造）；
 * 走火入魔分级提醒、三途化解各占时辰、紊乱≥95 锁突破；气运/紊乱随档往返。
 *
 * 运行：node tests/v20.39-cultivation-depth-node.js
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
    var msgs = [], modals = [], advanced = [], deducted = [];
    var stones = opts.stones != null ? opts.stones : 500;
    var w = {
        console: { log: function () {}, warn: function () {}, error: function () {} },
        JSON: JSON, Object: Object, Array: Array, Number: Number, String: String,
        Boolean: Boolean, isFinite: isFinite, parseInt: parseInt,
        Math: { random: function () { return (opts.rng != null ? opts.rng : 0.5); },
                min: Math.min, max: Math.max, floor: Math.floor, round: Math.round },
        document: { readyState: 'complete', addEventListener: function () {},
            getElementById: function () { return null; }, createElement: function () { return {}; } },
        currentCharData: { realm: opts.realm || '元婴', luck: opts.luck != null ? opts.luck : 50,
            spiritStones: stones, bonds: opts.bonds || {} },
        getRealmTier: function () { return opts.tier != null ? opts.tier : 4; },
        DataManager: { deductSpiritStones: function (n) {
            if (opts.noStones) return false;
            deducted.push(n); stones -= n; return true; } },
        timeSystem: {
            getAbsoluteDay: function () { return opts.day != null ? opts.day : 100; },
            advanceTime: function (m, label) { advanced.push({ m: m, label: label }); }
        },
        showMessage: function (m) { msgs.push(String(m)); },
        showModal: function (t, b) { modals.push({ t: t, b: b }); },
        updateCharacterStatus: function () {},
        WorldCalendar: { list: function (o) {
            var from = (o && o.fromDay != null) ? o.fromDay : -1e9;
            var to = (o && o.toDay != null) ? o.toDay : 1e9;
            return (opts.calEvents || []).filter(function (e) {
                return e.dueAbsoluteDay >= from && e.dueAbsoluteDay <= to;
            });
        } },
        npcManager: { getNPC: function (id) { return (opts.npcs || {})[id] || null; } },
        getCurrentCityName: function () { return opts.city != null ? opts.city : '中州'; },
        locationSystem: { getCityPriceModifier: function (c, type) {
            if (opts.priceMod != null) return opts.priceMod;
            return type === 'sell' ? 1.2 : 1.1; } },
        __msgs: msgs, __modals: modals, __advanced: advanced, __deducted: deducted
    };
    w.window = w;
    var ctx = vm.createContext(w);
    vm.runInContext(loadScript('js/cultivation/divination.js'), ctx);
    vm.runInContext(loadScript('js/cultivation/qi-deviation.js'), ctx);
    return w;
}

// ============ D 卦阵四问 ============
var W0 = makeWorld({ tier: 3 });
assert(W0.divineFortune() === false && W0.__deducted.length === 0,
    'D1 元婴方可感应天机——境界不到，卦不做起，灵石不扣');
var W1 = makeWorld({ noStones: true });
assert(W1.divineFortune() === false && W1.__advanced.length === 0,
    'D2 灵石不足不起卦——代价不赊');
var W2 = makeWorld({ luck: 90, rng: 1 });
assert(W2.divineFortune() === true && W2.currentCharData.luck === 98
    && W2.currentCharData._customPillBuff && W2.currentCharData._customPillBuff.attack === 8
    && W2.__msgs.join('').indexOf('上上卦') >= 0 && W2.__advanced.length === 1 && W2.__advanced[0].m === 30,
    'D3 问命上上卦：气运+8、战意一日、耗时半日——账都落真的');
assert(W2.divineFortune() === false && W2.__msgs.join('').indexOf('一日只占一卦') >= 0,
    'D4 天机浑浊，一日一卦——同日起第二卦被拦');
var W3 = makeWorld({ calEvents: [
    { title: '七夕之约：温蘅 邀你同过', dueAbsoluteDay: 101 },
    { title: '兽潮将临', dueAbsoluteDay: 102 },
    { title: '太远的约', dueAbsoluteDay: 120 }
] });
W3.divineDanger();
assert(W3.__msgs.join('').indexOf('七夕之约') >= 0 && W3.__msgs.join('').indexOf('兽潮将临') >= 0
    && W3.__msgs.join('').indexOf('太远的约') < 0,
    'D5 问灾只报未来三日的真约——卦不编造，也不报太远的账');
var W4 = makeWorld({ calEvents: [] });
W4.divineDanger();
assert(W4.__msgs.join('').indexOf('风平浪静') >= 0, 'D6 历上无约，卦说无灾——不吓唬人');
var npcs = { 'sect_leader_天山派': { id: 'sect_leader_天山派', name: '琤霄凌', location: '天山派',
    relationship: { affection: 70 }, changeAffection: function (n) { this.relationship.affection += n; } } };
var W5 = makeWorld({ bonds: { 'sect_leader_天山派': { type: 'dao_companion', name: '琤霄凌' } }, npcs: npcs });
W5.divinePerson();
assert(W5.__msgs.join('').indexOf('琤霄凌') >= 0 && W5.__msgs.join('').indexOf('天山派') >= 0,
    'D7 问人读名册真账——道侣所在如实指处');
var W6 = makeWorld({ bonds: {} });
W6.divinePerson();
assert(W6.__msgs.join('').indexOf('卦中无人') >= 0, 'D8 无道侣则卦中无人——不占空话');
var W7 = makeWorld({ city: '南疆', priceMod: 1.25 });
W7.divineMarket();
assert(W7.__msgs.join('').indexOf('南疆') >= 0 && W7.__msgs.join('').indexOf('货值走高') >= 0,
    'D9 问事读行情真价——哪城货贵，卦指哪城');
var W8 = makeWorld({ city: '' });
W8.divineMarket();
assert(W8.__msgs.join('').indexOf('身在野外') >= 0, 'D10 人在野外占不得市价——卦不凭空造城');
var W9 = makeWorld({});
assert(W9.openDivination() === true && W9.__modals.length === 1
    && W9.__modals[0].b.indexOf('问命') >= 0 && W9.__modals[0].b.indexOf('问人') >= 0,
    'D11 卦阵入口四问齐——命/事/灾/人');

// ============ Q 走火入魔 ============
var Q1 = makeWorld({});
Q1.addQiDeviation(65);
assert(Q1.getQiDeviation() === 65 && Q1.__msgs.length === 1 && Q1.__msgs[0].indexOf('紊乱成形') >= 0,
    'Q1 紊乱 60 分级提醒——不再是哑巴数字');
Q1.addQiDeviation(20);
assert(Q1.__msgs.join('').indexOf('走火入魔') >= 0, 'Q2 紊乱 80 走火入魔提醒');
Q1.addQiDeviation(20);
assert(Q1.__msgs.join('').indexOf('紊乱已极') >= 0 && Q1.getQiDeviationPenalty() === 0.2,
    'Q3 紊乱 95 极档提醒 + 属性罚 20%');
var Q2 = makeWorld({});
Q2.addQiDeviation(50);
assert(Q2.getQiDeviationPenalty() === 0 && Q2.getQiDeviationBlocked() === null,
    'Q4 紊乱未深不锁突破——锁只锁真险');
Q2.addQiDeviation(45);
assert(typeof Q2.getQiDeviationBlocked() === 'string' && Q2.getQiDeviationBlocked().indexOf('紊乱已极') >= 0,
    'Q5 紊乱≥95 突破锁死——真气逆行欲裂，先化解再精进');
var Q3 = makeWorld({});
Q3.addQiDeviation(50);
Q3._calmByMeditation();
assert(Q3.getQiDeviation() === 30 && Q3.__advanced.length === 1 && Q3.__advanced[0].m === 30,
    'Q6 静坐压制：-20，半日——化解不白走');
Q3._calmByYield();
assert(Q3.getQiDeviation() === 0 && Q3.__advanced[1].m === 60,
    'Q7 顺势化解：-40，一整日——化得深，日子也花得多');
var Q4 = makeWorld({});
Q4.addQiDeviation(40);
assert(Q4._calmByGuard() === false && Q4.__msgs.join('').indexOf('尚无道侣') >= 0,
    'Q8 无道侣则护法一途走不得——门槛是真的');
var npcsQ = { 'sect_leader_百花谷': { id: 'sect_leader_百花谷', name: '温蘅', location: '百花谷',
    relationship: { affection: 70 }, changeAffection: function (n) { this.relationship.affection += n; } } };
var Q5 = makeWorld({ bonds: { 'sect_leader_百花谷': { type: 'dao_companion', name: '温蘅' } }, npcs: npcsQ });
Q5.addQiDeviation(40);
Q5._calmByGuard();
assert(Q5.getQiDeviation() === 10 && npcsQ['sect_leader_百花谷'].relationship.affection === 72,
    'Q9 道侣护法：紊乱-30、护你之人情分+2——陪你渡劫的人，账上记得');
var Q6 = makeWorld({});
Q6.addQiDeviation(30);
assert(Q6.calmQiChoice() === true && Q6.__modals.length === 1
    && Q6.__modals[0].b.indexOf('静坐压制') >= 0 && Q6.__modals[0].b.indexOf('道侣护法') >= 0,
    'Q10 化解三途入口齐——走火入魔只进不出的假伤从此成真伤可治');

// ============ G 存档纪律 ============
var gs = loadScript('js/core/game-state.js');
assert(gs.indexOf('luck: charData.luck') >= 0 && gs.indexOf('luck: n(saveData.luck') >= 0,
    'G1 气运入白名单——存读档不再气运归零（占卜系统的账真随档走）');
assert(gs.indexOf('qiDeviation: charData._qiDeviation') >= 0
    && gs.indexOf('_qiDeviation: n(saveData.qiDeviation') >= 0,
    'G2 走火紊乱入白名单——存读档不再把伤重置');
var cul = loadScript('js/cultivation/cultivation.js');
assert(cul.indexOf('openDivination()') >= 0 && cul.indexOf('calmQiChoice()') >= 0,
    'G3 修炼面板接线：卦阵入口与化解入口都挂上了');

console.log('---');
console.log('v20.39 cultivation-depth: ' + passed + ' 通过, ' + failed + ' 失败');
process.exit(failed ? 1 : 0);
