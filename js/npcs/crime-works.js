// ==================== v27.4 黑道与断案批 · 黑道营生名册（新文件 crime-works.js） ====================
// 设计方案 E 引擎：67 扒窃 · 68 盗墓 · 69 伪造盐引（原「贩私盐」撞车盐路官私两道，换血）·
//   70 夹带私货过城门（v26.1 城门闸接口）· 71 落草收保护费（多日程独立名册）· 72 伪造路引 ·
//   73 卖情报（复活 getGossipInfo——丐帮消息网从此有真买主）· 74 安暗桩 · 76 私铸假灵石（抄家级热度）。
//   （75 销赃铺已在 v27.1 铺面类型表落地，不重复建设。）
// 纪律：①热度一律走 NpcCrime.addHeat 正门记入同一本通缉账（两档铁律不破——当街露脸的才进画影册）；
//       ②银钱走 RewardService 一笔事务（不足整笔不成）；时辰走 advanceTime；风声走 playerPushDeed；
//       ③赔款交不齐按「搜身尽力赔付」口径（settleBountyHunt 先例）——不凭空负债；
//       ④全是明账：成功率/查获率/凶险逐条写在牌面上，锁就亮锁；一日一票的日戳全落 StateRegistry 'crimeWorks'；
//       ⑤事件不追人：落草/暗桩全挂新日订阅自动结账，绝不弹窗追着玩家；
//       ⑥营生路不是印钞路——贼赃有限，热度是真代价：干得越狠，赏金猎人和城门盘查来得越快。
(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    var TUNE = {
        // 67 扒窃
        PICK_BASE: 0.40, PICK_DEX: 0.003, PICK_TIER: 0.04, PICK_MIN: 0.15, PICK_CAP: 0.85,
        PICK_LOOT_MIN: 20, PICK_LOOT_RANGE: 41,      // 铜钱 20~60
        PICK_ITEM_P: 0.30,                            // 三成几率顺走一件货（takeItems 正门，行囊接不住就留在原处）
        PICK_EN: 5, PICK_MINUTES: 10, PICK_DAILY_CAP: 3,
        PICK_FAIL_HEAT: 2, PICK_FAIL_NOTO: 1, PICK_FAIL_REP: 5, PICK_FAIL_AFF: -15,
        // 68 盗墓
        DIG_EN: 30, DIG_MINUTES: 240, DIG_P_LOOT: 0.50, DIG_P_EMPTY: 0.30,
        DIG_LOOT_MIN: 15, DIG_LOOT_RANGE: 31,         // 冥器折灵石 15~45
        DIG_TOMB_LOOT_MIN: 25, DIG_TOMB_LOOT_RANGE: 26,   // 守墓傀战利 25~50
        DIG_HEAT: 2, DIG_KARMA: -3, DIG_REP: 3,
        DIG_TROUBLE_HEAT: 4, DIG_TROUBLE_NOTO: 2,     // 被守墓人拿住（火把照脸）
        // 69 伪造盐引
        FS_NEED: 30, FS_EN: 25, FS_MINUTES: 240,
        FS_BASE: 0.35, FS_SKILL: 0.006, FS_CAP: 0.85,
        FS_GAIN: 70, FS_HEAT: 1,
        FS_CHECK_P: 0.12, FS_BUST_HEAT: 8, FS_BUST_FINE: 50, FS_BUST_NOTO: 3, FS_BUST_SHORT_NOTO: 3,
        // 72 伪造路引
        FP_EN: 15, FP_MINUTES: 120,
        FP_BASE: 0.50, FP_MOUTH: 0.004, FP_FORGE: 0.003, FP_CAP: 0.90,
        FP_GAIN_MIN: 25, FP_GAIN_RANGE: 16,           // 25~40
        FP_FAIL_HEAT: 2, FP_FAIL_REP: 3,
        // 76 私铸假灵石（抄家级）
        FF_NEED: 50, FF_COST: 20, FF_EN: 40, FF_MINUTES: 240,
        FF_BASE: 0.30, FF_SKILL: 0.005, FF_CAP: 0.80,
        FF_GAIN: 80, FF_PASS_HEAT: 2, FF_PASS_NOTO: 1, FF_KARMA: -2,
        FF_BUST_HEAT: 15, FF_BUST_NOTO: 8, FF_BUST_FINE: 100, FF_BUST_REP: 30, FF_BUST_SHORT_NOTO: 5,
        // 70 夹带私货
        SM_PAY_MIN: 50, SM_PAY_RANGE: 41,             // 脚钱 50~90 灵石
        SM_GATE_P: 0.25, SM_BUST_HEAT: 5, SM_BUST_FINE: 30, SM_BUST_NOTO: 2,
        SM_DELIVER_HEAT: 1,
        // 71 落草
        BD_DAYS: 7, BD_HEAT_GATE: 20,                 // 热度≥20 官府盯得紧，落不了草
        BD_DAILY_MIN: 8, BD_DAILY_RANGE: 13,          // 保护费 8~20 灵石/日
        BD_DAILY_HEAT: 2, BD_RAID_FROM: 3, BD_RAID_P: 0.15,
        BD_RAID_BASE: 0.40, BD_RAID_TIER: 0.10, BD_RAID_CAP: 0.85,
        BD_RAID_WIN_BONUS: 15, BD_RAID_WIN_HEAT: 3,
        BD_RAID_LOSE_HP: 30, BD_RAID_LOSE_HEAT: 5,
        BD_OUT_KARMA: -5, BD_OUT_REP: 10,
        // 73 卖情报
        IN_EN: 10, IN_MINUTES: 60,
        IN_GAIN_MIN: 8, IN_GAIN_RANGE: 13,            // 8~20 灵石
        IN_GB_BONUS: 0.2, IN_GB_GOODWILL: 10,         // 丐帮缘分≥10：价钱上浮两成
        // 74 安暗桩
        SPY_COST: 40, SPY_FOUND_P: 0.02, SPY_FOUND_HEAT: 1
    };

    var _st = {
        digs: 0, forgeSalt: 0, forgePass: 0, forgeFake: 0, intel: 0,   // 日戳（一日一票）
        smuggle: null,   // {from, pay, day, gateRoll}
        bandit: null,    // {start, end, take, raidWin, raidLose}
        spies: {}        // pkCity -> 落桩日
    };
    var _pickLog = {};   // { npcId: absoluteDay } 运行时账（threaten 同款口径）
    var _pickDay = { day: -1, n: 0 };

    // ============ 小工具（npc-crime.js 同款口径） ============
    function cd() { return window.currentCharData || null; }
    function say(m, t) { try { if (window.showMessage) window.showMessage(m, t || 'info'); } catch (e) { return false; } return true; }
    function log(m, t) { try { if (window.gameLog && window.gameLog.add) window.gameLog.add(m, t || 'info'); } catch (e) { return false; } return true; }
    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
    function city() {
        return (cd() && cd().location) ||
            (typeof window.getCurrentCityName === 'function' && window.getCurrentCityName()) || '';
    }
    function pkCity(s) { return String(s == null ? '' : s).replace(/\s+/g, ''); }
    function absDay() {
        try {
            if (window.WorldCalendar && typeof window.WorldCalendar.day === 'number' && window.WorldCalendar.day > 0) return Math.floor(window.WorldCalendar.day);
            if (typeof window.getAbsoluteDay === 'function') { var g = window.getAbsoluteDay(); if (g) return Math.floor(g); }
            if (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') { var t = window.timeSystem.getAbsoluteDay(); if (t) return Math.floor(t); }
        } catch (e) { return 0; }
        return 0;
    }
    function dice() { return (typeof window.__scenarioRng === 'function') ? window.__scenarioRng() : Math.random(); }
    function settle(spec, source) {
        try {
            if (window.RewardService && typeof window.RewardService.apply === 'function') {
                var r = window.RewardService.apply(spec, { source: source || '黑道营生', city: city() });
                return { ok: !!(r && r.success !== false), note: r && r.messages ? r.messages.join('、') : '' };
            }
        } catch (e) { console.warn('[静默失败] js/npcs/crime-works.js · settle：这笔赃账没落成一笔', e && e.message); }
        return { ok: false, note: '' };
    }
    function stonesNow() {
        try {
            var DM = window.DataManager || (window.XianXia && window.XianXia.DataManager);
            if (DM && typeof DM.getSpiritStones === 'function') return Number(DM.getSpiritStones()) || 0;
        } catch (e) {}
        var c = cd();
        return c ? (Number(c.spiritStones) || 0) : 0;
    }
    function deductMin(amt) {   // 赔款搜身尽力赔付（settleBountyHunt 先例）：交不齐的罪加一等
        var paid = Math.min(stonesNow(), Math.max(0, amt));
        if (paid > 0) { var r = settle({ stones: -paid }, '赔款'); if (!r.ok) return 0; }
        return paid;
    }
    function addHeat(n, why, opts) {
        try { if (window.NpcCrime && typeof window.NpcCrime.addHeat === 'function') window.NpcCrime.addHeat(n, why, opts); } catch (e) { console.warn('[静默失败] js/npcs/crime-works.js · addHeat：这笔风声没记上官府的账', e && e.message); }
    }
    function heatNow() { try { if (window.NpcCrime && typeof window.NpcCrime.heat === 'function') return Number(window.NpcCrime.heat()) || 0; } catch (e) {} return 0; }
    function repDown(n) {
        var ct = city();
        if (!ct || typeof window.reduceReputation !== 'function') return false;
        try { window.reduceReputation(ct, n); return true; } catch (e) { return false; }
    }
    function deed(mood, s) { try { if (typeof window.playerPushDeed === 'function') window.playerPushDeed(mood, s); } catch (e) {} }
    function advance(min, why) { try { if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') window.timeSystem.advanceTime(min, why); } catch (e) { console.warn('[静默失败] js/npcs/crime-works.js · advance：时辰没扣成', e && e.message); } }
    function refresh() {
        try { if (window.updateCharacterStatus) window.updateCharacterStatus(); } catch (e) {}
        try { if (typeof window.updateCurrencyUI === 'function') window.updateCurrencyUI(); } catch (e2) {}
    }
    function skill(name) {
        try { if (typeof window.getLifeSkill === 'function') return Number(window.getLifeSkill(name)) || 0; } catch (e) {}
        var c = cd();
        return (c && c.lifeSkills && Number(c.lifeSkills[name])) || 0;
    }
    function attr(name) { var c = cd(); return (c && c.attrs && Number(c.attrs[name])) || 0; }
    function grow(name, exp) { try { if (typeof window.growLifeSkill === 'function') window.growLifeSkill(name, exp || 1); } catch (e) {} }
    function playerTier() {
        try { var c = cd(); if (c && c.realm && typeof window.getRealmTier === 'function') return Number(window.getRealmTier(c.realm)) || 0; } catch (e) {}
        return 0;
    }
    function npcById(id) { try { return (window.npcManager && typeof window.npcManager.getNPC === 'function') ? window.npcManager.getNPC(id) : null; } catch (e) { return null; } }
    function seedOf(s) { var h = 0; s = String(s || ''); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
    function inCity() { var ct = city(); if (!ct) return ''; try { if (window.locationSystem && window.locationSystem.getCityData && !window.locationSystem.getCityData(ct)) return ''; } catch (e) {} return ct; }
    function notoUp(n) { var c = cd(); if (c) c.notoriety = Math.min(100, (Number(c.notoriety) || 0) + n); }
    function hurtHp(n) { var c = cd(); if (c) c.health = Math.max(1, (Number(c.health) || 100) - n); }
    function dayGate(field, need) {
        var d = absDay();
        if (!d) { say('🕯️ 天上没钟，后巷不开市——改日再来。', 'info'); return false; }
        if (_st[field] === d) { say('🕯️ 今日这票已经干过了——后巷的规矩，一天只做一票，做得太勤会被人盯上。', 'info'); return false; }
        return d;
    }

    // ============ 67 扒窃（NPC 对话面板第三枚黑按钮，威胁/抢劫同款先例） ============
    function pickRate() {
        return clamp(TUNE.PICK_BASE + attr('dexterity') * TUNE.PICK_DEX + playerTier() * TUNE.PICK_TIER, TUNE.PICK_MIN, TUNE.PICK_CAP);
    }
    function pick(npcId) {
        var npc = npcById(npcId);
        if (!npc || npc.isDead) { say('那人早不在这儿了。', 'info'); return false; }
        var c = cd();
        if (!c) { say('请先创建角色。', 'warning'); return false; }
        if (window.currentBattle) { say('打着架呢——手没法这么闲。', 'warning'); return false; }
        try { if (typeof window.npcNotCoLocated === 'function' && window.npcNotCoLocated(npc)) { say('你与' + npc.name + '并不在一处——隔半座城摸不着人家的荷包。', 'warning'); return false; } } catch (eL) {}
        if (!inCity()) { say('🫳 荒郊野外四下没人——摸谁去？进城才有下手的地方。', 'info'); return false; }
        var day = absDay();
        if (!day) { say('🕯️ 天上没钟，街面不开市。', 'info'); return false; }
        if (_pickLog[npcId] === day) { say('🫳 今天已经摸过 ' + npc.name + ' 一回了——同一只羊薅两遍，薅秃了要叫的。', 'info'); return false; }
        if (_pickDay.day !== day) { _pickDay.day = day; _pickDay.n = 0; }
        if (_pickDay.n >= TUNE.PICK_DAILY_CAP) { say('🫳 今天的手已经够脏了（一日至多 ' + TUNE.PICK_DAILY_CAP + ' 回）——再摸，街面上该有人盯你了。', 'info'); return false; }
        var aff = Number(npc.relationship && npc.relationship.affection) || 0;
        if (aff >= 80) { say('🫳 你盯着 ' + npc.name + ' 的荷包，手伸到一半又缩了回来——这么亲近的人，下不去手。', 'warning'); return false; }
        if (Number(c.energy) < TUNE.PICK_EN) { say('🫳 精力不济（要 ' + TUNE.PICK_EN + '）——手都不稳，摸什么包。', 'warning'); return false; }
        _pickLog[npcId] = day; _pickDay.n++;
        advance(TUNE.PICK_MINUTES, '搭讪挪步找机会');
        var rate = pickRate();
        if (dice() < rate) {
            var loot = TUNE.PICK_LOOT_MIN + Math.floor(dice() * TUNE.PICK_LOOT_RANGE);
            var itemNote = '';
            if (dice() < TUNE.PICK_ITEM_P) {
                try {
                    if (window.NpcCrime && typeof window.NpcCrime.takeItems === 'function') {
                        var got = window.NpcCrime.takeItems(npc, 1);
                        if (got && got.length) itemNote = '，还从TA行囊里顺走了一件「' + got[0] + '」';
                    }
                } catch (eT) { console.warn('[静默失败] js/npcs/crime-works.js · pick：那件货没顺成——留在TA身上，不蒸发', eT && eT.message); }
            }
            settle({ copper: loot, energy: -TUNE.PICK_EN, karma: -1 });
            log('🫳 你借着人流一贴一挪，两指夹出了 ' + npc.name + ' 荷包里的 ' + loot + ' 铜' + itemNote + '——TA浑然不觉，还在挑摊子上的货。（无人看见，热度不涨；业障-1）', 'warning');
            say('🫳 得手——' + loot + ' 铜钱入袖' + itemNote + '。TA没察觉。（业障-1）', 'success');
        } else {
            settle({ energy: -TUNE.PICK_EN, noto: TUNE.PICK_FAIL_NOTO });
            try { if (typeof npc.changeAffection === 'function') npc.changeAffection(TUNE.PICK_FAIL_AFF); } catch (eA) {}
            try { if (typeof npc.recordPlayerAction === 'function') npc.recordPlayerAction('pickpocket_failed', 'negative'); } catch (eR) {}
            addHeat(TUNE.PICK_FAIL_HEAT, '摸包被当场按住', { faceSeen: true });
            repDown(TUNE.PICK_FAIL_REP);
            deed('bad', '你在街面上摸 ' + npc.name + ' 的荷包被当场按住手腕，围了一圈看热闹的');
            log('🫳 手腕被铁钳一样攥住了——' + npc.name + ' 回身怒喝：「好贼子！」围观的人指指点点，你挣脱就跑。（恶名+' + TUNE.PICK_FAIL_NOTO + '，' + city() + '声望-' + TUNE.PICK_FAIL_REP + '，好感' + TUNE.PICK_FAIL_AFF + '，热度+' + TUNE.PICK_FAIL_HEAT + '，当街过了目——脸进画影册）', 'danger');
            say('🫳 被当场按住！挣脱跑掉了——脸进了官府的画影册。（热度+' + TUNE.PICK_FAIL_HEAT + '）', 'error');
        }
        refresh();
        return true;
    }
    function buildPickButton(npc, npcId, btn) {
        try {
            if (!npc || npc.isDead) return '';
            var b = btn || 'class="mt-1 flex items-center gap-2 px-3 py-2 rounded text-sm w-full transition-colors border ';
            return '<button onclick="window.CrimeWorks.pick(\'' + npcId + '\')" ' + b + 'bg-stone-900/70 hover:bg-stone-800/80 border-stone-600/50 text-stone-200"><span>🫳 扒窃</span><span class="text-xs text-stone-300/70">两指夹荷包——得手无人察觉（成功率 ' + Math.round(pickRate() * 100) + '%），被按住当街过目</span></button>';
        } catch (e) { console.warn('[静默失败] js/npcs/crime-works.js · buildPickButton：按钮没挂上', e && e.message); return ''; }
    }

    // ============ 68 盗墓（夜活一票：起货/空手/惊动三路） ============
    function digGrave() {
        var ct = inCity();
        if (!ct) { say('🕯️ 先进城——坟头图要从后巷的土夫子手里买。', 'info'); return false; }
        var c = cd();
        if (!c) return false;
        if (window.currentBattle) { say('打着架呢——今晚的活改日再说。', 'warning'); return false; }
        var day = dayGate('digs');
        if (!day) return false;
        if (Number(c.energy) < TUNE.DIG_EN) { say('🪦 精力不够刨一整夜（要 ' + TUNE.DIG_EN + '）——歇养两日再来。', 'warning'); return false; }
        _st.digs = day;
        advance(TUNE.DIG_MINUTES, '出城夜刨');
        var roll = dice();
        if (roll < TUNE.DIG_P_LOOT) {
            var loot = TUNE.DIG_LOOT_MIN + Math.floor(dice() * TUNE.DIG_LOOT_RANGE);
            settle({ stones: loot, energy: -TUNE.DIG_EN, karma: TUNE.DIG_KARMA });
            addHeat(TUNE.DIG_HEAT, '盗墓起货（风声走漏）');
            repDown(TUNE.DIG_REP);
            deed('bad', '你夜里刨了' + ct + '城外的老坟，起出陪葬的冥器——附近村落的人家都在骂');
            log('🪦 三更天，你照着土夫子的坟头图刨开一座无主老坟——棺椁角上起出冥器，折给后巷 ' + loot + ' 灵石。挖人家祖坟是伤阴德的事：业障' + TUNE.DIG_KARMA + '、热度+' + TUNE.DIG_HEAT + '、' + ct + '声望-' + TUNE.DIG_REP + '。', 'warning');
            say('🪦 起货了——冥器折 ' + loot + ' 灵石。损阴德的账也记下了。（业障' + TUNE.DIG_KARMA + '，热度+' + TUNE.DIG_HEAT + '）', 'warning');
        } else if (roll < TUNE.DIG_P_LOOT + TUNE.DIG_P_EMPTY) {
            settle({ energy: -TUNE.DIG_EN });
            log('🪦 你刨了整整一夜——坟是空的，早被人捷足先登了。土回填好，白搭一夜力气。（精力-' + TUNE.DIG_EN + '，别的没折）', 'info');
            say('🪦 空坟一座——白刨一夜。', 'info');
        } else {
            if (dice() < 0.5) {
                // 惊动守墓傀：真仗（NpcCrime.startFlaggedBattle 正门，_isTombFight 旗）
                var tLoot = TUNE.DIG_TOMB_LOOT_MIN + Math.floor(dice() * TUNE.DIG_TOMB_LOOT_RANGE);
                settle({ energy: -TUNE.DIG_EN });
                addHeat(TUNE.DIG_HEAT, '盗墓惊动邪祟');
                var tier = Math.max(1, playerTier() || 1);
                var started = false;
                try {
                    if (window.NpcCrime && typeof window.NpcCrime.startFlaggedBattle === 'function') {
                        started = window.NpcCrime.startFlaggedBattle({
                            name: '守墓傀', type: 'elite', physiologyType: 'undead',
                            level: tier * 3 + 2, attack: 30 + tier * 7, defense: 18 + tier * 4, speed: 14,
                            maxDurability: 110 + tier * 18, durabilities: { chest: 110 + tier * 18 }, combatAbilities: []
                        }, { _isTombFight: true, _tombLoot: tLoot },
                            '🪦 坟土忽然塌了半边——一具披甲的干尸从椁里坐了起来，眼眶里燃着两点绿火！（打翻它，椁里的冥器 ' + tLoot + ' 灵石归你）');
                    }
                } catch (eB) { console.warn('[静默失败] js/npcs/crime-works.js · digGrave：守墓傀这一仗没拉起来——按惊散处理', eB && eB.message); }
                if (!started) {
                    addHeat(2, '盗墓惊动守墓人');
                    hurtHp(15);
                    log('🪦 你刚撬开椁盖，墓道深处传来铁链拖地的声音——你头皮一炸，丢下撬铲就跑，荆棘划了一身口子（气血-15，热度+2）。', 'danger');
                    say('🪦 墓里有东西醒了——你丢下家伙就跑。（气血-15）', 'error');
                }
            } else {
                // 被守墓人拿个正着：火把照脸
                settle({ energy: -TUNE.DIG_EN, noto: TUNE.DIG_TROUBLE_NOTO });
                hurtHp(10);
                addHeat(TUNE.DIG_TROUBLE_HEAT, '盗墓被守墓人拿住', { faceSeen: true });
                repDown(TUNE.DIG_REP + 2);
                deed('bad', '你盗墓被守墓人堵在坟坑里，火把照了个正脸，连滚带爬才跑掉');
                log('🪦 火把从四面八方围了过来——守墓的庄户敲着铜锣：「拿盗墓贼！」你挨了两锄头（气血-10）才挣脱，脸被照了个正着。（恶名+' + TUNE.DIG_TROUBLE_NOTO + '，热度+' + TUNE.DIG_TROUBLE_HEAT + '，' + ct + '声望-' + (TUNE.DIG_REP + 2) + '，脸进画影册）', 'danger');
                say('🪦 被守墓人围了！挨着锄头跑掉——脸进了画影册。（热度+' + TUNE.DIG_TROUBLE_HEAT + '）', 'error');
            }
        }
        refresh();
        open();
        return true;
    }
    // 守墓傀战结算（app.js 战斗收场钩子 _isTombFight 接线）
    function settleTombFight(won) {
        try {
            var b = window.currentBattle;
            var loot = (b && Number(b._tombLoot)) || 0;
            if (won) {
                if (loot > 0) settle({ stones: loot });
                settle({ karma: TUNE.DIG_KARMA });
                addHeat(TUNE.DIG_HEAT, '打翻守墓傀起走冥器');
                deed('bad', '你打翻了守墓的邪祟，把椁里的冥器席卷一空——这道上的风声压不住');
                log('🪦 守墓傀散成一堆枯骨甲片——椁里的冥器尽数归你，折 ' + loot + ' 灵石。业障' + TUNE.DIG_KARMA + '、热度+' + TUNE.DIG_HEAT + '：挖坟还打了人家的守灵，这账官府记着。', 'warning');
                say('🪦 打翻守墓傀——冥器 ' + loot + ' 灵石入袋。（业障' + TUNE.DIG_KARMA + '，热度+' + TUNE.DIG_HEAT + '）', 'success');
            } else {
                addHeat(2, '盗墓被守墓傀撵出来');
                hurtHp(10);
                log('🪦 守墓傀把你撵出了墓道——绿火在身后飘了半里地才灭。（气血再-10，热度+2，这一夜白忙）', 'danger');
            }
            refresh();
            return true;
        } catch (e) { console.warn('[静默失败] js/npcs/crime-works.js · settleTombFight：这一仗的账没接住', e && e.message); return false; }
    }
    window.settleTombFight = settleTombFight;

    // ============ 69 伪造盐引（官盐引 80 灵石一张——后巷的私铸只卖 70，利在险中） ============
    function fsRate() { return clamp(TUNE.FS_BASE + skill('锻造') * TUNE.FS_SKILL, 0.1, TUNE.FS_CAP); }
    function forgeSalt() {
        var ct = inCity();
        if (!ct) { say('🕯️ 先进城——朱印和引纸都得走后巷的门路。', 'info'); return false; }
        var c = cd();
        if (!c) return false;
        if (skill('锻造') < TUNE.FS_NEED) { say('🧂 伪造盐引要锻造 ' + TUNE.FS_NEED + ' 起步（现 ' + skill('锻造') + '）——朱印刻不像，引纸做不旧，一眼就是假的。', 'warning'); return false; }
        var day = dayGate('forgeSalt');
        if (!day) return false;
        if (Number(c.energy) < TUNE.FS_EN) { say('🧂 精力不够伏案一夜（要 ' + TUNE.FS_EN + '）。', 'warning'); return false; }
        _st.forgeSalt = day;
        advance(TUNE.FS_MINUTES, '伪造盐引');
        grow('锻造', 1);
        var rate = fsRate();
        if (dice() >= rate) {
            settle({ energy: -TUNE.FS_EN });
            log('🧂 你伏案一夜——刻的朱印缺了个角，引纸的帘纹也不对。后巷的盐贩子扫了一眼就推回来：「这玩意儿过不了卡，白送我都嫌烫手。」白忙一夜，手艺倒是磨了一分。（锻造+1）', 'info');
            say('🧂 仿得不够像——贩子不收，白忙一夜。（锻造+1）', 'warning');
            refresh(); open();
            return true;
        }
        // 仿成了：出货 +12% 盐课巡检查验（明账）
        if (dice() < TUNE.FS_CHECK_P) {
            settle({ energy: -TUNE.FS_EN });
            var fine = deductMin(TUNE.FS_BUST_FINE);
            var short = TUNE.FS_BUST_FINE - fine;
            notoUp(TUNE.FS_BUST_NOTO + (short > 0 ? TUNE.FS_BUST_SHORT_NOTO : 0));
            addHeat(TUNE.FS_BUST_HEAT, '伪造盐引被盐课司查验', { faceSeen: true });
            repDown(10);
            deed('bad', '你拿私铸的盐引出货，被盐课司当街查验拿住——这是私盐大案');
            log('🧂 出货的路上撞上盐课司巡检——引纸对着日头一照，帘纹露了馅。「私铸盐引，这是大案！」当场画影收册（恶名+' + TUNE.FS_BUST_NOTO + (short > 0 ? '+' + TUNE.FS_BUST_SHORT_NOTO + '（罚银交不齐，罪加一等）' : '') + '，罚 ' + TUNE.FS_BUST_FINE + ' 灵石' + (short > 0 ? '（尽力赔付 ' + fine + '，短 ' + short + '）' : '') + '，热度+' + TUNE.FS_BUST_HEAT + '，' + ct + '声望-10，脸进画影册）。', 'danger');
            say('🧂 被盐课司查验拿住——私盐大案！（罚 ' + TUNE.FS_BUST_FINE + ' 灵石，热度+' + TUNE.FS_BUST_HEAT + '，脸进画影册）', 'error');
        } else {
            settle({ stones: TUNE.FS_GAIN, energy: -TUNE.FS_EN, karma: -2 });
            addHeat(TUNE.FS_HEAT, '私盐引出货（盐路上起了点风声）');
            log('🧂 一夜功夫，一张以假乱真的盐引出手——盐贩子验了三遍，付了 ' + TUNE.FS_GAIN + ' 灵石（官价 80，他转手还有得赚）。盐路上多了张来路不明的引子：热度+' + TUNE.FS_HEAT + '、业障-2。（锻造+1）', 'warning');
            say('🧂 假盐引出货——' + TUNE.FS_GAIN + ' 灵石落袋。（热度+' + TUNE.FS_HEAT + '，业障-2）', 'success');
        }
        refresh(); open();
        return true;
    }

    // ============ 72 伪造路引（与盐引同族，小本小险） ============
    function fpRate() { return clamp(TUNE.FP_BASE + skill('口才') * TUNE.FP_MOUTH + skill('锻造') * TUNE.FP_FORGE, 0.2, TUNE.FP_CAP); }
    function forgePass() {
        var ct = inCity();
        if (!ct) { say('🕯️ 先进城——路引的官样文章得照着真本描。', 'info'); return false; }
        var c = cd();
        if (!c) return false;
        var day = dayGate('forgePass');
        if (!day) return false;
        if (Number(c.energy) < TUNE.FP_EN) { say('📜 精力不够描半天（要 ' + TUNE.FP_EN + '）。', 'warning'); return false; }
        _st.forgePass = day;
        advance(TUNE.FP_MINUTES, '伪造路引');
        grow('学识', 1);
        if (dice() < fpRate()) {
            var gain = TUNE.FP_GAIN_MIN + Math.floor(dice() * TUNE.FP_GAIN_RANGE);
            settle({ stones: gain, energy: -TUNE.FP_EN });
            log('📜 照着真本描的关防路引，字口印色都对——出远门的行商痛痛快快付了 ' + gain + ' 灵石（省下户籍司排三日的队）。小本买卖，官府懒得追这种小案。（学识+1）', 'warning');
            say('📜 假路引出手——' + gain + ' 灵石。（学识+1）', 'success');
        } else {
            settle({ energy: -TUNE.FP_EN });
            addHeat(TUNE.FP_FAIL_HEAT, '伪造路引被买主识破');
            repDown(TUNE.FP_FAIL_REP);
            log('📜 买主把路引对着日头看了半晌，冷笑一声：「关防是描的——你当爷没进过户籍司？」当街嚷了两嗓子才走。（' + ct + '声望-' + TUNE.FP_FAIL_REP + '，热度+' + TUNE.FP_FAIL_HEAT + '，钱没挣着）', 'danger');
            say('📜 被买主当街识破——白描半天还惹了风声。（热度+' + TUNE.FP_FAIL_HEAT + '）', 'error');
        }
        refresh(); open();
        return true;
    }

    // ============ 76 私铸假灵石（抄家级：利厚、险更大） ============
    function ffRate() { return clamp(TUNE.FF_BASE + skill('锻造') * TUNE.FF_SKILL, 0.1, TUNE.FF_CAP); }
    function forgeFake() {
        var ct = inCity();
        if (!ct) { say('🕯️ 先进城——铸灵的炉子和药料都在后巷。', 'info'); return false; }
        var c = cd();
        if (!c) return false;
        if (skill('锻造') < TUNE.FF_NEED) { say('💎 私铸假灵石要锻造 ' + TUNE.FF_NEED + ' 起步（现 ' + skill('锻造') + '）——灵光的成色骗不了修士的眼睛，手艺不到就是送死。', 'warning'); return false; }
        var day = dayGate('forgeFake');
        if (!day) return false;
        if (Number(c.energy) < TUNE.FF_EN) { say('💎 精力不够守一整炉（要 ' + TUNE.FF_EN + '）。', 'warning'); return false; }
        // 药料钱先付（一笔事务，不足整笔不成）
        var pre = settle({ stones: -TUNE.FF_COST, energy: -TUNE.FF_EN });
        if (!pre.ok) { say('💎 凑不齐 ' + TUNE.FF_COST + ' 灵石的药料钱——炉子生不起来。（分文未动）', 'warning'); return false; }
        _st.forgeFake = day;
        advance(TUNE.FF_MINUTES, '私铸假灵石');
        grow('锻造', 2);
        var rate = ffRate();
        if (dice() < rate) {
            settle({ stones: TUNE.FF_GAIN, karma: TUNE.FF_KARMA, noto: TUNE.FF_PASS_NOTO });
            addHeat(TUNE.FF_PASS_HEAT, '假灵石出手（市面起了暗流）');
            log('💎 炉子里出来的「灵石」灵光莹然——散修坊市里换了 ' + TUNE.FF_GAIN + ' 灵石的真钱（药料本 ' + TUNE.FF_COST + '，净赚 ' + (TUNE.FF_GAIN - TUNE.FF_COST) + '）。市面上多了批来路不明的灵石：热度+' + TUNE.FF_PASS_HEAT + '、恶名+' + TUNE.FF_PASS_NOTO + '、业障' + TUNE.FF_KARMA + '。（锻造+2）', 'warning');
            say('💎 假灵石出手——' + TUNE.FF_GAIN + ' 灵石回笼（净赚 ' + (TUNE.FF_GAIN - TUNE.FF_COST) + '）。（热度+' + TUNE.FF_PASS_HEAT + '）', 'success');
        } else {
            var fine = deductMin(TUNE.FF_BUST_FINE);
            var short = TUNE.FF_BUST_FINE - fine;
            notoUp(TUNE.FF_BUST_NOTO + (short > 0 ? TUNE.FF_BUST_SHORT_NOTO : 0));
            addHeat(TUNE.FF_BUST_HEAT, '私铸假灵石败露（抄家级大案）', { faceSeen: true });
            repDown(TUNE.FF_BUST_REP);
            deed('bad', '你私铸假灵石败露，坊市当场扭送见官——这是抄家级的大案');
            log('💎 收货的散修捏着「灵石」眉头越皱越紧，忽然运气一激——假灵光散了。「好胆！」坊市的人把你围住扭送见官，药料炉子当场抄没。（恶名+' + TUNE.FF_BUST_NOTO + (short > 0 ? '+' + TUNE.FF_BUST_SHORT_NOTO + '（罚银交不齐，罪加一等）' : '') + '，罚 ' + TUNE.FF_BUST_FINE + ' 灵石' + (short > 0 ? '（尽力赔付 ' + fine + '，短 ' + short + '）' : '') + '，热度+' + TUNE.FF_BUST_HEAT + '，' + ct + '声望-' + TUNE.FF_BUST_REP + '，脸进画影册——私铸灵石是抄家级的罪）', 'danger');
            say('💎 败露了——抄家级大案！（罚 ' + TUNE.FF_BUST_FINE + ' 灵石，热度+' + TUNE.FF_BUST_HEAT + '，脸进画影册）', 'error');
        }
        refresh(); open();
        return true;
    }

    // ============ 70 夹带私货过城门（CityGate.gateCheck 守卫接线） ============
    function takeSmuggle() {
        var ct = inCity();
        if (!ct) { say('🕯️ 先进城——货主要从后巷的柜上交货。', 'info'); return false; }
        if (_st.smuggle) { say('📦 你身上还揣着一票私货（去' + _st.smuggle.from + '以外的城交货）——一票未了，不接第二票。', 'info'); return false; }
        var day = absDay();
        if (!day) { say('🕯️ 天上没钟，契上落不了日子。', 'info'); return false; }
        var pay = TUNE.SM_PAY_MIN + Math.floor(dice() * TUNE.SM_PAY_RANGE);
        _st.smuggle = { from: pkCity(ct), pay: pay, day: day, gateRoll: 0 };
        log('📦 后巷的货主把一只夹层皮箱交到你手上：「捎出城去，随便哪座城，落地柜上交货——脚钱 ' + pay + ' 灵石。」（明账：过城门那一下有两成五的搜查率，查出夹带：货没收、罚 30 灵石、热度+5、脸进画影册。翻墙买通进来的那一趟不搜——守卒收了钱就当没看见。）', 'warning');
        say('📦 接了夹带的活——脚钱 ' + pay + ' 灵石，随便进哪座别的城都能交货。（城门搜查率 ' + Math.round(TUNE.SM_GATE_P * 100) + '%）', 'warning');
        refresh(); open();
        return true;
    }
    // 过城门那一下（city-gate.js gateCheck 落税之后守卫调用；过关条进来的不搜）
    function gateContraband(cty) {
        try {
            var s = _st.smuggle;
            if (!s || s.gateRoll) return false;
            if (pkCity(cty) === s.from) return false;   // 还在本城打转，不算闯关
            s.gateRoll = 1;
            if (dice() < TUNE.SM_GATE_P) {
                _st.smuggle = null;
                var fine = deductMin(TUNE.SM_BUST_FINE);
                var short = TUNE.SM_BUST_FINE - fine;
                notoUp(TUNE.SM_BUST_NOTO + (short > 0 ? 2 : 0));
                addHeat(TUNE.SM_BUST_HEAT, '城门查出夹带私货', { faceSeen: true });
                deed('bad', '你夹带私货过城门被搜了出来，人赃并获当街过堂');
                log('📦 城门洞里，守卒的探条捅进了皮箱夹层——「好大的胆子！」私货当场没收，你被按在门洞里画影收册。（罚 ' + TUNE.SM_BUST_FINE + ' 灵石' + (short > 0 ? '（尽力赔付 ' + fine + '，短 ' + short + '，罪加一等）' : '') + '，恶名+' + TUNE.SM_BUST_NOTO + '，热度+' + TUNE.SM_BUST_HEAT + '，脸进画影册——这一票血本无归）', 'danger');
                say('📦 夹带被城门搜出——货没了、罚了钱、脸进了画影册！（热度+' + TUNE.SM_BUST_HEAT + '）', 'error');
                refresh();
                return true;
            }
            log('📦 守卒的探条在皮箱上敲了两下，终究没捅进夹层——放行。（这一票的城门关过了，落地就能交货）', 'info');
            return true;
        } catch (e) { console.warn('[静默失败] js/npcs/crime-works.js · gateContraband：城门这一搜没走成——货还在身上', e && e.message); return false; }
    }
    function deliverSmuggle() {
        var ct = inCity();
        if (!ct) { say('🕯️ 你身在城外——交货要在城里的柜上。', 'info'); return false; }
        var s = _st.smuggle;
        if (!s) { say('📦 你身上没有夹带的货。', 'info'); return false; }
        if (pkCity(ct) === s.from) { say('📦 货要在别的城交——本城的柜上不接本城的货（原路退回算违约）。', 'info'); return false; }
        _st.smuggle = null;
        settle({ stones: s.pay });
        addHeat(TUNE.SM_DELIVER_HEAT, '夹带私货交割（道上留了痕）');
        log('📦 ' + ct + '的柜上验了货，数目对得上——脚钱 ' + s.pay + ' 灵石两清。柜上的先生多看了你一眼：「稳当人，下回还有活。」（热度+' + TUNE.SM_DELIVER_HEAT + '：私货过手，道上总会留点痕）', 'warning');
        say('📦 交货两清——' + s.pay + ' 灵石落袋。（热度+' + TUNE.SM_DELIVER_HEAT + '）', 'success');
        refresh(); open();
        return true;
    }

    // ============ 71 落草收保护费（七日多日程：新日订阅自动结账，绝不追人） ============
    function goBandit() {
        var ct = inCity();
        if (!ct) { say('🕯️ 先进城——落草也得先有人引你上山。', 'info'); return false; }
        if (_st.bandit) { say('🏴 你正在山上落着草——第 ' + _st.bandit.end + ' 日散伙，账自己会结。（也可以提前下山）', 'info'); return false; }
        if (heatNow() >= TUNE.BD_HEAT_GATE) { say('🏴 你头上的民愤热度 ' + heatNow() + '——官府正盯着各条要道，这时候上山就是往网里钻。等风头冷到 ' + TUNE.BD_HEAT_GATE + ' 以下再来。', 'warning'); return false; }
        var day = absDay();
        if (!day) { say('🕯️ 天上没钟，山上不记无名之日。', 'info'); return false; }
        _st.bandit = { start: day, end: day + TUNE.BD_DAYS, take: 0, raidWin: 0, raidLose: 0, from: pkCity(ct) };
        log('🏴 你跟着后巷的引路人上了三十里外的黑风岭——落草七日，收过路商队的保护费。（明账：每日保护费 8~20 灵石骰、热度每日+2；第三日起每日一成五几率官兵进剿，胜负按境界——赢了搜出军资 +15，输了保护费折半、气血-30。散伙那日账自己结，也可随时提前下山。）', 'warning');
        say('🏴 落草了——七日后散伙结账。（热度每日+2，第三日起防官兵进剿）', 'warning');
        refresh(); open();
        return true;
    }
    function comeDown(early) {
        var b = _st.bandit;
        if (!b) { say('🏴 你没在山上。', 'info'); return false; }
        _st.bandit = null;
        var take = Math.max(0, Math.floor(Number(b.take) || 0));
        if (take > 0) settle({ stones: take });
        settle({ karma: TUNE.BD_OUT_KARMA });
        try { if (b.from && typeof window.reduceReputation === 'function') window.reduceReputation(b.from, TUNE.BD_OUT_REP); } catch (eR) {}
        deed('bad', '你在黑风岭落了草，收过路商队的保护费——商道上都在传这一伙');
        log('🏴 ' + (early ? '你提前下了山' : '七日散伙，你下了山') + '——共收保护费 ' + take + ' 灵石' + (b.raidWin || b.raidLose ? '（进剿 ' + (b.raidWin + b.raidLose) + ' 场：打退 ' + b.raidWin + '、失手 ' + b.raidLose + '）' : '') + '。业障' + TUNE.BD_OUT_KARMA + '、原籍城声望-' + TUNE.BD_OUT_REP + '。山上的日子结束了，官府的册子上多了一笔。', 'warning');
        say('🏴 下山了——保护费 ' + take + ' 灵石入袋。（业障' + TUNE.BD_OUT_KARMA + '）', 'warning');
        refresh(); open();
        return true;
    }
    // 新日总账：落草每日保护费 + 进剿 + 暗桩风声 + 市面递话（全订阅自动结，零按钮零追人）
    function dailyTick() {
        var d = absDay();
        if (!d) return;
        // —— 落草账 ——
        var b = _st.bandit;
        if (b) {
            if (d > b.start) {
                if (d >= b.end) { comeDown(false); }
                else {
                    var take = TUNE.BD_DAILY_MIN + Math.floor(dice() * TUNE.BD_DAILY_RANGE);
                    b.take = Math.max(0, Math.floor(Number(b.take) || 0) + take);
                    addHeat(TUNE.BD_DAILY_HEAT, '落草收保护费');
                    var line = '🏴 山上过了一日：拦了两支商队，保护费 +' + take + ' 灵石（累计 ' + b.take + '），热度+' + TUNE.BD_DAILY_HEAT + '。';
                    if (d - b.start >= TUNE.BD_RAID_FROM && dice() < TUNE.BD_RAID_P) {
                        var winP = clamp(TUNE.BD_RAID_BASE + playerTier() * TUNE.BD_RAID_TIER, 0.2, TUNE.BD_RAID_CAP);
                        if (dice() < winP) {
                            b.take += TUNE.BD_RAID_WIN_BONUS; b.raidWin = (b.raidWin || 0) + 1;
                            addHeat(TUNE.BD_RAID_WIN_HEAT, '打退进剿官兵');
                            line += ' 官兵进剿——被你带着弟兄打退了，还搜出军资 ' + TUNE.BD_RAID_WIN_BONUS + ' 灵石（热度+' + TUNE.BD_RAID_WIN_HEAT + '）。';
                        } else {
                            var lost = Math.floor(b.take / 2);
                            b.take -= lost; b.raidLose = (b.raidLose || 0) + 1;
                            hurtHp(TUNE.BD_RAID_LOSE_HP);
                            addHeat(TUNE.BD_RAID_LOSE_HEAT, '进剿失利');
                            line += ' 官兵进剿——你没接住这一仗，被冲散了山寨：保护费折半（-' + lost + '）、气血-' + TUNE.BD_RAID_LOSE_HP + '（热度+' + TUNE.BD_RAID_LOSE_HEAT + '）。';
                        }
                    }
                    log(line, 'warning');
                }
            }
        }
        // —— 暗桩账：每日 2% 暴露；人在桩城才递市面话 ——
        var foundList = [];
        for (var ck in _st.spies) {
            if (!Object.prototype.hasOwnProperty.call(_st.spies, ck)) continue;
            if (dice() < TUNE.SPY_FOUND_P) { foundList.push(ck); continue; }
            if (pkCity(city()) === ck) {
                var intel = marketIntel();
                if (intel) log('🕵️ ' + ck + '的暗桩借着早市递来一句话：' + intel, 'info');
            }
        }
        foundList.forEach(function (ck) {
            delete _st.spies[ck];
            addHeat(TUNE.SPY_FOUND_HEAT, '暗桩被官府拔出');
            log('🕵️ ' + ck + '的暗桩被官府拔了——人下了大牢，你们之间的线断了。（热度+' + TUNE.SPY_FOUND_HEAT + '：官府顺线摸到你头上一点风声）', 'warning');
        });
        if (foundList.length) refresh();
    }

    // ============ 74 安暗桩（一城一桩：每日递真行情，2% 暴露） ============
    function plantSpy() {
        var ct = inCity();
        if (!ct) { say('🕵️ 先进城——暗桩要扎在街面上。', 'info'); return false; }
        var key = pkCity(ct);
        if (_st.spies[key]) { say('🕵️ ' + ct + '已经有一个暗桩在替你盯着（第 ' + _st.spies[key] + ' 日落桩）——一城一桩，多了照应不过来。', 'info'); return false; }
        var r = settle({ stones: -TUNE.SPY_COST });
        if (!r.ok) { say('🕵️ 安家费要 ' + TUNE.SPY_COST + ' 灵石——手头不足，桩安不下去。（分文未动）', 'warning'); return false; }
        _st.spies[key] = absDay() || 1;
        log('🕵️ 你把 ' + TUNE.SPY_COST + ' 灵石安家费交给了后巷引荐的闲汉——' + ct + '的暗桩落下了。（明账：你在城里时，每日早市他递一条真行情；每日 2% 被官府拔出，拔了线断、热度+1。）', 'warning');
        say('🕵️ ' + ct + '的暗桩安下了——每日早市递行情。（2%/日暴露率）', 'success');
        refresh(); open();
        return true;
    }

    // ============ 73 卖情报（getGossipInfo 复活：丐帮消息网的第一个真买主） ============
    function marketIntel() {
        try {
            var MD = window.MarketDynamic;
            if (MD && typeof MD.priceMul === 'function' && MD.CITIES && MD.CATEGORIES) {
                var best = null;
                for (var i = 0; i < MD.CITIES.length; i++) {
                    for (var j = 0; j < MD.CATEGORIES.length; j++) {
                        var m = Number(MD.priceMul(MD.CITIES[i], MD.CATEGORIES[j])) || 1;
                        if (!best || m > best.mul) best = { region: MD.CITIES[i], cat: MD.CATEGORIES[j], mul: m };
                    }
                }
                if (best && best.mul > 1.02) return '「' + best.region + '的' + best.cat + '贵到 ' + (Math.round(best.mul * 10) / 10) + ' 倍了——有人在大收，脚力勤快的能赚。」';
            }
        } catch (e) { console.warn('[静默失败] js/npcs/crime-works.js · marketIntel：行情账没读出来，退回闲话', e && e.message); }
        return '';
    }
    function intelText() {
        var roll = dice();
        if (roll < 0.34 && typeof window.getGossipInfo === 'function') {
            try { var g = window.getGossipInfo(); if (g) return String(g); } catch (e) {}
        }
        if (roll < 0.67) { var m = marketIntel(); if (m) return m; }
        try {
            if (typeof window.getCitizenGossip === 'function') {
                var pool = window.getCitizenGossip() || [];
                if (pool.length) { var g2 = pool[Math.floor(dice() * pool.length)]; if (g2 && g2.text) return '「' + g2.text + '」'; }
            }
        } catch (e2) {}
        return '「东家长西家短——茶棚里听来的闲话，偏就有人愿意买。」';
    }
    function sellIntel() {
        var ct = inCity();
        if (!ct) { say('📡 先进城——茶棚里才有消息，后巷才有买主。', 'info'); return false; }
        var c = cd();
        if (!c) return false;
        var day = dayGate('intel');
        if (!day) return false;
        if (Number(c.energy) < TUNE.IN_EN) { say('📡 精力不够泡半天茶棚（要 ' + TUNE.IN_EN + '）。', 'warning'); return false; }
        _st.intel = day;
        advance(TUNE.IN_MINUTES, '茶棚听风');
        var txt = intelText();
        var gain = TUNE.IN_GAIN_MIN + Math.floor(dice() * TUNE.IN_GAIN_RANGE);
        var gb = false;
        try { gb = !!(window.BeggarAlms && typeof window.BeggarAlms.goodwill === 'function' && window.BeggarAlms.goodwill() >= TUNE.IN_GB_GOODWILL); } catch (e) {}
        if (gb) gain = Math.round(gain * (1 + TUNE.IN_GB_BONUS));
        settle({ stones: gain, energy: -TUNE.IN_EN });
        log('📡 你在茶棚里泡了半晌，听来一条消息：' + txt + ' 转手卖给后巷的牙人，得了 ' + gain + ' 灵石' + (gb ? '——丐帮的耳目认得你，价钱上浮了两成' : '') + '。（消息你也听了一耳朵，跑商贩货自己掂量）', 'success');
        say('📡 情报出手——' + gain + ' 灵石' + (gb ? '（丐帮缘分加成两成）' : '') + '。', 'success');
        refresh(); open();
        return true;
    }

    // ============ 后巷营生名册（牌面） ============
    function worksOk(ct) {
        var c = ct || city();
        if (!c) return false;
        try { if (window.locationSystem && window.locationSystem.getCityData && !window.locationSystem.getCityData(c)) return false; } catch (e) {}
        return true;
    }
    function open() {
        var ct = city();
        if (!ct) { say('🕯️ 先进城——后巷的门路只在城里有。', 'info'); return false; }
        var d = absDay();
        var html = '<p class="text-sm text-gray-400 mb-2">黑市柜后那条窄巷里，有人替你把各路「营生」的门道摆开了——每一票的成算、凶险和价钱都写在明处，干不干你自己挑：</p>';
        // —— 仿造台 ——
        html += '<p class="text-xs text-gray-300 font-bold mb-1">🔨 仿造台（一日一票）</p>';
        var fsOk = skill('锻造') >= TUNE.FS_NEED;
        html += '<button onclick="CrimeWorks.forgeSalt()" class="w-full p-2 rounded mb-1 text-left text-sm ' + (fsOk && _st.forgeSalt !== d ? 'bg-red-950 hover:bg-red-900' : 'bg-gray-800 opacity-60') + ' text-white">🧂 伪造盐引（锻造 ' + TUNE.FS_NEED + ' 起步 · 仿成率 ' + Math.round(fsRate() * 100) + '% · 出货 ' + TUNE.FS_GAIN + ' 灵石 · 出货时 ' + Math.round(TUNE.FS_CHECK_P * 100) + '% 被盐课司查验——私盐大案：罚 ' + TUNE.FS_BUST_FINE + '、热度+' + TUNE.FS_BUST_HEAT + '、脸进画影册）' + (_st.forgeSalt === d ? '<span class="block text-xs text-amber-300">今日已做过一票</span>' : (!fsOk ? '<span class="block text-xs text-gray-500">🔒 锻造不足 ' + TUNE.FS_NEED + '（现 ' + skill('锻造') + '）</span>' : '')) + '</button>';
        html += '<button onclick="CrimeWorks.forgePass()" class="w-full p-2 rounded mb-1 text-left text-sm ' + (_st.forgePass !== d ? 'bg-red-950 hover:bg-red-900' : 'bg-gray-800 opacity-60') + ' text-white">📜 伪造路引（无门槛 · 仿成率 ' + Math.round(fpRate() * 100) + '% · 出货 ' + TUNE.FP_GAIN_MIN + '~' + (TUNE.FP_GAIN_MIN + TUNE.FP_GAIN_RANGE - 1) + ' 灵石 · 砸了被买主当街识破：热度+' + TUNE.FP_FAIL_HEAT + '）' + (_st.forgePass === d ? '<span class="block text-xs text-amber-300">今日已做过一票</span>' : '') + '</button>';
        var ffOk = skill('锻造') >= TUNE.FF_NEED;
        html += '<button onclick="CrimeWorks.forgeFake()" class="w-full p-2 rounded mb-1 text-left text-sm ' + (ffOk && _st.forgeFake !== d ? 'bg-red-950 hover:bg-red-900' : 'bg-gray-800 opacity-60') + ' text-white">💎 私铸假灵石（锻造 ' + TUNE.FF_NEED + ' 起步 · 药料 ' + TUNE.FF_COST + ' 灵石先付 · 过手率 ' + Math.round(ffRate() * 100) + '% · 出手 +' + TUNE.FF_GAIN + ' 灵石 · 败露是抄家级大案：罚 ' + TUNE.FF_BUST_FINE + '、热度+' + TUNE.FF_BUST_HEAT + '、恶名+' + TUNE.FF_BUST_NOTO + '、脸进画影册）' + (_st.forgeFake === d ? '<span class="block text-xs text-amber-300">今日已开过一炉</span>' : (!ffOk ? '<span class="block text-xs text-gray-500">🔒 锻造不足 ' + TUNE.FF_NEED + '（现 ' + skill('锻造') + '）——灵光成色骗不了修士</span>' : '')) + '</button>';
        // —— 夜活 ——
        html += '<p class="text-xs text-gray-300 font-bold mb-1 mt-2">🌙 夜活（一日一票）</p>';
        html += '<button onclick="CrimeWorks.digGrave()" class="w-full p-2 rounded mb-1 text-left text-sm ' + (_st.digs !== d ? 'bg-stone-800 hover:bg-stone-700' : 'bg-gray-800 opacity-60') + ' text-white">🪦 出城盗墓（精力 ' + TUNE.DIG_EN + ' · 一夜 · 五成起货 15~45 灵石、三成空坟、两成惊动——惊动的一半是守墓傀真仗（打翻得 25~50 灵石），一半是火把照脸（热度+' + TUNE.DIG_TROUBLE_HEAT + '）；起货也损阴德：业障' + TUNE.DIG_KARMA + '、热度+' + TUNE.DIG_HEAT + '）' + (_st.digs === d ? '<span class="block text-xs text-amber-300">昨夜刚刨过</span>' : '') + '</button>';
        html += '<button onclick="CrimeWorks.sellIntel()" class="w-full p-2 rounded mb-1 text-left text-sm ' + (_st.intel !== d ? 'bg-teal-900 hover:bg-teal-800' : 'bg-gray-800 opacity-60') + ' text-white">📡 茶棚听风卖情报（精力 ' + TUNE.IN_EN + ' · 半日 · 一条消息 ' + TUNE.IN_GAIN_MIN + '~' + (TUNE.IN_GAIN_MIN + TUNE.IN_GAIN_RANGE - 1) + ' 灵石' + (TUNE.IN_GB_BONUS ? '，丐帮缘分深再加两成' : '') + ' · 不犯官府——消息自己也能听一耳朵）' + (_st.intel === d ? '<span class="block text-xs text-amber-300">今日已卖过一条</span>' : '') + '</button>';
        // —— 夹带 ——
        html += '<p class="text-xs text-gray-300 font-bold mb-1 mt-2">📦 夹带私货（城门联动）</p>';
        if (_st.smuggle) {
            var s = _st.smuggle;
            html += '<p class="text-xs text-amber-300/80 mb-1">身上一票私货（' + s.from + '收的，脚钱 ' + s.pay + ' 灵石）——进任意别的城，柜上交货' + (s.gateRoll ? '；城门那一关已经过了' : '；过城门那一下 ' + Math.round(TUNE.SM_GATE_P * 100) + '% 被搜') + '。</p>' +
                '<button onclick="CrimeWorks.deliverSmuggle()" class="w-full p-2 rounded mb-1 text-left text-sm ' + (pkCity(ct) !== s.from ? 'bg-amber-900 hover:bg-amber-800' : 'bg-gray-800 opacity-60') + ' text-white">📦 柜上交货（+' + s.pay + ' 灵石，热度+1）' + (pkCity(ct) === s.from ? '<span class="block text-xs text-gray-500">货要在别的城交</span>' : '') + '</button>';
        } else {
            html += '<button onclick="CrimeWorks.takeSmuggle()" class="w-full p-2 rounded mb-1 text-left text-sm bg-amber-950 hover:bg-amber-900 text-white">📦 接一票夹带的活（脚钱 50~90 灵石骰 · 过城门 ' + Math.round(TUNE.SM_GATE_P * 100) + '% 被搜：货没收、罚 ' + TUNE.SM_BUST_FINE + '、热度+' + TUNE.SM_BUST_HEAT + '、脸进画影册 · 翻墙买通进来的那一趟不搜）</button>';
        }
        // —— 落草 ——
        html += '<p class="text-xs text-gray-300 font-bold mb-1 mt-2">🏴 落草（七日多日程）</p>';
        if (_st.bandit) {
            var b = _st.bandit;
            html += '<p class="text-xs text-amber-300/80 mb-1">你在黑风岭落着草——已收保护费 ' + b.take + ' 灵石，第 ' + b.end + ' 日散伙' + (d && d < b.end ? '（还有 ' + (b.end - d) + ' 日）' : '') + '。每日热度+2，第三日起防官兵进剿。</p>' +
                '<button onclick="CrimeWorks.comeDown(true)" class="w-full p-2 rounded mb-1 text-left text-sm bg-gray-700 hover:bg-gray-600 text-white">🏳️ 提前下山（拿上已收的保护费走人）</button>';
        } else {
            var bdOk = heatNow() < TUNE.BD_HEAT_GATE;
            html += '<button onclick="CrimeWorks.goBandit()" class="w-full p-2 rounded mb-1 text-left text-sm ' + (bdOk ? 'bg-red-950 hover:bg-red-900' : 'bg-gray-800 opacity-60') + ' text-white">🏴 上山落草收保护费（七日 · 每日 8~20 灵石骰、热度每日+2 · 第三日起每日一成五官兵进剿：胜搜军资 +15、败保护费折半气血-30 · 散伙业障' + TUNE.BD_OUT_KARMA + '原籍声望-' + TUNE.BD_OUT_REP + '）' + (!bdOk ? '<span class="block text-xs text-gray-500">🔒 民愤热度 ' + heatNow() + ' ≥ ' + TUNE.BD_HEAT_GATE + '——官府盯着要道，等风头冷了再来</span>' : '') + '</button>';
        }
        // —— 暗桩 ——
        html += '<p class="text-xs text-gray-300 font-bold mb-1 mt-2">🕵️ 暗桩网（一城一桩）</p>';
        var keys = [];
        for (var ck in _st.spies) { if (Object.prototype.hasOwnProperty.call(_st.spies, ck)) keys.push(ck); }
        if (keys.length) html += '<p class="text-xs text-gray-400 mb-1">在桩：' + keys.join('、') + '（你在桩城时每日递一条真行情；每桩每日 2% 被官府拔出）。</p>';
        if (_st.spies[pkCity(ct)]) html += '<p class="text-xs text-gray-500 mb-1">' + ct + '的暗桩在替你盯着——早市的话会自己递到。</p>';
        else html += '<button onclick="CrimeWorks.plantSpy()" class="w-full p-2 rounded mb-1 text-left text-sm bg-indigo-950 hover:bg-indigo-900 text-white">🕵️ 在' + ct + '安一个暗桩（安家费 ' + TUNE.SPY_COST + ' 灵石 · 每日真行情 · 2%/日暴露：线断热度+1）</button>';
        html += '<p class="text-[11px] text-gray-500 mt-2">后巷的规矩：钱是明的，祸也是明的——热度攒到 30，悬赏牌上就有你的名字（扒窃另在街面上，NPC 对话里那枚「🫳 扒窃」按钮）。</p>';
        if (typeof window.showModal === 'function') window.showModal('🕯️ 黑市后巷 · 营生名册 · ' + ct, html);
        return true;
    }

    // ============ 存读档（StateRegistry 正门，读档归一化：坏账不进门） ============
    function _export() { return JSON.parse(JSON.stringify(_st)); }
    function _import(d) {
        var s = { digs: 0, forgeSalt: 0, forgePass: 0, forgeFake: 0, intel: 0, smuggle: null, bandit: null, spies: {} };
        if (d && typeof d === 'object') {
            ['digs', 'forgeSalt', 'forgePass', 'forgeFake', 'intel'].forEach(function (k) {
                s[k] = Number.isFinite(Number(d[k])) ? Math.max(0, Math.floor(Number(d[k]))) : 0;
            });
            var sm = d.smuggle;
            if (sm && typeof sm === 'object' && typeof sm.from === 'string' && sm.from && Number(sm.pay) > 0 && Number.isFinite(Number(sm.day))) {
                s.smuggle = { from: sm.from.slice(0, 30), pay: clamp(Math.floor(Number(sm.pay)), 1, 500), day: Math.floor(Number(sm.day)), gateRoll: Number(sm.gateRoll) ? 1 : 0 };
            }
            var bd = d.bandit;
            if (bd && typeof bd === 'object' && Number.isFinite(Number(bd.start)) && Number.isFinite(Number(bd.end)) && Number(bd.end) > Number(bd.start)) {
                s.bandit = { start: Math.floor(Number(bd.start)), end: Math.floor(Number(bd.end)), take: clamp(Math.floor(Number(bd.take) || 0), 0, 99999),
                    raidWin: clamp(Math.floor(Number(bd.raidWin) || 0), 0, 99), raidLose: clamp(Math.floor(Number(bd.raidLose) || 0), 0, 99),
                    from: typeof bd.from === 'string' ? bd.from.slice(0, 30) : '' };
            }
            if (d.spies && typeof d.spies === 'object') {
                var n = 0;
                for (var k in d.spies) {
                    if (n++ >= 30) break;
                    if (Number.isFinite(Number(d.spies[k]))) s.spies[String(k).slice(0, 30)] = Math.max(0, Math.floor(Number(d.spies[k])));
                }
            }
        }
        _st = s;
    }
    function _reset() { _st = { digs: 0, forgeSalt: 0, forgePass: 0, forgeFake: 0, intel: 0, smuggle: null, bandit: null, spies: {} }; _pickLog = {}; _pickDay = { day: -1, n: 0 }; }
    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        window.StateRegistry.register('crimeWorks', { version: 1, export: _export, import: _import, reset: _reset });
    }
    try {
        if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') window.timeSystem.onNewDaySubscribe(function () {
            try { dailyTick(); } catch (e) { console.warn('[静默失败] js/npcs/crime-works.js · dailyTick：黑道的日账没结成', e && e.message); }
        });
    } catch (eSub) {}

    window.CrimeWorks = {
        TUNE: TUNE,
        worksOk: worksOk, open: open,
        pick: pick, pickRate: pickRate, buildPickButton: buildPickButton,
        digGrave: digGrave, settleTombFight: settleTombFight,
        forgeSalt: forgeSalt, forgePass: forgePass, forgeFake: forgeFake,
        fsRate: fsRate, fpRate: fpRate, ffRate: ffRate,
        takeSmuggle: takeSmuggle, gateContraband: gateContraband, deliverSmuggle: deliverSmuggle,
        goBandit: goBandit, comeDown: comeDown, dailyTick: dailyTick,
        sellIntel: sellIntel, intelText: intelText, marketIntel: marketIntel,
        plantSpy: plantSpy,
        state: _export
    };
    window.openCrimeWorks = function () { return open(); };
})();
