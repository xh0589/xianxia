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
        { key: 'dungeon_window', label: '下次秘境窗口关窗' },
        { key: 'festival', label: '下次节令（庙会）' }
    ];

    // v27.13：①-漏洞-1 闭关成本恒定——90 日死关=450 灵石，炼气肉痛、化神零钱（灵石贬值了、闭关价没变）。
    // 修法（主档口径）：costPerDay 挂境界档，"境界×5"档位表——档=window.REALM_ORDER 序（炼气=1…渡劫=9，
    // 飞升=10、金仙=11），日价=档×5。闭关档位表全值：凡人 5 / 炼气 5 / 筑基 10 / 金丹 15 / 元婴 20 / 化神 25 /
    // 炼虚 30 / 合体 35 / 大乘 40 / 渡劫 45 / 飞升 50 / 金仙 55（灵石/日）。炼气 5/日与旧价同——主档
    // "练气肉痛"的原价原样保留，只抬高位面那头。
    // 争议取舍：取 **A 案（挂境界倍率）**——不跨模块、改动面小；B 案（挂所在城物价，与行情时滞同账）留口：
    // 全部取价（三档确认弹窗/闭关至事件/UI 报价）都收口在 getRetreatCostPerDay() 这一扇门，
    // 日后要接 MarketDynamic.priceMul(城,'杂货') 之类只改此一处。
    // 境界序不手抄第二份（DES-92 单一真源纪律）：主读 window.REALM_ORDER；缺席退 getRealmIndex
    // （REALM_CONFIG 切点只到渡劫，飞升/金仙返 -1 → max(1,·) 落最低档）；两头皆缺按炼气档照旧，不挡人进关。
    // 凡人（序 0）与认不出的境界名一律按最低档兜底——阵法只认最低消费，不发免费闭关。
    // 定档时机：**入关时一次定档，关内不逐日重估**——闭关本就不自动突破（UI 结尾明说"不自动替你突破"），
    // 且预付/退款必须同一单价账才对得上（runRetreatLoop 的 refund 按 costPerDay 退）；取简单一致的一头。
    var RETREAT_BASE_COST_PER_DAY = 5; // 炼气档（1 档 × 5），兼作全部兜底价
    function getRetreatCostPerDay() {
        var realm = (global.currentCharData && global.currentCharData.realm) || '';
        try {
            if (Array.isArray(global.REALM_ORDER)) {
                var i = global.REALM_ORDER.indexOf(String(realm).trim());
                return Math.max(1, i) * RETREAT_BASE_COST_PER_DAY; // 凡人/无名 = 0 → 提到最低档 1
            }
        } catch (eOrder) {
            console.warn('[静默失败] js/cultivation/long-retreat.js · getRetreatCostPerDay：REALM_ORDER 读档失败，退旧尺重试', eOrder && eOrder.message);
        }
        try {
            if (typeof global.getRealmIndex === 'function') {
                var ri = global.getRealmIndex(realm); // 旧尺：炼气=0…渡劫=8；凡人/飞升/金仙=-1
                return Math.max(1, ri + 1) * RETREAT_BASE_COST_PER_DAY;
            }
        } catch (eIdx) {
            console.warn('[静默失败] js/cultivation/long-retreat.js · getRetreatCostPerDay：getRealmIndex 读档失败，按炼气档计', eIdx && eIdx.message);
        }
        return RETREAT_BASE_COST_PER_DAY;
    }

    // ============ v27.13：①-新增-2 闭关不是保险箱 ============
    // 主档口径：闭关期间每日按宿敌/恶名档掷打扰；掷中即弹两难——
    //   「强行出关」＝闭关中止、收成按已过天数折算（多预付的阵法费走既有 refund 账退）、
    //              当场撞见（接现有宿敌遭遇/夜袭正门：有宿敌走 duelRival（rivalry-chain，挂 _isRivalDuel
    //              走既有寻仇结算），无宿敌走 startBattle 挂 _isCaveSiege（cave-siege 同一张战后结算桌）——不造新战斗）；
    //   「闭目不动」＝这一夜过去了，今日收成折损一档（与心魔滋扰同一档折法：减半），
    //              出关回执里留一句「洞府外的脚印」余味。
    // 概率档位表（宿敌数/本地已知恶名两本账**取高者**定档；基础率刻意压低——闭关多数日子该是太平的）：
    //   · 不掷（太平）：无活着的宿敌 且 恶名 <40——没人记得你，山门当然清净；
    //   · 低档 0.02/日：1 名宿敌 或 恶名 ≥40；
    //   · 中档 0.04/日：2-3 名宿敌 或 恶名 ≥70；
    //   · 高档 0.07/日：≥4 名宿敌 或 恶名 ≥100。
    //   （参照：90 日死关低档期望约 1.8 次；闭关头三日不掷——追三个月也要赶路，脚步声不会第一天就到。）
    // 冷却：触发过一次（无论两难选哪边）十日内不再扰；冷却日挂 charData._retreatDisturbLastDay
    //   （运行时态，不入 game-state 存档白名单——读档丢失的后果只是可能多扰一次，方向无害）。
    // 兜底照旧：getRivals/WorldLedger.knownNotoriety/境界尺缺席一律退 0——打扰不掷＝太平，不挡人进关。
    //   恶名读「本地已知恶名」（cave-siege v27.13 同款：世界账在册读 knownNotoriety，缺席退全局 notoriety 旧口径）。
    var RETREAT_DISTURB_TIERS = [
        { rivals: 4, noto: 100, p: 0.07 },  // 高档
        { rivals: 2, noto: 70,  p: 0.04 },  // 中档
        { rivals: 1, noto: 40,  p: 0.02 }   // 低档
    ];
    var RETREAT_DISTURB_GRACE_DAYS = 3; // 头三日不掷：找上门要脚程
    var RETREAT_DISTURB_COOLDOWN = 10;  // 触发过一次，十日内不再扰

    function retreatDisturbInputs() {
        var cd = global.currentCharData || {};
        var rivals = 0;
        try {
            if (typeof global.getRivals === 'function') {
                rivals = (global.getRivals() || []).filter(function (n) { return n && !n.isDead && !n.isMissing; }).length;
            }
        } catch (eR) {
            console.warn('[静默失败] js/cultivation/long-retreat.js · retreatDisturbInputs：宿敌名单没调出来，按没有宿敌算（这一夜太平）', eR && eR.message);
        }
        var noto = 0;
        try {
            if (global.WorldLedger && typeof global.WorldLedger.knownNotoriety === 'function') {
                noto = Number(global.WorldLedger.knownNotoriety()) || 0; // 本地治安眼中的你（世界账缺席退 0）
            } else {
                noto = Number(cd.notoriety) || 0; // 账簿不在册（旧档）：照旧全局口径
            }
        } catch (eN) {
            console.warn('[静默失败] js/cultivation/long-retreat.js · retreatDisturbInputs：恶名账没读出来，按无名之辈算', eN && eN.message);
        }
        return { rivals: rivals, noto: noto };
    }

    // 掷一次闭关打扰。返回 null＝今夜太平；{kind:'rival', npc}＝宿敌摸上山门；{kind:'raider'}＝恶名招来的蒙面人。
    function rollRetreatDisturbance(dayIndex, today) {
        var player = global.currentCharData;
        if (!player) return null;
        if (dayIndex < RETREAT_DISTURB_GRACE_DAYS) return null;
        var last = Number(player._retreatDisturbLastDay);
        if (Number.isFinite(last) && today - last < RETREAT_DISTURB_COOLDOWN) return null;
        var inp = retreatDisturbInputs();
        var p = 0;
        for (var i = 0; i < RETREAT_DISTURB_TIERS.length; i++) {
            var t = RETREAT_DISTURB_TIERS[i];
            if (inp.rivals >= t.rivals || inp.noto >= t.noto) { p = t.p; break; }
        }
        if (p <= 0) return null; // 无宿敌且恶名不足：不掷＝太平
        if (Math.random() >= p) return null;
        // 来的是谁：有宿敌挑恨最深的（cave-siege 同款排序），没有就是恶名招来的蒙面夜袭者
        var foe = null;
        try {
            if (typeof global.getRivals === 'function') {
                var list = (global.getRivals() || []).filter(function (n) { return n && !n.isDead && !n.isMissing; });
                if (list.length) foe = list.sort(function (a, b) {
                    return ((b.relationship && b.relationship.hatred) || 0) - ((a.relationship && a.relationship.hatred) || 0);
                })[0];
            }
        } catch (eF) {}
        return foe ? { kind: 'rival', npc: foe } : { kind: 'raider' };
    }

    // 强行出关＝当场撞见：接现有宿敌遭遇/夜袭正门，不造新战斗（本函数在闭关收尾、弹窗都放完之后调）。
    function triggerRetreatEncounter(dist) {
        try {
            var player = global.currentCharData;
            if (dist && dist.kind === 'rival' && typeof global.duelRival === 'function' && dist.npc && dist.npc.id) {
                global.duelRival(dist.npc.id); // rivalry-chain 正门：开战挂 _isRivalDuel，胜负走既有寻仇结算
                return;
            }
            if (typeof global.startBattle === 'function') {
                // 恶名招来的蒙面夜袭者：敌情照 cave-siege 蒙面支捏人，挂 _isCaveSiege 走同一张战后结算桌。
                // （cave-siege 的煞位/道侣折攻是它自家的战前账，这里不重复抄——蒙面人按裸脸算。）
                var tier = 3;
                try { if (typeof global.getRealmTier === 'function') tier = global.getRealmTier(player && player.realm) || 3; } catch (eT) {}
                var raider = {
                    name: '蒙面夜袭者', type: 'elite', physiologyType: 'humanoid',
                    level: tier * 3 + 2, attack: 33 + tier * 5, defense: 16 + tier * 3, speed: 24,
                    maxDurability: 95 + tier * 15, durabilities: { chest: 95 + tier * 15 }, combatAbilities: []
                };
                var b = global.startBattle(raider);
                if (b) b._isCaveSiege = true;
                if (global.showMessage) global.showMessage('🥾 你推门而出——门外站的不是宿敌，是几个蒙面人。恶名在外，连闭关都有人惦记。', 'error');
            }
        } catch (eDist) {
            console.warn('[静默失败] js/cultivation/long-retreat.js · triggerRetreatEncounter：这一仗没拉起来，来人堵在山门外', eDist && eDist.message);
        }
    }

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
        // 第七十三波·境由心转：闭关收成认心境（与打坐同一本梯度 ×0.90–×1.10）——
        // 进关带进去的心气决定这场效率；关内静心、心境不回落（dailyTick 认闭关旗），整场看到的是同一个数
        try {
            if (global.MoodSystem && typeof global.MoodSystem.cultivationMul === 'function') {
                var _moodMulR = global.MoodSystem.cultivationMul();
                if (_moodMulR !== 1) bonus *= _moodMulR;
            }
        } catch (eMoodR) {}
        // v25.1·试-06：槽里放的是功法对象（equipSkill 直接存 def，NEW-22 同款病）——
        // 旧写法拿对象当熟练度键，48 点/日全记到 '[object Object]' 垃圾键上。对象/字符串双兼容取 .id。
        var _mainSlot = global.currentSkills && global.currentSkills.skill_main;
        var mainSkillId = _mainSlot ? (typeof _mainSlot === 'object' ? (_mainSlot.id || null) : _mainSlot) : null;
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
        var buckets = { market: [], sect: [], world: [], npc: [], festival: [], other: [] };
        for (var i = 0; i < sum.items.length; i++) {
            var it = sum.items[i];
            if (it.category === 'auction') buckets.market.push(it);
            else if (it.category === 'sect_event' || it.category === 'sect_meeting' || it.category === 'sect_tournament') buckets.sect.push(it);
            else if (it.category === 'world_event' || it.category === 'dungeon_window') buckets.world.push(it);
            else if (it.category === 'npc_appointment') buckets.npc.push(it);
            else if (it.category === 'festival') buckets.festival.push(it);
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
        if (buckets.festival.length) lines.push('• 节令：' + describe(buckets.festival, ''));
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
     *   - costPerDay 默认 5（v27.13：入口处按境界档传入，见 getRetreatCostPerDay——本函数不重估）
     *   - maxIterations 安全上限（避免 due 永远不触发）
     *   - getDueFlag 返回 {stop:boolean, reason?:string}
     *   - endDayGetter 每次循环返回当前 endDay（用于摘要）
     * @returns {Object|null} {days, essence, insight, mainSkillId, cost, stoppedReason}
     */
    function runRetreatLoop(plannedDays, opts) {
        opts = opts || {};
        var costPerDay = Number(opts.costPerDay) || 5; // v27.13：兜底价=炼气档；真值由入口定档传入
        var maxIterations = Number(opts.maxIterations) || plannedDays;
        var player = global.currentCharData;
        if (!player) return null;
        if (global.checkSoulBlock && global.checkSoulBlock('闭关')) return null;
        // 第九十五波·NEW-23：旧版拿拼错的 class 选择器找战斗弹窗（战斗面板是 id 不是那个 class），
        // 判定恒 false，打着架也能进关。改判 window.currentBattle 非空（开战挂上、收兵清空，app.js 里两头都写）。
        if (global.currentBattle) {
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
        // v25.1·试-28：固定档闭关也要逐日比对寿元账——此前只有「闭关至事件」一家消费 getPlayerDeathDay，
        // 快死的人预付整档灵石进关，"死"在关中而闭关照跑满、死亡结算和出关结算叠在同一屏。
        var deathDay = getPlayerDeathDay();
        var totalEssence = 0;
        var mainSkillId = null;
        var actualDays = 0;
        var stoppedReason = null;
        // v27.13：强行出关待触发的撞见（闭关收尾后再开战，别让战斗弹窗砸在结算消息前头）
        var _pendingDisturb = null;
        // v23.1 闭关不是打卡上班：每日有小概率灵光顿悟（当日收成三倍），也有心魔滋扰（紊乱+6、当日折半）
        // v27.13：再添一本 disturb 账——闭关不是保险箱（①-新增-2）
        var _rtNotes = { enlighten: 0, deviation: 0, disturb: 0 };
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
                // v27.13：①-新增-2 闭关不是保险箱——每日掷一次打扰，掷中即弹两难（确定=强行出关 / 取消=闭目不动）。
                //   无确认面的异常环境默认闭目不动：宁折一日收成，不替玩家开战。
                var _distToday = global.timeSystem.gameTime ? global.timeSystem.gameTime.currentDay : (startDay + actualDays);
                var _distHalve = false;
                var _dist = rollRetreatDisturbance(d, _distToday);
                if (_dist) {
                    player._retreatDisturbLastDay = _distToday; // 触发即入十日冷却（两支皆然）
                    _rtNotes.disturb++;
                    var _foeName = _dist.kind === 'rival' ? ((_dist.npc && _dist.npc.name) || '宿敌') : '不速之客';
                    var _distGo = false;
                    if (typeof global.confirm === 'function') {
                        _distGo = global.confirm('🌫️ 闭关第 ' + (d + 1) + ' 日——洞府外传来脚步声。\n' +
                            (_dist.kind === 'rival'
                                ? '「' + _foeName + '」追着风声摸到了山门外，杀气没有收。'
                                : '几个「' + _foeName + '」绕着山门转了一圈，来意不善。') + '\n\n' +
                            '【确定】强行出关——当场撞见了断恩怨（闭关就此中止，已闭 ' + d + ' 日收成照算，未跑满的阵法费退回）。\n' +
                            '【取消】闭目不动——由他在外守一夜（今日收成折损一档，脚印留在洞府外）。');
                    }
                    if (_distGo) {
                        stoppedReason = '洞府外来人，强行出关';
                        _pendingDisturb = _dist;
                        break;
                    }
                    _distHalve = true; // 闭目不动：这一夜过去了
                }
                var y = getRetreatDailyYield();
                var _dayYield = y.essence;
                var _rtRoll = Math.random();
                if (_rtRoll < 0.04) {
                    _dayYield *= 3;
                    _rtNotes.enlighten++;
                } else if (_rtRoll < 0.10 && typeof global.addQiDeviation === 'function') {
                    try { global.addQiDeviation(6); } catch (eQd) {}
                    _dayYield = Math.floor(_dayYield / 2);
                    _rtNotes.deviation++;
                }
                // v27.13：闭目不动——今日收成折损一档（与心魔滋扰同一档折法）；顿悟/心魔的账照旧在前
                if (_distHalve) _dayYield = Math.floor(_dayYield / 2);
                totalEssence += _dayYield;
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
                // v25.1·试-28：固定档闭关逐日比对寿元账——到「闭关至事件」同一道界限（deathDay-1）就提前出关，
                // 不再让快死的人预付整档灵石却"死"在关中、闭关照跑满。
                if (Number.isFinite(deathDay)) {
                    var _curDayL = global.timeSystem.gameTime ? global.timeSystem.gameTime.currentDay : (startDay + actualDays);
                    if (_curDayL >= deathDay - 1) { stoppedReason = '寿元将尽'; break; }
                }
            }
        } finally {
            global._isInLongRetreat = oldRetreat;
            global._suppressTimeFlowMessages = oldSuppress;
        }

        // v25.1·试-28：提前出关按实际天数结算灵石——进关时全额预付了 plannedDays 天，
        // 多扣的退回（与 spendSpiritStones 同一本账：写 currency、同步 charData、刷货币 UI）。
        var refunded = 0;
        if (actualDays < plannedDays) {
            refunded = (plannedDays - actualDays) * costPerDay;
            if (refunded > 0 && global.inventory && global.inventory.currency) {
                global.inventory.currency.spiritStones = (Number(global.inventory.currency.spiritStones) || 0) + refunded;
                if (global.currentCharData) global.currentCharData.spiritStones = global.inventory.currency.spiritStones;
                if (typeof global.updateCurrencyUI === 'function') global.updateCurrencyUI();
            }
        }
        var netCost = Math.max(0, cost - refunded);

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
            // v25.1·试-28：提前出关退回多预付的灵石——回执如实报退款
            var refundNote = refunded > 0 ? '，阵法未跑满退回灵石' + refunded : '';
            var _rtNote = (_rtNotes.enlighten ? '，途中灵光顿悟×' + _rtNotes.enlighten : '') +
                (_rtNotes.deviation ? '，心魔滋扰×' + _rtNotes.deviation + '（气机微乱，静养可复）' : '') +
                // v27.13：①-新增-2 闭目不动的余味——出关回执里留一句「洞府外的脚印」
                (_rtNotes.disturb ? '，途中' + _rtNotes.disturb + '次听见洞府外脚步声——你都闭目未动，山门外绕着一圈脚印' : '');
            // 第七十三波：出关回执报心境折头（平平常常不开口——与打坐结算单同一张嘴）
            var _moodNoteR = '';
            try { if (global.MoodSystem && typeof global.MoodSystem.cultivationNote === 'function') _moodNoteR = global.MoodSystem.cultivationNote(); } catch (eMn) {}
            global.showMessage('🔒 闭关结束：第' + startDay + '天 → 第' + endDay + '天，' + actualDays + '日' + stopNote + refundNote + '，真元+' + totalEssence + extra + _rtNote + (_moodNoteR ? '。' + _moodNoteR : ''), 'success');
            var summary = buildRetreatSummary(startDay, endDay);
            if (summary) global.showMessage(summary, 'info');
        }
        // v27.13：①-新增-2 强行出关＝当场撞见——结算消息放完再开战（宿敌走 duelRival / 蒙面人走 _isCaveSiege）
        if (_pendingDisturb) triggerRetreatEncounter(_pendingDisturb);
        return { days: actualDays, plannedDays: plannedDays, essence: totalEssence, insight: insightGain, mainSkillId: mainSkillId, cost: netCost, refunded: refunded, stoppedReason: stoppedReason, startDay: startDay, endDay: (global.timeSystem && global.timeSystem.gameTime) ? global.timeSystem.gameTime.currentDay : startDay + actualDays };
    }

    function startLongRetreat(days) {
        var opt = getOption(days);
        var player = global.currentCharData;
        if (!opt || !player) return false;
        // v27.13：入关时按境界一次定档（档×5，见 getRetreatCostPerDay 头注），关内不逐日重估
        var _tierCost = getRetreatCostPerDay();
        if (typeof global.confirm === 'function' && !global.confirm('确定' + opt.label + '？\n将消耗灵石' + (opt.days * _tierCost) + '，并让世界真实推进' + opt.days + '天。')) return false;
        return runRetreatLoop(opt.days, { costPerDay: _tierCost });
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
        // v27.13：报价同样走境界档（入关时定档），不再写死 5/日
        var _tierCostEvt = getRetreatCostPerDay();
        var confirmMsg = '确定闭关至' + meta.label + '？\n目标：第 ' + targetDay + ' 天 · 距今 ' + days + ' 日\n消耗灵石 ' + (days * _tierCostEvt) + (cappedByLifespan ? '\n（已被寿元上限截断）' : '');
        if (typeof global.confirm === 'function' && !global.confirm(confirmMsg)) {
            if (unsub) try { unsub(); } catch (e) {}
            return null;
        }

        if (cappedByLifespan && global.showMessage) {
            global.showMessage('⚠️ 目标事件已超出寿元上限，闭关将在寿元前 1 日提前出关', 'warning');
        }

        var result = runRetreatLoop(days, {
            costPerDay: _tierCostEvt, // v27.13：境界档价（入关时定档），此前写死 5
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
        // 第九十五波·NEW-23：能点的行不再挂装饰锁——旧版每行标题硬拼 '🔒 '，照常生效的档位
        // 看着像没解锁，玩家以为整套闭关被锁死（真锁住的行才保留 🔒 并置灰）
        RETREAT_OPTIONS.forEach(function (o) {
            var cost = o.days * getRetreatCostPerDay(); // v27.13：面板报价挂境界档（此前恒 5/日）
            var afford = getSpiritStones() >= cost;
            html += '<button onclick="startLongRetreat(' + o.days + '); this.closest(\'#xianxia-modal-overlay\')?.remove();" class="w-full text-left ' + (afford ? 'bg-indigo-800 hover:bg-indigo-700 border-indigo-600' : 'bg-gray-800 opacity-70 border-gray-600') + ' p-3 rounded border">' +
                '<span class="' + (afford ? 'text-indigo-200' : 'text-gray-400') + ' font-bold">' + o.label + '</span><br>' +
                '<span class="text-xs text-gray-400">' + o.desc + ' · ' + o.days + '天 · 阵法耗费' + cost + '灵石' + (afford ? '' : '（灵石不足，凑够阵法费再来）') + '</span></button>';
        });
        // v18.9：闭关至下次事件
        html += '<div class="mt-4 pt-3 border-t border-gray-600"><p class="text-xs text-amber-400 mb-2">📅 闭关至下次事件（v18.9）：</p>';
        if (global.WorldCalendar && typeof global.WorldCalendar.getNextByCategory === 'function') {
            var now = global.timeSystem && global.timeSystem.gameTime ? global.timeSystem.gameTime.currentDay : 1;
            RETREAT_TARGET_CATEGORIES.forEach(function (cat) {
                var next = global.WorldCalendar.getNextByCategory(cat.key, now);
                if (!next) {
                    // 真没有登记在册的日子才锁——给出缘由，不再是干巴巴的「暂无」
                    html += '<button disabled class="w-full text-left bg-gray-700/40 p-2 rounded text-xs text-gray-500 mb-1">🔒 至' + cat.label + '：天机未显——尚无登记在册的日子</button>';
                } else {
                    var dleft = next.dueAbsoluteDay - now;
                    html += '<button onclick="startLongRetreatUntilEvent(\'' + cat.key + '\', 90); this.closest(\'#xianxia-modal-overlay\')?.remove();" class="w-full text-left bg-amber-800 hover:bg-amber-700 p-2 rounded text-xs mb-1">' +
                        '<span class="text-amber-200 font-bold">📅 至' + cat.label + '：第 ' + next.dueAbsoluteDay + ' 天（' + dleft + ' 日后）</span><br>' +
                        '<span class="text-gray-400">' + next.title + ' · 约 ' + (dleft * getRetreatCostPerDay()) + ' 灵石</span></button>';
                }
            });
        } else {
            html += '<p class="text-xs text-gray-500">世界日程未就绪</p>';
        }
        html += '</div>';
        html += '<p class="text-xs text-gray-500">闭关只积累修为与功法熟练，不自动替你突破境界；遇到瓶颈仍需出关亲自突破。出关时会汇总闭关期间世界发生的大事。</p></div>';
        if (typeof global.showModal === 'function') global.showModal('🧘 长期闭关', html);
    }

    global.RETREAT_OPTIONS = RETREAT_OPTIONS;
    global.RETREAT_TARGET_CATEGORIES = RETREAT_TARGET_CATEGORIES;
    global.getRetreatCostPerDay = getRetreatCostPerDay; // v27.13：境界档日价读口（UI/测试/未来 B 案接口）
    global.getRetreatDailyYield = getRetreatDailyYield;
    global.startLongRetreat = startLongRetreat;
    global.startLongRetreatUntilEvent = startLongRetreatUntilEvent;
    global.openLongRetreatUI = openLongRetreatUI;
})(typeof window !== 'undefined' ? window : this);
