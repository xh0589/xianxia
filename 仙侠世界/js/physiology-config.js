// ==================== 仙路长青 - 生理系统配置 ====================
// 机体扩展实施方案 v4.1 — 生理平衡参数、部位敏感性、伤害类型效果
// 修订：health→bloodVolume、oxygenDebt、危急计时、疼痛系统重做
// v4.1：头/颈/胸耐久归零=肉体尽毁直接死亡（不用 CHEST/NECK_ZERO 惩罚）

// ============ 生理平衡参数 ============
const PHYSIOLOGY_CONFIG = {
    // 全局血量（v4.0: health 语义改为 bloodVolume）
    MAX_BLOOD_VOLUME: 100,        // 最大血量（百分比制）
    MAX_HEALTH: 100,              // 兼容旧字段，等同 MAX_BLOOD_VOLUME
    MAX_CIRCULATION: 100,         // 最大循环血量
    MAX_CONSCIOUSNESS: 100,       // 最大意识值
    MAX_BREATHING: 100,           // 最大呼吸效率
    MAX_STAMINA: 100,             // 最大体力
    MAX_PAIN: 100,                // 疼痛上限
    MAX_NEURAL_SHOCK: 100,        // 神经冲击上限
    MAX_OXYGEN_DEBT: 100,         // 缺氧负担上限

    // 伤口相关
    WOUND_ID_PREFIX: 'wound_',    // 伤口ID前缀
    BASE_CLOTTING_RATE: 2,        // 基础凝血速度（每回合，包扎后加快）
    STABILIZATION_NATURAL_RECOVERY: 2, // 稳定度每回合自然恢复
    CLOTTING_COMPLETE_THRESHOLD: 100,  // 凝血完成阈值
    STABILIZATION_BANDAGE_BOOST: 40,   // 包扎增加的稳定度
    STABILIZATION_MAX: 100,            // 稳定度上限

    // 意识阈值
    CONSCIOUSNESS_ALERT: 71,      // 正常
    CONSCIOUSNESS_IMPAIRED: 51,   // 受损
    CONSCIOUSNESS_DIZZY: 31,      // 眩晕
    CONSCIOUSNESS_COLLAPSED: 11,  // 倒地
    CONSCIOUSNESS_UNCONSCIOUS: 1, // 昏迷

    // 意识惩罚阈值
    CIRCULATION_PENALTY_THRESHOLD: 60,  // 循环低于此值开始惩罚
    BREATHING_PENALTY_THRESHOLD: 60,    // 呼吸低于此值开始惩罚
    PAIN_PENALTY_THRESHOLD: 60,         // 疼痛高于此值开始惩罚
    NEURAL_SHOCK_MULTIPLIER: 0.6,       // 神经冲击对意识的影响系数
    HEAD_TRAUMA_MULTIPLIER: 0.3,        // 头部创伤对意识的影响系数
    BLOOD_VOLUME_CONSCIOUSNESS_THRESHOLD: 20, // bloodVolume < 20 强制降低意识

    // 出血参数
    EXTERNAL_BLEED_DAMAGE_FACTOR: 0.055, // 外出血每点速率每秒扣血系数
    INTERNAL_BLEED_CIRCULATION_FACTOR: 0.3, // 内出血对循环的影响系数
    NEURAL_SHOCK_DECAY: 4,             // 神经冲击每回合衰减量

    // ===== v4.1 缺氧系统（平衡）=====
    // 供氧=0 时每回合 +15 债 → 约 7 回合满 100 昏迷+危急
    // 供氧=30 时每回合 +7.5 → 约 14 回合满
    OXYGEN_SUPPLY_THRESHOLD: 60,       // 供氧低于此值开始累积缺氧
    OXYGEN_DEBT_RATE: 0.25,            // 缺氧累积：(threshold-supply)*rate
    OXYGEN_DEBT_RECOVERY: 6,           // 供氧充足时每回合清除缺氧量
    OXYGEN_DEBT_FAINT_THRESHOLD: 100,  // 缺氧≥100 强制昏迷+危急

    // ===== v4.1 危急计时（平衡）=====
    // 战斗每回合 6 秒 = 0.1 游戏分钟；5 分钟 = 50 回合救治窗口
    // v12.4：实际救治窗口按难度读取 getCriticalTimerMinutes()，
    // 本常量保留为标准档（normal）参考值，供无难度环境回落使用
    CRITICAL_TIMER_MINUTES: 5,         // 危急持续游戏分钟（到则死亡）【标准档】
    CRITICAL_TIMER_PER_TURN: 0.1,      // 每回合推进的游戏分钟
    // 触发：circulation<=0 / oxygenDebt>=100 / 贯穿关键结构
    // 不触发：头/颈/胸耐久归零（直接死亡）

    // ===== v4.0 贯穿伤关键结构概率 =====
    PERFORATION_CRITICAL_BASE: 0.3,    // depth=4 时 30%；(depth-3)*0.3

    // ===== 已废弃：胸/颈归零惩罚（v4.1 改为直接死亡，保留常量防旧引用）=====
    CHEST_ZERO_BREATHING_PENALTY: 30,  // @deprecated v4.1 未使用
    CHEST_ZERO_CIRCULATION_PENALTY: 20,
    NECK_ZERO_BREATHING_PENALTY: 50,
    NECK_ZERO_CIRCULATION_PENALTY: 30,

    // ===== v4.0 新增：丹田被毁效果（不死亡）=====
    DANTIAN_DESTROY_PAIN_BOOST: 50,
    DANTIAN_DESTROY_CIRCULATION_PENALTY: 30,

    // 生理模板参数
    BEAST_PAIN_THRESHOLD_BONUS: 50,    // 野兽疼痛阈值加成（%）
    BEAST_HEALTH_MULTIPLIER: 1.5,      // 野兽血量倍率
    UNDEAD_EXTRA_DAMAGE_FIRE: 1.5,     // 亡灵受到火焰额外伤害
    UNDEAD_EXTRA_DAMAGE_HOLY: 1.5,     // 亡灵受到神圣额外伤害
    CONSTRUCT_EXTRA_DAMAGE_THUNDER: 1.5, // 构装体受到雷电额外伤害
};

