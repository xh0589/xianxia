/**
 * xianxia-enhanced-shop.js - 增强商店系统
 * 从Degrees of Lewdity提取的商店功能
 */

// 确保gameLog存在
if (typeof window !== 'undefined' && !window.gameLog) {
    window.gameLog = {
        entries: [],
        add: function(msg, type) { console.log(`[${type}] ${msg}`); }
    };
}

// ==================== 商店类 ====================
class Shop {
    constructor(id, name, options = {}) {
        this.id = id;
        this.name = name;
        this.owner = options.owner || null; // NPC ID
        this.location = options.location || 'market';
        this.type = options.type || 'general'; // general, weapon, armor, alchemy, book, special
        
        // 库存
        this.inventory = options.inventory || [];
        
        // 价格系统
        this.priceMultiplier = options.priceMultiplier || 1.0;
        this.priceFluctuation = options.priceFluctuation || 0.1; // ±10%
        this.lastPriceUpdate = Date.now();
        this.priceUpdateInterval = options.priceUpdateInterval || 86400000; // 24小时
        
        // 商人属性
        this.merchant = {
            reputation: 0,      // 声望
            discount: 0,        // 折扣
            creditLimit: 0,     // 赊账额度
            creditUsed: 0,      // 已用赊账
            favoriteItems: [],  // 偏好物品
            personality: options.personality || {}
        };
        
        // 特殊功能
        this.specialFeatures = options.specialFeatures || [];
        this.customPrices = options.customPrices || {};
        
        // 刷新机制
        this.refreshInterval = options.refreshInterval || 0; // 0表示不刷新
        this.lastRefresh = Date.now();
        
        // 解锁条件
        this.unlockCondition = options.unlockCondition || null;
        this.isUnlocked = !options.unlockCondition || this.checkUnlockCondition();
    }
    
    checkUnlockCondition() {
        if (!this.unlockCondition) return true;
        
        for (const [key, requiredValue] of Object.entries(this.unlockCondition)) {
            const playerValue = this.getNestedValue(window.gameState || {}, key);
            if (typeof requiredValue === 'object' && requiredValue.operator) {
                switch (requiredValue.operator) {
                    case 'gt': if (!(playerValue > requiredValue.value)) return false; break;
                    case 'lt': if (!(playerValue < requiredValue.value)) return false; break;
                    case 'gte': if (!(playerValue >= requiredValue.value)) return false; break;
                    case 'lte': if (!(playerValue <= requiredValue.value)) return false; break;
                    case 'eq': if (!(playerValue === requiredValue.value)) return false; break;
                    default: if (playerValue < requiredValue) return false;
                }
            } else {
                if (playerValue < requiredValue) return false;
            }
        }
        return true;
    }
    
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current && current[key], obj);
    }
    
    // 获取物品价格
    getItemPrice(item) {
        // 自定义价格
        if (this.customPrices[item.id]) {
            return this.customPrices[item.id];
        }
        
        // P1-7: 按商店+物品+游戏日缓存价格
        var day = 0;
        try { day = window.timeSystem?.gameTime?.currentDay || 0; } catch(e) {}
        var cacheKey = this.id + '_' + item.id + '_' + day;
        if (this._priceCache && this._priceCache[cacheKey] != null) {
            return this._priceCache[cacheKey];
        }
        
        let basePrice = item.basePrice || 100;
        const fluctuation = 1 + (Math.random() * 2 - 1) * this.priceFluctuation;
        let price = Math.round(basePrice * fluctuation * this.priceMultiplier);
        // 缓存当日价格
        if (!this._priceCache) this._priceCache = {};
        this._priceCache[cacheKey] = price;
        // v7.1: 世界事件坊市繁荣 + 城市声望折扣
        if (typeof window.getCombinedShopPriceMultiplier === 'function') {
            try {
                var _city = (window.locationSystem && window.locationSystem.getCurrentLocation && window.locationSystem.getCurrentLocation()) || '';
                // v20.0：传 itemId 让 MarketDynamic 能按物品分类算地区差价
                price = Math.round(price * (window.getCombinedShopPriceMultiplier(_city, item.id || item.templateId) || 1));
            } catch (e) {}
        } else if (typeof window.getActiveWorldEventModifiers === 'function') {
            try {
                var wmod = window.getActiveWorldEventModifiers();
                if (wmod && wmod.shopPrice) price = Math.round(price * wmod.shopPrice);
            } catch (e) {}
        }
        if (typeof window.getReputationDiscount === 'function') {
            try {
                var city = (window.locationSystem && window.locationSystem.getCurrentLocation && window.locationSystem.getCurrentLocation()) || (window.currentCharData && window.currentCharData.location) || '';
                var disc = window.getReputationDiscount(city) || 0;
                if (disc > 0) price = Math.max(1, Math.round(price * (1 - disc)));
            } catch (e) {}
        }
        
        // 商人折扣
        price = Math.round(price * (1 - this.merchant.discount));
        
        // 玩家声望影响
        if (window.playerReputation) {
            const reputationDiscount = Math.min(0.2, window.playerReputation * 0.001);
            price = Math.round(price * (1 - reputationDiscount));
        }

        // F3: 口才影响商店价格（口才100→20%折扣）
        if (typeof window.getPlayerSpeechDiscount === 'function') {
            try {
                price = Math.max(1, Math.round(price * window.getPlayerSpeechDiscount()));
            } catch (e) {}
        } else if (window.currentCharData && window.currentCharData.lifeSkills) {
            const speech = window.currentCharData.lifeSkills['口才'] || 0;
            const discount = Math.floor(speech / 5); // 口才100→20
            price = Math.max(1, Math.round(price * (1 - discount / 100)));
        }
        
        return Math.max(1, price);
    }
    
    // F-7 重构：删除死代码 sellItem（v10.5 起物品出售统一走 inventory.js sellItem → markForSale → TradeService.executeSell），
    // 原 sellItem 固定 basePrice*0.5 绕过 TradeService 真回购率（0.25-0.35），可刷钱，且无人调用（grep 整个 js/ 无 .sellItem() 调用方）。
    // 物品出售链路现在统一为：UI → inventory.sellItem(uid) → markForSale → 商铺 TradeService.quoteSell / executeSell。

    // 购买物品（扣 inventory.currency.spiritStones，写入真实背包）
    buyItem(itemId, quantity = 1) {
        const item = this.inventory.find(i => i.id === itemId);
        if (!item) {
            showMessage('物品不存在', 'error');
            return false;
        }
        if (item.stock != null && item.stock <= 0) {
            showMessage('该商品已售罄', 'warning');
            return false;
        }

        const price = this.getItemPrice(item);
        const total = price * quantity;

        if (!window.inventory) {
            showMessage('背包系统未初始化', 'error');
            return false;
        }
        if (!window.inventory.currency) {
            window.inventory.currency = { copper: 0, spiritStones: 0 };
        }
        const stones = window.inventory.currency.spiritStones || 0;
        if (stones < total) {
            showMessage(`灵石不足（需要${total}，当前${stones}）`, 'error');
            return false;
        }

        // 映射商店内部ID到真实物品模板ID
        const idMap = {
            health_potion: 'vitality_pill',
            qi_potion: 'qi_recovery_pill',
            stamina_potion: 'energy_pill',
            exp_potion: 'exp_pill',
            pill_heal: 'vitality_pill',
            pill_qi: 'qi_recovery_pill',
            pill_breakthrough: 'foundation_pill',
            sword_basic: 'iron_sword',
            sword_silver: 'iron_sword',
            sword_magic: 'iron_sword'
        };
        const realId = idMap[itemId] || itemId;

        // 先尝试入包，失败则不扣费
        let added = false;
        if (typeof window.addItem === 'function') {
            added = !!window.addItem(realId, quantity);
        }
        if (!added && window.inventory.slots) {
            for (let i = 0; i < window.inventory.slots.length; i++) {
                const s = window.inventory.slots[i];
                if (s && s.templateId === realId) {
                    s.count += quantity;
                    added = true;
                    break;
                }
            }
            if (!added) {
                for (let i = 0; i < window.inventory.slots.length; i++) {
                    if (!window.inventory.slots[i]) {
                        window.inventory.slots[i] = {
                            templateId: realId,
                            name: item.name,
                            count: quantity,
                            icon: item.icon || '📦'
                        };
                        added = true;
                        break;
                    }
                }
            }
        }
        if (!added) {
            showMessage('背包已满，无法购买', 'error');
            return false;
        }

        window.inventory.currency.spiritStones = stones - total;
        if (item.stock != null) item.stock -= quantity;
        try {
            if (typeof window.addReputationFromTrade === 'function') {
                var _c = (window.locationSystem && window.locationSystem.getCurrentLocation && window.locationSystem.getCurrentLocation()) || '';
                if (_c) window.addReputationFromTrade(_c, total);
            }
        } catch (e) {}

        if (window.gameLog?.add) window.gameLog.add(`从${this.name}购买了 ${quantity}x ${item.name}，花费 ${total} 灵石`, 'info');
        showMessage(`购买成功：${item.name} ×${quantity}（-${total}灵石）`, 'success');
        if (window.updateInventoryUI) window.updateInventoryUI();
        if (window.updateCurrencyUI) window.updateCurrencyUI();
        if (window.updateCharacterStatus) window.updateCharacterStatus();
        return true;
    }
    
    // 检查能否使用赊账
    canUseCredit(amount) {
        const limit = this.merchant.creditLimit;
        const used = this.merchant.creditUsed;
        return (limit - used) >= amount;
    }
    
    // 使用赊账
    useCredit(amount) {
        this.merchant.creditUsed += amount;
        playerDebt = (playerDebt || 0) + amount;
    }
    
    // 偿还赊账
    repayCredit(amount) {
        const actualRepay = Math.min(amount, this.merchant.creditUsed);
        this.merchant.creditUsed -= actualRepay;
        playerDebt = Math.max(0, (playerDebt || 0) - actualRepay);
        playerGold -= actualRepay;
        return actualRepay;
    }
    
    // 更新价格
    updatePrices() {
        this.lastPriceUpdate = Date.now();
        // 价格会在getItemPrice时动态计算
    }
    
    // 刷新库存（每日：基础货架 + 3件特殊限时商品 + 季节价格）
    refreshInventory() {
        this.lastRefresh = Date.now();

        // 季节价格波动
        const season = window.timeSystem?.gameTime?.currentSeason || 'spring';
        let seasonMul = 1.0;
        if (season === 'spring' && (this.type === 'alchemy' || this.type === 'general')) {
            seasonMul = 0.85; // 春季草药/丹药降价
        } else if (season === 'autumn' && this.type === 'general') {
            seasonMul = 0.9;
        } else if (season === 'winter') {
            seasonMul = 1.1;
        } else if (season === 'summer' && this.type === 'weapon') {
            seasonMul = 1.05;
        }
        this.priceMultiplier = Math.max(0.5, (this._basePriceMultiplier || this.priceMultiplier || 1.0) * seasonMul);
        if (!this._basePriceMultiplier) this._basePriceMultiplier = 1.0;

        // 特殊限时商品：每日随机最多3件
        const specialPool = [
            { id: 'foundation_pill', name: '筑基丹', type: 'consumable', basePrice: 150, description: '限时特供筑基丹', icon: '🧪', limited: true },
            { id: 'iron_ore', name: '精铁', type: 'material', basePrice: 20, description: '限时矿石', icon: '⛏️', limited: true },
            { id: 'spirit_grass', name: '灵草', type: 'material', basePrice: 18, description: '限时灵草', icon: '🌿', limited: true },
            { id: 'vitality_pill', name: '回春丹', type: 'consumable', basePrice: 45, description: '限时丹药', icon: '💊', limited: true },
            { id: 'iron_sword', name: '玄铁剑', type: 'weapon', basePrice: 220, description: '限时兵器', icon: '⚔️', limited: true },
            { id: 'exp_potion', name: '修为丹', type: 'consumable', basePrice: 180, description: '限时修为丹', icon: '✨', limited: true }
        ];
        // 清掉旧限时商品
        this.inventory = (this.inventory || []).filter(i => !i.limited);
        const picks = specialPool.sort(() => Math.random() - 0.5).slice(0, 3).map(s => ({
            ...s,
            stock: 1 + Math.floor(Math.random() * 2),
            basePrice: Math.round(s.basePrice * (0.9 + Math.random() * 0.3))
        }));
        this.inventory = this.inventory.concat(picks);
        this.specialGoods = picks;

        if (typeof gameLog !== 'undefined' && gameLog.add) {
            gameLog.add(`${this.name} 刷新了库存（含${picks.length}件限时商品，季节系数x${seasonMul.toFixed(2)}）`, 'info');
        }
    }
    
    // 增加商人好感度
    increaseReputation(amount) {
        this.merchant.reputation += amount;
        
        // 好感度高给予折扣
        if (this.merchant.reputation > 100) {
            this.merchant.discount = Math.min(0.2, this.merchant.reputation * 0.0005);
        }
        
        // 好感度高提高赊账额度
        if (this.merchant.reputation > 50) {
            this.merchant.creditLimit = this.merchant.reputation * 10;
        }
    }
    
    // 获取商店信息
    getInfo() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            location: this.location,
            itemCount: this.inventory.length,
            merchantReputation: this.merchant.reputation,
            merchantDiscount: this.merchant.discount,
            creditAvailable: this.merchant.creditLimit - this.merchant.creditUsed,
            isUnlocked: this.isUnlocked
        };
    }
    
    // 序列化
    serialize() {
        return {
            id: this.id,
            name: this.name,
            owner: this.owner,
            location: this.location,
            type: this.type,
            inventory: this.inventory,
            priceMultiplier: this.priceMultiplier,
            merchant: this.merchant,
            customPrices: this.customPrices,
            isUnlocked: this.isUnlocked,
            lastPriceUpdate: this.lastPriceUpdate,
            lastRefresh: this.lastRefresh
        };
    }
    
    // 反序列化
    static deserialize(data) {
        const shop = new Shop(data.id, data.name, {
            owner: data.owner,
            location: data.location,
            type: data.type,
            inventory: data.inventory,
            priceMultiplier: data.priceMultiplier,
            specialFeatures: data.specialFeatures
        });
        shop.merchant = data.merchant || shop.merchant;
        shop.customPrices = data.customPrices || {};
        shop.isUnlocked = data.isUnlocked;
        shop.lastPriceUpdate = data.lastPriceUpdate;
        shop.lastRefresh = data.lastRefresh;
        return shop;
    }
}

