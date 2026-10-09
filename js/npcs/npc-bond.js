// ==================== v25.8 黑道与人情批（第一百五十批 · 用户点单）· 人情账 ====================
// 人物面板翻了底账：借物只能借不能还（归还函数写好多年，全库没有按钮调它——每笔借物必然逾期扣好感）、
// 约会只有道侣被动受邀（玩家不能主动约人，更没有提亲）、不能「向甲打听乙」、馆子只能独食、
// 镖局只能自己打工当镖师（雇不了人护镖——v25.6 押货跑商正缺这个明面）、占卜全库空白、
// 有师承资格的人面板上没有拜师按钮。本账把这七件一次接通，外加把 trust 轨与 NPC 心底秘密
// （background.secret 死账）焊在一起：信任满格的 NPC 会主动把秘密托付给你——从此成为 🃏 筹码系统的料。
//   ① 归还借物：面板出「📦 归还」按钮（NPCBorrowService.returnBorrowedItem 正门，按时还反而涨好感）；
//   ② 主动邀约：好感≥30 可请人出门——散步/吃茶/看月亮（看月亮要夜里），成不成看好感口才与心情，
//      成功两情(love)与好感同涨、信任+1；每人每日一邀（运行时账，摸包同款口径）；
//      道侣情浓（love≥60）可补一场提亲仪式（100 灵石婚宴，名册 bond.level 抬到 2——诞育灵胎的门就此打开）；
//   ③ 打听某人：向甲打听乙——乙在哪（npc.location 真账）、甲乙什么交情（npcRelationships 真账）、
//      口才≥30 或甲信你（trust≥40）才肯多说乙的心事（background.goal 真账）；茶钱 5 铜，每甲每日一回；
//   ④ 请客吃饭：馆子里邀同城 NPC 同席（钱按人数翻倍：家常 20 铜/招牌 100 铜），好感真涨、
//      点到 TA 爱吃的（喜好账 likedItems）加得更多；每人每日一次；
//   ⑤ 雇镖护货：日薪 5+境界档×5 灵石，一次雇三天（StateRegistry 'npcBond' 落档）——有镖师压阵，
//      押货截道风声让 5 个百分点（caravan-trade 守卫接线，与丐帮耳目同一本折扣账的明面）；
//      截道真发生时三成几率镖师断后喝退响马；雇得太抠（好感<40）可能临阵撂挑子；输了货损减半；
//   ⑥ 占卜：隐士/道士面板出「🔮 求一卦」（20 灵石，actionGate 每日一卦）——卦师口条 fortuneHints
//      全部吃真账（通缉悬赏/仇家/货担/MarketDynamic 行情/丐帮缘分/气运），绝不编瞎话；
//      街边道士的廉价卦（citizen-life.js）同一张口条；
//   ⑦ 托付秘密：trust≥60 且好感≥50 且有心底秘密的 NPC，面板出「💭 TA欲言又止」——听完后秘密入
//      npc.secrets（随 NPC 存档往返），🃏 筹码面板自动收编（secret-leverage 零改动，默认兜底口径）；
//   ⑧ 拜师按钮：SECT_DEEP_DATA 师傅名册里有 TA 且你无门无师——面板直接开该派拜师窗（正门 showSectMasters）。
(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    var TUNE = {
        DATE_AFF_AT: 30,
        DATE_BASE: 0.25, DATE_AFF: 0.005, DATE_SKILL: 0.002, DATE_MOOD_BONUS: 0.1, DATE_DAO_BONUS: 0.2,
        DATE_MIN: 0.05, DATE_MAX: 0.95, DATE_FAIL_AFF: -1,
        WALK_MIN: 60, WALK_LOVE: 3, WALK_AFF: 2, WALK_MOOD: 8,
        TEA_COPPER: 10, TEA_MIN: 60, TEA_LOVE: 4, TEA_AFF: 3, TEA_MOOD: 10,
        MOON_MIN: 90, MOON_LOVE: 5, MOON_AFF: 3, MOON_MOOD: 12,
        PROPOSE_LOVE_AT: 60, PROPOSE_COST: 100, PROPOSE_LOVE: 10, PROPOSE_AFF: 5, PROPOSE_MOOD: 20,
        ASK_COPPER: 5, ASK_MIN: 15, ASK_DEEP_SKILL: 30, ASK_DEEP_TRUST: 40,
        TREAT_HOME: 20, TREAT_SPEC: 100, TREAT_MIN: 60, TREAT_AFF: 4, TREAT_AFF_LIKED: 6,
        TREAT_MOOD: 10, TREAT_ENERGY: 15, TREAT_MOOD_SELF: 3, TREAT_SATIETY: 25,
        ESCORT_DAYS: 3, ESCORT_WAGE_BASE: 5, ESCORT_WAGE_TIER: 5, ESCORT_LEVEL_AT: 10, ESCORT_AFF_AT: 30,
        ESCORT_DISCOUNT: 0.05, ESCORT_SAVE_P: 0.30, ESCORT_FLAKY_AFF: 40, ESCORT_FLAKY_P: 0.25,
        ESCORT_PLUNDER_MOD: 0.5,
        DIVINE_COST: 20, DIVINE_MIN: 30, DIVINE_HINTS: 3,
        ENTRUST_TRUST: 60, ENTRUST_AFF: 50, ENTRUST_TRUST_GAIN: 5, ENTRUST_AFF_GAIN: 3
    };

    var _st = { escort: null };            // 镖师契约（落档）
    var _dateLog = {}, _askLog = {}, _treatLog = {};   // 运行时每日账

    function cd() { return window.currentCharData || null; }
    function say(m, t) { try { if (window.showMessage) window.showMessage(m, t || 'info'); } catch (e) { return false; } return true; }
    function log(m, t) { try { if (window.gameLog && window.gameLog.add) window.gameLog.add(m, t || 'info'); } catch (e) { return false; } return true; }
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
                var r = window.RewardService.apply(spec, { source: source || '人情往来', city: city() });
                return { ok: !!(r && r.success !== false), note: r && r.messages ? r.messages.join('、') : '' };
            }
        } catch (e) { console.warn('[静默失败] js/npcs/npc-bond.js · settle：这笔人情账没落成', e && e.message); }
        return { ok: false, note: '' };
    }
    function advance(min, why) {
        try { if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') window.timeSystem.advanceTime(min, why); } catch (e) { console.warn('[静默失败] js/npcs/npc-bond.js · advance：时辰没扣成', e && e.message); }
    }
    function deed(mood, s) {
        try { if (typeof window.playerPushDeed === 'function') window.playerPushDeed(mood, s); } catch (e) { console.warn('[静默失败] js/npcs/npc-bond.js · deed：风声没递进传闻池', e && e.message); }
    }
    function refresh() {
        try { if (window.updateCharacterStatus) window.updateCharacterStatus(); } catch (e) { console.warn('[静默失败] js/npcs/npc-bond.js · refresh：面板没刷新', e && e.message); }
    }
    function skill(name) {
        try { if (typeof window.getLifeSkill === 'function') return Number(window.getLifeSkill(name)) || 0; } catch (e) { console.warn('[静默失败] js/npcs/npc-bond.js · skill：生活技能没读出来，按零算', e && e.message); }
        return 0;
    }
    function tierOf(realm) {
        try { if (typeof window.getRealmTier === 'function') return Number(window.getRealmTier(realm)) || 0; } catch (e) { console.warn('[静默失败] js/npcs/npc-bond.js · tierOf：境界尺没量出来，按零档算', e && e.message); }
        return 0;
    }
    function npcById(id) {
        try { return (window.npcManager && typeof window.npcManager.getNPC === 'function') ? window.npcManager.getNPC(id) : null; } catch (e) { return null; }
    }
    // DES-57：城名两串写法（舆图转发带空格）——比地点前先取键（v24.0 CT⑥ 棘轮口径，裸等值禁形）
    function pkCity(s) { return String(s == null ? '' : s).replace(/\s+/g, ''); }
    function coLocated(npc) {
        try { return !(typeof window.npcNotCoLocated === 'function' && window.npcNotCoLocated(npc)); } catch (e) { return true; }
    }
    function seedOf(s) { var h = 0; s = String(s || ''); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
    function safeId(s) { return String(s || '').replace(/[^A-Za-z0-9_\-]/g, ''); }

    // ============ ① 归还借物（断头账救活） ============
    function pendingBorrow(npcId) {
        try {
            if (!window.NPCBorrowService || typeof window.NPCBorrowService.getRecords !== 'function') return null;
            var recs = window.NPCBorrowService.getRecords() || [];
            for (var i = 0; i < recs.length; i++) {
                if (recs[i] && recs[i].npcId === npcId && !recs[i].returned) return recs[i];
            }
        } catch (e) { console.warn('[静默失败] js/npcs/npc-bond.js · pendingBorrow：借物账没翻出来', e && e.message); }
        return null;
    }
    function borrowDaysLeft(rec) {
        try {
            if (!rec) return 0;
            var now = 0;
            if (window.GameScheduler && typeof window.GameScheduler.nowMinute === 'function') now = window.GameScheduler.nowMinute();
            else if (window.timeSystem && window.timeSystem.gameTime) now = Number(window.timeSystem.gameTime.totalMinutes) || 0;
            return Math.ceil(((Number(rec.dueGameMinute) || 0) - now) / 1440);
        } catch (e) { return 0; }
    }
    function returnItem(npcId) {
        var rec = pendingBorrow(npcId);
        if (!rec) { say('你欠 TA 的东西已经还清了。', 'info'); return false; }
        try {
            var r = window.NPCBorrowService.returnBorrowedItem(rec.id);
            say((r && r.msg) || '归还完成。', (r && r.success) ? 'success' : 'warning');
            refresh();
            return !!(r && r.success);
        } catch (e) { console.warn('[静默失败] js/npcs/npc-bond.js · returnItem：归还没走成正门', e && e.message); return false; }
    }

    // ============ ② 主动邀约 ============
    function openDate(npcId) {
        var npc = npcById(npcId);
        if (!npc || npc.isDead) { say('那人早不在这儿了。', 'info'); return false; }
        if (!coLocated(npc)) { say('你与' + npc.name + '并不在一处——邀约得当面递。', 'warning'); return false; }
        var aff = Number(npc.relationship && npc.relationship.affection) || 0;
        var love = Number(npc.relationship && npc.relationship.love) || 0;
        var isDao = false;
        try { isDao = !!(typeof npc.hasFlag === 'function' && npc.hasFlag('dao_companion')); } catch (eF) { console.warn('[静默失败] js/npcs/npc-bond.js · openDate：道侣旗没读出来，按不是道侣算', eF && eF.message); }
        if (aff < TUNE.DATE_AFF_AT) { say('🌸 与 ' + npc.name + ' 的交情还浅（好感 ' + aff + '，需 ' + TUNE.DATE_AFF_AT + '）——贸然相邀，只会讨个没趣。', 'info'); return false; }
        var done = _dateLog[npcId] === absDay();
        var btn = 'class="w-full p-3 rounded mb-2 text-left text-sm text-white hover:opacity-90"';
        var html = '<p class="text-sm text-gray-400 mb-2">你想约 ' + npc.name + ' 出门走走。TA看了你一眼，等你开口。<span class="text-xs text-gray-500">（好感 ' + aff + (love > 0 ? ' · 两情 ' + love : '') + '）</span></p>' +
            (done ? '<p class="text-xs text-rose-300 mb-2">今日已邀过 TA 了——再邀就嫌你缠人了，明日再来。</p>' :
                '<button onclick="NpcBond.date(\'' + npcId + '\',\'walk\')" ' + btn.replace('p-3', 'bg-rose-900 p-3') + '>🚶 出去走走（' + TUNE.WALK_MIN + ' 分钟 · 两情+' + TUNE.WALK_LOVE + ' 好感+' + TUNE.WALK_AFF + '）</button>' +
                '<button onclick="NpcBond.date(\'' + npcId + '\',\'tea\')" ' + btn.replace('p-3', 'bg-amber-900 p-3') + '>🍵 请吃茶（' + TUNE.TEA_COPPER + ' 铜钱 · ' + TUNE.TEA_MIN + ' 分钟 · 两情+' + TUNE.TEA_LOVE + ' 好感+' + TUNE.TEA_AFF + '）</button>' +
                '<button onclick="NpcBond.date(\'' + npcId + '\',\'moon\')" ' + btn.replace('p-3', 'bg-indigo-900 p-3') + '>🌙 同看月亮（夜里才行 · ' + TUNE.MOON_MIN + ' 分钟 · 两情+' + TUNE.MOON_LOVE + ' 好感+' + TUNE.MOON_AFF + '）</button>') +
            (isDao && love >= TUNE.PROPOSE_LOVE_AT && !proposeDone(npcId)
                ? '<button onclick="NpcBond.propose(\'' + npcId + '\')" ' + btn.replace('p-3', 'bg-pink-800 p-3') + '>💍 提亲（' + TUNE.PROPOSE_COST + ' 灵石婚宴 · 名分落定，此后可以谈生儿育女）</button>' : '') +
            '<button onclick="NpcBond.closePanel()" ' + btn.replace('p-3', 'bg-gray-700 p-3') + '>↩ 改日再说</button>';
        if (typeof window.showBuildingEffectDialog === 'function') {
            window.showBuildingEffectDialog('🌸 邀约 · ' + npc.name, html);
            return true;
        }
        return false;
    }

    function proposeDone(npcId) {
        try {
            var b = cd() && cd().bonds && cd().bonds[npcId];
            return !!(b && b.married);
        } catch (e) { return false; }
    }

    var REFUSALS = [
        'TA摇了摇头：「今日乏了，改日吧。」',
        'TA笑了笑，没接话——眼神却往别处飘了。',
        '「不巧，我还有事。」TA拱拱手，转身走了。',
        'TA想了想：「交情还没到那份上……抱歉。」'
    ];

    function date(npcId, kind) {
        var npc = npcById(npcId);
        if (!npc || npc.isDead) { say('那人早不在这儿了。', 'info'); return false; }
        if (!coLocated(npc)) { say('你与' + npc.name + '并不在一处。', 'warning'); return false; }
        var day = absDay();
        if (_dateLog[npcId] === day) { say('🌸 今日已邀过 ' + npc.name + ' 了——再邀就嫌你缠人了。', 'info'); return false; }
        var aff = Number(npc.relationship && npc.relationship.affection) || 0;
        if (aff < TUNE.DATE_AFF_AT) { say('🌸 交情还浅，邀约递不出去。', 'info'); return false; }
        kind = (kind === 'tea' || kind === 'moon') ? kind : 'walk';
        if (kind === 'tea') {
            var rPay = settle({ copper: -TUNE.TEA_COPPER }, '请吃茶');
            if (!rPay.ok) { say('🍵 摸遍口袋凑不出 ' + TUNE.TEA_COPPER + ' 铜的茶钱——邀约只好咽回去。', 'warning'); return false; }
        }
        if (kind === 'moon') {
            var h = null;
            try { if (window.timeSystem && window.timeSystem.gameTime && Number.isFinite(window.timeSystem.gameTime.currentHour)) h = window.timeSystem.gameTime.currentHour; } catch (eH) { console.warn('[静默失败] js/npcs/npc-bond.js · date：时辰没读出来，月亮按已升算', eH && eH.message); }
            if (h !== null && h >= 6 && h < 18) { say('🌙 日头还高——月亮没出来，晚些再邀吧。', 'info'); return false; }
        }
        _dateLog[npcId] = day;
        try { if (typeof window.closeBuildingDialog === 'function') window.closeBuildingDialog(); } catch (eC) { console.warn('[静默失败] js/npcs/npc-bond.js · date：邀约窗没收掉', eC && eC.message); }

        var isDao = false;
        try { isDao = !!(typeof npc.hasFlag === 'function' && npc.hasFlag('dao_companion')); } catch (eF2) { console.warn('[静默失败] js/npcs/npc-bond.js · date：道侣旗没读出来，按不是道侣算', eF2 && eF2.message); }
        var moodNow = Number(npc.state && npc.state.mood) || 50;
        var p = Math.max(TUNE.DATE_MIN, Math.min(TUNE.DATE_MAX,
            TUNE.DATE_BASE + aff * TUNE.DATE_AFF + skill('口才') * TUNE.DATE_SKILL
            + (moodNow >= 60 ? TUNE.DATE_MOOD_BONUS : 0) + (isDao ? TUNE.DATE_DAO_BONUS : 0)));
        if (Math.random() >= p) {
            npc.changeAffection(TUNE.DATE_FAIL_AFF);
            try { if (typeof npc.recordPlayerAction === 'function') npc.recordPlayerAction('date_refused', 'negative'); } catch (eR) { console.warn('[静默失败] js/npcs/npc-bond.js · date：这一笔没记进TA的记忆', eR && eR.message); }
            say('🌸 ' + npc.name + ' ' + REFUSALS[Math.floor(Math.random() * REFUSALS.length)] + '（好感' + TUNE.DATE_FAIL_AFF + '——邀约没递成，多少有点尴尬）', 'warning');
            refresh();
            return false;
        }
        var cfg = kind === 'moon' ? { min: TUNE.MOON_MIN, love: TUNE.MOON_LOVE, aff: TUNE.MOON_AFF, mood: TUNE.MOON_MOOD, what: '同看月亮' }
            : kind === 'tea' ? { min: TUNE.TEA_MIN, love: TUNE.TEA_LOVE, aff: TUNE.TEA_AFF, mood: TUNE.TEA_MOOD, what: '请吃茶' }
                : { min: TUNE.WALK_MIN, love: TUNE.WALK_LOVE, aff: TUNE.WALK_AFF, mood: TUNE.WALK_MOOD, what: '出去走走' };
        try { if (typeof npc.changeLove === 'function') npc.changeLove(cfg.love); } catch (eL) { console.warn('[静默失败] js/npcs/npc-bond.js · date：两情账没落上', eL && eL.message); }
        npc.changeAffection(cfg.aff);
        try { if (typeof npc.changeTrust === 'function') npc.changeTrust(1); } catch (eT) { console.warn('[静默失败] js/npcs/npc-bond.js · date：信任账没落上', eT && eT.message); }
        if (npc.state) npc.state.mood = Math.min(100, moodNow + cfg.mood);
        advance(cfg.min, '邀约·' + cfg.what);
        if (isDao) {
            try {
                var b = cd() && cd().bonds && cd().bonds[npcId];
                if (b) b.lastMetDay = day;
            } catch (eB) { console.warn('[静默失败] js/npcs/npc-bond.js · date：道侣名册的日子没描上', eB && eB.message); }
        }
        try { if (typeof npc.recordPlayerAction === 'function') npc.recordPlayerAction('date', 'positive'); } catch (eR2) { console.warn('[静默失败] js/npcs/npc-bond.js · date：这一笔没记进TA的记忆', eR2 && eR2.message); }
        var scene = kind === 'moon' ? '月色如水，两个人在檐下站了很久，谁都没说话——有些话不用说。'
            : kind === 'tea' ? '一壶粗茶喝到无味，话却没断过。TA笑起来的次数比你想象的多。'
                : '你们沿着街市慢慢走，从东头走到西头。TA忽然说：「这样走走，挺好。」';
        log('🌸 你约 ' + npc.name + ' ' + cfg.what + '。' + scene + '（两情+' + cfg.love + ' 好感+' + cfg.aff + ' 信任+1，耗时 ' + cfg.min + ' 分钟）', 'success');
        say('🌸 ' + scene + '（两情+' + cfg.love + '，好感+' + cfg.aff + '，信任+1）', 'success');
        refresh();
        return true;
    }

    function propose(npcId) {
        var npc = npcById(npcId);
        if (!npc || npc.isDead) { say('那人早不在这儿了。', 'info'); return false; }
        var isDao = false;
        try { isDao = !!(typeof npc.hasFlag === 'function' && npc.hasFlag('dao_companion')); } catch (eF3) { console.warn('[静默失败] js/npcs/npc-bond.js · propose：道侣旗没读出来', eF3 && eF3.message); }
        if (!isDao) { say('💍 你们还未结为道侣——提亲无从谈起。', 'info'); return false; }
        var love = Number(npc.relationship && npc.relationship.love) || 0;
        if (love < TUNE.PROPOSE_LOVE_AT) { say('💍 两情还不够深（' + love + '/' + TUNE.PROPOSE_LOVE_AT + '）——多陪陪TA，再谈名分。', 'info'); return false; }
        if (proposeDone(npcId)) { say('💍 名分早落定了——别重复摆酒。', 'info'); return false; }
        var r = settle({ spiritStones: -TUNE.PROPOSE_COST }, '提亲婚宴');
        if (!r.ok) { say('💍 婚宴要 ' + TUNE.PROPOSE_COST + ' 灵石——手头不凑手，喜事只好再等等。', 'warning'); return false; }
        try {
            var b = cd().bonds[npcId];
            b.married = absDay();
            b.level = Math.max(2, Number(b.level) || 1);
        } catch (eBd) { console.warn('[静默失败] js/npcs/npc-bond.js · propose：名册没写上去——婚宴照摆，名分补记', eBd && eBd.message); }
        try { if (typeof npc.changeLove === 'function') npc.changeLove(TUNE.PROPOSE_LOVE); } catch (eL2) { console.warn('[静默失败] js/npcs/npc-bond.js · propose：两情账没落上', eL2 && eL2.message); }
        npc.changeAffection(TUNE.PROPOSE_AFF);
        if (npc.state) npc.state.mood = Math.min(100, (Number(npc.state.mood) || 50) + TUNE.PROPOSE_MOOD);
        deed('good', '你摆下婚宴向道侣' + npc.name + '提亲——十里红妆，江湖都知道你们的名分了');
        advance(180, '提亲婚宴');
        try { if (typeof window.closeBuildingDialog === 'function') window.closeBuildingDialog(); } catch (eC2) { console.warn('[静默失败] js/npcs/npc-bond.js · propose：邀约窗没收掉', eC2 && eC2.message); }
        log('💍 三书六礼，婚宴摆开。' + npc.name + ' 红着脸受了你的礼——名分自此落定（道侣情分抬到 ' + (Math.max(2, Number((cd().bonds[npcId] || {}).level) || 1)) + ' 级）。' + (r.note ? '（' + r.note + '）' : ''), 'success');
        say('💍 提亲成了！' + npc.name + ' 与你名分落定——两情+' + TUNE.PROPOSE_LOVE + '，好感+' + TUNE.PROPOSE_AFF + '。（情分够深，此后可以谈生儿育女了）', 'success');
        refresh();
        return true;
    }

    // ============ ③ 打听某人 ============
    function askCandidates(aId) {
        var out = [];
        try {
            var a = npcById(aId);
            if (!a) return out;
            var all = (window.npcManager && typeof window.npcManager.getAllNPCs === 'function') ? (window.npcManager.getAllNPCs() || []) : [];
            for (var i = 0; i < all.length && out.length < 12; i++) {
                var b = all[i];
                if (!b || b.id === aId || b.isDead) continue;
                var known = (b.memory && b.memory.firstMet) || b.location === a.location || !!(a.npcRelationships && a.npcRelationships[b.id]);
                if (known) out.push(b);
            }
        } catch (e) { console.warn('[静默失败] js/npcs/npc-bond.js · askCandidates：名单没列出来', e && e.message); }
        return out;
    }

    function openAsk(npcId) {
        var a = npcById(npcId);
        if (!a || a.isDead) { say('那人早不在这儿了。', 'info'); return false; }
        var list = askCandidates(npcId);
        if (!list.length) { say('🔍 你想向 ' + a.name + ' 打听人——可这地界你们俩共同认得的人，一个也想不起来。', 'info'); return false; }
        var btn = 'class="w-full p-2 rounded mb-1 text-left text-sm text-gray-200 bg-gray-800 hover:bg-gray-700"';
        var html = '<p class="text-sm text-gray-400 mb-2">你压低声音问 ' + a.name + '：「跟您打听个人……」（茶钱 ' + TUNE.ASK_COPPER + ' 铜 · 每人每日一回）</p>' +
            list.map(function (b) {
                return '<button onclick="NpcBond.askAbout(\'' + safeId(npcId) + '\',\'' + safeId(b.id) + '\')" ' + btn + '>' +
                    (b.appearance && b.appearance.icon ? b.appearance.icon + ' ' : '👤 ') + b.name +
                    '<span class="text-xs text-gray-500 ml-2">' + (b.occupation || '未知') + '</span></button>';
            }).join('') +
            '<button onclick="NpcBond.closePanel()" class="w-full p-2 rounded mt-1 text-sm text-gray-400 bg-gray-700 hover:bg-gray-600">↩ 不问了</button>';
        if (typeof window.showBuildingEffectDialog === 'function') {
            window.showBuildingEffectDialog('🔍 向 ' + a.name + ' 打听', html);
            return true;
        }
        return false;
    }

    function askAbout(aId, bId) {
        var a = npcById(aId), b = npcById(bId);
        if (!a || a.isDead) { say('那人早不在这儿了。', 'info'); return false; }
        var day = absDay();
        if (_askLog[aId] === day) { say('🔍 ' + a.name + ' 摆手：「今儿话够多了，茶钱都替你省了吧。」', 'info'); return false; }
        var r = settle({ copper: -TUNE.ASK_COPPER }, '打听·茶钱');
        if (!r.ok) { say('🔍 连 ' + TUNE.ASK_COPPER + ' 铜茶钱都凑不出——' + a.name + ' 笑而不语。', 'warning'); return false; }
        _askLog[aId] = day;
        advance(TUNE.ASK_MIN, '打听');
        try { if (typeof window.closeBuildingDialog === 'function') window.closeBuildingDialog(); } catch (eC) { console.warn('[静默失败] js/npcs/npc-bond.js · askAbout：打听窗没收掉', eC && eC.message); }
        var bName = b ? b.name : bId;
        if (!b) { say('🔍 ' + a.name + ' 想了想：「' + bName + '？没听说过这位。」', 'info'); return false; }
        var parts = [];
        var loc = b.location && b.location !== 'unknown' ? b.location : '';
        if (loc) parts.push('「' + bName + ' 啊——前日还有人见TA在「' + loc + '」一带走动。」');
        var rel1 = (a.npcRelationships && a.npcRelationships[bId]) || null;
        var rel2 = (b.npcRelationships && b.npcRelationships[aId]) || null;
        if (rel1 && rel1.relation) parts.push('「说起TA和我——' + rel1.relation + '。（交情 ' + (Number(rel1.strength) || 0) + '/100）' + ((Number(rel1.strength) || 0) >= 60 ? '有什么话，我可以替你们递。」' : '不过各忙各的，走动少了。」'));
        else if (rel2 && rel2.relation) parts.push('「我们？' + rel2.relation + '罢了，点头之交。」');
        else parts.push('「我和TA素无往来，只是江湖上见过几面。」');
        var deep = skill('口才') >= TUNE.ASK_DEEP_SKILL || (Number(a.relationship && a.relationship.trust) || 0) >= TUNE.ASK_DEEP_TRUST;
        if (deep && b.background && b.background.goal) parts.push(a.name + ' 凑近了些，压低声音：「跟你透个底——TA近来一心扑在「' + b.background.goal + '」上。这话别往外传。」');
        else if (!deep) parts.push('（再深的话，' + a.name + ' 就摇头了——口才不够，或TA还没信你到肯卖朋友的份上。）');
        log('🔍 你向 ' + a.name + ' 打听 ' + bName + '。' + parts.join(''), 'info');
        say('🔍 ' + parts.join(''), 'success');
        refresh();
        return true;
    }

    // ============ ④ 请客吃饭 ============
    function openTreat() {
        var ct = city();
        if (!eateryOk(ct)) { say('🍶 这地界没有酒楼馆子。', 'info'); return false; }
        var loc = (cd() && cd().location) || ct;
        var list = [];
        try {
            var all = (window.npcManager && typeof window.npcManager.getAllNPCs === 'function') ? (window.npcManager.getAllNPCs() || []) : [];
            for (var i = 0; i < all.length && list.length < 10; i++) {
                var n = all[i];
                if (!n || n.isDead) continue;
                if (pkCity(n.location) === pkCity(loc) || pkCity(n.homeLocation) === pkCity(loc) || n.isFollowing) list.push(n);
            }
        } catch (e) { console.warn('[静默失败] js/npcs/npc-bond.js · openTreat：同城名单没列出来', e && e.message); }
        if (!list.length) { say('🍶 这城里没有你叫得动的人——先混个脸熟再来请客。', 'info'); return false; }
        var btn = 'class="w-full p-2 rounded mb-1 text-left text-sm text-gray-200 bg-gray-800 hover:bg-gray-700 flex items-center gap-2"';
        var html = '<p class="text-sm text-gray-400 mb-2">跑堂的搭着巾子问：「几位？」——请谁同席？（家常 ' + TUNE.TREAT_HOME + ' 铜 / 招牌 ' + TUNE.TREAT_SPEC + ' 铜 · 每人每日一次）</p>' +
            list.map(function (n) {
                var aff = Number(n.relationship && n.relationship.affection) || 0;
                var done = _treatLog[n.id] === absDay();
                return '<div class="flex items-center gap-1 mb-1"><span class="text-sm text-gray-200 w-24 truncate">' + (n.appearance && n.appearance.icon ? n.appearance.icon + ' ' : '') + n.name + '</span>' +
                    '<span class="text-[11px] text-gray-500 w-14">好感' + aff + '</span>' +
                    (done ? '<span class="text-[11px] text-gray-500 ml-auto">今日已请过</span>' :
                        '<button onclick="NpcBond.treat(\'' + safeId(n.id) + '\',\'home\')" ' + btn.replace('w-full ', 'flex-1 ') + '>🍚 家常</button>' +
                        '<button onclick="NpcBond.treat(\'' + safeId(n.id) + '\',\'special\')" ' + btn.replace('w-full ', 'flex-1 ') + '>🥘 招牌</button>') +
                    '</div>';
            }).join('') +
            '<button onclick="NpcBond.closePanel()" class="w-full p-2 rounded mt-1 text-sm text-gray-400 bg-gray-700 hover:bg-gray-600">↩ 还是自己吃</button>';
        if (typeof window.showBuildingEffectDialog === 'function') {
            window.showBuildingEffectDialog('🍶 邀人同席 · ' + ct, html);
            return true;
        }
        return false;
    }

    function eateryOk(ct) {
        try {
            if (window.CityEatery && typeof window.CityEatery.eateryOk === 'function') return window.CityEatery.eateryOk(ct || city());
            var d = window.locationSystem && window.locationSystem.getCityData && window.locationSystem.getCityData(ct || city());
            return !!(d && d.buildings && d.buildings.indexOf('tavern') >= 0);
        } catch (e) { console.warn('[静默失败] js/npcs/npc-bond.js · eateryOk：馆子有没有没问成，按没有算', e && e.message); return false; }
    }

    function treatsFood(npc) {
        try {
            var liked = (npc.preferences && npc.preferences.likedItems) || [];
            for (var i = 0; i < liked.length; i++) {
                var e = liked[i];
                var s = typeof e === 'string' ? e : String((e && (e.category || e.name)) || '');
                if (s.indexOf('食') >= 0 || s.indexOf('丹') >= 0 || s.indexOf('酒') >= 0 || s.indexOf('茶') >= 0) return true;
            }
        } catch (e) { console.warn('[静默失败] js/npcs/npc-bond.js · treatsFood：喜好账没翻出来，按不挑食算', e && e.message); }
        return false;
    }

    function treat(npcId, kind) {
        var npc = npcById(npcId);
        if (!npc || npc.isDead) { say('那人早不在这儿了。', 'info'); return false; }
        if (!coLocated(npc)) { say('你与' + npc.name + '并不在一处——请客得请到桌上。', 'warning'); return false; }
        if (window.currentBattle) { say('打着架呢，饭后再说。', 'warning'); return false; }
        if (!eateryOk()) { say('🍶 这地界没有酒楼馆子。', 'info'); return false; }
        var day = absDay();
        if (_treatLog[npcId] === day) { say('🍶 今日已请过 ' + npc.name + ' 了——再请就成灌了。', 'info'); return false; }
        try {
            if (window.satietySystem && typeof window.satietySystem.canEat === 'function' && !window.satietySystem.canEat()) {
                say('🍶 你撑得一口都塞不下了——请客也得自己动筷子，改日再约。', 'info');
                return false;
            }
        } catch (eS) { console.warn('[静默失败] js/npcs/npc-bond.js · treat：饱食度没问成，按吃得下算', eS && eS.message); }
        kind = kind === 'special' ? 'special' : 'home';
        var cost = kind === 'special' ? TUNE.TREAT_SPEC : TUNE.TREAT_HOME;
        var r = settle({ copper: -cost, mood: TUNE.TREAT_MOOD_SELF, energy: TUNE.TREAT_ENERGY }, '请客吃饭');
        if (!r.ok) { say('🍶 一桌 ' + cost + ' 铜的席面都付不起——跑堂的笑着把菜单收了。', 'warning'); return false; }
        _treatLog[npcId] = day;
        try { if (window.satietySystem && typeof window.satietySystem.eat === 'function') window.satietySystem.eat(TUNE.TREAT_SATIETY); } catch (eS2) { console.warn('[静默失败] js/npcs/npc-bond.js · treat：这顿饭的饱食没落账', eS2 && eS2.message); }
        var liked = treatsFood(npc);
        var affGain = liked ? TUNE.TREAT_AFF_LIKED : TUNE.TREAT_AFF;
        npc.changeAffection(affGain);
        try { if (typeof npc.changeTrust === 'function') npc.changeTrust(1); } catch (eT2) { console.warn('[静默失败] js/npcs/npc-bond.js · treat：信任账没落上', eT2 && eT2.message); }
        if (npc.state) npc.state.mood = Math.min(100, (Number(npc.state.mood) || 50) + TUNE.TREAT_MOOD);
        advance(TUNE.TREAT_MIN, '请客吃饭');
        try { if (typeof npc.recordPlayerAction === 'function') npc.recordPlayerAction('treat_meal', 'positive'); } catch (eR) { console.warn('[静默失败] js/npcs/npc-bond.js · treat：这一笔没记进TA的记忆', eR && eR.message); }
        try { if (typeof window.closeBuildingDialog === 'function') window.closeBuildingDialog(); } catch (eC) { console.warn('[静默失败] js/npcs/npc-bond.js · treat：同席窗没收掉', eC && eC.message); }
        var dish = '一菜一汤一碗饭';
        if (kind === 'special') {
            try { if (window.CityEatery && typeof window.CityEatery.specialDish === 'function') dish = '「' + window.CityEatery.specialDish(city()).name + '」'; } catch (eD) { console.warn('[静默失败] js/npcs/npc-bond.js · treat：招牌菜名没问到，按老店招牌上', eD && eD.message); }
        }
        log('🍶 你请 ' + npc.name + ' 在酒楼同席，上了' + dish + '。' + (liked ? '——正合TA的口味，TA吃得眉眼都弯了。' : 'TA吃得很开心，连道了三声谢。') + '（好感+' + affGain + ' 信任+1，' + cost + ' 铜）', 'success');
        // v27.13：①-新增-4 辟谷赴宴豁免——请客的人情照旧、属性照吃（饱食闸对全辟不设，见 satiety.js canEat）；
        //   全辟走「陪坐不进食」文案，半辟一句轻话；账一分不动，只把仙凡之别说出口。
        var _fastLine = '';
        try {
            if (window.satietySystem && typeof window.satietySystem.fastingTier === 'function') {
                var _ft = window.satietySystem.fastingTier();
                if (_ft >= 2) _fastLine = '你举杯陪坐，箸没动几回——肚子的需求没了，人情的规矩还在。';
                else if (_ft === 1) _fastLine = '你陪着吃了小半桌——辟谷之人，饭量比情面小。';
            }
        } catch (eFt) { console.warn('[静默失败] js/npcs/npc-bond.js · treat：辟谷档没读出来，同席照旧', eFt && eFt.message); }
        say('🍶 ' + npc.name + (liked ? ' 一上桌就认出了爱吃的——眉眼都弯了。（好感+' + affGain + '，信任+1）' : ' 吃得很开心，连道了三声谢。（好感+' + affGain + '，信任+1）') + (_fastLine ? ' ' + _fastLine : ''), 'success');
        refresh();
        return true;
    }

    // ============ ⑤ 雇镖护货（押货跑商的明面） ============
    function escortWage(npc) {
        return TUNE.ESCORT_WAGE_BASE + tierOf(npc.combat && npc.combat.realm) * TUNE.ESCORT_WAGE_TIER;
    }

    function openEscortHire() {
        var loc = (cd() && cd().location) || city();
        if (!loc) { say('🛡️ 你身在野外——镖师不上野地接活。', 'info'); return false; }
        if (escortActive()) { say('🛡️ 镖师「' + _st.escort.name + '」还在雇期中——先辞退，再换人。', 'info'); return false; }
        var list = [];
        try {
            var all = (window.npcManager && typeof window.npcManager.getAllNPCs === 'function') ? (window.npcManager.getAllNPCs() || []) : [];
            for (var i = 0; i < all.length && list.length < 10; i++) {
                var n = all[i];
                if (!n || n.isDead || n.isFollowing || !n.combat) continue;
                if ((Number(n.combat.level) || 0) < TUNE.ESCORT_LEVEL_AT) continue;
                if ((Number(n.relationship && n.relationship.affection) || 0) < TUNE.ESCORT_AFF_AT) continue;
                if (pkCity(n.location) === pkCity(loc) || pkCity(n.homeLocation) === pkCity(loc)) list.push(n);
            }
        } catch (e) { console.warn('[静默失败] js/npcs/npc-bond.js · openEscortHire：镖师候选没列出来', e && e.message); }
        if (!list.length) { say('🛡️ 这城里没有雇得动的镖师——要么身手不够，要么交情不到（需好感 ' + TUNE.ESCORT_AFF_AT + '、等级 ' + TUNE.ESCORT_LEVEL_AT + '）。', 'info'); return false; }
        var btn = 'class="w-full p-2 rounded mb-1 text-left text-sm text-gray-200 bg-gray-800 hover:bg-gray-700"';
        var html = '<p class="text-sm text-gray-400 mb-2">镖行的人说：雇个镖师随货，截道的风声让一截。日薪按身手算，一次雇 ' + TUNE.ESCORT_DAYS + ' 天（押在头里）。</p>' +
            list.map(function (n) {
                var w = escortWage(n);
                return '<button onclick="NpcBond.hire(\'' + safeId(n.id) + '\')" ' + btn + '>' +
                    (n.appearance && n.appearance.icon ? n.appearance.icon + ' ' : '⚔️ ') + n.name +
                    '<span class="text-xs text-gray-500 ml-2">' + (n.combat.realm || '凡人') + ' · 好感' + (Number(n.relationship && n.relationship.affection) || 0) + '</span>' +
                    '<span class="text-xs text-amber-300 ml-auto float-right">日薪 ' + w + ' 灵石 × ' + TUNE.ESCORT_DAYS + ' 日 = ' + (w * TUNE.ESCORT_DAYS) + '</span></button>';
            }).join('') +
            '<p class="text-[11px] text-gray-500 mt-1">雇得太抠、交情太浅的，遇上真章可能撂挑子。</p>' +
            '<button onclick="NpcBond.closePanel()" class="w-full p-2 rounded mt-1 text-sm text-gray-400 bg-gray-700 hover:bg-gray-600">↩ 不雇了</button>';
        if (typeof window.showBuildingEffectDialog === 'function') {
            window.showBuildingEffectDialog('🛡️ 雇镖师 · ' + loc, html);
            return true;
        }
        return false;
    }

    function hire(npcId) {
        var npc = npcById(npcId);
        if (!npc || npc.isDead) { say('那人早不在这儿了。', 'info'); return false; }
        if (escortActive()) { say('🛡️ 已有镖师在雇期。', 'info'); return false; }
        var w = escortWage(npc);
        var cost = w * TUNE.ESCORT_DAYS;
        var r = settle({ spiritStones: -cost }, '雇镖');
        if (!r.ok) { say('🛡️ 雇金 ' + cost + ' 灵石付不起——镖师笑了笑，没接这单。', 'warning'); return false; }
        _st.escort = { npcId: npcId, name: npc.name, untilDay: absDay() + TUNE.ESCORT_DAYS, wage: w };
        try { if (typeof window.closeBuildingDialog === 'function') window.closeBuildingDialog(); } catch (eC) { console.warn('[静默失败] js/npcs/npc-bond.js · hire：雇镖窗没收掉', eC && eC.message); }
        log('🛡️ 你雇下「' + npc.name + '」随货护镖，工钱 ' + cost + ' 灵石押在头里（' + TUNE.ESCORT_DAYS + ' 天）。TA抱拳：「货在人在。」', 'success');
        say('🛡️ 「' + npc.name + '」接了这单——' + TUNE.ESCORT_DAYS + ' 日内押货，截道的风声让 ' + Math.round(TUNE.ESCORT_DISCOUNT * 100) + ' 个百分点。', 'success');
        refresh();
        return true;
    }

    function escortActive() {
        if (!_st.escort) return null;
        if ((Number(_st.escort.untilDay) || 0) < absDay()) { _st.escort = null; return null; }
        return _st.escort;
    }
    function dismissEscort() {
        if (!escortActive()) { say('🛡️ 眼下没有雇着的镖师。', 'info'); return false; }
        var name = _st.escort.name;
        _st.escort = null;
        log('🛡️ 你辞了镖师「' + name + '」。工钱押在头里，不退。', 'info');
        say('🛡️ 「' + name + '」数了数日子，抱拳走了——工钱押在头里，不退。', 'info');
        return true;
    }
    // caravan-trade 守卫接线：截道风声让一截
    function escortChanceMod() { return escortActive() ? TUNE.ESCORT_DISCOUNT : 0; }
    // caravan-trade 守卫接线：输了货损减半
    function escortPlunderMod() { return escortActive() ? TUNE.ESCORT_PLUNDER_MOD : 1; }
    // caravan-trade 守卫接线：截道真发生时的三岔——镖师断后喝退 / 撂挑子 / 照常打
    function escortAmbushGuard() {
        var e = escortActive();
        if (!e) return null;
        var npc = npcById(e.npcId);
        var aff = npc ? (Number(npc.relationship && npc.relationship.affection) || 0) : 0;
        if (npc && aff < TUNE.ESCORT_FLAKY_AFF && Math.random() < TUNE.ESCORT_FLAKY_P) {
            _st.escort = null;
            log('🛡️ 响马刚露头，「' + e.name + '」把镖杆一撂：「这点工钱，不值这条命！」——临阵跑了。（镖师没了，截道照常）', 'warning');
            say('🛡️ 「' + e.name + '」撂了挑子临阵跑了——雇得太抠、交情太浅的镖，靠不住。', 'error');
            return 'fled';
        }
        if (Math.random() < TUNE.ESCORT_SAVE_P) {
            try { if (npc && typeof npc.changeAffection === 'function') npc.changeAffection(1); } catch (eA) { console.warn('[静默失败] js/npcs/npc-bond.js · escortAmbushGuard：并肩的一仗没记进交情', eA && eA.message); }
            log('🛡️ 镖师「' + e.name + '」抽刀横在道中，报了自己的名号——响马们掂量片刻，唿哨一声散了。（这一仗没打起来）', 'success');
            say('🛡️ 「' + e.name + '」横刀断后，响马认了怂，唿哨而散——货担虚惊一场。（好感+1）', 'success');
            return 'saved';
        }
        return null;
    }
    // 押货行情板上的镖师一栏（caravan-trade 守卫接线）
    function escortLineHtml() {
        try {
            var e = escortActive();
            if (e) {
                var left = Math.max(0, (Number(e.untilDay) || 0) - absDay());
                return '<h4 class="font-bold text-amber-400 text-sm mb-1 mt-3">🛡️ 镖师随行</h4>' +
                    '<div class="bg-gray-700/30 p-2 rounded flex justify-between items-center mb-2"><span class="text-sm">「' + e.name + '」随货护镖，还有 ' + left + ' 天（日薪 ' + e.wage + ' 灵石已付）</span>' +
                    '<button onclick="NpcBond.dismissEscort(); CaravanTrade.reopen();" class="bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded text-xs">辞退</button></div>';
            }
            return '<h4 class="font-bold text-amber-400 text-sm mb-1 mt-3">🛡️ 护货</h4>' +
                '<div class="bg-gray-700/30 p-2 rounded flex justify-between items-center mb-2"><span class="text-sm text-gray-400">肩上没镖师——雇一位，截道的风声让 ' + Math.round(TUNE.ESCORT_DISCOUNT * 100) + ' 个百分点。</span>' +
                '<button onclick="NpcBond.openEscortHire()" class="bg-amber-700 hover:bg-amber-600 px-2 py-1 rounded text-xs">雇镖师</button></div>';
        } catch (e2) { console.warn('[静默失败] js/npcs/npc-bond.js · escortLineHtml：镖师一栏没画上', e2 && e2.message); return ''; }
    }

    // ============ ⑥ 占卜（卦师口条全部吃真账，绝不编瞎话） ============
    // 凶兆（通缉/仇家）恒排最前——保命的爻辞不许被轮转轮掉；寻常爻辞（货担/行情/缘分/气运）按日轮转出卦口。
    function fortuneHints(n) {
        n = Math.max(1, Math.min(4, Math.floor(Number(n) || 1)));
        var urgent = [], pool = [];
        try {
            if (window.NpcCrime && typeof window.NpcCrime.wanted === 'function' && window.NpcCrime.wanted()) {
                var bn = (typeof window.NpcCrime.bounty === 'function') ? window.NpcCrime.bounty() : 0;
                urgent.push('🩸 大凶之兆：官府的悬赏牌上有你的脸（赏金 ' + bn + ' 灵石）——道上有人磨刀等你，进城过夜小心床底。');
            } else if (window.NpcCrime && typeof window.NpcCrime.heat === 'function' && window.NpcCrime.heat() > 0) {
                urgent.push('🕯️ 卦象蒙着一层灰：你近来做的事，街面上有人记着（民愤热度 ' + window.NpcCrime.heat() + '）——再往前一步就是画影通缉。');
            }
        } catch (eW) { console.warn('[静默失败] js/npcs/npc-bond.js · fortuneHints：通缉账没读出来，这一爻空着', eW && eW.message); }
        try {
            if (typeof window.getRivals === 'function') {
                var rivals = window.getRivals() || [];
                if (rivals.length) urgent.push('⚔️ 你命宫犯小人：与你有死仇的，眼下数得出 ' + rivals.length + ' 位——出城押货、走夜路，背后留只眼。');
            }
        } catch (eR) { console.warn('[静默失败] js/npcs/npc-bond.js · fortuneHints：仇家名单没调出来，这一爻空着', eR && eR.message); }        try {
            if (window.CaravanTrade && typeof window.CaravanTrade.cargo === 'function' && window.CaravanTrade.cargo().length) {
                pool.push('📦 财帛宫带煞：你肩上的货值约 ' + window.CaravanTrade.cargoValue() + ' 灵石——货越贵越招风，路上风声正紧。');
            }
        } catch (eC) { console.warn('[静默失败] js/npcs/npc-bond.js · fortuneHints：货担账没读出来，这一爻空着', eC && eC.message); }
        try {
            var MD = window.MarketDynamic;
            if (MD && typeof MD.priceMul === 'function' && MD.CITIES && MD.CATEGORIES) {
                var best = null, low = null;
                for (var i = 0; i < MD.CITIES.length; i++) {
                    for (var j = 0; j < MD.CATEGORIES.length; j++) {
                        var m = Number(MD.priceMul(MD.CITIES[i], MD.CATEGORIES[j])) || 1;
                        if (!best || m > best.mul) best = { region: MD.CITIES[i], cat: MD.CATEGORIES[j], mul: m };
                        if (!low || m < low.mul) low = { region: MD.CITIES[i], cat: MD.CATEGORIES[j], mul: m };
                    }
                }
                if (best && best.mul > 1.02) pool.push('💰 ' + best.region + '的' + best.cat + '正俏（行市 ' + (Math.round(best.mul * 10) / 10) + ' 倍）——贩一趟，卦金就回来了。');
                if (low && low.mul < 0.98) pool.push('🧺 ' + low.region + '的' + low.cat + '贱到骨头（行市 ' + (Math.round(low.mul * 10) / 10) + ' 倍）——低买的时机，卦里写得明白。');
            }
        } catch (eMD) { console.warn('[静默失败] js/npcs/npc-bond.js · fortuneHints：行情账没读出来，这一爻空着', eMD && eMD.message); }
        try {
            if (window.BeggarAlms && typeof window.BeggarAlms.goodwill === 'function' && window.BeggarAlms.goodwill() >= 10) {
                pool.push('🥣 街面有贵人：丐帮的耳目认你的情——有人盯你家的梢，道上会提前递话。');
            }
        } catch (eG) { console.warn('[静默失败] js/npcs/npc-bond.js · fortuneHints：丐帮缘分没读出来，这一爻空着', eG && eG.message); }
        try {
            var luck = (typeof window.getLuck === 'function') ? Number(window.getLuck()) : 50;
            if (luck >= 70) pool.push('🌟 紫气东来（气运 ' + luck + '）：宜远行、宜进取、宜赌一把大的。');
            else if (luck <= 30) pool.push('🌧️ 时运低迷（气运 ' + luck + '）：宜守不宜攻——破财、动刀、走夜路，都缓一缓。');
            else pool.push('☯️ 运势平平（气运 ' + luck + '）：祸福无门，惟人自召——卦到这儿，剩下的看你自己。');
        } catch (eL) { console.warn('[静默失败] js/npcs/npc-bond.js · fortuneHints：气运没读出来，这一爻空着', eL && eL.message); }
        // 凶兆恒在最前；寻常爻辞按日轮转出卦口（同日同卦，不靠掷骰说谎），不足补位
        var out = urgent.slice(0, n);
        if (out.length < n) {
            if (!pool.length) pool.push('☯️ 卦象平平——你近来无事缠身，无风无浪。');
            var seed = seedOf('fortune_' + absDay());
            for (var k = 0; k < pool.length && out.length < n; k++) {
                var pick = pool[(seed + k * 3) % pool.length];
                if (out.indexOf(pick) < 0) out.push(pick);
            }
            for (var q = 0; q < pool.length && out.length < n; q++) { if (out.indexOf(pool[q]) < 0) out.push(pool[q]); }
        }
        return out;
    }

    function divineFull(npcId) {
        var npc = npcById(npcId);
        if (!npc || npc.isDead) { say('那人早不在这儿了。', 'info'); return false; }
        if (!coLocated(npc)) { say('你与' + npc.name + '并不在一处——卦要当面求。', 'warning'); return false; }
        if (window.actionGate && typeof window.actionGate.cooled === 'function' && window.actionGate.cooled('divine_full', 1)) {
            say('🔮 今日已起过一卦了——天机不可日泄两回，明日再来。', 'info');
            return false;
        }
        var r = settle({ spiritStones: -TUNE.DIVINE_COST, mood: 2 }, '求卦');
        if (!r.ok) {
            say('🔮 香金 ' + TUNE.DIVINE_COST + ' 灵石——' + npc.name + ' 指了指卦摊上的木牌，没有通融的意思。', 'warning');
            return false;
        }
        // 香金落袋才落闸——付不起卦金的人，明日照样来得
        try { if (window.actionGate && typeof window.actionGate.mark === 'function') window.actionGate.mark('divine_full'); } catch (eG2) { console.warn('[静默失败] js/npcs/npc-bond.js · divineFull：每日一卦的闸没落上', eG2 && eG2.message); }
        advance(TUNE.DIVINE_MIN, '求卦');
        var hints = fortuneHints(TUNE.DIVINE_HINTS);
        var html = '<p class="text-sm text-gray-400 mb-2">' + npc.name + ' 净了手，焚起一炷香，铜钱落定——卦辞如下（句句是真账，不是宽心话）：</p>' +
            hints.map(function (h) { return '<p class="text-sm text-gray-200 bg-gray-900/60 rounded p-2 mb-2">' + h + '</p>'; }).join('') +
            '<button onclick="NpcBond.closePanel()" class="w-full p-2 rounded mt-1 text-sm text-gray-400 bg-gray-700 hover:bg-gray-600">收起卦辞</button>';
        try {
            if (typeof window.showBuildingEffectDialog === 'function') window.showBuildingEffectDialog('🔮 ' + npc.name + ' 的卦', html);
        } catch (eM) { console.warn('[静默失败] js/npcs/npc-bond.js · divineFull：卦窗没开成，卦辞落进日志', eM && eM.message); }
        log('🔮 你请 ' + npc.name + ' 起了一卦（香金 ' + TUNE.DIVINE_COST + ' 灵石）：' + hints.join(''), 'info');
        refresh();
        return true;
    }

    // ============ ⑦ 托付秘密（trust 轨与心底秘密焊在一起） ============
    function entrustEligible(npc) {
        try {
            if (!npc || npc.isDead) return false;
            if (npc.secrets && npc.secrets.bg_heart) return false;
            var trust = Number(npc.relationship && npc.relationship.trust) || 0;
            var aff = Number(npc.relationship && npc.relationship.affection) || 0;
            return trust >= TUNE.ENTRUST_TRUST && aff >= TUNE.ENTRUST_AFF && !!(npc.background && npc.background.secret);
        } catch (e) { return false; }
    }

    function entrust(npcId) {
        var npc = npcById(npcId);
        if (!entrustEligible(npc)) { say('💭 时机还没到——TA欲言又止，终究还是把话咽了回去。', 'info'); return false; }
        if (!coLocated(npc)) { say('你与' + npc.name + '并不在一处。', 'warning'); return false; }
        npc.secrets = npc.secrets || {};
        npc.secrets.bg_heart = {
            id: 'bg_heart',
            title: '心底的秘密',
            content: npc.background.secret,
            desc: 'TA自己托付给你的——不是探来的，不是逼来的',
            type: 'personal',
            unlocked: true
        };
        try { if (typeof npc.changeTrust === 'function') npc.changeTrust(TUNE.ENTRUST_TRUST_GAIN); } catch (eT3) { console.warn('[静默失败] js/npcs/npc-bond.js · entrust：信任账没落上', eT3 && eT3.message); }
        npc.changeAffection(TUNE.ENTRUST_AFF_GAIN);
        try { if (typeof npc.recordPlayerAction === 'function') npc.recordPlayerAction('entrust_secret', 'positive'); } catch (eR3) { console.warn('[静默失败] js/npcs/npc-bond.js · entrust：这一笔没记进TA的记忆', eR3 && eR3.message); }
        advance(30, '听TA说心底话');
        log('💭 ' + npc.name + ' 给你斟了盏茶，半晌，忽然开口——把压在心底多年的事原原本本说了：「' + npc.background.secret + '」说完TA长出一口气：「这事我谁都没说过。如今你知道了……别负我。」（信任+' + TUNE.ENTRUST_TRUST_GAIN + ' 好感+' + TUNE.ENTRUST_AFF_GAIN + '）', 'success');
        say('💭 ' + npc.name + ' 把心底的秘密托付给了你：「这事我谁都没说过。」（信任+' + TUNE.ENTRUST_TRUST_GAIN + '，好感+' + TUNE.ENTRUST_AFF_GAIN + '——🃏 筹码面板里，这条秘密从此听你调用）', 'success');
        refresh();
        return true;
    }

    // ============ ⑧ 拜师按钮（有师承资格的人，面板上就该有门） ============
    function findMasterSect(npcId) {
        try {
            var ds = window.discipleState;
            if (ds && (ds.isInSect || ds._masterId)) return null;   // 已有门户/师傅的人不再递这个按钮
            var D = window.SECT_DEEP_DATA || {};
            for (var sn in D) {
                var ms = D[sn] && D[sn].masters;
                if (!Array.isArray(ms)) continue;
                for (var i = 0; i < ms.length; i++) {
                    if (ms[i] && ms[i].id === npcId && ms[i].acceptStudent) return { sect: sn, master: ms[i] };
                }
            }
        } catch (e) { console.warn('[静默失败] js/npcs/npc-bond.js · findMasterSect：师傅名册没翻出来', e && e.message); }
        return null;
    }

    // ============ 面板按钮（npc-system.js 对话窗守卫接线） ============
    function buildNpcBondButtons(npc, npcId) {
        try {
            if (!npc || npc.isDead) return '';
            var sid = safeId(npcId);
            var rows = [];
            var rec = pendingBorrow(npcId);
            if (rec) {
                var left = borrowDaysLeft(rec);
                rows.push('<button onclick="NpcBond.returnItem(\'' + sid + '\')" class="w-full mt-1 flex items-center gap-2 bg-amber-900/50 hover:bg-amber-800/50 border border-amber-700/50 px-3 py-2 rounded text-sm text-amber-200 transition-colors"><span>📦 归还「' + (rec.itemName || '借物') + '」</span><span class="text-xs text-amber-300/70">' + (rec.overdue ? '已逾期——快还！' : (left > 0 ? '还剩 ' + left + ' 日到期' : '今日到期')) + '</span></button>');
            }
            // ===== v27.16：⑦破产者的体面——钱契两颗钮（借/还）+ 穷态可见 =====
            var aff = Number(npc.relationship && npc.relationship.affection) || 0;
            var moneyRec = null, purseNow = null;
            try {
                var _recs16 = (window.NPCBorrowService && window.NPCBorrowService.getRecords) ? window.NPCBorrowService.getRecords() : [];
                moneyRec = _recs16.find(function (r) { return r && r.npcId === npcId && r.kind === 'money' && !r.returned && !r.deadbeated; }) || null;
                purseNow = (window.NPCLife && window.NPCLife.ledger && typeof window.NPCLife.ledger.purse === 'function') ? window.NPCLife.ledger.purse(npcId) : null;
            } catch (eMr16) {}
            if (moneyRec) {
                var owe16 = (moneyRec.amount || 0) + (moneyRec.overdue ? Math.ceil((moneyRec.amount || 0) * 0.1) : 0);
                rows.push('<button onclick="NpcBond.returnMoney(\'' + sid + '\')" class="w-full mt-1 flex items-center gap-2 bg-emerald-900/50 hover:bg-emerald-800/50 border border-emerald-700/50 px-3 py-2 rounded text-sm text-emerald-200 transition-colors"><span>💰 还钱 ' + owe16 + ' 灵石' + (moneyRec.overdue ? '（含一成辛苦钱）' : '') + '</span><span class="text-xs text-emerald-300/70">' + (moneyRec.collected ? 'TA 的兄弟已经上过门了' : (moneyRec.overdue ? '已逾期——七日后有人上门' : '说好的日子还没到')) + '</span></button>');
            } else if (aff >= 60 && purseNow !== null) {
                if (purseNow < 10) {
                    rows.push('<div class="w-full mt-1 px-3 py-2 rounded bg-slate-800/60 border border-slate-700/50 text-xs text-slate-400 text-left">🙇 TA 眼下手头紧——' + (npc.gender === '女' ? '她当掉了嫁妆银镯，铺子里也赊着账' : '他当掉了随身的旧物，铺子里也赊着账') + '。等 TA 的日子缓过来，再开口借钱不迟。</div>');
                } else {
                    var maxL16 = Math.min(Math.floor(purseNow), 10 + Math.floor(aff / 10));
                    rows.push('<button onclick="NpcBond.borrowMoney(\'' + sid + '\')" class="w-full mt-1 flex items-center gap-2 bg-amber-900/40 hover:bg-amber-800/40 border border-amber-800/50 px-3 py-2 rounded text-sm text-amber-100 transition-colors"><span>🤲 借点灵石周转（至多 ' + maxL16 + '）</span><span class="text-xs text-amber-300/70">从 TA 的真钱包里出——按时还，TA 的日子不受影响</span></button>');
                }
            }
            if (aff >= TUNE.DATE_AFF_AT) {
                rows.push('<button onclick="NpcBond.openDate(\'' + sid + '\')" class="w-full mt-1 flex items-center gap-2 bg-rose-900/40 hover:bg-rose-800/40 border border-rose-800/50 px-3 py-2 rounded text-sm text-rose-200 transition-colors"><span>🌸 邀约</span><span class="text-xs text-rose-300/70">请TA出门走走——两情与好感同涨</span></button>');
            }
            rows.push('<button onclick="NpcBond.openAsk(\'' + sid + '\')" class="w-full mt-1 flex items-center gap-2 bg-sky-900/40 hover:bg-sky-800/40 border border-sky-800/50 px-3 py-2 rounded text-sm text-sky-200 transition-colors"><span>🔍 打听某人</span><span class="text-xs text-sky-300/70">向TA打听你认得的人——人在哪、什么交情</span></button>');
            if (npc.occupation === '隐士' || npc.occupation === '道士') {
                rows.push('<button onclick="NpcBond.divineFull(\'' + sid + '\')" class="w-full mt-1 flex items-center gap-2 bg-purple-900/40 hover:bg-purple-800/40 border border-purple-800/50 px-3 py-2 rounded text-sm text-purple-200 transition-colors"><span>🔮 求一卦</span><span class="text-xs text-purple-300/70">香金 ' + TUNE.DIVINE_COST + ' 灵石——卦辞句句真账（每日一卦）</span></button>');
            }
            if (entrustEligible(npc)) {
                rows.push('<button onclick="NpcBond.entrust(\'' + sid + '\')" class="w-full mt-1 flex items-center gap-2 bg-indigo-900/40 hover:bg-indigo-800/40 border border-indigo-800/50 px-3 py-2 rounded text-sm text-indigo-200 transition-colors"><span>💭 TA欲言又止……</span><span class="text-xs text-indigo-300/70">TA信你到这份上了——听听TA心底的话</span></button>');
            }
            var ms = findMasterSect(npcId);
            if (ms && typeof window.showSectMasters === 'function') {
                rows.push('<button onclick="NpcBond.closeNpcThen(function(){ window.showSectMasters(\'' + ms.sect.replace(/'/g, '') + '\'); })" class="w-full mt-1 flex items-center gap-2 bg-yellow-900/40 hover:bg-yellow-800/40 border border-yellow-700/50 px-3 py-2 rounded text-sm text-yellow-200 transition-colors"><span>📖 拜师</span><span class="text-xs text-yellow-300/70">「' + ms.sect + '」的门就在TA这里——递拜帖</span></button>');
            }
            if (!rows.length) return '';
            return '<div class="mt-2 border-t border-gray-700 pt-2">' + rows.join('') + '</div>';
        } catch (e) { console.warn('[静默失败] js/npcs/npc-bond.js · buildNpcBondButtons：人情按钮没挂上', e && e.message); return ''; }
    }
    window.buildNpcBondButtons = buildNpcBondButtons;

    function closePanel() {
        try { if (typeof window.closeBuildingDialog === 'function') window.closeBuildingDialog(); } catch (e) { console.warn('[静默失败] js/npcs/npc-bond.js · closePanel：面板没收掉', e && e.message); }
    }
    function closeNpcThen(fn) {
        try { var m = document.querySelector('.npc-dialog-modal'); if (m) m.remove(); } catch (e) { console.warn('[静默失败] js/npcs/npc-bond.js · closeNpcThen：对话窗没收掉', e && e.message); }
        try { if (typeof fn === 'function') fn(); } catch (e2) { console.warn('[静默失败] js/npcs/npc-bond.js · closeNpcThen：拜师窗没开成', e2 && e2.message); }
    }

    // ============ 存读档（镖师契约走 StateRegistry 正门；每日账随日刷新不落档） ============
    function _export() { return JSON.parse(JSON.stringify(_st)); }
    function _import(d) {
        _st.escort = null;
        if (d && typeof d === 'object' && d.escort && typeof d.escort === 'object') {
            var e = d.escort;
            if (typeof e.npcId === 'string' && e.npcId) {
                _st.escort = {
                    npcId: String(e.npcId).slice(0, 60),
                    name: String(e.name || '镖师').slice(0, 30),
                    untilDay: Math.max(0, Math.floor(Number(e.untilDay) || 0)),
                    wage: Math.max(0, Math.floor(Number(e.wage) || 0))
                };
            }
        }
    }
    function _reset() { _st = { escort: null }; }
    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        window.StateRegistry.register('npcBond', { version: 1, export: _export, import: _import, reset: _reset });
    }

    // ===== v27.16：钱契两颗钮的执行口（borrow-money 族，NPCBorrowService 正门代办） =====
    function borrowMoney(npcId) {
        try {
            var npc = (window.npcManager && typeof window.npcManager.getNPC === 'function') ? window.npcManager.getNPC(npcId) : null;
            if (!npc) { say('这位不在眼前。', 'warning'); return false; }
            var r = (window.NPCBorrowService && typeof window.NPCBorrowService.borrowMoneyFromNPC === 'function')
                ? window.NPCBorrowService.borrowMoneyFromNPC(npc) : null;
            if (!r) { say('这条借路走不通。', 'info'); return false; }
            say(r.msg, r.success ? 'success' : 'warning');
            if (r.success) { try { if (typeof window.updateCurrencyUI === 'function') window.updateCurrencyUI(); } catch (eU) {} }
            return !!(r.success);
        } catch (eBm16) { console.warn('[静默失败] js/npcs/npc-bond.js · borrowMoney：这笔钱没借成', eBm16 && eBm16.message); return false; }
    }
    function returnMoney(npcId) {
        try {
            var recs = (window.NPCBorrowService && window.NPCBorrowService.getRecords) ? window.NPCBorrowService.getRecords() : [];
            var rec = recs.find(function (r) { return r && r.npcId === npcId && r.kind === 'money' && !r.returned && !r.deadbeated; }) || null;
            if (!rec) { say('没有待还的钱契。', 'info'); return false; }
            var r = (window.NPCBorrowService && typeof window.NPCBorrowService.returnBorrowedMoney === 'function')
                ? window.NPCBorrowService.returnBorrowedMoney(rec.id) : null;
            if (!r) { say('还钱口缺席。', 'warning'); return false; }
            say(r.msg, r.success ? 'success' : 'warning');
            if (r.success) { try { if (typeof window.updateCurrencyUI === 'function') window.updateCurrencyUI(); } catch (eU2) {} }
            return !!(r.success);
        } catch (eRm16) { console.warn('[静默失败] js/npcs/npc-bond.js · returnMoney：这笔钱没还成', eRm16 && eRm16.message); return false; }
    }

    window.NpcBond = {
        TUNE: TUNE,
        pendingBorrow: pendingBorrow,
        returnItem: returnItem,
        borrowMoney: borrowMoney,
        returnMoney: returnMoney,
        openDate: openDate,
        date: date,
        propose: propose,
        proposeDone: proposeDone,
        openAsk: openAsk,
        askAbout: askAbout,
        openTreat: openTreat,
        treat: treat,
        openEscortHire: openEscortHire,
        hire: hire,
        dismissEscort: dismissEscort,
        escortActive: escortActive,
        escortChanceMod: escortChanceMod,
        escortPlunderMod: escortPlunderMod,
        escortAmbushGuard: escortAmbushGuard,
        escortLineHtml: escortLineHtml,
        fortuneHints: fortuneHints,
        divineFull: divineFull,
        entrustEligible: entrustEligible,
        entrust: entrust,
        findMasterSect: findMasterSect,
        buildNpcBondButtons: buildNpcBondButtons,
        closePanel: closePanel,
        closeNpcThen: closeNpcThen,
        state: _export
    };
    window.openNpcBondPanel = function () { return openTreat(); };
})();
