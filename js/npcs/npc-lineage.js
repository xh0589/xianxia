/**
 * npc-lineage.js — v19.3 P0-6：NPC 婚姻 / 后代 / 衣钵
 *
 * 目的（v18.8 路线图 §5 P0-6 验收）：
 *   推进 50~100 游戏年后，世界人口结构不会只减不增；重要关系能跨代留下痕迹。
 *
 * 设计宪法（强制规则.md）：
 *   - 单一真源：npc.lineage（写已有字段）+ LINEAGE_INDEX（新建倒排）
 *   - StateRegistry 'npcLineageIndex' v1 持久化
 *   - 不引入"日限 N 次"：结契是事件、后代是年概率、衣钵是死亡触发
 *   - 玩家寿终/轮回**显式选择**"转世本人 / 以传人继续"（不擅自决定）
 *
 * 加载顺序：第 6 层，在 npc-life-actor.js 之后。
 */
(function (global) {
    'use strict';

    var VERSION = 1;

    // 倒排索引（持久化），加速"谁是某人的孩子/徒弟"
    var LINEAGE_INDEX = {
        // byParent: { parentNpcId: [childId, ...] }
        byParent: {},
        // byMaster: { masterNpcId: [studentId, ...] }
        byMaster: {}
    };

    // 工具
    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, Number(v) || 0)); }

    // v20.10 灵根饼图归一：全游戏唯一口径——五行是一张饼（总和恒 100，单行 0~100），
    // 与创角滑块、功法兼容判断、修炼倍率(0.8+val/200)同一单位。
    // 旧版 NPC 侧自搞"单行强度+总和≤200削峰"（等比缩放取整偶发 201 红叉），已并入饼图。
    // 最大余数法分配整数份额：无取整漂移，任何输入都精确落到 100，且对已是饼图的输入幂等。
    var ROOT_KEYS = ['metal', 'wood', 'water', 'fire', 'earth'];
    function pieRoots(roots) {
        var vals = ROOT_KEYS.map(function (k) { return Math.max(0, Number(roots && roots[k]) || 0); });
        var sum = vals.reduce(function (a, b) { return a + b; }, 0);
        var out = {};
        if (sum <= 0) { ROOT_KEYS.forEach(function (k) { out[k] = 20; }); return out; } // 无数据饼：五行均衡
        var exact = vals.map(function (v) { return v / sum * 100; });
        var fl = exact.map(function (v) { return Math.floor(v); });
        var rem = 100 - fl.reduce(function (a, b) { return a + b; }, 0);
        var order = exact.map(function (v, i) { return { i: i, frac: v - fl[i] }; })
            .sort(function (a, b) { return b.frac - a.frac || a.i - b.i; });
        for (var t = 0; t < rem; t++) fl[order[t % ROOT_KEYS.length].i]++;
        ROOT_KEYS.forEach(function (k, j) { out[k] = fl[j]; }); // sum=100 非负 → 单行天然 ≤100
        return out;
    }
    // 自愈入口：把任意存量 NPC 的灵根（旧强度口径）就地修成饼图；已是饼图则原样不动
    function normalizeRootPie(npc) {
        if (!npc) return null;
        var sum = ROOT_KEYS.reduce(function (a, k) { return a + (Number(npc.spiritualRoots && npc.spiritualRoots[k]) || 0); }, 0);
        if (npc.spiritualRoots && sum === 100) return npc.spiritualRoots;
        npc.spiritualRoots = pieRoots(npc.spiritualRoots);
        return npc.spiritualRoots;
    }
    function pickOne(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function genId(prefix) {
        return (prefix || 'n') + '_' + Date.now() + '_' + Math.floor(Math.random() * 1e6);
    }

    // ============ 真源：npc.lineage（写到已有字段）============
    function ensureLineage(npc) {
        if (!npc) return null;
        if (!npc.lineage || typeof npc.lineage !== 'object') {
            npc.lineage = { parents: [], children: [], master: null, inheritor: null, daoCompanion: null, birthDay: 0, isFounder: false };
        }
        if (!Array.isArray(npc.lineage.parents)) npc.lineage.parents = [];
        if (!Array.isArray(npc.lineage.children)) npc.lineage.children = [];
        return npc.lineage;
    }

    function getNpc(id) {
        if (!id) return null;
        if (global.npcManager && typeof global.npcManager.getNPC === 'function') {
            return global.npcManager.getNPC(id);
        }
        if (global.npcManager && typeof global.npcManager.getAllNPCs === 'function') {
            var all = global.npcManager.getAllNPCs();
            return all.find(function (n) { return n.id === id; }) || null;
        }
        return null;
    }

    function getCurrentDay() {
        return (global.getAbsoluteDay && global.getAbsoluteDay()) || 1;
    }

    // ============ 工具：近亲检查 ============
    /**
     * 检查 a 与 b 是否近亲（4 代以内不结契）
     * @returns {boolean} true=是近亲
     */
    function isAncestorOf(ancestorId, descendantId, maxGen) {
        maxGen = maxGen || 4;
        var d = getNpc(descendantId);
        if (!d || !d.lineage || !Array.isArray(d.lineage.parents)) return false;
        for (var i = 0; i < maxGen; i++) {
            var parents = d.lineage.parents;
            if (!parents || !parents.length) return false;
            if (parents.indexOf(ancestorId) >= 0) return true;
            // 上一代
            var pNext = getNpc(parents[0]);
            if (!pNext) return false;
            d = pNext;
        }
        return false;
    }

    function areCloseRelatives(id1, id2) {
        if (id1 === id2) return true;
        return isAncestorOf(id1, id2, 4) || isAncestorOf(id2, id1, 4);
    }

    // ============ marry（道侣结契）============
    /**
     * @param {string} aId
     * @param {string} bId
     * @returns {Object} {ok, reason?, aId, bId, day}
     */
    function marry(aId, bId) {
        if (!aId || !bId || aId === bId) return { ok: false, reason: 'invalid-ids' };
        var a = getNpc(aId); var b = getNpc(bId);
        if (!a || !b) return { ok: false, reason: 'npc-missing' };
        // 前置 1：单身
        var la = ensureLineage(a); var lb = ensureLineage(b);
        if (la.daoCompanion && la.daoCompanion !== bId) return { ok: false, reason: 'a-not-single' };
        if (lb.daoCompanion && lb.daoCompanion !== aId) return { ok: false, reason: 'b-not-single' };
        // 前置 2：好感≥80（v20.24 修字段误读：真源在 relationship.affection，此前裸字段恒 0、婚配永远跑不动）
        var affA = (a.relationship && isFinite(Number(a.relationship.affection))) ? (Number(a.relationship.affection) || 0) : (Number(a.affection) || 0);
        var affB = (b.relationship && isFinite(Number(b.relationship.affection))) ? (Number(b.relationship.affection) || 0) : (Number(b.affection) || 0);
        if (affA < 80 || affB < 80) return { ok: false, reason: 'affection-low', affA: affA, affB: affB };
        // 前置 3：同宗门（宽松：同 location）
        if (a.location && b.location && a.location !== b.location) {
            return { ok: false, reason: 'different-location' };
        }
        // 前置 4：不近亲
        if (areCloseRelatives(aId, bId)) return { ok: false, reason: 'close-relatives' };
        // 成功
        la.daoCompanion = bId; lb.daoCompanion = aId;
        if (typeof a.setFlag === 'function') a.setFlag('dao_companion');
        if (typeof b.setFlag === 'function') b.setFlag('dao_companion');
        if (global.EventBus && typeof global.EventBus.emit === 'function') {
            try { global.EventBus.emit('npc:lineage:married', { aId: aId, bId: bId, day: getCurrentDay() }); } catch (e) {}
        }
        if (global.showMessage) global.showMessage('💕 ' + (a.name || aId) + ' 与 ' + (b.name || bId) + ' 结为道侣！', 'success');
        return { ok: true, aId: aId, bId: bId, day: getCurrentDay() };
    }

    // ============ haveChild（后代生成）============
    /**
     * @returns {Object|null} 新 NPC 对象（已入 npcManager）或 null
     */
    function haveChild(fatherId, motherId) {
        var father = getNpc(fatherId); var mother = getNpc(motherId);
        if (!father || !mother) return null;
        // 前置：必须是道侣
        var lf = ensureLineage(father); var lm = ensureLineage(mother);
        if (lf.daoCompanion !== motherId || lm.daoCompanion !== fatherId) return null;
        // 不近亲（自动满足：道侣已校验过）

        // 1) 灵根继承（v20.10 饼图口径）：父母先各自归一成饼，
        //    每行 50/50 选父/母的份额 ±20 扰动，掷完再整体归饼（总和精确 100，无取整漂移）
        var fRoots = pieRoots(father.spiritualRoots || guessRoots(father));
        var mRoots = pieRoots(mother.spiritualRoots || guessRoots(mother));
        var rawRoots = { metal: 0, wood: 0, water: 0, fire: 0, earth: 0 };
        var ELEMENTS = ['metal', 'wood', 'water', 'fire', 'earth'];
        for (var i = 0; i < ELEMENTS.length; i++) {
            var k = ELEMENTS[i];
            var fv = Number(fRoots[k]) || 0;
            var mv = Number(mRoots[k]) || 0;
            // 50/50 选 + 扰动
            var base = Math.random() < 0.5 ? fv : mv;
            var noise = (Math.random() - 0.5) * 40; // ±20
            rawRoots[k] = Math.max(0, Math.round(base + noise));
        }
        var childRoots = pieRoots(rawRoots);
        // 2) 变异灵根：30% 概率遗传
        var fMut = father.mutatedRoots || {};
        var mMut = mother.mutatedRoots || {};
        var childMut = { thunder: false, wind: false, ice: false };
        if (Math.random() < 0.3 && fMut.thunder) childMut.thunder = true;
        if (Math.random() < 0.3 && fMut.wind) childMut.wind = true;
        if (Math.random() < 0.3 && mMut.ice) childMut.ice = true;

        // 3) 性格继承：父母 50/50 ±10
        var p16 = (global.XianXia && global.XianXia.personality16) || null;
        var pFields = ['mind', 'energy', 'nature', 'tactics', 'identity'];
        var childP16 = {};
        for (var pi = 0; pi < pFields.length; pi++) {
            var fk = pFields[pi];
            var fp = (father.personality16 && Number(father.personality16[fk])) || 0;
            var mp = (mother.personality16 && Number(mother.personality16[fk])) || 0;
            var base2 = Math.random() < 0.5 ? fp : mp;
            childP16[fk] = clamp(base2 + (Math.random() - 0.5) * 20, -100, 100);
        }

        // 4) 命名
        var name = '子' + Math.floor(Math.random() * 9000 + 1000);
        // 如果有命名器
        try {
            if (global.XianXia && global.XianXia.nameGenerator && typeof global.XianXia.nameGenerator.generateName === 'function') {
                var ctx2 = { gender: Math.random() < 0.5 ? 'male' : 'female' };
                var gen = global.XianXia.nameGenerator.generateName(ctx2);
                if (gen && gen.fullName) name = gen.fullName;
            }
        } catch (e) {}

        // 5) 构造新 NPC
        var newNpc = {
            id: genId('child'),
            name: name,
            gender: Math.random() < 0.5 ? 'male' : 'female',
            age: 18,
            location: (father.location || mother.location || '帝都'),
            spiritualRoots: childRoots,
            mutatedRoots: childMut,
            personality16: childP16,
            combat: { realm: '炼气', layer: 1, attack: 10, defense: 10, health: 100, speed: 10 },
            affection: 0,
            appearance: '眉眼间隐约有父母之影',
            personality: '年少',
            occupation: '散修',
            isPlayer: false,
            lineage: {
                parents: [fatherId, motherId],
                children: [],
                master: null,
                inheritor: null,
                daoCompanion: null,
                birthDay: getCurrentDay(),
                isFounder: false
            }
        };
        // 6) 入 npcManager
        if (global.npcManager && typeof global.npcManager.addNPC === 'function') {
            global.npcManager.addNPC(newNpc);
        } else if (global.npcManager && Array.isArray(global.npcManager.npcs)) {
            global.npcManager.npcs.push(newNpc);
        } else if (global.npcManager && typeof global.npcManager.getAllNPCs === 'function') {
            // 兜底：mock 环境，注入到 getAllNPCs 返回数组
            if (!global.npcManager._injectList) global.npcManager._injectList = [];
            global.npcManager._injectList.push(newNpc);
        }

        // 7) 双方 lineage.children
        lf.children.push(newNpc.id);
        lm.children.push(newNpc.id);

        // 8) 倒排索引
        LINEAGE_INDEX.byParent[fatherId] = LINEAGE_INDEX.byParent[fatherId] || [];
        LINEAGE_INDEX.byParent[fatherId].push(newNpc.id);
        LINEAGE_INDEX.byParent[motherId] = LINEAGE_INDEX.byParent[motherId] || [];
        LINEAGE_INDEX.byParent[motherId].push(newNpc.id);

        if (global.EventBus && typeof global.EventBus.emit === 'function') {
            try { global.EventBus.emit('npc:lineage:childBorn', { fatherId: fatherId, motherId: motherId, childId: newNpc.id, childName: name, day: getCurrentDay() }); } catch (e) {}
        }
        if (global.showMessage) global.showMessage('🎉 ' + (father.name || fatherId) + ' 与 ' + (mother.name || motherId) + ' 喜得 ' + name, 'success');
        return newNpc;
    }

    /**
     * 没灵根数据时按 realm 猜 5 行
     */
    // v20.10 饼图口径：估算出的五行份额总和恒为 100（旧版金丹估算总和 260，
    // 与玩家占比口径、"总和≤200"削峰互相矛盾）。境界越高，主根越纯、杂根越薄。
    function guessRoots(npc) {
        var realm = (npc.combat && npc.combat.realm) || '炼气';
        var level = {
            '炼气': [40, 25, 15, 12, 8],   // 杂而不纯
            '筑基': [45, 28, 14, 8, 5],    // 主根渐显
            '金丹': [50, 25, 12, 8, 5]     // 主根独旺
        }[realm] || [30, 25, 20, 15, 10];
        return { metal: level[0], wood: level[1], water: level[2], fire: level[3], earth: level[4] };
    }

    // ============ inheritOnDeath（衣钵）============
    /**
     * 师父死亡 → 选最优亲传继承 1 项技能
     * 优先级：指定 inheritor > contribution 最高 > 最早入师门
     * @returns {Object|null} {masterId, inheritorId, artId|null}
     */
    function inheritOnDeath(deadNpcId) {
        var dead = getNpc(deadNpcId);
        if (!dead) return null;
        var ldead = ensureLineage(dead);
        var students = (LINEAGE_INDEX.byMaster[deadNpcId] || []).slice();
        if (!students.length) return null;
        // 选继承人
        var inheritor = null;
        if (ldead.inheritor && students.indexOf(ldead.inheritor) >= 0) {
            inheritor = ldead.inheritor;
        } else {
            // contribution 最高
            var best = -Infinity;
            for (var i = 0; i < students.length; i++) {
                var s = getNpc(students[i]);
                if (!s) continue;
                var c = Number(s.contribution) || 0;
                if (c > best) { best = c; inheritor = s.id; }
            }
        }
        if (!inheritor) inheritor = students[0];

        // 选 1 项功法（死的 combat.skills 第一项）
        var artId = null;
        if (dead.combat && Array.isArray(dead.combat.skills) && dead.combat.skills.length) {
            artId = dead.combat.skills[0];
        }
        // 写入继承人
        var inheritorNpc = getNpc(inheritor);
        if (inheritorNpc) {
            if (!inheritorNpc.combat) inheritorNpc.combat = {};
            if (!Array.isArray(inheritorNpc.combat.skills)) inheritorNpc.combat.skills = [];
            if (artId && inheritorNpc.combat.skills.indexOf(artId) < 0) {
                inheritorNpc.combat.skills.push(artId);
            }
            // 写 inheritor 字段
            ldead.inheritor = inheritor;
            // 写入继承人 lineage.inheritor 是错的，那是死者的；继承人自己加个标志
        }
        if (global.EventBus && typeof global.EventBus.emit === 'function') {
            try { global.EventBus.emit('npc:lineage:inheritance', { masterId: deadNpcId, inheritorId: inheritor, artId: artId, day: getCurrentDay() }); } catch (e) {}
        }
        if (global.showMessage) {
            var masterName = dead.name || deadNpcId;
            var inheritorName = (inheritorNpc && inheritorNpc.name) || inheritor;
            global.showMessage('📜 ' + masterName + ' 衣钵传于 ' + inheritorName + (artId ? '（含：' + artId + '）' : ''), 'info');
        }
        return { masterId: deadNpcId, inheritorId: inheritor, artId: artId };
    }

    // ============ successionOnDeath（掌门继任）============
    /**
     * 掌门死 → 选 sect 内最优弟子升为掌门
     * 优先级：玩家（如果在该 sect）> 长老 > 任意亲传 > 关闭
     */
    function successionOnDeath(deadNpcId, sectId) {
        if (!sectId) return null;
        var sectNpcs = [];
        if (global.npcManager && typeof global.npcManager.getAllNPCs === 'function') {
            sectNpcs = global.npcManager.getAllNPCs().filter(function (n) { return n && n.location === sectId && !n.isDead; });
        }
        if (!sectNpcs.length) return null;
        // 1) 玩家优先
        var player = global.currentCharData;
        if (player && global.discipleState && global.discipleState.sectId === sectId && !global.discipleState.isInSect === false) {
            // 玩家在该 sect（即使没显式说）
        }
        // 简化：玩家升职逻辑由 sect-internal 处理；这里只选 NPC
        // 2) 选 contribution 最高 + 掌门级候选
        var best = null;
        var bestScore = -Infinity;
        for (var i = 0; i < sectNpcs.length; i++) {
            var n = sectNpcs[i];
            if (!n) continue;
            // 不能是自己
            if (n.id === deadNpcId) continue;
            // 不应是死者（isDead）
            if (n.isDead) continue;
            var score = (Number(n.contribution) || 0) * 2 + (Number(n.age) || 30);
            if (score > bestScore) { bestScore = score; best = n; }
        }
        if (!best) return null;
        // 升职
        best.rank = 0;
        best.rankName = '掌门';
        if (global.discipleState && global.discipleState.sectId === sectId && global.discipleState.rank === 0 && global.currentCharData) {
            // 玩家已是掌门 → 不让 NPC 抢
            return null;
        }
        if (global.EventBus && typeof global.EventBus.emit === 'function') {
            try { global.EventBus.emit('npc:lineage:succession', { sectId: sectId, fromId: deadNpcId, toId: best.id, day: getCurrentDay() }); } catch (e) {}
        }
        if (global.showMessage) {
            global.showMessage('👑 ' + sectId + ' 掌门继位：' + (best.name || best.id) + ' 接任', 'info');
        }
        return { sectId: sectId, fromId: deadNpcId, toId: best.id };
    }

    // ============ 关系查询 ============
    function getAncestors(npcId, depth) {
        depth = depth || 3;
        var out = [];
        var cur = getNpc(npcId);
        if (!cur) return out;
        for (var i = 0; i < depth; i++) {
            var l = ensureLineage(cur);
            if (!l || !l.parents || !l.parents.length) break;
            cur = getNpc(l.parents[0]);
            if (cur) out.push({ gen: i + 1, id: cur.id, name: cur.name || cur.id });
        }
        return out;
    }

    function getDescendants(npcId, depth) {
        depth = depth || 3;
        var out = [];
        var visited = {};
        function walk(id, gen) {
            if (gen > depth || visited[id]) return;
            visited[id] = true;
            var kids = LINEAGE_INDEX.byParent[id] || [];
            for (var i = 0; i < kids.length; i++) {
                var n = getNpc(kids[i]);
                if (n) {
                    out.push({ gen: gen, id: n.id, name: n.name || n.id });
                    walk(n.id, gen + 1);
                }
            }
        }
        walk(npcId, 1);
        return out;
    }

    // ============ 玩家侧 ============
    function recordPlayerDaoCompanion(npcId) {
        var npc = getNpc(npcId);
        if (!npc) return false;
        var l = ensureLineage(npc);
        l.daoCompanion = 'player';
        if (typeof npc.setFlag === 'function') npc.setFlag('dao_companion');
        return true;
    }

    /**
     * 玩家寿终/轮回选择
     * @param {string} choice 'reincarnate' | 'successor:childId'
     * @returns {boolean}
     */
    function choosePlayerAfterlife(choice) {
        if (typeof choice !== 'string') return false;
        var player = global.currentCharData;
        if (!player) return false;
        if (choice === 'reincarnate') {
            // 转世本人：age 重置，isFounder=true
            player.age = 18;
            player.isFounder = true;
            if (global.EventBus && typeof global.EventBus.emit === 'function') {
                try { global.EventBus.emit('npc:lineage:succession', { sectId: player.location, fromId: 'player', toId: 'player', day: getCurrentDay() }); } catch (e) {}
            }
            return true;
        }
        if (choice.indexOf('successor:') === 0) {
            var childId = choice.substring('successor:'.length);
            var child = getNpc(childId);
            if (!child) return false;
            // 以传人继续：玩家 id 改为 child
            // 简化：仅记入 lineage 字段（不改 player.id 以避免破坏存档）
            var lplayer = player.lineage || {};
            lplayer.successor = childId;
            player.lineage = lplayer;
            return true;
        }
        return false;
    }

    // ============ 每日 tick ============
    /**
     * @param {number} day
     * 推进：道侣按年概率 haveChild（每 360 天）
     */
    function tickDay(day) {
        if (!day) return;
        if (!global.npcManager || typeof global.npcManager.getAllNPCs !== 'function') return;
        // 找所有道侣
        var all = global.npcManager.getAllNPCs();
        for (var i = 0; i < all.length; i++) {
            var a = all[i]; if (!a) continue;
            var la = ensureLineage(a);
            if (!la.daoCompanion || la.daoCompanion === 'player') continue;
            // 不对自己
            var b = getNpc(la.daoCompanion);
            if (!b) continue;
            // 按年（day%360==0）抽样：5% 概率生
            if (day % 360 === 0) {
                if (Math.random() < 0.05) {
                    haveChild(a.id, b.id);
                }
            }
        }
    }

    // ============ 公开 API ============
    var api = {
        version: VERSION,
        marry: marry,
        haveChild: haveChild,
        inheritOnDeath: inheritOnDeath,
        successionOnDeath: successionOnDeath,
        getAncestors: getAncestors,
        getDescendants: getDescendants,
        recordPlayerDaoCompanion: recordPlayerDaoCompanion,
        choosePlayerAfterlife: choosePlayerAfterlife,
        tickDay: tickDay,
        isAncestorOf: isAncestorOf,
        areCloseRelatives: areCloseRelatives,
        // 内部
        _index: function () { return LINEAGE_INDEX; },
        _pieRoots: pieRoots,
        _guessRoots: guessRoots,
        normalizeRootPie: normalizeRootPie,
        // UI
        showLineagePanel: showLineagePanel,
        renderLineagePanel: renderLineagePanel
    };

    function renderLineagePanel(npcId) {
        if (!npcId) return '';
        var npc = getNpc(npcId);
        if (!npc) return '<p class="text-gray-500">NPC 不存在</p>';
        var html = '<div class="space-y-2">';
        html += '<h3 class="text-pink-400 font-bold">🌳 ' + (npc.name || npcId) + '·族谱</h3>';
        // 父母
        var ancs = getAncestors(npcId, 3);
        if (ancs.length) {
            html += '<p class="text-sm text-gray-300">📜 祖辈：</p><ul class="text-xs ml-4">';
            for (var i = 0; i < ancs.length; i++) html += '<li>第 ' + ancs[i].gen + ' 代：' + ancs[i].name + '</li>';
            html += '</ul>';
        }
        // 道侣
        var ln = ensureLineage(npc);
        if (ln.daoCompanion) {
            var partner = getNpc(ln.daoCompanion);
            html += '<p class="text-sm text-pink-300">💕 道侣：' + ((partner && partner.name) || ln.daoCompanion) + '</p>';
        }
        // 后代
        var descs = getDescendants(npcId, 2);
        if (descs.length) {
            html += '<p class="text-sm text-cyan-300">👶 后代：</p><ul class="text-xs ml-4">';
            for (var j = 0; j < descs.length && j < 10; j++) {
                var dNpc = getNpc(descs[j].id);
                var dRoots = dNpc && dNpc.spiritualRoots ? pieRoots(dNpc.spiritualRoots) : null;
                var dMain = '', dMainV = -1;
                if (dRoots) ROOT_KEYS.forEach(function (k) { if (dRoots[k] > dMainV) { dMainV = dRoots[k]; dMain = k; } });
                var ROOT_CN = { metal: '金', wood: '木', water: '水', fire: '火', earth: '土' };
                html += '<li>第 ' + descs[j].gen + ' 代：' + descs[j].name
                    + (dMain ? '　<span class="text-[10px] text-gray-500">主根' + ROOT_CN[dMain] + ' ' + dRoots[dMain] + '%</span>' : '') + '</li>';
            }
            html += '</ul>';
        }
        // 师父
        if (ln.master) {
            var m = getNpc(ln.master);
            html += '<p class="text-sm text-amber-300">🎓 师父：' + ((m && m.name) || ln.master) + '</p>';
        }
        // 衣钵
        if (ln.inheritor) {
            var ih = getNpc(ln.inheritor);
            html += '<p class="text-sm text-emerald-300">📜 衣钵传于：' + ((ih && ih.name) || ln.inheritor) + '</p>';
        }
        html += '</div>';
        return html;
    }

    function showLineagePanel(npcId) {
        var html = renderLineagePanel(npcId);
        if (typeof global.showModal === 'function') global.showModal('族谱', html);
        else if (global.showMessage) global.showMessage('showModal 未就绪', 'warning');
    }

    global.NpcLineage = api;
    global.XianXia = global.XianXia || {};
    global.XianXia.NpcLineage = api;

    // StateRegistry 持久化
    if (global.StateRegistry && typeof global.StateRegistry.register === 'function') {
        global.StateRegistry.register('npcLineageIndex', {
            version: VERSION,
            export: function () { return LINEAGE_INDEX; },
            import: function (data) {
                LINEAGE_INDEX.byParent = (data && data.byParent) || {};
                LINEAGE_INDEX.byMaster = (data && data.byMaster) || {};
                // v20.10 读档自愈：旧档后代灵根是"总和≤200 强度"口径，就地归饼（幂等，已是饼则不动）
                try {
                    for (var pid in LINEAGE_INDEX.byParent) {
                        (LINEAGE_INDEX.byParent[pid] || []).forEach(function (cid) {
                            var n = getNpc(cid);
                            if (n && n.spiritualRoots) normalizeRootPie(n);
                        });
                    }
                } catch (e) {}
            },
            reset: function () { LINEAGE_INDEX.byParent = {}; LINEAGE_INDEX.byMaster = {}; }
        });
    }

    console.log('[NpcLineage] initialized v' + VERSION);
})(typeof window !== 'undefined' ? window : this);
