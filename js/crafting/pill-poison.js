// ==================== pill-poison.js - v20.0 1.9 丹毒系统 ====================
// 服丹按毒性积累丹毒，高丹毒减修炼效率/增走火入魔风险；解毒丹/静心化解
// 残卷拼合/自创丹方/丹炉品质留后续。依赖：1.1 走火入魔联动

(function () {

function getPoison() {
    var cd = window.currentCharData;
    if (!cd) return 0;
    if (cd.pillPoison == null) cd.pillPoison = 0;
    return cd.pillPoison;
}

// 丹药毒性：优先读物品 toxicity 字段，否则按 rarity 估算
function getPillToxicity(itemId) {
    try {
        var item = window.itemById && window.itemById[itemId];
        if (!item) return 5;
        if (typeof item.toxicity === 'number') return item.toxicity;
        var r = item.rarity || item.quality || 'common';
        var map = { common: 5, uncommon: 10, rare: 20, epic: 35, legendary: 50 };
        return map[r] != null ? map[r] : 5;
    } catch (e) { return 5; }
}

// 服丹积累丹毒
function addPillPoison(itemId, count) {
    var cd = window.currentCharData;
    if (!cd) return;
    var tox = getPillToxicity(itemId);
    var add = tox * (count || 1);
    cd.pillPoison = Math.max(0, Math.min(100, (cd.pillPoison || 0) + add));
}

// 丹毒对修炼的惩罚倍率（0~0.5）：50丹毒-25%，100丹毒-50%
function getPillPoisonPenalty() {
    return Math.min(0.5, getPoison() / 200);
}

// 走火入魔额外概率（丹毒越高越易入魔）
function getPillPoisonHeartDemonChance() {
    return getPoison() / 500; // 100丹毒→+20% 走火概率
}

// 解毒
function detoxifyPill(amount) {
    var cd = window.currentCharData;
    if (!cd) return 0;
    var before = cd.pillPoison || 0;
    cd.pillPoison = Math.max(0, before - (amount || 20));
    return before - cd.pillPoison;
}

window.getPillPoison = getPoison;
window.getPillToxicity = getPillToxicity;
window.addPillPoison = addPillPoison;
window.getPillPoisonPenalty = getPillPoisonPenalty;
window.getPillPoisonHeartDemonChance = getPillPoisonHeartDemonChance;
window.detoxifyPill = detoxifyPill;

})();
