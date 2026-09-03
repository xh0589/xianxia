// ==================== time-system.js - 时间系统 ====================
// 基于行为触发的时间推进系统

// ============ 时间段定义 ============
const TIME_PERIODS = [
    { id: 'late_night', name: '子时', startHour: 0, endHour: 6, color: 'text-gray-700', bonus: {} },
    { id: 'dawn', name: '黎明', startHour: 6, endHour: 7, color: 'text-orange-300', bonus: { cultivation: 1.1 } },
    { id: 'morning', name: '上午', startHour: 7, endHour: 11, color: 'text-yellow-300', bonus: { gathering: 1.1 } },
    { id: 'noon', name: '中午', startHour: 11, endHour: 13, color: 'text-yellow-400', bonus: { combat: 1.05 } },
    { id: 'afternoon', name: '下午', startHour: 13, endHour: 17, color: 'text-orange-400', bonus: { shopDiscount: 0.95 } },
    { id: 'dusk', name: '黄昏', startHour: 17, endHour: 19, color: 'text-red-400', bonus: { eventRate: 1.1 } },
    { id: 'evening', name: '晚上', startHour: 19, endHour: 21, color: 'text-blue-400', bonus: { cultivation: 1.15 } },
    { id: 'night', name: '深夜', startHour: 21, endHour: 23, color: 'text-indigo-500', bonus: { stealth: 1.2 } },
    { id: 'midnight', name: '午夜', startHour: 23, endHour: 24, color: 'text-purple-600', bonus: { yinPower: 1.2 } }
];

// ============ 季节定义 ============
const SEASONS = [
    { id: 'spring', name: '春', months: [0, 1, 2], bonus: { gathering: 1.2, cultivation: 1.1 } },
    { id: 'summer', name: '夏', months: [3, 4, 5], bonus: { firePower: 1.15, recovery: 1.1 } },
    { id: 'autumn', name: '秋', months: [6, 7, 8], bonus: { combat: 1.1, beastHunt: 1.15 } },
    { id: 'winter', name: '冬', months: [9, 10, 11], bonus: { defense: 1.1, qiRetention: 1.15 } }
];

// ============ 游戏时间状态 ============
let gameTime = {
    totalMinutes: 360,        // 从游戏开始经过的总分钟数（默认从6:00开始）
    currentDay: 1,             // 当前是第几天
    currentHour: 6,            // 当前小时
    currentMinute: 0,          // 当前分钟
    currentSeason: 'spring',   // 当前季节
    currentMonth: 0,           // 当前月份（0-11）
    currentYear: 1             // 当前年份
};

// B3：不足1小时动作不得刷完整小时恢复
var recoveryMinuteAcc = 0;
// B3：newDay 订阅者（兼容旧模块覆盖 timeSystem.onNewDay）
var _newDayListeners = [];


// ============ 初始化时间系统 ============
// 时间不再自动写入 localStorage。
// 仅在手动存档(saveGame)时写入存档，读档时由 loadSaveData 恢复。
function initTimeSystem() {
    // 清理历史遗留的自动时间存档，避免开局不是第1天
    try { localStorage.removeItem('xianxia_game_time'); } catch (e) {}
    // 默认第1天 6:00（内存态）。真正进度只来自手动读档。
    resetGameTime();
    updateTimeDisplay();
}

// ============ 重置时间（全局可访问） ============
function resetTimeSystem() {
    try { localStorage.removeItem('xianxia_game_time'); } catch (e) {}
    resetGameTime();
    updateTimeDisplay();
    syncTimeGlobals();
}

// ============ 重置游戏时间 ============
function resetGameTime() {
    gameTime.totalMinutes = 360; // 6:00
    gameTime.currentDay = 1;
    gameTime.currentHour = 6;
    gameTime.currentMinute = 0;
    gameTime.currentSeason = 'spring';
    gameTime.currentMonth = 0;
    gameTime.currentYear = 1;
    recoveryMinuteAcc = 0;
    // 不再自动 saveGameTime 到 localStorage
    syncTimeGlobals();
}

