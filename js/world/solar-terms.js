// ==================== solar-terms.js - v20.0 2.18 节气/季节限定活动 ====================
// 24节气日给气运 buff + 灵气流转提示，季节感
// 依赖：timeSystem.onNewDaySubscribe、currentDay

(function () {

var SOLAR_TERMS = ['立春', '雨水', '惊蛰', '春分', '清明', '谷雨',
    '立夏', '小满', '芒种', '夏至', '小暑', '大暑',
    '立秋', '处暑', '白露', '秋分', '寒露', '霜降',
    '立冬', '小雪', '大雪', '冬至', '小寒', '大寒'];

function _currentDay() {
    try {
        if (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') {
            return window.timeSystem.getAbsoluteDay();
        }
        if (window.timeSystem && window.timeSystem.gameTime) return Number(window.timeSystem.gameTime.currentDay) || 0;
    } catch (e) {}
    return 0;
}

// 节气每日检查：逢节气日（每15天）给气运+1 + 提示
function tickSolarTerm() {
    try {
        var day = _currentDay();
        if (day <= 0) return;
        // 每15天一个节气日
        if (day % 15 !== 0) return;
        var termIdx = Math.floor((day % 360) / 15);
        var term = SOLAR_TERMS[termIdx] || '节气';
        var cd = window.currentCharData;
        if (!cd) return;
        cd.luck = Math.min(100, (cd.luck || 50) + 1);
        // 季节加成：春木/夏火/秋金/冬水——对应灵根小幅修炼加成（简化为气运反馈）
        if (window.gameLog && window.gameLog.add) {
            window.gameLog.add('🍃 ' + term + '：灵气流转，气运+1', 'info');
        }
    } catch (e) {}
}

if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') {
    window.timeSystem.onNewDaySubscribe(tickSolarTerm);
}

window.getCurrentSolarTerm = function () {
    var day = _currentDay();
    if (day <= 0) return '';
    return SOLAR_TERMS[Math.floor((day % 360) / 15)] || '';
};

})();
