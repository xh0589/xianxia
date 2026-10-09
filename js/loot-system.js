// ==================== 战利品系统 v1.0 ====================
// 核心原则：战斗胜利不掉落物品，物品通过搜刮(人类)或解剖(动物)获得
// 敌人携带物在生成时预设，由其类型/身份/等级决定
// ============================================================

// ============ 敌人类型常量 ============
const ENEMY_TYPES = {
    BANDIT: 'bandit',               // 山贼/流寇
    NORMAL_HUMAN: 'normal_human',   // 普通修士/散修
    ELITE: 'elite',                 // 精英
    BOSS: 'boss',                   // BOSS
    BEAST: 'beast',                 // 普通野兽
    DEMON_BEAST: 'demon_beast',     // 妖兽
    BOSS_BEAST: 'boss_beast',       // BOSS野兽
    DUNGEON_GUARD: 'dungeon_guard', // 秘境守卫
    DUNGEON_BOSS: 'dungeon_boss',   // 秘境BOSS
    UNDEAD: 'undead',               // 亡灵
    CONSTRUCT: 'construct',         // 构装体
    ELEMENTAL: 'elemental'          // 元素生物
};

// ============ 携带物表 ============

// 1. 山贼/流寇
const BANDIT_LOOT = {
    common: [
        { id: 'wpn_chopper', weight: 40 },
        { id: 'wpn_steel_knife', weight: 30 },
        { id: 'arm_cloth_hat', weight: 30 },
        { id: 'arm_cloth_robe', weight: 40 },
        { id: 'arm_cloth_shoes', weight: 30 },
        { id: 'pill_small_recovery', weight: 25 }
    ],
    uncommon: [
        { id: 'wpn_ring_knife', weight: 15 },
        { id: 'wpn_horse_knife', weight: 8 },
        { id: 'arm_leather_hat', weight: 15 },
        { id: 'arm_leather_armor', weight: 20 },
        { id: 'arm_leather_boots', weight: 15 },
        { id: 'pill_big_recovery', weight: 10 }
    ],
    rare: [
        { id: 'wpn_dark_iron_sword', weight: 5 },
        { id: 'arm_chain_mail', weight: 5 },
        { id: 'arm_iron_helm', weight: 5 }
    ],
    minLevel: 1,
    spiritStones: { min: 2, max: 5 },  // × level
    spiritStoneChance: 80
};

// 2. 普通修士/散修
const NORMAL_HUMAN_LOOT = {
    common: [
        { id: 'pill_small_recovery', weight: 40 },
        { id: 'pill_qi_powder', weight: 30 },
        { id: 'pill_energy_powder', weight: 25 },
        { id: 'mat_iron_ore', weight: 20 },
        { id: 'food_steamed_bun', weight: 20 }
    ],
    uncommon: [
        { id: 'pill_big_recovery', weight: 20 },
        { id: 'pill_qi_gather', weight: 15 },
        { id: 'pill_energy_return', weight: 15 },
        { id: 'mat_lingzhi', weight: 20 },
        { id: 'mat_ginseng', weight: 15 },
        { id: 'mat_refined_iron', weight: 15 }
    ],
    rare: [
        { id: 'pill_spring_recovery', weight: 8 },
        { id: 'pill_qi_return', weight: 5 },
        { id: 'mat_dark_iron', weight: 8 },
        { id: 'art_breathing', weight: 5 },
        { id: 'art_sword_basic', weight: 3 }
    ],
    minLevel: 1,
    spiritStones: { min: 1, max: 3 },
    spiritStoneChance: 70
};

// 3. 精英修士
const ELITE_LOOT = {
    common: [
        { id: 'pill_big_recovery', weight: 40 },
        { id: 'pill_qi_gather', weight: 30 },
        { id: 'pill_energy_return', weight: 25 },
        { id: 'mat_refined_iron', weight: 25 },
        { id: 'mat_dark_iron', weight: 20 }
    ],
    uncommon: [
        { id: 'wpn_dark_iron_sword', weight: 25 },
        { id: 'wpn_steel_sword', weight: 20 },
        { id: 'arm_chain_mail', weight: 20 },
        { id: 'arm_iron_helm', weight: 15 },
        { id: 'pill_spring_recovery', weight: 25 },
        { id: 'pill_body_foundation', weight: 20 },
        { id: 'pill_qi_return', weight: 20 }
    ],
    rare: [
        { id: 'pill_foundation', weight: 10 },
        { id: 'wpn_frost_moon', weight: 8 },
        { id: 'wpn_red_cloud', weight: 8 },
        { id: 'arm_golden_silk_armor', weight: 10 },
        { id: 'arm_dragon_scale_armor', weight: 5 },
        { id: 'mat_meteorite', weight: 15 },
        { id: 'art_taiji_sword', weight: 8 },
        { id: 'art_sword_wind', weight: 8 }
    ],
    minLevel: 8,
    spiritStones: { min: 5, max: 15 },
    spiritStoneChance: 90
};

// 4. BOSS
const BOSS_LOOT = {
    common: [
        { id: 'pill_nine_revival', weight: 40 },
        { id: 'pill_qi_condense', weight: 30 },
        { id: 'pill_energy_boost', weight: 25 },
        { id: 'mat_meteorite', weight: 30 },
        { id: 'mat_purple_gold', weight: 25 },
        { id: 'mat_dragon_bone', weight: 20 }
    ],
    uncommon: [
        { id: 'wpn_gan_jiang', weight: 30 },
        { id: 'wpn_blood_drink', weight: 25 },
        { id: 'arm_cloud_armor', weight: 25 },
        { id: 'arm_dragon_scale_armor', weight: 20 },
        { id: 'pill_golden_core', weight: 40 },
        { id: 'mat_dragon_crystal', weight: 30 },
        { id: 'art_jiuyang', weight: 15 }
    ],
    rare: [
        { id: 'wpn_xu_yuan', weight: 10 },
        { id: 'wpn_zhu_xian', weight: 5 },
        { id: 'arm_nine_heaven_robe', weight: 8 },
        { id: 'arm_hun_yuan_armor', weight: 12 },
        { id: 'pill_marrow_wash', weight: 25 },
        { id: 'mat_chaos_stone', weight: 10 },
        { id: 'art_dugu_sword', weight: 5 }
    ],
    minLevel: 15,
    spiritStones: { min: 20, max: 50 },
    spiritStoneChance: 100
};

