/**
 * world-calendar-node.js — 批次 A 单元测试
 *
 * 覆盖（计划 §1 完成定义 6 条 + §2.2 全部 API 边界 + §4 存档迁移）：
 *   1. register 合法路径返回 {ok:true, id}
 *   2. register 缺字段 → {ok:false, reason}
 *   3. register 无效 category → {ok:false, reason:'invalid-category:...'}
 *   4. register 同 id 重复 → {ok:false, reason:'duplicate-id'}
 *   5. unregister 存在 id → true；不存在 → false
 *   6. unregister 带 reason 写入 log
 *   7. list 按 fromDay/toDay/category 过滤
 *   8. getNextByCategory 返回最近一条；按 fromDay 偏移
 *   9. consumeDue 在 currentDay 处触发；过期项入 log "已过期"
 *  10. consumeDue 一次性事件自动移除；非一次性保留
 *  11. subscribe / unsubscribe 正确触发
 *  12. serialize → deserialize 完整往返（含 log 截断至 200）
 *  13. reset 清空
 *  14. 镜像独立性：list 返回深拷贝，修改不影响 state
 *  15. 旧档无 worldCalendar 段 → 视为空表（不抛错）
 *  16. StateRegistry 注册存在（module 存在 export/import/reset）
 *  17. 订阅回调可被 unsubscribe
 *  18. due 事件由 EventBus.emit 发出（用 mock 验证）
 *  19. 注册非法 dueAbsoluteDay（非数字）→ 拒
 *  20. severity 缺省 'info'，非法值降级
 *  21. oneShot 缺省 true
 *  22. payload 深拷贝（修改不影响）
 *  23. summarizeRange 按 category 聚合
 *  24. 完整链路：init → register × N → emit('newDay') → due 触发 + log 写入
 *
 * 运行：node tests/world-calendar-node.js
 */

'use strict';

var path = require('path');
var fs = require('fs');

// ============ 模拟浏览器环境 ============

var eventLog = [];
var subscribers = Object.create(null);
var mockEventBus = {
    events: subscribers,
    on: function (name, cb) {
        if (!this.events[name]) this.events[name] = [];
        this.events[name].push(cb);
        return this;
    },
    off: function (name, cb) {
        if (!this.events[name]) return this;
        this.events[name] = this.events[name].filter(function (x) { return x !== cb; });
        return this;
    },
    emit: function (name, data) {
        eventLog.push({ name: name, data: data });
        if (!this.events[name]) return this;
        this.events[name].forEach(function (cb) {
            try { cb(data); } catch (e) { /* swallow in test */ }
        });
        return this;
    }
};

// mock EventTypes
var EventTypes = {
    ENEMY_DEFEATED: 'enemy:defeated'
};

// mock getAbsoluteDay（由测试设置）
var mockAbsDay = 1;
global.getAbsoluteDay = function () { return mockAbsDay; };
global.EventBus = mockEventBus;
global.GameEvents = mockEventBus;
global.EventTypes = EventTypes;

// mock StateRegistry
var regStore = Object.create(null);
global.StateRegistry = {
    register: function (key, handlers) {
        regStore[key] = handlers;
    },
    exportAll: function () {
        var out = {};
        Object.keys(regStore).forEach(function (k) {
            if (regStore[k].export) out[k] = { version: regStore[k].version, data: regStore[k].export() };
        });
        return out;
    },
    importAll: function (snap) {
        Object.keys(regStore).forEach(function (k) {
            if (snap[k] && regStore[k].import) regStore[k].import(snap[k].data, snap[k].version);
        });
    },
    resetAll: function () {
        Object.keys(regStore).forEach(function (k) {
            if (regStore[k].reset) try { regStore[k].reset(); } catch (e) {}
        });
    }
};

global.window = global;
global.console = console;

// ============ 加载被测模块 ============

