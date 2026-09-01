/**
 * social-content.js — 社交页扩展：话题×7 + 情报×5 + 动态问候（v14.0）
 *
 * 让深谈的话题与情报从"几句预设"变成真实数据驱动的对话：
 *   - 话题：近况/兴趣/过往/未来/心事/梦想/抱怨 —— 从 memory、心情压力、喜好、
 *           已解锁秘密、background 目标、行囊心愿等真实状态生成，随关系深入而变化
 *   - 情报：坊市行情（声望折扣+随身贵重品）/ 秘境消息（低探索地标）/ 人物八卦
 *           （其他NPC的心愿与近况传闻）/ 门派动向 / 黑市消息（寄售概览）
 *   - 问候：外层替换为动态问候（宿敌冷语/低落关怀/老熟人熟稔/剧情呼应），保留 batch 链的自动触发副作用
 *
 * 集成方式（零侵入）：向 DEEP_TALK_REAL_HANDLERS 注入12个处理器（executeDeepTalkSubOption
 * 优先调度真实处理器）；包装 window.getGreeting 最外层。每日数值收益一次性防刷。
 *
 * v15.0 追问层：话题/情报首轮之后可在回复框内「🔍 追问一句」（每NPC每题每日限一次，
 * 仅关系达标路径提供）——二级对话2~3个回应选项带差异化效果（好感/信任/情分/心情/压力），
 * 选择以 recordPlayerAction('followup_<sub>') 记入 memory.impressions（随档持久化）；
 * 追问次数反过来驱动下一轮的开场口吻（熟稔度换档）。
 */
