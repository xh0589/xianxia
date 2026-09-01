// ==================== 扩展物品 - 功法秘籍类（40种） ====================
// 加载到 window.extendedArts

window.extendedArts = [
    // ===== 内功心法（13种） =====
    { id: 'art_breathing', name: '吐纳术', type: 'secret_art', subtype: 'internal', category: 'secret_art', quality: 'COMMON', level: 1, price: 20, effect: { qi_regen_boost: 10 }, desc: '基础呼吸法', icon: '📖', elements: { neutral: 1.0 } },
    { id: 'art_qi_condense', name: '凝气诀', type: 'secret_art', subtype: 'internal', category: 'secret_art', quality: 'COMMON', level: 1, price: 30, effect: { max_qi_boost: 10 }, desc: '基础凝气', icon: '📖', elements: { neutral: 1.0 } },
    { id: 'art_hun_yuan', name: '混元功', type: 'secret_art', subtype: 'internal', category: 'secret_art', quality: 'UNCOMMON', level: 5, price: 200, effect: { max_qi_boost: 25 }, desc: '混元心法', icon: '📖', elements: { earth: 1.0 } },
    { id: 'art_ice_heart', name: '玄冰诀', type: 'secret_art', subtype: 'internal', category: 'secret_art', quality: 'UNCOMMON', level: 5, price: 250, effect: { ice_damage_boost: 20 }, desc: '寒冰心法', icon: '📖', elements: { water: 1.0 } },
    { id: 'art_fire_heart', name: '离火诀', type: 'secret_art', subtype: 'internal', category: 'secret_art', quality: 'UNCOMMON', level: 5, price: 250, effect: { fire_damage_boost: 20 }, desc: '烈火心法', icon: '📖', elements: { fire: 1.0 } },
    { id: 'art_wood_heart', name: '青木诀', type: 'secret_art', subtype: 'internal', category: 'secret_art', quality: 'UNCOMMON', level: 5, price: 250, effect: { hp_regen_boost: 20 }, desc: '木系心法', icon: '📖', elements: { wood: 1.0 } },
    { id: 'art_earth_heart', name: '厚土诀', type: 'secret_art', subtype: 'internal', category: 'secret_art', quality: 'UNCOMMON', level: 5, price: 250, effect: { defense_boost: 20 }, desc: '土系心法', icon: '📖', elements: { earth: 1.0 } },
    { id: 'art_metal_heart', name: '金锋诀', type: 'secret_art', subtype: 'internal', category: 'secret_art', quality: 'UNCOMMON', level: 5, price: 250, effect: { metal_damage_boost: 20 }, desc: '金系心法', icon: '📖', elements: { metal: 1.0 } },
    { id: 'art_water_heart', name: '水月诀', type: 'secret_art', subtype: 'internal', category: 'secret_art', quality: 'UNCOMMON', level: 5, price: 250, effect: { water_damage_boost: 20 }, desc: '水系心法', icon: '📖', elements: { water: 1.0 } },
    { id: 'art_nine_yang', name: '九阳神功', type: 'secret_art', subtype: 'internal', category: 'secret_art', quality: 'EPIC', level: 18, price: 5000, effect: { all_attr_boost: 30, fire_damage_boost: 50 }, desc: '至阳之功', icon: '☀️', elements: { fire: 1.0 } },
    { id: 'art_nine_yin', name: '九阴真经', type: 'secret_art', subtype: 'internal', category: 'secret_art', quality: 'EPIC', level: 18, price: 5000, effect: { all_attr_boost: 30, ice_damage_boost: 50 }, desc: '至阴之功', icon: '🌙', elements: { water: 1.0 } },
    { id: 'art_taiji', name: '太极玄功', type: 'secret_art', subtype: 'internal', category: 'secret_art', quality: 'EPIC', level: 22, price: 8000, effect: { all_attr_boost: 40, defense_boost: 20 }, desc: '太极之道', icon: '☯️', elements: { earth: 1.0 } },
    { id: 'art_chaos', name: '混沌诀', type: 'secret_art', subtype: 'internal', category: 'secret_art', quality: 'LEGENDARY', level: 30, price: 30000, effect: { all_attr_boost: 60 }, desc: '混沌之力', icon: '🌀', elements: { neutral: 1.0 } },

    // ===== 剑法（9种） =====
    { id: 'art_sword_basic', name: '基础剑法', type: 'secret_art', subtype: 'sword', category: 'secret_art', quality: 'COMMON', level: 1, price: 30, effect: { sword_attack_boost: 10 }, desc: '入门剑法', icon: '⚔️', elements: { neutral: 1.0 } },
    { id: 'art_wind_sword', name: '清风剑法', type: 'secret_art', subtype: 'sword', category: 'secret_art', quality: 'UNCOMMON', level: 5, price: 300, effect: { sword_attack_boost: 25, dexterity_boost: 5 }, desc: '清灵剑法', icon: '⚔️', elements: { wood: 1.0 } },
    { id: 'art_fire_sword', name: '烈火剑法', type: 'secret_art', subtype: 'sword', category: 'secret_art', quality: 'UNCOMMON', level: 5, price: 350, effect: { sword_attack_boost: 25, fire_damage_boost: 15 }, desc: '烈火剑意', icon: '⚔️', elements: { fire: 1.0 } },
    { id: 'art_ice_sword', name: '冰霜剑法', type: 'secret_art', subtype: 'sword', category: 'secret_art', quality: 'UNCOMMON', level: 5, price: 350, effect: { sword_attack_boost: 25, ice_damage_boost: 15 }, desc: '冰霜剑意', icon: '⚔️', elements: { water: 1.0 } },
    { id: 'art_tai_yi_sword', name: '太乙剑法', type: 'secret_art', subtype: 'sword', category: 'secret_art', quality: 'RARE', level: 10, price: 1500, effect: { sword_attack_boost: 50, all_attr_boost: 5 }, desc: '太乙剑道', icon: '⚔️', elements: { earth: 1.0 } },
    { id: 'art_taiji_sword', name: '太极剑法', type: 'secret_art', subtype: 'sword', category: 'secret_art', quality: 'RARE', level: 10, price: 1800, effect: { sword_attack_boost: 45, defense_boost: 30 }, desc: '太极剑意', icon: '☯️', elements: { earth: 1.0 } },
    { id: 'art_dugu_sword', name: '独孤九剑', type: 'secret_art', subtype: 'sword', category: 'secret_art', quality: 'EPIC', level: 18, price: 6000, effect: { sword_attack_boost: 80, counter_boost: 50 }, desc: '独孤剑意', icon: '⚔️', elements: { metal: 1.0 } },
    { id: 'art_ten_thousand_sword', name: '万剑归宗', type: 'secret_art', subtype: 'sword', category: 'secret_art', quality: 'EPIC', level: 20, price: 8000, effect: { sword_attack_boost: 100, aoe_attack: true }, desc: '万剑之道', icon: '⚔️', elements: { metal: 1.0 } },
    { id: 'art_zhu_xian_sword', name: '诛仙剑诀', type: 'secret_art', subtype: 'sword', category: 'secret_art', quality: 'LEGENDARY', level: 30, price: 50000, effect: { sword_attack_boost: 150, demon_damage_boost: 50 }, desc: '诛仙剑意', icon: '⚔️', elements: { metal: 1.0 } },

    // ===== 刀法（5种） =====
    { id: 'art_dao_basic', name: '基础刀法', type: 'secret_art', subtype: 'dao', category: 'secret_art', quality: 'COMMON', level: 1, price: 30, effect: { dao_attack_boost: 10 }, desc: '入门刀法', icon: '🔪', elements: { neutral: 1.0 } },
    { id: 'art_wind_dao', name: '破风刀法', type: 'secret_art', subtype: 'dao', category: 'secret_art', quality: 'UNCOMMON', level: 5, price: 300, effect: { dao_attack_boost: 25, speed_boost: 10 }, desc: '破风刀意', icon: '🔪', elements: { wood: 1.0 } },
    { id: 'art_water_dao', name: '断水刀法', type: 'secret_art', subtype: 'dao', category: 'secret_art', quality: 'UNCOMMON', level: 5, price: 350, effect: { dao_attack_boost: 25, strength_boost: 5 }, desc: '断水刀意', icon: '🔪', elements: { water: 1.0 } },
    { id: 'art_blood_dao', name: '血饮刀法', type: 'secret_art', subtype: 'dao', category: 'secret_art', quality: 'RARE', level: 10, price: 2000, effect: { dao_attack_boost: 50, lifesteal_boost: 15 }, desc: '血饮刀意', icon: '🔪', elements: { fire: 1.0 } },
    { id: 'art_dragon_slayer_dao', name: '屠龙刀法', type: 'secret_art', subtype: 'dao', category: 'secret_art', quality: 'EPIC', level: 20, price: 8000, effect: { dao_attack_boost: 80, dragon_damage_boost: 100 }, desc: '屠龙刀意', icon: '🔪', elements: { metal: 1.0 } },

    // ===== 拳掌/体术（6种） =====
    { id: 'art_fist_basic', name: '基础拳法', type: 'secret_art', subtype: 'fist', category: 'secret_art', quality: 'COMMON', level: 1, price: 30, effect: { fist_attack_boost: 10 }, desc: '入门拳法', icon: '👊', elements: { neutral: 1.0 } },
    { id: 'art_iron_fist', name: '铁拳功', type: 'secret_art', subtype: 'fist', category: 'secret_art', quality: 'UNCOMMON', level: 5, price: 300, effect: { fist_attack_boost: 25, strength_boost: 5 }, desc: '铁拳刚猛', icon: '👊', elements: { earth: 1.0 } },
    { id: 'art_soft_palm', name: '绵掌功', type: 'secret_art', subtype: 'fist', category: 'secret_art', quality: 'UNCOMMON', level: 5, price: 300, effect: { fist_attack_boost: 25, dexterity_boost: 5 }, desc: '绵掌以柔', icon: '👊', elements: { wood: 1.0 } },
    { id: 'art_diamond_palm', name: '金刚掌', type: 'secret_art', subtype: 'fist', category: 'secret_art', quality: 'RARE', level: 10, price: 1500, effect: { fist_attack_boost: 50, defense_boost: 20 }, desc: '金刚之力', icon: '👊', elements: { metal: 1.0 } },
    { id: 'art_dragon_subdue_palm', name: '降龙掌', type: 'secret_art', subtype: 'fist', category: 'secret_art', quality: 'EPIC', level: 18, price: 6000, effect: { fist_attack_boost: 80, dragon_damage_boost: 50 }, desc: '降龙之力', icon: '👊', elements: { earth: 1.0 } },
    { id: 'art_taixu_fist', name: '太虚拳', type: 'secret_art', subtype: 'fist', category: 'secret_art', quality: 'LEGENDARY', level: 28, price: 30000, effect: { fist_attack_boost: 120, void_damage_boost: 50 }, desc: '太虚拳意', icon: '👊', elements: { neutral: 1.0 } },

    // ===== 轻功身法（5种） =====
    { id: 'art_light_skill_basic', name: '基础轻功', type: 'secret_art', subtype: 'movement', category: 'secret_art', quality: 'COMMON', level: 1, price: 20, effect: { speed_boost: 10 }, desc: '入门轻功', icon: '💨', elements: { neutral: 1.0 } },
    { id: 'art_grass_fly', name: '草上飞', type: 'secret_art', subtype: 'movement', category: 'secret_art', quality: 'UNCOMMON', level: 5, price: 300, effect: { speed_boost: 30, dodge_boost: 10 }, desc: '草上飞掠', icon: '💨', elements: { wood: 1.0 } },
    { id: 'art_eight_step', name: '八步赶蟾', type: 'secret_art', subtype: 'movement', category: 'secret_art', quality: 'UNCOMMON', level: 5, price: 350, effect: { speed_boost: 35, dexterity_boost: 5 }, desc: '八步之能', icon: '💨', elements: { wood: 1.0 } },
    { id: 'art_lingbo', name: '凌波微步', type: 'secret_art', subtype: 'movement', category: 'secret_art', quality: 'RARE', level: 10, price: 2000, effect: { speed_boost: 50, dodge_boost: 25 }, desc: '凌波之妙', icon: '💨', elements: { water: 1.0 } },
    { id: 'art_divine_movement', name: '神行百变', type: 'secret_art', subtype: 'movement', category: 'secret_art', quality: 'EPIC', level: 16, price: 5000, effect: { speed_boost: 80, dodge_boost: 40 }, desc: '神行之变', icon: '💨', elements: { neutral: 1.0 } }
];