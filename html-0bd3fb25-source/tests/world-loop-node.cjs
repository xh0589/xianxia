// world-loop v20.0 主循环真集成测试

var pass = 0, fail = 0;
function assert(cond, msg) {
    if (cond) { pass++; console.log('  ✓ ' + msg); }
    else { fail++; console.log('  ✗ FAIL ' + msg); }
}
function section(s) { console.log('\n=== ' + s + ' ==='); }
function log(msg) { console.log('  ' + msg); }

var path = require('path');
var fs = require('fs');

var listeners = {};
var handlers = {};
var mockWindow = {
    WorldCalendar: {
        day: 1000,
        register: function (def) {
            (listeners['calendar:register'] = listeners['calendar:register'] || []).push(def);
            return { ok: true, id: def.id };
        }
    },
    EventBus: {
        on: function (name, cb) {
            (handlers[name] = handlers[name] || []).push(cb);
            return this;
        },
        emit: function (name, payload) {
            (listeners[name] = listeners[name] || []).push(payload);
            var list = handlers[name] || [];
            for (var i = 0; i < list.length; i++) {
                try { list[i](payload); } catch (e) { console.error(e); }
            }
        }
    },
    StateRegistry: {
        _handlers: {},
        register: function (k, h) { mockWindow.StateRegistry._handlers[k] = h; }
    },
    Codex: {
        discovered: [],
        discover: function (codexId, itemId, info) {
            mockWindow.Codex.discovered.push({ codexId: codexId, itemId: itemId, info: info });
            return { ok: true, already: false };
        }
    },
    WorldJournal: {
        entries: [],
        record: function (ev) {
            mockWindow.WorldJournal.entries.push(ev);
            return { ok: true, entry: ev };
        }
    },
    NarrativeConsequence: {
        flags: {},
        applyConsequence: function (c) {
            if (c.type === 'worldFlag') mockWindow.NarrativeConsequence.flags[c.flag] = c.value;
            return { ok: true };
        },
        processDay: function (day) { return { ok: true, fired: [], day: day }; }
    },
    tamedBeasts: [],
    inventory: { currency: { spiritStones: 500 } },
    getAbsoluteDay: function () { return mockWindow.WorldCalendar.day; }
};

function loadExt(rel) {
    var src = fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
    var wrapped = '(function(window){' + src + '})(mockWindow);';
    eval(wrapped);
}

loadExt('js/extensions/beast-tide.js');
loadExt('js/extensions/beast-evolution.js');
loadExt('js/extensions/market-dynamic.js');
loadExt('js/extensions/cave-facilities.js');
loadExt('js/extensions/player-sect.js');
loadExt('js/extensions/resource-points.js');
loadExt('js/extensions/puppet-system.js');
loadExt('js/extensions/dungeon-dynamic.js');
loadExt('js/core/world-loop.js');

var L = mockWindow.WorldLoop;
var T = mockWindow.BeastTide;
var M = mockWindow.MarketDynamic;
var C = mockWindow.CaveFacilities;

assert(!!L, 'WorldLoop 已注册');
assert(!!T, 'BeastTide 已注册');
assert(typeof L.tickAll === 'function', 'tickAll');
assert(typeof L.mapMarketCity === 'function', 'mapMarketCity');
assert(!!handlers['newDay'] && handlers['newDay'].length >= 1, '已订阅 newDay');
assert(!!handlers['beast:tideStarted'] && handlers['beast:tideStarted'].length >= 1, '已订阅 tideStarted');

section('1) 城市映射');
assert(L.mapMarketCity('中州') === '中州', '中州');
assert(L.mapMarketCity('西漠') === '西荒', '西漠→西荒');
assert(L.mapMarketCity('东荒') === '中州', '东荒→中州');
assert(L.mapMarketCity('') === '中州', '空→中州');
assert(L.HOUSE_TO_CAVE.palace === 'immortal_manor', '仙府映射');

section('2) newDay 编排');
mockWindow.WorldCalendar.day = 1001;
mockWindow.EventBus.emit('newDay', { oldDay: 1000, newDay: 1001 });
assert(L.lastTickDay === 1001, 'lastTickDay=1001');
var r1 = L.tickAll({ newDay: 1001 });
assert(r1.skipped === true, '同日二次 tick 幂等跳过');

