// ==================== dao-companion-deep.js - 道侣深度互动 ====================
// 心情需求、主动互动、专属剧情
// 依赖：sects-system.js

function updateDaoCompanionDeep() {
    var bonds = window.currentCharData?.bonds || {};
    for (var npcId in bonds) {
        var bond = bonds[npcId];
        if (bond.type === 'dao_companion') {
            var npc = window.npcManager?.getNPC(npcId);
            if (!npc) continue;
            if (!npc._companionData) npc._companionData = { lastInteraction: 0, mood: 70, needs: { talk: 0, accompany: 0, gift: 0 } };
            var daysSince = window.gameTime ? window.gameTime.currentDay - (npc._companionData.lastInteraction || 0) : 0;
            if (daysSince > 3 && Math.random() < 0.2) {
                if (window.showMessage) window.showMessage('💕 你的道侣' + npc.name + '想和你一起散步。', 'info');
                npc._companionData.needs.accompany += 10;
            }
            if (daysSince > 5 && Math.random() < 0.3) {
                if (window.showMessage) window.showMessage('💕 ' + npc.name + '感到有些孤单，希望你能陪陪TA。', 'info');
            }
        }
    }
}

if (window.EventBus && typeof window.EventBus.on === 'function') {
    window.EventBus.on('newDay', function() { updateDaoCompanionDeep(); });
}

if (typeof window !== 'undefined') { window.updateDaoCompanionDeep = updateDaoCompanionDeep; }