// ==================== crafting.js - 物品合成系统 ====================
// 借鉴《太吾绘卷》、《觅长生》的合成设计

// ============ 合成配方分类 ============
const CRAFTING_CATEGORIES = {
    PILFAR: 'pilfer',        // 炼丹
    FORGING: 'forging',      // 锻造
    TALISMAN: 'talismans',   // 符箓
    HERB: 'herb',            // 草药加工
    FOOD: 'food'             // 烹饪
};

// ============ 合成品质 ============
const CRAFT_QUALITY = {
    FAIL: { id: 'fail', name: '失败', chance: 0.3, result: null },
    POOR: { id: 'poor', name: '劣质', chance: 0.15, multiplier: 0.8 },
    NORMAL: { id: 'normal', name: '普通', chance: 0.4, multiplier: 1.0 },
    GOOD: { id: 'good', name: '优良', chance: 0.2, multiplier: 1.3 },
    EXCELLENT: { id: 'excellent', name: '杰出', chance: 0.1, multiplier: 1.5 }
};

// ============ 炼丹配方（v5.0 使用扩展新材料） ============
const pilferRecipes = [
    // ---- 基础恢复 ----
    {
        id: 'recipe_small_recovery',
        name: '小还丹',
        category: CRAFTING_CATEGORIES.PILFAR,
        requiredSkills: { 炼制: 5 },
        materials: [
            { itemId: 'mat_liquorice', count: 2 },
            { itemId: 'mat_scutellaria', count: 1 }
        ],
        result: { itemId: 'pill_small_recovery', count: 1 },
        qiCost: 10, timeCost: 5,
        desc: '恢复30点生命值的基础丹药'
    },
    {
        id: 'recipe_big_recovery',
        name: '大还丹',
        category: CRAFTING_CATEGORIES.PILFAR,
        requiredSkills: { 炼制: 15 },
        materials: [
            { itemId: 'mat_lingzhi', count: 2 },
            { itemId: 'mat_ginseng', count: 1 }
        ],
        result: { itemId: 'pill_big_recovery', count: 1 },
        qiCost: 20, timeCost: 8,
        desc: '恢复80点生命值'
    },
    {
        id: 'recipe_spring_recovery',
        name: '回春丹',
        category: CRAFTING_CATEGORIES.PILFAR,
        requiredSkills: { 炼制: 25 },
        materials: [
            { itemId: 'mat_thousand_lingzhi', count: 2 },
            { itemId: 'mat_snow_lotus', count: 1 },
            { itemId: 'mat_lingzhi', count: 3 }
        ],
        result: { itemId: 'pill_spring_recovery', count: 1 },
        qiCost: 35, timeCost: 12,
        desc: '恢复200点生命值'
    },
    {
        id: 'recipe_nine_revival',
        name: '九转还魂丹',
        category: CRAFTING_CATEGORIES.PILFAR,
        requiredSkills: { 炼制: 50 },
        materials: [
            { itemId: 'mat_ten_thousand_ginseng', count: 2 },
            { itemId: 'mat_heaven_heart_flower', count: 1 },
            { itemId: 'mat_dragon_blood', count: 1 },
            { itemId: 'mat_five_element_essence', count: 3 }
        ],
        result: { itemId: 'pill_nine_revival', count: 1 },
        qiCost: 80, timeCost: 30,
        desc: '恢复500点生命值'
    },
    {
        id: 'recipe_life_creation',
        name: '生生造化丹',
        category: CRAFTING_CATEGORIES.PILFAR,
        requiredSkills: { 炼制: 80 },
        materials: [
            { itemId: 'mat_nine_leaf_lingzhi', count: 2 },
            { itemId: 'mat_peach_fruit', count: 1 },
            { itemId: 'mat_phoenix_blood', count: 1 },
            { itemId: 'mat_chaos_stone', count: 1 }
        ],
        result: { itemId: 'pill_life_creation', count: 1 },
        qiCost: 150, timeCost: 60,
        desc: '传说级疗伤圣药'
    },

    // ---- 真气恢复 ----
    {
        id: 'recipe_qi_powder',
        name: '补气散',
        category: CRAFTING_CATEGORIES.PILFAR,
        requiredSkills: { 炼制: 5 },
        materials: [ { itemId: 'mat_liquorice', count: 3 } ],
        result: { itemId: 'pill_qi_powder', count: 1 },
        qiCost: 10, timeCost: 5,
        desc: '恢复20点真气'
    },
    {
        id: 'recipe_qi_gather',
        name: '聚气丹',
        category: CRAFTING_CATEGORIES.PILFAR,
        requiredSkills: { 炼制: 15 },
        materials: [
            { itemId: 'mat_lingzhi', count: 2 },
            { itemId: 'mat_ginseng', count: 1 },
            { itemId: 'mat_spirit_grass', count: 3 }
        ],
        result: { itemId: 'pill_qi_gather', count: 1 },
        qiCost: 25, timeCost: 10,
        desc: '恢复60点真气'
    },
    {
        id: 'recipe_qi_return',
        name: '回灵丹',
        category: CRAFTING_CATEGORIES.PILFAR,
        requiredSkills: { 炼制: 30 },
        materials: [
            { itemId: 'mat_thousand_lingzhi', count: 2 },
            { itemId: 'mat_he_shou_wu', count: 2 },
            { itemId: 'mat_five_element_essence', count: 1 }
        ],
        result: { itemId: 'pill_qi_return', count: 1 },
        qiCost: 40, timeCost: 15,
        desc: '恢复150点真气'
    },
    {
        id: 'recipe_qi_condense',
        name: '凝元丹',
        category: CRAFTING_CATEGORIES.PILFAR,
        requiredSkills: { 炼制: 45 },
        materials: [
            { itemId: 'mat_ten_thousand_ginseng', count: 2 },
            { itemId: 'mat_earth_spirit_root', count: 1 },
            { itemId: 'mat_dragon_saliva', count: 2 }
        ],
        result: { itemId: 'pill_qi_condense', count: 1 },
        qiCost: 70, timeCost: 25,
        desc: '恢复400点真气'
    },

    // ---- 永久增益 ----
    {
        id: 'recipe_body_foundation',
        name: '培元丹',
        category: CRAFTING_CATEGORIES.PILFAR,
        requiredSkills: { 炼制: 30 },
        materials: [
            { itemId: 'mat_ginseng', count: 3 },
            { itemId: 'mat_lingzhi', count: 3 },
            { itemId: 'mat_snow_lotus', count: 2 }
        ],
        result: { itemId: 'pill_body_foundation', count: 1 },
        qiCost: 50, timeCost: 20,
        desc: '体质永久+2'
    },
    {
        id: 'recipe_foundation_pill',
        name: '筑基丹',
        category: CRAFTING_CATEGORIES.PILFAR,
        requiredSkills: { 炼制: 50 },
        materials: [
            { itemId: 'mat_ten_thousand_ginseng', count: 2 },
            { itemId: 'mat_five_element_essence', count: 3 },
            { itemId: 'mat_dragon_bone', count: 1 },
            { itemId: 'mat_thousand_lingzhi', count: 3 }
        ],
        result: { itemId: 'pill_foundation', count: 1 },
        qiCost: 100, timeCost: 30,
        desc: '筑基成功率+30%'
    },
    {
        id: 'recipe_golden_core',
        name: '金丹丹',
        category: CRAFTING_CATEGORIES.PILFAR,
        requiredSkills: { 炼制: 65 },
        materials: [
            { itemId: 'mat_heaven_heart_flower', count: 2 },
            { itemId: 'mat_dragon_blood', count: 1 },
            { itemId: 'mat_purple_gold', count: 2 },
            { itemId: 'mat_five_element_essence', count: 5 }
        ],
        result: { itemId: 'pill_golden_core', count: 1 },
        qiCost: 150, timeCost: 45,
        desc: '金丹成功率+20%'
    },
    {
        id: 'recipe_marrow_wash',
        name: '洗髓丹',
        category: CRAFTING_CATEGORIES.PILFAR,
        requiredSkills: { 炼制: 80 },
        materials: [
            { itemId: 'mat_nine_leaf_lingzhi', count: 2 },
            { itemId: 'mat_phoenix_blood', count: 2 },
            { itemId: 'mat_dragon_crystal', count: 1 },
            { itemId: 'mat_star_sand', count: 3 }
        ],
        result: { itemId: 'pill_marrow_wash', count: 1 },
        qiCost: 200, timeCost: 60,
        desc: '全属性+5，脱胎换骨'
    },

    // ---- 临时增益 ----
    {
        id: 'recipe_diamond',
        name: '金刚丹',
        category: CRAFTING_CATEGORIES.PILFAR,
        requiredSkills: { 炼制: 20 },
        materials: [
            { itemId: 'mat_lingzhi', count: 3 },
            { itemId: 'mat_demon_beast_core', count: 1 },
            { itemId: 'mat_iron_ore', count: 5 }
        ],
        result: { itemId: 'pill_diamond', count: 1 },
        qiCost: 30, timeCost: 10,
        desc: '防御+20%持续3回合'
    },
    {
        id: 'recipe_tiger_power',
        name: '虎力丹',
        category: CRAFTING_CATEGORIES.PILFAR,
        requiredSkills: { 炼制: 20 },
        materials: [
            { itemId: 'mat_ginseng', count: 2 },
            { itemId: 'mat_demon_beast_fang', count: 2 },
            { itemId: 'mat_demon_beast_core', count: 1 }
        ],
        result: { itemId: 'pill_tiger_power', count: 1 },
        qiCost: 30, timeCost: 10,
        desc: '攻击+20%持续3回合'
    },
    {
        id: 'recipe_dragon_tiger',
        name: '龙虎丹',
        category: CRAFTING_CATEGORIES.PILFAR,
        requiredSkills: { 炼制: 50 },
        materials: [
            { itemId: 'mat_dragon_scale', count: 2 },
            { itemId: 'mat_demon_beast_core', count: 3 },
            { itemId: 'mat_thousand_lingzhi', count: 3 },
            { itemId: 'mat_five_element_essence', count: 2 }
        ],
        result: { itemId: 'pill_dragon_tiger', count: 1 },
        qiCost: 80, timeCost: 25,
        desc: '全属性+30%持续5回合'
    },

    // ---- 医疗物品 ----
    {
        id: 'recipe_bandage',
        name: '绷带',
        category: CRAFTING_CATEGORIES.PILFAR,
        requiredSkills: { 炼制: 5 },
        materials: [
            { itemId: 'mat_spirit_grass', count: 2 },
            { itemId: 'mat_liquorice', count: 1 }
        ],
        result: { itemId: 'med_bandage', count: 1 },
        qiCost: 5, timeCost: 3,
        desc: '基础包扎用品，稳定度+40'
    },
    {
        id: 'recipe_bandage_advanced',
        name: '灵布绷带',
        category: CRAFTING_CATEGORIES.PILFAR,
        requiredSkills: { 炼制: 20 },
        materials: [
            { itemId: 'mat_lingzhi', count: 2 },
            { itemId: 'mat_spirit_grass', count: 3 }
        ],
        result: { itemId: 'med_bandage_advanced', count: 1 },
        qiCost: 15, timeCost: 8,
        desc: '优质包扎用品，稳定度+65'
    },
    {
        id: 'recipe_hemostatic_pill',
        name: '止血丹',
        category: CRAFTING_CATEGORIES.PILFAR,
        requiredSkills: { 炼制: 25 },
        materials: [
            { itemId: 'mat_lingzhi', count: 3 },
            { itemId: 'mat_ginseng', count: 2 },
            { itemId: 'mat_demon_beast_blood', count: 1 }
        ],
        result: { itemId: 'pill_hemostatic', count: 1 },
        qiCost: 25, timeCost: 10,
        desc: '全身外出血减半，内出血停止累积'
    },

    // ---- 特殊丹药 ----
    {
        id: 'recipe_antidote',
        name: '解毒丹',
        category: CRAFTING_CATEGORIES.PILFAR,
        requiredSkills: { 炼制: 15 },
        materials: [
            { itemId: 'mat_liquorice', count: 3 },
            { itemId: 'mat_scutellaria', count: 3 }
        ],
        result: { itemId: 'pill_antidote', count: 1 },
        qiCost: 15, timeCost: 5,
        desc: '解除中毒状态'
    },
    {
        id: 'recipe_fasting',
        name: '辟谷丹',
        category: CRAFTING_CATEGORIES.PILFAR,
        requiredSkills: { 炼制: 10 },
        materials: [
            { itemId: 'mat_liquorice', count: 5 },
            { itemId: 'mat_lingzhi', count: 1 }
        ],
        result: { itemId: 'pill_fasting', count: 1 },
        qiCost: 10, timeCost: 5,
        desc: '3天不饿'
    }
];

