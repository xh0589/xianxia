// ==================== location-system.js - 城市/建筑系统 ====================
// 管理城市进入和建筑交互

// ============ 建筑类型定义 ============
const BUILDING_TYPES = {
    SHOP: { id: 'shop', name: '坊市', icon: '💰', color: 'text-yellow-400', category: 'commercial' },
    MEDICINE_SHOP: { id: 'medicine_shop', name: '药铺', icon: '💊', color: 'text-green-400', category: 'commercial' },
    TALISMAN_SHOP: { id: 'talisman_shop', name: '符箓店', icon: '📜', color: 'text-purple-400', category: 'commercial' },
    WEAPON_SHOP: { id: 'weapon_shop', name: '兵器铺', icon: '⚔️', color: 'text-red-400', category: 'commercial' },
    ARMOR_SHOP: { id: 'armor_shop', name: '防具铺', icon: '🛡️', color: 'text-blue-400', category: 'commercial' },
    ART_SHOP: { id: 'art_shop', name: '功法阁', icon: '📚', color: 'text-indigo-400', category: 'commercial' },
    BEAST_SHOP: { id: 'beast_shop', name: '灵兽坊', icon: '🐾', color: 'text-amber-400', category: 'commercial' },
    ALCHEMY: { id: 'alchemy', name: '炼丹房', icon: '⚗️', color: 'text-lime-400', category: 'crafting' },
    FORGING: { id: 'forging', name: '铁匠铺', icon: '⚒️', color: 'text-orange-400', category: 'crafting' },
    ENCHANT_SHOP: { id: 'enchant_shop', name: '附魔店', icon: '✨', color: 'text-pink-400', category: 'crafting' },
    QUEST: { id: 'quest', name: '任务堂', icon: '📜', color: 'text-blue-400', category: 'quest' },
    INN: { id: 'inn', name: '客栈', icon: '🏨', color: 'text-purple-400', category: 'rest' },
    TRAINING: { id: 'training', name: '演武场', icon: '⚔️', color: 'text-red-400', category: 'combat' },
    ARENA: { id: 'arena', name: '竞技场', icon: '🏟️', color: 'text-red-500', category: 'combat' },
    TELEPORT: { id: 'teleport', name: '传送阵', icon: '🌀', color: 'text-cyan-400', category: 'travel' },
    TAVERN: { id: 'tavern', name: '酒楼', icon: '🍶', color: 'text-amber-400', category: 'social' },
    TEA_HOUSE: { id: 'tea_house', name: '茶馆', icon: '🍵', color: 'text-emerald-400', category: 'social' },
    GUILD_HALL: { id: 'guild_hall', name: '公会大厅', icon: '🏛️', color: 'text-yellow-300', category: 'social' },
    CULTIVATION: { id: 'cultivation', name: '洞府', icon: '🧘', color: 'text-indigo-400', category: 'cultivation' },
    LIBRARY: { id: 'library', name: '藏经阁', icon: '📖', color: 'text-cyan-300', category: 'cultivation' },
    SPRING: { id: 'spring', name: '灵泉', icon: '⛲', color: 'text-teal-400', category: 'rest' },
    TEMPLE: { id: 'temple', name: '寺庙', icon: '🛕', color: 'text-yellow-600', category: 'social' },
    MARKET: { id: 'market', name: '黑市', icon: '🌙', color: 'text-gray-400', category: 'commercial' },
    GATHERING: { id: 'gathering', name: '药园', icon: '🌿', color: 'text-green-500', category: 'gather' },
    MINING: { id: 'mining', name: '矿脉', icon: '⛏️', color: 'text-stone-400', category: 'gather' },
    // v9.0 情境交互设施
    HOUSEHOLD_REGISTRY: { id: 'household_registry', name: '户籍司', icon: '📋', color: 'text-amber-300', category: 'social' },
    FIRE_DEPARTMENT: { id: 'fire_department', name: '消防司', icon: '🔥', color: 'text-red-400', category: 'social' },
    BOUNTY_HALL: { id: 'bounty_hall', name: '悬赏楼', icon: '🎯', color: 'text-yellow-400', category: 'quest' }
};


