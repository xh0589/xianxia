/**
 * world-calendar-ui.js — 世界日历 UI 渲染
 *
 * 依赖：world-calendar.js（WorldCalendar）、showMessage（项目内既有）
 * 设计宪法（强制规则.md）：
 *   - 纯渲染：只读取 WorldCalendar.list/summarizeRange，不写入任何状态
 *   - 角标只读 WorldCalendar.getNextByCategory，不订阅事件（避免在模块加载早期绑定 EventBus）
 *   - 所有 DOM id 静态定义在 仙侠.html 中；本文件只向已存在的容器注入 innerHTML
 *   - 不向 window 挂全局，只暴露 WorldCalendarUI 单例
 */
(function (global) {
    'use strict';

    // ============ 分类显示元数据 ============

    var CATEGORY_META = {
        auction: { label: '拍卖', icon: '🏛️', color: 'text-pink-400' },
        sect_event: { label: '宗门', icon: '⛩️', color: 'text-amber-400' },
        world_event: { label: '世界', icon: '🌐', color: 'text-orange-400' },
        dungeon_window: { label: '秘境', icon: '🗻', color: 'text-cyan-400' },
        npc_appointment: { label: '约定', icon: '👤', color: 'text-emerald-400' },
        tribulation: { label: '天劫', icon: '⚡', color: 'text-red-400' },
        sect_tournament: { label: '大比', icon: '🏆', color: 'text-yellow-400' },
        sect_meeting: { label: '议事', icon: '📜', color: 'text-indigo-400' },
        centennial_gathering: { label: '百年', icon: '🌟', color: 'text-fuchsia-400' },
        other: { label: '其他', icon: '📌', color: 'text-gray-400' }
    };

    var SEVERITY_BADGE = {
        info: { label: '常规', cls: 'bg-gray-700 text-gray-300' },
        remind: { label: '提醒', cls: 'bg-amber-700 text-amber-100' },
        major: { label: '重要', cls: 'bg-red-700 text-red-100' }
    };

    // ============ 工具函数 ============

    function safeNow() {
        try {
            if (typeof global.getAbsoluteDay === 'function') return global.getAbsoluteDay() || 1;
        } catch (e) {}
        return 1;
    }

    function escapeHtml(s) {
        if (s == null) return '';
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function categoryMeta(cat) { return CATEGORY_META[cat] || CATEGORY_META.other; }
    function severityBadge(sev) { return SEVERITY_BADGE[sev] || SEVERITY_BADGE.info; }

    /**
     * 把事件按 dueDay 分桶（同日多事件合并）。
     */
    function bucketByDay(events) {
        var map = {};
        for (var i = 0; i < events.length; i++) {
            var e = events[i];
            if (!map[e.dueAbsoluteDay]) map[e.dueAbsoluteDay] = [];
            map[e.dueAbsoluteDay].push(e);
        }
        var days = Object.keys(map).map(Number).sort(function (a, b) { return a - b; });
        return { map: map, days: days };
    }

    // ============ 角标（主面板头部） ============

    /**
     * 更新"距下次拍卖 X 日"角标。
     * 调用方：app.js 状态刷新钩子（每日 onNewDay + 玩家 openPanel 时）。
     * @param {string} elementId 默认 'calendar-next-auction-badge'
     */
    function updateNextAuctionBadge(elementId) {
        var el = document.getElementById(elementId || 'calendar-next-auction-badge');
        if (!el || !global.WorldCalendar) return;
        var now = safeNow();
        var next = global.WorldCalendar.getNextByCategory('auction', now);
        if (!next) {
            el.innerHTML = '<span class="text-xs text-gray-500">无拍卖</span>';
            return;
        }
        var days = Math.max(0, next.dueAbsoluteDay - now);
        var label = days === 0 ? '今日' : (days + ' 日后');
        el.innerHTML = '<span class="text-xs text-pink-400">🏛️ ' + escapeHtml(label) + '·' + escapeHtml(next.title) + '</span>';
    }

    /**
     * 通用"距下次 X"角标，可用于未来扩展。
     */
    function updateNextBadgeByCategory(category, elementId) {
        var el = document.getElementById(elementId || ('calendar-next-' + category + '-badge'));
        if (!el || !global.WorldCalendar) return;
        var now = safeNow();
        var next = global.WorldCalendar.getNextByCategory(category, now);
        if (!next) {
            el.innerHTML = '<span class="text-xs text-gray-500">无</span>';
            return;
        }
        var days = Math.max(0, next.dueAbsoluteDay - now);
        var label = days === 0 ? '今日' : (days + ' 日后');
        var meta = categoryMeta(category);
        el.innerHTML = '<span class="text-xs ' + meta.color + '">' + meta.icon + ' ' + escapeHtml(label) + '·' + escapeHtml(next.title) + '</span>';
    }

    // ============ 面板渲染 ============

    /**
     * 渲染"日程"面板完整 HTML 到 #calendar-list（容器）。
     * 容器由 仙侠.html 静态定义；renderPanel 只向 #calendar-list 注入 innerHTML。
     */
    function renderPanel(containerId) {
        var container = document.getElementById(containerId || 'calendar-list');
        if (!container || !global.WorldCalendar) return;
        var now = safeNow();
        var upcoming = global.WorldCalendar.list({ fromDay: now, toDay: now + 60 });
        // 近期：从日志取（已发生事件已从 events 移除，但 log 还在）
        var recentLog = global.WorldCalendar.summarizeRange(Math.max(0, now - 30), now).items;
        var summary = global.WorldCalendar.summarizeRange(Math.max(0, now - 30), now);

        container.innerHTML =
            renderUpcomingSection(now, upcoming) +
            renderRecentSection(recentLog) +
            renderSummarySection(summary);

        // 同步头部计数
        var dayEl = document.getElementById('calendar-current-day');
        if (dayEl) dayEl.textContent = now;
        var cntEl = document.getElementById('calendar-upcoming-count');
        if (cntEl) cntEl.textContent = upcoming.length;
    }

    function renderHeader(now, upcoming, summary) {
        var totalUpcoming = upcoming.length;
        var totalCategories = 0;
        var seen = {};
        for (var i = 0; i < upcoming.length; i++) seen[upcoming[i].category] = true;
        for (var k in seen) if (Object.prototype.hasOwnProperty.call(seen, k)) totalCategories++;

        return '' +
            '<h2 class="text-xl font-bold text-yellow-500 mb-2">📅 世界日程</h2>' +
            '<p class="text-xs text-gray-500 mb-6">第 ' + now + ' 天 · 未来 60 日共 ' + totalUpcoming + ' 项 · ' + totalCategories + ' 类</p>';
    }

    function renderUpcomingSection(now, upcoming) {
        if (!upcoming.length) {
            return '<div class="bg-gray-700/20 border border-gray-700 rounded-lg p-4 mb-6">' +
                '<p class="text-gray-500 text-sm">未来 60 日暂无确定性事件。坊市日开、世界事件、宗门事件触发后会自动出现。</p>' +
                '</div>';
        }
        var bucketed = bucketByDay(upcoming);
        var html = '<div class="mb-6"><h3 class="text-lg font-bold text-gray-300 mb-3">🗓️ 未来 60 日</h3><div class="space-y-3">';
        for (var i = 0; i < bucketed.days.length; i++) {
            var day = bucketed.days[i];
            var events = bucketed.map[day];
            var daysAhead = day - now;
            var dayLabel = daysAhead === 0 ? '今日' : (daysAhead + ' 日后');
            html += '<div class="bg-gray-700/30 border border-gray-600 rounded-lg p-3">';
            html += '<div class="text-sm font-bold text-orange-400 mb-2">第 ' + day + ' 天 · ' + dayLabel + '</div>';
            html += '<div class="space-y-1">';
            for (var j = 0; j < events.length; j++) {
                html += renderEventRow(events[j], false);
            }
            html += '</div></div>';
        }
        html += '</div></div>';
        return html;
    }

    function renderRecentSection(recent) {
        if (!recent.length) {
            return '<div class="mb-6"><h3 class="text-lg font-bold text-gray-300 mb-3">📜 近期 30 日</h3>' +
                '<p class="text-gray-500 text-sm">暂无已发生事件。</p></div>';
        }
        var html = '<div class="mb-6"><h3 class="text-lg font-bold text-gray-300 mb-3">📜 近期 30 日（已归档）</h3><div class="space-y-1">';
        for (var i = 0; i < recent.length; i++) {
            html += renderLogRow(recent[i]);
        }
        html += '</div></div>';
        return html;
    }

    function renderLogRow(logItem) {
        var meta = categoryMeta(logItem.category);
        var summaryTag = logItem.summary === '已过期' ? '（已过期）' : (logItem.summary === '如期' ? '' : '（' + escapeHtml(logItem.summary) + '）');
        return '<div class="flex items-center gap-2 opacity-60">' +
            '<span class="text-base">' + meta.icon + '</span>' +
            '<span class="text-sm ' + meta.color + ' flex-1">' + escapeHtml(logItem.title) + summaryTag + '</span>' +
            '<span class="text-xs text-gray-500">第 ' + logItem.atDay + ' 天</span>' +
            '</div>';
    }

    function renderSummarySection(summary) {
        if (!summary.items.length) {
            return '<div class="mb-6"><h3 class="text-lg font-bold text-gray-300 mb-3">📊 30 日分类汇总</h3>' +
                '<p class="text-gray-500 text-sm">暂无数据。</p></div>';
        }
        var html = '<div class="mb-6"><h3 class="text-lg font-bold text-gray-300 mb-3">📊 30 日分类汇总</h3><div class="grid grid-cols-2 md:grid-cols-5 gap-2">';
        for (var cat in summary.byCategory) {
            if (!Object.prototype.hasOwnProperty.call(summary.byCategory, cat)) continue;
            var meta = categoryMeta(cat);
            var count = summary.byCategory[cat];
            html += '<div class="bg-gray-700/30 border border-gray-600 rounded p-2 text-center">';
            html += '<div class="text-xs text-gray-400">' + meta.icon + ' ' + meta.label + '</div>';
            html += '<div class="text-lg font-bold ' + meta.color + '">' + count + '</div>';
            html += '</div>';
        }
        html += '</div></div>';
        return html;
    }

    function renderEventRow(ev, isPast) {
        var meta = categoryMeta(ev.category);
        var sev = severityBadge(ev.severity);
        var opacityClass = isPast ? 'opacity-60' : '';
        var regionTag = ev.region ? '<span class="text-xs text-gray-500 ml-2">@' + escapeHtml(ev.region) + '</span>' : '';
        return '<div class="flex items-center gap-2 ' + opacityClass + '">' +
            '<span class="text-base">' + meta.icon + '</span>' +
            '<span class="text-sm ' + meta.color + ' flex-1">' + escapeHtml(ev.title) + regionTag + '</span>' +
            '<span class="text-xs px-2 py-0.5 rounded ' + sev.cls + '">' + sev.label + '</span>' +
            '</div>';
    }

    // ============ 公共入口 ============

    var api = {
        version: 1,
        renderPanel: renderPanel,
        updateNextAuctionBadge: updateNextAuctionBadge,
        updateNextBadgeByCategory: updateNextBadgeByCategory,
        // 给 switchPanel('calendar') 钩子用的别名（与现有 render 命名风格一致）
        renderCalendarPanel: function () { renderPanel('calendar-list'); }
    };

    // 自动订阅 newDay 事件刷新角标（如果 EventBus 已就绪）
    try {
        if (global.EventBus && typeof global.EventBus.on === 'function') {
            global.EventBus.on('newDay', function () {
                try { updateNextAuctionBadge(); } catch (e) {}
            });
        }
    } catch (e) { /* 静默：UI 钩子不应阻塞模块加载 */ }

    global.WorldCalendarUI = api;
    global.XianXia = global.XianXia || {};
    global.XianXia.WorldCalendarUI = api;
})(typeof window !== 'undefined' ? window : this);