// ============ 锻造配方（v5.0 使用扩展新材料） ============
const forgingRecipes = [
    {
        id: 'recipe_iron_sword',
        name: '玄铁剑',
        category: CRAFTING_CATEGORIES.FORGING,
        requiredSkills: { 锻造: 20 },
        materials: [
            { itemId: 'mat_iron_ore', count: 10 },
            { itemId: 'mat_dark_iron', count: 5 }
        ],
        result: { itemId: 'wpn_dark_iron_sword', count: 1 },
        qiCost: 50, timeCost: 20,
        desc: '由玄铁打造的基础长剑'
    },
    {
        id: 'recipe_steel_sword',
        name: '青钢剑',
        category: CRAFTING_CATEGORIES.FORGING,
        requiredSkills: { 锻造: 30 },
        materials: [
            { itemId: 'mat_refined_iron', count: 10 },
            { itemId: 'mat_refined_copper', count: 5 },
            { itemId: 'mat_copper_ore', count: 8 }
        ],
        result: { itemId: 'wpn_steel_sword', count: 1 },
        qiCost: 60, timeCost: 25,
        desc: '精钢锻造的长剑'
    },
    {
        id: 'recipe_frost_moon',
        name: '霜月剑',
        category: CRAFTING_CATEGORIES.FORGING,
        requiredSkills: { 锻造: 40 },
        materials: [
            { itemId: 'mat_cold_iron', count: 8 },
            { itemId: 'mat_mithril', count: 3 },
            { itemId: 'mat_five_element_essence', count: 2 }
        ],
        result: { itemId: 'wpn_frost_moon', count: 1 },
        qiCost: 80, timeCost: 35,
        desc: '寒铁铸成的冰霜之剑'
    },
    {
        id: 'recipe_cloud_armor',
        name: '云纹甲',
        category: CRAFTING_CATEGORIES.FORGING,
        requiredSkills: { 锻造: 35 },
        materials: [
            { itemId: 'mat_iron_ore', count: 20 },
            { itemId: 'mat_dark_iron', count: 10 },
            { itemId: 'mat_five_element_essence', count: 3 }
        ],
        result: { itemId: 'arm_cloud_armor', count: 1 },
        qiCost: 80, timeCost: 40,
        desc: '织有云纹的轻便护甲'
    },
    {
        id: 'recipe_dragon_scale_armor',
        name: '龙鳞甲',
        category: CRAFTING_CATEGORIES.FORGING,
        requiredSkills: { 锻造: 50 },
        materials: [
            { itemId: 'mat_dragon_scale', count: 10 },
            { itemId: 'mat_dragon_scale_iron', count: 5 },
            { itemId: 'mat_dragon_bone', count: 2 },
            { itemId: 'mat_fire_crystal', count: 3 }
        ],
        result: { itemId: 'arm_dragon_scale_armor', count: 1 },
        qiCost: 120, timeCost: 50,
        desc: '龙鳞制成的重甲'
    },
    {
        id: 'recipe_flying_sword',
        name: '御剑',
        category: CRAFTING_CATEGORIES.FORGING,
        requiredSkills: { 锻造: 50 },
        materials: [
            { itemId: 'mat_dragon_bone', count: 3 },
            { itemId: 'mat_five_element_essence', count: 5 },
            { itemId: 'mat_meteorite', count: 3 }
        ],
        currency: { spiritStones: 500 },
        result: { itemId: 'flying_sword', count: 1 },
        qiCost: 150, timeCost: 60,
        desc: '修仙者常用的飞剑，可御剑飞行'
    },
    {
        id: 'recipe_gan_jiang',
        name: '干将剑',
        category: CRAFTING_CATEGORIES.FORGING,
        requiredSkills: { 锻造: 70 },
        materials: [
            { itemId: 'mat_meteorite', count: 5 },
            { itemId: 'mat_purple_gold', count: 5 },
            { itemId: 'mat_dragon_blood', count: 2 },
            { itemId: 'mat_five_element_essence', count: 8 }
        ],
        result: { itemId: 'wpn_gan_jiang', count: 1 },
        qiCost: 200, timeCost: 80,
        desc: '上古名剑，攻击+15%'
    },
    {
        id: 'recipe_dragon_slayer',
        name: '屠龙刀',
        category: CRAFTING_CATEGORIES.FORGING,
        requiredSkills: { 锻造: 85 },
        materials: [
            { itemId: 'mat_dragon_crystal', count: 2 },
            { itemId: 'mat_dragon_bone', count: 5 },
            { itemId: 'mat_sky_iron', count: 3 },
            { itemId: 'mat_star_iron', count: 2 },
            { itemId: 'mat_five_element_essence', count: 10 }
        ],
        result: { itemId: 'wpn_dragon_slayer', count: 1 },
        qiCost: 300, timeCost: 120,
        desc: '屠龙之刃，对龙+100%'
    }
];

