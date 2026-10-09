// ==================== v26.0 六路营生批（第一百五十一批 · 用户点单）· 赌石摊账 ====================
// 用户点单：「书肆能淘残页、拍卖会能捡漏，但庙会集市没有赌石摊——一把切开见分晓的心跳没有。」
// 本账在市集开一间古玩摊的赌石角（有市集/铺面的城才有）：
//   ① 三档原石：泥皮石 10 灵石 / 蜡皮石 50 灵石 / 满绿 hint 石 200 灵石——石价越高，出货档越高；
//   ② 探石（可选）：耗 10 分钟＋5 真气——境界与学识决定看多真（看得清就是「石心轮廓」，
//      看不清就是「隐隐一丝温流」）；探石只给信息不改赔率——摊主的算盘不藏；
//   ③ 切石：一刀定生死。出货表全明账（写在牌面上），摊主抽水约一成——「十石九空」是实话；
//   ④ 日账：每日至多切 12 刀、净赢封顶 400 灵石（摊主的银箱见底就收摊）——防上头也防刷钱；
//   ⑤ 切出高货/极品/天材 → 风声进传闻池，学识跟着涨（摊上练的眼力）。
// 口径：灵石走 DataManager 单一真源；出货材料走 giveWithReceipt 真入袋（接不住就如实折灵石）；
//   时辰走 timeSystem.advanceTime；每日账落 StateRegistry 'stoneGamble' 正门。
(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    var CFG = {
        DAILY_CUT_MAX: 12,      // 每日切石上限
        DAILY_WIN_CAP: 400,     // 每日净赢封顶（灵石）
        PEEK_MIN: 10, PEEK_QI: 5,
        CUT_MIN: 15,
        PEEK_REVEAL_BASE: 0.35, PEEK_REVEAL_CAP: 0.9, PEEK_SCHOL_DIV: 200,
        SCHOL_PER_CUT: 1        // 每刀练的眼力（学识）
    };

    // 三档原石与出货表（明账）：p 概率 / stones 灵石 / mat 材料（真入袋）
    // EV（期望回款，仅灵石部分，材料是彩头）：泥皮 ≈8.9/10、蜡皮 ≈42/50、满绿 ≈187/200——摊主抽水约半成到一成五，
    // 「十石九空」写进牌面：这是明账，不是黑箱。
    var TIERS = [
        {
            id: 'mud', name: '泥皮石', cost: 10, icon: '🪨',
            desc: '河滩上论堆卖的皮壳货——十石九空说的就是它',
            outcomes: [
                { p: 0.58, label: '废石', grade: 0, stones: 0, mat: null, word: '一刀下去，白花花一片石头芯子——废了。' },
                { p: 0.27, label: '低货', grade: 1, stones: 5, mat: { id: 'mat_gold_sand', n: 1 }, word: '皮壳下露出点金沙底子——不算白切。' },
                { p: 0.12, label: '中货', grade: 2, stones: 30, mat: { id: 'mat_pearl', n: 1 }, word: '石心裹着一枚润圆的珠子——摊主眼皮跳了一下。' },
                { p: 0.03, label: '高货', grade: 3, stones: 130, mat: { id: 'mat_coral', n: 1 }, word: '一片血色珊瑚化石芯——围观的人「嚯」了一声。' }
            ]
        },
        {
            id: 'wax', name: '蜡皮石', cost: 50, icon: '🟡',
            desc: '蜡皮紧实、隐有宝光——市集上的中坚货',
            outcomes: [
                { p: 0.45, label: '废石', grade: 0, stones: 0, mat: null, word: '蜡皮切尽，里头是一包石灰渣——空了。' },
                { p: 0.28, label: '低货', grade: 1, stones: 15, mat: { id: 'mat_gold_sand', n: 2 }, word: '一小囊金沙——本回来了一多半。' },
                { p: 0.17, label: '中货', grade: 2, stones: 60, mat: { id: 'mat_pearl', n: 2 }, word: '双珠并蒂，润光欲滴——赚了。' },
                { p: 0.08, label: '高货', grade: 3, stones: 200, mat: { id: 'mat_fire_essence', n: 1 }, word: '石心一泓火精凝而不散——摊主倒吸一口凉气。' },
                { p: 0.02, label: '极品', grade: 4, stones: 600, mat: { id: 'mat_dragon_grass', n: 1 }, word: '龙草化石！石心中盘着一缕龙气养出的草叶——满市集都在传这一刀。' }
            ]
        },
        {
            id: 'green', name: '满绿石', cost: 200, icon: '🟢',
            desc: '皮壳见绿、十有九垮——垮了血本无归，涨了富可敌国',
            outcomes: [
                { p: 0.47, label: '垮', grade: 0, stones: 0, mat: null, word: '绿只在皮上——里头垮成一片糠。二百灵石听了个响。' },
                { p: 0.29, label: '中货', grade: 2, stones: 140, mat: { id: 'mat_pearl', n: 3 }, word: '切涨了半分——珠光连片，回本大半。' },
                { p: 0.18, label: '高货', grade: 3, stones: 380, mat: { id: 'mat_ice_herb', n: 1 }, word: '满绿成玻璃地！一刀富三年——围观的都在咂嘴。' },
                { p: 0.045, label: '极品', grade: 4, stones: 900, mat: { id: 'mat_dragon_grass', n: 1 }, word: '帝王绿里养着龙草——这一刀切出了个传说，满市集都在说你的名字。' },
                { p: 0.015, label: '天材', grade: 5, stones: 2500, mat: { id: 'mat_dragon_grass', n: 2 }, word: '石心竟是一整块天材地宝！摊主腿一软扶住了案子——这摊子今天可以收了。' }
            ]
        }
    ];

    var _st = { day: -1, cuts: 0, net: 0, stone: null, last: null };   // stone: {tier, rolled, peeked}

    // ============ 小工具（赌坊同款口径） ============
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
    function stonesNow() {
        try {
            var DM = window.DataManager || (window.XianXia && window.XianXia.DataManager);
            if (DM && typeof DM.getSpiritStones === 'function') return Number(DM.getSpiritStones()) || 0;
        } catch (e) { console.warn('[静默失败] js/city-facilities/stone-gamble.js · stonesNow：现银没读到，按角色面上的数算', e && e.message); }
        var c = cd();
        return c ? (Number(c.spiritStones) || 0) : 0;
    }
    function deductStones(n) {
        try {
            var DM = window.DataManager || (window.XianXia && window.XianXia.DataManager);
            if (DM && typeof DM.deductSpiritStones === 'function') return !!DM.deductSpiritStones(n);
        } catch (e) { console.warn('[静默失败] js/city-facilities/stone-gamble.js · deductStones：DataManager 正门没走通，落回角色字段', e && e.message); }
        var c = cd();
        if (c && (Number(c.spiritStones) || 0) >= n) { c.spiritStones -= n; return true; }
        return false;
    }
    function addStones(n) {
        try {
            var DM = window.DataManager || (window.XianXia && window.XianXia.DataManager);
            if (DM && typeof DM.addSpiritStones === 'function') { DM.addSpiritStones(n); return true; }
        } catch (e) { console.warn('[静默失败] js/city-facilities/stone-gamble.js · addStones：DataManager 正门没走通，落回角色字段', e && e.message); }
        var c = cd();
        if (c) { c.spiritStones = (Number(c.spiritStones) || 0) + n; return true; }
        return false;
    }
    function advance(min, why) {
        try { if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') window.timeSystem.advanceTime(min, why); } catch (e) { console.warn('[静默失败] js/city-facilities/stone-gamble.js · advance：时辰没扣成', e && e.message); }
    }
    function deed(mood, s) {
        try { if (typeof window.playerPushDeed === 'function') window.playerPushDeed(mood, s); } catch (e) { console.warn('[静默失败] js/city-facilities/stone-gamble.js · deed：风声没递进传闻池', e && e.message); }
    }
    function growSchol(n, reason) {
        try { if (typeof window.growLifeSkill === 'function') window.growLifeSkill('学识', n, { reason: reason }); } catch (e) { console.warn('[静默失败] js/city-facilities/stone-gamble.js · growSchol：眼力的长进没落账', e && e.message); }
    }
    function refresh() {
        try { if (window.updateCharacterStatus) window.updateCharacterStatus(); } catch (e) { console.warn('[静默失败] js/city-facilities/stone-gamble.js · refresh：面板没刷新', e && e.message); }
        try { if (typeof window.updateCurrencyUI === 'function') window.updateCurrencyUI(); } catch (e2) { console.warn('[静默失败] js/city-facilities/stone-gamble.js · refresh：钱袋没刷新', e2 && e2.message); }
    }
    function playerTier() {
        try { if (typeof window.getRealmTier === 'function') return Number(window.getRealmTier((cd() || {}).realm)) || 0; } catch (e) { console.warn('[静默失败] js/city-facilities/stone-gamble.js · playerTier：境界尺没量出来，按零档算', e && e.message); }
        return 0;
    }
    function schol() {
        try { if (typeof window.getLifeSkill === 'function') return Number(window.getLifeSkill('学识')) || 0; } catch (e) { console.warn('[静默失败] js/city-facilities/stone-gamble.js · schol：学识没读出来，按零算', e && e.message); }
        return 0;
    }
    function stallOk(ct) {
        try {
            var d = window.locationSystem && window.locationSystem.getCityData && window.locationSystem.getCityData(ct || city());
            if (!d || !d.buildings) return false;
            return d.buildings.indexOf('market') >= 0 || d.buildings.indexOf('shop') >= 0;
        } catch (e) { console.warn('[静默失败] js/city-facilities/stone-gamble.js · stallOk：城里有没有市集没问清，按没有算', e && e.message); return false; }
    }

    function rollDay() {
        var day = absDay();
        if (_st.day !== day) { _st.day = day; _st.cuts = 0; _st.net = 0; }
    }

    function rollOutcome(tier) {
        var r = Math.random(), acc = 0;
        for (var i = 0; i < tier.outcomes.length; i++) {
            acc += tier.outcomes[i].p;
            if (r < acc) return i;
        }
        return tier.outcomes.length - 1;
    }

    // ============ 买石 ============
    function buy(tierIdx) {
        rollDay();
        var c = cd();
        if (!c) { say('请先创建角色。', 'warning'); return false; }
        if (!stallOk()) { say('🪨 这地界没有古玩摊——赌石跟着市集走。', 'info'); return false; }
        var tier = TIERS[Math.floor(Number(tierIdx))];
        if (!tier) { say('摊上没这档石头。', 'warning'); return false; }
        if (_st.stone) { say('🪨 你手里还攥着一块没切的「' + TIERS[_st.stone.tier].name + '」——先把它切了，摊主不赊第二块。', 'warning'); return false; }
        if (_st.cuts >= CFG.DAILY_CUT_MAX) { say('🪨 今日已切 ' + _st.cuts + ' 刀，摊主把切石刀收了：「手抖，切坏你的料赔不起——明日请早。」', 'info'); return false; }
        if (_st.net >= CFG.DAILY_WIN_CAP) { say('🪨 摊主把银箱翻过来抖了抖——空的。「今日让你赢怕了，收摊收摊，明日再来。」（每日净赢封顶 ' + CFG.DAILY_WIN_CAP + ' 灵石）', 'info'); return false; }
        if (stonesNow() < tier.cost) { say('🪨 「' + tier.name + '」要 ' + tier.cost + ' 灵石，你手头不足——摊上不赊账。', 'warning'); return false; }
        if (!deductStones(tier.cost)) { say('🪨 灵石没能划出去——钱袋里的账对不上。', 'warning'); return false; }
        _st.stone = { tier: Math.floor(Number(tierIdx)), rolled: rollOutcome(tier), peeked: null };
        _st.net -= tier.cost;
        advance(5, '挑石');
        log('🪨 你花 ' + tier.cost + ' 灵石从古玩摊上抱起一块' + tier.name + '。摊主眯眼笑：「好眼力——切不切得出，看命。」（探石 10 分钟或直接切）', 'info');
        say('🪨 ' + tier.name + '入手（' + tier.cost + ' 灵石）。要先探一探，还是直接下刀？', 'success');
        refresh();
        open();
        return true;
    }

    // ============ 探石（只给信息，不改赔率） ============
    function peek() {
        var c = cd();
        if (!_st.stone) { say('🪨 你手里没有石头。', 'info'); return false; }
        if (_st.stone.peeked !== null && _st.stone.peeked !== undefined) { say('🪨 这块石头你已经探过了——' + peekWord(), 'info'); return false; }
        if (c && (Number(c.qi) || 0) < CFG.PEEK_QI) { say('🪨 真气不继（探石要 ' + CFG.PEEK_QI + ' 点）——神识探不进石皮。', 'warning'); return false; }
        if (c) c.qi = Math.max(0, (Number(c.qi) || 0) - CFG.PEEK_QI);
        advance(CFG.PEEK_MIN, '探石');
        var tier = TIERS[_st.stone.tier];
        var out = tier.outcomes[_st.stone.rolled];
        var revealP = Math.min(CFG.PEEK_REVEAL_CAP, CFG.PEEK_REVEAL_BASE + playerTier() * 0.12 + schol() / CFG.PEEK_SCHOL_DIV);
        if (Math.random() < revealP) {
            _st.stone.peeked = out.grade;
            log('🪨 神识沉入石皮——' + (out.grade >= 4 ? '石心里一团宝光几乎刺眼！' : out.grade >= 3 ? '石心轮廓清晰，宝光隐隐。' : out.grade >= 2 ? '隐约一团温润的影子。' : out.grade === 1 ? '一丝若有若无的温流。' : '死寂——像一口枯井。') + '（看真了：' + out.label + '）', out.grade >= 2 ? 'success' : 'info');
            say('🪨 探石看真了——这块是「' + out.label + '」的相。（探石只给信息不改赔率，切不切你自己定）', out.grade >= 2 ? 'success' : 'info');
        } else {
            _st.stone.peeked = -1;   // 探过但没看真
            log('🪨 神识在石皮上打了滑——只觉里头一团混沌，看不出深浅。（境界与学识越高，越容易看真；这块你已经探过，再探也是白搭真气）', 'info');
            say('🪨 看不真——石皮底下混沌一团。（境界/学识不够，这块石头的深浅问不出来了）', 'info');
        }
        refresh();
        open();
        return true;
    }

    function peekWord() {
        if (!_st.stone || _st.stone.peeked === null || _st.stone.peeked === undefined) return '还没探过。';
        if (_st.stone.peeked === -1) return '探过了，看不真。';
        var tier = TIERS[_st.stone.tier];
        for (var i = 0; i < tier.outcomes.length; i++) if (tier.outcomes[i].grade === _st.stone.peeked) return tier.outcomes[i].label + '的相。';
        return '看不真。';
    }

    // ============ 切石 ============
    function cut() {
        rollDay();
        if (!_st.stone) { say('🪨 你手里没有石头。', 'info'); return false; }
        if (_st.cuts >= CFG.DAILY_CUT_MAX) { say('🪨 今日刀数用尽了——摊主把切石刀收了。（每日至多 ' + CFG.DAILY_CUT_MAX + ' 刀）', 'info'); return false; }
        var tier = TIERS[_st.stone.tier];
        var out = tier.outcomes[_st.stone.rolled];
        advance(CFG.CUT_MIN, '切石');
        _st.cuts += 1;

        var matWord = '';
        if (out.stones > 0) {
            // 净赢封顶：赢到线上，摊主只付得到线（差额如实说出来，不吞账）
            var roomLeft = CFG.DAILY_WIN_CAP - _st.net;
            var payStones = out.stones;
            if (roomLeft < out.stones) {
                payStones = Math.max(0, roomLeft);
                matWord += '（摊主的银箱见底，灵石只付得出 ' + payStones + '——差额 ' + (out.stones - payStones) + ' 灵石兑不出了，摊主把牌面一翻：「封顶就是封顶，这是明账。」）';
            }
            if (payStones > 0) addStones(payStones);
            _st.net += payStones;
        }
        if (out.mat) {
            var got = null;
            try {
                if (typeof window.giveWithReceipt === 'function') got = window.giveWithReceipt(out.mat.id, out.mat.n, { quiet: true });
                else if (typeof window.addItem === 'function') got = { got: Number(window.addItem(out.mat.id, out.mat.n)) || 0 };
            } catch (eG) { console.warn('[静默失败] js/city-facilities/stone-gamble.js · cut：出货没能入袋', eG && eG.message); }
            var nm = (window.itemById && window.itemById[out.mat.id] && window.itemById[out.mat.id].name) || out.mat.id;
            if (got && Number(got.got) > 0) matWord += '「' + nm + '」×' + out.mat.n + ' 入了你的行囊。';
            else {
                // 行囊接不住：如实折灵石（按物品半价），不蒸发
                var fold = 0;
                try { fold = Math.max(1, Math.round(((window.itemById && window.itemById[out.mat.id] && Number(window.itemById[out.mat.id].price)) || 10) * 0.5)) * out.mat.n; } catch (eP) { console.warn('[静默失败] js/city-facilities/stone-gamble.js · cut：折价没算出来，按最低一块灵石折', eP && eP.message); fold = out.mat.n; }
                addStones(fold);
                _st.net += fold;
                // DES-86/90 同口径：没能跟你走的原因吃回执实话，不许站点自己断言满包
                var 由头 = '';
                try { if (typeof window.addItemFailPhraseFor === 'function') 由头 = window.addItemFailPhraseFor(got && got.reason, nm) || ''; } catch (ePh) { console.warn('[静默失败] js/city-facilities/stone-gamble.js · cut：没带走的回执没读出来，按中性话说', ePh && ePh.message); }
                matWord += '（「' + nm + '」没能跟你走' + (由头 ? '：' + 由头 : '') + '——摊主替你折了 ' + fold + ' 灵石。）';
            }
        }
        _st.last = { tier: tier.name, label: out.label, grade: out.grade, stones: out.stones, day: absDay() };
        _st.stone = null;
        growSchol(CFG.SCHOL_PER_CUT, '石摊上练的眼力');
        if (out.grade >= 3) {
            deed('good', '你在' + city() + '的古玩摊上一刀切出' + out.label + '——市集上都在说这一刀');
        }
        log('🔪 ' + tier.name + '一刀两半——' + out.word + '（' + out.label + (out.stones > 0 ? '，灵石+' + out.stones : '') + '）' + matWord + '（今日第 ' + _st.cuts + '/' + CFG.DAILY_CUT_MAX + ' 刀，净账 ' + (_st.net >= 0 ? '+' : '') + _st.net + ' 灵石，眼力+1）', out.grade >= 2 ? 'success' : out.grade === 0 ? 'warning' : 'info');
        say('🔪 ' + out.word + '（' + out.label + (out.stones > 0 ? ' · 灵石+' + out.stones : '') + '）' + matWord, out.grade >= 2 ? 'success' : out.grade === 0 ? 'error' : 'info');
        refresh();
        open();
        return true;
    }

    // ============ 牌面 ============
    function open() {
        if (!cd()) { say('请先创建角色。', 'warning'); return false; }
        var ct = city();
        if (!ct) { say('🪨 你在荒郊野外——古玩摊跟着市集走。', 'info'); return false; }
        if (!stallOk(ct)) { say('🪨 ' + ct + '没有市集——赌石摊支不起来。', 'info'); return false; }
        rollDay();
        var btn = 'class="w-full p-3 rounded mb-2 text-left text-sm text-white hover:opacity-90"';
        var html = '<p class="text-sm text-gray-400 mb-2">古玩摊的角落里支着张切石案，案上三堆原石。摊主摇着蒲扇：「十石九空——想好了再掏钱。」</p>' +
            '<p class="text-xs text-gray-500 mb-2">今日已切 ' + _st.cuts + '/' + CFG.DAILY_CUT_MAX + ' 刀 · 净账 ' + (_st.net >= 0 ? '+' : '') + _st.net + ' 灵石（净赢封顶 ' + CFG.DAILY_WIN_CAP + '）' +
            (_st.last ? ' · 上一刀：' + _st.last.tier + '切出「' + _st.last.label + '」' : '') + '</p>';
        if (_st.stone) {
            var t = TIERS[_st.stone.tier];
            html += '<p class="text-sm text-amber-200 mb-2">' + t.icon + ' 手里攥着一块「' + t.name + '」——探过了吗？' + peekWord() + '</p>' +
                (_st.stone.peeked === null || _st.stone.peeked === undefined ? '<button onclick="window.StoneGamble.peek()" ' + btn.replace('p-3', 'bg-cyan-900 p-3') + '>🔮 探石（' + CFG.PEEK_MIN + ' 分钟 · ' + CFG.PEEK_QI + ' 真气 · 境界学识越高看得越真 · 只给信息不改赔率）</button>' : '') +
                '<button onclick="window.StoneGamble.cut()" ' + btn.replace('p-3', 'bg-red-900 p-3') + '>🔪 切石（一刀定生死 · ' + CFG.CUT_MIN + ' 分钟）</button>';
        } else {
            for (var i = 0; i < TIERS.length; i++) {
                var tier = TIERS[i];
                var odds = tier.outcomes.map(function (o) { return o.label + ' ' + Math.round(o.p * 100) + '%'; }).join(' · ');
                html += '<button onclick="window.StoneGamble.buy(' + i + ')" ' + btn.replace('p-3', 'bg-stone-700 p-3') + '>' + tier.icon + ' ' + tier.name +
                    ' <span class="text-xs text-amber-300">' + tier.cost + ' 灵石</span>' +
                    '<span class="block text-xs text-gray-400">' + tier.desc + '</span>' +
                    '<span class="block text-[11px] text-gray-500">出货表：' + odds + '</span></button>';
            }
            html += '<p class="text-[11px] text-gray-500 mt-1">摊主的算盘是明账：三档石头的期望回款都低于石价（抽水约一成）——高货以上的彩头材料与传闻才是赌头。切出高货以上，市集会传你的名字；每刀都长一分眼力（学识+1）。</p>';
        }
        if (typeof window.showBuildingEffectDialog === 'function') {
            window.showBuildingEffectDialog('🪨 古玩摊 · 赌石 · ' + ct, html);
            return true;
        }
        return false;
    }

    // ============ 存读档（StateRegistry 正门） ============
    function _export() { return JSON.parse(JSON.stringify(_st)); }
    function _import(s) {
        if (!s || typeof s !== 'object') return;
        _st.day = Number.isFinite(Number(s.day)) ? Number(s.day) : -1;
        _st.cuts = Math.max(0, Math.min(CFG.DAILY_CUT_MAX, Math.floor(Number(s.cuts)) || 0));
        _st.net = Math.max(-100000, Math.min(CFG.DAILY_WIN_CAP, Math.floor(Number(s.net)) || 0));
        if (s.stone && typeof s.stone === 'object') {
            var ti = Math.floor(Number(s.stone.tier));
            if (TIERS[ti] && Number.isFinite(Number(s.stone.rolled))) {
                var ri = Math.max(0, Math.min(TIERS[ti].outcomes.length - 1, Math.floor(Number(s.stone.rolled))));
                _st.stone = { tier: ti, rolled: ri, peeked: (s.stone.peeked === null || s.stone.peeked === undefined) ? null : Math.floor(Number(s.stone.peeked)) || -1 };
            } else _st.stone = null;
        } else _st.stone = null;
        _st.last = (s.last && typeof s.last === 'object' && typeof s.last.label === 'string')
            ? { tier: String(s.last.tier || '').slice(0, 12), label: s.last.label.slice(0, 12), grade: Math.floor(Number(s.last.grade)) || 0, stones: Math.max(0, Math.floor(Number(s.last.stones)) || 0), day: Math.floor(Number(s.last.day)) || 0 }
            : null;
    }
    function _reset() { _st = { day: -1, cuts: 0, net: 0, stone: null, last: null }; }
    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        window.StateRegistry.register('stoneGamble', { version: 1, export: _export, import: _import, reset: _reset });
    }

    window.StoneGamble = {
        CFG: CFG, TIERS: TIERS,
        stallOk: stallOk,
        buy: buy, peek: peek, cut: cut,
        open: open,
        state: _export
    };
    window.openStoneGamble = function () { return open(); };
})();
