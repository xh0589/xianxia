/**
 * v20.23-salt-road-node.js — 年景与私盐道：
 * 官价籴米随本城行情浮动；盐路分官私两道——商会稳、私盐行多给一成二但有官非
 *
 * 覆盖：
 *   A 官价浮价：贵米年官价随涨、贱米年随跌、钱不足照拒；弹窗读现价不写死
 *   B 私盐行：私价=牌价100×销地行情×1.12 现算；成交真扣引真到账、恶名+3；
 *     缉私 25%：兜住罚 60、凑不出罚的蹲一宿（健康-10）、没兜住无事；无引拒、分文不动
 *   C 巡查与领引旧规矩不回归
 *   D 静态：私市按钮/导出/风险文案接线
 *
 * 运行：node tests/v20.23-salt-road-node.js
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
function extractFn(src, name) {
    var head = 'function ' + name + '(';
    var i = src.indexOf(head);
    if (i < 0) return null;
    var j = src.indexOf('{', i), depth = 0, k = j;
    for (; k < src.length; k++) {
        if (src[k] === '{') depth++;
        else if (src[k] === '}') { depth--; if (depth === 0) break; }
    }
    return src.slice(i, k + 1);
}

function makeWorld(opts) {
    opts = opts || {};
    var currency = { spiritStones: opts.stones != null ? opts.stones : 500 };
    var logs = [];
    var w = {
        console: { log: function () {}, warn: function () {}, error: function () {} },
        JSON: JSON, Object: Object, Array: Array, Math: Math, Number: Number,
        isFinite: isFinite, Date: Date, String: String,
        currentCharData: { qi: opts.qi != null ? opts.qi : 100, health: opts.health != null ? opts.health : 100,
            energy: 100, maxEnergy: 100, maxHealth: 100, maxQi: 100, tempering: 0, karma: 0,
            notoriety: opts.noto != null ? opts.noto : 0, location: '测试城' },
        inventory: { currency: currency, slots: opts.slots ? opts.slots.slice() : [] },
        XianXia: {},
        gameLog: { add: function (m) { logs.push(String(m)); } },
        showMessage: function (m) { logs.push(String(m)); },
        advanceTime: function () {},
        getCurrentCityName: function () { return '测试城'; },
        getRealmTier: function () { return 3; },
        addReputation: function () {},
        itemById: { food_spirit_rice: { id: 'food_spirit_rice', name: '灵米饭', price: 25 },
            mat_salt_charter: { id: 'mat_salt_charter', name: '官盐引', price: 100 } },
        locationSystem: {
            getCityPriceModifier: function (city, type) {
                if (type === 'sell') return opts.sellMod != null ? opts.sellMod : 1;
                return opts.buyMod != null ? opts.buyMod : 1;
            },
            getCityData: function () { return { priceModifier: { buy: opts.buyMod != null ? opts.buyMod : 1, sell: opts.sellMod != null ? opts.sellMod : 1 } }; }
        },
        timeSystem: { onNewDaySubscribe: function () {}, advanceTime: function () {} },
        scenarioEngine: { register: function () {} },
        document: { readyState: 'complete', addEventListener: function () {}, getElementById: function () { return null; },
            createElement: function () { return { style: {}, classList: { add: function () {}, remove: function () {} }, appendChild: function () {}, innerHTML: '' }; },
            querySelector: function () { return null; }, body: {} }
    };
    w.XianXia.DataManager = {
        getSpiritStones: function () { return currency.spiritStones; },
        setSpiritStones: function (v) { currency.spiritStones = Math.max(0, v); },
        deductSpiritStones: function (n) {
            if (opts.blockFine) return false; // 测试用：强制"罚款凑不出"
            if (currency.spiritStones < n) return false;
            currency.spiritStones -= n; return true;
        }
    };
    w.EconomyTransaction = {
        run: function (fn) {
            var st0 = currency.spiritStones;
            var s0 = JSON.parse(JSON.stringify(w.inventory.slots));
            var res = fn(this);
            if (!res || res.success === false) {
                currency.spiritStones = st0;
                w.inventory.slots.length = 0;
                s0.forEach(function (x) { w.inventory.slots.push(x); });
            }
            return res;
        },
        credit: function (k, n) { if (k === 'spiritStones') { currency.spiritStones += n; return true; } return true; },
        debit: function (k, n) {
            if (k === 'spiritStones') { if (currency.spiritStones < n) return false; currency.spiritStones -= n; return true; }
            return true;
        },
        addSnapshot: function (it) {
            var tid = it.templateId || it.itemId;
            var hit = w.inventory.slots.filter(function (s) { return s && (s.templateId || s.id) === tid; })[0];
            if (hit) hit.count = (Number(hit.count) || 1) + it.count;
            else w.inventory.slots.push({ templateId: tid, count: it.count });
            return true;
        },
        removeByTemplate: function (templateId, count) {
            var idx = -1;
            for (var i = 0; i < w.inventory.slots.length; i++) {
                if (w.inventory.slots[i] && (w.inventory.slots[i].templateId || w.inventory.slots[i].id) === templateId) { idx = i; break; }
            }
            if (idx < 0) return false;
            var slot = w.inventory.slots[idx], have = Number(slot.count) || 1;
            if (have < count) return false;
            if (have > count) slot.count = have - count; else w.inventory.slots.splice(idx, 1);
            return true;
        }
    };
    w.window = w;
    var ctx = vm.createContext(w);
    vm.runInContext(loadScript('js/core/reward-service.js'), ctx);
    vm.runInContext(loadScript('js/core/world-teeth.js'), ctx);
    return { w: w, ctx: ctx, currency: currency, logs: logs };
}

// ============ A 官价随年景 ============
var appSrc = loadScript('js/app.js');
function appRun(fnName, opts) {
    var W = makeWorld(opts);
    var helpers = extractFn(appSrc, 'granaryRiceUnit') + '\n';
    var src = extractFn(appSrc, fnName);
    assert(!!src, fnName + ' 源码可提取');
    vm.runInContext(helpers + src + '\nwindow.' + fnName + ' = ' + fnName + ';', W.ctx);
    return W;
}
var Wa = appRun('granaryBuyRice', { stones: 500, buyMod: 1.3 });
assert(Wa.w.granaryRiceUnit() === 23, 'A1 荒年米贵：官价一袋随行情抬到 23（18×1.3 取整）——官仓不再一口死价');
assert(Wa.w.granaryBuyRice() === true && Wa.currency.spiritStones === 500 - 69 &&
    Wa.w.inventory.slots.filter(function (s) { return s.templateId === 'food_spirit_rice'; })[0].count === 3,
    'A2 荒年三袋共 69 真扣真到货（' + Wa.currency.spiritStones + ' 余钱）');
var Wb = appRun('granaryBuyRice', { stones: 500, buyMod: 0.8 });
assert(Wb.w.granaryRiceUnit() === 14 && Wb.w.granaryBuyRice() === true && Wb.currency.spiritStones === 500 - 42,
    'A3 丰年米贱：官价一袋跌到 14、三袋 42——行情跌官价跟着跌');
var Wc = appRun('granaryBuyRice', { stones: 30, buyMod: 1.3 });
assert(Wc.w.granaryBuyRice() === false && Wc.currency.spiritStones === 30 && Wc.w.inventory.slots.length === 0,
    'A4 米贵年手头 30 籴不动 69 的米，分文不动');
assert(appSrc.indexOf('granaryRiceUnit() * 3') >= 0 && appSrc.indexOf('54 灵石）</button>') < 0,
    'A5 粮仓弹窗读现价（按钮价随行情现算，写死的"54 灵石"已拆）');

// ============ B 私盐行 ============
function b2World(opts) {
    opts = opts || {};
    var W = makeWorld(opts);
    W.w.facilitySellMod = function () { return opts.sellMod != null ? opts.sellMod : 1; };
    if (opts.rng != null) W.w.__smugRng = function () { return opts.rng; };
    vm.runInContext(loadScript('js/city-facilities/facility-batch2.js'), W.ctx);
    return W;
}
var Wd = b2World({ stones: 100, sellMod: 1.2, rng: 0.9, slots: [{ templateId: 'mat_salt_charter', count: 1 }] });
var okd = Wd.w.saltSellSmuggler();
assert(Wd.w.saltSmugglePrice() === 134, 'B1 私价现算：牌价100×贵地销价1.2×一成二=134（商会代售同货只给 102）');
assert(okd === true && Wd.currency.spiritStones === 234 && Wd.w.currentCharData.notoriety === 3 &&
    Wd.w.inventory.slots.length === 0 && Wd.logs.join('|').indexOf('巡船') < 0,
    'B2 渡口成交：+134 真到账、盐引交货、恶名+3 过手留名，这回没兜住（无事）');
var We = b2World({ stones: 100, sellMod: 1.0, rng: 0.1, slots: [{ templateId: 'mat_salt_charter', count: 1 }] });
We.w.saltSellSmuggler();
assert(We.currency.spiritStones === 100 + 112 - 60 && We.w.currentCharData.health === 100,
    'B3 缉私兜住（25% 线内）：+112 到手、罚款 60 划走（净 +52），人没事');
var Wf = b2World({ stones: 100, sellMod: 1.0, rng: 0.2, blockFine: true, slots: [{ templateId: 'mat_salt_charter', count: 1 }] });
Wf.w.saltSellSmuggler();
assert(Wf.w.currentCharData.health === 90 && Wf.logs.join('|').indexOf('蹲了一宿') >= 0,
    'B4 罚款凑不出：局里蹲一宿，健康-10——官非不是文案，是真罚');
var Wg = b2World({ stones: 200, sellMod: 1.0, rng: 0.9 });
assert(Wg.w.saltSellSmuggler() === false && Wg.currency.spiritStones === 200 && Wg.w.currentCharData.notoriety === 0,
    'B5 行囊无引，盐商的船不载空手人——分文不动、恶名不涨');
var Wh = b2World({ stones: 100, sellMod: 0.8, rng: 0.9, slots: [{ templateId: 'mat_salt_charter', count: 1 }] });
assert(Wh.w.saltSmugglePrice() === 90, 'B6 贱地私价 90：比官价领引 80 只多 10——盐路利薄，贱地走私不值当');

// ============ C 旧规矩不回归 ============
var Wi = b2World({ stones: 100, qi: 50 });
Wi.w.openSaltIronOffice();
assert(Wi.w.currentCharData.qi === 40 && Wi.w.currentCharData.tempering === 3, 'C1 盐铁局核账旧规矩不回归（10 真气换 3 历练）');
var Wi2 = b2World({ stones: 200 });
assert(Wi2.w.saltBuyCharter() === true && Wi2.currency.spiritStones === 120 &&
    Wi2.w.inventory.slots.filter(function (s) { return s.templateId === 'mat_salt_charter'; }).length === 1,
    'C2 官价领引 80 照旧（领引价不随行情——官价就是官价）');

// ============ D 静态 ============
var b2Src = loadScript('js/city-facilities/facility-batch2.js');
assert(b2Src.indexOf("onclick=\"saltSellSmuggler()\"") >= 0 && b2Src.indexOf('window.saltSellSmuggler = saltSellSmuggler') >= 0,
    'D1 私市按钮接线+导出在案');
assert(b2Src.indexOf('盐课巡船') >= 0 && b2Src.indexOf('0.25') >= 0 && b2Src.indexOf('deductSpiritStones(60)') >= 0,
    'D2 缉私罚则真实在案（25% 概率、罚 60 走账、凑不出挂彩）');
assert(b2Src.indexOf('__smugRng') >= 0 && b2Src.indexOf('1.12') >= 0 && b2Src.indexOf('noto: 3') >= 0,
    'D3 私价一成二、恶名+3、rng 可注入——利与风险都对得上账');

console.log('v20.23 salt-road: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
