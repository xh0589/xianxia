// ==================== reincarnation-system.js - v20.0 1.7 转世/轮回二周目 ====================
// 死亡/残魂态可选转世：保留前世 1 门功法记忆 + 1 个 NPC 羁绊 + 部分气运
// 转世后从凡人重修，前世功法修炼更快、对前世羁绊 NPC 有莫名亲切
// 多次转世解锁"宿慧"（incarnations>=3）。依赖：1.1 渡劫失败、soul-state 残魂态

(function () {

// 是否处于残魂态（转世入口前置）
function _inSoulState() {
    return !!(window.SoulStateSystem && typeof window.SoulStateSystem.isInSoulState === 'function'
        && window.SoulStateSystem.isInSoulState());
}

// 转世重修：保留前世记忆/羁绊/部分气运，境界归凡人
function reincarnate() {
    var cd = window.currentCharData;
    if (!cd) { if (window.showMessage) window.showMessage('请先创建角色', 'warning'); return false; }
    // 必须处于残魂态或已死（避免活着就转）
    if (!_inSoulState() && (cd.health || 100) > 0) {
        if (window.showMessage) window.showMessage('肉身尚健，未到转世之时。', 'warning');
        return false;
    }

    // 选前世 1 门主修功法
    var skills = window.currentSkills || {};
    var keepSkill = null;
    for (var k in skills) {
        if (skills[k]) { keepSkill = { id: skills[k].id, name: skills[k].name }; break; }
    }
    // 选 1 个最高好感 NPC 羁绊
    var keepNpcId = null, maxAff = 0;
    try {
        if (window.npcManager && window.npcManager.getAllNPCs) {
            var all = window.npcManager.getAllNPCs() || [];
            for (var i = 0; i < all.length; i++) {
                var n = all[i];
                var a = (n.relationship && n.relationship.affection) || 0;
                if (a > maxAff) { maxAff = a; keepNpcId = n.id; }
            }
        }
    } catch (e) {}
    var keepLuck = Math.floor((cd.luck != null ? cd.luck : 50) * 0.5);
    var prevInc = (cd._pastLifeMemory && cd._pastLifeMemory.incarnations) || 0;

    cd._pastLifeMemory = {
        skill: keepSkill, npcId: keepNpcId, luck: keepLuck,
        incarnations: prevInc + 1
    };

    // 重置境界/状态（保留 name/灵根/attrs——灵魂属性跨世延续）
    cd.realm = '凡人'; cd.layer = 1;
    cd.essence = 0; cd.tempering = 0;
    cd.health = 100; cd.qi = 100; cd.energy = 100; cd.mood = 80;
    cd.luck = 30 + keepLuck; // 转世气运折损后重置
    cd._foundationBonus = 0;
    cd._breakthroughPillBonus = 0;
    if (cd.soulState) cd.soulState.active = false; // 离开残魂态
    // 功法清空（需重学，前世功法靠记忆 buff 重新修更快）
    if (window.currentSkills) { for (var s in window.currentSkills) window.currentSkills[s] = null; }

    var _msg = '🔄 你转世重修，带着前世记忆重新踏上仙途。此为第 ' + cd._pastLifeMemory.incarnations + ' 世轮回。';
    if (cd._pastLifeMemory.incarnations >= 3) _msg += ' 宿慧初醒，前世记忆渐可回溯。';
    if (window.showMessage) window.showMessage(_msg, 'success');
    if (window.updateCharacterStatus) window.updateCharacterStatus();
    if (window.doAutoSave) window.doAutoSave('reincarnation');
    return true;
}

// 前世功法修炼加成（供 cultivationMeditate/cultivateQi 调用）
function pastLifeSkillBonus(skillId) {
    try {
        var cd = window.currentCharData;
        if (!cd || !cd._pastLifeMemory || !cd._pastLifeMemory.skill) return 1.0;
        if (skillId && skillId === cd._pastLifeMemory.skill.id) return 1.3; // 前世功法+30%
    } catch (e) {}
    return 1.0;
}

window.reincarnate = reincarnate;
window.pastLifeSkillBonus = pastLifeSkillBonus;
window._inSoulState = _inSoulState;

})();