// 5. 普通野兽（解剖）
const BEAST_LOOT = {
    common: [
        { id: 'mat_beast_skin', weight: 80 },
        { id: 'mat_beast_bone', weight: 70 },
        { id: 'mat_beast_fang', weight: 60 },
        { id: 'food_roast_meat', weight: 75 }
    ],
    uncommon: [
        { id: 'mat_demon_beast_skin', weight: 15 },
        { id: 'mat_demon_beast_bone', weight: 12 }
    ],
    rare: [
        { id: 'mat_demon_beast_core', weight: 5 }
    ],
    minLevel: 1,
    spiritStones: { min: 0, max: 0 },
    spiritStoneChance: 0
};

// 6. 妖兽（解剖）
const DEMON_BEAST_LOOT = {
    common: [
        { id: 'mat_demon_beast_skin', weight: 80 },
        { id: 'mat_demon_beast_bone', weight: 70 },
        { id: 'mat_demon_beast_fang', weight: 60 }
    ],
    uncommon: [
        { id: 'mat_demon_beast_core', weight: 50 },
        { id: 'mat_thousand_beast_skin', weight: 15 }
    ],
    rare: [
        { id: 'mat_dragon_scale', weight: 5 },
        { id: 'mat_phoenix_feather', weight: 3 },
        { id: 'mat_qilin_horn', weight: 2 }
    ],
    minLevel: 5,
    spiritStones: { min: 0, max: 0 },
    spiritStoneChance: 0
};

// 7. BOSS野兽（解剖）
const BOSS_BEAST_LOOT = {
    common: [
        { id: 'mat_dragon_scale', weight: 80 },
        { id: 'mat_dragon_bone', weight: 70 }
    ],
    uncommon: [
        { id: 'mat_dragon_blood', weight: 60 },
        { id: 'mat_phoenix_feather', weight: 30 },
        { id: 'mat_dragon_crystal', weight: 40 }
    ],
    rare: [
        { id: 'mat_phoenix_blood', weight: 20 },
        { id: 'mat_sky_iron', weight: 10 },
        { id: 'mat_star_iron', weight: 8 },
        { id: 'mat_chaos_stone', weight: 5 }
    ],
    minLevel: 20,
    spiritStones: { min: 0, max: 0 },
    spiritStoneChance: 0
};

// 8. 秘境守卫
const DUNGEON_GUARD_LOOT = {
    common: [
        { id: 'pill_qi_return', weight: 40 },
        { id: 'pill_energy_gather', weight: 30 },
        { id: 'mat_spirit_stone', weight: 60 },
        { id: 'mat_five_element_essence', weight: 30 }
    ],
    uncommon: [
        { id: 'pill_qi_condense', weight: 20 },
        { id: 'wpn_spirit_sword', weight: 15 },
        { id: 'arm_spirit_armor', weight: 10 },
        { id: 'mat_yin_yang_stone', weight: 20 }
    ],
    rare: [
        { id: 'pill_primordial', weight: 8 },
        { id: 'mat_chaos_stone', weight: 5 },
        { id: 'mat_phoenix_feather', weight: 5 },
        { id: 'art_zhu_xian_sword', weight: 5 }
    ],
    minLevel: 10,
    spiritStones: { min: 3, max: 8 },
    spiritStoneChance: 100
};

// 9. 秘境BOSS
const DUNGEON_BOSS_LOOT = {
    common: [
        { id: 'pill_nine_revival', weight: 50 },
        { id: 'pill_qi_condense', weight: 40 },
        { id: 'mat_sky_iron', weight: 30 },
        { id: 'mat_star_iron', weight: 25 }
    ],
    uncommon: [
        { id: 'wpn_xu_yuan', weight: 15 },
        { id: 'wpn_zhan_lu', weight: 20 },
        { id: 'arm_nine_sky_crown', weight: 25 },
        { id: 'arm_hun_yuan_armor', weight: 20 },
        { id: 'pill_marrow_wash', weight: 35 },
        { id: 'art_taiji_sword', weight: 15 }
    ],
    rare: [
        { id: 'wpn_zhu_xian', weight: 8 },
        { id: 'arm_nine_heaven_robe', weight: 10 },
        { id: 'pill_sutra_change', weight: 15 },
        { id: 'art_dugu_sword', weight: 8 },
        { id: 'mat_chaos_stone', weight: 20 },
        { id: 'mat_phoenix_feather', weight: 15 }
    ],
    minLevel: 18,
    spiritStones: { min: 30, max: 80 },
    spiritStoneChance: 100
};

// 10. 亡灵（解剖）
const UNDEAD_LOOT = {
    common: [
        { id: 'mat_bone_powder', weight: 60 },
        { id: 'mat_undead_essence', weight: 40 }
    ],
    // 0.2.7：亡灵 uncommon/rare 此前为空，掉落单薄——补魂骨/寒铁
    uncommon: [
        { id: 'mat_demon_beast_bone', weight: 40 },
        { id: 'mat_cold_iron', weight: 30 }
    ],
    rare: [
        { id: 'mat_sky_iron', weight: 10 },
        { id: 'mat_chaos_stone', weight: 5 }
    ],
    minLevel: 1,
    spiritStones: { min: 0, max: 0 },
    spiritStoneChance: 0
};

// 11. 构装体（解剖）
const CONSTRUCT_LOOT = {
    common: [
        { id: 'mat_mechanism_part', weight: 70 },
        // v27.19：机关件（机关臂配方的主料）——构装残件里挑得出整装件（解剖线直连义体线：打它、拆它、再拼成手）
        { id: 'special_mechanism', weight: 30 }
    ],
    uncommon: [
        { id: 'mat_spirit_crystal', weight: 30 }
    ],
    // 0.2.7：构装体 rare 此前为空——高级构装掉天铁/星铁
    rare: [
        { id: 'mat_sky_iron', weight: 10 },
        { id: 'mat_star_iron', weight: 8 }
    ],
    minLevel: 1,
    spiritStones: { min: 0, max: 0 },
    spiritStoneChance: 0
};

