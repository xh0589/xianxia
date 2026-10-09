// ==================== 仙侠世界 - 物品系统 ====================
// 借鉴《太吾绘卷》、《觅长生》等仙侠游戏的物品设计

// ============ 物品分类 ============
const ITEM_CATEGORIES = {
    EQUIPMENT: 'equipment',      // 装备
    CONSUMABLE: 'consumable',    // 消耗品
    MATERIAL: 'material',        // 材料
    QUEST: 'quest',              // 任务物品
    SECRET_ART: 'secret_art',    // 秘籍
    FORMATION: 'formation'       // 阵法
};

// ============ 物品品质（v20.91 九品制） ============
// 九品最低、一品最高；「特殊」为独一份的信物级（男主女主信物等），不进商铺不掉落。
// 六品/四品/二品为扩展批次新增档位，与旧档交错成完整阶梯。
const ITEM_QUALITIES = {
    PIN9:   { id: 'pin9',   name: '九品', color: 'text-gray-400',   multiplier: 1,   order: 1 },
    PIN8:   { id: 'pin8',   name: '八品', color: 'text-green-400',  multiplier: 1.5, order: 2 },
    PIN7:   { id: 'pin7',   name: '七品', color: 'text-blue-400',   multiplier: 2,   order: 3 },
    PIN6:   { id: 'pin6',   name: '六品', color: 'text-cyan-300',   multiplier: 2.6, order: 4 },
    PIN5:   { id: 'pin5',   name: '五品', color: 'text-purple-400', multiplier: 3.2, order: 5 },
    PIN4:   { id: 'pin4',   name: '四品', color: 'text-fuchsia-400',multiplier: 4,   order: 6 },
    PIN3:   { id: 'pin3',   name: '三品', color: 'text-yellow-400', multiplier: 5,   order: 7 },
    PIN2:   { id: 'pin2',   name: '二品', color: 'text-orange-400', multiplier: 6.5, order: 8 },
    PIN1:   { id: 'pin1',   name: '一品', color: 'text-red-500',    multiplier: 8,   order: 9 },
    UNIQUE: { id: 'unique', name: '特殊', color: 'text-pink-400',   multiplier: 10,  order: 10 }
};
// 旧档兼容：老存档里的装备克隆体可能还带旧品质串，读到就折算到新档
const QUALITY_LEGACY_MAP = {
    COMMON: 'PIN9', UNCOMMON: 'PIN8', RARE: 'PIN7',
    EPIC: 'PIN5', LEGENDARY: 'PIN3', MYTHIC: 'PIN1'
};
// 旧键指向同一份定义，任何 ITEM_QUALITIES[旧串] 查表都不落空
Object.keys(QUALITY_LEGACY_MAP).forEach(function (k) { ITEM_QUALITIES[k] = ITEM_QUALITIES[QUALITY_LEGACY_MAP[k]]; });
function normalizeQuality(q) { return QUALITY_LEGACY_MAP[q] || q || 'PIN9'; }
function qualityOrder(q) { var d = ITEM_QUALITIES[normalizeQuality(q)]; return d ? d.order : 0; }

// v20.92 功法品阶同归九品制：旧档功法（含 NPC 存档里的 combat.skills）读到旧名就折算
const GRADE_LEGACY_MAP = { '凡品': '九品', '良品': '八品', '珍品': '七品', '优品': '五品', '仙品': '三品' };
function normalizeGrade(g) { return GRADE_LEGACY_MAP[g] || g; }

// ============ 装备槽位定义 ============
const EQUIPMENT_SLOTS = {
    HEAD: { id: 'head', name: '头部', slots: ['帽子', '头盔', '发簪'] },
    NECK: { id: 'neck', name: '颈部', slots: ['项链', '护颈'] },
    BODY: { id: 'body', name: '身体', slots: ['衣服', '铠甲', '道袍'] },
    WAIST: { id: 'waist', name: '腰部', slots: ['腰带', '玉佩'] },
    HANDS: { id: 'hands', name: '手部', slots: ['手套'] },
    FEET: { id: 'feet', name: '脚部', slots: ['鞋子', '靴子'] },
    MAIN_HAND: { id: 'main_hand', name: '主手', slots: ['剑', '刀', '杖', '拳套'] },
    OFF_HAND: { id: 'off_hand', name: '副手', slots: ['盾牌', '副武器'] },
    RING1: { id: 'ring1', name: '戒指1', slots: ['戒指'] },
    RING2: { id: 'ring2', name: '戒指2', slots: ['戒指'] },
    ACCESORY: { id: 'acc', name: '饰品', slots: ['玉佩', '香囊', '护符'] }
};

// ============ 武器类物品 ============
const weapons = [
    // 剑类
    {
        id: 'iron_sword',
        name: '玄铁剑',
        type: 'equipment',
        subtype: 'sword',
        slot: 'mainHand',
        category: ITEM_CATEGORIES.EQUIPMENT,
        quality: 'PIN8',
        level: 3,
        price: 200,
        attrs: { strength: 5, dexterity: 3 },
        combatBonus: { attack: 15, crit: 2 },
        desc: '由玄铁打造的基础长剑，适合初学者使用',
        icon: '⚔️',
        damageType: 'slash',
        weight: 4
    },
    {
        id: 'flying_sword',
        name: '御剑',
        type: 'equipment',
        subtype: 'sword',
        slot: 'mainHand',
        category: ITEM_CATEGORIES.EQUIPMENT,
        quality: 'PIN7',
        level: 8,
        price: 800,
        attrs: { strength: 8, dexterity: 6, intelligence: 4 },
        combatBonus: { attack: 35, crit: 5, hit: 5 },
        desc: '修仙者常用的飞剑，可御剑飞行',
        icon: '🗡️',
        damageType: 'slash',
        weight: 3
    },
    {
        id: 'thunder_sword',
        name: '雷音剑',
        type: 'equipment',
        subtype: 'sword',
        slot: 'mainHand',
        category: ITEM_CATEGORIES.EQUIPMENT,
        quality: 'PIN5',
        level: 15,
        price: 3000,
        attrs: { strength: 12, dexterity: 10, intelligence: 8 },
        combatBonus: { attack: 60, crit: 8, hit: 5 },
        desc: '剑身缠绕雷电之力的神兵',
        icon: '⚡',
        damageType: 'thunder',
        weight: 4
    },
    {
        id: 'immortal_sword',
        name: '仙人斩',
        type: 'equipment',
        subtype: 'sword',
        slot: 'mainHand',
        category: ITEM_CATEGORIES.EQUIPMENT,
        quality: 'PIN3',
        level: 25,
        price: 15000,
        attrs: { strength: 20, dexterity: 18, intelligence: 15 },
        combatBonus: { attack: 120, crit: 15, hit: 10 },
        desc: '传说中可以斩杀仙人的上古宝剑',
        icon: '✨',
        damageType: 'slash',
        weight: 5
    },

    // 刀类
    {
        id: 'iron_dao',
        name: '钢刀',
        type: 'equipment',
        subtype: 'dao',
        slot: 'mainHand',
        category: ITEM_CATEGORIES.EQUIPMENT,
        quality: 'PIN9',
        level: 1,
        price: 100,
        attrs: { strength: 4 },
        combatBonus: { attack: 10 },
        desc: '普通的钢铁刀具',
        icon: '🔪',
        damageType: 'slash',
        weight: 4
    },
    {
        id: 'fire_dao',
        name: '焚焰刀',
        type: 'equipment',
        subtype: 'dao',
        slot: 'mainHand',
        category: ITEM_CATEGORIES.EQUIPMENT,
        quality: 'PIN5',
        level: 18,
        price: 5000,
        attrs: { strength: 18, constitution: 10 },
        combatBonus: { attack: 80, crit: 10 },
        desc: '刀身燃烧着不灭火焰的宝刀',
        icon: '🔥',
        damageType: 'fire',
        weight: 5
    },

    // 法杖类
    {
        id: 'spirit_staff',
        name: '灵木杖',
        type: 'equipment',
        subtype: 'staff',
        slot: 'mainHand',
        category: ITEM_CATEGORIES.EQUIPMENT,
        quality: 'PIN8',
        level: 5,
        price: 400,
        attrs: { intelligence: 6, willpower: 4 },
        combatBonus: { attack: 20, hit: 3 },
        desc: '由灵木制成的法杖，适合法术攻击',
        icon: '🪄',
        damageType: 'blunt'
    },
    {
        id: 'dragon_staff',
        name: '龙魂杖',
        type: 'equipment',
        subtype: 'staff',
        slot: 'mainHand',
        category: ITEM_CATEGORIES.EQUIPMENT,
        quality: 'PIN1',
        level: 30,
        price: 50000,
        attrs: { intelligence: 30, willpower: 25, constitution: 20 },
        combatBonus: { attack: 200, hit: 15, crit: 10 },
        desc: '蕴含龙族灵魂的传说法杖',
        icon: '🐉',
        damageType: 'blunt',
        weight: 6
    },

    // 拳套类
    {
        id: 'iron_gauntlets',
        name: '铁掌',
        type: 'equipment',
        subtype: 'gauntlets',
        slot: 'mainHand',
        category: ITEM_CATEGORIES.EQUIPMENT,
        quality: 'PIN9',
        level: 2,
        price: 150,
        attrs: { strength: 3, constitution: 2 },
        combatBonus: { attack: 8, block: 3 },
        desc: '包裹铁掌的近战武器',
        icon: '👊',
        damageType: 'blunt'
    }
];

