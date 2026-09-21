// ==================== 扩展物品 - 符箓类（21种） ====================
// 加载到 window.extendedTalismans
// 攻击符沿用 items.js 的唯一定义；护身符/净化符/遁逃符/传送符为首批实装
// v21.9：其余符箓全部实装——真实效果接在 gameplay/talisman-system.js（攻击/控制/护体/复活/乾坤）

window.extendedTalismans = [
    // 回收的tal_前缀符箓 — v21.9 全部实装（效果见 gameplay/talisman-system.js）
    { id: 'tal_fireball', name: '火球符', type: 'consumable', subtype: 'talisman', category: 'consumable', quality: 'PIN9', level: 1, price: 20, effect: { attack_damage: 20, element: 'fire' }, stackable: true, maxStack: 99, desc: '基础火系符箓', icon: '📜', implemented: true },
    { id: 'tal_icicle', name: '冰锥符', type: 'consumable', subtype: 'talisman', category: 'consumable', quality: 'PIN9', level: 1, price: 20, effect: { attack_damage: 20, element: 'ice' }, stackable: true, maxStack: 99, desc: '基础冰系符箓', icon: '📜', implemented: true },
    { id: 'tal_wind_blade', name: '风刃符', type: 'consumable', subtype: 'talisman', category: 'consumable', quality: 'PIN9', level: 1, price: 25, effect: { attack_damage: 25, element: 'wind' }, stackable: true, maxStack: 99, desc: '基础风系符箓', icon: '📜', implemented: true },
    { id: 'tal_lightning', name: '雷击符', type: 'consumable', subtype: 'talisman', category: 'consumable', quality: 'PIN8', level: 3, price: 60, effect: { attack_damage: 50, element: 'thunder' }, stackable: true, maxStack: 50, desc: '雷系符箓', icon: '📜', implemented: true },
    { id: 'tal_fire_wall', name: '火墙符', type: 'consumable', subtype: 'talisman', category: 'consumable', quality: 'PIN8', level: 3, price: 50, effect: { attack_damage: 40, element: 'fire', duration: 3 }, stackable: true, maxStack: 50, desc: '火系符箓', icon: '📜', implemented: true },
    { id: 'tal_ice_wall', name: '冰墙符', type: 'consumable', subtype: 'talisman', category: 'consumable', quality: 'PIN8', level: 3, price: 50, effect: { defense_boost: 30, element: 'ice', duration: 3 }, stackable: true, maxStack: 50, desc: '冰系防御', icon: '📜', implemented: true },
    { id: 'tal_wind_dodge', name: '风遁符', type: 'consumable', subtype: 'talisman', category: 'consumable', quality: 'PIN8', level: 3, price: 40, effect: { speed_boost: 50, duration: 3 }, stackable: true, maxStack: 50, desc: '风系增益', icon: '📜', implemented: true },
    { id: 'tal_invisibility', name: '隐身符', type: 'consumable', subtype: 'talisman', category: 'consumable', quality: 'PIN7', level: 6, price: 150, effect: { invisibility: 3 }, stackable: true, maxStack: 30, desc: '隐身潜行', icon: '📜', implemented: true },
    { id: 'tal_bind', name: '定身符', type: 'consumable', subtype: 'talisman', category: 'consumable', quality: 'PIN7', level: 6, price: 180, effect: { stun: 1, duration: 1 }, stackable: true, maxStack: 30, desc: '定身控制', icon: '📜', implemented: true },
    { id: 'tal_silence', name: '沉默符', type: 'consumable', subtype: 'talisman', category: 'consumable', quality: 'PIN7', level: 6, price: 200, effect: { silence: 3 }, stackable: true, maxStack: 30, desc: '沉默法术', icon: '📜', implemented: true },
    { id: 'tal_armor_break', name: '破甲符', type: 'consumable', subtype: 'talisman', category: 'consumable', quality: 'PIN7', level: 6, price: 180, effect: { penetrate_boost: 50, duration: 3 }, stackable: true, maxStack: 30, desc: '破甲效果', icon: '📜', implemented: true },
    { id: 'tal_heavenly_thunder', name: '天雷符', type: 'consumable', subtype: 'talisman', category: 'consumable', quality: 'PIN5', level: 12, price: 600, effect: { attack_damage: 200, element: 'thunder' }, stackable: true, maxStack: 20, desc: '天雷之威', icon: '📜', implemented: true },
    { id: 'tal_freeze', name: '冰封符', type: 'consumable', subtype: 'talisman', category: 'consumable', quality: 'PIN5', level: 12, price: 500, effect: { freeze: 2 }, stackable: true, maxStack: 20, desc: '冰封之符', icon: '📜', implemented: true },
    { id: 'tal_revive', name: '复活符', type: 'consumable', subtype: 'talisman', category: 'consumable', quality: 'PIN5', level: 15, price: 1000, effect: { revive: true }, stackable: true, maxStack: 5, desc: '起死回生', icon: '📜', implemented: true },
    { id: 'tal_five_element', name: '五行符', type: 'consumable', subtype: 'talisman', category: 'consumable', quality: 'PIN3', level: 22, price: 3000, effect: { attack_damage: 500, element: 'all' }, stackable: true, maxStack: 10, desc: '五行之力', icon: '📜', implemented: true },
    { id: 'tal_universe', name: '乾坤符', type: 'consumable', subtype: 'talisman', category: 'consumable', quality: 'PIN3', level: 28, price: 5000, effect: { twist_fate: true }, stackable: true, maxStack: 3, desc: '扭转乾坤', icon: '📜', implemented: true },
    { id: 'tal_heavenly_master', name: '天师符', type: 'consumable', subtype: 'talisman', category: 'consumable', quality: 'PIN3', level: 25, price: 4000, effect: { divine_shield: true, duration: 10 }, stackable: true, maxStack: 5, desc: '天师护体', icon: '📜', implemented: true },

    // 首批实现的4种扩展符箓（攻击符在 items.js 中定义）
    { id: 'tal_shield', name: '护身符', type: 'consumable', subtype: 'talisman', category: 'consumable', quality: 'PIN8', level: 3, price: 70, effect: { shield: 50, duration: 5 }, stackable: true, maxStack: 50, desc: '防护符箓，获得护盾', icon: '📜', implemented: true },
    { id: 'tal_purify', name: '净化符', type: 'consumable', subtype: 'talisman', category: 'consumable', quality: 'PIN5', level: 10, price: 400, effect: { cleanse: true }, stackable: true, maxStack: 20, desc: '净化圣符，移除负面状态', icon: '📜', implemented: true },
    { id: 'tal_escape', name: '遁逃符', type: 'consumable', subtype: 'talisman', category: 'consumable', quality: 'PIN8', level: 4, price: 150, effect: { escape_boost: 0.8 }, stackable: true, maxStack: 30, desc: '使用后大幅提高逃跑成功率', icon: '📜', implemented: true },
    { id: 'tal_teleport', name: '传送符', type: 'consumable', subtype: 'talisman', category: 'consumable', quality: 'PIN7', level: 6, price: 200, effect: { teleport: true }, stackable: true, maxStack: 20, desc: '瞬间传送', icon: '📜', implemented: true }
];