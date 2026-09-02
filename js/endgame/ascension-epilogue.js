// ==================== ascension-epilogue.js - v20.0 1.3 飞升后世界（最小可玩版） ====================
// 香火系统 + 二段飞升目标。天界完整地图留后续扩展。
// 依赖：1.1 渡劫成功（onAscension 由 heavenly-tribulation 调用）、0.2.1 境界质变

(function () {

// 飞升时初始化：折算凡间名气→初始信徒（香火）
function onAscension() {
    var cd = window.currentCharData;
    if (!cd) return;
    cd.realm = '飞升';
    cd.layer = 1;
    // 香火：飞升前名气越高，凡间信徒越多
    var fame = cd.fame || 0;
    cd.incense = Math.max(10, Math.floor(fame / 2) + 10);
    cd._ascensionDay = (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function')
        ? window.timeSystem.getAbsoluteDay() : 0;
    cd._unlockedTianjie = true;
    // v20.1 自动存档：飞升是关键时刻，独立键不抢手动档
    try { if (typeof window.doAutoSave === 'function') window.doAutoSave('ascension'); } catch (eAS) {}
    if (window.showMessage) {
        window.showMessage('🌤️ 你白日飞升，凡间信徒 ' + cd.incense + ' 人为你立祠供奉。每日香火回馈真元。', 'success');
    }
    if (window.updateCharacterStatus) window.updateCharacterStatus();
}

// 每日香火反馈：飞升后，信徒每日供奉→真元（香火越旺产出越高）
function dailyIncenseFeedback() {
    try {
        var cd = window.currentCharData;
        if (!cd || cd.realm !== '飞升') return;
        var inc = cd.incense || 0;
        if (inc <= 0) return;
        // 真元产出 = 信徒数*0.5 + 随机波动；香火是飞升后主要修炼来源
        var gain = Math.floor(inc * 0.5 + Math.random() * inc * 0.3);
        cd.essence = (cd.essence || 0) + gain;
        if (window.gameLog && window.gameLog.add) window.gameLog.add('香火供奉回馈真元 +' + gain, 'info');
    } catch (e) {}
}

// 二段飞升：飞升期 9 层满 → 金仙（终极目标）
function trySecondAscension() {
    var cd = window.currentCharData;
    if (!cd || cd.realm !== '飞升') {
        if (window.showMessage) window.showMessage('唯有飞升期方可二段飞升。', 'info');
        return false;
    }
    var layer = cd.layer || 1;
    if (layer < 9) {
        if (window.showMessage) window.showMessage('飞升期修为未满（' + layer + '/9），无法二段飞升。', 'warning');
        return false;
    }
    cd.realm = '金仙';
    cd.layer = 1;
    cd._foundationBonus = (cd._foundationBonus || 0) + 50;
    if (window.showMessage) window.showMessage('🌟🌟 二段飞升！你证道金仙，寿与天齐，超脱轮回！', 'success');
    if (window.updateCharacterStatus) window.updateCharacterStatus();
    return true;
}

// 天界切磋：飞升后高难战斗入口（找仙人切磋，奖励真元+香火）
function tianjieSpar() {
    var cd = window.currentCharData;
    if (!cd || (cd.realm !== '飞升' && cd.realm !== '金仙')) {
        if (window.showMessage) window.showMessage('唯有仙人方可与天界仙人对弈。', 'info');
        return false;
    }
    // 生成仙人对手（强度随飞升层）
    var tier = 10; // 飞升及以上
    var enemyData = {
        name: '天界散仙',
        type: 'elite',
        physiologyType: 'humanoid',
        level: (cd.layer || 1) * 10 + 30,
        attack: 80 + (cd.layer || 1) * 8,
        defense: 30 + (cd.layer || 1) * 5,
        speed: 30,
        maxDurability: 200 + (cd.layer || 1) * 30,
        durabilities: { chest: 200 + (cd.layer || 1) * 30 },
        combatAbilities: []
    };
    if (window.startBattle) window.startBattle(enemyData);
    return true;
}

// 注册每日香火回调
if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') {
    window.timeSystem.onNewDaySubscribe(dailyIncenseFeedback);
}

window.onAscension = onAscension;
window.trySecondAscension = trySecondAscension;
window.tianjieSpar = tianjieSpar;

})();
