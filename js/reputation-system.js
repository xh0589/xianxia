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

    try {
        if (window.EventBus && typeof window.EventBus.on === 'function' && !window._repCombatHooked) {
            window._repCombatHooked = true;
            window.EventBus.on('enemy:defeated', function () {
                try {
                    var city = getCurrentCityName();
                    if (!city || !cityReputation[city] || !cityReputation[city].specialQuests) return;
                    cityReputation[city].specialQuests.forEach(function (q) {
                        if (q && q.accepted && !q.completed && q.objectives && q.objectives[0] && q.objectives[0].type === 'combat') {
                            q._fought = true;
                        }
                    });
                    saveReputation();
                } catch (eHook) {}
            });
        }
    } catch (eInit) {}

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
    ],
    '帝都·长安': [{ id: 'art_lingbo', name: '凌波微步', cost: 520, desc: '宫禁轻身残页，帝都才见得着' }],
    '洛水城': [{ id: 'art_water_heart', name: '水月诀', cost: 280, desc: '洛上文人抄录的观水心法' }],
    '太虚山': [{ id: 'art_taiji', name: '太极玄功', cost: 620, desc: '观星台侧抄下的太极口诀' }],
    '青木城': [{ id: 'art_wood_heart', name: '青木诀', cost: 260, desc: '药园守夜人传的青木调息' }],
    '蓬莱仙岛': [{ id: 'art_water_heart', name: '水月诀', cost: 360, desc: '海上仙山的观潮心法' }],
    '东海龙宫': [{ id: 'art_ice_heart', name: '玄冰诀', cost: 340, desc: '潮汐殿深处的寒息' }],
    '炎城': [{ id: 'art_fire_heart', name: '离火诀', cost: 310, desc: '炉边铸剑人的离火吐纳' }],
    '万毒谷': [{ id: 'art_nine_yin', name: '九阴真经', cost: 680, desc: '谷底阴毒处撕下的半卷' }],
    '凤凰巢': [{ id: 'art_fire_sword', name: '烈火剑法', cost: 350, desc: '赤焰上掠过的剑意残篇' }],
    '金城': [{ id: 'art_metal_heart', name: '金锋诀', cost: 290, desc: '矿脉里传开的金气诀' }],
    '大漠孤城': [{ id: 'art_earth_heart', name: '厚土诀', cost: 270, desc: '沙城墙根下的养土功' }],
    '佛国遗址': [{ id: 'art_hun_yuan', name: '混元功', cost: 270, desc: '残经夹页里的坐禅调息' }],
    '冰原城': [{ id: 'art_ice_heart', name: '玄冰诀', cost: 330, desc: '冰面上抄下的寒息' }],
    '极寒之地': [{ id: 'art_ice_sword', name: '冰霜剑法', cost: 350, desc: '寒潭边留下的剑意' }],
    '万剑宗': [{ id: 'art_wind_sword', name: '清风剑法', cost: 310, desc: '剑林里闪身的清风残剑' }],
    '剑阁': [{ id: 'art_taiji_sword', name: '太极剑法', cost: 480, desc: '藏剑楼外的太极剑意' }],
    '青城山': [{ id: 'art_taiji', name: '太极玄功', cost: 580, desc: '道观晨课留下的太极口诀' }],
    '碧落仙宫': [{ id: 'art_lingbo', name: '凌波微步', cost: 550, desc: '仙宫廊下的踏波步' }],
    '鲛人镇': [{ id: 'art_water_dao', name: '断水刀法', cost: 350, desc: '码头渔户传的断水刀' }],
    '灵界·蓬莱仙境': [{ id: 'art_nine_yang', name: '九阳神功', cost: 800, desc: '上界会盟留下的至阳残篇' }],
    '灵界·九天罡风带': [{ id: 'art_ten_thousand_sword', name: '万剑归宗', cost: 820, desc: '罡风眼里抄下的万剑意' }],
    '魔界·九幽深渊': [{ id: 'art_nine_yin', name: '九阴真经', cost: 780, desc: '魔市柜底的至阴半卷' }],
    '魔界·血海荒原': [{ id: 'art_blood_dao', name: '血饮刀法', cost: 790, desc: '血原上砍出来的血饮残刀' }]
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
                objectives: [{ type: tpl.type || 'talk', target: cityName, count: tpl.type === 'collect' ? 3 : 1, completed: false }]
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
            var actLabel = (q.objectives && q.objectives[0] && q.objectives[0].type === 'collect') ? '交齐物资'
                : (q.objectives && q.objectives[0] && q.objectives[0].type === 'combat') ? '回报除害'
                : '完成巡城';
            btn = '<button onclick="window._completeCityRepQuest(' + i + ',\'' + cityName.replace(/'/g, '') + '\')" class="text-xs bg-yellow-600 text-white px-2 py-1 rounded">' + actLabel + '</button>';
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
    var typ = (q.objectives && q.objectives[0] && q.objectives[0].type) || 'patrol';
    if (typ === 'collect') {
        var need = ['spirit_grass', 'iron_ore', 'herb'];
        var bag = (window.inventory && window.inventory.items) || [];
        var ok = need.some(function (id) {
            return bag.some(function (it) { return it && (it.id === id || it.itemId === id) && (it.count || 1) > 0; });
        });
        if (!ok) {
            if (window.showMessage) window.showMessage('柜上要的是灵草、铁矿一类安民之物——行囊里还没有。', 'warning');
            return;
        }
        var paid = false;
        for (var ni = 0; ni < need.length && !paid; ni++) {
            var nid = need[ni];
            var hit = bag.filter(function (it) { return it && (it.id === nid || it.itemId === nid) && (it.count || 1) > 0; })[0];
            if (!hit) continue;
            var uid = hit.uid || hit.id || nid;
            if (typeof window.removeItem === 'function') {
                window.removeItem(uid, 1);
                paid = true;
            }
        }
        if (!paid) {
            if (window.showMessage) window.showMessage('东西在囊里，这一趟却没交出去。', 'warning');
            return;
        }
    } else if (typ === 'combat') {
        if (!q._fought) {
            if (window.showMessage) window.showMessage('城外那头祸害还在。出城打过一场再来回报。', 'warning');
            return;
        }
    } else {
        if (window.timeSystem && window.timeSystem.advanceTime) window.timeSystem.advanceTime(30, '巡城');
    }
    q.completed = true;
    if (q.objectives) q.objectives.forEach(function(o) { o.completed = true; });
    saveReputation();
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

// ==================== v27.13 画影册流窜玩法（主档模块⑦） ====================
// 用户口径：背着案底换城谋生、遇到识货的老捕快——罪犯生涯的真实代价。
// 地基（铁律，一字不可破）：
//   ① 通缉两档铁律（npc-crime.js）：当街露脸才进画影册、热度一律走 NpcCrime.addHeat 正门——
//      本节一切识破后果只经 addHeat / coolHeat / payBounty 既有正门进账，绝不直改通缉状态；
//      仅「买通不成被当街按住」一支传 faceSeen:true（当街过目，与城门拒入/翻墙火把照脸同口径）——
//      认出本身不传 faceSeen：老捕快是拿「已有的册子」认人，不是新拍了一张脸。
//   ② 恶名分城账在 world-ledger.js——只读。knownNotoriety(城) 是识破率的唯一原料；
//      世界账缺席 → 全跳过（谁也不认识你，隐姓埋名永久生效），不退全局旧口径、绝不炸（冒烟⑤口径）。
// 分工：
//   · 流窜半边（A 城案底随商旅到站 B 城）不用新账——恶名分城已在 world-ledger，本节是消费端：
//     未到站 = knownNotoriety(本地) 低于门槛 = 官府不打扰（天然的隐姓埋名期）；到站才掷。
//   · 盘查账（每城冷却 + 认罪伏法安定期）为本节私有，落 StateRegistry 'wantedAlbum'
//     （加键不升版：老档缺此键 importAll 自然跳过 = 无盘查记录照旧，与 lootProficiency 同律）。
//   · 漂洗（60 日安分热度缓降）在 npc-crime.js 的衰减口（v27.13 rinseTick，走 coolHeat 同源合法口）——本节不碰热度衰减。
// 触发时机：入城链尾钩（location-system.js 末尾包 window.enterCity）＋ 每日一掷（本节新日订阅）——
//   两口共用同一道闸（同一冷却账），入城即掷过、当日不再掷第二次。
// 骰子与账：骰子走引擎随机源（__scenarioRng 零直掷纪律同款）；灵石一律 RewardService/缴清正门，不碰角色字段。
(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    // ---- 明账配置（牌面上就说给玩家听的数） ----
    var TUNE = {
        NOTO_GATE: 8,           // 本地已知恶名低于此值：新客过路，官府不打扰（隐姓埋名期）
        RATE_PER_NOTO: 0.006,   // 每 1 点本地已知恶名的识破底率
        RATE_PER_CITY: 0.02,    // 在册城数每多一城 +2%（案底越厚，捕快房的眼越尖）
        RATE_NOTO_CAP: 0.30,    // 恶名项的底率顶（城数另加，总口再卡上限）
        RATE_CAP: 0.35,         // 识破率总上限（铁口径）
        FACE_MUL: 1.25,         // 画像档：画影在手，一眼就中
        TRAIT_MUL: 0.7,         // 特质档：册子上没脸，只有体态口音路数
        MASK_PORTRAIT_MUL: 0.45, // 画像档戴面具：减半不到（CityGate.HUNTER_MASK_FACE 同款口径）
        MASK_TRAIT_MUL: 0.1,     // 特质档戴面具：近乎白走（HUNTER_MASK_BLIND 同款口径）
        ROLL_CD_DAYS: 15,       // 每城冷却：15 日一次盘查掷
        SETTLE_DAYS: 90,        // 认罪伏法后：本城案卷合上，90 日不再盘查
        HEAT_BASE: 4,           // 本地恶名激活进热度的底数（addHeat 正门）
        HEAT_PER_NOTO: 10,      // 每多少点本地恶名折 1 点热度
        HEAT_MAX: 12,           // 单次激活热度上限
        HEAT_BRIBE_FAIL_EXTRA: 2, // 买通不成被当街按住：加一档（脸也当街过了目）
        BRIBE_BASE: 40,         // 塞钱销声的底价（灵石）
        BRIBE_PER_NOTO: 1,      // 每点本地恶名加 1
        BRIBE_CAP: 200,
        BRIBE_P: 0.65,          // 塞钱成功率（明账）
        FINE_BASE: 30,          // 认罪伏法（未通缉）的罚金底价
        FINE_PER_NOTO: 2,
        FINE_CAP: 300
    };

    var _st = { cities: {}, stats: { rolled: 0, hit: 0, bribed: 0, bribedFail: 0, walkoff: 0, confessed: 0 } };
    var _pending = null;   // { city, noto, activation } 弹窗开着才有值——防连点重入

    // ---- 小工具（黑道账/城门账同款口径） ----
    function absDay() {
        try {
            if (window.WorldCalendar && typeof window.WorldCalendar.day === 'number' && window.WorldCalendar.day > 0) return Math.floor(window.WorldCalendar.day);
            if (typeof window.getAbsoluteDay === 'function') { var g = window.getAbsoluteDay(); if (g) return Math.floor(g); }
            if (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') { var t = window.timeSystem.getAbsoluteDay(); if (t) return Math.floor(t); }
        } catch (e) { return 0; }
        return 0;
    }
    function dice() { return (typeof window.__scenarioRng === 'function') ? window.__scenarioRng() : Math.random(); }
    function msg(m, t) { try { if (window.showMessage) window.showMessage(m, t || 'info'); } catch (e) {} }
    function log(m, t) { try { if (window.gameLog && window.gameLog.add) window.gameLog.add(m, t || 'info'); } catch (e) {} }
    function deed(mood, s) { try { if (typeof window.playerPushDeed === 'function') window.playerPushDeed(mood, s); } catch (e) {} }
    function refresh() {
        try { if (window.updateCharacterStatus) window.updateCharacterStatus(); } catch (e) {}
        try { if (typeof window.updateCurrencyUI === 'function') window.updateCurrencyUI(); } catch (e2) {}
    }
    function inBattle() { try { return !!window.currentBattle; } catch (e) { return false; } }
    // 人此刻真在城里吗（野外/位面/门派一律不算——盘查是街面上的事）
    function cityNow() {
        var city = '';
        try { city = (typeof getCurrentCityName === 'function' && getCurrentCityName()) || ''; } catch (e) { return ''; }
        if (!city) return '';
        try { if (window.locationSystem && typeof window.locationSystem.getCityData === 'function' && !window.locationSystem.getCityData(city)) return ''; } catch (e2) {}
        return city;
    }
    // 世界账只读读口（地基②）：缺席一律 0——全跳过，不退全局旧口径
    function localNoto(city) {
        try {
            if (window.WorldLedger && typeof window.WorldLedger.knownNotoriety === 'function') {
                return Math.max(0, Number(window.WorldLedger.knownNotoriety(city)) || 0);
            }
        } catch (e) { console.warn('[静默失败] js/reputation-system.js · localNoto：本地已知恶名没读出来，按不认识你算', e && e.message); }
        return 0;
    }
    function worldLedgerOn() {
        return !!(window.WorldLedger && typeof window.WorldLedger.knownNotoriety === 'function');
    }
    // 在册城数：案底挂了号的城（knownNotoriety>0），按城表点名；脚下城兜底补数（归一去重）
    function citiesOnFile() {
        var seen = {}, n = 0;
        try {
            if (!worldLedgerOn()) return 0;
            var md = window.mapData || {};
            Object.keys(md).forEach(function (rg) {
                var cs = md[rg] && md[rg].cities;
                if (!Array.isArray(cs)) return;
                cs.forEach(function (c) {
                    if (!c) return;
                    if ((Number(window.WorldLedger.knownNotoriety(c)) || 0) > 0) {
                        var k = repKey(c);
                        if (!seen[k]) { seen[k] = 1; n++; }
                    }
                });
            });
            var here = (window.currentCharData && window.currentCharData.location) || '';
            if (here && (Number(window.WorldLedger.knownNotoriety(here)) || 0) > 0 && !seen[repKey(here)]) n++;
        } catch (e) { console.warn('[静默失败] js/reputation-system.js · citiesOnFile：在册城数没数出来，按在手账面算', e && e.message); }
        return n;
    }
    // 通缉账只读读口（npc-crime.js 正门，缺账按没案底算）
    function nc(fn, fallback) {
        try {
            if (window.NpcCrime && typeof window.NpcCrime[fn] === 'function') return window.NpcCrime[fn]();
        } catch (e) { console.warn('[静默失败] js/reputation-system.js · nc：通缉账「' + fn + '」没读出来，按缺账算', e && e.message); }
        return fallback;
    }
    function faceKnown() { return !!nc('faceKnown', false); }
    function wantedNow() { return !!nc('wanted', false); }
    function bountyNow() { return Number(nc('bounty', 0)) || 0; }
    function masked() {
        try { if (window.Disguise && typeof window.Disguise.active === 'function') return !!window.Disguise.active(); } catch (e) { console.warn('[静默失败] js/reputation-system.js · masked：易容账没读出来，按素脸算', e && e.message); }
        return false;
    }
    function addHeat(n, why, opts) {
        try { if (window.NpcCrime && typeof window.NpcCrime.addHeat === 'function') { window.NpcCrime.addHeat(n, why, opts); return true; } } catch (e) { console.warn('[静默失败] js/reputation-system.js · addHeat：这笔风声没记上官府的账', e && e.message); }
        return false;
    }
    function coolHeat(n) {
        try { if (window.NpcCrime && typeof window.NpcCrime.coolHeat === 'function') return window.NpcCrime.coolHeat(n); } catch (e) { console.warn('[静默失败] js/reputation-system.js · coolHeat：这笔消账没落成', e && e.message); }
        return 0;
    }
    function payBountyNow() {
        try { if (window.NpcCrime && typeof window.NpcCrime.payBounty === 'function') return window.NpcCrime.payBounty(); } catch (e) { console.warn('[静默失败] js/reputation-system.js · payBountyNow：缴清没走通', e && e.message); }
        return { error: '司法堂的账房没开张。' };
    }
    function settle(spec, source) {
        try {
            if (window.RewardService && typeof window.RewardService.apply === 'function') {
                var r = window.RewardService.apply(spec, { source: source || '画影册', city: _pending ? _pending.city : '' });
                return { ok: !!(r && r.success !== false), note: r && r.messages ? r.messages.join('、') : '' };
            }
        } catch (e) { console.warn('[静默失败] js/reputation-system.js · settle：这笔账没落成一笔', e && e.message); }
        return { ok: false, note: '' };
    }

    // ---- 盘查账（StateRegistry 'wantedAlbum'：加键不升版，老档缺键=无盘查记录照旧） ----
    // 账随 StateRegistry.exportAll 在游戏存档时成对往返（与 crimeLedger/cityGate 同律），不另设即时落盘。
    function ledOf(city) {
        var ck = repKey(city);
        if (!ck) return null;
        var e = _st.cities[ck];
        if (!e || typeof e !== 'object') e = _st.cities[ck] = {};
        e.lastRollDay = Math.max(0, Math.floor(Number(e.lastRollDay) || 0));   // 0=没掷过（绝对日自 1 起）
        e.settledDay = Math.max(0, Math.floor(Number(e.settledDay) || 0));     // 0=没伏法过
        return e;
    }
    function activationHeat(noto) {
        return Math.min(TUNE.HEAT_MAX, TUNE.HEAT_BASE + Math.floor(noto / TUNE.HEAT_PER_NOTO));
    }
    function bribeCost(noto) { return Math.min(TUNE.BRIBE_CAP, TUNE.BRIBE_BASE + Math.floor(noto * TUNE.BRIBE_PER_NOTO)); }
    function fineCost(noto) { return Math.min(TUNE.FINE_CAP, TUNE.FINE_BASE + Math.floor(noto * TUNE.FINE_PER_NOTO)); }

    // 识破率（明账）：f(本地 knownNotoriety, 在册城数) × 通缉两档折算 × 易容折扣，总口卡 0.35
    function spotRate(noto, onFile) {
        var base = Math.min(TUNE.RATE_NOTO_CAP, noto * TUNE.RATE_PER_NOTO + Math.max(0, onFile - 1) * TUNE.RATE_PER_CITY);
        if (base <= 0) return 0;
        var mul = faceKnown() ? TUNE.FACE_MUL : TUNE.TRAIT_MUL;
        try { if (masked()) mul *= faceKnown() ? TUNE.MASK_PORTRAIT_MUL : TUNE.MASK_TRAIT_MUL; } catch (eM) {}
        return Math.min(TUNE.RATE_CAP, base * mul);
    }

    // ---- 盘查总闸（入城钩与每日掷共用）：全部闸门过了才真掷 ----
    // 返回 'skip'（没掷——门槛/冷却/安定期/不在城/打着架/账缺席）/ 'miss'（掷了没中）/ 'hit'（掷中了）
    function rollCheck(source) {
        if (!window.currentCharData) return 'skip';
        if (absDay() <= 0) return 'skip';          // 时间未行（时间系统缺席）：不掷
        if (inBattle() || _pending) return 'skip';
        try { if (window._isInLongRetreat) return 'skip'; } catch (eR) {}   // 闭关中不掷（long-retreat 的撞见账归它自己管）
        if (!worldLedgerOn()) return 'skip';       // 地基②：世界账缺席全跳过
        var city = cityNow();
        if (!city) return 'skip';
        var noto = localNoto(city);
        if (noto < TUNE.NOTO_GATE) return 'skip';  // 低恶名新客不掷：隐姓埋名日子照过
        var led = ledOf(city);
        if (!led) return 'skip';
        var day = absDay();
        if (led.settledDay > 0 && day - led.settledDay < TUNE.SETTLE_DAYS) return 'skip'; // 认罪伏法后的安定期
        if (led.lastRollDay > 0 && day - led.lastRollDay < TUNE.ROLL_CD_DAYS) return 'skip'; // 每城 15 日冷却
        // 掷了（中与不中都记冷却——盘查这件事本身发生了）
        led.lastRollDay = day;
        _st.stats.rolled += 1;
        var p = spotRate(noto, citiesOnFile());
        var hit = dice() < p;
        if (!hit) return 'miss'; // 未掷中：老捕快眼神扫过去了，没认出来——隐姓埋名日子照过
        _st.stats.hit += 1;
        openRecognizedDialog(city, noto, p, source);
        return 'hit';
    }

    // ---- 识破事件：老捕快眯眼认出你（三选应对，各走各的既有正门） ----
    function openRecognizedDialog(city, noto, p, source) {
        var portrait = faceKnown();
        var onFile = citiesOnFile();
        var act = activationHeat(noto);
        _pending = { city: city, noto: noto, activation: act };
        var where = source === 'enter' ? '你刚进城门不久' : '你在街上寻常地走着';
        var faceWord = portrait
            ? '画影图形就钉在捕快房里——你这张脸，老朽闭着眼都认得。'
            : '册子上没画你的脸，可这份体态、口音、路数——老朽闭着眼都摸得出来。';
        var body = '<p class="text-sm text-gray-200">' + where + '，茶棚底下一位穿旧捕服的干瘦老者眯起眼睛——先看你的步子，再听你的口音，最后盯着你看了三遍。他慢悠悠亮出腰牌：</p>' +
            '<p class="text-sm text-amber-200 mt-2">「老朽在这六扇门里当了三十年差。' + faceWord + '你在「' + city + '」干下的事，文书前些日子刚到——' + noto + ' 分的案底，' + onFile + ' 座城的捕快房里都挂着号。」</p>' +
            '<p class="text-xs text-gray-400 mt-2">（本地盘查识破率约 ' + Math.round(p * 100) + '%——恶名越响、在册城越多越难藏；通缉' + (portrait ? '画像档' : '特质档') + (masked() ? '，且你此刻易容' : '') + '。他没喊人——先把话递给了你。）</p>' +
            '<div class="mt-3">';
        var btn = 'class="w-full p-3 rounded mb-2 text-left text-sm text-white hover:opacity-90"';
        body += '<button onclick="window.WantedAlbum.choose(\'bribe\')" ' + btn.replace('p-3', 'bg-amber-900 p-3') + '>💰 塞钱销声（' + bribeCost(noto) + ' 灵石 · 成功率 ' + Math.round(TUNE.BRIBE_P * 100) + '%——成了他当没看见；砸了他当街喊人，脸也就当街过了目）</button>';
        body += '<button onclick="window.WantedAlbum.choose(\'walk\')" ' + btn.replace('p-3', 'bg-slate-800 p-3') + '>🚶 转身就走（趁他没喊人混进人流——案底照样激活进捕快房的账，热度+' + act + '，但没人看清你的脸）</button>';
        if (wantedNow() && bountyNow() > 0) {
            body += '<button onclick="window.WantedAlbum.choose(\'confess\')" ' + btn.replace('p-3', 'bg-emerald-900 p-3') + '>⚖️ 认罪伏法（跟他到堂上缴清悬赏 ' + bountyNow() + ' 灵石——当堂销案揭画影，本城 ' + TUNE.SETTLE_DAYS + ' 日不再翻你的旧账）</button>';
        } else {
            body += '<button onclick="window.WantedAlbum.choose(\'confess\')" ' + btn.replace('p-3', 'bg-emerald-900 p-3') + '>⚖️ 认罪伏法（跟他到堂上认下旧案，罚金 ' + fineCost(noto) + ' 灵石当堂缴讫——案卷合上，本城 ' + TUNE.SETTLE_DAYS + ' 日不再盘查）</button>';
        }
        body += '<p class="text-[11px] text-gray-500 mt-1">三选一都是明账：钱走 RewardService/缴清正门，热度走 addHeat 正门——老捕快只认账，不赊账。</p></div>';
        try {
            if (typeof window.showBuildingEffectDialog === 'function') {
                window.showBuildingEffectDialog('🕵️ 画影册 · 识货的老捕快（' + city + '）', body);
                log('🕵️ ' + city + '街上，一位识货的老捕快把你认了出来——你在「' + city + '」的案底（' + noto + ' 分，' + onFile + ' 城在册）到他手里了。', 'danger');
                return true;
            }
        } catch (eD) { console.warn('[静默失败] js/reputation-system.js · openRecognizedDialog：对质这扇窗没支起来', eD && eD.message); }
        // 弹窗系统不在（极端兜底）：不擅自替玩家花钱——按最便宜的一支「转身就走」落账，话说明白
        _pending = null;
        doWalk(noto, act, city);
        return false;
    }

    function closeDialog() {
        _pending = null;
        try { if (typeof window.closeBuildingDialog === 'function') window.closeBuildingDialog(); } catch (e) {}
    }

    // 三应对之一：转身就走（不花钱——案底激活走 addHeat 正门，不当街、不传 faceSeen）
    function doWalk(noto, act, city) {
        addHeat(act, '流窜案底被老捕快识破（' + city + '）');
        _st.stats.walkoff += 1;
        deed('bad', '你在' + city + '被一位识货的老捕快认出了流窜的案底——他没喊人，捕快房里却多了一份你的新回报');
        log('🕵️ 你压低斗笠混进人流——老捕快没追，也没喊。可他把你这身行头、口音、兵刃，一五一十回捕快房报了个仔细。（热度+' + act + '——案底激活了，但没人看清你的脸）', 'danger');
        msg('🕵️ 你转身走了——案底却在他眼里记下了。（热度+' + act + '）', 'error');
        refresh();
    }

    function choose(choice) {
        var pend = _pending;
        if (!pend) return false;
        var city = pend.city, noto = pend.noto, act = pend.activation;
        if (choice === 'bribe') {
            var cost = bribeCost(noto);
            var pay = settle({ spiritStones: -cost }, '画影册·塞钱销声');
            if (!pay.ok) { msg('🕵️ 你摸不出 ' + cost + ' 灵石——老捕快的眼睛眯得更细了。（钱没花出去，话还摆着）', 'warning'); return false; }
            closeDialog();
            if (dice() < TUNE.BRIBE_P) {
                _st.stats.bribed += 1;
                log('🕵️ 你借着添茶的手势把 ' + cost + ' 灵石推进他袖口。老捕快掂了掂，起身理了理旧捕服：「人老了，眼神不济——认错人了。」他慢悠悠踱进人流里。（案底没进账——但他的记性比他的眼神好）', 'success');
                msg('🕵️ 塞钱销声成了——他当没看见你。（-' + cost + ' 灵石）', 'success');
            } else {
                _st.stats.bribedFail += 1;
                // 砸了：他当街按住你喊人——当街过目，脸进册子走两档铁律正门（faceSeen，与城门拒入同口径）
                addHeat(act + TUNE.HEAT_BRIBE_FAIL_EXTRA, '老捕快识破案底·买通不成', { faceSeen: true });
                deed('bad', '你在' + city + '想塞钱买通认出你的老捕快，反被他当街按住喊了人来——半个街市的人都看见了你的脸');
                log('🕵️ 灵石刚碰着他的袖口，老捕快五指一翻扣住了你的手腕，扬声就喊：「就是这位——通缉册上画的就是他！」街面上的人围拢过来。（热度+' + (act + TUNE.HEAT_BRIBE_FAIL_EXTRA) + '，你的脸当街过了目）', 'danger');
                msg('🕵️ 买通不成——灵石喂了狗，人被当街按住。（热度+' + (act + TUNE.HEAT_BRIBE_FAIL_EXTRA) + '）', 'error');
            }
            refresh();
            return true;
        }
        if (choice === 'walk') {
            closeDialog();
            doWalk(noto, act, city);
            return true;
        }
        if (choice === 'confess') {
            if (wantedNow() && bountyNow() > 0) {
                var r = payBountyNow();
                if (r && r.error) { msg('⚖️ ' + r.error, 'warning'); return false; }   // 缴不动（钱不够）：话摆着，人还站在老捕快跟前
                closeDialog();
                ledSettle(city);
                _st.stats.confessed += 1;
                log('⚖️ 你跟着老捕快到堂上认了案——缴清悬赏、当堂销案、画影揭了。「案了了。往后安分些——' + city + '的捕快房 ' + TUNE.SETTLE_DAYS + ' 日内不再翻你的旧账。」', 'success');
                msg('⚖️ 认罪伏法——案当堂销了，本城 ' + TUNE.SETTLE_DAYS + ' 日不再盘查。', 'success');
                refresh();
                return true;
            }
            var fine = fineCost(noto);
            var fp = settle({ spiritStones: -fine, karma: 1 }, '画影册·认罪伏法');
            if (!fp.ok) { msg('⚖️ 罚金 ' + fine + ' 灵石缴不齐——堂上的笔悬着，话还摆着。', 'warning'); return false; }
            closeDialog();
            // 案底先如实入账再当堂了结：两笔都走正门（addHeat 进、coolHeat 出），账面上留得住这桩官司的来去
            addHeat(act, '老捕快识破案底·随堂伏法（' + city + '）');
            coolHeat(act);
            ledSettle(city);
            _st.stats.confessed += 1;
            deed('good', '你在' + city + '跟老捕快到堂认下了流窜的旧案，罚金当堂缴讫——了断得干脆，书吏都多看了你两眼');
            log('⚖️ 你跟他到堂上，把「' + city + '」那桩旧案认了。书吏把案子并进旧卷，罚金 ' + fine + ' 灵石当堂缴讫。「案了了。往后安分些——本城 ' + TUNE.SETTLE_DAYS + ' 日内不再翻你的旧账。」（功德簿记一笔——认罪伏法，算半桩善举）', 'success');
            msg('⚖️ 认罪伏法——罚金缴讫，案卷合上（-' + fine + ' 灵石）。本城 ' + TUNE.SETTLE_DAYS + ' 日不再盘查。', 'success');
            refresh();
            return true;
        }
        return false;
    }
    function ledSettle(city) {
        var led = ledOf(city);
        if (led) led.settledDay = absDay();
    }

    // ---- 两个触发口 ----
    function onEnterCity(cityName) { return rollCheck('enter'); }
    function dailyTick() { return rollCheck('daily'); }

    // ---- 存读档（StateRegistry 'wantedAlbum'：加键不升版，老档缺键 importAll 自然跳过） ----
    try {
        if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
            window.StateRegistry.register('wantedAlbum', {
                version: 1,
                export: function () { return JSON.parse(JSON.stringify(_st)); },
                import: function (d) {
                    var s = { cities: {}, stats: { rolled: 0, hit: 0, bribed: 0, bribedFail: 0, walkoff: 0, confessed: 0 } };
                    if (d && typeof d === 'object') {
                        if (d.cities && typeof d.cities === 'object') {
                            var n = 0;
                            for (var ck in d.cities) {
                                if (n++ >= 200) break;   // 封顶防异常撑档
                                var e = d.cities[ck];
                                if (!e || typeof e !== 'object') continue;
                                s.cities[String(ck).slice(0, 30)] = {
                                    lastRollDay: Math.max(0, Math.floor(Number(e.lastRollDay) || 0)),
                                    settledDay: Math.max(0, Math.floor(Number(e.settledDay) || 0))
                                };
                            }
                        }
                        if (d.stats && typeof d.stats === 'object') {
                            for (var k in s.stats) { if (Number.isFinite(Number(d.stats[k]))) s.stats[k] = Math.max(0, Math.floor(Number(d.stats[k]))); }
                        }
                    }
                    _st = s;
                    _pending = null;
                },
                reset: function () { _st = { cities: {}, stats: { rolled: 0, hit: 0, bribed: 0, bribedFail: 0, walkoff: 0, confessed: 0 } }; _pending = null; }
            });
        } else {
            console.warn('[WantedAlbum] StateRegistry 不可用——盘查账不入档（老档兼容期，缺账=无盘查记录照旧）');
        }
    } catch (eReg) {
        console.warn('[WantedAlbum] 注册存档失败:', eReg);
    }

    // ---- 每日一掷（新日订阅；入城钩与日常掷共用同一道闸与同一本冷却账） ----
    (function subscribe() {
        function sub() {
            if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') {
                window.timeSystem.onNewDaySubscribe(function () { try { dailyTick(); } catch (eD) { console.warn('[静默失败] js/reputation-system.js · dailyTick：日常盘查没掷成', eD && eD.message); } });
            }
        }
        if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') sub();
        else if (typeof window.addEventListener === 'function') window.addEventListener('load', sub);
    })();

    window.WantedAlbum = {
        TUNE: TUNE,
        onEnterCity: onEnterCity,
        dailyTick: dailyTick,
        choose: choose,
        spotRate: spotRate,
        localNoto: localNoto,
        citiesOnFile: citiesOnFile,
        ledOf: ledOf,
        state: function () { return JSON.parse(JSON.stringify(_st)); }
    };
})();

