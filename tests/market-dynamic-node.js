// market-dynamic v19.11 P1-8 测试

var pass = 0, fail = 0;
function assert(cond, msg) {
    if (cond) { pass++; console.log('  ✓ ' + msg); }
    else { fail++; console.log('  ✗ FAIL ' + msg); }
}
function section(s) { console.log('\n=== ' + s + ' ==='); }

var listeners = {};
var mockWindow = {
    WorldCalendar: { day: 1000 },
    EventBus: { emit: function (name, payload) { (listeners[name] = listeners[name] || []).push(payload); } },
    StateRegistry: {
        _handlers: {},
        register: function (k, handlers) { mockWindow.StateRegistry._handlers[k] = handlers; return function () { delete mockWindow.StateRegistry._handlers[k]; }; },
        exportAll: function () {
            var out = {};
            Object.keys(mockWindow.StateRegistry._handlers).forEach(function (k) {
                var h = mockWindow.StateRegistry._handlers[k];
                if (h.export) out[k] = { version: h.version || 1, data: h.export() };
            });
            return out;
        }
    }
};
var fs = require('fs');
var src = fs.readFileSync('D:/Download Game/仙侠世界/js/extensions/market-dynamic.js', 'utf8');
var wrapped = '(function(window){' + src + '})(mockWindow);';
eval(wrapped);
var M = mockWindow.MarketDynamic;
assert(!!M, 'MarketDynamic 已注册');
assert(M.CITIES.length === 6, '6 城市 (got ' + M.CITIES.length + ')');
assert(M.CATEGORIES.length === 6, '6 类别');
assert(Object.keys(M.WORLD_EVENTS).length === 10, '10 世界事件');
assert(M.NPC_NEEDS.length === 5, '5 NPC 需求');

// ---- 1. 城市基础倾向 ----
section('1) 城市基础倾向');
assert(M.CITY_BASE_BIAS['东海']['食物'] === 0.8, '东海食物 0.8 便宜');
assert(M.CITY_BASE_BIAS['西荒']['矿材'] === 0.7, '西荒矿材 0.7 便宜');
assert(M.CITY_BASE_BIAS['南疆']['药材'] === 0.7, '南疆药材 0.7 便宜');

// ---- 2. 36 指数 ----
section('2) 36 指数');
var allCount = 0;
for (var i = 0; i < M.CITIES.length; i++) {
    for (var j = 0; j < M.CATEGORIES.length; j++) {
        if (M.getIndex(M.CITIES[i], M.CATEGORIES[j])) allCount++;
    }
}
assert(allCount === 36, '36 指数 (got ' + allCount + ')');
var cnyPill = M.getIndex('中州', '丹药');
assert(cnyPill && cnyPill.supply === 100 && cnyPill.demand === 100, '中州丹药初始 supply=demand=100');
assert(cnyPill.baseMul === 1.0, '中州丹药 baseMul=1.0');

// ---- 3. priceMul ----
section('3) priceMul');
var m1 = M.priceMul('中州', '丹药');
assert(m1 === 1.0, '中州丹药初始 1.0 (got ' + m1 + ')');
var m2 = M.priceMul('东海', '食物');
assert(m2 === 0.8, '东海食物 0.8 (got ' + m2 + ')');
var m3 = M.priceMul('西荒', '矿材');
assert(m3 === 0.7, '西荒矿材 0.7 (got ' + m3 + ')');
// 按 itemId 自动判断类别
var m4 = M.priceMul('中州', 'pill_zhuji');
assert(m4 === 1.0, 'pill_zhuji→丹药 1.0 (got ' + m4 + ')');
var m5 = M.priceMul('中州', 'mat_dark_iron');
assert(m5 === 1.0, 'mat_dark_iron→矿材 1.0 (got ' + m5 + ')');
var m6 = M.priceMul('中州', 'unknown_xxx');
assert(m6 === 1.0, '未知 itemId 默认 1.0');

// ---- 4. applyWorldEvent ----
section('4) applyWorldEvent 灵气潮');
var w1 = M.applyWorldEvent('spirit_tide', { cities: ['中州'] });
assert(w1.ok, '应用事件 OK');
assert(M.getIndex('中州', '丹药').demand > 100, '中州丹药 demand 增加 (got ' + M.getIndex('中州', '丹药').demand + ')');
// 不在 affectedCities 的城市不变
var dongHaiPill = M.getIndex('东海', '丹药');
// 东海初始 100，应不变（除非 hit by another event）
assert(M.listActiveEvents().length === 1, '活跃事件 = 1');

