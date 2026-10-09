/**
 * world-calendar.js — 世界日历（WorldCalendar）单例
 *
 * 目的（v18.8 路线图 §0 P0-1 落地）：
 *   把所有确定性/半确定性事件（拍卖/宗门事件/世界事件/秘境窗口/NPC 约定/宗门大比/天劫准备/百年大会等）
 *   登记到一张世界日程表，让玩家出关后能看见"我不在时世界发生了什么"，
 *   并让长期闭关可以"闭关至下次事件"。
 *
 * 设计宪法（强制规则.md）：
 *   - 镜像而非真源：calendar 只 register/consume，不改任何已存在系统的行为路径。
 *   - 不新增 localStorage 键：存档走 StateRegistry('worldCalendar', v1)。
 *   - 行为约束来自世界本身：不出现"日限 N 次"型配额。
 *
 * 加载顺序：第 6 层，在 js/core/event-bus.js 之后、js/core/game-scheduler.js 之前。
 */
(function (global) {
    'use strict';

    // ============ 常量 ============

    var VERSION = 1;

    // 允许的 category 白名单（路线图 §2.1 + 路线图 §5 验收 4 四类）
    var ALLOWED_CATEGORIES = [
        'auction',            // 拍卖（坊市日/皇家）
        'sect_event',         // 宗门事件
        'world_event',        // 世界事件（5 类）
        'dungeon_window',     // 秘境窗口（v18.8 §5 P1-6 留口；v24 起由 dungeon-dynamic 登记关窗日）
        'festival',           // 节日常历（v24·DES-26：上元/七夕/中秋/除夕，一年四场定日子）
        'npc_appointment',    // NPC 约定（掌门召见/道侣约会/拜师仪式）
        'tribulation',        // 天劫准备期
        'sect_tournament',    // 宗门大比/小比（P0-4 留口）
        'sect_meeting',       // 门派会议
        'centennial_gathering', // 百年大会
        'other'               // 兜底
    ];

    var SEVERITY_LEVELS = ['info', 'remind', 'major'];

    // ============ 内部状态 ============

    function freshState() {
        return {
            version: VERSION,
            events: [],
            log: [],
            lastAdvancedDay: 0
        };
    }

    var state = freshState();
    var subscribers = [];
    var _initialized = false;

    // ============ 工具函数 ============

    function clone(v) {
        if (v == null) return v;
        try { return JSON.parse(JSON.stringify(v)); } catch (e) { return v; }
    }

    function safeNow() {
        try {
            if (typeof global.getAbsoluteDay === 'function') return global.getAbsoluteDay() || 1;
        } catch (e) {}
        return 1;
    }

    function safeEmit(name, payload) {
        try {
            if (global.EventBus && typeof global.EventBus.emit === 'function') {
                global.EventBus.emit(name, payload);
            }
            if (global.GameEvents && global.GameEvents !== global.EventBus && typeof global.GameEvents.emit === 'function') {
                global.GameEvents.emit(name, payload);
            }
        } catch (e) {
            console.warn('[WorldCalendar] emit failed:', name, e);
        }
    }

    function isValidCategory(c) {
        return ALLOWED_CATEGORIES.indexOf(c) >= 0;
    }

    function isValidSeverity(s) {
        return SEVERITY_LEVELS.indexOf(s) >= 0;
    }

    // ============ 日历不是发钱口（结构性约束） ============
    // 这张表只做索引：把「我不在时世界发生了什么」记下来，让玩家看得见、赶得上。
    // 它**绝不能**直接往玩家兜里塞东西——按日历白给东西就是签到，签到已经被否掉过
    // （强制规则第 10 行：禁止无叙事依据的人为计数器）。
    // 只写在文档里靠不住，所以把它做成结构：任何声称要发给玩家的 payload 一律拒收。
    // 正确做法照 festival-calendar.js：只 register，把裁决交给城里的制度与事件，
    // 东西从事件/日程/制度那一侧出（坊市开市、庙会、兽汛、道侣相约），不进这张表。
    var PAYLOAD_DELIVERY_KEYS = [
        'give', 'gift', 'grant', 'grants', 'items', 'item', 'itemid', 'itemids', 'matid', 'mats', 'materials',
        'reward', 'rewards', 'loot', 'drop', 'drops', 'currency', 'money', 'coin', 'copper',
        'stone', 'stones', 'spiritstone', 'exp', 'experience', 'luck', 'buff', 'buffs', 'bonus'
    ];
    function payloadCarriesDelivery(payload) {
        if (!payload || typeof payload !== 'object') return '';
        for (var k in payload) {
            if (!Object.prototype.hasOwnProperty.call(payload, k)) continue;
            var lk = String(k).toLowerCase();
            for (var i = 0; i < PAYLOAD_DELIVERY_KEYS.length; i++) {
                if (lk === PAYLOAD_DELIVERY_KEYS[i]) return String(k);
            }
        }
        return '';
    }
    // 老档里万一存着这类键（改这条约束之前注册过）：条目留着可追溯，**发奖的键当场剥掉**
    function stripDeliveryKeys(payload) {
        if (!payload || typeof payload !== 'object') return payload;
        var out = {};
        var removed = [];
        for (var k in payload) {
            if (!Object.prototype.hasOwnProperty.call(payload, k)) continue;
            var lk = String(k).toLowerCase();
            var hit = '';
            for (var i = 0; i < PAYLOAD_DELIVERY_KEYS.length && !hit; i++) {
                if (lk === PAYLOAD_DELIVERY_KEYS[i]) hit = String(k);
            }
            if (hit) { removed.push(hit); continue; }
            out[k] = payload[k];
        }
        if (removed.length) {
            console.warn('[WorldCalendar] 老档 payload 带着发奖键，已剥掉（日历不做发钱口）：' + removed.join(','));
        }
        return out;
    }

    function findEventIndex(id) {
        for (var i = 0; i < state.events.length; i++) {
            if (state.events[i].id === id) return i;
        }
        return -1;
    }

    function pushLog(entry) {
        state.log.push({
            atDay: entry.atDay,
            category: entry.category,
            title: entry.title,
            summary: entry.summary || ''
        });
        // 防膨胀：保留最近 200 条
        if (state.log.length > 200) {
            state.log.splice(0, state.log.length - 200);
        }
    }

    // ============ 公开 API ============

    /**
     * 注册一个确定性事件。
     * @param {Object} def
     *   - id {string} 必填，注册者保证唯一
     *   - title {string} 必填
     *   - category {string} 必填，白名单内
     *   - dueAbsoluteDay {number} 必填，目标日（来自 getAbsoluteDay() 之后的目标日）
     *   - source {{system, refId}} 必填
     *   - region {string}?
     *   - severity {'info'|'remind'|'major'}? 默认 'info'
     *   - oneShot {boolean}? 默认 true
     *   - payload {Object}? 透传给消费方
     * @returns {{ok:boolean, id?:string, reason?:string}}
     */
    function register(def) {
        if (!def || typeof def !== 'object') return { ok: false, reason: 'def-not-object' };
        if (!def.id || typeof def.id !== 'string') return { ok: false, reason: 'missing-id' };
        if (!def.title || typeof def.title !== 'string') return { ok: false, reason: 'missing-title' };
        if (!isValidCategory(def.category)) return { ok: false, reason: 'invalid-category:' + def.category };
        if (typeof def.dueAbsoluteDay !== 'number' || !isFinite(def.dueAbsoluteDay)) return { ok: false, reason: 'missing-dueAbsoluteDay' };
        if (!def.source || typeof def.source !== 'object') return { ok: false, reason: 'missing-source' };

        // 日历只做索引：payload 里出现「发给玩家什么」的键，直接拒收（不是提醒，是闸门）
        var deliveryKey = payloadCarriesDelivery(def.payload);
        if (deliveryKey) {
            console.warn('[WorldCalendar] 拒收带发奖键的日程条目（' + def.id + ' → ' + deliveryKey + '）：日历不做发钱口');
            return { ok: false, reason: 'payload-carries-delivery:' + deliveryKey };
        }

        // 同 id 已存在：拒绝（注册者负责唯一性），避免静默覆盖
        if (findEventIndex(def.id) >= 0) return { ok: false, reason: 'duplicate-id' };

        var event = {
            id: def.id,
            title: def.title,
            category: def.category,
            dueAbsoluteDay: Math.floor(def.dueAbsoluteDay),
            source: { system: String(def.source.system || 'unknown'), refId: def.source.refId != null ? String(def.source.refId) : '' },
            region: def.region != null ? String(def.region) : null,
            severity: isValidSeverity(def.severity) ? def.severity : 'info',
            oneShot: def.oneShot !== false, // 缺省 true
            payload: def.payload && typeof def.payload === 'object' ? clone(def.payload) : null
        };

        state.events.push(event);
        safeEmit('worldCalendar:registered', { event: clone(event) });
        return { ok: true, id: event.id };
    }

    /**
     * 取消一个已注册事件（可选写入 log，便于玩家知道"错过"了）。
     * @returns {boolean}
     */
    function unregister(id, reason) {
        var idx = findEventIndex(id);
        if (idx < 0) return false;
        var ev = state.events[idx];
        state.events.splice(idx, 1);
        if (reason) {
            pushLog({ atDay: safeNow(), category: ev.category, title: ev.title, summary: '已取消：' + reason });
        }
        return true;
    }

    /**
     * 过滤返回事件列表（深拷贝，不允许外部直接修改 state.events）。
     */
    function list(opts) {
        opts = opts || {};
        var fromDay = typeof opts.fromDay === 'number' ? opts.fromDay : -Infinity;
        var toDay = typeof opts.toDay === 'number' ? opts.toDay : Infinity;
        var category = opts.category;
        var out = [];
        for (var i = 0; i < state.events.length; i++) {
            var e = state.events[i];
            if (e.dueAbsoluteDay < fromDay) continue;
            if (e.dueAbsoluteDay > toDay) continue;
            if (category && e.category !== category) continue;
            out.push(clone(e));
        }
        // 按 dueAbsoluteDay 升序
        out.sort(function (a, b) { return a.dueAbsoluteDay - b.dueAbsoluteDay; });
        return out;
    }

    /**
     * 获取某 category 下一个未到期事件。
     */
    function getNextByCategory(category, fromDay) {
        if (!isValidCategory(category)) return null;
        var start = typeof fromDay === 'number' ? fromDay : safeNow();
        var best = null;
        for (var i = 0; i < state.events.length; i++) {
            var e = state.events[i];
            if (e.category !== category) continue;
            if (e.dueAbsoluteDay < start) continue;
            if (!best || e.dueAbsoluteDay < best.dueAbsoluteDay) best = e;
        }
        return best ? clone(best) : null;
    }

    /**
     * 由 onNewDay 调用：返回当天应触发的事件，同时把它们写入 log 并按 oneShot 移除。
     * 过期未消费的事件（dueAbsoluteDay < currentDay）也会被一并归档，标 "已过期"。
     * 每次调用都会向 EventBus 发出 'worldCalendar:due' 并通知本地 subscribers。
     * @param {number} currentAbsoluteDay
     * @returns {Array<{event:Object, logEntry:Object}>}
     */
    function consumeDue(currentAbsoluteDay) {
        if (typeof currentAbsoluteDay !== 'number' || !isFinite(currentAbsoluteDay)) return [];
        var fired = [];
        var remaining = [];
        for (var i = 0; i < state.events.length; i++) {
            var e = state.events[i];
            if (e.dueAbsoluteDay === currentAbsoluteDay) {
                var logEntry = { atDay: currentAbsoluteDay, category: e.category, title: e.title, summary: '如期' };
                pushLog(logEntry);
                fired.push({ event: clone(e), logEntry: logEntry });
                // 第一百一十一波：如期触发过就不再留在事件表里——旧版非 oneShot 触发后原地保留，
                // 次日必落进「已过期」分支再记一笔：同一事件双记账，闭关摘要与 30 日分类汇总全虚高。
                // 「已过期」那本账只留给真正没人消费过的（注册晚了/跨日没跑到）。
            } else if (e.dueAbsoluteDay < currentAbsoluteDay) {
                // 过期未消费：归档为"已过期"，不移除（保持可追溯）
                pushLog({ atDay: currentAbsoluteDay, category: e.category, title: e.title, summary: '已过期' });
            } else {
                remaining.push(e);
            }
        }
        state.events = remaining;
        state.lastAdvancedDay = currentAbsoluteDay;
        // 通知：无论调用者是 init 的 newDay handler 还是直接调用，订阅者都应收到
        for (var f = 0; f < fired.length; f++) {
            var ev = fired[f].event;
            safeEmit('worldCalendar:due', { event: ev, ctx: { currentDay: currentAbsoluteDay, source: ev.source } });
            notifySubscribers(ev, { currentDay: currentAbsoluteDay, source: ev.source });
        }
        return fired;
    }

    /**
     * 订阅"事件到期"通知（v18.9 内仅 worldCalendar:due 由 emit 通道发出，
     * subscribe 主要给"闭关至事件"这类需要直接拿到 event 对象的本地消费者用）。
     */
    function subscribe(handler) {
        if (typeof handler !== 'function') return function () {};
        subscribers.push(handler);
        return function unsubscribe() {
            var idx = subscribers.indexOf(handler);
            if (idx >= 0) subscribers.splice(idx, 1);
        };
    }

    function unsubscribe(handler) {
        var idx = subscribers.indexOf(handler);
        if (idx >= 0) { subscribers.splice(idx, 1); return true; }
        return false;
    }

    function notifySubscribers(event, ctx) {
        for (var i = 0; i < subscribers.length; i++) {
            try { subscribers[i](event, ctx); }
            catch (e) { console.warn('[WorldCalendar] subscriber error:', e); }
        }
    }

    /**
     * 汇总 [fromDay, toDay] 区间内的日志，按 category 分桶。
     * 给"出关摘要"消费用。
     */
    function summarizeRange(fromDay, toDay) {
        if (typeof fromDay !== 'number') fromDay = -Infinity;
        if (typeof toDay !== 'number') toDay = Infinity;
        var byCategory = {};
        var items = [];
        for (var i = 0; i < state.log.length; i++) {
            var l = state.log[i];
            if (l.atDay < fromDay || l.atDay > toDay) continue;
            byCategory[l.category] = (byCategory[l.category] || 0) + 1;
            items.push(clone(l));
        }
        items.sort(function (a, b) { return a.atDay - b.atDay; });
        return { fromDay: fromDay, toDay: toDay, byCategory: byCategory, items: items };
    }

    /**
     * 给"日程"面板渲染用（v18.9 批次 C 用；这里先返回结构化数据，UI 层自行拼 HTML）。
     */
    function renderPanelHtml() {
        // 暂返回结构化片段；UI 层负责拼字符串
        var now = safeNow();
        return {
            now: now,
            upcoming: list({ fromDay: now, toDay: now + 60 }),
            recent: list({ fromDay: now - 30, toDay: now - 1 }),
            summary30: summarizeRange(Math.max(1, now - 30), now)
        };
    }

    // ============ 存档接口（StateRegistry v1） ============

    function serialize() {
        return {
            version: VERSION,
            events: clone(state.events),
            log: clone(state.log),
            lastAdvancedDay: state.lastAdvancedDay
        };
    }

    function deserialize(snapshot) {
        if (!snapshot || typeof snapshot !== 'object') {
            state = freshState();
            return;
        }
        state.version = VERSION;
        state.events = Array.isArray(snapshot.events) ? snapshot.events.map(function (e) {
            // 防御：加载时再做一次 category 白名单校验，无效条目丢弃
            if (!e || !isValidCategory(e.category)) return null;
            return {
                id: String(e.id || ''),
                title: String(e.title || ''),
                category: e.category,
                dueAbsoluteDay: typeof e.dueAbsoluteDay === 'number' ? e.dueAbsoluteDay : 0,
                source: e.source && typeof e.source === 'object' ? { system: String(e.source.system || 'unknown'), refId: String(e.source.refId || '') } : { system: 'unknown', refId: '' },
                region: e.region != null ? String(e.region) : null,
                severity: isValidSeverity(e.severity) ? e.severity : 'info',
                oneShot: e.oneShot !== false,
                payload: e.payload && typeof e.payload === 'object' ? stripDeliveryKeys(clone(e.payload)) : null
            };
        }).filter(function (e) { return e && e.id; }) : [];
        state.log = Array.isArray(snapshot.log) ? snapshot.log.slice(-200) : [];
        state.lastAdvancedDay = typeof snapshot.lastAdvancedDay === 'number' ? snapshot.lastAdvancedDay : 0;
        // ★ 换档也是「账被整个换掉了」：旧档里没有的常驻条目（节气刻度一类）不会自己长出来。
        //   不喊这一嗓子的话：读档流程 reset → 常驻日历补登记 → 随档回灌又把它抹掉，
        //   玩家读档后打开日程面板看到的仍是空的一栏（真机实测踩过，Chrome 独立档 · 第1天）。
        announceSwap('deserialize');
    }

    // 「整本账被换掉」时喊一嗓子：reset（开新局）与 deserialize（读档）两条路都走这里。
    // 常驻日历（节气刻度等）听见就自己补一遍登记——补登记是幂等的，重复喊不叠条目。
    function announceSwap(at) {
        try {
            if (global.EventBus && typeof global.EventBus.emit === 'function') {
                global.EventBus.emit('worldCalendar:reset', { at: at });
            }
        } catch (eSwapEv) {
            console.warn('[静默失败] js/core/world-calendar.js · ' + at + ' 事件没发出去（常驻日历这次不会补登记，下次换账照旧补）', eSwapEv && eSwapEv.message);
        }
    }

    function reset() {
        state = freshState();
        // 第一百一十一波：订阅不清——festival/dao-bridge 的到期裁决订阅是模块加载时一次性注册的，
        // 新局 resetAll 把它们清空后无人重建：同一页面会话里开新局，节帖照发、裁决弹窗永远不来，
        // 帖子悬空到次日被判「装死不回」白扣好感。事件账清了，听账的人得还在。
        // ★ 同一条道理再加一句：**事件账清了，账本上该有的条目也得有人补**。
        //   节气与四节这类「常驻刻度」是登记型条目（只 register、不裁决、不发奖），
        //   表一清就整段消失，而开新局那一刻玩家最先看的就是日程面板——补登记这件事得有人喊一嗓子。
        //   这里发 reset 事件，各常驻日历（js/world/solar-terms.js 等）听见就自己补一遍（幂等）。
        announceSwap('reset');
    }

    // ============ init() ============

    function init() {
        if (_initialized) return;
        _initialized = true;

        // 1) 状态注册表
        try {
            if (global.StateRegistry && typeof global.StateRegistry.register === 'function') {
                global.StateRegistry.register('worldCalendar', {
                    version: VERSION,
                    export: serialize,
                    import: deserialize,
                    reset: reset
                });
            }
        } catch (e) {
            console.warn('[WorldCalendar] StateRegistry register failed:', e);
        }

        // 2) EventTypes 常量扩展
        try {
            if (global.EventTypes && typeof global.EventTypes === 'object') {
                if (!global.EventTypes.WORLD_CALENDAR_DUE) {
                    global.EventTypes.WORLD_CALENDAR_DUE = 'worldCalendar:due';
                }
                if (!global.EventTypes.WORLD_CALENDAR_REGISTERED) {
                    global.EventTypes.WORLD_CALENDAR_REGISTERED = 'worldCalendar:registered';
                }
                if (!global.EventTypes.WORLD_CALENDAR_SUMMARY) {
                    global.EventTypes.WORLD_CALENDAR_SUMMARY = 'worldCalendar:summary';
                }
            }
        } catch (e) {
            console.warn('[WorldCalendar] EventTypes extend failed:', e);
        }

        // 3) newDay 推进
        try {
            var handler = function (payload) {
                var newDay = payload && typeof payload.newDay === 'number' ? payload.newDay : safeNow();
                consumeDue(newDay); // due 通知由 consumeDue 内部统一发出
            };
            if (global.EventBus && typeof global.EventBus.on === 'function') {
                global.EventBus.on('newDay', handler);
            }
        } catch (e) {
            console.warn('[WorldCalendar] newDay hook failed:', e);
        }

        console.log('[WorldCalendar] initialized v' + VERSION);
    }

    // ============ 导出 ============

    var api = {
        version: VERSION,
        allowedCategories: ALLOWED_CATEGORIES.slice(),
        // 日历不是发钱口：这两个口是那道结构闸门的对外声明（测试与登记方都照它核）
        payloadDeliveryKeys: PAYLOAD_DELIVERY_KEYS.slice(),
        payloadCarriesDelivery: payloadCarriesDelivery,
        register: register,
        unregister: unregister,
        list: list,
        getNextByCategory: getNextByCategory,
        consumeDue: consumeDue,
        subscribe: subscribe,
        unsubscribe: unsubscribe,
        summarizeRange: summarizeRange,
        renderPanelHtml: renderPanelHtml,
        serialize: serialize,
        deserialize: deserialize,
        reset: reset,
        init: init,
        // 内部用：safeNow / isValidCategory 不导出
        _state: function () { return { events: state.events.length, log: state.log.length, lastAdvancedDay: state.lastAdvancedDay }; }
    };

    // 第六十七波·时钟根治（第二十四波口径）：全库读 WorldCalendar.day 的地方
    //（行情事件过期、图鉴初见日、兽潮与叙事日戳……）从上线起就没人给过值——「今天」恒为 0。
    // 这里补一个现算 getter：有真钟报真天数；没钟照旧 undefined——
    // 老读者的 `|| 0` 与 `if (day)` 兜底路径全部原样有效，不殃及没钟的测试世界。
    Object.defineProperty(api, 'day', {
        enumerable: false,
        get: function () {
            try {
                if (typeof global.getAbsoluteDay === 'function') {
                    var g = global.getAbsoluteDay();
                    if (g) return Math.floor(g);
                }
                var t = global.timeSystem;
                if (t && typeof t.getAbsoluteDay === 'function') {
                    var g2 = t.getAbsoluteDay();
                    if (g2) return Math.floor(g2);
                }
            } catch (e) {}
            return undefined;
        }
    });

    global.WorldCalendar = api;
    global.XianXia = global.XianXia || {};
    global.XianXia.WorldCalendar = api;

    // 立即初始化（脚本加载即生效）
    init();
})(typeof window !== 'undefined' ? window : this);
