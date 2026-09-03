// ==================== sect-resource-actions.js - 门派地标建筑可交互功能 v1.0 ====================
// 依赖：sects/sects-deep-data.js（SECT_DEEP_DATA.specialResources）
//       cultivation/breakthrough-system.js（cultivateQi/addEssence）
//       sects/sect-facilities.js（openSectLibraryPanel）
//       crafting.js（openCraftingUI）、inventory.js（addItem）、time-system.js（advanceTime）
// 加载顺序：在 sects-deep-data.js 之后
//
// 设计宪法：建筑使用的约束来自世界本身——精力、真气、时间。
//   不设"每日N次"配额，不引入人为计数器。
//   - 修炼类：耗费精力+时辰，产出真元（建筑 output 越高，圣地加成越高）
//   - 采集类：耗费时辰+真气，产出灵药/矿石（时辰是真约束，一天能做的时辰有限）
//   - 藏经/炼丹/锻造类：直接接入既有玩法面板（其内部已有真实成本与门禁）

// ============ 灵药 / 矿石 产出池（按稀有度加权） ============
var _HERB_POOL = [
    { id: 'mat_liquorice', weight: 30 },
    { id: 'mat_scutellaria', weight: 25 },
    { id: 'mat_lingzhi', weight: 18 },
    { id: 'mat_ginseng', weight: 12 },
    { id: 'mat_snow_lotus', weight: 8 },
    { id: 'mat_he_shou_wu', weight: 5 },
    { id: 'mat_dragon_saliva', weight: 1.5 },
    { id: 'mat_phoenix_blood_grass', weight: 0.5 }
];
var _ORE_POOL = [
    { id: 'mat_iron_ore', weight: 30 },
    { id: 'mat_copper_ore', weight: 25 },
    { id: 'mat_tin_ore', weight: 20 },
    { id: 'mat_refined_iron', weight: 12 },
    { id: 'mat_dark_iron', weight: 7 },
    { id: 'mat_cold_iron', weight: 3 },
    { id: 'mat_fire_crystal', weight: 2 },
    { id: 'mat_mithril', weight: 1 }
];

function _rollFromPool(pool, luckMul) {
    // luckMul（由建筑 output 折算）抬高稀有产出概率
    var adjusted = [];
    var total = 0;
    for (var i = 0; i < pool.length; i++) {
        var w = pool[i].weight;
        // 稀有项（weight<10）受 luck 加成，普通项（weight>=10）略降，保证不崩产出
        if (w < 10) w = w * (1 + (luckMul - 1) * 1.5);
        else w = w / luckMul;
        adjusted.push({ id: pool[i].id, w: w });
        total += w;
    }
    var r = Math.random() * total;
    for (var j = 0; j < adjusted.length; j++) {
        r -= adjusted[j].w;
        if (r <= 0) return adjusted[j].id;
    }
    return adjusted[0].id;
}

// ============ 建筑类型 → 按钮文案 ============
var _RESOURCE_ACTION_LABELS = {
    training: '🧘 在此修炼',
    knowledge: '📚 翻阅典籍',
    culture: '📚 研读藏书',
    alchemy: '⚗️ 入丹房炼药',
    forge: '🔨 入炉锻造',
    herb: '🌿 采集灵药',
    mine: '⛏️ 开采矿石',
    explore: '🔍 探索一番'
};
function _sectResourceActionLabel(type) {
    return _RESOURCE_ACTION_LABELS[type] || '';
}

// ============ 主入口：使用门派地标建筑 ============
function useSectResource(sectName, resourceId) {
    var ds = window.discipleState || {};
    if (!ds.isInSect || ds.sectId !== sectName) {
        if (window.showMessage) window.showMessage('唯有本门弟子方可踏足此处。', 'warning');
        return false;
    }
    var data = window.SECT_DEEP_DATA && window.SECT_DEEP_DATA[sectName];
    if (!data || !data.specialResources) {
        if (window.showMessage) window.showMessage('此处无可使用的设施。', 'info');
        return false;
    }
    var res = null;
    for (var i = 0; i < data.specialResources.length; i++) {
        if (data.specialResources[i].id === resourceId) { res = data.specialResources[i]; break; }
    }
    if (!res) return false;

    var cd = window.currentCharData;
    if (!cd) {
        if (window.showMessage) window.showMessage('请先创建角色。', 'warning');
        return false;
    }

    switch (res.type) {
        case 'training':
            return _trainAtResource(res, sectName);
        case 'knowledge':
        case 'culture':
            return _routeLibrary(res, sectName);
        case 'alchemy':
            return _routeCrafting(res, 'pilfer');
        case 'forge':
            return _routeCrafting(res, 'forging');
        case 'herb':
            return _gatherHerbs(res);
        case 'mine':
            return _gatherOre(res);
        case 'explore':
            return _exploreArea(res);
        default:
            // formation/military/storage/torture/intel/craft/personal/affection 等
            if (window.showMessage) window.showMessage('【' + res.name + '】' + (res.desc || '') + '（此处暂无可执行的动作，留待日后机缘。）', 'info');
            return false;
    }
}

// ---- 修炼类：圣地加成的 cultivateQi ----
function _trainAtResource(res, sectName) {
    if (typeof window.cultivateQi !== 'function') {
        if (window.showMessage) window.showMessage('修炼之法尚未开启。', 'warning');
        return false;
    }
    // cultivateQi 内部已校验精力、推进时辰、产出真元与真气
    var ok = window.cultivateQi();
    if (!ok) return false;
    // 圣地加成：建筑 output 越高，额外真元越多（无配额，约束仍是精力+时辰）
    var bonus = Math.max(1, Math.floor((res.output || 10) * 0.4));
    if (typeof window.addEssence === 'function') window.addEssence(bonus);
    if (window.showMessage) window.showMessage('你在【' + (res.name || '修炼地') + '】修炼——圣地灵气加持，额外获得真元 +' + bonus + '。', 'success');
    return true;
}

