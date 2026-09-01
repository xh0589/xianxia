/**
 * enhancement.js - 强化系统（v7.1 P0-1 完整实现）
 * 强化 / 精炼 / 附魔 / 突破 + 保底 + 转移 + 属性生效 + UI
 */

// ============ 配置 ============
var ENHANCE_CONFIG = {
    strengthen: {
        name: '强化', icon: '⚒️', maxLevel: 15,
        // 成功率随等级下降
        baseRate: function(lv) { return Math.max(0.15, 0.95 - lv * 0.05); },
        costSpirit: function(lv) { return 20 + lv * 15; },
        costGold: function(lv) { return 10 + lv * 5; },
        // 每级：攻击/防御 +4%，属性 +2%
        attackPerLevel: 0.04,
        defensePerLevel: 0.04,
        attrPerLevel: 0.02
    },
    refine: {
        name: '精炼', icon: '💎', maxLevel: 10,
        baseRate: function(lv) { return Math.max(0.2, 0.9 - lv * 0.06); },
        costSpirit: function(lv) { return 40 + lv * 25; },
        costGold: function(lv) { return 20 + lv * 10; },
        // 精炼主要提升属性与暴击
        attackPerLevel: 0.02,
        defensePerLevel: 0.02,
        attrPerLevel: 0.05,
        critPerLevel: 1
    },
    enchant: {
        name: '附魔', icon: '✨', maxLevel: 5,
        baseRate: function(lv) { return Math.max(0.25, 0.85 - lv * 0.1); },
        costSpirit: function(lv) { return 80 + lv * 50; },
        costGold: function(lv) { return 50 + lv * 30; },
        // 附魔提供特殊词条等级
        specialPerLevel: 1
    },
    breakthrough: {
        name: '突破', icon: '🌟', maxLevel: 3,
        baseRate: function(lv) { return Math.max(0.1, 0.5 - lv * 0.12); },
        costSpirit: function(lv) { return 200 + lv * 150; },
        costGold: function(lv) { return 100 + lv * 80; },
        // 突破大幅提升全属性
        attackPerLevel: 0.1,
        defensePerLevel: 0.1,
        attrPerLevel: 0.08
    }
};

var ENCHANT_POOL = [
    { id: 'flame', name: '烈焰', desc: '火伤+5%/级' },
    { id: 'frost', name: '霜寒', desc: '冰伤+5%/级' },
    { id: 'thunder', name: '雷霆', desc: '雷伤+5%/级' },
    { id: 'guard', name: '护体', desc: '减伤+3%/级' },
    { id: 'vampiric', name: '吸血', desc: '吸血+2%/级' },
    { id: 'swift', name: '疾风', desc: '速度+2/级' }
];

// 保底计数器
var enhancementPity = { strengthen: 0, refine: 0, enchant: 0, breakthrough: 0 };

// ============ 保底 ============
function getPityBonus(type) {
    var pity = enhancementPity[type] || 0;
    return Math.min(0.5, pity * 0.05);
}

function enhanceFailure(type) {
    enhancementPity[type] = (enhancementPity[type] || 0) + 1;
    savePityData();
    return Math.random() < 0.3; // 30% 降级
}

function enhanceSuccess(type) {
    enhancementPity[type] = 0;
    savePityData();
}

function savePityData() {
    try { localStorage.setItem('xianxia_enhancement_pity', JSON.stringify(enhancementPity)); } catch (e) {}
}

function loadPityData() {
    try {
        var saved = localStorage.getItem('xianxia_enhancement_pity');
        if (saved) enhancementPity = JSON.parse(saved);
    } catch (e) {}
}

// ============ 成功率 ============
function getEnhanceSuccessRate(type, level) {
    var cfg = ENHANCE_CONFIG[type];
    if (!cfg) return 0;
    var base = cfg.baseRate(level || 0);
    var pity = getPityBonus(type);
    // v18.0 生活技能：锻造熟练度部分转化为强化成功率（原副职业退役）
    var profBonus = Math.min(0.2, ((window.getLifeSkill ? getLifeSkill('锻造') : 0) || 0) * 0.004);
    return Math.min(0.95, base + pity + profBonus);
}

