// ==================== battle.js (v13.0 - 战斗技能系统版) ====================
// 基于部位耐久的战斗系统 + 生理系统（5种生物模板/伤口/意识/出血）
// v13.0：将 v12.8/v12.9 的"亚型=固定机制包"重构为敌人战斗技能系统——
//   人形敌人 = 身份模板（前缀/武器倾向/AI姿态/招牌技）+ 从共享池随机抽取的额外技能，
//   同一种类两个敌人实战表现可以不同；全部机制判断一律查 COMBAT_ABILITIES 注册表（Entity.hasAbility）。

// ---------- 部位定义 ----------
// stat 使用英文键，与 attrs 对象键名一致
const BODY_PARTS = [
    { id: 'brain', label: '脑', stat: 'intelligence' },
    { id: 'eyes', label: '眼', stat: 'dexterity' },
    { id: 'jaw', label: '下颌', stat: 'willpower' },
    { id: 'head', label: '头', stat: 'constitution' },
    { id: 'neck', label: '颈', stat: 'constitution' },
    { id: 'chest', label: '胸', stat: 'strength' },
    { id: 'abdomen', label: '腹', stat: 'constitution' },
    { id: 'dantian', label: '丹田', stat: 'meridian' },
    { id: 'waist', label: '腰', stat: 'dexterity' },
    { id: 'pelvis', label: '盆', stat: 'willpower' },
    { id: 'upperArmL', label: '左上臂', stat: 'strength' },
    { id: 'upperArmR', label: '右上臂', stat: 'strength' },
    { id: 'forearmL', label: '左下臂', stat: 'dexterity' },
    { id: 'forearmR', label: '右下臂', stat: 'dexterity' },
    { id: 'handL', label: '左手', stat: 'dexterity' },
    { id: 'handR', label: '右手', stat: 'dexterity' },
    { id: 'thighL', label: '左大腿', stat: 'strength' },
    { id: 'thighR', label: '右大腿', stat: 'strength' },
    { id: 'calfL', label: '左小腿', stat: 'constitution' },
    { id: 'calfR', label: '右小腿', stat: 'constitution' },
    { id: 'footL', label: '左脚', stat: 'dexterity' },
    { id: 'footR', label: '右脚', stat: 'dexterity' },
];

// 部位索引映射（用于快速访问）
const PART_IDS = BODY_PARTS.map(p => p.id);

// ---------- 武器类型 → 战斗技能映射（批次B） ----------
const WEAPON_SKILL_MAP = {
    // 剑类
    'sword': '剑法',
    'dagger': '剑法',
    'rapier': '剑法',
    'greatsword': '剑法',
    'longsword': '剑法',
    // 刀类
    'blade': '刀法',
    'knife': '刀法',
    'axe': '刀法',
    'saber': '刀法',
    'cleaver': '刀法',
    // 长兵
    'staff': '长兵',
    'spear': '长兵',
    'polearm': '长兵',
    'halberd': '长兵',
    'lance': '长兵',
    // 射术
    'bow': '射术',
    'crossbow': '射术',
    // 拳掌
    'fist': '拳掌',
    'glove': '拳掌',
    'gauntlet': '拳掌',
    // 奇门
    'claw': '奇门',
    'whip': '奇门',
    'chain': '奇门',
    'hidden': '奇门',
    'fan': '奇门',
};

function getWeaponSkillName(weaponId) {
    if (!weaponId) return null;
    const template = window.itemById ? window.itemById[weaponId] : null;
    if (!template) return null;
    const weaponType = template.weaponType || template.type || 'sword';
    return WEAPON_SKILL_MAP[weaponType] || null;
}

function getPlayerWeaponSkill() {
    const skills = (typeof window.getCurrentCharData === 'function'
        ? (window.getCurrentCharData() || {}).combatSkills
        : null) || window.currentCharData?.combatSkills || {};
    if (!window.currentEquipment || !window.currentEquipment.mainHand) {
        return skills['拳掌'] || 0;
    }
    const weapon = window.currentEquipment.mainHand;
    const skillName = getWeaponSkillName(weapon.id || weapon.templateId);
    if (!skillName) return skills['拳掌'] || 0;
    return skills[skillName] || 0;
}

/** v9.8：解析当前主手伤害类型 slash/pierce/blunt */
function resolveWeaponDamageType() {
    if (!window.currentEquipment || !window.currentEquipment.mainHand) return 'blunt';
    const weapon = window.currentEquipment.mainHand;
    const tpl = window.itemById ? window.itemById[weapon.templateId || weapon.id] : null;
    let dt = weapon.damageType || (tpl && tpl.damageType) || null;
    if (!dt && tpl) {
        const wt = tpl.weaponType || tpl.subtype || '';
        const map = {
            sword: 'slash', longsword: 'slash', greatsword: 'slash',
            rapier: 'pierce', dagger: 'pierce',
            blade: 'slash', knife: 'slash', saber: 'slash', cleaver: 'slash', axe: 'slash', dao: 'slash',
            staff: 'blunt', spear: 'pierce', lance: 'pierce', polearm: 'pierce', halberd: 'slash',
            bow: 'pierce', crossbow: 'pierce',
            fist: 'blunt', glove: 'blunt', gauntlet: 'blunt', gauntlets: 'blunt',
            claw: 'slash', whip: 'blunt', chain: 'blunt', hidden: 'pierce', fan: 'blunt'
        };
        dt = map[wt] || 'slash';
    }
    if (!dt) dt = 'slash';
    if (dt === 'sharp') dt = 'slash';
    return dt;
}
window.resolveWeaponDamageType = resolveWeaponDamageType;

// ==================== v13.0 敌人战斗技能注册表 ====================
// 全部战斗机制（接触/受击结算/遁逃/剑修连击等）以本表 id 为唯一判定来源，不再挂在敌人身份布尔字段上。
const COMBAT_ABILITIES = {
    // 人形共享池（generateRandomEnemy 内 rollHumanoidAbilities 加权抽取）
    venom:       { name: '施毒',     desc: '命中附加毒素负荷' },
    gu_parasite: { name: '金蚕蛊',   desc: '上毒×1.5并种蛊啃噬筋骨' },
    lifesteal:   { name: '吸血功',   desc: '实际伤害30%转化为自身气血' },
    reflect:     { name: '铁体功',   desc: '受击反震20%钝伤（不连锁）' },
    soundwave:   { name: '摄魂音',   desc: '神魂震荡+疼痛' },
    illusion:    { name: '迷魂术',   desc: '叠加迷扰层，目标命中率-15/层' },
    escape:      { name: '遁术',     desc: '残血概率遁走（无战利品）' },
    drain_qi:    { name: '采补功',   desc: '摄取玩家真气转化气血' },
    sword_burst: { name: '剑气纵横', desc: '暴击率+12%，第3有效击×1.25' },
    // 种系天生技（不进人形共享池）
    hardened:    { name: '硬化',     desc: '受击伤害×0.75消耗一层充能' },
    pounce:      { name: '猛扑',     desc: '首次进攻伤害×1.3' },
    chill:       { name: '寒冰真气', desc: '命中置目标寒冷（下一击命中率-10）' },
    burn:        { name: '炎爆劲',   desc: '命中附加灼烧疼痛' },
};
// v13.0 技能显示名：undead 的 venom 复用同一机制，显示名按生理类型取「尸毒」
function getCombatAbilityName(id, entity) {
    const def = COMBAT_ABILITIES[id];
    if (!def) return id;
    if (id === 'venom' && entity && entity.physiology && entity.physiology.type === 'undead') return '尸毒';
    return def.name;
}
// 只读冻结：注册表对外仅暴露查询视图
Object.keys(COMBAT_ABILITIES).forEach(function (k) { Object.freeze(COMBAT_ABILITIES[k]); });
Object.freeze(COMBAT_ABILITIES);

// ===== v13.0 机制数值常量（原亚型行内数值收编为常量）=====
const REFLECT_PCT = 20;      // 铁体功反震百分比
const SWORD_CRIT_BONUS = 12; // 剑气纵横暴击率加成（%）

// ---------- 生成角色部位耐久 ----------
function initBodyDurability(attrs) {
    const durabilities = {};
    BODY_PARTS.forEach(part => {
        durabilities[part.id] = 100;
    });
    return durabilities;
}

// ---------- 计算部位对整体属性的影响 ----------
function calculateStatsFromDurability(durabilities) {
    const multipliers = {
        strength: 1, dexterity: 1, intelligence: 1, willpower: 1, constitution: 1, meridian: 1
    };
    BODY_PARTS.forEach(part => {
        const dur = durabilities[part.id] || 0;
        if (dur < 50) {
            const penalty = (50 - dur) / 200;
            const stat = part.stat;
            multipliers[stat] = Math.max(0.5, multipliers[stat] - penalty);
        }
    });
    if (durabilities['handL'] < 30 || durabilities['handR'] < 30) {
        multipliers.dexterity *= 0.8;
        multipliers.strength *= 0.9;
    }
    if (durabilities['footL'] < 30 || durabilities['footR'] < 30) {
        multipliers.dexterity *= 0.7;
        multipliers.constitution *= 0.9;
    }
    if (durabilities['dantian'] < 30) {
        multipliers.meridian *= 0.6;
    }
    return multipliers;
}

// ============================================================
//  护甲系统（中等方案）
// ============================================================

// 部位→护甲槽位映射表
const SLOT_TO_PART_MAP = {
    'head': ['head', 'brain', 'eyes', 'jaw'],
    'body': ['chest', 'abdomen', 'dantian', 'waist', 'pelvis', 'neck'],
    'hands': ['handL', 'handR', 'forearmL', 'forearmR', 'upperArmL', 'upperArmR'],
    'legs': ['thighL', 'thighR', 'calfL', 'calfR'],
    'feet': ['footL', 'footR']
};

// 反向映射：部位→护甲槽位
const PART_TO_SLOT_MAP = {};
Object.keys(SLOT_TO_PART_MAP).forEach(slot => {
    SLOT_TO_PART_MAP[slot].forEach(part => {
        PART_TO_SLOT_MAP[part] = slot;
    });
});

// 获取部位的护甲槽位
function getArmorSlotForPart(partId) {
    return PART_TO_SLOT_MAP[partId] || 'body';
}

// 获取装备的护甲数据（从当前装备系统）
function getArmorData(slot) {
    try {
        const equip = window.currentEquipment;
        if (!equip) return null;
        const item = equip[slot];
        if (!item) return null;
        // 检查是否有护甲属性
        if (item.resistance && item.coverage) {
            return item;
        }
        // 从模板中获取
        const template = window.itemById ? window.itemById[item.id || item.templateId] : null;
        if (template && template.resistance) {
            return template;
        }
        return null;
    } catch (e) {
        return null;
    }
}

// v12.4 难度条件栏：危急默认救治窗口（回合数）按难度读取（宽松50/标准35/凶险20）
function _getDifficultyCriticalTurns() {
    try {
        if (typeof window.getDifficultyParam === 'function') {
            var t = window.getDifficultyParam('criticalTurns');
            if (typeof t === 'number' && t > 0) return t;
        }
    } catch (e) {}
    return 50;
}

// 护甲对伤口的影响
function applyArmorToWound(partId, wound, damageType) {
    // 1. 根据命中部位找到对应护甲槽位
    const slot = getArmorSlotForPart(partId);
    const armor = getArmorData(slot);

    // 2. 没有护甲 → 直接返回原伤口
    if (!armor) return wound;

    // 3. 检查该部位的覆盖率
    const coverage = armor.coverage ? (armor.coverage[partId] || 0) : 0;
    if (Math.random() > coverage) {
        // 没盖住 → 护甲无效
        return wound;
    }

    // 4. 护甲生效（v9.8：slash/pierce/blunt；抗性/200 封顶30%；元素不走钝击抗性）
    let resistKey = 'slash';
    if (damageType === 'pierce') resistKey = 'pierce';
    else if (damageType === 'blunt' || damageType === 'sharp') resistKey = damageType === 'sharp' ? 'slash' : 'blunt';
    else if (damageType === 'slash') resistKey = 'slash';
    else resistKey = null; // fire/cold/thunder 等不吃物理抗性
    const resist = (resistKey && armor.resistance) ? (armor.resistance[resistKey] || 0) : 0;
    // 类型减伤 = min(30%, 抗性/200)
    const reduction = resistKey ? Math.min(0.30, resist / 200) : 0;

    // 降低伤口严重度
    wound.severity = Math.floor(wound.severity * (1 - reduction));
    wound.depth = Math.max(0, wound.depth - Math.floor(resist / 25));
    wound.vesselGrade = Math.max(0, wound.vesselGrade - Math.floor(resist / 30));
    wound.externalBleedRate = Math.floor(wound.externalBleedRate * (1 - reduction * 0.8));
    wound.internalBleedRate = Math.floor(wound.internalBleedRate * (1 - reduction * 0.6));
    wound.painSource = Math.floor(wound.painSource * (1 - reduction * 0.5));
    wound.structuralDamage = Math.floor(wound.structuralDamage * (1 - reduction * 0.7));

    // 5. 护甲耐久下降（钝击 ×1.5）
    if (armor.armorDurability !== undefined) {
        var durLoss = 1 + Math.floor((100 - resist) / 30);
        if (damageType === 'blunt') durLoss = Math.floor(durLoss * 1.5);
        armor.armorDurability = Math.max(0, armor.armorDurability - durLoss);
        // 如果耐久归零 → 该部位护甲失效
        if (armor.armorDurability <= 0 && armor.coverage) {
            armor.coverage[partId] = 0;
        }
    }

    // 标记已经被护甲处理
    wound._armorReduced = true;
    wound._armorSlot = slot;
    wound._armorResist = resist;

    return wound;
}

// 获取护甲状态摘要（用于UI显示）
function getArmorStatus() {
    const slots = ['head', 'body', 'hands', 'legs', 'feet'];
    const status = [];
    slots.forEach(slot => {
        const armor = getArmorData(slot);
        if (armor) {
            status.push({
                slot: slot,
                name: armor.name || '未知护甲',
                durability: armor.armorDurability !== undefined ? armor.armorDurability : 100,
                resistance: armor.resistance || { slash: 0, pierce: 0, blunt: 0 }
            });
        }
    });
    return status;
}

// ============================================================
//  生理系统辅助函数（在physiology-config.js加载后可用）
// ============================================================

function _getPhysConfig() {
    return window.PHYSIOLOGY_CONFIG || {};
}

function _getPartModifiers() {
    return window.PART_PHYSIOLOGY_MODIFIERS || {};
}

function _getDamageEffects() {
    return window.DAMAGE_TYPE_EFFECTS || {};
}

// ---------- 初始化生理系统（v4.0：bloodVolume + 缺氧/危急） ----------
function initPhysiology(type) {
    const cfg = _getPhysConfig();
    const maxBlood = cfg.MAX_BLOOD_VOLUME || cfg.MAX_HEALTH || 100;
    const physiology = {
        type: type || 'humanoid',   // humanoid | beast | undead | construct | elemental
        // v4.0: health → bloodVolume（语义明确为血量）
        bloodVolume: maxBlood,
        health: maxBlood,           // 兼容旧代码读取 phys.health
        circulation: cfg.MAX_CIRCULATION || 100,
        consciousness: cfg.MAX_CONSCIOUSNESS || 100,
        breathing: cfg.MAX_BREATHING || 100,
        painLoad: 0,
        poisonLoad: 0,              // v12.8 毒素负荷0-100（poisoner/尸毒命中累积，回合tick衰减）
        neuralShock: 0,
        stamina: cfg.MAX_STAMINA || 100,
        // v4.0 新增
        oxygenDebt: 0,              // 缺氧负担 0-100
        breathlessTurns: 0,         // 呼吸停止持续回合
        criticalTimer: -1,          // -1=无危急, 0+=已进入（分钟累计）
        criticalCause: null,        // 危急原因
        criticalRounds: 50,         // v4.2 救治窗口回合数（默认50回合=5分钟）
        dantianDestroyed: false,    // 丹田是否被毁
        wounds: [],
        parts: {},
        state: 'alert',
        isUnconscious: false,
        integrity: 100,  // 构装体专用
    };

    // 根据生理类型调整初始值
    if (type === 'beast') {
        const mul = cfg.BEAST_HEALTH_MULTIPLIER || 1.5;
        physiology.bloodVolume = maxBlood * mul;
        physiology.health = physiology.bloodVolume;
        physiology.circulation = (cfg.MAX_CIRCULATION || 100) * mul;
    } else if (type === 'undead') {
        physiology.bloodVolume = 0;
        physiology.health = 0; // 亡灵不依赖血量，用结构损伤
    } else if (type === 'construct') {
        physiology.bloodVolume = 0;
        physiology.health = 0; // 构装体不依赖血量，用integrity
    }

    // 初始化部位状态
    initBodyParts(physiology);

    return physiology;
}

// ---------- 初始化22个部位状态 ----------
function initBodyParts(physiology) {
    BODY_PARTS.forEach(part => {
        physiology.parts[part.id] = {
            function: 100,            // 0-100 功能百分比
            structuralDamage: 0,      // 0-100 结构损伤
            nerveDamage: 0,           // 0-100 神经损伤
            swelling: 0,              // 0-100 肿胀（钝击造成）
            fracture: false,          // 是否骨折
            woundIds: []              // 该部位的伤口ID列表
        };
    });
}

// ---------- 生成伤口ID ----------
let _woundCounter = 0;
function generateWoundId() {
    _woundCounter++;
    return 'wound_' + Date.now() + '_' + _woundCounter;
}

