// ==================== city-residents.js — 城中人物接线（v21.5 空城补人） ====================
// 17 座空城此前只有 cityData.specialNPCs 里的名字，没有实体。本文件把
// city-residents-data.js 的 34 位具名人物并入 SPECIAL_NPC_DATA（initNPCSystem 时自动实例化，
// 可对话可送礼），把 city-residents-events.js 的 17 出「进城遇人戏」并入个人事件系统，
// 并挂每日轮询：住进某城，次日就有机会撞见本城人物（仿 duel-showcases-1 的兜底轮询）。
// 加载顺序：special-npcs.js / npc-personal-events.js / 两份数据文件之后。
(function () {
    'use strict';
    var D = window.CITY_RESIDENT_DATA;
    if (!D) return;

    // ① 人物实体并入注册表（addSampleNPCs 在 initNPCSystem 时才跑，这里只并数据）
    if (D.npcs && window.SPECIAL_NPC_DATA) {
        Object.keys(D.npcs).forEach(function (id) {
            if (!window.SPECIAL_NPC_DATA[id]) window.SPECIAL_NPC_DATA[id] = D.npcs[id];
        });
    }

    // ② 进城遇人戏并入个人事件系统
    if (D.events && window.NPC_PERSONAL_EVENTS) {
        Object.keys(D.events).forEach(function (eid) {
            if (!window.NPC_PERSONAL_EVENTS[eid]) window.NPC_PERSONAL_EVENTS[eid] = D.events[eid];
        });
    }

    // ③ 每日轮询：人在城里住下，次日有机会撞见本城人物（一次性，flag 记账）
    function fire(eid) {
        try {
            if (typeof window.triggerPersonalEvent === 'function') window.triggerPersonalEvent(eid);
        } catch (e) { console.warn('[城中人物] 事件触发失败:', e); }
    }
    if (window.timeSystem && window.timeSystem.onNewDaySubscribe) {
        window.timeSystem.onNewDaySubscribe(function () {
            try {
                if (!window.currentCharData || !window.npcManager || !D.events) return;
                var loc = window.currentCharData.location || '';
                if (!loc) return;
                if (document.querySelector && document.querySelector('.personal-event-modal')) return;
                var cands = [];
                Object.keys(D.events).forEach(function (eid) {
                    var ev = D.events[eid];
                    if (!ev || !ev.autoTrigger || ev.autoTrigger.location !== loc) return;
                    if (typeof window.hasEventTriggered === 'function' && window.hasEventTriggered(eid)) return;
                    var npc = window.npcManager.getNPC ? window.npcManager.getNPC(ev.npcId) : null;
                    if (!npc) return;
                    cands.push(eid);
                });
                if (!cands.length) return;
                var pick = cands[Math.floor(Math.random() * cands.length)];
                if (Math.random() < 0.35) fire(pick);
            } catch (e) { console.warn('[城中人物] 每日轮询失败:', e); }
        });
    }

    // ④ 城市面板「城中人物」区块取数（location-system.js createCityPanel 调用）
    // NEW-43④：归属改按「家锚点」（homeLocation）而不是此刻站哪——本城人物出门串门，
    // 城面板不该整块消失（旧版 location 精确等值，40 天游走把 46 位城中人物全冲散）。
    window.getCityResidentCards = function (cityName) {
        try {
            if (!window.npcManager) return '';
            var npcs = null;
            if (typeof window.npcManager.getNPCsByHomeLocation === 'function') {
                npcs = window.npcManager.getNPCsByHomeLocation(cityName) || [];
            } else if (typeof window.npcManager.getNPCsAtLocation === 'function') {
                npcs = window.npcManager.getNPCsAtLocation(cityName) || [];
            } else {
                return '';
            }
            if (!npcs.length) return '';
            var html = '<h3 class="text-lg font-bold text-amber-400 mb-2">👥 城中人物</h3>' +
                '<div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">';
            npcs.forEach(function (n) {
                var icon = (n.appearance && n.appearance.icon) || n.icon || '🧑';
                html += '<div class="bg-gray-800/40 p-2 rounded border border-gray-700 text-center">' +
                    '<span class="text-lg">' + icon + '</span>' +
                    '<p class="text-xs text-amber-200 truncate font-bold" title="' + n.name + '">' + n.name + '</p>' +
                    '<p class="text-xs text-gray-500">' + (n.occupation || '闲人') + '</p>' +
                    '<button onclick="window.showNPCDialog(\'' + n.id + '\')" class="mt-1 text-xs bg-amber-700 hover:bg-amber-600 text-white px-2 py-0.5 rounded w-full">攀谈</button>' +
                    '</div>';
            });
            return html + '</div>';
        } catch (e) { return ''; }
    };

    console.log('[城中人物] v21.5 接线完成：' + Object.keys(D.npcs || {}).length + ' 位具名人物、' +
        Object.keys(D.events || {}).length + ' 出进城遇人戏');
})();