// ==================== 商店管理器 ====================
class ShopManager {
    constructor() {
        this.shops = new Map();
        this.playerShops = []; // 玩家经营的商店
        this.marketplace = []; // 拍卖行
    }
    
    // 添加商店
    addShop(shop) {
        if (shop instanceof Shop) {
            this.shops.set(shop.id, shop);
            gameLog.add(`商店 "${shop.name}" 已加入世界`, 'info');
            return true;
        }
        return false;
    }
    
    // 移除商店
    removeShop(shopId) {
        const shop = this.shops.get(shopId);
        if (shop) {
            this.shops.delete(shopId);
            return true;
        }
        return false;
    }
    
    // 获取商店
    getShop(shopId) {
        return this.shops.get(shopId);
    }
    
    // 获取所有商店
    getAllShops() {
        return Array.from(this.shops.values());
    }
    
    // 按类型获取商店
    getShopsByType(type) {
        return this.getAllShops().filter(s => s.type === type && s.isUnlocked);
    }
    
    // 按位置获取商店
    getShopsByLocation(location) {
        return this.getAllShops().filter(s => s.location === location && s.isUnlocked);
    }
    
    // 打开商店界面
    openShop(shopId) {
        const shop = this.shops.get(shopId);
        if (!shop || !shop.isUnlocked) {
            showMessage('商店未解锁', 'error');
            return false;
        }

        // P2-8: 跨天清理旧回购列表
        try {
            var today = (window.timeSystem && window.timeSystem.gameTime) ? window.timeSystem.gameTime.currentDay : 0;
            if (this._lastBuybackDay == null || this._lastBuybackDay !== today) {
                if (typeof this.clearBuyback === 'function') {
                    Object.keys(this._buybackItems).forEach(function(id) { this.clearBuyback(id); }.bind(this));
                }
                this._lastBuybackDay = today;
            }
        } catch (e) {}

        // 显示商店界面
        showShopDialog(shop);
        return true;
    }
    
    // 刷新所有商店价格
    refreshAllPrices() {
        for (const shop of this.getAllShops()) {
            shop.updatePrices();
        }
    }
    