// ---------- 创建伤口对象 ----------
function createWound(partId, damageType, severity, modifiers) {
    const cfg = _getPhysConfig();
    const effects = _getDamageEffects();
    const dt = effects[damageType] || effects['blunt'];
    const mod = modifiers || { bleed: 1.0, pain: 1.0, breath: 0.0 };

    // 根据伤害类型等级计算具体数值
    const severityScale = severity / 100; // 0-1 严重度比例

    // 外出血速率：基于伤害类型的外出血等级 × 严重度 × 部位出血系数
    const externalBleedRate = Math.round(dt.externalBleed * 15 * severityScale * mod.bleed);

    // 内出血速率：基于伤害类型的内出血等级 × 严重度 × 部位出血系数
    const internalBleedRate = Math.round(dt.internalBleed * 10 * severityScale * mod.bleed);

    // 疼痛贡献：基于伤害类型的疼痛等级 × 严重度 × 部位疼痛系数
    const painSource = Math.round(dt.pain * 20 * severityScale * mod.pain);

    // 结构损伤：基于伤害类型的结构损伤等级 × 严重度
    const structuralDamage = Math.round(dt.structuralDamage * 12 * severityScale);

    // 神经冲击：基于伤害类型的神经冲击等级 × 严重度
    const nerveDamage = Math.round(dt.neuralShock * 8 * severityScale);

    // 深度：根据严重度决定
    let depth = 0;
    if (severity >= 80) depth = 4;      // 贯穿
    else if (severity >= 60) depth = 3; // 深部
    else if (severity >= 35) depth = 2; // 中等
    else if (severity >= 15) depth = 1; // 表层

    // 面积：根据严重度决定
    let area = 1;
    if (severity >= 70) area = 4;
    else if (severity >= 50) area = 3;
    else if (severity >= 30) area = 2;

    // 血管等级：基于外出血速率
    let vesselGrade = 0;
    if (externalBleedRate >= 40) vesselGrade = 4;
    else if (externalBleedRate >= 25) vesselGrade = 3;
    else if (externalBleedRate >= 12) vesselGrade = 2;
    else if (externalBleedRate >= 3) vesselGrade = 1;

    return {
        id: generateWoundId(),
        partId: partId,
        damageType: damageType,
        severity: Math.min(100, severity),
        depth: depth,
        area: area,
        vesselGrade: vesselGrade,
        externalBleedRate: Math.min(100, externalBleedRate),
        internalBleedRate: Math.min(100, internalBleedRate),
        painSource: Math.min(100, painSource),
        structuralDamage: Math.min(100, structuralDamage),
        nerveDamage: Math.min(100, nerveDamage),
        stabilized: false,
        stabilization: 0,
        clottingProgress: 0,
        createdAt: Date.now(),
        bleeding: (externalBleedRate > 0 || internalBleedRate > 0)
    };
}

// ---------- 实体类 ----------
class Entity {
    constructor(data, type = 'player') {
        this.type = type; // 'player', 'enemy', 'beast', 'ally'
        this.species = data.species || (type === 'beast' ? 'beast' : 'human');
        this.name = data.name || '无名';
        this.level = data.level || 1;
        // 非人形生物没有阵营和门派
        const isHumanoid = type === 'player' || type === 'enemy' || type === 'ally';
        this.faction = data.faction || (isHumanoid ? '中立' : '无');
        this.sect = data.sect || (isHumanoid ? '散修' : '无');
        this.attrs = data.attrs || { strength: 10, dexterity: 10, intelligence: 10, willpower: 10, constitution: 10, meridian: 10 };
        this.skills = data.skills || {};
        // 部位耐久（兼容旧系统）
        this.durabilities = data.durabilities || initBodyDurability(this.attrs);
        this.maxDurabilities = { ...this.durabilities };
        // 状态
        this.buffs = [];
        this.debuffs = [];
        this.isAlive = true;
        // 额外数据
        this.loot = data.loot || { exp: 10, copper: 5 };
        this.aiBehavior = data.aiBehavior || 'balanced';

        // ===== 机体扩展 v3.0：生理系统 =====
        // 生理类型（从data读取或默认humanoid）
        const physType = data.physiologyType || (type === 'beast' ? 'beast' : 'humanoid');
        this.physiology = data.physiology || initPhysiology(physType);
        // 武器damageType（默认钝器）
        this.damageType = data.damageType || 'blunt';
        // ===== v13.0 敌人战斗技能系统：机制不再焊死在敌人身份上，判断一律查 combatAbilities =====
        this.combatAbilities = Array.isArray(data.combatAbilities) ? data.combatAbilities.slice() : [];
        // ===== v12.8 一次性战斗标记（仅运行时状态透传，参照 _pounceUsed 先例；机制开关见上）=====
        this._hardenedCharges = data._hardenedCharges || 0; // 硬化充能（生成器仅对持 hardened 技的实体赋值）
        this._pounceUsed = data._pounceUsed === true;       // 猛扑是否已用（仅持 pounce 技者有意义）
        this._elementType = data._elementType || null;      // 冰/火元素展示标（效果判定改查 chill/burn 技）
        // ===== v13.0 运行时状态（原 v12.9 八个机制布尔透传已删除：_bloodDrain/_reflectPct/_soundShock/
        // _illusionist/_escapeArtist/_essenceDrain/_guMaster/_critBonus —— 判定一律改走 hasAbility）=====
        this._illusionHits = data._illusionHits || 0;             // 迷扰层数（被迷魂术命中方，攻击时消耗）
        this._guMarked = data._guMarked === true;                 // 金蚕蛊入体标记（战斗结束自然失效）
        // 剑气纵横连击计数：仅持剑技者从0起计（null=不计数）；原 _critBonus 改为常量 SWORD_CRIT_BONUS 读取
        this._attackCount = this.hasAbility('sword_burst') ? 0 : null;
        this._renegadeTauntPending = data._renegadeTauntPending === true; // 叛门弟子首见台词（身份flavor，非战斗机制）
        this._fled = data._fled === true;                         // 已遁逃标记

        // ===== v9.5 属性感知：意志/体质/速度衍生属性 =====
        const willpower = (data.attrs && data.attrs.willpower) || 10;
        const constitution = (data.attrs && data.attrs.constitution) || 10;
        // 精神攻击抗性（预留，供魅惑/恐惧/心魔等使用）
        this.spiritResist = data.spiritResist != null ? data.spiritResist : Math.floor(willpower * 0.5);
        // 韧性：抗暴 + 格挡效率（体质100→30）
        this.toughness = data.toughness != null ? data.toughness : constitution * 0.3;
        // 精力上限：基础100 + 体质*0.5
        this.maxStamina = data.maxStamina != null ? data.maxStamina : (100 + constitution * 0.5);
        this.stamina = data.stamina != null ? data.stamina : this.maxStamina;
        // 速度→回避属性加成（构造时用基础灵巧估算，运行时以 getSpeed 为准）
        const baseSpeed = Math.floor(((data.attrs && data.attrs.dexterity) || 10) * 0.7);
        this.dodgeBonus = 10 + baseSpeed * 0.15;
        this.blockBonus = 10 + baseSpeed * 0.08;
        this.parryBonus = 10 + baseSpeed * 0.08;
    }

    // ===== v13.0 能力查询：战斗机制统一判定入口（ES5 Array.indexOf）=====
    hasAbility(id) {
        return Array.isArray(this.combatAbilities) && this.combatAbilities.indexOf(id) >= 0;
    }

    // 获取当前综合属性（考虑部位耐久衰减）
    getEffectiveAttrs() {
        const mult = calculateStatsFromDurability(this.durabilities);
        const effective = {};
        for (const [key, val] of Object.entries(this.attrs)) {
            effective[key] = Math.floor(val * (mult[key] || 1));
        }
        if (this.type === 'player') {
            const fn = typeof getFinalAttributes === 'function'
                ? getFinalAttributes
                : (typeof window.getFinalAttributes === 'function' ? window.getFinalAttributes : null);
            if (fn) {
                const finalAttrs = fn(effective);
                Object.assign(effective, finalAttrs);
            }
        }
        return effective;
    }

    // 安全获取依赖函数
    _getFn(name) {
        return typeof window[name] === 'function' ? window[name]
            : (typeof eval(name) === 'function' ? eval(name) : null);
    }

    // 攻击力（v4.3：非人形；v9.8：内功×经脉发挥倍率）
    getAttack() {
        const eff = this.getEffectiveAttrs();
        const isHumanoid = this.type === 'player' || this.type === 'ally' || this.physiology?.type === 'humanoid';
        // 人形生物：力量+内功；非人形：力量+天生技能
        let skillBonus = 0;
        if (isHumanoid) {
            var mer = eff.meridian || 10;
            var merMul = 1 + mer / 500;
            skillBonus = (this.skills['内功'] || 0) * 0.1 * merMul;
        } else {
            // 取最高的一项天生技能作为加成
            var bestSkill = 0;
            for (var sk in this.skills) {
                if (this.skills.hasOwnProperty(sk) && this.skills[sk] > bestSkill) {
                    bestSkill = this.skills[sk];
                }
            }
            skillBonus = bestSkill * 0.12;
        }
        // A1: 力量系数 0.6 → 1.0
        let attack = Math.floor(eff.strength * 1.0 + skillBonus);
        // B2: 玩家武器技能加成（技能×0.15；无对应技能且持武器 -5）
        if (this.type === 'player' && typeof getPlayerWeaponSkill === 'function') {
            const skillValue = getPlayerWeaponSkill();
            let weaponSkillBonus = skillValue * 0.15;
            if (skillValue === 0 && window.currentEquipment?.mainHand) {
                weaponSkillBonus = -5;
            }
            attack += Math.floor(weaponSkillBonus);
        }
        if (this.type === 'player') {
            const getCB = this._getFn('getCombatBonuses');
            if (getCB) {
                const bonuses = getCB({});
                if (bonuses.attack) attack += bonuses.attack;
            }
        }
        if (this.type === 'player') {
            const getBB = this._getFn('getBondBonuses');
            if (getBB) {
                const bond = getBB();
                if (bond.attack && bond.attack !== 1) attack = Math.floor(attack * bond.attack);
            }
        }
        if (this.type === 'player' && typeof window.getAgePenaltyMultiplier === 'function') {
            try {
                const ap = window.getAgePenaltyMultiplier();
                if (ap && ap !== 1) attack = Math.floor(attack * ap);
            } catch (e) {}
        }
        // P0-5：「境界不稳」虚弱（重塑肉身后3天，战斗属性×0.9）
        if (this.type === 'player' && typeof window.getRealmUnstableMultiplier === 'function') {
            try {
                const um = window.getRealmUnstableMultiplier();
                if (um !== 1) attack = Math.floor(attack * um);
            } catch (e) {}
        }
        // 0.2.1 境界质变：化神 attack×1.2 / 合体×1.3 / 渡劫×1.5（buildPlayerBattleEntity 设 _realmCombatMul）
        if (this.type === 'player' && this._realmCombatMul && this._realmCombatMul.attack && this._realmCombatMul.attack !== 1) {
            attack = Math.floor(attack * this._realmCombatMul.attack);
        }
        // 0.2.2 #3 组合技：万剑归宗 attack+50%（百分比作乘数）
        if (this.type === 'player' && this._skillComboBonus && this._skillComboBonus.attack) {
            attack = Math.floor(attack * (1 + this._skillComboBonus.attack / 100));
        }
        // 0.2.6 道侣合击：情意绵绵 attack+20%、天作之合 all+30%（all 已并入 attrs）
        if (this.type === 'player' && this._daoComboBonus && this._daoComboBonus.attack) {
            attack = Math.floor(attack * (1 + this._daoComboBonus.attack / 100));
        }
        // 1.8 本命法宝：每阶 +5% 攻击
        if (this.type === 'player' && this._artifactMul && this._artifactMul !== 1) {
            attack = Math.floor(attack * this._artifactMul);
        }
        // 2.5 法修：元素凌厉 attack+10%
        if (this.type === 'player' && this._schoolAtkMul && this._schoolAtkMul !== 1) {
            attack = Math.floor(attack * this._schoolAtkMul);
        }
        // 2.12 自创丹方临时 attack buff
        if (this.type === 'player' && this._customPillAtk && this._customPillAtk !== 1) {
            attack = Math.floor(attack * this._customPillAtk);
        }
        return attack;
    }

    // 防御力
    getDefense() {
        const eff = this.getEffectiveAttrs();
        let defense = Math.floor(eff.constitution * 0.4 + eff.willpower * 0.2);
        if (this.type === 'player') {
            const getCB = this._getFn('getCombatBonuses');
            if (getCB) {
                const bonuses = getCB({});
                if (bonuses.defense) defense += bonuses.defense;
            }
        }
        if (this.type === 'player') {
            const getBB = this._getFn('getBondBonuses');
            if (getBB) {
                const bond = getBB();
                if (bond.defense && bond.defense !== 1) defense = Math.floor(defense * bond.defense);
            }
        }
        // GPT审核报告2 P0-3 修复：阵法增益真实接入（profession-system 布阵 / location-system 天然阵法参悟）
        // 此前 _formationBuff 只写入 currentCharData，战斗从不读取，属于假效果
        if (this.type === 'player') {
            try {
                const cdFb = (typeof window.getCurrentCharData === 'function'
                    ? window.getCurrentCharData()
                    : null) || window.currentCharData;
                const fb = cdFb && cdFb._formationBuff;
                if (fb && fb.def > 0) {
                    defense = Math.floor(defense * (1 + fb.def));
                }
            } catch (e) {}
        }
        // 0.2.1 境界质变：金丹 defense×1.15 / 合体×1.3 / 渡劫×1.5
        if (this.type === 'player' && this._realmCombatMul && this._realmCombatMul.defense && this._realmCombatMul.defense !== 1) {
            defense = Math.floor(defense * this._realmCombatMul.defense);
        }
        // 0.2.2 #3 组合技：不动如山 defense+40%（百分比作乘数）
        if (this.type === 'player' && this._skillComboBonus && this._skillComboBonus.defense) {
            defense = Math.floor(defense * (1 + this._skillComboBonus.defense / 100));
        }
        // 0.2.6 道侣合击：生死与共 defense+25%
        if (this.type === 'player' && this._daoComboBonus && this._daoComboBonus.defense) {
            defense = Math.floor(defense * (1 + this._daoComboBonus.defense / 100));
        }
        // 1.8 本命法宝：每阶 +5% 防御
        if (this.type === 'player' && this._artifactMul && this._artifactMul !== 1) {
            defense = Math.floor(defense * this._artifactMul);
        }
        // 2.5 体修：反震硬抗 defense+15%
        if (this.type === 'player' && this._schoolDefMul && this._schoolDefMul !== 1) {
            defense = Math.floor(defense * this._schoolDefMul);
        }
        return defense;
    }

    // GPT审核报告2 P0-3：战斗结束时阵法增益按场次消耗（turns=剩余场次数）
    _consumeFormationBuff() {
        if (this._formationConsumed) return;
        this._formationConsumed = true;
        try {
            const cd = (typeof window.getCurrentCharData === 'function'
                ? window.getCurrentCharData()
                : null) || window.currentCharData;
            if (cd && cd._formationBuff && cd._formationBuff.turns > 0) {
                cd._formationBuff.turns -= 1;
                if (cd._formationBuff.turns <= 0) {
                    delete cd._formationBuff;
                    if (window.showMessage) window.showMessage('🔮 护体阵法的力量已耗尽。', 'info');
                }
            }
        } catch (e) {}
        // P0-5：「境界不稳」虚弱（重塑肉身后3天，战斗属性×0.9）
        if (this.type === 'player' && typeof window.getRealmUnstableMultiplier === 'function') {
            try {
                const um = window.getRealmUnstableMultiplier();
                if (um !== 1) defense = Math.floor(defense * um);
            } catch (e) {}
        }
    }

    // 速度（v4.3：非人形生物不使用轻功）
    getSpeed() {
        const eff = this.getEffectiveAttrs();
        const isHumanoid = this.type === 'player' || this.type === 'ally' || this.physiology?.type === 'humanoid';
        let skillBonus = 0;
        if (isHumanoid) {
            skillBonus = (this.skills['轻功'] || 0) * 0.1;
        } else {
            // 野兽/亡灵等使用敏捷相关天生技能
            var bestSkill = 0;
            for (var sk in this.skills) {
                if (this.skills.hasOwnProperty(sk) && this.skills[sk] > bestSkill) {
                    bestSkill = this.skills[sk];
                }
            }
            skillBonus = bestSkill * 0.08;
        }
        let speed = Math.floor(eff.dexterity * 0.7 + skillBonus);
        if (this.type === 'player') {
            const getCB = this._getFn('getCombatBonuses');
            if (getCB) {
                const bonuses = getCB({});
                if (bonuses.speed) speed += bonuses.speed;
            }
        }
        // P0-5：「境界不稳」虚弱（重塑肉身后3天，战斗属性×0.9）
        if (this.type === 'player' && typeof window.getRealmUnstableMultiplier === 'function') {
            try {
                const um = window.getRealmUnstableMultiplier();
                if (um !== 1) speed = Math.floor(speed * um);
            } catch (e) {}
        }
        // 0.2.1 境界质变：筑基 speed×1.1 / 炼虚×1.2
        if (this.type === 'player' && this._realmCombatMul && this._realmCombatMul.speed && this._realmCombatMul.speed !== 1) {
            speed = Math.floor(speed * this._realmCombatMul.speed);
        }
        return speed;
    }

    // ===== 机体扩展 v4.0：受伤系统（血量重命名 + 危急状态） =====
    // 受到伤害（指定部位+伤害类型）
    takeDamage(partId, damage, damageType) {
        // v12.8 构装体硬化：有充能时伤害×0.75并消耗1层（按受击计，闪避不消耗）
        // v13.0 充能仅由生成器对持 hardened 技的实体赋值，机制本身仍以充能数为开关
        if (this._hardenedCharges > 0) {
            damage = Math.max(1, Math.floor(damage * 0.75));
            this._hardenedCharges--;
            this._lastHitHardened = true;
        } else {
            this._lastHitHardened = false;
        }
        // F-21：defensive 守御姿态——_guardTurns>0 时本次受击伤害×0.6 并消耗
        // 此前 enemyTurn 仅置 _guardTurns=1 但全库无读取点，守御=白送一回合
        if (this._guardTurns > 0) {
            damage = Math.max(1, Math.floor(damage * 0.6));
            this._guardTurns = 0;
        }
        if (this.type === 'player' && window.TalismanSystem && typeof window.TalismanSystem.absorbDamage === 'function') {
            damage = window.TalismanSystem.absorbDamage(damage);
            if (damage <= 0) return 0;
        }
        // v9.8：默认 blunt；sharp 映射为 slash
        if (!damageType) damageType = this.damageType || 'blunt';
        if (damageType === 'sharp') damageType = 'slash';
    
        if (!this.durabilities.hasOwnProperty(partId)) return 0;
        // v12.4 难度条件栏：要害部位（脑/头/胸/颈/丹田）受伤 ×vitalMul
        // 双向生效（玩家打敌人、敌人打玩家）；位于符箓吸收之后——护盾挡下的部分不放大；
        // 护甲减免作用于后续伤口严重度层面，与本倍率互不冲突
        if (partId === 'brain' || partId === 'head' || partId === 'chest' || partId === 'neck' || partId === 'dantian') {
            try {
                if (typeof window.getDifficultyParam === 'function') {
                    const vm = window.getDifficultyParam('vitalMul');
                    if (typeof vm === 'number' && vm > 0 && vm !== 1) damage = Math.max(1, Math.round(damage * vm));
                }
            } catch (e) {}
        }
        const before = this.durabilities[partId];
        this.durabilities[partId] = Math.max(0, before - damage);
        const actual = before - this.durabilities[partId];
    
        // v4.0 修订：头/颈/胸耐久归零 = 肉体尽毁（全是空气），直接死亡
        // 用户确认：归零语义是部位被彻底摧毁，不是"可救治的危急"
        if (this.physiology && this.physiology.type !== 'undead' && this.physiology.type !== 'construct' && this.physiology.type !== 'elemental') {
            if ((partId === 'brain' || partId === 'head' || partId === 'chest' || partId === 'neck') && this.durabilities[partId] <= 0) {
                this.isAlive = false;
            }
        }
        const total = Object.values(this.durabilities).reduce((a,b) => a + b, 0);
        if (total <= 0) this.isAlive = false;
    
        // ===== 生理系统：生成伤口 =====
        if (this.isAlive !== false) {
            this._applyPhysiologyDamage(partId, damage, damageType);
        }
    
        return actual;
    }

