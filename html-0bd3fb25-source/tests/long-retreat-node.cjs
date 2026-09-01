/**
 * long-retreat-node.js — 批次 D 单元测试
 *
 * 覆盖 v18.9 实施计划 §5 D1–D4 关键场景：
 *   D1: startLongRetreatUntilEvent 找到目标事件 + 设 dueFlag + 寿元保护
 *   D2: 出关摘要 4 类聚合
 *   D3: openLongRetreatUI 含"闭关至下次 X"按钮
 *   D4: 寿元提前截断 + 警告
 *
 * 不依赖真实 DOM：用 jsdom-free 方式 + window mock 跑 long-retreat.js
 *
 * 运行：node tests/long-retreat-node.js
 */
'use strict';

var path = require('path');
var fs = require('fs');
var vm = require('vm');

// ============ 最小 window mock ============
var showMessageLog = [];
var advanceTimeLog = [];
var timeAdvanceCount = 0;
var currentDay = 1;

var mockWindow = {
    // 必备
    EventBus: null, // init 后注入
    getAbsoluteDay: function () { return currentDay; },
    setTimeout: setTimeout, setInterval: setInterval, clearTimeout: clearTimeout,
    console: console,
    Math: Math, JSON: JSON, Object: Object, Array: Array, Number: Number, String: String, Boolean: Boolean,
    Date: Date,
    document: { querySelector: function () { return null; } },
    // 角色
    currentCharData: null,
    inventory: { currency: { spiritStones: 10000, copper: 0 } },
    currentSkills: { skill_main: 'test_skill' },
    playerLifespan: { maxAge: 100, currentAge: 18, remainingDays: 36500, isImmortal: false },
    // helpers
    showMessage: function (msg, type) { showMessageLog.push({ msg: msg, type: type }); },
    confirm: function () { return true; }, // 默认全部确认
    checkSoulBlock: function () { return false; },
    updateCurrencyUI: function () {},
    updateCharacterStatus: function () {},
    addProficiencyExp: function () {},
    getRealmIndex: function () { return 0; },
    getEssenceGainByRealm: function () { return 5; },
    getRootCultivationBonus: function () { return 1; },
    getSeasonBonus: function () { return null; },
    getHouseBonus: function () { return 1; },
    getCultivationSpeedBonusFromQi: function () { return 1; },
    getActiveWorldEventModifiers: function () { return null; },
    getBondBonuses: function () { return { cultivation: 1 }; },
    getRootMutationBonus: function () { return 1.05; },
    showModal: function (title, html) { this._lastModal = { title: title, html: html }; },
    timeSystem: {
        gameTime: {
            currentDay: 1,
            totalMinutes: 0
        },
        advanceTime: function (minutes, reason) {
            advanceTimeLog.push({ minutes: minutes, reason: reason, before: currentDay });
            timeAdvanceCount++;
            // 模拟跨日
            if (minutes >= 1440) {
                currentDay += Math.floor(minutes / 1440);
                this.gameTime.currentDay = currentDay;
                this.gameTime.totalMinutes += minutes;
                // 模拟 onNewDay 副作用：让 EventBus 触发 newDay
                if (mockWindow.EventBus && mockWindow.EventBus.emit) {
                    mockWindow.EventBus.emit('newDay', { oldDay: currentDay - 1, newDay: currentDay });
                }
            } else {
                this.gameTime.totalMinutes += minutes;
            }
        },
        getSeasonBonus: function () { return null; }
    },
    showModal: function (title, html) { this._lastModal = { title: title, html: html }; }
};

mockWindow.window = mockWindow;
mockWindow.global = mockWindow;
mockWindow.XianXia = mockWindow.XianXia || {};

// ============ 工具 ============
var passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) { passed++; }
    else { failed++; console.error('[FAIL] ' + msg); }
}
function reset(retreatScript) {
    // 重新加载 retreat 脚本
    delete require.cache[path.resolve(__dirname, '..', 'js', 'cultivation', 'long-retreat.js')];
    showMessageLog = [];
    advanceTimeLog = [];
    timeAdvanceCount = 0;
    currentDay = 1;
    mockWindow.timeSystem.gameTime.currentDay = 1;
    mockWindow.timeSystem.gameTime.totalMinutes = 0;
    mockWindow.currentCharData = {
        realm: '炼气', layer: 1, essence: 0, qi: 100, maxQi: 100,
        health: 100, maxHealth: 100, energy: 100, maxEnergy: 100,
        spiritStones: 10000, location: '帝都'
    };
    mockWindow.inventory.currency.spiritStones = 10000;
    mockWindow.playerLifespan = { maxAge: 100, currentAge: 18, remainingDays: 36500, isImmortal: false };
    mockWindow.confirm = function () { return true; };
    mockWindow._lastModal = undefined;
    if (mockWindow.WorldCalendar && typeof mockWindow.WorldCalendar.reset === 'function') {
        mockWindow.WorldCalendar.reset();
    }
}

