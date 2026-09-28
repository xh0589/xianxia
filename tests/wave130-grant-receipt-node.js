/**
 * wave130-grant-receipt-node.js — 第一百三十批 · 「发奖认实收＋原因账」同族收口
 *
 * 覆盖（全部真调沙箱，不是读码档）：
 *   A city-depth 黄金宫货架：满包退单要退款＋念真原因；查无此号不许怪给行囊（DES-90）
 *   B city-depth 剑冢试拔：没接住不许立「已认主」旗，回执按原因账分流
 *   C city-depth 试炼塔第五层赐药：三档念数（全收／部分／一件没进），不许滑进「塔梯加长」那句
 *   D qi-arc2 暴涨①阵眼灵石：模态那句「得关键道具」只认真收（DES-72/89）
 *   E qi-arc3 三叩门两坛酒：日志的「得某物」按实收改口
 *   F inventory.initInventory：没落袋的初始件要有人知道
 *   G 改前复现：把 grantItem 换回旧写法（布尔压平），同一世界同一原因账下它撒的谎要印出来
 *   H 形状棘轮：本批接进原因账的点位标记数（只准增）＋ NPC 赠礼那一段的交付回执形态
 *
 * 运行：node tests/wave130-grant-receipt-node.js
 */
'use strict';

var fs = require('fs');
var vm = require('vm');
var path = require('path');
var ROOT = path.resolve(__dirname, '..');

