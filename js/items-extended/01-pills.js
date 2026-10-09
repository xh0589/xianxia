// ==================== 扩展物品 - 丹药类（45种） ====================
// 加载到 window.extendedPills, extendedBuffPills, extendedPermPills, extendedSpecialPills

// 恢复类丹药（15种）
window.extendedPills = [
    { id: 'pill_small_recovery', name: '小还丹', type: 'consumable', subtype: 'pill', category: 'consumable', quality: 'PIN9', level: 1, price: 15, effect: { hp_recovery: 30 }, stackable: true, maxStack: 99, desc: '基础疗伤丹药', icon: '💊' },
    { id: 'pill_qi_powder', name: '补气散', type: 'consumable', subtype: 'pill', category: 'consumable', quality: 'PIN9', level: 1, price: 20, effect: { qi_recovery: 20 }, stackable: true, maxStack: 99, desc: '基础恢复真气', icon: '💊' },
    { id: 'pill_energy_powder', name: '精力散', type: 'consumable', subtype: 'pill', category: 'consumable', quality: 'PIN9', level: 1, price: 15, effect: { energy_recovery: 20 }, stackable: true, maxStack: 99, desc: '基础恢复精力', icon: '💊' },
    { id: 'pill_big_recovery', name: '大还丹', type: 'consumable', subtype: 'pill', category: 'consumable', quality: 'PIN8', level: 3, price: 40, effect: { hp_recovery: 80 }, stackable: true, maxStack: 99, desc: '常见疗伤丹药', icon: '💊' },
    { id: 'pill_qi_gather', name: '聚气丹', type: 'consumable', subtype: 'pill', category: 'consumable', quality: 'PIN8', level: 3, price: 50, effect: { qi_recovery: 60 }, stackable: true, maxStack: 99, desc: '常见恢复真气', icon: '💊' },
    { id: 'pill_energy_return', name: '回力丹', type: 'consumable', subtype: 'pill', category: 'consumable', quality: 'PIN8', level: 3, price: 40, effect: { energy_recovery: 50 }, stackable: true, maxStack: 99, desc: '常见恢复精力', icon: '💊' },
    { id: 'pill_spring_recovery', name: '回春丹', type: 'consumable', subtype: 'pill', category: 'consumable', quality: 'PIN7', level: 5, price: 100, effect: { hp_recovery: 200 }, stackable: true, maxStack: 99, desc: '强力疗伤丹药', icon: '💊' },
    { id: 'pill_qi_return', name: '回灵丹', type: 'consumable', subtype: 'pill', category: 'consumable', quality: 'PIN7', level: 5, price: 120, effect: { qi_recovery: 150 }, stackable: true, maxStack: 99, desc: '强力恢复真气', icon: '💊' },
    { id: 'pill_energy_gather', name: '聚神丹', type: 'consumable', subtype: 'pill', category: 'consumable', quality: 'PIN7', level: 5, price: 100, effect: { energy_recovery: 120 }, stackable: true, maxStack: 99, desc: '强力恢复精力', icon: '💊' },
    { id: 'pill_nine_revival', name: '九转还魂丹', type: 'consumable', subtype: 'pill', category: 'consumable', quality: 'PIN5', level: 10, price: 300, effect: { hp_recovery: 500 }, stackable: true, maxStack: 50, desc: '濒死回生', icon: '💊' },
    { id: 'pill_qi_condense', name: '凝元丹', type: 'consumable', subtype: 'pill', category: 'consumable', quality: 'PIN5', level: 10, price: 350, effect: { qi_recovery: 400 }, stackable: true, maxStack: 50, desc: '大量恢复真气', icon: '💊' },
    { id: 'pill_energy_boost', name: '提神丹', type: 'consumable', subtype: 'pill', category: 'consumable', quality: 'PIN5', level: 10, price: 280, effect: { energy_recovery: 300 }, stackable: true, maxStack: 50, desc: '大量恢复精力', icon: '💊' },
    { id: 'pill_life_creation', name: '生生造化丹', type: 'consumable', subtype: 'pill', category: 'consumable', quality: 'PIN3', level: 20, price: 800, effect: { hp_recovery: 1000 }, stackable: true, maxStack: 20, desc: '传说级疗伤圣药', icon: '💊' },
    { id: 'pill_qi_return_supreme', name: '归元丹', type: 'consumable', subtype: 'pill', category: 'consumable', quality: 'PIN3', level: 20, price: 900, effect: { qi_recovery: 800 }, stackable: true, maxStack: 20, desc: '传说级真气圣药', icon: '💊' },
    { id: 'pill_triple_flower', name: '三花聚顶丹', type: 'consumable', subtype: 'pill', category: 'consumable', quality: 'PIN3', level: 25, price: 1500, effect: { full_recovery: true }, stackable: true, maxStack: 10, desc: '全面恢复圣药', icon: '💊' }
];

