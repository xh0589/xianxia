/**
 * late-bt-shape-node.js — 后期跨境突破的「形状」收口（只改关的形状，不动小境界成功率）
 *   L1 ★机缘不再买命★：燃 30 点机缘后 successRate 不为 1（改前是把成功率顶成 1，闸 [0.1,0.95] 从此成死码）
 *   L2 ★机缘抵的是跌境★：燃过之后失败不扣层；没燃的对照位照扣（否则本条是空断言）
 *   L3 ★丹加成封顶一半★：大乘基础 45% 时，标称 +27% 的丹实际只能加 +22.5%
 *   L4 ★后期不再更便宜★：化神→炼虚 / 炼虚→合体 / 合体→大乘 / 大乘→渡劫 四条材料键都在，
 *                       且每一条的物品 id 都在真实物品表里（化神以上此前全落进空 default）
 *   L5 ★小境界一个数都没动★：读 breakthrough-system.js 源码钉死 0.20/0.30/0.40/0.50/0.60 五档
 *
 * 运行：node tests/late-bt-shape-node.js
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
function section(t) { console.log('\n[' + t + ']'); }

// ==================== 世界桩 ====================
var W = {
    console: { log: function () {}, warn: function () {}, error: function () {} },
    setTimeout: function () { return 0; }, clearTimeout: function () {},
    localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
    document: {
        createElement: function () {
            return {
                style: {}, dataset: {}, innerHTML: '', textContent: '', className: '',
                classList: { add: function () {}, remove: function () {}, contains: function () { return false; } },
                appendChild: function () {}, removeChild: function () {}, remove: function () {},
                addEventListener: function () {}, setAttribute: function () {}, getAttribute: function () { return null; }
            };
        },
        getElementById: function () { return null; },
        // 仪式失败/成功两页都要 modal 在场才肯往下走（showBreakthroughFailure 开头就 return）
        querySelector: function () { return { innerHTML: '', remove: function () {} }; },
        querySelectorAll: function () { return []; },
        addEventListener: function () {},
        body: {
            // 把仪式面板那一次的 innerHTML 留下来，好回读屏上到底印了什么
            appendChild: function (el) { W.__lastModalHtml = el && el.innerHTML; }, innerHTML: ''
        },
        head: { appendChild: function () {} }
    },
    alert: function () {}, confirm: function () { return true; },
    inventory: { currency: { spiritStones: 0, copper: 0 }, slots: [] },
    currentCharData: null,
    EconomyTransaction: {
        getBalance: function () { return 1e9; }, debit: function () { return true; },
        removeByTemplate: function () { return true; }, run: function (f) { return f(); }
    }
};
W.window = W;
W.EventBus = { emit: function () {}, on: function () {} };
W.StateRegistry = { register: function () {} };
W.showMessage = function () {};
W.updateCharacterStatus = function () {};
W.doAutoSave = function () {};
W.timeSystem = { advanceTime: function () {} };
W.MoodSystem = { breakthroughBonus: function () { return 0; } };
W._bottleneckBonus = 0;

vm.createContext(W);
function load(rel) { vm.runInContext(loadScript(rel), W, { filename: rel }); }
function stripComments(src) {
    return String(src)
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/(^|[^:\\])\/\/.*$/gm, function (m, p1) { return p1; });
}

// 物品库 + 突破两本（加载序同页面）
load('js/items.js');
['01-pills', '02-weapons', '03-armor', '04-materials', '05-talismans', '06-arts', '07-food', '08-special']
    .forEach(function (f) { load('js/items-extended/' + f + '.js'); });
load('js/items-extended.js');
['13-missing-ids', '14-ability-manuals', '15-root-refine', '16-dangling-ids', '17-lead-tokens', '18-grade-expansion']
    .forEach(function (f) { load('js/items-extended/' + f + '.js'); });
load('js/data.js');
load('js/cultivation/breakthrough-system.js');
load('js/cultivation/breakthrough-ritual.js');

var REALMS = (W.REALM_CONFIG && W.REALM_CONFIG.realms || []).map(function (r) { return r.name; });

// 把角色摆到「某境九层圆满」，并按 BREAKTHROUGH_MATERIALS 备齐这一跃的真材料
function prepChar(realm, fortune) {
    var next = REALMS[REALMS.indexOf(realm) + 1];
    var req = W.BREAKTHROUGH_MATERIALS[realm + '→' + next] || W.BREAKTHROUGH_MATERIALS['default'];
    W.currentCharData = {
        realm: realm, layer: 9, essence: 1e12, tempering: 1e12, qi: 1e9,
        energy: 100, spiritStones: 1e9, maxQi: 1e9, fortune: fortune || 0, _failedBreakthroughs: 0
    };
    W.inventory.slots = (req.items || []).map(function (it, i) {
        return { uid: 'm' + i, templateId: it.id, count: it.count };
    });
    W.breakthroughState.inProgress = false;
}

// 掷一个必败的骰子（真仪式在 advanceBreakthroughStage(3) 用 Math.random 判成败）
W.Math = Math;
function forceFailRoll() {
    var m = Object.create(Math);
    m.random = function () { return 0.999999; };
    W.Math = m;
}
function restoreRoll() { W.Math = Math; }
forceFailRoll();

// ============================================================
section('L1 机缘不再买命：燃过之后成功率不为 1');
// ============================================================
prepChar('大乘', 30);                       // 大乘 45%：改前 45% + 烧机缘 = 100%
ok(Math.abs(W.getBreakthroughRitualBaseRate('大乘') - 0.45) < 1e-9,
    'L1 大乘基础成功率实测 ' + W.getBreakthroughRitualBaseRate('大乘') + '（基准 0.45）');
W.startBreakthroughRitual();
var bare = W.breakthroughState.successRate;
ok(W.breakthroughState._fortuneBurnAvailable === true, 'L1 机缘 ≥30 时按钮可点');
var fortuneBefore = W.currentCharData.fortune;
var burned = W.burnFortuneForBreakthrough();
var after = W.breakthroughState.successRate;
ok(burned === true, 'L1 燃机缘返回 true');
ok(W.currentCharData.fortune === fortuneBefore - 30, 'L1 照扣 30 点（' + fortuneBefore + ' → ' + W.currentCharData.fortune + '）');
ok(after !== 1, 'L1 ★燃过机缘后 successRate ≠ 1（实得 ' + after + '，裸值 ' + bare + '）');
ok(Math.abs(after - bare) < 1e-9, 'L1 成功率一个数都没动：燃前 ' + bare + ' = 燃后 ' + after);
ok(after <= 0.95 + 1e-9, 'L1 仍在 [0.1, 0.95] 闸内（没顶到 100%）');
ok(W.breakthroughState._fortuneShield === true, 'L1 燃机缘立的是「抵跌境」的盾，不是「必成」的旗');
ok(W.breakthroughState._fortuneBurnAvailable === false, 'L1 一回只燃一次，按钮随之收走');
// 一次只燃一回：再点一次不成立，且不再扣点
var f2 = W.currentCharData.fortune;
ok(W.burnFortuneForBreakthrough() === false, 'L1 同一关第二次燃不动');
ok(W.currentCharData.fortune === f2, 'L1 第二次燃不扣机缘');
// 不足 30 不扣
prepChar('大乘', 29);
W.startBreakthroughRitual();
ok(W.breakthroughState._fortuneBurnAvailable === false, 'L1 机缘 29 < 30 时按钮不出现');
ok(W.burnFortuneForBreakthrough() === false, 'L1 机缘不足时燃不动');
ok(W.currentCharData.fortune === 29, 'L1 机缘不足时一点不扣（仍 29）');
// 源码钉位：不再有 successRate = 1
var ritualSrc = loadScript('js/cultivation/breakthrough-ritual.js');
var ritualCode = stripComments(ritualSrc);
ok(!/breakthroughState\.successRate\s*=\s*1\b/.test(ritualCode),
    'L1 源码里已无「successRate = 1」这条赋值（剥注释后）');
ok(!/燃[^"'`]*必成/.test(ritualCode) && !/必成/.test(ritualCode),
    'L1 仪式界面文案里已无「必成」二字');
['js/app.js', 'js/extensions/qiyu-encounters.js'].forEach(function (f) {
    ok(stripComments(loadScript(f)).indexOf('破境必成') < 0, f + ' 界面文案里已无「破境必成」');
});
ok(/燃 30 机缘 · 此关失败不跌境/.test(ritualCode), 'L1 按钮文案是「🔥 燃 30 机缘 · 此关失败不跌境」');

// ============================================================
section('L2 机缘抵的是跌境：燃过的失败不扣层，未燃的照扣');
// ============================================================
// 对照位：没燃机缘，失败必扣层
prepChar('大乘', 0);
W.startBreakthroughRitual();
ok(W.breakthroughState._fortuneShield === false, 'L2 对照位未燃机缘');
W.advanceBreakthroughStage(3);            // 真仪式在第 3 段掷成败，这里已锁死必败
ok(W.breakthroughState.isSuccess === false, 'L2 对照位真判失败');
ok(W.currentCharData.layer === 8, 'L2 对照位失败真扣了一层（9 → ' + W.currentCharData.layer + '）');
ok(W.currentCharData._debuffs.some(function (d) { return d.name === '修为倒退'; }),
    'L2 对照位抽到了「修为倒退」');

// 实验位：燃过机缘，同一段、同一个必败骰
prepChar('大乘', 30);
W.startBreakthroughRitual();
W.burnFortuneForBreakthrough();
W.advanceBreakthroughStage(3);
ok(W.breakthroughState.isSuccess === false, 'L2 实验位同样判失败');
ok(W.currentCharData.layer === 9,
    'L2 ★燃过机缘的失败不减 layer（仍 ' + W.currentCharData.layer + '，对照位已掉到 8）');
ok(!W.currentCharData._debuffs.some(function (d) { return d.name === '修为倒退'; }),
    'L2 燃过机缘时不再抽「修为倒退」那条副作用');
ok(W.currentCharData._debuffs.length > 0,
    'L2 别的副作用照旧会来（伤不是机缘买得掉的）：抽到「' +
    (W.currentCharData._debuffs[0] && W.currentCharData._debuffs[0].name) + '」');
W.breakthroughState.inProgress = false;

// ============================================================
section('L3 丹加成封顶：这一关丹最多抬基础率的一半');
// ============================================================
[
    { realm: '大乘', pill: 'pill_dacheng', bonus: 0.27 },
    { realm: '合体', pill: 'pill_hebi', bonus: 0.25 },
    { realm: '化神', pill: 'pill_huashen', bonus: 0.20 },
    { realm: '炼虚', pill: 'pill_xukong', bonus: 0.23 }
].forEach(function (c) {
    prepChar(c.realm, 0);
    var base = W.getBreakthroughRitualBaseRate(c.realm);
    W.startBreakthroughRitual();
    var bare2 = W.breakthroughState.successRate;
    W.breakthroughState.inProgress = false;

    W.currentCharData._breakthroughPillBonus = c.bonus;
    W.startBreakthroughRitual();
    var withPill = W.breakthroughState.successRate;
    var gained = withPill - bare2;

    ok(Math.abs(bare2 - base) < 1e-9, 'L3 ' + c.realm + ' 裸成功率 = 基准 ' + base);
    ok(gained <= base * 0.5 + 1e-9,
        'L3 ' + c.realm + ' 丹实际加入 ' + gained.toFixed(4) + ' ≤ 基础×0.5 = ' + (base * 0.5).toFixed(4));
    ok(Math.abs(gained - Math.min(c.bonus, base * 0.5)) < 1e-9,
        'L3 ' + c.realm + ' 封顶后 = min(标称 ' + c.bonus + ', ' + (base * 0.5).toFixed(4) + ') = ' +
        Math.min(c.bonus, base * 0.5).toFixed(4));
    ok(W.currentCharData._breakthroughPillBonus === 0, 'L3 ' + c.realm + ' bonus 读后归 0');
    W.breakthroughState.inProgress = false;
});
// 大乘那一例钉死数字：45% + 27% ≠ 72%
prepChar('大乘', 0);
W.startBreakthroughRitual();
var dBare = W.breakthroughState.successRate;
W.breakthroughState.inProgress = false;
W.currentCharData._breakthroughPillBonus = 0.27;
W.startBreakthroughRitual();
var dWith = W.breakthroughState.successRate;
ok(dBare < 0.45 + 1e-9, 'L3 ★大乘裸成功率 ' + dBare.toFixed(4) + ' ≤ 0.45');
ok(Math.abs((dWith - dBare) - 0.225) < 1e-9,
    'L3 ★大乘基础 0.45、丹标称 0.27，实际只加 +0.225（实得 +' + (dWith - dBare).toFixed(4) + '）');
ok(Math.abs(dWith - 0.675) < 1e-9, 'L3 大乘落点 = 67.5%（不再是 72%，实得 ' + dWith.toFixed(4) + '）');
ok(dWith < 1, 'L3 大乘吃满丹也到不了必成（' + dWith.toFixed(4) + ' < 1）');
W.breakthroughState.inProgress = false;
// 化神不触顶（真机口径：80%）
prepChar('化神', 0);
W.startBreakthroughRitual();
var hBare = W.breakthroughState.successRate;
W.breakthroughState.inProgress = false;
W.currentCharData._breakthroughPillBonus = 0.20;
W.startBreakthroughRitual();
ok(Math.abs(W.breakthroughState.successRate - 0.80) < 1e-9,
    'L3 化神 60% + 化神丹 20% 未触顶，仍是 80%（裸 ' + hBare.toFixed(2) + '）');
W.breakthroughState.inProgress = false;
// 面板不许印 +27% 而只给 22.5%——印出来的必须是这一关真能加的数
prepChar('大乘', 0);
W.currentCharData._breakthroughPillBonus = 0.27;
W.inventory.slots.unshift({ uid: 'dacheng', templateId: 'pill_dacheng', count: 1 });
W.startBreakthroughRitual();
ok(Math.abs(W.breakthroughState._pillCap - 0.225) < 1e-9,
    'L3 本关丹封顶值已记账 = ' + W.breakthroughState._pillCap.toFixed(4));
var pillHtml = W.__lastModalHtml || '';
ok(/大乘丹/.test(pillHtml), 'L3 面板列出了大乘丹');
ok(/\+22\.5%/.test(pillHtml) && /封顶/.test(pillHtml),
    'L3 ★面板印的是 +22.5%（封顶），不是 +27%——屏上不撒谎');
ok(!/\+27%/.test(pillHtml), 'L3 面板上不再出现兑现不了的 +27%');
W.breakthroughState.inProgress = false;
// 化神那一档不该被标封顶（0.20 < 0.30，仍是全额 20%）
prepChar('化神', 0);
W.inventory.slots.unshift({ uid: 'huashen', templateId: 'pill_huashen', count: 1 });
W.startBreakthroughRitual();
var hHtml = W.__lastModalHtml || '';
ok(/\+20%/.test(hHtml) && !/封顶/.test(hHtml), 'L3 化神丹 +20% 未触顶，面板不标封顶');
W.breakthroughState.inProgress = false;

// ============================================================
section('L4 后期不再更便宜：四条高境材料都在真物品表里');
// ============================================================
var HIGH = [
    { key: '化神→炼虚', id: 'mat_sky_iron', name: '天外玄铁', minEnergy: 88, minQi: 82 },
    { key: '炼虚→合体', id: 'mat_star_iron', name: '星辰铁', minEnergy: 90, minQi: 85 },
    { key: '合体→大乘', id: 'mat_dragon_crystal', name: '龙晶', minEnergy: 92, minQi: 88 },
    { key: '大乘→渡劫', id: 'mat_dragon_crystal', name: '龙晶', minEnergy: 95, minQi: 90 }
];
HIGH.forEach(function (h) {
    var req = W.BREAKTHROUGH_MATERIALS[h.key];
    ok(!!req, 'L4 材料键「' + h.key + '」已登记（此前落进空 default）');
    if (!req) return;
    ok(!!(req.items && req.items.length > 0), 'L4 ' + h.key + ' 至少要一件真材料');
    ok(req.items.some(function (i) { return i.id === h.id; }),
        'L4 ' + h.key + ' 要 ' + h.name + '（' + h.id + '）×1');
    req.items.forEach(function (i) {
        ok(!!W.itemById[i.id], 'L4 ' + h.key + ' 的 ' + i.id + ' 真在物品表里' +
            (W.itemById[i.id] ? '（' + W.itemById[i.id].name + '）' : ''));
        ok(String(i.name || '') === String((W.itemById[i.id] || {}).name || ''),
            'L4 ' + h.key + ' 的 ' + i.id + ' 名字与物品表一致（' + i.name + '）');
        ok(i.count >= 1, 'L4 ' + h.key + ' 的 ' + i.id + ' 数量 ≥1（实得 ' + i.count + '）');
    });
    ok(req.minEnergy === h.minEnergy && req.minQi === h.minQi,
        'L4 ' + h.key + ' 精力/真气门槛 = ' + h.minEnergy + '/' + h.minQi +
        '（实得 ' + req.minEnergy + '/' + req.minQi + '）');
    ok(req.minEnergy > 85 && req.minQi > 80, 'L4 ' + h.key + ' 门槛高过 元婴→化神（85/80）');
});
// 大乘→渡劫 要两件，且不是重复同一件
var dj = W.BREAKTHROUGH_MATERIALS['大乘→渡劫'];
ok(dj.items.length === 2, 'L4 大乘→渡劫 要两件（实得 ' + dj.items.length + '）');
ok(new Set(dj.items.map(function (i) { return i.id; })).size === 2, 'L4 大乘→渡劫 两件不同料');
// 逐境门槛单调不降
var keys = ['炼气→筑基', '筑基→金丹', '金丹→元婴', '元婴→化神',
    '化神→炼虚', '炼虚→合体', '合体→大乘', '大乘→渡劫'];
for (var i = 1; i < keys.length; i++) {
    var a = W.BREAKTHROUGH_MATERIALS[keys[i - 1]], b = W.BREAKTHROUGH_MATERIALS[keys[i]];
    ok(b.minEnergy >= a.minEnergy && b.minQi >= a.minQi,
        'L4 门槛不倒挂：' + keys[i - 1] + '(' + a.minEnergy + '/' + a.minQi + ') → ' +
        keys[i] + '(' + b.minEnergy + '/' + b.minQi + ')');
}
// 正常四关不再掉进空 default
keys.forEach(function (k) {
    ok(W.BREAKTHROUGH_MATERIALS[k] !== W.BREAKTHROUGH_MATERIALS['default'],
        'L4 ' + k + ' 有自己的条目，不是 default 兜底');
});
// 真闸门：材料缺一件就不放行（化神→炼虚 缺天外玄铁）
prepChar('化神', 0);
W.inventory.slots = [];
var msgs = [];
W.showMessage = function (m) { msgs.push(String(m)); };
W.startBreakthroughRitual();
ok(W.breakthroughState.inProgress === false, 'L4 缺天外玄铁时仪式不放行');
ok(msgs.join('|').indexOf('天外玄铁') >= 0, 'L4 屏上写明缺的是天外玄铁（' + msgs.join(' / ') + '）');
// 备齐即放行
restoreRoll();
prepChar('化神', 0);
W.startBreakthroughRitual();
ok(W.breakthroughState.inProgress === true, 'L4 备齐天外玄铁后仪式放行（inProgress = true）');
ok(W.breakthroughState.targetRealm === '炼虚', 'L4 目标是炼虚');
W.breakthroughState.inProgress = false;
forceFailRoll();

// ============================================================
section('L5 小境界成功率一个数都没动');
// ============================================================
var bsys = stripComments(loadScript('js/cultivation/breakthrough-system.js'));
['if (ratio < 0.3) return 0.20;', 'if (ratio < 0.5) return 0.30;', 'if (ratio < 0.7) return 0.40;',
    'if (ratio < 0.9) return 0.50;', 'return 0.60;'].forEach(function (line) {
    ok(bsys.indexOf(line) >= 0, 'L5 标准路径五档未改：' + line);
});
ok(/Math\.min\(0\.95, Math\.max\(0\.05, rate\)\)/.test(bsys), 'L5 标准路径闸仍是 [0.05, 0.95]');
ok(/rate \*= realmPenalty/.test(bsys), 'L5 标准路径境界惩罚乘法仍在');
// 小境界路径仍不吃丹（第二参数恒空数组）
ok(/calculateBreakthroughRate\(charData, \[\]\)/.test(bsys), 'L5 标准路径仍旧不吃丹');
// 真跑一遍五档
[[10, 100, 0.20], [40, 100, 0.30], [60, 100, 0.40], [80, 100, 0.50], [95, 100, 0.60]].forEach(function (c) {
    ok(Math.abs(W.getBaseSuccessRate(c[0], c[1]) - c[2]) < 1e-9,
        'L5 getBaseSuccessRate(' + c[0] + ',' + c[1] + ') = ' + c[2] +
        '（实得 ' + W.getBaseSuccessRate(c[0], c[1]) + '）');
});
ok(Math.abs(W.getBaseSuccessRate(0, 0) - 0.60) < 1e-9, 'L5 requiredTempering ≤ 0 时仍兜 0.60');
// 仪式的基准斜线也一字未动
ok(/0\.8 - \(currentIndex \* 0\.05\)/.test(ritualCode), 'L5 仪式基准斜线仍是 0.8 − 境界序×0.05');
ok(/return 0\.8 - \(idx \* 0\.05\)/.test(ritualCode), 'L5 getBreakthroughRitualBaseRate 仍是同一把尺');
ok(/Math\.min\(0\.95, Math\.max\(0\.1, baseRate\)\)/.test(ritualCode), 'L5 仪式闸仍是 [0.1, 0.95]');
// 九境基准率逐档一个没变
var BASES = [0.80, 0.75, 0.70, 0.65, 0.60, 0.55, 0.50, 0.45, 0.40];
W.BREAKTHROUGH_REALM_ORDER.forEach(function (r, i) {
    ok(Math.abs(W.getBreakthroughRitualBaseRate(r) - BASES[i]) < 1e-9,
        'L5 ' + r + ' 基准率仍 ' + BASES[i] + '（实得 ' + W.getBreakthroughRitualBaseRate(r) + '）');
});

restoreRoll();

// ============================================================
console.log('\n========== 后期突破·形状收口 ==========');
console.log('通过 ' + passed + ' / 失败 ' + failed);
process.exit(failed ? 1 : 0);