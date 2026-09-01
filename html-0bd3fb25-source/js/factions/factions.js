/**
 * factions.js - 敌对势力系统 v1.0
 * 魔教、妖族、势力声望、冲突
 */

// ============ 势力定义 ============
var FACTIONS = {
    demon_cult: {
        id: 'demon_cult',
        name: '魔教',
        icon: '👹',
        color: 'text-red-500',
        desc: '修炼魔道功法的邪恶组织，企图统治九州',
        reputation: 0, // 0-10000，负值代表敌对
        headquarters: '万魔窟',
        leaders: ['魔教教主·蚩尤', '左护法·血煞', '右护法·鬼影'],
        members: ['魔教长老', '魔教护法', '魔教使者', '魔教弟子'],
        traits: ['残暴', '狡诈', '嗜血']
    },
    demon_beast: {
        id: 'demon_beast',
        name: '妖族',
        icon: '🐾',
        color: 'text-green-500',
        desc: '天地灵兽修炼成精，与人类争夺生存空间',
        reputation: 0,
        headquarters: '万妖山',
        leaders: ['妖皇·九尾', '妖将·白虎', '妖师·玄龟'],
        members: ['妖王', '妖将', '大妖', '妖兽'],
        traits: ['野性', '领地意识', '族群观念']
    },
    righteous_alliance: {
        id: 'righteous_alliance',
        name: '正道联盟',
        icon: '⚔️',
        color: 'text-blue-400',
        desc: '正道门派组成的联盟，维护九州秩序',
        reputation: 500, // 初始友好
        headquarters: '太虚山',
        leaders: ['盟主·天机子', '执法长老·铁面', '军师·诸葛'],
        members: ['正道弟子', '执法使', '巡察使'],
        traits: ['正义', '秩序', '保守']
    },
    underworld: {
        id: 'underworld',
        name: '地下势力',
        icon: '🌙',
        color: 'text-purple-400',
        desc: '隐藏在暗处的组织，从事情报和暗杀活动',
        reputation: 0,
        headquarters: '地下城',
        leaders: ['影主·无面', '毒蛛·黑寡妇', '情报王·千面'],
        members: ['刺客', '间谍', '情报贩子'],
        traits: ['神秘', '危险', '无处不在']
    },
    rogue_cultivators: {
        id: 'rogue_cultivators',
        name: '散修联盟',
        icon: '🍂',
        color: 'text-amber-400',
        desc: '无门无派的散修组织，自由但松散',
        reputation: 200,
        headquarters: '散修城',
        leaders: ['散修之王·独孤', '万事通·百晓生'],
        members: ['散修', '游商', '流浪修士'],
        traits: ['自由', '务实', '团结']
    }
};

// ============ 势力声望等级 ============
var FACTION_REPUTATION_LEVELS = [
    { name: '死敌', min: -10000, color: 'text-red-600', effects: '遇袭概率+50%', attitude: '敌对' },
    { name: '仇恨', min: -5000, color: 'text-red-400', effects: '遇袭概率+30%', attitude: '敌对' },
    { name: '敌视', min: -1000, color: 'text-orange-400', effects: '遇袭概率+15%', attitude: '冷淡' },
    { name: '中立', min: -999, color: 'text-gray-400', effects: '正常互动', attitude: '中立' },
    { name: '友善', min: 1000, color: 'text-green-400', effects: '商店折扣5%', attitude: '友好' },
    { name: '尊敬', min: 3000, color: 'text-blue-400', effects: '商店折扣10%+专属任务', attitude: '友好' },
    { name: '崇拜', min: 6000, color: 'text-yellow-400', effects: '商店折扣20%+专属物品', attitude: '崇敬' },
    { name: '传说', min: 10000, color: 'text-purple-400', effects: '所有功能解锁+隐藏内容', attitude: '传奇' }
];

// ============ 势力状态 ============
var factionState = {
    reputation: {}, // { factionId: number }
    activeConflicts: [], // 当前冲突列表
    completedMissions: [], // 已完成任务
    factionRanks: {} // { factionId: rank }
};

// ============ 初始化 ============
function initFactionSystem() {
    // 初始化所有势力声望
    for (var id in FACTIONS) {
        factionState.reputation[id] = FACTIONS[id].reputation || 0;
        factionState.factionRanks[id] = 0;
    }
    
    // 尝试加载存档
    var saved = localStorage.getItem('xianxia_factions');
    if (saved) {
        try {
            var data = JSON.parse(saved);
            for (var key in data.reputation) {
                if (factionState.reputation[key] !== undefined) {
                    factionState.reputation[key] = data.reputation[key];
                }
            }
            factionState.activeConflicts = data.activeConflicts || [];
            factionState.completedMissions = data.completedMissions || [];
        } catch(e) {}
    }
    
    if (window.gameLog) window.gameLog.add('势力系统已初始化', 'info');
}

// ============ 声望操作 ============