// ==================== 突破丹药（v9.7） ====================
window.extendedBreakthroughPills = [
    { id: 'pill_peiyuan', name: '培元丹', type: 'consumable', subtype: 'breakthrough', category: 'consumable', quality: 'PIN8', level: 3, price: 80, effect: { breakthrough_bonus: 0.10 }, stackable: true, maxStack: 20, desc: '炼气突破筑基时成功率+10%', icon: '💊', breakthroughRealm: '炼气' },
    { id: 'pill_zhuji', name: '筑基丹', type: 'consumable', subtype: 'breakthrough', category: 'consumable', quality: 'PIN7', level: 5, price: 200, effect: { breakthrough_bonus: 0.12 }, stackable: true, maxStack: 10, desc: '筑基期突破时成功率+12%', icon: '💊', breakthroughRealm: '筑基' },
    { id: 'pill_ningyuan', name: '凝元丹', type: 'consumable', subtype: 'breakthrough', category: 'consumable', quality: 'PIN7', level: 8, price: 500, effect: { breakthrough_bonus: 0.15 }, stackable: true, maxStack: 10, desc: '金丹期突破时成功率+15%', icon: '💊', breakthroughRealm: '金丹' },
    { id: 'pill_jieying', name: '结婴丹', type: 'consumable', subtype: 'breakthrough', category: 'consumable', quality: 'PIN5', level: 12, price: 1500, effect: { breakthrough_bonus: 0.18 }, stackable: true, maxStack: 5, desc: '元婴期突破时成功率+18%', icon: '💊', breakthroughRealm: '元婴' },
    { id: 'pill_huashen', name: '化神丹', type: 'consumable', subtype: 'breakthrough', category: 'consumable', quality: 'PIN5', level: 18, price: 5000, effect: { breakthrough_bonus: 0.20 }, stackable: true, maxStack: 3, desc: '化神期突破时成功率+20%', icon: '💊', breakthroughRealm: '化神' },
    // 高三境（炼虚/合体/大乘）专属丹。基准率按 breakthrough-ritual.js 的 0.8 - 境界序×0.05 逐境下滑
    // （炼虚0.55 / 合体0.50 / 大乘0.45），故三张丹的加成也必须逐境不同，且服药后落到的成功率各不相同：
    // 化神 0.60+0.20=0.80、炼虚 0.55+0.23=0.78、合体 0.50+0.25=0.75、大乘 0.45+0.27=0.72。
    // 渡劫是突破门最后一境（ritual realmList 末位即拦下，渡劫往上走天劫链），没有可买的突破，故不配丹。
    { id: 'pill_xukong', name: '虚空丹', type: 'consumable', subtype: 'breakthrough', category: 'consumable', quality: 'PIN3', level: 22, price: 8000, effect: { breakthrough_bonus: 0.23 }, stackable: true, maxStack: 3, desc: '炼虚期突破时成功率+23%（虚空雷池不稳，一丹定神）', icon: '💊', breakthroughRealm: '炼虚' },
    { id: 'pill_hebi', name: '合体丹', type: 'consumable', subtype: 'breakthrough', category: 'consumable', quality: 'PIN3', level: 26, price: 15000, effect: { breakthrough_bonus: 0.25 }, stackable: true, maxStack: 2, desc: '合体期突破时成功率+25%（身心合一，一丹难再求）', icon: '💊', breakthroughRealm: '合体' },
    { id: 'pill_dacheng', name: '大乘丹', type: 'consumable', subtype: 'breakthrough', category: 'consumable', quality: 'PIN2', level: 30, price: 28000, effect: { breakthrough_bonus: 0.27 }, stackable: true, maxStack: 2, desc: '大乘期突破时成功率+27%（大道将成，唯此一掷）', icon: '💊', breakthroughRealm: '大乘' },
    { id: 'pill_pojing', name: '破境丹', type: 'consumable', subtype: 'breakthrough', category: 'consumable', quality: 'PIN3', level: 15, price: 3000, effect: { breakthrough_bonus: 0.10 }, stackable: true, maxStack: 5, desc: '任何境界突破时成功率+10%', icon: '💊', breakthroughRealm: '通用' },
    { id: 'pill_wudao', name: '悟道丹', type: 'consumable', subtype: 'breakthrough', category: 'consumable', quality: 'PIN3', level: 20, price: 8000, effect: { breakthrough_bonus: '5~15%随机' }, stackable: true, maxStack: 3, desc: '突破时获得顿悟，额外提升5~15%成功率', icon: '💊', breakthroughRealm: '通用' },
    // 护心丹：登记废弃。它只带 protect_heart_demon、没有 breakthrough_bonus，
    // 而 inventory.js 吞突破丹只认 effect.breakthrough_bonus（数值或 '5~15%随机' 串）——
    // 于是 _bbActual 恒 0、走「暂无法使用」分支退回，丹永远扣不掉也生效不了。
    // protect_heart_demon 这个键全仓零消费者，不是"漏接线"，是消费口根本不吃它。
    // 真要「护心」得先在突破仪式里加一条心魔判定，那是新增机制，不在本批「补数据」范围。
    { id: 'pill_huxin', name: '护心丹', type: 'consumable', subtype: 'breakthrough', category: 'consumable', quality: 'PIN8', level: 3, price: 100, effect: { protect_heart_demon: true }, stackable: true, maxStack: 20, desc: '【已废弃】突破时防止心魔——该效果无任何消费口，吞下只会提示「暂无法使用」', icon: '💊', breakthroughRealm: '通用', implemented: false, deprecated: true, deprecatedReason: 'effect 缺 breakthrough_bonus，inventory.js 吞丹口只认该键；protect_heart_demon 全仓零消费者' },
    // 13-missing-ids.js 迁移来的突破丹
    { id: 'pill_breakthrough', name: '突破丹', type: 'consumable', subtype: 'breakthrough', category: 'consumable', quality: 'PIN7', level: 8, price: 500, effect: { breakthrough_bonus: 0.15 }, stackable: true, maxStack: 20, desc: '辅助境界突破的丹药', icon: '💊', breakthroughRealm: '通用' }
];

