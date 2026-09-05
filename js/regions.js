// ==================== 仙路长青 - 地区与城市数据（v2.0 区域特性扩展） ====================

// 地图数据：地区描述与城市列表
const mapData = {
    '中州': { desc: '天下之中，灵气充沛。帝都长安乃万仙汇聚之地，太虚山传闻有上古遗迹。', cities: ['帝都 · 长安', '洛水城', '太虚山'] },
    '东荒': { desc: '苍茫林海，生机盎然。青木城以灵药闻名，蓬莱仙岛隐于东海烟波之中。', cities: ['青木城', '蓬莱仙岛', '东海龙宫'] },
    '南疆': { desc: '烈焰与毒瘴交织之地。炎城建于火山之巅，万毒谷中藏有上古毒经。', cities: ['炎城', '万毒谷', '凤凰巢'] },
    '西漠': { desc: '黄沙万里，佛法东渐。金城盛产灵石矿脉，大漠深处有古佛国遗址。', cities: ['金城', '大漠孤城', '佛国遗址'] },
    '北冥': { desc: '极寒冰原，剑气纵横。万剑宗屹立北境，极寒之地传闻镇压着远古大妖。', cities: ['冰原城', '极寒之地', '万剑宗'] },
    '蜀地': { desc: '蜀道之难，剑修圣地。剑阁藏天下名剑，青城山乃道门祖庭之一。', cities: ['剑阁', '青城山'] },
    '东南海域': { desc: '碧波万顷，仙岛棋布。碧落仙宫为海外散修聚集之地，鲛人镇以珍珠闻名。', cities: ['碧落仙宫', '鲛人镇'] },
    // v20.53 高位面：灵气/魔气成界，寻常脚力到不了（跨界只走位面之门，见 map/high-planes.js）
    '灵界': { desc: '位面之上，灵气凝成实质。蓬莱仙境是仙家会盟之地，九天罡风带则连元婴修士也要以护体真元遮身。', cities: ['灵界·蓬莱仙境', '灵界·九天罡风带'] },
    '魔界': { desc: '浊气下沉所化的疆土。九幽深渊有魔修立市交易，血海荒原上魔物逐血而行，无人引路者进得去出不来。', cities: ['魔界·九幽深渊', '魔界·血海荒原'] }
};

// ==================== 区域特性系统 ====================
// 每个地区的独立特性：怪物池、资源分布、天气、特殊事件
const REGION_FEATURES = {
    '中州': {
        monsters: {
            common: ['山贼', '流寇', '野狼'],
            elite: ['武林高手', '妖兽护卫'],
            boss: ['山贼头领', '千年妖狼']
        },
        resources: {
            mine: ['mat_iron_ore', 'mat_copper_ore', 'mat_refined_iron'],
            herb: ['mat_licorice', 'mat_skullcap', 'mat_lingzhi'],
            special: ['mat_five_element_essence']
        },
        weather: ['晴', '多云', '小雨', '阴'],
        special: '帝都拍卖会',
        bonus: { copper: 1.2, trade: 1.15 }
    },
    '东荒': {
        monsters: {
            common: ['林间野猪', '毒蛇', '妖猴'],
            elite: ['千年树妖', '妖兽统领'],
            boss: ['青龙残魂', '妖王']
        },
        resources: {
            mine: ['mat_iron_ore', 'mat_tin_ore'],
            herb: ['mat_ginseng', 'mat_lingzhi', 'mat_thousand_lingzhi', 'mat_he_shou_wu'],
            special: ['mat_wood_essence', 'mat_green_wood_essence']
        },
        weather: ['晴', '多云', '雨', '大雾'],
        special: '蓬莱仙缘',
        bonus: { herb: 1.3, wood: 1.2 }
    },
    '南疆': {
        monsters: {
            common: ['毒蝎', '火蛇', '熔岩兽'],
            elite: ['炎魔', '毒王'],
            boss: ['火凤', '上古毒龙']
        },
        resources: {
            mine: ['mat_volcanic_rock', 'mat_fire_crystal', 'mat_purple_gold'],
            herb: ['mat_dragon_grass', 'mat_phoenix_blood_grass', 'mat_poison_mushroom'],
            special: ['mat_fire_essence', 'mat_poison_essence']
        },
        weather: ['晴', '酷热', '火山灰', '毒雾'],
        special: '火山爆发',
        bonus: { fire: 1.3, poison: 1.4 }
    },
    '西漠': {
        monsters: {
            common: ['沙漠蝎', '秃鹫', '沙虫'],
            elite: ['沙匪首领', '远古蝎皇'],
            boss: ['沙暴龙王', '古佛守卫']
        },
        resources: {
            mine: ['mat_gold_sand', 'mat_meteorite', 'mat_star_iron'],
            herb: ['mat_cactus_flower', 'mat_desert_ginseng'],
            special: ['mat_earth_essence', 'mat_sun_stone']
        },
        weather: ['晴', '沙尘暴', '酷热', '干旱'],
        special: '古佛遗迹',
        bonus: { defense: 1.15, earth: 1.3 }
    },
    '北冥': {
        monsters: {
            common: ['雪狼', '冰熊', '雪鹰'],
            elite: ['冰霜巨人', '雪妖'],
            boss: ['冰龙', '远古冰凤']
        },
        resources: {
            mine: ['mat_cold_iron', 'mat_ice_crystal', 'mat_mithril'],
            herb: ['mat_snow_lotus', 'mat_ice_herb'],
            special: ['mat_water_essence', 'mat_moon_stone']
        },
        weather: ['雪', '暴风雪', '阴', '极光'],
        special: '极光天象',
        bonus: { ice: 1.4, water: 1.2 }
    },
    '蜀地': {
        monsters: {
            common: ['竹叶青蛇', '剑齿虎', '山魈'],
            elite: ['剑修亡魂', '妖兽剑客'],
            boss: ['剑魔残魂', '上古剑灵']
        },
        resources: {
            mine: ['mat_refined_iron', 'mat_dark_iron', 'mat_meteorite'],
            herb: ['mat_bamboo_essence', 'mat_lingzhi'],
            special: ['mat_metal_essence', 'mat_sword_soul']
        },
        weather: ['晴', '多云', '雾', '雨'],
        special: '剑冢开启',
        bonus: { sword: 1.3, cultivation: 1.1 }
    },
    '东南海域': {
        monsters: {
            common: ['海蛇', '蟹妖', '鱼人'],
            elite: ['鲨鱼精', '海妖'],
            boss: ['蛟龙', '海神化身']
        },
        resources: {
            mine: ['mat_coral', 'mat_pearl', 'mat_sea_crystal'],
            herb: ['mat_seaweed', 'mat_coral_flower'],
            special: ['mat_water_essence', 'mat_spirit_pearl']
        },
        weather: ['晴', '多云', '台风', '海雾'],
        special: '海市蜃楼',
        bonus: { water: 1.3, luck: 1.15 }
    }
};

