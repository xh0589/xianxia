// ==================== v25.7 市井烟火批（第一百四十九批）· 赌坊骰子 ====================
// 此前博戏散在三处（斗法台台下赌盘/契约所赌灵雨/茶馆对弈彩头），没有一间正经赌坊。
// 本账开一间：三颗骰子押大小——总点 ≥11 为大、≤10 为小，**围骰（三颗同点）庄家通吃**。
// 口径诚实（与台下赌盘同款「庄家总赢」的算学）：
//   · 押中赔一比一，押错/围骰全赔——围骰 6/216，庄家优势 ≈2.8%，久赌必输是明账，写进牌面；
//   · 街桌押铜钱（10/30/50），**雅间**押灵石（1/3/5）——雅间要连赢三把才请你上楼（一次性解锁，落档）；
//   · 每日止损：铜桌净输满 300 铜 / 净赢满 500 铜，庄家就「请你明日再来」（灵石桌 30/50 同口径）——
//     日上限按天落档（StateRegistry 正门），防上头也防刷钱；
//   · 连赢六把，庄家把你列入黑名单：**禁入三日**（落档），街面上还会传你的名（传闻池一笔）。
// 骰面/净账/连赢全部现算展示——赌坊不藏账。
// v27.13：设施联动（⑤改良）——单把大赢（铜桌≥50/雅间≥3）当日牌面冒「请全场喝一轮」勾子
//   （真扣铜钱走设施回流，心境/城望小额+）；酒楼侧读 GambleDen.state 认这一天递一句承接文案。
(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    var CFG = {
        COPPER_BETS: [10, 30, 50],
        STONE_BETS: [1, 3, 5],
        VIP_STREAK: 3,        // 连赢几把开雅间
        BAN_STREAK: 6,        // 连赢几把被拉黑
        BAN_DAYS: 3,
        COPPER_LOSS_CAP: 300, // 每日铜桌净输上限
        COPPER_WIN_CAP: 500,  // 每日铜桌净赢上限
        STONE_LOSS_CAP: 30,
        STONE_WIN_CAP: 50,
        BET_MIN: 5,           // 每把耗时（分钟）
        // v27.13：设施联动（⑤改良——「赌坊赢了钱→酒楼消费」的市井气）。大赢阈值：
        // 铜桌单把净赢 ≥ TREAT_WIN_COPPER（= 封顶注 50 一把赢，翻倍的钱在手才有请客的底气），
        // 雅间单把净赢 ≥ TREAT_WIN_STONE（3 灵石=中高档一把赢；雅间注小钱贵，同算大赢）。
        // 大赢当日牌面冒「请全场喝一轮」勾子：花销/心境/城望三枚旋钮如下，钱真扣走设施回流。
        TREAT_WIN_COPPER: 50,
        TREAT_WIN_STONE: 3,
        TREAT_COST: 20,
        TREAT_MOOD: 3,
        TREAT_REP: 1
    };

    var DICE_GLYPH = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

    var _state = {
        day: -1, copperNet: 0, stoneNet: 0,
        streak: 0, bestStreak: 0, plays: 0,
        bannedUntil: -1, vip: false,
        treatHotDay: -1,  // v27.13 大赢当日（牌面冒「请全场喝一轮」勾子的日子）
        treatDay: -1,     // v27.13 已请客当日（勾子每成一次，酒楼文案口也认这一天）
        lastRoll: null    // {dice:[..], pick:'big'|'small', triple:bool, win:bool, amt:n, cur:'copper'|'stone'}（现展示用，落档无害）
    };

    function cd() { return window.currentCharData || null; }
    function say(m, t) { try { if (window.showMessage) window.showMessage(m, t || 'info'); } catch (e) { return false; } return true; }
    function log(m, t) { try { if (window.gameLog && window.gameLog.add) window.gameLog.add(m, t || 'info'); } catch (e) { return false; } return true; }
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
    function settle(spec) {
        try {
            if (window.RewardService && typeof window.RewardService.apply === 'function') {
                var r = window.RewardService.apply(spec, { facilitySpend: true, source: '赌坊', city: city() });
                return { ok: !!(r && r.success !== false), note: r && r.messages ? r.messages.join('、') : '' };
            }
        } catch (e) { console.warn('[静默失败] js/city-facilities/gamble-den.js · settle：这把赌账没落成一笔', e && e.message); }
        return { ok: false, note: '' };
    }
    function denOk(ct) {
        try {
            var d = window.locationSystem && window.locationSystem.getCityData && window.locationSystem.getCityData(ct || city());
            if (!d || !d.buildings) return false;
            return d.buildings.indexOf('shop') >= 0 || d.buildings.indexOf('market') >= 0;
        } catch (e) { return false; }
    }
    // 新的一天：净账翻页（连赢/黑名单跨天作数——赌坊记性长）
    function rollDay() {
        var d = absDay();
        if (_state.day !== d) {
            _state.day = d;
            _state.copperNet = 0;
            _state.stoneNet = 0;
        }
        return d;
    }
    function moneyWord(cur) { return cur === 'stone' ? '灵石' : '铜钱'; }

    // ============ 掷一把 ============
    // cur: 'copper' | 'stone'；pick: 'big' | 'small'；amtIdx: 0/1/2
    function bet(cur, pick, amtIdx) {
        var c = cd();
        if (!c) return false;
        if (!denOk()) { say('🎲 这地界没有赌坊——仙山佛窟掷不了骰子。', 'info'); return false; }
        if (window.currentBattle) { say('🎲 打着架呢，庄家可不开盘。', 'warning'); return false; }
        cur = (cur === 'stone') ? 'stone' : 'copper';
        var bets = (cur === 'stone') ? CFG.STONE_BETS : CFG.COPPER_BETS;
        var amt = bets[Math.max(0, Math.min(2, Number(amtIdx) || 0))];
        var day = rollDay();

        if (_state.bannedUntil >= day) {
            say('🎲 门口换脸的伙计认得你——黑名单还没销（还剩 ' + (_state.bannedUntil - day + 1) + ' 日）。', 'warning');
            return false;
        }
        if (cur === 'stone' && !_state.vip) {
            say('🎲 雅间帘子放着——伙计赔笑：「连赢三把，掌柜的自然请您上楼。」', 'info');
            return false;
        }
        if (cur === 'copper' && _state.copperNet <= -CFG.COPPER_LOSS_CAP) {
            say('🎲 你今日铜钱已输到底——庄家拱手：「翻本的话明日再说，赌坊不留过夜客。」', 'info');
            return false;
        }
        if (cur === 'copper' && _state.copperNet >= CFG.COPPER_WIN_CAP) {
            say('🎲 你今日赢得太多，柜上现钱不凑手——庄家满脸堆笑把你送出门：「明日请早。」', 'info');
            return false;
        }
        if (cur === 'stone' && _state.stoneNet <= -CFG.STONE_LOSS_CAP) {
            say('🎲 雅间今日的额度见底了——你输的灵石够掌柜肉疼，先请回。', 'info');
            return false;
        }
        if (cur === 'stone' && _state.stoneNet >= CFG.STONE_WIN_CAP) {
            say('🎲 雅间今日赔不起了——掌柜亲自下来拱手：「改日，改日再会。」', 'info');
            return false;
        }

        // 掷骰
        var dice = [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)];
        var total = dice[0] + dice[1] + dice[2];
        var triple = (dice[0] === dice[1] && dice[1] === dice[2]);
        var isBig = total >= 11;
        var win = !triple && ((pick === 'big') === isBig);

        // 钱一笔结清：赢了净入 amt，输了净扣 amt（余额不足整单不成——不会欠账）
        var spec = {};
        if (cur === 'stone') spec.spiritStones = win ? amt : -amt; else spec.copper = win ? amt : -amt;
        var r = settle(spec);
        if (!r.ok) { say('🎲 庄家瞄了瞄你的口袋——「客官，本钱不够。」', 'warning'); return false; }

        if (cur === 'stone') _state.stoneNet += (win ? amt : -amt); else _state.copperNet += (win ? amt : -amt);
        _state.plays++;
        _state.streak = win ? _state.streak + 1 : 0;
        if (_state.streak > _state.bestStreak) _state.bestStreak = _state.streak;
        _state.lastRoll = { dice: dice, pick: pick, triple: triple, win: win, amt: amt, cur: cur };

        // v27.13：设施联动（⑤改良）——大赢判定：铜桌≥封顶注（50）/雅间≥中高档（3）的单把净赢。
        // 只立当日旗，不自动花钱——请客的勾子摆在牌面上（render 的按钮→treatRound），玩家自己顺手点。
        var bigWin = win && (cur === 'stone' ? amt >= CFG.TREAT_WIN_STONE : amt >= CFG.TREAT_WIN_COPPER);
        if (bigWin) _state.treatHotDay = day;

        try { if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') window.timeSystem.advanceTime(CFG.BET_MIN, '赌坊掷骰'); } catch (eT) { console.warn('[静默失败] js/city-facilities/gamble-den.js · bet：掷骰的时辰没扣', eT && eT.message); }

        var face = DICE_GLYPH[dice[0] - 1] + DICE_GLYPH[dice[1] - 1] + DICE_GLYPH[dice[2] - 1];
        var msg = face + ' 总点 ' + total + '（' + (triple ? '围骰——庄家通吃' : isBig ? '大' : '小') + '），你押的「' + (pick === 'big' ? '大' : '小') + '」——' +
            (win ? '赢了 ' + amt + ' ' + moneyWord(cur) + '！' : '输了 ' + amt + ' ' + moneyWord(cur) + '。');
        log('🎲 ' + msg + '（今日净' + (cur === 'stone' ? (_state.stoneNet >= 0 ? '赢 ' + _state.stoneNet : '输 ' + (-_state.stoneNet)) + ' 灵石' : (_state.copperNet >= 0 ? '赢 ' + _state.copperNet : '输 ' + (-_state.copperNet)) + ' 铜钱') + '，连赢 ' + _state.streak + '）', win ? 'success' : 'info');

        // v27.13：大赢的市井气——当场一句满堂喝彩，勾子在牌面上（当日可点，见 treatRound）。
        if (bigWin && _state.treatDay !== day) {
            msg += '\n🏮 满堂喝彩，邻座的赌客直嚷要沾沾手气——趁兴请全场喝一轮？（酒钱 ' + CFG.TREAT_COST + ' 铜钱，牌面上点）';
        }
        // 连赢三把：雅间开门（一次性，落档）
        if (win && _state.streak >= CFG.VIP_STREAK && !_state.vip) {
            _state.vip = true;
            msg += '\n🏮 荷官眼睛一亮，亲自掀帘：「客官好手气——楼上雅间请，那边押的是灵石。」';
            log('🎲 赌坊雅间向你开了门（灵石桌解锁，永久作数）。', 'success');
        }
        // 连赢六把：拉黑（禁入三日，街面传名）
        if (win && _state.streak >= CFG.BAN_STREAK) {
            _state.bannedUntil = day + CFG.BAN_DAYS;
            msg += '\n🚪 后堂账房盯了你半晌，一拍算盘：「送客！」——你被列入黑名单，赌坊三日不许你进门。';
            log('🎲 连赢 ' + _state.streak + ' 把，被赌坊列入黑名单（禁入 ' + CFG.BAN_DAYS + ' 日）。', 'warning');
            try { if (typeof window.playerPushDeed === 'function') window.playerPushDeed('good', '你在' + (city() || '城里') + '的赌坊连赢六把，被庄家当场拉黑——街面上要议论三天'); } catch (eP) { console.warn('[静默失败] js/city-facilities/gamble-den.js · bet：拉黑这段风声没递进传闻池', eP && eP.message); }
            _state.streak = 0;
        }
        say('🎲 ' + msg, win ? 'success' : 'warning');
        render();
        return true;
    }

    // ============ v27.13 请全场喝一轮（设施联动勾子：大赢的市井气） ============
    // 钱不许凭空生：TREAT_COST 铜真扣——settle 带 facilitySpend 标记走 RewardService 正门，
    // 六成入本城悬赏基金、四成回世界市面池，与既有设施回流同一口径；心境/城望小额+由 RewardService 发。
    // 每日一回（treatDay 当日旗）；没大赢过（treatHotDay 不在今日）庄家好言挡回去，勾子不是常驻。
    function treatRound() {
        var day = rollDay();
        if (_state.treatDay === day) { say('🏮 跑堂的摆手：「今日已经扰过一轮了——客官再请，我们就不好意思了。」', 'info'); return false; }
        if (_state.treatHotDay !== day) { say('🏮 庄家陪你笑：「客官说笑了——今日这手气，该全场请您才对。」', 'info'); return false; }
        var r = settle({ copper: -CFG.TREAT_COST, mood: CFG.TREAT_MOOD, rep: CFG.TREAT_REP });
        if (!r.ok) { say('🏮 你摸遍口袋——请客的钱还凑不齐，豪气当场收了三分。', 'warning'); return false; }
        _state.treatDay = day;
        log('🏮 你把 ' + CFG.TREAT_COST + ' 铜钱往桌上一拍：「今日我请，全场都满上！」满堂喝彩里，跑堂的把好酒都抱了出来。' + (r.note ? '（' + r.note + '）' : ''), 'success');
        say('🏮 铜钱拍在桌上——「今日我请！」满堂喝彩，赌坊里一时人声鼎沸。' + (r.note ? '（' + r.note + '）' : ''), 'success');
        try { if (typeof window.playerPushDeed === 'function') window.playerPushDeed('good', '你在' + (city() || '城里') + '的赌坊手气正旺，当场请全场喝了一轮——市井传为美谈'); } catch (eP) { console.warn('[静默失败] js/city-facilities/gamble-den.js · treatRound：请客的美谈没递进传闻池', eP && eP.message); }
        render();
        return true;
    }

    // ============ 牌面（每把重渲，账全摊开） ============
    function render() {
        var day = rollDay();
        var html = '';
        if (_state.bannedUntil >= day) {
            html += '<p class="text-sm text-red-400 mb-2">🚫 你被这家赌坊列了黑名单——还剩 ' + (_state.bannedUntil - day + 1) + ' 日。</p>';
        }
        if (_state.lastRoll) {
            var lr = _state.lastRoll;
            var face = DICE_GLYPH[lr.dice[0] - 1] + DICE_GLYPH[lr.dice[1] - 1] + DICE_GLYPH[lr.dice[2] - 1];
            html += '<div class="p-3 bg-gray-800 rounded mb-2 text-center"><p class="text-3xl tracking-widest mb-1">' + face + '</p><p class="text-xs text-gray-400">上一把：总点 ' + (lr.dice[0] + lr.dice[1] + lr.dice[2]) + (lr.triple ? '（围骰·庄家通吃）' : lr.win ? '（你赢了）' : '（你输了）') + '</p></div>';
        }
        html += '<p class="text-xs text-gray-400 mb-2">今日净账：铜桌 <span class="' + (_state.copperNet >= 0 ? 'text-emerald-300' : 'text-red-300') + '">' + (_state.copperNet >= 0 ? '+' : '') + _state.copperNet + '</span> 铜钱' +
            (_state.vip ? ' · 雅间 <span class="' + (_state.stoneNet >= 0 ? 'text-emerald-300' : 'text-red-300') + '">' + (_state.stoneNet >= 0 ? '+' : '') + _state.stoneNet + '</span> 灵石' : '') +
            ' · 连赢 <span class="text-amber-300">' + _state.streak + '</span>（最高 ' + _state.bestStreak + '）</p>';
        // v27.13：大赢勾子——大赢当日且今日还没请过，牌面上挂「请全场喝一轮」（真扣钱，见 treatRound）。
        if (_state.treatHotDay === day && _state.treatDay !== day) {
            html += '<button onclick="GambleDen.treatRound()" class="w-full bg-amber-700 hover:bg-amber-600 text-white px-3 py-2 rounded text-sm mb-2">🏮 请全场喝一轮（' + CFG.TREAT_COST + ' 铜钱 · 心境+' + CFG.TREAT_MOOD + ' 城望+' + CFG.TREAT_REP + '）</button>';
        }
        var btn = 'px-3 py-2 rounded text-sm mr-1 mb-1 ';
        html += '<div class="mb-2"><p class="text-xs text-gray-500 mb-1">街桌（铜钱）押：</p>';
        for (var i = 0; i < CFG.COPPER_BETS.length; i++) {
            html += '<button onclick="GambleDen.bet(\'copper\',\'big\',' + i + ')" class="' + btn + 'bg-red-900 hover:bg-red-800 text-white">' + CFG.COPPER_BETS[i] + '铜·大</button>' +
                '<button onclick="GambleDen.bet(\'copper\',\'small\',' + i + ')" class="' + btn + 'bg-gray-700 hover:bg-gray-600 text-white">' + CFG.COPPER_BETS[i] + '铜·小</button>';
        }
        html += '</div>';
        if (_state.vip) {
            html += '<div class="mb-2"><p class="text-xs text-amber-500 mb-1">🏮 雅间（灵石）押：</p>';
            for (var j = 0; j < CFG.STONE_BETS.length; j++) {
                html += '<button onclick="GambleDen.bet(\'stone\',\'big\',' + j + ')" class="' + btn + 'bg-amber-800 hover:bg-amber-700 text-white">' + CFG.STONE_BETS[j] + '石·大</button>' +
                    '<button onclick="GambleDen.bet(\'stone\',\'small\',' + j + ')" class="' + btn + 'bg-amber-950 hover:bg-amber-900 text-amber-200">' + CFG.STONE_BETS[j] + '石·小</button>';
            }
            html += '</div>';
        } else {
            html += '<p class="text-xs text-gray-600 mb-2">🏮 雅间帘子放着——连赢 ' + CFG.VIP_STREAK + ' 把才请上楼。</p>';
        }
        html += '<p class="text-[11px] text-gray-500 mb-2">规矩：总点 ≥11 为大、≤10 为小，围骰庄家通吃（庄家优势约 2.8%——久赌必输是明账）。每日铜桌净输 ' + CFG.COPPER_LOSS_CAP + ' / 净赢 ' + CFG.COPPER_WIN_CAP + ' 铜即收摊；连赢 ' + CFG.BAN_STREAK + ' 把列入黑名单三日。</p>';
        if (typeof window.showBuildingEffectDialog === 'function') {
            window.showBuildingEffectDialog('🎲 赌坊 · ' + (city() || ''), html);
            return true;
        }
        return false;
    }

    function open() {
        if (!denOk()) { say('🎲 这地界没有赌坊。', 'info'); return false; }
        if (!cd()) return false;
        rollDay();
        return render();
    }

    function panelHtml(cityName) {
        try {
            if (!denOk(cityName)) return '';
            if (cityName && city() && pkCity(cityName) !== pkCity(city())) return '';
            return '';   // 不单占面板一行——收进「市井烟火」总门
        } catch (e) { return ''; }
    }

    // ============ 存读档（StateRegistry 正门） ============
    function _export() { return JSON.parse(JSON.stringify(_state)); }
    function _import(s) {
        if (!s || typeof s !== 'object') return;
        _state.day = Number.isFinite(Number(s.day)) ? Number(s.day) : -1;
        _state.copperNet = Number(s.copperNet) || 0;
        _state.stoneNet = Number(s.stoneNet) || 0;
        _state.streak = Number(s.streak) || 0;
        _state.bestStreak = Number(s.bestStreak) || 0;
        _state.plays = Number(s.plays) || 0;
        _state.bannedUntil = Number.isFinite(Number(s.bannedUntil)) ? Number(s.bannedUntil) : -1;
        _state.vip = !!s.vip;
        // v27.13：设施联动旗（老档缺键自动 -1——大赢勾子/请客当日都是当日旗，跨天自然作废）
        _state.treatHotDay = Number.isFinite(Number(s.treatHotDay)) ? Number(s.treatHotDay) : -1;
        _state.treatDay = Number.isFinite(Number(s.treatDay)) ? Number(s.treatDay) : -1;
        _state.lastRoll = (s.lastRoll && Array.isArray(s.lastRoll.dice) && s.lastRoll.dice.length === 3) ? s.lastRoll : null;
    }
    function _reset() {
        _state = { day: -1, copperNet: 0, stoneNet: 0, streak: 0, bestStreak: 0, plays: 0, bannedUntil: -1, vip: false, treatHotDay: -1, treatDay: -1, lastRoll: null };
    }
    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        window.StateRegistry.register('gambleDen', { version: 2, export: _export, import: _import, reset: _reset });  // v27.13：version 2——增 treatHotDay/treatDay
    }

    window.GambleDen = {
        CFG: CFG,
        denOk: denOk,
        bet: bet,
        open: open,
        render: render,
        panelHtml: panelHtml,
        treatRound: treatRound,   // v27.13 大赢勾子：「请全场喝一轮」（牌面按钮走这里）
        state: _export
    };
    window.openGambleDen = function () { return open(); };
})();
