// ==================== master-teach.js - v20.0 2.21 师徒传功/传承深度 ====================
// 玩家作师父给弟子传功：弟子好感+修炼进度加速+玩家声望
// 复用 PlayerSect 弟子、NPC._cultivationProgress（1.4 演化字段）

(function () {

// 取玩家宗门弟子 npcId 列表
function _getDiscipleIds() {
    try {
        if (!window.PlayerSect || typeof window.PlayerSect.listMySects !== 'function') return [];
        var mine = window.PlayerSect.listMySects() || [];
        if (!mine.length || !mine[0].disciples) return [];
        return mine[0].disciples.map(function (d) { return d.npcId; }).filter(Boolean);
    } catch (e) { return []; }
}

// 传功：加速弟子修炼进度 + 好感 + 玩家声望
function teachDisciple(npcId) {
    var cd = window.currentCharData;
    if (!cd) { if (window.showMessage) window.showMessage('请先创建角色', 'warning'); return false; }
    var npc = window.npcManager && window.npcManager.getNPC(npcId);
    if (!npc) { if (window.showMessage) window.showMessage('查无此弟子。', 'warning'); return false; }
    var cost = 30;
    if (window.DataManager && window.DataManager.deductSpiritStones && !window.DataManager.deductSpiritStones(cost)) {
        if (window.showMessage) window.showMessage('传功需 ' + cost + ' 灵石布置。', 'warning');
        return false;
    }
    // 弟子修炼进度+5（加速 1.4 自主突破）
    npc._cultivationProgress = (Number(npc._cultivationProgress) || 0) + 5;
    if (typeof npc.changeAffection === 'function') npc.changeAffection(5);
    cd.fame = Math.min(100, (cd.fame || 0) + 3);
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(60, '传功弟子');
    }
    if (window.showMessage) window.showMessage('📖 你为' + npc.name + '传功讲道，其感悟大增，对你好感+5，你声望+3。', 'success');
    if (window.updateCharacterStatus) window.updateCharacterStatus();
    return true;
}

// 传功首个弟子（UI 一键入口）
function teachFirstDisciple() {
    var ids = _getDiscipleIds();
    if (!ids.length) { if (window.showMessage) window.showMessage('你尚无弟子可传功。', 'warning'); return false; }
    return teachDisciple(ids[0]);
}

window.teachDisciple = teachDisciple;
window.teachFirstDisciple = teachFirstDisciple;

})();
