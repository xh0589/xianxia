// ==================== high-planes.js - v20.0 1.10 高位面地图+御剑飞行 ====================
// 节点大地图（轻量）：筑基+御剑旅行（耗真气/减时）、元婴+入灵界、化神+入魔界
// 连续大地图/御剑空中战留后续。依赖：0.2.1 境界解锁

(function () {

// 御剑飞行：筑基+，消耗真气，时间减半
function flyTravel(dest) {
    var cd = window.currentCharData;
    if (!cd) { if (window.showMessage) window.showMessage('请先创建角色', 'warning'); return false; }
    var tier = (typeof window.getRealmTier === 'function') ? window.getRealmTier(cd.realm) : 0;
    if (tier < 2) { if (window.showMessage) window.showMessage('筑基方可御剑飞行。', 'warning'); return false; }
    if ((cd.qi || 0) < 20) { if (window.showMessage) window.showMessage('真气不足御剑（需≥20）。', 'warning'); return false; }
    if (!dest) { if (window.showMessage) window.showMessage('未指定目的地。', 'warning'); return false; }
    cd.qi = Math.max(0, (cd.qi || 0) - 20);
    cd.location = dest;
    // 御剑比步行快一倍（30分钟 vs 60分钟）
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(30, '御剑飞行');
    }
    if (window.showMessage) window.showMessage('🗡️ 你御剑腾空，飞往 ' + dest + '。', 'success');
    if (window.updateCharacterStatus) window.updateCharacterStatus();
    return true;
}

// 进入高位面：元婴+灵界、化神+魔界
function enterPlane(plane) {
    var cd = window.currentCharData;
    if (!cd) { if (window.showMessage) window.showMessage('请先创建角色', 'warning'); return false; }
    var tier = (typeof window.getRealmTier === 'function') ? window.getRealmTier(cd.realm) : 0;
    var sub = '';
    if (plane === '灵界') {
        if (tier < 4) { if (window.showMessage) window.showMessage('元婴方可感应灵界。', 'warning'); return false; }
        sub = '蓬莱仙境';
    } else if (plane === '魔界') {
        if (tier < 5) { if (window.showMessage) window.showMessage('化神方可涉足魔界。', 'warning'); return false; }
        sub = '九幽深渊';
    } else {
        if (window.showMessage) window.showMessage('未知位面。', 'warning'); return false;
    }
    cd.location = plane + '·' + sub;
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(120, '跨越位面');
    }
    if (window.showMessage) window.showMessage('🌀 你跨越位面屏障，抵达 ' + plane + '·' + sub + '。', 'success');
    if (window.updateCharacterStatus) window.updateCharacterStatus();
    return true;
}

window.flyTravel = flyTravel;
window.enterPlane = enterPlane;

})();
