// ==================== v27.5 家业与闲趣批 · 家业系统（新文件 family-system.js） ====================
// 设计方案 G 引擎：94 立宗族修族谱 · 95 建祠堂 · 96 养儿育女（并入既有子嗣账，不另立门户） ·
//   97 收义子 · 98 乔迁宴 · 99 捡土狗 · 100 恩仇簿（C 善举 / E 通缉 / F 断案三本账自动记账，本身零操作）。
// 模型：家业是一生一回的里程碑账——立了宗、建了祠、领了孩子、捡了狗，就此入账；
//   此后**一季度一件家事**（新日订阅自动过账，零按钮零追人）：族亲送礼、祠堂香火、孩子功课、土狗看家。
// 纪律：①土狗是凡人宠物——不会打只会守家摇尾巴，与灵兽严格分账（不进兽栏、不占魂印、不入图鉴血脉账）；
//       ②义子与亲生共用 _children 一本账（长成/传功/历练/孝敬全走 marriage-offspring 现成线），
//         当年受托孤养大的「福儿」若人情账在外，领回来不用彩礼钱——恩是恩，义是义；
//       ③乔迁宴一处洞府一回（迁到新洞天再办），宴请的是当前所在城的街坊（城望记在那座城）；
//       ④恩仇簿只读不写——善举/人情翻 GoodDeeds 账、民愤翻 NpcCrime 账、义名翻 CaseSystem 账，零新状态；
//       ⑤银钱一笔事务走 RewardService，锁就亮锁（差什么写在牌面上），明账（花多少得多少逐条写清）。
(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    var CFG = {
        CLAN_COST: 200, CLAN_REP_NEED: 10, CLAN_REP_GAIN: 2, CLAN_KARMA: 1,   // 94 立宗族
        HALL_COST: 400, HALL_REP: 1, HALL_KARMA: 2,                            // 95 建祠堂
        RITE_KARMA: 1, RITE_MOOD: 3,                                           // 节日自动祭祖（零按钮）
        ADOPT_COST: 60, ADOPT_KARMA: 3, ADOPT_MOOD: 5, ADOPT_REP: 1,           // 97 收义子
        BANQUET_COST: 120, BANQUET_REP: 3, BANQUET_MOOD: 10, BANQUET_KARMA: 1, // 98 乔迁宴
        DOG_PET_MOOD: 2,                                                        // 99 土狗：一日一摸
        FAMEVT_GAP: 90,                                                         // 一季度一件家事
        CHILD_CAP: 3                                                            // 与 marriage-offspring 同口径
    };
    var ORPHAN_NAMES = ['小栓子', '石头', '妞妞', '阿禾', '铁蛋', '小雪'];

    var _st = {
        clan: null,        // {name, city, day}
        hall: null,        // {city, day, lastRite}
        dog: null,         // {day, name, petDay}
        banquet: {},       // siteId -> 办宴日
        lastFamEvt: 0      // 上一次家事的绝对日（家有内容那天起算）
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
    function settle(spec, source) {
        try {
            if (window.RewardService && typeof window.RewardService.apply === 'function') {
                var r = window.RewardService.apply(spec, { source: source || '家业', city: city() });
                return { ok: !!(r && r.success !== false), note: r && r.messages ? r.messages.join('、') : '' };
            }
        } catch (e) { console.warn('[静默失败] js/family-system.js · settle：这笔家账没落成一笔', e && e.message); }
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
    function repVal(ct) {
        try { if (typeof window.getReputationValue === 'function') return Number(window.getReputationValue(ct)) || 0; } catch (e) {}
        return 0;
    }
    function repUp(ct, n) { try { if (ct && typeof window.addReputation === 'function') window.addReputation(ct, n); } catch (e) {} }
    function deed(mood, s) { try { if (typeof window.playerPushDeed === 'function') window.playerPushDeed(mood, s); } catch (e) {} }
    function refresh() { try { if (window.updateCharacterStatus) window.updateCharacterStatus(); } catch (e) {} }
    function seedOf(s) { var h = 0; s = String(s || ''); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
    function journal(type, title, text) { try { if (window.WorldJournal && window.WorldJournal.record) window.WorldJournal.record({ type: type, title: title, text: text }); } catch (e) {} }
    function inCity() {
        var ct = city();
        if (!ct) return '';
        try { if (window.locationSystem && window.locationSystem.getCityData && !window.locationSystem.getCityData(ct)) return ''; } catch (e) {}
        return ct;
    }
    function daoBond() {
        try { if (typeof window.getDaoCompanionBond === 'function') return window.getDaoCompanionBond(); } catch (e) {}
        return null;
    }
    function children() {
        var c = cd();
        return (c && Array.isArray(c._children)) ? c._children : [];
    }
    // 家有内容才谈家事——四样家业一样没有，季度事件不空转
    function hasFamily() {
        return !!(_st.clan || _st.hall || _st.dog || children().length);
    }
    function houseSite() {
        try {
            var h = window.playerHouse;
            if (h && h.type && h.location) return String(h.location);
        } catch (e) {}
        return '';
    }

    // ============ 94 立宗族 · 修族谱（一生一回） ============
    function clanOk() {
        var ct = inCity();
        if (!ct) return { ok: false, why: '你身在城外——立宗族要在城里请族老、开宗祠酒。' };
        if (_st.clan) return { ok: false, why: '宗族已立（「' + _st.clan.name + '」）——一人一世，只立一回宗。' };
        if (repVal(ct) < CFG.CLAN_REP_NEED) return { ok: false, why: '城望不足 ' + CFG.CLAN_REP_NEED + '（现 ' + repVal(ct) + '）——族人不服，宗立不起来。多行善举、多办差事攒城望。' };
        if (stonesNow() < CFG.CLAN_COST) return { ok: false, why: '灵石不足（修谱开宗酒要 ' + CFG.CLAN_COST + '，现 ' + stonesNow() + '）。' };
        return { ok: true, city: ct };
    }
    function foundClan() {
        var g = clanOk();
        if (!g.ok) { say('📜 ' + g.why, 'warning'); return false; }
        var c = cd();
        var surname = String((c && c.name) || '无').charAt(0);
        var r = settle({ stones: -CFG.CLAN_COST, karma: CFG.CLAN_KARMA }, '立宗族');
        if (!r.ok) { say('📜 灵石不够，宗祠酒摆不起来——这笔钱要一次付清。', 'warning'); return false; }
        _st.clan = { name: surname + '氏宗族', city: g.city, day: absDay() };
        if (!_st.lastFamEvt) _st.lastFamEvt = absDay();
        repUp(g.city, CFG.CLAN_REP_GAIN);
        journal('family', '立宗族', '你在' + g.city + '立起「' + _st.clan.name + '」——修族谱、开宗酒，从此世上有了这一支的谱系。');
        deed('good', surname + '氏在' + g.city + '立了宗族、修了族谱——族老们说，这是给这一支后人立了根。');
        log('📜 宗族立起来了：「' + _st.clan.name + '」落籍' + g.city + '。族谱头一页写着你的名字——往后道侣、子女、义子，都往这本谱里添。（城望+' + CFG.CLAN_REP_GAIN + '）', 'success');
        refresh();
        open();
        return true;
    }

    // ============ 95 建祠堂（一生一回，须先立宗） ============
    function hallOk() {
        if (_st.hall) return { ok: false, why: '祠堂已建——香火自有后人续，不用你再操心。' };
        if (!_st.clan) return { ok: false, why: '还没立宗族——没有谱系，祠堂里供谁？先去「立宗族修族谱」。' };
        var ct = inCity();
        if (!ct) return { ok: false, why: '你身在城外——祠堂要族老们看着落成的，进城再办。' };
        if (pkCity(ct) !== pkCity(_st.clan.city)) return { ok: false, why: '祠堂要建在宗族落籍的「' + _st.clan.city + '」——祖根所在，不能乱挪。' };
        if (stonesNow() < CFG.HALL_COST) return { ok: false, why: '灵石不足（砖瓦香案要 ' + CFG.HALL_COST + '，现 ' + stonesNow() + '）。' };
        return { ok: true, city: ct };
    }
    function buildHall() {
        var g = hallOk();
        if (!g.ok) { say('🏛️ ' + g.why, 'warning'); return false; }
        var r = settle({ stones: -CFG.HALL_COST, karma: CFG.HALL_KARMA }, '建祠堂');
        if (!r.ok) { say('🏛️ 灵石不够，砖瓦钱付不出——这是一次性的大开销。', 'warning'); return false; }
        _st.hall = { city: g.city, day: absDay(), lastRite: -1 };
        if (!_st.lastFamEvt) _st.lastFamEvt = absDay();
        repUp(g.city, CFG.HALL_REP);
        journal('family', '建祠堂', '祠堂落成——三间瓦房一方香案，列祖的牌位虽还没几块，香火从今天起是有了。');
        deed('good', '你为' + _st.clan.name + '建了祠堂——族老们捻着胡子说：这孩子，不忘本。');
        log('🏛️ 祠堂落成了。逢年节你在' + g.city + '，会自动上香祭祖（因果+' + CFG.RITE_KARMA + ' 心境+' + CFG.RITE_MOOD + '，零按钮）。', 'success');
        refresh();
        open();
        return true;
    }
    // 节日自动祭祖（新日订阅，零按钮）：人在祠堂那座城、今日是节令，就上香
    function hallRiteTick() {
        if (!_st.hall) return;
        var d = absDay();
        if (!d || _st.hall.lastRite === d) return;
        var fest = null;
        try { if (window.FestivalFair && typeof window.FestivalFair.todayFestival === 'function') fest = window.FestivalFair.todayFestival(); } catch (e) {}
        if (!fest) return;
        if (pkCity(city()) !== pkCity(_st.hall.city)) return;   // 人不在祠堂城里，这节就遥祭——不扣账也不发账
        _st.hall.lastRite = d;
        settle({ karma: CFG.RITE_KARMA, mood: CFG.RITE_MOOD }, '祠堂祭祖');
        log('🏛️ 今日' + fest.name + '，你到祠堂上了三炷香。烟直直地升——老人们说，这是祖宗收着了。（因果+' + CFG.RITE_KARMA + ' 心境+' + CFG.RITE_MOOD + '）', 'success');
        refresh();
    }

    // ============ 97 收义子（与亲生共用 _children 一本账） ============
    // 当年受托孤养大的「福儿」（v27.2 人情账 kind:'orphan' 在外未还）——领回来不用彩礼钱。
    function pendingOrphanFavor() {
        try {
            var GD = window.GoodDeeds;
            var rep = window.cityReputation;
            if (!GD || typeof GD.ledgerOf !== 'function' || !rep) return null;
            for (var ck in rep) {
                var led = GD.ledgerOf(ck);
                if (!led || !Array.isArray(led.favors)) continue;
                for (var i = 0; i < led.favors.length; i++) {
                    if (led.favors[i] && led.favors[i].kind === 'orphan') return { city: ck, favor: led.favors[i] };
                }
            }
        } catch (e) {}
        return null;
    }
    function adoptOk() {
        var ct = inCity();
        if (!ct) return { ok: false, why: '你身在城外——领孩子要过官府的名分手续，进城去办。' };
        var kids = children();
        if (kids.length >= CFG.CHILD_CAP) return { ok: false, why: '膝下已有 ' + kids.length + ' 个孩子（上限 ' + CFG.CHILD_CAP + '）——再领，照应不过来了。' };
        for (var i = 0; i < kids.length; i++) {
            if (kids[i] && kids[i].adopted) return { ok: false, why: '义子已领过一位「' + (kids[i].name || '') + '」——一世一位，多了名分不清。' };
        }
        var po = pendingOrphanFavor();
        if (!po && stonesNow() < CFG.ADOPT_COST) return { ok: false, why: '灵石不足（给善堂的彩礼与落户钱要 ' + CFG.ADOPT_COST + '，现 ' + stonesNow() + '）。' };
        return { ok: true, city: ct, orphan: po };
    }
    function adoptChild() {
        var g = adoptOk();
        if (!g.ok) { say('🧒 ' + g.why, 'warning'); return false; }
        var c = cd();
        if (!Array.isArray(c._children)) c._children = [];
        var name, flavor;
        if (g.orphan) {
            name = '福儿';
            flavor = '当年你从老汉怀里接过的娃娃，如今正式入了你家的谱。官府的名分落下来那天，他管你叫「爹」，叫得比谁都响。';
        } else {
            if (!settle({ stones: -CFG.ADOPT_COST }, '收义子').ok) { say('🧒 灵石不够，善堂那边没法交代。', 'warning'); return false; }
            var pool = ORPHAN_NAMES;
            name = pool[seedOf(pkCity(g.city) + '_adopt_' + absDay()) % pool.length];
            flavor = '善堂的老嬷嬷领出来一个怯生生的孩子——爹娘都没了，抱着个豁口的木碗。你蹲下来跟他平视，他看了你半晌，把木碗塞给了老嬷嬷。';
        }
        // 半大的孩子：bornDay 前拨 180 日——再长半年就成年（marriage-offspring 的 360 日线现成）
        c._children.push({
            name: name, adopted: true, parentNpcId: null, inheritSkill: null,
            bornDay: absDay() - 180, grown: false
        });
        settle({ karma: CFG.ADOPT_KARMA, mood: CFG.ADOPT_MOOD }, '收义子');
        repUp(g.city, CFG.ADOPT_REP);
        if (!_st.lastFamEvt) _st.lastFamEvt = absDay();
        journal('family', '收义子', flavor);
        deed('good', '你从善堂领了个孩子当义子——老嬷嬷抹着眼泪说，这孩子积了八辈子的德。');
        log('🧒 义子「' + name + '」入了你的家门（' + flavor + '）再长 180 日就成年——传功、历练、孝敬，与亲生的一本账。（因果+' + CFG.ADOPT_KARMA + ' 心境+' + CFG.ADOPT_MOOD + ' 城望+' + CFG.ADOPT_REP + '）', 'success');
        refresh();
        open();
        return true;
    }

    // ============ 98 乔迁宴（一处洞府一回） ============
    function banquetOk() {
        var site = houseSite();
        if (!site) return { ok: false, why: '你还没有洞府——先置办一处家，才谈得上乔迁之喜。' };
        if (_st.banquet[site]) return { ok: false, why: '这处洞府的乔迁宴已经办过了（第 ' + _st.banquet[site] + ' 日）——迁去新洞天，才有新的乔迁之喜。' };
        var ct = inCity();
        if (!ct) return { ok: false, why: '宴请的是城里的街坊故旧——人在城外，客从哪儿来？' };
        if (stonesNow() < CFG.BANQUET_COST) return { ok: false, why: '灵石不足（酒席要 ' + CFG.BANQUET_COST + '，现 ' + stonesNow() + '）。' };
        return { ok: true, site: site, city: ct };
    }
    function holdBanquet() {
        var g = banquetOk();
        if (!g.ok) { say('🏮 ' + g.why, 'warning'); return false; }
        var r = settle({ stones: -CFG.BANQUET_COST, mood: CFG.BANQUET_MOOD, karma: CFG.BANQUET_KARMA }, '乔迁宴');
        if (!r.ok) { say('🏮 灵石不够，酒席钱付不出。', 'warning'); return false; }
        _st.banquet[g.site] = absDay();
        repUp(g.city, CFG.BANQUET_REP);
        // 道侣同席：情分+5（marriage-offspring 传功同款口径）
        var dao = daoBond();
        if (dao && dao.bond) dao.bond.progress = clamp(Number(dao.bond.progress) || 0, 0, 100) + 5;
        if (!_st.lastFamEvt) _st.lastFamEvt = absDay();
        journal('family', '乔迁宴', '洞府落成摆了三桌——街坊故旧都来道贺，' + (dao ? '道侣替你挡了半宿的酒，' : '') + '杯盘狼藉，人散时月亮都偏西了。');
        deed('good', '你办了一场乔迁宴，满座街坊都来道贺——有人喝多了，拉着你的手把你家祖上三代夸了个遍。');
        log('🏮 乔迁宴办成了！' + g.city + '的街坊故旧吃了你三桌酒。（城望+' + CFG.BANQUET_REP + ' 心境+' + CFG.BANQUET_MOOD + (dao ? ' 道侣情分+5' : '') + '）', 'success');
        refresh();
        open();
        return true;
    }

    // ============ 99 捡土狗（凡人宠物，与灵兽严格分账） ============
    function dogOk() {
        if (_st.dog) return { ok: false, why: '「' + _st.dog.name + '」已经守着你的家门了——狗不嫌家贫，一世一条。' };
        return { ok: true };
    }
    function takeDog() {
        var g = dogOk();
        if (!g.ok) { say('🐕 ' + g.why, 'info'); return false; }
        var pool = ['大黄', '阿黑', '花斑', '小灰'];
        var name = pool[seedOf('dog_' + absDay()) % pool.length];
        _st.dog = { day: absDay(), name: name, petDay: -1 };
        if (!_st.lastFamEvt) _st.lastFamEvt = absDay();
        settle({ karma: 1 }, '捡土狗');
        journal('family', '捡土狗', '雨夜里一条瘦得脱了形的土狗蹲在你檐下。你分了半个馒头给它，它吃完没走——从此你家门里多了一条' + name + '。');
        log('🐕 你捡回来一条土狗，取名「' + name + '」。它不会打不会飞，也不是灵兽——它只会守家、摇尾巴，在你回家时把尾巴摇成风车。（因果+1）', 'success');
        refresh();
        open();
        return true;
    }
    function petDog() {
        if (!_st.dog) { say('🐕 你还没有狗——城门口倒常有一条蹲着的流浪土狗。', 'info'); return false; }
        var d = absDay();
        if (_st.dog.petDay === d) { say('🐕 ' + _st.dog.name + '今天已经被你摸了好几回了——它四脚朝天躺在你脚边，肚子都摸热了。', 'info'); return false; }
        _st.dog.petDay = d;
        settle({ mood: CFG.DOG_PET_MOOD }, '摸狗');
        log('🐕 你揉了揉' + _st.dog.name + '的脑袋，它眯着眼把整个身子都靠了过来。（心境+' + CFG.DOG_PET_MOOD + '）', 'success');
        refresh();
        open();
        return true;
    }

    // ============ 96 养儿育女 + 一季度一件家事（新日订阅，零按钮零追人） ============
    function familyTick() {
        try {
            hallRiteTick();
            var d = absDay();
            if (!d) return;
            if (!hasFamily()) return;
            if (_st.lastFamEvt && d - _st.lastFamEvt < CFG.FAMEVT_GAP) return;
            if (!_st.lastFamEvt) { _st.lastFamEvt = d; return; }   // 头一回有家：从今天起算一季度
            // 家事池：有什么家业，就出什么家事（按日播种挑一件，零直掷）
            var pool = [];
            var kids = children();
            if (kids.length) pool.push('child');
            if (_st.clan) pool.push('clan');
            if (_st.hall) pool.push('hall');
            if (_st.dog) pool.push('dog');
            if (!pool.length) return;
            var pick = pool[seedOf('fam_' + d) % pool.length];
            _st.lastFamEvt = d;
            if (pick === 'child') {
                var kid = kids[seedOf('kid_' + d) % kids.length];
                var nm = (kid && kid.name) || '孩子';
                if (kid && kid.grown) {
                    settle({ mood: 6, lifeSkill: { name: '学识', exp: 1 } }, '家事');
                    log('👨‍👩‍👧 家事：「' + nm + '」回来看你，带着一路的见闻说了半宿话——末了给你斟了杯茶：「家里都好，您别惦记。」（心境+6 学识+1）', 'success');
                } else {
                    settle({ mood: 6, lifeSkill: { name: '学识', exp: 1 } }, '家事');
                    log('👨‍👩‍👧 家事：「' + nm + '」描了一册《千字文》拿给你看，字还歪，笔锋已经有了。你夸了一句，孩子眼睛亮得像灯。（心境+6 学识+1）', 'success');
                }
            } else if (pick === 'clan') {
                settle({ copper: 40, mood: 3 }, '家事');
                repUp(_st.clan.city, 1);
                log('📜 家事：' + _st.clan.name + '的族亲进城办事，顺路给你捎了一篮土产，篮底还压着四十文钱——「族里添了丁，按谱该给你报个喜。」（铜钱+40 心境+3 ' + _st.clan.city + '城望+1）', 'success');
            } else if (pick === 'hall') {
                settle({ karma: 2, mood: 2 }, '家事');
                log('🏛️ 家事：祠堂的族老捎话说，今年香火比往年旺——邻族的老人路过都要进来拜一拜。你添了二两香油钱。（因果+2 心境+2）', 'success');
            } else if (pick === 'dog') {
                settle({ copper: 15, mood: 4 }, '家事');
                log('🐕 家事：' + _st.dog.name + '夜里撵走了一只偷鸡的黄鼠狼，早上又从土坡上刨出十五文不知谁埋的老钱，叼到你手边摇尾巴。（铜钱+15 心境+4）', 'success');
            }
            refresh();
        } catch (e) { console.warn('[静默失败] js/family-system.js · familyTick：这季的家事没过成账——下季度还会再来', e && e.message); }
    }

    // ============ 100 恩仇簿（只读三本账，零操作零新状态） ============
    function enmityRows() {
        var rows = { grace: 0, favors: 0, favorTexts: [], heat: 0, wanted: false, bounty: 0, noto: 0, solved: 0, caught: 0 };
        // 恩：各城善举件数 + 在外的人情账
        try {
            var GD = window.GoodDeeds;
            var rep = window.cityReputation;
            if (GD && typeof GD.ledgerOf === 'function' && rep) {
                for (var ck in rep) {
                    var led = GD.ledgerOf(ck);
                    if (!led) continue;
                    if (led.done && typeof led.done === 'object') rows.grace += Object.keys(led.done).length;
                    if (Array.isArray(led.favors)) {
                        rows.favors += led.favors.length;
                        for (var i = 0; i < led.favors.length && rows.favorTexts.length < 3; i++) {
                            if (led.favors[i] && led.favors[i].text) rows.favorTexts.push(led.favors[i].text.slice(0, 40));
                        }
                    }
                }
            }
        } catch (e) {}
        // 仇：官府那边的账（民愤热度 / 通缉 / 恶名）
        try { if (window.NpcCrime) { rows.heat = typeof window.NpcCrime.heat === 'function' ? (Number(window.NpcCrime.heat()) || 0) : 0; rows.wanted = typeof window.NpcCrime.wanted === 'function' ? !!window.NpcCrime.wanted() : false; rows.bounty = typeof window.NpcCrime.bounty === 'function' ? (Number(window.NpcCrime.bounty()) || 0) : 0; } } catch (e) {}
        try { rows.noto = Number((cd() && cd().notoriety) || 0) || 0; } catch (e) {}
        // 义：司法堂那边的账（破案 / 缉逃）
        try {
            if (window.CaseSystem && typeof window.CaseSystem.state === 'function') {
                var cs = window.CaseSystem.state() || {};
                rows.solved = Number(cs.solved) || 0;
                rows.caught = Object.keys(cs.caught || {}).length;
            }
        } catch (e) {}
        return rows;
    }
    function enmityHtml() {
        var r = enmityRows();
        var s = '<div class="p-2 bg-stone-900/40 rounded border border-stone-600 mb-2">' +
            '<p class="text-xs font-bold text-stone-200 mb-1">📔 恩仇簿（自动记账 · 不用你翻）</p>' +
            '<p class="text-xs text-emerald-300/90">恩：善举 ' + r.grace + ' 件' + (r.favors ? ' · 在外人情 ' + r.favors + ' 笔' : '') + '</p>' +
            (r.favorTexts.length ? '<p class="text-[11px] text-emerald-200/50 mb-1">' + r.favorTexts.map(function (t) { return '「' + t + '…」'; }).join(' ') + '</p>' : '') +
            '<p class="text-xs ' + (r.wanted ? 'text-red-400' : r.heat >= 8 ? 'text-orange-300' : 'text-stone-400') + '">仇：民愤热度 ' + r.heat + (r.wanted ? ' · 官府画影图形悬赏 ' + r.bounty + ' 灵石' : '') + ' · 恶名 ' + r.noto + '</p>' +
            '<p class="text-xs text-sky-300/90">义：破案 ' + r.solved + ' 桩 · 缉拿亡命 ' + r.caught + ' 名</p>' +
            '</div>';
        return s;
    }

    // ============ 族谱（读 bonds/_children，零新账） ============
    function genealogyHtml() {
        if (!_st.clan) return '';
        var c = cd();
        var lines = ['<p class="text-xs text-amber-200/90 mb-1">📜 <b>' + _st.clan.name + '</b>（第 ' + _st.clan.day + ' 日立于' + _st.clan.city + '）</p>'];
        lines.push('<p class="text-xs text-gray-300">一世 · <b>' + ((c && c.name) || '你') + '</b>（' + ((c && c.realm) || '凡人') + '）' + (_st.hall ? ' · 祠堂已建' : '') + '</p>');
        var dao = daoBond();
        if (dao && dao.bond) lines.push('<p class="text-xs text-rose-300/90">　配 · ' + (dao.bond.name || '道侣') + '</p>');
        var kids = children();
        for (var i = 0; i < kids.length; i++) {
            var k = kids[i] || {};
            lines.push('<p class="text-xs text-pink-200/80">　' + (k.adopted ? '义' : '嗣') + ' · ' + (k.name || '') + (k.grown ? '（已长成' + (k.level ? ' · ' + (['', '入门弟子', '小有所成', '出师之姿', '独当一面', '开枝散叶'][Math.min(k.level || 0, 5)] || '') : '') + '）' : '（未长成）') + '</p>');
        }
        if (_st.dog) lines.push('<p class="text-xs text-yellow-200/60">　守 · ' + _st.dog.name + '（土狗一条，看家护院）</p>');
        return lines.join('');
    }

    // ============ 家业名册（总门） ============
    function open() {
        var c = cd();
        if (!c) { say('先有角色，再谈家业。', 'warning'); return false; }
        var btn = 'class="w-full p-3 rounded mb-2 text-left text-sm text-white hover:opacity-90"';
        var html = '';
        html += enmityHtml();
        // 族谱 / 立宗族
        if (_st.clan) {
            html += '<div class="p-2 bg-amber-900/20 rounded border border-amber-700/50 mb-2">' + genealogyHtml() + '</div>';
        } else {
            var cg = clanOk();
            html += '<button onclick="FamilyHall.foundClan()" ' + btn.replace('p-3', (cg.ok ? 'bg-amber-800' : 'bg-gray-700') + ' p-3') + '>📜 立宗族 · 修族谱（' + CFG.CLAN_COST + ' 灵石 · 须城望 ' + CFG.CLAN_REP_NEED + ' · 一生一回' + (cg.ok ? '' : ' · ⛔ ' + cg.why) + '）</button>';
        }
        // 祠堂
        if (_st.hall) {
            html += '<p class="text-xs text-stone-300 mb-2 p-2 bg-stone-800/50 rounded">🏛️ 祠堂已建（' + _st.hall.city + ' · 第 ' + _st.hall.day + ' 日落成）——逢节在城自动上香，香火自有后人续。</p>';
        } else {
            var hg = hallOk();
            html += '<button onclick="FamilyHall.buildHall()" ' + btn.replace('p-3', (hg.ok ? 'bg-stone-700' : 'bg-gray-700') + ' p-3') + '>🏛️ 建祠堂（' + CFG.HALL_COST + ' 灵石 · 须先立宗 · 逢节自动祭祖' + (hg.ok ? '' : ' · ⛔ ' + hg.why) + '）</button>';
        }
        // 义子
        var kids = children();
        var hasAdopted = kids.some ? kids.some(function (k) { return k && k.adopted; }) : false;
        if (hasAdopted) {
            html += '<p class="text-xs text-pink-300/80 mb-2 p-2 bg-pink-900/20 rounded">🧒 义子已入谱——膝下 ' + kids.length + ' 个孩子，传功历练去修炼面板「会见子嗣」。</p>';
        } else {
            var ag = adoptOk();
            var po = pendingOrphanFavor();
            html += '<button onclick="FamilyHall.adoptChild()" ' + btn.replace('p-3', (ag.ok ? 'bg-pink-800' : 'bg-gray-700') + ' p-3') + '>🧒 收义子（' + (po ? '当年托孤的「福儿」在等你领——不用彩礼' : CFG.ADOPT_COST + ' 灵石 · 善堂落户') + ' · 一世一位 · 与亲生一本账' + (ag.ok ? '' : ' · ⛔ ' + ag.why) + '）</button>';
        }
        // 乔迁宴
        var bg = banquetOk();
        html += '<button onclick="FamilyHall.holdBanquet()" ' + btn.replace('p-3', (bg.ok ? 'bg-orange-800' : 'bg-gray-700') + ' p-3') + '>🏮 乔迁宴（' + CFG.BANQUET_COST + ' 灵石 · 宴请' + (bg.ok ? bg.city : '城里') + '街坊 · 一处洞府一回 · 城望+' + CFG.BANQUET_REP + (bg.ok ? '' : ' · ⛔ ' + bg.why) + '）</button>';
        // 土狗
        if (_st.dog) {
            html += '<button onclick="FamilyHall.petDog()" ' + btn.replace('p-3', 'bg-yellow-900 p-3') + '>🐕 摸摸' + _st.dog.name + '（一日一回 · 心境+' + CFG.DOG_PET_MOOD + ' · 它把尾巴摇成了风车）</button>';
        } else {
            html += '<button onclick="FamilyHall.takeDog()" ' + btn.replace('p-3', 'bg-yellow-900 p-3') + '>🐕 捡回门口那条流浪土狗（免费 · 一世一条 · 不会打只会守家——灵兽是灵兽，狗是狗）</button>';
        }
        html += '<p class="text-[11px] text-gray-500 mt-1">家业账——一季度自动过一件家事（族亲送礼 / 祠堂香火 / 孩子功课 / 土狗看家），零按钮，事不追人。生儿育女在修炼面板「道侣子嗣」。</p>';
        if (typeof window.showModal === 'function') { window.showModal('🏠 家业名册', html); return true; }
        say('🏠 家业名册（弹窗没开起来）：立宗 ' + (_st.clan ? '✅' : '—') + ' 祠堂 ' + (_st.hall ? '✅' : '—') + ' 义子 ' + (hasAdopted ? '✅' : '—') + ' 土狗 ' + (_st.dog ? '✅' : '—'));
        return true;
    }

    // ============ 存读档（StateRegistry 正门，零新 localStorage 键） ============
    function _export() { return JSON.parse(JSON.stringify(_st)); }
    function _import(s) {
        if (!s || typeof s !== 'object') return;
        var d0 = absDay();
        if (s.clan && typeof s.clan === 'object' && typeof s.clan.name === 'string' && s.clan.name && typeof s.clan.city === 'string' && s.clan.city) {
            _st.clan = { name: String(s.clan.name).slice(0, 20), city: String(s.clan.city).slice(0, 30), day: Number.isFinite(Number(s.clan.day)) ? Math.max(0, Math.floor(Number(s.clan.day))) : 0 };
        } else _st.clan = null;
        if (_st.clan && s.hall && typeof s.hall === 'object' && typeof s.hall.city === 'string' && s.hall.city) {
            _st.hall = { city: String(s.hall.city).slice(0, 30), day: Number.isFinite(Number(s.hall.day)) ? Math.max(0, Math.floor(Number(s.hall.day))) : 0, lastRite: Number.isFinite(Number(s.hall.lastRite)) ? Math.floor(Number(s.hall.lastRite)) : -1 };
        } else _st.hall = null;   // 没立宗却有祠堂 = 坏账，剔除
        if (s.dog && typeof s.dog === 'object' && typeof s.dog.name === 'string' && s.dog.name) {
            _st.dog = { day: Number.isFinite(Number(s.dog.day)) ? Math.max(0, Math.floor(Number(s.dog.day))) : 0, name: String(s.dog.name).slice(0, 10), petDay: Number.isFinite(Number(s.dog.petDay)) ? Math.floor(Number(s.dog.petDay)) : -1 };
        } else _st.dog = null;
        _st.banquet = {};
        if (s.banquet && typeof s.banquet === 'object') {
            var n = 0;
            for (var k in s.banquet) {
                if (n >= 30) break;
                if (typeof k === 'string' && k && Number.isFinite(Number(s.banquet[k])) && Number(s.banquet[k]) >= 0) { _st.banquet[k.slice(0, 40)] = Math.floor(Number(s.banquet[k])); n++; }
            }
        }
        _st.lastFamEvt = Number.isFinite(Number(s.lastFamEvt)) ? Math.floor(Number(s.lastFamEvt)) : 0;
        if (_st.lastFamEvt > d0 + 1) _st.lastFamEvt = d0;   // 未来日戳夹回今天
    }
    function _reset() { _st = { clan: null, hall: null, dog: null, banquet: {}, lastFamEvt: 0 }; }
    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        window.StateRegistry.register('familyHall', { version: 1, export: _export, import: _import, reset: _reset });
    }
    try {
        if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') window.timeSystem.onNewDaySubscribe(familyTick);
    } catch (eSub) {}

    window.FamilyHall = {
        CFG: CFG,
        open: open,
        clanOk: clanOk, foundClan: foundClan,
        hallOk: hallOk, buildHall: buildHall, hallRiteTick: hallRiteTick,
        adoptOk: adoptOk, adoptChild: adoptChild, pendingOrphanFavor: pendingOrphanFavor,
        banquetOk: banquetOk, holdBanquet: holdBanquet,
        dogOk: dogOk, takeDog: takeDog, petDog: petDog,
        familyTick: familyTick, hasFamily: hasFamily,
        enmityRows: enmityRows, enmityHtml: enmityHtml, genealogyHtml: genealogyHtml,
        state: _export, _import: _import, _reset: _reset
    };
    window.openFamilyHall = function () { return open(); };
})();
