// dungeon-dynamic v19.9 P1-6 测试

var pass = 0, fail = 0;
function assert(cond, msg) {
    if (cond) { pass++; console.log('  ✓ ' + msg); }
    else { fail++; console.log('  ✗ FAIL ' + msg); }
}
function section(s) { console.log('\n=== ' + s + ' ==='); }

var listeners = {};
var codexDisc = [];
var mockWindow = {
    itemById: {},
    WorldCalendar: { day: 1000 },
    Codex: { discover: function (cat, id, info) { codexDisc.push({ cat: cat, id: id }); return { ok: true }; } },
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
var src = fs.readFileSync('D:/Download Game/仙侠世界/js/extensions/dungeon-dynamic.js', 'utf8');
var wrapped = '(function(window){' + src + '})(mockWindow);';
eval(wrapped);
var D = mockWindow.DungeonDynamic;
assert(!!D, 'DungeonDynamic 已注册');
assert(D.DUNGEON_TEMPLATES.length === 8, '8 模板 (got ' + D.DUNGEON_TEMPLATES.length + ')');
assert(D.EVENT_TYPES.length === 6, '6 事件类型 (got ' + D.EVENT_TYPES.length + ')');
assert(Object.keys(D.ROOM_TEMPLATES).length >= 8, '8 env 事件池 (got ' + Object.keys(D.ROOM_TEMPLATES).length + ')');

// ---- 1. 模板按 env ----
section('1) 8 模板按 env');
assert(D.getTemplate('dgn_thunder_cave').env === 'thunder', '雷泽洞天 thunder');
assert(D.getTemplate('dgn_ancient_field').suggestedRealm === '元婴', '古战场 元婴');
assert(D.getTemplate('dgn_yaowang_tomb').solutions.alchemy === 1.5, '药王遗府 alchemy 1.5');
assert(D.getTemplate('dgn_dragon_palace').solutions.spiritBeast === 1.4, '海底龙宫 spiritBeast 1.4');
assert(D.getTemplate('dgn_dry_bone').solutions.talisman === 1.3, '枯骨渊 talisman 1.3');
assert(D.getTemplate('dgn_ghost_realm').solutions.formation === 1.5, '九幽幻境 formation 1.5');
assert(D.getTemplate('dgn_cloud_palace').appearMonths.length === 3, '云海仙阙 7-9 月');
assert(D.getTemplate('dgn_5e_forbidden').env === '5e', '五行禁地 5e');

// ---- 2. 事件池 ----
section('2) 事件池');
var thunderPool = D.ROOM_TEMPLATES.thunder;
assert(thunderPool.length === 6, 'thunder 池 6 事件');
var boss = thunderPool.filter(function (r) { return r.type === 'boss'; });
assert(boss.length === 1, '含 1 boss');
var treasure = thunderPool.filter(function (r) { return r.type === 'treasure'; });
assert(treasure.length === 1 && treasure[0].reward.materials[0] === 'mat_thunder_crystal', '宝藏含 mat_thunder_crystal');

// ---- 3. generateDaily ----
section('3) generateDaily');
listeners = {};
// 跑多次保证至少一次生成（Math.random 概率事件）
var a1 = [];
for (var gdTry = 0; gdTry < 200 && a1.length === 0; gdTry++) {
    // 遍历所有月份
    var m = (gdTry % 12) + 1;
    a1 = D.generateDaily(1000 + gdTry, m);
}
assert(Array.isArray(a1), 'generateDaily 返回数组');
assert(a1.length >= 1, '至少 1 个秘境激活 (got ' + a1.length + ')');
assert((listeners['dungeon:dynamic:spawn'] || []).length >= 1, 'spawn 事件触发');

// ---- 4. enter / exploreRoom ----
section('4) enter / exploreRoom');
// 找一个激活秘境
var dungeon = a1[0];
if (!dungeon) dungeon = D.listActive()[0];
if (dungeon) {
    var e1 = D.enter(dungeon.id);
    assert(e1.ok, '进入秘境 OK (reason=' + e1.reason + ')');
    assert(e1.currentRoom && e1.currentRoom.type, 'firstRoom 有 type');
    var r1 = D.exploreRoom(dungeon.id, e1.currentRoom.options[0]);
    assert(r1.ok, '探索房 OK (reason=' + r1.reason + ')');
    assert(r1.result, '返回 result');
    assert(r1.result.room && r1.result.choice, '含 room + choice');
} else {
    assert(false, '无激活秘境，跳过 enter 测试');
}

// ---- 5. 不存在 ----
section('5) 不存在');
var e2 = D.enter('dgn_xxx');
assert(!e2.ok && e2.reason === 'not-active', '不存在秘境拒');
var r2 = D.exploreRoom('dgn_xxx', '战');
assert(!r2.ok && r2.reason === 'not-active', '不存在探索拒');

// ---- 6. 选项错误 ----
section('6) 选项错误');
if (dungeon && D.getPlayerProgress(dungeon.id)) {
    var r3 = D.exploreRoom(dungeon.id, '不合法选项');
    assert(!r3.ok && r3.reason === 'invalid-choice', '非法选项拒');
    assert(r3.valid && Array.isArray(r3.valid), '返回 valid 数组');
}

// ---- 7. 完成整个秘境 ----
section('7) 完成整个秘境');
// 简单暴力：找一个无进度秘境，遍历所有房间
var d2 = null;
for (var findTry = 0; findTry < 100 && !d2; findTry++) {
    var m2 = (findTry % 12) + 1;
    var a2 = D.generateDaily(3000 + findTry, m2);
    d2 = a2.find(function (d) { return !D.getPlayerProgress(d.id); });
}
if (d2) {
    var e3 = D.enter(d2.id);
    var tt = D.getTemplate(d2.id);
    for (var j = 0; j < tt.roomCount; j++) {
        var curP = D.getPlayerProgress(d2.id);
        if (!curP) break;
        var nextRoom = curP.currentRoomEvent;
        if (!nextRoom) break;
        var choice = nextRoom.options[0];
        D.exploreRoom(d2.id, choice);
    }
    assert((listeners['dungeon:dynamic:complete'] || []).length >= 1, 'complete 事件触发 (got ' + (listeners['dungeon:dynamic:complete'] || []).length + ')');
    // 剩余任务#1：走完秘境 → 图鉴 codex_dungeon
    var cd = codexDisc.filter(function (c) { return c.cat === 'codex_dungeon'; });
    assert(cd.length >= 1, '走完秘境写 codex_dungeon (got ' + cd.length + ')');
    assert(cd[0] && cd[0].id === d2.id, 'codex_dungeon id 对应该秘境');
} else {
    assert(false, '未找到 d2');
}

// ---- 8. leave ----
section('8) leave');
// enter 任何秘境
var d3 = null;
for (var ltry = 0; ltry < 100 && !d3; ltry++) {
    var lm = (ltry % 12) + 1;
    var la = D.generateDaily(4000 + ltry, lm);
    d3 = la.find(function (d) { return !D.getPlayerProgress(d.id); });
}
if (d3) {
    D.enter(d3.id);
    var lv1 = D.leave(d3.id);
    assert(lv1.ok, 'leave OK');
    assert(D.getPlayerProgress(d3.id) === null, '进度已清');
}

// ---- 9. 事件总线 ----
section('9) 事件总线');
assert((listeners['dungeon:dynamic:spawn'] || []).length >= 1, 'spawn ≥ 1');
assert((listeners['dungeon:dynamic:enter'] || []).length >= 1, 'enter ≥ 1');
assert((listeners['dungeon:dynamic:complete'] || []).length >= 1, 'complete ≥ 1');

// ---- 10. StateRegistry ----
section('10) StateRegistry v1');
var snap = mockWindow.StateRegistry.exportAll();
assert(snap.dungeonDynamic, 'dungeonDynamic 已注册');
var dd = snap.dungeonDynamic && snap.dungeonDynamic.data;
assert(dd, 'dungeonDynamic.data 可访问');
assert(dd && Array.isArray(dd.active), 'active 是数组');
assert(dd && dd.history.length >= 1, 'history ≥ 1 (got ' + (dd ? dd.history.length : 0) + ')');
assert(dd && dd.history.length <= 20, 'history ≤ 20');

// ---- 11. 性能 ----
section('11) 性能');
var t0 = Date.now();
for (var pi = 0; pi < 1000; pi++) D.generateDaily(1000 + pi, (pi % 12) + 1);
var dur = Date.now() - t0;
console.log('  1000 次 generateDaily: ' + dur + 'ms');
assert(dur < 200, '1000 次 < 200ms');

console.log('\n=========================================');
console.log('dungeon-dynamic v19.9: ' + pass + ' passed, ' + fail + ' failed');
console.log('=========================================');
process.exit(fail > 0 ? 1 : 0);
