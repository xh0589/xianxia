// ==================== randomMap.js ====================
// 野外地图（v20.56 重做）。
//   地形生成交给 wild-terrain.js（WildTerrain，纯函数、种子确定）；
//   本文件负责：状态 / SVG 渲染 / 交互（点击寻路、采集、地物互动）/ 与既有系统接线 / 存档。
//
// 与旧版的差别：
//   · 地图从 12×16 逐格掷骰 → 20×26 成片地形 + POI 先行 + 古道成网
//   · 迷雾三态：未知 / 已见（记忆） / 可见；可见半径随地形、天象、时辰变化
//   · 建筑不再是随机掷出的图标，而是落在图上的真实地物，点了接真系统
//   · 远格自动寻路，按地形与天象结耗时；途中遭遇会打断行程
//   · 一域一图：探索进度随存档走（StateRegistry: wildMap），不再一键免费重开
// 依赖加载顺序：wild-terrain.js → 本文件 → battle.js / app.js 等运行期系统
//   （对 ResourcePoints / DungeonDynamic / landmark / shop 的调用都在交互期发生，晚于其加载）

// ===== 全局配置 =====
const MAP_CONFIG = {
    ROWS: 20,           // 地图行数
    COLS: 26,           // 地图列数
    CELL_SIZE: 40,      // 每个格子像素大小（SVG单位）
    VIEWPORT_ROWS: 9,   // 可见区域行数（可滚动）
    VIEWPORT_COLS: 16   // 可见区域列数
};

// 地物类型语义（地形表在 WildTerrain.TERRAIN）
const BUILDINGS = {
    TOWN: { name: '村镇', effect: '打尖休息', symbol: '🏘️' },
    MARKET: { name: '坊市', effect: '交易', symbol: '🏪' },
    CAVE: { name: '洞府', effect: '修炼', symbol: '🕳️' },
    RUIN: { name: '遗迹', effect: '探索宝物', symbol: '🏛️' }
};

// 地区 ↔ 资源点/秘境的 region 叫法对齐（两套表各自为政，这里翻译）
const REGION_ALIASES = {
    '中州': ['中州', '中原', '中原深处'],
    '东荒': ['东海'],
    '南疆': ['南疆'],
    '西漠': ['西荒'],
    '北冥': ['北冥', '极北'],
    '蜀地': [],
    '东南海域': ['南海', '东海'],
    '灵界': ['天空'],
    '魔界': [],
    '天界': []
};

// 渡口（v20.59）：雇舟的船钱，以及水路上每格的行程
const FERRY_FARE = 5;
const FERRY_MIN_PER_CELL = 20;

// 第四十六波 · 泅渡与踏水：泅渡严格劣于雇舟（更慢、更累、有暗流），船家的生意抢不走；
// 金丹以上真元托底履水如地——境界头一回在「走路」这件事上显出贵贱。
const SWIM_MIN_PER_CELL = 25;       // 泅渡每格工夫（雇舟 20——人力终究不如帆）
const SWIM_ENERGY = 4;              // 泅渡每格精力
const SWIM_GATE = 15;               // 岸上入水的门槛：精力不足莫下水
const SWIM_FORCE_HP = 5;            // 已在水中精力见底：硬撑改烧气血（每格）
const WATERWALK_MIN_PER_CELL = 20;  // 踏水与雇舟同速，省的是船钱
const WATERWALK_ENERGY = 1;
const WATERWALK_TIER = 3;           // 金丹（含）以上踏水如地
let _waterEntryNoticed = false;     // 头一回下水的风味话术记一次（运行时变量，开图重置，零存档字段）
let _swimForcedNoticed = false;     // 硬撑泅渡的警告也记一次
// 第五十五波 · 泅渡湿衣损货：水里过来的，人和货都得湿（零新存档字段——湿衣是运行时旗，与 _wearyNoticed 同法；
// 损货记在镖账已有的对象里，交割折价是既有酬金的减账，零增发；船钱照旧——船家的生意旱涝保收）
const WET_DRY_MIN = 60;             // 湿衣贴身的分钟数：赶够一个时辰的路自然干（烤火/客栈即刻干）
const WET_STEP_EN = 1;              // 湿着走陆地，每格多耗的精力（湿衣坠身）
const ESCORT_WET_PER = 0.1;         // 镖货每浸一回水，交割折价一成
const ESCORT_WET_MAX = 3;           // 至多记三回——折价封顶三成（再湿货也就那样了）
let _cargoWetNoticed = false;       // 货浸水的提醒一场只念一回

// 第四十七波 · 四时改地：季节不再只是腿上的账，而是真改大地的走法——
// 冬天河面封冻成大路（船家冬歇，冰面就是冬天的渡口）、春天春汛漫过浅滩（过得去，过得慢）、
// 夏天暑热蒸瘴（沼泽毒气最凶）、秋高气爽什么都不加（没有惩罚，本身就是远行的季节）。
// 铁律：季节覆层是运行时纯函数（seasonTerrainKey），cell.terrainKey 永不改写、建图段一字不动、
// 存档里本就不存地形（每次从种子重生）——零漂移、零存档迁移。
const FORD_SPRING_MUL = 1.5;        // 春汛：浅滩耗时 ×1.5
const FORD_SPRING_HAZ_MUL = 1.5;    // 春汛：浅滩湿寒概率 ×1.5（0.06→0.09）
const SWAMP_SUMMER_HAZ_MUL = 1.3;   // 暑瘴：沼泽/瘴沼概率 ×1.3（0.10→0.13、0.20→0.26）
let _iceEntryNoticed = false;       // 头一回踏上冬冰的风味话术（运行时变量，开图翻篇，零存档字段）
let _fordFloodNoticed = false;      // 头一回春天涉水的话术也记一次
let _aloftNoticed = false;          // 第八十九波 · 头一回御空掠过天险的话术（漩涡/冰隙）也记一次
let _waterMountNoticed = false;     // 第八十九波 · 头一回乘水兽渡水的话术记一次

// ============ 地点变体（v20.61）：地点是「地方」，不是「类型」 ============
// 同是村镇，驿亭和残村不是一回事；同是遗迹，古观和古冢各有来历与各的凶险。
const POI_VARIANTS = {
    town: [
        { key: 'post', name: '驿亭', desc: '官道驿亭，往来的差人与信使都在此歇脚', rest: { cost: 4, stones: 2, hp: 22, en: 35, qi: 8 }, perk: '能打听官道上的消息' },
        { key: 'caravan', name: '篷车集', desc: '商队篷车连成一片，夜里篝火不熄', rest: { cost: 4, stones: 3, hp: 26, en: 42, qi: 10 }, perk: '商队消息灵通，能打听别处行情' },
        { key: 'hamlet', name: '残村', desc: '村子半数屋子塌了，只剩几户老人守着', rest: { cost: 6, stones: 0, hp: 12, en: 22, qi: 0 }, perk: '清净，但没什么可买' },
        { key: 'mortuary', name: '义庄', desc: '暂厝棺木的所在，睡是免费，就是阴气重', rest: { cost: 4, stones: 0, hp: 16, en: 30, qi: 6 }, risk: { chance: 0.3, qi: 10, msg: '睡到半夜，棺木那头窸窸窣窣，阴气顺着门缝渗进来。' } }
    ],
    market: [
        { key: 'dawn', name: '露水市集', desc: '天亮开市，日头一高就散', perk: '入夜就打烊' },
        { key: 'black', name: '黑市', desc: '帘子后头做买卖，卖些见不得光的东西', perk: '有稀罕物，也可能撞上巡查', risk: { chance: 0.25, battle: 'enemy' } }
    ],
    cave: [
        { key: 'heritage', name: '前人遗府', desc: '前人坐化后留下的洞府，禁制还没散尽', gainMul: 1.3, risk: { chance: 0.35, hp: 8, msg: '洞中残禁忽然反噬，一道气劲撞在胸口。' } },
        { key: 'natural', name: '天然洞窟', desc: '干燥宽敞，是个闭关的好去处', gainMul: 1.0 },
        { key: 'nest', name: '兽居改洞', desc: '原是妖兽的窝，血腥气还没散', gainMul: 1.15, risk: { chance: 0.3, battle: 'beast' } }
    ],
    ruin: [
        { key: 'heritage_hall', name: '古修洞府遗址', desc: '门庭塌了半边，残阵还在转', find: '从蒲团底下摸出前人没用完的储物', loot: ['mat_lingzhi', 'mat_refined_iron', 'mat_mithril'], risk: { chance: 0.35, hp: 8, msg: '残阵忽然一转，气劲扫过肩头。' } },
        { key: 'battlefield', name: '战场遗址', desc: '折戟沉沙，入夜有亡魂夜哭', find: '从沙土里刨出几件没烂透的旧铁', loot: ['mat_iron_ore', 'mat_copper_ore', 'mat_refined_iron'], risk: { chance: 0.3, battle: 'undead' } },
        { key: 'temple', name: '塌陷古观', desc: '殿顶塌了，神像缺了头', find: '供桌底下压着几样没烂的旧物', loot: ['pill_clarity', 'pill_energy_return', 'mat_lingzhi'], risk: { chance: 0.2, hp: 6, msg: '梁上灰土簌簌砸落，砸得人一激灵。' } },
        { key: 'tomb', name: '无名古冢', desc: '封土被盗过一轮，剩些明器', find: '盗洞边上捡着几件剩下的明器', loot: ['mat_moon_stone', 'mat_sun_stone', 'mat_copper_ore'], risk: { chance: 0.28, battle: 'undead' } }
    ],
    spring: [
        { key: 'eye', name: '灵泉眼', desc: '泉眼汩汩上涌，灵气最盛', gainMul: 1.0 },
        { key: 'marrow', name: '洗髓泉', desc: '泉水质地粘稠，据说能洗筋伐髓', gainMul: 1.5 }
    ]
};

function pickVariant(poi, rng) {
    const pool = POI_VARIANTS[poi.type];
    if (!pool || !pool.length) return null;
    const v = pool[Math.floor(rng() * pool.length)];
    poi.variant = v;
    poi.variantName = v.name;
    return v;
}

// 建图后给地标各安一个来历（种子确定，重开还是同一批「地方」）
function assignPoiVariants(pois, rng) {
    (pois || []).forEach(p => pickVariant(p, rng));
    return pois;
}

// 地形出什么（v20.57）：南疆的沼泽该出毒虫，北冥的雪线该出寒兽——
// 遭遇的名字跟地皮走，不再满天下都是同一种「狼」。
const HABITAT_FLAVOR = {
    PLAIN:    { beast: ['野狼', '赤鬃野马', '山雉'], person: ['赶路人', '行脚商人'] },
    FOREST:   { beast: ['林狼', '黑熊', '毒蛛'], person: ['采药人', '猎户'] },
    MOUNTAIN: { beast: ['岩羊', '山魈', '崖雕'], person: ['采石匠', '落单修士'] },
    SNOW:     { beast: ['雪狼', '冰蛛', '白罴'], person: ['戍边卒', '采雪人'] },
    FROZEN:   { beast: ['冻原狼', '冰甲虫'], person: ['北地流民'] },
    WATER:    { beast: ['水蛟', '青鳞鱼妖'], person: [] },
    RIVER_ICE: { beast: ['冰狼', '雪鸮', '白狐'], person: ['冰道行旅', '贩皮货商', '商队'] },   // 冬天冰面上撞见的，是陆上的活物——还有抄冰道赶路的商队（六十波）
    FORD:     { beast: ['水蛭兽', '河童'], person: ['摆渡人'] },
    DESERT:   { beast: ['沙蜥', '沙蝎', '沙狼'], person: ['驼队商旅', '马贼'] },
    SWAMP:    { beast: ['毒蟒', '瘴蚊群', '泥沼蟹'], person: ['采瘴人'] },
    VOLCANO:  { beast: ['火蜥', '熔岩蟹'], person: ['取火人'] },
    SPRING:   { beast: ['灵鹿', '泉蛇'], person: ['汲泉修士'] },
    ROAD:     { beast: ['野狗群'], person: ['商队', '镖师', '游方郎中'] }
};

// 地区加味：同一片林海，南疆有蛊、北冥有寒兽——拼在地形池后面一起抽
const REGION_WILDLIFE = {
    '中州': { beast: ['河阳野猪'], person: ['洛北镖客'] },
    '东荒': { beast: ['苍梧鹿'], person: ['青木樵夫'] },
    '南疆': { beast: ['蛊虫群', '赤水鳄'], person: ['五仙教药人'] },
    '西漠': { beast: ['金沙蝎'], person: ['佛塔行商', '沙匪'] },
    '北冥': { beast: ['寒潭蛟', '霜狼'], person: ['朔风猎人'] },
    '蜀地': { beast: ['青城猿', '剑尾貂'], person: ['采药道人'] },
    '东南海域': { beast: ['鲛人游卒', '海蟒'], person: ['渔火帮众', '海寇'] },
    '灵界': { beast: ['罡风隼', '云阶鹿'], person: ['云游仙官'] },
    '魔界': { beast: ['血漠魔蛛', '骨原魈'], person: ['九幽修士'] },
    '天界': { beast: ['云鲸', '天鹏'], person: ['巡天仙官'] }
};

function habitatFlavor(cell) {
    const t = (cell && cell.terrainKey) || 'PLAIN';
    const base = HABITAT_FLAVOR[t] || HABITAT_FLAVOR.PLAIN;
    const reg = REGION_WILDLIFE[currentRegionForMap] || {};
    return {
        beasts: base.beast.concat(reg.beast || []),
        persons: base.person.concat(reg.person || [])
    };
}

function pickFlavorName(pool, rng) {
    if (!pool || !pool.length) return null;
    const r = rng || Math.random;
    return pool[Math.floor(r() * pool.length)];
}

// ===== 全局状态 =====
let MAP_SEED = null;
const MAP_SEED_KEY = 'xianxia_map_seed';
const DEFAULT_SEED = '仙路长青';

let currentMap = [];            // cell: {terrainKey, terrain, qi, deco, elev, moist, entities, fog, poiId, node, x, y}
let playerPos = { x: 0, y: 0 };
let viewportOffset = { x: 0, y: 0 };
let mapContainer = null;
let currentRegionForMap = null;
let currentPois = [];           // 本图地标列表
let wildTravel = null;          // { path:[{x,y}], cost, targetName } 寻路预览
let wildState = { regions: {} };// 每个地区的差量存档 { fog, dead:{}, gathered:{}, px, py }

// ============ 种子 ============
function getMapSeed() {
    if (!MAP_SEED) {
        try {
            const saved = localStorage.getItem(MAP_SEED_KEY);
            if (saved) MAP_SEED = saved;
            else {
                MAP_SEED = DEFAULT_SEED + '_' + Date.now().toString(36);
                localStorage.setItem(MAP_SEED_KEY, MAP_SEED);
            }
        } catch (e) {
            MAP_SEED = DEFAULT_SEED;
        }
    }
    return MAP_SEED;
}

function setMapSeed(seed) {
    MAP_SEED = seed;
    try { localStorage.setItem(MAP_SEED_KEY, seed); } catch (e) {}
    wildState.regions = {};   // 换种子 = 换一片山河，旧探索作废
    return MAP_SEED;
}

// ============ 天时 helpers ============
function currentHour() {
    try { return (window.timeSystem && window.timeSystem.gameTime && window.timeSystem.gameTime.currentHour) || 12; }
    catch (e) { return 12; }
}

function currentDay() {
    try { return (window.timeSystem && window.timeSystem.gameTime && window.timeSystem.gameTime.currentDay) || 1; }
    catch (e) { return 1; }
}

function isNightNow() { const h = currentHour(); return h < 5 || h >= 21; }

function currentWeatherObj() {
    try { return (window.getCurrentWeather && window.getCurrentWeather()) || null; }
    catch (e) { return null; }
}

// 天象对赶路的拖累
function weatherTravelMul() {
    const w = currentWeatherObj();
    if (!w) return 1;
    return { sunny: 1, cloudy: 1, rainy: 1.15, stormy: 1.3, snowy: 1.35, windy: 1.1, foggy: 1.2 }[w.id] || 1;
}

// ============ 四时（v20.57）：同一片山河，四季不同色 ============
function currentSeason() {
    try {
        return (window.timeSystem && window.timeSystem.gameTime && window.timeSystem.gameTime.currentSeason) || 'spring';
    } catch (e) { return 'spring'; }
}

const SEASON_TINT = {
    spring: { name: '春', icon: '🌱', fill: '#8fd67f', op: 0.05 },
    summer: { name: '夏', icon: '☀️', fill: '#f2c94c', op: 0.06 },
    autumn: { name: '秋', icon: '🍂', fill: '#c97b2c', op: 0.09 },
    winter: { name: '冬', icon: '❄️', fill: '#d6ecf7', op: 0.13 }
};

function seasonTint() { return SEASON_TINT[currentSeason()] || SEASON_TINT.spring; }

// 四十七波 · 季节覆层：冬天水面封冻，寻路/结账眼里它是「河冰」——纯函数，不改 cell 一个字
function isFrozenNow() { return currentSeason() === 'winter'; }
function seasonTerrainKey(cell) {
    const k = cell ? cell.terrainKey : null;
    return (k === 'WATER' && isFrozenNow()) ? 'RIVER_ICE' : k;
}
function effTerrainOf(cell) {
    const k = seasonTerrainKey(cell);
    return (k && WildTerrain.TERRAIN[k]) || (cell && cell.terrain) || WildTerrain.TERRAIN.PLAIN;
}

// 冬天雪线/冻土赶路更慢：天寒地冻，脚下发僵；春天春汛漫滩，浅滩淹到腰
function seasonTravelMul(cell) {
    const s = currentSeason();
    const t = cell && cell.terrainKey;
    if (s === 'winter') return (t === 'SNOW' || t === 'FROZEN') ? 1.15 : 1;
    if (s === 'spring' && t === 'FORD') return FORD_SPRING_MUL;
    return 1;
}

// ============ 环境之苦（v20.58）：险地不只是走得慢，还伤人 ============
// chance 为基础概率（每格）；夜里寒湿更凶，雨天瘴气更毒；修为高的人扛得住。
const TERRAIN_HAZARD = {
    MOUNTAIN:   { id: 'rockfall', name: '落石', chance: 0.06, hp: 4, energy: 1, feel: '一片碎石擦着肩头砸下来，半边身子发麻', hint: '半山碎石松动，走路看头顶' },
    FOREST:     { id: 'bramble',  name: '荆棘', chance: 0.05, hp: 1, energy: 2, feel: '带刺的藤蔓缠住脚踝，挣开时划破了手背', hint: '林海深处荆棘缠人，落脚留神' },
    SWAMP:      { id: 'miasma', name: '瘴气', chance: 0.10, hp: 3, energy: 3, feel: '喉咙发紧、胸口发闷', hint: '此地瘴气弥漫，久留伤身' },
    MIASMA:     { id: 'miasma', name: '瘴气', chance: 0.20, hp: 4, energy: 4, feel: '毒雾钻进口鼻，五脏像被火燎', hint: '瘴沼深处的毒雾，比别处毒得多' },
    VOLCANO:    { id: 'scorch', name: '灼气', chance: 0.08, hp: 4, energy: 2, feel: '热浪灼肺，口鼻发干', hint: '地火灼热，不可久驻' },
    SNOW:       { id: 'chill',  name: '寒气', chance: 0.08, hp: 0, energy: 4, qi: 3, feel: '手脚发僵，气血凝滞', hint: '寒气侵骨，气血凝滞' },
    FROZEN:     { id: 'chill',  name: '寒气', chance: 0.06, hp: 0, energy: 3, qi: 2, feel: '手脚发僵，气血凝滞', hint: '冻土荒原，寒气刺骨' },
    GLACIER:    { id: 'chill',  name: '寒气', chance: 0.07, hp: 0, energy: 3, qi: 3, feel: '冰面上寒气像刀子一样刮骨', hint: '千里冰面，寒气最重' },
    DESERT:     { id: 'thirst', name: '暑渴', chance: 0.08, hp: 2, energy: 4, feel: '口干舌燥，神思恍惚', hint: '烈日灼沙，最容易耗神' },
    QUICKSAND:  { id: 'sink',   name: '流沙', chance: 0.16, hp: 1, energy: 6, feel: '一脚踩空，挣出半晌才拔出来', hint: '沙面看着平实，底下吃人' },
    SWORDTOMB:  { id: 'swordqi', name: '剑气', chance: 0.12, hp: 3, energy: 2, feel: '无主剑气擦着皮肉掠过，火辣辣一道口子', hint: '万剑余气未散，行走需慎' },
    OLDFIELD:   { id: 'ghost',  name: '阴煞', chance: 0.10, hp: 0, energy: 2, qi: 4, feel: '阵亡者的怨气缠上来，真气一阵涣散', hint: '古战场阴煞不散，阳气弱者莫入' },
    PRIMFOREST: { id: 'lost',   name: '迷障', chance: 0.08, hp: 0, energy: 4, feel: '古木遮天，转了半晌像在原地打转', hint: '荒古林遮天蔽日，进来容易出去难' },
    WRECK:      { id: 'damp',   name: '湿寒', chance: 0.10, hp: 2, energy: 2, feel: '烂木咸水，湿气钻进骨缝', hint: '船骸朽烂，踏上去当心钉刺' },
    FORD:       { id: 'damp',   name: '湿寒', chance: 0.06, hp: 2, energy: 2, feel: '湿衣贴骨，寒意钻进骨缝', hint: '水汽湿寒，湿衣贴骨' },
    WATER:      { id: 'undercurrent', name: '暗流', chance: 0.08, hp: 3, energy: 2, feel: '水下暗流卷住脚踝，呛了口冷水', hint: '深水暗流涌动，泅久凶险（踏水者无惧）' },
    RIVER_ICE:  { id: 'icecrack', name: '冰裂', chance: 0.08, hp: 4, energy: 2, feel: '脚下咔的一声脆响，冰面裂开一道缝，寒水灌进靴子', hint: '河冰看着厚实，深处暗流掏空了冰底' },
    BONEFIELD:  { id: 'demon',  name: '魔气', chance: 0.14, hp: 3, energy: 3, feel: '魔气顺着七窍往里钻，一阵恶心', hint: '骨原魔气蚀体，正道修士速离' }
};

function terrainHazard(cell) {
    // 四十七波：危险表认「有效地形」——冬天的水面在账上是河冰（吃冰裂，不吃暗流）
    const h = cell ? TERRAIN_HAZARD[seasonTerrainKey(cell)] : null;
    if (!h) return null;
    let chance = h.chance;
    const _seas = currentSeason();
    const _key = seasonTerrainKey(cell);
    if (_seas === 'spring' && _key === 'FORD') chance *= FORD_SPRING_HAZ_MUL;              // 春汛水冷
    if (_seas === 'summer' && (_key === 'SWAMP' || _key === 'MIASMA')) chance *= SWAMP_SUMMER_HAZ_MUL;   // 暑热蒸瘴
    if (isNightNow()) chance *= 1.5;
    const w = currentWeatherObj();
    if (w && (w.id === 'rainy' || w.id === 'stormy')) chance *= 1.3;
    // 修为高者气血壮实，险地伤他不动（炼气起每境少六分，封顶六成）
    let tier = 0;
    try { tier = (typeof window.getRealmTier === 'function') ? (window.getRealmTier((window.currentCharData || {}).realm) || 0) : 0; } catch (e) {}
    chance *= (1 - Math.min(0.6, tier * 0.06));
    return { hazard: h, chance: chance };
}

function harmChar(hp, energy, qi) {
    const cd = window.currentCharData;
    if (!cd) return;
    if (hp) cd.health = Math.max(0, (cd.health || 0) - hp);
    if (energy) cd.energy = Math.max(0, (cd.energy || 0) - energy);
    if (qi) cd.qi = Math.max(0, (cd.qi || 0) - qi);
    if (typeof window.updateCharacterStatus === 'function') window.updateCharacterStatus();
}

// 每落一格结一次环境账；受不住就实实在在掉状态
function applyTerrainHazard(cell) {
    const res = terrainHazard(cell);
    if (!res || res.chance <= 0) return false;
    if (Math.random() >= res.chance) return false;
    const h = res.hazard;
    harmChar(h.hp || 0, h.energy || 0, h.qi || 0);
    // 第五十三波：瘴气魔气不止皮外伤——秽气真入体（毒/神魂走生理真账，无实体则无声略过）
    let _aff = '';
    try {
        const _phys = playerPhys();
        if (_phys && h.id === 'miasma') {
            _phys.poisonLoad = Math.min(100, (Number(_phys.poisonLoad) || 0) + MIASMA_POISON_LOAD);
            _aff = '，毒气入了体';
        } else if (_phys && h.id === 'demon') {
            _phys.neuralShock = Math.min(100, (Number(_phys.neuralShock) || 0) + DEMON_SHOCK_LOAD);
            _aff = '，神魂受震';
        }
    } catch (eAff) {}
    if (window.showMessage) {
        const tail = (window.currentCharData && (window.currentCharData.health || 0) <= 10) ? '（再撑下去要出人命，快寻个村镇打尖）' : '';
        window.showMessage(`🌫️ ${h.name}入体：${h.feel || '浑身不自在'}${_aff}。${tail}`, 'warning');
    }
    return true;
}

// ============ 地皮咬合战斗（v20.60） ============
// 在沼泽里打架和在平原里打架不是一回事。本地活物习于此地，只有你要吃地皮的亏。
const TERRAIN_BATTLE_MODS = {
    PLAIN:      {},
    ROAD:       { defense: 5, note: '古道开阔，进退有度，招架省力几分' },
    OASIS:      { dodge: 5, note: '绿洲灵机润泽，脚步轻快' },
    QIPOOL:     { attack: 8, note: '灵池灵气蒸腾，出手顺势' },
    FOREST:     { dodge: 8, attack: -5, note: '密林遮蔽利于闪躲，长兵难施展开' },
    PRIMFOREST: { dodge: 12, attack: -10, note: '荒古林古木参天，腾挪有余，出剑受制' },
    MOUNTAIN:   { attack: 8, speed: -5, note: '居高临下，压制得手，但脚下难站稳' },
    SNOW:       { dodge: -8, speed: -10, note: '雪深路滑，闪转腾挪都慢半拍' },
    GLACIER:    { dodge: -10, speed: -12, note: '冰面如镜，站都站不稳' },
    FROZEN:     { dodge: -6, speed: -8, note: '冻土硬实，落脚发僵' },
    SWAMP:      { dodge: -12, speed: -15, note: '泥沼拖足，身法施展不开' },
    MIASMA:     { dodge: -14, speed: -16, defense: -5, note: '瘴雾迷眼毒肺，守御都乱了章法' },
    DESERT:     { dodge: -8, speed: -10, note: '沙软陷足，腾挪使不上力' },
    QUICKSAND:  { dodge: -12, speed: -15, defense: -5, note: '流沙吃脚，一挪一陷' },
    SWORDTOMB:  { attack: 12, note: '冢中剑气激荡，借势出手快了三分' },
    OLDFIELD:   { attack: 8, defense: -5, note: '古战场杀气犹存，出手狠了，阵脚却也乱了' },
    WRECK:      { dodge: -6, speed: -6, note: '船骸湿滑，落脚不实' },
    BONEFIELD:  { defense: -8, note: '骨原魔气蚀体，护体真气滞涩' },
    SPRING:     { attack: 8, note: '灵泉清气洗练，出手通泰' },
    WATER:      {}, WHIRLPOOL: {}, CREVASSE: {}, VOLCANO: { attack: 6, dodge: -4, note: '地火蒸腾，攻势烈了，脚下也烫' }
};

// 人在野外才有效：城里打架不吃地皮的亏
const WildGround = {
    active: function () { return !!(currentRegionForMap && currentMap && currentMap.length); },
    cell: function () {
        if (!this.active()) return null;
        const row = currentMap[playerPos.y];
        return row ? row[playerPos.x] : null;
    },
    battleMods: function () {
        const cell = this.cell();
        if (!cell) return {};
        return TERRAIN_BATTLE_MODS[cell.terrainKey] || {};
    },
    // 给战斗开场的一句话：此地皮帮你还是害你
    battleNote: function () {
        const m = this.battleMods();
        return m && m.note ? `⚔️ ${m.note}（本地活物习于此地，只有你吃这地皮的亏）` : '';
    }
};

function applyWildGroundMods(bonuses) {
    if (!bonuses) bonuses = {};
    if (!WildGround.active()) return bonuses;
    const m = WildGround.battleMods();
    ['attack', 'defense', 'dodge', 'speed', 'crit', 'block', 'penetrate'].forEach(function (k) {
        if (m[k]) bonuses[k] = (bonuses[k] || 0) + m[k];
    });
    return bonuses;
}

// 脚本内 const 不上 window，别处（inventory.js / app.js）要读，得显式挂出去
if (typeof window !== 'undefined') window.WildGround = WildGround;

// ============ 视野半径 ============
function visibilityRadius() {
    const row = currentMap[playerPos.y];
    const cell = row ? row[playerPos.x] : null;
    const t = cell ? cell.terrainKey : 'PLAIN';
    let r = { PLAIN: 2.6, ROAD: 2.8, FOREST: 1.9, MOUNTAIN: 3.6, SNOW: 2.2, FROZEN: 2.4, DESERT: 3.0, SWAMP: 1.8, WATER: 2.2, FORD: 2.4, VOLCANO: 2.6, SPRING: 2.6,
        MIASMA: 1.5, OASIS: 2.8, QUICKSAND: 3.0, CREVASSE: 2.4, GLACIER: 2.2, SWORDTOMB: 2.2, OLDFIELD: 2.6, PRIMFOREST: 1.7, WRECK: 2.2, WHIRLPOOL: 2.4, QIPOOL: 2.8, BONEFIELD: 2.4 }[t] || 2.4;
    const w = currentWeatherObj();
    if (w && (w.id === 'foggy' || w.id === 'stormy')) r -= 0.8;
    if (isNightNow()) r -= 0.5;
    return Math.max(1.2, r);
}

// ============ 迷雾 ============
function revealAround(x, y, radius) {
    // 先把上一轮「可见」降级为「已见」，再点亮本轮视野
    for (let yy = 0; yy < currentMap.length; yy++) {
        for (let xx = 0; xx < currentMap[yy].length; xx++) {
            if (currentMap[yy][xx].fog === 2) currentMap[yy][xx].fog = 1;
        }
    }
    const r = radius === undefined ? visibilityRadius() : radius;
    for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) {
        for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) {
            const nx = x + dx, ny = y + dy;
            if (ny < 0 || ny >= currentMap.length || nx < 0 || nx >= currentMap[0].length) continue;
            if (Math.sqrt(dx * dx + dy * dy) > r) continue;
            const c = currentMap[ny][nx];
            if (c.fog < 2) {
                c.fog = 2;
                if (c.poiId) discoverPoi(c.poiId);
                if (c.leyEye) announceLeyEye(c);   // v20.89 初见灵脉之眼
            }
        }
    }
}

function discoverPoi(poiId) {
    const poi = currentPois.find(p => p.id === poiId);
    if (!poi || poi.discovered) return;
    poi.discovered = true;
    if (window.showMessage) window.showMessage(`${poi.icon} 发现「${poi.name}」（${poi.label}）`, 'info');
}

// ============ 地物上下文收集 ============
function collectWildContext(region) {
    // 空别名表也算「未配置」，退回用地区本名去匹配
    const aliases = (REGION_ALIASES[region] && REGION_ALIASES[region].length) ? REGION_ALIASES[region] : [region];
    const hit = function (r) { return aliases.indexOf(r) >= 0; };

    // 图鉴地标（map-markers.js 的 LANDMARKS 带 region）
    const landmarks = [];
    try {
        const all = window.LANDMARKS || {};
        Object.keys(all).forEach(id => {
            const lm = all[id];
            if (lm && hit(lm.region)) landmarks.push({ id: id, name: lm.name, icon: lm.icon, prefer: [lm.type === 'qi_spot' ? 'SPRING' : 'MOUNTAIN'] });
        });
    } catch (e) {}

    // 资源点（灵脉/矿脉/药园）
    let resources = [];
    try {
        if (window.ResourcePoints && window.ResourcePoints.listByRegion) {
            aliases.forEach(r => { resources = resources.concat(window.ResourcePoints.listByRegion(r)); });
        }
    } catch (e) {}

    // 当期开着的动态秘境
    let dungeons = [];
    try {
        if (window.DungeonDynamic && window.DungeonDynamic.listActive) {
            dungeons = window.DungeonDynamic.listActive().filter(d => hit(d.region));
        }
    } catch (e) {}

    return { landmarks: landmarks, resources: resources, dungeons: dungeons };
}

// ============ 采集节点 ============
// 按地区资源表撒节点，采完要等它再长；出什么跟地皮走（v20.58 细分）：
//   林泽出药草、山漠火山出矿苗、雪原出寒药、灵泉边能捡着灵机之物、平原也有稀疏药草
const NODE_BY_TERRAIN = [
    { t: ['FOREST', 'SWAMP'], kind: 'herb', p: 0.045 },
    { t: ['MOUNTAIN', 'DESERT', 'VOLCANO'], kind: 'mine', p: 0.04 },
    { t: ['SNOW', 'FROZEN'], kind: 'herb', p: 0.03 },
    // v36：水面不再落药草——WATER 走不上去，撒了也采不着。骰子照掷、点照占，
    // 只为不搅乱整张图的骰序（一域一图，山河不许因这条改动挪位）
    { t: ['WATER'], kind: 'herb', p: 0.02, ghost: true },
    { t: ['SPRING'], kind: 'spirit', p: 0.30 },
    { t: ['PLAIN'], kind: 'herb', p: 0.015 }
];
const NODE_ICONS = { herb: '🌱', mine: '🪨', spirit: '💠' };
const NODE_KIND_NAMES = { herb: '药草', mine: '矿石', spirit: '灵机之物' };
const SAFE_NODE_POOLS = {
    herb: ['mat_lingzhi', 'mat_liquorice'],
    mine: ['mat_iron_ore', 'mat_copper_ore'],
    spirit: ['mat_spirit_source']
};

// 物品真源就绪时筛掉不存在的条目，免得「采了半天颗粒无收」
function usableNodePool(pool, kind) {
    const list = (pool || []).filter(function (id) {
        try {
            if (window.itemById && typeof window.itemById === 'object') return !!window.itemById[id];
        } catch (e) {}
        return true;   // 真源未就绪，不瞎筛
    });
    return list.length ? list : (SAFE_NODE_POOLS[kind] || pool);
}

function scatterGatherNodes(map, region, rng) {
    let pools = {};
    try {
        const f = (typeof REGION_FEATURES !== 'undefined') ? REGION_FEATURES[region] : null;
        if (f && f.resources) {
            pools.herb = (f.resources.herb || []).slice();
            pools.mine = (f.resources.mine || []).slice();
            pools.spirit = (f.resources.special || []).slice();
        }
    } catch (e) {}
    Object.keys(SAFE_NODE_POOLS).forEach(kind => {
        pools[kind] = usableNodePool(pools[kind] && pools[kind].length ? pools[kind] : SAFE_NODE_POOLS[kind].slice(), kind);
    });

    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[0].length; x++) {
            const c = map[y][x];
            if (c.poiId) continue;
            const rule = NODE_BY_TERRAIN.find(r => r.t.indexOf(c.terrainKey) >= 0);
            if (!rule || rng() >= rule.p || rule.ghost) continue;
            const pool = pools[rule.kind] || SAFE_NODE_POOLS[rule.kind];
            c.node = {
                kind: rule.kind,
                items: [pool[Math.floor(rng() * pool.length)], pool[Math.floor(rng() * pool.length)]],
                regrowDay: 0,
                icon: NODE_ICONS[rule.kind] || '🌱'
            };
        }
    }
}

// ============ 实体撒布 ============
// 野兽循栖息地密度，人循道途与聚落；不再像旧版那样把全图塞满
// ============ v20.89 灵脉强怪区：灵气充盈处，妖怪和修士都爱去，且更强大 ============
// 建图时在灵气最高的几处点「灵脉之眼」，眼周成片标为灵脉地皮（ley=1..3 重灵蕴）。
// 灵脉格上：活物密度×3、等级随灵蕴与玩家境界抬升、人形走精英/魔头修饰、妖兽额外淬体。
// 灵脉标记由种子确定性重算，不入存档差量（存档只记「已见过哪只眼」防重复播报）。
function leyQiThreshold(map) {
    const qis = [];
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[0].length; x++) {
            const c = map[y][x];
            if (WildTerrain.passable({ t: c.terrainKey })) qis.push(c.qi || 0);
        }
    }
    if (!qis.length) return Infinity;
    qis.sort((a, b) => a - b);
    return qis[Math.floor(qis.length * 0.9)] || 0;
}

function markLeyZones(map, pois, rng, start) {
    const nearPoi = (x, y, d) => pois.some(p => Math.abs(p.x - x) + Math.abs(p.y - y) <= d);
    const thr = leyQiThreshold(map);
    // 候选眼位：可通行、不压 POI、离出生点足够远（新手不该一出门就撞魔头）、灵气进前 10%
    const cands = [];
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[0].length; x++) {
            const c = map[y][x];
            if (!WildTerrain.passable({ t: c.terrainKey }) || c.poiId) continue;
            if ((c.qi || 0) < thr) continue;
            if (nearPoi(x, y, 2)) continue;
            if (start && Math.abs(x - start.x) + Math.abs(y - start.y) < 6) continue;
            cands.push(c);
        }
    }
    cands.sort((a, b) => (b.qi || 0) - (a.qi || 0));
    const eyes = [];
    for (let i = 0; i < cands.length && eyes.length < 3; i++) {
        const c = cands[i];
        if (eyes.some(e => Math.abs(e.x - c.x) + Math.abs(e.y - c.y) < 6)) continue;
        eyes.push(c);
    }
    eyes.forEach(eye => {
        const tier = eye.qi >= thr * 1.22 ? 3 : eye.qi >= thr * 1.1 ? 2 : 1;
        eye.ley = tier;
        eye.leyEye = true;
        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                const d = Math.abs(dx) + Math.abs(dy);
                if (!d || d > 2) continue;
                const row = map[eye.y + dy];
                const nb = row ? row[eye.x + dx] : null;
                if (!nb || !WildTerrain.passable({ t: nb.terrainKey }) || nb.poiId || nb.ley) continue;
                if (d === 1) nb.ley = tier;
                else if (rng() < 0.45) nb.ley = Math.max(1, tier - 1);
            }
        }
    });
    return eyes.length;
}

// 灵脉敌人等级：保底随灵蕴涨，且永远压着玩家境界一头（灵脉地不该随修为变白菜地）
function leyEnemyLevel(tier, rnd) {
    let plTier = 0;
    try {
        if (typeof window.getRealmTier === 'function' && window.currentCharData) {
            plTier = window.getRealmTier(window.currentCharData.realm) || 0;
        }
    } catch (e) {}
    const r = (typeof rnd === 'function' ? rnd : Math.random)();
    return Math.max(4 + (tier || 1) * 2, plTier * 2 + (tier || 1) * 2 + 1 + Math.floor(r * 3));
}

