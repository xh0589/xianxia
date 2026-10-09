// ==================== v26.0 六路营生批（第一百五十一批 · 用户点单）· 绑架勒索账 ====================
// 用户点单：「能威胁、能抢劫了，下一步自然是绑了富商或门派弟子写赎金信——带交赎金被埋伏、
//           撕票涨杀孽的后果链。」本账把这条黑道最重的一票接通：
//   ① 绑票：对话面板第三枚按钮（npc-crime.js buildNpcCrimeButtons 守卫接线）。只绑赎得起的
//      （富商 / 筑基以上 / 等级到线的「有门第的人」）；道侣挚交下不去手；导师长老碰不得；
//      能反抗的拔刀真仗（_isKidnapFight 旗 → app.js 战后分支结算），不能反抗的走掷骰。
//   ② 押票：人质锁进城外地窖（NPC 挪到「被囚」，原处记档）——同一时刻只押得起一票；
//      关押每满三日，官府循线的风险一日高过一日（被端＝票被救走＋你挨罚＋脸进册子）。
//   ③ 赎金信：轻赎 / 照身家 / 狠勒三档开口。到期（1~2 日）苦主家四路反应：
//      交赎金（夜里交割——脸不进册子）/ 埋伏（真仗 _isKidnapAmbush：赢了钱照拿，输了被扭送）/
//      报官（热度大涨＋脸进册子＋票被救走）/ 石沉大海（没人管——只剩放人或撕票两条路）。
//   ④ 撕票：业障 -15、热度 +15（脸进册子）、恶名 +8、NPC 真死（isDead 落账）——
//      风声进传闻池，道上都嫌你做得绝。杀孽的果报走 karma 真账（业障报应系统吃这个数）。
//   ⑤ 放人：票钱一分没有，TA 怕你也恨你；案子已经在册，热度小涨。
// 口径（与威胁/抢劫同尺）：每人每七日只动得了手一回（运行时账）；业障/恶名/民愤热度三本账一起记；
//   灵石走 DataManager 单一真源；带旗开战走 npc-crime.js startFlaggedBattle 正门；
//   罪行热度走 NpcCrime.addHeat 正门（同一本通缉账，v26.0 两档口径：当场被拿才画影）。
(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    var TUNE = {
        // 目标门槛
        WORTH_TIER: 2,            // 筑基以上算「有门第」
        WORTH_LEVEL: 30,          // 或等级到线
        PER_NPC_DAYS: 7,          // 每人每七日一回（运行时账）
        // 绑架（软路掷骰）
        KID_BASE: 0.40, KID_TIER: 0.10, KID_SKILL: 0.003, KID_RATE_MIN: 0.15, KID_RATE_MAX: 0.90,
        KID_FAIL_HEAT: 3, KID_FAIL_NOTO: 2,
        KID_FAIL_CAUGHT_P: 0.4, KID_CAUGHT_FINE: 60, KID_CAUGHT_HEAT: 4, KID_CAUGHT_NOTO: 2,
        // 得手落账（绑走那一刻）
        WIN_FEAR: 30, WIN_HATRED: 25, WIN_AFF: -50, WIN_HEAT: 5, WIN_NOTO: 2, WIN_KARMA: -6,
        // 赎金三档（× 身家基数）
        RANSOM_MULS: [0.6, 1.0, 2.0],
        RANSOM_BASE_RICH: 120,    // 富商身家基数
        RANSOM_BASE_NOBLE: 80,    // 有门第者基数
        // 到期反应（轻/照/狠 三档的交赎基础率）
        PAY_BASE: [0.55, 0.40, 0.22],
        AMBUSH_BASE: [0.10, 0.20, 0.30],
        REPORT_BASE: [0.15, 0.25, 0.35],
        NOTO_DRAG: 300,           // 恶名每点拖低交赎率
        RICH_PAY_BONUS: 0.10,     // 富商家大业大，掏钱痛快些
        // 交赎得手
        PAY_HEAT: 6, PAY_FEAR: 40, PAY_HATRED: 30,
        // 埋伏打赢 / 打输
        AMB_WIN_HEAT: 8, AMB_WIN_KARMA: -3,
        AMB_LOSE_HEAT: 12, AMB_LOSE_NOTO: 3, AMB_LOSE_HATRED: 50,
        // 报官
        REPORT_HEAT: 12, REPORT_NOTO: 2, REPORT_BOUNTY: 25, REPORT_HATRED: 40,
        // 关押风险（每满三日起，每日一掷）
        DEN_GRACE_DAYS: 3, DEN_RISK_BASE: 0.08, DEN_RISK_STEP: 0.03, DEN_RISK_CAP: 0.35,
        // 撕票
        SLAY_KARMA: -15, SLAY_HEAT: 15, SLAY_NOTO: 8,
        // 放人
        FREE_HEAT: 2, FREE_FEAR: 20, FREE_AFF: -10,
        // 战斗数据
        FIGHT_LEVEL_AT: 30
    };

    var _st = {
        hostage: null,        // { npcId, name, oldLoc, sinceDay, ransom, tierIdx, stage:'held'|'letter'|'ignored', dueDay }
        attempts: {}          // { npcId: absoluteDay } 运行时账（与威胁/摸包同款口径）
    };
    var _attLog = {};         // 运行时：每人每七日一回（不入档，与 _threatLog 同款）

    // ============ 小工具（黑道账同款口径） ============
    function cd() { return window.currentCharData || null; }
    function say(m, t) { try { if (window.showMessage) window.showMessage(m, t || 'info'); } catch (e) { return false; } return true; }
    function log(m, t) { try { if (window.gameLog && window.gameLog.add) window.gameLog.add(m, t || 'info'); } catch (e) { return false; } return true; }
    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
    function city() {
        return (cd() && cd().location) ||
            (typeof window.getCurrentCityName === 'function' && window.getCurrentCityName()) || '';
    }
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
                var r = window.RewardService.apply(spec, { source: source || '绑架', city: city() });
                return { ok: !!(r && r.success !== false), note: r && r.messages ? r.messages.join('、') : '' };
            }
        } catch (e) { console.warn('[静默失败] js/npcs/kidnap-system.js · settle：这笔账没落成一笔', e && e.message); }
        return { ok: false, note: '' };
    }
    function stonesNow() {
        try {
            var DM = window.DataManager || (window.XianXia && window.XianXia.DataManager);
            if (DM && typeof DM.getSpiritStones === 'function') return Number(DM.getSpiritStones()) || 0;
        } catch (e) { console.warn('[静默失败] js/npcs/kidnap-system.js · stonesNow：现银没读到，按角色面上的数算', e && e.message); }
        var c = cd();
        return c ? (Number(c.spiritStones) || 0) : 0;
    }
    function addStones(n) {
        try {
            var DM = window.DataManager || (window.XianXia && window.XianXia.DataManager);
            if (DM && typeof DM.addSpiritStones === 'function') { DM.addSpiritStones(n); return; }
        } catch (e) { console.warn('[静默失败] js/npcs/kidnap-system.js · addStones：DataManager 正门没走通，落回角色字段', e && e.message); }
        var c = cd();
        if (c) c.spiritStones = (Number(c.spiritStones) || 0) + n;
    }
    function deductStones(n) {
        try {
            var DM = window.DataManager || (window.XianXia && window.XianXia.DataManager);
            if (DM && typeof DM.deductSpiritStones === 'function') return !!DM.deductSpiritStones(n);
        } catch (e) { console.warn('[静默失败] js/npcs/kidnap-system.js · deductStones：DataManager 正门没走通，落回角色字段', e && e.message); }
        var c = cd();
        if (c && (Number(c.spiritStones) || 0) >= n) { c.spiritStones -= n; return true; }
        return false;
    }
    function addHeat(n, why, opts) {
        try { if (window.NpcCrime && typeof window.NpcCrime.addHeat === 'function') window.NpcCrime.addHeat(n, why, opts); } catch (e) { console.warn('[静默失败] js/npcs/kidnap-system.js · addHeat：罪行没记进通缉账', e && e.message); }
    }
    function addBounty(n) {
        try {
            if (window.NpcCrime && typeof window.NpcCrime.addBountyOnReport === 'function') { window.NpcCrime.addBountyOnReport(n); return true; }
        } catch (e) { console.warn('[静默失败] js/npcs/kidnap-system.js · addBounty：赏金没能追加', e && e.message); }
        return false;
    }
    function deed(mood, s) {
        try { if (typeof window.playerPushDeed === 'function') window.playerPushDeed(mood, s); } catch (e) { console.warn('[静默失败] js/npcs/kidnap-system.js · deed：风声没递进传闻池', e && e.message); }
    }
    function advance(min, why) {
        try { if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') window.timeSystem.advanceTime(min, why); } catch (e) { console.warn('[静默失败] js/npcs/kidnap-system.js · advance：时辰没扣成', e && e.message); }
    }
    function refresh() {
        try { if (window.updateCharacterStatus) window.updateCharacterStatus(); } catch (e) { console.warn('[静默失败] js/npcs/kidnap-system.js · refresh：面板没刷新', e && e.message); }
        try { if (typeof window.updateCurrencyUI === 'function') window.updateCurrencyUI(); } catch (e2) { console.warn('[静默失败] js/npcs/kidnap-system.js · refresh：钱袋没刷新', e2 && e2.message); }
    }
    function skill(name) {
        try { if (typeof window.getLifeSkill === 'function') return Number(window.getLifeSkill(name)) || 0; } catch (e) { console.warn('[静默失败] js/npcs/kidnap-system.js · skill：生活技能没读出来，按零算', e && e.message); }
        return 0;
    }
    function tierOf(realm) {
        try { if (typeof window.getRealmTier === 'function') return Number(window.getRealmTier(realm)) || 0; } catch (e) { console.warn('[静默失败] js/npcs/kidnap-system.js · tierOf：境界尺没量出来，按零档算', e && e.message); }
        return 0;
    }
    function playerTier() { var c = cd(); return c ? tierOf(c.realm) : 0; }
    function mul() {
        try { if (typeof window.bountyRealmMul === 'function') return Number(window.bountyRealmMul()) || 1; } catch (e) { console.warn('[静默失败] js/npcs/kidnap-system.js · mul：境界尺没量出来，赎金按一倍算', e && e.message); }
        return 1;
    }
    function npcById(id) {
        try { return (window.npcManager && typeof window.npcManager.getNPC === 'function') ? window.npcManager.getNPC(id) : null; } catch (e) { return null; }
    }
    function closeNpcDialog() {
        try { var m = document.querySelector('.npc-dialog-modal'); if (m) m.remove(); } catch (e) { console.warn('[静默失败] js/npcs/kidnap-system.js · closeNpcDialog：对话窗没收掉', e && e.message); }
    }
    function startFlaggedBattle(enemyData, flags, announce) {
        try {
            if (window.NpcCrime && typeof window.NpcCrime.startFlaggedBattle === 'function') {
                return window.NpcCrime.startFlaggedBattle(enemyData, flags, announce);
            }
        } catch (e) { console.warn('[静默失败] js/npcs/kidnap-system.js · startFlaggedBattle：这一仗没拉起来', e && e.message); }
        return false;
    }

    // ============ 目标甄别：赎得起的才绑 ============
    function isRich(npc) { return npc.occupation === '商人'; }
    function isNoble(npc) {
        return tierOf(npc.combat && npc.combat.realm) >= TUNE.WORTH_TIER ||
            (Number(npc.combat && npc.combat.level) || 0) >= TUNE.WORTH_LEVEL;
    }
    function worthOf(npc) {
        if (isRich(npc)) return TUNE.RANSOM_BASE_RICH;
        if (isNoble(npc)) return TUNE.RANSOM_BASE_NOBLE;
        return 0;
    }
    function willResist(npc) {
        if (npc.occupation === '战士' || npc.occupation === '竞争对手') return true;
        if (tierOf(npc.combat && npc.combat.realm) >= playerTier() && playerTier() > 0) return true;
        return (Number(npc.combat && npc.combat.level) || 0) >= TUNE.FIGHT_LEVEL_AT;
    }
    function holding() { return _st.hostage; }

    // ============ ① 绑票（对话面板按钮 → 确认 → 真仗 / 掷骰） ============
    function buildButton(npc, npcId, btnClass) {
        try {
            if (!npc || npc.isDead || !worthOf(npc)) return '';
            var btn = btnClass || 'class="mt-1 flex items-center gap-2 px-3 py-2 rounded text-sm w-full transition-colors border ';
            return '<button onclick="window.Kidnap.kidnap(\'' + npcId + '\')" ' + btn + 'bg-red-950 hover:bg-red-900 border-red-600/70 text-red-100"><span>🪢 绑架</span><span class="text-xs text-red-300/70">绑去地窖写赎金信——黑道最重的一票，后果链最长</span></button>';
        } catch (e) { console.warn('[静默失败] js/npcs/kidnap-system.js · buildButton：按钮没挂上', e && e.message); return ''; }
    }

    function kidnap(npcId) {
        var npc = npcById(npcId);
        if (!npc || npc.isDead) { say('那人早不在这儿了。', 'info'); return false; }
        var c = cd();
        if (!c) { say('请先创建角色。', 'warning'); return false; }
        if (window.currentBattle) { say('打着架呢。', 'warning'); return false; }
        if (_st.hostage) { say('🪢 地窖里还押着「' + _st.hostage.name + '」——一票未了，押不起第二票。', 'warning'); return false; }
        if (typeof window.npcNotCoLocated === 'function' && window.npcNotCoLocated(npc)) { say('你与' + npc.name + '并不在一处——绑架得当面下手。', 'warning'); return false; }
        var aff = Number(npc.relationship && npc.relationship.affection) || 0;
        var isDao = false;
        try { isDao = !!(typeof npc.hasFlag === 'function' && npc.hasFlag('dao_companion')); } catch (eF) { console.warn('[静默失败] js/npcs/kidnap-system.js · kidnap：道侣旗没读出来，按不是道侣算', eF && eF.message); }
        if (isDao || aff >= 80) { say('你望着 ' + npc.name + '，半晌，终究下不去手——对这等亲近的人，绑票这种事做不出来。', 'warning'); return false; }
        if (npc.occupation === '导师' || npc.occupation === '长老') { say('🪢 ' + npc.name + ' 这等人物，身边明桩暗哨不知多少——你掂量再三，收了手。（碰不得）', 'warning'); return false; }
        if (!worthOf(npc)) { say('🪢 ' + npc.name + ' 家无余财——绑了去，赎金信都写不出数目。白养一张嘴的买卖不做。', 'info'); return false; }
        var day = absDay();
        if (_attLog[npcId] !== undefined && day - _attLog[npcId] < TUNE.PER_NPC_DAYS) {
            say('🪢 ' + npc.name + ' 上回被你动过手，如今出门都带着人——风头还没过。（每 ' + TUNE.PER_NPC_DAYS + ' 日只对同一人动得了手一回，还要过 ' + (TUNE.PER_NPC_DAYS - (day - _attLog[npcId])) + ' 日）', 'info');
            return false;
        }

        var detail = '🪢 把 ' + npc.name + '（' + (isRich(npc) ? '富商' : '有门第') + '）绑去城外地窖，写赎金信。' +
            (willResist(npc) ? 'TA不是好惹的——下手就是真仗（赢了才押得住人）。' : 'TA反抗不了多少。') +
            '绑架是黑道最重的票：业障、恶名、民愤热度三本账一起记，苦主家会记你一辈子。真动手吗？';
        if (typeof window.showConfirm === 'function') {
            window.showConfirm('🪢 绑架', detail).then(function (ok) { if (ok) doKidnap(npcId); });
            return true;
        }
        return doKidnap(npcId);
    }

    function doKidnap(npcId) {
        var npc = npcById(npcId);
        if (!npc || npc.isDead) return false;
        _attLog[npcId] = absDay();
        if (willResist(npc)) {
            say('🪢 你朝 ' + npc.name + ' 逼近——TA退了两步，随即拔刀：「想绑我？来。」', 'error');
            return startKidnapFight(npc);
        }
        advance(20, '绑架');
        var tierDiff = playerTier() - tierOf(npc.combat && npc.combat.realm);
        var rate = clamp(TUNE.KID_BASE + tierDiff * TUNE.KID_TIER + skill('口才') * TUNE.KID_SKILL, TUNE.KID_RATE_MIN, TUNE.KID_RATE_MAX);
        if (Math.random() < rate) {
            seize(npc);
            return true;
        }
        // 失手：六成脱身，四成被拿（被拿＝脸进册子）
        var c = cd() || {};
        try { if (typeof npc.changeHatred === 'function') npc.changeHatred(15); } catch (eH) { console.warn('[静默失败] js/npcs/kidnap-system.js · doKidnap：仇恨没落账', eH && eH.message); }
        npc.changeAffection(-15);
        try { if (typeof npc.recordPlayerAction === 'function') npc.recordPlayerAction('kidnap_failed', 'negative'); } catch (eR) { console.warn('[静默失败] js/npcs/kidnap-system.js · doKidnap：这一笔没记进TA的记忆', eR && eR.message); }
        if (Math.random() < TUNE.KID_FAIL_CAUGHT_P) {
            c.notoriety = Math.min(100, (Number(c.notoriety) || 0) + TUNE.KID_CAUGHT_NOTO);
            addHeat(TUNE.KID_CAUGHT_HEAT, '绑架未遂被拿', { faceSeen: true });
            var paid = deductStones(TUNE.KID_CAUGHT_FINE);
            say('🚨 ' + npc.name + ' 拼死喊人，巡兵把你堵在了巷口。（恶名+' + TUNE.KID_CAUGHT_NOTO + '，' + (paid ? '罚金 ' + TUNE.KID_CAUGHT_FINE + ' 灵石' : '拿不出罚金，罪加一等') + '，脸进了官府的册子）', 'error');
        } else {
            c.notoriety = Math.min(100, (Number(c.notoriety) || 0) + TUNE.KID_FAIL_NOTO);
            addHeat(TUNE.KID_FAIL_HEAT, '绑架未遂');
            say('💨 ' + npc.name + ' 死命挣扎、扯着嗓子喊——你没得手，趁乱钻进了巷子。（恶名+' + TUNE.KID_FAIL_NOTO + '，热度+' + TUNE.KID_FAIL_HEAT + '）', 'warning');
        }
        refresh();
        return false;
    }

    function startKidnapFight(npc) {
        var tier = Math.max(1, tierOf(npc.combat && npc.combat.realm) || 1);
        var data = Object.assign({}, npc.combat || {}, { name: '【绑架】' + npc.name });
        return startFlaggedBattle({
            name: data.name, type: 'elite', physiologyType: 'humanoid',
            level: (npc.combat && npc.combat.level) || tier * 3 + 4,
            attack: (npc.combat && npc.combat.attack) || 30 + tier * 6,
            defense: (npc.combat && npc.combat.defense) || 15 + tier * 3,
            speed: (npc.combat && npc.combat.speed) || 22,
            maxDurability: 110 + tier * 15, durabilities: { chest: 110 + tier * 15 }, combatAbilities: []
        }, { _isKidnapFight: true, _kidnapNpcId: npc.id }, '⚔️ ' + npc.name + ' 拔刀相向——这一票要见真章了！');
    }

    function settleKidnapFight(won) {
        try {
            var b = window.currentBattle;
            var npcId = b && b._kidnapNpcId;
            var npc = npcId ? npcById(npcId) : null;
            if (won && npc) {
                seize(npc);
            } else {
                var c = cd() || {};
                var plunder = Math.floor(stonesNow() * 0.2);
                if (plunder > 0) deductStones(plunder);
                if (npc) {
                    try { if (typeof npc.changeHatred === 'function') npc.changeHatred(25); } catch (eH2) { console.warn('[静默失败] js/npcs/kidnap-system.js · settleKidnapFight：仇恨没落账', eH2 && eH2.message); }
                    try { npc.changeAffection(-20); } catch (eA) { console.warn('[静默失败] js/npcs/kidnap-system.js · settleKidnapFight：好感没落账', eA && eA.message); }
                    try { if (typeof npc.recordPlayerAction === 'function') npc.recordPlayerAction('kidnap_failed', 'negative'); } catch (eR2) { console.warn('[静默失败] js/npcs/kidnap-system.js · settleKidnapFight：这一笔没记进TA的记忆', eR2 && eR2.message); }
                }
                c.notoriety = Math.min(100, (Number(c.notoriety) || 0) + 2);
                addHeat(4, '绑架动武失手', { faceSeen: true });
                deed('bad', '你想绑' + (npc ? npc.name : '人') + '，反被TA打翻在地搜了身——道上行的人都在笑这一票');
                log('💀 绑架失手——' + (npc ? npc.name : '对方') + ' 把你打翻，搜走 ' + plunder + ' 灵石。（恶名+2，脸进了册子，TA记死了你）', 'danger');
                say('💀 绑架不成反被搜身——' + (npc ? npc.name : '对方') + (plunder > 0 ? '搜走你 ' + plunder + ' 灵石' : '啐了你一脸') + '。（恶名+2，脸进了官府的册子）', 'error');
            }
            refresh();
        } catch (e) { console.warn('[静默失败] js/npcs/kidnap-system.js · settleKidnapFight：这一票的账没落下', e && e.message); }
    }
    window.settleKidnapFight = settleKidnapFight;

    // 押进地窖（真账：NPC 挪走、记忆落笔、三本账齐记）
    function seize(npc) {
        var c = cd() || {};
        var worth = worthOf(npc);
        var oldLoc = npc.location || city() || '洛水城';
        _st.hostage = {
            npcId: npc.id, name: npc.name, oldLoc: String(oldLoc).slice(0, 30),
            sinceDay: absDay(), ransom: 0, tierIdx: -1, stage: 'held', dueDay: -1
        };
        try { npc.location = '被囚'; } catch (eL) { console.warn('[静默失败] js/npcs/kidnap-system.js · seize：人没能挪进地窖（位置账）', eL && eL.message); }
        try { npc.isFollowing = false; } catch (eF2) { console.warn('[静默失败] js/npcs/kidnap-system.js · seize：随行旗没能收掉', eF2 && eF2.message); }
        try { if (typeof npc.changeFear === 'function') npc.changeFear(TUNE.WIN_FEAR); } catch (eFr) { console.warn('[静默失败] js/npcs/kidnap-system.js · seize：威压没落账', eFr && eFr.message); }
        try { if (typeof npc.changeHatred === 'function') npc.changeHatred(TUNE.WIN_HATRED); } catch (eH3) { console.warn('[静默失败] js/npcs/kidnap-system.js · seize：仇恨没落账', eH3 && eH3.message); }
        try { npc.changeAffection(TUNE.WIN_AFF); } catch (eA2) { console.warn('[静默失败] js/npcs/kidnap-system.js · seize：好感没落账', eA2 && eA2.message); }
        try { if (typeof npc.recordPlayerAction === 'function') npc.recordPlayerAction('kidnapped', 'negative'); } catch (eR3) { console.warn('[静默失败] js/npcs/kidnap-system.js · seize：这一笔没记进TA的记忆', eR3 && eR3.message); }
        c.karma = clamp((Number(c.karma) || 0) + TUNE.WIN_KARMA, -100, 100);
        c.notoriety = Math.min(100, (Number(c.notoriety) || 0) + TUNE.WIN_NOTO);
        addHeat(TUNE.WIN_HEAT, '绑架' + npc.name);
        deed('bad', '你把' + npc.name + '绑去了城外地窖——苦主家已经在四处寻人');
        log('🪢 ' + npc.name + ' 被你堵了嘴、蒙了眼，押进城外地窖。（身家约值 ' + worth + '——赎金信还没写；威压+' + TUNE.WIN_FEAR + ' 仇恨+' + TUNE.WIN_HATRED + ' 好感' + TUNE.WIN_AFF + ' 业障' + TUNE.WIN_KARMA + ' 恶名+' + TUNE.WIN_NOTO + '）', 'danger');
        say('🪢 ' + npc.name + ' 已经在你的地窖里了。下一步：写赎金信（轻赎 / 照身家 / 狠勒），或是——放人、撕票。（业障' + TUNE.WIN_KARMA + ' 恶名+' + TUNE.WIN_NOTO + '，风声已经漏出去了）', 'success');
        refresh();
        return true;
    }

    // ============ ③ 赎金信（三档开口） ============
    function ransomBase() {
        var h = _st.hostage;
        if (!h) return 0;
        var npc = npcById(h.npcId);
        var worth = npc ? worthOf(npc) : (h.name ? TUNE.RANSOM_BASE_NOBLE : 0);
        return Math.max(1, Math.round(worth * mul()));
    }

    function sendLetter(tierIdx) {
        var h = _st.hostage;
        if (!h) { say('🪢 地窖里没有票——先绑一个再来写信。', 'info'); return false; }
        if (h.stage !== 'held') { say('🪢 赎金信已经送出去了（或是石沉大海）——等回音吧。', 'info'); return false; }
        var ti = Math.floor(Number(tierIdx));
        if (TUNE.RANSOM_MULS[ti] === undefined) { say('没有这一档的开口。', 'warning'); return false; }
        var base = ransomBase();
        h.ransom = Math.max(1, Math.round(base * TUNE.RANSOM_MULS[ti]));
        h.tierIdx = ti;
        h.stage = 'letter';
        h.dueDay = absDay() + 1 + Math.floor(Math.random() * 2);
        advance(30, '写赎金信');
        log('🪢 你撕了半幅衣料，咬破指尖写下赎金信：「' + h.name + ' 在我手上，备 ' + h.ransom + ' 灵石，三日后独往城西土地庙，敢报官就等着收尸。」——托城根底下的乞儿递了出去。（' + ['轻赎', '照身家', '狠勒'][ti] + ' · 回音一两日内到）', 'warning');
        say('🪢 赎金信送出去了——' + h.ransom + ' 灵石（' + ['轻赎', '照身家', '狠勒'][ti] + '档）。开口越狠，苦主家越可能不交钱：埋伏、报官都在后头等着。（每日新日结算回音）', 'warning');
        return true;
    }

    function letterOutcome(rng) {
        var h = _st.hostage;
        if (!h || h.stage !== 'letter') return;
        var ti = clamp(h.tierIdx, 0, 2);
        var npc = npcById(h.npcId);
        var noto = Number((cd() || {}).notoriety) || 0;
        var rPay = clamp(TUNE.PAY_BASE[ti] - noto / TUNE.NOTO_DRAG + (npc && isRich(npc) ? TUNE.RICH_PAY_BONUS : 0), 0.05, 0.9);
        var rAmb = TUNE.AMBUSH_BASE[ti];
        var rRep = TUNE.REPORT_BASE[ti];
        var r = (typeof rng === 'function') ? rng() : Math.random();
        if (r < rPay) { payOff(); return; }
        if (r < rPay + rAmb) { ambush(); return; }
        if (r < rPay + rAmb + rRep) { reported(); return; }
        h.stage = 'ignored';
        log('🪢 三天过去，土地庙前的香灰冷了又冷——' + h.name + ' 家没有来人。赎金信石沉大海：要么家中凉薄，要么已在筹别的法子。地窖里的票，只剩放与撕两条路。', 'warning');
        say('🪢 赎金信石沉大海——' + h.name + ' 家没人来。（只剩「放人」「撕票」两条路；关得越久，官府循线摸来的风险一日高过一日）', 'warning');
    }

    function payOff() {
        var h = _st.hostage;
        var amt = h.ransom;
        addStones(amt);
        addHeat(TUNE.PAY_HEAT, '绑架勒索得赎');   // 夜里交割——脸不进册子
        releaseHostage(true);
        deed('bad', '你绑了' + h.name + '勒索 ' + amt + ' 灵石——苦主家捏着鼻子交了钱，道上都在传这一票');
        log('🪢 三更天，土地庙后转出个管家模样的中年人，把一只沉甸甸的钱匣放在香案上，头也不回地走了。' + amt + ' 灵石到手——你放了' + h.name + '。（热度+' + TUNE.PAY_HEAT + '，夜里交割，脸没进册子；苦主家记你一辈子）', 'warning');
        say('🪢 赎金 ' + amt + ' 灵石到手，' + h.name + ' 放了。（热度+' + TUNE.PAY_HEAT + '——这票案底还在，风头不会自己消）', 'success');
        refresh();
    }

    function ambush() {
        var h = _st.hostage;
        var tier = playerTier() || 3;
        var esc = '苦主家护院·' + (h.name.indexOf('·') >= 0 ? h.name.split('·')[0] : h.name) + '府';
        var started = startFlaggedBattle({
            name: esc, type: 'elite', physiologyType: 'humanoid',
            level: tier * 3 + 3 + Math.floor(h.ransom / 80),
            attack: 34 + tier * 6, defense: 17 + tier * 3, speed: 24,
            maxDurability: 120 + tier * 15, durabilities: { chest: 120 + tier * 15 }, combatAbilities: []
        }, { _isKidnapAmbush: true, _ambushRansom: h.ransom },
            '🪢 土地庙四周火把齐亮——苦主家没打算交钱，埋伏的护院先动手了！');
        if (!started) {
            // 战斗系统不在位：按被扭送的坏结局老实落账（不吞票也不吞账）
            settleKidnapAmbush(false);
        }
    }

    function settleKidnapAmbush(won) {
        try {
            var b = window.currentBattle;
            var h = _st.hostage;
            var amt = (b && Number(b._ambushRansom)) || (h ? h.ransom : 0);
            var name = h ? h.name : '人质';
            var c = cd() || {};
            if (won) {
                addStones(amt);
                addHeat(TUNE.AMB_WIN_HEAT, '打退苦主家埋伏');
                c.karma = clamp((Number(c.karma) || 0) + TUNE.AMB_WIN_KARMA, -100, 100);
                releaseHostage(true);
                deed('bad', '苦主家埋伏赎金局，反被你打翻——' + name + '的赎金 ' + amt + ' 灵石照拿，道上都咂舌这一票');
                log('🪢 火把倒了一地，护院们抬着伤的跑了。钱匣留下了——' + amt + ' 灵石照拿，' + name + '放了。（业障' + TUNE.AMB_WIN_KARMA + '，热度+' + TUNE.AMB_WIN_HEAT + '）', 'danger');
                say('🪢 埋伏被你打退——赎金 ' + amt + ' 灵石照拿，' + name + ' 放了。（业障' + TUNE.AMB_WIN_KARMA + ' 热度+' + TUNE.AMB_WIN_HEAT + '）', 'success');
            } else {
                var paid = Math.min(stonesNow(), amt);
                if (paid > 0) deductStones(paid);
                c.notoriety = Math.min(100, (Number(c.notoriety) || 0) + TUNE.AMB_LOSE_NOTO);
                addHeat(TUNE.AMB_LOSE_HEAT, '赎金局失手被扭送', { faceSeen: true });
                recoverHostage(TUNE.AMB_LOSE_HATRED, '苦主家的护院把你按在土地庙前，人票当场夺回');
                deed('bad', '你在赎金局里被苦主家护院打翻、扭送官府——' + name + '救回去了，你的脸进了画影册');
                log('💀 护院的刀压着你的脖子，' + name + '被夺了回去。' + (paid > 0 ? '赎金没拿到，反被搜走 ' + paid + ' 灵石。' : '你身无分文，挨了顿好打。') + '（恶名+' + TUNE.AMB_LOSE_NOTO + '，热度+' + TUNE.AMB_LOSE_HEAT + '，脸进册子）', 'danger');
                say('💀 赎金局失手——' + name + '被夺回，你被扭送官府' + (paid > 0 ? '，还被搜走 ' + paid + ' 灵石' : '') + '。（恶名+' + TUNE.AMB_LOSE_NOTO + ' 热度+' + TUNE.AMB_LOSE_HEAT + '，脸进了画影册）', 'error');
            }
            refresh();
        } catch (e) { console.warn('[静默失败] js/npcs/kidnap-system.js · settleKidnapAmbush：赎金局的账没落下', e && e.message); }
    }
    window.settleKidnapAmbush = settleKidnapAmbush;

    function reported() {
        var h = _st.hostage;
        var c = cd() || {};
        c.notoriety = Math.min(100, (Number(c.notoriety) || 0) + TUNE.REPORT_NOTO);
        addHeat(TUNE.REPORT_HEAT, '绑架案发苦主报官', { faceSeen: true });
        addBounty(TUNE.REPORT_BOUNTY);
        recoverHostage(TUNE.REPORT_HATRED, '官差循着赎金信的路数摸到地窖，把' + h.name + '救了回去');
        deed('bad', '苦主家报了官——' + h.name + '被救走，官差的画影册上添了你的脸');
        log('🚨 苦主家没交钱，报了官。官差循着乞儿递信的路数摸到地窖——' + h.name + '被救了回去。（恶名+' + TUNE.REPORT_NOTO + '，热度+' + TUNE.REPORT_HEAT + '，脸进册子，悬赏追加 ' + TUNE.REPORT_BOUNTY + '）', 'danger');
        say('🚨 苦主家报了官——' + h.name + '被救走，画影册上添了你的脸。（恶名+' + TUNE.REPORT_NOTO + ' 热度+' + TUNE.REPORT_HEAT + '）', 'error');
        refresh();
    }

    // 官府循线端了地窖（关押超时风险）——与报官同口径
    function denRaid() {
        var h = _st.hostage;
        if (!h) return;
        var c = cd() || {};
        c.notoriety = Math.min(100, (Number(c.notoriety) || 0) + 2);
        addHeat(TUNE.REPORT_HEAT, '绑架案发地窖被端', { faceSeen: true });
        addBounty(TUNE.REPORT_BOUNTY);
        recoverHostage(TUNE.REPORT_HATRED, '官差端了地窖，把' + h.name + '救了出去');
        deed('bad', '你的地窖被官差端了——' + h.name + '救了出去，画影册上添了你的脸');
        log('🚨 关得太久了——官差循着线人摸到地窖，破门而入。' + h.name + '被救了出去。（恶名+2，热度+' + TUNE.REPORT_HEAT + '，脸进册子，悬赏追加 ' + TUNE.REPORT_BOUNTY + '）', 'danger');
        say('🚨 地窖被官差端了——' + h.name + '获救，你的脸进了画影册。（恶名+2 热度+' + TUNE.REPORT_HEAT + '）', 'error');
        refresh();
    }

    function recoverHostage(hatred, why) {
        var h = _st.hostage;
        if (!h) return;
        var npc = npcById(h.npcId);
        if (npc && !npc.isDead) {
            try { npc.location = h.oldLoc || city() || npc.location; } catch (eL2) { console.warn('[静默失败] js/npcs/kidnap-system.js · recoverHostage：人没能送回原处', eL2 && eL2.message); }
            try { if (typeof npc.changeHatred === 'function') npc.changeHatred(hatred); } catch (eH4) { console.warn('[静默失败] js/npcs/kidnap-system.js · recoverHostage：仇恨没落账', eH4 && eH4.message); }
            try { if (typeof npc.recordPlayerAction === 'function') npc.recordPlayerAction('rescued_from_kidnap', 'negative'); } catch (eR4) { console.warn('[静默失败] js/npcs/kidnap-system.js · recoverHostage：这一笔没记进TA的记忆', eR4 && eR4.message); }
        }
        _st.hostage = null;
        if (why) log('🪢 ' + why + '。', 'warning');
    }

    // 放人（交了赎金的走 releaseHostage(true)；白放走 false）
    function releaseHostage(paid) {
        var h = _st.hostage;
        if (!h) { say('🪢 地窖里没有票。', 'info'); return false; }
        var npc = npcById(h.npcId);
        if (npc && !npc.isDead) {
            try { npc.location = h.oldLoc || city() || npc.location; } catch (eL3) { console.warn('[静默失败] js/npcs/kidnap-system.js · releaseHostage：人没能送回原处', eL3 && eL3.message); }
            try { if (typeof npc.changeFear === 'function') npc.changeFear(TUNE.FREE_FEAR); } catch (eFr2) { console.warn('[静默失败] js/npcs/kidnap-system.js · releaseHostage：威压没落账', eFr2 && eFr2.message); }
            if (!paid) {
                try { npc.changeAffection(TUNE.FREE_AFF); } catch (eA3) { console.warn('[静默失败] js/npcs/kidnap-system.js · releaseHostage：好感没落账', eA3 && eA3.message); }
                try { if (typeof npc.changeHatred === 'function') npc.changeHatred(10); } catch (eH5) { console.warn('[静默失败] js/npcs/kidnap-system.js · releaseHostage：仇恨没落账', eH5 && eH5.message); }
            }
            try { if (typeof npc.recordPlayerAction === 'function') npc.recordPlayerAction(paid ? 'released_after_ransom' : 'released', 'negative'); } catch (eR5) { console.warn('[静默失败] js/npcs/kidnap-system.js · releaseHostage：这一笔没记进TA的记忆', eR5 && eR5.message); }
        }
        if (!paid) addHeat(TUNE.FREE_HEAT, '绑票后放人');
        var name = h.name;
        _st.hostage = null;
        log('🪢 你解开' + name + '的绳子，蒙眼布塞进TA手里：「往东走，别回头。」——' + (paid ? '赎金已入袋，票放了。' : '票钱一分没有，你把人放了。TA怕你也恨你，案子却已经在册。') + '（威压+' + TUNE.FREE_FEAR + (paid ? '' : '，好感' + TUNE.FREE_AFF + '，热度+' + TUNE.FREE_HEAT) + '）', paid ? 'success' : 'info');
        say('🪢 ' + name + '放了。' + (paid ? '' : '（热度+' + TUNE.FREE_HEAT + '——案底还在册上）'), paid ? 'success' : 'info');
        refresh();
        return true;
    }

    // ============ ④ 撕票 ============
    function slayHostage() {
        var h = _st.hostage;
        if (!h) { say('🪢 地窖里没有票。', 'info'); return false; }
        var c = cd();
        if (!c) { say('请先创建角色。', 'warning'); return false; }
        var detail = '🪢 撕票是绝路：' + h.name + ' 真死（生死簿落账），业障 ' + TUNE.SLAY_KARMA + '、恶名 +' + TUNE.SLAY_NOTO + '、热度 +' + TUNE.SLAY_HEAT + '（脸进册子），苦主家与你不死不休，道上都会知道你把事做绝了。撕吗？';
        if (typeof window.showConfirm === 'function') {
            window.showConfirm('🪢 撕票', detail).then(function (ok) { if (ok) doSlay(); });
            return true;
        }
        return doSlay();
    }

    function doSlay() {
        var h = _st.hostage;
        if (!h) return false;
        var c = cd() || {};
        var npc = npcById(h.npcId);
        if (npc) {
            try { npc.isDead = true; npc.isFollowing = false; } catch (eD) { console.warn('[静默失败] js/npcs/kidnap-system.js · doSlay：生死簿没落上——这一刀白挥', eD && eD.message); }
            try { if (typeof npc.recordPlayerAction === 'function') npc.recordPlayerAction('slain_by_player', 'negative'); } catch (eR6) { console.warn('[静默失败] js/npcs/kidnap-system.js · doSlay：这一笔没记进TA的记忆', eR6 && eR6.message); }
        }
        c.karma = clamp((Number(c.karma) || 0) + TUNE.SLAY_KARMA, -100, 100);
        c.notoriety = Math.min(100, (Number(c.notoriety) || 0) + TUNE.SLAY_NOTO);
        addHeat(TUNE.SLAY_HEAT, '撕票' + h.name, { faceSeen: true });
        deed('bad', '你撕了票——' + h.name + '死在你手里。连黑道的人都嫌这事做得绝');
        var name = h.name;
        _st.hostage = null;
        log('💀 地窖里的灯灭了一回，再亮起来时，' + name + '已经没了气。你把这事做绝了。（业障' + TUNE.SLAY_KARMA + ' 恶名+' + TUNE.SLAY_NOTO + ' 热度+' + TUNE.SLAY_HEAT + '，脸进册子——杀孽的果报，业障账上见）', 'danger');
        say('💀 ' + name + '死了。业障' + TUNE.SLAY_KARMA + '、恶名+' + TUNE.SLAY_NOTO + '、热度+' + TUNE.SLAY_HEAT + '——苦主家与你不死不休，道上都嫌你做得绝。', 'error');
        refresh();
        return true;
    }

    // ============ ② 每日：回音到期 / 关押风险 ============
    function dailyCheck(rng) {
        var h = _st.hostage;
        if (!h) return;
        var day = absDay();
        if (h.stage === 'letter' && h.dueDay > 0 && day >= h.dueDay) { letterOutcome(rng); return; }
        var held = day - h.sinceDay;
        if (held >= TUNE.DEN_GRACE_DAYS) {
            var p = Math.min(TUNE.DEN_RISK_CAP, TUNE.DEN_RISK_BASE + (held - TUNE.DEN_GRACE_DAYS) * TUNE.DEN_RISK_STEP);
            var r = (typeof rng === 'function') ? rng() : Math.random();
            if (r < p) { denRaid(); return; }
            if (held === TUNE.DEN_GRACE_DAYS) {
                log('🪢 地窖外传来两声更梆——关押满三日了。官府若循着苦主家的报案摸过来，一日险过一日。', 'warning');
            }
        }
    }

    // ============ 牌面（地窖一票：写赎金信 / 放人 / 撕票） ============
    function open() {
        var h = _st.hostage;
        if (!h) { say('🪢 城外地窖空着——你手里没有票。（对话面板上对赎得起的人有「绑架」钮）', 'info'); return false; }
        var held = absDay() - h.sinceDay;
        var riskLine = held >= TUNE.DEN_GRACE_DAYS
            ? '<p class="text-xs text-red-300 mb-2">⚠️ 已关押 ' + held + ' 日——官府循线摸来的风险一日高过一日（今日约 ' + Math.round(Math.min(TUNE.DEN_RISK_CAP, TUNE.DEN_RISK_BASE + (held - TUNE.DEN_GRACE_DAYS) * TUNE.DEN_RISK_STEP) * 100) + '%）。</p>'
            : '<p class="text-xs text-gray-400 mb-2">关押第 ' + held + ' 日——满 ' + TUNE.DEN_GRACE_DAYS + ' 日后，官府循线摸来的风险一日高过一日。</p>';
        var btn = 'class="w-full p-3 rounded mb-2 text-left text-sm text-white hover:opacity-90"';
        var html = '<p class="text-sm text-gray-300 mb-2">🪢 地窖里押着「<span class="text-red-300 font-bold">' + h.name + '</span>」（身家约值 ' + ransomBase() + ' 灵石）。</p>' + riskLine;
        if (h.stage === 'held') {
            html += '<button onclick="window.Kidnap.sendLetter(0)" ' + btn.replace('p-3', 'bg-amber-900 p-3') + '>✉️ 轻赎（' + Math.round(ransomBase() * TUNE.RANSOM_MULS[0]) + ' 灵石）<span class="block text-xs text-gray-400">开口低，苦主家最可能痛快交钱</span></button>' +
                '<button onclick="window.Kidnap.sendLetter(1)" ' + btn.replace('p-3', 'bg-orange-900 p-3') + '>✉️ 照身家（' + Math.round(ransomBase() * TUNE.RANSOM_MULS[1]) + ' 灵石）<span class="block text-xs text-gray-400">公道价——交赎、埋伏、报官都在秤上</span></button>' +
                '<button onclick="window.Kidnap.sendLetter(2)" ' + btn.replace('p-3', 'bg-red-900 p-3') + '>✉️ 狠勒（' + Math.round(ransomBase() * TUNE.RANSOM_MULS[2]) + ' 灵石）<span class="block text-xs text-gray-400">开口最狠——苦主家多半不交：埋伏与报官的概率最高</span></button>';
        } else if (h.stage === 'letter') {
            html += '<p class="text-sm text-gray-400 mb-2">✉️ 赎金信已送出（' + h.ransom + ' 灵石）——回音预计第 ' + h.dueDay + ' 日到。交赎 / 埋伏 / 报官 / 石沉大海，全看苦主家。</p>';
        } else {
            html += '<p class="text-sm text-gray-400 mb-2">✉️ 赎金信石沉大海——没人来交钱。只剩放人与撕票两条路。</p>';
        }
        html += '<button onclick="window.Kidnap.releaseBtn()" ' + btn.replace('p-3', 'bg-teal-900 p-3') + '>🕊️ 放人（票钱没有，TA怕你也恨你；案底还在册）</button>' +
            '<button onclick="window.Kidnap.slayHostage()" ' + btn.replace('p-3', 'bg-red-950 p-3') + '>💀 撕票（真死 · 业障' + TUNE.SLAY_KARMA + ' · 恶名+' + TUNE.SLAY_NOTO + ' · 脸进册子 · 不死不休）</button>';
        if (typeof window.showBuildingEffectDialog === 'function') {
            window.showBuildingEffectDialog('🪢 城外地窖 · ' + city(), html);
            return true;
        }
        return false;
    }
    function releaseBtn() { return releaseHostage(false); }

    // ============ 存读档（StateRegistry 正门） ============
    function _export() { return JSON.parse(JSON.stringify(_st)); }
    function _import(d) {
        var s = { hostage: null, attempts: {} };
        if (d && typeof d === 'object' && d.hostage && typeof d.hostage === 'object') {
            var h = d.hostage;
            if (typeof h.npcId === 'string' && typeof h.name === 'string') {
                s.hostage = {
                    npcId: h.npcId.slice(0, 60),
                    name: h.name.slice(0, 24),
                    oldLoc: typeof h.oldLoc === 'string' ? h.oldLoc.slice(0, 30) : '',
                    sinceDay: Number.isFinite(Number(h.sinceDay)) ? Math.floor(Number(h.sinceDay)) : 0,
                    ransom: Math.max(0, Math.floor(Number(h.ransom)) || 0),
                    tierIdx: [0, 1, 2].indexOf(Math.floor(Number(h.tierIdx))) >= 0 ? Math.floor(Number(h.tierIdx)) : -1,
                    stage: ['held', 'letter', 'ignored'].indexOf(h.stage) >= 0 ? h.stage : 'held',
                    dueDay: Number.isFinite(Number(h.dueDay)) ? Math.floor(Number(h.dueDay)) : -1
                };
            }
        }
        _st = s;
    }
    function _reset() { _st = { hostage: null, attempts: {} }; }
    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        window.StateRegistry.register('kidnap', { version: 1, export: _export, import: _import, reset: _reset });
    }

    if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') {
        window.timeSystem.onNewDaySubscribe(function () { dailyCheck(); });
    }

    window.Kidnap = {
        TUNE: TUNE,
        worthOf: worthOf, isRich: isRich, isNoble: isNoble, holding: holding,
        buildButton: buildButton, kidnap: kidnap, doKidnap: doKidnap,
        settleKidnapFight: settleKidnapFight, settleKidnapAmbush: settleKidnapAmbush,
        sendLetter: sendLetter, releaseBtn: releaseBtn, releaseHostage: releaseHostage,
        slayHostage: slayHostage, dailyCheck: dailyCheck, ransomBase: ransomBase,
        open: open,
        state: _export
    };
    window.executeKidnapNPC = kidnap;
})();
