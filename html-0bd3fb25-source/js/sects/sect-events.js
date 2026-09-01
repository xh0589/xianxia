// ==================== sect-events.js - 门派事件系统（P3） ====================
// 门派内部事件与外部事件，影响门派状态和弟子
// 依赖：sects.js、sects-system.js、sect-internal.js

// ============ 事件类型定义 ============
const SECT_EVENT_TYPES = {
    INTERNAL: 'internal',   // 内部事件
    EXTERNAL: 'external',   // 外部事件
    DISASTER: 'disaster',   // 灾难事件
    BONUS: 'bonus'          // 福利事件
};

// ============ 事件池 ============
const SECT_EVENTS_POOL = {
    // 内部事件
    'disciple_breakthrough': {
        type: 'internal', icon: '💫', name: '弟子突破',
        desc: function(sectName) { return sectName + '有弟子成功突破境界，全派士气大振。'; },
        effect: function(sectName) {
            var data = getSectInternal(sectName);
            if (data) data.morale = Math.min(100, (data.morale || 50) + 15);
            return '全派士气 +15';
        },
        minMorale: 0, maxMorale: 100
    },
    'elder_lecture': {
        type: 'internal', icon: '📖', name: '长老讲道',
        desc: function(sectName) { return '门派长老开坛讲道，弟子们受益匪浅。'; },
        effect: function(sectName) {
            var ds = window.discipleState || {};
            if (ds.isInSect && ds.sectId === sectName) {
                ds.points = (ds.points || 0) + 20;
            }
            var data = getSectInternal(sectName);
            if (data) data.morale = Math.min(100, (data.morale || 50) + 5);
            return '领悟 +20，全派士气 +5';
        },
        minMorale: 0, maxMorale: 100
    },
    'inner_dispute': {
        type: 'internal', icon: '⚡', name: '内部纷争',
        desc: function(sectName) { return sectName + '内部出现意见分歧，两派弟子争执不休。'; },
        effect: function(sectName) {
            var data = getSectInternal(sectName);
            if (data) data.morale = Math.max(0, (data.morale || 50) - 15);
            return '全派士气 -15';
        },
        minMorale: 20, maxMorale: 100
    },
    'treasure_found': {
        type: 'internal', icon: '💎', name: '发现宝藏',
        desc: function(sectName) { return '弟子在' + sectName + '后山发现了一处古修洞府！'; },
        effect: function(sectName) {
            var ds = window.discipleState || {};
            if (ds.isInSect && ds.sectId === sectName) {
                ds.contribution = (ds.contribution || 0) + 50;
                if (typeof window.addItem === 'function') {
                    var treasures = ['mat_spirit_stone', 'mat_lingzhi', 'mat_dark_iron', 'pill_qi_gather'];
                    window.addItem(treasures[Math.floor(Math.random() * treasures.length)], 1);
                }
            }
            var data = getSectInternal(sectName);
            if (data) { data.morale = Math.min(100, (data.morale || 50) + 10); data.resources = (data.resources || 100) + 50; }
            return '贡献 +50，获得材料，士气 +10，资源 +50';
        },
        minMorale: 0, maxMorale: 100
    },

    // 外部事件
    'ally_request': {
        type: 'external', icon: '🤝', name: '盟友求援',
        desc: function(sectName) { return '友派发来求援信，请求' + sectName + '出手相助。'; },
        effect: function(sectName) {
            var ds = window.discipleState || {};
            if (ds.isInSect && ds.sectId === sectName) {
                ds.contribution = (ds.contribution || 0) + 30;
            }
            return '贡献 +30';
        },
        minMorale: 0, maxMorale: 100
    },
    'hostile_attack': {
        type: 'external', icon: '⚔️', name: '外敌入侵',
        desc: function(sectName) { return '敌对势力袭击了' + sectName + '的山门！'; },
        effect: function(sectName) {
            var data = getSectInternal(sectName);
            if (data) {
                data.morale = Math.max(0, (data.morale || 50) - 20);
                data.resources = Math.max(0, (data.resources || 100) - 30);
            }
            var ds = window.discipleState || {};
            if (ds.isInSect && ds.sectId === sectName) {
                ds.contribution = (ds.contribution || 0) + 40;
            }
            return '全派士气 -20，资源 -30，你获得贡献 +40';
        },
        minMorale: 0, maxMorale: 100
    },
    'wandering_merchant': {
        type: 'external', icon: '🎪', name: '云游商人',
        desc: function(sectName) { return '一位云游商人来到' + sectName + '，出售稀有物品。'; },
        effect: function(sectName) {
            if (typeof window.addItem === 'function') {
                var goods = ['pill_spring_recovery', 'mat_meteorite', 'talisman_fire', 'food_roasted_meat'];
                window.addItem(goods[Math.floor(Math.random() * goods.length)], 1);
            }
            return '获得随机物品一件';
        },
        minMorale: 0, maxMorale: 100
    },

    // 灾难事件
    'demon_beast_rampage': {
        type: 'disaster', icon: '🐉', name: '妖兽肆虐',
        desc: function(sectName) { return '一只强大妖兽闯入' + sectName + '地界，造成严重破坏！'; },
        effect: function(sectName) {
            var data = getSectInternal(sectName);
            if (data) {
                data.morale = Math.max(0, (data.morale || 50) - 30);
                data.resources = Math.max(0, (data.resources || 100) - 50);
            }
            return '全派士气 -30，资源 -50';
        },
        minMorale: 0, maxMorale: 100
    },
    'plague': {
        type: 'disaster', icon: '☠️', name: '瘟疫蔓延',
        desc: function(sectName) { return sectName + '爆发瘟疫，多名弟子病倒。'; },
        effect: function(sectName) {
            var data = getSectInternal(sectName);
            if (data) {
                data.morale = Math.max(0, (data.morale || 50) - 25);
                data.disciples = Math.max(5, (data.disciples || 20) - 3);
            }
            var ds = window.discipleState || {};
            if (ds.isInSect && ds.sectId === sectName) {
                ds.contribution = (ds.contribution || 0) + 30;
            }
            return '全派士气 -25，弟子 -3，你贡献 +30';
        },
        minMorale: 0, maxMorale: 100
    },
    'spirit_vein_collapse': {
        type: 'disaster', icon: '💥', name: '灵脉崩塌',
        desc: function(sectName) { return sectName + '的灵脉突然崩塌，灵气浓度急剧下降！'; },
        effect: function(sectName) {
            var data = getSectInternal(sectName);
            if (data) {
                data.morale = Math.max(0, (data.morale || 50) - 35);
                data.resources = Math.max(0, (data.resources || 100) - 60);
            }
            return '全派士气 -35，资源 -60';
        },
        minMorale: 0, maxMorale: 100
    },

    // 福利事件
    'holy_land_open': {
        type: 'bonus', icon: '🏔️', name: '圣地开启',
        desc: function(sectName) { return sectName + '的修炼圣地对外开放，修炼效率翻倍！'; },
        effect: function(sectName) {
            if (typeof window.applyBuff === 'function') {
                window.applyBuff('sect_holy_land_buff', { cultivationSpeed: 1.0 }, 4);
            }
            var data = getSectInternal(sectName);
            if (data) data.morale = Math.min(100, (data.morale || 50) + 20);
            return '修炼速度 +100%（4小时），全派士气 +20';
        },
        minMorale: 0, maxMorale: 100
    },
    'grand_festival': {
        type: 'bonus', icon: '🎉', name: '门派庆典',
        desc: function(sectName) { return sectName + '举办盛大庆典，全派上下欢庆一堂。'; },
        effect: function(sectName) {
            var data = getSectInternal(sectName);
            if (data) {
                data.morale = Math.min(100, (data.morale || 50) + 25);
                data.resources = (data.resources || 100) + 30;
            }
            var ds = window.discipleState || {};
            if (ds.isInSect && ds.sectId === sectName) {
                ds.contribution = (ds.contribution || 0) + 20;
                if (typeof window.addItem === 'function') window.addItem('food_roasted_meat', 2);
            }
            return '全派士气 +25，资源 +30，贡献 +20';
        },
        minMorale: 0, maxMorale: 100
    },
    'master_return': {
        type: 'bonus', icon: '👴', name: '老祖出关',
        desc: function(sectName) { return sectName + '的太上老祖出关，修为更进一步！'; },
        effect: function(sectName) {
            var data = getSectInternal(sectName);
            if (data) {
                data.morale = Math.min(100, (data.morale || 50) + 30);
                data.influence = (data.influence || 50) + 20;
            }
            return '全派士气 +30，影响力 +20';
        },
        minMorale: 0, maxMorale: 100
    }
};