var 通 = 0, 红 = [];
function ok(cond, label) { 通 += cond ? 1 : 0; if (!cond) 红.push(label); console.log((cond ? '  ✓ ' : '  ✗ ') + label); }
function load(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// ============ 世界桩：一件「有实收、有原因账」的背包 ============
// 口径与 js/inventory.js 一致：模板缺失返回 false 并记 no_template；一件没进记 bag_full；返回值＝实收件数
function 造世界(模式) {                       // 'ok' | 'full' | 'ghost'
    var W = {
        console: { log: function () {}, warn: function () {} },
        Math: Math, JSON: JSON, Object: Object, Array: Array, Date: Date, String: String,
        Number: Number, Boolean: Boolean, isFinite: isFinite, parseInt: parseInt, parseFloat: parseFloat, RegExp: RegExp,
        itemById: {
            mat_gold_sand: { id: 'mat_gold_sand', name: '金砂一両', type: 'material', stackable: true, price: 40 },
            mat_pearl: { id: 'mat_pearl', name: '南海海珠', type: 'material', stackable: true, price: 100 },
            foundation_pill: { id: 'foundation_pill', name: '筑基丹', type: 'consumable', price: 300 },
            wpn_dark_iron_sword: { id: 'wpn_dark_iron_sword', name: '玄铁剑', type: 'equipment', price: 200 },
            vitality_pill: { id: 'vitality_pill', name: '回春丹', type: 'consumable', price: 40 },
            qi_her_wine: { id: 'qi_her_wine', name: '她的一坛酒', type: 'material', price: 0 },
            qi_window_wine: { id: 'qi_window_wine', name: '窗台的酒坛', type: 'material', price: 0 },
            qi_half_array_stone: { id: 'qi_half_array_stone', name: '半块阵眼灵石', type: 'material', price: 0 }
        },
        allItems: [], materials: [],
        msgs: [], logs: [], modals: [], added: [],
        showMessage: function (t) { W.msgs.push(String(t)); },
        gameLog: { add: function (m) { W.logs.push(String(m)); } },
        showModal: function (title, body) { W.modals.push(String(title) + '|' + String(body)); },
        updateStatusPanel: function () {},
        addFame: function () {},
        timeSystem: { getAbsoluteDay: function () { return 500; }, advanceTime: function () {}, onNewDaySubscribe: function () {} },
        currentCharData: { name: '测试', realm: '筑基', layer: 3, spiritStones: 1000, copper: 500, energy: 100, essence: 0, tempering: 0, mood: 50, qi: 100, health: 100, fame: 0 },
        inventory: { currency: { spiritStones: 1000 } },
        updateCurrencyUI: function () {},
        StateRegistry: { register: function () {} }
    };
    W.window = W;
    // qi-arc2 那一类手搓模态不走 showModal，直接 document.body.insertAdjacentHTML——撕掉标签按同一口径落进 W.modals
    W.document = {
        getElementById: function () { return null; },
        querySelector: function () { return null; },
        querySelectorAll: function () { return []; },
        createElement: function () { return { style: {}, classList: { add: function () {}, remove: function () {} }, appendChild: function () {} }; },
        body: {
            appendChild: function () {},
            insertAdjacentHTML: function (pos, html) { W.modals.push(String(html).replace(/<[^>]*>/g, '')); }
        },
        addEventListener: function () {}, readyState: 'complete'
    };
    W.XianXia = {
        // 真实页面里 global-utils.js 把 window.showMessage 转接到这里——桩缺了它，msg() 那行就抛
        showMessage: function (t) { W.msgs.push(String(t)); },
        DataManager: {
            getSpiritStones: function () { return W.currentCharData.spiritStones; },
            addSpiritStones: function (n) { W.currentCharData.spiritStones += n; },
            deductSpiritStones: function (n) {
                if (W.currentCharData.spiritStones < n) return false;
                W.currentCharData.spiritStones -= n; return true;
            }
        }
    };
    W.addItem = function (id, n) {
        n = Math.max(1, Math.floor(Number(n) || 1));
        if (!W.itemById[id]) { W.addItemFailReason = 'no_template'; return false; }
        if (模式 === 'full') { W.addItemFailReason = 'bag_full'; return 0; }
        if (模式 === 'ghost') { W.addItemFailReason = 'no_template'; return false; }
        W.addItemFailReason = null;
        W.added.push(id + '×' + n);
        return n;
    };
    W.addItemToInventory = W.addItem;
    // 【第一百三十九批·按「钉法」把桩补齐，不是把要求改松】
    // 说话手分两对：addItemFailText/addItemReasonText 是**句尾位**（带句号），
    // addItemFailPhrase/addItemReasonPhrase 是**从句位**（括号内、句子中段，**不带句号**）。
    // 本批把一批 helper 从句尾支换成了从句支（原先它们返回值带句号，拼进中段会读成
    // 「再来。）」「再来。」这种破句 DES-97）——所以这个沙箱桩必须**照真口径**把从句支也装上，
    // 否则生产码走 `typeof W.addItemFailPhrase === 'function'` 判 false 直接吃中性回退，
    // 账明明写着 bag_full，屏上却念不出「行囊已满」——那是桩在骗人，不是生产码的错。
    // 钉子的要求（A5/A9/B4/C2/D3 要看到「行囊已满」、A11 要看到「查无此号」且不许看到「行囊已满」）
    // **一个字未松**，只是让桩能真正答出这句话。
    W.addItemFailText = function (label) {
        if (W.addItemFailReason === 'no_template') {
            return (label || '那件东西') + '在百宝册上查无此号——是这件东西没有名目，不是你的行囊满了。';
        }
        if (W.addItemFailReason === 'bag_full') return '行囊已满，先腾个格子再来。';
        return '';
    };
    W.addItemFailPhrase = function (label) {
        if (W.addItemFailReason === 'no_template') return (label || '那件东西') + '在百宝册上查无此号';
        if (W.addItemFailReason === 'bag_full') return '行囊已满，先腾个格子再来';
        return '';
    };
    W.addItemReasonText = function (label) {
        if (W.addItemFailReason === 'no_template') {
            return (label || '那件东西') + '在百宝册上查无此号——是这件东西没有名目，不是你的行囊满了。';
        }
        if (W.addItemFailReason === 'bag_full') return '行囊已满，先腾个格子再来。';
        return '没能落进你的行囊。';
    };
    W.addItemReasonPhrase = function (label) {
        if (W.addItemFailReason === 'no_template') return (label || '那件东西') + '在百宝册上查无此号';
        if (W.addItemFailReason === 'bag_full') return '行囊已满，先腾个格子再来';
        return '没能落进你的行囊';
    };
    W.addItemFailTextFor = function (reason, label) { W.addItemFailReason = reason; return W.addItemFailText(label); };
    W.addItemReasonTextFor = function (reason, label) { W.addItemFailReason = reason; return W.addItemReasonText(label); };
    W.addItemFailPhraseFor = function (reason, label) { W.addItemFailReason = reason; return W.addItemFailPhrase(label); };
    W.addItemReasonPhraseFor = function (reason, label) { W.addItemFailReason = reason; return W.addItemReasonPhrase(label); };
    return W;
}

function 装(W, rel) { vm.runInContext(load(rel), W, { filename: rel }); }

// global-utils 载入时会把 showMessage/showModal 覆写成 DOM 渲染版（未 init 的消息只进内部队列），
// 沙箱没 document → 探针读空。装完它必须把这两个入口指回 W.msgs / W.modals，屏上口径不变。
function 接管UI(W) {
    W.XianXia.showMessage = function (t) { W.msgs.push(String(t)); };
    W.showModal = function (title, body) { W.modals.push(String(title) + '|' + String(body)); };
}
function 装全局(W) { 装(W, 'js/global-utils.js'); 接管UI(W); }

// ============ A city-depth 黄金宫货架 ============
console.log('\n[A] city-depth · 买货满包退单（DES-86/90）');
{
    // 公共手在册的世界（真实页面就是这一支）
    var W = 造世界('full');
    vm.createContext(W);
    装全局(W);
    W.giveWithReceipt('foundation_pill', 1, { quiet: true });   // 先摸一次原因账，确认桩可用
    W.addItemFailReason = null; W.added = []; W.msgs = [];
    装(W, 'js/city-depth.js');
    var 石0 = W.currentCharData.spiritStones;
    var 成 = W.CityDepth.buyWare('gold', 2);                     // 筑基丹 450 灵石
    ok(成 === false, 'A1 满包时这一单不成（现读 ' + 成 + '）');
    ok(W.currentCharData.spiritStones === 石0, 'A2 货款原样退回，一分不亏（' + 石0 + '→' + W.currentCharData.spiritStones + '）');
    ok(W.added.length === 0, 'A3 货确实一件没发（避免退了钱又发了货）');
    var 句 = W.msgs.join('\n');
    ok(/灵石原样退回/.test(句), 'A4 回执说到退款：' + 句.slice(0, 80));
    ok(/行囊已满/.test(句) && !/查无此号/.test(句), 'A5 满包那档念满包（原因账分流正确）');

    // 模板缺失那一档：不许再怪给行囊
    var V = 造世界('ok'); vm.createContext(V);
    装全局(V);
    V.addItemFailReason = null; V.msgs = []; V.added = [];
    装(V, 'js/city-depth.js');
    var 石1 = V.currentCharData.spiritStones;
    var 成2 = V.CityDepth.buyWare('gold', 99);                   // 无此条目 → 直接拒（不动钱）
    ok(成2 === false && V.currentCharData.spiritStones === 石1, 'A6 货架上没这一号：不发货也不动钱（DES-63 的账还在）');

    // 幽灵号（有钱单、库里没模板）：走 addItem 的 no_template 支
    var G = 造世界('ok'); vm.createContext(G);
    装全局(G);
    G.addItemFailReason = null; G.msgs = [];
    装(G, 'js/city-depth.js');
    G.CityDepth.buyWare('gold', 0);                              // 金砂：正常世界该成
    ok(G.added.indexOf('mat_gold_sand×1') >= 0, 'A7 空手能进货（对照组：同一支笔不是永远失败）');

    // 没有公共手的世界：grantItem 的兜底支（Number(addItem)）也要认实收
    var N = 造世界('full'); vm.createContext(N);
    装(N, 'js/city-depth.js');
    N.msgs = [];
    var 石2 = N.currentCharData.spiritStones;
    ok(N.CityDepth.buyWare('gold', 2) === false && N.currentCharData.spiritStones === 石2,
        'A8 无公共手世界：兜底支照样退款（现读 钱=' + N.currentCharData.spiritStones + '/' + 石2 + '）');
    ok(/行囊已满/.test(N.msgs.join('\n')), 'A9 兜底支的回执也接了原因账（读码＋真调双证）');

    // 模板缺失：不许一口咬定是玩家的格子
    var H = 造世界('ok'); vm.createContext(H);
    装全局(H);
    H.msgs = []; H.added = [];
    装(H, 'js/city-depth.js');
    delete H.itemById.foundation_pill;                            // 货架上的号在册外（DES-91 那一族）
    var 石3 = H.currentCharData.spiritStones;
    ok(H.CityDepth.buyWare('gold', 2) === false, 'A10 查无此号的货不发（且退款）');
    var 句2 = H.msgs.join('\n');
    ok(/查无此号/.test(句2) && !/行囊已满/.test(句2), 'A11 归因分流：这单说的是「没名目」，不是「你包满了」——' + 句2.slice(0, 90));
    ok(H.currentCharData.spiritStones === 石3, 'A12 钱原路退回');
}

// ============ B city-depth 剑冢试拔 ============
console.log('\n[B] city-depth · 古剑没接住不许立旗（DES-72/89）');
{
    var W = 造世界('full'); vm.createContext(W);
    装全局(W); 装(W, 'js/city-depth.js');
    W.CityDepth.progress().swordIntent = 30;
    W.msgs = [];
    var 成 = W.CityDepth.swordPull({ randomSource: function () { return 0; } });   // 必胜档
    ok(成 === false, 'B1 行囊满：拔剑这一手不成');
    ok(W.CityDepth.progress().hasAncientSword === false, 'B2 「已认主」旗没立起来（改前会立）');
    ok(/缩回土里/.test(W.msgs.join('\n')), 'B3 回执说清剑又回去了：' + (W.msgs[W.msgs.length - 1] || '').slice(0, 70));
    ok(/行囊已满/.test(W.msgs.join('\n')), 'B4 原因账接上了（满包那档）');

    var V = 造世界('ok'); vm.createContext(V);
    装全局(V); 装(V, 'js/city-depth.js');
    V.CityDepth.progress().swordIntent = 30; V.msgs = [];
    ok(V.CityDepth.swordPull({ randomSource: function () { return 0; } }) === true, 'B5 对照组：腾得开格子就真认主');
    ok(V.CityDepth.progress().hasAncientSword === true, 'B6 对照组旗立得住');
}

// ============ C city-depth 试炼塔赐药三档 ============
console.log('\n[C] city-depth · 第五层赐药念实收（DES-72）');
{
    function 上五层(W) {
        W.CityDepth.progress().trialFloor = 4;
        W.currentCharData.energy = 100; W.currentCharData.spiritStones = 1000;
        W.msgs = [];
        return W.CityDepth.trialChallenge({ randomSource: function () { return 0; } });
    }
    var W = 造世界('full'); vm.createContext(W);
    装全局(W); 装(W, 'js/city-depth.js');
    上五层(W);
    var 句 = W.msgs.join('\n');
    ok(/一枚也没落到你手里/.test(句), 'C1 一件没进：如实说没接住（改前滑进「塔梯加长」那句，丹药蒸发）');
    ok(/行囊已满/.test(句), 'C2 附真原因');
    ok(!/塔中赐药两枚，真元大涨/.test(句), 'C3 那句按开价念的赐药不许回来');
    ok(/过第 5 层/.test(句) && W.CityDepth.progress().trialFloor === 5, 'C4 层数照升——货的事不牵连账的事');

    var V = 造世界('ok'); vm.createContext(V);
    装全局(V); 装(V, 'js/city-depth.js');
    上五层(V);
    ok(/塔中赐药两枚，真元大涨/.test(V.msgs.join('\n')), 'C5 对照组：全收着仍念旧的那句好话');
    ok(V.added.indexOf('vitality_pill×2') >= 0, 'C6 两枚真进囊');

    // 部分入袋：公共手之外，addItem 只给 1 件
    var P = 造世界('ok'); vm.createContext(P);
    装全局(P);
    P.addItem = function (id, n) { P.addItemFailReason = null; P.added.push(id + '×1'); return 1; };   // 只塞得下一枚
    装(P, 'js/city-depth.js');
    上五层(P);
    ok(/接住 1\/2 枚/.test(P.msgs.join('\n')), 'C7 部分入袋念实数（改前一律「赐药两枚」）：' + (P.msgs[P.msgs.length - 1] || '').slice(0, 90));
}

// ============ D qi-arc2 暴涨① 阵眼灵石 ============
console.log('\n[D] qi-arc2 · 模态那句「得关键道具」只认真收（DES-89）');
{
    function 走完三幕(W) {
        W.qiStartC13();
        W.qiMotiveChoice('unclear');
        W.qiFinishC13();                       // 末尾进 _surge1
    }
    var W = 造世界('full'); vm.createContext(W);
    W.eventFlags = { _qi_yu: 'guard' };        // 赠石那一段由「守过七霞派阵眼」门控（真页面在 qi-arc1 落下）
    W.currentCharData.gender = 'male';
    装全局(W); 装(W, 'js/quest/qi-arc2.js');
    try { 走完三幕(W); } catch (e) { W.msgs.push('[装载异常] ' + e.message); }
    var 屏 = W.modals.join('\n') + '\n' + W.msgs.join('\n') + '\n' + W.logs.join('\n');
    ok(/虞松子最后起身/.test(屏), 'D0 这一夜虞松子真在场上（旗没落空，石头那一句才有得读）');
    // 【第一百三十九批·按「钉法」更新字面，要求未松】生产码把「你手里却没处放」改成了
    // 「你手里却没接住」——因为「没处放」是站点自己断言容量（R1），而「没接住」只陈述事实。
    // D1 的要求（「满包那一夜：模态改口说**没接住**」）一个字未松，只是匹配的字面跟着真源更新。
    ok(/石头递到你面前，你手里却没接住/.test(屏), 'D1 满包那一夜：模态改口说没接住（读数 ' + (屏.match(/（石头[^）]*）/) || ['<无>'])[0].slice(0, 60) + '）');
    ok(/得关键道具「半块阵眼灵石」/.test(屏) === false, 'D2 那句「得关键道具」不许在没接住时出现');
    ok(/行囊已满/.test(屏), 'D3 原因账带在屏上');

    var V = 造世界('ok'); vm.createContext(V);
    V.eventFlags = { _qi_yu: 'guard' }; V.currentCharData.gender = 'male';
    装全局(V); 装(V, 'js/quest/qi-arc2.js');
    try { 走完三幕(V); } catch (e) { V.msgs.push('[装载异常] ' + e.message); }
    var 屏2 = V.modals.join('\n') + V.msgs.join('\n');
    ok(/得关键道具「半块阵眼灵石」/.test(屏2), 'D4 对照组：腾得开格子照旧念「得关键道具」');
    ok(V.added.indexOf('qi_half_array_stone×1') >= 0, 'D5 石头真进囊');

    // 改前复现：只把那句嘴皮子按原字面回打，桩一切照旧——屏上念「得」而行囊空，才是改前的世界
    var 原 = load('js/quest/qi-arc2.js');
    var 旧句 = "if (yuGuarded()) body += para('虞松子最后起身，从怀里捧出小半块灵石——七霞派阵眼剩下的那半块：「阵守不住了。石头跟着能打仗的人走。」<span class=\"text-amber-200\">（得关键道具「半块阵眼灵石」——它认得你）</span>');";
    var 旧 = 原.replace(/if \(yuGuarded\(\)\) body \+= para\([^\n]*\+ _石话\(石\)\);/, 旧句);
    ok(旧 !== 原 && 旧.indexOf(旧句) >= 0 && !/\+ _石话\(石\)/.test(旧),
        'D6 那句嘴皮子按第一百三十批之前的字面回打成功（换不动就是文本漂移，复现不算数）');
    var Z = 造世界('full'); vm.createContext(Z);
    Z.eventFlags = { _qi_yu: 'guard' }; Z.currentCharData.gender = 'male';
    装全局(Z); vm.runInContext(旧, Z, { filename: 'qi-arc2.js（改前）' });
    try { 走完三幕(Z); } catch (e) { Z.msgs.push('[装载异常] ' + e.message); }
    ok(/得关键道具「半块阵眼灵石」/.test(Z.modals.join('\n')) && Z.added.length === 0,
        'D7 复现改前：满包那一夜屏上照样念「得关键道具」，囊里一件没有（现读 发货=' + Z.added.length + '）');
}

// ============ E qi-arc3 三叩门两坛酒 ============
console.log('\n[E] qi-arc3 · 叩门那坛酒的「得」字按实收改口（DES-72）');
{
    var W = 造世界('full'); vm.createContext(W);
    W.eventFlags = {}; W.currentCharData.gender = 'male';
    W._qiSettleExtraC = function () {};
    装全局(W); 装(W, 'js/quest/qi-arc3.js');
    try { W.qiKnock3Choice('wine'); } catch (e) { W.msgs.push('[异常] ' + e.message); }
    var 句 = W.logs.join('\n') + W.msgs.join('\n');
    // 【第一百三十九批·按「钉法」更新字面，要求未松】同上：「没处放」→「没接住」，
    // 因为「没处放」是断言容量。E1 的要求（「日志**不念得字**、改念没接住」）一字未松。
    ok(/那坛「她的一坛酒」她照塞了，你手里却没接住/.test(句), 'E1 接酒一支：日志不念「得」——' + (句.match(/（交心账一笔；[^）]*）/) || ['<无>'])[0].slice(0, 80));
    ok(!/得「她的一坛酒」/.test(句), 'E2 「得『她的一坛酒』……」那句不许在没接住时出现');

    var V = 造世界('ok'); vm.createContext(V);
    V.eventFlags = {}; V.currentCharData.gender = 'male'; V._qiSettleExtraC = function () {};
    装全局(V); 装(V, 'js/quest/qi-arc3.js');
    try { V.qiKnock3Choice('window'); } catch (e) { V.msgs.push('[异常] ' + e.message); }
    ok(/得「窗台的酒坛」/.test(V.logs.join('\n')), 'E3 对照组：关窗那一支腾得开就念「得」');
    ok(V.added.indexOf('qi_window_wine×1') >= 0, 'E4 窗台那坛真进囊');
}

// ============ F initInventory 认实收 ============
console.log('\n[F] inventory · 初始件没落袋要有人知道');
{
    var W = 造世界('ok'); vm.createContext(W);
    W.inventory = { slots: [], maxSlots: 3, currency: { spiritStones: 0 } };
    W.document = {
        createElement: function () { return { style: {}, classList: { add: function () {}, remove: function () {} }, appendChild: function () {} }; },
        getElementById: function () { return null; }, querySelector: function () { return null; }, querySelectorAll: function () { return []; },
        addEventListener: function () {}, body: { appendChild: function () {} }, readyState: 'complete'
    };
    W.localStorage = { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} };
    W.EventBus = { emit: function () {}, on: function () {} };
    W.updateInventoryUI = function () {}; W.updateCharacterStatus = function () {}; W.updateStatusPanel = function () {};
    装(W, 'js/inventory.js');
    var 缺 = W.initInventory(['mat_gold_such_nothing']);
    ok(Array.isArray(缺) && 缺.length === 1 && /百宝册查无此号/.test(缺[0]), 'F1 幽灵初始件被点出来（读数 ' + JSON.stringify(缺) + '）');
    var 缺2 = W.initInventory(['mat_gold_sand']);
    ok(缺2.length === 0, 'F2 正常初始件不再报错（读数 ' + JSON.stringify(缺2) + '）');
}