// ============ 符箓配方（v5.0 使用扩展新材料） ============
const talismanRecipes = [
    {
        id: 'recipe_fireball',
        name: '火球符',
        category: CRAFTING_CATEGORIES.TALISMAN,
        requiredSkills: { 学识: 10 },
        materials: [
            { itemId: 'mat_spirit_grass', count: 5 },
            { itemId: 'mat_fire_crystal', count: 1 }
        ],
        currency: { spiritStones: 30 },
        result: { itemId: 'tal_fireball', count: 3 },
        qiCost: 20, timeCost: 8,
        desc: '基础火系符箓'
    },
    {
        id: 'recipe_lightning',
        name: '雷击符',
        category: CRAFTING_CATEGORIES.TALISMAN,
        requiredSkills: { 学识: 20 },
        materials: [
            { itemId: 'mat_spirit_grass', count: 8 },
            { itemId: 'mat_five_element_essence', count: 2 }
        ],
        currency: { spiritStones: 60 },
        result: { itemId: 'tal_lightning', count: 2 },
        qiCost: 30, timeCost: 12,
        desc: '雷系符箓'
    },
    {
        id: 'recipe_shield',
        name: '护身符',
        category: CRAFTING_CATEGORIES.TALISMAN,
        requiredSkills: { 学识: 20 },
        materials: [
            { itemId: 'mat_spirit_grass', count: 5 },
            { itemId: 'mat_demon_beast_core', count: 2 }
        ],
        currency: { spiritStones: 70 },
        result: { itemId: 'tal_shield', count: 2 },
        qiCost: 30, timeCost: 10,
        desc: '防护符箓'
    },
    {
        id: 'recipe_teleport',
        name: '传送符',
        category: CRAFTING_CATEGORIES.TALISMAN,
        requiredSkills: { 学识: 30 },
        materials: [
            { itemId: 'mat_ginseng', count: 2 },
            { itemId: 'mat_five_element_essence', count: 3 },
            { itemId: 'mat_space_crystal', count: 1 }
        ],
        currency: { spiritStones: 200 },
        result: { itemId: 'tal_teleport', count: 1 },
        qiCost: 50, timeCost: 20,
        desc: '瞬间传送'
    },
    {
        id: 'recipe_heavenly_thunder',
        name: '天雷符',
        category: CRAFTING_CATEGORIES.TALISMAN,
        requiredSkills: { 学识: 50 },
        materials: [
            { itemId: 'mat_five_element_essence', count: 5 },
            { itemId: 'mat_star_sand', count: 3 },
            { itemId: 'mat_sun_stone', count: 2 }
        ],
        currency: { spiritStones: 500 },
        result: { itemId: 'tal_heavenly_thunder', count: 1 },
        qiCost: 80, timeCost: 30,
        desc: '天雷之威'
    },
    {
        id: 'recipe_purify',
        name: '净化符',
        category: CRAFTING_CATEGORIES.TALISMAN,
        requiredSkills: { 学识: 35 },
        materials: [
            { itemId: 'mat_thousand_lingzhi', count: 2 },
            { itemId: 'mat_moon_stone', count: 1 },
            { itemId: 'mat_five_element_essence', count: 3 }
        ],
        currency: { spiritStones: 300 },
        result: { itemId: 'tal_purify', count: 1 },
        qiCost: 60, timeCost: 20,
        desc: '清除所有负面状态'
    }
];