// ============ 装备字段规范化 ============
function ensureEnhanceFields(item) {
    if (!item) return item;
    if (typeof item.enhancementLevel !== 'number') item.enhancementLevel = 0;
    if (typeof item.refineLevel !== 'number') item.refineLevel = 0;
    if (typeof item.enchantLevel !== 'number') item.enchantLevel = 0;
    if (typeof item.breakthroughLevel !== 'number') item.breakthroughLevel = 0;
    if (!item.enchantType) item.enchantType = null;
    return item;
}

function getItemEnhanceLevel(item, type) {
    ensureEnhanceFields(item);
    if (type === 'strengthen') return item.enhancementLevel || 0;
    if (type === 'refine') return item.refineLevel || 0;
    if (type === 'enchant') return item.enchantLevel || 0;
    if (type === 'breakthrough') return item.breakthroughLevel || 0;
    return 0;
}

function setItemEnhanceLevel(item, type, level) {
    ensureEnhanceFields(item);
    if (type === 'strengthen') item.enhancementLevel = level;
    else if (type === 'refine') item.refineLevel = level;
    else if (type === 'enchant') item.enchantLevel = level;
    else if (type === 'breakthrough') item.breakthroughLevel = level;
}

// ============ 属性倍率（供 updateEquippedStats 使用） ============
/**
 * 返回装备因强化/精炼/突破产生的战斗与属性倍率
 * @returns {{ attackMul, defenseMul, attrMul, critBonus, speedBonus, specials[] }}
 */
function getEnhancementMultipliers(item) {
    var result = {
        attackMul: 1,
        defenseMul: 1,
        attrMul: 1,
        critBonus: 0,
        speedBonus: 0,
        specials: []
    };
    if (!item) return result;
    ensureEnhanceFields(item);

    var s = item.enhancementLevel || 0;
    var r = item.refineLevel || 0;
    var b = item.breakthroughLevel || 0;
    var e = item.enchantLevel || 0;

    var sc = ENHANCE_CONFIG.strengthen;
    var rc = ENHANCE_CONFIG.refine;
    var bc = ENHANCE_CONFIG.breakthrough;

    result.attackMul += s * sc.attackPerLevel + r * rc.attackPerLevel + b * bc.attackPerLevel;
    result.defenseMul += s * sc.defensePerLevel + r * rc.defensePerLevel + b * bc.defensePerLevel;
    result.attrMul += s * sc.attrPerLevel + r * rc.attrPerLevel + b * bc.attrPerLevel;
    result.critBonus += r * (rc.critPerLevel || 0);

    if (e > 0 && item.enchantType) {
        var enc = ENCHANT_POOL.find(function(x) { return x.id === item.enchantType; });
        var encName = enc ? enc.name : item.enchantType;
        result.specials.push('附魔·' + encName + ' Lv.' + e);
        if (item.enchantType === 'swift') result.speedBonus += e * 2;
        if (item.enchantType === 'guard') result.defenseMul += e * 0.03;
        if (item.enchantType === 'vampiric') result.specials.push('吸血+' + (e * 2) + '%');
        if (item.enchantType === 'flame') result.specials.push('火伤+' + (e * 5) + '%');
        if (item.enchantType === 'frost') result.specials.push('冰伤+' + (e * 5) + '%');
        if (item.enchantType === 'thunder') result.specials.push('雷伤+' + (e * 5) + '%');
    }

    if (s > 0) result.specials.push('强化+' + s);
    if (r > 0) result.specials.push('精炼+' + r);
    if (b > 0) result.specials.push('突破+' + b);

    return result;
}

/** 将强化倍率应用到单件装备的基础数值，返回加成后的 combat/attrs 增量描述 */
function applyEnhancementToItemStats(item) {
    if (!item) return null;
    var mul = getEnhancementMultipliers(item);
    var out = {
        attrs: {},
        combatBonus: {},
        special: mul.specials.slice()
    };

    if (item.attrs) {
        Object.keys(item.attrs).forEach(function(k) {
            var base = item.attrs[k] || 0;
            out.attrs[k] = Math.floor(base * mul.attrMul) - base; // 仅增量
            // 实际累加时用 floor(base * mul)，这里返回“强化额外部分”
        });
    }
    // 更稳妥：直接给“强化后总值 - 基础值”由调用方用 mul 计算
    out._mul = mul;
    return out;
}

