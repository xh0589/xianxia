/**
 * reputation-system.js - 城市声望系统 v1.0
 * 每个城市独立声望，影响价格、任务、隐藏内容
 */

// ============ 声望等级 ============
const REPUTATION_LEVELS = [
    { name: '陌路人', min: 0, discount: 0, title: '无名之辈', color: 'text-gray-400' },
    { name: '熟面孔', min: 500, discount: 0.03, title: '常客', color: 'text-green-400' },
    { name: '受欢迎', min: 1500, discount: 0.07, title: '贵客', color: 'text-blue-400' },
    { name: '有名望', min: 3000, discount: 0.12, title: '名士', color: 'text-purple-400' },
    { name: '德高望重', min: 6000, discount: 0.18, title: '贤达', color: 'text-yellow-400' },
    { name: '万人敬仰', min: 10000, discount: 0.25, title: '传奇', color: 'text-red-400' }
];

// 功能解锁规则：城市声望是 0-10000 的独立数值。
// 注意：角色“名气 fame”与城市声望不是同一系统。
const REPUTATION_FEATURE_LEVELS = Object.freeze({
    hidden_shop: 1,
    special_quests: 2,
    secret_arts: 3,
    special_permit: 4,
    hidden_dungeon: 5
});

// ============ 声望数据 ============
// 保持对象引用稳定，避免 window.cityReputation 指向旧对象。
let cityReputation = {}; // { cityName: { value: 0, flags: [], unlockedFeatures: [] } }

function normalizeReputationEntry(entry) {
    entry = entry && typeof entry === 'object' ? entry : {};
    entry.value = Math.max(0, Math.min(10000, Number(entry.value) || 0));
    entry.flags = Array.isArray(entry.flags) ? entry.flags : [];
    entry.unlockedFeatures = Array.isArray(entry.unlockedFeatures) ? entry.unlockedFeatures : [];
    if (entry.specialQuests != null && !Array.isArray(entry.specialQuests)) entry.specialQuests = [];
    return entry;
}

function replaceReputationState(nextState) {
    Object.keys(cityReputation).forEach(function(key) { delete cityReputation[key]; });
    if (nextState && typeof nextState === 'object') {
        Object.keys(nextState).forEach(function(city) {
            cityReputation[city] = normalizeReputationEntry(nextState[city]);
        });
    }
}

// ============ 初始化 ============
function initReputationSystem() {
    const saved = localStorage.getItem('xianxia_reputation');
    if (saved) {
        try {
            replaceReputationState(JSON.parse(saved));
        } catch (e) {
            console.error('加载声望数据失败:', e);
            replaceReputationState({});
        }
    }
    
    // 确保所有城市都有声望数据
    const allCities = getAllCityNames();
    allCities.forEach(city => {
        if (!cityReputation[city]) {
            cityReputation[city] = normalizeReputationEntry({ value: 0, flags: [], unlockedFeatures: [] });
        }
    });
    
    if (window.gameLog) {
        window.gameLog.add('城市声望系统已初始化', 'info');
    }
}

// 获取所有城市名称
function getAllCityNames() {
    const names = [];
    for (const [region, data] of Object.entries(window.mapData || {})) {
        if (data.cities) {
            names.push(...data.cities);
        }
    }
    return names;
}

// ============ 核心操作 ============

