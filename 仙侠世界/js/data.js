// ==================== 仙路长青 - 基础游戏数据 ====================

// 属性分类定义
const attributes = {
    // v9.8：界面显示「神识」（内部英文键仍为 intelligence）
    main: ['力量', '灵巧', '神识', '意志', '体质', '经脉'],
    combat: ['内功', '轻功', '绝技', '拳掌', '剑法', '刀法', '长兵', '奇门', '射术'],
    life: ['医术', '毒术', '学识', '口才', '采伐', '种植', '锻造', '炼制', '烹饪']
};

// 战斗属性（百分比制，0-100）
const combatStats = [
    { id: 'hit', name: '命中', icon: '🎯', desc: '攻击命中率基础值，影响攻击是否命中敌人', default: 85, tooltip: '命中率 = 基础值 + 装备加成 + 功法加成。如果命中率低于敌人的闪避率，攻击会miss。' },
    { id: 'dodge', name: '闪避', icon: '💨', desc: '闪避攻击的概率，完全回避攻击', default: 10, tooltip: '闪避率 = 基础值 + 装备加成 + 功法加成。闪避成功后该次攻击完全不造成伤害。' },
    { id: 'block', name: '格挡', icon: '🛡️', desc: '格挡攻击的概率，部分减免伤害', default: 10, tooltip: '格挡成功后伤害减免50%。格挡有累计惩罚，连续格挡会降低后续格挡成功率。' },
    { id: 'parry', name: '化解', icon: '🌀', desc: '化解攻击力的概率，减少伤害', default: 10, tooltip: '化解成功后伤害减免30%。化解比格挡惩罚低但减免也少。' },
    { id: 'crit', name: '暴击', icon: '⚡', desc: '暴击触发概率，造成额外伤害', default: 5, tooltip: '暴击伤害 = 普通伤害 × 暴击倍率。暴击是不可闪避的。' },
    { id: 'critDmg', name: '暴击倍率', icon: '💥', desc: '暴击时伤害倍率(%)', default: 150, suffix: '%', tooltip: '暴击时造成的伤害倍数。150%表示暴击造成1.5倍伤害。' },
    { id: 'counter', name: '反击', icon: '↩️', desc: '被攻击时反击的概率', default: 5, tooltip: '反击成功率 = 基础值 + 装备加成。反击会对攻击者造成50%的伤害。' },
    { id: 'penetrate', name: '破击', icon: '🔨', desc: '无视防御的概率', default: 5, tooltip: '破击成功后忽略敌人50%的防御力。' },
    { id: 'toughness', name: '韧性', icon: '💪', desc: '降低被暴击概率', default: 5, tooltip: '韧性越高，敌人暴击你的概率越低。每1点韧性降低2%被暴击概率。' },
    { id: 'poisonRes', name: '毒抗', icon: '🛡️', desc: '抵抗毒素伤害的能力', default: 0, tooltip: '毒抗越高，中毒后受到的持续伤害越低，恢复越快。某些敌人和地形会造成中毒效果。' }
];

// 回避方式数据
const avoidanceMethods = [
    { id: 'dodge', name: '闪避', icon: '💨', penalty: 20, desc: '完全回避攻击，后续回避-20%成功率' },
    { id: 'block', name: '格挡', icon: '🛡️', penalty: 40, desc: '格挡部分伤害，后续回避-40%成功率' },
    { id: 'parry', name: '化解', icon: '🌀', penalty: 10, desc: '化解攻击力道，后续回避-10%成功率' }
];

// 回避优先级默认排序（从上到下）
let avoidancePriority = ['dodge', 'block', 'parry'];

// 灵根名称与颜色
const rootNames = ['金', '木', '水', '火', '土'];
const rootColors = ['text-yellow-400', 'text-green-400', 'text-blue-400', 'text-red-400', 'text-amber-500'];