// 妖兽不走人形的精英/魔头修饰，灵蕴淬体在这里另算
function buffLeyBeast(data, tier) {
    const t = tier || 1;
    const mul = 1.1 + 0.08 * t;
    if (data && data.attrs) {
        for (const k in data.attrs) {
            if (Object.prototype.hasOwnProperty.call(data.attrs, k)) {
                data.attrs[k] = Math.max(1, Math.floor(data.attrs[k] * mul));
            }
        }
    }
    if (data) {
        data.name = '灵脉·' + (data.name || '妖兽');
        data._leyElite = t;
    }
    return data;
}

// 初见灵脉之眼报一声（每域每眼一次，随存档走）
function announceLeyEye(cell) {
    if (!currentRegionForMap || !cell || !cell.leyEye) return;
    const st = wildState.regions[currentRegionForMap];
    if (!st) return;
    st.leySeen = st.leySeen || {};
    const key = cell.x + ',' + cell.y;
    if (st.leySeen[key]) return;
    st.leySeen[key] = 1;
    if (window.showMessage) {
        window.showMessage(`🌀 发现灵脉之眼！此地灵气${cell.ley >= 3 ? '浓得化不开' : cell.ley >= 2 ? '盈盈如潮' : '远超四野'}，强悍的妖兽与修士盘踞修行——艺高人胆大，可去夺一份造化。`, 'info');
    }
}

// v35 这处脉眼是不是自家的灵脉（布过护脉大阵没有）
function leyClaimedHere(cell) {
    if (!cell || !cell.leyEye) return false;
    try {
        const v = (typeof window.getSpiritVein === 'function') ? window.getSpiritVein() : null;
        return !!(v && v.location && v.location.region === currentRegionForMap &&
            Number(v.location.x) === cell.x && Number(v.location.y) === cell.y);
    } catch (e) { return false; }
}

function scatterEntities(map, pois, rng) {
    const nearPoi = function (x, y, d) {
        return pois.some(p => Math.abs(p.x - x) + Math.abs(p.y - y) <= d);
    };
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[0].length; x++) {
            const c = map[y][x];
            if (!WildTerrain.passable({ t: c.terrainKey })) continue;
            const t = c.terrainKey;
            let beastP = 0.03, personP = 0.03;
            if (t === 'FOREST' || t === 'SWAMP') { beastP = 0.085; personP = 0.015; }
            else if (t === 'MOUNTAIN' || t === 'VOLCANO' || t === 'SNOW') { beastP = 0.06; personP = 0.01; }
            else if (t === 'DESERT' || t === 'FROZEN') { beastP = 0.05; personP = 0.008; }
            else if (t === 'SPRING') { beastP = 0.01; personP = 0.07; }
            // 第八十六波·水岸兽况：深水格走不了人撒不了兽，水兽的家其实是浅滩与沉船——
            // 水岸格子此前吃 0.03 的底账，龙龟玄龟们等于无家可归。水岸兽况对齐山线（0.06）。
            else if (t === 'FORD' || t === 'WRECK') { beastP = 0.06; personP = 0.01; }
            if (t === 'ROAD') { personP = 0.05; beastP = 0.015; }
            if (nearPoi(x, y, 2)) personP *= 1.8;
            if (c.ley) { beastP *= 3; personP *= 3; }   // v20.89 灵脉地：妖怪和修士都爱去

            // 第八十四波·兽潮密度真落地：潮期「遭遇更密」此前只是牌面话——现在兽况真涨
            let _tide = null;
            try {
                if (window.BeastTide && typeof window.BeastTide.getActiveTide === 'function') {
                    _tide = window.BeastTide.getActiveTide();
                    if (_tide) {
                        const _boost = (window.BeastTide.getRarityBoost && window.BeastTide.getRarityBoost()) || 1;
                        beastP = Math.min(0.5, beastP * (1.15 + 0.3 * Math.max(0, _boost - 1)));
                    }
                }
            } catch (eTide) {}

            const roll = rng();
            if (roll < beastP) {
                // 第八十四波·名种灵兽真分布：13 兽 × 地区 × 地形的分布表（v19.12）此前零消费——
                // 可收服的名种（灵狐/雷鹰/龙龟…）在野外根本遇不到。现在三成兽遇出名种，
                // 兽潮期间潮池稀有种优先出没（rareAdded 用的就是驯服模板 id）。
                let _spiritData = null;
                try {
                    const _BT = (typeof BEAST_TEMPLATES !== 'undefined' && BEAST_TEMPLATES) || window.BEAST_TEMPLATES || {};
                    const _eco = window.BeastEcosystem;
                    if (_tide && Array.isArray(_tide.rareAdded) && _tide.rareAdded.length && rng() < 0.25) {
                        const _rid = _tide.rareAdded[Math.floor(rng() * _tide.rareAdded.length)];
                        const _rtpl = _BT[_rid];
                        if (_rtpl && _eco && _eco.buildWildBeastData) {
                            _spiritData = _eco.buildWildBeastData({ id: _rid, name: _rtpl.name, level: _rtpl.level });
                            if (_spiritData) _spiritData._fromTide = true;
                        }
                    }
                    if (!_spiritData && !c.ley && _eco && _eco.rollDistributedBeast && rng() < 0.3) {
                        const _d = _eco.rollDistributedBeast(currentRegionForMap, t, rng);
                        if (_d && _eco.buildWildBeastData) _spiritData = _eco.buildWildBeastData(_d);
                    }
                } catch (eSpirit) {}
                if (_spiritData) {
                    // 第八十七波·兽径手记：出身地与地皮随敌数据进战斗——打完一场（不论胜负）就认得这兽住哪
                    _spiritData._ecoRegion = currentRegionForMap || '';
                    _spiritData._ecoTerrain = t;
                    c.entities.push(makeWildEntity({
                        kind: 'beast', name: _spiritData.name, symbol: (_tide && _spiritData._fromTide) ? '🌟' : '🦌', habitat: t,
                        data: _spiritData,
                        uid: 'e_' + x + '_' + y + '_' + c.entities.length
                    }));
                    continue;
                }
                if (typeof generateRandomEnemy !== 'function') continue;
                const level = c.ley ? leyEnemyLevel(c.ley, rng) : 1 + Math.floor(rng() * 3);
                const beastData = generateRandomEnemy(level, 'beast');
                // 名字跟地皮走：沼泽出毒蟒，雪线出雪狼
                let beastName = pickFlavorName(habitatFlavor(c).beasts, rng) || beastData.name;
                if (c.ley) {
                    buffLeyBeast(beastData, c.ley);
                    beastName = beastData.name;
                }
                c.entities.push(makeWildEntity({
                    kind: 'beast', name: beastName, symbol: c.ley ? '👹' : '🐾', habitat: t, data: Object.assign({}, beastData, { name: beastName }),
                    uid: 'e_' + x + '_' + y + '_' + c.entities.length
                }));
            } else if (roll < beastP + personP) {
                if (typeof generateRandomEnemy !== 'function') continue;
                const level = c.ley ? leyEnemyLevel(c.ley, rng) : 1 + Math.floor(rng() * 3);
                const enemyData = c.ley ? generateRandomEnemy(level, c.ley >= 3 ? 'boss' : 'elite', { leyTier: c.ley }) : generateRandomEnemy(level);   // v20.95 灵蕴随生成递进掉落账
                const physType = enemyData.physiologyType || 'humanoid';
                if (physType === 'undead' || physType === 'construct' || physType === 'elemental') {
                    // 亡灵/构装体/元素不是可攀谈的人
                    if (c.ley) buffLeyBeast(enemyData, c.ley);
                    c.entities.push(makeWildEntity({
                        kind: 'beast', name: enemyData.name, symbol: c.ley ? '👹' : '💀',
                        data: Object.assign({}, enemyData, { isMonster: true }),
                        uid: 'e_' + x + '_' + y + '_' + c.entities.length
                    }));
                } else {
                    let personType = 'normal', symbol = '🧙', name = pickFlavorName(habitatFlavor(c).persons, rng) || enemyData.name;
                    if (!name) name = enemyData.name;
                    if (c.ley) {
                        // v20.89 灵脉打坐的修士：来抢灵气的，个个不好惹（精英/魔头修饰在生成器里已挂）
                        symbol = '⚔️';
                        name = enemyData.name;   // 不用「樵夫采药人」这类地皮闲名，强敌要有强敌的名号
                        enemyData._leyElite = c.ley;
                    } else {
                        const r2 = rng();
                        if (r2 < 0.25) { personType = 'merchant'; symbol = '🛒'; }
                        else if (r2 < 0.45) { personType = 'wanderer'; symbol = '🗡️'; }
                    }
                    c.entities.push(makeWildEntity({
                        kind: 'person', personType: personType, symbol: symbol, name: name, habitat: t,
                        data: Object.assign({}, enemyData, { name: name, personType: personType }),
                        uid: 'e_' + x + '_' + y + '_' + c.entities.length
                    }));
                }
            }
        }
    }
}

function makeWildEntity(o) {
    o.type = o.kind;           // 兼容旧结构：app.js / battle.js 按 type==='person'|'beast' 分流
    o.isCorpse = false;
    return o;
}

// ============ 建图 ============
function buildWildMap(region) {
    const T = WildTerrain.TERRAIN;
    const ctx = collectWildContext(region);
    const gen = WildTerrain.generate({
        seed: getMapSeed(),
        region: region,
        rows: MAP_CONFIG.ROWS,
        cols: MAP_CONFIG.COLS,
        landmarks: ctx.landmarks,
        resources: ctx.resources,
        dungeons: ctx.dungeons
    });

    const rng = WildTerrain.createSeededRandom(getMapSeed() + '|' + region + '|life');
    currentRegionForMap = region;
    // v36 游历见闻：初至一域记一笔（零随机零漂移，账在角色数据上）
    try { if (window.TravelJournal) window.TravelJournal.noteRegion(region); } catch (e) {}
    // v43 带着大镖过界：进对域提醒交割，进别域只是路过（纯话术零随机，不碰上面的骰）
    try {
        const _eArrive = escortLedger();
        if (_eArrive && _eArrive.long) {
            if (_eArrive.toRegion === region) showMessage('📦 镖车过了界碑——脚下已是' + region + '地界，寻处镇子市集就能交割领赏。', 'success');
            else showMessage('📦 身上还压着送' + _eArrive.toRegion + '的大镖，此域只是路过——莫耽搁。', 'info');
        }
    } catch (e) {}
    currentPois = gen.pois;
    assignPoiVariants(currentPois, rng);
    wildTravel = null;   // 换图作废未出发的路线

    const baseQi = (typeof window.getQiConcentration === 'function') ? window.getQiConcentration(region) : 0.8;

    currentMap = gen.grid.map((row, y) => row.map((c, x) => {
        const t = T[c.t];
        return {
            terrainKey: c.t,
            terrain: t,
            elev: c.e,
            moist: c.m,
            deco: c.d,
            qi: Math.round(baseQi * (t.qi || 1) * (0.85 + c.q * 0.3) * 100) / 100,
            entities: [],
            fog: 0,
            poiId: null,
            node: null,
            x: x,
            y: y
        };
    }));

    // 地标落格
    currentPois.forEach(p => {
        const cell = currentMap[p.y] && currentMap[p.y][p.x];
        if (cell) cell.poiId = p.id;
    });

    scatterGatherNodes(currentMap, region, rng);
    markLeyZones(currentMap, currentPois, rng, gen.start);   // v20.89 灵脉强怪区先落脉，再撒活物
    scatterEntities(currentMap, currentPois, rng);

    // 起点安全区
    playerPos = { x: gen.start.x, y: gen.start.y };
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const row = currentMap[playerPos.y + dy];
            const c = row ? row[playerPos.x + dx] : null;
            if (c) { c.entities = []; c.node = null; }
        }
    }

    // 活物后撒：兽群商队不从人脚下冒出来
    seedWildLife(currentMap, currentPois, rng);

    // v35 山门最后落格：脉、节点、活物都照旧账撒完才立幡——自家立宗不挪动既有山河一格
    placeSectPois(region);

    smoothShadeField(currentMap);
    applyWildState(region);
    pruneWildBands();   // 死册里的成员从队伍里剔掉，免得死了又站起来
    revealAround(playerPos.x, playerPos.y);
    syncWildGlobals();
}

function syncWildGlobals() {
    window.currentMap = currentMap;
    window.playerPos = playerPos;
    window.currentRegionForMap = currentRegionForMap;
    window.currentPois = currentPois;
}

// ============ 差量存档（StateRegistry: wildMap） ============
function packFog() {
    let s = '';
    for (let y = 0; y < currentMap.length; y++) {
        for (let x = 0; x < currentMap[0].length; x++) s += currentMap[y][x].fog;
    }
    return s;
}

function unpackFog(str) {
    if (typeof str !== 'string' || str.length !== currentMap.length * currentMap[0].length) return;
    let i = 0;
    for (let y = 0; y < currentMap.length; y++) {
        for (let x = 0; x < currentMap[0].length; x++) currentMap[y][x].fog = Number(str[i++]) || 0;
    }
}

// 战斗留下的尸首记进差量，读档后仍是死的
function syncDeadUids() {
    const st = wildState.regions[currentRegionForMap];
    if (!st) return;
    for (let y = 0; y < currentMap.length; y++) {
        for (let x = 0; x < currentMap[0].length; x++) {
            const list = currentMap[y][x].entities || [];
            for (let i = 0; i < list.length; i++) {
                const e = list[i];
                if (e && e.uid && !st.dead[e.uid] && isEntityDead(e)) st.dead[e.uid] = 1;
            }
        }
    }
}

function saveWildState() {
    if (!currentRegionForMap) return;
    const prev = wildState.regions[currentRegionForMap] || { dead: {}, gathered: {} };
    syncDeadUids();
    wildState.regions[currentRegionForMap] = {
        fog: packFog(),
        dead: prev.dead,
        gathered: prev.gathered,
        visited: prev.visited || {},
        leySeen: prev.leySeen || {},
        oasis: prev.oasis || {},
        pool: prev.pool || {},
        grotto: prev.grotto || {},        // v49 崖壁洞天：发现账（'x,y' → 绝对日）
        grottoUse: prev.grottoUse || {},  // v49 洞天行功：一日一回账（同 oasis/pool 法）
        grottoLoot: prev.grottoLoot || {},// v50 洞天遗宝：一洞一匣的开匣账
        nemesis: prev.nemesis || null,   // v51 具名响马宿敌：一域一个在世仇家（{name,wins,born,last}）
        notes: prev.notes || {},         // v52 粉笔笔记：'x,y' → 粉笔样 id
        px: playerPos.x,
        py: playerPos.y
    };
}

function applyWildState(region) {
    // v20.89：新域默认坐标记 -1——此前默认 (0,0) 会把初次进域的人从出生点挪到地图角落
    if (!wildState.regions[region]) wildState.regions[region] = { fog: '', dead: {}, gathered: {}, visited: {}, leySeen: {}, oasis: {}, pool: {}, grotto: {}, grottoUse: {}, grottoLoot: {}, nemesis: null, notes: {}, px: -1, py: -1 };
    const st = wildState.regions[region];
    st.visited = st.visited || {};
    st.leySeen = st.leySeen || {};
    st.oasis = st.oasis || {};
    st.pool = st.pool || {};
    st.grotto = st.grotto || {};        // v49 老档自动补空（与 oasis/pool 同法，零迁移脚本）
    st.grottoUse = st.grottoUse || {};
    st.grottoLoot = st.grottoLoot || {};   // v50 遗宝开匣账同样自动补空
    if (st.nemesis === undefined) st.nemesis = null;   // v51 仇家账老档自动补空（零迁移脚本）
    st.notes = st.notes || {};   // v52 粉笔笔记老档自动补空（同法）
    if (!st) return;
    unpackFog(st.fog);
    // 已死的不再出现（uid 含坐标，重生成的实体位置序号稳定）
    for (let y = 0; y < currentMap.length; y++) {
        for (let x = 0; x < currentMap[0].length; x++) {
            const c = currentMap[y][x];
            c.entities = (c.entities || []).filter(e => !(e && e.uid && st.dead[e.uid]));
            const g = st.gathered[x + ',' + y];
            if (c.node && g !== undefined) c.node.regrowDay = g;
        }
    }
    if (typeof st.px === 'number' && typeof st.py === 'number' && currentMap[st.py] && currentMap[st.py][st.px]
        && WildTerrain.passable({ t: currentMap[st.py][st.px].terrainKey })) {
        playerPos = { x: st.px, y: st.py };
    }
    // 已见过的地标按迷雾回填 discovered；亲脚到过的回填 visited
    currentPois.forEach(p => {
        const c = currentMap[p.y] && currentMap[p.y][p.x];
        if (c && c.fog > 0) p.discovered = true;
        p.visited = !!(st.visited && st.visited[p.id]) || p.visited === true;
    });
}

if (typeof window !== 'undefined' && window.StateRegistry && typeof window.StateRegistry.register === 'function') {
    window.StateRegistry.register('wildMap', {
        version: 1,
        export: function () { return JSON.parse(JSON.stringify({ regions: wildState.regions })); },
        import: function (data) {
            if (!data || !data.regions) return;
            wildState.regions = data.regions;
            if (currentRegionForMap && currentMap.length) {
                applyWildState(currentRegionForMap);
                revealAround(playerPos.x, playerPos.y);
                if (mapContainer) renderMap(mapContainer, currentMap, viewportOffset.x, viewportOffset.y);
            }
        },
        reset: function () { wildState.regions = {}; }
    });
}

// ============ 渲染 ============
function shadeColor(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) + amt, g = ((n >> 8) & 0xff) + amt, b = (n & 0xff) + amt;
    r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

function svgEl(tag, attrs) {
    const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const k in (attrs || {})) e.setAttribute(k, attrs[k]);
    return e;
}

// ---- 渲染辅助：拼块 + 晕染（格线不画出来） ----
function cellAt(x, y) {
    const row = currentMap[y];
    return row ? row[x] : null;
}

function mixColor(hexA, hexB, t) {
    const a = parseInt(hexA.slice(1), 16), b = parseInt(hexB.slice(1), 16);
    const r = Math.round(((a >> 16) & 255) * (1 - t) + ((b >> 16) & 255) * t);
    const g2 = Math.round(((a >> 8) & 255) * (1 - t) + ((b >> 8) & 255) * t);
    const bl = Math.round((a & 255) * (1 - t) + (b & 255) * t);
    return '#' + ((r << 16) | (g2 << 8) | bl).toString(16).padStart(6, '0');
}

// 明度场平滑：相邻格颜色融成一片，不再一格一格跳
function smoothShadeField(map) {
    const rows = map.length, cols = map[0].length;
    const src = map.map(row => row.map(c => c.elev || 0.5));
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            let sum = 0, n = 0;
            for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                    const ny = y + dy, nx = x + dx;
                    if (ny < 0 || ny >= rows || nx < 0 || nx >= cols) continue;
                    sum += src[ny][nx]; n++;
                }
            }
            map[y][x].shade = sum / n;
        }
    }
}

// 交界线带点弯曲，别是一条笔直的几何线
function wavyEdgeD(ax, ay, bx, by, seed) {
    const dx = bx - ax, dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    const o1 = (seed % 5) - 2, o2 = ((seed >> 3) % 5) - 2;
    const q1x = ax + dx * 0.33 + nx * o1, q1y = ay + dy * 0.33 + ny * o1;
    const q2x = ax + dx * 0.66 + nx * o2, q2y = ay + dy * 0.66 + ny * o2;
    const mx = (ax + bx) / 2 + nx * ((o1 + o2) / 2), my = (ay + by) / 2 + ny * ((o1 + o2) / 2);
    return `M${ax} ${ay} Q${q1x} ${q1y} ${mx} ${my} Q${q2x} ${q2y} ${bx} ${by}`;
}

function edgeColor(a, b) {
    const wet = a.terrainKey === 'WATER' || b.terrainKey === 'WATER' || a.terrainKey === 'FORD' || b.terrainKey === 'FORD';
    return wet ? '#bfe0ef' : mixColor(a.terrain.base, b.terrain.base, 0.5);
}

// 地形交界：一宽一窄两道晕染替代硬边（宽的淡、窄的实，看着是过渡不是线）
function drawSoftEdges(g, cell, x, y, size) {
    const px = x * size, py = y * size;
    const pairs = [
        [cellAt(x + 1, y), px + size, py, px + size, py + size],
        [cellAt(x, y + 1), px, py + size, px + size, py + size]
    ];
    pairs.forEach(function (pr, i) {
        const nb = pr[0];
        if (!nb || nb.terrainKey === cell.terrainKey) return;
        const d = wavyEdgeD(pr[1], pr[2], pr[3], pr[4], (cell.deco || 0) + i * 7);
        const col = edgeColor(cell, nb);
        g.appendChild(svgEl('path', { d: d, stroke: col, 'stroke-width': 7, fill: 'none', opacity: 0.22 }));
        g.appendChild(svgEl('path', { d: d, stroke: col, 'stroke-width': 2.6, fill: 'none', opacity: 0.42 }));
    });
}

// ---- 古道连成线：看四邻是不是路，从边进从边出，不再一格一段 ----
function linkTerrainAt(x, y) {
    const c = cellAt(x, y);
    return !!c && (c.terrainKey === 'ROAD' || c.terrainKey === 'FORD');
}

function roadConnectorD(x, y, size) {
    const px = x * size, py = y * size, m = size / 2;
    const pts = [];
    if (linkTerrainAt(x, y - 1)) pts.push([px + m, py]);
    if (linkTerrainAt(x, y + 1)) pts.push([px + m, py + size]);
    if (linkTerrainAt(x - 1, y)) pts.push([px, py + m]);
    if (linkTerrainAt(x + 1, y)) pts.push([px + size, py + m]);
    if (pts.length === 0) return `M${px + m - 3.5} ${py + m} a3.5 3.5 0 1 0 7 0 a3.5 3.5 0 1 0 -7 0`;
    if (pts.length === 1) return `M${px + m} ${py + m} L${pts[0][0]} ${pts[0][1]}`;
    if (pts.length === 2) return `M${pts[0][0]} ${pts[0][1]} Q${px + m} ${py + m} ${pts[1][0]} ${pts[1][1]}`;
    let d = '';
    pts.forEach(p => { d += `M${px + m} ${py + m} L${p[0]} ${p[1]} `; });
    return d;
}

// 一格地形：底色 + 手绘感装饰 + 软边过渡
function drawWildCell(svg, cell, x, y, size) {
    const t = cell.terrain;
    const cx = x * size, cy = y * size;
    const g = svgEl('g', {});
    const h = (cell.deco || 0);
    const base = shadeColor(t.base, Math.round((((cell.shade !== undefined ? cell.shade : cell.elev) || 0.5) - 0.5) * 26));

    const rect = svgEl('rect', { x: cx, y: cy, width: size, height: size, fill: base });
    if (t.kind === 'water') rect.setAttribute('class', 'wild-water');
    g.appendChild(rect);

    const px = cx, py = cy, m = size / 2;
    const r1 = (h % 7) / 7, r2 = ((h >> 3) % 7) / 7;

    switch (cell.terrainKey) {
        case 'PLAIN':
            for (let i = 0; i < 3; i++) {
                const gx = px + size * (0.12 + ((h >> i) % 8) / 11), gy = py + size * (0.2 + ((h >> (i + 2)) % 8) / 11);
                g.appendChild(svgEl('path', { d: `M${gx} ${gy} l2 -4 M${gx + 3} ${gy} l1 -3`, stroke: t.accent, 'stroke-width': 1, fill: 'none', opacity: 0.6 }));
            }
            break;
        case 'FOREST': {
            const nTrees = 3 + (h % 2);
            for (let i = 0; i < nTrees; i++) {
                const tx = px + size * (0.14 + ((h >> i) % 8) / 11);
                const ty = py + size * (0.35 + ((h >> (i + 3)) % 8) / 13);
                const s = size * (0.15 + ((h >> (i + 1)) % 4) / 22);
                g.appendChild(svgEl('path', { d: `M${tx} ${ty} l${-s * 0.5} ${-s} l${s} 0 z`, fill: t.accent, opacity: 0.9 }));
                g.appendChild(svgEl('rect', { x: tx - 1, y: ty, width: 2, height: s * 0.32, fill: '#5b4230' }));
            }
            break;
        }
        case 'MOUNTAIN': {
            const peak = px + size * (0.3 + r1 * 0.4);
            const hgt = size * (0.4 + r2 * 0.2);
            g.appendChild(svgEl('path', { d: `M${peak - size * 0.38} ${py + size * 0.85} L${peak} ${py + size * 0.85 - hgt} L${peak + size * 0.38} ${py + size * 0.85} z`, fill: t.accent, opacity: 0.95 }));
            g.appendChild(svgEl('path', { d: `M${peak} ${py + size * 0.85 - hgt} L${peak + size * 0.38} ${py + size * 0.85} L${peak} ${py + size * 0.85} z`, fill: shadeColor(t.accent, -26), opacity: 0.55 }));
            if ((cell.elev || 0) > 0.7) g.appendChild(svgEl('path', { d: `M${peak - size * 0.09} ${py + size * 0.85 - hgt + size * 0.13} L${peak} ${py + size * 0.85 - hgt} L${peak + size * 0.09} ${py + size * 0.85 - hgt + size * 0.13} z`, fill: '#f2f6f9', opacity: 0.9 }));
            break;
        }
        case 'SNOW':
            for (let i = 0; i < 4; i++) g.appendChild(svgEl('circle', { cx: px + size * (0.15 + ((h >> i) % 8) / 11), cy: py + size * (0.2 + ((h >> (i + 1)) % 8) / 11), r: 1.4, fill: '#ffffff', opacity: 0.8 }));
            g.appendChild(svgEl('path', { d: `M${px} ${py + size * 0.75} q ${size * 0.25} ${-size * 0.1} ${size * 0.5} 0`, stroke: '#c3d0da', fill: 'none', 'stroke-width': 1.2, opacity: 0.7 }));
            break;
        case 'FROZEN':
            g.appendChild(svgEl('path', { d: `M${px + size * 0.15} ${py + size * 0.3} l${size * 0.3} ${size * 0.25} l${-size * 0.1} ${size * 0.25}`, stroke: '#6f8894', fill: 'none', 'stroke-width': 1.2, opacity: 0.7 }));
            break;
        case 'WATER':
            if (isFrozenNow()) {
                // 四十七波：冬天水面封冻——冰色盖底，两道裂纹，看着厚实也得当心
                const iceT = WildTerrain.TERRAIN.RIVER_ICE;
                g.appendChild(svgEl('rect', { x: cx, y: cy, width: size, height: size, fill: shadeColor(iceT.base, Math.round((((cell.shade !== undefined ? cell.shade : cell.elev) || 0.5) - 0.5) * 18)) }));
                g.appendChild(svgEl('path', { d: `M${px + size * (0.16 + r1 * 0.1)} ${py + size * 0.3} l${size * 0.26} ${size * 0.2} l${-size * 0.08} ${size * 0.24}`, stroke: iceT.accent, fill: 'none', 'stroke-width': 1.1, opacity: 0.9 }));
                g.appendChild(svgEl('path', { d: `M${px + size * (0.5 + r2 * 0.14)} ${py + size * 0.62} l${size * 0.2} ${-size * 0.12}`, stroke: iceT.accent, fill: 'none', 'stroke-width': 0.9, opacity: 0.7 }));
                break;
            }
            g.appendChild(svgEl('path', { d: `M${px + size * 0.12} ${py + size * (0.4 + r1 * 0.2)} q ${size * 0.12} ${-3} ${size * 0.24} 0 q ${size * 0.12} ${3} ${size * 0.24} 0`, stroke: t.accent, fill: 'none', 'stroke-width': 1.3, opacity: 0.7 }));
            g.appendChild(svgEl('path', { d: `M${px + size * 0.3} ${py + size * (0.66 + r2 * 0.16)} q ${size * 0.1} ${-2.5} ${size * 0.2} 0`, stroke: t.accent, fill: 'none', 'stroke-width': 1.1, opacity: 0.5 }));
            break;
        case 'FORD':
            for (let i = 0; i < 3; i++) g.appendChild(svgEl('ellipse', { cx: px + size * (0.24 + i * 0.26), cy: py + size * (0.5 + (i % 2 ? 0.12 : -0.06)), rx: size * 0.07, ry: size * 0.05, fill: '#9aa7ae', opacity: 0.9 }));
            g.appendChild(svgEl('path', { d: roadConnectorD(x, y, size), stroke: '#b39b7c', 'stroke-width': 4.5, fill: 'none', 'stroke-linecap': 'round', opacity: 0.75 }));
            break;
        case 'DESERT':
            g.appendChild(svgEl('path', { d: `M${px} ${py + size * (0.5 + r1 * 0.2)} q ${size * 0.25} ${-size * 0.14} ${size * 0.5} 0`, stroke: t.accent, fill: 'none', 'stroke-width': 1.4, opacity: 0.7 }));
            g.appendChild(svgEl('path', { d: `M${px + size * 0.1} ${py + size * (0.74 + r2 * 0.12)} q ${size * 0.2} ${-size * 0.1} ${size * 0.4} 0`, stroke: shadeColor(t.accent, -14), fill: 'none', 'stroke-width': 1.1, opacity: 0.55 }));
            break;
        case 'SWAMP':
            g.appendChild(svgEl('ellipse', { cx: px + size * (0.35 + r1 * 0.3), cy: py + size * 0.62, rx: size * 0.2, ry: size * 0.09, fill: '#37472a', opacity: 0.8 }));
            for (let i = 0; i < 3; i++) g.appendChild(svgEl('path', { d: `M${px + size * (0.24 + i * 0.22)} ${py + size * 0.45} l1.5 -5`, stroke: '#6f8348', 'stroke-width': 1.2, opacity: 0.8 }));
            break;
        case 'VOLCANO':
            g.appendChild(svgEl('path', { d: `M${px + size * 0.18} ${py + size * 0.85} L${px + size * (0.42 + r1 * 0.16)} ${py + size * 0.35} L${px + size * 0.82} ${py + size * 0.85} z`, fill: '#6d2a20' }));
            g.appendChild(svgEl('ellipse', { cx: px + size * (0.42 + r1 * 0.16), cy: py + size * 0.36, rx: size * 0.09, ry: size * 0.05, fill: '#e2603c' }));
            break;
        case 'SPRING':
            g.appendChild(svgEl('ellipse', { cx: px + m, cy: py + m, rx: size * 0.24, ry: size * 0.15, fill: '#7fe3ea', opacity: 0.85 }));
            g.appendChild(svgEl('ellipse', { cx: px + m, cy: py + m, rx: size * 0.33, ry: size * 0.23, fill: 'none', stroke: '#a9f0f4', 'stroke-width': 1, opacity: 0.5 }));
            break;
        case 'ROAD':
            g.appendChild(svgEl('path', { d: roadConnectorD(x, y, size), stroke: shadeColor(t.base, 12), 'stroke-width': 5.5, fill: 'none', 'stroke-linecap': 'round', opacity: 0.85 }));
            g.appendChild(svgEl('path', { d: roadConnectorD(x, y, size), stroke: shadeColor(t.base, 26), 'stroke-width': 1.6, fill: 'none', 'stroke-linecap': 'round', opacity: 0.6 }));
            break;
        // ---- 独有地貌（v20.60）：一地一貌 ----
        case 'MIASMA':
            for (let i = 0; i < 3; i++) {
                g.appendChild(svgEl('circle', { cx: px + size * (0.22 + i * 0.28), cy: py + size * (0.42 + r1 * 0.2), r: size * (0.10 + (i % 2) * 0.05), fill: '#8fae4a', opacity: 0.35 }));
                g.appendChild(svgEl('circle', { cx: px + size * (0.3 + i * 0.22), cy: py + size * (0.3 + r2 * 0.15), r: 2.2, fill: '#b9d96a', opacity: 0.5, 'class': 'wild-miasma' }));
            }
            break;
        case 'OASIS':
            g.appendChild(svgEl('ellipse', { cx: px + m, cy: py + m, rx: size * 0.3, ry: size * 0.18, fill: '#63c8d8', opacity: 0.85 }));
            g.appendChild(svgEl('path', { d: `M${px + size * 0.72} ${py + size * 0.42} l0 ${-size * 0.16} M${px + size * 0.72} ${py + size * 0.26} l${-size * 0.1} ${size * 0.08} M${px + size * 0.72} ${py + size * 0.26} l${size * 0.1} ${size * 0.08}`, stroke: '#3f7f38', 'stroke-width': 1.6, fill: 'none', opacity: 0.9 }));
            break;
        case 'QUICKSAND':
            for (let i = 0; i < 2; i++) g.appendChild(svgEl('path', { d: `M${px + size * 0.12} ${py + size * (0.38 + i * 0.26)} q ${size * 0.18} ${-size * 0.1} ${size * 0.38} 0 q ${size * 0.14} ${-size * 0.07} ${size * 0.28} 0`, stroke: '#e6d49a', fill: 'none', 'stroke-width': 1.2, opacity: 0.6 }));
            g.appendChild(svgEl('ellipse', { cx: px + size * (0.3 + r1 * 0.4), cy: py + size * (0.5 + r2 * 0.2), rx: size * 0.09, ry: size * 0.05, fill: '#a98f52', opacity: 0.7 }));
            break;
        case 'CREVASSE':
            g.appendChild(svgEl('path', { d: `M${px + size * 0.1} ${py + size * (0.3 + r1 * 0.3)} l${size * 0.3} ${size * 0.1} l${size * 0.2} ${-size * 0.08} l${size * 0.3} ${size * 0.14}`, stroke: '#3f5a6b', 'stroke-width': 2.6, fill: 'none', opacity: 0.85 }));
            g.appendChild(svgEl('path', { d: `M${px + size * 0.15} ${py + size * 0.75} l${size * 0.35} ${-size * 0.08}`, stroke: '#3f5a6b', 'stroke-width': 1.6, fill: 'none', opacity: 0.6 }));
            break;
        case 'GLACIER':
            g.appendChild(svgEl('path', { d: `M${px + size * 0.12} ${py + size * 0.7} L${px + size * 0.4} ${py + size * 0.3} L${px + size * 0.72} ${py + size * 0.62} L${px + size * 0.9} ${py + size * 0.35}`, stroke: '#e6f4fb', 'stroke-width': 2, fill: 'none', opacity: 0.8 }));
            g.appendChild(svgEl('path', { d: `M${px + size * 0.2} ${py + size * 0.5} l${size * 0.3} ${-size * 0.08} l${size * 0.2} ${size * 0.12}`, stroke: '#8fb6ca', 'stroke-width': 1.2, fill: 'none', opacity: 0.6 }));
            break;
        case 'SWORDTOMB':
            for (let i = 0; i < 4; i++) {
                const sxp = px + size * (0.16 + i * 0.21), syp = py + size * (0.72 + (i % 2) * 0.08);
                const tilt = ((h >> i) % 3) - 1;
                g.appendChild(svgEl('path', { d: `M${sxp} ${syp} l${tilt * 2} ${-size * (0.26 + ((h >> (i + 2)) % 3) * 0.05)}`, stroke: '#d8dde6', 'stroke-width': 1.8, fill: 'none', opacity: 0.85, 'class': 'wild-swordqi' }));
            }
            break;
        case 'OLDFIELD':
            for (let i = 0; i < 3; i++) {
                g.appendChild(svgEl('path', { d: `M${px + size * (0.18 + i * 0.26)} ${py + size * 0.75} l3 ${-size * 0.2} l2 ${size * 0.08}`, stroke: '#5f4f36', 'stroke-width': 1.5, fill: 'none', opacity: 0.75 }));
            }
            g.appendChild(svgEl('path', { d: `M${px + size * 0.14} ${py + size * 0.62} q ${size * 0.3} ${-size * 0.1} ${size * 0.62} 0`, stroke: '#4a3f2c', 'stroke-width': 2, fill: 'none', opacity: 0.4 }));
            break;
        case 'PRIMFOREST': {
            for (let i = 0; i < 3; i++) {
                const txp = px + size * (0.2 + i * 0.28), typ = py + size * (0.62 + (i % 2) * 0.1);
                g.appendChild(svgEl('path', { d: `M${txp} ${typ} l${-size * 0.14} ${-size * 0.34} l${size * 0.28} 0 z`, fill: '#173a15', opacity: 0.95 }));
                g.appendChild(svgEl('rect', { x: txp - 1.2, y: typ, width: 2.4, height: size * 0.14, fill: '#3a2a1c' }));
            }
            break;
        }
        case 'WRECK':
            g.appendChild(svgEl('path', { d: `M${px + size * 0.16} ${py + size * 0.66} q ${size * 0.34} ${size * 0.22} ${size * 0.66} 0`, stroke: '#6b563e', 'stroke-width': 3.4, fill: 'none', opacity: 0.9 }));
            g.appendChild(svgEl('path', { d: `M${px + size * 0.48} ${py + size * 0.62} l${size * 0.06} ${-size * 0.3}`, stroke: '#7d6a4e', 'stroke-width': 2.2, fill: 'none', opacity: 0.8 }));
            g.appendChild(svgEl('path', { d: `M${px + size * 0.52} ${py + size * 0.36} l${size * 0.16} ${size * 0.08} l${-size * 0.16} ${size * 0.06} z`, fill: '#9aa7ae', opacity: 0.6 }));
            break;
        case 'WHIRLPOOL':
            g.appendChild(svgEl('path', { d: `M${px + m} ${py + m} m${-size * 0.2} 0 a${size * 0.2} ${size * 0.16} 0 1 0 ${size * 0.34} ${-size * 0.06} a${size * 0.13} ${size * 0.1} 0 1 0 ${-size * 0.2} ${size * 0.05}`, stroke: '#7fc0dc', 'stroke-width': 2.2, fill: 'none', opacity: 0.85, 'class': 'wild-whirl' }));
            break;
        case 'QIPOOL':
            g.appendChild(svgEl('ellipse', { cx: px + m, cy: py + m, rx: size * 0.28, ry: size * 0.17, fill: '#7fe0e8', opacity: 0.8, 'class': 'wild-miasma' }));
            g.appendChild(svgEl('circle', { cx: px + m, cy: py + m - size * 0.1, r: 2, fill: '#ffffff', opacity: 0.6 }));
            break;
        case 'BONEFIELD':
            for (let i = 0; i < 4; i++) {
                g.appendChild(svgEl('path', { d: `M${px + size * (0.15 + i * 0.22)} ${py + size * (0.6 + (i % 2) * 0.14)} l${3 + (i % 2) * 2} ${-size * 0.1}`, stroke: '#e3ddcb', 'stroke-width': 1.6, fill: 'none', opacity: 0.8 }));
            }
            g.appendChild(svgEl('circle', { cx: px + size * (0.3 + r1 * 0.3), cy: py + size * (0.4 + r2 * 0.15), r: 2.4, fill: '#efe9d8', opacity: 0.7 }));
            break;
    }

    drawSoftEdges(g, cell, x, y, size);

    // v20.89 灵脉地皮：青光罩 + 灵纹环；眼位加一颗 ✦（走过见过才画，雾里不露）
    if (cell.ley && cell.fog > 0) {
        g.appendChild(svgEl('rect', { x: cx, y: cy, width: size, height: size, fill: '#67e8f9', opacity: cell.fog === 2 ? 0.09 : 0.04 }));
        g.appendChild(svgEl('circle', {
            cx: cx + m, cy: cy + m, r: size * 0.42, fill: 'none', stroke: '#67e8f9',
            'stroke-width': cell.leyEye ? 1.6 : 0.8, opacity: cell.fog === 2 ? (cell.leyEye ? 0.85 : 0.4) : 0.2,
            'class': cell.leyEye ? 'wild-pulse' : ''
        }));
        if (cell.leyEye && cell.fog === 2) {
            // v35 自家占了脉：✦ 换成一颗金钻，图上一眼认出这是自己的根基
            const claimed = leyClaimedHere(cell);
            const star = svgEl('text', { x: cx + size * 0.86, y: cy + size * 0.22, 'font-size': claimed ? 12.5 : 11.5, 'text-anchor': 'middle', 'class': 'wild-badge', fill: claimed ? '#fde68a' : '#a5f3fc', opacity: 0.95 });
            star.textContent = claimed ? '💎' : '✦';
            g.appendChild(star);
        }
    }

    // 采集节点
    if (cell.node && cell.fog === 2 && cell.node.regrowDay <= currentDay()) {
        const badge = svgEl('text', { x: cx + size * 0.78, y: cy + size * 0.28, 'font-size': 12, 'text-anchor': 'middle', 'class': 'wild-badge' });
        badge.textContent = cell.node.icon;
        g.appendChild(badge);
    }

    svg.appendChild(g);
    return g;
}