    // 生理伤害处理（根据physiologyType分支）v4.0：丹田被毁不死亡 + depth≥4 概率关键损伤
    _applyPhysiologyDamage(partId, damage, damageType) {
        const phys = this.physiology;
        const physType = phys.type;
    
        // 获取部位敏感性修正
        const mods = _getPartModifiers();
        const partMod = mods[partId] || { bleed: 1.0, pain: 1.0, breath: 0.0 };
    
        // 计算严重度（基于伤害值和部位敏感性）
        const severity = Math.min(100, damage * (partMod.bleed || 1.0));
    
        switch (physType) {
            case 'undead': {
                // 亡灵：不流血，只计算结构损伤
                const sev = Math.min(100, damage * 1.2);
                if (phys.parts[partId]) {
                    phys.parts[partId].structuralDamage += sev;
                    // 检查是否死亡
                    if (phys.parts[partId].structuralDamage >= 100) {
                        this.isAlive = false;
                    }
                }
                // 火焰/神圣额外伤害
                if (damageType === 'fire') {
                    const extraDmg = Math.floor(damage * 0.5);
                    this.durabilities[partId] = Math.max(0, (this.durabilities[partId] || 0) - extraDmg);
                }
                return;
            }
            case 'construct': {
                // 构装体：扣integrity
                phys.integrity = Math.max(0, phys.integrity - damage * 0.5);
                if (phys.integrity <= 0) {
                    this.isAlive = false;
                }
                // 雷电额外伤害
                if (damageType === 'thunder') {
                    phys.integrity = Math.max(0, phys.integrity - damage * 0.3);
                }
                return;
            }
            case 'elemental': {
                // 元素生物：直接扣health，不产生伤口
                phys.health = Math.max(0, phys.health - damage * 0.3);
                if (phys.health <= 0) {
                    this.isAlive = false;
                }
                return;
            }
            case 'beast':
            case 'humanoid':
            default: {
                // humanoid/beast：生成伤口
                const wound = createWound(partId, damageType, severity, partMod);
    
                // 护甲判断（仅玩家生效，敌人暂不处理护甲）
                if (this.type === 'player' && typeof applyArmorToWound === 'function') {
                    applyArmorToWound(partId, wound, damageType);
                }
    
                phys.wounds.push(wound);
    
                // 更新部位状态
                if (phys.parts[partId]) {
                    const part = phys.parts[partId];
                    part.structuralDamage = Math.min(100, part.structuralDamage + wound.structuralDamage);
                    part.nerveDamage = Math.min(100, part.nerveDamage + wound.nerveDamage);
                    if (damageType === 'blunt') {
                        part.swelling = Math.min(100, part.swelling + severity * 0.5);
                    }
                    // 骨折判定（钝器有30%骨折概率）
                    const dtEffects = _getDamageEffects();
                    const dt = dtEffects[damageType];
                    if (dt && dt.fractureChance && Math.random() < dt.fractureChance) {
                        part.fracture = true;
                    }
                    part.woundIds.push(wound.id);
                }
    
                // v4.2: 关键伤判定系统（取代旧的 depth≥4 直接概率）
                if (shouldCheckCriticalInjury(this, wound, damage, partMod)) {
                    resolveCriticalInjury(this, wound, partId, damageType);
                }
                // 贯穿伤加重出血（depth≥4）
                if (wound.depth >= 4) {
                    wound.externalBleedRate *= 1.5;
                    wound.internalBleedRate *= 2;
                }
    
                // v4.0: 丹田被毁不死亡（修为尽失+真气反噬+昏迷）
                if (partId === 'dantian' && phys.parts[partId] && phys.parts[partId].structuralDamage >= 100 && !phys.dantianDestroyed) {
                    const pcfg = _getPhysConfig();
                    phys.dantianDestroyed = true;
                    phys.painLoad = Math.min(100, phys.painLoad + (pcfg.DANTIAN_DESTROY_PAIN_BOOST || 50));
                    phys.consciousness = 0;
                    phys.state = 'unconscious';
                    phys.isUnconscious = true;
                    phys.circulation = Math.max(0, phys.circulation - (pcfg.DANTIAN_DESTROY_CIRCULATION_PENALTY || 30));
                }
    
                // 神经冲击累积
                const dtEffects = _getDamageEffects();
                const dt = dtEffects[damageType];
                if (dt) {
                    phys.neuralShock = Math.min(100, phys.neuralShock + dt.neuralShock * 5 * (severity / 100));
                }
    
                // 野兽：疼痛阈值更高（疼痛减半）
                if (physType === 'beast') {
                    wound.painSource = Math.floor(wound.painSource * 0.5);
                }
    
                // 检查死亡（生理系统判定）
                this.checkDeath();
                return;
            }
        }
    }

    // 死亡判定（v4.0：支持危急计时 + bloodVolume + brain关键结构）
    checkDeath() {
        const phys = this.physiology;
        if (!phys) return;
        const physType = phys.type;
    
        switch (physType) {
            case 'undead': {
                // 亡灵：结构损伤>=100死亡
                let totalStruct = 0;
                BODY_PARTS.forEach(part => {
                    if (phys.parts[part.id]) {
                        totalStruct += phys.parts[part.id].structuralDamage;
                    }
                });
                if (totalStruct >= 100) {
                    this.isAlive = false;
                }
                return;
            }
            case 'construct': {
                if (phys.integrity <= 0) {
                    this.isAlive = false;
                }
                return;
            }
            case 'elemental': {
                if ((phys.bloodVolume !== undefined ? phys.bloodVolume : phys.health) <= 0) {
                    this.isAlive = false;
                }
                return;
            }
            case 'beast':
            case 'humanoid':
            default: {
                // v4.0: bloodVolume <= 0 → 死亡
                const blood = phys.bloodVolume !== undefined ? phys.bloodVolume : phys.health;
                if (blood <= 0) {
                    this.isAlive = false;
                    return;
                }
    
                // v4.0: 循环归零 / 缺氧满 → 进入危急（不立即死亡）
                if (phys.circulation <= 0 && phys.criticalTimer < 0) {
                    enterCriticalState(this, 'circulation_failure');
                }
                if ((phys.oxygenDebt || 0) >= 100 && phys.criticalTimer < 0) {
                    enterCriticalState(this, 'hypoxia');
                }
    
                // v4.2: 危急计时到（使用动态 criticalRounds；v12.4 兜底按难度读取）
                const totalRounds = phys.criticalRounds || _getDifficultyCriticalTurns();
                const cfg = _getPhysConfig();
                const totalMinutes = totalRounds * (cfg.CRITICAL_TIMER_PER_TURN || 0.1);
                if (phys.criticalTimer >= 0 && phys.criticalTimer >= totalMinutes) {
                    this.isAlive = false;
                    return;
                }

                // v4.0 修订：头/颈/胸耐久归零 = 肉体尽毁，直接死亡
                if (this.durabilities) {
                    const fatalParts = ['brain', 'chest', 'neck'];
                    for (const pid of fatalParts) {
                        if (this.durabilities[pid] !== undefined && this.durabilities[pid] <= 0) {
                            this.isAlive = false;
                            return;
                        }
                    }
                    // 全部位耐久归零仍死亡
                    const total = Object.values(this.durabilities).reduce((a, b) => a + b, 0);
                    if (total <= 0) this.isAlive = false;
                }
                return;
            }
        }
    }

    // 获取部位状态（用于显示）
    getPartStatus(partId) {
        const current = this.durabilities[partId] || 0;
        const max = this.maxDurabilities[partId] || 100;
        return { current, max, ratio: current / max };
    }

    // 获取生理状态摘要（用于UI显示）v4.0
    getPhysiologySummary() {
        const phys = this.physiology;
        const cfg = _getPhysConfig();
        const blood = phys.bloodVolume !== undefined ? phys.bloodVolume : phys.health;
        return {
            health: Math.round(blood),
            bloodVolume: Math.round(blood),
            maxHealth: cfg.MAX_BLOOD_VOLUME || cfg.MAX_HEALTH || 100,
            circulation: Math.round(phys.circulation),
            maxCirculation: cfg.MAX_CIRCULATION || 100,
            consciousness: Math.round(phys.consciousness),
            painLoad: Math.round(phys.painLoad || 0),
            oxygenDebt: Math.round(phys.oxygenDebt || 0),
            criticalTimer: phys.criticalTimer,
            criticalCause: phys.criticalCause,
            dantianDestroyed: !!phys.dantianDestroyed,
            neuralShock: Math.round(phys.neuralShock || 0),
            state: phys.state,
            woundCount: (phys.wounds && phys.wounds.length) || 0,
            type: phys.type,
            integrity: phys.type === 'construct' ? Math.round(phys.integrity) : null,
        };
    }

    // 获取某部位的伤口列表
    getWoundsOnPart(partId) {
        return this.physiology.wounds.filter(w => w.partId === partId);
    }
}

// ============================================================
//  生理系统处理函数（每回合调用）
// ============================================================

// 处理生理（每回合结算）v4.0：oxygenDebt 累积 + 危急计时
function processPhysiology(entity, roundSeconds) {
    if (!entity || !entity.physiology) return;
    const phys = entity.physiology;
    const physType = phys.type;
    const cfg = _getPhysConfig();

    // 构装体/元素生物不处理生理
    if (physType === 'construct' || physType === 'elemental') {
        return;
    }

    // 亡灵：只处理结构损伤累计
    if (physType === 'undead') {
        entity.checkDeath();
        return;
    }

    // humanoid/beast：处理伤口
    if (roundSeconds === undefined) roundSeconds = 6;

    let totalExternalRate = 0;
    let totalInternalRate = 0;

    // 遍历所有伤口
    phys.wounds.forEach(wound => {
        if (!wound.bleeding) return;

        // 外出血：扣 bloodVolume（兼容 health）
        if (wound.externalBleedRate > 0) {
            const effectiveRate = wound.externalBleedRate * (1 - wound.stabilization / 120);
            const bloodLoss = effectiveRate * (cfg.EXTERNAL_BLEED_DAMAGE_FACTOR || 0.055) * roundSeconds / 60;
            if (phys.bloodVolume !== undefined) {
                phys.bloodVolume = Math.max(0, phys.bloodVolume - bloodLoss);
                phys.health = phys.bloodVolume;
            } else {
                phys.health = Math.max(0, phys.health - bloodLoss);
            }
            totalExternalRate += effectiveRate;
        }

        // 内出血：累计速率
        if (wound.internalBleedRate > 0) {
            totalInternalRate += wound.internalBleedRate;
        }

        // 凝血（稳定度>0时凝血）
        if (wound.stabilization > 0) {
            wound.clottingProgress += cfg.BASE_CLOTTING_RATE || 0.5;
            if (wound.clottingProgress >= 100) {
                // 凝血完成，停止出血
                wound.bleeding = false;
                wound.externalBleedRate = 0;
                wound.internalBleedRate = 0;
            }
        }

        // 稳定度自然恢复（每回合+1，上限100）
        if (wound.stabilization > 0 && wound.stabilization < 100) {
            wound.stabilization = Math.min(100, wound.stabilization + 1);
        }
    });

    // 疼痛计算（递减合并）
    if (phys.wounds.length > 0) {
        let painProduct = 1;
        phys.wounds.forEach(w => {
            painProduct *= (1 - w.painSource / 100);
        });
        phys.painLoad = 100 * (1 - painProduct);
    } else {
        phys.painLoad = 0;
    }

    // 内出血影响循环：circulation = bloodVolume - internalBleedPenalty
    const bloodNow = phys.bloodVolume !== undefined ? phys.bloodVolume : phys.health;
    phys.circulation = Math.max(0, bloodNow - totalInternalRate * (cfg.INTERNAL_BLEED_CIRCULATION_FACTOR || 0.3));

    // 呼吸计算
    phys.breathing = calculateBreathing(entity);

    // v4.0: 供氧 = min(breathing, circulation)
    const oxygenSupply = Math.min(phys.breathing || 100, phys.circulation || 100);
    const supplyThreshold = cfg.OXYGEN_SUPPLY_THRESHOLD !== undefined ? cfg.OXYGEN_SUPPLY_THRESHOLD : 60;

    // v4.0: 缺氧系统（oxygenDebt 累积）
    if (oxygenSupply < supplyThreshold) {
        phys.oxygenDebt = Math.min(100, (phys.oxygenDebt || 0) + (supplyThreshold - oxygenSupply) * (cfg.OXYGEN_DEBT_RATE || 0.3));
        if (phys.breathing <= 0) {
            phys.breathlessTurns = (phys.breathlessTurns || 0) + 1;
        }
    } else if ((phys.oxygenDebt || 0) > 0) {
        phys.oxygenDebt = Math.max(0, (phys.oxygenDebt || 0) - (cfg.OXYGEN_DEBT_RECOVERY || 5));
        phys.breathlessTurns = 0;
    }

    // v4.2: 危急计时（使用动态 criticalRounds 替代固定 5 分钟）
    if (phys.criticalTimer >= 0) {
        phys.criticalTimer += cfg.CRITICAL_TIMER_PER_TURN || 0.1;
        // 使用自定义 criticalRounds（回合数）；v12.4 兜底按难度读取
        const totalRounds = phys.criticalRounds || _getDifficultyCriticalTurns();
        const totalMinutes = totalRounds * (cfg.CRITICAL_TIMER_PER_TURN || 0.1);
        if (phys.criticalTimer >= totalMinutes) {
            entity.isAlive = false;
        }
    }

    // 神经冲击衰减
    phys.neuralShock = Math.max(0, phys.neuralShock - (cfg.NEURAL_SHOCK_DECAY || 4));

    // 意识更新
    updateConsciousness(entity);

    // 死亡判定
    entity.checkDeath();
}

// 计算呼吸效率
function calculateBreathing(entity) {
    const phys = entity.physiology;
    if (!phys) return 100;
    const mods = _getPartModifiers();

    // 胸部/颈部/头部结构损伤影响呼吸
    let breathPenalty = 0;
    const breathParts = ['chest', 'neck', 'head'];
    breathParts.forEach(partId => {
        if (phys.parts[partId]) {
            const structDmg = phys.parts[partId].structuralDamage || 0;
            const mod = mods[partId];
            const breathFactor = mod ? mod.breath : 0;
            breathPenalty += structDmg * breathFactor * 0.5;
        }
    });

    return Math.max(0, Math.min(100, 100 - breathPenalty));
}

// 更新意识（v4.0：bloodVolume<20 强制降低意识 + 疼痛系统重做）
function updateConsciousness(entity) {
    const phys = entity.physiology;
    if (!phys) return;
    const cfg = _getPhysConfig();

    // 野兽不处理意识
    if (phys.type === 'beast') {
        phys.consciousness = 100;
        phys.state = 'alert';
        phys.isUnconscious = false;
        return;
    }

    let target = 100;

    // v4.0: bloodVolume < 20 强制降低意识
    const blood = phys.bloodVolume !== undefined ? phys.bloodVolume : phys.health;
    if (blood < (cfg.BLOOD_VOLUME_CONSCIOUSNESS_THRESHOLD || 20)) {
        target -= (cfg.BLOOD_VOLUME_CONSCIOUSNESS_THRESHOLD || 20) - blood;
    }

    // 循环惩罚（循环<60时开始惩罚）
    if (phys.circulation < (cfg.CIRCULATION_PENALTY_THRESHOLD || 60)) {
        target -= (cfg.CIRCULATION_PENALTY_THRESHOLD || 60) - phys.circulation;
    }

    // 呼吸惩罚（呼吸<60时开始惩罚）
    if (phys.breathing < (cfg.BREATHING_PENALTY_THRESHOLD || 60)) {
        target -= (cfg.BREATHING_PENALTY_THRESHOLD || 60) - phys.breathing;
    }

    // v4.0/v9.5: 疼痛影响意识（A3 意志耐疼系数 0.8；战斗惩罚由 getPainCombatPenalties 处理）
    const painLoad = phys.painLoad || 0;
    const pe = window.PAIN_EFFECTS || {};
    const willpower = (entity.attrs && entity.attrs.willpower) || 10;
    // 意志越高，疼痛抗性越强（100意志→80%疼痛削减）
    const painResistance = willpower * (pe.willpowerResistance != null ? pe.willpowerResistance : 0.8);
    const effectivePain = Math.max(0, painLoad - painResistance);
    if (effectivePain > (cfg.PAIN_PENALTY_THRESHOLD || 60)) {
        target -= (effectivePain - (cfg.PAIN_PENALTY_THRESHOLD || 60)) * 0.8;
    }

    // 神经冲击惩罚
    target -= phys.neuralShock * (cfg.NEURAL_SHOCK_MULTIPLIER || 0.6);

    // 头部创伤惩罚
    if (phys.parts['head']) {
        target -= phys.parts['head'].structuralDamage * (cfg.HEAD_TRAUMA_MULTIPLIER || 0.3);
    }
    if (phys.parts['brain']) {
        target -= phys.parts['brain'].structuralDamage * 0.5;
    }

    // 限制范围
    phys.consciousness = Math.max(0, Math.min(100, target));

    // v4.0: 强制昏迷 — 疼痛满/缺氧满/循环归零/已在危急
    let forceUnconscious = false;
    if ((phys.painLoad || 0) >= 100) forceUnconscious = true;
    if ((phys.oxygenDebt || 0) >= (cfg.OXYGEN_DEBT_FAINT_THRESHOLD || 100)) {
        forceUnconscious = true;
        if (phys.criticalTimer < 0) enterCriticalState(entity, 'hypoxia');
    }
    if (phys.circulation <= 0) {
        forceUnconscious = true;
        if (phys.criticalTimer < 0) enterCriticalState(entity, 'circulation_failure');
    }
    if (phys.criticalTimer >= 0) forceUnconscious = true;

    if (forceUnconscious) {
        phys.consciousness = 0;
        phys.state = 'unconscious';
        phys.isUnconscious = true;
        return;
    }

    // 更新状态
    if (phys.consciousness >= 71) {
        phys.state = 'alert';
        phys.isUnconscious = false;
    } else if (phys.consciousness >= 51) {
        phys.state = 'impaired';
        phys.isUnconscious = false;
    } else if (phys.consciousness >= 31) {
        phys.state = 'dizzy';
        phys.isUnconscious = false;
    } else if (phys.consciousness >= 11) {
        phys.state = 'collapsed';
        phys.isUnconscious = false;
    } else if (phys.consciousness >= 1) {
        phys.state = 'unconscious';
        phys.isUnconscious = Math.random() < 0.7;
    } else {
        phys.state = 'unconscious';
        phys.isUnconscious = true;
    }
}