    // 刷新所有商店库存
    refreshAllInventory() {
        for (const shop of this.getAllShops()) {
            if (!shop._basePriceMultiplier) {
                shop._basePriceMultiplier = shop.priceMultiplier || 1.0;
            }
            shop.refreshInventory();
        }
        if (window.showMessage) {
            window.showMessage('各坊市货架已刷新，出现了限时特供！', 'info');
        }
    }
    
    // 序列化
    serialize() {
        return Array.from(this.shops.values()).map(s => s.serialize());
    }
    
    // 反序列化
    deserialize(data) {
        this.shops.clear();
        for (const shopData of data) {
            const shop = Shop.deserialize(shopData);
            this.shops.set(shop.id, shop);
        }
    }
}

// ==================== TradeService 统一交易服务（v10.5） ====================
const TradeService = {
    // 已生成的报价缓存
    _quotes: {},
    _quoteIdCounter: 0,
    _buybackItems: {},  // shopId -> [{ uid, templateId, name, count, buybackPrice, originalItem }]

    // 货币分层：根据物品类型决定支付货币
    getCurrencyType: function(template) {
        if (!template) return 'spiritStones';
        var type = template.type || '';
        var subtype = template.subtype || '';
        var category = template.category || '';
        var quality = template.quality || 'COMMON';
        var id = template.id || '';
        
        // 普通食物、木材、低阶矿石 → 铜钱
        if (subtype === 'food' || subtype === 'ingredient' || type === 'food') return 'copper';
        if (id === 'mat_iron_ore' || id === 'mat_copper_ore' || id === 'wood' || id === 'stone') return 'copper';
        if (category === 'material' && quality === 'COMMON') return 'copper';
        
        // 丹药、符箓、灵材、低阶法器 → 灵石
        if (subtype === 'pill' || subtype === 'talisman' || subtype === 'herb') return 'spiritStones';
        if (type === 'consumable') return 'spiritStones';
        if (type === 'weapon' || type === 'armor' || type === 'accessory') return 'spiritStones';
        
        // 高阶法宝 → 灵石（未来可扩展为拍卖）
        if (quality === 'EPIC' || quality === 'LEGENDARY' || quality === 'MYTHIC') return 'spiritStones';
        
        // 默认灵石
        return 'spiritStones';
    },
    
    // 获取基础回收率（商店类型相关）
    getBaseBuybackRate: function(shopType) {
        var rates = {
            'general': 0.35,   // 杂货铺 35%
            'weapon': 0.40,    // 铁匠铺 40%（武器/防具）
            'armor': 0.40,
            'alchemy': 0.30,   // 药铺 30%（只收药材丹药）
            'book': 0.25,      // 书阁 25%（只收功法）
            'special': 0.30,   // 黑市 30%
            'pawn': 0.20       // 当铺 20%（什么都收但压价）
        };
        return rates[shopType] || 0.35;
    },
    
    // 获取地区倍率
    getRegionMultiplier: function(location) {
        if (!location) return 1.0;
        var regionMul = {
            '中州': 1.2,   // 中州繁华，价格高
            '东荒': 0.8,
            '南疆': 0.9,
            '西漠': 0.7,
            '北冥': 0.85,
            '蜀地': 1.1,
            '东南海域': 1.0
        };
        // 尝试从locationSystem获取地区
        var region = '';
        if (window.locationSystem && window.locationSystem.getRegionByLocation) {
            try { region = window.locationSystem.getRegionByLocation(location); } catch (e) {}
        }
        return regionMul[region] || 1.0;
    },
    
    // 获取商人需求修正（商店类型对物品类别的偏好）
    getMerchantDemandModifier: function(shopType, template) {
        if (!template) return 1.0;
        var type = template.type || '';
        var subtype = template.subtype || '';
        var category = template.category || '';
        
        // 偏好定义：商店类型偏好哪些类型
        var preferences = {
            'general': { multiplier: 1.0 },  // 杂货铺什么都收，但价格低
            'weapon': { type: ['weapon'], subtype: ['sword', 'dao', 'spear'], multiplier: 1.4 },
            'armor': { type: ['armor'], subtype: ['robe', 'armor'], multiplier: 1.4 },
            'alchemy': { type: ['consumable'], subtype: ['pill', 'herb'], multiplier: 1.5 },
            'book': { type: ['secret_art'], multiplier: 1.3 },
            'special': { quality: ['RARE', 'EPIC', 'LEGENDARY'], multiplier: 1.2 },
            'pawn': { multiplier: 0.8 }  // 当铺压价
        };
        
        var pref = preferences[shopType] || preferences.general;
        if (pref.type && pref.type.indexOf(type) < 0) return 0.5; // 不收购的类型，半价
        if (pref.subtype && pref.subtype.indexOf(subtype) < 0 && pref.type) return 0.6; // 不收购的子类型
        if (pref.quality && pref.quality.indexOf(template.quality) < 0) return 0.6;
        
        // 偏好类型加成
        var inPref = false;
        if (pref.type && pref.type.indexOf(type) >= 0) inPref = true;
        if (pref.subtype && pref.subtype.indexOf(subtype) >= 0) inPref = true;
        if (pref.quality && pref.quality.indexOf(template.quality) >= 0) inPref = true;
        
        return inPref ? pref.multiplier : 1.0;
    },
    
    // 获取物品状态修正（耐久度）
    getDurabilityModifier: function(item) {
        if (item.durability == null) return 1.0;
        var maxDurability = 100;
        var ratio = item.durability / maxDurability;
        if (ratio >= 0.8) return 1.0;
        if (ratio >= 0.5) return 0.8;
        if (ratio >= 0.3) return 0.6;
        return 0.4;
    },
    
    // 获取口才修正
    getSpeechModifier: function() {
        var speech = 0;
        if (window.currentCharData && window.currentCharData.lifeSkills) {
            speech = window.currentCharData.lifeSkills['口才'] || 0;
        }
        // 口才每5点增加1%售价，最高+20%（口才100）
        return 1.0 + Math.min(0.2, speech / 5 * 0.01);
    },
    
    // 获取声望修正
    getReputationModifier: function(location) {
        if (!location) return 1.0;
        var rep = 0;
        if (typeof window.getCityReputation === 'function') {
            try { rep = window.getCityReputation(location) || 0; } catch (e) {}
        }
        // 声望每100点增加1%售价，最高+10%
        return 1.0 + Math.min(0.1, rep / 100 * 0.01);
    },
    
    // 生成报价
    quoteSell: function(shopId, itemUid, quantity) {
        var shop = window.shopManager ? window.shopManager.getShop(shopId) : null;
        if (!shop) {
            if (window.showMessage) window.showMessage('商店不存在', 'error');
            return null;
        }
        
        // 查找背包物品
        var slot = null;
        for (var i = 0; i < window.inventory.slots.length; i++) {
            var s = window.inventory.slots[i];
            if (s && s.uid === itemUid) { slot = s; break; }
        }
        if (!slot) {
            if (window.showMessage) window.showMessage('物品不存在', 'error');
            return null;
        }
        
        var template = slot.getTemplate();
        if (!template) return null;
        
        quantity = quantity || slot.count;
        quantity = Math.min(quantity, slot.count);
        if (quantity <= 0) return null;
        
        // === 报价计算 ===
        var basePrice = template.price || template.basePrice || 0;
        var baseBuybackRate = this.getBaseBuybackRate(shop.type);
        var regionMul = this.getRegionMultiplier(shop.location);
        var demandMul = this.getMerchantDemandModifier(shop.type, template);
        var durabilityMul = this.getDurabilityModifier(slot);
        var speechMul = this.getSpeechModifier();
        var repMul = this.getReputationModifier(shop.location);
        
        var finalUnitPrice = Math.max(1, Math.floor(
            basePrice * baseBuybackRate * regionMul * demandMul * durabilityMul * speechMul * repMul
        ));
        var totalPrice = finalUnitPrice * quantity;
        var currency = this.getCurrencyType(template);
        
        // 生成报价ID
        this._quoteIdCounter++;
        var quoteId = 'quote_' + Date.now() + '_' + this._quoteIdCounter;
        
        var quote = {
            id: quoteId,
            shopId: shopId,
            itemUid: itemUid,
            templateId: slot.templateId,
            quantity: quantity,
            basePrice: basePrice,
            baseBuybackRate: baseBuybackRate,
            regionMul: regionMul,
            demandMul: demandMul,
            durabilityMul: durabilityMul,
            speechMul: speechMul,
            repMul: repMul,
            finalUnitPrice: finalUnitPrice,
            totalPrice: totalPrice,
            currency: currency,
            timestamp: Date.now(),
            // 过期时间：5分钟
            expiresAt: Date.now() + 5 * 60 * 1000,
            itemName: template.name || template.id,
            itemIcon: template.icon || '📦'
        };
        
        this._quotes[quoteId] = quote;
        return quote;
    },
    
    // 执行出售
    executeSell: function(quoteId) {
        var quote = this._quotes[quoteId];
        if (!quote) {
            if (window.showMessage) window.showMessage('报价已过期或无效', 'error');
            return false;
        }
        
        // 检查报价是否过期
        if (Date.now() > quote.expiresAt) {
            delete this._quotes[quoteId];
            if (window.showMessage) window.showMessage('报价已过期，请重新询价', 'warning');
            return false;
        }
        
        // 查找背包物品
        var slotIdx = -1;
        var slot = null;
        for (var i = 0; i < window.inventory.slots.length; i++) {
            var s = window.inventory.slots[i];
            if (s && s.uid === quote.itemUid) { slot = s; slotIdx = i; break; }
        }
        if (!slot || slot.count < quote.quantity) {
            if (window.showMessage) window.showMessage('物品数量不足', 'error');
            delete this._quotes[quoteId];
            return false;
        }
        
        var template = slot.getTemplate();
        if (!template) return false;

        // F-8 修复：之前在扣减后生成快照，归零时 slots[slotIdx]=null，count 变 0 → 回购数量错。
        // 现在先快照再扣减，并把 currency 传给 _addToBuyback（之前 currency 从未写入，回购永远按 spiritStones 扣款）。
        var itemSnapshot = null;
        if (slot && typeof slot.toJSON === 'function') {
            try { itemSnapshot = slot.toJSON(); } catch(e) {}
        } else if (slot) {
            try { itemSnapshot = JSON.parse(JSON.stringify(slot)); } catch(e) {}
        }
        var buybackCurrency = quote.currency;

        // 扣除物品
        slot.count -= quote.quantity;
        if (slot.count <= 0) {
            window.inventory.slots[slotIdx] = null;
        }
        
        // 发放货币
        var currency = quote.currency;
        if (currency === 'copper') {
            window.inventory.currency.copper = (window.inventory.currency.copper || 0) + quote.totalPrice;
            if (window.currentCharData) window.currentCharData.copper = window.inventory.currency.copper;
        } else {
            if (window.XianXia && window.XianXia.DataManager && typeof window.XianXia.DataManager.addSpiritStones === 'function') {
                window.XianXia.DataManager.addSpiritStones(quote.totalPrice);
            } else {
                window.inventory.currency.spiritStones = (window.inventory.currency.spiritStones || 0) + quote.totalPrice;
                if (window.currentCharData) window.currentCharData.spiritStones = window.inventory.currency.spiritStones;
            }
        }
        
        // 物品进入商店回购列表（用预扣减快照 + currency）
        this._addToBuyback(quote.shopId, itemSnapshot, template, quote.quantity, quote.totalPrice, buybackCurrency);
        
        // 清理报价
        delete this._quotes[quoteId];
        
        // 更新UI
        if (window.updateInventoryUI) window.updateInventoryUI();
        if (window.updateCurrencyUI) window.updateCurrencyUI();
        
        if (window.showMessage) {
            var currencyName = currency === 'copper' ? '铜钱' : '灵石';
            window.showMessage('出售成功！获得 ' + quote.totalPrice + ' ' + currencyName, 'success');
        }
        
        return true;
    },
    
    // 添加到回购列表
    // F-8 修复：itemSnapshot 改为外部传入（executeSell 在扣减前生成），避免归零时 count=0；
    // 增加 currency 参数（之前 currency 从未写入，回购永远按 spiritStones 扣款——铜钱物品出售得铜钱，回购却扣灵石）
    _addToBuyback: function(shopId, itemSnapshot, template, quantity, sellPrice, currency) {
        if (!this._buybackItems[shopId]) {
            this._buybackItems[shopId] = [];
        }
        // 回购价格 = 出售价的120%
        var buybackPrice = Math.floor(sellPrice * 1.2);
        this._buybackItems[shopId].push({
            uid: 'buyback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            templateId: itemSnapshot ? (itemSnapshot.templateId || (template ? template.id : 'unknown')) : (template ? template.id : 'unknown'),
            name: template ? (template.name || template.id) : '未知物品',
            icon: template ? (template.icon || '📦') : '📦',
            quantity: quantity,
            sellPrice: sellPrice,
            buybackPrice: buybackPrice,
            currency: currency || 'spiritStones', // F-8 修复：保存出售时所用货币，回购按相同货币扣款
            timestamp: Date.now(),
            itemSnapshot: itemSnapshot
        });
        // 限制回购列表最多20条
        if (this._buybackItems[shopId].length > 20) {
            this._buybackItems[shopId].shift();
        }
    },
    
    // 获取商店回购列表
    getBuybackItems: function(shopId) {
        return this._buybackItems[shopId] || [];
    },
    
    // 执行回购
    buybackItem: function(shopId, buybackId) {
        var list = this._buybackItems[shopId];
        if (!list) return false;
        
        var idx = -1;
        for (var i = 0; i < list.length; i++) {
            if (list[i].uid === buybackId) { idx = i; break; }
        }
        if (idx < 0) return false;
        
        var item = list[idx];
        var cost = item.buybackPrice;
        
        // P1-9: 先加物品再扣款，检查结果
        var addOk = false;
        if (item.itemSnapshot && typeof window.restoreItemFromSnapshot === 'function') {
            addOk = window.restoreItemFromSnapshot(item.itemSnapshot);
        } else if (typeof window.addItem === 'function') {
            addOk = window.addItem(item.templateId, item.quantity);
        }
        if (!addOk) {
            if (window.showMessage) window.showMessage('回购失败：背包已满或物品错误', 'error');
            return false;
        }
        
        // 扣钱（P1-10: 使用对应货币）
        var currency = item.currencyType || 'spiritStones';
        if (currency === 'spiritStones') {
            if (window.inventory.currency.spiritStones < cost) {
                if (typeof window.removeItem === 'function') window.removeItem(item.templateId, item.quantity);
                if (window.showMessage) window.showMessage('灵石不足！需要 ' + cost + ' 灵石', 'error');
                return false;
            }
            window.inventory.currency.spiritStones -= cost;
        } else if (currency === 'copper') {
            if (window.inventory.currency.copper < cost) {
                if (typeof window.removeItem === 'function') window.removeItem(item.templateId, item.quantity);
                if (window.showMessage) window.showMessage('铜钱不足！需要 ' + cost + ' 铜钱', 'error');
                return false;
            }
            window.inventory.currency.copper -= cost;
        }
        
        // 从回购列表移除
        list.splice(idx, 1);
        
        if (window.updateInventoryUI) window.updateInventoryUI();
        if (window.updateCurrencyUI) window.updateCurrencyUI();
        
        if (window.showMessage) {
            window.showMessage('回购成功：' + item.name + ' x' + item.quantity + '（花费 ' + cost + ' 灵石）', 'success');
        }
        return true;
    },
    
    // 清除商店回购列表（商店刷新时调用）
    clearBuyback: function(shopId) {
        delete this._buybackItems[shopId];
    },
    
    // 序列化
    serialize: function() {
        return {
            buybackItems: this._buybackItems,
            quoteIdCounter: this._quoteIdCounter
        };
    },
    
    // 反序列化
    deserialize: function(data) {
        if (data) {
            this._buybackItems = data.buybackItems || {};
            this._quoteIdCounter = data.quoteIdCounter || 0;
        }
    }
};

