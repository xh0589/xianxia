// ==================== travel-system.js - 旅行系统 ====================
// 管理城市间旅行、地图探索、旅行事件

// ============ 旅行方式定义 ============
const TRAVEL_METHODS = {
    WALK: { 
        id: 'walk', 
        name: '步行', 
        icon: '🚶', 
        timeCost: 120,        // 2小时
        energyCost: 20,       // 消耗20精力
        risk: 0.1,            // 10%遭遇事件概率
        desc: '安全但缓慢'
    },
    HORSE: { 
        id: 'horse', 
        name: '骑马', 
        icon: '🐴', 
        timeCost: 60,         // 1小时
        energyCost: 10,       // 消耗10精力
        cost: 50,             // 50铜钱
        risk: 0.08,
        desc: '平衡的选择'
    },
    FLOAT_SWORD: { 
        id: 'float_sword', 
        name: '御剑', 
        icon: '⚡', 
        timeCost: 20,         // 20分钟
        energyCost: 30,       // 消耗30真气
        minRealm: '筑基',
        risk: 0.05,
        desc: '修仙者的方式，快速但耗真气'
    },
    TELEPORT_ARRAY: { 
        id: 'teleport', 
        name: '传送阵', 
        icon: '🌀', 
        timeCost: 5,          // 5分钟
        energyCost: 0,
        cost: 100,            // 100灵石
        risk: 0.02,
        desc: '最快速的方式，需要找到传送阵'
    }
};

// ============ 旅行风险事件 ============
const travelEvents = [
    {
        id: 'bandit_ambush',
        name: '山贼劫道',
        type: 'combat',
        weight: 30,
        description: '一群山贼突然出现，挡住了你的去路！',
        minRealm: '炼气',
        onTrigger: function() {
            if (typeof window.setFlag === 'function') window.setFlag('bandit_ambushed');
            if (typeof window.unlockBanditDenQuest === 'function') window.unlockBanditDenQuest();
            if (window.startBattle) {
                window.startBattle('bandits');
            } else if (window.showMessage) {
                window.showMessage('与山贼一场恶战！', 'warning');
            }
            if (window.showMessage) window.showMessage('或许该追查山贼巢穴……', 'info');
        }
    },
    {
        id: 'spirit_herb_found',
        name: '发现灵药',
        type: 'treasure',
        weight: 20,
        description: '你在路边发现了一株罕见的灵药！',
        minRealm: '炼气',
        onTrigger: function() {
            if (window.addItemToInventory) {
                window.addItemToInventory('lingzhi', 1);
            }
            showMessage('获得：灵芝 x1', 'success');
        }
    },
    {
        id: 'ancient_ruins',
        name: '发现遗迹',
        type: 'exploration',
        weight: 15,
        description: '你发现了一处古老的修炼遗迹！',
        minRealm: '筑基',
        onTrigger: function() {
            if (window.eventSystem && window.eventSystem.enterSecretRealm) {
                window.eventSystem.enterSecretRealm();
            }
        }
    },
    {
        id: 'wandering_merchant',
        name: '游商相遇',
        type: 'trade',
        weight: 15,
        description: '一位游商正在附近扎营做生意。',
        minRealm: '炼气',
        onTrigger: function() {
            if (window.openShop) {
                window.openShop('travel_merchant');
            }
        }
    },
    {
        id: 'heavenly_opportunity',
        name: '天道机缘',
        type: 'cultivation',
        weight: 10,
        description: '你感受到天地灵气在聚集，似乎有机会突破！',
        minRealm: '筑基',
        onTrigger: function() {
            if (window.currentCharData) {
                currentCharData.essence = (currentCharData.essence || 0) + 50;
                showMessage('获得50点真元！', 'success');
                if (window.updateStatusPanel) {
                    window.updateCharacterStatus();
                }
            }
        }
    },
    {
        id: 'injury',
        name: '意外受伤',
        type: 'negative',
        weight: 10,
        description: '你在旅途中不小心受了伤。',
        minRealm: '炼气',
        onTrigger: function() {
            if (window.currentCharData) {
                currentCharData.health = Math.max(1, (currentCharData.health || 100) - 30);
                showMessage('受到30点伤害！', 'error');
                if (window.updateStatusPanel) {
                    window.updateCharacterStatus();
                }
            }
        }
    },
    {
        id: 'bandit_den_clue',
        name: '山贼踪迹',
        type: 'exploration',
        weight: 12,
        description: '你发现山贼留下的脚印，通向深处密林。',
        minRealm: '炼气',
        requiresFlag: 'bandit_ambushed',
        onTrigger: function() {
            if (typeof window.setFlag === 'function') window.setFlag('know_bandit_den');
            if (typeof window.unlockBanditDenQuest === 'function') window.unlockBanditDenQuest();
            if (window.showMessage) window.showMessage('已标记山贼巢穴方向（黑风寨）', 'success');
        }
    },
    {
        id: 'weather_disaster',
        name: '风雨阻路',
        type: 'negative',
        weight: 14,
        description: '突如其来的恶劣天气让行程受阻。',
        minRealm: '炼气',
        onTrigger: function() {
            if (window.currentCharData) {
                currentCharData.energy = Math.max(0, (currentCharData.energy || 100) - 15);
            }
            if (window.showMessage) window.showMessage('精力-15，耽搁了行程', 'error');
        }
    },
    {
        id: 'sect_disciple',
        name: '同道中人',
        type: 'trade',
        weight: 12,
        description: '一位门派弟子与你结伴一程，谈玄论道。',
        minRealm: '炼气',
        onTrigger: function() {
            if (window.currentCharData) {
                currentCharData.essence = (currentCharData.essence || 0) + 30;
                currentCharData.tempering = (currentCharData.tempering || 0) + 20;
            }
            if (window.showMessage) window.showMessage('论道有益，经验与修为提升', 'success');
            if (typeof window.setFlag === 'function') window.setFlag('met_sect_disciple');
        }
    }
];