// 增加城市声望
function addReputation(cityName, amount) {
    if (!cityName) return 0;
    if (!cityReputation[cityName]) {
        cityReputation[cityName] = normalizeReputationEntry({ value: 0, flags: [], unlockedFeatures: [] });
    }

    const oldLevel = getReputationLevelIndex(cityName);
    cityReputation[cityName].value = Math.max(0, Math.min(10000, (cityReputation[cityName].value || 0) + (Number(amount) || 0)));
    const newLevel = getReputationLevelIndex(cityName);

    if (newLevel > oldLevel) {
        const level = REPUTATION_LEVELS[newLevel];
        const msg = `在【${cityName}】的声望提升至【${level.name}】！获得称号：${level.title}`;
        if (window.showMessage) window.showMessage(msg, 'success');
        else console.log(msg);
    }

    // 每次都同步一次：调试/导入直接改数值时也不会出现"数值够了但功能没解锁"。
    syncUnlockedFeatures(cityName, { notify: newLevel > oldLevel });
    saveReputation();
    // F-1.2 重构：补全 reputation 事件 emit。quest-system.js 事件桥监听此事件推进 reputation objective
    if (window.EventBus && typeof window.EventBus.emit === 'function') {
        try { window.EventBus.emit('reputation:changed', { cityName: cityName, amount: Number(amount) || 0, total: cityReputation[cityName].value }); } catch (e) {}
    }
    return cityReputation[cityName].value;
}

// 直接设置城市声望（调试、导入和脚本统一走这个入口）。
function setReputation(cityName, value, options) {
    if (!cityName) return 0;
    options = options || {};
    if (!cityReputation[cityName]) cityReputation[cityName] = normalizeReputationEntry({});
    const oldLevel = getReputationLevelIndex(cityName);
    cityReputation[cityName].value = Math.max(0, Math.min(10000, Number(value) || 0));
    const newLevel = getReputationLevelIndex(cityName);
    syncUnlockedFeatures(cityName, { notify: options.notify === true && newLevel > oldLevel });
    if (options.save !== false) saveReputation();
    return cityReputation[cityName].value;
}

// 减少城市声望
function reduceReputation(cityName, amount) {
    return addReputation(cityName, -amount);
}

// 获取声望等级索引
function getReputationLevelIndex(cityName) {
    const rep = cityReputation[cityName]?.value || 0;
    let level = 0;
    for (let i = REPUTATION_LEVELS.length - 1; i >= 0; i--) {
        if (rep >= REPUTATION_LEVELS[i].min) {
            level = i;
            break;
        }
    }
    return level;
}

// 获取声望等级
function getReputationLevel(cityName) {
    const idx = getReputationLevelIndex(cityName);
    return REPUTATION_LEVELS[idx];
}

// 获取声望值
function getReputationValue(cityName) {
    return cityReputation[cityName]?.value || 0;
}

// 获取折扣
function getReputationDiscount(cityName) {
    return getReputationLevel(cityName).discount || 0;
}

// 获取称号
function getReputationTitle(cityName) {
    return getReputationLevel(cityName).title || '无名之辈';
}

// ============ 解锁系统 ============

// 检查解锁内容
function syncUnlockedFeatures(cityName, options) {
    options = options || {};
    const rep = cityReputation[cityName];
    if (!rep) return [];
    normalizeReputationEntry(rep);
    const level = getReputationLevelIndex(cityName);
    const labels = {
        hidden_shop: '隐藏商店',
        special_quests: '专属任务',
        secret_arts: '秘传功法',
        special_permit: '特殊许可',
        hidden_dungeon: '隐藏地宫'
    };
    const unlocks = [];
    Object.keys(REPUTATION_FEATURE_LEVELS).forEach(function(feature) {
        if (level >= REPUTATION_FEATURE_LEVELS[feature] && !rep.unlockedFeatures.includes(feature)) {
            rep.unlockedFeatures.push(feature);
            unlocks.push(labels[feature] || feature);
        }
    });
    if (options.notify && unlocks.length > 0 && window.showMessage) {
        window.showMessage(`在【${cityName}】解锁了：${unlocks.join('、')}`, 'info');
    }
    return unlocks;
}

// 兼容旧调用名。
function checkUnlockedFeatures(cityName, level) {
    return syncUnlockedFeatures(cityName, { notify: true });
}

function hasGlobalSpecialPermit() {
    return !!(window.currentCharData && window.currentCharData.flags && window.currentCharData.flags.special_permit);
}

