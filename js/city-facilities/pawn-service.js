// js/city-facilities/pawn-service.js — 当铺账房：典当有当期、凭票可赎回、过期即死当
// v20.20：把票面上写过的"当期一月，月内不赎即为死当"做实。银钱与货件一律走统一结算事务
// （RewardService→EconomyTransaction），本模块只管当票账本（_pawn 字段，随存档白名单成对往返）。
(function (global) {
    'use strict';

    var TERM_DAYS = 30;         // 当期一月
    var PAWN_RATIO = 0.7;       // 当金=行价的七折（死当卖断才给足行价，当票便宜是行规）
    var REDEEM_MARKUP = 1.15;   // 赎回加息一成五（银钱占用费的行价，过期为死当不给赎）

    function num(v) { return Number(v) || 0; }
    function char() { return global.currentCharData || null; }
    function day() { return (typeof global.getAbsoluteDay === 'function') ? global.getAbsoluteDay() : 0; }
    function stonesNow() {
        if (global.XianXia && global.XianXia.DataManager) return num(global.XianXia.DataManager.getSpiritStones());
        var p = char();
        return p ? num(p.spiritStones) : 0;
    }
    // 本城收购系数：当金价随行就市，不写死
    function sellMod() {
        var city = '';
        if (typeof global.getCurrentCityName === 'function') city = global.getCurrentCityName() || '';
        var ls = global.locationSystem;
        try {
            if (ls && typeof ls.getCityPriceModifier === 'function') {
                var m = Number(ls.getCityPriceModifier(city, 'sell'));
                if (isFinite(m) && m > 0) return m;
            }
            if (ls && typeof ls.getCityData === 'function') {
                var d = ls.getCityData(city);
                var pm = d && d.priceModifier && Number(d.priceModifier.sell);
                if (isFinite(pm) && pm > 0) return pm;
            }
        } catch (e) { /* 问不到行情按平价 */ }
        return 1;
    }
    function pay(spec) {
        if (!global.RewardService) return { success: false, reason: 'reward_service_unavailable' };
        return global.RewardService.apply(spec, { source: 'pawn' });
    }
    // 当票账本懒初始化（挂在角色 _pawn 上随档往返——单一真源，无平行状态）
    function ledger() {
        var p = char();
        if (!p) return null;
        if (!p._pawn || typeof p._pawn !== 'object') p._pawn = { item: '', count: 0, loan: 0, due: 0 };
        var b = p._pawn;
        b.item = typeof b.item === 'string' ? b.item : '';
        b.count = Math.max(0, num(b.count));
        b.loan = Math.max(0, num(b.loan));
        b.due = num(b.due);
        // 第八十三波·实例账：柜上替客人收着的原物快照（uid/耐久/强化）——赎回归还原物，不再造白板新货
        if (b.snap != null && typeof b.snap !== 'object') b.snap = null;
        if (b.snap && !b.snap.templateId) b.snap = null;
        return b;
    }
    function itemName(itemId) {
        var tpl = global.itemById && global.itemById[itemId];
        return (tpl && tpl.name) || itemId;
    }
    function active(b) { return !!b && !!b.item && b.count > 0; }
    function log(m, t) { (global.gameLog || { add: function () {} }).add(m, t || 'info'); }

    var PawnService = {
        // 只读口径（柜台话术/情境文案共用）
        summary: function () {
            var b = ledger();
            if (!b) return null;
            var isActive = active(b);
            return {
                active: isActive, item: b.item, count: b.count, loan: b.loan, due: b.due,
                daysLeft: isActive ? Math.max(0, b.due - day()) : 0,
                forfeited: isActive && day() > b.due,
                redeemFee: isActive ? Math.round(b.loan * REDEEM_MARKUP) : 0,
                sellMod: sellMod()
            };
        },

        // 典当：货上柜、当金按本城行情折给，货不够整笔不成交
        pawnItem: function (itemId, count, base) {
            var b = ledger();
            if (!b) return { error: '当铺不与无名氏交易' };
            if (active(b)) return { error: '柜上已有你一张当票，一票一物' };
            itemId = String(itemId || '');
            count = Math.max(1, Math.floor(num(count)) || 1);
            base = Math.floor(num(base));
            if (!itemId || base <= 0) return { error: '这件货柜上不收' };
            // 第八十三波·实例账：装备带耐久/强化的实例账，按模板扣货会扣错件、赎回归还会造白板——
            // 装备一律走 pawnInstance（按 uid 当具体那一件）
            var _tpl = global.itemById && global.itemById[itemId];
            if (_tpl && _tpl.type === 'equipment') return { error: '兵器甲胄要按件当——翻开行囊清单，当的就是你手里那一件' };
            var loan = Math.max(1, Math.round(base * sellMod() * PAWN_RATIO));
            var r = pay({ stones: loan, take: [{ itemId: itemId, count: count }] });
            if (!r || r.success === false) {
                return { error: r && r.reason === 'missing_item' ? '行囊里没有这件货' : '交割未成' };
            }
            b.item = itemId; b.count = count; b.loan = loan; b.due = day() + TERM_DAYS;
            b.snap = null;
            log('掌柜验了货，按本城行情折成当金 ' + loan + ' 灵石点给你："' + itemName(itemId) +
                ' 上柜，当期一月——' + b.due + ' 日前拿当票来赎，过期即为死当。"', 'success');
            return { success: true, messages: ['当金 ' + loan + ' 灵石，' + b.due + ' 日前可赎（赎回需 ' + Math.round(loan * REDEEM_MARKUP) + '）'] };
        },

        // 第八十三波·实例账：按 uid 当具体那一件（装备的耐久/强化/身世随快照上柜，赎回归还原物）
        pawnInstance: function (uid) {
            var b = ledger();
            if (!b) return { error: '当铺不与无名氏交易' };
            if (active(b)) return { error: '柜上已有你一张当票，一票一物' };
            uid = String(uid || '');
            var slots = (global.inventory && global.inventory.slots) || [];
            var slot = null;
            for (var i = 0; i < slots.length; i++) { if (slots[i] && slots[i].uid === uid) { slot = slots[i]; break; } }
            if (!slot) return { error: '行囊里没有这件货' };
            var tpl = global.itemById && global.itemById[slot.templateId];
            if (!tpl) return { error: '这件货柜上认不得（没有行价）' };
            var base = Math.floor(num(tpl.price));
            if (base <= 0) return { error: '这件货柜上不收（不值钱）' };
            // 先立快照再交割：pay 按 uid 扣的就是这一件，扣不成整笔回滚（快照不落账）
            var snap = null;
            try { snap = global.EconomyTransaction ? global.EconomyTransaction.slotSnapshot(slot) : null; } catch (e) {}
            if (!snap || !snap.templateId) return { error: '这件货的实例账立不起来，柜上不敢收' };
            var loan = Math.max(1, Math.round(base * sellMod() * PAWN_RATIO));
            var r = pay({ stones: loan, take: [{ itemId: slot.templateId, count: 1, uid: uid }] });
            if (!r || r.success === false) {
                return { error: r && r.reason === 'missing_item' ? '行囊里没有这件货' : '交割未成' };
            }
            try { if (global.inventory && global.inventory.markedForSale) global.inventory.markedForSale.delete(uid); } catch (eM) {}
            b.item = slot.templateId; b.count = 1; b.loan = loan; b.due = day() + TERM_DAYS;
            b.snap = snap;
            var durTxt = (snap.durability != null) ? '（连同磨痕旧渍一并收进柜里）' : '';
            log('掌柜把' + itemName(b.item) + '翻来覆去验了个仔细' + durTxt + '，按本城行情折成当金 ' + loan +
                ' 灵石点给你："原物上柜，赎当归原物——当期一月，' + b.due + ' 日前来取，过期死当。"', 'success');
            return { success: true, messages: ['当金 ' + loan + ' 灵石，' + b.due + ' 日前可赎（赎回需 ' + Math.round(loan * REDEEM_MARKUP) + '）'] };
        },

        // 赎回：加息一成五，货回行囊；背包放不下就赎不走（货还在柜上，账不变）
        redeem: function () {
            var b = ledger();
            if (!b) return { error: '当铺不与无名氏交易' };
            if (!active(b)) return { error: '你柜上没有当票' };
            if (day() > b.due) { PawnService.forfeitCheck(); return { error: '当票过期，物件已作死当拍给货郎，赎不回了' }; }
            var fee = Math.round(b.loan * REDEEM_MARKUP);
            // 实例账：柜上有快照的原物奉还（uid/耐久/强化一样不少）；老当票没快照的照旧按模板补货
            var giveItem = b.snap
                ? { itemId: b.item, count: b.count, snap: b.snap }
                : { itemId: b.item, count: b.count };
            var r = pay({ stones: -fee, items: [giveItem] });
            if (!r || r.success === false) {
                return { error: r && r.reason === 'spiritStones' ? '当金加息共 ' + fee + ' 灵石，手头不足' : '赎回未成（背包放不下，货仍在你柜上）' };
            }
            var nm = itemName(b.item), oldLoan = b.loan;
            b.item = ''; b.count = 0; b.loan = 0; b.due = 0; b.snap = null;
            log('你点清 ' + fee + ' 灵石（当金 ' + oldLoan + ' 加息一成五），掌柜从内柜请出' + nm + '——原物奉还，当票就烛焚了。', 'success');
            return { success: true, messages: ['赎回 ' + nm + '，付 ' + fee + ' 灵石'] };
        },

        // 过期死当：票销、货归铺（货在成交那日就上了柜，此处只销账）
        forfeitCheck: function () {
            var b = ledger();
            if (!active(b) || day() <= b.due) return null;
            var nm = itemName(b.item);
            b.item = ''; b.count = 0; b.loan = 0; b.due = 0; b.snap = null;
            log('想起当柜上那件' + nm + '时已过了赎期——掌柜摊手："过期为死当，早拍给货郎了。"票根在你手里，成了一张废纸。', 'warning');
            return { forfeited: true, item: nm };
        },

        // 柜台话术（情境弹窗共用，账目如实播报）
        describe: function () {
            var s = PawnService.summary();
            var t = '当铺掌柜拨着算盘："本店票面写得清楚：当期一月，月内不赎即为死当。当金按本城行情折给，赎回归本加息一成五。"';
            if (!s) return t;
            if (s.active) {
                t += s.forfeited
                    ? '\n\n你的当票已经过期——掌柜顺着你的目光看了看空了半格的内柜，什么也没说。'
                    : '\n\n你的当票：' + itemName(s.item) + ' ×' + s.count + '，当金 ' + s.loan + ' 灵石，' + s.daysLeft +
                      ' 日内凭票赎回需 ' + s.redeemFee + ' 灵石。过期为死当，概不找回。';
            }
            return t;
        },

        // ============ 第八十二波·当铺-01：自选典当入口（第八十三波添装备实例账） ============
        // pawnItem 本就支持任意散货，但场景选项写死龙鳞甲一格，玩家无法自选。
        // 柜台上加一张「自选典当」清单：散货按模板聚合列；装备逐件列（带 uid）——
        // 同是两把剑，当的是哪一把、赎回来还是那把（耐久/强化随快照上柜，pawnInstance）。
        pawnableList: function () {
            var out = [];
            var slots = (global.inventory && global.inventory.slots) || [];
            var seen = {};
            for (var i = 0; i < slots.length; i++) {
                var s = slots[i];
                if (!s || !s.templateId) continue;
                var tpl = global.itemById && global.itemById[s.templateId];
                if (!tpl) continue;
                var price = Math.floor(num(tpl.price));
                if (price <= 0) continue;
                if (tpl.type === 'equipment') {
                    if (!s.uid) continue;   // 裸格子没有实例账，按件当不了（读档归一后自然可当）
                    out.push({ uid: s.uid, itemId: s.templateId, name: tpl.name || s.templateId, icon: tpl.icon || '📦', count: 1, base: price, dur: (s.durability != null ? num(s.durability) : null), inst: true });
                } else {
                    if (seen[s.templateId]) continue;
                    seen[s.templateId] = true;
                    out.push({ itemId: s.templateId, name: tpl.name || s.templateId, icon: tpl.icon || '📦', count: num(s.count) || 1, base: price });
                }
            }
            out.sort(function (a, b) { return b.base - a.base; });
            return out;
        },

        openPicker: function () {
            if (typeof document === 'undefined') return;
            var b = ledger();
            if (b && active(b)) {
                log('掌柜指指柜里的当票："一票一物——先赎了这张，或等它死当，柜上才收新货。"', 'warning');
                return;
            }
            var list = PawnService.pawnableList();
            var modal = document.createElement('div');
            modal.id = 'pawn-picker-modal';
            modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
            modal.onclick = function (e) { if (e.target === modal) modal.remove(); };
            var rows = list.length ? '' : '<p class="text-sm text-gray-400 py-3">行囊里没有柜上收的货（无价的奇物不收）。</p>';
            list.forEach(function (it) {
                var loan = Math.max(1, Math.round(it.base * sellMod() * PAWN_RATIO));
                var durTxt = (it.inst && it.dur != null) ? ' · 耐久' + it.dur : '';
                var call = it.inst
                    ? 'PawnService.pawnFromPicker(null, \'' + it.uid + '\')'
                    : 'PawnService.pawnFromPicker(\'' + it.itemId + '\')';
                rows += '<div class="flex items-center justify-between p-2 rounded bg-gray-800 mb-2">' +
                    '<span class="text-sm text-gray-200">' + it.icon + ' ' + it.name + (it.inst ? '' : ' ×' + it.count) + durTxt + '</span>' +
                    '<span class="text-xs text-gray-400 mr-2">行价' + it.base + ' · 当金约' + loan + '</span>' +
                    '<button onclick="' + call + '" class="px-3 py-1 rounded text-xs bg-amber-700 hover:bg-amber-600 text-white">当' + (it.inst ? '这件' : '一件') + '</button>' +
                    '</div>';
            });
            modal.innerHTML = '<div class="bg-gray-900 border-2 border-amber-700 rounded-lg p-5 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">' +
                '<h3 class="text-lg font-bold text-amber-400 mb-2">🎒 自选典当</h3>' +
                '<p class="text-xs text-gray-400 mb-3">当金按本城行情七折，当期一月，赎归加息一成五；一票一物。装备按件当——赎回来还是原来那件。</p>' +
                rows +
                '<button onclick="document.getElementById(\'pawn-picker-modal\').remove()" class="w-full mt-2 bg-gray-700 hover:bg-gray-600 text-white p-2 rounded text-sm">收起</button>' +
                '</div>';
            if (document.body && typeof document.body.appendChild === 'function') document.body.appendChild(modal);
        },

        // 清单上点「当」：散货按模板、装备按 uid（实例账）；成交即收窗（一票一物，柜上只容一张票）
        pawnFromPicker: function (itemId, uid) {
            var r;
            if (uid) {
                r = PawnService.pawnInstance(uid);
            } else {
                var tpl = global.itemById && global.itemById[itemId];
                var base = tpl ? Math.floor(num(tpl.price)) : 0;
                r = PawnService.pawnItem(itemId, 1, base);
            }
            try {
                var m = document.getElementById('pawn-picker-modal');
                if (m) m.remove();
            } catch (e) {}
            if (r && r.error) { log('掌柜摇头："' + r.error + '"', 'warning'); return; }
            if (global.updateInventoryUI) { try { global.updateInventoryUI(); } catch (e2) {} }
            if (global.updateCurrencyUI) { try { global.updateCurrencyUI(); } catch (e3) {} }
        },

        _wired: false,
        wire: function () {
            if (PawnService._wired) return;
            PawnService._wired = true;
            if (global.timeSystem && typeof global.timeSystem.onNewDaySubscribe === 'function') {
                global.timeSystem.onNewDaySubscribe(function () { PawnService.forfeitCheck(); });
            }
        }
    };

    global.PawnService = PawnService;
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () { PawnService.wire(); });
        } else {
            PawnService.wire();
        }
    }
})(typeof window !== 'undefined' ? window : this);
