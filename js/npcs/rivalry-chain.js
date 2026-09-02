// ==================== rivalry-chain.js - v20.0 2.9 宿敌长期对抗链 ====================
// 高仇恨 NPC 定期寻仇→最终决战，跨境界长期对抗
// 复用 NPC.relationship.hatred，无新存档。依赖：1.4 NPC、battle

(function () {

// 取所有仇恨>60 的宿敌
function getRivals() {
    var r = [];
    try {
        if (!window.npcManager || !window.npcManager.getAllNPCs) return r;
        var all = window.npcManager.getAllNPCs() || [];
        for (var i = 0; i < all.length; i++) {
            var n = all[i];
            if (n && n.relationship && (n.relationship.hatred || 0) > 60) r.push(n);
        }
    } catch (e) {}
    return r;
}

// 寻仇决战：与宿敌一战，胜降其仇恨/败损气血
function duelRival(npcId) {
    var cd = window.currentCharData;
    if (!cd) { if (window.showMessage) window.showMessage('请先创建角色', 'warning'); return false; }
    var npc = window.npcManager && window.npcManager.getNPC(npcId);
    if (!npc) { if (window.showMessage) window.showMessage('查无此人。', 'warning'); return false; }
    var hatred = (npc.relationship && npc.relationship.hatred) || 0;
    if (hatred <= 0) { if (window.showMessage) window.showMessage(npc.name + ' 并非你的仇敌。', 'info'); return false; }
    // 生成宿敌对手（强度随玩家境界+仇恨）
    var tier = (typeof window.getRealmTier === 'function') ? window.getRealmTier(cd.realm) : 3;
    var isFinal = hatred >= 90;
    var enemyData = {
        name: (isFinal ? '【死敌】' : '') + npc.name, type: 'elite', physiologyType: 'humanoid',
        level: tier * 3 + Math.floor(hatred / 10),
        attack: 35 + tier * 5 + Math.floor(hatred / 5), defense: 18 + tier * 3, speed: 22,
        maxDurability: 100 + tier * 15 + hatred, durabilities: { chest: 100 + tier * 15 + hatred },
        combatAbilities: []
    };
    if (window.startBattle) {
        var b = window.startBattle(enemyData);
        if (b) { b._isRivalDuel = true; b._rivalNpcId = npcId; b._rivalFinal = isFinal; }
    }
    if (window.showMessage) window.showMessage(isFinal ? '⚔️ 宿敌最终决战！' : '⚔️ ' + npc.name + ' 前来寻仇！', isFinal ? 'error' : 'warning');
    return true;
}

// 战后结算（由 app.js 战斗分支调用）
function settleRivalDuel(won) {
    try {
        var b = window.currentBattle;
        if (!b || !b._isRivalDuel) return;
        var npc = window.npcManager && window.npcManager.getNPC(b._rivalNpcId);
        if (!npc || !npc.relationship) return;
        if (won) {
            npc.relationship.hatred = Math.max(0, (npc.relationship.hatred || 0) - (b._rivalFinal ? 90 : 30));
            if (window.DataManager && window.DataManager.addSpiritStones) window.DataManager.addSpiritStones(b._rivalFinal ? 200 : 50);
            if (window.showMessage) window.showMessage(b._rivalFinal ? '🎯 死敌伏诛！恩怨了结。' : '你击退了' + npc.name + '的寻仇。', 'success');
        } else {
            var cd = window.currentCharData;
            if (cd) cd.health = Math.max(1, (cd.health || 100) - 30);
            if (window.showMessage) window.showMessage(npc.name + ' 的寻仇让你重伤。', 'warning');
        }
    } catch (e) {}
}

window.getRivals = getRivals;
window.duelRival = duelRival;
window.settleRivalDuel = settleRivalDuel;

})();
