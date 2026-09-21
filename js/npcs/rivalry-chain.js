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

// ==================== v22.3 定期寻仇调度 ====================
// 这条链自 v20.0 落地时就没接上头：决战与胜负结算都挂在战斗流程上，
// 但「定期寻仇」没有任何调度调用——仇恨堆到天上也永远没人上门。现在补上：
// 每日结算扫一遍高仇恨名单，有人憋得住劲就低概率拦路寻仇；同一宿敌两场寻仇间隔至少数日。
var REVENGE_CHANCE = 0.35;         // 每日有仇可报时的寻仇概率
var REVENGE_COOLDOWN_DAYS = 5;     // 同一宿敌两场寻仇的最小间隔
var CD_KEY = 'xianxia_rival_chain_cd';
var _revengePending = false;       // 一场寻仇已在路上，不再叠第二场

function loadRevengeCd() {
    try { return JSON.parse(localStorage.getItem(CD_KEY) || '{}') || {}; } catch (e) { return {}; }
}
function saveRevengeCd(cd) {
    try { localStorage.setItem(CD_KEY, JSON.stringify(cd || {})); } catch (e) {}
}
function currentDayNum() {
    var t = window.timeSystem;
    if (t && typeof t.getAbsoluteDay === 'function') { try { var d = t.getAbsoluteDay(); if (d) return d; } catch (e) {} }
    return (t && t.gameTime && t.gameTime.currentDay) || 1;
}

function maybeRivalRevenge() {
    try {
        if (!window.currentCharData) return false;
        if (window.currentBattle) return false;                                   // 战斗中不叠台
        if (typeof window.isInSoulState === 'function' && window.isInSoulState()) return false; // 残魂之体不被寻仇
        var rivals = getRivals();
        if (!rivals.length) return false;
        var day = currentDayNum();
        var cds = loadRevengeCd();
        var ready = [];
        for (var i = 0; i < rivals.length; i++) {
            var n = rivals[i];
            if (!n || n.isDead || n.isMissing) continue;
            var last = cds[n.id];
            // 冷却未过不寻仇；旧档日数大于当前日（新开档日数归零）视为过期记录
            if (typeof last === 'number' && last <= day && day - last < REVENGE_COOLDOWN_DAYS) continue;
            ready.push(n);
        }
        if (!ready.length) return false;
        if (Math.random() >= REVENGE_CHANCE) return false;
        var pick = ready[Math.floor(Math.random() * ready.length)];
        cds[pick.id] = day;
        saveRevengeCd(cds);
        // 延迟一步开打：跨日结算常发生在赶路/闭关的同步循环里，让人先落脚，杀气再到
        _revengePending = true;
        setTimeout(function () {
            _revengePending = false;
            try {
                if (window.currentBattle) return;
                duelRival(pick.id);
            } catch (e) {}
        }, 1500);
        return true;
    } catch (e) { return false; }
}

// 跨日结算即扫仇——寻仇是世界的主动，不等玩家想起
if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') {
    window.timeSystem.onNewDaySubscribe(function () {
        if (_revengePending) return;
        maybeRivalRevenge();
    });
}

window.getRivals = getRivals;
window.duelRival = duelRival;
window.settleRivalDuel = settleRivalDuel;
window.maybeRivalRevenge = maybeRivalRevenge;

})();