// 12. 元素生物（解剖）
const ELEMENTAL_LOOT = {
    common: [
        { id: 'mat_five_element_essence', weight: 80 }
    ],
    // 0.2.7：元素 uncommon 仅1项，补五行晶类多样掉落
    uncommon: [
        { id: 'mat_element_crystal', weight: 40 },
        { id: 'mat_fire_crystal', weight: 30 },
        { id: 'mat_wind_essence', weight: 25 }
    ],
    rare: [
        { id: 'mat_chaos_stone', weight: 5 },
        { id: 'mat_space_crystal', weight: 4 }
    ],
    minLevel: 1,
    spiritStones: { min: 0, max: 0 },
    spiritStoneChance: 0
};

// 所有携带物表的映射
const LOOT_TABLES = {
    bandit: BANDIT_LOOT,
    normal_human: NORMAL_HUMAN_LOOT,
    elite: ELITE_LOOT,
    boss: BOSS_LOOT,
    beast: BEAST_LOOT,
    demon_beast: DEMON_BEAST_LOOT,
    boss_beast: BOSS_BEAST_LOOT,
    dungeon_guard: DUNGEON_GUARD_LOOT,
    dungeon_boss: DUNGEON_BOSS_LOOT,
    undead: UNDEAD_LOOT,
    construct: CONSTRUCT_LOOT,
    elemental: ELEMENTAL_LOOT
};

// ============ 工具函数 ============

// 加权随机选取
function weightedPick(items) {
    if (!items || items.length === 0) return null;
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const item of items) {
        roll -= item.weight;
        if (roll <= 0) return item.id;
    }
    return items[items.length - 1].id;
}

// 随机选取（等概率）
function randomPick(items) {
    if (!items || items.length === 0) return null;
    return items[Math.floor(Math.random() * items.length)];
}

// ============ 事件宝箱掉落 ============
// W-1 接线：这一段原先住在 js/items-extended/09-loot-sources.js（v8.5 起废弃、不挂载），
// 而 js/items-extended/11-event-extensions.js 的两处宝箱奇遇是按 `window.openChest` 判定的
// ——定义文件不挂载 ⇒ 该全局恒 undefined ⇒ 「沙漠遗迹／水下洞窟」永远走「纹丝不动」那一支，
//   玩家开箱开不出任何东西。此处按本文件（战利品系统的现行归属）接管那张货单与开箱手。
// ⚠️ 只搬「宝箱」这一族：EXTENDED_LOOT_TABLES 那张扩展战斗掉落表已被本文件 LOOT_TABLES 覆盖
//   （beast/bandit/dungeon_guard/dungeon_boss/boss_beast 五个键逐档重叠），不再第二份挂载。
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
                'pill_body_foundation', 'tal_fireball', 'art_sword_basic', 'spec_enhance_stone', 'spec_transfer_stone'], // DES-91：原列有 'pill_diamond'，全仓仅此一见、百宝册查无，掷中即发不出货
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
// DES-91（第一百二十九批）：先掷骰再问表——池里混进查无此物的号时照掷，addItem 一件也发不出，
//   屏上却已有一句「你找到了宝物」（且开完箱什么也不念）。故掷之前先对一遍百宝册，落袋问实收。
function openChest(chestType) {
    const table = CHEST_LOOT[chestType];
    if (!table) return;

    const lib = window.itemById;
    const pool = lib ? table.items.filter(function (id) { return !!lib[id]; }) : table.items.slice();
    if (!pool.length) return null; // 整池都是虚标货：这箱开不出东西，如实别演

    const itemId = pool[Math.floor(Math.random() * pool.length)];
    const count = table.count[0] + Math.floor(Math.random() * (table.count[1] - table.count[0] + 1));
    const stones = table.spiritStones[0] + Math.floor(Math.random() * (table.spiritStones[1] - table.spiritStones[0] + 1));

    let got = 0;
    if (window.inventory) {
        got = Number(window.inventory.addItem(itemId, count)) || 0;
        window.inventory.currency.spiritStones = (window.inventory.currency.spiritStones || 0) + stones;
    }
    // v27.13：产出登记——开箱搜刮盖「loot」章（记实收件数，一件没带走不记账）。登记失败不拦获得。
    if (got > 0) {
        try {
            if (window.ItemProvenance && typeof window.ItemProvenance.note === 'function') {
                window.ItemProvenance.note('loot', itemId, got);
            }
        } catch (ePrv) { console.warn('[静默失败] js/loot-system.js · openChest：产出登记未入簿（物品照常到手）', ePrv && ePrv.message); }
    }

    const itemName = window.itemById?.[itemId]?.name || itemId;
    if (typeof window.showMessage === 'function') {
        window.showMessage(got >= count
            ? '📦 开箱得了 ' + itemName + '×' + got + '，另得灵石 ' + stones + '。'
            : (got > 0
                ? '📦 箱里是 ' + itemName + '×' + count + '，行囊只塞得下 ' + got + '/' + count + ' 件，余下的留在箱里；灵石 ' + stones + ' 已收入。'
                : '📦 箱里的 ' + itemName + '×' + count + ' 一件也没能带走：'
                  + ((typeof window.addItemFailText === 'function' && window.addItemFailText(itemName)) || '它没有跟你走。') // DES-90（第一百三十九批）：开箱是一次性的，②形·句尾位带句号、另起一句的形状保留
                  + '（灵石 ' + stones + ' 已收入。）'),
            got >= count ? 'success' : 'warning');
    }
    return { itemId, count, stones, itemName, got: got, poolSize: pool.length };
}

// ============ 敌人类型判定 ============

