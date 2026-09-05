/**
 * v20.21-world-teeth-node.js — 世界的牙齿：堵漏、业障、恶名、行情、三栋楼
 *
 * 覆盖：
 *   A 巡夜罚则（纯函数）：恶名档位决定罚酒钱/搜身， rng 可注入
 *   B 黑市信用簿：成交攒信用、举报上黑名单、说和破财消嫌隙、暗柜按信用开门
 *   C 引擎真跑：举报代价、黑名单拒售、说和划钱、暗柜验信用、善堂捐真业障、
 *     拍卖价随本城买价系数现算、销赃成败记信用（无死锁）
 *   D 灵泉沐浴改成本制：真气不足拒泡，泡一次烧 20 真气换部分恢复
 *   E 商店回购接城市卖价真源（旧地区表只做兜底）
 *   F 静态：存档白名单成对、页面接线、引擎通道、空头文案已除、三栋楼去别名
 *
 * 运行：node tests/v20.21-world-teeth-node.js
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
    var currency = { spiritStones: opts.stones != null ? opts.stones : 500 };
    var logs = [];
    var w = {
        console: { log: function () {}, warn: function () {}, error: function () {} },
        JSON: JSON, Object: Object, Array: Array, Math: Math, Number: Number,
        isFinite: isFinite, Date: Date, String: String,
        currentCharData: { qi: 100, health: 100, energy: 100, maxEnergy: 100, maxHealth: 100, maxQi: 100,
            tempering: 0, karma: opts.karma != null ? opts.karma : 0, notoriety: 0, location: '测试城' },
        inventory: { currency: currency, slots: opts.slots ? opts.slots.slice() : [] },
        XianXia: {},
        getAbsoluteDay: function () { return 100; },
        gameLog: { add: function (m, t) { logs.push(String(m)); } },
        showMessage: function (m) { logs.push(String(m)); },
        advanceTime: function () {},
        getCurrentCityName: function () { return '测试城'; },
        getRealmTier: function () { return 3; },
        addReputation: function () {},
        itemById: {
            mat_dragon_scale: { id: 'mat_dragon_scale', name: '龙鳞甲', price: 500 },
            mat_shihun_scroll: { id: 'mat_shihun_scroll', name: '噬魂诀残卷', price: 500 },
            pill_foundation: { id: 'pill_foundation', name: '筑基丹', price: 500 }
        },
        locationSystem: {
            getCityPriceModifier: function (city, type) {
                if (type === 'sell') return opts.sellMod != null ? opts.sellMod : 1;
                return opts.buyMod != null ? opts.buyMod : 1;
            },
            getCityData: function () { return { priceModifier: { buy: opts.buyMod != null ? opts.buyMod : 1, sell: opts.sellMod != null ? opts.sellMod : 1 } }; }
        },
        timeSystem: { onNewDaySubscribe: function () {}, advanceTime: function () {} },
        __rng: opts.rng || 0.5,
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
            var idx = -1;
            for (var i = 0; i < inv.slots.length; i++) {
                if (inv.slots[i] && (inv.slots[i].templateId || inv.slots[i].id) === templateId) { idx = i; break; }
            }
            if (idx < 0) return false;
            var slot = inv.slots[idx], have = Number(slot.count) || 1;
            if (have < count) return false;
            if (have > count) slot.count = have - count; else inv.slots.splice(idx, 1);
            return true;
        }
    };
    w.window = w;
    var ctx = vm.createContext(w);
    return { w: w, ctx: ctx, currency: currency, logs: logs };
}
function fullWorld(opts) {
    var W = makeWorld(opts);
    vm.runInContext(loadScript('js/core/reward-service.js'), W.ctx);
    vm.runInContext(loadScript('js/core/world-teeth.js'), W.ctx);
    vm.runInContext(loadScript('js/core/scenario-engine.js'), W.ctx);
    vm.runInContext(loadScript('js/city-facilities/bank-service.js'), W.ctx);
    vm.runInContext(loadScript('js/city-facilities/pawn-service.js'), W.ctx);
    vm.runInContext(loadScript('js/city-facilities/facility-batch2.js'), W.ctx);
    vm.runInContext(loadScript('js/city-facilities/facility-batch3.js'), W.ctx);
    W.w.__scenarioRng = function () { return W.w.__rng; };
    W.eng = W.w.scenarioEngine;
    W.FC = W.w.FenceCredit;
    return W;
}
// 真正"重新推门"：清掉进行中的半截进度（引擎对未完成的戏是续场而非重开）
function restart(W, fac, sc) {
    W.eng.activeState = null;
    W.eng.progress[fac + '_' + sc] = null;
    return W.eng.start(fac, sc);
}

// ============ A: 巡夜罚则（纯函数） ============
var Wt = makeWorld({});
vm.runInContext(loadScript('js/core/world-teeth.js'), Wt.ctx);
var pc = Wt.w.patrolConsequence;
assert(typeof pc === 'function', 'A0 巡夜罚则在案（世界底座已挂上）');
assert(pc(20, function () { return 0.01; }).action === 'none', 'A1 良民夜行无罚');
var r2 = pc(40, function () { return 0.1; });
assert(r2.action === 'fine' && r2.fine === 30, 'A2 恶名过顶五成概率被罚酒钱 30');
var r3 = pc(40, function () { return 0.9; });
assert(r3.action === 'none' && r3.wary === true, 'A3 同样恶名也有躲过去的时候（戒备文案）');
var r4 = pc(80, function () { return 0.1; });
assert(r4.action === 'detain' && r4.fine === 60 && r4.qi > 0, 'A4 恶名过六旬：罚 60 还搜身（震散真气）');
var r5 = pc(80, function () { return 0.9; });
assert(r5.action === 'fine' && r5.fine === 60, 'A5 通缉脸上挂着的人，躲过搜身躲不过罚钱');

// ============ B: 黑市信用簿 ============
var Wf = makeWorld({ stones: 0 });
vm.runInContext(loadScript('js/core/world-teeth.js'), Wf.ctx);
var FC = Wf.w.FenceCredit;
var d = FC.deal(2);
assert(!!d.error && d.error.indexOf('没你的座') >= 0, 'B1 初来乍到暗柜不开门：' + JSON.stringify(d && d.error));
FC.adjust(2, null);
d = FC.deal(2);
assert(!d.error && d.trust === 3, 'B2 交情到位（信用2）暗柜肯收货，成交再涨一分');
assert(FC.summary().deals === 1, 'B3 成交笔数是账：实惠攒得出来');
assert(FC.describe().indexOf('面熟') >= 0, 'B4 牌面如实：摊主认得这张脸');
FC.adjust(1, null);
assert(FC.describe().indexOf('老主顾') >= 0, 'B5 信用越攒越厚：柜底真货只给老主顾看');
FC.adjust(-3, 'snitch'); FC.adjust(-3, 'snitch');
assert(FC.summary().blacklisted && FC.summary().snitches === 2 && FC.describe().indexOf('条子') >= 0,
    'B6 举报两次=黑名单：告示墙上挂着你的名字');
d = FC.deal(-1);
assert(!!d.error && d.error.indexOf('没摊子接你的单') >= 0, 'B7 黑名单上连街面买卖都不做——黑市不吃恶名，吃信用');
FC.adjust(5, null); // 拉回信用再验"无嫌隙"线
d = FC.settle();
assert(!!d.error && d.error.indexOf('并无嫌隙') >= 0, 'B9 没破的信用用不着说和——100 灵石花不出去');
FC.adjust(-10, 'snitch');
d = FC.settle();
assert(!d.error && d.trust === 0, 'B10 托人说和：破财消嫌隙，信用回到桌面上');

// ============ C: 引擎真跑 ============
// C1 举报的代价：真记进信用簿
var Wc = fullWorld({ stones: 1000 });
Wc.eng.start('black_market', 'black_deal');
var res = Wc.eng.choose(3); // 举报
assert(!(res && res.error) && Wc.w.currentCharData._fence.trust === -2 && Wc.w.currentCharData._fence.snitches === 1,
    'C1 举报黑市：嘉奖照领，但信用簿记了重重一笔（trust -2，前科 +1）');
// C2 黑名单拒售：整笔拦下、分文不动
Wc.eng.start('black_market', 'black_deal');
Wc.eng.choose(0); // 到 bl_buy
var before = Wc.currency.spiritStones;
res = Wc.eng.choose(0); // 付 500 收残卷
assert(res && res.error && res.error.indexOf('没摊子接你的单') >= 0 && Wc.currency.spiritStones === before,
    'C2 黑名单买赃被拒且分文不动：黑市拒的是你这个人不是一笔价');
// C3 说和：100 灵石划钱消嫌隙；无嫌隙时空跑不划钱
restart(Wc, 'black_market', 'black_deal');
before = Wc.currency.spiritStones;
res = Wc.eng.choose(4); // 说和
assert(!(res && res.error) && Wc.currency.spiritStones === before - 100 && Wc.w.currentCharData._fence.trust === 0,
    'C3a 托人说和 100 灵石成交，条子揭了（' + before + '→' + Wc.currency.spiritStones + '）');
restart(Wc, 'black_market', 'black_deal');
before = Wc.currency.spiritStones;
res = Wc.eng.choose(4);
assert(res && res.error && res.error.indexOf('并无嫌隙') >= 0 && Wc.currency.spiritStones === before,
    'C3b 无嫌隙时说和被拒且分文不划——不是交钱就能刷信用的提款机');
// C4 暗柜：信用 0 不开门；攒到 2 才放货、老主顾折扣更低
restart(Wc, 'black_market', 'black_deal');
Wc.eng.choose(1); // 问暗柜
res = Wc.eng.choose(0); // 取全册
assert(res && res.error && res.error.indexOf('没你的座') >= 0 && Wc.currency.spiritStones === before,
    'C4a 交情不够暗柜不放手（文案原样上屏、钱不打）');
Wc.FC.adjust(2, null); // 又做了几笔生意把交情攒起来
restart(Wc, 'black_market', 'black_deal');
Wc.eng.choose(1);
before = Wc.currency.spiritStones;
res = Wc.eng.choose(0);
assert(!(res && res.error) && Wc.currency.spiritStones === before - 450 &&
    Wc.w.inventory.slots.filter(function (x) { return (x.templateId || x.id) === 'mat_shihun_scroll'; }).length === 1 &&
    Wc.w.currentCharData._fence.trust === 3,
    'C4b 信用 2 入暗柜：全册 450（九折）成交、真货入手、信用再涨（' + before + '→' + Wc.currency.spiritStones + '）');
Wc.FC.adjust(2, null); // 信用 5：老主顾价 85 折
restart(Wc, 'black_market', 'black_deal');
Wc.eng.choose(1);
before = Wc.currency.spiritStones;
res = Wc.eng.choose(0);
assert(!(res && res.error) && Wc.currency.spiritStones === before - 425,
    'C4c 老主顾价 425——折扣来自交情，不是恶名');
// C5 善堂捐真业障：招牌不再是空话
var Wk = fullWorld({ stones: 500, karma: -20 });
Wk.eng.start('charity_hall', 'donate');
res = Wk.eng.choose(0); // 捐粮 50
assert(!(res && res.error) && Wk.w.currentCharData.karma === -18 && Wk.currency.spiritStones === 450,
    'C5 捐粮 50 灵石：业障 -20 → -18，功德真抵消（兑现善堂招牌）');
Wk.eng.start('charity_hall', 'donate');
Wk.eng.choose(2); // 大量 → do_generous
res = Wk.eng.choose(0); // 捐 200
assert(!(res && res.error) && Wk.w.currentCharData.karma === -14,
    'C6 大额捐赠消业更快：-18 → -14（捐得多压得快）');
// C7 拍卖价随本城买价行情现算
var Wa = fullWorld({ stones: 2000, buyMod: 1.2 });
Wa.eng.start('auction_house', 'auction');
Wa.eng.choose(0); Wa.eng.choose(0);
var dsc = Wa.eng.current && Wa.eng.current();
res = Wa.eng.choose(0); // 付款
assert(!(res && res.error) && Wa.currency.spiritStones === 2000 - 720 &&
    Wa.w.inventory.slots.filter(function (x) { return (x.templateId || x.id) === 'pill_foundation'; }).length === 1,
    'C7a 贵价城落槌 500×1.2×1.2=720：拍行随本城行情定价（2000→' + Wa.currency.spiritStones + '）');
var Wb = fullWorld({ stones: 2000, buyMod: 0.8 });
Wb.eng.start('auction_house', 'auction');
Wb.eng.choose(0); Wb.eng.choose(0);
res = Wb.eng.choose(0);
assert(!(res && res.error) && Wb.currency.spiritStones === 2000 - 480,
    'C7b 贱地拍行起拍就便宜：500×0.8×1.2=480，同一颗丹两地两价');
// C8 销赃信用：办成 +1，办砸 -1，且办砸不卡死（门槛只拦黑名单）
var Wg = fullWorld({ stones: 100, rng: 0.1 }); // 0.1<0.7 胜
Wg.eng.start('black_market', 'black_fence');
Wg.eng.choose(0);
assert(Wg.w.currentCharData._fence.trust === 1 && Wg.w.currentCharData._fence.deals === 1,
    'C8a 销赃办成：暗巷记你一张能做成买卖的脸（信用+1）');
var Wh = fullWorld({ stones: 100, rng: 0.99 }); // 败
Wh.eng.start('black_market', 'black_fence');
Wh.eng.choose(0);
assert(Wh.w.currentCharData._fence.trust === -1, 'C8b 被巡捕获手：办砸的买卖信用簿也记一笔');
assert(!Wh.FC.deal(-1).error, 'C8c 偶有失手不致永绝黑市（否则信用永远攒不回来）');

// ============ D: 灵泉沐浴改成本制 ============
var Ws = makeWorld({ stones: 0 });
Ws.w.currentCharData.health = 40; Ws.w.currentCharData.energy = 30; Ws.w.currentCharData.qi = 15;
vm.runInContext(loadScript('js/building-effects.js'), Ws.ctx);
var reg = vm.runInContext('buildingEffectsRegistry', Ws.ctx);
var spring = reg ? reg['spring'] : null;
assert(spring && typeof spring.bathe === 'function', 'D0 灵泉沐浴在案');
var ok = spring.bathe();
assert(ok === false && Ws.w.currentCharData.health === 40 && Ws.w.currentCharData.qi === 15,
    'D1 真气不足 20 拒泡：泉边白泡的时代结束了');
Ws.w.currentCharData.qi = 100;
spring.bathe();
assert(Ws.w.currentCharData.qi === 80 && Ws.w.currentCharData.health === 70 && Ws.w.currentCharData.energy === 80,
    'D2 泡一次烧 20 真气：气血 40→70、精力 30→80，部分恢复（回满归客栈）');

// ============ E: 商店回购接城市卖价 ============
var srcShop = loadScript('js/enhanced-shop.js');
var i0 = srcShop.indexOf('getRegionMultiplier: function(location)');
var i1 = srcShop.indexOf('getMerchantDemandModifier', i0);
assert(i0 > 0 && i1 > i0, 'E1 回购倍率函数在案');
var fnSrc = srcShop.slice(i0, i1);
fnSrc = fnSrc.slice(0, fnSrc.lastIndexOf('},') + 1);
var sandboxStub = {
    window: {
        locationSystem: {
            getCityPriceModifier: function (loc, type) { return type === 'sell' ? 1.3 : 1; },
            getCityData: function () { return { priceModifier: { sell: 1.3 } }; },
            getRegionByLocation: function () { return '东荒'; }
        }
    }
};
var vm2 = require('vm');
var ctx2 = vm2.createContext(sandboxStub);
var shopObj = vm2.runInContext('({' + fnSrc + '})', ctx2);
assert(shopObj.getRegionMultiplier('长安') === 1.3, 'E2 回购价改接本城 sell 真源（长安卖系数 1.3 → 回购也随 1.3）');
sandboxStub.window.locationSystem = { getRegionByLocation: function () { return '东荒'; } };
assert(shopObj.getRegionMultiplier('某野店') === 0.8, 'E3 城市数据缺位才落回旧地区表（东荒 0.8 兜底仍在）');
var weSrc = loadScript('js/world-events.js');
assert(weSrc.indexOf('window.getCityPriceModifier') < 0 && weSrc.indexOf('locationSystem.getCityPriceModifier') >= 0,
    'E4 世界事件里那条从没生效过的死城市线修通（真源只经 locationSystem 读）');

// ============ F: 静态 ============
var gsSrc = loadScript('js/core/game-state.js');
assert(gsSrc.indexOf('fence: charData._fence') >= 0 && gsSrc.indexOf('_fence: (saveData.fence') >= 0,
    'F1 黑市信用簿入档与回灌成对（唯一新字段，旧档按初来乍到兜底）');
var htmlSrc = loadScript('仙侠.html');
assert(htmlSrc.indexOf('js/core/world-teeth.js') >= 0, 'F2 世界底座已挂上页面');
var seSrc = loadScript('js/core/scenario-engine.js');
assert(seSrc.indexOf('eff.fence') >= 0 && seSrc.indexOf("reason: 'fence'") >= 0, 'F3 引擎信用簿通道与如实报错在案');
var b2Src = loadScript('js/city-facilities/facility-batch2.js');
assert(b2Src.indexOf('karma: 2') >= 0 && b2Src.indexOf('karma: 4') >= 0 && b2Src.indexOf('祈福增运') < 0,
    'F4 善堂捐赠挂上真功德，空头承诺"祈福增运"已删');
assert(b2Src.indexOf("op: 'settle'") >= 0 && b2Src.indexOf("op: 'deal'") >= 0 && b2Src.indexOf("op: 'trust'") >= 0,
    'F5 黑市买卖/举报/说和三条线全走信用簿');
assert(b2Src.indexOf('facilityBuyMod') >= 0 && b2Src.indexOf('stones: -600') < 0,
    'F6 拍卖落槌价不再写死 600');
var appSrc = loadScript('js/app.js');
var guildBody = appSrc.slice(appSrc.indexOf('function openGuildHall'), appSrc.indexOf('function openLibrary'));
assert(guildBody.indexOf('guildSellPrice') >= 0 && guildBody.indexOf('showModal') >= 0 &&
    guildBody.indexOf('openBountyHall') < 0,
    'F7 公会堂做实商会代售台，不再是悬赏楼的影子');
assert(appSrc.indexOf('window.openBountyBoard') >= 0, 'F8 悬赏楼接上真悬赏榜');
assert(/function openHouseholdRegistry[\s\S]{0,400}qi -= 10/.test(appSrc), 'F9 户籍司与七衙门同一规矩（10 真气翻档）');
var deSrc = loadScript('js/core/daily-events.js');
assert(deSrc.indexOf('patrolConsequence') >= 0 && deSrc.indexOf('酒钱') >= 0, 'F10 夜巡从纯文案改成真罚钱');
var beSrc = loadScript('js/building-effects.js');
assert(beSrc.indexOf('qi -= 20') >= 0 && beSrc.indexOf('沐浴灵泉，状态完全恢复') < 0,
    'F11 灵泉"免费回满"话术与实现一并拆除');

console.log('v20.21 world-teeth: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
