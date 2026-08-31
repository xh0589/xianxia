/**
 * world-events.js - 世界事件系统 v7.1 P0-5
 * 可查询、可过期、有持续修正、可参与
 */

var WORLD_EVENTS = [
    {
        id: 'treasure', name: '天降异宝', icon: '✨',
        desc: '一道金光划过天际，有异宝降世！',
        interval: 10, chance: 0.3, duration: 5,
        modifiers: { exploreLoot: 1.5, chestChance: 0.25 },
        participate: { label: '寻宝', action: 'seek_treasure' }
    },
    {
        id: 'beast_tide', name: '兽潮来袭', icon: '🐾',
        desc: '大量妖兽从深山涌出！',
        interval: 20, chance: 0.4, duration: 3,
        modifiers: { encounterRate: 1.8, combatExp: 1.3 },
        participate: { label: '清剿兽潮', action: 'fight_beast_tide' }
    },
    {
        id: 'sect_war', name: '正邪大战', icon: '⚔️',
        desc: '正道联盟与魔教爆发大规模冲突！',
        interval: 30, chance: 0.5, duration: 5,
        modifiers: { factionConflict: 1.5 },
        participate: { label: '参战', action: 'join_sect_war' }
    },
    {
        id: 'market_boom', name: '坊市繁荣', icon: '💰',
        desc: '坊市迎来繁荣期，物价下降！',
        interval: 15, chance: 0.4, duration: 3,
        modifiers: { shopPrice: 0.8 }
    },
    {
        id: 'spirit_tide', name: '灵气潮汐', icon: '🌊',
        desc: '灵气潮汐涌动，修炼效率大增！',
        interval: 25, chance: 0.5, duration: 2,
        modifiers: { cultivation: 2.0, qiRestore: 10 }
    }
];

// activeWorldEvents[id] = { startDay, duration, endDay }
var activeWorldEvents = {};

function getWorldEventDef(id) {
    for (var i = 0; i < WORLD_EVENTS.length; i++) {
        if (WORLD_EVENTS[i].id === id) return WORLD_EVENTS[i];
    }
    return null;
}

function isWorldEventActive(id) {
    var a = activeWorldEvents[id];
    return !!(a && a.endDay != null);
}

function getActiveWorldEventList() {
    var list = [];
    for (var id in activeWorldEvents) {
        var a = activeWorldEvents[id];
        var def = getWorldEventDef(id);
        if (!def || !a) continue;
        list.push({
            id: id,
            name: def.name,
            icon: def.icon,
            desc: def.desc,
            startDay: a.startDay,
            endDay: a.endDay,
            remain: Math.max(0, a.endDay - (a._today || a.startDay)),
            participate: def.participate || null,
            modifiers: def.modifiers || {}
        });
    }
    return list;
}

/** 合并所有进行中事件的修正（乘区） */
function getActiveWorldEventModifiers() {
    var mods = {
        shopPrice: 1,
        cultivation: 1,
        exploreLoot: 1,
        encounterRate: 1,
        combatExp: 1,
        chestChance: 0,
        factionConflict: 1,
        qiRestore: 0
    };
    for (var id in activeWorldEvents) {
        var def = getWorldEventDef(id);
        if (!def || !def.modifiers) continue;
        var m = def.modifiers;
        if (m.shopPrice != null) mods.shopPrice *= m.shopPrice;
        if (m.cultivation != null) mods.cultivation *= m.cultivation;
        if (m.exploreLoot != null) mods.exploreLoot *= m.exploreLoot;
        if (m.encounterRate != null) mods.encounterRate *= m.encounterRate;
        if (m.combatExp != null) mods.combatExp *= m.combatExp;
        if (m.chestChance != null) mods.chestChance = Math.max(mods.chestChance, m.chestChance);
        if (m.factionConflict != null) mods.factionConflict *= m.factionConflict;
        if (m.qiRestore != null) mods.qiRestore += m.qiRestore;
    }
    return mods;
}

function expireWorldEvents(gameDay) {
    var expired = [];
    for (var id in activeWorldEvents) {
        var a = activeWorldEvents[id];
        if (!a) continue;
        a._today = gameDay;
        if (gameDay >= a.endDay) {
            expired.push(id);
        }
    }
    expired.forEach(function(id) {
        var def = getWorldEventDef(id);
        delete activeWorldEvents[id];
        if (def && window.showMessage) {
            window.showMessage(def.icon + ' 「' + def.name + '」已结束', 'info');
        }
    });
    return expired;
}