// ============ v4.0 疼痛系统效果 ============
// 平滑过渡：hitPenalty = -painLoad*0.5, dodgePenalty = -painLoad*0.4, actionFailRate = painLoad*0.008
// 疼痛=100 强制昏迷；意志抵抗：每点意志抵抗 0.5% 疼痛
const PAIN_EFFECTS = {
    // 阈值参考表（实际用平滑公式）
    threshold: {
        0:   { hitPenalty: 0,   dodgePenalty: 0,   actionFailRate: 0 },
        25:  { hitPenalty: -5,  dodgePenalty: -3,  actionFailRate: 0.05 },
        50:  { hitPenalty: -12, dodgePenalty: -8,  actionFailRate: 0.15 },
        75:  { hitPenalty: -22, dodgePenalty: -15, actionFailRate: 0.30 },
        90:  { hitPenalty: -35, dodgePenalty: -25, actionFailRate: 0.50 },
        100: { hitPenalty: -50, dodgePenalty: -40, actionFailRate: 0.80 }
    },
    hitPenaltyFactor: 0.5,       // hitPenalty = -painLoad * 0.5
    dodgePenaltyFactor: 0.4,     // dodgePenalty = -painLoad * 0.4
    actionFailFactor: 0.008,     // actionFailRate = painLoad * 0.008
    faintingAtMax: true,         // 疼痛=100 强制昏迷
    willpowerResistance: 0.5,    // 每点意志抵抗 0.5% 疼痛
};

