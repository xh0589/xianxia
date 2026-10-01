// ==================== v25.7 市井烟火批（第一百四十九批）· 烟火街口 + 街头闲逛 ====================
// 城市面板上此前有庙会/摆摊/赁屋/招工四道口，独缺一口「过日子」的总门。本账挂一行「市井烟火」：
// 闲逛/沐浴/下馆子/博戏/淘书/施舍六路小玩法收进一张菜单（各家有各家的账本，菜单只递话）。
// 闲逛这本账：
//   ① 救活孤儿码——location-system.js 里的 exploreCity 四出戏（小摊/奇闻/隐藏小店/请教老者）
//      写好多年，面板上却没有任何按钮按得到它。本账把「上街走走」接到它正门上，一字不重写；
//      四出戏不在位时退回自家兜底（扣时辰，不白逛）。
//   ② 越走越面熟：每逛一回本城「面熟」+1，每日最多记三回（街坊认脸按天认，不按趟认——
//      刷步数刷不出交情）。面熟 3 有人点头、6 有老街坊掏心窝子递一条**真行情**（吃 MarketDynamic
//      现账，不编假消息）、10 街面认下你（本城声望+1）。
//   ③ 闲逛脚程耗精力不耗钱；四出戏自己的时辰账（5-15 分钟）由 exploreCity 内部扣，本账不重复扣。
//   ④ 路上有一成五几率撞见街角乞丐——转交 BeggarAlms 正门（丐帮眼线的账在那本；不在位就静默不遇）。
//   ⑤ 面熟账走 StateRegistry 正门（随 saveData.modules），零新 localStorage 键。
(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    var CFG = {
        WANDER_EN: 5,            // 每趟闲逛耗精力
        WANDER_FALLBACK_MIN: 20, // 四出戏不在位时的兜底时辰
        DAILY_WANDER_CAP: 3,     // 每日最多记几回面熟
        BEGGAR_P: 0.15,          // 路上撞见街角乞丐的几率
        FAMILIAR_GREET: 3,       // 面熟档一：街坊点头
        FAMILIAR_HEART: 6,       // 面熟档二：老街坊掏心窝子
        FAMILIAR_KNOWN: 10       // 面熟档三：街面认下你
    };

    var _state = { familiar: {} };

    // ============ 小工具（street-stall.js 同款口径） ============
    function cd() { return window.currentCharData || null; }
    function say(m, t) { try { if (window.showMessage) window.showMessage(m, t || 'info'); } catch (e) { return false; } return true; }
    function log(m, t) { try { if (window.gameLog && window.gameLog.add) window.gameLog.add(m, t || 'info'); } catch (e) { return false; } return true; }
    function city() {
        return (cd() && cd().location) ||
            (typeof window.getCurrentCityName === 'function' && window.getCurrentCityName()) || '';
    }
    // DES-57：城名两串写法（舆图转发带空格）——认账前先取键
    function pkCity(s) { return String(s == null ? '' : s).replace(/\s+/g, ''); }
    function absDay() {
        try {
            if (window.WorldCalendar && typeof window.WorldCalendar.day === 'number' && window.WorldCalendar.day > 0) return Math.floor(window.WorldCalendar.day);
            if (typeof window.getAbsoluteDay === 'function') { var g = window.getAbsoluteDay(); if (g) return Math.floor(g); }
            if (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') { var t = window.timeSystem.getAbsoluteDay(); if (t) return Math.floor(t); }
        } catch (e) { return 0; }
        return 0;
    }
    function settle(spec, source) {
        try {
            if (window.RewardService && typeof window.RewardService.apply === 'function') {
                var r = window.RewardService.apply(spec, { source: source || '市井烟火', city: city() });
                return { ok: !!(r && r.success !== false), note: r && r.messages ? r.messages.join('、') : '' };
            }
        } catch (e) { console.warn('[静默失败] js/city-facilities/street-life.js · settle：这单奖惩没落账', e && e.message); }
        return { ok: false, note: '' };
    }
    function cityOk(ct) {
        try {
            var d = window.locationSystem && window.locationSystem.getCityData && window.locationSystem.getCityData(ct || city());
            return !!d;
        } catch (e) { return false; }
    }

    // ============ 面熟账 ============
    function famOf(ct) {
        var k = pkCity(ct);
        if (!_state.familiar[k]) _state.familiar[k] = { n: 0, m3: false, m6: false, m10: false, dayStamp: -1, dayCount: 0 };
        return _state.familiar[k];
    }
    function familiarCount(ct) { return famOf(ct || city()).n; }

    // 老街坊掏心窝子：递一条**真行情**——哪个大区哪类货眼下最俏（吃 MarketDynamic 现账）。
    // 行情账不在位就退回市民闲话池（location-system 的只读窗），再不在位说句街坊套话，绝不编假消息。
    function heartIntel() {
        try {
            var MD = window.MarketDynamic;
            if (MD && typeof MD.priceMul === 'function' && MD.CITIES && MD.CATEGORIES) {
                var best = null;
                for (var i = 0; i < MD.CITIES.length; i++) {
                    for (var j = 0; j < MD.CATEGORIES.length; j++) {
                        var m = Number(MD.priceMul(MD.CITIES[i], MD.CATEGORIES[j])) || 1;
                        if (!best || m > best.mul) best = { region: MD.CITIES[i], cat: MD.CATEGORIES[j], mul: m };
                    }
                }
                if (best && best.mul > 1.02) {
                    return '「' + best.region + '那边的' + best.cat + '，眼下贵得离谱（行市 ' + (Math.round(best.mul * 10) / 10) + ' 倍）——听说有人在大收，脚力勤快的能赚一笔。」';
                }
            }
        } catch (eMD) { console.warn('[静默失败] js/city-facilities/street-life.js · heartIntel：行情账没读出来，退回闲话池', eMD && eMD.message); }
        try {
            if (typeof window.getCitizenGossip === 'function') {
                var pool = window.getCitizenGossip() || [];
                if (pool.length) {
                    var g = pool[Math.floor(Math.random() * pool.length)];
                    return '「' + g.text + '」';
                }
            }
        } catch (eG) { console.warn('[静默失败] js/city-facilities/street-life.js · heartIntel：闲话池也没读出来，说句套话应付', eG && eG.message); }
        return '「东家长西家短，说来说去都是柴米油盐——可街坊的话里，总比山风里多几分人气。」';
    }

    // ============ 上街走走 ============
    function wander() {
        var c = cd();
        if (!c) return false;
        var ct = city();
        if (!ct || !cityOk(ct)) { say('🏮 你身在城外野地——街上没有可逛的，先进城吧。', 'info'); return false; }
        if (window.currentBattle) { say('🏮 打着架呢，哪有闲心逛街。', 'warning'); return false; }
        if (Number(c.energy) < CFG.WANDER_EN) { say('🏮 精力不济（要 ' + CFG.WANDER_EN + ' 点）——腿都抬不动，逛什么街。', 'warning'); return false; }
        c.energy = Math.max(0, Number(c.energy) - CFG.WANDER_EN);

        // 四出戏正门：exploreCity 自己扣时辰（闲聊 10 / 奇闻 5 / 小店 10 / 老者 15），本账不重复扣
        var acted = false;
        try {
            if (typeof window.exploreCity === 'function') { window.exploreCity(ct); acted = true; }
        } catch (eW) { console.warn('[静默失败] js/city-facilities/street-life.js · wander：exploreCity 四出戏没演成——这趟算白逛，时辰没扣', eW && eW.message); }
        if (!acted) {
            try {
                if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') window.timeSystem.advanceTime(CFG.WANDER_FALLBACK_MIN, '街头闲逛');
            } catch (eT) { console.warn('[静默失败] js/city-facilities/street-life.js · wander：兜底时辰也没扣成', eT && eT.message); }
        }

        // 面熟账（按天记趟数，刷步数刷不出交情）
        var f = famOf(ct);
        var day = absDay();
        if (f.dayStamp !== day) { f.dayStamp = day; f.dayCount = 0; }
        if (f.dayCount < CFG.DAILY_WANDER_CAP) {
            f.dayCount++;
            f.n++;
            if (!f.m3 && f.n >= CFG.FAMILIAR_GREET) {
                f.m3 = true;
                settle({ mood: 1 });
                log('🏮 你在' + ct + '的街面上混了个脸熟——摊贩见你过来会点头了。（心境+1）', 'info');
            }
            if (!f.m6 && f.n >= CFG.FAMILIAR_HEART) {
                f.m6 = true;
                var intel = heartIntel();
                log('🏮 ' + ct + '的老街坊把你当自己人，凑过来压低声音：' + intel, 'success');
                say('🏮 老街坊掏心窝子：' + intel, 'success');
            }
            if (!f.m10 && f.n >= CFG.FAMILIAR_KNOWN) {
                f.m10 = true;
                settle({ rep: 1 });
                log('🏮 ' + ct + '的街面认下你了——铺子伙计都能叫出你的称呼。（本城声望+1）', 'success');
            }
        } else {
            log('🏮 你又在' + ct + '街上走了一遭。街坊的脸一天认三回就够了——再多就成闲汉了。', 'info');
        }

        // 路上撞见街角乞丐：转交丐帮眼线那本账（不在位就静默不遇）
        try {
            if (Math.random() < CFG.BEGGAR_P && window.BeggarAlms && typeof window.BeggarAlms.encounter === 'function') {
                window.BeggarAlms.encounter(ct);
            }
        } catch (eB) { console.warn('[静默失败] js/city-facilities/street-life.js · wander：乞丐没请出来——这趟街上太平', eB && eB.message); }

        try { if (window.updateCharacterStatus) window.updateCharacterStatus(); } catch (eU) { console.warn('[静默失败] js/city-facilities/street-life.js · wander：逛完面板没刷新', eU && eU.message); }
        return true;
    }

    // ============ 菜单（六路小玩法的总门） ============
    function open() {
        var ct = city();
        if (!ct || !cityOk(ct)) { say('🏮 你身在城外——先进城，再谈市井烟火。', 'info'); return false; }
        var btn = 'class="w-full p-3 rounded mb-2 text-left text-sm text-white hover:opacity-90"';
        var fam = familiarCount(ct);
        var html = '<p class="text-sm text-gray-400 mb-2">' + ct + '的街面上人来人往。你在' + (fam > 0 ? '这儿已有 <span class="text-rose-300 font-bold">' + fam + '</span> 分面熟' + (fam >= CFG.FAMILIAR_KNOWN ? '——街面都认得你' : fam >= CFG.FAMILIAR_HEART ? '——老街坊肯跟你说体己话' : fam >= CFG.FAMILIAR_GREET ? '——摊贩见你会点头' : '') : '这儿还是张生脸') + '。城里能过日子的地方：</p>' +
            '<button onclick="StreetLife.wander()" ' + btn.replace('p-3', 'bg-rose-900 p-3') + '>🚶 上街走走（耗精力 ' + CFG.WANDER_EN + ' · 撞市井小事，越走越面熟）</button>' +
            (window.CityBath ? '<button onclick="CityBath.open()" ' + btn.replace('p-3', 'bg-cyan-900 p-3') + '>♨️ 澡堂洗尘（泡汤回状态 · 洗秽气 · 听赤膊闲话）</button>' : '') +
            (window.CityEatery ? '<button onclick="CityEatery.open()" ' + btn.replace('p-3', 'bg-orange-900 p-3') + '>🍲 下馆子点一桌（家常饭管饱 · 本帮招牌带小加成）</button>' : '') +
            (window.GambleDen ? '<button onclick="GambleDen.open()" ' + btn.replace('p-3', 'bg-red-900 p-3') + '>🎲 赌坊掷骰（押大小 · 庄家吃围骰 · 连赢进雅间）</button>' : '') +
            (window.CityBookshop ? '<button onclick="CityBookshop.open()" ' + btn.replace('p-3', 'bg-indigo-900 p-3') + '>📚 书肆淘书（旧书摊天天换货 · 学识好能捡漏残页）</button>' : '') +
            (window.BeggarAlms ? '<button onclick="BeggarAlms.open()" ' + btn.replace('p-3', 'bg-amber-900 p-3') + '>🥣 街角施舍（善有善报——乞丐多是丐帮的眼线）</button>' : '') +
            (window.CitizenLife ? '<button onclick="CitizenLife.browse()" ' + btn.replace('p-3', 'bg-teal-900 p-3') + '>👥 街坊搭话（摊贩、书生、棋手、琴师……各干各的营生）</button>' : '') +
            '<p class="text-[11px] text-gray-500 mt-1">市井小账——买的是人间烟火气，不是道行。</p>';
        if (typeof window.showBuildingEffectDialog === 'function') {
            window.showBuildingEffectDialog('🏮 市井烟火 · ' + ct, html);
            return true;
        }
        return false;
    }

    // ============ 城市面板上的烟火口（进了城就挂，仙山佛窟没有红尘街面则静默） ============
    function panelHtml(cityName) {
        try {
            if (!cityOk(cityName)) return '';
            if (cityName && city() && pkCity(cityName) !== pkCity(city())) return '';
            return '<div class="p-2 bg-rose-900/20 rounded border border-rose-800/50">' +
                '<button onclick="StreetLife.open()" class="w-full text-left text-sm text-rose-300 hover:text-rose-200">🏮 市井烟火（闲逛·澡堂·下馆子·赌坊·书肆·施舍——城里过日子的一扇总门）</button>' +
                '</div>';
        } catch (e) { return ''; }
    }

    // ============ 存读档（StateRegistry 正门，零新 localStorage 键） ============
    function _export() { return JSON.parse(JSON.stringify(_state)); }
    function _import(s) {
        if (!s || typeof s !== 'object') return;
        var fam = (s.familiar && typeof s.familiar === 'object') ? s.familiar : {};
        var clean = {};
        for (var k in fam) {
            var f = fam[k];
            if (!f || typeof f !== 'object') continue;
            clean[k] = {
                n: Number(f.n) || 0,
                m3: !!f.m3, m6: !!f.m6, m10: !!f.m10,
                dayStamp: Number.isFinite(Number(f.dayStamp)) ? Number(f.dayStamp) : -1,
                dayCount: Number(f.dayCount) || 0
            };
        }
        _state.familiar = clean;
    }
    function _reset() { _state = { familiar: {} }; }
    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        window.StateRegistry.register('streetLife', { version: 1, export: _export, import: _import, reset: _reset });
    }

    window.StreetLife = {
        CFG: CFG,
        panelHtml: panelHtml,
        open: open,
        wander: wander,
        familiarCount: familiarCount,
        heartIntel: heartIntel,
        state: _export
    };
    window.openStreetLife = function () { return open(); };
})();