// 修改势力声望
function changeFactionReputation(factionId, amount) {
    if (factionState.reputation[factionId] === undefined) return 0;
    factionState.reputation[factionId] = Math.max(-10000, Math.min(10000, factionState.reputation[factionId] + amount));
    saveFactionData();
    
    var level = getFactionReputationLevel(factionId);
    var faction = FACTIONS[factionId];
    if (faction && amount !== 0) {
        var dir = amount > 0 ? '提升' : '降低';
        if (window.showMessage) {
            window.showMessage(faction.icon + ' ' + faction.name + '声望' + dir + Math.abs(amount) + '（当前：' + level.name + '）', amount > 0 ? 'success' : 'error');
        }
    }
    return factionState.reputation[factionId];
}

// 获取声望等级
function getFactionReputationLevel(factionId) {
    var rep = factionState.reputation[factionId] || 0;
    var level = FACTION_REPUTATION_LEVELS[3]; // 默认中立
    for (var i = 0; i < FACTION_REPUTATION_LEVELS.length; i++) {
        if (i <= 3 && rep <= FACTION_REPUTATION_LEVELS[i].min) level = FACTION_REPUTATION_LEVELS[i];
        if (i > 3 && rep >= FACTION_REPUTATION_LEVELS[i].min) level = FACTION_REPUTATION_LEVELS[i];
    }
    return level;
}

// 获取声望折扣
function getFactionDiscount(factionId) {
    var rep = factionState.reputation[factionId] || 0;
    if (rep >= 10000) return 0.2;
    if (rep >= 6000) return 0.15;
    if (rep >= 3000) return 0.1;
    if (rep >= 1000) return 0.05;
    return 0;
}

// ============ 势力冲突 ============

// 触发势力冲突
function triggerFactionConflict(faction1Id, faction2Id) {
    var f1 = FACTIONS[faction1Id];
    var f2 = FACTIONS[faction2Id];
    if (!f1 || !f2) return null;
    
    var conflict = {
        id: 'conflict_' + Date.now(),
        faction1: faction1Id,
        faction2: faction2Id,
        name: f1.name + ' vs ' + f2.name,
        startTime: Date.now(),
        status: 'active', // active, resolved
        winner: null,
        events: []
    };
    
    factionState.activeConflicts.push(conflict);
    saveFactionData();
    
    if (window.gameLog) {
        window.gameLog.add('⚔️ ' + f1.name + '与' + f2.name + '爆发冲突！', 'warning');
    }
    
    return conflict;
}

// 参与势力冲突（战斗）
function participateInConflict(conflictId, side) {
    var conflict = null;
    for (var i = 0; i < factionState.activeConflicts.length; i++) {
        if (factionState.activeConflicts[i].id === conflictId) {
            conflict = factionState.activeConflicts[i];
            break;
        }
    }
    if (!conflict) return false;
    
    // 奖励
    var repGain = 50;
    changeFactionReputation(side, repGain);
    changeFactionReputation(side === conflict.faction1 ? conflict.faction2 : conflict.faction1, -30);
    
    if (window.showMessage) {
        window.showMessage('参与冲突，' + FACTIONS[side].name + '声望+' + repGain, 'success');
    }
    
    return true;
}

// ============ 势力任务 ============

// 生成势力任务
function generateFactionMission(factionId) {
    var faction = FACTIONS[factionId];
    if (!faction) return null;
    
    var missionTypes = ['暗杀', '收集', '侦察', '护送', '破坏'];
    var type = missionTypes[Math.floor(Math.random() * missionTypes.length)];
    
    var mission = {
        id: 'mission_' + factionId + '_' + Date.now(),
        factionId: factionId,
        type: type,
        title: faction.name + '·' + type + '任务',
        description: faction.name + '需要你执行一次' + type + '任务。',
        difficulty: Math.floor(Math.random() * 5) + 1,
        rewards: {
            reputation: 50 + Math.floor(Math.random() * 100),
            spiritStones: 100 + Math.floor(Math.random() * 400)
        },
        status: 'available',
        timeLimit: 3 + Math.floor(Math.random() * 5) // 天数
    };
    
    return mission;
}

// ============ 存档 ============
function saveFactionData() {
    try {
        localStorage.setItem('xianxia_factions', JSON.stringify({
            reputation: factionState.reputation,
            activeConflicts: factionState.activeConflicts,
            completedMissions: factionState.completedMissions
        }));
    } catch(e) {}
}

// ============ 导出 ============
window.FACTIONS = FACTIONS;
window.FACTION_REPUTATION_LEVELS = FACTION_REPUTATION_LEVELS;
window.factionState = factionState;
window.initFactionSystem = initFactionSystem;
window.changeFactionReputation = changeFactionReputation;
window.getFactionReputationLevel = getFactionReputationLevel;
window.getFactionDiscount = getFactionDiscount;
window.triggerFactionConflict = triggerFactionConflict;
window.participateInConflict = participateInConflict;
window.generateFactionMission = generateFactionMission;