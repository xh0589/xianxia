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
    if (window.showMessage) {
        window.showMessage('🌤️ 你白日飞升，凡间信徒 ' + cd.incense + ' 人为你立祠供奉。每日香火回馈真元。天界之路已开——修行面板里「登上天界」，去走走九重之上的地界。'
            + ((window.eventFlags && window.eventFlags['qi_fin_fought']) ? '（香火是供奉管道——如今镰刀碎了，这条管道改姓你。）' : ''), 'success');
    }
    if (window.updateCharacterStatus) window.updateCharacterStatus();
    if (window.doAutoSave) window.doAutoSave('ascension');
    // v21.9 世界大事记留痕
    try { if (window.WorldJournal && window.WorldJournal.record) window.WorldJournal.record({ type: 'endgame', title: '白日飞升', text: '你渡过天劫，白日飞升。凡间 ' + cd.incense + ' 人为你立祠供奉，香火日日回馈真元。' }); } catch (e) {}
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
        if (window.gameLog && window.gameLog.add) window.gameLog.add('香火供奉回馈真元 +' + gain
            + ((window.eventFlags && window.eventFlags['qi_fin_fought']) ? '（管道还在，收账的没了——这份香火如今只暖人心）' : ''), 'info');
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
    // v21.9 世界大事记留痕
    try { if (window.WorldJournal && window.WorldJournal.record) window.WorldJournal.record({ type: 'endgame', title: '证道金仙', text: '飞升九层圆满，二段飞升——你证道金仙，寿与天齐，超脱轮回。' }); } catch (e) {}
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

// v21.9 飞升-转世衔接：飞升者/金仙可「回入尘世再走一遭」——主动散去仙躯入轮回。
// 此前转世积分表里 'ascend'(+50) 是死代码——全库没有任何路径写入 lastDeathReason='ascend'，
// 且核心转世要求「肉身已毁或残魂态」，飞升者肉身尚健被拒之门外：二周目对通关者永不可达。
function ascendedDescension() {
    var cd = window.currentCharData;
    if (!cd || (cd.realm !== '飞升' && cd.realm !== '金仙')) {
        if (window.showMessage) window.showMessage('唯有仙躯方可回入尘世——凡人本就身在尘世里。', 'info');
        return false;
    }
    if (typeof window.confirm === 'function' && !window.confirm('回入尘世，再走一遭？\n\n你将散去仙躯入轮回：境界归零，从凡人重修。\n人间的香火祠庙会替你留着；前世的功法、羁绊与气运随灵魂转世，轮回积分按「超脱」另计五十点。\n\n仙路长青——长青的不是仙躯，是走路的人。')) return false;
    cd.lastDeathReason = 'ascend';
    try { if (window.WorldJournal && window.WorldJournal.record) window.WorldJournal.record({ type: 'endgame', title: '回入尘世', text: (cd.realm === '金仙' ? '金仙' : '仙人') + '散躯入轮回。人间少了一位仙，路上多了一个重新出发的人。' }); } catch (e) {}
    var started = false;
    try {
        if (window.ReincarnationIntegration && typeof window.ReincarnationIntegration.onPlayerDeath === 'function') {
            var r = window.ReincarnationIntegration.onPlayerDeath('ascend');
            started = !!(r && r.ok);
        }
    } catch (e) {}
    if (!started) {
        // 兜底：轮回集成缺载时走核心转世——自愿散躯视同残魂态
        try {
            cd.soulState = { active: true, bodyDestroyed: true, realmIndex: 9, sinceDay: 0, weakUntilDay: 0, lostCultivation: 0 };
        } catch (e) {}
        if (typeof window.reincarnate === 'function') started = window.reincarnate();
    }
    if (started && window.showMessage) window.showMessage('🔄 仙躯散作满天霞光，落回人间——新的一世，从凡人开始。', 'success');
    return started;
}

// ==================== v44 天界：飞升之后有路可走 ====================
// 登上天界 = 开天界野外图（整套行走/扎营/遭遇/灵泉引擎原样复用）。
// 境界闸的真收口在 openWildernessMap（地区列表、传送、任何后门都拦），这里只管记来路与话术。

function enterTianjie() {
    var cd = window.currentCharData;
    if (!cd || (cd.realm !== '飞升' && cd.realm !== '金仙')) {
        if (window.showMessage) window.showMessage('界膜之上罡风如刃，非仙躯不能登天。', 'warning');
        return false;
    }
    if (typeof window.openWildernessMap !== 'function') return false;
    // 记下登上天界时人在哪一域，回尘世就落回原处（缺省中州）
    try {
        var from = window.currentRegionForMap;
        if (from && from !== '天界') cd._tianjieFrom = from;
        else if (!cd._tianjieFrom) cd._tianjieFrom = '中州';
    } catch (e) {}
    window.openWildernessMap('天界');
    if (window.showMessage) window.showMessage('🌅 天光分开，你踏罡风而上——九天到了。灵气如潮水漫过周身，凡尘的尘土气从袍角褪尽。', 'success');
    return true;
}

function leaveTianjie() {
    var cd = window.currentCharData;
    if (typeof window.openWildernessMap !== 'function') return false;
    var back = (cd && cd._tianjieFrom) || '中州';
    window.openWildernessMap(back);
    if (window.showMessage) window.showMessage('🌅 你拨开云层往下落——脚下又是' + back + '的山河。人间烟火气扑面而来。', 'success');
    return true;
}

// 注册每日香火回调
if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') {
    window.timeSystem.onNewDaySubscribe(dailyIncenseFeedback);
}

window.onAscension = onAscension;
window.trySecondAscension = trySecondAscension;
window.tianjieSpar = tianjieSpar;
window.ascendedDescension = ascendedDescension;
window.enterTianjie = enterTianjie;
window.leaveTianjie = leaveTianjie;

})();