/** v4.0/v9.5: 疼痛对战斗的惩罚（命中/闪避/动作失败率）；A3 意志耐疼 0.8 */
function getPainCombatPenalties(entity) {
    const phys = entity && entity.physiology;
    if (!phys) return { hitPenalty: 0, dodgePenalty: 0, actionFailRate: 0, effectivePain: 0 };
    const pe = window.PAIN_EFFECTS || {};
    const painLoad = phys.painLoad || 0;
    const willpower = (entity.attrs && entity.attrs.willpower) || 10;
    const painResistance = willpower * (pe.willpowerResistance != null ? pe.willpowerResistance : 0.8);
    const effectivePain = Math.max(0, painLoad - painResistance);
    const hitF = pe.hitPenaltyFactor != null ? pe.hitPenaltyFactor : 0.5;
    const dodgeF = pe.dodgePenaltyFactor != null ? pe.dodgePenaltyFactor : 0.4;
    const failF = pe.actionFailFactor != null ? pe.actionFailFactor : 0.008;
    return {
        hitPenalty: -effectivePain * hitF,
        dodgePenalty: -effectivePain * dodgeF,
        actionFailRate: Math.min(0.95, effectivePain * failF),
        effectivePain: effectivePain
    };
}

// ============================================================
//  医疗行动函数
// ============================================================

// 包扎：选定部位一个伤口，稳定度 = 40 + 医术/5（F1）
// 已稳定伤口不可重复包扎（避免敌人AI每回合空包扎）
function bandageWound(entity, woundId) {
    if (!entity || !entity.physiology) return false;
    const wound = entity.physiology.wounds.find(w => w.id === woundId);
    if (!wound) return false;
    // 已稳定且仍在流血的伤口：不再重复包扎（凝血由 processPhysiology 推进）
    if (wound.stabilized && wound.stabilization >= 40) return false;

    // F1: 医术影响包扎效果（v9.8：getLifeSkill / window.currentCharData 同步后生效）
    let medicineBonus = 0;
    if (entity.type === 'player') {
        const medSkill = (typeof window.getLifeSkill === 'function')
            ? window.getLifeSkill('医术')
            : ((window.currentCharData && window.currentCharData.lifeSkills && window.currentCharData.lifeSkills['医术']) || 0);
        medicineBonus = Math.floor(medSkill / 5); // 医术100→+20
    }
    // 包扎效果：基础40 + 医术加成，上限60
    const stabilizationGain = Math.min(60, 40 + medicineBonus);
    wound.stabilization = Math.min(100, wound.stabilization + stabilizationGain);
    wound.stabilized = true;
    // 包扎立即显著止血，避免「stabilized 但仍 bleeding」导致 AI 每回合都选治疗
    if (wound.externalBleedRate > 0) {
        wound.externalBleedRate = Math.floor(wound.externalBleedRate * 0.35);
    }
    if (wound.internalBleedRate > 0) {
        wound.internalBleedRate = Math.floor(wound.internalBleedRate * 0.5);
    }
    // 轻度伤口包扎后可直接停止外出血标记
    if (wound.externalBleedRate < 3 && wound.internalBleedRate < 3) {
        wound.bleeding = false;
        wound.externalBleedRate = 0;
        wound.internalBleedRate = 0;
    }
    // v4.0: 包扎后若 circulation 恢复到 >0，可清除危急
    if (entity.physiology.circulation > 0 && entity.physiology.criticalTimer >= 0) {
        clearCriticalState(entity);
    }
    return true;
}

// A4: 自然愈合（v9.8：0.5 + 体质/25，避免22部位恢复过快）
function hourlyRecovery(entity) {
    if (!entity || !entity.isAlive) return;
    
    const constitution = entity.attrs?.constitution || 10;
    const recoveryRate = 0.5 + constitution / 25; // 体质10→0.9，100→4.5
    
    // 修复4：自然恢复应只在满足条件时发生
    const phys = entity.physiology;
    if (phys) {
        // 检查是否危急状态
        if (phys.criticalTimer >= 0) return;
        
        // 检查是否有活动性大出血且未稳定
        if (phys.wounds && phys.wounds.some(w => w.bleeding && !w.stabilized)) return;
        
        // 检查是否有部位被完全摧毁
        if (entity.durabilities) {
            for (const partId in entity.durabilities) {
                if (entity.durabilities[partId] <= 0) return;
            }
        }
    }
    
    // 恢复部位耐久
    if (entity.durabilities) {
        for (const partId in entity.durabilities) {
            if (!entity.durabilities.hasOwnProperty(partId)) continue;
            const max = entity.maxDurabilities?.[partId] || 100;
            entity.durabilities[partId] = Math.min(max, entity.durabilities[partId] + recoveryRate);
        }
    }
    
    // 恢复精力
    if (entity.stamina !== undefined) {
        entity.stamina = Math.min(entity.maxStamina || 100, entity.stamina + recoveryRate * 2);
    }
    
    // 恢复血量（轻微）
    if (entity.physiology && entity.physiology.bloodVolume !== undefined) {
        const blood = entity.physiology.bloodVolume;
        const maxBlood = 100;
        entity.physiology.bloodVolume = Math.min(maxBlood, blood + recoveryRate * 0.2);
        entity.physiology.health = entity.physiology.bloodVolume;
    }
}

// 止血药：全身外出血减半，内出血停止累积
function hemostaticTreatment(entity) {
    if (!entity || !entity.physiology) return false;
    entity.physiology.wounds.forEach(wound => {
        if (wound.bleeding) {
            wound.externalBleedRate = Math.floor(wound.externalBleedRate * 0.5);
            wound.internalBleedRate = 0;
        }
    });
    // v4.0: 止血后若 circulation 恢复到 >0，可清除危急
    if (entity.physiology.circulation > 0 && entity.physiology.criticalTimer >= 0) {
        clearCriticalState(entity);
    }
    return true;
}

// 按压止血：临时降低外出血50%，持续1回合后恢复
function pressureBleeding(entity) {
    if (!entity || !entity.physiology) return false;
    entity.physiology.wounds.forEach(wound => {
        if (wound.externalBleedRate > 0) {
            wound.externalBleedRate = Math.floor(wound.externalBleedRate * 0.5);
        }
    });
    // 设置标志，下回合恢复
    entity.physiology._pressureApplied = true;
    return true;
}

// 意志压制：减少20点疼痛
function willpowerSuppress(entity) {
    if (!entity || !entity.physiology) return false;
    entity.physiology.painLoad = Math.max(0, entity.physiology.painLoad - 20);
    return true;
}

// 恢复按压止血效果
function _revertPressureBleeding(entity) {
    if (!entity || !entity.physiology || !entity.physiology._pressureApplied) return;
    entity.physiology.wounds.forEach(wound => {
        if (wound.externalBleedRate > 0) {
            wound.externalBleedRate = Math.min(100, wound.externalBleedRate * 2);
        }
    });
    entity.physiology._pressureApplied = false;
}

// ============================================================
//  v4.0 危急状态系统
// ============================================================

/** 进入危急：强制昏迷 + 启动 5 游戏分钟死亡倒计时 */
function enterCriticalState(entity, cause) {
    if (!entity || !entity.physiology) return false;
    const phys = entity.physiology;
    if (phys.criticalTimer >= 0) {
        if (cause && !phys.criticalCause) phys.criticalCause = cause;
        return false;
    }
    phys.criticalTimer = 0;
    phys.criticalCause = cause || 'unknown';
    phys.consciousness = 0;
    phys.state = 'unconscious';
    phys.isUnconscious = true;
    if (window.gameLog && window.gameLog.add) {
        const labels = window.CRITICAL_CAUSE_LABELS || {};
        const label = labels[cause] || cause || '未知';
        window.gameLog.add('⚠️ 危急：' + label + '！剩余约 5 游戏分钟，需立即救治', 'error');
    }
    return true;
}

/** 清除危急（治疗成功：circulation>0 且 bloodVolume>0） */
function clearCriticalState(entity) {
    if (!entity || !entity.physiology) return false;
    const phys = entity.physiology;
    if (phys.criticalTimer < 0) return false;
    const blood = phys.bloodVolume !== undefined ? phys.bloodVolume : phys.health;
    if (phys.circulation <= 0 || blood <= 0) return false;
    phys.criticalTimer = -1;
    phys.criticalCause = null;
    if (window.gameLog && window.gameLog.add) {
        window.gameLog.add('💊 危急状态已解除，生命体征回稳', 'success');
    }
    return true;
}

/** 危急状态摘要（任务面板/状态栏）v4.2：使用动态 criticalRounds */
function getCriticalStatus(entity) {
    if (!entity || !entity.physiology) return null;
    const phys = entity.physiology;
    if (phys.criticalTimer < 0) return null;
    const cfg = _getPhysConfig();
    // 使用动态 criticalRounds 计算总时长（v12.4 兜底按难度读取）
    const totalRounds = phys.criticalRounds || _getDifficultyCriticalTurns();
    const totalMinutes = totalRounds * (cfg.CRITICAL_TIMER_PER_TURN || 0.1);
    const remaining = Math.max(0, totalMinutes - phys.criticalTimer);
    const mins = Math.floor(remaining);
    const secs = Math.floor((remaining - mins) * 60);
    const labels = window.CRITICAL_CAUSE_LABELS || {};
    return {
        active: true,
        remainingMinutes: remaining,
        remainingText: mins + '分' + (secs < 10 ? '0' : '') + secs + '秒',
        cause: phys.criticalCause,
        causeLabel: labels[phys.criticalCause] || phys.criticalCause || '未知'
    };
}

// ============================================================
//  生成随机敌人/野兽（v8.0 支持生理类型）
// ============================================================
// v12.9 人形亚型权重门槛：等级不足或条件不符时权重按0计
// （sound lv≥4 / illusion·essence lv≥5 / renegade 需 window.discipleState.isInSect）
function _humanoidSubWeight(sub, level) {
    if (sub.minLevel && level < sub.minLevel) return 0;
    if (sub.renegade) {
        var ds = (typeof window !== 'undefined' && window.discipleState) ? window.discipleState : null;
        if (!(ds && ds.isInSect)) return 0;
    }
    return sub.weight || 0;
}

