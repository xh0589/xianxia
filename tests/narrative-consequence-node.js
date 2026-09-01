// narrative-consequence v19.15 §9 测试

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
    },
    // mock ResourcePoints（v19.10）
    ResourcePoints: {
        _points: { 'vein_test': { exhausted: 0.3, maxExhausted: 0.8 } },
        getPoint: function (id) { return this._points[id]; }
    }
};
var fs = require('fs');
var src = fs.readFileSync('D:/Download Game/仙侠世界/js/extensions/narrative-consequence.js', 'utf8');
var wrapped = '(function(window){' + src + '})(mockWindow);';
eval(wrapped);
var N = mockWindow.NarrativeConsequence;
assert(!!N, 'NarrativeConsequence 已注册');
assert(typeof N.applyConsequence === 'function', 'applyConsequence 已注册');
assert(typeof N.scheduleDelayed === 'function', 'scheduleDelayed 已注册');

// ---- 1. 7 类 setter ----
section('1) 7 类 setter');
// npcRelation
var r1 = N.applyConsequence({ type: 'npcRelation', npcId: 'a', delta: 10 });
assert(r1.ok, 'npcRelation OK');
assert(N.getState().npcRelations.a.length === 1, 'a 1 关系记录');
assert(N.getState().npcRelations.a[0].delta === 10, 'delta 10');
assert(N.listNpcRelations('a').length === 1, 'listNpcRelations OK');

// sectRelation
var r2 = N.applyConsequence({ type: 'sectRelation', sectId: '少林寺', delta: 5 });
assert(r2.ok, 'sectRelation OK');
assert(N.getState().sectRelations['少林寺'].length === 1, '少林寺 1 关系');

// cityState
var r3 = N.applyConsequence({ type: 'cityState', cityId: '中州', state: 'under_attack' });
assert(r3.ok, 'cityState OK');
assert(N.getState().cityStates['中州'][0].state === 'under_attack', 'state');

// resourceNode（与 v19.10 集成）
var r4 = N.applyConsequence({ type: 'resourceNode', nodeId: 'vein_test', delta: 0.1 });
assert(r4.ok, 'resourceNode OK');
assert(mockWindow.ResourcePoints._points.vein_test.exhausted === 0.4, 'exhausted 0.3+0.1=0.4');

// worldFlag
var r5 = N.applyConsequence({ type: 'worldFlag', flag: 'saved_x', value: 'true' });
assert(r5.ok, 'worldFlag OK');
assert(N.getFlag('saved_x') === 'true', 'flag saved_x=true');

// rumor
var r6 = N.applyConsequence({ type: 'rumor', text: '测试传闻' });
assert(r6.ok, 'rumor OK');
assert(N.getRumor(r6.id).text === '测试传闻', 'rumor 查询');

// futureEventWeight
var r7 = N.applyConsequence({ type: 'futureEventWeight', eventId: 'e1', delta: 25 });
assert(r7.ok, 'futureEventWeight OK');
assert(N.getState().futureWeights.e1 === 25, 'e1 weight 25');

// ---- 2. 失败 ----
section('2) 失败');
var f1 = N.applyConsequence(null);
assert(!f1.ok, 'null 拒');
var f2 = N.applyConsequence({});
assert(!f2.ok && f2.reason === 'no-type', '无 type 拒');
var f3 = N.applyConsequence({ type: 'unknown_xxx' });
assert(!f3.ok && f3.reason === 'unknown-type', '未知 type 拒');
var f4 = N.applyConsequence({ type: 'npcRelation' });
assert(!f4.ok && f4.reason === 'no-npcId', 'npcRelation 缺 npcId 拒');
var f5 = N.applyConsequence({ type: 'worldFlag' });
assert(!f5.ok && f5.reason === 'no-flag', 'worldFlag 缺 flag 拒');
var f6 = N.applyConsequence({ type: 'rumor' });
assert(!f6.ok && f6.reason === 'no-text', 'rumor 缺 text 拒');