// ============ 城市数据（v6.0 增强版 - 16城市差异化） ============
const cityData = {
    '帝都·长安': {
        id: 'chang_an',
        region: '中州',
        buildings: ['shop', 'weapon_shop', 'armor_shop', 'medicine_shop', 'talisman_shop', 'art_shop', 'beast_shop', 'alchemy', 'forging', 'enchant_shop', 'quest', 'inn', 'training', 'teleport', 'tavern', 'temple', 'tea_house', 'library', 'arena', 'guild_hall', 'cultivation', 'spring', 'gathering', 'mining', 'household_registry', 'fire_department', 'bounty_hall', 'tax_bureau', 'granary', 'court', 'exorcist_bureau', 'medical_clinic', 'money_house', 'contract_hall', 'escort_office', 'charity_hall', 'arena_stage', 'observatory', 'stele_forest', 'oddity_museum', 'pawn_shop', 'auction_house', 'black_market', 'garden_villa', 'works_bureau', 'salt_iron_office'],
        desc: '九州帝都，天下繁华汇聚。皇宫金碧辉煌，天牢深不可测。',
        accessLevel: 'all',
        specialFeatures: ['皇宫', '天牢', '皇家拍卖行'],
        specialties: ['皇家贡品', '御用丹药', '宫廷秘法'],
        specialNPCs: ['国师·元辰子', '锦衣卫指挥使·慕容铁'],
        events: ['皇家狩猎', '科举大典', '中秋灯会'],
        priceModifier: { buy: 1.2, sell: 0.8 }, // 帝都物价高
        bonus: { reputation_gain: 1.2 }
    },
    '洛水城': {
        id: 'luoshui',
        region: '中州',
        buildings: ['shop', 'art_shop', 'tea_house', 'library', 'inn', 'tavern', 'quest', 'training', 'teleport', 'medicine_shop', 'temple', 'gathering', 'household_registry', 'fire_department', 'bounty_hall', 'tax_bureau', 'granary', 'court', 'exorcist_bureau', 'medical_clinic', 'money_house', 'contract_hall', 'escort_office', 'charity_hall', 'arena_stage', 'observatory', 'stele_forest', 'oddity_museum', 'pawn_shop', 'auction_house', 'black_market', 'garden_villa', 'works_bureau', 'salt_iron_office'],
        desc: '洛水之畔的商贸重镇，画舫笙歌，文人雅士汇聚之地。',
        accessLevel: 'all',
        specialFeatures: ['画舫', '水榭', '诗会'],
        specialties: ['洛水锦鲤', '文房四宝', '字画'],
        specialNPCs: ['画圣·吴道子', '诗仙·李太白'],
        events: ['洛水诗会', '花灯节'],
        priceModifier: { buy: 0.9, sell: 1.1 },
        bonus: { charm: 1.1, social: 1.2 }
    },
    '太虚山': {
        id: 'taixu_mountain',
        region: '中州',
        buildings: ['cultivation', 'library', 'temple', 'alchemy', 'spring', 'training', 'teleport', 'quest', 'medicine_shop', 'talisman_shop', 'art_shop', 'household_registry', 'fire_department', 'bounty_hall', 'tax_bureau', 'granary', 'court', 'exorcist_bureau', 'medical_clinic', 'money_house', 'contract_hall', 'escort_office', 'charity_hall', 'arena_stage', 'observatory', 'stele_forest', 'oddity_museum', 'pawn_shop', 'auction_house', 'black_market', 'garden_villa', 'works_bureau', 'salt_iron_office'],
        desc: '仙山福地，传闻有上古仙人遗迹。观星台可观测天象。',
        accessLevel: 'all',
        specialFeatures: ['观星台', '悟道碑', '试炼塔'],
        specialties: ['星辉石', '悟道茶', '天机符'],
        specialNPCs: ['观星老人·天机子', '守塔人·铁剑'],
        events: ['天降星辉', '试炼塔开启'],
        priceModifier: { buy: 1.0, sell: 1.0 },
        bonus: { cultivation: 1.15, enlightenment: 1.2 }
    },
    '青木城': {
        id: 'qingmu_city',
        region: '东荒',
        buildings: ['shop', 'medicine_shop', 'alchemy', 'gathering', 'quest', 'inn', 'teleport', 'training', 'tea_house', 'talisman_shop', 'library', 'beast_shop', 'household_registry', 'fire_department', 'bounty_hall', 'tax_bureau', 'granary', 'court', 'exorcist_bureau', 'medical_clinic', 'money_house', 'contract_hall', 'escort_office', 'charity_hall', 'arena_stage', 'observatory', 'stele_forest', 'oddity_museum', 'pawn_shop', 'auction_house', 'black_market', 'garden_villa', 'works_bureau', 'salt_iron_office'],
        desc: '东荒门户，木灵之气浓郁。灵药园中奇花异草遍地。',
        accessLevel: 'all',
        specialFeatures: ['灵药园', '百草堂', '木灵塔'],
        specialties: ['千年灵芝', '青木精华', '灵木种子'],
        specialNPCs: ['药王·孙思邈', '木灵仙子·青瑶'],
        events: ['百草大会', '灵木结果'],
        priceModifier: { buy: 0.85, sell: 1.15 },
        bonus: { herb: 1.3, wood: 1.2 }
    },
    '蓬莱仙岛': {
        id: 'penglai_island',
        region: '东荒',
        buildings: ['cultivation', 'spring', 'alchemy', 'temple', 'teleport', 'library', 'medicine_shop', 'quest', 'talisman_shop', 'art_shop', 'household_registry', 'fire_department', 'bounty_hall', 'tax_bureau', 'granary', 'court', 'exorcist_bureau', 'medical_clinic', 'money_house', 'contract_hall', 'escort_office', 'charity_hall', 'arena_stage', 'observatory', 'stele_forest', 'oddity_museum', 'pawn_shop', 'auction_house', 'black_market', 'garden_villa', 'works_bureau', 'salt_iron_office'],
        desc: '海上仙山，云雾缭绕，传闻有仙人在此渡劫飞升。',
        accessLevel: '筑基以上',
        specialFeatures: ['渡劫台', '仙雾阁', '灵龟池'],
        specialties: ['仙露', '珊瑚玉', '蓬莱仙芝'],
        specialNPCs: ['蓬莱仙翁·东方朔', '鲛人公主·明珠'],
        events: ['海市蜃楼', '仙缘大会', '渡劫观摩'],
        priceModifier: { buy: 1.3, sell: 0.7 },
        bonus: { breakthrough: 1.1, water: 1.2 }
    },
    '东海龙宫': {
        id: 'dragon_palace',
        region: '东荒',
        buildings: ['shop', 'forging', 'cultivation', 'training', 'weapon_shop', 'armor_shop', 'alchemy', 'spring', 'teleport', 'quest', 'medicine_shop', 'household_registry', 'fire_department', 'bounty_hall', 'tax_bureau', 'granary', 'court', 'exorcist_bureau', 'medical_clinic', 'money_house', 'contract_hall', 'escort_office', 'charity_hall', 'arena_stage', 'observatory', 'stele_forest', 'oddity_museum', 'pawn_shop', 'auction_house', 'black_market', 'garden_villa', 'works_bureau', 'salt_iron_office'],
        desc: '深海龙宫，珊瑚为柱，明珠为灯，珍宝无数。',
        accessLevel: '金丹以上',
        specialFeatures: ['龙宫宝库', '潮汐殿', '龙魂锻体'],
        specialties: ['龙鳞', '避水珠', '珊瑚仙芝'],
        specialNPCs: ['龙王·敖广', '龙女·敖灵儿'],
        events: ['龙宫宴会', '潮汐之力'],
        priceModifier: { buy: 1.1, sell: 0.9 },
        bonus: { water: 1.3, defense: 1.15 }
    },
    '炎城': {
        id: 'yan_city',
        region: '南疆',
        buildings: ['shop', 'forging', 'weapon_shop', 'mining', 'enchant_shop', 'training', 'quest', 'tavern', 'inn', 'teleport', 'armor_shop', 'arena', 'household_registry', 'fire_department', 'bounty_hall', 'tax_bureau', 'granary', 'court', 'exorcist_bureau', 'medical_clinic', 'money_house', 'contract_hall', 'escort_office', 'charity_hall', 'arena_stage', 'observatory', 'stele_forest', 'oddity_museum', 'pawn_shop', 'auction_house', 'black_market', 'garden_villa', 'works_bureau', 'salt_iron_office'],
        desc: '建于火山之巅的钢铁之城，熔岩为河，火焰为灯。',
        accessLevel: 'all',
        specialFeatures: ['火山洞穴', '熔岩池', '炎帝像'],
        specialties: ['火晶', '熔岩铁', '炎阳玉'],
        specialNPCs: ['炎帝传人·烈火', '铸剑大师·欧冶子'],
        events: ['火山喷发', '铸剑大会'],
        priceModifier: { buy: 0.95, sell: 1.05 },
        bonus: { fire: 1.3, forging: 1.2 }
    },
    '万毒谷': {
        id: 'poison_valley',
        region: '南疆',
        buildings: ['alchemy', 'medicine_shop', 'market', 'cultivation', 'temple', 'quest', 'talisman_shop', 'gathering', 'inn', 'training', 'household_registry', 'fire_department', 'bounty_hall', 'tax_bureau', 'granary', 'court', 'exorcist_bureau', 'medical_clinic', 'money_house', 'contract_hall', 'escort_office', 'charity_hall', 'arena_stage', 'observatory', 'stele_forest', 'oddity_museum', 'pawn_shop', 'auction_house', 'black_market', 'garden_villa', 'works_bureau', 'salt_iron_office'],
        desc: '毒瘴弥漫的神秘山谷，万毒门的宗门所在地。',
        accessLevel: '炼气三层以上',
        specialFeatures: ['毒王洞', '百草园', '毒经阁'],
        specialties: ['毒王草', '解毒丹', '蛊虫'],
        specialNPCs: ['毒王·蝎心', '巫医·蓝月'],
        events: ['毒王试炼', '百毒大会'],
        priceModifier: { buy: 1.0, sell: 1.0 },
        bonus: { poison: 1.4, alchemy: 1.15 }
    },
    '金城': {
        id: 'jin_city',
        region: '西漠',
        buildings: ['shop', 'mining', 'weapon_shop', 'market', 'inn', 'temple', 'teleport', 'forging', 'quest', 'armor_shop', 'guild_hall', 'tavern', 'household_registry', 'fire_department', 'bounty_hall', 'tax_bureau', 'granary', 'court', 'exorcist_bureau', 'medical_clinic', 'money_house', 'contract_hall', 'escort_office', 'charity_hall', 'arena_stage', 'observatory', 'stele_forest', 'oddity_museum', 'pawn_shop', 'auction_house', 'black_market', 'garden_villa', 'works_bureau', 'salt_iron_office'],
        desc: '沙漠中的黄金之城，以灵石矿脉闻名于世。',
        accessLevel: 'all',
        specialFeatures: ['黄金宫', '矿脉', '佛窟'],
        specialties: ['金沙', '灵石', '佛经'],
        specialNPCs: ['金城城主·钱万贯', '苦行僧·了空'],
        events: ['灵石拍卖', '佛诞日'],
        priceModifier: { buy: 0.9, sell: 1.2 },
        bonus: { copper: 1.3, mining: 1.2 }
    },
    '大漠孤城': {
        id: 'desert_fort',
        region: '西漠',
        buildings: ['quest', 'training', 'inn', 'tavern', 'market', 'weapon_shop', 'mining', 'shop', 'arena', 'teleport', 'household_registry', 'fire_department', 'bounty_hall', 'tax_bureau', 'granary', 'court', 'exorcist_bureau', 'medical_clinic', 'money_house', 'contract_hall', 'escort_office', 'charity_hall', 'arena_stage', 'observatory', 'stele_forest', 'oddity_museum', 'pawn_shop', 'auction_house', 'black_market', 'garden_villa', 'works_bureau', 'salt_iron_office'],
        desc: '大漠中的军事要塞，抵御妖兽的前线阵地。',
        accessLevel: 'all',
        specialFeatures: ['地下集市', '烽火台', '遗迹入口'],
        specialties: ['沙漠玫瑰', '兽骨饰品', '古佛舍利'],
        specialNPCs: ['守将·铁壁', '探险家·斯坦因'],
        events: ['沙暴来袭', '遗迹开启'],
        priceModifier: { buy: 1.1, sell: 0.9 },
        bonus: { combat: 1.15, loot: 1.1 }
    },
    '冰原城': {
        id: 'ice_city',
        region: '北冥',
        buildings: ['shop', 'forging', 'training', 'inn', 'teleport', 'weapon_shop', 'armor_shop', 'spring', 'quest', 'medicine_shop', 'enchant_shop', 'household_registry', 'fire_department', 'bounty_hall', 'tax_bureau', 'granary', 'court', 'exorcist_bureau', 'medical_clinic', 'money_house', 'contract_hall', 'escort_office', 'charity_hall', 'arena_stage', 'observatory', 'stele_forest', 'oddity_museum', 'pawn_shop', 'auction_house', 'black_market', 'garden_villa', 'works_bureau', 'salt_iron_office'],
        desc: '极寒之地的避难所，冰晶筑成的城池。',
        accessLevel: 'all',
        specialFeatures: ['冰晶塔', '寒冰洞', '冰魄锻炉'],
        specialties: ['冰晶', '寒铁', '雪莲'],
        specialNPCs: ['冰皇·寒霜', '雪狼王·白牙'],
        events: ['极光之夜', '冰雕大赛'],
        priceModifier: { buy: 1.0, sell: 1.0 },
        bonus: { ice: 1.3, forging: 1.1 }
    },
    '极寒之地': {
        id: 'extreme_cold',
        region: '北冥',
        buildings: ['cultivation', 'spring', 'training', 'library', 'alchemy', 'temple', 'quest', 'medicine_shop', 'talisman_shop', 'art_shop', 'household_registry', 'fire_department', 'bounty_hall', 'tax_bureau', 'granary', 'court', 'exorcist_bureau', 'medical_clinic', 'money_house', 'contract_hall', 'escort_office', 'charity_hall', 'arena_stage', 'observatory', 'stele_forest', 'oddity_museum', 'pawn_shop', 'auction_house', 'black_market', 'garden_villa', 'works_bureau', 'salt_iron_office'],
        desc: '冰封万里的修炼圣地，天地灵气在此凝固。',
        accessLevel: '筑基以上',
        specialFeatures: ['冰宫', '寒潭', '冰灵淬体'],
        specialties: ['万年寒冰', '冰灵珠', '雪魄'],
        specialNPCs: ['冰灵·雪姬', '苦修士·冰心'],
        events: ['冰河解封', '寒潮来袭'],
        priceModifier: { buy: 1.2, sell: 0.8 },
        bonus: { cultivation: 1.2, ice: 1.4 }
    },
    '剑阁': {
        id: 'sword_pavilion',
        region: '蜀地',
        buildings: ['training', 'forging', 'weapon_shop', 'art_shop', 'cultivation', 'quest', 'shop', 'arena', 'library', 'enchant_shop', 'teleport', 'household_registry', 'fire_department', 'bounty_hall', 'tax_bureau', 'granary', 'court', 'exorcist_bureau', 'medical_clinic', 'money_house', 'contract_hall', 'escort_office', 'charity_hall', 'arena_stage', 'observatory', 'stele_forest', 'oddity_museum', 'pawn_shop', 'auction_house', 'black_market', 'garden_villa', 'works_bureau', 'salt_iron_office'],
        desc: '剑修圣地，天下名剑尽藏于此。剑气纵横三万里。',
        accessLevel: 'all',
        specialFeatures: ['剑冢', '藏剑楼', '剑意碑林'],
        specialties: ['名剑仿品', '剑谱', '剑意石'],
        specialNPCs: ['剑圣·独孤', '铸剑师·干将'],
        events: ['剑冢开启', '论剑大会'],
        priceModifier: { buy: 1.0, sell: 1.0 },
        bonus: { sword: 1.3, cultivation: 1.1 }
    },
    '青城山': {
        id: 'qingcheng_mountain',
        region: '蜀地',
        buildings: ['temple', 'cultivation', 'alchemy', 'spring', 'teleport', 'talisman_shop', 'library', 'medicine_shop', 'quest', 'tea_house', 'art_shop', 'household_registry', 'fire_department', 'bounty_hall', 'tax_bureau', 'granary', 'court', 'exorcist_bureau', 'medical_clinic', 'money_house', 'contract_hall', 'escort_office', 'charity_hall', 'arena_stage', 'observatory', 'stele_forest', 'oddity_museum', 'pawn_shop', 'auction_house', 'black_market', 'garden_villa', 'works_bureau', 'salt_iron_office'],
        desc: '道教名山，清静修道之所。天然阵法护佑山门。',
        accessLevel: 'all',
        specialFeatures: ['天然阵法', '道观', '天师府'],
        specialties: ['天师符', '道藏', '清心茶'],
        specialNPCs: ['天师·张道陵', '青城道长·清风'],
        events: ['天师赐福', '道门论道'],
        priceModifier: { buy: 0.9, sell: 1.1 },
        bonus: { talisman: 1.2, cultivation: 1.1 }
    },
    '碧落仙宫': {
        id: 'bilo_palace',
        region: '东南海域',
        buildings: ['cultivation', 'teleport', 'temple', 'spring', 'alchemy', 'library', 'medicine_shop', 'art_shop', 'talisman_shop', 'quest', 'household_registry', 'fire_department', 'bounty_hall', 'tax_bureau', 'granary', 'court', 'exorcist_bureau', 'medical_clinic', 'money_house', 'contract_hall', 'escort_office', 'charity_hall', 'arena_stage', 'observatory', 'stele_forest', 'oddity_museum', 'pawn_shop', 'auction_house', 'black_market', 'garden_villa', 'works_bureau', 'salt_iron_office'],
        desc: '海中仙宫，神秘莫测。碧波万顷中的修行圣地。',
        accessLevel: '金丹以上',
        specialFeatures: ['仙宫试炼', '碧波潭', '珊瑚林'],
        specialties: ['碧波玉', '仙宫丹', '海神秘典'],
        specialNPCs: ['碧落仙子·云裳', '海神使·波塞冬'],
        events: ['仙宫开启', '海神祭'],
        priceModifier: { buy: 1.3, sell: 0.7 },
        bonus: { water: 1.2, enlightenment: 1.15 }
    },
    '鲛人镇': {
        id: 'mermaid_town',
        region: '东南海域',
        buildings: ['shop', 'inn', 'quest', 'tavern', 'teleport', 'medicine_shop', 'tea_house', 'gathering', 'beast_shop', 'market', 'training', 'household_registry', 'fire_department', 'bounty_hall', 'tax_bureau', 'granary', 'court', 'exorcist_bureau', 'medical_clinic', 'money_house', 'contract_hall', 'escort_office', 'charity_hall', 'arena_stage', 'observatory', 'stele_forest', 'oddity_museum', 'pawn_shop', 'auction_house', 'black_market', 'garden_villa', 'works_bureau', 'salt_iron_office'],
        desc: '鲛人与人类共居的港口小镇，珍珠闻名遐迩。',
        accessLevel: 'all',
        specialFeatures: ['珍珠市场', '渔村码头', '灯塔'],
        specialties: ['珍珠', '珊瑚', '海味'],
        specialNPCs: ['鲛人长老·蓝鳞', '渔王·老船头'],
        events: ['珍珠节', '渔获祭'],
        priceModifier: { buy: 0.85, sell: 1.15 },
        bonus: { fishing: 1.3, trade: 1.15 }
    }
};

// ============ 当前状态 ============
let currentLocation = null;       // 当前所在城市
let visitedCities = new Set();    // 已访问城市
let buildingCooldowns = {};       // 旧存档兼容字段；v12.2 起不再作为玩法冷却
let buildingClickGuards = {};     // 仅用于防止短时间重复点击，不持久化、不影响游戏时间

// ============ 初始化城市系统 ============
function initLocationSystem() {
    const saved = localStorage.getItem('xianxia_location_data');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            visitedCities = new Set(data.visitedCities || []);
            // v12.2：旧的现实时间建筑冷却不再恢复，避免读档后受现实时间影响。
            buildingCooldowns = {};
            // B5：恢复当前城市
            if (data.currentLocation) {
                currentLocation = data.currentLocation;
                if (window.currentCharData) window.currentCharData.location = data.currentLocation;
            }
        } catch (e) {
            console.error('加载城市数据失败:', e);
        }
    }
}

// ============ 保存城市数据 ============
function saveLocationData() {
    localStorage.setItem('xianxia_location_data', JSON.stringify({
        visitedCities: Array.from(visitedCities),
        buildingCooldowns: {},
        currentLocation: currentLocation || null
    }));
}

