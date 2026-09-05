/**
 * personality-driver.js — v20.5 P16 性格驱动层
 *
 * 目的：让 npc.personality16 从「只用于展示」变成「驱动行为」的输入。
 *   - actionWeights(npc)   NPC 每日行动权重（心境/战术/身份维度调权）
 *   - socialBias(npc)      NPC 社交结果的善意倾向（本性 F/T + 身份 A/T）
 *   - compat(a, b)         两 NPC 的五维相性 [-100,100]（调解/结伴/传闻采信复用）
 *   - distortRumor(npc, rumor, opts)  传闻经 NPC 转述时按性格失真；无强倾向返回 null
 *
 * 设计宪法（强制规则.md）：
 *   - 查询函数全部纯：只读 personality16，无配额计数器
 *   - 不新建平行真源：传闻本体仍在 npc-life-actor 的 RUMOR_LOG，本层只产"失真变体"对象
 *   - rng 可注入（opts.randomSource）供回归测试复现
 *   - 例外：driftPersonality 是唯一带副作用的函数（v20.6 性格可被事件改变），
 *     但只写既有 npc.personality16 字段、带事由文案，且是全局唯一合法的性格改动入口
 *
 * 加载顺序：紧跟 personality16.js 之后；运行时依赖 Personality16.ensure。
 */
