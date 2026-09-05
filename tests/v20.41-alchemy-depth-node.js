/**
 * v20.41-alchemy-depth-node.js — 炼丹三薄做深验收：
 * 丹毒只进不出从此有解毒三途（茶/汗/医，各占时辰或灵石）+分档警示+好转清旗；
 * 自创丹方可选料（毒性去向摆面板上，账不藏）；试火有价（精力5）。
 *
 * 运行：node tests/v20.41-alchemy-depth-node.js
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
    var msgs = [], modals = [], advanced = [], removed = [], htmls = [];
    var stones = opts.stones != null ? opts.stones : 500;
    var w = {
        console: { log: function () {}, warn: function () {}, error: function () {} },
        JSON: JSON, Object: Object, Array: Array, Math: Math, Number: Number, String: String,
        Boolean: Boolean, isFinite: isFinite,
        document: {
            getElementById: function () { return null; },
            addEventListener: function () {},
            body: { insertAdjacentHTML: function (p, h) { htmls.push(h); } }
        },
        setInterval: function () { return 1; }, clearInterval: function () {},
        setTimeout: function () {},
        currentCharData: { energy: opts.energy != null ? opts.energy : 100, essence: 0, luck: 50 },
        DataManager: { deductSpiritStones: function (n) {
            if (stones < n) return false; stones -= n; return true; } },
        itemById: {
            mat_a: { name: '赤焰草', type: 'material', toxicity: 40 },
            mat_b: { name: '茯苓', type: 'material', toxicity: 5 }
        },
        inventory: { slots: [
            { uid: 'u1', templateId: 'mat_a', count: 2 },
            { uid: 'u2', templateId: 'mat_b', count: 1 }
        ] },
        removeItem: function (uid, n) { removed.push({ uid: uid, n: n }); },
        showMessage: function (m) { msgs.push(String(m)); },
        showModal: function (t, b) { modals.push({ t: t, b: b }); },
        updateCharacterStatus: function () {},
        timeSystem: { advanceTime: function (m, l) { advanced.push({ m: m, l: l }); } },
        __msgs: msgs, __modals: modals, __advanced: advanced, __removed: removed, __htmls: htmls
    };
    w.window = w;
    var ctx = vm.createContext(w);
    vm.runInContext(loadScript('js/crafting/pill-poison.js'), ctx);
    vm.runInContext(loadScript('js/crafting/craft-custom-pill.js'), ctx);
    vm.runInContext(loadScript('js/crafting/fire-qte.js'), ctx);
    return w;
}

// ============ P 丹毒：账与解毒三途 ============
var W1 = makeWorld({});
assert(W1.getPillToxicity('mat_a') === 40 && W1.getPillToxicity('mat_b') === 5,
    'P1 毒性读物品真账——赤焰草 40，茯苓 5');
W1.addPillPoison('mat_a', 1);
assert(W1.getPillPoison() === 40 && W1.__msgs.length === 0, 'P2 毒在腠理不扰人——未过档线无警示');
W1.addPillPoison('mat_a', 1); // 80
assert(W1.__msgs.join('').indexOf('丹毒滞体') >= 0 && W1.__msgs.join('').indexOf('丹毒入经脉') >= 0,
    'P3 跨 50/80 两档连报——毒一步步深下去，话也一步步重起来');
var n1 = W1.__msgs.length;
W1.addPillPoison('mat_b', 1); // 85，不跨新档
assert(W1.__msgs.length === n1, 'P4 档内不刷屏——警示只在跨档时报');
assert(Math.abs(W1.getPillPoisonPenalty() - 85 / 200) < 1e-9
    && Math.abs(W1.getPillPoisonHeartDemonChance() - 85 / 500) < 1e-9,
    'P5 毒有牙：修炼吃罚、走火添险——账不是摆设');
W1._detoxTea();
assert(W1.getPillPoison() === 65 && W1.__advanced.length === 1 && W1.__advanced[0].m === 30,
    'P6 解毒茶：-20，半日——解毒的路条条要付账');
W1._detoxSweat();
assert(W1.getPillPoison() === 30 && W1.__advanced[1].m === 60,
    'P7 发汗排毒：-35，一整日——化得深，日子也花得多');
W1._detoxDoctor();
assert(W1.getPillPoison() === 0 && W1.__advanced[2].m === 30,
    'P8 延医调治：-50，半日+灵石——请圣手施针');
var W2 = makeWorld({ stones: 100 });
W2.addPillPoison('mat_a', 2); // 80
assert(W2._detoxDoctor() === false && W2.getPillPoison() === 80,
    'P9 灵石不足请不动医——价是硬的，毒不赊账');
var W3 = makeWorld({});
W3.addPillPoison('mat_a', 2); // 80
W3.detoxifyPill(35); // 45，跌回 50 档线以下
W3.addPillPoison('mat_a', 1); // 85，重新跨 80
assert(W3.__msgs.filter(function (m) { return m.indexOf('毒入经脉') >= 0; }).length === 2,
    'P10 好转清旗、再恶化再报——警示随账走，不是一次性的');
assert(W3.detoxChoice() === true && W3.__modals.length === 1
    && W3.__modals[0].b.indexOf('煎解毒茶') >= 0 && W3.__modals[0].b.indexOf('延医调治') >= 0,
    'P11 解毒三途入口齐——丹毒只进不出的假账从此成真账可还');
var W4 = makeWorld({});
assert(W4.detoxChoice() === false, 'P12 无毒不解——不白付账');

// ============ C 自创丹方：选料 ============
var W5 = makeWorld({});
assert(W5.openPillMaterialPicker() === true && W5.__modals.length === 1
    && W5.__modals[0].b.indexOf('赤焰草') >= 0 && W5.__modals[0].b.indexOf('茯苓') >= 0
    && W5.__modals[0].b.indexOf('毒性40') >= 0 && W5.__modals[0].b.indexOf('烈·混沌归元') >= 0,
    'C1 选料面板：全材列齐，毒性与成丹去向摆在面上——账不藏');
assert(W5.__removed.length === 0 && W5.getPillPoison() === 0,
    'C2 选料不扣账——看菜不动筷，分文不花');
assert(W5.craftCustomPillWith('u1') === true
    && W5.__removed.length === 1 && W5.__removed[0].uid === 'u1'
    && W5.getPillPoison() === 40
    && W5.currentCharData._customPillBuff && W5.currentCharData._customPillBuff.allAttr === 10
    && W5.currentCharData._customPills.indexOf('混沌归元丹') >= 0,
    'C3 烈材成猛丹：赤焰草→混沌归元丹（全属性+10），材毒 40 全数记账');
assert(W5.craftCustomPillWith('u2') === true
    && W5.currentCharData.essence === 30
    && W5.currentCharData._customPills.indexOf('聚气培元丹') >= 0,
    'C4 凡材成平丹：茯苓→聚气培元丹（真元+30）——材性决定丹性');
assert(W5.craftCustomPillWith('u-none') === false, 'C5 材料不在背包——不炼空账');
var W6 = makeWorld({ stones: 10 });
assert(W6.craftCustomPillWith('u1') === false && W6.__removed.length === 0,
    'C6 灵石不足不开炉——料不白扣');

// ============ F 试火有价 ============
var W7 = makeWorld({});
W7.openFireQTE();
assert(W7.currentCharData.energy === 95 && W7.__htmls.length === 1,
    'F1 试火耗精力 5——盯火苗也是熬神，不白试');
W7._fireQTEShoot();
assert(typeof W7._alchemyFireBonus === 'number' && W7.__htmls.length === 1,
    'F2 收火得分落账——供下次炼丹用');
var W8 = makeWorld({ energy: 3 });
W8.openFireQTE();
assert(W8.currentCharData.energy === 3 && W8.__htmls.length === 0,
    'F3 精力不足盯不住火苗——试炼拒开，精力不扣');

console.log('---');
console.log('v20.41 alchemy-depth: ' + passed + ' 通过, ' + failed + ' 失败');
process.exit(failed ? 1 : 0);