// ============ 进入城市 ============
function enterCity(cityName) {
    // 标准化城市名（去除空格，兼容HTML中的"帝都 · 长安"→cityData中的"帝都·长安"）
    var normalizedName = cityName.replace(/\s+/g, '');
    var city = cityData[normalizedName] || cityData[cityName];
    if (!city) {
        showMessage('找不到城市：' + cityName, 'error');
        return false;
    }
    
    // 检查访问权限
    if (city.accessLevel !== 'all') {
        const playerRealm = window.currentCharData?.realm || '炼气';
        const playerLayer = window.currentCharData?.layer || 1;
        
        if (!checkAccessRequirement(city.accessLevel, playerRealm, playerLayer)) {
            showMessage(`您的境界不足，无法进入 ${cityName}（需要：${city.accessLevel}）`, 'error');
            return false;
        }
    }
    
    // 记录访问
    visitedCities.add(cityName);
    currentLocation = cityName;
    // P0-2: 同步更新玩家角色位置，避免社交条件读取分裂
    if (window.currentCharData) {
        window.currentCharData.location = cityName;
    }
    // F-1.2 重构：补全 location:visited 事件 emit。quest-system.js 事件桥监听此事件推进 visit objective
    if (window.EventBus && typeof window.EventBus.emit === 'function') {
        try { window.EventBus.emit('location:visited', { locationId: cityName, locationName: cityName }); } catch (e) {}
    }
    saveLocationData();
    
    showMessage(`来到了 ${cityName}：${city.desc}`, 'info');
    // v7.1 P0-2: 地点过渡描写
    if (typeof window.showLocationTransition === 'function') {
        try { window.showLocationTransition(cityName); } catch (e) {}
    }
    
    // 更新UI
    renderCityBuildings(cityName);
    
    // 可能触发随机事件
    if (window.eventSystem && Math.random() < 0.15) {
        setTimeout(() => window.eventSystem.triggerRandomEvent(), 1000);
    }
    
    return true;
}

// ============ 检查访问要求 ============
function checkAccessRequirement(requirement, playerRealm, playerLayer) {
    if (requirement === 'all') return true;
    
    const realmOrder = ['炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'];
    const [realmName, layerStr] = requirement.split(' ');
    const requiredLayer = layerStr ? parseInt(layerStr.replace('层', '')) : 1;
    
    const playerRealmIndex = realmOrder.indexOf(playerRealm);
    const requiredRealmIndex = realmOrder.indexOf(realmName);
    
    if (playerRealmIndex < requiredRealmIndex) return false;
    if (playerRealmIndex === requiredRealmIndex && playerLayer < requiredLayer) return false;
    
    return true;
}

// ============ 渲染城市建筑列表 ============
function renderCityBuildings(cityName) {
    if (!cityName) { console.warn('[renderCityBuildings] cityName is empty, skip'); return; }
    var normalizedName = cityName.replace(/\s+/g, '');
    const city = cityData[normalizedName] || cityData[cityName];
    if (!city) return;

    // ===== 关键：先确保 cityPanel 存在（及其占位 DOM 节点），再更新文本 =====
    // 修复 BUG-2：原顺序在「先更新 textContent → 再 createCityPanel」时，
    // createCityPanel 会用模板 innerHTML 重建 #city-current-location-display 节点，
    // 导致 line 359-363 的更新被覆盖（首次进入城市看到占位符）。
    let cityPanel = document.getElementById('city-panel');
    if (!cityPanel) {
        cityPanel = createCityPanel();
        const mapPanel = document.getElementById('panel-map');
        if (mapPanel) {
            mapPanel.appendChild(cityPanel);
        } else {
            const gameInterface = document.getElementById('game-world') || document.querySelector('main') || document.body;
            if (gameInterface) {
                gameInterface.appendChild(cityPanel);
            }
        }
    }

    // 更新当前位置显示
    const locationDisplay = document.getElementById('current-location-display');
    if (locationDisplay) locationDisplay.textContent = cityName;
    const cityLocationDisplay = document.getElementById('city-current-location-display');
    if (cityLocationDisplay) {
        cityLocationDisplay.innerHTML = '<span class="text-yellow-400 font-bold text-lg">📍 ' + cityName + '</span>' +
            (city.region ? ' <span class="text-gray-500 text-sm">· ' + city.region + '</span>' : '');
    }
    const titleEl = document.getElementById('city-panel-title');
    if (titleEl) titleEl.textContent = '🏙️ ' + cityName;
    const descEl = document.getElementById('city-panel-desc');
    if (descEl) descEl.textContent = city.desc || '';
    const metaEl = document.getElementById('city-panel-meta');
    if (metaEl) {
        var tags = [];
        if (city.specialties) tags = tags.concat(city.specialties.map(function(s) { return '<span class="px-2 py-0.5 bg-yellow-900/40 text-yellow-300 rounded">特产:' + s + '</span>'; }));
        if (city.accessLevel && city.accessLevel !== 'all') tags.push('<span class="px-2 py-0.5 bg-red-900/40 text-red-300 rounded">门槛:' + city.accessLevel + '</span>');
        tags.push('<span class="px-2 py-0.5 bg-gray-700 text-gray-300 rounded">设施 ' + (city.buildings ? city.buildings.length : 0) + ' 处</span>');
        metaEl.innerHTML = tags.join(' ');
    }
    const repMini = document.getElementById('city-rep-mini');
    if (repMini && typeof window.getReputationPanelHtml === 'function') {
        try { repMini.innerHTML = window.getReputationPanelHtml(cityName); } catch (e) { repMini.innerHTML = ''; }
    } else if (repMini) {
        repMini.innerHTML = '';
    }
    
    cityPanel.style.display = 'block';
    
    // 每次进入城市都隐藏地图 flex 容器（左侧列表+右侧SVG）
    const mapPanel = document.getElementById('panel-map');
    if (mapPanel) {
        mapPanel._hiddenForCity = true;
        // 使用 .flex.gap-4 精确匹配地图容器，而非标题行 .flex.justify-between
        const flexContainer = mapPanel.querySelector('.flex.gap-4');
        if (flexContainer) flexContainer.style.display = 'none';
    }
    const mapDetail = document.getElementById('map-detail');
    if (mapDetail) mapDetail.classList.add('hidden');
    const sectDetail = document.getElementById('sect-detail');
    if (sectDetail) sectDetail.classList.add('hidden');
    
    // 渲染建筑列表（按分类）
    const buildingList = document.getElementById('city-building-list');
    if (buildingList) {
        buildingList.innerHTML = '';
        const cats = { commercial: '🏪 商业', crafting: '🔨 工坊', cultivation: '🧘 修炼', combat: '⚔️ 武道', social: '🍵 社交', rest: '🛏️ 休憩', quest: '📜 任务', travel: '🌀 交通', gather: '🌿 采集' };
        const grouped = {};
        (city.buildings || []).forEach(function(buildingId) {
            const buildingType = Object.values(BUILDING_TYPES).find(b => b.id === buildingId);
            if (!buildingType) return;
            const c = buildingType.category || 'other';
            if (!grouped[c]) grouped[c] = [];
            grouped[c].push(buildingType);
        });
        Object.keys(cats).forEach(function(c) {
            if (!grouped[c] || !grouped[c].length) return;
            const h = document.createElement('div');
            h.className = 'text-xs font-bold text-gray-400 mt-2 mb-1';
            h.textContent = cats[c];
            buildingList.appendChild(h);
            grouped[c].forEach(function(buildingType) {
                buildingList.appendChild(createBuildingElement(buildingType.id, buildingType));
            });
        });
        // 未分类
        Object.keys(grouped).forEach(function(c) {
            if (cats[c]) return;
            grouped[c].forEach(function(buildingType) {
                buildingList.appendChild(createBuildingElement(buildingType.id, buildingType));
            });
        });
        
        // 添加特殊功能
        if (city.specialFeatures && city.specialFeatures.length > 0) {
            const specialHeader = document.createElement('div');
            specialHeader.className = 'mt-4 pt-3 border-t border-gray-700';
            specialHeader.innerHTML = '<h4 class="text-sm font-bold text-purple-400 mb-2">✨ 特色功能</h4>';
            buildingList.appendChild(specialHeader);
            
            city.specialFeatures.forEach(feature => {
                const featureEl = document.createElement('div');
                featureEl.className = 'p-2 bg-purple-900/30 rounded mb-2 border border-purple-700';
                featureEl.innerHTML = `
                    <button onclick="triggerSpecialFeature('${feature}')" class="w-full text-left text-sm text-purple-300 hover:text-purple-200">
                        ✨ ${feature}
                    </button>
                `;
                buildingList.appendChild(featureEl);
            });
        }
    }
    
    // 底部操作
    const actionContainer = document.getElementById('city-actions');
    if (actionContainer) {
        actionContainer.innerHTML = '<div class="flex flex-wrap gap-2 mb-2">' +
            '<button onclick="closeCityPanel()" class="bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded text-sm flex-1">关闭</button></div>';
    }
}

// ============ 创建城市面板 ============
function createCityPanel() {
    const panel = document.createElement('div');
    panel.id = 'city-panel';
    panel.className = 'panel bg-gray-900 p-6 rounded-lg shadow-xl border border-yellow-700 mt-4';
    panel.style.display = 'none';
    
    panel.innerHTML = `
        <div class="flex justify-between items-center mb-4 border-b border-gray-700 pb-3">
            <h2 id="city-panel-title" class="text-xl font-bold text-yellow-500">🏙️ 城市探索</h2>
            <button onclick="closeCityPanel()" class="text-gray-500 hover:text-white text-2xl font-bold">离开</button>
        </div>
        
        <div id="city-current-location-display" class="mb-2 p-3 bg-gray-800 rounded">
            <span class="text-gray-500">前往城市后将显示当前所在地</span>
        </div>
        <div id="city-panel-desc" class="mb-2 text-sm text-gray-400"></div>
        <div id="city-panel-meta" class="mb-4 text-xs text-gray-500 flex flex-wrap gap-2"></div>
        <div id="city-rep-mini" class="mb-3"></div>
        
        <div id="city-building-list" class="space-y-2 mb-4 max-h-[50vh] overflow-y-auto">
            <p class="text-gray-500 text-sm text-center">选择一个城市开始探索</p>
        </div>
        
        <div id="city-actions" class="border-t border-gray-700 pt-3">
        </div>
    `;
    
    return panel;
}

// ============ 创建建筑元素 ============
function createBuildingElement(buildingId, buildingType) {
    const div = document.createElement('div');
    div.className = 'p-3 bg-gray-800 rounded border border-gray-700 hover:border-yellow-500 transition cursor-pointer';
    
    // 建筑没有“现实时间玩法冷却”；短暂防双击只在 useBuilding 内处理。
    const isOnCooldown = false;
    
    // v9.0 情境设施：增加"🔍 深入"按钮
    var scenarioFacilities = { household_registry: 1, fire_department: 1, bounty_hall: 1 };
    var hasScenario = scenarioFacilities[buildingId] && window.scenarioEngine && window.scenarioEngine.facilities[buildingId];
    
    var btnHtml = '<button onclick="useBuilding(\'' + buildingId + '\')" class="' + (isOnCooldown ? 'bg-gray-600' : 'bg-yellow-600 hover:bg-yellow-500') + ' text-white px-3 py-1 rounded text-sm ' + (isOnCooldown ? 'cursor-not-allowed' : '') + '">' + (isOnCooldown ? '冷却中' : '使用') + '</button>';
    if (hasScenario) {
        btnHtml += ' <button onclick="openScenarioPanel(\'' + buildingId + '\')" class="bg-amber-700 hover:bg-amber-600 text-white px-3 py-1 rounded text-sm ml-1">🔍 深入</button>';
    }
    
    div.innerHTML = `
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
                <span class="text-2xl">${buildingType.icon}</span>
                <div>
                    <p class="font-bold ${buildingType.color}">${buildingType.name}</p>
                    <p class="text-xs text-gray-500">${getBuildingDescription(buildingId)}</p>
                </div>
            </div>
            <div>${btnHtml}</div>
        </div>
    `;
    
    return div;
}