// ---- 3. applyConsequences 批量 ----
section('3) 批量');
var bl = N.applyConsequences([
    { type: 'worldFlag', flag: 'batch1', value: 1 },
    { type: 'worldFlag', flag: 'batch2', value: 2 }
]);
assert(bl.ok && bl.applied.length === 2, '批量 2 应用');
assert(N.getFlag('batch1') === 1 && N.getFlag('batch2') === 2, 'batch1/2 已存');

// ---- 4. scheduleDelayed + processDay ----
section('4) 延迟反馈');
var sd1 = N.scheduleDelayed({ type: 'worldFlag', flag: 'delayed_1', value: 'day5' }, 1005);
assert(sd1.ok, 'schedule OK');
assert(sd1.fireDay === 1005, 'fireDay');
assert(sd1.scheduledId.indexOf('sch_') === 0, 'scheduledId');
assert(N.getState().scheduled.length === 1, 'scheduled 1 条');

var pd1 = N.processDay(1003);
assert(pd1.fired.length === 0, 'day 1003 无触发');
var pd2 = N.processDay(1005);
assert(pd2.fired.length === 1, 'day 1005 触发 1');
assert(N.getFlag('delayed_1') === 'day5', '延迟 flag 已应用');
var pd3 = N.processDay(1010);
assert(pd3.fired.length === 0, '已应用不再触发');

// 多个 delayed
N.scheduleDelayed({ type: 'worldFlag', flag: 'd_a', value: 'A' }, 1010);
N.scheduleDelayed({ type: 'worldFlag', flag: 'd_b', value: 'B' }, 1012);
N.scheduleDelayed({ type: 'worldFlag', flag: 'd_c', value: 'C' }, 1015);
var pd4 = N.processDay(1013);
assert(pd4.fired.length === 2, 'day 1013 触发 d_a + d_b (got ' + pd4.fired.length + ')');
assert(N.getFlag('d_a') === 'A', 'd_a OK');
assert(N.getFlag('d_b') === 'B', 'd_b OK');
assert(N.getFlag('d_c') === undefined, 'd_c 未触发');

// 过期（已过去的 fireDay 应被立即触发）
N.scheduleDelayed({ type: 'worldFlag', flag: 'past', value: 'P' }, 500);
var pd5 = N.processDay(1000);
assert(pd5.fired.length === 1, '过去 scheduled 应触发 (got ' + pd5.fired.length + ')');
assert(N.getFlag('past') === 'P', 'past flag 已应用');
// 第二次 processDay 不重复
var pd5b = N.processDay(1000);
assert(pd5b.fired.length === 0, '不重复触发');

// cancelScheduled
N.scheduleDelayed({ type: 'worldFlag', flag: 'cancelled', value: 'X' }, 2000);
var cs1 = N.cancelScheduled(N.getState().scheduled[N.getState().scheduled.length - 1].scheduledId);
assert(cs1, 'cancel OK');
var cs2 = N.cancelScheduled('sch_invalid');
assert(!cs2, 'cancel 失败');

// scheduleDelayed 失败
var f7 = N.scheduleDelayed(null, 2000);
assert(!f7.ok, 'schedule null 拒');
var f8 = N.scheduleDelayed({ type: 'worldFlag', flag: 'x' }, null);
assert(!f8.ok, 'schedule 无 fireDay 拒');

// ---- 5. 7 类 setter 全部跑过 ----
section('5) 7 类全覆盖');
// reset 用 resetState helper
N.getState().consequences = [];
N.getState().rumors = [];
N.getState().npcRelations = {};
N.getState().sectRelations = {};
N.getState().cityStates = {};
N.getState().futureWeights = {};
N.getState().worldFlags = {};
N.getState().scheduled = [];
N.applyConsequence({ type: 'npcRelation', npcId: 'a', delta: 1 });
N.applyConsequence({ type: 'sectRelation', sectId: 's', delta: 1 });
N.applyConsequence({ type: 'cityState', cityId: 'c', state: 'x' });
N.applyConsequence({ type: 'resourceNode', nodeId: 'vein_test', delta: 0.05 });
N.applyConsequence({ type: 'worldFlag', flag: 'f', value: true });
N.applyConsequence({ type: 'rumor', text: 'r' });
N.applyConsequence({ type: 'futureEventWeight', eventId: 'fe', delta: 5 });
assert(N.getState().consequences.length === 7, '7 consequences 记录');