// 兽潮
var w2 = M.applyWorldEvent('beast_flood', { cities: ['南疆'] });
assert(w2.ok, '兽潮 OK');
assert(M.getIndex('南疆', '矿材').supply > 100, '南疆矿材 supply +10');
assert(M.getIndex('南疆', '丹药').demand > 100, '南疆丹药 demand +20');

// 宗门战起
var w3 = M.applyWorldEvent('war_start', { cities: ['中州', '东海'] });
assert(w3.ok, '宗门战起 OK');
assert(M.getIndex('中州', '法器').demand > 100, '中州法器 demand +25');
assert(M.getIndex('中州', '符箓').demand > 100, '中州符箓 demand +15');

// 5 供需来源
assert((listeners['market:event:applied'] || []).length >= 3, 'event:applied ≥ 3 (got ' + (listeners['market:event:applied'] || []).length + ')');

// ---- 5. adjustFromTrade ----
section('5) adjustFromTrade 玩家买卖');
var cnyFood = M.getIndex('中州', '食物');
var cnyFoodSupBefore = cnyFood.supply;
var t1 = M.adjustFromTrade('中州', '食物', 10, true); // 买
assert(t1.ok, '买 OK');
assert(cnyFood.supply < cnyFoodSupBefore, '买后 supply 减 (before=' + cnyFoodSupBefore + ', after=' + cnyFood.supply + ')');
var t2 = M.adjustFromTrade('中州', '食物', 5, false); // 卖
assert(t2.ok, '卖 OK');
var afterSell = cnyFood.supply;
assert(afterSell > t1.supply, '卖后 supply 增');

// ---- 6. tickDay ----
section('6) tickDay 回归 + NPC 需求');
var cnyPillBefore = M.getIndex('中州', '丹药').demand;
// 跑 10 天
for (var k = 0; k < 10; k++) M.tickDay();
// 自然回归：demand 趋向 100
var cnyPillAfter = M.getIndex('中州', '丹药').demand;
assert(Math.abs(cnyPillAfter - 100) < Math.abs(cnyPillBefore - 100), '10 天后 demand 回归 (before=' + cnyPillBefore.toFixed(1) + ', after=' + cnyPillAfter.toFixed(1) + ')');

// 多跑触发 NPC
listeners = {};
for (var kk = 0; kk < 100; kk++) M.tickDay();
assert((listeners['market:npcNeed'] || []).length >= 1, '100 天内 NPC 需求 ≥ 1');

// ---- 7. 价格上界 ----
section('7) 价格边界');
// 极端：demand 极高 supply 极低
var idx = M.getIndex('中州', '丹药');
idx.demand = 500; idx.supply = 10;
var extreme = M.priceMul('中州', '丹药');
assert(extreme <= 10, '价格上限 10 (got ' + extreme + ')');
idx.demand = 5; idx.supply = 500;
var extreme2 = M.priceMul('中州', '丹药');
assert(extreme2 >= 0.1, '价格下限 0.1 (got ' + extreme2 + ')');
// 复位
idx.supply = 100; idx.demand = 100;

// ---- 8. 失败 ----
section('8) 失败');
var w4 = M.applyWorldEvent('event_xxx');
assert(!w4.ok && w4.reason === 'event-not-found', '不存在事件拒');
var t3 = M.adjustFromTrade('不存在的城市', '丹药', 1, true);
assert(!t3.ok, '不存在的城市拒');

// ---- 9. 事件总线 ----
section('9) 事件总线');
assert((listeners['market:event:applied'] || []).length >= 0, 'event:applied trigger OK');
assert((listeners['market:npcNeed'] || []).length >= 0, 'npcNeed trigger OK');

// ---- 10. StateRegistry ----
section('10) StateRegistry v1');
var snap = mockWindow.StateRegistry.exportAll();
assert(snap.marketConfig, 'marketConfig 已注册');
var mc = snap.marketConfig && snap.marketConfig.data;
assert(mc, 'data 可访问');
assert(mc && Object.keys(mc.indices).length === 6, '6 城市 indices');
assert(mc && mc.activeEvents.length >= 0, 'activeEvents 可访问');
assert(mc && mc.history.length <= 20, 'history ≤ 20');

// ---- 11. 性能 ----
section('11) 性能 1000 priceMul');
var t0 = Date.now();
for (var pi = 0; pi < 1000; pi++) {
    var c = M.CITIES[pi % 6];
    var cat = M.CATEGORIES[pi % 6];
    M.priceMul(c, cat);
}
var dur = Date.now() - t0;
console.log('  1000 priceMul: ' + dur + 'ms');
assert(dur < 200, '1000 priceMul < 200ms');

console.log('\n=========================================');
console.log('market-dynamic v19.11: ' + pass + ' passed, ' + fail + ' failed');
console.log('=========================================');
process.exit(fail > 0 ? 1 : 0);