// ============ v4.0 缺氧效果阈值 ============
const OXYGEN_DEBT_EFFECTS = {
    0:  { label: '正常', hitPenalty: 0, dodgePenalty: 0, interrupt: false },
    30: { label: '轻微不适', hitPenalty: 0, dodgePenalty: 0, interrupt: false },
    50: { label: '缺氧', hitPenalty: -10, dodgePenalty: -10, interrupt: false },
    70: { label: '眩晕', hitPenalty: -15, dodgePenalty: -15, interrupt: true },
    99: { label: '倒地', hitPenalty: -30, dodgePenalty: -30, interrupt: true },
    100: { label: '强制昏迷', hitPenalty: -50, dodgePenalty: -50, interrupt: true, critical: true }
};

// ============ v4.0 危急原因标签 ============
const CRITICAL_CAUSE_LABELS = {
    'circulation_failure': '循环崩溃',
    'hypoxia': '严重缺氧',
    'brain_destroyed': '脑部损毁',
    'brain_perforation': '脑部贯穿',
    'brain_vital_damage': '脑部致命损伤',
    'severe_brain_trauma': '严重脑创伤',
    'chest_perforation': '胸部贯穿',
    'neck_perforation': '颈部贯穿',
    'dantian_destroyed': '丹田尽毁',
    // v4.2 关键伤标签
    'lung_contusion': '肺部挫伤',
    'lung_perforation': '肺部穿孔',
    'major_internal_bleeding': '严重内出血',
    'heart_damage': '心脏损伤',
    'cardiac_shock': '心源性休克',
    'airway_failure': '气道阻塞',
    'airway_damage': '气道损伤',
    'major_vessel_damage': '大血管破裂',
    'spinal_damage': '脊髓损伤',
    'organ_perforation': '脏器穿孔',
    'limb_major_bleeding': '肢体大出血'
};

// ============ v4.2 关键伤配置表 ============
// 根据部位+伤害类型，决定可能产生的关键伤标签
const CRITICAL_INJURIES = {
    brain: {
        blunt: ['severe_brain_trauma'],
        pierce: ['brain_vital_damage'],
        slash: ['brain_vital_damage']
    },
    head: {
        blunt: ['skull_fracture', 'severe_concussion'],
        pierce: ['skull_perforation'],
        slash: ['severe_concussion']
    },
    chest: {
        blunt: ['lung_contusion', 'cardiac_shock'],
        pierce: ['lung_perforation', 'heart_damage', 'major_internal_bleeding'],
        slash: ['major_internal_bleeding']
    },
    neck: {
        blunt: ['airway_damage', 'spinal_damage'],
        pierce: ['airway_failure', 'major_vessel_damage', 'spinal_damage'],
        slash: ['airway_failure', 'major_vessel_damage']
    },
    abdomen: {
        blunt: ['major_internal_bleeding'],
        pierce: ['organ_perforation', 'major_internal_bleeding']
    },
    leftLeg: { slash: ['limb_major_bleeding'], pierce: ['limb_major_bleeding'] },
    rightLeg: { slash: ['limb_major_bleeding'], pierce: ['limb_major_bleeding'] }
};

