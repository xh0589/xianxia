// ==================== v26.1 五路进城批（第一百五十二批 · 用户点单）· 私塾账 ====================
// 用户点单：「开私塾教蒙童——学识换安稳束脩，教出的孩子几年后长成城里各行的熟人（暗线人脉）；
//           『教化一方』是笔正经功德账，能抵杀孽恶名的名声亏空。」
// 本账在有市集的城开一间私塾：
//   ① 租屋开塾：一次性 120 铜钱（按城记——一城一塾），学识不到 30 不收蒙童（误人子弟的事不干）；
//   ② 授课：每日至多一堂（两个时辰真扣），束脩 = 12 + 学识/10 铜钱（安稳钱，发不了财）；
//   ③ 蒙童名册：每堂课有概率新蒙童入学（声望越高越多人送孩子来），一塾至多 30 人；
//      满 10 人「桃李初成」、满 25 人「一城之师」——各有一次声望/名望的明账进项；
//   ④ 暗线人脉：名册过 10 人后，每日有 10% 概率有出师的老学生回来看先生——
//      带礼（铜钱 20-60），人在城里哪一行（药铺/镖局/书肆/官府/商队）随他来时说；
//   ⑤ 教化功德：在本城每教满 5 日，恶名洗去 1 点（只洗恶名，不动官府通缉的热度——
//      读书人化的是街面上的名声，化不掉案底的账；这是明账，不是洗白后门）。
// 口径：铜钱/声望/名望走 RewardService；时辰走 advanceTime；恶名走 charData.notoriety 直写
//   （易容账/著书账同款口径）；风声走 playerPushDeed；私塾账落 StateRegistry 'privateSchool' 正门。
(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    var CFG = {
        FOUND_COPPER: 120,        // 租屋开塾（一城一次）
        SCHOL_GATE: 30,           // 学识门槛
        TEACH_MIN: 120,           // 一堂课的时辰
        PAY_BASE: 12,             // 束脩底子（铜钱）
        PAY_SCHOL_DIV: 10,        // 学识加成除数
        STUDENT_BASE_P: 0.5,      // 新蒙童入学底子
        STUDENT_REP_DIV: 200,     // 声望加成除数
        STUDENT_P_CAP: 0.9,
        MAX_STUDENTS: 30,         // 一塾至多几人
        MILESTONE_A: 10, MILESTONE_A_REP: 2,   // 桃李初成
        MILESTONE_B: 25, MILESTONE_B_FAME: 2,  // 一城之师
        VISIT_P: 0.10,            // 老学生回来看先生的日概率
        VISIT_NEED: 10,           // 名册过几人起有老学生
        VISIT_COPPER: [20, 60],   // 带的礼
        NOTO_DAYS: 5,             // 每教满几日洗 1 点恶名
        EDU_REP_DAYS: 10          // 每教满几日声望+1（教化一方）
    };

    var TRADES = ['药铺的掌柜', '镖局的镖师', '书肆的伙计', '官府的文书', '商队的管事', '绣坊的娘子', '船帮的头儿'];
    var _st = { schools: {}, day: -1, taughtDays: 0, visits: 0, notoWashed: 0 };
    // schools: { 城名: {foundedDay, students, teachDays, m10, m25} }

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
        } catch (e) { console.warn('[静默失败] js/city-facilities/private-school.js · absDay：日历没读出来，按零日算', e && e.message); return 0; }
        return 0;
    }
    function settle(spec, source, ct) {
        try {
            if (window.RewardService && typeof window.RewardService.apply === 'function') {
                var r = window.RewardService.apply(spec, { facilitySpend: true, source: source || '私塾', city: ct || city() });
                return { ok: !!(r && r.success !== false), note: r && r.messages ? r.messages.join('、') : '' };
            }
        } catch (e) { console.warn('[静默失败] js/city-facilities/private-school.js · settle：这笔账没落成一笔', e && e.message); }
        return { ok: false, note: '' };
    }
    function advance(min, why) {
        try { if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') window.timeSystem.advanceTime(min, why); } catch (e) { console.warn('[静默失败] js/city-facilities/private-school.js · advance：时辰没扣成', e && e.message); }
    }
    function deed(mood, s) {
        try { if (typeof window.playerPushDeed === 'function') window.playerPushDeed(mood, s); } catch (e) { console.warn('[静默失败] js/city-facilities/private-school.js · deed：风声没递进传闻池', e && e.message); }
    }
    function growSchol(n, reason) {
        try { if (typeof window.growLifeSkill === 'function') window.growLifeSkill('学识', n, { reason: reason }); } catch (e) { console.warn('[静默失败] js/city-facilities/private-school.js · growSchol：教学的长进没落账', e && e.message); }
    }
    function refresh() {
        try { if (window.updateCharacterStatus) window.updateCharacterStatus(); } catch (e) { console.warn('[静默失败] js/city-facilities/private-school.js · refresh：面板没刷新', e && e.message); }
        try { if (typeof window.updateCurrencyUI === 'function') window.updateCurrencyUI(); } catch (e2) { console.warn('[静默失败] js/city-facilities/private-school.js · refresh：钱袋没刷新', e2 && e2.message); }
    }
    function schol() {
        try { if (typeof window.getLifeSkill === 'function') return Number(window.getLifeSkill('学识')) || 0; } catch (e) { console.warn('[静默失败] js/city-facilities/private-school.js · schol：学识没读出来，按零算', e && e.message); }
        return 0;
    }
    function repNow() { var c = cd(); return c ? (Number(c.cityReputation || c.reputation) || 0) : 0; }
    function schoolOk(ct) {
        try {
            var d = window.locationSystem && window.locationSystem.getCityData && window.locationSystem.getCityData(ct || city());
            if (!d || !d.buildings) return false;
            return d.buildings.indexOf('market') >= 0 || d.buildings.indexOf('shop') >= 0;
        } catch (e) { console.warn('[静默失败] js/city-facilities/private-school.js · schoolOk：城里有没有街巷没问清，按没有算', e && e.message); return false; }
    }
    function rollDay() {
        var day = absDay();
        if (_st.day !== day) { _st.day = day; }
    }
    function schoolOf(ct) { return _st.schools[ct] || null; }
    function taughtToday(ct) {
        var s = schoolOf(ct);
        return !!(s && s.lastTeachDay === absDay());
    }

    // ============ ① 租屋开塾 ============
    function found(ct) {
        var c = cd();
        if (!c) { say('请先创建角色。', 'warning'); return false; }
        var town = norm(ct || city());
        if (!town) { say('🏫 你不在城里——私塾开在城中街巷。', 'info'); return false; }
        if (!schoolOk(town)) { say('🏫 ' + town + '没有合适的街巷屋舍——私塾开不起来。', 'info'); return false; }
        if (schoolOf(town)) { say('🏫 你在' + town + '已经有一间私塾了——一城一塾，教不过来两家。', 'info'); return false; }
        if (schol() < CFG.SCHOL_GATE) { say('🏫 开蒙授业要学识 ' + CFG.SCHOL_GATE + '——你的学问（' + schol() + '）还不够，误人子弟的事不干。', 'warning'); return false; }
        var pay = settle({ copper: -CFG.FOUND_COPPER }, '租屋开塾', town);
        if (!pay.ok) { say('🏫 屋舍租钱 ' + CFG.FOUND_COPPER + ' 铜钱没能付出去——房东不赊账。', 'warning'); return false; }
        _st.schools[town] = { foundedDay: absDay(), students: 0, teachDays: 0, m10: false, m25: false, lastTeachDay: -1 };
        deed('good', '你在' + town + '租屋开了一间私塾——街上人家都说来了位教书先生');
        log('🏫 你在' + town + '的街巷里租下一间屋舍，挂上「启蒙私塾」的木牌（租钱 ' + CFG.FOUND_COPPER + ' 铜钱）。头一日便有街坊扒着门框往里看：「先生收蒙童不？」', 'success');
        say('🏫 ' + town + '的私塾开张了。（学识 ' + schol() + ' · 明日便可授课）', 'success');
        refresh();
        open();
        return true;
    }
    function norm(s) { return String(s || '').replace(/\s+/g, ''); }

    // ============ ② 授课 ============
    function teach(rng) {
        rollDay();
        var c = cd();
        if (!c) { say('请先创建角色。', 'warning'); return false; }
        var ct = norm(city());
        var s = schoolOf(ct);
        if (!s) { say('🏫 你在' + (ct || '这座城') + '还没有私塾——先租屋开塾。', 'info'); return false; }
        if (taughtToday(ct)) { say('🏫 今日已授过一堂——蒙童们都散学了，明日请早。（每日至多一堂）', 'info'); return false; }
        var rr = (typeof rng === 'function') ? rng : Math.random;
        advance(CFG.TEACH_MIN, '私塾授课');
        s.lastTeachDay = absDay();
        s.teachDays += 1;
        _st.taughtDays += 1;

        // 束脩（安稳钱）
        var pay = CFG.PAY_BASE + Math.floor(schol() / CFG.PAY_SCHOL_DIV);
        settle({ copper: pay }, '束脩', ct);
        growSchol(1, '教学相长');

        // ③ 新蒙童入学
        var newWord = '';
        if (s.students < CFG.MAX_STUDENTS) {
            var p = Math.min(CFG.STUDENT_P_CAP, CFG.STUDENT_BASE_P + repNow() / CFG.STUDENT_REP_DIV);
            if (rr() < p) {
                s.students += 1;
                newWord = '散学时，街坊领着个攥紧书包带的小童来拜先生——名册上添了一笔。（蒙童 ' + s.students + '/' + CFG.MAX_STUDENTS + '）';
            }
        }
        // 里程碑（一城一次）
        var mileWord = '';
        if (!s.m10 && s.students >= CFG.MILESTONE_A) {
            s.m10 = true;
            settle({ cityReputation: CFG.MILESTONE_A_REP }, '桃李初成', ct);
            deed('good', '你的私塾教出了名声——' + ct + '满街的孩子都念你教的开蒙诗');
            mileWord = '（桃李初成：名册满 ' + CFG.MILESTONE_A + ' 人，声望+' + CFG.MILESTONE_A_REP + '）';
        }
        if (!s.m25 && s.students >= CFG.MILESTONE_B) {
            s.m25 = true;
            settle({ fame: CFG.MILESTONE_B_FAME }, '一城之师', ct);
            deed('good', ct + '的人提起你都称一声「先生」——一城之师，桃李满巷');
            mileWord = '（一城之师：名册满 ' + CFG.MILESTONE_B + ' 人，名望+' + CFG.MILESTONE_B_FAME + '）';
        }
        // ⑤ 教化功德：每教满 5 日洗 1 点恶名（只洗恶名，不动官府热度——明账）
        var washWord = '';
        if (s.teachDays % CFG.NOTO_DAYS === 0 && (Number(c.notoriety) || 0) > 0) {
            c.notoriety = Math.max(0, (Number(c.notoriety) || 0) - 1);
            // v27.13 恶名分城：直写后同步记进世界账簿（书声先洗本地人心里那本账）
            try { if (window.WorldLedger && typeof window.WorldLedger.noteNotorietyChange === 'function') window.WorldLedger.noteNotorietyChange(-1); } catch (eWN4) {}
            _st.notoWashed += 1;
            washWord = '（教化一方：教满 ' + s.teachDays + ' 日，街面上的恶名洗去 1 点，余 ' + c.notoriety + '——官府案底的热度是另一本账，书声化不掉）';
        }
        // 每教满 10 日声望+1（教化一方的细水长流）
        var repWord = '';
        if (s.teachDays % CFG.EDU_REP_DAYS === 0) {
            settle({ cityReputation: 1 }, '教化一方', ct);
            repWord = '（教满 ' + s.teachDays + ' 日，本城声望+1）';
        }
        log('🏫 ' + ct + '的私塾里书声琅琅——你领着蒙童们认字断句，一晃两个时辰。（束脩 ' + pay + ' 铜钱，学识+1）' + newWord + mileWord + washWord + repWord, 'success');
        say('🏫 授完一堂——束脩 ' + pay + ' 铜钱，学识+1。' + (newWord ? '名册添了一笔。' : '') + mileWord + washWord + repWord, 'success');
        refresh();
        open();
        return true;
    }

    // ============ ④ 老学生回来看先生（每日账） ============
    function dailyCheck(rng) {
        var rr = (typeof rng === 'function') ? rng : Math.random;
        var names = [];
        for (var k in _st.schools) if (_st.schools[k] && _st.schools[k].students >= CFG.VISIT_NEED) names.push(k);
        if (names.length === 0) return false;
        if (rr() >= CFG.VISIT_P) return false;
        var town = names[Math.floor(rr() * names.length) % names.length];
        var lo = CFG.VISIT_COPPER[0], hi = CFG.VISIT_COPPER[1];
        var gift = lo + Math.floor(rr() * (hi - lo + 1));
        var trade = TRADES[Math.floor(rr() * TRADES.length) % TRADES.length];
        _st.visits += 1;
        settle({ copper: gift }, '老学生的礼', town);
        log('🏫 一个后生提着一包点心站在' + town + '私塾门口，长揖到地：「先生，学生来看您了——如今在城里当' + trade + '，蒙童时多亏先生开蒙。」临走把 ' + gift + ' 铜钱压在砚台下，怎么推都推不掉。（暗线人脉：你教过的孩子，长成了城里各行的人）', 'success');
        say('🏫 ' + town + '的老学生回来看你——如今当' + trade + '，留下 ' + gift + ' 铜钱的心意。', 'success');
        refresh();
        return true;
    }

    // ============ 牌面 ============
    function open() {
        rollDay();
        if (!cd()) { say('请先创建角色。', 'warning'); return false; }
        var ct = norm(city());
        if (!ct) { say('🏫 你不在城里——私塾开在城中街巷。', 'info'); return false; }
        if (!schoolOk(ct)) { say('🏫 ' + ct + '没有合适的街巷屋舍——私塾开不起来。', 'info'); return false; }
        var btn = 'class="w-full p-3 rounded mb-2 text-left text-sm text-white hover:opacity-90"';
        var s = schoolOf(ct);
        var html;
        if (!s) {
            html = '<p class="text-sm text-gray-400 mb-2">街巷里有间空屋舍待租，房东说：「开私塾正好——左邻右舍的孩子多得没处认字。」（你的学识 ' + schol() + '，门槛 ' + CFG.SCHOL_GATE + '）</p>' +
                '<button onclick="window.PrivateSchool.found()" ' + btn.replace('p-3', 'bg-sky-900 p-3') + '>🏫 租屋开塾（一次性 ' + CFG.FOUND_COPPER + ' 铜钱 · 一城一塾 · 学识 ' + CFG.SCHOL_GATE + ' 起收蒙童）</button>' +
                '<p class="text-[11px] text-gray-500 mt-1">明账：每日一堂课（' + CFG.TEACH_MIN + ' 分钟），束脩 ' + CFG.PAY_BASE + '+学识/' + CFG.PAY_SCHOL_DIV + ' 铜钱——安稳钱，发不了财；名册满 ' + CFG.MILESTONE_A + '/' + CFG.MILESTONE_B + ' 人各有一次声望/名望进项；每教满 ' + CFG.NOTO_DAYS + ' 日洗 1 点恶名（不动官府案底的热度）。</p>';
        } else {
            html = '<p class="text-sm text-gray-400 mb-2">' + ct + '私塾 · 你是这儿的先生。（开塾第 ' + Math.max(1, absDay() - (Number(s.foundedDay) || 0)) + ' 日 · 学识 ' + schol() + '）</p>' +
                '<p class="text-xs text-gray-500 mb-2">蒙童名册 ' + s.students + '/' + CFG.MAX_STUDENTS + ' 人 · 本城授课 ' + s.teachDays + ' 堂（每满 ' + CFG.NOTO_DAYS + ' 堂洗 1 点恶名，还差 ' + (((CFG.NOTO_DAYS - (s.teachDays % CFG.NOTO_DAYS)) % CFG.NOTO_DAYS) || CFG.NOTO_DAYS) + ' 堂） · 老学生回来看过 ' + _st.visits + ' 回' + (s.m10 ? ' · <span class="text-emerald-300">桃李初成</span>' : '') + (s.m25 ? ' · <span class="text-amber-300">一城之师</span>' : '') + '</p>' +
                (taughtToday(ct) ? '<p class="text-xs text-amber-300 mb-2">今日已授过一堂——蒙童散学了，明日请早。</p>' :
                    '<button onclick="window.PrivateSchool.teach()" ' + btn.replace('p-3', 'bg-sky-900 p-3') + '>📖 授课一堂（' + CFG.TEACH_MIN + ' 分钟 · 束脩 ' + (CFG.PAY_BASE + Math.floor(schol() / CFG.PAY_SCHOL_DIV)) + ' 铜钱 · 学识+1 · 可能有新蒙童入学）</button>');
        }
        if (typeof window.showBuildingEffectDialog === 'function') {
            window.showBuildingEffectDialog('🏫 启蒙私塾 · ' + ct, html);
            return true;
        }
        return false;
    }

    // ============ 存读档（StateRegistry 正门） ============
    function _export() { return JSON.parse(JSON.stringify(_st)); }
    function _import(d) {
        var st = { schools: {}, day: -1, taughtDays: 0, visits: 0, notoWashed: 0 };
        if (d && typeof d === 'object') {
            if (d.schools && typeof d.schools === 'object') {
                for (var k in d.schools) {
                    var s = d.schools[k];
                    if (!s || typeof s !== 'object') continue;
                    st.schools[String(k).slice(0, 30)] = {
                        foundedDay: Math.max(0, Math.floor(Number(s.foundedDay)) || 0),
                        students: Math.max(0, Math.min(CFG.MAX_STUDENTS, Math.floor(Number(s.students)) || 0)),
                        teachDays: Math.max(0, Math.min(100000, Math.floor(Number(s.teachDays)) || 0)),
                        m10: !!s.m10, m25: !!s.m25,
                        lastTeachDay: Number.isFinite(Number(s.lastTeachDay)) ? Number(s.lastTeachDay) : -1
                    };
                }
            }
            st.day = Number.isFinite(Number(d.day)) ? Number(d.day) : -1;
            st.taughtDays = Math.max(0, Math.min(1000000, Math.floor(Number(d.taughtDays)) || 0));
            st.visits = Math.max(0, Math.min(100000, Math.floor(Number(d.visits)) || 0));
            st.notoWashed = Math.max(0, Math.min(100000, Math.floor(Number(d.notoWashed)) || 0));
        }
        _st = st;
    }
    function _reset() { _st = { schools: {}, day: -1, taughtDays: 0, visits: 0, notoWashed: 0 }; }
    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        window.StateRegistry.register('privateSchool', { version: 1, export: _export, import: _import, reset: _reset });
    }
    if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') {
        window.timeSystem.onNewDaySubscribe(function () { dailyCheck(); });
    }

    window.PrivateSchool = {
        CFG: CFG, TRADES: TRADES,
        schoolOk: schoolOk, schoolOf: schoolOf, taughtToday: taughtToday,
        found: found, teach: teach, dailyCheck: dailyCheck,
        open: open,
        state: _export
    };
    window.openPrivateSchool = function () { return open(); };
})();