// ============ 获取门派内部数据 ============
function getSectInternal(sectName) {
    if (window.SECT_INTERNAL && window.SECT_INTERNAL[sectName]) {
        return window.SECT_INTERNAL[sectName];
    }
    return null;
}

function _sectEventNowMinute() {
    if (window.GameScheduler && typeof window.GameScheduler.nowMinute === 'function') return window.GameScheduler.nowMinute();
    return (window.timeSystem && window.timeSystem.gameTime) ? (Number(window.timeSystem.gameTime.totalMinutes) || 0) : 0;
}

function _sectEventConfig() {
    return (window.XianXia && window.XianXia.Balance && window.XianXia.Balance.sectEvents) || {
        checkCooldownMinutes: 360,
        activeDurationMinutes: 720,
        triggerChance: 0.30
    };
}

// ============ 生成门派事件 ============
function generateSectEvent(sectName) {
    var data = getSectInternal(sectName);
    if (!data) return null;
    
    var morale = data.morale || 50;
    var pool = [];
    
    // 根据士气筛选可用事件
    for (var key in SECT_EVENTS_POOL) {
        var ev = SECT_EVENTS_POOL[key];
        if (morale >= ev.minMorale && morale <= ev.maxMorale) {
            pool.push({ id: key, event: ev });
        }
    }
    
    if (pool.length === 0) return null;
    
    // 加权随机：灾难事件概率随士气降低而增加
    var pick = pool[Math.floor(Math.random() * pool.length)];
    var eventObj = pick.event;
    
    // 这里只生成描述，不执行效果。效果必须在玩家点击“处理”时结算。
    return {
        id: pick.id,
        type: eventObj.type,
        icon: eventObj.icon,
        name: eventObj.name,
        desc: eventObj.desc(sectName),
        effectDesc: '处理后结算事件影响',
        gameMinute: _sectEventNowMinute()
    };
}