// ============ 防具类物品 ============
const armor = [
    // 头部
    {
        id: 'cloth_hat',
        name: '青布帽',
        type: 'equipment',
        subtype: 'hat',
        slot: 'head',
        category: ITEM_CATEGORIES.EQUIPMENT,
        quality: 'PIN9',
        level: 1,
        price: 80,
        attrs: { constitution: 2 },
        defense: 5,
        desc: '普通的布制帽子',
        icon: '🎩',
        resistance: { slash: 10, pierce: 5, blunt: 15 },
        coverage: { head: 0.7, brain: 0.3, eyes: 0.2, jaw: 0.4 },
        armorDurability: 30
    },
    {
        id: 'immortal_crown',
        name: '仙灵冠',
        type: 'equipment',
        subtype: 'crown',
        slot: 'head',
        category: ITEM_CATEGORIES.EQUIPMENT,
        quality: 'PIN3',
        level: 20,
        price: 12000,
        attrs: { intelligence: 15, willpower: 12, constitution: 10 },
        defense: 40,
        desc: '仙人佩戴的灵冠，可保护神识',
        icon: '👑',
        resistance: { slash: 45, pierce: 35, blunt: 30 },
        coverage: { head: 0.85, brain: 0.6, eyes: 0.3, jaw: 0.5 },
        armorDurability: 100
    },

    // 身体
    {
        id: 'linen_robe',
        name: '亚麻道袍',
        type: 'equipment',
        subtype: 'robe',
        slot: 'body',
        category: ITEM_CATEGORIES.EQUIPMENT,
        quality: 'PIN9',
        level: 1,
        price: 150,
        attrs: { constitution: 3 },
        defense: 10,
        desc: '基础的修仙者道袍',
        icon: '👘',
        resistance: { slash: 15, pierce: 10, blunt: 20 },
        coverage: { chest: 0.6, abdomen: 0.5, dantian: 0.3, waist: 0.4, pelvis: 0.3, neck: 0.2 },
        armorDurability: 40
    },
    {
        id: 'cloud_armor',
        name: '云纹甲',
        type: 'equipment',
        subtype: 'armor',
        slot: 'body',
        category: ITEM_CATEGORIES.EQUIPMENT,
        quality: 'PIN7',
        level: 10,
        price: 2500,
        attrs: { strength: 8, constitution: 8 },
        defense: 35,
        combatBonus: { dodge: 10 },
        desc: '织有云纹的轻便护甲',
        icon: '🛡️',
        resistance: { slash: 60, pierce: 45, blunt: 40 },
        coverage: { chest: 0.9, abdomen: 0.75, dantian: 0.5, waist: 0.6, pelvis: 0.5, neck: 0.3 },
        armorDurability: 80
    },

    // 鞋子
    {
        id: 'cloth_shoes',
        name: '布鞋',
        type: 'equipment',
        subtype: 'shoes',
        slot: 'feet',
        category: ITEM_CATEGORIES.EQUIPMENT,
        quality: 'PIN9',
        level: 1,
        price: 50,
        attrs: { constitution: 1 },
        defense: 3,
        desc: '普通的布鞋',
        icon: '👟',
        resistance: { slash: 5, pierce: 3, blunt: 10 },
        coverage: { footL: 0.5, footR: 0.5 },
        armorDurability: 20
    },
    {
        id: 'flight_boots',
        name: '飞天靴',
        type: 'equipment',
        subtype: 'boots',
        slot: 'feet',
        category: ITEM_CATEGORIES.EQUIPMENT,
        quality: 'PIN5',
        level: 15,
        price: 6000,
        attrs: { dexterity: 15, constitution: 8 },
        defense: 25,
        speed: 30,
        desc: '蕴含风灵气的飞行靴子',
        icon: '👢',
        resistance: { slash: 30, pierce: 25, blunt: 35 },
        coverage: { footL: 0.7, footR: 0.7, calfL: 0.4, calfR: 0.4 },
        armorDurability: 60
    },

    // 戒指
    {
        id: 'iron_ring',
        name: '铁戒指',
        type: 'equipment',
        subtype: 'ring',
        slot: 'ring1',
        category: ITEM_CATEGORIES.EQUIPMENT,
        quality: 'PIN9',
        level: 1,
        price: 60,
        attrs: { constitution: 2 },
        desc: '普通的铁戒指',
        icon: '💍'
    },
    {
        id: 'spirit_ring',
        name: '灵玉戒',
        type: 'equipment',
        subtype: 'ring',
        slot: 'ring1',
        category: ITEM_CATEGORIES.EQUIPMENT,
        quality: 'PIN7',
        level: 8,
        price: 1200,
        attrs: { intelligence: 8, willpower: 6 },
        combatBonus: { qi_regen: 3 },
        desc: '镶嵌灵玉的戒指，加速真气恢复',
        icon: '💎'
    },
    {
        id: 'five_element_ring',
        name: '五行戒',
        type: 'equipment',
        subtype: 'ring',
        slot: 'ring1',
        category: ITEM_CATEGORIES.EQUIPMENT,
        quality: 'PIN3',
        level: 20,
        price: 20000,
        attrs: { strength: 10, dexterity: 10, intelligence: 10, willpower: 10, constitution: 10 },
        desc: '蕴含五行之力的神秘戒指',
        icon: '🔮'
    }
];

