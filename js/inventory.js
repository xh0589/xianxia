// ==================== inventory.js - 背包系统 ====================
// 借鉴《太吾绘卷》、《觅长生》的背包设计

// ============ 背包配置 ============
const INVENTORY_CONFIG = {
    INITIAL_SLOTS: 30,      // 初始格子数
    MAX_SLOTS: 99,          // 最大格子数
    COPPER_PER_SLOT: 10,    // 每扩展10格需要铜钱
    CATEGORIES: ['all', 'weapon', 'armor', 'accessory', 'consumable', 'material', 'secret_art', 'quest', 'currency'],
    QUALITIES: ['all', 'COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'],
    SORT_OPTIONS: { NAME_ASC: 'name_asc', NAME_DESC: 'name_desc', PRICE_ASC: 'price_asc', PRICE_DESC: 'price_desc', QUALITY_DESC: 'quality_desc', QUALITY_ASC: 'quality_asc', COUNT_DESC: 'count_desc', COUNT_ASC: 'count_asc' }
};

// ============ 已学功法列表 ============
let learnedSecrets = window.learnedSecrets || [];
if (!window.learnedSecrets) {
    window.learnedSecrets = learnedSecrets;
}

// ============ 装备属性加成缓存 ============
let equippedStatsCache = {
    attrs: {},           // 基础属性加成
    combatBonus: {},     // 战斗属性加成
    special: []          // 特殊效果
};

// ============ 背包数据 ============
let inventory = {
    slots: [],              // 背包格子数组
    maxSlots: INVENTORY_CONFIG.INITIAL_SLOTS,
    currency: {
        copper: 100,          // 初始铜钱
        spiritStones: 10    // 初始灵石
    },
    expanded: false,        // 是否已扩展
    filter: 'all',           // 当前筛选类别
    // v10.0 新增：搜索、排序、品质筛选、收藏保护
    searchQuery: '',         // 搜索关键词
    qualityFilter: 'all',    // 品质筛选
    sortBy: 'count_desc',    // 排序方式
    favorites: new Set(),    // 收藏物品UID集合
    // 批量出售模式
    batchSellMode: false,
    batchSellSelection: [],   // 批量出售选中的UID列表
    // v10.5 出售系统重构：标记出售
    markedForSale: new Set()  // 标记为待售的物品UID集合
};

// ============ 物品实例类 ============
class ItemInstance {
    constructor(templateId, count = 1) {
        this.uid = this.generateUID();
        this.templateId = templateId;
        this.count = count;
        this.durability = null; // 武器/防具有耐久
        this.customProps = {};  // 自定义属性
        this.markedForSale = false; // v10.5: 是否标记为待售
    }
    
