// ==================== 扩展物品 - 重塑灵根丹（v20.16） ====================
// 后天改命线：服用后本系主根占比 +6（其余五行按比例摊薄，饼总和恒 100 由族谱同一把尺配平）。
// 获取唯一路径=炼丹新丹方（五行灵髓主药，js/crafting/alchemy-compound.js recipe_root_refine）。
// 使用处理见 inventory.js useItem → root_refine 分支 → window.refineRootByPill。
(function () {
    'use strict';

    window.rootRefineItems = [
        {
            id: 'pill_root_refine',
            name: '重塑灵根丹',
            type: 'consumable',
            subtype: 'pill',            // 走消耗品白名单：服丹自动累丹毒（药性猛烈，名副其实）
            category: 'consumable',
            quality: 'LEGENDARY',
            level: 6,
            price: 1200,
            effect: { root_refine: 6 }, // 主根占比 +6（摊薄其余，配平回 100）
            stackable: true,
            maxStack: 5,
            desc: '以五行灵髓为主药炼成。服用后本命灵根更纯（主根占比+6，余者摊薄），主根至多六成，药力递减',
            icon: '🌈'
        }
    ];

    // 自注册进物品库（与 13/14 号扩展同策略，幂等防重复入库）
    if (window.itemById && window.allItems) {
        var known = Object.create(null);
        window.allItems.forEach(function (it) { if (it && it.id) known[it.id] = true; });
        window.rootRefineItems.forEach(function (item) {
            if (!item || !item.id || known[item.id]) return;
            if (window.itemById[item.id]) return;
            window.itemById[item.id] = item;
            window.allItems.push(item);
            known[item.id] = true;
        });
    }
    if (window.consumables && Array.isArray(window.consumables)) {
        window.rootRefineItems.forEach(function (m) {
            if (window.consumables.indexOf(m) < 0) window.consumables.push(m);
        });
    }
})();
