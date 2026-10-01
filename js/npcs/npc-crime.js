// ==================== v25.8 黑道与人情批（第一百五十批 · 用户点单）· 黑道账 ====================
// 用户点单：「我能不能威胁NPC？随便挑一个抢劫？去钱庄找到柜台NPC，威胁并让她出卖钱庄？」
// 此前对具名 NPC 只有非暴力的摸包（v25.5）、拿秘密要挟（secret-leverage）、威压代付人情（v20.37）——
// 「当面威胁」「持械抢劫」「抢了之后官府的反应」全是空白；钱庄柜台上的姑娘只是文案摆设；
// 生平里「通缉画影上有你的脸」一直是假的。本账把这五条一次接通：
//   ① 威胁：对话面板常驻「🗡️ 威胁」——口才＋境界差＋旧威压定成败；成了对方怕你（fear 威压轨真账）、
//      挤出灵石，并按职业另给一份「黑面孝敬」（商人惧价/铁匠交兵器/炼丹师交丹/治疗师义诊/隐士指残页/
//      村民给碎钱业障翻倍）；导师长老不吃这套反而出手教训，战士对手直接拔刀（转抢劫战斗）。
//   ② 抢劫：「💰 抢劫」逼对方交出全部家当——能反抗的（战士/对手/境界不低于你）拔刀真仗
//      （startBattle + _isNpcRobbery 旗 → app.js 战后分支结算：赢了搜行囊真拿货，输了反被搜身）；
//      不能反抗的走威逼掷骰。业障/恶名/民愤热度三本账一起记，风声进传闻池（playerPushDeed）。
//   ③ 通缉追捕链：民愤热度（heat 0~100）落档（StateRegistry 'crimeLedger' 正门）——热度 ≥30 官府画影通缉、
//      悬赏金挂账；每日新日风头冷 3 点，冷到线下悬赏自动销案；通缉期间赏金猎人进城堵你（真仗，
//      _isBountyHunt 旗：赢了搜他半份赏金、输了被扭送缴清）；夜巡盘查吃 patrolBoost 加档（daily-events 守卫接线）；
//      司法堂柜台可缴清悬赏销案（facility-offices 守卫接线）。
//   ④ 钱庄柜娘：每城一张熟面孔（城名播种定名，回访还是她）。威胁她出卖钱庄——成了私漏库银（有欠条先烧欠条），
//      她从此怕你（下次更好得手）；砸了她敲锣报官：恶名+5、本城声望-40、罚金 50、钱庄闭门 3 日
//      （BankService.bankBanned 守卫接线）、热度大涨、赏金猎人来得飞快。
//   ⑤ 街面抢劫的罪行账（heat/pushDeed）由 citizen-life.js 走本账 addHeat 正门记入同一本通缉账。
// 口径（与摸包判例对齐）：威胁/抢劫每人每日一次（运行时账，悬赏榜同款「每日刷新合理」惯例）；
//   道侣与挚交（好感≥80）下不去手；黑面孝敬里「交东西」类（铁匠/炼丹师）每人终身一次（落档 perks，防印钞）；
//   灵石走 DataManager 单一真源，铜钱/业障/恶名走 RewardService 正门，声望走 reduceReputation 正门。
// 杀人不在本批：杀具名 NPC 的连锁（杀孽/仇家/门派追杀）留作另案。
(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    var TUNE = {
        // ① 威胁
        THREAT_BASE: 0.30, THREAT_SKILL: 0.004, THREAT_SKILL_CAP: 0.24,
        THREAT_TIER: 0.10, THREAT_FEAR: 0.002, THREAT_RATE_MIN: 0.05, THREAT_RATE_MAX: 0.90,
        THREAT_FEAR_GAIN: 12, THREAT_AFF_HIT: -8, THREAT_RESPECT_HIT: -5,
        THREAT_LOOT_MIN: 5, THREAT_LOOT_RANGE: 10,
        THREAT_KARMA: -2, THREAT_NOTO: 1, THREAT_HEAT: 1,
        THREAT_FAIL_HATRED: 10, THREAT_FAIL_AFF: -5,
        THREAT_SNITCH_P: 0.4, THREAT_SNITCH_NOTO: 2, THREAT_SNITCH_HEAT: 2, THREAT_SNITCH_REP: 10,
        ELDER_PUNISH_QI: 15, MENTOR_AFF_HIT: -3,
        // ② 抢劫（威逼掷骰路）
        ROB_BASE: 0.45, ROB_TIER: 0.10, ROB_SKILL: 0.002, ROB_RATE_MIN: 0.20, ROB_RATE_MAX: 0.92,
        ROB_LOOT_MIN: 10, ROB_LOOT_RANGE: 15,
        ROB_AFF: -20, ROB_HATRED: 15, ROB_FEAR: 20, ROB_KARMA: -4, ROB_NOTO: 2, ROB_HEAT: 3,
        ROB_FAIL_SNITCH_P: 0.5, ROB_SNITCH_NOTO: 3, ROB_SNITCH_REP: 20, ROB_SNITCH_FINE: 40, ROB_SNITCH_FINE_SHORT: 3,
        ROB_FIGHT_LEVEL_AT: 30,           // 无职业标签但等级到线的也会拔刀
        // 抢劫战斗（赢了搜身）
        BATTLE_LOOT_MIN: 15, BATTLE_LOOT_RANGE: 25, BATTLE_ITEMS_MAX: 2,
        BATTLE_WIN_FEAR: 30, BATTLE_WIN_HATRED: 25, BATTLE_WIN_AFF: -30,
        BATTLE_WIN_KARMA: -5, BATTLE_WIN_NOTO: 3, BATTLE_WIN_HEAT: 5,
        BATTLE_LOSE_PLUNDER: 0.25, BATTLE_LOSE_NOTO: 2, BATTLE_LOSE_HEAT: 3, BATTLE_LOSE_HATRED: 20, BATTLE_LOSE_AFF: -10,
        // ③ 通缉追捕链
        WANTED_AT: 30, BOUNTY_BASE: 30, BOUNTY_PER_HEAT: 3, BOUNTY_PER_CRIME: 12,
        HEAT_DECAY: 3, HEAT_MAX: 100,
        HUNTER_P_BASE: 0.08, HUNTER_P_DIV: 300, HUNTER_P_CAP: 0.45,
        HUNTER_WIN_FRAC: 0.5, HUNTER_WIN_PLUS: 10, HUNTER_WIN_BOUNTY_OFF: 30, HUNTER_WIN_HEAT: 5,
        HUNTER_LOSE_HEAT_OFF: 20, HUNTER_LOSE_SHORT_NOTO: 3, HUNTER_LOSE_SHORT_QI: 20,
        PATROL_BOOST: 15,
        // ④ 钱庄柜娘
        TELLER_BASE: 0.25, TELLER_SKILL: 0.004, TELLER_SKILL_CAP: 0.30,
        TELLER_FEAR_BONUS: 0.25, TELLER_WANTED_PEN: 0.15, TELLER_RATE_MIN: 0.05, TELLER_RATE_MAX: 0.90,
        TELLER_LOOT_MIN: 50, TELLER_LOOT_RANGE: 40, TELLER_KARMA: -3, TELLER_HEAT: 5, TELLER_CD_DAYS: 10,
        TELLER_FAIL_NOTO: 5, TELLER_FAIL_HEAT: 8, TELLER_FAIL_REP: 40, TELLER_FAIL_FINE: 50,
        TELLER_FAIL_FINE_SHORT: 3, TELLER_BAN_DAYS: 3,
        // 黑面孝敬
        PERK_VILLAGER_COPPER: 20, PERK_VILLAGER_KARMA: -2,
        PERK_GENERIC_COPPER_MIN: 10, PERK_GENERIC_COPPER_RANGE: 20,
        PERK_HEAL_FRAC: 0.4
    };

    var TELLER_NAMES = ['柳娘', '苏芸', '阿绣', '万金', '青钱', '朱月'];
    var HUNTER_SURNAMES = ['铁面', '独眼', '快刀', '追风', '夜枭', '索命'];

    var _st = { heat: 0, bounty: 0, log: [], bankBan: {}, tellers: {}, perks: {}, lastCoolDay: -1 };
    var _threatLog = {};   // { npcId: absoluteDay } 运行时账（与摸包同款口径）
    var _robLog = {};

    // ============ 小工具（黑市信用簿/摸包同款口径） ============
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
    function settle(spec, source) {
        try {
            if (window.RewardService && typeof window.RewardService.apply === 'function') {
                var r = window.RewardService.apply(spec, { source: source || '黑道', city: city() });
                return { ok: !!(r && r.success !== false), note: r && r.messages ? r.messages.join('、') : '' };
            }
        } catch (e) { console.warn('[静默失败] js/npcs/npc-crime.js · settle：这笔赃账没落成一笔', e && e.message); }
        return { ok: false, note: '' };
    }
    function stonesNow() {
        try {
            var DM = window.DataManager || (window.XianXia && window.XianXia.DataManager);
            if (DM && typeof DM.getSpiritStones === 'function') return Number(DM.getSpiritStones()) || 0;
        } catch (e) { console.warn('[静默失败] js/npcs/npc-crime.js · stonesNow：现银没读到，按角色面上的数算', e && e.message); }
        var c = cd();
        return c ? (Number(c.spiritStones) || 0) : 0;
    }
    function addStones(n) {
        try {
            var DM = window.DataManager || (window.XianXia && window.XianXia.DataManager);
            if (DM && typeof DM.addSpiritStones === 'function') { DM.addSpiritStones(n); return; }
        } catch (e) { console.warn('[静默失败] js/npcs/npc-crime.js · addStones：DataManager 正门没走通，落回角色字段', e && e.message); }
        var c = cd();
        if (c) c.spiritStones = (Number(c.spiritStones) || 0) + n;
    }
    function deductStones(n) {
        try {
            var DM = window.DataManager || (window.XianXia && window.XianXia.DataManager);
            if (DM && typeof DM.deductSpiritStones === 'function') return !!DM.deductSpiritStones(n);
        } catch (e) { console.warn('[静默失败] js/npcs/npc-crime.js · deductStones：DataManager 正门没走通，落回角色字段', e && e.message); }
        var c = cd();
        if (c && (Number(c.spiritStones) || 0) >= n) { c.spiritStones -= n; return true; }
        return false;
    }
    function repDown(n) {
        var ct = city();
        if (!ct || typeof window.reduceReputation !== 'function') return false;
        try { window.reduceReputation(ct, n); return true; } catch (e) { console.warn('[静默失败] js/npcs/npc-crime.js · repDown：城望没扣成', e && e.message); return false; }
    }
    function deed(mood, s) {
        try { if (typeof window.playerPushDeed === 'function') window.playerPushDeed(mood, s); } catch (e) { console.warn('[静默失败] js/npcs/npc-crime.js · deed：风声没递进传闻池', e && e.message); }
    }
    function advance(min, why) {
        try { if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') window.timeSystem.advanceTime(min, why); } catch (e) { console.warn('[静默失败] js/npcs/npc-crime.js · advance：时辰没扣成', e && e.message); }
    }
    function refresh() {
        try { if (window.updateCharacterStatus) window.updateCharacterStatus(); } catch (e) { console.warn('[静默失败] js/npcs/npc-crime.js · refresh：面板没刷新', e && e.message); }
        try { if (typeof window.updateCurrencyUI === 'function') window.updateCurrencyUI(); } catch (e2) { console.warn('[静默失败] js/npcs/npc-crime.js · refresh：钱袋没刷新', e2 && e2.message); }
    }
    function skill(name) {
        try { if (typeof window.getLifeSkill === 'function') return Number(window.getLifeSkill(name)) || 0; } catch (e) { console.warn('[静默失败] js/npcs/npc-crime.js · skill：生活技能没读出来，按零算', e && e.message); }
        return 0;
    }
    function tierOf(realm) {
        try { if (typeof window.getRealmTier === 'function') return Number(window.getRealmTier(realm)) || 0; } catch (e) { console.warn('[静默失败] js/npcs/npc-crime.js · tierOf：境界尺没量出来，按零档算', e && e.message); }
        return 0;
    }
    function playerTier() { var c = cd(); return c ? tierOf(c.realm) : 0; }
    function mul() {
        try { if (typeof window.bountyRealmMul === 'function') return Number(window.bountyRealmMul()) || 1; } catch (e) { console.warn('[静默失败] js/npcs/npc-crime.js · mul：境界尺没量出来，赃款按一倍算', e && e.message); }
        return 1;
    }
    function closeNpcDialog() {
        try { var m = document.querySelector('.npc-dialog-modal'); if (m) m.remove(); } catch (e) { console.warn('[静默失败] js/npcs/npc-crime.js · closeNpcDialog：对话窗没收掉', e && e.message); }
    }
    function seedOf(s) { var h = 0; s = String(s || ''); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }

    // ============ ③ 民愤热度与通缉账（StateRegistry 正门） ============
    function wanted() { return _st.heat >= TUNE.WANTED_AT; }
    function heat() { return _st.heat; }
    function bounty() { return _st.bounty; }

    function addHeat(n, why) {
        n = Math.max(0, Math.floor(Number(n) || 0));
        if (n <= 0) return;
        var wasWanted = wanted();
        _st.heat = clamp(_st.heat + n, 0, TUNE.HEAT_MAX);
        if (_st.heat >= TUNE.WANTED_AT) {
            if (!wasWanted) {
                _st.bounty = TUNE.BOUNTY_BASE + (_st.heat - TUNE.WANTED_AT) * TUNE.BOUNTY_PER_HEAT;
                log('🪧 民愤沸腾——官府把你的名字挂上了悬赏牌，赏金 ' + _st.bounty + ' 灵石。道上的人开始留意你的脸。', 'danger');
            } else {
                _st.bounty += TUNE.BOUNTY_PER_CRIME + Math.floor(n * 2);
            }
        }
        _st.log.push({ day: absDay(), why: String(why || '罪行'), n: n });
        if (_st.log.length > 20) _st.log = _st.log.slice(-20);
    }

    function coolDaily() {
        var day = absDay();
        if (_st.lastCoolDay === day) return;
        _st.lastCoolDay = day;
        if (_st.heat <= 0 && _st.bounty <= 0) return;
        var wasWanted = wanted();
        _st.heat = Math.max(0, _st.heat - TUNE.HEAT_DECAY);
        if (wasWanted && !wanted()) {
            _st.bounty = 0;
            log('🪧 风头冷了下来——悬赏牌上的画像揭了。蛰伏这些日子，官府算你销了案。（热度降到 ' + _st.heat + '）', 'success');
        }
    }

    // 赏金猎人进城堵你（每日新日一掷；通缉中、人在城里、不在自家洞府才算数）
    function maybeHunter(rng) {
        try {
            if (!wanted() || _st.bounty <= 0) return false;
            if (window.currentBattle) return false;
            var c = cd();
            if (!c) return false;
            var ct = city();
            if (!ct) return false;
            try { if (typeof window.isAtHome === 'function' && window.isAtHome()) return false; } catch (eH) { console.warn('[静默失败] js/npcs/npc-crime.js · maybeHunter：在不在家没问清，按在外头算', eH && eH.message); }
            var r = (typeof rng === 'function') ? rng() : Math.random();
            var p = Math.min(TUNE.HUNTER_P_CAP, TUNE.HUNTER_P_BASE + _st.heat / TUNE.HUNTER_P_DIV);
            if (r >= p) return false;
            var tier = playerTier() || 3;
            var hname = '赏金猎人·' + HUNTER_SURNAMES[seedOf(ct + '_' + absDay()) % HUNTER_SURNAMES.length];
            var enemyData = {
                name: hname, type: 'elite', physiologyType: 'humanoid',
                level: tier * 3 + 2 + Math.floor(_st.bounty / 60),
                attack: 32 + tier * 6 + Math.floor(_st.bounty / 20),
                defense: 15 + tier * 3, speed: 22,
                maxDurability: 100 + tier * 15, durabilities: { chest: 100 + tier * 15 }, combatAbilities: []
            };
            var started = startFlaggedBattle(enemyData, { _isBountyHunt: true, _bountyAmt: _st.bounty, _hunterName: hname },
                '🪧 「' + hname + '」认得悬赏牌上你的脸——当街拦了上来！（赏金 ' + _st.bounty + ' 灵石压在他身上）');
            return started;
        } catch (e) { console.warn('[静默失败] js/npcs/npc-crime.js · maybeHunter：猎人没能进城，这一天街上太平', e && e.message); return false; }
    }

    function settleBountyHunt(won) {
        try {
            var b = window.currentBattle;
            var amt = b && Number(b._bountyAmt) || _st.bounty;
            var hname = (b && b._hunterName) || '赏金猎人';
            if (won) {
                var loot = Math.round(amt * TUNE.HUNTER_WIN_FRAC) + TUNE.HUNTER_WIN_PLUS;
                addStones(loot);
                _st.bounty = Math.max(0, _st.bounty - TUNE.HUNTER_WIN_BOUNTY_OFF);
                _st.heat = clamp(_st.heat + TUNE.HUNTER_WIN_HEAT, 0, TUNE.HEAT_MAX);
                deed('bad', '赏金猎人「' + hname + '」堵你，反被你打翻——你搜走了他半份赏钱，道上都在传这一仗');
                log('🪧 你打翻了「' + hname + '」，搜出赏钱 ' + loot + ' 灵石和那张通缉画影。画影撕了，悬赏削去一截（余 ' + _st.bounty + '）——但官府只会再派人来。', 'warning');
                say('🪧 「' + hname + '」抱头鼠窜——你搜出他怀里半份赏钱 ' + loot + ' 灵石和那张画影。（悬赏余 ' + _st.bounty + '，热度反涨：官府不会善罢甘休）', 'success');
            } else {
                var paid = Math.min(stonesNow(), amt);
                if (paid > 0) deductStones(paid);
                var short = amt - paid;
                if (short > 0) {
                    var c = cd();
                    if (c) {
                        c.notoriety = Math.min(100, (Number(c.notoriety) || 0) + TUNE.HUNTER_LOSE_SHORT_NOTO);
                        c.qi = Math.max(0, (Number(c.qi) || 0) - TUNE.HUNTER_LOSE_SHORT_QI);
                    }
                }
                _st.heat = Math.max(0, _st.heat - TUNE.HUNTER_LOSE_HEAT_OFF);
                _st.bounty = 0;
                deed('bad', '你让赏金猎人「' + hname + '」当街拿下，扭送官府缴清了悬赏——画影上你的脸人人都看过了');
                log('🪧 「' + hname + '」把你按在地上捆了。赏金 ' + amt + ' 灵石' + (paid > 0 ? '从你身上划走 ' + paid : '你身无分文') + (short > 0 ? '，划不够的部分挨了顿好打、真气被震散一截（恶名+' + TUNE.HUNTER_LOSE_SHORT_NOTO + '）' : '') + '。案子就此销了，你的脸也全城都认得了。', 'danger');
                say('🪧 被「' + hname + '」当街拿下——赏金缴清、案子销了，代价是满城都认得了你的脸。', 'error');
            }
            refresh();
        } catch (e) { console.warn('[静默失败] js/npcs/npc-crime.js · settleBountyHunt：猎人的账没落下，赏金悬着', e && e.message); }
    }
    window.settleBountyHunt = settleBountyHunt;

    // 司法堂缴清悬赏（facility-offices 情境选项守卫接线）
    function payBounty() {
        if (_st.bounty <= 0) return { error: wanted() ? '悬赏牌上有你的脸，但赏金账目待核——先让风头再吹吹。' : '悬赏牌上没有你的脸，无从缴起。' };
        var amt = _st.bounty;
        if (!deductStones(amt)) return { error: '缴清悬赏需 ' + amt + ' 灵石，你手头不足——官府的账不赊。' };
        _st.heat = Math.max(0, _st.heat - (TUNE.WANTED_AT + 10));
        _st.bounty = 0;
        log('🪧 你在司法堂柜上缴清赏金 ' + amt + ' 灵石，书吏当堂销案、揭了画影。「往后安分些。」', 'success');
        say('🪧 赏金缴清，案子当堂销了——悬赏牌上不再有你的脸。（热度大降，恶名可不会跟着销）', 'success');
        refresh();
        return { ok: true, paid: amt };
    }

    // 夜巡盘查加档（daily-events 守卫接线）：通缉之身，兵丁的眼神完全不同
    function patrolBoost(noto) {
        try { return wanted() ? (Number(noto) || 0) + TUNE.PATROL_BOOST : (Number(noto) || 0); } catch (e) { return Number(noto) || 0; }
    }
    function wantedLine() {
        if (wanted() && _st.bounty > 0) return '\n\n堂外悬赏牌上贴着你的画像——赏金 ' + _st.bounty + ' 灵石。柜上可缴清销案。';
        if (_st.heat > 0) return '\n\n（案卷角落里夹着你的名字——民愤热度 ' + _st.heat + '，还没到画影通缉的线。）';
        return '';
    }

    // ============ 共用：带旗开战（抢劫/猎人/市民/丐帮讨说法四路同款） ============
    function startFlaggedBattle(enemyData, flags, announce) {
        try {
            if (window.currentBattle) { say('眼下正打着架——先把手头这场了结。', 'warning'); return false; }
            if (typeof window.startBattle !== 'function') { say('战斗系统未就绪。', 'warning'); return false; }
            closeNpcDialog();
            try { if (typeof window.closeBuildingDialog === 'function') window.closeBuildingDialog(); } catch (eB) { console.warn('[静默失败] js/npcs/npc-crime.js · startFlaggedBattle：楼窗没收掉', eB && eB.message); }
            var b = window.startBattle(enemyData);
            if (b && flags) { for (var k in flags) { if (Object.prototype.hasOwnProperty.call(flags, k)) b[k] = flags[k]; } }
            if (announce) say(announce, 'error');
            return !!b;
        } catch (e) { console.warn('[静默失败] js/npcs/npc-crime.js · startFlaggedBattle：这一仗没拉起来', e && e.message); return false; }
    }

    // ============ 共用：从 NPC 行囊真拿货（拿不走的留在原处，不蒸发） ============
    function takeItems(npc, max) {
        var got = [];
        try {
            var items = (npc && npc.inventory && Array.isArray(npc.inventory.items)) ? npc.inventory.items : [];
            for (var i = items.length - 1; i >= 0 && got.length < max; i--) {
                var it = items[i];
                if (!it || !it.templateId || !(Number(it.count) > 0)) continue;
                var name = (window.itemById && window.itemById[it.templateId] && window.itemById[it.templateId].name) || it.name || it.templateId;
                var okGot = false;
                if (typeof window.giveWithReceipt === 'function') {
                    var 收 = window.giveWithReceipt(it.templateId, 1, { quiet: true });
                    okGot = !!(收 && Number(收.got) > 0);
                    if (收 && 收.name) name = 收.name;
                } else if (typeof window.addItem === 'function') {
                    okGot = Number(window.addItem(it.templateId, 1)) > 0;
                } else break;
                if (!okGot) continue;   // 行囊接不住——东西留在他身上，不蒸发
                it.count = (Number(it.count) || 1) - 1;
                if (it.count <= 0) items.splice(i, 1);
                got.push(name);
            }
        } catch (e) { console.warn('[静默失败] js/npcs/npc-crime.js · takeItems：行囊没搜成——这一票空手', e && e.message); }
        return got;
    }

    function npcById(id) {
        try { return (window.npcManager && typeof window.npcManager.getNPC === 'function') ? window.npcManager.getNPC(id) : null; } catch (e) { return null; }
    }

    // ============ ① 威胁 ============
    function threatRate(npc) {
        var eloq = skill('口才');
        var tierDiff = playerTier() - tierOf(npc.combat && npc.combat.realm);
        var fear = Number(npc.relationship && npc.relationship.fear) || 0;
        return clamp(TUNE.THREAT_BASE + Math.min(eloq * TUNE.THREAT_SKILL, TUNE.THREAT_SKILL_CAP) + tierDiff * TUNE.THREAT_TIER + fear * TUNE.THREAT_FEAR,
            TUNE.THREAT_RATE_MIN, TUNE.THREAT_RATE_MAX);
    }

    // 黑面孝敬：威胁得手后按职业另给一份（交东西类每人终身一次，落档 perks 防印钞）
    var DARK_PERKS = {
        '商人': { id: 'merchant', msg: '商人堆起惧色的笑，把柜上的货价悄悄改了一笔：「自家人，四成……不，就按惧价走。」' },
        '铁匠': { id: 'forge', item: 'iron_sword', count: 1, fallbackCopper: 60, msg: '铁匠一言不发，从兵器架上取下最好的一柄递过来，别过了头去。' },
        '炼丹师': { id: 'alchemy', item: 'pill_small_recovery', count: 2, fallbackCopper: 40, msg: '炼丹师手抖着从新出炉的丹药里拣了两颗，塞进你手心，什么也没说。' },
        '治疗师': { id: 'heal', msg: '医者认命地叹了口气，取针施药——这一回分文不取。' },
        '隐士': { id: 'hermit', msg: '隐士盯着你看了半晌，终究从袖中摸出一页手抄的残篇，指了指上面一行小字。' },
        '村民': { id: 'villager', msg: '村民哆嗦着从床底摸出个布包，一层层打开，数出几枚攒下的铜板。' }
    };

    function perkUsed(npcId, pid) { return !!_st.perks[npcId + ':' + pid]; }
    function markPerk(npcId, pid) { _st.perks[npcId + ':' + pid] = 1; }

    function grantDarkPerk(npc) {
        var perk = DARK_PERKS[npc.occupation];
        try {
            if (perk && perk.item) {
                if (perkUsed(npc.id, perk.id)) {
                    var spare = TUNE.PERK_GENERIC_COPPER_MIN + Math.floor(Math.random() * TUNE.PERK_GENERIC_COPPER_RANGE);
                    settle({ copper: spare }, '黑面孝敬');
                    return '（' + npc.name + ' 家里实在没有第二件像样的了，只翻出 ' + spare + ' 枚铜板。）';
                }
                var 收 = (typeof window.giveWithReceipt === 'function')
                    ? window.giveWithReceipt(perk.item, perk.count, { quiet: true })
                    : { got: (typeof window.addItem === 'function' ? (Number(window.addItem(perk.item, perk.count)) || 0) : 0), name: (window.itemById && window.itemById[perk.item] && window.itemById[perk.item].name) || perk.item };
                if (收 && Number(收.got) > 0) {
                    markPerk(npc.id, perk.id);
                    return '（' + perk.msg + '「' + 收.name + '」×' + (perk.count || 1) + ' 到了你手里——这份孝敬，他这辈子只出得起一次。）';
                }
                var fb = settle({ copper: perk.fallbackCopper }, '黑面孝敬');
                if (!fb.ok) return '';
                // DES-86/90 同口径：接不住的原因吃回执实话（addItemFailPhraseFor 从句支），
                // 问不到回执就选「没能跟你走」那支——不许站点自己赖行囊满
                var 由头 = '这一件没能跟你走';
                try {
                    if (typeof window.addItemFailPhraseFor === 'function') {
                        var phr = window.addItemFailPhraseFor(收 && 收.reason, 收 && 收.name);
                        if (phr) 由头 = (收 && 收.name ? 收.name : '这一件') + '没能跟你走：' + phr;
                    }
                } catch (ePh) { console.warn('[静默失败] js/npcs/npc-crime.js · grantDarkPerk：接不住的回执没读出来，按「没能跟你走」说', ePh && ePh.message); }
                return '（' + perk.msg + 由头 + '——他改塞了 ' + perk.fallbackCopper + ' 枚铜板。）';
            }
            if (perk && perk.id === 'merchant') {
                if (typeof window.openWanderMerchant === 'function') {
                    closeNpcDialog();
                    window.openWanderMerchant(0.6);
                    return '（' + perk.msg + '）';
                }
                var mc = settle({ copper: TUNE.PERK_GENERIC_COPPER_MIN + Math.floor(Math.random() * TUNE.PERK_GENERIC_COPPER_RANGE) }, '黑面孝敬');
                return mc.ok ? '（商人哆嗦着塞给你一把铜板。）' : '';
            }
            if (perk && perk.id === 'heal') {
                var c = cd();
                if (c) {
                    var mh = c.maxHealth || 100, mq = c.maxQi || 50;
                    c.health = Math.min(mh, Math.round((Number(c.health) || 0) + (mh - (Number(c.health) || 0)) * TUNE.PERK_HEAL_FRAC));
                    c.qi = Math.min(mq, Math.round((Number(c.qi) || 0) + (mq - (Number(c.qi) || 0)) * TUNE.PERK_HEAL_FRAC));
                }
                return '（' + perk.msg + '伤势恢复了' + Math.round(TUNE.PERK_HEAL_FRAC * 100) + '%。）';
            }
            if (perk && perk.id === 'hermit') {
                var art = null;
                try {
                    var pages = window.skillPages || [];
                    var KS = window.KnowledgeSystem;
                    if (pages.length && KS && typeof KS.unlock === 'function') {
                        art = pages[Math.floor(Math.random() * pages.length)];
                        if (art && art.id) {
                            KS.unlock(art.id, 'heard', { source: 'coerced_hermit', completeness: 0 });
                            try { if (typeof window.growLifeSkill === 'function') window.growLifeSkill('学识', 2); } catch (eG) { console.warn('[静默失败] js/npcs/npc-crime.js · grantDarkPerk：隐士指点后学识没落账', eG && eG.message); }
                        } else art = null;
                    }
                } catch (eK) { console.warn('[静默失败] js/npcs/npc-crime.js · grantDarkPerk：残页没抖出来，改给几句心得', eK && eK.message); art = null; }
                if (art) return '（隐士指给你一页手抄残篇——「' + (art.name || art.id) + '」的门径有了个模糊的影子。（学识+2））';
                var hs = settle({ exp: 8 }, '黑面孝敬');
                return hs.ok ? '（隐士不肯指点残页，只淡淡说了几句修行心得。（历练+8））' : '';
            }
            if (perk && perk.id === 'villager') {
                var vr = settle({ copper: TUNE.PERK_VILLAGER_COPPER, karma: TUNE.PERK_VILLAGER_KARMA }, '黑面孝敬');
                return vr.ok ? '（' + perk.msg + '铜板+' + TUNE.PERK_VILLAGER_COPPER + '——欺负老实人，业障翻倍。）' : '';
            }
            // 没有职业标签的：挤出几枚铜板
            var gc = settle({ copper: TUNE.PERK_GENERIC_COPPER_MIN + Math.floor(Math.random() * TUNE.PERK_GENERIC_COPPER_RANGE) }, '黑面孝敬');
            return gc.ok ? '（TA翻遍身上，又挤出几枚铜板。）' : '';
        } catch (e) { console.warn('[静默失败] js/npcs/npc-crime.js · grantDarkPerk：这份孝敬没递成', e && e.message); return ''; }
    }

    function threaten(npcId) {
        var npc = npcById(npcId);
        if (!npc || npc.isDead) { say('那人早不在这儿了。', 'info'); return false; }
        var c = cd();
        if (!c) { say('请先创建角色。', 'warning'); return false; }
        if (window.currentBattle) { say('打着架呢——威胁的话留到打完再说。', 'warning'); return false; }
        if (typeof window.npcNotCoLocated === 'function' && window.npcNotCoLocated(npc)) { say('你与' + npc.name + '并不在一处——隔着半座城喊打喊杀，没人理你。', 'warning'); return false; }
        var aff = Number(npc.relationship && npc.relationship.affection) || 0;
        var isDao = false;
        try { isDao = !!(typeof npc.hasFlag === 'function' && npc.hasFlag('dao_companion')); } catch (eF) { console.warn('[静默失败] js/npcs/npc-crime.js · threaten：道侣旗没读出来，按不是道侣算', eF && eF.message); }
        if (isDao || aff >= 80) {
            say('你盯着 ' + npc.name + ' 看了半晌，喉头动了动——终究没能把威胁的话说出口。对这等亲近的人，你开不了口。', 'warning');
            return false;
        }
        var day = absDay();
        if (_threatLog[npcId] === day) { say('今天已经吓过 ' + npc.name + ' 一回了——再逼就要出人命了，明日再来。', 'info'); return false; }
        _threatLog[npcId] = day;

        // 导师/长老不吃这套
        if (npc.occupation === '导师' || npc.occupation === '长老') {
            try { if (typeof npc.recordPlayerAction === 'function') npc.recordPlayerAction('threaten', 'negative'); } catch (eR) { console.warn('[静默失败] js/npcs/npc-crime.js · threaten：这一笔没记进TA的记忆', eR && eR.message); }
            npc.changeAffection(TUNE.MENTOR_AFF_HIT);
            addHeat(TUNE.THREAT_HEAT, '威胁长辈未遂');
            if (npc.occupation === '长老' && c) {
                c.qi = Math.max(0, (Number(c.qi) || 0) - TUNE.ELDER_PUNISH_QI);
                say('🗡️ ' + npc.name + ' 眼皮都没抬：「小辈，放肆。」袖袍一拂，你胸口如遭锤击，踉跄退出数步——真气被震散一截（-' + TUNE.ELDER_PUNISH_QI + '）。长老这一辈的人，不吃威胁这套。（好感' + TUNE.MENTOR_AFF_HIT + '）', 'error');
            } else {
                say('🗡️ ' + npc.name + ' 放下手里的书卷，静静看着你：「威胁我？你可知我见过多少比你凶的人。」——一番话把你的气势浇了个透心凉。（好感' + TUNE.MENTOR_AFF_HIT + '）', 'warning');
            }
            refresh();
            return false;
        }
        // 战士/对手：话没说完，刀已出鞘——直接转抢劫战斗
        if (npc.occupation === '战士' || npc.occupation === '竞争对手') {
            say('🗡️ 你刚把话头递出去，' + npc.name + ' 的手已经按上了兵刃：「想从我这儿抢东西？来。」', 'error');
            startRobBattle(npc);
            return false;
        }

        advance(10, '威胁');
        var rate = threatRate(npc);
        if (Math.random() < rate) {
            try { if (typeof npc.changeFear === 'function') npc.changeFear(TUNE.THREAT_FEAR_GAIN); } catch (eFr) { console.warn('[静默失败] js/npcs/npc-crime.js · threaten：威压没落账', eFr && eFr.message); }
            npc.changeAffection(TUNE.THREAT_AFF_HIT);
            try { if (typeof npc.changeRespect === 'function') npc.changeRespect(TUNE.THREAT_RESPECT_HIT); } catch (eRs) { console.warn('[静默失败] js/npcs/npc-crime.js · threaten：敬重没落账', eRs && eRs.message); }
            var loot = Math.max(1, Math.round((TUNE.THREAT_LOOT_MIN + Math.floor(Math.random() * TUNE.THREAT_LOOT_RANGE)) * mul()));
            addStones(loot);
            c.karma = clamp((Number(c.karma) || 0) + TUNE.THREAT_KARMA, -100, 100);
            c.notoriety = Math.min(100, (Number(c.notoriety) || 0) + TUNE.THREAT_NOTO);
            addHeat(TUNE.THREAT_HEAT, '勒索' + npc.name);
            try { if (typeof npc.recordPlayerAction === 'function') npc.recordPlayerAction('threatened', 'negative'); } catch (eR2) { console.warn('[静默失败] js/npcs/npc-crime.js · threaten：这一笔没记进TA的记忆', eR2 && eR2.message); }
            var perkMsg = grantDarkPerk(npc);
            log('🗡️ 你把话挑明，' + npc.name + ' 的脸色白了白——终究是怕了你。挤出灵石 ' + loot + ' 枚' + perkMsg + '（威压+' + TUNE.THREAT_FEAR_GAIN + '，好感' + TUNE.THREAT_AFF_HIT + '，敬重' + TUNE.THREAT_RESPECT_HIT + '，业障' + TUNE.THREAT_KARMA + '，恶名+' + TUNE.THREAT_NOTO + '）', 'warning');
            say('🗡️ ' + npc.name + ' 盯着你腰间的兵刃，声音低了八度：「……好汉，别动手。」灵石+' + loot + perkMsg + '（TA怕了你：威压+' + TUNE.THREAT_FEAR_GAIN + '；业障' + TUNE.THREAT_KARMA + ' 恶名+' + TUNE.THREAT_NOTO + '）', 'success');
            refresh();
            return true;
        }
        // 砸了：记恨，四成几率转头报官
        try { if (typeof npc.changeHatred === 'function') npc.changeHatred(TUNE.THREAT_FAIL_HATRED); } catch (eH2) { console.warn('[静默失败] js/npcs/npc-crime.js · threaten：仇恨没落账', eH2 && eH2.message); }
        npc.changeAffection(TUNE.THREAT_FAIL_AFF);
        try { if (typeof npc.recordPlayerAction === 'function') npc.recordPlayerAction('threaten_failed', 'negative'); } catch (eR3) { console.warn('[静默失败] js/npcs/npc-crime.js · threaten：这一笔没记进TA的记忆', eR3 && eR3.message); }
        if (Math.random() < TUNE.THREAT_SNITCH_P) {
            c.notoriety = Math.min(100, (Number(c.notoriety) || 0) + TUNE.THREAT_SNITCH_NOTO);
            addHeat(TUNE.THREAT_SNITCH_HEAT, '威胁未遂被报官');
            repDown(TUNE.THREAT_SNITCH_REP);
            say('🗡️ ' + npc.name + ' 忽然放声大笑：「就凭你？」——转头就往巡街兵丁那边去。你灰溜溜地钻进人流。（仇恨+' + TUNE.THREAT_FAIL_HATRED + '，恶名+' + TUNE.THREAT_SNITCH_NOTO + '，本城声望-' + TUNE.THREAT_SNITCH_REP + '）', 'error');
        } else {
            say('🗡️ ' + npc.name + ' 啐了你一口：「也不撒泡尿照照！」——威胁没吓住人，反倒结下了一层怨。（仇恨+' + TUNE.THREAT_FAIL_HATRED + '，好感' + TUNE.THREAT_FAIL_AFF + '）', 'warning');
        }
        refresh();
        return false;
    }

    // ============ ② 抢劫 ============
    function willResist(npc) {
        if (npc.occupation === '战士' || npc.occupation === '竞争对手') return true;
        if (tierOf(npc.combat && npc.combat.realm) >= playerTier() && playerTier() > 0) return true;
        return (Number(npc.combat && npc.combat.level) || 0) >= TUNE.ROB_FIGHT_LEVEL_AT;
    }

    function rob(npcId) {
        var npc = npcById(npcId);
        if (!npc || npc.isDead) { say('那人早不在这儿了。', 'info'); return false; }
        var c = cd();
        if (!c) { say('请先创建角色。', 'warning'); return false; }
        if (window.currentBattle) { say('打着架呢。', 'warning'); return false; }
        if (typeof window.npcNotCoLocated === 'function' && window.npcNotCoLocated(npc)) { say('你与' + npc.name + '并不在一处——抢劫得当面抢。', 'warning'); return false; }
        var aff = Number(npc.relationship && npc.relationship.affection) || 0;
        var isDao = false;
        try { isDao = !!(typeof npc.hasFlag === 'function' && npc.hasFlag('dao_companion')); } catch (eF2) { console.warn('[静默失败] js/npcs/npc-crime.js · rob：道侣旗没读出来，按不是道侣算', eF2 && eF2.message); }
        if (isDao || aff >= 80) { say('你望着 ' + npc.name + '，半晌，把手从刀柄上拿了下来——对这等亲近的人，你下不去手。', 'warning'); return false; }
        var day = absDay();
        if (_robLog[npcId] === day) { say('今天已经对 ' + npc.name + ' 出过一次手了——同一个人身上，一日只能做一票。', 'info'); return false; }

        var detail = willResist(npc)
            ? '💰 ' + npc.name + ' 不是好惹的——话一出口多半要拔刀相向（真战斗：赢了搜TA的行囊，输了反被搜身）。'
            : '💰 逼 ' + npc.name + ' 交出全部家当。';
        detail += '抢劫是大罪：业障、恶名、民愤热度三本账一起记，风声会传进江湖。真动手吗？';
        if (typeof window.showConfirm === 'function') {
            window.showConfirm('💰 抢劫', detail).then(function (ok) { if (ok) doRob(npcId); });
            return true;
        }
        return doRob(npcId);
    }

    function doRob(npcId) {
        var npc = npcById(npcId);
        if (!npc || npc.isDead) return false;
        _robLog[npcId] = absDay();
        if (willResist(npc)) {
            say('💰 你拦住 ' + npc.name + ' 的去路，把手按上兵刃——TA冷笑一声，拔了。', 'error');
            startRobBattle(npc);
            return true;
        }
        advance(10, '抢劫');
        var tierDiff = playerTier() - tierOf(npc.combat && npc.combat.realm);
        var rate = clamp(TUNE.ROB_BASE + tierDiff * TUNE.ROB_TIER + skill('口才') * TUNE.ROB_SKILL, TUNE.ROB_RATE_MIN, TUNE.ROB_RATE_MAX);
        var c = cd() || {};
        if (Math.random() < rate) {
            var loot = Math.max(1, Math.round((TUNE.ROB_LOOT_MIN + Math.floor(Math.random() * TUNE.ROB_LOOT_RANGE)) * mul()));
            addStones(loot);
            var got = takeItems(npc, 1);
            try { if (typeof npc.changeFear === 'function') npc.changeFear(TUNE.ROB_FEAR); } catch (eFr2) { console.warn('[静默失败] js/npcs/npc-crime.js · doRob：威压没落账', eFr2 && eFr2.message); }
            try { if (typeof npc.changeHatred === 'function') npc.changeHatred(TUNE.ROB_HATRED); } catch (eH3) { console.warn('[静默失败] js/npcs/npc-crime.js · doRob：仇恨没落账', eH3 && eH3.message); }
            npc.changeAffection(TUNE.ROB_AFF);
            c.karma = clamp((Number(c.karma) || 0) + TUNE.ROB_KARMA, -100, 100);
            c.notoriety = Math.min(100, (Number(c.notoriety) || 0) + TUNE.ROB_NOTO);
            addHeat(TUNE.ROB_HEAT, '抢劫' + npc.name);
            try { if (typeof npc.recordPlayerAction === 'function') npc.recordPlayerAction('robbed', 'negative'); } catch (eR4) { console.warn('[静默失败] js/npcs/npc-crime.js · doRob：这一笔没记进TA的记忆', eR4 && eR4.message); }
            deed('bad', '你抢劫了' + npc.name + '——TA打不过你，家当让你搜了去，道上都在传这一票');
            log('💰 你截住 ' + npc.name + '，亮出兵刃。TA脸色煞白，把身上的灵石（+' + loot + '）' + (got.length ? '和「' + got.join('、') + '」' : '') + '都交了出来。（威压+' + TUNE.ROB_FEAR + ' 仇恨+' + TUNE.ROB_HATRED + ' 好感' + TUNE.ROB_AFF + ' 业障' + TUNE.ROB_KARMA + ' 恶名+' + TUNE.ROB_NOTO + '）', 'danger');
            say('💰 ' + npc.name + ' 哆嗦着交出全部家当：灵石+' + loot + (got.length ? '，「' + got.join('、') + '」也归了你' : '') + '。（TA怕极也恨极了你：威压+' + TUNE.ROB_FEAR + ' 仇恨+' + TUNE.ROB_HATRED + '；业障' + TUNE.ROB_KARMA + ' 恶名+' + TUNE.ROB_NOTO + '，风声已经传出去了）', 'success');
            refresh();
            return true;
        }
        // 失手：一半全身而退，一半对方呼救引来了巡兵
        try { if (typeof npc.changeHatred === 'function') npc.changeHatred(10); } catch (eH4) { console.warn('[静默失败] js/npcs/npc-crime.js · doRob：仇恨没落账', eH4 && eH4.message); }
        npc.changeAffection(-10);
        try { if (typeof npc.recordPlayerAction === 'function') npc.recordPlayerAction('rob_failed', 'negative'); } catch (eR5) { console.warn('[静默失败] js/npcs/npc-crime.js · doRob：这一笔没记进TA的记忆', eR5 && eR5.message); }
        if (Math.random() < TUNE.ROB_FAIL_SNITCH_P) {
            c.notoriety = Math.min(100, (Number(c.notoriety) || 0) + TUNE.ROB_SNITCH_NOTO);
            addHeat(TUNE.ROB_SNITCH_NOTO, '抢劫未遂被拿');
            repDown(TUNE.ROB_SNITCH_REP);
            var paid = deductStones(TUNE.ROB_SNITCH_FINE);
            if (!paid) c.notoriety = Math.min(100, (Number(c.notoriety) || 0) + TUNE.ROB_SNITCH_FINE_SHORT);
            say('🚨 ' + npc.name + ' 扯着嗓子呼救，两条街的闲汉都围了过来——巡兵把你按在墙上。（恶名+' + TUNE.ROB_SNITCH_NOTO + '，声望-' + TUNE.ROB_SNITCH_REP + '，' + (paid ? '罚金 ' + TUNE.ROB_SNITCH_FINE + ' 灵石' : '拿不出罚金，罪加一等（恶名再+' + TUNE.ROB_SNITCH_FINE_SHORT + '）') + '）', 'error');
        } else {
            addHeat(1, '抢劫未遂');
            say('💨 ' + npc.name + ' 死攥着钱袋不撒手、扯着嗓子喊人——你没得手，趁乱钻进了巷子。（仇恨+10，好感-10）', 'warning');
        }
        refresh();
        return false;
    }

    function startRobBattle(npc) {
        var data = Object.assign({}, npc.combat || {}, { name: '【抢劫】' + npc.name });
        var started = false;
        try {
            if (typeof window.openBattleWithEntity === 'function') {
                closeNpcDialog();
                window.openBattleWithEntity({ type: 'enemy', npcId: npc.id, name: data.name, data: data });
                if (window.currentBattle) {
                    window.currentBattle._isNpcRobbery = true;
                    window.currentBattle._robNpcId = npc.id;
                    started = true;
                }
            }
        } catch (eO) { console.warn('[静默失败] js/npcs/npc-crime.js · startRobBattle：实体战没拉起来，改走通用开战', eO && eO.message); started = false; }
        if (!started) {
            var tier = Math.max(1, tierOf(npc.combat && npc.combat.realm) || 1);
            started = startFlaggedBattle({
                name: data.name, type: 'elite', physiologyType: 'humanoid',
                level: (npc.combat && npc.combat.level) || tier * 3,
                attack: (npc.combat && npc.combat.attack) || 28 + tier * 5,
                defense: (npc.combat && npc.combat.defense) || 14 + tier * 3,
                speed: (npc.combat && npc.combat.speed) || 20,
                maxDurability: 90 + tier * 15, durabilities: { chest: 90 + tier * 15 }, combatAbilities: []
            }, { _isNpcRobbery: true, _robNpcId: npc.id }, '⚔️ ' + npc.name + ' 拔刀相向——这一票要见真章了！');
        }
        return started;
    }

    function settleNpcRobbery(won) {
        try {
            var b = window.currentBattle;
            var npcId = b && b._robNpcId;
            var npc = npcId ? npcById(npcId) : null;
            var name = npc ? npc.name : '对方';
            var c = cd() || {};
            if (won) {
                var loot = Math.max(1, Math.round((TUNE.BATTLE_LOOT_MIN + Math.floor(Math.random() * TUNE.BATTLE_LOOT_RANGE)) * mul()));
                addStones(loot);
                var got = npc ? takeItems(npc, TUNE.BATTLE_ITEMS_MAX) : [];
                if (npc) {
                    try { if (typeof npc.changeFear === 'function') npc.changeFear(TUNE.BATTLE_WIN_FEAR); } catch (eF3) { console.warn('[静默失败] js/npcs/npc-crime.js · settleNpcRobbery：威压没落账', eF3 && eF3.message); }
                    try { if (typeof npc.changeHatred === 'function') npc.changeHatred(TUNE.BATTLE_WIN_HATRED); } catch (eH5) { console.warn('[静默失败] js/npcs/npc-crime.js · settleNpcRobbery：仇恨没落账', eH5 && eH5.message); }
                    try { npc.changeAffection(TUNE.BATTLE_WIN_AFF); } catch (eA) { console.warn('[静默失败] js/npcs/npc-crime.js · settleNpcRobbery：好感没落账', eA && eA.message); }
                    try { if (typeof npc.recordPlayerAction === 'function') npc.recordPlayerAction('robbed', 'negative'); } catch (eR6) { console.warn('[静默失败] js/npcs/npc-crime.js · settleNpcRobbery：这一笔没记进TA的记忆', eR6 && eR6.message); }
                }
                c.karma = clamp((Number(c.karma) || 0) + TUNE.BATTLE_WIN_KARMA, -100, 100);
                c.notoriety = Math.min(100, (Number(c.notoriety) || 0) + TUNE.BATTLE_WIN_NOTO);
                addHeat(TUNE.BATTLE_WIN_HEAT, '持械抢劫' + name);
                deed('bad', '你持械抢劫了' + name + '，把TA打翻在地搜走了家当——这一票江湖上人人都知道了');
                log('💰 你把 ' + name + ' 打翻在地，搜走灵石 ' + loot + (got.length ? ' 和「' + got.join('、') + '」' : '') + '。（威压+' + TUNE.BATTLE_WIN_FEAR + ' 仇恨+' + TUNE.BATTLE_WIN_HATRED + ' 好感' + TUNE.BATTLE_WIN_AFF + ' 业障' + TUNE.BATTLE_WIN_KARMA + ' 恶名+' + TUNE.BATTLE_WIN_NOTO + '）', 'danger');
                say('💰 ' + name + ' 倒地不起——你搜走灵石 ' + loot + (got.length ? '，「' + got.join('、') + '」也进了你的行囊' : '') + '。（业障' + TUNE.BATTLE_WIN_KARMA + ' 恶名+' + TUNE.BATTLE_WIN_NOTO + '，风声传遍了街面）', 'success');
            } else {
                var held = stonesNow();
                var plunder = Math.floor(held * TUNE.BATTLE_LOSE_PLUNDER);
                if (plunder > 0) deductStones(plunder);
                if (npc) {
                    try { if (typeof npc.changeHatred === 'function') npc.changeHatred(TUNE.BATTLE_LOSE_HATRED); } catch (eH6) { console.warn('[静默失败] js/npcs/npc-crime.js · settleNpcRobbery：仇恨没落账', eH6 && eH6.message); }
                    try { npc.changeAffection(TUNE.BATTLE_LOSE_AFF); } catch (eA2) { console.warn('[静默失败] js/npcs/npc-crime.js · settleNpcRobbery：好感没落账', eA2 && eA2.message); }
                }
                c.notoriety = Math.min(100, (Number(c.notoriety) || 0) + TUNE.BATTLE_LOSE_NOTO);
                addHeat(TUNE.BATTLE_LOSE_HEAT, '抢劫失手被反搜');
                deed('bad', '你抢劫' + name + '不成，反被TA打翻搜了身——道上行的人都在笑这一票');
                log('💀 抢劫失手——' + name + ' 反把你按在地上搜了身' + (plunder > 0 ? '，搜走灵石 ' + plunder : '（你身上本就没几个钱）') + '。（恶名+' + TUNE.BATTLE_LOSE_NOTO + '，TA记死了你：仇恨+' + TUNE.BATTLE_LOSE_HATRED + '）', 'danger');
                say('💀 抢劫不成反被搜身——' + name + (plunder > 0 ? ' 搜走你 ' + plunder + ' 灵石' : ' 搜了半天没搜出几个钱，啐了你一脸') + '。（恶名+' + TUNE.BATTLE_LOSE_NOTO + '，仇恨+' + TUNE.BATTLE_LOSE_HATRED + '）', 'error');
            }
            refresh();
        } catch (e) { console.warn('[静默失败] js/npcs/npc-crime.js · settleNpcRobbery：这一票的账没落下，赃物悬着', e && e.message); }
    }
    window.settleNpcRobbery = settleNpcRobbery;

    // ============ ④ 钱庄柜娘 ============
    function tellerOf(ct) {
        var pk = pkCity(ct || city());
        if (!pk) return null;
        if (!_st.tellers[pk]) {
            var h = seedOf(pk + '_teller');
            _st.tellers[pk] = { name: TELLER_NAMES[h % TELLER_NAMES.length], age: 20 + (h % 18), times: 0, fear: 0, lastCoerceDay: -999 };
        }
        var t = _st.tellers[pk];
        t.times = Number(t.times) || 0;
        t.fear = Number(t.fear) || 0;
        t.lastCoerceDay = Number(t.lastCoerceDay);
        if (!Number.isFinite(t.lastCoerceDay)) t.lastCoerceDay = -999;
        return t;
    }

    function bankBanned() {
        var pk = pkCity(city());
        return !!(_st.bankBan[pk] && Number(_st.bankBan[pk]) > absDay());
    }
    function bankBanDays() {
        var pk = pkCity(city());
        var until = Number(_st.bankBan[pk]) || 0;
        return Math.max(0, until - absDay());
    }

    function tellerDescribe() {
        var t = tellerOf(city());
        if (!t) return '';
        var s = '\n\n柜台后立着 ' + t.age + ' 岁的柜娘「' + t.name + '」，正低头拨算盘。';
        if (bankBanned()) s += '——钱庄的门板对你上着（还有 ' + bankBanDays() + ' 日），伙计见你进来就把手按向了铜锣。';
        else if (t.fear > 0) s += '她抬眼认出了你，拨算盘的手一顿——上回的事，她记得。（她怕你）';
        else if (t.times > 0) s += '她认得你的脸，不动声色地往柜台里侧挪了半步。';
        return s;
    }

    function coerceTeller() {
        var c = cd();
        if (!c) { say('请先创建角色。', 'warning'); return false; }
        var ct = city();
        var t = tellerOf(ct);
        if (!t) { say('这地界没有钱庄柜台。', 'info'); return false; }
        if (window.currentBattle) { say('打着架呢。', 'warning'); return false; }
        if (bankBanned()) { say('🏦 钱庄的门板还上着（还有 ' + bankBanDays() + ' 日）——柜娘躲在伙计身后，不肯露头。', 'warning'); return false; }
        var day = absDay();
        if (t.lastCoerceDay + TUNE.TELLER_CD_DAYS > day) {
            say('🏦 「' + t.name + '」认得你——上回的事才过去几天，钱庄上下都防着你。（还要过 ' + (t.lastCoerceDay + TUNE.TELLER_CD_DAYS - day) + ' 日，她才敢松这口气）', 'info');
            return false;
        }
        t.lastCoerceDay = day;
        t.times += 1;
        advance(20, '钱庄柜台');

        var eloq = skill('口才');
        var rate = clamp(TUNE.TELLER_BASE + Math.min(eloq * TUNE.TELLER_SKILL, TUNE.TELLER_SKILL_CAP)
            + (t.fear > 0 ? TUNE.TELLER_FEAR_BONUS : 0) - (wanted() ? TUNE.TELLER_WANTED_PEN : 0),
            TUNE.TELLER_RATE_MIN, TUNE.TELLER_RATE_MAX);

        if (Math.random() < rate) {
            t.fear = 1;
            // 私漏库银：你有欠条她先烧欠条，没有就漏柜底的钱匣
            var debtInfo = null;
            try { if (window.BankService && typeof window.BankService.summary === 'function') debtInfo = window.BankService.summary(); } catch (eB2) { console.warn('[静默失败] js/npcs/npc-crime.js · coerceTeller：钱庄账没读出来，按没欠条算', eB2 && eB2.message); }
            var gainTxt = '';
            if (debtInfo && Number(debtInfo.debt) > 0 && window.BankService && typeof window.BankService.waiveDebt === 'function') {
                try {
                    var w = window.BankService.waiveDebt('柜娘私烧欠条');
                    if (w && w.success) gainTxt = '她颤着手从账匣里抽出你的欠条，就着烛火烧了——连本带息 ' + w.waived + ' 灵石的账，一笔勾销。';
                } catch (eW) { console.warn('[静默失败] js/npcs/npc-crime.js · coerceTeller：欠条没烧成，改漏钱匣', eW && eW.message); }
            }
            if (!gainTxt) {
                var loot = TUNE.TELLER_LOOT_MIN + Math.floor(Math.random() * TUNE.TELLER_LOOT_RANGE);
                addStones(loot);
                gainTxt = '她背过身，从柜底的钱匣里数出 ' + loot + ' 灵石，用袖子遮着推过来——库银漏了一角，账面上她自会抹平。';
            }
            c.karma = clamp((Number(c.karma) || 0) + TUNE.TELLER_KARMA, -100, 100);
            addHeat(TUNE.TELLER_HEAT, '勒索钱庄柜娘');
            log('🏦 你堵在柜台后巷，把话挑明。「' + t.name + '」盯着你的眼睛看了很久，终究是怕了。' + gainTxt + '（她从此怕你，下回更好得手；业障' + TUNE.TELLER_KARMA + '——她不敢报官，报官先说不清她自己。）', 'warning');
            say('🏦 「' + t.name + '」的手一直在抖。' + gainTxt + '（她怕了你——下回再逼，好使得多；业障' + TUNE.TELLER_KARMA + '）', 'success');
            refresh();
            return true;
        }
        // 砸了：她敲锣
        c.notoriety = Math.min(100, (Number(c.notoriety) || 0) + TUNE.TELLER_FAIL_NOTO);
        addHeat(TUNE.TELLER_FAIL_HEAT, '抢钱庄柜台被敲锣');
        repDown(TUNE.TELLER_FAIL_REP);
        var paid = deductStones(TUNE.TELLER_FAIL_FINE);
        if (!paid) c.notoriety = Math.min(100, (Number(c.notoriety) || 0) + TUNE.TELLER_FAIL_FINE_SHORT);
        _st.bankBan[pkCity(ct)] = day + TUNE.TELLER_BAN_DAYS;
        deed('bad', '你想逼钱庄的柜娘「' + t.name + '」出卖钱庄，让她当场敲了锣——半个城都看见你被伙计们堵在柜台前');
        log('🏦 「' + t.name + '」忽然弯腰抄起柜下的铜锣狠狠砸响——伙计们从后院涌出来把你堵在柜台前。（恶名+' + TUNE.TELLER_FAIL_NOTO + '，' + ct + '声望-' + TUNE.TELLER_FAIL_REP + '，' + (paid ? '罚金 ' + TUNE.TELLER_FAIL_FINE + ' 灵石' : '拿不出罚金，罪加一等（恶名再+' + TUNE.TELLER_FAIL_FINE_SHORT + '）') + '，钱庄闭门 ' + TUNE.TELLER_BAN_DAYS + ' 日，民愤大涨）', 'danger');
        say('🚨 锣声炸响！「' + t.name + '」指着你喊破了嗓子——' + (paid ? '罚金 ' + TUNE.TELLER_FAIL_FINE + ' 灵石当场缴清' : '你拿不出罚金，罪加一等') + '，钱庄 ' + TUNE.TELLER_BAN_DAYS + ' 日不接待你。（恶名+' + TUNE.TELLER_FAIL_NOTO + '，声望-' + TUNE.TELLER_FAIL_REP + '，热度+' + TUNE.TELLER_FAIL_HEAT + '——赏金猎人来得飞快）', 'error');
        refresh();
        return false;
    }

    // ============ 对话面板上的黑道两枚按钮 ============
    function buildNpcCrimeButtons(npc, npcId) {
        try {
            if (!npc || npc.isDead) return '';
            var btn = 'class="mt-1 flex items-center gap-2 px-3 py-2 rounded text-sm w-full transition-colors border ';
            return '<button onclick="window.NpcCrime.threaten(\'' + npcId + '\')" ' + btn + 'bg-red-950/60 hover:bg-red-900/60 border-red-900/50 text-red-200"><span>🗡️ 威胁</span><span class="text-xs text-red-300/70">逼TA怕你，挤出灵石——按职业另有一份孝敬</span></button>' +
                '<button onclick="window.NpcCrime.rob(\'' + npcId + '\')" ' + btn + 'bg-red-950/80 hover:bg-red-900/80 border-red-700/60 text-red-100"><span>💰 抢劫</span><span class="text-xs text-red-300/70">要TA全部家当——可能拔刀相向，业障恶名通缉三本账</span></button>';
        } catch (e) { console.warn('[静默失败] js/npcs/npc-crime.js · buildNpcCrimeButtons：按钮没挂上', e && e.message); return ''; }
    }
    window.buildNpcCrimeButtons = buildNpcCrimeButtons;

    // ============ 存读档（StateRegistry 正门） ============
    function _export() { return JSON.parse(JSON.stringify(_st)); }
    function _import(d) {
        var s = { heat: 0, bounty: 0, log: [], bankBan: {}, tellers: {}, perks: {}, lastCoolDay: -1 };
        if (d && typeof d === 'object') {
            s.heat = clamp(Math.floor(Number(d.heat) || 0), 0, TUNE.HEAT_MAX);
            s.bounty = Math.max(0, Math.floor(Number(d.bounty) || 0));
            s.lastCoolDay = Number.isFinite(Number(d.lastCoolDay)) ? Number(d.lastCoolDay) : -1;
            if (Array.isArray(d.log)) {
                s.log = d.log.filter(function (e) { return e && typeof e === 'object' && typeof e.why === 'string'; })
                    .slice(-20)
                    .map(function (e) { return { day: Number(e.day) || 0, why: String(e.why).slice(0, 40), n: clamp(Math.floor(Number(e.n) || 0), 0, 100) }; });
            }
            if (d.bankBan && typeof d.bankBan === 'object') {
                for (var bk in d.bankBan) {
                    var bv = Number(d.bankBan[bk]) || 0;
                    if (bv > 0) s.bankBan[String(bk).slice(0, 30)] = bv;
                }
            }
            if (d.tellers && typeof d.tellers === 'object') {
                for (var tk in d.tellers) {
                    var tv = d.tellers[tk];
                    if (!tv || typeof tv !== 'object' || typeof tv.name !== 'string') continue;
                    s.tellers[String(tk).slice(0, 30)] = {
                        name: String(tv.name).slice(0, 12),
                        age: clamp(Math.floor(Number(tv.age) || 20), 16, 80),
                        times: clamp(Math.floor(Number(tv.times) || 0), 0, 999),
                        fear: Number(tv.fear) > 0 ? 1 : 0,
                        lastCoerceDay: Number.isFinite(Number(tv.lastCoerceDay)) ? Number(tv.lastCoerceDay) : -999
                    };
                }
            }
            if (d.perks && typeof d.perks === 'object') {
                var pk2 = 0;
                for (var pkK in d.perks) { if (pk2++ >= 200) break; if (d.perks[pkK]) s.perks[String(pkK).slice(0, 60)] = 1; }
            }
        }
        _st = s;
    }
    function _reset() { _st = { heat: 0, bounty: 0, log: [], bankBan: {}, tellers: {}, perks: {}, lastCoolDay: -1 }; }
    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        window.StateRegistry.register('crimeLedger', { version: 1, export: _export, import: _import, reset: _reset });
    }

    if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') {
        window.timeSystem.onNewDaySubscribe(function () { coolDaily(); maybeHunter(); });
    }

    window.NpcCrime = {
        TUNE: TUNE,
        addHeat: addHeat, wanted: wanted, heat: heat, bounty: bounty,
        payBounty: payBounty, patrolBoost: patrolBoost, wantedLine: wantedLine,
        coolDaily: coolDaily, maybeHunter: maybeHunter,
        threaten: threaten, rob: rob, doRob: doRob, settleNpcRobbery: settleNpcRobbery,
        coerceTeller: coerceTeller, tellerDescribe: tellerDescribe, tellerOf: tellerOf,
        bankBanned: bankBanned, bankBanDays: bankBanDays,
        startFlaggedBattle: startFlaggedBattle, takeItems: takeItems,
        buildNpcCrimeButtons: buildNpcCrimeButtons,
        state: _export
    };
    window.executeThreatenNPC = threaten;
    window.executeRobNPC = rob;
})();
