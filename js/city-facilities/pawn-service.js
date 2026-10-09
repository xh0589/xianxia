// js/city-facilities/pawn-service.js — 当铺账房：典当有当期、凭票可赎回、过期流当入死当池
// v20.20：把票面上写过的"当期一月，月内不赎即为死当"做实。银钱与货件一律走统一结算事务
// （RewardService→EconomyTransaction），本模块只管当票账本（_pawn 字段，随存档白名单成对往返）。
// v27.13（过堂④⑤·当铺典当三件套，计划书条13——赊账/抵押/流当，破产有窘迫感）：
//   抵押——pawnItem/pawnInstance：货上柜换当金（活当，行价七折折给）；装备按件当，原物实例
//         （uid/耐久/强化快照）入库，不是白板复制品——赎回/买回都原物奉还；
//   赊账——当金即柜上垫出的账，期限内加息一成五赎回（redeem）；
//   流当——过期死当不再凭空蒸发：原物入死当池（_pawn.pool）标价待沽（行价八五折、不低于当金），
//         窘迫感走 RewardService 正门（当前城声望-1、心境-3——流当是穷困账不是刑事账，不动恶名），
//         可照标价买回（灵石经 facilitySpend 回流：六成入本城悬赏基金、四成回世界市面池）；
//         压柜六十日无人问津才"拍给货郎"离柜，旧台词从此有账可查。
//   当铺总账（在当票/期限/死当池）单一真源仍在 charData._pawn，另入 StateRegistry 'pawnService'
//   正门参与聚合导出/读档/重置；旧档缺键由 ledger() 归一化兜底。
(function (global) {
    'use strict';

    var TERM_DAYS = 30;         // 当期一月
    var PAWN_RATIO = 0.7;       // 当金=行价的七折（死当卖断才给足行价，当票便宜是行规）
    var REDEEM_MARKUP = 1.15;   // 赎回加息一成五（银钱占用费的行价，过期为死当不给赎）
    // v27.13：流当三件套的柜规——
    var FORFEIT_ASK_RATIO = 0.85; // 死当柜台标价=行价八五折（柜上七折吃进八五折吐出，赚的是行价差）
    var POOL_CAP = 12;            // 死当池上限——地窖就那么大，压满了先拍最老的给货郎腾地方
    var POOL_CLEAR_DAYS = 60;     // 死当压柜六十日无人问津，货郎打包收走（离柜清账）
    var FORFEIT_REP = -1;         // 流当的社会代价——赎不起的事瞒不过市井（RewardService 正门落账）
    var FORFEIT_MOOD = -3;        // 流当的心境代价——穷困潦倒，是最藏不住的行头

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
        return global.RewardService.apply(spec, { facilitySpend: true, source: 'pawn' });
    }
    // v27.13：流当记录事发之城——货压在哪家柜上，只作柜台话术的地名（当票本就不分城，沿既有口径）
    function currentCity() {
        try { return (typeof global.getCurrentCityName === 'function') ? (global.getCurrentCityName() || '') : ''; }
        catch (e) { return ''; }
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
        // v27.13：死当池归一化——旧档没有 pool 键按空池处理（缺键兜底），残缺条目清出去不留鬼账
        if (!Array.isArray(b.pool)) b.pool = [];
        b.pool = b.pool.filter(function (e) {
            if (!e || typeof e !== 'object') return false;
            if (typeof e.itemId !== 'string' || !e.itemId) return false;
            if (!(num(e.count) > 0) || !(num(e.ask) > 0)) return false;
            if (e.snap != null && typeof e.snap !== 'object') e.snap = null;
            if (e.snap && !e.snap.templateId) e.snap = null;
            return true;
        });
        return b;
    }
    function itemName(itemId) {
        var tpl = global.itemById && global.itemById[itemId];
        return (tpl && tpl.name) || itemId;
    }
    function active(b) { return !!b && !!b.item && b.count > 0; }
    function log(m, t) { (global.gameLog || { add: function () {} }).add(m, t || 'info'); }
    // v27.13：死当标价——行价八五折随流当日的本城行情现定（标价写死在签上，此后行情涨跌不改签），
    // 但永不低于柜上垫出去的当金折到每件——柜上不做亏本买卖
    function unitAsk(itemId, count, loan) {
        var tpl = global.itemById && global.itemById[itemId];
        var base = tpl ? Math.floor(num(tpl.price)) : 0;
        var per = Math.max(1, Math.round(base * sellMod() * FORFEIT_ASK_RATIO));
        var perLoan = Math.max(1, Math.ceil(num(loan) / Math.max(1, num(count))));
        return Math.max(per, perLoan) * Math.max(1, num(count));
    }
    // v27.13：清池——压柜六十日没人问的死当"拍给货郎"；地窖压满先清最老的。
    // 返回清掉几件（每日 tick 静默清，开柜时才把这句念出声）。离柜即离账，不牵玩家钱包。
    function prunePool(b) {
        if (!b || !Array.isArray(b.pool)) return 0;
        var today = day(), kept = [], cleared = 0;
        for (var i = 0; i < b.pool.length; i++) {
            var e = b.pool[i];
            if (today - num(e.day) > POOL_CLEAR_DAYS) { cleared++; continue; }
            kept.push(e);
        }
        while (kept.length > POOL_CAP) { kept.shift(); cleared++; }
        b.pool = kept;
        return cleared;
    }

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
                sellMod: sellMod(),
                poolCount: Array.isArray(b.pool) ? b.pool.length : 0   // v27.13：死当柜上压着几件
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
            // v27.13：过期即流当（当场结算入死当池）——货不消失，但要照柜上标价重新买，"赎"是赎不回了
            if (day() > b.due) { PawnService.forfeitCheck(); return { error: '当票过期，物件已流当进死当柜台——要拿回去得照柜上标价重新买，赎是赎不回了' }; }
            var fee = Math.round(b.loan * REDEEM_MARKUP);
            // 实例账：柜上有快照的原物奉还（uid/耐久/强化一样不少）；老当票没快照的照旧按模板补货
            var giveItem = b.snap
                ? { itemId: b.item, count: b.count, snap: b.snap }
                : { itemId: b.item, count: b.count };
            var r = pay({ stones: -fee, items: [giveItem] });
            if (!r || r.success === false) {
                return { error: r && r.reason === 'spiritStones' ? '当金加息共 ' + fee + ' 灵石，手头不足' : '赎回未成（这一单没走通，货仍在你柜上）' };
            }
            var nm = itemName(b.item), oldLoan = b.loan;
            b.item = ''; b.count = 0; b.loan = 0; b.due = 0; b.snap = null;
            log('你点清 ' + fee + ' 灵石（当金 ' + oldLoan + ' 加息一成五），掌柜从内柜请出' + nm + '——原物奉还，当票就烛焚了。', 'success');
            return { success: true, messages: ['赎回 ' + nm + '，付 ' + fee + ' 灵石'] };
        },

        // 过期流当（v27.13 三件套收口，旧"死当"三处窟窿一次补齐）：
        // 旧病：票销账清、货凭空蒸发，"早拍给货郎了"无处查证，窘迫无声无息——数字消失了，人没丢脸。
        // 现：① 原物（连同实例快照）入死当池标价待沽，货的去处有账可查；② 窘迫感走 RewardService
        // 正门（当前城声望-1、心境-3——流当是穷困账不是刑事账，不混恶名的案底语义）；③ 压柜六十日
        // 才真"拍给货郎"（prunePool），旧台词从此有账可查。顺手做当日清池维护。
        forfeitCheck: function () {
            var b = ledger();
            if (!b || !active(b) || day() <= b.due) {
                if (b) { try { prunePool(b); } catch (eP) { console.warn('[静默失败] js/city-facilities/pawn-service.js · forfeitCheck：死当池清账', eP && eP.message); } }
                return null;
            }
            var nm = itemName(b.item);
            var entry = {
                itemId: b.item, count: b.count, snap: b.snap, loan: b.loan,
                ask: unitAsk(b.item, b.count, b.loan),
                day: day(), city: currentCity()
            };
            b.pool.push(entry);
            try { prunePool(b); } catch (eP2) { console.warn('[静默失败] js/city-facilities/pawn-service.js · forfeitCheck：死当池清账', eP2 && eP2.message); }
            var oldLoan = b.loan;
            b.item = ''; b.count = 0; b.loan = 0; b.due = 0; b.snap = null;
            // 破产窘迫感的落账点：rep=城市声望正门、mood=心境正门，都经 RewardService 统一结算，
            // 不直改角色字段；结算不成（服务缺席）流当照旧成立——货归柜上，脸照丢，只是账面无声。
            try { pay({ rep: FORFEIT_REP, mood: FORFEIT_MOOD }); }
            catch (eR) { console.warn('[静默失败] js/city-facilities/pawn-service.js · forfeitCheck：流当代价结算', eR && eR.message); }
            var cityTxt = entry.city ? entry.city + '的' : '';
            log('想起' + cityTxt + '当柜上那件' + nm + '时已过了赎期——掌柜的把货撂进死当堆，捻着票根直摇头："当金 ' +
                oldLoan + ' 都点给你了，如今连加息也凑不出……穷困潦倒这四个字，是写在脸上的。"（市井都看在眼里：声望' +
                FORFEIT_REP + '，心境' + FORFEIT_MOOD + '；死当柜上标价 ' + entry.ask + '，六十日内照价可买回）', 'warning');
            return { forfeited: true, item: nm, ask: entry.ask };
        },

        // 柜台话术（情境弹窗共用，账目如实播报）
        describe: function () {
            var s = PawnService.summary();
            var t = '当铺掌柜拨着算盘："本店票面写得清楚：当期一月，月内不赎即为流当。当金按本城行情折给，赎回归本加息一成五。"';
            if (!s) return t;
            if (s.active) {
                t += s.forfeited
                    ? '\n\n你的当票已经过期——物件已撂进死当堆，掌柜顺着你的目光看了看内柜，慢慢拨了一颗算盘珠。'
                    : '\n\n你的当票：' + itemName(s.item) + ' ×' + s.count + '，当金 ' + s.loan + ' 灵石，' + s.daysLeft +
                      ' 日内凭票赎回需 ' + s.redeemFee + ' 灵石。过期流当，物件进死当柜台照标价另售。';
            }
            // v27.13：死当柜台话术——流当的货压在柜上标价待沽，掌柜把你自己当掉的货卖回给你，窘迫写在明处
            var pool = PawnService.poolList();
            if (pool.length) {
                t += '\n\n死当柜上压着' + pool.length + '件旧当：' + pool.map(function (e) {
                    return e.name + (e.count > 1 ? '×' + e.count : '') + '（标价 ' + e.ask + '）';
                }).join('、') + '——都是过了赎期的货，行价八五折，照标价买走，原物奉还。';
            }
            return t;
        },

        // ============ v27.13·流当三件套：死当柜台 ============
        // 池上读数（只读拷贝，供话术/弹窗渲染；顺手做清池维护但不念台词——台词留给开柜那一刻）
        poolList: function () {
            var b = ledger();
            if (!b) return [];
            try { prunePool(b); } catch (eP) { console.warn('[静默失败] js/city-facilities/pawn-service.js · poolList：死当池清账', eP && eP.message); }
            var out = [];
            for (var i = 0; i < b.pool.length; i++) {
                var e = b.pool[i];
                out.push({
                    idx: i, itemId: e.itemId, name: itemName(e.itemId), count: num(e.count),
                    ask: num(e.ask), loan: num(e.loan), day: num(e.day), city: e.city || '',
                    snap: e.snap || null,
                    dur: (e.snap && e.snap.durability != null) ? num(e.snap.durability) : null
                });
            }
            return out;
        },

        // 死当买回：流当的货归当铺处置，照签上标价（行价八五折、不低于当金）卖断——
        // 买货的灵石经 pay()（facilitySpend 标记）走 v27.13 回流正门：六成入本城悬赏基金、四成回世界市面池，
        // 死当变卖的钱不再凭空蒸发。带快照的原物原样奉还（uid/耐久/强化随件），无快照的老当照模板补。
        buyFromPool: function (idx) {
            var b = ledger();
            if (!b) return { error: '当铺不与无名氏交易' };
            try { prunePool(b); } catch (eP) { console.warn('[静默失败] js/city-facilities/pawn-service.js · buyFromPool：死当池清账', eP && eP.message); }
            var i = Math.floor(num(idx));
            var e = (i >= 0 && i < b.pool.length) ? b.pool[i] : null;
            if (!e) return { error: '死当柜上没有这件货（怕是早让货郎收走了）' };
            var r = pay({ stones: -num(e.ask), items: [e.snap ? { itemId: e.itemId, count: e.count, snap: e.snap } : { itemId: e.itemId, count: e.count }] });
            if (!r || r.success === false) {
                return { error: r && r.reason === 'spiritStones' ? '标价 ' + e.ask + ' 灵石，手头不足' : '交割未成（这一单没走通，货仍在死当柜上）' };
            }
            b.pool.splice(i, 1);
            var nm = itemName(e.itemId);
            log('掌柜从死当堆里翻出那件' + nm + '，拿袖子掸了掸灰："过了赎期的货，照标价 ' + e.ask + ' 灵石——买回去吧，别再让它上第二次柜。"', 'success');
            return { success: true, messages: ['死当买回 ' + nm + '，付 ' + e.ask + ' 灵石'] };
        },

        // 死当柜台上的「买回」按钮：交割走 buyFromPool，收窗与界面刷新照 pawnFromPicker 同一套收尾
        buyFromPicker: function (idx) {
            var r = PawnService.buyFromPool(idx);
            try {
                var m = document.getElementById('pawn-picker-modal');
                if (m) m.remove();
            } catch (eR) {}
            if (r && r.error) { log('掌柜摇头："' + r.error + '"', 'warning'); return; }
            if (global.updateInventoryUI) { try { global.updateInventoryUI(); } catch (e2) {} }
            if (global.updateCurrencyUI) { try { global.updateCurrencyUI(); } catch (e3) {} }
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
            // v27.13：进柜台先结一遍过期账（当日 tick 与进店之间有空隙，过期票当场流当、死当柜上见），
            // 顺手清池——货郎收走的旧货在这里才念出声，午夜 tick 清池是无声的
            try { PawnService.forfeitCheck(); } catch (eF) { console.warn('[静默失败] js/city-facilities/pawn-service.js · openPicker：过期账预结', eF && eF.message); }
            var b = ledger();
            var cleared = 0;
            if (b) { try { cleared = prunePool(b); } catch (eP) { console.warn('[静默失败] js/city-facilities/pawn-service.js · openPicker：死当池清账', eP && eP.message); } }
            if (cleared > 0) log('货郎把死当堆里几件没人问的旧货打包收走了——柜上地窖腾出了地方。', 'info');
            // 一票一物照旧：有未结当票就不放「当新货」的清单，但死当柜台照常可逛可买——
            // 买回旧当不是上柜新当，不受一票一物辖制
            var blocked = !!(b && active(b));
            if (blocked) log('掌柜指指柜里的当票："一票一物——先赎了这张，或等它流当，柜上才收新货。死当柜上倒有几件，你随意看。"', 'warning');
            var list = blocked ? [] : PawnService.pawnableList();
            var modal = document.createElement('div');
            modal.id = 'pawn-picker-modal';
            modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
            modal.onclick = function (e) { if (e.target === modal) modal.remove(); };
            var rows = list.length ? '' : '<p class="text-sm text-gray-400 py-3">' + (blocked ? '柜上已有你一张当票——先赎了这张，或等它流当。' : '行囊里没有柜上收的货（无价的奇物不收）。') + '</p>';
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
            // v27.13：死当柜台一节——流当的货标价待沽，买回走 buyFromPicker（原物奉还）
            var pool = PawnService.poolList();
            var poolRows = pool.length ? '' : '<p class="text-xs text-gray-500 py-1">死当柜上空着——过了赎期的货都压在这儿，行价八五折，买回是原物。</p>';
            pool.forEach(function (e) {
                var durTxt = (e.dur != null) ? ' · 耐久' + e.dur : '';
                var cityTxt = e.city ? ' · ' + e.city + '柜' : '';
                poolRows += '<div class="flex items-center justify-between p-2 rounded bg-gray-800 mb-2">' +
                    '<span class="text-sm text-gray-200">🏷️ ' + e.name + (e.count > 1 ? ' ×' + e.count : '') + durTxt + '</span>' +
                    '<span class="text-xs text-gray-400 mr-2">当金' + e.loan + ' · 标价' + e.ask + cityTxt + '</span>' +
                    '<button onclick="PawnService.buyFromPicker(' + e.idx + ')" class="px-3 py-1 rounded text-xs bg-emerald-800 hover:bg-emerald-700 text-white">买回</button>' +
                    '</div>';
            });
            modal.innerHTML = '<div class="bg-gray-900 border-2 border-amber-700 rounded-lg p-5 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">' +
                '<h3 class="text-lg font-bold text-amber-400 mb-2">🎒 自选典当</h3>' +
                '<p class="text-xs text-gray-400 mb-3">当金按本城行情七折，当期一月，赎归加息一成五；一票一物。装备按件当——赎回来还是原来那件。</p>' +
                rows +
                '<h3 class="text-lg font-bold text-emerald-400 mt-4 mb-2">🏷️ 死当柜台</h3>' +
                '<p class="text-xs text-gray-400 mb-3">过了赎期流当的货，标价=行价八五折（不低于当金），照价买走、原物奉还；压柜六十日便拍给货郎。</p>' +
                poolRows +
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

    // ============ v27.13：当铺总账入 StateRegistry 正门 ============
    // 单一真源仍是 charData._pawn（在当票/期限/死当池），照旧随存档白名单（game-state 'pawn' 键）
    // 成对往返；这里把同一本账登记进 StateRegistry 参与聚合导出/读档/重置——export/import 读写
    // 的都是同一份 _pawn，不造第二真源。旧档 modules 里没有 pawnService 键时 importAll 自然跳过、
    // 白名单旧通道照常兜底；缺键/残键的归一化统一交给 ledger() 首触兜底。
    function _pawnExport() {
        var p = char();
        return (p && p._pawn && typeof p._pawn === 'object') ? JSON.parse(JSON.stringify(p._pawn)) : null;
    }
    function _pawnImport(s) {
        var p = char();
        if (!p || !s || typeof s !== 'object') return;
        p._pawn = s;   // StateRegistry.importAll 已深拷过（JSON 往返），落回单一真源
        ledger();      // 旧档缺键/残键归一化兜底（pool/快照等）
    }
    function _pawnReset() {
        var p = char();
        if (p) p._pawn = null;   // 开新局按空账本处理——ledger() 首触自会重立
    }
    if (global.StateRegistry && typeof global.StateRegistry.register === 'function') {
        try {
            global.StateRegistry.register('pawnService', { version: 1, export: _pawnExport, import: _pawnImport, reset: _pawnReset });
        } catch (eSR) {
            console.warn('[静默失败] js/city-facilities/pawn-service.js · StateRegistry.register：当铺总账注册', eSR && eSR.message);
        }
    }

    global.PawnService = PawnService;
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () { PawnService.wire(); });
        } else {
            PawnService.wire();
        }
    }
})(typeof window !== 'undefined' ? window : this);