// ============ 消耗检查 ============
function canAffordEnhance(type, level) {
    var cfg = ENHANCE_CONFIG[type];
    if (!cfg) return { ok: false, reason: '未知强化类型' };
    var needS = Math.max(0, Math.floor(cfg.costSpirit(level) * (typeof window.getCraftCostMul === 'function' ? window.getCraftCostMul() : 1))); // v18.6 工坊折扣
    var needG = cfg.costGold(level); // v18.6 笔误修正：配置字段为 costGold
    var stones = (window.inventory && window.inventory.currency && window.inventory.currency.spiritStones) || 0;
    var gold = (window.inventory && window.inventory.currency && window.inventory.currency.copper) || 0;
    if (stones < needS) return { ok: false, reason: '灵石不足（需要' + needS + '）', needS: needS, needG: needG };
    if (gold < needG) return { ok: false, reason: '铜钱不足（需要' + needG + '）', needS: needS, needG: needG };
    return { ok: true, needS: needS, needG: needG };
}

function payEnhanceCost(needS, needG) {
    if (!window.inventory || !window.inventory.currency) return false;
    window.inventory.currency.spiritStones -= needS;
    window.inventory.currency.copper -= needG;
    if (window.updateCurrencyUI) window.updateCurrencyUI();
    return true;
}

// ============ 核心：对指定槽位执行强化 ============
function enhanceEquipmentSlot(type, slotId) {
    var cfg = ENHANCE_CONFIG[type];
    if (!cfg) {
        if (window.showMessage) window.showMessage('未知操作：' + type, 'error');
        return { success: false, reason: 'bad_type' };
    }

    var item = window.currentEquipment && window.currentEquipment[slotId];
    if (!item) {
        if (window.showMessage) window.showMessage('该槽位没有装备！', 'error');
        return { success: false, reason: 'no_item' };
    }

    ensureEnhanceFields(item);
    var level = getItemEnhanceLevel(item, type);
    if (level >= cfg.maxLevel) {
        if (window.showMessage) window.showMessage(cfg.name + '已达上限（+' + cfg.maxLevel + '）', 'warning');
        return { success: false, reason: 'max_level' };
    }

    var cost = canAffordEnhance(type, level);
    if (!cost.ok) {
        if (window.showMessage) window.showMessage(cost.reason, 'error');
        return { success: false, reason: 'cost' };
    }

    payEnhanceCost(cost.needS, cost.needG);

    var rate = getEnhanceSuccessRate(type, level);
    var roll = Math.random();
    var success = roll < rate;

    if (success) {
        setItemEnhanceLevel(item, type, level + 1);
        if (type === 'enchant' && !item.enchantType) {
            item.enchantType = ENCHANT_POOL[Math.floor(Math.random() * ENCHANT_POOL.length)].id;
        }
        enhanceSuccess(type);
        if (typeof window.updateEquippedStats === 'function') window.updateEquippedStats();
        if (typeof window.renderEquipmentPanel === 'function') window.renderEquipmentPanel();
        if (window.showEffect) window.showEffect('level_up');
        var msg = '✅ ' + (item.name || '装备') + ' ' + cfg.name + '成功！→ +' + (level + 1) +
            '（成功率 ' + Math.floor(rate * 100) + '%）';
        if (window.showMessage) window.showMessage(msg, 'success');
        if (window.gameLog) window.gameLog.add(msg, 'success');
        // 副职业经验
        if (typeof window.addProfessionExp === 'function') {
            window.addProfessionExp('blacksmith', 5 + level * 2);
        }
        return { success: true, level: level + 1, item: item };
    }

    // 失败
    var downgraded = enhanceFailure(type);
    if (downgraded && level > 0) {
        setItemEnhanceLevel(item, type, level - 1);
        if (window.showMessage) {
            window.showMessage('❌ ' + cfg.name + '失败，装备降级至 +' + (level - 1) +
                '（保底+' + Math.floor(getPityBonus(type) * 100) + '%）', 'error');
        }
    } else {
        if (window.showMessage) {
            window.showMessage('❌ ' + cfg.name + '失败（保底累计 ' + (enhancementPity[type] || 0) +
                ' 次，下次+' + Math.floor(getPityBonus(type) * 100) + '%）', 'error');
        }
    }
    if (typeof window.updateEquippedStats === 'function') window.updateEquippedStats();
    if (typeof window.renderEquipmentPanel === 'function') window.renderEquipmentPanel();
    return { success: false, downgraded: downgraded, pity: enhancementPity[type] };
}

