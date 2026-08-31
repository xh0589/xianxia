// ==================== 物品获取途径补全 v1.0 ====================
// 在app.js中定义，通过window导出，补充所有缺失物品的获取途径

// ============ 武器商店完整物品池 ============
const WEAPON_SHOP_ITEMS = {
    // 剑类
    common: ['wpn_wooden_sword', 'wpn_iron_sword', 'wpn_bronze_sword'],
    uncommon: ['wpn_dark_iron_sword', 'wpn_steel_sword', 'wpn_dragon_spring'],
    rare: ['wpn_frost_moon', 'wpn_red_cloud', 'wpn_purple_lightning', 'wpn_green_sky'],
    epic: ['wpn_gan_jiang', 'wpn_mo_xie', 'wpn_chun_jun', 'wpn_fish_gut', 'wpn_zhan_lu'],
    legendary: ['wpn_xu_yuan', 'wpn_tai_a', 'wpn_seven_star', 'wpn_cheng_ying']
};

// ============ 防具商店完整物品池 ============
const ARMOR_SHOP_ITEMS = {
    // 头饰
    common: ['arm_cloth_hat', 'arm_leather_hat'],
    uncommon: ['arm_iron_helm', 'arm_jade_crown'],
    rare: ['arm_golden_crown', 'arm_phoenix_crown', 'arm_ice_crown'],
    epic: ['arm_nine_sky_crown'],
    legendary: ['arm_immortal_crown'],
    // 护甲
    body: ['arm_cloth_robe', 'arm_leather_armor', 'arm_chain_mail', 'arm_dark_iron_armor', 'arm_silk_armor',
           'arm_golden_silk_armor', 'arm_dragon_scale_armor', 'arm_phoenix_robe', 'arm_cloud_armor',
           'arm_nine_heaven_robe', 'arm_hun_yuan_armor', 'arm_heavenly_silk_robe'],
    // 手套
    hands: ['arm_cloth_gloves', 'arm_leather_gloves', 'arm_iron_gloves', 'arm_silk_gloves', 'arm_dark_iron_gloves'],
    // 靴子
    feet: ['arm_cloth_shoes', 'arm_leather_boots', 'arm_iron_boots', 'arm_wind_boots', 'arm_cloud_chasing_boots',
           'arm_snow_treading_boots', 'arm_flying_boots', 'arm_colorful_boots'],
    // 腰带
    waist: ['arm_cloth_belt', 'arm_leather_belt', 'arm_iron_belt', 'arm_jade_belt', 'arm_golden_belt',
            'arm_dragon_belt', 'arm_hun_yuan_belt']
};

// ============ 扩展掉落表（覆盖所有缺失武器/防具） ============
const EXTENDED_LOOT_TABLES = {
    // 野兽掉落：覆盖所有兽类材料
    beast: {
        common: ['mat_beast_skin', 'mat_beast_bone', 'mat_beast_fang'],
        uncommon: ['mat_demon_beast_skin', 'mat_demon_beast_bone', 'mat_demon_beast_fang', 'mat_demon_beast_core'],
        rare: ['mat_thousand_beast_skin', 'mat_wind_essence'] // v17.3 风之精粹：东荒风穴兽类稀有携带（补风狼王进化链）
    },
    // 精英野兽：覆盖高级兽类材料
    elite_beast: {
        common: ['mat_demon_beast_skin', 'mat_demon_beast_bone', 'mat_demon_beast_fang', 'mat_demon_beast_core'],
        uncommon: ['mat_dragon_scale', 'mat_phoenix_feather'],
        rare: ['mat_dragon_bone', 'mat_dragon_blood', 'mat_phoenix_blood']
    },
    // BOSS野兽：覆盖传说级材料
    boss_beast: {
        common: ['mat_dragon_scale', 'mat_dragon_bone', 'mat_dragon_blood'],
        uncommon: ['mat_phoenix_blood', 'mat_qilin_horn', 'mat_dragon_crystal'],
        rare: ['mat_sky_iron', 'mat_star_iron', 'mat_chaos_stone', 'mat_space_crystal']
    },
    // 山贼/人类敌人：掉落武器/防具
    bandit: {
        common: ['wpn_chopper', 'wpn_iron_sword', 'arm_cloth_hat', 'arm_cloth_robe', 'arm_cloth_shoes'],
        uncommon: ['wpn_steel_knife', 'wpn_ring_knife', 'arm_leather_hat', 'arm_leather_armor', 'arm_leather_boots'],
        rare: ['wpn_horse_knife', 'arm_chain_mail', 'arm_iron_helm', 'spec_transfer_stone']
    },
    // 秘境守卫：掉落珍品-极品
    dungeon_guard: {
        common: ['pill_big_recovery', 'pill_qi_gather', 'mat_meteorite', 'mat_purple_gold', 'spec_enhance_stone'],
        uncommon: ['wpn_purple_lightning', 'wpn_green_sky', 'arm_golden_crown', 'arm_golden_silk_armor',
                   'pill_foundation', 'pill_body_foundation', 'spec_transfer_stone'],
        rare: ['wpn_gan_jiang', 'wpn_mo_xie', 'arm_cloud_armor', 'arm_dragon_scale_armor',
               'pill_golden_core', 'mat_dragon_crystal']
    },
    // 秘境BOSS：掉落极品-仙品
    dungeon_boss: {
        common: ['pill_nine_revival', 'pill_qi_condense', 'mat_sky_iron', 'mat_star_iron', 'spec_transfer_stone'],
        uncommon: ['wpn_xu_yuan', 'wpn_zhan_lu', 'arm_nine_sky_crown', 'arm_hun_yuan_armor',
                   'pill_marrow_wash', 'art_taiji_sword'],
        rare: ['wpn_zhu_xian', 'arm_nine_heaven_robe', 'pill_sutra_change', 'art_dugu_sword',
               'mat_chaos_stone', 'mat_space_crystal']
    }
};