// ============ 同步全局引用（save/load 与 UI 共用同一对象） ============
function syncTimeGlobals() {
    if (typeof window !== 'undefined') {
        window.gameTime = gameTime;
        if (window.timeSystem) window.timeSystem.gameTime = gameTime;
        if (window.gameState) window.gameState.time = gameTime;
    }
}

// ============ 从手动存档恢复时间（不写独立键） ============
function loadGameTimeFromSave(data) {
    if (!data || typeof data !== 'object') return false;
    const keys = ['totalMinutes', 'currentDay', 'currentHour', 'currentMinute', 'currentSeason', 'currentMonth', 'currentYear'];
    keys.forEach(k => {
        if (data[k] !== undefined && data[k] !== null) gameTime[k] = data[k];
    });
    // F-36：读档重置分钟累加器，防跨会话残留致零碎时间恢复多触发一次
    recoveryMinuteAcc = 0;
    syncTimeGlobals();
    updateTimeDisplay();
    return true;
}

// ============ 获取可序列化时间快照（供手动存档） ============
function getGameTimeSnapshot() {
    return {
        totalMinutes: gameTime.totalMinutes,
        currentDay: gameTime.currentDay,
        currentHour: gameTime.currentHour,
        currentMinute: gameTime.currentMinute,
        currentSeason: gameTime.currentSeason,
        currentMonth: gameTime.currentMonth,
        currentYear: gameTime.currentYear
    };
}

// ============ 保存游戏时间（已禁用独立自动存档；保留空实现兼容旧调用） ============
function saveGameTime() {
    // no-op：禁止 xianxia_game_time 自动持久化
    // 时间只应出现在手动存档 JSON（xianxia_save / 导出.sav）中
    syncTimeGlobals();
}

