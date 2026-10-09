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
 * v27.13 扩展（NPC 私账·轻账 A 案）：
 *   - 过堂文档⑦真缺口「雇主永远出得起钱、掌柜永远进得起货」——给有营生/有身份的 NPC 挂 purse 私房钱账，
 *     账本体挂在 NPC_LIFE_STORE[npcId].ledger（营生记录名下），随 'npcLifeActions'（version 1→2→3）出档入档；
 *   - 本文件只放账本体与收支正门（ensure/pay/settle）；日结钩子订在 npc-inventory.js（加载序在
 *     enhanced-shop.js 之后，掌柜补货闸必须排在其补货之后跑，时序在那边讲）；
 *   - v27.13 后半刀·闭环事件（破产/发迹）：贫富 mark 标记（见底/殷实）接续取材——mark+markDay 连续满
 *     若干日，冒一条一次性市井故事进 gameLog（挂 settleAll 日结拍子之后，不另开日结钩子），按身份分池
 *     （铺面/手艺口吻）。
 *     只动嘴不动账：不真关铺子、不真夺产、不改任何商店/NPC 系统行为——故事只是故事；
 *     外加 ledger.evt flag（一生一次，随档走）；全城每月至多 2 条（'npcLifeStories' 键随档），玩家在场的城优先。
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
                // NEW-43②：有归宿的游走——夜里（游戏小时≥18 或 <6）或五成概率直接回家（homeLocation），
                // 其余时候从「世界地点」池里挑一处串门；设施格不再进池（见 collectDestinations）
                var fromLoc = npc.location || '原处';   // NEW-43③：先存旧值再改写，出发地不再被新值覆盖
                var dest = null;
                var gameHour = (global.timeSystem && global.timeSystem.gameTime && typeof global.timeSystem.gameTime.currentHour === 'number')
                    ? global.timeSystem.gameTime.currentHour : 12;
                var isNight = (gameHour >= 18 || gameHour < 6);
                if (npc.homeLocation && npc.homeLocation !== npc.location && (isNight || Math.random() < 0.5)) {
                    dest = npc.homeLocation;
                }
                if (!dest) {
                    var destinations = collectDestinations().filter(function (d) { return d !== npc.location; });
                    if (destinations.length > 0) dest = pickOne(destinations);
                }
                if (dest) {
                    npc.location = dest;
                    summary = npc.name + ' 离开 ' + fromLoc + ' 前往 ' + dest;
                } else {
                    result = 'no-destination';
                    summary = npc.name + ' 想出游但没有可去之处';
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
        // NEW-43②：目的地池只收「世界地点」——城名（locationSystem.cityData）+ 门派名（sectsData）。
        // 旧版取「全体 NPC 当前所在」做池子，是个自我循环：一旦有人漂进旅馆/军营/后山/山洞
        // 这类设施格，这些格子就永久成为合法目的地，游走范围只会越滚越大。
        var set = {};
        var cd = (global.locationSystem && global.locationSystem.cityData) || null;
        if (cd) { for (var c in cd) set[c] = true; }
        var sects = global.sectsData || null;
        if (sects) { for (var s in sects) set[s] = true; }
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

    // ============ v27.13 NPC 私账（轻账）：purse 账本体 ============
    // v27.13：为什么挂这里——过堂文档⑦真缺口「NPC 有库存（npc-inventory）无收支」——雇主永远出得起钱、
    //   掌柜永远进得起货。账本体挂 NPC_LIFE_STORE[npcId].ledger，与营生记录（actionHistory）同册，
    //   随既有 StateRegistry 'npcLifeActions' 出档入档（version 1→2，见文件底部注册处）。
    // v27.13：范围只收「有营生/有身份」一层——有铺子的掌柜、发任务的雇主、职业像营生的——不给全城路人开账
    //   （城坊居民 city-residents 不走 npcManager，天然不在册）。
    // v27.13：收支口径（日结由 npc-inventory.js 的钩子调 settle，见那边时序说明）——
    //   收入·滴灌——商号进项大（要扛补货账）、手艺/身份进项小，无营生无进项；
    //   支出——吃饭（每日 2~4）+ 房钱（每月一缴 15~25）；purse 上下夹逼 [0, cap]，不透支不爆账。
    // v27.13：兜底铁律——账不在册（旧档缺字段/无资格 NPC）→ ensure/pay 返回 null，调用方一切照旧，一行不差。
    var PURSE_TUNE = {
        shop:  { start: 500, incomeMin: 90, incomeVar: 60, cap: 2000 }, // 商号：进货流水是大头，进项须大体扛得住
        trade: { start: 150, incomeMin: 6,  incomeVar: 6,  cap: 400 }   // 手艺/身份：滴灌口径，饿不死也富不快
    };
    // v27.13：营生字类——职业命中即算有营生/有身份（掌柜/医/药/匠/师/长老/掌门/宫主/谷主/堂主这一层）；
    //   村民/隐士/竞争对手这类不命中——他们不发任务就不开账（villager_01/rival_01 由雇主名单兜住）。
    var LIVELIHOOD_RE = /商|店|掌柜|铺|医|药|匠|铁|教|师|长|僧|道|修|掌|宫|谷|堂|庄|首|法王/;
    // v27.13：雇主/任务发布者名单——行囊心愿十人（npc-inventory.js WANTS_DATA），他们的谢礼走雇主闸
    var EMPLOYER_IDS = ['mentor_01', 'merchant_01', 'warrior_01', 'healer_01', 'craftsman_01',
        'mysterious_01', 'elder_01', 'villager_01', 'rival_01', 'alchemist_01'];

    // v27.13：夹逼——purse 钉在 [0, cap]，cap 坏值回档位默认，档里的坏账不许撑爆闸门
    function _clampPurse(led) {
        if (!led) return;
        var t = PURSE_TUNE[led.tier] || PURSE_TUNE.trade;
        if (!Number.isFinite(led.cap) || led.cap <= 0) led.cap = t.cap;
        if (!Number.isFinite(led.purse) || led.purse < 0) led.purse = 0;
        if (led.purse > led.cap) led.purse = led.cap;
    }

    // v27.13：该不该给这位 NPC 开账——有铺子→商号档；雇主名单/职业像营生→手艺档；都不沾→null（账不在册）
    function purseTierOf(npc) {
        if (!npc || !npc.id) return null;
        try {
            if (global.shopManager && typeof global.shopManager.getAllShops === 'function') {
                var shops = global.shopManager.getAllShops() || [];
                for (var i = 0; i < shops.length; i++) {
                    if (shops[i] && shops[i].owner === npc.id) return 'shop';
                }
            }
        } catch (e) { console.warn('[静默失败] js/npcs/npc-life-actor.js · purseTierOf：查铺主失败', e && e.message); }
        if (EMPLOYER_IDS.indexOf(npc.id) >= 0) return 'trade';
        if (npc.occupation && LIVELIHOOD_RE.test(npc.occupation)) return 'trade';
        return null;
    }

    // v27.13：取账（懒开账）——已开→账本；有资格未开→立开（开局/旧档首触即入册）；无资格→null（账不在册，行为照旧）
    function ensureLedger(npcOrId) {
        try {
            var npc = npcOrId;
            if (typeof npcOrId === 'string') {
                npc = (global.npcManager && typeof global.npcManager.getNPC === 'function') ? global.npcManager.getNPC(npcOrId) : null;
            }
            if (!npc || !npc.id) return null;
            // v27.13：死者/失踪/远行者不开账——人不在了就没有收支，闸门对他照旧放行（与 settleAll 的跳过口径一致）
            if (npc.isDead || npc.isMissing || npc._isGone) return null;
            var st = NPC_LIFE_STORE[npc.id];
            if (st && st.ledger) {
                // v27.13：在册旧账缺 evt（破产/发迹一生一次 flag）→ 就地补零兜底，其余口径一行不差
                if (!st.ledger.evt || typeof st.ledger.evt !== 'object') st.ledger.evt = { broke: false, rich: false };
                _clampPurse(st.ledger);
                return st.ledger;
            }
            var tier = purseTierOf(npc);
            if (!tier) return null;
            var t = PURSE_TUNE[tier];
            var day = (global.timeSystem && typeof global.timeSystem.getAbsoluteDay === 'function') ? global.timeSystem.getAbsoluteDay() : 0;
            st = NPC_LIFE_STORE[npc.id] = st || { lastActionDay: 0, actionHistory: [] };
            // v27.13：evt = 破产/发迹故事的一生一次 flag（broke/rich），随档走
            st.ledger = { tier: tier, purse: t.start, cap: t.cap, createdDay: day, lastDay: day, mark: null, markDay: 0, lastThinNoticeDay: 0, evt: { broke: false, rich: false } };
            return st.ledger;
        } catch (e) {
            console.warn('[静默失败] js/npcs/npc-life-actor.js · ensureLedger：开账失败', e && e.message);
            return null;
        }
    }

    // v27.13：雇主闸正门——NPC 掏私账付钱（npc-inventory.js 的谢礼支付调用）。
    //   返回 null = 账不在册/账房未载 → 调用方按原样全额付，一行不差；
    //   在册 → { paid, shortfall }：实付=min(应付, purse)，账上扣多少付多少——付不出就是付不出。
    function npcPay(npcOrId, amount) {
        var led = ensureLedger(npcOrId);
        if (!led) return null;
        var want = Math.max(0, Math.floor(Number(amount) || 0));
        var paid = Math.min(want, led.purse);
        led.purse -= paid;
        _clampPurse(led);
        return { paid: paid, shortfall: paid < want };
    }

    // v27.16：NPC 收钱入账（borrow 契约的还钱口用）——与 npcPay 同一把 clamp 尺，
    // 钱包有进有出，穷态才有翻身的路（守恒：玩家还的钱进的是他真实的钱包）。
    function npcCredit(npcOrId, amount) {
        var led = ensureLedger(npcOrId);
        if (!led) return null;
        var got = Math.max(0, Math.floor(Number(amount) || 0));
        led.purse += got;
        _clampPurse(led);
        return { credited: got };
    }

    // v27.13：日结——全城在册 NPC 滴灌进项 + 吃饭/房钱支出 + 贫富标记；标记之后接破产/发迹故事的候选攒取
    //   （v27.13 后半刀）：故事出不出街由 emitLifeStories 的月度闸/玩家城优先定，账本身照旧只记账不触发。
    function settleAll(day) {
        day = Number(day) || ((global.timeSystem && typeof global.timeSystem.getAbsoluteDay === 'function') ? global.timeSystem.getAbsoluteDay() : 0);
        if (!day) return 0;
        var all = (global.npcManager && typeof global.npcManager.getAllNPCs === 'function') ? (global.npcManager.getAllNPCs() || []) : [];
        var settled = 0;
        // v27.13：破产/发迹候选攒取池（本日结算完统一出街，不在循环里逐个冒）
        var cands = [];
        var playerLoc = (global.currentCharData && global.currentCharData.location) || null;
        for (var i = 0; i < all.length; i++) {
            var npc = all[i];
            if (!npc || !npc.id || npc.isDead || npc.isMissing || npc._isGone) continue;
            var led = ensureLedger(npc);
            if (!led) continue;
            var t = PURSE_TUNE[led.tier] || PURSE_TUNE.trade;
            // v27.13：收入——有营生才有进项
            led.purse += t.incomeMin + Math.floor(Math.random() * t.incomeVar);
            // v27.13：支出·吃饭——每日 2~4，账上不够就少花（不透支）
            led.purse -= Math.min(led.purse, 2 + Math.floor(Math.random() * 3));
            // v27.13：支出·房钱——每月初一（day%30==0）缴一回 15~25，住店口径的月结
            if (day % 30 === 0) led.purse -= Math.min(led.purse, 15 + Math.floor(Math.random() * 11));
            _clampPurse(led);
            led.lastDay = day;
            // v27.13：贫富分化标记——markDay 记「何时落入这个状态」（连续期间不刷新），破产/发迹事件按 mark+markDay 取材
            var mk = (led.purse <= 20) ? '见底' : (led.purse >= led.cap ? '殷实' : null);
            if (mk !== led.mark) { led.mark = mk; led.markDay = day; }
            // v27.13：后半刀——见底/殷实连续满若干日（day-markDay 即现成连续记录）→ 破产/发迹候选；
            //   flag 已烧过的一生只此一次不再候选；此处只攒候选不动账
            var _streak = day - (Number(led.markDay) || 0);
            if (led.mark === '见底' && led.evt && !led.evt.broke && _streak >= STORY_TUNE.brokeDays - 1) {
                cands.push({ npc: npc, led: led, kind: 'broke' });
            } else if (led.mark === '殷实' && led.evt && !led.evt.rich && _streak >= STORY_TUNE.richDays - 1) {
                cands.push({ npc: npc, led: led, kind: 'rich' });
            }
            settled++;
        }
        // v27.13：后半刀——候选出街（月度限频 + 玩家在场的城优先 + gameLog 正门），出口缺席/异常都不碍账
        emitLifeStories(day, cands, playerLoc);
        return settled;
    }

    // ============ v27.13 后半刀：破产/发迹事件（只动嘴不动账） ============
    // v27.13：拍子——不做新日结钩子，就挂在 settleAll 日结循环之后（npc-inventory.js 的 purseDailyHook 每日一拍）。
    // v27.13：口径——mark（见底/殷实）+ markDay（落入状态起始日，连续期间不刷新）就是现成的连续记录：
    //   day - markDay ≥ 阈值-1（即连续第 N 个结算日仍在该状态）→ 故事候选。
    //   出街只进 gameLog：账上不扣一分、铺子不关、行为不改——故事只是故事，外加 evt flag 落 ledger 随档走。
    var STORY_METER = { monthKey: 0, count: 0 }; // v27.13：全城月度计数，随 'npcLifeStories' 键出档入档
    var STORY_TUNE = {
        brokeDays: 3,   // v27.13：连续见底满 3 日 → 破产故事
        richDays: 5,    // v27.13：连续殷实满 5 日 → 发迹故事（顶到 cap 本就攒了很久，再压 5 日防县花一现）
        monthMax: 2     // v27.13：全城每月至多 2 条，防刷屏
    };
    // v27.13：文案池——{name} 填 NPC 名；短句、有人味、不带数值。破产/发迹 × 铺面/手艺口吻各一池。
    var STORY_POOLS = {
        broke: {
            shop: [
                '{name}的铺子门口贴出了转让告示，街坊围着看了半天没人吭声',
                '{name}把铺面钥匙交给了债主，行李捆得比来时还小',
                '有人看见{name}在铺子里打了一夜算盘，天亮时幌子摘了'
            ],
            trade: [
                '{name}把家伙什当了，换来的钱只够几日嚼用',
                '{name}近来连酒钱都赊着，熟客见了都悄悄绕道走',
                '{name}在当铺门口站了半晌，最后抱着个包袱进去了'
            ]
        },
        rich: {
            shop: [
                '{name}近来出手阔绰，听说是铺子里进了笔大买卖',
                '{name}把隔壁铺面也盘了下来，说要扩字号',
                '{name}新换了幌子，红绸子老远就瞧得见'
            ],
            trade: [
                '{name}近来出手阔绰，走在街上腰杆都直了几分',
                '{name}添了新衣新靴，谁也说不清他哪来的钱',
                '{name}请半条街的人喝了酒，问就是遇上喜事了'
            ]
        }
    };
    // v27.13：身份口吻——铺主档（shop tier）或职业像买卖人 → 铺面口吻；其余营生 → 手艺人口吻。
    //   纯文案分池不碰经济（真铺主日结进项大、结算时刻难见底，铺面破产文案主要给「无铺的掌柜」这类在册账说）。
    var MERCHANT_RE = /商|店|掌柜|铺|庄|栈|行/;

    function storyFlavorOf(npc, led) {
        if (led && led.tier === 'shop') return 'shop';
        try {
            if (npc && npc.occupation && MERCHANT_RE.test(npc.occupation)) return 'shop';
        } catch (e) { console.warn('[静默失败] js/npcs/npc-life-actor.js · storyFlavorOf：读职业失败', e && e.message); }
        return 'trade';
    }

    // v27.13：出街——月度闸内按「玩家在场的城优先」挑候选；gameLog 缺席则本日不出、不烧 flag（改日再试）。
    //   出一条：gameLog 正门 + ledger.evt flag 落定（一生一次，随档走）+ 月度计数 +1。
    function emitLifeStories(day, cands, playerLoc) {
        try {
            if (!cands || !cands.length) return;
            if (!global.gameLog || typeof global.gameLog.add !== 'function') return;
            var mk = Math.floor(day / 30);
            if (STORY_METER.monthKey !== mk) { STORY_METER.monthKey = mk; STORY_METER.count = 0; }
            if (STORY_METER.count >= STORY_TUNE.monthMax) return;
            for (var i = 0; i < cands.length; i++) {
                cands[i].pri = (playerLoc && cands[i].npc && cands[i].npc.location === playerLoc) ? 1 : 0;
            }
            cands.sort(function (a, b) { return b.pri - a.pri; }); // 稳定排序：同城候选保持结算遍历序
            var quota = STORY_TUNE.monthMax - STORY_METER.count;
            for (var j = 0; j < cands.length && quota > 0; j++) {
                var c = cands[j];
                if (!c || !c.npc || !c.led || !c.led.evt || c.led.evt[c.kind]) continue;
                var flavor = storyFlavorOf(c.npc, c.led);
                var pool = (STORY_POOLS[c.kind] && STORY_POOLS[c.kind][flavor]) || null;
                if (!pool || !pool.length) continue;
                var text = pickOne(pool).replace('{name}', c.npc.name || c.npc.id || '某人');
                global.gameLog.add('【市井】' + text, 'story');
                c.led.evt[c.kind] = true;
                STORY_METER.count++;
                quota--;
            }
        } catch (e) {
            console.warn('[静默失败] js/npcs/npc-life-actor.js · emitLifeStories：破产/发迹事件失败', e && e.message);
        }
    }

    var ledgerApi = {
        ensure: ensureLedger,  // 取账/懒开账（null=账不在册）
        pay: npcPay,           // 雇主闸：NPC 私账付钱
        credit: npcCredit,     // v27.16：收钱入账（还欠款/卖当物——NPC 的钱包有进有出才是活账）
        settle: settleAll,     // 日结收支（npc-inventory.js 的新日钩子调用）
        purse: function (npcOrId) { var led = ensureLedger(npcOrId); return led ? led.purse : null; }
    };

    // ============ 公开 API ============
    var api = {
        version: VERSION,
        tickDay: tickDay,
        getRecent: getRecent,
        getRumorLog: getRumorLog,
        renderRumorPanel: renderRumorPanel,
        showRumorPanel: showRumorPanel,
        pushNote: pushNote,
        // v27.13：NPC 私账（轻账）正门——账本体/付钱/日结/查余，账不在册一律返回 null（调用方照旧）
        ledger: ledgerApi,
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
        // v27.13：NPC 私账随本册出档——version 1→2→3（后半刀加 evt 破产/发迹一生一次 flag；
        //   StateRegistry 的 version 只作档内标注，import 对新旧形都兜底）。
        //   export 原样返回 NPC_LIFE_STORE（StateRegistry 侧深拷贝），ledger 挂在各 NPC 条目里随行；
        //   import 对 ledger 做 sanitize：旧档条目无 ledger → 视为账不在册（闸门照旧放行），坏数字一律回 0 再夹逼，
        //   旧档缺 evt（v2 及更早）→ 按补零兜底（= 从未发过故事，一生一次的额度还在）。
        global.StateRegistry.register('npcLifeActions', {
            version: 3,
            export: function () { return NPC_LIFE_STORE; },
            import: function (data) {
                NPC_LIFE_STORE = {};
                if (data && typeof data === 'object') {
                    Object.keys(data).forEach(function (k) {
                        var entry = data[k];
                        if (entry && typeof entry === 'object' && entry.ledger !== undefined) {
                            if (entry.ledger && typeof entry.ledger === 'object') {
                                var lg = entry.ledger;
                                var tier = (lg.tier === 'shop') ? 'shop' : 'trade';
                                entry.ledger = {
                                    tier: tier,
                                    purse: Math.max(0, Number(lg.purse) || 0),
                                    cap: Number(lg.cap) > 0 ? Number(lg.cap) : (PURSE_TUNE[tier].cap),
                                    createdDay: Number(lg.createdDay) || 0,
                                    lastDay: Number(lg.lastDay) || 0,
                                    mark: (lg.mark === '见底' || lg.mark === '殷实') ? lg.mark : null,
                                    markDay: Number(lg.markDay) || 0,
                                    lastThinNoticeDay: Number(lg.lastThinNoticeDay) || 0,
                                    // v27.13：破产/发迹一生一次 flag——旧档缺 evt 按补零兜底（flag 坏形视为没发过）
                                    evt: (lg.evt && typeof lg.evt === 'object')
                                        ? { broke: !!lg.evt.broke, rich: !!lg.evt.rich }
                                        : { broke: false, rich: false }
                                };
                                _clampPurse(entry.ledger);
                            } else {
                                delete entry.ledger;   // 空账/坏账 → 账不在册
                            }
                        }
                        NPC_LIFE_STORE[k] = entry;
                    });
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
        // v27.13：破产/发迹故事的月度限频计数随档走——旧档无此键 → importAll 不回调，模块默认 {0,0} 自然起步（零迁移）
        global.StateRegistry.register('npcLifeStories', {
            version: 1,
            export: function () { return { monthKey: STORY_METER.monthKey, count: STORY_METER.count }; },
            import: function (data) {
                if (data && typeof data === 'object') {
                    STORY_METER.monthKey = Number(data.monthKey) || 0;
                    STORY_METER.count = Math.max(0, Number(data.count) || 0);
                }
            },
            reset: function () { STORY_METER.monthKey = 0; STORY_METER.count = 0; }
        });
    }

    console.log('[NPCLife] initialized v' + VERSION);
})(typeof window !== 'undefined' ? window : this);
