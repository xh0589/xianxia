/**
 * item-tags.js - 物品NPC偏好标签映射
 * 用于NPC送礼偏好匹配
 * 加载顺序：在 npc-system.js 之前
 */

const ITEM_NPC_TAGS = {
    // === 武器类 ===
    'iron_sword': ['武器', '装备'],
    'flying_sword': ['武器', '装备'],
    'spirit_sword': ['武器', '装备'],
    'ancient_sword': ['武器', '装备', '古籍'],
    'moonlight_blade': ['武器', '装备'],
    'iron_hammer': ['武器', '装备', '锻造材料'],
    'spirit_spear': ['武器', '装备'],

    // === 装备类 ===
    'spirit_robe': ['装备', '现代法器'],
    'iron_armor': ['装备', '锻造材料'],
    'jade_belt': ['装备', '饰品'],
    'spirit_crown': ['装备', '现代法器'],
    'cloud_boots': ['装备'],
    'silk_gloves': ['装备'],

    // === 丹药类 ===
    'qi_pill': ['丹药', '消耗品'],
    'health_pill': ['丹药', '消耗品'],
    'spirit_pill': ['丹药', '消耗品', '炼丹材料'],
    'breakthrough_pill': ['丹药', '消耗品', '炼丹材料'],
    'detox_pill': ['丹药', '消耗品', '解毒丹'],
    'rejuvenation_pill': ['丹药', '消耗品'],

    // === 草药类 ===
    'spirit_herb': ['草药', '炼丹材料', '材料'],
    'lingzhi': ['草药', '炼丹材料', '材料'],
    'snow_lotus': ['草药', '炼丹材料', '冰属性材料'],
    'fire_grass': ['草药', '炼丹材料', '火属性物品'],
    'herb': ['草药', '材料'],

    // === 灵石类 ===
    'spirit_stone': ['灵石', '材料'],
    'spirit_crystal': ['灵石', '冰属性材料', '材料'],
    'spirit_essence': ['灵石', '材料'],

    // === 矿石类 ===
    'iron_ore': ['矿石', '锻造材料', '材料'],
    'mythril_ore': ['矿石', '锻造材料', '材料'],
    'crystal_ore': ['矿石', '锻造材料', '冰属性材料'],
    'fire_ore': ['矿石', '锻造材料', '火属性物品'],

    // === 古籍类 ===
    'ancient_tome': ['古籍', '书籍'],
    'skill_book': ['古籍', '书籍'],
    'sect_manual': ['古籍', '书籍'],
    'formation_scroll': ['古籍', '现代法器'],

    // === 食物/酒肉 ===
    'spirit_wine': ['酒肉', '消耗品', '食物'],
    'roasted_meat': ['酒肉', '消耗品', '食物'],
    'immortal_fruit': ['食物', '消耗品', '炼丹材料'],
    'spirit_tea': ['食物', '消耗品'],

    // === 毒药类 ===
    'poison_powder': ['毒药', '消耗品'],
    'venom_sac': ['毒药', '材料'],
    'nightshade': ['毒药', '草药'],

    // === 冰/火属性材料 ===
    'ice_essence': ['冰属性材料', '材料'],
    'fire_essence': ['火属性物品', '材料'],
    'frost_core': ['冰属性材料', '材料'],
    'flame_core': ['火属性物品', '材料'],

    // === 杂项 ===
    'jade_pendant': ['饰品', '装备'],
    'spirit_compass': ['现代法器', '装备'],
    'bag_of_holding': ['装备', '现代法器'],
    'teleport_scroll': ['消耗品'],
    'beast_core': ['材料', '炼丹材料'],
    'dragon_bone': ['材料', '锻造材料'],
    'phoenix_feather': ['材料', '火属性物品', '炼丹材料']
};

/**
 * 获取物品的NPC偏好标签
 * @param {string} itemId - 物品ID
 * @returns {string[]} 标签数组
 */
function getItemNPCTags(itemId) {
    return ITEM_NPC_TAGS[itemId] || [];
}

/**
 * 检查NPC是否喜欢某物品
 * @param {object} npc - NPC对象
 * @param {object} item - 物品对象（需有id或name属性）
 * @returns {{ liked: boolean|null, multiplier: number, feedback: string }}
 */
function checkNPCLikeItem(npc, item) {
    if (!npc || !item) return { liked: null, multiplier: 1.0, feedback: '' };
    const itemId = item.id || item.name || '';
    const tags = getItemNPCTags(itemId);
    const prefs = npc.preferences || {};
    
    // 检查喜欢列表
    for (const liked of (prefs.likedItems || [])) {
        if (tags.includes(liked.category)) {
            const mult = liked.multiplier || 2;
            return { liked: true, multiplier: mult, feedback: '眼睛一亮：「这正是我想要的！」' };
        }
    }
    
    // 检查不喜欢列表
    for (const disliked of (prefs.dislikedItems || [])) {
        if (tags.includes(disliked.category)) {
            const mult = disliked.multiplier || 0.5;
            return { liked: false, multiplier: mult, feedback: '勉强收下了，似乎不太感兴趣。' };
        }
    }
    
    return { liked: null, multiplier: 1.0, feedback: '收下了你的礼物。' };
}

if (typeof window !== 'undefined') {
    window.ITEM_NPC_TAGS = ITEM_NPC_TAGS;
    window.getItemNPCTags = getItemNPCTags;
    window.checkNPCLikeItem = checkNPCLikeItem;
}

console.log(`🏷️ 物品NPC标签系统已加载: ${Object.keys(ITEM_NPC_TAGS).length}种物品标签`);