    generateUID() {
        return 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // 获取物品模板
    getTemplate() {
        return window.itemById?.[this.templateId] || null;
    }

    // F-7 重构：标记出售的物品不可使用/装备/丢弃（与 UI 提示"已标记为待售"一致）。
    // 抽到 ItemInstance 内部，所有调用方统一问"canBe*"，避免守卫散落多处。
    isMarkedForSale() {
        return !!this.markedForSale || (window.inventory && window.inventory.markedForSale && window.inventory.markedForSale.has(this.uid));
    }
    canBeUsed(reason) {
        if (this.isMarkedForSale()) {
            if (typeof window.showMessage === 'function') window.showMessage('该物品已标记为待售，无法使用' + (reason ? '（' + reason + '）' : ''), 'warning');
            return false;
        }
        return true;
    }
    canBeEquipped() {
        if (this.isMarkedForSale()) {
            if (typeof window.showMessage === 'function') window.showMessage('该物品已标记为待售，无法装备', 'warning');
            return false;
        }
        return true;
    }
    canBeDiscarded() {
        if (this.isMarkedForSale()) {
            if (typeof window.showMessage === 'function') window.showMessage('该物品已标记为待售，请先取消标记或到商铺完成交易', 'warning');
            return false;
        }
        return true;
    }
    
    // 增加数量
    addCount(add) {
        const template = this.getTemplate();
        if (!template) return false;
        
        const newCount = this.count + add;
        if (newCount <= 0) {
            this.count = 0;
            return true;
        }
        
        if (template.stackable && template.maxStack) {
            if (this.count + add > template.maxStack) {
                // 超过堆叠上限，需要拆分
                const remain = add - (template.maxStack - this.count);
                this.count = template.maxStack;
                // 返回剩余数量，由调用者处理
                return remain;
            }
        }
        
        this.count = newCount;
        return true;
    }
    
    // 减少数量
    removeCount(remove) {
        const result = this.addCount(-remove);
        if (result !== true && result !== undefined) {
            // 还有剩余需要处理
            return result;
        }
        if (this.count <= 0) {
            this.count = 0;
            return true; // 可以移除
        }
        return false;
    }
}

// ============ 初始化背包 ============
function initInventory(startItems = []) {
    // 清空背包
    inventory.slots = [];
    for (let i = 0; i < inventory.maxSlots; i++) {
        inventory.slots.push(null);
    }
    
    // 添加初始物品
    for (const item of startItems) {
        addItem(item, 1);
    }
}

// ============ 添加物品 ============
function addItem(templateId, count = 1) {
    // B2：正确堆叠拆分；返回是否全部放入
    count = Math.max(0, Math.floor(Number(count) || 0));
    if (count <= 0) return true;
    const template = window.itemById?.[templateId];
    if (!template) {
        console.warn('物品模板不存在: ' + templateId);
        return false;
    }

    let remaining = count;
    const maxStack = (template.stackable && template.maxStack) ? template.maxStack : (template.stackable ? 99 : 1);

    // 1) 先填已有堆
    if (template.stackable) {
        for (const slot of inventory.slots) {
            if (!slot || !slot.templateId) continue;
            if (slot.templateId !== templateId && !(slot.getTemplate && slot.getTemplate() && slot.getTemplate().id === templateId)) continue;
            const room = Math.max(0, maxStack - (slot.count || 0));
            if (room <= 0) continue;
            const put = Math.min(room, remaining);
            slot.count = (slot.count || 0) + put;
            remaining -= put;
            if (remaining <= 0) {
                if (typeof updateInventoryUI === 'function') updateInventoryUI();
                return true;
            }
        }
    }

    // 2) 新格子，每格不超过 maxStack
    while (remaining > 0) {
        let emptyIdx = -1;
        for (let i = 0; i < inventory.slots.length; i++) {
            if (!inventory.slots[i]) { emptyIdx = i; break; }
        }
        if (emptyIdx < 0) {
            if (inventory.slots.length < inventory.maxSlots) {
                emptyIdx = inventory.slots.length;
                inventory.slots.push(null);
            } else {
                console.warn('背包已满！未能放入 ' + templateId + ' x' + remaining);
                if (typeof updateInventoryUI === 'function') updateInventoryUI();
                return false;
            }
        }
        const put = template.stackable ? Math.min(maxStack, remaining) : 1;
        inventory.slots[emptyIdx] = new ItemInstance(templateId, put);
        remaining -= put;
        if (!template.stackable && remaining > 0) {
            // 不可堆叠：继续占新格
            continue;
        }
    }
    
    // P1：物品获得事件 - 发射 item:obtained 事件供任务系统订阅
    if (typeof window.EventBus !== 'undefined') {
        window.EventBus.emit('item:obtained', {
            itemId: templateId,
            itemName: template.name,
            itemType: template.type,
            subtype: template.subtype,
            category: template.category,
            tags: template.tags || [],
            count: count - remaining, // 实际添加的数量
            source: 'inventory_add'
        });
    }
    
    if (typeof updateInventoryUI === 'function') updateInventoryUI();
    return true;
}

// ============ 移除物品 ============
function removeItem(uid, count = 1) {
    const slot = inventory.slots.findIndex(s => s && s.uid === uid);
    if (slot === -1) return false;
    
    const instance = inventory.slots[slot];
    instance.removeCount(count);
    
    if (instance.count <= 0) {
        inventory.slots[slot] = null;
    }
    
    return true;
}

// ============ 使用物品 ============
function useItem(uid) {
    const slot = inventory.slots.find(s => s && s.uid === uid);
    if (!slot) return false;
    
    // v10.5: 标记待售的物品不可使用
    if (isMarkedForSale(uid)) {
        if (typeof window.showMessage === 'function') {
            window.showMessage('该物品已标记为待售，无法使用。请先取消标记。', 'warning');
        }
        return false;
    }
    
    const template = slot.getTemplate();
    if (!template) return false;
    
    // 检查 implemented:false — 禁止使用
    if (template.implemented === false) {
        if (typeof window.showMessage === 'function') {
            window.showMessage(template.name + ' 尚未实装，无法使用', 'warning');
        } else {
            alert(template.name + ' 尚未实装，无法使用');
        }
        return false;
    }
    
    // 根据物品类型执行不同效果
    switch (template.type) {
        case 'consumable':
            // F-14：突破类物品——服用后累加到 _breakthroughPillBonus，下次突破成功率加成并消耗
            // 此前直接拦截"只能在突破界面用"，但无此界面→8 种突破丹永无消费路径
            if (template.subtype === 'breakthrough') {
                var _bbEff = template.effect && template.effect.breakthrough_bonus;
                var _bbActual = 0;
                if (typeof _bbEff === 'number') _bbActual = _bbEff;
                else if (typeof _bbEff === 'string') _bbActual = 0.05 + Math.random() * 0.10; // 悟道丹"5~15%随机"
                if (_bbActual > 0 && window.currentCharData) {
                    var _cd = window.currentCharData;
                    _cd._breakthroughPillBonus = (_cd._breakthroughPillBonus || 0) + _bbActual;
                    slot.removeCount(1);
                    if (slot.count <= 0) inventory.slots[inventory.slots.indexOf(slot)] = null;
                    if (typeof window.showMessage === 'function') {
                        window.showMessage('已服用 ' + template.name + '，下次突破成功率 +' + Math.round(_bbActual * 100) + '%', 'success');
                    }
                    if (typeof window.updateInventoryUI === 'function') window.updateInventoryUI();
                    return true;
                }
                if (typeof window.showMessage === 'function') {
                    window.showMessage(template.name + ' 暂无法使用', 'info');
                }
                return false;
            }
            // 医疗类物品：禁止在背包直接使用
            if (template.subtype === 'medical') {
                if (typeof window.showMessage === 'function') {
                    window.showMessage('医疗物品请在疗伤界面使用', 'info');
                }
                return false;
            }
            // 陷阱/毒药类：未实现
            if (template.subtype === 'trap' || template.subtype === 'poison') {
                if (typeof window.showMessage === 'function') {
                    window.showMessage(template.name + ' 暂不可用', 'warning');
                }
                return false;
            }
            // 所有可用的消耗品子类型统一处理（v13.1：+manual 绝技秘籍）
            if (['pill', 'buff_pill', 'perm_pill', 'special_pill', 'herb', 'fruit', 'food', 'talisman', 'special', 'manual'].includes(template.subtype)) {
                // 1.9 丹毒积累：服丹按毒性累积丹毒值
                if (['pill', 'buff_pill', 'perm_pill', 'special_pill'].indexOf(template.subtype) >= 0 &&
                    typeof window.addPillPoison === 'function') {
                    window.addPillPoison(slot.templateId || template.id, 1);
                }
                // 止血丹特殊处理：调用 hemostaticTreatment
                if (template.subtype === 'pill' && template.effect && template.effect.hemostatic) {
                    if (typeof window.hemostaticTreatment === 'function') {
                        window.hemostaticTreatment();
                    } else {
                        console.warn('hemostaticTreatment 未定义');
                    }
                    slot.removeCount(1);
                    if (slot.count <= 0) {
                        inventory.slots[inventory.slots.indexOf(slot)] = null;
                    }
                    return true;
                }
                if (template.subtype === 'talisman') {
                    if (!applyTalismanEffect(slot, template)) return false;
                } else {
                    // v13.1 绝技秘籍：已掌握时 applyConsumableEffect 返回 false，阻断消耗（参照既有拒绝使用路径）
                    if (applyConsumableEffect(slot, template) === false) return false;
                }
                slot.removeCount(1);
                if (slot.count <= 0) {
                    inventory.slots[inventory.slots.indexOf(slot)] = null;
                }
                return true;
            }
            break;
        case 'secret_art':
            // 学习秘籍：只有成功且消耗时才扣除
            var result = learnSecretArt(slot, template);
            if (result && result.consumed) {
                slot.removeCount(1);
                if (slot.count <= 0) {
                    inventory.slots[inventory.slots.indexOf(slot)] = null;
                }
            }
            return true;
    }
    
    return false;
}

// ============ 应用消耗品效果 ============
function applyConsumableEffect(item, template) {
    if (template.effect) {
        const eff = template.effect;
        // HP恢复
        if (eff.hp_recovery) {
            if (typeof restoreBodyDurability === 'function') {
                restoreBodyDurability(eff.hp_recovery);
            }
        }
        // 真气/精力恢复必须写入角色真源，DOM 只负责显示。
        const charData = (typeof window.getCurrentCharData === 'function')
            ? window.getCurrentCharData() : window.currentCharData;
        if (eff.qi_recovery && charData) {
            const maxQi = charData.maxQi != null ? charData.maxQi : 100;
            charData.qi = Math.min(maxQi, (charData.qi != null ? charData.qi : 0) + eff.qi_recovery);
        }
        if (eff.energy_recovery && charData) {
            const maxEnergy = charData.maxEnergy != null ? charData.maxEnergy : 100;
            charData.energy = Math.min(maxEnergy, (charData.energy != null ? charData.energy : 0) + eff.energy_recovery);
        }
        if (eff.full_recovery) {
            if (typeof restoreBodyDurability === 'function') restoreBodyDurability(9999);
            if (charData) {
                charData.qi = charData.maxQi != null ? charData.maxQi : 100;
                charData.energy = charData.maxEnergy != null ? charData.maxEnergy : 100;
            }
        }
        if ((eff.qi_recovery || eff.energy_recovery || eff.full_recovery) && typeof window.updateCharacterStatus === 'function') {
            try { window.updateCharacterStatus(); } catch (e) {}
        }
        // 历史兼容: health_recovery / vitality_max
        if (eff.health_recovery) {
            if (typeof restoreBodyDurability === 'function') {
                restoreBodyDurability(eff.health_recovery);
            }
        }
        // v13.1 绝技秘籍：参悟 learn_ability 指定的可学战斗绝技（玩家与敌人共用 COMBAT_ABILITIES 机制）
        if (eff.learn_ability) {
            var abId = eff.learn_ability;
            var cdLearn = window.currentCharData;
            if (!cdLearn) {
                if (typeof window.showMessage === 'function') window.showMessage('请先创建角色', 'warning');
                return false; // 无角色：不消耗
            }
            // 注册表已加载但 id 非法 → 拒绝，杜绝假效果
            if (window.COMBAT_ABILITIES && !window.COMBAT_ABILITIES[abId]) {
                if (typeof window.showMessage === 'function') window.showMessage(template.name + ' 所载功法残缺，无法参悟', 'warning');
                return false;
            }
            if (!Array.isArray(cdLearn.combatAbilities)) cdLearn.combatAbilities = [];
            if (cdLearn.combatAbilities.indexOf(abId) >= 0) {
                // 已掌握：提示后阻断消耗（useItem 收到 false 直接返回，不扣物品）
                if (typeof window.showMessage === 'function') {
                    window.showMessage('你已掌握《' + (template.name || abId) + '》精髓，再读无益', 'info');
                }
                return false;
            }
            cdLearn.combatAbilities.push(abId);
            var learnedName = (window.COMBAT_ABILITIES && window.COMBAT_ABILITIES[abId])
                ? window.COMBAT_ABILITIES[abId].name : abId;
            if (typeof window.showMessage === 'function') {
                window.showMessage('📖 你参悟了《' + (template.name || abId) + '》，习得【' + learnedName + '】！', 'success');
            } else {
                console.log('习得绝技: ' + learnedName);
            }
            if (typeof window.updateCharacterStatus === 'function') {
                try { window.updateCharacterStatus(); } catch (eAb) {}
            }
            return true; // v13.1 学习成功即完成使用，跳过通用「使用了」提示
        }
        if (eff.vitality_max) {
            console.log('永久提升体力:', eff.vitality_max);
        }
        // 永久属性提升（v9.8：双写 mainAttributes + attrs，禁止只写顶层英文键）
        function _permAttr(enKey, delta) {
            if (!delta) return;
            if (typeof window.addMainAttribute === 'function') {
                window.addMainAttribute(enKey, delta);
            } else {
                var cd = window.currentCharData;
                if (!cd) return;
                if (!cd.mainAttributes) cd.mainAttributes = {};
                if (!cd.attrs) cd.attrs = {};
                var cnMap = { strength:'力量', dexterity:'灵巧', intelligence:'神识', willpower:'意志', constitution:'体质', meridian:'经脉' };
                var cn = cnMap[enKey] || enKey;
                cd.mainAttributes[cn] = (cd.mainAttributes[cn] || cd.attrs[enKey] || 10) + delta;
                cd.attrs[enKey] = cd.mainAttributes[cn];
            }
        }
        if (eff.constitution_permanent) _permAttr('constitution', eff.constitution_permanent);
        if (eff.meridian_permanent) _permAttr('meridian', eff.meridian_permanent);
        if (eff.intelligence_permanent) _permAttr('intelligence', eff.intelligence_permanent);
        if (eff.strength_permanent) _permAttr('strength', eff.strength_permanent);
        if (eff.dexterity_permanent) _permAttr('dexterity', eff.dexterity_permanent);
        if (eff.willpower_permanent) _permAttr('willpower', eff.willpower_permanent);
        if (eff.all_attr_permanent && window.currentCharData) {
            ['strength','dexterity','intelligence','willpower','constitution','meridian'].forEach(function(attr) {
                _permAttr(attr, eff.all_attr_permanent);
            });
        }
        // 突破辅助
        if (eff.foundation_bonus && window.currentCharData) {
            window.currentCharData._foundationBonus = (window.currentCharData._foundationBonus || 0) + eff.foundation_bonus;
        }
        if (eff.core_bonus && window.currentCharData) {
            window.currentCharData._coreBonus = (window.currentCharData._coreBonus || 0) + eff.core_bonus;
        }
        if (eff.primordial_bonus && window.currentCharData) {
            window.currentCharData._primordialBonus = (window.currentCharData._primordialBonus || 0) + eff.primordial_bonus;
        }
        if (eff.divine_bonus && window.currentCharData) {
            window.currentCharData._divineBonus = (window.currentCharData._divineBonus || 0) + eff.divine_bonus;
        }
        // 状态恢复
        if (eff.cure_poison && window.currentCharData) {
            window.currentCharData._poisoned = false;
        }
        if (eff.cure_confusion && window.currentCharData) {
            window.currentCharData._confused = false;
        }
        if (eff.remove_negative_emotion && window.currentCharData) {
            window.currentCharData._negativeEmotion = false;
        }
        // 心情提升
        if (eff.mood_boost && window.currentCharData) {
            window.currentCharData.mood = Math.min(100, (window.currentCharData.mood || 50) + eff.mood_boost);
        }
        if (eff.lifespan_years && typeof window.extendLifespan === 'function') {
            window.extendLifespan(eff.lifespan_years, template.name || '延寿丹');
        }

        // 显示使用提示
        if (typeof window.showMessage === 'function') {
            window.showMessage(`使用了 ${template.name}`, 'info');
        } else {
            console.log('使用:', template.name);
        }
    }
}

// ============ 应用符箓效果 ============
function applyTalismanEffect(item, template) {
    if (window.TalismanSystem && typeof window.TalismanSystem.apply === 'function') {
        return window.TalismanSystem.apply(template);
    }
    if (template.effect && template.effect.teleport) {
        if (typeof closeBattle === 'function') closeBattle();
        if (typeof closeInteraction === 'function') closeInteraction();
        return true;
    }
    if (typeof window.showMessage === 'function') window.showMessage('符箓效果系统尚未加载', 'error');
    return false;
}

// ============ 学习功法（返回 {success, consumed}） ============
function learnSecretArt(item, template) {
    // v9.2：走知识系统，写入 techniqueKnowledge，并映射到 skillPages id
    if (window.KnowledgeSystem && typeof window.KnowledgeSystem.learnFromManual === 'function') {
        var result = window.KnowledgeSystem.learnFromManual(template.id, template.name, {
            source: 'manual',
            state: 'learned',
            completeness: 100
        });
        if (result.already) {
            alert(result.msg || '你已经学过这门功法了！');
            return { success: false, consumed: false };
        }
        if (!result.success) {
            alert(result.msg || '学习失败');
            return { success: false, consumed: false };
        }
        alert(result.msg || ('你学会了功法：' + template.name + '！'));
        if (typeof renderEquipmentPanel === 'function') renderEquipmentPanel();
        if (typeof updateSkillPanels === 'function') updateSkillPanels();
        if (typeof renderSkillBrowse === 'function') renderSkillBrowse();
        return { success: true, consumed: true };
    }

    // 回退（无知识系统时）
    if (!window.learnedSecrets) {
        window.learnedSecrets = [];
    }
    if (!window.learnedSecrets.includes(template.id)) {
        window.learnedSecrets.push(template.id);
        alert('你学会了功法：' + template.name + '！');
        if (typeof updateSkillPanels === 'function') updateSkillPanels();
        return { success: true, consumed: true };
    } else {
        alert('你已经学过这门功法了！');
        return { success: false, consumed: false };
    }
}

// ============ 获取背包物品数量 ============
function getItemCount(uid) {
    const slot = inventory.slots.find(s => s && s.uid === uid);
    return slot ? slot.count : 0;
}

function getCountByTemplate(templateId) {
    let total = 0;
    for (const slot of inventory.slots) {
        if (slot && slot.templateId === templateId) {
            total += slot.count;
        }
    }
    return total;
}

// ============ 扩展背包 ============
function expandInventory() {
    if (inventory.maxSlots >= INVENTORY_CONFIG.MAX_SLOTS) {
        alert('背包已达到最大容量！');
        return false;
    }
    
    // 固定扩展费用：每次100铜钱
    var cost = (INVENTORY_CONFIG.COPPER_PER_SLOT || 10) * 10; // 100铜钱
    
    if (inventory.currency.copper < cost) {
        alert(`铜钱不足！需要 ${cost} 铜钱，当前拥有 ${inventory.currency.copper} 铜钱。`);
        return false;
    }
    
    // 扣除铜钱
    inventory.currency.copper -= cost;
    
    // 扩展背包容量
    inventory.maxSlots += 10;
    inventory.expanded = true;
    
    // 添加新格子
    for (let i = 0; i < 10; i++) {
        inventory.slots.push(null);
    }
    
    // 更新UI
    updateInventoryUI();
    updateCurrencyUI();
    
    return true;
}

// ============ 获取分类物品 ============
function getInventoryItemsByCategory(category) {
    if (category === 'all') return inventory.slots.filter(s => s !== null);
    
    return inventory.slots.filter(slot => {
        if (!slot) return false;
        const template = slot.getTemplate();
        return template?.category === category || template?.type === category;
    });
}

// ============ 筛选功能（v10.0 扩展：类别+品质+搜索+排序） ============
function filterInventory(category) {
    inventory.filter = category;
    
    // 更新按钮样式
    document.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.dataset.category === category) {
            btn.classList.add('bg-yellow-600');
            btn.classList.remove('bg-gray-600');
        } else {
            btn.classList.remove('bg-yellow-600');
            btn.classList.add('bg-gray-600');
        }
    });
    
    // 刷新背包UI
    updateInventoryUI();
}

