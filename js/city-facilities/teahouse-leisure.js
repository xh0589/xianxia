// ==================== 第六十四波 · 茶馆消遣（一盏茶、一局棋、一页墨） ====================
// 老茶馆只有一口 10 灵石的"说书套餐"——听完就走，不能歇脚、不能对弈、不能题诗。
// 本账把茶馆做成真消遣场：听书照旧（visitTeaHouse 原样保留），另开五个口子——
//   🫖 大厅粗茶（3 铜钱，坐着歇歇）/ 🎋 雅座好茶（2 灵石，静心）
//   ♟️ 与茶客对弈（彩头 10 铜钱，棋力吃「学识」）
//   ✒️ 题诗留壁 / 🖌 即景写生（每日各一次，吃「学识」，长「学识」，养心境）
// 纪律：零新存档字段（每日限次走运行时旗，读档清账）；零悟道点（总闸已满）；
//   铜钱彩头是茶客的钱袋，不凭空印——输赢同额、时间与精力照耗；心境走统一结算通道。
// 分城口吻：CityVoices teaHouse 的 idle/chess/poem/paint 键（缺城缺键回落通用词）。
(function () {
    'use strict';

    var CFG = {
        TEA_COPPER: 3, TEA_MOOD: 6, TEA_EN: 15, TEA_MIN: 30,
        ROOM_STONES: 2, ROOM_MOOD: 10, ROOM_EN: 40, ROOM_QI: 20, ROOM_MIN: 60,
        GO_STAKE: 10, GO_WIN_COPPER: 20, GO_WIN_MOOD: 10, GO_LOSE_MOOD: 5,
        GO_WIN_EXP: 3, GO_LOSE_EXP: 1, GO_EN: 5, GO_MIN: 60,
        INK_EN: 3, INK_MIN: 30,
        INK_WIN_MOOD: 8, INK_LOSE_MOOD: 4, INK_WIN_EXP: 2, INK_LOSE_EXP: 1
    };

    function charData() { return window.currentCharData || null; }
    function lifeSkill(name) {
        var c = charData();
        return ((c && c.lifeSkills) || {})[name] || 0;
    }
    function absDay() {
        try {
            if (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') return window.timeSystem.getAbsoluteDay();
            if (window.timeSystem && window.timeSystem.gameTime) return Math.floor((window.timeSystem.gameTime.totalMinutes || 0) / 1440);
        } catch (e) {}
        return 0;
    }
    function vo(key, fallback) {
        var c = charData();
        var city = (c && c.location) || (typeof window.getCurrentCityName === 'function' && window.getCurrentCityName()) || '';
        return (window.CityVoices && typeof window.CityVoices.vo === 'function')
            ? window.CityVoices.vo(city, 'teaHouse', key, fallback) : fallback;
    }
    function addMood(n) {
        var c = charData();
        if (!c) return;
        c.mood = Math.max(0, Math.min(100, Number(c.mood != null ? c.mood : 80) + n));
    }
    function maxEnergy() {
        var m = 100;
        try { if (typeof window.getEffectiveMax === 'function') m = Number(window.getEffectiveMax('energy')) || 100; } catch (e) {}
        return m;
    }
    function addEnergy(n) {
        var c = charData();
        if (!c || n <= 0) return;
        c.energy = Math.min(maxEnergy(), Number(c.energy != null ? c.energy : 0) + n);
    }
    function spendEnergy(n) {
        var c = charData();
        if (!c) return;
        c.energy = Math.max(0, Number(c.energy != null ? c.energy : 100) - n);
    }
    function addQi(n) {
        var c = charData();
        if (!c) return;
        c.qi = Math.max(0, Math.min(Number(c.maxQi) || 999, Number(c.qi || 0) + n));
    }
    function payCopper(n) {
        try {
            if (window.XianXia && window.XianXia.DataManager && typeof window.XianXia.DataManager.deductCopper === 'function') {
                return !!window.XianXia.DataManager.deductCopper(n);
            }
        } catch (e) {}
        var c = charData();
        if (c && Number(c.copper || 0) >= n) { c.copper = Number(c.copper) - n; return true; }
        return false;
    }
    function payStones(n) {
        try {
            if (window.XianXia && window.XianXia.DataManager && typeof window.XianXia.DataManager.deductSpiritStones === 'function') {
                return !!window.XianXia.DataManager.deductSpiritStones(n);
            }
        } catch (e) {}
        var c = charData();
        if (c && Number(c.spiritStones || 0) >= n) { c.spiritStones = Number(c.spiritStones) - n; return true; }
        return false;
    }
    // 长进与彩头走统一结算通道（缺失时直写兜底，账目同额）
    function settle(spec) {
        try {
            if (window.RewardService && typeof window.RewardService.apply === 'function') {
                var r = window.RewardService.apply(spec, { source: '茶馆消遣', city: (charData() || {}).location || '' });
                if (r && r.success !== false) return (r.messages || []).join('、');
            }
        } catch (e) {}
        var parts = [];
        var c = charData();
        if (spec.copper > 0 && c) { c.copper = Number(c.copper || 0) + spec.copper; parts.push('铜钱+' + spec.copper); }
        if (spec.lifeSkill && c) {
            c.lifeSkills = c.lifeSkills || {};
            var ls = spec.lifeSkill;
            var before = Number(c.lifeSkills[ls.name] || 0);
            var after = Math.max(0, Math.min(100, before + ls.exp));
            c.lifeSkills[ls.name] = after;
            if (after !== before) parts.push(ls.name + '+' + (after - before));
        }
        return parts.join('、');
    }
    function spendTime(min, why) {
        try { if (window.timeSystem && window.timeSystem.advanceTime) window.timeSystem.advanceTime(min, why); } catch (e) {}
    }
    function say(m, t) { try { if (window.showMessage) window.showMessage(m, t || 'info'); } catch (e) {} }
    function refresh() { try { if (window.updateCharacterStatus) window.updateCharacterStatus(); } catch (e) {} }

    // ============ 菜单 ============
    function openMenu() {
        var c = charData();
        if (!c) return;
        if (typeof window.showBuildingEffectDialog !== 'function') {
            if (typeof window.visitTeaHouse === 'function') window.visitTeaHouse();
            return;
        }
        var btn = 'class="w-full p-3 rounded mb-2 text-left text-sm text-white hover:opacity-90"';
        var html = '<p class="text-sm text-gray-400 mb-2">茶炉正旺，说书声慢——茶馆里有的是打发时辰的法子：</p>' +
            '<button onclick="TeaHouseLeisure.act(\'story\')" ' + btn.replace('p-3', 'bg-emerald-700 p-3') + '>📖 听说书（10 灵石 · 听近日江湖传闻）</button>' +
            '<button onclick="TeaHouseLeisure.act(\'tea\')" ' + btn.replace('p-3', 'bg-emerald-900 p-3') + '>🫖 大厅粗茶（3 铜钱 · 精力+15 心境+6，坐半个时辰）</button>' +
            '<button onclick="TeaHouseLeisure.act(\'room\')" ' + btn.replace('p-3', 'bg-teal-800 p-3') + '>🎋 雅座好茶（2 灵石 · 精力+40 真气+20 心境+10，静坐一个时辰）</button>' +
            '<button onclick="TeaHouseLeisure.act(\'go\')" ' + btn.replace('p-3', 'bg-amber-800 p-3') + '>♟️ 与茶客对弈一局（彩头 10 铜钱 · 赢了双倍奉还，棋力吃学识）</button>' +
            '<button onclick="TeaHouseLeisure.act(\'poem\')" ' + btn.replace('p-3', 'bg-indigo-800 p-3') + '>✒️ 题诗留壁（每日一次 · 笔墨店家备着，诗名看学识）</button>' +
            '<button onclick="TeaHouseLeisure.act(\'paint\')" ' + btn.replace('p-3', 'bg-purple-800 p-3') + '>🖌️ 即景写生（每日一次 · 画茶楼即景，意在笔先）</button>' +
            '<p class="text-[11px] text-gray-500 mt-1">消遣不长悟道点——茶馆买的是半日闲，不是道行。</p>';
        window.showBuildingEffectDialog('🍵 茶馆·消遣', html);
    }

    // ============ 各口子的账 ============
    function doStory() {
        if (typeof window.visitTeaHouse === 'function') window.visitTeaHouse();
    }
    function doTea() {
        if (!payCopper(CFG.TEA_COPPER)) { say('粗茶也要 ' + CFG.TEA_COPPER + ' 铜钱——茶博士笑呵呵地拎着壶站着，没有赊账的道理。', 'warning'); return; }
        addMood(CFG.TEA_MOOD);
        addEnergy(CFG.TEA_EN);
        spendTime(CFG.TEA_MIN, '茶馆歇脚');
        var idle = vo('idle', '堂里茶客闲话桑麻，说书声、续水声、瓜子壳落碟声混作一团——坐着坐着，人就松了。');
        say('🫖 一壶粗茶下肚，热气从胃里漫到四肢——' + idle + '（精力+' + CFG.TEA_EN + '、心境+' + CFG.TEA_MOOD + '）');
        refresh();
    }
    function doRoom() {
        if (!payStones(CFG.ROOM_STONES)) { say('雅座茶资 ' + CFG.ROOM_STONES + ' 灵石——跑堂的不催，只是帘子不掀。', 'warning'); return; }
        addMood(CFG.ROOM_MOOD);
        addEnergy(CFG.ROOM_EN);
        addQi(CFG.ROOM_QI);
        spendTime(CFG.ROOM_MIN, '茶馆雅座');
        say('🎋 雅座里炭火无声、茶烟笔直，帘子一放，满堂喧闹都隔在外头。你靠着引枕眯了半个时辰，醒来时盏里的茶还温着。（精力+' + CFG.ROOM_EN + '、真气+' + CFG.ROOM_QI + '、心境+' + CFG.ROOM_MOOD + '）');
        refresh();
    }
    function doGo() {
        var c = charData();
        if (!c) return;
        if (Number(c.energy || 0) < CFG.GO_EN) { say('♟️ 你累得捏不稳棋子——对弈耗神，歇足了再来。', 'warning'); return; }
        if (!payCopper(CFG.GO_STAKE)) { say('♟️ 彩头要 ' + CFG.GO_STAKE + ' 铜钱，茶客们把棋盒一盖：「没钱下什么彩棋，看棋去。」', 'warning'); return; }
        spendEnergy(CFG.GO_EN);
        spendTime(CFG.GO_MIN, '茶馆对弈');
        var rival = vo('chess', '邻座的老茶客放下茶盏，捻起一枚黑子朝你示意：「后生，手谈一局？」');
        var prob = Math.min(0.9, 0.35 + lifeSkill('学识') * 0.005);
        var win = Math.random() < prob;
        if (win) {
            var w = settle({ copper: CFG.GO_WIN_COPPER, lifeSkill: { name: '学识', exp: CFG.GO_WIN_EXP } });
            addMood(CFG.GO_WIN_MOOD);
            say('♟️ ' + rival + '……中盘你抢得先手，官子收得干净——赢了两子。围观茶客叫好，彩头照数奉还。（' + (w || '铜钱+' + CFG.GO_WIN_COPPER + '、学识+' + CFG.GO_WIN_EXP) + '、心境+' + CFG.GO_WIN_MOOD + '）', 'success');
        } else {
            var l = settle({ lifeSkill: { name: '学识', exp: CFG.GO_LOSE_EXP } });
            addMood(CFG.GO_LOSE_MOOD);
            say('♟️ ' + rival + '……你前半盘还好，后半盘步步被先手压着——输了。茶客把彩头揣回袖子，倒也不嘲笑：「棋是输熟的，再来。」输棋也长记性。（' + (l || '学识+' + CFG.GO_LOSE_EXP) + '、心境+' + CFG.GO_LOSE_MOOD + '）');
        }
        refresh();
    }
    function doInk(kind) {
        var c = charData();
        if (!c) return;
        var isPoem = kind === 'poem';
        var flag = isPoem ? '_teaPoemDay' : '_teaPaintDay';
        if (Number(c[flag]) === absDay()) {
            say(isPoem ? '✒️ 今日的诗已经题过了——墨迹未干，明天再来留新句。' : '🖌️ 今日已经画过一幅——店家不好意思再裁纸了，明天请早。', 'info');
            return;
        }
        if (Number(c.energy || 0) < CFG.INK_EN) { say('手抖得握不住笔——歇足了再来弄墨。', 'warning'); return; }
        c[flag] = absDay();
        spendEnergy(CFG.INK_EN);
        spendTime(CFG.INK_MIN, isPoem ? '茶馆题诗' : '茶馆写生');
        var prob = isPoem
            ? Math.min(0.9, 0.4 + lifeSkill('学识') * 0.004 + lifeSkill('口才') * 0.002)
            : Math.min(0.9, 0.4 + lifeSkill('学识') * 0.005);
        var win = Math.random() < prob;
        if (isPoem) {
            if (win) {
                settle({ lifeSkill: { name: '学识', exp: CFG.INK_WIN_EXP } });
                addMood(CFG.INK_WIN_MOOD);
                say('✒️ ' + vo('poem', '你借柜上的笔墨立壁前，落成一首七绝——茶客们围看，都道「有点意思」。') + '（学识+' + CFG.INK_WIN_EXP + '、心境+' + CFG.INK_WIN_MOOD + '）', 'success');
            } else {
                settle({ lifeSkill: { name: '学识', exp: CFG.INK_LOSE_EXP } });
                addMood(CFG.INK_LOSE_MOOD);
                say('✒️ 你提笔半晌，落成的打油诗连自己都笑了——邻座茶客客气地念了句「重在参与」。店家把墙擦出一块新白：「不碍事，写坏这墙的多了。」笔秃了也算练过。（学识+' + CFG.INK_LOSE_EXP + '、心境+' + CFG.INK_LOSE_MOOD + '）');
            }
        } else {
            if (win) {
                settle({ lifeSkill: { name: '学识', exp: CFG.INK_WIN_EXP } });
                addMood(CFG.INK_WIN_MOOD);
                say('🖌️ ' + vo('paint', '你在茶案上铺开纸，把眼前的茶客、炉烟、窗外的檐角一一收进画里——笔法生涩，意趣倒是真的。') + '（学识+' + CFG.INK_WIN_EXP + '、心境+' + CFG.INK_WIN_MOOD + '）', 'success');
            } else {
                settle({ lifeSkill: { name: '学识', exp: CFG.INK_LOSE_EXP } });
                addMood(CFG.INK_LOSE_MOOD);
                say('🖌️ 画到一半手生了，茶炉画成了炭盆、檐角画成了鸡冠——你索性题上「写意」二字收笔，倒也有茶客点头：「抽象，但传神。」废纸也是练过。（学识+' + CFG.INK_LOSE_EXP + '、心境+' + CFG.INK_LOSE_MOOD + '）');
            }
        }
        refresh();
    }

    function act(kind) {
        try { if (typeof window.closeBuildingDialog === 'function') window.closeBuildingDialog(); } catch (e) {}
        switch (kind) {
            case 'story': doStory(); break;
            case 'tea': doTea(); break;
            case 'room': doRoom(); break;
            case 'go': doGo(); break;
            case 'poem': doInk('poem'); break;
            case 'paint': doInk('paint'); break;
            default: say('茶馆跑堂的一愣：「客官，没这个点子。」', 'warning');
        }
    }

    window.TeaHouseLeisure = {
        CFG: CFG,
        open: openMenu,
        act: act
    };
})();