// 获取地区怪物池
function getRegionMonsters(region, type = 'common') {
    const features = REGION_FEATURES[region];
    if (!features) return [];
    return features.monsters?.[type] || [];
}

// 获取地区资源
function getRegionResources(region, resourceType = 'herb') {
    const features = REGION_FEATURES[region];
    if (!features) return [];
    return features.resources?.[resourceType] || [];
}

// 获取地区天气
function getRegionWeather(region) {
    const features = REGION_FEATURES[region];
    if (!features) return ['晴'];
    const weathers = features.weather || ['晴'];
    return weathers[Math.floor(Math.random() * weathers.length)];
}

// 获取地区加成
function getRegionBonus(region) {
    const features = REGION_FEATURES[region];
    return features?.bonus || {};
}

// 获取地区特殊事件
function getRegionSpecialEvent(region) {
    const features = REGION_FEATURES[region];
    return features?.special || null;
}

// ==================== 导出到 window 对象 ====================
// ============ 地区危险等级（v10.0 新增） ============
var REGION_DANGER_LEVELS = {
    '中州': { level: 1, label: '安全', color: 'text-green-400', desc: '帝都所在，治安良好' },
    '东荒': { level: 2, label: '低危', color: 'text-blue-400', desc: '林间有野兽出没' },
    '南疆': { level: 4, label: '高危', color: 'text-orange-400', desc: '毒瘴火山，危机四伏' },
    '西漠': { level: 3, label: '中危', color: 'text-yellow-400', desc: '沙漠环境恶劣' },
    '北冥': { level: 4, label: '高危', color: 'text-orange-400', desc: '极寒冰原，妖兽横行' },
    '蜀地': { level: 3, label: '中危', color: 'text-yellow-400', desc: '蜀道艰险，剑修云集' },
    '东南海域': { level: 2, label: '低危', color: 'text-blue-400', desc: '海外仙岛，相对安宁' }
};

function getRegionDangerLevel(region) {
    var info = REGION_DANGER_LEVELS[region];
    return info || { level: 1, label: '未知', color: 'text-gray-400', desc: '' };
}