// ============ 旅行状态 ============
let travelState = {
    isTraveling: false,
    fromCity: null,
    toCity: null,
    method: 'walk',
    startGameMinute: null,
    arrivalGameMinute: null
};

function _travelNowMinute() {
    if (window.GameScheduler && typeof window.GameScheduler.nowMinute === 'function') return window.GameScheduler.nowMinute();
    return (window.timeSystem && window.timeSystem.gameTime) ? (Number(window.timeSystem.gameTime.totalMinutes) || 0) : 0;
}

// ============ 已解锁传送阵 ============
let unlockedTeleports = new Set();

// ============ 初始化旅行系统 ============
function initTravelSystem() {
    const saved = localStorage.getItem('xianxia_travel_data');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            unlockedTeleports = new Set(data.unlockedTeleports || []);
        } catch (e) {
            console.error('加载旅行数据失败:', e);
        }
    }
}

// ============ 保存旅行数据 ============
function saveTravelData() {
    localStorage.setItem('xianxia_travel_data', JSON.stringify({
        unlockedTeleports: Array.from(unlockedTeleports)
    }));
}

// ============ 开始旅行 ============

// B5：城市间距离（同区域近、跨区域远；无数据时默认 1）
function getCityTravelDistance(fromCity, toCity) {
    if (!fromCity || !toCity) return 1;
    if (fromCity === toCity) return 0;
    var mapData = window.mapData || {};
    var fromR = null, toR = null;
    for (var region in mapData) {
        var cities = mapData[region].cities || [];
        if (cities.indexOf(fromCity) >= 0 || cities.indexOf(String(fromCity).replace(/\s+/g, '')) >= 0) fromR = region;
        if (cities.indexOf(toCity) >= 0 || cities.indexOf(String(toCity).replace(/\s+/g, '')) >= 0) toR = region;
    }
    if (fromR && toR && fromR === toR) return 1;
    if (fromR && toR) return 2.5;
    return 1.5;
}

