/**
 * talisman-system.js — 符箓效果边界（v12.1）
 * 只实现已明确标记 implemented:true 的基础符箓；高级符仍保持锁定。
 * 目标：物品只有在效果真正成功后才被消耗，战斗加成集中管理。
 */
(function(global) {
    'use strict';

    var state = {
        combatBonuses: {},      // { attack, defense, speed ... }
        bonusActionsLeft: 0,
        shield: 0,
        escapeBonus: 0
    };

    function msg(text, type) {
        if (typeof global.showMessage === 'function') global.showMessage(text, type || 'info');
        else if (typeof console !== 'undefined') console.log(text);
    }

    function apply(template) {
        if (!template || !template.effect) return false;
        var eff = template.effect;
        var applied = false;
        var duration = Math.max(1, Math.floor(Number(eff.duration) || 3));

        if (eff.attack_boost) {
            state.combatBonuses.attack = Math.max(Number(state.combatBonuses.attack) || 0, Number(eff.attack_boost) || 0);
            state.bonusActionsLeft = Math.max(state.bonusActionsLeft, duration);
            msg('📜 ' + template.name + '生效：攻击 +' + eff.attack_boost + '（' + duration + '次攻击）', 'success');
            applied = true;
        }
        if (eff.defense_boost) {
            state.combatBonuses.defense = Math.max(Number(state.combatBonuses.defense) || 0, Number(eff.defense_boost) || 0);
            state.bonusActionsLeft = Math.max(state.bonusActionsLeft, duration);
            msg('📜 ' + template.name + '生效：防御 +' + eff.defense_boost + '（' + duration + '次攻击）', 'success');
            applied = true;
        }
        if (eff.speed_boost) {
            state.combatBonuses.speed = Math.max(Number(state.combatBonuses.speed) || 0, Number(eff.speed_boost) || 0);
            state.bonusActionsLeft = Math.max(state.bonusActionsLeft, duration);
            msg('📜 ' + template.name + '生效：速度 +' + eff.speed_boost, 'success');
            applied = true;
        }
        if (eff.shield) {
            // 护盾按“可吸收总伤害”结算，比固定防御更易控强度。
            state.shield = Math.min(300, Math.max(state.shield, Number(eff.shield) || 0));
            msg('🛡️ ' + template.name + '展开护盾，可吸收 ' + state.shield + ' 点伤害', 'success');
            applied = true;
        }
        if (eff.cleanse) {
            var removed = cleansePlayer();
            msg(removed > 0 ? ('✨ 净化完成，移除 ' + removed + ' 个负面状态') : '✨ 灵台清明，当前没有可净化的负面状态', 'success');
            applied = true;
        }
        if (eff.escape_boost) {
            // 基础逃跑率50%；0.8效果不直接+80个百分点，统一压到95%上限。
            state.escapeBonus = Math.max(state.escapeBonus, Math.min(0.45, Number(eff.escape_boost) * 0.5));
            msg('💨 ' + template.name + '生效：下一次逃跑成功率大幅提高', 'success');
            applied = true;
        }
        if (eff.teleport) {
            var battle = global.currentBattle;
            if (battle) {
                try {
                    battle.isFinished = true;
                    battle.winner = 'escaped';
                    if (battle.log) battle.log.push({ msg: '🌀 你催动传送符，瞬间脱离战斗！' });
                } catch (e) {}
            }
            if (typeof global.closeInteraction === 'function') {
                try { global.closeInteraction(); } catch (e) {}
            }
            if (typeof global.closeBattle === 'function') {
                try { global.closeBattle(); } catch (e) {}
            }
            msg('🌀 传送符发动，你脱离了当前危险。', 'success');
            applied = true;
        }
        return applied;
    }

    function cleansePlayer() {
        var manager = global.statusEffectManager;
        if (!manager || typeof manager.getAllEffects !== 'function') return 0;
        var negative = {
            debuff:1, curse:1, poison:1, disease:1, stun:1, sleep:1, root:1,
            silence:1, bleed:1, burn:1, freeze:1, charm:1, fear:1
        };
        var list = manager.getAllEffects('player').slice();
        var removed = 0;
        list.forEach(function(effect) {
            if (effect && negative[effect.type] && manager.removeEffect('player', effect.name)) removed += 1;
        });
        return removed;
    }

    function getCombatBonuses() {
        if (state.bonusActionsLeft <= 0) return {};
        return Object.assign({}, state.combatBonuses);
    }

    function onPlayerAttackComplete() {
        if (state.bonusActionsLeft > 0) {
            state.bonusActionsLeft -= 1;
            if (state.bonusActionsLeft <= 0) state.combatBonuses = {};
        }
    }

    function absorbDamage(amount) {
        amount = Math.max(0, Number(amount) || 0);
        if (state.shield <= 0 || amount <= 0) return amount;
        var absorbed = Math.min(state.shield, amount);
        state.shield -= absorbed;
        if (absorbed > 0) msg('🛡️ 护身符吸收 ' + Math.floor(absorbed) + ' 点伤害' + (state.shield > 0 ? '（剩余护盾 ' + Math.floor(state.shield) + '）' : ''), 'info');
        return Math.max(0, amount - absorbed);
    }

    function getEscapeChance(base) {
        base = Number(base);
        if (!Number.isFinite(base)) base = 0.5;
        return Math.min(0.95, Math.max(0.05, base + state.escapeBonus));
    }

    function consumeEscapeBoost() {
        state.escapeBonus = 0;
    }

    function reset() {
        state.combatBonuses = {};
        state.bonusActionsLeft = 0;
        state.shield = 0;
        state.escapeBonus = 0;
    }

    var api = {
        apply: apply,
        getCombatBonuses: getCombatBonuses,
        onPlayerAttackComplete: onPlayerAttackComplete,
        absorbDamage: absorbDamage,
        getEscapeChance: getEscapeChance,
        consumeEscapeBoost: consumeEscapeBoost,
        reset: reset,
        debugState: function() { return JSON.parse(JSON.stringify(state)); }
    };
    global.TalismanSystem = api;
    global.XianXia = global.XianXia || {};
    global.XianXia.TalismanSystem = api;

    if (global.StateRegistry && typeof global.StateRegistry.register === 'function') {
        global.StateRegistry.register('talismanState', {
            version: 1,
            export: function() { return JSON.parse(JSON.stringify(state)); },
            import: function(data) {
                reset();
                data = data || {};
                state.combatBonuses = Object.assign({}, data.combatBonuses || {});
                state.bonusActionsLeft = Math.max(0, Number(data.bonusActionsLeft) || 0);
                state.shield = Math.max(0, Number(data.shield) || 0);
                state.escapeBonus = Math.max(0, Number(data.escapeBonus) || 0);
            },
            reset: reset
        });
    }
})(typeof window !== 'undefined' ? window : this);
