// ==================== poison-system.js - 毒术系统（v9.5 批次F2） ====================
// 解毒（战斗内）+ 制毒（战斗外）

// 毒素配方（材料使用现有 items-extended 材料 id）
const POISON_TYPES = {
    'weak_poison': {
        name: '弱毒',
        damage: 2,
        duration: 3,
        reqSkill: 0,
        materials: ['mat_liquorice', 'mat_beast_fang'],
        itemId: 'poison_weak'
    },
    'medium_poison': {
        name: '中品毒',
        damage: 5,
        duration: 5,
        reqSkill: 30,
        materials: ['mat_phoenix_blood_grass*2', 'mat_beast_fang*2', 'mat_lingzhi'],
        itemId: 'poison_medium'
    },
    'strong_poison': {
        name: '剧毒',
        damage: 10,
        duration: 8,
        reqSkill: 60,
        materials: ['mat_phoenix_blood_grass*3', 'mat_demon_beast_fang*2', 'mat_dragon_blood', 'mat_demon_beast_core'],
        itemId: 'poison_strong'
    }
};

// 解析 "id*count" 材料格式
function _parseMaterialSpec(mat) {
    const parts = String(mat).split('*');
    return { id: parts[0], count: parseInt(parts[1] || '1', 10) || 1 };
}

// 获取背包中某模板物品数量
function _countInventoryItem(templateId) {
    if (!window.inventory || !window.inventory.slots) return 0;
    let total = 0;
    for (var i = 0; i < window.inventory.slots.length; i++) {
        var s = window.inventory.slots[i];
        if (s && (s.templateId === templateId || s.id === templateId)) {
            total += (s.count || 1);
        }
    }
    return total;
}

// 从背包移除物品
function _removeInventoryItem(templateId, count) {
    if (typeof window.removeItem === 'function') {
        return window.removeItem(templateId, count);
    }
    if (window.inventory && typeof window.inventory.removeItem === 'function') {
        return window.inventory.removeItem(templateId, count);
    }
    // 兜底：直接改 slots
    if (!window.inventory || !window.inventory.slots) return false;
    var need = count;
    for (var i = 0; i < window.inventory.slots.length && need > 0; i++) {
        var s = window.inventory.slots[i];
        if (s && (s.templateId === templateId || s.id === templateId)) {
            var take = Math.min(need, s.count || 1);
            s.count = (s.count || 1) - take;
            need -= take;
            if (s.count <= 0) window.inventory.slots[i] = null;
        }
    }
    return need <= 0;
}

// 获取物品显示名
function _itemDisplayName(id) {
    var tpl = window.itemById && window.itemById[id];
    return (tpl && tpl.name) || id;
}

