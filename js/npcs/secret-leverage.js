/**
 * secret-leverage.js — 秘密系统2.0·一期骨架（v13.6）
 *
 * 「🃏 筹码」：把已解锁的秘密变成可交涉的筹码。
 *   - 要挟 coerce：索取灵石/人情，必得但有代价；人格掷骰决定对方顺从还是当场翻脸
 *   - 交换 trade：以"我知道你的事"换取坦诚——好感/敬重/信任大幅回升（每秘密一次）
 *   - 守密承诺 promise：以沉默换深度绑定（trust+15；终章加成属三期）
 * 状态机单向：known(s.unlocked) → traded / used_coerce / promised，不可逆，杜绝反复榨取。
 *
 * 集成方式（零侵入）：向 DEEP_TALK_CATEGORIES 注入 leverage 分类、向 DEEP_TALK_REAL_HANDLERS
 * 注入 leverage_menu 处理器——均在本文件加载时完成，不改动 npc-system.js。
 * 持久化：StateRegistry 自注册（读档重建NPC实例后筹码进度不丢），模式同 difficulty-config.js。
 */
(function () {
    'use strict';

    // ==================== 数值参数（集中可调） ====================
    var TUNE = {
        coerceAffectionHit: -25,     // 要挟成功：好感变动
        coerceRespectHit: -10,       // 要挟成功：敬重变动
        coerceTrustFloor: 0,         // 要挟成功：trust清零
        coerceMoodHit: -20,
        betrayAffectionHit: -60,     // 翻脸：好感重挫
        betrayMood: 5,
        tradeAffection: 8,           // 交换：正循环收益
        tradeRespect: 5,
        tradeTrust: 8,
        tradeMood: 10,
        promiseTrust: 15,            // 守密承诺：信任回报
        exposeFriendPenalty: -15     // v13.7 告发：共同好友对你的极性传播扣分
    };

    // 人格反制骰（v14.2 重写于16Personalities五维）：
    //   nature 偏F(正)顾情面不易撕破；偏T(负)被算计后反噬更冷
    //   identity 偏T(正)情绪化易当场爆发；偏A(负)稳如老狗但记恨更深
    //   p = 0.55 + T动荡加成 − F情面减成 + T冷面加成 + A隐忍微增，夹在[0.05,0.85]
    function betrayChance(npc) {
        var p16 = (window.Personality16 && window.Personality16.ensure) ? window.Personality16.ensure(npc) : null;
        if (!p16) {
            // 兜底：旧Big5公式
            var b = npc.personalityBig5 || {};
            var ag = (b.agreeableness != null ? b.agreeableness : 50) / 100;
            var ne = (b.neuroticism != null ? b.neuroticism : 50) / 100;
            return Math.max(0.05, Math.min(0.85, 0.55 - ag * 0.35 - ne * 0.25));
        }
        var nf = p16.nature / 100;   // -1(T) ~ +1(F)
        var tid = p16.identity / 100; // -1(A) ~ +1(T)
        var p = 0.55
            - Math.max(0, nf) * 0.28
            + Math.max(0, -nf) * 0.08
            + Math.max(0, tid) * 0.18
            + Math.max(0, -tid) * 0.04;
        return Math.max(0.05, Math.min(0.85, p));
    }

    function riskLabel(p) {
        if (p < 0.18) return '🟢 此人性情温软，摊牌大概率平安';
        if (p < 0.32) return '🟡 此人有几分傲骨，需备好台阶';
        if (p < 0.45) return '🟠 此人心气极高，翻脸风险不小';
        return '🔴 此人宁折不弯，摊牌极可能彻底决裂';
    }

    // ==================== 筹码数据（按secretId配置，未配置走类型默认） ====================
    // gain 支持 spiritStones / favor（人情，暂记worldFlag计数）/ item（一期仅spiritStones落地）
    var LEVERAGE_DATA = {
        mentor_secret_01: {
            coerceGain: { favor: 1 }, coerceRisk: 'mid',
            coerceMsg: '清虚道人闭目良久：「老道这一生，只有这一件亏心事。……你要什么？」',
            coerceRefuseMsg: '他睁开眼，目光像两口古井：「拿这个来挟我？——滚。」四十年的温和碎了一地。',
            tradeMsg: '他把樟木匣推到你面前，第一次讲了整整一夜。有些事说出来，人就轻了。',
            tradeHint: '他愿以一段从未示人的过往作答'
        },
        healer_secret_01: {
            coerceGain: { spiritStones: 600 }, coerceRisk: 'mid',
            coerceMsg: '灵素的手抖了抖，随即平静下来：「药钱、诊金，从今往后都免了。……你想怎样都行。」',
            coerceRefuseMsg: '她抬起头，眼里没有惧意只有失望：「原来你也和别人一样。——请回吧，我还有病人。」',
            tradeMsg: '她把脉案递给你：「噬心蛊引的十年记录都在这里。若我真倒了，至少有人知道怎么救下一个。」',
            tradeHint: '她愿托付十年的毒理笔记'
        },
        warrior_secret_01: {
            coerceGain: { spiritStones: 400 }, coerceRisk: 'high',
            coerceMsg: '铁山攥着那半截枪杆，指节咯咯作响：「你要灵石还是要我磕头？……说吧。」',
            coerceRefuseMsg: '「哈！」他反而笑了，笑声里全是杀气，「拿这个威胁老子？八年前那个人都不敢！」——谈崩了。',
            tradeMsg: '他喝了一大口酒，把雁回坡那一战从头到尾比划给你看，连那人斜劈的角度都没藏。',
            tradeHint: '他愿倾囊相授八年宿敌的招路'
        },
        merchant_secret_01: {
            coerceGain: { spiritStones: 1500 }, coerceRisk: 'low',
            coerceMsg: '贾有道脸上的肥肉抽了抽，随即堆笑：「好说好说！这点心意您先拿着——咱们是自己人，对吧？」',
            coerceRefuseMsg: '他的笑一点点收干净，露出商人的另一副面孔：「账本烧了就是没有。空口白牙，阁下想告谁去？」——他赌你不敢。',
            tradeMsg: '他压低声音给你讲了一条南疆的进货暗线：「这消息值三千两。咱俩的事，两清。」',
            tradeHint: '他愿以一条值钱的商路情报交换'
        },
        alchemist_secret_01: {
            coerceGain: { item: 'foundation_pill' }, coerceRisk: 'mid',
            coerceMsg: '丹大师盯着炉火看了很久：「筑基丹……好。你要几颗，我去开炉。」声音平得可怕。',
            coerceRefuseMsg: '他缓缓关上了丹房的门：「三十年前我欠了一条命，但不欠你的。——这扇门，你以后不必进了。」',
            tradeMsg: '他取出半卷焦边的丹方：「这是我师弟的字。你既然知道了，那就帮你也认认——这是九转金丹的前半卷。」',
            tradeHint: '他愿展示九转金丹的前半卷残方'
        },
        elder_secret_01: {
            coerceGain: { favor: 1 }, coerceRisk: 'high',
            coerceMsg: '玄冰子周身寒气骤然一凝，又缓缓散去：「……说吧。天山的面子，卖给你一次。」',
            coerceRefuseMsg: '「放肆。」两个字落地，你周身的血都快冻住了。他拂袖转身：「滚下山去。天山不留揭人伤疤的东西。」',
            tradeMsg: '他把一枚冰蚕玉佩放在你手心：「寒冰功的反噬征兆，认得出这个的可不多。学会了，将来能救人。」',
            tradeHint: '他愿传授寒毒发作的辨识之法'
        },
        rival_secret_01: {
            coerceGain: { spiritStones: 900 }, coerceRisk: 'high',
            coerceMsg: '柳随风眯起眼笑了：「要挟一个魔教暗桩？胆子不小。——钱可以给，命你自己保重。」',
            coerceRefuseMsg: '他鼓了个掌：「精彩。可惜啊，死人不会把名册说出去。」刀光比你想象中快——你拼死挣脱，从此与他恩断义绝。',
            tradeMsg: '他沉吟片刻，撕下一页《随风录》给你：「第一百一十七个人，是你们门派的。去见见吧——他欠我一条命，如今还你了。」',
            tradeHint: '他愿引荐一名当年被他所救的故人'
        },
        villager_secret_01: {
            coerceGain: { spiritStones: 100 }, coerceRisk: 'mid',
            coerceMsg: '张大爷愣了半天，默默进屋翻出一小袋攒着的灵石：「俺就知道……仙缘这东西，不该俺惦记。」',
            coerceRefuseMsg: '老人浑浊的眼睛看着你，慢慢红了：「四十三年了，头一回有人拿这个糟践俺。」——你抢在愧疚淹死自己之前逃出了院子。',
            tradeMsg: '他絮絮叨叨讲了一下午：当年的山道、初选的考场、还有那个改了名的同乡。讲到一半自己笑了：「跟你说这些干啥哩。」',
            tradeHint: '他愿讲完那段没讲完的四十年前'
        },
        craftsman_secret_01: {
            coerceGain: { item: 'iron_sword' }, coerceRisk: 'mid',
            coerceMsg: '老王放下锤子，一言不发地从兵器架上取了最好的一柄剑：「拿去。别再来第二回。」',
            coerceRefuseMsg: '他把烧火棍横在了门口：「我这双手造过孽，不假。可你想靠它发财——先问问它答不答应。」铁器呜呜作响。',
            tradeMsg: '他把粉笔板摘下来给你看，一道一道讲：每个地名背后是谁家、剑到过哪里。「你都记住。将来我追不动了，你替我接着追。」',
            tradeHint: '他愿托付那份二十年的追剑名录'
        },
        mysterious_secret_01: {
            coerceGain: { favor: 2 }, coerceRisk: 'high',
            coerceMsg: '洞府里的灯火齐齐一暗。他笑了，笑声里有万年的疲惫：「好，好啊。连你也来向我讨债。——说吧，你要什么。」',
            coerceRefuseMsg: '没有怒吼，没有杀气。他只是看了你一眼——那一眼里装着一万年的风霜。你再也没能在任何地图上找到那个洞府。',
            tradeMsg: '他在棋盘上摆了一局残局：「这是万年前他们仨最后布的一局。你既然知道了故事，就陪你下完它。」',
            tradeHint: '他愿授一式上古守界的观隙之法'
        },
        // v13.8 三期：绯泪真名（秘密本体在 sects-deep-data.js，经injectSectSecrets注入）
        xl_secret_01: {
            coerceGain: { favor: 2 }, coerceRisk: 'high',
            coerceMsg: '修罗女盯着你看了很久很久。殿内侍女屏退之后，她才开口：「……说吧。这个名字被我听见的那一刻，你就已经赢了。」',
            coerceRefuseMsg: '殿内温度骤降。她的手搭上你的肩，轻得像一片羽毛，重得像一座山：「上一个敢提这两个字的人，坟头的草已经三尺高了。」——你用尽全部修为才活着走出大殿。',
            tradeMsg: '她背过身去，声音第一次有了温度：「绯泪。娘取的。她说修罗宫的眼泪也是红的……你既然知道了，就替我记住它原本的意思。」',
            tradeHint: '她愿告诉你这个名字原本的含义',
            callName: {
                gainText: '🌙 你在她耳边轻轻唤了一声：「绯泪。」',
                msg: '她浑身一颤，二十年的冰霜寸寸碎裂。良久，她极轻地应了一声：「……嗯。」那一声里没有宫主，没有圣女，只有一个被叫出名字的姑娘。',
                affectionGain: 25, trustGain: 10, moodGain: 20
            }
        }
    };

    function getData(sid) {
        var d = LEVERAGE_DATA[sid];
        if (d) return d;
        // 类型默认兜底（门派秘密等未来接入时无需逐条配置）
        return {
            coerceGain: { spiritStones: 300 }, coerceRisk: 'mid',
            coerceMsg: '对方脸色变了变，最终默认了你手中的筹码。',
            coerceRefuseMsg: '对方勃然变色，拂袖而去——这条秘密没能换来好处，只换来仇恨。',
            tradeMsg: '对方长叹一声，向你吐露了许多不曾对人言及的内情。',
            tradeHint: '一次坦诚的深谈'
        };
    }

    // ==================== 告发配置（v13.7 二期） ====================
    // 每条：scene=告发演出段落；targetPenalty=被告发者的关系变动；sharedFriends=
    // 与其交好的NPC（极性传播扣分）；reputation={city,delta}防御式（城市不存在则跳过）；
    // worldFlag=一次性旗标（自有持久化+window.setFlag广播）；aftermath=世界变化结语。
    var EXPOSE_DATA = {
        merchant_secret_01: {
            label: '📢 告发官府',
            preview: '把十年禁品暗账递到京兆府案上：查抄、下狱、商界震动。长安声望-10。',
            scene: [
                '你把账簿的抄本递到了京兆府的案上。',
                '三日后，禁军封了万宝阁的分号。贾有道在衙役的锁链里回头看了你一眼——没有恨，只有疲惫：「我早说过，这笔账早晚有人来收。」',
                '帝都商界人心惶惶，人人都在打听是谁卖的谁。',
                '半月后狱中传来口信：他招了全部，只求一件事——别让儿子知道账本里还夹着信。'
            ],
            targetPenalty: { affection: -50 },
            sharedFriends: [],
            reputation: { city: '帝都·长安', delta: -10 },
            worldFlag: 'merchant_exposed',
            aftermath: '长安禁品渠道一夜清空。坊市物价平稳了，但商人们看你的眼神都变了。'
        },
        rival_secret_01: {
            label: '📢 告知正道',
            preview: '向正道长老交出暗桩证据：审查清算，一座城得救。柳随风敬重-20。',
            scene: [
                '名册抄本与布防图残页，经三层转手送到了几位长老案头。',
                '正道没有声张。他们只在云来城换了三次城防布置，然后在某个雨夜，「请」走了柳随风。',
                '临走前他托人带给你一句话：「卖得好。这一票，够我把牢底坐出花来——中秋那晚，替我看看那座城的灯。」'
            ],
            targetPenalty: { affection: -30, respect: -20 },
            sharedFriends: [],
            reputation: null,
            worldFlag: 'rival_exposed',
            aftermath: '审查营的日子很长。但中秋那夜云来城的灯火，比往年任何一年都亮。'
        },
        wenheng_secret_01: {
            label: '📢 散布江湖',
            preview: '义诊档案的存在一旦传开：病患恐慌、医道信任崩塌、百花谷震荡。灵素等医者对你-15。',
            scene: [
                '消息像瘟疫一样传遍茶馆酒肆：百花谷的药方底下，压着半个江湖的隐私。',
                '求医的人开始犹豫要不要说病情；有势力连夜派人回城，清点自己当年说过什么。',
                '第七天，温蘅来了。没有兴师问罪。她坐在你对面，笑眼弯弯地斟了两杯茶。',
                '「你说的没错。」她把其中一杯推到你手边，「所以我如今也知道你的一切了。——喝茶。往后这世上，就我们两个最诚实。」'
            ],
            targetPenalty: { affection: -40, trust: -20 },
            sharedFriends: ['healer_01'],
            reputation: null,
            worldFlag: 'wenheng_exposed',
            aftermath: '从那天起，你再没生过病去过任何医馆。而温蘅的茶，据说真的很好喝。'
        },
        // v13.8 三期：公开唤名——追杀令反噬（与私下唤名互为两极）
        xl_secret_01: {
            label: '📢 当众唤名',
            preview: '在群雄面前揭破修罗宫主的真名：北境追杀令将为你而发。此举必遭反噬。',
            scene: [
                '你在群雄聚集的武林大会上，当众唤出了那两个字。',
                '满堂死寂。三日后，北境各城门榜上都贴出了同样的画像——是你。修罗宫的追杀令，百年只出过三次。',
                '她亲自来了。剑抵住你咽喉的那一刻，你听见她极轻地说：「这个名字，娘只告诉过我一个人。你是第二个。」',
                '剑终究没有落下。她收剑入鞘，转身没入夜色：「活好。别让我后悔两次。」'
            ],
            targetPenalty: { affection: -100 },
            hostile: true,
            sharedFriends: [],
            reputation: null,
            worldFlag: 'feilei_exposed',
            aftermath: '追杀令始终没有撤。但从那天起，再也没有人见过修罗宫的杀手接近过你——有人说，那是宫主下的另一道密令。'
        }
    };

    // 温蘅的秘密底子（门派固定定义NPC，懒注入其实例）
    var SECT_LEVERAGE_SECRETS = {
        'sect_leader_百花谷': {
            'wenheng_secret_01': {
                id: 'wenheng_secret_01',
                title: '义诊档案',
                content: '百花谷二十年的义诊救人无数——但病人把脉时无意吐露的隐疾、家事、私隐，也全被温蘅记录归档。药房阁楼的那几口樟木箱里，锁着半个江湖的把柄。',
                desc: '她笑眼里的另一本账',
                type: 'personal',
                unlockConditions: [
                    { type: 'affection', min: 45 }
                ],
                unlocked: false
            }
        }
    };

    function injectSectLeverageSecrets() {
        if (!window.npcManager || typeof window.npcManager.getNPC !== 'function') return;
        Object.keys(SECT_LEVERAGE_SECRETS).forEach(function (npcId) {
            var npc = window.npcManager.getNPC(npcId);
            if (!npc) return; // 门派NPC懒创建，未访谷时跳过
            var firstId = Object.keys(SECT_LEVERAGE_SECRETS[npcId])[0];
            if (npc.secrets && npc.secrets[firstId]) return; // 已注入
            var src = SECT_LEVERAGE_SECRETS[npcId];
            npc.secrets = npc.secrets || {};
            Object.keys(src).forEach(function (sk) {
                npc.secrets[sk] = JSON.parse(JSON.stringify(src[sk]));
            });
        });
    }

    // ==================== 状态持久化（StateRegistry 外置） ====================
    // used: { 'npcId|secretId': 'traded' | 'used_coerce' | 'promised' | 'exposed' }
    // hostile: [npcId]    exposed: { key: true }（v13.7 二期）    flags: [worldFlag]
    var _st = { used: {}, hostile: [], exposed: {}, flags: [] };

    function key(npcId, sid) { return npcId + '|' + sid; }
    function usedState(npcId, sid) { return _st.used[key(npcId, sid)] || null; }

    function applyImport(d) {
        _st.used = {}; _st.hostile = []; _st.exposed = {}; _st.flags = [];
        if (d && typeof d === 'object') {
            if (d.used && typeof d.used === 'object') {
                Object.keys(d.used).forEach(function (k) {
                    var v = d.used[k];
                    if (v === 'traded' || v === 'used_coerce' || v === 'promised' || v === 'exposed' || v === 'used_call') _st.used[k] = v;
                });
            }
            if (Array.isArray(d.hostile)) {
                d.hostile.forEach(function (n) { if (typeof n === 'string') _st.hostile.push(n); });
            }
            if (d.exposed && typeof d.exposed === 'object') {
                Object.keys(d.exposed).forEach(function (k) { if (d.exposed[k]) _st.exposed[k] = true; });
            }
            if (Array.isArray(d.flags)) {
                d.flags.forEach(function (f) { if (typeof f === 'string') _st.flags.push(f); });
            }
        }
    }

    if (global_StateRegistry_ok()) {
        window.StateRegistry.register('secretLeverage', {
            version: 2,
            export: function () {
                return {
                    used: JSON.parse(JSON.stringify(_st.used)),
                    hostile: _st.hostile.slice(),
                    exposed: JSON.parse(JSON.stringify(_st.exposed)),
                    flags: _st.flags.slice()
                };
            },
            import: function (d) { applyImport(d); },
            reset: function () { _st = { used: {}, hostile: [], exposed: {}, flags: [] }; }
        });
    }
    function global_StateRegistry_ok() {
        return window.StateRegistry && typeof window.StateRegistry.register === 'function';
    }

    // ==================== 关系工具 ====================
    function rel(npc, field, delta, floor, ceil) {
        if (!npc.relationship) npc.relationship = {};
        var cur = npc.relationship[field] || 0;
        cur += delta;
        if (floor != null) cur = Math.max(floor, cur);
        if (ceil != null) cur = Math.min(ceil, cur);
        npc.relationship[field] = cur;
        return cur;
    }

    function grantGain(npc, gain) {
        var parts = [];
        if (!gain) return '(无)';
        if (gain.spiritStones) {
            if (window.inventory && window.inventory.currency) {
                window.inventory.currency.spiritStones = (window.inventory.currency.spiritStones || 0) + gain.spiritStones;
            } else if (window.currentCharData) {
                window.currentCharData.spiritStones = (window.currentCharData.spiritStones || 0) + gain.spiritStones;
            }
            if (window.updateCurrencyUI) window.updateCurrencyUI();
            parts.push('灵石+' + gain.spiritStones);
        }
        if (gain.item && typeof window.addItem === 'function') {
            window.addItem(gain.item, 1);
            parts.push((window.itemById && window.itemById[gain.item] && window.itemById[gain.item].name) || gain.item);
        }
        if (gain.favor) {
            rel(npc, 'favor', gain.favor);
            parts.push('人情+' + gain.favor);
        }
        return parts.join('，') || '(无)';
    }

    // ==================== 已解锁秘密枚举 ====================
    function knownSecrets(npc) {
        var out = [];
        var ks = npc.secrets ? Object.keys(npc.secrets) : [];
        ks.forEach(function (sid) {
            var s = npc.secrets[sid];
            if (s && s.unlocked) out.push({ id: sid, def: s });
        });
        return out;
    }

    // ==================== 动作实现 ====================
    function doCoerce(npc, sid, d) {
        var p = betrayChance(npc);
        var roll = Math.random();
        if (roll < p) {
            // 当场翻脸
            rel(npc, 'affection', TUNE.betrayAffectionHit, -100);
            rel(npc, 'trust', -(npc.relationship.trust || 0));
            if (npc.state) npc.state.mood = TUNE.betrayMood;
            if (_st.hostile.indexOf(npc.id) < 0) _st.hostile.push(npc.id);
            if (typeof npc.setFlag === 'function') npc.setFlag('leverage_hostile');
            _st.used[key(npc.id, sid)] = 'used_coerce';
            // v20.25 锁门如实告知：私人线自此闭，情面养回五成前不会重开（门禁见 canPlayerAccessPersonalEvent）
            window.showMessage('💔 ' + (d.coerceRefuseMsg || '对方勃然变色，与你决裂。') + '（其人的私人情谊线已锁——情面养回五成前，不会再单独见你。）', 'error');
        } else {
            var got = grantGain(npc, d.coerceGain);
            rel(npc, 'affection', TUNE.coerceAffectionHit, -100);
            rel(npc, 'trust', TUNE.coerceTrustFloor - (npc.relationship.trust || 0));
            rel(npc, 'respect', TUNE.coerceRespectHit);
            // v20.37 威压账：要挟得手的一刻威压落账——顺从不是信服，是怕
            rel(npc, 'fear', 15, 0, 100);
            if (npc.state) npc.state.mood = Math.max(5, (npc.state.mood || 50) + TUNE.coerceMoodHit);
            _st.used[key(npc.id, sid)] = 'used_coerce';
            window.showMessage('🃏 ' + d.coerceMsg + '（获得：' + got + '；好感' + TUNE.coerceAffectionHit + '，信任归零，威压+15）', 'success');
            // 隐忍型NPC的记恨提示
            var b5 = npc.personalityBig5 || {};
            if ((b5.neuroticism != null ? b5.neuroticism : 50) >= 55) {
                setTimeout(function () { window.showMessage('🌑 ' + npc.name + ' 顺从了，但你看得出来——这笔账，他记下了。', 'info'); }, 900);
            }
        }
        if (window.updateCharacterStatus) window.updateCharacterStatus();
    }

    function doTrade(npc, sid, d) {
        rel(npc, 'affection', TUNE.tradeAffection, -100, 100);
        rel(npc, 'respect', TUNE.tradeRespect, 0, 100);
        rel(npc, 'trust', TUNE.tradeTrust, 0, 100);
        if (npc.state) npc.state.mood = Math.min(100, (npc.state.mood || 50) + TUNE.tradeMood);
        _st.used[key(npc.id, sid)] = 'traded';
        window.showMessage('🤝 ' + d.tradeMsg + '（好感+' + TUNE.tradeAffection + '，敬重+' + TUNE.tradeRespect + '，信任+' + TUNE.tradeTrust + '）', 'success');
        if (window.updateCharacterStatus) window.updateCharacterStatus();
    }

    function doPromise(npc, sid, d) {
        rel(npc, 'trust', TUNE.promiseTrust, 0, 100);
        _st.used[key(npc.id, sid)] = 'promised';
        window.showMessage('🤐 你郑重许诺守口如瓶。' + npc.name + ' 看着你的眼睛，重重地点了点头。（信任+' + TUNE.promiseTrust + '；誓约已立，泄露必遭反噬——终章或有回响）', 'success');
        if (window.updateCharacterStatus) window.updateCharacterStatus();
    }

    // ==================== 告发（v13.7 二期） ====================
    function doExpose(npc, sid, cfg) {
        var k = key(npc.id, sid);
        _st.used[k] = 'exposed';
        _st.exposed[k] = true;
        if (cfg.worldFlag && _st.flags.indexOf(cfg.worldFlag) < 0) {
            _st.flags.push(cfg.worldFlag);
            if (typeof window.setFlag === 'function') { try { window.setFlag(cfg.worldFlag); } catch (e) {} }
        }
        // 被告发者的关系重挫
        if (cfg.targetPenalty) {
            Object.keys(cfg.targetPenalty).forEach(function (field) {
                var delta = cfg.targetPenalty[field];
                var floor = field === 'affection' ? -100 : null;
                var ceil = field === 'trust' || field === 'respect' ? 100 : null;
                if (field === 'trust') rel(npc, field, -(npc.relationship.trust || 0)); // trust清零再叠加负值无意义
                else rel(npc, field, delta, floor, ceil);
            });
        }
        // 反噬：彻底敌对（如绯泪公开唤名）
        if (cfg.hostile && _st.hostile.indexOf(npc.id) < 0) {
            _st.hostile.push(npc.id);
            if (typeof npc.setFlag === 'function') { try { npc.setFlag('leverage_hostile'); } catch (e) {} }
        }
        // 极性传播：共同好友
        var hurtFriends = [];
        (cfg.sharedFriends || []).forEach(function (fid) {
            var f = window.npcManager && window.npcManager.getNPC ? window.npcManager.getNPC(fid) : null;
            if (!f) return;
            rel(f, 'affection', TUNE.exposeFriendPenalty, -100);
            hurtFriends.push(f.name);
        });
        // 城市声望（防御式：城市不存在则跳过）
        if (cfg.reputation && cfg.reputation.city && typeof window.getReputationValue === 'function' && typeof window.reduceReputation === 'function' && typeof window.addReputation === 'function') {
            try {
                if (window.getReputationValue(cfg.reputation.city) != null) {
                    if (cfg.reputation.delta < 0) window.reduceReputation(cfg.reputation.city, -cfg.reputation.delta);
                    else window.addReputation(cfg.reputation.city, cfg.reputation.delta);
                }
            } catch (e) {}
        }
        if (window.updateCharacterStatus) window.updateCharacterStatus();
        playExposeScene(npc, cfg, hurtFriends);
    }

    function playExposeScene(npc, cfg, hurtFriends) {
        var paras = (cfg.scene || []).map(function (t) { return '<p class="text-sm text-gray-300 leading-relaxed">' + t + '</p>'; }).join('');
        var friendNote = hurtFriends.length ? '<p class="text-xs text-orange-300 mt-2">极性传播：' + hurtFriends.join('、') + ' 对你好感-' + TUNE.exposeFriendPenalty + '（他们无法认同出卖）。</p>' : '';
        var old = document.querySelector('.leverage-modal');
        if (old) old.remove();
        var modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50 leverage-modal';
        modal.onclick = function (e) { if (e.target === modal) modal.remove(); };
        modal.innerHTML =
            '<div class="bg-gray-800 border-2 border-red-600 rounded-xl p-6 max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto">' +
                '<h3 class="text-lg font-bold text-red-300 mb-3">📢 天下已知晓</h3>' +
                '<div class="space-y-3">' + paras + '</div>' +
                '<p class="text-xs text-yellow-500/90 mt-4 border-t border-gray-700 pt-3">' + (cfg.aftermath || '') + '</p>' +
                friendNote +
                '<button onclick="this.closest(\'.fixed\').remove(); SecretLeverage.openMenu(\'' + npc.id + '\')" class="mt-4 w-full bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded text-sm text-white">合上卷宗</button>' +
            '</div>';
        document.body.appendChild(modal);
    }

    // ==================== UI：筹码面板 ====================
    var STATE_BADGE = {
        traded: '<span class="text-xs text-green-400">✅ 已交换</span>',
        used_coerce: '<span class="text-xs text-red-400">🗡️ 已要挟</span>',
        promised: '<span class="text-xs text-blue-300">🤝 守密中</span>',
        exposed: '<span class="text-xs text-orange-400">📢 已告发</span>',
        used_call: '<span class="text-xs text-purple-300">🌙 已唤名</span>'
    };

    function openMenu(npcId) {
        var npc = window.npcManager && window.npcManager.getNPC ? window.npcManager.getNPC(npcId) : null;
        if (!npc) { if (window.showMessage) window.showMessage('NPC不存在', 'error'); return true; }
        injectSectLeverageSecrets(); // 门派秘密懒注入（幂等）
        var secrets = knownSecrets(npc);
        if (secrets.length === 0) {
            window.showMessage('🃏 你还没有掌握 ' + npc.name + ' 的任何秘密。（提升好感、推进其故事线可解锁）', 'info');
            return true;
        }
        var isHostile = _st.hostile.indexOf(npc.id) >= 0;

        var cards = '';
        secrets.forEach(function (item) {
            var sid = item.id, s = item.def;
            var st = usedState(npcId, sid);
            var badge = st ? (STATE_BADGE[st] || '') : '<span class="text-xs text-yellow-400">🃏 可用</span>';
            var d = getData(sid);
            var cfgExp = EXPOSE_DATA[sid];
            var p = betrayChance(npc);
            var btns = '';
            if (!st) {
                btns =
                    '<button onclick="SecretLeverage.confirmAct(\'' + npcId + '\',\'' + sid + '\',\'coerce\',' + p.toFixed(2) + ')" class="flex-1 bg-red-900/40 hover:bg-red-800/60 border border-red-700/50 px-2 py-1.5 rounded text-xs text-red-200">🗡️ 要挟</button>' +
                    '<button onclick="SecretLeverage.confirmAct(\'' + npcId + '\',\'' + sid + '\',\'trade\',0)" class="flex-1 bg-green-900/40 hover:bg-green-800/60 border border-green-700/50 px-2 py-1.5 rounded text-xs text-green-200">🤝 交换</button>' +
                    '<button onclick="SecretLeverage.confirmAct(\'' + npcId + '\',\'' + sid + '\',\'promise\',0)" class="flex-1 bg-blue-900/40 hover:bg-blue-800/60 border border-blue-700/50 px-2 py-1.5 rounded text-xs text-blue-200">🤐 守密</button>' +
                    (d.callName ? '<button onclick="SecretLeverage.confirmAct(\'' + npcId + '\',\'' + sid + '\',\'call_name\',0)" class="flex-1 bg-purple-900/40 hover:bg-purple-800/60 border border-purple-700/50 px-2 py-1.5 rounded text-xs text-purple-200">🌙 唤名</button>' : '') +
                    (cfgExp ? '<button onclick="SecretLeverage.confirmAct(\'' + npcId + '\',\'' + sid + '\',\'expose\',0)" class="flex-1 bg-orange-900/40 hover:bg-orange-800/60 border border-orange-700/50 px-2 py-1.5 rounded text-xs text-orange-200">' + cfgExp.label.split(' ')[0] + ' 告发</button>' : '');
            }
            cards +=
                '<div class="' + (st ? 'opacity-60 ' : '') + 'bg-gray-900/60 border border-gray-700 rounded-lg p-3 space-y-2">' +
                    '<div class="flex items-center gap-2">' +
                        '<span class="text-sm font-bold text-gray-200">' + (s.title || sid) + '</span>' +
                        '<span class="ml-auto">' + badge + '</span>' +
                    '</div>' +
                    '<p class="text-xs text-gray-400">' + (d.tradeHint || '') + '</p>' +
                    (btns ? '<div class="flex gap-2 pt-1">' + btns + '</div>' : '') +
                '</div>';
        });

        var old = document.querySelector('.leverage-modal');
        if (old) old.remove();
        var modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50 leverage-modal';
        modal.onclick = function (e) { if (e.target === modal) modal.remove(); };
        modal.innerHTML =
            '<div class="bg-gray-800 border-2 border-purple-500 rounded-xl p-6 max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto">' +
                '<div class="flex items-center gap-3 mb-3">' +
                    '<button onclick="this.closest(\'.fixed\').remove()" class="text-gray-400 hover:text-white text-lg">&larr;</button>' +
                    '<h3 class="text-lg font-bold text-purple-300">🃏 筹码 · ' + npc.name + '</h3>' +
                    '<button onclick="this.closest(\'.fixed\').remove()" class="text-gray-400 hover:text-white text-2xl ml-auto">&times;</button>' +
                '</div>' +
                (isHostile ? '<div class="mb-3 p-2 bg-red-950/60 border border-red-800 rounded text-xs text-red-300">☠️ 你们已因摊牌反目。此人的心门不会再为你打开。</div>' : '') +
                '<p class="text-xs text-gray-500 mb-3">每条秘密只能兑现一次。要挟必有所得，但关系必然受损，且有翻脸之险；交换与守密则以诚换诚。</p>' +
                '<div class="space-y-3">' + cards + '</div>' +
            '</div>';
        document.body.appendChild(modal);
        return true;
    }

    function confirmAct(npcId, sid, action, p) {
        var npc = window.npcManager && window.npcManager.getNPC ? window.npcManager.getNPC(npcId) : null;
        if (!npc) return;
        var d = getData(sid);
        var cfgExp = EXPOSE_DATA[sid];
        var title = action === 'coerce' ? '🗡️ 要挟' : action === 'trade' ? '🤝 交换' : action === 'promise' ? '🤐 守密承诺' : action === 'call_name' ? '🌙 私下唤名' : (cfgExp ? cfgExp.label : '📢 告发');
        var detail = '';
        if (action === 'coerce') {
            detail = riskLabel(parseFloat(p)) + '<br>所得必有，但好感' + TUNE.coerceAffectionHit + '、信任清零。真的撕破这层窗户纸吗？';
        } else if (action === 'trade') {
            detail = '以坦诚换坦诚：好感+' + TUNE.tradeAffection + '，敬重+' + TUNE.tradeRespect + '，信任+' + TUNE.tradeTrust + '。<br>「' + d.tradeHint + '」';
        } else if (action === 'promise') {
            detail = '立下守密之诺：信任+' + TUNE.promiseTrust + '。此后此事烂在肚里——若违诺，天下之大再无你容身之处。';
        } else if (action === 'call_name' && d.callName) {
            detail = d.gainText + '<br>以真名相唤：好感+' + d.callName.affectionGain + '，信任+' + d.callName.trustGain + '。<br><span class="text-purple-300">这个名字只在此刻属于你们两人。</span>';
        } else if (action === 'expose' && cfgExp) {
            var friends = (cfgExp.sharedFriends || []).map(function (fid) {
                var f = window.npcManager && window.npcManager.getNPC ? window.npcManager.getNPC(fid) : null;
                return f ? f.name : fid;
            }).filter(Boolean);
            detail = cfgExp.preview +
                '<br>被告发者关系重挫' +
                (friends.length ? '；<span class="text-orange-300">极性传播：' + friends.join('、') + ' 好感' + TUNE.exposeFriendPenalty + '</span>' : '') +
                '。<br><span class="text-red-300">此事无可挽回。</span>';
        }
        if (typeof window.showConfirm === 'function') {
            window.showConfirm(title, detail).then(function (ok) {
                if (!ok) return;
                act(npcId, sid, action);
            });
        } else {
            act(npcId, sid, action); // 无确认组件时直行
        }
    }

    function act(npcId, sid, action) {
        var npc = window.npcManager && window.npcManager.getNPC ? window.npcManager.getNPC(npcId) : null;
        if (!npc) return;
        if (usedState(npcId, sid)) { window.showMessage('这条秘密已经兑现过了。', 'warning'); return; }
        var s = npc.secrets && npc.secrets[sid];
        if (!s || !s.unlocked) { window.showMessage('你尚未掌握这个秘密。', 'warning'); return; }
        if (action === 'expose') {
            var cfgExp = EXPOSE_DATA[sid];
            if (!cfgExp) { window.showMessage('这条秘密没有可供告发的渠道。', 'info'); return; }
            doExpose(npc, sid, cfgExp);
            return; // 告发后由场景播放器收尾，不刷新筹码面板
        }
        var d = getData(sid);
        if (action === 'coerce') doCoerce(npc, sid, d);
        else if (action === 'trade') doTrade(npc, sid, d);
        else if (action === 'promise') doPromise(npc, sid, d);
        else if (action === 'call_name' && d.callName) doCallName(npc, sid, d.callName);
        // 刷新面板
        openMenu(npcId);
    }

    // 🌙 私下唤名（v13.8 三期）：温柔路线的独占动作
    function doCallName(npc, sid, cn) {
        rel(npc, 'affection', cn.affectionGain, -100, 100);
        rel(npc, 'trust', cn.trustGain, 0, 100);
        if (npc.state) npc.state.mood = Math.min(100, (npc.state.mood || 50) + (cn.moodGain || 15));
        _st.used[key(npc.id, sid)] = 'used_call';
        window.showMessage(cn.gainText + ' ' + cn.msg + '（好感+' + cn.affectionGain + '，信任+' + cn.trustGain + '）', 'success');
        if (window.updateCharacterStatus) window.updateCharacterStatus();
    }

    // ==================== 守密终章加成（v13.8 三期） ====================
    // 十条故事线终章：若该秘密处于 promised 态，追加一句专属收束旁白 + 好感/信任各+5（一次性）
    // 实现：包装每个终章事件的 _dynamicScenes 方法——在 batch1 内层wrapper重算scenes之后自然附加，
    // 不受 triggerPersonalEvent 包装层序影响，也不改动任何 batch 文件。
    var PROMISE_FINALE = {
        mentor01_event_5:     { npcId: 'mentor_01',     secretId: 'mentor_secret_01',     text: '散场时他送你到山门，忽然说：「那件事，你从没对人提起过。」——顿了顿，「这份分寸，比什么拜帖都贵重。」' },
        healer01_event_5:     { npcId: 'healer_01',     secretId: 'healer_secret_01',     text: '临别时她把一包药塞进你手里，轻声说：「我的事，你一直守口如瓶。这包药你随身带着——就当我陪你走江湖。」' },
        warrior01_event_5:    { npcId: 'warrior_01',    secretId: 'warrior_secret_01',    text: '他把酒碗和你碰了一下，没头没尾来了句：「八年了，这事我只跟你说过。」——这就是铁山式的道谢。' },
        merchant01_event_5:   { npcId: 'merchant_01',   secretId: 'merchant_secret_01',   text: '贾有道多送了你一份账本副本：「我这条命的把柄在你手里搁着——嘿，说真的，我这辈子没这么踏实过。」' },
        alchemist01_event_5:  { npcId: 'alchemist_01',  secretId: 'alchemist_secret_01',  text: '丹大师往你袖中塞了一颗丹药：「守炉人的秘密，只有同炉的人才配知道。你是半个同炉人了。」' },
        elder01_event_5:      { npcId: 'elder_01',      secretId: 'elder_secret_01',      text: '玄冰子破天荒地拍了拍你的肩：「雪下埋的事，你没往外扬。天山欠你一个情——记在账上。」' },
        rival01_event_5:      { npcId: 'rival_01',      secretId: 'rival_secret_01',      text: '柳随风隔着人群冲你拱了拱手，做了个封口的动作，笑骂了句：「嘴真严。交你这个朋友，不亏。」' },
        villager01_event_5:   { npcId: 'villager_01',   secretId: 'villager_secret_01',   text: '张大爷把木盒重新缠好油布放回房梁，回头对你咧嘴一笑：「娃，这世上知道的人就咱俩——挺好。」' },
        craftsman01_event_5:  { npcId: 'craftsman_01',  secretId: 'craftsman_secret_01',  text: '老王把粉笔板烧完的灰收进了个小铁盒：「二十年的事，如今天知地知你知我知。」他说这话时，肩膀松得像卸下了千斤担。' },
        mysterious01_event_5: { npcId: 'mysterious_01', secretId: 'mysterious_secret_01', text: '洞府门前，他最后一次向你确认般地点了点头：「第四盏灯的故事，出了这道门便只有你知道。——替我，也替他们，好好记着。」' }
    };

    function patchFinalePromiseBonus() {
        if (!window.NPC_PERSONAL_EVENTS) return;
        Object.keys(PROMISE_FINALE).forEach(function (eid) {
            var def = window.NPC_PERSONAL_EVENTS[eid];
            if (!def || typeof def._dynamicScenes !== 'function' || def.__sl_promise_patched) return;
            var origDS = def._dynamicScenes;
            var cfg = PROMISE_FINALE[eid];
            def._dynamicScenes = function () {
                var scs = origDS.call(def);
                try {
                    var flag = 'promise_bonus_' + cfg.npcId;
                    if (usedState(cfg.npcId, cfg.secretId) === 'promised') {
                        scs.push({ speaker: 'narrator', text: cfg.text });
                        if (_st.flags.indexOf(flag) < 0) {
                            _st.flags.push(flag);
                            var pn = window.npcManager && window.npcManager.getNPC ? window.npcManager.getNPC(cfg.npcId) : null;
                            if (pn) {
                                rel(pn, 'affection', 5, -100, 100);
                                rel(pn, 'trust', 5, 0, 100);
                            }
                        }
                    }
                } catch (e) { console.warn('[秘密系统] 终章守密加成失败:', e); }
                return scs;
            };
            def.__sl_promise_patched = true;
        });
    }

    // ==================== 集成注入（零侵入 npc-system.js） ====================
    function integrate() {
        // 1) 深谈分类新增「🃏 筹码」（静态占位子选项；动态内容由 openMenu 呈现）
        if (window.DEEP_TALK_CATEGORIES && !window.DEEP_TALK_CATEGORIES.leverage) {
            window.DEEP_TALK_CATEGORIES.leverage = {
                id: 'leverage',
                name: '🃏 筹码',
                icon: '🃏',
                description: '利用你知晓的秘密交涉',
                subOptions: [
                    { id: 'leverage_menu', name: '摊牌交涉', desc: '盘点手中掌握的秘密', minAffection: 0, affectionCost: 0 }
                ]
            };
        }
        // 2) 处理器注册（executeDeepTalkSubOption 会优先调度真实处理器）
        if (window.DEEP_TALK_REAL_HANDLERS) {
            window.DEEP_TALK_REAL_HANDLERS.leverage_menu = function (npcId) { return openMenu(npcId); };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            integrate();
            patchFinalePromiseBonus();
        });
    } else {
        integrate();
        patchFinalePromiseBonus();
    }

    // ==================== 导出 ====================
    window.SecretLeverage = {
        openMenu: openMenu,
        confirmAct: confirmAct,
        act: act,
        getState: usedState,
        isHostile: function (npcId) { return _st.hostile.indexOf(npcId) >= 0; },
        betrayChance: betrayChance
    };

    console.log('🃏 秘密系统2.0 已加载（要挟/交换/守密/告发/唤名 + 人格反制骰 + StateRegistry持久化 + 终章守密加成）');
})();