function startTravel(toCity, method = 'walk') {
    const fromCity = window.locationSystem.getCurrentLocation();
    
    if (!fromCity) {
        showMessage('您还没有到达任何城市', 'error');
        return false;
    }
    
    if (fromCity === toCity) {
        showMessage('您已经在目标城市了', 'warning');
        return false;
    }
    
    const toCityData = window.locationSystem.getCityData(toCity);
    if (!toCityData) {
        showMessage(`找不到城市：${toCity}`, 'error');
        return false;
    }
    
    // 检查旅行方式
    const travelMethod = Object.values(TRAVEL_METHODS).find(m => m.id === method);
    if (!travelMethod) {
        return false;
    }

    // B5：传送阵需目的地已解锁
    if (travelMethod.id === 'teleport' || method === 'teleport') {
        var destOk = unlockedTeleports.has(toCity) || unlockedTeleports.has(String(toCity).replace(/\s+/g, ''));
        if (!destOk) {
            showMessage('目的地传送阵尚未解锁（需先抵达该城或完成相关机缘）', 'error');
            return false;
        }
    }
    
    // 检查境界要求
    if (travelMethod.minRealm) {
        const playerRealm = window.currentCharData?.realm || '炼气';
        const playerLayer = window.currentCharData?.layer || 1;
        
        if (!checkRealmRequirement(travelMethod.minRealm, playerRealm, playerLayer)) {
            showMessage(`您的境界不足，无法使用 ${travelMethod.name}（需要：${travelMethod.minRealm}）`, 'error');
            return false;
        }
    }
    
    // 检查资源（使用 DataManager 统一数据访问）
    if (travelMethod.cost) {
        const dm = window.XianXia?.DataManager;
        if (travelMethod.id === 'teleport') {
            const stones = dm ? dm.getSpiritStones() : (currentCharData.spiritStones || 0);
            if (stones < travelMethod.cost) {
                showMessage(`灵石不足，需要${travelMethod.cost}灵石`, 'error');
                return false;
            }
        } else {
            const gold = dm ? dm.getCopper() : (currentCharData.copper || 0);
            if (gold < travelMethod.cost) {
                showMessage(`铜钱不足，需要${travelMethod.cost}铜钱`, 'error');
                return false;
            }
        }
    }
    
    if (travelMethod.energyCost > 0) {
        const resource = travelMethod.id === 'float_sword' ? 'qi' : 'energy';
        if ((currentCharData[resource] || 0) < travelMethod.energyCost) {
            const resourceName = resource === 'qi' ? '真气' : '精力';
            showMessage(`${resourceName}不足，无法旅行`, 'error');
            return false;
        }
    }
    
    // v7.1 骑乘缩短旅行时间
    let actualTimeCost = travelMethod.timeCost;
    let mountNote = '';
    if (typeof window.getMountTravelTimeMultiplier === 'function') {
        const mul = window.getMountTravelTimeMultiplier();
        if (mul && mul !== 1) {
            actualTimeCost = Math.max(5, Math.floor(travelMethod.timeCost * mul));
            const mt = window.getActiveMount && window.getActiveMount();
            mountNote = mt ? `（骑乘${mt.name} ${actualTimeCost}分钟）` : `（骑乘加速 ${actualTimeCost}分钟）`;
        }
    }
    if ((travelMethod.id === 'walk' || travelMethod.id === 'horse') && window.BeastEcosystem && typeof window.BeastEcosystem.getActiveBeastBuff === 'function') {
        var wolfMul = window.BeastEcosystem.getActiveBeastBuff('travel') || 0;
        if (wolfMul && wolfMul < 1) {
            actualTimeCost = Math.max(5, Math.floor(actualTimeCost * wolfMul));
            mountNote += '（风狼引路）';
        }
    }


    // B5：距离 × 天气影响耗时
    var distMul = 1;
    try { distMul = getCityTravelDistance(fromCity, toCity) || 1; } catch (e) {}
    var weatherMul = 1;
    try {
        if (typeof window.getWeatherTravelTimeMultiplier === 'function') weatherMul = window.getWeatherTravelTimeMultiplier() || 1;
        else if (typeof window.getWeatherEventRateBonus === 'function') weatherMul = Math.max(1, window.getWeatherEventRateBonus() || 1);
    } catch (e) {}
    actualTimeCost = Math.max(5, Math.floor(actualTimeCost * distMul * weatherMul));
    if (distMul > 1.2) mountNote += '（路途较远×' + distMul + '）';

    // 确认旅行
    if (!confirm(`确定要前往 ${toCity} 吗？\n方式：${travelMethod.icon} ${travelMethod.name}\n耗时：${actualTimeCost}分钟${mountNote}`)) {
        return false;
    }
    
    // 扣除资源（使用 DataManager 统一接口）
    if (travelMethod.cost) {
        const dm = window.XianXia?.DataManager;
        if (travelMethod.id === 'teleport') {
            if (dm) {
                dm.deductSpiritStones(travelMethod.cost);
            } else {
                currentCharData.spiritStones = (currentCharData.spiritStones || 0) - travelMethod.cost;
            }
        } else {
            const gold = dm ? dm.getCopper() : (currentCharData.copper || 0);
            if (dm) {
                dm.setCopper(gold - travelMethod.cost);
            } else {
                currentCharData.copper = gold - travelMethod.cost;
            }
        }
    }
    if (travelMethod.energyCost > 0) {
        const resource = travelMethod.id === 'float_sword' ? 'qi' : 'energy';
        currentCharData[resource] -= travelMethod.energyCost;
    }
    
    // 设置旅行状态。旅行是游戏时间事务，不依赖现实 setTimeout。
    var startGameMinute = _travelNowMinute();
    Object.assign(travelState, {
        isTraveling: true,
        fromCity: fromCity,
        toCity: toCity,
        method: method,
        startGameMinute: startGameMinute,
        arrivalGameMinute: startGameMinute + actualTimeCost
    });

    if (window.GameScheduler && typeof window.GameScheduler.schedule === 'function') {
        window.GameScheduler.schedule('travel:complete', travelState.arrivalGameMinute, { risk: travelMethod.risk });
    }

    showMessage(`开始前往 ${toCity}...（${travelMethod.name}${mountNote}）`, 'info');
    if (window.timeSystem) window.timeSystem.advanceTime(actualTimeCost);

    // 无调度器时同步兜底；正常路径会在 time:advanced 中自动结算。
    if (travelState.isTraveling && (!window.GameScheduler || typeof window.GameScheduler.schedule !== 'function')) {
        completeTravel(travelMethod.risk);
    }
}

