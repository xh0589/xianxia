/**
 * npc-rel-events.js — v20.6 闭环② 关系边产事件
 *
 * npcRelationships 里的仇怨/情谊边此前只是数据；本文件让边自己长出日常事件：
 *   - enemy 边（嫌隙≥40）：低概率当街寻衅 → 嫌隙加深 + 传闻 + 参与者性格渐硬；
 *     玩家恰在同地才弹干预弹窗（帮一头 / 另一头 / 分劝——分劝需声望≥50，人微言轻没人理）。
 *   - friend 边：低概率登门回访 → 情谊升温 + 正面见闻。
 *
 * 设计宪法：概率制无配额（与既有门派事件同款随机节律）；干预成本/门槛来自世界
 * （同地、声望、结仇后果）；一切落既有真源（关系图/好感/声望/传闻池/性格漂移）。
 * rng 可注入（tickDay(day, {randomSource})）供回归复现。
 */
(function (global) {
    'use strict';

    var VERSION = 1;
    var DUEL_CHANCE = 0.012;   // 每条深仇边每日寻衅概率
    var VISIT_CHANCE = 0.006;  // 每条友边每日回访概率

    function rngOf(opts) { return (opts && typeof opts.randomSource === 'function') ? opts.randomSource : Math.random; }
    function num(v) { return typeof v === 'number' && isFinite(v) ? v : 0; }
    function playerLoc() { return (global.currentCharData && global.currentCharData.location) || null; }
    function dayNow() {
        var ts = global.timeSystem;
        if (ts && typeof ts.getAbsoluteDay === 'function') {
            try { return ts.getAbsoluteDay(); } catch (e) {}
        }
        return (ts && ts.gameTime && ts.gameTime.currentDay) || 1;
    }
    function escapeHtml(s) {
        if (s == null) return '';
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    function drift(npc, dim, delta, reason) {
        if (typeof global.driftPersonality === 'function') {
            try { global.driftPersonality(npc, dim, delta, reason); } catch (e) {}
        }
    }

    function relTick(day, opts) {
        day = day || dayNow();
        var rng = rngOf(opts);
        var mgr = global.npcManager;
        if (!mgr || typeof mgr.getAllNPCs !== 'function') return 0;
        var all = mgr.getAllNPCs() || [];
        var fired = 0;
        for (var i = 0; i < all.length; i++) {
            var a = all[i];
            if (!a || a.isDead || a.isMissing || !a.npcRelationships) continue;
            for (var oid in a.npcRelationships) {
                if (String(a.id) >= String(oid)) continue; // 无序边只处理一次
                var rel = a.npcRelationships[oid];
                if (!rel) continue;
                var b = typeof mgr.getNPC === 'function' ? mgr.getNPC(oid) : null;
                if (!b || b.isDead || b.isMissing) continue;
                var type = rel.relation || String(rel);
                var s = num(rel.strength);
                if (type === 'enemy' && s >= 40) {
                    if (rng() < DUEL_CHANCE) { duel(a, b, s, day); fired++; }
                } else if (type === 'friend') {
                    if (rng() < VISIT_CHANCE) { visit(a, b, day); fired++; }
                }
            }
        }
        return fired;
    }

    // ============ 仇家寻衅 ============
    function duel(a, b, s, day) {
        var ns = Math.min(100, s + 6);
        if (typeof global.setNPCRelationshipPair === 'function') {
            global.setNPCRelationshipPair(a, b, 'enemy', ns);
        }
        if (global.NPCLife && typeof global.NPCLife.pushNote === 'function') {
            global.NPCLife.pushNote(day, a, 'social',
                '「' + a.name + '」与「' + b.name + '」在' + (a.location || '某地') + '当街动起手来，两人各自带了伤', 'bad');
        }
        drift(a, 'nature', -3, '刀头见血，性情渐硬');
        drift(b, 'nature', -3, '刀头见血，性情渐硬');
        // 只有玩家在场才谈得上干预
        var pl = playerLoc();
        if (pl && a.location === pl && b.location === pl && typeof global.showModal === 'function') {
            global._pendingDuel = { aId: a.id, bId: b.id };
            var aid = escapeHtml(a.id), bid = escapeHtml(b.id);
            var html = '<p class="text-sm text-gray-300 mb-3">「' + escapeHtml(a.name) + '」揪着「' + escapeHtml(b.name) + '」的旧怨不放，眼看要出人命。</p>' +
                '<button onclick="NPCRelEvents.duelResolve(\'' + aid + '\',\'' + bid + '\',\'left\')" class="w-full bg-red-900 hover:bg-red-800 text-white text-xs rounded p-2 mb-1">帮「' + escapeHtml(a.name) + '」出头</button>' +
                '<button onclick="NPCRelEvents.duelResolve(\'' + aid + '\',\'' + bid + '\',\'right\')" class="w-full bg-red-900 hover:bg-red-800 text-white text-xs rounded p-2 mb-1">帮「' + escapeHtml(b.name) + '」出头</button>' +
                '<button onclick="NPCRelEvents.duelResolve(\'' + aid + '\',\'' + bid + '\',\'sep\')" class="w-full bg-emerald-800 hover:bg-emerald-700 text-white text-xs rounded p-2">上前分劝（需声望服人）</button>';
            global.showModal('🗡️ 街头械斗', html);
        }
    }

    function duelResolve(aId, bId, side) {
        global._pendingDuel = null;
        var mgr = global.npcManager;
        var a = mgr && typeof mgr.getNPC === 'function' ? mgr.getNPC(aId) : null;
        var b = mgr && typeof mgr.getNPC === 'function' ? mgr.getNPC(bId) : null;
        if (!a || !b || a.isDead || b.isDead) {
            if (global.showMessage) global.showMessage('等你回过头，街上早散了。', 'info');
            return false;
        }
        var pl = playerLoc();
        if (!pl || a.location !== pl || b.location !== pl) {
            if (global.showMessage) global.showMessage('等你回过头，街上早散了。', 'info');
            return false;
        }
        var cd = global.currentCharData || {};
        if (side === 'sep') {
            if (num(cd.fame) < 50) {
                if (typeof a.changeAffection === 'function') a.changeAffection(-1);
                if (typeof b.changeAffection === 'function') b.changeAffection(-1);
                if (global.showMessage) global.showMessage('你人微言轻，两人只当没看见你——在江湖上挣得名声再来劝。', 'warning');
                return false;
            }
            var cur = (a.npcRelationships && a.npcRelationships[bId]) || { strength: 0 };
            var ns = Math.max(0, num(cur.strength) - 12);
            if (typeof global.adjustNPCRelationshipPair === 'function') {
                global.adjustNPCRelationshipPair(a, b, 12, {}); // 敌意下降，够浅则转普通
            }
            if (typeof a.changeAffection === 'function') a.changeAffection(2);
            if (typeof b.changeAffection === 'function') b.changeAffection(2);
            if (typeof global.addFame === 'function') global.addFame(2);
            drift(a, 'nature', 3, '有人肯为两人出头，信了世道几分');
            drift(b, 'nature', 3, '有人肯为两人出头，信了世道几分');
            if (global.showMessage) global.showMessage('🕊️ 你站在两人中间，各自咽下那口气。街边有人低声说：这才是修仙界该有的样子。', 'success');
            return true;
        }
        // 帮一头 = 与另一头结怨：两人嫌隙更深，帮的记你的情，被帮对面记你的名
        var partner = side === 'left' ? a : b;
        var opposite = side === 'left' ? b : a;
        var s0 = ((partner.npcRelationships && partner.npcRelationships[side === 'left' ? bId : aId]) || {}).strength;
        if (typeof global.setNPCRelationshipPair === 'function') {
            global.setNPCRelationshipPair(a, b, 'enemy', Math.min(100, num(s0) + 8));
        }
        if (typeof partner.changeAffection === 'function') partner.changeAffection(4);
        if (typeof opposite.changeAffection === 'function') opposite.changeAffection(-6);
        if (typeof global.addFame === 'function') global.addFame(1);
        if (global.showMessage) global.showMessage('🗡️ 你替「' + partner.name + '」挡下了这一场——「' + opposite.name + '」把你的脸记下了。', 'info');
        return true;
    }

    // ============ 好友回访 ============
    function visit(a, b, day) {
        if (typeof global.adjustNPCRelationshipPair === 'function') {
            global.adjustNPCRelationshipPair(a, b, 2, {});
        }
        if (global.NPCLife && typeof global.NPCLife.pushNote === 'function') {
            global.NPCLife.pushNote(day, a, 'social',
                '「' + a.name + '」不远千里来看「' + b.name + '」，两人对坐吃茶说起旧事', 'good');
        }
    }

    // 每日自动推进（挂在世界日历上）
    if (global.timeSystem && typeof global.timeSystem.onNewDaySubscribe === 'function') {
        global.timeSystem.onNewDaySubscribe(function () {
            try { relTick(dayNow()); } catch (e) {}
        });
    }

    var api = {
        version: VERSION,
        tickDay: relTick,
        duelResolve: duelResolve,
        duelPending: function () { return global._pendingDuel || null; }
    };
    global.NPCRelEvents = api;
    global.XianXia = global.XianXia || {};
    global.XianXia.NPCRelEvents = api;

    console.log('[NPCRelEvents] initialized v' + VERSION);
})(typeof window !== 'undefined' ? window : this);