// 增益类丹药·临时（8种）— 已删除，系统无回合制buff机制
window.extendedBuffPills = [];

// 永久增益类丹药（11种，已删除转生丹）
window.extendedPermPills = [
    { id: 'pill_body_foundation', name: '培元丹', type: 'consumable', subtype: 'perm_pill', category: 'consumable', quality: 'PIN8', level: 5, price: 200, effect: { constitution_permanent: 2 }, stackable: true, maxStack: 10, desc: '强化体魄', icon: '💊' },
    { id: 'pill_meridian', name: '通脉丹', type: 'consumable', subtype: 'perm_pill', category: 'consumable', quality: 'PIN8', level: 5, price: 200, effect: { meridian_permanent: 2 }, stackable: true, maxStack: 10, desc: '疏通经脉', icon: '💊' },
    { id: 'pill_wisdom', name: '开智丹', type: 'consumable', subtype: 'perm_pill', category: 'consumable', quality: 'PIN8', level: 5, price: 200, effect: { intelligence_permanent: 2 }, stackable: true, maxStack: 10, desc: '开悟心智', icon: '💊' },
    { id: 'pill_sinew', name: '强筋丹', type: 'consumable', subtype: 'perm_pill', category: 'consumable', quality: 'PIN8', level: 5, price: 200, effect: { strength_permanent: 2 }, stackable: true, maxStack: 10, desc: '增强力量', icon: '💊' },
    { id: 'pill_dexterity', name: '灵巧丹', type: 'consumable', subtype: 'perm_pill', category: 'consumable', quality: 'PIN8', level: 5, price: 200, effect: { dexterity_permanent: 2 }, stackable: true, maxStack: 10, desc: '提升灵巧', icon: '💊' },
    { id: 'pill_willpower', name: '凝心丹', type: 'consumable', subtype: 'perm_pill', category: 'consumable', quality: 'PIN8', level: 5, price: 200, effect: { willpower_permanent: 2 }, stackable: true, maxStack: 10, desc: '坚定意志', icon: '💊' },
    { id: 'pill_foundation', name: '筑基丹', type: 'consumable', subtype: 'perm_pill', category: 'consumable', quality: 'PIN7', level: 8, price: 500, effect: { foundation_bonus: 30 }, stackable: true, maxStack: 20, desc: '筑基成功率+30%', icon: '💊' },
    { id: 'pill_golden_core', name: '金丹丹', type: 'consumable', subtype: 'perm_pill', category: 'consumable', quality: 'PIN5', level: 15, price: 2000, effect: { core_bonus: 20 }, stackable: true, maxStack: 10, desc: '凝结金丹成功率+20%', icon: '💊' },
    { id: 'pill_primordial', name: '元婴丹', type: 'consumable', subtype: 'perm_pill', category: 'consumable', quality: 'PIN5', level: 18, price: 5000, effect: { primordial_bonus: 15 }, stackable: true, maxStack: 10, desc: '凝结元婴成功率+15%', icon: '💊' },
    { id: 'pill_marrow_wash', name: '洗髓丹', type: 'consumable', subtype: 'perm_pill', category: 'consumable', quality: 'PIN5', level: 20, price: 3000, effect: { all_attr_permanent: 5 }, stackable: true, maxStack: 5, desc: '脱胎换骨', icon: '💊' },
    { id: 'pill_divine', name: '化神丹', type: 'consumable', subtype: 'perm_pill', category: 'consumable', quality: 'PIN3', level: 25, price: 15000, effect: { divine_bonus: 10 }, stackable: true, maxStack: 5, desc: '化神成功率+10%', icon: '💊' },
    { id: 'pill_sutra_change', name: '易经丹', type: 'consumable', subtype: 'perm_pill', category: 'consumable', quality: 'PIN3', level: 30, price: 10000, effect: { all_attr_permanent: 15 }, stackable: true, maxStack: 3, desc: '易经洗髓', icon: '💊' }
];