// ============ 检查境界要求 ============
function checkRealmRequirement(requirement, playerRealm, playerLayer) {
    const realmOrder = ['炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'];
    const requiredLayer = parseInt(requirement.replace(/[^\d]/g, '')) || 1;
    const realmName = requirement.replace(/\d+层?/, '');
    
    const playerRealmIndex = realmOrder.indexOf(playerRealm);
    const requiredRealmIndex = realmOrder.indexOf(realmName);
    
    if (playerRealmIndex < requiredRealmIndex) return false;
    if (playerRealmIndex === requiredRealmIndex && playerLayer < requiredLayer) return false;
    
    return true;
}

// ============ 完成旅行 ============
function completeTravel(risk = 0.1) {
    const toCity = travelState.toCity;
    const fromCity = travelState.fromCity;
    
    travelState.isTraveling = false;

    // B5：先结算途中事件，再抵达（避免已在城内却遇路上事件）
    let finalRisk = risk;
    if (typeof window.getCombinedTravelRiskMultiplier === 'function') {
        try { finalRisk *= (window.getCombinedTravelRiskMultiplier(fromCity, toCity) || 1); } catch (e) {}
    } else {
        if (typeof window.getWeatherEventRateBonus === 'function') {
            try { finalRisk *= (window.getWeatherEventRateBonus() || 1); } catch (e) {}
        }
        if (typeof window.getActiveWorldEventModifiers === 'function') {
            try {
                var wm = window.getActiveWorldEventModifiers();
                if (wm && wm.encounterRate) finalRisk *= wm.encounterRate;
            } catch (e) {}
        }
    }
    finalRisk = Math.min(0.85, Math.max(0.02, finalRisk));

    var hadEvent = false;
    if (Math.random() < finalRisk) {
        hadEvent = true;
        try { triggerTravelEvent(); } catch (e) {}
    }

    function arriveDest() {
        if (window.locationSystem) {
            if (typeof window.locationSystem.travelToCity === 'function') {
                window.locationSystem.travelToCity(toCity);
            } else if (typeof window.locationSystem.enterCity === 'function') {
                window.locationSystem.enterCity(toCity);
            } else if (typeof window.enterCity === 'function') {
                window.enterCity(toCity);
            }
        }
        // 抵达即解锁传送阵
        try {
            unlockedTeleports.add(toCity);
            saveTravelData();
        } catch (e) {}
    }

    // 途中事件先触发，再同步落地城市状态；关闭页面也不会丢失抵达结算。
    arriveDest();
}

// ============ 触发旅行事件 ============
function triggerTravelEvent() {
    const playerRealm = window.currentCharData?.realm || '炼气';
    const playerLayer = window.currentCharData?.layer || 1;
    
    const availableEvents = travelEvents.filter(event => {
        if (!checkRealmRequirement(event.minRealm || '炼气', playerRealm, playerLayer)) return false;
        if (event.requiresFlag && typeof window.hasFlag === 'function' && !window.hasFlag(event.requiresFlag)) return false;
        return true;
    });
    
    if (availableEvents.length === 0) return;
    
    // 恶劣天气提高 combat/negative 权重
    let weatherMul = 1;
    try {
        if (typeof window.getCurrentWeather === 'function') {
            const w = window.getCurrentWeather();
            if (w && (w.id === 'stormy' || w.id === 'snowy' || w.id === 'foggy')) weatherMul = 1.5;
        }
    } catch (e) {}
    
    const weighted = availableEvents.map(e => {
        let w = e.weight;
        if ((e.type === 'combat' || e.type === 'negative') && weatherMul > 1) w *= weatherMul;
        if (e.id === 'bandit_den_clue' && typeof window.hasFlag === 'function' && window.hasFlag('bandit_ambushed')) w *= 2;
        return { e, w };
    });
    const totalWeight = weighted.reduce((sum, x) => sum + x.w, 0);
    let random = Math.random() * totalWeight;
    
    for (const item of weighted) {
        random -= item.w;
        if (random <= 0) {
            showTravelEventDialog(item.e);
            break;
        }
    }
}