function activateWorldEvent(ev, gameDay) {
    activeWorldEvents[ev.id] = {
        startDay: gameDay,
        duration: ev.duration,
        endDay: gameDay + ev.duration,
        _today: gameDay
    };
    if (window.showMessage) {
        window.showMessage(ev.icon + ' ' + ev.name + '！持续 ' + ev.duration + ' 天。' + (ev.desc || ''), 'success');
    }
    if (ev.id === 'spirit_tide' && typeof window.restoreWorldQi === 'function') {
        window.restoreWorldQi(ev.modifiers && ev.modifiers.qiRestore || 10);
    }
    if (ev.id === 'sect_war' && typeof window.triggerFactionConflict === 'function') {
        try { window.triggerFactionConflict(); } catch (e) {}
    }
    // P2: 事件在当前城市留下残留状态
    var city = '';
    try {
        city = (window.locationSystem && window.locationSystem.getCurrentLocation && window.locationSystem.getCurrentLocation()) ||
            (window.currentCharData && window.currentCharData.location) || '';
    } catch (e) {}
    if (city && typeof setCityTempModifier === 'function') {
        if (ev.id === 'beast_tide') setCityTempModifier(city, { encounterRate: 1.5, security: 0.6, travelRisk: 1.4, days: ev.duration, flag: 'beast_tide_scar' });
        if (ev.id === 'sect_war') setCityTempModifier(city, { security: 0.5, travelRisk: 1.3, shopPrice: 1.1, days: ev.duration, flag: 'war_scar' });
        if (ev.id === 'market_boom') setCityTempModifier(city, { shopPrice: 0.85, days: ev.duration, flag: 'boom' });
        if (ev.id === 'treasure') setCityTempModifier(city, { encounterRate: 1.2, days: ev.duration, flag: 'treasure_rumor' });
    }

    // v18.9 世界日历：镜像注册"世界事件开始 + 结束日"（日历 endDay 时归档，触发摘要）
    // oneShot=false 因为事件持续多日，calendar 会在 endDay 自然归档
    tryRegisterWorldEvent(ev, gameDay);
}

// v18.9 世界日历：将世界事件注册到日历（按 endDay 触发，到期日入 log）
function tryRegisterWorldEvent(ev, gameDay) {
    try {
        if (!window.WorldCalendar || typeof window.WorldCalendar.register !== 'function') return;
        var endDay = gameDay + (ev.duration || 0);
        window.WorldCalendar.register({
            id: 'world_event.' + ev.id + '.end.' + endDay,
            title: (ev.icon ? ev.icon + ' ' : '') + (ev.name || ev.id) + '（结束）',
            category: 'world_event',
            dueAbsoluteDay: endDay,
            source: { system: 'world-events', refId: ev.id },
            severity: 'remind',
            oneShot: false
        });
    } catch (e) { /* calendar not ready — ignore */ }
}

function checkWorldEvents(gameDay) {
    expireWorldEvents(gameDay);
    if (typeof expireCityTempModifiers === 'function') expireCityTempModifiers(gameDay);
    if (gameDay % 10 !== 0) return;
    for (var i = 0; i < WORLD_EVENTS.length; i++) {
        var ev = WORLD_EVENTS[i];
        if (isWorldEventActive(ev.id)) continue;
        if (gameDay % ev.interval === 0 && Math.random() < ev.chance) {
            activateWorldEvent(ev, gameDay);
        }
    }
}