function determineEnemyType(enemyData) {
    if (!enemyData) return ENEMY_TYPES.NORMAL_HUMAN;
    
    const name = enemyData.name || '';
    const species = enemyData.species || '';
    const type = enemyData.type || '';
    const physiologyType = enemyData.physiologyType || '';
    
    // 1. 基于生理类型优先判定
    if (physiologyType === 'undead') return ENEMY_TYPES.UNDEAD;
    if (physiologyType === 'construct') return ENEMY_TYPES.CONSTRUCT;
    if (physiologyType === 'elemental') return ENEMY_TYPES.ELEMENTAL;
    
    // 2. 基于名称关键词
    if (name.includes('BOSS') || name.includes('boss') || 
        name.includes('首领') || name.includes('霸主') || 
        name.includes('妖王') || name.includes('龙王')) {
        return species === 'beast' ? ENEMY_TYPES.BOSS_BEAST : ENEMY_TYPES.BOSS;
    }
    if (name.includes('守卫') || name.includes('守护') || name.includes('护法')) {
        return ENEMY_TYPES.DUNGEON_GUARD;
    }
    if (name.includes('山贼') || name.includes('流寇') || name.includes('土匪') || 
        name.includes('强盗') || name.includes('匪徒') || name.includes('马贼')) {
        return ENEMY_TYPES.BANDIT;
    }
    
    // 3. 基于species
    if (species === 'beast' || physiologyType === 'beast') {
        if (type === 'boss' || name.includes('精英') || name.includes('妖兽')) {
            return ENEMY_TYPES.DEMON_BEAST;
        }
        return ENEMY_TYPES.BEAST;
    }
    
    // 4. 基于type
    if (type === 'boss') {
        return ENEMY_TYPES.BOSS;
    }
    if (type === 'elite') {
        return ENEMY_TYPES.ELITE;
    }
    if (type === 'dungeon_guard') {
        return ENEMY_TYPES.DUNGEON_GUARD;
    }
    if (type === 'dungeon_boss') {
        return ENEMY_TYPES.DUNGEON_BOSS;
    }
    
    // 5. 默认为普通人类
    return ENEMY_TYPES.NORMAL_HUMAN;
}

// ============ v20.95 毕业装掉落梯（品级补阶批次的新货全在这四本账里） ============
// ★下面 :626-632 那几行掷骰（等级门槛 / 灵脉阶数 / 0.25、0.18、0.12、0.35、0.10、0.06）是掉率，
//   一个数都不许动。往这四本账里加 id 改的是「这一档可能掉到哪件东西」，
//   每档的触发条件与概率完全不变——这是加货，不是调掉率。
var GRAD_LOOT_BANDS = {
    // 六品：中段补档货，15+ 精英起步
    pin6: ['arm_cloud_shield', 'arm_agate_necklace', 'arm_twin_fish_ring', 'arm_bronze_bell', 'arm_azure_robe',
        'arm_cloud_step_boots', 'pill_gather_yuan', 'mat_spirit_pattern_copper', 'wpn_frost_sword'],
    // 四品：中上段，20+ 首领与灵脉强敌
    // ＋补档（PIN3 低段 lv15~22）：原先这一档只有 PIN4 的货，PIN3 的低段全表悬空。
    pin4: ['arm_black_iron_shield', 'arm_warm_jade_neck', 'arm_star_ring', 'arm_sword_ring', 'arm_bodhi_pendant',
        'arm_talisman_pouch', 'arm_golden_silk', 'arm_cloud_walk_boots', 'pill_jade_marrow', 'mat_meteor_essence', 'wpn_crimson_dao',
        // —— PIN3 低段：装备 5 件
        'arm_soul_banner', 'arm_hun_yuan_ring', 'arm_hun_yuan_belt', 'arm_chaos_charm', 'arm_bagua_shield',
        'arm_nine_bead_necklace',
        // —— 丹药 4 件：通用突破丹 2（破境丹固定+10%、悟道丹顿悟5~15%随机）
        //    ＋ 化神/炼虚两境的专属突破丹（化神丹本就已定义、零引用；虚空丹本批新增）
        'pill_pojing', 'pill_qi_return_supreme', 'pill_wudao', 'pill_huashen', 'pill_xukong'],
    // 二品：高端货，26+ 首领与灵脉二重以上
    // ＋补档（PIN3 高段 lv24~35）
    pin2: ['arm_tortoise_shield', 'arm_jiao_necklace', 'arm_moon_ring', 'arm_soul_jade', 'arm_cloud_charm',
        'arm_purple_robe', 'arm_qilin_ring', 'pill_purple_vault', 'mat_chaos_marrow',
        // —— PIN3 高段：兵器 8 件
        'wpn_peacock', 'wpn_cheng_ying', 'wpn_dragon_claw', 'wpn_seven_star', 'wpn_yin_yang_staff',
        'wpn_jiuxiao', 'wpn_tai_a', 'wpn_tiancan_qin',
        // —— 防具 3 件
        'arm_colorful_boots', 'arm_immortal_crown', 'pill_triple_flower',
        // —— 合体/大乘两境的专属突破丹（本批新增）
        'pill_hebi', 'pill_dacheng'],
    // 一品：毕业装，灵脉三重魔头与 30+ 深层首领的压箱底
    // 注：末位 dragon_staff 实测不在任何物品表里（itemById 查无此号）＝幽灵条目，
    //     掷中即得一件查无此号的空壳。本批只加档位行、不改 pin1 内部配比，另案处理。
    pin1: ['arm_pangu_shield', 'arm_starry_necklace', 'arm_heaven_ring', 'arm_dao_ring', 'arm_primordial_pendant',
        'arm_immortal_seal', 'arm_nine_turn_robe', 'arm_heaven_crown', 'arm_cloud_shoes', 'arm_xuan_belt',
        'arm_jiao_gauntlets', 'wpn_heaven_ask', 'wpn_nirvana_staff', 'dragon_staff']
};

// ============ 携带物选取 ============

