// ==================== 扩展物品 - 丹药类（45种） ====================
// 加载到 window.extendedPills, extendedBuffPills, extendedPermPills, extendedSpecialPills

// 恢复类丹药（15种）
window.extendedPills = [
    { id: 'pill_small_recovery', name: '小还丹', type: 'consumable', subtype: 'pill', category: 'consumable', quality: 'COMMON', level: 1, price: 15, effect: { hp_recovery: 30 }, stackable: true, maxStack: 99, desc: '基础疗伤丹药', icon: '💊' },
    { id: 'pill_qi_powder', name: '补气散', type: 'consumable', subtype: 'pill', category: 'consumable', quality: 'COMMON', level: 1, price: 20, effect: { qi_recovery: 20 }, stackable: true, maxStack: 99, desc: '基础恢复真气', icon: '💊' },
    { id: 'pill_energy_powder', name: '精力散', type: 'consumable', subtype: 'pill', category: 'consumable', quality: 'COMMON', level: 1, price: 15, effect: { energy_recovery: 20 }, stackable: true, maxStack: 99, desc: '基础恢复精力', icon: '💊' },
    { id: 'pill_big_recovery', name: '大还丹', type: 'consumable', subtype: 'pill', category: 'consumable', quality: 'UNCOMMON', level: 3, price: 40, effect: { hp_recovery: 80 }, stackable: true, maxStack: 99, desc: '常见疗伤丹药', icon: '💊' },
    { id: 'pill_qi_gather', name: '聚气丹', type: 'consumable', subtype: 'pill', category: 'consumable', quality: 'UNCOMMON', level: 3, price: 50, effect: { qi_recovery: 60 }, stackable: true, maxStack: 99, desc: '常见恢复真气', icon: '💊' },
    { id: 'pill_energy_return', name: '回力丹', type: 'consumable', subtype: 'pill', category: 'consumable', quality: 'UNCOMMON', level: 3, price: 40, effect: { energy_recovery: 50 }, stackable: true, maxStack: 99, desc: '常见恢复精力', icon: '💊' },
    { id: 'pill_spring_recovery', name: '回春丹', type: 'consumable', subtype: 'pill', category: 'consumable', quality: 'RARE', level: 5, price: 100, effect: { hp_recovery: 200 }, stackable: true, maxStack: 99, desc: '强力疗伤丹药', icon: '💊' },
    { id: 'pill_qi_return', name: '回灵丹', type: 'consumable', subtype: 'pill', category: 'consumable', quality: 'RARE', level: 5, price: 120, effect: { qi_recovery: 150 }, stackable: true, maxStack: 99, desc: '强力恢复真气', icon: '💊' },
    { id: 'pill_energy_gather', name: '聚神丹', type: 'consumable', subtype: 'pill', category: 'consumable', quality: 'RARE', level: 5, price: 100, effect: { energy_recovery: 120 }, stackable: true, maxStack: 99, desc: '强力恢复精力', icon: '💊' },
    { id: 'pill_nine_revival', name: '九转还魂丹', type: 'consumable', subtype: 'pill', category: 'consumable', quality: 'EPIC', level: 10, price: 300, effect: { hp_recovery: 500 }, stackable: true, maxStack: 50, desc: '濒死回生', icon: '💊' },
    { id: 'pill_qi_condense', name: '凝元丹', type: 'consumable', subtype: 'pill', category: 'consumable', quality: 'EPIC', level: 10, price: 350, effect: { qi_recovery: 400 }, stackable: true, maxStack: 50, desc: '大量恢复真气', icon: '💊' },
    { id: 'pill_energy_boost', name: '提神丹', type: 'consumable', subtype: 'pill', category: 'consumable', quality: 'EPIC', level: 10, price: 280, effect: { energy_recovery: 300 }, stackable: true, maxStack: 50, desc: '大量恢复精力', icon: '💊' },
    { id: 'pill_life_creation', name: '生生造化丹', type: 'consumable', subtype: 'pill', category: 'consumable', quality: 'LEGENDARY', level: 20, price: 800, effect: { hp_recovery: 1000 }, stackable: true, maxStack: 20, desc: '传说级疗伤圣药', icon: '💊' },
    { id: 'pill_qi_return_supreme', name: '归元丹', type: 'consumable', subtype: 'pill', category: 'consumable', quality: 'LEGENDARY', level: 20, price: 900, effect: { qi_recovery: 800 }, stackable: true, maxStack: 20, desc: '传说级真气圣药', icon: '💊' },
    { id: 'pill_triple_flower', name: '三花聚顶丹', type: 'consumable', subtype: 'pill', category: 'consumable', quality: 'LEGENDARY', level: 25, price: 1500, effect: { full_recovery: true }, stackable: true, maxStack: 10, desc: '全面恢复圣药', icon: '💊' }
];

