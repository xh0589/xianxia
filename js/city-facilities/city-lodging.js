// ==================== 第七十一波 · 城里赁屋落脚（客栈是过路的地方，不是过日子的地方） ====================
// 跑江湖的人进城永远住客栈按天结账——铜钱流水一样出去，推门是别人的门。本账把「家」开出来：
// 有客栈的城里可以赁一处落脚（栈舍厢房/街边小院），按月缴租，住在赁屋的城里：
//   ①心有所寄——每日晨间心境小涨，抵消行脚把心气磨回常人底色的那笔账（六十七波的回落，有家的人落得慢）；
//   ②回屋歇脚——打个盹免费回精力（安寝一宿还是客栈的买卖，小憩是自己的床）。
// 纪律：①租钱按月真扣（统一结算原子入账），缴不出就退租挪窝——房东不赊账，如实搬家；
//       ②货账是 cd._lodging 单字段（押镖 _escort、贩货 _peddler 同款先例），读档归一化——坏账当没赁过；
//       ③零骰、零悟道点、灵石只出不进（赁屋是花钱的去处，不是营生路）；
//       ④一人只有一处家——想换城赁屋，先退租。
(function () {
    'use strict';

    var TIERS = {
        side: {
            key: 'side', name: '栈舍厢房', icon: '🏠',
            rent: 30, morning: 2, napEnergy: 30, napMin: 60,
            desc: '客栈后院的长包厢房。掌柜的熟脸，街坊的熟路——月钱三十灵石。'
        },
        court: {
            key: 'court', name: '街边小院', icon: '🏡',
            rent: 80, morning: 3, napEnergy: 40, napMin: 60,
            desc: '一进的小院，有自己的门、自己的灶。推门不用看人脸色——月钱八十灵石。'
        }
    };
    var MONTH_DAYS = 30;

    // ============ 小工具 ============
    function cd() { return window.currentCharData || null; }
    function say(m, t) { try { if (window.showMessage) window.showMessage(m, t || 'info'); } catch (e) {} }
    function log(m, t) { try { if (window.gameLog && window.gameLog.add) window.gameLog.add(m, t || 'info'); } catch (e) {} }
    function city() {
        return (cd() && cd().location) ||
            (typeof window.getCurrentCityName === 'function' && window.getCurrentCityName()) || '';
    }
    function absDay() {
        try {
            if (window.WorldCalendar && typeof window.WorldCalendar.day === 'number' && window.WorldCalendar.day > 0) return Math.floor(window.WorldCalendar.day);
            if (typeof window.getAbsoluteDay === 'function') { var g = window.getAbsoluteDay(); if (g) return Math.floor(g); }
            if (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') { var t = window.timeSystem.getAbsoluteDay(); if (t) return Math.floor(t); }
        } catch (e) {}
        return 0;
    }
    // 有客栈的城才赁得到屋（仙山佛窟没有客栈，自然也没有长租房）
    function innCityOk(ct) {
        try {
            var d = window.locationSystem && window.locationSystem.getCityData && window.locationSystem.getCityData(ct || city());
            return !!(d && d.buildings && d.buildings.indexOf('inn') >= 0);
        } catch (e) { return false; }
    }
    // 第七十四波·市井有脸：立契的牙人、隔壁的街坊（花名册按城定死；缺册退回无名老话）
    function faceAddr(role, ct) {
        try {
            if (window.CityFaces && typeof window.CityFaces.face === 'function') {
                var f = window.CityFaces.face(ct || city(), role);
                if (f) return f.addr;
            }
        } catch (e) {}
        return '';
    }
    function settle(spec) {
        try {
            if (window.RewardService && typeof window.RewardService.apply === 'function') {
                var r = window.RewardService.apply(spec, { source: '赁屋', city: city() });
                return { ok: !!(r && r.success !== false), note: r && r.messages ? r.messages.join('、') : '' };
            }
        } catch (e) {}
        return { ok: false, note: '' };
    }
    function spendTime(min, why) {
        try { if (window.timeSystem && window.timeSystem.advanceTime) window.timeSystem.advanceTime(min, why); else if (window.advanceTime) window.advanceTime(min, why); } catch (e) {}
    }
    function refresh() { try { if (window.updateCharacterStatus) window.updateCharacterStatus(); } catch (e) {} }

    // ============ 赁约（cd._lodging 单字段，归一化只认不补写） ============
    function ledger() {
        var c = cd();
        if (!c) return null;
        var v = c._lodging;
        if (!v || typeof v !== 'object') return null;
        if (typeof v.city !== 'string' || !v.city) return null;
        if (!TIERS[v.tier]) return null;
        if (!isFinite(Number(v.signedDay)) || !isFinite(Number(v.nextDueDay))) return null;
        return v;
    }
    function tier() { var l = ledger(); return l ? TIERS[l.tier] : null; }
    function atHome() { var l = ledger(); return !!(l && l.city === city()); }
    function daysToDue() {
        var l = ledger();
        if (!l) return 0;
        var d = absDay();
        return d > 0 ? Math.max(0, Number(l.nextDueDay) - d) : 0;
    }

    // ============ 签约 ============
    function sign(tierKey) {
        var t = TIERS[tierKey];
        if (!t) { say('没有这种屋子。', 'warning'); return false; }
        if (ledger()) { say('🏠 你已经赁着屋了——一人只有一处家，想换地方先退租。', 'info'); return false; }
        var ct = city();
        if (!ct || !innCityOk(ct)) { say('🏠 这地界没有客栈，也就没有长租的屋——仙山之上没人做这门生意。', 'info'); return false; }
        var r = settle({ spiritStones: -t.rent });
        if (!r.ok) { say('🏠 ' + t.name + '头一个月租钱 ' + t.rent + ' 灵石——你摸遍荷包没凑出来，' + (faceAddr('broker', ct) || '牙人') + '也不催，只把契书收了回去。', 'warning'); return false; }
        var d = absDay();
        cd()._lodging = { city: ct, tier: tierKey, signedDay: d, nextDueDay: d > 0 ? d + MONTH_DAYS : 0 };
        var broker = faceAddr('broker', ct), nb = faceAddr('neighbor', ct);
        log('🏠 你在' + ct + '赁下了' + t.name + '：月钱 ' + t.rent + ' 灵石，头一个月缴讫。推门是自己的门了。' +
            (broker ? '立契的' + broker + '把契书推过来' : '') + (nb ? (broker ? '，' : '立契毕，') + '隔壁住着' + nb + '——往后就是街坊了。' : (broker ? '。' : '')), 'success');
        refresh();
        render();
        return true;
    }

    // ============ 退租（当月租钱不退——契书上写明的） ============
    function quit() {
        var l = ledger();
        if (!l) { say('🏠 你没赁屋。', 'info'); return false; }
        var t = TIERS[l.tier];
        cd()._lodging = null;
        log('🏠 你退掉了' + l.city + '的' + t.name + '。当月的租钱不退——契书上写明的，' + (faceAddr('broker', l.city) || '牙人') + '收屋收得客客气气。', 'info');
        refresh();
        render();
        return true;
    }

    // ============ 月钱（跨日自动扣；缴不出就退租挪窝） ============
    function processDue() {
        var l = ledger();
        if (!l) return;
        var d = absDay();
        if (!d || Number(l.nextDueDay) <= 0) return;   // 没有真钟的日子不催租（也不白送——到期日无从算起）
        if (d < Number(l.nextDueDay)) return;
        var t = TIERS[l.tier];
        var r = settle({ spiritStones: -t.rent });
        if (r.ok) {
            l.nextDueDay = Number(l.nextDueDay) + MONTH_DAYS;
            log('🏠 ' + t.name + '的月钱到期，缴讫 ' + t.rent + ' 灵石。', 'info');
            return;
        }
        cd()._lodging = null;
        log('🏠 ' + t.name + '的月钱到期——你凑不出 ' + t.rent + ' 灵石。' + (faceAddr('broker', l.city) || '牙人') + '上门收了屋：「客官，不是我们不讲情面，房东也要吃饭。」你搬了出来。', 'warning');
        say('🏠 缴不出月钱，' + l.city + '的' + t.name + '被收了屋。', 'warning');
    }

    // ============ 晨间（住在自己赁的城里，心气落得慢） ============
    function morning() {
        var l = ledger();
        if (!l || l.city !== city()) return;   // 人在外头，屋空着——租金照缴，心气没人接
        var t = TIERS[l.tier];
        settle({ mood: t.morning });
    }

    // ============ 回屋歇脚（打个盹：免费、费时、回精力——安寝一宿仍是客栈的买卖） ============
    function nap() {
        var l = ledger();
        if (!l) { say('🏠 你没赁屋——客栈的床是按夜算钱的。', 'info'); return false; }
        if (l.city !== city()) { say('🏠 你的家在' + l.city + '——这儿没你的床。', 'info'); return false; }
        var t = TIERS[l.tier];
        var c = cd();
        var maxE = Number(c.maxEnergy) || 100;
        if (Number(c.energy) >= maxE) { say('🏠 精神正足，躺下也睡不着——不如去做点正事。', 'info'); return false; }
        c.energy = Math.min(maxE, Number(c.energy) + t.napEnergy);
        spendTime(t.napMin, '回屋打盹');
        refresh();
        say('🏠 你回屋打了个盹。自己的床睡得踏实——精力+' + t.napEnergy + '。', 'success');
        render();
        // 第九十五波·NEW-35：盹醒来这一觉就算完——流程终点软收面板（旧版窗留着，牌面停在打盹前）
        try { if (typeof window.closeModalSoft === 'function') window.closeModalSoft(); } catch (e) {}
        return true;
    }

    // ============ 跨日总账（月钱在前、晨间在后——被收屋的当天不再送心气） ============
    function onNewDay() {
        try { processDue(); } catch (e1) {}
        try { morning(); } catch (e2) {}
    }
    try {
        if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') window.timeSystem.onNewDaySubscribe(onNewDay);
    } catch (eSub) {}

    // ============ 面板与弹窗 ============
    function panelHtml(cityName) {
        try {
            if (!innCityOk(cityName)) return '';
            if (cityName && city() && cityName !== city()) return '';
            var l = ledger();
            var line;
            if (l && l.city === (cityName || city())) {
                var t = TIERS[l.tier];
                line = t.icon + ' ' + t.name + '（月钱 ' + t.rent + ' 灵石' + (daysToDue() > 0 ? '，还有 ' + daysToDue() + ' 天到期' : '') + '）';
            } else if (l) {
                line = '🏠 家在' + l.city + '——人在外头，屋空着，租金照缴';
            } else {
                line = '🏠 赁一处落脚（客栈是过路的地方，不是过日子的地方）';
            }
            return '<div class="p-2 bg-emerald-900/20 rounded border border-emerald-800/50">' +
                '<button onclick="CityLodging.open()" class="w-full text-left text-sm text-emerald-300 hover:text-emerald-200">' + line + '</button>' +
                '</div>';
        } catch (e) { return ''; }
    }

    function render() {
        var l = ledger();
        var html = '';
        if (l) {
            var t = TIERS[l.tier];
            var home = l.city === city();
            html += '<p class="text-sm text-gray-300 mb-2">' + t.icon + ' 你在<b class="text-emerald-300">' + l.city + '</b>赁着' + t.name + '。</p>' +
                '<p class="text-xs text-gray-500 mb-3">月钱 ' + t.rent + ' 灵石（到期自动缴' + (daysToDue() > 0 ? '，还有 ' + daysToDue() + ' 天' : '') + '）。' +
                (home ? '住在家里，每日晨间心境+' + t.morning + '——行脚磨心气，有家的人落得慢。' : '人不在' + l.city + '，屋空着——租金照缴，晨间的心境没人接。') + '</p>';
            var brokerR = faceAddr('broker', l.city), nbR = faceAddr('neighbor', l.city);
            if (brokerR || nbR) {
                html += '<p class="text-xs text-gray-600 mb-3">' + (brokerR ? '立契牙人：' + brokerR : '') + (brokerR && nbR ? ' · ' : '') + (nbR ? '隔壁街坊：' + nbR : '') + '</p>';
            }
            if (home) html += '<button onclick="CityLodging.nap()" class="w-full p-3 rounded mb-2 text-left text-sm bg-emerald-800 hover:bg-emerald-700 text-white">😴 回屋打个盹（免费 · 半个时辰 · 精力+' + t.napEnergy + '）</button>';
            html += '<button onclick="CityLodging.quit()" class="w-full p-3 rounded mb-2 text-left text-sm bg-gray-700 hover:bg-gray-600 text-white">📜 退租（当月租钱不退——契书上写明的）</button>';
        } else {
            var ct = city();
            if (!innCityOk(ct)) {
                html += '<p class="text-sm text-gray-400 mb-3">这地界没有客栈，也没人做长租的生意。</p>';
            } else {
                html += '<p class="text-sm text-gray-300 mb-3">牙人把两把钥匙摆在柜上：「客官长住？' + ct + '的屋，按月结账。」</p>';
                for (var k in TIERS) {
                    var t2 = TIERS[k];
                    html += '<button onclick="CityLodging.sign(\'' + t2.key + '\')" class="w-full p-3 rounded mb-2 text-left text-sm bg-emerald-900 hover:bg-emerald-800 text-white">' +
                        t2.icon + ' ' + t2.name + '（月钱 ' + t2.rent + ' 灵石 · 晨间心境+' + t2.morning + ' · 打盹精力+' + t2.napEnergy + '）' +
                        '<span class="block text-xs text-gray-400 mt-1">' + t2.desc + '</span></button>';
                }
                html += '<p class="text-[11px] text-gray-500 mt-1">头一个月签约即缴；到期自动续缴，缴不出就收屋。一人只有一处家。</p>';
            }
        }
        if (typeof window.showModal === 'function') window.showModal('🏠 赁屋落脚', html);
    }
    function open() { render(); return true; }

    window.CityLodging = {
        TIERS: TIERS,
        MONTH_DAYS: MONTH_DAYS,
        ledger: ledger,
        atHome: atHome,
        innCityOk: innCityOk,
        daysToDue: daysToDue,
        sign: sign,
        quit: quit,
        nap: nap,
        morning: morning,
        processDue: processDue,
        onNewDay: onNewDay,
        panelHtml: panelHtml,
        open: open,
        render: render
    };
    window.openCityLodging = function () { return open(); };
})();
