/**
 * pill-mainpath-node.js —「突破丹在 88.9% 的突破里不吃」的计算层收口断言
 *
 * 病机（改动前逐行核过）：
 *   · breakthrough-system.js:213 恒传空数组 `calculateBreakthroughRate(charData, [])`
 *   · 那张加成表的键写着 peiyuan_dan 一类简写，而真物品 id 是 pill_peiyuan（items-extended/01-pills.js:25-38）
 *     ⇒ 就算真把丹名传进来也是 +0，且一声不响（静默失配）
 *   · 服丹的账走 charData._breakthroughPillBonus，唯一读点是仪式的 breakthrough-ritual.js:258，
 *     而仪式只管大境界跃迁（ritual:176）⇒ 小境界这条路不吃丹是**刻意**的（pill-usable-node.js:321 钉着）
 *
 * 本文件验四件事：
 *   A 键名对得上 —— 加成表的键 ⊆ 真物品 id，且每张丹的加成与物品表 effect.breakthrough_bonus 逐项相同
 *   B 不骗玩家 —— 小境界突破的确认框写明「服丹无效」，且这句话是真话（丹账既不读也不消耗）
 *   C 无新骰   —— Math.random 总数与改前相同；空数组调用不再白摇骰；悟道丹恰好摇一颗
 *   D 无数值变更 —— 各丹加成数字逐项钉死 + 成功率老阶梯/封顶闸一个没动
 *
 * 运行：node tests/pill-mainpath-node.js
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
function stripComments(src) {
    return String(src)
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/(^|[^:\\])\/\/.*$/gm, function (m, p1) { return p1; });
}

// ============================================================
// 世界桩
// ============================================================
var randCalls = 0;
var RealMath = Math;
var MathProxy = Object.create(Math);
MathProxy.random = function () { randCalls++; return RealMath.random(); };

var confirmText = null;
var confirmAnswer = true;
var messages = [];

var W = {
    console: { log: function () {}, warn: function () {}, error: function () {} },
    setTimeout: function () { return 0; }, clearTimeout: function () {},
    setInterval: function () { return 0; }, clearInterval: function () {},
    localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
    document: {
        createElement: function (tag) {
            return {
                tagName: String(tag).toUpperCase(), style: {}, dataset: {}, innerHTML: '', textContent: '',
                classList: { add: function () {}, remove: function () {}, contains: function () { return false; } },
                appendChild: function () {}, removeChild: function () {}, remove: function () {},
                addEventListener: function () {}, setAttribute: function () {}, getAttribute: function () { return null; },
                querySelector: function () { return null; }, querySelectorAll: function () { return []; },
                closest: function () { return null; }, focus: function () {}
            };
        },
        getElementById: function () { return null; },
        querySelector: function () { return null; },
        querySelectorAll: function () { return []; },
        addEventListener: function () {},
        body: { appendChild: function () {}, innerHTML: '' },
        head: { appendChild: function () {}, innerHTML: '' },
        documentElement: { style: {} }
    },
    alert: function () {},
    confirm: function (msg) { confirmText = String(msg); return confirmAnswer; },
    Math: MathProxy,
    inventory: { currency: { spiritStones: 0, copper: 0 }, slots: [] },
    currentCharData: null
};
W.window = W;
W.self = W;
W.globalThis = W;
W.EventBus = { emit: function () {}, on: function () {} };
W.StateRegistry = { register: function () {} };
W.showMessage = function (m) { messages.push(String(m)); };
W.updateCharacterStatus = function () {};
W.updateInventoryUI = function () {};
W.showEffect = function () {};
W.doAutoSave = function () {};
W.timeSystem = { advanceTime: function () {} };
W.MoodSystem = { breakthroughBonus: function () { return 0; } };
W.hasOwnProperty = Object.prototype.hasOwnProperty;

vm.createContext(W);
var perm = new Proxy({}, {
    get: function (t, k) {
        if (k in t) return t[k];
        if (k === Symbol.toPrimitive) return function () { return 0; };
        if (typeof k === 'symbol') return undefined;
        return perm;
    },
    has: function () { return true; }
});
function load(rel) {
    try { vm.runInContext(loadScript(rel), W, { filename: rel }); }
    catch (e) {
        if (e instanceof ReferenceError) { vm.runInContext('window.__perm = __perm;', W); return; }
        throw e;
    }
}

// 与 pill-usable-node.js 同一条装配路径：真物品表 + 真境界表 + 真突破系统 + 真仪式路由
load('js/items.js');
['01-pills', '02-weapons', '03-armor', '04-materials', '05-talismans', '06-arts', '07-food', '08-special']
    .forEach(function (f) { load('js/items-extended/' + f + '.js'); });
load('js/items-extended.js');
load('js/data.js');
load('js/cultivation/breakthrough-system.js');
load('js/cultivation/breakthrough-ritual.js');

var ITEM_BY_ID = W.itemById || {};
var REALM_TABLE = (W.REALM_CONFIG && W.REALM_CONFIG.realms) || [];
var TBL = W.BREAKTHROUGH_PILL_BONUS;
var ALIAS = W.BREAKTHROUGH_PILL_LEGACY_ALIAS || {};

// 改动前那张表的数字（本文件 D 段逐项钉死的就是这份清单，一个数都没动）
var PRE_FIX_NUMBERS = {
    'pill_peiyuan': 0.10,   // 原 peiyuan_dan: 0.10
    'pill_zhuji': 0.12,     // 原 zhuji_dan: 0.12
    'pill_ningyuan': 0.15,  // 原 ningyuan_dan: 0.15
    'pill_jieying': 0.18,   // 原 jieying_dan: 0.18
    'pill_huashen': 0.20,   // 原 huashen_dan: 0.20
    'pill_pojing': 0.10     // 原 pojing_dan: 0.10
};
var PRE_FIX_WUDAO = '5~15%随机';   // 原 wudao_dan: 0.05 + Math.random() * 0.10
var PRE_FIX_ALIAS_KEYS = ['peiyuan_dan', 'zhuji_dan', 'ningyuan_dan', 'jieying_dan',
    'huashen_dan', 'pojing_dan', 'wudao_dan'];

// ============================================================
section('A 键名对得上：加成表的键 ⊆ 真物品 id');
// ============================================================
ok(!!TBL, 'A1 加成表挂上了 window（否则又是一张查不到的死表）');
var tblKeys = Object.keys(TBL || {});
ok(tblKeys.length === 7, 'A2 加成表 7 个键（实得 ' + tblKeys.length + '）');
tblKeys.forEach(function (k) {
    ok(/^pill_/.test(k), 'A3 键是真物品前缀 pill_*：' + k);
    ok(!!ITEM_BY_ID[k], 'A4 物品表里真有 ' + k + (ITEM_BY_ID[k] ? '' : '（查无此物⇒静默失配）'));
});
// 旧简写键名不得留在主表里（它们只能待在别名表）
PRE_FIX_ALIAS_KEYS.forEach(function (k) {
    ok(!Object.prototype.hasOwnProperty.call(TBL, k), 'A5 旧键名 ' + k + ' 不再占主表（那是没改全的化石，不是第二套系统）');
    ok(ALIAS[k] && /^pill_/.test(ALIAS[k]), 'A5 旧键名 ' + k + ' 只作为别名存在，指向 ' + ALIAS[k]);
    ok(ALIAS[k] && Object.prototype.hasOwnProperty.call(TBL, ALIAS[k]),
        'A5 ' + k + ' 的别名指向主表里真实存在的键（' + ALIAS[k] + '）');
});
// 每张丹的加成与物品表自己写的 effect.breakthrough_bonus 逐项相同（数值既没改、也没与物品脱节）
tblKeys.forEach(function (k) {
    var t = ITEM_BY_ID[k];
    var itemBB = t && t.effect && t.effect.breakthrough_bonus;
    ok(itemBB !== undefined && itemBB === TBL[k],
        'A6 ' + k + ' 加成与物品表 effect.breakthrough_bonus 同值（物品 ' + JSON.stringify(itemBB) + ' / 表 ' + JSON.stringify(TBL[k]) + '）');
});
// 控制组：真 id 传进去真的加得到数（旧键名时代这里是 +0）
var cd0 = { realm: '筑基', layer: 1, tempering: 70, _failedBreakthroughs: 0 };
var REALM_PENALTY = 1 - (W.getRealmIndex(cd0.realm) * 0.03);
// 境界惩罚是乘法且在丹药之后生效 ⇒ 一张丹在成功率上的净增是 bonus × 境界惩罚，不是 bonus 本身
function netGain(pillValue) { return pillValue * REALM_PENALTY; }
var rNone = W.calculateBreakthroughRate(cd0, []);
var rReal = W.calculateBreakthroughRate(cd0, ['pill_huashen']);
ok(Math.abs((rReal - rNone) - netGain(0.20)) < 1e-9,
    'A7 传真 id pill_huashen 真的加到 +20%（净增 +' + (rReal - rNone).toFixed(4) + '，期望 +' + netGain(0.20).toFixed(4) + '）');
// 对照：不在物品表里的 id 不许凭空加数
var rFake = W.calculateBreakthroughRate(cd0, ['pill_not_a_real_item']);
ok(Math.abs(rFake - rNone) < 1e-9, 'A8 陌生 id 加不到数（净增 ' + (rFake - rNone).toFixed(4) + '）');
PRE_FIX_ALIAS_KEYS.forEach(function (legacy) {
    var rl = W.calculateBreakthroughRate(cd0, [legacy]);
    var rr = W.calculateBreakthroughRate(cd0, [ALIAS[legacy]]);
    ok(typeof rl === 'number' && typeof rr === 'number',
        'A9 旧键 ' + legacy + ' 仍解析得数（别名不是死键，wave73 的封顶断言靠它）');
    if (legacy !== 'wudao_dan') {
        ok(Math.abs(rl - rr) < 1e-9, 'A9 旧键 ' + legacy + ' 与新键同值（别名没偷改数字）');
    }
});
// A10 反向自查：物品表里那些**本表本来就没有**的丹（虚空/合体/大乘，是 v9.7 之后加的）不许被悄悄塞进本表
['pill_xukong', 'pill_hebi', 'pill_dacheng'].forEach(function (k) {
    ok(!Object.prototype.hasOwnProperty.call(TBL, k),
        'A10 ' + k + ' 未被顺手加进加成表（本批不新增数值；补齐它属内容决策，另立项）');
});

// ============================================================
section('B 不骗玩家：小境界服丹无效这句话写明了，而且是真话');
// ============================================================
function readyChar(over) {
    var cd = { realm: '化神', layer: 1, essence: 0, tempering: 0, qi: 0, maxQi: 0, energy: 100, spiritualRoots: null };
    var idx = W.getRealmIndex(cd.realm);
    cd.essence = W.getEssenceRequired(idx, cd.layer) + 10;
    cd.tempering = W.getTemperingRequired(idx, cd.layer) + 10;
    cd.maxQi = W.getQiMax(idx, cd.layer);
    cd.qi = Math.ceil(cd.maxQi * 0.8) + 5;
    if (over) Object.keys(over).forEach(function (k) { cd[k] = over[k]; });
    return cd;
}
// B1 走真实路由（performBreakthrough → 仪式:803 分流 → _performBreakthroughNew），读它弹出的确认框
W.currentCharData = readyChar({ _breakthroughPillBonus: 0.20 });
confirmText = null; confirmAnswer = true;
W.performBreakthrough();
ok(!!confirmText, 'B1 小境界突破弹出了确认框');
ok(!!confirmText && confirmText.indexOf('成功率：') >= 0, 'B1 确认框照旧印成功率（没把老信息挤掉）');
ok(!!confirmText && confirmText.indexOf('失败惩罚：真元损失') >= 0, 'B1 确认框照旧印失败惩罚');
ok(!!confirmText && confirmText.indexOf('服丹无效') >= 0,
    'B1 ★确认框写明「小境界突破服丹无效」（屏上不再只有一串数字）');
ok(!!confirmText && confirmText.indexOf('20%') >= 0,
    'B1 已服的那份被点名（实得：' + (confirmText || '').replace(/\n/g, ' | ') + '）');
ok(!!confirmText && confirmText.indexOf('仍挂账') >= 0, 'B1 写明丹账仍挂账、不消耗');
// B2 没服过丹时也要说清楚（不能只在有账时才解释）
W.currentCharData = readyChar();
confirmText = null;
W.performBreakthrough();
ok(!!confirmText && confirmText.indexOf('服丹无效') >= 0, 'B2 未服丹时同样写明此境服丹无效');
// B3 「不吃丹」是真话：小境界突破的成功率不因挂账而变（刻意不吃丹是契约，不是漏写）
var rateNoPill = W.calculateBreakthroughRate(readyChar(), []);
var rateBanked = W.calculateBreakthroughRate(readyChar({ _breakthroughPillBonus: 0.35 }), []);
ok(Math.abs(rateNoPill - rateBanked) < 1e-12,
    'B3 小境界成功率不吃挂账（' + rateNoPill.toFixed(4) + ' vs ' + rateBanked.toFixed(4) + '）——仪式的账不在这里兑现');
// B4 「仍挂账」也是真话：走完一次小境界突破，挂账一个数都没少
W.currentCharData = readyChar({ _breakthroughPillBonus: 0.20 });
confirmAnswer = true;
var layerBefore = W.currentCharData.layer;
W.performBreakthrough();
ok(Math.abs((W.currentCharData._breakthroughPillBonus || 0) - 0.20) < 1e-12,
    'B4 小境界突破后挂账没被吞（实得 ' + W.currentCharData._breakthroughPillBonus + '）——界面那句「仍挂账」不骗人');
// B5 取消仍然什么都不做（确认框的老契约没被这次加字改坏）
W.currentCharData = readyChar({ _breakthroughPillBonus: 0.20 });
var realmBefore = W.currentCharData.realm, layerBefore2 = W.currentCharData.layer;
confirmAnswer = false;
var ret = W.performBreakthrough();
confirmAnswer = true;
ok(ret === false, 'B5 点取消返回 false');
ok(W.currentCharData.realm === realmBefore && W.currentCharData.layer === layerBefore2,
    'B5 点取消境界层数一个都没动');
// B6 唯一读点仍在仪器那边（这条断言是给下一个人的护栏：别把小境界改成吃丹而不改这里）
var ritualSrc = stripComments(loadScript('js/cultivation/breakthrough-ritual.js'));
ok(/_breakthroughPillBonus\) \{ baseRate \+= _cd14\._breakthroughPillBonus; _cd14\._breakthroughPillBonus = 0; \}/.test(ritualSrc),
    'B6 仪式的丹账读点未被本文件挪走（仍在 breakthrough-ritual.js）');
var sysSrc = stripComments(loadScript('js/cultivation/breakthrough-system.js'));
ok(!/_breakthroughPillBonus\s*\+?=/.test(sysSrc.replace(/_breakthroughPillBonus = BREAKTHROUGH_PILL_LEGACY_ALIAS\[[^\]]*\][^;]*;/, '')),
    'B6 标准突破路径不读也不清 _breakthroughPillBonus');
ok(/calculateBreakthroughRate\(charData, \[\]\)/.test(sysSrc),
    'B6 第二个参数仍是空数组（小境界不吃丹是契约，pill-usable-node.js:321 同款钉法）');

// ============================================================
section('C 无新骰');
// ============================================================
var srcRaw = loadScript('js/cultivation/breakthrough-system.js');
// 数骰只数代码，不数注释（注释里为了说明问题会写出旧写法，那是记录不是机制）
var randTotal = (sysSrc.match(/Math\.random/g) || []).length;
ok(randTotal === 3, 'C1 全文件 Math.random 仍是 3 处（悟道丹随机档 / 突破成败判定 / 心魔触发概率，改前也是 3；实得 ' + randTotal + '）');
var rateStart = sysSrc.indexOf('function calculateBreakthroughRate');
var rateEnd = sysSrc.indexOf('function performBreakthrough');
ok(rateStart >= 0 && rateEnd > rateStart, 'C2 成功率的函数区间切得出来');
var rateBody = sysSrc.slice(rateStart, rateEnd);
ok((rateBody.match(/Math\.random/g) || []).length === 0,
    'C2 成功率函数体内一颗骰都不摇（改前那张表字面量每进一次就白摇一颗，与有没有吃丹无关）');
// 摇骰计数（用桩 Math 数真调用次数）
randCalls = 0;
W.calculateBreakthroughRate(readyChar(), []);
ok(randCalls === 0, 'C3 空数组调用摇骰 0 次（实得 ' + randCalls + '）');
randCalls = 0;
W.calculateBreakthroughRate(readyChar(), ['pill_huashen']);
ok(randCalls === 0, 'C3 数值档丹摇骰 0 次（实得 ' + randCalls + '）');
randCalls = 0;
var wd = W.calculateBreakthroughRate(cd0, ['pill_wudao']);
ok(randCalls === 1, 'C3 悟道丹（随机档）恰好摇 1 颗（实得 ' + randCalls + '）');
var wdGain = wd - rNone;
ok(wdGain >= netGain(0.05) - 1e-9 && wdGain <= netGain(0.15) + 1e-9,
    'C3 悟道丹净增落在 5~15% 的境界惩罚折算区间（实得 +' + wdGain.toFixed(4) + '）');

// ============================================================
section('D 无数值变更');
// ============================================================
Object.keys(PRE_FIX_NUMBERS).forEach(function (k) {
    ok(TBL[k] === PRE_FIX_NUMBERS[k],
        'D1 ' + k + ' 加成仍是 ' + PRE_FIX_NUMBERS[k] + '（实得 ' + TBL[k] + '）');
});
ok(TBL['pill_wudao'] === PRE_FIX_WUDAO,
    'D1 悟道丹仍是 5~15% 随机档（实得 ' + JSON.stringify(TBL['pill_wudao']) + '）');
['if (ratio < 0.3) return 0.20;', 'if (ratio < 0.5) return 0.30;', 'if (ratio < 0.7) return 0.40;',
    'if (ratio < 0.9) return 0.50;', 'return 0.60;'].forEach(function (line) {
    ok(sysSrc.indexOf(line) >= 0, 'D2 基础成功率五档阶梯未改：' + line);
});
ok(/rate \+= Math\.min\(0\.15, failures \* 0\.05\)/.test(sysSrc), 'D2 失败次数补偿仍是 min(0.15, 次×0.05)');
ok(/const realmPenalty = 1 - \(realmIndex \* 0\.03\)/.test(sysSrc), 'D2 境界惩罚仍是 1 - 境界序×0.03');
ok(/return Math\.min\(0\.95, Math\.max\(0\.05, rate\)\)/.test(sysSrc), 'D2 封顶闸仍是 [0.05, 0.95]');
ok(/const roll = Math\.random\(\);/.test(sysSrc) && /const success = roll < rate;/.test(sysSrc),
    'D2 成败判定仍是 roll < rate（未动全局数值缩放）');
// 界内一境界的实测口径：服丹前后的成功率逐位相同（最硬的一条：数字没动过）
var probe = { realm: '化神', layer: 3, tempering: 12, qi: 200, maxQi: 400, essence: 0, _failedBreakthroughs: 1, _heartDemonBonus: 0.05 };
ok(Math.abs(W.calculateBreakthroughRate(probe, []) - W.calculateBreakthroughRate(probe, ['pill_huashen'])) > 1e-12,
    'D3 对照：真 id 传进去确实会改率（否则上面那条「没动数字」就成自证）');

// ============================================================
console.log('\n========== 突破丹主路：键名 + 界面 + 无新骰 + 无数值变更 ==========');
console.log('通过 ' + passed + ' / 失败 ' + failed);
process.exit(failed ? 1 : 0);