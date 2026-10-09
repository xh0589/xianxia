// ==================== 物品获取途径补全 v1.0 ====================
// ⚠️【已废弃 · 不挂载】v8.5 起战利品系统移至 js/loot-system.js，本文件不进加载序列
//    （仙侠.html 无此标签，scripts.manifest.json 无此条目；351/353 = 挂 351、不挂 2）。
//    权威口径见 STRUCTURE.md §0.2「实际挂载的 js」与 § items-extended 段。
//
//    W-1（接线五处 · 第一处）实测结论，动手前逐条查过：
//    ① 六个导出全仓无「同名另定义」——EXTENDED_LOOT_TABLES 在别处没有被第二份定义，
//       所以不是「撞名」，是「整本没上线」。
//    ② 不挂载（且不该挂）：EXTENDED_LOOT_TABLES 与 loot-system.js 的 LOOT_TABLES 五个键
//       （beast/bandit/dungeon_guard/dungeon_boss/boss_beast）逐档重叠，beast.common 三枚 id 完全相同。
//       js/loot-system.js 原有一段 `window.getExtendedLoot` 调用，一旦本文件挂上就会在主表之外
//       再叠一整轮掷骰（每次击杀多 1~2 件 + 灵石）＝ 掉落翻倍。那段死调用已随本批删除。
//    ③ WEAPON_SHOP_ITEMS / ARMOR_SHOP_ITEMS：商店货单早已改写为 inventory.js 的 SHOP_ITEMS
//       （按档 basic/uncommon/rare/epic/legendary 存，另一套 id 体例），这两张分档池是死数据，
//       挂上来仍然零引用，不解决任何「玩家看不到」。
//    ④ CHEST_LOOT / openChest：**这一族原先是活的**——js/items-extended/11-event-extensions.js
//       的「沙漠遗迹」「水下洞窟」两处奇遇按 `window.openChest` 判定分支，定义不挂载 ⇒ 两个宝箱奇遇
//       永远走「暗格纹丝不动」那一支，玩家开箱开不出东西。已按「接线不是重写」把表与开箱手
//       原样搬进 js/loot-system.js（战利品系统的现行归属、已挂载），本文件不再留第二份。
//
// 下面保留的是仍属本文件、但同样不挂载的三张表，仅供史料与离线审计（tests/wave129 读源码用）。

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
    // 秘境守卫：掉落七品-五品
    dungeon_guard: {
        common: ['pill_big_recovery', 'pill_qi_gather', 'mat_meteorite', 'mat_purple_gold', 'spec_enhance_stone'],
        uncommon: ['wpn_purple_lightning', 'wpn_green_sky', 'arm_golden_crown', 'arm_golden_silk_armor',
                   'pill_foundation', 'pill_body_foundation', 'spec_transfer_stone'],
        rare: ['wpn_gan_jiang', 'wpn_mo_xie', 'arm_cloud_armor', 'arm_dragon_scale_armor',
               'pill_golden_core', 'mat_dragon_crystal']
    },
    // 秘境BOSS：掉落五品-三品
    dungeon_boss: {
        common: ['pill_nine_revival', 'pill_qi_condense', 'mat_sky_iron', 'mat_star_iron', 'spec_transfer_stone'],
        uncommon: ['wpn_xu_yuan', 'wpn_zhan_lu', 'arm_nine_sky_crown', 'arm_hun_yuan_armor',
                   'pill_marrow_wash', 'art_taiji_sword'],
        rare: ['wpn_zhu_xian', 'arm_nine_heaven_robe', 'pill_sutra_change', 'art_dugu_sword',
               'mat_chaos_stone', 'mat_space_crystal']
    }
};

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
window.getExtendedLoot = getExtendedLoot;