// ============ 旅行路线预览（v10.0 新增） ============
var CITY_DISTANCE_MAP = {
    '帝都 · 长安': { '洛水城': 60, '太虚山': 120, '青木城': 240, '蓬莱仙岛': 360, '东海龙宫': 420, '金城': 300, '大漠孤城': 480, '剑阁': 180, '青城山': 200, '冰原城': 360, '极寒之地': 480, '万剑宗': 400, '炎城': 300, '万毒谷': 360, '凤凰巢': 420, '碧落仙宫': 300, '鲛人镇': 360 },
    '洛水城': { '帝都 · 长安': 60, '太虚山': 90, '青木城': 200, '剑阁': 150, '青城山': 180 },
    '太虚山': { '帝都 · 长安': 120, '洛水城': 90, '青木城': 180, '蓬莱仙岛': 300 },
    '青木城': { '帝都 · 长安': 240, '太虚山': 180, '蓬莱仙岛': 150, '东海龙宫': 200, '洛水城': 200 },
    '蓬莱仙岛': { '青木城': 150, '东海龙宫': 120, '帝都 · 长安': 360, '碧落仙宫': 200 },
    '东海龙宫': { '蓬莱仙岛': 120, '青木城': 200, '碧落仙宫': 180, '鲛人镇': 150 },
    '炎城': { '万毒谷': 90, '凤凰巢': 120, '帝都 · 长安': 300, '金城': 240 },
    '万毒谷': { '炎城': 90, '凤凰巢': 100 },
    '凤凰巢': { '炎城': 120, '万毒谷': 100 },
    '金城': { '大漠孤城': 180, '佛国遗址': 240, '帝都 · 长安': 300, '炎城': 240 },
    '大漠孤城': { '金城': 180, '佛国遗址': 120 },
    '佛国遗址': { '金城': 240, '大漠孤城': 120 },
    '冰原城': { '极寒之地': 150, '万剑宗': 120, '帝都 · 长安': 360 },
    '极寒之地': { '冰原城': 150, '万剑宗': 200 },
    '万剑宗': { '冰原城': 120, '极寒之地': 200 },
    '剑阁': { '青城山': 60, '帝都 · 长安': 180, '洛水城': 150 },
    '青城山': { '剑阁': 60, '帝都 · 长安': 200, '洛水城': 180 },
    '碧落仙宫': { '鲛人镇': 100, '蓬莱仙岛': 200, '东海龙宫': 180, '帝都 · 长安': 300 },
    '鲛人镇': { '碧落仙宫': 100, '东海龙宫': 150 }
};

function getTravelDistance(fromCity, toCity) {
    if (!fromCity || !toCity) return 120; // 默认2小时
    var clean = function(s) { return s.replace(/\s+/g, ' ').trim(); };
    var f = clean(fromCity);
    var t = clean(toCity);
    if (f === t) return 0;
    var map = CITY_DISTANCE_MAP[f];
    if (map && map[t]) return map[t];
    // 反向查找
    var map2 = CITY_DISTANCE_MAP[t];
    if (map2 && map2[f]) return map2[f];
    // 估算：不同地区=远，同地区=近
    var regionFrom = '', regionTo = '';
    for (var r in mapData) {
        if (mapData[r].cities.indexOf(f) >= 0) regionFrom = r;
        if (mapData[r].cities.indexOf(t) >= 0) regionTo = r;
    }
    return regionFrom === regionTo ? 60 : 240;
}

function getTravelTimePreview(fromCity, toCity, method) {
    var dist = getTravelDistance(fromCity, toCity);
    var baseTime = 120; // 步行
    if (method === 'horse') baseTime = 60;
    else if (method === 'float_sword') baseTime = 20;
    else if (method === 'teleport') baseTime = 5;
    var time = Math.max(5, Math.round(baseTime * (dist / 60)));
    return time;
}

window.REGION_DANGER_LEVELS = REGION_DANGER_LEVELS;
window.getRegionDangerLevel = getRegionDangerLevel;
window.getTravelDistance = getTravelDistance;
window.getTravelTimePreview = getTravelTimePreview;
window.CITY_DISTANCE_MAP = CITY_DISTANCE_MAP;
// v20.53 断线补电：mapData/REGION_FEATURES 此前只活在脚本顶层 const 里，从不挂 window——
// 而 travel-system / beast-taming / location-system / reputation-system / app 十来处读的全是 window.mapData，
// 等于所有"按地区反查"一直落空。此处补挂，行为由各消费方既有的 `window.mapData || {}` 兜底保证不变。
window.mapData = mapData;
window.REGION_FEATURES = REGION_FEATURES;
window.getRegionMonsters = getRegionMonsters;
window.getRegionResources = getRegionResources;
window.getRegionSpecialEvent = getRegionSpecialEvent;
window.getRegionBonus = getRegionBonus;