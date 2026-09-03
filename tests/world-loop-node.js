// world-loop v20.0 主循环真集成测试
// 验证：newDay → 各模块 tickDay 串联 + 兽潮事件联动日历/日记/图鉴/物价/叙事 + 洞府空府野药 + 入园日结长经验

var pass = 0, fail = 0;
function assert(cond, msg) {
    if (cond) { pass++; console.log('  ✓ ' + msg); }
    else { fail++; console.log('  ✗ FAIL ' + msg); }
}
function section(s) { console.log('\n=== ' + s + ' ==='); }

var calls = {
    beastTide: 0, beastHeal: 0, market: 0, resource: 0, playerSect: 0,
    puppet: 0, cave: 0, dungeon: 0, narrative: 0, bond: 0
};
var events = [];
var calendarRegs = [];
var journalRecs = [];
var codexDisc = [];
var marketApplies = [];
var narraFlags = [];
var uiRefresh = [];
var addItems = [];
var savedBeast = 0;
var gardenBeasts = [];

// 初始 2 只驯养灵兽（都不在园）
var mockWindow = {
    WorldCalendar: { day: 1000 },
    getAbsoluteDay: function () { return 1000; },
    timeSystem: { gameTime: { currentDay: 1000 } },
    locationSystem: { getCityRegion: function (loc) { return loc; } },
    inventory: { currency: { spiritStones: 500 } },
    currentCharData: { location: '中州' },
    playerHouse: { type: 'cave' },   // 已买洞府
    tamedBeasts: [
        { uid: 'b1', templateId: 'spirit_fox', name: '灵狐', level: 1, exp: 0 },
        { uid: 'b2', templateId: 'wind_wolf', name: '风狼', level: 1, exp: 0 }
    ],
    EventBus: {
        _handlers: {},
        on: function (name, fn) { (mockWindow.EventBus._handlers[name] = mockWindow.EventBus._handlers[name] || []).push(fn); },
        emit: function (name, payload) { events.push({ name: name, payload: payload }); }
    },
    BeastTide: {
        tickDay: function () { calls.beastTide++; return { ok: true, active: [] }; },
        getRarityBoost: function () { return 1; },
        getActiveTide: function () { return null; },
        getCurrentPool: function () { return ['beast_lingfox']; },
        isRaidActive: function () { return false; }
    },
    BeastEvolution: {
        tickDayHealing: function () { calls.beastHeal++; return { ok: true }; },
        bondDay: function () { calls.bond++; return { ok: true }; },
        addExp: function () {},
        initBeast: function () {}
    },
    MarketDynamic: {
        tickDay: function () { calls.market++; return { ok: true }; },
        applyWorldEvent: function (name) { marketApplies.push(name); return { ok: true }; },
        priceMul: function (city, cat) { return 1.0; }
    },
    ResourcePoints: { tickDay: function () { calls.resource++; return { ok: true }; } },
    PlayerSect: { tickDay: function () { calls.playerSect++; return { ok: true }; } },
    PuppetSystem: {
        setSpiritStones: function () {},
        tickDay: function () { calls.puppet++; return { ok: true, consumed: 3 }; }
    },
    CaveFacilities: {
        getState: function () { return { caves: {} }; },
        ensureCave: function () { return { facilities: [], companions: [], history: [] }; },
        tickDay: function () { calls.cave++; return { ok: true, events: [] }; },
        getBuff: function () { return 0; }
    },
    DungeonDynamic: {
        generateDaily: function (day, month) { calls.dungeon++; return []; },
        listScouted: function () { return []; }
    },
    NarrativeConsequence: {
        processDay: function (day) { calls.narrative++; return { ok: true }; },
        applyConsequence: function (c) { narraFlags.push(c); return { ok: true }; }
    },
    BeastGarden: {
        listGardens: function (sectId) { return gardenBeasts.length ? [{ beasts: gardenBeasts }] : []; },
        getBuff: function (sectId) { return { trainingPct: 0.2, buffMul: 1.1 }; }
    },
    BeastEcosystem: {
        getActiveBeastBuff: function (cat) { return cat === 'scout' ? 1 : 0; }
    },
    WorldCalendar2: { register: function () {} },
    WorldJournal: { record: function (item) { journalRecs.push(item); return { ok: true }; } },
    Codex: { discover: function (cat, id, info) { codexDisc.push({ cat: cat, id: id }); return { ok: true }; } },
    refreshWorldEventsPanel: function () { uiRefresh.push('panel'); },
    renderBeastTemplates: function () { uiRefresh.push('templates'); },
    renderBeastList: function () { uiRefresh.push('list'); },
    addItem: function (id, n) { addItems.push(id); },
    saveBeastData: function () { savedBeast++; },
    showMessage: function (m) { msgs.push(m); },
    BeastTideAndGarden: {
        getState: function () { return { tides: tideState }; }
    }
};
var msgs = [];
var tideState = {};
// WorldCalendar 完整（覆盖上面的 day 精简版）
mockWindow.WorldCalendar = {
    day: 1000,
    register: function (item) { calendarRegs.push(item); return { ok: true }; },
    list: function () { return calendarRegs; }
};

