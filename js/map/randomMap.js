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
    '魔界': []
};

// 渡口（v20.59）：雇舟的船钱，以及水路上每格的行程
const FERRY_FARE = 5;
const FERRY_MIN_PER_CELL = 20;

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
    '魔界': { beast: ['血漠魔蛛', '骨原魈'], person: ['九幽修士'] }
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

// 冬天雪线/冻土赶路更慢：天寒地冻，脚下发僵
function seasonTravelMul(cell) {
    if (currentSeason() !== 'winter') return 1;
    const t = cell && cell.terrainKey;
    return (t === 'SNOW' || t === 'FROZEN') ? 1.15 : 1;
}

// ============ 环境之苦（v20.58）：险地不只是走得慢，还伤人 ============
// chance 为基础概率（每格）；夜里寒湿更凶，雨天瘴气更毒；修为高的人扛得住。
const TERRAIN_HAZARD = {
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
    BONEFIELD:  { id: 'demon',  name: '魔气', chance: 0.14, hp: 3, energy: 3, feel: '魔气顺着七窍往里钻，一阵恶心', hint: '骨原魔气蚀体，正道修士速离' }
};

function terrainHazard(cell) {
    const h = cell ? TERRAIN_HAZARD[cell.terrainKey] : null;
    if (!h) return null;
    let chance = h.chance;
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
    if (window.showMessage) {
        const tail = (window.currentCharData && (window.currentCharData.health || 0) <= 10) ? '（再撑下去要出人命，快寻个村镇打尖）' : '';
        window.showMessage(`🌫️ ${h.name}入体：${h.feel || '浑身不自在'}。${tail}`, 'warning');
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
    { t: ['WATER'], kind: 'herb', p: 0.02 },
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
            if (!rule || rng() >= rule.p) continue;
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
            if (t === 'ROAD') { personP = 0.05; beastP = 0.015; }
            if (nearPoi(x, y, 2)) personP *= 1.8;

            const roll = rng();
            if (roll < beastP) {
                if (typeof generateRandomEnemy !== 'function') continue;
                const level = 1 + Math.floor(rng() * 3);
                const beastData = generateRandomEnemy(level, 'beast');
                // 名字跟地皮走：沼泽出毒蟒，雪线出雪狼
                const beastName = pickFlavorName(habitatFlavor(c).beasts, rng) || beastData.name;
                c.entities.push(makeWildEntity({
                    kind: 'beast', name: beastName, symbol: '🐾', habitat: t, data: Object.assign({}, beastData, { name: beastName }),
                    uid: 'e_' + x + '_' + y + '_' + c.entities.length
                }));
            } else if (roll < beastP + personP) {
                if (typeof generateRandomEnemy !== 'function') continue;
                const level = 1 + Math.floor(rng() * 3);
                const enemyData = generateRandomEnemy(level);
                const physType = enemyData.physiologyType || 'humanoid';
                if (physType === 'undead' || physType === 'construct' || physType === 'elemental') {
                    // 亡灵/构装体/元素不是可攀谈的人
                    c.entities.push(makeWildEntity({
                        kind: 'beast', name: enemyData.name, symbol: '💀',
                        data: Object.assign({}, enemyData, { isMonster: true }),
                        uid: 'e_' + x + '_' + y + '_' + c.entities.length
                    }));
                } else {
                    const r2 = rng();
                    let personType = 'normal', symbol = '🧙', name = pickFlavorName(habitatFlavor(c).persons, rng) || enemyData.name;
                    if (!name) name = enemyData.name;
                    if (r2 < 0.25) { personType = 'merchant'; symbol = '🛒'; }
                    else if (r2 < 0.45) { personType = 'wanderer'; symbol = '🗡️'; }
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
        px: playerPos.x,
        py: playerPos.y
    };
}

function applyWildState(region) {
    if (!wildState.regions[region]) wildState.regions[region] = { fog: '', dead: {}, gathered: {}, visited: {}, px: 0, py: 0 };
    const st = wildState.regions[region];
    st.visited = st.visited || {};
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

    // 采集节点
    if (cell.node && cell.fog === 2 && cell.node.regrowDay <= currentDay()) {
        const badge = svgEl('text', { x: cx + size * 0.78, y: cy + size * 0.28, 'font-size': 11, 'text-anchor': 'middle' });
        badge.textContent = cell.node.icon;
        g.appendChild(badge);
    }

    svg.appendChild(g);
    return g;
}

const POI_COLORS = {
    town: '#fbbf24', market: '#f59e0b', cave: '#a1887f', ruin: '#94a3b8',
    landmark: '#e879f9', spring: '#22d3ee', resource: '#34d399', dungeon: '#a78bfa',
    ferry: '#38bdf8'
};

function drawPoi(svg, poi, size) {
    const row = currentMap[poi.y];
    const cell = row ? row[poi.x] : null;
    if (!cell || cell.fog === 0) return;
    const cx = poi.x * size + size / 2, cy = poi.y * size + size / 2;
    const color = POI_COLORS[poi.type] || '#e5e7eb';
    const g = svgEl('g', {});
    g.appendChild(svgEl('circle', { cx: cx, cy: cy, r: size * 0.30, fill: shadeColor(color, -70), opacity: cell.fog === 2 ? 0.75 : 0.45, stroke: color, 'stroke-width': 1.4 }));
    // 亲脚到过的：外圈加一道实线金环，图上一看便知这里来过
    if (poi.visited || poiIsVisited(poi.id)) {
        g.appendChild(svgEl('circle', { cx: cx, cy: cy, r: size * 0.38, fill: 'none', stroke: '#fde68a', 'stroke-width': 1.2, opacity: cell.fog === 2 ? 0.75 : 0.4 }));
    }
    if (poi.type === 'dungeon') g.appendChild(svgEl('circle', { cx: cx, cy: cy, r: size * 0.34, fill: 'none', stroke: color, 'stroke-width': 1, 'class': 'wild-pulse', opacity: 0.6 }));
    const icon = svgEl('text', { x: cx, y: cy + size * 0.13, 'font-size': size * 0.36, 'text-anchor': 'middle', opacity: cell.fog === 2 ? 1 : 0.6 });
    icon.textContent = poi.icon;
    g.appendChild(icon);
    if (cell.fog === 2) {
        const label = svgEl('text', { x: cx, y: cy - size * 0.36, 'font-size': 9, 'text-anchor': 'middle', fill: '#fde68a', opacity: 0.9 });
        label.textContent = poi.name;
        g.appendChild(label);
    } else if (poi.discovered) {
        // 走过的地方就算记不清，也还认得名字
        const label = svgEl('text', { x: cx, y: cy - size * 0.36, 'font-size': 8.5, 'text-anchor': 'middle', fill: '#9aa5b1', opacity: 0.6 });
        label.textContent = poi.name;
        g.appendChild(label);
    }
    svg.appendChild(g);
}

function drawEntities(svg, cell, x, y, size) {
    if (cell.fog !== 2 || !cell.entities.length) return;
    const alive = cell.entities.filter(e => !isEntityDead(e));
    const list = alive.length ? alive : cell.entities.slice(0, 1);
    for (let i = 0; i < Math.min(3, list.length); i++) {
        const e = list[i];
        const ex = x * size + size * (0.3 + i * 0.22), ey = y * size + size * 0.7;
        const t = svgEl('text', { x: ex, y: ey, 'font-size': size * 0.34, 'text-anchor': 'middle' });
        t.textContent = isEntityDead(e) ? '💀' : (e.symbol || '·');
        t.setAttribute('opacity', isEntityDead(e) ? 0.5 : 1);
        svg.appendChild(t);
    }
    if (alive.length > 3) {
        const b = svgEl('text', { x: x * size + size - 6, y: y * size + 12, 'font-size': 10, fill: '#fbbf24', 'text-anchor': 'middle', 'font-weight': 'bold' });
        b.textContent = '+' + (alive.length - 3);
        svg.appendChild(b);
    }
}

function drawPlayer(svg, size) {
    const cx = playerPos.x * size + size / 2, cy = playerPos.y * size + size / 2;
    const g = svgEl('g', { 'class': 'wild-player' });
    g.appendChild(svgEl('circle', { cx: cx, cy: cy, r: size * 0.26, fill: 'rgba(251,191,36,0.25)', filter: 'url(#wild-glow)' }));
    g.appendChild(svgEl('circle', { cx: cx, cy: cy, r: size * 0.17, fill: '#fbbf24', stroke: '#fff', 'stroke-width': 1.6 }));
    const t = svgEl('text', { x: cx, y: cy + size * 0.07, 'font-size': size * 0.17, 'text-anchor': 'middle', 'font-weight': 'bold', fill: '#3b2f0b' });
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

// ============ 舆图题跋（v20.57）：图名 / 小印 / 罗盘 / 边框 ============
// 全是描景，不接点击；一张图打开就有「这是一张画」的样子。
// 注意：边框一律用 path 画，不用带描边的 rect——「方块零描边」是格线门禁。
function framePathD(x, y, w, h) { return `M${x} ${y} H${x + w} V${y + h} H${x} Z`; }

function drawMapDress(svg, w, h, ox, oy) {
    const g = svgEl('g', { 'pointer-events': 'none' });
    // 边框：外粗内细两道
    g.appendChild(svgEl('path', { d: framePathD(ox + 1.5, oy + 1.5, w - 3, h - 3), fill: 'none', stroke: '#caa96a', 'stroke-width': 2, opacity: 0.5 }));
    g.appendChild(svgEl('path', { d: framePathD(ox + 6, oy + 6, w - 12, h - 12), fill: 'none', stroke: '#caa96a', 'stroke-width': 0.8, opacity: 0.3 }));

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
    const north = svgEl('text', { x: cx, y: cy - r - 3, 'font-size': 9, 'text-anchor': 'middle', fill: '#f3e3c0', opacity: 0.9 });
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
            g.addEventListener('click', () => onCellClick(x, y));
            g.addEventListener('contextmenu', (ev) => { ev.preventDefault(); onCellInspect(x, y); });
            if (cell.fog === 0) {
                g.appendChild(svgEl('rect', { x: x * size, y: y * size, width: size, height: size, fill: '#0d1017', opacity: 0.92 }));
            } else if (cell.fog === 1) {
                g.appendChild(svgEl('rect', { x: x * size, y: y * size, width: size, height: size, fill: '#0b1020', opacity: 0.4 }));
            }
            drawEntities(svg, cell, x, y, size);
        }
    }

    currentPois.forEach(p => drawPoi(svg, p, size));
    drawPathPreview(svg, size);
    drawPlayer(svg, size);
    drawWildDrift(svg, size);
    // 铺满整窗的天色与题跋：窗开在哪，它们就得铺在哪
    drawTimeWeatherOverlay(svg, MAP_CONFIG.VIEWPORT_COLS * size, MAP_CONFIG.VIEWPORT_ROWS * size, startX * size, startY * size);
    drawMapDress(svg, MAP_CONFIG.VIEWPORT_COLS * size, MAP_CONFIG.VIEWPORT_ROWS * size, startX * size, startY * size);

    updateInfo();
    updateMinimap();
    renderWildSidebar();
    saveWildState();
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
        const poiTitle = poi ? (poi.icon + ' ' + poi.name + (poi.variantName ? '·' + poi.variantName : '')) : cell.terrain.name;
        info.innerHTML =
            `<div class="font-bold text-yellow-400">${poiTitle}</div>` +
            (poi && poi.variant && poi.variant.desc ? `<div class="text-gray-500 mt-0.5">${poi.variant.desc}</div>` : '') +
            `<div class="text-gray-400 mt-0.5">灵气 ${cell.qi.toFixed(2)} · ${isNightNow() ? '夜色已深' : '白日可行'}${cell.node ? (nodeReady ? ' · 有可采之物' : ' · 已采光，还要 ' + (cell.node.regrowDay - currentDay()) + ' 日再生') : ''}</div>` +
            (hz ? `<div class="text-amber-500/90 mt-0.5">⚠️ ${hz.hint}</div>` : '');
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

    // 出此境往（v20.63）：九州接壤才走得过去，关隘里数先说清
    if (window.WorldMap && typeof window.WorldMap.renderExits === 'function') window.WorldMap.renderExits();

    // 图例
    const legend = document.getElementById('wild-legend');
    if (legend) {
        const keys = ['PLAIN', 'FOREST', 'MOUNTAIN', 'WATER', 'ROAD', 'SPRING'];
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
        }
        if (poi.type === 'market') out.push({ act: 'shop', label: '🛒 逛' + (poi.variantName || '坊市'), primary: true });
        if (poi.type === 'cave') out.push({ act: 'cultivate', label: '🧘 入' + (poi.variantName || '洞') + '修炼', primary: true });
        if (poi.type === 'ruin') out.push({ act: 'explore', label: '🔍 探' + (poi.variantName || '遗迹') + '「' + poi.name + '」', primary: true });
        if (poi.type === 'landmark') out.push({ act: 'explore', label: '🔍 探索「' + poi.name + '」', primary: true });
        if (poi.type === 'spring') out.push({ act: 'spring', label: '⛲ 在' + (poi.variantName || '灵泉') + '汲灵（两个时辰）', primary: true });
        if (poi.type === 'resource') out.push({ act: 'harvest', label: '⛏️ 采撷「' + poi.name + '」', primary: true });
        if (poi.type === 'dungeon') out.push({ act: 'dungeon', label: '🌀 进入「' + poi.name + '」', primary: true });
        if (poi.type === 'ferry') out.push({ act: 'ferry', label: '⛴️ 雇舟渡水（灵石 ' + FERRY_FARE + '）', primary: true });
    }
    out.push({ act: 'meditate', label: '🌬️ 就地打坐（一个时辰）' });
    return out;
}