// ============ performEnhancement：兼容 app.js 调用 ============
/**
 * @param {string} action - strengthen | refine | enchant | breakthrough | forge | transfer
 * @param {string} [slotId] - 装备槽；缺省则打开选择 UI
 */
function performEnhancement(action, slotId) {
    // forge 走合成
    if (action === 'forge') {
        if (typeof window.openCraftingUI === 'function') {
            window.openCraftingUI('forging');
        } else if (typeof window.openCrafting === 'function') {
            window.openCrafting('forging');
        } else if (window.showMessage) {
            window.showMessage('请前往合成/锻造界面', 'info');
        }
        return false;
    }

    if (action === 'transfer') {
        openTransferUI();
        return true;
    }

    // 映射别名
    var type = action;
    if (action === 'enhance') type = 'strengthen';

    if (!ENHANCE_CONFIG[type]) {
        if (window.showMessage) window.showMessage(action + ' 功能暂未开放', 'info');
        return false;
    }

    if (slotId) {
        return enhanceEquipmentSlot(type, slotId).success;
    }

    // 无槽位：打开选择界面
    openEnhanceSlotPicker(type);
    return true;
}

// ============ UI：选择要强化的装备 ============
function openEnhanceSlotPicker(type) {
    var cfg = ENHANCE_CONFIG[type];
    if (!cfg) return;

    var slots = window.equipmentSlots || [
        { id: 'mainHand', name: '主手', icon: '⚔️' },
        { id: 'offHand', name: '副手', icon: '🛡️' },
        { id: 'head', name: '头部', icon: '🎩' },
        { id: 'body', name: '身体', icon: '👘' },
        { id: 'hands', name: '手部', icon: '🧤' },
        { id: 'feet', name: '脚部', icon: '👢' },
        { id: 'neck', name: '颈部', icon: '📿' },
        { id: 'waist', name: '腰部', icon: '🎗️' },
        { id: 'ring1', name: '戒指1', icon: '💍' },
        { id: 'ring2', name: '戒指2', icon: '💍' }
    ];

    var equips = window.currentEquipment || {};
    var rows = '';
    var hasAny = false;

    slots.forEach(function(slot) {
        var item = equips[slot.id];
        if (!item) {
            rows += '<div class="bg-gray-800/40 p-2 rounded mb-1 opacity-40 flex items-center gap-2">' +
                '<span>' + (slot.icon || '') + '</span><span class="text-gray-500 text-sm">' + slot.name + '：空</span></div>';
            return;
        }
        hasAny = true;
        ensureEnhanceFields(item);
        var lv = getItemEnhanceLevel(item, type);
        var rate = getEnhanceSuccessRate(type, lv);
        var cost = canAffordEnhance(type, lv);
        var mul = getEnhancementMultipliers(item);
        var tags = [];
        if (item.enhancementLevel) tags.push('强+' + item.enhancementLevel);
        if (item.refineLevel) tags.push('精+' + item.refineLevel);
        if (item.enchantLevel) tags.push('附+' + item.enchantLevel);
        if (item.breakthroughLevel) tags.push('突+' + item.breakthroughLevel);

        rows += '<div class="bg-gray-700/40 p-3 rounded mb-2 border border-gray-600 flex items-center gap-3">' +
            '<span class="text-2xl">' + (item.icon || slot.icon || '📦') + '</span>' +
            '<div class="flex-1 min-w-0">' +
            '<p class="font-bold text-orange-300 truncate">' + (item.name || '装备') +
            ' <span class="text-xs text-gray-400">[' + slot.name + ']</span></p>' +
            '<p class="text-xs text-gray-400">' + (tags.join(' · ') || '未强化') +
            ' · 攻×' + mul.attackMul.toFixed(2) + ' 防×' + mul.defenseMul.toFixed(2) + '</p>' +
            '<p class="text-xs text-yellow-500/80">本次' + cfg.name + '：+' + lv + '→+' + (lv + 1) +
            ' | 成功率 ' + Math.floor(rate * 100) + '% | 灵石' + cost.needS + ' 铜钱' + cost.needG +
            ' | 保底+' + Math.floor(getPityBonus(type) * 100) + '%</p>' +
            '</div>' +
            '<button onclick="window._doEnhanceFromUI(\'' + type + '\',\'' + slot.id + '\')" ' +
            'class="bg-orange-600 hover:bg-orange-500 text-white px-3 py-1 rounded text-sm whitespace-nowrap">' +
            cfg.icon + ' ' + cfg.name + '</button></div>';
    });

    if (!hasAny) {
        rows = '<p class="text-gray-400 text-center py-6">请先装备武器或防具后再来强化</p>';
    }

    var pityInfo = '保底：强化' + (enhancementPity.strengthen || 0) +
        ' / 精炼' + (enhancementPity.refine || 0) +
        ' / 附魔' + (enhancementPity.enchant || 0) +
        ' / 突破' + (enhancementPity.breakthrough || 0);

    var old = document.getElementById('enhance-picker-modal');
    if (old) old.remove();

    var modal = document.createElement('div');
    modal.id = 'enhance-picker-modal';
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
    modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
    modal.innerHTML =
        '<div class="bg-gray-800 border-2 border-orange-500 rounded-xl p-5 max-w-lg w-full mx-4 max-h-[85vh] overflow-y-auto">' +
        '<div class="flex justify-between items-center mb-3">' +
        '<h3 class="text-xl font-bold text-orange-400">' + cfg.icon + ' ' + cfg.name + '装备</h3>' +
        '<button onclick="this.closest(\'.fixed\').remove()" class="text-gray-400 hover:text-white text-2xl">&times;</button>' +
        '</div>' +
        '<p class="text-xs text-gray-500 mb-3">' + pityInfo + '</p>' +
        '<div>' + rows + '</div>' +
        '<div class="mt-3 flex gap-2 flex-wrap">' +
        '<button onclick="window.openEnhanceSlotPicker(\'strengthen\')" class="text-xs px-2 py-1 rounded bg-gray-700 text-orange-300">⚒️强化</button>' +
        '<button onclick="window.openEnhanceSlotPicker(\'refine\')" class="text-xs px-2 py-1 rounded bg-gray-700 text-cyan-300">💎精炼</button>' +
        '<button onclick="window.openEnhanceSlotPicker(\'enchant\')" class="text-xs px-2 py-1 rounded bg-gray-700 text-purple-300">✨附魔</button>' +
        '<button onclick="window.openEnhanceSlotPicker(\'breakthrough\')" class="text-xs px-2 py-1 rounded bg-gray-700 text-yellow-300">🌟突破</button>' +
        '<button onclick="window.openTransferUI()" class="text-xs px-2 py-1 rounded bg-gray-700 text-green-300">🔄转移</button>' +
        '</div></div>';
    document.body.appendChild(modal);
}

