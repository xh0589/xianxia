// ==================== 扩展物品 - 绝技秘籍（9种，v13.1） ====================
// 加载到 window.extendedManuals；玩家通过研读秘籍学习 COMBAT_ABILITIES 可学绝技。
// 设计哲学：游戏内容理论上任何人都能拥有——玩家与敌人共用同一套战斗机制与数值；
// 种系天生4项（hardened/pounce/chill/burn）不在可学池，故无对应秘籍。
// 学习处理见 inventory.js useItem → applyConsumableEffect 的 learn_ability 分支。
(function () {
    'use strict';

    function manual(id, name, abilityId, quality, level, price, desc) {
        return {
            id: id,
            name: name,
            type: 'consumable',
            subtype: 'manual',      // v13.1 新子类型：inventory.js 消耗品白名单已放行
            category: 'consumable',
            quality: quality,
            level: level,
            price: price,
            effect: { learn_ability: abilityId },
            stackable: false,       // 秘籍不可堆叠
            desc: desc,
            icon: '📜'
        };
    }

    window.extendedManuals = [
        // 效果一句话均取自 battle.js COMBAT_ABILITIES 注册表语义；escape 为玩家侧逃跑加成实现
        manual('manual_venom',        '万毒真经',       'venom',       'EPIC',      4, 400, '习得【施毒】：命中附加毒素负荷'),
        manual('manual_lifesteal',    '血煞魔功·残篇', 'lifesteal',   'RARE',      3, 350, '习得【吸血功】：实际伤害30%转化为自身气血'),
        manual('manual_reflect',      '铁体功',         'reflect',     'RARE',      2, 300, '习得【铁体功】：受击反震20%钝伤（不连锁）'),
        manual('manual_soundwave',    '摄魂音律',       'soundwave',   'EPIC',      4, 450, '习得【摄魂音】：神魂震荡+疼痛'),
        manual('manual_illusion',     '迷魂宝录',       'illusion',    'EPIC',      5, 500, '习得【迷魂术】：叠加迷扰层，目标命中率-15/层'),
        manual('manual_escape',       '遁术要诀',       'escape',      'RARE',      2, 280, '习得【遁术】：身法诡秘，逃跑成功率大幅提升（基础72%）'),
        manual('manual_drain_qi',     '采补密录',       'drain_qi',    'EPIC',      5, 600, '习得【采补功】：摄取目标精气转化真气'),
        manual('manual_gu_parasite',  '金蚕蛊经',       'gu_parasite', 'LEGENDARY', 6, 700, '习得【金蚕蛊】：上毒×1.5并种蛊啃噬筋骨'),
        manual('manual_sword_burst',  '剑气纵横诀',     'sword_burst', 'RARE',      3, 380, '习得【剑气纵横】：暴击率+12%，第3有效击×1.25')
    ];

    // 本文件按浏览器脚本顺序排在 items-extended.js 聚合器之后（与 13-missing-ids.js 同策略）：
    // 聚合器执行时 extendedManuals 尚未定义、不会重复合并，故此处自注册进物品库。
    function register(list) {
        if (!window.itemById) window.itemById = {};
        if (!window.allItems) window.allItems = [];
        var known = Object.create(null);
        window.allItems.forEach(function (it) { if (it && it.id) known[it.id] = true; }); // 幂等：防任何加载顺序下的重复入库
        list.forEach(function (item) {
            if (!item || !item.id || known[item.id]) return;
            if (window.itemById[item.id]) return; // 已有定义不覆盖
            window.itemById[item.id] = item;
            window.allItems.push(item);
            known[item.id] = true;
        });
    }

    register(window.extendedManuals);

    // 同步到消耗品分类数组（若存在），保持与聚合器一致的分类视图
    if (window.consumables && Array.isArray(window.consumables)) {
        window.extendedManuals.forEach(function (m) {
            if (window.consumables.indexOf(m) < 0) window.consumables.push(m);
        });
    }
})();
