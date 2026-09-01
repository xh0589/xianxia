// world-events v20.0 集成测试
// 验证：beast_tide 事件 → BeastTide.triggerTide + 城市残留；market_boom/sect_war → MarketDynamic.applyWorldEvent
// expireWorldEvents → 联动 BeastTide.endTide；getCombinedShopPriceMultiplier 接 MarketDynamic.priceMul

var pass = 0, fail = 0;
function assert(cond, msg) {
    if (cond) { pass++; console.log('  ✓ ' + msg); }
    else { fail++; console.log('  ✗ FAIL ' + msg); }
}
function section(s) { console.log('\n=== ' + s + ' ==='); }

var tideStarted = [];
var tideEnded = [];
var marketEvents = [];
var fmessages = [];

var mockWindow = {
    getAbsoluteDay: function () { return 1000; },
    timeSystem: { gameTime: { currentDay: 1000 } },
    locationSystem: { getCurrentLocation: function () { return '南疆'; } },
    currentCharData: { location: '南疆', realm: '金丹' },
    getRealmIndex: function (realm) { return { 炼气: 1, 筑基: 3, 金丹: 5, 元婴: 7, 化神: 9 }[realm] || 0; },
    WorldCalendar: {
        day: 1000,
        register: function (item) { return { ok: true }; },
        list: function () { return []; }
    },
    BeastTide: {
        triggerTide: function (level, opts) { tideStarted.push({ level: level, opts: opts }); return { ok: true, tideId: 't' + level }; },
        endTide: function (tid) { tideEnded.push(tid); return { ok: true }; },
        getRarityBoost: function () { return 2; },
        getActiveTide: function () { return null; },
        getCurrentPool: function () { return ['beast_lingfox', 'thunder_eagle']; },
        isRaidActive: function () { return false; }
    },
    BeastTideAndGarden: {
        getState: function () {
            return {
                tides: {
                    't_world1': { level: 'tide_5', opts: { source: 'world-event' } },
                    't_manual1': { level: 'tide_3', opts: {} }
                }
            };
        }
    },
    MarketDynamic: {
        applyWorldEvent: function (name) { marketEvents.push(name); return { ok: true }; },
        priceMul: function (city, cat) { return city === '南疆' ? 1.2 : 1.0; }
    },
    WorldLoop: {
        mapMarketCity: function (loc) { return loc === '南疆' ? '南疆' : '中州'; }
    },
    WorldJournal: { record: function () { return { ok: true }; } },
    Codex: { discover: function () {} },
    showMessage: function (m) { fmessages.push(m); },
    showEffect: function () {},
    addItem: function () {},
    addReputation: function () {},
    startBattle: function () { return {}; },
    beginBeastTideRaid: function () { return true; },
    BeastEcosystem: { getActiveBeastBuff: function () { return 0; } },
    triggerFactionConflict: function () {},
    changeFactionReputation: function () {},
    getCityPriceModifier: function () { return 1; }
};

var fs = require('fs');
var src = fs.readFileSync('D:/Download Game/仙侠世界/js/world-events.js', 'utf8');
// 脚本式（非 IIFE）：包一层提供 window + 暴露内部 activateWorldEvent 供测试
var wrapped = '(function(window){' + src + '\nwindow._testActivate = activateWorldEvent;\nwindow._testGetWorldEventsPanel = getWorldEventsPanelHtml;\n})(mockWindow);';
eval(wrapped);

// ---- 1. beast_tide → triggerTide（按境界） ----
section('1) beast_tide 触发兽潮');
mockWindow._testActivate({ id: 'beast_tide', name: '兽潮来袭', icon: '🐾', duration: 3 }, 1000);
assert(tideStarted.length === 1, 'triggerTide 1 次');
assert(tideStarted[0].level === 'tide_5', '金丹(索引5) → tide_5 (got ' + tideStarted[0].level + ')');
assert(tideStarted[0].opts.source === 'world-event', 'source=world-event');

// ---- 2. market_boom → MarketDynamic ----
section('2) market_boom/sect_war 联动物价');
mockWindow._testActivate({ id: 'market_boom', name: '坊市繁荣', icon: '💰', duration: 3 }, 1000);
assert(marketEvents.indexOf('festival') >= 0, 'market_boom → festival');
mockWindow._testActivate({ id: 'sect_war', name: '正邪大战', icon: '⚔️', duration: 5 }, 1000);
assert(marketEvents.indexOf('war_start') >= 0, 'sect_war → war_start');

// ---- 3. expireWorldEvents → endTide ----
section('3) expire 联动 endTide');
// beast_tide 已过期：day 1010 > endDay 1003
var expired = mockWindow.expireWorldEvents(1010);
assert(expired.indexOf('beast_tide') >= 0, 'beast_tide 过期');
assert(tideEnded.indexOf('t_world1') >= 0, 'endTide 世界事件源 tide');
assert(tideEnded.indexOf('t_manual1') < 0, '手动触发 tide 不误关');

// ---- 4. getCombinedShopPriceMultiplier 接 MarketDynamic ----
section('4) 物价乘数接 MarketDynamic');
// 清掉前几节激活事件留下的城市临时价，专注验证 MarketDynamic 分量
mockWindow.expireCityTempModifiers(9999);
var m1 = mockWindow.getCombinedShopPriceMultiplier('南疆', 'mat_herb');
assert(m1 > 1, '南疆药材乘数 > 1 (got ' + m1 + ')');
assert(Math.abs(m1 - 1.2) < 0.001, '南疆乘数 = 1.2 (got ' + m1 + ')');
var m2 = mockWindow.getCombinedShopPriceMultiplier('中州', 'mat_herb');
assert(Math.abs(m2 - 1.0) < 0.001, '中州乘数 = 1.0 (got ' + m2 + ')');

// ---- 5. 面板含兽潮详情 ----
section('5) 面板兽潮详情');
// BeastTide active + beast_tide 在列表里
mockWindow.BeastTide.isRaidActive = function () { return true; };
mockWindow.BeastTide.getActiveTide = function () { return { name: '大兽潮' }; };
// 重建 activeWorldEvents 让 beast_tide 在列表
mockWindow.activeWorldEvents = { beast_tide: { startDay: 1000, duration: 3, endDay: 1003, _today: 1000 } };
var panel = mockWindow._testGetWorldEventsPanel();
assert(panel.indexOf('大兽潮') >= 0, '面板含兽潮名');
assert(panel.indexOf('稀有出没') >= 0 || panel.indexOf('雷鹰') >= 0 || panel.indexOf('稀有') >= 0, '面板含稀有出没提示');

console.log('\nworld-events v20.0: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail > 0 ? 1 : 0);
