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
            minListingPrice: 1,
            saleChanceByPriceRatio: [{ maxRatio: 1, chance: 0.85 }, { maxRatio: 2, chance: 0.2 }, { maxRatio: Infinity, chance: 0.05 }]
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
    function tryRegisterAuctionEvent(tier, day) {
        try {
            if (!global.WorldCalendar || typeof global.WorldCalendar.register !== 'function') return;
            var cal = global.WorldCalendar;
            var id = 'auction.' + tier + '.day' + day;
            var title = tier === 'royal' ? '皇家拍卖场开市' : '坊市开市';
            cal.register({
                id: id,
                title: title,
                category: 'auction',
                dueAbsoluteDay: day,
                source: { system: 'auction-service', refId: tier },
                severity: tier === 'royal' ? 'major' : 'info',
                oneShot: false
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
            notify('🔨 拍卖成交：' + item.itemName + ' x' + item.quantity + '，到账 ' + net + ' 灵石（税 ' + tax + '）', 'success');
        } else {
            var returned = global.EconomyTransaction && global.EconomyTransaction.addSnapshot(item.itemSnapshot);
            if (!returned && typeof global.addItem === 'function') returned = global.addItem(item.templateId, item.quantity);
            if (!returned) return false; // 背包满时保留任务，下次继续尝试，绝不吞物品
            item.status = 'unsold';
            item.settledMinute = nowMinute();
            notify('📦 拍卖流拍：' + item.itemName + ' x' + item.quantity + ' 已退回背包', 'warning');
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
            var p = Number(t.price || t.basePrice) || 0;
            return p > 0 && p <= maxBase && ['LEGENDARY', 'MYTHIC'].indexOf(t.quality) < 0;
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
        if (ok) notify('🔨 竞得 ' + item.itemName + ' x' + item.quantity + '，支付 ' + cost + ' 灵石', 'success');
        return !!ok;
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
            html += '<div class="space-y-2 max-h-60 overflow-y-auto mb-4">';
            active.forEach(function (item) {
                var left = Math.max(0, item.dueMinute - nowMinute());
                var leftH = Math.ceil(left / 60);
                var mine = item.sellerType === 'player';
                html += '<div class="bg-gray-700/30 p-2 rounded flex justify-between items-center"><div>' +
                    '<span class="text-sm font-bold">' + item.itemName + ' x' + item.quantity + '</span>' +
                    '<span class="text-xs text-gray-400 ml-2">卖家: ' + item.sellerName + '</span>' +
                    '<div class="text-[11px] text-gray-500">约 ' + leftH + ' 游戏小时后结束</div></div>' +
                    '<div class="flex items-center gap-2"><span class="text-sm text-yellow-400">' + item.unitPrice + '灵石/件</span>' +
                    (mine ? '<button onclick="AuctionService.cancelListing(\'' + item.id + '\'); this.closest(\'.fixed\').remove(); AuctionService.open();" class="bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded text-xs">撤回</button>'
                          : '<button onclick="AuctionService.buyNpcLot(\'' + item.id + '\'); this.closest(\'.fixed\').remove(); AuctionService.open();" class="bg-pink-600 hover:bg-pink-500 text-white px-2 py-1 rounded text-xs">出价</button>') +
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
            html += '<div class="space-y-2 max-h-48 overflow-y-auto">';
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
    function reset() { state = { items: [], npcRefreshDay: -1, counter: 0, notices: [], royalRefreshDay: -1, royalItems: [] }; }

    var api = { open: open, openRoyal: openRoyal, listBySlotIndex: listBySlotIndex, buyNpcLot: buyNpcLot, buyRoyalLot: buyRoyalLot, cancelListing: cancelListing, settlePlayerListing: settlePlayerListing, serialize: serialize, deserialize: deserialize, reset: reset, getState: function () { return serialize(); } };
    global.AuctionService = api;
    global.openAuctionHouse = open;
    global.listForAuction = listBySlotIndex;
    global.bidOnAuction = buyNpcLot;

    if (global.GameScheduler) global.GameScheduler.registerHandler('auction:settle', function (payload) { return settlePlayerListing(payload && payload.auctionId); });
    if (global.StateRegistry) global.StateRegistry.register('auction', { version: 3, export: serialize, import: deserialize, reset: reset });
})(typeof window !== 'undefined' ? window : this);
