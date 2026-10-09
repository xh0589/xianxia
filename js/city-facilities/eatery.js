// ==================== v25.7 市井烟火批（第一百四十九批）· 下馆子 ====================
// 酒楼柜上此前只有一碟「快餐」（30 铜钱、能量+40 的野外口径）和两杯情报酒——没有一桌正经饭。
// 本账在有酒楼的城里开两档吃食：
//   · 家常饭（10 铜）：走饱食度正门（satietySystem.eat 28，与吃干粮同一本账）+ 精力小回，30 分钟；
//   · 本帮招牌（50 铜）：菜名吃 cityData.specialties **真源**——特产里有能下锅的（鱼/芝/果/酒/茶…
//     按关键字筛），就以它入菜；筛不出就退回「老店招牌菜」。除饱食+心境+精力外，带一个**短时小加成**
//     （力量/体质各 +4%，四个游戏小时——走 activeBuffs 通用账，到期自散，不开永久战力口子），
//     每城每日一桌（跑城刷席不刷第二桌，当日旗不落档——庙会节令小吃同款口径）。
// 饱食度闸诚实：辟谷中不点菜、吃撑了塞不进，钱一分不扣（satietySystem.canEat 正门）。
(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    var CFG = {
        HOME_COPPER: 10,
        HOME_MIN: 30,
        HOME_SATIETY: 28,     // 与 satietySystem.MEAL_GAIN 同数（一顿饭的口径）
        HOME_ENERGY: 20,
        SPEC_COPPER: 50,
        SPEC_MIN: 60,
        SPEC_SATIETY: 35,
        SPEC_ENERGY: 30,
        SPEC_MOOD: 6,
        BUFF_HOURS: 4,
        BUFF_FRAC: 0.04       // 力量/体质各 +4%（sectBuffAttrBonus 对 <1 的数按百分比折六维）
    };

    // 能下锅的特产关键字（specialties 是显示名——'御用丹药''宫廷秘法'这类不进锅）
    var FOOD_KEYS = ['鱼', '鲤', '芝', '果', '酒', '茶', '糕', '肉', '米', '粮', '鲜', '参', '笋', '蜜', '酪', '羹', '虾', '蟹', '禽', '蛋', '蔬', '菌', '莲', '枣', '瓜', '豆', '蜜', '露', '桃', '笋'];

    var _specFlag = { day: -1, city: '' };   // 招牌菜当日旗（运行时旗，庙会同款口径——不落档）

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
                var r = window.RewardService.apply(spec, { facilitySpend: true, source: '下馆子', city: city() });
                return { ok: !!(r && r.success !== false), note: r && r.messages ? r.messages.join('、') : '' };
            }
        } catch (e) { console.warn('[静默失败] js/city-facilities/eatery.js · settle：饭钱和舒坦没落成一笔账', e && e.message); }
        return { ok: false, note: '' };
    }
    function eateryOk(ct) {
        try {
            var d = window.locationSystem && window.locationSystem.getCityData && window.locationSystem.getCityData(ct || city());
            if (!d || !d.buildings) return false;
            return d.buildings.indexOf('tavern') >= 0;
        } catch (e) { return false; }
    }

    // 本帮招牌：特产真源里筛能下锅的头一样（筛不出退回通用招牌）
    function specialDish(ct) {
        try {
            var d = window.locationSystem && window.locationSystem.getCityData && window.locationSystem.getCityData(ct || city());
            var specs = (d && d.specialties) || [];
            for (var i = 0; i < specs.length; i++) {
                var nm = String(specs[i] || '');
                for (var j = 0; j < FOOD_KEYS.length; j++) {
                    if (nm.indexOf(FOOD_KEYS[j]) >= 0) return { name: nm, from: true };
                }
            }
        } catch (e) { console.warn('[静默失败] js/city-facilities/eatery.js · specialDish：特产单子没读出来，上通用招牌', e && e.message); }
        return { name: '老店招牌菜', from: false };
    }
    function specEatenToday(ct) {
        return _specFlag.day === absDay() && pkCity(_specFlag.city) === pkCity(ct || city());
    }
    function nowMinute() {
        try {
            if (window.GameScheduler && typeof window.GameScheduler.nowMinute === 'function') return window.GameScheduler.nowMinute();
            if (window.timeSystem && window.timeSystem.gameTime) return Number(window.timeSystem.gameTime.totalMinutes) || 0;
        } catch (e) { return 0; }
        return 0;
    }
    // 短时小加成：走 activeBuffs 通用账（到期自散）。window.applyBuff 正门在位就用它，
    // 不在位照同款口径直写——两条路写的是同一本账。
    function applyMealBuff() {
        var effects = { strength: CFG.BUFF_FRAC, constitution: CFG.BUFF_FRAC };
        try {
            if (typeof window.applyBuff === 'function') { window.applyBuff('eatery_special', effects, CFG.BUFF_HOURS); return true; }
            window.activeBuffs = window.activeBuffs || {};
            window.activeBuffs['eatery_special'] = { effects: effects, expiryGameMinute: nowMinute() + CFG.BUFF_HOURS * 60, duration: CFG.BUFF_HOURS };
            return true;
        } catch (e) { console.warn('[静默失败] js/city-facilities/eatery.js · applyMealBuff：这口加成没挂上——菜照吃，力气没多', e && e.message); }
        return false;
    }

    // 饱食度闸（诚实拒绝，钱不扣）
    function bellyGate() {
        try {
            if (window.satietySystem && typeof window.satietySystem.canEat === 'function') {
                if (window.satietySystem.canEat()) return true;
                say(window.satietySystem.isFasting && window.satietySystem.isFasting()
                    ? '🍲 辟谷期中——烟火食不入喉，掌柜的见怪不怪地把菜单收了。'
                    : '🍲 你撑得一口都塞不下了——掌柜笑道：「客官先消消食。」', 'info');
                return false;
            }
        } catch (e) { console.warn('[静默失败] js/city-facilities/eatery.js · bellyGate：饱食度账没问成，按吃得下算', e && e.message); }
        return true;
    }

    // v27.13：①-新增-4 辟谷态下馆子——需求没了，烟火还在（菜照上、账照结，只添一句人话）。
    // 赴宴豁免走 canEat 正门（satiety.js 全辟不设肚子闸），这里只管把「仙凡之别」说出口。
    function fastFlavor() {
        try {
            if (window.satietySystem && typeof window.satietySystem.fastingTier === 'function') {
                var t = window.satietySystem.fastingTier();
                if (t >= 2) return '（谷气早断——这一桌是念旧，不是充饥。）';
                if (t === 1) return '（辟谷之人浅尝辄止——闻见炊烟，像闻见一段前尘。）';
            }
        } catch (e) { console.warn('[静默失败] js/city-facilities/eatery.js · fastFlavor：辟谷档没读出来，菜照旧上', e && e.message); }
        return '';
    }

    // ============ 点菜 ============
    function eat(kind) {
        var c = cd();
        if (!c) return false;
        var ct = city();
        if (!eateryOk(ct)) { say('🍲 这地界没有酒楼馆子。', 'info'); return false; }
        if (window.currentBattle) { say('🍲 打着架呢，饭后再说。', 'warning'); return false; }
        if (!bellyGate()) return false;

        if (kind === 'special') {
            if (specEatenToday(ct)) { say('🍲 本帮招牌今日已点过一桌——掌柜拱手：「好菜不贪多，明日请早。」', 'info'); return false; }
            var dish = specialDish(ct);
            var r2 = settle({ copper: -CFG.SPEC_COPPER, mood: CFG.SPEC_MOOD, energy: CFG.SPEC_ENERGY });
            if (!r2.ok) { say('🍲 ' + CFG.SPEC_COPPER + ' 铜钱的席面都付不起——掌柜的把菜单轻轻合上了。', 'warning'); return false; }
            try { if (window.satietySystem && typeof window.satietySystem.eat === 'function') window.satietySystem.eat(CFG.SPEC_SATIETY); } catch (eS) { console.warn('[静默失败] js/city-facilities/eatery.js · eat：这桌菜的饱食没落账', eS && eS.message); }
            var buffed = applyMealBuff();
            _specFlag = { day: absDay(), city: ct };
            try { if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') window.timeSystem.advanceTime(CFG.SPEC_MIN, '下馆子·本帮招牌'); } catch (eT) { console.warn('[静默失败] js/city-facilities/eatery.js · eat：招牌菜的时辰没扣', eT && eT.message); }
            log('🍲 你在' + ct + '的酒楼点了一桌「' + dish.name + '」' + (dish.from ? '——本地特产入菜，别处吃不着这口' : '') + '。' + (r2.note ? '（' + r2.note + '）' : '') + (buffed ? '（浑身熨帖：力量/体质 +' + Math.round(CFG.BUFF_FRAC * 100) + '%，撑 ' + CFG.BUFF_HOURS + ' 个游戏小时）' : ''), 'success');
            say('🍲 一桌「' + dish.name + '」端上来，热气扑面。' + (dish.from ? '这口只有' + ct + '做得地道。' : '老店的手艺，火候到家。') + (r2.note ? '（' + r2.note + '）' : '') + (buffed ? '（力量/体质 +' + Math.round(CFG.BUFF_FRAC * 100) + '%，' + CFG.BUFF_HOURS + ' 小时内管用）' : '') + fastFlavor(), 'success');
        } else {
            var r1 = settle({ copper: -CFG.HOME_COPPER, energy: CFG.HOME_ENERGY });
            if (!r1.ok) { say('🍲 摸遍口袋凑不出 ' + CFG.HOME_COPPER + ' 铜钱——你讪讪退出店门。', 'warning'); return false; }
            try { if (window.satietySystem && typeof window.satietySystem.eat === 'function') window.satietySystem.eat(CFG.HOME_SATIETY); } catch (eS2) { console.warn('[静默失败] js/city-facilities/eatery.js · eat：家常饭的饱食没落账', eS2 && eS2.message); }
            try { if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') window.timeSystem.advanceTime(CFG.HOME_MIN, '下馆子·家常饭'); } catch (eT2) { console.warn('[静默失败] js/city-facilities/eatery.js · eat：家常饭的时辰没扣', eT2 && eT2.message); }
            log('🍲 你在' + ct + '的酒楼吃了顿家常饭。' + (r1.note ? '（' + r1.note + '）' : ''), 'info');
            say('🍲 一菜一汤一碗饭，吃得肚圆。（饱食+' + CFG.HOME_SATIETY + (r1.note ? '，' + r1.note : '') + '）' + fastFlavor(), 'success');
        }
        try { if (typeof window.closeBuildingDialog === 'function') window.closeBuildingDialog(); } catch (eC) { return true; }
        try { if (window.updateCharacterStatus) window.updateCharacterStatus(); } catch (eU) { console.warn('[静默失败] js/city-facilities/eatery.js · eat：吃完面板没刷新', eU && eU.message); }
        return true;
    }

    function open() {
        var ct = city();
        if (!eateryOk(ct)) { say('🍲 这地界没有酒楼馆子。', 'info'); return false; }
        var dish = specialDish(ct);
        var belly = '';
        try { if (window.satietySystem && typeof window.satietySystem.statusText === 'function') belly = '（眼下肚子：' + window.satietySystem.statusText() + '）'; } catch (eB) { console.warn('[静默失败] js/city-facilities/eatery.js · open：肚子状态没读出来，牌面上不写', eB && eB.message); }
        // v27.13：设施联动（⑤改良——赌坊赢了钱→酒楼消费的市井气）。读赌坊当日状态递一句承接文案：
        // 请过客的（treatDay=今日）跑堂的认得阔客；大赢没请的（treatHotDay=今日）跑堂的撺掇挥霍。
        // 纯文案口——不建状态不入账，钱照旧走点菜正门（点不点、花多少都是现成的菜单）。
        var denLine = '';
        try {
            var den = (window.GambleDen && typeof window.GambleDen.state === 'function') ? window.GambleDen.state() : null;
            var dDay = absDay();
            if (den && (Number(den.treatDay) === dDay || Number(den.treatHotDay) === dDay)) {
                denLine = Number(den.treatDay) === dDay
                    ? '跑堂的老远就迎上来：「这位客官晌午在赌坊请全场喝了一轮，好气派！——小的给您挑个好座！」'
                    : '跑堂的凑趣低声道：「听说客官今儿在赌坊手气旺——赢了钱，不去后厨点桌好的？」';
            }
        } catch (eDen) { console.warn('[静默失败] js/city-facilities/eatery.js · open：赌坊的市井气没递过来', eDen && eDen.message); }
        var btn = 'class="w-full p-3 rounded mb-2 text-left text-sm text-white hover:opacity-90"';
        var html = '<p class="text-sm text-gray-400 mb-2">酒楼里人声鼎沸，跑堂的搭着巾子过来：「客官用点什么？」' + belly + '</p>' +
            (denLine ? '<p class="text-xs text-amber-300 mb-2">' + denLine + '</p>' : '') +
            '<button onclick="CityEatery.eat(\'home\')" ' + btn.replace('p-3', 'bg-orange-900 p-3') + '>🍚 家常饭（' + CFG.HOME_COPPER + ' 铜钱 · 饱食+' + CFG.HOME_SATIETY + ' 精力+' + CFG.HOME_ENERGY + '，' + CFG.HOME_MIN + ' 分钟）</button>' +
            '<button onclick="CityEatery.eat(\'special\')" ' + btn.replace('p-3', 'bg-amber-800 p-3') + '>🥘 本帮招牌「' + dish.name + '」（' + CFG.SPEC_COPPER + ' 铜钱 · 饱食+' + CFG.SPEC_SATIETY + ' 心境+' + CFG.SPEC_MOOD + '，带 ' + CFG.BUFF_HOURS + ' 个游戏小时的力气' + (specEatenToday(ct) ? '——今日已点过' : '') + '）</button>' +
            (window.NpcBond && typeof window.NpcBond.openTreat === 'function' ? '<button onclick="NpcBond.openTreat()" ' + btn.replace('p-3', 'bg-rose-900 p-3') + '>🍶 邀人同席（请同城的熟脸下馆子——钱翻倍，情分真涨）</button>' : '') +
            '<p class="text-[11px] text-gray-500 mt-1">招牌菜每城每日一桌；加成是短时的小力气，到点自散——吃席吃不出道行。</p>';
        if (typeof window.showBuildingEffectDialog === 'function') {
            window.showBuildingEffectDialog('🍲 下馆子 · ' + ct, html);
            return true;
        }
        return false;
    }

    function panelHtml(cityName) {
        try {
            if (!eateryOk(cityName)) return '';
            if (cityName && city() && pkCity(cityName) !== pkCity(city())) return '';
            return '';   // 不单占面板一行——收进「市井烟火」总门
        } catch (e) { return ''; }
    }

    window.CityEatery = {
        CFG: CFG,
        FOOD_KEYS: FOOD_KEYS,
        eateryOk: eateryOk,
        specialDish: specialDish,
        specEatenToday: specEatenToday,
        eat: eat,
        open: open,
        panelHtml: panelHtml
    };
    window.openCityEatery = function () { return open(); };
})();
