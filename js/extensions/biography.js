// ==================== biography.js - v25.6 生平传记与称号（第一百四十八批 · 玩家心愿批） ====================
// 用户口径：「生平可以有，不过需要考虑性能，如果太耗性能建议默认关闭」。
// 性能答卷：本系统**零实时钩子**——不订阅任何事件、不挂任何每日 tick。
// 传记在**打开面板的那一刻**从既有账本现场编成（天下见闻 ≤100 条 + 存档白名单字段 + 游历账），
// 打开一次算一次，关闭即归零，平时一个字节都不动——不存在「太耗性能」的常驻成本。
// 称号照 travel-journal 的成例：纯派生的名分，不开新的战力口子（不带属性增益）；
// 只有「佩戴中」一个字段落档（StateRegistry 正门，不新开 localStorage 键）。

(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    var _state = { equipped: '' };

    function _cd() { return window.currentCharData || null; }

    function _day() {
        try {
            if (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') {
                var d = window.timeSystem.getAbsoluteDay();
                if (d) return d;
            }
        } catch (e) { console.warn('[静默失败] js/extensions/biography.js · _day：日数没读到，传记按第 1 天起笔', e && e.message); }
        return 1;
    }

    // 历法换算与 time-system 同口径：每 30 天一月、每 12 月一年
    function _dateOf(day) {
        var d = Math.max(1, Number(day) || 1) - 1;
        var y = 1 + Math.floor(d / 360);
        var m = 1 + Math.floor((d % 360) / 30);
        var dd = (d % 30) + 1;
        return '修仙历 ' + y + ' 年 ' + m + ' 月（第 ' + day + ' 日）';
    }

    function _stones() {
        try {
            if (window.inventory && window.inventory.currency) return Number(window.inventory.currency.spiritStones) || 0;
        } catch (e) { console.warn('[静默失败] js/extensions/biography.js · _stones：钱袋没数清，身家按 0 记', e && e.message); }
        var cd = _cd();
        return cd ? (Number(cd.spiritStones) || 0) : 0;
    }

    function _daoNames() {
        var out = [];
        try {
            var cd = _cd();
            var bonds = (cd && cd.bonds) || {};
            for (var id in bonds) {
                if (bonds[id] && bonds[id].type === 'dao_companion') out.push(bonds[id].name || id);
            }
        } catch (e) { console.warn('[静默失败] js/extensions/biography.js · _daoNames：情缘册没翻开，这一章空着', e && e.message); }
        return out;
    }

    // 称号梯子：全部现场派生（打开面板时算），cond 只读现成账。排序即优先级展示序。
    var TITLES = [
        { id: 't_prodigy3', name: '一代天骄', desc: '江湖望风榜前三', cond: function (cd, ctx) { return ctx.rank > 0 && ctx.rank <= 3; } },
        { id: 't_prodigy10', name: '榜上人物', desc: '江湖望风榜前十', cond: function (cd, ctx) { return ctx.rank > 0 && ctx.rank <= 10; } },
        { id: 't_demon80', name: '一步魔尊', desc: '入魔程度 80% 以上仍在行走', cond: function (cd) { return (Number(cd._demonicCorruption) || 0) >= 80; } },
        { id: 't_demon50', name: '半魔之躯', desc: '入魔程度 50% 以上', cond: function (cd) { return (Number(cd._demonicCorruption) || 0) >= 50; } },
        { id: 't_kill300', name: '修罗手段', desc: '亲手斩敌三百', cond: function (cd) { return (Number(cd._killCount) || 0) >= 300; } },
        { id: 't_kill100', name: '杀伐果断', desc: '亲手斩敌一百', cond: function (cd) { return (Number(cd._killCount) || 0) >= 100; } },
        { id: 't_arena30', name: '演武魁首', desc: '演武场胜三十场', cond: function (cd) { return (Number(cd.arenaWins) || 0) >= 30; } },
        { id: 't_fame401', name: '万古流芳', desc: '名气 401 以上', cond: function (cd) { return (Number(cd.fame) || 0) >= 401; } },
        { id: 't_fame76', name: '名动天下', desc: '名气 76 以上', cond: function (cd) { return (Number(cd.fame) || 0) >= 76; } },
        { id: 't_noto60', name: '恶名昭彰', desc: '恶名 60 以上', cond: function (cd) { return (Number(cd.notoriety) || 0) >= 60; } },
        { id: 't_dao', name: '神仙眷侣', desc: '结有道侣', cond: function (cd, ctx) { return ctx.dao.length > 0; } },
        { id: 't_rich', name: '富甲一方', desc: '随身灵石一万以上', cond: function (cd, ctx) { return ctx.stones >= 10000; } },
        { id: 't_fail10', name: '百折不挠', desc: '突破失败十次以上仍在闭关', cond: function (cd) { return (Number(cd._failedBreakthroughs) || 0) >= 10; } },
        { id: 't_top', name: '人间绝巅', desc: '境界登临大乘以上', cond: function (cd, ctx) { return ctx.tier >= 8; } },
        { id: 't_good', name: '善名远播', desc: '因果 50 以上', cond: function (cd) { return (Number(cd.karma) || 0) >= 50; } },
        { id: 't_evil', name: '业障缠身', desc: '因果 -50 以下', cond: function (cd) { return (Number(cd.karma) || 0) <= -50; } }
    ];

    function unlockedTitles() {
        var cd = _cd();
        if (!cd) return [];
        var ctx = _ctx();
        var out = [];
        TITLES.forEach(function (t) {
            try { if (t.cond(cd, ctx)) out.push(t); } catch (e) { console.warn('[静默失败] js/extensions/biography.js · unlockedTitles：一枚称号没验出来，按未解锁记', e && e.message); }
        });
        return out;
    }

    function _ctx() {
        var cd = _cd() || {};
        var rank = 0;
        try {
            if (typeof window.computeJianghuRank === 'function') rank = (window.computeJianghuRank() || {}).playerRank || 0;
        } catch (e) { console.warn('[静默失败] js/extensions/biography.js · _ctx：望风榜没排出来，榜上称号这一轮空着', e && e.message); }
        var tier = 0;
        try { if (typeof window.getRealmTier === 'function') tier = window.getRealmTier(cd.realm) || 0; } catch (e2) { console.warn('[静默失败] js/extensions/biography.js · _ctx：境界尺没量出来，绝巅称号这一轮空着', e2 && e2.message); }
        return { rank: rank, tier: tier, stones: _stones(), dao: _daoNames() };
    }

    function equipTitle(id) {
        if (!id) { _state.equipped = ''; if (window.showMessage) window.showMessage('已卸下称号——江湖还是叫你本名。', 'info'); return true; }
        var ok = unlockedTitles().some(function (t) { return t.id === id; });
        if (!ok) { if (window.showMessage) window.showMessage('这枚称号还没到你手上。', 'warning'); return false; }
        _state.equipped = id;
        var t = TITLES.filter(function (x) { return x.id === id; })[0];
        if (window.showMessage) window.showMessage('🎖️ 已佩戴「' + (t ? t.name : id) + '」——名分而已，拳脚还得自己练。', 'success');
        return true;
    }

    function getEquippedTitle() {
        if (!_state.equipped) return '';
        var t = TITLES.filter(function (x) { return x.id === _state.equipped; })[0];
        return t ? t.name : '';
    }

    // 现场编书：打开面板时算一次，平时零成本
    function compileBiography() {
        var cd = _cd();
        if (!cd) return null;
        var ctx = _ctx();
        var chapters = [];
        var realmTxt = cd.realm || '凡人';
        var fameTxt = '无名之辈';
        try { if (typeof window.getFameLevel === 'function') fameTxt = window.getFameLevel(cd).name; } catch (eF) { console.warn('[静默失败] js/extensions/biography.js · compileBiography：名气档位没查出来，按无名之辈记', eF && eF.message); }
        chapters.push({
            title: '卷一 · 其人',
            lines: [
                (cd.name || '无名客') + '，修行至今 ' + _day() + ' 日，现在境界：' + realmTxt + '。',
                '江湖给的场面话：' + fameTxt + '。' + (ctx.rank ? '望风榜上排第 ' + ctx.rank + ' 位。' : '望风榜上还寻不见名字。'),
                ctx.dao.length ? '情缘册上有名：' + ctx.dao.join('、') + '。' : '情缘一栏，至今空着。',
                '随身家当 ' + ctx.stones + ' 灵石。' + ((Number(cd.notoriety) || 0) >= 40 ? '官府的通缉画影上有你的脸。' : '')
            ]
        });
        // 卷二 · 编年：天下见闻按日子正序（旧的在上），封顶 40 行——书要能读完
        var journal = [];
        try {
            if (window.WorldJournal && typeof window.WorldJournal.getJournalEntries === 'function') {
                journal = (window.WorldJournal.getJournalEntries() || []).slice();
            }
        } catch (eJ) { console.warn('[静默失败] js/extensions/biography.js · compileBiography：天下见闻没借到手，编年这一卷薄了', eJ && eJ.message); }
        journal.sort(function (a, b) { return (a.day || 0) - (b.day || 0); });
        var yearLines = journal.slice(-40).map(function (e) {
            return _dateOf(e.day || 1) + '　' + (e.title || '') + (e.text ? '：' + e.text : '');
        });
        // 游历账：初至一域也是编年大事——问账主的只读窗（TravelJournal.regionLog），不自己伸手翻角色账
        try {
            var regions = {};
            if (window.TravelJournal && typeof window.TravelJournal.regionLog === 'function') regions = window.TravelJournal.regionLog() || {};
            Object.keys(regions).forEach(function (r) {
                yearLines.push(_dateOf(regions[r]) + '　初至「' + r + '」');
            });
            yearLines.sort();
        } catch (eT) { console.warn('[静默失败] js/extensions/biography.js · compileBiography：游历账没翻开，行旅的日子缺了几笔', eT && eT.message); }
        chapters.push({
            title: '卷二 · 编年',
            lines: yearLines.length ? yearLines.slice(-46) : ['（天下见闻还是空的——走出去，事才会记到你头上。）']
        });
        // 卷三 · 数目：一生的账脚
        chapters.push({
            title: '卷三 · 数目',
            lines: [
                '亲手斩敌 ' + (Number(cd._killCount) || 0) + '。演武场胜 ' + (Number(cd.arenaWins) || 0) + ' 场。',
                '突破失手 ' + (Number(cd._failedBreakthroughs) || 0) + ' 次。因果 ' + (Number(cd.karma) || 0) + '。',
                '入魔程度 ' + (Number(cd._demonicCorruption) || 0) + '%' + ((Number(cd._demonicCorruption) || 0) >= 50 ? '——魔性已经长进骨头里了。' : '。')
            ]
        });
        // 判词
        var verdict;
        if ((Number(cd._demonicCorruption) || 0) >= 80) verdict = '此人半只脚已在魔道，书到这里，说书人压低了声音。';
        else if ((Number(cd._killCount) || 0) >= 300) verdict = '一生杀伐太重，江湖提起这个名字，先摸一摸自己的兵器。';
        else if ((Number(cd.karma) || 0) >= 50) verdict = '善缘结满一路，这笔账天地都记着。';
        else if (ctx.rank && ctx.rank <= 3) verdict = '望风榜前三的名字——后人的话本里，少不了这一页。';
        else if ((Number(cd.fame) || 0) >= 76) verdict = '名头响亮，走到哪都有人认得——是福是祸，自己掂量。';
        else verdict = '路还长，书还没写到一半——往后的日子，自己落笔。';
        return { chapters: chapters, verdict: verdict, unlocked: unlockedTitles() };
    }

    var _panelHandle = null;
    function openBiographyPanel() {
        var cd = _cd();
        if (!cd) { if (window.showMessage) window.showMessage('请先创建角色进入游戏。', 'info'); return; }
        var book = compileBiography();
        if (!book) return;
        var equippedName = getEquippedTitle();
        var titleHtml = TITLES.map(function (t) {
            var has = book.unlocked.some(function (u) { return u.id === t.id; });
            var worn = _state.equipped === t.id;
            if (has) {
                return '<span class="inline-flex items-center gap-1 mr-2 mb-2 px-2 py-1 rounded border text-xs ' + (worn ? 'border-yellow-400 bg-yellow-500/10 text-yellow-300' : 'border-gray-600 bg-gray-900/40 text-gray-300') + '">'
                    + '🎖️ ' + t.name + '<span class="text-gray-500">（' + t.desc + '）</span>'
                    + '<button onclick="Biography.equip(\'' + t.id + '\'); Biography.reopen();" class="ml-1 ' + (worn ? 'text-gray-400' : 'text-yellow-400 hover:text-yellow-300') + '">' + (worn ? '卸下' : '佩戴') + '</button></span>';
            }
            return '<span class="inline-flex items-center mr-2 mb-2 px-2 py-1 rounded border border-gray-800 bg-gray-900/20 text-xs text-gray-600" title="' + t.desc + '">🔒 ' + t.name + '<span class="text-gray-700">（' + t.desc + '）</span></span>';
        }).join('');
        var chapHtml = book.chapters.map(function (c) {
            return '<div class="mb-4"><h4 class="font-bold text-amber-400 text-sm mb-2">' + c.title + '</h4>'
                + c.lines.map(function (l) { return '<p class="text-xs text-gray-300 leading-relaxed mb-1">' + (window.esc ? window.esc(l) : l) + '</p>'; }).join('')
                + '</div>';
        }).join('');
        var html = '<p class="text-xs text-gray-400 mb-3">这本书是打开的这一刻从你的账上现编的——平时不占一丝气力。称号只是名分，不带拳脚。</p>'
            + '<p class="text-sm text-gray-200 mb-3">江湖称你：<span class="text-yellow-300 font-bold">' + (equippedName || '（还没佩戴称号）') + '</span></p>'
            + '<div class="mb-4"><h4 class="font-bold text-amber-400 text-sm mb-2">生平称号</h4>' + titleHtml + '</div>'
            + chapHtml
            + '<div class="border-t border-gray-700 pt-3"><p class="text-sm text-yellow-200 italic">判词：' + book.verdict + '</p></div>';
        if (typeof window.showModal === 'function') {
            // 重开先收旧页——模态是栈制的，不收旧的会一层层叠上天
            try { if (_panelHandle && typeof _panelHandle.close === 'function') _panelHandle.close(); } catch (eC) { console.warn('[静默失败] js/extensions/biography.js · open：旧面板没关掉，屏幕上可能叠了两本传记', eC && eC.message); }
            _panelHandle = window.showModal('📖 我的生平', html);
        }
    }

    function _export() { return { equipped: _state.equipped }; }
    function _import(s) { _state.equipped = (s && typeof s.equipped === 'string') ? s.equipped : ''; }
    function _reset() { _state = { equipped: '' }; }
    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        window.StateRegistry.register('biography', { version: 1, export: _export, import: _import, reset: _reset });
    }

    window.Biography = {
        TITLES: TITLES,
        compile: compileBiography,
        unlockedTitles: unlockedTitles,
        equip: equipTitle,
        getEquippedTitle: getEquippedTitle,
        open: openBiographyPanel,
        reopen: function () { try { openBiographyPanel(); } catch (e) { console.warn('[静默失败] js/extensions/biography.js · reopen：传记没重开，佩戴的样子没刷出来', e && e.message); } }
    };
    window.openBiographyPanel = openBiographyPanel;
})();