// ============ 消耗品类物品 ============
const consumables = [
    // 丹药
    {
        id: 'qi_recovery_pill',
        name: '聚气丹',
        type: 'consumable',
        subtype: 'pill',
        category: ITEM_CATEGORIES.CONSUMABLE,
        quality: 'PIN9',
        level: 1,
        price: 30,
        effect: { qi_recovery: 50 },
        stackable: true,
        maxStack: 99,
        desc: '恢复50点真气的低级丹药',
        icon: '💊'
    },
    {
        id: 'foundation_pill',
        name: '筑基丹',
        type: 'consumable',
        subtype: 'pill',
        category: ITEM_CATEGORIES.CONSUMABLE,
        quality: 'PIN7',
        level: 5,
        price: 500,
        effect: { foundation_bonus: 20 },
        stackable: true,
        maxStack: 50,
        desc: '提升筑基成功率的高级丹药',
        icon: '💊'
    },
    {
        id: 'golden_core_pill',
        name: '凝金丹',
        type: 'consumable',
        subtype: 'pill',
        category: ITEM_CATEGORIES.CONSUMABLE,
        quality: 'PIN5',
        level: 10,
        price: 2000,
        effect: { core_bonus: 30 },
        stackable: true,
        maxStack: 30,
        desc: '辅助凝结金丹的珍贵丹药',
        icon: '🟡'
    },
    {
        id: 'spirit_restoring_pill',
        name: '回灵丹',
        type: 'consumable',
        subtype: 'pill',
        category: ITEM_CATEGORIES.CONSUMABLE,
        quality: 'PIN8',
        level: 3,
        price: 100,
        effect: { qi_recovery: 100 },
        stackable: true,
        maxStack: 99,
        desc: '恢复100点真气',
        icon: '💚'
    },
    {
        id: 'vitality_pill',
        name: '回春丹',
        type: 'consumable',
        subtype: 'pill',
        category: ITEM_CATEGORIES.CONSUMABLE,
        quality: 'PIN8',
        level: 3,
        price: 80,
        effect: { hp_recovery: 200 },
        stackable: true,
        maxStack: 99,
        desc: '恢复200点生命值',
        icon: '❤️'
    },

    // 灵草
    {
        id: 'ginseng',
        name: '千年人参',
        type: 'consumable',
        subtype: 'herb',
        category: ITEM_CATEGORIES.CONSUMABLE,
        quality: 'PIN7',
        level: 8,
        price: 800,
        effect: { energy_recovery: 200, hp_recovery: 100 },
        stackable: true,
        maxStack: 20,
        desc: '千年的人参，大幅恢复精力和生命',
        icon: '🌿'
    },
    {
        id: 'lingzhi',
        name: '灵芝',
        type: 'consumable',
        subtype: 'herb',
        category: ITEM_CATEGORIES.CONSUMABLE,
        quality: 'PIN8',
        level: 5,
        price: 200,
        effect: { hp_recovery: 150 },
        stackable: true,
        maxStack: 50,
        desc: '常见的灵药，可恢复生命',
        icon: '🍄'
    },
    {
        id: 'blood_plum',
        name: '血菩提',
        type: 'consumable',
        subtype: 'fruit',
        category: ITEM_CATEGORIES.CONSUMABLE,
        quality: 'PIN5',
        level: 15,
        price: 3000,
        effect: { hp_recovery: 300, qi_recovery: 100 },
        stackable: true,
        maxStack: 10,
        desc: '罕见的血系灵果，气血双补',
        icon: '🍒'
    },

    // 符箓
    // 基础攻击符/防御符在此处保持唯一定义，扩展文件不再重复注册
    {
        id: 'attack_talisman',
        name: '攻击符',
        type: 'consumable',
        subtype: 'talisman',
        category: ITEM_CATEGORIES.CONSUMABLE,
        quality: 'PIN9',
        level: 2,
        price: 50,
        effect: { attack_boost: 20, duration: 3 },
        stackable: true,
        maxStack: 99,
        desc: '使用后提升20点攻击力，持续3次攻击',
        icon: '📜',
        implemented: true
    },
    {
        id: 'defense_talisman',
        name: '防御符',
        type: 'consumable',
        subtype: 'talisman',
        category: ITEM_CATEGORIES.CONSUMABLE,
        quality: 'PIN9',
        level: 2,
        price: 50,
        effect: { defense_boost: 20, duration: 3 },
        stackable: true,
        maxStack: 99,
        desc: '使用后提升20点防御力，持续3次攻击',
        icon: '📜',
        implemented: true
    },
    {
        id: 'teleport_talisman',
        name: '传送符',
        type: 'consumable',
        subtype: 'talisman',
        category: ITEM_CATEGORIES.CONSUMABLE,
        quality: 'PIN8',
        level: 5,
        price: 200,
        effect: { teleport: true },
        stackable: true,
        maxStack: 30,
        desc: '瞬间传送到安全地点',
        icon: '🌀'
    }
];

// ============ 材料类物品 ============
const materials = [
    {
        id: 'iron_ore',
        name: '精铁',
        type: 'material',
        subtype: 'metal',
        category: ITEM_CATEGORIES.MATERIAL,
        quality: 'PIN9',
        level: 1,
        price: 20,
        stackable: true,
        maxStack: 999,
        desc: '基础锻造材料',
        icon: '🪨'
    },
    {
        id: 'spirit_stone',
        name: '灵石',
        type: 'material',
        subtype: 'stone',
        category: ITEM_CATEGORIES.MATERIAL,
        quality: 'PIN8',
        level: 3,
        price: 100,
        stackable: true,
        maxStack: 9999,
        desc: '蕴含灵气的石头，可作为货币使用',
        icon: '💠'
    },
    {
        id: 'dragon_bone',
        name: '龙骨',
        type: 'material',
        subtype: 'bone',
        category: ITEM_CATEGORIES.MATERIAL,
        quality: 'PIN5',
        level: 15,
        price: 2000,
        stackable: true,
        maxStack: 100,
        desc: '龙族骨骼，高级锻造材料',
        icon: '🦴'
    },
    {
        id: 'phoenix_feather',
        name: '凤凰羽',
        type: 'material',
        subtype: 'feather',
        category: ITEM_CATEGORIES.MATERIAL,
        quality: 'PIN3',
        level: 25,
        price: 10000,
        stackable: true,
        maxStack: 50,
        desc: '凤凰的羽毛，极其珍贵的材料',
        icon: '🪶'
    },
    {
        id: 'spirit_grass',
        name: '灵草',
        type: 'material',
        subtype: 'grass',
        category: ITEM_CATEGORIES.MATERIAL,
        quality: 'PIN9',
        level: 1,
        price: 30,
        stackable: true,
        maxStack: 500,
        desc: '基础炼丹材料',
        icon: '🌱'
    },
    {
        id: 'five_element_essence',
        name: '五行精华',
        type: 'material',
        subtype: 'essence',
        category: ITEM_CATEGORIES.MATERIAL,
        quality: 'PIN7',
        level: 10,
        price: 800,
        stackable: true,
        maxStack: 200,
        desc: '五行灵气凝聚的精华',
        icon: '✨'
    }
];

// ============ 秘籍类物品 ============
const secretArts = [
    {
        id: 'basic_cultivation',
        name: '基础修炼诀',
        type: 'secret_art',
        subtype: 'cultivation',
        category: ITEM_CATEGORIES.SECRET_ART,
        quality: 'PIN9',
        level: 1,
        price: 0,
        effect: { cultivation_speed: 10 },
        desc: '最基础的修炼方法',
        icon: '📖'
    },
    {
        id: 'sword_basic',
        name: '基础剑法',
        type: 'secret_art',
        subtype: 'sword',
        category: ITEM_CATEGORIES.SECRET_ART,
        quality: 'PIN9',
        level: 1,
        price: 100,
        effect: { sword_attack: 15 },
        desc: '入门级剑法',
        icon: '⚔️'
    },
    {
        id: 'taiji_sword',
        name: '太极剑法',
        type: 'secret_art',
        subtype: 'sword',
        category: ITEM_CATEGORIES.SECRET_ART,
        quality: 'PIN7',
        level: 10,
        price: 3000,
        effect: { sword_attack: 50, defense: 20 },
        desc: '道家至高剑法，以柔克刚',
        icon: '☯️'
    },
    {
        id: 'nine_yang',
        name: '九阳神功',
        type: 'secret_art',
        subtype: 'internal',
        category: ITEM_CATEGORIES.SECRET_ART,
        quality: 'PIN3',
        level: 20,
        price: 20000,
        effect: { yang_energy: 100, max_qi: 200, regen: 30 },
        desc: '至阳至刚的内功心法',
        icon: '☀️'
    },
    {
        id: 'qing_gong_fly',
        name: '飞天轻功',
        type: 'secret_art',
        subtype: 'movement',
        category: ITEM_CATEGORIES.SECRET_ART,
        quality: 'PIN5',
        level: 15,
        price: 8000,
        effect: { speed: 80, dodge: 20 },
        desc: '可以飞天的顶级轻功',
        icon: '💨'
    }
];