// ============ 搜索功能 ============
function setSearchQuery(query) {
    inventory.searchQuery = (query || '').trim().toLowerCase();
    updateInventoryUI();
}

// ============ 品质筛选 ============
function setQualityFilter(quality) {
    inventory.qualityFilter = quality || 'all';
    // 更新品质按钮样式
    document.querySelectorAll('.quality-filter-btn').forEach(btn => {
        if (btn.dataset.quality === inventory.qualityFilter) {
            btn.classList.add('bg-yellow-600', 'text-gray-900');
            btn.classList.remove('bg-gray-600', 'text-white');
        } else {
            btn.classList.remove('bg-yellow-600', 'text-gray-900');
            btn.classList.add('bg-gray-600', 'text-white');
        }
    });
    updateInventoryUI();
}

// ============ 排序功能 ============
function setSortBy(sortKey) {
    inventory.sortBy = sortKey || 'count_desc';
    // 更新排序按钮文本
    const sortBtn = document.getElementById('sort-toggle-btn');
    if (sortBtn) {
        const labels = {
            name_asc: '名称↑', name_desc: '名称↓',
            price_asc: '价格↑', price_desc: '价格↓',
            quality_desc: '品质↓', quality_asc: '品质↑',
            count_desc: '数量↓', count_asc: '数量↑'
        };
        sortBtn.textContent = '📊 ' + (labels[inventory.sortBy] || '排序');
    }
    updateInventoryUI();
}

// ============ 循环切换排序方式 ============
function cycleSortOrder() {
    var order = ['count_desc', 'price_desc', 'quality_desc', 'name_asc', 'count_asc', 'price_asc', 'quality_asc', 'name_desc'];
    var idx = order.indexOf(inventory.sortBy);
    if (idx < 0) idx = 0;
    var next = order[(idx + 1) % order.length];
    setSortBy(next);
}

// ============ 收藏/取消收藏 ============
function toggleFavorite(uid) {
    if (!inventory.favorites) inventory.favorites = new Set();
    if (inventory.favorites.has(uid)) {
        inventory.favorites.delete(uid);
    } else {
        inventory.favorites.add(uid);
    }
    updateInventoryUI();
}

function isFavorite(uid) {
    return inventory.favorites && inventory.favorites.has(uid);
}

// ============ 获取筛选后的物品列表（含搜索、品质、排序） ============
function getFilteredSlots() {
    // 1) 先按类别筛选
    let slots = inventory.slots;
    if (inventory.filter !== 'all') {
        slots = inventory.slots.filter(slot => {
            if (!slot) return false;
            const template = slot.getTemplate();
            if (!template) return false;
            if (template.category === inventory.filter) return true;
            if (template.type === inventory.filter) return true;
            if (inventory.filter === 'currency') {
                return template.id === 'copper' || template.id === 'spirit_stone';
            }
            return false;
        });
    }
    
    // 2) 搜索过滤
    if (inventory.searchQuery) {
        const q = inventory.searchQuery;
        slots = slots.filter(slot => {
            if (!slot) return false;
            const t = slot.getTemplate();
            if (!t) return false;
            return (t.name && t.name.toLowerCase().indexOf(q) >= 0) ||
                   (t.desc && t.desc.toLowerCase().indexOf(q) >= 0) ||
                   (t.id && t.id.toLowerCase().indexOf(q) >= 0);
        });
    }
    
    // 3) 品质过滤
    if (inventory.qualityFilter && inventory.qualityFilter !== 'all') {
        slots = slots.filter(slot => {
            if (!slot) return false;
            const t = slot.getTemplate();
            return t && t.quality === inventory.qualityFilter;
        });
    }
    
    // 4) 排序
    const sortKey = inventory.sortBy || 'count_desc';
    const sortable = slots.filter(Boolean);
    sortable.sort(function(a, b) {
        var ta = a.getTemplate && a.getTemplate();
        var tb = b.getTemplate && b.getTemplate();
        if (!ta || !tb) return 0;
        var cmp = 0;
        switch (sortKey) {
            case 'name_asc': cmp = (ta.name || '').localeCompare(tb.name || ''); break;
            case 'name_desc': cmp = (tb.name || '').localeCompare(ta.name || ''); break;
            case 'price_asc': cmp = (ta.price || 0) - (tb.price || 0); break;
            case 'price_desc': cmp = (tb.price || 0) - (ta.price || 0); break;
            case 'quality_desc':
                var qOrder = { MYTHIC:6, LEGENDARY:5, EPIC:4, RARE:3, UNCOMMON:2, COMMON:1 };
                cmp = (qOrder[tb.quality]||0) - (qOrder[ta.quality]||0); break;
            case 'quality_asc':
                var qOrder2 = { MYTHIC:6, LEGENDARY:5, EPIC:4, RARE:3, UNCOMMON:2, COMMON:1 };
                cmp = (qOrder2[ta.quality]||0) - (qOrder2[tb.quality]||0); break;
            case 'count_desc': cmp = (b.count||0) - (a.count||0); break;
            case 'count_asc': cmp = (a.count||0) - (b.count||0); break;
        }
        return cmp;
    });
    return sortable;
}

