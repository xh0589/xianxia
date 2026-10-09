// ==================== confession-rites.js - v26.2 表白/定情场景层 ====================
// 依赖：npcs/npc-system.js（NPC 类、executeEmotionInteraction、BOND_DAO_FINAL_CHAPTER 名册）
// 加载顺序：在 npc-system.js 之后（名册与好感账都要它先挂上）
//
// 为什么要这一层：
//   本体原有的「倾诉心意」（npc-system.js case 'confess'）是一行文案——好感到 60 就 +5/+8，
//   连分支都没有；而 36 位名册角色（npc-system.js:3128 BOND_DAO_FINAL_CHAPTER）另有终章定局。
//   也就是说：名册外的散修/城民（34 位具名城民 + 初始 NPC + 通用 NPC）走的是「一点按钮即定情」，
//   门派伦常、师徒名分、道侣一盟之限，一条都没有。这一层把那一步补成一场有幕有枝的仪，
//   结局由本体真实关系账判定——不是选项顺序，也不是骰子。
//
// 分寸（仙侠）：
//   玩家全程不说「喜欢」「爱」。话只用名分、盟、信物、同行、门规、禀明师门这些词。
//   伦常不是装饰选项：师徒不可越、一盟不可二结，都是能当场把话按住的现实阻力。
(function (global) {
    'use strict';

    // ============ 门槛：不自造口径，全部挂在本体已在用的数上 ============
    // MIN_AFFECTION 同 npc-system.js:132 EMOTION_TYPES.confess.minAffection 与 :3215 的判定
    var GATE = {
        MIN_AFFECTION: 60,     // 不到这道门根本不进本层（交还原实现处理）
        PLEDGE_AFFECTION: 70,  // 同 :133 intimate 档——盟约比牵手更重，故取同门不放宽
        PLEDGE_TRUST: 40,      // 同 :104 DEEP_TALK_CATEGORIES「过往经历」档
        PLEDGE_RESPECT: 60,    // 同 :1206 getRelationshipStatus「追随者」档
        HATRED_CUT: 30,        // 同 :1204/:1209 恨意分界（30 以下仍是可谈之人）
        MIN_MEETS: 3           // 一面之缘不谈定情
    };

    // ============ 结局：判定条件全在 plan 里，数据源全是 NPC 真实关系账 ============
    var ENDINGS = {
        pledge: {
            id: 'pledge', name: '盟约', icon: '🕯',
            ledger: { affection: 8, love: 15, trust: 5, respect: 5 },
            bond: true
        },
        defer: {
            id: 'defer', name: '请君先立', icon: '⏳',
            ledger: { affection: 3, love: 4, trust: 8, respect: 6 },
            bond: false
        },
        taboo: {
            id: 'taboo', name: '名分之辨', icon: '📜',
            ledger: { affection: 0, trust: 6, respect: 10 },
            bond: false
        },
        parting: {
            id: 'parting', name: '各珍其道', icon: '🚶',
            ledger: { affection: -3 },
            bond: false
        }
    };

    var NUM = function (v) { var n = Number(v); return isFinite(n) ? n : 0; };

    function relOf(npc) { return (npc && npc.relationship) || {}; }
    function affOf(npc) { return NUM(relOf(npc).affection); }
    function flagOf(npc, f) {
        try { return !!(npc && typeof npc.hasFlag === 'function' ? npc.hasFlag(f) : (relOf(npc).flags && relOf(npc).flags[f])); }
        catch (e) { console.warn('[静默失败] js/npcs/confession-rites.js · flagOf：关系旗「' + f + '」没读出来，按没有算', e && e.message); return false; }
    }
    function meetsOf(npc) { return NUM(npc && npc.memory && npc.memory.meetCount); }

    function absDay() {
        try {
            if (global.timeSystem && typeof global.timeSystem.getAbsoluteDay === 'function') return NUM(global.timeSystem.getAbsoluteDay());
        } catch (e) { console.warn('[静默失败] js/npcs/confession-rites.js · absDay：日历没取到，退回 0', e && e.message); }
        try { if (global.timeSystem && global.timeSystem.gameTime) return NUM(global.timeSystem.gameTime.currentDay); }
        catch (e2) { console.warn('[静默失败] js/npcs/confession-rites.js · absDay：时辰也没取到，退回 0', e2 && e.message); }
        return 0;
    }

    // 名册：36 位道侣由各自终章定局的人。场景层一个都不接——不夺主戏，也不给平价后门。
    function finalChapterOf(npcId) {
        var reg = global.BOND_DAO_FINAL_CHAPTER;
        if (!reg || typeof reg !== 'object') return null;
        return Object.prototype.hasOwnProperty.call(reg, npcId) ? reg[npcId] : null;
    }

// 玩家身上是否已有一盟之约（名册 + 旗 两路都认）。这是「一心不可二用」的制度依据。
// 返回 {id, name}；外人在册才算障碍——若那一盟就是她本人（旗与名册脱了钩的旧档），
// 不能拿她自己的名字去回绝她，那句话说出来会不成话。
function playerBonded() {
    var cd = global.currentCharData;
    var bonds = (cd && cd.bonds) || null;
    if (bonds && typeof bonds === 'object') {
        for (var k in bonds) {
            if (!Object.prototype.hasOwnProperty.call(bonds, k)) continue;
            if (bonds[k] && bonds[k].type === 'dao_companion') return { id: k, name: bonds[k].name || k };
        }
    }
    try {
        var mgr = global.npcManager;
        var all = mgr && typeof mgr.getAllNPCs === 'function' ? (mgr.getAllNPCs() || []) : null;
        if (all) {
            for (var i = 0; i < all.length; i++) {
                if (all[i] && flagOf(all[i], 'dao_companion')) return { id: all[i].id, name: all[i].name || all[i].id };
            }
        }
    } catch (e) { console.warn('[静默失败] js/npcs/confession-rites.js · playerBonded：名册那路没核完，按未结盟算', e && e.message); }
    return null;
}

    // 她是不是你的记名弟子（师父与弟子之间行此礼，道心先亏——仙侠里的硬伦常）
    function isNamedDisciple(npc) {
        try {
            if (typeof global.getMyNamedDisciples === 'function') {
                var ids = global.getMyNamedDisciples() || [];
                for (var i = 0; i < ids.length; i++) if (ids[i] === npc.id) return true;
            }
        } catch (e) { console.warn('[静默失败] js/npcs/confession-rites.js · isNamedDisciple：记名弟子簿没读出来，按不是弟子算', e && e.message); }
        return false;
    }

    // ============ 场景图（节点 + 分支）============
    // 每幕 desc 是若干行 {who:'narrator'|'npc', text}；每个选项 lead 指向下一节点或结局。
    // d 是这一步真写进关系账的增量（走 changeXxx 正门）。
    var NODES = {
        x_lock: {
            title: '名分未定',
            desc: [
                { who: 'narrator', text: '{npc_name}听完，只是把手里的东西放回原处，没有接话。' }
            ],
            choices: [
                { id: 'leave', text: '「那便……暂且按下。」', lead: null, d: {} }
            ]
        },

        a_open: {
            title: '起 · 夜叩',
            desc: [
                { who: 'narrator', text: '夜过三更。你在{place}外站了半晌——门虚掩着，屋里那盏灯还亮。' },
                { who: 'npc', text: '「这么晚还站在风口。冷么。」' }
            ],
            choices: [
                { id: 'straight', text: '「有句话，压了许久。今日想同你说清。」', lead: 'a_confide', d: { affection: 1 } },
                { id: 'ask_way', text: '「不冷。只想听你说一句——你我的道途，可还能并行一段？」', lead: 'a_ask', d: { trust: 2, affection: 1 } },
                { id: 'haste', text: '「明日要出远门。今夜若不开口，怕来不及了。」', lead: 'a_haste', d: { trust: 3 } }
            ]
        },
        a_ask: {
            title: '承 · 问途',
            desc: [
                { who: 'npc', text: '「并行一段……你问的是路，还是问的人。」' }
            ],
            choices: [
                { id: 'road', text: '「问路。走到哪一步算一步。」', lead: 'a_confide', d: { trust: 2 } },
                { id: 'person', text: '「问人。」', lead: 'a_confide', d: { affection: 2, trust: 1 } },
                { id: 'back', text: '「……问路罢。」', lead: 'a_holdoff', d: { affection: -1 } }
            ]
        },
        a_haste: {
            title: '承 · 将行',
            desc: [
                { who: 'npc', text: '「远门要出多久。」' },
                { who: 'narrator', text: '你答不上来。她也不催，只是看着你。' }
            ],
            choices: [
                { id: 'half', text: '「半月。半月就回。」', lead: 'a_confide', d: { respect: 2 } },
                { id: 'vague', text: '「说不好。看天。」', lead: 'a_confide', d: { affection: 1, respect: 1 } }
            ]
        },
        a_confide: {
            title: '转 · 陈意',
            desc: [
                { who: 'narrator', text: '你把那句压了许久的话说了出来。不响，却把屋里的静压得更沉。' },
                { who: 'npc', text: '「你把话说到这份上，我也不装作听不懂。」' }
            ],
            choices: [
                { id: 'oath', text: '「名分我说得出。你呢。」', lead: 'a_oath', d: { affection: 2, respect: 2 } },
                { id: 'notyet', text: '「不必此刻答我。你想清楚。」', lead: 'a_holdoff', d: { trust: 3, affection: 1 } }
            ]
        },
        a_oath: {
            title: '合 · 立约',
            desc: [
                { who: 'npc', text: '「立约要立得干净。你先说：往后并肩，你走的是你的道，还是我的道。」' }
            ],
            choices: [
                { id: 'token', text: '「以此物为凭。不必盟誓——天地自有眼。」', lead: 'pledge', d: { affection: 3, respect: 2 } },
                { id: 'word', text: '「只以一句话为凭。旁人问起，你我辞一致便是。」', lead: 'pledge', d: { trust: 3, affection: 1 } },
                { id: 'yield', text: '「这一盟该由你来立。你先立，我再应。」', lead: 'pledge', d: { respect: 4, trust: 1 } }
            ]
        },
        a_holdoff: {
            title: '转 · 按下',
            desc: [
                { who: 'npc', text: '「你倒稳得住。」' },
                { who: 'narrator', text: '她替你把灯芯挑亮了些——这句话，便算是今日的结局。' }
            ],
            choices: [
                { id: 'press', text: '「再等一时。等我想清楚要什么。」', lead: 'defer', d: { trust: 2 } },
                { id: 'leave', text: '「那我先回去。」', lead: 'defer', d: { affection: -1 } }
            ]
        },

        b_open: {
            title: '起 · 未熟',
            desc: [
                { who: 'narrator', text: '你话到嘴边，又咽了回去。她看出来了。' },
                { who: 'npc', text: '「你今日说话只说半句。剩下那半句，是要留着，还是不敢。」' }
            ],
            choices: [
                { id: 'probe', text: '「你还有哪里不痛快？说与我听。」', lead: 'b_probe', d: { trust: 2 } },
                { id: 'humble', text: '「我知我眼下还担不起。这话，我先放着。」', lead: 'b_humble', d: { respect: 2, affection: 1 } }
            ]
        },
        b_probe: {
            title: '承 · 问短',
            desc: [
                { who: 'npc', text: '「……你倒不急着要一个答案。」' }
            ],
            choices: [
                { id: 'listen', text: '「我不急。你说到天亮，我便听到天亮。」', lead: 'defer', d: { trust: 3, affection: 2 } },
                { id: 'cut', text: '「时辰不早。改日再说。」', lead: 'defer', d: { affection: -1 } }
            ]
        },
        b_humble: {
            title: '承 · 自量',
            desc: [
                { who: 'npc', text: '「担不担得起，不是你说了算。」' }
            ],
            choices: [
                { id: 'wait', text: '「那我等。等到我担得起那天。」', lead: 'defer', d: { respect: 2, affection: 1 } },
                { id: 'step', text: '「你说得对。我退一步。」', lead: 'defer', d: { trust: 2, affection: -1 } }
            ]
        },

        c_open: {
            title: '起 · 名分在先',
            desc: [
                { who: 'npc', text: '{blockLine}' }
            ],
            choices: [
                { id: 'argue', text: '「名分是给外人看的。」', lead: 'c_argue', d: { affection: 2 } },
                { id: 'take', text: '「你说得对。是我孟浪。」', lead: 'taboo', d: { respect: 3 } }
            ]
        },
        c_argue: {
            title: '承 · 力争',
            desc: [
                { who: 'npc', text: '「门规是你我要一同背的。你今日破这一条，往后拿什么护我的道。」' }
            ],
            choices: [
                { id: 'press', text: '「门外的话，我不听。」', lead: 'taboo', d: { respect: 3, affection: 1 } },
                { id: 'yield', text: '「……罢了。这话我不提了。」', lead: 'taboo', d: { trust: 2 } }
            ]
        },

        p_open: {
            title: '起 · 恨未消',
            desc: [
                { who: 'npc', text: '「你来了。」' },
                { who: 'narrator', text: '她的语气很平。平得像一道还没算完的旧账。' }
            ],
            choices: [
                { id: 'turn', text: '「我没话说。只是来看看你。」', lead: 'parting', d: {} }
            ]
        }
    };

    // 结局台词（每一句都担着不同的意思，不复用）
    var ENDING_LINES = {
        pledge: [
            { who: 'npc', text: '「不必盟誓。天地为证这话，说的人多了。」' },
            { who: 'npc', text: '「我只记一句：此后并肩，你走你的道。过不去的坎，我陪你绕。」' },
            { who: 'system', text: '——盟约既立。此后一日，两人同行。' }
        ],
        defer: [
            { who: 'npc', text: '「今日的话，我收着。不是不应，是还不到应的时候。」' },
            { who: 'npc', text: '「你先把你要走的路走稳。走稳了，再来问一次。」' },
            { who: 'system', text: '——话未落定。她要你拿一段路来换一句准话。' }
        ],
        taboo: [
            { who: 'npc', text: '{tabooLine}' },
            { who: 'system', text: '——名分既立，此事到此为止。你把话咽了回去，她把灯留给了你。' }
        ],
        parting: [
            { who: 'npc', text: '「看过了，就回去罢。」' },
            { who: 'system', text: '——旧账未清，此路不通。' }
        ]
    };

    // 名分障碍的两条具体话（台词随障碍种类走，不是一句通用拒绝）
    var TABOO_LINES = {
        master: {
            open: '「慢着。这话出口之前，先论名分——你我名分已定。师徒之间行此礼，道心先亏三分，这条门规我背得比你熟。」',
            end: '「不是我不肯。是你我这一段名分写在册上，破了它，往后你拿什么护我的道。把这页翻过去罢。」'
        },
        bound: {
            open: '「慢着。你身上已有一盟之约——道侣之盟一生只结一结，这条比哪门哪派的门规都硬。」',
            end: '「我不做那个插足的人。你去把话问清楚：那一盟若还在，就好好守；守不住了，也该由你亲手解。」'
        }
    };

    // ============ 门禁：先判「进不进得去」，再判「从哪一幕进」============
    // 返回 { blocked: {code, text} | null, start: 节点 id, ending: 预定结局, taboo: 'master'|'bound'|null }
    function resolve(npc) {
        var aff = affOf(npc), rel = relOf(npc);

        // —— 整册排除：36 位道侣由各自终章定局，场景层不接（不夺主戏）
        var chapter = finalChapterOf(npc && npc.id);
        if (chapter) {
            return {
                blocked: { code: 'final_chapter', text: '这一盟由' + chapter + '定局——在此强求，只会换来一句婉拒。' },
                start: 'x_lock', ending: null, taboo: null
            };
        }
        // 已应允：续集在深谈「确定关系」里，不重演这一场
        if (npc && npc.memory && npc.memory._loveAccepted_confess) {
            return {
                blocked: { code: 'accepted', text: '你二人之间的那句话，她早已收下。余下的是道侣之盟，不在今夜。' },
                start: 'x_lock', ending: null, taboo: null
            };
        }
        if (flagOf(npc, 'dao_companion')) {
            return {
                blocked: { code: 'bonded', text: '她已是你名册上的人。再说一遍，是疑她，还是疑自己。' },
                start: 'x_lock', ending: null, taboo: null
            };
        }
        if (flagOf(npc, 'leverage_hostile')) {
            return {
                blocked: { code: 'hostile', text: '情面还没养回来，她不会单独听你把话说完。' },
                start: 'x_lock', ending: null, taboo: null
            };
        }
        // 命分障碍优先于情分——名分是结构性的，恨与爱都改不了
        if (isNamedDisciple(npc)) {
            return {
                blocked: null, start: 'c_open', ending: 'taboo', taboo: 'master',
                blockLine: TABOO_LINES.master.open, tabooLine: TABOO_LINES.master.end
            };
        }
        var bonded = playerBonded();
        if (bonded && bonded.id !== npc.id) {
            return {
                blocked: null, start: 'c_open', ending: 'taboo', taboo: 'bound', bondedName: bonded.name,
                blockLine: TABOO_LINES.bound.open,
                tabooLine: TABOO_LINES.bound.end + '（那一盟的名册上写着：' + bonded.name + '）'
            };
        }
        if (meetsOf(npc) < GATE.MIN_MEETS) {
            return {
                blocked: {
                    code: 'meets',
                    text: '点头之交不足为盟——定情之仪要一场真正的夜谈，你们只见过' + meetsOf(npc) + '面。'
                },
                start: 'x_lock', ending: null, taboo: null
            };
        }
        // 恨未消情难继
        if (NUM(rel.hatred) >= GATE.HATRED_CUT) {
            return { blocked: null, start: 'p_open', ending: 'parting', taboo: null };
        }
        // 情已至此（够 70 亲密 + 40 交心 + 60 敬重）
        if (aff >= GATE.PLEDGE_AFFECTION && NUM(rel.trust) >= GATE.PLEDGE_TRUST && NUM(rel.respect) >= GATE.PLEDGE_RESPECT) {
            return { blocked: null, start: 'a_open', ending: 'pledge', taboo: null };
        }
        return { blocked: null, start: 'b_open', ending: 'defer', taboo: null };
    }

    // ============ 结局为什么落到这儿（结局由账判定，不由选项顺序判定）============
    // defer 路径里若玩家一路把敬重与信任补齐到门槛，仍可转成 pledge——但那是账变了，不是选项赢了。
    function endingOf(npc, plan) {
        // 名分与旧恨是结构性的：中途涨多少情分都翻不了案（这不是好感问题，是伦常问题）
        if (plan.ending === 'taboo' || plan.ending === 'parting') return plan.ending;
        // 其余一律按「收口那一刻的关系账」再判一次——起幕时判过不算数
        var rel = relOf(npc);
        var reached = affOf(npc) >= GATE.PLEDGE_AFFECTION &&
            NUM(rel.trust) >= GATE.PLEDGE_TRUST && NUM(rel.respect) >= GATE.PLEDGE_RESPECT &&
            NUM(rel.hatred) < GATE.HATRED_CUT;
        return reached ? 'pledge' : 'defer';
    }

    // ============ 写账：全部走本体正门 changeXxx，不直接赋 relationship 字段 ============
    function applyLedger(npc, d) {
        var out = {};
        if (!npc || !d) return out;
        ['affection', 'trust', 'respect', 'love'].forEach(function (k) {
            var v = NUM(d[k]);
            if (!v) return;
            var fn = 'change' + k.charAt(0).toUpperCase() + k.slice(1);
            if (typeof npc[fn] !== 'function') {
                console.warn('[静默失败] js/npcs/confession-rites.js · applyLedger：NPC 缺 ' + fn + '，这一笔（' + k + ' ' + v + '）没写进去');
                return;
            }
            try { npc[fn](v); out[k] = v; }
            catch (e) { console.warn('[静默失败] js/npcs/confession-rites.js · applyLedger：' + fn + ' 没写进去（' + k + ' ' + v + '）', e && e.message); }
        });
        return out;
    }

    // ============ 存档：StateRegistry 正门，不另立 localStorage 键 ============
    var VERSION = 1;
    var _st = { version: VERSION, rites: {} };   // rites[npcId] = { ending, day, chapter }

    function _sanitizeEntry(raw) {
        if (!raw || typeof raw !== 'object') return null;
        var e = ENDINGS[raw.ending];
        if (!e) return null;
        return { ending: e.id, day: Math.max(0, Math.floor(NUM(raw.day))), chapter: String(raw.chapter || '').slice(0, 120) };
    }
    function _export() {
        var out = { version: VERSION, rites: {} };
        for (var k in _st.rites) {
            if (!Object.prototype.hasOwnProperty.call(_st.rites, k)) continue;
            var e = _sanitizeEntry(_st.rites[k]);
            if (e) out.rites[k] = e;
        }
        return out;
    }
    function _import(s) {
        _st = { version: VERSION, rites: {} };
        if (!s || typeof s !== 'object' || !s.rites || typeof s.rites !== 'object') return;
        for (var k in s.rites) {
            if (!Object.prototype.hasOwnProperty.call(s.rites, k)) continue;
            var e = _sanitizeEntry(s.rites[k]);
            if (e) _st.rites[k] = e;
        }
    }
    function _reset() { _st = { version: VERSION, rites: {} }; }

    function spentOf(npcId) { return _st.rites[npcId] || null; }

    function markSpent(npc, endingId) {
        var e = ENDINGS[endingId];
        if (!e) { console.warn('[定情] 结局 id 未在册（' + endingId + '），没记进 rites 账'); return; }
        _st.rites[npc.id] = { ending: e.id, day: absDay(), chapter: e.name };
    }

    if (global.StateRegistry && typeof global.StateRegistry.register === 'function') {
        global.StateRegistry.register('confessionRites', { version: VERSION, export: _export, import: _import, reset: _reset });
    } else {
        console.warn('[静默失败] js/npcs/confession-rites.js · 注册：StateRegistry 还没就位，rites 账这一局不会随存档往返');
    }

    // ============ 面板：沿用本体 NPC 私人事件的对话流形态（旁白 / 她 / 选项 三种气泡）============
    var SUBST = function (t, npc, vars) {
        var p = global.currentCharData || {};
        var ta = p.gender === 'female' ? '她' : '他';
        var v = vars || {};
        return String(t == null ? '' : t)
            .replace(/\{blockLine\}/g, v.blockLine || '')
            .replace(/\{tabooLine\}/g, v.tabooLine || '')
            .replace(/\{npc_name\}/g, (npc && npc.name) || '她')
            .replace(/\{playerName\}/g, p.name || '道友')
            .replace(/\{playerTa\}/g, ta)
            .replace(/\{place\}/g, (npc && (npc.homeLocation || npc.location)) || '城外');
    };

    var _active = null;   // { npcId, nodeId, ending }

    function _closePanel() {
        var m = document.querySelector('.confession-rite-modal');
        if (m) m.remove();
        _active = null;
    }

    function _bubble(who, text, npc, vars) {
        var body = SUBST(text, npc, vars);
        if (who === 'narrator') return '<div class="bg-gray-800/60 p-3 rounded-lg border-l-4 border-gray-500"><p class="text-gray-400 text-sm italic">' + body + '</p></div>';
        if (who === 'system') return '<div class="text-center py-2"><p class="text-amber-300/90 text-xs">' + body + '</p></div>';
        var icon = (npc && npc.appearance && npc.appearance.icon) || '👤';
        var name = (npc && npc.name) || '';
        return '<div class="bg-gray-700/50 p-3 rounded-lg border-l-4 border-pink-500">' +
            '<div class="flex items-center gap-2 mb-1"><span class="text-xl">' + icon + '</span>' +
            '<span class="text-sm font-bold text-pink-400">' + name + '</span></div>' +
            '<p class="text-gray-200 text-sm">' + body + '</p></div>';
    }

    function _ledgerLine(wrote) {
        var bits = [];
        ['affection', 'trust', 'respect', 'love'].forEach(function (k) {
            var label = { affection: '好感', trust: '信任', respect: '敬重', love: '深情' }[k];
            if (wrote[k]) bits.push(label + (wrote[k] > 0 ? '+' : '') + wrote[k]);
        });
        if (!bits.length) return '';
        return '<div class="text-center py-0.5"><p class="text-gray-500 text-xs">' +
            (wrote.affection < 0 ? '💔 ' : '💗 ') + bits.join('　') + '</p></div>';
    }

    function _render() {
        var a = _active;
        if (!a || !a.npc) return;
        var npc = a.npc;
        var plan = a.plan || {};
        var taboos = TABOO_LINES[plan.taboo] || {};
        var vars = {
            blockLine: plan.blockLine || taboos.open || '',
            tabooLine: plan.tabooLine || taboos.end || ''
        };
        // 结局幕没有节点号（结局不是节点，是账判出来的落点）；锁屏同理
        var node = a.blocked ? NODES.x_lock : NODES[a.nodeId];
        if (!node) {
            // 剧本里没有这个节点：不装死，也不凭空推进——把这一幕按回起点重开。
            a.nodeId = plan.start || 'a_open';
            a.endingId = null;
            node = NODES[a.nodeId];
            if (!node) { console.warn('[静默失败] js/npcs/confession-rites.js · _render：起点节点「' + (plan.start || 'a_open') + '」不在剧本里，面板没开成'); return; }
        }

        var old = document.querySelector('.confession-rite-modal');
        if (old) old.remove();

        var modal = document.createElement('div');
        modal.className = 'confession-rite-modal fixed inset-0 bg-black/85 flex items-center justify-center';
        // 层级写死在本体最高弹层之上：器灵/温养器那类浮窗会把 z-50 顶到 99999，
        // 定情之仪是从深谈里点出来的，界面必须压得住它们，也必须压得住（不可夹在两层中间被吞点击）。
        modal.style.zIndex = '100050';
        modal.style.backdropFilter = 'blur(4px)';
        modal.onclick = function (e) { if (e.target === modal) _closePanel(); };

        var head = '<div class="bg-gray-900 border-2 border-purple-500 rounded-xl p-4 max-w-2xl w-full mx-4 max-h-[88vh] flex flex-col">' +
            '<div class="flex items-center justify-between mb-3 pb-2 border-b border-gray-700">' +
            '<div class="flex items-center gap-2"><span class="text-2xl">' + (a.blocked ? '🔒' : '🕯') + '</span>' +
            '<h3 class="text-lg font-bold text-yellow-500">' + (a.blocked ? '名分未定' : '定情之仪') + '</h3>' +
            '<span class="text-xs text-gray-500">' + SUBST(node.title, npc, vars) + '</span></div>' +
            '<button onclick="window.ConfessionRites.close()" class="text-gray-400 hover:text-white text-2xl">&times;</button></div>' +
            '<div data-role="stream" class="flex-1 overflow-y-auto space-y-3 pr-1 mb-2" style="min-height: 280px;"></div></div>';

        modal.innerHTML = head;
        document.body.appendChild(modal);

        var stream = modal.querySelector('[data-role="stream"]');
        function push(html) { stream.insertAdjacentHTML('beforeend', html); stream.scrollTop = stream.scrollHeight; }

        if (a.blocked) {
            // 锁就亮锁、写清楚为什么锁（禁止设计 §2：不做条件不满足就静默）
            push(_bubble('narrator', NODES.x_lock.desc[0].text, npc, vars));
            push('<div class="bg-amber-900/30 border border-amber-700/50 rounded p-3"><p class="text-amber-200 text-sm">🔒 ' + a.blocked.text + '</p></div>');
            push('<div class="my-1"><button onclick="window.ConfessionRites.pick(\'leave\')" class="w-full text-left p-2.5 bg-gray-700 hover:bg-gray-600 hover:border-yellow-500 rounded-lg border border-gray-600 text-sm text-gray-200 transition-colors">那便……暂且按下。</button></div>');
            return;
        }

        if (a.endingId) {
            // 结局幕：台词 + 账目 + 一个出口。出口走完即收窗回本体的 NPC 对话（收敛，不卡住）
            (ENDING_LINES[a.endingId] || []).forEach(function (line) { push(_bubble(line.who, line.text, npc, vars)); });
            if (a.ledgerHtml) push(a.ledgerHtml);
            push('<div class="my-1"><button onclick="window.ConfessionRites.pick(\'leave\')" class="w-full text-left p-2.5 bg-gray-700 hover:bg-gray-600 hover:border-yellow-500 rounded-lg border border-gray-600 text-sm text-gray-200 transition-colors">（走出门去）</button></div>');
            return;
        }
        if (a.blocked) return;
        node.desc.forEach(function (line) { push(_bubble(line.who, line.text, npc, vars)); });

        var opts = '<div class="my-1 space-y-2">';
        node.choices.forEach(function (c) {
            opts += '<button onclick="window.ConfessionRites.pick(\'' + c.id + '\')" class="w-full text-left p-2.5 bg-gray-700 hover:bg-gray-600 hover:border-yellow-500 rounded-lg border border-gray-600 text-sm text-gray-200 transition-colors">' + SUBST(c.text, npc, vars) + '</button>';
        });
        opts += '</div>';
        push(opts);
    }

    // ============ 走一步 ============
    function pick(choiceId) {
        var a = _active;
        if (!a || !a.npc) return false;
        var npc = a.npc;

        // 结局幕 / 锁屏：只有一个出口，不查剧本（结局不是节点，是账判出来的落点）
        if (a.endingId || a.blocked) {
            if (choiceId !== 'leave') return false;
            if (a.endingId) { markSpent(npc, a.endingId); settleEnding(npc, a.endingId); }
            else { reopenDialog(npc.id); }
            return true;
        }

        var node = NODES[a.nodeId];
        if (!node) { console.warn('[静默失败] js/npcs/confession-rites.js · pick：节点「' + a.nodeId + '」不在剧本里，这一步没走成'); return false; }
        var choice = null, i;
        for (i = 0; i < node.choices.length; i++) { if (node.choices[i].id === choiceId) { choice = node.choices[i]; break; } }
        if (!choice) return false;

        var stream = document.querySelector('.confession-rite-modal [data-role="stream"]');

        if (choice.d && Object.keys(choice.d).length) {
            var wrote = applyLedger(npc, choice.d);
            var html = _ledgerLine(wrote);
            if (stream) { stream.insertAdjacentHTML('beforeend', html); stream.scrollTop = stream.scrollHeight; }
        }

        // 走到没有后继的一步：要么是结局，要么是玩家自己按了退场
        if (!choice.lead) {
            reopenDialog(npc.id);
            return true;
        }

        // 抵达结局：结局由此刻的关系账判定，不是选项顺序定的
        var plan = a.plan;
        if (ENDINGS[choice.lead] && !NODES[choice.lead]) {
            var eid = endingOf(npc, plan);
            a.endingId = eid;
            a.ledgerHtml = _ledgerLine(applyLedger(npc, ENDINGS[eid].ledger));
            _render();
            return true;
        }

        a.nodeId = choice.lead;
        _render();
        return true;
    }

    function settleEnding(npc, endingId) {
        var e = ENDINGS[endingId];
        if (!e) return;
        try {
            npc.memory = npc.memory || {};
            npc.memory._loveCd = npc.memory._loveCd || {};
        } catch (eMem) {
            console.warn('[静默失败] js/npcs/confession-rites.js · settleEnding：记忆袋没打开，告白承诺旗与冷却无处落', eMem && eMem.message);
        }
        if (e.bond) {
            try { npc.setFlag('dao_companion'); }
            catch (err) { console.warn('[静默失败] js/npcs/confession-rites.js · settleEnding：dao_companion 旗没落上', err && err.message); }
            // 承诺旗：本体「亲密接触/确定关系」两档都守这道门（npc-system.js:3196），
            // 场景层既已结契，就把这道门一并落上——否则结契之后深谈里反被拦成「还没到那一步」。
            try {
                if (npc.memory) {
                    npc.memory._loveAccepted_confess = true;
                    npc.memory._loveCd.confess = absDay();
                    npc.memory._loveCd.bond_dao = absDay();   // 同 :3180 LOVE_CD_DAYS 的 3/7 日口径
                }
            } catch (errF) { console.warn('[静默失败] js/npcs/confession-rites.js · settleEnding：承诺旗/冷却没写上', errF && errF.message); }
            // 名册落笔走本体正门（旗与册同源，见 core/dao-bridge.js）
            try { if (typeof global.ensureDaoBond === 'function') global.ensureDaoBond(npc.id); }
            catch (err2) { console.warn('[静默失败] js/npcs/confession-rites.js · settleEnding：道侣名册没落笔', err2 && err2.message); }
        }
        try {
            if (typeof global.showMessage === 'function') {
                global.showMessage('🕯 与' + npc.name + '的这一场「' + e.name + '」已了。', e.bond ? 'success' : 'info');
            }
        } catch (err3) { console.warn('[静默失败] js/npcs/confession-rites.js · settleEnding：结语没上屏', err3 && err3.message); }
        // 私人相处占时辰：一场定情之仪要一个时辰（沿用个人事件层占时辰的做法）
        try {
            if (global.timeSystem && typeof global.timeSystem.advanceTime === 'function') {
                global.timeSystem.advanceTime(60, '与' + npc.name + '的定情之仪');
            }
        } catch (err4) { console.warn('[静默失败] js/npcs/confession-rites.js · settleEnding：时辰没扣成', err4 && err.message); }
        reopenDialog(npc.id);
    }

    function reopenDialog(npcId) {
        _closePanel();
        try {
            if (typeof global.showNPCDialog === 'function') {
                global.setTimeout(function () { global.showNPCDialog(npcId); }, 500);
                return;
            }
        } catch (e) { console.warn('[静默失败] js/npcs/confession-rites.js · reopenDialog：NPC 对话没重开，' + (e && e.message)); }
    }

    // ============ 对外三个口 ============
    // 1) gate：给 UI 与测试看的一句话理由（进不去时照实说，不装死）
    function gate(npc) {
        if (!npc) return { ok: false, code: 'no_npc', text: '查无此人。' };
        // 亲密度未到本体那道门：连场景都不成立（offer 会交还原实现，这里照实说冷）
        if (affOf(npc) < GATE.MIN_AFFECTION) {
            return { ok: false, code: 'cold', text: '情分未到（需好感 ' + GATE.MIN_AFFECTION + '）——这句话，说了也不会有人接。' };
        }
        var plan = resolve(npc);
        if (plan.blocked) return { ok: false, code: plan.blocked.code, text: plan.blocked.text };
        return { ok: true, code: plan.ending, text: plan.ending };
    }

    // 2) offer：接缝专用。aff 未到本体那道 60 分门就交还（false），
    //    到了就由本层接管——包括「进不去」的情形，锁也要亮给玩家看。
    function offer(npc) {
        if (!npc || !npc.relationship) return false;
        if (affOf(npc) < GATE.MIN_AFFECTION) return false;
        if (typeof document === 'undefined') return false;      // 非浏览器环境（node 回归）不接管

        var plan = resolve(npc);
        var spent = spentOf(npc.id);
        if (spent && !plan.blocked) {
            // 这一场已启过：话已说过、账已结清，再点只复述结局，不二次落账
            plan = {
                blocked: { code: 'spent', text: '这一场你已开过——「' + spent.chapter + '」之后，夜里就不必再走这一趟了。' },
                start: 'x_lock', ending: null, taboo: null
            };
        }
        _active = { npc: npc, npcId: npc.id, plan: plan, nodeId: plan.start, endingId: null, blocked: plan.blocked || null };
        _render();
        return true;
    }

    global.ConfessionRites = {
        GATE: GATE,
        ENDINGS: ENDINGS,
        NODES: NODES,
        gate: gate,
        resolve: resolve,
        offer: offer,
        pick: pick,
        close: _closePanel,
        ledger: function () { return _export(); },
        spentOf: spentOf,
        _reset: _reset,
        _import: _import
    };
})(typeof window !== 'undefined' ? window : this);