mockWindow.WorldCalendar.day = 1002;
var r2 = L.tickAll({ newDay: 1002 });
assert(r2.ok !== false && r2.skipped !== true, '跨日再 tick');
assert(r2.day === 1002, 'day 1002');
assert(r2.market && r2.market.ok, '市场日结');
assert(r2.resource && r2.resource.ok, '资源点日结');
assert(r2.beastTide && r2.beastTide.ok, '兽潮日结');
assert(r2.beastHeal && r2.beastHeal.ok, '灵兽休养');
assert(r2.playerSect && r2.playerSect.ok, '玩家宗门日结');
assert(r2.puppet && r2.puppet.ok, '傀儡日结');
assert(r2.cave && r2.cave.ok, '洞府日结');
assert(r2.cave.skipped === true, '无洞府时跳过新建');
assert(r2.narrative && r2.narrative.ok, '叙事日结');

section('3) 兽潮过期走日结');
L.resetTickGuard();
mockWindow.WorldCalendar.day = 2000;
var tr = T.triggerTide('tide_1', { duration: 7 });
assert(tr.ok, '触发小兽潮');
assert(T.isRaidActive() === true, '兽潮进行中');
mockWindow.WorldCalendar.day = 2008;
L.resetTickGuard();
var r3 = L.tickAll({ newDay: 2008 });
assert(T.isRaidActive() === false, '日结后小兽潮过期');
assert((listeners['beast:tideEnded'] || []).length >= 1, 'tideEnded 事件');

section('4) 兽潮开始桥接日历/大事记/图鉴/市场');
L.resetTickGuard();
mockWindow.WorldCalendar.day = 3000;
listeners['calendar:register'] = [];
mockWindow.WorldJournal.entries = [];
mockWindow.Codex.discovered = [];
var tr5 = T.triggerTide('tide_5', { duration: 21 });
assert(tr5.ok, '大兽潮');
assert((listeners['beast:tideStarted'] || []).length >= 1, 'tideStarted');
assert((listeners['calendar:register'] || []).length >= 1, '日历登记结束日');
var cal = listeners['calendar:register'][listeners['calendar:register'].length - 1];
assert(cal.category === 'world_event', '日历 category=world_event');
assert(cal.dueAbsoluteDay === 3021, '结束日 3000+21');
assert(mockWindow.WorldJournal.entries.length >= 1, '大事记写入');
assert(mockWindow.WorldJournal.entries[0].type === 'beast_tide', '大事记类型');
var beastCodex = mockWindow.Codex.discovered.filter(function (d) { return d.codexId === 'codex_beast'; });
assert(beastCodex.length >= 1, '稀有灵兽写入图鉴');
assert(mockWindow.NarrativeConsequence.flags.beast_tide_active === 'tide_5', 'worldFlag');
assert(M.listActiveEvents().some(function (e) { return e.id === 'beast_flood'; }), '市场兽潮供需');

section('5) 捕捉池随兽潮变化');
var pool = T.getCurrentPool();
assert(pool.indexOf('beast_lingfox') >= 0, '基础池灵狐');
assert(pool.indexOf('thunder_eagle') >= 0, '大兽潮含雷鹰');
assert(pool.indexOf('dragon_turtle') >= 0, '大兽潮含龙龟');
assert(T.getRarityBoost() === 2, '大兽潮 boost 2');

section('6) 洞府 ensureCave 导出');
assert(typeof C.ensureCave === 'function', 'ensureCave 公开');
var cave = C.ensureCave('player', 'spirit_manor');
assert(cave.level === 'spirit_manor', '灵府档');
assert(C.getAvailableSlots('player') === 3, '灵府 3 槽');

section('7) 市场乘数被日结推动');
var mulBefore = M.priceMul('南疆', '药材');
assert(typeof mulBefore === 'number' && mulBefore > 0, '南疆药材乘数');
M.applyWorldEvent('harvest');
var mulAfter = M.priceMul('南疆', '药材');
assert(mulAfter < mulBefore || mulAfter !== mulBefore, '丰收改变药材价');

section('8) 灵兽园扣费');
var stones0 = mockWindow.inventory.currency.spiritStones;
var gPay = mockWindow.BeastGarden.build('散修园');
assert(gPay.ok, '有灵石可建园');
assert(mockWindow.inventory.currency.spiritStones === stones0 - 100, '建园扣 100');
var gDup = mockWindow.BeastGarden.build('散修园');
assert(!gDup.ok && gDup.reason === 'sect-garden-full', '同宗第二园拒');
mockWindow.BeastGarden.remove(gPay.gardenId);
mockWindow.inventory.currency.spiritStones = 5;
var gFail = mockWindow.BeastGarden.build('散修园');
assert(!gFail.ok && gFail.reason === 'spiritStones-low', '灵石不足拒建园');
mockWindow.inventory.currency.spiritStones = 10000;
var g2 = mockWindow.BeastGarden.build('散修园');
var stones1 = mockWindow.inventory.currency.spiritStones;
var dismantled = mockWindow.BeastGarden.remove(g2.gardenId);
assert(dismantled.ok && dismantled.refund === 50, '拆园退 50');
assert(mockWindow.inventory.currency.spiritStones === stones1 + 50, '拆园灵石到账');

