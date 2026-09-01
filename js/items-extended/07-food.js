// ==================== 扩展物品 - 食物/饮品（12种） ====================
// 加载到 window.extendedFood

window.extendedFood = [
    { id: 'food_steamed_bun', name: '馒头', type: 'consumable', subtype: 'food', category: 'consumable', quality: 'COMMON', level: 1, price: 2, effect: { energy_recovery: 10 }, stackable: true, maxStack: 99, desc: '普通馒头', icon: '🍞' },
    { id: 'food_dry_food', name: '干粮', type: 'consumable', subtype: 'food', category: 'consumable', quality: 'COMMON', level: 1, price: 5, effect: { energy_recovery: 15 }, stackable: true, maxStack: 99, desc: '行军干粮', icon: '🍞' },
    { id: 'food_roast_meat', name: '烤肉', type: 'consumable', subtype: 'food', category: 'consumable', quality: 'COMMON', level: 1, price: 10, effect: { energy_recovery: 20, hp_recovery: 10 }, stackable: true, maxStack: 99, desc: '烤肉', icon: '🍖' },
    { id: 'food_spirit_rice', name: '灵米饭', type: 'consumable', subtype: 'food', category: 'consumable', quality: 'UNCOMMON', level: 3, price: 25, effect: { energy_recovery: 40, hp_recovery: 20 }, stackable: true, maxStack: 50, desc: '灵米蒸煮', icon: '🍚' },
    { id: 'food_spirit_fruit', name: '灵果', type: 'consumable', subtype: 'food', category: 'consumable', quality: 'UNCOMMON', level: 3, price: 20, effect: { energy_recovery: 30, qi_recovery: 10 }, stackable: true, maxStack: 50, desc: '灵果', icon: '🍎' },
    { id: 'food_ginseng_soup', name: '参汤', type: 'consumable', subtype: 'food', category: 'consumable', quality: 'UNCOMMON', level: 3, price: 35, effect: { hp_recovery: 50, qi_recovery: 20 }, stackable: true, maxStack: 30, desc: '人参熬汤', icon: '🍵' },
    { id: 'food_lingzhi_porridge', name: '灵芝粥', type: 'consumable', subtype: 'food', category: 'consumable', quality: 'UNCOMMON', level: 3, price: 40, effect: { hp_recovery: 60, energy_recovery: 30 }, stackable: true, maxStack: 30, desc: '灵芝煮粥', icon: '🍵' },
    { id: 'food_immortal_tea', name: '仙露茶', type: 'consumable', subtype: 'food', category: 'consumable', quality: 'RARE', level: 5, price: 80, effect: { qi_recovery: 80, mood_boost: 10 }, stackable: true, maxStack: 30, desc: '仙露泡茶', icon: '🍵' },
    { id: 'food_jade_nectar', name: '琼浆玉液', type: 'consumable', subtype: 'food', category: 'consumable', quality: 'RARE', level: 6, price: 150, effect: { hp_recovery: 100, qi_recovery: 100, energy_recovery: 100 }, stackable: true, maxStack: 20, desc: '仙家饮品', icon: '🍷' },
    { id: 'food_peach', name: '蟠桃', type: 'consumable', subtype: 'food', category: 'consumable', quality: 'EPIC', level: 12, price: 500, effect: { all_attr_permanent: 1, full_recovery: true }, stackable: true, maxStack: 10, desc: '仙家蟠桃', icon: '🍑' },
    { id: 'food_thousand_wine', name: '千年醉', type: 'consumable', subtype: 'food', category: 'consumable', quality: 'RARE', level: 6, price: 100, effect: { mood_boost: 30 }, stackable: true, maxStack: 20, desc: '千年佳酿，心情大好', icon: '🍷' },
    { id: 'food_crane_wine', name: '仙鹤酿', type: 'consumable', subtype: 'food', category: 'consumable', quality: 'EPIC', level: 12, price: 800, effect: { all_attr_permanent: 3, mood_boost: 30 }, stackable: true, maxStack: 5, desc: '仙鹤酿酒', icon: '🍷' }
];