// 挂载到window
window.TradeService = TradeService;

// ==================== 商店对话框 ====================
function closeShopModals() {
    const buildingModal = document.getElementById('building-effect-modal');
    if (buildingModal) buildingModal.remove();
    document.querySelectorAll('.shop-modal-overlay').forEach(m => m.remove());
}

// ==================== 报价明细弹出 ====================
function showQuoteDetail(quote) {
    if (!quote) return;
    var currencyName = quote.currency === 'copper' ? '铜钱' : '灵石';
    var dlg = document.createElement('div');
    dlg.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-[60]';
    dlg.onclick = function(e) { if (e.target === dlg) dlg.remove(); };
    dlg.innerHTML = `
        <div class="bg-gray-800 border border-gray-600 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 class="text-lg font-bold text-white mb-4">📋 报价明细 — ${quote.itemIcon} ${quote.itemName}</h3>
            <div class="space-y-2 text-sm">
                <div class="flex justify-between"><span class="text-gray-400">基础价值</span><span class="text-white">${quote.basePrice} ${currencyName}</span></div>
                <div class="flex justify-between"><span class="text-gray-400">基础回收率</span><span class="text-white">${Math.round(quote.baseBuybackRate * 100)}%</span></div>
                <div class="flex justify-between"><span class="text-gray-400">地区倍率</span><span class="text-white">×${quote.regionMul.toFixed(2)}</span></div>
                <div class="flex justify-between"><span class="text-gray-400">商人需求修正</span><span class="text-white">×${quote.demandMul.toFixed(2)}</span></div>
                <div class="flex justify-between"><span class="text-gray-400">物品状态修正</span><span class="text-white">×${quote.durabilityMul.toFixed(2)}</span></div>
                <div class="flex justify-between"><span class="text-gray-400">口才修正</span><span class="text-white">×${quote.speechMul.toFixed(2)}</span></div>
                <div class="flex justify-between"><span class="text-gray-400">声望修正</span><span class="text-white">×${quote.repMul.toFixed(2)}</span></div>
                <div class="border-t border-gray-600 pt-2 mt-2">
                    <div class="flex justify-between"><span class="text-gray-400">单价</span><span class="text-yellow-400 font-bold">${quote.finalUnitPrice} ${currencyName}</span></div>
                    <div class="flex justify-between"><span class="text-gray-400">数量</span><span class="text-white">${quote.quantity}</span></div>
                    <div class="flex justify-between text-lg"><span class="text-gray-300">总价</span><span class="text-yellow-400 font-bold">${quote.totalPrice} ${currencyName}</span></div>
                </div>
            </div>
            <div class="flex gap-2 justify-end mt-4">
                <button onclick="TradeService.executeSell('${quote.id}'); this.closest('.fixed').remove(); closeShopModals();" class="bg-green-600 hover:bg-green-500 px-4 py-2 rounded text-white font-bold">确认出售</button>
                <button onclick="this.closest('.fixed').remove()" class="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded text-white">取消</button>
            </div>
        </div>
    `;
    document.body.appendChild(dlg);
}

