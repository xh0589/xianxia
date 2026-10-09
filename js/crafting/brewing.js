// ==================== v26.0 六路营生批（第一百五十一批 · 用户点单）· 酿灵酒账 ====================
// 用户点单：「烹饪有整条配方线，酿酒却没有——灵米灵泉入坛、窖藏年份越久越醇，自用送礼
//           或摆进自己店里，正好和开店配套。」本账开三条酒方、四档年份：
//   ① 借坛：城里有食肆/铺面才借得到酒家的窖坛（坛租现付）；坛只有三口——占着不启，
//      就是年份在长（酒不会坏，但坛位有限——机会成本是实话）；
//   ② 三张酒方（材料全用既有的真材料账）：青米酒（灵草+灵泉露 · 烹饪10）/
//      百花酿（幻海灵花+灵芝+灵泉露 · 烹饪20）/ 龙骨酒（妖兽精血+龙草+灵泉露×2 · 烹饪40 · 坛租灵石）；
//   ③ 四档年份（启坛按窖藏天数落档）：<30日 新酒 / <90日 陈酿 / <365日 世纪藏 / ≥365日 神工——
//      十二件酒物全是正经 consumable（注册进 itemById/allItems 正门）：回复、心境随年份涨，
//      神工档「龙工玉液」整幅回满；送人（好感礼）、摆进自己的铺子（掌柜账收任何行囊货）都走物品真账；
//   ④ 启坛：烹饪的长进按年份档给（新酒+1 … 神工+4）——酿酒的手艺是等出来的。
// 口径：材料扣行囊真账（uid 槽位制）；坛租铜钱/灵石走 RewardService 负账正门；时辰走 advanceTime；
//   坛中账落 StateRegistry 'brewing' 正门（窖藏天数按绝对日算，读档后年份照样长）。
(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    var CFG = {
        JARS: 3,
        BREW_MIN: 60,
        OPEN_MIN: 10,
        AGE_AT: [30, 90, 365]    // 新酒 / 陈酿 / 世纪藏 / 神工 的天数线
    };

    // 三张酒方 × 四档年份 = 十二件酒物（consumable 真注册；价格与效果随年份涨）
    var RECIPES = [
        {
            id: 'rice', name: '青米酒', icon: '🍶', skill: 10, rent: { copper: 30 },
            mats: [{ id: 'mat_spirit_grass', n: 5 }, { id: 'mat_spirit_spring', n: 1 }],
            desc: '灵草发酵的家常酒——入门方，胜在料贱量大',
            stages: [
                { id: 'brew_rice_young', name: '新青米酒', price: 15, effect: { energy_recovery: 20, mood_boost: 5 } },
                { id: 'brew_rice_aged', name: '陈青米酒', price: 40, effect: { energy_recovery: 35, hp_recovery: 20, mood_boost: 10 } },
                { id: 'brew_rice_vintage', name: '世纪青米藏', price: 90, effect: { energy_recovery: 60, hp_recovery: 40, mood_boost: 15 } },
                { id: 'brew_rice_divine', name: '青米玉液', price: 220, effect: { energy_recovery: 100, hp_recovery: 80, qi_recovery: 30, mood_boost: 25 } }
            ]
        },
        {
            id: 'flower', name: '百花酿', icon: '🌸', skill: 20, rent: { copper: 60 },
            mats: [{ id: 'mat_spirit_flower', n: 2 }, { id: 'mat_lingzhi', n: 1 }, { id: 'mat_spirit_spring', n: 1 }],
            desc: '幻海灵花入坛——花香酒，女修与雅士最爱',
            stages: [
                { id: 'brew_flower_young', name: '新百花酿', price: 25, effect: { hp_recovery: 25, mood_boost: 8 } },
                { id: 'brew_flower_aged', name: '陈百花酿', price: 60, effect: { hp_recovery: 50, qi_recovery: 25, mood_boost: 15 } },
                { id: 'brew_flower_vintage', name: '世纪百花藏', price: 140, effect: { hp_recovery: 90, qi_recovery: 50, mood_boost: 22 } },
                { id: 'brew_flower_divine', name: '百花仙露', price: 350, effect: { hp_recovery: 150, qi_recovery: 100, mood_boost: 35 } }
            ]
        },
        {
            id: 'dragon', name: '龙骨酒', icon: '🐉', skill: 40, rent: { stones: 5 },
            mats: [{ id: 'mat_demon_beast_blood', n: 1 }, { id: 'mat_dragon_grass', n: 1 }, { id: 'mat_spirit_spring', n: 2 }],
            desc: '妖兽精血和龙草共酿——烈酒，一口下去火线穿喉',
            stages: [
                { id: 'brew_dragon_young', name: '新龙骨酒', price: 60, effect: { qi_recovery: 40, energy_recovery: 30, mood_boost: 5 } },
                { id: 'brew_dragon_aged', name: '陈龙骨酒', price: 150, effect: { qi_recovery: 90, hp_recovery: 60, mood_boost: 10 } },
                { id: 'brew_dragon_vintage', name: '世纪龙骨藏', price: 380, effect: { qi_recovery: 160, hp_recovery: 100, energy_recovery: 80, mood_boost: 20 } },
                { id: 'brew_dragon_divine', name: '龙工玉液', price: 900, effect: { full_recovery: true, mood_boost: 40 } }
            ]
        }
    ];

    var STAGE_WORDS = ['新酒', '陈酿', '世纪藏', '神工'];
    var _st = { jars: [] };   // jars: [{rid, brewDay, city}]（至多 CFG.JARS 口）

    // ============ 酒物注册（13-missing-ids 同款正门：itemById/allItems，不覆盖已有） ============
    function buildWineItems() {
        var out = [];
        RECIPES.forEach(function (r) {
            r.stages.forEach(function (st, si) {
                out.push({
                    id: st.id, name: st.name, type: 'consumable', subtype: 'food', category: 'consumable',
                    quality: ['PIN9', 'PIN8', 'PIN7', 'PIN6'][si], level: 1 + si * 3,
                    price: st.price, effect: JSON.parse(JSON.stringify(st.effect)),
                    stackable: true, maxStack: 20,
                    desc: r.name + '（' + STAGE_WORDS[si] + '档）——窖藏 ' + (si === 0 ? '不足一月' : si === 1 ? '月余' : si === 2 ? '经年' : '数载') + '，酒性醇厚',
                    icon: r.icon
                });
            });
        });
        return out;
    }
    function register(list) {
        if (!window.itemById) window.itemById = {};
        if (!window.allItems) window.allItems = [];
        list.forEach(function (item) {
            if (!item || !item.id) return;
            if (window.itemById[item.id]) return;   // 已有定义不覆盖
            window.itemById[item.id] = item;
            window.allItems.push(item);
        });
    }
    register(buildWineItems());
    (function mergeFoods() {
        var foods = buildWineItems();
        if (window.extendedFood) {
            foods.forEach(function (m) {
                if (!window.extendedFood.some(function (x) { return x.id === m.id; })) window.extendedFood.push(m);
            });
        } else if (window.extendedFoods) {
            foods.forEach(function (m) {
                if (!window.extendedFoods.some(function (x) { return x.id === m.id; })) window.extendedFoods.push(m);
            });
        }
    })();

    // ============ 小工具（赌坊同款口径） ============
    function cd() { return window.currentCharData || null; }
    function say(m, t) { try { if (window.showMessage) window.showMessage(m, t || 'info'); } catch (e) { return false; } return true; }
    function log(m, t) { try { if (window.gameLog && window.gameLog.add) window.gameLog.add(m, t || 'info'); } catch (e) { return false; } return true; }
    function city() {
        return (cd() && cd().location) ||
            (typeof window.getCurrentCityName === 'function' && window.getCurrentCityName()) || '';
    }
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
                var r = window.RewardService.apply(spec, { source: source || '酿酒', city: city() });
                return { ok: !!(r && r.success !== false), note: r && r.messages ? r.messages.join('、') : '' };
            }
        } catch (e) { console.warn('[静默失败] js/crafting/brewing.js · settle：这笔账没落成一笔', e && e.message); }
        return { ok: false, note: '' };
    }
    function advance(min, why) {
        try { if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') window.timeSystem.advanceTime(min, why); } catch (e) { console.warn('[静默失败] js/crafting/brewing.js · advance：时辰没扣成', e && e.message); }
    }
    function cookSkill() {
        try { if (typeof window.getLifeSkill === 'function') return Number(window.getLifeSkill('烹饪')) || 0; } catch (e) { console.warn('[静默失败] js/crafting/brewing.js · cookSkill：烹饪手艺没读出来，按零算', e && e.message); }
        return 0;
    }
    function growCook(n, reason) {
        try { if (typeof window.growLifeSkill === 'function') window.growLifeSkill('烹饪', n, { reason: reason }); } catch (e) { console.warn('[静默失败] js/crafting/brewing.js · growCook：烹饪长进没落账', e && e.message); }
    }
    function refresh() {
        try { if (window.updateCharacterStatus) window.updateCharacterStatus(); } catch (e) { console.warn('[静默失败] js/crafting/brewing.js · refresh：面板没刷新', e && e.message); }
        try { if (typeof window.updateCurrencyUI === 'function') window.updateCurrencyUI(); } catch (e2) { console.warn('[静默失败] js/crafting/brewing.js · refresh：钱袋没刷新', e2 && e2.message); }
    }
    function cellarOk(ct) {
        try {
            var d = window.locationSystem && window.locationSystem.getCityData && window.locationSystem.getCityData(ct || city());
            if (!d || !d.buildings) return false;
            return d.buildings.indexOf('shop') >= 0 || d.buildings.indexOf('market') >= 0;
        } catch (e) { console.warn('[静默失败] js/crafting/brewing.js · cellarOk：城里有没有酒家没问清，按没有算', e && e.message); return false; }
    }
    function countMat(id) {
        var n = 0;
        try {
            var slots = (window.inventory && Array.isArray(window.inventory.slots)) ? window.inventory.slots : [];
            for (var i = 0; i < slots.length; i++) {
                var s = slots[i];
                if (s && s.templateId === id) n += Number(s.count) || 0;
            }
        } catch (e) { console.warn('[静默失败] js/crafting/brewing.js · countMat：行囊没数清，按没有算', e && e.message); }
        return n;
    }
    function takeMat(id, need) {
        try {
            if (typeof window.removeItem !== 'function') return false;
            var slots = (window.inventory && Array.isArray(window.inventory.slots)) ? window.inventory.slots : [];
            var left = need;
            for (var i = 0; i < slots.length && left > 0; i++) {
                var s = slots[i];
                if (!s || s.templateId !== id) continue;
                var take = Math.min(left, Number(s.count) || 0);
                if (take > 0) { window.removeItem(s.uid, take); left -= take; }
            }
            return left <= 0;
        } catch (e) { console.warn('[静默失败] js/crafting/brewing.js · takeMat：材料没能扣走', e && e.message); return false; }
    }
    function matName(id) {
        try { var t = window.itemById && window.itemById[id]; if (t && t.name) return String(t.name); } catch (e) { console.warn('[静默失败] js/crafting/brewing.js · matName：料名没查着', e && e.message); }
        return id;
    }

    function stageOf(days) {
        if (days >= CFG.AGE_AT[2]) return 3;
        if (days >= CFG.AGE_AT[1]) return 2;
        if (days >= CFG.AGE_AT[0]) return 1;
        return 0;
    }
    function jarDays(j) { return Math.max(0, absDay() - (Number(j.brewDay) || 0)); }

    // ============ ① 入坛 ============
    function brew(recipeIdx) {
        var c = cd();
        if (!c) { say('请先创建角色。', 'warning'); return false; }
        if (!cellarOk()) { say('🍶 这地界没有酒家肯借坛——窖坛跟着食肆铺面走。', 'info'); return false; }
        if (_st.jars.length >= CFG.JARS) { say('🍶 三口坛全占着——酒不会坏，但坛位就这么多（启一坛才能再入）。', 'warning'); return false; }
        var r = RECIPES[Math.floor(Number(recipeIdx))];
        if (!r) { say('没有这张酒方。', 'warning'); return false; }
        if (cookSkill() < r.skill) { say('🍶 「' + r.name + '」要烹饪 ' + r.skill + '——你的手艺（' + cookSkill() + '）还不够，糟蹋料。', 'warning'); return false; }
        // 材料先点清（不动账），全齐才开坛
        var miss = [];
        r.mats.forEach(function (m) { if (countMat(m.id) < m.n) miss.push(matName(m.id) + '×' + m.n + '（有 ' + countMat(m.id) + '）'); });
        if (miss.length > 0) { say('🍶 「' + r.name + '」还缺料：' + miss.join('、') + '。', 'warning'); return false; }
        // 坛租
        if (r.rent.stones) {
            var rs = settle({ spiritStones: -r.rent.stones }, '窖坛租');
            if (!rs.ok) { say('🍶 坛租 ' + r.rent.stones + ' 灵石没能付出去——酒家不赊坛。', 'warning'); return false; }
        } else {
            var rc = settle({ copper: -r.rent.copper }, '窖坛租');
            if (!rc.ok) { say('🍶 坛租 ' + r.rent.copper + ' 铜钱没能付出去——酒家不赊坛。', 'warning'); return false; }
        }
        // 扣料（坛租已付、料扣不动则如实说——坛租算酒家的开坛工钱，不退；这是明账）
        var tookAll = true;
        r.mats.forEach(function (m) { if (!takeMat(m.id, m.n)) tookAll = false; });
        if (!tookAll) {
            say('🍶 材料点得齐却没能全入坛（行囊的账没动顺）——这一坛算废了，坛租酒家照收。再试一回。', 'error');
            return false;
        }
        advance(CFG.BREW_MIN, '酿酒');
        _st.jars.push({ rid: r.id, brewDay: absDay(), city: city() });
        growCook(1, '入坛封泥');
        log('🍶 ' + city() + '的酒家窖里，你亲手把' + r.mats.map(function (m) { return matName(m.id) + '×' + m.n; }).join('、') + '下了坛，封泥盖印（坛租 ' + (r.rent.stones ? r.rent.stones + ' 灵石' : r.rent.copper + ' 铜钱') + '）。' + r.name + '要等日子：满 ' + CFG.AGE_AT[0] + ' 日算陈酿、' + CFG.AGE_AT[1] + ' 日世纪藏、' + CFG.AGE_AT[2] + ' 日神工——坛就三口，等不等得起你自己算。（烹饪+1）', 'success');
        say('🍶 ' + r.name + '入坛封泥。日子越久越醇——满 ' + CFG.AGE_AT[0] + ' 日启是陈酿，等到 ' + CFG.AGE_AT[2] + ' 日是神工。（坛位 ' + _st.jars.length + '/' + CFG.JARS + '）', 'success');
        refresh();
        open();
        return true;
    }

    // ============ ④ 启坛 ============
    function openJar(jarIdx) {
        var ji = Math.floor(Number(jarIdx));
        var j = _st.jars[ji];
        if (!j) { say('🍶 没有这口坛。', 'info'); return false; }
        var r = null;
        for (var i = 0; i < RECIPES.length; i++) if (RECIPES[i].id === j.rid) r = RECIPES[i];
        if (!r) { console.warn('[酿酒账] openJar：坛里的酒方对不上号（档内 rid 非法）——这坛按青米酒落账，年份照算不吞酒'); r = RECIPES[0]; }
        var days = jarDays(j);
        var si = stageOf(days);
        var st = r.stages[si];
        advance(CFG.OPEN_MIN, '启坛');
        var back = null;
        try {
            if (typeof window.giveWithReceipt === 'function') back = window.giveWithReceipt(st.id, 1, { quiet: true });
            else if (typeof window.addItem === 'function') back = { got: Number(window.addItem(st.id, 1)) || 0, name: st.name };
        } catch (e) { console.warn('[静默失败] js/crafting/brewing.js · openJar：酒没能出坛', e && e.message); }
        if (!back || !(Number(back.got) > 0)) {
            var fold = Math.max(1, Math.round(st.price * 0.6));
            settle({ spiritStones: fold }, '启坛折价');
            _st.jars.splice(ji, 1);
            // DES-86/90 同口径：带不走的原因吃回执实话，不许站点自己断言满包
            var 由头 = '';
            try { if (typeof window.addItemFailPhraseFor === 'function') 由头 = window.addItemFailPhraseFor(back && back.reason, st.name) || ''; } catch (ePh) { console.warn('[静默失败] js/crafting/brewing.js · openJar：带不走的回执没读出来，按中性话说', ePh && ePh.message); }
            log('🍶 坛开了，酒香满窖——「' + st.name + '」却没能带出酒窖' + (由头 ? '：' + 由头 : '') + '。酒家替你把这坛折了 ' + fold + ' 灵石（六成价，坛位腾出来了）。', 'warning');
            say('🍶 「' + st.name + '」没能带走' + (由头 ? '（' + 由头 + '）' : '') + '——折价 ' + fold + ' 灵石给了酒家。（坛位腾出来了）', 'warning');
            refresh();
            return true;
        }
        _st.jars.splice(ji, 1);
        // v27.13：产出登记——启坛出的酒是酿造产物，盖「craft」章（实收数在 back.got）。登记失败不拦获得。
        try {
            if (window.ItemProvenance && typeof window.ItemProvenance.note === 'function') {
                window.ItemProvenance.note('craft', st.id, Number(back.got) || 1);
            }
        } catch (ePrv) { console.warn('[静默失败] js/crafting/brewing.js · openJar：产出登记未入簿（酒照常到手）', ePrv && ePrv.message); }
        growCook(si + 1, '启坛验酒');
        log('🍶 拍开泥封——窖藏 ' + days + ' 日的' + r.name + '，酒线挂壁，是「' + st.name + '」（' + STAGE_WORDS[si] + '档）！入了行囊。（烹饪+' + (si + 1) + '；自用、送礼、摆进自己铺子，都随你）', 'success');
        say('🍶 启坛：「' + st.name + '」（' + STAGE_WORDS[si] + ' · 窖藏 ' + days + ' 日）入囊——烹饪+' + (si + 1) + '。', 'success');
        refresh();
        open();
        return true;
    }

    // ============ 牌面 ============
    function open() {
        if (!cd()) { say('请先创建角色。', 'warning'); return false; }
        var ct = city();
        if (!ct) { say('🍶 你在荒郊野外——酒家的窖坛在城里。', 'info'); return false; }
        if (!cellarOk(ct)) { say('🍶 ' + ct + '没有肯借坛的酒家——窖坛跟着食肆铺面走。', 'info'); return false; }
        var btn = 'class="w-full p-3 rounded mb-2 text-left text-sm text-white hover:opacity-90"';
        var html = '<p class="text-sm text-gray-400 mb-2">酒家掌柜把你领到窖里：「坛就 ' + CFG.JARS + ' 口，租金现付——酒放着不会坏，就是占坛。」（你的烹饪 ' + cookSkill() + '）</p>';
        // 坛中酒
        if (_st.jars.length > 0) {
            html += '<p class="text-xs text-gray-400 mb-1">窖里的坛（' + _st.jars.length + '/' + CFG.JARS + '）：</p>';
            for (var i = 0; i < _st.jars.length; i++) {
                var j = _st.jars[i];
                var r = null;
                for (var k = 0; k < RECIPES.length; k++) if (RECIPES[k].id === j.rid) r = RECIPES[k];
                var days = jarDays(j);
                var si = stageOf(days);
                var nextWord = si >= 3 ? '已到神工——再等只是占坛' : '再过 ' + (CFG.AGE_AT[si] - days) + ' 日升「' + STAGE_WORDS[si + 1] + '」';
                html += '<div class="flex items-center justify-between p-2 bg-gray-800 rounded border border-gray-700 mb-1">' +
                    '<span class="text-sm text-gray-200">' + (r ? r.icon + ' ' + r.name : '🍶 无名坛') + ' <span class="text-xs text-amber-300">窖藏 ' + days + ' 日 · 今启是「' + (r ? r.stages[si].name : STAGE_WORDS[si]) + '」</span>' +
                    '<span class="block text-[11px] text-gray-500">' + nextWord + ' · 入坛于' + (j.city || ct) + '</span></span>' +
                    '<button onclick="window.Brewing.openJar(' + i + ')" class="px-3 py-1 rounded text-xs bg-amber-800 text-white">启坛</button></div>';
            }
        } else {
            html += '<p class="text-xs text-gray-500 mb-2">窖里空着三口坛。</p>';
        }
        // 酒方
        html += '<p class="text-xs text-gray-400 mt-2 mb-1">三张酒方（年份线：' + CFG.AGE_AT[0] + '/' + CFG.AGE_AT[1] + '/' + CFG.AGE_AT[2] + ' 日 → ' + STAGE_WORDS.join('/') + '）：</p>';
        for (var ri = 0; ri < RECIPES.length; ri++) {
            var rc = RECIPES[ri];
            var mats = rc.mats.map(function (m) { return matName(m.id) + '×' + m.n + (countMat(m.id) >= m.n ? '✓' : '<span class="text-red-300">缺</span>'); }).join(' · ');
            html += '<button onclick="window.Brewing.brew(' + ri + ')" ' + btn.replace('p-3', 'bg-amber-950 p-3') + '>' + rc.icon + ' ' + rc.name +
                ' <span class="text-xs text-amber-300">烹饪 ' + rc.skill + ' · 坛租 ' + (rc.rent.stones ? rc.rent.stones + ' 灵石' : rc.rent.copper + ' 铜钱') + '</span>' +
                '<span class="block text-xs text-gray-400">' + rc.desc + '</span>' +
                '<span class="block text-[11px] text-gray-500">料：' + mats + ' · 神工档「' + rc.stages[3].name + '」值 ' + rc.stages[3].price + ' 灵石</span></button>';
        }
        html += '<p class="text-[11px] text-gray-500 mt-1">酿的酒是正经物件：自用回状态、送礼涨好感、摆进自己当掌柜的铺子卖高价——「' + RECIPES[2].stages[3].name + '」整幅回满，值 ' + RECIPES[2].stages[3].price + ' 灵石。</p>';
        if (typeof window.showBuildingEffectDialog === 'function') {
            window.showBuildingEffectDialog('🍶 酒家窖坛 · 酿酒 · ' + ct, html);
            return true;
        }
        return false;
    }

    // ============ 存读档（StateRegistry 正门） ============
    function _export() { return JSON.parse(JSON.stringify(_st)); }
    function _import(d) {
        var s = { jars: [] };
        if (d && typeof d === 'object' && Array.isArray(d.jars)) {
            var ids = RECIPES.map(function (r) { return r.id; });
            for (var i = 0; i < d.jars.length && s.jars.length < CFG.JARS; i++) {
                var j = d.jars[i];
                if (!j || typeof j !== 'object' || ids.indexOf(j.rid) < 0) continue;
                s.jars.push({
                    rid: j.rid,
                    brewDay: Number.isFinite(Number(j.brewDay)) ? Math.max(0, Math.floor(Number(j.brewDay))) : absDay(),
                    city: typeof j.city === 'string' ? j.city.slice(0, 30) : ''
                });
            }
        }
        _st = s;
    }
    function _reset() { _st = { jars: [] }; }
    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        window.StateRegistry.register('brewing', { version: 1, export: _export, import: _import, reset: _reset });
    }

    window.Brewing = {
        CFG: CFG, RECIPES: RECIPES, STAGE_WORDS: STAGE_WORDS,
        cellarOk: cellarOk, stageOf: stageOf, jarDays: jarDays,
        brew: brew, openJar: openJar,
        open: open,
        state: _export
    };
    window.openBrewingCellar = function () { return open(); };
})();