function pickItems(poolId, level, profT) {
    const table = LOOT_TABLES[poolId];
    if (!table) return [];

    const items = [];

    // v27.13 解剖熟练度（②改良「搜刮与解剖的熟练度」）：profT ∈ [0,1] 为该兽种熟练进度。
    // 缺省 0 = 旧掷骰逐字节一致（两刀可缺席：账不在/旧调用方不传 = 一切照旧）。
    var _prof = (typeof profT === 'number' && isFinite(profT) && profT > 0) ? Math.min(1, profT) : 0;

    // 等级低于最低要求，给少量九品货（低阶兜底支不吃熟练——能遇上低于门槛的兽本就少见）
    if (level < table.minLevel) {
        if (table.common && table.common.length > 0) {
            const count = 1 + Math.floor(Math.random() * 2);
            for (let i = 0; i < count; i++) {
                const item = weightedPick(table.common);
                if (item) items.push(item);
            }
        }
        return items;
    }
    
    // 根据等级决定品质池
    const availablePools = ['common'];
    if (level >= 5) availablePools.push('uncommon');
    if (level >= 10) availablePools.push('rare');
    if (level >= 20 && poolId === 'boss' || poolId === 'dungeon_boss' || poolId === 'boss_beast') {
        availablePools.push('rare');
    }
    
    // 从各品质池中选取
    // 九品：1~2种
    // v27.13 档一（更快）：熟练手不空刀——那记「1 还是 2」的骰随熟练少掷丢，满熟练保底两件
    const commonCount = (_prof > 0 && Math.random() < _prof) ? 2 : 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < commonCount; i++) {
        if (table.common && table.common.length > 0) {
            const item = weightedPick(table.common);
            if (item && !items.includes(item)) items.push(item);
        }
    }
    
    // 八品：50%概率获得1种
    // v27.13 档二（更完整）：低阶档产出权重向高档偏移——八品门槛随熟练上移（+0.10，满熟练 0.60）
    if (availablePools.includes('uncommon') && table.uncommon && table.uncommon.length > 0) {
        if (Math.random() < 0.5 + 0.10 * _prof) {
            const item = weightedPick(table.uncommon);
            if (item) items.push(item);
        }
    }
    
    // 七品：低概率获得
    // v27.13 档二（续）：七品门槛随熟练上移（+0.06，满熟练普通兽 0.26 / boss 系 0.66）。
    // 两档合计满熟练总产出约 +30% 封顶（照主档「每类 20 次满熟练，收益 +30% 封顶」的夹逼口径）；
    // 基率 0.5/0.2/0.6 这几个常数原样不动，熟练只加零起步的一项。
    if (availablePools.includes('rare') && table.rare && table.rare.length > 0) {
        const rareChance = (poolId === 'boss' || poolId === 'dungeon_boss' || poolId === 'boss_beast' ? 0.6 : 0.2) + 0.06 * _prof;
        if (Math.random() < rareChance) {
            const item = weightedPick(table.rare);
            if (item) items.push(item);
        }
    }
    
    return items;
}

// ============ v27.13 生态再生账·幼兽期不出丹（⑩改良「生态再生账」的最后半句） ============
// 主档原文：照药藏方子给兽群/矿脉做 regen——死兽地区歇三月回弹（js/map/randomMap.js 生态再生账已落）、
// **幼兽期不出丹**（本段）。矿侧守恒（app.js mineOre 门 + world-ledger oreStock）是另一刀，此处不沾。
//
// 口子开在「生成那一骰」：战利品 v1.0 铁律=携带物在生成时预设（generateEnemyInventory 掷骰），
// 解剖只是揭开这份预设——所以门设在生成侧，app.js 的解剖口一行不用动。
// 【只压丹，不动表】BEAST_LOOT.rare（w5）/ DEMON_BEAST_LOOT.uncommon（w50）的权重与门槛骰
//   一个数不动；成兽与 boss 系的掷骰结果逐字节照旧。只有被判为幼兽的个体，掷完后把妖兽内丹
//   从这具携带物里剔掉（门在 pickItems 掷骰的外侧，解剖/搜刮两本熟练账一行不沾）。
//   boss_beast 表本就无丹，不设门——boss 系彻底照旧。
// 【幼兽判据】（现状盘点：全工程没有「幼兽/成长期」字段——灵兽账 BEAST_TEMPLATES 只有
//   name/level/realm/attrs/evolve/mount/innate，野图兽实体也只有 level；按「绝不为此新增存档键」，
//   用现有结构里最贴的口径近似，阈值就在 return 那一行）：
//     个体等级 **严格低于** 本族「成体出没等级」＝幼兽；到了档＝丹气已成，照旧出丹。
//   成体出没等级读**生态分布表** window.BeastEcosystem.BEAST_DISTRIBUTION 的 level——
//   那是名种在野外的真实出没档（buildWildBeastData 的 lv 就取它）：灵狐 5 / 风狼 8 / 雷鹰 12 / 龙龟 18。
//   ★刻意不回退灵兽账模板等级：模板档是「可收服成体」的数值档（灵狐 15 / 龙龟 50），拿它当基准
//   会把整族野生种群误判成幼兽——那不叫压幼兽，叫砍全表。
//   分布表不在/查无此族（进化形态等）＝判据缺席＝照旧出丹，绝不拦成兽。
// 【文案接线位】「这兽尚幼，丹气未成」的唯一播报口是 app.js dissectCorpse（本轮禁改文件），
//   故文案不在此发。被剔丹的携带物盖 _juvenileNoCore 运行时章（随 carriedInventory →
//   corpseData.inventory 走到尸体上；纯运行时标，各存档 registry 均不收尸体，不入档）。
//   后续批次在 dissectCorpse 取到 inv 处一行接线即可：
//     if (inv && inv._juvenileNoCore && window.JUVENILE_NO_CORE_TEXT) msg += '（' + window.JUVENILE_NO_CORE_TEXT + '。）';
var JUVENILE_NO_CORE_ITEM = 'mat_demon_beast_core';   // 妖兽内丹（解剖表里唯二出丹口：BEAST.rare / DEMON_BEAST.uncommon）

function _juvenileBeastNoCore(enemyData) {
    try {
        if (!enemyData) return false;
        var tplId = enemyData.beastTemplateId || null;
        if (!tplId) return false;                                  // 无名杂兽无族可查：判据缺席，照旧
        var lib = (typeof window !== 'undefined') ? window.BEAST_TEMPLATES : null;
        var tpl = lib ? lib[tplId] : null;
        if (!tpl || !tpl.name) return false;                       // 灵兽账不在/查无此号：照旧
        var eco = (typeof window !== 'undefined') ? window.BeastEcosystem : null;
        var dist = (eco && Array.isArray(eco.BEAST_DISTRIBUTION)) ? eco.BEAST_DISTRIBUTION : null;
        if (!dist) return false;                                   // 分布表不在（裸世界/单测只喂本文件）：判据缺席，照旧
        var adultLv = NaN;
        for (var di = 0; di < dist.length; di++) {
            if (dist[di] && dist[di].name === tpl.name) { adultLv = Number(dist[di].level); break; }
        }
        if (!isFinite(adultLv) || adultLv <= 0) return false;      // 分布表查无此族：不猜，照旧
        var lv = Number(enemyData.level);
        if (!isFinite(lv) || lv <= 0) return false;                // 等级取不到：照旧
        return lv < adultLv;                                       // 阈值：不及本族成体出没档＝幼兽
    } catch (eJuv) {
        console.warn('[静默失败] js/loot-system.js · _juvenileBeastNoCore：幼兽判据读不到——按成兽照旧出丹', eJuv && eJuv.message);
        return false;
    }
}