// ============ 将所有物品合并 ============
const allItems = [
    ...weapons,
    ...armor,
    ...consumables,
    ...materials,
    ...secretArts
];

// ============ 物品ID映射（方便快速查找） ============
const itemById = {};
allItems.forEach(item => {
    itemById[item.id] = item;
});

// ============ 按分类筛选 ============
function getItemsByCategory(category) {
    return allItems.filter(item => item.category === category);
}

function getItemsByQuality(quality) {
    return allItems.filter(item => item.quality === quality);
}

function getItemsByLevel(minLevel, maxLevel = 999) {
    return allItems.filter(item => item.level >= minLevel && item.level <= maxLevel);
}

function searchItems(keyword) {
    return allItems.filter(item => 
        item.name.includes(keyword) || 
        item.desc.includes(keyword)
    );
}

// ============ 导出到 window ============
window.ITEM_CATEGORIES = ITEM_CATEGORIES;
window.ITEM_QUALITIES = ITEM_QUALITIES;
window.QUALITY_LEGACY_MAP = QUALITY_LEGACY_MAP;
window.normalizeQuality = normalizeQuality;
window.qualityOrder = qualityOrder;
window.GRADE_LEGACY_MAP = GRADE_LEGACY_MAP;
window.normalizeGrade = normalizeGrade;
window.EQUIPMENT_SLOTS = EQUIPMENT_SLOTS;
window.weapons = weapons;
window.armor = armor;
window.consumables = consumables;
window.materials = materials;
window.secretArts = secretArts;
window.allItems = allItems;
window.itemById = itemById;
window.getItemsByCategory = getItemsByCategory;
window.getItemsByQuality = getItemsByQuality;
window.getItemsByLevel = getItemsByLevel;
window.searchItems = searchItems;

// ============ v27.13：物品产出登记（主档③改良「物品产出登记」） ============
// 为「赃物销赃」「名器认主」打地基：制造出的每件物品能溯源（自炼 craft / 购买 buy /
// 搜刮 loot / 拍卖 auction / 任务赏 reward）。
// 落地方案是**登记簿，不改物品实例**——物品 stacking/合并/传送遍地都是，往 item 对象上
// 盖章必被合并冲掉。StateRegistry 新键 'itemProvenance'（version 1，加键不升版先例）：
//   itemId → { src: 首源, day: 首得日, counts: { src: 次数(实收件数累加) } }
// 重复获得只加 counts、不覆盖首源——「名器认主」认的是第一手。
// 查询读口 window.ItemProvenance = { note, get, srcOf }；全 try/catch，查无此物=未登记
// 返回 null，**登记失败绝不拦正常获得**（物品照拿，账少一笔）。
(function () {
    var _book = Object.create(null);   // itemId → {src, day, counts}（唯一写点：note / import / reset）

    // 脏 id 兜底：null/undefined/空串/'undefined'/'null' 一律按无效处理（返回 null 不炸）
    function _key(v) {
        try {
            var k = String(v == null ? '' : v).trim();
            return (k && k !== 'undefined' && k !== 'null') ? k : null;
        } catch (e) { return null; }
    }

    // 首得日：WorldCalendar.day（无钟的老档/裸世界回 null，登记照记、只是无日可考）
    function _day() {
        try {
            var d = (window.WorldCalendar && typeof window.WorldCalendar.day === 'number') ? window.WorldCalendar.day : undefined;
            return (typeof d === 'number' && isFinite(d)) ? Math.floor(d) : null;
        } catch (e) { return null; }
    }

    function note(src, itemId, count) {
        try {
            var s = _key(src);
            var k = _key(itemId);
            if (!s || !k) return false;
            var n = Math.max(1, Math.floor(Number(count) || 1));
            var rec = _book[k];
            if (!rec) {
                var c0 = {};
                c0[s] = n;
                _book[k] = { src: s, day: _day(), counts: c0 };
            } else {
                // 重复获得：只加 counts，首源/首得日不覆盖
                rec.counts[s] = (Number(rec.counts[s]) || 0) + n;
            }
            return true;
        } catch (e) {
            console.warn('[静默失败] js/items.js · ItemProvenance.note：产出登记未入簿（物品照常到手，账少一笔）', e && e.message);
            return false;
        }
    }

    function get(itemId) {
        try {
            var k = _key(itemId);
            if (!k) return null;
            var rec = _book[k];
            if (!rec) return null;
            // 吐副本：读口不许让外面摸到簿子本体
            return JSON.parse(JSON.stringify(rec));
        } catch (e) { return null; }
    }

    function srcOf(itemId) {
        try {
            var rec = get(itemId);
            return rec ? rec.src : null;
        } catch (e) { return null; }
    }

    window.ItemProvenance = { note: note, get: get, srcOf: srcOf };

    // 存档（StateRegistry，加键不升版）：老档缺键自动补空，畸形记录逐条丢弃
    try {
        if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
            window.StateRegistry.register('itemProvenance', {
                version: 1,
                export: function () { return _book; },
                import: function (data) {
                    if (!data || typeof data !== 'object') return;   // 旧档缺键：保留空簿
                    var next = Object.create(null);
                    Object.keys(data).forEach(function (k) {
                        var r = data[k];
                        if (r && typeof r === 'object' && _key(r.src) && r.counts && typeof r.counts === 'object') {
                            next[k] = { src: String(r.src), day: (typeof r.day === 'number' && isFinite(r.day)) ? Math.floor(r.day) : null, counts: r.counts };
                        }
                    });
                    _book = next;
                },
                reset: function () { _book = Object.create(null); }   // 新开一局：登记簿随档清空
            });
        } else {
            console.warn('[ItemProvenance] StateRegistry 不可用——产出登记照常生效，只是不入档');
        }
    } catch (e) {
        console.warn('[静默失败] js/items.js · ItemProvenance：StateRegistry 注册失败（登记不受影响）', e && e.message);
    }
})();