// ==================== v17.0 战斗挑战梯度：词缀层 + 具名强敌 ====================
// 设计（用户明令）：平衡靠新增更强的敌人，禁止全局数值缩放。
// 词缀=修饰器思路（暗黑系共识）：只挂野外人形敌，属性倍率+额外绝技抽数+精英级掉落；
// 具名强敌=固定名号+招牌技+必掉对应绝技秘籍，respawnDays 防刷。
const ENEMY_AFFIXES = {
    ruthless: { name: '狂徒', minLevel: 4, attrMul: { strength: 1.35, dexterity: 1.2 }, extraDraws: 1 },
    guardian: { name: '护法', minLevel: 6, attrMul: { constitution: 1.4, willpower: 1.25 }, extraDraws: 1 },
    tangzhu:  { name: '堂主', minLevel: 8, attrMul: { allAttr: 1.25 }, extraDraws: 2 }
};
const NAMED_NEMESES = [
    { key: 'heihei',  name: '黑风寨主·独眼蛟', minLv: 8,  sig: 'sword_burst', abilities: ['venom', 'lifesteal'], attrAllMul: 1.7, fameReward: 15, respawnDays: 7, manualId: 'art_gb_tongbei' },
    { key: 'xueyi',   name: '血衣堂主·厉秋霜', minLv: 9,  sig: 'venom',       abilities: ['drain_qi'],           attrAllMul: 1.75, fameReward: 18, respawnDays: 7, manualId: 'art_xsm_xuesha' },
    { key: 'tianlong', name: '天龙左使·拓跋烬', minLv: 11, sig: 'soundwave',   abilities: ['lifesteal', 'illusion'], attrAllMul: 1.85, fameReward: 22, respawnDays: 10, manualId: 'art_tl_dashouyin' }
];
// 具名强敌组装：boss 底板 + 固定名号/招牌技/全属性倍率 + 击杀奖励标
window.buildNemesisEnemy = function (key, playerLevel) {
    const n = NAMED_NEMESES.find(x => x.key === key);
    if (!n) return null;
    const lv = Math.max(n.minLv, playerLevel || 1);
    const e = generateRandomEnemy(lv, 'boss', { noAffix: true });
    e.name = n.name;
    e.combatAbilities = [n.sig].concat(n.abilities || []);
    for (const ak in (e.attrs || {})) {
        e.attrs[ak] = Math.max(1, Math.floor((e.attrs[ak] || 10) * n.attrAllMul));
    }
    e._nemesis = { key: n.key, fameReward: n.fameReward, manualId: n.manualId };
    return e;
};
function generateRandomEnemy(level = 1, type = 'enemy', spawnOpts) {
    // ===== v13.0 人形战斗技能抽取：同一种类两个敌人实战表现可以不同 =====
    // 起始=招牌技（sub.sig）；共享池按等级门槛加权去重抽取；蛊师招牌额外自带 venom。
    // 种系天生技（pounce/venom/hardened/chill/burn）不进人形共享池，由调用处直接组装。
    function rollHumanoidAbilities(sub, lvl, extraDraws) {
        var owned = (sub && sub.sig) ? [sub.sig] : [];
        var pool = [
            { id: 'venom',       w: 0.45 },
            { id: 'lifesteal',   w: 0.5 },
            { id: 'soundwave',   w: 0.4, minLevel: 4 },
            { id: 'illusion',    w: 0.35, minLevel: 5 },
            { id: 'drain_qi',    w: 0.25, minLevel: 5 },
            { id: 'sword_burst', w: 0.4 },
            { id: 'reflect',     w: 0.3 },
            { id: 'escape',      w: 0.3 },
        ];
        // 抽数规则：lv<4 → 30%抽1；lv4~7 → 60%抽1且其中30%再抽1；lv≥8 → 保底1+40%第二个
        var draws = 0;
        if (lvl < 4) {
            draws = Math.random() < 0.3 ? 1 : 0;
        } else if (lvl <= 7) {
            if (Math.random() < 0.6) {
                draws = 1;
                if (Math.random() < 0.3) draws = 2;
            }
        } else {
            draws = 1;
            if (Math.random() < 0.4) draws = 2;
        }
        draws += (extraDraws || 0); // v17.0 词缀额外抽数（仍吃等级门控与去重）
        for (var di = 0; di < draws; di++) {
            var candidates = [];
            for (var pi = 0; pi < pool.length; pi++) {
                var pEntry = pool[pi];
                if (pEntry.minLevel && lvl < pEntry.minLevel) continue; // 等级门控
                if (owned.indexOf(pEntry.id) >= 0) continue;            // 去重（不含招牌已有）
                candidates.push(pEntry);
            }
            if (candidates.length === 0) break;
            var totalW = 0;
            for (var wi = 0; wi < candidates.length; wi++) totalW += candidates[wi].w;
            var rollW = Math.random() * totalW;
            var pickedAb = candidates[0]; // 浮点边界兜底
            for (var ci = 0; ci < candidates.length; ci++) {
                rollW -= candidates[ci].w;
                if (rollW <= 0) { pickedAb = candidates[ci]; break; }
            }
            owned.push(pickedAb.id);
        }
        // 金蚕蛊蛊师必携毒（v12.9 语义保留：机制随能力走）
        if (owned.indexOf('gu_parasite') >= 0 && owned.indexOf('venom') < 0) owned.push('venom');
        return owned;
    }

    // v12.8 保存原始类型（elite/boss 修饰需在别名折叠前记录）
    const rawType = type;
    // v7.1 类型别名
    if (type === 'bandits' || type === 'bandit' || type === 'dungeon_guard' || type === 'elite' || type === 'boss' || type === 'trial' || type === 'training_dummy') {
        type = 'enemy';
    } else if (type === 'beast_tide' || type === 'wild_beast' || type === 'spirit_fox' || type === 'secret_realm_guardian') {
        type = 'beast';
    }
    let name;
    let physiologyType = 'humanoid';
    // v12.8 生成器打标：亚型/行为/阵营/属性修正/一次性战斗标记
    let subtype = null;          // 人形亚型key或生理类型名
    let behaviorOverride = null; // 由亚型或生理类型决定的行为
    let evilFaction = false;     // 山贼/邪修/毒师 邪道倾向
    let dexMultiplier = null;    // 游侠系灵巧×1.15修正
    let preferredDamage = null;  // 亚型武器伤害偏好
    let elementType = null;      // 元素生物冰/火属性标
    // v12.9 生成器打标：亚型机制附加修正（在 pickedSub 处赋值）
    let conMultiplier = null;    // 体修体质×1.15
    let allAttrMul = null;       // 叛门弟子六维×1.05
    let swordSkillMul = null;    // 剑修剑法技能×1.4
    let pickedSubRow = null;     // 命中的人形亚型表行（供末尾机制打标读取）

    if (type === 'beast') {
        // 野兽
        if (window.nameGenerator && typeof window.nameGenerator.generateBeastName === 'function') {
            name = window.nameGenerator.generateBeastName();
        } else {
            const prefixes = ['赤', '青', '金', '银', '铁', '风', '雷', '火', '冰', '玄', '幽', '冥', '星', '月'];
            const suffixes = ['狼', '虎', '鹰', '蛇', '蛟', '龟', '猿', '蝎', '蛛', '蟒', '熊', '豹', '狐', '鹤', '龙'];
            name = prefixes[Math.floor(Math.random() * prefixes.length)] + suffixes[Math.floor(Math.random() * suffixes.length)] + '兽';
        }
        physiologyType = 'beast';
        subtype = 'beast';
    } else {
        // 人类敌人或特殊怪物
        if (window.nameGenerator && typeof window.nameGenerator.generateName === 'function') {
            name = window.nameGenerator.generateName().full;
        } else {
            const prefixes = ['赤', '青', '金', '银', '铁', '风', '雷', '火', '冰'];
            const suffixes = ['狼', '虎', '鹰', '蛇', '蛟', '龟', '猿'];
            name = prefixes[Math.floor(Math.random() * prefixes.length)] + suffixes[Math.floor(Math.random() * suffixes.length)];
        }

        // 根据敌人类型随机分配生理类型
        const physRoll = Math.random();
        if (physRoll < 0.6) {
            physiologyType = 'humanoid'; // 60%人类
            // ===== v12.8 人形亚型加权表（权重写死）=====
            // ===== v13.0 亚型=身份模板（前缀/AI姿态/武器倾向/数值修正/招牌技）；战斗机制布尔全部删除，
            // 机制一律由 sig 招牌技 + 共享池抽取的 combatAbilities 承载 =====
            const HUMANOID_SUBTYPES = [
                { key: 'bandit',    prefixes: ['山贼', '马匪'],           behavior: 'aggressive',  damage: 'blunt',  weight: 1.2, evil: true },
                { key: 'bladesman', prefixes: ['刀客', '刀匪'],           behavior: 'balanced',    damage: 'slash',  weight: 1.0 },
                { key: 'rogue',     prefixes: ['游侠', '刺客', '飞贼'],   behavior: 'opportunist', damage: 'pierce', weight: 1.0, dexMul: 1.15 },
                { key: 'cultist',   prefixes: ['邪修', '魔修'],           behavior: 'aggressive',  damage: 'slash',  weight: 1.0, evil: true },
                { key: 'poisoner',  prefixes: ['毒师', '蛊修'],           behavior: 'poisoner',    damage: 'pierce', weight: 0.6, evil: true, sig: 'venom' },
                { key: 'monk',      prefixes: ['武僧', '护法'],           behavior: 'defensive',   damage: 'blunt',  weight: 1.0 },
                // ===== v12.9 新增九类（v13.0 起机制字段收编为 sig；renegade 台词/allAttrMul 属身份flavor保留）=====
                { key: 'blood',    prefixes: ['血修', '炼血魔修'],       behavior: 'balanced',    damage: 'slash',  weight: 0.55, evil: true, sig: 'lifesteal' },
                { key: 'body',     prefixes: ['体修', '炼体士'],         behavior: 'defensive',   damage: 'blunt',  weight: 0.5,  conMul: 1.15, sig: 'reflect' },
                { key: 'sound',    prefixes: ['音修', '琴魔'],           behavior: 'balanced',    damage: 'pierce', weight: 0.35, minLevel: 4, sig: 'soundwave' },
                { key: 'illusion', prefixes: ['幻术师', '幻影师'],       behavior: 'opportunist', damage: 'slash',  weight: 0.3,  minLevel: 5, sig: 'illusion' },
                { key: 'escapee',  prefixes: ['遁修', '滑头散修'],       behavior: 'balanced',    damage: 'pierce', weight: 0.4,  dexMul: 1.15, sig: 'escape' },
                // v13.0 essence 行为从 'poisoner' 改 'balanced'：机制不再挂在行为上（摄气走 drain_qi 技）
                { key: 'essence',  prefixes: ['采补邪修'],               behavior: 'balanced',    damage: 'pierce', weight: 0.3,  minLevel: 5, evil: true, sig: 'drain_qi' },
                { key: 'gu',       prefixes: ['蛊婆', '蛊师'],           behavior: 'poisoner',    damage: 'pierce', weight: 0.35, evil: true, sig: 'gu_parasite' },
                { key: 'sword',    prefixes: ['剑修', '剑客'],           behavior: 'balanced',    damage: 'slash',  weight: 0.65, dexMul: 1.1, swordSkillMul: 1.4, sig: 'sword_burst' },
                { key: 'renegade', prefixes: ['叛徒'],                   behavior: 'balanced',    damage: 'slash',  weight: 0.45, allAttrMul: 1.05, evil: true, renegade: true },
            ];
            let totalWeight = 0;
            HUMANOID_SUBTYPES.forEach(function (s) { totalWeight += _humanoidSubWeight(s, level); });
            let subRoll = Math.random() * totalWeight;
            let pickedSub = null;
            for (let si = 0; si < HUMANOID_SUBTYPES.length; si++) {
                const sw = _humanoidSubWeight(HUMANOID_SUBTYPES[si], level);
                if (sw <= 0) continue;
                if (!pickedSub) pickedSub = HUMANOID_SUBTYPES[si]; // 浮点边界兜底：始终记住首个有权重的行
                subRoll -= sw;
                if (subRoll <= 0) { pickedSub = HUMANOID_SUBTYPES[si]; break; }
            }
            if (!pickedSub) pickedSub = HUMANOID_SUBTYPES[0]; // 极端兜底（基础六行恒有权重，理论不可达）
            const subPrefix = pickedSub.prefixes[Math.floor(Math.random() * pickedSub.prefixes.length)];
            name = subPrefix + '·' + name;
            subtype = pickedSub.key;
            // v12.9 叛门弟子：aggressive/balanced 各半
            behaviorOverride = pickedSub.behavior;
            if (pickedSub.renegade) behaviorOverride = Math.random() < 0.5 ? 'aggressive' : 'balanced';
            evilFaction = !!pickedSub.evil;
            dexMultiplier = pickedSub.dexMul || null;
            conMultiplier = pickedSub.conMul || null;
            allAttrMul = pickedSub.allAttrMul || null;
            swordSkillMul = pickedSub.swordSkillMul || null;
            pickedSubRow = pickedSub;
            preferredDamage = pickedSub.damage;
        } else if (physRoll < 0.8) {
            physiologyType = 'undead';    // 20%亡灵
            subtype = 'undead';
            // 替换名字为亡灵风格（避免"尸"+"僵尸"="尸僵尸"的语义重复）
            const undeadPrefixes = ['腐', '枯', '骸', '亡', '蚀', '怨', '骨'];
            const undeadSuffixes = ['骷髅', '僵尸', '亡灵', '厉鬼', '行尸', '幽魂'];
            // 如果前缀是"尸"或"骸"，避免搭配"僵尸"（语义重复）
            var prefix = undeadPrefixes[Math.floor(Math.random() * undeadPrefixes.length)];
            var suffix = undeadSuffixes[Math.floor(Math.random() * undeadSuffixes.length)];
            // 避免"尸僵尸"、"骸僵尸"、"尸行尸"等语义重复
            if ((prefix === '腐' || prefix === '枯' || prefix === '骸') && (suffix === '僵尸' || suffix === '行尸')) {
                suffix = '亡灵';
            }
            name = prefix + suffix;
        } else if (physRoll < 0.9) {
            physiologyType = 'construct'; // 10%构装体
            subtype = 'construct';
            const constructPrefixes = ['石', '铁', '铜', '钢', '玄', '岩', '玉', '晶'];
            const constructSuffixes = ['魔像', '傀儡', '机关人', '石像', '守卫', '兵俑'];
            name = constructPrefixes[Math.floor(Math.random() * constructPrefixes.length)]
                + constructSuffixes[Math.floor(Math.random() * constructSuffixes.length)];
        } else {
            physiologyType = 'elemental';  // 10%元素生物
            subtype = 'elemental';
            // v16.2 修正：先定元素类型、名字随类型取——机制字段禁止从展示名正则反推
            elementType = Math.random() < 0.5 ? 'ice' : 'fire';
            const elementalNames = elementType === 'ice'
                ? ['水元素', '冰元素']
                : ['火元素', '雷元素'];
            name = elementalNames[Math.floor(Math.random() * elementalNames.length)];
        }
    }

    // ===== v17.0 词缀层：野外人形敌按等级概率获得狂徒/护法/堂主（秘境深层概率翻倍） =====
    let affixDef = null, affixKey = null;
    if (physiologyType === 'humanoid' && rawType === 'enemy' && !(spawnOpts && spawnOpts.noAffix)) {
        const eligible = Object.keys(ENEMY_AFFIXES).filter(function (k) { return level >= ENEMY_AFFIXES[k].minLevel; });
        const aChance = (spawnOpts && spawnOpts.deepAffix) ? 0.16 : 0.08;
        if (eligible.length && Math.random() < aChance) {
            affixKey = eligible[Math.floor(Math.random() * eligible.length)];
            affixDef = ENEMY_AFFIXES[affixKey];
        }
    }

    // ===== v13.0 战斗技能组装：人形走共享池抽取；种系天生技不进人形池 =====
    let combatAbilities = [];
    if (physiologyType === 'humanoid') {
        combatAbilities = rollHumanoidAbilities(pickedSubRow, level, affixDef ? affixDef.extraDraws : 0);
    } else if (physiologyType === 'beast') {
        combatAbilities = ['pounce'];
    } else if (physiologyType === 'undead') {
        combatAbilities = ['venom']; // 尸毒复用 venom，显示名按生理类型取「尸毒」
    } else if (physiologyType === 'construct') {
        combatAbilities = ['hardened'];
    } else if (physiologyType === 'elemental') {
        combatAbilities = [elementType === 'ice' ? 'chill' : 'burn']; // 按既有冰/火元素判定
    }
    // v12.8 魔头自带1层硬化：同步补硬化天生技，保证「充能仅与 hardened 技共存」
    if (rawType === 'boss' && combatAbilities.indexOf('hardened') < 0) combatAbilities.push('hardened');

    const base = level * 2 + 5;
    const attrs = {
        strength: Math.floor(base * (0.8 + Math.random() * 0.4)),
        dexterity: Math.floor(base * (0.8 + Math.random() * 0.4)),
        intelligence: Math.floor(base * (0.8 + Math.random() * 0.4)),
        willpower: Math.floor(base * (0.8 + Math.random() * 0.4)),
        constitution: Math.floor(base * (0.8 + Math.random() * 0.4)),
        meridian: Math.floor(base * (0.8 + Math.random() * 0.4)),
    };

    // ===== v12.8 头目修饰：精英六维+10%、魔头六维+15% 且自带1层硬化 =====
    let titlePrefix = '';
    let attrScale = 1;
    if (rawType === 'elite') {
        titlePrefix = '精英·';
        attrScale = 1.10;
    } else if (rawType === 'boss') {
        titlePrefix = '魔头·';
        attrScale = 1.15;
    }
    if (attrScale !== 1) {
        for (const ak in attrs) {
            if (Object.prototype.hasOwnProperty.call(attrs, ak)) attrs[ak] = Math.max(1, Math.floor(attrs[ak] * attrScale));
        }
    }
    // v12.8 游侠系灵巧×1.15修正
    if (dexMultiplier) attrs.dexterity = Math.max(1, Math.floor(attrs.dexterity * dexMultiplier));
    // v12.9 体修体质×1.15
    if (conMultiplier) attrs.constitution = Math.max(1, Math.floor(attrs.constitution * conMultiplier));
    // v12.9 叛门弟子六维×1.05
    if (allAttrMul) {
        for (const raK in attrs) {
            if (Object.prototype.hasOwnProperty.call(attrs, raK)) attrs[raK] = Math.max(1, Math.floor(attrs[raK] * allAttrMul));
        }
    }
    // v17.0 词缀属性倍率与名号前置（狂徒·/护法·/堂主·）
    let affixApplied = null;
    if (affixDef) {
        for (var afK in (affixDef.attrMul || {})) {
            var afV = affixDef.attrMul[afK];
            if (afK === 'allAttr') {
                for (var afA in attrs) attrs[afA] = Math.max(1, Math.floor(attrs[afA] * afV));
            } else if (attrs[afK] != null) {
                attrs[afK] = Math.max(1, Math.floor(attrs[afK] * afV));
            }
        }
        name = affixDef.name + '·' + name;
        affixApplied = affixKey;
    }
    name = titlePrefix + name;

    // v12.8 非人形四类纳入行为分派：亡灵狂攻(尸毒)/构装体守御/野兽猛扑狂攻/元素稳健
    if (!behaviorOverride) {
        if (physiologyType === 'undead') behaviorOverride = 'aggressive';
        else if (physiologyType === 'construct') behaviorOverride = 'defensive';
        else if (physiologyType === 'beast') behaviorOverride = 'aggressive';
        else if (physiologyType === 'elemental') behaviorOverride = 'balanced';
    }

    // 只有人形生物有人类技能（内功/轻功/剑法/刀法等）
    // 野兽/亡灵/构装体/元素生物不使用人类技能体系
    let skills = {};
    if (physiologyType === 'humanoid') {
        skills = {
            '内功': Math.floor(level * 2 + Math.random() * 10),
            '轻功': Math.floor(level * 2 + Math.random() * 10),
            '绝技': Math.floor(level * 2 + Math.random() * 10),
            '拳掌': Math.floor(level * 2 + Math.random() * 10),
            '剑法': Math.floor(level * 2 + Math.random() * 10),
            '刀法': Math.floor(level * 2 + Math.random() * 10),
            '长兵': Math.floor(level * 2 + Math.random() * 10),
            '奇门': Math.floor(level * 2 + Math.random() * 10),
            '射术': Math.floor(level * 2 + Math.random() * 10),
        };
    } else if (physiologyType === 'beast') {
        // 野兽使用天生技能
        skills = {
            '爪击': Math.floor(level * 2 + Math.random() * 8),
            '撕咬': Math.floor(level * 2 + Math.random() * 8),
            '猛扑': Math.floor(level * 1.5 + Math.random() * 5),
        };
    }
    // v12.9 剑修剑法技能×1.4（仅人形技能表存在「剑法」时生效）
    if (swordSkillMul && skills['剑法']) {
        skills['剑法'] = Math.floor(skills['剑法'] * swordSkillMul);
    } else if (physiologyType === 'undead') {
        // 亡灵使用亡灵技能
        skills = {
            '尸毒': Math.floor(level * 2 + Math.random() * 8),
            '腐化': Math.floor(level * 1.5 + Math.random() * 6),
        };
    } else if (physiologyType === 'construct') {
        // 构装体使用机关技能
        skills = {
            '重击': Math.floor(level * 2 + Math.random() * 10),
            '硬化': Math.floor(level * 1.5 + Math.random() * 5),
        };
    } else {
        // 元素生物
        skills = {
            '元素之力': Math.floor(level * 2 + Math.random() * 8),
        };
    }

    // 人类/类人生物才有阵营和门派，野兽/亡灵/构装体/元素生物没有
    // v12.8：山贼/邪修/毒师 固定邪道倾向
    const isHumanoid = physiologyType === 'humanoid';
    const faction = isHumanoid
        ? (evilFaction ? '邪道' : (['正道', '邪道', '中立'][Math.floor(Math.random() * 3)]))
        : '无';
    const sect = isHumanoid ? (window.sectsData ? (Object.keys(window.sectsData)[Math.floor(Math.random() * Object.keys(window.sectsData).length)]) : '散修') : '无';

    const durabilities = initBodyDurability(attrs);

    // 生成敌人携带物（战利品系统v1.0：战斗胜利不掉落，搜刮/解剖获得）
    var carriedInventory = { items: [], spiritStones: 0, copper: 0 };
    if (typeof window.generateEnemyInventory === 'function') {
        try {
            carriedInventory = window.generateEnemyInventory({
                name: name,
                level: level,
                type: type,
                species: type === 'beast' ? 'beast' : 'human',
                physiologyType: physiologyType,
                faction: faction,
                combatAbilities: combatAbilities // v13.1 绝技透传：持有可学绝技的敌人按概率携带对应秘籍
            });
        } catch (e) {
            console.warn('generateEnemyInventory error', e);
        }
    }

    // v12.8 一次性战斗标记：构装体硬化2层；魔头自带1层硬化
    let hardenedCharges = physiologyType === 'construct' ? 2 : 0;
    if (rawType === 'boss') hardenedCharges = 1;

    const enemyData = {
        name,
        level,
        faction,
        sect,
        attrs,
        skills,
        durabilities,
        loot: { exp: 0, copper: 0 }, // 战利品系统：战斗胜利不再掉落物品
        aiBehavior: behaviorOverride || (Math.random() < 0.3 ? 'aggressive' : (Math.random() < 0.5 ? 'balanced' : 'defensive')),
        type: rawType, // v17.0：保留原始层级（enemy/elite/boss/beast）——ELITE/BOSS 掉落池与击杀加成自此真正生效
        _affix: affixApplied, // v17.0 词缀标（供掉落/展示层读取）
        species: type === 'beast' ? 'beast' : 'human',
        physiologyType: physiologyType, // 生理类型
        damageType: preferredDamage || 'slash', // v12.8：由亚型决定（人形），非人形默认切割
        carriedInventory: carriedInventory, // 新增：敌人携带物（搜刮/解剖时获得）
        subtype: subtype || physiologyType, // v12.8 亚型key或生理类型名
        combatAbilities: combatAbilities,   // v13.0 战斗技能id数组（机制唯一判定来源，见 COMBAT_ABILITIES）
    };
    // ===== 运行时状态打标（v13.0：仅运行时计数/标记透传；原八个机制布尔打标已删除，开关由 combatAbilities 承载）=====
    if (hardenedCharges > 0) enemyData._hardenedCharges = hardenedCharges; // 仅 construct(天生硬化)/boss 赋充能
    if (physiologyType === 'beast') enemyData._pounceUsed = false;         // 仅野兽（天生持 pounce）打「未扑」标
    if (elementType && (combatAbilities.indexOf('chill') >= 0 || combatAbilities.indexOf('burn') >= 0)) {
        enemyData._elementType = elementType; // 元素属性标仅随 chill/burn 技存在
    }
    if (pickedSubRow && pickedSubRow.renegade) enemyData._renegadeTauntPending = true;
    return enemyData;
}

