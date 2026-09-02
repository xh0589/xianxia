// ==================== qi-deviation.js - v20.0 2.1 走火入魔状态 ====================
// 修炼过度（真气低时修炼）/丹毒高/心魔失控→气机紊乱，紊乱高→走火入魔（减属性）
// 独立于心魔系统。化解：静心/休息。依赖：0.2.3 心魔、1.9 丹毒

(function () {

function getQD() {
    var cd = window.currentCharData;
    if (!cd) return 0;
    if (cd._qiDeviation == null) cd._qiDeviation = 0;
    return cd._qiDeviation;
}

function addQiDeviation(amount) {
    var cd = window.currentCharData;
    if (!cd) return;
    var before = cd._qiDeviation || 0;
    cd._qiDeviation = Math.max(0, Math.min(100, before + (amount || 0)));
    // 首次进入走火入魔（>=80）提示
    if (before < 80 && cd._qiDeviation >= 80) {
        if (window.showMessage) window.showMessage('⚠️ 气机紊乱失控，你已走火入魔！属性大损，亟需静心化解。', 'error');
    }
}

// 走火入魔对全属性惩罚倍率（紊乱>=80 → -10%，>=95 → -20%）
function getQiDeviationPenalty() {
    var qd = getQD();
    if (qd >= 95) return 0.2;
    if (qd >= 80) return 0.1;
    return 0;
}

// 静心化解
function calmQiDeviation(amount) {
    var cd = window.currentCharData;
    if (!cd) return 0;
    var before = cd._qiDeviation || 0;
    cd._qiDeviation = Math.max(0, before - (amount || 20));
    return before - cd._qiDeviation;
}

window.getQiDeviation = getQD;
window.addQiDeviation = addQiDeviation;
window.getQiDeviationPenalty = getQiDeviationPenalty;
window.calmQiDeviation = calmQiDeviation;

})();
