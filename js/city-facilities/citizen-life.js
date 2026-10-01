// ==================== v25.8 黑道与人情批（第一百五十批 · 用户点单）· 街面人物志 ====================
// 此前街头十一种市民（摊贩/书生/工匠/乞丐/道士/武者/老者/妇人/孩童/琴师/棋手）共用一句闲聊
// （location-system.js 的 chatWithCitizen：随机一位 + 通用闲话池 + 10 分钟，零职业分岔、零营生）。
// 本账让街坊各干各的营生，并接通「当街抢劫」这条黑道（罪行账走 npc-crime.js addHeat 正门，同一本通缉账）：
//   · 摊贩漏真行情（MarketDynamic 现账）/ 书生论文长学识 / 工匠教手艺长锻造 / 乞丐转交施舍正门（丐帮眼线账在那本）/
//     道士街边卜一卦（吃人情账的卦师口条）/ 武者搭手过招（耗精力长历练）/ 老者讲古 / 妇人街坊闲话 /
//     孩童买糖哄话 / 琴师听曲悦心 / 棋手赌棋一局（押铜钱，神识参与成败）；
//   · 每人每样营生每日一次（运行时账，摸包同款「每日刷新合理」惯例），钱与效果一笔 RewardService 结清；
//   · 「🔪 打劫」：武者拔刀真仗（startBattle + _isCitizenRob 旗 → app.js 战后分支结算）；
//     乞丐碗里只有两枚铜板——抢乞丐就是打丐帮眼线的脸（缘分-20，耳目让风自动撤销；缘分深的，
//     三成五几率丐帮弟子上门讨说法，_isBeggarWrath 旗真仗）；老幼妇孺好得手但业障翻倍；
//     其余人按境界压人掷骰，失手一半呼救引巡兵（恶名+声望+罚金，摸包人赃并获同口径）。
// 入口三处：城市面板闲聊正门（chatWithCitizen 守卫转交）/ 市井烟火菜单「街坊搭话」/ 本账 browse 直开。
(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    var TUNE = {
        CHESS_STAKE: 10, CHESS_BASE: 0.4, CHESS_ATTR: 0.008, CHESS_MIN: 0.25, CHESS_MAX: 0.75,
        DIVINE_COPPER: 10, QIN_COPPER: 5, KID_CANDY: 2,
        ROB_BASE: 0.55, ROB_TIER: 0.05, ROB_MIN: 0.40, ROB_MAX: 0.90,
        ROB_KARMA_CHILD: -8, ROB_KARMA_WEAK: -6, ROB_KARMA: -3,
        ROB_HEAT: 2, ROB_SNITCH_P: 0.5, ROB_SNITCH_NOTO: 2, ROB_SNITCH_REP: 15,
        ROB_SNITCH_FINE: 20, ROB_SNITCH_FINE_SHORT: 2,
        FIGHT_WIN_COPPER_MIN: 30, FIGHT_WIN_COPPER_RANGE: 40, FIGHT_WIN_KARMA: -3,
        FIGHT_LOSE_HEALTH: 15, FIGHT_LOSE_ENERGY: 20, FIGHT_LOSE_COPPER: 20,
        BEGGAR_COPPER: 2, BEGGAR_KARMA: -5, BEGGAR_HEAT: 3, BEGGAR_GW_HIT: 20,
        WRATH_P: 0.35, WRATH_GW_AT: 25, WRATH_LOSE_COPPER: 30, WRATH_LOSE_HEALTH: 10, WRATH_GW_HIT: 5
    };

    // 抢劫所得（铜钱 [下限, 浮动]）与业障档（孩童/老弱另加重）
    var ROB_LOOT = {
        '摊贩': [30, 50], '书生': [10, 20], '工匠': [15, 25], '道士': [10, 20],
        '老者': [5, 15], '妇人': [5, 15], '孩童': [0, 5], '琴师': [10, 20], '棋手': [10, 20]
    };
    var WEAK_OCC = { '老者': 1, '妇人': 1 };

    var TALES = [
        '「老朽年轻时走西荒，见过一场沙暴里整支商队凭空没了——只剩驼铃声在沙底响了三年。」',
        '「三十年前天上掉过一块陨铁，几家门派为它打了一场，最后还是沉进了北冥。」',
        '「从前有位剑仙在这城里住过十年，谁也不知道——他走的那天，满城的剑都鸣了一声。」',
        '「人老了就爱讲古。你记住一句就够：江湖上的名头，都是一刀一刀换出来的。」'
    ];
    var KID_SAW = [
        '孩子含着糖含糊不清：「前几天看见有人半夜在钱庄后巷转悠……被伙计撵跑了。」',
        '孩子指着街尾：「那边有个老爷爷天天蹲着，碗里有铜板也不讨，就蹲着看人。」',
        '孩子把糖纸叠成一只鹤：「哥哥/姐姐，你会飞吗？我爹说修仙的人都会飞。」',
        '孩子悄悄说：「城墙根底下有个洞，我钻过——你可别告诉大人。」'
    ];

    var _actLog = {};   // { citizenId+':act'|':rob': absoluteDay } 运行时账

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
    function settle(spec, source) {
        try {
            if (window.RewardService && typeof window.RewardService.apply === 'function') {
                var r = window.RewardService.apply(spec, { source: source || '街面人物志', city: city() });
                return { ok: !!(r && r.success !== false), note: r && r.messages ? r.messages.join('、') : '' };
            }
        } catch (e) { console.warn('[静默失败] js/city-facilities/citizen-life.js · settle：这笔街面小账没落成', e && e.message); }
        return { ok: false, note: '' };
    }
    function advance(min, why) {
        try { if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') window.timeSystem.advanceTime(min, why); } catch (e) { console.warn('[静默失败] js/city-facilities/citizen-life.js · advance：时辰没扣成', e && e.message); }
    }
    function deed(mood, s) {
        try { if (typeof window.playerPushDeed === 'function') window.playerPushDeed(mood, s); } catch (e) { console.warn('[静默失败] js/city-facilities/citizen-life.js · deed：风声没递进传闻池', e && e.message); }
    }
    function addHeat(n, why) {
        try { if (window.NpcCrime && typeof window.NpcCrime.addHeat === 'function') window.NpcCrime.addHeat(n, why); } catch (e) { console.warn('[静默失败] js/city-facilities/citizen-life.js · addHeat：罪行没记进通缉账', e && e.message); }
    }
    function repDown(n) {
        var ct = city();
        if (!ct || typeof window.reduceReputation !== 'function') return false;
        try { window.reduceReputation(ct, n); return true; } catch (e) { console.warn('[静默失败] js/city-facilities/citizen-life.js · repDown：城望没扣成', e && e.message); return false; }
    }
    function refresh() {
        try { if (window.updateCharacterStatus) window.updateCharacterStatus(); } catch (e) { console.warn('[静默失败] js/city-facilities/citizen-life.js · refresh：面板没刷新', e && e.message); }
    }
    function citizens(ct) {
        try { if (typeof window.getCityCitizens === 'function') return window.getCityCitizens(ct) || []; } catch (e) { console.warn('[静默失败] js/city-facilities/citizen-life.js · citizens：街坊名单没调出来', e && e.message); }
        return [];
    }
    function citizenAt(ct, idx) {
        var list = citizens(ct);
        return list[idx] || null;
    }
    function attr(name) {
        try {
            var c = cd();
            var a = (c && c.attrs) || {};
            return Number(a[name]) || 10;
        } catch (e) { return 10; }
    }
    function copperNow() {
        try {
            if (window.inventory && window.inventory.currency && typeof window.inventory.currency.copper === 'number') return window.inventory.currency.copper;
        } catch (e) { console.warn('[静默失败] js/city-facilities/citizen-life.js · copperNow：钱袋没读到，按角色面上的数算', e && e.message); }
        var c = cd();
        return c ? (Number(c.copper) || 0) : 0;
    }

    // 真行情口条（与丐帮眼线/老街坊同一套读法：MarketDynamic 现账，不在位退闲话池，绝不编假消息）
    function marketIntel() {
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
                if (best && best.mul > 1.02) {
                    return '「' + best.region + '的' + best.cat + '眼下正缺（行市 ' + (Math.round(best.mul * 10) / 10) + ' 倍）' + (low && low.mul < 0.98 ? '；' + low.region + '的' + low.cat + '最贱（' + (Math.round(low.mul * 10) / 10) + ' 倍）' : '') + '——贩一趟，脚力钱就有了。」';
                }
            }
        } catch (eMD) { console.warn('[静默失败] js/city-facilities/citizen-life.js · marketIntel：行情账没读出来，退回闲话池', eMD && eMD.message); }
        try {
            if (typeof window.getCitizenGossip === 'function') {
                var pool = window.getCitizenGossip() || [];
                if (pool.length) { var g = pool[Math.floor(Math.random() * pool.length)]; return '「' + g.text + '」'; }
            }
        } catch (eG) { console.warn('[静默失败] js/city-facilities/citizen-life.js · marketIntel：闲话池也没读出来，说句套话', eG && eG.message); }
        return '「行情嘛——贵三分是行情，贱三分也是行情，腿勤快的人不亏。」';
    }

    // ============ 十一种营生 ============
    var TRADES = {
        '摊贩': { label: '🍜 打听行情', desc: '摊贩漏一条真行情（免费，10分钟）', act: function (ct, z) { advance(10, '与摊贩闲话'); var t = marketIntel(); log('🍜 摊贩 ' + z.name + ' 一边码货一边跟你唠：' + t, 'info'); say('🍜 ' + z.name + ' 压低声音：' + t, 'success'); return true; } },
        '书生': { label: '📚 论文', desc: '与书生对坐论文（学识+2，30分钟）', act: function (ct, z) { advance(30, '与书生论文'); var r = settle({ lifeSkill: { name: '学识', exp: 2 } }); if (!r.ok) { say('📚 书生拱手：「改日再讨教。」', 'info'); return false; } log('📚 你与书生 ' + z.name + ' 对坐论文，从经义谈到修行，颇有进益。' + (r.note ? '（' + r.note + '）' : ''), 'success'); say('📚 ' + z.name + ' 拍案：「兄台这句解得好！」一席论文，学识+2。', 'success'); return true; } },
        '工匠': { label: '🔨 讨教手艺', desc: '看工匠干活讨教门道（锻造+2，30分钟）', act: function (ct, z) { advance(30, '讨教手艺'); var r = settle({ lifeSkill: { name: '锻造', exp: 2 } }); if (!r.ok) { say('🔨 工匠摆摆手：「炉子正忙。」', 'info'); return false; } log('🔨 工匠 ' + z.name + ' 让你拉了半日风箱，顺手教了你几手淬火看火的门道。' + (r.note ? '（' + r.note + '）' : ''), 'success'); say('🔨 ' + z.name + ' 把钳子递给你：「火候看色不看钟。」锻造+2。', 'success'); return true; } },
        '乞丐': { label: '🥣 施舍', desc: '转交街角施舍正门（丐帮眼线的账在那本）', act: function (ct, z) { try { if (window.BeggarAlms && typeof window.BeggarAlms.encounter === 'function') return !!window.BeggarAlms.encounter(ct || city()); } catch (e) { console.warn('[静默失败] js/city-facilities/citizen-life.js · TRADES.乞丐：施舍正门没转交成', e && e.message); } say('🥣 乞丐 ' + z.name + ' 冲你点了点头，把碗往前推了推。', 'info'); return false; } },
        '道士': { label: '☯️ 街边卜一卦', desc: '铜钱' + TUNE.DIVINE_COPPER + '，卦师给一句真提示（20分钟）', act: function (ct, z) { var r = settle({ copper: -TUNE.DIVINE_COPPER }); if (!r.ok) { say('☯️ 道士 ' + z.name + ' 笑笑：「卦金 ' + TUNE.DIVINE_COPPER + ' 铜——钱不够，卦不灵。」', 'info'); return false; } advance(20, '街边卜卦'); var hint = null; try { if (window.NpcBond && typeof window.NpcBond.fortuneHints === 'function') { var hs = window.NpcBond.fortuneHints(1); if (hs && hs.length) hint = hs[0]; } } catch (eH) { console.warn('[静默失败] js/city-facilities/citizen-life.js · TRADES.道士：卦师口条没请到，退回闲话', eH && eH.message); } if (!hint) hint = marketIntel(); log('☯️ 街边卦摊：' + z.name + ' 收了 ' + TUNE.DIVINE_COPPER + ' 铜，摇卦半晌——' + hint, 'info'); say('☯️ ' + z.name + ' 掐指一算：' + hint, 'success'); return true; } },
        '武者': { label: '⚔️ 搭手过招', desc: '与武者搭手（精力-10，历练+8，30分钟）', act: function (ct, z) { var r = settle({ energy: -10, exp: 8 }); if (!r.ok) { say('⚔️ 你精力不济，' + z.name + ' 摆摆手：「歇好了再来。」', 'info'); return false; } advance(30, '搭手过招'); log('⚔️ 你与武者 ' + z.name + ' 在街心搭手过了几招，围观的喝彩声里各有长进。' + (r.note ? '（' + r.note + '）' : ''), 'success'); say('⚔️ ' + z.name + ' 抱拳：「好底子！这几下你接得漂亮。」历练+8。', 'success'); return true; } },
        '老者': { label: '👴 听TA讲古', desc: '老者讲一段旧事（心境+2，20分钟）', act: function (ct, z) { advance(20, '听老者讲古'); var r = settle({ mood: 2 }); var tale = TALES[Math.floor(Math.random() * TALES.length)]; log('👴 ' + z.name + ' 在槐树下讲了段古：' + tale, 'info'); say('👴 ' + tale + (r.ok ? '（心境+2）' : ''), 'success'); return true; } },
        '妇人': { label: '👩 街坊闲话', desc: '听一段街坊闲话（心境+1，10分钟）', act: function (ct, z) { advance(10, '街坊闲话'); var r = settle({ mood: 1 }); var g = (z.gossip && z.gossip.text) || '东家长西家短，日子都是这么过的'; log('👩 妇人 ' + z.name + ' 挎着菜篮子跟你唠了会儿家常：「' + g + '」', 'info'); say('👩 ' + z.name + ' 唠着家常：「' + g + '」' + (r.ok ? '（心境+1）' : ''), 'success'); return true; } },
        '孩童': { label: '👶 买糖哄TA说话', desc: '铜钱' + TUNE.KID_CANDY + '，孩子说件看见的事（心境+2，10分钟）', act: function (ct, z) { var r = settle({ copper: -TUNE.KID_CANDY, mood: 2 }); if (!r.ok) { say('👶 你摸了摸口袋——连颗糖钱都凑不出。孩子眨眨眼跑开了。', 'info'); return false; } advance(10, '买糖哄孩子'); var saw = KID_SAW[Math.floor(Math.random() * KID_SAW.length)]; log('👶 你给 ' + z.name + ' 买了颗糖。' + saw, 'info'); say('👶 ' + saw + '（心境+2）', 'success'); return true; } },
        '琴师': { label: '🎵 听一曲', desc: '打赏铜钱' + TUNE.QIN_COPPER + '，琴音悦心（心境+5 精力+5，30分钟）', act: function (ct, z) { var r = settle({ copper: -TUNE.QIN_COPPER, mood: 5, energy: 5 }); if (!r.ok) { say('🎵 琴师 ' + z.name + ' 指尖停在弦上：「赏钱 ' + TUNE.QIN_COPPER + ' 铜。」', 'info'); return false; } advance(30, '听琴'); log('🎵 琴师 ' + z.name + ' 焚了半炷香，一曲《流水》弹得街市都静了。（' + TUNE.QIN_COPPER + ' 铜打赏）', 'success'); say('🎵 一曲终了，满街叫卖声都低了三分——心境+5，精力+5。', 'success'); return true; } },
        '棋手': { label: '♟️ 赌棋一局', desc: '押铜钱' + TUNE.CHESS_STAKE + '，神识参与胜负（30分钟）', act: function (ct, z) { if (copperNow() < TUNE.CHESS_STAKE) { say('♟️ 棋手 ' + z.name + ' 把棋子拢进罐里：「彩头 ' + TUNE.CHESS_STAKE + ' 铜，钱不够不开局。」', 'info'); return false; } var p = Math.max(TUNE.CHESS_MIN, Math.min(TUNE.CHESS_MAX, TUNE.CHESS_BASE + (attr('intelligence') - 10) * TUNE.CHESS_ATTR)); advance(30, '赌棋'); if (Math.random() < p) { var r1 = settle({ copper: TUNE.CHESS_STAKE }); log('♟️ 你与棋手 ' + z.name + ' 手谈一局，中盘一战定胜负——赢了 ' + TUNE.CHESS_STAKE + ' 铜彩头。', 'success'); say('♟️ ' + z.name + ' 推枰认负：「好算力！」彩头 +' + TUNE.CHESS_STAKE + ' 铜。' + (r1.note ? '（' + r1.note + '）' : ''), 'success'); } else { var r2 = settle({ copper: -TUNE.CHESS_STAKE }); log('♟️ 你与棋手 ' + z.name + ' 手谈一局，官子被他妙手掏空——输了 ' + TUNE.CHESS_STAKE + ' 铜彩头。', 'info'); say('♟️ ' + z.name + ' 收子微微一笑：「承让。」彩头 -' + TUNE.CHESS_STAKE + ' 铜。' + (r2.ok ? '' : '（铜钱没能付清，棋手摆摆手记了个人情账）'), 'info'); } return true; } }
    };

    // ============ 营生（每日每人一次） ============
    function trade(ct, idx) {
        ct = ct || city();
        var z = citizenAt(ct, idx);
        if (!z) { say('那位街坊已经走了。', 'info'); return false; }
        if (!ct || !pkCity(ct)) { say('你身在城外野地——街上没有街坊。', 'info'); return false; }
        if (window.currentBattle) { say('打着架呢。', 'warning'); return false; }
        var t = TRADES[z.occupation];
        if (!t) { say(z.name + ' 摆摆手：「我就是个闲人，没什么营生可看。」', 'info'); return false; }
        var day = absDay();
        var key = z.id + ':act';
        if (_actLog[key] === day) { say(z.name + ' 笑道：「今儿已经陪你闹过一回了——明日请早。」', 'info'); return false; }
        var ok = false;
        try { ok = !!t.act(ct, z); } catch (e) { console.warn('[静默失败] js/city-facilities/citizen-life.js · trade：这出营生没演成', e && e.message); ok = false; }
        if (ok) _actLog[key] = day;
        refresh();
        try { if (typeof window.closeBuildingDialog === 'function') window.closeBuildingDialog(); } catch (eC) { console.warn('[静默失败] js/city-facilities/citizen-life.js · trade：街面窗没收掉', eC && eC.message); }
        return ok;
    }

    // ============ 打劫街坊 ============
    function rob(ct, idx) {
        ct = ct || city();
        var z = citizenAt(ct, idx);
        if (!z) { say('那位街坊已经走了。', 'info'); return false; }
        if (!ct || !pkCity(ct)) { say('你身在城外野地。', 'info'); return false; }
        if (window.currentBattle) { say('打着架呢。', 'warning'); return false; }
        var c = cd();
        if (!c) { say('请先创建角色。', 'warning'); return false; }
        var day = absDay();
        var key = z.id + ':rob';
        if (_actLog[key] === day) { say('今天已经对 ' + z.name + ' 出过手了——同一个街坊，一日只能抢一回。', 'info'); return false; }
        _actLog[key] = day;

        if (z.occupation === '武者') return robFight(ct, z);
        if (z.occupation === '乞丐') return robBeggar(ct, z);
        return robMeek(ct, z, c);
    }

    // 武者：拔刀真仗（_isCitizenRob 旗 → app.js 战后分支结算）
    function robFight(ct, z) {
        var tier = 1;
        try { if (typeof window.getRealmTier === 'function') tier = Number(window.getRealmTier((cd() || {}).realm)) || 1; } catch (e) { console.warn('[静默失败] js/city-facilities/citizen-life.js · robFight：境界尺没量出来，武者按 1 档捏', e && e.message); }
        var enemyData = {
            name: '街面武者·' + z.name, type: 'elite', physiologyType: 'humanoid',
            level: tier * 2 + 2, attack: 24 + tier * 5, defense: 12 + tier * 3, speed: 20,
            maxDurability: 80 + tier * 12, durabilities: { chest: 80 + tier * 12 }, combatAbilities: []
        };
        var started = false;
        try {
            if (window.NpcCrime && typeof window.NpcCrime.startFlaggedBattle === 'function') {
                started = window.NpcCrime.startFlaggedBattle(enemyData,
                    { _isCitizenRob: true, _crobCity: ct, _crobName: z.name, _crobOcc: z.occupation },
                    '🔪 你去掏 ' + z.name + ' 的钱袋——练家子反应何等快，一记擒拿直奔你腕子，当街动了手！');
            }
        } catch (eB) { console.warn('[静默失败] js/city-facilities/citizen-life.js · robFight：这一仗没拉起来', eB && eB.message); }
        if (!started) { say('🔪 ' + z.name + ' 一眼看破你的意图，沉肩一靠把你顶出三步：「练家子的钱袋，你也敢碰？」——没打成，但街坊都看见你的脸了。', 'warning'); addHeat(1, '抢劫武者未遂'); }
        return started;
    }

    function settleCitizenRob(won) {
        try {
            var b = window.currentBattle;
            var name = (b && b._crobName) || '武者';
            if (won) {
                var loot = TUNE.FIGHT_WIN_COPPER_MIN + Math.floor(Math.random() * TUNE.FIGHT_WIN_COPPER_RANGE);
                var r = settle({ copper: loot, karma: TUNE.FIGHT_WIN_KARMA, noto: 1 });
                addHeat(TUNE.ROB_HEAT, '当街抢劫武者');
                deed('bad', '你当街抢劫了练武的 ' + name + '，把TA打翻搜走了彩头——满街的人都看见了');
                log('🔪 你把 ' + name + ' 打翻在街心，搜走 ' + loot + ' 铜钱。（' + (r.note || '业障与恶名照记') + '，民愤热度+' + TUNE.ROB_HEAT + '）', 'danger');
                say('🔪 ' + name + ' 抱腕退开，钱袋归了你：铜钱+' + loot + '。（业障' + TUNE.FIGHT_WIN_KARMA + ' 恶名+1——围观的人记住了你的脸）', 'success');
            } else {
                var c = cd();
                if (c) {
                    c.health = Math.max(1, (Number(c.health) || 1) - TUNE.FIGHT_LOSE_HEALTH);
                    c.energy = Math.max(0, (Number(c.energy) || 0) - TUNE.FIGHT_LOSE_ENERGY);
                }
                var fine = copperNow() >= TUNE.FIGHT_LOSE_COPPER ? settle({ copper: -TUNE.FIGHT_LOSE_COPPER }) : { ok: false };
                addHeat(1, '抢劫武者失手');
                log('💀 抢劫失手——' + name + ' 反把你按在地上打了一顿' + (fine.ok ? '，还搜走你 ' + TUNE.FIGHT_LOSE_COPPER + ' 铜钱「赔汤药」' : '') + '。（伤-15 精力-20）', 'danger');
                say('💀 ' + name + ' 一脚把你踹进墙根：「也不打听打听我是谁！」' + (fine.ok ? 'TA搜走你 ' + TUNE.FIGHT_LOSE_COPPER + ' 铜钱当「赔汤药」。' : '') + '（伤-15 精力-20）', 'error');
            }
            refresh();
        } catch (e) { console.warn('[静默失败] js/city-facilities/citizen-life.js · settleCitizenRob：这一票的账没落下', e && e.message); }
    }
    window.settleCitizenRob = settleCitizenRob;

    // 乞丐：碗里只有两枚铜板——抢乞丐就是打丐帮眼线的脸
    function robBeggar(ct, z) {
        var gwBefore = 0, robbed = null;
        try {
            if (window.BeggarAlms) {
                if (typeof window.BeggarAlms.goodwill === 'function') gwBefore = Number(window.BeggarAlms.goodwill()) || 0;
                if (typeof window.BeggarAlms.robbed === 'function') robbed = window.BeggarAlms.robbed(TUNE.BEGGAR_GW_HIT);
            }
        } catch (eG) { console.warn('[静默失败] js/city-facilities/citizen-life.js · robBeggar：丐帮缘分账没动成', eG && eG.message); }
        var r = settle({ copper: TUNE.BEGGAR_COPPER, karma: TUNE.BEGGAR_KARMA, noto: 1 });
        addHeat(TUNE.BEGGAR_HEAT, '抢了乞丐的碗');
        deed('bad', '你连街角乞丐的破碗都抢——城里的乞丐都记住了你的脸，这话正在往丐帮的舵里传');
        var watchTxt = (robbed && robbed.watchLost) ? '丐帮的耳目从此收了声——道上再没人替你盯梢递话。' : '';
        log('🥣 你端起 ' + z.name + ' 面前的豁口粗碗，把里面两枚铜板倒进袖中。老乞丐没有喊，只是盯着你的脸看了很久。（丐帮缘分-' + TUNE.BEGGAR_GW_HIT + (watchTxt ? '，' + watchTxt : '') + '，业障' + TUNE.BEGGAR_KARMA + '，民愤热度+' + TUNE.BEGGAR_HEAT + '）', 'danger');
        say('🥣 破碗里只有两枚铜板——你连这个也抢。老乞丐不喊不叫，只是把你的脸记住了。（缘分-' + TUNE.BEGGAR_GW_HIT + '，' + watchTxt + '业障' + TUNE.BEGGAR_KARMA + ' 恶名+1）', 'error');
        refresh();
        // 缘分深的：丐帮弟子上门讨说法（三成五）
        if (gwBefore >= TUNE.WRATH_GW_AT && Math.random() < TUNE.WRATH_P) {
            var tier = 1;
            try { if (typeof window.getRealmTier === 'function') tier = Number(window.getRealmTier((cd() || {}).realm)) || 1; } catch (eT) { console.warn('[静默失败] js/city-facilities/citizen-life.js · robBeggar：境界尺没量出来，弟子按 1 档捏', eT && eT.message); }
            try {
                if (window.NpcCrime && typeof window.NpcCrime.startFlaggedBattle === 'function') {
                    window.NpcCrime.startFlaggedBattle({
                        name: '丐帮污衣弟子', type: 'elite', physiologyType: 'humanoid',
                        level: tier * 2 + 3, attack: 26 + tier * 5, defense: 13 + tier * 3, speed: 21,
                        maxDurability: 85 + tier * 12, durabilities: { chest: 85 + tier * 12 }, combatAbilities: []
                    }, { _isBeggarWrath: true, _wrathGw: gwBefore },
                        '🥣 你还没走出街口，两条打狗棒已经横在了面前——「抢到我丐帮弟兄碗里的，今日得给个说法！」');
                }
            } catch (eW) { console.warn('[静默失败] js/city-facilities/citizen-life.js · robBeggar：讨说法的没拦住你', eW && eW.message); }
        }
        try { if (typeof window.closeBuildingDialog === 'function') window.closeBuildingDialog(); } catch (eC) { console.warn('[静默失败] js/city-facilities/citizen-life.js · robBeggar：街面窗没收掉', eC && eC.message); }
        return true;
    }

    function settleBeggarWrath(won) {
        try {
            if (won) {
                addHeat(1, '打退了讨说法的丐帮弟子');
                deed('bad', '丐帮弟子上门讨说法，被你打了回去——这笔账丐帮记下了');
                log('⚔️ 讨说法的丐帮弟子被你打退了。TA拄着打狗棒退进巷子，回头瞪了你一眼——这笔账，丐帮记下了。', 'warning');
                say('⚔️ 打狗棒被你磕飞出去。弟子咬牙退走——你赢了这一仗，输掉了整条街的口碑。', 'success');
            } else {
                var fine = copperNow() >= TUNE.WRATH_LOSE_COPPER ? settle({ copper: -TUNE.WRATH_LOSE_COPPER }) : null;
                if (!fine) {
                    var c = cd();
                    if (c) c.health = Math.max(1, (Number(c.health) || 1) - TUNE.WRATH_LOSE_HEALTH);
                }
                try { if (window.BeggarAlms && typeof window.BeggarAlms.robbed === 'function') window.BeggarAlms.robbed(TUNE.WRATH_GW_HIT); } catch (eG2) { console.warn('[静默失败] js/city-facilities/citizen-life.js · settleBeggarWrath：这笔缘分账没动成', eG2 && eG2.message); }
                log('💀 讨说法的丐帮弟子把你按在墙上' + (fine ? '，搜走 ' + TUNE.WRATH_LOSE_COPPER + ' 铜「赔弟兄的碗」' : '，一顿好打（伤-10）') + '。（丐帮缘分再-5）', 'danger');
                say('💀 打狗棒落在你肩上——' + (fine ? '弟子搜走 ' + TUNE.WRATH_LOSE_COPPER + ' 铜「赔弟兄的碗」' : '你挨了一顿好打（伤-10）') + '。（丐帮缘分再-5）', 'error');
            }
            refresh();
        } catch (e) { console.warn('[静默失败] js/city-facilities/citizen-life.js · settleBeggarWrath：讨说法的账没落下', e && e.message); }
    }
    window.settleBeggarWrath = settleBeggarWrath;

    // 老幼妇孺与寻常街坊：按境界压人掷骰
    function robMeek(ct, z, c) {
        var tier = 0;
        try { if (typeof window.getRealmTier === 'function') tier = Number(window.getRealmTier(c.realm)) || 0; } catch (eT2) { console.warn('[静默失败] js/city-facilities/citizen-life.js · robMeek：境界尺没量出来，按零档压人', eT2 && eT2.message); }
        var rate = Math.max(TUNE.ROB_MIN, Math.min(TUNE.ROB_MAX, TUNE.ROB_BASE + tier * TUNE.ROB_TIER));
        advance(10, '当街行抢');
        if (Math.random() < rate) {
            var band = ROB_LOOT[z.occupation] || [5, 15];
            var loot = band[0] + Math.floor(Math.random() * band[1]);
            var karma = z.occupation === '孩童' ? TUNE.ROB_KARMA_CHILD : (WEAK_OCC[z.occupation] ? TUNE.ROB_KARMA_WEAK : TUNE.ROB_KARMA);
            var r = settle({ copper: loot, karma: karma, noto: 1 });
            addHeat(TUNE.ROB_HEAT, '当街抢劫' + z.occupation);
            deed('bad', z.occupation === '孩童' || WEAK_OCC[z.occupation]
                ? '你连' + (z.occupation === '孩童' ? '孩子' : '上了年纪的人') + '都抢——整条街都在背后戳你的脊梁骨'
                : '你当街抢了' + z.occupation + ' ' + z.name + '，街坊都看见了');
            log('🔪 你截住 ' + z.occupation + ' ' + z.name + '，亮出兵刃——TA哆嗦着交出 ' + loot + ' 枚铜钱。（业障' + karma + '，恶名+1，民愤热度+' + TUNE.ROB_HEAT + '）', 'danger');
            say('🔪 ' + z.name + ' 把铜钱（+' + loot + '）哆嗦着递了过来。' + (z.occupation === '孩童' ? '孩子的哭声追了你半条街——业障' + karma + '。' : (WEAK_OCC[z.occupation] ? 'TA一把年纪，你下得去手——业障' + karma + '。' : '（业障' + karma + ' 恶名+1）')), 'error');
            refresh();
            try { if (typeof window.closeBuildingDialog === 'function') window.closeBuildingDialog(); } catch (eC2) { console.warn('[静默失败] js/city-facilities/citizen-life.js · robMeek：街面窗没收掉', eC2 && eC2.message); }
            return true;
        }
        // 失手：一半呼救引巡兵，一半让人跑了
        if (Math.random() < TUNE.ROB_SNITCH_P) {
            c.notoriety = Math.min(100, (Number(c.notoriety) || 0) + TUNE.ROB_SNITCH_NOTO);
            addHeat(TUNE.ROB_SNITCH_NOTO, '当街行抢被拿');
            repDown(TUNE.ROB_SNITCH_REP);
            var fineTxt;
            if (copperNow() >= TUNE.ROB_SNITCH_FINE) {
                var rf = settle({ copper: -TUNE.ROB_SNITCH_FINE });
                fineTxt = rf.ok ? '罚金 ' + TUNE.ROB_SNITCH_FINE + ' 铜钱' : '罚金没缴成';
            } else {
                c.notoriety = Math.min(100, (Number(c.notoriety) || 0) + TUNE.ROB_SNITCH_FINE_SHORT);
                fineTxt = '拿不出罚金，挨了顿板子（恶名再+' + TUNE.ROB_SNITCH_FINE_SHORT + '）';
            }
            log('🚨 ' + z.name + ' 扯着嗓子呼救，巡街的兵丁把你按在了墙上。（恶名+' + TUNE.ROB_SNITCH_NOTO + '，' + ct + '声望-' + TUNE.ROB_SNITCH_REP + '，' + fineTxt + '）', 'danger');
            say('🚨 呼救声引来巡兵——' + fineTxt + '。（恶名+' + TUNE.ROB_SNITCH_NOTO + '，声望-' + TUNE.ROB_SNITCH_REP + '）', 'error');
        } else {
            addHeat(1, '当街行抢未遂');
            log('💨 ' + z.name + ' 一声尖叫扎进人流——你没抢成，趁乱溜了。（民愤热度+1）', 'warning');
            say('💨 ' + z.name + ' 尖叫着扎进人流，街坊的窗户一扇扇推开——你没得手，灰溜溜地溜了。', 'warning');
        }
        refresh();
        try { if (typeof window.closeBuildingDialog === 'function') window.closeBuildingDialog(); } catch (eC3) { console.warn('[静默失败] js/city-facilities/citizen-life.js · robMeek：街面窗没收掉', eC3 && eC3.message); }
        return false;
    }

    // ============ 街面窗 ============
    function open(ct, idx) {
        ct = ct || city();
        var z = citizenAt(ct, idx);
        if (!z) { say('街上没有看到那个人。', 'info'); return false; }
        var t = TRADES[z.occupation];
        var day = absDay();
        var actedToday = _actLog[z.id + ':act'] === day;
        var robbedToday = _actLog[z.id + ':rob'] === day;
        var btn = 'class="w-full p-3 rounded mb-2 text-left text-sm text-white hover:opacity-90"';
        var html = '<div class="flex items-center gap-3 mb-3">' +
            '<div class="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-2xl">' + (z.icon || '👤') + '</div>' +
            '<div><p class="text-white font-bold">' + z.name + '</p><p class="text-xs text-gray-400">' + z.occupation + ' · ' + ct + '</p></div></div>' +
            '<div class="bg-gray-900/50 rounded-lg p-3 mb-2"><p class="text-gray-300 text-sm">「' + (z.desc || '') + '」</p></div>' +
            (z.gossip && z.gossip.text ? '<div class="bg-yellow-900/30 rounded-lg p-2 border border-yellow-600/30 mb-2"><p class="text-gray-200 text-xs">💬 「' + z.gossip.text + '」</p></div>' : '') +
            (t ? '<button onclick="CitizenLife.trade(\'' + ct + '\',' + idx + ')" ' + btn.replace('p-3', 'bg-teal-900 p-3') + '>' + t.label + '<span class="text-[11px] text-gray-400 ml-2">' + t.desc + (actedToday ? '——今日已做过' : '') + '</span></button>' : '') +
            '<button onclick="CitizenLife.rob(\'' + ct + '\',' + idx + ')" ' + btn.replace('p-3', 'bg-red-950 p-3') + '>🔪 打劫TA<span class="text-[11px] text-red-300/70 ml-2">当街行抢——业障、恶名、民愤热度三本账' + (robbedToday ? '（今日已动过手）' : '') + '</span></button>' +
            '<button onclick="CitizenLife.browse(\'' + ct + '\')" ' + btn.replace('p-3', 'bg-gray-700 p-3') + '>↩ 回到街面</button>';
        if (typeof window.showBuildingEffectDialog === 'function') {
            window.showBuildingEffectDialog((z.icon || '👤') + ' ' + z.name + ' · ' + z.occupation, html);
            return true;
        }
        return false;
    }

    function browse(ct) {
        ct = ct || city();
        if (!ct || !pkCity(ct)) { say('👥 你身在城外野地——四下没有街坊。', 'info'); return false; }
        var list = citizens(ct);
        if (!list.length) { say('👥 街上没有看到什么人。', 'info'); return false; }
        var rows = '';
        for (var i = 0; i < list.length; i++) {
            var z = list[i];
            var t = TRADES[z.occupation];
            rows += '<button onclick="CitizenLife.open(\'' + ct + '\',' + i + ')" class="w-full p-2 mb-1 rounded bg-gray-800 hover:bg-gray-700 text-left flex items-center gap-2">' +
                '<span class="text-xl">' + (z.icon || '👤') + '</span>' +
                '<span class="text-sm text-white">' + z.name + '</span>' +
                '<span class="text-xs text-gray-400">' + z.occupation + '</span>' +
                '<span class="text-[11px] text-teal-300/80 ml-auto">' + (t ? t.label.split(' ')[1] || t.label : '闲人') + '</span></button>';
        }
        var html = '<p class="text-sm text-gray-400 mb-2">' + ct + '的街面上人来人往——各有各的营生，也各有各的钱袋。</p>' + rows +
            '<p class="text-[11px] text-gray-500 mt-1">搭话是营生，打劫是黑道——两本账，街面都记着。</p>';
        if (typeof window.showBuildingEffectDialog === 'function') {
            window.showBuildingEffectDialog('👥 街坊四邻 · ' + ct, html);
            return true;
        }
        return false;
    }

    function openRandom(ct) {
        ct = ct || city();
        var list = citizens(ct);
        if (!list.length) { say('街上没有看到什么人。', 'info'); return false; }
        return open(ct, Math.floor(Math.random() * list.length));
    }

    window.CitizenLife = {
        TUNE: TUNE,
        TRADES: TRADES,
        browse: browse,
        open: open,
        openRandom: openRandom,
        trade: trade,
        rob: rob,
        settleCitizenRob: settleCitizenRob,
        settleBeggarWrath: settleBeggarWrath,
        marketIntel: marketIntel
    };
    window.openCitizenLife = function () { return browse(); };
})();