// ============ 烹饪配方（v5.0 使用扩展新材料） ============
const foodRecipes = [
    {
        id: 'recipe_spirit_rice',
        name: '灵米饭',
        category: CRAFTING_CATEGORIES.FOOD,
        requiredSkills: { 烹饪: 5 },
        materials: [
            { itemId: 'mat_spirit_grass', count: 3 },
            { itemId: 'mat_lingzhi', count: 1 }
        ],
        result: { itemId: 'food_spirit_rice', count: 1 },
        qiCost: 5, timeCost: 5,
        desc: '恢复40精力和20HP'
    },
    {
        id: 'recipe_ginseng_soup',
        name: '参汤',
        category: CRAFTING_CATEGORIES.FOOD,
        requiredSkills: { 烹饪: 10 },
        materials: [
            { itemId: 'mat_ginseng', count: 2 },
            { itemId: 'mat_liquorice', count: 3 }
        ],
        result: { itemId: 'food_ginseng_soup', count: 1 },
        qiCost: 10, timeCost: 8,
        desc: '恢复50HP和20真气'
    },
    {
        id: 'recipe_lingzhi_porridge',
        name: '灵芝粥',
        category: CRAFTING_CATEGORIES.FOOD,
        requiredSkills: { 烹饪: 15 },
        materials: [
            { itemId: 'mat_lingzhi', count: 3 },
            { itemId: 'mat_he_shou_wu', count: 2 }
        ],
        result: { itemId: 'food_lingzhi_porridge', count: 1 },
        qiCost: 10, timeCost: 10,
        desc: '恢复60HP和30精力'
    },
    {
        id: 'recipe_immortal_tea',
        name: '仙露茶',
        category: CRAFTING_CATEGORIES.FOOD,
        requiredSkills: { 烹饪: 20 },
        materials: [
            { itemId: 'mat_snow_lotus', count: 2 },
            { itemId: 'mat_thousand_lingzhi', count: 1 },
            { itemId: 'mat_spirit_grass', count: 5 }
        ],
        result: { itemId: 'food_immortal_tea', count: 1 },
        qiCost: 15, timeCost: 12,
        desc: '恢复80真气和心情+10'
    },

    // ---- v9.7 突破丹药 ----
    {
        id: 'recipe_peiyuan',
        name: '培元丹',
        category: CRAFTING_CATEGORIES.PILFAR,
        requiredSkills: { 炼制: 10 },
        materials: [
            { itemId: 'mat_lingzhi', count: 3 },
            { itemId: 'mat_iron_ore', count: 1 }
        ],
        result: { itemId: 'pill_peiyuan', count: 1 },
        qiCost: 30, timeCost: 15,
        desc: '炼气突破时成功率+10%'
    },
    {
        id: 'recipe_zhuji',
        name: '筑基丹',
        category: CRAFTING_CATEGORIES.PILFAR,
        requiredSkills: { 炼制: 20 },
        materials: [
            { itemId: 'mat_spirit_grass', count: 5 },
            { itemId: 'mat_lingzhi', count: 3 },
            { itemId: 'mat_iron_ore', count: 2 }
        ],
        result: { itemId: 'pill_zhuji', count: 1 },
        qiCost: 50, timeCost: 20,
        desc: '筑基期突破时成功率+12%'
    },
    {
        id: 'recipe_ningyuan',
        name: '凝元丹',
        category: CRAFTING_CATEGORIES.PILFAR,
        requiredSkills: { 炼制: 30 },
        materials: [
            { itemId: 'mat_thousand_lingzhi', count: 1 },
            { itemId: 'mat_five_element_essence', count: 3 }
        ],
        result: { itemId: 'pill_ningyuan', count: 1 },
        qiCost: 80, timeCost: 30,
        desc: '金丹期突破时成功率+15%'
    },
    {
        id: 'recipe_jieying',
        name: '结婴丹',
        category: CRAFTING_CATEGORIES.PILFAR,
        requiredSkills: { 炼制: 40 },
        materials: [
            { itemId: 'mat_ten_thousand_ginseng', count: 1 },
            { itemId: 'mat_five_element_essence', count: 5 },
            { itemId: 'mat_dragon_saliva', count: 1 }
        ],
        result: { itemId: 'pill_jieying', count: 1 },
        qiCost: 120, timeCost: 45,
        desc: '元婴期突破时成功率+18%'
    }
];