// ============ v27.2 善举与声望批：善举名册 + 人情账 + 声望里程碑链（扩 reputation-system.js） ============
// 用户点单「开工善举与声望批」。三块账全挂在既有的 cityReputation 城望账上（单一真源，不开新存储键）：
//   ① 善举名册（每城每件一次）：城门施茶/栽树/打井/修桥/赎身契放良/立义仓/资助穷书生（长线报恩）/
//      疫年施药（须疫病世界事件进行中，world-events.js 正门）/解救被拐孩子（账面上办不成——得真撞上，低频街面事）。
//   ② 人情账：穷书生/卖菜翁/孤儿三笔长线——到期自动上门报恩（新日订阅结算，零按钮，绝不追着玩家）。
//   ③ 声望里程碑链（零按钮，纯演出）：记功牌坊 → 戏班写戏 → 地方志留名 → 国史立传 → 御赐匾额，
//      按本城善举件数 × 城望双门槛自动过档，城情卡上如实摆出来。
// 口径：银钱/城望/业障一律走 RewardService 统一结算（一笔事务，不足即整笔不成）；风声走 playerPushDeed；
//   时辰走 advanceTime；骰子有引擎随机源走引擎（零直掷纪律）；账随 xianxia_reputation 既有存档键成对往返。
(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    // ---- 明账配置 ----
    var GOOD_DEEDS = [
        { id: 'tea',      icon: '🍵', name: '城门施茶',     cost: 20,  rep: 8,  karma: 2, time: 30,
          desc: '在城门洞支一口茶棚，挑担的、赶路的，谁都能歇脚喝碗粗茶——施茶十日。',
          doneText: '茶棚当日起灶。守门的兵丁头一个来喝，喝完把碗刷得干干净净放回案上。' },
        { id: 'tree',     icon: '🌳', name: '官道栽树',     cost: 30,  rep: 6,  karma: 2, time: 20,
          desc: '官道两旁栽一排树——栽树的人未必乘得到凉，乘凉的人会记得栽树的。',
          doneText: '树苗栽下去，浇了头遍水。几年后这条道上的人，就都在你的树荫里走了。' },
        { id: 'well',     icon: '🪣', name: '打井',         cost: 120, rep: 18, karma: 4, time: 60,
          desc: '城里甜水井少，穷巷的人家吃水要走二里地——出资打一口公井。',
          doneText: '井打到三丈见水，清冽冽的。头一担水打上来，巷子里的老人先舀了一瓢敬了井神，第二瓢端给了你。' },
        { id: 'bridge',   icon: '🌉', name: '修桥',         cost: 150, rep: 20, karma: 4, time: 60,
          desc: '城外的木桥朽了半边，雨天有人失足落水——出钱换成石桥。',
          doneText: '石桥合龙那日，里正领着全村人在桥头作了个揖。桥栏上刻着捐资人的名姓，你的在最前头。' },
        { id: 'ransom',   icon: '📜', name: '赎身契放良',   cost: 200, rep: 25, karma: 8, time: 40,
          desc: '牙行里有人被一纸身契押着一辈子——把身契买下来，当面烧了。',
          doneText: '身契在火盆里卷成灰。那人对着灰磕了个头，起身时腰杆是直的——从今往后，他是自由身。' },
        { id: 'granary',  icon: '🌾', name: '立义仓',       cost: 300, rep: 30, karma: 6, time: 90,
          desc: '捐粮立一座义仓——荒年开仓放粮，平年陈陈相因，一城的底气。',
          doneText: '义仓的匾挂上去，头一批粮入了仓。里正把仓册副本送来一份：这座仓，全城人记你的情。' },
        { id: 'scholar',  icon: '📚', name: '资助穷书生',   cost: 100, rep: 12, karma: 4, time: 30,
          desc: '客栈里有个书生盘缠见了底，还揣着考篮要上京——替他结了房钱路费。（人情账：他若得志，必来报恩）',
          doneText: '书生把你姓名籍贯工工整整记在考篮夹层里，长揖到地：「他日若得寸进，必不敢忘。」',
          favor: { days: 180, stones: 300, rep: 10, text: '当年你资助的穷书生放榜了——差人送来一封厚礼和一封长信：「旅费百金，报以三倍。功名路上，你是头一个恩人。」' } },
        { id: 'medicine', icon: '💊', name: '疫年施药',     cost: 60,  rep: 25, karma: 6, time: 40, gate: 'plague',
          desc: '疫气流行的年头，支起药棚施药施粥（须疫病正流行——世界事件进行中才办得成）。',
          doneText: '药棚支了三日，染疫的人家排队领药。疫年里的这碗药，比太平年间的十碗都重。' },
        { id: 'child',    icon: '🧒', name: '解救被拐孩子', cost: 0,   rep: 30, karma: 10, time: 0, gate: 'encounter',
          desc: '从人牙子手里把被拐的孩子救回来——这事账面上办不成，得在街面上真撞见。',
          doneText: '' }
    ];
    var DEED_BY_ID = {};
    GOOD_DEEDS.forEach(function (d) { DEED_BY_ID[d.id] = d; });

    // 里程碑链：件数×城望双门槛，自动过档，零按钮纯演出（40→10→47→41→42）
    var MILESTONES = [
        { id: 'paifang', icon: '🏛️', name: '记功牌坊', deeds: 4, rep: 2000,
          text: '府衙在你行善最多的那座城门口立起一座「乐善记功」牌坊——过路的人抬头就能看见你的名字。立坊那日，街坊自发来观礼，有人带了红鸡蛋。' },
        { id: 'opera',   icon: '🎭', name: '戏班写戏', deeds: 6, rep: 3500,
          text: '城里戏班排了新戏《义人传》，唱的就是你的事迹——虽然为了好听，把你的相貌唱俊了三分。你混在台下看了一场，邻座的老太太跟着戏文抹眼泪，没人认出身边坐的就是正主。' },
        { id: 'gazette', icon: '📖', name: '地方志留名', deeds: 8, rep: 5000,
          text: '府里修地方志，你的名字进了「善行」卷的排头——修志的先生说：「这一卷百年后还有人翻，你的名字跟着这卷纸活。」' },
        { id: 'history', icon: '🖋️', name: '国史立传', deeds: 9, rep: 8000,
          text: '史馆把你的事迹采进了国史——一介布衣立传，本朝屈指可数。史官来核实时只问了一句：「这些善举，可有一件是图报的？」你自己答的什么，史册上没写。' },
        { id: 'plaque',  icon: '🏅', name: '御赐匾额', deeds: 9, rep: 10000,
          text: '御笔亲题「乐善好施」四个大字，金漆匾额由仪仗抬进城，挂在你的门楣上——地方官随行宣读，满城围观。这块匾，比什么法宝都镇宅。' }
    ];

    // 低频街面事（解救被拐孩子 / 路见不平 / 受托孤）——事不追人：至多几日一遇，错过自然再来，永不过期催办
    var ENC_P = 0.12;          // 新日在城中：街面事一骰
    var ENC_GAP_DAYS = 5;      // 两次街面事至少隔五日（角色级戳）
    var ENC_SEEN_CD = 15;      // 同一城同一桩事，撞见过一回就歇十五日（每城戳）

    function dice() { return (typeof window.__scenarioRng === 'function') ? window.__scenarioRng() : Math.random(); }
    function absDayNow() {
        try {
            if (window.WorldCalendar && typeof window.WorldCalendar.day === 'number' && window.WorldCalendar.day > 0) return Math.floor(window.WorldCalendar.day);
            if (typeof window.getAbsoluteDay === 'function') { var g = window.getAbsoluteDay(); if (g) return Math.floor(g); }
            if (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') { var t = window.timeSystem.getAbsoluteDay(); if (t) return Math.floor(t); }
        } catch (e) { return 0; }
        return 0;
    }
    function msg(m, t) { try { if (window.showMessage) window.showMessage(m, t || 'info'); } catch (e) {} }
    function log(m, t) { try { if (window.gameLog && window.gameLog.add) window.gameLog.add(m, t || 'info'); } catch (e) {} }
    function deed(mood, text) { try { if (typeof window.playerPushDeed === 'function') window.playerPushDeed(mood, text); } catch (e) {} }
    function realmIdxNow() {
        try {
            var r = window.currentCharData && window.currentCharData.realm;
            if (r && typeof window.getRealmIndex === 'function') return Number(window.getRealmIndex(r)) || 0;
        } catch (e) {}
        return 0;
    }
    // 人此刻真在城里吗（野外/位面一律算不在——街面事只在街面上撞得见）
    function inCityNow() {
        var city = '';
        try { city = getCurrentCityName() || ''; } catch (e) { return ''; }
        if (!city) return '';
        try { if (window.locationSystem && typeof window.locationSystem.getCityData === 'function' && !window.locationSystem.getCityData(city)) return ''; } catch (e2) {}
        return city;
    }
    // 善举账挂在城望账的城条目上（entry.deeds）——normalizeReputationEntry 只归一已知键，多余字段随对象成对往返，
    // 这里再懒归一一道：坏账不进门。
    function ledgerOf(city) {
        var ck = repKey(city);
        if (!ck) return null;
        if (!cityReputation[ck]) cityReputation[ck] = normalizeReputationEntry({ value: 0, flags: [], unlockedFeatures: [] });
        var e = cityReputation[ck];
        if (!e.deeds || typeof e.deeds !== 'object') e.deeds = {};
        if (!e.deeds.done || typeof e.deeds.done !== 'object') e.deeds.done = {};
        Object.keys(e.deeds.done).forEach(function (k) {
            if (!DEED_BY_ID[k] || !(Number(e.deeds.done[k]) > 0)) delete e.deeds.done[k];
            else e.deeds.done[k] = Math.floor(Number(e.deeds.done[k]));
        });
        if (!e.deeds.seen || typeof e.deeds.seen !== 'object') e.deeds.seen = {};
        Object.keys(e.deeds.seen).forEach(function (k) { e.deeds.seen[k] = Math.max(0, Math.floor(Number(e.deeds.seen[k]) || 0)); });
        if (!Array.isArray(e.deeds.milestones)) e.deeds.milestones = [];
        e.deeds.milestones = e.deeds.milestones.filter(function (m) {
            return MILESTONES.some(function (x) { return x.id === m; });
        });
        if (!Array.isArray(e.deeds.favors)) e.deeds.favors = [];
        e.deeds.favors = e.deeds.favors.filter(function (f) {
            return f && typeof f === 'object' && Number(f.repayDay) > 0 && (Number(f.stones) || Number(f.rep) || Number(f.karma));
        }).slice(0, 12).map(function (f) {
            return { kind: String(f.kind || 'favor').slice(0, 20), city: ck, repayDay: Math.floor(Number(f.repayDay)), stones: Math.max(0, Math.floor(Number(f.stones) || 0)), rep: Math.max(0, Math.floor(Number(f.rep) || 0)), karma: Math.max(0, Math.floor(Number(f.karma) || 0)), text: String(f.text || '').slice(0, 200) };
        });
        return e.deeds;
    }
    function doneCount(city) { var led = ledgerOf(city); return led ? Object.keys(led.done).length : 0; }
    function hasCharFlag(key) { var c = window.currentCharData; return !!(c && c.flags && c.flags[key]); }
    function setCharFlag(key, v) { var c = window.currentCharData; if (!c) return; c.flags = c.flags || {}; c.flags[key] = v; }

    function applyTx(spec, city) {
        if (!window.RewardService) { msg('善堂的账房没开张，改日再来。', 'warning'); return null; }
        var res = window.RewardService.apply(spec, { source: 'goodDeeds', city: city });
        if (!res || res.success === false) { msg('这一笔没能交割：' + ((res && res.reason) || '银钱不足或账房不通'), 'warning'); return null; }
        (res.messages || []).forEach(function (m) { log(m, 'info'); });
        return res;
    }

    // ---- 里程碑链：自动过档，纯演出 ----
    function checkMilestones(city) {
        var ck = repKey(city);
        if (!ck) return [];
        var led = ledgerOf(ck);
        var n = Object.keys(led.done).length;
        var rep = getReputationValue(ck);
        var earned = [];
        MILESTONES.forEach(function (m) {
            if (led.milestones.indexOf(m.id) >= 0) return;
            // 链是逐级上的：前一座没立，后一座不越级（牌坊都没有，何谈御匾）
            var mi = MILESTONES.indexOf(m);
            for (var j = 0; j < mi; j++) { if (led.milestones.indexOf(MILESTONES[j].id) < 0) return; }
            if (n >= m.deeds && rep >= m.rep) {
                led.milestones.push(m.id);
                earned.push(m);
                log(m.icon + ' 【' + m.name + '】' + m.text, 'success');
                msg(m.icon + ' 善有善报：【' + m.name + '】立起来了！（' + ck + '）', 'success');
                deed('good', '你在' + ck + '得了「' + m.name + '」——满城都传你的善名');
            }
        });
        if (earned.length) saveReputation();
        return earned;
    }
    // 城望一变就过一遍链（EventBus reputation:changed 正门——addReputation 本就发这个事件）
    function hookMilestones() {
        if (!window.EventBus || typeof window.EventBus.on !== 'function') return;
        window.EventBus.on('reputation:changed', function (e) {
            try { if (e && (e.normalized || e.cityName)) checkMilestones(e.normalized || e.cityName); } catch (err) {}
        });
    }

    // ---- 善举正门 ----
    function markDeed(city, id) {
        var led = ledgerOf(city);
        if (!led || led.done[id]) return false;
        var d = DEED_BY_ID[id];
        if (!d) return false;
        led.done[id] = absDayNow() || 1;
        saveReputation();
        deed('good', '你在' + repKey(city) + '做了「' + d.name + '」的善举——市井都念你的好');
        checkMilestones(city);
        return true;
    }
    function deedGateFail(d, city) {
        if (!d) return '没有这桩善举。';
        if (d.gate === 'plague') {
            var act = false;
            try { act = !!(typeof isWorldEventActive === 'function' && isWorldEventActive('plague')) || !!(window.isWorldEventActive && window.isWorldEventActive('plague')); } catch (e) {}
            if (!act) return '须疫病正流行（世界事件进行中）——太平年头，药棚支不起来。';
        }
        if (d.gate === 'encounter') return '这事账面上办不成——得在街面上真撞见（低频街面事，绝不催办）。';
        return null;
    }
    function doGoodDeed(id) {
        var d = DEED_BY_ID[id];
        if (!d) return false;
        var city = inCityNow();
        if (!city) { msg('先进城再说——善举是做给一城人看的。', 'warning'); return false; }
        var led = ledgerOf(city);
        if (led.done[id]) { msg('「' + d.name + '」你在本城已经做过了——善举簿上记着第 ' + led.done[id] + ' 日那一笔。', 'info'); return false; }
        var gf = deedGateFail(d, city);
        if (gf) { msg(gf, 'warning'); return false; }
        var spec = { rep: d.rep, karma: d.karma, msg: d.icon + ' ' + d.doneText + '（城望+' + d.rep + '，功德簿记 ' + d.karma + ' 笔业消）', msgType: 'success' };
        if (d.cost) spec.stones = -d.cost;
        var res = applyTx(spec, city);
        if (!res) return false;
        markDeed(city, id);
        if (d.time && window.timeSystem && window.timeSystem.advanceTime) window.timeSystem.advanceTime(d.time, '行善');
        if (d.favor) pushFavor(city, d.favor);
        try { if (window.updateCurrencyUI) window.updateCurrencyUI(); } catch (e) {}
        openGoodDeeds();   // 牌面刷新：办成的那一行打上勾
        return true;
    }

    // ---- 人情账：到期自动上门报恩（新日结算，零按钮） ----
    function pushFavor(city, f) {
        var led = ledgerOf(city);
        if (!led || !f) return null;
        var fav = { kind: f.kind || 'favor', city: repKey(city), repayDay: absDayNow() + (Number(f.days) || 30), stones: Number(f.stones) || 0, rep: Number(f.rep) || 0, karma: Number(f.karma) || 0, text: f.text || '' };
        led.favors.push(fav);
        saveReputation();
        log('🤝 人情账记下一笔：' + (fav.text || fav.kind) .slice(0, 60) + '（这笔人情，日子到了自己会来还）', 'info');
        return fav;
    }
    function favorTick() {
        var today = absDayNow();
        var settled = 0;
        Object.keys(cityReputation).forEach(function (ck) {
            var led = null;
            try { led = ledgerOf(ck); } catch (e) { return; }
            if (!led || !led.favors.length) return;
            for (var i = led.favors.length - 1; i >= 0; i--) {
                var f = led.favors[i];
                if (today < f.repayDay) continue;
                led.favors.splice(i, 1);
                var spec = { msg: '🤝 ' + f.text, msgType: 'success' };
                if (f.stones) spec.stones = f.stones;
                if (f.rep) spec.rep = f.rep;
                if (f.karma) spec.karma = f.karma;
                var res = window.RewardService ? window.RewardService.apply(spec, { source: 'favor', city: ck }) : null;
                if (res && res.success !== false) {
                    (res.messages || []).forEach(function (m) { log(m, 'info'); });
                    if (typeof window.updateCurrencyUI === 'function') window.updateCurrencyUI();
                    settled++;
                } else {
                    led.favors.push(f);   // 交割不成：这笔人情放回去，明日再送——人情不会蒸发
                }
            }
        });
        if (settled) saveReputation();
        return settled;
    }

    // ---- 低频街面事 ----
    var _pendingEnc = null;   // { kind, city }（弹窗开着时才有值；点选项即清）
    function encounterTick() {
        var city = inCityNow();
        if (!city || _pendingEnc) return;
        if (window.currentCharData && window.currentCharData.flags && window.currentCharData.flags._gdInRetreat) return;
        var day = absDayNow();
        if (hasCharFlag('_gdLastEncDay') && day - Number(window.currentCharData.flags._gdLastEncDay) < ENC_GAP_DAYS) return;
        if (dice() >= ENC_P) return;
        var led = ledgerOf(city);
        var pool = [];
        if (!led.done.child && !(led.seen.child && day - led.seen.child < ENC_SEEN_CD)) pool.push('child');
        if (!hasCharFlag('_gdBully') && !(led.seen.bully && day - led.seen.bully < ENC_SEEN_CD)) pool.push('bully');
        if (!hasCharFlag('_gdOrphan') && !(led.seen.orphan && day - led.seen.orphan < ENC_SEEN_CD)) pool.push('orphan');
        if (!pool.length) return;
        var kind = pool[Math.floor(dice() * pool.length)];
        setCharFlag('_gdLastEncDay', day);
        led.seen[kind] = day;
        saveReputation();
        openEncounter(kind, city);
    }

    function modalBox(id, title, innerHtml) {
        var old = document.getElementById(id);
        if (old) old.remove();
        var modal = document.createElement('div');
        modal.id = id;
        modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
        modal.onclick = function (e) { if (e.target === modal) modal.remove(); };
        modal.innerHTML = '<div class="bg-gray-800 border-2 border-emerald-600 rounded-xl p-5 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">' +
            '<div class="flex justify-between mb-3"><h3 class="text-lg font-bold text-emerald-400">' + title + '</h3>' +
            '<button onclick="this.closest(\'.fixed\').remove()" class="text-gray-400 text-2xl">&times;</button></div>' + innerHtml + '</div>';
        document.body.appendChild(modal);
        return modal;
    }

    function openEncounter(kind, city) {
        _pendingEnc = { kind: kind, city: city };
        var body = '', btn = 'class="text-xs px-3 py-1.5 rounded mr-2 mt-2 text-white"';
        if (kind === 'child') {
            body = '<p class="text-sm text-gray-200">后巷里，两个人牙子正拖着一个哭哑了嗓子的孩子往骡车上塞——孩子的鞋掉了一只，那人怀里还露出半截迷药布。</p>'
                + '<div class="mt-3">'
                + '<button onclick="window._gdEncChoice(\'pay\')" ' + btn + ' style="background:#0e7490">💰 花钱赎回（150 灵石）</button>'
                + '<button onclick="window._gdEncChoice(\'fight\')" ' + btn + ' style="background:#b91c1c">⚔️ 动手抢人（成功率约 ' + Math.round(Math.min(85, 50 + realmIdxNow() * 6)) + '%）</button>'
                + '<button onclick="window._gdEncChoice(\'report\')" ' + btn + ' style="background:#4b5563">🕵️ 悄悄报官（五五开）</button>'
                + '<button onclick="window._gdEncChoice(\'walk\')" ' + btn + ' style="background:#374151">🚶 别开眼走开</button></div>';
        } else if (kind === 'bully') {
            body = '<p class="text-sm text-gray-200">街面上，一个恶霸正把卖菜老翁的摊子掀翻，白菜滚了一地。老翁跪着捡，恶霸踩着菜帮子笑：「这条街的管理费，懂？」</p>'
                + '<div class="mt-3">'
                + '<button onclick="window._gdEncChoice(\'stop\')" ' + btn + ' style="background:#b45309">✊ 上前喝止（成功率约 ' + Math.round(Math.min(90, 55 + realmIdxNow() * 6)) + '%）</button>'
                + '<button onclick="window._gdEncChoice(\'payoff\')" ' + btn + ' style="background:#0e7490">💰 掏钱平事（30 灵石）</button>'
                + '<button onclick="window._gdEncChoice(\'walk\')" ' + btn + ' style="background:#374151">🚶 绕道走</button></div>';
        } else if (kind === 'orphan') {
            body = '<p class="text-sm text-gray-200">贫坊墙角，一个咳血的老汉拉住你的衣角，怀里护着个三四岁的娃：「恩人……我熬不过这个冬天了。娃叫福儿，不贪嘴，会自己穿衣……求你，带他走。」</p>'
                + '<div class="mt-3">'
                + '<button onclick="window._gdEncChoice(\'take\')" ' + btn + ' style="background:#047857">🤱 接过孩子（长线人情）</button>'
                + '<button onclick="window._gdEncChoice(\'charity\')" ' + btn + ' style="background:#0e7490">🏮 托付善堂，出安置钱（50 灵石）</button>'
                + '<button onclick="window._gdEncChoice(\'walk\')" ' + btn + ' style="background:#374151">🚶 摇摇头走开</button></div>';
        }
        modalBox('gd-encounter-modal', '🌆 街面上撞见的事（' + city + '）', body);
    }

    function closeEnc() {
        _pendingEnc = null;
        var m = document.getElementById('gd-encounter-modal');
        if (m) m.remove();
    }
    function encChoice(choice) {
        var pend = _pendingEnc;
        if (!pend) return false;
        var city = pend.city, kind = pend.kind;
        closeEnc();
        var day = absDayNow();
        if (kind === 'child') {
            if (choice === 'pay') {
                var r = applyTx({ stones: -150, rep: 30, karma: 10, msg: '🧒 你把 150 灵石拍在人牙子手里：「这孩子，我买了。」人牙子掂掂钱袋，松了手。孩子回家的路上一直没敢说话，到家门口才哇地哭出来——他娘抱着他，冲你磕了三个头。（城望+30，功德簿重记一笔）', msgType: 'success' }, city);
                if (r) markDeed(city, 'child');
            } else if (choice === 'fight') {
                var p = Math.min(0.85, 0.5 + realmIdxNow() * 0.06);
                if (dice() < p) {
                    var r2 = applyTx({ rep: 35, karma: 12, msg: '🧒 你一步跨出去，两个人牙子还没看清来路就被撂倒在地。孩子救下了，围观的人叫好——有人认得那两人，报了官。（城望+35，功德簿重记一笔）', msgType: 'success' }, city);
                    if (r2) { markDeed(city, 'child'); deed('good', '你当街从人牙子手里抢回一个孩子——' + city + '的街坊都看见了'); }
                } else {
                    applyTx({ health: -20, qi: -15, rep: 5, karma: 2, msg: '🧒 人牙子有备而来，一把迷药粉撒过来——你眼前一花，他们拖着孩子上了骡车扬长而去。你挨了一下（伤-20，真气-15），但街坊都看见了你的义举（城望+5）。那孩子……这笔账你记下了，下回撞上，不会再输。', msgType: 'warning' }, city);
                }
            } else if (choice === 'report') {
                if (dice() < 0.5) {
                    var r3 = applyTx({ rep: 20, karma: 8, msg: '🧒 你绕到前头递了话给巡街的差役——城门口人赃并获，孩子当场救下。差役记了你的名姓：「又是你，好样的。」（城望+20）', msgType: 'success' }, city);
                    if (r3) markDeed(city, 'child');
                } else {
                    applyTx({ karma: 1, msg: '🧒 差役赶到时，巷子空了——人牙子嗅到风声提前走了。孩子没救下来，但你报了官，衙门的册子上记了一笔。（无功无过）', msgType: 'warning' }, city);
                }
            }
            // walk：什么都不发生——事没做完，账不烧，往后再撞见还能救
        } else if (kind === 'bully') {
            if (choice === 'stop') {
                setCharFlag('_gdBully', day || 1);
                var pb = Math.min(0.9, 0.55 + realmIdxNow() * 0.06);
                if (dice() < pb) {
                    applyTx({ rep: 12, karma: 4, msg: '✊ 你上前一步喝止，恶霸看清你的身手，悻悻收了手。围观的人齐声叫好，老翁拉着你的袖子直作揖。（城望+12）', msgType: 'success' }, city);
                    pushFavor(city, { kind: 'vendor', days: 30, stones: 60, rep: 3, text: '上回你喝止恶霸护住的卖菜老翁，托人捎来一篮时鲜菜和 60 灵石：「菜是自家种的，钱是攒的——恩人别嫌轻。」' });
                } else {
                    applyTx({ health: -10, qi: -10, rep: 4, karma: 2, msg: '✊ 恶霸带着几个帮手，你挨了两下（伤-10，真气-10）——但街坊围上来帮腔，恶霸终究没敢再掀摊子。老翁把最大的两颗白菜塞进你怀里。（城望+4）', msgType: 'warning' }, city);
                    pushFavor(city, { kind: 'vendor', days: 30, stones: 60, rep: 3, text: '上回你替卖菜老翁挨的拳头，老翁记着呢——托人捎来一篮时鲜菜和 60 灵石。' });
                }
            } else if (choice === 'payoff') {
                setCharFlag('_gdBully', day || 1);
                applyTx({ stones: -30, rep: 6, karma: 2, msg: '💰 你掏了 30 灵石替老翁平了这个月的「管理费」。恶霸数着钱走了，老翁在旁边直抹眼泪。（城望+6）', msgType: 'success' }, city);
                pushFavor(city, { kind: 'vendor', days: 20, stones: 30, text: '卖菜老翁攒了些日子，托人捎来 30 灵石：「那日的菜钱，不能总让恩人破费。」' });
            }
            // walk：走开不算数——这桩事日后再撞见，你还能管（每城歇十五日，不追着玩家）
        } else if (kind === 'orphan') {
            if (choice === 'take') {
                setCharFlag('_gdOrphan', day || 1);
                applyTx({ karma: 8, rep: 5, msg: '🤱 你接过福儿。老汉用尽力气磕了个头，当夜就走了。孩子在你安置的人家住了下来——这笔账，老天爷记着。（功德簿重记一笔）', msgType: 'success' }, city);
                pushFavor(city, { kind: 'orphan', days: 360, stones: 500, rep: 15, karma: 4, text: '福儿长大了——当年你从老汉怀里接过的娃娃，如今自己挣了份家业。他寻到城里来，放下 500 灵石和一坛埋了十年的酒：「爹说，我这条命是恩人给的。」' });
            } else if (choice === 'charity') {
                setCharFlag('_gdOrphan', day || 1);
                applyTx({ stones: -50, karma: 6, rep: 8, msg: '🏮 你把老汉和孩子一起送到善堂，又留下 50 灵石做安置钱。善堂管事应承：孩子由堂里养大。（城望+8，功德簿记一笔）', msgType: 'success' }, city);
            } else {
                setCharFlag('_gdOrphan', day || 1);   // 摇头也是答复——老汉只托这一回人
            }
        }
        try { if (window.updateCurrencyUI) window.updateCurrencyUI(); } catch (e) {}
        return true;
    }

    // ---- 善举名册牌面 ----
    function openGoodDeeds() {
        var city = inCityNow();
        if (!city) { msg('先进城再说——善举名册是善堂柜台上的账，城外没有柜台。', 'warning'); return false; }
        var led = ledgerOf(city);
        var day = absDayNow();
        var rows = GOOD_DEEDS.map(function (d) {
            var st, btnHtml = '';
            if (led.done[d.id]) {
                st = '<span class="text-emerald-400">✅ 已行（第 ' + led.done[d.id] + ' 日）</span>';
            } else {
                var gf = deedGateFail(d, city);
                if (gf) st = '<span class="text-gray-500">🔒 ' + gf + '</span>';
                else {
                    st = '<span class="text-amber-300">' + (d.cost ? d.cost + ' 灵石' : '不花灵石') + ' · 城望+' + d.rep + ' · 功德+' + d.karma + (d.time ? ' · 耗时 ' + d.time + ' 分' : '') + '</span>';
                    btnHtml = '<button onclick="window._doGoodDeedUI(\'' + d.id + '\')" class="text-xs bg-emerald-700 hover:bg-emerald-600 text-white px-2 py-1 rounded ml-2">行善</button>';
                }
            }
            return '<div class="bg-gray-700/40 p-3 rounded mb-2 border border-gray-600">' +
                '<div class="flex justify-between items-center"><p class="font-bold text-emerald-300 text-sm">' + d.icon + ' ' + d.name + '</p>' + btnHtml + '</div>' +
                '<p class="text-xs text-gray-400 mt-1">' + d.desc + '</p>' +
                '<p class="text-xs mt-1">' + st + '</p></div>';
        }).join('');
        // 里程碑链：挣来的摆出来，没挣来的写清差什么（禁止设计 #2：锁就亮锁）
        var n = Object.keys(led.done).length;
        var rep = getReputationValue(city);
        var mRows = MILESTONES.map(function (m) {
            var got = led.milestones.indexOf(m.id) >= 0;
            return '<p class="text-xs ' + (got ? 'text-yellow-300' : 'text-gray-500') + '">' + m.icon + ' ' + m.name +
                (got ? '（已立）' : '：善举 ' + m.deeds + ' 件 + 城望 ' + repNum(m.rep) + (n >= m.deeds || rep >= m.rep ? '（现 ' + n + ' 件 / ' + repNum(rep) + '）' : '')) + '</p>';
        }).join('');
        var favors = led.favors.length ? '<p class="text-xs text-cyan-300 mt-2">🤝 人情账在外 ' + led.favors.length + ' 笔——日子到了自己会来还，不用你惦记。</p>' : '';
        return !!modalBox('good-deeds-modal', '📜 善堂 · 善举名册（' + city + ' · 已行 ' + n + ' 件）',
            '<p class="text-xs text-gray-400 mb-2">管事翻出善举簿：「施主，这些是簿子上还没销的善事——每样在这座城只记一回，银钱、城望、功德，笔笔明账。」</p>' +
            rows + '<div class="border-t border-gray-600 mt-3 pt-2"><p class="text-xs text-gray-300 font-bold mb-1">🏛️ 声望里程碑（零按钮，善举与城望到了自己会来）</p>' + mRows + favors + '</div>');
    }

    // ---- 城情卡加一行（wrapper 正门：原函数一字不动） ----
    function panelLine(city) {
        try {
            city = repKey(city || getCurrentCityName());
            if (!city || !cityReputation[city] || !cityReputation[city].deeds) return '';
            var led = cityReputation[city].deeds;
            var n = Object.keys(led.done || {}).length;
            if (!n && !(led.milestones || []).length && !(led.favors || []).length) return '';
            var next = null;
            for (var i = 0; i < MILESTONES.length; i++) {
                if ((led.milestones || []).indexOf(MILESTONES[i].id) < 0) { next = MILESTONES[i]; break; }
            }
            return '<p class="rep-donate-note">📜 善举簿：已行 <b>' + n + '</b> 件' +
                ((led.milestones || []).length ? ' · 已立 ' + led.milestones.map(function (mid) {
                    var m = MILESTONES.filter(function (x) { return x.id === mid; })[0];
                    return m ? m.icon + m.name : mid;
                }).join('、') : '') +
                (next ? ' · 下一座【' + next.name + '】要善举 ' + next.deeds + ' 件 + 城望 ' + repNum(next.rep) : ' · 五座里程碑全立齐了') +
                '。（善举名册在<b>善堂</b>柜上）</p>';
        } catch (e) { return ''; }
    }
    function wrapPanel() {
        if (typeof window.getReputationPanelHtml !== 'function' || window.getReputationPanelHtml.__gdWrapped) return;
        var orig = window.getReputationPanelHtml;
        window.getReputationPanelHtml = function (city) {
            var html = orig(city);
            try { html = String(html || '') + panelLine(city); } catch (e) {}
            return html;
        };
        window.getReputationPanelHtml.__gdWrapped = true;
    }

    // ---- 新日订阅：人情账结算 + 街面事一骰（timeSystem B3 正门） ----
    (function subscribe() {
        function sub() {
            if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') {
                window.timeSystem.onNewDaySubscribe(function () { favorTick(); encounterTick(); });
            }
        }
        if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') sub();
        else if (typeof window.addEventListener === 'function') window.addEventListener('load', sub);
    })();
    wrapPanel();
    if (window.EventBus && typeof window.EventBus.on === 'function') hookMilestones();
    else if (typeof document !== 'undefined' && document.addEventListener) document.addEventListener('DOMContentLoaded', hookMilestones);

    window._doGoodDeedUI = function (id) { doGoodDeed(id); };
    window._gdEncChoice = encChoice;
    window.openGoodDeeds = openGoodDeeds;
    window.GoodDeeds = {
        GOOD_DEEDS: GOOD_DEEDS, MILESTONES: MILESTONES, ENC_P: ENC_P, ENC_GAP_DAYS: ENC_GAP_DAYS, ENC_SEEN_CD: ENC_SEEN_CD,
        open: openGoodDeeds, doGoodDeed: doGoodDeed, markDeed: markDeed, ledgerOf: ledgerOf,
        doneCount: doneCount, checkMilestones: checkMilestones,
        pushFavor: pushFavor, favorTick: favorTick, encounterTick: encounterTick,
        openEncounter: openEncounter, encChoice: encChoice, panelLine: panelLine,
        deedGateFail: deedGateFail, inCityNow: inCityNow
    };
})();
