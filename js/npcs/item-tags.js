/**
 * item-tags.js - 物品 → NPC 送礼偏好标签
 * 标签一律取自物品表的显式字段（category / subtype / element），不按展示名推断；
 * ITEM_GIFT_TAG_OVERRIDES 只收「字段表达不出来的那几件」（药酒、解毒丹），按物品 id 声明。
 * 加载顺序：在 npc-system.js 之前
 */

const ITEM_CATEGORY_TAGS = {
    equipment: ['装备'],
    weapon: ['武器', '装备'],
    consumable: ['消耗品'],
    material: ['材料'],
    secret_art: ['古籍', '书籍'],
    quest: ['任务物品'],
    talismans: ['符箓', '消耗品']
};

const ITEM_SUBTYPE_TAGS = {
    // 兵器
    sword: ['武器'], dao: ['武器'], staff: ['武器'], spear: ['武器'],
    dagger: ['武器'], gauntlets: ['武器'], claw: ['武器'], fist: ['武器'],
    qin: ['武器', '乐器'],
    // 护身
    armor: ['装备'], robe: ['装备'], crown: ['装备'], hat: ['装备'],
    gloves: ['装备'], boots: ['装备'], shoes: ['装备'], shield: ['装备'],
    accessory: ['饰品'], belt: ['饰品'], ring: ['饰品'],
    // 入口
    pill: ['丹药', '消耗品'], perm_pill: ['丹药', '消耗品'],
    special_pill: ['丹药', '消耗品'], breakthrough: ['丹药', '消耗品'],
    medical: ['丹药', '消耗品'],
    herb: ['草药', '炼丹材料', '材料'], grass: ['草药', '炼丹材料', '材料'],
    food: ['食物', '消耗品'], fruit: ['食物', '消耗品'],
    // 炼材
    metal: ['矿石', '锻造材料', '材料'], ore: ['矿石', '锻造材料', '材料'],
    bone: ['锻造材料', '材料'], feather: ['材料'], essence: ['炼丹材料', '材料'],
    beast: ['炼丹材料', '材料'], enhance: ['锻造材料', '材料'], stone: ['材料'],
    // 文书与杂项
    internal: ['古籍', '书籍'], movement: ['古籍', '书籍'],
    manual: ['古籍', '书籍'], cultivation: ['古籍', '书籍'],
    talisman: ['符箓', '消耗品'], poison: ['毒药', '消耗品'],
    currency: ['灵石'], token: ['信物'], map: ['杂物'], key: ['杂物'], misc: ['杂物']
};

const ITEM_ELEMENT_TAGS = {
    fire: ['火属性物品'],
    ice: ['冰属性物品'],
    thunder: ['雷属性物品'],
    wind: ['风属性物品']
};
// 材料类带属性时，偏好表里用的是「X属性材料」那一词
const ELEMENT_MATERIAL_TAGS = {
    fire: ['火属性材料'],
    ice: ['冰属性材料'],
    thunder: ['雷属性材料'],
    wind: ['风属性材料']
};

// 字段说不清的少数件：药酒算「酒肉」，化毒那两枚算「解毒丹」
const ITEM_GIFT_TAG_OVERRIDES = {
    food_thousand_wine: ['酒肉', '食物', '消耗品'],
    food_crane_wine: ['酒肉', '食物', '消耗品'],
    food_flower_wine: ['酒肉', '食物', '消耗品'],
    pill_antidote: ['丹药', '解毒丹', '消耗品'],
    pill_poison_resist: ['丹药', '解毒丹', '消耗品']
};

// slash/pierce/blunt 是挥砍类型不是五行属性，不能当属性标用
const SWING_DAMAGE_TYPES = { slash: 1, pierce: 1, blunt: 1 };

function elementOf(item) {
    if (item.element) return item.element;
    if (item.effect && item.effect.element) return item.effect.element;
    if (item.damageType && !SWING_DAMAGE_TYPES[item.damageType]) return item.damageType;
    return null;
}

/**
 * 获取物品的NPC偏好标签
 * @param {string} itemId
 * @returns {string[]}
 */
function getItemNPCTags(itemId) {
    if (!itemId) return [];
    const override = ITEM_GIFT_TAG_OVERRIDES[itemId];
    if (override) return override.slice();
    const item = (typeof window !== 'undefined' && window.itemById) ? window.itemById[itemId] : null;
    if (!item) return [];
    const out = [];
    const seen = {};
    const add = list => { for (const t of (list || [])) if (!seen[t]) { seen[t] = 1; out.push(t); } };
    add(ITEM_CATEGORY_TAGS[item.category]);
    add(ITEM_SUBTYPE_TAGS[item.subtype]);
    const el = elementOf(item);
    add(ITEM_ELEMENT_TAGS[el]);
    if (el && item.category === 'material') add(ELEMENT_MATERIAL_TAGS[el]);
    return out;
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
    if (!tags.length) return { liked: null, multiplier: 1.0, feedback: '收下了你的礼物。' };
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
    window.ITEM_CATEGORY_TAGS = ITEM_CATEGORY_TAGS;
    window.ITEM_SUBTYPE_TAGS = ITEM_SUBTYPE_TAGS;
    window.ITEM_GIFT_TAG_OVERRIDES = ITEM_GIFT_TAG_OVERRIDES;
    window.getItemNPCTags = getItemNPCTags;
    window.checkNPCLikeItem = checkNPCLikeItem;
}

console.log(`🏷️ 物品NPC标签系统已加载: 类目映射 ${Object.keys(ITEM_CATEGORY_TAGS).length} 类 / 子类映射 ${Object.keys(ITEM_SUBTYPE_TAGS).length} 种`);