// ============ 所有可用配方合并 ============
// 配方原始数据可以提前规划，但只有“产物存在且已实装”的配方进入玩法索引。
// 防止制作出无法使用的占位物，或因为历史残留产物 ID 断链而吞材料。
function isRecipeContentReady(recipe) {
    if (!recipe || !recipe.result || !recipe.result.itemId) return false;
    const result = window.itemById && window.itemById[recipe.result.itemId];
    return !!result && result.implemented !== false;
}

const allRecipes = [
    ...pilferRecipes,
    ...forgingRecipes,
    ...talismanRecipes,
    ...foodRecipes
].filter(isRecipeContentReady);

// ============ 配方ID映射 ============
const recipeById = {};
allRecipes.forEach(recipe => {
    recipeById[recipe.id] = recipe;
});

// ============ 合成状态 ============
let craftingState = {
    isCrafting: false,
    currentRecipe: null,
    progress: 0,
    startTime: null
};

// ============ 检查是否有足够材料 ============
function checkMaterials(recipe) {
    if (!recipe) return false;
    
    // 检查材料物品
    if (recipe.materials) {
        for (const material of recipe.materials) {
            const item = window.itemById?.[material.itemId];
            if (!item) {
                // 材料ID可能不存在，提示
                console.warn('[crafting] 材料ID不存在:', material.itemId);
                return false;
            }
            // 检查背包中是否有足够数量
            let count = 0;
            if (window.inventory) {
                for (const slot of window.inventory.slots) {
                    if (slot && slot.templateId === material.itemId) {
                        count += slot.count || 1;
                    }
                }
            }
            if (count < material.count) return false;
        }
    }
    
    // 检查灵石（currency.spiritStones）
    if (recipe.currency && recipe.currency.spiritStones) {
        const required = Math.max(0, Math.floor(recipe.currency.spiritStones * getCraftCostMul())); // v18.6 工坊折扣
        let available = 0;
        if (window.inventory && window.inventory.currency) {
            available = window.inventory.currency.spiritStones || 0;
        }
        if (available < required) return false;
    }
    
    return true;
}