// ============ 生成敌人携带物 ============

// v13.1 可学绝技→秘籍物品映射（与 items-extended/14-ability-manuals.js 对应；种系天生4项不在此列）
var ABILITY_MANUAL_IDS = {
    venom: 'manual_venom',
    lifesteal: 'manual_lifesteal',
    reflect: 'manual_reflect',
    soundwave: 'manual_soundwave',
    illusion: 'manual_illusion',
    escape: 'manual_escape',
    drain_qi: 'manual_drain_qi',
    gu_parasite: 'manual_gu_parasite',
    sword_burst: 'manual_sword_burst'
};

function generateEnemyInventory(enemyData) {
    const inventory = {
        items: [],
        spiritStones: 0,
        copper: 0
    };

    if (!enemyData) return inventory;

    const enemyType = determineEnemyType(enemyData);
    const level = enemyData.level || 1;
    const table = LOOT_TABLES[enemyType];

    if (!table) return inventory;

    // 选取物品
    // v27.13 解剖熟练度：只有兽形解剖系（beast/demon_beast/boss_beast）按种类吃熟练账——
    // 携带物仍是「生成时预设」（战利品 v1.0 铁律不动），熟练度只改生成这一骰的成色：
    // 你对这类妖兽下刀有数，同一具尸身上你就剥得出更全的一副家什。
    // 无名杂兽/旧调用方不传种/裸世界账不在 = profT 恒 0 = 旧掷骰照旧。
    var _dissectProfT = 0;
    if (enemyType === ENEMY_TYPES.BEAST || enemyType === ENEMY_TYPES.DEMON_BEAST || enemyType === ENEMY_TYPES.BOSS_BEAST) {
        try {
            var _spId = enemyData.beastTemplateId || null;
            if (_spId && typeof window.dissectProfLevel === 'function') {
                _dissectProfT = Number(window.dissectProfLevel(_spId)) || 0;
            }
        } catch (eProf) { console.warn('[静默失败] js/loot-system.js · generateEnemyInventory：解剖熟练账读不到——按旧掷骰生成携带物', eProf && eProf.message); }
    }
    // v27.13 搜刮熟练度（②改良·搜刮侧）：非兽形系（搜刮侧九类）按敌人类别吃搜刮账——
    // 账键就是本函数 determineEnemyType 的结果（与掷骰同一把分类键），生成携带物时顺手在
    // inventory 上盖一枚 lootType 章，随 carriedInventory 流到 corpseData.inventory，
    // app.js lootCorpse 真搜出东西后按章落账：掷骰键=记账键，同源不会错记。
    // 兽形三系不吃这本账（走解剖账）；账不在（旧档/裸世界）= _lootProfT 恒 0 = 旧掷骰照旧。
    // （此处借解剖侧声明的 _dissectProfT 当「本骰熟练度」载体：兽形系装解剖账、搜刮侧装搜刮账
    //   ——下一行 pickItems 调用与解剖侧成品行逐字节不动，兽形系传入值不受影响。）
    if (enemyType !== ENEMY_TYPES.BEAST && enemyType !== ENEMY_TYPES.DEMON_BEAST && enemyType !== ENEMY_TYPES.BOSS_BEAST) {
        try {
            inventory.lootType = enemyType; // 先盖章：记账键与掷骰键同源（新生成的携带物才有章，旧尸体没有=不记账）
            _dissectProfT = _lootProfT(enemyType);
        } catch (eLootProf) { console.warn('[静默失败] js/loot-system.js · generateEnemyInventory：搜刮熟练账读不到——按旧掷骰生成携带物', eLootProf && eLootProf.message); }
    }
    inventory.items = pickItems(enemyType, level, _dissectProfT);

    // v27.13 生态再生账·幼兽期不出丹：掷骰照旧掷（权重/门槛一个数不动），掷完在外侧设门——
    // 被判为幼兽的兽，把妖兽内丹从这具携带物里剔掉并盖 _juvenileNoCore 运行时章
    // （文案接线位见 _juvenileBeastNoCore 上方注释）。先查有无丹再判幼兽：没掷出丹的门不开。
    // 只认解剖出丹的两系（beast/demon_beast）；boss_beast 本就无丹不设门——boss 系照旧。
    // 门缺席（判据取不到）＝不剔＝照旧出丹；解剖/搜刮两本熟练账的读写都不经过这里。
    if (enemyType === ENEMY_TYPES.BEAST || enemyType === ENEMY_TYPES.DEMON_BEAST) {
        try {
            if (inventory.items.indexOf(JUVENILE_NO_CORE_ITEM) >= 0 && _juvenileBeastNoCore(enemyData)) {
                inventory.items.splice(inventory.items.indexOf(JUVENILE_NO_CORE_ITEM), 1);
                inventory._juvenileNoCore = true;
            }
        } catch (eJuvGate) { console.warn('[静默失败] js/loot-system.js · generateEnemyInventory：幼兽剔丹门没设上——本具照旧出丹', eJuvGate && eJuvGate.message); }
    }

    // 灵石
    if (table.spiritStones && table.spiritStoneChance > 0) {
        if (Math.random() * 100 < table.spiritStoneChance) {
            const min = table.spiritStones.min * level;
            const max = table.spiritStones.max * level;
            inventory.spiritStones = Math.floor(min + Math.random() * (max - min));
        }
    }

    // v13.1 秘籍掉落闭环：持有可学绝技的敌人，每持有一项12%概率携带对应秘籍
    // （多项独立判定、上限1本/场；金蚕蛊/采补减半为6%）；条目格式与 pickItems 一致（纯id字符串）
    if (Array.isArray(enemyData.combatAbilities) && enemyData.combatAbilities.length > 0) {
        var manualDropped = false;
        for (var mi = 0; mi < enemyData.combatAbilities.length && !manualDropped; mi++) {
            var abId2 = enemyData.combatAbilities[mi];
            var manualId = ABILITY_MANUAL_IDS[abId2];
            if (!manualId) continue; // 种系天生技/未知id不掉秘籍
            var dropChance = (abId2 === 'gu_parasite' || abId2 === 'drain_qi') ? 0.06 : 0.12;
            if (Math.random() < dropChance) {
                inventory.items.push(manualId);
                manualDropped = true;
            }
        }
    }

    // v20.95 毕业装掉落梯：顶级货不进普通表——只有灵脉魔头、高阶首领、深层秘境boss才压箱底带着
    try {
        var leyTier = Number(enemyData._leyElite) || 0;
        var bossish = enemyType === 'boss' || enemyType === 'dungeon_boss' || enemyType === 'boss_beast';
        var eliteish = enemyType === 'elite' || enemyType === 'demon_beast' || enemyType === 'dungeon_guard';
        function _gradPick(band) {
            var l = GRAD_LOOT_BANDS[band];
            return l && l.length ? l[Math.floor(Math.random() * l.length)] : null;
        }
        // 六品：15 级以上精英/boss 系，四分之一带着中段货
        if (level >= 15 && (bossish || eliteish) && Math.random() < 0.25) { var g6 = _gradPick('pin6'); if (g6) inventory.items.push(g6); }
        // 四品：20 级以上 boss 系 18%，灵脉一重以上 12%
        if (((level >= 20 && bossish) ? Math.random() < 0.18 : false) || (leyTier >= 1 && Math.random() < 0.12)) { var g4 = _gradPick('pin4'); if (g4) inventory.items.push(g4); }
        // 二品：26 级以上 boss 系 12%，灵脉二重以上 20%
        if (((level >= 26 && bossish) ? Math.random() < 0.12 : false) || (leyTier >= 2 && Math.random() < 0.20)) { var g2 = _gradPick('pin2'); if (g2) inventory.items.push(g2); }
        // 一品：灵脉三重魔头 35%、30 级以上秘境 boss 10%、33 级以上 boss 系 6%
        if ((leyTier >= 3 && Math.random() < 0.35) || (level >= 30 && enemyType === 'dungeon_boss' && Math.random() < 0.10) || (level >= 33 && bossish && Math.random() < 0.06)) { var g1 = _gradPick('pin1'); if (g1) inventory.items.push(g1); }
    } catch (e) {}

    // W-1（接线五处 · 第一处）删账：此处原有一段「0.2.7 接通 EXTENDED_LOOT_TABLES」的调用，
    //   走 `window.getExtendedLoot`——而那个函数的唯一「定义」在 js/items-extended/09-loot-sources.js，
    //   该文件 v8.5 起废弃、仙侠.html 早已不挂载 ⇒ 运行期该全局恒 undefined ⇒ 这十几行永不执行，
    //   且外面还套着一层 `catch(e){}` 静默吞掉，连报错都没有（空 catch 欠账里的一条）。
    //   两张表本身重复：EXTENDED_LOOT_TABLES 的 beast/bandit/dungeon_guard/dungeon_boss/boss_beast
    //   五个键与本文件 LOOT_TABLES 同名键逐档重叠（beast.common 三枚 id 完全相同）。
    //   真要挂载 09 那份 = 每次击杀在主表之外再叠一整轮掷骰 = 掉落翻倍，故不挂，改删这段死调用。
    return inventory;
}

