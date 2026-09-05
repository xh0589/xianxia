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
 * v20.5 扩展：
 *   - 传闻池 RUMOR_LOG 经 StateRegistry 'npcRumors' 持久化（旧档空数组初始化，零迁移）
 *   - 行动权重/社交倾向委托 P16Driver（personality-driver.js，可选依赖：缺载走基线）
 *   - 社交时携带"别处发生的新闻"转述，听者按五维性格失真 → 传闻变体（variantOf 溯源）
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

    // ============ v20.13 灵根生效：灵根驱动 NPC 自主修炼 ============
    // 灵根是五行的一张饼（v20.10 口径），主根/40 = 修炼进境倍率，钳位 [0.4, 2.5]：
    //   主根 40（估算饼的主流主根）= 常速 1.0；五行均衡（各行 20）= 0.5 倍——杂灵根本就艰难；
    //   单灵根（主根 100）= 2.5 倍——"天才进境快"从此是世界事实，不是文案。
    // 无灵根数据按境界估算（复用 v20.10 guessRoots，与族谱面板同一把尺）。
    // 设计宪法：不新增配额/计数器——成本仍是"一日一行 + 5% 进境机缘"，
    // 灵根只改同份进度的速度；进度字段 _cultivationProgress 真源不变（master-teach 共读）。
    function npcRootGrowthMul(npc) {
        var roots = (npc && npc.spiritualRoots && typeof npc.spiritualRoots === 'object') ? npc.spiritualRoots : null;
        if (!roots || !Object.keys(roots).length) {
            roots = null;
            if (global.NpcLineage && typeof global.NpcLineage._guessRoots === 'function') {
                try { roots = global.NpcLineage._guessRoots(npc); } catch (e) { roots = null; }
            }
        }
        if (!roots) return 1.0; // 族谱未载入等极端场景：按常速，不拿猜测当事实
        var main = 0;
        for (var k in roots) {
            var v = Number(roots[k]) || 0;
            if (v > main) main = v;
        }
        var mul = main / 40;
        if (mul < 0.4) mul = 0.4;
        if (mul > 2.5) mul = 2.5;
        return Math.round(mul * 100) / 100;
    }

    // v20.14 传闻解释灵根来历：主根≥80 才配在传闻里报名号（估算饼主根至多 50，天然不会误标天才）
    var _ROOT_CN = { metal: '金', wood: '木', water: '水', fire: '火', earth: '土' };
    function dominantRootName(npc) {
        var roots = (npc && npc.spiritualRoots && typeof npc.spiritualRoots === 'object') ? npc.spiritualRoots : null;
        if (!roots) return null;
        var main = 0, mainKey = null;
        for (var k in roots) {
            var v = Number(roots[k]) || 0;
            if (v > main) { main = v; mainKey = k; }
        }
        if (main < 80 || !_ROOT_CN[mainKey]) return null;
        return _ROOT_CN[mainKey] + '灵根';
    }

    // 一步修炼进境：按灵根倍率累积进度，攒满 10 自主突破（v1.4 逻辑，v20.13 灵根驱动）
    function cultivateStep(npc) {
        var mul = npcRootGrowthMul(npc);
        npc._cultivationProgress = (Number(npc._cultivationProgress) || 0) + mul;
        if ((Number(npc._cultivationProgress) || 0) >= 10) {
            npc._cultivationProgress = 0;
            var _orders = ['凡人', '炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'];
            npc.combat.layer = (npc.combat.layer || 1) + 1;
            // v20.6 道途精进者心性渐稳：突破即性格小幅回执
            if (typeof global.driftPersonality === 'function') {
                try { global.driftPersonality(npc, 'identity', -3, '闭关突破，道心沉稳几分'); } catch (e) {}
            }
            var flavor = '';
            if (mul >= 2) {
                var rn = dominantRootName(npc); // v20.14：传闻说得出"他是什么根骨"
                flavor = rn ? rn + '，众人称天才——' : '天赋异禀，进境迅捷——';
            } else if (mul <= 0.5) {
                flavor = '大器晚成——'; // 杂灵根攒满一次进度最慢，突破本身就是新闻
            }
            if ((npc.combat.layer || 1) > 9) {
                npc.combat.layer = 1;
                var _ri = _orders.indexOf(npc.combat.realm || '炼气');
                if (_ri >= 0 && _ri < _orders.length - 1) {
                    npc.combat.realm = _orders[_ri + 1];
                    return flavor + npc.name + ' 闭关突破，晋升 ' + npc.combat.realm + '！';
                }
                return npc.name + ' 修为已臻化境';
            }
            return flavor + npc.name + ' 修炼突破，进境 ' + npc.combat.layer + ' 层';
        }
        return mul >= 2
            ? npc.name + ' 闭关苦修，进境飞快'
            : npc.name + ' 在 ' + (npc.location || '某地') + ' 修炼（小有进境）';
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
        // v20.5：权重来自 P16Driver（E 多社交 / I 多修炼 / P 多动 / J 定课 / T起伏多静养）；缺载走基线
        if (!npc.location) return 'move';
        // 修真界地图：若 location 含"洞府/山" 倾向 cultivate
        if (typeof npc.location === 'string' && (npc.location.indexOf('洞府') >= 0 || npc.location.indexOf('山') >= 0)) {
            if (Math.random() < 0.5) return 'cultivate';
        }
        var weights = [0.20, 0.30, 0.30, 0.20];
        if (global.P16Driver && typeof global.P16Driver.actionWeights === 'function') {
            try {
                var w = global.P16Driver.actionWeights(npc);
                if (w && w.length === 4) weights = w;
            } catch (e) {}
        }
        return pickWeighted(['move', 'social', 'cultivate', 'rest'], weights);
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
                    // v20.5：善意概率受性格左右（F 结善缘、T 起摩擦；A 稳、T起伏忽冷忽热）
                    var goodProb = 0.5;
                    if (global.P16Driver && typeof global.P16Driver.socialBias === 'function') {
                        try { goodProb = 0.5 + global.P16Driver.socialBias(npc) * 0.30; } catch (e) {}
                    }
                    var delta = Math.random() < goodProb ? 1 : -1;
                    if (typeof p.changeAffection === 'function') p.changeAffection(delta);
                    if (typeof npc.changeAffection === 'function') npc.changeAffection(Math.random() < 0.5 ? 1 : 0);
                    summary = npc.name + ' 在 ' + (npc.location || '某地') + ' 与 ' + p.name + ' 互动（好感' + (delta > 0 ? '+' : '') + delta + '）';
                    // v20.5：有别处带来的新闻就讲给对方，对方按自己性格失真
                    spreadRumor(npc, p, day);
                } else {
                    // 没有可互动的人 → 改为休息
                    actionType = 'rest';
                    summary = npc.name + ' 在 ' + (npc.location || '某地') + ' 独处休息';
                }
            } else if (actionType === 'cultivate') {
                // 修真微调：5% 概率境界进度微涨（v20.13：进境速度由灵根决定，成本不变）
                if (Math.random() < 0.05 && npc.combat && typeof npc.combat.layer === 'number') {
                    summary = cultivateStep(npc);
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
    var NOTE_SEQ = 0;
    // 公开注入口：玩家事迹/事件系统都可向传闻池写条目（mood: good/bad/neutral）
    function pushNote(day, npcRef, type, summary, mood) {
        if (!npcRef || !npcRef.id || !summary) return null;
        NOTE_SEQ++;
        var r = {
            id: 'r' + day + '-' + npcRef.id + '#' + NOTE_SEQ,
            day: day,
            npcId: npcRef.id,
            npcName: npcRef.name || npcRef.id,
            type: type || 'deed',
            summary: summary,
            result: 'success',
            location: npcRef.location || null,
            mood: mood || 'neutral'
        };
        RUMOR_LOG.unshift(r);
        if (RUMOR_LOG.length > RUMOR_MAX) RUMOR_LOG.length = RUMOR_MAX;
        if (global.EventBus && typeof global.EventBus.emit === 'function') {
            try { global.EventBus.emit('npc:action:done', r); } catch (e) {}
        }
        return r;
    }

    function pushRumor(day, npc, action) {
        var r = {
            id: 'r' + day + '-' + npc.id,
            day: day,
            npcId: npc.id,
            npcName: npc.name || npc.id,
            type: action.type,
            summary: action.summary,
            result: action.result,
            location: npc.location || null
        };
        RUMOR_LOG.unshift(r);
        if (RUMOR_LOG.length > RUMOR_MAX) RUMOR_LOG.length = RUMOR_MAX;
        recordHeard(npc.id, r.id);
        if (global.EventBus && typeof global.EventBus.emit === 'function') {
            try { global.EventBus.emit('npc:action:done', r); } catch (e) {}
        }
        return r;
    }

    // ============ v20.5 传闻携带与失真传播 ============
    function findRumorById(id) {
        if (!id) return null;
        for (var i = 0; i < RUMOR_LOG.length; i++) {
            if (RUMOR_LOG[i].id === id) return RUMOR_LOG[i];
        }
        return null;
    }

    // NPC 听过哪些传闻（存 id，传闻被池挤掉即自然失效）
    function recordHeard(npcId, rumorId) {
        if (!npcId || !rumorId) return;
        // 听者可能当日不是行动者（社交对面），账簿缺项按 tickDay 同款默认值创建
        var st = NPC_LIFE_STORE[npcId] = NPC_LIFE_STORE[npcId] || { lastActionDay: 0, actionHistory: [] };
        if (!Array.isArray(st.heard)) st.heard = [];
        if (st.heard.indexOf(rumorId) >= 0) return;
        st.heard.unshift(rumorId);
        if (st.heard.length > 8) st.heard.length = 8;
    }

    // 传播：讲述者把"发生在别处"的旧闻带给听者；听者按自己五维性格失真改写（失真可在难度设置关闭）
    function spreadRumor(carrier, listener, day) {
        if (!global.P16Driver || typeof global.P16Driver.distortRumor !== 'function') return null;
        var st = NPC_LIFE_STORE[carrier.id];
        var heardIds = (st && Array.isArray(st.heard)) ? st.heard : [];
        var base = null;
        for (var i = 0; i < heardIds.length; i++) {
            var cand = findRumorById(heardIds[i]);
            // 只传"别处发生的事"——本地事人尽皆知，没有转述价值
            if (cand && cand.location && cand.location !== carrier.location) { base = cand; break; }
        }
        if (!base) return null;
        // 难度设置可关失真（默认开）：关掉后传闻只扩散、不走形（原样转述仍可溯源）
        var distortionOn = !(global._settings && global._settings.rumorDistortion === false);
        var v = null;
        if (distortionOn) {
            try {
                v = global.P16Driver.distortRumor(listener, base, { day: day, location: carrier.location });
            } catch (e) { return null; }
            if (!v) return null; // 中间性格：不产变体
        } else {
            v = {
                variantOf: base.id || null,
                day: day,
                npcId: listener.id,
                npcName: listener.name || listener.id,
                type: base.type || 'social',
                result: base.result || 'success',
                location: carrier.location || listener.location || null,
                summary: base.summary,
                distorted: false,
                glossStyle: null,
                mood: base.mood || 'neutral' // v20.6：关闭失真时善恶定性同样随闻走
            };
        }
        v.id = 'v.' + (base.id || 'r0') + '.' + listener.id;
        RUMOR_LOG.unshift(v);
        if (RUMOR_LOG.length > RUMOR_MAX) RUMOR_LOG.length = RUMOR_MAX;
        recordHeard(carrier.id, v.id);
        recordHeard(listener.id, v.id);
        if (global.EventBus && typeof global.EventBus.emit === 'function') {
            try { global.EventBus.emit('npc:action:done', v); } catch (e) {}
        }
        return v;
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
                // v20.5：失真变体标 🌀 并注传闻走形的风格；有地点则一并显示
                var loc = r.location ? '·' + escapeHtml(r.location) : '';
                var mark = r.distorted ? '🌀 ' : '';
                var tail = (r.distorted && r.glossStyle) ? ' <span class="text-gray-500">（' + escapeHtml(r.glossStyle) + '）</span>' : '';
                html += '<p class="text-xs text-gray-300"><span class="text-gray-500">[第 ' + r.day + ' 天' + loc + ']</span> ' + icon + ' ' + mark + escapeHtml(r.summary) + tail + '</p>';
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
        pushNote: pushNote,
        // v20.13 灵根驱动修炼（导出供测试与后续系统复用同一把尺）
        npcRootGrowthMul: npcRootGrowthMul,
        cultivateStep: cultivateStep,
        dominantRootName: dominantRootName,
        // 内部访问
        _store: function () { return NPC_LIFE_STORE; },
        _rumors: function () { return RUMOR_LOG; },
        _findRumor: findRumorById,
        _spreadRumor: spreadRumor
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
        // v20.5 传闻池持久化：旧档无此键 → import 收 undefined 按空池初始化（零迁移）
        global.StateRegistry.register('npcRumors', {
            version: VERSION,
            export: function () { return RUMOR_LOG; },
            import: function (data) {
                RUMOR_LOG.length = 0;
                if (Array.isArray(data)) {
                    for (var i = 0; i < data.length && RUMOR_LOG.length < RUMOR_MAX; i++) RUMOR_LOG.push(data[i]);
                }
            },
            reset: function () { RUMOR_LOG.length = 0; }
        });
    }

    console.log('[NPCLife] initialized v' + VERSION);
})(typeof window !== 'undefined' ? window : this);
