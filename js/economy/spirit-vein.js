// ==================== spirit-vein.js - v20.0 2.13 灵脉/灵石矿经营 ====================
// 金丹+可占据灵脉，每日被动产灵石；可升级提升产出
// 依赖：DataManager、timeSystem.onNewDaySubscribe

(function () {

function getVein() {
    var cd = window.currentCharData;
    if (!cd) return null;
    if (!cd._spiritVein) cd._spiritVein = null;
    return cd._spiritVein;
}

// 占据灵脉：金丹+，扣灵石
function claimSpiritVein() {
    var cd = window.currentCharData;
    if (!cd) { if (window.showMessage) window.showMessage('请先创建角色', 'warning'); return false; }
    var tier = (typeof window.getRealmTier === 'function') ? window.getRealmTier(cd.realm) : 0;
    if (tier < 3) { if (window.showMessage) window.showMessage('需金丹以上方可占据灵脉。', 'warning'); return false; }
    if (cd._spiritVein) { if (window.showMessage) window.showMessage('你已占据一处灵脉。', 'info'); return false; }
    var cost = 1000;
    if (window.DataManager && window.DataManager.deductSpiritStones && !window.DataManager.deductSpiritStones(cost)) {
        if (window.showMessage) window.showMessage('占据灵脉需 ' + cost + ' 灵石安顿阵法。', 'warning');
        return false;
    }
    cd._spiritVein = { tier: 1, dailyOutput: 20, claimedDay: (window.timeSystem && window.timeSystem.getAbsoluteDay) ? window.timeSystem.getAbsoluteDay() : 0 };
    if (window.showMessage) window.showMessage('💎 你布阵占据一处灵脉，每日可得 20 灵石。', 'success');
    return true;
}

// 升级灵脉：扣灵石提 tier/dailyOutput
function upgradeVein() {
    var cd = window.currentCharData;
    if (!cd || !cd._spiritVein) { if (window.showMessage) window.showMessage('你尚未占据灵脉。', 'warning'); return false; }
    var v = cd._spiritVein;
    if (v.tier >= 5) { if (window.showMessage) window.showMessage('灵脉已臻极盛。', 'info'); return false; }
    var cost = v.tier * 800;
    if (window.DataManager && window.DataManager.deductSpiritStones && !window.DataManager.deductSpiritStones(cost)) {
        if (window.showMessage) window.showMessage('升级需 ' + cost + ' 灵石。', 'warning');
        return false;
    }
    v.tier += 1;
    v.dailyOutput = 20 + (v.tier - 1) * 15;
    if (window.showMessage) window.showMessage('💎 灵脉升级至 ' + v.tier + ' 阶，日产 ' + v.dailyOutput + ' 灵石。', 'success');
    return true;
}

// 每日产出
function dailyVeinOutput() {
    try {
        var cd = window.currentCharData;
        if (!cd || !cd._spiritVein) return;
        var v = cd._spiritVein;
        var gain = v.dailyOutput || 20;
        if (window.DataManager && window.DataManager.addSpiritStones) {
            window.DataManager.addSpiritStones(gain);
            if (window.gameLog && window.gameLog.add) window.gameLog.add('灵脉产出灵石 +' + gain, 'info');
        }
    } catch (e) {}
}

if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') {
    window.timeSystem.onNewDaySubscribe(dailyVeinOutput);
}

window.claimSpiritVein = claimSpiritVein;
window.upgradeVein = upgradeVein;
window.getSpiritVein = getVein;

})();