// ============ 更新UI（v10.0 重写：搜索+排序+品质+收藏+批量出售集成） ============
function updateInventoryUI() {
    const container = document.getElementById('inventory-grid');
    if (!container) return;
    
    container.innerHTML = '';
    
    // 获取筛选排序后的物品
    const slotsToShow = getFilteredSlots();
    
    // 更新搜索结果计数
    const searchInfo = document.getElementById('search-result-info');
    if (searchInfo) {
        var total = inventory.slots.filter(function(s) { return s; }).length;
        searchInfo.textContent = '共 ' + slotsToShow.length + ' / ' + total + ' 件';
    }
    // 更新容量
    var capEl = document.getElementById('inventory-capacity');
    if (capEl) {
        var used = inventory.slots.filter(function(s) { return s; }).length;
        capEl.textContent = used + '/' + inventory.maxSlots;
    }
    
    // 显示筛选后的物品
    for (var i = 0; i < slotsToShow.length; i++) {
        var slot = slotsToShow[i];
        if (!slot) continue;
        
        var template = slot.getTemplate();
        if (!template) continue;
        
        var isFav = isFavorite(slot.uid);
        var isBatchSelected = inventory.batchSellMode && inventory.batchSellSelection.indexOf(slot.uid) >= 0;
        var isMarked = slot.markedForSale && inventory.markedForSale.has(slot.uid);
        var qualityColor = getQualityColor(template.quality);
        
        var slotDiv = document.createElement('div');
        var cls = 'bg-gray-700 border border-gray-600 rounded-lg flex flex-col items-center justify-center relative hover:border-yellow-500 cursor-pointer transition p-1';
        if (isFav) cls += ' ring-2 ring-pink-400';
        if (isBatchSelected) cls += ' ring-2 ring-green-400 bg-green-800';
        if (isMarked) cls += ' ring-2 ring-yellow-400 bg-yellow-900/30';
        slotDiv.className = cls;
        slotDiv.style.borderColor = qualityColor;
        
        var itemName = (template.name || templateId).length > 4 ? (template.name || templateId).slice(0, 4) + '..' : (template.name || templateId);
        var innerHtml = '<span class="text-xs text-gray-300 leading-tight text-center truncate w-full px-0.5">' + itemName + '</span>';
        // 收藏标记
        if (isFav) {
            innerHtml += '<span class="absolute top-0 left-0 text-xs text-pink-400">★</span>';
        }
        // 标记出售标记（v10.5）
        if (isMarked) {
            innerHtml += '<span class="absolute top-0 right-0 text-xs text-yellow-400">🏷️</span>';
        }
        // 数量（×格式，始终显示）
        innerHtml += '<span class="text-xs text-white font-bold mt-0.5">×' + (slot.count || 1) + '</span>';
        // 批量出售勾选
        if (inventory.batchSellMode) {
            var checked = isBatchSelected ? '✓' : '';
            innerHtml += '<span class="absolute top-0 right-0 text-xs w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center bg-gray-900 text-green-400">' + checked + '</span>';
        }
        
        slotDiv.innerHTML = innerHtml;
        
        // 点击事件
        slotDiv.onclick = function(uid, isBatch) {
            return function() {
                if (isBatch) {
                    toggleBatchSellSelection(uid);
                } else {
                    showItemMenu(uid);
                }
            };
        }(slot.uid, inventory.batchSellMode);
        
        container.appendChild(slotDiv);
    }
    
    // 如果筛选后没有物品，显示提示
    if (slotsToShow.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm text-center col-span-full">没有找到匹配的物品</p>';
    }
    
    // 更新批量出售按钮状态
    var batchBtn = document.getElementById('batch-sell-btn');
    if (batchBtn) {
        if (inventory.batchSellMode) {
            batchBtn.textContent = '❌ 退出批量 (' + inventory.batchSellSelection.length + ')';
            batchBtn.classList.add('bg-green-600');
            batchBtn.classList.remove('bg-red-600');
        } else {
            batchBtn.textContent = '📦 批量出售';
            batchBtn.classList.remove('bg-green-600');
            batchBtn.classList.add('bg-red-600');
        }
    }
    var execBtn = document.getElementById('execute-batch-sell-btn');
    if (execBtn) {
        if (inventory.batchSellMode && inventory.batchSellSelection.length > 0) {
            execBtn.style.display = 'inline-block';
        } else {
            execBtn.style.display = 'none';
        }
    }
}

// ============ 获取品质颜色 ============
function getQualityColor(quality) {
    const colors = {
        'COMMON': '#9ca3af',    // 灰色
        'UNCOMMON': '#4ade80',  // 绿色
        'RARE': '#60a5fa',      // 蓝色
        'EPIC': '#c084fc',      // 紫色
        'LEGENDARY': '#fbbf24', // 金色
        'MYTHIC': '#ef4444'     // 红色
    };
    return colors[quality] || '#9ca3af';
}

// ============ 显示物品菜单（v10.0 增强：收藏保护+来源提示+已拥有数量；v10.5 出售改为标记出售） ============
function showItemMenu(uid) {
    const slot = inventory.slots.find(s => s && s.uid === uid);
    if (!slot) return;
    
    const template = slot.getTemplate();
    if (!template) return;
    
    var isMarked = isMarkedForSale(uid);
    
    // 完整的物品操作菜单
    const menu = document.createElement('div');
    menu.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    menu.onclick = (e) => {
        if (e.target === menu) menu.remove();
    };
    
    // 收藏按钮
    var isFav = isFavorite(uid);
    var favBtn = isFav
        ? `<button onclick="toggleFavorite('${uid}'); this.closest('.fixed').remove();" class="bg-pink-600 hover:bg-pink-500 px-4 py-2 rounded text-white">★ 取消收藏</button>`
        : `<button onclick="toggleFavorite('${uid}'); this.closest('.fixed').remove();" class="bg-gray-600 hover:bg-pink-500 px-4 py-2 rounded text-white">☆ 收藏</button>`;
    
    let actions = '';
    
    // 标记出售的物品不可使用/装备/学习
    if (!isMarked) {
        // 根据物品类型显示不同操作
        // 突破类/医疗类/未实现类不显示"使用"按钮
        var showUse = true;
        if (template.implemented === false) showUse = false;
        if (template.subtype === 'breakthrough') showUse = false;
        if (template.subtype === 'medical') showUse = false;
        if (template.subtype === 'trap' || template.subtype === 'poison') showUse = false;
        
        if (showUse && (template.type === 'consumable' || template.subtype === 'pill' || template.subtype === 'herb' || template.subtype === 'fruit')) {
            actions += `<button onclick="useItem('${uid}'); this.closest('.fixed').remove();" class="bg-green-600 hover:bg-green-500 px-4 py-2 rounded text-white">使用</button>`;
        }
        
        if (template.type === 'equipment' || template.type === 'weapon' || template.type === 'armor' || template.type === 'accessory') {
            actions += `<button onclick="equipItemFromInventory('${uid}'); this.closest('.fixed').remove();" class="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-white">装备</button>`;
            // v12.4：与当前同槽位装备逐属性对比
            actions += `<button onclick="showEquipmentCompareDialog('${uid}'); this.closest('.fixed').remove();" class="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded text-white">📊 对比</button>`;
        }
        
        if (template.type === 'secret_art') {
            actions += `<button onclick="useItem('${uid}'); this.closest('.fixed').remove();" class="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded text-white">学习</button>`;
        }
        
        // 丢弃按钮（除了任务物品）
        if (template.category !== 'quest') {
            actions += `<button onclick="showDiscardConfirm('${uid}'); this.closest('.fixed').remove();" class="bg-red-600 hover:bg-red-500 px-4 py-2 rounded text-white">丢弃</button>`;
        }
    } else {
        // 标记出售的物品，只显示取消标记按钮
        actions += `<div class="w-full text-yellow-400 text-sm mb-2">🏷️ 已标记为待售，到商铺方能出售</div>`;
    }
    
    // v10.5: 标记出售按钮（取代直接出售）
    if (template.price > 0 && !isMarked) {
        // 未标记 → 显示"标记出售"
        if (slot.count > 1) {
            actions += `<button onclick="showMarkForSaleQuantityDialog('${uid}'); this.closest('.fixed').remove();" class="bg-yellow-600 hover:bg-yellow-500 px-4 py-2 rounded text-gray-900 font-bold">🏷️ 标记出售</button>`;
        } else {
            actions += `<button onclick="markForSale('${uid}'); this.closest('.fixed').remove();" class="bg-yellow-600 hover:bg-yellow-500 px-4 py-2 rounded text-gray-900 font-bold">🏷️ 标记出售</button>`;
        }
    } else if (isMarked) {
        actions += `<button onclick="unmarkForSale('${uid}'); this.closest('.fixed').remove();" class="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded text-white">取消标记</button>`;
    }
    
    // 来源提示
    var sourceInfo = '';
    if (template.source) {
        sourceInfo = '<div><span class="text-gray-400">来源：</span>' + template.source + '</div>';
    } else if (template.category === 'material' || template.subtype === 'herb') {
        sourceInfo = '<div><span class="text-gray-400">来源：</span>采集/战斗搜刮</div>';
    } else if (template.category === 'consumable') {
        sourceInfo = '<div><span class="text-gray-400">来源：</span>商店/合成/搜刮</div>';
    }
    
    // 已拥有数量（跨堆叠合计）
    var totalOwned = 0;
    for (var si = 0; si < inventory.slots.length; si++) {
        var s = inventory.slots[si];
        if (s && s.templateId === slot.templateId) totalOwned += s.count;
    }
    
    actions += favBtn;
    actions += `<button onclick="this.closest('.fixed').remove();" class="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded text-white">关闭</button>`;
    
    var qualityLabel = template.quality || 'COMMON';
    var qualityNames = { COMMON:'凡品', UNCOMMON:'良品', RARE:'珍品', EPIC:'极品', LEGENDARY:'仙品', MYTHIC:'神品' };
    
    // 使用场景/未实现提示
    var extraInfo = '';
    if (template.implemented === false) {
        extraInfo = '<div class="col-span-2 text-red-400 text-xs">⚠ 此物品尚未实装，无法使用</div>';
    } else if (template.subtype === 'breakthrough') {
        extraInfo = '<div class="col-span-2 text-yellow-400 text-xs">⚠ 只能在突破准备界面使用</div>';
    } else if (template.subtype === 'medical') {
        extraInfo = '<div class="col-span-2 text-yellow-400 text-xs">⚠ 请在疗伤界面使用</div>';
    } else if (template.useContext && template.useContext.length > 0) {
        var contextLabels = { world: '世界', battle: '战斗', medical: '医疗', breakthrough: '突破', crafting: '合成', npc_gift: '赠礼' };
        var labels = template.useContext.map(function(c) { return contextLabels[c] || c; });
        extraInfo = '<div class="col-span-2 text-gray-400 text-xs">使用场景：' + labels.join('、') + '</div>';
    }
    // 标记出售提示
    if (isMarked) {
        extraInfo += '<div class="col-span-2 text-yellow-400 text-xs">🏷️ 已标记为待售，请到商铺完成出售</div>';
    }
    
    menu.innerHTML = `
        <div class="bg-gray-800 border border-gray-600 rounded-lg p-6 max-w-md">
            <div class="flex items-center gap-3 mb-4">
                <span class="text-4xl">${template.icon}</span>
                <div>
                    <h3 class="text-xl font-bold ${template.quality === 'LEGENDARY' || template.quality === 'MYTHIC' ? 'text-yellow-400' : 'text-white'}">${template.name}</h3>
                    <p class="text-sm text-gray-400">${template.desc}</p>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-2 text-sm mb-4">
                <div><span class="text-gray-400">类型：</span>${template.type}</div>
                <div><span class="text-gray-400">品质：</span>${qualityNames[qualityLabel] || qualityLabel}</div>
                <div><span class="text-gray-400">数量：</span>${slot.count}</div>
                <div><span class="text-gray-400">价格：</span>${template.price} 灵石</div>
                <div><span class="text-gray-400">已拥有：</span>${totalOwned}</div>
                ${sourceInfo}
                ${extraInfo}
            </div>
            <div class="flex flex-wrap gap-2 justify-end">
                ${actions}
            </div>
        </div>
    `;
    
    document.body.appendChild(menu);
}