// ---------- 战斗类 ----------
class Battle {
    constructor(playerEntity, enemyEntity) {
        this.player = playerEntity;
        this.enemy = enemyEntity;
        this.turn = 0;
        this.isPlayerTurn = true;
        this.isFinished = false;
        this.winner = null;
        this.log = [];
        this.onUpdate = null;
        this.onEnd = null;
        // 出战灵兽作为盟友
        this.allyBeast = null;
        try {
            if (typeof window.getActiveBeastCombatData === 'function') {
                var bd = window.getActiveBeastCombatData();
                if (bd && typeof Entity === 'function') {
                    this.allyBeast = new Entity(bd, 'beast');
                    this.log.push({ msg: '🐾 灵兽「' + this.allyBeast.name + '」加入战斗！' });
                    // v17.1 羁绊反哺：亲密度满百的出战灵兽滋养主人体魄
                    try {
                        var abBond = window.getActiveBeast();
                        if (abBond && (abBond.affection || 0) >= 100 && typeof window.applyBuff === 'function') {
                            window.applyBuff('fxb_petbond', { constitution: 3 }, 12);
                            this.log.push({ msg: '💞 羁绊反哺：灵兽的气息滋养你的体魄（体质+3，12小时）。' });
                        }
                    } catch (ePB) {}
                }
            }
        } catch (e) {}

        // ===== 队伍成员作为战斗实体 =====
        this.partyMembers = [];
        try {
            var pd = window.partySystem ? window.partySystem.partyData : null;
            if (pd && pd.members && pd.members.length > 0) {
                // v15.2 修复：forEach(function...) 回调内 this 为 undefined（strict），this.partyMembers.push
                // 抛 TypeError 被下方 catch 吞掉——队员入战斗从未真正生效过。改用 self 捕获实例。
                var self = this;
                pd.members.forEach(function(member) {
                    if (!member.isAlive()) return;
                    // 从PartyMember读取combatSkills（战斗技能映射）
                    var memberSkills = member.combatSkills || {};
                    var memberAttrs = {
                        strength: member.attributes.strength || 10,
                        dexterity: member.attributes.dexterity || 10,
                        intelligence: member.attributes.intelligence || 10,
                        willpower: member.attributes.willpower || 10,
                        constitution: member.attributes.constitution || 10,
                        meridian: member.attributes.meridian || Math.floor(((member.attributes.intelligence || 10) + (member.attributes.willpower || 10)) / 2)
                    };
                    // 将PartyMember包装为Entity，使用'ally'类型
                    var memberEntity = new Entity({
                        name: member.name,
                        level: member.level || 1,
                        attrs: memberAttrs,
                        // 使用combatSkills作为skills，让getAttack能读取内功加成
                        skills: memberSkills,
                        // v15.2 队友绝技透传：全部钩子经 hasAbility 判定且无阵营门控，传入即生效
                        combatAbilities: Array.isArray(member.combatAbilities) ? member.combatAbilities.slice() : [],
                        loot: { exp: 0, copper: 0 },
                        aiBehavior: 'balanced',
                        physiologyType: 'humanoid'
                    }, 'ally');
                    memberEntity._partyMemberId = member.id;
                    memberEntity._partyMemberRef = member; // 保留引用以便同步状态
                    memberEntity.health = member.health;
                    memberEntity.maxHealth = member.maxHealth;
                    self.partyMembers.push(memberEntity);
                });
                if (this.partyMembers.length > 0) {
                    this.log.push({ msg: '👥 队伍成员（' + this.partyMembers.length + '人）加入战斗！' });
                }
            }
        } catch (e) {
            console.warn('[Battle] 加载队伍成员失败:', e);
        }

        // ===== v13.0 开战播报：敌方持有战斗技能时明示牌面（名字从 COMBAT_ABILITIES 取），玩家可据此决定战术 =====
        try {
            var enemyAbilities = (this.enemy && Array.isArray(this.enemy.combatAbilities)) ? this.enemy.combatAbilities : [];
            if (enemyAbilities.length > 0) {
                var abNames = [];
                for (var eai = 0; eai < enemyAbilities.length; eai++) {
                    var abName = getCombatAbilityName(enemyAbilities[eai], this.enemy);
                    if (abNames.indexOf(abName) < 0) abNames.push(abName);
                }
                this.log.push({ msg: '👁️ ' + this.enemy.name + ' 气息驳杂，似怀绝技：' + abNames.join('、') });
            }
        } catch (eAnnounce) {}
    }

    // 玩家攻击指定部位
    // 1.2 招式 CD 递减（每回合开始流逝一回合冷却）
    _tickMoveCD() {
        if (!this._moveCD) return;
        for (var k in this._moveCD) {
            this._moveCD[k] -= 1;
            if (this._moveCD[k] <= 0) delete this._moveCD[k];
        }
    }

    playerAttack(partId) {
        if (this.isFinished || !this.isPlayerTurn) return false;
        if (!this.enemy.isAlive) return false;
        this._tickMoveCD();
        let damageType = 'blunt';
        try {
            if (typeof window.resolveWeaponDamageType === 'function') {
                damageType = window.resolveWeaponDamageType();
            } else if (window.currentEquipment && window.currentEquipment.mainHand) {
                const weapon = window.currentEquipment.mainHand;
                const tpl = window.itemById ? window.itemById[weapon.templateId || weapon.id] : null;
                damageType = (weapon.damageType || (tpl && tpl.damageType) || 'slash');
                if (damageType === 'sharp') damageType = 'slash';
            }
        } catch (e) {}
        const result = this._executeAttack(this.player, this.enemy, partId, damageType);
        this.log.push(result);
        // 1.2 普攻回气：招式耗真气，普攻回气，逼玩家穿插普攻做资源博弈
        try {
            var _pcd = (typeof window.getCurrentCharData === 'function') ? window.getCurrentCharData() : window.currentCharData;
            if (_pcd) {
                var _qRec = 6 + Math.floor(Math.max(0, ((_pcd.maxQi || 100) - (_pcd.qi || 0))) / 20);
                _pcd.qi = Math.min(_pcd.maxQi || 100, (_pcd.qi || 0) + _qRec);
            }
        } catch (e) {}
        if (window.TalismanSystem && typeof window.TalismanSystem.onPlayerAttackComplete === 'function') window.TalismanSystem.onPlayerAttackComplete();
        this.turn++;
        this._processRoundPhysiology();
        if (this._checkEnd()) return true;
        this.isPlayerTurn = false;
        setTimeout(() => this.enemyTurn(), 300);
        return true;
    }

    // v10.0：使用招式攻击指定部位
    playerAttackWithMove(partId, move) {
        if (this.isFinished || !this.isPlayerTurn) return false;
        if (!this.enemy.isAlive) return false;
        this._tickMoveCD();
        // 1.2 CD制：强力招式用后有冷却，防刷
        var _cdKey = move.moveId || move.id;
        if (this._moveCD && this._moveCD[_cdKey] > 0) {
            this.log.push({ msg: '⏳ ' + move.name + ' 冷却中（剩 ' + this._moveCD[_cdKey] + ' 回合）' });
            return false;
        }
        // 检查真气消耗
        if (move.qiCost > 0) {
            var charData = (typeof window.getCurrentCharData === 'function') ? window.getCurrentCharData() : window.currentCharData;
            if (charData && (charData.qi || 0) < move.qiCost) {
                this.log.push({ msg: '⚠️ 真气不足，无法使用 ' + move.name + '（需要 ' + move.qiCost + ' 真气）' });
                return false;
            }
            if (charData) charData.qi = Math.max(0, (charData.qi || 0) - move.qiCost);
        }
        // 检查精力消耗
        if (move.staminaCost > 0) {
            var charData2 = (typeof window.getCurrentCharData === 'function') ? window.getCurrentCharData() : window.currentCharData;
            if (charData2 && (charData2.energy || 0) < move.staminaCost) {
                this.log.push({ msg: '⚠️ 精力不足，无法使用 ' + move.name + '（需要 ' + move.staminaCost + ' 精力）' });
                return false;
            }
            if (charData2) charData2.energy = Math.max(0, (charData2.energy || 0) - move.staminaCost);
        }
        // 获取武器伤害类型
        let damageType = move.damageType || 'blunt';
        try {
            if (typeof window.resolveWeaponDamageType === 'function') {
                var wdt = window.resolveWeaponDamageType();
                if (wdt) damageType = wdt;
            }
        } catch (e) {}
        // 构建招式修正
        var actionBonus = {
            type: 'move',
            moveName: move.name,
            moveId: move.id,
            skillId: move.skillId,
            hitBonus: move.hitBonus || 0,
            armorPenetration: move.armorPenetration || 0,
            damageMult: move.damageMult || 1.0
        };
        const result = this._executeAttack(this.player, this.enemy, partId, damageType, actionBonus);
        // 招式命中后增加额外效果描述
        if (result && !result.missed) {
            result.msg = '✨ ' + (move.icon || '') + ' ' + move.name + '！' + result.msg;
        } else if (result) {
            result.msg = move.name + '：' + result.msg;
        }
        this.log.push(result);
        // 1.2 用后置 CD：damageMult>=1.5 强招 2 回合，>=1.8 超强 3 回合（普攻无 CD）
        if (!this._moveCD) this._moveCD = {};
        var _mult = move.damageMult || 1.0;
        if (_mult >= 1.8) this._moveCD[_cdKey] = 3;
        else if (_mult >= 1.5) this._moveCD[_cdKey] = 2;
        this.turn++;
        this._processRoundPhysiology();
        if (this._checkEnd()) return true;
        this.isPlayerTurn = false;
        setTimeout(() => this.enemyTurn(), 300);
        return true;
    }

    // 敌人AI行动（v4.2/v9.8.1：疼痛影响行为 + 有限自救，避免低血无限治疗）
    // 修复6：敌人可攻击队员，队员自动反击
    enemyTurn() {
        if (this.isFinished) return;
        const enemy = this.enemy;
        const phys = enemy.physiology;
        
        // v4.2: 敌人疼痛反应—疼痛高时改为防御/撤退倾向
        let painLoad = phys ? (phys.painLoad || 0) : 0;
        let bloodVol = phys ? (phys.bloodVolume !== undefined ? phys.bloodVolume : phys.health) : 100;
        // 只统计「未稳定」的流血伤口；已包扎的不再作为治疗目标
        let unstabilizedBleeding = phys && phys.wounds
            ? phys.wounds.filter(function(w) { return w.bleeding && !w.stabilized; })
            : [];
        let bleedingWounds = unstabilizedBleeding.length;
        this._enemyHealCount = this._enemyHealCount || 0;

        // ===== v12.8 五行为分派参数（aggressive/balanced/defensive/opportunist/poisoner）=====
        var behavior = enemy.aiBehavior || 'balanced';
        const targetParts = ['brain', 'chest', 'dantian', 'abdomen']; // 默认要害池（balanced/poisoner共用）
        var partPool = (behavior === 'aggressive') ? ['head', 'chest', 'neck'] : targetParts;
        var playerTargetBias = (behavior === 'aggressive') ? 0.5 : 0.33; // 多目标时选玩家概率
        var healBloodThreshold = (behavior === 'aggressive') ? 25 : 40;  // 狂战自救门槛收紧
        var guardChance = (behavior === 'defensive') ? 0.35 : 0;
        // v12.8 守御标记每回合行动前重置（仅守御当回合并置1）
        enemy._guardTurns = 0;

        // ===== v12.9 叛门弟子首次交手台词（仅一次）=====
        if (enemy._renegadeTauntPending === true) {
            enemy._renegadeTauntPending = false;
            this.log.push({ msg: enemy.name + " 冷笑：'师门？早就是笑话了。'" });
        }

        // ===== v12.9 遁逃分支：重伤时概率尝试遁走；成功按玩家方结束但无战利品 =====
        // v13.0 门槛改查 escape 技（行为字符串/身份布尔不再是机制来源）
        if (enemy.hasAbility('escape') && bloodVol > 0 && bloodVol < 30 && Math.random() < 0.45) {
            var escapeRaw = 0.35 + ((enemy.getSpeed ? enemy.getSpeed() : 10) - (this.player.getSpeed ? this.player.getSpeed() : 10)) * 0.01;
            var escapeRate = Math.max(0.25, Math.min(0.7, escapeRaw));
            if (Math.random() < escapeRate) {
                this.log.push({ msg: '💨 遁术！' + enemy.name + ' 脚底抹油，遁走了！' });
                enemy._fled = true;
                this.noSpoils = true; // 无战利品标记：app.js 据此跳过尸体/收服/任务击杀/奖励
                this.turn++;
                if (this._checkEnd()) return; // 复用现有结束路径（_checkEnd 的 _fled 分支）
                this.isFinished = true;
                this.winner = 'player';
                this.isPlayerTurn = false;
                if (this.onUpdate) this.onUpdate();
                return;
            }
            // 遁逃失败：本回合空过
            this.log.push({ msg: enemy.name + ' 试图施展遁术，被你截住了！' });
            this.turn++;
            this._processRoundPhysiology();
            if (this._checkEnd()) return;
            this.isPlayerTurn = true;
            if (this.onUpdate) this.onUpdate();
            return;
        }

        // 自救条件：有未稳定流血，且本场治疗次数未超限
        // 血量低但伤口已包扎 → 继续攻击，不再空耗回合
        var canTryHeal = bleedingWounds > 0 && this._enemyHealCount < 2;
        var wantHeal = canTryHeal && (painLoad >= 60 || bloodVol < healBloodThreshold || bleedingWounds >= 2);
        // 低血时也不是 100% 治疗：保留反击机会（约 55% 才治疗）
        if (wantHeal && bloodVol < healBloodThreshold && bleedingWounds < 2 && Math.random() > 0.55) {
            wantHeal = false;
        }
        
        if (wantHeal && typeof bandageWound === 'function' && phys) {
            var wounds = unstabilizedBleeding.slice();
            wounds.sort(function(a, b) { return (b.externalBleedRate || 0) - (a.externalBleedRate || 0); });
            var bwResult = bandageWound(enemy, wounds[0].id);
            if (bwResult) {
                this._enemyHealCount++;
                this.log.push({ msg: '🩹 ' + enemy.name + ' 匆忙包扎了伤口！' });
                this.turn++;
                this._processRoundPhysiology();
                if (this._checkEnd()) return;
                this.isPlayerTurn = true;
                if (this.onUpdate) this.onUpdate();
                return;
            }
            // 包扎失败则落入正常攻击
        }
        
        // 疼痛极高时有小概率动作失败（不再与治疗互斥成「永远挨打」）
        if (painLoad >= 80 && Math.random() < 0.2) {
            this.log.push({ msg: enemy.name + ' 因剧痛而行动迟缓' });
            this.turn++;
            this._processRoundPhysiology();
            if (this._checkEnd()) return;
            this.isPlayerTurn = true;
            if (this.onUpdate) this.onUpdate();
            return;
        }
        
        // ===== v12.8 defensive 守御姿态：血量偏低且无未稳定流血可治时，概率放弃进攻 =====
        if (guardChance > 0 && bloodVol < 55 && bleedingWounds === 0 && Math.random() < guardChance) {
            enemy._guardTurns = 1;
            this.log.push({ msg: '🛡️ ' + enemy.name + ' 摆出凝神防御的架势' });
            this.turn++;
            this._processRoundPhysiology();
            if (this._checkEnd()) return;
            this.isPlayerTurn = true;
            if (this.onUpdate) this.onUpdate();
            return;
        }

        // ===== 修复6：敌人可攻击队员 =====
        // 收集所有可攻击目标（玩家+灵兽+队员）
        var possibleTargets = [this.player];
        if (this.allyBeast && this.allyBeast.isAlive) possibleTargets.push(this.allyBeast);
        // 加入存活的队员
        var alivePartyMembers = this.partyMembers.filter(function(m) { return m.isAlive; });
        alivePartyMembers.forEach(function(m) { possibleTargets.push(m); });

        // 随机选择目标（v12.8 行为偏置：默认玩家33%/灵兽20%/队员平分；狂战提高至50%）
        var attackTarget = this.player;
        if (possibleTargets.length > 1) {
            var roll = Math.random();
            if (roll < playerTargetBias || possibleTargets.length === 1) {
                attackTarget = this.player;
            } else if (roll < playerTargetBias + 0.20 && this.allyBeast && this.allyBeast.isAlive) {
                attackTarget = this.allyBeast;
            } else {
                // 从队员中随机选一个
                var aliveTargets = possibleTargets.filter(function(t) { return t !== this.player && t !== this.allyBeast; }.bind(this));
                if (aliveTargets.length > 0) {
                    attackTarget = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
                }
            }
        }

        // ===== 部位选择（v12.8 先定目标再选部位：游斗需读目标耐久分布）=====
        const allParts = PART_IDS;
        var selectedPart;
        if (behavior === 'opportunist' && attackTarget && attackTarget.durabilities) {
            // 游斗：从目标当前耐久最低的3个部位里随机（制造部位残废），不再优先要害
            var durKeys = Object.keys(attackTarget.durabilities);
            durKeys.sort(function(a, b) { return (attackTarget.durabilities[a] || 0) - (attackTarget.durabilities[b] || 0); });
            var crippledPool = durKeys.slice(0, 3);
            selectedPart = crippledPool[Math.floor(Math.random() * crippledPool.length)];
        } else {
            const part = partPool[Math.floor(Math.random() * partPool.length)];
            // 疼痛高时攻击更随机（瞄准不准）；狂战仍保留30%全随机兜底
            selectedPart = (painLoad >= 50 && Math.random() < 0.4)
                ? allParts[Math.floor(Math.random() * allParts.length)]
                : (Math.random() < 0.3 ? allParts[Math.floor(Math.random() * allParts.length)] : part);
        }
        // 疼痛高时攻击力下降
        let enemyDamageType = enemy.damageType || 'slash';
        if (enemyDamageType === 'sharp') enemyDamageType = 'slash';
        // 临时降低攻击力以模拟疼痛惩罚
        const painPenalty = painLoad >= 50 ? (1 - (painLoad - 50) / 200) : 1;
        // 保存原始攻击并应用惩罚
        const origGetAttack = enemy.getAttack;
        if (painPenalty < 1) {
            enemy.getAttack = function() {
                var base = origGetAttack.call(this);
                return Math.max(1, Math.floor(base * painPenalty));
            };
        }
        const result = this._executeAttack(enemy, attackTarget, selectedPart, enemyDamageType);
        // 恢复原始攻击
        if (painPenalty < 1) {
            enemy.getAttack = origGetAttack;
        }
        this.log.push(result);
        if (attackTarget !== this.player && attackTarget.isAlive === false) {
            if (attackTarget === this.allyBeast) {
                this.log.push({ msg: '🐾 灵兽不支倒地，退出本场战斗' });
            } else {
                this.log.push({ msg: '👥 队员「' + attackTarget.name + '」被击败！' });
            }
        }
        this.turn++;
        // 每回合末处理生理
        this._processRoundPhysiology();
        if (this._checkEnd()) return;
        
        // ===== 修复6：队员自动攻击 =====
        // 所有存活队员自动攻击敌人
        if (this.enemy && this.enemy.isAlive) {
            var aliveMembers = this.partyMembers.filter(function(m) { return m.isAlive; });
            for (var mi = 0; mi < aliveMembers.length; mi++) {
                var member = aliveMembers[mi];
                var mPart = targetParts[Math.floor(Math.random() * targetParts.length)];
                var mResult = this._executeAttack(member, this.enemy, mPart, 'slash');
                // 同步回PartyMember的health
                if (member._partyMemberRef) {
                    member._partyMemberRef.health = member.health != null ? member.health : member._partyMemberRef.health;
                }
                this.log.push(mResult);
                this.turn++;
                this._processRoundPhysiology();
                if (this._checkEnd()) return;
            }
        }
        
        // 灵兽协助攻击（已倒下则不攻击）
        if (this.allyBeast && this.allyBeast.isAlive && this.enemy && this.enemy.isAlive) {
            const beastPart = targetParts[Math.floor(Math.random() * targetParts.length)];
            // B5：按灵兽技能名选择基础伤害类型
            var btype = 'slash';
            try {
                var sk = (this.allyBeast.skills && (Array.isArray(this.allyBeast.skills) ? this.allyBeast.skills[0] : null))
                    || (this.allyBeast.data && this.allyBeast.data.skills && this.allyBeast.data.skills[0]);
                var sn = (typeof sk === 'string') ? sk : (sk && (sk.name || sk.id)) || '';
                if (/冰|冻|寒|水/.test(sn)) btype = 'pierce';
                else if (/火|焰|炎|雷|爆/.test(sn)) btype = 'blunt';
                else if (/风|刃|刺|牙/.test(sn)) btype = 'slash';
                else if (/撞|锤|尾|压/.test(sn)) btype = 'blunt';
                if (Math.random() < 0.15 && sn) {
                    this.log.push({ msg: '🐾 灵兽使出「' + sn + '」！' });
                }
            } catch (e) {}
            const br = this._executeAttack(this.allyBeast, this.enemy, beastPart, btype);
            this.log.push(br);
            this.turn++;
            if (this._checkEnd()) return;
        }
        this.isPlayerTurn = true;
        if (this.onUpdate) this.onUpdate();
    }