// ============ 推进时间 ============
// minutes: 要推进的分钟数
// actionName: 动作名称（用于提示）
function advanceTime(minutes, actionName) {
    minutes = Math.max(0, Math.floor(Number(minutes) || 0));
    var oldTotalMinutes = gameTime.totalMinutes;
    gameTime.totalMinutes += minutes;
    
    // 计算新的小时和分钟
    const totalMinutesInDay = gameTime.totalMinutes % 1440;
    gameTime.currentHour = Math.floor(totalMinutesInDay / 60);
    gameTime.currentMinute = totalMinutesInDay % 60;
    
    // 新的一天
    // F-10 修复：之前只调一次 onNewDay(oldDay, newDay)，跨多天时漏触发中间天的每日重置/收入/恢复/商店刷新。
    // 修复：按 oldDay+1..newDay 循环触发，保证每个被跨越的天都跑 onNewDay。
    const newDay = Math.floor(gameTime.totalMinutes / 1440) + 1;
    if (newDay > gameTime.currentDay) {
        for (var _d = gameTime.currentDay + 1; _d <= newDay; _d++) {
            onNewDay(_d - 1, _d);
        }
        gameTime.currentDay = newDay;
    }
    
    // B3：月份/年份由绝对天数推导（每30天一月，每12月一年）
    var monthsPassed = Math.floor((gameTime.currentDay - 1) / 30);
    var newMonth = monthsPassed % 12;
    var newYear = 1 + Math.floor(monthsPassed / 12);
    if (newMonth !== gameTime.currentMonth) {
        gameTime.currentMonth = newMonth;
        updateSeason();
        onNewMonth();
    }
    if (newYear !== gameTime.currentYear) {
        gameTime.currentYear = newYear;
    }
    
    // 不再自动 localStorage 持久化时间；仅更新内存与UI
    syncTimeGlobals();
    updateTimeDisplay();
    
    // v9.9: 日常事件——时间推进 ≥5分钟时尝试城市/通用事件
    if (!window._isInLongRetreat && minutes >= 5 && window.dailyEvents && typeof window.dailyEvents.tryTriggerDailyEvent === 'function') {
        try { window.dailyEvents.tryTriggerDailyEvent('auto', { source: 'time', minutes: minutes }); } catch (e) {}
    }
    
    // B3：小时恢复用累加器——12次×5分钟只触发1次小时恢复
    if (minutes > 0 && window.currentCharData) {
        recoveryMinuteAcc += minutes;
        while (recoveryMinuteAcc >= 60) {
            recoveryMinuteAcc -= 60;
            hourlyPhysiologyRecovery();
            if (typeof window.hourlyRecovery === 'function') {
                var pe = window._playerEntity || window._playerPhysiology;
                if (pe) {
                    try { window.hourlyRecovery(pe); } catch (e) {}
                }
            }
        }
    }
    
    // 显示时间推进提示
    if (actionName && minutes > 0) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        let timeStr = '';
        if (hours > 0 && mins > 0) timeStr = `${hours}小时${mins}分钟`;
        else if (hours > 0) timeStr = `${hours}小时`;
        else timeStr = `${mins}分钟`;
        
        showMessage(`${actionName}耗时${timeStr}，现在是第${gameTime.currentDay}天 ${getCurrentPeriodName()} ${String(gameTime.currentHour).padStart(2,'0')}:${String(gameTime.currentMinute).padStart(2,'0')}`, 'info');
    }
    
    // v12.4：长行动时长反馈——单次推进≥120分钟时追加「⏰ 时间流逝了X小时」
    if (!window._suppressTimeFlowMessages && minutes >= 120) {
        const flowHours = Math.floor(minutes / 60);
        showMessage(`⏰ 时间流逝了${flowHours}小时`, 'info');
    }
    
    // ===== v11.8 NPC自主生活：时间推进时更新NPC状态 =====
    // P0-3: 累加器机制，零碎时间也累积，满1小时触发
    if (window.npcManager && typeof window.npcManager.updateAll === 'function') {
        if (typeof window._npcUpdateAccumulator !== 'number') window._npcUpdateAccumulator = 0;
        window._npcUpdateAccumulator += minutes;
        if (window._npcUpdateAccumulator >= 60) {
            try {
                var hrs = Math.floor(window._npcUpdateAccumulator / 60);
                window.npcManager.updateAll(hrs);
                window._npcUpdateAccumulator -= hrs * 60;
            } catch (e) {
                console.warn('[NPC自主生活] updateAll 失败:', e);
            }
        }
    }
    // P2-10: 调用NPC生命周期系统（垂危/寿命/消耗检查）
    if (window.NPCLifeSystem && window.npcManager && typeof window.npcManager.getAllNPCs === 'function') {
        try {
            var allLife = window.npcManager.getAllNPCs();
            if (typeof window.NPCLifeSystem.checkAllNPCLifeSystems === 'function') {
                window.NPCLifeSystem.checkAllNPCLifeSystems(allLife);
            }
        } catch (e) { console.warn('[NPCLifeSystem] checkAll failed:', e); }
    }
    // P2-10: 推进飞鸽传书待收邮件
    if (window.MailSystem && typeof window.MailSystem.advancePendingMail === 'function') {
        try { window.MailSystem.advancePendingMail(); } catch (e) {}
    }

    // v16.5 长行动反馈：≥120分钟的行动给出耗时尾缀——让世界的流逝被看见
    if (!window._suppressTimeFlowMessages && minutes >= 120 && window.showMessage) {
        var durHours = Math.floor(minutes / 60);
        var durMins = minutes % 60;
        var durTxt = (durHours > 0 ? durHours + '小时' : '') + (durMins > 0 ? durMins + '分' : '');
        try { window.showMessage('⏰ ' + (actionName || '此番行事') + '耗去' + durTxt + '。', 'info'); } catch (eTimeMsg) {}
    }

    // v12.1：所有游戏内期限统一监听这一事件，不再依赖现实 setTimeout/setInterval。
    if (window.EventBus && typeof window.EventBus.emit === 'function' && minutes > 0) {
        try {
            window.EventBus.emit('time:advanced', {
                fromMinute: oldTotalMinutes,
                toMinute: gameTime.totalMinutes,
                minutes: minutes,
                actionName: actionName || ''
            });
        } catch (e) {}
    }
}

