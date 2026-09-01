/**
 * arena-system.js — 竞技场闭环（从 app.js 拆出）
 * 负责入场成本、真实战斗结算、奖励封顶、排行与任务事件。
 */
(function (global) {
    'use strict';
    var arenaEnemyData = null;

    function cfg() {
        var a = global.BALANCE_CONFIG && global.BALANCE_CONFIG.arena || {};
        return {
            dailyLimit: Math.max(1, Number(a.dailyLimit) || 5),
            energyCost: Math.max(0, Number(a.energyCost) || 10),
            timeMinutes: Math.max(0, Number(a.timeMinutes) || 30),
            maxRewardStreak: Math.max(0, Number(a.maxRewardStreak) || 10),
            baseContribution: Math.max(0, Number(a.baseContribution) || 50),
            streakContribution: Math.max(0, Number(a.streakContribution) || 10),
            baseSpiritStones: Math.max(0, Number(a.baseSpiritStones) || 30),
            streakSpiritStones: Math.max(0, Number(a.streakSpiritStones) || 5)
        };
    }
    function charData() { return typeof global.getCurrentCharData === 'function' ? global.getCurrentCharData() : global.currentCharData; }
    function notify(msg, type) { if (typeof global.showMessage === 'function') global.showMessage(msg, type || 'info'); }
    function currentDay() { return typeof global.getAbsoluteDay === 'function' ? global.getAbsoluteDay() : (global.gameTime && global.gameTime.currentDay) || 1; }

    function rewardForStreak(streak) {
        var c = cfg();
        var rewardStreak = Math.min(Math.max(0, Number(streak) || 0), c.maxRewardStreak);
        return {
            contribution: c.baseContribution + rewardStreak * c.streakContribution,
            spiritStones: c.baseSpiritStones + rewardStreak * c.streakSpiritStones
        };
    }

    function grantWinRewards(cd, streak) {
        var reward = rewardForStreak(streak);
        if (global.discipleState && global.discipleState.isInSect) {
            global.discipleState.contribution = (Number(global.discipleState.contribution) || 0) + reward.contribution;
        }
        if (global.EconomyTransaction && typeof global.EconomyTransaction.credit === 'function') {
            global.EconomyTransaction.credit('spiritStones', reward.spiritStones);
        } else if (global.inventory && global.inventory.currency) {
            global.inventory.currency.spiritStones = (Number(global.inventory.currency.spiritStones) || 0) + reward.spiritStones;
        }
        cd.arenaStreak = (Number(streak) || 0) + 1;
        cd.arenaWins = (Number(cd.arenaWins) || 0) + 1;
        cd.arenaScore = (Number(cd.arenaScore) || 0) + 10 + Math.min(Number(streak) || 0, 20);
        saveArenaRanking(cd.name, (global.discipleState && (global.discipleState.sectName || global.discipleState.sectId)) || '散修', cd.arenaScore);
        if (global.EventBus) global.EventBus.emit('arena:won', { count: 1, streak: cd.arenaStreak, score: cd.arenaScore });
        return reward;
    }

    function enterArena() {
        var cd = charData();
        if (!cd) { notify('请先创建角色', 'warning'); return false; }
        var c = cfg(), day = currentDay();
        if (cd._arenaDay !== day) { cd._arenaDay = day; cd._arenaDailyCount = 0; }
        if ((Number(cd._arenaDailyCount) || 0) >= c.dailyLimit) { notify('今日竞技次数已达上限（' + c.dailyLimit + '次）', 'warning'); return false; }
        var energy = cd.energy != null ? Number(cd.energy) || 0 : 100;
        if (energy < c.energyCost) { notify('精力不足，无法竞技', 'warning'); return false; }
        cd.energy = energy - c.energyCost;
        cd._arenaDailyCount = (Number(cd._arenaDailyCount) || 0) + 1;
        if (global.timeSystem && typeof global.timeSystem.advanceTime === 'function') global.timeSystem.advanceTime(c.timeMinutes, '竞技场切磋');
        else if (typeof global.advanceTime === 'function') global.advanceTime(c.timeMinutes, '竞技场切磋');

        var enemyLevel = (Number(cd.layer) || 1) + Math.floor(Math.random() * 3);
        var enemy = typeof global.generateRandomEnemy === 'function' ? global.generateRandomEnemy(enemyLevel, 'enemy') : null;
        if (!enemy) return arenaFallbackFight();
        enemy.name = '竞技场对手·' + enemy.name;
        enemy._isArenaOpponent = true;
        arenaEnemyData = enemy;
        if (typeof global.openBattleWithEntity === 'function') global.openBattleWithEntity({ type: 'person', name: enemy.name, data: enemy, _isArenaOpponent: true });
        return true;
    }

    function onArenaBattleEnd(winner) {
        if (!arenaEnemyData) return;
        var cd = charData();
        if (!cd) { arenaEnemyData = null; return; }
        var streak = Number(cd.arenaStreak) || 0;
        if (winner === 'player') {
            var reward = grantWinRewards(cd, streak);
            notify('🏟️ 竞技胜利！' + (global.discipleState && global.discipleState.isInSect ? '贡献+' + reward.contribution + '，' : '') + '灵石+' + reward.spiritStones + '，连胜' + cd.arenaStreak, 'success');
        } else {
            cd.arenaStreak = 0;
            cd.arenaScore = Math.max(0, (Number(cd.arenaScore) || 0) - 5);
            notify('🏟️ 竞技失败，连胜中断。', 'warning');
        }
        if (typeof global.updateCurrencyUI === 'function') global.updateCurrencyUI();
        if (typeof global.updateCharacterStatus === 'function') global.updateCharacterStatus();
        arenaEnemyData = null;
    }

    function arenaFallbackFight() {
        var cd = charData(); if (!cd) return false;
        var streak = Number(cd.arenaStreak) || 0, power = 10;
        try {
            var ma = cd.mainAttributes || {}, vals = Object.keys(ma).map(function(k) { return Number(ma[k]) || 0; });
            if (vals.length) power = vals.reduce(function(a,b){ return a+b; },0) / vals.length;
            power += (Number(cd.layer) || 1) * 2;
        } catch (e) {}
        var foePower = 8 + Math.random() * 20 + Math.min(streak, 20);
        var winChance = Math.max(0.15, Math.min(0.85, 0.5 + (power - foePower) * 0.02));
        if (Math.random() < winChance) {
            var reward = grantWinRewards(cd, streak);
            notify('🏟️ 竞技胜利！' + (global.discipleState && global.discipleState.isInSect ? '贡献+' + reward.contribution + '，' : '') + '灵石+' + reward.spiritStones, 'success');
        } else {
            cd.arenaStreak = 0; cd.arenaScore = Math.max(0, (Number(cd.arenaScore) || 0) - 5);
            notify('🏟️ 竞技失败。', 'warning');
        }
        if (typeof global.updateCurrencyUI === 'function') global.updateCurrencyUI();
        if (typeof global.updateCharacterStatus === 'function') global.updateCharacterStatus();
        return true;
    }

    function saveArenaRanking(name, sect, score) {
        if (!name) return;
        var ranking = [];
        try { ranking = JSON.parse(localStorage.getItem('xianxia_arena_ranking') || '[]'); } catch (e) { ranking = []; }
        var idx = ranking.findIndex(function(r) { return r.name === name; });
        if (idx >= 0) { ranking[idx].score = Math.max(Number(ranking[idx].score) || 0, Number(score) || 0); ranking[idx].sect = sect; }
        else ranking.push({ name: name, sect: sect, score: Number(score) || 0 });
        ranking.sort(function(a,b){ return b.score-a.score; }); ranking = ranking.slice(0,20);
        ranking.forEach(function(r,i){ r.rank=i+1; });
        localStorage.setItem('xianxia_arena_ranking', JSON.stringify(ranking));
    }

    function showArenaRanking() {
        var ranking = [];
        try { ranking = JSON.parse(localStorage.getItem('xianxia_arena_ranking') || '[]'); } catch (e) { ranking = []; }
        if (!ranking.length) ranking = [
            { name:'张三丰', sect:'武当派', score:9999, rank:1 },
            { name:'李逍遥', sect:'蜀山派', score:8888, rank:2 },
            { name:'张小凡', sect:'青云门', score:7777, rank:3 }
        ];
        var html = '<div class="space-y-2">';
        ranking.forEach(function(r) {
            var medal = r.rank===1?'🥇':r.rank===2?'🥈':r.rank===3?'🥉':'#'+r.rank;
            html += '<div class="flex justify-between items-center bg-gray-700/30 p-2 rounded"><span>'+medal+' '+r.name+'</span><span class="text-sm text-gray-400">'+(r.sect||'散修')+'</span><span class="text-sm font-bold text-yellow-400">'+r.score+'</span></div>';
        });
        html += '</div>';
        var modal = document.createElement('div');
        modal.className='fixed inset-0 bg-black/70 flex items-center justify-center z-50';
        modal.onclick=function(e){ if(e.target===modal) modal.remove(); };
        modal.innerHTML='<div class="bg-gray-800 border-2 border-red-500 rounded-xl p-6 max-w-md w-full mx-4"><div class="flex justify-between items-center mb-4"><h3 class="text-xl font-bold text-red-400">⚔️ 门派竞技排名</h3><button onclick="this.closest(\'.fixed\').remove()" class="text-gray-400 hover:text-white text-2xl">&times;</button></div>'+html+'<button onclick="enterArena(); this.closest(\'.fixed\').remove();" class="w-full mt-4 bg-red-600 hover:bg-red-500 text-white py-2 rounded">开始切磋</button></div>';
        document.body.appendChild(modal);
    }

    global.enterArena = enterArena;
    global._onArenaBattleEnd = onArenaBattleEnd;
    global.saveArenaRanking = saveArenaRanking;
    global.showArenaRanking = showArenaRanking;
    global.ArenaSystem = { enter: enterArena, onBattleEnd: onArenaBattleEnd, rewardForStreak: rewardForStreak, showRanking: showArenaRanking };
})(typeof window !== 'undefined' ? window : this);