    // 每回合末处理生理
    _processRoundPhysiology() {
        try {
            if (typeof processPhysiology === 'function') {
                processPhysiology(this.player, 6);
                processPhysiology(this.enemy, 6);
                if (this.allyBeast && this.allyBeast.isAlive) {
                    processPhysiology(this.allyBeast, 6);
                }
                // 修复6：队员的生理处理
                for (var pi = 0; pi < this.partyMembers.length; pi++) {
                    if (this.partyMembers[pi].isAlive) {
                        processPhysiology(this.partyMembers[pi], 6);
                    }
                }
            }
        } catch (e) {
            console.warn('[生理] 处理异常:', e);
        }
        // v12.8：毒素侵蚀结算（poisonLoad tick，出血处理后统一扣减）
        try {
            this._tickPoisonLoads();
        } catch (pe) {
            console.warn('[毒素] 结算异常:', pe);
        }
    }

    // v13.0 敌方接触效果（每次命中只加一次）：施毒/金蚕蛊/摄魂音/迷魂术/采补 + 种系寒冰真气/炎爆劲
    // 全部改查 COMBAT_ABILITIES（hasAbility）——行为字符串与身份布尔不再是机制来源。
    // 调用点在闪避判定之后——被闪避不触发；格挡/化解视为擦碰仍接触
    _applyContactEffects(attacker, defender) {
        try {
            if (!attacker || !defender || defender.isAlive === false) return;
            // v13.1 双向对称：玩家习得绝技后同样生效（施毒/摄魂音/迷魂术对敌；机制数值与敌方完全一致）
            var phys = defender.physiology;
            if (!phys) return;
            // v16.2 生理分型免疫矩阵：机制只认显式类型标签，非血肉之躯不吃血肉效果——首次以世界观文案点破
            var dType = phys.type;
            var isFlesh = (dType === 'humanoid' || dType === 'beast');
            if (!defender._immuneLog) defender._immuneLog = {};
            function immuneOnce(key, msg) {
                if (defender._immuneLog[key]) return false;
                defender._immuneLog[key] = true;
                this.log.push({ msg: msg });
                return true;
            }
            // v13.0 施毒：持有 venom 即生效（undead 天生尸毒复用同机制；显示名按生理类型取「尸毒」）
            // v16.2 构装体无血无肉、元素无质无形、亡灵不惧活人毒理——仅血肉之躯可中毒
            if (attacker.hasAbility('venom')) {
                if (!isFlesh) {
                    var pImmuneMsg = dType === 'undead' ? '☠️ 尸毒入骨，如泥牛入海——亡灵不受活人毒理。' : '☠️ 毒雾散去——对' + defender.name + '毫无作用。';
                    immuneOnce.call(this, 'poison', pImmuneMsg);
                } else {
                // 毒抗减免：combat-stats 的 poisonRes（0~50）
                var res = (typeof window.getDerivedCombatStats === 'function')
                    ? (window.getDerivedCombatStats(defender).poisonRes || 0) : 0;
                var add = Math.round((6 + (attacker.level || 1)) * (1 - res / 100));
                if (attacker.hasAbility('gu_parasite')) add = Math.round(add * 1.5); // 金蚕蛊携毒：上毒量×1.5
                if (add > 0) {
                    var alreadyPoisoned = (phys.poisonLoad || 0) > 0;
                    phys.poisonLoad = Math.min(100, (phys.poisonLoad || 0) + add);
                    if (!alreadyPoisoned) {
                        this.log.push({ msg: '☠️ ' + getCombatAbilityName('venom', attacker) + '！' + defender.name + ' 中毒了！' });
                    }
                }
                }
            }
            // v13.0 种系元素技：寒冰真气（下一击命中率-10）/ 炎爆劲（灼烧疼痛）
            // v16.2 冰元素不畏寒、火元素不惧灼；构装体/亡灵没有痛觉神经
            if (attacker.hasAbility('chill')) {
                if (dType === 'elemental' && defender._elementType === 'ice') {
                    immuneOnce.call(this, 'chill', '❄️ 寒气加身，不过如沐春风。');
                } else {
                    defender._chilledNext = true; // 目标下一击命中率-10
                }
            } else if (attacker.hasAbility('burn')) {
                if (dType === 'elemental' && defender._elementType === 'fire') {
                    immuneOnce.call(this, 'burn', '🔥 烈焰加身，于它如同沐浴。');
                } else if (isFlesh) {
                    phys.painLoad = Math.min(100, (phys.painLoad || 0) + 8); // 灼烧疼痛
                }
            }
            // ===== 摄魂音：神魂震荡（neuralShock 受灵抗减免、下限4；疼痛+6）=====
            // 复用既有 neuralShock 回合衰减与 updateConsciousness 昏迷链，不新增状态系统
            // v16.2 构装体/元素生物没有神魂可震
            if (attacker.hasAbility('soundwave') && phys && dType !== 'construct' && dType !== 'elemental') {
                var sResist = defender.spiritResist != null ? defender.spiritResist : 0;
                var shockAdd = Math.max(4, Math.round((10 + (attacker.level || 1) * 0.5) * (1 - sResist / 100)));
                phys.neuralShock = Math.min(100, (phys.neuralShock || 0) + shockAdd);
                phys.painLoad = Math.min(100, (phys.painLoad || 0) + 6);
                if (!defender._soundShockLogged) {
                    defender._soundShockLogged = true;
                    this.log.push({ msg: '🎵 摄魂音直入识海，' + defender.name + ' 神魂震荡！' });
                }
            }
            // ===== 迷魂术：命中叠加迷扰层数（上限2），对方攻击时每层命中率-15并消耗 =====
            // v16.2 构装体无目可迷、元素无形可扰
            if (attacker.hasAbility('illusion')) {
                if (dType === 'construct' || dType === 'elemental') {
                    immuneOnce.call(this, 'illusion', '🌀 幻光穿过它的躯壳——那里没有可供迷惑的神志。');
                } else {
                var freshDuped = (defender._illusionHits || 0) === 0;
                defender._illusionHits = Math.min(2, (defender._illusionHits || 0) + 2);
                if (freshDuped) {
                    defender._illusionLogged = true;
                    this.log.push({ msg: '🌀 迷魂术迷扰！' + defender.name + ' 视线开始迷离' });
                }
                }
            }
            // ===== 金蚕蛊：一次性种蛊标记（运行时字段，战斗结束自然失效）=====
            if (attacker.hasAbility('gu_parasite') && defender._guMarked !== true) {
                defender._guMarked = true;
            }
        } catch (ce) {}
    }

    // v12.8 毒素负荷每回合结算（激活 poison-system 的 poisonLoad 字段）
    // painLoad += ceil(load*6%)；有血者扣血 round(load/25)；亡灵跳过；构装体扣integrity；元素扣health；每回合自然消退4点
    _tickPoisonLoads() {
        var roster = [this.player, this.enemy];
        if (this.allyBeast && this.allyBeast.isAlive) roster.push(this.allyBeast);
        for (var mi = 0; mi < this.partyMembers.length; mi++) roster.push(this.partyMembers[mi]);
        for (var ri = 0; ri < roster.length; ri++) {
            var ent = roster[ri];
            if (!ent || !ent.physiology || ent.isAlive === false) continue;
            var phys = ent.physiology;
            var load = phys.poisonLoad || 0;
            if (load <= 0) continue;
            var ptype = phys.type;
            // 疼痛累积（全类型生效）
            phys.painLoad = Math.min(100, (phys.painLoad || 0) + Math.ceil(load * 0.06));
            // 血量/结构扣减（按生理类型分支）
            var drain = Math.max(0, Math.round(load / 25));
            if (ptype === 'undead') {
                // 亡灵无体液循环：跳过血量扣减（仅疼痛）
            } else if (ptype === 'construct') {
                phys.integrity = Math.max(0, (phys.integrity == null ? 100 : phys.integrity) - drain);
            } else if (ptype === 'elemental') {
                phys.health = Math.max(0, (phys.health == null ? 100 : phys.health) - drain);
            } else if (phys.bloodVolume !== undefined) {
                phys.bloodVolume = Math.max(0, phys.bloodVolume - drain);
                phys.health = phys.bloodVolume;
            } else if (phys.health != null) {
                phys.health = Math.max(0, phys.health - drain);
            }
            // 自然消退
            phys.poisonLoad = Math.max(0, load - 4);
            // 节流日志：仅首次超过30时记录（回落后重置，避免刷屏）
            if (load > 30 && !ent._poisonHighLogged) {
                ent._poisonHighLogged = true;
                this.log.push({ msg: '☠️ 毒素侵蚀着' + ent.name });
            } else if (load <= 30) {
                ent._poisonHighLogged = false;
            }
            // 死亡复核（毒血扣减/integrity归零后）
            if (typeof ent.checkDeath === 'function') ent.checkDeath();
        }
        // ===== v12.9 金蚕蛊啃噬结算：被种蛊者每回合随机非致命部位耐久-3（min 0）、疼痛+2 =====
        // 与 poisonLoad 无关（蛊虫入体后持续生效）；首回合记日志；战斗结束随实体自然失效
        // （v13.0 种蛊标记改由 gu_parasite 技在接触钩子中写入）
        for (var gi = 0; gi < roster.length; gi++) {
            var gent = roster[gi];
            if (!gent || !gent.physiology || gent.isAlive === false) continue;
            if (gent._guMarked !== true) continue;
            var gphys = gent.physiology;
            gphys.painLoad = Math.min(100, (gphys.painLoad || 0) + 2);
            var safeParts = [];
            for (var gk in gent.durabilities) {
                if (Object.prototype.hasOwnProperty.call(gent.durabilities, gk)
                    && gk !== 'brain' && gk !== 'head' && gk !== 'chest' && gk !== 'neck' && gk !== 'dantian') {
                    safeParts.push(gk);
                }
            }
            if (safeParts.length > 0) {
                var gPart = safeParts[Math.floor(Math.random() * safeParts.length)];
                gent.durabilities[gPart] = Math.max(0, (gent.durabilities[gPart] || 0) - 3);
            }
            if (!gent._guTickLogged) {
                gent._guTickLogged = true;
                this.log.push({ msg: '🐛 金蚕蛊入体，啃噬筋骨！' });
            }
            if (typeof gent.checkDeath === 'function') gent.checkDeath();
        }
    }

    // v12.4 难度：判断攻击者是否属于敌方阵营（玩家/队员/玩家方灵兽不算敌方）
    _isEnemySide(entity) {
        if (!entity) return false;
        if (entity === this.player || entity === this.allyBeast) return false;
        if (Array.isArray(this.partyMembers) && this.partyMembers.indexOf(entity) >= 0) return false;
        return entity.type === 'enemy' || entity.type === 'beast';
    }

    // v13.0 实际受伤后结算钩子：吸血功(lifesteal) / 铁体功反震(reflect) / 采补功摄气(drain_qi)
    // 全部改查 COMBAT_ABILITIES（hasAbility）；数值取常量（REFLECT_PCT）。
    // 仅在 _executeAttack 三条真实扣血路径（格挡/化解/正常）的 takeDamage 之后调用；actual≥1 才触发。
    // 反震走 attacker.takeDamage 直调，不再经过 _executeAttack —— 天然不连锁触发对方反震。
    _applyOnHitAftermath(attacker, defender, actual) {
        var extra = '';
        try {
            if (!attacker || !defender || !(actual >= 1)) return extra;
            // 吸血功：命中造成实际伤害后按30%回复气血（上限100），本场首次记日志
            if (attacker.hasAbility('lifesteal') && attacker.physiology
                && (attacker.physiology.bloodVolume || 0) > 0) {
                var gain = Math.round(actual * 0.3);
                if (gain > 0) {
                    var newBlood = Math.min(100, (attacker.physiology.bloodVolume || 0) + gain);
                    var realGain = Math.round(newBlood - attacker.physiology.bloodVolume);
                    attacker.physiology.bloodVolume = newBlood;
                    if (attacker.physiology.health !== undefined) attacker.physiology.health = newBlood;
                    if (!this._lifestealLogged && realGain > 0) {
                        this._lifestealLogged = true;
                        extra += ' 🩸 吸血功！' + attacker.name + ' 汲取你的鲜血恢复' + realGain + '点';
                    }
                }
            }
            // 铁体功反震：受击方持有 reflect 技时攻击者反受 floor(实际伤害×20%) 钝伤（直击胸口）
            var reflPct = defender.hasAbility('reflect') ? REFLECT_PCT : 0;
            if (reflPct > 0 && attacker.isAlive !== false) {
                var reflDmg = Math.floor(actual * reflPct / 100);
                if (reflDmg >= 1 && typeof attacker.takeDamage === 'function') {
                    var reflActual = attacker.takeDamage('chest', reflDmg, 'blunt');
                    if (reflActual >= 1) {
                        extra += ' 🪨 铁体功震劲反噬！' + attacker.name + ' 反受' + reflActual + '点钝伤';
                    }
                }
            }
            // 采补功：命中玩家时摄取真气转化为自身气血（日志节流：每场最多2次）；对非玩家目标退化为普通攻击
            if (attacker.hasAbility('drain_qi') && defender === this.player
                && typeof window !== 'undefined' && window.currentCharData) {
                var cdEss = window.currentCharData;
                var qiBefore = cdEss.qi || 0;
                var qiCost = 6 + (attacker.level || 1);
                var qiDrained = Math.min(qiBefore, qiCost);
                cdEss.qi = Math.max(0, qiBefore - qiCost);
                if (qiDrained > 0 && attacker.physiology
                    && (attacker.physiology.bloodVolume || 0) > 0) {
                    attacker.physiology.bloodVolume = Math.min(100,
                        (attacker.physiology.bloodVolume || 0) + Math.floor(qiDrained * 0.5));
                    if (attacker.physiology.health !== undefined) attacker.physiology.health = attacker.physiology.bloodVolume;
                }
                if ((this._essenceLogCount || 0) < 2) {
                    this._essenceLogCount = (this._essenceLogCount || 0) + 1;
                    extra += ' 🕸️ 采补功！' + attacker.name + ' 摄取你的真气！(-' + qiDrained + ')';
                }
            }
            // v13.1 玩家侧采补功：与敌方摄气对称——玩家持 drain_qi 命中敌人时摄取其精力转化为真气
            // 目标 stamina -(6+level)（min 0）；转化 floor(实际摄取×0.5) 入 currentCharData.qi（clamp maxQi）
            // v15.2 队友侧对称放宽：队员持 drain_qi 攻击时同样生效，真气直接写入 _partyMemberRef.qi（免战后同步）
            if ((attacker === this.player || attacker._partyMemberRef) && typeof attacker.hasAbility === 'function'
                && attacker.hasAbility('drain_qi') && defender
                && typeof window !== 'undefined' && window.currentCharData) {
                var tgtStamina = defender.stamina != null ? defender.stamina : (defender.maxStamina || 0);
                var pDrainCost = 6 + (defender.level || 1);
                var staminaDrained = Math.min(Math.max(0, tgtStamina), pDrainCost);
                defender.stamina = Math.max(0, tgtStamina - pDrainCost);
                var qiGain = Math.floor(staminaDrained * 0.5);
                if (qiGain > 0) {
                    if (attacker._partyMemberRef) {
                        var refDQ = attacker._partyMemberRef;
                        var maxQiDQ = refDQ.maxQi != null ? refDQ.maxQi : 50;
                        refDQ.qi = Math.min(maxQiDQ, (refDQ.qi != null ? refDQ.qi : 0) + qiGain);
                    } else {
                        var cdPDrain = window.currentCharData;
                        var maxQiPDrain = cdPDrain.maxQi != null ? cdPDrain.maxQi : 100;
                        cdPDrain.qi = Math.min(maxQiPDrain, (cdPDrain.qi != null ? cdPDrain.qi : 0) + qiGain);
                    }
                }
                if ((this._pDrainLogCount || 0) < 2 && staminaDrained > 0) {
                    this._pDrainLogCount = (this._pDrainLogCount || 0) + 1;
                    extra += ' 🕸️ 采补功！' + (attacker === this.player ? '你' : attacker.name) + '摄取' + defender.name + '精气' + (qiGain > 0 ? ('，真气+' + qiGain) : '');
                }
            }
        } catch (amErr) {}
        return extra;
    }

    // A2: 伤害计算（v9.8：破甲降低有效防御；v12.4 敌方攻击受难度系数）
    _calculateDamage(attacker, defender, penetratePct) {
        let atk = attacker.getAttack ? attacker.getAttack() : 10;
        // v12.4 难度条件栏：敌方攻击 ×enemyDmgMul（宽松0.75/标准1.2/凶险1.7）
        if (this._isEnemySide(attacker)) {
            try {
                if (typeof window.getDifficultyParam === 'function') {
                    const mul = window.getDifficultyParam('enemyDmgMul');
                    if (typeof mul === 'number' && mul > 0 && mul !== 1) atk = atk * mul;
                }
            } catch (e) {}
        }
        let def = defender.getDefense ? defender.getDefense() : 5;
        penetratePct = Math.max(0, Math.min(40, penetratePct || 0));
        def = def * (1 - penetratePct / 100);
        let damage = Math.floor(atk - def * 0.3 + (Math.random() * 2 - 1));
        // 0.2.2 #2 五行相克：玩家主功法元素 vs 敌人元素标（冰→水/火→火），±15%
        if (attacker.type === 'player' && defender._elementType) {
            try {
                var _atkEl = (typeof window._getMainTechniqueElement === 'function') ? window._getMainTechniqueElement() : null;
                var _defElMap = { ice: '水', fire: '火' };
                var _defEl = _defElMap[defender._elementType];
                if (_atkEl && _defEl && typeof window.getElementalDamageMul === 'function') {
                    var _em = window.getElementalDamageMul(_atkEl, _defEl);
                    if (_em !== 1) damage = Math.max(1, Math.floor(damage * _em));
                }
            } catch (e) {}
        }
        return Math.max(1, damage);
    }

