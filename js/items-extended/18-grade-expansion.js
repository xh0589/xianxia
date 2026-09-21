// ==================== 18-grade-expansion.js — 品级补阶与毕业装（v20.91） ====================
// 九品制改档后补齐三件事：
//   ① 六品/四品/二品三个新档位在各槽位铺货（旧档只占九八七五三一，新档全是空板）
//   ② 饰品线补厚：副手盾、项链、双戒、双饰品从低到高成完整阶梯
//   ③ 一品毕业线：30+ 级全身装备（盾/链/戒/佩/符/衣/冠/履/带/手）+ 两件一品兵器
// 自注册进物品库（13-missing-ids.js 同式），加载序在 items-extended.js 之后。
(function () {
    'use strict';

    function eq(o) { return Object.assign({ type: 'equipment', category: 'equipment', slot: 'body' }, o); }

    var newItems = [
        // ===== 九品垫底（颈位从零到有） =====
        eq({ id: 'arm_grass_necklace', name: '草编项饰', subtype: 'accessory', slot: 'neck', quality: 'PIN9', level: 1, price: 15, attrs: { willpower: 2 }, defense: 1, resistance: { pierce: 2, blunt: 3 }, armorDurability: 15, weight: 0.1, desc: '乡间孩子编的草项圈，戴着图个平安', icon: '🌾' }),

        // ===== 六品（中段补档） =====
        eq({ id: 'arm_cloud_shield', name: '云纹盾', subtype: 'shield', slot: 'offHand', quality: 'PIN6', level: 12, price: 900, attrs: { constitution: 9, strength: 5 }, defense: 22, combatBonus: { block: 8 }, resistance: { slash: 26, pierce: 22, blunt: 28 }, coverage: { armL: 0.55 }, armorDurability: 70, weight: 2.5, desc: '盾面錾云纹，卸力如拨云', icon: '🛡️' }),
        eq({ id: 'arm_agate_necklace', name: '玛瑙项链', subtype: 'accessory', slot: 'neck', quality: 'PIN6', level: 11, price: 800, attrs: { intelligence: 8, willpower: 5 }, defense: 6, combatBonus: { hit: 6 }, resistance: { pierce: 8, blunt: 10 }, armorDurability: 40, weight: 0.3, desc: '赤玛瑙串成的项链，安神定志', icon: '📿' }),
        eq({ id: 'arm_twin_fish_ring', name: '双鱼佩戒', subtype: 'accessory', slot: 'ring1', quality: 'PIN6', level: 10, price: 700, attrs: { dexterity: 7, intelligence: 5 }, defense: 3, combatBonus: { hit: 5 }, armorDurability: 40, weight: 0.1, desc: '戒面双鱼相逐，气机流转不息', icon: '💍' }),
        eq({ id: 'arm_bronze_bell', name: '铜铃佩', subtype: 'accessory', slot: 'acc1', quality: 'PIN6', level: 10, price: 650, attrs: { willpower: 7, intelligence: 4 }, defense: 4, combatBonus: { block: 4 }, armorDurability: 40, weight: 0.2, desc: '铃音一响，心神自定', icon: '🔔' }),
        eq({ id: 'arm_azure_robe', name: '青莲道袍', subtype: 'robe', slot: 'body', quality: 'PIN6', level: 14, price: 1100, attrs: { intelligence: 9, willpower: 8, constitution: 5 }, defense: 38, resistance: { slash: 40, pierce: 35, blunt: 32 }, coverage: { chest: 0.9, abdomen: 0.8, back: 0.75 }, armorDurability: 90, weight: 2, desc: '袍角绣青莲，行气时莲影微动', icon: '👘' }),
        eq({ id: 'arm_cloud_step_boots', name: '步云靴', subtype: 'boots', slot: 'feet', quality: 'PIN6', level: 12, price: 850, attrs: { dexterity: 9, constitution: 5 }, defense: 16, combatBonus: { dodge: 6 }, resistance: { slash: 18, pierce: 15, blunt: 20 }, coverage: { footL: 0.8, footR: 0.8 }, armorDurability: 60, weight: 1.2, desc: '靴底纳云纹，步履轻捷', icon: '👢' }),
        { id: 'pill_gather_yuan', name: '聚元丹', type: 'consumable', subtype: 'pill', category: 'consumable', quality: 'PIN6', level: 13, price: 700, effect: { qi_recovery: 220, energy_recovery: 90 }, stackable: true, maxStack: 20, useContext: ['world', 'battle'], desc: '六品聚元丹，一口气把散掉的真元拢回来', icon: '💊' },
        { id: 'mat_spirit_pattern_copper', name: '灵纹铜', type: 'material', subtype: 'metal', category: 'material', quality: 'PIN6', level: 10, price: 350, stackable: true, maxStack: 50, desc: '铜身自生灵纹，刻阵炼器两相宜的上好底料', icon: '🪙' },
        eq({ id: 'wpn_frost_sword', name: '青霜剑', subtype: 'sword', slot: 'mainHand', quality: 'PIN6', level: 13, price: 1200, attrs: { strength: 11, dexterity: 9, intelligence: 5 }, combatBonus: { attack: 42, crit: 7, hit: 5 }, damageType: 'slash', weight: 3, desc: '剑光如霜，出鞘三分别人衣', icon: '⚔️' }),

        // ===== 四品（中上段补档） =====
        eq({ id: 'arm_black_iron_shield', name: '玄铁重盾', subtype: 'shield', slot: 'offHand', quality: 'PIN4', level: 18, price: 2600, attrs: { constitution: 14, strength: 9 }, defense: 40, combatBonus: { block: 14 }, resistance: { slash: 42, pierce: 36, blunt: 45 }, coverage: { armL: 0.6 }, armorDurability: 120, weight: 5, desc: '整块玄铁锻成，立盾如立城', icon: '🛡️' }),
        eq({ id: 'arm_warm_jade_neck', name: '暖玉颈饰', subtype: 'accessory', slot: 'neck', quality: 'PIN4', level: 17, price: 2400, attrs: { intelligence: 11, willpower: 9, constitution: 5 }, defense: 9, combatBonus: { hit: 9 }, resistance: { pierce: 12, blunt: 14 }, armorDurability: 60, weight: 0.3, desc: '暖玉生温，贴身常年不凉', icon: '📿' }),
        eq({ id: 'arm_star_ring', name: '星辰戒', subtype: 'accessory', slot: 'ring2', quality: 'PIN4', level: 18, price: 2800, attrs: { intelligence: 12, willpower: 9 }, defense: 6, combatBonus: { attack: 9, crit: 5 }, armorDurability: 60, weight: 0.2, desc: '戒面一点星光，夜里自己会亮', icon: '💍' }),
        eq({ id: 'arm_sword_ring', name: '剑鸣戒', subtype: 'accessory', slot: 'ring1', quality: 'PIN4', level: 16, price: 2200, attrs: { strength: 11, dexterity: 9 }, defense: 5, combatBonus: { attack: 10, hit: 6 }, armorDurability: 60, weight: 0.2, desc: '近剑则鸣，剑意相和', icon: '💍' }),
        eq({ id: 'arm_bodhi_pendant', name: '菩提子佩', subtype: 'accessory', slot: 'acc1', quality: 'PIN4', level: 16, price: 2000, attrs: { willpower: 12, intelligence: 8 }, defense: 7, combatBonus: { block: 7 }, armorDurability: 60, weight: 0.2, desc: '百年菩提子盘成的佩，心躁时握一握就静了', icon: '🪬' }),
        eq({ id: 'arm_talisman_pouch', name: '云纹符袋', subtype: 'accessory', slot: 'acc2', quality: 'PIN4', level: 17, price: 2300, attrs: { intelligence: 10, willpower: 8 }, defense: 6, combatBonus: { hit: 8, crit: 5 }, armorDurability: 50, weight: 0.2, desc: '袋上云纹自成一道护身符', icon: '👝' }),
        eq({ id: 'arm_golden_silk', name: '金缕软甲', subtype: 'armor', slot: 'body', quality: 'PIN4', level: 20, price: 3200, attrs: { constitution: 14, strength: 10, dexterity: 6 }, defense: 55, resistance: { slash: 55, pierce: 48, blunt: 42 }, coverage: { chest: 0.92, abdomen: 0.85, back: 0.8 }, armorDurability: 130, weight: 5, desc: '金缕密织，刀剑加身只留白痕', icon: '🥋' }),
        eq({ id: 'arm_cloud_walk_boots', name: '凌虚靴', subtype: 'boots', slot: 'feet', quality: 'PIN4', level: 18, price: 2600, attrs: { dexterity: 14, constitution: 8 }, defense: 26, combatBonus: { dodge: 10 }, resistance: { slash: 28, pierce: 24, blunt: 30 }, coverage: { footL: 0.85, footR: 0.85 }, armorDurability: 90, weight: 1.5, desc: '踏虚而行，落地无声', icon: '👢' }),
        { id: 'pill_jade_marrow', name: '玉髓丹', type: 'consumable', subtype: 'pill', category: 'consumable', quality: 'PIN4', level: 18, price: 2200, effect: { hp_recovery: 400, qi_recovery: 150 }, stackable: true, maxStack: 20, useContext: ['world', 'battle'], desc: '四品玉髓丹，重伤之人服下能自己走回城', icon: '💊' },
        { id: 'mat_meteor_essence', name: '陨铁精', type: 'material', subtype: 'metal', category: 'material', quality: 'PIN4', level: 16, price: 1500, stackable: true, maxStack: 30, desc: '陨铁之心，一炉只出得指甲大一块', icon: '🪨' },
        eq({ id: 'wpn_crimson_dao', name: '赤炎刀', subtype: 'dao', slot: 'mainHand', quality: 'PIN4', level: 19, price: 3000, attrs: { strength: 16, constitution: 10 }, combatBonus: { attack: 78, crit: 11 }, damageType: 'fire', weight: 4.5, desc: '刀身常燃不灭火，劈风风断', icon: '🔥' }),

        // ===== 二品（高端补档） =====
        eq({ id: 'arm_tortoise_shield', name: '灵龟盾', subtype: 'shield', slot: 'offHand', quality: 'PIN2', level: 26, price: 8000, attrs: { constitution: 20, willpower: 12 }, defense: 62, combatBonus: { block: 22 }, resistance: { slash: 62, pierce: 55, blunt: 68 }, coverage: { armL: 0.65 }, armorDurability: 180, weight: 6, desc: '灵龟甲所化，盾在人在', icon: '🛡️' }),
        eq({ id: 'arm_jiao_necklace', name: '蛟鳞项链', subtype: 'accessory', slot: 'neck', quality: 'PIN2', level: 27, price: 8500, attrs: { strength: 12, dexterity: 12, constitution: 12 }, defense: 14, combatBonus: { attack: 12, hit: 10 }, resistance: { slash: 18, pierce: 22, blunt: 16 }, armorDurability: 90, weight: 0.4, desc: '蛟鳞片片串成，犹带水汽', icon: '📿' }),
        eq({ id: 'arm_moon_ring', name: '月轮戒', subtype: 'accessory', slot: 'ring2', quality: 'PIN2', level: 28, price: 9000, attrs: { intelligence: 16, willpower: 14 }, defense: 10, combatBonus: { attack: 14, crit: 8 }, armorDurability: 90, weight: 0.2, desc: '一轮满月落在指上，圆缺随心', icon: '💍' }),
        eq({ id: 'arm_soul_jade', name: '定魂玉佩', subtype: 'accessory', slot: 'acc1', quality: 'PIN2', level: 26, price: 7500, attrs: { willpower: 18, intelligence: 12 }, defense: 12, combatBonus: { block: 12 }, armorDurability: 90, weight: 0.3, desc: '魂动摇之际，佩上一线清凉直贯眉心', icon: '🧿' }),
        eq({ id: 'arm_cloud_charm', name: '云篆护符', subtype: 'accessory', slot: 'acc2', quality: 'PIN2', level: 27, price: 8000, attrs: { intelligence: 14, willpower: 14 }, defense: 11, combatBonus: { hit: 12, crit: 7 }, armorDurability: 80, weight: 0.2, desc: '云篆天成的一笔护身符，邪祟近身三尺自退', icon: '🪬' }),
        eq({ id: 'arm_purple_robe', name: '紫霄道袍', subtype: 'robe', slot: 'body', quality: 'PIN2', level: 28, price: 10000, attrs: { intelligence: 18, willpower: 16, constitution: 10 }, defense: 85, resistance: { slash: 72, pierce: 65, blunt: 60 }, coverage: { chest: 0.95, abdomen: 0.9, back: 0.85 }, armorDurability: 160, weight: 2.5, desc: '紫霄之气织入经纬，法出袍动', icon: '👘' }),
        { id: 'pill_purple_vault', name: '紫霄丹', type: 'consumable', subtype: 'pill', category: 'consumable', quality: 'PIN2', level: 26, price: 9000, effect: { hp_recovery: 800, qi_recovery: 400, energy_recovery: 200 }, stackable: true, maxStack: 10, useContext: ['world', 'battle'], desc: '二品紫霄丹，吊住最后一口气再拉回来', icon: '💊' },
        { id: 'mat_chaos_marrow', name: '混沌石髓', type: 'material', subtype: 'stone', category: 'material', quality: 'PIN2', level: 26, price: 6000, stackable: true, maxStack: 10, desc: '混沌未分时的石髓，炼器师见之先拜三拜', icon: '🔮' },

        // ===== 一品毕业线（30+ 级全身） =====
        eq({ id: 'arm_pangu_shield', name: '开天盾', subtype: 'shield', slot: 'offHand', quality: 'PIN1', level: 34, price: 30000, attrs: { constitution: 28, strength: 18, willpower: 12 }, defense: 95, combatBonus: { block: 32 }, resistance: { slash: 82, pierce: 75, blunt: 88 }, coverage: { armL: 0.7 }, armorDurability: 260, weight: 7, desc: '传说开天辟地时碎落的一片，立起来就是一堵天', icon: '🛡️' }),
        eq({ id: 'arm_starry_necklace', name: '星河颈链', subtype: 'accessory', slot: 'neck', quality: 'PIN1', level: 33, price: 28000, attrs: { strength: 16, dexterity: 16, intelligence: 16, willpower: 16 }, defense: 20, combatBonus: { attack: 16, hit: 14 }, resistance: { slash: 24, pierce: 28, blunt: 22 }, armorDurability: 120, weight: 0.4, desc: '一串星河绕颈，夜里看得见星子在走', icon: '📿' }),
        eq({ id: 'arm_heaven_ring', name: '问天戒', subtype: 'accessory', slot: 'ring1', quality: 'PIN1', level: 33, price: 28000, attrs: { strength: 18, dexterity: 16, intelligence: 12 }, defense: 16, combatBonus: { attack: 20, crit: 12 }, armorDurability: 120, weight: 0.2, desc: '举手指天，天要让你三分', icon: '💍' }),
        eq({ id: 'arm_dao_ring', name: '合道戒', subtype: 'accessory', slot: 'ring2', quality: 'PIN1', level: 34, price: 32000, attrs: { intelligence: 20, willpower: 20 }, defense: 18, combatBonus: { attack: 18, hit: 16 }, armorDurability: 120, weight: 0.2, desc: '戒中自有一线道韵，与天地呼吸同拍', icon: '💍' }),
        eq({ id: 'arm_primordial_pendant', name: '鸿蒙玉佩', subtype: 'accessory', slot: 'acc1', quality: 'PIN1', level: 33, price: 26000, attrs: { willpower: 22, constitution: 16, intelligence: 14 }, defense: 22, combatBonus: { block: 20 }, armorDurability: 120, weight: 0.3, desc: '鸿蒙未判时的一块玉，握着它心湖不起风', icon: '🧿' }),
        eq({ id: 'arm_immortal_seal', name: '太上仙印', subtype: 'accessory', slot: 'acc2', quality: 'PIN1', level: 34, price: 27000, attrs: { intelligence: 20, willpower: 18 }, defense: 20, combatBonus: { hit: 18, crit: 10 }, armorDurability: 110, weight: 0.3, desc: '印文古篆「太上」二字，万法过印不侵', icon: '🪬' }),
        eq({ id: 'arm_nine_turn_robe', name: '九转仙衣', subtype: 'robe', slot: 'body', quality: 'PIN1', level: 34, price: 45000, attrs: { strength: 18, dexterity: 18, intelligence: 20, willpower: 20, constitution: 18 }, defense: 120, resistance: { slash: 90, pierce: 85, blunt: 80 }, coverage: { chest: 0.98, abdomen: 0.95, back: 0.9 }, armorDurability: 240, weight: 2, desc: '九转灵蚕丝织成，穿上它的人都成了传说', icon: '👘' }),
        eq({ id: 'arm_heaven_crown', name: '凌霄冠', subtype: 'crown', slot: 'head', quality: 'PIN1', level: 33, price: 30000, attrs: { intelligence: 20, willpower: 18, constitution: 12 }, defense: 70, resistance: { slash: 60, pierce: 55, blunt: 65 }, coverage: { head: 0.85, brain: 0.6 }, armorDurability: 160, weight: 1.5, desc: '冠上凌霄纹，戴冠之人自生威仪', icon: '👑' }),
        eq({ id: 'arm_cloud_shoes', name: '步霄履', subtype: 'boots', slot: 'feet', quality: 'PIN1', level: 32, price: 24000, attrs: { dexterity: 22, constitution: 14 }, defense: 55, combatBonus: { dodge: 18 }, resistance: { slash: 45, pierce: 40, blunt: 48 }, coverage: { footL: 0.9, footR: 0.9 }, armorDurability: 140, weight: 1.2, desc: '一步一霄，缩地成寸', icon: '👢' }),
        eq({ id: 'arm_xuan_belt', name: '玄玉带', subtype: 'belt', slot: 'waist', quality: 'PIN1', level: 32, price: 22000, attrs: { constitution: 18, strength: 14, willpower: 12 }, defense: 50, resistance: { slash: 42, pierce: 38, blunt: 45 }, coverage: { waist: 0.9, abdomen: 0.5 }, armorDurability: 140, weight: 1, desc: '玄玉为扣，束住一身气机不外泄', icon: '🥋' }),
        eq({ id: 'arm_jiao_gauntlets', name: '蛟鳞手笼', subtype: 'gloves', slot: 'hands', quality: 'PIN1', level: 32, price: 25000, attrs: { strength: 20, dexterity: 16 }, defense: 52, combatBonus: { attack: 14, block: 12 }, resistance: { slash: 48, pierce: 44, blunt: 40 }, coverage: { handL: 0.9, handR: 0.9 }, armorDurability: 140, weight: 1.2, desc: '蛟鳞覆手，空手也能接白刃', icon: '🧤' }),
        eq({ id: 'wpn_heaven_ask', name: '问天剑', subtype: 'sword', slot: 'mainHand', quality: 'PIN1', level: 34, price: 48000, attrs: { strength: 26, dexterity: 22, intelligence: 18 }, combatBonus: { attack: 215, crit: 18, hit: 12 }, damageType: 'slash', weight: 4, desc: '剑出如问天，天不敢答', icon: '⚔️' }),
        eq({ id: 'wpn_nirvana_staff', name: '涅槃杖', subtype: 'staff', slot: 'mainHand', quality: 'PIN1', level: 33, price: 42000, attrs: { intelligence: 28, willpower: 22, constitution: 16 }, combatBonus: { attack: 185, hit: 16, crit: 10 }, damageType: 'blunt', weight: 4, desc: '死地逢生的一杖，杖头焰色如涅槃火', icon: '🪄' }),

        // ===== 饰品线第二波：把每个槽位的品级梯补密 =====
        eq({ id: 'arm_xuanwu_shield', name: '玄武盾', subtype: 'shield', slot: 'offHand', quality: 'PIN5', level: 15, price: 1600, attrs: { constitution: 12, willpower: 7 }, defense: 30, combatBonus: { block: 11 }, resistance: { slash: 34, pierce: 30, blunt: 38 }, coverage: { armL: 0.55 }, armorDurability: 90, weight: 3.5, desc: '玄武纹镇盾面，稳如山岳', icon: '🛡️' }),
        eq({ id: 'arm_bagua_shield', name: '八卦护盾', subtype: 'shield', slot: 'offHand', quality: 'PIN3', level: 22, price: 5200, attrs: { constitution: 16, intelligence: 12, willpower: 10 }, defense: 50, combatBonus: { block: 18 }, resistance: { slash: 52, pierce: 46, blunt: 56 }, coverage: { armL: 0.6 }, armorDurability: 150, weight: 4, desc: '八卦方位流转，来力被牵着卸进空处', icon: '🛡️' }),
        eq({ id: 'arm_nine_bead_necklace', name: '九珠连环链', subtype: 'accessory', slot: 'neck', quality: 'PIN3', level: 22, price: 5000, attrs: { intelligence: 14, willpower: 12, constitution: 8 }, defense: 12, combatBonus: { hit: 12, qi_regen: 3 }, resistance: { pierce: 16, blunt: 18 }, armorDurability: 80, weight: 0.3, desc: '九颗灵珠环环相扣，缺一颗都不成链', icon: '📿' }),
        eq({ id: 'arm_silver_ring', name: '素银戒', subtype: 'accessory', slot: 'ring1', quality: 'PIN8', level: 3, price: 90, attrs: { dexterity: 4, intelligence: 2 }, defense: 2, combatBonus: { hit: 3 }, armorDurability: 25, weight: 0.1, desc: '素面银戒，入门弟子的第一件饰物', icon: '💍' }),
        eq({ id: 'arm_jade_ring', name: '碧玉戒', subtype: 'accessory', slot: 'ring1', quality: 'PIN5', level: 12, price: 1300, attrs: { intelligence: 10, willpower: 7 }, defense: 4, combatBonus: { attack: 7, qi_regen: 2 }, armorDurability: 50, weight: 0.1, desc: '碧玉养人，戴久了戒身温润生光', icon: '💍' }),
        eq({ id: 'arm_qilin_ring', name: '麒麟戒', subtype: 'accessory', slot: 'ring1', quality: 'PIN2', level: 26, price: 8800, attrs: { strength: 15, dexterity: 13, constitution: 10 }, defense: 13, combatBonus: { attack: 18, crit: 9 }, armorDurability: 90, weight: 0.2, desc: '麒麟伏于戒面，仁兽认主，逢凶先鸣', icon: '💍' }),
        eq({ id: 'arm_sandalwood_piece', name: '檀木手件', subtype: 'accessory', slot: 'acc1', quality: 'PIN7', level: 7, price: 380, attrs: { willpower: 8, intelligence: 4 }, defense: 4, combatBonus: { block: 4 }, armorDurability: 35, weight: 0.2, desc: '老檀木随手件，盘得越久香气越沉', icon: '🪵' }),
        eq({ id: 'arm_jade_belt_pendant', name: '佩玉腰坠', subtype: 'accessory', slot: 'acc1', quality: 'PIN5', level: 13, price: 1400, attrs: { constitution: 9, willpower: 7 }, defense: 6, combatBonus: { block: 6, hp_regen: 2 }, armorDurability: 50, weight: 0.2, desc: '君子无故，玉不去身', icon: '🧿' }),
        eq({ id: 'arm_soul_banner', name: '守魂幡坠', subtype: 'accessory', slot: 'acc2', quality: 'PIN3', level: 18, price: 3600, attrs: { willpower: 14, intelligence: 10 }, defense: 9, combatBonus: { block: 10, qi_regen: 3 }, armorDurability: 60, weight: 0.2, desc: '巴掌大的引魂幡改成了坠子——幡引魂，坠守魂', icon: '🎏' })
    ];

    // 自注册（13-missing-ids 同式：已有定义不覆盖）
    if (!window.itemById) window.itemById = {};
    if (!window.allItems) window.allItems = [];
    newItems.forEach(function (item) {
        if (!item || !item.id || window.itemById[item.id]) return;
        window.itemById[item.id] = item;
        window.allItems.push(item);
    });
    // 同步分类数组（武器/防具货架与图鉴读这两本账）
    newItems.forEach(function (item) {
        if (item.type !== 'equipment') return;
        var isWpn = item.slot === 'mainHand';
        if (isWpn && window.weapons) window.weapons.push(item);
        else if (!isWpn && window.armor) window.armor.push(item);
    });
    window.extendedGradeExpansion = newItems;
    console.log('[grade-expansion] v20.91 品级补阶与毕业装已注册：' + newItems.length + ' 种');
})();