function _doEnhanceFromUI(type, slotId) {
    enhanceEquipmentSlot(type, slotId);
    // 刷新选择面板
    var modal = document.getElementById('enhance-picker-modal');
    if (modal) {
        modal.remove();
        openEnhanceSlotPicker(type);
    }
}

// ============ 完整强化大厅 UI ============
function openEnhancementUI() {
    var old = document.getElementById('enhance-hall-modal');
    if (old) old.remove();

    var stones = (window.inventory && window.inventory.currency && window.inventory.currency.spiritStones) || 0;
    var gold = (window.inventory && window.inventory.currency && window.inventory.currency.copper) || 0;

    var actions = [
        { type: 'strengthen', name: '强化装备', icon: '⚒️', desc: '提升攻击/防御（最高+15），失败可能降级' },
        { type: 'refine', name: '精炼装备', icon: '💎', desc: '大幅提升属性与暴击（最高+10）' },
        { type: 'enchant', name: '附魔', icon: '✨', desc: '随机附魔词条（最高+5）' },
        { type: 'breakthrough', name: '装备突破', icon: '🌟', desc: '质变提升全属性（最高+3，高风险）' },
        { type: 'transfer', name: '强化转移', icon: '🔄', desc: '将强化等级转移到另一件装备（耗转移石，损耗50%）' },
        { type: 'forge', name: '锻造新器', icon: '🗡️', desc: '使用材料锻造新武器/防具' }
    ];

    var html = actions.map(function(a) {
        return '<div class="bg-gray-700/30 p-3 rounded mb-2 flex items-center gap-3 border border-gray-600">' +
            '<span class="text-2xl">' + a.icon + '</span>' +
            '<div class="flex-1"><p class="font-bold text-orange-400">' + a.name + '</p>' +
            '<p class="text-xs text-gray-400">' + a.desc + '</p></div>' +
            '<button onclick="window._enhanceHallAction(\'' + a.type + '\')" ' +
            'class="bg-orange-600 hover:bg-orange-500 text-white px-3 py-1 rounded text-sm">操作</button></div>';
    }).join('');

    var modal = document.createElement('div');
    modal.id = 'enhance-hall-modal';
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
    modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
    modal.innerHTML =
        '<div class="bg-gray-800 border-2 border-orange-500 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">' +
        '<div class="flex justify-between items-center mb-4">' +
        '<h3 class="text-xl font-bold text-orange-500">⚒️ 铁匠铺 · 强化</h3>' +
        '<button onclick="this.closest(\'.fixed\').remove()" class="text-gray-400 hover:text-white text-2xl">&times;</button>' +
        '</div>' +
        '<p class="text-sm text-gray-400 mb-3">灵石：<span class="text-cyan-400">' + stones +
        '</span> · 铜钱：<span class="text-yellow-400">' + gold + '</span></p>' +
        '<div>' + html + '</div></div>';
    document.body.appendChild(modal);
}