// ==================== 突破丹药（v9.7） ====================
window.extendedBreakthroughPills = [
    { id: 'pill_peiyuan', name: '培元丹', type: 'consumable', subtype: 'breakthrough', category: 'consumable', quality: 'UNCOMMON', level: 3, price: 80, effect: { breakthrough_bonus: 0.10 }, stackable: true, maxStack: 20, desc: '炼气突破筑基时成功率+10%', icon: '💊', breakthroughRealm: '炼气' },
    { id: 'pill_zhuji', name: '筑基丹', type: 'consumable', subtype: 'breakthrough', category: 'consumable', quality: 'RARE', level: 5, price: 200, effect: { breakthrough_bonus: 0.12 }, stackable: true, maxStack: 10, desc: '筑基期突破时成功率+12%', icon: '💊', breakthroughRealm: '筑基' },
    { id: 'pill_ningyuan', name: '凝元丹', type: 'consumable', subtype: 'breakthrough', category: 'consumable', quality: 'RARE', level: 8, price: 500, effect: { breakthrough_bonus: 0.15 }, stackable: true, maxStack: 10, desc: '金丹期突破时成功率+15%', icon: '💊', breakthroughRealm: '金丹' },
    { id: 'pill_jieying', name: '结婴丹', type: 'consumable', subtype: 'breakthrough', category: 'consumable', quality: 'EPIC', level: 12, price: 1500, effect: { breakthrough_bonus: 0.18 }, stackable: true, maxStack: 5, desc: '元婴期突破时成功率+18%', icon: '💊', breakthroughRealm: '元婴' },
    { id: 'pill_huashen', name: '化神丹', type: 'consumable', subtype: 'breakthrough', category: 'consumable', quality: 'EPIC', level: 18, price: 5000, effect: { breakthrough_bonus: 0.20 }, stackable: true, maxStack: 3, desc: '化神期突破时成功率+20%', icon: '💊', breakthroughRealm: '化神' },
    { id: 'pill_pojing', name: '破境丹', type: 'consumable', subtype: 'breakthrough', category: 'consumable', quality: 'LEGENDARY', level: 15, price: 3000, effect: { breakthrough_bonus: 0.10 }, stackable: true, maxStack: 5, desc: '任何境界突破时成功率+10%', icon: '💊', breakthroughRealm: '通用' },
    { id: 'pill_wudao', name: '悟道丹', type: 'consumable', subtype: 'breakthrough', category: 'consumable', quality: 'LEGENDARY', level: 20, price: 8000, effect: { breakthrough_bonus: '5~15%随机' }, stackable: true, maxStack: 3, desc: '突破时获得顿悟，额外提升5~15%成功率', icon: '💊', breakthroughRealm: '通用' },
    { id: 'pill_huxin', name: '护心丹', type: 'consumable', subtype: 'breakthrough', category: 'consumable', quality: 'UNCOMMON', level: 3, price: 100, effect: { protect_heart_demon: true }, stackable: true, maxStack: 20, desc: '突破时防止心魔', icon: '💊', breakthroughRealm: '通用' },
    // 13-missing-ids.js 迁移来的突破丹
    { id: 'pill_breakthrough', name: '突破丹', type: 'consumable', subtype: 'breakthrough', category: 'consumable', quality: 'RARE', level: 8, price: 500, effect: { breakthrough_bonus: 0.15 }, stackable: true, maxStack: 20, desc: '辅助境界突破的丹药', icon: '💊', breakthroughRealm: '通用' }
];