var fs = require('fs');
var src = fs.readFileSync('D:/Download Game/仙侠世界/js/core/world-loop.js', 'utf8');
var wrapped = '(function(window){' + src + '})(mockWindow);';
eval(wrapped);

var W = mockWindow.WorldLoop;
assert(!!W, 'WorldLoop 已注册');
assert(W.HOUSE_TO_CAVE.cave === 'grass_hut', 'HOUSE_TO_CAVE 映射');

// ---- 1. 事件总线绑定 ----
section('1) newDay 绑定');
assert(Array.isArray(mockWindow.EventBus._handlers['newDay']), 'newDay 已订阅');
assert(Array.isArray(mockWindow.EventBus._handlers['beast:tideStarted']), 'beast:tideStarted 已订阅');
assert(Array.isArray(mockWindow.EventBus._handlers['beast:tideEnded']), 'beast:tideEnded 已订阅');

// ---- 2. tickAll 串联各模块 ----
section('2) tickAll 串联 tickDay');
var r1 = W.tickAll({ newDay: 1000 });
assert(r1.day === 1000, 'day 1000');
// (1000-1)%360 = 279; 279/30=9; +1 = 10
assert(r1.month === 10, 'month 计算 = 10 (got ' + r1.month + ')');
assert(calls.beastTide === 1, 'BeastTide.tickDay 1 次');
assert(calls.beastHeal === 1, 'BeastEvolution.tickDayHealing 1 次');
assert(calls.market === 1, 'MarketDynamic.tickDay 1 次');
assert(calls.resource === 1, 'ResourcePoints.tickDay 1 次');
assert(calls.playerSect === 1, 'PlayerSect.tickDay 1 次');
assert(calls.puppet === 1, 'PuppetSystem.tickDay 1 次');
assert(calls.cave === 1, 'CaveFacilities.tickDay 1 次（有洞府）');
assert(calls.dungeon === 1, 'DungeonDynamic.generateDaily 1 次');
assert(calls.narrative === 1, 'NarrativeConsequence.processDay 1 次');
assert(calls.bond === 2, 'BeastEvolution.bondDay 2 次（2 只）');

// ---- 3. 同一天不重复 ----
section('3) 同一天防重复');
var r2 = W.tickAll({ newDay: 1000 });
assert(r2.skipped === true, '同一天 skipped');
assert(calls.beastTide === 1, '同一天 BeastTide 不重复');

// 换一天继续
W.tickAll({ newDay: 1001 });
assert(calls.beastTide === 2, '新一天 BeastTide 再跑');

// ---- 4. 兽潮事件联动 ----
section('4) beast:tideStarted 联动');
var starter = mockWindow.EventBus._handlers['beast:tideStarted'][0];
starter({ tideId: 'tide_x', level: 'tide_5', name: '大兽潮', rareAdded: ['thunder_eagle', 'dragon_turtle', 'fire_phoenix'], duration: 21 });
assert(calendarRegs.length >= 1, '日历注册 1 条');
assert(calendarRegs[0].category === 'world_event', '日历 world_event');
assert(calendarRegs[0].source.system === 'beast-tide', '日历 source beast-tide');
assert(journalRecs.length >= 1 && journalRecs[0].type === 'beast_tide', '日记 record beast_tide');
assert(codexDisc.some(function (c) { return c.cat === 'codex_world' && c.id === 'beast_tide_tide_5'; }), '图鉴 codex_world');
assert(codexDisc.some(function (c) { return c.cat === 'codex_beast' && c.id === 'thunder_eagle'; }), '图鉴 codex_beast 稀有');
assert(marketApplies.indexOf('beast_flood') >= 0, '物价 applyWorldEvent beast_flood');
assert(narraFlags.some(function (c) { return c.type === 'worldFlag' && c.flag === 'beast_tide_active'; }), '叙事 worldFlag beast_tide_active');
assert(uiRefresh.length >= 1, 'UI 刷新被调');

// ---- 5. 兽潮结束联动 ----
section('5) beast:tideEnded 联动');
var ender = mockWindow.EventBus._handlers['beast:tideEnded'][0];
var recBefore = journalRecs.length;
ender({ tideId: 'tide_x', level: 'tide_5' });
assert(journalRecs.length === recBefore + 1, '日记 record beast_tide_end');
assert(narraFlags.some(function (c) { return c.type === 'worldFlag' && c.flag === 'beast_tide_active' && c.value === false; }), '叙事 flag 关闭');

