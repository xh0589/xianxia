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
            var loan = Math.max(1, Math.round(base * sellMod() * PAWN_RATIO));
            var r = pay({ stones: loan, take: [{ itemId: itemId, count: count }] });
            if (!r || r.success === false) {
                return { error: r && r.reason === 'missing_item' ? '行囊里没有这件货' : '交割未成' };
            }
            b.item = itemId; b.count = count; b.loan = loan; b.due = day() + TERM_DAYS;
            log('掌柜验了货，按本城行情折成当金 ' + loan + ' 灵石点给你："' + itemName(itemId) +
                ' 上柜，当期一月——' + b.due + ' 日前拿当票来赎，过期即为死当。"', 'success');
            return { success: true, messages: ['当金 ' + loan + ' 灵石，' + b.due + ' 日前可赎（赎回需 ' + Math.round(loan * REDEEM_MARKUP) + '）'] };
        },

        // 赎回：加息一成五，货回行囊；背包放不下就赎不走（货还在柜上，账不变）
        redeem: function () {
            var b = ledger();
            if (!b) return { error: '当铺不与无名氏交易' };
            if (!active(b)) return { error: '你柜上没有当票' };
            if (day() > b.due) { PawnService.forfeitCheck(); return { error: '当票过期，物件已作死当拍给货郎，赎不回了' }; }
            var fee = Math.round(b.loan * REDEEM_MARKUP);
            var r = pay({ stones: -fee, items: [{ itemId: b.item, count: b.count }] });
            if (!r || r.success === false) {
                return { error: r && r.reason === 'spiritStones' ? '当金加息共 ' + fee + ' 灵石，手头不足' : '赎回未成（背包放不下，货仍在你柜上）' };
            }
            var nm = itemName(b.item), oldLoan = b.loan;
            b.item = ''; b.count = 0; b.loan = 0; b.due = 0;
            log('你点清 ' + fee + ' 灵石（当金 ' + oldLoan + ' 加息一成五），掌柜从内柜请出' + nm + '，当票就烛焚了。', 'success');
            return { success: true, messages: ['赎回 ' + nm + '，付 ' + fee + ' 灵石'] };
        },

        // 过期死当：票销、货归铺（货在成交那日就上了柜，此处只销账）
        forfeitCheck: function () {
            var b = ledger();
            if (!active(b) || day() <= b.due) return null;
            var nm = itemName(b.item);
            b.item = ''; b.count = 0; b.loan = 0; b.due = 0;
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