const POI_COLORS = {
    town: '#fbbf24', market: '#f59e0b', cave: '#a1887f', ruin: '#94a3b8',
    landmark: '#e879f9', spring: '#22d3ee', resource: '#34d399', dungeon: '#a78bfa',
    ferry: '#38bdf8', sect: '#fde68a'
};

// 地名避让的先后次序（v21.x 界面整改 P1）：抬完字号，一格 40 单位装不下并列的地名，
// 撞车时按这个分值留高优先的（全名仍能在右侧「已见地标」里查到）。纯呈现，不参与任何判定。
const POI_LABEL_TIER = {
    sect: 60, dungeon: 55, town: 50, market: 46, landmark: 42,
    spring: 38, resource: 34, ferry: 30, cave: 26, ruin: 22
};

function poiLabelTier(poi, seen, hot) {
    let t = POI_LABEL_TIER[poi.type] || 10;
    if (seen) t += 8;                                              // 看清了的排在只记得名字的前头
    if (hot) t += 40;                                              // 山门有战况 / 任务目标，别藏
    if (poi.visited || poiIsVisited(poi.id)) t += 6;                // 到过的比没到过的值得看
    if (poi.x === playerPos.x && poi.y === playerPos.y) t += 100;   // 脚下这处永远留着
    return t;
}

function drawPoi(svg, poi, size) {
    const row = currentMap[poi.y];
    const cell = row ? row[poi.x] : null;
    if (!cell || cell.fog === 0) return;
    const cx = poi.x * size + size / 2, cy = poi.y * size + size / 2;
    const color = POI_COLORS[poi.type] || '#e5e7eb';
    // v22.2 POI 图标也点击穿透：它同样画在格子上层，旧版点在城镇/秘境图标上没反应，只能瞄图标外的边边
    const g = svgEl('g', { 'pointer-events': 'none' });
    g.appendChild(svgEl('circle', { cx: cx, cy: cy, r: size * 0.30, fill: shadeColor(color, -70), opacity: cell.fog === 2 ? 0.75 : 0.45, stroke: color, 'stroke-width': 1.4 }));
    // 亲脚到过的：外圈加一道实线金环，图上一看便知这里来过
    if (poi.visited || poiIsVisited(poi.id)) {
        g.appendChild(svgEl('circle', { cx: cx, cy: cy, r: size * 0.38, fill: 'none', stroke: '#fde68a', 'stroke-width': 1.2, opacity: cell.fog === 2 ? 0.75 : 0.4 }));
    }
    if (poi.type === 'dungeon') g.appendChild(svgEl('circle', { cx: cx, cy: cy, r: size * 0.34, fill: 'none', stroke: color, 'stroke-width': 1, 'class': 'wild-pulse', opacity: 0.6 }));
    const icon = svgEl('text', { x: cx, y: cy + size * 0.13, 'font-size': size * 0.36, 'text-anchor': 'middle', opacity: cell.fog === 2 ? 1 : 0.6 });
    icon.textContent = poi.icon;
    g.appendChild(icon);
    // v35 角标：山门带战况（🔥兽潮围山 / ⚔️战云压顶），任务目标带 🎯
    let badge = '';
    if (cell.fog === 2) {
        if (poi.type === 'sect') badge = sectPoiBadge(poi.refId || poi.name);
        if (!badge && typeof window.questTargetForPoi === 'function') {
            try { if (window.questTargetForPoi(poi.name)) badge = '🎯'; } catch (e) {}
        }
        if (badge) {
            const bt = svgEl('text', { x: cx + size * 0.34, y: cy - size * 0.22, 'font-size': 11.5, 'text-anchor': 'middle', 'class': 'wild-badge', 'pointer-events': 'none' });
            bt.textContent = badge;
            g.appendChild(bt);
        }
    }
    // 地名：旧版 9 / 8.5 号字实测 8~10px 且互相压字，一律抬到 11.5~12.5。
    // 记不清的那一档仍用灰 #9aa5b1（v20.57 F6 认的就是这个色，两档靠字号分层），
    // 但去掉 opacity .6：那层淡出把对比度从 7.7:1 砸到 2.2~3.5:1，现在由 wild-label 的深色光晕托着。
    if (cell.fog === 2 || poi.discovered) {
        const seen = cell.fog === 2;
        const label = svgEl('text', {
            x: cx, y: cy - size * 0.36, 'font-size': seen ? 12.5 : 11.5,
            'text-anchor': 'middle', fill: seen ? '#fde68a' : '#9aa5b1',
            'class': 'wild-label', 'data-tier': poiLabelTier(poi, seen, !!badge), 'pointer-events': 'none'
        });
        label.textContent = poi.name;
        g.appendChild(label);
    }
    svg.appendChild(g);
}

// 地名避让：字号抬上来之后一格装不下并列地名，按 data-tier 从高到低贪心占位，
// 撞车的低优先地名先藏起来（图标仍在，全名右侧「已见地标」可查）。
// 用估算包围盒而不是 getBBox——视野外的图常在隐藏容器里渲染，getBBox 量不到。
function declutterPoiLabels(svg) {
    if (!svg || !svg.querySelectorAll) return;
    const nodes = Array.prototype.slice.call(svg.querySelectorAll('text.wild-label'));
    if (nodes.length < 2) return;
    const boxes = nodes.map(l => {
        const fs = parseFloat(l.getAttribute('font-size')) || 12;
        const chars = Array.from(l.textContent || '').length || 1;
        const w = chars * fs + 3, h = fs * 1.2;
        const x = parseFloat(l.getAttribute('x')) || 0;
        const y = parseFloat(l.getAttribute('y')) || 0;      // y 是基线
        const anchor = l.getAttribute('text-anchor');
        const left = anchor === 'middle' ? x - w / 2 : (anchor === 'end' ? x - w : x);
        return {
            el: l, tier: Number(l.getAttribute('data-tier')) || 0,
            x0: left, x1: left + w, y0: y - h * 0.78, y1: y + h * 0.28
        };
    }).sort((a, b) => b.tier - a.tier);
    const kept = [];
    boxes.forEach(b => {
        const clash = kept.some(k => b.x0 < k.x1 - 1 && k.x0 < b.x1 - 1 && b.y0 < k.y1 - 1 && k.y0 < b.y1 - 1);
        if (clash) b.el.setAttribute('display', 'none');
        else { b.el.removeAttribute('display'); kept.push(b); }
    });
}

function drawEntities(svg, cell, x, y, size) {
    if (cell.fog !== 2 || !cell.entities.length) return;
    const alive = cell.entities.filter(e => !isEntityDead(e));
    const list = alive.length ? alive : cell.entities.slice(0, 1);
    // v22.2 实体图标一律点击穿透：图标画在格子组之外、叠在可点击的格子上层，
    // 旧版点在人/兽图标上会被图标吃掉点击（格子小、图标挡大半，走路全凭像素级瞄准）——
    // 现在点哪都落到下面的格子，走路/查看照常。
    for (let i = 0; i < Math.min(3, list.length); i++) {
        const e = list[i];
        const ex = x * size + size * (0.3 + i * 0.22), ey = y * size + size * 0.7;
        const t = svgEl('text', { x: ex, y: ey, 'font-size': size * 0.34, 'text-anchor': 'middle', 'pointer-events': 'none' });
        t.textContent = isEntityDead(e) ? '💀' : (e.symbol || '·');
        t.setAttribute('opacity', isEntityDead(e) ? 0.5 : 1);
        svg.appendChild(t);
    }
    if (alive.length > 3) {
        const b = svgEl('text', { x: x * size + size - 6, y: y * size + 12, 'font-size': 12, fill: '#fbbf24', 'text-anchor': 'middle', 'font-weight': 'bold', 'class': 'wild-badge', 'pointer-events': 'none' });
        b.textContent = '+' + (alive.length - 3);
        svg.appendChild(b);
    }
}

function drawPlayer(svg, size) {
    const cx = playerPos.x * size + size / 2, cy = playerPos.y * size + size / 2;
    // v22.2 「我」的棋子同样点击穿透——点自己这格该开脚下格子的查看，而不是没反应
    const g = svgEl('g', { 'class': 'wild-player', 'pointer-events': 'none' });
    g.appendChild(svgEl('circle', { cx: cx, cy: cy, r: size * 0.26, fill: 'rgba(251,191,36,0.25)', filter: 'url(#wild-glow)' }));
    g.appendChild(svgEl('circle', { cx: cx, cy: cy, r: size * 0.21, fill: '#fbbf24', stroke: '#fff', 'stroke-width': 1.6 }));
    const t = svgEl('text', { x: cx, y: cy + size * 0.08, 'font-size': size * 0.23, 'text-anchor': 'middle', 'font-weight': 'bold', fill: '#3b2f0b' });
    t.textContent = '我';
    g.appendChild(t);
    svg.appendChild(g);
}

function drawPathPreview(svg, size) {
    if (!wildTravel || !wildTravel.path) return;
    wildTravel.path.forEach((p, i) => {
        const last = i === wildTravel.path.length - 1;
        svg.appendChild(svgEl('rect', {
            x: p.x * size + 3, y: p.y * size + 3, width: size - 6, height: size - 6,
            fill: 'none', stroke: last ? '#fbbf24' : '#fde68a', 'stroke-width': 1.6,
            'stroke-dasharray': '4 3', opacity: last ? 0.95 : 0.55, 'pointer-events': 'none'
        }));
    });
}

// v49 崖壁洞天：发现过的石室画一线黑洞口（半圆拱门），只在开过雾的格上画
function drawGrottoes(svg, size) {
    let m = null;
    try { m = wildDayMap('grotto'); } catch (e) { return; }
    if (!m) return;
    Object.keys(m).forEach(k => {
        const xy = k.split(',');
        const x = Number(xy[0]), y = Number(xy[1]);
        const cell = (currentMap[y] || [])[x];
        if (!cell || cell.fog === 0) return;
        const cx = x * size + size / 2, cy = y * size + size * 0.68;
        const g = svgEl('g', { 'pointer-events': 'none' });
        g.appendChild(svgEl('path', {
            d: `M${cx - size * 0.13} ${cy} a ${size * 0.13} ${size * 0.17} 0 0 1 ${size * 0.26} 0 z`,
            fill: '#171008', stroke: '#9a8a6e', 'stroke-width': 0.9, opacity: cell.fog === 2 ? 0.95 : 0.5
        }));
        svg.appendChild(g);
    });
}

function drawTimeWeatherOverlay(svg, w, h, ox, oy) {
    const hour = currentHour();
    let fill = null, op = 0;
    if (hour < 5 || hour >= 21) { fill = '#0a1030'; op = 0.42; }
    else if (hour >= 18) { fill = '#3a1e08'; op = 0.24; }
    else if (hour < 7) { fill = '#4a3a10'; op = 0.16; }
    if (fill) svg.appendChild(svgEl('rect', { x: ox, y: oy, width: w, height: h, fill: fill, opacity: op, 'pointer-events': 'none' }));

    // 四时入图：春嫩 / 夏暖 / 秋赭 / 冬灰
    const st = seasonTint();
    svg.appendChild(svgEl('rect', { x: ox, y: oy, width: w, height: h, fill: st.fill, opacity: st.op, 'pointer-events': 'none' }));

    const weather = currentWeatherObj();
    if (!weather) {
        // 冬日无雪也有零星雪沫，别让冬天跟夏天一个样
        if (currentSeason() === 'winter') {
            for (let i = 0; i < 8; i++) {
                svg.appendChild(svgEl('circle', { cx: ox + (i * 89 % w), cy: oy + (i * 47 % h), r: 1.4, fill: '#fff', opacity: 0.5, 'class': 'wild-snow' }));
            }
        }
        return;
    }
    if (weather.id === 'rainy' || weather.id === 'stormy') {
        const n = weather.id === 'stormy' ? 26 : 16;
        for (let i = 0; i < n; i++) {
            const rx = ox + (i * 97 % w), ry = oy + (i * 61 % h);
            svg.appendChild(svgEl('line', { x1: rx, y1: ry, x2: rx - 4, y2: ry + 10, stroke: '#9ec8e8', 'stroke-width': 1, opacity: 0.5, 'class': 'wild-rain' }));
        }
    } else if (weather.id === 'snowy') {
        for (let i = 0; i < 18; i++) {
            svg.appendChild(svgEl('circle', { cx: ox + (i * 53 % w), cy: oy + (i * 37 % h), r: 1.6, fill: '#fff', opacity: 0.65, 'class': 'wild-snow' }));
        }
    } else if (weather.id === 'foggy') {
        for (let i = 0; i < 3; i++) svg.appendChild(svgEl('rect', { x: ox, y: oy + i * h / 3, width: w, height: h / 3, fill: '#cbd5e1', opacity: 0.13, 'pointer-events': 'none' }));
    }
}

// ============ 舆图题跋（v20.57）：图名 / 小印 / 罗盘 ============
// 全是描景，不接点击；一张图打开就有「这是一张画」的样子。
// v20.82：周边双层金框移除——与大地图同口径（v20.69 玩家反馈金框画风不对，有科技感）；
// 罗盘、图名题签、小印保留。
// 注意：边框一律用 path 画，不用带描边的 rect——「方块零描边」是格线门禁。
function framePathD(x, y, w, h) { return `M${x} ${y} H${x + w} V${y + h} H${x} Z`; }

function drawMapDress(svg, w, h, ox, oy) {
    const g = svgEl('g', { 'pointer-events': 'none' });

    // 图名题签：左上角一块，随地区改名
    const region = currentRegionForMap || '野外';
    const title = `《${region}山河舆图》`;
    const tw = title.length * 14 + 18;
    g.appendChild(svgEl('path', { d: framePathD(ox + 14, oy + 12, tw, 25), fill: 'rgba(18,14,7,0.55)', stroke: '#caa96a', 'stroke-width': 0.8, opacity: 0.85 }));
    const tt = svgEl('text', { x: ox + 23, y: oy + 30, 'font-size': 14, fill: '#f3e3c0', 'letter-spacing': 1, 'font-family': '"Songti SC","SimSun",serif' });
    tt.textContent = title;
    g.appendChild(tt);
    // 一方小印，落地区首字
    const sealX = ox + 14 + tw + 7;
    g.appendChild(svgEl('rect', { x: sealX, y: oy + 15, width: 18, height: 18, rx: 2, fill: '#a83232', opacity: 0.85 }));
    const seal = svgEl('text', { x: sealX + 9, y: oy + 29, 'font-size': 12, 'text-anchor': 'middle', fill: '#f7ece0', 'font-family': '"Songti SC","SimSun",serif' });
    seal.textContent = region.charAt(0);
    g.appendChild(seal);

    // 罗盘：右下角一枚，指北针针尖朝上
    const cx = ox + w - 34, cy = oy + h - 34, r = 15;
    g.appendChild(svgEl('circle', { cx: cx, cy: cy, r: r, fill: 'rgba(15,12,6,0.35)', stroke: '#caa96a', 'stroke-width': 0.8, opacity: 0.9 }));
    g.appendChild(svgEl('path', { d: `M${cx} ${cy - r + 3} L${cx + 4} ${cy} L${cx} ${cy + r - 3} L${cx - 4} ${cy} z`, fill: '#e8d9b5', opacity: 0.85 }));
    g.appendChild(svgEl('path', { d: `M${cx - r + 3} ${cy} L${cx} ${cy - 3} L${cx + r - 3} ${cy} L${cx} ${cy + 3} z`, fill: '#8a7a5c', opacity: 0.7 }));
    const north = svgEl('text', { x: cx, y: cy - r - 3, 'font-size': 11.5, 'text-anchor': 'middle', fill: '#f3e3c0', 'class': 'wild-badge' });
    north.textContent = '北';
    g.appendChild(north);

    svg.appendChild(g);
}

function updateMinimap() {
    const mini = document.getElementById('wild-minimap');
    if (!mini || !currentMap.length) return;
    const cols = currentMap[0].length, rows = currentMap.length;
    const s = 3;
    mini.setAttribute('viewBox', `0 0 ${cols * s} ${rows * s}`);
    while (mini.firstChild) mini.removeChild(mini.firstChild);
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const c = currentMap[y][x];
            if (c.fog === 0) { mini.appendChild(svgEl('rect', { x: x * s, y: y * s, width: s, height: s, fill: '#1b2130' })); continue; }
            const col = c.poiId ? '#fbbf24' : c.terrain.base;
            mini.appendChild(svgEl('rect', { x: x * s, y: y * s, width: s, height: s, fill: col, opacity: c.fog === 2 ? 1 : 0.55 }));
        }
    }
    mini.appendChild(svgEl('rect', {
        x: viewportOffset.x * s, y: viewportOffset.y * s,
        width: MAP_CONFIG.VIEWPORT_COLS * s, height: MAP_CONFIG.VIEWPORT_ROWS * s,
        fill: 'none', stroke: '#e5e7eb', 'stroke-width': 0.6, opacity: 0.8
    }));
    mini.appendChild(svgEl('rect', { x: playerPos.x * s - 0.5, y: playerPos.y * s - 0.5, width: s + 1, height: s + 1, fill: '#fff' }));
}

// ============ 主渲染 ============
function renderMap(svgElement, map, viewX, viewY) {
    if (!svgElement || !map || !map.length) return;
    const svg = svgElement;
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const rows = map.length, cols = map[0].length, size = MAP_CONFIG.CELL_SIZE;

    const defs = svgEl('defs', {});
    defs.innerHTML = '<filter id="wild-glow" x="-50%" y="-50%" width="200%" height="200%">' +
        '<feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
    svg.appendChild(defs);

    const startX = viewX, startY = viewY;
    const endX = Math.min(startX + MAP_CONFIG.VIEWPORT_COLS, cols);
    const endY = Math.min(startY + MAP_CONFIG.VIEWPORT_ROWS, rows);
    // 图上的东西都画在「绝对坐标」上，视野窗就得跟着开到那一片——
    // 窗口钉在左上角的话，人一走到右半边，连「我」都出不了画
    svg.setAttribute('viewBox', `${startX * size} ${startY * size} ${MAP_CONFIG.VIEWPORT_COLS * size} ${MAP_CONFIG.VIEWPORT_ROWS * size}`);

    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            const cell = map[y][x];
            const g = drawWildCell(svg, cell, x, y, size);
            g.style.cursor = 'pointer';
            // 第九十五波·NEW-07：格子组打上坐标，点击统一由 svg 委托处理（见下方 _bindMapDelegation）
            g.setAttribute('data-cx', x);
            g.setAttribute('data-cy', y);
            if (cell.fog === 0) {
                g.appendChild(svgEl('rect', { x: x * size, y: y * size, width: size, height: size, fill: '#0d1017', opacity: 0.92 }));
            } else if (cell.fog === 1) {
                g.appendChild(svgEl('rect', { x: x * size, y: y * size, width: size, height: size, fill: '#0b1020', opacity: 0.4 }));
            }
            drawEntities(svg, cell, x, y, size);
        }
    }

    currentPois.forEach(p => drawPoi(svg, p, size));
    drawGrottoes(svg, size);   // v49 崖壁洞天：发现过的石室在图上留一线黑洞口（未开雾不画）
    drawNotes(svg, size);      // v52 粉笔笔记：自己记的样留在格角（未开雾不画）
    drawPathPreview(svg, size);
    drawPlayer(svg, size);
    drawWildDrift(svg, size);
    // 铺满整窗的天色与题跋：窗开在哪，它们就得铺在哪
    drawTimeWeatherOverlay(svg, MAP_CONFIG.VIEWPORT_COLS * size, MAP_CONFIG.VIEWPORT_ROWS * size, startX * size, startY * size);
    drawMapDress(svg, MAP_CONFIG.VIEWPORT_COLS * size, MAP_CONFIG.VIEWPORT_ROWS * size, startX * size, startY * size);
    // 地名抬字号后容易打架，最后统一做一次避让（只藏字，不藏图标）
    declutterPoiLabels(svg);

    updateInfo();
    updateMinimap();
    renderWildSidebar();
    saveWildState();
    _bindMapDelegation(svg);
}

// 第九十五波·NEW-07：地图点击一处委托——落在格子组上按 data-cx/cy 取格，
// 落在实体图标/雾层/缝隙（这些叠在格子组之外）上则按点击坐标反算格子，
// 保证「点哪都能走路/查看」，不再是像素级瞄准或合成事件打空。
function _bindMapDelegation(svg) {
    if (!svg || svg._cellDelegated) return;
    svg._cellDelegated = true;
    function cellFromEvent(ev) {
        // 优先：命中带坐标的格子组
        var t = ev.target;
        if (t && typeof t.closest === 'function') {
            var g = t.closest('g[data-cx]');
            if (g) return { x: +g.getAttribute('data-cx'), y: +g.getAttribute('data-cy') };
        }
        // 兜底：按点击坐标 + 当前 viewBox 反算绝对格子
        try {
            var vb = (svg.getAttribute('viewBox') || '').split(/\s+/).map(Number);
            var rect = svg.getBoundingClientRect();
            if (vb.length === 4 && rect && rect.width > 0 && rect.height > 0) {
                var size = MAP_CONFIG.CELL_SIZE;
                var px = (ev.clientX - rect.left) / rect.width * vb[2] + vb[0];
                var py = (ev.clientY - rect.top) / rect.height * vb[3] + vb[1];
                return { x: Math.floor(px / size), y: Math.floor(py / size) };
            }
        } catch (e) {}
        return null;
    }
    svg.addEventListener('click', function (ev) {
        var c = cellFromEvent(ev);
        if (c) onCellClick(c.x, c.y);
    });
    svg.addEventListener('contextmenu', function (ev) {
        var c = cellFromEvent(ev);
        if (c) { ev.preventDefault(); onCellInspect(c.x, c.y); }
    });
}

// ============ 右侧栏 ============
function fmtHours(minutes) {
    if (minutes < 60) return Math.round(minutes) + ' 分钟';
    const h = minutes / 60;
    return (h % 1 === 0 ? h : h.toFixed(1)) + ' 个时辰';
}

function renderWildSidebar() {
    const env = document.getElementById('wild-env-info');
    if (env) {
        const w = currentWeatherObj();
        const hour = currentHour();
        const period = hour < 5 ? '子夜' : hour < 7 ? '破晓' : hour < 11 ? '清晨' : hour < 13 ? '正午' : hour < 18 ? '午后' : hour < 21 ? '黄昏' : '入夜';
        const st = seasonTint();
        env.textContent = `${st.icon}${st.name} · ${w ? w.icon + ' ' + w.name : ''} · 第${currentDay()}日 ${period}`;
    }

    // 脚下信息
    const info = document.getElementById('wild-tile-info');
    const row = currentMap[playerPos.y];
    const cell = row ? row[playerPos.x] : null;
    if (info && cell) {
        const poi = cell.poiId ? currentPois.find(p => p.id === cell.poiId) : null;
        const nodeReady = cell.node && cell.node.regrowDay <= currentDay();
        const hz = TERRAIN_HAZARD[cell.terrainKey];
        const poiTitle = poi ? (poi.icon + ' ' + poi.name + (poi.variantName ? '·' + poi.variantName : '')) : effTerrainOf(cell).name;
        info.innerHTML =
            `<div class="font-bold text-yellow-400">${poiTitle}</div>` +
            (poi && poi.variant && poi.variant.desc ? `<div class="text-gray-500 mt-0.5">${poi.variant.desc}</div>` : '') +
            `<div class="text-gray-400 mt-0.5">灵气 ${cell.qi.toFixed(2)} · ${isNightNow() ? '夜色已深' : '白日可行'}${cell.node ? (nodeReady ? ' · 有可采之物' : ' · 已采光，还要 ' + (cell.node.regrowDay - currentDay()) + ' 日再生') : ''}</div>` +
            (cell.ley ? (leyClaimedHere(cell)
                ? `<div class="text-yellow-300 mt-0.5">💎 自家灵脉 · ${cell.ley} 重灵蕴——护脉大阵已布，日产灵石入袋</div>`
                : `<div class="text-cyan-300 mt-0.5">🌀 灵脉之地 · ${cell.ley} 重灵蕴${cell.leyEye ? '（脉眼）' : ''} —— 强敌盘踞，斩获亦丰</div>`) : '') +
            (poi && window.questTargetForPoi ? (function () { const q = window.questTargetForPoi(poi.name); return q ? `<div class="text-purple-300 mt-0.5">🎯 与《${q.title}》有关</div>` : ''; })() : '') +
            (hz ? `<div class="text-amber-500/90 mt-0.5">⚠️ ${hz.hint}</div>` : '') +
            (activeNemesis() ? `<div class="text-red-400 mt-0.5">🗡️ 梁子未了：「${activeNemesis().name}」在本域游荡（已了 ${activeNemesis().wins || 0}/${NEMESIS_SLAY_WINS}）——道上当心</div>` : '') +
            (function () { const _mk = NOTE_MARKS[noteAt(playerPos.x, playerPos.y)]; return _mk ? `<div class="text-gray-300 mt-0.5">🖊 你的粉笔印：${_mk.icon}「${_mk.name}」——${_mk.hint}</div>` : ''; })();   // v52 脚下的笔记一眼认回
    }

    // 动作区
    const acts = document.getElementById('wild-actions');
    if (acts) {
        let html = '';
        if (wildTravel) {
            html += `<button data-act="travel-go" class="w-full text-xs bg-yellow-600 hover:bg-yellow-500 text-gray-900 font-bold py-1.5 rounded transition">出发（${wildTravel.path.length} 步 · 约 ${fmtHours(wildTravel.cost * 10 * weatherTravelMul())}）</button>`;
            html += `<button data-act="travel-cancel" class="w-full text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 py-1 rounded transition mt-1">取消</button>`;
        } else {
            const tileActs = tileActions(cell);
            html = tileActs.map(a => `<button data-act="${a.act}" class="w-full text-xs ${a.primary ? 'bg-indigo-700 hover:bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'} text-gray-200 py-1.5 rounded transition text-left px-2">${a.label}</button>`).join('');
            if (!html) html = '<p class="text-xs text-gray-500">环顾四野，暂无可为之事。</p>';
        }
        acts.innerHTML = html;
    }

    // 已见地标
    const list = document.getElementById('wild-poi-list');
    if (list) {
        const seen = currentPois.filter(p => p.discovered);
        if (!seen.length) {
            list.innerHTML = '<p class="text-xs text-gray-500 text-center">尚无所见，往雾里走走。</p>';
        } else {
            list.innerHTML = seen.map(p => {
                const d = Math.abs(p.x - playerPos.x) + Math.abs(p.y - playerPos.y);
                const been = p.visited || poiIsVisited(p.id);
                return `<div class="flex justify-between items-center bg-gray-800/70 px-2 py-1 rounded border border-gray-700 hover:border-yellow-600 cursor-pointer" data-act="poi-goto" data-poi="${p.id}">` +
                    `<span class="text-xs ${been ? 'text-yellow-300' : 'text-gray-200'}">${p.icon} ${p.name}</span>` +
                    `<span class="text-[10px] ${d === 0 ? 'text-green-400' : been ? 'text-yellow-600' : 'text-gray-500'}">${d === 0 ? '脚下' : been ? '已至 · ' + d + ' 格' : d + ' 格'}</span></div>`;
            }).join('');
        }
    }

    // 野外的动静（v20.62）：兽群商队巡查都在走，图不只是一堆钉死的图标
    renderWildLifeList();

    // v35 任务指路：接了的任务若指向本图某处地物，侧栏给个方位，图上挂 🎯
    try {
        const hintBox = document.getElementById('wild-quest-hint');
        if (hintBox) {
            const hints = (typeof window.questPoiHints === 'function') ? (window.questPoiHints(currentPois) || []).slice(0, 2) : [];
            hintBox.innerHTML = hints.map(h => {
                const d = Math.abs(h.poi.x - playerPos.x) + Math.abs(h.poi.y - playerPos.y);
                const dir = d === 0 ? '就在脚下' : dirName(h.poi.x - playerPos.x, h.poi.y - playerPos.y) + '约 ' + d + ' 格';
                return `<div class="flex justify-between items-center bg-purple-900/30 px-2 py-1 rounded border border-purple-700/50 hover:border-purple-500 cursor-pointer" data-act="poi-goto" data-poi="${h.poi.id}">` +
                    `<span class="text-xs text-purple-200">🎯《${h.title}》→ ${h.poi.icon} ${h.poi.name}</span>` +
                    `<span class="text-[10px] text-purple-400">${dir}</span></div>`;
            }).join('');
        }
    } catch (e) {}

    // v36 游历见闻：走过几域、见过几处地标、脚下多少步，一行小账
    try { if (typeof window.renderTravelJournal === 'function') window.renderTravelJournal(); } catch (e) {}

    // v41 镖旗：手里押着镖，侧栏挂一行——目标方位、酬金、余日，点击复用指路接线
    // v43 长线大镖：目标是「别域的随便哪处镇子」，没有单点可指——挂域名与余日，不给指路钮
    try {
        const escBox = document.getElementById('wild-escort-line');
        if (escBox) {
            const e = escortCarrying() ? escortLedger() : null;
            if (e && e.long) {
                const left = Math.max(0, Number(e.deadlineDay) - wildAbsDay());
                const arrived = e.toRegion === currentRegionForMap;
                escBox.innerHTML = `<div class="flex justify-between items-center bg-amber-900/30 px-2 py-1 rounded border border-amber-700/50">` +
                    `<span class="text-xs text-amber-200">📦「${e.cargo}」大镖 → 🗺️ ${e.toRegion}</span>` +
                    `<span class="text-[10px] ${arrived ? 'text-green-400' : 'text-amber-400'}">${arrived ? '已到·寻镇交割' : '跨域途中'} · 酬 ${e.fee} · 余 ${left} 日</span></div>`;
            } else {
                const tp = e ? currentPois.find(x => x.id === e.toId) : null;
                if (e && tp) {
                    const d = Math.abs(tp.x - playerPos.x) + Math.abs(tp.y - playerPos.y);
                    const dir = d === 0 ? '就在脚下' : dirName(tp.x - playerPos.x, tp.y - playerPos.y) + '约 ' + d + ' 格';
                    const left = Math.max(0, Number(e.deadlineDay) - wildAbsDay());
                    escBox.innerHTML = `<div class="flex justify-between items-center bg-amber-900/30 px-2 py-1 rounded border border-amber-700/50 hover:border-amber-500 cursor-pointer" data-act="poi-goto" data-poi="${tp.id}">` +
                        `<span class="text-xs text-amber-200">📦「${e.cargo}」镖 → ${tp.icon || '🏘️'} ${tp.name}</span>` +
                        `<span class="text-[10px] text-amber-400">${dir} · 酬 ${e.fee} · 余 ${left} 日</span></div>`;
                } else {
                    escBox.innerHTML = '';
                }
            }
        }
    } catch (e) {}

    // 出此境往（v20.63）：九州接壤才走得过去，关隘里数先说清
    if (window.WorldMap && typeof window.WorldMap.renderExits === 'function') window.WorldMap.renderExits();

    // v44 天界回尘：仙界没有接壤的关隘，出境只有一条路——散仙自便，回你来时的地界
    try {
        if (currentRegionForMap === '天界') {
            const exitBox = document.getElementById('wild-exit-list');
            if (exitBox) exitBox.innerHTML = '<button data-act="leave-tianjie" class="w-full text-xs bg-amber-800 hover:bg-amber-700 text-amber-100 py-1.5 rounded">🌅 回入尘世（返回来时的地界）</button>';
        }
    } catch (e) {}

    // 图例
    const legend = document.getElementById('wild-legend');
    if (legend) {
        const keys = ['PLAIN', 'FOREST', 'MOUNTAIN', (isFrozenNow() ? 'RIVER_ICE' : 'WATER'), 'ROAD', 'SPRING'];   // 冬天图例里水变冰
        legend.innerHTML = keys.map(k => {
            const t = WildTerrain.TERRAIN[k];
            return `<span class="inline-flex items-center gap-0.5"><i style="display:inline-block;width:8px;height:8px;background:${t.base};border-radius:2px;"></i>${t.name}</span>`;
        }).join('');
    }
}

function tileActions(cell) {
    if (!cell) return [];
    const out = [];
    const poi = cell.poiId ? currentPois.find(p => p.id === cell.poiId) : null;
    if (cell.node && cell.node.regrowDay <= currentDay()) out.push({ act: 'gather', label: `${cell.node.icon} 采集${NODE_KIND_NAMES[cell.node.kind] || '药草'}（半刻）`, primary: true });
    if (poi) {
        const vn = poi.variantName ? '·' + poi.variantName : '';
        if (poi.type === 'town') {
            const r = (poi.variant && poi.variant.rest) || { cost: 4, stones: 3 };
            out.push({ act: 'rest', label: `🍲 在${poi.name}${vn}打尖（${r.cost} 个时辰${r.stones ? ' · 灵石 ' + r.stones : ' · 免费'}）`, primary: true });
            // v40 兑现变体卡上的两句老话：篷车集能问行情、驿亭能问路
            const vk = (poi.variant && poi.variant.key) || '';
            if (vk === 'caravan') {
                out.push({ act: 'ask-market', label: '🐫 向商队打听各处行情（一个时辰）' });
                // v41 镖局的野外卖口：接一趟真镖，走一段真路
                out.push({ act: 'escort-job', label: '📦 接一趟护镖（送到才结账）' });
                // v43 跨域大镖：有陆路邻域才发得出去（接壤账在 WorldMap，纯读零骰）
                let _nbCount = 0;
                try { _nbCount = (window.WorldMap && typeof window.WorldMap.neighborsOf === 'function') ? (window.WorldMap.neighborsOf(currentRegionForMap) || []).length : 0; } catch (e) {}
                if (_nbCount) out.push({ act: 'escort-long', label: '📦 接一趟跨域大镖（酬 ' + ESCORT_LONG_FEE + ' · 限 ' + ESCORT_LONG_DAYS + ' 日）' });
            }
            if (vk === 'post') out.push({ act: 'ask-road', label: '🍵 讨碗粗茶问路（一个时辰）' });
        }
        if (poi.type === 'market') out.push({ act: 'shop', label: '🛒 逛' + (poi.variantName || '坊市'), primary: true });
        if (poi.type === 'cave') out.push({ act: 'cultivate', label: '🧘 入' + (poi.variantName || '洞') + '修炼', primary: true });
        if (poi.type === 'ruin') out.push({ act: 'explore', label: '🔍 探' + (poi.variantName || '遗迹') + '「' + poi.name + '」', primary: true });
        if (poi.type === 'landmark') out.push({ act: 'explore', label: '🔍 探索「' + poi.name + '」', primary: true });
        if (poi.type === 'spring') out.push({ act: 'spring', label: '⛲ 在' + (poi.variantName || '灵泉') + '汲灵（两个时辰）', primary: true });
        if (poi.type === 'resource') out.push({ act: 'harvest', label: '⛏️ 采撷「' + poi.name + '」', primary: true });
        if (poi.type === 'dungeon') out.push({ act: 'dungeon', label: '🌀 进入「' + poi.name + '」', primary: true });
        if (poi.type === 'ferry') out.push({ act: 'ferry', label: isFrozenNow() ? '⛴️ 渡口（冬歇——河面封冻）' : '⛴️ 雇舟渡水（灵石 ' + FERRY_FARE + '）', primary: true });
        if (poi.type === 'sect') out.push({ act: 'sect-visit', label: '🏯 至「' + poi.name + '」山门', primary: true });
    }
    // v35 脉眼可夺：站在这处脉眼上、还没归谁，就能布阵占下来（金丹+，真扣灵石）
    if (cell.leyEye && !leyClaimedHere(cell)) {
        let _mv = false;
        try { const _v = window.getSpiritVein && window.getSpiritVein(); _mv = !!(_v && !_v.location); } catch (e) {}
        out.push({ act: 'claim-ley', label: '⛏️ 布阵夺脉（金丹 · 灵石 ' + (_mv ? 600 : 1000) + (_mv ? ' · 迁脉' : '') + '）', primary: true });
    }
    // v36 路上也有路上的活法：绿洲可歇脚、灵池可淬体（一日一回的账在函数里）
    if (!poi && cell.terrainKey === 'OASIS') out.push({ act: 'oasis-rest', label: '🏝️ 在绿洲边歇脚（两个时辰）' });
    if (!poi && cell.terrainKey === 'QIPOOL') out.push({ act: 'pool-bathe', label: '🛁 灵池淬体（四个时辰）' });
    // v49 崖壁洞天：发现过的石室才开这条缝（账在差量存档里，重开图也在）
    if (!poi && cell.terrainKey === 'MOUNTAIN' && grottoAt(playerPos.x, playerPos.y)) out.push({ act: 'grotto-enter', label: '🕳️ 入崖壁洞天（行功四个时辰）', primary: true });
    // v38 扎营：没有正经落脚处（POI）的野地才风餐露宿（v46 水面上扎不了营也坐不住；v47 冬天封冻的冰面是实地，照扎照坐）
    const _effKey = seasonTerrainKey(cell);
    if (!poi && _effKey !== 'WATER') out.push({ act: 'camp', label: '⛺ 扎营歇夜（至次日清晨）' });
    if (_effKey !== 'WATER') out.push({ act: 'meditate', label: '🌬️ 就地打坐（一个时辰）' });
    // v52 粉笔笔记：给脚下记一笔（明水面挂不住粉笔；冬天封冻的冰面是实地照记）
    if (_effKey !== 'WATER') {
        const _nk = noteAt(playerPos.x, playerPos.y);
        const _nmk = _nk && NOTE_MARKS[_nk];
        out.push({ act: 'note-menu', label: _nmk ? `🖊 粉笔印「${_nmk.name}」（改一笔/抹掉）` : '🖊 记一笔粉笔印' });
    }
    // 第六十一波 · 搭商队同行：近旁有商队能求捎带，搭着伙随时能道别（明水面上喊不着人）
    if (_effKey !== 'WATER') {
        if (companionActive()) out.push({ act: 'leave-caravan', label: '🐫 与商队道别（各走各路）' });
        else if (caravanNearby()) out.push({ act: 'join-caravan', label: '🐫 求商队捎带一程（搭伙同行）' });
    }
    return out;
}