// ============ G 改前复现：旧写法在同一世界撒的谎 ============
// 回打必须连「发货判定＋回执」一起换回第一百三十批之前的字面——只撤手不撤嘴，复现出来的是改后的形状
console.log('\n[G] 改前复现 · 布尔压平的 grantItem ＋ 按开价念的回执（同一支笔换回旧写法）');
{
    var 原 = load('js/city-depth.js');
    var 旧手 = "function grantItem(itemId, n) {\n        if (typeof global.addItem === 'function') return !!global.addItem(itemId, n || 1);\n        if (global.addItemToInventory) { global.addItemToInventory(itemId, n || 1); return true; }\n        return false;\n    }\n";
    var 旧赐药 = "                if (next % 5 === 0 && grantItem('vitality_pill', 2)) {\n                    msg('🏮 过第 ' + next + ' 层！塔中赐药两枚，真元大涨（第 ' + next + ' 层）。', 'success');\n                } else {\n                    msg('🏮 过第 ' + next + ' 层，塔梯在你面前加长了一截。', 'success');\n                }\n";
    var 旧拔剑 = "                if (!grantItem('wpn_dark_iron_sword', 1)) { msg('背包放不下，古剑嗡了一声缩回土里。', 'warning'); return false; }\n";

    var 甲 = 原.replace(/function grantItem\(itemId, n\) \{[\s\S]*?\n    \}\n/, 旧手)
        .replace(/                if \(next % 5 !== 0\) \{[\s\S]*?\n                \}\n/, 旧赐药);
    // 【第一百三十九批·把尺量准，不是把要求放水】这道反向钉问的是「旧那句**代码**还在不在」，
    // 而注释不是发给玩家的文本。原先它扫全文，于是本批在 city-depth.js 上方补的说明注释里
    // 引用了「一枚也没落到你手里」这句原文（那是在解释它为什么被改掉），就被误判成「旧代码还在」。
    // 这里把**注释剥掉再判**——剥的只是注释，判据「旧句不得留在可执行代码里」一个字未松，
    // 上面两条 indexOf 正向钉（证明换回确实落地）也照旧在原文上判。
    function 剥注释(s) { return s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, ''); }
    ok(甲 !== 原 && 甲.indexOf(旧手) >= 0 && 甲.indexOf(旧赐药) >= 0 && !/一枚也没落到你手里/.test(剥注释(甲)),
        'G0 赐药那一处：旧手＋旧回执按字面换回（两处都没换到就不算复现；反向钉只剥注释，代码里的旧句仍不许留）');
    var W = 造世界('full'); vm.createContext(W);
    装全局(W);
    vm.runInContext(甲, W, { filename: 'city-depth.js（改前·赐药）' });
    W.CityDepth.progress().trialFloor = 4;
    W.currentCharData.energy = 100; W.currentCharData.spiritStones = 1000; W.msgs = [];
    W.CityDepth.trialChallenge({ randomSource: function () { return 0; } });
    var 句 = W.msgs.join('\n');
    ok(/塔梯在你面前加长了一截/.test(句) && !/赐药/.test(句) && W.added.length === 0,
        'G1 复现改前：赐药失败时滑进中性那句，两枚丹药蒸发无人提（发货=' + W.added.length + '）——' + 句.slice(0, 60));

    var 乙 = 原.replace(/function grantItem\(itemId, n\) \{[\s\S]*?\n    \}\n/, 旧手)
        .replace(/                var 剑 = grantItem\('wpn_dark_iron_sword', 1\);\n                if \(!剑\.got\)[^\n]*\n/, 旧拔剑);
    ok(乙 !== 原 && 乙.indexOf(旧拔剑) >= 0 && !/古剑出了泥，你却腾不出手接/.test(乙),
        'G0b 拔剑那一处：旧手＋旧回执按字面换回');
    var V = 造世界('full'); vm.createContext(V);
    装全局(V);
    delete V.addItem;                      // 旧手先问 addItem；摘掉它才走 addItemToInventory 那一支（本仓库真页面两把都在，这一支是兜底路径的原形）
    vm.runInContext(乙, V, { filename: 'city-depth.js（改前·拔剑）' });
    V.CityDepth.progress().swordIntent = 30; V.msgs = [];
    var 成 = V.CityDepth.swordPull({ randomSource: function () { return 0; } });
    ok(成 === true && V.CityDepth.progress().hasAncientSword === true && V.added.length === 0,
        'G2 复现改前：addItemToInventory 支恒回 true——剑没进囊却立了「已认主」旗（现读 成=' + 成 + '、旗=' + V.CityDepth.progress().hasAncientSword + '、发货=' + V.added.length + '）');
}