// ---- 藏经阁：接入既有分层阅览面板 ----
function _routeLibrary(res, sectName) {
    if (typeof window.openSectLibraryPanel === 'function') {
        if (window.showMessage) window.showMessage('你步入【' + (res.name || '藏经阁') + '】。', 'info');
        window.openSectLibraryPanel();
        return true;
    }
    if (window.showMessage) window.showMessage('藏经阁典籍尚在整理。', 'info');
    return false;
}

// ---- 炼丹 / 锻造：接入既有制造面板 ----
function _routeCrafting(res, category) {
    if (typeof window.openCraftingUI === 'function') {
        if (window.showMessage) window.showMessage('你来到【' + (res.name || '工坊') + '】。', 'info');
        window.openCraftingUI(category);
        return true;
    }
    if (window.showMessage) window.showMessage('此处工坊尚未启用。', 'info');
    return false;
}

// ---- 采集灵药：耗费时辰+真气，产出灵药 ----
function _gatherHerbs(res) {
    var cd = window.currentCharData;
    var qiCost = 8;
    if ((cd.qi || 0) < qiCost) {
        if (window.showMessage) window.showMessage('真气不足，难辨药性（需' + qiCost + '点真气）。', 'warning');
        return false;
    }
    cd.qi -= qiCost;
    if (window.timeSystem && window.timeSystem.advanceTime) window.timeSystem.advanceTime(60, '采药');
    var luck = 1 + (res.output || 10) / 30; // output 20 → luck≈1.67
    var count = 1 + (Math.random() < 0.35 ? 1 : 0); // 多数1株，少数2株
    var gained = {};
    for (var k = 0; k < count; k++) {
        var hid = _rollFromPool(_HERB_POOL, luck);
        gained[hid] = (gained[hid] || 0) + 1;
        if (typeof window.addItem === 'function') window.addItem(hid, 1);
    }
    var names = [];
    for (var gid in gained) {
        var nm = (window.itemById && window.itemById[gid]) ? window.itemById[gid].name : gid;
        names.push(nm + '×' + gained[gid]);
    }
    if (window.showMessage) window.showMessage('你在【' + (res.name || '药圃') + '】采得：' + names.join('、') + '。', 'success');
    if (typeof window.updateCharacterStatus === 'function') window.updateCharacterStatus();
    return true;
}

// ---- 采矿：耗费时辰+真气，产出矿石 ----
function _gatherOre(res) {
    var cd = window.currentCharData;
    var qiCost = 10;
    if ((cd.qi || 0) < qiCost) {
        if (window.showMessage) window.showMessage('真气不足，难开矿脉（需' + qiCost + '点真气）。', 'warning');
        return false;
    }
    cd.qi -= qiCost;
    if (window.timeSystem && window.timeSystem.advanceTime) window.timeSystem.advanceTime(90, '采矿');
    var luck = 1 + (res.output || 10) / 25;
    var count = 1 + (Math.random() < 0.3 ? 1 : 0);
    var gained = {};
    for (var k = 0; k < count; k++) {
        var oid = _rollFromPool(_ORE_POOL, luck);
        gained[oid] = (gained[oid] || 0) + 1;
        if (typeof window.addItem === 'function') window.addItem(oid, 1);
    }
    var names = [];
    for (var gid in gained) {
        var nm = (window.itemById && window.itemById[gid]) ? window.itemById[gid].name : gid;
        names.push(nm + '×' + gained[gid]);
    }
    if (window.showMessage) window.showMessage('你在【' + (res.name || '矿脉') + '】采得：' + names.join('、') + '。', 'success');
    if (typeof window.updateCharacterStatus === 'function') window.updateCharacterStatus();
    return true;
}

// ---- 探索：耗费时辰，机缘性产出（材料/灵石/空） ----
function _exploreArea(res) {
    if (window.timeSystem && window.timeSystem.advanceTime) window.timeSystem.advanceTime(120, '探索');
    var roll = Math.random();
    var cd = window.currentCharData;
    if (roll < 0.45) {
        // 材料（灵药或矿石随机）
        var pool = Math.random() < 0.5 ? _HERB_POOL : _ORE_POOL;
        var id = _rollFromPool(pool, 1.2);
        if (typeof window.addItem === 'function') window.addItem(id, 1);
        var nm = (window.itemById && window.itemById[id]) ? window.itemById[id].name : id;
        if (window.showMessage) window.showMessage('你在【' + (res.name || '秘境') + '】探索，拾得：' + nm + '×1。', 'success');
    } else if (roll < 0.75) {
        // 灵石
        var ss = 3 + Math.floor(Math.random() * 5);
        cd.spiritStones = (cd.spiritStones || 0) + ss;
        if (window.showMessage) window.showMessage('你在【' + (res.name || '秘境') + '】探索，寻得灵石 +' + ss + '。', 'success');
    } else {
        if (window.showMessage) window.showMessage('你在【' + (res.name || '秘境') + '】转了一圈，一无所获——机缘未到。', 'info');
    }
    if (typeof window.updateCharacterStatus === 'function') window.updateCharacterStatus();
    return true;
}

// ============ 导出 ============
if (typeof window !== 'undefined') {
    window.useSectResource = useSectResource;
    window._sectResourceActionLabel = _sectResourceActionLabel;
}
console.log('[门派建筑] 地标建筑可交互功能加载完成');
