/**
 * protection-system.js — 玩家庇护状态
 * 庇护期限只使用游戏分钟，状态可存档；到期由 GameScheduler 处理，读取时再做一次惰性校验。
 */
(function (global) {
    'use strict';

    var state = null;

    function cfg() {
        return (global.XianXia && global.XianXia.Balance && global.XianXia.Balance.protection) || {
            asylumDurationMinutes: 72 * 60,
            pursuitChanceMultiplier: 0.5,
            damageTakenMultiplier: 0.9
        };
    }

    function nowMinute() {
        return global.GameScheduler ? global.GameScheduler.nowMinute()
            : ((global.timeSystem && global.timeSystem.gameTime && global.timeSystem.gameTime.totalMinutes) || 0);
    }

    function syncAlias() { global.playerProtectionState = state; }

    function cancelExpiry() {
        if (global.GameScheduler) global.GameScheduler.cancel('player_protection_expire');
    }

    function expire(reason) {
        if (!state || !state.active) return false;
        state.active = false;
        state.expiredGameMinute = nowMinute();
        state.expireReason = reason || 'time';
        syncAlias();
        return true;
    }

    function scheduleExpiry() {
        cancelExpiry();
        if (!state || !state.active || !global.GameScheduler) return;
        global.GameScheduler.schedule('protection:expire', state.endGameMinute, null, { id: 'player_protection_expire' });
    }

    function getActive() {
        if (!state || !state.active) return null;
        if (nowMinute() >= Number(state.endGameMinute || 0)) {
            expire('time');
            return null;
        }
        return state;
    }

    function grant(provider, durationMinutes) {
        var c = cfg();
        durationMinutes = Math.max(1, Math.floor(Number(durationMinutes) || c.asylumDurationMinutes));
        var start = nowMinute();
        state = {
            provider: provider && provider.id || null,
            providerName: provider && provider.name || '未知庇护者',
            startGameMinute: start,
            endGameMinute: start + durationMinutes,
            durationMinutes: durationMinutes,
            active: true,
            // 新字段用乘数语义，避免 -0.5 / +1 这种易错换算；effect 保留给旧代码兼容。
            pursuitChanceMultiplier: c.pursuitChanceMultiplier,
            damageTakenMultiplier: c.damageTakenMultiplier,
            effect: {
                pursuitChance: c.pursuitChanceMultiplier - 1,
                damageTaken: c.damageTakenMultiplier
            }
        };
        syncAlias();
        scheduleExpiry();
        return getActive();
    }

    function serialize() { return state ? JSON.parse(JSON.stringify(state)) : null; }
    function deserialize(data) {
        state = data && typeof data === 'object' ? JSON.parse(JSON.stringify(data)) : null;
        syncAlias();
        if (state && state.active) {
            if (nowMinute() >= Number(state.endGameMinute || 0)) expire('load_expired');
            else scheduleExpiry();
        }
    }
    function reset() { cancelExpiry(); state = null; syncAlias(); }

    var api = { grant: grant, getActive: getActive, expire: expire, serialize: serialize, deserialize: deserialize, reset: reset };
    global.PlayerProtectionService = api;
    syncAlias();

    if (global.GameScheduler) global.GameScheduler.registerHandler('protection:expire', function () { expire('time'); return true; });
    if (global.StateRegistry) global.StateRegistry.register('playerProtection', { version: 1, export: serialize, import: deserialize, reset: reset });
})(typeof window !== 'undefined' ? window : this);
