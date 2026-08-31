// ==================== faction-stance.js - 势力立场博弈系统 ====================
// 加入一个势力降低对立势力声望、声望变化触发任务、多势力斡旋
// 依赖：factions.js

var FACTION_STANCES = {
    '正道联盟': { enemies: ['魔教'], friends: ['散修联盟'], neutral: ['妖族', '地下势力'] },
    '魔教': { enemies: ['正道联盟', '散修联盟'], friends: ['地下势力'], neutral: ['妖族'] },
    '妖族': { enemies: [], friends: ['地下势力'], neutral: ['正道联盟', '魔教', '散修联盟'] },
    '地下势力': { enemies: [], friends: ['魔教', '妖族'], neutral: ['正道联盟', '散修联盟'] },
    '散修联盟': { enemies: ['魔教'], friends: ['正道联盟'], neutral: ['妖族', '地下势力'] }
};

function joinFactionWithStance(factionId) {
    var stance = FACTION_STANCES[factionId];
    if (!stance) return;
    if (stance.enemies) {
        for (var i = 0; i < stance.enemies.length; i++) {
            if (typeof window.changeFactionReputation === 'function') {
                window.changeFactionReputation(stance.enemies[i], -30);
                if (window.showMessage) window.showMessage('加入' + factionId + '，与' + stance.enemies[i] + '关系恶化（声望-30）', 'warning');
            }
        }
    }
    if (stance.friends) {
        for (var j = 0; j < stance.friends.length; j++) {
            if (typeof window.changeFactionReputation === 'function') {
                window.changeFactionReputation(stance.friends[j], 10);
            }
        }
    }
}

if (typeof window !== 'undefined') {
    window.FACTION_STANCES = FACTION_STANCES;
    window.joinFactionWithStance = joinFactionWithStance;
}