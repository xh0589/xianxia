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
            quality: 'PIN9',
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
        mat('mat_wood', '木材', 3, '🪵', '普通木材'),
        // 第八十八波·收服家什实体化：收服账上的 spec_beast_trap 从来查无此物，
        // 「带家什收服+25%」是一句永远兑现不了的空话。灵兽坊有售驭兽符纸（80灵石），机关件也照旧算数。
        mat('tal_beast_seal', '缚兽符', 80, '📜', '绘着缚灵阵纹的驭兽符纸——收服时掷出，符力成缚，兽挣脱不得')
    ];

    var missingFood = [
        {
            id: 'food_flower_wine',
            name: '花酿酒',
            type: 'consumable',
            subtype: 'food',
            category: 'consumable',
            quality: 'PIN8',
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
            quality: 'PIN9',
            level: 1,
            price: 15,
            stackable: true,
            maxStack: 99,
            effect: { hp_recovery: 25, energy_recovery: 10 },
            desc: '香喷喷的烤肉',
            icon: '🍖'
        }
    ];

    // v20.81：钓鱼系统（app.js FISH_SPOTS）发的 9 种鱼此前全部没有物品模板，
    // addItem 因"物品模板不存在"直接丢弃——钓上来的鱼无声消失。这里补齐 9 种。
    function fish(id, name, quality, level, price, effect, desc, icon) {
        return {
            id: id, name: name, type: 'consumable', subtype: 'food', category: 'consumable',
            quality: quality, level: level, price: price, stackable: true, maxStack: 50,
            effect: effect, desc: desc, icon: icon || '🐟'
        };
    }
    [
        // 河流
        fish('food_basic_fish', '鲤鱼', 'PIN9', 1, 8, { energy_recovery: 8 }, '河中常见的鲤鱼，肉嫩刺多', '🐟'),
        fish('food_carp', '鲫鱼', 'PIN9', 1, 10, { energy_recovery: 10, hp_recovery: 5 }, '鲫鱼汤鲜，熬一碗最养人', '🐟'),
        fish('food_grass_carp', '草鱼', 'PIN9', 2, 12, { energy_recovery: 12 }, '水草间的大个头，力道十足', '🐟'),
        // 湖泊
        fish('food_silver_fish', '银鱼', 'PIN8', 3, 25, { energy_recovery: 18 }, '通体晶莹的小银鱼，湖中灵机所钟', '🐟'),
        fish('food_golden_carp', '锦鲤', 'PIN7', 4, 60, { energy_recovery: 25, mood_boost: 10 }, '金鳞赤尾的锦鲤，得之有好运', '🎏'),
        fish('food_koi', '锦鲤（变异）', 'PIN5', 6, 150, { energy_recovery: 40, qi_recovery: 20, mood_boost: 15 }, '变异锦鲤，鳞下隐有灵光流转，食之补益真气', '🎏'),
        // 海域
        fish('food_sea_fish', '海鱼', 'PIN9', 2, 15, { energy_recovery: 14 }, '近海寻常渔获，咸鲜有味', '🐟'),
        fish('food_black_fish', '黑鱼', 'PIN8', 4, 35, { energy_recovery: 20, hp_recovery: 15 }, '深水墨色的黑鱼，性烈补气', '🐟'),
        fish('food_tuna', '金枪鱼', 'PIN7', 6, 120, { energy_recovery: 35, hp_recovery: 20 }, '远洋巨物，肉厚脂丰，一条顶十天口粮', '🐟')
    ].forEach(function (f) { missingFood.push(f); });

    // 突破丹已迁移到 01-pills.js 的 extendedBreakthroughPills 中，此处不再重复注册
    var missingPills = [];

    var missingSpecial = [
        {
            id: 'spec_immortal_token',
            name: '仙令',
            type: 'quest',
            subtype: 'token',
            category: 'quest',
            quality: 'PIN5',
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
            quality: 'PIN8',
            level: 4,
            price: 80,
            stackable: true,
            maxStack: 30,
            desc: '战斗用爆裂符箓——对敌人炸出 80 点伤害',
            effect: { attack_damage: 80 },
            icon: '💥'
        },
        {
            id: 'special_hidden_weapon',
            name: '暗器',
            type: 'consumable',
            subtype: 'trap',
            category: 'consumable',
            quality: 'PIN8',
            level: 3,
            price: 50,
            stackable: true,
            maxStack: 50,
            desc: '袖中暗器——战斗中掷出，造成 45 点伤害（吃本回合动作）',
            effect: { attack_damage: 45 },
            icon: '🗡️'
        },
        {
            id: 'special_mechanism',
            name: '机关件',
            type: 'material',
            subtype: 'mechanism',
            category: 'material',
            quality: 'PIN8',
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
            quality: 'PIN8',
            level: 4,
            price: 70,
            stackable: true,
            maxStack: 30,
            desc: '涂刃之毒——战斗中撒出（敌人每回合掉血 3 回合），或淬在刃上（接下来 3 次见血渗毒）',
            effect: { poison_enemy: 3 },
            icon: '☠️'
        },
        {
            // 第九十三波·卑鄙流仪的家什：石灰掺松烟，扬出去糊敌人脸——吃不吃看他的性子（第九十四波·见招拆招）
            id: 'special_smoke',
            name: '迷烟散',
            type: 'consumable',
            subtype: 'poison',
            category: 'consumable',
            quality: 'PIN8',
            level: 2,
            price: 40,
            stackable: true,
            maxStack: 30,
            desc: '石灰掺松烟——扬进敌人眼里：性急的兜头糊实（瞎 2 回）、老练的侧脸闭气（1 回）、眼毒的袖子扫开（白撒）',
            effect: { blind_enemy: 2 },
            icon: '💨'
        },
        {
            // 第九十九波·江湖耳目的家伙：撒地的铁蒺藜——踩不踩得着，看他的性子
            id: 'special_caltrop',
            name: '铁蒺藜',
            type: 'consumable',
            subtype: 'trap',
            category: 'consumable',
            quality: 'PIN8',
            level: 2,
            price: 45,
            stackable: true,
            maxStack: 30,
            desc: '四角铁刺，随手撒地——性急的抢步踩个正着（行动条 -40、下一手命中 -10），老练的步步小心也乱了脚，眼毒的纵身绕开',
            effect: { trip_enemy: 1 },
            icon: '🪤'
        },
        {
            // 第九十九波·灶灰混辣椒面：穷人的石灰——便宜好使，只糊得住性急的
            id: 'special_ash',
            name: '灶灰辣粉',
            type: 'consumable',
            subtype: 'poison',
            category: 'consumable',
            quality: 'PIN8',
            level: 1,
            price: 25,
            stackable: true,
            maxStack: 50,
            desc: '灶灰混辣椒面——兜头撒去：性急的呛得眼泪直流（瞎 1 回），老练的侧脸闭气、眼毒的袖子扫开（白撒）',
            effect: { ash_enemy: 1 },
            icon: '🌶️'
        }
    ];

    var missingArts = [
        {
            id: 'art_chaos_art',
            name: '混沌心法',
            type: 'secret_art',
            subtype: 'internal',
            category: 'secret_art',
            quality: 'PIN3',
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
            quality: 'PIN7',
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