// ============ 获取建筑描述 ============
function getBuildingDescription(buildingId) {
    const descriptions = {
        'shop': '综合坊市，货品齐全',
        'medicine_shop': '丹药草药专营',
        'talisman_shop': '符箓法器',
        'weapon_shop': '刀剑兵器',
        'armor_shop': '防具护甲',
        'art_shop': '功法秘籍',
        'beast_shop': '灵兽交易与图鉴',
        'alchemy': '炼制各种丹药',
        'forging': '锻造和强化装备',
        'enchant_shop': '装备附魔强化',
        'quest': '接取和交付任务',
        'inn': '休息恢复状态，跳过时间',
        'training': '练习战斗技巧，获取经验',
        'arena': '切磋比武',
        'teleport': '传送到其他城市',
        'tavern': '与NPC交谈，获取情报',
        'tea_house': '品茶听闻，放松心神',
        'guild_hall': '公会悬赏与集会',
        'cultivation': '静心修炼，提升修为',
        'library': '阅览典籍，增长见闻',
        'spring': '沐浴灵泉，全面恢复',
        'temple': '祈福祷告，净化身心',
        'market': '黑市交易，风险与机遇并存',
        'gathering': '采集灵药',
        'mining': '开采矿石',
        'household_registry': '查阅户籍，发现异常线索',
        'fire_department': '灭火救援，处理超凡火情',
        'bounty_hall': '领取悬赏，追捕凶徒'
    };
    return descriptions[buildingId] || '点击使用';
}

// ============ 使用建筑 ============
function isBuildingClickGuarded(buildingId) {
    var last = buildingClickGuards[buildingId] || 0;
    return Date.now() - last < 600;
}

function markBuildingUsed(buildingId) {
    buildingClickGuards[buildingId] = Date.now();
}

function useBuilding(buildingId) {
    if (isBuildingClickGuarded(buildingId)) return;

    // v7.2 商业/特色建筑优先路由
    var shopTypes = {
        shop: 'general', medicine_shop: 'medicine', talisman_shop: 'talisman',
        weapon_shop: 'weapon', armor_shop: 'armor', art_shop: 'art', market: 'special'
    };
    if (shopTypes[buildingId] && typeof window.openCityShop === 'function') {
        window.openCityShop(shopTypes[buildingId]);
        markBuildingUsed(buildingId);
        return;
    }
    if (buildingId === 'enchant_shop' && (window.openEnhancementHall || window.openForgingShop)) {
        if (window.openEnhancementHall) window.openEnhancementHall();
        else window.openForgingShop();
        markBuildingUsed(buildingId);
        return;
    }
    if (buildingId === 'beast_shop') {
        if (typeof window.switchPanel === 'function') window.switchPanel('beasts');
        else if (window.showMessage) window.showMessage('请打开灵兽面板', 'info');
        markBuildingUsed(buildingId);
        return;
    }
    if (buildingId === 'tea_house' && typeof window.visitTeaHouse === 'function') {
        window.visitTeaHouse();
        markBuildingUsed(buildingId);
        return;
    }
    if (buildingId === 'guild_hall' && typeof window.openGuildHall === 'function') {
        window.openGuildHall();
        markBuildingUsed(buildingId);
        return;
    }
    if (buildingId === 'library' && typeof window.openLibrary === 'function') {
        window.openLibrary();
        markBuildingUsed(buildingId);
        return;
    }
    if (buildingId === 'arena' && window.startBattle) {
        window.startBattle('training_dummy');
        markBuildingUsed(buildingId);
        return;
    }
    if (buildingId === 'gathering' && window.gatherHerbs) {
        window.gatherHerbs();
        markBuildingUsed(buildingId);
        return;
    }
    if (buildingId === 'mining' && window.mineOre) {
        window.mineOre();
        markBuildingUsed(buildingId);
        return;
    }
    // v9.0 情境交互设施
    var scenarioFacilities = { household_registry: 'openHouseholdRegistry', fire_department: 'openFireDepartment', bounty_hall: 'openBountyHall' };
    if (scenarioFacilities[buildingId] && typeof window[scenarioFacilities[buildingId]] === 'function') {
        window[scenarioFacilities[buildingId]]();
        markBuildingUsed(buildingId);
        return;
    }
    
    // 基础建筑：building-effects
    if (window.buildingEffects && window.buildingEffects.openBuildingUI) {
        window.buildingEffects.openBuildingUI(buildingId);
    } else if (typeof window.executeFacilityAction === 'function') {
        var fac = (window.CITY_FACILITIES || {})[buildingId];
        if (fac && fac.action) window.executeFacilityAction(fac.action, buildingId);
        else showMessage('打开' + buildingId + '...', 'info');
    } else {
        showMessage('打开' + buildingId + '...', 'info');
    }

    markBuildingUsed(buildingId);
}

// ============ 显示特色功能 ============
// ============ 特色功能（v7.1 P2 可进入） ============
function triggerSpecialFeature(featureName) {
    var city = currentLocation || (window.currentCharData && window.currentCharData.location) || '';
    var handlers = {
        '皇宫': function() { enterPalace(city); },
        '天牢': function() { enterPrison(city); },
        '皇家拍卖行': function() { openRoyalAuction(city); },
        '画舫': function() { enterHuafang(city); },
        '水榭': function() { enterHuafang(city); },
        '诗会': function() { joinPoetryMeet(city); },
        '观星台': function() { visitStarPlatform(city); },
        '悟道碑': function() { visitEnlightenmentStele(city); },
        '试炼塔': function() { enterTrialTower(city); },
        '灵药园': function() { visitHerbGarden(city); },
        '百草堂': function() { visitHerbGarden(city); },
        '渡劫台': function() { visitTribulationPlatform(city); },
        '龙宫宝库': function() { enterDragonVault(city); },
        '火山洞穴': function() { enterVolcanoCave(city); },
        '熔岩池': function() { enterVolcanoCave(city); },
        '毒王洞': function() { enterPoisonCave(city); },
        '黄金宫': function() { openGoldPalace(city); },
        '矿脉': function() { if (typeof window.mineOre === 'function') window.mineOre(); else showMessage('开采矿脉...', 'info'); },
        '地下集市': function() { openUndergroundMarket(city); },
        '遗迹入口': function() { enterRuinEntrance(city); },
        '冰晶塔': function() { visitIceTower(city); },
        '寒冰洞': function() { visitIceTower(city); },
        '冰宫': function() { visitIceTower(city); },
        '剑冢': function() { enterSwordTomb(city); },
        '藏剑楼': function() { enterSwordTomb(city); },
        '剑意碑林': function() { visitEnlightenmentStele(city); },
        '天然阵法': function() { studyFormation(city); },
        '道观': function() { visitDaoistTemple(city); },
        '天师府': function() { visitDaoistTemple(city); },
        '仙宫试炼': function() { enterTrialTower(city); },
        '珍珠市场': function() { openPearlMarket(city); },
        '渔村码头': function() { if (typeof window.goFishing === 'function') window.goFishing(); else showMessage('在码头垂钓...', 'info'); },
        '灯塔': function() { visitLighthouse(city); },
        '仙缘试炼': function() { enterTrialTower(city); }
    };
    if (handlers[featureName]) {
        handlers[featureName]();
    } else {
        // 通用：消耗时间+小奖励
        genericFeatureVisit(featureName, city);
    }
    if (window.timeSystem && window.timeSystem.advanceTime) {
        window.timeSystem.advanceTime(20, '特色探索:' + featureName);
    }
}

function _payOrFail(spiritCost, goldCost) {
    spiritCost = spiritCost || 0;
    goldCost = goldCost || 0;
    if (!window.inventory || !window.inventory.currency) return false;
    if ((window.inventory.currency.spiritStones || 0) < spiritCost) {
        if (window.showMessage) window.showMessage('灵石不足（需' + spiritCost + '）', 'error');
        return false;
    }
    if ((window.inventory.currency.copper || 0) < goldCost) {
        if (window.showMessage) window.showMessage('铜钱不足', 'error');
        return false;
    }
    window.inventory.currency.spiritStones -= spiritCost;
    window.inventory.currency.copper -= goldCost;
    if (window.updateCurrencyUI) window.updateCurrencyUI();
    return true;
}

function enterPalace(city) {
    var rep = typeof window.getReputationLevelIndex === 'function' ? window.getReputationLevelIndex(city) : 0;
    var hasPermit = typeof window.hasUnlockedFeature === 'function'
        ? window.hasUnlockedFeature(city, 'special_permit')
        : !!(window.currentCharData && window.currentCharData.flags && (window.currentCharData.flags.special_permit || window.currentCharData.flags['permit_' + city]));
    if (rep < 2 && !hasPermit) {
        if (window.showMessage) window.showMessage('皇宫守卫拦住你：需本城达到「受欢迎」或持有特殊许可', 'warning');
        return false;
    }
    var modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
    modal.innerHTML = '<div class="bg-gray-800 border-2 border-yellow-500 rounded-xl p-6 max-w-md w-full mx-4">' +
        '<h3 class="text-xl font-bold text-yellow-400 mb-3">🏯 皇宫</h3>' +
        '<p class="text-sm text-gray-300 mb-4">金碧辉煌的大殿，禁军肃立。你可朝见、献礼或暗中探查。</p>' +
        '<button onclick="this.closest(\'.fixed\').remove(); window._palaceAudience && window._palaceAudience(\'' + (city||'') + '\')" class="w-full mb-2 bg-yellow-700 text-white py-2 rounded">朝见（声望+）</button>' +
        '<button onclick="this.closest(\'.fixed\').remove(); window._palaceGift && window._palaceGift(\'' + (city||'') + '\')" class="w-full mb-2 bg-green-700 text-white py-2 rounded">献礼 200 灵石</button>' +
        '<button onclick="this.closest(\'.fixed\').remove(); window._palaceSneak && window._palaceSneak(\'' + (city||'') + '\')" class="w-full mb-2 bg-red-800 text-white py-2 rounded">暗中探查（风险）</button>' +
        '<button onclick="this.closest(\'.fixed\').remove()" class="w-full bg-gray-600 text-white py-2 rounded">离开</button></div>';
    document.body.appendChild(modal);
}
window._palaceAudience = function(city) {
    if (typeof window.addReputation === 'function') window.addReputation(city, 15);
    if (window.showMessage) window.showMessage('你恭敬朝见，留下好印象', 'success');
};
window._palaceGift = function(city) {
    if (!_payOrFail(200, 0)) return;
    if (typeof window.addReputation === 'function') window.addReputation(city, 40);
    if (window.showMessage) window.showMessage('献礼成功，声望大增', 'success');
};
window._palaceSneak = function(city) {
    if (Math.random() < 0.4) {
        if (typeof window.addItem === 'function') window.addItem('spec_map_fragment', 1);
        if (window.showMessage) window.showMessage('你摸到一份密图残片！', 'success');
        if (typeof window.setFlag === 'function') window.setFlag('palace_secret_' + city);
    } else {
        if (typeof window.reduceReputation === 'function') window.reduceReputation(city, 30);
        if (window.showMessage) window.showMessage('被禁军发现，声望下降！', 'error');
        if (typeof window.startBattle === 'function' && Math.random() < 0.5) window.startBattle('bandits');
    }
};

function enterPrison(city) {
    var modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
    modal.innerHTML = '<div class="bg-gray-800 border-2 border-gray-500 rounded-xl p-6 max-w-md w-full mx-4">' +
        '<h3 class="text-xl font-bold text-gray-300 mb-3">⛓️ 天牢</h3>' +
        '<p class="text-sm text-gray-400 mb-4">阴冷潮湿。可探监、行贿狱卒，或尝试劫狱（极危）。</p>' +
        '<button onclick="this.closest(\'.fixed\').remove(); window._prisonVisit && window._prisonVisit()" class="w-full mb-2 bg-blue-700 text-white py-2 rounded">探监（情报）</button>' +
        '<button onclick="this.closest(\'.fixed\').remove(); window._prisonBribe && window._prisonBribe(\'' + (city||'') + '\')" class="w-full mb-2 bg-yellow-700 text-white py-2 rounded">行贿 100 灵石</button>' +
        '<button onclick="this.closest(\'.fixed\').remove(); window._prisonBreak && window._prisonBreak(\'' + (city||'') + '\')" class="w-full mb-2 bg-red-700 text-white py-2 rounded">劫狱</button>' +
        '<button onclick="this.closest(\'.fixed\').remove()" class="w-full bg-gray-600 text-white py-2 rounded">离开</button></div>';
    document.body.appendChild(modal);
}
window._prisonVisit = function() {
    if (window.showMessage) window.showMessage('犯人低语：城外山贼巢穴在「黑风寨」……', 'info');
    if (typeof window.setFlag === 'function') window.setFlag('know_bandit_den');
    if (typeof window.unlockBanditDenQuest === 'function') window.unlockBanditDenQuest();
};
window._prisonBribe = function(city) {
    if (!_payOrFail(100, 0)) return;
    if (typeof window.addItem === 'function') window.addItem('spec_key', 1);
    if (window.showMessage) window.showMessage('狱卒塞给你一把旧钥匙', 'success');
};
window._prisonBreak = function(city) {
    if (window.showMessage) window.showMessage('劫狱！禁军杀到！', 'error');
    if (typeof window.reduceReputation === 'function') window.reduceReputation(city, 80);
    if (typeof window.startBattle === 'function') window.startBattle('dungeon_guard');
    if (typeof window.setFlag === 'function') window.setFlag('prison_break_' + city);
};

