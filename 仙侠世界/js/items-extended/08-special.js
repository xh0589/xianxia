// ==================== 扩展物品 - 任务/特殊物品（12种） ====================
// 加载到 window.extendedSpecialItems

window.extendedSpecialItems = [
    { id: 'spec_token', name: '信物', type: 'quest', subtype: 'token', category: 'quest', quality: 'COMMON', level: 1, price: 0, stackable: true, maxStack: 10, desc: '身份信物', icon: '📜' },
    { id: 'spec_token_pass', name: '令牌', type: 'quest', subtype: 'token', category: 'quest', quality: 'COMMON', level: 1, price: 0, stackable: true, maxStack: 10, desc: '通行令牌', icon: '📜' },
    { id: 'spec_map_fragment', name: '地图残片', type: 'quest', subtype: 'map', category: 'quest', quality: 'UNCOMMON', level: 3, price: 0, stackable: true, maxStack: 10, desc: '藏宝图残片', icon: '🗺️' },
    { id: 'spec_key', name: '钥匙', type: 'quest', subtype: 'key', category: 'quest', quality: 'COMMON', level: 1, price: 0, stackable: true, maxStack: 10, desc: '古朴钥匙', icon: '🔑' },
    { id: 'spec_spirit_fragment', name: '灵石碎块', type: 'material', subtype: 'currency', category: 'material', quality: 'COMMON', level: 1, price: 1, stackable: true, maxStack: 9999, desc: '灵石碎块', icon: '💎' },
    { id: 'spec_spirit_stone', name: '灵石', type: 'material', subtype: 'currency', category: 'material', quality: 'UNCOMMON', level: 3, price: 10, stackable: true, maxStack: 9999, desc: '标准灵石', icon: '💎' },
    { id: 'spec_mid_spirit_stone', name: '中品灵石', type: 'material', subtype: 'currency', category: 'material', quality: 'RARE', level: 6, price: 100, stackable: true, maxStack: 9999, desc: '中品灵石', icon: '💎' },
    { id: 'spec_high_spirit_stone', name: '上品灵石', type: 'material', subtype: 'currency', category: 'material', quality: 'EPIC', level: 12, price: 1000, stackable: true, maxStack: 9999, desc: '上品灵石', icon: '💎' },
    { id: 'spec_supreme_spirit_stone', name: '极品灵石', type: 'material', subtype: 'currency', category: 'material', quality: 'LEGENDARY', level: 20, price: 10000, stackable: true, maxStack: 999, desc: '极品灵石', icon: '💎' },
    { id: 'spec_spirit_crystal', name: '灵晶', type: 'material', subtype: 'currency', category: 'material', quality: 'LEGENDARY', level: 22, price: 5000, stackable: true, maxStack: 999, desc: '灵气结晶', icon: '💎' },
    { id: 'spec_spirit_source_pearl', name: '灵源珠', type: 'material', subtype: 'special', category: 'material', quality: 'LEGENDARY', level: 25, price: 10000, stackable: true, maxStack: 50, desc: '灵力源泉', icon: '🔮' },
    { id: 'spec_ten_thousand_milk', name: '万年灵乳', type: 'consumable', subtype: 'special', category: 'consumable', quality: 'LEGENDARY', level: 25, price: 5000, effect: { qi_recovery: 2000, hp_recovery: 2000 }, stackable: true, maxStack: 10, desc: '万年灵液', icon: '🧪' },
    // v7.1 强化系统材料
    { id: 'spec_transfer_stone', name: '转移石', type: 'material', subtype: 'enhance', category: 'material', quality: 'RARE', level: 8, price: 500, stackable: true, maxStack: 99, desc: '可将装备强化等级转移至另一件装备（损耗50%）', icon: '🔮' },
    { id: 'spec_enhance_stone', name: '强化石', type: 'material', subtype: 'enhance', category: 'material', quality: 'UNCOMMON', level: 3, price: 80, stackable: true, maxStack: 99, desc: '辅助强化的矿石（预留）', icon: '🪨' },
    { id: 'spec_longevity_pill', name: '延寿丹', type: 'consumable', subtype: 'special', category: 'consumable', quality: 'EPIC', level: 15, price: 2000, effect: { lifespan_years: 50 }, stackable: true, maxStack: 20, desc: '延长寿元五十年', icon: '💊' },
    // 绯泪剧情特殊物品
    { id: 'half_broken_hairpin', name: '半截断簪', type: 'quest', subtype: 'token', category: 'quest', quality: 'RARE', level: 1, price: 0, stackable: false, maxStack: 1, desc: '绯泪保存了十七年的断簪。玉质温润，断口处有暗红色的痕迹——那是寒烟门灭门那夜，郗寒舟送的定情信物断裂时留下的。', icon: '🪮' }
];