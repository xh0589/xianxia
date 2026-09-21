/**
 * xianxia-map-markers.js - 地标名录 + 任务目标指路
 * v35 大裁剪：旧版是从别处移植的「地图标记系统」——26 个预设标记挂在凭空坐标上，
 * 渲染容器在 HTML 里根本不存在，解锁门禁读的全局状态变量全项目无人定义，
 * 整套是一页渲染不出来的假图。本版裁掉全部假标记，只留两样真的：
 *   一、LANDMARKS 地标名录（randomMap 建图取它落 POI，landmark-explore 取它对名字）
 *   二、任务目标指路：接取/交付任务时记下 visit 目标，野外图按名字对上真实 POI，
 *       侧栏给方位（questPoiHints）、图上挂 🎯（questTargetForPoi）
 */

// 确保gameLog存在
if (typeof window !== 'undefined' && !window.gameLog) {
    window.gameLog = {
        entries: [],
        add: function(msg, type) { console.log(`[${type}] ${msg}`); }
    };
}

// ==================== 地标名录 ====================
// 字段只留真有人读的：name（对名）/ region（落哪域）/ icon（图上画啥）/ type（灵泉地标偏好地形）/ desc（介绍文案）
const LANDMARKS = {
    'ancient_sword_peak': { name: '古剑峰', region: '蜀地', type: 'cultivation_spot', icon: '🗡️', desc: '传说上古剑仙在此悟道，剑意残留' },
    'dragon_vein': { name: '龙脉', region: '中州', type: 'qi_spot', icon: '🐉', desc: '地底龙脉汇聚之处，灵气充沛' },
    'soul_temple': { name: '魂殿遗迹', region: '南疆', type: 'ruin', icon: '💀', desc: '上古魂道宗门遗址，传闻有灵魂秘法' },
    'ice_abyss': { name: '寒冰深渊', region: '北冥', type: 'cultivation_spot', icon: '❄️', desc: '万年寒冰形成的深渊，冰系修炼圣地' },
    'thunder_peak': { name: '雷音峰', region: '东荒', type: 'cultivation_spot', icon: '⚡', desc: '常年雷云笼罩，雷系修炼者的天堂' },
    'mirage_oasis': { name: '幻海绿洲', region: '西漠', type: 'special', icon: '🏝️', desc: '沙漠中的幻术绿洲，机缘与危险并存' },
    'heavenly_pool': { name: '天池', region: '东南海域', type: 'healing_spot', icon: '🏞️', desc: '海外仙山天池，洗涤凡躯的圣水' },
    'sword_grave': { name: '剑冢', region: '蜀地', type: 'treasure_spot', icon: '⚔️', desc: '历代剑修埋剑之地，可寻得名剑' },
    'spirit_well': { name: '灵泉古井', region: '中州', type: 'body_training', icon: '⛲', desc: '深藏帝都地下的灵泉古井，淬体圣品' },
    'demon_abyss': { name: '魔渊裂隙', region: '南疆', type: 'danger_zone', icon: '👹', desc: '魔界与人间的裂隙，高阶魔物出没' },
    'phoenix_nest': { name: '凤凰巢', region: '南疆', type: 'treasure_spot', icon: '🦅', desc: '凤凰涅槃之地，火系至宝产地' },
    'ancient_battlefield': { name: '上古战场', region: '西漠', type: 'ruin', icon: '💀', desc: '上古仙魔大战遗址，埋藏无数宝物' }
};

// ==================== 任务目标指路（v12.4 联动保留，v35 落到真地图） ====================
// 任务数据的目标字段为 objectives[]（type='visit' 时含 location/locationName/locationId 文本），
// 多数任务只有文本目标、无地图坐标——按名称与野外图真实 POI 模糊匹配，
// 匹配不到就跳过（不报错），只有可定位的任务才会显示 🎯。

// 进行中任务的未完成 visit 目标：[{ qid, title, locName }]
function activeVisitTargets() {
    const out = [];
    try {
        // quest-system 里 playerQuestProgress 是顶层 let——不在 window 上，须按裸名取
        const progress = (typeof playerQuestProgress !== 'undefined' && playerQuestProgress)
            ? playerQuestProgress : (window.playerQuestProgress || null);
        if (!progress || !Array.isArray(progress.activeQuests)) return out;
        progress.activeQuests.forEach(function (qid) {
            const quest = (window.QuestRegistry && typeof window.QuestRegistry.get === 'function')
                ? window.QuestRegistry.get(qid) : null;
            if (!quest || !Array.isArray(quest.objectives)) return;
            quest.objectives.forEach(function (obj) {
                if (!obj || obj.type !== 'visit' || obj.completed) return;
                const locName = obj.locationName || obj.location || obj.locationId || null;
                if (!locName) return;
                out.push({ qid: qid, title: quest.title || qid, locName: String(locName) });
            });
        });
    } catch (e) {}
    return out;
}

// 名字对得上吗：精确 → 互相包含（「魂殿遗迹」对「魂殿」、「云顶坊市」对「坊市」都算）
function nameMatches(poiName, locName) {
    if (!poiName || !locName) return false;
    return poiName === locName || poiName.indexOf(locName) >= 0 || locName.indexOf(poiName) >= 0;
}

// 某处 POI 是不是进行中任务的目标（侧栏与图上 🎯 都问它）
function questTargetForPoi(poiName) {
    const targets = activeVisitTargets();
    for (let i = 0; i < targets.length; i++) {
        if (nameMatches(poiName, targets[i].locName)) return targets[i];
    }
    return null;
}

// 本图 POI 里能对上任务目标的：[{ poi, title, qid, locName }]（按 POI 去重）
function questPoiHints(pois) {
    const out = [];
    if (!Array.isArray(pois) || !pois.length) return out;
    const targets = activeVisitTargets();
    if (!targets.length) return out;
    const seen = {};
    pois.forEach(function (p) {
        if (!p || !p.name || seen[p.id]) return;
        for (let i = 0; i < targets.length; i++) {
            if (nameMatches(p.name, targets[i].locName)) {
                seen[p.id] = true;
                out.push({ poi: p, title: targets[i].title, qid: targets[i].qid, locName: targets[i].locName });
                break;
            }
        }
    });
    return out;
}

// quest-system 接取/交付时会调这两个——保留出口，指路账每次现算，无需缓存可失同步
function syncQuestTargetMarkers() { /* 指路账由 questPoiHints 现算，这里只留兼容出口 */ }
function removeQuestTargetMarkers(questId) { /* 同上：交付后 activeQuests 已除名，现算自然不再指它 */ }

// ==================== 初始化 ====================
function initMapMarkers() {
    if (window.gameLog) window.gameLog.add('地标名录与任务指路就绪', 'info');
}

// ==================== 导出 ====================
if (typeof window !== 'undefined') {
    window.LANDMARKS = LANDMARKS;
    window.initMapMarkers = initMapMarkers;
    window.questTargetForPoi = questTargetForPoi;
    window.questPoiHints = questPoiHints;
    window.syncQuestTargetMarkers = syncQuestTargetMarkers;
    window.removeQuestTargetMarkers = removeQuestTargetMarkers;
}