// 增益类丹药·临时（8种）— 已删除，系统无回合制buff机制
window.extendedBuffPills = [];

// 永久增益类丹药（11种，已删除转生丹）
window.extendedPermPills = [
    { id: 'pill_body_foundation', name: '培元丹', type: 'consumable', subtype: 'perm_pill', category: 'consumable', quality: 'UNCOMMON', level: 5, price: 200, effect: { constitution_permanent: 2 }, stackable: true, maxStack: 10, desc: '强化体魄', icon: '💊' },
    { id: 'pill_meridian', name: '通脉丹', type: 'consumable', subtype: 'perm_pill', category: 'consumable', quality: 'UNCOMMON', level: 5, price: 200, effect: { meridian_permanent: 2 }, stackable: true, maxStack: 10, desc: '疏通经脉', icon: '💊' },
    { id: 'pill_wisdom', name: '开智丹', type: 'consumable', subtype: 'perm_pill', category: 'consumable', quality: 'UNCOMMON', level: 5, price: 200, effect: { intelligence_permanent: 2 }, stackable: true, maxStack: 10, desc: '开悟心智', icon: '💊' },
    { id: 'pill_sinew', name: '强筋丹', type: 'consumable', subtype: 'perm_pill', category: 'consumable', quality: 'UNCOMMON', level: 5, price: 200, effect: { strength_permanent: 2 }, stackable: true, maxStack: 10, desc: '增强力量', icon: '💊' },
    { id: 'pill_dexterity', name: '灵巧丹', type: 'consumable', subtype: 'perm_pill', category: 'consumable', quality: 'UNCOMMON', level: 5, price: 200, effect: { dexterity_permanent: 2 }, stackable: true, maxStack: 10, desc: '提升灵巧', icon: '💊' },
    { id: 'pill_willpower', name: '凝心丹', type: 'consumable', subtype: 'perm_pill', category: 'consumable', quality: 'UNCOMMON', level: 5, price: 200, effect: { willpower_permanent: 2 }, stackable: true, maxStack: 10, desc: '坚定意志', icon: '💊' },
    { id: 'pill_foundation', name: '筑基丹', type: 'consumable', subtype: 'perm_pill', category: 'consumable', quality: 'RARE', level: 8, price: 500, effect: { foundation_bonus: 30 }, stackable: true, maxStack: 20, desc: '筑基成功率+30%', icon: '💊' },
    { id: 'pill_golden_core', name: '金丹丹', type: 'consumable', subtype: 'perm_pill', category: 'consumable', quality: 'EPIC', level: 15, price: 2000, effect: { core_bonus: 20 }, stackable: true, maxStack: 10, desc: '凝结金丹成功率+20%', icon: '💊' },
    { id: 'pill_primordial', name: '元婴丹', type: 'consumable', subtype: 'perm_pill', category: 'consumable', quality: 'EPIC', level: 18, price: 5000, effect: { primordial_bonus: 15 }, stackable: true, maxStack: 10, desc: '凝结元婴成功率+15%', icon: '💊' },
    { id: 'pill_marrow_wash', name: '洗髓丹', type: 'consumable', subtype: 'perm_pill', category: 'consumable', quality: 'EPIC', level: 20, price: 3000, effect: { all_attr_permanent: 5 }, stackable: true, maxStack: 5, desc: '脱胎换骨', icon: '💊' },
    { id: 'pill_divine', name: '化神丹', type: 'consumable', subtype: 'perm_pill', category: 'consumable', quality: 'LEGENDARY', level: 25, price: 15000, effect: { divine_bonus: 10 }, stackable: true, maxStack: 5, desc: '化神成功率+10%', icon: '💊' },
    { id: 'pill_sutra_change', name: '易经丹', type: 'consumable', subtype: 'perm_pill', category: 'consumable', quality: 'LEGENDARY', level: 30, price: 10000, effect: { all_attr_permanent: 15 }, stackable: true, maxStack: 3, desc: '易经洗髓', icon: '💊' }
];

