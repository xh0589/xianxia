// ==================== enlightenment-tree.js - v20.0 2.3 悟道树 ====================
// 消耗悟道点数（insightPoints）解锁永久节点，长期积累
// 依赖：0.2.1 境界、insightPoints（cultivation.js 已有 spendInsightPoint）
// v20.42 做深：平铺七个+5 → 真正的树——二层结构（基础六节点 → 功能节点/大道节点），
// 前置门槛（功能节点各需一枚道心底子，道心通明需悟透任意三脉）；
// 新增功能节点：悟破境关（突破+5%）、静功生慧（突破悟道+1）。
// 永久领悟随档走（_enlightenedNodes 入 game-state 白名单）。

(function () {

var ENLIGHTEN_NODES = [
    // 一层：六维根基
    { id: 'physique', name: '体魄强化', icon: '💪', cost: 5, effect: { constitution: 5 }, desc: '体质永久+5' },
    { id: 'perception', name: '慧根初开', icon: '👁️', cost: 5, effect: { intelligence: 5 }, desc: '神识永久+5' },
    { id: 'agility', name: '灵机灵动', icon: '💨', cost: 5, effect: { dexterity: 5 }, desc: '灵巧永久+5' },
    { id: 'will', name: '道心初固', icon: '🧘', cost: 8, effect: { willpower: 5 }, desc: '意志永久+5' },
    { id: 'meridian', name: '经脉拓通', icon: '🔮', cost: 8, effect: { meridian: 5 }, desc: '经脉永久+5' },
    { id: 'strength', name: '力拔山兮', icon: '⛰️', cost: 8, effect: { strength: 5 }, desc: '力量永久+5' },
    // 二层：功能节点——各需一枚对应的道心底子
    { id: 'insight_break', name: '悟破境关', icon: '⚡', cost: 12, requires: ['will'],
      func: 'breakthrough', desc: '突破成功率+5%（道心固者，叩关更稳）' },
    { id: 'insight_meditation', name: '静功生慧', icon: '🪷', cost: 12, requires: ['physique'],
      func: 'insightGain', desc: '突破所得悟道点+1（身安则道隆）' },
    // 顶层：大道节点——六维悟透任意三脉方可触及
    { id: 'profound', name: '道心通明', icon: '🌟', cost: 15, requiresAny: 3,
      effect: { strength: 5, dexterity: 5, intelligence: 5, willpower: 5, constitution: 5, meridian: 5 },
      desc: '全六维永久+5（须先悟透任意三脉）' }
];

var BASIC_IDS = ['physique', 'perception', 'agility', 'will', 'meridian', 'strength'];

function getNodes() { return ENLIGHTEN_NODES; }

function getEnlightened() {
    var cd = window.currentCharData;
    if (!cd) return [];
    if (!Array.isArray(cd._enlightenedNodes)) cd._enlightenedNodes = [];
    return cd._enlightenedNodes;
}

function _nodeOf(id) {
    for (var i = 0; i < ENLIGHTEN_NODES.length; i++) if (ENLIGHTEN_NODES[i].id === id) return ENLIGHTEN_NODES[i];
    return null;
}

// 前置是否满足：requires 全要，requiresAny 数基础六脉悟了几枚
function getLockReason(nodeId) {
    var node = _nodeOf(nodeId);
    if (!node) return '无此节点';
    var done = getEnlightened();
    if (node.requires) {
        for (var i = 0; i < node.requires.length; i++) {
            if (done.indexOf(node.requires[i]) < 0) {
                var pre = _nodeOf(node.requires[i]);
                return '需先领悟「' + (pre ? pre.name : node.requires[i]) + '」';
            }
        }
    }
    if (node.requiresAny) {
        var cnt = 0;
        for (var j = 0; j < BASIC_IDS.length; j++) if (done.indexOf(BASIC_IDS[j]) >= 0) cnt++;
        if (cnt < node.requiresAny) return '需先悟透六维中任意 ' + node.requiresAny + ' 脉（当前 ' + cnt + '）';
    }
    return null;
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

// v20.42 功能旗：某类功能节点是否已悟（突破成功率/悟道点增益处读取）
function getEnlightenmentFlag(func) {
    var nodes = getEnlightened();
    for (var i = 0; i < nodes.length; i++) {
        var n = _nodeOf(nodes[i]);
        if (n && n.func === func) return true;
    }
    return false;
}

// 悟道点增益（静功生慧）
function getInsightGainBonus() {
    return getEnlightenmentFlag('insightGain') ? 1 : 0;
}

function enlightenNode(nodeId) {
    var cd = window.currentCharData;
    if (!cd) { if (window.showMessage) window.showMessage('请先创建角色', 'warning'); return false; }
    var node = _nodeOf(nodeId);
    if (!node) return false;
    var done = getEnlightened();
    if (done.indexOf(nodeId) >= 0) {
        if (window.showMessage) window.showMessage('已领悟「' + node.name + '」。', 'info');
        return false;
    }
    // v20.42 前置门槛：树的枝干，得从根上长
    var lock = getLockReason(nodeId);
    if (lock) {
        if (window.showMessage) window.showMessage('🌳 「' + node.name + '」尚未可悟——' + lock + '。', 'warning');
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
window.getEnlightenmentFlag = getEnlightenmentFlag;
window.getInsightGainBonus = getInsightGainBonus;
window.getEnlightenmentLockReason = getLockReason;
window.enlightenNode = enlightenNode;
window.getEnlightenedNodes = getEnlightened;

})();
