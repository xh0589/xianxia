/**
 * reward-service.js — 奖励/代价统一结算
 *
 * 目标：
 * - 货币 + 物品走 EconomyTransaction，避免“奖励发一半”。
 * - 经验、真气、精力、生命、城市声望、恶名、门派贡献、NPC好感统一语义。
 * - `rep` 在设施/世界交互中明确解释为“当前城市声望”，不再写入含义模糊的 currentCharData.reputation。
 */
(function (global) {
    'use strict';

    function num(v) { return Number(v) || 0; }
    function signedInt(v) { return Math.trunc(num(v)); }
    function resolveCity(ctx) {
        ctx = ctx || {};
        if (ctx.city) return ctx.city;
        if (typeof global.getCurrentCityName === 'function') return global.getCurrentCityName() || '';
        if (global.locationSystem && typeof global.locationSystem.getCurrentLocation === 'function') return global.locationSystem.getCurrentLocation() || '';
        return (global.currentCharData && global.currentCharData.location) || '';
    }
    function itemName(id) {
        var t = global.itemById && global.itemById[id];
        return (t && t.name) || id;
    }

    function normalize(spec) {
        spec = spec || {};
        return {
            exp: signedInt(spec.exp),
            spiritStones: signedInt(spec.spiritStones != null ? spec.spiritStones : spec.stones),
            copper: signedInt(spec.copper != null ? spec.copper : spec.gold),
            items: Array.isArray(spec.items) ? spec.items.map(function(it) {
                return { itemId: it && (it.itemId || it.id), count: Math.max(1, Math.floor(num(it && it.count) || 1)) };
            }).filter(function(it) { return !!it.itemId; }) : [],
            qi: signedInt(spec.qiRecovery != null ? spec.qiRecovery : spec.qi),
            energy: signedInt(spec.energy),
            health: signedInt(spec.health),
            cityReputation: signedInt(spec.cityReputation != null ? spec.cityReputation : spec.rep),
            notoriety: signedInt(spec.notoriety != null ? spec.notoriety : spec.noto),
            contribution: signedInt(spec.contribution),
            affection: signedInt(spec.affection),
            fame: signedInt(spec.fame)
        };
    }

    function checkSignedResource(current, delta) {
        if (delta >= 0) return true;
        return num(current) + delta >= 0;
    }

    function apply(spec, ctx) {
        ctx = ctx || {};
        var r = normalize(spec);
        var p = global.currentCharData;
        if (!p) return { success: false, reason: 'no_character', messages: [] };

        // 先验证非经济“代价”，避免货币事务成功后才发现真气/精力不足。
        if (!checkSignedResource(p.qi, r.qi)) return { success: false, reason: 'qi', messages: [] };
        if (!checkSignedResource(p.energy, r.energy)) return { success: false, reason: 'energy', messages: [] };
        if (!checkSignedResource(p.health, r.health)) return { success: false, reason: 'health', messages: [] };

        var hasEconomy = !!(r.spiritStones || r.copper || r.items.length);
        if (hasEconomy) {
            var tx = global.EconomyTransaction;
            if (!tx) return { success: false, reason: 'transaction_unavailable', messages: [] };
            var econ = tx.run(function() {
                if (r.spiritStones < 0 && !tx.debit('spiritStones', Math.abs(r.spiritStones))) return { success: false, reason: 'spiritStones' };
                if (r.copper < 0 && !tx.debit('copper', Math.abs(r.copper))) return { success: false, reason: 'copper' };
                if (r.spiritStones > 0 && !tx.credit('spiritStones', r.spiritStones)) return { success: false, reason: 'spiritStones' };
                if (r.copper > 0 && !tx.credit('copper', r.copper)) return { success: false, reason: 'copper' };
                for (var i = 0; i < r.items.length; i++) {
                    if (!tx.addSnapshot({ templateId: r.items[i].itemId, count: r.items[i].count })) {
                        return { success: false, reason: 'inventory_full_or_invalid_item' };
                    }
                }
                return { success: true };
            });
            if (!econ || econ.success === false) return econ || { success: false, reason: 'economy', messages: [] };
        }

        var messages = [];
        if (r.exp) {
            p.tempering = Math.max(0, num(p.tempering) + r.exp);
            messages.push('历练' + (r.exp > 0 ? '+' : '') + r.exp);
        }
        if (r.spiritStones) messages.push('灵石' + (r.spiritStones > 0 ? '+' : '') + r.spiritStones);
        if (r.copper) messages.push('铜钱' + (r.copper > 0 ? '+' : '') + r.copper);
        r.items.forEach(function(it) { messages.push(itemName(it.itemId) + ' x' + it.count); });

        if (r.qi) {
            p.qi = Math.max(0, Math.min(num(p.maxQi) || 1000, num(p.qi) + r.qi));
            messages.push('真气' + (r.qi > 0 ? '+' : '') + r.qi);
        }
        if (r.energy) {
            p.energy = Math.max(0, Math.min(num(p.maxEnergy) || 100, num(p.energy) + r.energy));
            messages.push('精力' + (r.energy > 0 ? '+' : '') + r.energy);
        }
        if (r.health) {
            var maxHealth = num(p.maxHealth) || Math.max(1, num(p.health));
            p.health = Math.max(0, Math.min(maxHealth, num(p.health) + r.health));
            messages.push('生命' + (r.health > 0 ? '+' : '') + r.health);
        }

        if (r.cityReputation) {
            var city = resolveCity(ctx);
            if (city && typeof global.addReputation === 'function') {
                global.addReputation(city, r.cityReputation);
                messages.push(city + '声望' + (r.cityReputation > 0 ? '+' : '') + r.cityReputation);
            }
        }
        if (r.notoriety) {
            p.notoriety = num(p.notoriety) + r.notoriety;
            messages.push('恶名' + (r.notoriety > 0 ? '+' : '') + r.notoriety);
        }
        if (r.fame) {
            if (typeof global.addFame === 'function') global.addFame(r.fame);
            else p.fame = Math.max(0, Math.min(100, num(p.fame) + r.fame));
            messages.push('角色名气' + (r.fame > 0 ? '+' : '') + r.fame);
        }
        if (r.contribution && global.discipleState) {
            global.discipleState.contribution = Math.max(0, num(global.discipleState.contribution) + r.contribution);
            messages.push('门派贡献' + (r.contribution > 0 ? '+' : '') + r.contribution);
        }
        if (r.affection && ctx.npcId && global.npcManager && typeof global.npcManager.getNPC === 'function') {
            var npc = global.npcManager.getNPC(ctx.npcId);
            if (npc && typeof npc.changeAffection === 'function') {
                npc.changeAffection(r.affection);
                messages.push((npc.name || 'NPC') + '好感' + (r.affection > 0 ? '+' : '') + r.affection);
            }
        }

        if (typeof global.updateCurrencyUI === 'function' && hasEconomy) global.updateCurrencyUI();
        if (typeof global.updateCharacterStatus === 'function') global.updateCharacterStatus();
        if (global.EventBus && typeof global.EventBus.emit === 'function') {
            global.EventBus.emit('reward:applied', { source: ctx.source || 'unknown', city: resolveCity(ctx), reward: r });
        }
        return { success: true, messages: messages, reward: r };
    }

    var api = { normalize: normalize, apply: apply };
    global.RewardService = api;
    global.XianXia = global.XianXia || {};
    global.XianXia.RewardService = api;
})(typeof window !== 'undefined' ? window : this);