// ---- 6. 示例 hook ----
section('6) 示例 hook');
var hk1 = N.exampleSaveScatteredCultivator({ name: '叶辰' });
assert(hk1.ok, 'saveScattered OK');
assert(hk1.immediate === 4, '4 立即 (got ' + hk1.immediate + ')');
assert(hk1.scheduled === 2, '2 延迟 (got ' + hk1.scheduled + ')');
assert(N.getFlag('saved_scattered_cultivator').indexOf('叶辰') >= 0, 'flag 含叶辰');
assert(N.getState().npcRelations['scattered_cultivator_1000'].length >= 1, 'NPC 关系存');
assert(N.getState().futureWeights.cultivator_joins_sect === 30, 'futureWeight 30');

var hk2 = N.exampleSpareKingOffspring({ name: '李逸' });
assert(hk2.ok, 'spareKing OK');
assert(hk2.immediate === 3, '3 立即');
assert(hk2.scheduled === 3, '3 延迟');
assert(N.getFlag('spared_king_offspring').indexOf('李逸') >= 0, 'flag 含李逸');
assert(N.getState().futureWeights.demon_king_awakened === 20, 'demon weight 20');

// ---- 7. processDay 真实应用 ----
section('7) processDay 真实应用');
// 之前 saveScattered 调度了 fireDay=1000+365*5=2825
var pd6 = N.processDay(2830);
assert(pd6.fired.length >= 1, 'save 调度触发 (got ' + pd6.fired.length + ')');
// 检查 NPC 关系累加
var npcRels = N.listNpcRelations('scattered_cultivator_1000');
assert(npcRels.length >= 2, 'NPC 关系累加 (got ' + npcRels.length + ')');

// ---- 8. 事件总线 ----
section('8) 事件总线');
assert((listeners['narrative:consequenceApplied'] || []).length >= 5, 'applied ≥ 5 (got ' + (listeners['narrative:consequenceApplied'] || []).length + ')');

// ---- 9. StateRegistry ----
section('9) StateRegistry v1');
var snap = mockWindow.StateRegistry.exportAll();
assert(snap.narrativeConsequence, 'narrativeConsequence 已注册');
var nc = snap.narrativeConsequence && snap.narrativeConsequence.data;
assert(nc, 'data 可访问');
assert(nc && Object.keys(nc.worldFlags).length >= 1, 'worldFlags 持久化');
assert(nc && nc.rumors.length >= 1, 'rumors 持久化');
assert(nc && nc.scheduled.length >= 1, 'scheduled 持久化');
assert(nc && nc.futureWeights.cultivator_joins_sect === 30, 'futureWeights 持久化');

// ---- 10. 性能 ----
section('10) 性能');
N.getState().consequences = [];
listeners = {};
var t0 = Date.now();
for (var pi = 0; pi < 1000; pi++) {
    N.applyConsequence({ type: 'worldFlag', flag: 'perf_' + (pi % 10), value: pi });
}
var dur = Date.now() - t0;
console.log('  1000 applyConsequence: ' + dur + 'ms');
assert(dur < 200, '1000 次 < 200ms');

var t1 = Date.now();
for (var pj = 0; pj < 1000; pj++) {
    N.scheduleDelayed({ type: 'worldFlag', flag: 's_' + pj, value: pj }, pj);
}
var dur2 = Date.now() - t1;
console.log('  1000 scheduleDelayed: ' + dur2 + 'ms');
assert(dur2 < 500, '1000 scheduleDelayed < 500ms');

console.log('\n=========================================');
console.log('narrative-consequence v19.15: ' + pass + ' passed, ' + fail + ' failed');
console.log('=========================================');
process.exit(fail > 0 ? 1 : 0);