// ============ 事件宝箱掉落 ============
const CHEST_LOOT = {
    // 普通宝箱
    common: {
        items: ['pill_small_recovery', 'pill_qi_powder', 'pill_energy_powder', 'mat_iron_ore', 'mat_copper_ore',
                'mat_lingzhi', 'mat_ginseng', 'food_roast_meat'],
        count: [1, 3],
        spiritStones: [5, 20]
    },
    // 稀有宝箱
    rare: {
        items: ['pill_big_recovery', 'pill_qi_gather', 'pill_energy_return', 'mat_refined_iron', 'mat_dark_iron',
                'mat_thousand_lingzhi', 'mat_snow_lotus', 'wpn_dark_iron_sword', 'arm_chain_mail',
                'pill_body_foundation', 'pill_diamond', 'tal_fireball', 'art_sword_basic', 'spec_enhance_stone', 'spec_transfer_stone'],
        count: [1, 2],
        spiritStones: [20, 80]
    },
    // 传说宝箱
    epic: {
        items: ['pill_spring_recovery', 'pill_qi_return', 'pill_energy_gather', 'pill_foundation',
                'wpn_frost_moon', 'wpn_red_cloud', 'arm_golden_silk_armor', 'arm_dragon_scale_armor',
                'mat_meteorite', 'mat_purple_gold', 'mat_heaven_heart_flower', 'mat_earth_spirit_root',
                'tal_teleport', 'tal_shield', 'art_wind_sword', 'art_hun_yuan',
                'food_immortal_tea', 'food_jade_nectar'],
        count: [1, 2],
        spiritStones: [50, 200]
    }
};

// ============ 打开宝箱 ============
function openChest(chestType) {
    const table = CHEST_LOOT[chestType];
    if (!table) return;
    
    const itemId = table.items[Math.floor(Math.random() * table.items.length)];
    const count = table.count[0] + Math.floor(Math.random() * (table.count[1] - table.count[0] + 1));
    const stones = table.spiritStones[0] + Math.floor(Math.random() * (table.spiritStones[1] - table.spiritStones[0] + 1));
    
    if (window.inventory) {
        window.inventory.addItem(itemId, count);
        window.inventory.currency.spiritStones = (window.inventory.currency.spiritStones || 0) + stones;
    }
    
    const itemName = window.itemById?.[itemId]?.name || itemId;
    return { itemId, count, stones, itemName };
}

// ============ 获取扩展战斗掉落 ============
function getExtendedLoot(enemySubType, enemyLevel) {
    const table = EXTENDED_LOOT_TABLES[enemySubType];
    if (!table) return null;
    
    const loot = { items: [], spiritStones: 0 };
    
    const dropRate = enemySubType.includes('boss') ? 0.9 : 0.6;
    if (Math.random() > dropRate) return loot;
    
    const rarityRoll = Math.random();
    let pool;
    if (rarityRoll < 0.6) pool = table.common;
    else if (rarityRoll < 0.9) pool = table.uncommon;
    else pool = table.rare;
    
    const itemCount = Math.floor(1 + Math.random() * 2);
    for (let i = 0; i < itemCount; i++) {
        loot.items.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    
    loot.spiritStones = Math.floor(enemyLevel * 3 * Math.random());
    return loot;
}

// ============ 导出到全局 ============
window.WEAPON_SHOP_ITEMS = WEAPON_SHOP_ITEMS;
window.ARMOR_SHOP_ITEMS = ARMOR_SHOP_ITEMS;
window.EXTENDED_LOOT_TABLES = EXTENDED_LOOT_TABLES;
window.CHEST_LOOT = CHEST_LOOT;
window.openChest = openChest;
window.getExtendedLoot = getExtendedLoot;