// ============ H 形状棘轮 ============
console.log('\n[H] 形状棘轮 · 本批接账的点位形态');
{
    function walk(d, out) {
        for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) {
            const p = d + '/' + e.name;
            if (e.isDirectory()) walk(p, out); else if (e.name.endsWith('.js')) out.push(p);
        }
        return out;
    }
    var 标记 = 0;
    for (const rel of walk('js', [])) {
        (load(rel).match(/第一百三十批/g) || []).forEach(function () { 标记++; });
    }
    ok(标记 >= 12, 'H1 源码里的「第一百三十批」标记 ' + 标记 + ' 处（只准增）——撤掉一处即红');

    var 赠 = load('js/app.js');
    ok(/交 = npc\.addItemToInventory\(slot\.templateId, 1\)/.test(赠) && /_退回行囊\(slot\.templateId, name\)/.test(赠),
        'H2 NPC 赠礼：交付回执被认住，接不住原路退回（DES-86 同族）');
    ok(/他换下来的「'/.test(赠) && /存旧 = typeof npc\.addItemToInventory/.test(赠),
        'H3 NPC 换装的旧件有去处：存不下塞回玩家行囊，不随覆盖蒸发');
    ok(!/npc\.addItemToInventory\(slot\.templateId, 1\);\s*\n\s*itemExtraMsg = '，NPC已收下'/.test(赠),
        'H4 那句不看回执就念「NPC已收下」的旧写法不许回来');

    var 秘 = 赠;
    ok(/此路得通。' \+ 尾/.test(秘) && /顺手拾得/.test(秘),
        'H5 动态秘境材料：回执念实收名目（改前 window.addItem 逐枚丢返回值）');

    var arc = load('js/quest/qi-arc2.js');
    ok(/function _收阵石\(\)/.test(arc) && /_石话\(石\)/.test(arc),
        'H6 qi-arc2 阵眼灵石走认实收的小手，模态那句由 _石话 出');
}

console.log('\n=== 第一百三十批套件：通过 ' + 通 + ' / 失败 ' + 红.length + ' ===');
红.forEach(function (x) { console.log('  [FAIL] ' + x); });
process.exit(红.length ? 1 : 0);