// ============ 门派事件状态管理 ============
var sectEventState = {
    activeEvents: {},    // { sectName: { event, expiry } }
    completedEvents: [], // event id list
    lastCheckTime: {}    // { sectName: timestamp }
};

// ============ 检查是否有新事件 ============
function checkSectEvents(sectName) {
    var now = _sectEventNowMinute();
    var cfg = _sectEventConfig();
    var lastCheck = Number(sectEventState.lastCheckTime[sectName]);
    if (!Number.isFinite(lastCheck)) lastCheck = -Infinity;

    var active = sectEventState.activeEvents[sectName];
    if (active) {
        if (now < Number(active.expiryGameMinute || 0)) return active.event;
        delete sectEventState.activeEvents[sectName];
    }

    if (now - lastCheck < cfg.checkCooldownMinutes) return null;
    sectEventState.lastCheckTime[sectName] = now;

    if (Math.random() > cfg.triggerChance) return null;

    var event = generateSectEvent(sectName);
    if (event) {
        sectEventState.activeEvents[sectName] = {
            event: event,
            expiryGameMinute: now + cfg.activeDurationMinutes
        };
        // v18.9 世界日历：镜像注册"门派事件到期日"（到期日 = expiryGameMinute / 1440 向上取整）
        tryRegisterSectEvent(sectName, event, cfg.activeDurationMinutes);
        return event;
    }
    return null;
}

// v18.9 世界日历：把门派事件到期日注册为 sect_event 类别（镜像）
function tryRegisterSectEvent(sectName, event, durationMinutes) {
    try {
        if (!window.WorldCalendar || typeof window.WorldCalendar.register !== 'function') return;
        // 当前游戏绝对日（与 calendar 一致）
        var today = 1;
        try {
            if (window.getAbsoluteDay) today = Number(window.getAbsoluteDay()) || 1;
        } catch (e0) {}
        // 把"事件持续多少分钟"换算成"结束日"（默认 720min = 0.5 日，向上取整至少 1 日）
        var daysAhead = Math.max(1, Math.ceil((Number(durationMinutes) || 720) / 1440));
        var dueDay = today + daysAhead;
        window.WorldCalendar.register({
            id: 'sect_event.' + sectName + '.' + event.id + '.due.' + dueDay,
            title: (event.icon ? event.icon + ' ' : '') + (event.name || event.id) + '（' + sectName + '）',
            category: 'sect_event',
            dueAbsoluteDay: dueDay,
            source: { system: 'sect-events', refId: event.id },
            region: sectName,
            severity: 'remind',
            oneShot: false
        });
    } catch (e) { /* calendar not ready — ignore */ }
}

