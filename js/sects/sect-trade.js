// ==================== sect-trade.js - 坊市商路与押运（改造批三：资源真流通） ====================
// 病根：三十六派各守各的库——药材多的和铁多的老死不相往来，资源不流通，守恒只有半本账。
// 本批：
//   一、自动商路——每三十日按营生配对（药多的卖药、铁多的卖铁），商队真出发：
//       货源门派出材料十份，路上损耗两成，到门入八份，货款十五灵石真付真收——两头编年各记一笔。
//   二、押运差事——涉及本门的商路在议事厅张榜七日，玩家可押运：
//       路上真仗（劫道的佣兵，强度随境界）；护住了=贡献+60入账本+酬金灵石+40+两头编年；
//       被劫了=货折一半（世界的账，不是玩家的账），编年照记「商路遇袭，货折半」。
//       不押也有商队自己走（雇的护卫，安稳到货）——世界不等你。
// 纪律：商路状态挂 eventFlags 随档；贡献走批一账本；编年走批六政事；零外文字母。
(function () {
    'use strict';
    var W = window;

    function flags() { return (W.eventFlags = W.eventFlags || {}); }
    function absDay() { try { return W.timeSystem && W.timeSystem.getAbsoluteDay ? (Number(W.timeSystem.getAbsoluteDay()) || 0) : 0; } catch (e) { return 0; } }
    function log(m, t) { try { if (W.gameLog && W.gameLog.add) W.gameLog.add(m); } catch (e) {} }
    function msg(m, t) { if (typeof W.showMessage === 'function') W.showMessage(m, t || 'info'); }
    function ds() { return W.discipleState || null; }
    function mySect() { var d = ds(); return (d && d.isInSect && (d.sectName || d.sectId)) || null; }
    function gov() { return W.SectGov || null; }
    function realmTier(realm) { try { if (typeof W.getRealmTier === 'function') { var t = Number(W.getRealmTier(realm)); if (isFinite(t)) return t; } } catch (e) {} return 1; }
    function addStones(n) {
        try { if (W.XianXia && W.XianXia.DataManager && W.XianXia.DataManager.addSpiritStones) { W.XianXia.DataManager.addSpiritStones(n); return; } } catch (e) {}
        if (W.inventory && W.inventory.currency) W.inventory.currency.spiritStones = (Number(W.inventory.currency.spiritStones) || 0) + n;
    }
    function addC(n, r) { try { if (typeof W.sectAddContribution === 'function') W.sectAddContribution(n, r); } catch (e) {} }

    function routes() {
        var f = flags();
        if (!f['sect_trade_routes'] || !f['sect_trade_routes'].push) f['sect_trade_routes'] = [];
        return f['sect_trade_routes'];
    }

    // ============ 一 · 自动商路（三十日一班，按营生配对） ============
    function pickRoute() {
        var g = gov();
        if (!g || typeof g.affinity !== 'function') return null;
        var sects = Object.keys(W.SECT_INTERNAL || {});
        var herbRich = [], matRich = [];
        for (var i = 0; i < sects.length; i++) {
            var aff = g.affinity(sects[i]);
            if (aff.herb >= 2) herbRich.push(sects[i]);
            if (aff.mat >= 2) matRich.push(sects[i]);
        }
        if (!herbRich.length || !matRich.length) return null;
        var d = absDay();
        var from = herbRich[(d * 7) % herbRich.length];       // 卖药的一方出货
        var to = matRich[(d * 5 + 3) % matRich.length];       // 打铁的一方收货
        if (from === to) to = matRich[(d * 5 + 7) % matRich.length];
        if (from === to) return null;
        return { from: from, to: to, goods: '药材', day: d, until: d + 7, state: 'open' };
    }
    function executeTrade(route, full) {
        var g = gov();
        if (!g) return;
        var src = g.internalRef(route.from), dst = g.internalRef(route.to);
        if (!src || !dst) return;
        g.ensureStores(route.from); g.ensureStores(route.to);
        var send = Math.min(10, Number(src.material) || 0);
        if (send <= 0) { route.state = 'void'; return; }
        var arrive = full ? Math.round(send * 0.8) : Math.round(send * 0.4); // 路上损耗两成；被劫再折半
        src.material -= send;
        dst.material = (Number(dst.material) || 0) + arrive;
        if (full) { src.resources = (Number(src.resources) || 0) + 15; dst.resources = Math.max(0, (Number(dst.resources) || 0) - 15); }
        else { src.resources = (Number(src.resources) || 0) + 7; dst.resources = Math.max(0, (Number(dst.resources) || 0) - 15); }
        route.state = full ? 'done' : 'raided';
        g.chronicle(route.from, '商队往' + route.to + '去了：' + route.goods + send + '份，换回灵石' + (full ? 15 : 7) + '。' + (full ? '一路顺当。' : '路上遭了劫，货折了半——押队的人回来了，货没全回来。'));
        g.chronicle(route.to, route.from + '的商队到了：' + route.goods + '入库' + arrive + '份，付出灵石十五。' + (full ? '' : '（货折在半路，掌柜的直叹气）'));
        if (mySect() === route.from || mySect() === route.to) {
            log('🐎 商路结算：' + route.from + '→' + route.to + '，' + route.goods + (full ? '安稳到货' : '半路遭劫折了一半') + '。（两头编年各记一笔）', full ? 'info' : 'warning');
        }
    }
    function tradeDayTick() {
        var d = absDay();
        if (!d) return;
        var rs = routes();
        // 到期的商路：没人押运，商队自己走（雇的护卫）——世界不等你
        for (var i = rs.length - 1; i >= 0; i--) {
            if (rs[i].state === 'open' && d > rs[i].until) { executeTrade(rs[i], true); }
            if (rs[i].state !== 'open') rs.splice(i, 1); // 结算过的清出队列
        }
        // 三十日一班新商路
        if (d % 30 === 0) {
            var r = pickRoute();
            if (r && !rs.some(function (x) { return x.state === 'open' && ((x.from === r.from && x.to === r.to) || (x.from === r.to && x.to === r.from)); })) {
                rs.push(r);
                var g = gov();
                if (g) {
                    g.chronicle(r.from, '坊市定了新商路：' + r.goods + '发往' + r.to + '，七日后车队动身。');
                }
                if (mySect() === r.from || mySect() === r.to) {
                    log('🐎 与本门有关的商路张榜了：' + r.from + '→' + r.to + '（' + r.goods + '）。七日内在议事厅「门中政事」可接押运——护住了有功，被劫了货折半。', 'info');
                }
            }
        }
    }
    try {
        if (W.EventBus && W.EventBus.on) W.EventBus.on('newDay', function () { try { tradeDayTick(); } catch (e) {} });
        else if (W.timeSystem && typeof W.timeSystem.onNewDaySubscribe === 'function') W.timeSystem.onNewDaySubscribe(function () { try { tradeDayTick(); } catch (e) {} });
    } catch (e) {}

    // ============ 二 · 押运差事（真仗） ============
    function openRoute() {
        var home = mySect();
        if (!home) return null;
        var rs = routes();
        for (var i = 0; i < rs.length; i++) {
            if (rs[i].state === 'open' && (rs[i].from === home || rs[i].to === home) && absDay() <= rs[i].until) return rs[i];
        }
        return null;
    }
    W.sectTradeEscortOffer = function () { return openRoute(); };
    W.doTradeEscort = function () {
        var r = openRoute();
        if (!r) { msg('眼下没有等你押运的商路。', 'info'); return false; }
        if (typeof W.startBattle !== 'function') { msg('战端未就绪。', 'error'); return false; }
        var c = W.currentCharData || {};
        var tier = Math.max(1, realmTier(c.realm));
        var enemy = {
            name: '噬骨佣军·截道队', type: 'enemy', physiologyType: 'humanoid',
            level: Math.max(1, (typeof W.realmScaledEnemyLevel === 'function' ? W.realmScaledEnemyLevel(c) : tier * 3)),
            attack: 34 + tier * 6, defense: 18 + tier * 4, speed: 20 + tier * 2,
            maxDurability: 100 + tier * 16, durabilities: { chest: 100 + tier * 16 },
            combatAbilities: [],
            description: '专吃商队的佣兵——他们盯上这趟货了。'
        };
        var b = W.startBattle(enemy);
        if (b) { b._isTradeEscortBattle = true; b._tradeFrom = r.from; b._tradeTo = r.to; }
        r.state = 'escorting';
        log('🐎 你随商队出发了。车队出山门十里，道旁的林子里有弩机上弦的声——噬骨佣军，专吃商队的。（真仗）', 'danger');
        return true;
    };
    // 战后结算（app.js _isTradeEscortBattle 分支调用）
    W.settleTradeEscort = function (win) {
        var b = W.currentBattle || {};
        var rs = routes();
        var r = null;
        for (var i = 0; i < rs.length; i++) { if (rs[i].from === b._tradeFrom && rs[i].to === b._tradeTo && rs[i].state === 'escorting') { r = rs[i]; break; } }
        if (!r) return;
        if (win) {
            addC(60, '押运商路·护货有功');
            addStones(40);
            var g = gov();
            if (g) {
                g.chronicle(r.from, '这趟商路是弟子押的队——佣兵没讨着便宜，货全须全尾到了' + r.to + '。');
            }
            executeTrade(r, true);
            log('🐎 佣兵丢下十几件兵刃退了。货全须全尾到埠——两头都记你的功。（贡献+60入账，酬金灵石+40）', 'success');
            msg('🐎 押运功成：贡献+60、灵石+40。', 'success');
        } else {
            executeTrade(r, false);
            log('💔 商队被截了——你断后拖住佣兵，车夫们抢出一半货。押运无功，货折半：这就是被劫的商路的账。', 'error');
        }
    };

    // ============ 三 · 议事厅/政事面板插块 ============
    W.SectTrade = {
        panelBlock: function (sect) {
            var rs = routes();
            var mine = mySect() === sect;
            var html = '';
            var open = rs.filter(function (r) { return r.state === 'open' && (r.from === sect || r.to === sect); })[0];
            if (open) {
                html += '<div class="bg-amber-900/30 border border-amber-700/50 rounded p-2 mb-2">'
                    + '<p class="text-xs text-amber-200">🐎 商路张榜：' + open.from + ' → ' + open.to + '（' + open.goods + '），' + (open.until - absDay()) + '日内车队动身。</p>'
                    + (mine ? '<button onclick="window.doTradeEscort()" class="mt-1 bg-red-800 hover:bg-red-700 text-white text-xs px-3 py-1 rounded">⚔️ 接押运——路上真仗，护住有功</button>'
                        : '<p class="text-[10px] text-gray-500 mt-1">（本门弟子才可押这门里的货。）</p>')
                    + '</div>';
            }
            // 最近一班商路的去向（资源流通看得见）
            var last = null;
            for (var i = rs.length - 1; i >= 0; i--) { if (rs[i].state !== 'open') { last = rs[i]; break; } }
            if (!html && last) {
                html += '<p class="text-[10px] text-gray-500 mb-2">🐎 最近一班商路：' + last.from + '→' + last.to + '（' + (last.state === 'raided' ? '半路遭劫，货折半' : '安稳到货') + '）。</p>';
            }
            return html;
        },
        probe: function () { return { routes: JSON.parse(JSON.stringify(routes())), open: openRoute() }; }
    };

    console.log('[sect-trade] 坊市商路已注册：三十日一班按营生配对（货源-损耗-货款真转移）+ 押运差事真仗 + 两头编年落笔');
})();