// ============ 交互 ============
function onCellInspect(x, y) {
    const row = currentMap[y];
    const cell = row ? row[x] : null;
    if (!cell) return;
    if (cell.fog === 0) { showMessage('那一片还未踏足，雾里看不真切。', 'info'); return; }
    const names = (cell.entities || []).filter(e => !isEntityDead(e)).map(e => `${e.symbol}${e.name || ''}`);
    showMessage(`【${cell.terrain.name}】灵气 ${cell.qi.toFixed(2)}${names.length ? ' · ' + names.join('、') : ''}`, 'info');
}

function onCellClick(x, y) {
    const row = currentMap[y];
    const cell = row ? row[x] : null;
    if (!cell) return;
    if (cell.fog === 0) { showMessage('那一片还未踏足，先走近些。', 'info'); return; }
    const dist = Math.abs(x - playerPos.x) + Math.abs(y - playerPos.y);
    if (dist === 0) { onCellInspect(x, y); return; }
    const res = WildTerrain.findPath(currentMap.map(r => r.map(c => ({ t: c.terrainKey }))), { x: playerPos.x, y: playerPos.y }, { x: x, y: y });
    if (!res) { showMessage('那边过不去。', 'warning'); return; }
    if (res.path.length === 1) { stepTo(x, y); wildTravel = null; return; }
    wildTravel = { path: res.path, cost: res.cost, targetName: (cell.poiId ? ((currentPois.find(p => p.id === cell.poiId) || {}).name) : null) || cell.terrain.name };
    renderMap(mapContainer, currentMap, viewportOffset.x, viewportOffset.y);
}

