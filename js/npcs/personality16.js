/**
 * personality16.js — 16Personalities 五维性格模型（v14.2）
 *
 * 规范字段：npc.personality16 = { mind, energy, nature, tactics, identity } ∈ [-100, 100]
 *   mind     心境：-100 内向 I ←→ +100 外向 E
 *   energy   能量：-100 直觉 N ←→ +100 实感 S
 *   nature   本性：-100 思考 T ←→ +100 情感 F
 *   tactics  战术：-100 判断 J ←→ +100 感知 P
 *   identity 身份：-100 果断 A ←→ +100 起伏 T
 *
 * 倾向条语义：|v|≥60 强烈倾向，25~59 中度，<25 中间骑墙（类型字母记作 x 通配）。
 * 类型字母由符号推导（如 INFP-T），但数值连续——"轻微外向"与"强烈外向"是不同的人。
 *
 * 兼容：旧 personalityBig5 字段保留；本模块提供双向派生，未迁移消费者零感知。
 */
(function () {
    'use strict';

    var DIMS = ['mind', 'energy', 'nature', 'tactics', 'identity'];
    var DIM_LABELS = { mind: '心境', energy: '能量', nature: '本性', tactics: '战术', identity: '身份' };
    var DIM_ENDS = {
        mind: ['I 内向', 'E 外向'], energy: ['N 直觉', 'S 实感'], nature: ['T 思考', 'F 情感'],
        tactics: ['J 判断', 'P 感知'], identity: ['A 果断', 'T 起伏']
    };

    function clamp(v) { return Math.max(-100, Math.min(100, Math.round(v))); }

    // ---- 双向桥接（旧 Big5 ↔ 新 p16）----
    function deriveP16FromBig5(b5) {
        b5 = b5 || {};
        var g = function (k) { return (b5[k] != null ? b5[k] : 50); };
        return {
            mind: clamp(g('extraversion') * 2 - 100),
            energy: clamp(-(g('openness') * 2 - 100)),
            nature: clamp(g('agreeableness') * 2 - 100),
            tactics: clamp(-(g('conscientiousness') * 2 - 100)),
            identity: clamp(g('neuroticism') * 2 - 100)
        };
    }

    function deriveBig5FromP16(p) {
        p = p || {};
        var g = function (k) { return (p[k] != null ? p[k] : 0); };
        return {
            openness: Math.round((100 - g('energy')) / 2),
            conscientiousness: Math.round((100 - g('tactics')) / 2),
            extraversion: Math.round((100 + g('mind')) / 2),
            agreeableness: Math.round((100 + g('nature')) / 2),
            neuroticism: Math.round((100 + g('identity')) / 2)
        };
    }

    // ---- 类型字母（|v|<25 记 x 通配）----
    function letter(v, neg, pos) {
        if (v >= 25) return pos;
        if (v <= -25) return neg;
        return 'x';
    }
    function typeLetters(p16) {
        p16 = p16 || {};
        var g = function (k) { return p16[k] != null ? p16[k] : 0; };
        return letter(g('mind'), 'I', 'E') + letter(g('energy'), 'N', 'S') +
               letter(g('nature'), 'T', 'F') + letter(g('tactics'), 'J', 'P');
    }
    function identityLetter(p16) {
        var v = p16 && p16.identity != null ? p16.identity : 0;
        return v >= 25 ? 'T' : v <= -25 ? 'A' : 'xA';
    }

    // ==================== 手工校准：十故事线NPC ====================
    var HAND_P16 = {
        mentor_01:     { mind: -45, energy: -60, nature: 55,  tactics: -40, identity: -50 }, // INFJ-A 引路导师
        healer_01:     { mind: -50, energy: -55, nature: 70,  tactics: -30, identity: 60 },  // INFJ-T 温柔忧思的医者
        warrior_01:    { mind: -20, energy: 65,  nature: -45, tactics: 55,  identity: -40 }, // ISTP-A 寡言巧匠型武人
        merchant_01:   { mind: 70,  energy: 60,  nature: -25, tactics: 75,  identity: -30 }, // ESTP-A 精明实干商人
        alchemist_01:  { mind: -55, energy: 45,  nature: 50,  tactics: 40,  identity: 65 },  // ISFP-T 手艺执念自责
        elder_01:      { mind: -60, energy: 40,  nature: -65, tactics: -70, identity: -70 }, // ISTJ-A 冷面守序压山石
        rival_01:      { mind: -15, energy: 50,  nature: -35, tactics: 70,  identity: 55 },  // ISTP-T 警觉灵动的暗桩
        villager_01:   { mind: -10, energy: 70,  nature: 75,  tactics: 20,  identity: -60 }, // ISFP-A 知足温厚的农夫
        craftsman_01:  { mind: -45, energy: 55,  nature: -20, tactics: -55, identity: 50 },  // ISTJ-T 规矩愧疚的匠人
        mysterious_01: { mind: -70, energy: -75, nature: -45, tactics: -30, identity: -80 }  // INTJ-A 万年推演者
    };

    // ==================== 16型专属池（问候尾缀/话题口吻） ====================
    var TYPE_POOLS = {
        INTJ: ['我推演过你会来——误差不超过一炷香。', '这局棋你第三步就走歪了。不过，有意思。', '计划赶不上变化？那是计划不够好。', '变量已计入。执行吧。'],
        INTP: ['我昨夜想到一个有趣的问题——嗯？你说什么？', '万物皆可推演，唯独人心不讲道理。', '先别说话，让我把这个念头记下来。', '假设一：你是对的。假设二：更有趣。'],
        ENTJ: ['效率。我欣赏有效率的人。', '既然来了就别浪费时间——说正事。', '这条路是我选的，走到底便是。', '目标不变，手段我来定。'],
        ENTP: ['你说东？我偏要论证西也有道理。', '规则，就是用来被聪明人重新解释的。', '又辩赢一个。无趣。', '反驳我——最好带证据。'],
        INFJ: ['有些人走路用脚，有些人用心。你是后者。', '我看见的你，比你以为的要多一些。', '时机未到。到了，你自然会懂。', '你会明白的，在该明白的时候。'],
        INFP: ['我把想说的话都刻在这些物件里了——你看出来了吗？', '世界很吵。还好还有些安静的角落。', '哪怕没人理解，这件事也要做下去。', '温柔也是一种力量，只是安静。'],
        ENFJ: ['来来来，正好——每个人都该被好好听见。', '你的心事写在脸上三成，剩下七成我猜得到。', '相信我，也相信自己。', '你不是一个人在扛，我在看着呢。'],
        ENFP: ['今天的风里都有好事的味道！', '计划？计划就是没有计划呀！', '你看你看，这个好玩吧！', '哇——这个想法太棒了，马上出发！'],
        ISTJ: ['规矩立了就要守，这是底线。', '一样一样来，急不得。', '昨日之事有据可查，明日之事心中有数。', '白纸黑字，比承诺可靠。'],
        ISFJ: ['冷不冷？我这儿有多余的斗篷。', '都交给我，你去歇着。', '记得吃饭。别的我不放心，这个总可以叮嘱吧。', '都安排好了，你不用谢。'],
        ESTJ: ['差事办完了？好。下一件。', '没有规矩不成方圆——我说完了。', '空谈无益，拿结果说话。', '散会。有事当面说，别背后议论。'],
        ESFJ: ['大家都到齐了就好，就等你了！', '这事包在我身上，你别操心。', '远道而来辛苦了，先喝口热茶。', '大家都辛苦了，今晚加餐！'],
        ISTP: ['东西坏了？拿来我看看。', '话不多说，看手艺。', '想那么多干嘛，手别生就行。', '工具借你可以，弄坏了照价赔。'],
        ISFP: ['火候这东西急不得——跟人心一样。', '我不太会说漂亮话。东西你收好。', '有些美，只有慢下来的人才看得见。', '颜色再淡一点，就更像它本来样子了。'],
        ESTP: ['想那么多干嘛？干了再说！', '赌一把？我押赢面大。', '站着不动的人，永远碰不到运气。', '三、二、一——干！'],
        ESFP: ['哈哈哈——你来得正好，热闹不能少了你！', '人生苦短，及时行乐嘛！', '愁眉苦脸也是一天，笑一笑也是一天，选哪个还用教？', '掌声在哪里！好了好了，下一个节目！']
    };

    var IDENTITY_TAIL = {
        A: ['此事我意已决。', '稳住，天塌不下来。'],
        T: ['……你说，我是不是哪里做错了？', '万一搞砸了怎么办。算了，不想了。']
    };

    var TEMPERAMENT_FALLBACK = { NT: 'INTJ', NF: 'INFJ', SJ: 'ISTJ', SP: 'ISTP' };

    // ==================== 维度微口吻池（v14.3）：每维两侧各3条，按实际倾向抽签 ====================
    // 与整型签名句互补：整型句低频高辨识，维度句高频铺量——正交组合出 2^5 种声线
    var DIM_POOLS = {
        mind: {
            I: ['……嗯。让我安静会儿。', '人多的地方，话就变得不值钱。', '我更喜欢一个人守炉子的晚上。', '吵闹是种病，安静是药。'],
            E: ['走走走，人多才热闹！', '憋在屋里三天，我嘴上都淡出鸟来了。', '说来话长——边走边说！', '闷着头修炼，不如出去转转。']
        },
        energy: {
            N: ['你说这石头像不像一条睡着的龙？我看像。', '梦里的东西，有时候比白天还真。', '迹象比实据有意思多了——实据只会迟到。', '第六感这东西，比罗盘准。'],
            S: ['别跟我谈玄的，东西拿出来摸一摸。', '眼见为实，手感不会骗人。', '一步一个脚印，比什么都强。', '先看账本，再谈理想。']
        },
        nature: {
            T: ['情面能当饭吃？把账算清楚再说。', '我不是冷，只是懒得演。', '对事不对人——这话难听，但公道。', '眼泪解决不了丹炉炸了的问题。'],
            F: ['他也不容易……算了，不说了。', '道理我都懂，可心里过不去啊。', '先别讲理。讲讲感受行吗？', '话是说给人听的，不是说给理听的。']
        },
        tactics: {
            J: ['凡事预则立。昨日已备好今日三件事。', '变数？变数也在册子上。', '先立规矩，再谈人情。', '今日事今日毕，明日另有明日事。'],
            P: ['计划赶不上变化，变化赶不上我临时起意。', '到时候再说呗——天又不会塌今天。', '收拾什么行李，走到哪算哪。', '船到桥头自然直——多数时候。']
        },
        identity: {
            A: ['稳住，天塌不下来。', '这事我拿得准，不用劝。', '后悔是最没用的功课，我不做。'],
            T: ['……万一搞砸了怎么办。算了不想了。', '夜里翻来覆去，总觉得自己哪里没做好。', '他们是不是在笑话我。……应该不会吧。']
        }
    };

    function dimSideOf(p16, dim) {
        var v = p16[dim] != null ? p16[dim] : 0;
        if (Math.abs(v) < 25) return null; // 骑墙维度不出声
        return v < 0 ? 'neg' : 'pos';
    }

    function dimSideKey(dim, side) {
        var negs = { mind: 'I', energy: 'N', nature: 'T', tactics: 'J' };
        var poss = { mind: 'E', energy: 'S', nature: 'F', tactics: 'P' };
        if (dim === 'identity') return side === 'neg' ? 'A' : 'T';
        return side === 'neg' ? negs[dim] : poss[dim];
    }

    // 抽一句维度微口吻：优先非骑墙维度，返回 null 表示无
    function dimLineFor(npc) {
        var p16 = ensure(npc);
        if (!p16 || !DIM_POOLS) return null;
        var armed = [];
        DIMS.forEach(function (dim) {
            var side = dimSideOf(p16, dim);
            if (side) armed.push({ dim: dim, side: side });
        });
        if (!armed.length) return null;
        var chosen = pick(armed);
        var key = dimSideKey(chosen.dim, chosen.side);
        var pool = DIM_POOLS[chosen.dim][key];
        return pool ? { dim: chosen.dim, text: pick(pool) } : null;
    }

    function temperamentOf(letters) {
        if ((letters[1] === 'N') && (letters[2] === 'T')) return 'NT';
        if (letters[1] === 'N' && letters[2] === 'F') return 'NF';
        if (letters[1] === 'S' && letters[2] === 'J') return 'SJ';
        if (letters[1] === 'S' && letters[2] === 'P') return 'SP';
        return null;
    }

    function tailFor(npc) {
        var p16 = ensure(npc);
        if (!p16) return null;
        var letters = typeLetters(p16);
        // 精确4字母 → 按实际微倾向展开x维 → 气质组兜底
        var dims = ['mind', 'energy', 'nature', 'tactics'];
        var negs = { mind: 'I', energy: 'N', nature: 'T', tactics: 'J' };
        var poss = { mind: 'E', energy: 'S', nature: 'F', tactics: 'P' };
        var xs = [];
        for (var d = 0; d < 4; d++) if (letters[d] === 'x') xs.push(d);
        var keys;
        if (!xs.length) {
            keys = [letters];
        } else {
            keys = [];
            for (var m = 0; m < (1 << xs.length); m++) {
                var arr = letters.split('');
                for (var j = 0; j < xs.length; j++) {
                    var dim = dims[xs[j]];
                    var v = p16[dim] != null ? p16[dim] : 0;
                    arr[xs[j]] = v >= 0 ? poss[dim] : negs[dim];
                }
                keys.push(arr.join(''));
            }
        }
        for (var i = 0; i < keys.length; i++) {
            if (TYPE_POOLS[keys[i]]) return pick(TYPE_POOLS[keys[i]]);
        }
        var tg = temperamentOf(letters);
        if (tg && TYPE_POOLS[TEMPERAMENT_FALLBACK[tg]]) return pick(TYPE_POOLS[TEMPERAMENT_FALLBACK[tg]]);
        return null;
    }

    function identityTailFor(npc) {
        var p16 = ensure(npc);
        if (!p16) return null;
        var il = identityLetter(p16);
        var pool = IDENTITY_TAIL[il] || IDENTITY_TAIL.A;
        return pick(pool);
    }

    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    // ==================== 实例保障与包装 ====================
    function ensure(npc) {
        if (!npc) return null;
        if (!npc.personality16) {
            var hand = HAND_P16[npc.id];
            npc.personality16 = hand ? JSON.parse(JSON.stringify(hand)) : deriveP16FromBig5(npc.personalityBig5);
        }
        return npc.personality16;
    }

    function wrapGetNPC() {
        if (!window.npcManager || typeof window.npcManager.getNPC !== 'function' || window.npcManager.__p16_wrapped) return;
        var orig = window.npcManager.getNPC.bind(window.npcManager);
        window.npcManager.getNPC = function (npcId) {
            var n = orig(npcId);
            if (n) try { ensure(n); } catch (e) {}
            return n;
        };
        window.npcManager.__p16_wrapped = true;
    }

    // ==================== 面板：五条倾向条 ====================
    function strengthWord(v) {
        var a = Math.abs(v);
        if (a < 25) return '中间';
        if (a < 60) return '中度';
        return '强烈';
    }

    function barsHtml(npc) {
        var p16 = ensure(npc);
        if (!p16) return '';
        var letters = typeLetters(p16);
        var idl = identityLetter(p16);
        var badge = letters.replace(/x/g, '') + '-' + idl.replace('x', '');
        var rows = DIMS.map(function (dim) {
            var v = p16[dim] != null ? p16[dim] : 0;
            var w = Math.abs(v) / 2;
            var leftStyle = v < 0 ? ('right:50%') : ('left:50%');
            var color = v < 0 ? '#38bdf8' : '#f472b6';
            var ends = DIM_ENDS[dim];
            return '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">' +
                '<span style="width:34px;font-size:10px;color:#94a3b8;flex:none;">' + DIM_LABELS[dim] + '</span>' +
                '<span style="width:38px;font-size:9px;color:#64748b;text-align:right;flex:none;">' + ends[0] + '</span>' +
                '<div style="position:relative;flex:1;height:8px;background:#1e293b;border-radius:4px;overflow:hidden;">' +
                    '<div style="position:absolute;top:0;bottom:0;left:calc(50% - 1px);width:2px;background:#475569;"></div>' +
                    (w > 0 ? '<div style="position:absolute;top:0;bottom:0;' + leftStyle + ';width:' + w + '%;background:' + color + ';opacity:.85;"></div>' : '') +
                '</div>' +
                '<span style="width:38px;font-size:9px;color:#64748b;flex:none;">' + ends[1] + '</span>' +
            '</div>';
        }).join('');
        return '<details class="mt-2"><summary class="cursor-pointer text-indigo-300 text-xs font-bold">🧭 性格 · ' + badge + '</summary>' +
            '<div class="mt-2 bg-gray-800/40 border border-gray-700 rounded p-2">' + rows +
            '<p class="text-xs text-gray-500 mt-2">五维皆连续倾向：越靠中点越是骑墙，两端为强烈。</p></div></details>';
    }

    // ==================== 集成 ====================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', wrapGetNPC);
    } else {
        wrapGetNPC();
    }

    window.Personality16 = {
        ensure: ensure,
        typeOf: function (npc) { var p = ensure(npc); return p ? typeLetters(p) + '-' + identityLetter(p) : null; },
        tailFor: tailFor,
        identityTailFor: identityTailFor,
        dimLineFor: dimLineFor,
        barsHtml: barsHtml,
        deriveBig5FromP16: deriveBig5FromP16,
        deriveP16FromBig5: deriveP16FromBig5
    };

    console.log('🧭 16Personalities 性格模型已加载（五维倾向条 + 16型池 + Big5双向桥接）');
})();