// 身体部位数据（耐久度0-100，颜色从绿到红10级）
// 统一战斗系统和人物面板的部位系统
// 22个部位（含左右对称），与 battle.js 的 BODY_PARTS 保持一致
const bodyParts = [
    { id: 'brain', name: '脑', desc: '神识中枢，受损影响智力与意志', stat: 'intelligence' },
    { id: 'eyes', name: '眼', desc: '视觉所系，受损影响命中与察觉', stat: 'dexterity' },
    { id: 'jaw', name: '下颌', desc: '言语之门，受损影响口才与进食', stat: 'willpower' },
    { id: 'head', name: '头', desc: '六阳之首，受损影响整体状态' },
    { id: 'neck', name: '颈', desc: '气血通道，受损影响经脉运转', stat: 'constitution' },
    { id: 'chest', name: '胸', desc: '气息之府，受损影响内功与防御', stat: 'strength' },
    { id: 'abdomen', name: '腹', desc: '消化之器，受损影响体质与恢复', stat: 'constitution' },
    { id: 'dantian', name: '丹田', desc: '修仙根本，受损影响所有内力相关能力', stat: 'meridian' },
    { id: 'waist', name: '腰', desc: '力之枢纽，受损影响轻功与闪避', stat: 'dexterity' },
    { id: 'pelvis', name: '盆', desc: '下盘根基，受损影响平衡与稳定', stat: 'willpower' },
    { id: 'upperArmL', name: '左上臂', desc: '发力之源，受损影响力量与攻击', stat: 'strength' },
    { id: 'upperArmR', name: '右上臂', desc: '发力之源，受损影响力量与攻击', stat: 'strength' },
    { id: 'forearmL', name: '左下臂', desc: '精细操控，受损影响灵巧与技艺', stat: 'dexterity' },
    { id: 'forearmR', name: '右下臂', desc: '精细操控，受损影响灵巧与技艺', stat: 'dexterity' },
    { id: 'handL', name: '左手', desc: '触感所在，受损影响锻造与炼制', stat: 'dexterity' },
    { id: 'handR', name: '右手', desc: '触感所在，受损影响锻造与炼制', stat: 'dexterity' },
    { id: 'thighL', name: '左大腿', desc: '行动之力，受损影响移动速度', stat: 'strength' },
    { id: 'thighR', name: '右大腿', desc: '行动之力，受损影响移动速度', stat: 'strength' },
    { id: 'calfL', name: '左小腿', desc: '弹跳之基，受损影响跳跃与闪转', stat: 'constitution' },
    { id: 'calfR', name: '右小腿', desc: '弹跳之基，受损影响跳跃与闪转', stat: 'constitution' },
    { id: 'footL', name: '左脚', desc: '立身之本，受损影响站立与移动', stat: 'dexterity' },
    { id: 'footR', name: '右脚', desc: '立身之本，受损影响站立与移动', stat: 'dexterity' }
];

// 耐久度颜色映射（与 SVG / 数字同步）
// 100 保持原绿；99-80 #66CC00；79-50 #FFDC00；49-30 #FF851B；29-11 #8B0000；10-1 #3f0000；0 黑
const durabilityColors = [
    '#22c55e', // 100 完好
    '#66CC00', // 99-80
    '#FFDC00', // 79-50
    '#FF851B', // 49-30
    '#8B0000', // 29-11
    '#3f0000', // 10-1
    '#000000'  // 0
];

function getDurabilityColor(value) {
    var v = Number(value);
    if (isNaN(v)) v = 100;
    if (v >= 100) return durabilityColors[0];
    if (v >= 80) return durabilityColors[1];
    if (v >= 50) return durabilityColors[2];
    if (v >= 30) return durabilityColors[3];
    if (v >= 11) return durabilityColors[4];
    if (v >= 1) return durabilityColors[5];
    return durabilityColors[6];
}

function getDurabilityLabel(value) {
    var v = Number(value);
    if (isNaN(v)) v = 100;
    if (v >= 100) return '完好';
    if (v >= 80) return '健康';
    if (v >= 50) return '轻微损伤';
    if (v >= 30) return '中度损伤';
    if (v >= 11) return '重度损伤';
    if (v >= 1) return '濒临毁坏';
    return '尽毁';
}

// 修仙境界数据（9境界：炼气→筑基→金丹→元婴→化神→炼虚→合体→大乘→渡劫）
const realmLevels = [
    { realm: '炼气', layers: 9, baseQi: 100 },
    { realm: '筑基', layers: 9, baseQi: 300 },
    { realm: '金丹', layers: 9, baseQi: 600 },
    { realm: '元婴', layers: 9, baseQi: 1200 },
    { realm: '化神', layers: 9, baseQi: 2500 },
    { realm: '炼虚', layers: 9, baseQi: 5000 },
    { realm: '合体', layers: 9, baseQi: 8000 },
    { realm: '大乘', layers: 9, baseQi: 12000 },
    { realm: '渡劫', layers: 9, baseQi: 15000 }
];