(function (global) {
    'use strict';

    var VERSION = 1;
    var DIMS = ['mind', 'energy', 'nature', 'tactics', 'identity'];
    var COMPAT_W = { mind: 0.20, energy: 0.20, nature: 0.30, tactics: 0.15, identity: 0.15 };

    function num(v) { return typeof v === 'number' && isFinite(v) ? v : 0; }
    function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

    // 取五维：优先已挂载字段，缺时走 Personality16.ensure（其内部从 Big5/手稿推导并落字段）
    function p16(npc) {
        if (!npc) return null;
        if (npc.personality16) return npc.personality16;
        if (global.Personality16 && typeof global.Personality16.ensure === 'function') {
            try { return global.Personality16.ensure(npc); } catch (e) { return null; }
        }
        return null;
    }

    // ============ 每日行动权重 ============
    // 基线 [move .20, social .30, cultivate .30, rest .20]
    //   E(外向)多社交、I(内向)多修炼；P(感知)多动、J(判断)多定课修炼；T(起伏)多静养
    function actionWeights(npc) {
        var p = p16(npc);
        if (!p) return [0.20, 0.30, 0.30, 0.20];
        var mind = num(p.mind), tactics = num(p.tactics), identity = num(p.identity);
        var move = 0.20 + tactics * 0.0007;
        var social = 0.30 + mind * 0.0012;
        var cultivate = 0.30 - mind * 0.0007 - tactics * 0.0005;
        var rest = 0.20 - mind * 0.0004 + identity * 0.0005;
        return [clamp(move, 0.05, 0.60), clamp(social, 0.05, 0.60), clamp(cultivate, 0.05, 0.60), clamp(rest, 0.05, 0.60)];
    }

    // ============ 社交善意倾向 ∈ [-1,1] ============
    // F(情感)偏结善缘，T(思考)偏公事公办起摩擦；A(果断)稳，T(起伏)忽冷忽热
    function socialBias(npc) {
        var p = p16(npc);
        if (!p) return 0;
        return clamp(num(p.nature) * 0.006 + (-num(p.identity)) * 0.004, -1, 1);
    }

    // ============ 五维相性 ============
    function compat(a, b) {
        var pa = p16(a), pb = p16(b);
        if (!pa || !pb) return 0;
        var total = 0;
        for (var i = 0; i < DIMS.length; i++) {
            var d = DIMS[i];
            total += COMPAT_W[d] * (1 - Math.abs(num(pa[d]) - num(pb[d])) / 200);
        }
        var score = (total - 0.5) * 200;
        // 双强对立碰撞：双方都鲜明且方向相反 → 额外摩擦
        var clash = [['nature', 12], ['tactics', 12], ['identity', 8]];
        for (var c = 0; c < clash.length; c++) {
            var dim = clash[c][0], pen = clash[c][1];
            var va = num(pa[dim]), vb = num(pb[dim]);
            if (Math.abs(va) >= 60 && Math.abs(vb) >= 60 && va * vb < 0) score -= pen;
        }
        return Math.round(clamp(score, -100, 100));
    }

    // ============ 传闻失真 ============
    // 极性词：mind E+/I-；energy S+/N-；nature F+/T-；tactics P+/J-；identity T+/A-
    var GLOSS = {
        mind: {
            E: ['此事传得沸沸扬扬，添了几分热闹', '街头巷尾人人在嘴里又滚了一圈'],
            I: ['我也是偶听人一嘴，未必是真', '传得不广，只在几人之间流转']
        },
        energy: {
            N: ['听说是表面话，底下另有隐情', '众人私下揣摩，话里还有半截没说'],
            S: ['讲的人有鼻子有眼，细节分毫不差', '添了亲眼所见的口吻，言之凿凿']
        },
        nature: {
            T: ['听者冷冷评了一句：咎由自取', '旁人只道：不合规矩'],
            F: ['说的人叹了一声，听的人皆唏嘘', '讲到动情处，四座默然']
        },
        tactics: {
            J: ['坊间已下了断语：迟早应有分晓', '众人已然断言，只等应验'],
            P: ['后续如何暂无定论，说的人自己也讲不完', '话说半截，剩下的听客自补']
        },
        identity: {
            A: ['传言过手几道，倒没走样', '说的人语气平静，照原样复述'],
            T: ['传话的人自己先激动起来，声调都变了', '说到紧要处拍案，后头越讲越玄']
        }
    };
    var GLOSS_STYLE = {
        'mind_E': '渲染', 'mind_I': '淡化', 'energy_N': '揣摩', 'energy_S': '凿实',
        'nature_T': '苛评', 'nature_F': '共情', 'tactics_J': '断语', 'tactics_P': '存疑',
        'identity_A': '平述', 'identity_T': '惊传'
    };
    // 各维正值对应的极性字母键
    var POLE_POS = { mind: 'E', energy: 'S', nature: 'F', tactics: 'P', identity: 'T' };
    var POLE_NEG = { mind: 'I', energy: 'N', nature: 'T', tactics: 'J', identity: 'A' };

    function glossFor(dim, v, rng) {
        var pole = v >= 0 ? POLE_POS[dim] : POLE_NEG[dim];
        var pool = GLOSS[dim][pole];
        return {
            text: pool[Math.floor(rng() * pool.length) % pool.length],
            style: GLOSS_STYLE[dim + '_' + pole]
        };
    }

    /**
     * 传闻经 npc 转述产生失真变体。
     * @returns {Object|null} 变体对象（无 id，由调用方补）；性格无鲜明倾向(所有|v|<40)返回 null
     */
    function distortRumor(npc, rumor, opts) {
        if (!npc || !rumor || !rumor.summary) return null;
        var p = p16(npc);
        if (!p) return null;
        opts = opts || {};
        var rng = typeof opts.randomSource === 'function' ? opts.randomSource : Math.random;
        // 找最强两维
        var best = null, bestAbs = 0, second = null, secondAbs = 0;
        for (var i = 0; i < DIMS.length; i++) {
            var d = DIMS[i], v = num(p[d]), a = Math.abs(v);
            if (a > bestAbs) { second = best; secondAbs = bestAbs; best = { dim: d, v: v }; bestAbs = a; }
            else if (a > secondAbs) { second = { dim: d, v: v }; secondAbs = a; }
        }
        if (bestAbs < 40) return null; // 中间性格：照原样传，不走形
        var g1 = glossFor(best.dim, best.v, rng);
        var summary = rumor.summary + '。' + g1.text;
        var style = g1.style;
        if (second && secondAbs >= 60) {
            var g2 = glossFor(second.dim, second.v, rng);
            summary += g2.text;
            style += '·' + g2.style;
        }
        return {
            variantOf: rumor.id || null,
            day: opts.day || rumor.day || 0,
            npcId: npc.id,
            npcName: npc.name || npc.id,
            type: rumor.type || 'social',
            result: rumor.result || 'success',
            location: opts.location || npc.location || null,
            summary: summary,
            distorted: true,
            glossStyle: style,
            mood: rumor.mood || 'neutral' // v20.6：传闻的善恶定性随转述走，走形不改立场
        };
    }

    // ============ v20.6 性格漂移（唯一合法的性格写入口） ============
    // 重大事件让五维小幅移动：钳位 [-90,90] 留头寸，事由写进日志（宪法：约束/变化须有名有据）
    var DRIFT_LABEL = { mind: '心境', energy: '待人方式', nature: '本性', tactics: '行事作风', identity: '心性' };
    /**
     * @returns {boolean} 是否发生了实际变化
     */
    function driftPersonality(npc, dim, delta, reason) {
        var p = p16(npc);
        if (!p || DIMS.indexOf(dim) < 0) return false;
        var old = num(p[dim]);
        var next = clamp(old + delta, -90, 90);
        if (next === old) return false;
        p[dim] = next;
        if (global.gameLog && global.gameLog.add) {
            var word = next > old
                ? (Math.abs(next) >= 60 ? '明显' : '暗暗') + '偏向「' + (next >= 0 ? poleWord(dim, true) : poleWord(dim, false)) + '」'
                : (Math.abs(next) >= 60 ? '明显' : '暗暗') + '转向「' + (next >= 0 ? poleWord(dim, true) : poleWord(dim, false)) + '」';
            global.gameLog.add('「' + (npc.name || npc.id) + '」的' + (DRIFT_LABEL[dim] || dim) + word + (reason ? '——' + reason : ''), 'info');
        }
        return true;
    }
    // 极性的中文短名（供漂移日志）
    var POLE_WORD = {
        mind: ['内向', '外向'], energy: ['凭感觉揣度', '眼见为实'], nature: ['冷静算计', '重情重义'],
        tactics: ['有条理有定课', '随性随心'], identity: ['沉稳果断', '多思起伏']
    };
    function poleWord(dim, positive) {
        var pair = POLE_WORD[dim];
        return pair ? pair[positive ? 1 : 0] : dim;
    }

    var api = {
        version: VERSION,
        compat: compat,
        actionWeights: actionWeights,
        socialBias: socialBias,
        distortRumor: distortRumor,
        driftPersonality: driftPersonality
    };
    global.driftPersonality = driftPersonality; // npc-system 面板与事件方共用入口

    global.P16Driver = api;
    global.XianXia = global.XianXia || {};
    global.XianXia.P16Driver = api;

    console.log('[P16Driver] initialized v' + VERSION);
})(typeof window !== 'undefined' ? window : this);
