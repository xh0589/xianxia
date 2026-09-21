// ==================== 第七十波 · 街边摆摊（自己的货，卖个公道价） ====================
// 行囊里压着的战利品，此前只有一条出路：贱卖给铺子（回购只出两三成价，铺子吃的是省事钱）。
// 街边摊贩卖同样的货能卖出现钱两倍——本账把这条路开给玩家：商埠城里支个摊，货直接卖给出行的过客。
// 摊上的账：①价钱公道但有客流上限——一场摊就几个过客（基础三人，口才声望能多招一两个），
//             批发快贱、零售慢贵，两头都是真价钱，谁也不吃掉谁；
//           ②支摊真花代价：占地钱、精力、一个时辰——雨说来就来、地痞说来就来（一枚骰，摊前的事谁也说不准）；
//           ③钱货同笔交割（统一结算事务）：货离囊与钱入袋是一件事，扣不成整笔不成交；
//           ④零新存档字段：摊是当场的事，散了就散——读档不欠账；卖满三件长一分商道（六十九波开的行当，这儿也长它）。
(function () {
    'use strict';

    var CFG = {
        STALL_FEE: 2,        // 占地钱（铜钱，缴给市司——只出不进）
        STALL_EN: 10,        // 支摊耗精力
        STALL_MIN: 120,      // 一场摊守一个时辰（第九十五波·NEW-34：1时辰=120分钟；旧注口算错了，与实扣对不上）
        RATE: 0.65,          // 摊价=底价×六五折（比铺子回购公道，比行价便宜——过客图的就是这个）
        BASE_FOOT: 3,        // 基础客流
        FOOT_CAP: 6,         // 客流封顶（大客来了也挤不下更多）
        FOOT_VIP: 2,         // 大客临门多两位
        SPEECH_TIERS: [{ at: 50, add: 1 }, { at: 80, add: 2 }],   // 口才招客
        REP_TIERS: [{ at: 50, add: 1 }, { at: 100, add: 2 }],     // 本城声望招客
        RAIN_P: 0.12,        // 骤雨分界（一枚骰四段：雨/地痞/大客/晴）
        THUG_P: 0.24,
        VIP_P: 0.36,
        THUG_COPPER: 15,     // 地痞「借」走的铜钱
        THUG_REP_SAFE: 40,   // 声望过此数，地痞赔笑走开（看客反倒多一位）
        THUG_MOOD: 5,        // 掏不出钱被掀了摊——心境下挫
        SKILL_MIN_SOLD: 3,   // 卖满三件长商道
        SKILL_EXP: 1
    };

    var session = null;   // 当场的事当场记——不落存档

    // ============ 小工具 ============
    function cd() { return window.currentCharData || null; }
    function say(m, t) { try { if (window.showMessage) window.showMessage(m, t || 'info'); } catch (e) {} }
    function log(m, t) { try { if (window.gameLog && window.gameLog.add) window.gameLog.add(m, t || 'info'); } catch (e) {} }
    function city() {
        return (cd() && cd().location) ||
            (typeof window.getCurrentCityName === 'function' && window.getCurrentCityName()) || '';
    }
    // 商埠城才支得起摊：城里得有铺面或市集（仙山佛窟没有红尘买卖——老规矩）
    function marketCityOk(ct) {
        try {
            var d = window.locationSystem && window.locationSystem.getCityData && window.locationSystem.getCityData(ct || city());
            if (!d || !d.buildings) return false;
            return d.buildings.indexOf('shop') >= 0 || d.buildings.indexOf('market') >= 0;
        } catch (e) { return false; }
    }
    function rep(ct) {
        try { if (typeof window.getReputationValue === 'function') return Number(window.getReputationValue(ct || city())) || 0; } catch (e) {}
        return 0;
    }
    function speech() {
        var c = cd();
        return (c && c.lifeSkills && Number(c.lifeSkills['口才'])) || 0;
    }
    function speechMul() { return 1 + Math.min(0.2, speech() / 5 * 0.01); }   // 铺面同款口舌账
    function repMul(ct) { return 1 + Math.min(0.1, rep(ct) / 100 * 0.01); }
    function citySellMul(ct) {
        try {
            var ls = window.locationSystem;
            if (ls && typeof ls.getCityPriceModifier === 'function') {
                var m = Number(ls.getCityPriceModifier(ct || city(), 'sell'));
                if (isFinite(m) && m > 0) return m;
            }
            var d = ls && ls.getCityData && ls.getCityData(ct || city());
            var pm = d && d.priceModifier && Number(d.priceModifier.sell);
            if (isFinite(pm) && pm > 0) return pm;
        } catch (e) {}
        return 1;
    }
    function durMul(slot) {
        if (!slot || slot.durability == null) return 1;
        var r = Number(slot.durability) / 100;
        if (r >= 0.8) return 1;
        if (r >= 0.5) return 0.8;
        if (r >= 0.3) return 0.6;
        return 0.4;
    }
    function tplOf(slot) {
        try {
            if (slot && typeof slot.getTemplate === 'function') return slot.getTemplate();
            var id = slot && (slot.templateId || slot.id);
            return (id && window.itemById && window.itemById[id]) || null;
        } catch (e) { return null; }
    }
    // 摊上不收的东西：任务信物、钱票、秘籍（秘籍不走通用货架——老规矩）
    function sellable(slot) {
        var t = tplOf(slot);
        if (!slot || !t) return false;
        if (!(Number(slot.count) > 0)) return false;
        if (t.category === 'quest' || t.category === 'currency' || t.subtype === 'manual') return false;
        return (Number(t.price || t.basePrice) || 0) > 0;
    }
    function currencyOf(t) {
        try {
            if (window.TradeService && typeof window.TradeService.getCurrencyType === 'function') {
                return window.TradeService.getCurrencyType(t) === 'copper' ? 'copper' : 'stone';
            }
        } catch (e) {}
        if (t && (t.subtype === 'food' || t.subtype === 'ingredient' || t.type === 'food')) return 'copper';
        return 'stone';
    }
    function unitPrice(slot, ct) {
        var t = tplOf(slot);
        if (!t) return 0;
        var base = Number(t.price || t.basePrice) || 0;
        var v = base * CFG.RATE * speechMul() * repMul(ct) * durMul(slot) * citySellMul(ct);
        if (session && session.priceMul) v *= session.priceMul;
        return Math.max(1, Math.floor(v));
    }
    function footfall(ct) {
        var f = CFG.BASE_FOOT, i;
        for (i = 0; i < CFG.SPEECH_TIERS.length; i++) { if (speech() >= CFG.SPEECH_TIERS[i].at) f += CFG.SPEECH_TIERS[i].add; }
        var r = rep(ct);
        for (i = 0; i < CFG.REP_TIERS.length; i++) { if (r >= CFG.REP_TIERS[i].at) f += CFG.REP_TIERS[i].add; }
        return Math.min(CFG.FOOT_CAP, f);
    }
    function settle(spec) {
        try {
            if (window.RewardService && typeof window.RewardService.apply === 'function') {
                var r = window.RewardService.apply(spec, { source: '街边摆摊', city: city() });
                return { ok: !!(r && r.success !== false), note: r && r.messages ? r.messages.join('、') : '' };
            }
        } catch (e) {}
        return { ok: false, note: '' };
    }
    function sellables() {
        var out = [];
        try {
            var slots = (window.inventory && window.inventory.slots) || [];
            for (var i = 0; i < slots.length; i++) {
                if (sellable(slots[i])) out.push(slots[i]);
            }
        } catch (e) {}
        return out;
    }
    function findSlot(uid) {
        var slots = (window.inventory && window.inventory.slots) || [];
        for (var i = 0; i < slots.length; i++) { if (slots[i] && slots[i].uid === uid) return slots[i]; }
        return null;
    }
    function absDay() {
        try {
            if (window.WorldCalendar && typeof window.WorldCalendar.day === 'number' && window.WorldCalendar.day > 0) return Math.floor(window.WorldCalendar.day);
            if (typeof window.getAbsoluteDay === 'function') { var g = window.getAbsoluteDay(); if (g) return Math.floor(g); }
            if (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') { var t = window.timeSystem.getAbsoluteDay(); if (t) return Math.floor(t); }
        } catch (e) {}
        return 0;
    }
    // 第七十四波·市井有脸：摊前过客按城+日+第几位播种（同日同摊来的都是这几张熟面孔；缺册退回「一位过客」）
    function buyerName(idx) {
        try {
            if (window.CityFaces && typeof window.CityFaces.passerby === 'function' && session) {
                var pb = window.CityFaces.passerby(session.city, absDay(), idx);
                if (pb && pb.addr) return pb.addr;
            }
        } catch (e) {}
        return '';
    }

    // ============ 支摊（一枚骰定这场摊的遭遇——摊前的事谁也说不准） ============
    function rollEvent() {
        var r = Math.random();
        if (r < CFG.RAIN_P) {
            session.foot = Math.floor(session.foot / 2);
            session.event = 'rain';
            return '🌧️ 摊子刚支起来，天说变就变——一场骤雨把街面浇得汪汪的，过客少了一半。你守在檐下，能卖一件是一件。';
        }
        if (r < CFG.THUG_P) {
            if (rep() >= CFG.THUG_REP_SAFE) {
                session.foot += 1;
                session.event = 'thug_off';
                return '😠 两个闲汉晃到摊前，刚要伸手「借」点货——认出了你的脸，讪讪缩回手赔笑走了。街坊看热闹，反倒多了一位真买主。';
            }
            var paid = settle({ copper: -CFG.THUG_COPPER });
            if (paid.ok) {
                session.event = 'thug_paid';
                return '😠 市井混混晃过来，也不说话，抓起秤砣掂了掂。破财免灾——「借」走你 ' + CFG.THUG_COPPER + ' 铜钱，扬长去了。';
            }
            settle({ mood: -CFG.THUG_MOOD });
            session.event = 'thug_broke';
            return '😠 市井混混来「借」钱，你摸遍口袋比脸还干净。他啐了一口，一脚踹歪了摊架——货没丢，人丢大了。（心境-' + CFG.THUG_MOOD + '）';
        }
        if (r < CFG.VIP_P) {
            session.foot = Math.min(8, session.foot + CFG.FOOT_VIP);
            session.priceMul = 1.1;
            session.event = 'vip';
            return '✨ 一位穿绸的管事在摊前站住：「府上正要采买些散货，你只管拿，价钱好说。」——大客临门，出价也爽利了一成。';
        }
        session.event = 'clear';
        return '☀️ 天公作美，街面上人来人往。你把幌子挂高了些——开摊。';
    }

    function open() {
        if (session) { say('🧺 摊子还支着呢——先收了这场，再谈下一场。', 'info'); return false; }
        if (!marketCityOk()) { say('🧺 这地界没有红尘买卖——仙山佛窟支不得摊。', 'info'); return false; }
        var c = cd();
        if (!c) return false;
        if (Number(c.energy) < CFG.STALL_EN) { say('🧺 精力不够支摊——连货都搬不动，出什么摊。', 'warning'); return false; }
        if (!sellables().length) { say('🧺 行囊里没有能上摊的货——空着手支摊，过客看什么？', 'info'); return false; }
        var fee = settle({ copper: -CFG.STALL_FEE });
        if (!fee.ok) { say('🧺 占地钱 ' + CFG.STALL_FEE + ' 铜钱都凑不出——市司的差役把你请走了。', 'warning'); return false; }
        c.energy = Math.max(0, Number(c.energy) - CFG.STALL_EN);
        try { if (window.timeSystem && window.timeSystem.advanceTime) window.timeSystem.advanceTime(CFG.STALL_MIN, '街边摆摊'); else if (window.advanceTime) window.advanceTime(CFG.STALL_MIN, '街边摆摊'); } catch (e) {}
        try { if (window.updateCharacterStatus) window.updateCharacterStatus(); } catch (e2) {}
        session = { city: city(), foot: footfall(), sold: 0, event: '', priceMul: 1 };
        var ev = rollEvent();
        log('🧺 你在' + session.city + '街边支起了摊（占地钱 ' + CFG.STALL_FEE + ' 铜、一个时辰）。' + ev, 'info');
        render();
        return true;
    }

    // ============ 摊面 ============
    function moneyWord(cur) { return cur === 'copper' ? '铜钱' : '灵石'; }
    function render() {
        if (!session) return;
        var rows = sellables();
        var html = '<p class="text-sm text-gray-300 mb-2">摊前客流还剩 <span class="text-amber-300 font-bold">' + session.foot + '</span> 位，摊上卖出 <span class="text-emerald-300 font-bold">' + session.sold + '</span> 件。货离了囊概不退换——过客图便宜，你图现钱。</p>';
        if (!rows.length) {
            html += '<p class="text-xs text-gray-500 mb-3">行囊里能卖的货都卖空了。</p>';
        } else {
            html += '<div class="space-y-1 mb-3 max-h-64 overflow-y-auto">';
            for (var i = 0; i < rows.length; i++) {
                var s = rows[i], t = tplOf(s);
                var cur = currencyOf(t);
                var up = unitPrice(s);
                html += '<div class="flex items-center justify-between p-2 bg-gray-800 rounded border border-gray-700">' +
                    '<span class="text-sm text-gray-200">' + (t.icon || '📦') + ' ' + (t.name || '杂货') + ' ×' + Number(s.count) +
                    ' <span class="text-xs text-amber-300">' + up + ' ' + moneyWord(cur) + '/件</span></span>' +
                    '<button onclick="StreetStall.stage(\'' + s.uid + '\')" class="px-3 py-1 rounded text-xs bg-amber-700 hover:bg-amber-600 text-white">上摊卖一件</button>' +
                    '</div>';
            }
            html += '</div>';
        }
        html += '<button onclick="StreetStall.close()" class="w-full p-2 rounded text-sm bg-gray-700 hover:bg-gray-600 text-white">🧺 收摊</button>';
        if (typeof window.showModal === 'function') window.showModal('🧺 街边摆摊 · ' + session.city, html);
    }

    // ============ 卖一件（钱货同笔交割） ============
    function stage(uid) {
        if (!session) { say('🧺 摊子早收了。', 'info'); return false; }
        if (session.foot <= 0) { say('🧺 客流尽了——街面上再没人驻足，收摊吧。', 'info'); return false; }
        var slot = findSlot(uid);
        if (!slot || !sellable(slot)) { say('🧺 这件货不在摊上。', 'warning'); return false; }
        var t = tplOf(slot);
        var cur = currencyOf(t);
        var price = unitPrice(slot);
        var spec = { take: [{ itemId: t.id || slot.templateId || slot.id, count: 1 }] };
        if (cur === 'copper') spec.copper = price; else spec.spiritStones = price;
        var r = settle(spec);
        if (!r.ok) { say('🧺 这单没做成——货还在你囊里。', 'warning'); return false; }
        session.foot--; session.sold++;
        try { if (window.MarketDynamic && typeof window.MarketDynamic.notePlayerTrade === 'function') window.MarketDynamic.notePlayerTrade(t.id, 1, false); } catch (e) {}
        try { if (window.updateInventoryUI) window.updateInventoryUI(); } catch (e2) {}
        // 市井有脸：买主报得出称呼；同一张脸再上门，就是熟客了
        var buyer = buyerName(session.sold - 1);
        var again = '';
        if (buyer) {
            session._seen = session._seen || {};
            if (session._seen[buyer]) again = '——又是这位，摊前认熟了。';
            session._seen[buyer] = 1;
        }
        log('🧺 ' + (buyer || '一位过客') + '买走了「' + (t.name || '货') + '」，付你 ' + price + ' ' + moneyWord(cur) + '。' + again + (r.note ? '（' + r.note + '）' : ''), 'success');
        if (session.foot <= 0) { close(true); return true; }
        render();
        return true;
    }

    // ============ 收摊 ============
    function close(auto) {
        if (!session) return;
        var s = session;
        session = null;
        if (s.sold >= CFG.SKILL_MIN_SOLD) {
            var grew = settle({ lifeSkill: { name: '商道', exp: CFG.SKILL_EXP } });
            if (!grew.ok) {
                try {
                    var c = cd();
                    if (c) {
                        c.lifeSkills = c.lifeSkills || {};
                        var v = Number(c.lifeSkills['商道'] || 0);
                        c.lifeSkills['商道'] = Math.min(100, v + CFG.SKILL_EXP);
                    }
                } catch (e) {}
            }
        }
        var tail = s.sold >= CFG.SKILL_MIN_SOLD ? '卖出了门道——商道长了一分。' : '';
        log('🧺 收摊了：这场摊卖出 ' + s.sold + ' 件货。' + tail, 'info');
        if (!auto) say('🧺 你把摊架收起来，掸掸衣襟上的土。' + (tail ? '（' + tail + '）' : ''), 'info');
        try { if (window.updateCharacterStatus) window.updateCharacterStatus(); } catch (e2) {}
        // 第九十五波·NEW-35：收摊即流程终点——软收 showModal 开的摊面（自动收摊同样收），
        // 旧版只清状态不关窗，摊早收了牌面还挂着「已不存在的货 + 已结束的场」
        try { if (typeof window.closeModalSoft === 'function') window.closeModalSoft(); } catch (e3) {}
    }

    // ============ 城市面板上的摊子（商埠城才挂，仙山佛窟静默） ============
    function panelHtml(cityName) {
        try {
            if (!marketCityOk(cityName)) return '';
            if (cityName && city() && cityName !== city()) return '';
            return '<div class="p-2 bg-amber-900/20 rounded border border-amber-800/50">' +
                '<button onclick="StreetStall.open()" class="w-full text-left text-sm text-amber-300 hover:text-amber-200">🧺 街边支个摊（把行囊里的货卖给出行的过客——比铺子回购公道，就是耗时辰、看天吃饭）</button>' +
                '</div>';
        } catch (e) { return ''; }
    }

    window.StreetStall = {
        CFG: CFG,
        marketCityOk: marketCityOk,
        sellables: sellables,
        unitPrice: unitPrice,
        footfall: footfall,
        session: function () { return session; },
        open: open,
        stage: stage,
        close: close,
        render: render,
        panelHtml: panelHtml
    };
    window.openStreetStall = function () { return open(); };
})();
