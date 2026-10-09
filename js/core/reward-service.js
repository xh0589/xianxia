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

    // DES-38：回执念进账、不念开价。这一通道每一条入账都带夹逼（上限／下限），照抄入参的写法
    // 只要触顶就比账多印一截——而全仓 36 个调用点都直接把这串 messages 上屏。
    // 一律「写前读一次、写后读一次」，拿差值说话；口径与庙会摊前那一句同一把尺（第三十七批）。
    function pushGain(messages, label, want, before, after) {
        // 读不到账（那本账的读者不在位——如纯 node 沙箱只桩了 addReputation）就退回旧口径照报开价，
        // 别拿一个凭 0 减出来的「差值」冒充实话。
        if (before === null || after === null) { messages.push(label + (want > 0 ? '+' : '') + want); return want; }
        var got = num(after) - num(before);
        if (got === want) { messages.push(label + (want > 0 ? '+' : '') + want); return got; }
        messages.push(label + (want > 0 ? '已达上限，实得+' : '已见底，实得') + got);
        return got;
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
        // DES-85 尾（第一百四十二批）：原先这里一律回 `inventory_full_or_invalid_item`，
        // 把**四种不同的失败**糊成一个键：模板不存在／行囊满／快照畸形／事务层没装 addItem。
        // 玩家看到的是「背包空间不足**或**物品无效」——他不知道自己该腾格子还是该报障。
        // 区分信息一直都在：addItem 失败时会把真因写进 window.addItemFailReason
        // （inventory.js 的 no_template／bag_full），这里照账说话，不再猜。
        //
        // ⚠️ 为什么是三个平铺的 return、不是三元表达式：
        // `tests/v24.0-audit-fixes-node.js` 的 AR2/AR2b 用**静态扫 `reason: '字面量'`**
        // 来核对「通道能返回的 reason 集合」与「文案表里的键」两向相等。
        // 写成 `reason: _reason`（变量）那把尺就看不见这三个键了 ⇒ 文案表会被判成「供着通道不会返回的原因」。
        // 平铺写法让三个字面量保持静态可见，尺继续有牙，也比嵌套三元好读。
        var _因 = global.addItemFailReason;
        if (_因 === 'no_template') return { success: false, reason: 'item_no_template', cause: _因 };
        if (_因 === 'bag_full') return { success: false, reason: 'bag_full', cause: _因 };
        return { success: false, reason: 'inventory_failed', cause: _因 || null };
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
            // 真实小世界·货币总闸（world-ledger）：事务成功后正向灵石回出资方——
            // 有出资方（ctx.funding：'city'=当前城悬赏基金）走出资方；缺省走世界市面池
            // （民间酬谢的兜底盘子，月度铸币 2% 缓补）。出资方见薄按实有折付：
            // 短少部分当场收回（刚 credit 足额，钱包必够扣），messages 说人话不静默印钱。
            // 放事务外=池扣不受回滚牵连（物品入包失败时玩家钱包回滚、市面池分文不动）。
            var _fundNote = null;
            if (r.spiritStones > 0 && global.WorldLedger && typeof global.WorldLedger.fundReward === 'function') {
                try {
                    var _fw = global.WorldLedger.fundReward(r.spiritStones, ctx.funding);
                    if (_fw.short > 0) {
                        var _back = Math.min(_fw.short, Math.abs(num(p.spiritStones)));
                        p.spiritStones = num(p.spiritStones) - _back; // 差额收回（刚入账，必够）
                        if (window.inventory && window.inventory.currency) {
                            window.inventory.currency.spiritStones = (Number(window.inventory.currency.spiritStones) || 0) - _back;
                        }
                        _fundNote = '市面钱紧，此次酬谢只凑得 ' + _fw.paid + ' 灵石。';
                    }
                } catch (eWL) { /* 账本缺席按旧口径足额（兼容期），不阻塞结算 */ }
            }
            // v27.13 设施消费回流（对称口：正向有出资方闸，负向有回流口）——
            // 设施语境（ctx.facilitySpend，city-facilities 各 settle 封装已注入）的净支出
            // 六成入该城悬赏基金、四成回世界市面池。计划书条2：澡堂赌坊的钱不再付完即蒸发。
            // 钱庄存取/宗门捐献/朝堂军资不带此标记，钱各归其账。
            var _spendBack = (r.copper < 0 ? -r.copper : 0) + (r.spiritStones < 0 ? -r.spiritStones : 0);
            if (_spendBack > 0 && ctx.facilitySpend && global.WorldLedger && typeof global.WorldLedger.noteFacilitySpend === 'function') {
                try { global.WorldLedger.noteFacilitySpend(_spendBack, ctx.city); } catch (eFB) { /* 回流失败不阻塞结算 */ }
            }
            // v27.13：物品产出登记（主档③改良·总闸）——任务赏/悬赏赏/奇遇/设施奖励凡走本服务的
            // 物品发放都在这一处盖「reward」章，一处顶十处（quest-system 领赏等 36 个调用点全汇到这扇门）。
            // 事务成功后才记账：上面 addSnapshot 任一件失败即整体回滚、根本走不到这。
            // 登记失败绝不拦获得：物品照拿，账少一笔。
            if (r.items.length && global.ItemProvenance && typeof global.ItemProvenance.note === 'function') {
                try {
                    for (var _pi = 0; _pi < r.items.length; _pi++) {
                        global.ItemProvenance.note('reward', r.items[_pi].itemId, r.items[_pi].count);
                    }
                } catch (ePrv) {
                    console.warn('[静默失败] js/core/reward-service.js · apply：奖励物品产出登记未入簿（物品照常到手）', ePrv && ePrv.message);
                }
            }
        }

        var messages = [];
        if (_fundNote) messages.push(_fundNote);
        if (r.exp) {
            var _exp0 = num(p.tempering);
            p.tempering = Math.max(0, _exp0 + r.exp);
            pushGain(messages, '历练', r.exp, _exp0, p.tempering);
        }
        if (r.spiritStones) messages.push('灵石' + (r.spiritStones > 0 ? '+' : '') + r.spiritStones);
        if (r.copper) messages.push('铜钱' + (r.copper > 0 ? '+' : '') + r.copper);
        r.items.forEach(function(it) { messages.push(itemName(it.itemId) + ' x' + it.count); });
        r.take.forEach(function(it) { messages.push(itemName(it.itemId) + ' x-' + it.count); });

        if (r.qi) {
            var _qi0 = num(p.qi);
            p.qi = Math.max(0, Math.min(num(p.maxQi) || 1000, _qi0 + r.qi));
            pushGain(messages, '真气', r.qi, _qi0, p.qi);
        }
        if (r.energy) {
            var _en0 = num(p.energy);
            p.energy = Math.max(0, Math.min(num(p.maxEnergy) || 100, _en0 + r.energy));
            pushGain(messages, '精力', r.energy, _en0, p.energy);
        }
        if (r.health) {
            var maxHealth = num(p.maxHealth) || Math.max(1, num(p.health));
            var _hp0 = num(p.health);
            p.health = Math.max(0, Math.min(maxHealth, _hp0 + r.health));
            pushGain(messages, '生命', r.health, _hp0, p.health);
        }

        if (r.mood) {
            var _mood0 = num(p.mood != null ? p.mood : 80);
            p.mood = Math.max(0, Math.min(100, _mood0 + r.mood));
            pushGain(messages, '心境', r.mood, _mood0, p.mood);
        }

        if (r.cityReputation) {
            var city = resolveCity(ctx);
            if (city && typeof global.addReputation === 'function') {
                var _rpGet = typeof global.getReputationValue === 'function' ? global.getReputationValue : null;
                var _rep0 = _rpGet ? num(_rpGet(city)) : null;
                global.addReputation(city, r.cityReputation);
                pushGain(messages, city + '声望', r.cityReputation, _rep0, _rpGet ? num(_rpGet(city)) : null);
            }
        }
        if (r.notoriety) {
            var _noto0 = num(p.notoriety);
            p.notoriety = _noto0 + r.notoriety;
            // v27.13 恶名分城：恶名变动登记世界账簿（与名气扩散同构）——作案地当日立知，
            // 外城随通缉文书/江湖流言延迟到达。此城犯案，彼城起初不知。
            try {
                if (global.WorldLedger && typeof global.WorldLedger.noteNotorietyChange === 'function') {
                    global.WorldLedger.noteNotorietyChange(r.notoriety);
                }
            } catch (eWN) {}
            pushGain(messages, '恶名', r.notoriety, _noto0, p.notoriety);
        }
        if (r.karma) {
            var _karma0 = num(p.karma);
            p.karma = Math.max(-100, Math.min(100, _karma0 + r.karma));
            pushGain(messages, '业障', r.karma, _karma0, p.karma);
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
            var _fame0 = num(p.fame);
            if (typeof global.addFame === 'function') global.addFame(_fameAmt);
            else p.fame = Math.max(0, Math.min((window.FAME_CAP || 99999), _fame0 + _fameAmt)); // v21.9 名望尺度统一
            // 真实小世界·名气扩散：名望变动登记世界账簿——从当前城随商旅外传，
            // 同城当日知/邻城 2 天/边陲 7 天。名气不再瞬时传千里。
            try {
                if (global.WorldLedger && typeof global.WorldLedger.noteFameChange === 'function') {
                    global.WorldLedger.noteFameChange(_fameAmt);
                }
            } catch (eWL) {}
            pushGain(messages, '角色名气', _fameAmt, _fame0, p.fame);
        }
        if (r.contribution && global.discipleState) {
            var _ctr0 = num(global.discipleState.contribution);
            global.discipleState.contribution = Math.max(0, _ctr0 + r.contribution);
            try { global.sectLedgerNote && global.sectLedgerNote(r.contribution, '宗门奖励结算'); } catch (e) {}
            pushGain(messages, '门派贡献', r.contribution, _ctr0, global.discipleState.contribution);
        }
        if (r.affection && ctx.npcId && global.npcManager && typeof global.npcManager.getNPC === 'function') {
            var npc = global.npcManager.getNPC(ctx.npcId);
            if (npc && typeof npc.changeAffection === 'function') {
                var _affOf = function () {
                    var v = npc.relationship && npc.relationship.affection;
                    return typeof v === 'number' ? v : null;
                };
                var _aff0 = _affOf();
                npc.changeAffection(r.affection);
                pushGain(messages, (npc.name || 'NPC') + '好感', r.affection, _aff0, _affOf());
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
                if (lsAfter !== lsBefore) pushGain(messages, lsOne.name, lsOne.exp, lsBefore, lsAfter);
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