var CAL_PATH = path.resolve(__dirname, '..', 'js', 'core', 'world-calendar.js');
if (!fs.existsSync(CAL_PATH)) {
    console.error('[FAIL] cannot find world-calendar.js at', CAL_PATH);
    process.exit(1);
}

// 在加载前清空 require cache
delete require.cache[require.resolve(CAL_PATH)];
var src = fs.readFileSync(CAL_PATH, 'utf8');
// 注入到 vm 上下文执行（避免浏览器 window 闭包影响）
var vm = require('vm');
var ctx = vm.createContext({
    window: global,
    EventBus: mockEventBus,
    GameEvents: mockEventBus,
    EventTypes: EventTypes,
    StateRegistry: global.StateRegistry,
    getAbsoluteDay: global.getAbsoluteDay,
    console: console
});
vm.runInContext(src, ctx);

// 重新取回（IIFE 内的 export 挂到 global）
var WorldCalendar = global.WorldCalendar;
if (!WorldCalendar) {
    console.error('[FAIL] WorldCalendar not exported');
    process.exit(1);
}

// ============ 断言工具 ============

var passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) { passed++; }
    else { failed++; console.error('[FAIL] ' + msg); }
}
function resetCal() {
    WorldCalendar.reset();
    eventLog = [];
    mockEventBus.events = Object.create(null);
}

// ============ 用例 ============

// 1. register 合法路径
resetCal();
var r1 = WorldCalendar.register({
    id: 'auction.day1', title: '帝都坊市', category: 'auction',
    dueAbsoluteDay: 5, source: { system: 'auction', refId: 'imperial' }
});
assert(r1.ok === true && r1.id === 'auction.day1', 'register 合法应返回 ok');

// 2. 缺字段
assert(WorldCalendar.register({}).ok === false, 'register {} 应失败');
assert(WorldCalendar.register({ id: 'x' }).ok === false, '缺 title 应失败');
assert(WorldCalendar.register({ id: 'x', title: 't', category: 'auction' }).ok === false, '缺 dueAbsoluteDay 应失败');
assert(WorldCalendar.register({ id: 'x', title: 't', category: 'auction', dueAbsoluteDay: 1 }).ok === false, '缺 source 应失败');
assert(WorldCalendar.register(null).ok === false, 'register null 应失败');

// 3. 无效 category
var r3 = WorldCalendar.register({ id: 'x1', title: 't', category: 'invalid_cat', dueAbsoluteDay: 1, source: { system: 's' } });
assert(r3.ok === false && /^invalid-category/.test(r3.reason), '无效 category 应拒');

// 4. 重复 id
WorldCalendar.register({ id: 'dup', title: 't', category: 'auction', dueAbsoluteDay: 1, source: { system: 's' } });
var r4 = WorldCalendar.register({ id: 'dup', title: 't2', category: 'auction', dueAbsoluteDay: 2, source: { system: 's' } });
assert(r4.ok === false && r4.reason === 'duplicate-id', '重复 id 应拒');

// 5. unregister
assert(WorldCalendar.unregister('dup') === true, 'unregister 存在应返 true');
assert(WorldCalendar.unregister('not-exist') === false, 'unregister 不存在应返 false');

// 6. unregister 带 reason 写 log
WorldCalendar.register({ id: 'r6', title: 'r6title', category: 'sect_event', dueAbsoluteDay: 5, source: { system: 's' } });
WorldCalendar.unregister('r6', '玩家主动放弃');
var sum6 = WorldCalendar.summarizeRange(0, 100);
assert(sum6.items.some(function (it) { return it.title === 'r6title' && it.summary.indexOf('已取消') >= 0; }), 'unregister 带 reason 写 log');

