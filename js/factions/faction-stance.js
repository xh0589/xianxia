// ==================== faction-stance.js - 势力立场博弈系统 ====================
// 加入一个势力降低对立势力声望、声望变化触发任务、多势力斡旋
// 依赖：factions.js

// 这张表**以势力展示名为键**，enemies/friends 里也是展示名——屏上念的就是这几个字。
// 落账一律先换成势力 id（认键笔 factionIdByName 在 factions.js，此处不另抄一份中文名表）。
var FACTION_STANCES = {
    '正道联盟': { enemies: ['魔教'], friends: ['散修联盟'], neutral: ['妖族', '地下势力'] },
    '魔教': { enemies: ['正道联盟', '散修联盟'], friends: ['地下势力'], neutral: ['妖族'] },
    '妖族': { enemies: [], friends: ['地下势力'], neutral: ['正道联盟', '魔教', '散修联盟'] },
    '地下势力': { enemies: [], friends: ['魔教', '妖族'], neutral: ['正道联盟', '散修联盟'] },
    '散修联盟': { enemies: ['魔教'], friends: ['正道联盟'], neutral: ['妖族', '地下势力'] }
};

// 展示名 → 势力 id；认不出（不在 FACTIONS 的 name 里）即返回 null 并在控制台留一行
function stanceFactionId(name) {
    if (typeof window.factionIdByName !== 'function') return null;
    var id = window.factionIdByName(name);
    if (!id && typeof console !== 'undefined' && console.warn) {
        console.warn('[faction-stance] 立场表里的「' + name + '」在势力表里认不出，这一笔声望没有入账');
    }
    return id;
}

// 入参可给势力 id 也可给展示名（本表按展示名索引）
function joinFactionWithStance(factionKey) {
    var selfId = (typeof window.resolveFactionKey === 'function') ? window.resolveFactionKey(factionKey) : null;
    var selfName = (selfId && window.FACTIONS && window.FACTIONS[selfId]) ? window.FACTIONS[selfId].name : factionKey;
    var stance = FACTION_STANCES[selfName];
    if (!stance) return;
    if (typeof window.changeFactionReputation !== 'function') return;
    var i, j, id;
    if (stance.enemies) {
        for (i = 0; i < stance.enemies.length; i++) {
            id = stanceFactionId(stance.enemies[i]);
            if (!id) continue;   // 认不出这本账就不喊「关系恶化」——旧代码先喊后写、写了也是零
            window.changeFactionReputation(id, -30);
            if (window.showMessage) window.showMessage('加入' + selfName + '，与' + stance.enemies[i] + '关系恶化（声望-30）', 'warning');
        }
    }
    if (stance.friends) {
        for (j = 0; j < stance.friends.length; j++) {
            id = stanceFactionId(stance.friends[j]);
            if (!id) continue;
            window.changeFactionReputation(id, 10);
        }
    }
}

if (typeof window !== 'undefined') {
    window.FACTION_STANCES = FACTION_STANCES;
    window.joinFactionWithStance = joinFactionWithStance;
}