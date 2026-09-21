/**
 * house-panel.js — 第一百零一波 · 洞府翻新
 * 把「一堆按钮的列表页」改成「一处能走的宅子」：
 *   甲 布局图：顶部鸟瞰四间屋子（静室/灵田圃/库房/阵工坊），点哪间切哪间
 *   乙 屋子页签化：设施/阵法/傀儡从二级弹窗升为「阵工坊」页签一级内容，套娃取消
 *   丙 灵田格子化：一畦一格——空畦下种、青苗计日、熟了发亮、蔫了发红
 *   丁 静室收纳修炼：打坐时长/突破/引导灵气/长期闭关/洒扫全住进静室（app.startCultivation 有家者直接跳来）
 *   戊 无府者看铺：置产铺子卡片化（四档宅子对比着买）
 * 纯界面翻新：所有账目照原样调用 house-system / CaveFacilities / FormationSystem / PuppetSystem，存档零迁移。
 *
 * 第一百零二波 · 择地而居（距离感；一百零三波改定：洞府在野不在城）：
 *   己 择山购地：买宅在七处固定洞天里挑山场（每州一座）；就近置办一键落脚下这州的山里
 *   庚 坐落门牌：门牌报「📍坐落某州某山」；人在他州挂黄牌——取道哪几座关、共几里、约几分钟，全按天下疆界的关隘账
 *   辛 路引：从洞府下山去各州的关隘路线/里数/脚程一目了然；人在本州每州一粒「动身」钮
 *   壬 迁址：收现价三成迁址费，灵田灵植法宝收移一株不损
 *   癸 屋里活计回府再做：打坐/突破/收获/下种/摆家具等人不在本州时按下去只会被提醒先回府
 *
 * 第一百零四波 · 山居营造（最开始只有破山洞，材料修出真宅院）：
 *   子 占山：置产铺子头一张卡「破山洞·免费占山」——灵田一畦储物五格，修炼不加成一分
 *   丑 修缮图样：换购改修缮——灵石（补差价）+工料（材料存够几个报几个）+工期（动工真耗时），一级一级修不许跳
 *   寅 破山洞的冷落：阵工坊插不住阵旗（先修缮）；静室一睁眼就看见图样；设施安置也要真材料（工料单在设施账上）
 */