// 7. list 过滤
resetCal();
WorldCalendar.register({ id: 'a1', title: 'A1', category: 'auction', dueAbsoluteDay: 3, source: { system: 's' } });
WorldCalendar.register({ id: 'a2', title: 'A2', category: 'auction', dueAbsoluteDay: 7, source: { system: 's' } });
WorldCalendar.register({ id: 's1', title: 'S1', category: 'sect_event', dueAbsoluteDay: 5, source: { system: 's' } });
var l7a = WorldCalendar.list({ fromDay: 0, toDay: 6 });
assert(l7a.length === 2 && l7a[0].id === 'a1' && l7a[1].id === 's1', 'list 按 dueDay 升序');
var l7b = WorldCalendar.list({ category: 'auction' });
assert(l7b.length === 2 && l7b.every(function (e) { return e.category === 'auction'; }), 'list 按 category 过滤');
var l7c = WorldCalendar.list({ fromDay: 5, toDay: 10 });
assert(l7c.length === 2, 'list 范围过滤');

// 8. getNextByCategory
var n8 = WorldCalendar.getNextByCategory('auction', 4);
assert(n8 && n8.id === 'a2', 'getNextByCategory 应跳过 a1（due=3 < from=4），返回 a2');
var n8b = WorldCalendar.getNextByCategory('sect_event', 1);
assert(n8b && n8b.id === 's1', 'getNextByCategory sect_event 应返回 s1');

// 9. consumeDue 在 currentDay 触发 + 过期归档
resetCal();
WorldCalendar.register({ id: 'c9', title: 'C9', category: 'auction', dueAbsoluteDay: 5, source: { system: 's' } });
WorldCalendar.register({ id: 'c9b', title: 'C9b', category: 'sect_event', dueAbsoluteDay: 3, source: { system: 's' } });
var fired9 = WorldCalendar.consumeDue(5);
assert(fired9.length === 1 && fired9[0].event.id === 'c9', 'consumeDue(5) 只触发 due=5 那条');
var sum9 = WorldCalendar.summarizeRange(0, 10);
assert(sum9.items.some(function (it) { return it.title === 'C9b' && it.summary === '已过期'; }), 'due<current 应入"已过期"log');
assert(sum9.items.some(function (it) { return it.title === 'C9' && it.summary === '如期'; }), 'due=current 应入"如期"log');

// 10. oneShot 行为
resetCal();
WorldCalendar.register({ id: 'os1', title: 'OS1', category: 'world_event', dueAbsoluteDay: 2, source: { system: 's' }, oneShot: true });
WorldCalendar.register({ id: 'os2', title: 'OS2', category: 'world_event', dueAbsoluteDay: 2, source: { system: 's' }, oneShot: false });
WorldCalendar.consumeDue(2);
var remain10 = WorldCalendar.list();
assert(remain10.every(function (e) { return e.id !== 'os1'; }), 'oneShot=true 触发后应被移除');
assert(remain10.some(function (e) { return e.id === 'os2'; }), 'oneShot=false 触发后仍保留');

// 11. subscribe / unsubscribe
resetCal();
var got11 = null;
var unsub11 = WorldCalendar.subscribe(function (ev) { got11 = ev; });
WorldCalendar.register({ id: 'sub1', title: 'SUB1', category: 'auction', dueAbsoluteDay: 1, source: { system: 's' } });
WorldCalendar.consumeDue(1);
assert(got11 && got11.id === 'sub1', 'subscribe 应被调用');
got11 = null;
unsub11();
WorldCalendar.register({ id: 'sub2', title: 'SUB2', category: 'auction', dueAbsoluteDay: 1, source: { system: 's' } });
WorldCalendar.consumeDue(1);
assert(got11 === null, 'unsubscribe 后不应再触发');

// 12. serialize/deserialize 完整往返
resetCal();
WorldCalendar.register({ id: 's12', title: 'S12', category: 'auction', dueAbsoluteDay: 100, source: { system: 's' }, payload: { foo: 'bar' } });
var snap = WorldCalendar.serialize();
resetCal();
WorldCalendar.deserialize(snap);
var r12 = WorldCalendar.list();
assert(r12.length === 1 && r12[0].id === 's12' && r12[0].payload && r12[0].payload.foo === 'bar', 'serialize/deserialize 完整往返');