// ============ 交互 ============
function onCellInspect(x, y) {
    const row = currentMap[y];
    const cell = row ? row[x] : null;
    if (!cell) return;
    if (cell.fog === 0) { showMessage('那一片还未踏足，雾里看不真切。', 'info'); return; }
    const names = (cell.entities || []).filter(e => !isEntityDead(e)).map(e => `${e.symbol}${e.name || ''}`);
    const _nk = noteAt(x, y); const _nmk = _nk && NOTE_MARKS[_nk];   // v52 自己记的粉笔样，看图时一眼认回
    showMessage(`【${effTerrainOf(cell).name}】灵气 ${cell.qi.toFixed(2)}${cell.ley ? ' · 🌀灵脉' + cell.ley + '重' : ''}${names.length ? ' · ' + names.join('、') : ''}${_nmk ? ' · 🖊' + _nmk.icon + '「' + _nmk.name + '」' : ''}`, 'info');
}

function onCellClick(x, y) {
    const row = currentMap[y];
    const cell = row ? row[x] : null;
    if (!cell) return;
    if (cell.fog === 0) { showMessage('那一片还未踏足，先走近些。', 'info'); return; }
    const dist = Math.abs(x - playerPos.x) + Math.abs(y - playerPos.y);
    if (dist === 0) { onCellInspect(x, y); return; }
    // 第四十六波 · 泅渡与踏水：水格不走寻路（寻路眼里水仍是墙）——只能贴着岸边一格一格下水
    // 第八十九波 · 天险格同理：漩涡/冰隙在寻路眼里仍是墙，会飞的坐骑贴着一格一格掠过去
    if (dist === 1 && (cell.terrainKey === 'WATER' || isAloftCell(cell))) { stepTo(x, y); wildTravel = null; return; }
    const res = WildTerrain.findPath(currentMap.map(r => r.map(c => ({ t: seasonTerrainKey(c) }))), { x: playerPos.x, y: playerPos.y }, { x: x, y: y });   // v47 冬天冰面入网格：封冻的河就是路
    if (!res) {
        showMessage(cell.terrainKey === 'WATER'
            ? '水面寻路不得——走到岸边，贴着水一格一格泅过去（金丹以上可踏水如地），或寻渡口雇舟。'
            : (flyingMountNow() && (cell.terrainKey === 'WHIRLPOOL' || cell.terrainKey === 'CREVASSE')
                ? '天险横在当中——坐骑再能飞，也得贴着它一格一格掠过去（走到漩涡/冰隙旁边再点它）。'
                : '那边过不去。'), 'warning');
        return;
    }
    if (res.path.length === 1) { stepTo(x, y); wildTravel = null; return; }
    wildTravel = { path: res.path, cost: res.cost, targetName: (cell.poiId ? ((currentPois.find(p => p.id === cell.poiId) || {}).name) : null) || effTerrainOf(cell).name };
    renderMap(mapContainer, currentMap, viewportOffset.x, viewportOffset.y);
}

function centerViewport() {
    viewportOffset = {
        x: Math.max(0, Math.min(playerPos.x - Math.floor(MAP_CONFIG.VIEWPORT_COLS / 2), MAP_CONFIG.COLS - MAP_CONFIG.VIEWPORT_COLS)),
        y: Math.max(0, Math.min(playerPos.y - Math.floor(MAP_CONFIG.VIEWPORT_ROWS / 2), MAP_CONFIG.ROWS - MAP_CONFIG.VIEWPORT_ROWS))
    };
}

// 走一格：结时间、开雾、可能撞上事
// 第八十九波 · 坐骑脚力口：会飞的（fly）腾空掠天险，会水的（water）甲壳即舟——此前两笔账全是死数据
function activeMountNow() {
    try { return (typeof window.getActiveMount === 'function') ? window.getActiveMount() : null; } catch (eMnt) { return null; }
}
function flyingMountNow() { const m = activeMountNow(); return !!(m && m.mount && m.mount.fly) ? m : null; }
function isAloftCell(cell) { return !!flyingMountNow() && !!cell && (cell.terrainKey === 'WHIRLPOOL' || cell.terrainKey === 'CREVASSE'); }

function stepTo(x, y) {
    const row = currentMap[y];
    const cell = row ? row[x] : null;
    const _mountNow = activeMountNow();
    const _flying = !!(_mountNow && _mountNow.mount && _mountNow.mount.fly);
    const _waterMount = !!(_mountNow && _mountNow.mount && _mountNow.mount.water);
    // 第四十六波 · 泅渡与踏水：水域放行（账在下面），漩涡冰隙照旧是墙（御空掠过除外）
    if (!cell || (!WildTerrain.passable({ t: cell.terrainKey }) && cell.terrainKey !== 'WATER'
        && !(_flying && (cell.terrainKey === 'WHIRLPOOL' || cell.terrainKey === 'CREVASSE')))) {
        showMessage('过不去。', 'warning');
        return false;
    }
    const _isWater = cell.terrainKey === 'WATER';
    // 御空：飞在天上——漩涡在脚下打转，冰隙在身下裂着，都够不着人
    const _aloft = _flying && (cell.terrainKey === 'WHIRLPOOL' || cell.terrainKey === 'CREVASSE');
    if (_aloft && !_aloftNoticed) {
        _aloftNoticed = true;
        showMessage(cell.terrainKey === 'WHIRLPOOL'
            ? '🌪️ 漩涡在脚下打转，搅得动舟船，搅不动天上的你——' + _mountNow.name + '双翼一振，掠了过去。'
            : '🏔️ 冰隙深不见底，从前是拦路的墙；如今' + _mountNow.name + '驮着你一振翼，就从裂口上头过去了。', 'info');
    }
    // 四十七波 · 四时改地：冬天水面封冻——冰是实地，泅渡踏水的账全不适用，按河冰走
    const _frozen = _isWater && isFrozenNow();
    let _treading = false;
    let _carried = false;   // 第八十九波：坐骑驮着渡水（飞的水上掠、龙龟水面渡）——泅渡的精力账、湿衣账全不适用
    if (_isWater && !_frozen) {
        _carried = _flying || _waterMount;
        if (_carried) {
            if (!_waterMountNoticed) {
                _waterMountNoticed = true;
                showMessage(_flying
                    ? '🌊 ' + _mountNow.name + '贴着水面掠过去——浪头在脚下翻，衣角不沾半点湿。'
                    : '🐢 ' + _mountNow.name + '不紧不慢地划进水里——龟甲即舟，稳如平地，比泅水省力多了。', 'info');
            }
        } else {
        const _cdW = window.currentCharData;
        let _tierW = 0;
        try { _tierW = (typeof window.getRealmTier === 'function') ? (window.getRealmTier((_cdW || {}).realm) || 0) : 0; } catch (e) {}
        _treading = _tierW >= WATERWALK_TIER;
        const _fromW = (currentMap[playerPos.y] || [])[playerPos.x];
        const _enW = _cdW ? Number(_cdW.energy != null ? _cdW.energy : 100) : 100;
        // 岸上入水门槛：气力不济不下水；已经在水里的人拦不得（回岸的路永远开着）
        if (!_treading && _cdW && _enW < SWIM_GATE && !(!!_fromW && _fromW.terrainKey === 'WATER')) {
            showMessage('🏊 气力不济——这会儿下水就是送命。岸上歇到精力足 ' + SWIM_GATE + ' 再游，或寻渡口雇舟。', 'warning');
            return false;
        }
        if (!_waterEntryNoticed) {
            _waterEntryNoticed = true;
            showMessage(_treading
                ? '🌊 金丹真元托底，履水如平地——水面只起一圈涟漪，脚底不沾半点湿。'
                : '🏊 下水了——泅水一格一格来：每格 ' + SWIM_MIN_PER_CELL + ' 分钟、耗精力 ' + SWIM_ENERGY + '，深处有暗流，莫贪远岸；要过大江大海，还是寻渡口雇舟。', 'info');
        }
        }
    }
    // 第三十八波 · 力竭账：精力见底腿是真沉（每格耗时 +30%），见底还硬撑是真伤身（每格 -2 气血）
    const _cdStep = window.currentCharData;
    const _enStep = _cdStep ? Number(_cdStep.energy != null ? _cdStep.energy : 100) : 100;
    if (_cdStep && _enStep >= 20) { _cdStep._wearyNoticed = false; _cdStep._spentNoticed = false; _swimForcedNoticed = false; }
    // 四十七波风味：头一回踏上冬冰、头一回春天涉水，各念叨一句（一场一回，开图翻篇）
    if (_frozen && !_iceEntryNoticed) {
        _iceEntryNoticed = true;
        showMessage('🧊 河面封了冻——冬天的大路从水上过。冰层看着厚实，深处暗流掏空了冰底，脚下留神。', 'info');
    }
    if (!_isWater && cell.terrainKey === 'FORD' && currentSeason() === 'spring' && !_fordFloodNoticed) {
        _fordFloodNoticed = true;
        showMessage('🌊 春汛涨了水，浅滩淹到腰——过得去，过得慢（耗时多五成，湿寒也更易上身）。', 'info');
    }
    let cost = _isWater
        ? (_frozen ? (WildTerrain.TERRAIN.RIVER_ICE.moveCost * 10) : ((_treading || _carried) ? WATERWALK_MIN_PER_CELL : SWIM_MIN_PER_CELL)) * weatherTravelMul()   // v47 冰行按河冰的账（20 分钟/格，与雇舟同速——省的是船钱）；v89 坐骑渡水与踏水同速
        : (_aloft ? 2 : (cell.terrain.moveCost || 1)) * 10 * weatherTravelMul() * seasonTravelMul(cell) * companionPaceMul();   // 六十一波：搭着商队走，脚程随车队；v89 御空掠险按 20 分钟/格——天险于飞骑只是一振翼
    if (_cdStep && _enStep < 20) {
        cost *= 1.3;
        // v46 水上不念陆地的经（「扎营歇一歇」在水面是屁话）——耗时的账照收，警告交给水自己的话术；v47 冰面是实地，照念
        if (!(_isWater && !_frozen) && !_cdStep._wearyNoticed) {
            _cdStep._wearyNoticed = true;
            showMessage('😮‍💨 力竭了——精力不足两成，腿像灌了铅，每格路都多耗三成工夫。扎营歇一歇，或硬撑。', 'warning');
        }
    }
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(Math.round(cost), '野外赶路');
    }
    if (_isWater && !_frozen && _cdStep) {
        if (_carried) {
            // 第八十九波：坐骑驮着渡水——泅渡的精力账、硬撑的气血账都不记（翅膀和龟甲不费你的腿）
        } else if (_treading) {
            _cdStep.energy = Math.max(0, (_cdStep.energy || 100) - WATERWALK_ENERGY);
        } else if (Number(_cdStep.energy != null ? _cdStep.energy : 100) < SWIM_GATE) {
            // 水中力竭：硬撑改烧气血（入水门槛拦得住岸上的人，拦不住已经在水里的人——但水会记账）
            harmChar(SWIM_FORCE_HP, 0, 0);
            if (!_swimForcedNoticed) {
                _swimForcedNoticed = true;
                showMessage('🩸 气力不济还在水里硬撑——每划一步都在烧气血（每格 ' + SWIM_FORCE_HP + ' 点），快上岸或寻渡船。', 'warning');
            }
        } else {
            _cdStep.energy = Math.max(0, (_cdStep.energy || 100) - SWIM_ENERGY);
        }
    } else if (!_aloft && (cell.terrain.moveCost || 1) >= 2 && _cdStep) {
        _cdStep.energy = Math.max(0, (_cdStep.energy || 100) - 1);
    }
    // 第五十五波 · 泅渡湿衣损货：泅水浑身透湿、涉浅滩下半身湿；镖货跟着人过水（踏水/冰面/雇舟照旧不湿）
    // 第八十九波：坐骑驮着渡水的人也不湿——人在甲背上/风翼上，水花够不着
    if (_cdStep && !_frozen) {
        if (_isWater && !_treading && !_carried) { makeWet('泅在水里'); wetEscortCargo('泅渡过河'); }
        else if (!_isWater && cell.terrainKey === 'FORD') { makeWet('涉过浅滩'); wetEscortCargo('涉水过浅滩'); }
    }
    if (!_isWater && _cdStep && isWetNow()) {
        // 湿衣坠身：陆地每格多耗一点（显式判 null——精力见底是 0 不是 100，力竭账不能被「湿衣」抹掉）
        _cdStep.energy = Math.max(0, Number(_cdStep.energy != null ? _cdStep.energy : 100) - WET_STEP_EN);
    }
    // 第五十九波 · 带病行走：风寒未愈，陆地每格再多耗一点（与湿衣两本账叠加，判空写法同款）
    if (!_isWater && _cdStep && isChilledNow()) {
        _cdStep.energy = Math.max(0, Number(_cdStep.energy != null ? _cdStep.energy : 100) - CHILL_STEP_EN);
    }
    // 第六十三波 · 吃饱脚程：饭劲把这一格真耗掉的精力省回来（每格至多 1 点——耗多少省多少；
    // 平路不耗不省，吃饭吃不成刷精力的路子；力竭见底不救，吃饱抵不了垮账）
    if (!_isWater && _cdStep && isFedNow()) {
        const _enNowF = Number(_cdStep.energy);
        if (isFinite(_enNowF) && _enNowF > 0) {
            const _spentStep = Math.max(0, _enStep - _enNowF);
            if (_spentStep > 0) {
                let _fedMax = 100;
                try { if (typeof window.getEffectiveMax === 'function') _fedMax = Number(window.getEffectiveMax('energy')) || 100; } catch (eFedMax) {}
                _cdStep.energy = Math.min(_fedMax, _enNowF + Math.min(MEAL_STEP_SAVE, _spentStep));
            }
        }
    }
    if (_cdStep && Number(_cdStep.energy != null ? _cdStep.energy : 100) <= 0) {
        harmChar(2, 0, 0);
        if (!_cdStep._spentNoticed) {
            _cdStep._spentNoticed = true;
            showMessage('🩸 精力耗尽还在硬撑——全靠真元吊着腿，每走一步都在伤身（气血 -2/格）。', 'warning');
        }
    }
    playerPos = { x: x, y: y };
    window.playerPos = playerPos;
    centerViewport();
    revealAround(x, y);
    if (cell.poiId) markPoiVisited(cell.poiId);
    // v36 走一步记一步：步数里程碑在见闻账里发悟道点
    try { if (window.TravelJournal) window.TravelJournal.noteStep(); } catch (e) {}
    if (!((_isWater && _treading) || _carried || _aloft)) applyTerrainHazard(cell);   // 踏水者脚底不沾水，暗流卷不着；坐骑驮着的（渡水/御空）同理——泅渡者与徒步者照吃危险表

    // 落脚这格若站着结伴而行的人/兽，当场面谈或被围；没人撞上，野外才自己动一步
    wildContactBand = null;
    const underfoot = wildBands.some(band => checkBandContact(band));
    if (!underfoot) tickWildLife();

    // 日常 / 奇遇（与旧版同源，日常优先）
    let dailyFired = false;
    if (window.dailyEvents && typeof window.dailyEvents.tryTriggerDailyEvent === 'function') {
        dailyFired = !!window.dailyEvents.tryTriggerDailyEvent('wilderness', { source: 'move', skipGlobalCd: false });
    }
    if (!dailyFired && Math.random() < 0.03 && window.eventSystem && typeof window.eventSystem.triggerRandomEvent === 'function') {
        window.eventSystem.triggerRandomEvent();
    }

    // v41 真路真镖：踩上目标镇子先结账；手里还押着镖，路上才可能截镖
    try { if (!escortDeliverHere(cell)) stepEscortCheck(); } catch (eEscort) {}

    renderMap(mapContainer, currentMap, viewportOffset.x, viewportOffset.y);
    if (typeof updateEntityMenu === 'function') updateEntityMenu();
    return true;
}