// ---- 6. 洞府日结空府野药进包 ----
section('6) 洞府琐事进包');
// 让 cave.tickDay 返回 empty_wild_herb 事件
mockWindow.CaveFacilities.tickDay = function () {
    calls.cave++;
    return { ok: true, events: [{ id: 'empty_wild_herb', text: '石缝野药' }] };
};
W.resetTickGuard();
var r6 = W.tickAll({ newDay: 1002 });
assert(addItems.indexOf('mat_spirit_grass') >= 0, '空府野药 → mat_spirit_grass 入包');

// 同伴灵药
addItems = [];
mockWindow.CaveFacilities.tickDay = function () {
    calls.cave++;
    return { ok: true, events: [{ id: 'companion_found_herb', text: '道侣发现灵药' }] };
};
W.resetTickGuard();
W.tickAll({ newDay: 1003 });
assert(addItems.indexOf('mat_lingzhi') >= 0, '道侣灵药 → mat_lingzhi 入包');

// ---- 7. 入园灵兽日结长经验 ----
section('7) 入园日结长经验');
// b1 入园、b2 未入园
gardenBeasts = ['b1'];
W.resetTickGuard();
var r7 = W.tickAll({ newDay: 1004 });
assert(r7.penTrain && r7.penTrain.trained === 1, '入园 1 只长经验 (got ' + (r7.penTrain && r7.penTrain.trained) + ')');
assert(mockWindow.tamedBeasts[0].exp > 0, 'b1 经验增长');
assert(mockWindow.tamedBeasts[1].exp === 0, 'b2 未入园经验不变');
// 园加成 0.2 → gain = round(4 * 1.2) = 5
assert(mockWindow.tamedBeasts[0].exp === 5, 'b1 经验 = 4*(1+0.2) = 5 (got ' + mockWindow.tamedBeasts[0].exp + ')');
assert(savedBeast >= 1, 'saveBeastData 被调');

// ---- 8. 雷鹰侦察 ----
section('8) 雷鹰侦察');
var r8 = W.tickAll({ newDay: 1005 });
assert(r8.scout && r8.scout.ok === true, 'EagleScout 探到 0 条空');
assert(r8.scout.found === 0, 'scout found=0');

// ---- 9. mapMarketCity ----
section('9) mapMarketCity');
assert(W.mapMarketCity('中州') === '中州', '中州 → 中州');
assert(W.mapMarketCity('西漠') === '西荒', '西漠 → 西荒');
assert(W.mapMarketCity('东南海域') === '东海', '东南海域 → 东海');
assert(W.mapMarketCity('') === '中州', '空 → 中州');

// ---- 10. 潮息临近催清剿 ----
section('10) 潮息临近催清剿');
// 设置一个剩余 2 天的 tide → tickAll 应提醒 + 日历登记
tideState['tide_near'] = { level: 'tide_5', name: '大兽潮', startedDay: 1000, expireDay: 1003, rareAdded: [], opts: {} };
msgs = [];
calendarRegs = calendarRegs.filter(function (r) { return r.id.indexOf('beast_tide.remind') < 0; });
W.resetTickGuard();
var r10 = W.tickAll({ newDay: 1001 });
assert(r10.tideRemind && r10.tideRemind.ok === true, 'tideRemind 执行 (ok=' + (r10.tideRemind && r10.tideRemind.ok) + ')');
assert(msgs.some(function (m) { return m.indexOf('还有 2 天') >= 0 && m.indexOf('清剿') >= 0; }), '提醒消息含"还有 2 天…清剿" (got ' + msgs.join('|') + ')');
assert(calendarRegs.some(function (r) { return r.id.indexOf('beast_tide.remind') >= 0 && r.title.indexOf('即将平息') >= 0; }), '日历登记"即将平息"提醒');

// 同一天不重复提醒
msgs = [];
W.tickAll({ newDay: 1001 });
assert(!msgs.some(function (m) { return m.indexOf('还有 2 天') >= 0; }), '同一天不重复提醒');

// 剩余天数 > 3 不提醒（先清掉 tide_near，避免剩余 1 天干扰）
delete tideState['tide_near'];
tideState['tide_far'] = { level: 'tide_3', name: '中兽潮', startedDay: 1000, expireDay: 1010, rareAdded: [], opts: {} };
msgs = [];
W.resetTickGuard();
W.tickAll({ newDay: 1002 });
assert(!msgs.some(function (m) { return m.indexOf('还有') >= 0 && m.indexOf('清剿') >= 0; }), '剩余 >3 天不提醒 (got ' + msgs.join('|') + ')');
delete tideState['tide_far'];

console.log('\nworld-loop v20.0: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail > 0 ? 1 : 0);