// ============ 消耗材料 ============
function consumeMaterials(recipe) {
    if (!recipe || !window.inventory || !Array.isArray(window.inventory.slots)) return false;

    // 调用方正常应先 checkMaterials；这里仍逐项验证，避免任何外部调用造成半扣资源。
    if (!checkMaterials(recipe)) return false;

    if (recipe.materials) {
        for (const material of recipe.materials) {
            let remaining = material.count;
            for (let i = 0; i < window.inventory.slots.length && remaining > 0; i++) {
                const slot = window.inventory.slots[i];
                if (!slot || slot.templateId !== material.itemId) continue;
                const toRemove = Math.min(remaining, slot.count || 1);
                if (typeof slot.removeCount === 'function') slot.removeCount(toRemove);
                else slot.count = (slot.count || 1) - toRemove;
                remaining -= toRemove;
                if (slot.count <= 0) window.inventory.slots[i] = null;
            }
            if (remaining > 0) return false;
        }
    }

    if (recipe.currency && recipe.currency.spiritStones) {
        const required = Math.max(0, Math.floor(recipe.currency.spiritStones * getCraftCostMul())); // v18.6 工坊折扣
        if (!window.inventory.currency || (window.inventory.currency.spiritStones || 0) < required) return false;
        window.inventory.currency.spiritStones -= required;
        if (window.currentCharData) window.currentCharData.spiritStones = window.inventory.currency.spiritStones;
    }

    return true;
}

// ============ 添加结果物品 ============
function addResultItem(itemId, count) {
    // B2：统一走 window.addItem（ItemInstance），返回是否成功
    count = count || 1;
    if (typeof window.addItem === 'function') {
        return !!window.addItem(itemId, count);
    }
    if (window.inventory && typeof window.inventory.addItem === 'function') {
        return !!window.inventory.addItem(itemId, count);
    }
    console.warn('[crafting] addItem 不可用，成品未发放: ' + itemId);
    return false;
}

// v18.6 门派工坊折扣读取器（模块级：供合成/强化两处消费）
    // v18.6 门派工坊折扣（锻炉/符纸坊等设施发放的时间窗标记）
function getCraftCostMul() {
    try {
        var until = window._craftDiscountUntil || 0;
        var now = (window.timeSystem && window.timeSystem.gameTime) ? (window.timeSystem.gameTime.totalMinutes || 0) : 0;
        return (until > now) ? 0.6 : 1;
    } catch (e) { return 1; }
}
// ============ 计算成功率 ============
function calculateSuccessRate(recipe) {
    let baseRate = 0.7; // 基础成功率70%
    
// 根据技能等级提升成功率（v9.8：必须读 lifeSkills，禁止读角色顶层字段）
    if (recipe.requiredSkills) {
        for (const [skill, required] of Object.entries(recipe.requiredSkills)) {
            var playerSkill = 0;
            if (typeof window.getLifeSkill === 'function') {
                playerSkill = window.getLifeSkill(skill);
            } else {
                var cd = (typeof window.getCurrentCharData === 'function')
                    ? window.getCurrentCharData()
                    : window.currentCharData;
                playerSkill = (cd && cd.lifeSkills && cd.lifeSkills[skill]) || 0;
            }
            const bonus = Math.max(0, (playerSkill - required) * 0.003); // v9.8
            baseRate += bonus;
        }
    }
    // v18.0 生活技能成功率（副职业退役）：每级+0.04%，上限+16%
    if (window.currentCharData && window.currentCharData.lifeSkills) {
        var csName = recipe.skill || recipe.requiredSkill || null;
        var csLv = csName ? (window.currentCharData.lifeSkills[csName] || 0) : 0;
        baseRate += Math.min(0.16, csLv * 0.004);
    }
    // 洞府炼丹/锻造加成
    if (typeof window.getHouseBonus === 'function') {
        try {
            if (recipe.category === 'pilfer') baseRate += ((window.getHouseBonus('alchemy') || 1) - 1) * 0.5;
            if (recipe.category === 'forging') baseRate += ((window.getHouseBonus('forging') || 1) - 1) * 0.5;
        } catch (e) {}
    }
    
    return Math.min(0.95, Math.max(0.6, baseRate)); // v9.8
}

