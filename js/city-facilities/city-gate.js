// ==================== v26.1 五路进城批（第一百五十二批 · 用户点单）· 城门账 ====================
// 用户点单：「过城门那道关——入城钱、守卒拿通缉册比对（正接上两档铁律：特质档难认、画像档
//           一眼就中），易容的走城门心跳加速，被拒了还能夜里翻墙，甚至塞钱买通门卒。」
// 本账挂在 location-system.enterCity 查完境界门槛、落位置之前的一道守卫钩子上：
//   ① 入城钱：凡进城先交 2 铜钱（穷得叮当响门卒白眼放行——不拿税硬卡人，这是明账）；
//   ② 通缉两档在城门兑现（v26.0 用户铁律）：
//      特质档（画影付阙如）：守卒只有体态口音——认出来的底子极低（5%），戴面具近乎白走（×0.1）；
//      画像档（脸进过画影册）：城门洞里贴着画影图形——35% 起步，恶名越响越容易中，
//      易容只减半不到（×0.45）——脸被看到过，就很麻烦；
//   ③ 被认出 → 挡在城门外（人进不去，得另想办法；主步行路径 travelToCityFromList 在 enterCity 返回后
//      才结脚程账，挡下不白扣钱——DES-10 同口径）：塞钱买通（赏金越高越难买）/ 夜里翻墙
//      （摔伤、火把照脸——脸没进画影册的，这一摔可能就进了）/ 掉头走人，三条路自己挑；
//   ④ 买通翻墙各给一张当日当城的「过关条」（运行时票，不落档）——重新进城不再拦第二次，
//      但票只此一张：出了城再回来，守卒换了班，照查。
// 口径：热度走 NpcCrime.addHeat 正门（翻墙失手火把照脸 = faceSeen:true，v26.0 同一条铁律）；
//   灵石铜钱走 RewardService；时辰走 advanceTime；城门进出计数落 StateRegistry 'cityGate' 正门。
(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    var TUNE = {
        TAX_COPPER: 2,              // 入城钱（穷则白眼放行）
        TRAIT_SPOT: 0.05,           // 特质档：守卒只有体态口音
        PORTRAIT_SPOT: 0.35,        // 画像档：城门洞贴着画影图形
        NOTO_MUL: 1 / 120,          // 恶名放大（Disguise.TUNE.SPOT_NOTO_MUL 同款）
        MASK_PORTRAIT_MUL: 0.45,    // 画像档戴面具：减半不到（Disguise.TUNE.HUNTER_MASK_FACE 同款口径）
        MASK_TRAIT_MUL: 0.1,        // 特质档戴面具：近乎白走（HUNTER_MASK_BLIND 同款口径）
        SPOT_HEAT: 2,               // 被城门认出的热度
        BRIBE_STONES: 30,           // 塞给门卒的灵石
        BRIBE_P_MIN: 0.35, BRIBE_P_MAX: 0.95, BRIBE_BOUNTY_DIV: 300,  // 买通率 = clamp(0.9 − 赏金/300)
        BRIBE_FAIL_HEAT: 1,         // 钱收了人没放行，还把你多看了一眼
        WALL_MIN: 60,               // 翻墙要一个时辰
        WALL_FAIL_P: 0.30,          // 失手率
        WALL_INJURY_P: 0.25,        // 翻成了也可能擦伤
        WALL_SUCCESS_HEAT: 1,       // 城头有个影子——城里多了点风声（没人看清脸）
        WALL_FAIL_HEAT: 2,          // 火把照了个正脸
        INJURY_HP_FRAC: 0.15        // 摔伤按气血上限的一成半
    };

    var _st = { refused: 0, bribed: 0, bribesBurned: 0, walled: 0, wallFalls: 0, taxPaid: 0 };
    var _pass = null;            // 运行时过关条 {city, day}——只此一张，用掉即销
    var _refusedCity = '';       // 运行时：被挡下的那座城（对话框三路按钮要用）

    // ============ 小工具（黑道账同款口径） ============
    function cd() { return window.currentCharData || null; }
    function say(m, t) { try { if (window.showMessage) window.showMessage(m, t || 'info'); } catch (e) { return false; } return true; }
    function log(m, t) { try { if (window.gameLog && window.gameLog.add) window.gameLog.add(m, t || 'info'); } catch (e) { return false; } return true; }
    function absDay() {
        try {
            if (window.WorldCalendar && typeof window.WorldCalendar.day === 'number' && window.WorldCalendar.day > 0) return Math.floor(window.WorldCalendar.day);
            if (typeof window.getAbsoluteDay === 'function') { var g = window.getAbsoluteDay(); if (g) return Math.floor(g); }
            if (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') { var t = window.timeSystem.getAbsoluteDay(); if (t) return Math.floor(t); }
        } catch (e) { console.warn('[静默失败] js/city-facilities/city-gate.js · absDay：日历没读出来，过关条按零日算', e && e.message); return 0; }
        return 0;
    }
    function norm(s) { return String(s || '').replace(/\s+/g, ''); }
    function settle(spec, source) {
        try {
            if (window.RewardService && typeof window.RewardService.apply === 'function') {
                var r = window.RewardService.apply(spec, { facilitySpend: true, source: source || '城门', city: _refusedCity || '' });
                return { ok: !!(r && r.success !== false), note: r && r.messages ? r.messages.join('、') : '' };
            }
        } catch (e) { console.warn('[静默失败] js/city-facilities/city-gate.js · settle：这笔账没落成一笔', e && e.message); }
        return { ok: false, note: '' };
    }
    function advance(min, why) {
        try { if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') window.timeSystem.advanceTime(min, why); } catch (e) { console.warn('[静默失败] js/city-facilities/city-gate.js · advance：时辰没扣成', e && e.message); }
    }
    function deed(mood, s) {
        try { if (typeof window.playerPushDeed === 'function') window.playerPushDeed(mood, s); } catch (e) { console.warn('[静默失败] js/city-facilities/city-gate.js · deed：风声没递进传闻池', e && e.message); }
    }
    function refresh() {
        try { if (window.updateCharacterStatus) window.updateCharacterStatus(); } catch (e) { console.warn('[静默失败] js/city-facilities/city-gate.js · refresh：面板没刷新', e && e.message); }
        try { if (typeof window.updateCurrencyUI === 'function') window.updateCurrencyUI(); } catch (e2) { console.warn('[静默失败] js/city-facilities/city-gate.js · refresh：钱袋没刷新', e2 && e2.message); }
    }
    function notoNow() { var c = cd(); return c ? (Number(c.notoriety) || 0) : 0; }
    function tierNow() {
        try { if (window.NpcCrime && typeof window.NpcCrime.wantedTier === 'function') return String(window.NpcCrime.wantedTier() || 'none'); } catch (e) { console.warn('[静默失败] js/city-facilities/city-gate.js · tierNow：通缉档没问出来，按没案底算', e && e.message); }
        return 'none';
    }
    function bountyNow() {
        try { if (window.NpcCrime && typeof window.NpcCrime.bounty === 'function') return Number(window.NpcCrime.bounty()) || 0; } catch (e) { console.warn('[静默失败] js/city-facilities/city-gate.js · bountyNow：赏金没问出来，按零算', e && e.message); }
        return 0;
    }
    function faceKnown() {
        try { if (window.NpcCrime && typeof window.NpcCrime.faceKnown === 'function') return !!window.NpcCrime.faceKnown(); } catch (e) { console.warn('[静默失败] js/city-facilities/city-gate.js · faceKnown：画影册没问出来，按没露过脸算', e && e.message); }
        return false;
    }
    function addHeat(n, why, opts) {
        try { if (window.NpcCrime && typeof window.NpcCrime.addHeat === 'function') window.NpcCrime.addHeat(n, why, opts); } catch (e) { console.warn('[静默失败] js/city-facilities/city-gate.js · addHeat：这笔风声没记上官府的账', e && e.message); }
    }
    function masked() {
        try { if (window.Disguise && typeof window.Disguise.active === 'function') return !!window.Disguise.active(); } catch (e) { console.warn('[静默失败] js/city-facilities/city-gate.js · masked：脸上有没有面具没问出来，按素脸算', e && e.message); }
        return false;
    }
    function hurt(frac) {
        var c = cd();
        if (!c) return 0;
        var maxHp = Number(c.maxHealth) || 100;
        var dmg = Math.max(1, Math.round(maxHp * frac));
        c.health = Math.max(1, (Number(c.health) || maxHp) - dmg);
        return dmg;
    }

    // 认出率（明账——牌面上就说给玩家听）：底档 × 恶名放大 × 面具折扣
    function spotP(tier, isMasked) {
        var base = tier === 'portrait' ? TUNE.PORTRAIT_SPOT : tier === 'trait' ? TUNE.TRAIT_SPOT : 0;
        if (base <= 0) return 0;
        var mul = isMasked ? (tier === 'portrait' ? TUNE.MASK_PORTRAIT_MUL : TUNE.MASK_TRAIT_MUL) : 1;
        return base * (1 + notoNow() * TUNE.NOTO_MUL) * mul;
    }
    function bribeP() {
        return Math.max(TUNE.BRIBE_P_MIN, Math.min(TUNE.BRIBE_P_MAX, 0.9 - bountyNow() / TUNE.BRIBE_BOUNTY_DIV));
    }

    // ============ 城门总闸（enterCity 落位置之前调它；false = 挡在门外） ============
    function gateCheck(cityName, rng) {
        var cty = norm(cityName);
        // 过关条：当日当城用掉即销——买通/翻墙进来的这一趟不再拦、也不再收税
        if (_pass && _pass.city === cty && _pass.day === absDay()) { _pass = null; return true; }
        var c = cd();
        if (!c) return true;
        var tier = tierNow();
        if (tier !== 'none') {
            var p = spotP(tier, masked());
            var r = (typeof rng === 'function') ? rng() : Math.random();
            if (r < p) { refuse(cty, tier); return false; }
        }
        // 入城钱：穷不硬卡——门卒白眼放行，账上不装看不见
        var tax = settle({ copper: -TUNE.TAX_COPPER }, '入城钱');
        if (tax.ok) _st.taxPaid += 1;
        else log('🏯 ' + cty + '城门口的门卒伸手要 ' + TUNE.TAX_COPPER + ' 铜钱入城钱，掏遍全身没有——门卒白了你一眼，挥手放你进去（穷酸样不像作奸犯科，官府不记这笔账）。', 'info');
        // v27.4 黑道批：夹带私货过城门——过关那一下搜一票（CrimeWorks 守卫接线；账不在位/身上没货就静默放行。
        // 买通/翻墙进来的过关条在上面早返回了——守卒收了钱/没惊动人，这一趟不搜，这是明账）
        try {
            if (window.CrimeWorks && typeof window.CrimeWorks.gateContraband === 'function') window.CrimeWorks.gateContraband(cty);
        } catch (eS) { console.warn('[静默失败] js/city-facilities/city-gate.js · gateCheck：夹带的账没走成——货还在身上', eS && eS.message); }
        return true;
    }

    // ============ 被认出：挡在城门外 ============
    function refuse(cty, tier) {
        _st.refused += 1;
        _refusedCity = cty;
        addHeat(TUNE.SPOT_HEAT, '城门被认出', { faceSeen: tier === 'portrait' });
        deed('bad', '你在' + cty + '城门口被守卒对着通缉册认了出来，当场拒入——城门口围了一圈看热闹的');
        log('🏯 城门洞里，守卒拿你的脸（' + (tier === 'portrait' ? '画影图形就贴在城门洞——一眼就中' : '只有体态口音——偏偏今天对上了') + '）和通缉册比对半晌，猛地按住了刀：「就是你！城门不许进！」看热闹的人围拢过来。（热度+' + TUNE.SPOT_HEAT + '）', 'danger');
        say('🏯 你被挡在' + cty + '城门外——守卒认出了你。（热度+' + TUNE.SPOT_HEAT + '）', 'error');
        refresh();
        openRefusedDialog();
    }

    // ============ 城门外三条路 ============
    function openRefusedDialog() {
        var cty = _refusedCity;
        if (!cty) { say('城门口的对峙已经散了。', 'info'); return false; }
        var btn = 'class="w-full p-3 rounded mb-2 text-left text-sm text-white hover:opacity-90"';
        var html = '<p class="text-sm text-gray-400 mb-2">守卒按着刀，城门口的杆子放了下来。围观的人越聚越多——你只有三条路：</p>' +
            '<button onclick="window.CityGate.bribe()" ' + btn.replace('p-3', 'bg-amber-900 p-3') + '>💰 塞钱买通（' + TUNE.BRIBE_STONES + ' 灵石 · 买通率 ' + Math.round(bribeP() * 100) + '%——赏金越高越难买 · 钱收了没办成也不退）</button>' +
            '<button onclick="window.CityGate.wall()" ' + btn.replace('p-3', 'bg-slate-800 p-3') + '>🧗 等天黑翻墙（' + TUNE.WALL_MIN + ' 分钟 · 失手率 ' + Math.round(TUNE.WALL_FAIL_P * 100) + '%——火把照脸' + (faceKnown() ? '（你的脸早已在册，照不照都麻烦）' : '（你的脸还没进画影册——照个正脸可就进了）') + ' · 摔伤按气血上限一成半）</button>' +
            '<button onclick="window.CityGate.leave()" ' + btn.replace('p-3', 'bg-gray-700 p-3') + '>🚶 掉头走人（趁还没人拿你，离开这是非之地）</button>' +
            '<p class="text-[11px] text-gray-500 mt-1">买通翻墙都只给一张当日当城的过关条——出了城再回来，守卒换了班，照查。</p>';
        if (typeof window.showBuildingEffectDialog === 'function') {
            window.showBuildingEffectDialog('🏯 城门口 · 被拒入城 · ' + cty, html);
            return true;
        }
        return false;
    }

    function grantPass(how) {
        _pass = { city: _refusedCity, day: absDay() };
        var cty = _refusedCity;
        _refusedCity = '';
        try {
            if (window.locationSystem && typeof window.locationSystem.enterCity === 'function') {
                window.locationSystem.enterCity(cty);
                return true;
            }
        } catch (e) { console.warn('[静默失败] js/city-facilities/city-gate.js · grantPass：' + how + '成了，人却没能重新递到城门口', e && e.message); }
        say('🏯 ' + how + '是成了，可进城的路没接上——再走一趟试试。', 'warning');
        _pass = null;
        return false;
    }

    // ① 塞钱买通
    function bribe(rng) {
        var cty = _refusedCity;
        if (!cty) { say('你不在城门口。', 'info'); return false; }
        var pay = settle({ spiritStones: -TUNE.BRIBE_STONES }, '买通门卒');
        if (!pay.ok) { say('🏯 你摸不出 ' + TUNE.BRIBE_STONES + ' 灵石——门卒嗤笑一声：「穷鬼也敢学人走城门？」（钱没花出去，路也没通）', 'warning'); return false; }
        var p = bribeP();
        var r = (typeof rng === 'function') ? rng() : Math.random();
        if (r < p) {
            _st.bribed += 1;
            log('🏯 你借着人流，把 ' + TUNE.BRIBE_STONES + ' 灵石塞进门卒袖口。他掂了掂，眼皮都没抬：「认错人了——进去吧。」杆子抬了起来。（当日当城过关条一张）', 'success');
            say('🏯 门卒收了钱，装作没认出你——进城。（' + TUNE.BRIBE_STONES + ' 灵石）', 'success');
            refresh();
            return grantPass('买通');
        }
        _st.bribesBurned += 1;
        addHeat(TUNE.BRIBE_FAIL_HEAT, '买通门卒不成', { faceSeen: faceKnown() });
        log('🏯 门卒捏着灵石端详你半晌，忽然扬声：「弟兄们——通缉册上这位还想买路！」钱进了他的袖子，人没放进去，还惹得城门四下都多看了你几眼。（−' + TUNE.BRIBE_STONES + ' 灵石，热度+' + TUNE.BRIBE_FAIL_HEAT + '，钱不退——这是明账）', 'danger');
        say('🏯 买通不成——灵石喂了狗，守卒反倒把你盯得更紧了。（热度+' + TUNE.BRIBE_FAIL_HEAT + '）', 'error');
        refresh();
        openRefusedDialog();
        return false;
    }

    // ② 等天黑翻墙
    function wall(rng) {
        var cty = _refusedCity;
        if (!cty) { say('你不在城门口。', 'info'); return false; }
        advance(TUNE.WALL_MIN, '绕到城墙根等天黑');
        var roll = (typeof rng === 'function') ? rng() : Math.random();
        if (roll < TUNE.WALL_FAIL_P) {
            // 失手：城头火把照了个正脸
            _st.wallFalls += 1;
            var dmg = hurt(TUNE.INJURY_HP_FRAC);
            addHeat(TUNE.WALL_FAIL_HEAT, '翻墙失手被火把照脸', { faceSeen: true });
            deed('bad', '你夜里翻' + cty + '城墙失手摔了下来，城头火把照了个正脸——巡夜的都记住了这张脸');
            log('🏯 你摸到城墙根，趁着夜色攀上去——城头一声断喝，火把齐刷刷照过来！你脚下一松摔进护城的浅沟里，爬起来就跑。（气血−' + dmg + '，热度+' + TUNE.WALL_FAIL_HEAT + '，脸被照了个正着——' + (faceKnown() ? '画影册上又添了一笔' : '你的脸从此进了画影册') + '）', 'danger');
            say('🏯 翻墙失手——火把照脸，摔进浅沟。（气血−' + dmg + '，热度+' + TUNE.WALL_FAIL_HEAT + '，脸进画影册了）', 'error');
            refresh();
            openRefusedDialog();
            return false;
        }
        // 翻成了：也可能擦伤；城头有个影子——风声一点点（没人看清脸，不记 faceSeen）
        _st.walled += 1;
        var graze = Math.random() < TUNE.WALL_INJURY_P;
        var gd = 0;
        if (graze) gd = hurt(0.05);
        addHeat(TUNE.WALL_SUCCESS_HEAT, '夜里翻墙进城');
        log('🏯 你从城墙背阴处翻了过去，落在一条窄巷里。城头似乎有个影子扫过——但没人喊。（热度+' + TUNE.WALL_SUCCESS_HEAT + (graze ? '，落地时崴了一下，气血−' + gd : '，落地无声') + '；当日当城过关条一张）', 'success');
        say('🏯 翻墙进了城——落在窄巷里，没人看清你。' + (graze ? '（崴了下脚，气血−' + gd + '）' : ''), 'success');
        refresh();
        return grantPass('翻墙');
    }

    // ③ 掉头走人
    function leave() {
        var cty = _refusedCity;
        _refusedCity = '';
        log('🏯 你压低了斗笠，趁围观的人还没挤拢，退出人群往回走。' + (cty ? cty + '的城门' : '城门') + '在身后缓缓落下了杆子——这条路，眼下是走不通了。', 'info');
        say('🏯 你掉头离开了城门口。', 'info');
        return true;
    }

    // ============ 存读档（StateRegistry 正门；过关条是运行时票，不落档） ============
    function _export() { return JSON.parse(JSON.stringify(_st)); }
    function _import(d) {
        var s = { refused: 0, bribed: 0, bribesBurned: 0, walled: 0, wallFalls: 0, taxPaid: 0 };
        if (d && typeof d === 'object') {
            for (var k in s) {
                if (Number.isFinite(Number(d[k]))) s[k] = Math.max(0, Math.floor(Number(d[k])));
            }
        }
        _st = s;
        _pass = null;
        _refusedCity = '';
    }
    function _reset() { _st = { refused: 0, bribed: 0, bribesBurned: 0, walled: 0, wallFalls: 0, taxPaid: 0 }; _pass = null; _refusedCity = ''; }
    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        window.StateRegistry.register('cityGate', { version: 1, export: _export, import: _import, reset: _reset });
    }

    window.CityGate = {
        TUNE: TUNE,
        gateCheck: gateCheck, spotP: spotP, bribeP: bribeP,
        refuse: refuse, bribe: bribe, wall: wall, leave: leave,
        openRefusedDialog: openRefusedDialog,
        refusedCity: function () { return _refusedCity; },
        state: _export
    };
    window.openCityGateLedger = function () { return openRefusedDialog(); };
})();
