/**
 * festival-calendar.js — 节日常历（把一年四节登记进世界日历）
 *
 * 病灶（DES-26）：历法早就有真源（festival-bridge.js 的 FESTIVAL_DEFS，一年 360 天），
 * 庙会（第六十八波）也真在城里开摊——可这一年的节从没人登记进 WorldCalendar。
 * 于是新开局的世界日历一片空白，闭关摘要里「节令」一栏永远无事，玩家出关不知道错过了什么。
 *
 * 纪律：
 *   - 镜像不真源：只 register，不裁决、不发奖、不改任何既有节日行为（那是 festival-bridge 的帖、festival-fair 的摊）。
 *   - 不另造历：doy 与岁首算法照抄 festival-bridge（含「岁尾看得见来年开年的节」那一条）。
 *   - id 带绝对日：consumeDue 到期即出表，带日的 id 让来年同一节重新登记得进来。
 *   - 零新存档字段：日历本身走 StateRegistry('worldCalendar')。
 *
 * 加载顺序：第 6 层，须在 world-calendar.js 与 festival-bridge.js 之后。
 */
(function (global) {
    'use strict';

    var YEAR_DAYS = 360;
    var SOURCE_SYSTEM = 'festival_calendar';

    function defs() {
        var d = global.FESTIVAL_DEFS;
        return (d && d.length) ? d : [];
    }

    function today() {
        try {
            if (typeof global.getAbsoluteDay === 'function') {
                var d = Number(global.getAbsoluteDay());
                if (isFinite(d) && d > 0) return Math.floor(d);
            }
        } catch (e) {}
        return 0;
    }

    /** 某个节在 absDay 当天或之后的下一次绝对日（照 festival-bridge 的岁序算法） */
    function nextOccurrence(doy, absDay) {
        var year = Math.floor((absDay - 1) / YEAR_DAYS);
        var abs = year * YEAR_DAYS + doy;
        if (abs < absDay) abs = (year + 1) * YEAR_DAYS + doy;
        return abs;
    }

    /** 补齐未来一年内的四节；返回本次新登记的条数 */
    function sync() {
        var W = global.WorldCalendar;
        if (!W || typeof W.register !== 'function') return 0;
        var now = today();
        if (!now) return 0;
        var list = defs();
        var added = 0;
        for (var i = 0; i < list.length; i++) {
            var f = list[i];
            if (!f || !f.key || !(f.doy > 0)) continue;
            var abs = nextOccurrence(f.doy, now);
            var r = W.register({
                id: 'festival.' + f.key + '.day' + abs,
                title: f.name + '（庙会开市）',
                category: 'festival',
                dueAbsoluteDay: abs,
                source: { system: SOURCE_SYSTEM, refId: f.key },
                severity: 'remind',
                payload: { fkey: f.key, fname: f.name, dueDay: abs }
            });
            if (r && r.ok) added++;
        }
        return added;
    }

    function subscribe() {
        if (!global.EventBus || typeof global.EventBus.on !== 'function') return;
        global.EventBus.on('newDay', function () { try { sync(); } catch (e) {} });
    }

    // ============ 导出 ============
    global.FestivalCalendar = {
        sync: sync,
        nextOccurrence: nextOccurrence,
        // 日历牌上的下一个节（不是节也算得出来——给庙会摊和闭关界面共用一句准话）
        nextFestival: function (absDay) {
            var now = absDay || today();
            if (!now) return null;
            var best = null;
            defs().forEach(function (f) {
                var abs = nextOccurrence(f.doy, now);
                if (!best || abs < best.dueDay) best = { key: f.key, name: f.name, dueDay: abs, inDays: abs - now };
            });
            return best;
        }
    };

    subscribe();
    try { sync(); } catch (e) {}
    if (global.document && global.document.addEventListener) {
        global.document.addEventListener('DOMContentLoaded', function () { try { sync(); } catch (e2) {} });
    }
})(typeof window !== 'undefined' ? window : this);