// ============ v4.2 关键伤效果表 ============
// outcome: death=即时致命, critical=进入危急(不同回合数), function=功能下降
// criticalRounds: 救治窗口回合数（15轮≈1.5分钟, 30轮≈3分钟, 50轮≈5分钟）
const CRITICAL_EFFECTS = {
    lung_contusion: {
        outcome: 'function',
        breathingLoss: 25,
        internalBleed: 12
    },
    lung_perforation: {
        outcome: 'critical',
        breathingLoss: 45,
        internalBleed: 30,
        criticalRounds: 40
    },
    major_internal_bleeding: {
        outcome: 'critical',
        internalBleed: 55,
        criticalRounds: 50
    },
    heart_damage: {
        outcome: 'critical',
        circulationLoss: 70,
        criticalRounds: 15
    },
    cardiac_shock: {
        outcome: 'critical',
        circulationLoss: 40,
        criticalRounds: 25
    },
    airway_failure: {
        outcome: 'critical',
        breathingLoss: 100,
        criticalRounds: 30
    },
    airway_damage: {
        outcome: 'function',
        breathingLoss: 30
    },
    spinal_damage: {
        outcome: 'function',
        spinalEffect: true
    },
    major_vessel_damage: {
        outcome: 'critical',
        internalBleed: 60,
        criticalRounds: 35
    },
    severe_brain_trauma: {
        outcome: 'critical',
        consciousnessCap: 10,
        criticalRounds: 20
    },
    brain_vital_damage: {
        outcome: 'death'
    },
    organ_perforation: {
        outcome: 'critical',
        internalBleed: 40,
        criticalRounds: 45
    },
    limb_major_bleeding: {
        outcome: 'critical',
        internalBleed: 25,
        criticalRounds: 50
    },
    skull_fracture: {
        outcome: 'critical',
        consciousnessCap: 20,
        internalBleed: 15,
        criticalRounds: 30
    },
    skull_perforation: {
        outcome: 'death'
    },
    severe_concussion: {
        outcome: 'function',
        consciousnessCap: 30,
        neuralShock: 20
    }
};

// ============ 部位敏感性修正 ============
// bleed: 出血系数（>1更容易出血，<1更不易出血）
// pain: 疼痛系数（>1更痛，<1更不痛）
// breath: 呼吸影响系数（>1对呼吸影响更大）
const PART_PHYSIOLOGY_MODIFIERS = {
    'brain':    { bleed: 1.8, pain: 1.5, breath: 0.8 },  // 脑：血供极丰富，疼痛敏感
    'eyes':     { bleed: 1.0, pain: 1.2, breath: 0.0 },
    'jaw':      { bleed: 1.2, pain: 1.3, breath: 0.3 },
    'head':     { bleed: 1.6, pain: 1.5, breath: 0.5 },  // 头：高血供+高疼痛
    'neck':     { bleed: 2.0, pain: 1.4, breath: 0.6 },  // 颈：大血管集中
    'chest':    { bleed: 1.2, pain: 1.1, breath: 0.8 },  // 胸：影响呼吸
    'abdomen':  { bleed: 1.3, pain: 1.2, breath: 0.4 },  // 腹：内出血风险高
    'dantian':  { bleed: 1.0, pain: 1.0, breath: 0.0 },  // 丹田：修仙特殊
    'waist':    { bleed: 0.9, pain: 0.9, breath: 0.0 },
    'pelvis':   { bleed: 1.1, pain: 1.0, breath: 0.0 },
    'upperArmL': { bleed: 1.0, pain: 0.8, breath: 0.0 },
    'upperArmR': { bleed: 1.0, pain: 0.8, breath: 0.0 },
    'forearmL':  { bleed: 0.8, pain: 0.7, breath: 0.0 },
    'forearmR':  { bleed: 0.8, pain: 0.7, breath: 0.0 },
    'handL':     { bleed: 0.7, pain: 0.9, breath: 0.0 }, // 手：血供中等
    'handR':     { bleed: 0.7, pain: 0.9, breath: 0.0 },
    'thighL':    { bleed: 1.4, pain: 0.8, breath: 0.0 }, // 大腿：大动脉
    'thighR':    { bleed: 1.4, pain: 0.8, breath: 0.0 },
    'calfL':     { bleed: 1.0, pain: 0.7, breath: 0.0 },
    'calfR':     { bleed: 1.0, pain: 0.7, breath: 0.0 },
    'footL':     { bleed: 0.8, pain: 0.8, breath: 0.0 },
    'footR':     { bleed: 0.8, pain: 0.8, breath: 0.0 }
};

