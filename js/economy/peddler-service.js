// ==================== 第六十九波 · 跑单帮贩货（自己掏钱进货，自己认价出手） ====================
// 此前「贩货」只有两条腿是别人的：押镖是替镖局送货拿死酬金（四十一/四十三波），
// 商队行情牌只报信不做买卖（四十波）。行情真源（MarketDynamic 六区×六类供需倍率）接了店铺买卖，
// 可店铺回购只出两三成价——跨地界倒卖在账面上永远亏，跑单帮这门营生等于不存在。
// 本账把柜台开起来：契约所里商行立贩货契，本城行价进货、异地行价出手，价差就是脚力的钱。
// 纪律：①价格全认行情真源（priceMul），柜台抽八明折（SELL_CUT）——同城来回倒必亏，防对倒刷钱；
//       ②零骰：当日贩货单按城+日播种（同一天谁来柜前都是同一张单，掌柜不换单说谎）；
//       ③进货/出手都走统一结算原子入账（钱不够整笔不成交，货、钱、旗三样分毫不动）；
//       ④货账是 cd._peddler 单字段（押镖 cd._escort 同款先例），读档归一化——坏账一律当无货；
//       ⑤买卖真动供需（adjustFromTrade）：扫一城的货，那城那行的价就该抬。
(function () {
    'use strict';

    var CFG = {
        MAX_LOTS: 3,          // 肩挑贩货，最多三担——跑单帮靠脚力吃饭
        SELL_CUT: 0.92,       // 商行回购按行价打九二折（柜台的抽头摆在明处）
        DEAL_MIN: 20,         // 每笔交割在柜台前花二十分钟（时间在剧本层扣）
        CHEAP_MUL: 0.92,      // 行情话术门槛：低于此为「价贱」
        DEAR_MUL: 1.08        // 高于此为「价高」
    };
    var PROFIT_SKILL = '商道';   // 赚了的买卖长一分商道（驭兽同例：名录外的行当也能长熟）

    // 六样货一行当：名目对得上行情六类（药材/矿材/食物/符箓/丹药/法器），基价是天下平价
    var CARGOES = [
        { id: 'cd_herb',  name: '青露草',   cat: '药材', base: 40 },
        { id: 'cd_ore',   name: '玄铁锭',   cat: '矿材', base: 55 },
        { id: 'cd_grain', name: '灵米',     cat: '食物', base: 30 },
        { id: 'cd_paper', name: '黄纸丹砂', cat: '符箓', base: 45 },
        { id: 'cd_pill',  name: '养气丹料', cat: '丹药', base: 70 },
        { id: 'cd_blade', name: '素剑胚',   cat: '法器', base: 90 }
    ];

    // ============ 小工具 ============
    function charData() { return window.currentCharData || null; }
    function md() { return window.MarketDynamic || null; }
    function city() {
        if (typeof window.getCurrentCityName === 'function') {
            var c = window.getCurrentCityName();
            if (c) return c;
        }
        if (window.locationSystem && typeof window.locationSystem.getCurrentLocation === 'function') {
            var l = window.locationSystem.getCurrentLocation();
            if (l) return l;
        }
        return (charData() && charData().location) || '';
    }
    function absDay() {
        try {
            if (window.WorldCalendar && typeof window.WorldCalendar.day === 'number' && window.WorldCalendar.day > 0) return Math.floor(window.WorldCalendar.day);
            if (typeof window.getAbsoluteDay === 'function') { var g = window.getAbsoluteDay(); if (g) return Math.floor(g); }
            if (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') { var t = window.timeSystem.getAbsoluteDay(); if (t) return Math.floor(t); }
        } catch (e) {}
        return 0;
    }
    // 城折行情大区（v23.2 接线同款口径）；折不进就 null——按平价行市走
    function regionOf(ct) {
        try { if (md() && typeof md().regionFor === 'function') return md().regionFor(ct || city()) || null; } catch (e) {}
        return null;
    }
    function mulFor(cat, ct) {
        try {
            if (md() && typeof md().priceMul === 'function') {
                var m = Number(md().priceMul(regionOf(ct) || ct || city(), cat));
                if (isFinite(m) && m > 0) return m;
            }
        } catch (e) {}
        return 1;
    }
    function seedHash(s) {
        var h = 0;
        for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) % 9973; }
        return h;
    }
    function cargoById(id) {
        for (var i = 0; i < CARGOES.length; i++) { if (CARGOES[i].id === id) return CARGOES[i]; }
        return null;
    }
    // 第七十四波·市井有脸：商行柜上的管事（花名册按城定死；缺册退回「掌柜」老话）
    function clerkAddr(ct) {
        try {
            if (window.CityFaces && typeof window.CityFaces.face === 'function') {
                var f = window.CityFaces.face(ct || city(), 'merchant_clerk');
                if (f) return f.addr;
            }
        } catch (e) {}
        return '';
    }
    function buyPriceOf(cargo, ct) {
        return Math.max(1, Math.round(cargo.base * mulFor(cargo.cat, ct)));
    }
    function sellPriceOf(cargo, ct) {
        return Math.max(1, Math.round(cargo.base * mulFor(cargo.cat, ct) * CFG.SELL_CUT));
    }
    function mulNote(m) {
        if (m < CFG.CHEAP_MUL) return '本地价贱';
        if (m > CFG.DEAR_MUL) return '本地价高';
        return '行情平平';
    }
    // 哪一区这行当最贵（给贩货单指路——行情牌只报信，柜上的单得能照着走）
    function bestRegionFor(cat) {
        var M = md();
        if (!M || !M.CITIES || typeof M.priceMul !== 'function') return null;
        var best = null;
        for (var i = 0; i < M.CITIES.length; i++) {
            var r = M.CITIES[i];
            var m = Number(M.priceMul(r, cat));
            if (!isFinite(m)) continue;
            if (!best || m > best.mul) best = { region: r, mul: m };
        }
        return best;
    }

    // ============ 当日贩货单（城+日播种定死，零骰） ============
    function todayLots(ct) {
        var c0 = ct || city();
        var h = seedHash(c0 + '_peddler_' + absDay());
        var pool = [0, 1, 2, 3, 4, 5];
        var picks = [];
        var x = h;
        for (var i = 0; i < 3 && pool.length; i++) {
            x = (x * 31 + 17) % 9973;
            picks.push(pool.splice(x % pool.length, 1)[0]);
        }
        return picks.map(function (pi) {
            var cargo = CARGOES[pi];
            var m = mulFor(cargo.cat, c0);
            return {
                cargoId: cargo.id, name: cargo.name, cat: cargo.cat, base: cargo.base,
                mul: m, note: mulNote(m), price: buyPriceOf(cargo, c0),
                best: bestRegionFor(cargo.cat)
            };
        });
    }

    // ============ 货账（cd._peddler 单字段，归一化只认字段不补写——押镖同款） ============
    function validLot(l) {
        return !!(l && typeof l === 'object' && typeof l.cargoId === 'string' &&
            isFinite(Number(l.base)) && Number(l.base) > 0 &&
            isFinite(Number(l.buyPrice)) && Number(l.buyPrice) >= 0);
    }
    function ledger() {
        var c = charData();
        if (!c) return [];
        var v = c._peddler;
        if (!v || typeof v !== 'object' || !Array.isArray(v.lots)) return [];
        return v.lots.filter(validLot);
    }
    function holdings(ct) {
        return ledger().map(function (l, i) {
            var cargo = cargoById(l.cargoId) || { id: l.cargoId, name: String(l.cargoId), cat: l.cat || '杂货', base: Number(l.base) };
            var sp = sellPriceOf(cargo, ct);
            return {
                idx: i, name: cargo.name, cat: cargo.cat,
                buyCity: l.buyCity || '', buyDay: Number(l.buyDay) || 0, buyPrice: Number(l.buyPrice),
                sellPrice: sp, profit: sp - Number(l.buyPrice)
            };
        });
    }

    // ============ 结算（统一通道原子入账，缺通道直写兜底） ============
    function settle(spec) {
        try {
            if (window.RewardService && typeof window.RewardService.apply === 'function') {
                var r = window.RewardService.apply(spec, { source: '跑单帮', city: city() });
                if (r && r.success !== false) return { success: true, messages: r.messages || [] };
                return { success: false };
            }
        } catch (e) {}
        var c = charData();
        if (!c) return { success: false };
        var purse = (window.inventory && window.inventory.currency) ? window.inventory.currency : null;
        if (!purse) return { success: false };
        var d = Number(spec.spiritStones || 0);
        if (d < 0 && Number(purse.spiritStones || 0) + d < 0) return { success: false };
        purse.spiritStones = Number(purse.spiritStones || 0) + d;
        if (spec.lifeSkill) {
            c.lifeSkills = c.lifeSkills || {};
            var n = spec.lifeSkill.name;
            c.lifeSkills[n] = Math.max(0, Math.min(100, Number(c.lifeSkills[n] || 0) + spec.lifeSkill.exp));
        }
        return { success: true, messages: [] };
    }
    // 买卖真动供需：扫一城的货抬一城的价（折不进大区的城没有指数，如实不动）
    function noteTrade(ct, cat, qty, isBuy) {
        try {
            var r = regionOf(ct);
            if (r && md() && typeof md().adjustFromTrade === 'function') md().adjustFromTrade(r, cat, qty, isBuy);
        } catch (e) {}
    }

    // ============ 进货 ============
    function buy(idx) {
        var c = charData();
        if (!c) return { success: false, error: '角色状态未就绪，柜台不敢接单。' };
        var lots = ledger();
        if (lots.length >= CFG.MAX_LOTS) return { success: false, error: '肩上三担齐了——跑单帮靠脚力吃饭，再进货得先出手一担。' };
        var ct = city();
        if (!ct) return { success: false, error: '人不在城里，商行柜台不接单。' };
        var today = todayLots(ct);
        var lot = today[Number(idx)];
        if (!lot) return { success: false, error: '今日贩货单上没这一担——单子是柜上定死的，不能凭空添。' };
        var price = lot.price;
        var r = settle({ spiritStones: -price });
        if (!r.success) return { success: false, error: '一担「' + lot.name + '」要 ' + price + ' 灵石——你摸遍荷包没凑出来，商行概不赊账。' };
        c._peddler = { lots: lots.concat([{
            cargoId: lot.cargoId, cat: lot.cat, base: lot.base,
            buyCity: ct, buyRegion: regionOf(ct) || '', buyDay: absDay(), buyPrice: price
        }]) };
        noteTrade(ct, lot.cat, 1, true);
        var msgs = ['🧾 贩下一担「' + lot.name + '」（' + lot.cat + '）：本城行价 ' + price + ' 灵石，钱货两讫。' +
            (lot.best ? (clerkAddr(ct) || '掌柜') + '压低嗓子：「这货在' + lot.best.region + '行市正俏。」' : '')];
        return { success: true, messages: msgs, price: price };
    }

    // ============ 出手 ============
    function sell(idx) {
        var c = charData();
        if (!c) return { success: false, error: '角色状态未就绪，柜台不敢接单。' };
        var lots = ledger();
        if (!lots.length) return { success: false, error: '担子上没货——空着肩膀来柜前，商行没得收。' };
        var lot = lots[Number(idx)];
        if (!lot) return { success: false, error: '担子上没这一件货。' };
        var ct = city();
        if (!ct) return { success: false, error: '人不在城里，货出手要有柜台。' };
        var cargo = cargoById(lot.cargoId) || { id: lot.cargoId, name: String(lot.cargoId), cat: lot.cat || '杂货', base: Number(lot.base) };
        var price = sellPriceOf(cargo, ct);
        var profit = price - Number(lot.buyPrice);
        var spec = { spiritStones: price };
        if (profit > 0) spec.lifeSkill = { name: PROFIT_SKILL, exp: 1 };
        var r = settle(spec);
        if (!r.success) return { success: false, error: '柜台交割未成——这单没做成，货还在你肩上。' };
        var rest = lots.filter(function (l) { return l !== lot; });
        c._peddler = rest.length ? { lots: rest } : null;
        noteTrade(ct, cargo.cat, 1, false);
        var tail = profit > 0 ? '（进货 ' + lot.buyPrice + '，净赚 ' + profit + '——商道长了一分）'
            : profit < 0 ? '（进货 ' + lot.buyPrice + '，折本 ' + (-profit) + '——下回看清行情再肩货）'
            : '（与进货价打平，白跑一趟腿）';
        var msgs = ['💰 一担「' + cargo.name + '」在' + ct + '出手：行价 ' + price + ' 灵石' + tail + (clerkAddr(ct) ? '——' + clerkAddr(ct) + '亲手兑的钱。' : '')];
        return { success: true, messages: msgs, price: price, profit: profit };
    }

    window.PeddlerService = {
        CFG: CFG,
        CARGOES: CARGOES,
        PROFIT_SKILL: PROFIT_SKILL,
        city: city,
        regionOf: regionOf,
        mulFor: mulFor,
        buyPriceOf: buyPriceOf,
        sellPriceOf: sellPriceOf,
        bestRegionFor: bestRegionFor,
        todayLots: todayLots,
        ledger: ledger,
        holdings: holdings,
        buy: buy,
        sell: sell
    };
})();