// ============ 装备对比弹窗（v12.4：背包物品 vs 当前同槽位装备，逐属性绿(+)/红(−)差值） ============
var _EQUIP_ATTR_NAMES = {
    strength: '力量', dexterity: '灵巧', constitution: '体质',
    intelligence: '神识', willpower: '意志', meridian: '经脉'
};
var _EQUIP_BONUS_NAMES = {
    attack: '攻击', defense: '防御', crit: '暴击%', hit: '命中%',
    speed: '速度', block: '格挡%', penetrate: '破甲%'
};

function showEquipmentCompareDialog(uid) {
    const slot = inventory.slots.find(s => s && s.uid === uid);
    if (!slot) return;
    const template = slot.getTemplate();
    if (!template) return;

    // 槽位映射参考 equipment.js equipmentSlots：物品模板自带 slot 字段
    const targetSlot = template.slot;
    const equipped = (targetSlot && window.currentEquipment) ? window.currentEquipment[targetSlot] : null;
    if (!equipped) {
        if (window.showMessage) window.showMessage('该槽位当前没有装备，无法对比。', 'info');
        else alert('该槽位当前没有装备，无法对比。');
        return;
    }

    // 汇总单件装备属性（attrs 主属性 + combatBonus 战斗加成）
    function _collectEquipStats(item) {
        var out = {};
        var attrs = item.attrs || {};
        Object.keys(attrs).forEach(function (k) { out[k] = (out[k] || 0) + Number(attrs[k] || 0); });
        var cb = item.combatBonus || {};
        Object.keys(cb).forEach(function (k) { out[k] = (out[k] || 0) + Number(cb[k] || 0); });
        return out;
    }
    var newStats = _collectEquipStats(template);
    var oldStats = _collectEquipStats(equipped);

    // 合并出现过的属性键（固定顺序：主属性 → 战斗加成）
    var keys = [];
    Object.keys(_EQUIP_ATTR_NAMES).concat(Object.keys(_EQUIP_BONUS_NAMES)).forEach(function (k) {
        if ((newStats[k] !== undefined || oldStats[k] !== undefined) && keys.indexOf(k) < 0) keys.push(k);
    });

    var slotNames = { head:'头部', neck:'颈部', body:'身体', waist:'腰部', hands:'手部', feet:'脚部',
                      mainHand:'主手', offHand:'副手', ring1:'戒指1', ring2:'戒指2', acc1:'饰品1', acc2:'饰品2' };
    var qualityNames = { COMMON:'凡品', UNCOMMON:'良品', RARE:'珍品', EPIC:'极品', LEGENDARY:'仙品', MYTHIC:'神品' };

    function _statRow(k) {
        var nv = newStats[k] || 0;
        var ov = oldStats[k] || 0;
        var diff = nv - ov;
        var name = _EQUIP_ATTR_NAMES[k] || _EQUIP_BONUS_NAMES[k] || k;
        var diffHtml;
        if (diff > 0) diffHtml = '<span class="text-green-400 font-bold">(+' + diff + ')</span>';
        else if (diff < 0) diffHtml = '<span class="text-red-400 font-bold">(' + diff + ')</span>';
        else diffHtml = '<span class="text-gray-500">(±0)</span>';
        return '<tr>'
            + '<td class="text-gray-300 py-1">' + name + '</td>'
            + '<td class="text-center py-1 ' + (diff > 0 ? 'text-green-300' : 'text-white') + '">' + nv + '</td>'
            + '<td class="text-center text-gray-400 py-1">' + ov + '</td>'
            + '<td class="text-right py-1">' + diffHtml + '</td>'
            + '</tr>';
    }

    var rows = keys.length > 0
        ? keys.map(_statRow).join('')
        : '<tr><td colspan="4" class="text-center text-gray-500 py-3">两件装备均无属性加成</td></tr>';

    var dialog = document.createElement('div');
    dialog.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    dialog.onclick = function (e) { if (e.target === dialog) dialog.remove(); };
    dialog.innerHTML =
        '<div class="bg-gray-800 border border-gray-600 rounded-lg p-6 max-w-md w-full mx-4">'
        + '<h3 class="text-lg font-bold text-yellow-500 mb-4">📊 装备对比' + (slotNames[targetSlot] ? '（' + slotNames[targetSlot] + '槽）' : '') + '</h3>'
        + '<div class="grid grid-cols-2 gap-2 text-sm mb-3">'
        +   '<div class="border border-blue-700/60 rounded p-2 bg-blue-900/20">'
        +     '<div class="font-bold text-blue-300">' + (template.icon || '') + ' ' + template.name + '</div>'
        +     '<div class="text-xs text-gray-400">背包 · ' + (qualityNames[template.quality] || template.quality || '') + '</div>'
        +   '</div>'
        +   '<div class="border border-gray-600 rounded p-2 bg-gray-900/40">'
        +     '<div class="font-bold text-gray-200">' + (equipped.icon || '') + ' ' + equipped.name + '</div>'
        +     '<div class="text-xs text-gray-400">已装备 · ' + (qualityNames[equipped.quality] || equipped.quality || '') + '</div>'
        +   '</div>'
        + '</div>'
        + '<table class="w-full text-sm mb-4">'
        +   '<thead><tr class="text-xs text-gray-500 border-b border-gray-700">'
        +     '<th class="text-left py-1 font-normal">属性</th>'
        +     '<th class="text-center py-1 font-normal">新</th>'
        +     '<th class="text-center py-1 font-normal">旧</th>'
        +     '<th class="text-right py-1 font-normal">差值</th>'
        +   '</tr></thead>'
        +   '<tbody>' + rows + '</tbody>'
        + '</table>'
        + '<div class="flex justify-end"><button onclick="this.closest(\'.fixed\').remove();" class="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded text-white">关闭</button></div>'
        + '</div>';
    document.body.appendChild(dialog);
}

// ============ 标记出售数量选择对话框（v10.5 替代原出售对话框） ============
function showMarkForSaleQuantityDialog(uid) {
    const slot = inventory.slots.find(s => s && s.uid === uid);
    if (!slot) return;
    const template = slot.getTemplate();
    if (!template) return;
    
    var maxQty = slot.count || 1;
    
    var dlg = document.createElement('div');
    dlg.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    dlg.onclick = function(e) { if (e.target === dlg) dlg.remove(); };
    dlg.innerHTML = `
        <div class="bg-gray-800 border border-gray-600 rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 class="text-lg font-bold text-white mb-4">🏷️ 标记待售 ${template.icon} ${template.name}</h3>
            <p class="text-sm text-gray-400 mb-2">当前拥有：${slot.count} | 标记后到商铺完成出售</p>
            <div class="flex items-center gap-2 mb-4">
                <button onclick="adjustMarkQty('${uid}', -10)" class="bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded text-white">-10</button>
                <button onclick="adjustMarkQty('${uid}', -1)" class="bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded text-white">-1</button>
                <input type="number" id="mark-qty-${uid}" value="${maxQty}" min="1" max="${maxQty}" class="bg-gray-700 text-white text-center w-16 rounded border border-gray-600">
                <button onclick="adjustMarkQty('${uid}', 1)" class="bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded text-white">+1</button>
                <button onclick="adjustMarkQty('${uid}', 10)" class="bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded text-white">+10</button>
            </div>
            <p class="text-yellow-400 text-sm mb-4">标记后到商铺查看报价</p>
            <div class="flex gap-2 justify-end">
                <button onclick="confirmMarkForSale('${uid}')" class="bg-yellow-600 hover:bg-yellow-500 px-4 py-2 rounded text-gray-900 font-bold">确认标记</button>
                <button onclick="this.closest('.fixed').remove()" class="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded text-white">取消</button>
            </div>
        </div>
    `;
    document.body.appendChild(dlg);
    
    var input = document.getElementById('mark-qty-' + uid);
    if (input) {
        input.oninput = function() {
            var val = parseInt(this.value) || 1;
            if (val < 1) val = 1;
            if (val > maxQty) val = maxQty;
            this.value = val;
        };
    }
}

function adjustMarkQty(uid, delta) {
    var input = document.getElementById('mark-qty-' + uid);
    if (!input) return;
    const slot = inventory.slots.find(s => s && s.uid === uid);
    if (!slot) return;
    var maxQty = slot.count || 1;
    var val = parseInt(input.value) || 1;
    val += delta;
    if (val < 1) val = 1;
    if (val > maxQty) val = maxQty;
    input.value = val;
}

function confirmMarkForSale(uid) {
    var input = document.getElementById('mark-qty-' + uid);
    if (!input) return;
    var qty = parseInt(input.value) || 1;
    const slot = inventory.slots.find(s => s && s.uid === uid);
    if (!slot) return;
    if (qty > slot.count) qty = slot.count;
    if (qty <= 0) return;
    
    markForSale(uid, qty);
    document.querySelectorAll('.fixed.inset-0').forEach(function(el) { el.remove(); });
}

// ============ 标记出售系统（v10.5 替代直接出售） ============

// 标记物品为待售
function markForSale(uid, qty) {
    const slot = inventory.slots.find(s => s && s.uid === uid);
    if (!slot) return false;
    const template = slot.getTemplate();
    if (!template) return false;
    
    qty = qty || slot.count;
    qty = Math.min(qty, slot.count);
    if (qty <= 0) return false;
    
    // 如果标记数量等于全部数量，标记整个格子
    if (qty >= slot.count) {
        slot.markedForSale = true;
        inventory.markedForSale.add(uid);
    } else {
        // 部分标记：需要拆分物品
        // 先减少原物品数量
        slot.count -= qty;
        // 创建新物品实例作为标记部分
        var newSlot = new ItemInstance(template.id || template.templateId, qty);
        newSlot.markedForSale = true;
        // 找空位放入
        var emptyIdx = -1;
        for (var i = 0; i < inventory.slots.length; i++) {
            if (!inventory.slots[i]) { emptyIdx = i; break; }
        }
        if (emptyIdx < 0) {
            // F-7 修复：之前不查 maxSlots 直接 push(null)，背包满时部分标记会突破 maxSlots 上限
            if ((inventory.slots || []).length >= (inventory.maxSlots || 30)) {
                if (window.showMessage) window.showMessage('背包已满，无法标记更多物品为待售', 'error');
                return false;
            }
            emptyIdx = inventory.slots.length;
            inventory.slots.push(null);
        }
        inventory.slots[emptyIdx] = newSlot;
        inventory.markedForSale.add(newSlot.uid);
    }
    
    updateInventoryUI();
    if (window.showMessage) {
        window.showMessage('🏷️ 已标记 ' + template.name + ' x' + qty + ' 为待售，请到商铺完成交易', 'info');
    }
    return true;
}

