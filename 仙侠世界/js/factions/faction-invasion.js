// ==================== enemy-invasion.js - 敌对势力主动入侵系统 ====================
// 依赖：factions.js

function checkEnemyInvasion() {
    if (!window.currentCharData) return;
    var loc = window.currentCharData.location || '';
    if (!loc) return;
    
    // P2：检查庇护状态（如果有庇护，降低入侵概率）
    var protection = window.PlayerProtectionService ? window.PlayerProtectionService.getActive() : null;
    var protectionActive = !!protection;
    var protectionMultiplier = protection ? (protection.pursuitChanceMultiplier || 0.5) : 1.0;
    
    var factions = window.FACTIONS || {};
    for (var fId in factions) {
        var f = factions[fId];
        if (f.reputation && f.reputation < -30) {
            // 根据庇护状态调整入侵概率
            var baseChance = window.BALANCE_CONFIG?.factions?.enemyInvasionBaseChance ?? 0.05;
            var adjustedProbability = baseChance * protectionMultiplier;
            if (Math.random() < adjustedProbability) {
                var msg = protectionActive ?
                    `⚠️ ${f.name}的势力成员发现了你的行踪（但有${protection.providerName}的庇护，风险降低）` :
                    `⚠️ ${f.name}的势力成员发现了你的行踪，向你发起攻击！`;
                if (window.showMessage) window.showMessage(msg, 'warning');
                if (typeof window.openBattleWithEntity === 'function') {
                    var level = window.currentCharData.level || 10;
                    window.openBattleWithEntity({ type: 'enemy', name: f.name + '刺客', level: level + 5 });
                }
                return;
            }
        }
    }
}

if (window.EventBus && typeof window.EventBus.on === 'function') {
    window.EventBus.on('newDay', function() { checkEnemyInvasion(); });
}

if (typeof window !== 'undefined') { window.checkEnemyInvasion = checkEnemyInvasion; }