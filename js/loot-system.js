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
        { id: 'mat_spacetime_crystal', weight: 5 },
        { id: 'art_wan_jian', weight: 5 }
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
        { id: 'mat_spacetime_crystal', weight: 15 }
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
        { id: 'mat_mechanism_part', weight: 70 }
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

// ============ 携带物选取 ============

function pickItems(poolId, level) {
    const table = LOOT_TABLES[poolId];
    if (!table) return [];
    
    const items = [];
    
    // 等级低于最低要求，给少量凡品
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
    // 凡品：1~2种
    const commonCount = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < commonCount; i++) {
        if (table.common && table.common.length > 0) {
            const item = weightedPick(table.common);
            if (item && !items.includes(item)) items.push(item);
        }
    }
    
    // 良品：50%概率获得1种
    if (availablePools.includes('uncommon') && table.uncommon && table.uncommon.length > 0) {
        if (Math.random() < 0.5) {
            const item = weightedPick(table.uncommon);
            if (item) items.push(item);
        }
    }
    
    // 珍品：低概率获得
    if (availablePools.includes('rare') && table.rare && table.rare.length > 0) {
        const rareChance = poolId === 'boss' || poolId === 'dungeon_boss' || poolId === 'boss_beast' ? 0.6 : 0.2;
        if (Math.random() < rareChance) {
            const item = weightedPick(table.rare);
            if (item) items.push(item);
        }
    }
    
    return items;
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
    inventory.items = pickItems(enemyType, level);

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

    // 0.2.7 接通 EXTENDED_LOOT_TABLES：getExtendedLoot 此前定义从不调用，扩展掉落表形同虚设
    // 对野兽/山贼/秘境类敌人追加掉落（覆盖武器/防具/材料），与主表叠加
    try {
        if (typeof window.getExtendedLoot === 'function') {
            var _subMap = { beast:'beast', demon_beast:'elite_beast', boss_beast:'boss_beast',
                bandit:'bandit', dungeon_guard:'dungeon_guard', dungeon_boss:'dungeon_boss' };
            var _sub = _subMap[enemyType];
            if (_sub) {
                var _ext = window.getExtendedLoot(_sub, level);
                if (_ext) {
                    if (_ext.items && _ext.items.length) {
                        for (var _ei = 0; _ei < _ext.items.length; _ei++) inventory.items.push(_ext.items[_ei]);
                    }
                    inventory.spiritStones += _ext.spiritStones || 0;
                }
            }
        }
    } catch (e) {}

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

// ============ 导出到全局 ============
window.LOOT_TABLES = LOOT_TABLES;
window.ENEMY_TYPES = ENEMY_TYPES;
window.determineEnemyType = determineEnemyType;
window.generateEnemyInventory = generateEnemyInventory;
window.pickItems = pickItems;
window.getBeastMaterialDescription = getBeastMaterialDescription;