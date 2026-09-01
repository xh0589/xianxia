// ==================== 扩展物品 - 材料类（50种） ====================
// 加载到 window.extendedMaterials

window.extendedMaterials = [
    // ===== 矿石/金属（14种） =====
    { id: 'mat_iron_ore', name: '铁矿', type: 'material', subtype: 'metal', category: 'material', quality: 'COMMON', level: 1, price: 5, stackable: true, maxStack: 999, desc: '普通铁矿石', icon: '🪨' },
    { id: 'mat_copper_ore', name: '铜矿', type: 'material', subtype: 'metal', category: 'material', quality: 'COMMON', level: 1, price: 8, stackable: true, maxStack: 999, desc: '铜矿石', icon: '🪨' },
    { id: 'mat_tin_ore', name: '锡矿', type: 'material', subtype: 'metal', category: 'material', quality: 'COMMON', level: 1, price: 6, stackable: true, maxStack: 999, desc: '锡矿石', icon: '🪨' },
    { id: 'mat_refined_iron', name: '精铁', type: 'material', subtype: 'metal', category: 'material', quality: 'UNCOMMON', level: 3, price: 20, stackable: true, maxStack: 999, desc: '精炼铁', icon: '🪨' },
    { id: 'mat_dark_iron', name: '玄铁', type: 'material', subtype: 'metal', category: 'material', quality: 'UNCOMMON', level: 4, price: 50, stackable: true, maxStack: 500, desc: '玄铁矿石', icon: '🪨' },
    { id: 'mat_refined_copper', name: '精铜', type: 'material', subtype: 'metal', category: 'material', quality: 'UNCOMMON', level: 3, price: 30, stackable: true, maxStack: 999, desc: '精炼铜', icon: '🪨' },
    { id: 'mat_mithril', name: '秘银', type: 'material', subtype: 'metal', category: 'material', quality: 'RARE', level: 8, price: 200, stackable: true, maxStack: 200, desc: '稀有秘银', icon: '🪨' },
    { id: 'mat_meteorite', name: '陨铁', type: 'material', subtype: 'metal', category: 'material', quality: 'RARE', level: 10, price: 300, stackable: true, maxStack: 100, desc: '天外陨铁', icon: '🪨' },
    { id: 'mat_cold_iron', name: '寒铁', type: 'material', subtype: 'metal', category: 'material', quality: 'RARE', level: 9, price: 250, stackable: true, maxStack: 200, desc: '极寒玄铁', icon: '🪨' },
    { id: 'mat_fire_crystal', name: '火晶', type: 'material', subtype: 'metal', category: 'material', quality: 'RARE', level: 9, price: 250, stackable: true, maxStack: 200, desc: '火山晶石', icon: '🪨' },
    { id: 'mat_purple_gold', name: '紫金', type: 'material', subtype: 'metal', category: 'material', quality: 'EPIC', level: 15, price: 800, stackable: true, maxStack: 100, desc: '紫金矿石', icon: '🪨' },
    { id: 'mat_dragon_scale_iron', name: '龙鳞铁', type: 'material', subtype: 'metal', category: 'material', quality: 'EPIC', level: 18, price: 1000, stackable: true, maxStack: 50, desc: '龙血淬炼', icon: '🪨' },
    { id: 'mat_sky_iron', name: '天外玄铁', type: 'material', subtype: 'metal', category: 'material', quality: 'LEGENDARY', level: 25, price: 3000, stackable: true, maxStack: 20, desc: '天外陨石', icon: '🪨' },
    { id: 'mat_star_iron', name: '星辰铁', type: 'material', subtype: 'metal', category: 'material', quality: 'LEGENDARY', level: 30, price: 5000, stackable: true, maxStack: 10, desc: '星辰陨铁', icon: '🪨' },

    // ===== 草药/灵植（14种） =====
    { id: 'mat_liquorice', name: '甘草', type: 'material', subtype: 'herb', category: 'material', quality: 'COMMON', level: 1, price: 3, stackable: true, maxStack: 999, desc: '普通草药', icon: '🌿' },
    { id: 'mat_scutellaria', name: '黄芩', type: 'material', subtype: 'herb', category: 'material', quality: 'COMMON', level: 1, price: 4, stackable: true, maxStack: 999, desc: '常见草药', icon: '🌿' },
    { id: 'mat_lingzhi', name: '灵芝', type: 'material', subtype: 'herb', category: 'material', quality: 'UNCOMMON', level: 3, price: 30, stackable: true, maxStack: 500, desc: '灵芝仙草', icon: '🌿' },
    { id: 'mat_ginseng', name: '人参', type: 'material', subtype: 'herb', category: 'material', quality: 'UNCOMMON', level: 4, price: 50, stackable: true, maxStack: 300, desc: '人参灵药', icon: '🌿' },
    { id: 'mat_snow_lotus', name: '雪莲', type: 'material', subtype: 'herb', category: 'material', quality: 'UNCOMMON', level: 3, price: 40, stackable: true, maxStack: 300, desc: '天山雪莲', icon: '🌿' },
    { id: 'mat_he_shou_wu', name: '何首乌', type: 'material', subtype: 'herb', category: 'material', quality: 'UNCOMMON', level: 3, price: 35, stackable: true, maxStack: 300, desc: '首乌灵药', icon: '🌿' },
    { id: 'mat_thousand_lingzhi', name: '千年灵芝', type: 'material', subtype: 'herb', category: 'material', quality: 'RARE', level: 8, price: 300, stackable: true, maxStack: 100, desc: '千年灵芝', icon: '🌿' },
    { id: 'mat_ten_thousand_ginseng', name: '万年人参', type: 'material', subtype: 'herb', category: 'material', quality: 'RARE', level: 10, price: 400, stackable: true, maxStack: 50, desc: '万年人参', icon: '🌿' },
    { id: 'mat_dragon_saliva', name: '龙涎草', type: 'material', subtype: 'herb', category: 'material', quality: 'RARE', level: 8, price: 250, stackable: true, maxStack: 100, desc: '龙涎滋养', icon: '🌿' },
    { id: 'mat_phoenix_blood_grass', name: '凤血草', type: 'material', subtype: 'herb', category: 'material', quality: 'RARE', level: 8, price: 250, stackable: true, maxStack: 100, desc: '凤血滋养', icon: '🌿' },
    { id: 'mat_heaven_heart_flower', name: '天心花', type: 'material', subtype: 'herb', category: 'material', quality: 'EPIC', level: 15, price: 800, stackable: true, maxStack: 30, desc: '天心之花', icon: '🌿' },
    { id: 'mat_earth_spirit_root', name: '地灵根', type: 'material', subtype: 'herb', category: 'material', quality: 'EPIC', level: 14, price: 600, stackable: true, maxStack: 30, desc: '地灵之根', icon: '🌿' },
    { id: 'mat_nine_leaf_lingzhi', name: '九叶灵芝', type: 'material', subtype: 'herb', category: 'material', quality: 'LEGENDARY', level: 25, price: 3000, stackable: true, maxStack: 10, desc: '九叶仙芝', icon: '🌿' },
    { id: 'mat_peach_fruit', name: '蟠桃果', type: 'material', subtype: 'herb', category: 'material', quality: 'LEGENDARY', level: 30, price: 5000, stackable: true, maxStack: 5, desc: '蟠桃圣果', icon: '🍑' },

    // ===== 兽类材料（15种） =====
    { id: 'mat_beast_skin', name: '兽皮', type: 'material', subtype: 'beast', category: 'material', quality: 'COMMON', level: 1, price: 5, stackable: true, maxStack: 999, desc: '普通兽皮', icon: '🦴' },
    { id: 'mat_beast_bone', name: '兽骨', type: 'material', subtype: 'beast', category: 'material', quality: 'COMMON', level: 1, price: 3, stackable: true, maxStack: 999, desc: '普通兽骨', icon: '🦴' },
    { id: 'mat_beast_fang', name: '兽牙', type: 'material', subtype: 'beast', category: 'material', quality: 'COMMON', level: 1, price: 8, stackable: true, maxStack: 999, desc: '野兽獠牙', icon: '🦴' },
    { id: 'mat_demon_beast_skin', name: '妖兽皮', type: 'material', subtype: 'beast', category: 'material', quality: 'UNCOMMON', level: 4, price: 40, stackable: true, maxStack: 300, desc: '妖兽之皮', icon: '🦴' },
    { id: 'mat_demon_beast_bone', name: '妖兽骨', type: 'material', subtype: 'beast', category: 'material', quality: 'UNCOMMON', level: 4, price: 30, stackable: true, maxStack: 300, desc: '妖兽之骨', icon: '🦴' },
    { id: 'mat_demon_beast_fang', name: '妖兽牙', type: 'material', subtype: 'beast', category: 'material', quality: 'UNCOMMON', level: 4, price: 50, stackable: true, maxStack: 300, desc: '妖兽獠牙', icon: '🦴' },
    { id: 'mat_demon_beast_core', name: '妖兽内丹', type: 'material', subtype: 'beast', category: 'material', quality: 'UNCOMMON', level: 5, price: 100, stackable: true, maxStack: 200, desc: '妖兽精华', icon: '🦴' },
    { id: 'mat_thousand_beast_skin', name: '千年兽皮', type: 'material', subtype: 'beast', category: 'material', quality: 'RARE', level: 9, price: 300, stackable: true, maxStack: 100, desc: '千年妖兽皮', icon: '🦴' },
    { id: 'mat_dragon_scale', name: '龙鳞', type: 'material', subtype: 'beast', category: 'material', quality: 'RARE', level: 10, price: 500, stackable: true, maxStack: 100, desc: '龙之鳞片', icon: '🦴' },
    { id: 'mat_phoenix_feather', name: '凤羽', type: 'material', subtype: 'beast', category: 'material', quality: 'RARE', level: 10, price: 500, stackable: true, maxStack: 100, desc: '凤凰羽毛', icon: '🪶' },
    { id: 'mat_dragon_bone', name: '龙骨', type: 'material', subtype: 'beast', category: 'material', quality: 'EPIC', level: 16, price: 1000, stackable: true, maxStack: 50, desc: '龙之骨骼', icon: '🦴' },
    { id: 'mat_dragon_blood', name: '龙血', type: 'material', subtype: 'beast', category: 'material', quality: 'EPIC', level: 18, price: 1500, stackable: true, maxStack: 30, desc: '龙之精血', icon: '🩸' },
    { id: 'mat_phoenix_blood', name: '凤凰血', type: 'material', subtype: 'beast', category: 'material', quality: 'EPIC', level: 18, price: 1500, stackable: true, maxStack: 30, desc: '凤凰精血', icon: '🩸' },
    { id: 'mat_qilin_horn', name: '麒麟角', type: 'material', subtype: 'beast', category: 'material', quality: 'LEGENDARY', level: 28, price: 8000, stackable: true, maxStack: 5, desc: '麒麟之角', icon: '🦴' },
    { id: 'mat_dragon_crystal', name: '龙晶', type: 'material', subtype: 'beast', category: 'material', quality: 'LEGENDARY', level: 30, price: 10000, stackable: true, maxStack: 5, desc: '龙之结晶', icon: '💎' },

    // ===== 特殊材料（8种） =====
    { id: 'mat_five_element_essence', name: '五行精华', type: 'material', subtype: 'essence', category: 'material', quality: 'RARE', level: 8, price: 200, stackable: true, maxStack: 200, desc: '五行之力', icon: '✨' },
    { id: 'mat_yin_yang_stone', name: '阴阳石', type: 'material', subtype: 'essence', category: 'material', quality: 'RARE', level: 9, price: 300, stackable: true, maxStack: 100, desc: '阴阳之力', icon: '✨' },
    { id: 'mat_star_sand', name: '星辰砂', type: 'material', subtype: 'essence', category: 'material', quality: 'EPIC', level: 14, price: 600, stackable: true, maxStack: 50, desc: '星辰之砂', icon: '✨' },
    { id: 'mat_moon_stone', name: '月光石', type: 'material', subtype: 'essence', category: 'material', quality: 'EPIC', level: 15, price: 800, stackable: true, maxStack: 30, desc: '月光精华', icon: '💎' },
    { id: 'mat_sun_stone', name: '太阳石', type: 'material', subtype: 'essence', category: 'material', quality: 'EPIC', level: 15, price: 800, stackable: true, maxStack: 30, desc: '太阳精华', icon: '💎' },
    { id: 'mat_chaos_stone', name: '混沌石', type: 'material', subtype: 'essence', category: 'material', quality: 'LEGENDARY', level: 25, price: 5000, stackable: true, maxStack: 10, desc: '混沌之力', icon: '💎' },
    { id: 'mat_space_crystal', name: '时空晶', type: 'material', subtype: 'essence', category: 'material', quality: 'LEGENDARY', level: 30, price: 8000, stackable: true, maxStack: 5, desc: '时空之力', icon: '💎' },
    { id: 'mat_spirit_source', name: '灵源石', type: 'material', subtype: 'essence', category: 'material', quality: 'LEGENDARY', level: 22, price: 3000, stackable: true, maxStack: 20, desc: '灵力源泉', icon: '💎' }
];