/** 玩家参与世界事件 */
function participateWorldEvent(eventId) {
    if (!isWorldEventActive(eventId)) {
        if (window.showMessage) window.showMessage('该事件未在进行中', 'warning');
        return false;
    }
    var def = getWorldEventDef(eventId);
    if (!def || !def.participate) {
        if (window.showMessage) window.showMessage('此事件无需参与，效果已自动生效', 'info');
        return false;
    }
    var action = def.participate.action;

    if (action === 'seek_treasure') {
        // 寻宝：高概率给物品
        var loot = ['spec_transfer_stone', 'mat_meteorite', 'pill_foundation', 'mat_purple_gold', 'wpn_dark_iron_sword'];
        if (Math.random() < 0.7) {
            var item = loot[Math.floor(Math.random() * loot.length)];
            if (typeof window.addItem === 'function') window.addItem(item, 1);
            if (window.showMessage) window.showMessage('✨ 寻得异宝！', 'success');
            if (window.showEffect) window.showEffect('item_get');
        } else {
            if (window.showMessage) window.showMessage('搜寻许久，只见空谷余音…', 'info');
        }
        if (window.timeSystem && window.timeSystem.advanceTime) window.timeSystem.advanceTime(60, '寻宝');
        return true;
    }

    if (action === 'fight_beast_tide') {
        if (typeof window.startBattle === 'function') {
            window.startBattle('beast_tide');
        } else if (window.showMessage) {
            // 简化奖励战斗
            if (window.showMessage) window.showMessage('🐾 你奋勇清剿兽潮！', 'success');
            if (typeof window.addItem === 'function') {
                window.addItem('mat_demon_beast_core', 2 + Math.floor(Math.random() * 3));
            }
            if (window.currentCharData) {
                window.currentCharData.tempering = (window.currentCharData.tempering || 0) + 150;
            }
            if (window.showEffect) window.showEffect('battle_hit');
        }
        if (typeof window.addReputation === 'function') {
            var city = window.locationSystem && window.locationSystem.getCurrentLocation && window.locationSystem.getCurrentLocation();
            if (city) window.addReputation(city, 30);
        }
        return true;
    }

    if (action === 'join_sect_war') {
        // 选择阵营简化：随机或按势力声望
        var side = Math.random() < 0.5 ? '正道' : '魔教';
        if (window.showMessage) window.showMessage('⚔️ 你加入' + side + '一方参战！', 'warning');
        if (typeof window.changeFactionReputation === 'function') {
            if (side === '正道') {
                window.changeFactionReputation('righteous', 50);
                window.changeFactionReputation('demon', -30);
            } else {
                window.changeFactionReputation('demon', 50);
                window.changeFactionReputation('righteous', -30);
            }
        }
        if (window.currentCharData) {
            window.currentCharData.tempering = (window.currentCharData.tempering || 0) + 200;
        }
        if (typeof window.addItem === 'function' && Math.random() < 0.4) {
            window.addItem('spec_transfer_stone', 1);
        }
        if (window.timeSystem && window.timeSystem.advanceTime) window.timeSystem.advanceTime(90, '正邪大战');
        return true;
    }

    return false;
}

function getWorldEventsPanelHtml() {
    var list = getActiveWorldEventList();
    if (list.length === 0) {
        return '<p class="text-gray-500 text-sm text-center">当前没有进行中的世界事件</p>';
    }
    var day = 0;
    if (typeof window.getAbsoluteDay === 'function') {
        day = window.getAbsoluteDay();
    } else if (window.timeSystem && window.timeSystem.gameTime) {
        var gt = window.timeSystem.gameTime;
        day = gt.currentDay || gt.totalDays || gt.day || 0;
    }
    var html = '';
    list.forEach(function(ev) {
        var remain = Math.max(0, ev.endDay - day);
        html += '<div class="bg-gray-700/40 p-3 rounded mb-2 border border-gray-600">' +
            '<div class="flex justify-between items-center">' +
            '<span class="font-bold text-yellow-300">' + ev.icon + ' ' + ev.name + '</span>' +
            '<span class="text-xs text-gray-400">剩余 ' + remain + ' 天</span></div>' +
            '<p class="text-xs text-gray-400 mt-1">' + ev.desc + '</p>';
        if (ev.participate) {
            html += '<button onclick="participateWorldEvent(\'' + ev.id + '\')" class="mt-2 text-xs bg-orange-600 hover:bg-orange-500 text-white px-2 py-1 rounded">' +
                ev.participate.label + '</button>';
        } else {
            html += '<p class="text-xs text-green-500/80 mt-1">效果已自动生效</p>';
        }
        html += '</div>';
    });
    return html;
}

// 存档
function saveWorldEvents() {
    try { localStorage.setItem('xianxia_world_events', JSON.stringify(activeWorldEvents)); } catch (e) {}
}
function loadWorldEvents() {
    try {
        var s = localStorage.getItem('xianxia_world_events');
        if (s) activeWorldEvents = JSON.parse(s);
    } catch (e) {}
}

// 时间系统集成：EventBus 是唯一新式边界，不再覆盖 timeSystem.onNewDay。
(function bindWorldEventTime() {
    loadWorldEvents();
    function handleNewDay(payload) {
        var newDay = payload && payload.newDay != null ? payload.newDay : getGameDaySafe();
        checkWorldEvents(newDay);
        var mods = getActiveWorldEventModifiers();
        if (mods.qiRestore > 0 && typeof window.restoreWorldQi === 'function') window.restoreWorldQi(Math.floor(mods.qiRestore / 2));
        saveWorldEvents();
    }
    if (window.EventBus && typeof window.EventBus.on === 'function') window.EventBus.on('newDay', handleNewDay);
    else if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') window.timeSystem.onNewDaySubscribe(function(oldDay, newDay) { handleNewDay({ oldDay: oldDay, newDay: newDay }); });
})();


// ============ v7.1 P2 城市临时世界状态 ============
var cityTempModifiers = {};

