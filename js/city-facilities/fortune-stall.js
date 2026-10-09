// ==================== v26.1 五路进城批（第一百五十二批 · 用户点单）· 卦摊账 ====================
// 用户点单：「卜卦是别人给我算，我想自己支摊给人看相——学识境界定准头，算准了赏钱+名声，
//           算到城中贵人隐疾还能结善缘；砸了卦摊被人掀，偶尔真卜出一桩机缘线索。」
// 本账在市井街口支一张卦摊（有市集/铺面的城才支得起来）：
//   ① 每日至多开三卦（时辰有限，一卦二十分钟）；
//   ② 准头是明账：p = 30% 底子 + 学识/300 + 境界档×5%，封顶 88%——学问越深，卦越灵；
//   ③ 客分两种：过路客（打赏铜钱）与城中熟人（三成半概率坐上卦摊——算准了涨好感，
//      是「结善缘」的正门口径，changeAffection 真账）；
//   ④ 砸卦：客人翻脸掀摊——心境−2、赔摊钱 5 铜（每日至多砸一回，砸过就收摊，摊主也怕）；
//   ⑤ 机缘线索：算准时 6% 真卜出一桩线索——线索只指向游戏里真有的去处（古玩摊/旧书摊/
//      城外地窖一路的实话），不画空头饼；
//   ⑥ 每卦都长一分学识（摊上阅人）。
// 口径：铜钱走 RewardService 单一真源；时辰走 advanceTime；好感走 npc.changeAffection；
//   风声走 playerPushDeed；每日账落 StateRegistry 'fortuneStall' 正门（存档不开新键）。
(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    var CFG = {
        DAILY_MAX: 3,             // 每日卦数
        SESSION_MIN: 20,          // 一卦的时辰
        BASE_P: 0.30,             // 准头底子
        SCHOL_DIV: 300,           // 学识加成除数
        TIER_BONUS: 0.05,         // 每档境界的加成
        P_CAP: 0.88,              // 准头封顶
        PAY_BASE: 8,              // 过路客打赏底子（铜钱）
        PAY_SCHOL_DIV: 40,        // 学识加成
        NPC_P: 0.35,              // 熟人坐上卦摊的概率
        NPC_AFF: 3,               // 算准熟人：好感+
        CLUE_P: 0.06,             // 机缘线索
        FLIP_MOOD: -2,            // 掀摊：心境
        FLIP_COPPER: 5,           // 掀摊：赔摊钱
        GROW_SCHOL: 1             // 每卦的学识长进
    };

    // 机缘线索只指真去处（明账文化：不画游戏里不存在的饼）
    var CLUES = [
        '卦象里隐有一块蒙尘的石头——「皮壳藏宝，市集古玩摊上，十石九空，但今日气运在你。」（赌石摊的彩头线）',
        '你算到客人近日有一场口舌之灾，劝他谨言——他千恩万谢之余压低声音：「城南旧书摊新到了一摞残页，先生若有意，赶早。」（书肆淘书的线）',
        '铜钱落定，卦象指向城外——「三里之内必有奇遇，先生若得闲，出城走走。」（城外的机缘线）',
        '客人问的是姻缘，你算出的却是他自己都忘了的一桩旧约——他怔了半晌，留下一句：「先生神算。坊间若有难处，报我的名字。」（街坊人脉的线）',
        '卦象上贵人在东——「近日城中有贵人微服，先生气度不凡，或有一面之缘。」（城中贵人的线）'
    ];

    var _st = { day: -1, reads: 0, flipped: false, clues: 0, earned: 0, npcsRead: 0 };

    // ============ 小工具（赌石摊同款口径） ============
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
        } catch (e) { console.warn('[静默失败] js/city-facilities/fortune-stall.js · absDay：日历没读出来，按零日算', e && e.message); return 0; }
        return 0;
    }
    function settle(spec, source) {
        try {
            if (window.RewardService && typeof window.RewardService.apply === 'function') {
                var r = window.RewardService.apply(spec, { facilitySpend: true, source: source || '卦摊', city: city() });
                return { ok: !!(r && r.success !== false), note: r && r.messages ? r.messages.join('、') : '' };
            }
        } catch (e) { console.warn('[静默失败] js/city-facilities/fortune-stall.js · settle：这笔账没落成一笔', e && e.message); }
        return { ok: false, note: '' };
    }
    function advance(min, why) {
        try { if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') window.timeSystem.advanceTime(min, why); } catch (e) { console.warn('[静默失败] js/city-facilities/fortune-stall.js · advance：时辰没扣成', e && e.message); }
    }
    function deed(mood, s) {
        try { if (typeof window.playerPushDeed === 'function') window.playerPushDeed(mood, s); } catch (e) { console.warn('[静默失败] js/city-facilities/fortune-stall.js · deed：风声没递进传闻池', e && e.message); }
    }
    function growSchol(n, reason) {
        try { if (typeof window.growLifeSkill === 'function') window.growLifeSkill('学识', n, { reason: reason }); } catch (e) { console.warn('[静默失败] js/city-facilities/fortune-stall.js · growSchol：阅人的长进没落账', e && e.message); }
    }
    function refresh() {
        try { if (window.updateCharacterStatus) window.updateCharacterStatus(); } catch (e) { console.warn('[静默失败] js/city-facilities/fortune-stall.js · refresh：面板没刷新', e && e.message); }
        try { if (typeof window.updateCurrencyUI === 'function') window.updateCurrencyUI(); } catch (e2) { console.warn('[静默失败] js/city-facilities/fortune-stall.js · refresh：钱袋没刷新', e2 && e2.message); }
    }
    function schol() {
        try { if (typeof window.getLifeSkill === 'function') return Number(window.getLifeSkill('学识')) || 0; } catch (e) { console.warn('[静默失败] js/city-facilities/fortune-stall.js · schol：学识没读出来，按零算', e && e.message); }
        return 0;
    }
    function playerTier() {
        try { if (typeof window.getRealmTier === 'function') return Number(window.getRealmTier((cd() || {}).realm)) || 0; } catch (e) { console.warn('[静默失败] js/city-facilities/fortune-stall.js · playerTier：境界尺没量出来，按零档算', e && e.message); }
        return 0;
    }
    function stallOk(ct) {
        try {
            var d = window.locationSystem && window.locationSystem.getCityData && window.locationSystem.getCityData(ct || city());
            if (!d || !d.buildings) return false;
            return d.buildings.indexOf('market') >= 0 || d.buildings.indexOf('shop') >= 0;
        } catch (e) { console.warn('[静默失败] js/city-facilities/fortune-stall.js · stallOk：城里有没有街口没问清，按没有算', e && e.message); return false; }
    }
    function hitP() {
        return Math.min(CFG.P_CAP, CFG.BASE_P + schol() / CFG.SCHOL_DIV + playerTier() * CFG.TIER_BONUS);
    }
    function rollDay() {
        var day = absDay();
        if (_st.day !== day) { _st.day = day; _st.reads = 0; _st.flipped = false; }
    }
    function nearNpcs() {
        try {
            var list = (window.npcManager && typeof window.npcManager.getNearbyNPCs === 'function')
                ? window.npcManager.getNearbyNPCs()
                : ((window.npcManager && typeof window.npcManager.getNPCsByLocation === 'function' && city()) ? window.npcManager.getNPCsByLocation(city()) : []);
            if (Array.isArray(list)) return list.filter(function (n) { return n && !n.isDead && n.relationship; });
        } catch (e) { console.warn('[静默失败] js/city-facilities/fortune-stall.js · nearNpcs：近处的熟人没点出来，这卦只来过路客', e && e.message); }
        return [];
    }
    function passerbyName() {
        try { if (window.nameGenerator && typeof window.nameGenerator.generateName === 'function') { var g = window.nameGenerator.generateName(); if (g && g.full) return String(g.full); } } catch (e) { console.warn('[静默失败] js/city-facilities/fortune-stall.js · passerbyName：过路客没取上名，按无名氏算', e && e.message); }
        return '一位过路的行客';
    }

    // ============ 开一卦 ============
    function read(rng) {
        rollDay();
        var c = cd();
        if (!c) { say('请先创建角色。', 'warning'); return false; }
        var ct = city();
        if (!ct || !stallOk(ct)) { say('🔮 这地界支不起卦摊——卦摊跟着市集街口走。', 'info'); return false; }
        if (_st.flipped) { say('🔮 摊子今天刚被掀过，你把它收起来了——明日再支。（砸过卦的当天不再开摊，摊主也怕）', 'info'); return false; }
        if (_st.reads >= CFG.DAILY_MAX) { say('🔮 今日三卦已满——你收了签筒：「卦不敢多算，泄天机。」（每日至多 ' + CFG.DAILY_MAX + ' 卦）', 'info'); return false; }

        // 客人：熟人三成半，余者过路客
        var rr = (typeof rng === 'function') ? rng : Math.random;
        var npcs = nearNpcs();
        var npc = null;
        if (npcs.length > 0 && rr() < CFG.NPC_P) npc = npcs[Math.floor(rr() * npcs.length) % npcs.length];
        advance(CFG.SESSION_MIN, '摆摊看相');
        _st.reads += 1;

        var hit = rr() < hitP();
        growSchol(CFG.GROW_SCHOL, '卦摊上阅人');

        if (!hit) {
            // 砸卦：客人翻脸掀摊（每日至多一回）
            _st.flipped = true;
            settle({ mood: CFG.FLIP_MOOD, copper: -CFG.FLIP_COPPER }, '卦摊被掀');
            log('🔮 ' + (npc ? npc.name + ' 听你解卦，眉头越皱越紧' : '一位' + passerbyName() + '听你解卦，脸色越来越黑') + '——你算岔了。客人一拍卦桌：「江湖骗子！」签筒铜钱撒了一地，摊子差点被掀翻。（心境' + CFG.FLIP_MOOD + '，赔摊钱 ' + CFG.FLIP_COPPER + ' 铜，今日收摊）', 'warning');
            say('🔮 算岔了——客人翻脸掀摊。（心境' + CFG.FLIP_MOOD + ' −' + CFG.FLIP_COPPER + ' 铜钱，今日收摊）', 'error');
            refresh();
            return true;
        }

        // 算准了
        var pay = CFG.PAY_BASE + Math.floor(schol() / CFG.PAY_SCHOL_DIV);
        settle({ copper: pay }, '卦摊打赏');
        _st.earned += pay;
        var clueWord = '';
        if (rr() < CFG.CLUE_P) {
            _st.clues += 1;
            clueWord = CLUES[Math.floor(rr() * CLUES.length) % CLUES.length];
        }
        if (npc) {
            _st.npcsRead += 1;
            try { npc.changeAffection(CFG.NPC_AFF); } catch (eA) { console.warn('[静默失败] js/city-facilities/fortune-stall.js · read：善缘没落进好感账', eA && eA.message); }
            try { if (typeof npc.recordPlayerAction === 'function') npc.recordPlayerAction('fortune_read', 'positive'); } catch (eR) { console.warn('[静默失败] js/city-facilities/fortune-stall.js · read：这一卦没记进TA的记忆', eR && eR.message); }
            log('🔮 ' + npc.name + ' 半信半疑坐上卦摊——你三句话点破了TA压在心底的隐疾。TA盯着你看了半晌，长揖到地：「先生真神人也。」（好感+' + CFG.NPC_AFF + '，打赏 ' + pay + ' 铜钱，学识+' + CFG.GROW_SCHOL + '）' + (clueWord ? '临散摊时你卜出一桩线索：' + clueWord : ''), 'success');
            say('🔮 算准了 ' + npc.name + ' 的心事——善缘结下（好感+' + CFG.NPC_AFF + '），打赏 ' + pay + ' 铜钱。', 'success');
        } else {
            var who = passerbyName();
            log('🔮 ' + who + ' 将信将疑地付了卦金，走出十几步又折回来作了个揖：「先生算得准。」（打赏 ' + pay + ' 铜钱，学识+' + CFG.GROW_SCHOL + '）' + (clueWord ? '收摊前你卜出一桩线索：' + clueWord : ''), 'success');
            say('🔮 算准了——' + who + '留下 ' + pay + ' 铜钱打赏。', 'success');
        }
        if (clueWord) deed('good', '你在' + ct + '街口支卦摊，一卦算准，还卜出了一桩机缘线索——问卦的人排起了小队');
        else if (_st.reads === CFG.DAILY_MAX) deed('good', '你在' + ct + '街口的卦摊今日三卦三准——收摊时还有人在等');
        refresh();
        open();
        return true;
    }

    // ============ 牌面 ============
    function open() {
        rollDay();
        if (!cd()) { say('请先创建角色。', 'warning'); return false; }
        var ct = city();
        if (!ct) { say('🔮 你在荒郊野外——卦摊支在城里街口。', 'info'); return false; }
        if (!stallOk(ct)) { say('🔮 ' + ct + '没有市集街口——卦摊支不起来。', 'info'); return false; }
        var btn = 'class="w-full p-3 rounded mb-2 text-left text-sm text-white hover:opacity-90"';
        var html = '<p class="text-sm text-gray-400 mb-2">一方旧布、三只铜钱、一面「铁口神算」的小幡——街口支摊，阅人算命。（你的学识 ' + schol() + '，境界 ' + ((cd() || {}).realm || '凡人') + '）</p>' +
            '<p class="text-xs text-gray-500 mb-2">今日已开 ' + _st.reads + '/' + CFG.DAILY_MAX + ' 卦' + (_st.flipped ? ' · <span class="text-red-300">摊子刚被掀过，今日收摊</span>' : '') + ' · 累计打赏 ' + _st.earned + ' 铜钱 · 机缘线索 ' + _st.clues + ' 桩</p>' +
            '<button onclick="window.FortuneStall.read()" ' + btn.replace('p-3', 'bg-violet-900 p-3') + '>🔮 开一卦（' + CFG.SESSION_MIN + ' 分钟 · 准头 ' + Math.round(hitP() * 100) + '%——学识境界越高越灵 · 熟人坐上卦摊算准了结善缘）</button>' +
            '<p class="text-[11px] text-gray-500 mt-1">明账：算准了打赏 ' + CFG.PAY_BASE + '+' + '学识/' + CFG.PAY_SCHOL_DIV + ' 铜钱、每卦学识+' + CFG.GROW_SCHOL + '、6% 卜出真去处线索；算岔了客人掀摊（心境' + CFG.FLIP_MOOD + '、赔 ' + CFG.FLIP_COPPER + ' 铜、当日收摊）。</p>';
        if (typeof window.showBuildingEffectDialog === 'function') {
            window.showBuildingEffectDialog('🔮 街口卦摊 · 看相 · ' + ct, html);
            return true;
        }
        return false;
    }

    // ============ 存读档（StateRegistry 正门） ============
    function _export() { return JSON.parse(JSON.stringify(_st)); }
    function _import(s) {
        var st = { day: -1, reads: 0, flipped: false, clues: 0, earned: 0, npcsRead: 0 };
        if (s && typeof s === 'object') {
            st.day = Number.isFinite(Number(s.day)) ? Number(s.day) : -1;
            st.reads = Math.max(0, Math.min(CFG.DAILY_MAX, Math.floor(Number(s.reads)) || 0));
            st.flipped = !!s.flipped;
            st.clues = Math.max(0, Math.min(10000, Math.floor(Number(s.clues)) || 0));
            st.earned = Math.max(0, Math.min(10000000, Math.floor(Number(s.earned)) || 0));
            st.npcsRead = Math.max(0, Math.min(10000, Math.floor(Number(s.npcsRead)) || 0));
        }
        _st = st;
    }
    function _reset() { _st = { day: -1, reads: 0, flipped: false, clues: 0, earned: 0, npcsRead: 0 }; }
    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        window.StateRegistry.register('fortuneStall', { version: 1, export: _export, import: _import, reset: _reset });
    }

    window.FortuneStall = {
        CFG: CFG, CLUES: CLUES,
        stallOk: stallOk, hitP: hitP,
        read: read,
        open: open,
        state: _export
    };
    window.openFortuneStall = function () { return open(); };
})();
