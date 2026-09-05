/**
 * 13-missing-ids.js — B2 补齐审查报告中缺失的物品 ID
 * 加载后合并进 window.extendedMaterials / food / special / arts / weapons，
 * 并由 items-extended.js 或本文件直接写入 itemById。
 */
(function () {
    'use strict';

    function mat(id, name, price, icon, desc) {
        return {
            id: id,
            name: name,
            type: 'material',
            subtype: 'misc',
            category: 'material',
            quality: 'COMMON',
            level: 1,
            price: price || 10,
            stackable: true,
            maxStack: 999,
            desc: desc || name,
            icon: icon || '🌿'
        };
    }

    var missingMaterials = [
        mat('mat_bamboo', '竹子', 5, '🎋', '普通竹子'),
        mat('mat_bamboo_essence', '竹精', 80, '🎋', '百年竹精'),
        mat('mat_cactus_flower', '仙人掌花', 25, '🌵', '沙漠奇花'),
        mat('mat_coral', '珊瑚', 40, '🪸', '海底珊瑚'),
        mat('mat_demon_beast_blood', '妖兽精血', 60, '🩸', '妖兽之血'),
        mat('mat_desert_ginseng', '沙参', 35, '🌿', '沙漠人参'),
        mat('mat_dragon_grass', '龙草', 120, '🌿', '龙气滋养之草'),
        mat('mat_fire_essence', '火之精华', 150, '🔥', '纯净火灵'),
        mat('mat_gold_sand', '金砂', 20, '✨', '含金细砂'),
        mat('mat_green_wood_essence', '青木精华', 150, '🌳', '纯净木灵'),
        mat('mat_ice_herb', '寒冰草', 45, '❄️', '极寒灵草'),
        mat('mat_pearl', '珍珠', 50, '🤍', '海珠'),
        mat('mat_spirit_grass', '灵草', 15, '🌱', '洞府常见灵草'),
        mat('mat_spirit_spring', '灵泉露', 100, '💧', '灵泉之水凝露'),
        mat('mat_shihun_scroll', '禁术·噬魂残卷', 0, '📜', '黑市流出的禁术残篇。禁物无市价——正经商号不敢收，见了它的人都绕着走。'),
        mat('mat_spirit_wood', '灵木', 30, '🪵', '含灵木材'),
        mat('mat_salt_charter', '官盐引', 100, '🧂', '盐铁局官让盐引：官价领引、凭引行盐。贵地盐价高，引子也水涨船高——行商的利从盐路上来。'),
        mat('mat_volcanic_rock', '火山岩', 25, '🪨', '火山岩块'),
        mat('mat_wind_essence', '风之精华', 150, '💨', '纯净风灵'),
        mat('mat_wood', '木材', 3, '🪵', '普通木材')
    ];

    var missingFood = [
        {
            id: 'food_flower_wine',
            name: '花酿酒',
            type: 'consumable',
            subtype: 'food',
            category: 'consumable',
            quality: 'UNCOMMON',
            level: 3,
            price: 40,
            stackable: true,
            maxStack: 50,
            effect: { energy_recovery: 20, mood_boost: 5 },
            desc: '花香清酒',
            icon: '🍷'
        },
        {
            id: 'food_roasted_meat',
            name: '烤肉',
            type: 'consumable',
            subtype: 'food',
            category: 'consumable',
            quality: 'COMMON',
            level: 1,
            price: 15,
            stackable: true,
            maxStack: 99,
            effect: { hp_recovery: 25, energy_recovery: 10 },
            desc: '香喷喷的烤肉',
            icon: '🍖'
        }
    ];

    // 突破丹已迁移到 01-pills.js 的 extendedBreakthroughPills 中，此处不再重复注册
    var missingPills = [];

    var missingSpecial = [
        {
            id: 'spec_immortal_token',
            name: '仙令',
            type: 'quest',
            subtype: 'token',
            category: 'quest',
            quality: 'EPIC',
            level: 15,
            price: 0,
            stackable: true,
            maxStack: 5,
            desc: '仙门通行令',
            icon: '📜'
        },
        {
            id: 'special_explosive',
            name: '爆裂符',
            type: 'consumable',
            subtype: 'trap',
            category: 'consumable',
            quality: 'UNCOMMON',
            level: 4,
            price: 80,
            stackable: true,
            maxStack: 30,
            desc: '战斗用爆裂符箓',
            icon: '💥'
        },
        {
            id: 'special_hidden_weapon',
            name: '暗器',
            type: 'consumable',
            subtype: 'trap',
            category: 'consumable',
            quality: 'UNCOMMON',
            level: 3,
            price: 50,
            stackable: true,
            maxStack: 50,
            desc: '袖中暗器',
            icon: '🗡️'
        },
        {
            id: 'special_mechanism',
            name: '机关件',
            type: 'material',
            subtype: 'mechanism',
            category: 'material',
            quality: 'UNCOMMON',
            level: 5,
            price: 60,
            stackable: true,
            maxStack: 99,
            desc: '机关术零件',
            icon: '⚙️'
        },
        {
            id: 'special_poison',
            name: '毒药',
            type: 'consumable',
            subtype: 'poison',
            category: 'consumable',
            quality: 'UNCOMMON',
            level: 4,
            price: 70,
            stackable: true,
            maxStack: 30,
            desc: '涂刃之毒',
            icon: '☠️'
        }
    ];

    var missingArts = [
        {
            id: 'art_chaos_art',
            name: '混沌心法',
            type: 'secret_art',
            subtype: 'internal',
            category: 'secret_art',
            quality: 'LEGENDARY',
            level: 20,
            price: 0,
            stackable: false,
            desc: '混沌一气，包罗万象',
            icon: '📖'
        }
    ];

    var missingWeapons = [
        {
            id: 'wpn_feng_sword',
            name: '风灵剑',
            type: 'weapon',
            subtype: 'sword',
            category: 'weapon',
            quality: 'RARE',
            level: 10,
            price: 800,
            stackable: false,
            attack: 45,
            desc: '御风之剑',
            icon: '⚔️'
        }
    ];

    function register(list) {
        if (!window.itemById) window.itemById = {};
        if (!window.allItems) window.allItems = [];
        list.forEach(function (item) {
            if (!item || !item.id) return;
            if (window.itemById[item.id]) return; // 已有定义不覆盖
            window.itemById[item.id] = item;
            window.allItems.push(item);
        });
    }

    // 合并到 extended 数组（若存在）
    if (window.extendedMaterials) {
        missingMaterials.forEach(function (m) {
            if (!window.extendedMaterials.some(function (x) { return x.id === m.id; })) {
                window.extendedMaterials.push(m);
            }
        });
    }
    if (window.extendedFood) {
        missingFood.forEach(function (m) {
            if (!window.extendedFood.some(function (x) { return x.id === m.id; })) {
                window.extendedFood.push(m);
            }
        });
    } else if (window.extendedFoods) {
        missingFood.forEach(function (m) {
            if (!window.extendedFoods.some(function (x) { return x.id === m.id; })) {
                window.extendedFoods.push(m);
            }
        });
    }

    register(missingMaterials);
    register(missingFood);
    register(missingPills);
    register(missingSpecial);
    register(missingArts);
    register(missingWeapons);

    window._missingItemsB2 = {
        materials: missingMaterials,
        food: missingFood,
        pills: missingPills,
        special: missingSpecial,
        arts: missingArts,
        weapons: missingWeapons
    };
})();