// 加载 EventBus
var eventBusSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'core', 'event-bus.js'), 'utf8');
var calendarSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'core', 'world-calendar.js'), 'utf8');
var retreatSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'cultivation', 'long-retreat.js'), 'utf8');

// 第一次：建立 EventBus + WorldCalendar
var ctx = vm.createContext(mockWindow);
vm.runInContext(eventBusSrc, ctx);
vm.runInContext(calendarSrc, ctx);
mockWindow.EventBus = ctx.EventBus;
mockWindow.WorldCalendar = ctx.WorldCalendar;

function runRetreatScript() {
    vm.runInContext(retreatSrc, ctx);
}

// 第一次加载
runRetreatScript();

// ============ 用例 ============

// 1) startLongRetreat(7) 基础
reset();
runRetreatScript();
var r1 = mockWindow.startLongRetreat(7);
assert(r1 && r1.days === 7, 'startLongRetreat(7) 应返回 7 日');
assert(timeAdvanceCount === 7, '应推进 7 次 advanceTime');
assert(mockWindow.currentCharData.essence > 0, '应积累真元');
assert(showMessageLog.some(function (m) { return m.msg.indexOf('闭关结束') >= 0; }), '应弹"闭关结束"消息');
assert(showMessageLog.some(function (m) { return m.msg.indexOf('闭关') >= 0 && m.msg.indexOf('期间') >= 0; }), '应弹出关摘要');
assert(currentDay === 8, '当前应到第 8 天');

// 2) startLongRetreatUntilEvent('auction', 90)：有目标事件
reset();
runRetreatScript();
mockWindow.WorldCalendar.register({ id: 'au1', title: '坊市日开', category: 'auction', dueAbsoluteDay: 15, source: { system: 's' } });
var r2 = mockWindow.startLongRetreatUntilEvent('auction', 90);
assert(r2 && r2.days === 14, '应闭关 14 日（15 - 1 = 14）');
assert(r2.targetDay === 15, 'targetDay 应为 15');
assert(currentDay === 15, '应推进到第 15 天（到 due 那天出关）');
// 检查出关消息包含 due 事件标题
var hit = showMessageLog.find(function (m) { return m.msg.indexOf('坊市日开') >= 0 && m.msg.indexOf('提前出关') >= 0; });
assert(!!hit, '出关消息应包含目标事件标题 + "提前出关"');

// 3) startLongRetreatUntilEvent：寿元硬保护
reset();
runRetreatScript();
mockWindow.WorldCalendar.register({ id: 'au_far', title: '远期坊市', category: 'auction', dueAbsoluteDay: 100, source: { system: 's' } });
// 寿元只剩 10 日
mockWindow.playerLifespan.remainingDays = 10;
var r3 = mockWindow.startLongRetreatUntilEvent('auction', 90);
assert(r3 && r3.cappedByLifespan === true, '应标记 cappedByLifespan');
assert(r3.targetDay < 100, 'targetDay 应被寿元截断');
// currentDay=1, remainingDays=10, deathDay=11, targetDay = deathDay - 1 = 10
assert(r3.targetDay === 10, 'targetDay 应为寿元截断后的 10');
assert(r3.days === 9, '实际闭关 9 日（10 - 1 = 9）');
var warn = showMessageLog.find(function (m) { return m.msg.indexOf('寿元上限') >= 0; });
assert(!!warn, '应弹出寿元上限警告');

// 4) startLongRetreatUntilEvent：无目标事件 → 降级到 7 日（用户确认）
reset();
runRetreatScript();
// 不注册任何事件
mockWindow.confirm = function (msg) { return msg.indexOf('七日小闭关') >= 0; };
var r4 = mockWindow.startLongRetreatUntilEvent('world_event', 90);
assert(r4 && r4.days === 7, '无目标事件应降级到 7 日');
assert(showMessageLog.some(function (m) { return m.msg.indexOf('没有') >= 0; }), '应提示"没有"事件');

// 5) 启动前 HP 过低 → 拒绝
reset();
runRetreatScript();
mockWindow.currentCharData.health = 30; // < 50% of 100
var r5 = mockWindow.startLongRetreat(7);
assert(r5 === null, 'HP 过低应返回 null');
assert(showMessageLog.some(function (m) { return m.msg.indexOf('伤势过重') >= 0; }), '应提示伤势过重');

// 6) 启动前灵石不足
reset();
runRetreatScript();
mockWindow.inventory.currency.spiritStones = 10; // 7*5=35 不足
var r6 = mockWindow.startLongRetreat(7);
assert(r6 === null, '灵石不足应返回 null');

