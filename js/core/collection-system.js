// ==================== collection-system.js - v20.0 2.15 图鉴收集 ====================
// 派生统计（功法/物品/NPC/击杀）+ 收集里程碑奖励（气运）
// 无 bestiary 字段，敌人图鉴用击杀计数代。依赖：learnedSecrets/inventory/npcManager

(function () {

function getStats() {
    var r = { skills: 0, items: 0, npcs: 0, kills: 0 };
    try {
        r.skills = (window.learnedSecrets && window.learnedSecrets.length) || 0;
    } catch (e) {}
    try {
        var slots = window.inventory && window.inventory.slots;
        if (slots) {
            var set = {};
            for (var i = 0; i < slots.length; i++) {
                if (slots[i] && slots[i].templateId) set[slots[i].templateId] = true;
            }
            r.items = Object.keys(set).length;
        }
    } catch (e) {}
    try {
        if (window.npcManager && window.npcManager.getAllNPCs) {
            var all = window.npcManager.getAllNPCs() || [];
            var cnt = 0;
            for (var j = 0; j < all.length; j++) {
                if (all[j] && all[j].relationship && (all[j].relationship.affection || 0) > 0) cnt++;
            }
            r.npcs = cnt;
        }
    } catch (e) {}
    try {
        if (window.currentCharData) r.kills = window.currentCharData._killCount || 0;
    } catch (e) {}
    return r;
}

var MILESTONES = [
    { id: 'skills10', label: '习得 10 部功法', stat: 'skills', target: 10, reward: 5 },
    { id: 'skills20', label: '习得 20 部功法', stat: 'skills', target: 20, reward: 10 },
    { id: 'items30', label: '获 30 种物品', stat: 'items', target: 30, reward: 5 },
    { id: 'items60', label: '获 60 种物品', stat: 'items', target: 60, reward: 10 },
    { id: 'npcs15', label: '结识 15 位修士', stat: 'npcs', target: 15, reward: 5 },
    { id: 'kills50', label: '击杀 50 敌', stat: 'kills', target: 50, reward: 5 }
];

function getClaimed() {
    var cd = window.currentCharData;
    if (!cd) return {};
    if (!cd._collectionClaimed) cd._collectionClaimed = {};
    return cd._collectionClaimed;
}

function claimMilestone(id) {
    var cd = window.currentCharData;
    if (!cd) return false;
    var m = null;
    for (var i = 0; i < MILESTONES.length; i++) if (MILESTONES[i].id === id) { m = MILESTONES[i]; break; }
    if (!m) return false;
    var claimed = getClaimed();
    if (claimed[id]) { if (window.showMessage) window.showMessage('已领取该奖励。', 'info'); return false; }
    var stats = getStats();
    if ((stats[m.stat] || 0) < m.target) {
        if (window.showMessage) window.showMessage('尚未达成：' + m.label + '（' + (stats[m.stat]||0) + '/' + m.target + '）。', 'warning');
        return false;
    }
    claimed[id] = true;
    cd.luck = Math.min(100, (cd.luck || 50) + m.reward);
    if (window.showMessage) window.showMessage('📖 图鉴里程碑达成：「' + m.label + '」气运 +' + m.reward + '！', 'success');
    if (window.updateCharacterStatus) window.updateCharacterStatus();
    return true;
}

window.getCollectionStats = getStats;
window.COLLECTION_MILESTONES = MILESTONES;
window.claimCollectionMilestone = claimMilestone;
window.getCollectionClaimed = getClaimed;

})();