    // 反击：50% 伤害，不暴击、不连环
    _tryCounter(defender, attacker, partId) {
        if (!attacker || !attacker.isAlive || !defender) return null;
        var dStats = (typeof window.getDerivedCombatStats === 'function')
            ? window.getDerivedCombatStats(defender)
            : { counter: 0 };
        var rate = dStats.counter || 0;
        if (rate <= 0 || Math.random() * 100 >= rate) return null;
        var dmg = Math.max(1, Math.floor(this._calculateDamage(defender, attacker, 0) * 0.5));
        // 反击打随机非致命部位简化：胸
        var cPart = partId && attacker.durabilities && attacker.durabilities[partId] != null ? partId : 'chest';
        if (!attacker.durabilities || attacker.durabilities[cPart] == null) {
            cPart = Object.keys(attacker.durabilities || {})[0] || 'chest';
        }
        var actual = attacker.takeDamage ? attacker.takeDamage(cPart, dmg, 'blunt') : dmg;
        return { msg: `↩️ ${defender.name} 反击！对 ${attacker.name} 造成 ${actual} 点伤害`, damage: actual, counter: true };
    }

    // C: v9.8 判定 — 命中→闪避→格挡→化解→破甲伤害/暴击→反击
    _executeAttack(attacker, defender, partId, damageType, actionBonus) {
        if (!defender.durabilities.hasOwnProperty(partId)) {
            return { msg: `${attacker.name} 攻击了无效的部位！` };
        }
        if (attacker.physiology && attacker.physiology.isUnconscious) {
            return { msg: `${attacker.name} 已昏迷，无法行动！`, missed: true };
        }
        const atkPain = typeof getPainCombatPenalties === 'function'
            ? getPainCombatPenalties(attacker)
            : { hitPenalty: 0, dodgePenalty: 0, actionFailRate: 0, effectivePain: 0 };
        if (atkPain.actionFailRate > 0 && Math.random() < atkPain.actionFailRate) {
            return { msg: `${attacker.name} 剧痛难忍，动作失败！`, missed: true, painFail: true };
        }

        var aStats = (typeof window.getDerivedCombatStats === 'function')
            ? window.getDerivedCombatStats(attacker)
            : null;
        var dStats = (typeof window.getDerivedCombatStats === 'function')
            ? window.getDerivedCombatStats(defender)
            : null;

        const attackerEff = attacker.getEffectiveAttrs ? attacker.getEffectiveAttrs() : {};
        const defenderEff = defender.getEffectiveAttrs ? defender.getEffectiveAttrs() : {};
        const attackerDex = attackerEff.dexterity || 10;
        const attackerInt = attackerEff.intelligence || 10;

        let attackerSkill = 0;
        if (attacker.type === 'player' && typeof getPlayerWeaponSkill === 'function') {
            attackerSkill = getPlayerWeaponSkill();
        } else if (attacker.skills) {
            for (const sk in attacker.skills) {
                if (attacker.skills.hasOwnProperty(sk) && attacker.skills[sk] > attackerSkill) {
                    attackerSkill = attacker.skills[sk];
                }
            }
        }

        // 防守方闪避改读轻功（不读武器技能）
        const defQing = (defender.skills && defender.skills['轻功']) || 0;
        const defenderSpeed = defender.getSpeed ? defender.getSpeed() : 50;
        const defenderToughness = dStats
            ? dStats.toughness
            : (defender.toughness != null ? defender.toughness : ((defender.attrs?.constitution || 10) * 0.3));

        // ========== 2. 命中 ==========
        let hitRate = aStats
            ? aStats.hit
            : (85 + (attackerDex - 10) * 0.3 + attackerSkill * 0.1);
        if (atkPain.hitPenalty) hitRate += atkPain.hitPenalty;
        const preciseParts = ['eyes', 'handL', 'handR', 'jaw', 'brain'];
        if (preciseParts.includes(partId)) {
            // 神识减免精确部位惩罚
            var precisePen = aStats
                ? aStats.precisePenalty
                : (20 - Math.min(10, attackerInt * 0.1));
            hitRate -= precisePen;
        }
        if (actionBonus && actionBonus.type === 'precise') {
            hitRate += actionBonus.bonus || 0;
        }
        try {
            if (typeof window.getWeatherCombatBonus === 'function') {
                const hitM = window.getWeatherCombatBonus('hit') || 1;
                if (hitM < 1) hitRate *= hitM;
            }
        } catch (e) {}
        // v12.8 寒冷减速：被寒冰真气(chill)命中的下一击命中率-10（标记在命中后消耗）
        if (attacker._chilledNext === true) hitRate -= 10;
        // v13.0 迷魂术迷扰：命中率-15并消耗一层（可与寒冷叠加；施加在 _applyContactEffects）
        if (attacker._illusionHits > 0) { hitRate -= 15; attacker._illusionHits--; }
        hitRate = Math.max(5, Math.min(95, hitRate));

        if (Math.random() * 100 > hitRate) {
            return { msg: `${attacker.name} 的攻击未命中！`, missed: true };
        }

        // ========== 3. 闪避（上限 35%；防守技能用轻功）==========
        let dodgeRate = dStats
            ? dStats.dodge
            : (10 + defenderSpeed * 0.15 + defQing * 0.03);
        const defPain = typeof getPainCombatPenalties === 'function'
            ? getPainCombatPenalties(defender)
            : { dodgePenalty: 0 };
        dodgeRate += defPain.dodgePenalty || 0;
        dodgeRate = Math.max(1, Math.min(35, dodgeRate));

        if (Math.random() * 100 < dodgeRate) {
            var dodgeMsg = `${defender.name} 闪避了攻击！`;
            var counterRes = this._tryCounter(defender, attacker, partId);
            if (counterRes) dodgeMsg += ' ' + counterRes.msg;
            return { msg: dodgeMsg, missed: true, dodged: true, counter: !!counterRes };
        }

        // ========== 3.5 接触效果钩子（v12.8：未被闪避即接触；毒/元素冰火每次攻击只结算一次）==========
        this._applyContactEffects(attacker, defender);

        // ========== 4. 格挡（有条件；上限 45%）==========
        var canBlock = dStats ? dStats.canBlock : true;
        let blockRate = dStats ? dStats.block : 0;
        if (!dStats) {
            blockRate = 5 + defenderSpeed * 0.05 + (defenderEff.strength || 10) * 0.1;
            if (defender.type === 'player' && window.currentEquipment?.offHand) {
                const offHand = window.currentEquipment.offHand;
                if (offHand) {
                    const template = window.itemById ? window.itemById[offHand.templateId || offHand.id] : null;
                    if (template && template.weaponType === 'shield') {
                        blockRate += 15 + (offHand.defense || 0) * 0.5;
                        canBlock = true;
                    }
                }
            }
        }
        if (!canBlock) blockRate = 0;
        blockRate = Math.max(0, Math.min(45, blockRate));

        var penetrate = aStats ? (aStats.penetrate || 0) : 0;

        if (canBlock && blockRate > 0 && Math.random() * 100 < blockRate) {
            let damage = this._calculateDamage(attacker, defender, penetrate);
            const blockReduction = dStats
                ? dStats.blockReduction
                : Math.min(0.7, 0.5 + defenderToughness * 0.005);
            damage = Math.floor(damage * (1 - blockReduction));
            const actual = defender.takeDamage(partId, Math.max(1, damage), damageType);
            const afterBlock = this._applyOnHitAftermath(attacker, defender, actual);
            let msg = `${defender.name} 格挡了攻击！受到 ${actual} 点伤害${afterBlock}`;
            if (!defender.isAlive) msg += ` ${defender.name} 被击败！`;
            // 格挡不触发反击
            return { msg, blocked: true, damage: actual, part: partId, damageType: damageType };
        }

        // ========== 5. 化解（上限 35%）==========
        let parryRate = dStats
            ? dStats.parry
            : (10 + defenderSpeed * 0.05 + (defenderEff.intelligence || 10) * 0.08);
        parryRate = Math.max(1, Math.min(35, parryRate));

        if (Math.random() * 100 < parryRate) {
            let damage = this._calculateDamage(attacker, defender, penetrate);
            damage = Math.floor(damage * 0.7);
            const actual = defender.takeDamage(partId, Math.max(1, damage), damageType);
            const afterParry = this._applyOnHitAftermath(attacker, defender, actual);
            let msg = `${defender.name} 化解了部分伤害！受到 ${actual} 点伤害${afterParry}`;
            var c2 = this._tryCounter(defender, attacker, partId);
            if (c2) msg += ' ' + c2.msg;
            if (!defender.isAlive) msg += ` ${defender.name} 被击败！`;
            return { msg, parried: true, damage: actual, part: partId, damageType: damageType, counter: !!c2 };
        }

        // ========== 5.5 招式加成（v10.0）==========
        if (actionBonus && actionBonus.type === 'move') {
            // 命中率加成
            if (actionBonus.hitBonus) {
                hitRate = Math.min(95, hitRate + actionBonus.hitBonus);
            }
            // 破甲加成
            if (actionBonus.armorPenetration) {
                penetrate = Math.min(80, (penetrate || 0) + actionBonus.armorPenetration);
            }
        }

        // ========== 6. 正常伤害 + 暴击（基 5%，倍率动态）==========
        // v12.8：寒冷标记命中才消耗（被闪避/格挡/化解均不消耗）
        if (attacker._chilledNext === true) attacker._chilledNext = false;
        let damage = this._calculateDamage(attacker, defender, penetrate);
        // v10.0：招式伤害倍率修正
        if (actionBonus && actionBonus.type === 'move' && actionBonus.damageMult) {
            damage = Math.floor(damage * actionBonus.damageMult);
        }
        // v12.8 野兽猛扑：敌方首次进攻伤害×1.3，命中才消耗（被闪避/格挡不消耗）
        // v13.0 仅持 pounce 技者生效（修复旧版全体敌方首击×1.3 的越权扩散）
        var pounced = false;
        if (this._isEnemySide(attacker) && attacker.hasAbility('pounce') && attacker._pounceUsed !== true) {
            attacker._pounceUsed = true;
            pounced = true;
            damage = Math.max(1, Math.floor(damage * 1.3));
        }
        // v12.9 剑气纵横连击：每次有效进攻计数，第3击伤害×1.25（_attackCount 仅持剑技者非null，v13.0 构造器按能力初始化）
        var swordCombo = false;
        if (attacker._attackCount != null) {
            attacker._attackCount++;
            if (attacker._attackCount % 3 === 0) {
                damage = Math.max(1, Math.floor(damage * 1.25));
                swordCombo = true;
            }
        }

        let critChance = aStats ? (aStats.crit / 100) : 0.05;
        // v13.0 剑气纵横锋锐：暴击率+12%（常量 SWORD_CRIT_BONUS，替代已删除的 _critBonus 字段）
        if (attacker.hasAbility('sword_burst')) critChance += SWORD_CRIT_BONUS / 100;
        try {
            if (attacker.type === 'player' && typeof window.getCombatBonuses === 'function' && !aStats) {
                const cb = window.getCombatBonuses({});
                if (cb && cb.crit) critChance += (cb.crit || 0) / 100;
            }
        } catch (e) {}
        // 韧性已在 aStats.crit 中扣除；无 aStats 时手动扣
        if (!aStats) critChance = Math.max(0.01, critChance - defenderToughness * 0.001);
        else critChance = Math.max(0.01, Math.min(0.30, critChance));

        var critMul = aStats ? (aStats.critDmg / 100) : 1.5;
        let isCrit = false;
        if (Math.random() < critChance) {
            damage = Math.floor(damage * critMul);
            isCrit = true;
        }

        const actual = defender.takeDamage(partId, Math.max(1, damage), damageType);
        const partLabel = BODY_PARTS.find(p => p.id === partId)?.label || partId;
        let msg = `${attacker.name} 攻击了 ${defender.name} 的 ${partLabel}，造成 ${actual} 点伤害！`;
        if (isCrit) msg += ' ⚡暴击！';
        if (pounced) msg += ' 🐾猛扑！';
        if (swordCombo) msg += ' ⚔️ 剑气纵横！';
        // v12.9 实际受伤后结算：血修吸血 / 体修反震 / 采补摄气
        msg += this._applyOnHitAftermath(attacker, defender, actual);
        if (penetrate > 0) msg += `（破甲${Math.round(penetrate)}%）`;
        if (defender.type === 'player' && defender.physiology && defender.physiology.wounds && defender.physiology.wounds.length > 0) {
            const lastWound = defender.physiology.wounds[defender.physiology.wounds.length - 1];
            if (lastWound && lastWound._armorReduced) {
                const slotNames = { head: '头部', body: '身体', hands: '手部', legs: '腿部', feet: '脚部' };
                const slotName = slotNames[lastWound._armorSlot] || lastWound._armorSlot;
                msg += ` 🛡️${slotName}护甲吸收了部分伤害！`;
            }
        }
        if (!defender.isAlive) {
            msg += ` ${defender.name} 被击败！`;
        }
        try {
            if (typeof window.showDamageNumber === 'function') {
                window.showDamageNumber(null, actual, isCrit ? 'crit' : 'normal');
            }
            if (typeof window.showEffect === 'function') {
                window.showEffect(isCrit ? 'battle_crit' : 'battle_hit');
            }
        } catch (e) {}
        return { msg, part: partId, damage: actual, crit: isCrit, damageType: damageType };
    }

    _checkEnd() {
        // 修复6：检查所有队员是否全部阵亡——但队员阵亡不影响战斗继续，仅玩家阵亡才算输
        if (!this.player.isAlive) {
            this.isFinished = true;
            this.winner = 'enemy';
            // v12.9 修复休眠缺陷：_consumeFormationBuff 定义在 Entity 上，此前误以 Battle 身份调用
            if (this.player && typeof this.player._consumeFormationBuff === 'function') this.player._consumeFormationBuff();
            if (typeof window.onBeastBattleEnd === 'function') {
                try { window.onBeastBattleEnd(false); } catch (e) {}
            }
            if (this.onEnd) this.onEnd('enemy');
            return true;
        }
        // 修复6：同步队员状态回PartyMember
        for (var pmi = 0; pmi < this.partyMembers.length; pmi++) {
            var pm = this.partyMembers[pmi];
            if (pm._partyMemberRef && !pm.isAlive) {
                pm._partyMemberRef.health = 0;
            } else if (pm._partyMemberRef && pm.isAlive) {
                pm._partyMemberRef.health = pm.health != null ? pm.health : pm._partyMemberRef.health;
            }
        }
        // ===== v12.9 遁修遁逃：敌方成功遁走 → 战斗按玩家方结束但无战利品（noSpoils）=====
        // 不发 enemy:defeated 击杀事件、不标记尸体；胜利文案与奖励由 app.js 按 noSpoils 降级
        if (this.enemy && this.enemy._fled === true && !this.isFinished) {
            this.isFinished = true;
            this.winner = 'player';
            this.noSpoils = true;
            if (this.player && typeof this.player._consumeFormationBuff === 'function') this.player._consumeFormationBuff();
            if (this.onEnd) this.onEnd('player');
            return true;
        }
        if (!this.enemy.isAlive) {
            this.isFinished = true;
            this.winner = 'player';
            if (this.player && typeof this.player._consumeFormationBuff === 'function') this.player._consumeFormationBuff();
            // P1：敌人被击败，发射标准事件供任务系统订阅
            if (typeof window.EventBus !== 'undefined') {
                window.EventBus.emit('enemy:defeated', {
                    enemyId: this.enemy.name,
                    enemyType: this.enemy.type || 'enemy',
                    species: this.enemy.species || this.enemy.name,
                    tags: this.enemy.tags || [],
                    locationId: this.enemy.locationId || 'current'
                });
            }
            
            // P2：战后处理队伍成员的关系记忆
            if (window.partySystem && typeof window.partySystem.processPostBattleRelationships === 'function') {
                window.partySystem.processPostBattleRelationships(this);
            }
            
            if (typeof window.onBeastBattleEnd === 'function') {
                try { window.onBeastBattleEnd(true); } catch (e) {}
            }
            if (this.onEnd) this.onEnd('player');
            return true;
        }
        return false;
    }

    getState() {
        return {
            player: {
                name: this.player.name,
                durabilities: this.player.durabilities,
                maxDurabilities: this.player.maxDurabilities,
                isAlive: this.player.isAlive,
                physiology: this.player.getPhysiologySummary ? this.player.getPhysiologySummary() : null,
            },
            enemy: {
                name: this.enemy.name,
                durabilities: this.enemy.durabilities,
                maxDurabilities: this.enemy.maxDurabilities,
                isAlive: this.enemy.isAlive,
                physiology: this.enemy.getPhysiologySummary ? this.enemy.getPhysiologySummary() : null,
            },
            // 修复6：队员状态
            partyMembers: this.partyMembers.map(function(m) {
                return {
                    name: m.name,
                    isAlive: m.isAlive,
                    health: m.health,
                    durabilities: m.durabilities
                };
            }),
            isFinished: this.isFinished,
            winner: this.winner,
            isPlayerTurn: this.isPlayerTurn,
            log: this.log.slice(-10),
        };
    }
}

// 导出
window.BODY_PARTS = BODY_PARTS;
window.PART_IDS = PART_IDS;
window.Entity = Entity;
window.initBodyDurability = initBodyDurability;
window.generateRandomEnemy = generateRandomEnemy;
window.Battle = Battle;
// v13.0 敌人战斗技能注册表（只读引用，机制判定唯一来源）
window.COMBAT_ABILITIES = COMBAT_ABILITIES;
// 生理系统导出
window.initPhysiology = initPhysiology;
window.initBodyParts = initBodyParts;
window.createWound = createWound;
window.processPhysiology = processPhysiology;
window.calculateBreathing = calculateBreathing;
window.updateConsciousness = updateConsciousness;
window.bandageWound = bandageWound;
window.hourlyRecovery = hourlyRecovery;
window.hemostaticTreatment = hemostaticTreatment;
window.pressureBleeding = pressureBleeding;
window.willpowerSuppress = willpowerSuppress;
window.enterCriticalState = enterCriticalState;
window.clearCriticalState = clearCriticalState;
window.getCriticalStatus = getCriticalStatus;
window.getPainCombatPenalties = getPainCombatPenalties;
// 武器技能映射（批次B）
window.WEAPON_SKILL_MAP = WEAPON_SKILL_MAP;
window.getWeaponSkillName = getWeaponSkillName;
window.getPlayerWeaponSkill = getPlayerWeaponSkill;
// 护甲系统导出
window.SLOT_TO_PART_MAP = SLOT_TO_PART_MAP;
window.PART_TO_SLOT_MAP = PART_TO_SLOT_MAP;
window.getArmorSlotForPart = getArmorSlotForPart;
window.getArmorData = getArmorData;
window.applyArmorToWound = applyArmorToWound;
window.getArmorStatus = getArmorStatus;
// BODY_PARTS 到此才真正就绪；补跑一次生理配置的部位覆盖验证。
if (typeof window.validatePhysiologyConfig === 'function') window.validatePhysiologyConfig();