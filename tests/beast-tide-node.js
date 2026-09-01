// beast-tide v19.20 测试

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
var src = fs.readFileSync('D:/Download Game/仙侠世界/js/extensions/beast-tide.js', 'utf8');
var wrapped = '(function(window){' + src + '})(mockWindow);';
eval(wrapped);
var T = mockWindow.BeastTide;
var G = mockWindow.BeastGarden;
var M = mockWindow.BeastTideAndGarden;
assert(!!T, 'BeastTide 已注册');
assert(!!G, 'BeastGarden 已注册');
assert(!!M, 'BeastTideAndGarden 已注册');
assert(Object.keys(T.TIDE_LEVELS).length === 10, '10 兽潮等级 (got ' + Object.keys(T.TIDE_LEVELS).length + ')');
assert(T.BASE_POOL.length === 10, '10 基础池');
assert(T.GARDEN_COST === 100, '园建设 100');

// ---- 1. 10 兽潮等级 ----
section('1) 10 兽潮等级');
var levels = T.listTideLevels();
assert(levels.length === 10, 'list 10');
var t1 = T.TIDE_LEVELS.tide_1;
assert(t1.name === '小兽潮', '小兽潮');
assert(t1.duration === 7, '7 天');
var t10 = T.TIDE_LEVELS.tide_10;
assert(t10.name === '仙劫潮', '仙劫潮');
assert(t10.rareAdded.length === 10, '仙劫潮 10 稀有 (got ' + t10.rareAdded.length + ')');
assert(t10.rareAdded.indexOf('kunpeng') >= 0, '含鲲鹏');
assert(t10.rareAdded.indexOf('golden_crow') >= 0, '含金乌');
assert(t1.rarityBoost === 1, 'tide_1 boost 1');
assert(t10.rarityBoost === 3, 'tide_10 boost 3');

// ---- 2. triggerTide ----
section('2) triggerTide');
var tr1 = T.triggerTide('tide_1');
assert(tr1.ok, 'tide_1 OK');
assert(tr1.duration === 7, 'duration 7');
assert((listeners['beast:tideStarted'] || []).length === 1, 'started 事件');

var tr3 = T.triggerTide('tide_3');
assert(tr3.ok && tr3.rareAdded.length === 1, 'tide_3 rareAdded 1');
assert(tr3.rareAdded.indexOf('thunder_eagle') >= 0, '含雷鹰');

var tr5 = T.triggerTide('tide_5');
assert(tr5.ok && tr5.rareAdded.length === 3, 'tide_5 rareAdded 3');

// 累计 multiple tides
assert(T.getActiveTide() !== null, 'active tide');
assert(T.isRaidActive() === true, 'isRaidActive true');

// ---- 3. 捕捉池 ----
section('3) 捕捉池');
var pool = T.getCurrentPool();
log('  active tide: ' + T.getActiveTide().name);
log('  pool length: ' + pool.length);
assert(pool.length >= 13, '池 ≥ 13 (got ' + pool.length + ')');  // 10 + 3 tide_5
assert(pool.indexOf('beast_lingfox') >= 0, '基础池含灵狐');
assert(pool.indexOf('thunder_eagle') >= 0, 'tide_5 池含雷鹰');
assert(pool.indexOf('dragon_turtle') >= 0, 'tide_5 池含龙龟');

// tide_10 覆盖
T.triggerTide('tide_10');
var pool10 = T.getCurrentPool();
log('  pool10 length: ' + pool10.length);
assert(pool10.length === 20, 'tide_10 全 20 (10 base + 10 rare)');
assert(pool10.indexOf('kunpeng') >= 0, '含鲲鹏');

// rarity boost
assert(T.getRarityBoost() === 3, 'tide_10 boost 3');

// endTide
var tideId = T.getActiveTide() ? Object.keys(T.getActiveTide())[0] : null;
// Actually getActiveTide returns the tide object, not key. Let me get key
var activeKeys = Object.keys(mockWindow.BeastTideAndGarden.getState().tides);
log('  activeKeys: ' + activeKeys.join(','));
// End all active tides to clean up
for (var k = 0; k < activeKeys.length; k++) {
    T.endTide(activeKeys[k]);
}
assert((listeners['beast:tideEnded'] || []).length >= 1, 'ended 事件');

// ---- 4. tickDay ----
section('4) tickDay');
T.triggerTide('tide_5');
mockWindow.WorldCalendar.day = 1030; // 30 天后
var tk1 = T.tickDay();
log('  tickDay: ' + JSON.stringify(tk1.active.map(function (t) { return t.name; })));
// tide_5 持续 21 天, day 1021 后应过期
assert(tk1.active.length === 0, '30 天后所有 tide 过期');

// 园 daysActive
M.build('sect_1', { skipPay: true });
M.build('sect_1', { skipPay: true, allowMultiple: true });
T.tickDay();
T.tickDay();
var gardens = G.listGardens('sect_1');
log('  sect_1 园数: ' + gardens.length);
assert(gardens.length === 2, '2 园');
assert(gardens[0].daysActive >= 2, 'daysActive ≥ 2');

// v20.0: 一宗一园（同宗连建失败）
var full = M.build('sect_1', { skipPay: true });
log('  同宗连建 reason: ' + (full && full.reason));
assert(full.ok === false && full.reason === 'sect-garden-full', '一宗一园拒绝');