function openRoyalAuction(city) {
    city = city || currentLocation || (window.currentCharData && window.currentCharData.location) || '';
    if (!window.AuctionService || typeof window.AuctionService.openRoyal !== 'function') {
        if (window.showMessage) window.showMessage('皇家拍卖服务尚未就绪', 'error');
        return false;
    }
    return window.AuctionService.openRoyal(city);
}

function enterHuafang(city) {
    if (window.showMessage) window.showMessage('画舫之上丝竹声声，你结识文人，魅力与见闻有所增长', 'success');
    if (window.currentCharData) {
        window.currentCharData.tempering = (window.currentCharData.tempering || 0) + 30;
        window.currentCharData.mood = Math.min(100, (window.currentCharData.mood || 50) + 10);
    }
    if (typeof window.addReputation === 'function') window.addReputation(city, 8);
}

function joinPoetryMeet(city) {
    var ok = Math.random() < 0.5;
    if (ok) {
        if (window.showMessage) window.showMessage('你的诗作获得喝彩！声望与悟性提升', 'success');
        if (typeof window.addReputation === 'function') window.addReputation(city, 20);
        if (window.currentCharData) window.currentCharData.essence = (window.currentCharData.essence || 0) + 40;
    } else {
        if (window.showMessage) window.showMessage('诗会平平，权当游历', 'info');
        if (window.currentCharData) window.currentCharData.tempering = (window.currentCharData.tempering || 0) + 15;
    }
}

function visitStarPlatform(city) {
    if (window.showMessage) window.showMessage('观星台上星辉入体，真元增加', 'success');
    if (window.currentCharData) window.currentCharData.essence = (window.currentCharData.essence || 0) + 50;
    if (typeof window.guideQiCultivation === 'function' && Math.random() < 0.3) window.guideQiCultivation();
}

function visitEnlightenmentStele(city) {
    if (Math.random() < 0.35) {
        if (typeof window.insightPoints !== 'undefined') {
            // global may not exist
        }
        if (window.currentCharData) {
            window.currentCharData.insightPoints = (window.currentCharData.insightPoints || 0) + 1;
        }
        if (window.showMessage) window.showMessage('顿悟！领悟点+1', 'success');
        if (window.showEffect) window.showEffect('breakthrough');
    } else {
        if (window.showMessage) window.showMessage('碑文晦涩，稍有所感', 'info');
        if (window.currentCharData) window.currentCharData.essence = (window.currentCharData.essence || 0) + 20;
    }
}

function enterTrialTower(city) {
    if (window.showMessage) window.showMessage('试炼开启！', 'warning');
    if (typeof window.startBattle === 'function') window.startBattle('dungeon_guard');
    else {
        if (window.currentCharData) window.currentCharData.tempering = (window.currentCharData.tempering || 0) + 100;
        if (typeof window.addItem === 'function') window.addItem('pill_foundation', 1);
        if (window.showMessage) window.showMessage('试炼有所收获', 'success');
    }
    if (typeof window.setFlag === 'function') window.setFlag('trial_done_' + city);
}

function visitHerbGarden(city) {
    if (typeof window.gatherHerbs === 'function') window.gatherHerbs();
    else if (typeof window.addItem === 'function') {
        window.addItem('mat_lingzhi', 1 + Math.floor(Math.random() * 2));
        if (window.showMessage) window.showMessage('采得灵药', 'success');
    }
}

function visitTribulationPlatform(city) {
    if (window.showMessage) window.showMessage('渡劫台雷光隐现，你观摩天威，突破感悟加深', 'success');
    if (window.currentCharData) {
        window.currentCharData._foundationBonus = (window.currentCharData._foundationBonus || 0) + 5;
        window.currentCharData.essence = (window.currentCharData.essence || 0) + 60;
    }
}

function enterDragonVault(city) {
    if (!_payOrFail(0, 0)) {}
    var realm = (window.currentCharData && window.currentCharData.realm) || '炼气';
    var order = ['炼气','筑基','金丹','元婴','化神','炼虚','合体','大乘','渡劫'];
    if (order.indexOf(realm) < order.indexOf('金丹')) {
        if (window.showMessage) window.showMessage('龙威压迫，金丹以下难以深入', 'warning');
        return;
    }
    if (Math.random() < 0.5) {
        if (typeof window.addItem === 'function') window.addItem('mat_dragon_scale', 1);
        if (window.showMessage) window.showMessage('取得龙鳞！', 'success');
    } else {
        if (typeof window.startBattle === 'function') window.startBattle('beast');
        else if (window.showMessage) window.showMessage('守护兽苏醒，你被迫退出', 'error');
    }
}

function enterVolcanoCave(city) {
    if (window.showMessage) window.showMessage('熔岩映红岩壁，火灵充沛', 'info');
    if (typeof window.addItem === 'function' && Math.random() < 0.4) window.addItem('mat_fire_crystal', 1);
    if (window.currentCharData) window.currentCharData.essence = (window.currentCharData.essence || 0) + 35;
    if (typeof window.depleteQi === 'function') window.depleteQi(1);
}

function enterPoisonCave(city) {
    if (window.showMessage) window.showMessage('毒雾弥漫……', 'warning');
    if (Math.random() < 0.3) {
        if (window.currentCharData) window.currentCharData._poisoned = true;
        if (window.showMessage) window.showMessage('你中了毒！', 'error');
    } else if (typeof window.addItem === 'function') {
        window.addItem('mat_demon_beast_core', 1);
        if (window.showMessage) window.showMessage('取得毒核材料', 'success');
    }
}

function openGoldPalace(city) {
    if (typeof window.openShop === 'function') window.openShop('special');
    else if (typeof window.openHiddenShop === 'function') window.openHiddenShop(city);
    else if (window.showMessage) window.showMessage('黄金宫内商贾云集', 'info');
}

function openUndergroundMarket(city) {
    if (typeof window.openBlackMarket === 'function') window.openBlackMarket();
    else if (typeof window.openHiddenShop === 'function') window.openHiddenShop(city);
    else if (window.showMessage) window.showMessage('地下集市鱼龙混杂', 'info');
}

function enterRuinEntrance(city) {
    if (window.showMessage) window.showMessage('踏入遗迹……', 'warning');
    if (typeof window.setFlag === 'function') window.setFlag('ruin_explored_' + city);
    if (Math.random() < 0.5 && typeof window.startBattle === 'function') window.startBattle('dungeon_guard');
    else if (typeof window.addItem === 'function') {
        window.addItem('mat_meteorite', 1);
        if (window.showMessage) window.showMessage('搜得陨铁', 'success');
    }
}

function visitIceTower(city) {
    if (window.showMessage) window.showMessage('寒气刺骨，冰灵淬体', 'info');
    if (window.currentCharData) {
        window.currentCharData.constitution = (window.currentCharData.constitution || 0) + (Math.random() < 0.1 ? 1 : 0);
        window.currentCharData.essence = (window.currentCharData.essence || 0) + 40;
    }
}

function enterSwordTomb(city) {
    var modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
    modal.innerHTML = '<div class="bg-gray-800 border-2 border-slate-400 rounded-xl p-6 max-w-md w-full mx-4">' +
        '<h3 class="text-xl font-bold text-slate-200 mb-3">⚔️ 剑冢</h3>' +
        '<p class="text-sm text-gray-400 mb-4">万剑埋骨，剑意森然。可悟剑、拔剑或挑战剑灵。</p>' +
        '<button onclick="this.closest(\'.fixed\').remove(); window._swordComprehend && window._swordComprehend()" class="w-full mb-2 bg-blue-700 text-white py-2 rounded">悟剑</button>' +
        '<button onclick="this.closest(\'.fixed\').remove(); window._swordPull && window._swordPull()" class="w-full mb-2 bg-yellow-700 text-white py-2 rounded">试拔古剑</button>' +
        '<button onclick="this.closest(\'.fixed\').remove(); window._swordChallenge && window._swordChallenge()" class="w-full mb-2 bg-red-700 text-white py-2 rounded">挑战剑灵</button>' +
        '<button onclick="this.closest(\'.fixed\').remove()" class="w-full bg-gray-600 text-white py-2 rounded">离开</button></div>';
    document.body.appendChild(modal);
}
window._swordComprehend = function() {
    if (window.currentCharData) window.currentCharData.essence = (window.currentCharData.essence || 0) + 55;
    if (window.showMessage) window.showMessage('剑意入体，修为精进', 'success');
};
window._swordPull = function() {
    if (Math.random() < 0.25) {
        if (typeof window.addItem === 'function') window.addItem('wpn_dark_iron_sword', 1);
        if (window.showMessage) window.showMessage('古剑认可了你！', 'success');
    } else {
        if (window.showMessage) window.showMessage('剑身不动，反震得你虎口发麻', 'info');
    }
};
window._swordChallenge = function() {
    if (typeof window.startBattle === 'function') window.startBattle('elite');
    else if (window.showMessage) window.showMessage('剑灵虚影散去，你若有所悟', 'info');
};

function studyFormation(city) {
    if (window.currentCharData) window.currentCharData._formationBuff = { def: 0.12, turns: 8 };
    if (window.showMessage) window.showMessage('参悟天然阵法，临时防御提升', 'success');
}

function visitDaoistTemple(city) {
    if (window.showMessage) window.showMessage('道观清幽，心神安定', 'success');
    if (window.currentCharData) {
        window.currentCharData.mood = Math.min(100, (window.currentCharData.mood || 50) + 15);
        window.currentCharData.essence = (window.currentCharData.essence || 0) + 25;
    }
    if (typeof window.addReputation === 'function') window.addReputation(city, 5);
}

function openPearlMarket(city) {
    if (typeof window.addItem === 'function' && window.inventory && (window.inventory.currency.spiritStones || 0) >= 50) {
        // simple buy pearl-like material
    }
    if (typeof window.openShop === 'function') window.openShop('general');
    if (window.showMessage) window.showMessage('珍珠市场上珠光宝气', 'info');
}

function visitLighthouse(city) {
    if (window.showMessage) window.showMessage('登上海边灯塔，远洋航线了然于胸，旅行风险略降数日', 'success');
    if (typeof window.setCityTempModifier === 'function') {
        window.setCityTempModifier(city, { travelRisk: 0.7, days: 5 });
    }
    if (typeof window.setFlag === 'function') window.setFlag('lighthouse_' + city);
}

function genericFeatureVisit(name, city) {
    if (window.showMessage) window.showMessage('你仔细探访「' + name + '」，有所见闻', 'info');
    if (window.currentCharData) window.currentCharData.tempering = (window.currentCharData.tempering || 0) + 20;
    if (typeof window.addReputation === 'function' && city) window.addReputation(city, 3);
}


// ============ 关闭城市面板 ============
function closeCityPanel() {
    const panel = document.getElementById('city-panel');
    if (panel) {
        panel.style.display = 'none';
    }
    // 恢复地图 flex 容器
    var mapPanel = document.getElementById('panel-map');
    if (mapPanel) {
        mapPanel._hiddenForCity = false;
        mapPanel.classList.remove('hidden');
        var flexContainer = mapPanel.querySelector('.flex.gap-4');
        if (flexContainer) flexContainer.style.display = 'flex';
    }
    // 清除城市标记
    if (window.currentCharData) {
        window.currentCharData.location = null;
    }
    if (window.showMessage) showMessage('离开了城市，回到地图', 'info');
}

// ============ 获取当前城市 ============
function getCurrentLocation() {
    return currentLocation;
}

// ============ 获取城市数据 ============
function getCityData(cityName) {
    var normalizedName = cityName.replace(/\s+/g, '');
    return cityData[normalizedName] || cityData[cityName];
}