// 获取已解锁内容。特殊许可一旦正式激活，视作角色级通行证。
function getUnlockedFeatures(cityName) {
    if (!cityName || !cityReputation[cityName]) return hasGlobalSpecialPermit() ? ['special_permit'] : [];
    syncUnlockedFeatures(cityName, { notify: false });
    const features = cityReputation[cityName].unlockedFeatures.slice();
    if (hasGlobalSpecialPermit() && !features.includes('special_permit')) features.push('special_permit');
    return features;
}

// 检查特定功能是否解锁。对所有城市功能按当前数值动态推导，避免缓存标记过期。
function hasUnlockedFeature(cityName, feature) {
    if (feature === 'special_permit' && hasGlobalSpecialPermit()) return true;
    if (!cityName || !cityReputation[cityName]) return false;
    const requiredLevel = REPUTATION_FEATURE_LEVELS[feature];
    if (requiredLevel != null && getReputationLevelIndex(cityName) >= requiredLevel) {
        if (!cityReputation[cityName].unlockedFeatures.includes(feature)) {
            cityReputation[cityName].unlockedFeatures.push(feature);
            saveReputation();
        }
        return true;
    }
    return cityReputation[cityName].unlockedFeatures.includes(feature);
}

function getRoyalAuctionAccess(cityName) {
    cityName = cityName || (typeof getCurrentCityName === 'function' ? getCurrentCityName() : '');
    const value = getReputationValue(cityName);
    const levelIndex = getReputationLevelIndex(cityName);
    const localPermitFlag = !!(window.currentCharData && window.currentCharData.flags && window.currentCharData.flags['permit_' + cityName]);
    const globalPermit = hasGlobalSpecialPermit();
    return {
        allowed: levelIndex >= 3 || localPermitFlag || globalPermit,
        cityName: cityName,
        reputation: value,
        levelIndex: levelIndex,
        requiredReputation: REPUTATION_LEVELS[3].min,
        hasPermit: localPermitFlag || globalPermit
    };
}

// ============ 声望获取途径 ============

// 完成任务增加声望
function addReputationFromQuest(cityName, questDifficulty) {
    const base = 20 + questDifficulty * 10;
    const bonus = window.getCityBonus?.(cityName)?.reputation_gain || 1.0;
    return addReputation(cityName, Math.floor(base * bonus));
}

// 交易增加声望
function addReputationFromTrade(cityName, amount) {
    const gain = Math.floor(amount / 10);
    if (gain > 0) {
        return addReputation(cityName, Math.min(gain, 50));
    }
    return 0;
}

// 捐赠增加声望
function addReputationFromDonation(cityName, spiritStones) {
    if (spiritStones < 100) {
        if (window.showMessage) window.showMessage('捐赠至少需要100灵石', 'warning');
        return 0;
    }
    
    // 扣除灵石
    if (window.inventory) {
        if (window.inventory.currency.spiritStones < spiritStones) {
            if (window.showMessage) window.showMessage('灵石不足', 'error');
            return 0;
        }
        window.inventory.currency.spiritStones -= spiritStones;
        if (window.updateCurrencyUI) window.updateCurrencyUI();
    }
    
    const gain = Math.floor(spiritStones / 20);
    const result = addReputation(cityName, gain);
    if (window.showMessage) {
        window.showMessage(`捐赠 ${spiritStones} 灵石，声望 +${gain}`, 'info');
    }
    return result;
}

// ============ 存档 ============
function saveReputation() {
    try {
        localStorage.setItem('xianxia_reputation', JSON.stringify(cityReputation));
    } catch (e) {
        console.error('保存声望数据失败:', e);
    }
}

function loadReputation() {
    initReputationSystem();
}