// 途中遭遇：夜行与恶劣天象更凶；撞上什么由脚下地皮说了算
// overrideCell：水路等场合用假想地皮结账（人还没到对岸，水里的事先算）
// force：第三十八波 扎营夜袭用——骰子由调用方掷过了，这里只管把东西召出来
function rollWildEncounter(overrideCell, force) {
    const prow0 = currentMap[playerPos.y];
    const cell = overrideCell || (prow0 ? prow0[playerPos.x] : null);
    const leyTier = (cell && cell.ley) || 0;   // v20.89 灵脉地上遭遇更频繁、来者更强
    let p = 0.05 + leyTier * 0.05;
    if (isNightNow()) p += 0.06;
    const w = currentWeatherObj();
    if (w && (w.id === 'stormy' || w.id === 'foggy')) p += 0.02;
    // 第三十四波：兽潮未散，野外就是兽的地界——遭遇更频、来的偏兽（与 world-events 同查 isRaidActive）
    var _tideLv = 0;
    try {
        if (window.BeastTide && typeof window.BeastTide.getActiveTide === 'function') {
            var _tt = window.BeastTide.getActiveTide();
            if (_tt) {
                var _dn = (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') ? Number(window.timeSystem.getAbsoluteDay()) : 0;
                if (!(_tt.expireDay != null && _dn >= Number(_tt.expireDay))) {
                    _tideLv = Math.max(1, Math.min(10, parseInt(String(_tt.level || '').replace('tide_', ''), 10) || 1));
                }
            }
        }
    } catch (eTide) {}
    if (_tideLv) p += 0.03 + _tideLv * 0.01; else if (tryNemesisAmbush()) return true;
    if (!force && Math.random() >= p) return false;
    if (typeof generateRandomEnemy !== 'function') return false;
    const t = seasonTerrainKey(cell) || 'PLAIN';   // v47 认有效地形：冬天冰道上撞见的是陆上的活物，不是水蛟
    // 道上多遇人，水里必是活物，其余地方多半是兽
    let wantBeast = Math.random() < 0.6;
    if (t === 'ROAD') wantBeast = Math.random() < 0.3;
    if (t === 'WATER' || t === 'FORD' || t === 'SWAMP' || t === 'VOLCANO') wantBeast = true;
    if (_tideLv && Math.random() < 0.85) wantBeast = true;   // 兽潮里撞上的，八成是兽
    const tier = leyTier ? leyEnemyLevel(leyTier) : 1 + Math.floor(Math.random() * 3);
    let foeType = wantBeast ? 'beast' : 'enemy';
    if (!wantBeast && leyTier) foeType = leyTier >= 3 ? 'boss' : 'elite';
    const foe = generateRandomEnemy(tier, foeType, leyTier ? { leyTier: leyTier } : undefined);   // v20.95 灵蕴随生成递进掉落账
    const flavor = habitatFlavor({ terrainKey: t });
    const name = pickFlavorName(wantBeast ? flavor.beasts : flavor.persons);
    if (name && !leyTier) foe.name = name;
    if (!wantBeast && !leyTier) foe._wildFoe = true;   // v51 野外人形：打赢了才可能结仇（灵脉精英/魔头另有账，不掺和）
    if (wantBeast && leyTier) buffLeyBeast(foe, leyTier);
    if (!wantBeast && leyTier) foe._leyElite = leyTier;
    // 兽潮里撞上的兽更凶一点（随潮级），并挂个潮标记便于战报认账
    if (_tideLv && wantBeast) {
        foe.level = (foe.level || 1) + Math.min(5, _tideLv);
        foe.attack = Math.max(1, Math.round((foe.attack || 10) * (1 + _tideLv * 0.03)));
        if (!leyTier) foe.name = '兽潮·' + (foe.name || '妖兽');
        foe._fromTide = _tideLv;
    }
    const where = cell ? (effTerrainOf(cell).name || '') : '';   // v47 冬天的战报写「河冰」不写「水域」
    if (window.showMessage) {
        window.showMessage(_tideLv && wantBeast
            ? `⚠️ 兽潮未散——${foe.name || '一头妖兽'}离了兽群，撞上了你！`
            : (leyTier
            ? `⚠️ 灵气激荡，${foe.name || '一尊强敌'}自灵脉深处现身！`
            : `⚠️ ${where ? where + '里' : '途中'}撞上${foe.name || '不速之客'}！`), 'warning');
    }
    window._wildEncounterFired = true;
    window.currentInteractionEntity = foe;
    if (typeof window.openBattleWithEntity === 'function') {
        window.openBattleWithEntity(foe);
        return true;
    }
    return false;
}

function confirmTravel() {
    if (!wildTravel || !wildTravel.path) return;
    const path = wildTravel.path;
    const targetName = wildTravel.targetName;
    wildTravel = null;
    let stopped = null;
    for (let i = 0; i < path.length; i++) {
        const p = path[i];
        if (!stepTo(p.x, p.y)) { stopped = '路断了'; break; }
        if (wildContactBand) { wildContactBand = null; stopped = '遭遇'; break; }   // 撞上兽群商队，行程到此为止
        if (rollWildEncounter()) { stopped = '遭遇'; break; }
    }
    if (window.showMessage) {
        if (stopped === '遭遇') window.showMessage('行程被打断。', 'warning');
        else if (stopped) window.showMessage(stopped, 'warning');
        else window.showMessage(`🧭 到了「${targetName}」。`, 'success');
    }
    renderMap(mapContainer, currentMap, viewportOffset.x, viewportOffset.y);
    if (typeof updateEntityMenu === 'function') updateEntityMenu();
}

function gotoPoi(poiId) {
    const poi = currentPois.find(p => p.id === poiId);
    if (!poi) return;
    const row = currentMap[poi.y];
    const cell = row ? row[poi.x] : null;
    if (!cell || cell.fog === 0) { showMessage('还没走到那一带。', 'info'); return; }
    if (poi.x === playerPos.x && poi.y === playerPos.y) { renderWildSidebar(); return; }
    onCellClick(poi.x, poi.y);
}

// ============ 脚下动作 ============
function spendSpiritStones(n) {
    try {
        if (window.inventory && window.inventory.currency) {
            if ((window.inventory.currency.spiritStones || 0) < n) return false;
            window.inventory.currency.spiritStones -= n;
            if (typeof window.updateCurrencyUI === 'function') window.updateCurrencyUI();
            return true;
        }
    } catch (e) {}
    return false;
}

function healChar(hp, energy, qi) {
    const cd = window.currentCharData;
    if (!cd) return;
    if (hp) cd.health = Math.min(100, (cd.health || 0) + hp);
    if (energy) cd.energy = Math.min(100, (cd.energy || 0) + energy);
    if (qi) cd.qi = Math.min((typeof window.getEffectiveMax === 'function' ? window.getEffectiveMax('maxQi') : (cd.maxQi || 100)), (cd.qi || 0) + qi);
    if (typeof window.updateCharacterStatus === 'function') window.updateCharacterStatus();
}

function advanceWildTime(minutes, reason) {
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') window.timeSystem.advanceTime(minutes, reason);
}

// 拿得出台面的名目：叫得出名字就叫名字，叫不出也别把内部代号亮给玩家
function itemNameOf(id) {
    try {
        const t = (window.itemById || {})[id];
        if (t && t.name) return t.name;
    } catch (e) {}
    return null;
}

// 「灵芝×2、赤铁×1」这种收成清单；真源没就绪时退回品类名，绝不掉出代号
function lootText(pairs, fallbackKind) {
    const parts = (pairs || []).map(function (p) {
        const nm = itemNameOf(p.id);
        return nm ? nm + '×' + p.n : ((fallbackKind || '旧物') + '×' + p.n);
    });
    return parts.join('、');
}

function gatherWildNode() {
    const row = currentMap[playerPos.y];
    const cell = row ? row[playerPos.x] : null;
    if (!cell || !cell.node || cell.node.regrowDay > currentDay()) return;
    advanceWildTime(30, '野外采集');
    if (window.currentCharData) window.currentCharData.energy = Math.max(0, (window.currentCharData.energy || 100) - 6);
    // v23.1 采集有动静：药香兽腥都藏不住——一成概率惊动守食的野兽；撞上上品产地则收成翻倍
    var _gRisk = Math.random();
    if (_gRisk < 0.10 && typeof window.openBattleWithEntity === 'function') {
        var _gFoe = (typeof window.generateRandomEnemy === 'function') ? window.generateRandomEnemy(1 + Math.floor(Math.random() * 3), 'beast') : { name: '野兽', type: 'beast', level: 2 };
        if (window.showMessage) window.showMessage('⚠️ 你刚伸手，草丛里窜出守食的野兽——它比你先盯上这片产地！', 'warning');
        window.currentInteractionEntity = _gFoe;
        window.openBattleWithEntity(_gFoe);
        return;
    }
    var _gRich = Math.random() < 0.12;
    if (_gRich && window.showMessage) window.showMessage('✨ 这一片长势竟格外好——上品产地！', 'success');
    const bonus = ((typeof window.getWeatherGatheringBonus === 'function') ? window.getWeatherGatheringBonus() : 1) * (_gRich ? 2 : 1);
    const got = [];
    cell.node.items.forEach(id => {
        const n = Math.max(1, Math.round((1 + Math.random()) * bonus));
        if (typeof window.addItemToInventory === 'function') { window.addItemToInventory(id, n); got.push({ id: id, n: n }); }
    });
    cell.node.regrowDay = currentDay() + 3 + Math.floor(Math.random() * 4);
    // 第三十四波：枯竭日落进本域存档（旧账只改内存格、saveWildState 原样抄回空的 gathered，读档后节点全复活可无限刷采）
    try {
        const _rst = wildState.regions[currentRegionForMap];
        if (_rst) { _rst.gathered = _rst.gathered || {}; _rst.gathered[playerPos.x + ',' + playerPos.y] = cell.node.regrowDay; }
    } catch (eGather) {}
    if (window.showMessage) {
        const kind = NODE_KIND_NAMES[cell.node.kind] || '药草';
        window.showMessage(`🌿 采得 ${lootText(got, kind)}${bonus > 1.1 ? '（天象帮忙，收成不错）' : bonus < 0.9 ? '（天象不作美，收成打折）' : ''}`, 'success');
    }
    // v23.1 野外采集也挂奇遇钩（挖矿/采药都有，唯独这里漏了）
    if (window.QiyuEncounters && typeof window.QiyuEncounters.maybeTrigger === 'function') { try { window.QiyuEncounters.maybeTrigger('wild'); } catch (e) {} }
    saveWildState();
    renderWildSidebar();
}

function restAtWildTown() {
    const row = currentMap[playerPos.y];
    const cell = row ? row[playerPos.x] : null;
    const poi = cell && cell.poiId ? currentPois.find(p => p.id === cell.poiId) : null;
    const v = (poi && poi.variant && poi.variant.rest) ? poi.variant : null;
    const cost = v ? v.rest.cost : 4;
    const fare = v ? v.rest.stones : 3;
    const rich = spendSpiritStones(fare);
    // 第五十五波 · 客栈烘衣：进门先凑灶火烤衣再歇（柴房也有灶——湿着睡要着凉）
    try { dryOff('在客栈歇脚，湿衣凑着灶火烘干了。'); } catch (eDry2) {}
    advanceWildTime(cost * 60, '客栈打尖');
    if (rich) {
        healChar(v ? v.rest.hp : 25, v ? v.rest.en : 40, v ? v.rest.qi : 10);
        showMessage(`🛏️ 在${poi && poi.variantName ? poi.variantName : '客栈'}歇了一觉，气血精力都回了些。${fare ? '（灵石 ' + fare + '）' : '（没花钱）'}`, 'success');
    } else {
        healChar(Math.round((v ? v.rest.hp : 25) * 0.4), Math.round((v ? v.rest.en : 40) * 0.45), 0);
        showMessage('🛏️ 灵石不够，在柴房凑合了一夜。睡得一般。', 'info');
    }
    // 第五十四波 · 客栈住店也解状态：给了钱是正经床铺（与野营同账）；柴房凑合减半
    try {
        const _rl = rich ? campRelief() : sleepRelief(SHED_POISON_RELIEF, SHED_SHOCK_RELIEF, SHED_PAIN_RELIEF);
        if (_rl) showMessage('🌙 睡卧导引：' + _rl.join('；') + '。', 'info');
    } catch (eRelief) {}
    // 第五十九波 · 客栈发汗：住店暖、柴房也有灶——睡一夜，风寒都能发透
    try { cureChill('在客栈暖暖和和睡了一夜，风寒发了一身汗，散透了——头不昏了。'); } catch (eChillI) {}
    if (v && v.risk && Math.random() < v.risk.chance) {
        harmChar(0, 0, v.risk.qi || 0);
        showMessage('🌑 ' + v.risk.msg, 'warning');
    } else if (Math.random() < 0.15) {
        showMessage('🌙 半夜有窸窣声，你握紧了剑。', 'warning');
    }
    renderWildSidebar();
}

// ============ 逛市（v20.61 变体）：露水市集入夜打烊，黑市有稀罕物也有巡查 ============
function wildShop() {
    const row = currentMap[playerPos.y];
    const cell = row ? row[playerPos.x] : null;
    const poi = cell && cell.poiId ? currentPois.find(p => p.id === cell.poiId) : null;
    const v = poi && poi.variant ? poi.variant : null;
    advanceWildTime(15, '逛野市');
    if (v && v.key === 'dawn' && isNightNow()) {
        showMessage('🏮 夜了，露水市早散了，只剩几块没收走的门板。明早再来。', 'info');
        renderWildSidebar();
        return;
    }
    if (v && v.risk && Math.random() < v.risk.chance) {
        const foe = (typeof generateRandomEnemy === 'function') ? generateRandomEnemy(2, v.risk.battle === 'undead' ? 'enemy' : 'enemy') : null;
        showMessage('🚨 ' + (v.key === 'black' ? '巡值的修士掀帘进来，直直看向你！' : '市上起了骚动！'), 'warning');
        if (foe) { window.currentInteractionEntity = foe; if (typeof window.openBattleWithEntity === 'function') { window.openBattleWithEntity(foe); renderWildSidebar(); return; } }
    }
    if (v && v.key === 'black') showMessage('🕯️ 帘子后头有人低声报价，货色比外头野得多。', 'info');
    // 四十八波 · 野市地域特产：掌柜的吆喝一句本地行市（黑市有黑市的话风，不吆喝）
    try {
        const _spec = window.REGION_SPECIALTIES && window.REGION_SPECIALTIES[currentRegionForMap];
        if (_spec && _spec.blurb && !(v && v.key === 'black')) showMessage('🧺 ' + _spec.blurb, 'info');
    } catch (eSpec) {}
    // v42 野市认行情：柜台按脚下地域开价（黑市开真黑市柜）——行情牌说什么价，这里就是什么价
    if (typeof window.openCityShop === 'function') window.openCityShop((v && v.key === 'black') ? 'special' : 'general', currentRegionForMap || undefined);
    renderWildSidebar();
}

// ============ 洞府修炼（v20.61 变体）：遗府灵机足但禁制未散 ============
function wildCultivate(poi) {
    const v = poi && poi.variant ? poi.variant : null;
    advanceWildTime(15, '寻洞府');
    if (v && v.risk && Math.random() < v.risk.chance) {
        harmChar(v.risk.hp || 0, 0, 0);
        showMessage('⚠️ ' + v.risk.msg, 'warning');
        renderWildSidebar();
        return;
    }
    if (v && v.key === 'heritage') showMessage('🏚️ 洞中灵机比外头浓，是前人留下的底子。', 'info');
    if (typeof window.startCultivation === 'function') window.startCultivation();
    renderWildSidebar();
}

// ============ 第四十五波 · 地灵相应：观地形而悟 ============
// 十种奇景地形，头一回在其上打坐各有一悟——机缘贵在初遇，不在枯坐。
// 账走游历见闻的 markOnce（一生一次），零新存档字段、零随机数；
// 悟道点总闸：游历 37 + 地灵 10 = 47，仍不过悟道树 78 点的总账。
const TERRAIN_INSIGHT = {
    SWORDTOMB:  '剑冢打坐，万剑余气贴着皮肉掠过——痛到极处，剑意忽然明了',
    VOLCANO:    '望着地火翻滚、红雾升腾，一口气悟了火行的燥与烈',
    GLACIER:    '千里冰面澄澈如镜，照见自己的眉眼——心不定，冰便不定；心定了，万象皆定',
    OLDFIELD:   '古战场阴煞缠身，恍惚间看见千年前的生死一线——原来招招都是活下来的代价',
    PRIMFOREST: '荒古林里观一株老树半枯半荣，忽悟生灭本是一件事',
    BONEFIELD:  '骨原魔气顺七窍往里钻，你逆运真气与之相抗——辟邪的道理，原来在「抗」字里',
    SPRING:     '灵泉濯心，泉声入耳如环佩——万虑澄澈，悟一个「清」字',
    QIPOOL:     '玉液池水温润包裹周身，悟上善若水：至柔，故至坚',
    OASIS:      '死沙里一汪绿洲，草木自顾自地活——悟生生不息，不在天时，在根',
    MIASMA:     '瘴毒侵体，你索性以内视观毒理游走——知己知彼，毒亦是药'
};

function meditateWild() {
    const row = currentMap[playerPos.y];
    const cell = row ? row[playerPos.x] : null;
    if (cell && cell.terrainKey === 'WATER' && !isFrozenNow()) { showMessage('🌊 踩水打坐定不下心——先上岸再说。', 'info'); return; }   // v47 冬天冰面是实地，照坐
    const qi = cell ? cell.qi : 1;
    advanceWildTime(60, '野外打坐');
    if (window.currentCharData) window.currentCharData.energy = Math.max(0, (window.currentCharData.energy || 100) - 4);
    const gain = Math.round(8 * qi);
    healChar(0, 0, gain);
    if (isNightNow() && rollWildEncounter()) { renderWildSidebar(); return; }
    showMessage(`🌬️ 吐纳一个时辰，此地灵气${qi >= 1.5 ? '充沛' : qi >= 1.0 ? '平和' : '稀薄'}，真气回复 ${gain}。`, 'success');
    // v45 观地形而悟：奇景地形头一回打坐有一悟（一生一次账在游历见闻里，零随机）
    try {
        const _insKey = cell ? cell.terrainKey : null;
        if (_insKey && TERRAIN_INSIGHT[_insKey] && window.TravelJournal && typeof window.TravelJournal.markOnce === 'function') {
            window.TravelJournal.markOnce('terrain_' + _insKey, 1, TERRAIN_INSIGHT[_insKey]);
        }
    } catch (eInsight) {}
    // v49 崖壁隐藏洞天：白顶高山上打坐，山风穿石——有缘发现前辈留下的洞口（发现骰只在此处）
    try {
        if (cell && cell.terrainKey === 'MOUNTAIN' && (cell.elev || 0) >= GROTTO_ELEV_MIN && !cell.poiId) tryDiscoverGrotto();
    } catch (eGrotto) {}
    renderWildSidebar();
}

function springRitual() {
    const row = currentMap[playerPos.y];
    const cell = row ? row[playerPos.x] : null;
    const poi = cell && cell.poiId ? currentPois.find(p => p.id === cell.poiId) : null;
    const qi = cell ? cell.qi : 2;
    advanceWildTime(120, '灵泉汲灵');
    const mul = (poi && poi.variant && poi.variant.gainMul) || 1;
    const gain = Math.round(20 * qi * mul);
    healChar(10, 15, gain);
    showMessage(`⛲ 以泉水淬体${mul > 1 ? '，泉水稠得像蜜，一遍顶别处三遍' : ''}，真气回复 ${gain}，神清气明。`, 'success');
    renderWildSidebar();
}

// ============ v36 路上也有路上的活法：绿洲歇脚 · 灵池淬体 ============
function wildAbsDay() {
    try {
        if (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') return Number(window.timeSystem.getAbsoluteDay()) || 0;
    } catch (e) {}
    return 0;
}

// 一日一回的账记在差量存档里：st.oasis / st.pool = { 'x,y': 用过的绝对日 }
function wildDayMap(field) {
    const st = wildState.regions[currentRegionForMap];
    if (!st) return null;
    st[field] = st[field] || {};
    return st[field];
}

function oasisRest() {
    const row = currentMap[playerPos.y];
    const cell = row ? row[playerPos.x] : null;
    if (!cell || cell.terrainKey !== 'OASIS') { showMessage('此处不是绿洲。', 'warning'); return; }
    const used = wildDayMap('oasis');
    const k = playerPos.x + ',' + playerPos.y;
    if (used && used[k] === wildAbsDay()) { showMessage('🏝️ 今日已在这处水边歇过——树荫与水，留给后来人吧。', 'info'); return; }
    if (used) used[k] = wildAbsDay();
    advanceWildTime(120, '绿洲歇脚');
    healChar(30, 40, Math.round(10 * (cell.qi || 1)));
    showMessage('🏝️ 在绿洲边歇脚——清水洗尘，树荫里躺上一躺，身心都松泛下来。', 'success');
    saveWildState();
    renderWildSidebar();
}

function poolBathe() {
    const row = currentMap[playerPos.y];
    const cell = row ? row[playerPos.x] : null;
    if (!cell || cell.terrainKey !== 'QIPOOL') { showMessage('此处不是灵池。', 'warning'); return; }
    const used = wildDayMap('pool');
    const k = playerPos.x + ',' + playerPos.y;
    if (used && used[k] === wildAbsDay()) { showMessage('🛁 今日池中灵机已被你取尽——池水要一夜才酿得回来。', 'info'); return; }
    if (used) used[k] = wildAbsDay();
    advanceWildTime(240, '灵池淬体');
    healChar(10, 20, Math.round(25 * (cell.qi || 2)));
    showMessage('🛁 在灵池中淬体——灵液沁骨，真气自己涌了回来。', 'success');
    // 头一回出池，见闻账留一笔：这池子记得你一辈子
    try {
        if (window.TravelJournal) window.TravelJournal.markOnce('pool_' + (currentRegionForMap || '') + '_' + k, 1, '初次自灵池中出定——灵液洗心，心镜澄明');
    } catch (e) {}
    saveWildState();
    renderWildSidebar();
}

// ============ 第五十二波 · 地图粉笔笔记：记在图上的字，重开图还在 ============
// 散修的图是自己画的：哪儿撞过凶险、哪儿有水、哪儿地灵不错——粉笔留个记号，
// 下回开图还在（st.notes 差量存档，与 grotto/仇账同法，老档自动补空，零迁移）。
// 记号六种全是定死的样（自由写字是另一本账——凡进 DOM 的字不能不设防），零骰、零经济、零时辰。
// 一支粉笔用不久：一张图至多二十四笔，抹掉一笔才写得进新的。
const NOTE_CAP = 24;
const NOTE_MARKS = {
    danger: { icon: '✕', name: '凶险', color: '#e05555', hint: '在这儿吃过亏，或多半要吃亏' },
    water: { icon: '≈', name: '水源', color: '#6db3e8', hint: '这儿有水，可补给歇脚' },
    good: { icon: '☆', name: '好地', color: '#e8c86d', hint: '地灵不错，适合行功' },
    camp: { icon: '⌂', name: '宜宿', color: '#9ad88a', hint: '地势高燥，适合扎营过夜' },
    loot: { icon: '◎', name: '宝气', color: '#c89ae8', hint: '这附近像是藏着好东西' },
    been: { icon: '◈', name: '记号', color: '#d8d8d8', hint: '就是标一标，防走岔' }
};

function notesDict() {
    if (!currentRegionForMap) return null;
    const st = wildState.regions[currentRegionForMap];
    if (!st) return null;
    st.notes = st.notes || {};
    return st.notes;
}
function noteAt(x, y) {
    const m = notesDict();
    return m ? (m[x + ',' + y] || null) : null;
}

function setNoteHere(markId) {
    const mk = NOTE_MARKS[markId];
    if (!mk) { showMessage('没有这种粉笔样。', 'warning'); return false; }
    const row = currentMap[playerPos.y];
    const cell = row ? row[playerPos.x] : null;
    if (!cell) return false;
    if (seasonTerrainKey(cell) === 'WATER') { showMessage('🖊 明水面挂不住粉笔——记号得记在实地上（冬天的冰面算实地）。', 'info'); return false; }
    const m = notesDict();
    if (!m) return false;
    const k = playerPos.x + ',' + playerPos.y;
    if (!m[k] && Object.keys(m).length >= NOTE_CAP) {
        showMessage('🖊 粉笔头磨圆了——一张图至多 ' + NOTE_CAP + ' 笔，抹掉一笔再记新的吧。', 'warning');
        return false;
    }
    m[k] = markId;
    saveWildState();
    showMessage('🖊 记下一笔：' + mk.icon + '「' + mk.name + '」——' + mk.hint + '。重开图它还在。', 'success');
    if (mapContainer) renderMap(mapContainer, currentMap, viewportOffset.x, viewportOffset.y);
    renderWildSidebar();
    return true;
}

function delNoteHere() {
    const m = notesDict();
    const k = playerPos.x + ',' + playerPos.y;
    if (!m || !m[k]) { showMessage('🖊 脚下没有粉笔印——没什么可抹的。', 'info'); return false; }
    const mk = NOTE_MARKS[m[k]];
    delete m[k];
    saveWildState();
    showMessage('🖊 用手指把「' + ((mk && mk.name) || '旧记号') + '」抹了——粉笔灰簌簌落在图上。', 'info');
    if (mapContainer) renderMap(mapContainer, currentMap, viewportOffset.x, viewportOffset.y);
    renderWildSidebar();
    return true;
}

// 粉笔样面板（照渡口选项的老样式：侧栏动作区整块换掉，选完即画）
function renderNoteOptions() {
    const acts = document.getElementById('wild-actions');
    if (!acts) return;
    const cur = noteAt(playerPos.x, playerPos.y);
    acts.innerHTML = '<p class="text-[10px] text-gray-500 mb-1">粉笔样（记在脚下，重开图还在）：</p>' +
        Object.keys(NOTE_MARKS).map(id => {
            const mk = NOTE_MARKS[id];
            const on = cur === id;
            return `<button data-act="note-set" data-target="${id}" class="w-full text-xs ${on ? 'bg-yellow-700' : 'bg-gray-700 hover:bg-gray-600'} text-gray-200 py-1.5 rounded transition text-left px-2">${mk.icon} ${mk.name}${on ? '（当前就记着这个）' : ''} <span class="text-gray-500">——${mk.hint}</span></button>`;
        }).join('') +
        (cur ? `<button data-act="note-del" class="w-full text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 py-1 rounded transition mt-1">🧽 抹掉这一笔</button>` : '') +
        `<button data-act="note-cancel" class="w-full text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 py-1 rounded transition mt-1">收起粉笔</button>`;
}

// 图上画粉笔印：格子右上角一枚小样（未开雾不画，与洞口同规矩）
function drawNotes(svg, size) {
    let m = null;
    try { m = notesDict(); } catch (e) { return; }
    if (!m) return;
    Object.keys(m).forEach(k => {
        const xy = k.split(',');
        const x = Number(xy[0]), y = Number(xy[1]);
        const cell = (currentMap[y] || [])[x];
        if (!cell || cell.fog === 0) return;
        const mk = NOTE_MARKS[m[k]];
        if (!mk) return;
        const t = svgEl('text', {
            x: x * size + size * 0.82, y: y * size + size * 0.34,
            fill: mk.color, 'font-size': Math.max(7, size * 0.42), 'text-anchor': 'middle',
            opacity: cell.fog === 2 ? 0.95 : 0.55, 'pointer-events': 'none'
        });
        t.textContent = mk.icon;
        svg.appendChild(t);
    });
}

// ============ 第五十六波 · 仇家跨域追杀：打赢你的人，不会眼看你跑掉 ============
// 五十一波的边界项补齐：仇家原先只守本域（本地响马熟本地道）。本波加一条「追旗」——
// 你被仇家打赢的那一刻，他认准了你：挂上追旗（chase=绝对日）；你一进别的域，若那域仇位是空的，
// 仇账整个挪过去（名号、梁子层数原样带着——他记得旧账），旧域的位就空出来了。
// 追旗三十天作数（风头过了他也懒得多跑）；新域有位才挪（旧仇未了不接新仇的规矩两头都守）。
// 零骰：挪不挪、挪去谁全是定数；账走 wildState.regions 差量存档（两个域的对象都在内存里改，随整包存读档）。
const NEMESIS_CHASE_DAYS = 30;

function nemesisFollowHere(region) {
    if (!region) return false;
    const here = wildState.regions[region];
    if (!here) return false;
    if (here.nemesis) return false;   // 本域已有仇家：一域一个在世仇家的规矩不破
    const today = wildAbsDay();
    for (const rg in wildState.regions) {
        if (rg === region) continue;
        const st = wildState.regions[rg];
        const n = st && st.nemesis;
        if (!n || !n.chase) continue;
        if (today - Number(n.chase) > NEMESIS_CHASE_DAYS) continue;   // 追旗过期：风头过了，他蹲回老地盘
        here.nemesis = { name: n.name, wins: Number(n.wins) || 0, born: n.born, last: n.last, chase: 0, chased: (Number(n.chased) || 0) + 1 };
        st.nemesis = null;   // 人跟着你走了——旧域的仇账随人挪，位就空出来
        showMessage('🗡️ 前脚刚踏进' + region + '，后颈就泛起熟悉的寒意——' + n.name + ' 竟一路跟了过来：「跑？我说过，你跑到哪儿我跟到哪儿！」', 'warning');
        return true;
    }
    return false;
}

// ============ 第五十一波 · 具名响马宿敌：野外打赢的响马，梁子会跟着你 ============
// 散修的现实：打退的劫道者不会就地蒸发——带伤遁走的，会记仇、会回来。
// 一域一个在世仇家（旧仇未了不接新仇）；仇账走本域 wildState.nemesis 差量字段（老档自动补空，零迁移）。
// 拦道走现成 rollWildEncounter 遭遇通道；结算由 app.js 战后认旗（第四十一波 _escortRaider 同法）。
// 数的守恒：战败=灵石真扣（进他腰包，不凭空蒸发，上限=身上现钱）；战胜=零灵石增发，
// 赃物走地域特产货池（五十波 GROTTO_LOOT 老账，定数选件零新骰）；悟道点总闸已满，本波零发放。
const NEMESIS_FORGE_CHANCE = 0.22;    // 打赢的野外人形结下梁子的概率（带伤遁走才记仇）
const NEMESIS_AMBUSH_CHANCE = 0.14;   // 冷却期满后，每次遭遇机会仇家拦道的概率
const NEMESIS_COOLDOWN_DAYS = 2;      // 结仇/上次照面之后两天内不再来（梁子也要喘口气）
const NEMESIS_SLAY_WINS = 3;          // 打赢三回，梁子了结（第三回他跑不掉了）
const NEMESIS_ROB_BASE = 30;          // 战败被搜走的灵石基数
const NEMESIS_ROB_STEP = 20;          // 每深一层梁子多搜走的数
const NEMESIS_EPITHETS = ['独眼', '铁掌', '快刀', '夜枭', '断眉', '赤须', '穿云', '石胆'];
const NEMESIS_SURNAMES = ['刘', '王', '赵', '孙', '李', '张', '陈', '杨', '周', '吴'];

function activeNemesis() {
    if (!currentRegionForMap) return null;
    const st = wildState.regions[currentRegionForMap];
    return (st && st.nemesis) || null;
}

// 具名：响马团伙沿用镖行老账（截镖的和结仇的本就是一拨人），绰号加姓——江湖人报得出名号
function nemesisName() {
    const gang = ESCORT_GANGS[Math.floor(Math.random() * ESCORT_GANGS.length)];
    const ep = NEMESIS_EPITHETS[Math.floor(Math.random() * NEMESIS_EPITHETS.length)];
    const sn = NEMESIS_SURNAMES[Math.floor(Math.random() * NEMESIS_SURNAMES.length)];
    return gang + '·' + ep + sn;
}

// 结仇：app.js 战胜结算调这里——打赢的野外人形带伤遁走，才可能誓报仇
function maybeForgeNemesis() {
    if (!currentRegionForMap) return false;
    const st = wildState.regions[currentRegionForMap];
    if (!st || st.nemesis) return false;   // 一域一个在世仇家：旧仇未了，不接新仇
    if (Math.random() >= NEMESIS_FORGE_CHANCE) return false;
    const name = nemesisName();
    st.nemesis = { name: name, wins: 0, born: wildAbsDay(), last: wildAbsDay() };
    saveWildState();
    showMessage('🩸 ' + name + ' 带伤遁走，回头恶狠狠地瞪了一眼：「好，好——你等着！」你在' + currentRegionForMap + '结下了仇家，早晚道上要找你算账。', 'warning');
    try { renderWildSidebar(); } catch (e) {}
    return true;
}

// 拦道：rollWildEncounter 掷遭遇骰之前先问仇家（兽潮里他不来——响马也怕兽）
function tryNemesisAmbush() {
    const n = activeNemesis();
    if (!n) return false;
    if (wildAbsDay() - (Number(n.last) || Number(n.born) || 0) < NEMESIS_COOLDOWN_DAYS) return false;
    if (Math.random() >= NEMESIS_AMBUSH_CHANCE) return false;
    return spawnNemesis(n);
}

function spawnNemesis(n) {
    if (typeof generateRandomEnemy !== 'function') return false;
    const cd = window.currentCharData || {};
    let level = 3;
    try {
        level = (typeof window.realmScaledEnemyLevel === 'function') ? Math.max(1, window.realmScaledEnemyLevel(cd) + 1 + (n.wins || 0)) : Math.max(1, getRealmTier(cd.realm) * 3 + 1 + (n.wins || 0));
    } catch (e) {}
    const foe = generateRandomEnemy(level, 'enemy');
    if (!foe) return false;
    foe.name = n.name;
    foe._wildNemesis = true;   // 随整包透传进战斗实体，战后结算认旗（四十一波 _escortRaider 同法）
    n.last = wildAbsDay();
    saveWildState();
    const taunt = (n.wins || 0) >= NEMESIS_SLAY_WINS - 1
        ? '「三照面——今日不是你死，就是我亡！」'
        : ((n.wins || 0) > 0 ? '「上回算你走运，今天连本带利！」' : '「可算又碰上你了——上回那笔账，今天算！」');
    showMessage('🗡️ 道旁窜出一条熟悉的身影——' + n.name + ' 拦在当路，' + taunt, 'warning');
    window.currentInteractionEntity = foe;
    if (typeof window.openBattleWithEntity === 'function') { window.openBattleWithEntity(foe); return true; }
    return false;
}

// 结算：app.js 战后认旗来调（胜 true / 败 false）
function settleWildNemesis(won) {
    if (!currentRegionForMap) return;
    const st = wildState.regions[currentRegionForMap];
    const n = st && st.nemesis;
    if (!n) return;
    n.last = wildAbsDay();
    if (won) {
        n.wins = (n.wins || 0) + 1;
        if (n.wins >= NEMESIS_SLAY_WINS) {
            st.nemesis = null;
            saveWildState();
            showMessage('🗡️ ' + n.name + ' 再跑不掉了——梁子了结，' + currentRegionForMap + '的道上重新太平。', 'success');
            dropNemesisSpoils(n);
        } else {
            saveWildState();
            showMessage('🩸 ' + n.name + ' 又挨了一记重的，滚下道去逃了：「下回见面，就是你的死期！」（梁子加深 ' + n.wins + '/' + NEMESIS_SLAY_WINS + '——他越挨打越凶，下回手更重）', 'warning');
        }
    } else {
        // 搜身：灵石真扣走经济真账——进他腰包，不凭空蒸发（上限=身上现钱，穷鬼抢不出油水）
        let purse = 0;
        try {
            purse = (window.EconomyTransaction && typeof window.EconomyTransaction.getBalance === 'function')
                ? Number(window.EconomyTransaction.getBalance('spiritStones')) || 0
                : (window.DataManager && typeof window.DataManager.getSpiritStones === 'function' ? Number(window.DataManager.getSpiritStones()) || 0 : 0);
        } catch (ePurse) {}
        const want = Math.max(0, Math.min(purse, NEMESIS_ROB_BASE + (n.wins || 0) * NEMESIS_ROB_STEP));
        let robbed = false;
        if (want > 0) {
            try { robbed = !!(window.EconomyTransaction && typeof window.EconomyTransaction.debit === 'function' && window.EconomyTransaction.debit('spiritStones', want)); } catch (eDebit) {}
            if (!robbed) { try { robbed = !!(window.DataManager && typeof window.DataManager.deductSpiritStones === 'function' && window.DataManager.deductSpiritStones(want)); } catch (eDeduct) {} }
        }
        saveWildState();
        showMessage(want > 0
            ? '💰 ' + n.name + ' 把你身上搜了个遍，抢走灵石 ' + want + ' 枚，扬长而去：「权当赔罪！」（钱进了他腰包——梁子还在）'
            : '💀 ' + n.name + ' 把你身上搜了个遍，一枚灵石也没搜着，啐了声「穷酸散修」，悻悻走了。（梁子还在）', 'warning');
        // 第五十六波 · 跨域追杀：打赢你的人认准了你——挂上追旗，你进新域他就跟过去（三十天内作数）
        n.chase = wildAbsDay();
        showMessage('🗡️ ' + n.name + ' 收刀冷笑：「跑？你跑到哪儿，我跟到哪儿！」——这梁子怕是要跟着你出域了。', 'warning');
        try { if (window.updateCurrencyUI) window.updateCurrencyUI(); } catch (eUI) {}
    }
    try { renderWildSidebar(); } catch (e) {}
}

// 赃物：仇家历年打劫的家底——地域特产与洞天遗宝同池（定数选件，零新骰）；
// 人死账清：行囊塞不下就只能留在山上（死人不会等你腾地方，与洞天「前辈不急」两本账）
function dropNemesisSpoils(n) {
    try {
        const pool = GROTTO_LOOT[currentRegionForMap] || GROTTO_LOOT_FALLBACK;
        let h = 0;
        const nm = String((n && n.name) || '');
        for (let i = 0; i < nm.length; i++) h = (h * 31 + nm.charCodeAt(i)) % 9973;
        const id = pool[h % pool.length];
        if (typeof window.addItemToInventory !== 'function') return;
        const ok = window.addItemToInventory(id, 1);
        if (ok === false) { showMessage('📜 他的赃物撒了一地——你正想捡一两件，行囊却已塞得满满当当，只得留在山上。', 'warning'); return; }
        let name = '旧物';
        try { name = (window.itemById && window.itemById[id] && window.itemById[id].name) || name; } catch (e) {}
        showMessage('📜 赃物里翻出一批家底——【' + name + '】×1，都是他历年劫来的本地特产，今日归你。', 'success');
        try { showLootLore(id, 'spoils'); } catch (eLoreN) {}   // 五十七波：赃物残页（东西有主，主有来历）
    } catch (eSpoils) {}
}

window.maybeForgeNemesis = maybeForgeNemesis;
window.settleWildNemesis = settleWildNemesis;

// ============ 第五十七波 · 遗宝残页：每件旧物背后都有一位前辈 ============
// 散修捡到一件东西，也捡到一段世界的碎片：开洞天遗宝、翻仇家赃物，
// 旧物上都带着半张残页——是谁的、为什么流落到这里、页尾写了一句什么。
// 零骰：残页内容由「货名+地域+来历」定数哈希推出（与赃物选件同一套算法——同一件旧物永远配同一段旧事）；
// 零新存档字段：残页不入账，到手那一刻现出（开匣与了结本就是一次性事件，残页随事一现）；
// 零经济、零悟道点（总闸已满）——旧事就是旧事，不换钱不换点。
const LORE_OWNERS = ['一位不肯留名的散修', '走方串村的货郎', '进山采药的老药农', '避祸隐居的剑客', '家道中落的世家子', '还愿上山的香客', '戍边归来的老卒', '私奔出走的年轻夫妇'];
const LORE_GROTTO_WHY = [
    '在此静修数十载，出关时物是人非，旧物便留在了洞中',
    '遭仇家追逼，仓促间把随身之物藏进了供案底下',
    '自知大限将至，择了这处干净石室坐化，遗物随他长眠',
    '与道友在此分别，说好回头来取，却终究没有回来'
];
const LORE_SPOIL_WHY = [
    '被响马在半道上劫了去，辗转落进了贼窝',
    '遭了灾荒拿去当铺换粮，又被人赎走转手',
    '主人遭难家产散落，被人顺手牵走'
];
const LORE_ECHOES = [
    '物在人不在，见字如面',
    '留与后来人，莫问出处',
    '此物随我半生，今归于尘',
    '若有缘人得之，替我看一眼这人间',
    '山高水长，后会无期',
    '莫学我，莫学我',
    '愿后来者，不走我的老路',
    '记不清他的脸了，只记得那天的月'
];

// 定数哈希：与赃物选件同一套算法（h*31+c 模 9973）——残页与货绑定，天荒地老不变
function loreHash(str) {
    let h = 0;
    const s = String(str || '');
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 9973;
    return h;
}

function lootStoryText(id, kind) {
    const rg = String(currentRegionForMap || '');
    const seed = String(id || '') + '|' + rg + '|';
    const owner = LORE_OWNERS[loreHash(seed + 'owner') % LORE_OWNERS.length];
    const whyPool = kind === 'spoils' ? LORE_SPOIL_WHY : LORE_GROTTO_WHY;
    const why = whyPool[loreHash(seed + 'why') % whyPool.length];
    const echo = LORE_ECHOES[loreHash(seed + 'echo') % LORE_ECHOES.length];
    return { owner: owner, why: why, echo: echo };
}

// 到手即现：kind='grotto'（洞天遗宝，带本域已拾残页数）/ 'spoils'（仇家赃物）
function showLootLore(id, kind, seenCount) {
    try {
        const p = lootStoryText(id, kind);
        let name = '旧物';
        try { name = (window.itemById && window.itemById[id] && window.itemById[id].name) || name; } catch (eName) {}
        if (kind === 'spoils') {
            showMessage('📜 【' + name + '】里夹着半张褪色的残页——原是' + p.owner + '之物，' + p.why + '。页尾一行小字：「' + p.echo + '」', 'info');
        } else {
            const cnt = Number(seenCount) || 0;
            showMessage('📜 匣底还压着半张残页——' + p.owner + '当年' + p.why + '。页尾一行小字：「' + p.echo + '」' + (cnt > 0 ? '（' + (currentRegionForMap || '此地') + '的遗宝残页，你已拾得 ' + cnt + ' 张——张张都是一段旧事）' : ''), 'info');
        }
    } catch (eLore) {}
}

// ============ 第五十八波 · 残页回响：三张拼成一段完整的旧事 ============
// 一域洞天至多三处（五十波老账），三匣开齐，三张残页也就集齐了——
// 拼起来才发现是同一个人的手笔：那位前辈的一生，散在这一域的三处石室里。
// 回响只在第三匣到手那一刻响一回（开匣是一次性事件，天然只响一次，不用记账）；
// 酬的是气血精力真气（与洞天行功同一本账）——旧事不换钱不换悟道点，换的是一口暖气。
// 零骰：每域的故事写死在池里，拼不拼得出全看你开没开齐。
const LORE_FULL_STORIES = {
    '中州': '三张残页笔迹相同，拼起来竟是同一本手记的三页——记手记的人，就是刻下「守一论」的那位无名者。他一生守一，守到最后只剩这一洞、一匣、一页字。手记末页写着：「读到此处，你我已算见过一面。往后的路，替我走得松快些。」',
    '东荒': '三张残页拼起来，是一张猎图的三个角——图上的筋络骨相，与石缝里嵌着的那张出自同一人手笔。他猎了一辈子兽，最后把猎图拆成三份藏进三处石室：「兽有兽道，人有人路。图留给走得出山的人。」',
    '南疆': '三张残页是同一张方子的三段——「百毒还元散」的君药、臣药、火候，分藏三处。留方子的人是位走方郎中，页尾写着：「瘴地行医四十年，此方救过一百一十七人。第一百十八个，留给你。」',
    '西漠': '三张残页拼起来是半阙词——上阙刻在石壁，下阙写在这三页上，落款只有一个「戈」字。那位在戈壁练剑的剑客，练的原来不是剑，是没能寄出去的一阙词：「戈壁春来晚，人归晚。」',
    '北冥': '三张残页冻得发脆，拼起来是一篇「以寒为甲」的修行手札——石壁霜下那七个字，是手札的题头。手札末页：「我在最冷的地方坐了一冬，想明白了一件事：冷不死人，怕冷才冻死人。」',
    '蜀地': '三张残页拼起来是一封没写完的信——写给一位姓云的故人。信里反复说起那半截断剑：「剑是我折的，不是败给旁人的。莫拔二字，是留给自己的。」信到「云兄台鉴」就断了，往后再没有字。',
    '东南海域': '三张残页写满了贝文，拼起来是一篇「随潮」呼吸术的全章——石壁上那节录的，只是开头。章末写着：「潮来不迎，潮去不送。我随了六十年潮，潮把我送到了这里，很好。」',
    '灵界': '三张残页上没有字——对着晶壁一照，纸页透亮，浮现出三道晶纹，与洞壁天成的纹路连成一脉。这不是谁留下的信，是这座山自己的记忆：它记得每一个在此坐过的人，包括你。',
    '魔界': '三张残页拼起来是一篇忏悔录，字迹越写越稳。写它的人从魔道里走出来，把一生恶事一件件记了，记到末页只剩八个字，与石壁上那行一样：「心魔起时，转身观之。」末页角上还有一个极小的字：「善。」'
};
const LORE_FULL_FALLBACK = '三张残页拼起来，是同一篇游记的三节——写游记的人一路走一路把随身旧物送人或封存，走到这一域的三处石室，各留了一页。游记末句：「人间的好东西，原都是旁人舍下的。捡着的人，替我好好用。」';
const LORE_ECHO_HP = 15;
const LORE_ECHO_EN = 25;
const LORE_ECHO_QI = 40;

// 三匣开齐才响（count 由开匣账现推，零新字段）；只在第三匣到手那一刻调用，天然一回
function loreEchoCheck(count) {
    if (!(Number(count) >= GROTTO_PER_REGION)) return false;
    const story = LORE_FULL_STORIES[currentRegionForMap] || LORE_FULL_FALLBACK;
    showMessage('📜 ' + story, 'success');
    try { healChar(LORE_ECHO_HP, LORE_ECHO_EN, LORE_ECHO_QI); } catch (eHeal) {}
    showMessage('🌄 前辈的遗韵入体——心口一暖，气血 +' + LORE_ECHO_HP + '、精力 +' + LORE_ECHO_EN + '、真气 +' + LORE_ECHO_QI + '。（旧事不换钱不换悟道点，换的是这一口暖气）', 'success');
    return true;
}

// ============ 第四十九波 · 崖壁隐藏洞天：散修的高山静室，前辈的遗刻 ============
// 在崖壁（elev ≥ 0.7 的高山，与雪顶同一条线）打坐，山风穿石——有缘发现隐蔽洞口。
// 每域至多三处（机缘贵在稀，不在刷）；发现骰只在打坐运行时掷，建图零骰、零漂移。
// 账记 st.grotto / st.grottoUse（差量存档，与 oasis/pool 同法，老档自动补空）。
const GROTTO_ELEV_MIN = 0.7;      // 崖壁的门槛：白顶高山才有石缝
const GROTTO_BASE_CHANCE = 0.04;  // 每次打坐的基础发现率
const GROTTO_LUCK_PER = 0.001;    // 气运 50 以上每点 +0.1%（气运 100 → 9%）
const GROTTO_PER_REGION = 3;      // 每域上限（悟道点总闸：游历 37 + 地灵 10 + 洞天 ≤27 = 74 ≤ 78）
const GROTTO_QI = 20;             // 洞天行功每回真气系数（× 本地灵气，四个时辰）
const GROTTO_FLAVOR = {
    '中州': '石壁上刻着半篇「守一论」，字迹入石三分——写字的人守一守到了极处',
    '东荒': '石缝里嵌着一张猎图，画的是走兽的筋络骨相——入山猎兽的前辈把手札留在了这里',
    '南疆': '遗刻讲的是瘴毒七转与「百毒还元散」的方子——瘴地里也有医理',
    '西漠': '壁上是一行剑刻「戈壁春」，笔笔带沙——剑客在此练过一剑',
    '北冥': '石壁结着霜，霜下刻着「以寒为甲」七字——读罢才知寒也能养身',
    '蜀地': '石龛里插着半截断剑，剑锋已钝、剑意犹存——剑下刻着小字「莫拔」',
    '东南海域': '遗刻是贝文，录「随潮」一法呼吸之术——潮来潮往，吐纳与之同息',
    '灵界': '洞壁晶纹天成，久视之下丹田真气自行流转——这不是人刻的遗篇',
    '魔界': '石壁上八个大字「心魔起时，转身观之」——刻字的人分明是魔道里走出来的'
};

// v50 洞天遗宝：供案下的木匣，一洞只开一回（账记 st.grottoLoot 差量存档，塞不下可回炉）。
// 全域至多 30 匣（10 域 × 3 处），一匣一件——机缘有数，不通灵脉不发票子：
// 不出灵石（零货币增发）、不出秘籍（v15.1 掉落/传授/搜刮三条渠道账不动）。
// 选件走坐标加地域的定数（零新骰——洞天一节的骰仍只有发现那一枚）。
const GROTTO_LOOT = {
    '中州': ['pill_qi_gather', 'pill_big_recovery', 'attack_talisman'],
    '东荒': ['mat_thousand_lingzhi', 'mat_ginseng', 'mat_he_shou_wu'],
    '南疆': ['pill_spring_recovery', 'mat_scutellaria', 'mat_phoenix_blood_grass'],
    '西漠': ['mat_dark_iron', 'mat_meteorite', 'mat_purple_gold'],
    '北冥': ['mat_cold_iron', 'mat_snow_lotus', 'mat_thousand_beast_skin'],
    '蜀地': ['wpn_frost_moon', 'wpn_dragon_spring', 'wpn_red_cloud'],
    '东南海域': ['mat_dragon_scale', 'spec_spirit_source_pearl', 'mat_dragon_saliva'],
    '灵界': ['mat_nine_leaf_lingzhi', 'spec_ten_thousand_milk', 'mat_heaven_heart_flower'],
    '魔界': ['mat_demon_beast_core', 'mat_demon_beast_bone', 'mat_demon_beast_fang']
};
const GROTTO_LOOT_FALLBACK = ['mat_peach_fruit', 'food_jade_nectar', 'mat_heaven_heart_flower'];   // 天界等地：仙家遗宝

function tryGrantGrottoLoot(k) {
    const done = wildDayMap('grottoLoot');
    if (!done || done[k]) return false;
    const pool = GROTTO_LOOT[currentRegionForMap] || GROTTO_LOOT_FALLBACK;
    const xy = k.split(',');
    const gx = Number(xy[0]) || 0, gy = Number(xy[1]) || 0;
    let h = 0;
    const rg = String(currentRegionForMap || '');
    for (let i = 0; i < rg.length; i++) h = (h * 31 + rg.charCodeAt(i)) % 9973;
    const id = pool[(gx * 17 + gy * 31 + h) % pool.length];
    if (typeof window.addItemToInventory !== 'function') return false;
    const ok = window.addItemToInventory(id, 1);
    if (ok === false) {   // 行囊满了：匣子留在供案下，腾出地方再来取（账不落，不算开过）
        showMessage('📜 供案下摸出一只木匣——可惜行囊已塞得满满当当。腾出地方再来取吧，前辈不急在这一时。', 'warning');
        return false;
    }
    done[k] = wildAbsDay();
    saveWildState();
    let name = '旧物';
    try { name = (window.itemById && window.itemById[id] && window.itemById[id].name) || name; } catch (e) {}
    showMessage('📜 石室供案下藏着一只木匣，尘封多年——前辈遗宝：【' + name + '】×1，今日归你。', 'success');
    try { showLootLore(id, 'grotto', Object.keys(done).length); } catch (eLoreG) {}   // 五十七波：遗宝残页（物件背后是一位前辈）
    try { loreEchoCheck(Object.keys(done).length); } catch (eEchoG) {}   // 五十八波：三张残页集齐，拼出一段完整的旧事
    return true;
}

function grottoAt(x, y) {
    const m = wildDayMap('grotto');
    return !!(m && m[x + ',' + y]);
}

// 崖壁打坐时的发现骰（只在 meditateWild 里调，运行时骰，不碰建图骰序）
function tryDiscoverGrotto() {
    const k = playerPos.x + ',' + playerPos.y;
    const m = wildDayMap('grotto');
    if (!m || m[k]) return false;
    if (Object.keys(m).length >= GROTTO_PER_REGION) return false;   // 每域三处封顶
    const cd = window.currentCharData || {};
    const luck = Number(cd.luck != null ? cd.luck : 50);
    const chance = GROTTO_BASE_CHANCE + Math.max(0, luck - 50) * GROTTO_LUCK_PER;
    if (Math.random() >= chance) return false;
    m[k] = wildAbsDay();
    saveWildState();
    showMessage('🕳️ 山风穿过石缝，呜咽作响——崖壁上竟裂着一线洞口，内里隐有石室！凑近看看吧。', 'success');
    renderMap(mapContainer, currentMap, viewportOffset.x, viewportOffset.y);
    return true;
}

function grottoEnter() {
    const cell = (currentMap[playerPos.y] || [])[playerPos.x];
    if (!cell || !grottoAt(playerPos.x, playerPos.y)) { showMessage('此处没有洞天——崖壁是实心的。', 'warning'); return; }
    const k = playerPos.x + ',' + playerPos.y;
    // v50 遗宝在行功之前开匣：灵机取尽的日子，宝也照取（一洞一回的账各自记）
    tryGrantGrottoLoot(k);
    const flavor = GROTTO_FLAVOR[currentRegionForMap] || '石壁上留着前人的遗刻，字迹古朴，道韵未散';
    // 头一回入洞：遗刻一悟（见闻账一生一次；每域 ≤3 处，总闸不破）
    let first = false;
    try {
        if (window.TravelJournal) first = window.TravelJournal.markOnce('grotto_' + (currentRegionForMap || '') + '_' + k, 1, '初入崖壁洞天——' + flavor);
    } catch (e) {}
    const used = wildDayMap('grottoUse');
    if (used && used[k] === wildAbsDay() && !first) { showMessage('🕳️ 今日洞中灵机已被你取尽——静室要一夜才酿得回清寂。', 'info'); return; }
    if (used) used[k] = wildAbsDay();
    advanceWildTime(240, '洞天行功');
    const gain = Math.round(GROTTO_QI * (cell.qi || 1.3));
    healChar(first ? 10 : 5, first ? 20 : 10, gain);
    if (first) showMessage('🕳️ 侧身入洞——' + flavor + '。你在石室中行功四个时辰，真气回复 ' + gain + '。', 'success');
    else showMessage('🕳️ 洞中清寂，山风不入——行功四个时辰，真气回复 ' + gain + '。', 'success');
    saveWildState();
    renderWildSidebar();
}

// ============ 第三十八波 · 扎营歇夜：夜里有夜的账 ============
// 露宿免费，但不是没有代价——时间真跳到次日清晨，睡下就有被摸营的风险。
// 与城镇打尖（花钱买安稳）成一个决策对子：花钱，还是冒险。
const CAMP_RAID_BASE = 0.15;
const CAMP_TERRAIN_MOD = {
    PLAIN: -0.05, ROAD: -0.05, FORD: -0.05,                       // 开阔地看得远
    MOUNTAIN: 0.05, FOREST: 0.05, SWAMP: 0.05, PRIMFOREST: 0.05   // 藏东西的地方
};

// 此刻到次日清晨六点有多少分钟
function minutesToDawn() {
    try {
        const gt = window.timeSystem && window.timeSystem.gameTime;
        const h = gt ? Number(gt.currentHour) || 0 : currentHour();
        const m = gt ? Number(gt.currentMinute) || 0 : 0;
        let delta = (6 - h) * 60 - m;
        if (delta <= 0) delta += 24 * 60;
        return delta;
    } catch (e) { return 600; }
}

// ============ 第五十五波 · 泅渡湿衣损货：水里过来的，人和货都得湿 ============
// 湿衣是运行时旗（cd._wetUntil，与 _wearyNoticed 同法——不进存档，读档一身干爽）；
// 镖货浸水记在镖账对象的 wet 数上（镖账本就随人物存档走）；交割折价=既有酬金的减账，零增发。
// 踏水者脚不沾水、冰面是实地、雇舟坐的是船——这三样都不湿；泅渡与涉浅滩，人和货没有不湿的。
function wetNowMinutes() {
    try { return Number(window.timeSystem.gameTime.totalMinutes) || 0; } catch (e) { return 0; }
}
function isWetNow() {
    const cd = window.currentCharData;
    if (!cd) return false;
    return Number(cd._wetUntil || 0) > wetNowMinutes();
}
function makeWet(why) {
    const cd = window.currentCharData;
    if (!cd) return;
    const wasWet = isWetNow();
    cd._wetUntil = wetNowMinutes() + WET_DRY_MIN;
    if (!wasWet) showMessage('💧 ' + why + '——浑身透湿，衣靴灌满了水，走一步挤一声（一时之内，陆地每格多耗精力 ' + WET_STEP_EN + '；扎营烤火、客栈歇脚即刻干，赶够一个时辰的路也自然干）。', 'info');
    try { maybeCatchChill(); } catch (eChill) {}   // 五十九波：冷天湿身问一回风寒（骰在五十九波段里，本节照旧零骰）
}
function dryOff(msg) {
    const cd = window.currentCharData;
    if (!cd || !isWetNow()) return false;
    cd._wetUntil = 0;
    showMessage('🔥 ' + msg, 'success');
    return true;
}
function wetEscortCargo(how) {
    try {
        if (!escortCarrying()) return;
        const e = escortLedger();
        if (!e) return;
        const before = Math.min(ESCORT_WET_MAX, Number(e.wet) || 0);
        if (before >= ESCORT_WET_MAX) return;   // 已经湿到封顶——再湿也不会更折价
        e.wet = before + 1;
        if (!_cargoWetNoticed) {
            _cargoWetNoticed = true;
            showMessage('📦 ' + how + '，镖货跟着浸了水——交割时怕要折价（每浸一回折一成，至多三成）。油布包得住小雨，包不住泅渡。', 'warning');
        }
    } catch (eWetCargo) {}
}

// ============ 第五十三波 · 睡卧养身解状态异常：一觉周天，压毒安神缓痛 ============
// 旧账的窟窿：毒素负荷只在战斗回合里衰减，出了战斗就终身滞留（界面永远挂着「中毒」）；
// 神魂震荡只靠时辰慢慢磨。野外没有任何缓解手段——扎营睡一夜，本该是最便宜的养身法子。
// 本波两头接：①瘴气/魔气 hazard 命中真上状态（毒气入体/神魂受震——话术早就这么写了，如今落地）；
// ②扎营一夜走一遍周天：压毒 -30、安神 -30、缓痛 -20（时辰衰减之外的加账）。
// 与既有系统的分寸：战斗内解毒（毒术/丹药）是「拔净」，睡一觉只是「压下去」——重毒要多夜，梯度不倒挂；
// 深伤（depth≥3）睡不好，话术指去医士（与就医系统一致，不越权奇迹）。零骰、零经济、零新存档字段。
const MIASMA_POISON_LOAD = 4;    // 瘴气（沼泽/瘴沼）命中：毒素负荷 +4
const DEMON_SHOCK_LOAD = 4;      // 魔气（骨原）命中：神魂震荡 +4
const CAMP_POISON_RELIEF = 30;   // 一夜安睡压毒
const CAMP_SHOCK_RELIEF = 30;    // 一夜安睡安神
const CAMP_PAIN_RELIEF = 20;     // 一夜安睡缓痛（比醒着多松一层）

// 玩家的生理实体：战斗侧赋值、读档侧恢复——都没有就返回空（新档没挨过打，本就没有状态可解）
function playerPhys() {
    try {
        const pe = window._playerPhysiology || window._playerEntity;
        return (pe && pe.physiology) || null;
    } catch (e) { return null; }
}

// 睡卧导引（通用口）：按给定的量压毒/安神/缓痛，返回话术碎句（没状态返回空——不废话）
// 第五十四波：营/客栈/柴房共用这一张口——床铺越好压得越多，梯度：柴房 15 < 野营 30 < 城中客栈 40 < 解毒方子（拔净）
function sleepRelief(poisonAmt, shockAmt, painAmt) {
    const phys = playerPhys();
    if (!phys) return null;
    const parts = [];
    const poison = Number(phys.poisonLoad) || 0;
    if (poison > 0) {
        const left = Math.max(0, poison - poisonAmt);
        phys.poisonLoad = left;
        parts.push(left === 0 ? '一夜周天把毒气压净了' : '毒气压下去一截，余毒还伏在血里（要拔净得靠解毒的方子）');
    }
    const shock = Number(phys.neuralShock) || 0;
    if (shock > 0) {
        const left = Math.max(0, shock - shockAmt);
        phys.neuralShock = left;
        parts.push(left === 0 ? '神魂睡安稳了' : '神魂安定了些，梦里还是发沉');
    }
    const pain = Number(phys.painLoad) || 0;
    if (pain > 0) {
        const left = Math.max(0, pain - painAmt);
        phys.painLoad = left;
        parts.push(left === 0 ? '伤口不那么疼了' : '疼痛松了一层');
    }
    try {
        const ws = phys.wounds || [];
        if (ws.some(function (w) { return w && (w.depth || 0) >= 3; })) parts.push('深处的旧伤睡不好——这种伤得寻医士，野地里养不利索');
    } catch (eW) {}
    return parts.length ? parts : null;
}

// 野营一夜的标准账（第五十三波原口，不动）
function campRelief() {
    return sleepRelief(CAMP_POISON_RELIEF, CAMP_SHOCK_RELIEF, CAMP_PAIN_RELIEF);
}

// 第五十四波 · 客栈住店也解状态：柴房凑合减半，城中客栈安睡一宿加档
const SHED_POISON_RELIEF = 15;   // 柴房压毒
const SHED_SHOCK_RELIEF = 15;    // 柴房安神
const SHED_PAIN_RELIEF = 10;     // 柴房缓痛
const INN_POISON_RELIEF = 40;    // 城中客栈压毒（正经床铺，比野地强一档）
const INN_SHOCK_RELIEF = 40;     // 城中客栈安神
const INN_PAIN_RELIEF = 30;      // 城中客栈缓痛

function wildCamp() {
    const row = currentMap[playerPos.y];
    const cell = row ? row[playerPos.x] : null;
    if (!cell) return;
    if (cell.terrainKey === 'WATER' && !isFrozenNow()) { showMessage('⛺ 水上扎不了营——先上岸再说。', 'warning'); return; }   // v47 冬天冰面上扎营，别有一番寒趣
    if (cell.poiId) { showMessage('左近就有正经落脚处，犯不着风餐露宿。', 'info'); return; }
    const where = effTerrainOf(cell).name || '野地';   // v47 冬天在冰上扎营，账写「河冰」不写「水域」
    const mod = CAMP_TERRAIN_MOD[cell.terrainKey] || 0;
    // v41 带镖扎营：夜袭加成——劫镖劫的就是夜里，来的也不是野物是人（v43 长线镖跟着人走，跨域也掂记，骰还重些）
    const _escCamp = escortCarrying() ? escortLedger() : null;
    // 夜袭骰先掷（人还躺在夜里）：地形决定这儿藏不藏得住东西
    const raided = Math.random() < (CAMP_RAID_BASE + mod + (_escCamp ? (_escCamp.long ? ESCORT_LONG_CAMP_MOD : ESCORT_CAMP_MOD) : 0) - (companionActive() ? CARAVAN_WATCH_MOD : 0));   // 六十一波：商队守更，摸营的风险降一成
    // 第五十五波 · 篝火烘衣：先生火烤衣再睡（睡一整夜本就干得透，这里管的是短夜与话术的账）
    try { dryOff('扎营生了火，湿衣烤干了——浑身干爽暖和。'); } catch (eDry) {}
    // 第六十一波 · 商队守更：搭着伙扎营，车马就停在近旁
    if (companionActive()) showMessage('🐫 商队把篷车停在近旁，伙计们轮着守更——夜里有几双眼睛替你盯着，睡得踏实些。', 'info');
    advanceWildTime(minutesToDawn(), '扎营歇夜');
    healChar(20, 60, 0);
    // 睡饱了，力竭的提醒账也翻篇
    if (window.currentCharData) { window.currentCharData._wearyNoticed = false; window.currentCharData._spentNoticed = false; }
    // 第五十三波 · 睡卧养身：一夜安睡走一遍周天（有状态异常才念叨，没有不废话；夜袭也照结——觉是先睡的）
    try {
        const _rl = campRelief();
        if (_rl) showMessage('🌙 睡卧导引：' + _rl.join('；') + '。', 'info');
    } catch (eRelief) {}
    // 第五十九波 · 暖睡发汗：守着火睡一夜，风寒发透了（病要暖着治，与烘衣一个灶）
    try { cureChill('扎营守着火睡了一夜，风寒发了一身汗，散透了——头不昏了，浑身松快。'); } catch (eChillC) {}
    if (raided) {
        if (_escCamp) {
            spawnEscortRaiders('camp');
        } else {
            showMessage('⛺ 你在' + where + '扎营睡下——半夜被一阵响动惊醒：帐外有东西摸营！', 'warning');
            rollWildEncounter(cell, true);   // 骰子已掷中，这里只管把东西召出来（现成遭遇通道）
        }
    } else {
        showMessage('⛺ 你在' + where + '扎营睡下——一觉到天亮，露重霜轻，精神养了回来（气血 +20，精力 +60）。', 'success');
    }
    saveWildState();
    renderWildSidebar();
}

// ============ 第四十波 · 商队行情：篷车集与驿亭的两句老话兑现 ============
// 买的是消息，花的是时辰（各一个时辰）——不开新货币口子。
// 行情纯读 MarketDynamic 真源（店铺回购用的同一本账），只展示不生产；
// 问路复用 shareRumor 既有的一次揭示账。零新持久化字段。

// 价差门槛：一行的最贱最贵差不足一成，就当它「平」，不值当跑
const MARKET_SPREAD_MIN = 0.1;

// 扫行情真源：每个行当找出最贱与最贵的商城（纯读零写，测试可直驱）
function marketSpreads(MD) {
    const out = [];
    const cities = (MD && MD.CITIES) || [];
    const cats = (MD && MD.CATEGORIES) || [];
    for (let i = 0; i < cats.length; i++) {
        const cat = cats[i];
        let lo = null, hi = null, loCity = '', hiCity = '';
        for (let j = 0; j < cities.length; j++) {
            let m = null;
            try { m = MD.priceMul(cities[j], cat); } catch (e) {}
            if (typeof m !== 'number' || !isFinite(m)) continue;
            if (lo === null || m < lo) { lo = m; loCity = cities[j]; }
            if (hi === null || m > hi) { hi = m; hiCity = cities[j]; }
        }
        if (lo !== null && hi !== null && loCity !== hiCity) {
            out.push({ cat: cat, lo: lo, loCity: loCity, hi: hi, hiCity: hiCity, spread: hi - lo });
        }
    }
    return out;
}

// 行情牌内芯（纯函数返回 HTML）：贱处绿、贵处红，行尾一句人话
function caravanMarketHtml() {
    const MD = window.MarketDynamic;
    if (!MD || typeof MD.priceMul !== 'function') return '';
    const rows = marketSpreads(MD);
    const hot = rows.filter(function (r) { return r.spread >= MARKET_SPREAD_MIN; });
    let html = '';
    if (!hot.length) {
        html += '<div class="text-sm text-gray-300 p-2">各行当价格平平——处处一个价，跑单帮没利钱。</div>';
    } else {
        for (let i = 0; i < hot.length; i++) {
            const r = hot[i];
            html += '<div class="flex items-center gap-2 p-2 bg-gray-700/30 rounded mb-1 text-sm">' +
                '<span class="text-white">' + r.cat + '</span>' +
                '<span class="text-green-400">贱·' + r.loCity + ' ×' + r.lo.toFixed(2) + '</span>' +
                '<span class="text-gray-500">→</span>' +
                '<span class="text-red-400">贵·' + r.hiCity + ' ×' + r.hi.toFixed(2) + '</span>' +
                '<span class="text-xs text-gray-400">手里的' + r.cat + '，往' + r.hiCity + '出手最划算</span>' +
                '</div>';
        }
        if (hot.length < rows.length) html += '<div class="text-xs text-gray-500 mt-1">其余行当各处价平，不必费脚。</div>';
    }
    return html;
}

// 篷车集打听行情：先看账在不在（不在不扣时），再扣一个时辰、弹行情牌
function askCaravanMarket() {
    const MD = window.MarketDynamic;
    if (!MD || typeof MD.priceMul !== 'function') {
        showMessage('🐫 商队的人摊手：「行情账在坊市柜上，荒郊野外问不着。」', 'info');
        return;
    }
    const body = caravanMarketHtml();
    advanceWildTime(60, '听商队讲行情');
    // 模态复用图鉴花样：点罩即关
    try {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
        modal.onclick = function (e) { if (e.target === modal && modal.remove) modal.remove(); };
        modal.innerHTML = '<div class="bg-gray-800 border border-gray-600 rounded-lg p-4 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">' +
            '<h3 class="text-base font-bold text-amber-300 mb-2">🐫 商队行情 <span class="text-xs text-gray-400 font-normal">（各处时价，随行就市天天在动）</span></h3>' +
            body +
            '<div class="text-right mt-2"><button onclick="this.closest(\'.fixed\').remove()" class="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1 rounded">知道了</button></div>' +
            '</div>';
        document.body.appendChild(modal);
    } catch (e) {}
    renderWildSidebar();
}

// 驿亭问路：没路可指先拒不扣时；指路走 shareRumor 现成选点与揭示账
function askPostRoad() {
    const unseen = currentPois.filter(function (p) { return !p.discovered; });
    if (!unseen.length) {
        showMessage('🍵 驿亭里的人想了想：「官道上近来没新鲜事——这一带你比谁都熟。」', 'info');
        return;
    }
    advanceWildTime(60, '驿亭问路');
    const poi = shareRumor({ members: [] });   // 伪商队：无同伴就从自己脚下起选
    if (poi) {
        showMessage('🍵 驿丞拿烟杆给你指路：「' + poi.name + '？许久没人去了。往' +
            dirName(poi.x - playerPos.x, poi.y - playerPos.y) + '走，莫错过。」', 'success');
    }
    renderWildSidebar();
}

// 商队闲话一句（遭遇时用）：挑价差最大的行当，报贱处与贵处；行情账缺席就闭嘴
function caravanMarketTip() {
    try {
        const MD = window.MarketDynamic;
        if (!MD || typeof MD.priceMul !== 'function') return '';
        const rows = marketSpreads(MD).filter(function (r) { return r.spread >= MARKET_SPREAD_MIN; });
        if (!rows.length) return '';
        let best = rows[0];
        for (let i = 1; i < rows.length; i++) if (rows[i].spread > best.spread) best = rows[i];
        return '伙计压低声音：近来「' + best.cat + '」' + best.loCity + '贱、' + best.hiCity + '贵——手里有这行的货，往' + best.hiCity + '出手划算。';
    } catch (e) { return ''; }
}

// ============ 第四十一波 · 真路真镖：路成为饭碗 ============
// 城里镖局那出一骰子戏不动；野外这版是用脚走的——篷车集接单、雇主画路、
// 真走那段真路、半路真被截（真战斗不切磋）、送到走经济真账结账。
// 唯一兑付口是送达：打输 / 超时 = 零收入 + 真伤。镖账是 cd._escort 单字段，读档归一化。

const ESCORT_FEE_BASE = 60;        // 起步酬金
const ESCORT_FEE_PER_STEP = 8;     // 每格真路 8 灵石
const ESCORT_FEE_CAP = 600;        // 封顶——囤镖刷不了钱
const ESCORT_AMBUSH_DAY = 0.12;    // 带镖赶路：白日每格截镖率
const ESCORT_AMBUSH_NIGHT = 0.18;  // 夜里更凶
const ESCORT_CAMP_MOD = 0.10;      // 带镖扎营：夜袭加成（劫镖劫的就是夜里）
// v43 跨域大镖：酬金压过本图封顶、限期扣着「过界门+横穿一域」的真实脚程、截镖更凶（货更肥）
const ESCORT_LONG_FEE = 650;       // 长线单酬金（一口价）
const ESCORT_LONG_DAYS = 14;       // 限期（天）
const ESCORT_LONG_AMBUSH_DAY = 0.15;
const ESCORT_LONG_AMBUSH_NIGHT = 0.22;
const ESCORT_LONG_CAMP_MOD = 0.12;
const ESCORT_LONG_FAME = 2;        // 大镖送达名气 +2（本图镖 +1）
const ESCORT_GANGS = ['黑风寨', '断云道', '赤鳞营', '白路堂'];
const ESCORT_ROLES = ['刀客', '响马', '寨主'];

// 镖账：坏账一律当无镖（归一化只认字段，不补写）——本图形认 toId+region，长线形认 long+toRegion
function escortLedger() {
    const cd = window.currentCharData;
    if (!cd) return null;
    const e = cd._escort;
    if (!e || typeof e !== 'object') return null;
    if (!isFinite(Number(e.fee)) || !isFinite(Number(e.deadlineDay))) return null;
    if (e.long) { if (!e.toRegion) return null; }
    else if (!e.toId || !e.region) return null;
    return e;
}
// 本图在手的镖（跨域休眠：回来接着走，期限照绝对日判）
function escortActiveHere() {
    const e = escortLedger();
    return !!(e && !e.long && e.region === currentRegionForMap);
}
// v43 货在身上：本图镖只在本域算携带（老行为）；长线镖到哪都算——过了界门货还在你手上，截道的跟一路
function escortCarrying() {
    const e = escortLedger();
    if (!e) return false;
    return e.long ? true : e.region === currentRegionForMap;
}

// 接镖：篷车集独有。目的地是本图另一处真镇子，货跟行情走，酬金按真实路程定死
function takeEscortJob() {
    const cd = window.currentCharData;
    if (!cd) return;
    const existing = escortLedger();
    if (existing) {
        if (wildAbsDay() > Number(existing.deadlineDay)) cd._escort = null;   // 过期旧账当场清
        else { showMessage('📦 手里还压着一单镖（送' + (existing.toName || '外镇') + '）——镖行规矩，一单一了。', 'info'); return; }
    }
    const p = playerPos;
    const hereRow = currentMap[p.y];
    const here = hereRow ? hereRow[p.x] : null;
    const herePoi = (here && here.poiId) ? currentPois.find(x => x.id === here.poiId) : null;
    const towns = currentPois.filter(x => x.type === 'town' && (!herePoi || x.id !== herePoi.id));
    if (!towns.length) { showMessage('📦 管事摊手：「这地界就我们一处人烟，镖没地方送。」', 'info'); return; }
    // 挑目的地：随机抽一处，路要真走得通（运行时骰，不碰建图骰序）
    const pool = towns.slice();
    let target = null, path = null;
    const grid = currentMap.map(r => r.map(c => ({ t: seasonTerrainKey(c) })));   // v47 镖队冬天也抄冰道（路近步少，镖费省——季节红利）
    while (pool.length && !path) {
        const idx = Math.floor(Math.random() * pool.length);
        const cand = pool.splice(idx, 1)[0];
        const res = WildTerrain.findPath(grid, { x: p.x, y: p.y }, { x: cand.x, y: cand.y });
        if (res && res.path && res.path.length > 1) { target = cand; path = res.path; }
    }
    if (!target || !path) { showMessage('📦 管事把舆图看了半晌：「这条路走不通，这单镖局不接。」', 'info'); return; }
    const steps = path.length - 1;
    const fee = Math.min(ESCORT_FEE_CAP, ESCORT_FEE_BASE + ESCORT_FEE_PER_STEP * steps);
    const deadline = wildAbsDay() + 2 + Math.ceil(steps / 50);
    // 货跟行情走：哪行价差最大运哪行（v40 行情真源），行情缺席就是杂货
    let cargo = '杂货';
    try {
        const rows = marketSpreads(window.MarketDynamic).filter(r => r.spread >= MARKET_SPREAD_MIN);
        if (rows.length) {
            let best = rows[0];
            for (const r of rows) if (r.spread > best.spread) best = r;
            cargo = best.cat;
        }
    } catch (e) {}
    cd._escort = { region: currentRegionForMap, cargo: cargo, toId: target.id, toName: target.name || '外镇', fee: fee, deadlineDay: deadline, takenDay: wildAbsDay(), steps: steps };
    // 雇主画路：目标上图（shareRumor 同款揭示账，不新立）
    target.discovered = true;
    target.rumored = true;
    const tcell = currentMap[target.y] && currentMap[target.y][target.x];
    if (tcell && tcell.fog === 0) tcell.fog = 1;
    showMessage('📦 管事把一车「' + cargo + '」交到你手上：「送去' + cd._escort.toName + '，' + steps + ' 格路，酬金 ' + fee + ' 灵石。误了限期，货就另托人了。」', 'success');
    saveWildState();
    renderWildSidebar();
}

// v43 跨域大镖：目的地是邻域（不点名到镇——邻域的镇子到了才建图，交割给「目标域随便哪处镇子」）
function takeEscortLongJob() {
    const cd = window.currentCharData;
    if (!cd) return;
    const existing = escortLedger();
    if (existing) {
        if (wildAbsDay() > Number(existing.deadlineDay)) cd._escort = null;   // 过期旧账当场清
        else {
            const toWhere = existing.long ? existing.toRegion : (existing.toName || '外镇');
            showMessage('📦 手里还压着一单镖（送' + toWhere + '）——镖行规矩，一单一了。', 'info');
            return;
        }
    }
    // 陆路邻域才发得了大镖（WorldMap 接壤账是真源；位面不算邻居）
    let nbs = [];
    try {
        if (window.WorldMap && typeof window.WorldMap.neighborsOf === 'function') nbs = window.WorldMap.neighborsOf(currentRegionForMap) || [];
    } catch (e) {}
    if (!nbs.length) { showMessage('📦 管事摇头：「此间是边地，没有陆路通着邻省——大镖发不出去。」', 'info'); return; }
    const nb = nbs[Math.floor(Math.random() * nbs.length)];   // 运行时骰，不碰建图骰序
    const deadline = wildAbsDay() + ESCORT_LONG_DAYS;
    // 货照旧跟行情走：价差最大的行当才是值得跨域运的货
    let cargo = '杂货';
    try {
        const rows = marketSpreads(window.MarketDynamic).filter(r => r.spread >= MARKET_SPREAD_MIN);
        if (rows.length) {
            let best = rows[0];
            for (const r of rows) if (r.spread > best.spread) best = r;
            cargo = best.cat;
        }
    } catch (e) {}
    cd._escort = { long: true, fromRegion: currentRegionForMap, toRegion: nb.region, cargo: cargo, fee: ESCORT_LONG_FEE, deadlineDay: deadline, takenDay: wildAbsDay() };
    showMessage('📦 管事把封条拍在车帮上：「长线大镖——一车「' + cargo + '」送去' + nb.region + '，走' + (nb.route || '官道') + '。酬金 ' + ESCORT_LONG_FEE + ' 灵石，限期' + ESCORT_LONG_DAYS + '天。我们镖行在各处镇子都有相与的商栈，认封条不认人——你进了' + nb.region + '地界，随便哪处镇子都交割得，当场结清。货跟着你过界门，一路都可能有截道的掂记，自己当心。」', 'success');
    saveWildState();
    renderWildSidebar();
}

// 截镖的来了：人形响马，等级跟着境界走（+1 偏置——敢截镖的都是好手）
function spawnEscortRaiders(scene) {
    const cd = window.currentCharData;
    let level = 3;
    try {
        level = (typeof window.realmScaledEnemyLevel === 'function') ? Math.max(1, window.realmScaledEnemyLevel(cd || {}) + 1) : Math.max(1, getRealmTier((cd || {}).realm) * 3 + 1);
    } catch (e) {}
    const foe = (typeof generateRandomEnemy === 'function') ? generateRandomEnemy(level, 'enemy') : null;
    if (!foe) return false;
    const gang = ESCORT_GANGS[Math.floor(Math.random() * ESCORT_GANGS.length)];
    const role = ESCORT_ROLES[Math.floor(Math.random() * ESCORT_ROLES.length)];
    foe.name = gang + '·截镖的' + role;
    foe._escortRaider = true;   // 随 v20.89 整包透传进战斗实体，战后结算认旗
    if (scene === 'camp') showMessage('⛺ 半夜火把围了营地——' + gang + '的人直扑镖车：「留下镖车，放你走路！」', 'warning');
    else showMessage('🗡️ ' + gang + '的人从道旁杀出，兵刃直指镖车——「此路是我开！」', 'warning');
    window.currentInteractionEntity = foe;
    if (typeof window.openBattleWithEntity === 'function') { window.openBattleWithEntity(foe); return true; }
    return false;
}

// 送达：踩上目标镇子这一刻结账——酬金走经济真账，名气走统一发放，账清
function escortDeliverHere(cell) {
    const e = (cell && cell.poiId) ? escortLedger() : null;
    if (!e || !cell) return false;
    let placeName = e.toName || '外镇';
    if (e.long) {
        // v43 长线单：货进目标域的镇子就交割——收货人认货不认镇
        if (e.toRegion !== currentRegionForMap) return false;
        const poi = currentPois.find(x => x.id === cell.poiId);
        if (!poi || poi.type !== 'town') return false;
        placeName = (poi.name || '镇子') + '（' + e.toRegion + '）';
    } else if (cell.poiId !== e.toId || e.region !== currentRegionForMap) {
        return false;
    }
    // 第五十五波 · 水浸货折价：浸过水的镖货收货人要扣价（既有酬金的减账，零增发；封顶三成——兑付行一字未动）
    const wetN = Math.min(ESCORT_WET_MAX, Number(e.wet) || 0);
    let wetCut = 0;
    if (wetN > 0) {
        wetCut = Math.round((Number(e.fee) || 0) * ESCORT_WET_PER * wetN);
        e.fee = Math.max(0, (Number(e.fee) || 0) - wetCut);
    }
    let paid = false;
    try {
        if (window.EconomyTransaction && typeof window.EconomyTransaction.credit === 'function') { window.EconomyTransaction.credit('spiritStones', Number(e.fee) || 0); paid = true; }
    } catch (err) {}
    if (!paid) {
        try { if (window.DataManager && typeof window.DataManager.addSpiritStones === 'function') window.DataManager.addSpiritStones(Number(e.fee) || 0); } catch (err2) {}
    }
    const fame = e.long ? ESCORT_LONG_FAME : 1;
    try { if (window.RewardService && typeof window.RewardService.apply === 'function') window.RewardService.apply({ fame: fame }, { source: 'escort' }); } catch (err3) {}
    if (window.currentCharData) window.currentCharData._escort = null;
    showMessage((e.long ? '📦 一车「' + e.cargo + '」稳稳卸进' : '📦 镖车稳稳停进') + placeName +
        '——收货人验了封条' + (wetCut > 0 ? '，又捏了捏浸过水的货角，折去 ' + wetCut + ' 灵石' : '') + '，当场结清 ' + e.fee + ' 灵石。' +
        (e.long ? '这趟跨域大镖，圆满。' : '这趟镖，圆满。') + '（名气 +' + fame + '）', 'success');
    saveWildState();
    renderWildSidebar();
    return true;
}

// 每格一查：先判限期（误期撤镖零收入），再掷截镖骰（v43 长线镖全域携带、骰更凶）
function stepEscortCheck() {
    const cd = window.currentCharData;
    if (!cd || !escortCarrying()) return;
    const e = escortLedger();
    if (wildAbsDay() > Number(e.deadlineDay)) {
        cd._escort = null;
        showMessage('📦 误了限期——雇主的信追到路上：「货已另托，这单撤了。」分文未入，白走一趟。', 'warning');
        renderWildSidebar();
        return;
    }
    const night = isNightNow();
    const p = e.long ? (night ? ESCORT_LONG_AMBUSH_NIGHT : ESCORT_LONG_AMBUSH_DAY) : (night ? ESCORT_AMBUSH_NIGHT : ESCORT_AMBUSH_DAY);
    if (Math.random() < p) spawnEscortRaiders('road');
}

// 战后结算（app.js 胜负两处钩子调）：胜则镖续走，败则货损账清——伤由战败流程自己真结
function settleEscortRaid(win) {
    const cd = window.currentCharData;
    if (!cd || !cd._escort) return;
    if (win) {
        showMessage('📦 打退了截道的——镖在，人在。扶正货物接着赶路。', 'success');
    } else {
        const fee = Number(cd._escort.fee) || 0;
        cd._escort = null;
        showMessage('📦 镖车翻了，货被劫了个干净——这单镖砸了，' + fee + ' 灵石酬金化为乌有。', 'warning');
    }
    renderWildSidebar();
}
window.settleEscortRaid = settleEscortRaid;

function exploreWildRuin(poi) {
    // 有名有姓的地标走探索系统；无名遗迹按它的来历结账
    if (poi.type === 'landmark' && typeof window.exploreLandmark === 'function') {
        advanceWildTime(90, '探索地标');
        window.exploreLandmark(poi.name || poi.refId);   // 第三十四波：传中文名对得上探索名录（旧账传英文键，永远「未知的地标」还白扣一个半时辰）
        renderWildSidebar();
        return;
    }
    advanceWildTime(60, '探索遗迹');
    if (window.currentCharData) window.currentCharData.energy = Math.max(0, (window.currentCharData.energy || 100) - 10);
    const v = poi.variant || null;
    // 来历决定凶险：战场有亡魂、残阵会反噬、古观会掉灰
    if (v && v.risk && Math.random() < v.risk.chance) {
        if (v.risk.battle) {
            const kind = v.risk.battle;
            const foe = (typeof generateRandomEnemy === 'function') ? generateRandomEnemy(2 + Math.floor(Math.random() * 2), kind === 'undead' ? 'enemy' : 'beast') : null;
            if (foe) {
                if (kind === 'undead') foe.physiologyType = 'undead';
                showMessage(`💀 ${v.desc ? v.desc + '——' : ''}${kind === 'undead' ? '亡魂闻到活人气，围了上来！' : '栖在此地的活物被惊动了！'}`, 'warning');
                window.currentInteractionEntity = foe;
                if (typeof window.openBattleWithEntity === 'function') { window.openBattleWithEntity(foe); renderWildSidebar(); return; }
            }
        } else {
            harmChar(v.risk.hp || 0, 0, 0);
            showMessage('⚠️ ' + v.risk.msg, 'warning');
            renderWildSidebar();
            return;
        }
    } else if (!v && Math.random() < 0.35) {
        const guardian = (typeof generateRandomEnemy === 'function') ? generateRandomEnemy(2 + Math.floor(Math.random() * 2), 'beast') : null;
        if (guardian) {
            showMessage('🏛️ 翻动瓦砾惊醒了栖在此地的活物！', 'warning');
            window.currentInteractionEntity = guardian;
            if (typeof window.openBattleWithEntity === 'function') { window.openBattleWithEntity(guardian); renderWildSidebar(); return; }
        }
    }
    // 来历也决定出什么：古观出丹药经卷、古冢出明器、战场出残铁
    const pool = (v && v.loot) ? v.loot : ['mat_iron_ore', 'mat_copper_ore', 'mat_lingzhi', 'mat_refined_iron'];
    const found = [];
    const rolls = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < rolls; i++) {
        const id = pool[Math.floor(Math.random() * pool.length)];
        const n = 1 + Math.floor(Math.random() * 2);
        if (typeof window.addItemToInventory === 'function') { window.addItemToInventory(id, n); found.push({ id: id, n: n }); }
    }
    const lead = v ? (v.name + '——' + (v.find || '翻出些旧物')) : '从瓦砾间翻出些旧物';
    showMessage(`🏛️ ${lead}：${found.length ? lootText(found, '旧物') : '什么都没剩'}。`, 'success');
    renderWildSidebar();
}

function harvestWildResource(poi) {
    if (!window.ResourcePoints || !poi.refId) return;
    const point = window.ResourcePoints.getPoint(poi.refId);
    if (!point) { showMessage('这处产地似乎已经荒了。', 'warning'); return; }
    const mySect = (window.currentCharData && window.currentCharData.sectName) || null;
    // 第一百零九波：无主产地真能占了——此前「占领」全库零调用是死账，散修只能永远暗采
    if (!point.ownerSect && typeof window.showModal === 'function' && window.ResourcePoints.claimByPlayer) {
        const _cost = window.ResourcePoints.PLAYER_CLAIM_COST || 300;
        const _have = (window.inventory && window.inventory.currency && Number(window.inventory.currency.spiritStones)) || 0;
        const html = '<p class="text-sm text-gray-300 mb-3">这是一处无主的产地，没人插旗。掏灵石把它圈下来，往后光明正大全量采撷，不用再躲看守。</p>' +
            '<button onclick="claimPlayerResourcePoint(\'' + poi.refId + '\'); var o=document.getElementById(\'xianxia-modal-overlay\'); if(o)o.remove();" class="mr-2 text-xs bg-amber-700 hover:bg-amber-600 text-white px-3 py-1.5 rounded"' + (_have < _cost ? ' disabled' : '') + '>🚩 圈占（' + _cost + ' 灵石' + (_have < _cost ? '，不够' : '') + '）</button>' +
            '<button onclick="poachWildResource(\'' + poi.refId + '\'); var o=document.getElementById(\'xianxia-modal-overlay\'); if(o)o.remove();" class="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded">先捞一把（暗采）</button>';
        window.showModal('⛏️ 无主产地 · ' + point.name, html);
        return;
    }
    advanceWildTime(120, '采撷产地');
    if (point.ownerSect && (point.ownerSect === mySect || point.ownerSect === 'player')) {
        const res = window.ResourcePoints.harvest(poi.refId);
        if (res && res.ok) {
            const out = res.output || {};
            const parts = Object.keys(out).map(k => ({ id: k, n: out[k] }));
            Object.keys(out).forEach(k => { if (typeof window.addItemToInventory === 'function') window.addItemToInventory(k, out[k]); });
            showMessage(point.ownerSect === 'player'
                ? `⛏️ 自家的产地敞开采，得 ${lootText(parts, '出产')}。`
                : `⛏️ 以本门名义采撷，得 ${lootText(parts, '出产')}。`, 'success');
        } else {
            showMessage('⛏️ 这处产地本季已经采空了，等它缓缓。', 'info');
        }
    } else {
        _poachResource(point);
    }
    renderWildSidebar();
}

// 第一百零九波：暗采的账抽成一段——无主产地选「先捞一把」也走这里
function _poachResource(point) {
    // 不是自家的：暗采有代价
    if (Math.random() < 0.4) {
        const guard = (typeof generateRandomEnemy === 'function') ? generateRandomEnemy(3, 'enemy') : null;
        showMessage(`⛏️ 你动手暗采，被${point.ownerSect && point.ownerSect !== 'player' ? point.ownerSect + '的' : ''}看守当场撞见！`, 'warning');
        if (guard) { window.currentInteractionEntity = guard; if (typeof window.openBattleWithEntity === 'function') window.openBattleWithEntity(guard); }
    } else {
        const out = window.ResourcePoints.calcYield(point) || {};
        const keys = Object.keys(out).slice(0, 2);
        keys.forEach(k => { if (typeof window.addItemToInventory === 'function') window.addItemToInventory(k, Math.max(1, Math.floor(out[k] / 2))); });
        const half = keys.map(k => ({ id: k, n: Math.max(1, Math.floor(out[k] / 2)) }));
        showMessage(keys.length ? `⛏️ 趁无人捞了一把：${lootText(half, '出产')}。` : '⛏️ 什么都没捞着。', 'success');
    }
}

function poachWildResource(refId) {
    const point = window.ResourcePoints && window.ResourcePoints.getPoint(refId);
    if (!point) { showMessage('这处产地似乎已经荒了。', 'warning'); return; }
    advanceWildTime(120, '暗采产地');
    _poachResource(point);
    renderWildSidebar();
}

function claimPlayerResourcePoint(refId) {
    if (!window.ResourcePoints || typeof window.ResourcePoints.claimByPlayer !== 'function') return;
    const r = window.ResourcePoints.claimByPlayer(refId);
    if (r && r.ok) {
        showMessage(`🚩 你插旗圈下了这处产地（-${r.cost} 灵石）——往后自家地盘，敞开采撷。`, 'success');
        if (window.gameLog && typeof window.gameLog.add === 'function') window.gameLog.add('圈占无主产地：' + refId + '（-' + r.cost + ' 灵石）', 'economy');
    } else if (r && r.reason === 'stones-low') {
        showMessage(`灵石不足（圈占需 ${r.need}，你有 ${r.have}）——插旗也是要本钱的。`, 'error');
    } else {
        showMessage('这处产地圈不下来（已有主或查无此地）。', 'warning');
    }
    renderWildSidebar();
}

function enterWildDungeon(poi) {
    if (!window.DungeonDynamic || typeof window.DungeonDynamic.enter !== 'function') return;
    // 真入口在 app.js：enterScoutedDungeon 会结时间并打开秘境房间面板
    if (typeof window.enterScoutedDungeon === 'function') {
        window.enterScoutedDungeon(poi.refId);
        return;
    }
    const res = window.DungeonDynamic.enter(poi.refId);
    if (!res.ok) {
        showMessage(res.reason === 'already-in-progress' ? '🌀 你已经在探索这座秘境了。' : '🌀 秘境的门开了，却进不去。', 'info');
        renderWildSidebar();
        return;
    }
    showMessage(`🌀 踏入「${poi.name}」第一层：${res.currentRoom.name}`, 'info');
    renderWildSidebar();
}

function poiAction(act, arg) {
    const row = currentMap[playerPos.y];
    const cell = row ? row[playerPos.x] : null;
    if (!cell) return;
    const poi = cell.poiId ? currentPois.find(p => p.id === cell.poiId) : null;
    switch (act) {
        case 'gather': gatherWildNode(); break;
        case 'rest': restAtWildTown(); break;
        case 'shop': wildShop(); break;
        case 'cultivate': wildCultivate(poi); break;
        case 'explore': if (poi) exploreWildRuin(poi); break;
        case 'spring': springRitual(); break;
        case 'harvest': if (poi) harvestWildResource(poi); break;
        case 'dungeon': if (poi) enterWildDungeon(poi); break;
        case 'ferry': renderFerryOptions(); break;
        case 'ferry-goto': ferryTravel(arg); return;   // 渡完自己重画，不必再走一遍通用收尾
        case 'claim-ley': claimLeyHere(); break;
        case 'sect-visit': if (poi) visitSectPoi(poi); break;
        case 'oasis-rest': oasisRest(); break;
        case 'pool-bathe': poolBathe(); break;
        case 'grotto-enter': grottoEnter(); break;
        case 'note-menu': renderNoteOptions(); return;   // v52 粉笔面板自己画侧栏，不走通用收尾
        case 'note-set': setNoteHere(arg); return;
        case 'note-del': delNoteHere(); return;
        case 'camp': wildCamp(); break;
        case 'ask-market': askCaravanMarket(); break;
        case 'join-caravan': joinCaravan(); break;   // v61 搭商队同行
        case 'leave-caravan': leaveCaravan(); break;
        case 'ask-road': askPostRoad(); break;
        case 'escort-job': takeEscortJob(); break;
        case 'escort-long': takeEscortLongJob(); break;
        case 'bestiary': if (typeof window.showLandmarkBestiary === 'function') window.showLandmarkBestiary(); break;
        case 'meditate': meditateWild(); break;
    }
    if (typeof updateEntityMenu === 'function') updateEntityMenu();
}

// ============ v35 山门与脉眼：宗门上图、灵脉可夺 ============
function homeSectName() {
    try { if (window.PSectWorld && typeof window.PSectWorld.homeName === 'function') return window.PSectWorld.homeName(); } catch (e) {}
    return null;
}

// 站在脉眼上布阵夺脉——闸门与扣费都在 spirit-vein 那边核，这里只管递地点、画新图
function claimLeyHere() {
    const row = currentMap[playerPos.y];
    const cell = row ? row[playerPos.x] : null;
    if (!cell || !cell.leyEye) { if (window.showMessage) window.showMessage('脚下寻不到脉眼。', 'info'); return; }
    if (typeof window.claimMapLey !== 'function') return;
    const okClaim = window.claimMapLey({ region: currentRegionForMap, x: playerPos.x, y: playerPos.y, ley: cell.ley || 1 });
    if (okClaim && mapContainer) renderMap(mapContainer, currentMap, viewportOffset.x, viewportOffset.y);
}

// 到山门：自家的开自家门，别家的看介绍
function visitSectPoi(poi) {
    const home = homeSectName();
    if (home && poi.refId === home) {
        if (typeof window.openSectManagementUI === 'function') { window.openSectManagementUI(); return; }
    }
    // 第三十六波 · 别家山门真的能进了：开现成的山门场景（守卫对话/公告/申请入门/外院待客都在里头）；
    // 场景模块或该宗名录缺失才退回介绍卡
    const otherName = poi.refId || poi.name;
    if (typeof window.showSectGateScene === 'function' && window.sectsData && window.sectsData[otherName]) {
        window.showSectGateScene(otherName);
        return;
    }
    if (typeof window.selectSect === 'function') {
        window.selectSect(poi.refId || poi.name);
        try {
            const sd = document.getElementById('sect-detail');
            if (sd) sd.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (e) {}
    } else if (window.showMessage) {
        window.showMessage('🏯 「' + poi.name + '」的山门远远在望——门房认得你，改日再来拜山。', 'info');
    }
}

// 山门角标：战云压顶 ⚔️ / 兽潮围山 🔥（只读现成的旗，不立新账）
function sectPoiBadge(sectName) {
    try {
        const f = window.eventFlags || {};
        const tp = f['sect_world_tide_pending'];
        if (tp && tp.sect === sectName) return '🔥';
        const wp = f['sect_world_war_pending'];
        if (wp && (wp.atk === sectName || wp.def === sectName)) return '⚔️';
    } catch (e) {}
    return '';
}

// 名字哈希：同名同图永远同点——山门不会读一次档挪一次窝
function hashStr(s) {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
    return h;
}

// 本域有哪些宗门（自家排头一位，余者按名序——清单稳定，落点才稳定）
function sectsInRegion(region) {
    const aliases = (REGION_ALIASES[region] && REGION_ALIASES[region].length) ? REGION_ALIASES[region].concat([region]) : [region];
    const home = homeSectName();
    const out = [];
    try {
        const sd = window.sectsData || {};
        Object.keys(sd).forEach(n => {
            const s = sd[n];
            if (s && aliases.indexOf(s.location) >= 0) out.push(n);
        });
    } catch (e) {}
    out.sort((a, b) => (a === home ? -1 : b === home ? 1 : (a < b ? -1 : a > b ? 1 : 0)));
    return out.slice(0, 3);
}

// 宗门落格：挑一处已有地物做锚（必在主陆、必有路通），在近旁寻一格干净地皮立山门
function placeSectPois(region) {
    const names = sectsInRegion(region);
    if (!names.length || !currentPois.length) return;
    const h0 = hashStr(getMapSeed() + '|' + region + '|sect');
    names.forEach((n, idx) => {
        const id = 'sect_' + idx;   // 自家永远排 0 号，落点随名走、不随册子顺序漂
        if (currentPois.some(p => p.id === id)) return;
        const anchor = currentPois[(h0 >>> (idx * 3)) % currentPois.length];
        if (!anchor) return;
        const dirs = [];
        for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
            if (!dx && !dy) continue;
            dirs.push({ dx: dx, dy: dy, d: Math.abs(dx) + Math.abs(dy) });
        }
        dirs.sort((a, b) => a.d - b.d || a.dy - b.dy || a.dx - b.dx);
        const rot = (h0 >>> idx) % dirs.length;
        let placed = null;
        for (let k = 0; k < dirs.length; k++) {
            const d = dirs[(k + rot) % dirs.length];
            const x = anchor.x + d.dx, y = anchor.y + d.dy;
            const cell = currentMap[y] && currentMap[y][x];
            if (!cell) continue;
            if (cell.poiId || cell.ley || cell.leyEye) continue;
            if (!WildTerrain.passable({ t: cell.terrainKey })) continue;
            placed = { x: x, y: y };
            break;
        }
        if (!placed) return;
        currentPois.push({
            id: id, type: 'sect', name: n, refId: n, icon: '🏯', label: '山门',
            x: placed.x, y: placed.y, discovered: false
        });
        const gateCell = currentMap[placed.y][placed.x];
        gateCell.poiId = id;
        gateCell.node = null;   // 山门底下不长药苗——立幡那格让给门楼
    });
}

// ============ 渡口（v20.59）：水路代步 ============
// 站在渡口，把已见过的其他渡口列出来，挑一处雇舟直达——
// 海面走不过去，但坐得过去。
function ferryOptions(fromPoi) {
    if (!fromPoi) return [];
    return currentPois.filter(p => p.type === 'ferry' && p.id !== fromPoi.id && p.discovered);
}

function renderFerryOptions() {
    const row = currentMap[playerPos.y];
    const cell = row ? row[playerPos.x] : null;
    const from = cell && cell.poiId ? currentPois.find(p => p.id === cell.poiId) : null;
    const acts = document.getElementById('wild-actions');
    if (!acts) return;
    if (isFrozenNow()) {
        acts.innerHTML = '<p class="text-xs text-gray-500">❄️ 冬歇——河面封冻，船家把船拖上了岸。冰面直接走得过去，就是当心深处暗流掏空了冰底。</p>';
        return;
    }
    const opts = ferryOptions(from);
    if (!opts.length) {
        acts.innerHTML = '<p class="text-xs text-gray-500">埠头空着——你还没见过别处的渡口，不知船往哪儿开。</p>';
        return;
    }
    acts.innerHTML = '<p class="text-[10px] text-gray-500 mb-1">雇舟往：</p>' + opts.map(p => {
        const d = Math.abs(p.x - playerPos.x) + Math.abs(p.y - playerPos.y);
        const mins = 30 + d * FERRY_MIN_PER_CELL;
        return `<button data-act="ferry-goto" data-target="${p.id}" class="w-full text-xs bg-sky-800 hover:bg-sky-700 text-gray-100 py-1.5 rounded transition text-left px-2">` +
            `⛴️ ${p.name}（${fmtHours(mins)} · 灵石 ${FERRY_FARE}）</button>`;
    }).join('') +
        '<button data-act="ferry-cancel" class="w-full text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 py-1 rounded transition mt-1">先不上船</button>';
}

function ferryTravel(targetId) {
    // 四十七波 · 冬歇：河面封冻，船家的船拖上了岸——冰面就是冬天的渡口（走过去的，一个子儿不花）
    if (isFrozenNow()) {
        showMessage('⛴️ 河面封了冻，船家把船拖上了岸——冰面就是冬天的渡口，直接走过去吧（当心冰裂）。', 'info');
        renderWildSidebar();
        return;
    }
    const row = currentMap[playerPos.y];
    const cell = row ? row[playerPos.x] : null;
    const from = cell && cell.poiId ? currentPois.find(p => p.id === cell.poiId) : null;
    const to = currentPois.find(p => p.id === targetId);
    if (!from || !to || to.type !== 'ferry' || !to.discovered) return;
    if (typeof spendSpiritStones === 'function' && !spendSpiritStones(FERRY_FARE)) {
        showMessage('⛴️ 船家摇头：船钱 ' + FERRY_FARE + ' 灵石，一个子儿都不能少。', 'warning');
        renderWildSidebar();
        return;
    }
    wildTravel = null;
    const d = Math.abs(to.x - from.x) + Math.abs(to.y - from.y);
    advanceWildTime(30 + d * FERRY_MIN_PER_CELL, '雇舟渡水');
    // 水路也有水路的凶险， roll 一次水里的事
    rollWildEncounter({ terrainKey: 'WATER', terrain: WildTerrain.TERRAIN.WATER });
    playerPos = { x: to.x, y: to.y };
    window.playerPos = playerPos;
    markPoiVisited(to.id);
    centerViewport();
    revealAround(to.x, to.y);
    saveWildState();
    renderMap(mapContainer, currentMap, viewportOffset.x, viewportOffset.y);
    if (typeof updateEntityMenu === 'function') updateEntityMenu();
    if (window.showMessage && !window._wildEncounterFired) window.showMessage(`⛴️ 船靠了对岸，到了「${to.name}」。`, 'success');
    window._wildEncounterFired = false;
}

// ============ 足迹（v20.59）：亲脚到过的地物，图上留个印 ============
function markPoiVisited(poiId) {
    const st = wildState.regions[currentRegionForMap] || (wildState.regions[currentRegionForMap] = { dead: {}, gathered: {} });
    st.visited = st.visited || {};
    st.visited[poiId] = 1;
    const poi = currentPois.find(p => p.id === poiId);
    if (poi) poi.visited = true;
    // v36 亲至地标：脚踩上去才算见过，见闻账留一笔
    if (poi) { try { if (window.TravelJournal) window.TravelJournal.noteLandmark(poi); } catch (e) {} }
}

function poiIsVisited(poiId) {
    const st = wildState.regions[currentRegionForMap];
    return !!(st && st.visited && st.visited[poiId]);
}

// ============ 野外的活气（v20.62）：有别的东西也在动 ============
// 兽群成群游荡、商队沿古道赶路、宗门弟子结队巡查、沙暴瘴云压地而来。
// 野外感的一大半来自「有别的东西也在动」——地图不该是一堆钉死的图标。

const WANDER_KINDS = {
    pack:    { label: '兽群', symbol: '🐾', speed: 0.55, strict: false, prefer: null },
    caravan: { label: '商队', symbol: '🐫', speed: 0.5,  strict: true,  prefer: ['ROAD'] },
    patrol:  { label: '巡查', symbol: '🛡️', speed: 0.45, strict: true,  prefer: ['ROAD'] }
};

// 商队有名有姓：走哪条道，挂哪家的幌子
const CARAVAN_NAMES = {
    '中州': '河阳车马行', '东荒': '青木货队', '南疆': '赤水马帮', '西漠': '金城驼队',
    '北冥': '朔风皮货队', '蜀地': '剑门盐队', '东南海域': '渔火船帮', '灵界': '云阶仙货行', '魔界': '骨原鬼市队',
    '天界': '香火贡队'   // v44 凡间祠庙的供奉运上天——跟香火账呼应
};

// 巡查挂谁的旗：自家门派的弟子巡值，没入宗就是地方上的散修巡值
const PATROL_NAMES = {
    '中州': '洛北巡值', '东荒': '青木巡值', '南疆': '五仙教巡值', '西漠': '金城巡值',
    '北冥': '朔风巡值', '蜀地': '剑门巡值', '东南海域': '渔火巡值', '灵界': '云阶巡值', '魔界': '九幽巡值',
    '天界': '凌霄巡值'
};

// 天象云影：一地一样的天，而且它会自己走过来
const DRIFT_SPECS = {
    '西漠':   { name: '沙暴', icon: '🌪️', tint: '#d8b26a', op: 0.22, w: 4, h: 2, harm: [1, 5, 0], msg: '沙暴的云影压过来，天黄了半边，沙粒打在脸上生疼。' },
    '南疆':   { name: '瘴云', icon: '🌫️', tint: '#7a8a3a', op: 0.24, w: 3, h: 2, harm: [2, 4, 0], msg: '一团瘴云慢悠悠飘过来，草木都蔫了下去。' },
    '北冥':   { name: '风雪', icon: '🌨️', tint: '#dfeaf2', op: 0.26, w: 4, h: 3, harm: [0, 5, 3], msg: '风雪像一堵墙推过来，眉毛上都结了霜。' },
    '魔界':   { name: '魔雾', icon: '🌑', tint: '#7a2a2a', op: 0.24, w: 3, h: 3, harm: [3, 3, 2], msg: '魔雾贴着地皮爬过来，骨头缝里往外冒凉气。' },
    '东南海域': { name: '海雾', icon: '🌫️', tint: '#9ec8e8', op: 0.22, w: 4, h: 2, harm: [0, 3, 0], msg: '海雾漫上来，三步开外就看不清了。' },
    '天界':   { name: '罡风', icon: '🌬️', tint: '#f0e2b0', op: 0.20, w: 4, h: 2, harm: [4, 3, 2], msg: '九天罡风扫过云原，仙躯也觉得罡刃割面。' }
};

let wildBands = [];         // { id, kind, name, members:[entity], cool }
let wildDrift = null;       // { spec, x, y, vx, vy, cool }
let wildContactBand = null; // 这一步谁撞上了人（赶路途中据此打断行程）

const BAND_DIRS = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];

