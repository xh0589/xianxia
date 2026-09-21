// ==================== sect-economy.js - 门派贡献账本（补厚批一 · 门派经济账） ====================
// 贡献是门派核心货币，但此前它只是两处裸数字：来源不记账、去处不汇总，
// 最大的消费口（贡献兑换商店）还因 sectName 字段从未写入而永久锁死。
// 本模块：统一记账口（sectLedgerNote/sectAddContribution/sectSpendContribution）
//        + 账本面板 openSectLedger（余额/晋升差额/钱的去处/近期流水三十条）。
// 账本挂 discipleState._ledger，随 StateRegistry 存档持久化；只记最近三十条，多了截尾。
(function () {
    'use strict';
    var W = window;
    function ds() { return W.discipleState || null; }
    function absDay() {
        try {
            if (typeof W.getAbsoluteDay === 'function') return Number(W.getAbsoluteDay()) || 0;
            if (W.timeSystem && W.timeSystem.getAbsoluteDay) return Number(W.timeSystem.getAbsoluteDay()) || 0;
        } catch (e) {}
        return 0;
    }
    W.sectLedgerNote = function (amt, reason) {
        var d = ds(); if (!d) return;
        amt = Number(amt) || 0; if (!amt) return;
        if (!d._ledger || !d._ledger.push) d._ledger = [];
        d._ledger.unshift({ day: absDay(), amt: amt, reason: reason || '门中事务' });
        if (d._ledger.length > 30) d._ledger.length = 30;
    };
    W.sectAddContribution = function (n, reason) {
        var d = ds(); if (!d) return 0;
        n = Number(n) || 0;
        d.contribution = Math.max(0, (Number(d.contribution) || 0) + n);
        W.sectLedgerNote(n, reason);
        return d.contribution;
    };
    W.sectSpendContribution = function (n, reason) {
        var d = ds(); if (!d) return false;
        n = Number(n) || 0;
        if ((Number(d.contribution) || 0) < n) return false;
        d.contribution -= n;
        W.sectLedgerNote(-n, reason);
        return true;
    };
    W.sectLedgerEntries = function () { var d = ds(); return (d && d._ledger) ? d._ledger.slice() : []; };
    // 下一晋升档与差额（丐帮净衣减免沿用既有规则；掌门/特殊身份不适用）
    function nextRankInfo(d) {
        var ranks = W.COMMON_RANKS;
        if (!ranks || !d || d.rank == null) return null;
        if (d.rank === 0) return { done: true };
        if (d.rank < 0) return { special: true };
        var target = null;
        for (var i = 0; i < ranks.length; i++) { if (ranks[i].id === d.rank - 1) { target = ranks[i]; break; } }
        if (!target || !target.promoteCondition) return { done: true };
        var need = Number(target.promoteCondition.contribution) || 0;
        if (d._gbFaction && d._gbFaction.side === 'clean' && (d.sectId === '丐帮' || d.sectName === '丐帮')) need = Math.floor(need * 0.7);
        return { name: target.name, need: need, gap: Math.max(0, need - (Number(d.contribution) || 0)) };
    }
    W.sectNextRankInfo = nextRankInfo;
    W.openSectLedger = function () {
        var d = ds();
        if (!d || !d.isInSect) { if (W.showMessage) W.showMessage('还没入门——账本是空的。', 'info'); return; }
        var sect = d.sectName || d.sectId || '门派';
        var html = '<div class="text-left">';
        html += '<div class="bg-gray-800 p-3 rounded mb-2 text-center"><p class="text-xs text-gray-400">当前贡献</p><p class="text-2xl font-bold text-green-400">' + (Number(d.contribution) || 0) + '</p><p class="text-xs text-gray-500 mt-1">职位：' + (d.rankName || '外门弟子') + '</p></div>';
        var nx = nextRankInfo(d);
        if (nx && nx.gap != null) {
            html += '<div class="bg-gray-800 p-2 rounded mb-2 text-sm text-gray-300">下一档 <b class="text-yellow-300">' + nx.name + '</b>：还差 <b class="text-green-300">' + nx.gap + '</b> 贡献' + (nx.gap === 0 ? '——可以去求晋升了' : '') + '</div>';
        } else if (nx && nx.special) {
            html += '<div class="bg-gray-800 p-2 rounded mb-2 text-sm text-gray-400">特殊身份，无需晋升。</div>';
        } else if (nx && nx.done) {
            html += '<div class="bg-gray-800 p-2 rounded mb-2 text-sm text-gray-400">已至掌门之位——账还在记，路没了上一档。</div>';
        }
        html += '<div class="text-sm font-bold text-amber-200 mb-1">钱往哪儿去</div>';
        html += '<div class="grid grid-cols-3 gap-2 mb-2">';
        html += '<button onclick="window.showSectRanks(\'' + sect + '\')" class="bg-yellow-800 hover:bg-yellow-700 text-xs p-2 rounded">🏛️ 晋升答礼<br><span class="text-gray-400">（花贡献）</span></button>';
        html += '<button onclick="window.openContributionShop()" class="bg-emerald-800 hover:bg-emerald-700 text-xs p-2 rounded">🎁 贡献商店<br><span class="text-gray-400">（花贡献）</span></button>';
        html += '<button onclick="window.openSectLibraryPanel()" class="bg-purple-800 hover:bg-purple-700 text-xs p-2 rounded">📚 藏经阁<br><span class="text-gray-400">（花俸禄灵石）</span></button>';
        html += '</div>';
        var entries = W.sectLedgerEntries();
        html += '<div class="text-sm font-bold text-amber-200 mb-1">近期流水</div>';
        if (!entries.length) html += '<p class="text-xs text-gray-500">账本新开——从今往后，每笔差事、每回事件、每次晋升与兑换，都记在这里。</p>';
        entries.forEach(function (e) {
            var plus = e.amt > 0;
            html += '<div class="text-xs text-gray-300 py-1 border-b border-gray-700/50" style="display:flex;justify-content:space-between"><span>' + e.reason + '<span class="text-gray-500">（第' + e.day + '日）</span></span><span class="' + (plus ? 'text-green-400' : 'text-red-400') + '">' + (plus ? '+' : '') + e.amt + '</span></div>';
        });
        html += '</div>';
        if (typeof W.showModal === 'function') W.showModal('📊 贡献账本 · ' + sect, html);
    };
    console.log('[sect-economy] 门派贡献账本已注册：统一记账口 + 账本面板（余额/晋升差额/钱的去处/近期流水）');
})();
