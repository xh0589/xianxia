// ==================== pill-poison.js - v20.0 1.9 丹毒系统 ====================
// 服丹按毒性积累丹毒，高丹毒减修炼效率/增走火入魔风险
// 依赖：1.1 走火入魔联动
// v20.41 做深：丹毒只进不出是假账——补「解毒三途」（解毒茶/发汗排毒/延医调治，各占时辰或灵石），
// 分档警示（50/80），面板露出见 cultivation.js。解毒皆要付账——丹药的甜，丹毒的债。

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
    var before = cd.pillPoison || 0;
    cd.pillPoison = Math.max(0, Math.min(100, before + add));
    // v20.41 分档警示：50 毒滞、80 毒入经脉——恶化时重报，好转后清旗（再恶化再报）
    if (before < 50 && cd.pillPoison >= 50) {
        cd._ppWarn50 = true;
        if (window.showMessage) window.showMessage('🍵 丹毒滞体（' + Math.round(cd.pillPoison) + '）——修炼开始发涩。丹药的甜里，毒在记账。', 'warning');
    }
    if (before < 80 && cd.pillPoison >= 80) {
        cd._ppWarn80 = true;
        if (window.showMessage) window.showMessage('🩸 丹毒入经脉（' + Math.round(cd.pillPoison) + '）——真气里带着药渣的涩。再服丹，就是拿命试药了。', 'error');
    }
}

// 丹毒对修炼的惩罚倍率（0~0.5）：50丹毒-25%，100丹毒-50%
function getPillPoisonPenalty() {
    return Math.min(0.5, getPoison() / 200);
}

// 走火入魔额外概率（丹毒越高越易入魔）
function getPillPoisonHeartDemonChance() {
    return getPoison() / 500; // 100丹毒→+20% 走火概率
}

// 解毒（旧 API 保留）
function detoxifyPill(amount) {
    var cd = window.currentCharData;
    if (!cd) return 0;
    var before = cd.pillPoison || 0;
    cd.pillPoison = Math.max(0, before - (amount || 20));
    // 好转清旗：毒降回档线以下，警示重新作数
    if (cd.pillPoison < 50) cd._ppWarn50 = false;
    if (cd.pillPoison < 80) cd._ppWarn80 = false;
    return before - cd.pillPoison;
}

// ============ v20.41 解毒三途 ============
// 解毒茶：半日，-20。发汗排毒：一整日，-35。延医调治：灵石 200+半日，-50。
var DOCTOR_COST = 200;

function detoxChoice() {
    var p = getPoison();
    if (p <= 0) { if (window.showMessage) window.showMessage('体内无丹毒，不必解。', 'info'); return false; }
    if (typeof window.showModal !== 'function') { // 无弹窗环境兜底：直接解毒茶
        detoxTea();
        return true;
    }
    var btn = 'class="bg-lime-800 hover:bg-lime-700 text-lime-100 text-xs px-3 py-2 rounded text-left w-full"';
    window.showModal('🍵 化解丹毒（当前 ' + Math.round(p) + '）',
        '<p class="text-xs text-gray-400 mb-3">丹药的甜里带毒——解毒的路，条条要付账。</p>'
        + '<div style="display:flex;flex-direction:column;gap:8px">'
        + '<button onclick="window._detoxTea(); this.closest(\'#xianxia-modal-overlay\').remove();" ' + btn + '>🍵 煎解毒茶——半日，丹毒-20（温和，不假外求）</button>'
        + '<button onclick="window._detoxSweat(); this.closest(\'#xianxia-modal-overlay\').remove();" ' + btn + '>🔥 发汗排毒——一整日，丹毒-35（以真火逼药渣出腠理）</button>'
        + '<button onclick="window._detoxDoctor(); this.closest(\'#xianxia-modal-overlay\').remove();" ' + btn + '>💰 延医调治——灵石 ' + DOCTOR_COST + '+半日，丹毒-50（请药庐圣手施针）</button>'
        + '</div>');
    return true;
}

function _advance(mins, label) {
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(mins, label);
    }
}

function detoxTea() {
    if (getPoison() <= 0) { if (window.showMessage) window.showMessage('体内无丹毒，不必解。', 'info'); return false; }
    var got = detoxifyPill(20);
    _advance(30, '煎解毒茶');
    if (window.showMessage) window.showMessage('🍵 你煎了一壶苦茶，茶色发黑——苦得舌根发麻，毒随茶走。（丹毒-' + Math.round(got) + '，耗时半日）', 'success');
    return true;
}

function detoxSweat() {
    if (getPoison() <= 0) { if (window.showMessage) window.showMessage('体内无丹毒，不必解。', 'info'); return false; }
    var got = detoxifyPill(35);
    _advance(60, '发汗排毒');
    if (window.showMessage) window.showMessage('🔥 你盘膝运起真火，逼药渣从腠理渗出——汗出如浆，汗色微浊。（丹毒-' + Math.round(got) + '，耗时一整日）', 'success');
    return true;
}

function detoxDoctor() {
    if (getPoison() <= 0) { if (window.showMessage) window.showMessage('体内无丹毒，不必解。', 'info'); return false; }
    if (window.DataManager && window.DataManager.deductSpiritStones && !window.DataManager.deductSpiritStones(DOCTOR_COST)) {
        if (window.showMessage) window.showMessage('延医需灵石 ' + DOCTOR_COST + '——手头不足。', 'warning');
        return false;
    }
    var got = detoxifyPill(50);
    _advance(30, '延医调治丹毒');
    if (window.showMessage) window.showMessage('💰 药庐圣手三针下去，针针挑在药渣淤积处——针毕，吐出一口浊气。（丹毒-' + Math.round(got) + '，灵石-' + DOCTOR_COST + '，耗时半日）', 'success');
    return true;
}

window.getPillPoison = getPoison;
window.getPillToxicity = getPillToxicity;
window.addPillPoison = addPillPoison;
window.getPillPoisonPenalty = getPillPoisonPenalty;
window.getPillPoisonHeartDemonChance = getPillPoisonHeartDemonChance;
window.detoxifyPill = detoxifyPill;
window.detoxChoice = detoxChoice;
window._detoxTea = detoxTea;
window._detoxSweat = detoxSweat;
window._detoxDoctor = detoxDoctor;

})();
