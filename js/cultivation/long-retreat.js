// ==================== long-retreat.js - 长期闭关 ====================
// v18.8：把"修真无岁月"接到现有时间/NPC/寿元/世界事件系统上。
// v18.9：新增"闭关至下次事件"+ 出关世界摘要（summarizeRange）。
// 不新增持久状态：闭关只是一次长行动，结果写回既有角色、功法与世界状态。
(function (global) {
    'use strict';

    var RETREAT_OPTIONS = [
        { days: 7, label: '七日小闭关', costPerDay: 5, desc: '稳固周天，适合短期积累真元' },
        { days: 30, label: '一月闭关', costPerDay: 5, desc: '世界照常运转，NPC会继续生活与修炼' },
        { days: 90, label: '一季死关', costPerDay: 5, desc: '时间跨度很长，出关时世事可能已经变化' }
    ];

    // 事件类目可作为"闭关至事件"的目标；与 world-calendar 同步
    var RETREAT_TARGET_CATEGORIES = [
        { key: 'auction', label: '下次拍卖（坊市）' },
        { key: 'world_event', label: '下次世界事件' },
        { key: 'sect_event', label: '下次宗门事件' },
        { key: 'dungeon_window', label: '下次秘境窗口' }
    ];

    function getSpiritStones() {
        return Number(global.inventory && global.inventory.currency && global.inventory.currency.spiritStones) || 0;
    }

    function spendSpiritStones(amount) {
        if (!global.inventory || !global.inventory.currency) return false;
        if ((Number(global.inventory.currency.spiritStones) || 0) < amount) return false;
        global.inventory.currency.spiritStones -= amount;
        if (global.currentCharData) global.currentCharData.spiritStones = global.inventory.currency.spiritStones;
        if (typeof global.updateCurrencyUI === 'function') global.updateCurrencyUI();
        return true;
    }

    function getRetreatDailyYield() {
        var player = global.currentCharData || {};
        var realmIndex = typeof global.getRealmIndex === 'function' ? global.getRealmIndex(player.realm) : 0;
        if (realmIndex < 0) realmIndex = 0;
        var base = typeof global.getEssenceGainByRealm === 'function' ? global.getEssenceGainByRealm(realmIndex) : 5;
        var mul = 350;
        var bonus = typeof global.getRootCultivationBonus === 'function' ? global.getRootCultivationBonus() : 1;

        try {
            var season = global.timeSystem && typeof global.timeSystem.getSeasonBonus === 'function' ? global.timeSystem.getSeasonBonus() : null;
            if (season && season.cultivation) bonus *= season.cultivation;
        } catch (e) {}
        try { if (typeof global.getHouseBonus === 'function') bonus *= (global.getHouseBonus('cultivation') || 1); } catch (e2) {}
        try { if (typeof global.getCultivationSpeedBonusFromQi === 'function') bonus *= (global.getCultivationSpeedBonusFromQi() || 1); } catch (e3) {}
        try {
            if (typeof global.getActiveWorldEventModifiers === 'function') {
                var wm = global.getActiveWorldEventModifiers();
                if (wm && wm.cultivation) bonus *= wm.cultivation;
            }
        } catch (e4) {}
        try {
            if (player.mutatedRoots && player.mutatedRoots.thunder) bonus *= (typeof global.getRootMutationBonus === 'function' ? global.getRootMutationBonus('thunder_cultivation') : 1.05);
            if (player.mutatedRoots && player.mutatedRoots.wind) bonus *= (typeof global.getRootMutationBonus === 'function' ? global.getRootMutationBonus('wind_cultivation') : 1.05);
            if (player.mutatedRoots && player.mutatedRoots.ice) bonus *= (typeof global.getRootMutationBonus === 'function' ? global.getRootMutationBonus('ice_cultivation') : 1.05);
        } catch (e5) {}
        try {
            if (typeof global.getBondBonuses === 'function') {
                var bond = global.getBondBonuses();
                if (bond && bond.cultivation > 1) bonus *= bond.cultivation;
            }
        } catch (e6) {}
        var mainSkillId = global.currentSkills && global.currentSkills.skill_main;
        if (mainSkillId) bonus *= 1.10;

        return { essence: Math.max(1, Math.floor(base * mul * bonus)), mainSkillId: mainSkillId || null };
    }

    function getOption(days) {
        return RETREAT_OPTIONS.find(function (o) { return o.days === Number(days) }) || null;
    }

    // ============ v18.9 寿元硬保护 ============
    /**
     * 玩家寿元硬上限（绝对游戏日）。
     * 从 window.playerLifespan 读 remainingDays；不可考则返回 Infinity。
     */
    function getPlayerDeathDay() {
        try {
            var ls = global.playerLifespan;
            var today = global.timeSystem && global.timeSystem.gameTime ? global.timeSystem.gameTime.currentDay : 1;
            if (!ls || ls.isImmortal) return Infinity;
            var remain = Number(ls.remainingDays);
            if (!Number.isFinite(remain) || remain < 0) return Infinity;
            return today + remain;
        } catch (e) { return Infinity; }
    }

    /**
     * 构造"闭关期间世界摘要"。4 类（宗门/市场/世界/NPC）从 WorldCalendar.summarizeRange 聚合。
     * @param {number} startDay 闭关开始日（含）
     * @param {number} endDay 闭关结束日（含）
     * @returns {string} 单条可读长消息
     */
    function buildRetreatSummary(startDay, endDay) {
        if (!global.WorldCalendar || typeof global.WorldCalendar.summarizeRange !== 'function') return '';
        var sum = global.WorldCalendar.summarizeRange(startDay, endDay);
        if (!sum || !sum.items || !sum.items.length) return '闭关期间世界无重大事件。';
        // 4 类聚合
        var buckets = { market: [], sect: [], world: [], npc: [], other: [] };
        for (var i = 0; i < sum.items.length; i++) {
            var it = sum.items[i];
            if (it.category === 'auction') buckets.market.push(it);
            else if (it.category === 'sect_event' || it.category === 'sect_meeting' || it.category === 'sect_tournament') buckets.sect.push(it);
            else if (it.category === 'world_event' || it.category === 'dungeon_window') buckets.world.push(it);
            else if (it.category === 'npc_appointment') buckets.npc.push(it);
            else buckets.other.push(it);
        }
        var lines = ['🪷 闭关' + (endDay - startDay) + '日（第 ' + startDay + ' 天 → 第 ' + endDay + ' 天）期间：'];
        function describe(arr, label) {
            if (!arr.length) return label + '无事。';
            var parts = arr.slice(0, 3).map(function (x) { return x.title; });
            return label + parts.join('；') + (arr.length > 3 ? ' 等' + arr.length + '项' : '') + '。';
        }
        if (buckets.market.length) lines.push('• 坊市：' + describe(buckets.market, ''));
        if (buckets.sect.length) lines.push('• 宗门：' + describe(buckets.sect, ''));
        if (buckets.world.length) lines.push('• 世界：' + describe(buckets.world, ''));
        if (buckets.npc.length) lines.push('• NPC：' + describe(buckets.npc, ''));
        if (buckets.other.length) lines.push('• 其他：' + describe(buckets.other, ''));
        // v20.0：出关看行情——所在地丹药/药材/矿材/法器 贱/平/贵 + 时价乘数
        try {
            if (global.MarketDynamic && typeof global.MarketDynamic.priceMul === 'function') {
                var city = '中州';
                try {
                    if (global.WorldLoop && typeof global.WorldLoop.mapMarketCity === 'function') {
                        var loc = (global.locationSystem && global.locationSystem.getCurrentLocation && global.locationSystem.getCurrentLocation()) || '';
                        city = global.WorldLoop.mapMarketCity(loc);
                    }
                } catch (eCity) {}
                var cats = ['丹药', '药材', '矿材', '法器'];
                var bits = [];
                var snapshot = { day: endDay, city: city, muls: {} };
                for (var ci = 0; ci < cats.length; ci++) {
                    var mul = global.MarketDynamic.priceMul(city, cats[ci]);
                    if (typeof mul !== 'number') continue;
                    snapshot.muls[cats[ci]] = mul;
                    var tag = mul <= 0.85 ? '贱' : (mul >= 1.15 ? '贵' : '平');
                    bits.push(cats[ci] + tag + '×' + mul.toFixed(2));
                }
                if (bits.length) lines.push('• 时价（' + city + '）：' + bits.join('；'));
                // 剩余任务#3：存出关时价快照，供药铺/坊市对照显示涨跌
                if (global.currentCharData) {
                    global.currentCharData._retreatMarket = snapshot;
                }
            }
        } catch (ePrice) {}
        return lines.join('\n');
    }

    // ============ 核心循环（被两种入口共享） ============
    /**
     * 跑一次闭关；可在 dueFlag 被设为 true 时提前 break。
     * @param {number} plannedDays 计划闭关天数
     * @param {Object} opts
     *   - costPerDay 默认 5
     *   - maxIterations 安全上限（避免 due 永远不触发）
     *   - getDueFlag 返回 {stop:boolean, reason?:string}
     *   - endDayGetter 每次循环返回当前 endDay（用于摘要）
     * @returns {Object|null} {days, essence, insight, mainSkillId, cost, stoppedReason}
     */
    function runRetreatLoop(plannedDays, opts) {
        opts = opts || {};
        var costPerDay = Number(opts.costPerDay) || 5;
        var maxIterations = Number(opts.maxIterations) || plannedDays;
        var player = global.currentCharData;
        if (!player) return null;
        if (global.checkSoulBlock && global.checkSoulBlock('闭关')) return null;
        if (global.document && global.document.querySelector && global.document.querySelector('.battle-modal')) {
            if (global.showMessage) global.showMessage('战斗中无法闭关', 'warning');
            return null;
        }
        if (!global.timeSystem || typeof global.timeSystem.advanceTime !== 'function') {
            if (global.showMessage) global.showMessage('时间系统未就绪，无法闭关', 'error');
            return null;
        }
        if (plannedDays < 1) {
            if (global.showMessage) global.showMessage('闭关天数必须 ≥ 1', 'warning');
            return null;
        }
        var cost = plannedDays * costPerDay;
        if (getSpiritStones() < cost) {
            if (global.showMessage) global.showMessage('维持闭关阵法需要灵石 ' + cost + '，当前不足', 'error');
            return null;
        }
        var hp = Number(player.health);
        var maxHp = Number(player.maxHealth) || 100;
        if (Number.isFinite(hp) && hp < maxHp * 0.5) {
            if (global.showMessage) global.showMessage('伤势过重，不宜长时间闭关', 'warning');
            return null;
        }
        if (!spendSpiritStones(cost)) return null;

        var startDay = global.timeSystem.gameTime ? global.timeSystem.gameTime.currentDay : 1;
        var totalEssence = 0;
        var mainSkillId = null;
        var actualDays = 0;
        var stoppedReason = null;
        var oldRetreat = global._isInLongRetreat;
        var oldSuppress = global._suppressTimeFlowMessages;
        global._isInLongRetreat = true;
        global._suppressTimeFlowMessages = true;
        try {
            for (var d = 0; d < plannedDays && d < maxIterations; d++) {
                if (opts.getDueFlag) {
                    var flag = opts.getDueFlag() || {};
                    if (flag.stop) { stoppedReason = flag.reason || 'due'; break; }
                }
                var y = getRetreatDailyYield();
                totalEssence += y.essence;
                mainSkillId = y.mainSkillId || mainSkillId;
                if (y.mainSkillId && typeof global.addProficiencyExp === 'function') {
                    try { global.addProficiencyExp(y.mainSkillId, 48); } catch (eProf) {}
                }
                global.timeSystem.advanceTime(1440, '');
                actualDays++;
                // 每日结束后再查 dueFlag（避免"最后一天 work 已做但 dueFlag 还没查"的 bug）
                if (opts.getDueFlag) {
                    var flag2 = opts.getDueFlag() || {};
                    if (flag2.stop) { stoppedReason = flag2.reason || 'due'; break; }
                }
            }
        } finally {
            global._isInLongRetreat = oldRetreat;
            global._suppressTimeFlowMessages = oldSuppress;
        }

        player.essence = (Number(player.essence) || 0) + totalEssence;
        player.qi = Number(player.maxQi) || player.qi || 0;
        player.energy = Number(player.maxEnergy) || 100;
        var insightGain = Math.floor(actualDays / 30);
        if (insightGain > 0 && typeof global.insightPoints !== 'undefined') {
            global.insightPoints = (Number(global.insightPoints) || 0) + insightGain;
        }
        if (global.EventBus && typeof global.EventBus.emit === 'function') {
            try { global.EventBus.emit('cultivation:completed', { type: 'long_retreat', days: actualDays, plannedDays: plannedDays, minutes: actualDays * 1440, essence: totalEssence, stoppedReason: stoppedReason }); } catch (eBus) {}
        }
        if (typeof global.updateCharacterStatus === 'function') global.updateCharacterStatus();
        if (global.showMessage) {
            var endDay = global.timeSystem.gameTime ? global.timeSystem.gameTime.currentDay : startDay + actualDays;
            var extra = insightGain > 0 ? '，领悟点+' + insightGain : '';
            var stopNote = stoppedReason ? '（提前出关：' + stoppedReason + '）' : '';
            global.showMessage('🔒 闭关结束：第' + startDay + '天 → 第' + endDay + '天，' + actualDays + '日' + stopNote + '，真元+' + totalEssence + extra, 'success');
            var summary = buildRetreatSummary(startDay, endDay);
            if (summary) global.showMessage(summary, 'info');
        }
        return { days: actualDays, plannedDays: plannedDays, essence: totalEssence, insight: insightGain, mainSkillId: mainSkillId, cost: cost, stoppedReason: stoppedReason, startDay: startDay, endDay: (global.timeSystem && global.timeSystem.gameTime) ? global.timeSystem.gameTime.currentDay : startDay + actualDays };
    }

    function startLongRetreat(days) {
        var opt = getOption(days);
        var player = global.currentCharData;
        if (!opt || !player) return false;
        if (typeof global.confirm === 'function' && !global.confirm('确定' + opt.label + '？\n将消耗灵石' + (opt.days * opt.costPerDay) + '，并让世界真实推进' + opt.days + '天。')) return false;
        return runRetreatLoop(opt.days, { costPerDay: opt.costPerDay });
    }

    /**
     * v18.9：闭关至下一个指定 category 事件触发。
     * 实现：通过 WorldCalendar.getNextByCategory 算目标日 + 寿元硬保护 + maxDays 上限。
     * 订阅 EventBus('worldCalendar:due') 监听目标 category 触发；触发即提前出关。
     * @param {string} category 'auction' / 'world_event' / 'sect_event' / 'dungeon_window'
     * @param {number} maxDays 安全上限（默认 90）
     * @returns {Object|null}
     */
    function startLongRetreatUntilEvent(category, maxDays) {
        if (!global.currentCharData) return null;
        if (!global.WorldCalendar || typeof global.WorldCalendar.getNextByCategory !== 'function') {
            if (global.showMessage) global.showMessage('世界日程系统未就绪', 'error');
            return null;
        }
        maxDays = Number(maxDays) || 90;
        if (maxDays < 1) maxDays = 90;
        var today = global.timeSystem && global.timeSystem.gameTime ? global.timeSystem.gameTime.currentDay : 1;
        var next = global.WorldCalendar.getNextByCategory(category, today);
        if (!next) {
            if (global.showMessage) global.showMessage('未来 ' + maxDays + ' 日内没有' + (RETREAT_TARGET_CATEGORIES.find(function (c) { return c.key === category; }) || { label: category }).label, 'warning');
            // 降级：跑 7 日普通闭关
            if (typeof global.confirm === 'function' && global.confirm('改做七日小闭关？')) {
                return startLongRetreat(7);
            }
            return null;
        }
        var targetDay = next.dueAbsoluteDay;
        var deathDay = getPlayerDeathDay();
        var cappedByLifespan = false;
        if (Number.isFinite(deathDay) && targetDay >= deathDay) {
            targetDay = Math.max(today + 1, Math.floor(deathDay) - 1);
            cappedByLifespan = true;
        }
        var days = targetDay - today;
        if (days > maxDays) { days = maxDays; }
        if (days < 1) {
            if (global.showMessage) global.showMessage('目标事件距今不足 1 日，无法闭关至该日', 'warning');
            return null;
        }

        // 设置 dueFlag：订阅 worldCalendar:due，命中目标 category 即停
        var hit = { stop: false, reason: null };
        var unsub = null;
        function onDue(payload) {
            if (!payload || !payload.event) return;
            if (payload.event.category !== category) return;
            hit.stop = true;
            hit.reason = payload.event.title + '（' + (payload.ctx && payload.ctx.currentDay ? ('第' + payload.ctx.currentDay + '天') : '') + '）';
            if (unsub) { try { unsub(); } catch (e) {} }
        }
        if (global.EventBus && typeof global.EventBus.on === 'function') {
            unsub = global.EventBus.on('worldCalendar:due', onDue);
        }

        // 确认弹窗
        var meta = RETREAT_TARGET_CATEGORIES.find(function (c) { return c.key === category; }) || { label: category };
        var confirmMsg = '确定闭关至' + meta.label + '？\n目标：第 ' + targetDay + ' 天 · 距今 ' + days + ' 日\n消耗灵石 ' + (days * 5) + (cappedByLifespan ? '\n（已被寿元上限截断）' : '');
        if (typeof global.confirm === 'function' && !global.confirm(confirmMsg)) {
            if (unsub) try { unsub(); } catch (e) {}
            return null;
        }

        if (cappedByLifespan && global.showMessage) {
            global.showMessage('⚠️ 目标事件已超出寿元上限，闭关将在寿元前 1 日提前出关', 'warning');
        }

        var result = runRetreatLoop(days, {
            costPerDay: 5,
            maxIterations: days + 5, // 安全：实际由 hit.stop 退出
            getDueFlag: function () { return hit; }
        });
        if (unsub) try { unsub(); } catch (e) {}
        if (result) {
            result.targetDay = targetDay;
            result.cappedByLifespan = cappedByLifespan;
            result.category = category;
        }
        return result;
    }

    function openLongRetreatUI() {
        if (!global.currentCharData) {
            if (global.showMessage) global.showMessage('请先创建角色', 'warning');
            return;
        }
        var html = '<div class="space-y-3"><p class="text-sm text-gray-300">闭关会一次推进较长的游戏时间。期间NPC修炼、寿元、宗门日结与世界系统照常推进；普通随机日常不会打断闭关。</p>';
        // 固定档位
        RETREAT_OPTIONS.forEach(function (o) {
            var cost = o.days * o.costPerDay;
            html += '<button onclick="startLongRetreat(' + o.days + '); this.closest(\'#xianxia-modal-overlay\')?.remove();" class="w-full text-left bg-indigo-800 hover:bg-indigo-700 p-3 rounded border border-indigo-600">' +
                '<span class="text-indigo-200 font-bold">🔒 ' + o.label + '</span><br>' +
                '<span class="text-xs text-gray-400">' + o.desc + ' · ' + o.days + '天 · 阵法耗费' + cost + '灵石</span></button>';
        });
        // v18.9：闭关至下次事件
        html += '<div class="mt-4 pt-3 border-t border-gray-600"><p class="text-xs text-amber-400 mb-2">📅 闭关至下次事件（v18.9）：</p>';
        if (global.WorldCalendar && typeof global.WorldCalendar.getNextByCategory === 'function') {
            var now = global.timeSystem && global.timeSystem.gameTime ? global.timeSystem.gameTime.currentDay : 1;
            RETREAT_TARGET_CATEGORIES.forEach(function (cat) {
                var next = global.WorldCalendar.getNextByCategory(cat.key, now);
                if (!next) {
                    html += '<button disabled class="w-full text-left bg-gray-700/40 p-2 rounded text-xs text-gray-500 mb-1">🔒 至' + cat.label + '：暂无</button>';
                } else {
                    var dleft = next.dueAbsoluteDay - now;
                    html += '<button onclick="startLongRetreatUntilEvent(\'' + cat.key + '\', 90); this.closest(\'#xianxia-modal-overlay\')?.remove();" class="w-full text-left bg-amber-800 hover:bg-amber-700 p-2 rounded text-xs mb-1">' +
                        '<span class="text-amber-200 font-bold">🔒 至' + cat.label + '：第 ' + next.dueAbsoluteDay + ' 天（' + dleft + ' 日后）</span><br>' +
                        '<span class="text-gray-400">' + next.title + ' · 约 ' + (dleft * 5) + ' 灵石</span></button>';
                }
            });
        } else {
            html += '<p class="text-xs text-gray-500">世界日程未就绪</p>';
        }
        html += '</div>';
        html += '<p class="text-xs text-gray-500">闭关只积累修为与功法熟练，不自动替你突破境界；遇到瓶颈仍需出关亲自突破。出关时会汇总闭关期间世界发生的大事。</p></div>';
        if (typeof global.showModal === 'function') global.showModal('🔒 长期闭关', html);
    }

    global.RETREAT_OPTIONS = RETREAT_OPTIONS;
    global.RETREAT_TARGET_CATEGORIES = RETREAT_TARGET_CATEGORIES;
    global.getRetreatDailyYield = getRetreatDailyYield;
    global.startLongRetreat = startLongRetreat;
    global.startLongRetreatUntilEvent = startLongRetreatUntilEvent;
    global.openLongRetreatUI = openLongRetreatUI;
})(typeof window !== 'undefined' ? window : this);
