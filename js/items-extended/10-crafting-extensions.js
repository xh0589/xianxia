// ==================== 扩展合成配方 v1.0 ====================
// 补充缺失的符箓合成配方，在 crafting.js 加载后自动合并

(function() {
    // 缺失的符箓配方（14种，补齐到20种）
    const extraTalismanRecipes = [
        {
            id: 'recipe_icicle', name: '冰锥符', category: 'talismans',
            requiredSkills: { 学识: 10 },
            materials: [{ itemId: 'mat_spirit_grass', count: 5 }, { itemId: 'mat_cold_iron', count: 1 }],
            currency: { spiritStones: 30 },
            result: { itemId: 'tal_icicle', count: 3 }, qiCost: 20, timeCost: 8,
            desc: '基础冰系符箓'
        },
        {
            id: 'recipe_wind_blade', name: '风刃符', category: 'talismans',
            requiredSkills: { 学识: 10 },
            materials: [{ itemId: 'mat_spirit_grass', count: 5 }, { itemId: 'mat_five_element_essence', count: 1 }],
            currency: { spiritStones: 30 },
            result: { itemId: 'tal_wind_blade', count: 3 }, qiCost: 20, timeCost: 8,
            desc: '基础风系符箓'
        },
        {
            id: 'recipe_fire_wall', name: '火墙符', category: 'talismans',
            requiredSkills: { 学识: 20 },
            materials: [{ itemId: 'mat_fire_crystal', count: 3 }, { itemId: 'mat_five_element_essence', count: 2 }],
            currency: { spiritStones: 50 },
            result: { itemId: 'tal_fire_wall', count: 2 }, qiCost: 30, timeCost: 12,
            desc: '火系防御'
        },
        {
            id: 'recipe_ice_wall', name: '冰墙符', category: 'talismans',
            requiredSkills: { 学识: 20 },
            materials: [{ itemId: 'mat_cold_iron', count: 3 }, { itemId: 'mat_five_element_essence', count: 2 }],
            currency: { spiritStones: 50 },
            result: { itemId: 'tal_ice_wall', count: 2 }, qiCost: 30, timeCost: 12,
            desc: '冰系防御'
        },
        {
            id: 'recipe_wind_dodge', name: '风遁符', category: 'talismans',
            requiredSkills: { 学识: 20 },
            materials: [{ itemId: 'mat_spirit_grass', count: 5 }, { itemId: 'mat_demon_beast_core', count: 1 }],
            currency: { spiritStones: 40 },
            result: { itemId: 'tal_wind_dodge', count: 2 }, qiCost: 25, timeCost: 10,
            desc: '速度+50%'
        },
        {
            id: 'recipe_invisibility', name: '隐身符', category: 'talismans',
            requiredSkills: { 学识: 35 },
            materials: [{ itemId: 'mat_thousand_lingzhi', count: 2 }, { itemId: 'mat_moon_stone', count: 2 }, { itemId: 'mat_five_element_essence', count: 3 }],
            currency: { spiritStones: 150 },
            result: { itemId: 'tal_invisibility', count: 1 }, qiCost: 50, timeCost: 20,
            desc: '隐身3回合'
        },
        {
            id: 'recipe_bind', name: '定身符', category: 'talismans',
            requiredSkills: { 学识: 30 },
            materials: [{ itemId: 'mat_ginseng', count: 2 }, { itemId: 'mat_five_element_essence', count: 2 }, { itemId: 'mat_yin_yang_stone', count: 1 }],
            currency: { spiritStones: 150 },
            result: { itemId: 'tal_bind', count: 1 }, qiCost: 40, timeCost: 15,
            desc: '定身1回合'
        },
        {
            id: 'recipe_silence', name: '沉默符', category: 'talismans',
            requiredSkills: { 学识: 30 },
            materials: [{ itemId: 'mat_ginseng', count: 2 }, { itemId: 'mat_five_element_essence', count: 2 }, { itemId: 'mat_yin_yang_stone', count: 1 }],
            currency: { spiritStones: 180 },
            result: { itemId: 'tal_silence', count: 1 }, qiCost: 40, timeCost: 15,
            desc: '沉默3回合'
        },
        {
            id: 'recipe_armor_break_tal', name: '破甲符', category: 'talismans',
            requiredSkills: { 学识: 30 },
            materials: [{ itemId: 'mat_meteorite', count: 2 }, { itemId: 'mat_five_element_essence', count: 2 }],
            currency: { spiritStones: 150 },
            result: { itemId: 'tal_armor_break', count: 1 }, qiCost: 40, timeCost: 15,
            desc: '破甲+50%'
        },
        {
            id: 'recipe_freeze', name: '冰封符', category: 'talismans',
            requiredSkills: { 学识: 45 },
            materials: [{ itemId: 'mat_cold_iron', count: 5 }, { itemId: 'mat_moon_stone', count: 2 }, { itemId: 'mat_five_element_essence', count: 4 }],
            currency: { spiritStones: 400 },
            result: { itemId: 'tal_freeze', count: 1 }, qiCost: 70, timeCost: 25,
            desc: '冰封2回合'
        },
        {
            id: 'recipe_revive', name: '复活符', category: 'talismans',
            requiredSkills: { 学识: 60 },
            materials: [{ itemId: 'mat_nine_leaf_lingzhi', count: 2 }, { itemId: 'mat_phoenix_blood', count: 2 }, { itemId: 'mat_heaven_heart_flower', count: 1 }, { itemId: 'mat_five_element_essence', count: 5 }],
            currency: { spiritStones: 800 },
            result: { itemId: 'tal_revive', count: 1 }, qiCost: 100, timeCost: 40,
            desc: '复活一次'
        },
        {
            id: 'recipe_five_element', name: '五行符', category: 'talismans',
            requiredSkills: { 学识: 70 },
            materials: [{ itemId: 'mat_five_element_essence', count: 10 }, { itemId: 'mat_star_sand', count: 5 }, { itemId: 'mat_sun_stone', count: 3 }, { itemId: 'mat_moon_stone', count: 3 }],
            currency: { spiritStones: 2000 },
            result: { itemId: 'tal_five_element', count: 1 }, qiCost: 150, timeCost: 50,
            desc: '五行攻击500伤害'
        },
        {
            id: 'recipe_universe', name: '乾坤符', category: 'talismans',
            requiredSkills: { 学识: 85 },
            materials: [{ itemId: 'mat_chaos_stone', count: 2 }, { itemId: 'mat_space_crystal', count: 2 }, { itemId: 'mat_dragon_crystal', count: 1 }, { itemId: 'mat_five_element_essence', count: 10 }],
            currency: { spiritStones: 5000 },
            result: { itemId: 'tal_universe', count: 1 }, qiCost: 200, timeCost: 60,
            desc: '扭转乾坤'
        },
        {
            id: 'recipe_heavenly_master', name: '天师符', category: 'talismans',
            requiredSkills: { 学识: 80 },
            materials: [{ itemId: 'mat_chaos_stone', count: 1 }, { itemId: 'mat_dragon_crystal', count: 2 }, { itemId: 'mat_sun_stone', count: 3 }, { itemId: 'mat_five_element_essence', count: 8 }],
            currency: { spiritStones: 3000 },
            result: { itemId: 'tal_heavenly_master', count: 1 }, qiCost: 180, timeCost: 55,
            desc: '天师护体'
        }
    ];

    // 原始配方保留作内容库；只有产物已经实装的配方才进入可制作索引。
    // 这样未来把某张高级符的 implemented 改为 true 时，只需重新启用对应内容，
    // 不会让玩家先做出一个“会被消耗但没有效果”的占位物品。
    if (window.talismanRecipes && Array.isArray(window.talismanRecipes)) {
        window.talismanRecipes.push(...extraTalismanRecipes);
    }
    const activeRecipes = extraTalismanRecipes.filter(r => {
        const result = window.itemById && r.result && window.itemById[r.result.itemId];
        return !!result && result.implemented !== false;
    });
    if (window.allRecipes && Array.isArray(window.allRecipes)) {
        window.allRecipes.push(...activeRecipes);
    }
    if (window.recipeById) {
        activeRecipes.forEach(r => { window.recipeById[r.id] = r; });
    }

    console.log('[crafting-ext] 扩展符箓配方已载入：可制作 ' + activeRecipes.length + '/' + extraTalismanRecipes.length);
})();