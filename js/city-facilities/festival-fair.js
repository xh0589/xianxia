// ==================== 第六十八波 · 庙会民俗节日（日历上的节，城里真有人过） ====================
// 四时节日（上元/七夕/中秋/除夕）此前只有两条线在过：道侣发帖陪节、灯节夜的集体戏——
// 都是「别人的节」。满城百姓的节没人过：进城看不见庙会，日历上的「中秋灯会」只是氛围轮播字。
// 本账把庙会开起来：逢节日、人在城里，城市面板挂出庙会摊——猜灯谜、放河灯、吃节令小吃、看花灯。
// 纪律：①历法复用节日桥的现成口径（FESTIVAL_DEFS，一年 360 天）——不另造一本历；
//       ②零骰：灯谜对错是定数、当日谜面按城+日播种（同一天谁来猜都是同一盏灯，掌柜不换谜说谎）；
//       ③零新存档字段（每日限次走运行时旗，读档清账）；零悟道点；
//       ④铜钱只出不进：放河灯、吃小吃收铜钱，猜灯中彩只发心境与学识——庙会是散心的去处，不是营生路。
(function () {
    'use strict';

    var YEAR_DAYS = 360;
    var FALLBACK_DEFS = [
        { key: 'shangyuan', name: '上元灯节', doy: 1 },
        { key: 'qixi', name: '七夕', doy: 187 },
        { key: 'zhongqiu', name: '中秋', doy: 225 },
        { key: 'chuxi', name: '除夕', doy: 360 }
    ];

    var CFG = {
        RIDDLE_WIN_MOOD: 8, RIDDLE_WIN_EXP: 2, RIDDLE_LOSE_MOOD: 2, RIDDLE_MIN: 15,
        LANTERN_COPPER: 5, LANTERN_MOOD: 8, LANTERN_KARMA: 1, LANTERN_MIN: 20,
        FOOD_COPPER: 10, FOOD_EN: 30, FOOD_MOOD: 6, FOOD_MIN: 20,
        WATCH_MOOD: 5, WATCH_MIN: 30
    };

    var FEST_META = {
        shangyuan: {
            icon: '🏮',
            scene: '上元灯节，满城花灯。灯市口支起灯谜摊，猜中了掌柜送一句彩头话，猜不中也送一句吉利话——横竖都是欢喜。',
            food: '元宵', foodDesc: '一碗热元宵端上来，芝麻馅烫嘴。上元的甜，是要趁热吃的。',
            watch: '灯市如昼，鱼龙灯一路舞过去。满城的人仰头看灯，灯也照着满城的人——你站在桥头看了半晌，浑身的寒气都看散了。',
            lantern: '你为上元点一盏走马灯放进水里。灯影转了一圈，像把这一年的开端转了个圆满。'
        },
        qixi: {
            icon: '🌌',
            scene: '七夕今宵，鹊桥星河。庙会上多是成双的人，也有独个儿来穿针乞巧的——各有各的心事，各拜各的星。',
            food: '巧果', foodDesc: '巧果炸得金黄，咬一口酥到心里。七夕的巧果，吃的是个「巧」字。',
            watch: '年轻人在月下穿针乞巧，谁穿得快，谁这一年就手巧。你凑热闹也穿了一回——针没穿进去，倒穿了一肚子少年心气。',
            lantern: '你放一盏河灯，为那个没等到的人。灯顺水漂远，替你把没说完的话捎走了。'
        },
        zhongqiu: {
            icon: '🌕',
            scene: '中秋月满，桂子飘香。月饼摊、花灯摊一路排开，空气里都是甜和团圆的味道。',
            food: '月饼', foodDesc: '月饼切成几瓣，摊主一人递一瓣。中秋的月饼，圆满是要分着吃的。',
            watch: '满月当空，家家户户在院里摆出瓜果。你抬头看那轮月——走再远的路，看的也是同一轮。',
            lantern: '你放一盏河灯，为远方的家人。月圆人不圆，灯替你把思念送到水那头去。'
        },
        chuxi: {
            icon: '🧨',
            scene: '除夕守岁，爆竹桃符。这是一年最后一个庙会——过了今夜，就是新的上元了。',
            food: '年糕', foodDesc: '年糕蒸得软糯，摊主道一声「年年高」。除夕吃这一口，图的是来年节节高。',
            watch: '爆竹声里旧岁去，长街灯火通明，谁都不肯先睡。你混在人堆里守岁，守到子时，满城一齐欢呼。',
            lantern: '你放一年里最后一盏河灯，为过去这一年的自己。灯沉得快——老人说不必难过，灯沉了，是话送到了。'
        }
    };

    var RIDDLES = [
        { q: '身穿青衫，个头不高，满肚子文章。（打一物）', opts: ['竹', '松', '荷'], ans: 0, why: '是竹——一节一节，正像满肚子的文章。' },
        { q: '千条线，万条线，落进水里都不见。（打一物）', opts: ['雪', '雨', '雾'], ans: 1, why: '是雨——雨丝千万条，落进水里就没了踪影。' },
        { q: '小小池塘没有水，里头开朵金花。（打一物）', opts: ['荷塘', '油灯', '金锭'], ans: 1, why: '是油灯——灯盏是池塘，灯芯燃起来就是一朵金花。' },
        { q: '小小金坛圆又圆，里头藏着清汤甜馅。（打一物）', opts: ['金锭', '汤圆', '南瓜'], ans: 1, why: '是汤圆——圆滚滚一只，咬开是甜馅，正合上元的景。' },
        { q: '你走它也走，你停它也停，寸步不离不出声。（打一物）', opts: ['镜', '影', '回声'], ans: 1, why: '是影子——你动它动，你停它停，寸步不离。' },
        { q: '水里生，水里长，穿粉红衣裳，坐绿屋。（打一物）', opts: ['荷', '桃', '梅'], ans: 0, why: '是荷——水里生处水里长，粉红花、绿荷叶，正是它。' }
    ];

    // ============ 历法（复用节日桥口径，不另造历） ============
    function festDefs() {
        var d = window.FESTIVAL_DEFS;
        return (d && d.length) ? d : FALLBACK_DEFS;
    }
    function absDay() {
        try {
            if (window.WorldCalendar && typeof window.WorldCalendar.day === 'number') {
                var w = Math.floor(window.WorldCalendar.day);
                if (w > 0) return w;
            }
            if (typeof window.getAbsoluteDay === 'function') { var g = window.getAbsoluteDay(); if (g) return Math.floor(g); }
            if (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') { var t = window.timeSystem.getAbsoluteDay(); if (t) return Math.floor(t); }
        } catch (e) {}
        return 0;
    }
    function doyOf(d) { return d > 0 ? ((d - 1) % YEAR_DAYS) + 1 : 0; }
    function yearOf(d) { return d > 0 ? Math.floor((d - 1) / YEAR_DAYS) + 1 : 0; }
    // 今天是哪个节（不是节就 null）
    function todayFestival() {
        var d = absDay();
        if (!d) return null;
        var doy = doyOf(d);
        var defs = festDefs();
        for (var i = 0; i < defs.length; i++) {
            if (defs[i].doy === doy) return defs[i];
        }
        return null;
    }
    function isFestivalDay() { return !!todayFestival(); }

    // ============ 小工具 ============
    function charData() { return window.currentCharData || null; }
    function say(m, t) { try { if (window.showMessage) window.showMessage(m, t || 'info'); } catch (e) {} }
    function city() {
        return (charData() && charData().location) ||
            (typeof window.getCurrentCityName === 'function' && window.getCurrentCityName()) || '';
    }
    function inCity() {
        var loc = city();
        if (!loc) return false;
        try {
            if (window.locationSystem && typeof window.locationSystem.getCityData === 'function') return !!window.locationSystem.getCityData(loc);
        } catch (e) {}
        return false;
    }
    // 当日谜面按城+日播种（零骰）
    function festHash(s) {
        var h = 0;
        for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) % 9973; }
        return h;
    }
    function todayRiddle() {
        var d = absDay();
        var h = festHash(city() + '_fair_' + d);
        return RIDDLES[h % RIDDLES.length];
    }
    // 结算统一走通道（mood/karma/学识/精力/铜钱一笔原子入账，缺通道直写兜底）
    function settle(spec) {
        try {
            if (window.RewardService && typeof window.RewardService.apply === 'function') {
                var r = window.RewardService.apply(spec, { source: '庙会', city: city() });
                return r && r.success !== false ? { ok: true, note: (r.messages || []).join('、') } : { ok: false };
            }
        } catch (e) {}
        var c = charData();
        if (!c) return { ok: false };
        var cost = Number(spec.copper || 0);
        if (cost < 0) {
            if (Number(c.copper || 0) + cost < 0) return { ok: false };
            c.copper = Number(c.copper || 0) + cost;
        }
        if (spec.mood) c.mood = Math.max(0, Math.min(100, Number(c.mood != null ? c.mood : 80) + spec.mood));
        if (spec.karma) c.karma = Math.max(-100, Math.min(100, Number(c.karma || 0) + spec.karma));
        if (spec.energy) c.energy = Math.max(0, Math.min(Number(c.maxEnergy) || 100, Number(c.energy != null ? c.energy : 100) + spec.energy));
        if (spec.lifeSkill) {
            c.lifeSkills = c.lifeSkills || {};
            var n = spec.lifeSkill.name;
            c.lifeSkills[n] = Math.max(0, Math.min(100, Number(c.lifeSkills[n] || 0) + spec.lifeSkill.exp));
        }
        return { ok: true, note: '' };
    }
    function spendTime(min, why) {
        try { if (window.timeSystem && window.timeSystem.advanceTime) window.timeSystem.advanceTime(min, why); } catch (e) {}
    }
    function refresh() { try { if (window.updateCharacterStatus) window.updateCharacterStatus(); } catch (e) {} }
    // 第九十五波·NEW-35：放河灯/吃小吃/看花灯的结算只出一句播报，摊前没有后续可点的窗——
    // 流程终点软收庙会面板，别把「已收的场」留在屏上（灯谜有带「回庙会」按钮的结果窗，那个不收）
    function softClose() { try { if (typeof window.closeModalSoft === 'function') window.closeModalSoft(); } catch (e) {} }
    function usedToday(flag) {
        var c = charData();
        return !!c && Number(c[flag]) === absDay() && absDay() > 0;
    }
    function markToday(flag) { var c = charData(); if (c) c[flag] = absDay(); }
    function meta() {
        var f = todayFestival();
        return f ? (FEST_META[f.key] || FEST_META.shangyuan) : null;
    }

    // ============ 城市面板的庙会摊（非节日静默，不占地方） ============
    function panelHtml(cityName) {
        try {
            var f = todayFestival();
            if (!f) return '';
            if (cityName && city() && cityName !== city()) return '';
            var m = FEST_META[f.key] || FEST_META.shangyuan;
            return '<h4 class="text-sm font-bold text-amber-400 mb-2">' + (m.icon || '🏮') + ' ' + f.name + ' · 庙会正开</h4>' +
                '<div class="p-2 bg-amber-900/30 rounded mb-2 border border-amber-700">' +
                '<p class="text-xs text-amber-200/80 mb-2">' + f.name + '，城里搭起了庙会摊——灯谜、河灯、节令小吃，一年就这一日。</p>' +
                '<button onclick="openFestivalFair()" class="w-full text-left text-sm text-amber-300 hover:text-amber-200">🏮 去逛庙会（猜灯谜 · 放河灯 · 吃' + (m.food || '节令小吃') + ' · 看花灯）</button>' +
                '</div>';
        } catch (e) { return ''; }
    }

    // ============ 庙会本体 ============
    function open() {
        var f = todayFestival();
        if (!f) { say('今日不是节令——庙会的棚子还没搭起来，散了。', 'info'); return false; }
        var m = FEST_META[f.key] || FEST_META.shangyuan;
        var btn = 'class="w-full p-3 rounded mb-2 text-left text-sm text-white hover:opacity-90"';
        var html = '<p class="text-sm text-gray-300 mb-3">' + m.scene + '</p>';
        html += '<button onclick="FestivalFair.act(\'riddle\')" ' + btn.replace('p-3', 'bg-amber-700 p-3') + '>🏮 猜灯谜（免费 · 猜中掌柜送彩，长见识养心境）' + (usedToday('_fairRiddleDay') ? '　✅ 今日已猜' : '') + '</button>';
        html += '<button onclick="FestivalFair.act(\'lantern\')" ' + btn.replace('p-3', 'bg-rose-800 p-3') + '>🕯️ 放河灯（' + CFG.LANTERN_COPPER + ' 铜钱 · 寄一段思念，积一分因果）' + (usedToday('_fairLanternDay') ? '　✅ 今日已放' : '') + '</button>';
        html += '<button onclick="FestivalFair.act(\'food\')" ' + btn.replace('p-3', 'bg-orange-800 p-3') + '>🍡 吃' + (m.food || '节令小吃') + '（' + CFG.FOOD_COPPER + ' 铜钱 · 精力+' + CFG.FOOD_EN + ' 心境+' + CFG.FOOD_MOOD + '）' + (usedToday('_fairFoodDay') ? '　✅ 今日已尝' : '') + '</button>';
        html += '<button onclick="FestivalFair.act(\'watch\')" ' + btn.replace('p-3', 'bg-indigo-800 p-3') + '>🎆 看花灯（免费 · 凑个热闹，心境+' + CFG.WATCH_MOOD + '）' + (usedToday('_fairWatchDay') ? '　✅ 今日已看' : '') + '</button>';
        html += '<p class="text-[11px] text-gray-500 mt-1">庙会一年只开这一日——铜钱只花不赚，换来的是心气与念想。</p>';
        if (typeof window.showModal === 'function') { window.showModal((m.icon || '🏮') + ' ' + f.name + ' · 庙会', html); return true; }
        say('🏮 今日' + f.name + '，城里正开庙会。');
        return true;
    }

    function act(kind) {
        var f = todayFestival();
        if (!f) { say('庙会的棚子已经拆了——节过完了。', 'info'); return; }
        switch (kind) {
            case 'riddle': askRiddle(); break;
            case 'lantern': doLantern(); break;
            case 'food': doFood(); break;
            case 'watch': doWatch(); break;
            default: say('摊主一愣：「客官，没这个摊子。」', 'warning');
        }
    }

    // —— 猜灯谜：谜面按城+日定死，对错是定数（零骰） ——
    function askRiddle() {
        if (usedToday('_fairRiddleDay')) { say('🏮 今日这盏灯谜你已经猜过了——掌柜的谜库一年就这么几盏，明日请早。', 'info'); return; }
        var r = todayRiddle();
        var html = '<p class="text-sm text-gray-300 mb-1">灯摊掌柜指着走马灯下的一盏纱灯，灯面上写着一行谜：</p>' +
            '<p class="text-base text-amber-300 my-3">「' + r.q + '」</p>' +
            '<p class="text-xs text-gray-500 mb-3">猜中了，掌柜送一句彩头话；猜不中，也图个乐子。</p>';
        var btn = 'class="w-full p-3 rounded mb-2 text-left text-sm bg-amber-900 hover:bg-amber-800 text-white"';
        for (var i = 0; i < r.opts.length; i++) {
            html += '<button onclick="FestivalFair.answer(' + i + ')" ' + btn + '>' + '甲乙丙'.charAt(i) + '. ' + r.opts[i] + '</button>';
        }
        html += '<button onclick="openFestivalFair()" class="w-full p-2 rounded text-xs text-gray-400 hover:text-gray-300">↩️ 不猜了，回庙会逛逛</button>';
        if (typeof window.showModal === 'function') window.showModal('🏮 猜灯谜', html);
    }
    function answer(idx) {
        var f = todayFestival();
        if (!f) { say('庙会的棚子已经拆了。', 'info'); return; }
        if (usedToday('_fairRiddleDay')) { say('🏮 今日这盏灯谜你已经猜过了。', 'info'); return; }
        // 第八十二波·FIX-04：先锁定玩家实际看到的这道题，再推进耗时——
        // 旧序是 耗时→取题→判题，答题耗时跨午夜后取到次日新题，按新题判旧答案（答对判错）
        var r = todayRiddle();
        markToday('_fairRiddleDay');
        spendTime(CFG.RIDDLE_MIN, '庙会猜灯谜');
        var right = Number(idx) === r.ans;
        if (right) {
            var w = settle({ mood: CFG.RIDDLE_WIN_MOOD, lifeSkill: { name: '学识', exp: CFG.RIDDLE_WIN_EXP } });
            refresh();
            // 第九十五波：彩头账只拼一次——统一结算的回执（w.note）本就写着「心境+8、学识+2」，
            // 旧版又在前头手拼一份，玩家看到的是「（心境+8、学识+2；心境+8、学识+2）」
            var winNote = (w && w.note) ? w.note : ('心境+' + CFG.RIDDLE_WIN_MOOD + '、学识+' + CFG.RIDDLE_WIN_EXP);
            if (typeof window.showModal === 'function') {
                window.showModal('🏮 猜灯谜 · 中了', '<p class="text-sm text-emerald-300 mb-2">你报了谜底，掌柜拊掌：「好！这位客官肚子里有货！」围观的人也跟着喝彩。</p>' +
                    '<p class="text-xs text-gray-400 mb-3">' + r.why + '</p>' +
                    '<p class="text-xs text-gray-300 mb-3">谜底解开，心里那点得意比彩头还值钱。（' + winNote + '）</p>' +
                    '<button onclick="openFestivalFair()" class="w-full p-2 rounded text-sm bg-amber-700 hover:bg-amber-600 text-white">↩️ 回庙会接着逛</button>');
            } else say('🏮 灯谜猜中了！（' + winNote + '）', 'success');
        } else {
            settle({ mood: CFG.RIDDLE_LOSE_MOOD });
            refresh();
            var right_ans = r.opts[r.ans];
            if (typeof window.showModal === 'function') {
                window.showModal('🏮 猜灯谜 · 差一层', '<p class="text-sm text-gray-300 mb-2">你报了谜底，掌柜笑着摇头，把纱灯转了个面：「再想想——」到底没舍得叫你空手走，点了谜底。</p>' +
                    '<p class="text-xs text-amber-300 mb-3">谜底是「' + right_ans + '」。' + r.why + '</p>' +
                    '<p class="text-xs text-gray-400 mb-3">没猜中也不亏——听掌柜讲谜底，比猜中还长见识。（心境+' + CFG.RIDDLE_LOSE_MOOD + '）</p>' +
                    '<button onclick="openFestivalFair()" class="w-full p-2 rounded text-sm bg-amber-700 hover:bg-amber-600 text-white">↩️ 回庙会接着逛</button>');
            } else say('🏮 灯谜没猜中，掌柜点了谜底：是「' + right_ans + '」。（心境+' + CFG.RIDDLE_LOSE_MOOD + '）');
        }
    }

    // —— 放河灯 ——
    function doLantern() {
        if (usedToday('_fairLanternDay')) { say('🕯️ 今日你已经放过一盏河灯了——心意到了就好，不必多放。', 'info'); return; }
        var m = meta();
        var r = settle({ copper: -CFG.LANTERN_COPPER, mood: CFG.LANTERN_MOOD, karma: CFG.LANTERN_KARMA });
        if (!r.ok) { say('🕯️ 一盏河灯要 ' + CFG.LANTERN_COPPER + ' 铜钱——你摸遍口袋没凑出来，摊主也不催，只把灯往你这边推了推。', 'warning'); return; }
        markToday('_fairLanternDay');
        spendTime(CFG.LANTERN_MIN, '庙会放河灯');
        refresh();
        say('🕯️ ' + (m ? m.lantern : '你把河灯放进水里，看它载着一点光顺流漂远。') + '（心境+' + CFG.LANTERN_MOOD + '、因果+' + CFG.LANTERN_KARMA + (r.note ? '；' + r.note : '') + '）', 'success');
        softClose();
    }

    // —— 节令小吃 ——
    function doFood() {
        if (usedToday('_fairFoodDay')) { say('🍡 今日已经尝过节令小吃——摊主笑道：「这个点儿的货卖完喽，明日赶早。」', 'info'); return; }
        var m = meta();
        var r = settle({ copper: -CFG.FOOD_COPPER, mood: CFG.FOOD_MOOD });
        if (!r.ok) { say('🍡 一份' + (m ? m.food : '小吃') + '要 ' + CFG.FOOD_COPPER + ' 铜钱——摊主的勺子停在锅上，等你摸钱。', 'warning'); return; }
        markToday('_fairFoodDay');
        var c = charData();
        if (c) c.energy = Math.max(0, Math.min(Number(c.maxEnergy) || 100, Number(c.energy != null ? c.energy : 0) + CFG.FOOD_EN));
        spendTime(CFG.FOOD_MIN, '庙会吃小吃');
        refresh();
        say('🍡 ' + (m ? m.foodDesc : '一份节令小吃下肚，热气从胃里漫开。') + '（精力+' + CFG.FOOD_EN + '、心境+' + CFG.FOOD_MOOD + (r.note ? '；' + r.note : '') + '）', 'success');
        softClose();
    }

    // —— 看花灯 ——
    function doWatch() {
        if (usedToday('_fairWatchDay')) { say('🎆 花灯你已经看过了——灯还是那些灯，再看就该收摊喽。', 'info'); return; }
        var m = meta();
        settle({ mood: CFG.WATCH_MOOD });
        markToday('_fairWatchDay');
        spendTime(CFG.WATCH_MIN, '庙会看花灯');
        refresh();
        say('🎆 ' + (m ? m.watch : '满街花灯看得人眼花缭乱，你在灯下站了半晌，心里那点烦闷被灯光泡软了。') + '（心境+' + CFG.WATCH_MOOD + '）', 'success');
        softClose();
    }

    // ============ 逢节在城里，招呼一声（非弹窗，不压别的戏） ============
    function maybeInvite() {
        try {
            var f = todayFestival();
            if (!f || !inCity()) return;
            var c = charData();
            if (!c || Number(c._fairInviteDay) === absDay()) return;
            c._fairInviteDay = absDay();
            say('🏮 今日' + f.name + '，城里庙会正热闹——城市面板上挂着「去逛庙会」，一年就这一日。', 'info');
        } catch (e) {}
    }
    try {
        if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') window.timeSystem.onNewDaySubscribe(maybeInvite);
        if (window.EventBus && typeof window.EventBus.on === 'function') window.EventBus.on('location:visited', maybeInvite);
    } catch (eSub) {}

    window.FestivalFair = {
        CFG: CFG,
        YEAR_DAYS: YEAR_DAYS,
        RIDDLES: RIDDLES,
        FEST_META: FEST_META,
        todayFestival: todayFestival,
        isFestivalDay: isFestivalDay,
        todayRiddle: todayRiddle,
        inCity: inCity,
        panelHtml: panelHtml,
        open: open,
        act: act,
        answer: answer,
        maybeInvite: maybeInvite
    };
    window.openFestivalFair = function () { return open(); };
})();
