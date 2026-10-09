/**
 * auction-service.js — 单机拍卖行（真实托管/结算）
 *
 * 规则：
 * - 玩家上架时物品立即进入托管（从背包扣除），并支付少量上架费。
 * - 24 游戏小时后由 NPC 市场按“挂牌价 / 基准价”决定是否成交；成交后扣税结算，流拍则退货。
 * - NPC 拍卖品可由玩家直接竞价买下；扣款和入包在同一原子事务中完成。
 * - 所有期限使用 GameTime，不使用现实 Date.now()/setInterval。
 */
(function (global) {
    'use strict';

    var state = { items: [], npcRefreshDay: -1, counter: 0, notices: [], royalRefreshDay: -1, royalItems: [] };

    var ROYAL_POOL = [
        { id: 'pill_golden_core', price: 1800 },
        { id: 'wpn_frost_moon', price: 900 },
        { id: 'spec_transfer_stone', price: 400 },
        { id: 'art_taiji_sword', price: 1500 },
        { id: 'spec_longevity_pill', price: 2200 }
    ];

    function bal() {
        return (global.XianXia && global.XianXia.Balance && global.XianXia.Balance.auction) || {
            listingDurationMinutes: 1440, listingFeeRate: 0.02, settlementTaxRate: 0.08,
            unsoldStorageFeeRate: 0.05, maxActiveListings: 6, minListingPrice: 1,
            saleChanceByPriceRatio: [
                { maxRatio: 0.75, chance: 0.95 }, { maxRatio: 1.0, chance: 0.85 },
                { maxRatio: 1.25, chance: 0.68 }, { maxRatio: 1.5, chance: 0.45 },
                { maxRatio: 2.0, chance: 0.20 }, { maxRatio: 2.5, chance: 0.13 },
                { maxRatio: 3.0, chance: 0.09 }, { maxRatio: 4.0, chance: 0.055 },
                { maxRatio: 6.0, chance: 0.03 }, { maxRatio: 10.0, chance: 0.018 },
                { maxRatio: Infinity, chance: 0.01 }
            ]
        };
    }

    function nowMinute() {
        return global.GameScheduler ? global.GameScheduler.nowMinute() : ((global.timeSystem && global.timeSystem.gameTime && global.timeSystem.gameTime.totalMinutes) || 0);
    }
    function currentDay() {
        return (global.timeSystem && global.timeSystem.gameTime && global.timeSystem.gameTime.currentDay) || Math.floor(nowMinute() / 1440) + 1;
    }
    function nextId(prefix) { state.counter += 1; return (prefix || 'auc') + '_' + nowMinute() + '_' + state.counter; }
    function templateOf(id) { return global.itemById && global.itemById[id] ? global.itemById[id] : null; }
    function playerName() { return (global.currentCharData && global.currentCharData.name) || '玩家'; }

    // v18.9 世界日历：把"今日开市"注册为 auction 事件（镜像，非真源；不影响原有 trigger 路径）
    // oneShot=false：拍卖每天开市，重复 register 同 id 会被 calendar 拒，所以 id 天然按日变化
    // 第一百零九波：坊市/皇家场本就是「每日开市」的账——但此前只当天补票，0 点的到期结算
    // 早就跑完，日历里永远只有「已过期」的假账，「闭关至下次拍卖」永远天机未显。
    // 现在同时把「明日开市」提前记上：只要开过市，日历上就真有一个未来的开市日可指。
    function tryRegisterAuctionEvent(tier, day) {
        try {
            if (!global.WorldCalendar || typeof global.WorldCalendar.register !== 'function') return;
            var cal = global.WorldCalendar;
            var title = tier === 'royal' ? '皇家拍卖场开市' : '坊市开市';
            [day, day + 1].forEach(function (d) {
                cal.register({
                    id: 'auction.' + tier + '.day' + d,
                    title: title,
                    category: 'auction',
                    dueAbsoluteDay: d,
                    source: { system: 'auction-service', refId: tier },
                    severity: tier === 'royal' ? 'major' : 'info',
                    oneShot: false
                });
            });
        } catch (e) { /* calendar not ready — ignore, auction 行为不变 */ }
    }

    function notify(msg, type) {
        state.notices.unshift({ minute: nowMinute(), message: msg, type: type || 'info' });
        state.notices = state.notices.slice(0, 20);
        if (typeof global.showMessage === 'function') global.showMessage(msg, type || 'info');
        if (global.gameLog && typeof global.gameLog.add === 'function') global.gameLog.add(msg, type || 'info');
    }

    function saleChance(unitPrice, template) {
        var base = Math.max(1, Number(template && (template.price || template.basePrice)) || unitPrice || 1);
        var ratio = Math.max(0, unitPrice / base);
        var rows = bal().saleChanceByPriceRatio || [];
        for (var i = 0; i < rows.length; i++) if (ratio <= rows[i].maxRatio) return rows[i].chance;
        return 0.05;
    }

    function scheduleListing(item) {
        if (!item || item.sellerType !== 'player' || item.status !== 'active' || !global.GameScheduler) return;
        global.GameScheduler.schedule('auction:settle', item.dueMinute, { auctionId: item.id }, { id: 'auction_settle_' + item.id });
    }

    function settlePlayerListing(auctionId) {
        var item = state.items.find(function (x) { return x.id === auctionId; });
        if (!item || item.status !== 'active' || item.sellerType !== 'player') return true;
        var template = templateOf(item.templateId) || {};
        var chance = saleChance(item.unitPrice, template);
        var sold = Math.random() < chance;
        if (sold) {
            var gross = item.unitPrice * item.quantity;
            var tax = Math.max(0, Math.floor(gross * bal().settlementTaxRate));
            var net = Math.max(0, gross - tax);
            if (global.EconomyTransaction) global.EconomyTransaction.credit('spiritStones', net);
            else if (global.inventory && global.inventory.currency) global.inventory.currency.spiritStones = (global.inventory.currency.spiritStones || 0) + net;
            item.status = 'sold';
            item.settledMinute = nowMinute();
            item.gross = gross; item.tax = tax; item.net = net;
            // v27.13 拍卖流水入城市账本（④改良）：锤音那一刻成交额（税前总额）入该城市面流水——
            // 玩家是卖家走 noteAuctionSale 正门（日结商税照抽，大槌成谣）；行情正门照走：
            // 一城拍出一件货，那行当的价就该松（notePlayerTrade→adjustFromTrade→market:priceChange 广播）。
            try {
                if (global.WorldLedger && typeof global.WorldLedger.noteAuctionSale === 'function') global.WorldLedger.noteAuctionSale(gross);
                if (global.MarketDynamic && typeof global.MarketDynamic.notePlayerTrade === 'function') global.MarketDynamic.notePlayerTrade(item.templateId, item.quantity, false);
            } catch (eLed) { console.warn('[静默失败] js/economy/auction-service.js · settlePlayerListing：成交没入城市账', eLed && eLed.message); }
            notify('🔨 拍卖成交：' + item.itemName + ' x' + item.quantity + '，到账 ' + net + ' 灵石（税 ' + tax + '）', 'success');
        } else {
            var returned = global.EconomyTransaction && global.EconomyTransaction.addSnapshot(item.itemSnapshot);
            if (!returned && typeof global.addItem === 'function') returned = global.addItem(item.templateId, item.quantity);
            if (!returned) return false; // 背包满时保留任务，下次继续尝试，绝不吞物品
            item.status = 'unsold';
            item.settledMinute = nowMinute();
            // v20.53 流拍压柜费：货在柜上压了 24 小时占着柜面，寄卖行照收一笔保管钱。
            // 天价挂单从此不只是"卖不掉"，是真的要付代价——高价赌输的成本不再是零。
            var storageFee = Math.max(0, Math.floor(item.unitPrice * item.quantity * (bal().unsoldStorageFeeRate || 0)));
            if (storageFee > 0 && global.EconomyTransaction) {
                var paid = global.EconomyTransaction.debit('spiritStones', storageFee);
                if (!paid) {
                    // 拿不出压柜费：货先退回，账记到下一次（不吞物，也不无限欠账）
                    item.storageOwed = (item.storageOwed || 0) + storageFee;
                    notify('📦 拍卖流拍：' + item.itemName + ' x' + item.quantity + ' 已退回背包；压柜费 ' + storageFee + ' 灵石你暂时拿不出，寄卖行记了账。', 'warning');
                    return true;
                }
                notify('📦 拍卖流拍：' + item.itemName + ' x' + item.quantity + ' 已退回背包，压柜费 ' + storageFee + ' 灵石。', 'warning');
            } else {
                notify('📦 拍卖流拍：' + item.itemName + ' x' + item.quantity + ' 已退回背包', 'warning');
            }
        }
        return true;
    }

    function listBySlotIndex(slotIndex) {
        if (!global.inventory || !global.inventory.slots) return false;
        var slot = global.inventory.slots[slotIndex];
        if (!slot || (slot.count || 0) <= 0) { notify('物品不存在', 'error'); return false; }
        var template = slot.getTemplate ? slot.getTemplate() : templateOf(slot.templateId);
        if (!template || template.implemented === false || template.type === 'quest' || template.category === 'quest') {
            notify('该物品不能拍卖', 'warning'); return false;
        }

        var quantity = 1;
        if ((slot.count || 1) > 1) {
            quantity = parseInt(prompt('输入上架数量（1-' + slot.count + '）:', String(Math.min(slot.count, 1))), 10);
            if (!Number.isFinite(quantity) || quantity < 1 || quantity > slot.count) { notify('无效数量', 'error'); return false; }
        }
        // v20.53 摊位有限：掌柜只留六个柜面，占满了就得等上一批出结果
        var cap = bal().maxActiveListings || 6;
        var activeCount = state.items.filter(function (x) { return x.sellerType === 'player' && x.status === 'active'; }).length;
        if (activeCount >= cap) {
            notify('寄卖行掌柜摊手："柜面就这么大，你那 ' + activeCount + ' 件还没出结果，等出结果再来。"', 'warning');
            return false;
        }
        // 有欠着的压柜费先清账——寄卖行不做赊账生意
        var owed = state.items.reduce(function (acc, x) { return acc + (x.sellerType === 'player' ? (x.storageOwed || 0) : 0); }, 0);
        if (owed > 0 && global.EconomyTransaction) {
            if (!global.EconomyTransaction.debit('spiritStones', owed)) {
                notify('你还欠着寄卖行 ' + owed + ' 灵石压柜费，先清账再上架。', 'warning');
                return false;
            }
            state.items.forEach(function (x) { if (x.sellerType === 'player') x.storageOwed = 0; });
            notify('🧾 你把欠寄卖行的 ' + owed + ' 灵石压柜费结清了。', 'info');
        }
        var suggested = Math.max(1, Number(template.price || template.basePrice) || 100);
        var unitPrice = parseInt(prompt('输入' + (template.name || slot.templateId) + '的单件起拍价（灵石）:', String(suggested)), 10);
        if (!Number.isFinite(unitPrice) || unitPrice < bal().minListingPrice) { notify('无效价格', 'error'); return false; }

        var totalAsk = unitPrice * quantity;
        var fee = Math.max(1, Math.floor(totalAsk * bal().listingFeeRate));
        var tx = global.EconomyTransaction;
        if (!tx) { notify('交易服务未就绪', 'error'); return false; }

        var created = null;
        var result = tx.run(function () {
            if (!tx.debit('spiritStones', fee)) {
                notify('上架费不足：需要 ' + fee + ' 灵石', 'warning');
                return false;
            }
            var snap = tx.removeByUid(slot.uid, quantity);
            if (!snap) return false;
            created = {
                id: nextId('player_auc'), sellerType: 'player', sellerName: playerName(),
                itemName: template.name || slot.templateId, templateId: slot.templateId, quantity: quantity,
                itemSnapshot: snap, unitPrice: unitPrice, listedMinute: nowMinute(),
                dueMinute: nowMinute() + bal().listingDurationMinutes, status: 'active', listingFee: fee
            };
            state.items.push(created);
            return true;
        });
        if (!result) return false;
        scheduleListing(created);
        notify('📤 已托管上架 ' + created.itemName + ' x' + quantity + '，单价 ' + unitPrice + ' 灵石；上架费 ' + fee + ' 灵石', 'success');
        return true;
    }

    function cancelListing(id) {
        var item = state.items.find(function (x) { return x.id === id; });
        if (!item || item.sellerType !== 'player' || item.status !== 'active') return false;
        var ok = global.EconomyTransaction && global.EconomyTransaction.addSnapshot(item.itemSnapshot);
        if (!ok) { notify('背包空间不足，暂时无法撤回', 'warning'); return false; }
        item.status = 'cancelled'; item.settledMinute = nowMinute();
        if (global.GameScheduler) global.GameScheduler.cancel('auction_settle_' + item.id);
        notify('已撤回拍卖：' + item.itemName + '（上架费不退）', 'info');
        return true;
    }

    function generateNpcLots() {
        var day = currentDay();
        if (state.npcRefreshDay === day) return;
        state.items = state.items.filter(function (x) { return x.sellerType !== 'npc' || x.status !== 'active'; });
        state.npcRefreshDay = day;
        var funds = global.inventory && global.inventory.currency ? Number(global.inventory.currency.spiritStones) || 0 : 0;
        var maxBase = Math.max(300, funds * 4 + 100);
        var pool = Object.keys(global.itemById || {}).map(function (id) { return global.itemById[id]; }).filter(function (t) {
            if (!t || t.implemented === false || !t.id || !t.name) return false;
            if (t.type === 'quest' || t.category === 'quest' || t.type === 'currency') return false;
            if (t.qiyuOnly) return false;   // v20.94 奇遇奇物不上拍卖行
            var p = Number(t.price || t.basePrice) || 0;
            return p > 0 && p <= maxBase && ['PIN3', 'PIN2', 'PIN1', 'UNIQUE'].indexOf(t.quality) < 0;   // v20.91 三品及以上与特殊信物不上拍卖行
        });
        for (var i = pool.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1)); var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
        }
        pool.slice(0, 4).forEach(function (t) {
            var base = Math.max(1, Number(t.price || t.basePrice) || 10);
            var unit = Math.max(1, Math.round(base * (0.85 + Math.random() * 0.35)));
            state.items.push({
                id: nextId('npc_auc'), sellerType: 'npc', sellerName: ['云游散修', '万宝阁执事', '匿名修士'][Math.floor(Math.random() * 3)],
                itemName: t.name, templateId: t.id, quantity: 1, itemSnapshot: { templateId: t.id, count: 1 },
                unitPrice: unit, listedMinute: nowMinute(), dueMinute: nowMinute() + 1440, status: 'active'
            });
        });

        // v18.9 世界日历：镜像注册"今日坊市开市"
        tryRegisterAuctionEvent('npc', day);
    }

    function buyNpcLot(id) {
        var item = state.items.find(function (x) { return x.id === id; });
        if (!item || item.sellerType !== 'npc' || item.status !== 'active') { notify('拍卖品不存在或已结束', 'error'); return false; }
        var cost = item.unitPrice * item.quantity;
        var tx = global.EconomyTransaction;
        if (!tx) return false;
        var ok = tx.run(function () {
            if (!tx.debit('spiritStones', cost)) { notify('灵石不足，需要 ' + cost + ' 灵石', 'warning'); return false; }
            if (!tx.addSnapshot(item.itemSnapshot)) { notify('背包已满，交易已回滚', 'warning'); return false; }
            item.status = 'sold'; item.buyerName = playerName(); item.settledMinute = nowMinute();
            return true;
        });
        if (ok) {
            // v27.13 拍卖流水入城市账本（④改良）：买断也是城里一笔真交易——钱从玩家流向市面，
            // 走 noteBuy 既有正门（与坊市买卖同一本流水）；行情正门照走（买断该行当价该抬）。
            try {
                if (global.WorldLedger && typeof global.WorldLedger.noteBuy === 'function') global.WorldLedger.noteBuy(cost);
                if (global.MarketDynamic && typeof global.MarketDynamic.notePlayerTrade === 'function') global.MarketDynamic.notePlayerTrade(item.templateId, item.quantity, true);
            } catch (eLed) { console.warn('[静默失败] js/economy/auction-service.js · buyNpcLot：买断没入城市账', eLed && eLed.message); }
            // v27.13：产出登记——拍卖行买断成交盖「auction」章（与 noteAuctionSale 同款纪律：登记失败绝不拦成交）。
            try {
                if (global.ItemProvenance && typeof global.ItemProvenance.note === 'function') {
                    global.ItemProvenance.note('auction', item.templateId, Math.max(1, Number(item.quantity) || 1));
                }
            } catch (ePrv) { console.warn('[静默失败] js/economy/auction-service.js · buyNpcLot：产出登记未入簿（拍品照常到手）', ePrv && ePrv.message); }
            notify('🔨 竞得 ' + item.itemName + ' x' + item.quantity + '，支付 ' + cost + ' 灵石', 'success');
        }
        return !!ok;
    }

    // ==================== v25.5 竞价拉锯（第一百四十七批 · 玩法立项批） ====================
    // 旧「出价」是一口价买断，拍卖行里没有拍卖。现在来真的：从挂牌价六成起拍，
    // 场子里会冒出对手竞价——每轮加挂牌价的一成，对手跟不跟看它钱袋深浅；
    // 它收手你低价竞得（真捡漏），你收手拍品还在（白耗一刻钟看场），它钱袋更深就当场易主。
    // 一口价（buyNpcLot）保留：不想赌的照旧原价买断。账走同一原子事务，不开第二轨。
    var BID_RIVAL_NAMES = ['锦衣豪商', '蒙面修士', '世家仆从', '邻城掌柜', '独行剑客', '炼器坊主'];
    var BID_MAX_ROUNDS = 8;
    var _bidWar = null; // {itemId, base, step, price, rivalName, rivalBudget, round}

    function _bidFunds() {
        return (global.inventory && global.inventory.currency) ? (Number(global.inventory.currency.spiritStones) || 0) : 0;
    }

    function startBidWar(id) {
        var item = state.items.find(function (x) { return x.id === id; });
        if (!item || item.sellerType !== 'npc' || item.status !== 'active') { notify('拍卖品不存在或已结束', 'error'); return false; }
        var base = item.unitPrice * item.quantity;
        _bidWar = {
            itemId: id, base: base,
            step: Math.max(1, Math.round(base * 0.1)),
            price: Math.max(1, Math.round(base * 0.6)),
            rivalName: BID_RIVAL_NAMES[Math.floor(Math.random() * BID_RIVAL_NAMES.length)],
            rivalBudget: Math.round(base * (0.7 + Math.random() * 0.7)),
            round: 0
        };
        if (global.timeSystem && typeof global.timeSystem.advanceTime === 'function') global.timeSystem.advanceTime(10, '竞价');
        _renderBidWar('拍卖师报出起拍价，场子里一位「' + _bidWar.rivalName + '」抬起了牌子。');
        return true;
    }

    function _closeBidModal() {
        try { var m = global.document && global.document.getElementById('bid-war-modal'); if (m) m.remove(); } catch (e) {}
    }

    function _renderBidWar(line) {
        if (!_bidWar || !global.document) return;
        _closeBidModal();
        var item = state.items.find(function (x) { return x.id === _bidWar.itemId; });
        var name = item ? item.itemName : '拍品';
        var next = _bidWar.price + _bidWar.step;
        var canRaise = _bidFunds() >= next;
        var modal = global.document.createElement('div');
        modal.id = 'bid-war-modal';
        modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4';
        modal.innerHTML = '<div class="bg-gray-800 border-2 border-pink-500 rounded-xl p-5 max-w-md w-full max-h-[85vh]">' +
            '<h3 class="text-lg font-bold text-pink-400 mb-1">🔨 竞价 · ' + name + '</h3>' +
            '<p class="text-xs text-gray-400 mb-2">挂牌价 ' + _bidWar.base + ' 灵石 · 每轮加价 ' + _bidWar.step + ' · 第 ' + _bidWar.round + '/' + BID_MAX_ROUNDS + ' 轮</p>' +
            '<p class="text-sm text-yellow-300 mb-2">当前价：<span class="text-xl font-bold">' + _bidWar.price + '</span> 灵石</p>' +
            '<p class="text-xs text-gray-300 mb-3">' + line + '</p>' +
            '<p class="text-xs text-gray-500 mb-3">你的钱袋：' + _bidFunds() + ' 灵石</p>' +
            '<div class="flex gap-2">' +
            '<button ' + (canRaise ? '' : 'disabled ') + 'onclick="AuctionService.bidWarRaise()" class="flex-1 ' + (canRaise ? 'bg-pink-600 hover:bg-pink-500' : 'bg-gray-600 cursor-not-allowed') + ' text-white px-3 py-2 rounded text-sm font-bold">加价到 ' + next + '</button>' +
            '<button onclick="AuctionService.bidWarFold()" class="flex-1 bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded text-sm">收手</button>' +
            '</div>' +
            (canRaise ? '' : '<p class="text-xs text-red-400 mt-2">钱袋盖不过下一口价了——只能收手。</p>') +
            '</div>';
        global.document.body.appendChild(modal);
    }

    function bidWarRaise() {
        if (!_bidWar) return false;
        var next = _bidWar.price + _bidWar.step;
        if (_bidFunds() < next) { notify('灵石盖不过下一口价，只能收手。', 'warning'); return bidWarFold(); }
        _bidWar.price = next;
        _bidWar.round += 1;
        var overBudget = next > _bidWar.rivalBudget;
        var holdChance = overBudget ? 0.15 : (next > _bidWar.rivalBudget * 0.85 ? 0.55 : 0.8);
        var holds = Math.random() < holdChance;
        if (!holds) return _settleBidWar(true, '');
        if (_bidWar.round >= BID_MAX_ROUNDS) {
            return _settleBidWar(false, '「' + _bidWar.rivalName + '」咬着牙一路跟到第 ' + BID_MAX_ROUNDS + ' 轮，死不松口');
        }
        _renderBidWar('「' + _bidWar.rivalName + '」眯眼扫了你一眼，缓缓把牌子抬到 ' + next + ' 灵石。');
        return true;
    }

    function bidWarFold() {
        if (!_bidWar) return false;
        var rn = _bidWar.rivalName;
        _bidWar = null;
        _closeBidModal();
        notify('你收手了。「' + rn + '」瞥了你一眼，拍品仍挂在架上——下次开市再来。', 'info');
        open();
        return false;
    }

    function _settleBidWar(won, reasonText) {
        var war = _bidWar;
        _bidWar = null;
        _closeBidModal();
        if (!war) return false;
        var item = state.items.find(function (x) { return x.id === war.itemId; });
        if (!item || item.status !== 'active') { notify('拍品已被捷足先登。', 'warning'); open(); return false; }
        if (!won) {
            item.status = 'sold'; item.buyerName = war.rivalName; item.settledMinute = nowMinute();
            notify('🔨 落槌——' + reasonText + '，' + item.itemName + ' 以 ' + war.price + ' 灵石归了「' + war.rivalName + '」。', 'warning');
            open();
            return false;
        }
        var tx = global.EconomyTransaction;
        if (!tx) { notify('交易服务未就绪', 'error'); open(); return false; }
        var price = war.price;
        var ok = tx.run(function () {
            if (!tx.debit('spiritStones', price)) { notify('灵石不足，竞得作废——拍品重新挂回架上。', 'warning'); return false; }
            if (!tx.addSnapshot(item.itemSnapshot)) { notify('背包已满，交易已回滚——拍品重新挂回架上。', 'warning'); return false; }
            item.status = 'sold'; item.buyerName = playerName(); item.settledMinute = nowMinute();
            item.bidRounds = war.round;
            return true;
        });
        if (ok) {
            var diff = war.base - price;
            // v27.13 拍卖流水入城市账本（④改良）：竞价落槌是你付的一笔真钱——走 noteBuy 正门入流水，
            // 行情正门照走（你把货抬走了，价该抬）。对手落槌（won=false）是它与卖家两清，不动玩家流水。
            try {
                if (global.WorldLedger && typeof global.WorldLedger.noteBuy === 'function') global.WorldLedger.noteBuy(price);
                if (global.MarketDynamic && typeof global.MarketDynamic.notePlayerTrade === 'function') global.MarketDynamic.notePlayerTrade(item.templateId, item.quantity, true);
            } catch (eLed) { console.warn('[静默失败] js/economy/auction-service.js · _settleBidWar：落槌价没入城市账', eLed && eLed.message); }
            // v27.13：产出登记——竞价拉锯落槌得手同盖「auction」章（一口价买断 buyNpcLot 与此同口径）。登记失败不拦成交。
            try {
                if (global.ItemProvenance && typeof global.ItemProvenance.note === 'function') {
                    global.ItemProvenance.note('auction', item.templateId, Math.max(1, Number(item.quantity) || 1));
                }
            } catch (ePrv) { console.warn('[静默失败] js/economy/auction-service.js · _settleBidWar：产出登记未入簿（拍品照常到手）', ePrv && ePrv.message); }
            notify('🔨 落槌！「' + war.rivalName + '」摇头收牌——' + item.itemName + ' x' + item.quantity + ' 以 ' + price + ' 灵石归你（' + (diff > 0 ? ('比挂牌价省 ' + diff) : ('比挂牌价多付 ' + (-diff))) + '，' + war.round + ' 轮）', 'success');
            open();
        }
        return !!ok;
    }

    // ==================== v25.6 寄售竞价战（第一百四十八批 · 玩家心愿批） ====================
    // 旧账：玩家寄售的货由后台按「挂牌价/基准价」悄悄掷骰成交——你从没亲眼看过自己的货被人抢。
    // 现在可以自己点火催场：场子里的买主一轮轮抬价，你随时落槌落袋，或者再贪一轮——
    // 贪过头场子凉了就地流拍（退货+压柜费，走既有流拍账，不吞物）。挂得越离谱场子越冷（coolBase
    // 直接吃 saleChance 的口径）；每件货只催得动一次场，熟客认脸。钱照走 EconomyTransaction 正门。
    var SELL_BUYER_NAMES = ['锦衣豪商', '世家子', '丹坊主', '云游散修', '万宝阁执事', '蒙面女修'];
    var SELL_COOL_PER_ROUND = 0.12;   // 每贪一轮，场子凉的底噪加一成二
    var SELL_COOL_CAP = 0.95;
    var _sellWar = null; // {itemId, ask, price, step, round, coolBase, buyerName}

    function startSellWar(id) {
        var item = state.items.find(function (x) { return x.id === id; });
        if (!item || item.sellerType !== 'player' || item.status !== 'active') { notify('这件不是你在寄售的货，或已出结果', 'error'); return false; }
        if (item.stoked) { notify('这件货已经催过一次场——熟客认脸，再催就冷了。等它自己出结果吧。', 'warning'); return false; }
        if (_sellWar) { notify('场子里还有一炉火没落槌，先了结那一场。', 'warning'); return false; }
        var template = templateOf(item.templateId) || {};
        var ask = item.unitPrice * item.quantity;
        // 场子冷热直接吃「价格越离谱越难卖」的既有口径：热门货凉得慢，天价货一催就冷
        var hot = saleChance(item.unitPrice, template);
        var coolBase = Math.max(0.05, Math.min(0.55, 0.7 - hot));
        _sellWar = {
            itemId: id, ask: ask,
            price: Math.max(1, Math.round(ask * (0.7 + Math.random() * 0.3))),
            step: Math.max(1, Math.round(ask * 0.08)),
            round: 0, coolBase: coolBase,
            buyerName: SELL_BUYER_NAMES[Math.floor(Math.random() * SELL_BUYER_NAMES.length)]
        };
        item.stoked = true;
        if (global.timeSystem && typeof global.timeSystem.advanceTime === 'function') global.timeSystem.advanceTime(10, '拍卖催场');
        _renderSellWar('拍卖师把你的货举了起来，场子里有人喊出了第一口价。');
        return true;
    }

    function _closeSellModal() {
        try { var m = global.document && global.document.getElementById('sell-war-modal'); if (m) m.remove(); } catch (e) { console.warn('[静默失败] js/economy/auction-service.js · _closeSellModal：催场的弹窗没关掉，屏上留着旧价签', e && e.message); }
    }

    function _renderSellWar(line) {
        if (!_sellWar || !global.document) return;
        _closeSellModal();
        var item = state.items.find(function (x) { return x.id === _sellWar.itemId; });
        var name = item ? item.itemName : '货';
        var coolPct = Math.round(Math.min(SELL_COOL_CAP, _sellWar.coolBase + (_sellWar.round + 1) * SELL_COOL_PER_ROUND) * 100);
        var next = _sellWar.price + _sellWar.step;
        var modal = global.document.createElement('div');
        modal.id = 'sell-war-modal';
        modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4';
        modal.innerHTML = '<div class="bg-gray-800 border-2 border-amber-500 rounded-xl p-5 max-w-md w-full max-h-[85vh]">' +
            '<h3 class="text-lg font-bold text-amber-400 mb-1">🔥 催场 · ' + name + '</h3>' +
            '<p class="text-xs text-gray-400 mb-2">你的挂牌价 ' + _sellWar.ask + ' 灵石 · 每轮抬价约 ' + _sellWar.step + ' · 已抬 ' + _sellWar.round + ' 轮</p>' +
            '<p class="text-sm text-yellow-300 mb-2">「' + _sellWar.buyerName + '」出价：<span class="text-xl font-bold">' + _sellWar.price + '</span> 灵石</p>' +
            '<p class="text-xs text-gray-300 mb-3">' + line + '</p>' +
            '<div class="space-y-2">' +
            '<button onclick="AuctionService.sellWarStrike()" class="w-full bg-amber-600 hover:bg-amber-500 text-gray-900 px-3 py-2 rounded text-sm font-bold">🔨 就这个价落槌（税后到账 ' + Math.max(0, _sellWar.price - Math.floor(_sellWar.price * (bal().settlementTaxRate || 0.08))) + '）</button>' +
            '<button onclick="AuctionService.sellWarHold()" class="w-full bg-pink-600 hover:bg-pink-500 text-white px-3 py-2 rounded text-sm font-bold">🔥 再贪一轮（抬到 ' + next + ' 上下 · 场子有 ' + coolPct + '% 几率凉掉流拍）</button>' +
            '<button onclick="AuctionService.sellWarWalk()" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded text-xs">离席不催了——货照旧挂着等出结果</button>' +
            '</div></div>';
        global.document.body.appendChild(modal);
    }

    function sellWarHold() {
        if (!_sellWar) return false;
        _sellWar.round += 1;
        _sellWar.price = _sellWar.price + _sellWar.step;
        var cool = Math.min(SELL_COOL_CAP, _sellWar.coolBase + _sellWar.round * SELL_COOL_PER_ROUND);
        if (Math.random() < cool) return _settleSellWarCold('贪到第 ' + _sellWar.round + ' 轮，场子里没人再举牌——拍卖会面面相觑，凉了');
        _sellWar.buyerName = SELL_BUYER_NAMES[Math.floor(Math.random() * SELL_BUYER_NAMES.length)];
        _renderSellWar('「' + _sellWar.buyerName + '」眯眼扫了全场一圈，把价牌抬到了 ' + _sellWar.price + ' 灵石。');
        return true;
    }

    function sellWarStrike() {
        var war = _sellWar;
        if (!war) return false;
        _sellWar = null;
        _closeSellModal();
        var item = state.items.find(function (x) { return x.id === war.itemId; });
        if (!item || item.status !== 'active') { notify('货已出了结果，这一槌落了空。', 'warning'); open(); return false; }
        var gross = war.price;
        var tax = Math.max(0, Math.floor(gross * (bal().settlementTaxRate || 0.08)));
        var net = Math.max(0, gross - tax);
        if (global.EconomyTransaction) global.EconomyTransaction.credit('spiritStones', net);
        else if (global.inventory && global.inventory.currency) global.inventory.currency.spiritStones = (global.inventory.currency.spiritStones || 0) + net;
        item.status = 'sold'; item.buyerName = war.buyerName; item.settledMinute = nowMinute();
        item.gross = gross; item.tax = tax; item.net = net; item.bidRounds = war.round;
        if (global.GameScheduler) global.GameScheduler.cancel('auction_settle_' + item.id);
        // v27.13 拍卖流水入城市账本（④改良）：催场落槌同到期成交一口径——成交额入市面流水
        //（noteAuctionSale 正门，日结商税照抽），行情正门照走（玩家是卖家，价该松）。
        try {
            if (global.WorldLedger && typeof global.WorldLedger.noteAuctionSale === 'function') global.WorldLedger.noteAuctionSale(gross);
            if (global.MarketDynamic && typeof global.MarketDynamic.notePlayerTrade === 'function') global.MarketDynamic.notePlayerTrade(item.templateId, item.quantity, false);
        } catch (eLed) { console.warn('[静默失败] js/economy/auction-service.js · sellWarStrike：落槌没入城市账', eLed && eLed.message); }
        var diff = gross - war.ask;
        notify('🔨 落槌！「' + war.buyerName + '」以 ' + gross + ' 灵石买下 ' + item.itemName + ' x' + item.quantity + '（' + (diff >= 0 ? '比你的挂牌价高 ' + diff : '比挂牌价低 ' + (-diff)) + '，' + war.round + ' 轮催场，税 ' + tax + '，到账 ' + net + '）', 'success');
        open();
        return true;
    }

    function sellWarWalk() {
        var war = _sellWar;
        _sellWar = null;
        _closeSellModal();
        if (war) notify('你离了席。货仍挂在架上，照原规矩等出结果——只是这一场火，催不回来了。', 'info');
        open();
        return false;
    }

    function _settleSellWarCold(reasonText) {
        var war = _sellWar;
        _sellWar = null;
        _closeSellModal();
        if (!war) return false;
        var item = state.items.find(function (x) { return x.id === war.itemId; });
        if (!item || item.status !== 'active') { open(); return false; }
        var returned = global.EconomyTransaction && global.EconomyTransaction.addSnapshot(item.itemSnapshot);
        if (!returned && typeof global.addItem === 'function') returned = global.addItem(item.templateId, item.quantity);
        if (!returned) {
            // 背包满：货先留在柜上（active），到期结算会再试退货——绝不吞物品
            notify('🧊 ' + reasonText + '。货想退给你，却没能落进你的行囊——' + ((typeof global.addItemFailPhrase === 'function' && global.addItemFailPhrase(item.itemName)) || '先给它腾出地方') + '；货先留在柜上，到期结算会再试退货，绝不吞物。', 'warning');
            open();
            return false;
        }
        item.status = 'unsold';
        item.settledMinute = nowMinute();
        if (global.GameScheduler) global.GameScheduler.cancel('auction_settle_' + item.id);
        var storageFee = Math.max(0, Math.floor(item.unitPrice * item.quantity * (bal().unsoldStorageFeeRate || 0)));
        if (storageFee > 0 && global.EconomyTransaction) {
            var paid = global.EconomyTransaction.debit('spiritStones', storageFee);
            if (!paid) {
                item.storageOwed = (item.storageOwed || 0) + storageFee;
                notify('🧊 ' + reasonText + '——流拍退货，压柜费 ' + storageFee + ' 灵石你暂时拿不出，寄卖行记了账。', 'warning');
                open();
                return false;
            }
        }
        notify('🧊 ' + reasonText + '——流拍。' + item.itemName + ' x' + item.quantity + ' 退回行囊' + (storageFee > 0 ? '，压柜费 ' + storageFee + ' 灵石' : '') + '。贪的代价，柜上照收。', 'warning');
        open();
        return false;
    }

    function getRoyalAccess(city) {
        if (typeof global.getRoyalAuctionAccess === 'function') return global.getRoyalAuctionAccess(city);
        var rep = typeof global.getReputationLevelIndex === 'function' ? global.getReputationLevelIndex(city) : 0;
        var permit = !!(global.currentCharData && global.currentCharData.flags && (global.currentCharData.flags.special_permit || global.currentCharData.flags['permit_' + city]));
        return { allowed: rep >= 3 || permit, cityName: city, reputation: typeof global.getReputationValue === 'function' ? global.getReputationValue(city) : 0, requiredReputation: 3000, hasPermit: permit };
    }

    function generateRoyalLots() {
        var day = currentDay();
        if (state.royalRefreshDay === day && Array.isArray(state.royalItems) && state.royalItems.length) return;
        state.royalRefreshDay = day;
        var pool = ROYAL_POOL.slice();
        for (var i = pool.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1)); var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
        }
        state.royalItems = pool.slice(0, 3).map(function(def) {
            var t = templateOf(def.id) || { id: def.id, name: def.id };
            return {
                id: 'royal_' + day + '_' + def.id, templateId: def.id, itemName: t.name || def.id,
                price: Math.max(1, Number(def.price) || Number(t.price || t.basePrice) || 1000), status: 'active'
            };
        });

        // v18.9 世界日历：镜像注册"今日皇家拍卖开市"
        tryRegisterAuctionEvent('royal', day);
    }

    function buyRoyalLot(id, city) {
        var access = getRoyalAccess(city);
        if (!access.allowed) {
            notify('皇家拍卖场门槛未满足：当前城市声望 ' + (access.reputation || 0) + '/' + (access.requiredReputation || 3000) + '，或需持有特殊许可', 'warning');
            return false;
        }
        generateRoyalLots();
        var item = state.royalItems.find(function(x) { return x.id === id; });
        if (!item || item.status !== 'active') { notify('该皇家拍品已成交或不存在', 'warning'); return false; }
        var tx = global.EconomyTransaction;
        if (!tx) { notify('交易服务未就绪', 'error'); return false; }
        var ok = tx.run(function() {
            if (!tx.debit('spiritStones', item.price)) { notify('灵石不足，需要 ' + item.price + ' 灵石', 'warning'); return false; }
            if (!tx.addSnapshot({ templateId: item.templateId, count: 1 })) { notify('背包已满，交易已回滚', 'warning'); return false; }
            item.status = 'sold';
            item.buyerName = playerName();
            item.soldMinute = nowMinute();
            return true;
        });
        if (ok) {
            if (typeof global.addReputationFromTrade === 'function' && city) global.addReputationFromTrade(city, item.price);
            // v27.13 拍卖流水入城市账本（④改良）：皇家场的大槌更是大交易——钱从玩家流向市面，
            // 走 noteBuy 正门入流水；行情正门照走（皇家拍品多为丹药法宝，拍走一件价该抬）。
            try {
                if (global.WorldLedger && typeof global.WorldLedger.noteBuy === 'function') global.WorldLedger.noteBuy(item.price);
                if (global.MarketDynamic && typeof global.MarketDynamic.notePlayerTrade === 'function') global.MarketDynamic.notePlayerTrade(item.templateId, 1, true);
            } catch (eLed) { console.warn('[静默失败] js/economy/auction-service.js · buyRoyalLot：皇家成交没入城市账', eLed && eLed.message); }
            // v27.13：产出登记——皇家拍卖成交盖「auction」章（与买断/竞价拉锯同口径）。登记失败不拦成交。
            try {
                if (global.ItemProvenance && typeof global.ItemProvenance.note === 'function') {
                    global.ItemProvenance.note('auction', item.templateId, 1);
                }
            } catch (ePrv) { console.warn('[静默失败] js/economy/auction-service.js · buyRoyalLot：产出登记未入簿（拍品照常到手）', ePrv && ePrv.message); }
            notify('🏛️ 皇家拍卖成交：' + item.itemName + '，支付 ' + item.price + ' 灵石', 'success');
        }
        return !!ok;
    }

    function openRoyal(city) {
        city = city || (typeof global.getCurrentCityName === 'function' ? global.getCurrentCityName() : '');
        var access = getRoyalAccess(city);
        if (!access.allowed) {
            notify('皇家拍卖场：当前城市声望 ' + (access.reputation || 0) + '/' + (access.requiredReputation || 3000) + '。需达到【有名望】或持有特殊许可；角色“名气”不等同于城市声望。', 'warning');
            return false;
        }
        generateRoyalLots();
        if (global.timeSystem && typeof global.timeSystem.advanceTime === 'function') global.timeSystem.advanceTime(5, '查看皇家拍卖场');
        var rows = state.royalItems.map(function(item) {
            return '<div class="flex justify-between items-center bg-gray-700/40 p-2 rounded mb-2">' +
                '<div><span class="text-yellow-300 font-bold">' + item.itemName + '</span>' +
                '<div class="text-[11px] text-gray-500">皇家专场 · 每日限量</div></div>' +
                (item.status === 'active'
                    ? '<button onclick="AuctionService.buyRoyalLot(\'' + item.id + '\',\'' + String(city || '').replace(/'/g, '') + '\'); this.closest(\'.fixed\').remove(); AuctionService.openRoyal(\'' + String(city || '').replace(/'/g, '') + '\');" class="text-xs bg-yellow-600 hover:bg-yellow-500 text-gray-900 px-2 py-1 rounded">' + item.price + ' 灵石</button>'
                    : '<span class="text-xs text-gray-500">已成交</span>') + '</div>';
        }).join('');
        var modal = document.createElement('div');
        modal.id = 'royal-auction-modal';
        modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
        modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
        modal.innerHTML = '<div class="bg-gray-800 border-2 border-amber-500 rounded-xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">' +
            '<div class="flex justify-between items-center mb-3"><h3 class="text-xl font-bold text-amber-400">🏛️ 皇家拍卖场</h3><button onclick="this.closest(\'.fixed\').remove()" class="text-gray-400 hover:text-white text-2xl">&times;</button></div>' +
            '<p class="text-xs text-gray-400 mb-3">准入：本城声望≥' + (access.requiredReputation || 3000) + '，或持有特殊许可。皇家拍品每日刷新且每件只能成交一次。</p>' +
            rows + '</div>';
        document.body.appendChild(modal);
        return true;
    }

    function cleanupHistory() {
        var cutoff = nowMinute() - 7 * 1440;
        state.items = state.items.filter(function (x) { return x.status === 'active' || (x.settledMinute || x.listedMinute || 0) >= cutoff; });
    }

    function open() {
        if (!global.currentCharData) { notify('请先创建角色', 'warning'); return; }
        generateNpcLots();
        // 老存档没有 Scheduler 时也能靠打开面板触发到期结算。
        state.items.slice().forEach(function (x) { if (x.sellerType === 'player' && x.status === 'active' && x.dueMinute <= nowMinute()) settlePlayerListing(x.id); });
        cleanupHistory();
        if (global.timeSystem && typeof global.timeSystem.advanceTime === 'function') global.timeSystem.advanceTime(5, '查看拍卖行');

        var active = state.items.filter(function (x) { return x.status === 'active'; });
        var html = '<h4 class="font-bold text-pink-400 mb-3">当前拍卖品</h4>';
        if (!active.length) html += '<p class="text-gray-400 text-sm mb-4">暂无拍卖品</p>';
        else {
            html += '<div class="space-y-2 mb-4">';
            active.forEach(function (item) {
                var left = Math.max(0, item.dueMinute - nowMinute());
                var leftH = Math.ceil(left / 60);
                var mine = item.sellerType === 'player';
                html += '<div class="bg-gray-700/30 p-2 rounded flex justify-between items-center"><div>' +
                    '<span class="text-sm font-bold">' + item.itemName + ' x' + item.quantity + '</span>' +
                    '<span class="text-xs text-gray-400 ml-2">卖家: ' + item.sellerName + '</span>' +
                    '<div class="text-[11px] text-gray-500">约 ' + leftH + ' 游戏小时后结束</div></div>' +
                    '<div class="flex items-center gap-2"><span class="text-sm text-yellow-400">' + item.unitPrice + '灵石/件</span>' +
                    (mine ? ((item.stoked ? '' : '<button onclick="this.closest(\'.fixed\').remove(); AuctionService.startSellWar(\'' + item.id + '\');" class="bg-amber-600 hover:bg-amber-500 text-gray-900 px-2 py-1 rounded text-xs" title="自己点火催场——买主抢着抬价，随时落槌落袋；贪过头场子凉了就流拍。每件货只催得动一次">🔥 催场</button>') +
                            '<button onclick="AuctionService.cancelListing(\'' + item.id + '\'); this.closest(\'.fixed\').remove(); AuctionService.open();" class="bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded text-xs">撤回</button>')
                          : '<button onclick="this.closest(\'.fixed\').remove(); AuctionService.startBidWar(\'' + item.id + '\');" class="bg-pink-600 hover:bg-pink-500 text-white px-2 py-1 rounded text-xs" title="从挂牌价六成起拍，与场内对手一轮轮抬价——可能捡漏也可能被顶掉">⚔️ 竞价</button>' +
                            '<button onclick="AuctionService.buyNpcLot(\'' + item.id + '\'); this.closest(\'.fixed\').remove(); AuctionService.open();" class="bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded text-xs" title="不赌了，按挂牌价直接买断">一口价</button>') +
                    '</div></div>';
            });
            html += '</div>';
        }
        html += '<h4 class="font-bold text-pink-400 mb-2">我要拍卖</h4><p class="text-xs text-gray-400 mb-2">物品会进入托管；流拍退货。上架费2%，成交税8%。价格越离谱越难卖。</p>';
        var sellable = [];
        if (global.inventory && global.inventory.slots) {
            global.inventory.slots.forEach(function (slot, idx) { if (slot && slot.count > 0) sellable.push({ slot: slot, index: idx }); });
        }
        if (!sellable.length) html += '<p class="text-gray-500 text-xs">背包为空</p>';
        else {
            html += '<div class="space-y-2">';
            sellable.forEach(function (entry) {
                var t = entry.slot.getTemplate ? entry.slot.getTemplate() : templateOf(entry.slot.templateId);
                html += '<div class="bg-gray-700/30 p-2 rounded flex justify-between items-center"><span class="text-sm">' + ((t && t.name) || entry.slot.templateId) + ' x' + entry.slot.count + '</span>' +
                    '<button onclick="AuctionService.listBySlotIndex(' + entry.index + '); this.closest(\'.fixed\').remove(); AuctionService.open();" class="bg-pink-600 hover:bg-pink-500 text-white px-2 py-1 rounded text-xs">上架</button></div>';
            });
            html += '</div>';
        }
        if (typeof global.openAuctionStoryScenario === 'function') {
            html += '<div class="mt-4 pt-3 border-t border-gray-700"><button onclick="this.closest(\'.fixed\').remove(); openAuctionStoryScenario();" class="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 py-2 rounded text-xs">🎭 参加拍卖会见闻（剧情事件）</button></div>';
        }
        var modal = document.createElement('div');
        modal.id = 'auction-modal';
        modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
        modal.onclick = function (e) { if (e.target === modal) modal.remove(); };
        modal.innerHTML = '<div class="bg-gray-800 border-2 border-pink-500 rounded-xl p-6 max-w-lg w-full mx-4"><div class="flex justify-between items-center mb-4"><h3 class="text-xl font-bold text-pink-400">🔨 拍卖行</h3><button onclick="this.closest(\'.fixed\').remove()" class="text-gray-400 hover:text-white text-2xl">&times;</button></div>' + html + '</div>';
        document.body.appendChild(modal);
    }

    function serialize() { return JSON.parse(JSON.stringify(state)); }
    function deserialize(data) {
        state = data && typeof data === 'object' ? JSON.parse(JSON.stringify(data)) : { items: [], npcRefreshDay: -1, counter: 0, notices: [], royalRefreshDay: -1, royalItems: [] };
        if (!Array.isArray(state.items)) state.items = [];
        if (!Array.isArray(state.royalItems)) state.royalItems = [];
        state.royalRefreshDay = Number.isFinite(Number(state.royalRefreshDay)) ? Number(state.royalRefreshDay) : -1;
        state.counter = Number(state.counter) || 0;
        state.items.forEach(scheduleListing);
    }
    function reset() { state = { items: [], npcRefreshDay: -1, counter: 0, notices: [], royalRefreshDay: -1, royalItems: [] }; _bidWar = null; _sellWar = null; }

    var api = { open: open, openRoyal: openRoyal, listBySlotIndex: listBySlotIndex, buyNpcLot: buyNpcLot, buyRoyalLot: buyRoyalLot, cancelListing: cancelListing, settlePlayerListing: settlePlayerListing, serialize: serialize, deserialize: deserialize, reset: reset, getState: function () { return serialize(); },
        startBidWar: startBidWar, bidWarRaise: bidWarRaise, bidWarFold: bidWarFold, getBidWar: function () { return _bidWar ? JSON.parse(JSON.stringify(_bidWar)) : null; },
        startSellWar: startSellWar, sellWarHold: sellWarHold, sellWarStrike: sellWarStrike, sellWarWalk: sellWarWalk, getSellWar: function () { return _sellWar ? JSON.parse(JSON.stringify(_sellWar)) : null; } };
    global.AuctionService = api;
    global.openAuctionHouse = open;
    global.listForAuction = listBySlotIndex;
    global.bidOnAuction = buyNpcLot;

    if (global.GameScheduler) global.GameScheduler.registerHandler('auction:settle', function (payload) { return settlePlayerListing(payload && payload.auctionId); });
    if (global.StateRegistry) global.StateRegistry.register('auction', { version: 3, export: serialize, import: deserialize, reset: reset });
})(typeof window !== 'undefined' ? window : this);