// ============ 获取所有城市列表 ============
function getAllCities() {
    return Object.keys(cityData).map(cityName => ({
        name: cityName,
        region: cityData[cityName].region,
        desc: cityData[cityName].desc,
        isVisited: visitedCities.has(cityName),
        isCurrent: cityName === currentLocation
    }));
}

// ============ 显示消息 ============
// 已由 global-utils.js 在第0层设置 window.showMessage，此处不再重复声明
// 所有调用直接使用 window.showMessage()

// ============ v6.0 新增: 城市辅助函数 ============

// 获取城市特色建筑列表
function getCitySpecialFeatures(cityName) {
    const city = cityData[cityName];
    return city?.specialFeatures || [];
}

// 获取城市特产
function getCitySpecialties(cityName) {
    const city = cityData[cityName];
    return city?.specialties || [];
}

// 获取城市专属NPC
function getCitySpecialNPCs(cityName) {
    const city = cityData[cityName];
    return city?.specialNPCs || [];
}

// 获取城市事件
function getCityEvents(cityName) {
    const city = cityData[cityName];
    return city?.events || [];
}

// 获取城市价格修正
function getCityPriceModifier(cityName, type = 'buy') {
    const city = cityData[cityName];
    return city?.priceModifier?.[type] || 1.0;
}

// 获取城市加成
function getCityBonus(cityName) {
    // B5：无参时用当前城市；返回可消费的加成对象
    if (!cityName) {
        cityName = currentLocation || (window.currentCharData && window.currentCharData.location) || null;
    }
    if (!cityName) return {};
    var normalized = String(cityName).replace(/\s+/g, '');
    const city = cityData[normalized] || cityData[cityName];
    return (city && city.bonus) ? city.bonus : {};
}

// 获取城市访问等级要求
function getCityAccessLevel(cityName) {
    const city = cityData[cityName];
    return city?.accessLevel || 'all';
}

// 获取城市所属地区
function getCityRegion(cityName) {
    for (const [region, data] of Object.entries(window.mapData || {})) {
        if (data.cities && data.cities.includes(cityName)) {
            return region;
        }
    }
    return null;
}

// ============ 导出到全局 ============
window.triggerSpecialFeature = triggerSpecialFeature;
window.getCityBonus = getCityBonus; // B5：声望等模块直接调用

window.locationSystem = {
    initLocationSystem,
    saveLocationData,
    enterCity,
    renderCityBuildings,
    useBuilding,
    closeCityPanel,
    getCurrentLocation,
    getCityData,
    getAllCities,
    cityData,
    BUILDING_TYPES,
    getCitySpecialFeatures,
    getCitySpecialties,
    getCitySpecialNPCs,
    getCityEvents,
    getCityPriceModifier,
    getCityBonus,
    getCityAccessLevel,
    getCityRegion,
    triggerSpecialFeature,
    get currentLocation() { return currentLocation; },
    set currentLocation(v) { currentLocation = v; }
};

// 自动初始化
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        initLocationSystem();
    });
}
// ==================== city-life.js - 城市生活化系统 ====================
// 市民NPC、日常活动、闲聊情报、城市氛围、城市日常事件
// 依赖：location-system.js (cityData, enterCity)
// 加载顺序：在 location-system.js 之后

// ============ 城市氛围定义 ============
const CITY_ATMOSPHERE = {
    '帝都·长安': {
        default: '繁华',
        descriptions: [
            '车水马龙，人声鼎沸，繁华的长安城尽显帝都气象。',
            '街道两旁商铺林立，叫卖声不绝于耳。',
            '皇宫金碧辉煌，琉璃瓦在阳光下熠熠生辉。'
        ],
        events: ['集市日', '节日庆典', '宵禁'],
        colors: ['from-yellow-900/30', 'to-red-800/20']
    },
    '洛水城': {
        default: '雅致',
        descriptions: [
            '洛水河畔，画舫笙歌，文人雅士吟诗作对。',
            '水榭楼台间，飘荡着悠扬的琴声。',
            '两岸杨柳依依，行人如织。'
        ],
        events: ['诗会', '花灯节', '龙舟赛'],
        colors: ['from-green-900/30', 'to-blue-800/20']
    },
    '太虚山': {
        default: '仙气缭绕',
        descriptions: [
            '云雾缭绕的山峰间，仙鹤飞舞，道韵悠长。',
            '观星台上，有道人正在观测天象。',
            '山间灵气充沛，是修炼的绝佳去处。'
        ],
        events: ['讲道法会', '观星夜', '试炼开启'],
        colors: ['from-blue-900/30', 'to-purple-800/20']
    },
    '青木城': {
        default: '生机盎然',
        descriptions: [
            '城中遍植奇花异草，空气中弥漫着草木的清香。',
            '灵药园中，各种珍稀药材正在茁壮成长。',
            '木灵之气浓郁，让人感到神清气爽。'
        ],
        events: ['百草大会', '灵木结果', '采药节'],
        colors: ['from-green-900/40', 'to-teal-800/20']
    },
    '蓬莱仙岛': {
        default: '神秘缥缈',
        descriptions: [
            '云雾缭绕的海上仙山，宛如仙境。',
            '海浪拍打着礁石，溅起白色的浪花。',
            '仙雾阁中，隐约可见仙人对弈。'
        ],
        events: ['海市蜃楼', '仙缘大会', '渡劫观摩'],
        colors: ['from-cyan-900/30', 'to-blue-800/20']
    },
    '东海龙宫': {
        default: '瑰丽奇幻',
        descriptions: [
            '珊瑚为柱，明珠为灯，深海龙宫美轮美奂。',
            '各色鱼群在宫殿间游弋，虾兵蟹将巡逻其间。',
            '龙宫宝库中珍宝无数，光芒四射。'
        ],
        events: ['龙宫宴会', '潮汐之力', '龙族试炼'],
        colors: ['from-blue-900/40', 'to-cyan-800/30']
    },
    '炎城': {
        default: '炽热激昂',
        descriptions: [
            '熔岩为河，火焰为灯，炎城充满了力量与激情。',
            '铁匠铺中叮叮当当的锻造声此起彼伏。',
            '火山口的热浪扑面而来，让人热血沸腾。'
        ],
        events: ['铸剑大会', '火山喷发', '角斗大赛'],
        colors: ['from-red-900/40', 'to-orange-800/30']
    },
    '万毒谷': {
        default: '阴森诡异',
        descriptions: [
            '毒瘴弥漫，奇花异草散发着危险的气息。',
            '万毒门的弟子们在谷中穿梭，行色匆匆。',
            '毒王洞深处，隐约传来窸窸窣窣的声音。'
        ],
        events: ['毒王试炼', '百毒宴', '解毒大会'],
        colors: ['from-purple-900/40', 'to-green-900/30']
    },
    '金城': {
        default: '富丽堂皇',
        descriptions: [
            '黄金铸就的城池，在阳光下闪烁着耀眼的光芒。',
            '商队络绎不绝，来自四面八方的珍宝汇聚于此。',
            '金碧辉煌的宫殿中，权贵们正在把酒言欢。'
        ],
        events: ['拍卖会', '商会盟会', '鉴宝大会'],
        colors: ['from-yellow-900/40', 'to-amber-800/30']
    },
    '大漠孤城': {
        default: '苍凉壮阔',
        descriptions: [
            '黄沙漫天，孤城屹立在沙漠之中，尽显苍凉。',
            '城中客栈的老板娘热情地招呼着往来的旅人。',
            '月光下的沙漠，别有一番壮阔之美。'
        ],
        events: ['沙漠商队', '绿洲寻宝', '沙暴来袭'],
        colors: ['from-yellow-800/40', 'to-orange-900/30']
    },
    '冰原城': {
        default: '寒冷肃穆',
        descriptions: [
            '冰雪覆盖的城池，在极光下闪烁着幽蓝的光芒。',
            '城中居民身着厚实的皮裘，行色匆匆。',
            '冰雕宫殿在月光下熠熠生辉。'
        ],
        events: ['极光之夜', '冰雕大赛', '雪狼狩猎'],
        colors: ['from-blue-900/40', 'to-indigo-800/30']
    },
    '极寒之地': {
        default: '极寒死寂',
        descriptions: [
            '万年不化的冰川，凛冽的寒风如刀割般刺骨。',
            '冰洞中隐藏着上古遗迹，等待有缘人探索。',
            '极光在夜空中舞动，美得令人窒息。'
        ],
        events: ['极光显现', '冰川融化', '上古遗迹开启'],
        colors: ['from-indigo-900/40', 'to-blue-800/30']
    },
    '剑阁': {
        default: '肃杀凌厉',
        descriptions: [
            '万剑齐鸣，剑意冲霄，剑阁是剑修心中的圣地。',
            '悬崖峭壁之上，插满了各式各样的宝剑。',
            '剑气纵横，让人不寒而栗。'
        ],
        events: ['剑道大会', '万剑朝宗', '铸剑祭典'],
        colors: ['from-gray-800/40', 'to-blue-900/30']
    },
    '青城山': {
        default: '清幽宁静',
        descriptions: [
            '青山绿水，鸟语花香，青城山是避世修行的好去处。',
            '道观中传来悠扬的钟声，回荡在山谷之间。',
            '竹林深处，有隐士正在抚琴。'
        ],
        events: ['青城论道', '竹林听雨', '太极演武'],
        colors: ['from-green-900/30', 'to-emerald-800/20']
    }
};

const DEFAULT_ATMOSPHERE = {
    default: '普通',
    descriptions: ['一座普通的城市，人来人往，熙熙攘攘。'],
    events: ['集市', '节日'],
    colors: ['from-gray-800/20', 'to-gray-700/10']
};

// ============ 市民生成 ============
const CITIZEN_NAMES = {
    male: ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑一', '冯二',
           '陈大', '褚三', '卫四', '蒋五', '沈六', '韩七', '杨八', '朱九', '秦十', '许一'],
    female: ['阿花', '翠花', '小芳', '秀英', '美兰', '玉珍', '淑芬', '桂英', '春梅', '秋菊',
             '小红', '小翠', '小玉', '小凤', '小莲', '小荷', '小蝶', '小燕', '小梅', '小兰']
};

const CITIZEN_OCCUPATIONS = [
    { name: '摊贩', icon: '🍜', desc: '在街边摆摊的小贩' },
    { name: '书生', icon: '📚', desc: '正在读书的年轻书生' },
    { name: '工匠', icon: '🔨', desc: '正在干活的工匠' },
    { name: '乞丐', icon: '🥣', desc: '蜷缩在街角的乞丐' },
    { name: '道士', icon: '☯️', desc: '游历到此的道士' },
    { name: '武者', icon: '⚔️', desc: '正在练武的修士' },
    { name: '老者', icon: '👴', desc: '悠闲散步的老人' },
    { name: '妇人', icon: '👩', desc: '正在买菜的主妇' },
    { name: '孩童', icon: '👶', desc: '在街上玩耍的孩子' },
    { name: '琴师', icon: '🎵', desc: '弹奏古琴的乐师' },
    { name: '棋手', icon: '♟️', desc: '正在下棋的老者' }
];

const CITIZEN_GOSSIP = [
    { text: '听说后山有妖怪出没，最近小心些。', type: 'danger' },
    { text: '坊市来了个奇怪的商人，卖的东西都很便宜。', type: 'market' },
    { text: '你知道吗？城东的庙里据说有仙人显灵。', type: 'event' },
    { text: '最近灵石涨价了，要买趁早。', type: 'economy' },
    { text: '听说有个秘境要开启了，就在附近的山里。', type: 'secret' },
    { text: '城主府最近在招护卫，待遇不错。', type: 'quest' },
    { text: '昨夜有人看到天降异象，一道金光落入西山。', type: 'treasure' },
    { text: '今天的菜价又涨了，日子越来越难过了。', type: 'life' },
    { text: '听说邻国来了个使团，带来了不少稀奇玩意儿。', type: 'news' },
    { text: '最近天气反常，恐怕要出大事。', type: 'warning' }
];

// ============ 城市市民状态 ============
var cityCitizens = {};

