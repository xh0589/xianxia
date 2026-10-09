// ==================== v26.0 六路营生批（第一百五十一批 · 用户点单）· 著书立说账 ====================
// 用户点单：「我一身功法奇遇，想写成册子卖进书肆、传给徒弟、甚至故意写本错的祸害对头。
//           『立传』是系统替我写的，我自己动笔没有。」本账把笔递到玩家手里：
//   ① 借案写书（书肆柜台接线，bookshop.js 守卫挂钮）：四类选题——修行心得（要境界）、
//      功法注解（要已学主修功法，书名真带功法名）、江湖行记（吃真履历：到过几城、案底几笔、
//      传闻池里几件事）、伪经（存心写错——明面光鲜，里头埋雷）；
//   ② 书成品质吃真账：学识×2＋境界档×10＋选题本料＋掷笔 0~30——劣品/尚可/佳作/神品四档，
//      劣品书肆也收（低价），神品满城传抄；
//   ③ 卖稿：一次性稿费（劣 40 铜 / 尚可 120 铜 / 佳作 300 铜 / 神品 60 灵石）＋学识长进＋城望；
//      神品进传闻池（deed good，名声是系统替你写的那本「立传」吃不到的活账）；
//   ④ 赠书：递给近处的熟人（好感/敬重真涨——按品质给）；有亲传弟子的（sect-kin 真名单守卫读取），
//      弟子得书另有心得加成——「传徒」这条线走真账；
//   ⑤ 伪经的后果链（明账，牌面上写死）：卖出去时就有被书肆掌眼识破的风险（学识越低越容易露）——
//      识破：分文没有、城望-15、业障-4、书肆拉黑三十日；蒙混过关：钱照拿，但三到七日后
//      有 55% 的概率「有修士照你书里的法门练出了岔子」——业障-6、恶名+3、风声进传闻池；
//      其中再有 30% 追到你头上：书肆行会永久拉黑。伪经不是免费的黑钱——每一笔都记在账上。
// 口径：书是账不是物（不污染物品注册表——稿本在 Authoring 账里，卖了/赠了就落状态）；
//   时辰走 timeSystem.advanceTime；钱走 RewardService / DataManager 正门；落档 StateRegistry 'authoring'。
(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    var CFG = {
        WRITE_MIN: 180, WRITE_QI: 25, WRITE_INK_COPPER: 20,
        BOOK_MAX: 8,              // 案头至多存八部稿
        SCHOL_W: 2, TIER_W: 10, RNG_MAX: 30,
        GRADE_AT: [40, 70, 100],  // 劣品 / 尚可 / 佳作 / 神品 分数线
        PAY_COPPER: [40, 120, 300], PAY_STONE_GOD: 60,
        SCHOL_GAIN: [1, 2, 3, 5],
        REP_GOD: 2,
        FORGE_SPOT_BASE: 0.5, FORGE_SPOT_SCHOL_DIV: 300, FORGE_SPOT_MIN: 0.1,
        FORGE_SPOT_REP: 15, FORGE_SPOT_KARMA: -4, FORGE_BLACK_DAYS: 30,
        FORGE_TRACE_MIN: 3, FORGE_TRACE_RANGE: 5,
        FORGE_MISHAP_P: 0.55, FORGE_MISHAP_KARMA: -6, FORGE_MISHAP_NOTO: 3,
        FORGE_TRACE_P: 0.30, FORGE_TRACE_NOTO: 2,
        GIFT_AFF: [2, 4, 7, 12], GIFT_RESPECT: [1, 2, 4, 6],
        DISCIPLE_BONUS_AFF: 3
    };

    var KINDS = [
        { id: 'notes', name: '修行心得', icon: '📔', desc: '把这些年的吐纳、瓶颈、火候写成册——要境界撑腰' },
        { id: 'art', name: '功法注解', icon: '📕', desc: '给你已学的主修功法作注疏——书名里带着它的名字' },
        { id: 'travel', name: '江湖行记', icon: '📗', desc: '走过的城、结过的案、传闻里的事——行脚本身就是本料' },
        { id: 'fake', name: '伪经', icon: '📓', desc: '存心写错的「秘籍」——明面光鲜，里头埋雷（后果链见牌面）' }
    ];

    var TITLES = {
        notes: ['云泥录', '静室谈火', '闭关札记', '气机随笔', '瓶颈问答'],
        art: ['注解', '疏义', '发挥', '辨误', '口诀阐微'],
        travel: ['十年行记', '江湖夜雨录', '山川问路', '城郭见闻', '道听与途说'],
        fake: ['秘传', '不示人稿', '得自仙府残卷', '口授心法', '上古遗篇']
    };

    var _st = { books: [], blacklistUntil: -1, blackPermanent: false };
    var _writeDay = -1;   // 运行时账：每日只写得动一部（写书是慢功夫）

    // ============ 小工具（黑道账同款口径） ============
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
                var r = window.RewardService.apply(spec, { source: source || '书肆卖稿', city: city() });
                return { ok: !!(r && r.success !== false), note: r && r.messages ? r.messages.join('、') : '' };
            }
        } catch (e) { console.warn('[静默失败] js/extensions/authoring.js · settle：这笔稿费没落成一笔', e && e.message); }
        return { ok: false, note: '' };
    }
    function advance(min, why) {
        try { if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') window.timeSystem.advanceTime(min, why); } catch (e) { console.warn('[静默失败] js/extensions/authoring.js · advance：时辰没扣成', e && e.message); }
    }
    function deed(mood, s) {
        try { if (typeof window.playerPushDeed === 'function') window.playerPushDeed(mood, s); } catch (e) { console.warn('[静默失败] js/extensions/authoring.js · deed：风声没递进传闻池', e && e.message); }
    }
    function growSchol(n, reason) {
        try { if (typeof window.growLifeSkill === 'function') window.growLifeSkill('学识', n, { reason: reason }); } catch (e) { console.warn('[静默失败] js/extensions/authoring.js · growSchol：学识没落账', e && e.message); }
    }
    function schol() {
        try { if (typeof window.getLifeSkill === 'function') return Number(window.getLifeSkill('学识')) || 0; } catch (e) { console.warn('[静默失败] js/extensions/authoring.js · schol：学识没读出来，按零算', e && e.message); }
        return 0;
    }
    function playerTier() {
        try { if (typeof window.getRealmTier === 'function') return Number(window.getRealmTier((cd() || {}).realm)) || 0; } catch (e) { console.warn('[静默失败] js/extensions/authoring.js · playerTier：境界尺没量出来，按零档算', e && e.message); }
        return 0;
    }
    function refresh() {
        try { if (window.updateCharacterStatus) window.updateCharacterStatus(); } catch (e) { console.warn('[静默失败] js/extensions/authoring.js · refresh：面板没刷新', e && e.message); }
        try { if (typeof window.updateCurrencyUI === 'function') window.updateCurrencyUI(); } catch (e2) { console.warn('[静默失败] js/extensions/authoring.js · refresh：钱袋没刷新', e2 && e2.message); }
    }
    function mainArtName() {
        try {
            var ms = window.currentSkills && window.currentSkills.skill_main;
            var id = ms && (ms.id || ms.skillId || ms);
            if (typeof id === 'string' && id) {
                var t = window.itemById && window.itemById[id];
                if (t && t.name) return String(t.name);
                for (var i = 0; Array.isArray(window.skillPages) && i < window.skillPages.length; i++) {
                    if (window.skillPages[i] && window.skillPages[i].id === id) return String(window.skillPages[i].name || id);
                }
                return id;
            }
        } catch (e) { console.warn('[静默失败] js/extensions/authoring.js · mainArtName：主修功法没读出来，注解没法落笔', e && e.message); }
        return null;
    }
    // 行记本料：到过的城（城望账上有数的）＋案底（通缉账 log）＋传闻（deed 账守卫读取）
    function travelFuel() {
        var n = 0;
        try {
            if (window.cityReputation && typeof window.cityReputation === 'object') {
                for (var k in window.cityReputation) {
                    var e = window.cityReputation[k];
                    if (e && (Number(e.value) !== 0 || (Array.isArray(e.flags) && e.flags.length))) n++;
                }
            }
        } catch (eC) { console.warn('[静默失败] js/extensions/authoring.js · travelFuel：到过的城没数出来，按零城算', eC && eC.message); }
        try { if (window.NpcCrime && typeof window.NpcCrime.state === 'function') { var cs = window.NpcCrime.state(); n += (cs && Array.isArray(cs.log)) ? cs.log.length : 0; } } catch (eN) { console.warn('[静默失败] js/extensions/authoring.js · travelFuel：案底没数出来，按零笔算', eN && eN.message); }
        return Math.min(40, n * 2);
    }
    function npcById(id) {
        try { return (window.npcManager && typeof window.npcManager.getNPC === 'function') ? window.npcManager.getNPC(id) : null; } catch (e) { return null; }
    }
    function isDisciple(npc) {
        try {
            if (typeof npc.hasFlag === 'function' && npc.hasFlag('player_disciple')) return true;
            var ds = window.discipleState;
            if (ds && Array.isArray(ds._myDisciples) && ds._myDisciples.indexOf(npc.id) >= 0) return true;
        } catch (e) { console.warn('[静默失败] js/extensions/authoring.js · isDisciple：弟子名册没读出来，按不是弟子算', e && e.message); }
        return false;
    }
    function blacklisted() {
        return _st.blackPermanent || (_st.blacklistUntil > 0 && absDay() < _st.blacklistUntil);
    }
    function seedOf(s) { var h = 0; s = String(s || ''); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }

    function gradeOf(score) {
        if (score >= CFG.GRADE_AT[2]) return 3;
        if (score >= CFG.GRADE_AT[1]) return 2;
        if (score >= CFG.GRADE_AT[0]) return 1;
        return 0;
    }
    var GRADE_WORDS = ['劣品', '尚可', '佳作', '神品'];

    // ============ ① 写书 ============
    function write(kindIdx) {
        var c = cd();
        if (!c) { say('请先创建角色。', 'warning'); return false; }
        if (!city()) { say('✍️ 荒郊野外没有案头——进城找间书肆借案。', 'info'); return false; }
        if (window.currentBattle) { say('打着架呢——笔搁不稳。', 'warning'); return false; }
        if (_st.books.length >= CFG.BOOK_MAX) { say('✍️ 案头堆了 ' + CFG.BOOK_MAX + ' 部稿子——先卖掉或赠出去，再写新的。', 'warning'); return false; }
        var day = absDay();
        if (_writeDay === day) { say('✍️ 今日已经写过一部了——腕子沉得抬不起来，明日再来（书肆的案头一日只借你一回）。', 'info'); return false; }
        var ki = Math.floor(Number(kindIdx));
        var kind = KINDS[ki];
        if (!kind) { say('没有这一类选题。', 'warning'); return false; }
        if (ki === 0 && playerTier() < 1) { say('✍️ 修行心得——你还没入修行门（炼气起步），写出来是自己哄自己。', 'warning'); return false; }
        var artName = null;
        if (ki === 1) {
            artName = mainArtName();
            if (!artName) { say('✍️ 功法注解——你连一部正经主修功法都还没学全，注什么？', 'warning'); return false; }
        }
        if (c && (Number(c.qi) || 0) < CFG.WRITE_QI) { say('✍️ 真气不继（写书要 ' + CFG.WRITE_QI + ' 点）——神完气足再来动笔。', 'warning'); return false; }
        if (c) c.qi = Math.max(0, (Number(c.qi) || 0) - CFG.WRITE_QI);
        settle({ copper: -CFG.WRITE_INK_COPPER }, '纸墨钱');
        advance(CFG.WRITE_MIN, '著书');
        _writeDay = day;

        var fuel = 0;
        if (ki === 0) fuel = playerTier() * 6;
        else if (ki === 1) fuel = playerTier() * 4 + 8;
        else if (ki === 2) fuel = travelFuel();
        else fuel = 12;   // 伪经的本料：唬人的排场
        var score = schol() * CFG.SCHOL_W + playerTier() * CFG.TIER_W + fuel + Math.floor(Math.random() * (CFG.RNG_MAX + 1));
        var g = gradeOf(score);
        var pool = TITLES[kind.id];
        var title = (ki === 1 ? '《' + artName + '·' + pool[seedOf(artName + '_' + day) % pool.length] + '》' : '《' + pool[seedOf(kind.id + '_' + day + '_' + score) % pool.length] + '》');
        var book = {
            id: 'bk_' + day + '_' + ki + '_' + (score % 97),
            title: title, kind: kind.id, kindName: kind.name, icon: kind.icon,
            score: score, grade: g, forgery: ki === 3,
            state: 'held', soldDay: -1, traceDay: -1, city: city()
        };
        _st.books.push(book);
        log('✍️ 你在书肆借了案头，磨墨铺纸写了整整 ' + CFG.WRITE_MIN + ' 分钟——' + title + '（' + kind.name + '）落笔成稿：' + GRADE_WORDS[g] + '（笔力 ' + score + '＝学识×2＋境界×10＋本料＋掷笔）。' + (ki === 3 ? '⚠️ 这是部伪经——里头埋的雷，早晚要响。' : '') + '（纸墨钱 ' + CFG.WRITE_INK_COPPER + ' 铜，真气 -' + CFG.WRITE_QI + '）', ki === 3 ? 'warning' : 'success');
        say('✍️ ' + title + ' 写成了——' + GRADE_WORDS[g] + '。卖稿、赠人，都在案头。', 'success');
        refresh();
        return true;
    }

    // ============ ③ 卖稿 ============
    function sell(idx) {
        var b = _st.books[idx];
        if (!b || b.state !== 'held') { say('✍️ 案头没有这部稿子。', 'info'); return false; }
        if (blacklisted()) { say('✍️ 书肆行会的黑名单上有你的名字——掌柜把稿子推了回来：「行会发的话，我们不敢收。」' + (_st.blackPermanent ? '（永久拉黑——伪经的账）' : '（还要过 ' + (_st.blacklistUntil - absDay()) + ' 日）'), 'error'); return false; }
        if (b.forgery) {
            var spotP = Math.max(CFG.FORGE_SPOT_MIN, CFG.FORGE_SPOT_BASE - schol() / CFG.FORGE_SPOT_SCHOL_DIV);
            if (Math.random() < spotP) {
                // 掌眼识破
                b.state = 'burned';
                settle({ cityReputation: -CFG.FORGE_SPOT_REP, karma: CFG.FORGE_SPOT_KARMA }, '伪经被识破');
                _st.blacklistUntil = absDay() + CFG.FORGE_BLACK_DAYS;
                deed('bad', '你拿一部伪经去书肆卖稿，被老掌柜当场识破——街面上都在笑这场「著书」');
                log('✍️ 老掌柜只翻了七页，就把稿子合上了：「火候是反的，气路是拧的——你在写伪经。」满堂的目光钉在你背上。（稿子被当场烧了，城望-' + CFG.FORGE_SPOT_REP + '，业障' + CFG.FORGE_SPOT_KARMA + '，书肆拉黑 ' + CFG.FORGE_BLACK_DAYS + ' 日）', 'danger');
                say('✍️ 伪经被掌眼识破，当场烧稿——分文没有，城望-' + CFG.FORGE_SPOT_REP + '、业障' + CFG.FORGE_SPOT_KARMA + '，书肆拉黑 ' + CFG.FORGE_BLACK_DAYS + ' 日。', 'error');
                refresh();
                return false;
            }
            // 蒙混过关——雷埋下了
            b.traceDay = absDay() + CFG.FORGE_TRACE_MIN + Math.floor(Math.random() * CFG.FORGE_TRACE_RANGE);
        }
        b.state = 'sold';
        b.soldDay = absDay();
        var payWord;
        if (b.grade === 3) {
            settle({ spiritStones: CFG.PAY_STONE_GOD, cityReputation: CFG.REP_GOD }, '卖稿');
            payWord = '稿费 ' + CFG.PAY_STONE_GOD + ' 灵石（神品另抬城望+' + CFG.REP_GOD + '）';
            deed('good', '你的' + b.title + '在' + city() + '书肆上架，几日就传抄开了——茶楼里有人照着册子上的话头论道');
        } else {
            settle({ copper: CFG.PAY_COPPER[b.grade] }, '卖稿');
            payWord = '稿费 ' + CFG.PAY_COPPER[b.grade] + ' 铜钱';
        }
        growSchol(CFG.SCHOL_GAIN[b.grade], '写书落笔，学识自长');
        log('✍️ 掌柜验过' + b.title + '（' + GRADE_WORDS[b.grade] + '），点头付账：' + payWord + '。学识+' + CFG.SCHOL_GAIN[b.grade] + '。' + (b.forgery ? '——伪经蒙混过关了。雷还在册子上：三到七日之间，看有没有人照着练出岔子。' : ''), b.forgery ? 'warning' : 'success');
        say('✍️ ' + b.title + ' 卖了——' + payWord + '，学识+' + CFG.SCHOL_GAIN[b.grade] + '。' + (b.forgery ? '（伪经的雷埋下了……）' : ''), b.forgery ? 'warning' : 'success');
        refresh();
        return true;
    }

    // ⑤ 伪经的后果（新日正门）
    function dailyTrace(rng) {
        var rnd = (typeof rng === 'function') ? rng : Math.random;
        for (var i = 0; i < _st.books.length; i++) {
            var b = _st.books[i];
            if (!b.forgery || b.state !== 'sold' || b.traceDay < 0) continue;
            if (absDay() < b.traceDay) continue;
            b.traceDay = -1;   // 雷只响一回
            if (rnd() >= CFG.FORGE_MISHAP_P) {
                log('✍️ 风声过去了——你那部' + b.title + '似乎没害着人。（这一回是运气，不是本事）', 'info');
                continue;
            }
            var c = cd() || {};
            c.karma = Math.max(-100, Math.min(100, (Number(c.karma) || 0) + CFG.FORGE_MISHAP_KARMA));
            c.notoriety = Math.min(100, (Number(c.notoriety) || 0) + CFG.FORGE_MISHAP_NOTO);
            // v27.13 恶名分城：直写后同步记进世界账簿（走火的消息从当前城往外传）
            try { if (window.WorldLedger && typeof window.WorldLedger.noteNotorietyChange === 'function') window.WorldLedger.noteNotorietyChange(CFG.FORGE_MISHAP_NOTO); } catch (eWN3) {}
            deed('bad', '有修士照着' + b.title + '里的法门练出了岔子——走火的消息传开了，写书的人被指着脊梁骨');
            log('✍️ 坏消息：外地有修士照着' + b.title + '练功，气行到第七转岔了路，走火入魔卧床不起。消息传回' + city() + '。（业障' + CFG.FORGE_MISHAP_KARMA + '，恶名+' + CFG.FORGE_MISHAP_NOTO + '）', 'danger');
            say('✍️ 你那部伪经害得有人走火入魔——业障' + CFG.FORGE_MISHAP_KARMA + '、恶名+' + CFG.FORGE_MISHAP_NOTO + '，风声传开了。', 'error');
            if (rnd() < CFG.FORGE_TRACE_P) {
                _st.blackPermanent = true;
                log('✍️ 苦主顺着书肆的稿账追到了你——书肆行会发下话去，各城书肆永久不收你的稿。（伪经的账，利钱最重）', 'danger');
                say('✍️ 书肆行会把你永久拉黑了——各城书肆再不收你的稿。', 'error');
            }
            refresh();
        }
    }

    // ============ ④ 赠书 ============
    function giftCandidates() {
        var out = [];
        try {
            var list = (window.npcManager && typeof window.npcManager.getNearbyNPCs === 'function')
                ? window.npcManager.getNearbyNPCs()
                : ((window.npcManager && typeof window.npcManager.getNPCsByLocation === 'function' && city()) ? window.npcManager.getNPCsByLocation(city()) : []);
            if (Array.isArray(list)) {
                for (var i = 0; i < list.length && out.length < 6; i++) {
                    var n = list[i];
                    if (n && !n.isDead && n.relationship) out.push(n);
                }
            }
        } catch (e) { console.warn('[静默失败] js/extensions/authoring.js · giftCandidates：近处的熟人没点出来', e && e.message); }
        return out;
    }

    function gift(idx, npcId) {
        var b = _st.books[idx];
        if (!b || b.state !== 'held') { say('✍️ 案头没有这部稿子。', 'info'); return false; }
        var npc = npcById(npcId);
        if (!npc || npc.isDead) { say('✍️ 那人不在近处。', 'info'); return false; }
        if (typeof window.npcNotCoLocated === 'function' && window.npcNotCoLocated(npc)) { say('✍️ 你与' + npc.name + '并不在一处——书递不过去。', 'warning'); return false; }
        b.state = 'gifted';
        var aff = CFG.GIFT_AFF[b.grade], resp = CFG.GIFT_RESPECT[b.grade];
        var disc = isDisciple(npc);
        if (disc) aff += CFG.DISCIPLE_BONUS_AFF;
        try { npc.changeAffection(aff); } catch (eA) { console.warn('[静默失败] js/extensions/authoring.js · gift：好感没落账', eA && eA.message); }
        try { if (typeof npc.changeRespect === 'function') npc.changeRespect(resp); } catch (eR) { console.warn('[静默失败] js/extensions/authoring.js · gift：敬重没落账', eR && eR.message); }
        try { if (typeof npc.recordPlayerAction === 'function') npc.recordPlayerAction('gifted_book', 'positive'); } catch (eR2) { console.warn('[静默失败] js/extensions/authoring.js · gift：这一笔没记进TA的记忆', eR2 && eR2.message); }
        advance(10, '赠书');
        log('✍️ 你把' + b.title + '（' + GRADE_WORDS[b.grade] + '）递到 ' + npc.name + ' 手里。' + (disc ? 'TA是你的亲传——捧书的手都紧了紧：「师父的书，弟子日夜研读。」（弟子得书，好感另+' + CFG.DISCIPLE_BONUS_AFF + '）' : 'TA翻了头一页就郑重起来：「这份手泽，我收好了。」') + '（好感+' + aff + '，敬重+' + resp + '）', 'success');
        say('✍️ ' + b.title + ' 赠给了 ' + npc.name + '。（好感+' + aff + ' 敬重+' + resp + (disc ? '，弟子得书另有加成' : '') + '）', 'success');
        refresh();
        return true;
    }

    // ============ 牌面 ============
    function open() {
        var c = cd();
        if (!c) { say('请先创建角色。', 'warning'); return false; }
        if (!city()) { say('✍️ 荒郊野外没有案头——进城再说。', 'info'); return false; }
        var btn = 'class="w-full p-3 rounded mb-2 text-left text-sm text-white hover:opacity-90"';
        var html = '<p class="text-sm text-gray-400 mb-2">书肆掌柜把里间一张旧案让给你：「纸墨自备，写什么随你——写成了，柜上收。」' +
            (blacklisted() ? '<span class="text-red-300">（行会黑名单上有你的名字' + (_st.blackPermanent ? '——永久' : '，还有 ' + (_st.blacklistUntil - absDay()) + ' 日') + '）</span>' : '') + '</p>';
        html += '<p class="text-xs text-gray-500 mb-2">写书：' + CFG.WRITE_MIN + ' 分钟 · 真气 ' + CFG.WRITE_QI + ' · 纸墨 ' + CFG.WRITE_INK_COPPER + ' 铜 · 每日一部 · 案头至多 ' + CFG.BOOK_MAX + ' 部。品质＝学识×2＋境界×10＋本料＋掷笔（劣品 ' + CFG.GRADE_AT[0] + ' / 尚可 ' + CFG.GRADE_AT[1] + ' / 佳作 ' + CFG.GRADE_AT[2] + ' / 神品线）。</p>';
        for (var i = 0; i < KINDS.length; i++) {
            var kd = KINDS[i];
            var extra = '';
            if (kd.id === 'notes' && playerTier() < 1) extra = '（境界不够，写不了）';
            if (kd.id === 'art' && !mainArtName()) extra = '（没有主修功法，注不了）';
            html += '<button onclick="window.Authoring.write(' + i + ')" ' + btn.replace('p-3', (kd.id === 'fake' ? 'bg-red-950' : 'bg-indigo-900') + ' p-3') + '>' + kd.icon + ' ' + kd.name +
                '<span class="block text-xs text-gray-400">' + kd.desc + extra + '</span></button>';
        }
        if (kd_fakeNote()) html += kd_fakeNote();
        var held = _st.books.filter(function (b) { return b.state === 'held'; });
        if (held.length > 0) {
            html += '<p class="text-xs text-gray-400 mt-2 mb-1">案头的稿子（' + _st.books.length + '/' + CFG.BOOK_MAX + '）：</p>';
            for (var bi = 0; bi < _st.books.length; bi++) {
                var b = _st.books[bi];
                if (b.state !== 'held') continue;
                var gi = _st.books.indexOf(b);
                html += '<div class="p-2 bg-gray-800 rounded border border-gray-700 mb-1">' +
                    '<span class="text-sm text-gray-200">' + b.icon + ' ' + b.title + ' <span class="text-xs text-amber-300">' + GRADE_WORDS[b.grade] + '</span>' +
                    (b.forgery ? ' <span class="text-xs text-red-400">伪经</span>' : '') + '</span>' +
                    '<span class="flex gap-1 mt-1"><button onclick="window.Authoring.sell(' + gi + ')" class="px-2 py-1 rounded text-xs bg-yellow-800 text-white">卖稿' + (b.grade === 3 ? '（' + CFG.PAY_STONE_GOD + ' 灵石）' : '（' + CFG.PAY_COPPER[b.grade] + ' 铜）') + '</button>' +
                    '<button onclick="window.Authoring.giftPanel(' + gi + ')" class="px-2 py-1 rounded text-xs bg-teal-800 text-white">赠人</button></span></div>';
            }
        }
        var soldFakes = _st.books.filter(function (b) { return b.forgery && b.state === 'sold' && b.traceDay > 0; });
        if (soldFakes.length > 0) {
            html += '<p class="text-xs text-red-300 mt-1">⚠️ 有 ' + soldFakes.length + ' 部伪经在外面——雷响的日子就在眼前（三到七日之间，55% 出事，出事后 30% 追到你头上）。</p>';
        }
        if (typeof window.showBuildingEffectDialog === 'function') {
            window.showBuildingEffectDialog('✍️ 借案写书 · ' + city(), html);
            return true;
        }
        return false;
    }

    function kd_fakeNote() {
        return '<p class="text-[11px] text-gray-500 mt-1">伪经的账是明账：卖稿就有 ' + Math.round(Math.max(CFG.FORGE_SPOT_MIN, CFG.FORGE_SPOT_BASE - schol() / CFG.FORGE_SPOT_SCHOL_DIV) * 100) + '% 被掌眼识破（学识越高越容易蒙混）——识破则烧稿、城望-' + CFG.FORGE_SPOT_REP + '、业障' + CFG.FORGE_SPOT_KARMA + '、拉黑 ' + CFG.FORGE_BLACK_DAYS + ' 日；蒙混过关则三到七日后 ' + Math.round(CFG.FORGE_MISHAP_P * 100) + '% 有人练出岔子（业障' + CFG.FORGE_MISHAP_KARMA + ' 恶名+' + CFG.FORGE_MISHAP_NOTO + '），其中 ' + Math.round(CFG.FORGE_TRACE_P * 100) + '% 追到你头上——行会永久拉黑。</p>';
    }

    function giftPanel(idx) {
        var cands = giftCandidates();
        if (cands.length === 0) { say('✍️ 近处没有可赠的熟人。', 'info'); return false; }
        var btn = 'class="w-full p-2 rounded mb-1 text-left text-sm text-white hover:opacity-90 bg-teal-900"';
        var html = '<p class="text-sm text-gray-400 mb-2">把稿子递给谁？（好感/敬重按品质真涨；亲传弟子另有加成）</p>';
        for (var i = 0; i < cands.length; i++) {
            var n = cands[i];
            html += '<button onclick="window.Authoring.gift(' + idx + ',\'' + n.id + '\')" ' + btn + '>' + n.name +
                ' <span class="text-xs text-gray-400">' + (n.occupation || '') + (isDisciple(n) ? ' · 你的亲传' : '') + ' · 好感 ' + (Number(n.relationship && n.relationship.affection) || 0) + '</span></button>';
        }
        if (typeof window.showBuildingEffectDialog === 'function') {
            window.showBuildingEffectDialog('✍️ 赠书', html);
            return true;
        }
        return false;
    }

    // ============ 存读档（StateRegistry 正门） ============
    function _export() { return JSON.parse(JSON.stringify(_st)); }
    function _import(d) {
        var s = { books: [], blacklistUntil: -1, blackPermanent: false };
        if (d && typeof d === 'object') {
            s.blackPermanent = !!d.blackPermanent;
            s.blacklistUntil = Number.isFinite(Number(d.blacklistUntil)) ? Math.floor(Number(d.blacklistUntil)) : -1;
            if (Array.isArray(d.books)) {
                for (var i = 0; i < d.books.length && s.books.length < CFG.BOOK_MAX; i++) {
                    var b = d.books[i];
                    if (!b || typeof b !== 'object' || typeof b.title !== 'string' || typeof b.id !== 'string') continue;
                    var g = Math.max(0, Math.min(3, Math.floor(Number(b.grade)) || 0));
                    s.books.push({
                        id: b.id.slice(0, 40), title: b.title.slice(0, 30),
                        kind: ['notes', 'art', 'travel', 'fake'].indexOf(b.kind) >= 0 ? b.kind : 'notes',
                        kindName: typeof b.kindName === 'string' ? b.kindName.slice(0, 8) : '',
                        icon: typeof b.icon === 'string' ? b.icon.slice(0, 8) : '📔',
                        score: Math.max(0, Math.min(999, Math.floor(Number(b.score)) || 0)),
                        grade: g, forgery: !!b.forgery,
                        state: ['held', 'sold', 'gifted', 'burned'].indexOf(b.state) >= 0 ? b.state : 'held',
                        soldDay: Number.isFinite(Number(b.soldDay)) ? Math.floor(Number(b.soldDay)) : -1,
                        traceDay: Number.isFinite(Number(b.traceDay)) ? Math.floor(Number(b.traceDay)) : -1,
                        city: typeof b.city === 'string' ? b.city.slice(0, 30) : ''
                    });
                }
            }
        }
        _st = s;
    }
    function _reset() { _st = { books: [], blacklistUntil: -1, blackPermanent: false }; }
    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        window.StateRegistry.register('authoring', { version: 1, export: _export, import: _import, reset: _reset });
    }

    if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') {
        window.timeSystem.onNewDaySubscribe(function () { dailyTrace(); });
    }

    window.Authoring = {
        CFG: CFG, KINDS: KINDS, GRADE_WORDS: GRADE_WORDS,
        blacklisted: blacklisted, travelFuel: travelFuel, mainArtName: mainArtName,
        write: write, sell: sell, gift: gift, giftPanel: giftPanel, dailyTrace: dailyTrace,
        open: open,
        state: _export
    };
    window.openAuthoringDesk = function () { return open(); };
})();