// ============ 执行合成 ============
function executeCrafting(recipeId) {
    const recipe = recipeById[recipeId];
    if (!recipe) {
        console.error('[crafting] 配方不存在:', recipeId);
        return false;
    }
    // v9.8：生活技能不足配方要求则不能制作
    if (recipe.requiredSkills) {
        for (const [skill, required] of Object.entries(recipe.requiredSkills)) {
            var ps = (typeof window.getLifeSkill === 'function')
                ? window.getLifeSkill(skill)
                : ((window.currentCharData && window.currentCharData.lifeSkills && window.currentCharData.lifeSkills[skill]) || 0);
            if (ps < required) {
                if (typeof window.showMessage === 'function') {
                    window.showMessage('需要' + skill + '≥' + required + '（当前' + ps + '）', 'warning');
                }
                return false;
            }
        }
    }
    // v7.1 副职业等级门槛
    if (typeof window.canCraftWithProfession === 'function') {
        const gate = window.canCraftWithProfession(recipe);
        if (gate && gate.ok === false) {
            if (typeof window.showMessage === 'function') window.showMessage(gate.reason || '副职业不满足', 'warning');
            return false;
        }
    }
    
    if (!checkMaterials(recipe)) {
        if (typeof window.showMessage === 'function') {
            window.showMessage('材料不足，无法合成！', 'error');
        }
        return false;
    }
    
    // B2：真气从角色状态读取/扣除，UI 仅同步显示
    var charData = (typeof window.getCurrentCharData === 'function')
        ? window.getCurrentCharData()
        : window.currentCharData;
    var qiCost = recipe.qiCost || 0;
    var currentQi = (charData && charData.qi != null) ? charData.qi : 0;
    var maxQi = (charData && charData.maxQi != null) ? charData.maxQi : 100;
    if (currentQi < qiCost) {
        if (typeof window.showMessage === 'function') {
            window.showMessage('真气不足，无法合成！', 'error');
        }
        return false;
    }

    // 产物必须存在且真正实装。历史/规划配方不会进入正常索引，但这里再做一次边界保护。
    const resultTemplate = window.itemById && window.itemById[recipe.result.itemId];
    if (!resultTemplate || resultTemplate.implemented === false) {
        if (typeof window.showMessage === 'function') {
            window.showMessage(!resultTemplate ? ('成品物品未定义: ' + recipe.result.itemId) : (resultTemplate.name + ' 尚未实装，配方暂不可用'), 'error');
        }
        return false;
    }

    // 资源快照用于“判定成功但成品发放失败”时原子回滚。随机合成失败仍按设计损失材料。
    const economySnapshot = window.EconomyTransaction && typeof window.EconomyTransaction.capture === 'function'
        ? window.EconomyTransaction.capture() : null;
    const qiBeforeCraft = currentQi;

    // 消耗真气（角色数据）
    if (charData) {
        charData.qi = currentQi - qiCost;
        currentQi = charData.qi;
    }
    var qiBar = document.getElementById('qi-bar');
    var qiText = document.getElementById('qi-text');
    if (qiText) qiText.textContent = currentQi + '/' + maxQi;
    if (qiBar) qiBar.style.width = ((currentQi / maxQi) * 100) + '%';
    if (typeof window.updateCharacterStatus === 'function') {
        try { window.updateCharacterStatus(); } catch (e) {}
    }
    
    // 消耗全部材料；失败时恢复真气和经济快照，禁止半扣。
    if (!consumeMaterials(recipe)) {
        if (economySnapshot && window.EconomyTransaction) window.EconomyTransaction.restore(economySnapshot);
        if (charData) charData.qi = qiBeforeCraft;
        if (typeof window.updateCharacterStatus === 'function') { try { window.updateCharacterStatus(); } catch (e) {} }
        if (typeof window.showMessage === 'function') window.showMessage('材料状态变化，合成已取消且未扣除资源', 'warning');
        return false;
    }

    // 计算品质
    const successRate = calculateSuccessRate(recipe);
    const roll = Math.random();
    
    if (roll > successRate) {
        if (typeof window.showMessage === 'function') {
            window.showMessage(`合成失败！失去了材料。`, 'error');
        }
        // 推进时间
        if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
            window.timeSystem.advanceTime(recipe.timeCost || 10, 'crafting');
        }
        return false;
    }
    
    // 随机品质
    let qualityMultiplier = 1;
    let qualityName = '普通';
    const qRoll = Math.random();
    let cumChance = 0;
    for (const q of Object.values(CRAFT_QUALITY)) {
        if (!q.result && q.chance) { // FAIL
            cumChance += q.chance;
            continue;
        }
        cumChance += q.chance;
        if (qRoll <= cumChance) {
            qualityMultiplier = q.multiplier || 1;
            qualityName = q.name;
            break;
        }
    }
    
    // v18.0 生活技能品质/耗时（副职业退役）
    let profQuality = 1;
    let timeMul = 1;
    if (window.currentCharData && window.currentCharData.lifeSkills) {
        var qSkill = recipe.skill || recipe.requiredSkill || null;
        var qLv = qSkill ? (window.currentCharData.lifeSkills[qSkill] || 0) : 0;
        profQuality = 1 + Math.min(0.4, qLv * 0.01);
        timeMul = Math.max(0.6, 1 - Math.min(0.4, qLv * 0.01));
    }
    // 添加结果。若背包空间/实例创建等原因导致发放失败，完整恢复本次材料、货币和真气。
    const resultCount = Math.max(1, Math.floor(recipe.result.count * qualityMultiplier * (profQuality > 1.15 ? 1.2 : 1)));
    var addedOk = addResultItem(recipe.result.itemId, resultCount);
    if (!addedOk) {
        if (economySnapshot && window.EconomyTransaction) window.EconomyTransaction.restore(economySnapshot);
        if (charData) charData.qi = qiBeforeCraft;
        if (typeof window.updateCharacterStatus === 'function') { try { window.updateCharacterStatus(); } catch (e) {} }
        if (typeof window.showMessage === 'function') window.showMessage('背包空间不足或成品创建失败，本次合成已回滚', 'error');
        return false;
    }
    
    // P1：如果合成成功且物品已加入背包，发射 item:crafted 事件
    if (addedOk && typeof window.EventBus !== 'undefined') {
        window.EventBus.emit('item:crafted', {
            recipeId: recipeId,
            itemId: recipe.result.itemId,
            itemName: recipe.result.name || recipe.name,
            count: resultCount,
            quality: qualityName,
            profession: (typeof qSkill === 'string' && qSkill) ? qSkill : null
        });
    }
    
    if (typeof window.showMessage === 'function') {
        window.showMessage('合成成功！获得 ' + recipe.name + ' x' + resultCount + ' (' + qualityName + ')', 'success');
    }
    
    // 推进时间（职业加速）
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(Math.max(1, Math.floor((recipe.timeCost || 10) * timeMul)), 'crafting');
    }
    
    return true;
}

