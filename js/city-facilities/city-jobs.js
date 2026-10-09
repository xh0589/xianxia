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
        },
        // ---- v27.3 手艺与街面批：差事名册扩八行（岗跟着城里实有的建筑走，一个键不添） ----
        dock_hand: {
            key: 'dock_hand', name: '码头扛活', icon: '📦', building: 'salt_iron_office',
            wage: 28, energy: 35, minutes: 240, rep: 0,
            skill: null,
            desc: '盐铁局的卸货码头缺脚力——一包盐二百斤，从船上扛进仓，肩膀磨出茧，钱当日结。',
            need: null
        },
        ferryman: {
            key: 'ferryman', name: '渡口摆渡', icon: '⛵', building: 'granary',
            wage: 32, energy: 30, minutes: 240, rep: 1,
            skill: null,
            desc: '粮仓码头的官渡缺个撑船的——风里雨里一篙一篙地撑，渡的都是赶路人。',
            need: null
        },
        pawn_appraiser: {
            key: 'pawn_appraiser', name: '当铺掌眼', icon: '🧐', building: 'pawn_shop',
            wage: 50, energy: 15, minutes: 240, rep: 1,
            skill: { name: '学识', exp: 1 },
            desc: '柜台后头看货定价——金玉器玩、字画残页，一眼断真伪，两句话压行价。',
            need: { skill: '学识', at: 25 }
        },
        street_crier: {
            key: 'street_crier', name: '街头吆喝人', icon: '📣', building: 'goulan_washe',
            wage: 26, energy: 20, minutes: 240, rep: 0,
            skill: { name: '口才', exp: 1 },
            desc: '勾栏瓦舍门口替各家铺子吆喝引流——嗓子就是饭碗，喊得响、喊得巧，赏钱就多。',
            need: null
        },
        guide: {
            key: 'guide', name: '向导带路', icon: '🧭', building: 'inn',
            wage: 35, energy: 25, minutes: 240, rep: 1,
            skill: { name: '口才', exp: 1 },
            desc: '客栈里南来北往的客人认路难——你带他们逛城、指门路、讲典故，脚钱嘴钱各一半。',
            need: null
        },
        jailer: {
            key: 'jailer', name: '狱卒', icon: '⛓️', building: 'court',
            wage: 40, energy: 25, minutes: 240, rep: 1,
            skill: null,
            desc: '司法堂大牢里当差——提牢、巡监、防劫狱。从前在墙外头想办法进去，如今拿着钥匙的是你。',
            need: null,
            // 反转位的油水：探监的家眷塞红包（引擎骰、明账写在牌面上——工钱仍是定数，红包是外快）
            perk: { id: 'tips', p: 0.4, copper: [10, 30], text: '一位探监的家眷趁递食盒的当口，往你袖里塞了个红包' }
        },
        house_steward: {
            key: 'house_steward', name: '大户管家', icon: '🗝️', building: 'garden_villa',
            wage: 55, energy: 20, minutes: 240, rep: 1,
            skill: { name: '学识', exp: 1 },
            desc: '园林别苑的大户缺个管家——管账、管人、管采买，体面活计，东家赏罚都重。',
            need: { skill: '学识', at: 20 }
        },
        gate_guard: {
            key: 'gate_guard', name: '城门卒', icon: '🛡️', building: 'tax_bureau',
            wage: 38, energy: 25, minutes: 240, rep: 1,
            skill: null,
            desc: '税课司名下的城门岗——查税验货、比对通缉画影。从前过城门的是你，如今站在门洞下头看人过的是你。',
            need: null,
            // 反转位的油水：查货查出夹带（引擎骰、明账）——赏钱走税课司的功绩簿
            perk: { id: 'seize', p: 0.3, copper: [15, 35], text: '你在一辆骡车的盐包底下查出了夹带——税课司当场记功发赏' }
        },
        // v27.4 黑道与断案批：81 当捕快——上岗才有案卷权限（case-system.js 断案引擎只读这本工账）
        constable: {
            key: 'constable', name: '捕快', icon: '👮', building: 'court',
            wage: 42, energy: 25, minutes: 240, rep: 1,
            skill: { name: '学识', exp: 1 },
            desc: '司法堂里当差——巡街、缉查、押人过堂。穿上这身号衣，案卷房的卷宗才翻得着你（断案、缉逃的门路都在里头）。',
            need: null,
            perk: { id: 'merit', p: 0.35, copper: [15, 40], text: '当差协助破了一桩案子，班头把你的名字报了上去——功绩钱当场发下' }
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
    // DES-57：城名两串写法（舆图转发的 cityName 带空格「帝都 · 长安」，角色账里是「帝都·长安」）——认账前先取键
    function pkCity(s) { return String(s == null ? '' : s).replace(/\s+/g, ''); }
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
                var r = window.RewardService.apply(spec, { facilitySpend: true, source: '城里营生', city: city() });
                return { ok: !!(r && r.success !== false), note: r && r.messages ? r.messages.join('、') : '' };
            }
        } catch (e) {}
        return { ok: false, note: '' };
    }
    function spendTime(min, why) {
        try { if (window.timeSystem && window.timeSystem.advanceTime) window.timeSystem.advanceTime(min, why); else if (window.advanceTime) window.advanceTime(min, why); } catch (e) { console.warn('[静默失败] js/city-facilities/city-jobs.js:100 · spendTime：打工的时辰没扣——钱挣了、天却没过去', e && e && e.message); }
    }
    function refresh() { try { if (window.updateCharacterStatus) window.updateCharacterStatus(); } catch (e) { console.warn('[静默失败] js/city-facilities/city-jobs.js:102 · refresh：打工结算后面板没刷新——HUD 上的精力/灵石还是旧数', e && e && e.message); } }
    // v27.3：骰子有引擎随机源走引擎（零直掷纪律——反转位红包/大差事凶险都用它）
    function dice() { return (typeof window.__scenarioRng === 'function') ? window.__scenarioRng() : Math.random(); }
    function realmIdxNow() {
        try { var r = cd() && cd().realm; if (r && typeof window.getRealmIndex === 'function') return Number(window.getRealmIndex(r)) || 0; } catch (e) {}
        return 0;
    }

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
        if (pkCity(l.city) !== pkCity(city())) { say('💼 你的差事在' + l.city + '——这儿没你的岗。', 'info'); return false; }
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
        // v27.3 反转位外快：工钱仍是定数（零骰纪律不破），红包/记功是引擎骰的额外一笔——明账写在差事行里
        if (j.perk) {
            try {
                if (dice() < j.perk.p) {
                    var lo = j.perk.copper[0], hi = j.perk.copper[1];
                    var tip = lo + Math.floor(dice() * (hi - lo + 1));
                    var pr = settle({ copper: tip, msg: '💼 ' + j.perk.text + '：+' + tip + ' 铜（外快——工钱照旧是定数）。', msgType: 'success' });
                    if (pr.ok) log('💼 ' + j.perk.text + '——' + tip + ' 铜外快落袋。', 'success');
                }
            } catch (ePerk) { console.warn('[静默失败] js/city-facilities/city-jobs.js · work：外快这一笔没算成，工钱已照发', ePerk && ePerk.message); }
        }
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
    // ============ v27.3 大差事（一次性多日程）：63 投军远征 · 64 护送贵人 ============
    // 与日结差事分账：这是一生一回的大活——签了就走 N 日程，回城那日账自己结（新日总账，零按钮零追人）。
    // 工账 cd()._gigs 单字段（_employ 同款纪律），读档归一化：坏契当没签过。
    var GIGS = {
        enlist: {
            key: 'enlist', name: '投军远征', icon: '🪖', building: 'bounty_hall', days: 7,
            reward: { copper: 500, stones: 30, exp: 150 }, woundP: 0.35,
            pitch: '城楼下募兵处接了先锋斥候的活——大营开拔七日，你随军走一趟。军功回城那日一并结算（凶险明账：三成一五的可能带旧伤回来）。',
            settleText: '🪖 大军班师回城——你七日随军的军功一并结清：饷钱 500 铜、犒赏 30 灵石，刀口上滚过的见识也长进在身上。'
        },
        vip: {
            key: 'vip', name: '护送贵人', icon: '🎎', building: 'escort_office', days: 3,
            reward: { copper: 200, stones: 20, rep: 2, exp: 60 }, ambushP: 0.3,
            pitch: '镖局接了单「押人」的活：把一位贵人子弟平安送回乡里——三日路程。押人不同于押货：货不会哭，人会招事（凶险明账：三成可能半道遭截）。',
            settleText: '🎎 你把贵人子弟平安送到乡里——镖局结单：200 铜、20 灵石，主家另赠一面「可信」的锦旗（城望+2）。押人是押人心，这一单你押稳了。'
        }
    };
    function gigsLedger() {
        var c = cd();
        if (!c) return null;
        if (!c._gigs || typeof c._gigs !== 'object') c._gigs = {};
        ['enlist', 'vip'].forEach(function (k) {
            var g = c._gigs[k];
            if (g === 'done') return;
            if (g && typeof g === 'object' && Number(g.returnDay) > 0) {
                g.returnDay = Math.floor(Number(g.returnDay));
                g.signedDay = Math.max(0, Math.floor(Number(g.signedDay) || 0));
                g.city = typeof g.city === 'string' ? g.city : '';
            } else c._gigs[k] = null;
        });
        return c._gigs;
    }
    function signGig(key) {
        var g = GIGS[key];
        if (!g) { say('💼 没这桩大差事。', 'warning'); return false; }
        var gl = gigsLedger();
        if (!gl) return false;
        if (gl[key]) { say('💼 「' + g.name + '」你已经签过了——' + (gl[key] === 'done' ? '这桩活早结了账。' : '第 ' + gl[key].returnDay + ' 日回城，账自己会结。'), 'info'); return false; }
        var ct = city();
        if (!ct) { say('💼 先进城再说。', 'info'); return false; }
        if (cityBuildings(ct).indexOf(g.building) < 0) { say('💼 这地界没有接这活的门脸——' + (key === 'enlist' ? '募兵处' : '镖局') + '别处寻。', 'info'); return false; }
        var d = absDay();
        if (!d) { say('💼 天上没钟，契上落不了日子——改日再来。', 'info'); return false; }
        gl[key] = { signedDay: d, returnDay: d + g.days, city: ct };
        log('💼 ' + g.icon + ' 你签下了「' + g.name + '」：' + g.pitch, 'success');
        say('💼 ' + g.icon + ' 「' + g.name + '」签下了——' + g.days + ' 日后回城，账自己会结。', 'success');
        render();
        return true;
    }
    function settleGigs() {
        var gl = gigsLedger();
        if (!gl) return;
        var d = absDay();
        if (!d) return;
        ['enlist', 'vip'].forEach(function (key) {
            var g0 = gl[key];
            if (!g0 || g0 === 'done' || typeof g0 !== 'object') return;
            if (d < g0.returnDay) return;
            var g = GIGS[key];
            var spec = { msg: g.settleText, msgType: 'success' };
            for (var k in g.reward) spec[k] = g.reward[k];
            var extra = '';
            if (key === 'enlist' && dice() < g.woundP) {
                spec.health = -40;
                extra = '最后一仗你挨了一支流矢（伤-40）——军功的价钱，契上写明的那一笔。';
            }
            if (key === 'vip' && dice() < g.ambushP) {
                // 半道遭截：按境界骰护住没护住（明账五成起，境界越高越稳）
                if (dice() < Math.min(0.85, 0.5 + realmIdxNow() * 0.08)) {
                    spec.stones = (spec.stones || 0) + 30; spec.rep = (spec.rep || 0) + 3;
                    extra = '半道真遭了截——你护着贵人且战且走，截道的没讨着便宜。主家事后另谢 30 灵石（城望再+3）。';
                    try { if (typeof window.playerPushDeed === 'function') window.playerPushDeed('good', '你护送贵人半道击退截客——镖局上下都服你'); } catch (eD) {}
                } else {
                    spec.copper = Math.floor((spec.copper || 0) / 2); spec.health = -25;
                    extra = '半道遭了截，你护住了人，自己挨了一下（伤-25）——镖钱折半，命和信义都保住了。';
                }
            }
            var r = settle(spec);
            if (!r.ok) return;   // 账没走通，改日再结（回城账不蒸发）
            gl[key] = 'done';
            log(g.settleText + (extra ? ' ' + extra : ''), extra && extra.indexOf('折半') >= 0 ? 'warning' : 'success');
            refresh();
        });
    }
    function gigSection() {
        try {
            var gl = gigsLedger();
            if (!gl) return '';
            var ct = city();
            var bs = ct ? cityBuildings(ct) : [];
            var d = absDay();
            var html = '';
            ['enlist', 'vip'].forEach(function (key) {
                var g = GIGS[key];
                var g0 = gl[key];
                if (g0 === 'done') {
                    html += '<p class="text-xs text-gray-500 mb-1">' + g.icon + ' ' + g.name + '——结过账了（一生一回的大活）。</p>';
                } else if (g0 && typeof g0 === 'object') {
                    html += '<p class="text-xs text-amber-300/80 mb-1">' + g.icon + ' ' + g.name + '：人在外头，第 ' + g0.returnDay + ' 日回城结账' + (d && d < g0.returnDay ? '（还有 ' + (g0.returnDay - d) + ' 日）' : '（就在今日）') + '。</p>';
                } else if (bs.indexOf(g.building) >= 0) {
                    html += '<button onclick="CityJobs.signGig(\'' + key + '\')" class="w-full p-3 rounded mb-2 text-left text-sm bg-amber-900 hover:bg-amber-800 text-white">' +
                        g.icon + ' ' + g.name + '（' + g.days + ' 日程 · 一生一回）' +
                        '<span class="block text-xs text-gray-300 mt-1">' + g.pitch + '</span></button>';
                }
            });
            if (!html) return '';
            return '<div class="border-t border-gray-600 mt-2 pt-2"><p class="text-xs text-gray-300 font-bold mb-1">🎖️ 大差事（一次性多日程——签了就走，回城那日账自己结）</p>' + html + '</div>';
        } catch (e) { return ''; }
    }
    function gigsHere(ct) {
        var bs = cityBuildings(ct);
        var gl = gigsLedger();
        if (!gl) return false;
        for (var k in GIGS) {
            if (bs.indexOf(GIGS[k].building) >= 0 && gl[k] !== 'done') return true;
        }
        return false;
    }

    function onNewDay() {
        try { processAbsence(); } catch (e) {}
        try { settleGigs(); } catch (e) { console.warn('[静默失败] js/city-facilities/city-jobs.js · onNewDay：大差事的回城账没结——这笔钱悬着', e && e.message); }
    }
    try {
        if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') window.timeSystem.onNewDaySubscribe(onNewDay);
    } catch (eSub) {}

    // ============ 面板与弹窗 ============
    function panelHtml(cityName) {
        try {
            var ct = cityName || city();
            var l = ledger();
            var here = (pkCity(city()) === pkCity(ct));
            if (l && pkCity(l.city) === pkCity(ct)) {
                var j = JOBS[l.job];
                var workedToday = here && Number(l.lastWorkDay) === absDay();
                return '<div class="p-2 bg-sky-900/20 rounded border border-sky-800/50">' +
                    '<button onclick="CityJobs.open()" class="w-full text-left text-sm text-sky-300 hover:text-sky-200">' +
                    j.icon + ' 差事：' + j.name + '（工钱一日 ' + wageOf(l.job) + ' 铜' + (workedToday ? ' · 今日已上工' : ' · 今日未上工') + '）</button></div>';
            }
            if (cityName && city() && pkCity(cityName) !== pkCity(city())) return '';
            if (!jobsHere(ct).length && !gigsHere(ct)) return '';
            return '<div class="p-2 bg-sky-900/20 rounded border border-sky-800/50">' +
                '<button onclick="CityJobs.open()" class="w-full text-left text-sm text-sky-300 hover:text-sky-200">💼 寻个差事（城里的长活按日领钱，另有投军、护送贵人的大差事——一生一回）</button></div>';
        } catch (e) { return ''; }
    }

    function render() {
        var l = ledger();
        var html = '';
        if (l) {
            var j = JOBS[l.job];
            var ri = raiseInfo(l.job);
            var home = pkCity(l.city) === pkCity(city());
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
                        j2.icon + ' ' + j2.name + (jb ? '（东家' + jb + '）' : '') + needTxt + '（工钱一日 ' + j2.wage + ' 铜 · 精力-' + j2.energy + ' · 本城声望+' + j2.rep + (j2.perk ? ' · 另有' + Math.round(j2.perk.p * 100) + '%的外快红包' : '') + '）' +
                        '<span class="block text-xs text-gray-400 mt-1">' + j2.desc + '</span></button>';
                }
            }
        }
        html += gigSection();   // v27.3 大差事（投军/护送贵人）——当差与否都摆出来，一生一回
        if (typeof window.showModal === 'function') window.showModal('💼 城里营生', html);
    }
    function open() { render(); return true; }

    window.CityJobs = {
        JOBS: JOBS,
        CFG: CFG,
        GIGS: GIGS,
        ledger: ledger,
        jobsHere: jobsHere,
        wageOf: wageOf,
        raiseInfo: raiseInfo,
        apply: apply,
        quitJob: quitJob,
        work: work,
        signGig: signGig,
        settleGigs: settleGigs,
        gigSection: gigSection,
        gigsHere: gigsHere,
        gigsLedger: gigsLedger,
        processAbsence: processAbsence,
        onNewDay: onNewDay,
        panelHtml: panelHtml,
        open: open,
        render: render
    };
    window.openCityJobs = function () { return open(); };
})();