function roadCellsOf(map) {
    const out = [];
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[0].length; x++) {
            if (map[y][x].terrainKey === 'ROAD') out.push({ x: x, y: y });
        }
    }
    return out;
}

// 结伴而行的人不踩聚落、不进水里、也不跟别人叠在一格（人脚下那格允许撞上）
function bandCanStand(cell, band) {
    if (!cell || !WildTerrain.passable({ t: cell.terrainKey })) return false;
    if (cell.poiId) return false;
    const others = (cell.entities || []).filter(e => e && !isEntityDead(e) && !(band && band.members.indexOf(e) >= 0));
    return others.length === 0;
}

// ============ 第六十波 · 商队冬天抄冰道：河一封冻，商队兽群都走冰上 ============
// 冬天封冻的河面就是现成的道（四十七波冰面老账）——赶路的商队比谁都懂这笔账：
// 河一冻上，商队认的道就多了一条冰路；兽群也踏着冰面过河觅食（巡查不抄冰道——官差守老路）。
// 挪窝账才改：落位照旧走建图时的老规矩（seedWildLife 一字不动，建图骰序零漂移）；
// 零新骰、零存档字段；开春冰化水涨，商队兽群回老路——季节真的在改变世界的走法。
let _iceCaravanNoticed = false;   // 冰道抄近路的见闻一场报一回（运行时旗，开图翻篇，零存档字段）