// 特殊丹药（6种，已删除定颜丹，避毒丹标记implemented:false，修复效果键别名）
window.extendedSpecialPills = [
    { id: 'pill_poison_resist', name: '避毒丹', type: 'consumable', subtype: 'special_pill', category: 'consumable', quality: 'PIN8', level: 3, price: 80, effect: { poison_resist: 50, duration: 1440 }, stackable: true, maxStack: 30, desc: '毒抗+50%持续1天', icon: '💊', implemented: false },
    { id: 'pill_antidote', name: '解毒丹', type: 'consumable', subtype: 'special_pill', category: 'consumable', quality: 'PIN8', level: 3, price: 50, effect: { cure_poison: true }, stackable: true, maxStack: 50, desc: '解除中毒状态', icon: '💊' },
    { id: 'pill_fasting', name: '辟谷丹', type: 'consumable', subtype: 'special_pill', category: 'consumable', quality: 'PIN9', level: 1, price: 20, effect: { energy_recovery: 50 }, stackable: true, maxStack: 99, desc: '服之腹中饱足、轻身益气（精力+50）', icon: '💊' },
    { id: 'pill_clarity', name: '清明丹', type: 'consumable', subtype: 'special_pill', category: 'consumable', quality: 'PIN8', level: 3, price: 60, effect: { cure_confusion: true }, stackable: true, maxStack: 30, desc: '解除混乱状态', icon: '💊' },
    { id: 'pill_forget_sorrow', name: '忘忧丹', type: 'consumable', subtype: 'special_pill', category: 'consumable', quality: 'PIN7', level: 5, price: 150, effect: { remove_negative_emotion: true }, stackable: true, maxStack: 20, desc: '消除负面情绪', icon: '💊' },
    { id: 'pill_life_extend', name: '延寿丹', type: 'consumable', subtype: 'special_pill', category: 'consumable', quality: 'PIN5', level: 15, price: 10000, effect: { lifespan_years: 10 }, stackable: true, maxStack: 5, desc: '寿命+10年', icon: '💊' },
    { id: 'pill_hemostatic', name: '止血丹', type: 'consumable', subtype: 'special_pill', category: 'consumable', quality: 'PIN8', level: 3, price: 80, effect: { hemostatic: true }, stackable: true, maxStack: 50, desc: '全身外出血减半，内出血停止累积', icon: '💊' }
];

