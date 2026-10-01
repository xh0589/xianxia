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

// 同一张卡里的数字要一个写法：名下印「10,000」而门槛印「10000」是两张嘴
function repNum(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

// 五张牌的名字与去处：解锁播报和城情卡都读这两张表，别在 UI 里再抄一份名字
const REPUTATION_FEATURE_LABELS = Object.freeze({
    hidden_shop: '隐藏商店',
    special_quests: '专属任务',
    secret_arts: '秘传功法',
    special_permit: '特殊许可',
    hidden_dungeon: '隐藏地宫'
});
const REPUTATION_FEATURE_ENTRIES = Object.freeze({
    hidden_shop: 'openHiddenShop()',
    special_quests: 'openSpecialQuests()',
    secret_arts: 'openSecretArtsShop()',
    special_permit: 'useSpecialPermit()',
    hidden_dungeon: 'enterHiddenDungeon()'
});

// ============ 声望数据 ============
// 保持对象引用稳定，避免 window.cityReputation 指向旧对象。
let cityReputation = {}; // { cityName: { value: 0, flags: [], unlockedFeatures: [] } }

// 第九十五波·NEW-32：城名键归一化（去空格比对——与 market-dynamic.js「户口册里写『帝都 · 长安』，
// 玩家身上写『帝都·长安』」同一口径锚点）。mapData/里程表/HTML 标题用带空格拼写，
// charData.location 用无空格拼写——此前两种拼写各立一本互不相认的声望账。
// 本文件所有读写声望账的入口一律先过 repKey() 再落键。
function repKey(c) { return String(c || '').replace(/\s+/g, ''); }

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

    // 第九十五波·NEW-32：一次性合并迁移——旧档可能同时存着「帝都 · 长安」与「帝都·长安」两本账。
    // 把带空格键的 value/flags/unlockedFeatures/specialQuests 并入去空格键后删除原键。
    // value 取两者较大而非求和：两本账是同一城声望被不同入口重复记账，不是两份独立可叠加的声望，
    // 求和会凭空放大（玩家可见的一直是无空格那本，取较大保证可见账不倒退、也不白得）。
    var _repMigrated = false;
    Object.keys(cityReputation).forEach(function (rawKey) {
        var nk = repKey(rawKey);
        if (!nk || nk === rawKey) return;   // 本就是归一键
        var src = cityReputation[rawKey] || {};
        var dst = cityReputation[nk] || (cityReputation[nk] = normalizeReputationEntry({}));
        normalizeReputationEntry(dst);
        dst.value = Math.max(0, Math.min(10000, Math.max(Number(dst.value) || 0, Number(src.value) || 0)));
        (Array.isArray(src.flags) ? src.flags : []).forEach(function (f) { if (dst.flags.indexOf(f) < 0) dst.flags.push(f); });
        (Array.isArray(src.unlockedFeatures) ? src.unlockedFeatures : []).forEach(function (f) { if (dst.unlockedFeatures.indexOf(f) < 0) dst.unlockedFeatures.push(f); });
        if (Array.isArray(src.specialQuests) && src.specialQuests.length) {
            if (!Array.isArray(dst.specialQuests)) dst.specialQuests = [];
            var _qIds = {};
            dst.specialQuests.forEach(function (q) { if (q && q.id) _qIds[q.id] = true; });
            src.specialQuests.forEach(function (q) { if (q && q.id && !_qIds[q.id]) dst.specialQuests.push(q); });
        }
        delete cityReputation[rawKey];
        _repMigrated = true;
    });
    if (_repMigrated) saveReputation();

    // 确保所有城市都有声望数据（城市册里也有带空格的拼写，落键前先归一）
    const allCities = getAllCityNames();
    allCities.forEach(city => {
        const ck = repKey(city);
        if (!ck) return;
        if (!cityReputation[ck]) {
            cityReputation[ck] = normalizeReputationEntry({ value: 0, flags: [], unlockedFeatures: [] });
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
    // 第九十五波·NEW-32：落账前先归一城名（原始拼写留给事件桥的 cityName 字段）
    var rawCityName = cityName;
    cityName = repKey(cityName);
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
    // 第九十五波·NEW-32：事件附带 normalized（归一城名）——cityName 保留原拼写，任务 objective 两种口径都对得上
    if (window.EventBus && typeof window.EventBus.emit === 'function') {
        try { window.EventBus.emit('reputation:changed', { cityName: rawCityName, normalized: cityName, amount: Number(amount) || 0, total: cityReputation[cityName].value }); } catch (e) {}
    }
    return cityReputation[cityName].value;
}

// 直接设置城市声望（调试、导入和脚本统一走这个入口）。
function setReputation(cityName, value, options) {
    cityName = repKey(cityName);   // 第九十五波·NEW-32：一本账
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
    const rep = cityReputation[repKey(cityName)]?.value || 0;   // 第九十五波·NEW-32：归一取账
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
    return cityReputation[repKey(cityName)]?.value || 0;   // 第九十五波·NEW-32：归一取账
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
    cityName = repKey(cityName);   // 第九十五波·NEW-32：归一取账
    options = options || {};
    const rep = cityReputation[cityName];
    if (!rep) return [];
    normalizeReputationEntry(rep);
    const level = getReputationLevelIndex(cityName);
    const unlocks = [];
    Object.keys(REPUTATION_FEATURE_LEVELS).forEach(function(feature) {
        if (level >= REPUTATION_FEATURE_LEVELS[feature] && !rep.unlockedFeatures.includes(feature)) {
            rep.unlockedFeatures.push(feature);
            unlocks.push(REPUTATION_FEATURE_LABELS[feature] || feature);
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
    cityName = repKey(cityName);   // 第九十五波·NEW-32：归一取账
    if (!cityName || !cityReputation[cityName]) return hasGlobalSpecialPermit() ? ['special_permit'] : [];
    syncUnlockedFeatures(cityName, { notify: false });
    const features = cityReputation[cityName].unlockedFeatures.slice();
    if (hasGlobalSpecialPermit() && !features.includes('special_permit')) features.push('special_permit');
    return features;
}

// 检查特定功能是否解锁。对所有城市功能按当前数值动态推导，避免缓存标记过期。
function hasUnlockedFeature(cityName, feature) {
    if (feature === 'special_permit' && hasGlobalSpecialPermit()) return true;
    cityName = repKey(cityName);   // 第九十五波·NEW-32：归一取账
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
    cityName = repKey(cityName);   // 第九十五波·NEW-32：归一取账（permit_ 旗与 useSpecialPermit 同一拼写口径）
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

// 捐赠只有一条路：善堂的情景账（捐粮 50／捐药 30／大捐 200，各带功德与时辰）。
// 这里曾另有一个「按灵石数直接买声望」的小函数——同样花灵石，却不记业障、不费时辰、
// 不问捐什么，等于在善堂之外私开一本账。城情卡上那枚裸钮已撤，这条平行账一并删掉。

// ============ 存档 ============
function saveReputation() {
    try {
        if (window.saveToStorage) { if (!window.saveToStorage('xianxia_reputation', JSON.stringify(cityReputation))) throw new Error('xianxia_reputation' + ' 未落盘'); } else localStorage.setItem('xianxia_reputation', JSON.stringify(cityReputation));
    } catch (e) {
        console.error('[静默失败] js/reputation-system.js · 声望存档：各城声望没写进本地存储，读档后名声打回原形', e && e.message);
    }
}

function loadReputation() {
    initReputationSystem();
}

// ============ 导出 ============
window.cityReputation = cityReputation;
window.repKey = repKey;   // 第九十五波·NEW-32：城名归一口径公开可查（其它模块比对城名同用此法）
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
    // DES-72 副账收口（第一百二十七批）：先交货再收钱（与 js/building-effects.js 的 buy() 同一条柜台规矩）——旧写法扣了灵石、记了声望，货却没进囊
    var _购得 = (typeof window.addItem === 'function') ? (Number(window.addItem(itemId, 1)) || 0) : 1;
    var _购账 = (typeof window.addItem === 'function') ? (window.addItemFailReason || null) : null;   // DES-96：账当场抄，别回头读被别笔刷过的那条
    if (_购得 <= 0) {
        // DES-96：原先这里在原因账那句（自带「先腾个格子再来。」收尾）之后又裸接一句「腾个格子再来。」——同一屏说两遍
        if (window.showMessage) window.showMessage('货是好的，这一单先不做——' + ((typeof window.addItemFailTextFor === 'function' && window.addItemFailTextFor(_购账, ((window.itemById && window.itemById[itemId] ? window.itemById[itemId].name : itemId)))) || '这一件没能落进你的行囊。'), 'warning');
        return;
    }
    window.inventory.currency.spiritStones -= price;
    if (window.updateCurrencyUI) window.updateCurrencyUI();
    if (typeof addReputationFromTrade === 'function') addReputationFromTrade(cityName, price);
    if (window.showMessage) window.showMessage('购得隐藏商品', 'success');
}

function getOrCreateSpecialQuests(cityName) {
    cityName = cityName || getCurrentCityName();
    cityName = repKey(cityName);   // 第九十五波·NEW-32：任务 id 与账本按归一城名落键
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
    // 发奖
    var r = q.rewards || {};
    // DES-72＋DES-86（第一百三十批）：赏品先真落进囊里，才准结这一单——旧写法先把 turnedIn 烧了、
    //   又把 addItem 的返回值丢在地上，满包时赏件蒸发而任务永不再来，屏上还念「交付成功！」
    var 赏 = [];
    if (r.items && (typeof window.giveWithReceipt === 'function' || typeof window.addItem === 'function')) {
        r.items.forEach(function (it) {
            var id = it.itemId || it.id;
            var 要 = it.count || 1;
            if (!id) return;
            赏.push(typeof window.giveWithReceipt === 'function'
                ? window.giveWithReceipt(id, 要, { quiet: true })
                : { got: Number(window.addItem(id, 要)) || 0, count: 要, name: (window.itemById && window.itemById[id] && window.itemById[id].name) || id });
        });
        if (赏.reduce(function (n, x) { return n + x.got; }, 0) <= 0) {
            var 赏名 = 赏.map(function (x) { return x.name; }).join('、');
            if (window.showMessage) window.showMessage('📜 这一单的赏品（' + (赏名 || '赏件') + '）没能落进你的行囊：' + ((typeof window.addItemFailText === 'function' && window.addItemFailText(赏名 || '这一单的赏品')) || '这一件仍留在柜上。') + '单先不结，赏品还在柜上。再来一趟。', 'warning');
            return;
        }
    }
    q.turnedIn = true;
    q.accepted = false;
    if (r.exp && window.currentCharData) window.currentCharData.tempering = (window.currentCharData.tempering || 0) + r.exp;
    if (r.spiritStones && window.inventory) window.inventory.currency.spiritStones = (window.inventory.currency.spiritStones || 0) + r.spiritStones;
    if (r.gold && window.inventory) window.inventory.currency.copper = (window.inventory.currency.copper || 0) + r.gold;
    addReputationFromQuest(cityName, q.difficulty || 1);
    if (window.updateCurrencyUI) window.updateCurrencyUI();
    saveReputation();
    if (window.showMessage) {
        var 缺 = 赏.filter(function (x) { return x.got < x.count; });
        window.showMessage('交付成功！' + (赏.length ? '赏品入囊：' + 赏.map(function (x) { return x.name + '×' + x.got; }).join('、')
            + (缺.length ? '（另有 ' + 缺.map(function (x) { return x.name + '×' + (x.count - x.got); }).join('、') + ' 留在了柜上：' + ((typeof window.addItemReasonPhrase === 'function' && window.addItemReasonPhrase('这次的赏品')) || '没能带走') + '）' : '') : ''), 'success');
    }
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
    // DES-72 副账收口（第一百二十七批）：先交货再收钱——旧写法扣了灵石、记了声望，残卷却没进囊，还念「习得秘传残卷！」
    var _残卷收 = (typeof window.addItem === 'function') ? (Number(window.addItem(artId, 1)) || 0) : 1;
    if (_残卷收 <= 0) {
        if (window.showMessage) window.showMessage('残卷是拿到了，可' + ((typeof window.addItemFailText === 'function' && window.addItemFailText('这门残卷')) || '它没有跟你走。') + '师父又收了回去。', 'warning'); // DES-90（第一百三十九批）：门派秘传残卷是一次性内容，②形；原「回去理理行囊再来」违反 R2，改为只陈述已收回
        return;
    }
    window.inventory.currency.spiritStones -= cost;
    addReputationFromTrade(cityName, cost);
    if (window.updateCurrencyUI) window.updateCurrencyUI();
    if (window.showMessage) window.showMessage('习得秘传残卷！', 'success');
}

function useSpecialPermit(cityName) {
    cityName = cityName || getCurrentCityName();
    cityName = repKey(cityName);   // 第九十五波·NEW-32：permit_ 旗按归一城名落键（与 getRoyalAuctionAccess 同口径）
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
        // DES-72 两本账同收（第一百二十七批）：念的件数以行囊真收下为准——旧写法两件都丢返回值，满包也念「有所收获」
        var _地宫收 = 0, _地宫该 = 0;
        if (typeof window.addItem === 'function') {
            _地宫该 = 1; _地宫收 += Number(window.addItem('mat_dragon_crystal', 1)) || 0;
            if (Math.random() < 0.3) { _地宫该 += 1; _地宫收 += Number(window.addItem('spec_transfer_stone', 1)) || 0; }
        } else { _地宫收 = _地宫该 = 1; }
        if (window.showMessage) window.showMessage(_地宫收 > 0
            ? '地宫探索有所收获！' + (_地宫收 < _地宫该 ? '（另有 ' + (_地宫该 - _地宫收) + ' 件：' + ((typeof window.addItemReasonPhrase === 'function' && window.addItemReasonPhrase('石室里的东西')) || '这一件先还留在原处') + '，仍留在石室里）' : '') // DES-90（第一百三十九批）：地宫可再探，①形·从句支不带句号
            : '历练是磨出来了，可两件东西没能落进你的行囊——只好原样留在石室里：' + ((typeof window.addItemFailText === 'function' && window.addItemFailText('石室里的东西')) || '这一单先不做。'), _地宫收 >= _地宫该 ? 'success' : 'warning');
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
    var discountPct = Math.floor((level.discount || 0) * 100);
    var html = '<div class="bg-gray-700/30 p-3 rounded border border-gray-600 mb-2">' +
        '<p class="font-bold text-white">' + cityName + '</p>' +
        '<p class="text-sm ' + (level.color || 'text-gray-300') + '">' + level.name + ' · ' + level.title + '（' + repNum(val) + '）</p>' +
        '<p class="text-xs text-gray-400">' + (discountPct > 0 ? '铺子里肯让的脸面：' + discountPct + '%' : '铺子还没肯让一分') + '</p>' +
        '<p class="text-xs text-gray-500 mt-1">你在本城的名分，与江湖上的「名气」不是一回事。</p>' +
        '</div>';
    // 五张牌恒摆着，锁着的把「差什么」写在脸上（禁止设计 #2：锁就亮锁、写清楚为什么锁）。
    // 改前这五枚看着一样能点，点下去才飘一句 toast 说声望不足——那是把说明藏在报错里。
    html += '<div class="rep-gates">' + Object.keys(REPUTATION_FEATURE_LEVELS).map(function (feature) {
        var need = REPUTATION_LEVELS[REPUTATION_FEATURE_LEVELS[feature]];
        var on = feats.indexOf(feature) >= 0;
        return '<button type="button" onclick="' + REPUTATION_FEATURE_ENTRIES[feature] + '" ' +
            (on ? '' : 'disabled ') +
            'class="rep-gate' + (on ? ' rep-gate-on' : '') + '">' +
            '<span class="rep-gate__name">' + REPUTATION_FEATURE_LABELS[feature] + '</span>' +
            '<span class="rep-gate__brief">' +
            (on ? '已解锁' : '需声望 ' + (need && need.min != null ? repNum(need.min) : '?') +
                '<span class="rep-gate__tier">（' + (need && need.name ? need.name : '更高名望') + '）</span>') +
            '</span></button>';
    }).join('') + '</div>';
    // 捐资这一页办不了：善堂那条线写明捐粮还是捐药、各花多少灵石、记多少功德。
    // 原先这里挂着一枚只写金额的裸钮——不问捐什么、不费时辰，当场扣一百灵石换几点声望。
    if (cityHasCharityHall(cityName)) {
        html += '<p class="rep-donate-note">🏮 想捐资积德请去<b>善堂</b>：那里分得清捐粮还是捐药、各花多少灵石、记多少功德。</p>';
    }
    return html;
}

// 这座城有没有善堂——查得到名册才敢指路，查不到就当没有，不画一条走不通的路
function cityHasCharityHall(cityName) {
    var ls = window.locationSystem;
    if (!ls || typeof ls.getCityData !== 'function') return false;
    var city = null;
    try { city = ls.getCityData(cityName); } catch (e) { return false; }
    return !!(city && (city.buildings || []).indexOf('charity_hall') >= 0);
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