// ============ 获取当前时间段 ============
function getCurrentPeriod() {
    const hour = gameTime.currentHour;
    for (const period of TIME_PERIODS) {
        if (period.startHour <= period.endHour) {
            if (hour >= period.startHour && hour < period.endHour) {
                return period;
            }
        } else {
            // 跨天的时间段
            if (hour >= period.startHour || hour < period.endHour) {
                return period;
            }
        }
    }
    return TIME_PERIODS[0];
}

function getCurrentPeriodName() {
    const period = getCurrentPeriod();
    return period.name;
}

// ============ 获取时间段加成 ============
function getTimePeriodBonus() {
    const period = getCurrentPeriod();
    return period.bonus || {};
}

// ============ 获取季节加成 ============
function getSeasonBonus() {
    const season = SEASONS.find(s => s.id === gameTime.currentSeason);
    return season ? season.bonus : {};
}

// ============ 新的一天触发 ============
function onNewDay(oldDay, newDay) {
    // 重置日常任务
    if (window.questSystem && typeof window.questSystem.resetDailyQuests === 'function') {
        window.questSystem.resetDailyQuests();
    }
    
    // 自然恢复
    naturalRecovery();

    // 每日收入
    if (typeof window.claimDailyIncome === 'function') {
        window.claimDailyIncome(true);
    }

    // 商店刷新
    if (window.shopManager && typeof window.shopManager.refreshAllInventory === 'function') {
        window.shopManager.refreshAllInventory();
        if (!window._isInLongRetreat && window.showMessage) window.showMessage('坊市商品已刷新', 'info');
    }
    
    // ===== v6.0-v6.4 新增每日事件 =====
    if (typeof window.collectSectResources === 'function') {
        window.collectSectResources();
    }
    
    if (typeof window.triggerFactionConflict === 'function' && Math.random() < 0.1) {
        var factions = Object.keys(window.FACTIONS || {});
        if (factions.length >= 2) {
            var f1 = factions[Math.floor(Math.random() * factions.length)];
            var f2 = factions[Math.floor(Math.random() * factions.length)];
            if (f1 !== f2) window.triggerFactionConflict(f1, f2);
        }
    }
    
    if (window.npcManager) {
        var npcs = window.npcManager.getAllNPCs();
        for (var i = 0; i < npcs.length; i++) {
            if (typeof npcs[i].dailyStressRecovery === 'function') {
                npcs[i].dailyStressRecovery();
            }
            if (typeof window.updateDaoCompanionMood === 'function') {
                window.updateDaoCompanionMood(npcs[i].id);
            }
        }
    }

    // B3：调用挂接在 timeSystem.onNewDay 上的包装（寿命/天气/世界事件/入侵/道侣）
    try {
        if (window.timeSystem && typeof window.timeSystem.onNewDay === 'function') {
            // 避免递归：外部包装应先调 orig；此处 orig 为 internal 空钩或链式
            var hook = window.timeSystem.onNewDay;
            if (hook && hook._isInternalNewDay !== true) {
                hook.call(window.timeSystem, oldDay, newDay);
            }
        }
    } catch (e) {
        console.warn('[time] onNewDay hook error', e);
    }
    for (var li = 0; li < _newDayListeners.length; li++) {
        try { _newDayListeners[li](oldDay, newDay); } catch (e2) {}
    }
    if (window.GameEvents && typeof window.GameEvents.emit === 'function') {
        try { window.GameEvents.emit('newDay', { oldDay: oldDay, newDay: newDay }); } catch (e3) {}
    }
    
    console.log('新的一天开始了！第' + oldDay + '天 -> 第' + newDay + '天');
}

function onNewDaySubscribe(fn) {
    // F-35：同引用去重，防重复订阅致 onNewDay 重复执行同逻辑
    if (typeof fn === 'function' && _newDayListeners.indexOf(fn) < 0) _newDayListeners.push(fn);
}