(function () {
    'use strict';

    // ==================== 小工具 ====================
    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function day() {
        try { return (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') ? window.timeSystem.getAbsoluteDay() : 0; } catch (e) { return 0; }
    }
    function itemName(id) {
        return (window.itemById && window.itemById[id] && (window.itemById[id].name || window.itemById[id].label)) || id;
    }
    // v15.0：preferences.likedItems/dislikedItems 元素是 {category, multiplier} 对象——统一取标签
    // v15.3 人称：按 NPC.gender 输出 他/她（动态文案统一走本助手）
    function ta(npc) { return npc && npc.gender === 'female' ? '她' : '他'; }
    function prefLabel(e) { return typeof e === 'string' ? e : ((e && (e.category || e.name)) || ''); }

    // ==================== v15.6 对话真实性：计时 / 情境分流 / 重复显性化 ====================
    function spendMinutes(mins, why) {
        try { if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') window.timeSystem.advanceTime(mins, why || '交谈'); } catch (e) {}
    }
    var TALK_SUBIDS = ['recent', 'hobbies', 'history', 'future', 'worries', 'dreams', 'complaints', 'market_prices', 'secret_realms', 'gossip', 'sect_movements', 'black_market'];
    // 今日已谈登记：走 memory.impressions 动态键（随既有存档持久化），登记时清昨日键防膨胀
    function wasTalkedToday(npcId, subId) {
        try { return !!window.npcManager.getNPC(npcId).memory.impressions['tk|' + day() + '|' + npcId + '|' + subId]; } catch (e) { return false; }
    }
    function markTalked(npcId, subId) {
        try {
            var npcTk = window.npcManager.getNPC(npcId);
            if (!npcTk || !npcTk.memory || !npcTk.memory.impressions) return;
            var dTk = day();
            TALK_SUBIDS.forEach(function (s) { delete npcTk.memory.impressions['tk|' + (dTk - 1) + '|' + npcId + '|' + s]; });
            npcTk.memory.impressions['tk|' + dTk + '|' + npcId + '|' + subId] = 1;
        } catch (e) {}
    }
    var REPEAT_TOPIC_POOL = [
        '「方才不是才说过么。」{name}有些意外你会再问一遍。',
        '「这话我说过了。」{name}语气平平，没再接茬。',
        '「……你又提这桩？」{name}挑了挑眉，把手里的活计拾了起来。'
    ];
    var REPEAT_INTEL_POOL = [
        '「行情方才不是报给你了？」{name}失笑，「消息又不会一炷香就变。」',
        '「耳朵倒是不大好用。」{name}把方才的话又省略着说了一遍。'
    ];
    // 情境分流：时机与场合决定话题（世界反应式——不灰锁、不计数）
    var HEAVY_TOPICS = { history: 1, future: 1, worries: 1, dreams: 1 };
    var LIGHT_TOPICS = { dreams: 1, future: 1, hobbies: 1 };
    function contextGate(npc, subId) {
        var affCg = (npc.relationship && npc.relationship.affection) || 0;
        var hrCg = currentHour();
        if ((hrCg >= 23 || hrCg < 5) && affCg < 60) {
            return '「夜深了……」{name}揉了揉眉心，"有事明日再叙吧。"';
        }
        var actCg = (npc.state && npc.state.currentActivity) || '';
        if (actCg && !/休|歇|闲|睡|用饭|进食/.test(actCg) && HEAVY_TOPICS[subId]) {
            return '「手上活计要紧——」{name}头也不抬，「改日罢。」';
        }
        var moodCg = (npc.state && npc.state.mood) != null ? npc.state.mood : 50;
        if (moodCg < 25 && LIGHT_TOPICS[subId]) {
            rel(npc, 'affection', -2, -100, 100);
            return '「……」{name}眼下显然没有说这些的兴致。（好感-2）';
        }
        return null;
    }
    var _dailyPaid = {}; // 'day|npcId|subId' → true（每日数值收益锁）
    function oncePerDay(npcId, subId) {
        var k = day() + '|' + npcId + '|' + subId;
        if (_dailyPaid[k]) return false;
        _dailyPaid[k] = true;
        return true;
    }

    function unlockedSecretTitles(npc) {
        if (!npc.secrets) return [];
        return Object.keys(npc.secrets).filter(function (k) { return npc.secrets[k].unlocked; }).map(function (k) { return npc.secrets[k]; });
    }
    function topBagItems(npc, n) {
        var inv = npc.inventory && Array.isArray(npc.inventory.items) ? npc.inventory.items : [];
        return inv.slice(0, n || 3).map(function (it) {
            return ((window.itemById && window.itemById[it.templateId] && window.itemById[it.templateId].name) || it.templateId);
        });
    }
    function b5(npc, key, dft) {
        var b = npc.personalityBig5 || {};
        return (b[key] != null ? b[key] : (dft != null ? dft : 50)) / 100;
    }

    // ==================== 话题生成器 ====================
    var TOPIC_GENERATORS = {
        recent: function (npc) {
            var mood = (npc.state && npc.state.mood) != null ? npc.state.mood : 50;
            var act = npc.state && npc.state.currentActivity;
            var wants = window.NpcInventory ? window.NpcInventory.activeWants(npc.id) : [];
            var lines = [];
            if (mood >= 70) {
                lines.push(npc.name + '今天气色很好' + (act ? '，正忙着' + act : '') + '。');
                lines.push(pick(['「托你的福，近来诸事顺遂。」', '「日子过得不错——难得的清净。」']));
            } else if (mood < 30) {
                lines.push(npc.name + '的神色有些疲惫' + (act ? '，手上的' + act + '也停了下来' : '') + '。');
                lines.push(pick(['「……还好。就是有点累。」', '「没什么。见到你，稍微好受了些。」']));
            } else {
                lines.push(npc.name + '放下手头的事与你攀谈' + (act ? '（方才在做' + act + '）' : '') + '。');
                lines.push(pick(['「照旧。修行嘛，一日不看便觉得荒废。」', '「平平淡淡才是真——你呢？」']));
            }
            if (wants.length) lines.push('闲聊中' + ta(npc) + '提起，还缺' + itemName(wants[0].id) + '。');
            if ((npc.relationship && npc.relationship.affection || 0) >= 50 && oncePerDay(npc.id, 'recent')) {
                lines.push('你们多聊了几句家常。（好感+1）');
                npc.changeAffection(1);
            }
            return lines.join('\n');
        },
        hobbies: function (npc) {
            var pref = npc.preferences || {};
            var likes = (pref.likedItems || []).map(prefLabel).filter(Boolean);
            var dislikes = (pref.dislikedItems || []).map(prefLabel).filter(Boolean);
            var lines = [];
            if (likes.length) {
                lines.push('说起喜欢的东西，' + npc.name + '来了兴致：「' + likes.slice(0, 2).join('和') + '，一碰上就挪不开眼。」');
            } else {
                lines.push('「爱好？」' + ta(npc) + '想了想，「修行人的爱好，大都不务正业。」');
            }
            if (dislikes.length) {
                lines.push('至于' + dislikes[0] + '——' + ta(npc) + '摆了摆手：「别在我面前提这个。」');
            } else if (b5(npc, 'openness') > 0.6) {
                lines.push(ta(npc) + '倒是对新奇物件来者不拒：「天下奇物，看一眼是一眼的缘分。」');
            }
            return lines.join('\n');
        },
        history: function (npc) {
            var secrets = unlockedSecretTitles(npc);
            var lines = [];
            if (secrets.length) {
                var s = secrets[secrets.length - 1];
                lines.push('话说到深处，' + npc.name + '顿了一顿：「有些事……你既然已经知道了，我也不必再瞒。」');
                lines.push(ta(npc) + '隐约提起了「' + s.title + '」相关的往事，语气平静了许多——说出来，果然是会轻一些的。');
            } else if (npc.background && npc.background.history) {
                lines.push(npc.name + '讲起了自己的来历：「' + String(npc.background.history).slice(0, 80) + '……」');
                lines.push((npc.relationship && npc.relationship.affection || 0) >= 40 ? '讲到动情处，' + ta(npc) + '的眼神柔和了几分。' : '讲完' + ta(npc) + '便岔开了话题。');
            } else {
                lines.push('「我的过去？」' + ta(npc) + '笑了笑，「说来话长——等你我更熟些再讲吧。」');
            }
            return lines.join('\n');
        },
        future: function (npc) {
            var goal = npc.background && npc.background.goal;
            var aff = (npc.relationship && npc.relationship.affection) || 0;
            var lines = [];
            if (goal) {
                lines.push('谈起将来，' + npc.name + '的目光亮了起来：「' + goal + '。」');
                if (aff >= 60) lines.push(pick(['「到时候……你要是有空，陪我一起看看。」', '「这条路不好走。有你同行，胆气都壮几分。」']));
                else lines.push('说完' + ta(npc) + '自己笑了笑：「远着呢。一步一步走吧。」');
            } else {
                lines.push('「未来？」' + ta(npc) + '望向远处，「走一步算一步。修仙人的打算，赶不上变化。」');
            }
            return lines.join('\n');
        },
        worries: function (npc) {
            var stress = (npc.state && npc.state.stress) != null ? npc.state.stress : 20;
            var secrets = unlockedSecretTitles(npc);
            var lines = [];
            if (stress > 45) {
                lines.push(npc.name + '犹豫了很久，还是开了口：近日' + (npc.occupation || '门中') + '的事压得' + ta(npc) + '喘不过气。');
                lines.push('你静静听着，适时递了一句宽慰。（信任+2）');
                if (oncePerDay(npc.id, 'worries')) rel(npc, 'trust', 2, 0, 100);
            } else if (secrets.length) {
                lines.push(npc.name + '欲言又止，最后只是摇摇头：「没什么。……对了，」' + ta(npc) + '岔开话题，「你近来可好？」');
                lines.push('有些心事，还不到说的时候。');
            } else {
                lines.push('「烦恼？」' + ta(npc) + '想了想，「见了你，就没什么烦恼了。」——说得自然，倒叫你不好接话。');
            }
            return lines.join('\n');
        },
        dreams: function (npc) {
            var goal = npc.background && npc.background.goal;
            var aff = (npc.relationship && npc.relationship.affection) || 0;
            var lines = [];
            if (goal) {
                lines.push('夜色正好，' + npc.name + '难得说了句掏心窝的话：「若有一天' + goal + '成了真……」');
                lines.push(aff >= 60 ? '「……罢了，说给你听也无妨。反正这世上，我最信的就是你的耳朵。」' : '「做梦而已，你就当听个乐子。」');
            } else {
                lines.push('「梦？」' + ta(npc) + '想了想，「以前有的。后来忙着活，就忘了。」——语气平淡得让人心酸。');
            }
            return lines.join('\n');
        },
        complaints: function (npc) {
            var lines = [];
            var others = [];
            try {
                if (window.npcManager && window.npcManager.npcs) {
                    window.npcManager.npcs.forEach(function (o) { if (o.id !== npc.id && o.location === npc.location) others.push(o); });
                }
            } catch (e) {}
            var city = (window.currentCharData && window.currentCharData.location) || '';
            var disc = (typeof window.getReputationDiscount === 'function' && city) ? window.getReputationDiscount(city) : null;
            if (disc != null && disc <= 0.95) {
                lines.push(npc.name + '抱怨起坊市物价：「如今这价钱，都是给你们这些' + city + '的熟面孔让利惯出来的！」');
            } else if (others.length) {
                var o = pick(others);
                lines.push(npc.name + '压低声音吐槽' + o.name + '：「你说' + ta(o) + '，整天' + pick(['神神叨叨', '一毛不拔', '自以为是', '咋咋呼呼']) + '——啧。」');
            } else {
                lines.push(pick([
                    npc.name + '吐槽最近的天气：「这鬼天气，丹炉都受潮。」',
                    npc.name + '抱怨修行：「瓶颈卡了三个月，看见蒲团就想踹。」',
                    npc.name + '叹气：「世道啊……算了，不说了，说了也没用。」'
                ]));
            }
            lines.push('发完牢骚，' + ta(npc) + '看起来痛快多了。（心情+3）');
            if (npc.state) npc.state.mood = Math.min(100, (npc.state.mood || 50) + 3);
            return lines.join('\n');
        }
    };

    // ==================== 情报生成器 ====================
    var INTEL_GENERATORS = {
        market_prices: function (npc) {
            var lines = [];
            var city = (window.currentCharData && window.currentCharData.location) || '';
            try {
                if (typeof window.getReputationDiscount === 'function' && city) {
                    var disc = window.getReputationDiscount(city);
                    if (disc != null) lines.push('「你在' + city + '的脸面值钱——买卖能按' + Math.round(disc * 100) + '%算。」');
                }
            } catch (e) {}
            try {
                var inv = (window.inventory && window.inventory.slots) ? window.inventory.slots.filter(Boolean) : [];
                var priced = inv.map(function (s) {
                    var t = (typeof s.getTemplate === 'function') ? s.getTemplate() : (window.itemById ? window.itemById[s.templateId] : null);
                    return { name: (t && t.name) || s.templateId, price: (t && t.price) || 0 };
                }).filter(function (x) { return x.price > 0; }).sort(function (a, b) { return b.price - a.price; }).slice(0, 2);
                if (priced.length) {
                    lines.push('「你身上那' + priced.map(function (x) { return x.name + '（约' + x.price + '灵石）'; }).join('、') + '——出手前多问两家价。」');
                } else {
                    lines.push('「囊中羞涩就先囤货。低价收的东西，总有高价卖的一天。」');
                }
            } catch (e) {}
            if (!lines.length) lines.push('「行情嘛……问我就对了。改天细说。」');
                lines.push('（情报来源：' + npc.name + '的生意经）');
            return lines.join('\n');
        },
        secret_realms: function (npc) {
            var lines = [];
            try {
                var data = window.LANDMARK_EXPLORE_DATA || {};
                var entries = Object.keys(data).map(function (k) { return data[k]; })
                    .sort(function (a, b) { return (a.exploreProgress || 0) - (b.exploreProgress || 0); });
                if (entries.length) {
                    entries.slice(0, 2).forEach(function (l) {
                        lines.push('「' + l.icon + ' ' + l.name + '——' + String(l.desc || '').slice(0, 24) + '。探索度才' + (l.exploreProgress || 0) + '%，好东西都在没人去的地方。」');
                    });
                } else {
                    lines.push('「秘境？等哪天有了准信，第一个告诉你。」');
                }
            } catch (e) { lines.push('「秘境的消息，得花点代价才买得到。」'); }
            return lines.join('\n');
        },
        gossip: function (npc) {
            var lines = [];
            try {
                if (window.NpcInventory && window.npcManager && typeof window.npcManager.getNPC === 'function') {
                    var rumors = [];
                    ['warrior_01', 'healer_01', 'merchant_01', 'craftsman_01', 'alchemist_01'].forEach(function (nid) {
                        if (nid === npc.id) return;
                        var o = window.npcManager.getNPC(nid);
                        if (!o) return;
                        var ws = window.NpcInventory.activeWants(nid);
                        if (ws.length) rumors.push('听说' + o.name + '正在四处找「' + itemName(ws[0].id) + '」，肯出好价钱');
                    });
                    if (rumors.length) lines.push(pick(rumors) + '。');
                }
            } catch (e) {}
            try {
                if (window.SecretLeverage && window.currentCharData) {
                    // 世界已告发的事件化作江湖风闻（按旗标）
                    var snap = window.StateRegistry && window.StateRegistry.exportAll ? window.StateRegistry.exportAll().secretLeverage : null;
                    if (snap && snap.data && Array.isArray(snap.data.flags)) {
                        if (snap.data.flags.indexOf('wenheng_exposed') >= 0) lines.push('「听说了吗？百花谷那本义诊档案的事——现在谁看病都不敢多说话喽。」');
                        else if (snap.data.flags.indexOf('rival_exposed') >= 0) lines.push('「云来城换防的事传开了，都说正道里出了位深藏不露的高人。」');
                    }
                }
            } catch (e) {}
            if (!lines.length) {
                lines.push(pick([
                    '「八卦？」' + ta(npc) + '挤挤眼，「免费的可不值钱。——请我喝一杯再说。」',
                    '「最近风平浪静，怪事都懒得出。你安心修炼吧。」'
                ]));
            }
            return lines.join('\n');
        },
        sect_movements: function (npc) {
            var lines = [];
            try {
                var sect = window.currentCharData && window.currentCharData.sect;
                if (sect) lines.push('「' + sect + '近来还算安稳。掌门闭关的传闻倒是传了一阵——真假不知。」');
            } catch (e) {}
            try {
                var tasks = window.activeTasks;
                if (Array.isArray(tasks) && tasks.length) {
                    lines.push('「你们手头还压着' + tasks.length + '件没办完的差事吧？门里的眼睛可都盯着呢。」');
                }
            } catch (e) {}
            try {
                if (window.LANDMARK_EXPLORE_DATA) {
                    var names = Object.keys(window.LANDMARK_EXPLORE_DATA);
                    if (names.length) lines.push('「对了，' + names[Math.floor(Math.random() * names.length)] + '那边最近不太平，路过的都绕着走。」');
                }
            } catch (e) {}
            if (!lines.length) lines.push('「各门各派，表面客气，底下各有算盘。——你也快会习惯了。」');
            return lines.join('\n');
        },
        black_market: function (npc) {
            var lines = [];
            try {
                if (typeof window.getMarkedForSaleItems === 'function') {
                    var marked = window.getMarkedForSaleItems() || [];
                    if (marked.length) {
                        lines.push('「你自己挂售的那几样我都看见了——定价太高，有价无市。」');
                    } else {
                        lines.push('「你没寄售东西？也好，那摊子的水很深。」');
                    }
                }
            } catch (e) {}
            lines.push(pick([
                '「黑市的消息，用灵石换。今日就算了——看你面子，白送一句：最近查得严，别乱收货。」',
                '「想知道黑市开在哪？先把你的嘴缝紧了再说。」'
            ]));
            return lines.join('\n');
        }
    };

    // ==================== v15.0 追问层：二级对话 + 印记后果 ====================
    var _fuPaid = {}; // 'fu|day|npcId|subId' → true（每日追问锁，独立于数值收益的键空间）
    function fuOncePerDay(npcId, subId) {
        var k = 'fu|' + day() + '|' + npcId + '|' + subId;
        if (_fuPaid[k]) return false;
        _fuPaid[k] = true;
        return true;
    }
    function fuCount(npc, subId) {
        try { return (npc.memory && npc.memory.impressions && npc.memory.impressions['followup_' + subId]) || 0; } catch (e) { return 0; }
    }
    var FU_INTEL = { market_prices: 1, secret_realms: 1, gossip: 1, sect_movements: 1, black_market: 1 };
    // 印记换档：追问越多的关系，下一轮开口越熟稔
    function familiarityLine(npc, subId) {
        var n = fuCount(npc, subId);
        if (n >= 5) return pick(FU_INTEL[subId] ? [
            '「又来打听消息。」' + ta(npc) + '放下手里的活——问得多了，' + ta(npc) + '也懒得绕弯子。',
            '「你这耳朵，比门派的探子还灵。」' + ta(npc) + '半是调侃地开了口。'
        ] : [
            '「又是你。」' + ta(npc) + '放下手头的事——你们之间早有一套默契，话头一开就知道往哪儿去。',
            '「三句话不离老本行。」' + ta(npc) + '笑着摇头，倒没拒绝。'
        ]);
        if (n >= 2) return pick(FU_INTEL[subId] ? [
            '「还打听？」' + ta(npc) + '挑挑眉，语气里却带着熟稔。',
            '老主顾似的，你们直接聊起了上回的消息。'
        ] : [
            '「又聊起这个。」' + ta(npc) + '嘴角带了点笑意。',
            '熟门熟路地，你们接上了上回的话头。'
        ]);
        return '';
    }

    // 追问生成器：与首轮同源的真实状态 → 补充反应 + 2~3个差异化选项
    var FOLLOWUP_BUILDERS = {
        recent: function (npc) {
            var mood = (npc.state && npc.state.mood) != null ? npc.state.mood : 50;
            var wants = window.NpcInventory ? window.NpcInventory.activeWants(npc.id) : [];
            var text, choices = [];
            if (mood >= 70) {
                text = npc.name + '被你问住了，笑道：「要说顺心的……还真有一件。」';
                choices.push({ label: '💕 洗耳恭听', aff: 1, mood: 1, kind: 'positive', reply: pick(['「没什么大事。只是觉得这阵子遇上的都是善缘。」' + ta(npc) + '说着看了你一眼。', '「昨夜行气格外顺畅。许是心里踏实了，气也顺了。」']) });
            } else if (mood < 30) {
                text = '「近况？」' + npc.name + '苦笑，「你都看见了，就这么回事。」';
                choices.push({ label: '💕 递上一句宽慰', aff: 2, mood: 3, kind: 'positive', reply: pick([ta(npc) + '沉默片刻：「……嗯。谢谢你问这一句。」', '「借你吉言。」' + ta(npc) + '的肩背松了几分。']) });
            } else {
                text = npc.name + '想了想：「照旧修行。倒是有桩小事，一直搁在心里。」';
                choices.push({ label: '💕 愿意听' + ta(npc) + '说', aff: 1, mood: 1, kind: 'positive', reply: pick(['「也不是什么要紧事。就是觉得日子过得快，修为却慢。」', '「攒了些灵石，想换口好些的丹炉——就是舍不得旧的那个。」']) });
            }
            if (wants.length) choices.push({ label: '🎁 问' + ta(npc) + '是不是缺' + itemName(wants[0].id), aff: 2, favor: 1, kind: 'positive',
                bonus: function () { return '（' + ta(npc) + '正四处寻' + itemName(wants[0].id) + '——或许你能帮上忙。）'; },
                reply: ta(npc) + '眼睛一亮：「你消息倒灵通。若真寻到，我必不亏待你。」' });
            choices.push({ label: '🚪 不多打扰', kind: 'neutral', reply: ta(npc) + '点点头：「改日再叙。」' });
            return { text: text, choices: choices };
        },
        hobbies: function (npc) {
            var likes = ((npc.preferences && npc.preferences.likedItems) || []).map(prefLabel).filter(Boolean);
            var text, choices = [];
            if (likes.length) {
                text = '提到' + likes[0] + '，' + npc.name + '的话匣子就关不上了。';
                choices.push({ label: '💕 请' + ta(npc) + '讲讲这件爱好的来历', aff: 2, kind: 'positive', reply: pick(['「小时候在山下集市第一次见着，就走不动道了。」' + ta(npc) + '说得轻描淡写，眼里却有光。', '「修行苦。总得留一样东西，提醒自己活着不只是吐纳。」']) });
            } else {
                text = '「爱好……」' + npc.name + '沉吟片刻，「说起来，我倒想学一样新的。」';
                choices.push({ label: '💕 提议改日同去见识', aff: 2, kind: 'positive', reply: '「好啊。」' + ta(npc) + '答应得出乎意料地快。' });
            }
            choices.push({ label: '💢 笑' + ta(npc) + '玩物丧志', aff: -2, mood: -2, kind: 'negative', reply: npc.name + '脸一沉：「修行是死人的事。——告辞。」气氛僵住了。' });
            choices.push({ label: '🚪 岔开话题', kind: 'neutral', reply: '你们说起了别的。' });
            return { text: text, choices: choices };
        },
        history: function (npc) {
            var secrets = unlockedSecretTitles(npc);
            var locked = 0;
            try { Object.keys(npc.secrets || {}).forEach(function (k) { if (!npc.secrets[k].unlocked) locked++; }); } catch (e) {}
            var aff = (npc.relationship && npc.relationship.affection) || 0;
            var text, choices = [];
            if (secrets.length) {
                text = '既然「' + secrets[secrets.length - 1].title + '」都说过了，' + npc.name + '不再讳言往事。';
                choices.push({ label: '💔 问那段日子里' + ta(npc) + '失去了什么', aff: 3, trust: 1, kind: 'positive', reply: pick(['「失去的东西？」' + ta(npc) + '望了很远，「名字、故人、来路。都算吧。」', ta(npc) + '摇头笑了笑：「问得太深了，今日到此为止。」——但你看见' + ta(npc) + '握紧又松开的手。']) });
            } else if (npc.background && npc.background.history) {
                text = npc.name + '把来历又讲细了一层：「……后来，我就到了这里。」';
                choices.push({ label: '💬 追问后来的故事', aff: aff >= 60 ? 2 : 1, kind: 'positive', reply: '「后来的事，等哪天酒逢知己再说。」' + ta(npc) + '卖了个关子。' });
            } else {
                text = '「过去的事，」' + npc.name + '摆摆手，「不提也罢。」';
                choices.push({ label: '💕 不再勉强', aff: 1, kind: 'positive', reply: ta(npc) + '有些意外你的体贴：「……多谢。」' });
            }
            if (locked > 0) choices.push({ label: '🕳️ 旁敲侧击' + ta(npc) + '未言的心事', aff: -1, kind: 'negative',
                bonus: function () { return '（' + ta(npc) + '还有' + locked + '桩秘密未曾言明——交浅言深，反倒让' + ta(npc) + '起了戒心。）'; },
                reply: npc.name + '眼神一暗：「有些事，不是你不配知道，是时候没到。」' });
            choices.push({ label: '🚪 作罢', kind: 'neutral', reply: '往事随风，不必尽述。' });
            return { text: text, choices: choices };
        },
        future: function (npc) {
            var goal = npc.background && npc.background.goal;
            var aff = (npc.relationship && npc.relationship.affection) || 0;
            var text, choices = [];
            if (goal) {
                text = '「' + goal + '。」' + npc.name + '重复着自己的目标，「说出口，就当立了字据。」';
                choices.push({ label: '💕 许诺见证' + ta(npc) + '走到那一步', aff: aff >= 60 ? 3 : 2, kind: 'positive', reply: pick(['「好。」' + ta(npc) + '没有笑，郑重地点了点头。', '「口说无凭。」' + ta(npc) + '难得开了句玩笑，「到时候可别缺席。」']) });
                if (aff >= 60) choices.push({ label: '🤝 问' + ta(npc) + '需要什么帮助', favor: -1, kind: 'positive', reply: '「帮我盯着点消息就好。路终究要自己走。」' + ta(npc) + '顿了顿，「有你这句话，就够了。」' });
            } else {
                text = '「未来？」' + npc.name + '自嘲一笑，「我的打算，向来赶不上变化。」';
                choices.push({ label: '💬 劝' + ta(npc) + '定一个目标', aff: 1, kind: 'positive', reply: '「……你说得对。」' + ta(npc) + '认真了起来。' });
            }
            choices.push({ label: '🚪 各自前程，不必同路', aff: -1, kind: 'neutral', reply: ta(npc) + '挑眉：「也是。」话题就此打住。' });
            return { text: text, choices: choices };
        },
        worries: function (npc) {
            var stress = (npc.state && npc.state.stress) != null ? npc.state.stress : 20;
            var secrets = unlockedSecretTitles(npc);
            var text, choices = [];
            if (stress > 45) {
                text = npc.name + '压低声音：「不瞒你说，我近来夜里总睡不安稳。」';
                choices.push({ label: '💕 陪' + ta(npc) + '安静坐一会儿', aff: 2, mood: 3, calmStress: true, kind: 'positive', reply: '两人无言坐了半晌。「……好些了。」' + ta(npc) + '揉了揉眉心。' });
                if (secrets.length) choices.push({ label: '🔐 把话头轻轻引向' + ta(npc) + '提过的心事', aff: 1, mood: 1, calmStress: true, kind: 'positive', reply: ta(npc) + '犹豫良久，还是说了几句。说出来，眉头果然松开了些。' });
            } else {
                text = '「烦心？」' + npc.name + '摇头，「眼下还算安生。谢你惦记。」';
                choices.push({ label: '💕 叮嘱' + ta(npc) + '有事开口', aff: 1, kind: 'positive', reply: '「嗯。」' + ta(npc) + '应下了，语气比平日软和。' });
            }
            choices.push({ label: '💢 不当回事', aff: -1, mood: -1, kind: 'negative', reply: ta(npc) + '讪讪收了话头，神色淡了下去。' });
            return { text: text, choices: choices };
        },
        dreams: function (npc) {
            var goal = npc.background && npc.background.goal;
            var text, choices = [];
            if (goal) {
                text = '说起梦想，' + npc.name + '的声音轻了下来：「' + goal + '。——这话我只对你说。」';
                choices.push({ label: '🔒 告诉' + ta(npc) + '你会守口如瓶', aff: 2, trust: 1, kind: 'positive', reply: '「我知道。」' + ta(npc) + '笑了，「所以才敢说给你听。」' });
                choices.push({ label: '💢 泼冷水：太遥远了', aff: -3, mood: -2, kind: 'negative', reply: '空气冷了一瞬。「……是啊，遥远。」' + ta(npc) + '再没提过这两个字。' });
            } else if (b5(npc, 'openness') > 0.6) {
                text = '「梦想啊，」' + npc.name + '眼睛发亮，「我想看遍天下奇景——书上画的那种！」';
                choices.push({ label: '🤝 与' + ta(npc) + '约定互通见闻', aff: 2, kind: 'positive', reply: '「一言为定！」' });
            } else {
                text = '「修行人谈什么梦想。」' + npc.name + '别开眼，「把眼前过好就行。」';
                choices.push({ label: '💬 说' + ta(npc) + '其实有', aff: 1, kind: 'positive', reply: ta(npc) + '被你说中了什么，耳根有点红：「胡说。」' });
            }
            choices.push({ label: '🚪 听听就好', kind: 'neutral', reply: '梦想这种东西，说与不说都在那里。' });
            return { text: text, choices: choices };
        },
        complaints: function (npc) {
            var mood = (npc.state && npc.state.mood) != null ? npc.state.mood : 50;
            var others = [];
            try { if (window.npcManager && window.npcManager.npcs) { window.npcManager.npcs.forEach(function (o) { if (o.id !== npc.id && o.location === npc.location) others.push(o); }); } } catch (e) {}
            var text = mood < 50 ? ('「你还问？」' + npc.name + '火气未消。') : ('「抱怨完了，」' + npc.name + '哼了一声，「心里倒是松快些。」');
            var choices = [{ label: '💬 顺着' + ta(npc) + '的话头附和两句', mood: 3, aff: 1, kind: 'positive',
                reply: pick(['「哈哈哈——你这张嘴啊！」' + ta(npc) + '郁气散了大半。', '有人同仇敌忾，' + ta(npc) + '越说越畅快，最后自己先笑了。']) }];
            if (others.length) { var o = pick(others);
                choices.push({ label: '❓ 问' + ta(npc) + '和' + o.name + '的过节', kind: 'neutral', reply: '「没什么大不了的。」' + ta(npc) + '摆摆手，语气却不自觉地硬了几分。' }); }
            choices.push({ label: '💊 劝' + ta(npc) + '少动气，伤肝', mood: 1, kind: 'neutral', reply: '「道理我都懂。」' + ta(npc) + '翻了个白眼，还是点了点头。' });
            return { text: text, choices: choices };
        },
        market_prices: function (npc) {
            var top = null;
            try {
                var inv = (window.inventory && window.inventory.slots) ? window.inventory.slots.filter(Boolean) : [];
                inv.forEach(function (s) {
                    var t = (typeof s.getTemplate === 'function') ? s.getTemplate() : (window.itemById ? window.itemById[s.templateId] : null);
                    var p = t ? (t.price || 0) : 0;
                    if (p && (!top || p > top.price)) top = { name: (t.name || s.templateId), price: p };
                });
            } catch (e) {}
            var text = '「还想听？」' + npc.name + '眯起眼，「行情的水，深着呢。」';
            var choices = [
                { label: '💰 问' + (top ? ('身上的' + top.name + '该在哪出手') : '东西该在哪出手'), kind: 'positive', aff: 1,
                    reply: top ? ('「' + top.name + '？别在本地贱卖。往大城坊市走一圈，价钱能翻着番地谈。」') : ('「货比三家不吃亏。急着出手的，从来卖不上价。」') },
                { label: '❓ 问' + ta(npc) + '为何肯教你这些', kind: 'neutral', aff: 1, reply: '「多个朋友多条路。」' + ta(npc) + '说得轻巧，眼里却有几分认真。' }
            ];
            return { text: text, choices: choices };
        },
        secret_realms: function (npc) {
            var low = null;
            try {
                var data = window.LANDMARK_EXPLORE_DATA || {};
                Object.keys(data).forEach(function (k) { var l = data[k]; if (!low || (l.exploreProgress || 0) < (low.exploreProgress || 0)) low = l; });
            } catch (e) {}
            var text = low ? ('「' + low.name + '——」' + npc.name + '一字一顿，「探索度才' + (low.exploreProgress || 0) + '%。你去过几次？」')
                           : ('「秘境的门，」' + npc.name + '缓缓道，「只为准好的人开。」');
            var choices = [
                { label: '💬 承认没去过几次', kind: 'positive', aff: 1, reply: '「那就对了。」' + ta(npc) + '意味深长，「没人去的地方，才轮得到你去捡漏。」' },
                { label: '🤝 邀' + ta(npc) + '有空同行探一趟', kind: 'positive', aff: 2, favor: -1,
                    reply: pick(['「等我备齐符箓。」' + ta(npc) + '没有推脱。', '「你倒是敢想。」' + ta(npc) + '看了你半晌，「……容我想想。」']) },
                { label: '❓ 问' + ta(npc) + '消息从何听来', kind: 'neutral', reply: '「江湖上腿长的人多。」' + ta(npc) + '卖了个关子，「反正不是我编的。」' }
            ];
            return { text: text, choices: choices };
        },
        gossip: function (npc) {
            var rumors = [];
            try {
                if (window.NpcInventory && window.npcManager && typeof window.npcManager.getNPC === 'function') {
                    ['warrior_01', 'healer_01', 'merchant_01', 'craftsman_01', 'alchemist_01'].forEach(function (nid) {
                        if (nid === npc.id) return;
                        var o = window.npcManager.getNPC(nid);
                        if (!o) return;
                        var ws = window.NpcInventory.activeWants(nid);
                        if (ws.length) rumors.push(o.name + '正在四处找「' + itemName(ws[0].id) + '」');
                    });
                }
            } catch (e) {}
            var text = rumors.length > 1 ? ('见你不急着走，' + npc.name + '笑了笑：「还想听？那得看你想听多深。」')
                                          : ('「八卦这东西，」' + npc.name + '压低声音，「越挖越有意思。」');
            var choices = [];
            if (rumors.length) choices.push({ label: '🔍 追问：还有谁在收东西', kind: 'positive', aff: 1,
                bonus: function () { return '（' + ta(npc) + '把知道的全倒了出来：\n· ' + rumors.join('\n· ') + '\n——行囊里若有这些物件，或许能卖个好价。）'; },
                reply: ta(npc) + '掰着指头一五一十说了，末了补一句：「可别说是我讲的。」' });
            choices.push({ label: '🍶 请' + ta(npc) + '喝一杯再问', favor: -1, kind: 'positive', aff: 2,
                reply: pick(['「痛快！」酒过三巡，' + ta(npc) + '的话匣子彻底打开了。', ta(npc) + '抿了一口：「嗯，看在酒的份上，饶你一条八卦。」']) });
            choices.push({ label: '🚪 算了，不听了', kind: 'neutral', reply: ta(npc) + '耸耸肩：「不听拉倒。」' });
            return { text: text, choices: choices };
        },
        sect_movements: function (npc) {
            var sect = (window.currentCharData && window.currentCharData.sect) || null;
            var taskCount = null;
            try { taskCount = Array.isArray(window.activeTasks) ? window.activeTasks.length : null; } catch (e) {}
            var text = '「动向么……」' + npc.name + '四下看了看，声音低了几分。';
            var choices = [
                { label: '🔍 追问掌门闭关传闻的真假', kind: 'positive', aff: 1,
                    reply: pick(['「真假不知。不过闭关前，库房确实清点过一遍。」', '「传得有鼻子有眼。不信的话，去山门前看看香火便知。」']) }
            ];
            if (sect) choices.push({ label: '💬 问问本门近来有没有麻烦', kind: 'positive', aff: 1,
                reply: '「麻烦谈不上。就是外门那几位走得近了些——你懂就行，别往外说。」' });
            if (taskCount) choices.push({ label: '📜 把差事的事透给' + ta(npc) + '听', favor: 1, kind: 'neutral',
                bonus: function () { return '（你手头还压着' + taskCount + '件未办完的差事。）'; },
                reply: ta(npc) + '点点头：「办利索些。门里的眼睛多，懒散的名声传出去不好听。」' });
            return { text: text, choices: choices };
        },
        black_market: function (npc) {
            var marked = 0;
            try { if (typeof window.getMarkedForSaleItems === 'function') marked = (window.getMarkedForSaleItems() || []).length; } catch (e) {}
            var text = '「黑市的事，」' + npc.name + '盯着你，「知道的人不少，敢碰的不多。」';
            var choices = [
                { label: '🔍 问最近风声紧不紧', kind: 'positive', aff: 1,
                    reply: pick(['「紧。查得最凶的时候，连当铺都不敢收来路不明的东西。」', '「松了一阵——但越松的时候，越是有人设套。」']) },
                { label: '🤝 请' + ta(npc) + '引荐相熟的牙人', favor: -2, kind: 'positive',
                    reply: '「记下了。」' + ta(npc) + '报了个名字，「提我名字，人家给你留三分薄面。」' }
            ];
            if (marked) choices.push({ label: '❓ 问' + ta(npc) + '怎么看自己寄售的那几样', kind: 'neutral',
                bonus: function () { return '（你有' + marked + '件物品正在挂售。）'; },
                reply: '「定价太高，有价无市。」' + ta(npc) + '直言不讳，「想脱手就降一降。」' });
            return { text: text, choices: choices };
        }
    };

    function applyFollowupChoice(npc, subId, c) {
        try {
            spendMinutes(15, '追问深谈'); // v15.6 追问另耗一刻钟
            if (c.aff) { if (typeof npc.changeAffection === 'function') npc.changeAffection(c.aff); else rel(npc, 'affection', c.aff, -100, 100); }
            if (c.favor && typeof npc.changeFavor === 'function') npc.changeFavor(c.favor);
            if (c.trust) rel(npc, 'trust', c.trust, 0, 100);
            if (c.mood && npc.state) npc.state.mood = Math.max(0, Math.min(100, (npc.state.mood || 50) + c.mood));
            if (c.calmStress && npc.state) npc.state.stress = Math.max(0, (npc.state.stress || 0) * 0.7);
            if (typeof npc.recordPlayerAction === 'function') npc.recordPlayerAction('followup_' + subId, c.kind || 'positive'); // 未知动作→纯impressions计数，不动好感基线
        } catch (e) {}
    }

    // 在回复框内追加「追问一句」入口；后续点击直改DOM（执行期showMessage重定向已结束）
    function offerFollowup(npcId, npc, subId) {
        if (!FOLLOWUP_BUILDERS[subId]) return;
        if (!fuOncePerDay(npcId, subId)) return;
        var box = ensureReplyBox();
        if (!box) return;
        var wrap = document.createElement('div');
        wrap.style.cssText = 'margin-top:8px;padding-top:6px;border-top:1px dashed #334155;';
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = '🔍 追问一句';
        btn.style.cssText = 'background:#374151;color:#fff;border:none;border-radius:6px;padding:4px 10px;font-size:12px;cursor:pointer;';
        btn.onmouseover = function () { btn.style.background = '#4b5563'; };
        btn.onmouseout = function () { btn.style.background = '#374151'; };
        btn.onclick = function () {
            var f = null;
            try { f = FOLLOWUP_BUILDERS[subId](npc); } catch (e) {}
            if (!f || !f.choices || !f.choices.length) return;
            while (wrap.firstChild) wrap.removeChild(wrap.firstChild);
            var t = document.createElement('div');
            t.textContent = f.text || '';
            wrap.appendChild(t);
            var row = document.createElement('div');
            row.style.cssText = 'margin-top:6px;display:flex;flex-direction:column;gap:4px;';
            f.choices.forEach(function (c) {
                var b = document.createElement('button');
                b.type = 'button';
                b.textContent = c.label;
                b.style.cssText = 'text-align:left;background:#1f2937;color:#d1d5db;border:1px solid #374151;border-radius:6px;padding:4px 10px;font-size:12px;cursor:pointer;';
                b.onmouseover = function () { b.style.borderColor = '#60a5fa'; };
                b.onmouseout = function () { b.style.borderColor = '#374151'; };
                b.onclick = function () {
                    applyFollowupChoice(npc, subId, c);
                    var extra = '';
                    try { extra = c.bonus ? (c.bonus(npc) || '') : ''; } catch (e) {}
                    while (row.firstChild) row.removeChild(row.firstChild);
                    var r = document.createElement('div');
                    r.style.whiteSpace = 'pre-line';
                    r.textContent = (c.reply || '……') + (extra ? ('\n\n' + extra) : '');
                    wrap.appendChild(r);
                    try { box.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) {}
                };
                row.appendChild(b);
            });
            wrap.appendChild(row);
            try { box.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) {}
        };
        wrap.appendChild(btn);
        box.appendChild(wrap);
        box.style.display = 'block';
        try { box.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) {}
    }

    // ==================== 组合式问候/告别（v14.1）：时段×关系层×性格尾缀 ====================
    function currentHour() {
        try {
            var ts = window.timeSystem;
            if (ts && ts.gameTime && ts.gameTime.currentHour != null) return ts.gameTime.currentHour;
        } catch (e) {}
        return 12;
    }
    // 时段桶：dawn清晨 / day日间 / dusk暮前 / night深夜
    function slotOf(h) {
        if (h >= 5 && h < 11) return 'dawn';
        if (h >= 11 && h < 17) return 'day';
        if (h >= 17 && h < 21) return 'dusk';
        return 'night';
    }

    var GREET_TIME = {
        dawn: ['早。', '晨露未干，你就来了。', '起得这样早——修行人该有的样子。', '今早雾大。哦，是你啊。', '一日之计……罢了，你来了就好。'],
        day: ['午安。', '这个点儿过来，用饭了没？', '日头正好，坐会儿？', '午后正犯困，你来得是时候。', '大白天的，稀客。'],
        dusk: ['这个钟点还过来？', '暮色不错。', '一天总算忙完了——说吧，什么事。', '晚霞还没散尽，你赶得上。'],
        night: ['这个时辰……有事？', '夜深了，长话短说。', '睡不着？巧，我也是。', '夜里风凉，进来说。']
    };

    var GREET_REL = {
        cold: ['有事？', '嗯。', '你来做什么？', '（抬了抬眼皮，算是打过招呼）'],
        warm: ['哟，来了。', '稀客啊——也不算稀客了。', '正想找个人说话，你就到了。', '今天什么风把你吹来了？'],
        close: ['来了？坐。', '就知道你会来。', '可算来了——正念叨你呢。', '老规矩，随便坐。']
    };

    var PERSONA_TAIL = {
        outgoing: ['对了，你可算来啦！', '跟你说个事儿——算了，坐下慢慢说！'],
        gentle: ['外头风大，进来说话。', '路上累了吧？先歇口气。'],
        broody: ['……没什么。就是，来了就好。'],
        quirky: ['你说，人为什么总在夜里想起旧事？', '我方才算了一卦——卦象说，今日有客。应验了。'],
        stern: ['坐有坐相。——说正事吧。', '来得准时。这点比你强的人不多。']
    };

    function personaKey(npc) {
        var traits = [['openness', b5(npc, 'openness')], ['conscientiousness', b5(npc, 'conscientiousness')],
                      ['extraversion', b5(npc, 'extraversion')], ['agreeableness', b5(npc, 'agreeableness')],
                      ['neuroticism', b5(npc, 'neuroticism')]];
        traits.sort(function (a, b) { return b[1] - a[1]; });
        var map = { openness: 'quirky', conscientiousness: 'stern', extraversion: 'outgoing', agreeableness: 'gentle', neuroticism: 'broody' };
        return map[traits[0][0]] || 'gentle';
    }

    var FAREWELL_TIME = {
        dawn: ['去吧，趁早凉赶路', '早去早回', '晨风凉，添件衣裳', '一路顺风'],
        day: ['这会儿就走？慢些', '去吧，别误了饭点', '去吧去吧', '回头见'],
        dusk: ['天要黑了，路上当心', '不留你吃饭了？——去吧去吧', '晚风起，早些歇息', '明日见'],
        night: ['夜里路滑，掌个灯', '这么晚了，万事小心', '做个好梦', '去吧，我守会儿夜']
    };

    var FAREWELL_REL = { cold: '嗯。', warm: '慢走', close: '别走太久' };

    function affTier(npc) {
        var aff = (npc.relationship && npc.relationship.affection) || 0;
        return aff >= 60 ? 'close' : aff >= 20 ? 'warm' : 'cold';
    }

    function composeGreeting(npc) {
        var tier = affTier(npc);
        var parts = [];
        if (tier === 'cold') {
            parts.push(pick(GREET_REL.cold));
        } else {
            parts.push(pick(GREET_TIME[slotOf(currentHour())]));
            if (Math.random() < 0.45) parts.push(pick(GREET_REL[tier]));
        }
        // v14.2/v14.3 尾缀三层：16型签名句 → 维度微口吻（正交铺量） → A/T修饰 → 大五兜底
        if (window.Personality16 && window.Personality16.tailFor) {
            var t16 = window.Personality16.tailFor(npc);
            var dim = window.Personality16.dimLineFor ? window.Personality16.dimLineFor(npc) : null;
            var idT = window.Personality16.identityTailFor ? window.Personality16.identityTailFor(npc) : null;
            if (t16 && Math.random() < 0.4) {
                parts.push(t16);
                if (idT && Math.random() < 0.2) parts.push(idT);
            } else if (dim && Math.random() < 0.7) {
                parts.push(dim.text);
                if (idT && Math.random() < 0.15) parts.push(idT);
            } else if (idT && Math.random() < 0.25) {
                parts.push(idT);
            } else {
                var pt = PERSONA_TAIL[personaKey(npc)];
                if (pt && Math.random() < 0.35) parts.push(pick(pt));
            }
        } else {
            var pt2 = PERSONA_TAIL[personaKey(npc)];
            if (pt2 && Math.random() < 0.3) parts.push(pick(pt2));
        }
        return parts.join('');
    }

    function composeFarewell(npc) {
        var tier = affTier(npc);
        var parts = [];
        if (tier === 'cold') parts.push('嗯');
        else parts.push(pick(FAREWELL_TIME[slotOf(currentHour())]));
        // 复刻原生recentAction后缀（npc-system.js getFarewell）
        var lastActions = (npc.memory && npc.memory.playerActions) || [];
        var recentAction = lastActions[lastActions.length - 1];
        if (recentAction && recentAction.action === 'gift') parts.push('谢谢你的礼物');
        else if (recentAction && recentAction.action === 'deep_talk') parts.push('谢谢你听我说心里话');
        else if (recentAction && recentAction.action === 'refuse_quest') parts.push('好吧，我自己想办法');
        else if (tier !== 'cold' && Math.random() < 0.35) parts.push(FAREWELL_REL[tier]);
        return parts.join('，').replace('，，', '，');
    }

    // ==================== 动态问候 ====================
    function dynamicGreeting(npc, fallbackText) {
        if (!npc) return fallbackText;
        var mood = (npc.state && npc.state.mood) != null ? npc.state.mood : 50;
        var meet = (npc.memory && npc.memory.meetCount) || 0;
        var hostile = !!(window.SecretLeverage && window.SecretLeverage.isHostile(npc.id));
        if (hostile) return pick([ta(npc) + '瞥了你一眼，没有说话。', '空气冷了几分。「……有事？」']);
        if (mood < 25) return pick([npc.name + '勉强扯出一个笑：「嗯。」', npc.name + '情绪不高，朝你点了点头。']);
        if (meet <= 1) return pick([npc.name + '打量了你一眼：「初次见面，幸会。」', npc.name + '微微颔首：「又是一位登门的修士。」']);
        var secrets = unlockedSecretTitles(npc);
        if (secrets.length && Math.random() < 0.35) {
            return pick([npc.name + '见到你，眼里闪过一丝旁人读不懂的东西：「来了。」', npc.name + '冲你抬了抬下巴——那是只有你们之间才懂的方式。']);
        }
        if (mood >= 75 && Math.random() < 0.4) {
            return pick([npc.name + '远远看见你就笑了：「来得正好！」', npc.name + '招呼道：「正念叨你呢，人就到了。」']);
        }
        return composeGreeting(npc);
    }

    function rel(npc, field, delta, floor, ceil) {
        if (!npc.relationship) npc.relationship = {};
        var cur = npc.relationship[field] || 0;
        cur += delta;
        if (floor != null) cur = Math.max(floor, cur);
        if (ceil != null) cur = Math.min(ceil, cur);
        npc.relationship[field] = cur;
    }

    // ==================== 回复入面板（v14.5）：深谈执行期重定向showMessage ====================
    function escapeHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

    function ensureReplyBox() {
        var modal = document.querySelector('.npc-dialog-modal');
        if (!modal) return null;
        var box = modal.querySelector('#socialReplyBox');
        if (!box) {
            box = document.createElement('div');
            box.id = 'socialReplyBox';
            box.style.cssText = 'display:none;margin-top:12px;padding:10px 12px;background:#0b1220;border:1px solid #3b82f6;border-radius:8px;font-size:13px;line-height:1.75;color:#e2e8f0;white-space:pre-line;';
            var container = modal.querySelector('.space-y-1\\.5') || modal.querySelector('.bg-gray-800');
            if (!container) return null;
            container.appendChild(box);
        }
        return box;
    }

    function writeReply(msg, type) {
        var box = ensureReplyBox();
        if (!box) { if (typeof window.showMessage === 'function') window.showMessage(msg, type); return; }
        box.innerHTML += escapeHtml(msg) + '\n';
        box.style.display = 'block';
        try { box.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) {}
    }

    function wrapExecute() {
        if (typeof window.executeDeepTalkSubOption !== 'function' || window.executeDeepTalkSubOption.__reply_wrapped) return;
        buildAffGate();
        var orig = window.executeDeepTalkSubOption;
        window.executeDeepTalkSubOption = function (npcId, categoryId, subOptionId) {
            var box = ensureReplyBox();
            var saved = window.showMessage;
            if (box) {
                box.innerHTML = '';
                box.style.display = 'none';
                window.showMessage = function (msg, type) { writeReply(msg, type); };
            }
            try { return orig.apply(this, arguments); }
            finally {
                if (saved) window.showMessage = saved;
            }
        };
        window.executeDeepTalkSubOption.__reply_wrapped = true;
    }

    // ==================== 治疗接22部位（v14.11 审计5） ====================
    // request_heal 成功后：止血稳定/轻伤清创/镇痛安神；重伤仍提示需就医馆
    function treatWoundsByHealer(npc) {
        var ent = window._playerPhysiology;
        var phys = ent && ent.physiology;
        if (!phys) return;
        var treated = [];
        (phys.wounds || []).forEach(function (w) {
            if (!w) return;
            // 同一伤口同诊两步：先止血稳定，再做清创减症
            if (w.bleeding && !w.stabilized) { w.stabilized = true; if (treated.indexOf('止血') < 0) treated.push('止血'); }
            if ((w.depth || 0) < 3 && !(w.severity <= 0)) {
                w.severity = Math.max(0, (w.severity || 0) - 15);
                w.depth = Math.max(0, (w.depth || 0) - 1);
                if ((w.severity || 0) === 0) w.healed = true;
                if (treated.indexOf('清创') < 0) treated.push('清创');
            }
        });
        if ((phys.painLoad || 0) > 0) { phys.painLoad = Math.max(0, phys.painLoad * 0.6); treated.push('镇痛'); }
        if ((phys.neuralShock || 0) > 0) { phys.neuralShock = Math.max(0, phys.neuralShock * 0.7); treated.push('安神'); }
        try { if (window.renderBodyDurability) window.renderBodyDurability(); } catch (e) {}
        try { if (window.updateBodySVG) window.updateBodySVG(); } catch (e) {}
        if (treated.length) {
            window.showMessage('💊 ' + npc.name + ' 施针用药：' + treated.join('、') + '。深重的旧伤仍需就医馆调理。', 'success');
        }
    }

    function wrapAdvancedRequest() {
        // 包底层 executeAdvancedRequest（有真实 success 返回；callAdvancedRequest 恒 true 会吞结果）
        if (typeof window.executeAdvancedRequest !== 'function' || window.executeAdvancedRequest.__heal_wrapped) return;
        var orig = window.executeAdvancedRequest;
        window.executeAdvancedRequest = function (npc, requestId) {
            var r = orig.apply(this, arguments);
            try {
                if (requestId === 'request_heal' && r && r.success) {
                    var npcObj = (npc && npc.id) ? npc : (window.npcManager && typeof window.npcManager.getNPC === 'function' ? window.npcManager.getNPC(npc) : null);
                    if (npcObj) treatWoundsByHealer(npcObj);
                }
            } catch (e) { console.warn('[社交] 治疗处置失败:', e); }
            return r;
        };
        window.executeAdvancedRequest.__heal_wrapped = true;
    }

    // ==================== 处理器注册 ====================
    // subOptionId → { need, catId }（v14.6 修正：真实处理器须复刻原生气愤机制——
    // 关系不足仍可对话，但换负面回应池、扣好感 -floor(need/10)、记 forced_talk 负向动作。
    // 此机制此前未见于任何说明文档，本次已补记至 NPC社交选项功能审计.md）
    var SUB_AFF_GATE = {};

    function buildAffGate() {
        if (!window.DEEP_TALK_CATEGORIES) return;
        Object.keys(window.DEEP_TALK_CATEGORIES).forEach(function (k) {
            var c = window.DEEP_TALK_CATEGORIES[k];
            (c.subOptions || []).forEach(function (s) {
                SUB_AFF_GATE[s.id] = { need: s.minAffection || 0, catId: c.id };
            });
        });
    }

    function stateSuffix(npc) {
        var out = '';
        try {
            var hs = typeof npc.getHoursSinceLastMeet === 'function' ? npc.getHoursSinceLastMeet() : -1;
            if (hs >= 0 && hs < 1) out += '（我们刚见过）';
            else if (hs >= 24) out += '（好久不见）';
            var mood = (npc.state && npc.state.mood) || 50;
            var stress = (npc.state && npc.state.stress) || 0;
            if (mood > 70) out += '（心情不错）';
            if (stress > 60) out += '（有些烦躁）';
            if (npc.state && npc.state.isBroken) out += '（状态不太稳定）';
            if (npc.background && npc.background.goal) out += '\n\n（' + ta(npc) + '最近的目标是：' + npc.background.goal + '）';
        } catch (e) {}
        return out;
    }

    // ==================== v18.3 旁观者插话：同场第三方的世界反应 ====================
    var BYSTANDER_LINES = {
        warm: [
            '{bn}笑着摆手：「你们聊，我在旁听着就好。」',
            '「{pname}又在套话了？」{bn}在一边打趣道。',
            '{bn}听得津津有味，还不忘替你续了杯茶。'
        ],
        bold: [
            '一旁的{bn}凑过来：「聊什么呢，也算我一个？」',
            '{bn}在旁边听得直摇头：「你们读书人就是话多。」',
            '「咳——」{bn}故意咳嗽了一声，显然也想掺和。'
        ],
        reserved: [
            '{bn}头也不抬：「吵到我了。」',
            '角落里的{bn}瞥了一眼，又收回目光。',
            '{bn}轻哼一声，听不出是赞同还是嘲讽。'
        ]
    };
    function maybeBystanderChime(talkerNpc) {
        try {
            if (typeof window.npcManager?.getAllNPCs !== 'function') return;
            var myLoc = talkerNpc.state && talkerNpc.state.location;
            if (!myLoc) return;
            var here = [];
            (window.npcManager.getAllNPCs() || []).forEach(function (o) {
                if (!o || o.id === talkerNpc.id) return;
                var ol = o.state && o.state.location;
                if (ol === myLoc) here.push(o);
            });
            if (!here.length) return;
            if (Math.random() >= 0.25) return;
            var bn = here[Math.floor(Math.random() * here.length)];
            var aff = (bn.relationship && bn.relationship.affection) || 0;
            var open = b5(bn, 'openness', 0.5);
            var pool = aff >= 40 ? BYSTANDER_LINES.warm : (open >= 0.55 ? BYSTANDER_LINES.bold : BYSTANDER_LINES.reserved);
            var pname = (window.currentCharData && window.currentCharData.name) || '你';
            var line = '💬 ' + pick(pool).replace(/\{bn\}/g, bn.name).replace(/\{pname\}/g, pname);
            // v18.3 修正：回复框为文本缓冲重绘式，元素子节点会被后续消息抹除——插话走 showMessage 正统通道随缓冲持久
            if (window.showMessage) window.showMessage(line, 'info');
        } catch (eBc) {}
    }

    function makeHandler(gen, opts) {
        opts = opts || {};
        return function (npcId) {
            var npc = window.npcManager && window.npcManager.getNPC ? window.npcManager.getNPC(npcId) : null;
            if (!npc) return false;
            // v15.6 情境分流：深夜/劳作/悲恸时话题不合时宜——世界反应式回应，不灰锁不计次
            var ctxMsg = contextGate(npc, opts.subId);
            if (ctxMsg) {
                spendMinutes(5, '话不投机');
                window.showMessage(ctxMsg.replace('{name}', npc.name), 'warning');
                return true;
            }
            // v15.6 重复显性化：今日已谈过的话题不再重播——人不会把同一席话说两遍
            if (wasTalkedToday(npcId, opts.subId)) {
                spendMinutes(5, '重复寒暄');
                var repPool = FU_INTEL[opts.subId] ? REPEAT_INTEL_POOL : REPEAT_TOPIC_POOL;
                window.showMessage(pick(repPool).replace('{name}', npc.name), 'info');
                return true;
            }
            var gate = SUB_AFF_GATE[opts.subId] || null;
            var need = gate ? gate.need : 0;
            var aff = (npc.relationship && npc.relationship.affection) || 0;
            // v14.6 复刻原生惩罚机制：关系不足→负面回应池+扣好感+forced_talk（不拒绝对话）
            if (aff < need) {
                var neg = (typeof window.getDeepTalkResponse === 'function') ? window.getDeepTalkResponse(npc, gate.catId, opts.subId, true) : null;
                var text = (neg && neg.length) ? pick(neg) : npc.name + '冷淡地摇了摇头。';
                text += stateSuffix(npc);
                var penalty = need ? -Math.floor(need / 10) : -2;
                rel(npc, 'affection', penalty, -100);
                if (typeof npc.recordPlayerAction === 'function') npc.recordPlayerAction('forced_talk', 'negative');
                spendMinutes(10, '话不投机'); // v15.6
                window.showMessage(text + '（好感' + penalty + '）', 'warning');
                return true;
            }
            var text;
            try { text = gen(npc); } catch (e) {
                text = npc.name + '和你聊了一会儿。';
            }
            var pre = familiarityLine(npc, opts.subId); // v15.0 印记换档：追问越多的关系开口越熟稔
            if (pre) text = pre + '\n' + text;
            window.showMessage(text, 'info');
            spendMinutes(FU_INTEL[opts.subId] ? 20 : 30, FU_INTEL[opts.subId] ? '打听消息' : '深谈'); // v15.6 一场谈话就是花时间
            if (opts.mood && npc.state) npc.state.mood = Math.max(0, Math.min(100, (npc.state.mood || 50) + opts.mood));
            markTalked(npcId, opts.subId); // v15.6：登记今日已谈（复读分流依据）
            try { maybeBystanderChime(npc); } catch (eBc2) {} // v18.3 旁观者插话
            try { offerFollowup(npcId, npc, opts.subId); } catch (e) {} // v15.0：成功路径才提供追问（每日每题一次）
            return true;
        };
    }

    function integrate() {
        if (!window.DEEP_TALK_REAL_HANDLERS) return;
        buildAffGate();
        var H = window.DEEP_TALK_REAL_HANDLERS;
        // 话题（谈心类：心情微调）
        H.recent = makeHandler(TOPIC_GENERATORS.recent, { mood: 2, subId: 'recent' });
        H.hobbies = makeHandler(TOPIC_GENERATORS.hobbies, { mood: 2, subId: 'hobbies' });
        H.history = makeHandler(TOPIC_GENERATORS.history, { subId: 'history' });
        H.future = makeHandler(TOPIC_GENERATORS.future, { subId: 'future' });
        H.worries = makeHandler(TOPIC_GENERATORS.worries, { mood: 1, subId: 'worries' });
        H.dreams = makeHandler(TOPIC_GENERATORS.dreams, { subId: 'dreams' });
        H.complaints = makeHandler(TOPIC_GENERATORS.complaints, { mood: 3, subId: 'complaints' });
        // 情报（不耗情分，纯信息）
        H.market_prices = makeHandler(INTEL_GENERATORS.market_prices, { subId: 'market_prices' });
        H.secret_realms = makeHandler(INTEL_GENERATORS.secret_realms, { subId: 'secret_realms' });
        H.gossip = makeHandler(INTEL_GENERATORS.gossip, { subId: 'gossip' });
        H.sect_movements = makeHandler(INTEL_GENERATORS.sect_movements, { subId: 'sect_movements' });
        H.black_market = makeHandler(INTEL_GENERATORS.black_market, { subId: 'black_market' });
    }

    // ==================== 问候外层替换（保留batch触发链） ====================
    function integrateGreeting() {
        if (typeof window.getGreeting !== 'function' || window.getGreeting.__social_content_wrapped) return;
        var orig = window.getGreeting;
        window.getGreeting = function (npc, player) {
            var r = orig.apply(this, arguments); // 内层完成自动触发等副作用
            try { return dynamicGreeting(npc, r); } catch (e) { return r; }
        };
        window.getGreeting.__social_content_wrapped = true;
    }

    // 告别外层替换（v14.1：时段×关系×recentAction后缀组合）
    function integrateFarewell() {
        if (typeof window.getFarewell !== 'function' || window.getFarewell.__social_content_wrapped) return;
        var orig = window.getFarewell;
        window.getFarewell = function (npc, player) {
            try { return composeFarewell(npc); } catch (e) { return orig.apply(this, arguments); }
        };
        window.getFarewell.__social_content_wrapped = true;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            integrate();
            integrateGreeting();
            integrateFarewell();
            wrapExecute();
            wrapAdvancedRequest();
        });
    } else {
        integrate();
        integrateGreeting();
        integrateFarewell();
        wrapExecute();
        wrapAdvancedRequest();
    }

    console.log('💬 社交页扩展已加载（话题×7 + 情报×5 真实数据驱动 + 组合式问候/告别 + 追问层v15.0：每题每日一追·印记换档）');
})();
