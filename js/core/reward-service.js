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
                // 第八十三波·实例账：snap=完整实例快照（uid/耐久/强化），赎回/回购原物奉还不再造白板新货
                return { itemId: it && (it.itemId || it.id), count: Math.max(1, Math.floor(num(it && it.count) || 1)), snap: (it && it.snap && typeof it.snap === 'object') ? it.snap : null };
            }).filter(function(it) { return !!it.itemId; }) : [],
            // v20.8：take = 真扣物品（当铺售断/抵押），与 items 同走经济事务，缺货整体回滚
            // 第八十三波：take 可带 uid——按实例扣货（当的就是那一件，不祸及同模板的兄弟件）
            take: Array.isArray(spec.take) ? spec.take.map(function(it) {
                return { itemId: it && (it.itemId || it.id), count: Math.max(1, Math.floor(num(it && it.count) || 1)), uid: (it && it.uid) ? String(it.uid) : null };
            }).filter(function(it) { return !!it.itemId; }) : [],
            qi: signedInt(spec.qiRecovery != null ? spec.qiRecovery : spec.qi),
            energy: signedInt(spec.energy),
            health: signedInt(spec.health),
            cityReputation: signedInt(spec.cityReputation != null ? spec.cityReputation : spec.rep),
            notoriety: signedInt(spec.notoriety != null ? spec.notoriety : spec.noto),
            contribution: signedInt(spec.contribution),
            affection: signedInt(spec.affection),
            fame: signedInt(spec.fame),
            karma: signedInt(spec.karma),
            // 第六十四/六十五波：心境增量入账——茶馆棋墨、瓦舍看戏这类消遣的花销终于有统一通道
            //（此前 mood 各处直写、无回执，花钱买开心买的是纯数字）
            mood: signedInt(spec.mood),
            // v20.90 lifeSkill = {name, exp}——生活技能长进（勾栏练音律、登台卖艺都走这条统一通道）
            // v20.94 也收数组：一个动作可同时长两门（说书长口才也长音律）
            lifeSkill: normalizeLifeSkill(spec.lifeSkill)
        };
    }

    function normalizeLifeSkill(raw) {
        if (!raw) return null;
        var arr = Array.isArray(raw) ? raw : [raw];
        var out = [];
        for (var i = 0; i < arr.length; i++) {
            var one = arr[i];
            if (one && typeof one === 'object' && one.name) {
                out.push({ name: String(one.name), exp: signedInt(one.exp != null ? one.exp : 1) });
            }
        }
        return out.length ? out : null;
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

        var hasEconomy = !!(r.spiritStones || r.copper || r.items.length || r.take.length);
        if (hasEconomy) {
            var tx = global.EconomyTransaction;
            if (!tx) return { success: false, reason: 'transaction_unavailable', messages: [] };
            var econ = tx.run(function() {
                if (r.spiritStones < 0 && !tx.debit('spiritStones', Math.abs(r.spiritStones))) return { success: false, reason: 'spiritStones' };
                if (r.copper < 0 && !tx.debit('copper', Math.abs(r.copper))) return { success: false, reason: 'copper' };
                if (r.spiritStones > 0 && !tx.credit('spiritStones', r.spiritStones)) return { success: false, reason: 'spiritStones' };
                if (r.copper > 0 && !tx.credit('copper', r.copper)) return { success: false, reason: 'copper' };
                for (var i = 0; i < r.items.length; i++) {
                    // 第八十三波：带快照按实例还原（uid/耐久/强化原样），无快照照旧按模板补货
                    var _snap = r.items[i].snap || { templateId: r.items[i].itemId, count: r.items[i].count };
                    if (!tx.addSnapshot(_snap)) {
                        return { success: false, reason: 'inventory_full_or_invalid_item' };
                    }
                }
                // v20.8：take 与给物同一事务——扣不够就整体回滚，杜绝"白拿钱不交货"
                for (var j = 0; j < r.take.length; j++) {
                    if (r.take[j].uid) {
                        // 第八十三波：按实例扣货——扣完验明正身（uid 对应的那件确实是这个模板），错号整体回滚
                        var _rsnap = tx.removeByUid(r.take[j].uid, r.take[j].count);
                        if (!_rsnap || _rsnap.templateId !== r.take[j].itemId) {
                            return { success: false, reason: 'missing_item' };
                        }
                    } else if (!tx.removeByTemplate(r.take[j].itemId, r.take[j].count)) {
                        return { success: false, reason: 'missing_item' };
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
        r.take.forEach(function(it) { messages.push(itemName(it.itemId) + ' x-' + it.count); });

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

        if (r.mood) {
            p.mood = Math.max(0, Math.min(100, num(p.mood != null ? p.mood : 80) + r.mood));
            messages.push('心境' + (r.mood > 0 ? '+' : '') + r.mood);
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
        if (r.karma) {
            p.karma = Math.max(-100, Math.min(100, num(p.karma) + r.karma));
            messages.push('业障' + (r.karma > 0 ? '+' : '') + r.karma);
            if (typeof global.updateKarmaDisplay === 'function') {
                try { global.updateKarmaDisplay(p.karma, 'karma'); } catch (e) {}
            }
        }
        if (r.fame) {
            // 第一百零九波：年目标政策「声名远播」（reputation_20）——30 天内正名望进账再涨两成
            //（此前 policyBuffs 全库只写不读，达成「外交结盟」发的 buff 是空头条子）
            var _fameAmt = r.fame;
            try {
                if (_fameAmt > 0 && global.SectYearGoal && typeof global.SectYearGoal.hasPolicyBuff === 'function' && global.SectYearGoal.hasPolicyBuff('reputation_20')) {
                    _fameAmt = Math.round(_fameAmt * 1.2);
                }
            } catch (ePB) {}
            if (typeof global.addFame === 'function') global.addFame(_fameAmt);
            else p.fame = Math.max(0, Math.min((window.FAME_CAP || 99999), num(p.fame) + _fameAmt)); // v21.9 名望尺度统一
            messages.push('角色名气' + (_fameAmt > 0 ? '+' : '') + _fameAmt);
        }
        if (r.contribution && global.discipleState) {
            global.discipleState.contribution = Math.max(0, num(global.discipleState.contribution) + r.contribution);
            try { global.sectLedgerNote && global.sectLedgerNote(r.contribution, '宗门奖励结算'); } catch (e) {}
            messages.push('门派贡献' + (r.contribution > 0 ? '+' : '') + r.contribution);
        }
        if (r.affection && ctx.npcId && global.npcManager && typeof global.npcManager.getNPC === 'function') {
            var npc = global.npcManager.getNPC(ctx.npcId);
            if (npc && typeof npc.changeAffection === 'function') {
                npc.changeAffection(r.affection);
                messages.push((npc.name || 'NPC') + '好感' + (r.affection > 0 ? '+' : '') + r.affection);
            }
        }
        // v20.90：生活技能熟练长进——0~100 封边，与创角/转世同一把尺（v20.94 支持一次长多门）
        if (r.lifeSkill && r.lifeSkill.length) {
            p.lifeSkills = p.lifeSkills || {};
            for (var lsi = 0; lsi < r.lifeSkill.length; lsi++) {
                var lsOne = r.lifeSkill[lsi];
                var lsBefore = num(p.lifeSkills[lsOne.name]);
                var lsAfter = Math.max(0, Math.min(100, lsBefore + lsOne.exp));
                p.lifeSkills[lsOne.name] = lsAfter;
                if (lsAfter !== lsBefore) {
                    messages.push(lsOne.name + (lsAfter > lsBefore ? '+' : '') + (lsAfter - lsBefore));
                }
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
