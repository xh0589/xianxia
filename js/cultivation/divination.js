// ==================== divination.js - v20.0 2.19 天机推演/占卜 ====================
// 元婴+可占卜：查气运/推演机缘（给临时 luck/attack buff）
// 依赖：1.5 气运、DataManager

(function () {

// 占卜：元婴+，扣灵石，反馈气运 + 推演机缘 buff
function divineFortune() {
    var cd = window.currentCharData;
    if (!cd) { if (window.showMessage) window.showMessage('请先创建角色', 'warning'); return false; }
    var tier = (typeof window.getRealmTier === 'function') ? window.getRealmTier(cd.realm) : 0;
    if (tier < 4) { if (window.showMessage) window.showMessage('元婴方可感应天机。', 'warning'); return false; }
    var cost = 100;
    if (window.DataManager && window.DataManager.deductSpiritStones && !window.DataManager.deductSpiritStones(cost)) {
        if (window.showMessage) window.showMessage('占卜需 ' + cost + ' 灵石布置卦阵。', 'warning');
        return false;
    }
    var luck = (cd.luck != null ? cd.luck : 50);
    // 气运越高，推演越准（buff 越好）
    var roll = Math.random() * 100;
    var tier2 = luck + roll * 0.3; // 气运影响
    var msg = '🔮 卦象显现——';
    if (tier2 >= 120) {
        cd.luck = Math.min(100, luck + 8);
        cd._customPillBuff = { attack: 8, days: 1 };
        msg += '上上卦！天机清明，气运+8，战意大盛（攻击+8%一日）。';
    } else if (tier2 >= 90) {
        cd.luck = Math.min(100, luck + 5);
        msg += '上卦。机缘将至，气运+5。';
    } else if (tier2 >= 60) {
        cd.luck = Math.min(100, luck + 2);
        msg += '中卦。气运+2，宜静修。';
    } else if (tier2 >= 30) {
        msg += '下卦。气运平平，慎防小人。';
    } else {
        cd.luck = Math.max(0, luck - 3);
        msg += '下下卦！天机混沌，气运-3，近日宜避祸。';
    }
    if (window.showMessage) window.showMessage(msg, 'info');
    if (window.updateCharacterStatus) window.updateCharacterStatus();
    return true;
}

window.divineFortune = divineFortune;

})();