// 解毒（战斗内 / 战斗外均可）
// entity: 目标 Entity；若省略则尝试当前战斗玩家
function detoxify(entity) {
    entity = entity || window._playerEntity || window._playerPhysiology || (window.currentBattle && window.currentBattle.player);
    if (!entity) {
        if (window.showMessage) window.showMessage('无法找到解毒目标', 'error');
        return false;
    }

    // v9.8：统一生活技能读取
    const poisonSkill = (typeof window.getLifeSkill === 'function')
        ? window.getLifeSkill('毒术')
        : ((window.currentCharData && window.currentCharData.lifeSkills && window.currentCharData.lifeSkills['毒术']) || 0);

    // 优先从 physiology.statusEffects 找毒
    let phys = entity.physiology;
    let statusEffects = null;
    if (phys && Array.isArray(phys.statusEffects)) {
        statusEffects = phys.statusEffects;
    } else if (Array.isArray(entity.statusEffects)) {
        statusEffects = entity.statusEffects;
    } else if (phys) {
        // 兼容：用 debuffs 或 wounds 上的毒标记
        if (!phys.statusEffects) phys.statusEffects = [];
        statusEffects = phys.statusEffects;
    }

    if (!statusEffects) {
        if (window.showMessage) window.showMessage('目标没有可处理的状态', 'info');
        return false;
    }

    const poisonEffect = statusEffects.find(function(e) {
        return e && (e.type === 'poison' || e.id === 'poison' || e.name === '中毒');
    });

    if (!poisonEffect) {
        if (window.showMessage) window.showMessage('没有中毒状态需要解除', 'info');
        return false;
    }

    // 解毒效果 = 毒术 * 0.5，清除毒素层数
    const removeCount = Math.max(1, Math.floor(poisonSkill * 0.5)); // 100毒术→50层；0毒术至少1
    const stacks = poisonEffect.stacks != null ? poisonEffect.stacks : (poisonEffect.duration || 1);
    const newStacks = Math.max(0, stacks - removeCount);

    if (newStacks <= 0) {
        // 完全解毒
        if (phys && phys.statusEffects) {
            phys.statusEffects = phys.statusEffects.filter(function(e) {
                return !(e && (e.type === 'poison' || e.id === 'poison' || e.name === '中毒'));
            });
        } else {
            entity.statusEffects = statusEffects.filter(function(e) {
                return !(e && (e.type === 'poison' || e.id === 'poison' || e.name === '中毒'));
            });
        }
        // 清除疼痛/毒相关标记
        // v13.0 注：phys.poisonLoad 现由 battle.js 战斗侧真实读写（poisoner命中累积+回合tick衰减），完全解毒时归零即生效
        if (phys && phys.poisonLoad != null) phys.poisonLoad = 0;
        if (window.showMessage) window.showMessage('毒素已完全清除！', 'success');
    } else {
        poisonEffect.stacks = newStacks;
        if (poisonEffect.duration != null) poisonEffect.duration = newStacks;
        if (window.showMessage) window.showMessage('毒素减轻，剩余' + newStacks + '层', 'info');
    }
    return true;
}

// 制毒（战斗外，炼丹房/工坊）
function craftPoison(poisonType) {
    const poison = POISON_TYPES[poisonType];
    if (!poison) {
        if (window.showMessage) window.showMessage('未知毒素类型', 'error');
        return false;
    }
    const poisonSkill = (typeof window.getLifeSkill === 'function')
        ? window.getLifeSkill('毒术')
        : ((window.currentCharData && window.currentCharData.lifeSkills && window.currentCharData.lifeSkills['毒术']) || 0);
    if (poisonSkill < poison.reqSkill) {
        if (window.showMessage) window.showMessage('需要毒术≥' + poison.reqSkill + '才能制作' + poison.name, 'warning');
        return false;
    }

    // 检查材料
    const materials = poison.materials || [];
    for (var i = 0; i < materials.length; i++) {
        var spec = _parseMaterialSpec(materials[i]);
        if (_countInventoryItem(spec.id) < spec.count) {
            if (window.showMessage) window.showMessage('缺少材料：' + _itemDisplayName(spec.id) + ' ×' + spec.count, 'error');
            return false;
        }
    }

    // 消耗材料
    for (var j = 0; j < materials.length; j++) {
        var sp = _parseMaterialSpec(materials[j]);
        _removeInventoryItem(sp.id, sp.count);
    }

    // 获得毒药（若无模板则用 addItem 动态 id）
    var poisonItemId = poison.itemId || ('poison_' + poisonType);
    if (typeof window.addItem === 'function') {
        window.addItem(poisonItemId, 1);
    } else if (window.inventory && typeof window.inventory.addItem === 'function') {
        window.inventory.addItem(poisonItemId, 1);
    }

    if (window.showMessage) window.showMessage('成功制作' + poison.name + '！', 'success');
    if (window.updateInventoryUI) window.updateInventoryUI();
    return true;
}

// 口才折扣系数（供商店等调用）：返回 0~1 的价格乘数
function getPlayerSpeechDiscount() {
    const speech = (typeof window.getLifeSkill === 'function')
        ? window.getLifeSkill('口才')
        : ((window.currentCharData && window.currentCharData.lifeSkills && window.currentCharData.lifeSkills['口才']) || 0);
    const discount = Math.floor(speech / 5); // 口才100→20%
    return Math.max(0.5, 1 - discount / 100); // 最低半价
}

// 导出
window.POISON_TYPES = POISON_TYPES;
window.detoxify = detoxify;
window.craftPoison = craftPoison;
window.getPlayerSpeechDiscount = getPlayerSpeechDiscount;