// 13. reset
WorldCalendar.reset();
assert(WorldCalendar.list().length === 0, 'reset 后 list 应为空');

// 14. list 深拷贝
resetCal();
WorldCalendar.register({ id: 'c14', title: 'C14', category: 'auction', dueAbsoluteDay: 1, source: { system: 's' } });
var l14 = WorldCalendar.list();
l14[0].title = 'MUTATED';
var l14b = WorldCalendar.list();
assert(l14b[0].title === 'C14', 'list 返回应深拷贝，修改不影响 state');

// 15. 旧档无 worldCalendar 段
WorldCalendar.reset();
WorldCalendar.deserialize({ otherModule: { version: 1, data: {} } });
assert(WorldCalendar.list().length === 0, '旧档无该段应按空表初始化');

// 16. StateRegistry 已注册
assert(typeof regStore.worldCalendar === 'object' && typeof regStore.worldCalendar.export === 'function', 'StateRegistry worldCalendar 已注册');
assert(typeof regStore.worldCalendar.import === 'function' && typeof regStore.worldCalendar.reset === 'function', 'StateRegistry import/reset 存在');

// 17. 订阅回调可被 unsubscribe（显式调用）
resetCal();
var count17 = 0;
var handler17 = function () { count17++; };
WorldCalendar.subscribe(handler17);
WorldCalendar.register({ id: 'h17', title: 'H17', category: 'auction', dueAbsoluteDay: 1, source: { system: 's' } });
WorldCalendar.consumeDue(1);
WorldCalendar.unsubscribe(handler17);
var beforeUnsub = count17;
WorldCalendar.register({ id: 'h17b', title: 'H17b', category: 'auction', dueAbsoluteDay: 1, source: { system: 's' } });
WorldCalendar.consumeDue(1);
assert(count17 === beforeUnsub, 'unsubscribe 后 handler 不再被调用');

// 18. due 事件经 EventBus.emit 发出（独立于 subscribe）
resetCal();
WorldCalendar.register({ id: 'e18', title: 'E18', category: 'auction', dueAbsoluteDay: 10, source: { system: 's' } });
eventLog = [];
WorldCalendar.consumeDue(10);
assert(eventLog.some(function (e) { return e.name === 'worldCalendar:due' && e.data && e.data.event && e.data.event.id === 'e18'; }), 'due 事件经 EventBus.emit 发出');

// 19. 非法 dueAbsoluteDay
assert(WorldCalendar.register({ id: 'x19', title: 't', category: 'auction', dueAbsoluteDay: 'not-a-number', source: { system: 's' } }).ok === false, 'dueAbsoluteDay 非数字应拒');
assert(WorldCalendar.register({ id: 'x19b', title: 't', category: 'auction', dueAbsoluteDay: NaN, source: { system: 's' } }).ok === false, 'dueAbsoluteDay NaN 应拒');

// 20. severity 缺省/非法
resetCal();
WorldCalendar.register({ id: 's20', title: 'S20', category: 'auction', dueAbsoluteDay: 1, source: { system: 's' } });
assert(WorldCalendar.list()[0].severity === 'info', 'severity 缺省 info');
WorldCalendar.register({ id: 's20b', title: 'S20b', category: 'auction', dueAbsoluteDay: 1, source: { system: 's' }, severity: 'WRONG' });
assert(WorldCalendar.list().filter(function (e) { return e.id === 's20b'; })[0].severity === 'info', '非法 severity 降级为 info');

// 21. oneShot 缺省 true
resetCal();
WorldCalendar.register({ id: 'd21', title: 'D21', category: 'auction', dueAbsoluteDay: 1, source: { system: 's' } });
WorldCalendar.consumeDue(1);
assert(WorldCalendar.list().length === 0, 'oneShot 缺省 true 应被移除');