// 随机地图地形类型
const terrainTypes = [
    { id: 'plain', name: '平原', icon: '🌿', color: '#4ade80', desc: '开阔平地，灵气稀薄', effect: '无特殊效果', moveCost: 1 },
    { id: 'forest', name: '林地', icon: '🌲', color: '#16a34a', desc: '树木丛生，木灵气充沛', effect: '木灵根修炼速度+10%', moveCost: 2 },
    { id: 'mountain', name: '山地', icon: '⛰️', color: '#78716c', desc: '山石嶙峋，土灵气充沛', effect: '土灵根修炼速度+10%', moveCost: 3 },
    { id: 'river', name: '河流', icon: '🌊', color: '#60a5fa', desc: '水流湍急，水灵气充沛', effect: '水灵根修炼速度+10%', moveCost: 2 },
    { id: 'volcano', name: '火山', icon: '🌋', color: '#ef4444', desc: '熔岩之地，火灵气充沛', effect: '火灵根修炼速度+10%', moveCost: 4 },
    { id: 'mine', name: '矿脉', icon: '💎', color: '#fbbf24', desc: '灵石矿脉，金灵气充沛', effect: '金灵根修炼速度+10%', moveCost: 2 },
    { id: 'swamp', name: '沼泽', icon: '🪵', color: '#a3e635', desc: '瘴气弥漫，毒物横行', effect: '移动有5%概率中毒', moveCost: 3 },
    { id: 'desert', name: '沙漠', icon: '🏜️', color: '#f59e0b', desc: '黄沙漫天，火土双属性', effect: '火/土灵根修炼速度+5%', moveCost: 2 },
    { id: 'snow', name: '雪原', icon: '❄️', color: '#93c5fd', desc: '冰天雪地，水灵气变异', effect: '冰变异灵根修炼速度+15%', moveCost: 3 },
    { id: 'lake', name: '湖泊', icon: '🏞️', color: '#2563eb', desc: '碧波万顷，灵气纯净', effect: '真气恢复速度+20%', moveCost: 1 }
];

// 随机地图建筑类型
const buildingTypes = [
    { id: 'town', name: '小镇', icon: '🏘️', color: '#d1d5db', desc: '凡人聚居之地', effect: '可购买日常物品，休息恢复精力', action: 'rest' },
    { id: 'market', name: '坊市', icon: '🏪', color: '#fbbf24', desc: '修士交易之所', effect: '可买卖丹药、法器、功法', action: 'trade' },
    { id: 'temple', name: '寺庙', icon: '🛕', color: '#c084fc', desc: '佛门清净地', effect: '可参悟佛法，提升意志', action: 'meditate' },
    { id: 'tavern', name: '酒馆', icon: '🍺', color: '#fb923c', desc: '江湖消息集散地', effect: '可打听消息，接取委托', action: 'info' },
    { id: 'cavern', name: '洞府', icon: '🕳️', color: '#6b7280', desc: '前人遗留洞府', effect: '可能藏有功法或丹药', action: 'explore' },
    { id: 'ruins', name: '遗迹', icon: '🏚️', color: '#9ca3af', desc: '上古宗门废墟', effect: '探索可能获得传承', action: 'explore' },
    { id: 'peak', name: '灵峰', icon: '🏔️', color: '#e2e8f0', desc: '灵气汇聚之峰', effect: '修炼速度+30%', action: 'cultivate' },
    { id: 'spring', name: '灵泉', icon: '💧', color: '#38bdf8', desc: '地脉灵泉涌出', effect: '浸泡恢复全部真气', action: 'recover' },
    { id: 'forge', name: '铸剑台', icon: '⚒️', color: '#f97316', desc: '古炼器师遗留', effect: '可强化武器', action: 'craft' },
    { id: 'garden', name: '药园', icon: '🌺', color: '#ec4899', desc: '灵药种植园', effect: '可采集灵药', action: 'gather' }
];

// ==================== 境界突破配置（v9.7 新增） ====================
const REALM_CONFIG = {
    realms: [
        { name: '炼气', index: 0, qiBase: 50, essenceBase: 30, temperingBase: 5 },
        { name: '筑基', index: 1, qiBase: 100, essenceBase: 900, temperingBase: 70 },
        { name: '金丹', index: 2, qiBase: 200, essenceBase: 10000, temperingBase: 430 },
        { name: '元婴', index: 3, qiBase: 400, essenceBase: 90000, temperingBase: 1600 },
        { name: '化神', index: 4, qiBase: 800, essenceBase: 700000, temperingBase: 6500 },
        { name: '炼虚', index: 5, qiBase: 1600, essenceBase: 5000000, temperingBase: 28000 },
        { name: '合体', index: 6, qiBase: 3200, essenceBase: 38000000, temperingBase: 130000 },
        { name: '大乘', index: 7, qiBase: 6400, essenceBase: 300000000, temperingBase: 650000 },
        { name: '渡劫', index: 8, qiBase: 12800, essenceBase: 2400000000, temperingBase: 3200000 }
    ],
    layerMultipliers: [1.0, 1.7, 2.8, 4.2, 6.0, 8.0, 10.5, 13.5, 17.5]
};

// ==================== 导出到 window 对象 ====================
window.attributes = attributes;
window.combatStats = combatStats;
window.avoidanceMethods = avoidanceMethods;
window.avoidancePriority = avoidancePriority;
window.bodyParts = bodyParts;
window.durabilityColors = durabilityColors;
window.getDurabilityColor = getDurabilityColor;
window.getDurabilityLabel = getDurabilityLabel;
window.realmLevels = realmLevels;
window.terrainTypes = terrainTypes;
window.buildingTypes = buildingTypes;
window.rootNames = rootNames;
window.rootColors = rootColors;
window.REALM_CONFIG = REALM_CONFIG;