// ============ 获取野兽材料描述 ============

function getBeastMaterialDescription(beastName) {
    const name = beastName || '';
    if (name.includes('龙')) return '传说级龙族材料';
    if (name.includes('凤') || name.includes('凰')) return '传说级凤族材料';
    if (name.includes('麒麟')) return '传说级瑞兽材料';
    if (name.includes('妖')) return '妖兽材料';
    return '普通野兽材料';
}

// ============ v27.13 解剖熟练度账（②改良：搜刮与解剖的熟练度） ============
// 主档原文：同一只妖兽解剖百次该更快更完整（技能成长），目前一次性掷骰。
// 最轻版设计：按妖兽**种类**（BEAST_TEMPLATES 模板 id）记熟练度——同类解剖次数越多越熟，
// 不是全局一刀；无名杂兽没有种类账，不入册也不吃加成。
// 效果两档（都落在生成那一骰上，见 pickItems）：
//   档一（更快）：common「1~2 件」那记骰随熟练少掷丢，满熟练保底两件；
//   档二（更完整）：uncommon/rare 两道门槛随熟练上移——低阶档产出权重向高档偏移。
// 夹逼封顶：每类解剖 20 次满熟练（progress=1），两档合计总产出约 +30%，到顶不再涨。
// 可缺席：账不在（旧档/裸世界）= dissectProfLevel 恒 0 = 旧掷骰照旧。
var DISSECT_PROF_MAX = 20;
var _dissectProf = {};   // 模板 id → 同类解剖次数（唯一写点：noteDissectProf，app.js 解剖口调）

function _dissectProfT(speciesId) {
    if (!speciesId) return 0;
    var n = Number(_dissectProf[speciesId]) || 0;
    return Math.min(1, n / DISSECT_PROF_MAX);
}

// 解剖落账+读进度：返回 {count, t, max} 供文案拼「熟稔 12/20」；无名杂兽（无种类账）回 null 不记
function noteDissectProf(speciesId) {
    if (!speciesId) return null;
    _dissectProf[speciesId] = (Number(_dissectProf[speciesId]) || 0) + 1;
    return { count: _dissectProf[speciesId], t: _dissectProfT(speciesId), max: DISSECT_PROF_MAX };
}

window.dissectProfLevel = function (speciesId) { return _dissectProfT(speciesId); };
window.noteDissectProf = noteDissectProf;
window.DISSECT_PROF_MAX = DISSECT_PROF_MAX;

// v27.13 熟练账入档：StateRegistry 'lootProficiency'——旧档缺账 = 全 0（旧掷骰照旧），零迁移
if (typeof window !== 'undefined' && window.StateRegistry && typeof window.StateRegistry.register === 'function') {
    try {
        window.StateRegistry.register('lootProficiency', {
            version: 1,
            export: function () { return { prof: _dissectProf }; },
            import: function (data) {
                _dissectProf = {};
                if (!data || !data.prof) return;
                for (var k in data.prof) {
                    var v = Number(data.prof[k]);
                    if (isFinite(v) && v > 0) _dissectProf[k] = Math.floor(v);
                }
            },
            reset: function () { _dissectProf = {}; }
        });
    } catch (eReg) { console.warn('[静默失败] js/loot-system.js · StateRegistry.register：解剖熟练账没挂进存档——本局照常生效，读档后清零', eReg && eReg.message); }
}

