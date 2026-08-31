/**
 * npc-life-actor.js — v19.2 P0-5：NPC 自主人生
 *
 * 目的（v18.8 路线图 §5 P0-5 验收）：
 *   每天给 5~20 个活跃 NPC 推一次"人生行动"：移动/社交/修炼/物品。
 *   推动关系/位置/物品/境界，通过 EventBus 广播"江湖传闻"。
 *
 * 设计宪法（强制规则.md）：
 *   - 单一真源：NPC_LIFE_STORE[npcId] = { lastActionDay, actionHistory }
 *   - StateRegistry 'npcLifeActions' v1 持久化（旧档按空对象初始化）
 *   - 不引入"日限 N 次"型配额：一天一次行动
 *   - 玩家闭关不影响世界（路线图 §5 P0-5 验收 4）
 *
 * 加载顺序：第 6 层，在 npc-life-system.js 之后。
 */
(function (global) {
    'use strict';

    var VERSION = 1;

    // ============ 真源 ============
    var NPC_LIFE_STORE = {}; // { npcId: { lastActionDay, actionHistory: [...] } }

    // 江湖传闻池（最近 N 条）
    var RUMOR_LOG = []; // [{day, npcId, npcName, type, summary, result}]
    var RUMOR_MAX = 50;

    // 行动类型
    var ACTION_TYPES = ['move', 'social', 'cultivate', 'rest'];

    // 性能：抽样上限
    var SAMPLE_MIN = 5;
    var SAMPLE_MAX = 20;

    // 工具：随机
    function pickOne(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function pickWeighted(arr, weights) {
        var total = 0;
        for (var i = 0; i < weights.length; i++) total += weights[i];
        var r = Math.random() * total;
        var acc = 0;
        for (var j = 0; j < arr.length; j++) {
            acc += weights[j];
            if (r < acc) return arr[j];
        }
        return arr[arr.length - 1];
    }

    // ============ 抽样算法 ============
    /**
     * 选今日要推的 NPC（5~20 个）
     * 优先级：
     *  - 玩家当前同 location 的 NPC（最近互动）— 权重 3
     *  - 玩家宗门 NPC（discipleState.sectId）— 权重 2
     *  - 其他活跃 NPC — 权重 1
     *  - 排除 lastActionDay === today（同日已行动）
     *  - 排除死亡/失踪 NPC
     */
    function sampleNpcsForToday(day) {
        if (!global.npcManager || typeof global.npcManager.getAllNPCs !== 'function') return [];
        var all = global.npcManager.getAllNPCs() || [];
        var playerLocation = (global.currentCharData && global.currentCharData.location) || null;
        var playerSect = (global.discipleState && global.discipleState.isInSect) ? global.discipleState.sectId : null;
        var candidates = [];
        for (var i = 0; i < all.length; i++) {
            var n = all[i];
            if (!n) continue;
            // 排除死亡/失踪
            if (n.isDead || n.isMissing) continue;
            // 排除已行动
            var st = NPC_LIFE_STORE[n.id];
            if (st && st.lastActionDay === day) continue;
            var weight = 1;
            if (playerLocation && n.location === playerLocation) weight = 3;
            if (playerSect && n.location === playerSect) weight = Math.max(weight, 2);
            candidates.push({ npc: n, weight: weight });
        }
        if (!candidates.length) return [];
        // 按权重排序后取 SAMPLE_MAX
        candidates.sort(function (a, b) { return b.weight - a.weight; });
        // 加随机扰动，避免每次完全相同
        var pool = candidates.slice(0, Math.min(candidates.length, SAMPLE_MAX * 3));
        // 简单洗牌
        for (var k = pool.length - 1; k > 0; k--) {
            var r = Math.floor(Math.random() * (k + 1));
            var tmp = pool[k]; pool[k] = pool[r]; pool[r] = tmp;
        }
        var n = Math.min(SAMPLE_MAX, Math.max(SAMPLE_MIN, pool.length));
        return pool.slice(0, n).map(function (c) { return c.npc; });
    }

    // ============ 行动决策 ============
    /**
     * 按 NPC 的"目标"（基于当前状态）选行动
     * @param {Object} npc
     * @returns {string} 'move'|'social'|'cultivate'|'rest'
     */
    function chooseAction(npc) {
        // 简易策略：随机 + 倾向
        //   - 没有 location 80% move
        //   - 处于修炼环境 60% cultivate
        //   - 否则 50% social, 30% rest, 20% move
        if (!npc.location) return 'move';
        // 修真界地图：若 location 含"洞府/山" 倾向 cultivate
        if (typeof npc.location === 'string' && (npc.location.indexOf('洞府') >= 0 || npc.location.indexOf('山') >= 0)) {
            if (Math.random() < 0.5) return 'cultivate';
        }
        return pickWeighted(['move', 'social', 'cultivate', 'rest'], [0.20, 0.30, 0.30, 0.20]);
    }

    // ============ 行动执行 ============
    /**
     * 对单个 NPC 执行一次行动
     * @returns {Object} action 描述（写入 history）
     */
    function executeAction(npc, day) {
        var actionType = chooseAction(npc);
        var summary = '';
        var result = 'success';
        try {
            if (actionType === 'move') {
                // 移动到另一城市（取所有 npc 的不同 location）
                var destinations = collectDestinations();
                if (destinations.length > 1) {
                    var dest = pickOne(destinations.filter(function (d) { return d !== npc.location; }));
                    if (dest) {
                        npc.location = dest;
                        summary = npc.name + ' 离开 ' + (npc.location || '原处') + ' 前往 ' + dest;
                    } else {
                        result = 'no-destination';
                        summary = npc.name + ' 想出游但没有可去之处';
                    }
                } else {
                    result = 'no-destination';
                    summary = npc.name + ' 留在原地';
                }
            } else if (actionType === 'social') {
                // 与同 location 另一 NPC 互动
                var partners = collectPartners(npc);
                if (partners.length) {
                    var p = pickOne(partners);
                    var delta = Math.random() < 0.5 ? 1 : -1;
                    if (typeof p.changeAffection === 'function') p.changeAffection(delta);
                    if (typeof npc.changeAffection === 'function') npc.changeAffection(Math.random() < 0.5 ? 1 : 0);
                    summary = npc.name + ' 在 ' + (npc.location || '某地') + ' 与 ' + p.name + ' 互动（好感' + (delta > 0 ? '+' : '') + delta + '）';
                } else {
                    // 没有可互动的人 → 改为休息
                    actionType = 'rest';
                    summary = npc.name + ' 在 ' + (npc.location || '某地') + ' 独处休息';
                }
            } else if (actionType === 'cultivate') {
                // 修真微调：5% 概率境界进度微涨
                if (Math.random() < 0.05 && npc.combat && typeof npc.combat.layer === 'number') {
                    // 写 _cultivationProgress 字段
                    npc._cultivationProgress = (Number(npc._cultivationProgress) || 0) + 1;
                    summary = npc.name + ' 在 ' + (npc.location || '某地') + ' 修炼（小有进境）';
                } else {
                    // 80% 概率 改为休息
                    actionType = 'rest';
                    summary = npc.name + ' 闭目养神';
                }
            } else {
                // rest
                summary = npc.name + ' 在 ' + (npc.location || '某地') + ' 静养一日';
            }
        } catch (e) {
            result = 'error: ' + (e && e.message);
        }
        return { day: day, type: actionType, summary: summary, result: result };
    }

    function collectDestinations() {
        if (!global.npcManager || typeof global.npcManager.getAllNPCs !== 'function') return [];
        var all = global.npcManager.getAllNPCs() || [];
        var set = {};
        for (var i = 0; i < all.length; i++) {
            if (all[i] && all[i].location) set[all[i].location] = true;
        }
        return Object.keys(set);
    }

    function collectPartners(npc) {
        if (!npc.location || !global.npcManager || typeof global.npcManager.getAllNPCs !== 'function') return [];
        var all = global.npcManager.getAllNPCs() || [];
        var out = [];
        for (var i = 0; i < all.length; i++) {
            var o = all[i];
            if (!o || o.id === npc.id) continue;
            if (o.location === npc.location) out.push(o);
        }
        return out;
    }

    // ============ 玩家可见：江湖传闻 ============
    function pushRumor(day, npc, action) {
        var r = {
            day: day,
            npcId: npc.id,
            npcName: npc.name || npc.id,
            type: action.type,
            summary: action.summary,
            result: action.result
        };
        RUMOR_LOG.unshift(r);
        if (RUMOR_LOG.length > RUMOR_MAX) RUMOR_LOG.length = RUMOR_MAX;
        if (global.EventBus && typeof global.EventBus.emit === 'function') {
            try { global.EventBus.emit('npc:action:done', r); } catch (e) {}
        }
        return r;
    }

    // ============ 每日 tick ============
    /**
     * 由 processAllSectDailyEconomy 末尾调用
     * @param {number} day 游戏绝对日
     */
    function tickDay(day) {
        if (!day) return;
        var npcs = sampleNpcsForToday(day);
        for (var i = 0; i < npcs.length; i++) {
            var npc = npcs[i];
            if (!npc || !npc.id) continue;
            // 单 NPC 单日一次
            var st = NPC_LIFE_STORE[npc.id] = NPC_LIFE_STORE[npc.id] || { lastActionDay: 0, actionHistory: [] };
            if (st.lastActionDay === day) continue;
            var action = executeAction(npc, day);
            st.lastActionDay = day;
            if (!Array.isArray(st.actionHistory)) st.actionHistory = [];
            st.actionHistory.unshift(action);
            if (st.actionHistory.length > 20) st.actionHistory.length = 20;
            pushRumor(day, npc, action);
        }
    }

    function getRecent(npcId, n) {
        var st = NPC_LIFE_STORE[npcId];
        if (!st) return [];
        return (st.actionHistory || []).slice(0, n || 10);
    }

    function getRumorLog(limit) {
        return RUMOR_LOG.slice(0, limit || 20);
    }

    /**
     * 渲染江湖传闻面板 HTML
     */
    function renderRumorPanel(limit) {
        var rumors = getRumorLog(limit || 20);
        var html = '<div class="space-y-1">';
        if (!rumors.length) {
            html += '<p class="text-sm text-gray-500">江湖平静，暂无新传闻。</p>';
        } else {
            for (var i = 0; i < rumors.length; i++) {
                var r = rumors[i];
                var icon = r.type === 'move' ? '🚶' : (r.type === 'social' ? '💬' : (r.type === 'cultivate' ? '🧘' : '😴'));
                html += '<p class="text-xs text-gray-300"><span class="text-gray-500">[第 ' + r.day + ' 天]</span> ' + icon + ' ' + escapeHtml(r.summary) + '</p>';
            }
        }
        html += '</div>';
        return html;
    }

    function escapeHtml(s) {
        if (s == null) return '';
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function showRumorPanel(limit) {
        var html = renderRumorPanel(limit || 30);
        if (typeof global.showModal === 'function') {
            global.showModal('江湖传闻', html);
        } else if (global.showMessage) {
            global.showMessage('showModal 未就绪', 'warning');
        }
    }

    // ============ 公开 API ============
    var api = {
        version: VERSION,
        tickDay: tickDay,
        getRecent: getRecent,
        getRumorLog: getRumorLog,
        renderRumorPanel: renderRumorPanel,
        showRumorPanel: showRumorPanel,
        // 内部访问
        _store: function () { return NPC_LIFE_STORE; },
        _rumors: function () { return RUMOR_LOG; }
    };

    global.NPCLife = api;
    global.XianXia = global.XianXia || {};
    global.XianXia.NPCLife = api;

    // StateRegistry 持久化
    if (global.StateRegistry && typeof global.StateRegistry.register === 'function') {
        global.StateRegistry.register('npcLifeActions', {
            version: VERSION,
            export: function () { return NPC_LIFE_STORE; },
            import: function (data) {
                NPC_LIFE_STORE = {};
                if (data && typeof data === 'object') {
                    Object.keys(data).forEach(function (k) { NPC_LIFE_STORE[k] = data[k]; });
                }
            },
            reset: function () { NPC_LIFE_STORE = {}; }
        });
    }

    console.log('[NPCLife] initialized v' + VERSION);
})(typeof window !== 'undefined' ? window : this);
