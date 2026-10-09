// ==================== v27.6 大业收官批 · 大业名册（新文件 grand-legacy.js） ====================
// 设计方案 H 引擎（压轴）：85 科举 · 86 捐官当城主 · 87 自创功法 · 88 著经立说 · 90 设坛传教 ·
//   91 受封土地公 · 92 称帝建国 · 93 办比武大会。
//   （89 自立宗门 = PlayerSect 现成账——插旗草创/开山立宗/宗门总册俱全，本册只立路标不重复建设。）
// 两条阶梯：仕途（科举三场 → 捐官城主 → 称帝建国）· 香火（设坛传教 → 受封土地公）；艺业线（自创功法/著经立说/比武大会）独立成章。
// 纪律：①全是一生一回的里程碑——做完入账、永不重复；科举落第来年再考（年戳），大会砸了三十日后再开（日戳）；
//       ②封神之后零日常维护——月初俸银/国贡与每日香火全挂新日订阅自动过账，零按钮、事不追人；
//       ③自创功法进融合功法同一本注册表（rehydrateMergedSkills 重载回册）——零新存档键；
//       ④比武大会三轮全是真仗（NpcCrime.startFlaggedBattle 正门，_isTourneyFight 旗，app.js 胜负钩成对）；
//       ⑤钱一笔事务走 RewardService；锁就亮锁（差什么写在牌面上）；成算价钱逐条明账；营生路不是印钞路。
(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    // 科举三场（明账）：乡试只秋闱、会试只春闱、殿试不挑时节——落第来年再考
    var EXAMS = [
        { stage: 1, name: '乡试', season: 'autumn', seasonName: '秋闱', need: 40, base: 0.30, cap: 0.85, en: 20, min: 240, rep: 3, schol: 2, stones: 0 },
        { stage: 2, name: '会试', season: 'spring', seasonName: '春闱', need: 55, base: 0.28, cap: 0.82, en: 25, min: 300, rep: 5, schol: 2, stones: 30 },
        { stage: 3, name: '殿试', season: null, seasonName: '', need: 70, base: 0.35, cap: 0.90, en: 30, min: 360, rep: 10, schol: 3, stones: 100 }
    ];
    var RANK_TOP = ['状元', '榜眼', '探花'];
    var CFG = {
        OFFICE_COST: 800, OFFICE_REP_NEED: 20, OFFICE_REP_GAIN: 10, SALARY_BASE: 60,   // 86 捐官（须进士出身）
        EMP_COST: 1500, EMP_REP_NEED: 50, EMP_REP_GAIN: 20, EMP_MOOD: 20, EMP_FAME: 10, EMP_KARMA: -3, EMP_TRIBUTE: 150,   // 92 称帝
        PREACH_COST: 200, PREACH_TIER: 3, PREACH_KARMA: 10, PREACH_CAP: 999,          // 90 设坛传教
        EG_FOLLOWERS: 300, EG_KARMA: 30, EG_REP: 15, EG_KARMA_GAIN: 5,                // 91 土地公
        ART_COST: 500, ART_TIER: 4, ART_NEED_MASTERED: 3,                              // 87 自创功法
        SCRIPT_COST: 100, SCRIPT_SCHOL: 80, SCRIPT_TIER: 4, SCRIPT_REP: 10, SCRIPT_KARMA: 3, SCRIPT_SCHOL_GAIN: 5,   // 88 著经
        TOUR_COST: 300, TOUR_REP_NEED: 30, TOUR_ROUNDS: 3, TOUR_WIN_STONES: 500, TOUR_WIN_REP: 8, TOUR_WIN_FAME: 2, TOUR_LOSE_REP: 2, TOUR_FAIL_GAP: 30   // 93 比武大会
    };
    var ART_EFFECT = '攻击+12%，防御+8%，真气上限+10%';
    var SCRIPT_POOL = ['清静经', '心印篇', '长生书', '云笈玄文', '法藏集'];
    var ART_NAME_POOL = ['长生诀', '心印经', '云玄录', '混元真解', '无字书'];
    var ERA_POOL = ['天授', '建初', '洪武', '永熙', '太和', '开皇', '神凤', '麟德'];   // v27.9 年号池（改元自定，也可自拟）
    var TOUR_NAMES = [
        ['铁沙掌·雷横', '八州打擂人·曹彪', '疾雨剑·单廷', '关西大汉·鲁成'],
        ['白衣客·洛绳贤', '雪山门下·裴箫', '双钩震江南·邵氏', '塞外刀客·呼延平'],
        ['武林盟主·项九州', '剑仙亲传·叶青莲', '大内第一供奉·铁无衡', '魔门弃徒·燕狂沙']
    ];

    var _st = {
        examPassed: {},        // stage -> {day, rank?}
        examFailYear: {},      // stage -> 落第的年（同年不再进场）
        office: null,          // {city, day}
        emperor: null,         // {city, day, dynasty}
        faith: null,           // {city, followers, day}
        earthgod: null,        // {day}
        art: null,             // {id, name, day}
        scripture: null,       // {title, day, city}
        tourDone: null,        // {city, day}
        tourFailDay: 0,
        tourRound: 0, tourCity: '', tourDay: 0,   // 大会进行中（三轮真仗）
        echoPending: null, echoNextDay: 0,   // v27.15 回响账（招摇伪徒待了结 / 下一掷日）
        monthSettled: -1
    };

    // ============ 小工具（case-system 同款口径） ============
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
    function yearIdx() { return Math.floor(absDay() / 360); }
    function monthIdx() { return Math.floor(absDay() / 30); }
    function dice() { return (typeof window.__scenarioRng === 'function') ? window.__scenarioRng() : Math.random(); }
    function settle(spec, source) {
        try {
            if (window.RewardService && typeof window.RewardService.apply === 'function') {
                var r = window.RewardService.apply(spec, { source: source || '大业', city: city() });
                return { ok: !!(r && r.success !== false), note: r && r.messages ? r.messages.join('、') : '' };
            }
        } catch (e) { console.warn('[静默失败] js/grand-legacy.js · settle：这笔账没落成一笔', e && e.message); }
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
    function repVal(ct) { try { if (ct && typeof window.getReputationValue === 'function') return Number(window.getReputationValue(ct)) || 0; } catch (e) {} return 0; }
    function repUp(ct, n) { try { if (ct && n && typeof window.addReputation === 'function') window.addReputation(ct, n); } catch (e) {} }
    function repDown(ct, n) { try { if (ct && n && typeof window.reduceReputation === 'function') window.reduceReputation(ct, n); } catch (e) {} }
    function deed(mood, s) { try { if (typeof window.playerPushDeed === 'function') window.playerPushDeed(mood, s); } catch (e) {} }
    function advance(min, why) { try { if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') window.timeSystem.advanceTime(min, why); } catch (e) { console.warn('[静默失败] js/grand-legacy.js · advance：时辰没扣成', e && e.message); } }
    function refresh() { try { if (window.updateCharacterStatus) window.updateCharacterStatus(); } catch (e) {} }
    function skill(name) {
        try { if (typeof window.getLifeSkill === 'function') return Number(window.getLifeSkill(name)) || 0; } catch (e) {}
        var c = cd();
        return (c && c.lifeSkills && Number(c.lifeSkills[name])) || 0;
    }
    function grow(name, exp) { try { if (typeof window.growLifeSkill === 'function') window.growLifeSkill(name, exp || 1); } catch (e) {} }
    function seedOf(s) { var h = 0; s = String(s || ''); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
    function inCity() {
        var ct = city();
        if (!ct) return '';
        try { if (window.locationSystem && window.locationSystem.getCityData && !window.locationSystem.getCityData(ct)) return ''; } catch (e) {}
        return ct;
    }
    function seasonNow() { try { return (window.timeSystem && window.timeSystem.gameTime && window.timeSystem.gameTime.currentSeason) || ''; } catch (e) { return ''; } }
    function tierOf() { try { var c = cd(); if (c && c.realm && typeof window.getRealmTier === 'function') return Number(window.getRealmTier(c.realm)) || 0; } catch (e) {} return 0; }
    function journal(type, title, text) { try { if (window.WorldJournal && window.WorldJournal.record) window.WorldJournal.record({ type: type, title: title, text: text }); } catch (e) {} }
    function surname() { return String((cd() && cd().name) || '无').charAt(0); }
    // 凡进 DOM 的字不能不设防：功法名/经名/国号都源自玩家自拟或姓名，渲染前一律转义
    function esc(s) {
        if (typeof window.esc === 'function') { try { return window.esc(s); } catch (eE) {} }
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
        });
    }
    function salaryOf() {
        if (_st.emperor) return CFG.EMP_TRIBUTE;
        if (_st.office) return CFG.SALARY_BASE + Math.floor(repVal(_st.office.city) / 10);
        return 0;
    }

    // ============ 85 科举（乡试→会试→殿试，一年一场落第再考） ============
    function examP(ex) { return Math.min(ex.cap, ex.base + skill('学识') * 0.005); }
    function examOk(stage) {
        var ex = EXAMS[stage - 1];
        if (!ex) return { ok: false, why: '没有这一场。' };
        if (_st.examPassed[stage]) return { ok: false, why: '「' + ex.name + '」已经考过了' + (_st.examPassed[stage].rank ? '——你是一甲' + _st.examPassed[stage].rank : '——金榜题名，何须重考') + '。' };
        if (stage > 1 && !_st.examPassed[stage - 1]) return { ok: false, why: '还没过' + EXAMS[stage - 2].name + '——科举一级一级来，跳不得。' };
        var ct = inCity();
        if (!ct) return { ok: false, why: '你身在城外——考场在城里贡院。' };
        if (ex.season && seasonNow() !== ex.season) return { ok: false, why: ex.name + '只在' + ex.seasonName + '开考（如今是' + (seasonNow() || '淡季') + '）——科场有期，误了等来年。' };
        if (Number(_st.examFailYear[stage]) === yearIdx()) return { ok: false, why: '今年这一场你已经进过号舍了——落第不丢人，卷面要来年才肯再收。' };
        if (skill('学识') < ex.need) return { ok: false, why: '学识不足（须 ' + ex.need + '，现 ' + skill('学识') + '）——号舍里的文章，糊弄不了考官。' };
        return { ok: true, city: ct, ex: ex };
    }
    function sitExam(stage) {
        var g = examOk(stage);
        if (!g.ok) { say('📜 ' + g.why, 'warning'); return false; }
        var ex = g.ex;
        var p = examP(ex);
        var costSpec = { energy: -ex.en };
        var before = settle(costSpec, '进场应试');
        if (!before.ok) { say('📜 你乏得进不了号舍——连考数日的体力都没有，先歇足了再来。', 'warning'); return false; }
        advance(ex.min, ex.name + '应试');
        _st.examFailYear[stage] = yearIdx();   // 进过号舍就算今年考过——成败都占年戳
        if (dice() >= p) {
            log('📜 ' + ex.name + '落第了。放榜那日你在榜下站了半晌——榜上没有你。（成算 ' + Math.round(p * 100) + '%，来年' + (ex.seasonName ? ex.seasonName + '再考' : '再考') + '）', 'warning');
            say('📜 ' + ex.name + '落第——文章憎命达，来年再进场。', 'warning');
            refresh();
            return false;
        }
        _st.examPassed[stage] = { day: absDay() };
        var gain = { rep: ex.rep, schol: ex.schol, stones: ex.stones };
        var rankTxt = '';
        if (stage === 3) {
            // 一甲三名：学识 85 以上才摸得着一甲的边（三成），余下二甲/三甲按骰分——名次进族谱也进国史
            var seed = seedOf(pkCity(g.city) + '_rank_' + absDay());
            var rr = dice();
            if (skill('学识') >= 85 && rr < 0.30) {
                var rank = RANK_TOP[seed % 3];
                _st.examPassed[3].rank = rank;
                rankTxt = '一甲第' + (RANK_TOP.indexOf(rank) + 1) + '名·' + rank;
                repUp(g.city, 12);
                settle({ stones: 300, fame: 2 }, '御赐花红');
                deed('good', '你殿试对策天子亲览，擢一甲' + rank + '——琼林宴上你坐头一席，跨马游街，满城都在看新科' + rank + '。');
                journal('endgame', '金榜题名', '殿试放榜，你以一甲' + rank + '及第——御笔亲点，琼林赐宴。泥金帖子发回' + g.city + '那日，报喜的锣敲了半条街。');
            } else if (rr < 0.65) {
                rankTxt = '二甲进士出身';
                _st.examPassed[3].rank = '二甲进士';
            } else {
                rankTxt = '三甲同进士出身';
                _st.examPassed[3].rank = '三甲同进士';
            }
        }
        settle({ stones: gain.stones || 0 }, '金榜花红');
        repUp(g.city, gain.rep);
        grow('学识', gain.schol);
        if (stage < 3) deed('good', '你' + ex.name + '高中——放榜那日报喜的锣敲到了家门口，' + g.city + '的街坊都说祖坟冒了青烟。');
        log('📜 ' + ex.name + '高中！' + (rankTxt ? '【' + rankTxt + '】' : '') + '（城望+' + gain.rep + (gain.stones ? ' 灵石+' + gain.stones : '') + (stage === 3 && _st.examPassed[3].rank === '状元' ? ' 御赐花红另 300 灵石' : '') + ' 学识+' + gain.schol + '）', 'success');
        say('📜 金榜题名！' + (rankTxt ? '你是一甲' + _st.examPassed[3].rank + '——' : '') + ex.name + '过了。（城望+' + gain.rep + '）', 'success');
        if (stage === 3) journal('endgame', '进士及第', '你从' + g.city + '的号舍一路考到金銮殿——' + (rankTxt || '进士及第') + '。官身自此有了，捐官赴任的门也开了。');
        refresh();
        open();
        return true;
    }

    // ============ 86 捐官当城主（进士出身才有官身） ============
    function officeOk() {
        if (_st.emperor) return { ok: false, why: '你已面南称孤——一城之主的官身早翻篇了。' };
        if (_st.office) return { ok: false, why: '你已是' + _st.office.city + '城主——一印不掌两城。' };
        if (!_st.examPassed[3]) return { ok: false, why: '没有进士官身，吏部铨选轮不到你——先过殿试，或另寻门路。（明账：捐官只认进士出身）' };
        var ct = inCity();
        if (!ct) return { ok: false, why: '你身在城外——赴任要在城里接印。' };
        if (repVal(ct) < CFG.OFFICE_REP_NEED) return { ok: false, why: '城望不足 ' + CFG.OFFICE_REP_NEED + '（现 ' + repVal(ct) + '）——民心不服，吏部不敢铨你于此。' };
        if (stonesNow() < CFG.OFFICE_COST) return { ok: false, why: '捐官的部费要 ' + CFG.OFFICE_COST + ' 灵石（现 ' + stonesNow() + '）。' };
        return { ok: true, city: ct };
    }
    function takeOffice() {
        var g = officeOk();
        if (!g.ok) { say('🏛️ ' + g.why, 'warning'); return false; }
        var r = settle({ stones: -CFG.OFFICE_COST }, '捐官部费');
        if (!r.ok) { say('🏛️ 部费凑不齐——吏部的门槛是钱铺的，一文不能少。', 'warning'); return false; }
        _st.office = { city: g.city, day: absDay() };
        repUp(g.city, CFG.OFFICE_REP_GAIN);
        deed('good', '新科进士捐官赴任，' + g.city + '来了位新城主——接印那日四门施粥，百姓都说这位老爷面善。');
        journal('endgame', '捐官赴任', '你以进士官身捐得' + g.city + '城主之职。官印入手沉甸甸的——从此每月初一有俸银上门，城里的事，你说了算三分。');
        log('🏛️ 你接了' + g.city + '的城主印！（城望+' + CFG.OFFICE_REP_GAIN + '）每月初一自动过账俸银 ' + salaryOf() + ' 灵石（60 + 城望/10，明账）——零按钮，钱自己会走路。', 'success');
        refresh();
        open();
        return true;
    }

    // ============ 92 称帝建国（仕途线的顶点，压轴） ============
    function emperorOk() {
        if (_st.emperor) return { ok: false, why: '你已称帝建元「' + _st.emperor.dynasty + '」——天无二日。' };
        if (!_st.office) return { ok: false, why: '连一城之主都没做过就想面南——先捐官当城主，把印把子攥热了再说。' };
        if (tierOf() < 4) return { ok: false, why: '修为不到元婴（现 ' + ((cd() && cd().realm) || '凡人') + '）——凡躯坐不稳龙椅，压不住气运。' };
        if (repVal(_st.office.city) < CFG.EMP_REP_NEED) return { ok: false, why: _st.office.city + '城望不足 ' + CFG.EMP_REP_NEED + '（现 ' + repVal(_st.office.city) + '）——民心不归，黄袍加身也是笑话。' };
        if (stonesNow() < CFG.EMP_COST) return { ok: false, why: '登基大典要 ' + CFG.EMP_COST + ' 灵石（筑坛、法驾、赏赐三军），现 ' + stonesNow() + '。' };
        return { ok: true };
    }
    // ============ v27.9 登基大典：六步仪程（劝进→筑坛→加衮冕→改元→册礼→大赦） ============
    // 称帝类似结局级的大节点，不该一键了事——一步一步走完这套礼，钱到「大典礼成」那步才扣。
    // 男女有别：男修为「帝」（黄袍加身），女修为「后」（临朝称制）；道侣随性别册「后」或「皇夫」。
    var _proclaimEra = '';   // 大典进行中的年号（只存内存——中断重走，钱没扣就不留账）
    function isFemale() { return !!(cd() && cd().gender === 'female'); }
    function rulerWord() { return isFemale() ? '后' : '帝'; }
    function consortOf() {
        try {
            var db = (typeof window.getDaoCompanionBond === 'function') ? window.getDaoCompanionBond() : null;
            if (!db) return null;
            var nm = '';
            try { var npc = window.npcManager && window.npcManager.getNPC(db.id); nm = (npc && npc.name) || ''; } catch (eN) {}
            return { name: String(nm || '结发之人').slice(0, 12), title: isFemale() ? '皇夫' : '后' };
        } catch (e) { return null; }
    }
    function defaultEra() { return ERA_POOL[seedOf('era_' + absDay() + '_' + surname()) % ERA_POOL.length]; }
    function eraSugg() {
        var seed = seedOf('era_' + absDay() + '_' + surname());
        return [ERA_POOL[seed % ERA_POOL.length], ERA_POOL[(seed >>> 3) % ERA_POOL.length], ERA_POOL[(seed >>> 6) % ERA_POOL.length]];
    }
    function proclaimPanel(stage) {
        var g = emperorOk();
        if (!g.ok) { say('👑 ' + g.why, 'warning'); return false; }
        var city = _st.office.city, fem = isFemale(), co = consortOf();
        var kids = 0;
        try { kids = (cd() && Array.isArray(cd()._children)) ? cd()._children.length : 0; } catch (eK) {}
        var cb = 'class="w-full bg-yellow-700 hover:bg-yellow-600 text-white text-sm px-3 py-2 rounded mt-2"';
        var html = '';
        if (stage === 1) {
            html = '<p class="text-sm text-gray-300 leading-relaxed mb-2">文武百官联名上表，伏阙劝进：「天命不可以久旷，神器不可以无主。」表文已经递了三回——按礼数，你要辞让一回，他们才会再请。</p>' +
                '<p class="text-xs text-gray-500 mb-2">明账：大典礼成那步才扣 ' + CFG.EMP_COST + ' 灵石（筑坛、法驾、赏赐三军）；中途散了，分文不动。</p>' +
                '<button onclick="window.GrandLegacy.proclaimPanel(2)" ' + cb + '>📜 辞让一回，再受表——礼数已备</button>';
        } else if (stage === 2) {
            html = '<p class="text-sm text-gray-300 leading-relaxed mb-2">' + esc(city) + '南郊，三层坛已筑好。柴垛齐天高，玉帛陈列，太常寺的官在坛下候着——告天的祝文写好了，只等你升坛。</p>' +
                '<button onclick="window.GrandLegacy.proclaimPanel(3)" ' + cb + '>🔥 升坛，告天</button>';
        } else if (stage === 3) {
            html = '<p class="text-sm text-gray-300 leading-relaxed mb-2">' + (fem
                ? '十二章节的衮服加在你身上，凤冠压鬓。礼官唱赞的声音在发抖——他这辈子没赞过这一出。自今日起你临朝称制：你不是谁的妻，你是「后」，是一国之君。'
                : '黄袍自你肩头披下。礼官唱赞，丹墀之下鸦雀无声——自今日起你面南背北，是这天下名义所归的那个人。') + '</p>' +
                '<button onclick="window.GrandLegacy.proclaimPanel(4)" ' + cb + '>👑 即位，面南</button>';
        } else if (stage === 4) {
            html = '<p class="text-sm text-gray-300 leading-relaxed mb-2">礼部尚书出列：「陛下受命之初，宜改元以新天下耳目。」——年号是你这一朝的门面，往后的史书、诏令、编年，都从这两个字起头。</p>' +
                '<input id="legacy-era-name" maxlength="4" placeholder="四字以内" class="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-gray-100 mb-2">' +
                '<div class="flex gap-2 mb-2">' + eraSugg().map(function (n) {
                    return '<button onclick="document.getElementById(\'legacy-era-name\').value=\'' + n + '\'" class="bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs px-2 py-1 rounded">' + n + '</button>';
                }).join('') + '</div>' +
                '<button onclick="window.GrandLegacy.proclaimReadEra()" ' + cb + '>📅 建元，布告天下（留空则用「' + defaultEra() + '」）</button>';
        } else if (stage === 5) {
            html = '<p class="text-sm text-gray-300 leading-relaxed mb-2">' + (co
                ? '中宫册礼：结发之人「' + esc(co.name) + '」当册为' + (co.title === '后' ? '皇后' : '皇夫') + '——诏书已拟好，只等你用玺。'
                : '中宫虚悬。礼部请旨：册立之事，可俟异日——史官已经在实录里记了一笔「中宫未建」。') + '</p>' +
                (kids ? '<p class="text-xs text-gray-400 mb-2">膝下皇子女 ' + kids + ' 人，玉牒已录入宗正寺——他日东宫之选，从这里出。</p>' : '') +
                '<button onclick="window.GrandLegacy.proclaimPanel(6)" ' + cb + '>' + (co ? '📿 用玺，册礼成' : '📿 中宫俟异日，礼成') + '</button>';
        } else {
            html = '<p class="text-sm text-gray-300 leading-relaxed mb-2">最后一道诏：大赦天下——除十恶不赦外，罪无大小咸赦除之。三军赏赐、百姓免赋，山呼万岁的声浪掀了半座城的瓦。</p>' +
                '<p class="text-xs text-gray-500 mb-2">大典总账（此刻才扣）：' + CFG.EMP_COST + ' 灵石（现 ' + stonesNow() + '） · 国号「大' + esc(surname()) + '」 · 建元「' + esc(_proclaimEra || defaultEra()) + '」 · 业障' + CFG.EMP_KARMA + '（杀伐篡位） · 城望+' + CFG.EMP_REP_GAIN + ' · 名望+' + CFG.EMP_FAME + ' · 心境+' + CFG.EMP_MOOD + ' · 俸银改国贡 ' + CFG.EMP_TRIBUTE + '</p>' +
                '<button onclick="window.GrandLegacy.doProclaim()" ' + (stonesNow() >= CFG.EMP_COST ? cb : 'class="w-full bg-gray-700 text-gray-400 text-sm px-3 py-2 rounded mt-2" disabled') + '>🎊 大典礼成' + (stonesNow() >= CFG.EMP_COST ? '' : '（灵石不够——大典的钱一样都省不得）') + '</button>';
        }
        html += '<button onclick="window.openGrandLegacy()" class="w-full mt-2 p-2 rounded text-xs text-gray-400 hover:text-gray-300">↩️ 回大业名册</button>';
        if (typeof window.showModal === 'function') { window.showModal('👑 登基大典 · 第' + stage + '仪', html); return true; }
        return false;
    }
    function proclaimReadEra() {
        try { var el = document.getElementById('legacy-era-name'); _proclaimEra = String((el && el.value) || '').trim().slice(0, 4); } catch (eR) { _proclaimEra = ''; }
        return proclaimPanel(5);
    }
    function doProclaim(eraName) {
        var g = emperorOk();
        if (!g.ok) { say('👑 ' + g.why, 'warning'); return false; }
        var r = settle({ stones: -CFG.EMP_COST, mood: CFG.EMP_MOOD, fame: CFG.EMP_FAME, karma: CFG.EMP_KARMA }, '登基大典');
        if (!r.ok) { say('👑 大典的钱凑不齐——筑坛的法驾、赏赐三军的银子，一样都省不得。', 'warning'); return false; }
        eraName = String(eraName != null ? eraName : (_proclaimEra || '')).trim().slice(0, 4);
        if (!eraName) eraName = defaultEra();
        var dynasty = '大' + surname();
        var fem = isFemale(), co = consortOf();
        var kids = 0;
        try { kids = (cd() && Array.isArray(cd()._children)) ? cd()._children.length : 0; } catch (eK2) {}
        _st.emperor = { city: _st.office.city, day: absDay(), dynasty: dynasty, eraName: eraName, consort: co };
        repUp(_st.office.city, CFG.EMP_REP_GAIN);
        deed('good', dynasty + '开国了——' + (fem ? '她临朝称制' : '他面南背北') + '，筑坛于' + _st.office.city + '之南，告天即位，建元「' + eraName + '」，大赦天下。' + (co ? '册' + co.name + '为' + (co.title === '后' ? '皇后' : '皇夫') + '，' : '') + '三军赏赐、百姓免赋，山呼万岁的声浪掀了半座城的瓦。');
        journal('endgame', fem ? '称制建国' : '称帝建国', '你以' + _st.office.city + '为都，国号「' + dynasty + '」，建元「' + eraName + '」，祭天即位' + (co ? '，册' + co.name + '为' + (co.title === '后' ? '皇后' : '皇夫') : '，中宫虚悬以待') + (kids ? '。膝下皇子女 ' + kids + ' 人，玉牒入宗正寺' : '') + '。从号舍里一个落第的书生（或是白身的捐官），到' + (fem ? '临朝称制——史书写你为「后」，一字不改' : '面南背北') + '——这一路你自己走来的，史官会替你记着。');
        log('👑 ' + (fem ? '衮冕加身，你临朝称制了' : '黄袍加身，你称帝了') + '！国号「' + dynasty + '」，建元「' + eraName + '」，定都' + _st.office.city + '。' + (co ? '册' + co.name + '为' + (co.title === '后' ? '皇后' : '皇夫') + '。' : '中宫虚位。') + '（城望+' + CFG.EMP_REP_GAIN + ' 心境+' + CFG.EMP_MOOD + ' 名望+' + CFG.EMP_FAME + ' 杀伐篡位的业障' + CFG.EMP_KARMA + '）每月初一的俸银自此改作国贡 ' + CFG.EMP_TRIBUTE + ' 灵石。往后编年史、朝堂诏令，都从「' + eraName + '元年」起头。', 'success');
        // v27.13：世界年表（模块⑬）——「谁登基」最正统的结算点：大典礼成这一刻
        //（灵石在上头 settle 那一步才扣、帝账 _st.emperor 已落定，分文账都不动，只添一页史）。
        // 史官记天下事：国号/建元/定都入史册，带玩家名，城记都城（节流键）。年表缺席静默不记，零风险。
        try {
            if (window.WorldLedger && typeof window.WorldLedger.recordAnnal === 'function') {
                var _empName = (cd() && cd().name && String(cd().name).trim()) ? String(cd().name).trim() : '无名氏';
                window.WorldLedger.recordAnnal('enthroned', (fem ? _empName + '临朝称制' : _empName + '即皇帝位') + '，定都' + _st.office.city + '，国号「' + dynasty + '」，建元「' + eraName + '」，大赦天下。', _st.office.city);
            }
        } catch (eAnnal) {}
        // v27.13 模块⑫回写②：名气全库重算——登基是天下事，走 noteFameChange 正门记一笔「开国之名」。
        // 幅度克制：8~15 按国号+日播种（一生一回，天然不刷）；都城当日立知，外城随商旅按名气扩散的
        // 节奏到站——全库每城的 fameSeen 都经这一笔抬一截，这就是「全库重算」的本账走法，不开直写旁门。
        // 与上文 settle({fame:+10}) 是两回事：那笔是「这个人有名」（玩家个人名望），这笔是「这个朝代立国」
        // （天下之事，幅度另计）。城望侧：城望是本地民心，只记都城（上方 repUp +20 既有账）——民心不是
        // 新闻，名气才是，外城城望不动。WorldLedger 缺席=跳过不炸。
        try {
            if (window.WorldLedger && typeof window.WorldLedger.noteFameChange === 'function') {
                var _found = 8 + seedOf('found_' + dynasty + '_' + absDay()) % 8;   // 8~15，克制的体面
                window.WorldLedger.noteFameChange(_found);
                log('👑 开国之名随商旅出京——天下各城陆续听说「' + dynasty + '」立国了（名气+' + _found + '，外城隔日到站）。', 'info');
            }
        } catch (eEcho) { console.warn('[静默失败] js/grand-legacy.js · doProclaim：开国名气没记进世界账', eEcho && eEcho.message); }
        _proclaimEra = '';
        refresh();
        open();
        return true;
    }

    // ============ v27.13 模块⑫回写③：朝代口径读口（告示/官员称呼换国号的门） ============
    // 盘点底账（2026-10-07 动刀前全库 grep）：城里告示/官员称呼的既有文案落点——
    //   · js/city-facilities/city-voices.js = 分城建筑口吻（酒楼/客栈/茶馆开场白，静态词表，无告示牌面）；
    //   · js/city-facilities/city-gate.js = 入城税一句门卒话，无牌面；
    //   · 告示墙单句散在 js/core/world-teeth.js:57 与 js/city-facilities/facility-batch2.js:473（黑市语境的静态词）；
    //   · 官员对玩家的称呼真源在 js/npcs/**、js/city-facilities/facility-offices.js、case-system.js——均本轮禁改域。
    // 结论：非禁改域里没有一处现成的「城告示/官称」牌面可换口径——按预案不硬造大面积 UI，先把读口备好：
    // 日后动到上述文件的批次，凡要朝代口径，读 window.GrandLegacy.dynastyVoice(kind) 一扇门即可；
    // 无帝（登基前）一律返回 ''——读方拿到空串就走原有文案，零风险。
    function dynastyVoice(kind) {
        var e = _st.emperor;
        if (!e || !e.dynasty) return '';
        var fem = isFemale();
        var yr = e.day ? Math.max(1, Math.floor((absDay() - e.day) / 360) + 1) : 1;
        switch (String(kind || '')) {
            case 'dynasty': return e.dynasty;                               // 国号
            case 'ruler': return fem ? '后' : '帝';                          // 帝/后称呼（与朝政史笔同款）
            case 'era': return e.eraName ? (e.eraName + yr + '年') : ('开国第' + yr + '年');   // 年号纪年（无年号回落开国纪年）
            case 'notice':   // 城门/衙署的安民告示头（文案落点找到后直接嵌牌面用）
                return '【' + e.dynasty + '告示】' + (e.eraName ? (e.eraName + '元年') : '开国伊始') + '，新朝布告四方：关津照旧，市井如常，赋税自有明诏。';
            default: return '';
        }
    }

    // ==================== v27.13 模块⑫新增：大业之间的连锁（世界修正表） ====================
    // 档案两例的落位说明（先盘再接，全库核查过）：大业清单里没有「藏书家/屠夫/猎户」三件——
    //   · 「藏书家+书院兴→学识类事件概率升」以【殿试及第+著经立说】落位：书成刊行、书院传抄，学而优则仕；
    //   · 「屠夫+猎户兴→肉价稳」以【设坛传教+受封土地公】落位：一方香火安，市面吃食平稳（民生物阜）。
    // 判据：两件大业均已完成态（只读 _st 既有完成账与 PlayerSect 现账——零新增状态键，读档回归不受影响）。
    // 纪律：①修正是「世界的脾气」不是数值外挂——事件概率乘区 1.15~1.25（≤1.5）、market 波动衰减 ≤2 倍
    //       既有回归率；②同类修正取最高一档、不叠乘（chainBoost 只回一个数）；③读口缺席/无完成=×1（无修正）。
    // 落点（全是既有参数，不发明新系统）：事件池权重乘区（daily-events tryTriggerDailyEvent）、
    //   market 食物自然回归（market-dynamic tickDay）；茶馆/说书彩蛋走 tale 类事件权重同一扇门。
    var CHAIN_TABLE = [
        // 每组人话：两件大业 → 世界结果
        { a: 'exam1', b: 'exam2', kind: 'scholar', mul: 1.15 },    // 乡试+会试连捷 → 城里纸墨贵，学子满街抄时文——学识类事件容易寻上门
        { a: 'exam3', b: 'scripture', kind: 'scholar', mul: 1.25 },// 殿试及第+著经立说 → 书院拿你的经当课本，学识之事闻风而来（档案例「藏书+书院」落位）
        { a: 'faith', b: 'earthgod', kind: 'food', mul: 1.5 },     // 设坛传教+受封土地公 → 一方香火安，猎户屠户的生意稳当——市面肉价稳（档案例「屠夫+猎户」落位）
        { a: 'earthgod', b: 'emperor', kind: 'food', mul: 1.4 },   // 受封土地公+称帝建国 → 正神护佑+开国大赦，与民休息——吃食行情平稳
        { a: 'office', b: 'emperor', kind: 'tale', mul: 1.2 },     // 捐官城主+称帝建国 → 城主而当天子——茶馆说书人有了新话本，市井话头围着你转
        { a: 'exam3', b: 'tour', kind: 'tale', mul: 1.2 },         // 殿试及第+比武大会夺魁 → 文状元自办大会——江湖庙堂都在传你的名
        { a: 'art', b: 'scripture', kind: 'scholar', mul: 1.2 },   // 自创功法+著经立说 → 道成了文字——求学问道的事寻上门
        { a: 'faith', b: 'scripture', kind: 'tale', mul: 1.15 },   // 设坛传教+著经立说 → 有经的道传得开——茶馆里都在讲你的经义
        { a: 'tour', b: 'office', kind: 'tale', mul: 1.15 },       // 比武大会+捐官城主 → 城主办大会——满城看客，市井闲话都是你
        { a: 'art', b: 'sect', kind: 'scholar', mul: 1.15 }        // 自创功法+自立宗门 → 宗门传自家的道——城中问道之风盛
    ];
    function chainDone(key) {
        switch (String(key || '')) {
            case 'exam1': return !!_st.examPassed[1];
            case 'exam2': return !!_st.examPassed[2];
            case 'exam3': return !!_st.examPassed[3];
            case 'office': return !!_st.office;
            case 'emperor': return !!_st.emperor;
            case 'faith': return !!_st.faith;
            case 'earthgod': return !!_st.earthgod;
            case 'art': return !!_st.art;
            case 'scripture': return !!_st.scripture;
            case 'tour': return !!_st.tourDone;
            case 'sect':   // 89 自立宗门=PlayerSect 现成账（路标不进 _st——读现账，缺席=未立）
                try {
                    var mine = (window.PlayerSect && typeof window.PlayerSect.listMySects === 'function') ? window.PlayerSect.listMySects() : null;
                    return !!(mine && mine.length);
                } catch (eS) { return false; }
            default: return false;
        }
    }
    // 读口：chainBoost(kind) → 该类世界修正的乘数（无完成=1）。绝不抛错——consumer 的热循环里直呼。
    function chainBoost(kind) {
        var best = 1;
        try {
            kind = String(kind || '');
            for (var i = 0; i < CHAIN_TABLE.length; i++) {
                var c = CHAIN_TABLE[i];
                if (c.kind !== kind) continue;
                if (chainDone(c.a) && chainDone(c.b) && c.mul > best) best = c.mul;
            }
        } catch (e) { return 1; }
        return best;
    }

    // ============ 90 设坛传教（香火线的起点） ============
    function preachOk() {
        if (_st.faith) return { ok: false, why: '坛已设在' + _st.faith.city + '——一处香火一处坛，贪多嚼不烂。' };
        var ct = inCity();
        if (!ct) return { ok: false, why: '你身在城外——设坛要在城里人烟处。' };
        if (tierOf() < CFG.PREACH_TIER) return { ok: false, why: '修为不到金丹（现 ' + ((cd() && cd().realm) || '凡人') + '）——自己的道都没成型，讲给谁听？' };
        var c = cd();
        var karma = Number((c && c.karma) || 0);
        if (karma < CFG.PREACH_KARMA) return { ok: false, why: '因果不足 ' + CFG.PREACH_KARMA + '（现 ' + karma + '）——手上不干净的人讲道，没人肯信。' };
        if (stonesNow() < CFG.PREACH_COST) return { ok: false, why: '筑坛施粥的开销要 ' + CFG.PREACH_COST + ' 灵石（现 ' + stonesNow() + '）。' };
        return { ok: true, city: ct };
    }
    function followersOf(ct) {
        var c = cd();
        var karma = Math.max(0, Number((c && c.karma) || 0));
        var n = 100 + Math.floor(repVal(ct) / 2) + karma * 3 + tierOf() * 10;
        if (_st.scripture) n = Math.floor(n * 1.5);   // 有著经立说的教义，信众来得快（明账写在按钮上）
        return Math.min(CFG.PREACH_CAP, n);
    }
    function doPreach() {
        var g = preachOk();
        if (!g.ok) { say('🕯️ ' + g.why, 'warning'); return false; }
        var r = settle({ stones: -CFG.PREACH_COST }, '设坛传教');
        if (!r.ok) { say('🕯️ 筑坛的钱凑不齐。', 'warning'); return false; }
        var n = followersOf(g.city);
        _st.faith = { city: g.city, followers: n, day: absDay() };
        repUp(g.city, 3);
        advance(240, '设坛讲道');
        deed('good', '你在' + g.city + '设坛讲道七日，台下从三五个闲汉听到黑压压一片——有人当场焚了邪祠的符，说要改投你的门下。');
        journal('endgame', '设坛传教', '你在' + g.city + '立下讲坛，把自己的道讲给人间。首批信众 ' + n + ' 人——香火自此有了，日日自动过账，不用你操心。');
        log('🕯️ 坛设起来了：' + g.city + '信众 ' + n + ' 人（城望+3）。每日香火自动回馈真元 +' + incenseGain() + '（信众/50，' + (_st.earthgod ? '土地公庙双倍' : '受封土地公后翻倍') + '，零按钮）。', 'success');
        refresh();
        open();
        return true;
    }
    function incenseGain() {
        if (!_st.faith) return 0;
        return Math.max(1, Math.floor(_st.faith.followers / 50)) * (_st.earthgod ? 2 : 1);
    }

    // ============ 91 受封土地公（香火线的果位） ============
    function earthgodOk() {
        if (_st.earthgod) return { ok: false, why: '你已是' + (_st.faith ? _st.faith.city : '') + '的土地公——一方神位，一任到底。' };
        if (!_st.faith) return { ok: false, why: '还没设坛传教——没有香火，天庭的册子上就没有你的名字。' };
        if (_st.faith.followers < CFG.EG_FOLLOWERS) return { ok: false, why: '信众不足 ' + CFG.EG_FOLLOWERS + '（现 ' + _st.faith.followers + '）——民意未到，天庭不会下旨。' };
        var c = cd();
        var karma = Number((c && c.karma) || 0);
        if (karma < CFG.EG_KARMA) return { ok: false, why: '因果不足 ' + CFG.EG_KARMA + '（现 ' + karma + '）——神位看德行，不看嗓门。' };
        return { ok: true };
    }
    function doEarthgod() {
        var g = earthgodOk();
        if (!g.ok) { say('⛩️ ' + g.why, 'warning'); return false; }
        _st.earthgod = { day: absDay() };
        repUp(_st.faith.city, CFG.EG_REP);
        settle({ karma: CFG.EG_KARMA_GAIN }, '受封神位');
        deed('good', '天庭下旨，敕封你为' + _st.faith.city + '土地正神——庙是百姓自发盖的，匾是府衙亲题的，香火从此有了名分。');
        journal('endgame', '受封土地公', '你受天庭敕封，为' + _st.faith.city + '土地正神。庙食一方，护佑桑梓——每日香火翻倍回馈真元，城中大小事，土地庙里都有人来讲给你听。');
        log('⛩️ 金身塑起来了：你是' + _st.faith.city + '的土地公！（城望+' + CFG.EG_REP + ' 因果+' + CFG.EG_KARMA_GAIN + '）每日香火真元 +' + incenseGain() + '（翻倍了）。', 'success');
        refresh();
        open();
        return true;
    }

    // ============ 87 自创功法（一生一部，进融合功法同一本注册表） ============
    function masteredCount() {
        var n = 0;
        try {
            var pages = window.skillPages || [];
            for (var p = 0; p < pages.length; p++) {
                var page = pages[p] || [];
                for (var i = 0; i < page.length; i++) {
                    var sk = page[i];
                    if (!sk || !sk.id) continue;
                    if (String(sk.id).indexOf('merged_') === 0 || String(sk.id).indexOf('legacyart_') === 0) continue;
                    var m = false;
                    try { if (window.KnowledgeSystem && typeof window.KnowledgeSystem.canEquip === 'function') m = window.KnowledgeSystem.canEquip(sk.id); } catch (eK) {}
                    if (!m && window.learnedSecrets) m = window.learnedSecrets.indexOf(sk.id) >= 0;
                    if (m) n++;
                }
            }
        } catch (e) {}
        return n;
    }
    function artOk() {
        if (_st.art) return { ok: false, why: '你已自创《' + _st.art.name + '》——一生一部，道不重出。' };
        if (tierOf() < CFG.ART_TIER) return { ok: false, why: '修为不到元婴（现 ' + ((cd() && cd().realm) || '凡人') + '）——看得懂别人的道，未必走得出自己的路。' };
        var mc = masteredCount();
        if (mc < CFG.ART_NEED_MASTERED) return { ok: false, why: '掌握的功法不足 ' + CFG.ART_NEED_MASTERED + ' 门（现 ' + mc + '）——没吃透三家，谈何自成一家。' };
        if (stonesNow() < CFG.ART_COST) return { ok: false, why: '闭关静室的开销要 ' + CFG.ART_COST + ' 灵石（现 ' + stonesNow() + '）。' };
        return { ok: true, mastered: mc };
    }
    function artPanel() {
        var g = artOk();
        var seed = seedOf('artname_' + absDay());
        var sugg = [surname() + '氏' + ART_NAME_POOL[seed % ART_NAME_POOL.length], ART_NAME_POOL[(seed >>> 3) % ART_NAME_POOL.length], surname() + '子' + ART_NAME_POOL[(seed >>> 6) % ART_NAME_POOL.length]];
        var html = '<p class="text-sm text-gray-300 mb-2">' + (g.ok
            ? '静室里香烧了三炷。你把这些年学过的 ' + g.mastered + ' 门功法一一摆开——拆到最后一层，剩下的就是你自己的道。给它起个名字：'
            : '🔒 ' + g.why) + '</p>' +
            '<p class="text-xs text-gray-500 mb-2">明账：' + CFG.ART_COST + ' 灵石闭关 · 零骰（一生所学凝一部，只要门槛够，闭关闭得出来）· 新功法是「内功」，可运可传——子嗣传功、宗门传艺都认它。</p>' +
            '<input id="legacy-art-name" maxlength="8" placeholder="八字以内" class="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-gray-100 mb-2">' +
            '<div class="flex gap-2 mb-2">' + sugg.map(function (n) {
                return '<button onclick="document.getElementById(\'legacy-art-name\').value=\'' + n + '\'" class="bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs px-2 py-1 rounded">' + n + '</button>';
            }).join('') + '</div>' +
            '<button onclick="window.GrandLegacy.doCreateArt()" ' + (g.ok ? 'class="w-full bg-amber-700 hover:bg-amber-600 text-white text-sm px-3 py-2 rounded"' : 'class="w-full bg-gray-700 text-gray-400 text-sm px-3 py-2 rounded" disabled') + '>🌟 闭关凝道（' + CFG.ART_COST + ' 灵石）</button>' +
            '<button onclick="window.openGrandLegacy()" class="w-full mt-2 p-2 rounded text-xs text-gray-400 hover:text-gray-300">↩️ 回大业名册</button>';
        if (typeof window.showModal === 'function') { window.showModal('🌟 自创功法', html); return true; }
        return false;
    }
    function doCreateArt(name) {
        var g = artOk();
        if (!g.ok) { say('🌟 ' + g.why, 'warning'); return false; }
        if (name == null) {
            try { var el = document.getElementById('legacy-art-name'); name = el && el.value; } catch (eD) {}
        }
        name = String(name == null ? '' : name).trim().slice(0, 8);
        if (!name) { say('🌟 给自己的道起个名字——空白的功法册，后人怎么念？', 'warning'); return false; }
        var r = settle({ stones: -CFG.ART_COST }, '闭关凝道');
        if (!r.ok) { say('🌟 灵石不够，静室租不下来。', 'warning'); return false; }
        advance(480, '闭关自创功法');
        var id = 'legacyart_' + absDay();
        var def = {
            id: id, name: name, icon: '🌟', type: '内功', grade: '一品',
            desc: '你毕生所学熔于一炉，自证自成——不经任何阁中传授，天下只此一部。',
            effect: ART_EFFECT, element: 'neutral', qiCost: 0
        };
        registerArt(def);
        _st.art = { id: id, name: name, day: absDay() };
        settle({ mood: 10 }, '道成之喜');
        grow('学识', 3);
        deed('neutral', '你闭关百日，自创功法《' + name + '》出关——江湖上传开了：' + city() + '有位修士走出了自己的路。');
        journal('endgame', '自创功法', '《' + name + '》成书那日，静室的烛火无风自直。这部功法不经任何阁中传授——你是它的第一人，也是它的祖师。（' + ART_EFFECT + '）');
        log('🌟 你自创的功法《' + name + '》成了！（' + ART_EFFECT + ' · 一品 · 内功）已入知识账，运功栏里可直接运它；子嗣传功、宗门传艺都认这部。', 'success');
        refresh();
        open();
        return true;
    }
    // 注册走融合功法同一本账：skillPages + 知识册 + xianxia_merged_skills 注册表（重载回册现成）
    function registerArt(def) {
        try {
            if (window.skillPages) {
                var found = false;
                for (var p = 0; p < window.skillPages.length && !found; p++) {
                    var page = window.skillPages[p] || [];
                    for (var i = 0; i < page.length; i++) if (page[i] && page[i].id === def.id) { found = true; break; }
                }
                if (!found) {
                    var lastPage = window.skillPages[window.skillPages.length - 1];
                    if (lastPage && lastPage.length < 5) lastPage.push(def);
                    else window.skillPages.push([def]);
                }
            }
            if (window.KnowledgeSystem && typeof window.KnowledgeSystem.unlock === 'function') {
                window.KnowledgeSystem.unlock(def.id, 'learned', { source: 'legacy', completeness: 1 });
            } else {
                if (!window.learnedSecrets) window.learnedSecrets = [];
                if (window.learnedSecrets.indexOf(def.id) < 0) window.learnedSecrets.push(def.id);
            }
        } catch (eR) { console.warn('[静默失败] js/grand-legacy.js · registerArt：功法没登进本会话的册子', eR && eR.message); }
        try {
            var raw = null;
            try { raw = localStorage.getItem('xianxia_merged_skills'); } catch (eL) {}
            var list = [];
            try { list = raw ? JSON.parse(raw) : []; } catch (eP) { list = []; }
            if (!Array.isArray(list)) list = [];
            list = list.filter(function (d) { return !(d && d.id === def.id); });
            list.push(def);
            var out = JSON.stringify(list);
            if (window.saveToStorage) { if (!window.saveToStorage('xianxia_merged_skills', out)) throw new Error('未落盘'); }
            else localStorage.setItem('xianxia_merged_skills', out);
        } catch (eS) { console.warn('[静默失败] js/grand-legacy.js · registerArt：自创功法没写进注册表——刷新后这一部会丢', eS && eS.message); }
    }

    // ============ 88 著经立说（写书账的顶点，一生一经） ============
    function booksWritten() {
        try {
            if (window.Authoring && typeof window.Authoring.state === 'function') {
                var s = window.Authoring.state() || {};
                return Array.isArray(s.books) ? s.books.length : 0;
            }
        } catch (e) {}
        return 0;
    }
    function scriptOk() {
        if (_st.scripture) return { ok: false, why: '你的《' + _st.scripture.title + '》已经刊行了——一生一经，多写就滥了。' };
        var ct = inCity();
        if (!ct) return { ok: false, why: '你身在城外——刊经要城里书坊的刻版。' };
        if (tierOf() < CFG.SCRIPT_TIER) return { ok: false, why: '修为不到元婴（现 ' + ((cd() && cd().realm) || '凡人') + '）——立说是一辈子的事，火候不到写出来也是废纸。' };
        if (skill('学识') < CFG.SCRIPT_SCHOL) return { ok: false, why: '学识不足 ' + CFG.SCRIPT_SCHOL + '（现 ' + skill('学识') + '）——经是要传后世的，字字都得立得住。' };
        if (booksWritten() < 1) return { ok: false, why: '还没写过一部书（书肆借案写书的账上是空的）——连稿都没卖过，谈何著经。' };
        if (stonesNow() < CFG.SCRIPT_COST) return { ok: false, why: '纸墨刻版要 ' + CFG.SCRIPT_COST + ' 灵石（现 ' + stonesNow() + '）。' };
        return { ok: true, city: ct };
    }
    function writeScripture() {
        var g = scriptOk();
        if (!g.ok) { say('📖 ' + g.why, 'warning'); return false; }
        var r = settle({ stones: -CFG.SCRIPT_COST, karma: CFG.SCRIPT_KARMA }, '著经立说');
        if (!r.ok) { say('📖 纸墨钱凑不齐。', 'warning'); return false; }
        advance(480, '著经立说');
        var pool = SCRIPT_POOL;
        var title = surname() + '氏' + pool[seedOf(pkCity(g.city) + '_script_' + absDay()) % pool.length];
        _st.scripture = { title: title, day: absDay(), city: g.city };
        repUp(g.city, CFG.SCRIPT_REP);
        grow('学识', CFG.SCRIPT_SCHOL_GAIN);
        deed('good', '你著了一部《' + title + '》刊行天下——书坊刻版三日售罄，各家书院都拿它当课本。');
        journal('endgame', '著经立说', '《' + title + '》刊行——你的道从此有了文字。后世学人翻开第一页，读到的是你走出来的路。（若日后设坛传教，这部经就是教义：信众多半成）');
        log('📖 《' + title + '》刊行了！（城望+' + CFG.SCRIPT_REP + ' 因果+' + CFG.SCRIPT_KARMA + ' 学识+' + CFG.SCRIPT_SCHOL_GAIN + '）这部经不卖钱——道不贱卖。日后设坛传教，信众 +50%（明账）。', 'success');
        refresh();
        open();
        return true;
    }

    // ============ 93 办比武大会（三轮真仗，一生一回的金顶） ============
    function tourneyOk() {
        if (_st.tourDone) return { ok: false, why: '你的比武大会已经办过了（' + _st.tourDone.city + '·第 ' + _st.tourDone.day + ' 日）——头一届的彩头最贵，往后都是续貂。' };
        if (_st.tourRound > 0) return { ok: false, why: '大会正打着——第 ' + _st.tourRound + '/' + CFG.TOUR_ROUNDS + ' 轮，去斗法台接着打。' };
        var ct = inCity();
        if (!ct) return { ok: false, why: '你身在城外——大会要在城里斗法台开。' };
        if (absDay() - Number(_st.tourFailDay || 0) < CFG.TOUR_FAIL_GAP && _st.tourFailDay) return { ok: false, why: '上回大会砸了场，江湖人还没忘——' + (CFG.TOUR_FAIL_GAP - (absDay() - _st.tourFailDay)) + ' 日后再开台。' };
        if (repVal(ct) < CFG.TOUR_REP_NEED) return { ok: false, why: '城望不足 ' + CFG.TOUR_REP_NEED + '（现 ' + repVal(ct) + '）——你发的英雄帖，没人肯赏脸。' };
        if (stonesNow() < CFG.TOUR_COST) return { ok: false, why: '彩头与租台要 ' + CFG.TOUR_COST + ' 灵石先付（现 ' + stonesNow() + '）——大会砸了也不退。' };
        return { ok: true, city: ct };
    }
    function tourEnemy(round) {
        var pool = TOUR_NAMES[Math.min(round, 3) - 1] || TOUR_NAMES[0];
        var seed = seedOf(pkCity(_st.tourCity) + '_tour_' + _st.tourDay + '_' + round);
        var tier = Math.max(1, tierOf()) + (round - 1);
        return {
            name: pool[seed % pool.length], round: round,
            type: round === 3 ? 'boss' : 'elite', physiologyType: 'humanoid',
            level: tier * 3 + 2, attack: 28 + tier * 7, defense: 15 + tier * 4, speed: 20 + round * 2,
            maxDurability: 100 + tier * 20, durabilities: { chest: 100 + tier * 20 }, combatAbilities: []
        };
    }
    function startTourney() {
        var g = tourneyOk();
        if (!g.ok) { say('🏆 ' + g.why, 'warning'); return false; }
        var r = settle({ stones: -CFG.TOUR_COST }, '大会彩头');
        if (!r.ok) { say('🏆 彩头钱付不出——英雄帖发出去就是打自己的脸。', 'warning'); return false; }
        _st.tourRound = 1; _st.tourCity = g.city; _st.tourDay = absDay();
        repUp(g.city, 2);
        deed('neutral', '你在' + g.city + '发了英雄帖，自设比武大会——四方豪杰云集，斗法台下的赌盘开了三档。');
        log('🏆 比武大会开台！（彩头 ' + CFG.TOUR_COST + ' 灵石已付，砸了不退）三轮真仗：初赛→复赛→决顶，全赢了彩头连本带利 ' + CFG.TOUR_WIN_STONES + ' 灵石奉还、城望+' + CFG.TOUR_WIN_REP + '；输了大会砸场城望-' + CFG.TOUR_LOSE_REP + '。', 'success');
        return startTourneyRound();
    }
    function startTourneyRound() {
        if (!(_st.tourRound > 0)) { say('🏆 没有在打的大会。', 'info'); return false; }
        if (window.currentBattle) { say('🏆 手头还打着——先了结这场。', 'warning'); return false; }
        var en = tourEnemy(_st.tourRound);
        var roundName = ['初赛', '复赛', '决顶'][_st.tourRound - 1] || '比试';
        var started = false;
        try {
            if (window.NpcCrime && typeof window.NpcCrime.startFlaggedBattle === 'function') {
                started = window.NpcCrime.startFlaggedBattle(en, { _isTourneyFight: true },
                    '🏆 ' + roundName + '（第 ' + _st.tourRound + '/' + CFG.TOUR_ROUNDS + ' 轮）：「' + en.name + '」抱拳上台——台下万人围观，赌盘的赔率牌都举起来了。');
            } else { say('🏆 斗法台的场面拉不起来——兵刃的账没接上。', 'warning'); }
        } catch (e) { console.warn('[静默失败] js/grand-legacy.js · startTourneyRound：这一轮没拉开', e && e.message); }
        return started;
    }
    // 大会战结算（app.js 战斗收场钩子 _isTourneyFight 接线）
    function settleTourneyFight(won) {
        if (!(_st.tourRound > 0)) return;
        var ct = _st.tourCity;
        var round = _st.tourRound;
        var roundName = ['初赛', '复赛', '决顶'][round - 1] || '比试';
        if (!won) {
            _st.tourRound = 0; _st.tourCity = ''; _st.tourDay = 0;
            _st.tourFailDay = absDay();
            repDown(ct, CFG.TOUR_LOSE_REP);
            log('🏆 ' + roundName + '输了——大会就此砸场。彩头打了水漂，看客摇着头散去，说书人当晚就编了段《' + surname() + '某折戟》。（城望-' + CFG.TOUR_LOSE_REP + '，' + CFG.TOUR_FAIL_GAP + ' 日后可再开台）', 'warning');
            say('🏆 大会砸了场——' + CFG.TOUR_FAIL_GAP + ' 日后再开台。（城望-' + CFG.TOUR_LOSE_REP + '）', 'warning');
            refresh();
            return;
        }
        if (round >= CFG.TOUR_ROUNDS) {
            _st.tourRound = 0; _st.tourCity = ''; _st.tourDay = 0;
            _st.tourDone = { city: ct, day: absDay() };
            settle({ stones: CFG.TOUR_WIN_STONES, fame: CFG.TOUR_WIN_FAME }, '大会彩头');
            repUp(ct, CFG.TOUR_WIN_REP);
            deed('good', '你办的比武大会自己打到了决顶——三轮连胜捧了金顶。江湖人说：这届大会，台是TA搭的，魁也是TA夺的。');
            journal('endgame', '比武大会', '你在' + ct + '自设比武大会，四方豪杰云集——而三轮打下来，金顶是你自己捧走的。彩头连本带利奉还，江湖上自此年年有人问：下届大会几时开？');
            log('🏆 决顶胜出——比武大会圆满！彩头连本带利 ' + CFG.TOUR_WIN_STONES + ' 灵石入袋、名望+' + CFG.TOUR_WIN_FAME + '、城望+' + CFG.TOUR_WIN_REP + '。（一生一回，入了大业名册）', 'success');
            say('🏆 金顶是你自己捧走的！（' + CFG.TOUR_WIN_STONES + ' 灵石 · 城望+' + CFG.TOUR_WIN_REP + '）', 'success');
        } else {
            _st.tourRound = round + 1;
            log('🏆 ' + roundName + '胜出！台下一片喝彩——下一轮「' + (['初赛', '复赛', '决顶'][round] || '') + '」的对手已经在热身了。（大业名册里接着打）', 'success');
            say('🏆 ' + roundName + '胜出——回大业名册打下一轮。', 'success');
        }
        refresh();
    }

    // ============ 每日/每月自动账（零按钮零追人） ============
    function dailyTick() {
        try {
            // 香火日账：信众的供奉自动到（飞升香火是 ascension-epilogue 的账，这里是凡间坛火的账，两不搅）
            var c = cd();
            var gain = incenseGain();
            if (c && gain > 0) {
                c.essence = (Number(c.essence) || 0) + gain;
                log('🕯️ ' + (_st.earthgod ? '土地庙的' : '坛前的') + '香火日日不断——真元+' + gain + '。', 'info');
            }
            // 月俸：初一一笔（城主俸银 / 称帝后改国贡）
            var sal = salaryOf();
            if (sal > 0 && monthIdx() > _st.monthSettled) {
                _st.monthSettled = monthIdx();
                if (settle({ stones: sal }, _st.emperor ? '国贡' : '城主俸银').ok) {
                    log((_st.emperor ? '👑 初一，户部解来国贡 ' : '🏛️ 初一，衙门送来俸银 ') + sal + ' 灵石。' + (_st.emperor ? '普天之下莫非王土——这钱是税册上走的。' : '（60 + 城望/10，明账）'), 'success');
                    try { if (typeof window.updateCurrencyUI === 'function') window.updateCurrencyUI(); } catch (eU) {}
                }
            } else if (sal === 0 && monthIdx() > _st.monthSettled) {
                _st.monthSettled = monthIdx();
            }
            // ===== v27.15：⑫新增-1 大业之间的江湖回响——再传弟子 =====
            // 著经满三年（1080 日），江湖上开始有人自称"你的再传弟子"：七成真传（读过你的书真悟出来了，
            // 名望入账）、三成招摇（打着你的名头收钱行骗——败你名声，你得管：去那城了结）。
            // 事件至少隔一季（90 日）才再掷——江湖回声有节奏，不是日报。
            // 招摇的了结口：enterCity 链尾第六钩（本文件尾挂的 echoConfront），没去管就一直挂着（名望只扣那一笔，不滚利息——世界不迁就玩家，但也不无限罚）。
            try {
                if (_st.scripture && _st.scripture.day > 0) {
                    var _now15 = absDay();
                    var _echoDue15 = (_st.echoNextDay || 0);
                    if (_now15 >= _st.scripture.day + 1080 && _now15 >= _echoDue15 && !_st.echoPending) {
                        if (Math.random() < 0.35) {
                            var _isTrue15 = (Math.random() < 0.7);
                            if (_isTrue15) {
                                var _where15 = _st.scripture.city || (cd() && cd().location) || '某座城';
try {
                                      if (window.WorldLedger && typeof window.WorldLedger.recordAnnal === 'function') {
                                          window.WorldLedger.recordAnnal('legacy', '「' + _st.scripture.title + '」传世：' + _where15 + '有读书人按经中法要练出了真气，自称再传弟子——这一脉，是真读进去了。', _where15);
                                      }
                                  } catch (eAn15) {}
                                repUp(_where15, 4);   // 名望走正门（addReputation 按城）——书在著经城最响，名随书走
                                log('📖 江湖上出了个真读你书的——' + _where15 + '有人按「' + _st.scripture.title + '」的法要练出了真气，自称你的再传弟子。这一脉是真悟出来的，名望+4。', 'success');
                            } else {
                                var _fake15 = (cd() && cd().location && cd().location !== _st.scripture.city) ? cd().location : '青木城';
                                try {
                                    var _md15 = window.mapData || {}, _cands15 = [];
                                    Object.keys(_md15).forEach(function (rg) { ( _md15[rg] && _md15[rg].cities || []).forEach(function (c) { if (c && c !== (cd() && cd().location)) _cands15.push(c); }); });
                                    if (_cands15.length) _fake15 = _cands15[Math.floor(Math.random() * _cands15.length)];
                                } catch (eC15) {}
                                _st.echoPending = { city: _fake15, day: _now15 };
try {
                                      if (window.WorldLedger && typeof window.WorldLedger.recordAnnal === 'function') {
                                          window.WorldLedger.recordAnnal('legacy', '「' + _st.scripture.title + '」出了伪徒：' + _fake15 + '有人打着著者名号收徒敛钱——江湖上骂的是著者的名声。', _fake15);
                                      }
                                  } catch (eAn2) {}
                                repUp(_fake15, -3);   // 名望走正门——骂名落在案发城
                                log('🎭 坏消息：' + _fake15 + '出了个冒你名的——自称「' + _st.scripture.title + '再传弟子」，收徒敛钱，败的是你的名声（-3）。要管，就得亲自去' + _fake15 + '一趟。', 'danger');
                            }
                            _st.echoNextDay = _now15 + 90;   // 下一掷至少隔一季
                        }
                    }
                }
            } catch (eEcho15) { console.warn('[静默失败] js/grand-legacy.js · 回响掷没跑成（今日江湖无新事）', eEcho15 && eEcho15.message); }
        } catch (e) { console.warn('[静默失败] js/grand-legacy.js · dailyTick：今日的香火/月俸没过账', e && e.message); }
    }

    // ============ 89 自立宗门（PlayerSect 现成账，本册只立路标） ============
    function sectLine() {
        try {
            var mine = (window.PlayerSect && typeof window.PlayerSect.listMySects === 'function') ? (window.PlayerSect.listMySects() || []) : null;
            if (mine && mine.length) return '🏯 自立宗门：「' + (mine[0].name || '本宗') + '」已立——弟子 ' + ((mine[0].disciples && mine[0].disciples.length) || 0) + ' 人（宗门总册在修炼面板）。';
            if (typeof window.openFoundSectPanel === 'function') return '🏯 自立宗门：还没立——修炼面板「竖旗立宗/开山立宗」，白手也能起家。';
        } catch (e) {}
        return '';
    }

    // ============ 大业名册（总门） ============
    function open() {
        var c = cd();
        if (!c) { say('先有角色，再谈大业。', 'warning'); return false; }
        var btn = 'class="w-full p-3 rounded mb-2 text-left text-sm text-white hover:opacity-90"';
        var html = '<p class="text-sm text-gray-400 mb-2">一生一回的大事业——做完入账、永不重复。银钱与成算逐条明账，够不着的锁上写着差什么。</p>';
        // 仕途线
        html += '<p class="text-xs font-bold text-amber-300 mb-1">🏛️ 仕途线（科举 → 城主 → 称帝）</p>';
        for (var i = 0; i < EXAMS.length; i++) {
            var ex = EXAMS[i];
            var pg = _st.examPassed[ex.stage];
            if (pg) {
                html += '<p class="text-xs text-emerald-300/90 mb-1 p-2 bg-emerald-900/20 rounded">✅ ' + ex.name + '已过（第 ' + pg.day + ' 日）' + (pg.rank ? '——' + pg.rank : '') + '</p>';
                continue;
            }
            var eg = examOk(ex.stage);
            html += '<button onclick="GrandLegacy.sitExam(' + ex.stage + ')" ' + btn.replace('p-3', (eg.ok ? 'bg-amber-800' : 'bg-gray-700') + ' p-3') + '>📜 ' + ex.name + (ex.seasonName ? '（' + ex.seasonName + '）' : '') + '（学识 ' + ex.need + '+ · 成算 ' + Math.round(examP(ex) * 100) + '% · 精力 ' + ex.en + (eg.ok ? '' : ' · ⛔ ' + eg.why) + '）</button>';
        }
        if (_st.office) {
            html += '<p class="text-xs text-emerald-300/90 mb-1 p-2 bg-emerald-900/20 rounded">✅ ' + _st.office.city + '城主（第 ' + _st.office.day + ' 日接印 · 每月初一俸银 ' + salaryOf() + ' 灵石' + (_st.emperor ? '——已改国贡 ' + CFG.EMP_TRIBUTE : '') + '）</p>';
        } else {
            var og = officeOk();
            html += '<button onclick="GrandLegacy.takeOffice()" ' + btn.replace('p-3', (og.ok ? 'bg-stone-700' : 'bg-gray-700') + ' p-3') + '>🏛️ 捐官当城主（' + CFG.OFFICE_COST + ' 灵石部费 · 进士出身 · 城望 ' + CFG.OFFICE_REP_NEED + '+ · 月初俸银自动到账' + (og.ok ? '' : ' · ⛔ ' + og.why) + '）</button>';
        }
        if (_st.emperor) {
            html += '<p class="text-xs text-yellow-300 mb-1 p-2 bg-yellow-900/20 rounded">👑 ' + esc(_st.emperor.dynasty) + (_st.emperor.eraName ? ' · 建元「' + esc(_st.emperor.eraName) + '」' : '') + ' · 开国于第 ' + _st.emperor.day + ' 日，定都' + esc(_st.emperor.city) + (_st.emperor.consort ? ' · ' + (_st.emperor.consort.title === '后' ? '皇后' : '皇夫') + esc(_st.emperor.consort.name) + '在中宫' : ' · 中宫虚悬') + '——天无二日，史册有名。</p>';
            // v27.7 朝政篇：称帝不是终点——朝廷的门开在这里（dynasty-court.js 没加载就静默不显示）
            if (window.DynastyCourt) {
                html += '<button onclick="window.openDynastyCourt()" ' + btn.replace('p-3', 'bg-yellow-700 p-3') + '>👑 打开朝政（国库 · 立储 · 征伐 · 大工程 · 编年史 · 终局）</button>';
            }
        } else {
            var pg2 = emperorOk();
            html += '<button onclick="GrandLegacy.proclaimPanel(1)" ' + btn.replace('p-3', (pg2.ok ? 'bg-yellow-700' : 'bg-gray-700') + ' p-3') + '>👑 称帝建国·登基大典（六仪：劝进→筑坛告天→加衮冕→改元→册礼→大赦 · ' + CFG.EMP_COST + ' 灵石礼成才扣 · 城主之身 · 元婴修为 · 都城城望 ' + CFG.EMP_REP_NEED + '+ · 国号自取「大' + surname() + '」' + (pg2.ok ? '' : ' · ⛔ ' + pg2.why) + '）</button>';
        }
        // 香火线
        html += '<p class="text-xs font-bold text-cyan-300 mb-1 mt-3">🕯️ 香火线（传教 → 土地公）</p>';
        if (_st.faith) {
            html += '<p class="text-xs text-cyan-200/90 mb-1 p-2 bg-cyan-900/20 rounded">✅ ' + _st.faith.city + '设坛（第 ' + _st.faith.day + ' 日 · 信众 ' + _st.faith.followers + ' 人 · 每日真元+' + incenseGain() + '）</p>';
        } else {
            var fg = preachOk();
            html += '<button onclick="GrandLegacy.doPreach()" ' + btn.replace('p-3', (fg.ok ? 'bg-cyan-800' : 'bg-gray-700') + ' p-3') + '>🕯️ 设坛传教（' + CFG.PREACH_COST + ' 灵石筑坛 · 金丹修为 · 因果 ' + CFG.PREACH_KARMA + '+ · 信众≈' + (fg.ok ? followersOf(fg.city) : '看城望因果') + (_st.scripture ? ' · 有经加成五成' : '') + (fg.ok ? '' : ' · ⛔ ' + fg.why) + '）</button>';
        }
        if (_st.earthgod) {
            html += '<p class="text-xs text-emerald-300/90 mb-1 p-2 bg-emerald-900/20 rounded">⛩️ 已受封' + (_st.faith ? _st.faith.city : '') + '土地正神（第 ' + _st.earthgod.day + ' 日 · 香火翻倍）</p>';
        } else {
            var gg = earthgodOk();
            html += '<button onclick="GrandLegacy.doEarthgod()" ' + btn.replace('p-3', (gg.ok ? 'bg-emerald-800' : 'bg-gray-700') + ' p-3') + '>⛩️ 受封土地公（信众 ' + CFG.EG_FOLLOWERS + '+ · 因果 ' + CFG.EG_KARMA + '+ · 香火翻倍 · 城望+' + CFG.EG_REP + (gg.ok ? '' : ' · ⛔ ' + gg.why) + '）</button>';
        }
        // 艺业线
        html += '<p class="text-xs font-bold text-rose-300 mb-1 mt-3">🌟 艺业线（自创功法 · 著经 · 大会）</p>';
        if (_st.art) {
            html += '<p class="text-xs text-emerald-300/90 mb-1 p-2 bg-emerald-900/20 rounded">✅ 自创功法《' + _st.art.name + '》（第 ' + _st.art.day + ' 日 · ' + ART_EFFECT + ' · 运功栏可运）</p>';
        } else {
            var ag = artOk();
            html += '<button onclick="GrandLegacy.artPanel()" ' + btn.replace('p-3', (ag.ok ? 'bg-rose-800' : 'bg-gray-700') + ' p-3') + '>🌟 自创功法（' + CFG.ART_COST + ' 灵石闭关 · 元婴修为 · 掌握功法 ' + CFG.ART_NEED_MASTERED + ' 门+ · 零骰凝道' + (ag.ok ? '' : ' · ⛔ ' + ag.why) + '）</button>';
        }
        if (_st.scripture) {
            html += '<p class="text-xs text-emerald-300/90 mb-1 p-2 bg-emerald-900/20 rounded">✅ 著经立说《' + _st.scripture.title + '》（第 ' + _st.scripture.day + ' 日刊于' + _st.scripture.city + ' · 传教信众+50%）</p>';
        } else {
            var sg = scriptOk();
            html += '<button onclick="GrandLegacy.writeScripture()" ' + btn.replace('p-3', (sg.ok ? 'bg-indigo-800' : 'bg-gray-700') + ' p-3') + '>📖 著经立说（' + CFG.SCRIPT_COST + ' 灵石刻版 · 元婴修为 · 学识 ' + CFG.SCRIPT_SCHOL + '+ · 写过书 · 一生一经' + (sg.ok ? '' : ' · ⛔ ' + sg.why) + '）</button>';
        }
        if (_st.tourDone) {
            html += '<p class="text-xs text-emerald-300/90 mb-1 p-2 bg-emerald-900/20 rounded">🏆 比武大会办过了（' + _st.tourDone.city + ' · 第 ' + _st.tourDone.day + ' 日 · 金顶是自己捧走的）</p>';
        } else if (_st.tourRound > 0) {
            html += '<button onclick="GrandLegacy.startTourneyRound()" ' + btn.replace('p-3', 'bg-red-800 p-3') + '>🏆 比武大会进行中——第 ' + _st.tourRound + '/' + CFG.TOUR_ROUNDS + ' 轮（' + (['初赛', '复赛', '决顶'][_st.tourRound - 1] || '') + '），上台接着打</button>';
        } else {
            var tg = tourneyOk();
            html += '<button onclick="GrandLegacy.startTourney()" ' + btn.replace('p-3', (tg.ok ? 'bg-red-800' : 'bg-gray-700') + ' p-3') + '>🏆 办比武大会（' + CFG.TOUR_COST + ' 灵石彩头先付砸了不退 · 城望 ' + CFG.TOUR_REP_NEED + '+ · 三轮真仗 · 全胜彩头奉还 ' + CFG.TOUR_WIN_STONES + ' 灵石+城望' + CFG.TOUR_WIN_REP + (tg.ok ? '' : ' · ⛔ ' + tg.why) + '）</button>';
        }
        // 宗门路标
        var sl = sectLine();
        if (sl) html += '<p class="text-xs text-gray-400 mt-2 p-2 bg-gray-800/60 rounded">' + sl + '</p>';
        html += '<p class="text-[11px] text-gray-500 mt-1">大业账——科举落第来年再考、大会砸了三十日后再开；俸银/国贡初一自动到、香火日日自动到，全不用你惦记。</p>';
        if (typeof window.showModal === 'function') { window.showModal('🏛️ 大业名册', html); return true; }
        say('🏛️ 大业名册（弹窗没开起来）：科举' + (Object.keys(_st.examPassed).length) + '/3 · 城主' + (_st.office ? '✅' : '—') + ' · 称帝' + (_st.emperor ? '✅' : '—') + ' · 传教' + (_st.faith ? '✅' : '—') + ' · 土地公' + (_st.earthgod ? '✅' : '—') + ' · 自创' + (_st.art ? '✅' : '—') + ' · 著经' + (_st.scripture ? '✅' : '—') + ' · 大会' + (_st.tourDone ? '✅' : '—'));
        return true;
    }
    // 斗法台侧的门：有进行中的大会直接开打，没有就开名册
    function tourGate() {
        if (_st.tourRound > 0) return startTourneyRound();
        return open();
    }

    // ============ 存读档（StateRegistry 正门，零新 localStorage 键） ============
    function _export() { return JSON.parse(JSON.stringify(_st)); }
    function _import(s) {
        var d0 = absDay();
        var fin = function (v, lo, hi) { var n = Number(v); return Number.isFinite(n) ? clamp(Math.floor(n), lo, hi) : null; };
        if (!s || typeof s !== 'object') return;
        // 科举：只认 1/2/3 级、逐级不跳（跳级的坏账整段剔除）
        var ep = (s.examPassed && typeof s.examPassed === 'object') ? s.examPassed : {};
        var passed = {};
        for (var st = 1; st <= 3; st++) {
            var rec = ep[st] || ep[String(st)];
            if (!rec || typeof rec !== 'object') break;               // 前一级没有，后一级必是坏账
            passed[st] = { day: fin(rec.day, 0, 1e9) || 0 };
            if (st === 3 && typeof rec.rank === 'string' && rec.rank) passed[3].rank = String(rec.rank).slice(0, 10);
        }
        _st.examPassed = passed;
        var fy = (s.examFailYear && typeof s.examFailYear === 'object') ? s.examFailYear : {};
        _st.examFailYear = {};
        for (var k = 1; k <= 3; k++) { var yv = fin(fy[k] || fy[String(k)], 0, 9999); if (yv !== null) _st.examFailYear[k] = yv; }
        _st.office = (s.office && typeof s.office === 'object' && typeof s.office.city === 'string' && s.office.city && passed[3])
            ? { city: String(s.office.city).slice(0, 30), day: fin(s.office.day, 0, 1e9) || 0 } : null;   // 没进士官身的城主是坏账
        _st.emperor = (_st.office && s.emperor && typeof s.emperor === 'object' && typeof s.emperor.dynasty === 'string' && s.emperor.dynasty)
            ? { city: String(s.emperor.city || _st.office.city).slice(0, 30), day: fin(s.emperor.day, 0, 1e9) || 0, dynasty: String(s.emperor.dynasty).slice(0, 10),
                eraName: (typeof s.emperor.eraName === 'string' && s.emperor.eraName) ? String(s.emperor.eraName).slice(0, 4) : '',
                consort: (s.emperor.consort && typeof s.emperor.consort === 'object' && ['后', '皇夫'].indexOf(s.emperor.consort.title) >= 0 && typeof s.emperor.consort.name === 'string' && s.emperor.consort.name)
                    ? { name: String(s.emperor.consort.name).slice(0, 12), title: s.emperor.consort.title } : null } : null;
        _st.faith = (s.faith && typeof s.faith === 'object' && typeof s.faith.city === 'string' && s.faith.city)
            ? { city: String(s.faith.city).slice(0, 30), followers: fin(s.faith.followers, 0, CFG.PREACH_CAP) || 0, day: fin(s.faith.day, 0, 1e9) || 0 } : null;
        _st.earthgod = (_st.faith && s.earthgod && typeof s.earthgod === 'object')
            ? { day: fin(s.earthgod.day, 0, 1e9) || 0 } : null;      // 没传教的神位是坏账
        _st.art = (s.art && typeof s.art === 'object' && typeof s.art.name === 'string' && s.art.name && typeof s.art.id === 'string' && s.art.id)
            ? { id: String(s.art.id).slice(0, 40), name: String(s.art.name).slice(0, 8), day: fin(s.art.day, 0, 1e9) || 0 } : null;
        _st.scripture = (s.scripture && typeof s.scripture === 'object' && typeof s.scripture.title === 'string' && s.scripture.title)
            ? { title: String(s.scripture.title).slice(0, 20), day: fin(s.scripture.day, 0, 1e9) || 0, city: String(s.scripture.city || '').slice(0, 30) } : null;
        _st.tourDone = (s.tourDone && typeof s.tourDone === 'object' && typeof s.tourDone.city === 'string' && s.tourDone.city)
            ? { city: String(s.tourDone.city).slice(0, 30), day: fin(s.tourDone.day, 0, 1e9) || 0 } : null;
        _st.tourFailDay = fin(s.tourFailDay, 0, 1e9) || 0;
        _st.tourRound = (_st.tourDone ? 0 : (fin(s.tourRound, 1, CFG.TOUR_ROUNDS) || 0));
        _st.tourCity = (_st.tourRound > 0 && typeof s.tourCity === 'string') ? String(s.tourCity).slice(0, 30) : '';
        _st.tourDay = (_st.tourRound > 0 ? (fin(s.tourDay, 0, 1e9) || 0) : 0);
        // v27.15 回响账（老档缺键自动补空——没掷过回响，从今日起算）
        _st.echoPending = (s.echoPending && typeof s.echoPending === 'object' && s.echoPending.city) ? { city: String(s.echoPending.city).slice(0, 30), day: fin(s.echoPending.day, 0, 1e9) || 0 } : null;
        _st.echoNextDay = fin(s.echoNextDay, 0, 1e9) || 0;
        _st.monthSettled = fin(s.monthSettled, -99999, 99999);
        if (_st.monthSettled === null) _st.monthSettled = -1;
        if (_st.monthSettled > monthIdx()) _st.monthSettled = monthIdx();   // 未来的月戳夹回本月
    }
    function _reset() {
        _st = {
            examPassed: {}, examFailYear: {}, office: null, emperor: null,
            faith: null, earthgod: null, art: null, scripture: null,
            tourDone: null, tourFailDay: 0, tourRound: 0, tourCity: '', tourDay: 0,
            echoPending: null, echoNextDay: 0,   // v27.15 回响账
            monthSettled: -1
        };
    }
    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        window.StateRegistry.register('grandLegacy', { version: 1, export: _export, import: _import, reset: _reset });
    }
    try {
        if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') window.timeSystem.onNewDaySubscribe(dailyTick);
    } catch (eSub) {}

    // 斗法台侧挂一块「比武大会」的牌子（facilityAugment 由 city-facilities 批加载，晚于本文件——挂 load 事件补挂，缺了名册正门照开）
    function mountTourneyAugment() {
        try {
            if (typeof window.facilityAugment !== 'function' || !window.scenarioEngine || window.__glTourneyMounted) return;
            var mounted = window.facilityAugment('arena_stage', {
                id: 'arena_tour', name: '比武大会', icon: '🏆',
                desc: '一生一回的盛会——彩头你先出，三轮真仗打上来，金顶自己捧',
                startNode: 'at_start',
                nodes: {
                    at_start: {
                        desc: function () {
                            if (_st.tourDone) return '斗法台的管事还记得你那届大会：「金顶是您自己捧走的——这台子往后年年有人来问下届几时开。」';
                            if (_st.tourRound > 0) return '你的大会正打着——第 ' + _st.tourRound + '/' + CFG.TOUR_ROUNDS + ' 轮，对手在台侧压腿热身，台下赌盘的赔率牌已经举起来了。';
                            var g = tourneyOk();
                            return g.ok
                                ? '斗法台管事迎上来：「客官要包台办大会？彩头 ' + CFG.TOUR_COST + ' 灵石先付、砸了不退，四轮英雄帖我们代发——您自己也得打三轮，全赢了彩头连本带利 ' + CFG.TOUR_WIN_STONES + ' 灵石奉还。」'
                                : '斗法台管事拱手：「包台办大会的门槛——' + g.why + '」';
                        },
                        choices: [
                            { text: '🏆 开台 / 接着打（大业名册里明账）', next: null, effects: { grand: { op: 'tour' }, time: 5 } },
                            { text: '👋 这回不办', next: null }
                        ]
                    }
                }
            });
            if (mounted) window.__glTourneyMounted = true;
        } catch (eAug) {}
    }
    if (typeof window.addEventListener === 'function') {
        window.addEventListener('load', mountTourneyAugment);
        if (typeof document !== 'undefined' && document.readyState === 'complete') { try { mountTourneyAugment(); } catch (eL) {} }
    } else { try { mountTourneyAugment(); } catch (eL2) {} }

    window.GrandLegacy = {
        CFG: CFG, EXAMS: EXAMS,
        open: open, tourGate: tourGate,
        examOk: examOk, examP: examP, sitExam: sitExam,
        officeOk: officeOk, takeOffice: takeOffice, salaryOf: salaryOf,
        emperorOk: emperorOk, doProclaim: doProclaim, proclaimPanel: proclaimPanel, proclaimReadEra: proclaimReadEra,
        preachOk: preachOk, doPreach: doPreach, followersOf: followersOf, incenseGain: incenseGain,
        earthgodOk: earthgodOk, doEarthgod: doEarthgod,
        artOk: artOk, artPanel: artPanel, doCreateArt: doCreateArt, masteredCount: masteredCount,
        scriptOk: scriptOk, writeScripture: writeScripture,
        tourneyOk: tourneyOk, startTourney: startTourney, startTourneyRound: startTourneyRound, settleTourneyFight: settleTourneyFight, tourEnemy: tourEnemy,
        dailyTick: dailyTick, sectLine: sectLine,
        dynastyVoice: dynastyVoice,                                        // v27.13 模块⑫回写③：朝代口径读口（告示/官称换国号的门）
        chainBoost: chainBoost, chainDone: chainDone, CHAIN_TABLE: CHAIN_TABLE,   // v27.13 模块⑫连锁：读口与表（事件池/行情 consumer 用）
        state: _export, _import: _import, _reset: _reset
    };
    window.openGrandLegacy = function () { return open(); };
    window.settleTourneyFight = settleTourneyFight;

    // ===== v27.15：招摇伪徒的对质口（enterCity 链尾第六钩——耳语/画影册同款串联） =====
    // 你进了案发城：伪徒就在街上收徒敛钱。两条路：
    //   ① 当众讲经对质（学识掷）：成了当场戳穿+名望+6（伪徒连夜出城）；学识不济=口拙+名望再-2
    //   ② 雇说书人散话（10 灵石）：温和辟谣+名望+3——钱能解决的事，就不劳学问了
    // 不去管就一直挂着（名望只扣已扣的那笔，不滚利息——世界不迁就玩家，但也不无限罚）。
    (function () {
        'use strict';
        if (typeof window === 'undefined') return;
        try {
            var _origEnterEcho = window.enterCity;
            if (typeof _origEnterEcho !== 'function' || _origEnterEcho.__echoCityWrapped) return;
            window.enterCity = function (cityName) {
                var r = _origEnterEcho.apply(this, arguments);
                try {
                    if (r !== false) _echoOnEnter(String(cityName || ''));
                } catch (eEc15) { console.warn('[静默失败] js/grand-legacy.js · 招摇对质钩：进城没对上账（伪徒接着行骗）', eEc15 && eEc15.message); }
                return r;
            };
            window.enterCity.__echoCityWrapped = true;
        } catch (eHookEc15) { console.warn('[静默失败] js/grand-legacy.js · 招摇对质钩没挂上（伪徒无人管了）', eHookEc15 && eHookEc15.message); }

        function _echoOnEnter(city) {
            var p = _st.echoPending;
            if (!p || p.city !== city) return;
            var title = (_st.scripture && _st.scripture.title) || '你的经';
            var body = '<p class="text-sm text-gray-300 mb-2">街口茶棚，一个青衫人正拍着桌子讲「' + title + '」——讲到收徒处，铜钱串子往袖里收得熟练。围看的百姓里，有人认出了你。</p>' +
                '<p class="text-xs text-gray-500 mb-3">怎么了结这场「再传弟子」？</p>';
            var btn = 'class="w-full text-left p-3 rounded border border-gray-600 hover:border-amber-400 bg-gray-800/80 mb-2 text-sm"';
            body += '<button onclick="window.GrandLegacy.echoChoose(\'debate\')" ' + btn.replace('p-3', 'bg-amber-900 p-3') + '>📚 当众讲经对质（学识掷——成了名望+6，伪徒连夜出城；口拙了名望再-2）</button>';
            body += '<button onclick="window.GrandLegacy.echoChoose(\'hire\')" ' + btn.replace('p-3', 'bg-slate-800 p-3') + '>🎭 雇说书人散话（10 灵石——茶棚里连讲三日「真经何处」，名望+3）</button>';
            body += '<button onclick="window.GrandLegacy.echoChoose(\'leave\')" ' + btn + '>🚶 先不管（他就还在那骗着——账挂着，你随时回来）</button>';
            try { if (typeof window.showBuildingEffectDialog === 'function') window.showBuildingEffectDialog('🎭 冒名的「再传弟子」（' + city + '）', body); }
            catch (eDlg) { say('🎭 ' + city + '街口有个冒你名收徒敛钱的——「' + title + '再传弟子」。当众对质（学识）或雇人散话（10 灵石），都能了结。', 'info'); }
        }
        window.GrandLegacy.echoChoose = function (k) {
            var p = _st.echoPending;
            if (!p) return;
            var city = p.city, title = (_st.scripture && _st.scripture.title) || '你的经';
            if (k === 'debate') {
                var sch = 0;
                try { sch = (typeof window.getScholarship === 'function') ? (Number(window.getScholarship()) || 0) : ((cd() && cd().scholarship) || 0); } catch (eSch) {}
                var win = (Math.random() * 100 < 30 + sch * 0.8);
                if (win) {
                    repUp(city, 6);
                    log('📚 你在茶棚坐下，把「' + title + '」真讲了半卷——讲到收徒处，青衫人的脸一路白下去。当夜，他出了城。围看的百姓记住了谁是真著者（名望+6）。', 'success');
                } else {
                    repUp(city, -2);
                    log('📚 你开口讲了三句，被他抢白得接不上——著者本人输了场经义，比伪徒更难看（名望-2）。散了的人心里犯嘀咕。', 'danger');
                }
                _st.echoPending = null;
            } else if (k === 'hire') {
                var c = cd();
                var stones = stonesNow();
                if (stones < 10) { say('灵石不够（雇说书人要 10 枚）——先去挣点。', 'warning'); return; }
                try { if (c && typeof c.spiritStones === 'number') c.spiritStones -= 10; else if (window.DataManager && window.DataManager.addSpiritStones) window.DataManager.addSpiritStones(-10); } catch (ePay) {}
                repUp(city, 3);
                log('🎭 说书人收了钱，茶棚里连讲三日「' + title + '真何处」——讲到伪徒那段，满堂哄笑。伪徒收摊走了（名望+3，-10 灵石）。', 'success');
                _st.echoPending = null;
            }
            // leave：不动账——echoPending 挂着，回城再对
            try { if (typeof window.updateCurrencyUI === 'function') window.updateCurrencyUI(); } catch (eU) {}
        };
    })();
})();
