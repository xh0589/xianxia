/**
 * game-scheduler.js — 游戏时间调度器
 * 禁止把“7天后回来/3天后逾期”绑定到现实 setTimeout。
 * 调度项只保存 type + payload + dueMinute；执行器由模块注册，天然可存档恢复。
 */
(function (global) {
    'use strict';

    var tasks = [];
    var handlers = Object.create(null);
    var counter = 0;

    function nowMinute() {
        if (global.timeSystem && global.timeSystem.gameTime) return Number(global.timeSystem.gameTime.totalMinutes) || 0;
        if (global.gameTime) return Number(global.gameTime.totalMinutes) || 0;
        return 0;
    }

    function makeId(type) {
        counter += 1;
        return 'sched_' + String(type || 'task').replace(/[^a-zA-Z0-9_-]/g, '_') + '_' + nowMinute() + '_' + counter;
    }

    function registerHandler(type, fn) {
        if (!type || typeof fn !== 'function') return false;
        handlers[type] = fn;
        return true;
    }

    function schedule(type, dueMinute, payload, options) {
        options = options || {};
        dueMinute = Math.max(nowMinute(), Math.floor(Number(dueMinute) || 0));
        var task = {
            id: options.id || makeId(type),
            type: type,
            dueMinute: dueMinute,
            payload: payload == null ? null : JSON.parse(JSON.stringify(payload)),
            repeatMinutes: Math.max(0, Math.floor(Number(options.repeatMinutes) || 0)),
            createdMinute: nowMinute()
        };
        cancel(task.id);
        tasks.push(task);
        tasks.sort(function (a, b) { return a.dueMinute - b.dueMinute; });
        return task.id;
    }

    function cancel(id) {
        var before = tasks.length;
        tasks = tasks.filter(function (t) { return t.id !== id; });
        return tasks.length !== before;
    }

    function cancelByType(type, predicate) {
        var removed = 0;
        tasks = tasks.filter(function (t) {
            if (t.type !== type) return true;
            if (predicate && !predicate(t.payload, t)) return true;
            removed += 1;
            return false;
        });
        return removed;
    }

    function processDue(currentMinute) {
        currentMinute = currentMinute == null ? nowMinute() : Number(currentMinute) || 0;
        if (!tasks.length) return 0;
        var due = [];
        var pending = [];
        tasks.forEach(function (t) { (t.dueMinute <= currentMinute ? due : pending).push(t); });
        tasks = pending;
        var fired = 0;
        due.forEach(function (task) {
            var fn = handlers[task.type];
            var ok = true;
            if (fn) {
                try { ok = fn(task.payload, task) !== false; }
                catch (e) { ok = false; console.warn('[GameScheduler] task failed:', task.type, e); }
            } else {
                // 未注册处理器时不丢任务：保留到下一次 tick，避免加载顺序导致永久丢失。
                ok = false;
            }
            if (ok) {
                fired += 1;
                if (task.repeatMinutes > 0) {
                    task.dueMinute = currentMinute + task.repeatMinutes;
                    tasks.push(task);
                }
            } else {
                tasks.push(task);
            }
        });
        tasks.sort(function (a, b) { return a.dueMinute - b.dueMinute; });
        return fired;
    }

    function serialize() {
        return { counter: counter, tasks: tasks.map(function (t) { return JSON.parse(JSON.stringify(t)); }) };
    }

    function deserialize(data) {
        data = data || {};
        counter = Number(data.counter) || 0;
        tasks = Array.isArray(data.tasks) ? data.tasks.map(function (t) { return JSON.parse(JSON.stringify(t)); }) : [];
        tasks.sort(function (a, b) { return a.dueMinute - b.dueMinute; });
        processDue(nowMinute());
    }

    function reset() { tasks = []; counter = 0; }

    var api = {
        registerHandler: registerHandler,
        schedule: schedule,
        cancel: cancel,
        cancelByType: cancelByType,
        processDue: processDue,
        serialize: serialize,
        deserialize: deserialize,
        reset: reset,
        getTasks: function () { return tasks.map(function (t) { return JSON.parse(JSON.stringify(t)); }); },
        nowMinute: nowMinute
    };

    global.GameScheduler = api;
    global.XianXia = global.XianXia || {};
    global.XianXia.GameScheduler = api;

    if (global.StateRegistry) {
        global.StateRegistry.register('gameScheduler', { version: 1, export: serialize, import: deserialize, reset: reset });
    }
    if (global.EventBus && typeof global.EventBus.on === 'function') {
        global.EventBus.on('time:advanced', function (ev) { processDue(ev && ev.toMinute); });
    }
})(typeof window !== 'undefined' ? window : this);
