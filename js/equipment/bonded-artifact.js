// ==================== bonded-artifact.js - v20.0 1.8 本命法宝/法宝成长 ====================
// 金丹+可炼制本命法宝（绑定不可易主），喂材料升级，战斗加成随等级
// 觉醒技能/化形留后续扩展。依赖：0.2.2 五行（法宝元素随主功法）

(function () {

function getBA() {
    var cd = window.currentCharData;
    if (!cd) return null;
    if (!cd._bondedArtifact) cd._bondedArtifact = null;
    return cd._bondedArtifact;
}

// 炼制本命法宝：金丹+，扣材料+灵石，绑定
function forgeBondedArtifact(name) {
    var cd = window.currentCharData;
    if (!cd) { if (window.showMessage) window.showMessage('请先创建角色', 'warning'); return false; }
    var tier = (typeof window.getRealmTier === 'function') ? window.getRealmTier(cd.realm) : 0;
    if (tier < 3) { if (window.showMessage) window.showMessage('需金丹以上方可凝聚本命法宝。', 'warning'); return false; }
    if (cd._bondedArtifact) { if (window.showMessage) window.showMessage('你已有本命法宝「' + cd._bondedArtifact.name + '」，性命相连不可易主。', 'warning'); return false; }
    // 扣灵石
    var cost = 300;
    if (window.DataManager && window.DataManager.deductSpiritStones && !window.DataManager.deductSpiritStones(cost)) {
        if (window.showMessage) window.showMessage('炼制需 ' + cost + ' 灵石。', 'warning');
        return false;
    }
    // 取主功法元素
    var element = 'neutral';
    try { if (typeof window._getMainTechniqueElement === 'function') element = window._getMainTechniqueElement(); } catch (e) {}
    cd._bondedArtifact = {
        name: name || '本命法宝',
        level: 1, exp: 0, expMax: 50,
        durability: 100, maxDurability: 100,
        element: element
    };
    if (window.showMessage) window.showMessage('🔱 你凝聚本命法宝「' + cd._bondedArtifact.name + '」，与其性命相连！', 'success');
    if (window.updateCharacterStatus) window.updateCharacterStatus();
    return true;
}

// 喂材料升级：消耗背包1个材料→exp+10，达阈值升级
function feedArtifact() {
    var cd = window.currentCharData;
    if (!cd || !cd._bondedArtifact) { if (window.showMessage) window.showMessage('你尚未炼制本命法宝。', 'warning'); return false; }
    var ba = cd._bondedArtifact;
    // 找背包第一个材料
    var matUid = null, slotIdx = -1;
    try {
        if (window.inventory && window.inventory.slots) {
            for (var i = 0; i < window.inventory.slots.length; i++) {
                var sl = window.inventory.slots[i];
                if (sl && sl.templateId && window.itemById && window.itemById[sl.templateId] && window.itemById[sl.templateId].type === 'material') {
                    matUid = sl.uid; slotIdx = i; break;
                }
            }
        }
    } catch (e) {}
    if (!matUid) { if (window.showMessage) window.showMessage('背包无材料可喂。', 'warning'); return false; }
    if (typeof window.removeItem === 'function') window.removeItem(matUid, 1);
    ba.exp = (ba.exp || 0) + 10;
    var leveled = false;
    while (ba.exp >= ba.expMax && ba.level < 10) {
        ba.exp -= ba.expMax;
        ba.level += 1;
        ba.expMax = 50 + ba.level * 30;
        leveled = true;
    }
    if (leveled) {
        if (window.showMessage) window.showMessage('🔱 本命法宝「' + ba.name + '」升阶至 ' + ba.level + ' 阶！', 'success');
    } else {
        if (window.showMessage) window.showMessage('本命法宝吸纳材料，经验 +10（' + ba.exp + '/' + ba.expMax + '）', 'info');
    }
    if (window.updateCharacterStatus) window.updateCharacterStatus();
    return true;
}

// 战斗加成倍率（供 buildPlayerBattleEntity 调用）：每阶 +5% 攻防
function artifactCombatMul() {
    var ba = getBA();
    if (!ba) return 1.0;
    return 1 + (ba.level - 1) * 0.05;
}

window.forgeBondedArtifact = forgeBondedArtifact;
window.feedArtifact = feedArtifact;
window.artifactCombatMul = artifactCombatMul;
window.getBA = getBA;

})();
