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
