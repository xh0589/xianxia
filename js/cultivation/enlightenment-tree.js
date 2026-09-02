// ==================== enlightenment-tree.js - v20.0 2.3 悟道树 ====================
// 消耗悟道点数（insightPoints）解锁永久属性节点，长期积累
// 依赖：0.2.1 境界、insightPoints（cultivation.js 已有 spendInsightPoint）

(function () {

var ENLIGHTEN_NODES = [
    { id: 'physique', name: '体魄强化', icon: '💪', cost: 5, effect: { constitution: 5 }, desc: '体质永久+5' },
    { id: 'perception', name: '慧根初开', icon: '👁️', cost: 5, effect: { intelligence: 5 }, desc: '神识永久+5' },
    { id: 'agility', name: '灵机灵动', icon: '💨', cost: 5, effect: { dexterity: 5 }, desc: '灵巧永久+5' },
    { id: 'will', name: '道心初固', icon: '🧘', cost: 8, effect: { willpower: 5 }, desc: '意志永久+5' },
    { id: 'meridian', name: '经脉拓通', icon: '🔮', cost: 8, effect: { meridian: 5 }, desc: '经脉永久+5' },
    { id: 'strength', name: '力拔山兮', icon: '⛰️', cost: 8, effect: { strength: 5 }, desc: '力量永久+5' },
    { id: 'profound', name: '道心通明', icon: '🌟', cost: 15, effect: { strength: 5, dexterity: 5, intelligence: 5, willpower: 5, constitution: 5, meridian: 5 }, desc: '全六维永久+5' }
];

function getNodes() { return ENLIGHTEN_NODES; }

function getEnlightened() {
    var cd = window.currentCharData;
    if (!cd) return [];
    if (!Array.isArray(cd._enlightenedNodes)) cd._enlightenedNodes = [];
    return cd._enlightenedNodes;
}

// 累加已解锁节点的 effect（供 buildPlayerBattleEntity 调用）
function getEnlightenmentBonus() {
    var nodes = getEnlightened();
    var bonus = {};
    var set = {};
    for (var i = 0; i < nodes.length; i++) set[nodes[i]] = true;
    for (var j = 0; j < ENLIGHTEN_NODES.length; j++) {
        var n = ENLIGHTEN_NODES[j];
        if (set[n.id] && n.effect) {
            for (var k in n.effect) bonus[k] = (bonus[k] || 0) + n.effect[k];
        }
    }
    return bonus;
}

function enlightenNode(nodeId) {
    var cd = window.currentCharData;
    if (!cd) { if (window.showMessage) window.showMessage('请先创建角色', 'warning'); return false; }
    var node = null;
    for (var i = 0; i < ENLIGHTEN_NODES.length; i++) {
        if (ENLIGHTEN_NODES[i].id === nodeId) { node = ENLIGHTEN_NODES[i]; break; }
    }
    if (!node) return false;
    var done = getEnlightened();
    if (done.indexOf(nodeId) >= 0) {
        if (window.showMessage) window.showMessage('已领悟「' + node.name + '」。', 'info');
        return false;
    }
    if ((window.insightPoints || 0) < node.cost) {
        if (window.showMessage) window.showMessage('悟道点不足（需 ' + node.cost + '，当前 ' + (window.insightPoints || 0) + '）。', 'warning');
        return false;
    }
    // 扣点（用既有 spendInsightPoint 访问器）
    if (typeof window.spendInsightPoint === 'function') {
        for (var c = 0; c < node.cost; c++) window.spendInsightPoint(1);
    } else {
        window.insightPoints = Math.max(0, (window.insightPoints || 0) - node.cost);
    }
    done.push(nodeId);
    cd._enlightenedNodes = done;
    if (window.showMessage) window.showMessage('🌟 你领悟了「' + node.name + '」！' + node.desc + '。', 'success');
    if (window.updateInsightUI) window.updateInsightUI();
    if (window.updateCharacterStatus) window.updateCharacterStatus();
    return true;
}

window.ENLIGHTEN_NODES = ENLIGHTEN_NODES;
window.getEnlightenmentBonus = getEnlightenmentBonus;
window.enlightenNode = enlightenNode;
window.getEnlightenedNodes = getEnlightened;

})();
