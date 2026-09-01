// codex-tutorial v19.17 §11 测试

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
var src = fs.readFileSync('D:/Download Game/仙侠世界/js/extensions/codex-tutorial.js', 'utf8');
var wrapped = '(function(window){' + src + '})(mockWindow);';
eval(wrapped);
var T = mockWindow.CodexTutorial;
var C = mockWindow.Codex;
var J = mockWindow.WorldJournal;
assert(!!T, 'CodexTutorial 已注册');
assert(!!C, 'Codex 已注册');
assert(!!J, 'WorldJournal 已注册');
assert(T.listSteps().length === 7, '7 步引导');
assert(C.listTypes().length === 6, '6 类图鉴');

// ---- 1. 教程 ----
section('1) 7 步引导');
var t1 = T.trigger('tut_first_cultivation');
assert(t1.ok && !t1.dismissed, '首次 trigger OK');
assert(t1.step.title === '第一次修炼', 'step.title');
assert((listeners['codex:tutorialTriggered'] || []).length === 1, '事件触发');

var t2 = T.trigger('tut_first_cultivation');
assert(t2.dismissed === false, '第 2 次仍触发（未 dismiss）');

T.dismiss('tut_first_cultivation');
assert(T.isDismissed('tut_first_cultivation'), 'dismiss OK');

var t3 = T.trigger('tut_first_cultivation');
assert(t3.dismissed === true, 'dismiss 后 trigger 不再触发');

// 不存在 step
var t4 = T.dismiss('tut_invalid');
assert(!t4, '无效 step dismiss 拒');

T.dismiss('tut_first_combat');
T.dismiss('tut_first_trade');
T.dismiss('tut_first_npc');
T.dismiss('tut_first_sect');
T.dismiss('tut_first_craft');
T.dismiss('tut_first_dungeon');
assert(Object.keys(T.isDismissed.toString ? {} : {}).length === 0, '7 步全 dismiss');
var allDismissed = ['tut_first_cultivation','tut_first_combat','tut_first_trade','tut_first_npc','tut_first_sect','tut_first_craft','tut_first_dungeon'].filter(function (s) { return T.isDismissed(s); });
assert(allDismissed.length === 7, '7 步全 dismissed (got ' + allDismissed.length + ')');

// ---- 2. 图鉴 6 类 ----
section('2) 6 类图鉴');
assert(C.listTypes().length === 6, '6 类');
// 功法
var d1 = C.discover('codex_gongfa', 'sword_basics', { name: '基础剑法' });
assert(d1.ok && !d1.already, '功法首次发现');
assert(d1.entry.firstSeenDay === 1000, 'firstSeenDay');
assert((listeners['codex:discovered'] || []).length === 1, 'discover 事件');

// 重复
var d2 = C.discover('codex_gongfa', 'sword_basics');
assert(d2.already && d2.entry.count === 2, '重复 count 累加 (got ' + d2.entry.count + ')');

// 灵兽
C.discover('codex_beast', 'beast_lingfox', { name: '灵狐' });
C.discover('codex_beast', 'beast_windwolf', { name: '风狼' });
var beastList = C.getEntries('codex_beast');
assert(beastList.length === 2, '灵兽 2 (got ' + beastList.length + ')');
assert(beastList.length === 2, '灵兽 2 (got ' + beastList.length + ')');

// 丹方
C.discover('codex_recipe', 'pill_zhuji', { name: '筑基丹' });
var recipe = C.getEntry('codex_recipe', 'pill_zhuji');
assert(recipe && recipe.info.name === '筑基丹', '丹方 info');

// 门派
C.discover('codex_sect', '少林寺', { tier: 4 });
// 秘境
C.discover('codex_dungeon', 'dgn_thunder_cave');
// 世界
C.discover('codex_world', 'saved_scattered_cultivator', { event: '救下散修' });

// 6 类 全有
assert(C.getEntries('codex_gongfa').length === 1, '功法 1');
assert(C.getEntries('codex_beast').length === 2, '灵兽 2');
assert(C.getEntries('codex_recipe').length === 1, '丹方 1');
assert(C.getEntries('codex_sect').length === 1, '门派 1');
assert(C.getEntries('codex_dungeon').length === 1, '秘境 1');
assert(C.getEntries('codex_world').length === 1, '世界 1');

// markSeen
assert(C.markSeen('codex_gongfa', 'sword_basics'), 'markSeen OK');
assert(C.getEntry('codex_gongfa', 'sword_basics').seen === true, 'seen true');
assert(!C.markSeen('codex_gongfa', 'invalid'), '无效 item markSeen 拒');