// v20.0: 拆园退一半灵石（mock 跳过实际扣）
var g0 = gardens[0].gardenId;
var stash = (mockWindow.inventory && mockWindow.inventory.currency) || { spiritStones: 0 };
mockWindow.inventory = mockWindow.inventory || {};
mockWindow.inventory.currency = stash;
stash.spiritStones = 200;
var r = M.remove(g0);
log('  拆园 refund: ' + r.refund + ' (期望 50)');
assert(r.ok === true && r.refund === 50, '拆园退 50');
assert(stash.spiritStones === 250, '拆园后灵石 +50');

// ---- 5. 灵兽园 ----
section('5) 灵兽园');
// v20.0：给 mock 装 inventory.currency 以便 _payGardenCost 通过
mockWindow.inventory = mockWindow.inventory || {};
mockWindow.inventory.currency = mockWindow.inventory.currency || { spiritStones: 1000 };
// section 4 留了 1 园（拆了一个），先清空 sect_1
var _stale = G.listGardens('sect_1').slice();
for (var _si = 0; _si < _stale.length; _si++) G.remove(_stale[_si].gardenId, { skipRefund: true });
var b1 = G.build('sect_1');
assert(b1.ok, '建园 OK');
assert(b1.cost === 100, 'cost 100');
assert((listeners['beast:gardenBuilt'] || []).length >= 1, 'built 事件');

var b2 = G.build('sect_1', { allowMultiple: true });  // 多个园
assert(b2.ok, '再建园 OK');

// 加灵兽
var ab1 = G.addBeast(b1.gardenId, 'beast_a');
assert(ab1, 'addBeast OK');
var ab2 = G.addBeast(b1.gardenId, 'beast_a');  // 重复
assert(!ab2, '重复 addBeast 拒');

var rb1 = G.removeBeast(b1.gardenId, 'beast_a');
assert(rb1, 'removeBeast OK');
var rb2 = G.removeBeast(b1.gardenId, 'invalid');
assert(!rb2, '不存在 removeBeast 拒');

// getBuff 累加
var buff = G.getBuff('sect_1');
log('  buff: ' + JSON.stringify(buff));
assert(buff.trainingPct >= 0.4, '≥ 2 园 0.4 (got ' + buff.trainingPct + ')');
assert(buff.buffMul > 1, 'buffMul > 1');

// 没园
var emptyBuff = G.getBuff('sect_empty');
assert(emptyBuff.trainingPct === 0, '无园 0');
assert(emptyBuff.buffMul === 1.0, 'buffMul=1.0');

// remove
var rm1 = G.remove(b1.gardenId);
assert(rm1.ok, 'remove OK');
var rm2 = G.remove('invalid');
assert(!rm2.ok, '不存在 remove 拒');

// ---- 6. 失败 ----
section('6) 失败');
var f1 = T.triggerTide('unknown_level');
assert(!f1.ok && f1.reason === 'unknown-level', '未知等级拒');
var f2 = T.endTide('not_a_tide');
assert(!f2.ok, '不存在 tide 拒');
var f3 = G.build();
assert(!f3.ok && f3.reason === 'no-sectId', '无 sectId 拒');
var f4 = G.addBeast('not_a_garden', 'beast_a');
assert(!f4, '不存在园 addBeast 拒');
var f5 = G.getBuff('not_a_sect');
assert(f5.trainingPct === 0, '不存在 sect 0');

// ---- 7. 事件总线 ----
section('7) 事件总线');
assert((listeners['beast:tideStarted'] || []).length >= 2, 'tideStarted ≥ 2');
assert((listeners['beast:tideEnded'] || []).length >= 1, 'tideEnded ≥ 1');
assert((listeners['beast:gardenBuilt'] || []).length >= 1, 'gardenBuilt ≥ 1');

// ---- 8. StateRegistry ----
section('8) StateRegistry v1');
var snap = mockWindow.StateRegistry.exportAll();
assert(snap.beastTideAndGarden, 'beastTideAndGarden 已注册');
var btag = snap.beastTideAndGarden && snap.beastTideAndGarden.data;
assert(btag, 'data 可访问');
assert(btag && Object.keys(btag.gardens).length >= 1, '≥ 1 园');
var g1 = Object.keys(btag.gardens)[0];
var gd1 = btag.gardens[g1];
assert(gd1.sectId === 'sect_1' || gd1.sectId === 'sect_2' || gd1.sectId === 'sect_3', 'sect 正确');

// ---- 9. 性能 ----
section('9) 性能 100 园 × 100 天');
for (var pi = 0; pi < 100; pi++) {
    var b = G.build('perf_' + pi);
    G.addBeast(b.gardenId, 'beast_perf_' + pi);
}
T.triggerTide('tide_10');
var t0 = Date.now();
for (var pj = 0; pj < 100; pj++) T.tickDay();
var dur = Date.now() - t0;
log('  100 园 + tide_10 × 100 天: ' + dur + 'ms');
assert(dur < 200, '< 200ms');

function log(msg) { console.log('  ' + msg); }

console.log('\n=========================================');
console.log('beast-tide v19.20: ' + pass + ' passed, ' + fail + ' failed');
console.log('=========================================');
process.exit(fail > 0 ? 1 : 0);