function centerViewport() {
    viewportOffset = {
        x: Math.max(0, Math.min(playerPos.x - Math.floor(MAP_CONFIG.VIEWPORT_COLS / 2), MAP_CONFIG.COLS - MAP_CONFIG.VIEWPORT_COLS)),
        y: Math.max(0, Math.min(playerPos.y - Math.floor(MAP_CONFIG.VIEWPORT_ROWS / 2), MAP_CONFIG.ROWS - MAP_CONFIG.VIEWPORT_ROWS))
    };
}

// 走一格：结时间、开雾、可能撞上事
function stepTo(x, y) {
    const row = currentMap[y];
    const cell = row ? row[x] : null;
    if (!cell || !WildTerrain.passable({ t: cell.terrainKey })) {
        showMessage(cell && cell.terrainKey === 'WATER' ? '水深流急，过去不得。' : '过不去。', 'warning');
        return false;
    }
    const cost = (cell.terrain.moveCost || 1) * 10 * weatherTravelMul() * seasonTravelMul(cell);
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(Math.round(cost), '野外赶路');
    }
    if ((cell.terrain.moveCost || 1) >= 2 && window.currentCharData) {
        window.currentCharData.energy = Math.max(0, (window.currentCharData.energy || 100) - 1);
    }
    playerPos = { x: x, y: y };
    window.playerPos = playerPos;
    centerViewport();
    revealAround(x, y);
    if (cell.poiId) markPoiVisited(cell.poiId);
    applyTerrainHazard(cell);

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

    renderMap(mapContainer, currentMap, viewportOffset.x, viewportOffset.y);
    if (typeof updateEntityMenu === 'function') updateEntityMenu();
    return true;
}

