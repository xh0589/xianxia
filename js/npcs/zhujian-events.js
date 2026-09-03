// ==================== zhujian-events.js - 冶砚线情缘事件/结局/性别语境 v1.0 ====================
// 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / registerEndingSet / registerEndingCallback /
//       hasEventTriggered / isChainHead / checkEventTrigger / triggerPersonalEvent / canPlayerAccessPersonalEvent）
//       npcs/npc-system.js（executeEmotionInteraction）
// 加载顺序：在 npc-personal-events.js 之后
// 男主·冶砚（铸剑山庄少庄主，铸剑师，火性赤诚，怕冷却不说）。
// 男女玩家皆可追，主线共享（代词按性别），各有专属性别语境事件（femctx/mctx）。

var LU_NPC_ID = 'sect_leader_铸剑山庄';

// ============ 主线事件（lu_event_001 ~ 008 + 终章 013） ============
var LU_MAIN_EVENTS = {
    'lu_event_001': {
        id: 'lu_event_001', npcId: LU_NPC_ID, title: '炉前', icon: '🔥',
        desc: '火星溅来，他侧身挡在你前面。',
        minAffection: 12, trigger: { random: 0.4 }, cooldown: 0, flag: 'lu_e001_done',
        autoTrigger: { location: '铸剑山庄', random: 0.45 },
        scenes: [
            { speaker: 'narrator', text: '你在天工炉前看人打铁。一锤落，火星迸溅——一道身影侧身挡到你前面，围裙被烫出几个焦黑的小洞。', type: 'description' },
            { speaker: 'npc', text: '「站远点。」冶砚没回头，声音被炉火烘得发烫，「炉前没眼力见，眼睛先废。」' },
            { speaker: 'narrator', text: '他回头看你一眼，琥珀色的眼底炉火一映，愣了愣。', type: 'description' },
            { speaker: 'npc', text: '「……头回来？」他抓起一把钳子递你，「要看就站这儿，我挡着。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '接过钳子：「我帮你递。」', effect: 'help', affection: 5 },
                { text: '「我能照顾自己，你专心打。」', effect: 'independent', affection: 4 },
                { text: '「你围裙烧穿了，先换一件。」', effect: 'care', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'help': aff = 5; msg = '他咧嘴笑了，露出虎牙：「行。递钳的活归你——但别嫌烫。」你俩在炉前一站就是一下午。'; break;
                case 'independent': aff = 4; msg = '他点头，没多说。但下一锤落，火星朝你这边飞时，他还是先一步挪了身位。'; break;
                case 'care': aff = 6; msg = '他低头看了眼围裙，挠头：「……忘了。」他脱下来换，换到一半想起你在，耳根红了一下，「你别看。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'lu_event_002': {
        id: 'lu_event_002', npcId: LU_NPC_ID, title: '三年未成之剑', icon: '⚔️',
        desc: '他铸了三年没铸成的剑。',
        minAffection: 18, trigger: { random: 0.35 }, cooldown: 0, flag: 'lu_e002_done',
        autoTrigger: { location: '铸剑山庄', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '深夜炉房。冶砚对着一块烧红的玄铁发愣，锤子悬着没落。', type: 'description' },
            { speaker: 'npc', text: '「这柄剑，我铸了三年。」他声音闷闷的，「换了七块料，没一块成。师父说差一口气——可我不知道差在哪。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「差的那口气，是不是你自己的？」', effect: 'truth', affection: 7 },
                { text: '「三年不成就算了，换一柄。」', effect: 'quit', affection: -2 },
                { text: '默默替他拉风箱', effect: 'bellows', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'truth': aff = 7; msg = '他猛地看你，琥珀眼底动了动：「……你倒看得清。」他放下锤子，「我铸剑，铸的是火候。可这三年，炉前只有我一个人——火再旺，也是冷的。」'; break;
                case 'quit': aff = -2; msg = '他脸色一沉：「算了？」他重新举锤，「陆家的剑没有算了。你出去。」——那夜炉火没停，他一个人打到天亮。'; break;
                case 'bellows': aff = 6; msg = '你没说话，过去拉风箱。火苗腾起来，他看着你拉，许久，锤子落了下去——这一夜，铁比往日软。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'lu_event_003': {
        id: 'lu_event_003', npcId: LU_NPC_ID, title: '火候', icon: '🔥',
        desc: '他教你辨火候。',
        minAffection: 25, trigger: { random: 0.35 }, cooldown: 0, flag: 'lu_e003_done',
        autoTrigger: { location: '铸剑山庄', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '他把你拉到炉前，抓着你的手腕凑近炉口。', type: 'description' },
            { speaker: 'npc', text: '「看火。」他指炉中，「青白是急了，橘红刚好，发黄是疲了。剑成不成，先看这口气。」' },
            { speaker: 'npc', text: '他没松你的手腕，掌心很烫。「……你手凉。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「你手太烫了。」', effect: 'hot', affection: 5 },
                { text: '不动，让他握着', effect: 'stay', affection: 7 },
                { text: '「你教我辨火，我教你暖手。」', effect: 'teach', affection: 8 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'hot': aff = 5; msg = '他一抖，松开手，挠后脑勺：「……习惯了，炉前都烫。」他别开脸，「你怕烫，往后站。」'; break;
                case 'stay': aff = 7; msg = '他僵了一下，没缩。火光里他低头看你被握的手腕，许久才松开——松得有点慢。'; break;
                case 'teach': aff = 8; msg = '他愣了愣，忽然笑出声，虎牙露出来：「……暖手？我自个儿就是火炉。」但他把你的手拢进自己掌心，握得紧，「行，你教。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'lu_event_004': {
        id: 'lu_event_004', npcId: LU_NPC_ID, title: '冷夜添柴', icon: '🪵',
        desc: '深夜炉熄，他怕冷却不说。',
        minAffection: 32, trigger: { random: 0.3 }, cooldown: 0, flag: 'lu_e004_done',
        autoTrigger: { location: '铸剑山庄', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '入冬。炉房夜里熄了火省炭。你路过，看见冶砚缩在炉前的草席上，裹着围裙打盹，脸冻得发青，却没添柴。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '去抱一捆柴，把炉重新生起来', effect: 'fire', affection: 7 },
                { text: '把自己的外衣盖他身上', effect: 'cloak', affection: 8 },
                { text: '「你怎么不生火？」', effect: 'ask', affection: 4 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'fire': aff = 7; msg = '火生起来，他醒了，看见是你生的，没说话，往火边挪了挪——给你让了个位置。「……下回别替我省炭。」他说，但坐下时离你很近。'; break;
                case 'cloak': aff = 8; msg = '他惊醒，看见外衣盖在身上，抬头看你，琥珀眼底炉火似的亮了一瞬：「你……」他顿住，把外衣往你肩上披，「我扛冻。你扛不住。」——但他没再让你走，往火边挪了挪，给你让位。'; break;
                case 'ask': aff = 4; msg = '他闷声：「省炭。」你看见他手指在发抖。他顺着你的目光把手缩进袖里，「铸剑的，不怕冷。」——但他没拒绝你坐下。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'lu_event_005': {
        id: 'lu_event_005', npcId: LU_NPC_ID, title: '试剑', icon: '🗡️',
        desc: '他让你试一柄新剑。',
        minAffection: 40, trigger: { random: 0.3 }, cooldown: 0, flag: 'lu_e005_done',
        autoTrigger: { location: '铸剑山庄', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '他抱一柄没开刃的剑过来，往你手里一塞。剑身朴素，却轻得不像铁。', type: 'description' },
            { speaker: 'npc', text: '「试一剑。」他抱臂，「看顺不顺手。我照着你这把，调的。」' },
            { speaker: 'player_select', text: '你如何试剑？', options: [
                { text: '劈一剑，稳而利', effect: 'strike', affection: 8 },
                { text: '「你怎么知道我的手型？」', effect: 'how', affection: 7 },
                { text: '把剑还他：「太贵重，我不收。」', effect: 'refuse', affection: -3 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'strike': aff = 8; msg = '一剑劈出，破风利落。他眼睛亮了，一把夺回剑看了看刃：「成了——这柄，归你。」他难得话多，「我照着你虎口的茧调的配重，别人用不顺。」'; break;
                case 'how': aff = 7; msg = '他挠头：「……我看你握过几次。」他咳了一声，「铸剑的，看人手型是本分。」——可他记住的，是你虎口那道茧的位置。'; break;
                case 'refuse': aff = -3; msg = '他脸色一沉，把剑收回鞘：「……行。」他转身，「我铸多了。」——那柄剑后来挂在他炉房的墙上，没再给第二个人看过。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'lu_event_006': {
        id: 'lu_event_006', npcId: LU_NPC_ID, title: '烫疤', icon: '🩹',
        desc: '你看到他手上的烫疤。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'lu_e006_done',
        autoTrigger: { location: '铸剑山庄', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '他递水给你，你握住杯子——也握住了他指节上一片连到掌心的旧烫疤，硬而亮。', type: 'description' },
            { speaker: 'npc', text: '他要抽手，没抽。半晌：「铸剑的，都有。」他声音有点哑，「这一片是十二岁那年，替师父挡一炉塌的火。我师姐那年刚走，师父犯了糊涂。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '不放手，拇指轻按那片疤', effect: 'touch', affection: 9 },
                { text: '「以后烫了别瞒我。」', effect: 'promise', affection: 7 },
                { text: '松手：「以后小心点。」', effect: 'let', affection: 3 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'touch': aff = 9; msg = '他整个人僵住，连呼吸都顿了。许久，他低声：「……你按着它，比火还烫。」——他没抽手，任你按到掌心都暖了。'; break;
                case 'promise': aff = 7; msg = '他笑了一下：「行。」他没说「好」也没说「不」——但他把杯子换了只手，空出烫疤那只，递到你跟前，「那你看着。」'; break;
                case 'let': aff = 3; msg = '他收回手，揣进袖里。「嗯。」他说，端起自己的水喝了一口，那夜他没再靠近你。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'lu_event_007': {
        id: 'lu_event_007', npcId: LU_NPC_ID, title: '断剑', icon: '💔',
        desc: '一柄剑铸断了。',
        minAffection: 55, trigger: { random: 0.3 }, cooldown: 0, flag: 'lu_e007_done',
        autoTrigger: { location: '铸剑山庄', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '一声脆响。冶砚铸了三年的那柄剑，在最后一锤断了。他举着断成两截的剑，没动。', type: 'description' },
            { speaker: 'npc', text: '「……断了。」他声音很平，平得吓人。半晌他把断剑扔进炉，「三年。又是三年。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '进炉房，把断剑从火里夹出来', effect: 'salvage', affection: 10 },
                { text: '「断了就断了。下一柄更利。」', effect: 'next', affection: 5 },
                { text: '什么都不说，站他旁边', effect: 'silent', affection: 8 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'salvage': aff = 10; msg = '你用钳子把断剑从炉火里夹出来，断口还红着。他看着你，琥珀眼底红了：「……你捡它干嘛，废铁。」你说：「断口干净，能接。」他沉默良久，接过断剑——他接的不是剑，是你。'; break;
                case 'next': aff = 5; msg = '他点头：「嗯。」他重新坐回锤前，抓起一块新料。但你看见他握锤的手在抖——他没让你看见。'; break;
                case 'silent': aff = 8; msg = '你在他旁边站了很久。炉火噼啪。许久他开口，声音哑：「你站这儿，炉子都没那么冷了。」——他没看你，但往你这边靠了半步。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'lu_event_008': {
        id: 'lu_event_008', npcId: LU_NPC_ID, title: '怕冷', icon: '❄️',
        desc: '他终于承认怕冷。',
        minAffection: 62, trigger: { random: 0.3 }, cooldown: 0, flag: 'lu_e008_done',
        autoTrigger: { location: '铸剑山庄', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '又是冷夜。这回他没省炭，炉火烧得旺。你进去时，他坐在炉前，看着火出神。', type: 'description' },
            { speaker: 'npc', text: '「我跟你说个事。」他没看你，看着火，「我五岁被师父从炉灰里捡回来——我不记得爹娘。我只记得，小时候冷。」' },
            { speaker: 'npc', text: '「铸剑的火再旺，我一个人坐炉前，还是冷。」他终于看你，琥珀眼底有东西碎开，「……直到你肯进这炉房。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「那我以后天天来炉房。」', effect: 'come', affection: 10 },
                { text: '坐他旁边，肩挨肩', effect: 'sit', affection: 9 },
                { text: '「你不用再一个人扛冷了。」', effect: 'carry', affection: 8 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'come': aff = 10; msg = '他咧嘴笑，虎牙全露出来：「……行。炉房我给你留个位。」他顿了顿，「你别嫌我身上烫——也别说出去。怕冷这话，我头回跟人说。」'; break;
                case 'sit': aff = 9; msg = '你没说话，坐到他旁边，肩挨着肩。他没动，许久，把头靠过来一点点，搁在你肩上——很轻，像怕压碎什么。「……你不走，炉子就不冷了。」'; break;
                case 'carry': aff = 8; msg = '他看了你很久，忽然伸手把你拢过来——整个人，不是手。他身上很烫，像一座炉。「……行。」他声音闷在你肩窝里，「那你扛着。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'lu_event_013': {
        id: 'lu_event_013', npcId: LU_NPC_ID, title: '终章·一柄为你铸的剑', icon: '💍',
        desc: '三年未成之剑，今夜开刃。',
        minAffection: 85, trigger: { random: 1.0 }, cooldown: 0, flag: 'lu_e013_done',
        endingMap: { '炉火同道': 'lu_ending_炉火同道', '守炉': 'lu_ending_守炉', '剑友': 'lu_ending_剑友', '错过': 'lu_ending_错过' },
        scenes: [
            { speaker: 'narrator', text: '天工炉房。冶砚把一柄剑横在你面前——剑身亮得像一炉新火，配重是你虎口的茧型。三年未成之剑，开刃了。', type: 'description' },
            { speaker: 'npc', text: '「成了。」他声音哑哑的，「我铸了三年。第一年差口气，第二年差火候，第三年——差个人。」' },
            { speaker: 'npc', text: '「{playerName}。」他把剑推向你，「这柄剑，连同铸剑的人，你要不要？」' },
            { speaker: 'player_select', text: '你的选择将决定你们的关系走向', options: [
                { text: '「要。我带你和这柄剑下山——一剑走江湖，哪里有不平就去哪里。」', effect: 'lover_travel', affection: 30 },
                { text: '「要。但哪儿也不去。我留在铸剑山庄，陪你守每一炉火。」', effect: 'lover_stay', affection: 28 },
                { text: '「剑我接。人就算了——我做你天下第一的试剑对手，年年铸剑山庄论剑。」', effect: 'friend', affection: 20 },
                { text: '「我都不要。我只是个路过的看客。」', effect: 'none', affection: 0 }
            ]}
        ],
        effects: function(npc, choice) {
            var negCount = (window._negativeChoiceCount && window._negativeChoiceCount[LU_NPC_ID]) || 0;
            if (negCount >= 5 && (choice === 'lover_travel' || choice === 'lover_stay')) {
                return { affection: 0, msg: '他看着你，慢慢收回了剑。「……我铸了三年，等的不是这句话。」他把剑挂回炉房最高的梁，「你走吧。这柄剑，我留着自己听火。」', ending: '错过' };
            }
            switch (choice) {
                case 'lover_travel': return { affection: 30, msg: '他怔了半晌，忽然一把把你抱起来转了一圈，虎牙全露：「好——下山！我跟你走，炉子我托付给师兄了。」他的笑比炉火还亮，「三年，总算铸成了。」', ending: '炉火同道' };
                case 'lover_stay': return { affection: 28, msg: '他点头，把剑和你一起拢进怀里：「……行。铸剑山庄的炉，往后有两盏火。」他声音闷闷的，「你陪我守——炉不冷，我也不冷了。」', ending: '守炉' };
                case 'friend': return { affection: 20, msg: '他哼了一声，虎牙露出来：「试剑对手？行。」他把剑塞你手里，「那你接得住我一炉新剑再说。」——但他笑得像个少年。', ending: '剑友' };
                case 'none': return { affection: 0, msg: '他沉默了很久，把剑收回鞘。「……也好。」他声音恢复平日的闷，「炉房的门，我照常锁。看客嘛，看看就走。」', ending: '错过' };
            }
            return { affection: 0, msg: '' };
        }
    }
};

// ============ 冶砚结局演出（4 个） ============
var LU_ENDINGS = {
    'lu_ending_炉火同道': {
        id: 'lu_ending_炉火同道', npcId: LU_NPC_ID, title: '结局·炉火同道', icon: '⚔️',
        route: '炉火同道',
        scenes: [
            { speaker: 'narrator', text: '三日后，冶砚把少庄主之印交还欧冶子。', type: 'description' },
            { speaker: 'npc', text: '「炉子托付给您了。」他背一柄剑，跟你并肩下山，「我自个儿，就是一柄剑。」' },
            { speaker: 'narrator', text: '多年后，江湖有「炉火双剑」的传说：一柄是他铸的，一柄是他自己。专斩不平。', type: 'description' },
            { speaker: 'narrator', text: '有人见过他们在雪夜的酒馆歇脚。他难得没拢炉火，靠在{playerTa}肩上打了个盹——那柄剑搁在桌上，刃口映着火光。他不冷了。', type: 'description' }
        ],
        finalText: '——— 结局·炉火同道（道侣·同行）———'
    },
    'lu_ending_守炉': {
        id: 'lu_ending_守炉', npcId: LU_NPC_ID, title: '结局·守炉', icon: '🏡',
        route: '守炉',
        scenes: [
            { speaker: 'narrator', text: '你留在了铸剑山庄。天工炉房的门，从那夜起再没落锁。', type: 'description' },
            { speaker: 'narrator', text: '炉房里多了一个人坐的位置，风箱由你拉，锤由他落。', type: 'description' },
            { speaker: 'npc', text: '「火对了。」他停锤看你，「橘红——正好。」他咧嘴，虎牙露出来，「你拉风箱的气口，比谁都稳。」' },
            { speaker: 'narrator', text: '欧冶子偶尔路过，看这场景，嘀咕一句「炉火旺了」，走了。但走时步子慢了些。', type: 'description' },
            { speaker: 'narrator', text: '炉房再没有冷夜——两盏火，一炉旺。', type: 'description' }
        ],
        finalText: '——— 结局·守炉（道侣·归隐）———'
    },
    'lu_ending_剑友': {
        id: 'lu_ending_剑友', npcId: LU_NPC_ID, title: '结局·剑友', icon: '🤝',
        route: '剑友',
        scenes: [
            { speaker: 'narrator', text: '你们成了江湖闻名的试剑搭档。年年铸剑山庄论剑，胜负各半。', type: 'description' },
            { speaker: 'npc', text: '「今年这柄，比去年利。」他收剑，「……再松几年，你就能接住我三年那柄了。」' },
            { speaker: 'narrator', text: '有人问你们是什么关系。他答「对手」，{playerTa}答「对手」。说完两人对视，都先笑了。', type: 'description' }
        ],
        finalText: '——— 结局·剑友（挚友·同行）———'
    },
    'lu_ending_错过': {
        id: 'lu_ending_错过', npcId: LU_NPC_ID, title: '结局·错过', icon: '🏔️',
        route: '错过',
        scenes: [
            { speaker: 'narrator', text: '后来你还是去过几次铸剑山庄。炉房开着，他对你客气，礼数周全，像个对远来客。', type: 'description' },
            { speaker: 'narrator', text: '那柄三年铸成的剑挂在天工炉房最高的梁，再没出鞘。', type: 'description' },
            { speaker: 'narrator', text: '再后来，江湖偶有传闻——铸剑山庄少庄主剑法愈发圆融，只是再没人见他，在炉前为谁留过一柄剑。', type: 'description' }
        ],
        finalText: '——— 结局·错过（错过）———'
    }
};

// ============ 性别语境事件（femctx 女玩家 / mctx 男玩家，互斥） ============
var LU_GENDER_CTX_EVENTS = {
    // 女玩家：炉前少见女修，欧冶子/师兄的眼光
    'lu_event_femctx': {
        id: 'lu_event_femctx', npcId: LU_NPC_ID, title: '炉前女修', icon: '🔥',
        desc: '欧冶子把你单独叫住了。',
        minAffection: 55, trigger: { random: 0.35 }, cooldown: 0, flag: 'lu_e_femctx_done',
        requirePlayerFemale: true,
        autoTrigger: { location: '铸剑山庄', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '欧冶子把你叫到一旁，难得没眯着眼打盹。', type: 'description' },
            { speaker: 'npc', text: '「姑娘。」欧冶子开门见山，「铸剑山庄的炉，三十年没让女修近过——你是头一个。我那义子……」他顿了顿，「他不懂疼人。我怕你跟着他，烫一身疤。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「他不懂疼人，我教他。」', effect: 'teach', affection: 8 },
                { text: '「欧前辈，我自愿的。疤我认。」', effect: 'accept', affection: 7 },
                { text: '「您是怕我伤他，还是怕他伤我？」', effect: 'probe', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'teach': aff = 8; msg = '欧冶子愣了一下，忽然笑了：「……好。你教。」他拍拍你肩，「那小子炉前犟，你比他犟就行。烫疤——你们一人一半。」'; break;
                case 'accept': aff = 7; msg = '欧冶子点头：「自愿的……好。」他叹气，「那炉前，给你留个位。疤认了，就别怨。」'; break;
                case 'probe': aff = 6; msg = '欧冶子眯眼看了你半晌：「……两样都怕。」他背手走了，丢下一句，「他伤不着你——你是怕他冷，我看得见。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // 男玩家：两个男修炉前，师兄的眼光
    'lu_event_mctx': {
        id: 'lu_event_mctx', npcId: LU_NPC_ID, title: '炉前两个男修', icon: '🔥',
        desc: '师兄把你拉到一旁。',
        minAffection: 55, trigger: { random: 0.35 }, cooldown: 0, flag: 'lu_e_mctx_done',
        requirePlayerMale: true,
        autoTrigger: { location: '铸剑山庄', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '师兄干将把你拉到炉房后头，左右看了一眼，压低声。', type: 'description' },
            { speaker: 'npc', text: '「师弟。」干将盯着你，「你跟少庄主……炉前两个大男人，成天挨着打铁，庄里都传开了。」' },
            { speaker: 'npc', text: '「我不是说这不好。我是说，江湖上两个男修同行，嘴比炉灰还多——你受得住，他受得住吗？他那个性子，护短护得狠。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「他护短，我扛事。嘴归嘴。」', effect: 'defy', affection: 8 },
                { text: '「师兄，我们还没到那一步。」', effect: 'deny', affection: 3 },
                { text: '「他要是被人嚼舌根，我先拔剑。」', effect: 'shield', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'defy': aff = 8; msg = '干将点头：「……行。你扛得住。」他拍你肩，「嘴归嘴，谁敢动你们，先过我干将这关——我跟少庄主从小一个炉前长大。」'; break;
                case 'deny': aff = 3; msg = '干将看了你一眼，没多说：「……没到那一步。」他背手走了，「那行。但他记你，我看得见。」'; break;
                case 'shield': aff = 7; msg = '干将笑了：「你倒护他。」他想了想，「他那个性子，真有人嚼舌根，他自己先拔剑——你跟他，倒是一样犟。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    }
};

// ============ 合并进总事件池 ============
if (typeof NPC_PERSONAL_EVENTS !== 'undefined') {
    Object.assign(NPC_PERSONAL_EVENTS, LU_MAIN_EVENTS);
    Object.assign(NPC_PERSONAL_EVENTS, LU_GENDER_CTX_EVENTS);
}

// ============ 注册结局集与副作用回调 ============
if (typeof registerEndingSet === 'function') {
    registerEndingSet(LU_NPC_ID, LU_ENDINGS);
}
if (typeof registerEndingCallback === 'function') {
    registerEndingCallback(LU_NPC_ID, function(endingName, npc) {
        if (endingName === '炉火同道' || endingName === '守炉') {
            if (npc && typeof npc.setFlag === 'function') npc.setFlag('dao_companion');
            if (window.showMessage) window.showMessage('🔥 你与冶砚结为道侣！铸剑感悟大幅提升', 'success');
        } else if (endingName === '剑友') {
            if (npc && npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 30);
            if (window.showMessage) window.showMessage('🔥 你与冶砚成了彼此最信得过的试剑搭档', 'success');
        }
    });
}

// ============ 男主名册（每日钩子用，本文件自持，后续男主各文件依次 push 并入） ============
// eventId=吃醋对峙事件，reconcileId=吃醋后的和好事件，与女主名册 HEROINE_ROSTER 同构
var MALE_LEAD_ROSTER = [
    { id: LU_NPC_ID, name: '冶砚', sect: '铸剑山庄', eventId: 'lu_event_rival', reconcileId: 'lu_event_reconcile', femctxId: 'lu_event_femctx', mctxId: 'lu_event_mctx' }
];
if (typeof window !== 'undefined') window.MALE_LEAD_ROSTER = MALE_LEAD_ROSTER;

// ============ 自动触发 + 每日钩子（复用 maybeAutoTriggerPersonalEvent） ============
function maybeAutoTriggerLuEvent(source) {
    return maybeAutoTriggerPersonalEvent(LU_NPC_ID, source, { finalEvents: ['lu_event_013'] });
}

if (typeof window !== 'undefined' && window.timeSystem && window.timeSystem.onNewDaySubscribe) {
    window.timeSystem.onNewDaySubscribe(function() {
        try {
            if (window.currentCharData && window.currentCharData.location === '铸剑山庄') {
                maybeAutoTriggerLuEvent('daily');
            }
            // 性别语境：每日在该派过夜 + 对应性别 + 好感≥55 + 未触发
            if (!window.currentCharData || !window.npcManager) return;
            var loc = window.currentCharData.location || '';
            if (loc !== '铸剑山庄') return;
            var npc = window.npcManager.getNPC ? window.npcManager.getNPC(LU_NPC_ID) : null;
            if (!npc) return;
            var aff = (npc.relationship && npc.relationship.affection) || 0;
            if (aff < 55) return;
            var isF = window.currentCharData.gender === 'female';
            var ctxId = isF ? 'lu_event_femctx' : 'lu_event_mctx';
            if (typeof hasEventTriggered === 'function' && hasEventTriggered(ctxId)) return;
            var ev = NPC_PERSONAL_EVENTS[ctxId];
            if (!ev) return;
            if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npc)) return;
            setTimeout(function() {
                if (document.querySelector && document.querySelector('.personal-event-modal')) return;
                if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npc)) return;
                if (typeof triggerPersonalEvent === 'function') triggerPersonalEvent(ctxId);
            }, 1200);
        } catch (e) { console.warn('[冶砚线] 每日触发失败:', e); }
    });
}

// ============ 导出 ============
if (typeof window !== 'undefined') {
    window.LU_MAIN_EVENTS = LU_MAIN_EVENTS;
    window.LU_ENDINGS = LU_ENDINGS;
    window.maybeAutoTriggerLuEvent = maybeAutoTriggerLuEvent;
}
console.log('[冶砚线] 铸剑山庄男主线加载完成：结局 ' + Object.keys(LU_ENDINGS).length + ' 个 + 主线事件 ' + Object.keys(LU_MAIN_EVENTS).length + ' 个 + 性别语境 ' + Object.keys(LU_GENDER_CTX_EVENTS).length + ' 个');
