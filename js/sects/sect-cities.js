// ==================== sect-cities.js - 城市香火护持 + 分舵（方案四A · 仙凡分治） ====================
// 天子管凡人，仙门管香火。城市不归门派「占领」——城主理政照旧，门派争的是「香火护持」：
//   城请谁护佑、香火供奉送谁家、城门楼上挂谁的幡。
// 帝都长安朝廷直辖永不可争（只可「御许」立分舵）；凡俗八城初始按地理发牌，护持是活账可易主；
// 仙家胜地与灵魔界无主，不入世争。分舵只能立在本门护持的城——争下城来才有资格伸手。
// 守恒：城税/分舵汇银真入公库，立舵真扣灵石真调人，夺幡/麻烦/枯城全有真代价；全走编年/街谈/日志。
(function () {
    'use strict';
    var W = window;

    var MUNDANE = ['洛水城', '青木城', '炎城', '大漠孤城', '冰原城', '万毒谷', '金城', '剑阁'];
    var INIT_PATRON = {
        '洛水城': '大旗门', '青木城': '药王谷', '炎城': '铸剑山庄', '冰原城': '天山派',
        '万毒谷': '五仙教', '金城': '昆仑派', '大漠孤城': '天龙教'
        // 剑阁：剑修圣地，幡杆空着——开局就是争夺热点
    };
    var CAPITAL = '帝都·长安';

    function ds() { return W.discipleState || null; }
    function cd() { return W.currentCharData || null; }
    function flags() { return (W.eventFlags = W.eventFlags || {}); }
    // 第九波·总账根治：timeSystem.totalDays 在生产里根本不存在，旧钟恒 0——争城结算/城税/AI 争城全是死代码。
    // 统一优先真钟 getAbsoluteDay；旧字段只作测试沙箱的退路。
    function absDay() {
        try {
            if (typeof W.getAbsoluteDay === 'function') { var g = W.getAbsoluteDay(); if (g) return Math.floor(g); }
            var t = W.timeSystem;
            if (t) {
                if (typeof t.getAbsoluteDay === 'function') { var g2 = t.getAbsoluteDay(); if (g2) return Math.floor(g2); }
                if (t.gameTime && t.gameTime.currentDay) return Math.floor(t.gameTime.currentDay);
                if (t.totalDays) return Math.floor(t.totalDays);
            }
            if (W.WorldCalendar && W.WorldCalendar.day) return Math.floor(W.WorldCalendar.day);
        } catch (e) {}
        return 0;
    }
    function isPSect(n) { try { return !!(W.PSBoot && typeof W.PSBoot.isPlayerSect === 'function' && W.PSBoot.isPlayerSect(n)); } catch (e) { return false; } }
    function log(m, t) { try { if (W.gameLog && W.gameLog.add) W.gameLog.add(m); } catch (e) {} }
    function msg(m, t) { if (typeof W.showMessage === 'function') W.showMessage(m, t || 'info'); }
    function modal(t, b) { if (typeof W.showModal === 'function') W.showModal(t, b); }
    function para(t) { return '<p class="text-sm text-gray-300 leading-relaxed mb-2">' + t + '</p>'; }
    function btn(label, onclick, cls) { return '<button onclick="' + onclick + '" class="' + (cls || 'bg-yellow-700 hover:bg-yellow-600') + ' text-xs px-3 py-2 rounded text-left">' + label + '</button>'; }
    function btns(arr) { return '<div style="display:flex;flex-direction:column;gap:8px;margin-top:12px">' + arr.join('') + '</div>'; }
    function _close() { try { var ov = document.getElementById('xianxia-modal-overlay'); if (ov) ov.remove(); } catch (e) {} }
    function internal(sect) { return (W.SECT_INTERNAL && W.SECT_INTERNAL[sect]) || null; }
    function mySect() { try { var d = ds(); return d && d.isInSect ? (d.sectName || d.sectId) : null; } catch (e) { return null; } }
    // 第十七波：自家门庭有两处——入门派（弟子身）与自建宗门（掌门身）
    function builtSect() { try { return (W.PSectWorld && typeof W.PSectWorld.homeName === 'function') ? W.PSectWorld.homeName() : null; } catch (e) { return null; } }
    function homeSect() { return mySect() || builtSect(); }
    function playerName() { try { return (cd() || {}).name || '无名弟子'; } catch (e) { return '无名弟子'; } }
    function currentCity() {
        try { if (typeof W.getCurrentCityName === 'function' && W.getCurrentCityName()) return W.getCurrentCityName(); } catch (e) {}
        try { if (W.locationSystem && W.locationSystem.currentLocation) return W.locationSystem.currentLocation; } catch (e2) {}
        return '';
    }
    function chron(sect, text) {
        try { if (W.SectGov && W.SectGov.chronicle) { W.SectGov.chronicle(sect, text); return; } } catch (e) {}
        var it = internal(sect);
        if (!it) return;
        if (!it.chronicle) it.chronicle = [];
        it.chronicle.push({ day: absDay(), text: String(text) });
        if (it.chronicle.length > 40) it.chronicle.splice(0, it.chronicle.length - 40);
    }
    function street(text) {
        try {
            var f = flags();
            if (!f['qi_street'] || !f['qi_street'].push) f['qi_street'] = [];
            f['qi_street'].push({ day: absDay(), text: String(text) });
            if (f['qi_street'].length > 60) f['qi_street'].splice(0, f['qi_street'].length - 60);
        } catch (e) {}
    }
    function notifyHome(sect, text) {
        if (mySect() === sect) { log('🏯 ' + sect + '·' + text, 'info'); return; }
        // 第十七波：自建宗门的家书——写进宗门史，掌门在总册里看得见
        if (sect === builtSect()) {
            log('🏯 ' + sect + '·' + text, 'info');
            try { if (W.PSectWorld && W.PSectWorld.note) W.PSectWorld.note(sect, text); } catch (e) {}
        }
    }
    function tierOf(sect) { try { if (typeof W.sectPowerNow === 'function') { var p = W.sectPowerNow(sect); if (p) return p.tier; } } catch (e) {} return '中等'; }
    function alignOf(sect) { try { if (typeof W.sectAlignNow === 'function') { var a = W.sectAlignNow(sect); if (a) return a.align; } } catch (e) {} return 0; }
    function tierRank(t) { var L = ['巨擘', '大派', '中等偏上', '中等', '小派', '式微', '残破']; var i = L.indexOf(t); return i < 0 ? 3 : i; }
    function powerScore(sect) { try { if (typeof W.sectPowerNow === 'function') { var p = W.sectPowerNow(sect); if (p) return p.score; } } catch (e) {} return 150; }
    function addStonesToSect(sect, n) { var it = internal(sect); if (it) it.resources = (Number(it.resources) || 0) + n; }
    function hasStore(sect, kind, n) {
        var it = internal(sect);
        if (!it) return false;
        var v = kind === 'stone' ? it.resources : kind === 'material' ? it.material : kind === 'pill' ? it.pill : 0;
        return (Number(v) || 0) >= n;
    }
    function deduct(sect, kind, n) { try { if (W.SectGov && W.SectGov.deductStore) return W.SectGov.deductStore(sect, kind, n); } catch (e) {} return false; }
    function addC(n, r) { try { if (typeof W.sectAddContribution === 'function') return W.sectAddContribution(n, r); } catch (e) {} var d = ds(); if (d) d.contribution = (Number(d.contribution) || 0) + n; }

    // ============ 一 · 州府档案 ============
    function state() {
        var f = flags();
        if (!f['sect_city_state']) {
            var st = {};
            for (var i = 0; i < MUNDANE.length; i++) {
                var c = MUNDANE[i];
                var p = INIT_PATRON[c] || null;
                st[c] = { patron: p, hold: p ? (alignOf(p) <= -40 ? 50 : 60) : 0, branch: null, contest: null, lowMonths: 0, intro: 0 };
            }
            f['sect_city_state'] = st;
        }
        return f['sect_city_state'];
    }
    function citySt(city) { var st = state(); return st[city] || null; }
    W.sectCityInfo = function (city) {
        var st = citySt(city);
        if (!st) return city === CAPITAL ? { patron: '朝廷', capital: true } : null;
        return { patron: st.patron, hold: st.hold, branch: st.branch ? { day: st.branch.day, imperial: !!st.branch.imperial, half: (st.branch.halfUntil || 0) > absDay(), trouble: st.branch.trouble || null } : null, contest: st.contest };
    };
    W.sectCityPatrons = function (sect) {
        var out = [];
        var st = state();
        for (var c in st) { if (st[c].patron === sect) out.push({ city: c, hold: st[c].hold }); }
        return out;
    };
    // 势力分联动：每持一城+5，每座分舵+3（sect-standing computeScore 读这里）
    W.sectCityScoreBonus = function (sect) {
        var b = 0;
        var st = state();
        for (var c in st) {
            if (st[c].patron === sect) b += 5;
            if (st[c].branch && st[c].branch.sect === sect) b += st[c].branch.imperial ? 4 : 3;
        }
        return b;
    };
    function evilPatron(city) { var st = citySt(city); return st && st.patron && alignOf(st.patron) <= -40; }

    // ============ 二 · 进城见闻（一城一回） ============
    function cityIntro(city) {
        if (MUNDANE.indexOf(city) < 0 && city !== CAPITAL) return;
        var key = 'sect_city_intro_' + city;
        if (flags()[key]) return;
        flags()[key] = absDay();
        var st = citySt(city);
        if (city === CAPITAL) {
            log('🏮 长安城楼上是朝廷的龙幡——天子脚下，仙凡分治：俗务归官府，山上的事归山上。城里仙师不少，但没有哪家的幡敢挂上城头。（朝廷许可的分舵，在政事面板里有说法）', 'info');
            return;
        }
        if (!st) return;
        if (!st.patron) {
            log('🏮 「' + city + '」城头的幡杆空着——旧幡早被人摘了，几家的旗号在城里暗暗较劲。谁把香火拢起来，这城就认谁。（无主之城，政事面板可举幡）', 'info');
        } else if (evilPatron(city)) {
            log('🏮 「' + city + '」城头挂着「' + st.patron + '」的幡——城门口收两份钱，市声比别处低。茶棚里说话，都得先看看隔壁桌。（邪派护持：城不聊生，香火不稳）', 'warning');
        } else {
            log('🏮 「' + city + '」的城门楼上挂着「' + st.patron + '」的幡——香火护持归它，市井安稳，铺子门口都供着它家的小香炉。', 'info');
        }
    }
    try {
        var origEnter = W.enterCity;
        if (typeof origEnter === 'function' && !origEnter.__citiesWrapped) {
            W.enterCity = function (cityName) {
                var r = origEnter.apply(this, arguments);
                try { cityIntro(String(cityName || '').replace(/\s+/g, '')); } catch (e) {}
                try { troubleNotice(String(cityName || '').replace(/\s+/g, '')); } catch (e2) {}
                return r;
            };
            W.enterCity.__citiesWrapped = true;
        }
    } catch (e) {}

    // ============ 三 · 香火实事（护持是干出来的） ============
    W.sectCityDeed = function (city, delta, sect) {
        if (!city || MUNDANE.indexOf(city) < 0) return false;
        var st = citySt(city);
        if (!st) return false;
        if (st.contest && st.contest.sect === (sect || mySect())) {
            st.contest.boost = (Number(st.contest.boost) || 0) + (delta || 0);
            return true;
        }
        if (!st.patron) return false;
        st.hold = Math.max(0, Math.min(100, st.hold + (delta || 0)));
        if (alignOf(st.patron) <= -40 && st.hold > 70) st.hold = 70; // 邪派护持，人心不服，稳固有顶
        return true;
    };
    W.sectCityDeedAll = function (sect, delta) {
        var st = state();
        for (var c in st) { if (st[c].patron === sect) W.sectCityDeed(c, delta, sect); }
    };

    // ============ 四 · 举幡争夺 ============
    function startContest(city, sect, byPlayer) {
        var st = citySt(city);
        if (!st || st.contest) return false;
        if (st.patron === sect) return false;
        if (tierRank(tierOf(sect)) > 2) { if (byPlayer) msg('座次不到中等偏上，举幡没人应——先让门派强起来。', 'warning'); return false; }
        if (!st.patron) {
            // 无主之城：备下香火供案，三十日后看这城认不认
            if (byPlayer && !hasStore(sect, 'stone', 100)) { msg('举幡要备香火供案——公库灵石不足一百。', 'error'); return false; }
            if (byPlayer) deduct(sect, 'stone', 100);
            st.contest = { sect: sect, day: absDay(), resolveDay: absDay() + 30, boost: 0, player: !!byPlayer, open: true };
            chron(sect, '「' + sect + '」在' + city + '的空幡杆下摆开了香火供案——三十日后，这城认不认，见分晓。');
            if (byPlayer) { log('🚩 你的门派在' + city + '举幡了：幡杆空着，供案摆上了。三十日内给这城办成实事，城里人看在眼里，幡就立得稳。（政事面板可见进度）', 'success'); }
            return true;
        }
        if (byPlayer && !hasStore(sect, 'stone', 100)) { msg('举幡要备香火供案——公库灵石不足一百。', 'error'); return false; }
        if (byPlayer) deduct(sect, 'stone', 100);
        st.contest = { sect: sect, day: absDay(), resolveDay: absDay() + 30, boost: 0, player: !!byPlayer };
        chron(sect, '「' + sect + '」向' + city + '举幡，要与「' + st.patron + '」争这城的香火——三十日后，城主看两家谁更护得住这城。');
        notifyHome(st.patron, city + '的香火有人来争了——「' + sect + '」举幡，三十日后见分晓。');
        if (byPlayer) log('🚩 你的门派向' + city + '举幡了（现护持：' + st.patron + '）。三十日内在这城办成实事能压秤——政事面板可见进度。', 'success');
        if ((st.patron === mySect() || st.patron === builtSect()) && !byPlayer) log('🚩 ' + city + '城头有人举幡——「' + sect + '」要抢本门的香火护持。去城里办几件实事，幡就压得住。（政事面板可见进度）', 'warning');
        return true;
    }
    function resolveContest(city) {
        var st = citySt(city);
        if (!st || !st.contest) return;
        var ct = st.contest;
        st.contest = null;
        var atk = Math.floor(powerScore(ct.sect) / 10) + (Number(ct.boost) || 0) + Math.floor(Math.random() * 11);
        if (st.patron && alignOf(st.patron) <= -40 && alignOf(ct.sect) >= 40) atk += 10; // 替天行道，民心所向
        var def = st.patron ? Math.floor(st.hold / 5) + Math.floor(powerScore(st.patron) / 10) : -1;
        if (atk > def) {
            var old = st.patron;
            // 旧护持的分舵随幡一起拆
            if (st.branch) {
                var bit = internal(st.branch.sect);
                if (bit) { bit.disciples = (Number(bit.disciples) || 0) + (Number(st.branch.disciples) || 5); }
                chron(st.branch.sect, city + '易了主，分舵的幡被拆了下来——常驻的' + (st.branch.disciples || 5) + '名弟子收拾行装回山。');
                st.branch = null;
            }
            st.patron = ct.sect;
            st.hold = 45;
            st.lowMonths = 0;
            chron(ct.sect, city + '的城头换上了「' + ct.sect + '」的幡——城主捧出香火册：往后这城的供奉，送到贵山门。');
            street('茶棚里传开了：' + city + '城头换了幡，如今是「' + ct.sect + '」护持' + (old ? '——「' + old + '」的香炉，一夜之间撤了个干净。」' : '。'));
            if (old) notifyHome(old, city + '的香火断了——城头换了「' + ct.sect + '」的幡，门里少了一路进项。');
            if (ct.player) {
                if (isPSect(ct.sect)) {
                    // 第十七波：自建宗门的举幡功成——没有弟子贡献账，声望落宗门真账
                    try { if (W.PSectWorld) W.PSectWorld.gainRep(ct.sect, 5, '举幡功成·' + city + '香火归门'); } catch (eR) {}
                    try { if (W.currentCharData) W.currentCharData.fame = Math.min(99999, (W.currentCharData.fame || 0) + 3); } catch (e) {}
                    log('🚩 ' + city + '城头挂上了你自家宗门的幡！城主亲捧香火册上门——往后每月供奉入宗库，本门也能在这城里立分舵了。（宗门声望+5，名望+3）', 'success');
                } else {
                    addC(80, '举幡功成·' + city + '香火归门');
                    try { if (W.currentCharData) W.currentCharData.fame = Math.min(99999, (W.currentCharData.fame || 0) + 3); } catch (e) {}
                    log('🚩 ' + city + '城头挂上了本门的幡！城主亲捧香火册上山——往后每月供奉入公库，本门也能在这城里立分舵了。（贡献+80，名望+3）', 'success');
                }
            }
            notifyHome(ct.sect, city + '的香火归了本门——月供奉二十灵石入账，分舵可立。');
        } else {
            st.hold = Math.min(100, st.hold + 10);
            chron(ct.sect, city + '的幡没举起来——城主回书：「香火一事，贵派再积几年德。」');
            if (st.patron) chron(st.patron, '有人来' + city + '争香火，没争动——城里的香炉反倒擦得更亮了。（护持更稳）');
            if (ct.player) log('🚩 ' + city + '的幡没举起来。城主回书客气，话却不软：「香火一事，贵派再积几年德。」（供案的灵石打了水漂，护持方反倒更稳）', 'warning');
        }
    }

    // ============ 五 · 分舵（只能立在自家护持城） ============
    function buildBranch(city) {
        var sect = homeSect();
        var st = citySt(city);
        if (!sect || !st) return false;
        if (st.patron !== sect) { msg('分舵只能立在本门护持的城——先争下这城的香火。', 'warning'); return false; }
        if (st.branch) { msg('这城里已经有本门的分舵了。', 'info'); return false; }
        if ((Number(internal(sect).disciples) || 0) < 12) { msg('门里人手不够——调不出五个人常驻分舵。', 'error'); return false; }
        if (!hasStore(sect, 'stone', 200)) { msg('立舵要灵石二百置办宅院——公库不凑手。', 'error'); return false; }
        deduct(sect, 'stone', 200);
        var it = internal(sect);
        it.disciples = (Number(it.disciples) || 0) - 5;
        st.branch = { sect: sect, day: absDay(), disciples: 5, halfUntil: 0, trouble: null, mealMonth: 0 };
        chron(sect, city + '城里立起了「' + sect + '」的分舵——五名弟子常驻，宅院是城里最好的地段。伸出去的手，落下了第一枚子。');
        log('🏯 ' + city + '分舵立起来了：灵石二百置办宅院，五名弟子常驻（族谱活页记「外派分舵」）。往后每月汇银十五入公库；你到城里，分舵的门朝你开——领份例、听消息、落脚歇息。（政事面板有舵中事务）', 'success');
        return true;
    }
    function buildChanganBranch() {
        var sect = homeSect();
        if (!sect) return false;
        var st = state();
        if (!st[CAPITAL]) st[CAPITAL] = { patron: '朝廷', hold: 100, branch: null, contest: null, lowMonths: 0, intro: 0, capital: true };
        if (st[CAPITAL].branch) { msg('长安里已经有本门的分舵了。', 'info'); return false; }
        if (tierRank(tierOf(sect)) > 2) { msg('朝廷的门房看人下菜——座次不到中等偏上，递不进帖子。', 'warning'); return false; }
        if (alignOf(sect) < 40) { msg('朝廷只认体面人家——门派的立场还没到「正道所认」，鸿胪寺不收帖子。', 'warning'); return false; }
        if (!hasStore(sect, 'stone', 500)) { msg('御许的规费是灵石五百——公库不凑手。', 'error'); return false; }
        deduct(sect, 'stone', 500);
        var it = internal(sect);
        it.disciples = Math.max(0, (Number(it.disciples) || 0) - 5);
        st[CAPITAL].branch = { sect: sect, day: absDay(), disciples: 5, imperial: true, halfUntil: 0, trouble: null, mealMonth: 0 };
        chron(sect, '鸿胪寺发了文书——「' + sect + '」在长安立了御许分舵。天子脚下挂幡，天下人都看着。');
        log('🏮 长安的御许分舵立起来了：规费灵石五百，五名弟子常驻。每月汇银二十五入公库——帝都的香火，比哪座城都旺。（进城可在分舵领份例、听消息）', 'success');
        return true;
    }
    function branchMonthly() {
        var st = state();
        var day = absDay();
        for (var city in st) {
            var b = st[city].branch;
            if (!b) continue;
            var sect = b.sect;
            var income = b.imperial ? 25 : 15;
            if ((b.halfUntil || 0) > day) income = Math.ceil(income / 2);
            addStonesToSect(sect, income);
            if (sect === mySect()) chron(sect, city + '分舵的月例汇银到了：灵石' + income + '入公库。');
        }
    }
    // 分舵的门（一扇门原则：进城后从政事面板进，或城里直接进）
    W.openBranchRoom = function (city) {
        var st = citySt(city) || (city === CAPITAL ? state()[CAPITAL] : null);
        if (!st || !st.branch) { msg('这城里没有分舵。', 'warning'); return; }
        var b = st.branch;
        var sect = b.sect;
        var mine = mySect() === sect;
        var html = '<div class="text-left">';
        html += para('🏯 「' + sect + '·' + city + '分舵」——三进的院子，门口挂着门派的幡。' + (mine ? '守舵的弟子认得你，起身让座：「师兄/师姐来了？灶上温着茶。」' : '守舵的弟子客气地拦住你：「别派的仙长，茶可以喝，内堂就不便了。」'));
        if (b.trouble) html += '<p class="text-xs text-red-300 mb-2">⚠️ 舵里正压着一桩麻烦：' + b.trouble.text + '</p>';
        var acts = [];
        if (mine) {
            var month = Math.floor(absDay() / 30);
            if (b.mealMonth !== month) {
                acts.push(btn('🍚 领份例——舵里的月例，管饭也管一份丹药（每月一回）', 'window.doBranchMeal(\'' + city + '\')', 'bg-green-800 hover:bg-green-700'));
            }
            acts.push(btn('👂 听消息——分舵的消息网：本城街谈比别处灵通', 'window.doBranchIntel(\'' + city + '\')', 'bg-sky-800 hover:bg-sky-700'));
            acts.push(btn('🛏️ 落脚歇息——舵里厢房干净，比客栈省钱（歇半日）', 'window.doBranchRest(\'' + city + '\')', 'bg-indigo-800 hover:bg-indigo-700'));
            if (b.trouble) {
                if (b.trouble.kind === 'plague') {
                    acts.push(btn('💊 开丹药库救城——公库丹药十炉（香火的账，城里人记得最清）', 'window.doBranchPlagueCure(\'' + city + '\')', 'bg-pink-800 hover:bg-pink-700'));
                } else {
                    acts.push(btn('⚔️ 派人处置——把闹事的拎出去谈谈（真仗）', 'window.doBranchTroubleFight(\'' + city + '\')', 'bg-red-800 hover:bg-red-700'));
                    acts.push(btn('💰 花钱消灾——公库出灵石五十，息事宁人', 'window.doBranchTroublePay(\'' + city + '\')', 'bg-amber-800 hover:bg-amber-700'));
                }
                acts.push(btn('🙈 不管它——' + (b.trouble.kind === 'plague' ? '城里人会把这事记在香火账上' : '进项折半两月，编年照记'), 'window.doBranchTroubleLeave(\'' + city + '\')', 'bg-gray-700 hover:bg-gray-600'));
            }
        } else {
            acts.push(btn('👂 讨杯茶喝——听点本城的街谈（访客的份例只有这个）', 'window.doBranchIntel(\'' + city + '\')', 'bg-sky-800 hover:bg-sky-700'));
        }
        html += btns(acts);
        html += '</div>';
        modal('🏯 ' + city + ' · 分舵', html);
    };
    W.doBranchMeal = function (city) {
        var st = citySt(city) || state()[CAPITAL];
        var b = st && st.branch;
        var sect = mySect();
        if (!b || b.sect !== sect) { msg('舵里不认外人。', 'warning'); return; }
        var month = Math.floor(absDay() / 30);
        if (b.mealMonth === month) { msg('这个月的份例已经领过了。', 'info'); return; }
        b.mealMonth = month;
        if (hasStore(sect, 'pill', 1)) {
            deduct(sect, 'pill', 1);
            try { if (typeof W.addItem === 'function') W.addItem('pill_qi_gather', 1); } catch (e) {}
            log('🍚 分舵的份例：灶上一顿饭，外加公库里拨的一炉聚气丹。（丹药入行囊——来路记在舵账上）', 'success');
        } else {
            try { if (W.XianXia && W.XianXia.DataManager && W.XianXia.DataManager.addSpiritStones) W.XianXia.DataManager.addSpiritStones(5); } catch (e2) {}
            log('🍚 分舵的份例：灶上一顿饭，丹库里没存货，管事的塞给你五枚灵石「拿着路上用」。（灵石+5）', 'success');
        }
        _close();
    };
    W.doBranchIntel = function (city) {
        var st = citySt(city) || state()[CAPITAL];
        var b = st && st.branch;
        if (!b) return;
        _close();
        // 消息网：本城街谈一条（复用既有城市腔），加一条香火动向
        var lines = [];
        try {
            if (typeof W.cityLineNow === 'function') { var cl = W.cityLineNow(city); if (cl) lines.push(cl); }
        } catch (e) {}
        if (st.contest) lines.push('舵里管事的压低了声音：「有人盯着这城的香火——' + st.contest.sect + '的供案都摆出来了。」');
        else if (st.patron && st.patron !== b.sect) lines.push('「这城如今的香火归' + st.patron + '——咱们舵是御许/旧例留着的，两不相犯。」');
        else if (st.hold < 40) lines.push('「城里的香炉最近擦得勤——人心思动，有眼睛在盯着这城的幡。」');
        else lines.push('「城里太平，香火如常。铺子间的口角，都是生意上的小事。」');
        log('👂 ' + city + '分舵的消息网：' + lines.join(' '), 'info');
    };
    W.doBranchRest = function (city) {
        _close();
        try { if (typeof W.advanceTime === 'function') W.advanceTime(120); } catch (e) {}
        try { if (typeof W.restoreQi === 'function') W.restoreQi(30); else if (W.currentCharData) W.currentCharData.qi = Math.min(100, (W.currentCharData.qi || 50) + 30); } catch (e2) {}
        log('🛏️ 你在分舵的厢房歇了半日——被褥是晒过的，比客栈干净，也不花钱。（时辰过去半日，真气回了三十）', 'success');
    };

    // ============ 六 · 分舵麻烦（不是摇钱树） ============
    var TROUBLES = [
        { kind: 'extort', text: '城里的地头蛇「坐地虎」带人堵了分舵的门，要抽例钱——不给，就砸香案。', enemy: '坐地虎·勒索堂口' },
        { kind: 'embezzle', text: '舵里一名常驻弟子监守自盗，汇银短了一截——人证物证都在，就是人跑了。', enemy: '监守自盗的舵中弟子' },
        { kind: 'plague', text: '城南起了时疫，病气往舵里漫——丹药库得拿出来救人，不然城里人说闲话。', enemy: null }
    ];
    function troubleMonthly() {
        var st = state();
        for (var city in st) {
            var b = st[city].branch;
            if (!b || b.trouble || b.imperial) continue; // 御许分舵在城内，兵丁看着，生不出事
            if (Math.random() >= 0.1) continue;
            var tr = TROUBLES[Math.floor(Math.random() * TROUBLES.length)];
            b.trouble = { kind: tr.kind, text: tr.text, enemy: tr.enemy, day: absDay() };
            chron(b.sect, city + '分舵来了麻烦：' + tr.text);
            if (b.sect === mySect()) {
                log('⚠️ ' + city + '分舵来了麻烦——' + tr.text + '（下次进城，或直接开政事面板处置：派人/花钱/不管，都有代价）', 'warning');
            } else {
                // 别派的舵，自己消化：一半花钱平了，一半进项折半两月
                if (Math.random() < 0.5) {
                    deduct(b.sect, 'stone', 50);
                    chron(b.sect, city + '分舵的麻烦，花五十灵石平了——息事宁人，江湖常例。');
                } else {
                    b.halfUntil = absDay() + 60;
                }
            }
        }
    }
    function troubleNotice(city) {
        var st = citySt(city) || (city === CAPITAL ? state()[CAPITAL] : null);
        if (!st || !st.branch || !st.branch.trouble) return;
        if (st.branch.sect !== mySect()) return;
        var nkey = 'sect_trouble_notice_' + city + '_' + st.branch.trouble.day;
        if (flags()[nkey]) return;
        flags()[nkey] = absDay();
        log('⚠️ 路过本门' + city + '分舵——门里管事的迎出来：「可算等着人了。」' + st.branch.trouble.text + '（进舵处置）', 'warning');
    }
    W.doBranchTroubleFight = function (city) {
        var st = citySt(city);
        var b = st && st.branch;
        var tr = b && b.trouble;
        if (!tr) { msg('舵里没事。', 'info'); return; }
        if (!tr.enemy) { msg('时疫不是拎出去谈谈就能了的——要么拿丹药救城，要么随它去。', 'warning'); return; }
        if (typeof W.startBattle !== 'function') { msg('战端未就绪。', 'error'); return; }
        var c = cd() || {};
        var tier = 1;
        try { tier = Math.max(1, typeof W.getRealmTier === 'function' ? W.getRealmTier(c.realm) : 1); } catch (e) {}
        var enemy = {
            name: city + '·' + tr.enemy, type: 'enemy', physiologyType: 'humanoid',
            level: Math.max(1, (typeof W.realmScaledEnemyLevel === 'function' ? W.realmScaledEnemyLevel(c) : tier * 3)),
            attack: Math.round(28 + tier * 6), defense: Math.round(14 + tier * 4), speed: Math.round(16 + tier * 2),
            maxDurability: Math.round(90 + tier * 15), durabilities: { chest: Math.round(90 + tier * 15) },
            combatAbilities: [],
            description: '在' + city + '分舵门口闹事的——欺的是仙门中人不好动手。'
        };
        var battle = W.startBattle(enemy);
        if (battle) { battle._isCityTroubleBattle = true; battle._troubleCity = city; }
        _close();
        log('⚔️ 你把闹事的堵在了分舵门口——「谈可以，先接我一招。」（真仗：赢了麻烦平，输了还得再来）', 'danger');
    };
    W.settleCityTrouble = function (win) {
        var b = W.currentBattle || {};
        var city = b._troubleCity;
        var st = citySt(city);
        var tr = st && st.branch && st.branch.trouble;
        if (!tr) return;
        if (!win) {
            log('💧 没压住场子——闹事的哄笑着散了：「仙门的人也就这样！」麻烦还在，养好了再来。（可再战）', 'warning');
            return;
        }
        st.branch.trouble = null;
        addC(50, '分舵平事·' + city);
        chron(st.branch.sect, city + '分舵的麻烦被' + playerName() + '出手平了——从此城里的地痞绕着那面幡走。（记功）');
        log('✅ 场子压住了。管事的拱手：「还是门里来的人管用。」麻烦平了，你在门中记了一功。（贡献+50）', 'success');
    };
    W.doBranchTroublePay = function (city) {
        var st = citySt(city);
        var b = st && st.branch;
        if (!b || !b.trouble) { msg('舵里没事。', 'info'); return; }
        var sect = b.sect;
        if (!hasStore(sect, 'stone', 50)) { msg('公库凑不出五十灵石——要么派人，要么不管。', 'error'); return; }
        deduct(sect, 'stone', 50);
        b.trouble = null;
        chron(sect, city + '分舵的麻烦，公库出五十灵石平了——江湖常例，息事宁人。');
        log('💰 五十灵石递过去，麻烦平了。管事的苦笑：「这钱花得冤，可比砸了香案便宜。」（公库-50）', 'info');
        _close();
    };
    W.doBranchTroubleLeave = function (city) {
        var st = citySt(city);
        var b = st && st.branch;
        if (!b || !b.trouble) { msg('舵里没事。', 'info'); return; }
        if (b.trouble.kind === 'plague') {
            // 时疫不管：城里人记着，护持跟着掉
            if (st.patron === b.sect) st.hold = Math.max(0, st.hold - 5);
            chron(b.sect, city + '的时疫，分舵没管——城里人把这事记在了香火的账上。（护持-5）');
            if (b.sect === mySect()) log('🙈 你让分舵把时疫的事压下了。城里人的眼神变了——香火的账，他们记着。（护持稳固-5）', 'warning');
        } else {
            b.halfUntil = absDay() + 60;
            chron(b.sect, city + '分舵的麻烦没人管——闹事的常来，舵里的生意做不成样子，进项折半两月。');
            if (b.sect === mySect()) log('🙈 你让分舵忍着。闹事的常来，舵里生意做不成样子——进项折半，得忍两个月。（编年照记）', 'warning');
        }
        b.trouble = null;
        _close();
    };
    // 时疫的另一条路：拿丹药救城（守香火）
    W.doBranchPlagueCure = function (city) {
        var st = citySt(city);
        var b = st && st.branch;
        if (!b || !b.trouble || b.trouble.kind !== 'plague') { msg('舵里没有时疫。', 'info'); return; }
        var sect = b.sect;
        if (!hasStore(sect, 'pill', 10)) { msg('救一城人要丹药十炉——公库丹房不凑手。', 'error'); return; }
        deduct(sect, 'pill', 10);
        b.trouble = null;
        st.hold = Math.min(100, st.hold + 8);
        chron(sect, city + '起了时疫，分舵开了丹药库救城——十炉丹药下去，病气散了。城里人给那面幡磕了头。（护持+8）');
        addC(40, '分舵救城·' + city);
        log('💊 十炉丹药救了一城。病好的人家往分舵门口送万民伞——香火的账，城里人记得最清。（护持+8，贡献+40）', 'success');
        _close();
    };

    // ============ 七 · 月度结算 ============
    function taxMonthly() {
        var st = state();
        for (var city in st) {
            var s = st[city];
            if (!s.patron || s.capital) continue;
            addStonesToSect(s.patron, 20);
            if (s.patron === mySect()) chron(s.patron, city + '的香火供奉到了：灵石二十入公库。');
        }
    }
    function holdDrift() {
        var st = state();
        var f = flags();
        for (var city in st) {
            var s = st[city];
            if (s.capital) continue;
            if (f['qi_withered_' + city]) {
                if (s.patron) s.hold = Math.max(0, s.hold - 3); // 灵脉枯了，人散香断
                continue;
            }
            if (s.patron) {
                s.hold = Math.min(100, s.hold + 2); // 香火日常
                if (alignOf(s.patron) <= -40 && s.hold > 70) s.hold = 70;
                // 座次跌得太惨，手就养不住了
                if (tierRank(tierOf(s.patron)) > 2) {
                    s.lowMonths = (s.lowMonths || 0) + 1;
                    if (s.lowMonths >= 3 && s.branch) {
                        var bit = internal(s.branch.sect);
                        if (bit) bit.disciples = (Number(bit.disciples) || 0) + (Number(s.branch.disciples) || 5);
                        chron(s.branch.sect, '门里座次不振，' + city + '的分舵养不住了——幡收了下来，弟子调回山门。（伸出去的手，收了回去）');
                        notifyHome(s.branch.sect, city + '分舵关停了——座次不振，养不住外头的手。');
                        s.branch = null;
                    }
                } else s.lowMonths = 0;
            }
        }
    }
    function aiContestMonthly() {
        var st = state();
        var sects = W.SECT_INTERNAL || {};
        for (var city in st) {
            var s = st[city];
            if (s.capital || s.contest) continue;
            if (s.patron === mySect() || isPSect(s.patron)) continue; // 玩家门派的护持（入门派与自建宗门），只由玩家侧发起的争夺惊动（AI攻玩家城走下方通道）
            if (Math.random() >= 0.03) continue;
            // 挑一个举幡的：座次够、不是护持方、立场相斥或护持松
            var cands = [];
            for (var sect in sects) {
                if (sect === s.patron) continue;
                if (isPSect(sect)) continue; // 第九波：玩家自建宗门还没接争城线——AI 不代它举幡
                if (tierRank(tierOf(sect)) > 2) continue;
                var eager = 0;
                if (s.patron && alignOf(sect) >= 40 && alignOf(s.patron) <= -40) eager += 3;
                if (!s.patron) eager += 2;
                if (s.hold < 40) eager += 2;
                if (eager > 0 && Math.random() < 0.5) cands.push(sect);
            }
            if (!cands.length) continue;
            var who = cands[Math.floor(Math.random() * cands.length)];
            startContest(city, who, false);
        }
        // AI 也会打玩家护持城的主意（低概率、只打稳固松的）——入门派与自建宗门一视同仁
        for (var city2 in st) {
            var s2 = st[city2];
            if (s2.capital || s2.contest || !(s2.patron === mySect() || isPSect(s2.patron)) || s2.hold >= 40) continue;
            if (Math.random() >= 0.02) continue;
            var foes = [];
            for (var sec in sects) { if (sec !== s2.patron && !isPSect(sec) && tierRank(tierOf(sec)) <= 2) foes.push(sec); }
            if (!foes.length) continue;
            startContest(city2, foes[Math.floor(Math.random() * foes.length)], false);
        }
    }
    function monthTick() {
        var day = absDay();
        if (!day || day % 30 !== 0) return;
        state();
        taxMonthly();
        holdDrift();
        branchMonthly();
        troubleMonthly();
        aiContestMonthly();
    }
    function dayTick() {
        var day = absDay();
        if (!day) return;
        var st = state();
        for (var city in st) {
            var s = st[city];
            if (s.contest && day >= s.contest.resolveDay) resolveContest(city);
        }
    }
    try {
        var hook = function () { try { dayTick(); } catch (e) {} try { monthTick(); } catch (e2) {} };
        if (W.EventBus && W.EventBus.on) W.EventBus.on('newDay', hook);
        else if (W.timeSystem && typeof W.timeSystem.onNewDaySubscribe === 'function') W.timeSystem.onNewDaySubscribe(hook);
    } catch (e) {}

    // ============ 八 · 政事面板插块 ============
    function panelBlock(sect) {
        var st = state();
        // 第十七波：自建宗门的掌门看自家的册——位分按掌门论（rank 0）
        var psMine = isPSect(sect) && sect === builtSect();
        var mine = mySect() === sect || psMine;
        var d = ds() || {};
        var rank = psMine ? 0 : (d.rank == null ? 7 : d.rank);
        var html = '<p class="text-xs font-bold text-amber-200 mb-1 mt-2">🏮 城市香火（仙凡分治——城主理政，门派争护持）</p>';
        html += '<div class="bg-gray-900/60 rounded p-2 mb-2">';
        var rows = [];
        for (var i = 0; i < MUNDANE.length; i++) {
            var city = MUNDANE[i];
            var s = st[city];
            var p = s.patron ? ('「' + s.patron + '」' + (evilPatron(city) ? '<span class="text-red-400">（邪）</span>' : '')) : '<span class="text-gray-500">无主</span>';
            var extra = '';
            if (s.branch) extra += ' 🏯分舵';
            if (s.contest) extra += ' 🚩' + s.contest.sect + '举幡（' + Math.max(0, s.contest.resolveDay - absDay()) + '日后开牌）';
            var mineMark = (s.patron === sect) ? '<span class="text-amber-300">·本门护持</span>' : '';
            rows.push('<p class="text-xs text-gray-400 py-0.5 border-b border-gray-700/40">' + city + '：' + p + ' · 稳固' + Math.round(s.hold) + mineMark + extra + '</p>');
        }
        html += rows.join('');
        var cap = st[CAPITAL];
        if (cap && cap.branch && cap.branch.sect === sect) html += '<p class="text-xs text-amber-300 py-0.5">🏮 长安·御许分舵（鸿胪寺文书在案）</p>';
        html += '</div>';
        if (mine) {
            var acts = [];
            // 举幡：无主城或稳固<30的城，长老以上
            if (rank <= 4) {
                for (var j = 0; j < MUNDANE.length; j++) {
                    var c2 = MUNDANE[j];
                    var s2 = st[c2];
                    if (s2.patron === sect || s2.contest) continue;
                    if (s2.patron && s2.hold >= 30) continue;
                    if (tierRank(tierOf(sect)) > 2) continue;
                    acts.push(btn('🚩 向' + c2 + '举幡' + (s2.patron ? '（与' + s2.patron + '争香火）' : '（无主之城）') + '——公库备供案灵石一百，三十日开牌', 'window.SectCities.raiseBanner(\'' + c2 + '\')', 'bg-amber-800 hover:bg-amber-700'));
                }
                if (!st[CAPITAL] || !st[CAPITAL].branch) {
                    acts.push(btn('🏮 递帖子进长安——御许分舵（座次中等偏上+立场正道所认+公库灵石五百）', 'window.SectCities.changan()', 'bg-yellow-800 hover:bg-yellow-700'));
                }
            }
            // 自家护持城：立舵/进舵
            var held = W.sectCityPatrons(sect);
            for (var k = 0; k < held.length; k++) {
                var hc = held[k].city;
                var hs = st[hc];
                if (!hs.branch) acts.push(btn('🏯 在' + hc + '立分舵（公库灵石二百+调派五名弟子常驻，月汇银十五）', 'window.SectCities.build(\'' + hc + '\')', 'bg-emerald-800 hover:bg-emerald-700'));
                else if (currentCity() === hc) acts.push(btn('🏯 进' + hc + '分舵——领份例、听消息、落脚歇息', 'window.openBranchRoom(\'' + hc + '\')', 'bg-teal-800 hover:bg-teal-700'));
                else if (hs.branch.trouble) acts.push(btn('⚠️ ' + hc + '分舵压着麻烦——点开处置（派人/花钱/不管）', 'window.openBranchRoom(\'' + hc + '\')', 'bg-red-800 hover:bg-red-700'));
            }
            if ((st[CAPITAL] || {}).branch && st[CAPITAL].branch.sect === sect && currentCity() === CAPITAL) {
                acts.push(btn('🏯 进长安御许分舵', 'window.openBranchRoom(\'' + CAPITAL + '\')', 'bg-teal-800 hover:bg-teal-700'));
            }
            if (acts.length) html += '<div style="display:flex;flex-direction:column;gap:6px">' + acts.join('') + '</div>';
        } else {
            html += '<p class="text-[10px] text-gray-500">（别派的香火账——看得见幡，摸不着册。）</p>';
        }
        return html;
    }

    // 灭门联动：护持城幡落、分舵随幡拆（sect-doom 调用）
    function releasePatronage(sect) {
        var st = state();
        for (var city in st) {
            var s = st[city];
            if (s.patron === sect) {
                s.patron = null;
                s.hold = 0;
                s.lowMonths = 0;
                chron(sect, city + '城头的幡落了下来——城主捧着的香火册，没有下家可送。');
                street(city + '城头的幡落了——「' + sect + '」不在了，这城的香火没了下家。幡杆空着，几家的眼睛又盯上了。');
            }
            if (s.branch && s.branch.sect === sect) {
                var bit = internal(sect);
                if (bit) bit.disciples = (Number(bit.disciples) || 0) + (Number(s.branch.disciples) || 5);
                s.branch = null;
            }
        }
    }
    // 第十七波：掌门亲手花钱的三步——先收账（镜像对齐宗库）、走既有真线扣镜像、再把同一笔落回宗库（名目写清）
    function psPrep(sect) { if (isPSect(sect)) { try { W.PSectWorld && W.PSectWorld.syncMirror(sect); } catch (e) {} } }
    function psSettle(sect, label) { if (isPSect(sect)) { try { W.PSectWorld && W.PSectWorld.settleSpend(sect, label); } catch (e) {} } }
    function psRefresh(sect) {
        try {
            if (isPSect(sect)) { if (W.openPlayerSectPanel) W.openPlayerSectPanel(); }
            else if (W.SectGov) W.SectGov.openPanel(mySect());
        } catch (e) {}
    }
    W.SectCities = {
        panelBlock: panelBlock,
        releasePatronage: releasePatronage,
        raiseBanner: function (city) { var s = homeSect(); psPrep(s); var r = startContest(city, s, true); if (r) { psSettle(s, '举幡·香火供案'); psRefresh(s); } return r; },
        build: function (city) { var s = homeSect(); psPrep(s); var r = buildBranch(city); if (r) { psSettle(s, '立分舵·置办宅院'); psRefresh(s); } return r; },
        changan: function () { var s = homeSect(); psPrep(s); var r = buildChanganBranch(); if (r) { psSettle(s, '长安御许分舵·规费'); psRefresh(s); } return r; },
        probe: function () {
            var st = state();
            var out = {};
            for (var c in st) {
                var s = st[c];
                out[c] = { patron: s.patron, hold: Math.round(s.hold), branch: s.branch ? { sect: s.branch.sect, imperial: !!s.branch.imperial, trouble: s.branch.trouble ? s.branch.trouble.kind : null, half: (s.branch.halfUntil || 0) > absDay() } : null, contest: s.contest ? { sect: s.contest.sect, boost: Number(s.contest.boost) || 0, resolveDay: s.contest.resolveDay } : null };
            }
            return out;
        }
    };
    console.log('[sect-cities] 城市香火护持已注册：长安朝廷直辖/凡俗八城初始发牌可争夺/护持是活账（实事+枯城-）/分舵只立自家护持城（御许入长安）/月税月汇银守恒/麻烦三选处置');
})();