// ============ 伤害类型效果 ============
// 每种伤害类型对外出血/内出血/疼痛/结构损伤/神经冲击的影响
// 等级: 0=无, 1=低, 2=中, 3=高
const DAMAGE_TYPE_EFFECTS = {
    'blunt': {   // 钝器：拳掌、棍棒、锤
        externalBleed: 1,     // 低外出血
        internalBleed: 3,     // 高内出血
        pain: 3,              // 高疼痛
        structuralDamage: 3,  // 高结构损伤
        neuralShock: 2,       // 中神经冲击
        fractureChance: 0.3,  // 30%骨折概率
        desc: '钝器伤害'
    },
    'slash': {   // v9.8 切割：刀剑、爪
        externalBleed: 3,
        internalBleed: 1,
        pain: 2,
        structuralDamage: 2,
        neuralShock: 1,
        fractureChance: 0.05,
        desc: '切割伤害'
    },
    'sharp': {   // 兼容别名 → 与 slash 相同
        externalBleed: 3,
        internalBleed: 1,
        pain: 2,
        structuralDamage: 2,
        neuralShock: 1,
        fractureChance: 0.05,
        desc: '锐器伤害(兼容slash)'
    },
    'pierce': {  // 穿刺：矛、箭、刺
        externalBleed: 2,     // 中外出血
        internalBleed: 2,     // 中内出血
        pain: 2,              // 中疼痛
        structuralDamage: 2,  // 中结构损伤
        neuralShock: 2,       // 中神经冲击
        fractureChance: 0.1,  // 10%骨折概率
        desc: '穿刺伤害'
    },
    'fire': {    // 火焰：火焰法术
        externalBleed: 1,     // 低外出血（烧伤也会渗血）
        internalBleed: 0,     // 无内出血
        pain: 3,              // 高疼痛
        structuralDamage: 2,  // 中结构损伤（烧伤组织）
        neuralShock: 1,       // 低神经冲击
        fractureChance: 0,
        desc: '火焰伤害'
    },
    'cold': {    // 冰霜：冰霜法术
        externalBleed: 0,     // 无外出血（冻伤）
        internalBleed: 0,     // 无内出血
        pain: 2,              // 中疼痛（冻伤）
        structuralDamage: 1,  // 低结构损伤
        neuralShock: 1,       // 低神经冲击
        fractureChance: 0,
        desc: '冰霜伤害'
    },
    'thunder': { // 雷电：雷电法术
        externalBleed: 0,     // 无外出血
        internalBleed: 0,     // 无内出血
        pain: 1,              // 低疼痛（麻痹感）
        structuralDamage: 1,  // 低结构损伤
        neuralShock: 3,       // 高神经冲击
        fractureChance: 0,
        desc: '雷电伤害'
    }
};

// ============ 内出血模糊描述 ============
function getInternalBleedDescription(rate) {
    if (rate <= 0) return '无';
    if (rate < 5) return '疑似';
    if (rate < 15) return '轻微';
    if (rate < 30) return '明显';
    if (rate < 50) return '严重';
    return '危急';
}

// ============ 外出血模糊描述 ============
function getExternalBleedDescription(rate) {
    if (rate <= 0) return '无';
    if (rate < 5) return '渗血';
    if (rate < 15) return '轻量出血';
    if (rate < 30) return '明显出血';
    if (rate < 50) return '大量出血';
    return '危急出血';
}

// ============ 伤口严重度描述 ============
function getWoundSeverityDescription(severity) {
    if (severity <= 0) return '无';
    if (severity < 15) return '轻微';
    if (severity < 30) return '轻度';
    if (severity < 50) return '中度';
    if (severity < 70) return '重度';
    return '致命';
}

// ============ 意识状态名称 ============
function getConsciousnessStateName(value) {
    if (value >= 71) return 'alert';
    if (value >= 51) return 'impaired';
    if (value >= 31) return 'dizzy';
    if (value >= 11) return 'collapsed';
    if (value >= 1) return 'unconscious';
    return 'unconscious';
}

function getConsciousnessStateLabel(value) {
    if (value >= 71) return '清醒';
    if (value >= 51) return '恍惚';
    if (value >= 31) return '眩晕';
    if (value >= 11) return '倒地';
    if (value >= 1) return '濒死';
    return '昏迷';
}