// ============ 导出 ============
window.cityReputation = cityReputation;
window.REPUTATION_LEVELS = REPUTATION_LEVELS;
window.initReputationSystem = initReputationSystem;
window.addReputation = addReputation;
window.reduceReputation = reduceReputation;
window.getReputationLevel = getReputationLevel;
window.getReputationLevelIndex = getReputationLevelIndex;
window.getReputationValue = getReputationValue;
window.getReputationDiscount = getReputationDiscount;
window.getReputationTitle = getReputationTitle;
window.getUnlockedFeatures = getUnlockedFeatures;
window.hasUnlockedFeature = hasUnlockedFeature;
window.addReputationFromQuest = addReputationFromQuest;
window.addReputationFromTrade = addReputationFromTrade;
window.addReputationFromDonation = addReputationFromDonation;
window.saveReputation = saveReputation;
window.loadReputation = loadReputation;
window.setReputation = setReputation;
window.syncUnlockedFeatures = syncUnlockedFeatures;
window.hasGlobalSpecialPermit = hasGlobalSpecialPermit;
window.getRoyalAuctionAccess = getRoyalAuctionAccess;
window.REPUTATION_FEATURE_LEVELS = REPUTATION_FEATURE_LEVELS;


// ============ v7.1 P1-1 解锁内容落地 ============
var HIDDEN_SHOP_ITEMS = [
    { id: 'pill_foundation', name: '筑基丹', basePrice: 450, icon: '💊', desc: '隐藏货源·筑基辅助' },
    { id: 'spec_transfer_stone', name: '转移石', basePrice: 420, icon: '🔮', desc: '强化转移' },
    { id: 'spec_enhance_stone', name: '强化石', basePrice: 60, icon: '🪨', desc: '强化辅助' },
    { id: 'mat_meteorite', name: '陨铁', basePrice: 180, icon: '⛏️', desc: '稀有矿材' },
    { id: 'art_wind_sword', name: '清风剑法', basePrice: 280, icon: '⚔️', desc: '秘传剑法残卷' },
    { id: 'pill_body_foundation', name: '培元丹', basePrice: 160, icon: '💊', desc: '体质永久+2' },
    { id: 'wpn_dark_iron_sword', name: '玄铁剑', basePrice: 180, icon: '⚔️', desc: '黑市精兵' },
    { id: 'spec_longevity_pill', name: '延寿丹', basePrice: 1800, icon: '💊', desc: '延寿五十年' }
];

var SECRET_ARTS_BY_CITY = {
    'default': [
        { id: 'art_hun_yuan', name: '混元功', cost: 300, desc: '混元心法残篇' },
        { id: 'art_lingbo', name: '凌波微步', cost: 500, desc: '轻功秘传' }
    ]
};

var CITY_SPECIAL_QUEST_TEMPLATES = [
    { idSuffix: 'rep_collect', title: '城中悬赏·收集', desc: '为城主收集物资以安民心', type: 'collect', difficulty: 2,
      rewards: { exp: 80, spiritStones: 40, copper: 20 } },
    { idSuffix: 'rep_patrol', title: '城中悬赏·巡城', desc: '协助巡防，震慑宵小', type: 'patrol', difficulty: 1,
      rewards: { exp: 50, spiritStones: 25 } },
    { idSuffix: 'rep_elite', title: '城中悬赏·除害', desc: '清除城外作乱妖兽', type: 'combat', difficulty: 3,
      rewards: { exp: 120, spiritStones: 60, items: [{ itemId: 'mat_demon_beast_core', count: 1 }] } }
];

function getCurrentCityName() {
    if (window.locationSystem && typeof window.locationSystem.getCurrentLocation === 'function') {
        return window.locationSystem.getCurrentLocation() || '';
    }
    return (window.currentCharData && window.currentCharData.location) || window.currentLocation || '';
}

