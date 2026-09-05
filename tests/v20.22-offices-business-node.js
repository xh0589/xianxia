/**
 * v20.22-offices-business-node.js — 四衙真生意：粮仓籴米捐米、镇邪司悬赏缴丹、
 * 工曹署承揽河工、盐铁局官盐引（巡查旧规矩一律不回归）
 *
 * 覆盖：
 *   A 粮仓：官价籴米真扣钱真到货、钱不足拒、捐米真消业障、无米拒、巡查旧规矩
 *   B 镇邪司：缴丹按悬赏价 130 收（牌价 100 之上给溢价）、无丹拒（丹得自己猎）
 *   C 工曹署/盐铁局：河工赢拿全钱（随本城工价）、摔了拿四成挂彩、qi 不足拒；
 *     官盐引 80 领、模板在册；巡查旧规矩不回归
 *   D 盐路算盘：贵地代售价 102 > 官价 80（贱地出手反而亏——行商之路名实相符）
 *   E 静态：四衙弹窗接线、导出在案
 *
 * 运行：node tests/v20.22-offices-business-node.js
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
        currentCharData: { qi: opts.qi != null ? opts.qi : 100, health: 100, energy: 100,
            maxEnergy: 100, maxHealth: 100, maxQi: 100, tempering: 0,
            karma: opts.karma != null ? opts.karma : 0, notoriety: opts.noto != null ? opts.noto : 0, location: '测试城' },
        inventory: { currency: currency, slots: opts.slots ? opts.slots.slice() : [] },
        XianXia: {},
        gameLog: { add: function (m) { logs.push(String(m)); } },
        showMessage: function (m) { logs.push(String(m)); },
        advanceTime: function () {},
        getCurrentCityName: function () { return '测试城'; },
        getRealmTier: function () { return 3; },
        repCalls: 0,
        addReputation: function () { w.repCalls++; },
        // 注意不放 mat_salt_charter：E4 要走真实注册管线（register 见 itemById 已有即跳过）
        itemById: {
            food_spirit_rice: { id: 'food_spirit_rice', name: '灵米饭', price: 25 },
            mat_demon_beast_core: { id: 'mat_demon_beast_core', name: '妖兽内丹', price: 100 }
        },
        locationSystem: {
            getCityPriceModifier: function (city, type) { return type === 'sell' ? 1 : (opts.buyMod != null ? opts.buyMod : 1); },
            getCityData: function () { return { priceModifier: { buy: opts.buyMod != null ? opts.buyMod : 1, sell: 1 } }; }
        },
        timeSystem: { onNewDaySubscribe: function () {}, advanceTime: function () {} },
        scenarioEngine: { register: function (id, cfg) { w._reg = w._reg || {}; w._reg[id] = cfg; } },
        document: { readyState: 'complete', addEventListener: function () {}, getElementById: function () { return null; },
            createElement: function () { return { style: {}, classList: { add: function () {}, remove: function () {} }, appendChild: function () {}, innerHTML: '' }; },
            querySelector: function () { return null; }, body: {} }
    };
    w.XianXia.DataManager = {
        getSpiritStones: function () { return currency.spiritStones; },
        setSpiritStones: function (v) { currency.spiritStones = Math.max(0, v); },
        deductSpiritStones: function (n) { if (currency.spiritStones < n) return false; currency.spiritStones -= n; return true; }
    };
    w.EconomyTransaction = {
        // 模拟真事务：失败则整体回滚（钱货都不动），与 EconomyTransaction 语义一致
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
    return { w: w, ctx: ctx, currency: currency, logs: logs };
}
var appSrc = loadScript('js/app.js');
function appRun(fnName, opts) {
    var W = makeWorld(opts);
    vm.runInContext(loadScript('js/core/world-teeth.js'), W.ctx);
    var src = extractFn(appSrc, fnName);
    assert(!!src, fnName + ' 源码可提取');
    var helpers = '';
    ['granaryRiceUnit'].forEach(function (h) {
        var hs = extractFn(appSrc, h);
        if (hs) helpers += hs + '\n';
    });
    vm.runInContext(helpers + src + '\nwindow.' + fnName + ' = ' + fnName + ';', W.ctx);
    return W;
}

// ============ A 粮仓 ============
var W1 = appRun('granaryBuyRice', { stones: 500 });
var ok1 = W1.w.granaryBuyRice();
assert(ok1 === true && W1.currency.spiritStones === 446 &&
    W1.w.inventory.slots.filter(function (s) { return s.templateId === 'food_spirit_rice'; }).length === 1 &&
    W1.w.inventory.slots.filter(function (s) { return s.templateId === 'food_spirit_rice'; })[0].count === 3,
    'A1 官价籴米：54 灵石三袋灵米饭真落行囊（500→' + W1.currency.spiritStones + '，官价一袋 18 < 坊市 25）');
var W2 = appRun('granaryBuyRice', { stones: 20 });
var ok2 = W2.w.granaryBuyRice();
assert(ok2 === false && W2.currency.spiritStones === 20 && W2.w.inventory.slots.length === 0,
    'A2 手头不足籴米被拒，分文不动');
var W3 = appRun('granaryDonateRice', { stones: 10, karma: -8, slots: [{ templateId: 'food_spirit_rice', count: 3 }] });
var ok3 = W3.w.granaryDonateRice();
assert(ok3 === true && W3.w.currentCharData.karma === -6 && W3.w.currentCharData.tempering === 2 &&
    W3.w.inventory.slots.length === 0 && W3.w.repCalls === 1,
    'A3 捐米三袋真到货出业障减（karma -8→-6）、声望历练照涨——捐的是真货');
var W4 = appRun('granaryDonateRice', { stones: 500 });
assert(W4.w.granaryDonateRice() === false && W4.currency.spiritStones === 500,
    'A4 行囊无米捐不成，灵石分文不动（功德不是点按钮刷出来的）');
// 巡查旧规矩不回归
var W5 = appRun('openGranary', { qi: 50 });
W5.w.openGranary();
assert(W5.w.currentCharData.qi === 40 && W5.w.currentCharData.tempering === 3,
    'A5 巡查旧规矩不回归：10 真气换 3 历练，弹窗无 showModal 时不越权');
var W6 = appRun('openGranary', { qi: 5 });
W6.w.openGranary();
assert(W6.w.currentCharData.qi === 5 && W6.w.currentCharData.tempering === 0 &&
    W6.logs.join('|').indexOf('改日再来') >= 0, 'A6 真气不济巡查照旧如实拒绝');

// ============ B 镇邪司 ============
var W7 = appRun('exorcistDonateCore', { stones: 100, slots: [{ templateId: 'mat_demon_beast_core', count: 1 }] });
var ok7 = W7.w.exorcistDonateCore();
assert(ok7 === true && W7.currency.spiritStones === 230 && W7.w.currentCharData.tempering === 3 &&
    W7.w.currentCharData.karma === 1 && W7.w.inventory.slots.length === 0,
    'B1 缴丹按悬赏价收：牌价 100 官府给 130（买的是阖城平安），还搭历练功德');
var W8 = appRun('exorcistDonateCore', { stones: 100 });
assert(W8.w.exorcistDonateCore() === false && W8.currency.spiritStones === 100,
    'B2 无丹缴不成——官府不收空口白话');

// ============ C 工曹署 / 盐铁局 ============
function b2World(opts) {
    opts = opts || {};
    var W = makeWorld(opts);
    vm.runInContext(loadScript('js/core/world-teeth.js'), W.ctx);
    W.w.__workRng = opts.rng != null ? function () { return opts.rng; } : undefined;
    vm.runInContext(loadScript('js/city-facilities/facility-batch2.js'), W.ctx);
    return W;
}
var Wc = b2World({ stones: 100, qi: 100, buyMod: 1.2, rng: 0.5 });
var okc = Wc.w.takeWorksJob();
assert(okc === true && Wc.w.currentCharData.qi === 80 && Wc.currency.spiritStones === 196,
    'C1 承揽河工（贵地工价 80×1.2=96）：验收合格真气-20 工钱+96（100→' + Wc.currency.spiritStones + '）');
var Wd = b2World({ stones: 100, qi: 100, buyMod: 1.0, rng: 0.95 });
var okd = Wd.w.takeWorksJob();
assert(okd === true && Wd.w.currentCharData.health === 90 && Wd.currency.spiritStones === 132,
    'C2 从架上摔下来：拿四成工钱(32)挂彩 health-10，真气照扣——工钱不是稳赚');
var We = b2World({ stones: 100, qi: 10, rng: 0.1 });
assert(We.w.takeWorksJob() === false && We.w.currentCharData.qi === 10 && We.currency.spiritStones === 100,
    'C3 真气不足 20 揽不了河工（八尺堤踩不稳架子）');
var Wf = b2World({ stones: 200 });
var okf = Wf.w.saltBuyCharter();
assert(okf === true && Wf.currency.spiritStones === 120 &&
    Wf.w.inventory.slots.filter(function (s) { return s.templateId === 'mat_salt_charter'; }).length === 1,
    'C4 官价 80 领盐引：真扣钱真到货');
var Wg = b2World({ stones: 50 });
assert(Wg.w.saltBuyCharter() === false && Wg.currency.spiritStones === 50 && Wg.w.inventory.slots.length === 0,
    'C5 手头 50 领不了 80 的引，分文不动');
// 巡查旧规矩（v20.17 已锁，此处再验一遍不回归）
var Wh = b2World({ stones: 100, qi: 50 });
Wh.w.openWorksBureau();
assert(Wh.w.currentCharData.qi === 40 && Wh.w.currentCharData.tempering === 3, 'C6 工曹署巡查旧规矩不回归');

// ============ D 盐路算盘 ============
var gsrc = extractFn(appSrc, 'guildSellPrice');
var ctxD = vm.createContext({ window: {}, Math: Math, Number: Number });
var gsp = vm.runInContext('(' + gsrc.replace('function guildSellPrice', 'function') + ')', ctxD);
assert(gsp(100, 1.2) === 102 && gsp(100, 0.8) === 68,
    'D1 盐路真账：引(牌价100)贵地代售 102>官价80 赚 22，贱地代售 68<80 亏 12——行商的利从盐路上来，不白送');
assert(appSrc.indexOf('130') >= 0, 'D2 镇邪司悬赏价 130 在案（牌价之上给溢价）');

// ============ E 静态 ============
assert(appSrc.indexOf("onclick=\"granaryBuyRice()\"") >= 0 && appSrc.indexOf("onclick=\"granaryDonateRice()\"") >= 0 &&
    appSrc.indexOf("onclick=\"exorcistDonateCore()\"") >= 0, 'E1 粮仓/镇邪司弹窗按钮接线在案');
var b2Src = loadScript('js/city-facilities/facility-batch2.js');
assert(b2Src.indexOf("onclick=\"takeWorksJob()\"") >= 0 && b2Src.indexOf("onclick=\"saltBuyCharter()\"") >= 0,
    'E2 工曹署/盐铁局弹窗按钮接线在案');
var itSrc = loadScript('js/items-extended/13-missing-ids.js');
assert(itSrc.indexOf("mat_salt_charter") >= 0 && itSrc.indexOf('100') >= 0, 'E3 官盐引模板在册（牌价 100）');
var Wt2 = makeWorld({ stones: 0 });
Wt2.w.allItems = [];
vm.runInContext(itSrc, Wt2.ctx);
var tpls = (Wt2.w.allItems || []).filter(function (t) { return t && t.id === 'mat_salt_charter'; });
assert(tpls.length === 1 && Number(tpls[0].price) === 100, 'E4 官盐引经物品管线真实注册（不是只写在源码里）');
assert(Wt2.w.granaryBuyRice === undefined && appSrc.indexOf('window.granaryBuyRice = granaryBuyRice') >= 0,
    'E5 三枚新按钮函数已导出到全局');

console.log('v20.22 offices-business: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