// ============ 生理参数验证 ============
function validatePhysiologyConfig() {
    const issues = [];
    // 检查部位敏感性是否覆盖所有22个部位
    const expectedParts = (typeof window !== 'undefined' && Array.isArray(window.BODY_PARTS)) ? window.BODY_PARTS : [];
    if (expectedParts.length > 0) {
        expectedParts.forEach(part => {
            if (!PART_PHYSIOLOGY_MODIFIERS[part.id]) {
                issues.push('缺少部位: ' + part.id);
            }
        });
    }
    // 检查伤害类型是否覆盖
    const expectedTypes = ['blunt', 'slash', 'sharp', 'pierce', 'fire', 'cold', 'thunder'];
    expectedTypes.forEach(type => {
        if (!DAMAGE_TYPE_EFFECTS[type]) {
            issues.push('缺少伤害类型: ' + type);
        }
    });
    // 检查核心参数是否合理
    if (PHYSIOLOGY_CONFIG.EXTERNAL_BLEED_DAMAGE_FACTOR > 0.5) {
        issues.push('外出血系数过高，可能导致血量瞬间归零');
    }
    if (PHYSIOLOGY_CONFIG.NEURAL_SHOCK_DECAY < 1) {
        issues.push('神经冲击衰减过慢');
    }
    if (PHYSIOLOGY_CONFIG.BASE_CLOTTING_RATE < 0.5) {
        issues.push('凝血速度过慢');
    }
    if (issues.length > 0) {
        console.warn('[生理配置] 验证发现问题:', issues);
    } else {
        console.log('[生理配置] 验证通过，所有参数合理');
    }
    return issues;
}

// v12.4 难度条件栏：危急救治窗口（分钟）按难度读取
// （宽松 50回合=5分钟 / 标准 35回合=3.5分钟 / 凶险 20回合=2分钟）
// 无难度环境（difficulty-config.js 未加载）回落到标准档常量 CRITICAL_TIMER_MINUTES
function getCriticalTimerMinutes() {
    try {
        if (typeof window !== 'undefined' && typeof window.getDifficultyParam === 'function') {
            var turns = window.getDifficultyParam('criticalTurns');
            if (typeof turns === 'number' && turns > 0) {
                return turns * (PHYSIOLOGY_CONFIG.CRITICAL_TIMER_PER_TURN || 0.1);
            }
        }
    } catch (e) {}
    return PHYSIOLOGY_CONFIG.CRITICAL_TIMER_MINUTES;
}

// 配置在本文件内已完整定义，可同步验证，不需要延迟。
if (typeof window !== 'undefined') validatePhysiologyConfig();

// ============ 导出到 window ============
window.PHYSIOLOGY_CONFIG = PHYSIOLOGY_CONFIG;
window.PART_PHYSIOLOGY_MODIFIERS = PART_PHYSIOLOGY_MODIFIERS;
window.DAMAGE_TYPE_EFFECTS = DAMAGE_TYPE_EFFECTS;
window.PAIN_EFFECTS = PAIN_EFFECTS;
window.OXYGEN_DEBT_EFFECTS = OXYGEN_DEBT_EFFECTS;
window.CRITICAL_CAUSE_LABELS = CRITICAL_CAUSE_LABELS;
window.CRITICAL_INJURIES = CRITICAL_INJURIES;
window.CRITICAL_EFFECTS = CRITICAL_EFFECTS;
window.validatePhysiologyConfig = validatePhysiologyConfig;
window.getInternalBleedDescription = getInternalBleedDescription;
window.getExternalBleedDescription = getExternalBleedDescription;
window.getWoundSeverityDescription = getWoundSeverityDescription;
window.getConsciousnessStateName = getConsciousnessStateName;
window.getConsciousnessStateLabel = getConsciousnessStateLabel;
window.getCriticalTimerMinutes = getCriticalTimerMinutes;
window.validatePhysiologyConfig = validatePhysiologyConfig;