function loadCityTempModifiers() {
    try {
        var s = localStorage.getItem('xianxia_city_temp');
        if (s) cityTempModifiers = JSON.parse(s);
    } catch (e) {}
}
function saveCityTempModifiers() {
    try { localStorage.setItem('xianxia_city_temp', JSON.stringify(cityTempModifiers)); } catch (e) {}
}
function getGameDaySafe() {
    if (typeof window.getAbsoluteDay === 'function') {
        return window.getAbsoluteDay();
    }
    if (window.timeSystem && window.timeSystem.gameTime) {
        var gt = window.timeSystem.gameTime;
        return gt.currentDay || gt.totalDays || gt.day || 0;
    }
    return 0;
}
function setCityTempModifier(cityName, mods) {
    if (!cityName || !mods) return;
    var day = getGameDaySafe();
    var cur = cityTempModifiers[cityName] || {};
    var days = mods.days || 3;
    cur.endDay = day + days;
    if (mods.shopPrice != null) cur.shopPrice = mods.shopPrice;
    if (mods.encounterRate != null) cur.encounterRate = mods.encounterRate;
    if (mods.travelRisk != null) cur.travelRisk = mods.travelRisk;
    if (mods.security != null) cur.security = mods.security;
    if (mods.flag) {
        cur.flags = cur.flags || [];
        if (cur.flags.indexOf(mods.flag) < 0) cur.flags.push(mods.flag);
    }
    cityTempModifiers[cityName] = cur;
    saveCityTempModifiers();
}
function expireCityTempModifiers(gameDay) {
    gameDay = gameDay != null ? gameDay : getGameDaySafe();
    var changed = false;
    for (var c in cityTempModifiers) {
        if (cityTempModifiers[c].endDay != null && gameDay >= cityTempModifiers[c].endDay) {
            delete cityTempModifiers[c];
            changed = true;
            if (window.showMessage) window.showMessage('【' + c + '】临时事态已平息', 'info');
        }
    }
    if (changed) saveCityTempModifiers();
}
function getCityTempModifier(cityName) {
    expireCityTempModifiers();
    return cityTempModifiers[cityName] || null;
}
function getCombinedShopPriceMultiplier(cityName) {
    var m = 1;
    if (typeof getActiveWorldEventModifiers === 'function') {
        var w = getActiveWorldEventModifiers();
        if (w && w.shopPrice) m *= w.shopPrice;
    }
    var ct = getCityTempModifier(cityName);
    if (ct && ct.shopPrice) m *= ct.shopPrice;
    if (typeof window.getCityPriceModifier === 'function' && cityName) {
        try { m *= (window.getCityPriceModifier(cityName, 'buy') || 1); } catch (e) {}
    }
    return m;
}
function getCombinedTravelRiskMultiplier(fromCity, toCity) {
    var m = 1;
    if (typeof getActiveWorldEventModifiers === 'function') {
        var w = getActiveWorldEventModifiers();
        if (w && w.encounterRate) m *= w.encounterRate;
    }
    if (typeof window.getWeatherEventRateBonus === 'function') {
        try { m *= (window.getWeatherEventRateBonus() || 1); } catch (e) {}
    }
    var ct = getCityTempModifier(fromCity) || getCityTempModifier(toCity);
    if (ct && ct.travelRisk) m *= ct.travelRisk;
    if (ct && ct.security != null) m *= (2 - ct.security);
    return m;
}
loadCityTempModifiers();

// 导出
if (typeof window !== 'undefined') {
    window.WORLD_EVENTS = WORLD_EVENTS;
    window.activeWorldEvents = activeWorldEvents;
    window.checkWorldEvents = checkWorldEvents;
    window.isWorldEventActive = isWorldEventActive;
    window.getActiveWorldEventList = getActiveWorldEventList;
    window.getActiveWorldEventModifiers = getActiveWorldEventModifiers;
    window.participateWorldEvent = participateWorldEvent;
    window.getWorldEventsPanelHtml = getWorldEventsPanelHtml;
    window.expireWorldEvents = expireWorldEvents;
    window.saveWorldEvents = saveWorldEvents;
    window.loadWorldEvents = loadWorldEvents;
    window.cityTempModifiers = cityTempModifiers;
    window.setCityTempModifier = setCityTempModifier;
    window.getCityTempModifier = getCityTempModifier;
    window.expireCityTempModifiers = expireCityTempModifiers;
    window.getCombinedShopPriceMultiplier = getCombinedShopPriceMultiplier;
    window.getCombinedTravelRiskMultiplier = getCombinedTravelRiskMultiplier;
}