// 7) openLongRetreatUI 渲染"闭关至下次 X"按钮
reset();
runRetreatScript();
mockWindow.WorldCalendar.register({ id: 'au_a', title: '帝都拍卖', category: 'auction', dueAbsoluteDay: 5, source: { system: 's' } });
mockWindow.openLongRetreatUI();
var modal = mockWindow._lastModal;
if (!modal) {
    console.log('DEBUG: ctx.showModal type =', typeof ctx.showModal);
    console.log('DEBUG: ctx.openLongRetreatUI exists =', typeof ctx.openLongRetreatUI);
    console.log('DEBUG: ctx keys (first 30) =', Object.getOwnPropertyNames(ctx).slice(0, 30));
    console.log('DEBUG: ctx.showMessage type =', typeof ctx.showMessage);
    // Try direct call
    if (typeof ctx.showModal === 'function') {
        ctx.showModal('test', '<div>hello</div>');
        console.log('DEBUG: direct call set _lastModal =', mockWindow._lastModal);
    }
}
assert(modal && modal.html.indexOf('闭关至下次事件') >= 0, 'UI 应含"闭关至下次事件"标题');
assert(modal.html.indexOf('auction') >= 0 && modal.html.indexOf('帝都拍卖') >= 0, 'UI 应含动态事件条目');

// 8) 永生 → startLongRetreatUntilEvent 不应被寿元截断
reset();
runRetreatScript();
mockWindow.playerLifespan.isImmortal = true;
mockWindow.WorldCalendar.reset(); // 清空前面测试残留
mockWindow.WorldCalendar.register({ id: 'au_far2', title: '远期拍卖', category: 'auction', dueAbsoluteDay: 80, source: { system: 's' } });
var r8 = mockWindow.startLongRetreatUntilEvent('auction', 90);
assert(r8 && r8.cappedByLifespan === false, '永生应不被寿元截断');
assert(r8 && r8.days === 79, '永生应闭关 79 日（80-1=79）');

// 9) 4 类摘要：注册 4 类事件后跑普通闭关，showMessageLog 应含 4 类标题
reset();
runRetreatScript();
mockWindow.WorldCalendar.register({ id: 'a9', title: '坊市日', category: 'auction', dueAbsoluteDay: 3, source: { system: 's' } });
mockWindow.WorldCalendar.register({ id: 's9', title: '讲法会', category: 'sect_event', dueAbsoluteDay: 3, source: { system: 's' } });
mockWindow.WorldCalendar.register({ id: 'w9', title: '灵气潮', category: 'world_event', dueAbsoluteDay: 3, source: { system: 's' } });
mockWindow.WorldCalendar.register({ id: 'n9', title: '掌门召见', category: 'npc_appointment', dueAbsoluteDay: 3, source: { system: 's' } });
mockWindow.timeSystem.advanceTime(2880, 'test'); // 推进 2 天，触发 2 个 newDay，会自动归档
// 但这些事件 due=3、today=1，所以未触发；需要等到 day=3
// 改用 mock 直接调 WorldCalendar.consumeDue(3) 模拟触发
mockWindow.WorldCalendar.consumeDue(3);
var summaryMsg = showMessageLog.find(function (m) { return m.msg.indexOf('闭关') >= 0 && m.msg.indexOf('期间') >= 0; });
// 摘要消息在 startLongRetreat 后才弹，这里手动跑一次 7 日闭关
showMessageLog.length = 0;
mockWindow.startLongRetreat(7);
var sumMsg = showMessageLog.find(function (m) { return m.msg.indexOf('期间') >= 0; });
assert(!!sumMsg, '闭关结束应弹出关摘要');
assert(sumMsg.msg.indexOf('坊市') >= 0, '摘要应含坊市');
assert(sumMsg.msg.indexOf('讲法') >= 0, '摘要应含讲法');
assert(sumMsg.msg.indexOf('灵气潮') >= 0, '摘要应含灵气潮');
assert(sumMsg.msg.indexOf('掌门召见') >= 0, '摘要应含掌门召见');

// 10) 完整链路：register auction day=10 → startLongRetreatUntilEvent('auction', 90) → 实际推进 9 日
reset();
runRetreatScript();
mockWindow.WorldCalendar.register({ id: 'au_e2e', title: 'E2E坊市', category: 'auction', dueAbsoluteDay: 10, source: { system: 's' } });
var r10 = mockWindow.startLongRetreatUntilEvent('auction', 90);
assert(r10 && r10.days === 9, 'E2E 应闭关 9 日');
assert(r10.targetDay === 10, 'targetDay 应为 10');
assert(currentDay === 10, '应推进到第 10 天');
assert(r10.stoppedReason && r10.stoppedReason.indexOf('E2E坊市') >= 0, 'stoppedReason 应含 E2E坊市');

// ============ 收尾 ============
console.log('=========================================');
console.log('long-retreat batch-D: ' + passed + ' passed, ' + failed + ' failed');
console.log('=========================================');
if (failed > 0) process.exit(1);