// ============ 显示旅行事件对话框 ============
function showTravelEventDialog(event) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50';
    
    const typeColors = {
        'combat': 'text-red-400 border-red-500',
        'treasure': 'text-yellow-400 border-yellow-500',
        'exploration': 'text-purple-400 border-purple-500',
        'trade': 'text-green-400 border-green-500',
        'cultivation': 'text-blue-400 border-blue-500',
        'negative': 'text-gray-400 border-gray-500'
    };
    
    const colorClass = typeColors[event.type] || 'text-gray-400 border-gray-500';
    
    modal.innerHTML = `
        <div class="bg-gray-900 border-2 ${colorClass.split(' ')[1]} rounded-lg p-6 max-w-md w-full mx-4">
            <div class="flex items-center mb-4">
                <span class="text-3xl mr-3">${getTravelEventIcon(event.type)}</span>
                <div>
                    <h3 class="text-xl font-bold ${colorClass.split(' ')[0]}">${event.name}</h3>
                    <p class="text-xs text-gray-500">${event.type}</p>
                </div>
            </div>
            <p class="text-gray-300 mb-4">${event.description}</p>
            <button onclick="this.closest('.fixed').remove(); triggerEventAction('${event.id}')" 
                    class="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded w-full">
                继续旅程
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// ============ 获取事件图标 ============
function getTravelEventIcon(type) {
    const icons = {
        'combat': '⚔️',
        'treasure': '🎁',
        'exploration': '🏛️',
        'trade': '🤝',
        'cultivation': '🧘',
        'negative': '💔'
    };
    return icons[type] || '❓';
}

// ============ 触发事件动作 ============
function triggerEventAction(eventId) {
    return triggerEventEvent(eventId);
}
function triggerEventEvent(eventId) {
    const event = travelEvents.find(e => e.id === eventId);
    if (event && event.onTrigger) {
        event.onTrigger();
    }
    
    // 关闭模态框
    const modal = document.querySelector('.fixed.inset-0');
    if (modal) {
        modal.remove();
    }
}

// ============ 显示旅行方式选择 ============
function showTravelMethodSelect(toCity) {
    const methods = Object.values(TRAVEL_METHODS);
    
    let choicesHtml = '<div class="space-y-2">';
    methods.forEach(method => {
        const canUse = checkMethodUsable(method, toCity);
        const disabled = !canUse ? 'opacity-50 cursor-not-allowed' : '';
        
        choicesHtml += `
            <button onclick="${canUse ? `startTravel('${toCity}', '${method.id}')` : ''}" 
                    class="w-full bg-gray-700 hover:bg-gray-600 p-3 rounded text-left transition ${disabled}">
                <div class="flex justify-between items-center">
                    <div>
                        <span class="text-xl mr-2">${method.icon}</span>
                        <span class="font-bold text-white">${method.name}</span>
                    </div>
                    <div class="text-right">
                        <p class="text-xs text-gray-400">${method.timeCost}分钟</p>
                        <p class="text-xs text-gray-500">${method.desc}</p>
                    </div>
                </div>
                ${!canUse ? `<p class="text-xs text-red-400 mt-1">${getMethodRestriction(method)}</p>` : ''}
            </button>
        `;
    });
    choicesHtml += '</div>';
    
    if (typeof window.showBuildingEffectDialog === 'function') window.showBuildingEffectDialog('选择旅行方式', choicesHtml);
}

// ============ 检查旅行方式是否可用 ============
function checkMethodUsable(method, toCity) {
    if (method.minRealm) {
        const playerRealm = window.currentCharData?.realm || '炼气';
        const playerLayer = window.currentCharData?.layer || 1;
        if (!checkRealmRequirement(method.minRealm, playerRealm, playerLayer)) {
            return false;
        }
    }
    // B5：传送需解锁
    if ((method.id === 'teleport') && toCity) {
        if (!unlockedTeleports.has(toCity) && !unlockedTeleports.has(String(toCity).replace(/\s+/g, ''))) {
            return false;
        }
    }
    
    if (method.cost) {
        if (method.id === 'teleport') {
            if ((currentCharData.spiritStones || 0) < method.cost) return false;
        } else {
            if ((currentCharData.copper || 0) < method.cost) return false;
        }
    }
    
    if (method.energyCost > 0) {
        const resource = method.id === 'float_sword' ? 'qi' : 'energy';
        if ((currentCharData[resource] || 0) < method.energyCost) return false;
    }
    
    return true;
}

// ============ 获取方式限制说明 ============
function getMethodRestriction(method) {
    if (method.minRealm) {
        return `需要 ${method.minRealm} 以上境界`;
    }
    if (method.cost) {
        return method.id === 'teleport' ? '灵石不足' : '铜钱不足';
    }
    return '资源不足';
}

// ============ 开始战斗 ============
function startTravelBattleFallback(type) {
    // 优先使用 app 全局入口（含灵兽协攻、类型映射）
    if (typeof window.globalStartBattle === 'function') {
        return window.globalStartBattle(type);
    }
    if (!window.Battle || !window.Entity || !window.currentCharData) {
        if (window.showMessage) window.showMessage('战斗系统未就绪', 'error');
        return null;
    }
    var cd = window.currentCharData;
    var ma = cd.mainAttributes || {};
    var level = cd.level || cd.layer || 1;
    var enemyType = (type === 'beast' || type === 'beast_tide') ? 'beast' : 'enemy';
    var playerEntity = new window.Entity({
        name: cd.name || '玩家',
        level: level,
        attrs: {
            strength: ma['力量'] || cd.strength || 10,
            dexterity: ma['灵巧'] || cd.dexterity || 10,
            intelligence: ma['智力'] || cd.intelligence || 10,
            willpower: ma['意志'] || cd.willpower || 10,
            constitution: ma['体质'] || cd.constitution || 10,
            meridian: ma['经脉'] || cd.meridian || 10
        }
    }, 'player');
    var enemyData = window.generateRandomEnemy(level, enemyType);
    if (type === 'bandits' || type === 'bandit') enemyData.name = '山贼';
    var enemy = new window.Entity(enemyData, enemyType);
    var battle = new window.Battle(playerEntity, enemy);
    window.currentBattle = battle;
    if (window.showBattleUI) window.showBattleUI(battle);
    return battle;
}
window.startTravelBattleFallback = startTravelBattleFallback;


// ============ 山贼巢穴后续（由 app.js 完整实现，此处为占位） ============
function unlockBanditDenQuest() {
    if (typeof window.setFlag === 'function') {
        window.setFlag('know_bandit_den');
        window.setFlag('quest_bandit_den_available');
    }
}
function openBanditDen() {
    if (typeof window.startBattle === 'function') {
        window.startBattle('bandits');
    }
    if (window.showMessage) window.showMessage('你杀入黑风寨！', 'warning');
}

if (window.GameScheduler && typeof window.GameScheduler.registerHandler === 'function') {
    window.GameScheduler.registerHandler('travel:complete', function(payload) {
        if (!travelState.isTraveling) return true;
        completeTravel(Number(payload && payload.risk) || 0.1);
        return true;
    });
}

if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
    window.StateRegistry.register('travelRuntime', {
        version: 1,
        export: function() {
            return { travelState: Object.assign({}, travelState), unlockedTeleports: Array.from(unlockedTeleports) };
        },
        import: function(data) {
            data = data || {};
            Object.assign(travelState, data.travelState || {});
            unlockedTeleports.clear();
            (data.unlockedTeleports || []).forEach(function(x) { unlockedTeleports.add(x); });
        },
        reset: function() {
            Object.assign(travelState, { isTraveling: false, fromCity: null, toCity: null, method: 'walk', startGameMinute: null, arrivalGameMinute: null });
            unlockedTeleports.clear();
        }
    });
}

// ============ 导出到全局 ============
window.travelSystem = {
    initTravelSystem,
    startTravel,
    showTravelMethodSelect,
    completeTravel,
    triggerTravelEvent,
    triggerEventAction,
    unlockBanditDenQuest,
    openBanditDen,
    TRAVEL_METHODS,
    travelEvents,
    travelState,
    unlockedTeleports
};

// 自动初始化
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        initTravelSystem();
    });
}