// 医疗物品（绷带类）—— items-extended.js 在载入后合并这一张表，下面不许再来一份同名赋值（后写的那份会静默赢）
window.extendedMedicalItems = [
    { id: 'med_bandage', name: '绷带', type: 'consumable', subtype: 'medical', category: 'consumable', quality: 'PIN9', level: 1, price: 10, effect: { bandage: 40 }, stackable: true, maxStack: 99, desc: '包扎伤口，稳定度+40', icon: '🩹', useContext: ['medical'] },
    { id: 'med_bandage_advanced', name: '灵布绷带', type: 'consumable', subtype: 'medical', category: 'consumable', quality: 'PIN8', level: 3, price: 50, effect: { bandage: 65 }, stackable: true, maxStack: 50, desc: '优质绷带，稳定度+65', icon: '🩹', useContext: ['medical'] }
];

// ==================== 废弃登记簿 ====================
// 禁止设计 #4：名册/注册表类结构不要留占位假值——要么填真实 ID，要么不写该字段。
// 下面这几件是**实测零外部引用**（扫全 js、按 仙侠.html 挂载顺序逐 id 数引用），
// 且**设计上就不该给玩家**。它们不是「忘了接线」，接线了也是错的——所以登记废弃、说明缘由，
// 而不是静默留一张玩家永远拿不到的空表。
//
// ★刻意不登记的（实测有真实发放点，登记废弃反而是撒谎）★
//   spec_spirit_stone 灵石    —— npc-emotions.js:86 赠礼、app.js:8239 奖励
//   spec_spirit_crystal 灵晶  —— 12-quest-extensions.js:202/:302 任务奖励
//   spec_enhance_stone 强化石  —— loot-system.js:377 掉落表 + 商店（desc 里的"预留"是陈年文案，货是真的）
//   qiyu_* 奇遇奇物 10 件     —— extensions/qiyu-encounters.js:104/:302/:304 effects.items[].itemId 真发放
//     （qiyuOnly 只是"不上货架不上拍卖"，不是"不存在"；撞见奇遇就拿得到）
window.DEPRECATED_ITEMS = {
    spec_mid_spirit_stone: {
        reason: '灵石四档冗余：真货币是 currency.spiritStones 一个数（EconomyTransaction.getBalance/debit）。' +
            '中品灵石没有任何发放点，造出来即占位假值。',
        replacement: 'currency.spiritStones',
        verifiedZeroRefs: true
    },
    spec_high_spirit_stone: {
        reason: '灵石四档冗余，同中品灵石：真货币是 currency.spiritStones 一个数。' +
            '上品灵石没有任何发放点，造出来即占位假值。',
        replacement: 'currency.spiritStones',
        verifiedZeroRefs: true
    },
    spec_supreme_spirit_stone: {
        reason: '灵石四档冗余，同中品灵石：真货币是 currency.spiritStones 一个数。' +
            '极品灵石没有任何发放点；PIN3 不可达 25 件里唯一一件属 B 类——不接线是对的。',
        replacement: 'currency.spiritStones',
        verifiedZeroRefs: true
    },
    spec_token: {
        reason: '身份标记物品，无任何发放/校验点。真身份标识走 quest 账与 NPC 关系账，' +
            '不靠一件物品；挂着它只会让玩家以为有身份系统。',
        replacement: '(quest 账 / NPC 关系账)',
        verifiedZeroRefs: true
    },
    pill_huxin: {
        reason: 'effect 只有 protect_heart_demon，没有 breakthrough_bonus；' +
            'inventory.js 吞突破丹只认 effect.breakthrough_bonus（数值或 "5~15%随机" 串），' +
            '故 _bbActual 恒 0 → 走「暂无法使用」分支退回，丹扣不掉也生效不了。' +
            'protect_heart_demon 全仓零消费者。真做「护心」要在突破仪式里加心魔判定＝新增机制，不在补数据范围。',
        replacement: '(待实现：突破仪式心魔判定)',
        verifiedZeroRefs: true
    }
};