function _enhanceHallAction(type) {
    var hall = document.getElementById('enhance-hall-modal');
    if (hall) hall.remove();
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(5, '铁匠铺');
    }
    performEnhancement(type);
}

// ============ 转移 UI ============
function openTransferUI() {
    var equips = window.currentEquipment || {};
    var slots = window.equipmentSlots || Object.keys(equips).map(function(id) {
        return { id: id, name: id, icon: '📦' };
    });

    var options = '';
    slots.forEach(function(slot) {
        var item = equips[slot.id];
        if (!item) return;
        ensureEnhanceFields(item);
        var lv = item.enhancementLevel || 0;
        options += '<option value="' + slot.id + '">' + (slot.icon || '') + ' ' + slot.name +
            ' - ' + (item.name || '?') + ' (强+' + lv + ')</option>';
    });

    if (!options) {
        if (window.showMessage) window.showMessage('至少需要两件已装备物品才能转移', 'warning');
        return;
    }

    var old = document.getElementById('enhance-transfer-modal');
    if (old) old.remove();

    var modal = document.createElement('div');
    modal.id = 'enhance-transfer-modal';
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
    modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
    modal.innerHTML =
        '<div class="bg-gray-800 border-2 border-green-500 rounded-xl p-6 max-w-md w-full mx-4">' +
        '<div class="flex justify-between items-center mb-4">' +
        '<h3 class="text-xl font-bold text-green-400">🔄 强化转移</h3>' +
        '<button onclick="this.closest(\'.fixed\').remove()" class="text-gray-400 hover:text-white text-2xl">&times;</button>' +
        '</div>' +
        '<p class="text-xs text-gray-400 mb-3">消耗 1 枚转移石，将源装备强化等级的 50% 转移到目标（源清零）。</p>' +
        '<label class="text-sm text-gray-300">源装备</label>' +
        '<select id="transfer-from" class="w-full bg-gray-900 border border-gray-600 rounded p-2 mb-3 text-white">' + options + '</select>' +
        '<label class="text-sm text-gray-300">目标装备</label>' +
        '<select id="transfer-to" class="w-full bg-gray-900 border border-gray-600 rounded p-2 mb-4 text-white">' + options + '</select>' +
        '<button onclick="window._doTransferFromUI()" class="w-full bg-green-600 hover:bg-green-500 text-white py-2 rounded font-bold">确认转移</button>' +
        '</div>';
    document.body.appendChild(modal);
}

function _doTransferFromUI() {
    var from = document.getElementById('transfer-from');
    var to = document.getElementById('transfer-to');
    if (!from || !to) return;
    if (from.value === to.value) {
        if (window.showMessage) window.showMessage('源与目标不能相同', 'warning');
        return;
    }
    var ok = transferEnhancement(from.value, to.value);
    if (ok) {
        var modal = document.getElementById('enhance-transfer-modal');
        if (modal) modal.remove();
        if (typeof window.updateEquippedStats === 'function') window.updateEquippedStats();
        if (typeof window.renderEquipmentPanel === 'function') window.renderEquipmentPanel();
    }
}