// ============ 处理门派事件 ============
function handleSectEvent(sectName, eventId) {
    var active = sectEventState.activeEvents[sectName];
    if (!active || active.event.id !== eventId) {
        if (typeof window.showMessage === 'function') {
            window.showMessage('此事件已过期', 'warning');
        }
        return;
    }
    
    var event = active.event;
    var definition = SECT_EVENTS_POOL[event.id];
    if (!definition || typeof definition.effect !== 'function') {
        delete sectEventState.activeEvents[sectName];
        if (typeof window.showMessage === 'function') window.showMessage('事件数据异常，已安全取消。', 'error');
        return;
    }
    var resultText = definition.effect(sectName);
    delete sectEventState.activeEvents[sectName];
    sectEventState.completedEvents.push({ id: eventId, sectName: sectName, gameMinute: _sectEventNowMinute() });
    if (sectEventState.completedEvents.length > 200) sectEventState.completedEvents = sectEventState.completedEvents.slice(-200);
    
    if (typeof window.showMessage === 'function') {
        window.showMessage('📜 ' + event.name + '：' + resultText, 'info');
    }
    
    // 刷新UI
    if (typeof window.showSectInnerView === 'function') {
        window.showSectInnerView(sectName);
    }
}

// ============ 获取事件描述 ============
function getSectEventDisplay(sectName) {
    var event = checkSectEvents(sectName);
    if (!event) return null;
    
    var typeColors = {
        internal: 'border-blue-600 bg-blue-900/30',
        external: 'border-yellow-600 bg-yellow-900/30',
        disaster: 'border-red-600 bg-red-900/30',
        bonus: 'border-green-600 bg-green-900/30'
    };
    var borderClass = typeColors[event.type] || 'border-gray-600';
    var typeNames = {
        internal: '内部事件',
        external: '外部事件',
        disaster: '⚠️ 灾难',
        bonus: '🎉 福利'
    };
    var typeName = typeNames[event.type] || '事件';
    
    return {
        html: '<div class="' + borderClass + ' p-3 rounded border mb-4">' +
            '<div class="flex items-center gap-2 mb-2">' +
            '<span class="text-2xl">' + event.icon + '</span>' +
            '<div class="flex-1">' +
            '<p class="font-bold text-sm text-white">' + event.name + '</p>' +
            '<p class="text-xs text-gray-400">' + typeName + '</p>' +
            '</div>' +
            '<button onclick="handleSectEvent(\'' + sectName + '\', \'' + event.id + '\')" class="bg-yellow-600 hover:bg-yellow-500 text-gray-900 px-3 py-1 rounded text-xs font-bold">处理</button>' +
            '</div>' +
            '<p class="text-xs text-gray-300">' + event.desc + '</p>' +
            '<p class="text-xs text-green-400 mt-1">' + event.effectDesc + '</p>' +
            '</div>',
        event: event
    };
}

if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
    window.StateRegistry.register('sectEvents', {
        version: 1,
        export: function() { return JSON.parse(JSON.stringify(sectEventState)); },
        import: function(data) {
            data = data || {};
            sectEventState.activeEvents = data.activeEvents || {};
            sectEventState.completedEvents = Array.isArray(data.completedEvents) ? data.completedEvents : [];
            sectEventState.lastCheckTime = data.lastCheckTime || {};
        },
        reset: function() {
            sectEventState.activeEvents = {};
            sectEventState.completedEvents = [];
            sectEventState.lastCheckTime = {};
        }
    });
}

// ============ 导出 ============
window.SECT_EVENT_TYPES = SECT_EVENT_TYPES;
window.SECT_EVENTS_POOL = SECT_EVENTS_POOL;
window.sectEventState = sectEventState;
window.generateSectEvent = generateSectEvent;
window.checkSectEvents = checkSectEvents;
window.handleSectEvent = handleSectEvent;
window.getSectEventDisplay = getSectEventDisplay;