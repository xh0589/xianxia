// ==================== 第七十二波 · 城里长期营生（做一天吃一天的零工之外，终于有了「差事」） ====================
// 城里的活计此前全是日结的零工：善堂帮一日厨、镖局搭一趟脚、书肆抄半日书——做一天吃一天，
// 没人雇你「长活」。本账把差事开出来：铺子伙计、蒙馆代课、医馆帮手、更夫巡夜——
// 应募上岗、按日上工领钱，做满十个工东家涨工钱，旷工七日东家辞人。
// 纪律：①差事跟着城里实有的建筑走（有铺子才有伙计岗——城市建筑清单一个键不添）；
//       ②零骰：工钱是定数、涨工是定数、辞人是定数；
//       ③一日一工（工册记日戳），钱货同笔走统一结算——上工领钱是一件事；
//       ④工账是 cd._employ 单字段（押镖/贩货/赁屋同款先例），读档归一化——坏账当没应过募；
//       ⑤工钱是东家的钱（NPC 真钱，与押镖酬金、零工赏钱同一口径），日上有封顶——营生路不是印钞路。
(function () {
    'use strict';

    var JOBS = {
        shop_assistant: {
            key: 'shop_assistant', name: '铺子伙计', icon: '🧮', building: 'shop',
            wage: 25, energy: 20, minutes: 240, rep: 1,
            skill: { name: '口才', exp: 1 },
            desc: '招呼客人、盘点货架、学着讨价还价。东家说：嘴皮子就是本钱。',
            need: null
        },
        tutor: {
            key: 'tutor', name: '蒙馆代课', icon: '📖', building: 'library',
            wage: 40, energy: 15, minutes: 240, rep: 1,
            skill: null, mood: 2,
            desc: '替老先生教蒙童认字。教的是自己肚子里的存货——孩子们念书的声音，听着心里干净。',
            need: { skill: '学识', at: 30 }
        },
        clinic_helper: {
            key: 'clinic_helper', name: '医馆帮手', icon: '🌿', building: 'medical_clinic',
            wage: 45, energy: 25, minutes: 240, rep: 1,
            skill: { name: '医术', exp: 1 },
            desc: '碾药、看火、给大夫打下手。手上见真章——医术是磨出来的。',
            need: { skill: '医术', at: 30 }
        },
        night_watch: {
            key: 'night_watch', name: '更夫巡夜', icon: '🏮', building: 'fire_department',
            wage: 30, energy: 30, minutes: 240, rep: 2,
            skill: null,
            desc: '敲更、巡街、盯火烛。一夜走下来腿是酸的，街坊睡得是安稳的。',
            need: null
        }
    };
    var CFG = {
        SHIFT_MIN: 240,        // 一工两个时辰（第九十五波·NEW-34：1时辰=120分钟，240分钟正是两个时辰；旧注口算错了，与实扣对不上）
        RAISE_EVERY: 10,       // 每做满十个工
        RAISE_STEP: 0.1,       // 东家涨一成工钱
        RAISE_CAP: 3,          // 最多加三成（伙计做到头也是伙计——想发财去贩货摆摊）
        ABSENT_DAYS: 7         // 旷工七日，东家辞人
    };

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
    function cityBuildings(ct) {
        try {
            var d = window.locationSystem && window.locationSystem.getCityData && window.locationSystem.getCityData(ct || city());
            return (d && d.buildings) || [];
        } catch (e) { return []; }
    }
    function skillVal(name) {
        var c = cd();
        return (c && c.lifeSkills && Number(c.lifeSkills[name])) || 0;
    }
    // 第七十四波·市井有脸：每个岗有自己的东家（花名册按城+角色定死；缺册退回「东家」老话）
    var JOB_ROLES = { shop_assistant: 'shopkeeper', tutor: 'tutor', clinic_helper: 'doctor', night_watch: 'watch_head' };
    function bossAddr(jobKey, ct) {
        try {
            if (window.CityFaces && typeof window.CityFaces.face === 'function') {
                var f = window.CityFaces.face(ct || city(), JOB_ROLES[jobKey]);
                if (f) return f.addr;
            }
        } catch (e) {}
        return '';
    }
    function settle(spec) {
        try {
            if (window.RewardService && typeof window.RewardService.apply === 'function') {
                var r = window.RewardService.apply(spec, { source: '城里营生', city: city() });
                return { ok: !!(r && r.success !== false), note: r && r.messages ? r.messages.join('、') : '' };
            }
        } catch (e) {}
        return { ok: false, note: '' };
    }
    function spendTime(min, why) {
        try { if (window.timeSystem && window.timeSystem.advanceTime) window.timeSystem.advanceTime(min, why); else if (window.advanceTime) window.advanceTime(min, why); } catch (e) {}
    }
    function refresh() { try { if (window.updateCharacterStatus) window.updateCharacterStatus(); } catch (e) {} }

    // ============ 工账（cd._employ 单字段，归一化只认不补写） ============
    function ledger() {
        var c = cd();
        if (!c) return null;
        var v = c._employ;
        if (!v || typeof v !== 'object') return null;
        if (!JOBS[v.job]) return null;
        if (typeof v.city !== 'string' || !v.city) return null;
        if (!isFinite(Number(v.lastWorkDay)) || !isFinite(Number(v.shifts))) return null;
        return v;
    }
    function jobOf() { var l = ledger(); return l ? JOBS[l.job] : null; }
    // 本城有哪些差事（岗跟着建筑走）
    function jobsHere(ct) {
        var bs = cityBuildings(ct);
        var out = [];
        for (var k in JOBS) { if (bs.indexOf(JOBS[k].building) >= 0) out.push(JOBS[k]); }
        return out;
    }
    // 工钱现算：干得越久涨得越多，封顶三成
    function wageOf(jobKey) {
        var j = JOBS[jobKey];
        if (!j) return 0;
        var l = ledger();
        var shifts = (l && l.job === jobKey) ? Number(l.shifts) : 0;
        var tier = Math.min(CFG.RAISE_CAP, Math.floor(shifts / CFG.RAISE_EVERY));
        return Math.floor(j.wage * (1 + tier * CFG.RAISE_STEP));
    }
    function raiseInfo(jobKey) {
        var l = ledger();
        var shifts = (l && l.job === jobKey) ? Number(l.shifts) : 0;
        var tier = Math.min(CFG.RAISE_CAP, Math.floor(shifts / CFG.RAISE_EVERY));
        var toNext = (tier >= CFG.RAISE_CAP) ? 0 : (tier + 1) * CFG.RAISE_EVERY - shifts;
        return { shifts: shifts, tier: tier, toNext: toNext };
    }

    // ============ 应募 ============
    function apply(jobKey) {
        var j = JOBS[jobKey];
        if (!j) { say('💼 没这个差事。', 'warning'); return false; }
        if (ledger()) { say('💼 你手里已经有一份差事了——一人一口活，想换地方先辞工。', 'info'); return false; }
        var ct = city();
        if (!ct || jobsHere(ct).indexOf(j) < 0) { say('💼 这地界没有「' + j.name + '」的岗——差事跟着铺面走。', 'info'); return false; }
        if (j.need) {
            if (skillVal(j.need.skill) < j.need.at) {
                say('💼 「' + j.name + '」要' + j.need.skill + ' ' + j.need.at + ' 起步——你现在的' + j.need.skill + ' ' + skillVal(j.need.skill) + '，人家不收。', 'warning');
                return false;
            }
        }
        var d = absDay();
        if (!d) { say('💼 天上没钟，铺面不开工——改日再来。', 'info'); return false; }
        cd()._employ = { job: jobKey, city: ct, signedDay: d, lastWorkDay: d - 1, shifts: 0 };   // 应募当日算没上过工——上了工册当天就能开工
        var boss0 = bossAddr(jobKey, ct);
        log('💼 你在' + ct + '应下了「' + j.name + '」' + (boss0 ? '——东家' + boss0 + '亲自点了头' : '') + '：工钱一日 ' + j.wage + ' 铜，做满十个工东家涨一成。今日算是上了工册。', 'success');
        refresh();
        render();
        return true;
    }

    // ============ 辞工 ============
    function quitJob() {
        var l = ledger();
        if (!l) { say('💼 你没当差。', 'info'); return false; }
        var j = JOBS[l.job];
        cd()._employ = null;
        var boss = bossAddr(l.job, l.city) || '东家';
        log('💼 你辞了' + l.city + '「' + j.name + '」的差事。' + boss + '点点头：「江湖人，来去自由。」工册上销了你的名。', 'info');
        refresh();
        render();
        return true;
    }

    // ============ 上工（一日一工，钱是一件事里到账的） ============
    function work() {
        var l = ledger();
        if (!l) { say('💼 你没当差——先应个募。', 'info'); return false; }
        var j = JOBS[l.job];
        var d = absDay();
        if (!d) { say('💼 天上没钟，铺面不开工。', 'info'); return false; }
        if (l.city !== city()) { say('💼 你的差事在' + l.city + '——这儿没你的岗。', 'info'); return false; }
        if (Number(l.lastWorkDay) === d) { say('💼 今日这工你已经上过了——东家不兴一天使两遍。', 'info'); return false; }
        var c = cd();
        if (Number(c.energy) < j.energy) { say('💼 精力不够上工（要 ' + j.energy + '）——东家看你脸色，劝你歇一日。', 'warning'); return false; }
        var wage = wageOf(l.job);
        var spec = { copper: wage, energy: -j.energy, cityReputation: j.rep };
        if (j.skill) spec.lifeSkill = { name: j.skill.name, exp: j.skill.exp };
        if (j.mood) spec.mood = j.mood;
        var r = settle(spec);
        if (!r.ok) { say('💼 这工没上成——账没走通，东家也没扣你什么。', 'warning'); return false; }
        l.lastWorkDay = d;
        l.shifts = Number(l.shifts) + 1;
        spendTime(j.minutes, '上工·' + j.name);
        refresh();
        var raiseNote = '';
        var newTier = Math.floor(Number(l.shifts) / CFG.RAISE_EVERY);
        if (Number(l.shifts) % CFG.RAISE_EVERY === 0 && newTier > 0 && newTier <= CFG.RAISE_CAP) {
            raiseNote = '做满了工数——东家涨工钱了，往后一日 ' + wageOf(l.job) + ' 铜。';
        }
        var boss = bossAddr(l.job, l.city);
        log('💼 ' + j.icon + '「' + j.name + '」上工一日' + (boss ? '（' + boss + '点了工册）' : '') + '：工钱 ' + wage + ' 铜钱落袋。' + (raiseNote || '') + (r.note ? '（' + r.note + '）' : ''), 'success');
        render();
        // 第九十五波·NEW-35：一日一工，上完这一工面板只剩灰着的「今日已上工」——流程终点软收面板，
        // 不把死按钮留在屏上（要辞工/看工册，重开「城里营生」就是）
        try { if (typeof window.closeModalSoft === 'function') window.closeModalSoft(); } catch (e) {}
        return true;
    }

    // ============ 旷工辞人（跨日总账） ============
    function processAbsence() {
        var l = ledger();
        if (!l) return;
        var d = absDay();
        if (!d || Number(l.lastWorkDay) <= 0) return;   // 没有真钟不裁人
        if (d - Number(l.lastWorkDay) <= CFG.ABSENT_DAYS) return;
        var j = JOBS[l.job];
        cd()._employ = null;
        var boss = bossAddr(l.job, l.city) || '东家';
        log('💼 你旷了「' + j.name + '」的工超过七日。' + boss + '托人捎话：「庙小，供不了大神。」工册上销了你的名。', 'warning');
        say('💼 旷工太久，' + l.city + '「' + j.name + '」的差事丢了。', 'warning');
    }
    function onNewDay() {
        try { processAbsence(); } catch (e) {}
    }
    try {
        if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') window.timeSystem.onNewDaySubscribe(onNewDay);
    } catch (eSub) {}

    // ============ 面板与弹窗 ============
    function panelHtml(cityName) {
        try {
            var ct = cityName || city();
            var l = ledger();
            var here = (city() === ct);
            if (l && l.city === ct) {
                var j = JOBS[l.job];
                var workedToday = here && Number(l.lastWorkDay) === absDay();
                return '<div class="p-2 bg-sky-900/20 rounded border border-sky-800/50">' +
                    '<button onclick="CityJobs.open()" class="w-full text-left text-sm text-sky-300 hover:text-sky-200">' +
                    j.icon + ' 差事：' + j.name + '（工钱一日 ' + wageOf(l.job) + ' 铜' + (workedToday ? ' · 今日已上工' : ' · 今日未上工') + '）</button></div>';
            }
            if (cityName && city() && cityName !== city()) return '';
            if (!jobsHere(ct).length) return '';
            return '<div class="p-2 bg-sky-900/20 rounded border border-sky-800/50">' +
                '<button onclick="CityJobs.open()" class="w-full text-left text-sm text-sky-300 hover:text-sky-200">💼 寻个差事（城里的长活——铺子伙计、蒙馆代课、医馆帮手、更夫巡夜，按日领钱）</button></div>';
        } catch (e) { return ''; }
    }

    function render() {
        var l = ledger();
        var html = '';
        if (l) {
            var j = JOBS[l.job];
            var ri = raiseInfo(l.job);
            var home = l.city === city();
            var bossR = bossAddr(l.job, l.city);
            html += '<p class="text-sm text-gray-300 mb-2">' + j.icon + ' 你在<b class="text-sky-300">' + l.city + '</b>当着「' + j.name + '」' + (bossR ? '（东家' + bossR + '）' : '') + '。</p>' +
                '<p class="text-xs text-gray-500 mb-3">工钱一日 ' + wageOf(l.job) + ' 铜（已做 ' + ri.shifts + ' 个工' +
                (ri.toNext > 0 ? '，再做 ' + ri.toNext + ' 个工东家涨一成' : '，工钱已涨到顶') + '）。旷工七日，东家辞人。</p>';
            if (home) {
                var worked = Number(l.lastWorkDay) === absDay();
                html += '<button onclick="CityJobs.work()" class="w-full p-3 rounded mb-2 text-left text-sm ' +
                    (worked ? 'bg-gray-700 text-gray-400' : 'bg-sky-800 hover:bg-sky-700 text-white') + '">' +
                    (worked ? '✅ 今日已上工（明日请早）' : '🔨 上工（两个时辰 · 精力-' + j.energy + ' · 工钱 ' + wageOf(l.job) + ' 铜）') + '</button>';
            } else {
                html += '<p class="text-xs text-amber-300/80 mb-2">人不在' + l.city + '——岗在那儿等你回去，旷久了可就没了。</p>';
            }
            html += '<button onclick="CityJobs.quitJob()" class="w-full p-3 rounded mb-2 text-left text-sm bg-gray-700 hover:bg-gray-600 text-white">👋 辞工（来去自由，工册销名）</button>';
        } else {
            var here = jobsHere();
            if (!here.length) {
                html += '<p class="text-sm text-gray-400 mb-3">这地界没有雇长活的人家。</p>';
            } else {
                html += '<p class="text-sm text-gray-300 mb-3">牙行的墙上贴着几张招工的红纸。东家要的是长工——按日结钱，做久了涨工钱：</p>';
                for (var i = 0; i < here.length; i++) {
                    var j2 = here[i];
                    var needTxt = j2.need ? '（要' + j2.need.skill + ' ' + j2.need.at + '）' : '';
                    var canApply = !j2.need || skillVal(j2.need.skill) >= j2.need.at;
                    var jb = bossAddr(j2.key);
                    html += '<button onclick="CityJobs.apply(\'' + j2.key + '\')" class="w-full p-3 rounded mb-2 text-left text-sm ' +
                        (canApply ? 'bg-sky-900 hover:bg-sky-800' : 'bg-gray-800 opacity-60') + ' text-white">' +
                        j2.icon + ' ' + j2.name + (jb ? '（东家' + jb + '）' : '') + needTxt + '（工钱一日 ' + j2.wage + ' 铜 · 精力-' + j2.energy + ' · 本城声望+' + j2.rep + '）' +
                        '<span class="block text-xs text-gray-400 mt-1">' + j2.desc + '</span></button>';
                }
            }
        }
        if (typeof window.showModal === 'function') window.showModal('💼 城里营生', html);
    }
    function open() { render(); return true; }

    window.CityJobs = {
        JOBS: JOBS,
        CFG: CFG,
        ledger: ledger,
        jobsHere: jobsHere,
        wageOf: wageOf,
        raiseInfo: raiseInfo,
        apply: apply,
        quitJob: quitJob,
        work: work,
        processAbsence: processAbsence,
        onNewDay: onNewDay,
        panelHtml: panelHtml,
        open: open,
        render: render
    };
    window.openCityJobs = function () { return open(); };
})();