// 生成市民
function generateCitizensForCity(cityName) {
    var city = window.cityData ? window.cityData[cityName] : null;
    if (!city) return [];

    var count = 3 + Math.floor(Math.random() * 5);
    var citizens = [];

    for (var i = 0; i < count; i++) {
        var gender = Math.random() > 0.5 ? 'male' : 'female';
        var names = CITIZEN_NAMES[gender];
        var name = names[Math.floor(Math.random() * names.length)];
        var occupation = CITIZEN_OCCUPATIONS[Math.floor(Math.random() * CITIZEN_OCCUPATIONS.length)];

        citizens.push({
            id: 'citizen_' + cityName + '_' + i,
            name: name,
            gender: gender,
            occupation: occupation.name,
            icon: occupation.icon,
            desc: occupation.desc,
            gossip: CITIZEN_GOSSIP[Math.floor(Math.random() * CITIZEN_GOSSIP.length)],
            isCitizen: true
        });
    }

    return citizens;
}

// 获取城市市民
function getCityCitizens(cityName) {
    if (!cityCitizens[cityName]) {
        cityCitizens[cityName] = generateCitizensForCity(cityName);
    }
    return cityCitizens[cityName];
}

// 刷新市民
function refreshCityCitizens() {
    cityCitizens = {};
}

// ============ 获取城市氛围描述 ============
function getCityAtmosphereDescription(cityName) {
    var atmosphere = CITY_ATMOSPHERE[cityName] || DEFAULT_ATMOSPHERE;
    var descs = atmosphere.descriptions;
    return descs[Math.floor(Math.random() * descs.length)];
}

// ============ 获取城市当前事件 ============
function getCurrentCityEvent(cityName) {
    var atmosphere = CITY_ATMOSPHERE[cityName] || DEFAULT_ATMOSPHERE;
    var events = atmosphere.events;
    var gameDay = window.gameTime ? window.gameTime.currentDay : 1;
    var eventIndex = Math.floor(gameDay / 7) % events.length;
    return { name: events[eventIndex] || events[0], active: true };
}

// ============ 与市民闲聊 ============
function chatWithCitizen(cityName) {
    var citizens = getCityCitizens(cityName);
    if (citizens.length === 0) { showMessage('街上没有看到什么人。', 'info'); return; }

    var citizen = citizens[Math.floor(Math.random() * citizens.length)];
    var gossip = CITIZEN_GOSSIP[Math.floor(Math.random() * CITIZEN_GOSSIP.length)];

    var modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
    modal.onclick = function(e) { if (e.target === modal) modal.remove(); };

    modal.innerHTML = '<div class="bg-gray-800 border-2 border-yellow-600/50 rounded-xl p-6 max-w-md w-full mx-4">' +
        '<div class="flex items-center gap-3 mb-4">' +
            '<div class="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-2xl">' + citizen.icon + '</div>' +
            '<div><h3 class="text-lg font-bold text-white">' + citizen.name + '</h3><p class="text-xs text-gray-400">' + citizen.occupation + ' · ' + cityName + '</p></div>' +
            '<button onclick="this.closest(\'.fixed\').remove()" class="text-gray-400 hover:text-white text-2xl ml-auto">&times;</button>' +
        '</div>' +
        '<div class="bg-gray-900/50 rounded-lg p-4 mb-4"><p class="text-gray-300 leading-relaxed">「' + citizen.desc + '」</p></div>' +
        '<div class="bg-yellow-900/30 rounded-lg p-3 border border-yellow-600/30">' +
            '<div class="flex items-center gap-2 mb-1"><span class="text-yellow-400">💬</span><span class="text-xs text-yellow-400 font-bold">闲聊情报</span></div>' +
            '<p class="text-gray-200 text-sm">「' + gossip.text + '」</p>' +
        '</div>' +
        '<div class="flex justify-end mt-3"><button onclick="this.closest(\'.fixed\').remove()" class="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded-lg transition">关闭</button></div>' +
    '</div>';

    document.body.appendChild(modal);

    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(10, '闲聊');
    }
}

