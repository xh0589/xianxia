// ==================== v26.1 五路进城批（第一百五十二批 · 用户点单）· 斗蛐蛐账 ====================
// 用户点单：「巷子里斗蛐蛐——郊外捉虫、养性子的蛐蛐、巷口赌局下注，虫有品相脾气，
//           赢了巷子里都喊你『蛐王』。」
// 本账开一整套蛐蛐经（有市集的城才有巷口赌局）：
//   ① 捉虫：出城草窠蹲两个时辰（时辰真扣），五档品相全明账——
//      草壳 45% / 铜将军 30% / 紫牙帅 18% / 金翅大将 6% / 蛐王 1%（概率和恰为 1，账面可复算）；
//   ② 虫蛐罐至多五只——好虫难养，罐位就是取舍；
//   ③ 喂养：4 铜钱一口，每只至多喂五口（性子养到头就到头——钱堆不出无限斗性）；
//   ④ 巷口赌局三档注（10/50/200 铜钱），对手按注档生成；赢拿 1.8 倍（巷口抽一成——明账）；
//      输了虫可能伤（斗性减半三日）可能死（注越狠死险越高）——虫是活物，不是筹码；
//   ⑤ 每日至多五场；连胜五场，巷子里都喊你「蛐王」（传闻池真灌）。
// 口径：铜钱走 RewardService 单一真源；时辰走 advanceTime；风声走 playerPushDeed；
//   蛐蛐罐落 StateRegistry 'cricket' 正门（存档不开新键）。
(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    var CFG = {
        JARS: 5,                  // 虫罐位数
        CATCH_MIN: 120,           // 出城捉虫的时辰
        FEED_COPPER: 4,           // 一口喂养
        FEED_MAX: 5,              // 每只至多喂几口
        FEED_POWER: 2,            // 每口养的斗性
        BETS: [10, 50, 200],      // 三档注（铜钱）
        WIN_MUL: 1.8,             // 赢的赔率（巷口抽一成——明账）
        FIGHTS_DAILY: 5,          // 每日场数
        HURT_P: 0.35,             // 败后受伤率（斗性减半）
        HURT_DAYS: 3,             // 伤养几日
        DIE_MUL: [0.04, 0.08, 0.16],  // 败后死险按注档（虫是活物）
        STREAK_KING: 5            // 连胜几场得「蛐王」名号
    };

    // 五档品相（明账）：p 概率和恰为 1；power 斗性区间
    var GRADES = [
        { g: 1, name: '草壳', p: 0.45, power: [8, 14], word: '灰扑扑的草壳子——巷口小孩都懒得看一眼' },
        { g: 2, name: '铜将军', p: 0.30, power: [14, 22], word: '铜头铁翅，叫起来嗡嗡带风' },
        { g: 3, name: '紫牙帅', p: 0.18, power: [22, 32], word: '一对紫牙钳，斗性烈得很' },
        { g: 4, name: '金翅大将', p: 0.06, power: [32, 45], word: '金翅振开，一罐的虫都不叫了' },
        { g: 5, name: '蛐王', p: 0.01, power: [45, 60], word: '通体墨玉、牙钳带钩——老把式见了都要作揖' }
    ];
    var NAME_POOL = ['铁袍', '金翅', '紫牙', '乌盔', '雪牙', '赤眉', '青翼', '白袍', '墨甲', '铜锤'];

    var _st = { jars: [], streak: 0, best: 0, day: -1, fights: 0, wins: 0, losses: 0, kingCries: 0 };

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
        } catch (e) { console.warn('[静默失败] js/city-facilities/cricket-fight.js · absDay：日历没读出来，按零日算', e && e.message); return 0; }
        return 0;
    }
    function settle(spec, source) {
        try {
            if (window.RewardService && typeof window.RewardService.apply === 'function') {
                var r = window.RewardService.apply(spec, { facilitySpend: true, source: source || '斗蛐蛐', city: city() });
                return { ok: !!(r && r.success !== false), note: r && r.messages ? r.messages.join('、') : '' };
            }
        } catch (e) { console.warn('[静默失败] js/city-facilities/cricket-fight.js · settle：这笔账没落成一笔', e && e.message); }
        return { ok: false, note: '' };
    }
    function advance(min, why) {
        try { if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') window.timeSystem.advanceTime(min, why); } catch (e) { console.warn('[静默失败] js/city-facilities/cricket-fight.js · advance：时辰没扣成', e && e.message); }
    }
    function deed(mood, s) {
        try { if (typeof window.playerPushDeed === 'function') window.playerPushDeed(mood, s); } catch (e) { console.warn('[静默失败] js/city-facilities/cricket-fight.js · deed：风声没递进传闻池', e && e.message); }
    }
    function refresh() {
        try { if (window.updateCharacterStatus) window.updateCharacterStatus(); } catch (e) { console.warn('[静默失败] js/city-facilities/cricket-fight.js · refresh：面板没刷新', e && e.message); }
        try { if (typeof window.updateCurrencyUI === 'function') window.updateCurrencyUI(); } catch (e2) { console.warn('[静默失败] js/city-facilities/cricket-fight.js · refresh：钱袋没刷新', e2 && e2.message); }
    }
    function denOk(ct) {
        try {
            var d = window.locationSystem && window.locationSystem.getCityData && window.locationSystem.getCityData(ct || city());
            if (!d || !d.buildings) return false;
            return d.buildings.indexOf('market') >= 0 || d.buildings.indexOf('shop') >= 0;
        } catch (e) { console.warn('[静默失败] js/city-facilities/cricket-fight.js · denOk：城里有没有巷口没问清，按没有算', e && e.message); return false; }
    }
    function rollDay() {
        var day = absDay();
        if (_st.day !== day) { _st.day = day; _st.fights = 0; }
    }
    function effPower(k) {
        if (!k) return 0;
        var hurt = Number(k.hurtUntil) > absDay();
        return Math.max(1, Math.round((Number(k.power) || 1) * (hurt ? 0.5 : 1)));
    }
    function gradeName(k) {
        var gr = GRADES[Math.max(0, Math.min(GRADES.length - 1, (Number(k && k.grade) || 1) - 1))];
        return gr.name;
    }

    // ============ ① 出城捉虫 ============
    function catchCricket(rng) {
        rollDay();
        var c = cd();
        if (!c) { say('请先创建角色。', 'warning'); return false; }
        var ct = city();
        if (!ct || !denOk(ct)) { say('🦗 这地界没有草窠巷口——斗蛐蛐跟着市集走。', 'info'); return false; }
        if (_st.jars.length >= CFG.JARS) { say('🦗 蛐蛐罐满了（' + CFG.JARS + ' 只）——好虫难养，先放掉一只再来捉。', 'warning'); return false; }
        var rr = (typeof rng === 'function') ? rng : Math.random;
        advance(CFG.CATCH_MIN, '出城草窠捉虫');
        // 品相：概率表明账
        var roll = rr(), acc = 0, gi = GRADES.length - 1;
        for (var i = 0; i < GRADES.length; i++) { acc += GRADES[i].p; if (roll < acc) { gi = i; break; } }
        var gr = GRADES[gi];
        var lo = gr.power[0], hi = gr.power[1];
        var power = lo + Math.round(rr() * (hi - lo));
        var nm = NAME_POOL[Math.floor(rr() * NAME_POOL.length) % NAME_POOL.length] + '·' + gr.name;
        _st.jars.push({ name: nm, grade: gr.g, power: power, fed: 0, hurtUntil: 0, caughtDay: absDay(), city: ct });
        log('🦗 你在' + ct + '城外的草窠里蹲了整整两个时辰，露水打湿了裤脚——终于罩住一只' + nm + '！（' + gr.word + ' · 斗性 ' + power + '）', gi >= 2 ? 'success' : 'info');
        say('🦗 捉到「' + nm + '」（斗性 ' + power + '）' + (gi >= 3 ? '——老把式都要多看两眼！' : '，入了蛐蛐罐。'), gi >= 2 ? 'success' : 'info');
        if (gi === GRADES.length - 1) deed('good', '你在' + ct + '城外捉到一只通体墨玉的蛐王——巷子里玩虫的都来瞻仰');
        refresh();
        open();
        return true;
    }

    // ============ ③ 喂养 ============
    function feed(idx, silent) {
        var k = _st.jars[Math.floor(Number(idx))];
        if (!k) { say('🦗 罐里没这只虫。', 'info'); return false; }
        if ((Number(k.fed) || 0) >= CFG.FEED_MAX) { say('🦗 「' + k.name + '」的性子养到头了（' + CFG.FEED_MAX + ' 口喂满）——再喂就厌食了，钱堆不出无限斗性。', 'info'); return false; }
        var pay = settle({ copper: -CFG.FEED_COPPER }, '喂虫');
        if (!pay.ok) { say('🦗 虫食钱（' + CFG.FEED_COPPER + ' 铜钱）没能付出去——虫子饿着肚子可不斗。', 'warning'); return false; }
        k.fed = (Number(k.fed) || 0) + 1;
        k.power = (Number(k.power) || 1) + CFG.FEED_POWER;
        if (!silent) {
            log('🦗 你给「' + k.name + '」喂了一口蟹肉末（' + CFG.FEED_COPPER + ' 铜钱）——须子抖得欢实。（斗性+' + CFG.FEED_POWER + ' = ' + k.power + '，已喂 ' + k.fed + '/' + CFG.FEED_MAX + ' 口）', 'info');
            say('🦗 「' + k.name + '」斗性+' + CFG.FEED_POWER + '（现 ' + k.power + '）。', 'success');
            refresh();
            open();
        }
        return true;
    }

    // ============ ④ 巷口开斗 ============
    function fight(betIdx, myIdx, rng) {
        rollDay();
        var c = cd();
        if (!c) { say('请先创建角色。', 'warning'); return false; }
        var ct = city();
        if (!ct || !denOk(ct)) { say('🦗 这地界没有巷口赌局——斗蛐蛐跟着市集走。', 'info'); return false; }
        if (_st.fights >= CFG.FIGHTS_DAILY) { say('🦗 今日五场已满——巷口的老把式收了斗盆：「虫乏了，再斗就伤本。明日请早。」', 'info'); return false; }
        var bi = Math.floor(Number(betIdx));
        var bet = CFG.BETS[bi];
        if (!bet) { say('🦗 没这档注。', 'warning'); return false; }
        var k = _st.jars[Math.floor(Number(myIdx))];
        if (!k) { say('🦗 先挑一只你罐里的虫。', 'warning'); return false; }
        if (Number(k.hurtUntil) > absDay()) { say('🦗 「' + k.name + '」还带着伤（还有 ' + (Number(k.hurtUntil) - absDay()) + ' 日养好）——带伤上阵是害它。', 'warning'); return false; }

        // 注钱先落账（输了就是输了，不赖账）
        var pay = settle({ copper: -bet }, '斗蛐蛐下注');
        if (!pay.ok) { say('🦗 你摸不出 ' + bet + ' 铜钱的注——巷口不赊账。', 'warning'); return false; }
        var rr = (typeof rng === 'function') ? rng : Math.random;
        advance(20, '巷口斗蛐蛐');
        _st.fights += 1;

        // 对手按注档生成（明账：注越大，对面的虫越横）
        var oppBand = [[10, 24], [20, 38], [30, 55]][bi] || [10, 24];
        var oppPower = oppBand[0] + Math.round(rr() * (oppBand[1] - oppBand[0]));
        var oppName = NAME_POOL[Math.floor(rr() * NAME_POOL.length) % NAME_POOL.length] + '·' + (oppPower >= 40 ? '金翅大将' : oppPower >= 28 ? '紫牙帅' : oppPower >= 18 ? '铜将军' : '草壳');
        var mine = effPower(k) * (0.75 + rr() * 0.5);
        var his = oppPower * (0.75 + rr() * 0.5);
        var win = mine >= his;

        if (win) {
            _st.wins += 1;
            _st.streak += 1;
            if (_st.streak > _st.best) _st.best = _st.streak;
            var prize = Math.round(bet * CFG.WIN_MUL);
            settle({ copper: prize }, '斗蛐蛐彩头');
            log('🦗 斗盆里两只虫咬成一团——「' + k.name + '」（斗性 ' + effPower(k) + '）一记钳甩把「' + oppName + '」（斗性 ' + oppPower + '）掀翻在盆沿！围观的轰然叫好。（彩头 ' + prize + ' 铜钱，连胜 ' + _st.streak + '）', 'success');
            say('🦗 赢了！「' + k.name + '」掀翻对手——彩头 ' + prize + ' 铜钱（连胜 ' + _st.streak + '）。', 'success');
            if (_st.streak === CFG.STREAK_KING) {
                _st.kingCries += 1;
                deed('good', '你的蛐蛐在' + ct + '巷口连胜' + CFG.STREAK_KING + '场——如今巷子里都喊你「蛐王」');
                log('🦗 连胜' + CFG.STREAK_KING + '场！巷口的老把式抱拳：「' + ct + '巷子里，如今就认您这位蛐王！」（名号进了传闻池）', 'success');
            }
            refresh();
            open();
            return true;
        }

        // 败：注钱没了；虫是活物——可能伤、可能死（死险按注档）
        _st.losses += 1;
        _st.streak = 0;
        var dieP = CFG.DIE_MUL[bi] || CFG.DIE_MUL[0];
        var tail = rr();
        var ki = _st.jars.indexOf(k);
        if (tail < dieP) {
            if (ki >= 0) _st.jars.splice(ki, 1);
            log('🦗 「' + k.name + '」被「' + oppName + '」死死钳住，斗到最后一口气也没松牙——盆里安静下来时，它已经不动了。你把它捧出来，埋在城外的草窠里。（注钱 ' + bet + ' 铜钱输了，虫也没了——虫是活物，不是筹码）', 'danger');
            say('🦗 输了——「' + k.name + '」斗死在盆里。（−' + bet + ' 铜钱）', 'error');
        } else if (tail < dieP + CFG.HURT_P) {
            k.hurtUntil = absDay() + CFG.HURT_DAYS;
            log('🦗 「' + k.name + '」被「' + oppName + '」咬伤了一只钳牙，败下阵来。你赶紧把它收回罐里养着。（注钱 ' + bet + ' 铜钱输了，虫伤了——' + CFG.HURT_DAYS + ' 日内斗性减半，养好再战）', 'warning');
            say('🦗 输了——「' + k.name + '」带伤，养 ' + CFG.HURT_DAYS + ' 日。（−' + bet + ' 铜钱）', 'error');
        } else {
            log('🦗 「' + k.name + '」斗到力竭，被「' + oppName + '」压了下去——好在虫没伤，就是注钱没了。（−' + bet + ' 铜钱）', 'warning');
            say('🦗 输了 ' + bet + ' 铜钱——虫没伤，回罐歇着。', 'info');
        }
        refresh();
        open();
        return true;
    }

    // ============ 放虫 ============
    function release(idx) {
        var ki = Math.floor(Number(idx));
        var k = _st.jars[ki];
        if (!k) { say('🦗 罐里没这只虫。', 'info'); return false; }
        _st.jars.splice(ki, 1);
        log('🦗 你把「' + k.name + '」放回城外的草窠——它振了振翅，钻进草棵子里没了影。（罐位腾出来了）', 'info');
        say('🦗 「' + k.name + '」放归草窠。', 'info');
        refresh();
        open();
        return true;
    }

    // ============ 牌面 ============
    function open() {
        rollDay();
        if (!cd()) { say('请先创建角色。', 'warning'); return false; }
        var ct = city();
        if (!ct) { say('🦗 你在荒郊野外——巷口赌局在城里。', 'info'); return false; }
        if (!denOk(ct)) { say('🦗 ' + ct + '没有市集巷口——斗盆支不起来。', 'info'); return false; }
        var btn = 'class="w-full p-3 rounded mb-2 text-left text-sm text-white hover:opacity-90"';
        var html = '<p class="text-sm text-gray-400 mb-2">巷口的老槐树下围着一圈人，斗盆里的虫鸣一阵高过一阵。老把式冲你抬抬下巴：「带虫了没？」</p>' +
            '<p class="text-xs text-gray-500 mb-2">今日已斗 ' + _st.fights + '/' + CFG.FIGHTS_DAILY + ' 场 · 连胜 ' + _st.streak + '（最长 ' + _st.best + '） · 战绩 ' + _st.wins + '胜' + _st.losses + '负' + (_st.kingCries > 0 ? ' · <span class="text-amber-300">「蛐王」名号响过 ' + _st.kingCries + ' 回</span>' : '') + '</p>';
        // 罐里的虫
        if (_st.jars.length > 0) {
            html += '<p class="text-xs text-gray-400 mb-1">蛐蛐罐（' + _st.jars.length + '/' + CFG.JARS + '）：</p>';
            for (var i = 0; i < _st.jars.length; i++) {
                var k = _st.jars[i];
                var hurtLeft = Math.max(0, (Number(k.hurtUntil) || 0) - absDay());
                html += '<div class="p-2 bg-gray-800 rounded border border-gray-700 mb-1">' +
                    '<span class="text-sm text-gray-200">🦗 ' + k.name + ' <span class="text-xs text-amber-300">斗性 ' + effPower(k) + (hurtLeft > 0 ? '（带伤，原 ' + k.power + '，还有 ' + hurtLeft + ' 日养好）' : '') + '</span>' +
                    '<span class="block text-[11px] text-gray-500">喂养 ' + (Number(k.fed) || 0) + '/' + CFG.FEED_MAX + ' 口 · 捉于' + (k.city || ct) + '</span></span>' +
                    '<div class="flex gap-1 mt-1">' +
                    (hurtLeft > 0 ? '' : CFG.BETS.map(function (b, bi2) { return '<button onclick="window.Cricket.fight(' + bi2 + ',' + i + ')" class="px-2 py-1 rounded text-xs bg-red-900 text-white">斗 ' + b + ' 铜</button>'; }).join('')) +
                    ((Number(k.fed) || 0) < CFG.FEED_MAX ? '<button onclick="window.Cricket.feed(' + i + ')" class="px-2 py-1 rounded text-xs bg-emerald-900 text-white">喂（' + CFG.FEED_COPPER + ' 铜）</button>' : '') +
                    '<button onclick="window.Cricket.release(' + i + ')" class="px-2 py-1 rounded text-xs bg-gray-700 text-white">放归</button>' +
                    '</div></div>';
            }
        } else {
            html += '<p class="text-xs text-gray-500 mb-2">蛐蛐罐空着——先去城外草窠捉虫。</p>';
        }
        if (_st.jars.length < CFG.JARS) {
            html += '<button onclick="window.Cricket.catchCricket()" ' + btn.replace('p-3', 'bg-lime-900 p-3') + '>🌾 出城捉虫（' + CFG.CATCH_MIN + ' 分钟 · 品相全明账：草壳45% 铜将军30% 紫牙帅18% 金翅大将6% 蛐王1%）</button>';
        }
        html += '<p class="text-[11px] text-gray-500 mt-1">明账：赢拿 ' + CFG.WIN_MUL + ' 倍（巷口抽一成）；注越大对面的虫越横（10注对10-24斗性、50注对20-38、200注对30-55）；败后虫 ' + Math.round(CFG.HURT_P * 100) + '% 受伤（斗性减半 ' + CFG.HURT_DAYS + ' 日）、注档越高死险越高（' + CFG.DIE_MUL.map(function (d) { return Math.round(d * 100) + '%'; }).join('/') + '）——虫是活物，不是筹码。连胜 ' + CFG.STREAK_KING + ' 场得「蛐王」名号。</p>';
        if (typeof window.showBuildingEffectDialog === 'function') {
            window.showBuildingEffectDialog('🦗 巷口斗蛐蛐 · ' + ct, html);
            return true;
        }
        return false;
    }

    // ============ 存读档（StateRegistry 正门） ============
    function _export() { return JSON.parse(JSON.stringify(_st)); }
    function _import(s) {
        var st = { jars: [], streak: 0, best: 0, day: -1, fights: 0, wins: 0, losses: 0, kingCries: 0 };
        if (s && typeof s === 'object') {
            if (Array.isArray(s.jars)) {
                for (var i = 0; i < s.jars.length && st.jars.length < CFG.JARS; i++) {
                    var k = s.jars[i];
                    if (!k || typeof k !== 'object' || typeof k.name !== 'string') continue;
                    st.jars.push({
                        name: k.name.slice(0, 24),
                        grade: Math.max(1, Math.min(GRADES.length, Math.floor(Number(k.grade)) || 1)),
                        power: Math.max(1, Math.min(200, Math.floor(Number(k.power)) || 8)),
                        fed: Math.max(0, Math.min(CFG.FEED_MAX, Math.floor(Number(k.fed)) || 0)),
                        hurtUntil: Math.max(0, Math.floor(Number(k.hurtUntil)) || 0),
                        caughtDay: Math.max(0, Math.floor(Number(k.caughtDay)) || 0),
                        city: typeof k.city === 'string' ? k.city.slice(0, 30) : ''
                    });
                }
            }
            st.streak = Math.max(0, Math.min(10000, Math.floor(Number(s.streak)) || 0));
            st.best = Math.max(st.streak, Math.min(10000, Math.floor(Number(s.best)) || 0));
            st.day = Number.isFinite(Number(s.day)) ? Number(s.day) : -1;
            st.fights = Math.max(0, Math.min(CFG.FIGHTS_DAILY, Math.floor(Number(s.fights)) || 0));
            st.wins = Math.max(0, Math.min(1000000, Math.floor(Number(s.wins)) || 0));
            st.losses = Math.max(0, Math.min(1000000, Math.floor(Number(s.losses)) || 0));
            st.kingCries = Math.max(0, Math.min(10000, Math.floor(Number(s.kingCries)) || 0));
        }
        _st = st;
    }
    function _reset() { _st = { jars: [], streak: 0, best: 0, day: -1, fights: 0, wins: 0, losses: 0, kingCries: 0 }; }
    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        window.StateRegistry.register('cricket', { version: 1, export: _export, import: _import, reset: _reset });
    }

    window.Cricket = {
        CFG: CFG, GRADES: GRADES,
        denOk: denOk, effPower: effPower,
        catchCricket: catchCricket, feed: feed, fight: fight, release: release,
        open: open,
        state: _export
    };
    window.openCricketDen = function () { return open(); };
})();
