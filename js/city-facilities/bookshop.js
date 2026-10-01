// ==================== v25.7 市井烟火批（第一百四十九批）· 书肆淘书 ====================
// 功法残页此前只有两条被动路：特产撞脸、奇遇里 60% 的骰（辨认残页）。没有一处能**主动淘**。
// 本账在商埠城开一间旧书肆：
//   · 货架按「城+日」播种现算（CityFaces/跑单帮同款口径）——同城同日翻来覆去就那五本，换城换日换货；
//   · 架上多是杂书：买了当场翻读，长一点对应的生活技能（学识/口才/商道/医道/音律——走 RewardService
//     统一通道，0~100 封顶收益递减，与勾栏练琴同一把尺）；
//   · 偶尔有珍本（价三倍、长进三倍）；
//   · **捡漏**：每读一本按「学识」掷一骰（底 6% + 学识/250），中了从书里抖出一页手抄功法残页——
//     走 KnowledgeSystem.unlock(…, 'heard') 正门（与奇遇辨认残页同一口径、同一状态阶梯，不开新战力口子）；
//   · 当日当城买过的书划掉（StateRegistry 落档），刷不了同一本。
(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    var CFG = {
        SHELF_N: 5,          // 每日货架几本
        FIND_BASE: 0.06,     // 捡漏底率
        FIND_SKILL_DIV: 250, // 学识加成除数（100 学识 → +0.4）
        READ_MIN: 30         // 每本翻读 30 分钟（1 时辰=120 分钟，四分之一个时辰不到——文案不硬凑）
    };

    // 旧书池（杂书 + 珍本 rare；读它们长对应的生活技能）
    var BOOKS = [
        { id: 'bk_almanac', name: '皇历通书', price: 4, skill: '学识', exp: 1, rare: false, flavor: '宜忌方位节气，翻烂了的江湖人手一册。' },
        { id: 'bk_letters', name: '尺牍新编', price: 5, skill: '口才', exp: 1, rare: false, flavor: '怎么把话说得漂亮——铺子学徒的入门书。' },
        { id: 'bk_ledger', name: '珠算账法', price: 6, skill: '商道', exp: 1, rare: false, flavor: '算盘打得响，账目认得清。' },
        { id: 'bk_herbal', name: '本草拾遗', price: 8, skill: '医道', exp: 1, rare: false, flavor: '乡野郎中手抄的药草图谱，缺了半卷。' },
        { id: 'bk_qin', name: '琴谱残卷', price: 7, skill: '音律', exp: 1, rare: false, flavor: '指法谱子还在，曲子只剩上半阕。' },
        { id: 'bk_geography', name: '九州舆记', price: 9, skill: '学识', exp: 2, rare: false, flavor: '山川道里、风物人情——行万里路前先读它。' },
        { id: 'bk_poetry', name: '千家诗抄', price: 5, skill: '口才', exp: 1, rare: false, flavor: '酒席上应景念两句，谁都高看你一眼。' },
        { id: 'bk_deeds', name: '商贾行状', price: 10, skill: '商道', exp: 2, rare: false, flavor: '前辈商人的起家故事，赔和赚都写在里头。' },
        { id: 'bk_pulse', name: '脉诀浅说', price: 10, skill: '医道', exp: 2, rare: false, flavor: '浮沉迟数——先把四个基本脉认全。' },
        { id: 'bk_stories', name: '志怪夜谭', price: 4, skill: '学识', exp: 1, rare: false, flavor: '狐妖山鬼的段子集，真假各半，好看得紧。' },
        { id: 'bk_rare_canon', name: '前朝文髓（珍本）', price: 24, skill: '学识', exp: 4, rare: true, flavor: '纸色沉黄、装帧讲究——书肆掌柜当镇店的。' },
        { id: 'bk_rare_trade', name: '陶朱遗策（珍本）', price: 28, skill: '商道', exp: 4, rare: true, flavor: '相传是商圣手笔，三阅三不知，越读越深。' },
        { id: 'bk_rare_medic', name: '青囊别录（珍本）', price: 30, skill: '医道', exp: 4, rare: true, flavor: '几味偏方连医馆的老郎中都没见过。' },
        { id: 'bk_rare_music', name: '广陵旧谱（珍本）', price: 26, skill: '音律', exp: 4, rare: true, flavor: '传说里的曲子——谱在，能弹的人不多了。' }
    ];

    var _state = { lastDay: -1, lastCity: '', bought: {} };

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
                var r = window.RewardService.apply(spec, { source: '书肆', city: city() });
                return { ok: !!(r && r.success !== false), note: r && r.messages ? r.messages.join('、') : '' };
            }
        } catch (e) { console.warn('[静默失败] js/city-facilities/bookshop.js · settle：书钱和长进没落成一笔账', e && e.message); }
        return { ok: false, note: '' };
    }
    function shopOk(ct) {
        try {
            var d = window.locationSystem && window.locationSystem.getCityData && window.locationSystem.getCityData(ct || city());
            if (!d || !d.buildings) return false;
            return d.buildings.indexOf('shop') >= 0 || d.buildings.indexOf('market') >= 0;
        } catch (e) { return false; }
    }
    function hash(s) {
        var h = 0;
        for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) % 9973; }
        return h;
    }
    // 货架：城+日播种，五本不重样（同城同日永远同一架书——书肆不是转盘）
    function todayShelf(ct) {
        var key = pkCity(ct || city()) + '_books_' + absDay();
        var shelf = [];
        var used = {};
        for (var i = 0; i < CFG.SHELF_N; i++) {
            var h = hash(key + '_' + i);
            var idx = h % BOOKS.length;
            var guard = 0;
            // 线性探位（步长 1 与书架长度互质——保证五本内必找得到空位，不会原地打转）
            while (used[idx] && guard < BOOKS.length) { idx = (idx + 1) % BOOKS.length; guard++; }
            used[idx] = true;
            shelf.push({ slotIdx: i, book: BOOKS[idx] });
        }
        return shelf;
    }
    function rollDayCity(ct) {
        var d = absDay(), k = pkCity(ct || city());
        if (_state.lastDay !== d || _state.lastCity !== k) {
            _state.lastDay = d; _state.lastCity = k; _state.bought = {};
        }
    }
    function boughtKey(i) { return 'b' + i; }

    // 捡漏：学识掷骰，中了抖出一页手抄功法（KnowledgeSystem 'heard' 正门，与奇遇辨认残页同口径）
    function findRoll() {
        var p = CFG.FIND_BASE;
        try { if (typeof window.getLifeSkill === 'function') p += Math.min(0.4, (Number(window.getLifeSkill('学识')) || 0) / CFG.FIND_SKILL_DIV); } catch (eL) { console.warn('[静默失败] js/city-facilities/bookshop.js · findRoll：学识没读出来，按底率掷', eL && eL.message); }
        if (Math.random() >= p) return null;
        try {
            var pages = window.skillPages || [];
            var KS = window.KnowledgeSystem;
            if (!pages.length || !KS || typeof KS.unlock !== 'function') return null;
            var art = pages[Math.floor(Math.random() * pages.length)];
            if (!art || !art.id) return null;
            KS.unlock(art.id, 'heard', { source: 'bookshop', completeness: 0 });
            return art.name || art.id;
        } catch (eK) { console.warn('[静默失败] js/city-facilities/bookshop.js · findRoll：残页抖出来了却没记上账——这页算佚失', eK && eK.message); }
        return null;
    }

    // ============ 买一本（当场翻读） ============
    function buy(slotIdx) {
        var c = cd();
        if (!c) return false;
        var ct = city();
        if (!shopOk(ct)) { say('📚 这地界没有书肆。', 'info'); return false; }
        if (window.currentBattle) { say('📚 打着架呢，书肆早上了板。', 'warning'); return false; }
        rollDayCity(ct);
        var shelf = todayShelf(ct);
        var row = null;
        for (var i = 0; i < shelf.length; i++) if (shelf[i].slotIdx === slotIdx) row = shelf[i];
        if (!row) { say('📚 架上没有这本。', 'warning'); return false; }
        if (_state.bought[boughtKey(slotIdx)]) { say('📚 这本你今日已经买下翻过了——书肆不做回头客的重复生意。', 'info'); return false; }
        var bk = row.book;
        var r = settle({ copper: -bk.price, lifeSkill: { name: bk.skill, exp: bk.exp } });
        if (!r.ok) { say('📚 ' + bk.price + ' 铜钱的书资都摸不出——你把书轻轻放回架上。', 'warning'); return false; }
        _state.bought[boughtKey(slotIdx)] = bk.id;
        try { if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') window.timeSystem.advanceTime(CFG.READ_MIN, '书肆翻读'); } catch (eT) { console.warn('[静默失败] js/city-facilities/bookshop.js · buy：翻读的时辰没扣', eT && eT.message); }
        var found = findRoll();
        var tail = found ? '翻着翻着，书页里抖出一页手抄的「' + found + '」残页——夹在书里不知多少年了！' : '';
        log('📚 你在' + ct + '的旧书肆买下「' + bk.name + '」当场翻读。' + bk.flavor + (r.note ? '（' + r.note + '）' : '') + (tail ? ' ' + tail : ''), found ? 'success' : 'info');
        say('📚 「' + bk.name + '」——' + bk.flavor + (r.note ? '（' + r.note + '）' : '') + (tail ? '\n✨ ' + tail : ''), found ? 'success' : 'info');
        if (found) {
            try { if (typeof window.growLifeSkill === 'function') window.growLifeSkill('学识', 2, { reason: '旧书里捡了漏' }); } catch (eG) { console.warn('[静默失败] js/city-facilities/bookshop.js · buy：捡漏的学识长进没落账', eG && eG.message); }
        }
        open();   // 重渲货架（买过的划掉）
        return true;
    }

    // ============ 牌面 ============
    function open() {
        var ct = city();
        if (!shopOk(ct)) { say('📚 这地界没有书肆——旧书摊跟着人烟走。', 'info'); return false; }
        rollDayCity(ct);
        var shelf = todayShelf(ct);
        var lv = 0;
        try { if (typeof window.getLifeSkill === 'function') lv = Number(window.getLifeSkill('学识')) || 0; } catch (eL) { console.warn('[静默失败] js/city-facilities/bookshop.js · open：学识没读出来，牌面上按零写', eL && eL.message); }
        var html = '<p class="text-sm text-gray-400 mb-2">旧书肆里纸味陈沉，掌柜趴在柜上打盹。今日架上（每日换货，买过的划掉）：</p>';
        for (var i = 0; i < shelf.length; i++) {
            var row = shelf[i], bk = row.book;
            var sold = !!_state.bought[boughtKey(row.slotIdx)];
            html += '<div class="flex items-center justify-between p-2 bg-gray-800 rounded border border-gray-700 mb-1">' +
                '<span class="text-sm text-gray-200">' + (bk.rare ? '📜' : '📖') + ' ' + bk.name +
                ' <span class="text-xs text-amber-300">' + bk.price + ' 铜钱</span>' +
                ' <span class="text-xs text-gray-500">读之或长' + bk.skill + '</span></span>' +
                (sold ? '<span class="text-xs text-gray-600">已读过</span>'
                    : '<button onclick="CityBookshop.buy(' + row.slotIdx + ')" class="px-3 py-1 rounded text-xs ' + (bk.rare ? 'bg-amber-700 hover:bg-amber-600' : 'bg-indigo-700 hover:bg-indigo-600') + ' text-white">买下翻读</button>') +
                '</div>';
        }
        html += '<p class="text-[11px] text-gray-500 mt-2">你的学识 ' + lv + '——眼力越好，越容易从故纸堆里抖出功法残页（底率 ' + Math.round(CFG.FIND_BASE * 100) + '%，学识每 25 点加 10%）。</p>';
        if (typeof window.showBuildingEffectDialog === 'function') {
            window.showBuildingEffectDialog('📚 旧书肆 · ' + ct, html);
            return true;
        }
        return false;
    }

    function panelHtml(cityName) {
        try {
            if (!shopOk(cityName)) return '';
            if (cityName && city() && pkCity(cityName) !== pkCity(city())) return '';
            return '';   // 不单占面板一行——收进「市井烟火」总门
        } catch (e) { return ''; }
    }

    // ============ 存读档（StateRegistry 正门） ============
    function _export() { return JSON.parse(JSON.stringify(_state)); }
    function _import(s) {
        if (!s || typeof s !== 'object') return;
        _state.lastDay = Number.isFinite(Number(s.lastDay)) ? Number(s.lastDay) : -1;
        _state.lastCity = typeof s.lastCity === 'string' ? s.lastCity : '';
        _state.bought = (s.bought && typeof s.bought === 'object') ? s.bought : {};
    }
    function _reset() { _state = { lastDay: -1, lastCity: '', bought: {} }; }
    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        window.StateRegistry.register('bookshop', { version: 1, export: _export, import: _import, reset: _reset });
    }

    window.CityBookshop = {
        CFG: CFG,
        BOOKS: BOOKS,
        shopOk: shopOk,
        todayShelf: todayShelf,
        buy: buy,
        open: open,
        panelHtml: panelHtml,
        state: _export
    };
    window.openCityBookshop = function () { return open(); };
})();