function getAbsoluteDay() {
    return gameTime.currentDay || 1;
}

/** 内部占位：供模块 var orig = timeSystem.onNewDay 时有可调用基线 */
function _internalOnNewDayHook(oldDay, newDay) {
    // no-op base; real work already done in onNewDay before hook chain
}
_internalOnNewDayHook._isInternalNewDay = true;


// ============ 新的月份触发 ============
function onNewMonth() {
    console.log(`新的月份开始了！季节：${gameTime.currentSeason}`);
}

// ============ 更新季节 ============
function updateSeason() {
    const month = gameTime.currentMonth;
    if (month <= 2) gameTime.currentSeason = 'spring';
    else if (month <= 5) gameTime.currentSeason = 'summer';
    else if (month <= 8) gameTime.currentSeason = 'autumn';
    else gameTime.currentSeason = 'winter';
}

// ============ 自然恢复（每日） ============
function naturalRecovery() {
    if (!window.currentCharData) return;
    
    // 每小时恢复量（每日恢复24次）
    const healthRecovery = 2;
    const qiRecovery = 1;
    const energyRecovery = 3;
    
    currentCharData.health = Math.min(currentCharData.maxHealth || 100, (currentCharData.health || 0) + healthRecovery);
    currentCharData.qi = Math.min(currentCharData.maxQi || 100, (currentCharData.qi || 0) + qiRecovery);
    currentCharData.energy = Math.min(currentCharData.maxEnergy || 100, (currentCharData.energy || 0) + energyRecovery);

    // 每日额外生理恢复（每小时恢复已在 advanceTime 中触发）
    // 这里仅做每日补充，防止推进时间不足导致恢复过慢
    const playerEntity = window._playerPhysiology;
    if (playerEntity && playerEntity.physiology) {
        const phys = playerEntity.physiology;
        // 每日额外恢复：血量+5，疼痛-10
        phys.bloodVolume = Math.min(100, (phys.bloodVolume || 100) + 5);
        phys.health = phys.bloodVolume;
        phys.painLoad = Math.max(0, (phys.painLoad || 0) - 10);
    }
}

// ============ v4.2 每小时生理恢复（在 advanceTime 中调用） ============
// 恢复原则：参考现实，小伤数日恢复，大伤需药物/治疗
// 每小时恢复速度：
//   - bloodVolume: +1/小时（自然补血）
//   - 凝血（bleeding伤口）：+3/小时
//   - 稳定度（包扎后）：+2/小时
//   - 疼痛：-3/小时
//   - 循环：+1/小时
//   - 深度<=2的伤口：可自然愈合（无需治疗）
//   - 深度>=3的伤口：需要治疗才能愈合
function hourlyPhysiologyRecovery() {
    const playerEntity = window._playerPhysiology;
    if (!playerEntity) return;
    const phys = playerEntity.physiology;
    if (!phys) return;

    // 1. 伤口恢复（凝血 + 稳定度）
    if (phys.wounds && phys.wounds.length > 0) {
        for (var wi = 0; wi < phys.wounds.length; wi++) {
            var w = phys.wounds[wi];
            if (!w) continue;
            
            // 出血中的伤口：凝血
            if (w.bleeding) {
                w.clottingProgress = Math.min(100, (w.clottingProgress || 0) + 3);
                if (w.clottingProgress >= 100) {
                    w.bleeding = false;
                    w.externalBleedRate = 0;
                    w.internalBleedRate = 0;
                }
            }
            
            // 已包扎的伤口：稳定度恢复
            if (w.stabilization > 0) {
                w.stabilization = Math.min(100, (w.stabilization || 0) + 2);
            }
            
            // 深度<=2的轻伤：每小时愈合结构损伤
            if (w.depth <= 2 && w.severity < 50) {
                // 轻伤可自然愈合
                w.severity = Math.max(0, (w.severity || 0) - 1);
            }
        }
        
        // 清理已愈合的轻伤伤口（severity<=0且无出血）
        phys.wounds = phys.wounds.filter(function(w) {
            return w && (w.bleeding || w.severity > 0 || w.stabilization > 0);
        });
    }

    // 2. 恢复生理数值
    phys.bloodVolume = Math.min(100, (phys.bloodVolume || 100) + 1);
    phys.health = phys.bloodVolume;
    phys.circulation = Math.min(100, (phys.circulation || 100) + 1);
    phys.painLoad = Math.max(0, (phys.painLoad || 0) - 3);
    phys.neuralShock = Math.max(0, (phys.neuralShock || 0) - 3);

    // 3. 每小时恢复部位耐久
    if (window._savedDurabilities) {
        for (var partId in window._savedDurabilities) {
            if (window._savedDurabilities.hasOwnProperty(partId)) {
                var cur = window._savedDurabilities[partId];
                var max = 100;
                if (cur < max) {
                    // 每小时恢复1点耐久
                    window._savedDurabilities[partId] = Math.min(max, cur + 1);
                }
            }
        }
        // 同步到 bodyDurability
        if (typeof bodyDurability !== 'undefined') {
            for (var pid in window._savedDurabilities) {
                if (window._savedDurabilities.hasOwnProperty(pid)) {
                    bodyDurability[pid] = window._savedDurabilities[pid];
                }
            }
        }
        // 刷新增益面板
        if (typeof renderBodyDurability === 'function') {
            try { renderBodyDurability(); } catch (e) {}
        }
    }

    // 3. 更新意识
    if (typeof window.updateConsciousness === 'function') {
        window.updateConsciousness(playerEntity);
    }
}