// 取消标记
function unmarkForSale(uid) {
    const slot = inventory.slots.find(s => s && s.uid === uid);
    if (!slot) return false;
    
    slot.markedForSale = false;
    inventory.markedForSale.delete(uid);
    updateInventoryUI();
    if (window.showMessage) {
        var template = slot.getTemplate();
        window.showMessage('已取消 ' + (template ? template.name : '物品') + ' 的待售标记', 'info');
    }
    return true;
}

// 检查是否标记为待售
function isMarkedForSale(uid) {
    return inventory.markedForSale && inventory.markedForSale.has(uid);
}

// 获取所有标记待售的物品
function getMarkedForSaleItems() {
    var result = [];
    for (var i = 0; i < inventory.slots.length; i++) {
        var slot = inventory.slots[i];
        if (slot && slot.markedForSale && inventory.markedForSale.has(slot.uid)) {
            result.push(slot);
        }
    }
    return result;
}

// 获取标记待售物品的总数统计
function getMarkedForSaleCount() {
    var count = 0;
    for (var i = 0; i < inventory.slots.length; i++) {
        var slot = inventory.slots[i];
        if (slot && slot.markedForSale && inventory.markedForSale.has(slot.uid)) {
            count += slot.count || 1;
        }
    }
    return count;
}

// 清除所有标记
function clearAllMarkedForSale() {
    inventory.markedForSale.clear();
    for (var i = 0; i < inventory.slots.length; i++) {
        var slot = inventory.slots[i];
        if (slot) {
            slot.markedForSale = false;
        }
    }
    updateInventoryUI();
}

// ============ 装备物品到装备栏 ============
function equipItemFromInventory(uid) {
    const slot = inventory.slots.find(s => s && s.uid === uid);
    if (!slot) return false;

    // F-7 重构：用 ItemInstance.canBeEquipped 统一守卫（之前手写散落 3 处）
    if (typeof slot.canBeEquipped === 'function' && !slot.canBeEquipped()) return false;

    const template = slot.getTemplate();
    if (!template) return false;
    
    // 检查是否是装备类物品（兼容 type='equipment' 和 type='weapon'/'armor'/'accessory'）
    var equipTypes = ['weapon', 'armor', 'accessory', 'equipment'];
    if (equipTypes.indexOf(template.type) < 0 && equipTypes.indexOf(template.category) < 0) {
        alert('此物品无法装备！');
        return false;
    }
    
    // 获取目标槽位
    const targetSlot = template.slot;
    if (!targetSlot) {
        alert('此物品没有定义的装备槽位！');
        return false;
    }
    
    // 检查当前装备栏是否有物品
    const existingEquip = window.currentEquipment?.[targetSlot];
    if (existingEquip) {
        if (!confirm(`装备 ${template.name} 将卸下当前的 ${existingEquip.name}，是否继续？`)) {
            return false;
        }
    }

    // v9.8：超载时禁止新装备（同槽替换允许）
    if (!existingEquip && typeof window.getLoadInfo === 'function') {
        try {
            var loadInfo = window.getLoadInfo();
            var addW = (typeof window.getItemWeight === 'function') ? window.getItemWeight(template) : (template.weight || 2);
            if (loadInfo && (loadInfo.overloaded || (loadInfo.current + addW) > loadInfo.capacity)) {
                alert('负荷超载，无法继续装备！请先卸下部分装备或提升力量/体质。');
                return false;
            }
        } catch (e) {}
    }
    
    // 装备物品
    if (typeof window.equipItem === 'function') {
        window.equipItem(targetSlot, template);
    }
    
    // 从背包移除（或减少数量）
    slot.removeCount(1);
    if (slot.count <= 0) {
        inventory.slots[inventory.slots.indexOf(slot)] = null;
    }
    
    // 更新属性缓存
    updateEquippedStats();
    
    // 更新UI
    if (typeof renderEquipmentPanel === 'function') {
        renderEquipmentPanel();
    }
    updateInventoryUI();
    
    alert(`成功装备：${template.name}！`);
    return true;
}

// ============ 卸下装备到背包 ============
function unequipItemToInventory(slotId) {
    if (!window.currentEquipment) return false;

    const item = window.currentEquipment[slotId];
    if (!item) return false;

    // F-29：还原装备时保留强化/耐久——此前 addItem(id) 新建实例读全局模板，
    // 克隆修复后模板不再被 mutate，若不复制字段强化会丢失
    var _newInstance = new ItemInstance(item.id || item.templateId, 1);
    ['enhancementLevel', 'refineLevel', 'enchantType', 'armorDurability', 'durability'].forEach(function (f) {
        if (item[f] !== undefined && item[f] !== null) _newInstance[f] = item[f];
    });
    // 找空槽放入（装备 maxStack 1，不堆叠以保留 per-instance 强化/耐久）
    var _emptyIdx = -1;
    for (var _i = 0; _i < inventory.slots.length; _i++) {
        if (!inventory.slots[_i]) { _emptyIdx = _i; break; }
    }
    if (_emptyIdx < 0 && inventory.slots.length < inventory.maxSlots) {
        _emptyIdx = inventory.slots.length;
        inventory.slots.push(null);
    }
    if (_emptyIdx < 0) {
        alert('背包已满！无法卸下装备。');
        return false;
    }
    inventory.slots[_emptyIdx] = _newInstance;
    // 从装备栏移除
    window.currentEquipment[slotId] = null;

    // 更新属性缓存
    updateEquippedStats();

    // 更新UI
    if (typeof renderEquipmentPanel === 'function') {
        renderEquipmentPanel();
    }
    updateInventoryUI();

    return true;
}

// ============ 计算装备属性加成 ============
function updateEquippedStats() {
    equippedStatsCache = {
        attrs: {},
        combatBonus: {},
        special: []
    };
    
    if (!window.currentEquipment) return;
    
    // 遍历所有装备槽位（含强化/精炼/附魔/突破倍率 v7.1）
    Object.values(window.currentEquipment).forEach(item => {
        if (!item) return;

        // 强化倍率（无 enhancement 模块时为 1）
        var enhMul = { attackMul: 1, defenseMul: 1, attrMul: 1, critBonus: 0, speedBonus: 0, specials: [] };
        if (typeof window.getEnhancementMultipliers === 'function') {
            enhMul = window.getEnhancementMultipliers(item);
        }
        
        // 累加属性加成（应用 attrMul）
        if (item.attrs) {
            Object.entries(item.attrs).forEach(([key, value]) => {
                var boosted = Math.floor((value || 0) * (enhMul.attrMul || 1));
                if (key === 'all') {
                    // 全属性加成
                    Object.keys(equippedStatsCache.attrs).forEach(k => {
                        equippedStatsCache.attrs[k] = (equippedStatsCache.attrs[k] || 0) + boosted;
                    });
                    equippedStatsCache.attrs.strength = (equippedStatsCache.attrs.strength || 0) + boosted;
                    equippedStatsCache.attrs.dexterity = (equippedStatsCache.attrs.dexterity || 0) + boosted;
                    equippedStatsCache.attrs.intelligence = (equippedStatsCache.attrs.intelligence || 0) + boosted;
                    equippedStatsCache.attrs.willpower = (equippedStatsCache.attrs.willpower || 0) + boosted;
                    equippedStatsCache.attrs.constitution = (equippedStatsCache.attrs.constitution || 0) + boosted;
                } else {
                    equippedStatsCache.attrs[key] = (equippedStatsCache.attrs[key] || 0) + boosted;
                }
            });
        }
        
        // 累加战斗属性加成（攻击等应用 attackMul）
        if (item.combatBonus) {
            Object.entries(item.combatBonus).forEach(([key, value]) => {
                var v = value || 0;
                if (key === 'attack' || key === 'damage') {
                    v = Math.floor(v * (enhMul.attackMul || 1));
                } else if (key === 'defense' || key === 'block') {
                    v = Math.floor(v * (enhMul.defenseMul || 1));
                }
                equippedStatsCache.combatBonus[key] = (equippedStatsCache.combatBonus[key] || 0) + v;
            });
        }
        
        // 记录特殊效果
        if (item.special) {
            equippedStatsCache.special.push(item.special);
        }
        if (enhMul.specials && enhMul.specials.length) {
            enhMul.specials.forEach(function(s) { equippedStatsCache.special.push(s); });
        }
        
        // 防御力加成（应用 defenseMul）
        if (item.defense) {
            var defVal = Math.floor((item.defense || 0) * (enhMul.defenseMul || 1));
            equippedStatsCache.combatBonus.defense = (equippedStatsCache.combatBonus.defense || 0) + defVal;
        }
        
        // 速度加成
        if (item.speed) {
            equippedStatsCache.combatBonus.speed = (equippedStatsCache.combatBonus.speed || 0) + item.speed;
        }
        if (enhMul.speedBonus) {
            equippedStatsCache.combatBonus.speed = (equippedStatsCache.combatBonus.speed || 0) + enhMul.speedBonus;
        }
        if (enhMul.critBonus) {
            equippedStatsCache.combatBonus.crit = (equippedStatsCache.combatBonus.crit || 0) + enhMul.critBonus;
        }
    });
    
    // 同时计算功法加成
    if (window.currentSkills) {
        Object.values(window.currentSkills).forEach(skill => {
            if (!skill) return;
            
            // 解析功法效果字符串
            if (skill.effect) {
                const effectStr = skill.effect;
                
                // 真气上限加成
                const qiMatch = effectStr.match(/真气上限\+(\d+)/);
                if (qiMatch) {
                    equippedStatsCache.attrs.maxQi = (equippedStatsCache.attrs.maxQi || 0) + parseInt(qiMatch[1]);
                }
                
                // 防御加成
                const defMatch = effectStr.match(/防御\+(\d+)/);
                if (defMatch) {
                    equippedStatsCache.combatBonus.defense = (equippedStatsCache.combatBonus.defense || 0) + parseInt(defMatch[1]);
                }
                
                // 闪避加成
                const dodgeMatch = effectStr.match(/闪避\+(\d+)/);
                if (dodgeMatch) {
                    equippedStatsCache.combatBonus.dodge = (equippedStatsCache.combatBonus.dodge || 0) + parseInt(dodgeMatch[1]);
                }
            }
        });
    }
    
    // 通知UI更新
    if (typeof updateAllStatDisplays === 'function') {
        updateAllStatDisplays();
    }
}

