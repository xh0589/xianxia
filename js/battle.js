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
    // v20.90 琴归奇门：以音攻敌、摄魂动魄，不入刀剑正路
    'qin': '奇门',
};

function getWeaponSkillName(weaponId) {
    if (!weaponId) return null;
    const template = window.itemById ? window.itemById[weaponId] : null;
    if (!template) return null;
    // v20.90：扩展武器库里刀剑琴杖全用 subtype 记器型（type 一律是 equipment），
    // 此前只认 weaponType||type，导致这批家伙的兵器武艺全被当成拳掌——补上 subtype 这一路
    const weaponType = template.weaponType || template.subtype || template.type || 'sword';
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
            claw: 'slash', whip: 'blunt', chain: 'blunt', hidden: 'pierce', fan: 'blunt',
            qin: 'blunt'   // v20.90 琴：木胎丝弦，砸是钝击，伤在音里
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
        // v20.89：携带物/亚型/词缀随实体进场——此前战败搜刮读 battle.enemy.carriedInventory 永远是空
        this.carriedInventory = data.carriedInventory || null;
        this.subtype = data.subtype || null;
        this._affix = data._affix || null;
        this._enemyType = data.type || null;   // 第九十七波：原始档位（enemy/elite/boss/beast）留档——重手档位按它读，元素伤的兜底判定也终于活了

        // ===== 机体扩展 v3.0：生理系统 =====
        // 生理类型（从data读取或默认humanoid）
        const physType = data.physiologyType || (type === 'beast' ? 'beast' : 'humanoid');
        this.physiologyType = physType;   // v20.89：尸体结算等处按此判妖兽/人形，此前只有 physiology 对象没有类型标
        this.physiology = data.physiology || initPhysiology(physType);
        // 武器damageType（默认钝器）
        this.damageType = data.damageType || 'blunt';
        // ===== v13.0 敌人战斗技能系统：机制不再焊死在敌人身份上，判断一律查 combatAbilities =====
        this.combatAbilities = Array.isArray(data.combatAbilities) ? data.combatAbilities.slice() : [];
        // ===== v12.8 一次性战斗标记（仅运行时状态透传，参照 _pounceUsed 先例；机制开关见上）=====
        this._hardenedCharges = data._hardenedCharges || 0; // 硬化充能（生成器仅对持 hardened 技的实体赋值）
        this._armorDR = Math.min(0.25, Math.max(0, Number(data.armorDR) || 0)); // v21.9 重甲减伤（敌人侧伤害结算）
        this._pounceUsed = data._pounceUsed === true;       // 猛扑是否已用（仅持 pounce 技者有意义）
        this._elementType = data._elementType || null;      // 冰/火元素展示标（效果判定改查 chill/burn 技）
        this._evilFaction = data._evilFaction === true;     // v20.48：邪道标（山贼/邪修/魔修等），功法「魔伤」按此出力
        this._personality = data._personality || data.personality16 || null;   // 第九十四波：具名对手的五维性格档随实体进场（见招拆招按性格反应）
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
        // 第九十七波·对面也是活人：武人有真气——敌人的招牌重手烧的是自己的真气账（不是无限预算），
        // 平砍回气与玩家普攻回气同式（越亏回得越快）；妖兽没有真气账——它们的招牌重手烧精力（stamina，
        // 第九十八波），精力本就是活账：玩家采补功吸得走它，吸干了妖王就只能干挠爪子
        this.maxQi = data.maxQi != null ? Number(data.maxQi) : (this.species === 'human' ? 40 + this.level * 6 : 0);
        this.qi = data.qi != null ? Number(data.qi) : this.maxQi;
        // 速度→回避属性加成（构造时用基础灵巧估算，运行时以 getSpeed 为准）
        const baseSpeed = Math.floor(((data.attrs && data.attrs.dexterity) || 10) * 0.7);
        this.dodgeBonus = 10 + baseSpeed * 0.15;
        this.blockBonus = 10 + baseSpeed * 0.08;
        this.parryBonus = 10 + baseSpeed * 0.08;
    }

    // ===== v13.0 能力查询：战斗机制统一判定入口（ES5 Array.indexOf）=====
    hasAbility(id) {
        // v21.9 沉默符：沉默期间敌人绝技全部封印（Entity 判定唯一入口，一处挂钩全线生效）
        if (this.type !== 'player' && window.TalismanSystem && typeof window.TalismanSystem.isEnemySilenced === 'function') {
            try { if (window.TalismanSystem.isEnemySilenced()) return false; } catch (e) {}
        }
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
        // 批三 · 医馆旧伤：身上的陈年旧伤拖累出手（每处折损攻击6%，封顶18%）——治好即消
        if (this.type === 'player' && typeof window.getOldWoundPenalty === 'function') {
            try {
                const wp = window.getOldWoundPenalty();
                if (wp > 0) attack = Math.floor(attack * (1 - wp));
            } catch (eWound) {}
        }
        // 0.2.1 境界质变：化神 attack×1.2 / 合体×1.3 / 渡劫×1.5（buildPlayerBattleEntity 设 _realmCombatMul）
        if (this.type === 'player' && this._realmCombatMul && this._realmCombatMul.attack && this._realmCombatMul.attack !== 1) {
            attack = Math.floor(attack * this._realmCombatMul.attack);
        }
        // v23.0 随身战阵：布下的阵不是摆设——攻随阵涨（buildPlayerBattleEntity 设 _formationMul）
        if (this.type === 'player' && this._formationMul && this._formationMul.attack && this._formationMul.attack !== 1) {
            attack = Math.floor(attack * this._formationMul.attack);
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
        // v20.7 剑冢剑意：每点剑意 +0.6% 攻击（与阵法增益同款的全局函数读取，缺载返回 1）
        if (this.type === 'player' && typeof window.getSwordIntentAttackMul === 'function') {
            try {
                const sm = window.getSwordIntentAttackMul();
                if (sm && sm !== 1) attack = Math.floor(attack * sm);
            } catch (e) {}
        }
        // 第一百零七波：队员的阵型与兵刃——队伍页面立的账，战斗里真结算
        if (this._memberMods) {
            if (this._memberMods.atkFlat) attack += this._memberMods.atkFlat;
            if (this._memberMods.atkMul && this._memberMods.atkMul !== 1) attack = Math.floor(attack * this._memberMods.atkMul);
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
        // v23.0 随身战阵：防随阵固
        if (this.type === 'player' && this._formationMul && this._formationMul.defense && this._formationMul.defense !== 1) {
            defense = Math.floor(defense * this._formationMul.defense);
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
        // P0-5：「境界不稳」虚弱（重塑肉身后3天，战斗属性×0.9）
        // v21.9 修复：此块此前被误放进 _consumeFormationBuff（defense 不在作用域，
        // ReferenceError 被 try/catch 吞掉），防御九折从不生效——现归位 getDefense。
        if (this.type === 'player' && typeof window.getRealmUnstableMultiplier === 'function') {
            try {
                const um = window.getRealmUnstableMultiplier();
                if (um !== 1) defense = Math.floor(defense * um);
            } catch (e) {}
        }
        // 第一百零七波：队员的阵型与甲胄——防随阵固，甲是真甲
        if (this._memberMods) {
            if (this._memberMods.defFlat) defense += this._memberMods.defFlat;
            if (this._memberMods.defMul && this._memberMods.defMul !== 1) defense = Math.floor(defense * this._memberMods.defMul);
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
        // v23.0 随身战阵：身法随阵疾
        if (this.type === 'player' && this._formationMul && this._formationMul.speed && this._formationMul.speed !== 1) {
            speed = Math.floor(speed * this._formationMul.speed);
        }
        // 第一百零七波：速度阵的账真兑现——队员身法随阵疾/随阵滞
        if (this._memberMods && this._memberMods.spdMul && this._memberMods.spdMul !== 1) {
            speed = Math.floor(speed * this._memberMods.spdMul);
        }
        return speed;
    }

    // ===== 机体扩展 v4.0：受伤系统（血量重命名 + 危急状态） =====
    // 受到伤害（指定部位+伤害类型）
    takeDamage(partId, damage, damageType) {
        // v21.9 敌人护甲：重甲/构装减伤——此前玩家挨刀有覆盖率抗性结算，敌人永远全额成伤
        if (this.type !== 'player' && this._armorDR > 0) {
            damage = Math.max(1, Math.floor(damage * (1 - this._armorDR)));
        }
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
    // v20.94 熟能生巧：包扎稳不稳看医术，包一次长一次
    if (entity.type === 'player' && typeof window.growLifeSkill === 'function') window.growLifeSkill('医术', 2, { reason: '阵前包扎' });
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

// ==================== v20.64 队员出手：伤害类型跟着他自己的本事走 ====================
// 此前队员永远普攻 slash——练剑的练刀的使拳的都是同一个砍法。这里从他的战斗技能/兵刃推。
const _MEMBER_SKILL_DTYPE = {
    '剑法': 'slash', '刀法': 'slash',
    '长兵': 'blunt', '拳掌': 'blunt',
    '射术': 'pierce', '奇门': 'pierce'
};
function _memberDamageType(member) {
    if (!member) return 'slash';
    // 兵刃优先（队员身上真挂着兵器就按兵刃来）
    try {
        var eq = member._partyMemberRef && member._partyMemberRef.equipment;
        var w = eq && (eq.mainHand || eq.weapon);
        var wid = w && (w.templateId || w.id || w);
        var tpl = wid && (window.itemById || {})[wid];
        var dt = (w && w.damageType) || (tpl && tpl.damageType);
        if (dt === 'sharp') dt = 'slash';
        if (dt === 'slash' || dt === 'blunt' || dt === 'pierce') return dt;
    } catch (e) {}
    // 没兵器就看练的是什么
    var best = null, bestVal = -1;
    var sk = (member.skills || {});
    for (var name in _MEMBER_SKILL_DTYPE) {
        if (Object.prototype.hasOwnProperty.call(sk, name) && sk[name] > bestVal) {
            bestVal = sk[name]; best = _MEMBER_SKILL_DTYPE[name];
        }
    }
    return best || 'blunt';   // 什么都没练：赤手空拳，是砸不是砍
}


// ==================== v17.0 战斗挑战梯度：词缀层 + 具名强敌 ====================
// 设计（用户明令）：平衡靠新增更强的敌人，禁止全局数值缩放。
// 词缀=修饰器思路（暗黑系共识）：只挂野外人形敌，属性倍率+额外绝技抽数+精英级掉落；
// 具名强敌=固定名号+招牌技+必掉对应绝技秘籍，respawnDays 防刷。
const ENEMY_AFFIXES = {
    ruthless: { name: '狂徒', minLevel: 4, attrMul: { strength: 1.35, dexterity: 1.2 }, extraDraws: 1 },
    guardian: { name: '护法', minLevel: 6, attrMul: { constitution: 1.4, willpower: 1.25 }, extraDraws: 1 },
    tangzhu:  { name: '堂主', minLevel: 8, attrMul: { allAttr: 1.25 }, extraDraws: 2 },
    // ===== v21.8 高境界名号：此前词缀在 8 级封顶，金丹往后五十多级只有狂徒/护法/堂主三张脸 =====
    zongshi:  { name: '宗师', minLevel: 15, attrMul: { allAttr: 1.3 }, extraDraws: 2 },
    shenzuo:  { name: '神座', minLevel: 28, attrMul: { allAttr: 1.4 }, extraDraws: 3 },
    tianjiang:{ name: '天将', minLevel: 42, attrMul: { allAttr: 1.5 }, extraDraws: 3 },
    zhenshi:  { name: '镇世', minLevel: 56, attrMul: { allAttr: 1.6 }, extraDraws: 4 }
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
                // ===== v21.8 高境界面孔：亚型池此前在 5 级封顶，金丹往后还是山贼剑修那批老面孔。
                // 越往上走，敌人越贴近天道真相——执香吏来收香火，收稼人来收割，古神残躯比天道还老 =====
                { key: 'yaksha',   prefixes: ['夜叉', '罗刹'],           behavior: 'aggressive',  damage: 'blunt',  weight: 0.55, minLevel: 12, evil: true, conMul: 1.1 },
                { key: 'demon_general', prefixes: ['魔将', '妖帅'],      behavior: 'balanced',    damage: 'slash',  weight: 0.5,  minLevel: 18, evil: true, allAttrMul: 1.08, sig: 'sword_burst' },
                { key: 'incense_official', prefixes: ['执香吏', '采风使'], behavior: 'defensive', damage: 'pierce', weight: 0.45, minLevel: 25, sig: 'drain_qi' },
                { key: 'reaper',   prefixes: ['收稼人', '执镰使者'],     behavior: 'aggressive',  damage: 'slash',  weight: 0.4,  minLevel: 35, evil: true, allAttrMul: 1.1, sig: 'lifesteal' },
                { key: 'ancient_god', prefixes: ['古神残躯', '荒古遗族'], behavior: 'defensive', damage: 'blunt',  weight: 0.35, minLevel: 45, conMul: 1.2, sig: 'reflect' },
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

    // ===== v21.9 敌人护甲机制：伤害结算此前不对称——玩家挨打有覆盖率/抗性/耐久，
    // 重甲名号的敌人挨打却永远全额成伤。守御系/重甲名号/构装体现在带真实减伤（上限20%）。=====
    var armorDR = 0;
    var _armorAffixDR = { guardian: 0.04, tangzhu: 0.04, zongshi: 0.05, shenzuo: 0.06, tianjiang: 0.07, zhenshi: 0.08 };
    if (behaviorOverride === 'defensive') armorDR += 0.06;
    if (affixKey && _armorAffixDR[affixKey]) armorDR += _armorAffixDR[affixKey];
    if (physiologyType === 'construct') armorDR += 0.05;
    armorDR = Math.min(0.2, Math.round(armorDR * 100) / 100);

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
                combatAbilities: combatAbilities, // v13.1 绝技透传：持有可学绝技的敌人按概率携带对应秘籍
                _leyElite: (spawnOpts && spawnOpts.leyTier) || 0 // v20.95 灵脉灵蕴透传：魔头才有毕业装
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
        armorDR: armorDR,                   // v21.9 重甲减伤（0=无甲；守御系/重甲名号/构装体累加，上限0.2）
    };
    // ===== 运行时状态打标（v13.0：仅运行时计数/标记透传；原八个机制布尔打标已删除，开关由 combatAbilities 承载）=====
    if (hardenedCharges > 0) enemyData._hardenedCharges = hardenedCharges; // 仅 construct(天生硬化)/boss 赋充能
    if (physiologyType === 'beast') enemyData._pounceUsed = false;         // 仅野兽（天生持 pounce）打「未扑」标
    if (elementType && (combatAbilities.indexOf('chill') >= 0 || combatAbilities.indexOf('burn') >= 0)) {
        enemyData._elementType = elementType; // 元素属性标仅随 chill/burn 技存在
    }
    if (pickedSubRow && pickedSubRow.renegade) enemyData._renegadeTauntPending = true;
    if (evilFaction) enemyData._evilFaction = true; // v20.48：邪道标透传（功法「魔伤」按此出力）
    return enemyData;
}

// ---------- 战斗类 ----------
class Battle {
    constructor(playerEntity, enemyEntity, enemyAllies) {
        this.player = playerEntity;
        this.enemy = enemyEntity;
        this.turn = 0;
        this.isPlayerTurn = true;
        this.isFinished = false;
        this.winner = null;
        this.log = [];
        this.onUpdate = null;
        this.onEnd = null;
        // v20.64 队伍指令（assault 强攻 / cover 掩护 / guard 自保），UI 可切
        this.partyOrder = 'assault';
        // v20.64 生理结算按回合记账：一轮（玩家→敌→同伴→队员→灵兽）全场每人只走 6 秒
        this._physTicked = false;
        // v20.64 被打倒的敌方（主敌倒下后枪口转向同伴，倒下的记在这里，战后一并标尸）
        this._fallenEnemies = [];
        // 出战灵兽作为盟友
        // 第九十波·骑乘参战：骑着开战，坐骑驮你入阵——它就在你身下，没有旁观的道理。
        // 场上兽位只有一个：坐骑优先（出战兽若是另一只，此战在场外盘旋，不进场）。
        this.allyBeast = null;
        this._mounted = false;        // 本场是否骑乘作战（落马后翻 false，机动加成随之撤销）
        this._mountDodge = 0;         // 骑乘机动给 riders 的闪避加成（落马时原样扣回）
        try {
            var bd = null;
            if (typeof window.getActiveMount === 'function' && window.getActiveMount() &&
                typeof window.getMountCombatData === 'function') {
                var _md = window.getMountCombatData();
                if (_md) { bd = _md; this._mounted = true; }
            }
            if (!bd && typeof window.getActiveBeastCombatData === 'function') {
                bd = window.getActiveBeastCombatData();
            }
            if (bd && typeof Entity === 'function') {
                this.allyBeast = new Entity(bd, 'beast');
                this.allyBeast._tamedIndex = bd._tamedIndex;   // 战后结账认这只（谁打的谁长阅历）
                this.log.push({ msg: this._mounted
                    ? '🐎 你骑着「' + this.allyBeast.name + '」开战——它驮着你入阵，蹄爪与你的刀一同招呼敌人！'
                    : '🐾 灵兽「' + this.allyBeast.name + '」加入战斗！' });
                // 第八十五波·逻辑收口：v17.1「羁绊反哺」（兽亲密度满百→主人先天体质+3）已移除——
                // 体魄是主人自己的底子，不会因为兽亲人就凭空改写；羁绊的账在出战兽六维缩放里
                //（getActiveBeastCombatData 心意相通×1.08 / 貌合神离×0.92），那才是合乎逻辑的去处。
            }
            // 骑乘机动：坐骑的脚力就是骑手的灵活——闪避 +（速度-1）×10，封顶 15
            //（风狼1.5→+5，雷鹰2.5→+15；落马即扣回。加成来自真实骑乘状态，不是全局缩放）
            if (this._mounted && this.allyBeast && bd && bd._mountSpeed > 1) {
                this._mountDodge = Math.min(15, Math.round((bd._mountSpeed - 1) * 10));
                this.player.dodgeBonus += this._mountDodge;
                this.log.push({ msg: '🐎 骑乘机动：闪避 +' + this._mountDodge + '（坐骑脚力带着你的身形，敌人不容易咬住你）' });
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
                    // 第一百零七波：阵型与装备不再是摆设——队伍页面上的账，战斗里真结算。
                    // 改算单从 partySystem.getMemberBattleMods 一个口子出（阵型乘区+兵刃防具加值+装备属性点）
                    var _pmods = null;
                    try {
                        if (window.partySystem && typeof window.partySystem.getMemberBattleMods === 'function') {
                            _pmods = window.partySystem.getMemberBattleMods(member);
                        }
                    } catch (eMods) {}
                    if (_pmods && _pmods.attrAdd) {
                        for (var _ak in _pmods.attrAdd) {
                            memberAttrs[_ak] = (memberAttrs[_ak] || 10) + _pmods.attrAdd[_ak];
                        }
                    }
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
                    memberEntity._memberMods = _pmods;     // 第一百零七波：攻/防/速三处乘区在 getAttack/getDefense/getSpeed 消费
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

        // ===== v20.64 敌方一组：兽群/同伙一起进场，不再是「几只一起围上来」的空话 =====
        // 主敌仍是玩家锁定与战利品的对象；同伴每轮也动手，倒下了由下一只补位。
        // 同伴不带战利品（exp/copper 全 0）——人多不该让赏钱翻倍。
        this.enemyAllies = [];
        try {
            var alliesIn = Array.isArray(enemyAllies) ? enemyAllies : [];
            var headLvl = (this.enemy && this.enemy.level) || 1;
            for (var ai = 0; ai < alliesIn.length && this.enemyAllies.length < 3; ai++) {
                var raw = alliesIn[ai];
                var ad = raw && raw.data ? raw.data : raw;
                if (!ad || ad.isCorpse || ad.isDead || ad.dead) continue;
                var allyAttrs = ad.attrs || { strength: 10, dexterity: 10, intelligence: 10, willpower: 10, constitution: 10, meridian: 10 };
                var _allyBeastly = (raw && raw.type === 'beast') || ad.type === 'beast' || ad.species === 'beast';
                var allyEntity = new Entity({
                    name: ad.name || '同伙',
                    level: Math.max(ad.level || 1, headLvl),   // 同伙跟头兽一个量级，不然围上来只是来送死
                    faction: ad.faction || '中立',
                    sect: ad.sect || '散修',
                    attrs: allyAttrs,
                    skills: ad.skills || {},
                    durabilities: ad.durabilities || initBodyDurability(allyAttrs),
                    loot: { exp: 0, copper: 0 },
                    aiBehavior: ad.aiBehavior || 'aggressive',
                    // 第九十七波·同伙不是二等公民：此前只挑九样字段，绝技/种系/生理/携带物全落在门外——
                    // 妖兽同伙按人形生理挨打、带绝技的同伙绝技被没收
                    species: ad.species || (_allyBeastly ? 'beast' : 'human'),
                    physiologyType: ad.physiologyType || (_allyBeastly ? 'beast' : 'humanoid'),
                    combatAbilities: ad.combatAbilities || [],
                    subtype: ad.subtype || null,
                    damageType: ad.damageType || null,
                    carriedInventory: ad.carriedInventory || null,
                }, _allyBeastly ? 'beast' : 'enemy');
                if (raw && raw.uid) allyEntity._mapEntity = raw;   // 战后按引用标尸，不靠名字猜
                this.enemyAllies.push(allyEntity);
            }
            if (this.enemyAllies.length > 0) {
                this.log.push({ msg: '⚔️ ' + this.enemyAllies.length + ' 个同伙跟着一起围了上来！' });
            }
        } catch (eAlly) {
            console.warn('[Battle] 敌方同伴入场失败:', eAlly);
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

        // ===== 第九十二波 · 行动条时间轴 =====
        // 每个角色一条行动条，按时间累计（速率=身法脚力），攒满 100 就能出手；
        // 不同动作扣不同的条：轻活便宜回条快，重活昂贵还得再等。
        // 开场谁的条先满谁先动——玩家不再白拿先手，快敌真的抢得到先手。
        // 第九十四波·对面也会使坏：邪修/响马/游斗辈怀里揣着迷烟散（就一包，用完拉倒），
        // 被逼到绝境（气血不足一半）的会装死诱敌——姿态摆出来，怎么接由你挑。
        this._foeTricks = { smoke: 0, feignUsed: false };
        try {
            var _tb = this.enemy ? this.enemy.aiBehavior : '';
            var _ts = this.enemy ? this.enemy.subtype : '';
            if (_tb === 'opportunist' || _tb === 'poisoner' || (this.enemy && this.enemy._evilFaction) || _ts === 'bandit' || _ts === 'renegade') {
                this._foeTricks.smoke = 1;
            }
        } catch (eTricks) {}
        this._pendingPrompt = null;      // 待玩家应对的姿态（时间轴停在这，等选择）
        this._foeLastAp = 0;             // 第九十七波：敌主这一动的条价（招牌重手更贵，其余 NPC 一律 100）
        this._playerBlind = 0;           // 玩家吃石灰：瞎几手（命中 -30）
        this._playerBlindHalf = 0;       // 袖子挡了大半：下一手失准（命中 -15）
        this._foeLulled = 0;             // 敌人信了你的装死：下一刀留力（对你伤害减半，一次性）
        this._foeInsight = 0;            // 敌人识破了你的装死：下一击格外狠（命中 +25，一次性）
        this._foeBackstabPending = 0;    // 敌人暴起偷袭你：下一击 ×1.5（一次性）
        this._nextPlayerHitMul = 0;      // 你的下一击倍率（暴起偷袭 1.5 / 怒火中烧 1.2，一次性）
        // ===== 第九十九波·江湖耳目：仗是打给江湖看的——话、手段、收场都落真账（全是可选动作，想做才做）=====
        this._deeds = { tricks: 0, demonic: 0, mercy: 0, execution: 0 };   // 行迹账：有人看见就传得出去
        this._witnessSettled = false;    // 一场只结一次
        this._foeRage = 0;               // 他被骂阵激怒：下一击更狠（×1.2）也露破绽（命中 -15，一次性）
        this._foeRageDmg = 0;            // 怒火过了命中关，等伤害兑现
        this._foeDisheartened = 0;       // 攻心话奏效：心气泄了（命中 -15、伤 ×0.85，随敌主动作递减两手）
        this._foeStumble = 0;            // 踩了铁蒺藜：下一手命中 -10（一次性）
        this._playerRage = 0;            // 你被骂得上头：两手命中 -10（随你的动作递减）
        this._rallyUsed = false;         // （第一百波起改为递减账——见 _rallyCount）
        this._rallyCount = 0;            // 第一百波·壮胆一场三嗓递减：头一嗓是气（+15），第二嗓半信半疑（+8），往后只剩一口气吊着（+4）
        this._humanShield = null;        // 掳来的人盾（下作——江湖看着呢）
        this._surrenderAsked = false;    // 敌人跪地求饶（一场一回）
        this._playerSurrenderTried = false;  // 弃械求饶一场一回（喊过一回他就防着你了）
        this._foeTauntPromptDone = false;    // 敌人的骂阵应对（一场一回，时间轴停住等你咽不咽这口气）
        this._demonicShown = false;      // 魔道功法露相（一场只报一次）
        this._foeRighteousWrath = false; // 正道人认出了你的魔道功法——百口难辨，这仗不留手
        // 魔道相貌查真账：天生魔技（采补/吸血）、魔染值、功法名目——三样占一样就是练过魔功的
        this._playerDemonicAbil = false;
        this._playerDemonicOwner = false;
        try {
            var _pAb99 = (this.player && Array.isArray(this.player.combatAbilities)) ? this.player.combatAbilities : [];
            this._playerDemonicAbil = _pAb99.indexOf('drain_qi') >= 0 || _pAb99.indexOf('lifesteal') >= 0;
            var _pcd99 = (typeof window.getCurrentCharData === 'function') ? window.getCurrentCharData() : window.currentCharData;
            if (_pcd99) {
                if ((_pcd99._demonicCorruption || 0) > 0) this._playerDemonicOwner = true;
                var _sk99 = _pcd99.currentSkills || _pcd99.skills || {};
                for (var _skn99 in _sk99) {
                    if (/魔功|血煞|噬魂|化血|血海|修罗|魔道/.test(String(_skn99))) { this._playerDemonicOwner = true; break; }
                }
            }
        } catch (eDem99) {}
        if (this._playerDemonicAbil) this._playerDemonicOwner = true;
        // ===== 第九十九波·当面开场：对面是什么人，开场就说什么话 =====
        try {
            var _e99 = this.enemy;
            var _isBeast99 = _e99 && (_e99.species === 'beast' || _e99.physiologyType === 'beast');
            var _st99 = _e99 ? String(_e99.subtype || '') : '';
            var _et99 = _e99 ? String(_e99._enemyType || '') : '';
            var _upright99 = ['monk', 'sword', 'bladesman', 'body'];
            var _open99 = null;
            if (_e99 && !_isBeast99 && !_e99._evilFaction && _upright99.indexOf(_st99) >= 0 && this._playerDemonicOwner) {
                // 正道人一见魔道功法，百口难辨——当场拔刀，这仗没有道理可讲
                this._foeRighteousWrath = true;
                _open99 = '⚡ ' + _e99.name + ' 一眼看出你身上缠绕的黑气——「魔头！今日替天行道！」他根本不给你开口的机会！';
                _e99.aiBehavior = 'aggressive';
            } else if (_isBeast99) {
                _open99 = '🐾 ' + _e99.name + ' 压低身子，喉咙里滚出闷雷似的吼声，肌肉绷得像拉满的弓——它盯上你了。';
            } else if (_st99 === 'bandit') {
                _open99 = '🗡️ ' + _e99.name + ' 横刀拦路：「留下东西，饶你不死——这是道上的规矩！」';
            } else if (_st99 === 'cultist' || _st99 === 'blood' || _st99 === 'essence') {
                _open99 = '🩸 ' + _e99.name + ' 舔了舔嘴唇：「又一个送上门的血食，正好。」';
            } else if (_st99 === 'monk') {
                _open99 = '🙏 ' + _e99.name + ' 单掌当胸：「施主，苦海无边，回头是岸。」';
            } else if (/boss/.test(_et99) || (_e99 && _e99._affix)) {
                _open99 = '✨ ' + _e99.name + ' 居高临下地打量你：「无名小辈，也敢拦我？」';
            } else if (_e99 && !_isBeast99) {
                _open99 = '⚔️ ' + _e99.name + ' 略一抱拳，兵刃已出了半鞘：「朋友，亮家伙吧。」';
            }
            if (_open99) this.log.push({ msg: _open99 });
        } catch (eOpen99) {}
        this._tlTick = 0;
        this._actors = [];
        try {
            this._initTimeline();
            this._advanceTimeline();
        } catch (eTL) {}
    }

    // ---------- 第九十二波 · 行动条引擎 ----------
    // 速率：实体速度（身法+轻功那本账，getSpeed 现成）；骑乘机动延伸到行动条（坐骑脚力带着你抢时间）
    _actorRate(e) {
        var sp = 10;
        try { if (e && typeof e.getSpeed === 'function') sp = e.getSpeed() || 10; } catch (err) {}
        sp = Math.max(4, Math.round(sp));
        return sp;
    }
    _initTimeline() {
        this._actors = [];
        var self = this;
        var push = function (e, side, kind) {
            if (!e) return;
            var rate = self._actorRate(e);
            if (kind === 'player' && self._mounted) {
                try {
                    var m = (typeof window.getActiveMount === 'function') ? window.getActiveMount() : null;
                    if (m && m.mount && m.mount.speed > 1) rate += Math.round((m.mount.speed - 1) * 5);
                } catch (eM) {}
            }
            self._actors.push({ e: e, side: side, kind: kind, bar: 0, rate: rate });
        };
        push(this.player, 'player', 'player');
        push(this.enemy, 'enemy', 'enemyMain');
        (this.enemyAllies || []).forEach(function (a) { push(a, 'enemy', 'enemyAlly'); });
        if (this.allyBeast) push(this.allyBeast, 'player', 'beast');
        (this.partyMembers || []).forEach(function (m) { push(m, 'player', 'member'); });
        // 第九十三波·先手之利：身法悬殊（快过对面最快者三成）的人抢在对面反应过来之前动手——
        // 开局条先攒一半。卑鄙小人练的就是这个：腿快，偷袭才叫偷袭。
        try {
            var _pA = self._findActor(self.player);
            var _foeFast = 0;
            self._actors.forEach(function (a) { if (a.side === 'enemy' && a.rate > _foeFast) _foeFast = a.rate; });
            if (_pA && _foeFast > 0 && _pA.rate >= _foeFast * 1.3) {
                _pA.bar += 50;
                self.log.push({ msg: '⚡ 你身法快过对面太多——趁他没反应过来，抢了个先手（开局行动条+50）！' });
            } else if (_pA && _pA.rate > 0 && _foeFast >= _pA.rate * 1.3) {
                var _eA = self._findActor(self.enemy);
                if (_eA) _eA.bar += 50;
                self.log.push({ msg: '⚡ 对面身法快得离谱——他抢在你反应过来之前动了手（敌方开局行动条+50）！' });
            }
        } catch (eFirst) {}
    }
    _findActor(e) {
        for (var i = 0; i < this._actors.length; i++) { if (this._actors[i].e === e) return this._actors[i]; }
        return null;
    }
    /** 动作扣条：不同操作扣不同（普攻100清空、轻招便宜、重招昂贵可扣成负数——收势久） */
    spendActionCost(e, cost) {
        var a = this._findActor(e);
        if (a) a.bar -= (cost == null ? 100 : cost);
    }
    getActionBars() {
        return this._actors.map(function (a) {
            return { name: a.e.name, side: a.side, kind: a.kind, bar: Math.max(-99, Math.min(150, a.bar)), rate: a.rate, alive: !!a.e.isAlive };
        });
    }
    /** 时间轴驱动：推进到下一个可动者——NPC 自动出手，轮到玩家就停下等指令 */
    _advanceTimeline() {
        if (this.isFinished) return;
        this.isPlayerTurn = false;
        var guard = 0;
        while (guard++ < 400 && !this.isFinished) {
            var alive = [];
            for (var i = 0; i < this._actors.length; i++) {
                var a = this._actors[i];
                if (a.e && a.e.isAlive) alive.push(a);
            }
            if (!alive.length) return;
            var ready = alive.filter(function (a) { return a.bar >= 100; });
            if (!ready.length) {
                // 快进到下一位满条：全体按各自速率涨
                var nextTicks = null;
                for (var j = 0; j < alive.length; j++) {
                    var t = Math.ceil((100 - alive[j].bar) / alive[j].rate);
                    if (t < 1) t = 1;
                    if (nextTicks === null || t < nextTicks) nextTicks = t;
                }
                for (var k = 0; k < alive.length; k++) alive[k].bar += nextTicks * alive[k].rate;
                this._tlTick += nextTicks;
                continue;
            }
            // 条最满的先动（同条比速率，再同玩家侧优先——先手是抢来的不是送的）
            ready.sort(function (x, y) {
                if (y.bar !== x.bar) return y.bar - x.bar;
                if (y.rate !== x.rate) return y.rate - x.rate;
                return (x.side === 'player' ? 0 : 1) - (y.side === 'player' ? 0 : 1);
            });
            var actor = ready[0];
            if (actor.kind === 'player') {
                this.isPlayerTurn = true;
                this._tickMoveCD();   // 轮到你出手，招式冷却流逝一格（旧账：每次玩家行动递减）
                if (this.onUpdate) this.onUpdate();
                return;
            }
            this._resolveActor(actor);
            if (this._pendingPrompt) {   // 第九十四波：时间轴停在姿态上——等你见招拆招再续走
                if (this.onUpdate) this.onUpdate();
                return;
            }
            if (this.onUpdate) this.onUpdate();
        }
    }
    _resolveActor(actor) {
        if (actor.kind === 'enemyMain') this._enemyMainAct();
        else if (actor.kind === 'enemyAlly') this._enemyAllyAct(actor.e);
        else if (actor.kind === 'beast') this._beastAct();
        else if (actor.kind === 'member') this._memberAct(actor.e);
        if (this._pendingPrompt) return;   // 第九十四波：敌人摆出了姿态——这一动的条等你选完才扣
        // 第九十七波：敌主的招牌重手按动计价（与玩家招式条价同式，重招收势久）——
        // 九十二波预留的「连击/重手从这扣」的口子在这里兑现；其余 NPC 仍是整条动作
        var _npcAp = 100;
        if (actor.kind === 'enemyMain' && this._foeLastAp > 0) { _npcAp = this._foeLastAp; this._foeLastAp = 0; }
        actor.bar -= _npcAp;
    }
    /** 敌主行动完毕＝一个「回合」边界：毒/冷却/生理这些按回合记的账都在这里翻篇 */
    _endEnemyMainAction() {
        this.turn++;
        this._physTicked = false;
        // 第九十九波：攻心话泄的气随他的动作散；人盾倒了/跑了就没了
        if (this._foeDisheartened > 0) this._foeDisheartened -= 1;
        if (this._humanShield && (!this._humanShield.isAlive || this._humanShield._fled)) {
            this.log.push({ msg: '🤚 你手里的人盾没了——' + this._humanShield.name + (this._humanShield._fled ? ' 趁乱挣脱跑了' : ' 倒在了血泊里') + '。' });
            this._humanShield = null;
        }
        // 第九十三波·迷烟随敌主行动完毕消散一回（挂末尾不挂开头，N 回合就瞎 N 次）
        try {
            if (window.TalismanSystem && typeof window.TalismanSystem.tickEnemyBlind === 'function') window.TalismanSystem.tickEnemyBlind();
        } catch (eBlindTick) {}
        this._processRoundPhysiology();
        this._checkEnd();
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
        this._demonicOnHit(result);   // 第九十九波：魔道天生技应手露相
        // 1.2 普攻回气：招式耗真气，普攻回气，逼玩家穿插普攻做资源博弈
        try {
            var _pcd = (typeof window.getCurrentCharData === 'function') ? window.getCurrentCharData() : window.currentCharData;
            if (_pcd) {
                var _qRec = 6 + Math.floor(Math.max(0, ((_pcd.maxQi || 100) - (_pcd.qi || 0))) / 20);
                _pcd.qi = Math.min(_pcd.maxQi || 100, (_pcd.qi || 0) + _qRec);
            }
        } catch (e) {}
        if (window.TalismanSystem && typeof window.TalismanSystem.onPlayerAttackComplete === 'function') window.TalismanSystem.onPlayerAttackComplete();
        // 第九十二波·行动条：普攻是 100 点的动作——一刀挥出，条清空，重新攒
        this.spendActionCost(this.player, 100);
        this._endPlayerAction();   // 第九十四波：石灰迷眼随你的手数消散
        if (this._checkEnd()) return true;
        this._advanceTimeline();
        return true;
    }

    // 第九十一波·行囊动作也是动作：掷暗器、撒毒、烧攻击符，全都吃本回合——
    // 与医疗动作同一本回合经济。此前这些经符箓管线直伤敌人，却既不挑时机也不耗回合，
    // 敌人刀还在半空你慢悠悠翻行囊，有多少掷多少（审出来的白嫖账）。
    canUseBattleItem() {
        return !this.isFinished && this.isPlayerTurn && this.enemy && this.enemy.isAlive;
    }
    playerItemTurn(label, cost) {
        if (this.isFinished || !this.isPlayerTurn) return false;
        if (label) this.log.push({ msg: label });
        // 第九十二波·行动条：家什按轻重扣条（暗器 60 快活 / 毒 80 / 控制符 100 / 乾坤 150）
        this.spendActionCost(this.player, cost == null ? 100 : cost);
        this._endPlayerAction();   // 第九十四波：石灰迷眼随你的手数消散
        if (this._checkEnd()) return true;
        this._advanceTimeline();
        return true;
    }

    // 第九十三波·卑鄙流仪两个引擎口（物品消耗与按钮在 app.js，账在这里）
    /** 淬毒入兵刃：接下来 n 次见血渗毒（毒账与撒毒粉同一本，温和些：2 回合×10） */
    setVenomBlade(n) {
        if (!this.player) return false;
        this.player._venomBlade = Math.max(this.player._venomBlade || 0, n || 3);
        this._noteDeed('tricks');   // 第九十九波：淬毒也是下作手段——有人看见就传得出去
        return true;
    }
    /** 装死诱敌：扣满条躺下——他信不信，看他的性子（第九十四波·见招拆招） */
    playerFeign() {
        if (this.isFinished || !this.isPlayerTurn) return false;
        if (this.player._feignPose) {
            this.log.push({ msg: '你已经躺在地上装死了——别演两遍。' });
            return false;
        }
        this.player._feignPose = true;
        this._noteDeed('tricks');   // 第九十九波：装死是下作手段——有人看见就传得出去
        this.log.push({ msg: '🖤 你兵刃脱手、踉跄两步栽倒在地，闭住呼吸装死——他信不信，看他的性子。' });
        this._endPlayerAction();
        this.spendActionCost(this.player, 100);
        if (this._checkEnd()) return true;
        this._advanceTimeline();
        return true;
    }

    // ===== 第九十四波·见招拆招：姿态不是固定效果，是社交动作——不同性子不同反应 =====
    // 具名对手带五维性格档（personality16），杂兵没有——就从打架的路数里读他的性子。
    /** 敌方的「打架性子」三面：性急 / 老练 / 眼毒 */
    _foePersona() {
        var e = this.enemy || {};
        var num = function (v) { v = Number(v); return isFinite(v) ? v : 0; };
        var reckless = 0.30, cautious = 0.30, sharp = 0.20;
        var p = e._personality || null;
        if (p && typeof p === 'object') {
            // 五维性格档：谋略高+自我高→鲁莽冒进；谋略低+自我低→老成持重；精力旺→眼疾手快
            reckless += (num(p.tactics) + num(p.identity)) / 400;
            cautious += (-num(p.tactics) - num(p.identity)) / 400;
            sharp += num(p.energy) / 300;
        } else {
            var beh = e.aiBehavior || '';
            if (beh === 'aggressive') reckless += 0.3;
            else if (beh === 'defensive') cautious += 0.3;
            else if (beh === 'opportunist') sharp += 0.3;
            else if (beh === 'poisoner') sharp += 0.15;
            var st = String(e.subtype || '');
            if (st === 'bandit' || st === 'renegade') reckless += 0.15;
            if (e._evilFaction === true) sharp += 0.1;
            if (num(e.level) >= 15) { cautious += 0.1; sharp += 0.1; }
        }
        reckless = Math.max(0.05, reckless);
        cautious = Math.max(0.05, cautious);
        sharp = Math.max(0.05, sharp);
        var sum = reckless + cautious + sharp;
        return { reckless: reckless / sum, cautious: cautious / sum, sharp: sharp / sum };
    }
    _personaWord() {
        var w = this._foePersona();
        if (w.sharp >= w.reckless && w.sharp >= w.cautious) return '眼毒的家伙';
        return w.reckless >= w.cautious ? '性急的家伙' : '老练的家伙';
    }
    _rollPersona() {
        var w = this._foePersona();
        var r = Math.random();
        if (r < w.reckless) return 'reckless';
        if (r < w.reckless + w.cautious) return 'cautious';
        return 'sharp';
    }
    /** 迷烟扬进他眼里：吃不吃看性子——性急兜头糊实、老练侧脸闭气、眼毒袖子扫开（返回瞎几回） */
    receiveSmoke() {
        this._noteDeed('tricks');   // 第九十九波：撒石灰是下作手段——撒没撒中都有人看见
        var turns = 2, word = this._personaWord();
        var face = this._rollPersona();
        if (face === 'sharp') {
            turns = 0;
            this.log.push({ msg: '💨 ' + this.enemy.name + ' 袖子横扫，把石灰尽数挡下——迷烟白撒了！（' + word + '）' });
        } else if (face === 'cautious') {
            turns = 1;
            this.log.push({ msg: '💨 ' + this.enemy.name + ' 及时侧脸闭气，石灰只吃进去小半——只瞎一回（' + word + '）' });
        } else {
            this.log.push({ msg: '💨 石灰兜头糊了 ' + this.enemy.name + ' 一脸，他两眼流泪——瞎两回！（' + word + '）' });
        }
        return turns;
    }
    /** 对面也会使坏（怀里揣着石灰、也会装死）——姿态摆出来，时间轴停住，等你见招拆招 */
    _tryEnemyTrick() {
        var t = this._foeTricks;
        if (!t) return false;
        var enemy = this.enemy;
        var phys = enemy.physiology;
        var blood = phys ? (phys.bloodVolume !== undefined ? phys.bloodVolume : phys.health) : 100;
        var bloodMax = phys && phys.maxBloodVolume ? phys.maxBloodVolume : 100;
        var bloodPct = bloodMax > 0 ? (blood / bloodMax) * 100 : 100;
        // 装死：狗急跳墙的最后一搏（气血不足一半、一场一回、三五成把握使出来）
        // 会遁走的家伙不演这出——人家有更好的逃命路数（不抢遁术的戏）
        var _canEscape = Array.isArray(enemy.combatAbilities) && enemy.combatAbilities.indexOf('escape') >= 0;
        if (!t.feignUsed && !_canEscape && enemy.isAlive && bloodPct < 50 && Math.random() < 0.35) {
            t.feignUsed = true;
            this.log.push({ msg: '💀 ' + enemy.name + ' 兵刃脱手，捂着胸口踉跄两步栽倒在地，一动不动——是真倒了，还是装的？' });
            this._pendingPrompt = {
                kind: 'feign',
                text: enemy.name + ' 栽倒在地，胸口微微起伏——是真倒了，还是装的？',
                options: [
                    { k: 'finish', label: '⚔️ 抢上前补上一刀（若是装的，他暴起有你好受）' },
                    { k: 'watch', label: '👁 退开半步看一会儿（「尸体」躺不久）' },
                    { k: 'probe', label: '🎯 弹一枚暗器试探（吃一枚暗器；装死的沉不住气）', needItem: 'special_hidden_weapon' },
                    { k: 'call', label: '📣 出声叫阵（装死的人最怕被点破）' }
                ]
            };
            return true;
        }
        // 石灰：怀里藏的一包（带家伙的才会使，三成把握掏出来）
        if (t.smoke > 0 && Math.random() < 0.3) {
            t.smoke -= 1;
            this.log.push({ msg: '💨 ' + enemy.name + ' 忽然探手入怀，摸出一把白雾兜头撒来——是石灰粉！' });
            this._pendingPrompt = {
                kind: 'smoke',
                text: '白雾已到眼前，来不及举兵刃格挡——这把石灰你打算怎么接？',
                options: [
                    { k: 'avert', label: '🏃 扭头纵跃避开（行动条 -60，多半躲得开）' },
                    { k: 'sleeve', label: '🧥 抬袖遮面（石灰挡了大半，下一手命中 -15）' },
                    { k: 'tank', label: '😤 闭眼硬吃冲进去（两手命中 -30，下一刀带着怒火 ×1.2）' },
                    { k: 'leap', label: '🐦 闭眼后跃（躲个干净，他扑空慢半拍）' }
                ]
            };
            return true;
        }
        return false;
    }
    /** 你挑好了怎么接：时间轴从这儿续走（敌人这一动的条到你选完才扣——思索不占账） */
    resolvePrompt(idx) {
        if (this.isFinished || !this._pendingPrompt) return false;
        var prompt = this._pendingPrompt;
        var opt = prompt.options[idx];
        if (!opt) return false;
        this._pendingPrompt = null;
        var enemy = this.enemy;
        var enemyActor = this._findActor(enemy);
        if (prompt.kind === 'smoke') {
            if (opt.k === 'avert') {
                this.log.push({ msg: '🏃 你扭头纵身跃开，石灰贴着耳边飞过——只迷进眼里几粒。（你这一跃耗去行动条 60 点）' });
                if (enemyActor) enemyActor.bar = Math.max(0, enemyActor.bar - 60);
            } else if (opt.k === 'sleeve') {
                this.log.push({ msg: '🧥 你抬袖遮面，石灰尽数打在袖子上——只是眼里被烟熏得发花，下一手要失准些。（命中 -15 一手）' });
                this._playerBlindHalf = 1;
            } else if (opt.k === 'tank') {
                this.log.push({ msg: '😤 你咬牙顶着白雾冲进去——两眼刺痛流泪，全凭瞎摸抡刀！（两手命中 -30；下一刀带着石灰的仇 ×1.2）' });
                this._playerBlind = 2;
                this._nextPlayerHitMul = 1.2;
            } else if (opt.k === 'leap') {
                this.log.push({ msg: '🐦 你闭眼后跃，稳稳落地——他一把撒空，抢上来慢半拍。（他行动条 -50）' });
                if (enemyActor) enemyActor.bar = Math.max(0, enemyActor.bar - 50);
            }
        } else if (prompt.kind === 'feign') {
            if (opt.k === 'finish') {
                if (Math.random() < 0.5) {
                    this.log.push({ msg: '⚔️ 你抢上前举刀便剁——他猛地睁眼就地一滚，刀锋贴着他肋口削空！装的！' });
                    this._foeBackstabPending = 1;
                    try { var _fbR = this._executeAttack(enemy, this.player, 'chest', 'slash'); if (_fbR) this.log.push(_fbR); } catch (eFoe) {}
                } else {
                    this.log.push({ msg: '⚔️ 你抢上前一刀剁在他胸口——毫无反应，他是真倒了。' });
                }
            } else if (opt.k === 'watch') {
                this.log.push({ msg: '👁 你退开半步盯着——「尸体」熬不住，一骨碌爬了起来拍拍胸口。（他白耗半口气，行动条 -50）' });
                if (enemyActor) enemyActor.bar = Math.max(0, enemyActor.bar - 50);
            } else if (opt.k === 'probe') {
                if (Math.random() < 0.5) {
                    this.log.push({ msg: '🎯 你弹出一枚暗器，寒光直奔他肩头——他哎哟一声就地滚开，暗器钉进土里！（装死的沉不住气，白耗半拍，行动条 -30）' });
                    if (enemyActor) enemyActor.bar = Math.max(0, enemyActor.bar - 30);
                } else {
                    var prDmg = 0;
                    try { if (typeof enemy.takeDamage === 'function') prDmg = enemy.takeDamage('chest', 45, 'pierce') || 0; } catch (ePr) {}
                    this.log.push({ msg: '🎯 暗器破空，深深扎进他胸口（' + prDmg + ' 点伤）——毫无反应，他是真倒了。' });
                }
            } else if (opt.k === 'call') {
                if (Math.random() < 0.5) {
                    this.log.push({ msg: '📣 你朗声叫阵——「装死也要脸！」他骂骂咧咧一骨碌爬起来。装死的最怕被点破。（他行动条 -50）' });
                    if (enemyActor) enemyActor.bar = Math.max(0, enemyActor.bar - 50);
                } else {
                    this.log.push({ msg: '📣 你朗声叫阵——地上没人应。你盯了半晌他仍旧不动，真假难辨。（你分了神，他先缓过一口气，行动条 +30）' });
                    var playerActor = this._findActor(this.player);
                    if (playerActor) playerActor.bar = Math.min(100, playerActor.bar + 30);
                }
            }
        } else if (prompt.kind === 'surrender') {
            // 第九十九波·杀与放：都记进行迹账——有人看见就传得出去（_settleWitness）
            if (opt.k === 'kill') {
                this._noteDeed('execution');
                this.log.push({ msg: '⚔️ 你手起刀落——' + enemy.name + ' 的话没说完就栽倒在血泊里。杀降不祥，这一刀江湖看着呢。' });
                try { enemy.takeDamage('chest', 9999, 'slash'); } catch (eKill) { enemy.isAlive = false; }
            } else if (opt.k === 'spare') {
                this._noteDeed('mercy');
                enemy._fled = true;
                this.log.push({ msg: '🙏 你收了刀：「滚吧。」' + enemy.name + ' 磕了三个响头，连兵刃都没敢捡，夺路而逃——这份不杀之恩他记下了。' });
            }
        } else if (prompt.kind === 'taunt') {
            // 第九十九波·这口气咽不咽：稳住/上头/骂回去——骂回去吃不吃看他的性子
            if (opt.k === 'steel') {
                var _pl99 = this.player;
                if ((_pl99.maxStamina || 0) > 0) _pl99.stamina = Math.min(_pl99.maxStamina, (_pl99.stamina || 0) + 5);
                this.log.push({ msg: '😤 你深吸一口气，把这口恶气压了回去——狗咬不了石头。（精力 +5）' });
            } else if (opt.k === 'rage') {
                this._playerRage = 2;
                if (!this._nextPlayerHitMul) this._nextPlayerHitMul = 1.15;
                var _pa99 = this._findActor(this.player);
                if (_pa99) _pa99.bar = Math.min(150, _pa99.bar + 40);
                this.log.push({ msg: '🔥 你血往头上涌，提刀就抢！（行动条 +40、下一击 ×1.15，但两手气昏了头命中 -10）' });
            } else if (opt.k === 'curse') {
                var _cf99 = this._rollPersona();
                if (_cf99 === 'reckless') {
                    var _ca99 = this._findActor(enemy);
                    if (_ca99) _ca99.bar -= 30;   // 被噎得招式都乱了（条可以欠账，不夹 0）
                    this.log.push({ msg: '🗯️ 你骂得比他更毒三分——他被噎得脸红脖子粗，出招都乱了！（他行动条 -30）' });
                } else if (_cf99 === 'cautious') {
                    this.log.push({ msg: '🗯️ 你骂了回去，他只当耳旁风：「有骂人的力气，不如留着求饶。」（' + this._personaWord() + '）' });
                } else {
                    if ((this.player.maxStamina || 0) > 0) this.player.stamina = Math.max(0, (this.player.stamina || 0) - 8);
                    this.log.push({ msg: '🗯️ 他等你骂完，慢悠悠回了一句——句句戳在你心口窝上，噎得你气血翻涌。（精力 -8，' + this._personaWord() + '）' });
                }
            }
        }
        if (enemyActor) enemyActor.bar -= 100;   // 敌人这一动到你选完才扣（思索不占账）
        this._endEnemyMainAction();
        if (!this.isFinished) this._advanceTimeline();
        if (this.onUpdate) this.onUpdate();
        return true;
    }
    /** 玩家落了一手行动：石灰迷眼随你的手数消散 */
    _endPlayerAction() {
        if (this._playerBlind > 0) this._playerBlind -= 1;
        if (this._playerBlindHalf > 0) this._playerBlindHalf -= 1;
        if (this._playerRage > 0) this._playerRage -= 1;   // 第九十九波：上头的手数随你的动作消散
    }

    // ===== 第九十九波·江湖耳目：话也是招、手段有人看、收场结账 =====
    // 全是「想做才做」的可选动作——不塞任何必走的计数器；效果全部吃现有的真账
    // （性子三面/精力/真气/行动条/声望/钱袋），约束来自世界本身。
    /** 记一笔行迹：有人看见就传得出去（仗打完按目击者结账） */
    _noteDeed(kind) {
        if (this._deeds && kind) this._deeds[kind] = (this._deeds[kind] || 0) + 1;
    }
    /** 魔道天生技应了手——黑气缠上刀锋（一场只报一次，账记在行迹里） */
    _demonicOnHit(result) {
        if (result && !result.missed && this._playerDemonicAbil && !this._demonicShown) {
            this._demonicShown = true;
            this._noteDeed('demonic');
            this.log.push({ msg: '🩸 魔道的天生技应了手——黑气缠上刀锋。（正道中人见了这个，百口难辨）' });
        }
    }
    /** 阵前话：骂阵挑釁 / 攻心话 / 壮胆——喊一嗓子都是真动作（⚡60），吃不吃看他性子 */
    playerTaunt(kind) {
        if (this.isFinished || !this.isPlayerTurn) return false;
        if (!this.enemy || !this.enemy.isAlive) return false;
        var enemy = this.enemy;
        var isBeast = (enemy.species === 'beast' || enemy.physiologyType === 'beast');
        if (isBeast) {
            this.log.push({ msg: '📣 你冲着它喊话——野兽听不懂人话，只当你要抢它的食，龇牙瞪了过来。' });
            return false;
        }
        if (kind === 'provoke') {
            var face = this._rollPersona();
            var word = this._personaWord();
            if (face === 'reckless') {
                this._foeRage = 1;
                var ea = this._findActor(enemy);
                if (ea) ea.bar = Math.min(150, ea.bar + 30);
                this.log.push({ msg: '📣 你一通骂阵——' + enemy.name + ' 涨红了脸：「找死！」他青筋暴起抢了上来！（他下一击更狠 ×1.2 也露破绽命中 -15，' + word + '）' });
            } else if (face === 'cautious') {
                this.log.push({ msg: '📣 你骂阵的话头飞过去，' + enemy.name + ' 只是冷笑：「激将法？」他不接这个茬。（' + word + '）' });
            } else {
                this._foeInsight = 1;
                this.log.push({ msg: '📣 你张口骂阵，' + enemy.name + ' 反而上下打量你：「嗓门这么大，是心虚了吧？」你的底细被他看穿了。（' + word + '，他下一击命中 +25）' });
            }
            this.spendActionCost(this.player, 60);
            this._endPlayerAction();
            if (this._checkEnd()) return true;
            this._advanceTimeline();
            return true;
        }
        if (kind === 'heart') {
            if (this._foeRighteousWrath) {
                this.log.push({ msg: '📣 你张口想讲两句——他已认出你的魔道功法，话到嘴边成了冷笑：「魔头，省省吧！」（百口难辨，攻心无用）' });
                return false;
            }
            if (/boss/.test(String(enemy._enemyType || ''))) {
                this.log.push({ msg: '📣 你想以言语动他——' + enemy.name + ' 什么阵仗没见过，不为所动：「凭你这三寸舌，也想留命？」' });
                this.spendActionCost(this.player, 60);
                this._endPlayerAction();
                this._advanceTimeline();
                return true;
            }
            var wp = Number((enemy.attrs && enemy.attrs.willpower) || 10);
            var p = 0.3 + (wp < 12 ? 0.15 : 0) - wp * 0.006;
            var st = String(enemy.subtype || '');
            if (['bandit', 'renegade', 'rogue', 'escapee'].indexOf(st) >= 0 || enemy._evilFaction) p += 0.25;   // 拿钱卖命的、拦道求财的，心最容易动
            if (['monk', 'sword', 'body'].indexOf(st) >= 0) p -= 0.15;   // 心里有持守的，动摇不了
            p = Math.max(0.08, Math.min(0.7, p));
            if (Math.random() < p) {
                this._foeDisheartened = 2;
                this.log.push({ msg: '📣 「为了几两银子把命搭上，值吗？你家里人还等你回去！」——这话戳中了 ' + enemy.name + '，他的刀慢了三成。（士气受挫：命中 -15、力道 -15%，撑两手）' });
            } else {
                this.log.push({ msg: '📣 你想攻他的心，' + enemy.name + ' 啐了一口：「少来这套！」（他的心稳得很）' });
            }
            this.spendActionCost(this.player, 60);
            this._endPlayerAction();
            if (this._checkEnd()) return true;
            this._advanceTimeline();
            return true;
        }
        if (kind === 'rally') {
            // 第一百波·壮胆改递减：不再一场一嗓一刀切——气是一嗓比一嗓弱，但永远续得上
            this._rallyCount = (this._rallyCount || 0) + 1;
            this._rallyUsed = true;
            var _gain100 = this._rallyCount === 1 ? 15 : (this._rallyCount === 2 ? 8 : 4);
            var pp99 = this.player;
            if ((pp99.maxStamina || 0) > 0) pp99.stamina = Math.min(pp99.maxStamina, (pp99.stamina || 0) + _gain100);
            if (this._playerRage > 0) {
                this._playerRage = 0;
                this.log.push({ msg: '📣 你深吸一口气，大喝一声把胸口的邪火压了下去。（上头散了，精力 +' + _gain100 + '）' });
            } else if (this._rallyCount === 1) {
                this.log.push({ msg: '📣 「站起来！还能打！」——你冲自己吼了一嗓子，胸口一热（精力 +15）。' });
            } else if (this._rallyCount === 2) {
                this.log.push({ msg: '📣 你又吼了一嗓子——声音已经劈了，连你自己都半信半疑。（精力 +8）' });
            } else {
                this.log.push({ msg: '📣 嗓子哑得只剩气音，全靠一口气吊着。（精力 +4）' });
            }
            this.spendActionCost(this.player, 60);
            this._endPlayerAction();
            this._advanceTimeline();
            return true;
        }
        return false;
    }
    /** 卖绽：故意露出破绽——他咬不咬钩，看他的性子（性急的抢进露旧力，眼毒的反戳你真口子） */
    playerBait() {
        if (this.isFinished || !this.isPlayerTurn) return false;
        if (this.player._feignPose) {
            this.log.push({ msg: '你已经躺在地上装死了——别再卖绽了，两出戏穿帮。' });
            return false;
        }
        if (this.player._baitPose) {
            this.log.push({ msg: '绽已经卖出去了——再卖就是破绽百出了。' });
            return false;
        }
        this.player._baitPose = true;
        this.log.push({ msg: '🎣 你故意把架势放散，左肋露出一个大口子——他咬不咬钩，看他的性子。' });
        this.spendActionCost(this.player, 60);
        this._endPlayerAction();
        this._advanceTimeline();
        return true;
    }
    /** 撩拨：轻活儿（⚡40）——不求伤他，求累他：精力真气双耗（真账），耗干了招牌重手就出不来 */
    playerHarass() {
        if (this.isFinished || !this.isPlayerTurn) return false;
        if (!this.enemy.isAlive) return false;
        var damageType = 'blunt';
        try { if (typeof window.resolveWeaponDamageType === 'function') damageType = window.resolveWeaponDamageType() || 'blunt'; } catch (e) {}
        if (damageType === 'sharp') damageType = 'slash';
        // 第一百波·连环手：踩着蒺藜站都站不稳的人，躲什么轻活儿——必中，耗力翻倍
        var _stum100 = this._foeStumble > 0;
        var result = this._executeAttack(this.player, this.enemy, 'abdomen', damageType, { type: 'move', damageMult: 0.3, hitBonus: _stum100 ? 100 : 10 });
        if (result) result.msg = (_stum100 ? '🪶 撩拨（趁他脚下正乱）：' : '🪶 撩拨：') + result.msg;
        this.log.push(result);
        this._demonicOnHit(result);
        var e = this.enemy;
        var drained = [];
        var _sD100 = _stum100 ? 16 : 8, _qD100 = _stum100 ? 10 : 5;
        if ((e.maxStamina || 0) > 0 && e.stamina > 0) { var sD = Math.min(e.stamina, _sD100); e.stamina -= sD; drained.push('精力 -' + sD); }
        if ((e.maxQi || 0) > 0 && e.qi > 0) { var qD = Math.min(e.qi, _qD100); e.qi -= qD; drained.push('真气 -' + qD); }
        if (drained.length) this.log.push({ msg: '💨 他被你撩拨得团团转，白白出力喘着粗气（' + drained.join('、') + '）——气力越少，招牌重手越出不来。' });
        this.spendActionCost(this.player, 40);
        this._endPlayerAction();
        if (this._checkEnd()) return true;
        this._advanceTimeline();
        return true;
    }
    /** 掳人当盾：拽一个活的同伙挡在身前——他三成不敢下手，四成刀落自己人身上（下作，江湖看着） */
    playerGrabShield() {
        if (this.isFinished || !this.isPlayerTurn) return false;
        var shield = null;
        var allies = this.enemyAllies || [];
        for (var i = 0; i < allies.length; i++) if (allies[i] && allies[i].isAlive) { shield = allies[i]; break; }
        if (!shield) {
            this.log.push({ msg: '🤚 你伸手去掳人——他身边一个活的同伙都没有，掳无可掳。（掳盾要有对面同伙在场）' });
            return false;
        }
        this._humanShield = shield;
        this._noteDeed('tricks');
        this.log.push({ msg: '🤚 你一个闪身掳住 ' + shield.name + '，兵刃横在他颈间——「别过来！」' + this.enemy.name + ' 的刀势一滞。（他三成不敢下手，四成刀落自己人身上）' });
        this.spendActionCost(this.player, 80);
        this._endPlayerAction();
        this._advanceTimeline();
        return true;
    }
    /** 弃械求饶：把兵刃扔了跪下去——响马求财不求命，野兽听不懂人话，正道不收魔头的降 */
    playerSurrender() {
        if (this.isFinished || !this.isPlayerTurn) return false;
        var enemy = this.enemy;
        if (enemy.species === 'beast' || enemy.physiologyType === 'beast') {
            this.log.push({ msg: '🏳️ 你刚要弃械——野兽听不懂人话，獠牙已经逼到了眼前。' });
            return false;
        }
        if (this._playerSurrenderTried) {
            this.log.push({ msg: '🏳️ 你已经弃过一回械了——他防着你的花样，第二回喊破了喉咙也没用。' });
            return false;
        }
        this._playerSurrenderTried = true;
        var p = 0.5;
        var st = String(enemy.subtype || '');
        if (['bandit', 'renegade', 'rogue', 'escapee'].indexOf(st) >= 0 || enemy._evilFaction) p += 0.2;   // 求财不求命
        if (st === 'monk') p += 0.15;   // 出家人不杀降
        var ppS = this.player.physiology;
        var pbS = ppS ? (ppS.bloodVolume !== undefined ? ppS.bloodVolume : 100) : 100;
        if (pbS < 25) p += 0.1;         // 濒死求饶，更像真的
        if (/boss/.test(String(enemy._enemyType || ''))) p -= 0.25;
        if (this._foeRighteousWrath || (this._playerDemonicOwner && !enemy._evilFaction && ['monk', 'sword', 'bladesman', 'body'].indexOf(st) >= 0)) p -= 0.3;   // 正道不收魔头的降
        p = Math.max(0.05, Math.min(0.9, p));
        this.spendActionCost(this.player, 100);
        if (Math.random() < p) {
            // 破财免灾：铜钱三成、灵石两成——从钱袋真账里扣
            var lostCopper = 0, lostStone = 0;
            try {
                var _w99 = (window.inventory && window.inventory.currency) ? window.inventory.currency : null;
                var _cd99 = (typeof window.getCurrentCharData === 'function') ? window.getCurrentCharData() : window.currentCharData;
                var _src99 = _w99 || _cd99;
                if (_src99) {
                    lostCopper = Math.floor((_src99.copper || 0) * 0.3);
                    lostStone = Math.floor((_src99.spiritStones || 0) * 0.2);
                    _src99.copper = Math.max(0, (_src99.copper || 0) - lostCopper);
                    _src99.spiritStones = Math.max(0, (_src99.spiritStones || 0) - lostStone);
                    if (typeof window.updateCurrencyUI === 'function') window.updateCurrencyUI();
                }
            } catch (eW99) {}
            this.surrendered = true;
            this.isFinished = true;
            this.winner = 'player';
            this.noSpoils = true;
            this.log.push({ msg: '🏳️ 你把兵刃一扔、单膝跪地——' + enemy.name + ' 绕着你走了一圈，收走了 ' + lostCopper + ' 枚铜钱' + (lostStone > 0 ? '和 ' + lostStone + ' 块灵石' : '') + '，大笑三声扬长而去。（命保住了）' });
            try { this._settleWitness(); } catch (eWit99) {}
            if (this.onEnd) this.onEnd('player');
            return true;
        }
        this.log.push({ msg: '🏳️ 「我降！」——' + enemy.name + ' 啐了一口：「求饶？晚了！」他趁你兵刃脱手抢上就是一击！' });
        try {
            var _sr99 = this._executeAttack(enemy, this.player, 'chest', enemy.damageType === 'sharp' ? 'slash' : (enemy.damageType || 'slash'));
            if (_sr99) this.log.push(_sr99);
        } catch (eS99) {}
        this._endPlayerAction();
        if (this._checkEnd()) return true;
        this._advanceTimeline();
        return true;
    }
    /** 铁蒺藜撒一地：眼毒的看见绕开，性急的踩个正着（条 -40、下一手命中 -10），老练的步步小心也乱了脚 */
    receiveCaltrop() {
        this._noteDeed('tricks');
        var face = this._rollPersona();
        var word = this._personaWord();
        var ea = this._findActor(this.enemy);
        if (face === 'sharp') {
            // 第一百波·看穿也有代价：纵身一跃躲开蒺藜，力气也花在了这一跃上
            var eC100 = this.enemy, sdC100 = 0;
            if ((eC100.maxStamina || 0) > 0 && eC100.stamina > 0) { sdC100 = Math.min(eC100.stamina, 5); eC100.stamina -= sdC100; }
            this.log.push({ msg: '🪤 你撒出一把铁蒺藜——' + this.enemy.name + ' 眼尖，纵身一跃落在蒺藜场外。（白撒了' + (sdC100 > 0 ? '，不过这一跃也费了他一把力气：精力 -' + sdC100 : '') + '，' + word + '）' });
            return false;
        }
        if (face === 'reckless') {
            if (ea) ea.bar = Math.max(0, ea.bar - 40);
            this._foeStumble = 1;
            this.log.push({ msg: '🪤 ' + this.enemy.name + ' 抢步上前一脚踩中铁蒺藜，疼得单脚直跳、破口大骂！（行动条 -40，下一手命中 -10，' + word + '）' });
            return true;
        }
        this._foeStumble = 1;
        this.log.push({ msg: '🪤 ' + this.enemy.name + ' 看见蒺藜，小心翼翼地绕着走——脚下一乱，攻势也慢了。（下一手命中 -10，' + word + '）' });
        return true;
    }
    /** 灶灰辣粉：穷人的石灰——便宜好使，但只糊得住性急的（瞎一回） */
    receiveAsh() {
        this._noteDeed('tricks');
        var face = this._rollPersona();
        var word = this._personaWord();
        if (face === 'reckless') {
            this.log.push({ msg: '🌶️ 灶灰辣粉兜头糊了 ' + this.enemy.name + ' 一脸——他呛得眼泪直流，兵刃乱抡！（瞎一回，' + word + '）' });
            return 1;
        }
        // 第一百波·看穿也有代价：眼毒的袖子拂得再快，也是把力气花在了拂灰上
        var eA100 = this.enemy, sdA100 = 0;
        if (face === 'sharp' && (eA100.maxStamina || 0) > 0 && eA100.stamina > 0) { sdA100 = Math.min(eA100.stamina, 5); eA100.stamina -= sdA100; }
        this.log.push({ msg: '🌶️ ' + this.enemy.name + ' ' + (face === 'cautious' ? '早有防备，侧脸闭气' : '袖子一拂') + '，灶灰散了大半。（白撒了' + (sdA100 > 0 ? '，不过这一拂也费了力气：精力 -' + sdA100 : '') + '，' + word + '）' });
        return 0;
    }
    /** 敌人跪地求饶：气血见了底的武人（非 boss、一场一回、三五成把握）——杀与放，你来定 */
    _tryEnemySurrender() {
        var enemy = this.enemy;
        if (!enemy || !enemy.isAlive || this._surrenderAsked) return false;
        if (enemy.species === 'beast' || enemy.physiologyType === 'beast') return false;   // 兽不会跪
        if (/boss/.test(String(enemy._enemyType || ''))) return false;                     // 头目宁死不受辱
        // 会遁走的先想着跑，不想着跪（与装死同一口径——不抢遁术的戏）
        if (Array.isArray(enemy.combatAbilities) && enemy.combatAbilities.indexOf('escape') >= 0) return false;
        var phys = enemy.physiology;
        var blood = phys ? (phys.bloodVolume !== undefined ? phys.bloodVolume : phys.health) : 100;
        var bloodMax = (phys && phys.maxBloodVolume) ? phys.maxBloodVolume : 100;
        var pct = bloodMax > 0 ? (blood / bloodMax) * 100 : 100;
        // 第一百波·连环手：心气散了的人更容易跪——触发线抬到两成，肯跪的概率过半
        var _dsh100 = this._foeDisheartened > 0;
        if (pct >= (_dsh100 ? 20 : 12)) return false;
        if (Math.random() >= (_dsh100 ? 0.55 : 0.35)) return false;
        this._surrenderAsked = true;
        this.log.push({ msg: '🧎 ' + enemy.name + (_dsh100 ? ' 的心气早被你打散了——' : ' ') + '兵刃当啷落地，双膝一软跪了下去：「我降！我降！好汉饶命——我家里还有老娘！」' });
        this._pendingPrompt = {
            kind: 'surrender',
            text: enemy.name + ' 弃了兵刃跪地求饶——这条命，你收不收？',
            options: [
                { k: 'kill', label: '⚔️ 手起刀落（杀降不祥——有人看见就传得出去）' },
                { k: 'spare', label: '🙏 收刀放他走（他会记着这份不杀之恩，江湖也会记着）' }
            ]
        };
        return true;
    }
    /** 江湖耳目：有人看见，就等于发生了——仗打完按目击者的正邪结账（阵营声望真账） */
    _settleWitness() {
        if (this._witnessSettled) return;
        this._witnessSettled = true;
        var deeds = this._deeds || {};
        if (!deeds.tricks && !deeds.demonic && !deeds.mercy && !deeds.execution) return;
        var _EVIL_ST = ['bandit', 'renegade', 'cultist', 'poisoner', 'blood', 'essence', 'gu', 'yaksha', 'demon_general', 'reaper'];
        var isHuman = function (e) { return !!e && (e.species === 'human' || e.physiologyType === 'humanoid'); };
        var witnesses = [];
        var self = this;
        var pushW = function (e) {
            if (!isHuman(e)) return;
            var evil = (e._evilFaction === true) || _EVIL_ST.indexOf(String(e.subtype || '')) >= 0;
            witnesses.push({ e: e, evil: evil });
        };
        // 谁能活着开口：遁走/被放走的主敌与同伙；你败了/弃械/逃跑时站着的那个敌人
        if (this.enemy) {
            if (this.enemy._fled) pushW(this.enemy);
            else if (this.enemy.isAlive && (this.winner === 'enemy' || this.surrendered || this.playerFled)) pushW(this.enemy);
        }
        (this.enemyAllies || []).forEach(function (a) { if (a && a._fled) pushW(a); });
        if (!witnesses.length) return;   // 没人看见，就等于没发生（死人不会说话）
        var evilW = witnesses.some(function (w) { return w.evil; });
        var decentW = witnesses.some(function (w) { return !w.evil; });
        var chRep = function (fid, n) { try { if (typeof window.changeFactionReputation === 'function') window.changeFactionReputation(fid, n); } catch (e) {} };
        var msg = function (m, t) { try { if (window.showMessage) window.showMessage(m, t || 'info'); } catch (e) {} };
        if (deeds.demonic) {
            if (decentW) { chRep('righteous_alliance', -12); msg('👁️ 你的魔道功法当众露了相——看见的人会把它传出去。正道人一见魔功，百口难辨。（正道联盟声望 -12）', 'warning'); }
            if (evilW) { chRep('demon_cult', 6); msg('🩸 你露的魔功传进了魔道耳朵里——他们把你当自己人了。（魔道声望 +6）', 'info'); }
        }
        if (deeds.tricks) {
            if (decentW) { chRep('righteous_alliance', -3); msg('👁️ 你的手段被人看了去——撒灰、掳人盾这类事，正经人瞧不起。（正道联盟声望 -3）', 'warning'); }
            else if (evilW) { chRep('rogue_cultivators', 2); msg('🖤 你的手段传进了下九流的耳朵——走黑路的人都夸你专业。（散修声望 +2）', 'info'); }
        }
        if (deeds.mercy) { chRep('righteous_alliance', 6); chRep('rogue_cultivators', 3); msg('🙏 你放走了一个跪地求饶的人——江湖会记得这份不杀之恩。（正道 +6，散修 +3）', 'success'); }
        if (deeds.execution) {
            if (decentW) { chRep('righteous_alliance', -8); msg('⚰️ 你杀了跪地求饶的人——这事传出去不好听。（正道联盟声望 -8）', 'warning'); }
            else if (evilW) { chRep('demon_cult', 3); msg('🩸 下九流只服狠——你杀降的做派让邪道中人高看一眼。（魔道声望 +3）', 'info'); }
        }
    }

    // ===== 第九十七波·对面也是活人：敌人也有真气、也有行囊、也带同伙 =====
    /** 敌人的招牌重手名号：一人定一招（名号+等级定死——具名强敌的招不会一场里换来换去） */
    _foeMoveName(enemy) {
        if (enemy._foeMoveName) return enemy._foeMoveName;
        // 第九十八波：妖兽的招是爪/撞/角，不是人的刀掌枪——两本名号池按种系取
        var _isB = (enemy.species === 'beast' || enemy.physiologyType === 'beast');
        var POOL = _isB ? {
            slash: ['撕裂爪', '噬咬', '裂风爪'],
            blunt: ['蛮撞', '横扫千军', '塌山压'],
            pierce: ['穿甲角', '贯骨刺', '一点角芒']
        } : {
            slash: ['断岳斩', '拖刀势', '力劈华山'],
            blunt: ['开山掌', '碎骨拳', '崩字诀'],
            pierce: ['穿心刺', '点喉枪', '一线穿']
        };
        var dt = (enemy.damageType === 'sharp') ? 'slash' : (enemy.damageType || 'slash');
        var pool = POOL[dt] || POOL.slash;
        var h = 0, nm = String(enemy.name || '');
        for (var i = 0; i < nm.length; i++) h += nm.charCodeAt(i);
        enemy._foeMoveName = pool[(h + (enemy.level || 1)) % pool.length];
        return enemy._foeMoveName;
    }
    /** 敌人招牌重手：档位走身份（boss/精英/带词缀），资源各烧各的——
     *  人形武人烧真气（第九十七波），妖兽烧精力（第九十八波：血肉爆发力）。
     *  精力本就是世界账：玩家采补功吸得走它——妖王被吸干精力就只能干挠爪子。
     *  重手条价 = round(100×倍率) 夹 60~150，与玩家招式同一本价；不做全局数值放大 */
    _foeHeavyStrike(enemy, behavior, bloodVol, painLoad) {
        if (!enemy) return null;
        if ((enemy.level || 1) < 8) return null;                 // 真气没入门/幼兽气血未成，驱动不了重手
        if (painLoad >= 60) return null;                         // 剧痛提不起劲
        var _et = String(enemy._enemyType || '');
        var tier = /boss/.test(_et) ? 'boss' : ((/elite|demon/.test(_et) || enemy._affix) ? 'elite' : 'foe');
        if (tier === 'foe') return null;                         // 普通杂兵没这份身手——重手是身份的体现
        var isBeast = (enemy.species === 'beast' || enemy.physiologyType === 'beast');
        // 资源账：人形看真气，妖兽看精力
        var cost = isBeast ? (tier === 'boss' ? 50 : 35) : (tier === 'boss' ? 40 : 30);
        // 第一百波·对面也连环：上头的人下手不计本钱——怒气未消时重手的耗头减一成
        if (this._foeRage > 0) cost = Math.ceil(cost * 0.9);
        var has = isBeast ? (enemy.stamina || 0) : (enemy.qi || 0);
        var maxRes = isBeast ? (enemy.maxStamina || 0) : (enemy.maxQi || 0);
        if (maxRes <= 0 || has < cost) return null;              // 烧干了就只能平砍回气
        var want = 0.5;
        if (behavior === 'aggressive') want = 0.6;
        else if (behavior === 'balanced') want = (bloodVol > 30) ? 0.4 : 0.15;
        else if (behavior === 'defensive') want = (bloodVol > 50) ? 0.3 : 0.1;
        else if (behavior === 'opportunist') {
            var pp = this.player.physiology;
            var pb = pp ? (pp.bloodVolume !== undefined ? pp.bloodVolume : 100) : 100;
            want = (pb < 50) ? 0.55 : 0.25;   // 游斗的专挑你虚的时候下重手
        } else if (behavior === 'poisoner') want = 0.25;         // 用毒的：毒在刃上，重手只是陪衬
        if (Math.random() >= want) return null;
        var mult = tier === 'boss' ? 1.8 : 1.5;
        if (isBeast) enemy.stamina = Math.max(0, has - cost);
        else enemy.qi = Math.max(0, has - cost);
        return {
            mult: mult,
            apCost: Math.max(60, Math.min(150, Math.round(100 * mult))),
            name: this._foeMoveName(enemy),
            tier: tier,
            beast: isBeast,
            bonus: { type: 'move', damageMult: mult, hitBonus: tier === 'boss' ? 10 : 5 }
        };
    }

    // v10.0：使用招式攻击指定部位
    playerAttackWithMove(partId, move) {
        if (this.isFinished || !this.isPlayerTurn) return false;
        if (!this.enemy.isAlive) return false;
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
        // 第九十九波·运功出手，魔气自现：练过魔功的（魔染/魔功名目）一催招式就露相——一场只露一次
        if (this._playerDemonicOwner && !this._demonicShown) {
            this._demonicShown = true;
            this._noteDeed('demonic');
            this.log.push({ msg: '🩸 你运起功法，一缕黑气缠上刀锋——魔道的路数藏不住了。（正道中人见了这个，百口难辨）' });
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
        this._demonicOnHit(result);   // 第九十九波：魔道天生技应手露相
        // 1.2 用后置 CD：damageMult>=1.5 强招 2 回合，>=1.8 超强 3 回合（普攻无 CD）
        if (!this._moveCD) this._moveCD = {};
        var _mult = move.damageMult || 1.0;
        if (_mult >= 1.8) this._moveCD[_cdKey] = 3;
        else if (_mult >= 1.5) this._moveCD[_cdKey] = 2;
        // 第九十二波·行动条：招式的条价跟劲力走——damageMult 越重扣得越狠（60~150 封顶保底），
        // 轻灵快招（0.6~0.8 倍伤）只扣 60~80，条剩得多，回手就快；重招一记清空还倒欠，收势久。
        var apCost = (move.apCost != null) ? move.apCost : Math.max(60, Math.min(150, Math.round(100 * _mult)));
        this.spendActionCost(this.player, apCost);
        this._endPlayerAction();   // 第九十四波：石灰迷眼随你的手数消散
        if (this._checkEnd()) return true;
        this._advanceTimeline();
        return true;
    }

    // 敌人AI行动（v4.2/v9.8.1：疼痛影响行为 + 有限自救，避免低血无限治疗）
    // 修复6：敌人可攻击队员，队员自动反击
    // 第九十二波：本体改名 _enemyMainAct（只管敌主自己这一动）；enemyTurn 留作兼容壳=推进时间轴
    enemyTurn() {
        if (this.isFinished) return;
        this._advanceTimeline();
    }
    _enemyMainAct() {
        if (this.isFinished) return;
        const enemy = this.enemy;
        const phys = enemy.physiology;

        // ===== 第九十四波·见招拆招：你的装死姿态在他这一动里见分晓——信不信、识不识破，看他的性子 =====
        if (this.player._feignPose) {
            this.player._feignPose = false;
            var _fr = this._rollPersona();
            var _word = this._personaWord();
            if (_fr === 'reckless') {
                this._foeLulled = 1;
                this.player._backstabWindow = 1;
                this.log.push({ msg: '🖤 ' + enemy.name + ' 当真了——他收着刀凑近翻看「尸体」……（他这一下留力，你可暴起偷袭 ×1.5，' + _word + '）' });
            } else if (_fr === 'cautious') {
                this.log.push({ msg: '🖤 ' + enemy.name + ' 没上当——他停在三步开外看了半晌，才照旧出招。（白装了，' + _word + '）' });
            } else {
                this._foeInsight = 1;
                this.log.push({ msg: '🖤 ' + enemy.name + ' 一眼识破——「装死？我送你真死！」他提刀直奔你而来！（这一下命中 +25，' + _word + '）' });
            }
        }
        // ===== 第九十九波·卖绽：他看见你露的口子——咬不咬钩、咬了会怎样，看他的性子 =====
        if (this.player._baitPose) {
            this.player._baitPose = false;
            var _bfr = this._rollPersona();
            var _bfw = this._personaWord();
            // ===== 第一百波·连环手：怒气冲头的人不分真假——上头时这钩必咬，反手也更重 =====
            if (this._foeRage > 0) {
                this.player._backstabWindow = 1;
                this._nextPlayerHitMul = Math.max(this._nextPlayerHitMul || 0, 1.8);
                var _ba100 = this._findActor(enemy);
                if (_ba100) _ba100.bar -= 30;   // 扑得太猛收势不住（条可以欠账，不夹 0）
                this.log.push({ msg: '🎣 怒气冲头的人不分真假——' + enemy.name + ' 看见口子想都没想就扑了进来，刀势又猛又空！（他慢半拍行动条 -30，你反手这一下 ×1.8）' });
            } else if (_bfr === 'reckless') {
                this.player._backstabWindow = 1;
                var _ba99 = this._findActor(enemy);
                if (_ba99) _ba99.bar -= 30;   // 用力过猛，收势比谁都慢（条可以欠账，不夹 0）
                this.log.push({ msg: '🎣 ' + enemy.name + ' 看见破绽抢身便进——用力过猛，刀势收不回来了！（他慢半拍行动条 -30，你可反手偷袭 ×1.5，' + _bfw + '）' });
            } else if (_bfr === 'cautious') {
                // 第一百波·看穿也有代价：收步换架势防你后手，也得花时间
                var _bc100 = this._findActor(enemy);
                if (_bc100) _bc100.bar -= 10;   // 条可以欠账，不夹 0
                this.log.push({ msg: '🎣 ' + enemy.name + ' 盯着那个口子看了半晌，非但不进，反倒退了半步换了个架势。（「饵？」——不上当，但防你后手花了功夫，行动条 -10，' + _bfw + '）' });
            } else {
                this._foeInsight = 1;
                this.log.push({ msg: '🎣 ' + enemy.name + ' 一眼看穿破绽是饵——反手一刀直取你真正的空门！（「假的是绽，真的是你这只手！」' + _bfw + '，这一下命中 +25）' });
            }
        }
        // 对面也会使坏：姿态摆出来，时间轴停在这，等你见招拆招
        if (this._tryEnemyTrick()) return;
        // 第九十九波：打不动了的武人会跪——杀与放，你来定（时间轴停在这）
        if (this._tryEnemySurrender()) return;

        // ===== v21.9 符箓控制落地：定身/冰封/乾坤跳回合、毒药发作、沉默计时 =====
        // 此前这些效果字段只存在于物品描述里，战斗引擎零挂钩
        if (window.TalismanSystem) {
            if (typeof window.TalismanSystem.tickEnemyPoison === 'function') {
                var _poisonDmg = window.TalismanSystem.tickEnemyPoison(enemy);
                if (_poisonDmg > 0) {
                    this.log.push({ msg: '☠️ 刃毒发作——' + enemy.name + ' 面色发黑，受到 ' + _poisonDmg + ' 点毒伤！' });
                    if (!enemy.isAlive) {
                        this.turn++;
                        if (this._checkEnd()) return;
                    }
                }
            }
            if (typeof window.TalismanSystem.consumeEnemySkip === 'function') {
                var _skip = window.TalismanSystem.consumeEnemySkip();
                if (_skip) {
                    this.log.push({ msg: _skip.icon + enemy.name + _skip.text });
                    if (typeof window.TalismanSystem.tickEnemyTurn === 'function') window.TalismanSystem.tickEnemyTurn();
                    this._endEnemyMainAction(); return;
                }
            }
            if (typeof window.TalismanSystem.tickEnemyTurn === 'function') window.TalismanSystem.tickEnemyTurn();
        }
        
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
        // 第九十七波·守御不再是守御系的专利：任何武人重伤+剧痛都可能架起架势喘口气（是本能，不是门派秘传）
        if (guardChance === 0 && bloodVol < 35 && painLoad >= 40) guardChance = 0.15;
        // v12.8 守御标记每回合行动前重置（仅守御当回合并置1）
        enemy._guardTurns = 0;

        // ===== v12.9 叛门弟子首次交手台词（仅一次）=====
        if (enemy._renegadeTauntPending === true) {
            enemy._renegadeTauntPending = false;
            this.log.push({ msg: enemy.name + " 冷笑：'师门？早就是笑话了。'" });
        }

        // ===== 第九十九波·骂阵：他的嘴比刀还脏——这口气咽不咽，由你定 =====
        // （一场一回；他自己得气血过半才骂得响；把你打到狼狈了才骂得欢——交手一轮之后）
        var _pb99 = this.player.physiology ? (this.player.physiology.bloodVolume !== undefined ? this.player.physiology.bloodVolume : 100) : 100;
        if (!this._foeTauntPromptDone && !(enemy.species === 'beast' || enemy.physiologyType === 'beast') &&
            bloodVol >= 50 && this.turn >= 1 && _pb99 < 60 && Math.random() < 0.12) {
            this._foeTauntPromptDone = true;
            var _tt99 = ['你娘教你的功夫吧？这么软！', '小白脸，吃奶的劲儿使出来没有？', '呸！打死你我都嫌脏了刀！', '爷走南闯北三十年，没见过你这么不中用的！'];
            var _tl99 = _tt99[Math.floor(Math.random() * _tt99.length)];
            this.log.push({ msg: '🗯️ ' + enemy.name + ' 一边游斗一边满嘴喷粪：「' + _tl99 + '」' });
            this._pendingPrompt = {
                kind: 'taunt',
                text: '「' + _tl99 + '」——他的骂比刀还狠，这口气你咽不咽？',
                options: [
                    { k: 'steel', label: '😤 稳着不理他（狗咬不了石头——精力 +5）' },
                    { k: 'rage', label: '🔥 怒火上头抢攻（行动条 +40、下一击 ×1.15，但两手气昏了头命中 -10）' },
                    { k: 'curse', label: '🗯️ 撸起袖子骂回去（能不能骂乱他，看他的性子）' }
                ]
            };
            return true;
        }

        // ===== 第九十九波·阵上不是哑巴场：三成的手数会喊一嗓子（喊招、喊胆、喊狠话）=====
        // （快倒下的人没力气喊——气血过半才喊得出口）
        if (!(enemy.species === 'beast' || enemy.physiologyType === 'beast') && bloodVol >= 50 && Math.random() < 0.3) {
            var _stc99 = String(enemy.subtype || '');
            var _cries99 = {
                bandit: ['「爷爷们在此——识相的留下买路财！」', '「砍了他！货平分！」'],
                cultist: ['「血食休走！」', '「把精气献给我，是你的造化！」'],
                monk: ['「施主——放下屠刀！」', '「阿弥陀佛，得罪了！」'],
                sword: ['「看好了——这一剑叫离别！」', '「你的功夫不错，可惜我的剑更快！」'],
                bladesman: ['「别走——吃我一刀！」'],
                poisoner: ['「闻见味儿了吗？晚了！」'],
                renegade: ['「师门的恩义？笑话！」']
            };
            var _pool99 = _cries99[_stc99] || ['「看招！」', '「接我这一下！」', '「你撑不过三合！」'];
            this.log.push({ msg: '🗣️ ' + enemy.name + ' ' + _pool99[Math.floor(Math.random() * _pool99.length)] });
        }

        // ===== v12.9 遁逃分支：重伤时概率尝试遁走；成功按玩家方结束但无战利品 =====
        // v13.0 门槛改查 escape 技（行为字符串/身份布尔不再是机制来源）
        // 第一百波·对面也连环：心气散了的人更早想着跑（气血线 30→40，念头 45%→60%）
        var _escThr100 = (this._foeDisheartened > 0) ? 40 : 30;
        var _escP100 = (this._foeDisheartened > 0) ? 0.6 : 0.45;
        if (enemy.hasAbility('escape') && bloodVol > 0 && bloodVol < _escThr100 && Math.random() < _escP100) {
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
            this._endEnemyMainAction(); return;
        }

        // ===== 第九十七波·行囊是真的：怀里有的就能用——濒死掏出丹药干咽 =====
        // 吃一颗少一颗（打死他搜刮到的就是剩下的）——账在携带物里，不是凭空配额
        if (bloodVol > 0 && bloodVol < 30) {
            try {
                var _pouchItems = (enemy.carriedInventory && Array.isArray(enemy.carriedInventory.items)) ? enemy.carriedInventory.items : null;
                if (_pouchItems && _pouchItems.length && Math.random() < 0.7) {
                    var _PILL_HEAL = { pill_small_recovery: 30, pill_big_recovery: 80, pill_spring_recovery: 200, pill_nine_revival: 500 };
                    var _PILL_CN = { pill_small_recovery: '小还丹', pill_big_recovery: '大还丹', pill_spring_recovery: '回春丹', pill_nine_revival: '九转还魂丹' };
                    var _pillIdx = -1, _pillHeal = 0, _pillName = '';
                    for (var _pi = 0; _pi < _pouchItems.length; _pi++) {
                        var _pid = _pouchItems[_pi];
                        var _ptpl = (typeof window !== 'undefined' && window.itemById) ? window.itemById[_pid] : null;
                        var _php = (_ptpl && _ptpl.effect && Number(_ptpl.effect.hp_recovery)) || _PILL_HEAL[_pid] || 0;
                        if (_php > _pillHeal) {
                            _pillHeal = _php; _pillIdx = _pi;
                            _pillName = (_ptpl && _ptpl.name) || _PILL_CN[_pid] || '丹药';
                        }
                    }
                    if (_pillIdx >= 0 && phys) {
                        _pouchItems.splice(_pillIdx, 1);
                        var _bloodCap = phys.maxBloodVolume || 100;
                        // 丹药药力单次封顶六成——还魂丹也不能把濒死一口灌满
                        var _healNow = Math.min(_pillHeal, Math.max(1, Math.round(_bloodCap * 0.6)));
                        phys.bloodVolume = Math.min(_bloodCap, (phys.bloodVolume || 0) + _healNow);
                        phys.health = phys.bloodVolume;
                        bloodVol = phys.bloodVolume;
                        this.log.push({ msg: '💊 ' + enemy.name + ' 从怀里摸出一颗「' + _pillName + '」干咽下去——气血回上来了！' });
                        this._endEnemyMainAction(); return;
                    }
                }
            } catch (ePouch) {}
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
                this._endEnemyMainAction(); return;
            }
            // 包扎失败则落入正常攻击
        }
        
        // 疼痛极高时有小概率动作失败（不再与治疗互斥成「永远挨打」）
        if (painLoad >= 80 && Math.random() < 0.2) {
            this.log.push({ msg: enemy.name + ' 因剧痛而行动迟缓' });
            this._endEnemyMainAction(); return;
        }
        
        // ===== v12.8 defensive 守御姿态：血量偏低且无未稳定流血可治时，概率放弃进攻 =====
        if (guardChance > 0 && bloodVol < 55 && bleedingWounds === 0 && Math.random() < guardChance) {
            enemy._guardTurns = 1;
            this.log.push({ msg: '🛡️ ' + enemy.name + ' 摆出凝神防御的架势' });
            this._endEnemyMainAction(); return;
        }

        // ===== 修复6：敌人可攻击队员 =====
        // v20.64：目标选择收进 _pickPlayerSideTarget，队员/灵兽权重均分（不再灵兽独吃 20%）
        var attackTarget = this._pickPlayerSideTarget(playerTargetBias);

        // ===== v20.64 掩护指令：有人站出来挡在你身前 =====
        if (attackTarget === this.player) {
            var cover = (this.partyMembers || []).filter(function (m) {
                return m.isAlive && m._partyOrder === 'cover';
            });
            if (cover.length > 0 && Math.random() < cover.length / (cover.length + 1)) {
                var shield = cover[Math.floor(Math.random() * cover.length)];
                this.log.push({ msg: '🛡️ ' + shield.name + ' 抢步挡在你身前！' });
                attackTarget = shield;
            }
        }

        // ===== 第九十九波·投鼠忌器：你掳了他的同伙当人盾——三成不敢下手，四成刀落自己人身上 =====
        if (this._humanShield && this._humanShield.isAlive && attackTarget === this.player) {
            // 第一百波·连环手：两眼糊着泪的人更不敢下刀——犹豫抬到五成，砍也多半砍着挡在跟前的
            var _bl100 = 0;
            try { if (window.TalismanSystem && typeof window.TalismanSystem.getEnemyBlindTurns === 'function') _bl100 = window.TalismanSystem.getEnemyBlindTurns() || 0; } catch (eB100) {}
            var _hsRoll = Math.random();
            var _hesT100 = _bl100 > 0 ? 0.5 : 0.3;
            var _shdT100 = _bl100 > 0 ? 0.85 : 0.7;
            if (_hsRoll < _hesT100) {
                this.log.push({ msg: _bl100 > 0
                    ? '🤚 ' + enemy.name + ' 两眼糊着泪，刀抬到一半——分不清哪个是你，终究没敢出手！'
                    : '🤚 ' + enemy.name + ' 的刀抬到一半又放下——投鼠忌器，这一下终究没敢出手！' });
                this._endEnemyMainAction();
                return;
            } else if (_hsRoll < _shdT100) {
                attackTarget = this._humanShield;
                this.log.push({ msg: _bl100 > 0
                    ? '🩸 他冲着一片模糊的影子挥刀便砍——正砍在你拽到身前的 ' + this._humanShield.name + ' 身上！'
                    : '🩸 他把心一横挥刀便砍——你拽过 ' + this._humanShield.name + ' 挡在身前！' });
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
        // ===== 第九十七波·敌人招牌重手：烧自己的真气，重手条价更贵（与玩家招式同一本行动条价） =====
        // 档位走身份（boss/精英/带词缀的野外强敌）——普通杂兵仍是平砍，不做全局数值放大
        var _foeStrike = null, _foeBonus = null;
        try { _foeStrike = this._foeHeavyStrike(enemy, behavior, bloodVol, painLoad); } catch (eHS) {}
        if (_foeStrike) {
            _foeBonus = _foeStrike.bonus;
            this._foeLastAp = _foeStrike.apCost;
            this.log.push({ msg: '✨ ' + enemy.name + (_foeStrike.beast ? ' 一声低吼，气血暴起——' : ' 真气一运，') + '使出招牌重手「' + _foeStrike.name + '」！' });
        }
        // v20.64 补丁必须保证还原：_executeAttack 一旦抛错，原来会把减伤补丁永久留在敌人身上
        let result;
        try {
            result = this._executeAttack(enemy, attackTarget, selectedPart, enemyDamageType, _foeBonus);
        } finally {
            if (painPenalty < 1) {
                enemy.getAttack = origGetAttack;
            }
        }
        this.log.push(result);
        // 敌人平砍也要回气（与玩家普攻回气同式：越亏回得越快）——有真气账的才回
        if (!_foeStrike && enemy.maxQi > 0 && enemy.isAlive) {
            enemy.qi = Math.min(enemy.maxQi, (enemy.qi || 0) + 6 + Math.floor((enemy.maxQi - (enemy.qi || 0)) / 20));
        }
        // 第九十八波·妖兽平砍回精力——血肉爆发力回得比真气慢（4+亏空/25，妖兽不是风箱）
        if (!_foeStrike && enemy.maxQi <= 0 && enemy.isAlive &&
            (enemy.species === 'beast' || enemy.physiologyType === 'beast') && (enemy.maxStamina || 0) > 0) {
            enemy.stamina = Math.min(enemy.maxStamina, (enemy.stamina || 0) + 4 + Math.floor(((enemy.maxStamina || 0) - (enemy.stamina || 0)) / 25));
        }
        if (attackTarget !== this.player && attackTarget.isAlive === false) {
            if (attackTarget === this.allyBeast) {
                this.log.push({ msg: '🐾 灵兽不支倒地，退出本场战斗' });
            } else {
                this.log.push({ msg: '👥 队员「' + attackTarget.name + '」被击败！' });
            }
        }
        // 第九十二波·行动条：敌主这一动到此为止——敌方同伴/队员/灵兽各有自己的行动条，
        // 不再排成「敌主→同伴→队员→兽」的固定长队；回合账（毒/生理/冷却）在敌主行动边界翻篇。
        this._endEnemyMainAction();
    }

    // 第九十二波·从旧 enemyTurn 长队里拆出来的单动口：一位角色攒满条就动这一下
    _enemyAllyAct(ally) {
        if (this.isFinished || !this.player.isAlive || !ally || !ally.isAlive) return;
        if (!this.enemy || !this.enemy.isAlive) return;   // 主敌已了账，同伙没道理接着围
        // ===== 第九十七波·同伙也是活人：该逃的命自己逃，该止的血自己止 =====
        try {
            var _aPhys = ally.physiology;
            var _aBlood = _aPhys ? (_aPhys.bloodVolume !== undefined ? _aPhys.bloodVolume : 100) : 100;
            // 带遁术的濒死自行脱身（只是这一位走了，主敌照打；沉默封遁术——hasAbility 一视同仁）
            if (typeof ally.hasAbility === 'function' && ally.hasAbility('escape') && _aBlood > 0 && _aBlood < 25 && Math.random() < 0.4) {
                ally._fled = true;
                ally.isAlive = false;
                this.log.push({ msg: '💨 ' + ally.name + ' 虚晃一招，夺路而逃——跑了的追不回来。' });
                this._checkEnd();
                return;
            }
            // 怀里那包绷带用一次（战地止血——手里有的才是账）
            if (!ally._fieldBandageUsed && _aPhys && Array.isArray(_aPhys.wounds) && typeof bandageWound === 'function') {
                var _aWounds = _aPhys.wounds.filter(function (w) { return w.bleeding && !w.stabilized; });
                if (_aWounds.length && (_aBlood < 45 || (_aPhys.painLoad || 0) >= 50)) {
                    _aWounds.sort(function (a, b) { return (b.externalBleedRate || 0) - (a.externalBleedRate || 0); });
                    ally._fieldBandageUsed = true;
                    if (bandageWound(ally, _aWounds[0].id)) {
                        this.log.push({ msg: '🩹 ' + ally.name + ' 缩到阵后，胡乱缠住了伤口！' });
                        this._checkEnd();
                        return;
                    }
                }
            }
        } catch (eAllyWit) {}
        var target = this._pickPlayerSideTarget(0.22);
        // 掩护指令同样拦得住同伴
        if (target === this.player) {
            var cover = (this.partyMembers || []).filter(function (m) { return m.isAlive && m._partyOrder === 'cover'; });
            if (cover.length > 0 && Math.random() < cover.length / (cover.length + 1)) {
                target = cover[Math.floor(Math.random() * cover.length)];
            }
        }
        var parts = PART_IDS;
        var part = parts[Math.floor(Math.random() * parts.length)];
        var dtype = ally.damageType === 'sharp' ? 'slash' : (ally.damageType || 'slash');
        var r = this._executeAttack(ally, target, part, dtype);
        this.log.push(r);
        if (target !== this.player && target.isAlive === false) {
            this.log.push({ msg: target === this.allyBeast
                ? '🐾 灵兽不支倒地，退出本场战斗'
                : '👥 队员「' + target.name + '」被击败！' });
        }
        this._checkEnd();
    }

    _memberAct(member) {
        if (!member || !member.isAlive) return;
        if (!this.enemy || !this.enemy.isAlive) return;
        var order = member._partyOrder || this.partyOrder || 'assault';
        if (order === 'guard') {
            // 自保：先把自己身上最重的血止住，没血可止就摆守御架势
            var gmsg = this._memberSelfPreserve(member);
            if (gmsg) this.log.push(gmsg);
        } else if (order === 'cover') {
            // 掩护：不抢人头，凝神戒备（敌侧选目标时已会优先咬他）
            this.log.push({ msg: '🛡️ ' + member.name + ' 戒备着，护在你侧翼' });
        } else {
            var targetParts = ['brain', 'chest', 'dantian', 'abdomen'];
            var mPart = targetParts[Math.floor(Math.random() * targetParts.length)];
            var mResult = this._executeAttack(member, this.enemy, mPart, _memberDamageType(member));
            // 同步回PartyMember的health
            if (member._partyMemberRef) {
                member._partyMemberRef.health = member.health != null ? member.health : member._partyMemberRef.health;
            }
            this.log.push(mResult);
        }
        this._checkEnd();
    }

    _beastAct() {
        if (!this.allyBeast || !this.allyBeast.isAlive || !this.enemy || !this.enemy.isAlive) return;
        var targetParts = ['brain', 'chest', 'dantian', 'abdomen'];
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
        this._checkEnd();
    }

    // 每回合末处理生理
    // ===== v20.64 目标选择（玩家侧）=====
    // 玩家仍占大头，灵兽与队员权重均分——不再「灵兽独吃 20%，队员四个人分剩下的」
    _pickPlayerSideTarget(playerBias) {
        var targets = [this.player];
        if (this.allyBeast && this.allyBeast.isAlive) targets.push(this.allyBeast);
        (this.partyMembers || []).forEach(function (m) { if (m.isAlive) targets.push(m); });
        if (targets.length <= 1) return this.player;
        if (Math.random() < playerBias) return this.player;
        var others = targets.filter(function (t) { return t !== this.player; }, this);
        return others[Math.floor(Math.random() * others.length)];
    }

    // ===== v20.64 敌方同伴动手 =====
    // 第九十二波·行动条改版：旧「主敌动完同伴排队轮一遍」的 _enemyAlliesAct 退役——
    // 每只同伴各有自己的行动条（_enemyAllyAct 是单动口），快的兽先扑上来，慢的殿后。

    // ===== v20.64 队员自保 =====
    // 先把自己身上最重的血止住；没血可止就摆守御架势（下轮挨打少受些）
    _memberSelfPreserve(member) {
        try {
            if (typeof bandageWound === 'function' && member.physiology) {
                var wounds = (member.physiology.wounds || []).filter(function (w) { return w.bleeding; });
                if (wounds.length) {
                    wounds.sort(function (a, b) { return (b.externalBleedRate || 0) - (a.externalBleedRate || 0); });
                    if (bandageWound(member, wounds[0].id)) {
                        return { msg: '🩹 ' + member.name + ' 退开半步，急忙包扎了自己的伤口' };
                    }
                }
            }
        } catch (eBd) {}
        member._guardTurns = 1;
        return { msg: '🛡️ ' + member.name + ' 收势自守，摆开架势护住要害' };
    }

    // 每回合末处理生理
    // v20.64 按回合记账：此前每个动作后都对全场结算一遍 6 秒生理——独闯一轮每人走 12 秒，
    // 带 3 个队员走 30 秒，队伍越大全场流血/疼痛/毒素越快。现在一轮（玩家→敌→同伴→队员→灵兽）
    // 全场每人只走 6 秒，玩家的动作标志着一轮的开始。
    _processRoundPhysiology() {
        if (this._physTicked) return;
        this._physTicked = true;
        try {
            if (typeof processPhysiology === 'function') {
                processPhysiology(this.player, 6);
                processPhysiology(this.enemy, 6);
                if (this.allyBeast && this.allyBeast.isAlive) {
                    processPhysiology(this.allyBeast, 6);
                }
                // 敌方同伴也走生理
                for (var ei = 0; ei < (this.enemyAllies || []).length; ei++) {
                    if (this.enemyAllies[ei] && this.enemyAllies[ei].isAlive) {
                        processPhysiology(this.enemyAllies[ei], 6);
                    }
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
            // 第九十三波·淬毒入兵刃：刃上带毒，见血渗毒（毒账走符箓系统的敌毒同一本——2 回合×10）
            if (attacker === this.player && attacker._venomBlade > 0 && this._isEnemySide(defender)) {
                attacker._venomBlade -= 1;
                if (window.TalismanSystem && typeof window.TalismanSystem.applyBladePoison === 'function') {
                    window.TalismanSystem.applyBladePoison();
                    extra += ' ☠️ 淬在刃上的毒渗进伤口！（剩 ' + attacker._venomBlade + ' 次毒）';
                }
            }
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
        // 第七十三波·境由心转：心烦意乱刀发钝、神思不倦刀更利
        //（只有玩家的刀认心——敌人没有这本账；平平常常不动老伤害，一分不添）
        if (attacker.type === 'player') {
            try {
                if (window.MoodSystem && typeof window.MoodSystem.combatMul === 'function') {
                    var _mm = window.MoodSystem.combatMul();
                    if (_mm !== 1) damage = Math.max(1, Math.floor(damage * _mm));
                }
            } catch (eMoodC) {}
        }
        // v20.48 功法元素伤通电：习得秘籍的元素伤加成按敌型出力——
        // 火/冰/水/金/虚 对元素生物；虚 对亡灵；龙 对妖兽；魔 对邪道（山贼/邪修/魔修等 evil 标）。
        if (attacker.type === 'player' && attacker._artElem) {
            try {
                var _ph = defender.physiology || {};
                var _dtype = _ph.type || defender._enemyType || '';
                var _evil = !!_ph.evil || defender._evilFaction === true;
                var _mul = 0;
                var _ae = attacker._artElem;
                if (_dtype === 'elemental') _mul = Math.max(_mul, _ae.fire || 0, _ae.ice || 0, _ae.water || 0, _ae.metal || 0, _ae.void || 0);
                else if (_dtype === 'undead') _mul = Math.max(_mul, _ae.void || 0);
                else if (_dtype === 'beast') _mul = Math.max(_mul, _ae.dragon || 0);
                else if (_evil) _mul = Math.max(_mul, _ae.demon || 0);
                if (_mul > 0) damage = Math.max(1, Math.floor(damage * (1 + Math.min(60, _mul) / 100)));
            } catch (eArtEl) {}
        }
        // 第七十八波·太极领域兑现：玩家挨打按组合账减伤（组合账在实体上——一格守卫，封顶五成）
        if (defender.type === 'player' && defender._skillComboBonus && defender._skillComboBonus.damage_reduce) {
            try {
                var _dr = Math.min(50, Number(defender._skillComboBonus.damage_reduce) || 0);
                if (_dr > 0) damage = Math.max(1, Math.floor(damage * (1 - _dr / 100)));
            } catch (eDR) {}
        }
        // 第九十四波·见招拆招：姿态全是一次性账本——谁上了当谁当场兑现，没有永久光环
        if (defender === this.player && this._foeLulled > 0 && attacker !== this.player) {
            this._foeLulled = 0;
            damage = Math.max(1, Math.floor(damage * 0.5));
            this.log.push({ msg: '🖤 他当你真了账——刀上留了三分力（这一下伤害减半）！' });
        }
        if (attacker === this.player && (this.player._backstabWindow || this._nextPlayerHitMul)) {
            var _mul = this._nextPlayerHitMul || 1.5;
            this._nextPlayerHitMul = 0;
            this.player._backstabWindow = 0;
            damage = Math.floor(damage * _mul);
            this.log.push({ msg: _mul >= 1.5 ? '🖤 你从地上暴起——偷袭！（×' + _mul + '）' : '🔥 怒火中烧——这一下带着石灰的仇（×1.2）！' });
        }
        if (attacker === this.enemy && this._foeBackstabPending) {
            this._foeBackstabPending = 0;
            damage = Math.floor(damage * 1.5);
        }
        // 第九十九波·怒火出手更狠（一次性）；攻心话泄了他的气，刀软一成半（随敌主动作递减）
        if (attacker === this.enemy && this._foeRageDmg > 0) {
            this._foeRageDmg = 0;
            damage = Math.floor(damage * 1.2);
            this.log.push({ msg: '🔥 他带着怒火出手——这一下格外狠（×1.2）！' });
        }
        if (attacker === this.enemy && this._foeDisheartened > 0) {
            damage = Math.max(1, Math.floor(damage * 0.85));
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
        // v20.64 队员也会还手：派生表的反击率只按兵器技能算（队员几乎没有），
        // 队员的反击改从身法里来——手脚麻利的人挨了一刀，总有机会回敬一下
        if (rate <= 0 && defender._partyMemberRef) {
            var cdDex = (defender.getEffectiveAttrs ? defender.getEffectiveAttrs().dexterity : 10) || 10;
            rate = Math.max(0, Math.min(15, (cdDex - 10) * 0.8));
        }
        // 第七十八波·太极领域兑现：组合的反击率加在派生表之后、掷骰之前（封顶六十——以柔克刚不是必反）
        if (defender.type === 'player' && defender._skillComboBonus && defender._skillComboBonus.counter) {
            try { rate = Math.min(60, rate + (Number(defender._skillComboBonus.counter) || 0)); } catch (eCtr) {}
        }
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
        // 第九十三波·迷烟散：石灰糊了眼，敌主的招全凭瞎摸（命中 -30，随敌主行动回数消散）
        if (attacker === this.enemy && window.TalismanSystem && typeof window.TalismanSystem.getEnemyBlindTurns === 'function') {
            try { if (window.TalismanSystem.getEnemyBlindTurns() > 0) hitRate -= 30; } catch (eBlind) {}
        }
        // 第九十四波·石灰反着撒回来：你自己的眼被迷（随你的行动回数消散）；眼毒的家伙识破了你的姿态
        if (attacker === this.player) {
            if (this._playerBlind > 0) hitRate -= 30;
            else if (this._playerBlindHalf > 0) hitRate -= 15;
        }
        if (attacker === this.enemy && this._foeInsight > 0) {
            this._foeInsight = 0;
            hitRate += 25;
        }
        // 第九十九波·嘴上的账：怒火露破绽（一次性转伤害账）、心气泄了、蒺藜乱了脚步
        if (attacker === this.enemy) {
            if (this._foeRage > 0) { this._foeRage = 0; this._foeRageDmg = 1; hitRate -= 15; }
            else if (this._foeDisheartened > 0) hitRate -= 15;
            if (this._foeStumble > 0) { this._foeStumble = 0; hitRate -= 10; }
        }
        if (attacker === this.player && this._playerRage > 0) hitRate -= 10;
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

        // v21.9 隐身符：隐身期间敌人的攻击直接落空（每次受击消耗一层）
        if (defender.type === 'player' && window.TalismanSystem && typeof window.TalismanSystem.consumeInvisDodge === 'function') {
            try {
                if (window.TalismanSystem.consumeInvisDodge()) {
                    return { msg: `👤 你的身形淡在空气里——${attacker.name} 的攻击穿过残影，扑了个空！`, missed: true, dodged: true };
                }
            } catch (e) {}
        }

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
        // v21.9 破甲符：限时限次的穿透加成（getPenetrateBonus 在攻击完成后按次消耗）
        if (attacker.type === 'player' && window.TalismanSystem && typeof window.TalismanSystem.getPenetrateBonus === 'function') {
            try { penetrate += window.TalismanSystem.getPenetrateBonus() || 0; } catch (e) {}
        }

        if (canBlock && blockRate > 0 && Math.random() * 100 < blockRate) {
            let damage = this._calculateDamage(attacker, defender, penetrate);
            const blockReduction = dStats
                ? dStats.blockReduction
                : Math.min(0.7, 0.5 + defenderToughness * 0.005);
            damage = Math.floor(damage * (1 - blockReduction));
            const actual = defender.takeDamage(partId, Math.max(1, damage), damageType);
            this._notePartyDamage(defender, actual);
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
            this._notePartyDamage(defender, actual);
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
        this._notePartyDamage(defender, actual);
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
        // 第九十波·落马账：骑乘中挨了重击（暴击、或一击打穿胸口耐久四成），骑手可能被震下马背——
        // 三成落马。落马不是惩罚弹窗，是世界后果：机动加成当场撤销、坐骑继续留在阵上替你打，
        // 但本场战斗打得正急，再难翻身骑上去。
        if (this._mounted && defender === this.player && actual > 0) {
            var _chestMax = (defender.maxDurabilities && defender.maxDurabilities.chest) || 100;
            if (isCrit || actual >= _chestMax * 0.4) {
                if (Math.random() < 0.3) {
                    this._mounted = false;
                    if (this._mountDodge > 0) {
                        this.player.dodgeBonus = Math.max(0, this.player.dodgeBonus - this._mountDodge);
                        this._mountDodge = 0;
                    }
                    msg += ' 💥 你被震得栽下马背——落马了！（坐骑仍在阵上为你而战，机动加成没了，本场再难翻身上马）';
                }
            }
        }
        return { msg, part: partId, damage: actual, crit: isCrit, damageType: damageType };
    }

    // ===== v20.64 队员挨打记账 =====
    // 此前 battleLastTakenDamage 全项目无人写入，「战后关系记忆」整段是死代码。
    // 队员挨的每一刀都记到他身上，死了打上标记，战后统一结算关系与后事。
    _notePartyDamage(defender, actual) {
        try {
            var ref = defender && defender._partyMemberRef;
            if (!ref) return;
            if (actual > 0) ref.battleLastTakenDamage = (ref.battleLastTakenDamage || 0) + actual;
            if (defender.isAlive === false) ref._diedThisBattle = true;
        } catch (e) {}
    }

    _checkEnd() {
        // 修复6：检查所有队员是否全部阵亡——但队员阵亡不影响战斗继续，仅玩家阵亡才算输
        if (!this.player.isAlive) {
            // v21.9 复活符：致命伤被符力抵消一次（半血站起，战斗继续）
            if (window.TalismanSystem && typeof window.TalismanSystem.tryRevive === 'function') {
                try {
                    if (window.TalismanSystem.tryRevive(this.player)) {
                        this.log.push({ msg: '🕯️ 复活符应验——你受了致命一击，却又站了起来！' });
                        if (this.onUpdate) this.onUpdate();
                        return false;
                    }
                } catch (e) {}
            }
            this.isFinished = true;
            this.winner = 'enemy';
            // v12.9 修复休眠缺陷：_consumeFormationBuff 定义在 Entity 上，此前误以 Battle 身份调用
            if (this.player && typeof this.player._consumeFormationBuff === 'function') this.player._consumeFormationBuff();
            if (typeof window.onBeastBattleEnd === 'function') {
                try { window.onBeastBattleEnd(false); } catch (e) {}
            }
            try { this._settleWitness(); } catch (eW99) {}   // 第九十九波：败了也有目击者——你的手段他全看见了
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
        // ===== v20.64 敌方一组：主敌倒下，枪口转向下一个还站着的 =====
        // 倒下的记进 _fallenEnemies（战后一并标尸）；同伴补位后战斗继续，UI 无需换目标
        if (this.enemy && !this.enemy.isAlive) {
            if (this._fallenEnemies.indexOf(this.enemy) < 0) this._fallenEnemies.push(this.enemy);
            var nextFoe = (this.enemyAllies || []).filter(function (a) { return a && a.isAlive; })[0];
            if (nextFoe) {
                this.enemyAllies = this.enemyAllies.filter(function (a) { return a !== nextFoe; });
                this.enemy = nextFoe;
                this.log.push({ msg: '🎯 ' + nextFoe.name + ' 补了上来！' });
                return false;
            }
        }
        // ===== v12.9 遁修遁逃：敌方成功遁走 → 战斗按玩家方结束但无战利品（noSpoils）=====
        // 不发 enemy:defeated 击杀事件、不标记尸体；胜利文案与奖励由 app.js 按 noSpoils 降级
        if (this.enemy && this.enemy._fled === true && !this.isFinished) {
            this.isFinished = true;
            this.winner = 'player';
            this.noSpoils = true;
            if (this.player && typeof this.player._consumeFormationBuff === 'function') this.player._consumeFormationBuff();
            try { this._settleWitness(); } catch (eW99) {}   // 第九十九波：跑掉的人会把看见的说出去
            if (this.onEnd) this.onEnd('player');
            return true;
        }
        if (!this.enemy.isAlive) {
            this.isFinished = true;
            this.winner = 'player';
            if (this.player && typeof this.player._consumeFormationBuff === 'function') this.player._consumeFormationBuff();
            // ===== 第九十九波·死前之言：武人的最后一口气，不该是一串空账 =====
            try {
                if (this.enemy.species === 'human' || (!this.enemy.species && this.enemy.physiologyType !== 'beast')) {
                    var _dw99 = {
                        bandit: ['「弟兄们……替我……报仇……」', '「早知道……就不接这票了……」'],
                        cultist: ['「嘿嘿……教主会来……收我的……你不得好死……」', '「我的精气……便宜你了……」'],
                        monk: ['「阿弥陀佛……一身修为……归于尘土……」', '「施主……回头……是岸……」'],
                        sword: ['「我的剑……断了……」', '「好剑法……我服了……」'],
                        renegade: ['「师门……是不会收我的……」', '「这条路……我自己选的……不悔……」']
                    };
                    var _dpool99 = _dw99[String(this.enemy.subtype || '')] ||
                        ['「替我……照顾我娘……」', '「我这条命……就到这了……」', '「我怀里的玉佩……送给我妹子……」'];
                    this.log.push({ msg: '🕯️ ' + this.enemy.name + ' 气若游丝：' + _dpool99[Math.floor(Math.random() * _dpool99.length)] });
                    // 弥留之际往你手里塞了样东西——搜刮账里多几枚带血的铜钱（真账，不是凭空掉落）
                    if (Math.random() < 0.25) {
                        var _bonus99 = 8 + Math.floor(Math.random() * 12) + (this.enemy.level || 1);
                        if (!this.enemy.carriedInventory) this.enemy.carriedInventory = { items: [], spiritStones: 0, copper: 0 };
                        this.enemy.carriedInventory.copper = (this.enemy.carriedInventory.copper || 0) + _bonus99;
                        this.log.push({ msg: '💰 他弥留之际往你手里塞了样东西——' + _bonus99 + ' 枚带血的铜钱。（进了搜刮账）' });
                    }
                }
            } catch (eDw99) {}
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
            
            // P2：战后关系记忆改由 app.js closeBattle 的 finalizeBattleOutcome 统一结算（v20.64）
            // 此前只在胜利时结算，且 battleLastTakenDamage 无人写入，整段是死代码
            
            if (typeof window.onBeastBattleEnd === 'function') {
                try { window.onBeastBattleEnd(true); } catch (e) {}
            }
            try { this._settleWitness(); } catch (eW99) {}   // 第九十九波：逃走的同伙会把看见的说出去
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