// 22. payload 深拷贝
resetCal();
var sharedPayload = { nested: { v: 1 } };
WorldCalendar.register({ id: 'p22', title: 'P22', category: 'auction', dueAbsoluteDay: 1, source: { system: 's' }, payload: sharedPayload });
var snap22 = WorldCalendar.serialize();
sharedPayload.nested.v = 999;
var l22 = WorldCalendar.list();
assert(l22[0].payload.nested.v === 1, 'register 时 payload 应深拷贝');

// 23. summarizeRange 按 category 聚合
resetCal();
WorldCalendar.register({ id: 'c23a', title: 'A', category: 'auction', dueAbsoluteDay: 1, source: { system: 's' } });
WorldCalendar.register({ id: 'c23b', title: 'B', category: 'auction', dueAbsoluteDay: 1, source: { system: 's' } });
WorldCalendar.register({ id: 'c23c', title: 'C', category: 'sect_event', dueAbsoluteDay: 1, source: { system: 's' } });
WorldCalendar.consumeDue(1);
var sum23 = WorldCalendar.summarizeRange(0, 10);
assert(sum23.byCategory.auction === 2 && sum23.byCategory.sect_event === 1, 'summarizeRange 按 category 聚合');

// 24. 完整链路：init → register × N → emit('newDay') → due 触发
resetCal();
// 重新 init（清掉事件订阅）
var freshSrc = src;
var freshCtx = vm.createContext({
    window: global,
    EventBus: mockEventBus,
    GameEvents: mockEventBus,
    EventTypes: EventTypes,
    StateRegistry: global.StateRegistry,
    getAbsoluteDay: global.getAbsoluteDay,
    console: console
});
vm.runInContext(freshSrc, freshCtx);
WorldCalendar = global.WorldCalendar;
// 因 IIFE 重新初始化注册了新的 newDay 监听；老 mockEventBus.events 也被重置
WorldCalendar.register({ id: 'c24a', title: 'A', category: 'auction', dueAbsoluteDay: 7, source: { system: 's' } });
WorldCalendar.register({ id: 'c24b', title: 'B', category: 'sect_event', dueAbsoluteDay: 7, source: { system: 's' } });
eventLog = [];
mockEventBus.emit('newDay', { oldDay: 6, newDay: 7 });
var dueFired = eventLog.filter(function (e) { return e.name === 'worldCalendar:due'; });
assert(dueFired.length === 2, 'newDay=7 应同时触发 2 条 due');

// 25. log 自动截断至 200
resetCal();
for (var i = 0; i < 250; i++) {
    WorldCalendar.register({ id: 'log' + i, title: 'L' + i, category: 'auction', dueAbsoluteDay: 1, source: { system: 's' } });
}
WorldCalendar.consumeDue(1);
var sum25 = WorldCalendar.summarizeRange(0, 10);
assert(sum25.items.length === 200, 'log 自动截断至 200');

// 26. category 白名单包含 10 个
assert(WorldCalendar.allowedCategories.length === 10, 'allowedCategories 10 个');

// 27. 完整存档：StateRegistry.exportAll/importAll 链路
resetCal();
WorldCalendar.register({ id: 'reg', title: 'R', category: 'auction', dueAbsoluteDay: 100, source: { system: 's' } });
var exported = global.StateRegistry.exportAll();
assert(exported.worldCalendar && exported.worldCalendar.data.events.length === 1, 'StateRegistry.exportAll 含 worldCalendar');
WorldCalendar.reset();
assert(WorldCalendar.list().length === 0, 'reset 后空');
global.StateRegistry.importAll(exported);
assert(WorldCalendar.list().length === 1 && WorldCalendar.list()[0].id === 'reg', 'StateRegistry.importAll 恢复');

// ============ 收尾 ============

console.log('=========================================');
console.log('WorldCalendar batch-A: ' + passed + ' passed, ' + failed + ' failed');
console.log('=========================================');
if (failed > 0) process.exit(1);
