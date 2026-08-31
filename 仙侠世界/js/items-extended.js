// ==================== 仙路长青 - 扩展物品系统 v1.0 ====================
// 主入口文件 - 合并所有子类别数据并导出到全局
// 子文件加载顺序：pills > weapons > armor > materials > talismans > arts > food > special
// 加载顺序：items.js → items-extended/*.js → 其他系统

// 确保扩展物品数组存在
window.extendedPills = window.extendedPills || [];
window.extendedBuffPills = window.extendedBuffPills || [];
window.extendedPermPills = window.extendedPermPills || [];
window.extendedSpecialPills = window.extendedSpecialPills || [];
window.extendedWeapons = window.extendedWeapons || [];
window.extendedArmor = window.extendedArmor || [];
window.extendedMaterials = window.extendedMaterials || [];
window.extendedTalismans = window.extendedTalismans || [];
window.extendedArts = window.extendedArts || [];
window.extendedFood = window.extendedFood || [];
window.extendedSpecialItems = window.extendedSpecialItems || [];
window.extendedMedicalItems = window.extendedMedicalItems || [];
window.extendedBreakthroughPills = window.extendedBreakthroughPills || [];
window.extendedManuals = window.extendedManuals || []; // v13.1 绝技秘籍

// ============ 合并所有扩展物品到全局 ============
(function() {
    const allExtended = [
        ...window.extendedPills,
        ...window.extendedBuffPills,
        ...window.extendedPermPills,
        ...window.extendedSpecialPills,
        ...window.extendedWeapons,
        ...window.extendedArmor,
        ...window.extendedMaterials,
        ...window.extendedTalismans,
        ...window.extendedArts,
        ...window.extendedFood,
        ...window.extendedSpecialItems,
        ...window.extendedMedicalItems,
        ...window.extendedBreakthroughPills,
        ...window.extendedManuals // v13.1 绝技秘籍
    ];

    // 合并到现有物品系统
    if (window.allItems && Array.isArray(window.allItems)) {
        window.allItems.push(...allExtended);
    }

    // 更新物品ID映射
    if (window.itemById) {
        allExtended.forEach(item => {
            window.itemById[item.id] = item;
        });
    }

    // 同步到分类数组
    const weapons = allExtended.filter(i => i.type === 'equipment' && ['sword','dao','staff','spear','dagger','gauntlets','claw'].includes(i.subtype));
    const armor = allExtended.filter(i => i.type === 'equipment' && ['hat','crown','robe','armor','gloves','boots','shoes','belt','ring'].includes(i.subtype));
    const consumables = allExtended.filter(i => i.type === 'consumable');
    const materials = allExtended.filter(i => i.type === 'material');
    const secretArts = allExtended.filter(i => i.type === 'secret_art');

    if (window.weapons) window.weapons.push(...weapons);
    if (window.armor) window.armor.push(...armor);
    if (window.consumables) window.consumables.push(...consumables);
    if (window.materials) window.materials.push(...materials);
    if (window.secretArts) window.secretArts.push(...secretArts);

    console.log('[items-extended] 已加载 ' + allExtended.length + ' 种扩展物品');
})();