// 特殊丹药（6种，已删除定颜丹，避毒丹标记implemented:false，修复效果键别名）
window.extendedSpecialPills = [
    { id: 'pill_poison_resist', name: '避毒丹', type: 'consumable', subtype: 'special_pill', category: 'consumable', quality: 'UNCOMMON', level: 3, price: 80, effect: { poison_resist: 50, duration: 1440 }, stackable: true, maxStack: 30, desc: '毒抗+50%持续1天', icon: '💊', implemented: false },
    { id: 'pill_antidote', name: '解毒丹', type: 'consumable', subtype: 'special_pill', category: 'consumable', quality: 'UNCOMMON', level: 3, price: 50, effect: { cure_poison: true }, stackable: true, maxStack: 50, desc: '解除中毒状态', icon: '💊' },
    { id: 'pill_fasting', name: '辟谷丹', type: 'consumable', subtype: 'special_pill', category: 'consumable', quality: 'COMMON', level: 1, price: 20, effect: { energy_recovery: 50 }, stackable: true, maxStack: 99, desc: '补充精力，可数日不食', icon: '💊' },
    { id: 'pill_clarity', name: '清明丹', type: 'consumable', subtype: 'special_pill', category: 'consumable', quality: 'UNCOMMON', level: 3, price: 60, effect: { cure_confusion: true }, stackable: true, maxStack: 30, desc: '解除混乱状态', icon: '💊' },
    { id: 'pill_forget_sorrow', name: '忘忧丹', type: 'consumable', subtype: 'special_pill', category: 'consumable', quality: 'RARE', level: 5, price: 150, effect: { remove_negative_emotion: true }, stackable: true, maxStack: 20, desc: '消除负面情绪', icon: '💊' },
    { id: 'pill_life_extend', name: '延寿丹', type: 'consumable', subtype: 'special_pill', category: 'consumable', quality: 'EPIC', level: 15, price: 10000, effect: { lifespan_years: 10 }, stackable: true, maxStack: 5, desc: '寿命+10年', icon: '💊' },
    { id: 'pill_hemostatic', name: '止血丹', type: 'consumable', subtype: 'special_pill', category: 'consumable', quality: 'UNCOMMON', level: 3, price: 80, effect: { hemostatic: true }, stackable: true, maxStack: 50, desc: '全身外出血减半，内出血停止累积', icon: '💊' }
];

// 医疗物品（绷带类）— 新增 useContext: ['medical']
window.extendedMedicalItems = [
    { id: 'med_bandage', name: '绷带', type: 'consumable', subtype: 'medical', category: 'consumable', quality: 'COMMON', level: 1, price: 10, effect: { bandage: 40 }, stackable: true, maxStack: 99, desc: '包扎伤口，稳定度+40', icon: '🩹', useContext: ['medical'] },
    { id: 'med_bandage_advanced', name: '灵布绷带', type: 'consumable', subtype: 'medical', category: 'consumable', quality: 'UNCOMMON', level: 3, price: 50, effect: { bandage: 65 }, stackable: true, maxStack: 50, desc: '优质绷带，稳定度+65', icon: '🩹', useContext: ['medical'] }
];

// 医疗物品（绷带类）
window.extendedMedicalItems = [
    { id: 'med_bandage', name: '绷带', type: 'consumable', subtype: 'medical', category: 'consumable', quality: 'COMMON', level: 1, price: 10, effect: { bandage: 40 }, stackable: true, maxStack: 99, desc: '包扎伤口，稳定度+40', icon: '🩹' },
    { id: 'med_bandage_advanced', name: '灵布绷带', type: 'consumable', subtype: 'medical', category: 'consumable', quality: 'UNCOMMON', level: 3, price: 50, effect: { bandage: 65 }, stackable: true, maxStack: 50, desc: '优质绷带，稳定度+65', icon: '🩹' }
];