(function () {
    'use strict';

    var _tab = 'jing';          // 当前页签：jing 静室 / tian 灵田圃 / ku 库房 / zhen 阵工坊
    var _plantTarget = -1;      // 灵田圃：点开的下种畦（-1 = 没在选种）
    var _showTradeUp = false;   // 换购更气派宅子的展开态
    var _sitePick = null;       // 择址单：{mode:'buy', type} 或 {mode:'relocate'}（第一百零二波）
    var _showRoads = false;     // 路引（从此处出发的脚程账）展开态（第一百零二波）
    var _primaryUsed = false;   // 本屏是否已经发过金色主按钮——一屏只留一枚

    /** 读数千分位。fmt 取不到时原样返回，不赌加载顺序。 */
    function _num(v) {
        var f = window.XianXia && window.XianXia.fmt;
        return f ? f.num(v) : String(v);
    }

    /** 主按钮发号器：一屏只给第一个开口要 x-cta 的按钮上色（render 里重置） */
    function _cta() {
        if (_primaryUsed) return '';
        _primaryUsed = true;
        return ' x-cta';
    }

    var TABS = [
        { id: 'jing', icon: '🧘', name: '静室' },
        { id: 'tian', icon: '🌱', name: '灵田圃' },
        { id: 'ku', icon: '📦', name: '库房' },
        { id: 'zhen', icon: '🌀', name: '阵工坊' }
    ];

    function hasHouse() { return !!(window.playerHouse && window.playerHouse.type); }
    function house() { return window.playerHouse || null; }
    function htype() {
        var h = house();
        return (h && window.HOUSE_TYPES && window.HOUSE_TYPES[h.type]) || null;
    }
    function n(v, d) { var x = Number(v); return isFinite(x) ? x : (d || 0); }

    // ============ 第一百零二波 · 择地而居的小账房（一百零三波改定：洞府在野，脚程走关隘账） ============
    function _curCity() {
        try {
            if (window.locationSystem && typeof window.locationSystem.getCurrentLocation === 'function') {
                var c = window.locationSystem.getCurrentLocation();
                if (c) return String(c);
            }
        } catch (e) {}
        try { return (window.currentCharData && window.currentCharData.location) || ''; } catch (e2) {}
        return '';
    }
    function _curRegion() {
        try { return (typeof window.currentRegionOfPlayer === 'function' && window.currentRegionOfPlayer()) || ''; } catch (e) { return ''; }
    }
    function _site() {
        try { return (typeof window.getHouseSite === 'function' && window.getHouseSite()) || null; } catch (e) { return null; }
    }
    function _atHome() {
        try { return (typeof window.isAtHome === 'function') ? !!window.isAtHome() : true; } catch (e) { return true; }
    }
    /** 从 from 州到 to 州的路账：取道哪几座关隘、共几里、约几分钟（借天下疆界的现成账） */
    function _routeTo(from, to) {
        try {
            var WM = window.WorldMap;
            if (!WM || !from || !to || !WM.pathBetween) return null;
            if (from === to) return { legs: [], li: 0, minutes: 0, same: true };
            var path = WM.pathBetween(from, to);
            if (!path || path.length < 2) return null;
            var legs = [], li = 0, minutes = 0;
            for (var i = 0; i < path.length - 1; i++) {
                var bd = WM.borderBetween(path[i], path[i + 1]);
                if (!bd) return null;
                legs.push(bd.route);
                li += bd.li || 0;
                minutes += WM.journeyMinutes ? WM.journeyMinutes(bd) : Math.round((bd.li || 60) * 2);
            }
            return { legs: legs, li: li, minutes: minutes, same: false };
        } catch (e) { return null; }
    }

    function upgradeCost() {
        var h = house();
        return 500 * (Object.keys((h && h.upgrades) || {}).length + 1);
    }
    function stones() {
        try { return n(window.inventory && window.inventory.currency && window.inventory.currency.spiritStones); } catch (e) { return 0; }
    }
    function _haveSeed(seedId) {
        if (!seedId) return Infinity;
        try {
            var slots = (window.inventory && window.inventory.slots) || [];
            var c = 0;
            for (var i = 0; i < slots.length; i++) {
                var s = slots[i];
                if (s && s.templateId === seedId) c += n(s.count, 1);
            }
            return c;
        } catch (e) { return 0; }
    }
    function _storageUsed() {
        try {
            var slots = (window.inventory && window.inventory.slots) || [];
            var used = 0;
            for (var i = 0; i < slots.length; i++) if (slots[i]) used++;
            return { used: used, max: n(window.inventory && window.inventory.maxSlots, slots.length) };
        } catch (e) { return { used: 0, max: 0 }; }
    }
    function _cropState(plot, day) {
        if (!plot) return null;
        if (day >= plot.readyDay) {
            var grace = n(window.CROP_GRACE_DAYS, 3);
            return (day > plot.readyDay + grace) ? 'withered' : 'ready';
        }
        return 'growing';
    }
    function _fieldFormationName() {
        try {
            var FS = window.FormationSystem;
            if (!FS || !FS.getState) return '';
            var st = FS.getState() || {};
            var slot = st.field || {};
            if (!slot.formationId) return '';
            var f = FS.getFormation ? FS.getFormation(slot.formationId) : null;
            return f ? f.name : slot.formationId;
        } catch (e) { return ''; }
    }
    function _facilityCount() {
        try {
            var CF = window.CaveFacilities;
            if (!CF || !CF.getFacilities) return 0;
            return (CF.getFacilities('player') || []).length;
        } catch (e) { return 0; }
    }
    function _puppetCount() {
        try {
            var PS = window.PuppetSystem;
            if (!PS || !PS.getState) return 0;
            return ((PS.getState() || {}).puppets || []).length;
        } catch (e) { return 0; }
    }
    function _moodLine() {
        // 与打坐弹窗同款的心境账（第六十七波口径原样搬来）
        try {
            if (!window.MoodSystem || typeof window.MoodSystem.label !== 'function') return '';
            var mNow = window.MoodSystem.moodNow();
            var mLabel = window.MoodSystem.label();
            var mMul = window.MoodSystem.cultivationMul();
            var mPct = Math.round(Math.abs(mMul - 1) * 100);
            var mTail = mMul === 1 ? '（打坐收成不上不下）' : (mMul > 1 ? '（打坐真元 +' + mPct + '%）' : '（打坐真元 -' + mPct + '%）');
            return '<p class="x-meta ' + (mMul >= 1 ? 'x-good' : 'x-bad') + '">当前心境：' + mLabel + '（' + mNow + '/100）' + mTail + '</p>';
        } catch (e) { return ''; }
    }
    function _bonusChips() {
        // 修炼倍率的明细账：宅底/精修/家具/设施/地阵，一项一枚签，总数收口
        var chips = [];
        var total = 1;
        try { total = n(window.getHouseBonus && window.getHouseBonus('cultivation'), 1); } catch (e) {}
        var ht = htype();
        if (ht && ht.bonuses && ht.bonuses.cultivation) chips.push(['宅底', '×' + ht.bonuses.cultivation]);
        var h = house();
        var upLv = ((h && h.upgrades) || {}).cultivation || 0;
        if (upLv > 0) chips.push(['静室精修', '+' + (upLv * 0.05).toFixed(2)]);
        try {
            var furn = n(window.getFurnitureBonus && window.getFurnitureBonus('cultivation'));
            if (furn > 0) chips.push(['聚灵蒲团', '+' + furn.toFixed(2)]);
        } catch (e) {}
        try {
            var expPct = n(window.CaveFacilities && window.CaveFacilities.getBuff && window.CaveFacilities.getBuff('player', 'expBoostPct'));
            if (expPct > 0) chips.push(['洞府设施', '+' + expPct + '%']);
        } catch (e) {}
        try {
            var fPct = n(window.FormationSystem && window.FormationSystem.getBuff && window.FormationSystem.getBuff('field', 'expBoostPct'));
            if (fPct > 0) chips.push(['聚灵地阵', '+' + fPct + '%']);
        } catch (e) {}
        // 第一百零六波：宅基洞天的地脉也挂签——住哪座山吃哪条脉，账面上看得见
        try {
            var ley = window.getCaveLey && window.getCaveLey();
            if (ley && ley.kind === 'cultivation' && ley.pct > 0) chips.push(['地脉·' + ley.name, '+' + ley.pct + '%']);
        } catch (eLey) {}
        var html = '<p class="x-h2 mb-1">修炼倍率 <span class="x-num">×' + total.toFixed(2) + '</span></p>';
        if (chips.length) {
            html += '<div class="flex flex-wrap gap-1 mb-2">' + chips.map(function (c) {
                return '<span class="x-chip">' + c[0] + ' ' + c[1] + '</span>';
            }).join('') + '</div>';
        }
        return html;
    }

    // ==================== 甲 · 布局图 ====================
    function _mapHtml() {
        var h = house(), ht = htype();
        var day = 0;
        try { day = n(window.getHouseGameDay && window.getHouseGameDay()); } catch (e) {}
        var planted = (h && h.planted) || [];
        var slots = 0;
        try { slots = n(window.getHousePlotSlots && window.getHousePlotSlots()); } catch (e) {}
        var readyN = 0, witheredN = 0;
        planted.forEach(function (p) {
            var st = _cropState(p, day);
            if (st === 'ready') readyN++;
            if (st === 'withered') witheredN++;
        });
        var cultTotal = 1;
        try { cultTotal = n(window.getHouseBonus && window.getHouseBonus('cultivation'), 1); } catch (e) {}
        var storage = _storageUsed();
        var fmtName = _fieldFormationName();
        var furn = (h && h.furniture) || [];
        var moodShort = '';
        try { if (window.MoodSystem && window.MoodSystem.label) moodShort = window.MoodSystem.label(); } catch (e) {}

        function room(tabId, icon, name, lines, badge) {
            var active = _tab === tabId;
            return '<button onclick="HousePanelUI._setTab(\'' + tabId + '\')" class="x-room ' + (active ? 'x-room--on' : '') + '">' +
                '<p class="x-room-t">' + icon + ' ' + name + (badge || '') + '</p>' +
                lines.map(function (l) { return '<p class="x-pip ' + (l[1] || '') + '">' + l[0] + '</p>'; }).join('') +
                '</button>';
        }
        var rooms = '';
        rooms += room('jing', '🧘', '静室', [
            ['修炼 ×' + cultTotal.toFixed(2), 'x-val'],
            [moodShort ? '心境：' + moodShort : '蒲团已备', furn.indexOf('mat') >= 0 ? 'x-warn' : '']
        ], furn.indexOf('mat') >= 0 ? ' <span class="text-xs">🧘</span>' : '');
        rooms += room('tian', '🌱', '灵田圃', [
            ['灵田 ' + planted.length + '/' + slots + ' 畦', 'x-val'],
            [witheredN > 0 ? '⚠ ' + witheredN + ' 畦蔫了' : (readyN > 0 ? '✨ ' + readyN + ' 畦可收' : '长势安好'), witheredN > 0 ? 'x-bad' : (readyN > 0 ? 'x-warn' : '')]
        ], furn.indexOf('stove') >= 0 ? ' <span class="text-xs">🔥</span>' : '');
        rooms += room('ku', '📦', '库房', [
            ['储物 ' + storage.used + '/' + storage.max + ' 格', 'x-val'],
            ['家具 ' + furn.length + ' 件', '']
        ], furn.indexOf('lamp') >= 0 ? ' <span class="text-xs">🏮</span>' : '');
        rooms += room('zhen', '🌀', '阵工坊', [
            ['地阵：' + (fmtName || '虚位以待'), 'x-val'],
            ['设施 ' + _facilityCount() + ' · 傀儡 ' + _puppetCount(), '']
        ], '');
        return '<div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">' + rooms + '</div>';
    }

    // ==================== 门牌 + 修缮扩建 ====================
    function _headerHtml() {
        var ht = htype(), h = house();
        if (!ht) return '';
        var site = _site();
        var plateName = (h && h.type === 'ruin') ? '🪨 漏风的石壁' : ht.name;
        return '<div class="x-card flex items-center justify-between gap-3 mb-3">' +
            '<div class="flex items-center gap-3">' +
            '<span class="text-3xl">' + (ht.icon || '🏡') + '</span>' +
            '<div><p class="x-h">' + plateName + '</p>' +
            '<p class="x-meta"><span class="x-chip x-chip--flat">' + ((ht.level || 0) > 0 ? '宅第等级 ' + ht.level + ' ' + '⭐'.repeat(ht.level) : '未修缮的野窟') + '</span> 精修 ' + Object.keys((h && h.upgrades) || {}).reduce(function (a, k) { return a + ((h.upgrades || {})[k] || 0); }, 0) + ' 次 · <span class="x-val">灵石 ' + _num(stones()) + '</span></p>' +
            (site ? '<p class="x-meta x-loc">📍 坐落：' + site.region + ' · ' + site.name + '（野外的山场，不在城里）</p>' : '') +
            '</div>' +
            '</div>' +
            '<div class="flex flex-col gap-1.5 items-stretch shrink-0">' +
            '<button onclick="HousePanelUI._toggleTradeUp()" class="x-btn x-btn--sm x-btn--wide' + (_showTradeUp ? ' x-btn--on' : '') + '">🏗️ 修缮扩建</button>' +
            '<button onclick="HousePanelUI._toggleRoads()" class="x-btn x-btn--sm x-btn--wide' + (_showRoads ? ' x-btn--on' : '') + '">🧭 路引脚程</button>' +
            '<button onclick="HousePanelUI._pickSite(\'relocate\', \'\')" class="x-btn x-btn--sm x-btn--wide">⛺ 迁址</button>' +
            '</div>' +
            '</div>';
    }
    // 第一百零四波·山居：修缮图样——灵石（补差价）+ 工料（材料存够几个报几个）+ 工期，一级一级修
    function _matHave(itemId) {
        try {
            var slots = (window.inventory && window.inventory.slots) || [];
            var c = 0;
            for (var i = 0; i < slots.length; i++) {
                var s = slots[i];
                if (s && s.templateId === itemId) c += n(s.count, 1);
            }
            return c;
        } catch (e) { return 0; }
    }
    function _matName(itemId) {
        try {
            var t = (window.itemById || {})[itemId];
            if (t && t.name) return t.name;
        } catch (e) {}
        var fallback = { mat_wood: '木材', mat_spirit_wood: '灵木', mat_iron_ore: '铁矿石', mat_copper_ore: '铜矿石', mat_refined_iron: '精铁', mat_ice_crystal: '冰晶', mat_meteorite: '陨铁', mat_star_iron: '星辰铁' };
        return fallback[itemId] || itemId;
    }
    function _repairCardHtml(next, big) {
        var r = next.recipe;
        var t = (window.HOUSE_TYPES || {})[next.target] || {};
        var afford = stones() >= r.stones;
        var matsOk = true;
        var matLine = (r.materials || []).map(function (m) {
            var have = _matHave(m.itemId);
            if (have < m.count) matsOk = false;
            return '<span class="' + (have >= m.count ? 'x-good' : 'x-bad') + '">' + _matName(m.itemId) + ' ' + have + '/' + m.count + '</span>';
        }).join(' ');
        return '<div class="x-card mb-3' + (big ? ' x-card--on' : '') + '">' +
            '<div class="flex flex-wrap items-center justify-between gap-2 mb-1"><span class="x-h2">' + (t.icon || '🏗️') + ' 修缮图样：' + next.targetName +
            ' <span class="x-chip x-chip--flat">等级 ' + (t.level || 1) + '</span></span>' +
            '<button onclick="repairHouse(\'' + next.target + '\')" class="x-btn x-btn--sm' + ((afford && matsOk) ? _cta() : ' x-off') + '">动工（补差价灵石 ' + _num(r.stones) + '）</button></div>' +
            '<p class="x-meta mb-1">' + r.label + ' · 工期约 ' + Math.round(r.minutes / 60) + ' 个时辰（动工真耗时）</p>' +
            '<p class="x-meta">工料：' + matLine + (matsOk ? '' : ' <span class="x-bad">—— 工料不足，备齐了这一钮才按得动</span>') + '</p></div>';
    }
    function _tradeUpHtml() {
        var h = house();
        if (!h) return '';
        var next = null;
        try { next = window.getRepairRecipe && window.getRepairRecipe(h.type); } catch (e) {}
        if (!next) return '<div class="x-card x-meta mb-3">已是顶配仙府——没有更气派的了。</div>';
        return _repairCardHtml(next, true);
    }

    // ==================== 庚 · 人在哪儿的牌子（第一百零二波，一百零三波改按州界算） ====================
    function _awayBannerHtml() {
        if (!hasHouse()) return '';
        var site = _site();
        var curReg = _curRegion();
        if (!site || !curReg) return '';   // 判不出人在哪儿就不挂牌（老沙箱/无图环境不打扰）
        if (_atHome()) {
            return '<p class="x-meta x-good mb-2">🏠 人在' + curReg + '地界——洞府就在「' + site.name + '」，出城上山便到家。</p>';
        }
        if (curReg === '灵界' || curReg === '魔界') {
            return '<div class="x-card x-card--lock mb-3 flex flex-wrap items-center justify-between gap-2">' +
                '<p class="x-meta">🌌 你身在' + curReg + '，洞府在人间「' + site.region + ' · ' + site.name + '」——先寻位面之门渡回人间，再走关隘路回山。</p>' +
                '<button onclick="HousePanelUI._goHome()" class="x-btn x-btn--sm' + _cta() + '">🏠 回府</button>' +
                '</div>';
        }
        var rt = _routeTo(curReg, site.region);
        var road = rt && !rt.same ? '——取道' + rt.legs.join('、') + '，共 ' + rt.li + ' 里，约 ' + rt.minutes + ' 分钟脚程' : '';
        return '<div class="x-card x-card--lock mb-3 flex flex-wrap items-center justify-between gap-2">' +
            '<p class="x-meta">🧳 你人在' + curReg + '地界' + (_curCity() ? '（' + _curCity() + '）' : '') + '，洞府坐落在「' + site.region + ' · ' + site.name + '」' + road + '。</p>' +
            '<button onclick="HousePanelUI._goHome()" class="x-btn x-btn--sm' + _cta() + '">🏠 回府</button>' +
            '</div><p class="x-dim -mt-1 mb-3">屋里的事（打坐、收获、下种、摆家具）得回府再做——人不在本州，按下去只会提醒你一句。</p>';
    }

    // ==================== 辛 · 路引：从洞府出发的脚程账（关隘里数同一把尺） ====================
    function _roadsHtml() {
        var site = _site();
        if (!site) return '';
        var home = _atHome();
        var rows = '';
        var SITES = window.CAVE_SITES || {};
        var regions = [];
        for (var k in SITES) if (SITES[k].region !== site.region && regions.indexOf(SITES[k].region) < 0) regions.push(SITES[k].region);
        regions.forEach(function (reg) {
            var rt = _routeTo(site.region, reg);
            var other = SITES[window.SITE_BY_REGION ? window.SITE_BY_REGION[reg] : ''];
            rows += '<div class="x-card x-card--tight flex items-center justify-between gap-2">' +
                '<div><p class="x-val">' + reg + (other ? ' <span class="x-dim">' + other.name + '一带</span>' : '') + '</p>' +
                '<p class="x-dim">' + (rt && !rt.same ? (rt.legs.join(' → ') + ' · ' + rt.li + ' 里 · 约 ' + rt.minutes + ' 分钟') : '脚程见舆图关隘账') + '</p></div>' +
                '<button onclick="HousePanelUI._depart(\'' + reg + '\')" class="x-btn x-btn--sm shrink-0' + (home ? '' : ' x-off') + '">' + (home ? '动身' : '人在外') + '</button></div>';
        });
        return '<div class="x-card mb-3">' +
            '<p class="x-h2 x-loc mb-1">🧭 路引——从「' + site.region + ' · ' + site.name + '」下山出门，各州脚程：</p>' +
            '<p class="x-dim mb-2">里数与耗时走「天下疆界」的关隘账（60 里≈两个时辰）；不接壤的州得一站一站走，动身时自会说清取道哪几座关。进城另结进城的脚程。</p>' +
            '<div class="grid grid-cols-1 md:grid-cols-3 gap-1.5">' + rows + '</div></div>';
    }

    // ==================== 己/壬 · 择址单：七处固定洞天（购地营造 / 迁址共用） ====================
    function _siteHtml() {
        var mode = _sitePick && _sitePick.mode;
        var tid = _sitePick && _sitePick.type;
        // 买宅按挑中的宅型算价；迁址按现住宅型算三成迁址费
        var t = mode === 'relocate' ? htype() : (tid ? (window.HOUSE_TYPES || {})[tid] : null);
        var curSite = _site();
        var curReg = _curRegion();
        var title, note, btnWord;
        if (mode === 'buy') {
            title = '⛰️ 为「' + (t ? t.icon + ' ' + t.name : '洞府') + '」择一处山场';
            note = '洞府建在野外的山里，不在城中——天下洞天就这七处，每州一座。宅基落哪座山，往后出门赶路的脚程就从哪州算起。';
            btnWord = '就建这儿';
        } else {
            var cost = t ? Math.round(t.price * 0.3) : 0;
            title = '⛺ 迁址——把洞府挪去哪座山？';
            note = '迁址费 ' + _num(cost) + ' 灵石（拆阵、搬运灵田都是钱）；灵田灵植以法宝收移，一株不损。' + (curSite ? '现坐落：' + curSite.region + ' · ' + curSite.name + '。' : '');
            btnWord = '迁去这儿';
        }
        var body = '<div class="grid grid-cols-1 md:grid-cols-2 gap-2">';
        var SITES = window.CAVE_SITES || {};
        for (var sid in SITES) {
            var s = SITES[sid];
            var isHere = curReg === s.region;          // 你此刻在这一州
            var isHome = curSite && curSite.id === s.id;
            var danger = '';
            try {
                if (typeof window.getRegionDangerLevel === 'function') {
                    var d = window.getRegionDangerLevel(s.region);
                    if (d && d.label) danger = '<span class="x-mini ' + (d.color || '') + '">' + d.label + '</span> ';
                }
            } catch (eD) {}
            var rt = curReg && !isHere ? _routeTo(curReg, s.region) : null;
            var roadLine = isHere ? '你就在此州——出城上山便到' : (rt ? (rt.legs.length > 1 ? '须取道' : '接壤，走') + rt.legs.join('、') + '（' + rt.li + ' 里 · 约 ' + rt.minutes + ' 分钟）' : '');
            body += '<div class="x-card ' + (isHome ? 'x-card--on' : (isHere ? 'x-card--here' : '')) + '">' +
                '<div class="flex items-center justify-between gap-2 mb-1"><p class="x-h2">⛰️ ' + s.name + '</p>' +
                '<p class="x-dim">' + danger + s.region + '</p></div>' +
                '<p class="x-meta mb-1">' + s.desc + '</p>' +
                (s.ley ? '<p class="x-meta mb-1"><span class="x-ley">🜁 地脉「' + s.ley.name + '」</span>——' + s.ley.text + '</p>' : '') +
                (roadLine ? '<p class="x-meta mb-1 ' + (isHere ? 'x-warn' : 'x-loc') + '">' + (isHere ? '📍 ' : '🧭 ') + roadLine + '</p>' : '') +
                (isHome ? '<p class="x-meta mb-1">🏠 宅基在此</p>' : '') +
                '<button onclick="HousePanelUI._siteConfirm(\'' + sid + '\')" class="x-btn x-btn--sm' +
                ((mode === 'buy' || !isHome) ? '' : ' x-off') + '">' +
                (isHome && mode !== 'buy' ? '已在' : btnWord) + '</button></div>';
        }
        body += '</div>';
        return '<div class="x-card mb-3">' +
            '<p class="x-h mb-1">' + title + '</p>' +
            '<p class="x-meta mb-2">' + note + '</p>' + body +
            '<button onclick="HousePanelUI._cancelSite()" class="x-btn x-btn--sm x-btn--ghost mt-3">✖ 再想想</button></div>';
    }

    // ==================== 丁 · 静室 ====================
    function _jingHtml() {
        // 第一百零二波·癸：打坐/突破/引导/闭关/洒扫是屋里的身件事——人在他乡按不动，先回府
        var home = _atHome();
        var act = function (expr) { return home ? expr : 'HousePanelUI._away()'; };
        var dim = home ? '' : ' x-off';
        var html = '<div class="x-card mb-3">';
        html += _moodLine();
        html += _bonusChips();
        html += '</div>';
        // 第一百零六波 · 起居注：洞府里的日子——知己登门、灵兽打滚、晨昏山景都记在这本账上
        try {
            var diary = (window.CaveLife && typeof window.CaveLife.getDiary === 'function') ? window.CaveLife.getDiary(4) : [];
            html += '<div class="x-card mb-3">';
            html += '<p class="x-h2 mb-1">📜 起居注 <span class="x-note">（山居的日子，记满 ' + ((window.CaveLife && window.CaveLife.DIARY_CAP) || 30) + ' 条滚动）</span></p>';
            if (diary.length) {
                for (var di = diary.length - 1; di >= 0; di--) {
                    var de = diary[di] || {};
                    html += '<p class="x-meta mb-0.5"><span class="x-dim">第' + n(de.day) + '日</span> ' + de.text + '</p>';
                }
            } else {
                html += '<p class="x-dim">还空着——这本账只在夜里结：在洞里过一夜，知己登门、灵兽打滚、晨昏山景才会上纸。</p>';
            }
            html += '</div>';
        } catch (eDiary) {}
        // 第一百零四波·山居：住破山洞的人一睁眼就看见修缮图样——材料齐了随时动工
        var _h0 = house();
        if (_h0 && _h0.type === 'ruin') {
            var _next0 = null;
            try { _next0 = window.getRepairRecipe && window.getRepairRecipe('ruin'); } catch (eR) {}
            if (_next0) {
                html += '<p class="x-meta x-warn mb-1">🪨 石壁漏风，打坐都灌脖子——把图样上的工料备齐，修成真宅院。</p>';
                html += _repairCardHtml(_next0, false);
            }
        }
        // 打坐时长（与弹窗同一本账：CULTIVATE_DURATIONS）
        var durs = window.CULTIVATE_DURATIONS || null;
        if (durs && durs.length) {
            var qi = 0;
            try { qi = n(window.currentCharData && window.currentCharData.qi); } catch (e) {}
            html += '<p class="x-h2 mb-1">🧘 打坐修炼 <span class="x-note">（当前真气 ' + Math.floor(qi) + '）</span></p>';
            html += '<div class="grid grid-cols-3 md:grid-cols-5 gap-1.5 mb-2">';
            durs.forEach(function (d) {
                var afford = qi >= d.qiCost;
                html += '<button onclick="' + act("cultivationMeditate('" + d.id + "')") + '" class="x-btn x-btn--wide' + ((afford && home) ? '' : ' x-off') + '">' +
                    '<p class="x-tile-t">' + d.label + '</p><p class="x-dim">耗气 ' + d.qiCost + '</p></button>';
            });
            html += '</div>';
            html += '<p class="x-dim mb-3">坐得越久耗气越多、收成倍率越高；真气上限随境界提升。' + (home ? '' : '（人不在本州，坐不下来——先回府）') + '</p>';
        } else {
            html += '<p class="x-meta mb-3">打坐账未就绪：修炼系统还没把打坐时长单挂上来，这一间此刻没有格子可点——稍后再来。</p>';
        }
        // 突破 / 引导灵气 / 长期闭关 / 洒扫
        html += '<div class="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">' +
            '<button onclick="' + act("if(typeof window._performBreakthroughNew==='function')window._performBreakthroughNew(); else if(typeof performBreakthrough==='function')performBreakthrough();") + '" class="x-btn x-tile' + dim + '">' +
            '<span class="x-tile-t">⬆️ 尝试突破</span><span class="x-dim">真元达标+历练达标+真气≥80%</span></button>' +
            '<button onclick="' + act("if(window.openGuideQiMiniGame)openGuideQiMiniGame(); else if(window.guideQiCultivation)guideQiCultivation();") + '" class="x-btn x-tile' + dim + '">' +
            '<span class="x-tile-t">🌊 引导灵气</span><span class="x-dim">提升本次修炼效率</span></button>' +
            '<button onclick="' + act("if(window.openLongRetreatUI)window.openLongRetreatUI();") + '" class="x-btn x-tile' + dim + '">' +
            '<span class="x-tile-t">🔒 长期闭关</span><span class="x-dim">七日 / 一月 / 一季，世界照常运转</span></button>' +
            '</div>';
        var upCost = upgradeCost();
        // 灵泉浴池的账：洒扫的力气按真账报（有浴池省力）
        var cleanCost = 15;
        try {
            var disc = n(window.CaveFacilities && window.CaveFacilities.getBuff && window.CaveFacilities.getBuff('player', 'cleanDiscount'));
            if (disc > 0) cleanCost = Math.max(5, 15 - disc);
        } catch (eC) {}
        html += '<div class="flex flex-wrap gap-2">' +
            '<button onclick="' + act('cleanDwelling()') + '" class="x-btn x-btn--sm' + dim + '">🧹 洒扫洞府（精力' + cleanCost + '）</button>' +
            '<button onclick="upgradeHouse(\'cultivation\')" class="x-btn x-btn--sm' + _cta() + '">⬆️ 精修静室（灵石 ' + _num(upCost) + '）</button>' +
            '</div>';
        return html;
    }

    // ==================== 丙 · 灵田圃 ====================
    function _tianHtml() {
        var h = house();
        var planted = (h && h.planted) || [];
        var slots = n(window.getHousePlotSlots && window.getHousePlotSlots());
        var day = n(window.getHouseGameDay && window.getHouseGameDay());
        var herbMul = 1;
        try { herbMul = n(window.getHouseBonus && window.getHouseBonus('herb'), 1); } catch (e) {}
        // 第一百零二波·癸：收获/下种是地里的身件事——人在他乡按不动
        var home = _atHome();
        var act = function (expr) { return home ? expr : 'HousePanelUI._away()'; };
        var dim = home ? '' : ' x-off';
        var readyN = 0, witheredN = 0;
        planted.forEach(function (p) {
            var s0 = _cropState(p, day);
            if (s0 === 'ready') readyN++;
            else if (s0 === 'withered') { readyN++; witheredN++; }
        });
        var html = '<p class="x-meta mb-2">共 ' + slots + ' 畦 · 已种 ' + planted.length + ' · 灵植长势 ×' + herbMul.toFixed(2) +
            ' · <span class="x-bad">熟后 ' + n(window.CROP_GRACE_DAYS, 3) + ' 日不采即蔫，蔫了收成减半</span></p>' +
            '<p class="x-dim mb-2">' + (readyN > 0
                ? ('有 ' + readyN + ' 畦该收了' + (witheredN > 0 ? '（其中 ' + witheredN + ' 畦已蔫）' : '') + '——收完才腾得出新畦。')
                : (planted.length ? '青苗还在长，到日子会自己发亮。' : '一畦未种——点下面第一格空畦下种。')) +
            '下种按畦顺序来：前一畦空着，后头的畦不开。' +
            (home ? '' : '<span class="x-warn">人在他乡：收菜、下种都是地里的身件事——先回府。</span>') + '</p>';
        // 畦格
        html += '<div class="grid grid-cols-4 md:grid-cols-6 gap-2 mb-3">';
        for (var i = 0; i < Math.max(slots, planted.length); i++) {
            var plot = planted[i];
            if (plot) {
                var st = _cropState(plot, day);
                var left = Math.max(0, plot.readyDay - day);
                if (st === 'ready') {
                    html += '<button onclick="' + act('harvestCrop(' + i + ')') + '" class="x-plot x-plot--ready' + dim + '">' +
                        '<p class="text-xl">' + (plot.icon || '🌱') + '</p><p class="x-plot-n x-warn">' + plot.name + '</p>' +
                        '<p class="x-plot-s">✨ 可收获</p></button>';
                } else if (st === 'withered') {
                    html += '<button onclick="' + act('harvestCrop(' + i + ')') + '" class="x-plot x-plot--bad' + dim + '">' +
                        '<p class="text-xl grayscale">' + (plot.icon || '🌱') + '</p><p class="x-plot-n x-bad">' + plot.name + '</p>' +
                        '<p class="x-plot-s">🥀 蔫了·减半</p></button>';
                } else {
                    html += '<div class="x-plot x-plot--grow">' +
                        '<p class="text-xl">' + (plot.icon || '🌱') + '</p><p class="x-plot-n">' + plot.name + '</p>' +
                        '<p class="x-plot-s">还有 ' + left + ' 天</p></div>';
                }
            } else if (i === planted.length) {
                // 下一畦可种的空畦——下种从这里开
                html += '<button onclick="' + act('HousePanelUI._pickPlot(' + i + ')') + '" class="x-plot x-plot--open' + dim +
                    (_plantTarget >= 0 ? ' x-plot--pick' : '') + '">' +
                    '<p class="text-xl grayscale">🟫</p><p class="x-plot-s">' + (_plantTarget >= 0 ? '种这畦 ▼' : (home ? '空畦·下种' : '空畦·回府种')) + '</p></button>';
            } else {
                html += '<div class="x-plot x-plot--void">' +
                    '<p class="text-xl grayscale">🟫</p><p class="x-plot-s">空畦 · 排在后头</p></div>';
            }
        }
        html += '</div>';
        // 选种条
        if (_plantTarget >= 0) {
            html += '<div class="x-card x-card--on mb-3">' +
                '<p class="x-h2 mb-2">给第 ' + (_plantTarget + 1) + ' 畦选种：</p><div class="grid grid-cols-2 md:grid-cols-4 gap-2">';
            var shortOf = [];
            for (var cid in (window.HOUSE_CROPS || {})) {
                var c = window.HOUSE_CROPS[cid];
                var have = _haveSeed(c.seedId);
                var canPlant = c.free || have > 0;
                if (!canPlant) shortOf.push(c.name);
                html += '<button onclick="HousePanelUI._plantAt(\'' + cid + '\')" class="x-btn x-tile' + (canPlant ? '' : ' x-off') + '">' +
                    '<p class="x-tile-t">' + c.icon + ' ' + c.name + '</p>' +
                    '<p class="x-dim">' + c.growDays + ' 天 · 收 ' + c.yieldCount + (c.seedId ? ' · 种子' + (canPlant ? '够' : '缺') + '(' + have + ')' : ' · 无需种子') + '</p></button>';
            }
            html += '</div>' +
                (shortOf.length ? '<p class="x-dim mt-2">缺种子的：' + shortOf.join('／') + '——种子就是灵植本身，去「休闲活动」页采药采得着；只有灵草不挑种，随时能下。</p>' : '') +
                '<button onclick="HousePanelUI._pickPlot(-1)" class="x-btn x-btn--sm x-btn--ghost mt-2">✖ 不种了</button></div>';
        }
        var upCost = upgradeCost();
        html += '<div class="flex flex-wrap gap-2">' +
            '<button onclick="' + act('harvestAllReady()') + '" class="x-btn x-btn--sm' + (readyN > 0 && home ? _cta() : (readyN > 0 ? '' : dim)) + '">✨ 一键收获' + (readyN > 0 ? '（' + readyN + ' 畦）' : '（此刻无熟）') + '</button>' +
            '<button onclick="upgradeHouse(\'herb\')" class="x-btn x-btn--sm' + _cta() + '">⬆️ 开新畦（灵石 ' + _num(upCost) + '）</button>' +
            '</div>';
        return html;
    }

    // ==================== 库房 ====================
    function _kuHtml() {
        var st = _storageUsed();
        var bonus = 0;
        try { bonus = Math.floor(n(window.getHouseBonus && window.getHouseBonus('storage'))); } catch (e) {}
        var pct = st.max > 0 ? Math.min(100, Math.round(st.used * 100 / st.max)) : 0;
        var html = '<div class="x-card mb-3">' +
            '<p class="x-h2 mb-1">📦 储物 ' + st.used + '/' + st.max + ' 格 <span class="x-note">（洞府供 +' + bonus + ' 格）</span></p>' +
            '<div class="x-bar"><div class="x-bar-fill' + (pct > 85 ? ' x-bar-fill--warn' : '') + '" style="width:' + pct + '%"></div></div>' +
            (pct > 85 ? '<p class="x-meta x-warn mt-1">格子快满了——置办聚灵灯或扩库房。</p>' : '') +
            '</div>';
        // 家具
        var h = house();
        var owned = (h && h.furniture) || [];
        var FURN = window.HOUSE_FURNITURE || {};
        html += '<p class="x-h2 mb-2">🪑 家具 <span class="x-note">（每件都有一份实在的加成）</span></p>';
        var ownedKeys = Object.keys(FURN).filter(function (fid) { return owned.indexOf(fid) >= 0; });
        var shopKeys = Object.keys(FURN).filter(function (fid) { return owned.indexOf(fid) < 0; });
        if (ownedKeys.length) {
            html += '<div class="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">' + ownedKeys.map(function (fid) {
                var f = FURN[fid];
                return '<div class="x-card x-card--on">' +
                    '<p class="x-val">' + f.icon + ' ' + f.name + ' <span class="x-chip x-chip--flat">已摆放</span></p>' +
                    '<p class="x-meta mt-1">' + f.desc + '</p></div>';
            }).join('') + '</div>';
        } else {
            html += '<p class="x-meta mb-3">屋里还空着——一件家具都没摆，下面铺子里挑几件（摆在屋里才算账）。</p>';
        }
        if (shopKeys.length) {
            // 第一百零二波·癸：家具要人搬进屋摆好——人在他乡置办不了
            var homeKu = _atHome();
            html += '<div class="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">' + shopKeys.map(function (fid) {
                var f = FURN[fid];
                var afford = stones() >= f.price;
                return '<div class="x-card">' +
                    '<p class="x-val">' + f.icon + ' ' + f.name + '</p>' +
                    '<p class="x-meta mt-1 mb-2">' + f.desc + '</p>' +
                    '<button onclick="' + (homeKu ? "buyFurniture('" + fid + "')" : 'HousePanelUI._away()') + '" class="x-btn x-btn--sm' + ((afford && homeKu) ? '' : ' x-off') + '">置办（' + _num(f.price) + ' 灵石）</button></div>';
            }).join('') + '</div>';
            if (!homeKu) html += '<p class="x-dim mb-3">人在他乡：家具要搬进屋才摆得下——先回府。</p>';
        }
        var upCost = upgradeCost();
        html += '<button onclick="upgradeHouse(\'storage\')" class="x-btn x-btn--sm' + _cta() + '">⬆️ 扩库房（灵石 ' + _num(upCost) + '）</button>';
        return html;
    }

    // ==================== 乙 · 阵工坊 ====================
    function _zhenHtml() {
        // 第一百零四波·山居：破山洞没地方安置设施——先修缮（锁着也要说清为什么锁、去哪儿开锁）
        var _hz = house();
        if (_hz && _hz.type === 'ruin') {
            var _nz = null;
            try { _nz = window.getRepairRecipe && window.getRepairRecipe('ruin'); } catch (eNz) {}
            return '<div class="x-card x-card--lock mb-3">' +
                '<p class="x-h2 x-warn mb-1">🪨 工坊还没开门</p>' +
                '<p class="x-meta mb-2">石壁漏风，设施无处安放、阵旗插不住、傀儡也没处站。这三间的位子都按宅子等级给：修起一级，位就多一档。</p>' +
                '<button onclick="HousePanelUI._setTab(\'jing\')" class="x-btn x-btn--sm">🧘 去静室看图样</button>' +
                '</div>' + (_nz ? _repairCardHtml(_nz, false) : '');
        }
        if (typeof window._cwSection !== 'function') {
            // 深作三门还没加载出来的兜底（正常页面走不到）
            return '<p class="x-meta mb-2">工坊尚未开门：洞府深作的三间账（设施／阵法／傀儡）还没挂上来——稍后再来，或先去别处修炼。</p>' +
                '<button onclick="openCaveWorksUI()" class="x-btn x-btn--sm">🧰 洞府深作</button>';
        }
        function sec(icon, title, note, tabKey) {
            return '<div class="x-card mb-3">' +
                '<p class="x-h2 mb-1">' + icon + ' ' + title + '</p>' +
                (note ? '<p class="x-dim mb-2">' + note + '</p>' : '') +
                window._cwSection(tabKey) + '</div>';
        }
        return sec('🧰', '设施布置', '洞府等级决定设施位；安置的加成从当日起真算进账。', 'fac') +
            sec('🌀', '护持阵法', '地脉阵养修炼，战阵随你出战，护山阵保宗门。', 'fmt') +
            sec('🤖', '傀儡工坊', '四部件拼傀儡——出战/采集/运输各有产出。', 'pup');
    }

    // ==================== 戊 · 置产铺子（无府者） ====================
    function _estateHtml() {
        var wallet = stones();
        var html = '<div class="x-card mb-3 flex flex-wrap items-start justify-between gap-3">' +
            '<div class="flex-1">' +
            '<p class="x-h mb-1">⛰️ 还没有自己的洞府</p>' +
            '<p class="x-meta">两条路：免费占一处破山洞自己一级一级修，或灵石置办一处现成宅院。没置产也照样能打坐修炼——只是没有灵田、库房与工坊。</p>' +
            '<p class="x-meta x-loc mt-1">📍 洞府建在野外的山里（天下洞天七处，每州一座）——宅基落哪座山，往后出门赶路的脚程就从哪州算起。</p>' +
            '<p class="x-dim mt-1">灵石来得慢：去「休闲活动」页伐木／采矿／采药——攒下的材料正好当修缮的工料；多余的料器在铺子里卖了也换灵石。</p>' +
            '</div>' +
            '<div class="shrink-0 text-right"><p class="x-meta">眼下灵石</p><p class="x-num">' + _num(wallet) + '</p></div>' +
            '</div>';
        // 第一百零四波·山居：破山洞免费占——材料修出一级一级真宅院（图样账现算，不把数字写死在文案里）
        var _r0 = null;
        try { _r0 = window.getRepairRecipe && window.getRepairRecipe('ruin'); } catch (eR0) {}
        var _ruinMat = '';
        if (_r0 && _r0.recipe) {
            _ruinMat = (_r0.recipe.materials || []).map(function (m) { return _matName(m.itemId) + ' ' + m.count; }).join(' + ') +
                ' + 灵石 ' + _num(_r0.recipe.stones) + '，工期约 ' + Math.round(_r0.recipe.minutes / 60) + ' 个时辰';
        }
        html += '<div class="x-card x-card--on mb-3 flex flex-wrap items-center justify-between gap-3">' +
            '<div class="flex-1"><p class="x-h">🪨 破山洞 <span class="x-chip">免费占山</span></p>' +
            '<p class="x-meta mt-1">漏风的石壁也是家：灵田一畦、储物五格，修炼不加成一分。伐木采矿把工料攒齐，一级一级修成洞府→庭院→庄园→仙府。</p>' +
            (_ruinMat ? '<p class="x-dim mt-1">第一档图样：' + _ruinMat + '（材料真扣、工期真耗时）</p>' : '') +
            '</div>' +
            '<button onclick="claimRuin()" class="x-btn' + _cta() + '">⛰️ 占山落脚</button></div>';
        // 第一百零二波·己：买宅两步走——先挑宅子，再挑山场；急着落脚的就建在脚下这一州
        var defSite = null;
        try {
            var defId = (typeof window.defaultCaveSite === 'function') ? window.defaultCaveSite() : '';
            defSite = (window.CAVE_SITES || {})[defId] || null;
        } catch (e) {}
        var nearLabel = defSite ? (defSite.region + ' · ' + defSite.name) : '帝都 · 长安';
        html += '<p class="x-h2 mb-1">🏘️ 灵石置办现成宅院 <span class="x-note">（四档对比着买：先「择山购地」挑山场，或直接建在脚下这座山）</span></p>' +
            '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">';
        for (var tid in (window.HOUSE_TYPES || {})) {
            if (tid === 'ruin') continue;   // 破山洞不走买卖——上面占山卡里免费领
            var t = window.HOUSE_TYPES[tid];
            var afford = wallet >= t.price;
            var extras = [];
            if (t.bonuses.herb) extras.push('灵植×' + t.bonuses.herb);
            if (t.bonuses.forging) extras.push('炼器×' + t.bonuses.forging);
            if (t.bonuses.alchemy) extras.push('炼丹×' + t.bonuses.alchemy);
            html += '<div class="x-card">' +
                '<div class="flex items-center justify-between gap-2 mb-1"><span class="x-h2">' + t.icon + ' ' + t.name + '</span>' +
                '<span class="x-chip x-chip--flat">等级 ' + t.level + '</span></div>' +
                '<p class="x-meta">修炼 ×' + t.bonuses.cultivation + '</p>' +
                '<p class="x-meta">储物 +' + t.bonuses.storage + ' 格 · 灵田 ' + t.plotSlots + ' 畦</p>' +
                (extras.length ? '<p class="x-meta">另享 ' + extras.map(function (x) { return '<span class="x-nb">' + x + '</span>'; }).join(' · ') + '</p>' : '') +
                '<p class="x-num mt-1">' + _num(t.price) + ' 灵石</p>' +
                (afford ? '<p class="x-meta x-good mb-2">现钱够</p>' : '<p class="x-meta x-bad mb-2">还差 ' + _num(t.price - wallet) + ' 灵石</p>') +
                '<div class="flex flex-col gap-1.5">' +
                '<button onclick="HousePanelUI._pickSite(\'buy\', \'' + tid + '\')" class="x-btn x-btn--wide' + (afford ? '' : ' x-off') + '">⛰️ 择山购地</button>' +
                '<button onclick="buyHouse(\'' + tid + '\')" class="x-btn x-btn--wide' + (afford ? '' : ' x-off') + '">就建在脚下这座山（' + nearLabel + '）</button>' +
                '</div></div>';
        }
        html += '</div>';
        return html;
    }

    // ==================== 页签与总装 ====================
    function _tabsHtml() {
        return '<div class="x-tabbar">' + TABS.map(function (t) {
            var active = _tab === t.id;
            return '<button onclick="HousePanelUI._setTab(\'' + t.id + '\')" class="x-tab' + (active ? ' x-tab--on' : '') + '">' +
                t.icon + ' ' + t.name + '</button>';
        }).join('') + '</div>';
    }
    function _tabBody() {
        if (_tab === 'tian') return _tianHtml();
        if (_tab === 'ku') return _kuHtml();
        if (_tab === 'zhen') return _zhenHtml();
        return _jingHtml();
    }

    function render(container, shopEl) {
        if (!container) return;
        _primaryUsed = false;      // 每次重绘重新发一枚金色主按钮
        container.className = 'x-root';   // 摘掉老盒子的边框底——新版自带卡片
        if (shopEl) { shopEl.innerHTML = ''; shopEl.className = ''; }
        // 第一百零二波：择址单开着时整页让位（买宅择地 / 迁址共用）
        if (_sitePick) {
            container.innerHTML = _siteHtml();
            return;
        }
        if (!hasHouse()) {
            container.innerHTML = _estateHtml();
            return;
        }
        // 先出的板块先占金色主位：人在他乡时，唯一的下一步就是回府
        var parts = [_headerHtml(), _awayBannerHtml(),
            _showTradeUp ? _tradeUpHtml() : '', _showRoads ? _roadsHtml() : '',
            _mapHtml(), _tabsHtml()];
        container.innerHTML = parts.join('') + '<div id="house-tab-body">' + _tabBody() + '</div>';
    }

    window.HousePanelUI = {
        render: render,
        refresh: function () {
            if (typeof window.renderHouseStatus === 'function') window.renderHouseStatus();
        },
        selectTab: function (t) { _tab = t; _plantTarget = -1; },
        _setTab: function (t) { _tab = t; _plantTarget = -1; window.HousePanelUI.refresh(); },
        _pickPlot: function (i) { _plantTarget = (_plantTarget === i ? -1 : i); window.HousePanelUI.refresh(); },
        _toggleTradeUp: function () { _showTradeUp = !_showTradeUp; window.HousePanelUI.refresh(); },
        _plantAt: function (cropId) {
            if (!_atHome()) { window.HousePanelUI._away(); return; }   // 第一百零二波·癸：下种也得人在地里
            _plantTarget = -1;
            if (typeof window.plantCrop === 'function') window.plantCrop(cropId);
            else window.HousePanelUI.refresh();
        },
        // ============ 第一百零二波 · 择地而居的口子 ============
        _toggleRoads: function () { _showRoads = !_showRoads; window.HousePanelUI.refresh(); },
        _pickSite: function (mode, type) {
            _sitePick = { mode: mode === 'relocate' ? 'relocate' : 'buy', type: type || '' };
            window.HousePanelUI.refresh();
        },
        _cancelSite: function () { _sitePick = null; window.HousePanelUI.refresh(); },
        _siteConfirm: function (siteId) {
            var pick = _sitePick || { mode: 'buy', type: '' };
            _sitePick = null;
            if (pick.mode === 'relocate') {
                if (typeof window.relocateHouse === 'function') window.relocateHouse(siteId);
            } else {
                if (typeof window.buyHouse === 'function') window.buyHouse(pick.type, siteId);
            }
            window.HousePanelUI.refresh();
        },
        _goHome: function () {
            var site = _site();
            if (!site) { if (window.showMessage) window.showMessage('你还没有洞府。', 'info'); return; }
            // 回府=回山：走天下疆界的关隘路（接壤结里数时辰与脚力，不接壤会说清该取道哪几州）；
            // 已在宅子所在州，就直接开那片山河——出城上山便到家。
            if (window.WorldMap && typeof window.WorldMap.setOut === 'function') {
                window.WorldMap.setOut(site.region);
            } else if (window.showMessage) {
                window.showMessage('疆界的账还没就绪，先从大地图动身往' + site.region + '。', 'warning');
            }
        },
        _depart: function (region) {
            // 路引上的「动身」：人在宅子所在州才走得——下山出门就是过关隘的正经路
            if (!_atHome()) { window.HousePanelUI._away(); return; }
            if (window.WorldMap && typeof window.WorldMap.setOut === 'function') {
                window.WorldMap.setOut(region);
            } else if (window.showMessage) {
                window.showMessage('疆界的账还没就绪，先从大地图动身。', 'warning');
            }
        },
        _away: function () {
            var site = _site(), curReg = _curRegion();
            if (window.showMessage) {
                window.showMessage(site && curReg
                    ? ('你人在' + curReg + '地界，洞府在「' + site.region + ' · ' + site.name + '」——屋里的事，先回府再做。')
                    : '你得先回洞府，才能做屋里的事。', 'warning');
            }
        },
        // 测试与调试用的内省口子
        _state: function () { return { tab: _tab, plantTarget: _plantTarget, tradeUp: _showTradeUp, sitePick: _sitePick, roads: _showRoads }; }
    };
})();