// ============ 获取最终属性（含装备加成） ============
function getFinalAttributes(baseAttrs) {
    const final = { ...baseAttrs };
    
    Object.entries(equippedStatsCache.attrs).forEach(([key, value]) => {
        final[key] = (final[key] || 0) + value;
    });
    
    return final;
}

// ============ 获取战斗属性加成 ============
function getCombatBonuses(baseBonuses) {
    const final = { ...baseBonuses };
    
    Object.entries(equippedStatsCache.combatBonus).forEach(([key, value]) => {
        final[key] = (final[key] || 0) + value;
    });
    if (window.TalismanSystem && typeof window.TalismanSystem.getCombatBonuses === 'function') {
        var talismanBonuses = window.TalismanSystem.getCombatBonuses();
        Object.entries(talismanBonuses).forEach(([key, value]) => { final[key] = (final[key] || 0) + value; });
    }
    return final;
}

// ============ 显示丢弃确认 ============
function showDiscardConfirm(uid) {
    const slot = inventory.slots.find(s => s && s.uid === uid);
    if (!slot) return;

    // F-7 重构：用 ItemInstance.canBeDiscarded 统一守卫
    if (typeof slot.canBeDiscarded === 'function' && !slot.canBeDiscarded()) return;

    const template = slot.getTemplate();
    if (!template) return;
    
    if (confirm(`确定要丢弃 ${template.name} x${slot.count} 吗？此操作不可恢复！`)) {
        // 从背包移除
        const index = inventory.slots.indexOf(slot);
        if (index >= 0) {
            inventory.slots[index] = null;
        }
        updateInventoryUI();
        updateCurrencyUI();
    }
}

// ============ 出售物品（v10.5 已废弃，改为标记出售） ============
function sellItem(uid) {
    // 重定向到标记出售
    if (typeof window.showMessage === 'function') {
        window.showMessage('背包中已不能直接出售物品，请标记后到商铺完成交易', 'warning');
    }
    return markForSale(uid);
}

// ============ 更新货币显示 ============
function updateCurrencyUI() {
    const goldText = document.getElementById('inventory-gold');
    const spiritText = document.getElementById('inventory-spirit-stones');
    
    if (goldText) {
        goldText.textContent = `💰 ${inventory.currency.copper}`;
    }
    if (spiritText) {
        spiritText.textContent = `💎 ${inventory.currency.spiritStones}`;
    }
}

// ============ 存档（v10.5 增加 markedForSale 字段） ============
function saveInventory() {
    localStorage.setItem('xianxia_inventory', JSON.stringify({
        slots: inventory.slots.map(s => s ? {
            uid: s.uid,
            templateId: s.templateId,
            count: s.count,
            durability: s.durability,
            markedForSale: s.markedForSale || false
        } : null),
        maxSlots: inventory.maxSlots,
        currency: inventory.currency,
        markedForSale: Array.from(inventory.markedForSale || [])
    }));
}

function loadInventory() {
    const saved = localStorage.getItem('xianxia_inventory');
    if (saved) {
        const data = JSON.parse(saved);
        inventory.maxSlots = data.maxSlots || INVENTORY_CONFIG.INITIAL_SLOTS;
        inventory.currency = data.currency || { copper: 100, spiritStones: 10 };
        
        // 恢复标记出售集合
        if (data.markedForSale) {
            inventory.markedForSale = new Set(data.markedForSale);
        } else {
            inventory.markedForSale = new Set();
        }
        
        inventory.slots = data.slots.map(slotData => {
            if (!slotData) return null;
            const instance = new ItemInstance(slotData.templateId, slotData.count);
            instance.uid = slotData.uid;
            instance.durability = slotData.durability;
            instance.markedForSale = slotData.markedForSale || false;
            return instance;
        });
        
        // 补齐空位
        while (inventory.slots.length < inventory.maxSlots) {
            inventory.slots.push(null);
        }
    }
}

// ============ 初始化 ============
// B1：标题画面不自动从 xianxia_inventory 恢复（避免未选角串档）
// 背包由 loadSaveData / 新游戏 GameState.resetWorldForNewGame 管理
document.addEventListener('DOMContentLoaded', () => {
    // loadInventory(); // 禁用自动加载独立键
    if (typeof updateInventoryUI === 'function') updateInventoryUI();
    if (typeof updateCurrencyUI === 'function') updateCurrencyUI();
});

// ============ 商店系统 ============
const SHOP_ITEMS = {
    basic: ['qi_recovery_pill', 'vitality_pill', 'attack_talisman', 'defense_talisman'],
    uncommon: ['spirit_restoring_pill', 'ginseng', 'lingzhi', 'iron_sword', 'cloth_hat'],
    rare: ['flying_sword', 'cloud_armor', 'spirit_ring', 'foundation_pill'],
    epic: ['thunder_sword', 'nine_heaven_robe', 'flight_boots', 'golden_core_pill'],
    legendary: ['immortal_sword', 'immortal_crown', 'five_element_ring']
};

