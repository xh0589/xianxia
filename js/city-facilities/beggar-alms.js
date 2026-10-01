// ==================== v25.7 市井烟火批（第一百四十九批）· 街角施舍（丐帮眼线账） ====================
// 此前乞丐只是市民职业表里的一行装饰（location-system.js 的 CITIZEN_OCCUPATIONS），碰上了什么也做不了；
// 而丐帮那边，消息网（fx_gb_xiaoxi）、街谈网、百耳通街底子都立着「天下乞丐皆耳目」的人设，
// 城里城外的叫花子却与丐帮**零关联**——本账把这条线接上。
//
// 口径（用户点单：乞丐很多是丐帮的眼线，注意增加与丐帮的关联性）：
//   · 施舍三档：铜板（2 铜·业障+1）/ 干粮（行囊里真扣一件吃食·业障+2）/ 灵石（1 灵石·业障+3），
//     钱物与善恶同一笔 RewardService 结算，凑不出整单不成；
//   · 「丐帮缘分」（goodwill 0~100）落档（StateRegistry 正门），三档台阶：
//       缘分 3 —— 乞丐认得你了：递一条**真行情**（吃 MarketDynamic 现账，行情不在位退回市民闲话池，
//                 再不在位说句套话，绝不编假消息）+ 传闻池记一笔「常施舍的善人」；
//       缘分 10 —— 丐帮耳目认下这份情：从此**有人盯你家的梢，道上会提前递话**——
//                 押货跑商的截道风声、洞府守卫战的夜袭风声各让一截（watchDiscount 正门，
//                 caravan-trade.js / cave-siege.js 两侧带守卫接线，本账不在位时一分不让）；
//       缘分 25 —— 老乞丐直起身子：原来是丐帮下来吃红尘的**长老**。外人得一段街面生存的指点
//                 （学识长进+名气小涨）；若你本就是丐帮弟子，长老认下你的善行（贡献+15）。
//   · 丐帮弟子行善是本分：每次施舍另记门派贡献 +2（污衣派 +3——污衣乞行，最认这碗饭），
//     走 sectAddContribution 正门带 ledger 缘由；弟子每日一次为限（善行贵在诚不在刷），
//     非弟子每日三次为限；
//   · 入口两处：市井烟火菜单「街角施舍」+ 街头闲逛一成五几率撞见（StreetLife 转交 encounter 正门）。
(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    var CFG = {
        COPPER: 2,
        STONE: 1,
        DAILY_CAP: 3,          // 非弟子每日施舍上限
        GB_DAILY_CAP: 1,       // 丐帮弟子每日上限（贡献是门派钱——不能刷）
        GW_COPPER: 2, GW_FOOD: 3, GW_STONE: 5,
        GW_HEART: 3,           // 缘分档一：乞丐认得你
        GW_WATCH: 10,          // 缘分档二：耳目递话（截道/夜袭让风）
        GW_ELDER: 25,          // 缘分档三：长老现身
        GB_CONTRIB: 2,         // 弟子施舍的门派贡献
        GB_CONTRIB_DIRTY: 3,   // 污衣派多认一分
        ELDER_CONTRIB: 15,     // 长老认下善行（弟子）
        WATCH_CARAVAN: 0.04,   // 押货截道让风
        WATCH_SIEGE: 0.03      // 洞府夜袭让风
    };

    var _state = {
        given: 0, copperGiven: 0, foodGiven: 0, stoneGiven: 0,
        goodwill: 0,
        lastDay: -1, todayGives: 0,
        noted3: false, noted10: false, elderMet: false
    };

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
    function settle(spec) {
        try {
            if (window.RewardService && typeof window.RewardService.apply === 'function') {
                var r = window.RewardService.apply(spec, { source: '街角施舍', city: city() });
                return { ok: !!(r && r.success !== false), note: r && r.messages ? r.messages.join('、') : '' };
            }
        } catch (e) { console.warn('[静默失败] js/city-facilities/beggar-alms.js · settle：这笔善行没落成一笔账', e && e.message); }
        return { ok: false, note: '' };
    }
    function isGbMember() {
        try {
            var ds = window.discipleState;
            return !!(ds && ds.isInSect && (ds.sectId === '丐帮' || ds.sectName === '丐帮'));
        } catch (e) { return false; }
    }
    function gbSide() {
        try {
            var ds = window.discipleState;
            return (ds && ds._gbFaction && ds._gbFaction.side) || null;
        } catch (e) { return null; }
    }
    function rollDay() {
        var d = absDay();
        if (_state.lastDay !== d) { _state.lastDay = d; _state.todayGives = 0; }
        return d;
    }
    function tplOf(slot) {
        try {
            if (slot && typeof slot.getTemplate === 'function') return slot.getTemplate();
            var id = slot && (slot.templateId || slot.id);
            return (id && window.itemById && window.itemById[id]) || null;
        } catch (e) { return null; }
    }
    // 行囊里第一件能入口的吃食（任务信物不进碗）
    function findFood() {
        try {
            var slots = (window.inventory && window.inventory.slots) || [];
            for (var i = 0; i < slots.length; i++) {
                var s = slots[i];
                if (!s || !(Number(s.count) > 0)) continue;
                var t = tplOf(s);
                if (!t) continue;
                if (t.category === 'quest') continue;
                if (t.subtype === 'food' || t.type === 'food') {
                    return { itemId: t.id || s.templateId || s.id, name: t.name || '吃食' };
                }
            }
        } catch (e) { console.warn('[静默失败] js/city-facilities/beggar-alms.js · findFood：行囊没翻动——这顿干粮施不成了', e && e.message); }
        return null;
    }
    // 真行情口条：哪个大区哪类货最俏（MarketDynamic 现账）；不在位退市民闲话池；再不在位说套话
    function beggarIntel() {
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
                if (best && best.mul > 1.02) {
                    return '「' + best.region + '的' + best.cat + '正缺得狠（行市 ' + (Math.round(best.mul * 10) / 10) + ' 倍）——城门口天天有人贴单子收，脚力勤快的能赚。」';
                }
            }
        } catch (eMD) { console.warn('[静默失败] js/city-facilities/beggar-alms.js · beggarIntel：行情账没读出来，退回闲话池', eMD && eMD.message); }
        try {
            if (typeof window.getCitizenGossip === 'function') {
                var pool = window.getCitizenGossip() || [];
                if (pool.length) {
                    var g = pool[Math.floor(Math.random() * pool.length)];
                    return '「' + g.text + '」';
                }
            }
        } catch (eG) { console.warn('[静默失败] js/city-facilities/beggar-alms.js · beggarIntel：闲话池也没读出来，说句吉祥话', eG && eG.message); }
        return '「好人一生平安——小的们嘴上没别的话，就这一句是真心的。」';
    }

    // ============ 施舍一档 ============
    // kind: 'copper' | 'food' | 'stone'
    function give(kind) {
        var c = cd();
        if (!c) return false;
        if (!city()) { say('🥣 你身在野外——四下没有街角，也没有乞丐。', 'info'); return false; }
        if (window.currentBattle) { say('🥣 打着架呢，乞丐早跑没影了。', 'warning'); return false; }
        rollDay();
        var cap = isGbMember() ? CFG.GB_DAILY_CAP : CFG.DAILY_CAP;
        if (_state.todayGives >= cap) {
            say(isGbMember()
                ? '🥣 今日已替帮里行过善了——长老说过，善行贵在诚，不在多。'
                : '🥣 今日已施舍过 ' + cap + '回了。老乞丐摆手：「善人，心到就够了，留着钱赶路。」', 'info');
            return false;
        }

        var spec, gw, thanks;
        if (kind === 'food') {
            var food = findFood();
            if (!food) { say('🥣 行囊里没有能入口的吃食——总不能把空碗递给空碗。', 'info'); return false; }
            spec = { take: [{ itemId: food.itemId, count: 1 }], karma: 2, mood: 2 };
            gw = CFG.GW_FOOD;
            thanks = '老乞丐双手接过那口' + food.name + '，也不嫌凉，掰了一半塞进怀里的小乞儿，冲你深深一揖。';
        } else if (kind === 'stone') {
            spec = { spiritStones: -CFG.STONE, karma: 3, mood: 2 };
            gw = CFG.GW_STONE;
            thanks = '灵石落在豁口粗碗里，叮的一声脆响。老乞丐眯眼打量你：「出手就是灵石……善人，你这不是施舍，是结善缘。」';
        } else {
            kind = 'copper';
            spec = { copper: -CFG.COPPER, karma: 1, mood: 1 };
            gw = CFG.GW_COPPER;
            thanks = '几枚铜板落进豁口粗碗。老乞丐点点头：「多谢善人。」';
        }
        var r = settle(spec);
        if (!r.ok) {
            say(kind === 'food' ? '🥣 那口吃食没能递出去——碗还空着。' : '🥣 你摸了摸口袋，连这点钱都凑不出——老乞丐反倒安慰你：「难处谁都有的。」', 'warning');
            return false;
        }

        _state.given++;
        _state.todayGives++;
        if (kind === 'food') _state.foodGiven++; else if (kind === 'stone') _state.stoneGiven++; else _state.copperGiven++;
        _state.goodwill = Math.min(100, _state.goodwill + gw);

        // 丐帮弟子：行善是本分，帮里记账（污衣乞行，最认这碗饭）
        var gbTail = '';
        if (isGbMember()) {
            var contrib = (gbSide() === 'dirty') ? CFG.GB_CONTRIB_DIRTY : CFG.GB_CONTRIB;
            try {
                if (typeof window.sectAddContribution === 'function') {
                    window.sectAddContribution(contrib, '街头施舍·行的是帮里的道');
                    gbTail = '（帮里记功：贡献+' + contrib + (gbSide() === 'dirty' ? '，污衣派最认这碗饭' : '') + '）';
                }
            } catch (eS) { console.warn('[静默失败] js/city-facilities/beggar-alms.js · give：弟子行善的功劳没记上帮里的账', eS && eS.message); }
        }

        log('🥣 你在' + city() + '的街角施舍了' + (kind === 'food' ? '一口干粮' : kind === 'stone' ? '一枚灵石' : CFG.COPPER + ' 枚铜板') + '。' + thanks + (r.note ? '（' + r.note + '）' : '') + gbTail, 'success');
        say('🥣 ' + thanks + (r.note ? '（' + r.note + '）' : '') + gbTail, 'success');

        // 缘分档一：乞丐认得你了（真行情 + 传闻池一笔）
        if (!_state.noted3 && _state.goodwill >= CFG.GW_HEART) {
            _state.noted3 = true;
            var intel = beggarIntel();
            log('🥣 街角的乞丐们认得你了。老乞丐凑近些，压低声音递来一条道听途说：' + intel, 'success');
            say('🥣 打这天起，街角的乞丐见你会直起身子点头。老乞丐压低声音：' + intel, 'success');
            try { if (typeof window.playerPushDeed === 'function') window.playerPushDeed('good', '你常年在街角施舍——城里的乞丐都认得你的脸'); } catch (eP) { console.warn('[静默失败] js/city-facilities/beggar-alms.js · give：善人的名声没递进传闻池', eP && eP.message); }
        }
        // 缘分档二：耳目递话（截道/夜袭让风的开关从此打开）
        if (!_state.noted10 && _state.goodwill >= CFG.GW_WATCH) {
            _state.noted10 = true;
            log('🥣 丐帮的耳目认下了这份情——天下乞丐皆耳目，从此有人盯你家的梢，道上会提前递话。', 'success');
            say('🥣 老乞丐忽然正色：「善人，帮里认下你这份情。往后有人摸你家的梢、截你押的货，街面上会提前给你递话。」', 'success');
            try {
                if (window.WorldJournal && typeof window.WorldJournal.record === 'function') {
                    window.WorldJournal.record({ type: 'alms', title: '丐帮耳目认情', text: '你常年街角施舍，丐帮的耳目认下了这份情——押货的截道风声与洞府的夜袭风声，从此会有人提前递话。' });
                }
            } catch (eJ) { console.warn('[静默失败] js/city-facilities/beggar-alms.js · give：这桩缘分没记进见闻账', eJ && eJ.message); }
        }
        // 缘分档三：长老现身（一次性）
        if (!_state.elderMet && _state.goodwill >= CFG.GW_ELDER) {
            _state.elderMet = true;
            if (isGbMember()) {
                try {
                    if (typeof window.sectAddContribution === 'function') window.sectAddContribution(CFG.ELDER_CONTRIB, '长老认下你的善行');
                } catch (eC) { console.warn('[静默失败] js/city-facilities/beggar-alms.js · give：长老记的功劳没落上账', eC && eC.message); }
                log('🥣 那位总在同一街角的老乞丐直起身子——竟是帮里下来吃红尘的接引长老。「行善行到自家人头上，」他拍拍你的肩，「帮里记你大功一件。」（贡献+' + CFG.ELDER_CONTRIB + '）', 'success');
                say('🥣 老乞丐直起身子，豁口粗碗往怀里一收——竟是帮里的接引长老！「行善行到自家人头上，帮里记你大功一件。」（贡献+' + CFG.ELDER_CONTRIB + '）', 'success');
            } else {
                try { if (typeof window.growLifeSkill === 'function') window.growLifeSkill('学识', 10, { reason: '老乞丐的指点' }); } catch (eL) { console.warn('[静默失败] js/city-facilities/beggar-alms.js · give：长老的指点没落进学识账', eL && eL.message); }
                var rf = settle({ fame: 2 });
                log('🥣 那位总在同一街角的老乞丐直起身子——原来是丐帮下来吃红尘的长老。他握着你的手摇了摇：「江湖行走，耳朵比剑管用。」临别传你几句街面生存的门道。（学识大长，' + (rf.note || '名气+2') + '）', 'success');
                say('🥣 老乞丐直起身子——原来是丐帮下来吃红尘的长老！「江湖行走，耳朵比剑管用。」他传你几句街面生存的门道，扬长去了。（学识大长，' + (rf.note || '名气+2') + '）', 'success');
            }
        }
        try { if (window.updateCharacterStatus) window.updateCharacterStatus(); } catch (eU) { console.warn('[静默失败] js/city-facilities/beggar-alms.js · give：施舍后面板没刷新', eU && eU.message); }
        return true;
    }

    // ============ 街角遇丐（闲逛撞见 / 菜单主动寻） ============
    function encounter(ct) {
        var c = cd();
        if (!c) return false;
        rollDay();
        var cap = isGbMember() ? CFG.GB_DAILY_CAP : CFG.DAILY_CAP;
        var full = _state.todayGives >= cap;
        var gwLine = _state.goodwill > 0 ? '<p class="text-xs text-amber-400 mb-2">丐帮缘分：' + _state.goodwill + '/100' + (_state.noted10 ? '——耳目认情，道上会提前给你递话' : _state.noted3 ? '——街角乞丐认得你了' : '') + '</p>' : '';
        var html = '<p class="text-sm text-gray-300 mb-2">街角墙根下蹲着个老乞丐，面前一只豁口粗碗，碗里躺着两枚铜板。他抬眼看你——那眼神不像讨饭的，倒像在**认人**。</p>' + gwLine +
            (full ? '<p class="text-xs text-gray-500 mb-2">（今日的善行已尽——' + (isGbMember() ? '帮里的规矩，一日一善' : '心到就够了') + '）</p>' : '');
        var btn = 'class="w-full p-3 rounded mb-2 text-left text-sm text-white hover:opacity-90"';
        if (!full) {
            html += '<button onclick="BeggarAlms.give(\'copper\')" ' + btn.replace('p-3', 'bg-amber-900 p-3') + '>🪙 施舍 ' + CFG.COPPER + ' 枚铜板（业障+1 心境+1 · 缘分+' + CFG.GW_COPPER + '）</button>' +
                '<button onclick="BeggarAlms.give(\'food\')" ' + btn.replace('p-3', 'bg-emerald-900 p-3') + '>🍞 施舍一口干粮（行囊里真扣一件吃食 · 业障+2 心境+2 · 缘分+' + CFG.GW_FOOD + '）</button>' +
                '<button onclick="BeggarAlms.give(\'stone\')" ' + btn.replace('p-3', 'bg-purple-900 p-3') + '>💎 施舍一枚灵石（业障+3 心境+2 · 缘分+' + CFG.GW_STONE + '）</button>';
        }
        html += '<button onclick="BeggarAlms.leave()" ' + btn.replace('p-3', 'bg-gray-700 p-3') + '>👋 摇摇头走开</button>' +
            '<p class="text-[11px] text-gray-500 mt-1">江湖传闻：天下乞丐皆丐帮耳目——碗里的铜板，买的是道上的耳朵。</p>';
        if (typeof window.showBuildingEffectDialog === 'function') {
            window.showBuildingEffectDialog('🥣 街角的老乞丐 · ' + (ct || city() || ''), html);
            return true;
        }
        return false;
    }
    function leave() {
        try { if (typeof window.closeBuildingDialog === 'function') window.closeBuildingDialog(); } catch (e) { return false; }
        return true;
    }
    function open() {
        if (!city()) { say('🥣 你身在野外——四下没有街角。', 'info'); return false; }
        return encounter(city());
    }

    // ============ 耳目递话（caravan-trade / cave-siege 两侧带守卫来读） ============
    // 缘分够深才让风：押货截道 -4%，洞府夜袭 -3%。本账不在位/缘分不够 → null，两侧一分不让。
    function watchDiscount() {
        if (!_state.noted10 || _state.goodwill < CFG.GW_WATCH) return null;
        return { caravan: CFG.WATCH_CARAVAN, siege: CFG.WATCH_SIEGE };
    }

    // ============ v25.8 黑道批：碗被抢了 ============
    // 抢乞丐就是打丐帮眼线的脸——缘分重挫；跌破耳目线（10）后 watchDiscount 自动闭嘴（getter 现算，无需另设开关）。
    // 业障/恶名/民愤热度那几笔由 citizen-life.js 的黑道账记，本账只动缘分。
    function robbed(hit) {
        var before = _state.goodwill;
        _state.goodwill = Math.max(0, _state.goodwill - Math.max(0, Number(hit) || 0));
        var watchLost = !!(_state.noted10 && before >= CFG.GW_WATCH && _state.goodwill < CFG.GW_WATCH);
        if (watchLost) {
            log('🥣 丐帮的耳目收了声——你连乞丐的碗都抢，道上再没人替你盯梢递话了。', 'warning');
        }
        return { goodwill: _state.goodwill, before: before, watchLost: watchLost };
    }

    function panelHtml(cityName) {
        try {
            return '';   // 不单占面板一行——收进「市井烟火」总门 + 闲逛路上撞见
        } catch (e) { return ''; }
    }

    // ============ 存读档（StateRegistry 正门） ============
    function _export() { return JSON.parse(JSON.stringify(_state)); }
    function _import(s) {
        if (!s || typeof s !== 'object') return;
        _state.given = Number(s.given) || 0;
        _state.copperGiven = Number(s.copperGiven) || 0;
        _state.foodGiven = Number(s.foodGiven) || 0;
        _state.stoneGiven = Number(s.stoneGiven) || 0;
        _state.goodwill = Math.max(0, Math.min(100, Number(s.goodwill) || 0));
        _state.lastDay = Number.isFinite(Number(s.lastDay)) ? Number(s.lastDay) : -1;
        _state.todayGives = Number(s.todayGives) || 0;
        _state.noted3 = !!s.noted3;
        _state.noted10 = !!s.noted10;
        _state.elderMet = !!s.elderMet;
    }
    function _reset() {
        _state = { given: 0, copperGiven: 0, foodGiven: 0, stoneGiven: 0, goodwill: 0, lastDay: -1, todayGives: 0, noted3: false, noted10: false, elderMet: false };
    }
    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        window.StateRegistry.register('beggarAlms', { version: 1, export: _export, import: _import, reset: _reset });
    }

    window.BeggarAlms = {
        CFG: CFG,
        give: give,
        encounter: encounter,
        leave: leave,
        open: open,
        watchDiscount: watchDiscount,
        robbed: robbed,
        isGbMember: isGbMember,
        goodwill: function () { return _state.goodwill; },
        panelHtml: panelHtml,
        state: _export
    };
    window.openBeggarAlms = function () { return open(); };
})();