// ============ 进入城市时显示氛围描述 ============
function showCityLifeOnEnter(cityName) {
    var atmosphere = CITY_ATMOSPHERE[cityName] || DEFAULT_ATMOSPHERE;
    var desc = getCityAtmosphereDescription(cityName);
    var currentEvent = getCurrentCityEvent(cityName);
    var citizens = getCityCitizens(cityName);

    var toast = document.createElement('div');
    toast.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 z-50';
    toast.style.animation = 'citySlideDown 4s ease forwards';

    toast.innerHTML = '<div class="bg-gray-800/90 border border-yellow-600/30 rounded-lg p-4 max-w-lg text-center shadow-lg">' +
        '<div class="text-2xl mb-1">🏙️</div>' +
        '<h3 class="text-lg font-bold text-yellow-500 mb-1">' + cityName + '</h3>' +
        '<p class="text-sm text-gray-300 mb-2">' + desc + '</p>' +
        '<div class="flex items-center justify-center gap-3 text-xs text-gray-400">' +
            '<span>🎪 ' + currentEvent.name + '</span>' +
            '<span>👥 ' + citizens.length + '位市民</span>' +
        '</div></div>';

    document.body.appendChild(toast);
    setTimeout(function() { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 4000);

    if (!document.getElementById('city-life-style')) {
        var style = document.createElement('style');
        style.id = 'city-life-style';
        style.textContent = '@keyframes citySlideDown { 0% { opacity:0; transform:translate(-50%,-20px); } 10% { opacity:1; transform:translate(-50%,0); } 80% { opacity:1; transform:translate(-50%,0); } 100% { opacity:0; transform:translate(-50%,-20px); } }';
        document.head.appendChild(style);
    }
}

// ============ 城市探索 ============
function exploreCity(cityName) {
    var events = [
        { text: '你在街上闲逛，发现了一个有趣的小摊。', action: function() { chatWithCitizen(cityName); } },
        { text: '你听到路人在讨论最近的奇闻异事。', action: function() {
            var gossip = CITIZEN_GOSSIP[Math.floor(Math.random() * CITIZEN_GOSSIP.length)];
            showMessage('💬 ' + gossip.text, 'info');
            if (window.timeSystem) window.timeSystem.advanceTime(5, '探索城市');
        }},
        { text: '你发现了一家隐藏的小店，里面卖着稀奇古怪的东西。', action: function() {
            if (typeof window.openCityShop === 'function') { window.openCityShop(cityName); }
            else { showMessage('小店老板热情地招呼你，但店里没什么特别的。', 'info'); }
            if (window.timeSystem) window.timeSystem.advanceTime(10, '探索城市');
        }},
        { text: '你遇到一个看起来很有学问的老者，他似乎知道很多秘密。', action: function() {
            var secret = CITIZEN_GOSSIP[Math.floor(Math.random() * CITIZEN_GOSSIP.length)];
            showMessage('🔍 老者低声说：「' + secret.text + '」', 'info');
            if (window.timeSystem) window.timeSystem.advanceTime(15, '请教老者');
        }}
    ];

    var event = events[Math.floor(Math.random() * events.length)];
    showMessage('🏙️ ' + event.text, 'info');
    event.action();
}

// ============ 集成到城市系统 ============
(function() {
    var origEnterCity = window.enterCity;
    if (typeof origEnterCity === 'function') {
        window.enterCity = function(cityName) {
            var result = origEnterCity(cityName);
            if (result) {
                setTimeout(function() {
                    try { if (typeof window.showCityLifeOnEnter === 'function') window.showCityLifeOnEnter(cityName); } catch(e) {}
                }, 500);
            }
            return result;
        };
    }
})();

// ==================== 门派沉浸式面板（v7.3 P0） ====================
// 复用 enterCity 模式：点击门派 → 隐藏地图 → 显示完整门派面板

let currentSect = null;
let isInSectPanel = false;

// 动态门派面板只有一个 DOM 所有者。所有门派视图（山门/外院/内院/兼容旧视图）
// 都复用同一个节点，避免多个模块各自 create #sect-panel。
function ensureSectPanel() {
    var panel = document.getElementById('sect-panel');
    if (panel) return panel;
    panel = document.createElement('div');
    panel.id = 'sect-panel';
    panel.className = 'p-6 space-y-4 hidden';
    var mapPanel = document.getElementById('panel-map');
    if (mapPanel && mapPanel.parentNode) {
        mapPanel.parentNode.insertBefore(panel, mapPanel.nextSibling);
    } else {
        var host = document.getElementById('game-world') || document.body;
        host.appendChild(panel);
    }
    if (window.PanelLifecycle && typeof window.PanelLifecycle.register === 'function') {
        window.PanelLifecycle.register('sect-panel', { ownerPanel: 'map' });
    }
    return panel;
}

// ============ 进入门派（v8.6 三层访问体系） ============
function enterSect(sectName) {
    const sect = window.sectsData?.[sectName];
    if (!sect) {
        if (typeof showMessage === 'function') showMessage('门派不存在', 'error');
        return;
    }
    
    currentSect = sectName;
    isInSectPanel = true;
    
    // 隐藏地图区域
    const mapPanel = document.getElementById('panel-map');
    if (mapPanel) {
        const flexContainer = mapPanel.querySelector('.flex.gap-4');
        if (flexContainer) flexContainer.style.display = 'none';
    }
    
    // 使用新的三层访问系统（山门→外院→内院）
    if (typeof window.showSectGateScene === 'function') {
        window.showSectGateScene(sectName);
    } else {
        // 回退到旧版面板
        showSectPanel(sectName);
    }
    
    // 滚动到面板
    setTimeout(function() {
        const panel = document.getElementById('sect-panel');
        if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
    
    if (typeof showMessage === 'function') showMessage('🏛️ 来到了 ' + sectName, 'info');
}

// ============ 关闭门派面板 ============
function closeSectPanel() {
    isInSectPanel = false;
    currentSect = null;
    
    // 恢复地图显示
    const mapPanel = document.getElementById('panel-map');
    if (mapPanel) {
        const flexContainer = mapPanel.querySelector('.flex.gap-4');
        if (flexContainer) flexContainer.style.display = 'flex';
    }
    
    // 隐藏门派面板
    const panel = document.getElementById('sect-panel');
    if (panel) panel.classList.add('hidden');
    
    document.getElementById('sect-detail')?.classList.add('hidden');
}

// ============ 恢复地图主视图（切换主面板回来时调用） ============
// 分两种子视图恢复，不丢玩家当前所在视图：
//  1) 门派界面（isInSectPanel=true）：切走再切回 → 重新显示 sect-panel，地图保持隐藏
//  2) 城市面板（_hiddenForCity=true）：切走再切回 → 保留 city-panel
//  3) 否则 → 恢复地图 .flex.gap-4 容器，并清理残留弹层
function restoreMapMainView() {
    var mapPanel = document.getElementById('panel-map');
    if (!mapPanel) return;

    // 1) 门派界面仍激活：重显 sect-panel（内容未清，只是被 PanelLifecycle 加了 hidden）
    if (isInSectPanel) {
        var sp = document.getElementById('sect-panel');
        if (sp) sp.classList.remove('hidden');
        // 地图 flex 保持隐藏（门派界面覆盖地图区域）
        return;
    }

    // 2) 城市面板仍激活：保留（_hiddenForCity 标记仍在，flex 保持 none）
    var cityPanel = document.getElementById('city-panel');
    if (cityPanel && cityPanel.style.display === 'block') return;

    // 3) 普通地图视图：恢复 flex 容器
    var flexContainer = mapPanel.querySelector('.flex.gap-4');
    if (flexContainer && flexContainer.style.display === 'none') {
        flexContainer.style.display = 'flex';
    }
    mapPanel._hiddenForCity = false;
    // 隐藏残留的门派详情 / 城市简介弹层，避免遮挡地图
    var sd = document.getElementById('sect-detail');
    if (sd) sd.classList.add('hidden');
    var md = document.getElementById('map-detail');
    if (md) md.classList.add('hidden');
}

// ============ 渲染门派设施（用于面板内嵌） ============
function renderSectFacilitiesForPanel(sectName, isMember) {
    const facilities = window.facilities || [];
    if (facilities.length === 0) {
        return '<p class="text-gray-500 text-sm col-span-full">暂无可用设施</p>';
    }
    
    return facilities.map(function(f) {
        const ds = window.discipleState || {};
        const canUse = isMember && ds.isInSect;
        const locked = !canUse || f.rankReq > ds.rank;
        
        return '<div class="bg-gray-800/50 p-3 rounded border ' + (locked ? 'border-gray-700 opacity-60' : 'border-green-700') + '">' +
            '<div class="flex items-center gap-2 mb-2">' +
            '<span class="text-xl">' + f.icon + '</span>' +
            '<div class="flex-1">' +
            '<p class="font-bold text-sm text-white">' + f.name + '</p>' +
            '<p class="text-xs text-gray-400">' + f.desc + '</p>' +
            '</div>' +
            (canUse ? '<button onclick="useFacility(\'' + f.id + '\')" class="bg-yellow-600 hover:bg-yellow-500 text-gray-900 px-2 py-1 rounded text-xs font-bold">使用</button>'
                    : '<span class="text-xs text-gray-500">' + (isMember ? '权限不足' : '需加入门派') + '</span>') +
            '</div></div>';
    }).join('');
}

// ============ 渲染门派任务（用于面板内嵌） ============
function renderSectTasksForPanel() {
    var tasks = window.sectTasks || [];
    if (tasks.length === 0) {
        return '<p class="text-gray-500 text-sm">暂无可用任务</p>';
    }
    var activeIds = (window.activeTasks || []).map(function(t) { return t.taskId; });
    var completed = window.completedTasks || [];
    var dailyDone = window.dailyCompletedTasks || [];
    
    return tasks.slice(0, 6).map(function(task) {
        var isActive = activeIds.indexOf(task.id) >= 0;
        var isDone = completed.indexOf(task.id) >= 0;
        var isDailyDone = task.isDaily && dailyDone.indexOf(task.id) >= 0;
        var disabled = isDone || isDailyDone || isActive;
        
        return '<div class="bg-gray-800/30 p-2 rounded border border-gray-700 flex justify-between items-center ' + (disabled ? 'opacity-50' : '') + '">' +
            '<div class="flex-1">' +
            '<p class="text-xs font-bold text-white">' + task.name + ' <span class="text-gray-500">(' + task.type + ')</span></p>' +
            '<p class="text-xs text-gray-400">' + task.desc + '</p>' +
            '</div>' +
            '<button onclick="' + (task.isDaily ? 'submitDailyTask' : 'acceptTask') + '(\'' + task.id + '\')" ' +
            'class="text-xs px-2 py-1 rounded ' + (disabled ? 'bg-gray-600' : 'bg-yellow-600 hover:bg-yellow-500 text-gray-900') + '" ' +
            (disabled ? 'disabled' : '') + '>' +
            (isDailyDone ? '已完成' : isActive ? '进行中' : isDone ? '已完成' : '接取') +
            '</button></div>';
    }).join('');
}

// ============ 渲染门派弟子（用于面板内嵌，可点击对话） ============
function renderSectDisciplesForPanel(sectName) {
    var npcs = (typeof window.getSectNPCs === 'function') ? window.getSectNPCs(sectName) : [];
    if (npcs.length === 0) {
        // 降级：显示虚拟弟子
        return '<p class="text-gray-500 text-sm col-span-full">暂无弟子数据</p>';
    }
    
    return npcs.slice(0, 8).map(function(n) {
        var icon = n.occupation === '掌门' ? '👑' : n.occupation === '长老' || n.occupation === '护法' ? '🧓' : '🧑';
        var realmText = (n.combat?.realm || '炼气') + (n.combat?.layer || 1) + '层';
        var npcId = n.id;
        return '<div class="bg-gray-800/40 p-2 rounded border border-gray-700 text-center">' +
            '<span class="text-lg">' + icon + '</span>' +
            '<p class="text-xs text-gray-300 truncate font-bold" title="' + n.name + '">' + n.name + '</p>' +
            '<p class="text-xs text-green-400">' + realmText + '</p>' +
            '<p class="text-xs text-gray-500">' + n.occupation + '</p>' +
            '<button onclick="window.showNPCDialog(\'' + npcId + '\')" class="mt-1 text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-0.5 rounded w-full">对话</button>' +
            '</div>';
    }).join('');
}

// ============ 显示门派面板（v8.5 增强版） ============
function showSectPanel(sectName) {
    const sect = window.sectsData?.[sectName];
    if (!sect) return;
    
    const ds = window.discipleState || {};
    const isMember = ds.isInSect && ds.sectId === sectName;
    
    // 获取门派内部数据
    var internal = window.SECT_INTERNAL?.[sectName];
    if (!internal && typeof window.initAllSectInternal === 'function') {
        try { window.initAllSectInternal(); } catch(e) {}
        internal = window.SECT_INTERNAL?.[sectName];
    }
    
    // 所有门派视图共用唯一动态节点。
    let panel = ensureSectPanel();
    panel.classList.remove('hidden');
    
    // 构建面板
    panel.innerHTML = '' +
        '<div class="bg-gray-900 rounded-xl border-2 border-yellow-600/50 p-6">' +
        // 头部
        '<div class="flex justify-between items-start mb-4">' +
        '<div>' +
        '<h2 class="text-2xl font-bold text-yellow-400">🏛️ ' + sectName + '</h2>' +
        '<div class="flex gap-2 mt-2 flex-wrap">' +
        '<span class="px-2 py-0.5 rounded text-xs font-bold ' + (
            sect.type === '正道' ? 'bg-green-900 text-green-400' :
            sect.type === '邪派' ? 'bg-red-900 text-red-400' :
            'bg-yellow-900 text-yellow-400'
        ) + '">' + sect.type + '</span>' +
        '<span class="text-xs text-gray-400">📍 ' + (sect.location || '未知') + '</span>' +
        '<span class="text-xs text-gray-400">⚔️ ' + (sect.power || '未知') + '</span>' +
        '<span class="text-xs text-gray-400">🗡️ ' + (sect.weapons || '未知') + '</span>' +
        '</div></div>' +
        '<div class="flex gap-2">' +
        (!isMember
            ? '<button onclick="joinSect(\'' + sectName + '\')" class="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded text-sm font-bold">加入门派</button>'
            : '<button onclick="leaveSect()" class="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded text-sm font-bold">退出门派</button>') +
        '<button onclick="closeSectPanel()" class="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1.5 rounded text-sm">✕ 离开</button>' +
        '</div></div>' +
        // 描述
        '<p class="text-gray-300 text-sm mb-4">' + (sect.desc || '暂无描述') + '</p>' +
        // 门派概况（新增加：立派时间/弟子数/士气/影响力）
        (internal ? '' +
            '<div class="grid grid-cols-4 gap-2 mb-4">' +
            '<div class="bg-gray-800/50 p-2 rounded text-center"><p class="text-xs text-gray-400">立派</p><p class="text-yellow-400 text-xs font-bold">' + (internal.founded || '未知') + '</p></div>' +
            '<div class="bg-gray-800/50 p-2 rounded text-center"><p class="text-xs text-gray-400">弟子</p><p class="text-blue-400 text-xs font-bold">' + (internal.disciples || '?') + '人</p></div>' +
            '<div class="bg-gray-800/50 p-2 rounded text-center"><p class="text-xs text-gray-400">士气</p><p class="' + (internal.morale >= 70 ? 'text-green-400' : internal.morale >= 50 ? 'text-yellow-400' : 'text-red-400') + ' text-xs font-bold">' + (internal.morale || '?') + '</p></div>' +
            '<div class="bg-gray-800/50 p-2 rounded text-center"><p class="text-xs text-gray-400">影响力</p><p class="text-purple-400 text-xs font-bold">' + (internal.influence || '?') + '</p></div>' +
            '</div>'
            : '<div class="bg-gray-800/30 p-2 rounded mb-3 text-center"><p class="text-xs text-gray-500">门派概况数据加载中...</p></div>') +
        // 成员状态栏（仅成员）
        (isMember ? '' +
            '<div class="grid grid-cols-4 gap-2 mb-4">' +
            '<div class="bg-gray-800 p-2 rounded text-center"><p class="text-xs text-gray-400">职位</p><p class="text-purple-400 font-bold text-sm">' + (ds.rankName || '外门弟子') + '</p></div>' +
            '<div class="bg-gray-800 p-2 rounded text-center"><p class="text-xs text-gray-400">贡献</p><p class="text-green-400 font-bold text-sm">' + (ds.contribution || 0) + '</p></div>' +
            '<div class="bg-gray-800 p-2 rounded text-center"><p class="text-xs text-gray-400">弟子等级</p><p class="text-blue-400 font-bold text-sm">Lv.' + (ds.level || 1) + '</p></div>' +
            '<div class="bg-gray-800 p-2 rounded text-center"><p class="text-xs text-gray-400">完成任务</p><p class="text-white font-bold text-sm">' + (ds.tasksCompleted || 0) + '</p></div>' +
            '</div>'
            : '<div class="bg-gray-800/40 p-3 rounded mb-4 text-center"><p class="text-gray-400 text-sm">加入此门派后可解锁门派设施、任务与资源</p></div>') +
        // 设施列表
        '<h3 class="text-lg font-bold text-blue-400 mb-2">🏛️ 门派设施</h3>' +
        '<div class="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">' +
        renderSectFacilitiesForPanel(sectName, isMember) +
        '</div>' +
        // 任务列表（仅成员）
        (isMember ? '' +
            '<h3 class="text-lg font-bold text-green-400 mb-2">📋 门派任务</h3>' +
            '<div class="space-y-1 mb-4">' + renderSectTasksForPanel() + '</div>'
            : '') +
        // 弟子列表（仅成员）
        (isMember ? '' +
            '<h3 class="text-lg font-bold text-cyan-400 mb-2">👥 门派弟子</h3>' +
            '<div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">' + renderSectDisciplesForPanel(sectName) + '</div>'
            : '') +
        // 操作按钮
        '<div class="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-700">' +
        (isMember ? '' +
            '<button onclick="openFacilityUI()" class="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-xs">🏛️ 设施总览</button>' +
            '<button onclick="openSectTaskUI()" class="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-xs">📋 任务面板</button>' +
            '<button onclick="promoteDisciple()" class="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded text-xs">⬆️ 晋升</button>' +
            '<button onclick="collectSectResources()" class="bg-yellow-600 hover:bg-yellow-500 text-gray-900 px-3 py-1 rounded text-xs">💰 俸禄</button>' +
            '<button onclick="openContributionShop()" class="bg-amber-600 hover:bg-amber-500 text-white px-3 py-1 rounded text-xs">🎁 贡献兑换</button>' +
            '<button onclick="initiateSectWarPrompt()" class="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-xs">⚔️ 战争</button>' +
            '<button onclick="holdSectMeeting(\'' + sectName + '\')" class="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1 rounded text-xs">🏛️ 会议</button>'
            : '<button onclick="joinSect(\'' + sectName + '\')" class="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-xs">加入门派</button>') +
        '</div></div>';
    
    // 更新地图高亮
    document.querySelectorAll('.map-sect').forEach(function(s) { s.style.opacity = '0.4'; });
    var sectEl = document.querySelector('[data-sect="' + sectName + '"]');
    if (sectEl) sectEl.style.opacity = '1';
}

// ============ 快速战争入口（兼容现有函数） ============
function initiateSectWarPrompt() {
    var sects = Object.keys(window.sectsData || {});
    var target = sects[Math.floor(Math.random() * sects.length)];
    if (target === currentSect) {
        target = sects[(sects.indexOf(target) + 1) % sects.length];
    }
    if (typeof initiateSectWar === 'function') {
        var result = initiateSectWar(target);
        if (result) {
            showMessage('⚔️ 对 ' + target + ' 发动战争' + (result ? ' 胜利！' : ' 失败...'), result ? 'success' : 'error');
        }
    } else {
        showMessage('宗门战争系统未就绪', 'info');
    }
}

// ============ 导出到全局 ============
window.enterSect = enterSect;
window.closeSectPanel = closeSectPanel;
window.ensureSectPanel = ensureSectPanel;
window.showSectPanel = showSectPanel;
window.renderSectFacilitiesForPanel = renderSectFacilitiesForPanel;
window.renderSectTasksForPanel = renderSectTasksForPanel;
window.renderSectDisciplesForPanel = renderSectDisciplesForPanel;
window.initiateSectWarPrompt = initiateSectWarPrompt;

// ============ 初始化 ============
function initCityLifeSystem() {
    if (typeof window !== 'undefined') {
        window.CITY_ATMOSPHERE = CITY_ATMOSPHERE;
        window.getCityAtmosphereDescription = getCityAtmosphereDescription;
        window.getCityCitizens = getCityCitizens;
        window.chatWithCitizen = chatWithCitizen;
        window.showCityLifeOnEnter = showCityLifeOnEnter;
        window.exploreCity = exploreCity;
        window.getCurrentCityEvent = getCurrentCityEvent;
        window.refreshCityCitizens = refreshCityCitizens;
        window.initCityLifeSystem = initCityLifeSystem;
    }
}

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCityLifeSystem);
    } else {
        initCityLifeSystem();
    }
}