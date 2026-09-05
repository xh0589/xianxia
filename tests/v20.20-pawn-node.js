/**
 * v20.20-pawn-node.js — 当铺真典当：当期一月、凭票赎回、过期死当、当价随行情
 *
 * 覆盖：
 *   A 当票数学：按本城行情折当金（七折）、一票一物、当期赎回归本加息一成五、
 *     手头不足赎回被拒且账不动、过赎期票销货没（死当）
 *   B 行情真源：同一件龙鳞甲在贵价城/贱价城当金不同
 *   C 引擎接线：真跑当铺剧本（典当/赎回/卖断现算价）、账本错误原样上屏
 *   D 新日钩子：跨赎期自动死当销票
 *   E 静态：存档白名单成对、页面接线、引擎通道、旧"假当期"文案已除、卡面口径如实
 *
 * 运行：node tests/v20.20-pawn-node.js
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

var CURDAY = 100;
function makeWorld(opts) {
    opts = opts || {};
    var currency = { spiritStones: opts.stones != null ? opts.stones : 500 };
    var logs = [];
    var newDayHooks = [];
    var w = {
        console: { log: function () {}, warn: function () {}, error: function () {} },
        JSON: JSON, Object: Object, Array: Array, Math: Math, Number: Number,
        isFinite: isFinite, Date: Date, String: String,
        currentCharData: { qi: 100, health: 100, energy: 100, maxEnergy: 100, tempering: 0, karma: 0, notoriety: 0, location: '测试城' },
        inventory: { currency: currency, slots: opts.slots || [] },
        XianXia: {},
        getAbsoluteDay: function () { return CURDAY; },
        gameLog: { add: function (m, t) { logs.push(String(m)); } },
        showMessage: function (m) { logs.push(String(m)); },
        advanceTime: function () {},
        getCurrentCityName: function () { return '测试城'; },
        itemById: { mat_dragon_scale: { id: 'mat_dragon_scale', name: '龙鳞甲', price: 500 } },
        locationSystem: {
            getCityPriceModifier: function (city, type) { return type === 'sell' ? (opts.sellMod != null ? opts.sellMod : 1) : 1; },
            getCityData: function () { return { priceModifier: { sell: opts.sellMod != null ? opts.sellMod : 1 } }; }
        },
        timeSystem: { onNewDaySubscribe: function (fn) { newDayHooks.push(fn); }, advanceTime: function () {} },
        document: { readyState: 'complete', addEventListener: function () {}, getElementById: function () { return null; },
            createElement: function () { return { style: {}, classList: { add: function () {}, remove: function () {} }, appendChild: function () {}, innerHTML: '' }; },
            querySelector: function () { return null; }, body: {} }
    };
    w.XianXia.DataManager = {
        getSpiritStones: function () { return currency.spiritStones; },
        setSpiritStones: function (v) { currency.spiritStones = Math.max(0, v); }
    };
    // 经济事务桩：灵石划扣不足即失败（与真事务同语义）；取货=从 slots 真移除，上货=真加回
    w.EconomyTransaction = {
        run: function (fn) { return fn(); },
        credit: function (k, n) { if (k === 'spiritStones') { currency.spiritStones += n; return true; } return true; },
        debit: function (k, n) {
            if (k === 'spiritStones') { if (currency.spiritStones < n) return false; currency.spiritStones -= n; return true; }
            return true;
        },
        addSnapshot: function (it) {
            var inv = w.inventory;
            var tid = it.templateId || it.itemId;
            var hit = inv.slots.filter(function (s) { return s && (s.templateId || s.id) === tid; })[0];
            if (hit) hit.count = (Number(hit.count) || 1) + it.count;
            else inv.slots.push({ templateId: tid, count: it.count });
            return true;
        },
        removeByTemplate: function (templateId, count) {
            var inv = w.inventory;
            var need = count, idx = -1, i;
            for (i = 0; i < inv.slots.length; i++) {
                var s = inv.slots[i];
                if (s && (s.templateId || s.id) === templateId) { idx = i; break; }
            }
            if (idx < 0) return false;
            var slot = inv.slots[idx];
            var have = Number(slot.count) || 1;
            if (have < need) return false;
            if (have > need) slot.count = have - need; else inv.slots.splice(idx, 1);
            return true;
        }
    };
    w.window = w;
    var ctx = vm.createContext(w);
    return { w: w, ctx: ctx, currency: currency, logs: logs, hooks: newDayHooks };
}
function loadInto(ctx, rel) { vm.runInContext(fs.readFileSync(path.resolve(__dirname, '..', rel), 'utf8'), ctx); }
function dragonWorld(opts) {
    opts = opts || {};
    if (!opts.slots) opts.slots = [{ templateId: 'mat_dragon_scale', count: 1 }];
    var W = makeWorld(opts);
    loadInto(W.ctx, 'js/core/reward-service.js');
    loadInto(W.ctx, 'js/city-facilities/pawn-service.js');
    W.P = W.w.PawnService;
    return W;
}
function dragonWorldFull(opts) { // 带引擎与全套剧本
    opts = opts || {};
    if (!opts.slots) opts.slots = [{ templateId: 'mat_dragon_scale', count: 1 }];
    var W = makeWorld(opts);
    loadInto(W.ctx, 'js/core/reward-service.js');
    loadInto(W.ctx, 'js/core/scenario-engine.js');
    loadInto(W.ctx, 'js/city-facilities/bank-service.js');
    loadInto(W.ctx, 'js/city-facilities/pawn-service.js');
    loadInto(W.ctx, 'js/city-facilities/facility-batch2.js');
    loadInto(W.ctx, 'js/city-facilities/facility-batch3.js');
    W.eng = W.w.scenarioEngine;
    return W;
}

// ============ A: 当票数学 ============
CURDAY = 100;
var W = dragonWorld({ stones: 500, sellMod: 1.2 });
assert(typeof W.P === 'object' && W.hooks.length === 1, 'A0 当铺账房就位且挂上新日销票订阅');

var r = W.P.pawnItem('mat_dragon_scale', 1, 250);
var s = W.P.summary();
assert(r.success && W.currency.spiritStones === 710 && s.active && s.loan === 210 && s.due === 130 && W.w.inventory.slots.length === 0,
    'A1 贵价城当鳞甲：当金 250×1.2×七折=210 当场点付、货上柜、赎期 30 日（500→710，实际当金 ' + s.loan + '）');

r = W.P.pawnItem('mat_dragon_scale', 1, 250);
assert(!!r.error && r.error.indexOf('一票一物') >= 0, 'A2 柜上已有当票时再当被拒（当票不是无限提款机）');

CURDAY = 129; // 赎期内最后一日
r = W.P.redeem();
var redeemFee = Math.round(210 * 1.15);
assert(r.success && W.currency.spiritStones === 710 - redeemFee && !W.P.summary().active && W.w.inventory.slots.length === 1 &&
    W.w.inventory.slots[0].templateId === 'mat_dragon_scale',
    'A3 凭票赎回：归本 210 加息一成五=' + redeemFee + '，货回行囊、票焚（710→' + W.currency.spiritStones + '）');

r = W.P.redeem();
assert(!!r.error && r.error.indexOf('没有') >= 0, 'A4 无票硬赎被拒：' + JSON.stringify(r && r.error));

CURDAY = 130;
W.P.pawnItem('mat_dragon_scale', 1, 250); // 再当一张（货已被 A3 赎回）
W.currency.spiritStones = 20;
CURDAY = 140;
r = W.P.redeem();
assert(!!r.error && r.error.indexOf('不足') >= 0 && W.P.summary().active === true && W.P.summary().loan === 210,
    'A5 手头不足赎回：如实拒绝，当票与柜上货纹丝不动');
CURDAY = 131; // 回到赎期内再验一次"钱不足"与"过期"是两条线
r = W.P.redeem();
assert(!!r.error && r.error.indexOf('不足') >= 0, 'A5b 赎期内钱不够也照拒（过期不是唯一赎不回的理由）');
CURDAY = 161; // 早已过 due=160
r = W.P.redeem();
assert(!!r.error && r.error.indexOf('死当') >= 0 && !W.P.summary().active,
    'A6 过赎期再赎：货已作死当拍给货郎，票成废纸（不给你"补赎"的后门）');

// ============ B: 行情真源 ============
CURDAY = 200;
var Whi = dragonWorld({ stones: 0, sellMod: 1.2 }); Whi.P.pawnItem('mat_dragon_scale', 1, 250);
var Wlo = dragonWorld({ stones: 0, sellMod: 0.8 }); Wlo.P.pawnItem('mat_dragon_scale', 1, 250);
assert(Whi.currency.spiritStones === 210 && Wlo.currency.spiritStones === 140,
    'B 同一件鳞甲：贵价城当 210、贱价城当 140——当金随本城行情现算，不写死');

// ============ C: 引擎接线（真跑当铺剧本） ============
CURDAY = 300;
var Wc = dragonWorldFull({ stones: 500, sellMod: 1.0 });
var sc = Wc.eng.facilities['pawn_shop'].scenarios[0];
var st = Wc.eng.start('pawn_shop', 'pawn');
assert(!!st && st.desc.indexOf('当期一月') >= 0, 'C1 推门进店：柜台话术如实（含当期口径）');
var res = Wc.eng.choose(0); // 典当
assert(Wc.currency.spiritStones === 675 && Wc.w.currentCharData._pawn && Wc.w.currentCharData._pawn.loan === 175 && !(res && res.error),
    'C2 店内"当上"真过账本：平价城当金 250×0.7=175（500→675）');
// 二当：行囊已无货→门槛先拦；再把货补回行囊（假想又得一件）验账本二线"一票一物"原样上屏
Wc.eng.start('pawn_shop', 'pawn');
res = Wc.eng.choose(0);
assert(res && res.error && res.error.indexOf('缺少') >= 0, 'C3a 货不够时门槛先拦：' + JSON.stringify(res && res.error));
Wc.w.inventory.slots.push({ templateId: 'mat_dragon_scale', count: 1 });
Wc.eng.start('pawn_shop', 'pawn');
res = Wc.eng.choose(0);
assert(res && res.error === '柜上已有你一张当票，一票一物', 'C3b 账本二线原样上屏：' + JSON.stringify(res && res.error));
Wc.w.inventory.slots.pop(); // 撤掉补的那件，只剩赎回来的流程
// 赎回
Wc.eng.start('pawn_shop', 'pawn');
res = Wc.eng.choose(1); // 赎回：175×1.15≈201
assert(!(res && res.error) && Wc.currency.spiritStones === 675 - 201 && !Wc.w.currentCharData._pawn.active &&
    Wc.w.inventory.slots.filter(function (x) { return x.templateId === 'mat_dragon_scale'; }).length === 1,
    'C4 店内"赎回"银货两讫、货回行囊（675→' + Wc.currency.spiritStones + '）');
// 卖断现算价（贵价城）
CURDAY = 331;
var Ws = dragonWorldFull({ stones: 500, sellMod: 1.2 });
st = Ws.eng.start('pawn_shop', 'pawn');
res = Ws.eng.choose(2); // 卖断
assert(!(res && res.error) && Ws.currency.spiritStones === 500 + 300 && Ws.w.inventory.slots.length === 0 &&
    !Ws.w.currentCharData._pawn || (Ws.w.currentCharData._pawn && !Ws.w.currentCharData._pawn.active),
    'C5 卖断=行价现算：贵价城 250×1.2=300 落袋、货死当无回头（500→' + Ws.currency.spiritStones + '）');

// ============ D: 新日钩子销票 ============
CURDAY = 400;
var Wd = dragonWorld({ stones: 500, sellMod: 1 });
Wd.P.pawnItem('mat_dragon_scale', 1, 250); // due 430
CURDAY = 431;
Wd.hooks.forEach(function (fn) { fn(); }); // 新日订阅触发
assert(!Wd.P.summary().active, 'D1 跨过赎期的新日：当票自动注销（死当归铺，无需玩家推门才销账）');

// ============ E: 静态 ============
var gsSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'core', 'game-state.js'), 'utf8');
assert(gsSrc.indexOf('pawn: charData._pawn') >= 0 && gsSrc.indexOf('_pawn: (saveData.pawn') >= 0,
    'E1 当票入档与回灌成对（唯一新字段，旧档按无票兜底）');
var htmlSrc = fs.readFileSync(path.resolve(__dirname, '..', '仙侠.html'), 'utf8');
assert(htmlSrc.indexOf('js/city-facilities/pawn-service.js') >= 0, 'E2 当铺账房已挂上页面');
var seSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js/core/scenario-engine.js'), 'utf8');
assert(seSrc.indexOf('eff.pawn') >= 0 && seSrc.indexOf("reason: 'pawn'") >= 0, 'E3 引擎当票通道与如实报错在案');
var b2Src = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'city-facilities', 'facility-batch2.js'), 'utf8');
assert(b2Src.indexOf('pw_do') < 0 && b2Src.indexOf("op: 'pawn'") >= 0 && b2Src.indexOf("op: 'redeem'") >= 0,
    'E4 "假当期"旧结构（当场死当却写着当期）已拆除，换成真当票双轨');
var lsSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'location-system.js'), 'utf8');
assert(lsSrc.indexOf('典当有当期') >= 0 && lsSrc.indexOf('赎不赎得看命') < 0, 'E5 当铺卡面改为如实口径');

console.log('v20.20 pawn: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