// 冰道：冬天封冻的水面，商队/兽群当作实地走（不踩聚落、不挤占格——站账的老规矩照旧）
function bandOnIce(band, cell) {
    if (!cell || cell.poiId) return false;
    if (!isFrozenNow() || cell.terrainKey !== 'WATER') return false;
    if (!band || (band.kind !== 'caravan' && band.kind !== 'pack')) return false;
    const others = (cell.entities || []).filter(e => e && !isEntityDead(e) && band.members.indexOf(e) < 0);
    return others.length === 0;
}

function makeBandMember(bandId, idx, kind, name, cell, data) {
    return {
        type: kind === 'pack' ? 'beast' : 'person',
        kind: kind,
        personType: kind === 'caravan' ? 'merchant' : 'normal',
        name: name,
        symbol: WANDER_KINDS[kind].symbol,
        habitat: cell ? cell.terrainKey : 'ROAD',
        data: data || {},
        bandId: bandId,
        x: cell ? cell.x : 0,
        y: cell ? cell.y : 0,
        uid: 'b' + bandId + '_' + idx + '_' + (cell ? cell.x : 0) + '_' + (cell ? cell.y : 0)
    };
}

function uidIsDead(u) {
    const st = wildState.regions[currentRegionForMap];
    return !!(st && st.dead && st.dead[u]);
}

// ---- 撒活物：古道成网才有人走，兽群从已撒的兽里聚起来 ----
function seedWildLife(map, pois, rng) {
    wildBands = [];
    wildDrift = null;
    wildContactBand = null;
    const nearStart = (x, y) => Math.abs(x - playerPos.x) + Math.abs(y - playerPos.y) <= 3;
    const used = {};
    const put = (band, member, cell) => {
        member.x = cell.x; member.y = cell.y;
        cell.entities.push(member);
        band.members.push(member);
        used[cell.x + ',' + cell.y] = true;
    };

    const roads = roadCellsOf(map).filter(c => !nearStart(c.x, c.y));

    // ---- 商队 / 巡查：沿古道走，两三人结伴 ----
    // 第八十六波·领队挑落脚点：孤格领队（四邻没有一段能站人的古道）带不出伙计，
    // 整队商队会就地蒸发——老伤，此前靠骰流运气掩盖，兽况密度一挪就现形。
    // 领队先看前后有没有路，合乎商队结伴走古道的本性；不加骰（只改认可集，不改骰数）。
    function pickRoadCell() {
        const hasRoadRoom = (c) => {
            for (const d of BAND_DIRS) {
                const nc = map[c.y + d.y] && map[c.y + d.y][c.x + d.x];
                if (nc && nc.terrainKey === 'ROAD' && bandCanStand(nc, null) && !used[nc.x + ',' + nc.y] && !nearStart(nc.x, nc.y)) return true;
            }
            return false;
        };
        for (let i = 0; i < 30; i++) {
            const c = roads[Math.floor(rng() * roads.length)];
            if (!c || used[c.x + ',' + c.y]) continue;
            if (!hasRoadRoom(c)) continue;
            return c;
        }
        return null;
    }
    function freeCellNear(anchors) {
        const tried = {};
        for (let i = 0; i < 14; i++) {
            const a = anchors[Math.floor(rng() * anchors.length)];
            if (!a) continue;
            const d = BAND_DIRS[Math.floor(rng() * BAND_DIRS.length)];
            const nx = a.x + d.x, ny = a.y + d.y;
            const key = nx + ',' + ny;
            if (tried[key]) continue;
            tried[key] = true;
            const cell = map[ny] && map[ny][nx];
            if (!cell || !bandCanStand(cell, null) || used[key] || nearStart(nx, ny)) continue;
            return cell;
        }
        return null;
    }
    // 商队巡查只认古道：结伴的人也一个个站在路上，不散到路边的野地里
    function roadCellNear(anchors) {
        const tried = {};
        for (let i = 0; i < 16; i++) {
            const a = anchors[Math.floor(rng() * anchors.length)];
            if (!a) continue;
            const d = BAND_DIRS[Math.floor(rng() * BAND_DIRS.length)];
            const nx = a.x + d.x, ny = a.y + d.y;
            const key = nx + ',' + ny;
            if (tried[key]) continue;
            tried[key] = true;
            const cell = map[ny] && map[ny][nx];
            if (!cell || cell.terrainKey !== 'ROAD' || !bandCanStand(cell, null) || used[key] || nearStart(nx, ny)) continue;
            return cell;
        }
        return null;
    }
    const crewWanted = roads.length >= 8 ? 2 : roads.length >= 4 ? 1 : 0;
    for (let i = 0; i < crewWanted; i++) {
        const kind = i === 0 ? 'caravan' : 'patrol';
        const head = pickRoadCell();
        if (!head) break;
        const sect = (window.currentCharData && window.currentCharData.sectName) || null;
        const bandName = kind === 'caravan'
            ? (CARAVAN_NAMES[currentRegionForMap] || '过路商队')
            : (sect ? sect + '巡值' : (PATROL_NAMES[currentRegionForMap] || '散修巡值'));
        const band = { id: 'band' + wildBands.length, kind: kind, name: bandName, members: [], cool: 0 };
        const size = 2 + Math.floor(rng() * 2);
        for (let m = 0; m < size; m++) {
            const cell = m === 0 ? map[head.y][head.x] : roadCellNear(band.members.length ? band.members : [head]);
            if (!cell) break;
            const lvl = 1 + Math.floor(rng() * 2);
            const data = (typeof generateRandomEnemy === 'function') ? generateRandomEnemy(lvl, 'enemy') : { name: '路人', hp: 50 };
            const role = kind === 'caravan'
                ? (m === 0 ? bandName + '领队' : bandName + '伙计')
                : (m === 0 ? bandName + '弟子' : bandName + '修士');
            put(band, makeBandMember(band.id, m, kind, role, cell, Object.assign({ isMonster: false }, data)), cell);
        }
        if (band.members.length >= 2) wildBands.push(band);
        else band.members.forEach(mm => {
            const c = currentMap[mm.y] && currentMap[mm.y][mm.x];
            const k = c ? c.entities.indexOf(mm) : -1;
            if (c && k >= 0) c.entities.splice(k, 1);
        });
    }

    // ---- 兽群：头兽就是野地里那只，再聚 1~2 只同伙 ----
    const beasts = [];
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[0].length; x++) {
            if (nearStart(x, y)) continue;
            (map[y][x].entities || []).forEach(e => {
                if (e.type === 'beast' && !isEntityDead(e) && !uidIsDead(e.uid)) beasts.push({ e: e, x: x, y: y });
            });
        }
    }
    const packCount = Math.min(2, beasts.length);
    for (let i = 0; i < packCount; i++) {
        const spot = beasts.splice(Math.floor(rng() * beasts.length), 1)[0];
        if (!spot) break;
        const cell0 = map[spot.y][spot.x];
        if (!cell0 || cell0.entities.indexOf(spot.e) < 0) continue;
        const band = { id: 'band' + wildBands.length, kind: 'pack', name: (spot.e.name || '野兽') + '群', members: [], cool: 0 };
        spot.e.bandId = band.id;
        put(band, spot.e, cell0);
        const more = 1 + Math.floor(rng() * 2);
        for (let m = 0; m < more; m++) {
            const cell = freeCellNear(band.members);
            if (!cell) break;
            const data = (typeof generateRandomEnemy === 'function') ? generateRandomEnemy(1 + Math.floor(rng() * 3), 'beast') : { name: '野兽', hp: 60 };
            const nm = pickFlavorName(habitatFlavor(cell).beasts, rng) || data.name || '野兽';
            put(band, makeBandMember(band.id, m + 1, 'pack', nm, cell, Object.assign({}, data, { name: nm })), cell);
        }
        wildBands.push(band);
    }

    // ---- 天象云影：一地一样的天，会自己走 ----
    const spec = DRIFT_SPECS[currentRegionForMap];
    if (spec && map[0].length > spec.w + 2 && map.length > spec.h + 2) {
        wildDrift = {
            spec: spec,
            x: 1 + Math.floor(rng() * (map[0].length - spec.w - 2)),
            y: 1 + Math.floor(rng() * (map.length - spec.h - 2)),
            vx: rng() < 0.5 ? 1 : -1,
            vy: rng() < 0.5 ? 1 : -1,
            cool: 0
        };
    }
}

// 读档回填后，死册里的成员得从队伍里剔除，免得「死了又站起来」
function pruneWildBands() {
    const onMap = new Set();   // 按对象本身记，别拿普通对象当集合（键会被转成字符串）
    for (let y = 0; y < currentMap.length; y++) {
        for (let x = 0; x < currentMap[0].length; x++) {
            (currentMap[y][x].entities || []).forEach(e => { if (e && e.bandId) onMap.add(e); });
        }
    }
    wildBands.forEach(band => { band.members = band.members.filter(m => onMap.has(m)); });
    wildBands = wildBands.filter(band => band.members.length >= 1);
}

// ============ 第六十一波 · 搭商队同行：同路一段，有个照应 ============
// 路上撞见的商队，能求个捎带——散修的重要活法：
// 夜里商队伙计轮着守更（扎营摸营的风险降一成）、赶路天天有行情听（不花时辰白听）；
// 代价是脚程随车队（陆地每格行程多耗一半——驮着货的车马比人慢）。
// 搭伙/散伙是运行时账（_caravanCompanion，开图即清——商队不落存档，与湿衣风寒同法）；
// 零骰、零经济、零新存档字段：守更守不守、车马快不快全是定数，票子只有房钱镖费那些老账。
const CARAVAN_PACE_MUL = 1.5;    // 脚程随车队：陆地每格行程 ×1.5
const CARAVAN_WATCH_MOD = 0.10;  // 夜里有人守更：扎营摸营概率 -10%
let _caravanCompanion = null;    // 当前搭伙的商队（活物队伍的运行时引用，零存档字段）
let _caravanTipDay = -1;         // 上一回随队听行情是哪个绝对日（一天一回，不刷屏）

function companionActive() {
    return !!(_caravanCompanion && wildBands.indexOf(_caravanCompanion) >= 0 && _caravanCompanion.members.some(m => !isEntityDead(m)));
}
function companionPaceMul() {
    return companionActive() ? CARAVAN_PACE_MUL : 1;
}

// 就近找商队（脚下或四邻一格内）——喊得着的才搭得上
function caravanNearby() {
    if (companionActive()) return null;
    for (let i = 0; i < wildBands.length; i++) {
        const b = wildBands[i];
        if (b.kind !== 'caravan') continue;
        const h = b.members.find(m => !isEntityDead(m));
        if (!h) continue;
        if (Math.max(Math.abs(h.x - playerPos.x), Math.abs(h.y - playerPos.y)) <= 1) return b;
    }
    return null;
}

function joinCaravan() {
    const b = caravanNearby();
    if (!b) { showMessage('近旁没有商队可搭——野地里喊一嗓子，只有风应你。', 'info'); return false; }
    _caravanCompanion = b;
    _caravanTipDay = wildAbsDay();
    showMessage('🐫 你朝「' + b.name + '」的领队拱了拱手，他上下打量你一眼，笑着回礼：「同路的，跟上便是——只是车马慢，莫嫌。」你搭上了商队：脚程随车队（陆地每格行程多耗一半），换来夜里有人守更（扎营摸营的风险降一成）、赶路天天有行情听。要散伙，随时言语一声。', 'success');
    try { renderWildSidebar(); } catch (e) {}
    return true;
}

function leaveCaravan() {
    if (!companionActive()) { _caravanCompanion = null; return false; }
    const nm = (_caravanCompanion && _caravanCompanion.name) || '商队';
    _caravanCompanion = null;
    _caravanTipDay = -1;
    showMessage('🐫 你朝「' + nm + '」拱手道别：「前面岔路，就此别过。」领队回礼：「路上仔细。」各走各路——脚程回来了，夜里也重新只剩你自己。', 'info');
    try { renderWildSidebar(); } catch (e) {}
    return true;
}

// 商队随行：每走一步，商队朝你挪一格（定数挪窝，零骰；挪不动就原地等——比如你泅明水过河，车马过不得）
function followPlayer(band) {
    if (!band) return false;
    const head = band.members.find(m => !isEntityDead(m));
    if (!head) return false;
    if (Math.max(Math.abs(head.x - playerPos.x), Math.abs(head.y - playerPos.y)) <= 1) return false;   // 跟得够近，不往前挤
    const dx = playerPos.x - head.x, dy = playerPos.y - head.y;
    const tries = Math.abs(dx) >= Math.abs(dy)
        ? [{ x: Math.sign(dx), y: 0 }, { x: 0, y: Math.sign(dy) }]
        : [{ x: 0, y: Math.sign(dy) }, { x: Math.sign(dx), y: 0 }];
    let target = null;
    for (let i = 0; i < tries.length && !target; i++) {
        if (!tries[i].x && !tries[i].y) continue;
        const nx = head.x + tries[i].x, ny = head.y + tries[i].y;
        if (nx === playerPos.x && ny === playerPos.y) continue;   // 不踩人
        const c = currentMap[ny] && currentMap[ny][nx];
        if (c && (bandCanStand(c, band) || bandOnIce(band, c))) target = c;
    }
    if (!target) return false;
    // 头一个先挪，全队贴着跟上（与游荡挪窝同理；挪不动的站回原处，不硬塞）
    const dests = [target];
    band.members.forEach((m, i) => {
        if (isEntityDead(m)) return;
        const from = currentMap[m.y] && currentMap[m.y][m.x];
        if (from) { const k = from.entities.indexOf(m); if (k >= 0) from.entities.splice(k, 1); }
        let dest = dests[i];
        if (!dest) {
            for (let j = 0; j < BAND_DIRS.length && !dest; j++) {
                const c = currentMap[target.y + BAND_DIRS[j].y] && currentMap[target.y + BAND_DIRS[j].y][target.x + BAND_DIRS[j].x];
                if (c && (bandCanStand(c, band) || bandOnIce(band, c)) && dests.indexOf(c) < 0 && (c.x !== playerPos.x || c.y !== playerPos.y)) dest = c;
            }
        }
        if (!dest || window.currentInteractionEntity === m) { if (from) from.entities.push(m); return; }   // 挪不动就站回原处
        dests.push(dest);
        dest.entities.push(m);
        m.x = dest.x; m.y = dest.y;
    });
    return true;
}

// ---- 每走一步，野外也动一步。视野外的懒得算（省性能，也免得全图乱爬） ----
function tickWildLife() {
    wildContactBand = null;
    if (!currentMap.length) return;
    // 第六十一波 · 搭伙的商队散了伙要报一声（队伍没了/全倒了，账自动清）
    if (_caravanCompanion && !companionActive()) {
        const _cn = (_caravanCompanion && _caravanCompanion.name) || '商队';
        _caravanCompanion = null;
        showMessage('🐫 「' + _cn + '」不知何时岔上了别的道，幌子看不见了——搭伙的账到此为止，路上重新只剩你自己。', 'info');
    }
    wildBands.forEach(band => {
        if (band.cool > 0) band.cool--;
        const head = band.members.find(m => !isEntityDead(m));
        if (!head) return;
        // 第六十一波 · 商队随行：搭伙的商队不瞎逛，跟着你走；随行天天白听一句行情（零骰）
        if (band === _caravanCompanion) {
            followPlayer(band);
            if (wildAbsDay() !== _caravanTipDay) {
                _caravanTipDay = wildAbsDay();
                try { const _tip = caravanMarketTip(); if (_tip) showMessage('🐫 ' + _tip, 'info'); } catch (eTip) {}
            }
            return;
        }
        const d = Math.max(Math.abs(head.x - playerPos.x), Math.abs(head.y - playerPos.y));
        if (d > 9) return;
        if (Math.random() > WANDER_KINDS[band.kind].speed) return;
        moveBand(band);
        // 第六十波 · 冰道见闻：冬天看见商队踏着封冻的河面赶路——一场报一回（零骰，纯见闻）
        try {
            if (!_iceCaravanNoticed && band.kind === 'caravan' && isFrozenNow()) {
                const _h = band.members.find(m => !isEntityDead(m));
                const _c = _h && currentMap[_h.y] && currentMap[_h.y][_h.x];
                if (_c && _c.terrainKey === 'WATER') {
                    _iceCaravanNoticed = true;
                    showMessage('🐫 河面封冻，' + (band.name || '商队') + ' 正踏着冰面赶路，车辙一直压到河心——冬天的道比夏天的近，赶货的人最懂这笔账。', 'info');
                }
            }
        } catch (eIce) {}
        checkBandContact(band);
    });
    moveWildDrift();
}

function moveBand(band) {
    const kind = WANDER_KINDS[band.kind];
    const head = band.members.find(m => !isEntityDead(m));
    if (!head) return;
    let target = null;
    for (let i = 0; i < BAND_DIRS.length; i++) {
        const nx = head.x + BAND_DIRS[i].x, ny = head.y + BAND_DIRS[i].y;
        const cell = currentMap[ny] && currentMap[ny][nx];
        if (!cell || !(bandCanStand(cell, band) || bandOnIce(band, cell))) continue;   // 六十波：冬天冰面也是道
        if (nx === playerPos.x && ny === playerPos.y) { target = cell; break; }   // 可以撞上人
        if (kind.strict && cell.terrainKey !== 'ROAD' && !bandOnIce(band, cell)) continue;   // 商队巡查只认古道；冬天商队多认一条冰道（六十波）
        if (!kind.strict && kind.prefer && kind.prefer.indexOf(cell.terrainKey) < 0 && Math.random() < 0.6) continue;
        target = cell; break;
    }
    if (!target) return;
    // 全队一起挪：头一个去目标格，其余贴着目标格站
    const dests = [target];
    band.members.forEach((m, i) => {
        if (isEntityDead(m)) return;
        const from = currentMap[m.y] && currentMap[m.y][m.x];
        if (from) { const k = from.entities.indexOf(m); if (k >= 0) from.entities.splice(k, 1); }
        let dest = dests[i];
        if (!dest) {
            for (let j = 0; j < BAND_DIRS.length && !dest; j++) {
                const c = currentMap[target.y + BAND_DIRS[j].y] && currentMap[target.y + BAND_DIRS[j].y][target.x + BAND_DIRS[j].x];
                if (c && (bandCanStand(c, band) || bandOnIce(band, c)) && dests.indexOf(c) < 0 && (c.x !== playerPos.x || c.y !== playerPos.y)) dest = c;
            }
        }
        if (!dest) return;   // 挪不动就原地站着，别硬塞
        dests.push(dest);
        if (window.currentInteractionEntity === m) return;   // 正跟人打交道，别把人从脚下抽走
        dest.entities.push(m);
        m.x = dest.x; m.y = dest.y;
    });
}

function checkBandContact(band) {
    if (!band || band.cool > 0) return false;
    const member = band.members.find(m => !isEntityDead(m) && m.x === playerPos.x && m.y === playerPos.y);
    if (!member) return false;
    return bandContact(band, member);
}

function dirName(dx, dy) {
    const ns = dy < 0 ? '北' : dy > 0 ? '南' : '';
    const ew = dx < 0 ? '西' : dx > 0 ? '东' : '';
    return (ew && ns) ? ew + ns : (ew || ns || '不远处');
}

// 消息带到：没去过的地方在图上留个「传闻」记号——看不真切，但知道它在哪
function shareRumor(band) {
    const unseen = currentPois.filter(p => !p.discovered);
    if (!unseen.length) return null;
    const head = band.members.find(m => !isEntityDead(m)) || playerPos;
    unseen.sort(function (a, b) {
        return (Math.abs(a.x - head.x) + Math.abs(a.y - head.y)) - (Math.abs(b.x - head.x) + Math.abs(b.y - head.y));
    });
    const poi = unseen[Math.min(unseen.length - 1, Math.floor(Math.random() * 3))];
    poi.discovered = true;
    poi.rumored = true;
    const cell = currentMap[poi.y] && currentMap[poi.y][poi.x];
    if (cell && cell.fog === 0) cell.fog = 1;
    return poi;
}

function bandContact(band, member) {
    wildContactBand = band;
    band.cool = 5;
    if (band.kind === 'pack') {
        // v20.64 兽群是真的几只一起围上来：同伙跟着头兽进场，不再站在原地看戏
        const mates = (band.members || []).filter(m => m && m !== member && !isEntityDead(m));
        mates.forEach(m => {
            if (!m.data) m.data = {};
            const head = member.data || {};
            // 同伙跟头兽一个量级，不然「围上来」只是排队送死
            if (head.level) m.data.level = head.level;
            if (head.attrs) m.data.attrs = Object.assign({}, head.attrs);
        });
        if (mates.length) member._packMates = mates;
        showMessage('⚠️ ' + band.name + '撞见了你，头兽低吼一声，' +
            (mates.length ? mates.length + ' 只一起围上来！' : '低吼着扑了上来！'), 'warning');
        window.currentInteractionEntity = member;
        if (typeof window.openBattleWithEntity === 'function') window.openBattleWithEntity(member);
        return true;
    }
    if (band.kind === 'caravan') {
        const poi = shareRumor(band);
        showMessage('🐫 ' + band.name + '的人冲你拱手：' +
            (poi ? '「' + poi.name + '」听说过么？往' + dirName(poi.x - playerPos.x, poi.y - playerPos.y) + '去，路上仔细。'
                 : '同路一段，路上仔细。'), 'info');
        // v40 跑单帮闲话：半数时候捎带一句真行情（这是运行时遭遇骰，不碰建图骰序）
        if (Math.random() < 0.5) {
            const tip = caravanMarketTip();
            if (tip) showMessage('🐫 ' + tip, 'info');
        }
        return true;
    }
    // 巡查：拦下你提个醒，见你带伤还会给一枚丹药
    const poi = shareRumor(band);
    const hurt = (window.currentCharData && (window.currentCharData.health || 0) < 55);
    showMessage('🛡️ ' + band.name + '拦下你：' +
        (poi ? '近日「' + poi.name + '」那边不太平，往' + dirName(poi.x - playerPos.x, poi.y - playerPos.y) + '去要当心。'
             : '此地不太平，早些赶路。') +
        (hurt ? ' 见你带伤，给了你一枚' + (itemNameOf('pill_small_recovery') || '疗伤丹药') + '。' : ''), 'info');
    if (hurt && typeof window.addItemToInventory === 'function') window.addItemToInventory('pill_small_recovery', 1);
    return true;
}

// ---- 天象云影：会走的天气，罩到头上就结账 ----
function playerInDrift() {
    const d = wildDrift;
    if (!d || !currentMap.length) return false;
    return playerPos.x >= d.x && playerPos.x < d.x + d.spec.w && playerPos.y >= d.y && playerPos.y < d.y + d.spec.h;
}

function moveWildDrift() {
    if (!wildDrift || !currentMap.length) return;
    const d = wildDrift, cols = currentMap[0].length, rows = currentMap.length;
    // 天象大体认一个方向走，偶尔偏一偏：是「飘过来的云」，不是原地打转的游魂
    if (Math.random() < 0.08) d.vx = [-1, 0, 1][Math.floor(Math.random() * 3)];
    if (Math.random() < 0.08) d.vy = [-1, 0, 1][Math.floor(Math.random() * 3)];
    if (!d.vx && !d.vy) d.vx = Math.random() < 0.5 ? 1 : -1;
    d.x += d.vx; d.y += d.vy;
    if (d.x < 0) { d.x = 0; d.vx = 1; }
    if (d.y < 0) { d.y = 0; d.vy = 1; }
    if (d.x + d.spec.w > cols) { d.x = cols - d.spec.w; d.vx = -1; }
    if (d.y + d.spec.h > rows) { d.y = rows - d.spec.h; d.vy = -1; }
    if (d.cool > 0) d.cool--;
    if (playerInDrift() && d.cool <= 0) {
        d.cool = 6;
        harmChar(d.spec.harm[0], d.spec.harm[1], d.spec.harm[2]);
        if (window.showMessage) window.showMessage(d.spec.icon + ' ' + d.spec.msg, 'warning');
    }
}

function drawWildDrift(svg, size) {
    if (!wildDrift) return;
    const d = wildDrift, s = d.spec;
    for (let y = d.y; y < d.y + s.h; y++) {
        for (let x = d.x; x < d.x + s.w; x++) {
            if (!currentMap[y] || !currentMap[y][x]) continue;
            svg.appendChild(svgEl('rect', {
                x: x * size, y: y * size, width: size, height: size,
                fill: s.tint, opacity: s.op * (0.8 + ((x + y) % 2) * 0.2),
                'pointer-events': 'none', 'class': 'wild-drift'
            }));
        }
    }
    // 云影边上一道线，让人看清这是一团会走的天象（边框用 path，不用带描边的方块）
    svg.appendChild(svgEl('path', {
        d: framePathD(d.x * size + 2, d.y * size + 2, s.w * size - 4, s.h * size - 4),
        fill: 'none', stroke: s.tint, 'stroke-width': 1, opacity: 0.45, 'pointer-events': 'none', 'class': 'wild-drift'
    }));
    const lx = Math.max(4, Math.min(d.x * size + 6, currentMap[0].length * size - 60));
    const ly = Math.max(14, d.y * size + 14);
    const label = svgEl('text', { x: lx, y: ly, 'font-size': 12.5, fill: '#f3e3c0', 'class': 'wild-label', 'data-tier': 90, 'pointer-events': 'none' });
    label.textContent = s.icon + s.name;
    svg.appendChild(label);
}

// ---- 侧栏「野外的动静」：谁在附近、往哪边去了 ----
function renderWildLifeList() {
    const el = document.getElementById('wild-life-list');
    if (!el) return;
    const rows = [];
    wildBands.forEach(band => {
        const m = band.members.find(x => !isEntityDead(x));
        if (!m) return;
        const dx = m.x - playerPos.x, dy = m.y - playerPos.y;
        const d = Math.abs(dx) + Math.abs(dy);
        if (d > 9) return;
        const k = WANDER_KINDS[band.kind];
        rows.push({
            d: d,
            icon: k.symbol,
            name: band.name,
            cls: band.kind === 'pack' ? 'text-orange-400' : band.kind === 'caravan' ? 'text-amber-300' : 'text-sky-300',
            pos: d === 0 ? '就在脚下' : dirName(dx, dy) + ' ' + d + ' 格',
            hot: d <= 1
        });
    });
    if (wildDrift) {
        const dx = Math.round(wildDrift.x + wildDrift.spec.w / 2 - playerPos.x);
        const dy = Math.round(wildDrift.y + wildDrift.spec.h / 2 - playerPos.y);
        const inside = playerInDrift();
        rows.push({
            d: inside ? 0 : 99,
            icon: wildDrift.spec.icon,
            name: wildDrift.spec.name,
            cls: 'text-gray-300',
            pos: inside ? '正罩着你' : dirName(dx, dy) + '那头',
            hot: inside
        });
    }
    // 第六十一波 · 搭伙账：跟着商队走，这笔账置顶（d=-1 排在所有动静前头）
    if (companionActive()) {
        rows.unshift({ d: -1, icon: '🐫', name: '与「' + _caravanCompanion.name + '」搭伙同行中', cls: 'text-amber-300', pos: '脚程随车队 · 夜里有人守更', hot: true });
    }
    el.innerHTML = rows.length
        ? rows.sort((a, b) => a.d - b.d).map(r =>
            '<div class="flex justify-between items-center bg-gray-800/60 px-2 py-1 rounded border border-gray-700">' +
            '<span class="text-xs ' + r.cls + '">' + r.icon + ' ' + r.name + '</span>' +
            '<span class="text-[10px] ' + (r.hot ? 'text-red-400' : 'text-gray-500') + '">' + r.pos + '</span></div>').join('')
        : '<p class="text-xs text-gray-500 text-center">四野安静，什么动静都没有。</p>';
}

// ============ 生死账 ============
function isEntityDead(e) {
    if (!e) return true;
    if (e.isDead || e.isCorpse) return true;
    if (typeof e.hp === 'number' && e.hp <= 0) return true;
    return false;
}

// v36 裁死出口：tryBeastAmbush（兽主动扑人）全项目零入口——野外的凶险已由
// 兽群游荡（checkBandContact）与途中遭遇（rollWildEncounter）真接线，这段死码删掉。

// ============ 信息栏 ============
function updateInfo() {
    const infoDiv = document.getElementById('map-info');
    if (!infoDiv || !currentMap.length) return;
    const row = currentMap[playerPos.y];
    const cell = row ? row[playerPos.x] : null;
    const terrainName = cell ? cell.terrain.name : '未知';
    const entityCount = cell && cell.entities ? cell.entities.filter(e => !isEntityDead(e)).length : 0;
    infoDiv.textContent = `📍 ${currentRegionForMap || ''} 野外 · ${terrainName}${cell && cell.ley ? ' · 🌀灵脉' + cell.ley + '重' : ''} · 灵气 ${cell ? cell.qi.toFixed(2) : '-'} · 此地 ${entityCount} 人/兽`;
}

// ============ 初始化 ============
function initRandomMap(svgId, region) {
    const svg = document.getElementById(svgId);
    if (!svg) { console.error('SVG容器未找到'); return; }
    mapContainer = svg;
    svg.setAttribute('viewBox', `0 0 ${MAP_CONFIG.VIEWPORT_COLS * MAP_CONFIG.CELL_SIZE} ${MAP_CONFIG.VIEWPORT_ROWS * MAP_CONFIG.CELL_SIZE}`);
    bindWildSidebar();
    buildWildMap(region);
    centerViewport();
    renderMap(svg, currentMap, viewportOffset.x, viewportOffset.y);
    if (typeof updateEntityMenu === 'function') updateEntityMenu();
    saveWildState();
}

