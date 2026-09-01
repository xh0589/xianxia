// ==================== world-loop.js - 主循环真集成 (v20.0) ====================
// 把 v19.x 各模块 tickDay / 捕捉池 / 物价接到 newDay 与真实玩法。
// 单一真源：只挂 EventBus.on('newDay')，不包装 timeSystem.onNewDay。

(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    var HOUSE_TO_CAVE = {
        cave: 'grass_hut',
        courtyard: 'stone_room',
        mansion: 'spirit_manor',
        palace: 'immortal_manor'
    };

    var MARKET_CITY_ALIAS = {
        '西漠': '西荒',
        '东荒': '中州',
        '蜀地': '中州',
        '东南海域': '东海',
        '西荒': '西荒',
        '中州': '中州',
        '南疆': '南疆',
        '东海': '东海',
        '北冥': '北冥',
        '天空': '天空'
    };

    var _lastTickDay = null;

    function resolveDay(payload) {
        if (payload && typeof payload.newDay === 'number') return payload.newDay;
        if (typeof window.getAbsoluteDay === 'function') {
            try { return window.getAbsoluteDay() || 1; } catch (e) {}
        }
        if (window.timeSystem && window.timeSystem.gameTime) {
            return window.timeSystem.gameTime.currentDay || 1;
        }
        if (window.WorldCalendar && typeof window.WorldCalendar.day === 'number') {
            return window.WorldCalendar.day;
        }
        return 1;
    }

    function mapMarketCity(location) {
        if (!location) return '中州';
        var cities = (window.MarketDynamic && window.MarketDynamic.CITIES) || ['中州', '南疆', '东海', '西荒', '北冥', '天空'];
        if (cities.indexOf(location) >= 0) return location;
        var region = null;
        try {
            if (window.locationSystem && typeof window.locationSystem.getCityRegion === 'function') {
                region = window.locationSystem.getCityRegion(location);
            }
        } catch (e) {}
        if (region && cities.indexOf(region) >= 0) return region;
        if (region && MARKET_CITY_ALIAS[region]) return MARKET_CITY_ALIAS[region];
        if (MARKET_CITY_ALIAS[location]) return MARKET_CITY_ALIAS[location];
        return '中州';
    }

    function safeCall(name, fn) {
        try {
            return fn();
        } catch (e) {
            try { console.warn('[WorldLoop] ' + name + ' failed', e); } catch (e2) {}
            return null;
        }
    }

    function tickAll(payload) {
        var day = resolveDay(payload);
        if (_lastTickDay === day) return { ok: true, skipped: true, day: day };
        _lastTickDay = day;
        var month = Math.floor(((day - 1) % 360) / 30) + 1;
        var results = { day: day, month: month };

        results.beastTide = safeCall('BeastTide', function () {
            if (window.BeastTide && typeof window.BeastTide.tickDay === 'function') return window.BeastTide.tickDay();
        });
        results.beastHeal = safeCall('BeastEvolution', function () {
            if (window.BeastEvolution && typeof window.BeastEvolution.tickDayHealing === 'function') {
                return window.BeastEvolution.tickDayHealing();
            }
        });
        results.market = safeCall('MarketDynamic', function () {
            if (window.MarketDynamic && typeof window.MarketDynamic.tickDay === 'function') return window.MarketDynamic.tickDay();
        });
        results.resource = safeCall('ResourcePoints', function () {
            if (window.ResourcePoints && typeof window.ResourcePoints.tickDay === 'function') return window.ResourcePoints.tickDay();
        });
        results.playerSect = safeCall('PlayerSect', function () {
            if (window.PlayerSect && typeof window.PlayerSect.tickDay === 'function') return window.PlayerSect.tickDay();
        });
        results.puppet = safeCall('PuppetSystem', function () {
            if (!window.PuppetSystem || typeof window.PuppetSystem.tickDay !== 'function') return;
            var inv = window.inventory && window.inventory.currency;
            if (inv && typeof window.PuppetSystem.setSpiritStones === 'function') {
                window.PuppetSystem.setSpiritStones(inv.spiritStones || 0);
            }
            var r = window.PuppetSystem.tickDay();
            if (r && inv && typeof r.consumed === 'number' && r.consumed > 0) {
                inv.spiritStones = Math.max(0, (inv.spiritStones || 0) - r.consumed);
            }
            return r;
        });
        results.cave = safeCall('CaveFacilities', function () {
            if (!window.CaveFacilities || typeof window.CaveFacilities.tickDay !== 'function') return;
            var caveId = 'player';
            var hasHouse = window.playerHouse && window.playerHouse.type;
            var existing = window.CaveFacilities.getState && window.CaveFacilities.getState().caves
                ? window.CaveFacilities.getState().caves[caveId]
                : null;
            if (!hasHouse && !existing) return { ok: true, skipped: true };
            if (hasHouse && typeof window.CaveFacilities.ensureCave === 'function') {
                window.CaveFacilities.ensureCave(caveId, HOUSE_TO_CAVE[window.playerHouse.type] || 'grass_hut');
            }
            var caveTick = window.CaveFacilities.tickDay(caveId);
            if (caveTick && caveTick.events && caveTick.events.length) {
                var ev0 = caveTick.events[0];
                if (ev0.id === 'empty_wild_herb' && typeof window.addItem === 'function') {
                    window.addItem('mat_spirit_grass', 1);
                }
                if (ev0.id === 'companion_found_herb' && typeof window.addItem === 'function') {
                    window.addItem('mat_lingzhi', 1);
                }
                if (window.showMessage && !window._isInLongRetreat) {
                    window.showMessage('🏡 ' + ev0.text, 'info');
                }
            }
            return caveTick;
        });
        results.dungeon = safeCall('DungeonDynamic', function () {
            if (window.DungeonDynamic && typeof window.DungeonDynamic.generateDaily === 'function') {
                return window.DungeonDynamic.generateDaily(day, month);
            }
        });
        results.narrative = safeCall('NarrativeConsequence', function () {
            if (window.NarrativeConsequence && typeof window.NarrativeConsequence.processDay === 'function') {
                return window.NarrativeConsequence.processDay(day);
            }
        });
        results.bond = safeCall('BeastBond', function () {
            if (!window.BeastEvolution || typeof window.BeastEvolution.bondDay !== 'function') return;
            var list = window.tamedBeasts || [];
            var n = 0;
            for (var i = 0; i < list.length; i++) {
                var b = list[i];
                if (!b) continue;
                var id = b.uid || (b.templateId + '_' + i);
                window.BeastEvolution.bondDay(id);
                n++;
            }
            return { ok: true, count: n };
        });
        results.penTrain = safeCall('BeastPenTrain', function () {
            return trainHousedBeasts();
        });
        results.scout = safeCall('EagleScout', function () {
            if (!window.BeastEcosystem || typeof window.BeastEcosystem.getActiveBeastBuff !== 'function') return;
            if (!(window.BeastEcosystem.getActiveBeastBuff('scout') > 0)) return { ok: true, skipped: true };
            if (!window.DungeonDynamic || typeof window.DungeonDynamic.listScouted !== 'function') return { ok: true, skipped: true };
            var found = window.DungeonDynamic.listScouted();
            if (found.length && window.showMessage && !window._isInLongRetreat) {
                var names = found.slice(0, 3).map(function (d) { return d.name + '（余' + d.remain + '日）'; }).join('、');
                window.showMessage('🦅 雷鹰回巢：探得 ' + names, 'info');
            }
            return { ok: true, found: found.length, list: found };
        });
        return results;
    }

    function trainHousedBeasts() {
        var list = window.tamedBeasts || [];
        if (!list.length) return { ok: true, trained: 0 };
        var housed = {};
        var sectId = '散修园';
        if (window.discipleState && window.discipleState.sectId) sectId = window.discipleState.sectId;
        if (window.BeastGarden && typeof window.BeastGarden.listGardens === 'function') {
            var gardens = window.BeastGarden.listGardens(sectId) || [];
            for (var g = 0; g < gardens.length; g++) {
                var beasts = gardens[g].beasts || [];
                for (var k = 0; k < beasts.length; k++) housed[beasts[k]] = true;
            }
        }
        var hasPen = false;
        try {
            if (window.CaveFacilities && typeof window.CaveFacilities.getBuff === 'function') {
                hasPen = (window.CaveFacilities.getBuff('player', 'beastTraining') || 0) > 0;
            }
        } catch (e) {}
        var trained = 0;
        for (var i = 0; i < list.length; i++) {
            var b = list[i];
            if (!b) continue;
            var bid = b.uid || (b.templateId + '_' + i);
            var inPen = housed[bid] || hasPen;
            if (!inPen) continue;
            var gain = 4;
            if (window.BeastGarden && typeof window.BeastGarden.getBuff === 'function') {
                var gb = window.BeastGarden.getBuff(sectId);
                if (gb && gb.trainingPct) gain = Math.round(gain * (1 + gb.trainingPct));
            }
            if (hasPen) gain = Math.round(gain * 1.2);
            b.exp = (b.exp || 0) + gain;
            var needed = (b.level || 1) * 50;
            while (b.exp >= needed) {
                b.exp -= needed;
                b.level = (b.level || 1) + 1;
                needed = b.level * 50;
            }
            if (window.BeastEvolution && typeof window.BeastEvolution.addExp === 'function') {
                window.BeastEvolution.addExp(bid, gain);
            }
            trained++;
        }
        if (trained && typeof window.saveBeastData === 'function') {
            try { window.saveBeastData(); } catch (eSave) {}
        }
        return { ok: true, trained: trained };
    }

    function onTideStarted(payload) {
        payload = payload || {};
        var today = resolveDay({ newDay: (typeof window.getAbsoluteDay === 'function') ? window.getAbsoluteDay() : undefined });
        var endDay = today + (payload.duration || 0);
        safeCall('calendar', function () {
            if (!window.WorldCalendar || typeof window.WorldCalendar.register !== 'function') return;
            return window.WorldCalendar.register({
                id: 'beast_tide.end.' + (payload.tideId || 'x') + '.' + endDay,
                title: '🐾 ' + (payload.name || '兽潮') + '（结束）',
                category: 'world_event',
                dueAbsoluteDay: endDay,
                source: { system: 'beast-tide', refId: payload.tideId || '' },
                severity: (payload.level === 'tide_10' || payload.level === 'tide_9') ? 'major' : 'remind',
                oneShot: true,
                payload: { tideId: payload.tideId, level: payload.level }
            });
        });
        safeCall('journal', function () {
            if (!window.WorldJournal || typeof window.WorldJournal.record !== 'function') return;
            return window.WorldJournal.record({
                type: 'beast_tide',
                title: payload.name || '兽潮来袭',
                text: '山野间妖兽成群。捕捉池出现：' + ((payload.rareAdded || []).join('、') || '寻常兽群密度上升'),
                refs: { tideId: payload.tideId, level: payload.level }
            });
        });
        safeCall('codex', function () {
            if (!window.Codex || typeof window.Codex.discover !== 'function') return;
            window.Codex.discover('codex_world', 'beast_tide_' + (payload.level || 'unknown'), { name: payload.name });
            var rares = payload.rareAdded || [];
            for (var i = 0; i < rares.length; i++) {
                window.Codex.discover('codex_beast', rares[i], { source: 'beast_tide', name: rares[i] });
            }
        });
        safeCall('marketFlood', function () {
            if (window.MarketDynamic && typeof window.MarketDynamic.applyWorldEvent === 'function') {
                return window.MarketDynamic.applyWorldEvent('beast_flood');
            }
        });
        safeCall('narrativeFlag', function () {
            if (window.NarrativeConsequence && typeof window.NarrativeConsequence.applyConsequence === 'function') {
                return window.NarrativeConsequence.applyConsequence({
                    type: 'worldFlag',
                    flag: 'beast_tide_active',
                    value: payload.level || true,
                    day: today
                });
            }
        });
        safeCall('uiRefresh', function () {
            if (typeof window.refreshWorldEventsPanel === 'function') window.refreshWorldEventsPanel();
            if (typeof window.renderBeastTemplates === 'function') window.renderBeastTemplates();
            if (typeof window.renderBeastList === 'function') window.renderBeastList();
        });
    }

    function onTideEnded(payload) {
        payload = payload || {};
        safeCall('journalEnd', function () {
            if (!window.WorldJournal || typeof window.WorldJournal.record !== 'function') return;
            return window.WorldJournal.record({
                type: 'beast_tide_end',
                title: '兽潮平息',
                text: '山林重归安静，稀有灵兽隐回深处。',
                refs: { tideId: payload.tideId, level: payload.level }
            });
        });
        safeCall('narrativeFlagOff', function () {
            if (window.NarrativeConsequence && typeof window.NarrativeConsequence.applyConsequence === 'function') {
                return window.NarrativeConsequence.applyConsequence({
                    type: 'worldFlag',
                    flag: 'beast_tide_active',
                    value: false
                });
            }
        });
        safeCall('uiRefreshEnd', function () {
            if (typeof window.refreshWorldEventsPanel === 'function') window.refreshWorldEventsPanel();
            if (typeof window.renderBeastTemplates === 'function') window.renderBeastTemplates();
        });
    }

    function bind() {
        if (!window.EventBus || typeof window.EventBus.on !== 'function') return;
        window.EventBus.on('newDay', tickAll);
        window.EventBus.on('beast:tideStarted', onTideStarted);
        window.EventBus.on('beast:tideEnded', onTideEnded);
    }

    function resetTickGuard() { _lastTickDay = null; }

    window.WorldLoop = {
        tickAll: tickAll,
        trainHousedBeasts: trainHousedBeasts,
        mapMarketCity: mapMarketCity,
        HOUSE_TO_CAVE: HOUSE_TO_CAVE,
        resetTickGuard: resetTickGuard,
        get lastTickDay() { return _lastTickDay; }
    };
    window.XianXia = window.XianXia || {};
    window.XianXia.WorldLoop = window.WorldLoop;
    bind();
    try { console.log('[WorldLoop] initialized v20.0 (newDay → tickDay 真集成)'); } catch (e) {}
})();