// getProgress
var p1 = C.getProgress('codex_gongfa');
assert(p1.codexId === 'codex_gongfa' && p1.discovered === 1, 'getProgress');

// 失败
var f1 = C.discover('codex_unknown', 'x');
assert(!f1.ok && f1.reason === 'unknown-codex', '未知 codex 拒');
var f2 = C.discover('codex_gongfa', null);
assert(!f2.ok && f2.reason === 'no-itemId', '无 itemId 拒');
var f3 = C.getEntry('codex_gongfa', 'no_exist');
assert(f3 === null, '不存在 entry 返回 null');

// ---- 3. 世界大事记 ----
section('3) 世界大事记');
var r1 = J.record({ type: 'breakthrough', title: '突破筑基', text: '玩家从练气突破到筑基', refs: { realm: '筑基' } });
assert(r1.ok, '记录 1 OK');
assert(r1.entry.day === 1000, 'day 1000');
assert((listeners['journal:recorded'] || []).length >= 1, 'recorded 事件');

J.record({ type: 'sect_join', title: '加入少林寺', text: '玩家加入少林寺' });
J.record({ type: 'marriage', title: '结为道侣', text: '玩家与 NPC 结为道侣' });
J.record({ type: 'puppet_craft', title: '制造傀儡', text: '铁甲战斗傀儡' });
J.record({ type: 'reincarnation', title: '轮回转世', text: '玩家寿终转世' });
var all = J.getEntries();
assert(all.length === 5, '5 条 (got ' + all.length + ')');
var recent = J.getRecent(2);
assert(recent.length === 2, '最近 2 条');
var byType = J.getByType('breakthrough');
assert(byType.length === 1, 'breakthrough 1 条');
var byRange = J.getByDayRange(999, 1001);
assert(byRange.length === 5, '999-1001 全部 5');

// 失败
var f4 = J.record(null);
assert(!f4.ok, 'null 拒');
var f5 = J.record({});
assert(!f5.ok && f5.reason === 'no-type', '无 type 拒');

// 上限 100
for (var i = 0; i < 150; i++) J.record({ type: 'filler', title: 'f' + i });
assert(J.getEntries().length === 100, '上限 100 (got ' + J.getEntries().length + ')');

// ---- 4. 事件总线 ----
section('4) 事件总线');
assert((listeners['codex:discovered'] || []).length >= 1, 'codex discovered ≥ 1 (got ' + (listeners['codex:discovered'] || []).length + ')');
assert((listeners['journal:recorded'] || []).length >= 1, 'journal ≥ 1 (got ' + (listeners['journal:recorded'] || []).length + ')');

// ---- 5. StateRegistry ----
section('5) StateRegistry v1');
var snap = mockWindow.StateRegistry.exportAll();
assert(snap.codexTutorial, 'codexTutorial 已注册');
assert(snap.codex, 'codex 已注册');
assert(snap.worldJournal, 'worldJournal 已注册');
var ct = snap.codexTutorial && snap.codexTutorial.data;
var cx = snap.codex && snap.codex.data;
var wj = snap.worldJournal && snap.worldJournal.data;
assert(ct && Object.keys(ct.dismissed).length === 7, '7 dismissed 持久化');
assert(cx && Object.keys(cx.codex.codex_gongfa).length === 1, 'gongfa 持久化');
assert(wj && wj.entries.length === 100, 'journal 100 持久化');

// ---- 6. 性能 ----
section('6) 性能');
// 1000 discover
var t0 = Date.now();
for (var pi = 0; pi < 1000; pi++) {
    C.discover('codex_recipe', 'perf_' + (pi % 50), { n: pi });
}
var dur1 = Date.now() - t0;
console.log('  1000 discover: ' + dur1 + 'ms');
assert(dur1 < 200, '1000 discover < 200ms');

// 1000 record
var t1 = Date.now();
for (var pj = 0; pj < 1000; pj++) {
    J.record({ type: 'perf', title: 'p' + pj, text: 't' + pj });
}
var dur2 = Date.now() - t1;
console.log('  1000 record: ' + dur2 + 'ms');
assert(dur2 < 500, '1000 record < 500ms');

console.log('\n=========================================');
console.log('codex-tutorial v19.17: ' + pass + ' passed, ' + fail + ' failed');
console.log('=========================================');
process.exit(fail > 0 ? 1 : 0);
