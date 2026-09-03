// ==================== tianshan-events.js - 琤霄凌线情缘事件/结局/自动触发 v1.0 ====================
// 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / registerEndingSet / registerEndingCallback /
//       hasEventTriggered / isChainHead / checkEventTrigger / triggerPersonalEvent / canPlayerAccessPersonalEvent）
// 依赖：npcs/npc-system.js（executeEmotionInteraction 等互动）
// 加载顺序：在 npc-personal-events.js 之后
// 说明：事件结构与温蘅线一致；autoTrigger 字段驱动世界式自动弹出

var TIANSHAN_NPC_ID = 'sect_leader_天山派';

// ============ 琤霄凌主线事件（ts_event_001 ~ 013） ============
var TIANSHAN_MAIN_EVENTS = {
    'ts_event_001': {
        id: 'ts_event_001', npcId: TIANSHAN_NPC_ID, title: '寒锋', icon: '🗡️',
        desc: '你在剑阁练剑，一道冷声从背后传来。',
        minAffection: 12, trigger: { random: 0.4 }, cooldown: 0, flag: 'ts_e001_done',
        autoTrigger: { location: '天山派', random: 0.45 },
        scenes: [
            { speaker: 'narrator', text: '天山大雪初霁，你在剑阁练那一招「雪落」。', type: 'description' },
            { speaker: 'narrator', text: '剑到半式，身后一个声音冷冷落下，像冰碴子砸在石板上。', type: 'description' },
            { speaker: 'npc', text: '「腕太软。这一剑下去，雪没扫开，你先被反震得虎口裂。」' },
            { speaker: 'narrator', text: '你回头——琤霄凌不知何时立在阁门，霜白剑衣上落了几片雪。她没看你，看着你的剑尖。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「请师叔指点。」', effect: 'ask', affection: 4 },
                { text: '不服气，再劈一剑给她看', effect: 'again', affection: 5 },
                { text: '收剑：「那我不练了。」', effect: 'quit', affection: -2 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'ask': aff = 4; msg = '她走过你身侧，单手虚握你执剑的腕，将角度一拧：「这样。」指尖很凉。一闪即收，像没碰过你。'; break;
                case 'again': aff = 5; msg = '第二剑，雪被剑风扫开半圈。她看了很久，没说话——但也没再让你停。'; break;
                case 'quit': aff = -2; msg = '她不置可否，转身走了。雪很快盖住你刚才踏过的脚印，像没人来过。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'ts_event_002': {
        id: 'ts_event_002', npcId: TIANSHAN_NPC_ID, title: '雪夜守阁', icon: '🌌',
        desc: '大雪封山，她让你替她守一夜剑阁。',
        minAffection: 18, trigger: { random: 0.4 }, cooldown: 0, flag: 'ts_e002_done',
        autoTrigger: { location: '天山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '天山大雪封了三天，剑阁的炭火将尽。', type: 'description' },
            { speaker: 'narrator', text: '琤霄凌把一串炭钥匙放在你手里：「今晚你守阁。霜鸣在中龛——」', type: 'description' },
            { speaker: 'npc', text: '「若有异响，不要去碰它，来叫我。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「师叔去歇着，这里有我。」', effect: 'take', affection: 5 },
                { text: '「霜鸣为何会响？」', effect: 'why', affection: 6 },
                { text: '「我冷，能不能多给床被子？」', effect: 'cold', affection: -1 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'take': aff = 5; msg = '她顿了一下，点头。临走回头看你一眼——那一眼里有极少的一点松。'; break;
                case 'why': aff = 6; msg = '她沉默半晌：「剑记得人。」没再说，但这一夜她回阁的次数，比往常早了三回。'; break;
                case 'cold': aff = -1; msg = '她指了指角落：「稻草堆。」自己裹着单衣走了。剑阁的冷，她从不嫌。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'ts_event_003': {
        id: 'ts_event_003', npcId: TIANSHAN_NPC_ID, title: '霜鸣', icon: '⚔️',
        desc: '你撞见她擦拭一柄从不离身的旧剑。',
        minAffection: 25, trigger: { random: 0.35 }, cooldown: 0, flag: 'ts_e003_done',
        autoTrigger: { location: '天山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '你推错门，闯进她静室。她正坐在窗下擦一柄旧剑——剑身有细密的裂纹，却磨得雪亮。', type: 'description' },
            { speaker: 'narrator', text: '她没抬头，手没停：「进来就关门。风灌进来，剑会潮。」', type: 'description' },
            { speaker: 'npc', text: '她把剑横在膝上，指腹一下一下擦那道最深的裂纹。「……这剑叫霜鸣。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '蹲下来看那道裂纹：「它裂了。」', effect: 'look', affection: 6 },
                { text: '「霜鸣……好名字。它从前属于谁？」', effect: 'who', affection: 7 },
                { text: '「您从没拔过它，是吗？」', effect: 'sheath', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'look': aff = 6; msg = '她的手停了一瞬：「裂了，还能鸣。」——后来你才知道，那道裂纹是一道挡过刀的疤。'; break;
                case 'who': aff = 7; msg = '她良久才答：「一个人。」声音轻得像怕惊动剑。你识趣地没再问。'; break;
                case 'sheath': aff = 5; msg = '「……拔了，就要见血，或者见人。」她把霜鸣收回鞘中，动作很轻，「它还没等到。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'ts_event_004': {
        id: 'ts_event_004', npcId: TIANSHAN_NPC_ID, title: '师姐的剑', icon: '🩸',
        desc: '她第一次对你提起霜鸣的来历。',
        minAffection: 32, trigger: { random: 0.35 }, cooldown: 0, flag: 'ts_e004_done',
        autoTrigger: { location: '天山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '剑阁后崖，她立在风雪里，霜鸣横于身前。', type: 'description' },
            { speaker: 'npc', text: '「这剑，是我师姐的。」她声音平得听不出情绪，「十八岁那年，天魔来袭天山，她替我挡了一刀——血溅上去，就成了这道裂纹。」' },
            { speaker: 'npc', text: '「她咽气前把这剑塞我手里，说：『霄凌，替我把它练成。』……我练了十二年，没成。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「她一定不想看你这样。」', effect: 'break', affection: 7 },
                { text: '「霜鸣已经成了。是您还没原谅自己。」', effect: 'truth', affection: 9 },
                { text: '沉默，把手按在她握剑的手背上', effect: 'touch', affection: 8 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'break': aff = 7; msg = '她侧头，雪打在脸上化成水：「……你又不认得她，怎么知道。」但她没再说话，像是被这一句问住了。'; break;
                case 'truth': aff = 9; msg = '她久久没动。风雪灌进袖口。「你看得太清。」——这一夜之后，她擦霜鸣时，偶尔会念一句「师姐，有人这么说我」。'; break;
                case 'touch': aff = 8; msg = '她手腕一僵，没抽走。两个人就这样在风雪里站了很久，霜鸣在你们掌下，凉得像一块活着的冰。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'ts_event_005': {
        id: 'ts_event_005', npcId: TIANSHAN_NPC_ID, title: '比剑', icon: '🤺',
        desc: '她破天荒主动找你比剑。',
        minAffection: 40, trigger: { random: 0.35 }, cooldown: 0, flag: 'ts_e005_done',
        autoTrigger: { location: '天山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '晨起，她已立在演武场，手中一柄木剑。', type: 'description' },
            { speaker: 'npc', text: '「来。」只一个字。她木剑一抬，剑风先到，吹散了场边的雪。' },
            { speaker: 'narrator', text: '你接了三招，被震退七步。她收剑，眉目间难得有一点松动。', type: 'description' },
            { speaker: 'npc', text: '「接得住我的剑风，天山可以信你一半。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「那另一半呢？」', effect: 'half', affection: 6 },
                { text: '「再比一局，我要赢。」', effect: 'again', affection: 7 },
                { text: '「师叔的剑，是守的剑。」', effect: 'guard', affection: 8 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'half': aff = 6; msg = '她看了你一眼：「另一半，等霜鸣出鞘那天。」——这话像承诺，又像托付。'; break;
                case 'again': aff = 7; msg = '第二局她让了你半式，你堪堪平。她把木剑扔给你：「剑要敢赢，也要敢输。你的赢，不急。」'; break;
                case 'guard': aff = 8; msg = '她怔了一下，随即轻轻「嗯」了一声。「……你看出来了。」那天她破例，收剑后陪你喝了半盏热茶。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'ts_event_006': {
        id: 'ts_event_006', npcId: TIANSHAN_NPC_ID, title: '旧伤', icon: '🩹',
        desc: '你看到她后腰那道横贯的旧疤。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'ts_e006_done',
        autoTrigger: { location: '天山派', random: 0.35 },
        scenes: [
            { speaker: 'narrator', text: '她在剑阁擦剑，剑衣敞开一角。你无意瞥见——她后腰横着一道极长的旧疤，像被什么从左到右豁开过。', type: 'description' },
            { speaker: 'narrator', text: '她察觉到你的目光，把剑衣拢好，语气没变：「看够了？」', type: 'description' },
            { speaker: 'npc', text: '「师姐挡的那一刀，是冲我心口的。我推她，她反扑过来，刀滑了，从腰上过去。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '去取药，一言不发帮她上药', effect: 'help', affection: 8 },
                { text: '「不是您的错。是她自己要挡。」', effect: 'fault', affection: 6 },
                { text: '「以后这一刀，我来挡。」', effect: 'shield', affection: 9 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'help': aff = 8; msg = '她没拒绝你上药的手，只说「够不着，劳烦」。药涂上去时她肩微颤——那是痛，也是另一种说不出的东西。'; break;
                case 'fault': aff = 6; msg = '她摇头：「道理我都懂。懂道理，挡不住半夜醒来摸腰上的疤。」——但她记住了，你替她把这笔账算在了刀上，没算在她头上。'; break;
                case 'shield': aff = 9; msg = '她看了你很久，忽然轻轻笑了一下——你第一次见她笑，冷冽里裂开一线暖。「……傻话。」她说，但那夜之后，她练剑时不再背对你。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'ts_event_007': {
        id: 'ts_event_007', npcId: TIANSHAN_NPC_ID, title: '采雪莲', icon: '🌸',
        desc: '她带你上绝顶采雪莲，难得话多。',
        minAffection: 52, trigger: { random: 0.3 }, cooldown: 0, flag: 'ts_e007_done',
        autoTrigger: { location: '天山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '她破例带你上天山绝顶采雪莲。路险，她走在前，偶尔回手拉你一把——掌心仍是凉的，却握得很稳。', type: 'description' },
            { speaker: 'narrator', text: '采到雪莲，她坐在崖边，难得说了一长段话。', type: 'description' },
            { speaker: 'npc', text: '「师姐以前也爱来这儿。她说，雪莲长在没人到的地方，是因为它不稀罕人懂。我那会儿不懂，现在……」' },
            { speaker: 'npc', text: '她把雪莲放你掌心：「……现在有点懂了。有人懂，也是好事。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「我懂您一点点，就够了。」', effect: 'understand', affection: 8 },
                { text: '把雪莲分一半还给她：「一人一朵。」', effect: 'share', affection: 7 },
                { text: '「那以后我陪您来，每年。」', effect: 'promise', affection: 9 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'understand': aff = 8; msg = '她侧头看你，冰蓝眼底映着雪顶的天光：「……贪心点也行。」这句话她没看你说的。'; break;
                case 'share': aff = 7; msg = '她看着自己手里那半朵，忽然把你的也拿过去，两朵并排插进她腰间的素绫里：「……并在一起，活得好些。」'; break;
                case 'promise': aff = 9; msg = '她没答，但第二年雪莲花开的时候，她在崖边多等了你一炷香。你来时她什么都没说，递了朵花给你。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'ts_event_008': {
        id: 'ts_event_008', npcId: TIANSHAN_NPC_ID, title: '月下剑舞', icon: '🌙',
        desc: '月夜，你在崖上撞见她独舞。',
        minAffection: 60, trigger: { random: 0.3 }, cooldown: 0, flag: 'ts_e008_done',
        autoTrigger: { timeRange: [21, 3], location: '天山派', random: 0.45 },
        scenes: [
            { speaker: 'narrator', text: '子夜，你睡不着上后崖。月光下，琤霄凌正在舞剑——不是霜鸣，是一根折下的梅枝。', type: 'description' },
            { speaker: 'narrator', text: '剑舞到极处，梅枝划出的弧线竟带着霜鸣的影子。她像在跟一个看不见的人过招。', type: 'description' },
            { speaker: 'narrator', text: '她停下来，喘着气，没回头就知道是你。', type: 'description' },
            { speaker: 'npc', text: '「……看见就看见，别出声。」她声音哑哑的，「我跟师姐过几招。她让我的。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「她赢了，还是您赢了？」', effect: 'who_win', affection: 8 },
                { text: '折根梅枝，请她教你一招', effect: 'learn', affection: 7 },
                { text: '什么也不说，在崖边坐下陪她到月落', effect: 'stay', affection: 9 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'who_win': aff = 8; msg = '她愣了一下，低低笑出声：「我赢了。她让我。」月光下她的侧脸，是你见过的、最像普通女子的她。'; break;
                case 'learn': aff = 7; msg = '她用梅枝带着你过了一遍「雪落」。到最后一步，两根梅枝在月下交叠——她没收回。'; break;
                case 'stay': aff = 9; msg = '一整夜，没人说话。月落时她起身，经过你身边，把你肩上的落雪拂掉：「……冷也不说。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'ts_event_009': {
        id: 'ts_event_009', npcId: TIANSHAN_NPC_ID, title: '断剑之诺', icon: '🔗',
        desc: '她说，若霜鸣有一天断了，要你帮她。',
        minAffection: 68, trigger: { random: 0.3 }, cooldown: 0, flag: 'ts_e009_done',
        autoTrigger: { location: '天山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '她在擦霜鸣那道裂纹，擦了很久。忽然开口。', type: 'description' },
            { speaker: 'npc', text: '「这裂纹，每过几年就会深一线。有一天它会断。」她抬眼看你，「断的那天，我可能……不太想活。」' },
            { speaker: 'npc', text: '「所以，我跟你讨个诺：到那天，你帮我把剑接上，或者——帮我把人留下。行不行？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「我应您。剑断了，我接；人，我也留下。」', effect: 'promise', affection: 12 },
                { text: '「霜鸣不会断的。我会替师叔护住它。」', effect: 'guard', affection: 9 },
                { text: '「……这种话，不该对人说吗？」', effect: 'press', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'promise': aff = 12; msg = '她看了你很久，把霜鸣横进你掌心一瞬，又收回：「……记住你说的。」那一瞬你触到的，不只是一柄剑。'; break;
                case 'guard': aff = 9; msg = '她点头，没再说话。但从那天起，霜鸣不入鞘时，她会让你坐在她身边——像一个守夜的人，旁边多了一个守夜的人。'; break;
                case 'press': aff = 5; msg = '她别开脸：「……不该。」半天又补一句，「但你来了。」——这是她第一次承认，你不算「人」，算「这个人」。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'ts_event_010': {
        id: 'ts_event_010', npcId: TIANSHAN_NPC_ID, title: '童姥的考校', icon: '🐉',
        desc: '天山童姥当面考你，她替你说话。',
        minAffection: 72, trigger: { random: 0.3 }, cooldown: 0, flag: 'ts_e010_done',
        autoTrigger: { location: '天山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '天山童姥不知何时出现在剑阁，盘在梁上往下看你，笑得像猫。「小霄凌带了个人来？让姥姥瞧瞧成色。」', type: 'description' },
            { speaker: 'narrator', text: '她一抬手，一道凌厉真气压向你——是考校，也是下马威。你正要硬接，一道霜白身影挡在身前。', type: 'description' },
            { speaker: 'npc', text: '琤霄凌单手按住童姥的真气，声音冷得能冻住空气：「师叔祖，此人，我担。」' },
            { speaker: 'npc', text: '童姥挑眉，笑意更深：「哦？你担？」她收了手，跃回梁上，「那姥姥看你担不担得起。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '对童姥一礼：「绝不连累师叔。」', effect: 'respect', affection: 8 },
                { text: '低声对她：「师叔不必替我挡。」', effect: 'stand', affection: 7 },
                { text: '什么也不说，站到她身侧并肩', effect: 'side', affection: 9 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'respect': aff = 8; msg = '童姥走后，她低声：「她最不喜欢没骨头的人。你这一礼，比挡她一掌管用。」——她罕见地，对你笑了。'; break;
                case 'stand': aff = 7; msg = '她侧头看你，眼底有一瞬的烫：「……想清楚了。你替我挡，我担不起。」但她没把你的手推开。'; break;
                case 'side': aff = 9; msg = '她看了你一眼，没让你退。童姥在梁上看完这一幕，嗤笑一声走了，丢下一句：「小霄凌，护食倒快。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'ts_event_011': {
        id: 'ts_event_011', npcId: TIANSHAN_NPC_ID, title: '心障', icon: '🌀',
        desc: '她练剑入魔障，是你唤醒了她。',
        minAffection: 78, trigger: { random: 0.3 }, cooldown: 0, flag: 'ts_e011_done',
        autoTrigger: { location: '天山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '剑阁传出霜鸣的剑啸——不是平时的低鸣，是凄厉的尖啸。你冲进去，只见琤霄凌执剑狂舞，双目赤红，剑风绞碎了半个剑阁。', type: 'description' },
            { speaker: 'narrator', text: '她入了心障——十二年前的雪夜、师姐的血、那道裂纹，全压上来。霜鸣在她手里颤得像要炸开。', type: 'description' },
            { speaker: 'player_select', text: '你必须立刻做点什么。', options: [
                { text: '冲进去抱住她，不管剑风割人', effect: 'hold', affection: 12 },
                { text: '大喊：「霄凌！师姐让你把它练成，不是让你陪它死！」', effect: 'shout', affection: 10 },
                { text: '拔自己的剑，接她的剑，把她引回当下', effect: 'spar', affection: 11 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'hold': aff = 12; msg = '剑风在你背上豁开几道口子，血溅上霜鸣的裂纹——剑忽然安静了。她伏在你怀里喘息，半晌，哑声：「……你怎么敢。」你不敢。但你敢。'; break;
                case 'shout': aff = 10; msg = '她手腕一抖，霜鸣险些脱手。剑啸戛然而止。她跪在地上，盯着裂纹看了很久，最后把剑轻轻入鞘：「……你比我会说话。」'; break;
                case 'spar': aff = 11; msg = '你的剑接住霜鸣的第三式，两剑相交的颤音里，她的赤红一点点退下去。收剑时她看着你，像第一次见你：「……你的剑，是活的。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'ts_event_013': {
        id: 'ts_event_013', npcId: TIANSHAN_NPC_ID, title: '终章·霜鸣', icon: '💍',
        desc: '霜鸣的裂纹，在这一夜发出了最后一声鸣。',
        minAffection: 85, trigger: { random: 1.0 }, cooldown: 0, flag: 'ts_e013_done',
        endingMap: { '双剑': 'ts_ending_双剑', '雪庐': 'ts_ending_雪庐', '论剑': 'ts_ending_论剑', '守峰': 'ts_ending_守峰', '断鸣': 'ts_ending_断鸣', '独峰': 'ts_ending_独峰' },
        scenes: [
            { speaker: 'narrator', text: '天山大雪夜。剑阁只剩一盏灯。琤霄凌把霜鸣横在膝上，那道裂纹，在灯下亮得像一道愈合的疤。', type: 'description' },
            { speaker: 'npc', text: '「它今天鸣了最后一声。」她抬眼，冰蓝眼底映着你，「裂纹合上了——不是剑好了，是它认了一个人。」' },
            { speaker: 'npc', text: '「{playerName}。霜鸣认了你。」她把剑横在两人之间，霜白的指搭在剑身上，「这柄剑，连同守剑的人，你要不要？」' },
            { speaker: 'player_select', text: '你的选择将决定你们的关系走向', options: [
                { text: '「要。我带你和霜鸣下山——双剑走江湖，哪里有不平就去哪里。」', effect: 'lover_travel', affection: 30 },
                { text: '「要。但哪儿也不去。我把剑挂在天山雪庐，陪您守每一年的雪。」', effect: 'lover_stay', affection: 28 },
                { text: '「剑我接。人就算了——我做您天下第一的剑对手，年年天山论剑。」', effect: 'friend_spar', affection: 20 },
                { text: '「剑我接。雪庐的门，我想一直能推开——做个常客，行吗？」', effect: 'friend_stay', affection: 18 },
                { text: '「我都不要。我只是个路过的剑客。」', effect: 'none', affection: 0 }
            ]}
        ],
        effects: function(npc, choice) {
            // 断鸣兜底：累计负面选择≥5时，恋人选项转为辜负结局
            var negCount = (window._negativeChoiceCount && window._negativeChoiceCount[TIANSHAN_NPC_ID]) || 0;
            if (negCount >= 5 && (choice === 'lover_travel' || choice === 'lover_stay')) {
                return { affection: 0, msg: '她看着你，忽然轻轻笑了，笑意却不达眼底：「……原来守了十二年，等的是这么一句话。」她把霜鸣横在膝上，亲手把那道愈合的裂纹，重新掰断。「你走吧。剑我留着自己听。」', ending: '断鸣' };
            }
            switch (choice) {
                case 'lover_travel': return { affection: 30, msg: '她怔了半晌，缓缓把霜鸣推到你掌心——这是十二年里，她第一次把剑交出别人手里。「……好。下山。我替师姐，把它练成。」她的眼眶红了，雪光照上去，像霜鸣第一次真正鸣响。', ending: '双剑' };
                case 'lover_stay': return { affection: 28, msg: '她低头看了很久的剑，最后把霜鸣挂上雪庐的墙——和你的剑并排。「……好。雪庐的门，往后不落锁。」她声音很轻，轻得像怕惊动这一年的雪。', ending: '雪庐' };
                case 'friend_spar': return { affection: 20, msg: '她哼了一声，难得露出点少年气：「赢了我再说这话。」但她把霜鸣收鞘的动作，比往日都干脆——像一个等到了对手的人。', ending: '论剑' };
                case 'friend_stay': return { affection: 18, msg: '「常客？」她别过脸去，耳尖在霜白鬓发下泛了点红，「……雪庐的茶钱，记你账上。」', ending: '守峰' };
                case 'none': return { affection: 0, msg: '她沉默了很久，把霜鸣重新横回膝上，像没听见那句话。「……也好。」她的声音恢复了平日的冷，「门我照常落锁。路过的剑客，天山不缺。」', ending: '独峰' };
            }
            return { affection: 0, msg: '' };
        }
    }
};

// ============ 琤霄凌结局演出（6个） ============
var TIANSHAN_ENDINGS = {
    'ts_ending_双剑': {
        id: 'ts_ending_双剑', npcId: TIANSHAN_NPC_ID, title: '结局·双剑', icon: '⚔️',
        route: '双剑',
        scenes: [
            { speaker: 'narrator', text: '三天后，琤霄凌把代掌门的印信交还童姥。', type: 'description' },
            { speaker: 'narrator', text: '童姥盘在梁上看着她俩下山，嗤笑一声，没拦。', type: 'description' },
            { speaker: 'npc', text: '「霜鸣给你。」她把剑背在身后，跟你并肩走下天山的长阶，「我空着手——我自个儿就是剑。」' },
            { speaker: 'narrator', text: '多年后，江湖有了「双霜剑」的传说：一柄霜鸣，一个雪隐剑姬。专斩不平。', type: 'description' },
            { speaker: 'narrator', text: '有人见过他们在雪夜的酒馆歇脚。她难得卸了剑，靠在他肩上打了个盹——那剑搁在桌上，纹丝不响。它认了人，不必再鸣。', type: 'description' }
        ],
        finalText: '——— 结局·双剑（道侣·同行）———'
    },
    'ts_ending_雪庐': {
        id: 'ts_ending_雪庐', npcId: TIANSHAN_NPC_ID, title: '结局·雪庐', icon: '🏡',
        route: '雪庐',
        scenes: [
            { speaker: 'narrator', text: '你们留在了天山。雪庐的门，从那夜起再没落过锁。', type: 'description' },
            { speaker: 'narrator', text: '两柄剑并排挂在庐中，霜鸣与{playerTa}的剑，落雪时偶尔轻轻一颤，像在彼此应和。', type: 'description' },
            { speaker: 'npc', text: '「茶好了。」她把杯子推到{playerTa}常坐的那个位置，自己坐对面，「……你今日练的那一式，不对。」' },
            { speaker: 'narrator', text: '童姥偶尔路过雪庐，看见这场景，丢下一句「俗」，走了。但走的时候步子慢了些。', type: 'description' },
            { speaker: 'narrator', text: '守剑的人，终于不必一个人守。霜鸣不必鸣，因为人，已经在。', type: 'description' }
        ],
        finalText: '——— 结局·雪庐（道侣·归隐）———'
    },
    'ts_ending_论剑': {
        id: 'ts_ending_论剑', npcId: TIANSHAN_NPC_ID, title: '结局·论剑', icon: '🤝',
        route: '论剑',
        scenes: [
            { speaker: 'narrator', text: '你们成了江湖闻名的剑道对手。年年天山论剑，胜负各半。', type: 'description' },
            { speaker: 'narrator', text: '没人知道{playerTa}每年上天山，不为赢，只为听她那柄霜鸣鸣一声。', type: 'description' },
            { speaker: 'npc', text: '「今年这一剑，比去年松。」她收剑，难得评价一句，「……再松几年，你就能赢我了。」' },
            { speaker: 'narrator', text: '有人问他们是什么关系。她答「对手」，{playerTa}答「对手」。两个人说完了，对视一眼，都先笑了。', type: 'description' }
        ],
        finalText: '——— 结局·论剑（挚友·同行）———'
    },
    'ts_ending_守峰': {
        id: 'ts_ending_守峰', npcId: TIANSHAN_NPC_ID, title: '结局·守峰', icon: '🍵',
        route: '守峰',
        scenes: [
            { speaker: 'narrator', text: '{playerTa}成了雪庐的常客。茶永远温在{playerTa}那只杯子里。', type: 'description' },
            { speaker: 'narrator', text: '她依旧守天山，依旧冷峻——只是雪庐的门不落锁了。', type: 'description' },
            { speaker: 'npc', text: '「今日雪大。」她推门进来，抖落一身雪，看见{playerTa}在，顿了一下，「……茶，多温一杯。」' },
            { speaker: 'narrator', text: '童姥有次问{playerTa}：「你算她什么？」{playerTa}想了想，说：「常客。」童姥笑出了声。', type: 'description' }
        ],
        finalText: '——— 结局·守峰（挚友·归隐）———'
    },
    'ts_ending_断鸣': {
        id: 'ts_ending_断鸣', npcId: TIANSHAN_NPC_ID, title: '结局·断鸣', icon: '💔',
        route: '断鸣',
        scenes: [
            { speaker: 'narrator', text: '她亲手把愈合的裂纹重新掰断。霜鸣再没鸣过一声。', type: 'description' },
            { speaker: 'narrator', text: '第二年春天，她把霜鸣封进剑匣，挂上雪庐最高的梁。再没取下。', type: 'description' },
            { speaker: 'narrator', text: '天山依旧雪大，她依旧代掌门，依旧冷峻如霜。', type: 'description' },
            { speaker: 'narrator', text: '只是再没有一个姓{playerName}的剑客，被允许推开雪庐的门。', type: 'description' }
        ],
        finalText: '——— 结局·断鸣（辜负）———'
    },
    'ts_ending_独峰': {
        id: 'ts_ending_独峰', npcId: TIANSHAN_NPC_ID, title: '结局·独峰', icon: '🏔️',
        route: '独峰',
        scenes: [
            { speaker: 'narrator', text: '后来你还是上过几次天山。她对你客气，礼数周全，像对一个远来的客。', type: 'description' },
            { speaker: 'narrator', text: '雪庐的门落了锁。霜鸣挂在中龛，再没出鞘。', type: 'description' },
            { speaker: 'narrator', text: '再后来，江湖上偶尔听说天山派的消息——代掌门剑法愈发圆融，传闻她已半步元婴。', type: 'description' },
            { speaker: 'narrator', text: '只是再没人，见她用那柄霜鸣，舞过一次月下的剑。', type: 'description' }
        ],
        finalText: '——— 结局·独峰（错过）———'
    }
};

// ============ 合并主线事件进总事件池 ============
if (typeof NPC_PERSONAL_EVENTS !== 'undefined') {
    Object.assign(NPC_PERSONAL_EVENTS, TIANSHAN_MAIN_EVENTS);
}

// ============ 注册结局集与副作用回调 ============
if (typeof registerEndingSet === 'function') {
    registerEndingSet(TIANSHAN_NPC_ID, TIANSHAN_ENDINGS);
}
if (typeof registerEndingCallback === 'function') {
    registerEndingCallback(TIANSHAN_NPC_ID, function(endingName, npc) {
        if (endingName === '双剑' || endingName === '雪庐') {
            // 道侣结局
            if (npc && typeof npc.setFlag === 'function') npc.setFlag('dao_companion');
            if (window.showMessage) window.showMessage('❄️ 你与琤霄凌结为道侣！剑道感悟大幅提升', 'success');
        } else if (endingName === '论剑' || endingName === '守峰') {
            // 挚友结局：信任大幅提升
            if (npc && npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 30);
            if (window.showMessage) window.showMessage('❄️ 你与琤霄凌成了彼此最信得过的剑友', 'success');
        }
    });
}

// ============ 自动触发包装 + 每日钩子（复用通用 maybeAutoTriggerPersonalEvent） ============
function maybeAutoTriggerTianshanEvent(source) {
    return maybeAutoTriggerPersonalEvent(TIANSHAN_NPC_ID, source, { finalEvents: ['ts_event_013'] });
}

if (typeof window !== 'undefined' && window.timeSystem && window.timeSystem.onNewDaySubscribe) {
    window.timeSystem.onNewDaySubscribe(function() {
        try {
            if (window.currentCharData && window.currentCharData.location === '天山派') {
                maybeAutoTriggerTianshanEvent('daily');
            }
        } catch (e) { console.warn('[琤霄凌线] 每日自动触发失败:', e); }
    });
}

// ============ 导出 ============
if (typeof window !== 'undefined') {
    window.TIANSHAN_MAIN_EVENTS = TIANSHAN_MAIN_EVENTS;
    window.TIANSHAN_ENDINGS = TIANSHAN_ENDINGS;
    window.maybeAutoTriggerTianshanEvent = maybeAutoTriggerTianshanEvent;
}
console.log('[琤霄凌线] 天山派感情线加载完成：结局 ' + Object.keys(TIANSHAN_ENDINGS).length + ' 个 + 主线事件 ' + Object.keys(TIANSHAN_MAIN_EVENTS).length + ' 个');