// ============ 更新时间显示 ============
function updateTimeDisplay() {
    const timeDisplay = document.getElementById('time-display');
    const seasonDisplay = document.getElementById('season-display');
    
    if (timeDisplay) {
        const period = getCurrentPeriod();
        const hour = String(gameTime.currentHour).padStart(2, '0');
        const minute = String(gameTime.currentMinute).padStart(2, '0');
        
        timeDisplay.innerHTML = `
            <span class="text-yellow-400">第${gameTime.currentDay}天</span>
            <span class="${period.color}">${period.name}</span>
            <span class="text-gray-300">${hour}:${minute}</span>
        `;
    }
    
    if (seasonDisplay) {
        const seasonNames = { spring: '春季', summer: '夏季', autumn: '秋季', winter: '冬季' };
        seasonDisplay.textContent = seasonNames[gameTime.currentSeason] || '';
    }
}

// ============ 行为耗时定义 ============
const ACTION_TIME_COSTS = {
    // 城市建筑
    shop_buy: 5,
    shop_sell: 5,
    alchemy_craft: 15,
    forging_strengthen: 15,
    forging_craft: 30,
    quest_accept: 2,
    quest_turnin: 2,
    inn_rest: 120,
    inn_upgrade: 60,
    training_combat: 60,
    training_meditate: 120,
    teleport: 15,
    tavern_drink: 30,
    cultivation_meditate: 120,
    cultivation_breakthrough: 60,
    spring_bathe: 60,
    temple_pray: 30,
    temple_meditate: 60,
    blackmarket_trade: 10,
    
    // 旅行
    travel_walk: 120,
    travel_horse: 60,
    travel_sword: 20,
    travel_teleport: 5,
    
    // 野外
    map_move: 10,
    map_explore: 10,
    map_talk: 15,
    map_battle: 30,
    map_boss: 60,
    
    // 修炼
    cultivation_normal: 60,
    cultivation_breakthrough: 120,
    proficiency_train: 30,
    enlightenment: 240,
    
    // 战斗
    battle_normal: 30,
    battle_boss: 60,
    battle_dungeon: 120,
    
    // 生活技能
    gather_herb: 15,
    mine_ore: 30,
    fish: 30,
    cook: 20,
    appraise: 10
};

// ============ 获取行为耗时 ============
function getActionTimeCost(actionKey) {
    return ACTION_TIME_COSTS[actionKey] || 10; // 默认10分钟
}