// ============ 强化转移 ============
function transferEnhancement(fromSlot, toSlot) {
    var fromItem = window.currentEquipment && window.currentEquipment[fromSlot];
    var toItem = window.currentEquipment && window.currentEquipment[toSlot];
    if (!fromItem || !toItem) {
        if (window.showMessage) window.showMessage('装备不存在', 'error');
        return false;
    }

    ensureEnhanceFields(fromItem);
    ensureEnhanceFields(toItem);

    var level = fromItem.enhancementLevel || 0;
    if (level <= 0) {
        if (window.showMessage) window.showMessage('源装备没有强化等级', 'warning');
        return false;
    }

    // 消耗转移石
    var hasStone = false;
    if (window.inventory && window.inventory.slots) {
        for (var i = 0; i < window.inventory.slots.length; i++) {
            var s = window.inventory.slots[i];
            if (s && s.templateId === 'spec_transfer_stone' && s.count >= 1) {
                s.count -= 1;
                if (s.count <= 0) window.inventory.slots[i] = null;
                hasStone = true;
                break;
            }
        }
    }
    // 兼容 addItem 计数 API
    if (!hasStone && typeof window.hasItem === 'function' && typeof window.removeItem === 'function') {
        if (window.hasItem('spec_transfer_stone', 1)) {
            window.removeItem('spec_transfer_stone', 1);
            hasStone = true;
        }
    }
    if (!hasStone) {
        if (window.showMessage) window.showMessage('需要转移石！可在铁匠铺/宝箱获取', 'error');
        return false;
    }

    var transferLevel = Math.floor(level * 0.5);
    if (transferLevel < 1) transferLevel = 1;
    fromItem.enhancementLevel = 0;
    toItem.enhancementLevel = (toItem.enhancementLevel || 0) + transferLevel;

    // 精炼/附魔不转移（策略性：只转强化等级）
    if (window.updateInventoryUI) window.updateInventoryUI();
    if (typeof window.updateEquippedStats === 'function') window.updateEquippedStats();
    if (window.showMessage) {
        window.showMessage('强化转移成功！+' + transferLevel + ' 已转移到「' + (toItem.name || '目标') + '」', 'success');
    }
    if (window.showEffect) window.showEffect('item_get');
    return true;
}

// ============ 描述文本（装备面板用） ============
function getEnhancementDescription(item) {
    if (!item) return '';
    ensureEnhanceFields(item);
    var parts = [];
    if (item.enhancementLevel) parts.push('强化+' + item.enhancementLevel);
    if (item.refineLevel) parts.push('精炼+' + item.refineLevel);
    if (item.enchantLevel) {
        var enc = ENCHANT_POOL.find(function(x) { return x.id === item.enchantType; });
        parts.push('附魔·' + (enc ? enc.name : '?') + '+' + item.enchantLevel);
    }
    if (item.breakthroughLevel) parts.push('突破+' + item.breakthroughLevel);
    var mul = getEnhancementMultipliers(item);
    if (parts.length) {
        parts.push('攻×' + mul.attackMul.toFixed(2));
    }
    return parts.join(' ');
}

// ============ 导出 ============
window.ENHANCE_CONFIG = ENHANCE_CONFIG;
window.ENCHANT_POOL = ENCHANT_POOL;
window.enhancementPity = enhancementPity;
window.getPityBonus = getPityBonus;
window.enhanceFailure = enhanceFailure;
window.enhanceSuccess = enhanceSuccess;
window.loadPityData = loadPityData;
window.savePityData = savePityData;
window.getEnhanceSuccessRate = getEnhanceSuccessRate;
window.getEnhancementMultipliers = getEnhancementMultipliers;
window.applyEnhancementToItemStats = applyEnhancementToItemStats;
window.getEnhancementDescription = getEnhancementDescription;
window.ensureEnhanceFields = ensureEnhanceFields;
window.enhanceEquipmentSlot = enhanceEquipmentSlot;
window.performEnhancement = performEnhancement;
window.transferEnhancement = transferEnhancement;
// 增强版本注册到 openEnhancementHall，app.js 的 openEnhancementUI 会委托到此
window.openEnhancementHall = openEnhancementUI;
// 同时注册到 XianXia 命名空间作为安全备份
if (window.XianXia) {
    window.XianXia.openEnhancementHall = openEnhancementUI;
}
window.openEnhanceSlotPicker = openEnhanceSlotPicker;
window.openTransferUI = openTransferUI;
window._doEnhanceFromUI = _doEnhanceFromUI;
window._enhanceHallAction = _enhanceHallAction;
window._doTransferFromUI = _doTransferFromUI;

// 自动加载保底
loadPityData();