// ============ 合成完成回调 ============
function finishCrafting(result) {
    if (result) {
        addResultItem(result.itemId, result.count || 1);
    }
    craftingState.isCrafting = false;
    craftingState.currentRecipe = null;
    craftingState.progress = 0;
}

// ============ 获取配方按分类 ============
function getRecipesByCategory(category) {
    return allRecipes.filter(r => r.category === category);
}

// ============ 渲染合成UI ============
function renderCraftingUI(category) {
    const container = document.getElementById('crafting-recipes');
    if (!container) return;
    
    const recipes = getRecipesByCategory(category);
    container.innerHTML = recipes.map((recipe, index) => {
        const hasMaterials = checkMaterials(recipe);
        let profOk = true;
        let profReason = '';
        if (typeof window.canCraftWithProfession === 'function') {
            const g = window.canCraftWithProfession(recipe);
            if (g && g.ok === false) { profOk = false; profReason = g.reason || '职业不足'; }
        }
        const canDo = hasMaterials && profOk;
        return `
            <div class="bg-gray-700 rounded p-3 mb-2 ${canDo ? 'hover:bg-gray-600 cursor-pointer' : 'opacity-50'}">
                <div class="flex justify-between items-center">
                    <span class="font-bold text-sm">${recipe.name}</span>
                    <button class="text-xs px-3 py-1 rounded ${canDo ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-500'}"
                        ${canDo ? `onclick="executeCrafting('${recipe.id}')"` : 'disabled'}>
                        ${!profOk ? '职业不足' : (hasMaterials ? '合成' : '材料不足')}
                    </button>
                </div>
                <div class="text-xs text-gray-400 mt-1">${recipe.desc}</div>
                <div class="text-xs text-gray-500 mt-1">
                    材料: ${(recipe.materials || []).map(m => `${m.itemId} x${m.count}`).join(', ')}${recipe.currency?.spiritStones ? ` | 灵石: ${recipe.currency.spiritStones}` : ''} | 
                    真气: ${recipe.qiCost} | 耗时: ${recipe.timeCost}分钟
                </div>
            </div>
        `;
    }).join('');
}

// ============ 打开合成UI ============
function openCraftingUI(category) {
    const panel = document.getElementById('panel-crafting');
    if (panel) {
        panel.classList.remove('hidden');
        renderCraftingUI(category);
    }
}

// ============ 导出 ============
window.CRAFTING_CATEGORIES = CRAFTING_CATEGORIES;
window.CRAFT_QUALITY = CRAFT_QUALITY;
window.pilferRecipes = pilferRecipes;
window.forgingRecipes = forgingRecipes;
window.talismanRecipes = talismanRecipes;
window.foodRecipes = foodRecipes;
window.allRecipes = allRecipes;
window.recipeById = recipeById;
window.checkMaterials = checkMaterials;
window.consumeMaterials = consumeMaterials;
window.addResultItem = addResultItem;
window.calculateSuccessRate = calculateSuccessRate;
window.executeCrafting = executeCrafting;
window.finishCrafting = finishCrafting;
window.getRecipesByCategory = getRecipesByCategory;
window.renderCraftingUI = renderCraftingUI;
window.openCraftingUI = openCraftingUI;
window._openCraftingUIImpl = openCraftingUI;
if (window.XianXia) window.XianXia.openCraftingUI = openCraftingUI;;

window.getCraftCostMul = getCraftCostMul;