function openHiddenShop(cityName) {
    cityName = cityName || getCurrentCityName();
    if (!cityName) { if (window.showMessage) window.showMessage('请先进入城市', 'warning'); return false; }
    if (!hasUnlockedFeature(cityName, 'hidden_shop')) {
        if (window.showMessage) window.showMessage('声望不足：需达到「熟面孔」解锁隐藏商店', 'warning');
        return false;
    }
    var old = document.getElementById('hidden-shop-modal');
    if (old) old.remove();
    var rows = HIDDEN_SHOP_ITEMS.map(function(it) {
        var price = it.basePrice;
        var disc = getReputationDiscount(cityName) || 0;
        price = Math.max(1, Math.round(price * (1 - disc)));
        return '<div class="bg-gray-700/40 p-2 rounded mb-2 flex items-center gap-2 border border-purple-800/50">' +
            '<span class="text-xl">' + (it.icon || '📦') + '</span>' +
            '<div class="flex-1"><p class="text-sm text-purple-300 font-bold">' + it.name + '</p>' +
            '<p class="text-xs text-gray-500">' + (it.desc || '') + '</p></div>' +
            '<span class="text-xs text-cyan-400 mr-2">' + price + '灵石</span>' +
            '<button onclick="window._buyHiddenShopItem(\'' + it.id + '\',' + price + ',\'' + cityName.replace(/'/g, '') + '\')" ' +
            'class="text-xs bg-purple-600 hover:bg-purple-500 text-white px-2 py-1 rounded">购买</button></div>';
    }).join('');
    var modal = document.createElement('div');
    modal.id = 'hidden-shop-modal';
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
    modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
    modal.innerHTML = '<div class="bg-gray-800 border-2 border-purple-500 rounded-xl p-5 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">' +
        '<div class="flex justify-between mb-3"><h3 class="text-lg font-bold text-purple-400">🏪 ' + cityName + ' · 隐藏商店</h3>' +
        '<button onclick="this.closest(\'.fixed\').remove()" class="text-gray-400 text-2xl">&times;</button></div>' +
        '<p class="text-xs text-gray-500 mb-2">声望专属货源（已享折扣）</p>' + rows + '</div>';
    document.body.appendChild(modal);
    return true;
}

function _buyHiddenShopItem(itemId, price, cityName) {
    if (!window.inventory || !window.inventory.currency) return;
    if ((window.inventory.currency.spiritStones || 0) < price) {
        if (window.showMessage) window.showMessage('灵石不足', 'error');
        return;
    }
    window.inventory.currency.spiritStones -= price;
    if (typeof window.addItem === 'function') window.addItem(itemId, 1);
    if (window.updateCurrencyUI) window.updateCurrencyUI();
    if (typeof addReputationFromTrade === 'function') addReputationFromTrade(cityName, price);
    if (window.showMessage) window.showMessage('购得隐藏商品', 'success');
}

function getOrCreateSpecialQuests(cityName) {
    cityName = cityName || getCurrentCityName();
    if (!hasUnlockedFeature(cityName, 'special_quests')) return [];
    if (!cityReputation[cityName]) return [];
    cityReputation[cityName].specialQuests = cityReputation[cityName].specialQuests || [];
    var list = cityReputation[cityName].specialQuests;
    // 若为空则生成
    if (list.length === 0) {
        CITY_SPECIAL_QUEST_TEMPLATES.forEach(function(tpl, idx) {
            list.push({
                id: 'cityrep_' + cityName + '_' + tpl.idSuffix,
                title: '【' + cityName + '】' + tpl.title,
                description: tpl.desc,
                city: cityName,
                difficulty: tpl.difficulty,
                rewards: JSON.parse(JSON.stringify(tpl.rewards)),
                accepted: false,
                completed: false,
                turnedIn: false,
                objectives: [{ type: 'talk', target: cityName, count: 1, completed: false }]
            });
        });
        saveReputation();
    }
    return list;
}

function openSpecialQuests(cityName) {
    cityName = cityName || getCurrentCityName();
    if (!hasUnlockedFeature(cityName, 'special_quests')) {
        if (window.showMessage) window.showMessage('声望不足：需「受欢迎」解锁专属任务', 'warning');
        return false;
    }
    var quests = getOrCreateSpecialQuests(cityName);
    var old = document.getElementById('special-quest-modal');
    if (old) old.remove();
    var rows = quests.map(function(q, i) {
        var st = q.turnedIn ? '已交付' : (q.completed ? '可交付' : (q.accepted ? '进行中' : '可接取'));
        var btn = '';
        if (!q.accepted && !q.turnedIn) {
            btn = '<button onclick="window._acceptCityRepQuest(' + i + ',\'' + cityName.replace(/'/g, '') + '\')" class="text-xs bg-blue-600 text-white px-2 py-1 rounded">接取</button>';
        } else if (q.accepted && !q.completed) {
            btn = '<button onclick="window._completeCityRepQuest(' + i + ',\'' + cityName.replace(/'/g, '') + '\')" class="text-xs bg-yellow-600 text-white px-2 py-1 rounded">完成巡城</button>';
        } else if (q.completed && !q.turnedIn) {
            btn = '<button onclick="window._turnInCityRepQuest(' + i + ',\'' + cityName.replace(/'/g, '') + '\')" class="text-xs bg-green-600 text-white px-2 py-1 rounded">交付</button>';
        }
        return '<div class="bg-gray-700/40 p-3 rounded mb-2 border border-gray-600">' +
            '<p class="font-bold text-blue-300 text-sm">' + q.title + ' <span class="text-xs text-gray-500">' + st + '</span></p>' +
            '<p class="text-xs text-gray-400">' + q.description + '</p>' +
            '<div class="mt-2">' + btn + '</div></div>';
    }).join('');
    var modal = document.createElement('div');
    modal.id = 'special-quest-modal';
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
    modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
    modal.innerHTML = '<div class="bg-gray-800 border-2 border-blue-500 rounded-xl p-5 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">' +
        '<div class="flex justify-between mb-3"><h3 class="text-lg font-bold text-blue-400">📋 专属任务</h3>' +
        '<button onclick="this.closest(\'.fixed\').remove()" class="text-gray-400 text-2xl">&times;</button></div>' + rows + '</div>';
    document.body.appendChild(modal);
    return true;
}

function _acceptCityRepQuest(index, cityName) {
    var list = getOrCreateSpecialQuests(cityName);
    var q = list[index];
    if (!q || q.accepted) return;
    q.accepted = true;
    saveReputation();
    if (window.showMessage) window.showMessage('接取：' + q.title, 'success');
    openSpecialQuests(cityName);
}

function _completeCityRepQuest(index, cityName) {
    var list = getOrCreateSpecialQuests(cityName);
    var q = list[index];
    if (!q || !q.accepted) return;
    q.completed = true;
    if (q.objectives) q.objectives.forEach(function(o) { o.completed = true; });
    saveReputation();
    if (window.timeSystem && window.timeSystem.advanceTime) window.timeSystem.advanceTime(30, '城中任务');
    if (window.showMessage) window.showMessage('任务目标完成，可交付', 'success');
    openSpecialQuests(cityName);
}

function _turnInCityRepQuest(index, cityName) {
    var list = getOrCreateSpecialQuests(cityName);
    var q = list[index];
    if (!q || !q.completed || q.turnedIn) return;
    q.turnedIn = true;
    q.accepted = false;
    // 发奖
    var r = q.rewards || {};
    if (r.exp && window.currentCharData) window.currentCharData.tempering = (window.currentCharData.tempering || 0) + r.exp;
    if (r.spiritStones && window.inventory) window.inventory.currency.spiritStones = (window.inventory.currency.spiritStones || 0) + r.spiritStones;
    if (r.gold && window.inventory) window.inventory.currency.copper = (window.inventory.currency.copper || 0) + r.gold;
    if (r.items && typeof window.addItem === 'function') {
        r.items.forEach(function(it) { window.addItem(it.itemId || it.id, it.count || 1); });
    }
    addReputationFromQuest(cityName, q.difficulty || 1);
    if (window.updateCurrencyUI) window.updateCurrencyUI();
    saveReputation();
    if (window.showMessage) window.showMessage('交付成功！', 'success');
    if (window.showEffect) window.showEffect('quest_done');
    openSpecialQuests(cityName);
}

function openSecretArtsShop(cityName) {
    cityName = cityName || getCurrentCityName();
    if (!hasUnlockedFeature(cityName, 'secret_arts')) {
        if (window.showMessage) window.showMessage('声望不足：需「有名望」解锁秘传功法', 'warning');
        return false;
    }
    var arts = SECRET_ARTS_BY_CITY[cityName] || SECRET_ARTS_BY_CITY['default'];
    var old = document.getElementById('secret-arts-modal');
    if (old) old.remove();
    var rows = arts.map(function(a) {
        return '<div class="bg-gray-700/40 p-3 rounded mb-2 flex justify-between items-center">' +
            '<div><p class="font-bold text-yellow-300">' + a.name + '</p><p class="text-xs text-gray-400">' + a.desc + '</p></div>' +
            '<button onclick="window._buySecretArt(\'' + a.id + '\',' + a.cost + ',\'' + cityName.replace(/'/g, '') + '\')" ' +
            'class="text-xs bg-yellow-600 text-white px-2 py-1 rounded">' + a.cost + '灵石 学习</button></div>';
    }).join('');
    var modal = document.createElement('div');
    modal.id = 'secret-arts-modal';
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
    modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
    modal.innerHTML = '<div class="bg-gray-800 border-2 border-yellow-500 rounded-xl p-5 max-w-md w-full mx-4">' +
        '<div class="flex justify-between mb-3"><h3 class="text-lg font-bold text-yellow-400">📖 秘传功法</h3>' +
        '<button onclick="this.closest(\'.fixed\').remove()" class="text-gray-400 text-2xl">&times;</button></div>' + rows + '</div>';
    document.body.appendChild(modal);
    return true;
}

function _buySecretArt(artId, cost, cityName) {
    if (!window.inventory || (window.inventory.currency.spiritStones || 0) < cost) {
        if (window.showMessage) window.showMessage('灵石不足', 'error');
        return;
    }
    window.inventory.currency.spiritStones -= cost;
    if (typeof window.addItem === 'function') window.addItem(artId, 1);
    addReputationFromTrade(cityName, cost);
    if (window.updateCurrencyUI) window.updateCurrencyUI();
    if (window.showMessage) window.showMessage('习得秘传残卷！', 'success');
}

function useSpecialPermit(cityName) {
    cityName = cityName || getCurrentCityName();
    if (!cityName) {
        if (window.showMessage) window.showMessage('请先进入城市再申请/出示特殊许可', 'warning');
        return false;
    }
    if (hasGlobalSpecialPermit()) {
        if (window.showMessage) window.showMessage('📜 你已持有特殊许可，可在认可该许可的高级场所通行', 'success');
        return true;
    }
    if (!hasUnlockedFeature(cityName, 'special_permit')) {
        var current = getReputationValue(cityName);
        var need = REPUTATION_LEVELS[4].min;
        if (window.showMessage) window.showMessage('当前城市声望不足：' + current + '/' + need + '。需达到「德高望重」后取得特殊许可（角色名气不计入城市声望）', 'warning');
        return false;
    }
    if (window.currentCharData) {
        window.currentCharData.flags = window.currentCharData.flags || {};
        // 特殊许可是角色级凭证；保留签发城市，兼容旧的城市 permit 标记。
        window.currentCharData.flags.special_permit = true;
        window.currentCharData.flags.special_permit_source_city = cityName;
        window.currentCharData.flags['permit_' + cityName] = true;
    }
    if (window.showMessage) window.showMessage('📜 已取得特殊许可：今后可作为高级场所通行凭证', 'success');
    return true;
}

function enterHiddenDungeon(cityName) {
    cityName = cityName || getCurrentCityName();
    if (!hasUnlockedFeature(cityName, 'hidden_dungeon')) {
        if (window.showMessage) window.showMessage('声望不足：需「万人敬仰」解锁隐藏地宫', 'warning');
        return false;
    }
    if (window.showMessage) window.showMessage('🕳️ 进入【' + cityName + '】隐藏地宫……', 'warning');
    if (typeof window.startBattle === 'function') {
        window.startBattle('dungeon_guard');
    } else {
        // 简化奖励
        if (window.currentCharData) window.currentCharData.tempering = (window.currentCharData.tempering || 0) + 200;
        if (typeof window.addItem === 'function') {
            window.addItem('mat_dragon_crystal', 1);
            if (Math.random() < 0.3) window.addItem('spec_transfer_stone', 1);
        }
        if (window.showMessage) window.showMessage('地宫探索有所收获！', 'success');
    }
    addReputation(cityName, 20);
    return true;
}

function getReputationPanelHtml(cityName) {
    cityName = cityName || getCurrentCityName();
    if (!cityName) return '<p class="text-gray-500 text-sm">请先进入城市查看声望</p>';
    var level = getReputationLevel(cityName);
    var val = getReputationValue(cityName);
    var feats = getUnlockedFeatures(cityName);
    var html = '<div class="bg-gray-700/30 p-3 rounded border border-gray-600 mb-2">' +
        '<p class="font-bold text-white">' + cityName + '</p>' +
        '<p class="text-sm ' + (level.color || 'text-gray-300') + '">' + level.name + ' · ' + level.title + '（' + val + '）</p>' +
        '<p class="text-xs text-gray-400">商店折扣：' + Math.floor((level.discount || 0) * 100) + '%</p>' +
        '<p class="text-xs text-gray-500 mt-1">城市声望范围 0-10000；角色“名气”是另一项属性</p>' +
        '<p class="text-xs text-gray-500 mt-1">已解锁：' + (feats.length ? feats.join(', ') : '无') + '</p></div>';
    html += '<div class="flex flex-wrap gap-2">' +
        '<button onclick="openHiddenShop()" class="text-xs bg-purple-700 text-white px-2 py-1 rounded">隐藏商店</button>' +
        '<button onclick="openSpecialQuests()" class="text-xs bg-blue-700 text-white px-2 py-1 rounded">专属任务</button>' +
        '<button onclick="openSecretArtsShop()" class="text-xs bg-yellow-700 text-white px-2 py-1 rounded">秘传功法</button>' +
        '<button onclick="useSpecialPermit()" class="text-xs bg-gray-600 text-white px-2 py-1 rounded">特殊许可</button>' +
        '<button onclick="enterHiddenDungeon()" class="text-xs bg-red-800 text-white px-2 py-1 rounded">隐藏地宫</button>' +
        '<button onclick="addReputationFromDonation(getCurrentCityName(), 100)" class="text-xs bg-green-800 text-white px-2 py-1 rounded">捐赠100</button>' +
        '</div>';
    return html;
}

window.HIDDEN_SHOP_ITEMS = HIDDEN_SHOP_ITEMS;
window.openHiddenShop = openHiddenShop;
window.openSpecialQuests = openSpecialQuests;
window.openSecretArtsShop = openSecretArtsShop;
window.useSpecialPermit = useSpecialPermit;
window.enterHiddenDungeon = enterHiddenDungeon;
window.getReputationPanelHtml = getReputationPanelHtml;
window.getCurrentCityName = getCurrentCityName;
window.getOrCreateSpecialQuests = getOrCreateSpecialQuests;
window._buyHiddenShopItem = _buyHiddenShopItem;
window._acceptCityRepQuest = _acceptCityRepQuest;
window._completeCityRepQuest = _completeCityRepQuest;
window._turnInCityRepQuest = _turnInCityRepQuest;
window._buySecretArt = _buySecretArt;