// 途中遭遇：夜行与恶劣天象更凶；撞上什么由脚下地皮说了算
// overrideCell：水路等场合用假想地皮结账（人还没到对岸，水里的事先算）
function rollWildEncounter(overrideCell) {
    let p = 0.05;
    if (isNightNow()) p += 0.06;
    const w = currentWeatherObj();
    if (w && (w.id === 'stormy' || w.id === 'foggy')) p += 0.02;
    if (Math.random() >= p) return false;
    if (typeof generateRandomEnemy !== 'function') return false;
    const prow = currentMap[playerPos.y];
    const cell = overrideCell || (prow ? prow[playerPos.x] : null);
    const t = cell ? cell.terrainKey : 'PLAIN';
    // 道上多遇人，水里必是活物，其余地方多半是兽
    let wantBeast = Math.random() < 0.6;
    if (t === 'ROAD') wantBeast = Math.random() < 0.3;
    if (t === 'WATER' || t === 'FORD' || t === 'SWAMP' || t === 'VOLCANO') wantBeast = true;
    const tier = 1 + Math.floor(Math.random() * 3);
    const foe = generateRandomEnemy(tier, wantBeast ? 'beast' : 'enemy');
    const flavor = habitatFlavor(cell);
    const name = pickFlavorName(wantBeast ? flavor.beasts : flavor.persons);
    if (name) foe.name = name;
    const where = cell ? ((cell.terrain && cell.terrain.name) || (WildTerrain.TERRAIN[cell.terrainKey] || {}).name || '') : '';
    if (window.showMessage) window.showMessage(`⚠️ ${where ? where + '里' : '途中'}撞上${foe.name || '不速之客'}！`, 'warning');
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
    const bonus = (typeof window.getWeatherGatheringBonus === 'function') ? window.getWeatherGatheringBonus() : 1;
    const got = [];
    cell.node.items.forEach(id => {
        const n = Math.max(1, Math.round((1 + Math.random()) * bonus));
        if (typeof window.addItemToInventory === 'function') { window.addItemToInventory(id, n); got.push({ id: id, n: n }); }
    });
    cell.node.regrowDay = currentDay() + 3 + Math.floor(Math.random() * 4);
    if (window.showMessage) {
        const kind = NODE_KIND_NAMES[cell.node.kind] || '药草';
        window.showMessage(`🌿 采得 ${lootText(got, kind)}${bonus > 1.1 ? '（天象帮忙，收成不错）' : bonus < 0.9 ? '（天象不作美，收成打折）' : ''}`, 'success');
    }
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
    advanceWildTime(cost * 60, '客栈打尖');
    if (rich) {
        healChar(v ? v.rest.hp : 25, v ? v.rest.en : 40, v ? v.rest.qi : 10);
        showMessage(`🛏️ 在${poi && poi.variantName ? poi.variantName : '客栈'}歇了一觉，气血精力都回了些。${fare ? '（灵石 ' + fare + '）' : '（没花钱）'}`, 'success');
    } else {
        healChar(Math.round((v ? v.rest.hp : 25) * 0.4), Math.round((v ? v.rest.en : 40) * 0.45), 0);
        showMessage('🛏️ 灵石不够，在柴房凑合了一夜。睡得一般。', 'info');
    }
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
    if (typeof window.openCityShop === 'function') window.openCityShop('general');
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

function meditateWild() {
    const row = currentMap[playerPos.y];
    const cell = row ? row[playerPos.x] : null;
    const qi = cell ? cell.qi : 1;
    advanceWildTime(60, '野外打坐');
    if (window.currentCharData) window.currentCharData.energy = Math.max(0, (window.currentCharData.energy || 100) - 4);
    const gain = Math.round(8 * qi);
    healChar(0, 0, gain);
    if (isNightNow() && rollWildEncounter()) { renderWildSidebar(); return; }
    showMessage(`🌬️ 吐纳一个时辰，此地灵气${qi >= 1.5 ? '充沛' : qi >= 1.0 ? '平和' : '稀薄'}，真气回复 ${gain}。`, 'success');
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

function exploreWildRuin(poi) {
    // 有名有姓的地标走探索系统；无名遗迹按它的来历结账
    if (poi.type === 'landmark' && typeof window.exploreLandmark === 'function') {
        advanceWildTime(90, '探索地标');
        window.exploreLandmark(poi.refId || poi.name);
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
    advanceWildTime(120, '采撷产地');
    if (point.ownerSect && point.ownerSect === mySect) {
        const res = window.ResourcePoints.harvest(poi.refId);
        if (res && res.ok) {
            const out = res.output || {};
            const parts = Object.keys(out).map(k => ({ id: k, n: out[k] }));
            Object.keys(out).forEach(k => { if (typeof window.addItemToInventory === 'function') window.addItemToInventory(k, out[k]); });
            showMessage(`⛏️ 以本门名义采撷，得 ${lootText(parts, '出产')}。`, 'success');
        } else {
            showMessage('⛏️ 这处产地本季已经采空了，等它缓缓。', 'info');
        }
    } else {
        // 不是自家的：暗采有代价
        if (Math.random() < 0.4) {
            const guard = (typeof generateRandomEnemy === 'function') ? generateRandomEnemy(3, 'enemy') : null;
            showMessage(`⛏️ 你动手暗采，被${point.ownerSect ? point.ownerSect + '的' : ''}看守当场撞见！`, 'warning');
            if (guard) { window.currentInteractionEntity = guard; if (typeof window.openBattleWithEntity === 'function') window.openBattleWithEntity(guard); }
        } else {
            const out = window.ResourcePoints.calcYield(point) || {};
            const keys = Object.keys(out).slice(0, 2);
            keys.forEach(k => { if (typeof window.addItemToInventory === 'function') window.addItemToInventory(k, Math.max(1, Math.floor(out[k] / 2))); });
            const half = keys.map(k => ({ id: k, n: Math.max(1, Math.floor(out[k] / 2)) }));
            showMessage(keys.length ? `⛏️ 趁无人捞了一把：${lootText(half, '出产')}。` : '⛏️ 什么都没捞着。', 'success');
        }
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
        case 'meditate': meditateWild(); break;
    }
    if (typeof updateEntityMenu === 'function') updateEntityMenu();
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
    '北冥': '朔风皮货队', '蜀地': '剑门盐队', '东南海域': '渔火船帮', '灵界': '云阶仙货行', '魔界': '骨原鬼市队'
};

// 巡查挂谁的旗：自家门派的弟子巡值，没入宗就是地方上的散修巡值
const PATROL_NAMES = {
    '中州': '洛北巡值', '东荒': '青木巡值', '南疆': '五仙教巡值', '西漠': '金城巡值',
    '北冥': '朔风巡值', '蜀地': '剑门巡值', '东南海域': '渔火巡值', '灵界': '云阶巡值', '魔界': '九幽巡值'
};

// 天象云影：一地一样的天，而且它会自己走过来
const DRIFT_SPECS = {
    '西漠':   { name: '沙暴', icon: '🌪️', tint: '#d8b26a', op: 0.22, w: 4, h: 2, harm: [1, 5, 0], msg: '沙暴的云影压过来，天黄了半边，沙粒打在脸上生疼。' },
    '南疆':   { name: '瘴云', icon: '🌫️', tint: '#7a8a3a', op: 0.24, w: 3, h: 2, harm: [2, 4, 0], msg: '一团瘴云慢悠悠飘过来，草木都蔫了下去。' },
    '北冥':   { name: '风雪', icon: '🌨️', tint: '#dfeaf2', op: 0.26, w: 4, h: 3, harm: [0, 5, 3], msg: '风雪像一堵墙推过来，眉毛上都结了霜。' },
    '魔界':   { name: '魔雾', icon: '🌑', tint: '#7a2a2a', op: 0.24, w: 3, h: 3, harm: [3, 3, 2], msg: '魔雾贴着地皮爬过来，骨头缝里往外冒凉气。' },
    '东南海域': { name: '海雾', icon: '🌫️', tint: '#9ec8e8', op: 0.22, w: 4, h: 2, harm: [0, 3, 0], msg: '海雾漫上来，三步开外就看不清了。' }
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
    function pickRoadCell() {
        for (let i = 0; i < 30; i++) {
            const c = roads[Math.floor(rng() * roads.length)];
            if (!c || used[c.x + ',' + c.y]) continue;
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

// ---- 每走一步，野外也动一步。视野外的懒得算（省性能，也免得全图乱爬） ----
function tickWildLife() {
    wildContactBand = null;
    if (!currentMap.length) return;
    wildBands.forEach(band => {
        if (band.cool > 0) band.cool--;
        const head = band.members.find(m => !isEntityDead(m));
        if (!head) return;
        const d = Math.max(Math.abs(head.x - playerPos.x), Math.abs(head.y - playerPos.y));
        if (d > 9) return;
        if (Math.random() > WANDER_KINDS[band.kind].speed) return;
        moveBand(band);
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
        if (!cell || !bandCanStand(cell, band)) continue;
        if (nx === playerPos.x && ny === playerPos.y) { target = cell; break; }   // 可以撞上人
        if (kind.strict && cell.terrainKey !== 'ROAD') continue;                  // 商队巡查只认古道
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
                if (c && bandCanStand(c, band) && dests.indexOf(c) < 0 && (c.x !== playerPos.x || c.y !== playerPos.y)) dest = c;
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
    const label = svgEl('text', { x: lx, y: ly, 'font-size': 11, fill: s.tint, opacity: 0.95, 'pointer-events': 'none' });
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
    el.innerHTML = rows.length
        ? rows.sort((a, b) => a.d - b.d).map(r =>
            '<div class="flex justify-between items-center bg-gray-800/60 px-2 py-1 rounded border border-gray-700">' +
            '<span class="text-xs ' + r.cls + '">' + r.icon + ' ' + r.name + '</span>' +
            '<span class="text-[10px] ' + (r.hot ? 'text-red-400' : 'text-gray-500') + '">' + r.pos + '</span></div>').join('')
        : '<p class="text-xs text-gray-500 text-center">四野安静，什么动静都没有。</p>';
}

// ============ 野兽主动追击 ============
function isEntityDead(e) {
    if (!e) return true;
    if (e.isDead || e.isCorpse) return true;
    if (typeof e.hp === 'number' && e.hp <= 0) return true;
    return false;
}

function tryBeastAmbush() {
    if (!currentMap || !playerPos) return false;
    const dirs = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
    for (const d of dirs) {
        const nx = playerPos.x + d.x, ny = playerPos.y + d.y;
        const nrow = currentMap[ny];
        const ncell = nrow ? nrow[nx] : null;
        if (!ncell || !ncell.entities) continue;
        const beastIdx = ncell.entities.findIndex(e => e.type === 'beast' && !isEntityDead(e));
        if (beastIdx < 0) continue;
        let chance = 0.3;
        if (isNightNow()) chance += 0.15;
        if (Math.random() >= chance) continue;

        const beast = ncell.entities.splice(beastIdx, 1)[0];
        const cur = currentMap[playerPos.y][playerPos.x];
        cur.entities = cur.entities || [];
        cur.entities.push(beast);
        cur.fog = 2;

        if (window.showMessage) window.showMessage(`⚠️ ${beast.name || '野兽'}向你扑来！`, 'warning');

        window.currentInteractionEntity = beast;
        if (typeof window.openBattleWithEntity === 'function') window.openBattleWithEntity(beast);
        renderMap(mapContainer, currentMap, viewportOffset.x, viewportOffset.y);
        return true;
    }
    return false;
}

// ============ 信息栏 ============
function updateInfo() {
    const infoDiv = document.getElementById('map-info');
    if (!infoDiv || !currentMap.length) return;
    const row = currentMap[playerPos.y];
    const cell = row ? row[playerPos.x] : null;
    const terrainName = cell ? cell.terrain.name : '未知';
    const entityCount = cell && cell.entities ? cell.entities.filter(e => !isEntityDead(e)).length : 0;
    infoDiv.textContent = `📍 ${currentRegionForMap || ''} 野外 · ${terrainName} · 灵气 ${cell ? cell.qi.toFixed(2) : '-'} · 此地 ${entityCount} 人/兽`;
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
    const section = document.getElementById('random-map-section');
    if (section) section.classList.remove('hidden');

    const titleEl = document.getElementById('random-map-title');
    if (titleEl) titleEl.textContent = '📍 ' + regionName + ' · 野外';

    const leftSidebar = document.querySelector('.lg\\:w-64');
    if (leftSidebar) { leftSidebar._savedDisplay = leftSidebar.style.display; leftSidebar.style.display = 'none'; }
    const md = document.getElementById('map-detail');
    if (md) md.classList.add('hidden');
    const sd = document.getElementById('sect-detail');
    if (sd) sd.classList.add('hidden');

    initRandomMap('random-map-svg', regionName);
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

// 一域一图之后，「重新生成」不再有意义：重开会回到同一片山河
function regenerateMap() {
    showMessage('🗺️ 这片山河不会自己变样——山还是那座山，走过的路还认得。只是路上的人兽，未必还是昨天那一批。', 'info');
}

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
        else if (act === 'world-exit' && window.WorldMap) window.WorldMap.setOut(target.getAttribute('data-exit'));
        else poiAction(act);
    });
}

// ============ 对外暴露 ============
window.initRandomMap = initRandomMap;
window.travelToRegion = travelToRegion;
window.regenerateMap = regenerateMap;
window.closeRandomMap = closeRandomMap;
window.openWildernessMap = openWildernessMap;
window.openCityUI = function (cityName) {
    if (window.locationSystem && window.locationSystem.travelToCity) window.locationSystem.travelToCity(cityName);
};
window.getCurrentCellEntities = getCurrentCellEntities;
window.tryBeastAmbush = tryBeastAmbush;
window.isEntityDead = isEntityDead;
window.renderMap = renderMap;
window.onCellClick = onCellClick;
window.buildWildMap = buildWildMap;
window.saveWildState = saveWildState;
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
    poiIsVisited: poiIsVisited,
    ground: WildGround,
    variants: function () { return POI_VARIANTS; },
    life: {
        bands: function () { return wildBands; },
        drift: function () { return wildDrift; },
        kinds: WANDER_KINDS,
        tick: tickWildLife,
        contact: function (i) { const b = wildBands[i]; return b ? checkBandContact(b) : false; },
        seed: seedWildLife,
        prune: pruneWildBands,
        inDrift: playerInDrift
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