// ============ 执行带耗时的行为 ============
// actionKey: 行为键（如'shop_buy'）
// callback: 行为执行函数
function performActionWithTime(actionKey, callback) {
    const minutes = getActionTimeCost(actionKey);
    const actionName = getActionName(actionKey);
    
    if (!confirm(`此操作将消耗${minutes}分钟（${Math.floor(minutes/60)}小时${minutes%60}分钟），是否继续？`)) {
        return false;
    }
    
    // 执行行为
    if (typeof callback === 'function') {
        callback();
    }
    
    // 推进时间
    advanceTime(minutes, actionName);
    
    return true;
}

// ============ 获取行为名称 ============
function getActionName(actionKey) {
    const names = {
        shop_buy: '购买物品',
        shop_sell: '出售物品',
        alchemy_craft: '炼制丹药',
        forging_strengthen: '强化装备',
        forging_craft: '锻造武器',
        quest_accept: '接取任务',
        quest_turnin: '交付任务',
        inn_rest: '客栈休息',
        inn_upgrade: '包间休息',
        training_combat: '实战训练',
        training_meditate: '静心修炼',
        teleport: '传送',
        tavern_drink: '喝酒听情报',
        cultivation_meditate: '打坐修炼',
        cultivation_breakthrough: '尝试突破',
        spring_bathe: '沐浴灵泉',
        temple_pray: '祈福祷告',
        temple_meditate: '寺中静修',
        blackmarket_trade: '黑市交易',
        travel_walk: '步行旅行',
        travel_horse: '骑马旅行',
        travel_sword: '御剑飞行',
        travel_teleport: '传送阵旅行',
        map_move: '移动',
        map_explore: '探索',
        map_talk: '对话',
        map_battle: '战斗',
        map_boss: 'Boss战',
        cultivation_normal: '普通修炼',
        proficiency_train: '熟练度训练',
        enlightenment: '领悟天道',
        battle_normal: '普通战斗',
        battle_boss: 'Boss战斗',
        battle_dungeon: '团队副本',
        gather_herb: '采集灵药',
        mine_ore: '开采矿石',
        fish: '钓鱼',
        cook: '烹饪',
        appraise: '鉴定物品'
    };
    return names[actionKey] || actionKey;
}

// ============ 显示消息 ============
// 已由 global-utils.js 在第0层设置 window.showMessage，此处不再重复声明
// 所有调用直接使用 window.showMessage()

// ============ 导出到全局 ============
window.gameTime = gameTime;
window.timeSystem = {
    initTimeSystem,
    saveGameTime,              // 空实现，兼容旧调用（不再写 localStorage）
    loadGameTimeFromSave,
    getGameTimeSnapshot,
    resetGameTime,
    resetTimeSystem,
    advanceTime,
    getCurrentPeriod,
    getCurrentPeriodName,
    getTimePeriodBonus,
    getSeasonBonus,
    naturalRecovery,
    updateTimeDisplay,
    getActionTimeCost,
    getActionName,
    performActionWithTime,
    syncTimeGlobals,
    onNewDay: _internalOnNewDayHook, // B3：可被寿命/天气等包装；advance 内会调用
    onNewDaySubscribe: onNewDaySubscribe,
    getAbsoluteDay: getAbsoluteDay,
    TIME_PERIODS,
    SEASONS,
    ACTION_TIME_COSTS,
    gameTime
};
window.getAbsoluteDay = getAbsoluteDay;
if (!window.TimeService) {
    window.TimeService = {
        getAbsoluteDay: getAbsoluteDay,
        getGameTimeSnapshot: getGameTimeSnapshot,
        advanceTime: function(m, a) { return advanceTime(m, a); },
        onNewDay: function(fn) { return onNewDaySubscribe(fn); }
    };
}
window.resetTimeSystem = resetTimeSystem;
window.loadGameTimeFromSave = loadGameTimeFromSave;
window.getGameTimeSnapshot = getGameTimeSnapshot;

// 自动初始化：仅重置内存到第1天，不读/写独立时间存档
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        initTimeSystem();
    });
}