function openWildernessMap(regionName) {
    // v44 天界境界闸（单一收口）：非仙躯不能立足——地区列表、传送、任何后门都绕不过这里。
    // 只认现境界不认 _unlockedTianjie 旧旗：回入尘世转世之后仙躯已散，凡人不该再上去。
    if (regionName === '天界') {
        const _cd = window.currentCharData;
        const _asc = !!_cd && (_cd.realm === '飞升' || _cd.realm === '金仙');
        if (!_asc) {
            if (typeof showMessage === 'function') showMessage('🌤️ 界膜之上罡风如刃，非仙躯不能立足——待飞升之后，天界之路自开。', 'warning');
            return;
        }
    }
    const section = document.getElementById('random-map-section');
    if (section) section.classList.remove('hidden');
    // 第四十六波：换一张图，下水的风味话术账也跟着翻篇（新图头一回下水算头一回）
    _waterEntryNoticed = false;
    _swimForcedNoticed = false;
    // 四十七波：冬冰与春汛的头一回话术同样一场一回
    _iceEntryNoticed = false;
    _fordFloodNoticed = false;
    // 第八十九波：御空掠险与乘水兽渡水的头一回话术也一场一回
    _aloftNoticed = false;
    _waterMountNoticed = false;
    // 五十五波：货浸水的提醒也一场一回
    _cargoWetNoticed = false;
    // 六十波：冰道抄近路的见闻也一场一回
    _iceCaravanNoticed = false;
    // 六十一波：搭伙的商队换图即散（活物重撒，旧账不认——商队不落存档）
    _caravanCompanion = null;
    _caravanTipDay = -1;
    // 第一百零七波：跟着你出关隘的同伴——跨山越界，人是一起走的（此前只有进城一条路同步队伍位置）
    try { if (window.partySystem && typeof window.partySystem.syncPartyLocationToPlayer === 'function') window.partySystem.syncPartyLocationToPlayer(regionName); } catch (eParty) {}

    const titleEl = document.getElementById('random-map-title');
    if (titleEl) titleEl.textContent = '📍 ' + regionName + ' · 野外';

    const leftSidebar = document.querySelector('.lg\\:w-64');
    if (leftSidebar) { leftSidebar._savedDisplay = leftSidebar.style.display; leftSidebar.style.display = 'none'; }
    const md = document.getElementById('map-detail');
    if (md) md.classList.add('hidden');
    const sd = document.getElementById('sect-detail');
    if (sd) sd.classList.add('hidden');

    initRandomMap('random-map-svg', regionName);
    // 第五十六波 · 仇家跨域追杀：带追旗的仇家跟到脚下这域（仇位空才挪，零骰）
    try { nemesisFollowHere(regionName); } catch (eFollow) {}
    // 天下疆界：「你在此」要跟着人挪州
    if (window.WorldMap && typeof window.WorldMap.refresh === 'function') {
        try { window.WorldMap.refresh('world-map'); } catch (e) {}
    }
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeRandomMap() {
    const section = document.getElementById('random-map-section');
    if (section) section.classList.add('hidden');
    const leftSidebar = document.querySelector('.lg\\:w-64');
    if (leftSidebar) leftSidebar.style.display = leftSidebar._savedDisplay || '';
    saveWildState();
}

// v36 裁死出口：regenerateMap / openCityUI 全项目零入口，删。
// 一域一图之后「重新生成」本就无意义；进城走的是关隘与天下疆界的真出口。

function travelToRegion(regionName) { openWildernessMap(regionName); }

function generateSeededMap(rows, cols, region, seed) {
    const gen = WildTerrain.generate({
        seed: seed || getMapSeed(), region: region,
        rows: rows || MAP_CONFIG.ROWS, cols: cols || MAP_CONFIG.COLS,
        landmarks: [], resources: [], dungeons: []
    });
    return gen.grid;
}

function generateRandomMap(rows, cols, region) { return generateSeededMap(rows, cols, region, getMapSeed()); }

function getCurrentCellEntities() {
    const row = currentMap[playerPos.y];
    const cell = row ? row[playerPos.x] : null;
    return cell ? (cell.entities || []) : [];
}

// ============ 侧栏事件（事件委托，避免内联 onclick） ============
function bindWildSidebar() {
    const root = document.getElementById('wild-sidebar');
    if (!root || root._wildBound) return;
    root._wildBound = true;
    root.addEventListener('click', function (ev) {
        const target = ev.target.closest('[data-act]');
        if (!target) return;
        const act = target.getAttribute('data-act');
        if (act === 'travel-go') confirmTravel();
        else if (act === 'travel-cancel') { wildTravel = null; renderMap(mapContainer, currentMap, viewportOffset.x, viewportOffset.y); }
        else if (act === 'poi-goto') gotoPoi(target.getAttribute('data-poi'));
        else if (act === 'ferry-goto') poiAction('ferry-goto', target.getAttribute('data-target'));
        else if (act === 'ferry-cancel') renderWildSidebar();
        else if (act === 'note-set') poiAction('note-set', target.getAttribute('data-target'));
        else if (act === 'note-cancel') renderWildSidebar();
        else if (act === 'world-exit' && window.WorldMap) window.WorldMap.setOut(target.getAttribute('data-exit'));
        else if (act === 'leave-tianjie') { if (typeof window.leaveTianjie === 'function') window.leaveTianjie(); }
        else poiAction(act);
    });
}

// ============ 第五十九波 · 湿衣染风寒：冷天湿着身子，是要生病的 ============
// 湿衣原先只是累——夜里泅过冰凉的河还能没事人一样，这不是散修的账。
// 湿身上身那一刻（makeWet 里）问一回风寒骰：夜里（十九点到五点）才问，冬天整日都算冷——
// 不过冬天水面封冻、泅水本就湿不了身（五十五波冰面老账），风寒主要是春秋夜泳染上的。
// 风寒是运行时旗（cd._chillUntil，与 _wetUntil 同法——不进存档，读档病好）；
// 病着陆地每格多耗 1 精力（与湿衣两本账叠加，都用显式判空写法——力竭的 0 不能被抹掉）；
// 治：暖睡一夜（扎营/客栈）发一身汗；硬扛过四个时辰也自己散（风寒就是这么个东西）。
const CHILL_CHANCE = 0.25;
const CHILL_MIN = 240;
const CHILL_STEP_EN = 1;
const CHILL_NIGHT_FROM = 19;
const CHILL_NIGHT_TO = 5;

function isColdNow() {
    try {
        const gt = window.timeSystem && window.timeSystem.gameTime;
        if (!gt) return false;
        if (String(gt.currentSeason) === 'winter') return true;
        const h = Number(gt.currentHour) || 0;
        return h >= CHILL_NIGHT_FROM || h < CHILL_NIGHT_TO;
    } catch (e) { return false; }
}

function isChilledNow() {
    const cd = window.currentCharData;
    if (!cd) return false;
    return Number(cd._chillUntil || 0) > wetNowMinutes();
}

// 湿身上身那一刻问一回（只在 makeWet 里调；骰就这一枚，记在本节账上）
function maybeCatchChill() {
    if (isChilledNow()) return false;    // 已经病着，不重复中
    if (!isColdNow()) return false;      // 天暖，湿了也不病
    if (Math.random() >= CHILL_CHANCE) return false;
    const cd = window.currentCharData;
    if (!cd) return false;
    cd._chillUntil = wetNowMinutes() + CHILL_MIN;
    showMessage('🤒 身上发热、头昏沉沉的——湿衣让冷风一激，染上了风寒。四个时辰之内，陆地每格多耗精力 ' + CHILL_STEP_EN + '；暖睡一夜（扎营/客栈住店）发一身汗就好，硬扛过去也能自己散。', 'warning');
    return true;
}

function cureChill(msg) {
    const cd = window.currentCharData;
    if (!cd || !isChilledNow()) return false;
    cd._chillUntil = 0;
    showMessage('🔥 ' + (msg || '暖睡一夜，风寒发透了——头不昏了。'), 'success');
    return true;
}

// ============ 对外暴露 ============
window.initRandomMap = initRandomMap;
window.travelToRegion = travelToRegion;
window.closeRandomMap = closeRandomMap;
window.openWildernessMap = openWildernessMap;
window.getCurrentCellEntities = getCurrentCellEntities;
window.isEntityDead = isEntityDead;
window.renderMap = renderMap;
window.onCellClick = onCellClick;
window.buildWildMap = buildWildMap;
window.saveWildState = saveWildState;

// ============ 第六十二波 · 医馆坐堂：野地里落下的病，城里大夫接得住 ============
// 五十三/五十九波的边界项补齐：风寒野地里只能暖睡发汗、毒与神魂只能靠睡卧导引慢慢压——
// 进了城，医馆坐堂大夫该接得住。app.js 的医馆诊治（外伤十五灵石老账）走到尾，调这里看里症。
// 账的梯度：睡卧（客栈 40）< 大夫针药（60）< 解毒丹拔净（丹药老账）——花钱买的是快和狠，不是唯一解；
// 门槛之下的轻症大夫不收钱（睡一觉就好，别花冤枉钱）；诊金按病收，诊金进医馆的药柜（真扣零增发）。
// 零骰：诊不诊得出、收多少钱、压多少全是定数。
const CLINIC_CHILL_FEE = 8;      // 风寒：施针灌药发一身汗
const CLINIC_POISON_FEE = 25;    // 毒入体：针引药力放血拔毒
const CLINIC_SHOCK_FEE = 20;     // 神魂受震：安神汤定魂香
const CLINIC_PAIN_FEE = 10;      // 伤疼难忍：外敷止疼散
const CLINIC_POISON_CURE = 60;   // 拔毒六成（客栈睡卧四成——大夫比床板狠）
const CLINIC_SHOCK_CURE = 60;
const CLINIC_PAIN_CURE = 50;
const CLINIC_AIL_MIN = 5;        // 轻症门槛：这点毛病睡一觉就好，大夫不挣这个钱

// 诊金真扣：经济真账优先，旧钱袋子兜底（与仇家搜身同一套路数——钱只出不进，守恒）
function clinicPay(amt) {
    try {
        if (window.EconomyTransaction && typeof window.EconomyTransaction.debit === 'function'
            && Number(window.EconomyTransaction.getBalance('spiritStones')) >= amt) {
            return !!window.EconomyTransaction.debit('spiritStones', amt);
        }
    } catch (ePay) {}
    try {
        const s = (window.XianXia && window.XianXia.DataManager)
            ? Number(window.XianXia.DataManager.getSpiritStones()) || 0
            : ((window.inventory && window.inventory.currency) ? Number(window.inventory.currency.spiritStones) || 0 : 0);
        if (s < amt) return false;
        if (window.XianXia && window.XianXia.DataManager) window.XianXia.DataManager.deductSpiritStones(amt);
        else if (window.inventory && window.inventory.currency) window.inventory.currency.spiritStones -= amt;
        return true;
    } catch (ePay2) { return false; }
}

// 坐堂看里症：医馆诊治收尾时调——有什么病看什么病，按病收诊金；没病不收冤枉钱
function clinicTreatAfflictions() {
    const out = [];
    const phys = playerPhys();
    // 风寒：施针灌药，当场发汗（暖睡一夜的账，大夫一炷香办完）
    try {
        if (isChilledNow()) {
            if (clinicPay(CLINIC_CHILL_FEE)) {
                const cd = window.currentCharData;
                if (cd) cd._chillUntil = 0;
                showMessage('🏥 大夫施了几针，又灌下一碗祛风汤——你发了一身透汗，风寒散了（诊金 ' + CLINIC_CHILL_FEE + ' 灵石）。', 'success');
                out.push('chill');
            } else {
                showMessage('🏥 大夫诊出你染了风寒，方子都写好了，诊金却凑不齐——方子留在大夫手里，病还在你身上。', 'warning');
                out.push('chill-unpaid');
            }
        }
    } catch (eChillT) {}
    if (phys) {
        const poison = Number(phys.poisonLoad) || 0;
        if (poison > CLINIC_AIL_MIN) {
            if (clinicPay(CLINIC_POISON_FEE)) {
                phys.poisonLoad = Math.max(0, poison - CLINIC_POISON_CURE);
                showMessage(phys.poisonLoad <= 0
                    ? '🏥 大夫以针引药，又放了一盏毒血——余毒拔净了，脉象重新清亮（诊金 ' + CLINIC_POISON_FEE + ' 灵石）。'
                    : '🏥 大夫以针引药，拔去了大半毒气——剩下的余毒，靠你底子慢慢将养（诊金 ' + CLINIC_POISON_FEE + ' 灵石；要拔净还得解毒的丹药）。', 'success');
                out.push('poison');
            } else {
                showMessage('🏥 大夫诊出你毒入血分，眉头越皱越紧，可诊金凑不齐——他叹了口气，把解毒的方子抄给了你。', 'warning');
                out.push('poison-unpaid');
            }
        }
        const shock = Number(phys.neuralShock) || 0;
        if (shock > CLINIC_AIL_MIN) {
            if (clinicPay(CLINIC_SHOCK_FEE)) {
                phys.neuralShock = Math.max(0, shock - CLINIC_SHOCK_CURE);
                showMessage(shock - CLINIC_SHOCK_CURE <= 0
                    ? '🏥 一盅安神汤下去，又点了一炉定魂香——震散的神魂归了位（诊金 ' + CLINIC_SHOCK_FEE + ' 灵石）。'
                    : '🏥 安神汤加定魂香，神魂安定了大半——余下的悸动，将养些日子自平（诊金 ' + CLINIC_SHOCK_FEE + ' 灵石）。', 'success');
                out.push('shock');
            } else {
                showMessage('🏥 大夫诊出你神魂不宁，安神汤的诊金却凑不齐——他只能嘱咐你：这几夜务必睡足。', 'warning');
                out.push('shock-unpaid');
            }
        }
        const pain = Number(phys.painLoad) || 0;
        if (pain > CLINIC_AIL_MIN) {
            if (clinicPay(CLINIC_PAIN_FEE)) {
                phys.painLoad = Math.max(0, pain - CLINIC_PAIN_CURE);
                showMessage('🏥 伤处敷上止疼散，又服了一剂汤药——疼头压下去了（诊金 ' + CLINIC_PAIN_FEE + ' 灵石；药劲过了还会疼，伤筋动骨终归要养）。', 'success');
                out.push('pain');
            } else {
                showMessage('🏥 大夫看了看你的伤，止疼散的诊金凑不齐——他摇摇头：「忍着些，疼也是长肉的一部分。」', 'warning');
                out.push('pain-unpaid');
            }
        }
    }
    if (!out.length) {
        showMessage('🏥 大夫把过脉，又看了舌苔：「里头没病根，不用花这个冤枉钱。」（里症按病收诊金——没病，大夫不挣你的钱）', 'info');
    }
    try { if (window.updateCharacterStatus) window.updateCharacterStatus(); } catch (eUI2) {}
    return out;
}

// ============ 第六十三波 · 酒楼点菜吃饭：赶路的力气，是饭吃出来的 ============
// 大城的酒楼原先只能喝酒与做东——走了一天路进得城来，竟没处坐下吃口热饭（野外的落脚镇反而有打尖）。
// 点菜：热汤热饭一顿，补精力气血；饭劲饱腹四个时辰——赶路耗的精力，每格至多省回 1 点。
// **耗多少省多少**：平路本就不耗精力，也就没得省（吃饭不能把走路吃成刷精力的路子——守恒）；
// 爬山耗的那点、湿衣风寒多耗的那点，饭劲能顶回来（吃饱了抗造）。力竭见底不救——吃饱抵不了垮账。
// 饱腹是运行时旗（cd._fedUntil，与湿衣/风寒同法——不进存档，读档清账）；零骰、零存档字段；
// 票子只在酒楼那头动铜钱老账（30 铜钱一顿，与喝酒 20/做东 40 一个价体系）。
const MEAL_EN = 40;          // 一顿饭补的精力
const MEAL_HP = 10;          // 顺带补的气血
const MEAL_FED_MIN = 240;    // 饭劲顶四个时辰（240 分钟）
const MEAL_STEP_SAVE = 1;    // 饱腹时每格至多省回的精力（只省真耗掉的）

function fedMinutes() {
    try { return Number(window.timeSystem.gameTime.totalMinutes) || 0; } catch (e) { return 0; }
}
function isFedNow() {
    const cd = window.currentCharData;
    if (!cd) return false;
    return Number(cd._fedUntil || 0) > fedMinutes();
}
// 酒楼点菜调这里（building-effects 把本城的菜话术递进来）；没人返回 false
function makeFed(dishMsg) {
    const cd = window.currentCharData;
    if (!cd) return false;
    cd._fedUntil = fedMinutes() + MEAL_FED_MIN;
    let maxE = 100;
    try { if (typeof window.getEffectiveMax === 'function') maxE = Number(window.getEffectiveMax('energy')) || 100; } catch (eMax) {}
    cd.energy = Math.min(maxE, Number(cd.energy != null ? cd.energy : maxE) + MEAL_EN);
    const maxH = Number(cd.maxHealth) || 100;
    cd.health = Math.min(maxH, Number(cd.health != null ? cd.health : maxH) + MEAL_HP);
    showMessage('🍚 ' + (dishMsg || '热汤热菜摆了一桌，吃得干干净净') + ' 精力 +' + MEAL_EN + '、气血 +' + MEAL_HP + '；饭劲饱腹四个时辰——赶路耗的精力，每格至多省回 1 点（耗多少省多少）。', 'success');
    try { if (window.updateCharacterStatus) window.updateCharacterStatus(); } catch (eUI3) {}
    return true;
}

window.wildMapApi = {
    confirmTravel: confirmTravel,
    gotoPoi: gotoPoi,
    poiAction: poiAction,
    gatherWildNode: gatherWildNode,
    stepTo: stepTo,
    revealAround: revealAround,
    state: function () { return wildState; },
    pois: function () { return currentPois; },
    tileActions: tileActions,
    habitatFlavor: habitatFlavor,
    seasonTint: seasonTint,
    seasonTravelMul: seasonTravelMul,
    terrainHazard: terrainHazard,
    applyTerrainHazard: applyTerrainHazard,
    ferryOptions: ferryOptions,
    ferryTravel: ferryTravel,
    // v46 泅渡与踏水：水路账的三线数（测试对账用）
    swim: {
        CFG: {
            SWIM_MIN: SWIM_MIN_PER_CELL, SWIM_EN: SWIM_ENERGY, GATE: SWIM_GATE, FORCE_HP: SWIM_FORCE_HP,
            WALK_MIN: WATERWALK_MIN_PER_CELL, WALK_EN: WATERWALK_ENERGY, WALK_TIER: WATERWALK_TIER
        }
    },
    // v47 四时改地：季节覆层的账与纯函数（测试对账用）
    season: {
        CFG: {
            FORD_SPRING_MUL: FORD_SPRING_MUL, FORD_SPRING_HAZ_MUL: FORD_SPRING_HAZ_MUL,
            SWAMP_SUMMER_HAZ_MUL: SWAMP_SUMMER_HAZ_MUL,
            ICE_MOVE: WildTerrain.TERRAIN.RIVER_ICE.moveCost, ICE_HAZ_CHANCE: 0.08, ICE_HAZ_HP: 4
        },
        key: seasonTerrainKey,
        frozen: isFrozenNow,
        eff: effTerrainOf
    },
    // v49 崖壁隐藏洞天（测试对账用）
    grotto: {
        CFG: { ELEV_MIN: GROTTO_ELEV_MIN, BASE: GROTTO_BASE_CHANCE, LUCK_PER: GROTTO_LUCK_PER, CAP: GROTTO_PER_REGION, QI: GROTTO_QI },
        at: grottoAt,
        discover: tryDiscoverGrotto,
        enter: grottoEnter,
        flavor: GROTTO_FLAVOR,
        LOOT: GROTTO_LOOT,          // v50 遗宝货池（九域各一池）
        LOOT_FALLBACK: GROTTO_LOOT_FALLBACK
    },
    // v51 具名响马宿敌（测试对账用）
    nemesis: {
        CFG: {
            FORGE: NEMESIS_FORGE_CHANCE, AMBUSH: NEMESIS_AMBUSH_CHANCE, COOLDOWN: NEMESIS_COOLDOWN_DAYS,
            SLAY: NEMESIS_SLAY_WINS, ROB_BASE: NEMESIS_ROB_BASE, ROB_STEP: NEMESIS_ROB_STEP,
            EPITHETS: NEMESIS_EPITHETS, SURNAMES: NEMESIS_SURNAMES,
            CHASE_DAYS: NEMESIS_CHASE_DAYS   // v56 追旗的有效期
        },
        active: activeNemesis,
        forge: maybeForgeNemesis,
        ambush: tryNemesisAmbush,
        spawn: spawnNemesis,
        settle: settleWildNemesis,
        follow: nemesisFollowHere   // v56 跨域追杀：进域时的挪账口
    },
    // v57 遗宝残页（测试对账用）
    lore: {
        CFG: { OWNERS: LORE_OWNERS, GROTTO_WHY: LORE_GROTTO_WHY, SPOIL_WHY: LORE_SPOIL_WHY, ECHOES: LORE_ECHOES },
        hash: loreHash,
        story: lootStoryText,
        show: showLootLore,
        // v58 残页回响（测试对账用）
        FULL: LORE_FULL_STORIES,
        FULL_FALLBACK: LORE_FULL_FALLBACK,
        ECHO_CFG: { HP: LORE_ECHO_HP, EN: LORE_ECHO_EN, QI: LORE_ECHO_QI, CAP: GROTTO_PER_REGION },
        echo: loreEchoCheck
    },
    // v52 地图粉笔笔记（测试对账用）
    note: {
        CFG: { CAP: NOTE_CAP },
        MARKS: NOTE_MARKS,
        at: noteAt,
        set: setNoteHere,
        del: delNoteHere,
        menu: renderNoteOptions
    },
    // v53 睡卧养身（测试对账用）
    relief: {
        CFG: {
            POISON: CAMP_POISON_RELIEF, SHOCK: CAMP_SHOCK_RELIEF, PAIN: CAMP_PAIN_RELIEF,
            MIASMA_POISON: MIASMA_POISON_LOAD, DEMON_SHOCK: DEMON_SHOCK_LOAD,
            SHED: { POISON: SHED_POISON_RELIEF, SHOCK: SHED_SHOCK_RELIEF, PAIN: SHED_PAIN_RELIEF },   // v54 柴房
            INN: { POISON: INN_POISON_RELIEF, SHOCK: INN_SHOCK_RELIEF, PAIN: INN_PAIN_RELIEF },       // v54 城中客栈（app.js 调口取数）
            // v62 医馆坐堂（app.js 医馆诊治收尾调 doctor）
            CLINIC: {
                CHILL_FEE: CLINIC_CHILL_FEE, POISON_FEE: CLINIC_POISON_FEE, SHOCK_FEE: CLINIC_SHOCK_FEE, PAIN_FEE: CLINIC_PAIN_FEE,
                POISON_CURE: CLINIC_POISON_CURE, SHOCK_CURE: CLINIC_SHOCK_CURE, PAIN_CURE: CLINIC_PAIN_CURE, AIL_MIN: CLINIC_AIL_MIN
            }
        },
        phys: playerPhys,
        camp: campRelief,
        sleep: sleepRelief,
        doctor: clinicTreatAfflictions
    },
    // v55 泅渡湿衣损货（测试对账用）
    wet: {
        CFG: { DRY_MIN: WET_DRY_MIN, STEP_EN: WET_STEP_EN, ESCORT_PER: ESCORT_WET_PER, ESCORT_MAX: ESCORT_WET_MAX },
        isWet: isWetNow,
        make: makeWet,
        dry: dryOff,
        cargo: wetEscortCargo,
        // v59 湿衣染风寒（测试对账用）
        chill: {
            CFG: { CHANCE: CHILL_CHANCE, MIN: CHILL_MIN, STEP_EN: CHILL_STEP_EN, NIGHT_FROM: CHILL_NIGHT_FROM, NIGHT_TO: CHILL_NIGHT_TO },
            isCold: isColdNow,
            isChilled: isChilledNow,
            roll: maybeCatchChill,
            cure: cureChill
        }
    },
    // v63 酒楼点菜吃饭（测试对账用）
    meal: {
        CFG: { EN: MEAL_EN, HP: MEAL_HP, FED_MIN: MEAL_FED_MIN, STEP_SAVE: MEAL_STEP_SAVE },
        isFed: isFedNow,
        feed: makeFed
    },
    poiIsVisited: poiIsVisited,
    ground: WildGround,
    variants: function () { return POI_VARIANTS; },
    ley: {
        mark: markLeyZones,
        level: leyEnemyLevel,
        buff: buffLeyBeast,
        threshold: leyQiThreshold,
        scatter: scatterEntities,
        encounter: rollWildEncounter
    },
    life: {
        bands: function () { return wildBands; },
        drift: function () { return wildDrift; },
        kinds: WANDER_KINDS,
        tick: tickWildLife,
        contact: function (i) { const b = wildBands[i]; return b ? checkBandContact(b) : false; },
        seed: seedWildLife,
        prune: pruneWildBands,
        inDrift: playerInDrift,
        iceRoad: bandOnIce,   // v60 冬天商队兽群抄冰道（挪窝认不认脚下这格冰）
        move: moveBand,
        // v61 搭商队同行（测试对账用）
        companion: {
            CFG: { PACE: CARAVAN_PACE_MUL, WATCH: CARAVAN_WATCH_MOD },
            active: companionActive,
            nearby: caravanNearby,
            join: joinCaravan,
            leave: leaveCaravan,
            follow: followPlayer,
            band: function () { return _caravanCompanion; }
        }
    },
    // v40 商队行情（跑单帮的耳目）：真源只读，测试可直驱
    trade: {
        spreads: marketSpreads,
        html: caravanMarketHtml,
        tip: caravanMarketTip,
        askMarket: askCaravanMarket,
        askRoad: askPostRoad
    },
    // v41 真路真镖（路成为饭碗）：接单、截镖、送达、结算，测试可直驱（v43 添长线大镖）
    escort: {
        take: takeEscortJob,
        takeLong: takeEscortLongJob,
        ledger: escortLedger,
        activeHere: escortActiveHere,
        carrying: escortCarrying,
        step: stepEscortCheck,
        settle: settleEscortRaid,
        deliverHere: escortDeliverHere,
        spawn: spawnEscortRaiders,
        CFG: { base: ESCORT_FEE_BASE, perStep: ESCORT_FEE_PER_STEP, cap: ESCORT_FEE_CAP, day: ESCORT_AMBUSH_DAY, night: ESCORT_AMBUSH_NIGHT, campMod: ESCORT_CAMP_MOD, longFee: ESCORT_LONG_FEE, longDays: ESCORT_LONG_DAYS, longDay: ESCORT_LONG_AMBUSH_DAY, longNight: ESCORT_LONG_AMBUSH_NIGHT, longCampMod: ESCORT_LONG_CAMP_MOD, longFame: ESCORT_LONG_FAME }
    }
};
window.currentMap = currentMap;
window.playerPos = playerPos;
window.currentRegionForMap = currentRegionForMap;
window.MAP_SEED_KEY = MAP_SEED_KEY;
window.getMapSeed = getMapSeed;
window.setMapSeed = setMapSeed;
window.generateSeededMap = generateSeededMap;
window.createSeededRandom = WildTerrain.createSeededRandom;
window.REGION_TERRAIN_WEIGHTS = WildTerrain.REGION_PROFILES;

/* ==================== 九州舆图：图例 + 选中态双向联动（界面整改 P1，纯呈现） ====================
   舆图的州块/城市/门派节点写死在 仙侠.html，样式在 styles/panel-map.css，这里只补两样：
   ① 一块图例（州色/点位/地物符号/读法），样例直接借用 #world-map 的 defs——
      同文档内 <use href="#wmPine">、fill="url(#wmGradZZ)" 都解析得到，图例永远不会和图对不上号；
   ② 选中态与左右联动。app.js 的 selectProvince/selectCity 会把选中的州写成
      style="opacity:1;stroke:#fbbf24"，selectSect 则一律压到 0.4；这里不改它那一笔，
      只用 MutationObserver 把结果读回来，换成 class（x-map-sel / x-has-prov）驱动样式。
   onclick 一律照旧：图例里的州行只是替玩家点一下 window.selectProvince。 */
(function worldMapLegendAndLinkage() {
    // node 验收桩（tests/v20.5x-wild-map-node.js）里的 document 是假的：元素没有 querySelectorAll /
    // insertBefore，也没有 MutationObserver。图例与联动是浏览器里的观感活儿，环境不对就整个跳过。
    if (typeof window === 'undefined' || !window.MutationObserver) return;
    const LEGEND_ID = 'x-map-legend';
    const SEL = 'x-map-sel', HOVER = 'x-map-hover', HAS = 'x-has-prov', LABELS = 'x-sect-labels';
    const GOLD = /^(rgb\(251,\s*191,\s*36\)|#fbbf24)$/i;
    let svg = null, panel = null, legend = null, nowLine = null;
    let provRows = [], pin = null, touched = false, queued = false;

    const $ = id => document.getElementById(id);
    const arr = nl => Array.prototype.slice.call(nl || []);
    const nameOf = p => (p && p.getAttribute('data-province')) || '';

    function provinces() { return svg ? arr(svg.querySelectorAll('[data-province]')) : []; }
    function itemName(it) {
        // 列表行由 app.js 生成，州名只在内层 span 里；就地认一次、挂在 data-x-name 上备查
        // （app.js 一切换「地区/门派」就重建列表，新节点第一次碰到时才读）
        if (it.dataset.xName === undefined) {
            const s = it.querySelector(':scope > div > span:first-child');
            it.dataset.xName = s ? (s.textContent || '').trim() : '';
        }
        return it.dataset.xName;
    }
    function readNames() {
        arr(document.querySelectorAll('#region-list .region-item')).forEach(itemName);
    }

    function dotSvg(body) { return `<svg class="x-map-dot" viewBox="0 0 26 20" aria-hidden="true">${body}</svg>`; }
    function symSvg(id, vb) { return `<svg class="x-map-sym" viewBox="${vb}" aria-hidden="true"><use href="#${id}"/></svg>`; }

    function provRow(p) {
        const keep = k => (p.getAttribute(k) ? ` ${k}="${p.getAttribute(k)}"` : '');
        // 描边用短虚线仿一下即可（东南海域那种Dasharray 在 24px 小块上会糊成一团）
        const stroke = p.getAttribute('stroke')
            ? ` stroke="${p.getAttribute('stroke')}"${keep('stroke-opacity')}${p.getAttribute('stroke-dasharray') ? ' stroke-dasharray="3 2"' : ''}`
            : ' stroke="#6b7280"';
        return `<li class="x-map-prov" data-prov="${nameOf(p)}" title="点一下看${nameOf(p)}州情">` +
            `<svg class="x-map-sw" viewBox="0 0 26 17" aria-hidden="true">` +
            `<rect x="0" y="0" width="26" height="17" rx="5" fill="url(#wmOcean)"/>` +
            `<rect x="1.5" y="1.5" width="23" height="14" rx="4"${keep('fill')}${keep('fill-opacity')}${stroke} stroke-width="1"/>` +
            `</svg><span>${nameOf(p)}</span></li>`;
    }

    function legendHtml() {
        const provs = provinces().map(provRow).join('');
        const nSect = svg.querySelectorAll('.map-sect').length;
        const nCity = svg.querySelectorAll('.map-city').length;
        return `<div class="x-map-legend-top">
            <span class="x-map-legend-h">📖 图例</span>
            <span class="x-map-now"></span>
        </div>
        <div class="x-map-cols">
            <div class="x-map-col x-map-pair">
                <p class="x-map-grp-h">州域色块（点了看州情）</p>
                <ul>${provs}</ul>
            </div>
            <div class="x-map-col">
                <p class="x-map-grp-h">图上点位</p>
                <ul>
                    <li>${dotSvg('<circle cx="13" cy="10" r="5" fill="#fbbf24"/>')}<span><b>金点</b>·州城</span></li>
                    <li>${dotSvg('<circle cx="13" cy="10" r="5" fill="#4ade80"/><circle cx="19" cy="14" r="3.4" fill="#d1d5db"/>')}<span><b>彩点/灰点</b>·大城与途经之地（共 ${nCity} 处）</span></li>
                    <li>${dotSvg('<circle cx="13" cy="10" r="6" fill="#a78bfa" stroke="#fff" stroke-width="2"/>')}<span><b>白环</b>·门派山门（${nSect} 处，名默认收起）</span></li>
                    <li>${dotSvg('<circle cx="13" cy="10" r="8" fill="none" stroke="#fbbf24" stroke-width="1.2" opacity="0.7"/><circle cx="13" cy="10" r="4" fill="#fbbf24" stroke="#fff" stroke-width="1.2"/>')}<span><b>金环</b>·你此刻在的州</span></li>
                    <li>🏯 / 🏠<span><b>小幡</b>·自家山门与洞府，点它一路回家</span></li>
                    <li>${dotSvg('<path d="M2 14 L24 4" stroke="#fbbf24" stroke-width="1.6" stroke-dasharray="4 3" fill="none"/>')}<span><b>金色虚线</b>·关隘商路与里数</span></li>
                </ul>
            </div>
            <div class="x-map-col x-map-pair">
                <p class="x-map-grp-h">地物符号</p>
                <ul>
                    <li title="北冥、蜀地的岭脊">${symSvg('wmMtnSnow', '-22 -14 44 26')}<span>雪山</span></li>
                    <li title="中州东缘与东荒的丘陵">${symSvg('wmMtnGreen', '-21 -11 42 22')}<span>青峦</span></li>
                    <li title="东荒与南疆的林海">${symSvg('wmPine', '-12 -15 24 26')}<span>松林</span></li>
                    <li title="西漠">${symSvg('wmDune', '-20 -10 40 20')}<span>沙丘</span></li>
                    <li title="九州之外">${symSvg('wmWave', '-14 -10 28 18')}<span>浪花</span></li>
                    <li title="南疆泽地">${symSvg('wmMarsh', '-13 -9 26 14')}<span>瘴泽</span></li>
                    <li title="北冥与中州上的云气">${symSvg('wmCloud', '-18 -10 36 14')}<span>祥云</span></li>
                </ul>
            </div>
        </div>`;
    }

    // 门派名开关与「🧭 路线标记」同住图上那一组（#map-tools）。
    // 以前它孤零零在下方图例表头，图例正文不得不写「本图例上方的『标出门派名』」来自指位置。
    function mountLabelToggle() {
        const tools = document.getElementById('map-tools');
        if (!tools || tools.querySelector('.x-map-toggle')) return;
        const nSect = svg.querySelectorAll('.map-sect').length;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'x-map-toggle';
        btn.setAttribute('aria-pressed', 'false');
        btn.title = '图上门派名太密，默认收起；开着时 ' + nSect + ' 个名字全标';
        btn.textContent = '🏷️ 门派名：关';
        btn.addEventListener('click', () => {
            const on = !panel.classList.contains(LABELS);
            panel.classList.toggle(LABELS, on);
            btn.setAttribute('aria-pressed', on ? 'true' : 'false');
            btn.textContent = '🏷️ 门派名：' + (on ? '开' : '关');
        });
        tools.appendChild(btn);
    }

    function say(bold, rest) {
        if (!nowLine) return;
        nowLine.textContent = '';
        const b = document.createElement('b');
        b.textContent = bold;
        nowLine.appendChild(b);
        nowLine.appendChild(document.createTextNode(rest));
    }

    function labelOf(node) {
        const t = node && node.querySelector ? node.querySelector('text') : null;
        return t ? (t.textContent || '').trim() : '';
    }

    function sync() {
        if (!svg) return;
        const ps = provinces();
        let sel = null;
        ps.forEach(p => { if (!sel && p.style.opacity === '1') sel = p; });
        if (!sel) ps.forEach(p => { if (!sel && GOLD.test((p.style.stroke || '').trim())) sel = p; });
        ps.forEach(p => p.classList.toggle(SEL, p === sel));
        svg.classList.toggle(HAS, !!sel);

        if (pin && !svg.contains(pin)) pin = null;
        const dots = arr(svg.querySelectorAll('.map-city, .map-sect'));
        if (!pin && !touched) {
            // 玩家还没点图时，跟随代码自己点亮的点：location-system 会把某个门派留成 opacity 1
            dots.forEach(n => { if (!pin && n.style.opacity === '1') pin = n; });
        }
        dots.forEach(n => n.classList.toggle(SEL, n === pin));

        const name = nameOf(sel);
        readNames();
        provRows.forEach(r => r.classList.toggle(SEL, !!name && r.getAttribute('data-prov') === name));
        arr(document.querySelectorAll('#region-list .region-item')).forEach(it => {
            it.classList.toggle(SEL, !!name && itemName(it) === name);
        });

        if (pin) {
            const kind = pin.classList.contains('map-sect') ? '门派' : '城市';
            say(`${labelOf(pin) || '未名'} · ${kind}`, (name ? `（${name}）` : '') + ' —— 已高亮，点别处即换');
        } else if (sel) {
            say(`${name} · 州域`, ' —— 图上套金环，左列同步行已亮');
        } else {
            say('未选中', ' —— 点图上州块 / 城市 / 门派，或点左列州名');
        }
    }

    function safeSync() { try { sync(); } catch (e) { /* 读数坏了也不能把点击与绘图带崩 */ } }

    function hover(name, on) {
        if (!name) return;
        provinces().forEach(p => { if (nameOf(p) === name) p.classList.toggle(HOVER, on); });
        provRows.forEach(r => { if (r.getAttribute('data-prov') === name) r.classList.toggle(HOVER, on); });
        arr(document.querySelectorAll('#region-list .region-item')).forEach(it => {
            if (itemName(it) === name) it.classList.toggle(HOVER, on);
        });
    }

    function clearDotMarks() {
        arr(svg.querySelectorAll('.map-city, .map-sect')).forEach(n => n.classList.remove(SEL));
    }

    function onMapClick(e) {
        const t = e.target && e.target.closest ? e.target.closest('.map-city, .map-sect') : null;
        touched = true;
        pin = t;
        clearDotMarks();
        if (t) t.classList.add(SEL);
        safeSync();
    }

    function provFrom(node) {
        const p = node && node.closest ? node.closest('[data-province]') : null;
        return p ? nameOf(p) : '';
    }

    function onOver(e) {
        const t = e.target && e.target.closest ? e.target : null;
        if (!t) return;
        // 停在城市/门派的圆点上时不牵连州块——圆点自己有放大/显名的反馈
        if (t.closest('.map-city, .map-sect')) return;
        const name = provFrom(t);
        if (name) hover(name, true);
    }
    function onOut(e) {
        if (!e.target || !e.target.closest) return;
        const name = provFrom(e.target);
        if (name) hover(name, false);
    }
    function onListOver(e) {
        const it = e.target && e.target.closest ? e.target.closest('.region-item') : null;
        if (it) hover(itemName(it), true);
    }
    function onListOut(e) {
        const it = e.target && e.target.closest ? e.target.closest('.region-item') : null;
        if (it) hover(itemName(it), false);
    }

    function build() {
        svg = $('world-map'); panel = $('panel-map');
        if (!svg || !panel || !svg.parentNode) return false;
        readNames();
        if (!$(LEGEND_ID)) {
            legend = document.createElement('div');
            legend.id = LEGEND_ID;
            legend.className = 'x-map-legend';
            legend.setAttribute('role', 'group');
            legend.setAttribute('aria-label', '九州舆图图例');
            legend.innerHTML = legendHtml();
            svg.parentNode.insertBefore(legend, svg.nextSibling);
            nowLine = legend.querySelector('.x-map-now');
            provRows = arr(legend.querySelectorAll('.x-map-prov'));
            provRows.forEach(r => {
                const n = r.getAttribute('data-prov');
                r.addEventListener('click', () => {
                    if (typeof window.selectProvince === 'function') window.selectProvince(n);
                });
                r.addEventListener('mouseenter', () => hover(n, true));
                r.addEventListener('mouseleave', () => hover(n, false));
            });
        } else {
            legend = $(LEGEND_ID);
            nowLine = legend.querySelector('.x-map-now');
            provRows = arr(legend.querySelectorAll('.x-map-prov'));
        }
        mountLabelToggle();

        // 只盯 style：app.js 每改一次描边/透明度就是一次选中动作，rAF 合帧防抖
        new MutationObserver(() => {
            if (queued) return;
            queued = true;
            (window.requestAnimationFrame || function (f) { setTimeout(f, 16); })(() => { queued = false; sync(); });
        }).observe(svg, { subtree: true, attributes: true, attributeFilter: ['style'] });
        svg.addEventListener('click', onMapClick);
        svg.addEventListener('mouseover', onOver);
        svg.addEventListener('mouseout', onOut);
        const rl = $('region-list');
        if (rl) {
            rl.addEventListener('mouseover', onListOver);
            rl.addEventListener('mouseout', onListOut);
            rl.addEventListener('click', readNames);
        }
        sync();
        return true;
    }

    // 图例是锦上添花：出错也不许拖累野外图的绘制
    try {
        if (!build() && document.addEventListener) {
            document.addEventListener('DOMContentLoaded', () => { try { build(); } catch (e) {} }, { once: true });
        }
    } catch (e) { /* 静默：宁可没图例，不能没地图 */ }
})();