// ============ v27.13 搜刮熟练度账（②改良：搜刮与解剖的熟练度·搜刮侧） ============
// 主档同一句的后半：人类尸身搜刮此前也是一次性掷骰。解剖侧（兽形系）已按兽种记账（上方 _dissectProf）；
// 本侧照抄同一套效果语义，账键改用**搜刮表自己的分类键**——LOOT_TABLES 的敌人类别键
// （bandit/normal_human/elite/boss/dungeon_guard/dungeon_boss/undead/construct/elemental），一个不新造。
// 兽形三系（beast/demon_beast/boss_beast）不入此册——它们走解剖账；两本账是两个对象，互不串写。
// 注：亡灵/构装体/元素三类的表虽注「解剖」，尸体面板按 isBeast 分流（app.js markKilledEnemyAsCorpse /
// renderInteraction），它们死后的按钮实际是「搜刮尸体」——故归搜刮侧，按各自表键各记各的账。
// 效果两档（同解剖侧，同落在生成那一骰上，见 pickItems；携带物「生成时预设」的 v1.0 铁律不动）：
//   档一（更快）：common「1~2 件」那记骰随熟练少掷丢，满熟练必掷两件（保底件数与解剖侧同数=2，
//     理由：同一把「熟手不空手」的尺子跨两系通用，玩家不必学两套数值。表池只有一项时
//     （如 construct.common）去重后仍一件——池形如此，两系同款行为）；
//   档二（更完整）：uncommon 门槛 0.5 → +0.10×t（满熟练 0.60）、rare 门槛基率 → +0.06×t
//     （boss/dungeon_boss 满熟练 0.66，其余 0.26）——常数与解剖侧逐个相同，换算=直接沿用
//     解剖侧同一函数（pickItems）里的同一组数；两档合计满熟练总产出约 +30% 封顶，
//     照主档「每类 20 次满熟练，收益 +30% 封顶」的夹逼口径。这是「熟手更利索」，不是印钞。
// 记账纪律（与解剖侧同款）：真搜出东西才记账——钩子接在 app.js lootCorpse（搜刮唯一入口）调用点，
// 灵石/铜钱/物品任一真落袋才算这一手练了搜刮，囊满一件没拿走不练手；lootType 章由
// generateEnemyInventory 生成携带物时盖上（= 掷骰用的同一处 determineEnemyType 结果），
// 掷骰键与记账键同源，不会错记。
// 玩家侧是否显示熟练进度：本轮**不做 UI**（连里程碑文案也不加）——只留 window.lootProfLevel 读口
// 与 noteLootProf 的 {count,t,max} 返回值，解剖侧 5/10/15/20 那种成长文案留给后续批次接。
// 可缺席：账不在（旧档/裸世界）= lootProfLevel 恒 0 = 旧掷骰照旧；旧尸体携带物上没有 lootType 章 = 不记账。
var LOOT_PROF_MAX = 20;   // 与解剖侧 DISSECT_PROF_MAX 同数：同尺跨系，每类 20 次搜到满熟练
var _lootProf = {};       // 敌人类别键 → 搜到东西的次数（唯一写点：noteLootProf，app.js 搜刮口调）

function _lootProfT(typeKey) {
    if (!typeKey) return 0;
    var n = Number(_lootProf[typeKey]) || 0;
    return Math.min(1, n / LOOT_PROF_MAX);
}

// 搜刮落账+读进度：返回 {count, t, max} 供将来文案拼「熟稔 12/20」；键不在搜刮侧名单里回 null 不记
function noteLootProf(typeKey) {
    if (!typeKey || !LOOT_TABLES[typeKey]) return null;
    if (typeKey === ENEMY_TYPES.BEAST || typeKey === ENEMY_TYPES.DEMON_BEAST || typeKey === ENEMY_TYPES.BOSS_BEAST) return null; // 兽形三系归解剖账，防串
    _lootProf[typeKey] = (Number(_lootProf[typeKey]) || 0) + 1;
    return { count: _lootProf[typeKey], t: _lootProfT(typeKey), max: LOOT_PROF_MAX };
}

window.lootProfLevel = function (typeKey) { return _lootProfT(typeKey); };
window.noteLootProf = noteLootProf;
window.LOOT_PROF_MAX = LOOT_PROF_MAX;

// v27.13 搜刮熟练账入档：StateRegistry 'lootProficiencySearch'（新键不升版——解剖账那把
// 'lootProficiency' 一字不动；旧档缺此键 = StateRegistry.importAll 跳过 = 全 0 照旧掷骰，零迁移）
if (typeof window !== 'undefined' && window.StateRegistry && typeof window.StateRegistry.register === 'function') {
    try {
        window.StateRegistry.register('lootProficiencySearch', {
            version: 1,
            export: function () { return { prof: _lootProf }; },
            import: function (data) {
                _lootProf = {};
                if (!data || !data.prof) return;
                for (var k in data.prof) {
                    var v = Number(data.prof[k]);
                    if (isFinite(v) && v > 0) _lootProf[k] = Math.floor(v);
                }
            },
            reset: function () { _lootProf = {}; }
        });
    } catch (eReg2) { console.warn('[静默失败] js/loot-system.js · StateRegistry.register：搜刮熟练账没挂进存档——本局照常生效，读档后清零', eReg2 && eReg2.message); }
}

// ============ 导出到全局 ============
window.LOOT_TABLES = LOOT_TABLES;
window.GRAD_LOOT_BANDS = GRAD_LOOT_BANDS;
window.ENEMY_TYPES = ENEMY_TYPES;
window.determineEnemyType = determineEnemyType;
window.generateEnemyInventory = generateEnemyInventory;
window.pickItems = pickItems;
window.getBeastMaterialDescription = getBeastMaterialDescription;
// W-1：宝箱货单与开箱手自 09-loot-sources.js 迁来（那本不挂载 ⇒ 奇遇宝箱整条通道是死的）
window.CHEST_LOOT = CHEST_LOOT;
window.openChest = openChest;
// v27.13 生态再生账·幼兽期不出丹：文案常量随门导出——app.js dissectCorpse 接线用（见上方注释）
window.JUVENILE_NO_CORE_TEXT = '这兽尚幼，丹气未成';