function openShop(shopType = 'general') {
    const items = SHOP_ITEMS[shopType] || SHOP_ITEMS.basic;
    const shopName = shopType === 'general' ? '杂货商' : (shopType === 'weapon' ? '武器商' : '装备商');
    
    let itemsHtml = items.map(itemId => {
        const item = window.itemById?.[itemId];
        if (!item) return '';
        
        const canAfford = inventory.currency.spiritStones >= item.price;
        return `
            <div class="flex justify-between items-center bg-gray-700/30 p-3 rounded ${canAfford ? '' : 'opacity-50'}">
                <div class="flex items-center gap-3">
                    <span class="text-2xl">${item.icon}</span>
                    <div>
                        <p class="font-bold text-white">${item.name}</p>
                        <p class="text-xs text-gray-400">${item.desc}</p>
                        <p class="text-xs text-yellow-400">价格: ${item.price} 灵石</p>
                    </div>
                </div>
                <button onclick="buyFromShop('${itemId}', ${item.price}); this.closest('.fixed').remove();" class="bg-yellow-600 hover:bg-yellow-500 text-gray-900 px-3 py-1 rounded font-bold ${canAfford ? '' : 'opacity-50 cursor-not-allowed'}" ${canAfford ? '' : 'disabled'}>购买</button>
            </div>
        `;
    }).join('');
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    
    modal.innerHTML = `
        <div class="bg-gray-800 border-2 border-yellow-500 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto mx-4">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-yellow-500">🏪 ${shopName}</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div class="mb-4 p-3 bg-gray-700/50 rounded">
                <p class="text-sm text-gray-400">您的灵石: <span class="text-yellow-400 font-bold">💎 ${inventory.currency.spiritStones}</span></p>
            </div>
            <div class="space-y-3">
                ${itemsHtml}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function buyFromInventoryShop(itemId, price) {
    if (inventory.currency.spiritStones < price) {
        alert('灵石不足！');
        return false;
    }
    
    if (!addItem(itemId, 1)) {
        alert('背包已满！');
        return false;
    }
    
    inventory.currency.spiritStones -= price;
    updateInventoryUI();
    updateCurrencyUI();
    
    alert(`购买成功：${itemId}`);
    return true;
}

function openWeaponShop() {
    openShop('weapon');
}

function openArmorShop() {
    openShop('armor');
}

function openGeneralShop() {
    openShop('general');
}

// ============ 战利品系统 v1.0（精简版） ============
// 战斗胜利不掉落物品，物品通过搜刮(人类)/解剖(野兽)获得
// 携带物生成逻辑已移至 js/loot-system.js
// generateLoot 保留为兼容旧接口，但不再被战斗系统调用
function generateLoot(enemyLevel, enemyType, region) {
    // 仅返回基础结构，不再包含掉落表
    return {
        exp: 0,
        copper: 0,
        spiritStones: 0,
        items: []
    };
}

// 通用物品发放函数（供宝箱/任务/事件等系统使用）
function applyBattleLoot(loot) {
    if (!loot) return loot;
    
    // 应用灵石
    if (loot.spiritStones && inventory && inventory.currency) {
        inventory.currency.spiritStones = (inventory.currency.spiritStones || 0) + loot.spiritStones;
    }
    
    // 应用铜钱
    if (loot.gold && inventory && inventory.currency) {
        inventory.currency.copper = (inventory.currency.copper || 0) + loot.gold;
    }
    
    // 应用物品
    if (loot.items && loot.items.length) {
        loot.items.forEach(function(itemId) {
            if (typeof addItem === 'function') addItem(itemId, 1);
        });
    }
    
    // 更新UI
    if (typeof updateCurrencyUI === 'function') updateCurrencyUI();
    if (typeof updateInventoryUI === 'function') updateInventoryUI();
    
    return loot;
}

// ============ 恢复部位耐久（用于丹药） ============
function restoreBodyDurability(amount) {
    if (typeof bodyDurability === 'undefined' || !bodyDurability) return;
    
    let restored = 0;
    Object.keys(bodyDurability).forEach(key => {
        if (bodyDurability[key] < 100) {
            const restoreAmount = Math.min(100 - bodyDurability[key], amount);
            bodyDurability[key] += restoreAmount;
            restored += restoreAmount;
            amount -= restoreAmount;
            
            if (amount <= 0) return;
        }
    });
    
    // 更新UI
    if (typeof renderBodyDurability === 'function') {
        renderBodyDurability();
    }
    
    // v4.3: 同步到 _savedDurabilities（战斗系统使用）
    if (typeof window._savedDurabilities !== 'undefined' && window._savedDurabilities) {
        Object.keys(bodyDurability).forEach(function(key) {
            if (window._savedDurabilities.hasOwnProperty(key)) {
                window._savedDurabilities[key] = bodyDurability[key];
            }
        });
    }
    
    return restored;
}

// ============ 更新所有属性显示 ============
function updateAllStatDisplays() {
    // 更新装备面板
    if (typeof renderEquipmentPanel === 'function') {
        renderEquipmentPanel();
    }
    
    // 更新背包UI
    updateInventoryUI();
    
    // 显示提示信息
    if (equippedStatsCache.special.length > 0) {
        console.log('特殊效果激活:', equippedStatsCache.special);
    }
}

// ============ 批量出售模式 ============
function toggleBatchSellMode() {
    inventory.batchSellMode = !inventory.batchSellMode;
    if (!inventory.batchSellMode) {
        inventory.batchSellSelection = [];
    }
    updateInventoryUI();
}

function toggleBatchSellSelection(uid) {
    var idx = inventory.batchSellSelection.indexOf(uid);
    if (idx >= 0) {
        inventory.batchSellSelection.splice(idx, 1);
    } else {
        inventory.batchSellSelection.push(uid);
    }
    updateInventoryUI();
}

function executeBatchSell() {
    // v10.5: 批量出售改为批量标记出售
    var selection = inventory.batchSellSelection;
    if (!selection || selection.length === 0) {
        if (window.showMessage) window.showMessage('请先选择要标记的物品', 'warning');
        return;
    }
    
    var markedCount = 0;
    var markedItems = [];
    
    for (var si = 0; si < selection.length; si++) {
        var uid = selection[si];
        var slot = inventory.slots.find(function(s) { return s && s.uid === uid; });
        if (!slot) continue;
        var template = slot.getTemplate();
        if (!template) continue;
        if (template.price <= 0) continue;
        // 检查是否收藏
        if (isFavorite(uid)) continue;
        // 跳过已标记的
        if (slot.markedForSale) continue;
        
        // 标记为待售
        slot.markedForSale = true;
        inventory.markedForSale.add(uid);
        markedCount++;
        markedItems.push(template.name + ' x' + (slot.count || 1));
    }
    
    if (markedCount === 0) {
        if (window.showMessage) window.showMessage('没有可标记的物品', 'info');
    } else {
        if (window.showMessage) {
            window.showMessage('🏷️ 已将 ' + markedItems.join('、') + ' 标记为待售，请到商铺完成交易', 'info');
        }
    }
    
    inventory.batchSellMode = false;
    inventory.batchSellSelection = [];
    updateInventoryUI();
}

// ============ 购买数量选择对话框（商店增强） ============
function showBuyQuantityDialog(itemId, itemName, unitPrice, maxAfford) {
    var dlg = document.createElement('div');
    dlg.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    dlg.onclick = function(e) { if (e.target === dlg) dlg.remove(); };
    dlg.innerHTML = `
        <div class="bg-gray-800 border border-gray-600 rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 class="text-lg font-bold text-white mb-4">购买 ${itemName}</h3>
            <p class="text-sm text-gray-400 mb-2">单价：${unitPrice} 灵石 | 可购买上限：${maxAfford}</p>
            <div class="flex items-center gap-2 mb-4">
                <button onclick="adjustBuyQty(-10, '${itemId}', ${unitPrice}, ${maxAfford})" class="bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded text-white">-10</button>
                <button onclick="adjustBuyQty(-1, '${itemId}', ${unitPrice}, ${maxAfford})" class="bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded text-white">-1</button>
                <input type="number" id="buy-qty-${itemId}" value="1" min="1" max="${maxAfford}" class="bg-gray-700 text-white text-center w-16 rounded border border-gray-600">
                <button onclick="adjustBuyQty(1, '${itemId}', ${unitPrice}, ${maxAfford})" class="bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded text-white">+1</button>
                <button onclick="adjustBuyQty(10, '${itemId}', ${unitPrice}, ${maxAfford})" class="bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded text-white">+10</button>
            </div>
            <p class="text-yellow-400 text-sm mb-4" id="buy-total-${itemId}">总价：${unitPrice} 灵石</p>
            <div class="flex gap-2 justify-end">
                <button onclick="confirmBuyQuantity('${itemId}', ${unitPrice})" class="bg-yellow-600 hover:bg-yellow-500 px-4 py-2 rounded text-gray-900 font-bold">确认购买</button>
                <button onclick="this.closest('.fixed').remove()" class="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded text-white">取消</button>
            </div>
        </div>
    `;
    document.body.appendChild(dlg);
    
    var input = document.getElementById('buy-qty-' + itemId);
    if (input) {
        input.oninput = function() {
            var val = parseInt(this.value) || 1;
            if (val < 1) val = 1;
            if (val > maxAfford) val = maxAfford;
            this.value = val;
            var total = document.getElementById('buy-total-' + itemId);
            if (total) total.textContent = '总价：' + (unitPrice * val) + ' 灵石';
        };
    }
}

function adjustBuyQty(delta, itemId, unitPrice, maxAfford) {
    var input = document.getElementById('buy-qty-' + itemId);
    if (!input) return;
    var val = parseInt(input.value) || 1;
    val += delta;
    if (val < 1) val = 1;
    if (val > maxAfford) val = maxAfford;
    input.value = val;
    var total = document.getElementById('buy-total-' + itemId);
    if (total) total.textContent = '总价：' + (unitPrice * val) + ' 灵石';
}

function confirmBuyQuantity(itemId, unitPrice) {
    var input = document.getElementById('buy-qty-' + itemId);
    if (!input) return;
    var qty = parseInt(input.value) || 1;
    var total = unitPrice * qty;
    if (inventory.currency.spiritStones < total) {
        alert('灵石不足！需要 ' + total + ' 灵石，当前 ' + inventory.currency.spiritStones);
        return;
    }
    if (!addItem(itemId, qty)) {
        alert('背包已满！');
        return;
    }
    inventory.currency.spiritStones -= total;
    updateInventoryUI();
    updateCurrencyUI();
    document.querySelectorAll('.fixed.inset-0').forEach(function(el) { el.remove(); });
    if (window.showMessage) {
        window.showMessage('购买成功：' + (window.itemById?.[itemId]?.name || itemId) + ' x' + qty, 'success');
    }
}

// ============ 导出 ============
window.inventory = inventory;
// B2：挂到 inventory 对象，供 crafting/app 旧调用
inventory.addItem = function(templateId, count) { return window.addItem ? window.addItem(templateId, count) : window._addItemRaw(templateId, count); };
inventory.openShop = function(type) { return openShop(type); };

window.INVENTORY_CONFIG = INVENTORY_CONFIG;
window.ItemInstance = ItemInstance;
window.initInventory = initInventory;
window._addItemRaw = addItem;
window.addItem = function(templateId, count) {
    // B2：使用 _addItemRaw 而非裸 addItem，避免 ES6 默认参数作用域导致函数名解析到自身
    var result = window._addItemRaw(templateId, count);
    if (result && typeof window.showItemObtainAnimation === 'function') {
        try { window.showItemObtainAnimation(templateId, count || 1); } catch (e) {}
    }
    if (result && typeof window.showEffect === 'function') {
        try { window.showEffect('item_get'); } catch (e) {}
    }
    return result;
};
// B2：对象方法别名（crafting 曾调 inventory.addItem）
inventory.addItem = window.addItem;
window.addItemToInventory = window.addItem; // 唯一全局背包入库入口
if (typeof openShop === 'function') inventory.openShop = openShop;
window.removeItem = removeItem;
window.useItem = useItem;
window.expandInventory = expandInventory;
window.getInventoryItemsByCategory = getInventoryItemsByCategory;
window.getCountByTemplate = getCountByTemplate;
window.filterInventory = filterInventory;
window.updateInventoryUI = updateInventoryUI;
window.updateCurrencyUI = updateCurrencyUI;
window.saveInventory = saveInventory;
window.loadInventory = loadInventory;
window.showItemMenu = showItemMenu;
window.equipItemFromInventory = equipItemFromInventory;
window.unequipItemToInventory = unequipItemToInventory;
window.updateEquippedStats = updateEquippedStats;
window.getFinalAttributes = getFinalAttributes;
window.getCombatBonuses = getCombatBonuses;
window.showDiscardConfirm = showDiscardConfirm;
window.sellItem = sellItem;
window.openShop = openShop;
window._openShopImpl = openShop;
inventory.openShop = openShop;
window.buyFromInventoryShop = buyFromInventoryShop;
window.openWeaponShop = openWeaponShop;
window.openArmorShop = openArmorShop;
window.openGeneralShop = openGeneralShop;
window.generateLoot = generateLoot;
window.applyBattleLoot = applyBattleLoot;
window.restoreBodyDurability = restoreBodyDurability;
window.updateAllStatDisplays = updateAllStatDisplays;
window.learnedSecrets = learnedSecrets;
window.equippedStatsCache = equippedStatsCache;
// v10.0 新增导出
window.setSearchQuery = setSearchQuery;
window.setQualityFilter = setQualityFilter;
window.setSortBy = setSortBy;
window.toggleFavorite = toggleFavorite;
window.isFavorite = isFavorite;
window.getFilteredSlots = getFilteredSlots;
window.toggleBatchSellMode = toggleBatchSellMode;
window.toggleBatchSellSelection = toggleBatchSellSelection;
window.executeBatchSell = executeBatchSell;
window.showBuyQuantityDialog = showBuyQuantityDialog;
window.adjustBuyQty = adjustBuyQty;
window.confirmBuyQuantity = confirmBuyQuantity;
// v10.5 标记出售系统导出
window.markForSale = markForSale;
window.unmarkForSale = unmarkForSale;
window.isMarkedForSale = isMarkedForSale;
window.getMarkedForSaleItems = getMarkedForSaleItems;
window.getMarkedForSaleCount = getMarkedForSaleCount;
window.clearAllMarkedForSale = clearAllMarkedForSale;
window.showMarkForSaleQuantityDialog = showMarkForSaleQuantityDialog;
window.adjustMarkQty = adjustMarkQty;
window.confirmMarkForSale = confirmMarkForSale;