function showShopDialog(shop) {
    if (!shop) return;
    closeShopModals();

    const stones = window.inventory?.currency?.spiritStones ?? 0;
    const copper = window.inventory?.currency?.copper ?? 0;
    
    // 获取标记待售物品
    var markedItems = (typeof window.getMarkedForSaleItems === 'function') ? window.getMarkedForSaleItems() : [];
    
    // 获取回购物品
    var buybackItems = TradeService.getBuybackItems(shop.id);
    
    var markedHtml = '';
    if (markedItems.length === 0) {
        markedHtml = '<p class="text-gray-500 text-sm">暂无标记待售的物品，请在背包中标记物品后前来出售</p>';
    } else {
        markedHtml = markedItems.map(function(slot) {
            var tpl = slot.getTemplate && slot.getTemplate();
            if (!tpl) return '';
            var quote = TradeService.quoteSell(shop.id, slot.uid, slot.count);
            var priceStr = quote ? (quote.totalPrice + ' ' + (quote.currency === 'copper' ? '铜钱' : '灵石')) : '询价中';
            return `
                <div class="flex items-center justify-between bg-gray-800 p-3 rounded border border-yellow-700/50">
                    <div>
                        <div class="font-bold text-gray-200">🏷️ ${tpl.icon || ''} ${tpl.name || slot.templateId}</div>
                        <div class="text-xs text-gray-400">数量: ${slot.count}${quote ? ' | 单价: ' + quote.finalUnitPrice + ' ' + (quote.currency === 'copper' ? '铜钱' : '灵石') : ''}</div>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-yellow-500 font-bold text-sm">${priceStr}</span>
                        <button onclick="var q = TradeService.quoteSell('${shop.id}', '${slot.uid}', ${slot.count}); if(q) showQuoteDetail(q);"
                            class="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs">报价明细</button>
                        <button onclick="TradeService.executeSell(TradeService.quoteSell('${shop.id}', '${slot.uid}', ${slot.count}).id); this.closest('.shop-modal-overlay').remove();"
                            class="px-2 py-1 bg-green-600 hover:bg-green-500 rounded text-xs">出售</button>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    var buybackHtml = '';
    if (buybackItems.length === 0) {
        buybackHtml = '<p class="text-gray-500 text-sm">暂无回购物品</p>';
    } else {
        buybackHtml = buybackItems.map(function(item) {
            return `
                <div class="flex items-center justify-between bg-gray-800/50 p-2 rounded border border-gray-700">
                    <span class="text-sm text-gray-300">${item.icon || ''} ${item.name} x${item.quantity}</span>
                    <div class="flex items-center gap-2">
                        <span class="text-yellow-500 text-xs">${item.buybackPrice} 灵石</span>
                        <button onclick="TradeService.buybackItem('${shop.id}', '${item.uid}'); this.closest('.shop-modal-overlay').remove();"
                            class="px-2 py-1 bg-purple-600 hover:bg-purple-500 rounded text-xs">回购</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    const content = `
        <div class="space-y-4">
            <div class="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                <div class="flex justify-between items-center mb-2">
                    <h3 class="text-xl font-bold text-yellow-500">${shop.icon || '🏪'} ${shop.name}</h3>
                    <span class="text-sm text-gray-400">类型: ${shop.type}</span>
                </div>
                <div class="grid grid-cols-3 gap-2 text-sm">
                    <div><span class="text-gray-400">灵石:</span> <span class="text-yellow-300 font-bold">💎 ${stones}</span></div>
                    <div><span class="text-gray-400">铜钱:</span> <span class="text-yellow-300 font-bold">💰 ${copper}</span></div>
                    <div><span class="text-gray-400">标记待售:</span> <span class="text-yellow-400 font-bold">${markedItems.length}件</span></div>
                </div>
            </div>

            <!-- 剩余任务#3：药铺/坊市时价对照出关见闻 -->
            ${window.__buildShopPriceTag && window.__buildShopPriceTag() || ''}

            <!-- Tab 导航 -->
            <div class="flex border-b border-gray-600 mb-2">
                <button class="tab-btn px-4 py-2 text-sm font-bold text-yellow-400 border-b-2 border-yellow-400" data-tab="buy" onclick="switchShopTab(this, 'buy')">🛒 购买</button>
                <button class="tab-btn px-4 py-2 text-sm text-gray-400 hover:text-white" data-tab="sell" onclick="switchShopTab(this, 'sell')">🏷️ 出售 (${markedItems.length})</button>
                <button class="tab-btn px-4 py-2 text-sm text-gray-400 hover:text-white" data-tab="buyback" onclick="switchShopTab(this, 'buyback')">🔄 回购 (${buybackItems.length})</button>
            </div>

            <!-- 购买 Tab -->
            <div id="shop-tab-buy" class="shop-tab">
                <div class="max-h-64 overflow-y-auto space-y-2">
                    ${(shop.inventory || []).map(item => {
                        const price = shop.getItemPrice(item);
                        const soldOut = item.stock != null && item.stock <= 0;
                        const limited = item.limited ? '<span class="text-xs text-red-400">限时</span>' : '';
                        return `
                        <div class="flex items-center justify-between bg-gray-800 p-3 rounded border border-gray-600 ${soldOut ? 'opacity-50' : ''}">
                            <div>
                                <div class="font-bold text-gray-200">${item.icon || ''} ${item.name} ${limited}</div>
                                <div class="text-xs text-gray-400">${item.description || ''}${item.stock != null ? ` · 库存${item.stock}` : ''}</div>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="text-yellow-500 font-bold">${price} 灵石</span>
                                <button onclick="buyFromEnhancedShop('${shop.id}', '${item.id}')"
                                    class="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm" ${soldOut ? 'disabled' : ''}>购买</button>
                            </div>
                        </div>`;
                    }).join('') || '<p class="text-gray-500 text-sm">暂无商品</p>'}
                </div>
            </div>

            <!-- 出售 Tab -->
            <div id="shop-tab-sell" class="shop-tab" style="display:none">
                <div class="max-h-64 overflow-y-auto space-y-2">
                    ${markedHtml}
                </div>
                <div class="mt-2 text-xs text-gray-500">
                    💡 在背包中标记物品为"待售"，然后来此出售。价格受地区、商人类型、口才、声望影响。
                </div>
            </div>

            <!-- 回购 Tab -->
            <div id="shop-tab-buyback" class="shop-tab" style="display:none">
                <div class="max-h-48 overflow-y-auto space-y-1">
                    ${buybackHtml}
                </div>
                <div class="mt-2 text-xs text-gray-500">
                    💡 出售给商店的物品可在当日以120%价格回购。商店刷新后清空。
                </div>
            </div>
        </div>
    `;

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50 shop-modal-overlay';
    modal.id = 'shop-modal-overlay';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    modal.innerHTML = `
        <div class="bg-gray-800 border-2 border-yellow-500 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[85vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-yellow-500">${shop.name}</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            ${content}
        </div>
    `;
    document.body.appendChild(modal);
}

// 剩余任务#3：药铺/坊市时价标签 + 对照出关见闻快照（返回 HTML 或空串）
window.__buildShopPriceTag = function () {
    if (!window.MarketDynamic || typeof window.MarketDynamic.priceMul !== 'function') return '';
    try {
        var city = '中州';
        if (window.WorldLoop && typeof window.WorldLoop.mapMarketCity === 'function') {
            var loc = (window.locationSystem && window.locationSystem.getCurrentLocation && window.locationSystem.getCurrentLocation()) || '';
            city = window.WorldLoop.mapMarketCity(loc);
        } else if (window.currentCharData && window.currentCharData.location) {
            city = window.currentCharData.location;
        }
        var cats = ['丹药', '药材', '矿材', '法器'];
        var parts = [];
        var snap = window.currentCharData && window.currentCharData._retreatMarket;
        for (var i = 0; i < cats.length; i++) {
            var cat = cats[i];
            var mul = window.MarketDynamic.priceMul(city, cat);
            if (typeof mul !== 'number') continue;
            var tag = mul <= 0.85 ? '贱' : (mul >= 1.15 ? '贵' : '平');
            var color = mul <= 0.85 ? 'text-green-400' : (mul >= 1.15 ? 'text-red-400' : 'text-gray-300');
            var cmp = '';
            // 与出关见闻快照对照：涨/跌/平
            if (snap && snap.muls && typeof snap.muls[cat] === 'number') {
                var d = mul - snap.muls[cat];
                if (Math.abs(d) < 0.02) cmp = '<span class="text-gray-500">平</span>';
                else if (d > 0) cmp = '<span class="text-amber-400">较出关↑' + d.toFixed(2) + '</span>';
                else cmp = '<span class="text-sky-400">较出关↓' + Math.abs(d).toFixed(2) + '</span>';
            }
            parts.push('<span class="text-xs ' + color + '">' + cat + tag + '×' + mul.toFixed(2) + '</span>' + (cmp ? '<span class="text-xs"> ' + cmp + '</span>' : ''));
        }
        if (!parts.length) return '';
        var snapNote = snap ? ('（第 ' + snap.day + ' 日出关时价）') : '（出关后可对照见闻）';
        return '<div class="bg-gray-900/60 border border-gray-700 p-2 rounded mb-2 text-sm flex flex-wrap gap-2">' +
            '<span class="text-yellow-500 font-bold">📊 本城时价 ' + snapNote + '</span>' + parts.join('<span class="text-gray-600"> | </span>') + '</div>';
    } catch (e) { return ''; }
};

// Tab 切换
function switchShopTab(btn, tabName) {
    document.querySelectorAll('.tab-btn').forEach(function(b) {
        b.classList.remove('text-yellow-400', 'border-b-2', 'border-yellow-400');
        b.classList.add('text-gray-400');
    });
    btn.classList.add('text-yellow-400', 'border-b-2', 'border-yellow-400');
    btn.classList.remove('text-gray-400');
    document.querySelectorAll('.shop-tab').forEach(function(t) { t.style.display = 'none'; });
    var tab = document.getElementById('shop-tab-' + tabName);
    if (tab) tab.style.display = 'block';
}

// ==================== 全局购买/出售函数（专用名，避免被 app/inventory 覆盖） ====================
function buyFromEnhancedShop(shopId, itemId) {
    const manager = window.shopManager;
    if (!manager) {
        showMessage('商店系统未初始化', 'error');
        return false;
    }
    const shop = manager.getShop(shopId);
    if (!shop) {
        showMessage('商店不存在', 'error');
        return false;
    }
    const ok = shop.buyItem(itemId, 1);
    if (ok) {
        showShopDialog(shop);
    }
    return ok;
}

function sellToEnhancedShop(shopId, templateId) {
    // v10.5: 废弃旧直接出售方式，引导使用标记出售
    if (window.showMessage) {
        window.showMessage('请先在背包中标记物品为"待售"，然后来此完成出售', 'info');
    }
    return false;
}

// 兼容旧名：若参数像 shopId+itemId 则走增强商店
function buyFromShop(shopIdOrItemId, itemIdOrPrice) {
    if (typeof itemIdOrPrice === 'string' && window.shopManager?.getShop(shopIdOrItemId)) {
        return buyFromEnhancedShop(shopIdOrItemId, itemIdOrPrice);
    }
    // inventory 风格 (itemId, price)
    if (typeof window.buyFromInventoryShop === 'function' && typeof itemIdOrPrice === 'number') {
        return window.buyFromInventoryShop(shopIdOrItemId, itemIdOrPrice);
    }
    // 旧建筑按钮只传 itemId：使用模板标价，避免出现无价购买。
    if (typeof itemIdOrPrice === 'undefined' && typeof window.buyFromInventoryShop === 'function') {
        const template = window.itemById && window.itemById[shopIdOrItemId];
        if (template && Number(template.price) > 0) return window.buyFromInventoryShop(shopIdOrItemId, Number(template.price));
    }
    showMessage('购买参数无效', 'error');
    return false;
}

function sellToShop(shopId, itemId) {
    return sellToEnhancedShop(shopId, itemId);
}

// ==================== 初始化 ====================
function initShopSystem() {
    window.shopManager = new ShopManager();
    window.Shop = Shop;
    window.ShopManager = ShopManager;
    
    // 初始化 TradeService
    if (!window.TradeService) {
        window.TradeService = TradeService;
    }
    
    // 添加预设商店
    for (const shop of PresetShops) {
        shopManager.addShop(shop);
    }
    
    gameLog.add('商店系统已初始化', 'info');
}

// ==================== 预设商店 ====================
const PresetShops = [
    new Shop('shop_general', '万宝阁', {
        type: 'general',
        location: 'market',
        owner: 'merchant_01',
        inventory: [
            { id: 'pill_small_recovery', name: '小还丹', type: 'consumable', basePrice: 15, description: '恢复30点生命', icon: '💊' },
            { id: 'pill_qi_powder', name: '补气散', type: 'consumable', basePrice: 20, description: '恢复20点真气', icon: '💊' },
            { id: 'pill_energy_powder', name: '精力散', type: 'consumable', basePrice: 15, description: '恢复20点精力', icon: '💊' },
            { id: 'pill_big_recovery', name: '大还丹', type: 'consumable', basePrice: 40, description: '恢复80点生命', icon: '💊' },
            { id: 'pill_qi_gather', name: '聚气丹', type: 'consumable', basePrice: 50, description: '恢复60点真气', icon: '💊' },
            { id: 'pill_energy_return', name: '回力丹', type: 'consumable', basePrice: 40, description: '恢复50点精力', icon: '💊' },
            { id: 'food_steamed_bun', name: '馒头', type: 'consumable', basePrice: 2, description: '恢复10点精力', icon: '🍞' },
            { id: 'food_roast_meat', name: '烤肉', type: 'consumable', basePrice: 10, description: '恢复20精力+10HP', icon: '🍖' },
        ],
        merchant: {
            reputation: 0,
            discount: 0,
            creditLimit: 500,
            personality: { friendly: true, cunning: false }
        }
    }),
    
    new Shop('shop_weapon', '神兵阁', {
        type: 'weapon',
        location: 'market',
        owner: 'weapon_master',
        inventory: [
            { id: 'wpn_iron_sword', name: '铁剑', type: 'weapon', basePrice: 40, description: '基础铁剑', icon: '⚔️', attack: 6 },
            { id: 'wpn_bronze_sword', name: '青铜剑', type: 'weapon', basePrice: 80, description: '古铜铸造', icon: '⚔️', attack: 8 },
            { id: 'wpn_dark_iron_sword', name: '玄铁剑', type: 'weapon', basePrice: 200, description: '玄铁打造', icon: '⚔️', attack: 15 },
            { id: 'wpn_dragon_spring', name: '龙泉剑', type: 'weapon', basePrice: 400, description: '名匠打造', icon: '⚔️', attack: 22 },
            { id: 'wpn_frost_moon', name: '霜月剑', type: 'weapon', basePrice: 800, description: '寒铁铸成', icon: '⚔️', attack: 30 },
            { id: 'wpn_gan_jiang', name: '干将剑', type: 'weapon', basePrice: 3000, description: '上古名剑', icon: '⚔️', attack: 50 },
            { id: 'spec_enhance_stone', name: '强化石', type: 'material', basePrice: 80, description: '辅助强化', icon: '🪨' },
            { id: 'spec_transfer_stone', name: '转移石', type: 'material', basePrice: 500, description: '转移强化等级', icon: '🔮' },
        ],
        merchant: {
            reputation: 20,
            discount: 0.05,
            creditLimit: 1000,
            personality: { friendly: false, strict: true }
        }
    }),
    
    new Shop('shop_armor', '玄甲铺', {
        type: 'armor',
        location: 'market',
        inventory: [
            { id: 'arm_cloth_robe', name: '布衣', type: 'armor', basePrice: 15, description: '基础防具', icon: '👘', defense: 3 },
            { id: 'arm_leather_armor', name: '皮甲', type: 'armor', basePrice: 40, description: '皮革甲', icon: '🛡️', defense: 6 },
            { id: 'arm_chain_mail', name: '锁子甲', type: 'armor', basePrice: 150, description: '铁锁甲', icon: '🛡️', defense: 12 },
            { id: 'arm_dark_iron_armor', name: '玄铁甲', type: 'armor', basePrice: 300, description: '玄铁重甲', icon: '🛡️', defense: 18 },
            { id: 'arm_golden_silk_armor', name: '金丝甲', type: 'armor', basePrice: 600, description: '金丝编织', icon: '🛡️', defense: 25 },
            { id: 'arm_dragon_scale_armor', name: '龙鳞甲', type: 'armor', basePrice: 800, description: '龙鳞制成', icon: '🛡️', defense: 30 },
        ],
        merchant: {
            reputation: 10,
            discount: 0,
            creditLimit: 800
        }
    }),
    
    new Shop('shop_alchemy', '炼丹房', {
        type: 'alchemy',
        location: 'sect_main',
        owner: 'alchemist',
        inventory: [
            { id: 'pill_spring_recovery', name: '回春丹', type: 'consumable', basePrice: 100, description: '恢复200点生命', icon: '💊' },
            { id: 'pill_qi_return', name: '回灵丹', type: 'consumable', basePrice: 120, description: '恢复150点真气', icon: '💊' },
            { id: 'pill_energy_gather', name: '聚神丹', type: 'consumable', basePrice: 100, description: '恢复120点精力', icon: '💊' },
            { id: 'pill_foundation', name: '筑基丹', type: 'consumable', basePrice: 500, description: '筑基成功率+30%', icon: '💊' },
            { id: 'pill_golden_core', name: '金丹丹', type: 'consumable', basePrice: 2000, description: '金丹成功率+20%', icon: '💊' },
            { id: 'pill_marrow_wash', name: '洗髓丹', type: 'consumable', basePrice: 3000, description: '全属性+5', icon: '💊' },
        ],
        merchant: {
            reputation: 30,
            discount: 0.1,
            creditLimit: 0
        }
    }),
    
    new Shop('shop_book', '藏经阁', {
        type: 'book',
        location: 'sect_main',
        inventory: [
            { id: 'art_breathing', name: '吐纳术', type: 'secret_art', basePrice: 20, description: '基础呼吸法', icon: '📖' },
            { id: 'art_sword_basic', name: '基础剑法', type: 'secret_art', basePrice: 30, description: '入门剑法', icon: '⚔️' },
            { id: 'art_wind_sword', name: '清风剑法', type: 'secret_art', basePrice: 300, description: '清灵剑法', icon: '⚔️' },
            { id: 'art_hun_yuan', name: '混元功', type: 'secret_art', basePrice: 200, description: '混元心法', icon: '📖' },
            { id: 'art_taiji_sword', name: '太极剑法', type: 'secret_art', basePrice: 1800, description: '太极剑意', icon: '☯️' },
            { id: 'art_lingbo', name: '凌波微步', type: 'secret_art', basePrice: 2000, description: '凌波之妙', icon: '💨' },
        ],
        merchant: {
            reputation: 50,
            discount: 0.15,
            creditLimit: 0
        }
    })
];




// ==================== v7.2 分城动态商店 ====================
var CITY_SHOP_TYPE_FILTERS = {
    general: function(it) { return true; },
    medicine: function(it) {
        return it.type === 'consumable' || it.subtype === 'pill' || it.subtype === 'herb' || it.category === 'consumable'
            || (it.id && (String(it.id).indexOf('pill_') === 0 || String(it.id).indexOf('mat_') === 0 && /草|参|芝|莲|药/.test(it.name || '')));
    },
    talisman: function(it) {
        return it.subtype === 'talisman' || (it.id && String(it.id).indexOf('tal_') === 0);
    },
    weapon: function(it) {
        return it.type === 'weapon' || it.subtype === 'sword' || it.subtype === 'dao' || it.subtype === 'spear'
            || it.slot === 'mainHand' || (it.id && String(it.id).indexOf('wpn_') === 0);
    },
    armor: function(it) {
        return it.type === 'armor' || it.slot === 'body' || it.slot === 'head'
            || (it.id && String(it.id).indexOf('arm_') === 0);
    },
    art: function(it) {
        return it.type === 'secret_art' || it.category === 'secret_art' || (it.id && String(it.id).indexOf('art_') === 0);
    },
    special: function(it) {
        return it.quality === 'RARE' || it.quality === 'EPIC' || it.quality === 'LEGENDARY'
            || (it.id && String(it.id).indexOf('spec_') === 0);
    }
};

var REGION_SHOP_BIAS = {
    '中州': ['consumable', 'secret_art', 'weapon'],
    '东荒': ['consumable', 'material', 'herb'],
    '南疆': ['weapon', 'material', 'consumable'],
    '西漠': ['material', 'weapon', 'armor'],
    '北冥': ['armor', 'material', 'consumable'],
    '蜀地': ['weapon', 'secret_art', 'talisman'],
    '东南海域': ['consumable', 'material', 'special']
};

// ==================== v15.1 秘籍货架过滤：渠道分层 + 境界门 + 稀缺溢价 ====================
// 背景（v13.1遗留待办）：秘籍自注册进全物品库后，general 滤网 `return true` 使其可随机上任何货架，
// 练气号攒几百灵石即可白嫖绝技，架空了掉落12%/流浪修士传授两条主渠道。
// 规则：功法阁(art)=秘籍正店——RARE保底1本 + 35%追加高阶，价×1.5；
//       黑市(special)=稀罕货——仅EPIC以上、40%空手、至多1本，价×3；
//       其余店型与城市特产匹配一律禁入（pushItem统一闸）。
// 境界门：RARE需炼气(0)、EPIC需筑基(1)、LEGENDARY需金丹(2)，不足不上架（非灰锁，保持货架干净）。
// 掉落/传授/搜刮三条既有获取渠道不受影响；货架不入档，改动即时生效、零迁移。
var MANUAL_SHELF_RULES = {
    art:     { mode: 'art', priceMul: 1.5, highChance: 0.35 },
    special: { mode: 'black', minRank: 1, emptyChance: 0.4, priceMul: 3.0 }
};
var MANUAL_QUALITY_REALM = { RARE: 0, EPIC: 1, LEGENDARY: 2 };

function qualityRank(q) {
    return q === 'LEGENDARY' ? 2 : q === 'EPIC' ? 1 : 0;
}

function playerManualRealmIndex() {
    var r = window.currentCharData && window.currentCharData.realm;
    if (!r || !window.REALM_CONFIG || !Array.isArray(window.REALM_CONFIG.realms)) return 0;
    var realms = window.REALM_CONFIG.realms;
    var i = realms.findIndex(function (x) { return x.name === r; });
    if (i < 0) i = realms.findIndex(function (x) { return String(r).indexOf(x.name) === 0; }); // 容错'筑基期'等带缀写法
    return i < 0 ? 0 : i;
}

function getAllItemTemplates() {
    var map = window.itemById || {};
    var list = Object.keys(map).map(function(k) { return map[k]; }).filter(Boolean);
    if (list.length) return list;
    if (window.allItems && window.allItems.length) return window.allItems;
    var arrs = [window.weapons, window.armor, window.consumables, window.materials, window.secretArts];
    var out = [];
    arrs.forEach(function(a) { if (a && a.length) out = out.concat(a); });
    return out;
}

function generateCityShopInventory(cityName, shopType) {
    shopType = shopType || 'general';
    var cityInfo = (window.locationSystem && window.locationSystem.cityData && window.locationSystem.cityData[cityName]) || {};
    var region = cityInfo.region || '';
    var specialties = cityInfo.specialties || [];
    var buyMod = (cityInfo.priceModifier && cityInfo.priceModifier.buy) || 1.0;
    var filter = CITY_SHOP_TYPE_FILTERS[shopType] || CITY_SHOP_TYPE_FILTERS.general;
    var all = getAllItemTemplates();
    var pool = [];
    var seen = {};

    function pushItem(it, stockBonus) {
        if (!it || !it.id || seen[it.id]) return;
        if (it.subtype === 'manual') return; // v15.1：秘籍不走通用货架（含特产匹配段），仅下方专属投放段上架
        if (it.price == null && it.basePrice == null) return;
        // 跳过纯任务无价
        var price = it.price != null ? it.price : it.basePrice;
        if (price <= 0 && shopType !== 'special') return;
        seen[it.id] = true;
        var stock = 1 + Math.floor(Math.random() * 4);
        if (it.quality === 'EPIC' || it.quality === 'LEGENDARY') stock = 1;
        if (stockBonus) stock += stockBonus;
        pool.push({
            id: it.id,
            name: it.name || it.id,
            type: it.type || 'item',
            basePrice: Math.max(1, Math.floor(price * buyMod)),
            description: it.desc || it.description || '',
            icon: it.icon || '📦',
            stock: stock,
            attack: it.combatBonus && it.combatBonus.attack,
            defense: it.defense
        });
    }

    // 1) 特产强制
    specialties.forEach(function(spec) {
        all.forEach(function(it) {
            if (it.name && it.name.indexOf(spec) >= 0) pushItem(it, 2);
            else if (it.desc && String(it.desc).indexOf(spec) >= 0) pushItem(it, 1);
        });
    });

    // 2) 过滤池
    var candidates = all.filter(function(it) {
        try { return filter(it); } catch (e) { return false; }
    });
    // 地区偏向：打乱后多取
    for (var i = candidates.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = candidates[i]; candidates[i] = candidates[j]; candidates[j] = tmp;
    }
    var target = shopType === 'general' ? 28 : 18;
    for (var k = 0; k < candidates.length && pool.length < target; k++) {
        // 一般店降低传说出现率
        var it = candidates[k];
        if (it.quality === 'LEGENDARY' && Math.random() > 0.08) continue;
        if (it.quality === 'EPIC' && Math.random() > 0.25) continue;
        pushItem(it, 0);
    }

    // 2.5) v15.1 秘籍专属投放（功法阁正店/黑市稀罕；其余店型已被 pushItem 闸拒之门外）
    var mRule = MANUAL_SHELF_RULES[shopType];
    if (mRule && !(mRule.emptyChance && Math.random() < mRule.emptyChance)) {
        var myIdx = playerManualRealmIndex();
        var realmOK = all.filter(function (it) {
            if (!it || it.subtype !== 'manual') return false;
            var need = MANUAL_QUALITY_REALM[it.quality] != null ? MANUAL_QUALITY_REALM[it.quality] : 99;
            return myIdx >= need && qualityRank(it.quality) >= (mRule.minRank || 0);
        });
        var mPicks = [];
        if (mRule.mode === 'art') {
            var rares = realmOK.filter(function (m) { return m.quality === 'RARE'; });
            var highs = realmOK.filter(function (m) { return m.quality === 'EPIC' || m.quality === 'LEGENDARY'; });
            if (rares.length) mPicks.push(rares[Math.floor(Math.random() * rares.length)]);           // RARE保底1本
            if (highs.length && Math.random() < (mRule.highChance != null ? mRule.highChance : 0.35)) // 35%追加高阶
                mPicks.push(highs[Math.floor(Math.random() * highs.length)]);
        } else if (realmOK.length) {
            mPicks.push(realmOK[Math.floor(Math.random() * realmOK.length)]);
        }
        mPicks.forEach(function (m) {
            if (!m || seen[m.id]) return;
            seen[m.id] = true;
            var p = m.price != null ? m.price : (m.basePrice || 0);
            pool.push({
                id: m.id,
                name: m.name || m.id,
                type: m.type || 'consumable',
                basePrice: Math.max(1, Math.floor(p * buyMod * (mRule.priceMul || 1))),
                description: m.desc || m.description || '',
                icon: m.icon || '📜',
                stock: 1
            });
        });
    }

    // 3) 保底日常
    var guarantees = ['pill_small_recovery', 'pill_qi_powder', 'pill_energy_powder', 'mat_iron_ore', 'mat_lingzhi', 'food_steamed_bun'];
    guarantees.forEach(function(id) {
        var it = (window.itemById && window.itemById[id]) || null;
        if (it) pushItem(it, 3);
    });

    if (pool.length === 0) {
        guarantees.forEach(function(id) {
            pool.push({ id: id, name: id, type: 'consumable', basePrice: 20, description: '', icon: '📦', stock: 3 });
        });
    }
    return pool;
}

function ensureCityShop(cityName, shopType) {
    shopType = shopType || 'general';
    if (!window.shopManager) {
        if (typeof initShopSystem === 'function') initShopSystem();
    }
    if (!window.shopManager) return null;

    var safe = String(cityName || 'unknown').replace(/[^\w\u4e00-\u9fa5]/g, '');
    var shopId = 'city_' + safe + '_' + shopType;

    var existing = window.shopManager.getShop(shopId);
    var day = 0;
    try {
        if (typeof window.getAbsoluteDay === 'function') {
            day = window.getAbsoluteDay();
        } else if (window.timeSystem && window.timeSystem.gameTime) {
            var gt = window.timeSystem.gameTime;
            day = gt.currentDay || gt.totalDays || gt.day || 0;
        }
    } catch (e) {}

    if (existing) {
        // 隔日刷新
        if (existing._genDay != null && existing._genDay !== day) {
            existing.inventory = generateCityShopInventory(cityName, shopType);
            existing._genDay = day;
        }
        return shopId;
    }

    var inv = generateCityShopInventory(cityName, shopType);
    var typeName = {
        general: '坊市', medicine: '药铺', talisman: '符箓店', weapon: '兵器铺',
        armor: '防具铺', art: '功法阁', special: '黑市'
    }[shopType] || '商店';
    var shop = new Shop(shopId, cityName + '·' + typeName, {
        type: shopType === 'art' ? 'book' : (shopType === 'medicine' ? 'alchemy' : shopType),
        location: cityName,
        inventory: inv,
        priceMultiplier: 1.0,
        priceFluctuation: 0.08
    });
    shop._genDay = day;
    shop._cityName = cityName;
    window.shopManager.addShop(shop);
    return shopId;
}

window.generateCityShopInventory = generateCityShopInventory;
window.ensureCityShop = ensureCityShop;
window.CITY_SHOP_TYPE_FILTERS = CITY_SHOP_TYPE_FILTERS;

// ==================== 导出 ====================
if (typeof window !== 'undefined') {
    window.Shop = Shop;
    window.ShopManager = ShopManager;
    window.PresetShops = PresetShops;
    window.initShopSystem = initShopSystem;
    window.showShopDialog = showShopDialog;
    window.closeShopModals = closeShopModals;
    window.buyFromEnhancedShop = buyFromEnhancedShop;
    window.sellToEnhancedShop = sellToEnhancedShop;
    window.buyFromShop = buyFromShop;
    window.sellToShop = sellToShop;
    // v10.5 新增导出
    window.TradeService = TradeService;
    window.showQuoteDetail = showQuoteDetail;
    window.switchShopTab = switchShopTab;
}
