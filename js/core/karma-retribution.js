// ==================== karma-retribution.js - v20.0 2.23 因果/业力报应 ====================
// 高善/高恶定期触发善报/恶报（气运/灵石/轻伤），世界对品性的反馈
// 依赖：karma（既有字段）、timeSystem.onNewDaySubscribe

(function () {

function tickKarmaRetribution() {
    try {
        var cd = window.currentCharData;
        if (!cd) return;
        var karma = cd.karma || 0;
        var roll = Math.random();
        if (karma >= 50 && roll < 0.15) {
            // 善报
            var r = Math.random();
            if (r < 0.5) {
                cd.luck = Math.min(100, (cd.luck || 50) + 1);
                if (window.gameLog && window.gameLog.add) window.gameLog.add('善有善报：心存正念，气运+1', 'success');
            } else {
                if (window.DataManager && window.DataManager.addSpiritStones) window.DataManager.addSpiritStones(10);
                if (window.gameLog && window.gameLog.add) window.gameLog.add('善有善报：路人赠礼，得灵石+10', 'success');
            }
        } else if (karma <= -50 && roll < 0.15) {
            // 恶报
            var r2 = Math.random();
            if (r2 < 0.5) {
                cd.luck = Math.max(0, (cd.luck || 50) - 1);
                if (window.gameLog && window.gameLog.add) window.gameLog.add('恶有恶报：因果缠身，气运-1', 'error');
            } else {
                cd.health = Math.max(1, (cd.health || 100) - 5);
                if (window.gameLog && window.gameLog.add) window.gameLog.add('恶有恶报：仇家暗算，受伤-5气血', 'error');
            }
        }
    } catch (e) {}
}

if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') {
    window.timeSystem.onNewDaySubscribe(tickKarmaRetribution);
}

window.tickKarmaRetribution = tickKarmaRetribution;

})();
