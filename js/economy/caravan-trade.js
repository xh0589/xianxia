// ==================== caravan-trade.js - v25.6 押货跑商（第一百四十八批 · 玩家心愿批） ====================
// 用户点单：「跑商低买高卖——城间物价波动，押货赶路可能被截道」。
// 与既有跑单帮（peddler-service，虚拟货担、柜上现结）分账：跑单帮是柜面生意，
// 这里是**真押货**——货物从背包里扣走、装上货担，人在路上货在肩上：
//   · 行情板把六大区×六品类的供需行市摊开给你看（真源 MarketDynamic，一字不造）；
//   · 低买高卖本来就能做（商店买卖走的就是城差+行情），这里给的是**看得见的差价**与**押货的风险钱**；
//   · 货在身上过一天，就有一天被截道的风声——货值越贵越招风，仇家可能亲自来；
//   · 截道是真仗（startBattle 正门 + _isCaravanAmbush 标记 → app.js onEnd 分支结算），
//     输了货被搬走三成，赢了劫道的反成了你的进项。
// 货担走 EconomyTransaction.removeByUid 快照托管（拍卖寄售同款），账随 StateRegistry 正门。

(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    var CARAVAN_MAX = 3;              // 肩上最多三担（与跑单帮同口径）
    var AMBUSH_BASE = 0.10;           // 押货过日子的基础风声
    var AMBUSH_RICH_1 = 0.06;         // 货值 2000+ 招风加档
    var AMBUSH_RICH_2 = 0.06;         // 货值 6000+ 再加一档
    var AMBUSH_RICH_1_AT = 2000;
    var AMBUSH_RICH_2_AT = 6000;
    var LOOT_RATE = 0.05;             // 打赢劫道的，抄它老窝的进项（按货值）
    var PLUNDER_RATE = 0.3;           // 输了被搬走的货比例

    var _state = { cargo: [] }; // [{templateId, itemName, count, snapshot, originCity, originRegion, pickupDay}]

    function _today() {
        try {
            if (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') {
                var d = window.timeSystem.getAbsoluteDay();
                if (d) return d;
            }
        } catch (e) { console.warn('[静默失败] js/economy/caravan-trade.js · _today：日数没读到，货担按第 1 天记', e && e.message); }
        return 1;
    }

    function _city() {
        try {
            if (typeof window.getCurrentCityName === 'function') return window.getCurrentCityName() || '';
        } catch (e) { console.warn('[静默失败] js/economy/caravan-trade.js · _city：城名没问到，货担上写不出出处', e && e.message); }
        return (window.currentCharData && window.currentCharData.location) || '';
    }

    function _region(city) {
        try {
            if (window.MarketDynamic && typeof window.MarketDynamic.regionFor === 'function') return window.MarketDynamic.regionFor(city) || '';
        } catch (e) { console.warn('[静默失败] js/economy/caravan-trade.js · _region：城折不进大区，行情板按空认', e && e.message); }
        return '';
    }

    function cargoValue() {
        var sum = 0;
        _state.cargo.forEach(function (c) {
            var t = window.itemById && window.itemById[c.templateId];
            var base = Number(t && (t.price || t.basePrice)) || 10;
            sum += base * (c.count || 0);
        });
        return Math.round(sum);
    }

    // ============ 装货 / 卸货 ============
    function loadCaravan(slotIndex, qty) {
        var cd = window.currentCharData;
        if (!cd) { if (window.showMessage) window.showMessage('请先创建角色进入游戏。', 'info'); return false; }
        if (_state.cargo.length >= CARAVAN_MAX) {
            if (window.showMessage) window.showMessage('肩上就挑得动 ' + CARAVAN_MAX + ' 担货——先卸一担再说。', 'warning');
            return false;
        }
        if (!window.inventory || !window.inventory.slots) return false;
        var slot = window.inventory.slots[slotIndex];
        if (!slot || (slot.count || 0) <= 0) { if (window.showMessage) window.showMessage('物品不存在', 'error'); return false; }
        var template = slot.getTemplate ? slot.getTemplate() : (window.itemById && window.itemById[slot.templateId]);
        if (!template || template.type === 'quest' || template.category === 'quest') {
            if (window.showMessage) window.showMessage('任务物件押不得——那是别人的托付。', 'warning'); return false;
        }
        var count = (slot.count || 1) > 1 ? parseInt(prompt('装上多少（1-' + slot.count + '）:', String(slot.count)), 10) : 1;
        if (!Number.isFinite(count) || count < 1 || count > slot.count) { if (window.showMessage) window.showMessage('无效数量', 'error'); return false; }
        var tx = window.EconomyTransaction;
        if (!tx) { if (window.showMessage) window.showMessage('交易服务未就绪', 'error'); return false; }
        var snapshot = null;
        var city = _city();
        var ok = tx.run(function () {
            snapshot = tx.removeByUid(slot.uid, count);
            return !!snapshot;
        });
        if (!ok || !snapshot) { if (window.showMessage) window.showMessage('货没能装上肩——背包那头的账没动。', 'warning'); return false; }
        _state.cargo.push({
            templateId: slot.templateId, itemName: template.name || slot.templateId, count: count,
            snapshot: snapshot, originCity: city, originRegion: _region(city), pickupDay: _today()
        });
        if (window.showMessage) window.showMessage('🐴 ' + (template.name || slot.templateId) + ' x' + count + ' 装上了货担（' + (city || '城外') + ' 起运）。路上有失——货越贵越招风。', 'success');
        return true;
    }

    function unloadCaravan(idx) {
        var c = _state.cargo[idx];
        if (!c) { if (window.showMessage) window.showMessage('货担上没这一担。', 'info'); return false; }
        var tx = window.EconomyTransaction;
        var back = tx && tx.addSnapshot(c.snapshot);
        if (!back && typeof window.addItem === 'function') back = window.addItem(c.templateId, c.count);
        if (!back) { if (window.showMessage) window.showMessage('📦 这一担没能卸回行囊——' + ((typeof window.addItemFailPhrase === 'function' && window.addItemFailPhrase('押着的货')) || '先给行囊腾出地方，再来卸它') + '。', 'warning'); return false; }
        _state.cargo.splice(idx, 1);
        if (window.showMessage) window.showMessage('📦 ' + c.itemName + ' x' + c.count + ' 卸回行囊。要出手就趁本城行情好。', 'info');
        return true;
    }

    // ============ 行情板 ============
    function openCaravanBoard() {
        var cd = window.currentCharData;
        if (!cd) { if (window.showMessage) window.showMessage('请先创建角色进入游戏。', 'info'); return; }
        var MD = window.MarketDynamic;
        var here = _city();
        var hereRegion = _region(here);
        var gridHtml = '';
        if (MD && MD.CITIES && MD.CATEGORIES) {
            // 每品类找出最贱与最俏的大区——差价就是脚力的钱
            var lowBy = {}, highBy = {};
            MD.CATEGORIES.forEach(function (cat) {
                var lo = null, hi = null;
                MD.CITIES.forEach(function (city) {
                    var m = MD.priceMul(city, cat);
                    if (!lo || m < lo.m) lo = { city: city, m: m };
                    if (!hi || m > hi.m) hi = { city: city, m: m };
                });
                lowBy[cat] = lo; highBy[cat] = hi;
            });
            gridHtml = '<div class="overflow-x-auto"><table class="text-[11px] w-full mb-2"><thead><tr class="text-gray-500"><th class="text-left pr-2">行市</th>'
                + MD.CATEGORIES.map(function (c) { return '<th class="px-1">' + c + '</th>'; }).join('') + '</tr></thead><tbody>'
                + MD.CITIES.map(function (city) {
                    var tds = MD.CATEGORIES.map(function (cat) {
                        var m = MD.priceMul(city, cat);
                        var cls = 'text-gray-300';
                        if (lowBy[cat] && lowBy[cat].city === city && lowBy[cat].m < highBy[cat].m) cls = 'text-green-400 font-bold';
                        else if (highBy[cat] && highBy[cat].city === city && highBy[cat].m > lowBy[cat].m) cls = 'text-red-400 font-bold';
                        return '<td class="px-1 py-0.5 text-center ' + cls + '">' + m.toFixed(2) + '</td>';
                    }).join('');
                    return '<tr' + (city === hereRegion ? ' class="bg-yellow-500/10"' : '') + '><td class="pr-2 text-gray-400">' + city + (city === hereRegion ? '（你在）' : '') + '</td>' + tds + '</tr>';
                }).join('') + '</tbody></table></div>'
                + '<p class="text-[11px] text-gray-500 mb-2"><span class="text-green-400">绿</span>=该品类最贱的地界（低买），<span class="text-red-400">红</span>=最俏的地界（高卖）。行情日日在动，兽潮、瘟疫、丰收都改价。</p>';
        }
        var events = [];
        try { if (MD && typeof MD.listActiveEvents === 'function') events = MD.listActiveEvents() || []; } catch (eE) { console.warn('[静默失败] js/economy/caravan-trade.js · openCaravanBoard：正在闹的事没列出来，行情板少一行注脚', eE && eE.message); }
        var evTxt = events.length ? '<p class="text-[11px] text-gray-400 mb-2">正在影响行情的事：' + events.map(function (e) { return e.name || e.id; }).join('、') + '</p>' : '';
        var cargoHtml = _state.cargo.length
            ? _state.cargo.map(function (c, i) {
                return '<div class="bg-gray-700/30 p-2 rounded flex justify-between items-center mb-2"><span class="text-sm">' + c.itemName + ' x' + c.count
                    + '<span class="text-[11px] text-gray-500 ml-2">' + (c.originCity || '外城') + ' 起运 · 第 ' + c.pickupDay + ' 天上肩</span></span>'
                    + '<button onclick="CaravanTrade.unload(' + i + '); CaravanTrade.reopen();" class="bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded text-xs">卸回行囊</button></div>';
            }).join('')
            : '<p class="text-xs text-gray-500 mb-2">肩上空的——从行囊里挑一担装上，路就在脚下。</p>';
        var bagRows = [];
        if (window.inventory && window.inventory.slots) {
            window.inventory.slots.forEach(function (slot, idx) {
                if (slot && slot.count > 0 && slot.templateId.indexOf('spec_') !== 0) {
                    var t = slot.getTemplate ? slot.getTemplate() : (window.itemById && window.itemById[slot.templateId]);
                    if (t && t.type !== 'quest' && t.category !== 'quest') bagRows.push({ idx: idx, name: t.name || slot.templateId, count: slot.count });
                }
            });
        }
        var bagHtml = bagRows.length
            ? bagRows.slice(0, 12).map(function (r) {
                return '<div class="bg-gray-700/30 p-2 rounded flex justify-between items-center mb-2"><span class="text-sm">' + r.name + ' x' + r.count + '</span>'
                    + '<button onclick="CaravanTrade.load(' + r.idx + '); CaravanTrade.reopen();" class="bg-amber-700 hover:bg-amber-600 px-2 py-1 rounded text-xs">装上货担</button></div>';
            }).join('')
            : '<p class="text-xs text-gray-500 mb-2">行囊里没有能押的货。</p>';
        // v25.8 雇镖护货：镖师一栏（npc-bond.js 正门，不在位不画这一栏）
        var escHtml = '';
        try {
            if (window.NpcBond && typeof window.NpcBond.escortLineHtml === 'function') escHtml = window.NpcBond.escortLineHtml() || '';
        } catch (eEsc) { console.warn('[静默失败] js/economy/caravan-trade.js · openCaravanBoard：镖师一栏没画上——行情板少一块', eEsc && eEsc.message); }
        var html = '<p class="text-xs text-gray-400 mb-2">押货跑商：货从行囊里真扣走、真上肩；到价高的地界卸回行囊，照当地行市卖给铺子——差价就是脚力的钱。<span class="text-red-300">货在身上过一天，就有一天被截道的风声。</span></p>'
            + '<h4 class="font-bold text-amber-400 text-sm mb-1">📈 六区行市（今日）</h4>' + gridHtml + evTxt
            + '<h4 class="font-bold text-amber-400 text-sm mb-1 mt-3">🐴 肩上货担（' + _state.cargo.length + '/' + CARAVAN_MAX + ' · 货值约 ' + cargoValue() + ' 灵石）</h4>' + cargoHtml
            + escHtml
            + '<h4 class="font-bold text-amber-400 text-sm mb-1 mt-3">装货</h4>' + bagHtml;
        if (typeof window.showModal === 'function') _panelHandle = window.showModal('🐴 押货跑商 · 行情与货担', html);
    }

    var _panelHandle = null;

    // ============ 截道（每日风声） ============
    function _tier() {
        var cd = window.currentCharData;
        try { if (cd && typeof window.getRealmTier === 'function') return window.getRealmTier(cd.realm) || 3; } catch (e) { console.warn('[静默失败] js/economy/caravan-trade.js · _tier：境界尺没量出来，劫匪按 3 档捏', e && e.message); }
        return 3;
    }

    function maybeCaravanAmbush() {
        try {
            if (!_state.cargo.length) return false;
            var cd = window.currentCharData;
            if (!cd) return false;
            if (window.currentBattle) return false;
            if (typeof window.isInSoulState === 'function' && window.isInSoulState()) return false;
            // 人在自家洞府里，贼摸不到门口
            var atHome = false;
            try { if (typeof window.isAtHome === 'function') atHome = !!window.isAtHome(); } catch (eH) { console.warn('[静默失败] js/economy/caravan-trade.js · maybeCaravanAmbush：在不在家没问清，按在外头算', eH && eH.message); }
            if (atHome) return false;
            var value = cargoValue();
            var chance = AMBUSH_BASE + (value >= AMBUSH_RICH_1_AT ? AMBUSH_RICH_1 : 0) + (value >= AMBUSH_RICH_2_AT ? AMBUSH_RICH_2 : 0);
            // v25.7 丐帮耳目递话：常年街角施舍的人，道上有人盯梢会提前递话——截道风声让一截
            //（beggar-alms.js 正门；本账不在位/缘分不够 → null，一分不让）
            try {
                if (window.BeggarAlms && typeof window.BeggarAlms.watchDiscount === 'function') {
                    var wdC = window.BeggarAlms.watchDiscount();
                    if (wdC && Number(wdC.caravan) > 0) chance = Math.max(0.02, chance - Number(wdC.caravan));
                }
            } catch (eWatch) { console.warn('[静默失败] js/economy/caravan-trade.js · maybeCaravanAmbush：丐帮耳目的让风没算成——截道风声照旧', eWatch && eWatch.message); }
            // v25.8 雇镖护货：有镖师随货，截道的风声再让一截（npc-bond.js 正门；本账不在位 → 一分不让）
            try {
                if (window.NpcBond && typeof window.NpcBond.escortChanceMod === 'function') {
                    var escMod = Number(window.NpcBond.escortChanceMod()) || 0;
                    if (escMod > 0) chance = Math.max(0.02, chance - escMod);
                }
            } catch (eEscort) { console.warn('[静默失败] js/economy/caravan-trade.js · maybeCaravanAmbush：镖师的让风没算成——截道风声照旧', eEscort && eEscort.message); }
            if (Math.random() >= chance) return false;
            // v25.8 雇镖护货：截道真来了，镖师可能横刀断后直接喝退（雇得太抠的也可能临阵撂挑子）
            try {
                if (window.NpcBond && typeof window.NpcBond.escortAmbushGuard === 'function') {
                    if (window.NpcBond.escortAmbushGuard() === 'saved') return true;
                }
            } catch (eEscortG) { console.warn('[静默失败] js/economy/caravan-trade.js · maybeCaravanAmbush：镖师没接住这一茬——截道照常', eEscortG && eEscortG.message); }
            // 谁来的：六成无名响马，四成是仇家亲自截道（恨你入骨的人认得你的货）
            var rivals = [];
            try { if (typeof window.getRivals === 'function') rivals = (window.getRivals() || []).filter(function (n) { return n && !n.isDead && !n.isMissing; }); } catch (eR) { console.warn('[静默失败] js/economy/caravan-trade.js · maybeCaravanAmbush：仇家名单没调出来，这回来的是无名响马', eR && eR.message); }
            var foeNpc = (rivals.length && Math.random() < 0.4) ? rivals[Math.floor(Math.random() * rivals.length)] : null;
            var tier = _tier();
            var hatred = foeNpc && foeNpc.relationship ? (Number(foeNpc.relationship.hatred) || 0) : 0;
            var enemyData = foeNpc
                ? {
                    name: '【截道】' + foeNpc.name, type: 'elite', physiologyType: 'humanoid',
                    level: tier * 3 + Math.floor(hatred / 10), attack: 33 + tier * 5 + Math.floor(hatred / 5),
                    defense: 16 + tier * 3, speed: 22, maxDurability: 95 + tier * 15 + hatred,
                    durabilities: { chest: 95 + tier * 15 + hatred }, combatAbilities: []
                }
                : {
                    name: '剪径的响马头子', type: 'elite', physiologyType: 'humanoid',
                    level: tier * 3, attack: 30 + tier * 5, defense: 15 + tier * 3, speed: 20,
                    maxDurability: 90 + tier * 15, durabilities: { chest: 90 + tier * 15 }, combatAbilities: []
                };
            var foeId = foeNpc ? (foeNpc.id || null) : null;
            var foeName = foeNpc ? foeNpc.name : '响马';
            setTimeout(function () {
                try {
                    if (window.currentBattle) return;
                    if (window.startBattle) {
                        var b = window.startBattle(enemyData);
                        if (b) { b._isCaravanAmbush = true; b._caravanFoeId = foeId; b._caravanFoeName = foeName; }
                    }
                    if (window.showMessage) window.showMessage(foeNpc ? '⚔️ 「' + foeName + '」认得你的货——半路截了上来！' : '⚔️ 一伙响马盯上了你的货担，拦住去路！', 'error');
                } catch (eB) { console.warn('[静默失败] js/economy/caravan-trade.js · 截道开打：这一仗没拉起来，货担虚惊一场', eB && eB.message); }
            }, 1500);
            return true;
        } catch (e) { console.warn('[静默失败] js/economy/caravan-trade.js · maybeCaravanAmbush：风声没算完，这一天路上太平', e && e.message); return false; }
    }

    // 战后结算（由 app.js 战斗分支调用）
    function settleCaravanAmbush(won) {
        try {
            var b = window.currentBattle;
            if (!b || !b._isCaravanAmbush) return;
            var foeName = b._caravanFoeName || '响马';
            if (won) {
                var loot = Math.round(cargoValue() * LOOT_RATE) + 20;
                if (window.DataManager && typeof window.DataManager.addSpiritStones === 'function') window.DataManager.addSpiritStones(loot);
                if (b._caravanFoeId && window.npcManager && typeof window.npcManager.getNPC === 'function') {
                    var npc = window.npcManager.getNPC(b._caravanFoeId);
                    if (npc && typeof npc.changeHatred === 'function') npc.changeHatred(-15);
                }
                if (typeof window.playerPushDeed === 'function') window.playerPushDeed('good', '押着货半路遇上截道的，被你连人带刀打发了回去');
                if (window.showMessage) window.showMessage('🏆 打退了「' + foeName + '」，货全须全尾——顺手抄了它老窝 ' + loot + ' 灵石。', 'success');
            } else {
                // 抄货：每担搬走三成（不足一件按一件算），搬空的担子从肩上下去
                // v25.8 雇镖护货：镖师断后护住的货，劫匪只来得及搬走一半（npc-bond.js 正门；不在位 → 照三成搬）
                var plunderRate = PLUNDER_RATE;
                try {
                    if (window.NpcBond && typeof window.NpcBond.escortPlunderMod === 'function') {
                        var pMod = Number(window.NpcBond.escortPlunderMod());
                        if (pMod > 0 && pMod <= 1) plunderRate = PLUNDER_RATE * pMod;
                    }
                } catch (ePM) { console.warn('[静默失败] js/economy/caravan-trade.js · settleCaravanAmbush：镖师的护货账没算成——照三成搬', ePM && ePM.message); }
                var lost = [];
                for (var i = _state.cargo.length - 1; i >= 0; i--) {
                    var c = _state.cargo[i];
                    var take = Math.min(c.count, Math.max(1, Math.ceil(c.count * plunderRate)));
                    c.count -= take;
                    if (c.snapshot) c.snapshot.count = Math.max(0, (Number(c.snapshot.count) || c.count + take) - take);
                    lost.push(c.itemName + ' x' + take);
                    if (c.count <= 0) _state.cargo.splice(i, 1);
                }
                if (typeof window.playerPushDeed === 'function') window.playerPushDeed('bad', '你的货担让「' + foeName + '」搬走了三成——道上都在传这一票');
                if (window.showMessage) window.showMessage('💀 截道失利——' + (lost.length ? lost.join('、') + ' 被搬走了' : '货担早空了，他们悻悻而去') + '。', 'error');
            }
        } catch (e) { console.warn('[静默失败] js/economy/caravan-trade.js · settleCaravanAmbush：截道的账没落下，货与钱都悬着', e && e.message); }
    }

    function _export() { return JSON.parse(JSON.stringify(_state)); }
    function _import(s) {
        _state = { cargo: (s && Array.isArray(s.cargo)) ? s.cargo.filter(function (c) { return c && c.templateId && c.count > 0; }).slice(0, CARAVAN_MAX) : [] };
    }
    function _reset() { _state = { cargo: [] }; }
    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        window.StateRegistry.register('caravan', { version: 1, export: _export, import: _import, reset: _reset });
    }

    if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') {
        window.timeSystem.onNewDaySubscribe(function () { maybeCaravanAmbush(); });
    }

    window.CaravanTrade = {
        CARAVAN_MAX: CARAVAN_MAX,
        cargo: function () { return JSON.parse(JSON.stringify(_state.cargo)); },
        cargoValue: cargoValue,
        load: loadCaravan,
        unload: unloadCaravan,
        open: openCaravanBoard,
        reopen: function () {
            try { if (_panelHandle && typeof _panelHandle.close === 'function') _panelHandle.close(); } catch (eC) { console.warn('[静默失败] js/economy/caravan-trade.js · reopen：旧行情板没关掉，屏上叠了两张板', eC && eC.message); }
            openCaravanBoard();
        },
        maybeAmbush: maybeCaravanAmbush
    };
    window.openCaravanBoard = openCaravanBoard;
    window.settleCaravanAmbush = settleCaravanAmbush;
    window.maybeCaravanAmbush = maybeCaravanAmbush;
})();