// ==================== v27.13：器谱图鉴（主档模块③，设计稿 示例-器谱图鉴.html 已批「过」，按稿实现） ====================
// 纯读端纪律（照 js/map/lore-shelf.js 先例）：零新存档、零写点，对溯源簿与物品表只读不写。
// 吃两口真数据（与设计稿页尾「挂接点说明」同形）：
//   ① window.ItemProvenance —— 本文件尾部的溯源登记簿（itemId → {src 首源, day 首得日, counts{源:次数}}），
//      src 真值全库只有 craft/buy/loot/auction/reward 五种（crafting 四炉口/enhanced-shop/loot-system/
//      auction-service/reward-service 各自盖的章）——设计稿里的「自炼」即 counts.craft。
//   ② window.allItems —— 物品总表。**本文件加载序在第 15 位，items-extended 系列晚于本文件挂载**
//      （扩展全走 window.allItems.push / itemById 赋值），故物品表一律**开面板那一刻惰性读**，
//      绝不在此处缓存表快照，否则扩展物品永远上不了册。
// 档位推导（真源口径，照稿）：counts 含 craft（自炼）→ 炼成⚒；有溯源（counts 非空）未自炼 → 用过✋；
//   见识旁证 → 见过👀（**本期真源未批，恒空，案底见 _seenOf**）；皆无 → 未见其物（赭金虚线）。
//   服丹/用掉的物品有溯源无回收——「有溯源即用过」，照稿。
// 成就「器谱通家」：走真源计数（五卷每一件 counts.craft>0 才亮），不预发、不凭空。
//   **案底：不入 achievement-system**——其注册口径要求条件路径必须挂在 buildAchievementProfile()
//   的档案快照上（achievement-system.js 本批禁改；addAchievement 挂幽灵键永不亮，且踩它自家的
//   防幽灵键纪律），故本期为面板亮章，将来真要入册需先在档案快照里立「器谱炼成」真源键。
(function () {
    'use strict';

    // —— 五卷与档位（照稿） ——
    var CATS = ['丹', '器', '符', '食', '材'];
    var TIER = {
        3: { name: '炼成', icon: '⚒', cls: 'icx-t3' },
        2: { name: '用过', icon: '✋', cls: 'icx-t2' },
        1: { name: '见过', icon: '👀', cls: 'icx-t1' },
        0: { name: '未见其物', icon: '', cls: 'icx-t0' }
    };
    // 溯源簿 src 真值 → 卷面话术；簿里将来多出的新源原样直书，不装认识
    var SRC_CN = { craft: '自炼', buy: '购得', loot: '搜刮', auction: '拍卖', reward: '赏得' };

    // 面板内会话态：记住上次翻到哪卷哪档（重开面板不跳回）
    var _state = { cat: '丹', tier: 0 };

    // ---------- 五类归卷映射（盘点 515 件后定死的规则，全部按现有分类字段，不新造字段） ----------
    // items.js 本表 + items-extended 扩展表的 type/subtype 分布：
    //   equipment|weapon → 器卷；material → 材卷；consumable 按 subtype 细分；
    //   secret_art / quest / special 及 consumable|manual（绝技书）不入五卷——功法与任务信物不属丹器符食材。
    //   consumable|trap 三件按名分流：爆裂符→符卷；暗器/铁蒺藜→器卷（战斗投掷件）。
    //   consumable|poison（涂刃毒/迷烟散）入丹卷——药散一类；herb（可服灵药）入丹卷，material|herb 原料入材卷。
    function _volOf(it) {
        try {
            var ty = String(it.type || ''), st = String(it.subtype || ''), nm = String(it.name || '');
            if (ty === 'equipment' || ty === 'weapon') return '器';
            if (ty === 'material') return '材';
            if (ty === 'consumable') {
                if (st === 'talisman') return '符';
                if (st === 'trap') return nm.indexOf('符') >= 0 ? '符' : '器';
                if (st === 'food' || st === 'fruit') return '食';
                if (st === 'manual') return null;
                return '丹'; // pill/perm_pill/breakthrough/special_pill/special/medical/herb/poison
            }
            return null;
        } catch (e) { return null; }
    }

    // ---------- 案底：见识旁证（店有售/他人用过）真源本期未批 ----------
    // 设计稿用 SEEN/USED 两组假数据顶位；本实现口径选 **A**（详见汇报）：见过档本期恒空、
    // 留案底待旁证真源另批。将来旁证落地（如货架快照/见识事件账），在此读真源返回
    // { day, where, how, note } 即点亮见过档——渲染与判定逻辑不用动。
    function _seenOf(itemId) { return null; }

    // ---------- 真源读口（全 try/catch，缺席返回 null 不炸） ----------
    function _provenanceBook() {
        try {
            return (window.ItemProvenance && typeof window.ItemProvenance.get === 'function') ? window.ItemProvenance : null;
        } catch (e) { return null; }
    }
    function _recOf(book, id) {
        try { return book.get(id) || null; } catch (e) { return null; }
    }
    // 惰性读物品总表：后到覆盖去重（与 itemById 的「后写赢」同序），保表序
    function _readItems() {
        var arr = null;
        try { arr = window.allItems; } catch (e) { arr = null; }
        if (!Array.isArray(arr)) return [];
        var byId = {};
        for (var i = 0; i < arr.length; i++) {
            try {
                var it = arr[i];
                if (it && it.id && it.name) byId[it.id] = it;
            } catch (e) { /* 单件畸形不拖垮整表 */ }
        }
        var out = [];
        Object.keys(byId).forEach(function (k) { out.push(byId[k]); });
        return out;
    }

    // ---------- 档位推导（真源口径，照稿） ----------
    function _tierOf(it, book) {
        var rec = _recOf(book, it.id);
        if (rec && rec.counts && (Number(rec.counts.craft) || 0) > 0) return 3;   // 自炼过 → 炼成 ⚒
        if (rec) return 2;                                                        // 有来历而无自炼 → 用过 ✋
        if (_seenOf(it.id)) return 1;                                             // 只见过 → 见过 👀（本期恒不走）
        return 0;                                                                 // 皆无 → 未见其物
    }

    // ---------- 中文序数（器卷两百一十七件，稿里的 CN 表不够用，现算 1..999） ----------
    function _cnOrdinal(n) {
        try {
            n = Math.floor(Number(n) || 0);
            if (!(n > 0) || n > 999) return String(n);
            var D = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
            function tens(v) {
                if (v < 10) return D[v];
                if (v < 20) return '十' + (v % 10 ? D[v % 10] : '');
                return D[Math.floor(v / 10)] + '十' + (v % 10 ? D[v % 10] : '');
            }
            var h = Math.floor(n / 100), t = n % 100, out = '';
            if (h > 0) { out += D[h] + '百'; if (t > 0 && t < 10) out += '零'; }
            if (t > 0) {
                if (h > 0 && t < 20) out += '一十' + (t % 10 ? D[t % 10] : '');
                else out += tens(t);
            }
            return out || String(n);
        } catch (e) { return String(n); }
    }

    function _srcCn(k) { return SRC_CN[k] || String(k == null ? '' : k); }
    function _dayCn(day) {
        var n = Number(day);
        return (isFinite(n) && n > 0) ? '第 ' + Math.floor(n) + ' 日' : '日不可考';
    }
    // 转义：游戏全局 esc（global-utils）优先，缺席时自带同款兜底——面板不许把物品名拼成标签
    function _esc(s) {
        try { if (typeof window.esc === 'function') return window.esc(s); } catch (e) {}
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    // ---------- 册页定序（档位高者在前；编号按定序一次编定，筛选时不跳号，照稿） ----------
    function _buildOrder(items, book) {
        var ORDER = {};
        CATS.forEach(function (c) {
            var list = [];
            items.forEach(function (it, i) {
                if (_volOf(it) === c) list.push({ it: it, i: i, tier: _tierOf(it, book), vol: c });
            });
            list.sort(function (a, b) { return (b.tier - a.tier) || (a.i - b.i); });
            list.forEach(function (x, idx) { x.no = idx; });
            ORDER[c] = list;
        });
        return ORDER;
    }

    // ---------- 版式（照稿四色：玉青/灰玉/暗朱砂/赭金；全部 icx- 前缀防与游戏样式撞名） ----------
    function _styleBlock() {
        return '<style>'
            + '#icx-root{--icxj:#3a6157;--icxjb:#8fc0ab;--icxjs:#5d8378;--icxgj:#7d948a;--icxgd:#55685f;--icxfa:#3f4f48;--icxc:#8e332a;--icxoc:#a3823f;--icxob:#c9a45c;--icxink:#d8d3c0;--icxiks:#eae4d0;'
            + 'position:relative;color:var(--icxink);font:14px/1.75 "Songti SC","STSong","SimSun","宋体",serif;'
            + 'background:linear-gradient(180deg,#111c17,#0e1713);border:1px solid #25382f;border-radius:6px;padding:18px 20px 20px;overflow:hidden;text-align:left}'
            + '#icx-root::after{content:"谱";position:absolute;right:-40px;bottom:-90px;z-index:0;font-family:"KaiTi","楷体",serif;font-size:300px;line-height:1;color:rgba(58,97,87,.055);pointer-events:none;user-select:none}'
            + '#icx-root .icx-z{position:relative;z-index:1}'
            + '#icx-root .icx-mast{position:relative;display:flex;gap:20px;flex-wrap:wrap;align-items:stretch;background:linear-gradient(180deg,#111c17,#0e1713);border:1px solid #25382f;border-radius:6px;padding:16px 20px}'
            + '#icx-root .icx-titlebox{display:flex;flex-direction:column;align-items:center;gap:10px}'
            + '#icx-root .icx-vtitle{writing-mode:vertical-rl;font-family:"KaiTi","楷体",serif;font-size:34px;line-height:1;letter-spacing:9px;color:var(--icxiks);text-shadow:0 2px 12px rgba(0,0,0,.5)}'
            + '#icx-root .icx-seal{width:44px;height:44px;display:flex;align-items:center;justify-content:center;background:var(--icxc);color:#f2e8d4;font-family:"KaiTi","楷体",serif;font-size:25px;border-radius:6px;transform:rotate(-4deg);box-shadow:inset 0 0 0 3px var(--icxc),inset 0 0 0 4.5px rgba(242,232,212,.5),0 3px 12px rgba(0,0,0,.45)}'
            + '#icx-root .icx-vline{width:1px;align-self:stretch;background:linear-gradient(180deg,transparent,rgba(125,148,138,.4) 30%,rgba(125,148,138,.4) 70%,transparent)}'
            + '#icx-root .icx-midbox{flex:1;min-width:250px;display:flex;flex-direction:column;justify-content:center;gap:8px}'
            + '#icx-root .icx-subtitle{font-family:"KaiTi","楷体",serif;font-size:14px;color:var(--icxink);letter-spacing:1.5px}'
            + '#icx-root .icx-legend{font-size:12px;color:var(--icxgj);letter-spacing:1px}'
            + '#icx-root .icx-legend b{font-weight:400;color:var(--icxink)}'
            + '#icx-root .icx-legend i{font-style:normal;color:var(--icxfa);margin:0 6px}'
            + '#icx-root .icx-legend em{font-style:normal;color:var(--icxfa);margin-left:8px;font-size:11px}'
            + '#icx-root .icx-kv{font-size:11px;color:var(--icxfa);letter-spacing:2px}'
            + '#icx-root .icx-statbox{min-width:245px;display:flex;flex-direction:column;justify-content:center;gap:8px}'
            + '#icx-root .icx-bigstat{font-family:"KaiTi","楷体",serif;font-size:15.5px;color:var(--icxink);letter-spacing:1px}'
            + '#icx-root .icx-bigstat b{font-size:21px;color:var(--icxjb);font-weight:600;margin:0 2px}'
            + '#icx-root .icx-bigstat i{font-style:normal;color:var(--icxgd);font-size:13px;margin:0 2px}'
            + '#icx-root .icx-bar{height:6px;border:1px solid rgba(58,97,87,.5);border-radius:3px;background:rgba(58,97,87,.14);overflow:hidden}'
            + '#icx-root .icx-bar i{display:block;height:100%;border-radius:2px;background:linear-gradient(90deg,#2c4b43,var(--icxj) 70%,#4a7264)}'
            + '#icx-root .icx-achrow{display:flex;gap:12px;align-items:center;margin-top:2px}'
            + '#icx-root .icx-achseal{width:52px;height:52px;flex:none;display:grid;grid-template-columns:1fr 1fr;place-items:center;font-family:"KaiTi","楷体",serif;font-size:17px;line-height:1;color:var(--icxgd);border:1.5px solid rgba(125,148,138,.38);border-radius:6px;background:rgba(255,255,255,.015);transform:rotate(-3deg);padding:5px;gap:2px}'
            + '#icx-root .icx-achseal.icx-lit{color:#f2e8d4;background:var(--icxc);border-color:rgba(242,232,212,.4);box-shadow:inset 0 0 0 3px var(--icxc),inset 0 0 0 4px rgba(242,232,212,.35),0 3px 12px rgba(0,0,0,.45)}'
            + '#icx-root .icx-achtext{display:flex;flex-direction:column;gap:2px}'
            + '#icx-root .icx-acht{font-family:"KaiTi","楷体",serif;font-size:13px;color:var(--icxink);letter-spacing:1.5px}'
            + '#icx-root .icx-acht em{font-style:normal;font-size:10.5px;color:var(--icxoc);border:1px dashed rgba(163,130,63,.5);border-radius:3px;padding:1px 7px;margin-left:7px;letter-spacing:1px}'
            + '#icx-root .icx-acht em.icx-on{color:#f2e8d4;background:var(--icxc);border:1px solid rgba(242,232,212,.4)}'
            + '#icx-root .icx-achd{font-size:11.5px;color:var(--icxgj)}'
            + '#icx-root .icx-achm{font-size:11px;color:var(--icxfa)}'
            + '#icx-root .icx-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:20px 0 0;padding:0 4px;border-bottom:1px solid #25382f}'
            + '#icx-root .icx-tab{appearance:none;background:transparent;cursor:pointer;min-width:70px;border:1px solid #25382f;border-bottom:none;border-radius:6px 6px 0 0;padding:8px 14px 6px;text-align:center;color:var(--icxgd);font-family:"KaiTi","楷体",serif}'
            + '#icx-root .icx-tab b{display:block;font-size:19px;font-weight:600;line-height:1.25;letter-spacing:0}'
            + '#icx-root .icx-tab i{display:block;font-style:normal;font-size:10.5px;letter-spacing:1px;margin-top:2px;color:var(--icxfa)}'
            + '#icx-root .icx-tab:hover{color:var(--icxgj);border-color:var(--icxjs)}'
            + '#icx-root .icx-tab.icx-on{color:var(--icxiks);border-color:var(--icxjs);background:linear-gradient(180deg,rgba(58,97,87,.30),rgba(58,97,87,.10));box-shadow:inset 0 2px 0 var(--icxj)}'
            + '#icx-root .icx-tab.icx-on i{color:var(--icxjb)}'
            + '#icx-root .icx-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:13px 2px 15px}'
            + '#icx-root .icx-filters{display:flex;gap:7px;flex-wrap:wrap}'
            + '#icx-root .icx-fbtn{appearance:none;cursor:pointer;font-family:inherit;font-size:12px;letter-spacing:1px;color:var(--icxgj);background:transparent;border:1px solid #25382f;border-radius:3px;padding:4px 11px}'
            + '#icx-root .icx-fbtn b{font-weight:400;font-size:10.5px;opacity:.7;margin-left:4px}'
            + '#icx-root .icx-fbtn:hover{border-color:var(--icxjs);color:var(--icxink)}'
            + '#icx-root .icx-fbtn.icx-on{color:var(--icxiks);border-color:var(--icxjb);background:rgba(58,97,87,.26)}'
            + '#icx-root .icx-volnote{font-size:12px;color:var(--icxgj);letter-spacing:1px}'
            + '#icx-root .icx-volnote em{font-style:normal;color:var(--icxjb)}'
            + '#icx-root .icx-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(272px,1fr));gap:14px}'
            + '#icx-root .icx-card{position:relative;display:flex;flex-direction:column;gap:7px;background:#13201a;border:1px solid #25382f;border-radius:6px;padding:12px 14px 11px;animation:icxfadein .35s both;transition:border-color .15s,background .15s}'
            + '#icx-root .icx-card:hover{border-color:rgba(141,192,171,.4);background:#17241e}'
            + '#icx-root .icx-row1{display:flex;align-items:center;justify-content:space-between;gap:8px}'
            + '#icx-root .icx-cno{font-size:10px;color:var(--icxfa);letter-spacing:2px}'
            + '#icx-root .icx-badge{flex:none;font-size:10.5px;letter-spacing:1px;padding:2px 8px;border-radius:3px;border:1px solid}'
            + '#icx-root .icx-badge.icx-t3{color:#9ed0bc;border-color:rgba(143,192,171,.55);background:rgba(58,97,87,.32)}'
            + '#icx-root .icx-badge.icx-t2{color:#a8b8ad;border-color:rgba(125,148,138,.45);background:rgba(125,148,138,.12)}'
            + '#icx-root .icx-badge.icx-t1{color:#7d948a;border-color:rgba(125,148,138,.28);background:transparent}'
            + '#icx-root .icx-badge.icx-t0{color:var(--icxoc);border-style:dashed;border-color:rgba(163,130,63,.55);background:rgba(163,130,63,.06)}'
            + '#icx-root .icx-cname{font-family:"KaiTi","楷体",serif;font-size:17.5px;font-weight:600;color:var(--icxiks);letter-spacing:1px;line-height:1.3}'
            + '#icx-root .icx-cdesc{margin:0;font-size:12px;line-height:1.65;color:var(--icxgj)}'
            + '#icx-root .icx-cprov{font-size:11.5px;color:#9fb0a5;letter-spacing:.5px}'
            + '#icx-root .icx-cprov b{font-weight:600;color:var(--icxjb)}'
            + '#icx-root .icx-cfoot{margin-top:auto;padding-top:7px;border-top:1px solid rgba(125,148,138,.18);font-size:11.5px;color:var(--icxgj);letter-spacing:.5px;line-height:1.6}'
            + '#icx-root .icx-card.icx-t0{background:rgba(19,32,26,.32);border:1px dashed rgba(163,130,63,.5)}'
            + '#icx-root .icx-card.icx-t0:hover{border-color:rgba(201,164,92,.65);background:rgba(23,36,29,.4)}'
            + '#icx-root .icx-card.icx-t0 .icx-cname{color:#9aa79b;font-weight:400}'
            + '#icx-root .icx-card.icx-t0 .icx-cdesc{color:#4e5f56}'
            + '#icx-root .icx-card.icx-t0 .icx-cno{color:#39473f}'
            + '#icx-root .icx-card.icx-t0 .icx-cfoot{border-top-style:dashed;border-top-color:rgba(163,130,63,.4);color:var(--icxoc)}'
            + '#icx-root .icx-empty{border:1.5px dashed rgba(93,131,120,.4);border-radius:6px;padding:34px 18px;text-align:center;font-family:"KaiTi","楷体",serif;font-size:14.5px;letter-spacing:3px;color:var(--icxgd)}'
            + '#icx-root .icx-empty small{display:block;margin-top:8px;font-family:"Songti SC","STSong","SimSun","宋体",serif;font-size:11px;letter-spacing:1px;color:var(--icxfa)}'
            + '@keyframes icxfadein{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}'
            + '@media (prefers-reduced-motion:reduce){#icx-root *{animation:none!important;transition:none!important}}'
            + '</style>';
    }

    // ---------- 渲染件 ----------
    function _badge(t) {
        var m = TIER[t] || TIER[0];
        return '<span class="icx-badge ' + m.cls + '">' + (m.icon ? m.icon + ' ' : '') + m.name + '</span>';
    }

    function _cardHTML(entry, book) {
        var it = entry.it, t = (typeof entry.tier === 'number') ? entry.tier : _tierOf(it, book);
        var rec = _recOf(book, it.id);
        var mid = '';
        // 案底：设计稿 t3 卡还有一行「痕｜曾用✋·曾见👀」——动用痕真源（物品使用计数）本期没有，
        // 有溯源即用过的口径下这行无从取数，故不印；待使用计数真源另批再补。
        if (t >= 2 && rec && rec.counts) {
            var total = 0, parts = [];
            Object.keys(rec.counts).forEach(function (k) {
                var v = Number(rec.counts[k]) || 0;
                total += v;
                if (v > 0) parts.push(_esc(_srcCn(k)) + ' ×' + v);
            });
            mid += '<div class="icx-cprov">共得 <b>' + total + '</b>' + (parts.length ? '｜' + parts.join(' · ') : '') + '</div>';
        }
        var foot;
        if (t >= 2 && rec) {
            foot = '<div class="icx-cfoot">首得 ' + _dayCn(rec.day) + ' · ' + _esc(_srcCn(rec.src)) + '</div>';
        } else if (t === 1) {
            var s = _seenOf(it.id) || {};
            foot = '<div class="icx-cfoot">' + _esc(s.day || '') + ' · ' + _esc(s.where || '') + ' · ' + _esc(s.how || '') + '</div>';
        } else {
            // 案底：设计稿 t0 有「仅闻名于世」分支，吃假数据 fame 字段——真物品表无人配 fame（盘点 0 件），不接，统一名录在册
            foot = '<div class="icx-cfoot">名录在册 —— 未见其物</div>';
        }
        return '<article class="icx-card icx-t' + t + '">'
            + '<div class="icx-row1"><span class="icx-cno">' + (entry.vol || '') + '卷 · 其' + _cnOrdinal((Number(entry.no) || 0) + 1) + '</span>' + _badge(t) + '</div>'
            + '<div class="icx-cname">' + _esc(it.name) + '</div>'
            + '<p class="icx-cdesc">' + _esc(it.desc || '') + '</p>'
            + mid + foot
            + '</article>';
    }

    // 封页：总账 + 成就章（真源现算，不预发）
    function _headHTML(ORDER, book) {
        var total = 0, made = 0, coll = 0;
        CATS.forEach(function (c) {
            ORDER[c].forEach(function (x) { total++; if (x.tier === 3) made++; if (x.tier >= 1) coll++; });
        });
        var lit = total > 0 && made === total;
        var miss;
        if (lit) {
            miss = '五卷俱成，章已点亮。';
        } else {
            var sample = null, sampleVol = '';
            for (var ci = 0; ci < CATS.length && !sample; ci++) {
                var list = ORDER[CATS[ci]];
                for (var i = 0; i < list.length; i++) {
                    if (list[i].tier !== 3) { sample = list[i]; sampleVol = CATS[ci]; break; }
                }
            }
            miss = '尚缺 ' + (total - made) + ' 品未炼成' + (sample ? ' —— 如 ' + sampleVol + '卷·' + _esc(sample.it.name) : '');
        }
        return '<header class="icx-mast icx-z">'
            + '<div class="icx-titlebox"><div class="icx-vtitle">器谱</div><div class="icx-seal">谱</div></div>'
            + '<div class="icx-vline"></div>'
            + '<div class="icx-midbox">'
            + '<div class="icx-subtitle">拾遗录 —— 凡曾见、曾用、曾炼者，各归其档；未得之物，虚位以待。</div>'
            + '<div class="icx-legend">档序：<b>见过 👀</b><i>→</i><b>用过 ✋</b><i>→</i><b>炼成 ⚒</b><em>取最高档展示</em></div>'
            + '<div class="icx-legend">来历（首源·日期·次数）一律取自溯源登记簿，不凭空发；见识旁证（店有售 / 他人用过）真源未批——见过档本期虚位，案底待另批。</div>'
            + '<div class="icx-kv">五卷 ' + total + ' 品 · 功法与任务信物不入谱 · 走真源，不凭空发</div>'
            + '</div>'
            + '<div class="icx-statbox">'
            + '<div class="icx-bigstat">器谱拾遗 <b>' + coll + '</b><i>/</i><i>' + total + '</i> · 炼成 <b>' + made + '</b></div>'
            + '<div class="icx-bar"><i style="width:' + (total > 0 ? (coll / total * 100).toFixed(1) : '0') + '%"></i></div>'
            + '<div class="icx-achrow">'
            + '<div class="icx-achseal' + (lit ? ' icx-lit' : '') + '"><span>器</span><span>谱</span><span>通</span><span>家</span></div>'
            + '<div class="icx-achtext">'
            + '<div class="icx-acht">成就章 · 器谱通家 <em class="' + (lit ? 'icx-on' : '') + '">' + (lit ? '已成' : '未成') + '</em></div>'
            + '<div class="icx-achd">全卷炼成 → 成就『器谱通家』</div>'
            + '<div class="icx-achm">' + miss + '</div>'
            + '</div></div>'
            + '</div></header>';
    }

    function _tabsHTML(ORDER) {
        return '<nav class="icx-tabs icx-z" aria-label="分卷">' + CATS.map(function (c) {
            var list = ORDER[c];
            var coll = 0;
            list.forEach(function (x) { if (x.tier >= 1) coll++; });
            return '<button type="button" class="icx-tab' + (_state.cat === c ? ' icx-on' : '') + '" data-icx-cat="' + c + '" aria-pressed="' + (_state.cat === c) + '" title="' + c + '卷">'
                + '<b>' + c + '</b><i>' + c + '卷 ' + coll + '/' + list.length + '</i></button>';
        }).join('') + '</nav>';
    }

    function _filtersHTML(ORDER) {
        var n = function (t) {
            var k = 0;
            CATS.forEach(function (c) { ORDER[c].forEach(function (x) { if (x.tier >= t) k++; }); });
            return k;
        };
        var defs = [
            { t: 0, label: '全部' },
            { t: 1, label: '见过 👀' },
            { t: 2, label: '用过 ✋' },
            { t: 3, label: '炼成 ⚒' }
        ];
        return '<div class="icx-filters" role="group" aria-label="档位筛选">' + defs.map(function (d) {
            return '<button type="button" class="icx-fbtn' + (_state.tier === d.t ? ' icx-on' : '') + '" data-icx-tier="' + d.t + '" aria-pressed="' + (_state.tier === d.t) + '">'
                + d.label + '<b>' + (d.t === 0 ? n(0) : n(d.t)) + '</b></button>';
        }).join('') + '</div>';
    }

    function _bodyHTML(ORDER, book) {
        var c = _state.cat, list = ORDER[c] || [];
        var total = list.length, coll = 0, used = 0, made = 0;
        list.forEach(function (x) { if (x.tier >= 1) coll++; if (x.tier >= 2) used++; if (x.tier === 3) made++; });
        var shown = list.filter(function (x) { return _state.tier === 0 || x.tier >= _state.tier; });
        var grid;
        if (shown.length) {
            grid = shown.map(function (x) { return _cardHTML(x, book); }).join('');
        } else {
            var tn = (TIER[_state.tier] || TIER[0]).name;
            var sub = (_state.tier === 1)
                ? '见识旁证（店有售 / 他人用过）真源未批 —— 见过档本期虚位，案底待另批'
                : '虚位以待 —— 待真源登记，不凭空发';
            grid = '<div class="icx-empty">' + c + '卷 · ' + tn + '档尚无记录<small>' + sub + '</small></div>';
        }
        return '<div class="icx-toolbar icx-z">' + _filtersHTML(ORDER)
            + '<div class="icx-volnote">' + c + '卷 · 凡' + _cnOrdinal(total) + '品 ｜ 拾遗 <em>' + coll + '</em> · 用过 <em>' + used + '</em> · 炼成 <em>' + made + '</em></div>'
            + '</div>'
            + '<main class="icx-grid icx-z">' + grid + '</main>';
    }

    function _renderAll(items, book) {
        var ORDER = _buildOrder(items, book);
        if (CATS.indexOf(_state.cat) < 0) _state.cat = '丹';
        return _headHTML(ORDER, book) + _tabsHTML(ORDER) + _bodyHTML(ORDER, book);
    }

    function _emptyOpenHTML() {
        return '<div class="icx-empty icx-z" style="margin-top:8px">器谱未开'
            + '<small>溯源登记簿或物品总表尚未就位——翻开此册也无从记账。器物到手之日，谱页自会落墨。</small></div>';
    }

    // ---------- 开面板（栈式模态优先，通用壳兜底；委托监听只挂一次，重画不重挂） ----------
    function _emit(bodyHtml) {
        try {
            if (window.XianXia && window.XianXia.Modal && typeof window.XianXia.Modal.open === 'function') {
                return window.XianXia.Modal.open({ id: 'xianxia-item-codex-overlay', title: '器谱 · 拾遗录', html: bodyHtml, width: 'max-w-4xl' });
            }
        } catch (e) {
            console.warn('[静默失败] js/items.js · openItemCollection：栈式模态不可用，退回通用壳', e && e.message);
        }
        try {
            if (typeof window.showModal === 'function') {
                window.showModal('器谱 · 拾遗录', bodyHtml);
                try { return { el: document.getElementById('xianxia-modal-overlay') }; } catch (e2) { return null; }
            }
        } catch (e3) {
            console.warn('[静默失败] js/items.js · openItemCollection：面板未能打开', e3 && e3.message);
        }
        return null;
    }

    function _bindDelegation(handle, items, book) {
        if (!handle || !handle.el || typeof handle.el.querySelector !== 'function') return;
        var root = null;
        try { root = handle.el.querySelector('#icx-root'); } catch (e) { root = null; }
        if (!root || typeof root.addEventListener !== 'function') return;
        root.addEventListener('click', function (ev) {
            try {
                var t = ev.target;
                while (t && t !== root && !(t.getAttribute && (t.getAttribute('data-icx-cat') != null || t.getAttribute('data-icx-tier') != null))) {
                    t = t.parentNode;
                }
                if (!t || t === root || !t.getAttribute) return;
                var cat = t.getAttribute('data-icx-cat');
                var tier = t.getAttribute('data-icx-tier');
                var dirty = false;
                if (cat != null && CATS.indexOf(cat) >= 0) { _state.cat = cat; dirty = true; }
                else if (tier != null) { var tv = Number(tier); _state.tier = isFinite(tv) ? tv : 0; dirty = true; }
                if (dirty) _rerender(handle, items, book);
            } catch (e) {
                console.warn('[静默失败] js/items.js · 器谱翻页：切换卷/档失败', e && e.message);
            }
        });
    }

    function _rerender(handle, items, book) {
        try {
            var root = handle.el.querySelector('#icx-root');
            if (root) root.innerHTML = _renderAll(items, book);
        } catch (e) {
            console.warn('[静默失败] js/items.js · 器谱重画：卷/档已记下，画面未跟上', e && e.message);
        }
    }

    function openItemCodex() {
        var book = _provenanceBook();
        var items = _readItems();
        var inVol = 0;
        items.forEach(function (it) { if (_volOf(it)) inVol++; });
        // 溯源簿或物品表缺席 → 「器谱未开」空态（口径照批），绝不炸主流程
        if (!book || !items.length || !inVol) {
            _emit(_styleBlock() + '<div id="icx-root">' + _emptyOpenHTML() + '</div>');
            return true;
        }
        var handle = _emit(_styleBlock() + '<div id="icx-root">' + _renderAll(items, book) + '</div>');
        // 委托监听：emit 成功的句柄上挂一次；兜底壳（无句柄）时退化为纯查看（卷/档切换无效不炸）
        try {
            if (handle && handle.el) _bindDelegation(handle, items, book);
        } catch (e) {
            console.warn('[静默失败] js/items.js · openItemCollection：翻页监听未挂上（面板可见）', e && e.message);
        }
        return true;
    }

    // ---------- 导出 ----------
    window.ItemCodex = { open: openItemCodex };
    window.openItemCollection = function () {
        try {
            return openItemCodex();
        } catch (e) {
            console.warn('[静默失败] js/items.js · openItemCollection：器谱面板打开失败（主流程不受影响）', e && e.message);
            return false;
        }
    };
})();