section('9) 清剿多波');
global.window = mockWindow;
mockWindow._tideRaid = { wave: 1, waves: 3, cores: 0, tempering: 0 };
mockWindow.addItem = function (id, n) { mockWindow._added = (mockWindow._added || 0) + n; return true; };
mockWindow.currentCharData = { tempering: 0, health: 100, maxHealth: 100, energy: 80, qi: 40 };
mockWindow.showMessage = function () {};
mockWindow.WorldJournal = { entries: [], record: function (ev) { this.entries.push(ev); return { ok: true }; } };
var srcAppSettle = fs.readFileSync(path.join(__dirname, '..', 'js/app.js'), 'utf8');
var iWound = srcAppSettle.indexOf('function applyBeastTideDefeatWound');
var iSettle = srcAppSettle.indexOf('function settleBeastTideRaid');
var iNext = srcAppSettle.indexOf('\nfunction ', iSettle + 10);
assert(iWound > 0 && iSettle > iWound && iNext > iSettle, '清剿伤势/结算源码可抽取');
eval(srcAppSettle.slice(iWound, iNext));
var w1 = settleBeastTideRaid(true);
assert(w1.ok && w1.more === true && w1.wave === 1, '第一波未完');
mockWindow._tideRaid.wave = 3;
var w3 = settleBeastTideRaid(true);
assert(w3.ok && w3.more === false, '末波完结');
assert(mockWindow._tideRaid == null, '清剿状态清空');
mockWindow._tideRaid = { wave: 2, waves: 3, cores: 2, tempering: 50 };
var lose = settleBeastTideRaid(false);
assert(lose.ok === false, '中途战败中断');
assert(mockWindow.currentCharData.health < 100, '战败扣气血');
assert(mockWindow.currentCharData.health >= 1, '战败不致死');
assert(mockWindow.WorldJournal.entries.some(function (e) { return e.type === 'beast_tide_raid_fail'; }), '战败写入大事记');

section('9b) 灵兽栏日结与侦察');
loadExt('js/extensions/beast-ecosystem.js');
mockWindow.tamedBeasts = [{ uid: 'fox_1', templateId: 'spirit_fox', name: '灵狐', exp: 0, level: 1 }];
var gPen = mockWindow.BeastGarden.build('散修园2', { skipPay: true });
assert(gPen.ok, '日结用园');
mockWindow.BeastGarden.addBeast(gPen.gardenId, 'fox_1');
mockWindow.discipleState = { isInSect: false, sectId: '散修园2' };
L.resetTickGuard();
mockWindow.WorldCalendar.day = 5000;
var pen = L.tickAll({ newDay: 5000 });
assert(pen.penTrain && pen.penTrain.trained >= 1, '入园灵兽日结长经验');
assert(mockWindow.tamedBeasts[0].exp > 0, '经验增加');
assert(typeof mockWindow.DungeonDynamic.listScouted === 'function', 'listScouted 导出');
assert(mockWindow.DungeonDynamic.getScoutChanceMul() === 1, '无雷鹰侦察倍率 1');
mockWindow.tamedBeasts = [{ templateId: 'thunder_eagle', name: '雷鹰' }];
assert(mockWindow.BeastEcosystem.getActiveBeastBuff('scout') > 0, '雷鹰 scout');
assert(mockWindow.DungeonDynamic.getScoutChanceMul() === 1.5, '有雷鹰侦察倍率 1.5');
var scouted = mockWindow.DungeonDynamic.listScouted();
assert(Array.isArray(scouted), '侦察名单是数组');
mockWindow.DungeonDynamic.generateDaily(80, 3);
var scouted2 = mockWindow.DungeonDynamic.listScouted();
if (scouted2.length) {
    var er = mockWindow.DungeonDynamic.enter(scouted2[0].id);
    assert(er.ok, '探到的秘境能进入');
    mockWindow.DungeonDynamic.leave(scouted2[0].id);
}

section('10) 性能');

L.resetTickGuard();
var t0 = Date.now();
for (var d = 4000; d < 4100; d++) {
    mockWindow.WorldCalendar.day = d;
    L.resetTickGuard();
    L.tickAll({ newDay: d });
}
var dur = Date.now() - t0;
log('100 天 tickAll: ' + dur + 'ms');
assert(dur < 500, '100 天 < 500ms');

console.log('\n=========================================');
console.log('world-loop v20.0: ' + pass + ' passed, ' + fail + ' failed');
console.log('=========================================');
process.exit(fail > 0 ? 1 : 0);
