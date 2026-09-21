// ==================== tangmen-events.js - 晏万解线情缘事件/结局/性别语境 v1.0（唐门扩线） ====================
// 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / registerEndingSet / registerEndingCallback /
//       hasEventTriggered / checkEventTrigger / triggerPersonalEvent / canPlayerAccessPersonalEvent）
//       npcs/npc-system.js（executeEmotionInteraction 已加 bond_dao 拦截）
// 加载顺序：在 npc-personal-events.js 之后
// 女主·晏万解（唐门毒堂堂主，唐老太太亲点的下任当家。嘴毒心软、傲娇：骂人时带笑，制解药时会哭）。
// 与门主唐无痕（其父）并存：她随母姓晏——母亲是外姓女子，牵机散流案里为自证清白当场试毒而亡。
// 唐老太太（祖母辈老封君）默许并暗中护她；守旧派（暗器）与革新派（机关）的角力是背景音。
// 自幼以毒淬体，百毒不侵，代价是毒积体内、双手浸毒，常年戴白丝手套——不是洁癖，是怕伤人。
// 「万解」是她母亲取的名：一门制毒，她偏要制解。信物是她亲手缝的布手套。
// 男女玩家皆可追，主线共享（代词按性别），各有专属性别语境事件（femctx/mctx）。

var TM_NPC_ID = 'sect_leader_唐门';

// ============ 主线事件（tm_event_001 ~ 011 + 终章 013） ============
var TM_MAIN_EVENTS = {
    'tm_event_001': {
        id: 'tm_event_001', npcId: TM_NPC_ID, title: '毒堂三盏茶', icon: '🍵',
        desc: '案上三盏茶，三样毒，分量不同。',
        minAffection: 12, trigger: { random: 0.4 }, cooldown: 0, flag: 'tm_e001_done',
        autoTrigger: { location: '唐门', random: 0.45 },
        scenes: [
            { speaker: 'narrator', text: '你初入唐门，被引进毒堂。堂里药气沉沉，正中一张黑漆长案，案上三盏茶，茶汤三色——一位白衣女子抱臂立在案后，白丝手套在灯下泛着冷光。', type: 'description' },
            { speaker: 'npc', text: '「三盏茶，三样毒，分量不同。」她唇角一挑，眼里带笑，话里带刺，「唐门的客，先喝茶。敢喝哪盏，喝哪盏——不敢喝，门在那边。」' },
            { speaker: 'narrator', text: '你细看：一盏汤色清亮，一盏微浊，一盏沉着一线极细的青。她就这么抱着臂看你，像看一只自己送上门的小白鼠。', type: 'description' },
            { speaker: 'player_select', text: '你如何选？', options: [
                { text: '嗅色辨毒，端起分量最轻的那盏，一饮而尽', effect: 'drink', affection: 7 },
                { text: '把三盏茶一一嗅过，说出各是什么毒，再喝最轻的', effect: 'name', affection: 6 },
                { text: '端起最重那盏，笑着看她：「堂主总不至于毒死头一个客人。」', effect: 'bluff', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'drink': aff = 7; msg = '你端起最清的那盏一口喝干。舌尖半麻，片刻即散——是三分量的「见血封喉」稀释过的底子。她抱臂的姿势松了半分：「眼力不错，胆子也凑合。」她收回茶盏，「唐门的茶，你算是喝过第一回了。」——毒堂认人，就认这一盏。'; break;
                case 'name': aff = 6; msg = '你逐一嗅过，报出名目，报了两个，第三个卡住。她不恼，反而笑出声：「错的那个，是我自己起的名字，谱上查不到。」她摆摆手，「喝最轻那盏罢。认得两样毒还敢进门，比认得十样毒不敢下嘴的强。」'; break;
                case 'bluff': aff = 5; msg = '你端起汤色最沉的那盏。她眉梢一动，没拦——你喝到一半，后颈开始发凉，她这才慢悠悠递来一盏温水：「三分毒，凉半个时辰。记住这个凉。」她看着你灌下温水，笑得好看又欠揍，「唐门的规矩：毒不死人，但教你长记性。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'tm_event_002': {
        id: 'tm_event_002', npcId: TM_NPC_ID, title: '毒舌', icon: '🗯️',
        desc: '她三句话把你从头损到脚。',
        minAffection: 18, trigger: { random: 0.35 }, cooldown: 0, flag: 'tm_e002_done',
        autoTrigger: { location: '唐门', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '毒堂廊下，你正帮伙计搬药箱。晏万解路过，脚步一停，上下打量你。', type: 'description' },
            { speaker: 'npc', text: '「肩宽，手笨，眼神倒还干净。」她三句话把你从头损到脚，末了补一刀，「搬个箱子像捧着骨灰——唐门的药比你的命值钱，仔细着点。」说完她自己先笑了，笑得还挺好看。' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「药值钱，我的命也值钱——所以两只手都捧着。」', effect: 'banter', affection: 7 },
                { text: '认真请教：「堂主这三句，哪句是真的？」', effect: 'ask', affection: 6 },
                { text: '「制毒的，也配谈救人？」', effect: 'mock', affection: -4 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'banter': aff = 7; msg = '她站住了，回头把你重新看了一遍，像头一回认识你：「嘴挺利。」她伸手把药箱接过去一半分量，「利嘴的人手笨不到哪去——搬完这趟，来堂里领一包解乏的药。」她走了两步又回头，「不收费。唐门难得不收费。」'; break;
                case 'ask': aff = 6; msg = '她挑挑眉：「哪句是真的？」她想了想，很认真地答，「眼神干净那句。另外两句——」她转身走了，声音飘回来，「看你日后表现。」你愣在原地：这算是毒堂的考语，还是她跟你开的第一个玩笑？'; break;
                // 真负选项：「一门制毒，她偏要制解」是她立身的执念，「制毒的也配谈救人」戳的是她半生的逆鳞
                case 'mock': aff = -4; msg = '她脸上的笑一寸寸淡下去，白手套的手指轻轻蜷了一下。「配不配，不劳外人评。」她声音还是软的，软得像淬了毒的棉，「我娘拿命试毒的时候，没人问她配不配。」她转身进了毒堂，那扇门在你面前关了整整一个月。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'tm_event_003': {
        id: 'tm_event_003', npcId: TM_NPC_ID, title: '手套', icon: '🧤',
        desc: '她的白丝手套，从不离手。',
        minAffection: 25, trigger: { random: 0.35 }, cooldown: 0, flag: 'tm_e003_done',
        autoTrigger: { location: '唐门', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '入夏，毒堂里人人都短打单衣，只有晏万解一袭白衣、双手始终罩在白丝手套里——配毒时戴，试药时戴，连喝茶都戴。伙计们私下说：小姐有洁癖，嫌旁人脏。', type: 'description' },
            { speaker: 'npc', text: '这日她替你递一盏解毒的汤药，指尖将将擦过你的手背，她像被烫了一下，猛地缩手，药盏晃出半盏。她盯着自己的手套，半晌没说话。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「天这么热，捂着手不闷么？」只问，不动手', effect: 'ask', affection: 7 },
                { text: '伸手就要去摘她的手套：「让我看看洁癖底下是什么。」', effect: 'grab', affection: -5 },
                { text: '把洒了的药盏接过来：「烫着没有？手套的事，你肯说时我再听。」', effect: 'wait', affection: 8 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0; var msg = '';
            switch (choice) {
                case 'ask': aff = 7; msg = '她低头看着自己的手，很久，说了半句实话：「闷。」顿了顿，又补了半句，「闷，也得戴。」她抬眼看你，眼里有一点少见的认真，「不是嫌你们脏。是我——」她收住了，转身重新配药。那半句话你记了很久。后来你才知道，那已经是她肯说的极限。'; break;
                // 真负选项：手套是她与人间隔着的最后一层，贸然去摘等于掀她的命门
                case 'grab': aff = -5; msg = '你的手刚碰到那截白丝，她整个人像中了自家最烈的毒——反手一扣你的腕，力道大得不像配药的手。「别碰。」她声音在抖，不是恼，是怕，「你不知道你在摘什么。」她松开你，退了三步，把手拢进袖中。那之后她见你，手套戴得比从前更紧——你很久以后才明白，她那晚怕的不是你看见，是你看见之后还活着。'; break;
                case 'wait': aff = 8; msg = '你没看她的手，先接了药盏，还问了一句烫着没有。她怔在那里，耳根慢慢红了，嘴硬照旧：「唐门的人，烫不着。」可她把剩下的半盏药重新斟满，双手捧着递你——这一次，指尖没有躲。「……你这个人。」她小声说，「等得起。」毒堂的人后来说，小姐那天的药，配得比哪一天都细。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'tm_event_004': {
        id: 'tm_event_004', npcId: TM_NPC_ID, title: '暗器坊雨夜', icon: '🌧️',
        desc: '蜀中夜雨，她独自在暗器坊校机簧。',
        minAffection: 32, trigger: { random: 0.3 }, cooldown: 0, flag: 'tm_e004_done',
        autoTrigger: { timeRange: [21, 3], location: '唐门', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '蜀中的夜雨说来就来。你起夜路过暗器坊，里面还亮着一豆灯——晏万解独自坐在灯下，一柄拆了一半的袖弩摊在案上，她正拿镊子校一枚细如发丝的机簧。守旧派的老暗器，她一个制毒的堂主，修得比谁都耐心。', type: 'description' },
            { speaker: 'npc', text: '「睡不着？」她头也不抬，「雨声吵？——蜀中的雨就这样，一年下半年。」镊子极稳，机簧「嗒」地一声归位，她才直起腰，揉了揉发酸的肩。' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '把带来的热汤搁她手边，坐下陪她校完这一具', effect: 'soup', affection: 8 },
                { text: '不说话，在一旁帮她递工具、扶灯', effect: 'assist', affection: 7 },
                { text: '「夜深了，歇息罢。」顺手替她吹了灯', effect: 'douse', affection: -3 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'soup': aff = 8; msg = '热汤的白气混着雨气漫开来。她盯着那碗汤看了两息，嘴上说「多事」，手却没停——校完最后一枚簧，才捧起碗，喝得很慢。灯下她忽然说：「守旧派的老东西，没人肯修了。他们说我一个制毒的碰暗器是越界。」她喝了口汤，「我偏碰。唐门的器，烂在库里，才是真越界。」那夜雨声很大，灯很小，你们坐到天明。'; break;
                case 'assist': aff = 7; msg = '你扶灯、递镊子，两个人配合得意外地顺。她校到最后一簧，忽然开口：「手稳。」顿了顿，又补，「比我爹手下那帮人稳。」——从毒堂堂主嘴里，这算是顶天的夸奖。收工时她把袖弩合上，看了你一眼：「明晚还有三具。你来不来？」'; break;
                // 真负选项：她修的是守旧派弃下的旧器，也是她在门里站稳的凭据，吹灯等于掐灭她熬夜的心事
                case 'douse': aff = -3; msg = '灯灭的那一瞬，黑暗里听见她吸了一口气。再亮起的，是她自己点的火折子——她的脸在火光里冷得像铁。「机簧差最后一枚。」她声音平得没有一丝波澜，「归不了位的弩，明早就是一堆废铁。」她重新低头校簧，再没看你一眼。你站在雨声里，进退都不是。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'tm_event_005': {
        id: 'tm_event_005', npcId: TM_NPC_ID, title: '万解丹头炉', icon: '💊',
        desc: '她偷配的解药，第一炉只成了一粒。',
        minAffection: 40, trigger: { random: 0.3 }, cooldown: 0, flag: 'tm_e005_done',
        autoTrigger: { location: '唐门', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '后夜，毒堂偏炉。她把你叫去，神神秘秘，又掩不住眼里的光——小丹炉开盖，炉里躺着一粒丸药，乌沉沉的，不成色，边上全是焦渣。', type: 'description' },
            { speaker: 'npc', text: '「万解丹。」她捏起那粒丹，对着灯看，声音压得很低，「一炉三十六味药，就活了这一粒。门里不许制解药——制毒是唐门的饭碗，解药砸的是自家的锅。」她笑了一下，笑得有点倔，「我偏要制。我娘给我取名万解，不是让我白背一辈子。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「缺什么药，我下山替你寻。」', effect: 'seek', affection: 7, item: 'spirit_grass' },
                { text: '「这一粒，该有个开炉的名分。我替你记着今天。」', effect: 'record', affection: 8 },
                { text: '陪她守炉，把焦渣一味一味拣出来对谱', effect: 'sift', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '', item = null;
            switch (choice) {
                case 'seek': aff = 7; item = { id: 'spirit_grass', count: 2 }; msg = '她报了三味药名，你下山寻了两日，回来时怀里揣着两株带着山露的灵草。她接过去，指尖隔着白手套翻了又翻，嘴上嫌弃：「根须断了半条，采药的手法跟拆暗器似的。」转头却把灵草收进了她自己的药匣最里层，「……下一炉，够用了。」'; break;
                case 'record': aff = 8; msg = '她捏着那粒丹，忽然说不出话。半晌，她把丹放回炉心，声音有点哑：「名分……」她抬眼看你，眼里有灯影，也有你没见过的水光，「门里不许记，谱上不许载。你记。」她从袖中摸出一页空白药笺递你，「头一笔，你写。」——万解丹的第一页药谱，落的是你的字。'; break;
                case 'sift': aff = 6; msg = '你们把三十六味焦渣一味一味拣出来，对谱、记差、算火候，一直忙到窗纸发白。她拨着算珠，眉头越皱越紧，忽然「啊」了一声——差一味主引没下。她抓笔就记，记完抬头看你，难得没有毒舌：「……你这个人，笨是笨，坐得住。」——对一个制解药的人来说，坐得住，就是天大的帮手。'; break;
            }
            return { affection: aff, msg: msg, item: item };
        }
    },
    'tm_event_006': {
        id: 'tm_event_006', npcId: TM_NPC_ID, title: '母亲的姓', icon: '🕯️',
        desc: '她讲起「晏」姓的来历。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'tm_e006_done',
        autoTrigger: { location: '唐门', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '中元前夜，毒堂后的小祠。她点了一盏长明灯，灯前供着一支旧银簪。你在祠外站住，她没回头，也没赶你。', type: 'description' },
            { speaker: 'npc', text: '「我是唐门门主的嫡女。」她望着那盏灯，声音很平，平得像背过很多遍，「可我姓晏，随我娘。」' },
            { speaker: 'npc', text: '「当年牵机散流案，秘方外泄，门里第一个疑的就是她——外姓女子，来路不明。祠堂会审那日，她没辩一句，端起那盏牵机散，当场喝了。」她的手指轻轻抚过旧银簪，「毒发前她说了最后一句话：方子不是我漏的。——门里信了。可她已经不在了。」' },
            { speaker: 'npc', text: '「爹后来要我改姓，改回唐。」她转过头看你，眼里没有泪，只有一点灯火，「我不改。晏这个姓，是纪念，也是状纸。旧案一天不翻，我一天不姓唐。」' },
            { speaker: 'player_select', text: '你如何回应？（这一桩，没有对错，只有听法）', options: [
                { text: '「旧案我去查。查明白那天，让江湖把『晏』字念清楚。」', effect: 'vow', affection: 9 },
                { text: '什么都不说，陪她在祠前坐到灯油见底', effect: 'stay', affection: 8 },
                { text: '「你娘不是自证清白——她是替你把『晏』字立住了。」', effect: 'mother', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'vow': aff = 9; msg = '她怔怔地看着你，看了很久很久。祠外风过，长明灯的火苗伏了伏又立起来。「……查旧案，要翻门里的底。」她声音低了，「唐门的底，碰不得。」可她把那支旧银簪拿起来，在掌心握了一会儿，又供回去，「你要碰——我把灯给你留着。」'; break;
                case 'stay': aff = 8; msg = '你没说话，在她身边三步的地方坐下来。灯油一寸一寸地短，蜀中的夜露一寸一寸地重。灯尽时她起身，理了理衣上落的花屑，忽然说：「我娘走的那晚，祠堂里也点着灯。满门的人都在，没一个陪她坐。」她看了你一眼，「你坐了。——这一炷香的功夫，我记你一辈子。」'; break;
                case 'mother': aff = 7; msg = '她浑身一震，像被一枚看不见的针钉在原地。「立住……」她反复咀嚼这两个字，眼眶红了，却笑了，「你这个人，说话比我的毒还准。」她伸手把灯芯挑亮了些，「我娘要是听见这句，得多高兴——她那个人，嘴比我硬，心比我软。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'tm_event_007': {
        id: 'tm_event_007', npcId: TM_NPC_ID, title: '试毒', icon: '⚗️',
        desc: '验方缺一个「活器」，她挽袖要自己来。',
        minAffection: 55, trigger: { random: 0.3 }, cooldown: 0, flag: 'tm_e007_done',
        autoTrigger: { location: '唐门', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '万解丹验到第七方，卡住了——丹要验真，须以活人试毒，毒发之后再服丹，看解不解得开。唐门的规矩，这叫「活器」。毒堂的人面面相觑，没人应声。', type: 'description' },
            { speaker: 'npc', text: '「我百毒不侵。」晏万解说着就挽袖子，语气轻描淡写，像在说今天的天气，「淬了二十年的体，正好派上用场。都退下，我自己来。」——可她挽到一半停住了：她那双浸毒的手，试的是自己的毒，验的却是自己的丹，毒上加毒，谁也说不准。' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '按住她的袖子：「我来试。你的手留着制丹。」', effect: 'taste', affection: 11 },
                { text: '「你是唐门唯一会制万解丹的人——你倒下，丹就断了。另寻活器，我陪着找。」', effect: 'reason', affection: 8 },
                { text: '夺过毒盏：「这毒太烈，先减三分，再议谁来。」', effect: 'dilute', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'taste': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 11) : { ok: true };
                    if (!_py.ok) { aff = 4; msg = '你伸手要接毒盏，眼前却先黑了一黑——连日守炉，你的气力早掏空了。她一把扶住你，毒盏搁回案上，眉头拧死：「试毒试到一半先倒一个，你是头一份。」她按你坐下，「……今夜不试了。你养好身子，我等你。」（精力不足，那一杯你先撑不住了）'; break; }
                    aff = 11; msg = ('毒盏入喉，五脏像被一只火烧的手攥住。你听见她的声音在耳边抖：「记着时辰——毒发几分，痛在哪里，说！」她掐着你的脉，指尖的白手套汗透了。半炷香后万解丹入口，火一寸寸退下去。她盯着你的眼睛看了半晌，忽然背过身去，肩膀轻轻耸了一下——毒堂堂主哭了，只哭了一息，再转回来时眼眶通红，嘴硬如旧：「……验方有效。记谱。」谱上那一行小字，是她亲笔：第七方，活器一名，自愿。') + '（精力-11）'; break; }
                case 'reason': aff = 8; msg = '她挽着袖子的手停在半空。堂里静了很久，她慢慢把袖子放下来，声音有点涩：「……你说的对。我倒不得。」她抬眼看你，「可活器去哪寻？门里不会给，江湖上肯为别人试毒的——」她忽然住了口，因为你就站在她面前。她别开脸，耳根红了：「……笨蛋。」第二天起，你们贴出告示，重金募自愿的活器，来者一个一个由她亲自验过底子才收。'; break;
                case 'dilute': aff = 7; msg = '你夺盏的手比她的针还快。她愣住，随即凑过来看你对着毒谱勾勾画画——减三分毒，验的效力打七折，可人稳当。她咬着嘴唇算了一遍，末了哼了一声：「七折就七折。多试几轮，凑得回来。」她抓笔改谱，改完瞥你一眼，「……你倒是既拦了我，又没误我的事。这种本事，门里没人有。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'tm_event_008': {
        id: 'tm_event_008', npcId: TM_NPC_ID, title: '银针', icon: '🌘',
        desc: '拂晓前，她以银针自试腕间。',
        minAffection: 62, trigger: { random: 0.3 }, cooldown: 0, flag: 'tm_e008_done',
        autoTrigger: { timeRange: [4, 6], location: '唐门', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '寅时，你被毒堂偏院的灯引过去。窗纸上映着一个坐影——晏万解褪了半只手套，一根银针探向自己的腕间，捻、提、看针色。那截手腕上，青黑的纹路像枯河的支流，一路蔓到肘弯。', type: 'description' },
            { speaker: 'npc', text: '「百毒不侵，是拿毒喂出来的。」她没回头，声音哑得厉害，「毒没走，都在身上积着。针色三分为限——昨夜，四分半。」她把银针搁下，看着自己腕上的青黑，轻轻笑了一声，「万解丹能解天下的毒。就差一样——解不了我自己的。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '推门进去，握住她执针的那只手：「四分半，我记下了。从今夜起，有人替你记。」', effect: 'hand', affection: 12 },
                { text: '「银针留着，手收回去。从今往后这个时辰，我也在。」', effect: 'vigil', affection: 9 },
                { text: '「你身上积了多少毒，一共，说与我听——不许瞒。」', effect: 'ask', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'hand': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 12) : { ok: true };
                    if (!_py.ok) { aff = 5; msg = '你推门推到一半，寅时的寒风顺着门缝灌进来，你连日试药的身子先晃了晃。她反手把你按在门边的凳子上，自己披衣过来扶：「来看我，先把自己看倒了？」她替你掩好门，声音软了，「……回去睡。银针的事，天亮再说给你听。」（精力不足，那一夜你先撑不住了）'; break; }
                    aff = 12; msg = ('她的手凉得像针。你握住的那一刻，她整个人僵成一尊石像——二十二年，没人碰过这只褪了手套的手。半晌，她反手扣住你的指节，扣得极用力，声音抖得不像她：「……毒会渗。你不怕？」你说记下了，四分半。她低下头，额头抵在你手背上，很久很久，窗纸发白时她闷闷地说了一句：「二十二年，头一回——有人替我记。」') + '（精力-12）'; break; }
                case 'vigil': aff = 9; msg = '她隔着窗纸听了这句，银针在指间转了三转，停了。「……也在。」她重复了一遍，忽然拔高了声音，恢复了她惯常的毒舌，「那寅时三刻的针，你看得懂么？看得懂再来！」话是赶人的话，可第二天寅时，偏院案上多了一只茶杯——是给你的。'; break;
                case 'ask': aff = 6; msg = '她沉默了很久，久到灯花爆了两回。然后她一样一样地数：腕间四分半，肘弯三分，心口——她顿了顿，「心口的，针探不着。」她重新戴上手套，语气恢复如常，「数完了。满意了？」可你看见她把那根银针收进了贴身的匣子——从前，她试完就丢。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'tm_event_009': {
        id: 'tm_event_009', npcId: TM_NPC_ID, title: '手套之诺', icon: '🧵',
        desc: '她摘了手套，递你一双新的。',
        minAffection: 68, trigger: { random: 0.3 }, cooldown: 0, flag: 'tm_e009_done',
        autoTrigger: { location: '唐门', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '毒堂的灯下，晏万解忽然当着你，一寸一寸褪下了那双从不离手的白丝手套。灯影里，她的手苍白纤细，指腹与掌心浮着极淡的青痕——二十二年毒淬的印子。', type: 'description' },
            { speaker: 'npc', text: '「我这双手带毒。」她把手摊开在灯下，声音很静，「碰人，人要伤；碰物，物要朽。这双手二十二年来隔着一层丝，谁也不许近。」她抬眼看你，「想空手碰的——你是头一个。」' },
            { speaker: 'npc', text: '她从袖中取出一双新缝的布手套，针脚密得看不见接头，推到你面前：「你戴上。戴着我才能碰你。」她别开脸，耳根通红，嘴硬照旧，「……别误会。是护你，不是护我。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '戴上手套，把双手递过去：「来。」', effect: 'wear', affection: 14 },
                { text: '「手套我戴。往后你走到哪里，这双手跟到哪里。」', effect: 'vow', affection: 9 },
                { text: '翻看那密得不见接头的针脚：「为什么是我？」', effect: 'ask', affection: 8 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'wear': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 14) : { ok: true };
                    if (!_py.ok) { aff = 6; msg = '你伸手去接手套，连日奔波的身子却先失了准头，指尖擦过灯盏，灯油泼了半案。她眼疾手快把你拉开，手套也顾不上了，先翻你的手看烫着没有。那一夜灯重点了三回，话说到一半你就伏案睡了——醒来时手上已经戴好了那双手套，针脚贴着腕，像有人握过。（精力不足，那一夜你先撑不住了）'; break; }
                    aff = 14; msg = ('手套入掌，棉布里竟垫着一层极薄的药绸——她连你戴久了会闷汗都算到了。你伸出双手，她盯着看了三息，然后极慢极慢地，用那双空了二十二年的手，握住你的手指。她的手在抖，握得很轻，像捧一粒刚出炉的万解丹。「……不痛么？」她问的是她自己。你说不痛。她忽然笑了，笑着笑着眼泪掉在你手背上，一滴，就一滴：「原来碰人，是这个样子。」') + '（精力-14）'; break; }
                case 'vow': aff = 9; msg = '她捏着手套的手紧了一下，嘴上不饶人：「跟到哪里？我下毒堂、进暗器坊、夜里守炉，你跟？」话虽如此，她把手套又往前推了推，推得极坚决，「……先戴上。戴上了，才算数。」灯下她的眼睛亮得吓人——毒堂的人后来说，那几日小姐配药，哼着不成调的曲子。'; break;
                case 'ask': aff = 8; msg = '她把目光落回灯芯上，很久，才开口：「满唐门，想摘我手套的，一车。」她伸出自己那双带青痕的手，在灯下翻了翻，「只有你，从头到尾——没伸过手。」她重新看向你，眼里有灯火，还有一点破釜沉舟的东西，「不夺的人，我才敢给。……这道理，你懂不懂？」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'tm_event_010': {
        id: 'tm_event_010', npcId: TM_NPC_ID, title: '祖母的考校', icon: '📦',
        desc: '唐老太太出堂，推来三只匣子。',
        minAffection: 72, trigger: { random: 0.3 }, cooldown: 0, flag: 'tm_e010_done',
        autoTrigger: { location: '唐门', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '毒堂正门忽然开了。一位鹤发老封君拄杖而入，满堂弟子跪了一地——唐老太太，门主唐无痕都要执晚辈礼的人。老封君在你和晏万解面前站定，浑浊的眼睛扫过来，落在你身上。', type: 'description' },
            { speaker: 'narrator', text: '她从袖中推出三只乌木匣，一字排开——唐门毒堂入门的旧例，三匣：一味封喉，一味蚀骨，一味迷神。可老封君开口，问的不是毒：「丫头随她娘姓晏，姓了二十二年，为的是牵机散那桩旧案。」她盯着你，「旧案的底，在唐门祠堂最深处。你——肯不肯替她把这一页翻出来？」' },
            { speaker: 'npc', text: '晏万解一步跨到你身前，白手套按在匣盖上，声音发紧：「祖母。旧案是我一个人的事，与他无干——」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '对老封君一礼：「旧案，晚辈去翻。翻明白那天，头一个呈给老太太过目。」', effect: 'respect', affection: 8 },
                { text: '低声对万解：「退后半步。这三只匣，我自己开。」', effect: 'stand', affection: 7 },
                { text: '走到她身侧并肩而立：「晏这个姓，往后两个人担。」', effect: 'side', affection: 11 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'respect': aff = 8; msg = '老封君盯着你看了半晌，忽然拿拐杖敲了敲那三只匣子：「封喉、蚀骨、迷神——老太婆摆了三十年这一手，头一回有人不先看匣，先答话。」她转身往外走，走到门口丢下一句，「祠堂的钥匙，叫无痕备一副。——丫头的眼光，比她爹当年强。」满堂寂静里，晏万解按着匣盖的手，松了。'; break;
                case 'stand': aff = 7; msg = '她侧头瞪你，眼里全是「你疯了」——嘴上却只来得及说出半句：「你开不……」你已经揭开了第一只匣。封喉的毒气扑面，你按她平日教的法子屏息辨色，一一报过。三只匣开完，老封君拄杖笑了：「手艺是丫头的，胆子是自己的。」她没再看你，只对万解说，「把人看好了。这样的人，毒堂三十年出一个。」'; break;
                case 'side': aff = 11; msg = '你上前一步，与她并肩。她按着匣盖的手背绷得发白，袖底却悄悄松了半分。老封君看看你，又看看她，浑浊的眼睛里忽然有了笑意，像雪底下翻出一星火：「好。」她把三只匣子尽数推到你面前，「匣子留下，是信物。旧案翻出来那天——拿这三只匣，装你给她讨回来的清白。」老封君走后，万解站在原地很久，轻声说：「祖母这个人，一辈子只夸过两个人。我娘，是头一个。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'tm_event_011': {
        id: 'tm_event_011', npcId: TM_NPC_ID, title: '夜袭', icon: '🌩️',
        desc: '守旧派的刺客，雨夜袭了毒堂。',
        minAffection: 78, trigger: { random: 0.3 }, cooldown: 0, flag: 'tm_e011_done',
        autoTrigger: { location: '唐门', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '又是蜀中的夜雨。万解丹第十八方入炉的当口，毒堂的窗纸忽然破了一个洞——三枚透骨钉成品字钉进炉案！黑衣刺客自雨幕里翻身而入，袖弩连发。守旧派买通的人，等的就是丹成之前、毒堂最不能分神的这一夜。', type: 'description' },
            { speaker: 'narrator', text: '第四枚毒针破空，直取你后心——一道白影扑过来，针没入她的肩窝。她闷哼一声扶住炉案，脸色霎时灰败：旧毒引动了。腕间青黑一路漫上颈侧，她咬着牙，反手把炉门护在身后。', type: 'description' },
            { speaker: 'player_select', text: '你必须立刻做点什么。', options: [
                { text: '背起她蹚进雨里，先送她，再折回来守住丹炉', effect: 'carry', affection: 14 },
                { text: '把她按在炉后，自己迎上去，以身替她接下余下的暗器', effect: 'hold', affection: 15 },
                { text: '踢翻药架引燃毒烟，拽着她滚进偏炉夹道', effect: 'smoke', affection: 10 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'carry': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 14) : { ok: true };
                    if (!_py.ok) { aff = 6; msg = '你背她背到雨里，脚下却一软，两个人齐齐栽进水洼——刺客的弩再响时，是毒堂的护堂弟子赶到了。她伏在你背上咳着，旧毒未平，还不忘骂你：「……腿软成那样，平日白吃唐门的饭。」骂完，手却把你的衣领攥得更紧了。（精力不足，那一夜你先撑不住了）'; break; }
                    aff = 14; msg = ('雨像鞭子。你背着她蹚过三进院子，她在背上烧得滚烫，声音却稳：「炉……丹炉不能离人，第十八方，差一炷香。」你把她送进内堂，塞给她一枚护心丹，转身又扎回雨里——守到炉盖跳起、丹香漫出来的那一刻，刺客已被闻讯的护堂弟子围了。你捧着那炉丹回内堂，她倚在门边等你，肩上的血透出来，眼里却全是光：「……一炷香。你替我守住了。」') + '（精力-14）'; break; }
                case 'hold': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 20) : { ok: true };
                    if (!_py.ok) { aff = 8; msg = '你迎上去迎到一半，第三枚透骨钉擦着你的肋下过去，你眼前发黑单膝跪地——最后收场的还是她：一枚毒砂反手打翻刺客，自己却因旧毒跪在炉边喘。两个人在雨声里对望，谁都撑不住，谁都没先倒下。（精力不足，那一刻你先撑不住了）'; break; }
                    aff = 15; msg = ('你把她按进炉案的阴影里，自己站到了灯下——刺客的弩，永远追着灯下的人。两枚透骨钉，一枚穿臂，一枚钉进你的左肩。你没退。毒砂、火油、护堂弟子的哨声，乱成一锅——你只记得身后炉火不能熄，记得炉后那个人不能再见血。刺客授首时你倚着炉案滑坐下去，她扑过来拔针喂药，手抖得连药丸都捏不住，眼泪砸在你伤口上，比毒还烫：「你疯么……你疯么！我百毒不侵，你又不是——」你笑了笑，没力气说话。那炉丹，就着火光和她的手，成了三粒。') + '（精力-20）'; break; }
                case 'smoke': aff = 10; msg = '药架翻倒，迷神的毒烟轰然漫开——刺客是守旧派的人，不熟毒堂的规矩，三个数内捂住了口鼻，可你早屏住了息。你拽着她滚进偏炉夹道，反手落下石门。烟散时刺客已退，丹炉的火居然没熄。她扶着夹道壁喘，看着你，忽然低低笑出声：「……用毒堂的烟救毒堂的人。你这个人，入门才多久，学会糟蹋我的药了。」话是骂，她攥着你衣袖的手，一直没松。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'tm_event_013': {
        id: 'tm_event_013', npcId: TM_NPC_ID, title: '终章·解字', icon: '💍',
        desc: '万解丹第十八方出炉那夜，丹成三粒。',
        minAffection: 85, trigger: { random: 1.0 }, cooldown: 0, flag: 'tm_e013_done',
        autoTrigger: { location: '唐门', random: 1.0 },
        endingMap: { '同解': 'tm_ending_同解', '守炉': 'tm_ending_守炉', '医针': 'tm_ending_医针', '药客': 'tm_ending_药客', '无解': 'tm_ending_无解', '独行': 'tm_ending_独行' },
        scenes: [
            { speaker: 'narrator', text: '万解丹第十八方出炉那夜，蜀中落了今秋第一场雨。炉盖跳起，丹香漫开——三粒。乌沉沉的丸药在炉心排成一线，二十二年的药谱，一百零八炉的焦渣，都在这三粒里。', type: 'description' },
            { speaker: 'npc', text: '她褪下了手套。空着那双带青痕的手，拈起第一粒丹，递到你面前——手很稳，声音不稳：「牵机散的旧案，翻清了。我娘的名字，回祠了。祖母说，下任当家的印，也给我备下了。」' },
            { speaker: 'npc', text: '「可我这一生，制的是解药。」雨声里她看着你，眼睛比炉火亮，「{playerName}。你——肯不肯做我的『解』？」' },
            { speaker: 'player_select', text: '你的选择将决定你们的关系走向', options: [
                { text: '「肯。带上丹方，跟我下山——天下的毒，我们一味一味解过去。」', effect: 'lover_travel', affection: 30 },
                { text: '「肯。我留蜀中。丹炉在哪里，家就在哪里——我陪你守这一炉火。」', effect: 'lover_stay', affection: 28 },
                { text: '「丹我收下，当个医缘。一年一会——你试我的针，我试你的药。」', effect: 'friend', affection: 20 },
                { text: '「给我在唐门药庐留个位子罢。常客，年年入蜀领药——不谈风月，只谈药。」', effect: 'friend_stay', affection: 18 },
                { text: '「这粒丹，我不能收。我只是蜀道上的过客。」', effect: 'none', affection: 0 }
            ]}
        ],
        effects: function(npc, choice) {
            // 三度伤透即寒心：辜负独立成结局「无解」，与「独行」（错过）分账
            var negCount = (window._negativeChoiceCount && window._negativeChoiceCount[TM_NPC_ID]) || 0;
            if (negCount >= 3 && (choice === 'lover_travel' || choice === 'lover_stay')) {
                return { affection: 0, msg: '她看着你，眼里的光一寸一寸熄下去，像炉膛里最后一星火。她收回手，把三粒丹一粒一粒摆回炉心，然后当着你的面，一掌推向丹炉——炉倾，火熄，二十二年的丹方在灰里卷了边。「解药救不了不肯回头的人。」她重新戴上白手套，一根手指一根手指地戴好，声音平得没有一丝波澜，「天下的毒，我不解了。」她走出毒堂，走进蜀中的雨里，背影笔直，再没回头。', ending: '无解' };
            }
            switch (choice) {
                case 'lover_travel': return { affection: 30, msg: '她怔在炉前，指尖那粒丹微微发颤。半晌，她忽然笑了，眼泪和笑一起落下来：「……好。」她把三粒丹尽数倒进一只小小的药囊，系在你腰间，又解下自己的白手套，一双叠好，收进你行囊最里层，「丹方我带着，炉子留给门里。天下的毒——」她挽住你的手臂，手很凉，握得很紧，「我们一味一味解过去。」那夜蜀中的雨停了，唐门的灯，为她亮到天明。', ending: '同解' };
                case 'lover_stay': return { affection: 28, msg: '她低头看着炉膛里的余火，很久，再抬眼时眼睛弯着，像藏了一炉丹的光：「……好。蜀中多雨。」她把第一粒丹按进你掌心，替你合上手指，「丹炉不熄，我就不走。你年年回蜀——」她顿了顿，毒舌到底没绷住，「回晚一天，罚试一方新药。」毒堂的弟子后来说，小姐守炉的那些年，偏院的灯，夜夜是两盏。', ending: '守炉' };
                case 'friend': return { affection: 20, msg: '她挑眉，把那粒丹在你眼前晃了晃：「医缘？」她忽然笑开，笑得毫不矜持，二十二年的倔劲松了个干净，「行。一年一会——你带针，我带药。你替我试新方，我替你调旧伤。」她把丹弹进你手里，「江湖这么毒，多一个制解的，是你的运气。」——话说得损，可她当夜就把药庐的客牌刻好了，落款是「晏」。', ending: '医针' };
                case 'friend_stay': return { affection: 18, msg: '「常客？」她把丹收回掌心，掂了掂，像在掂你的分量，「唐门药庐三百年，没给外人留过位子。」她沉吟片刻，忽然抬手叫来伙计：「药庐东厢，收拾一间出来。」伙计愣住：「小姐，那间是——」「是留给常客的。」她把丹搁进药庐的柜台，拍拍手，「年年入蜀，凭丹领药。位子给你留着，药钱——」她瞥你一眼，唇角翘着，「照收。」', ending: '药客' };
                case 'none': return { affection: 0, msg: '她悬在半空的手停了很久很久。然后她把那粒丹收回炉心，动作轻得像收回一句说错了的话。「……也好。」她重新戴上白手套，声音恢复了毒堂里的清冷，「过客入蜀，看完雨就该出蜀了。唐门的门，朝所有买药的人开。」炉膛里的火渐渐暗下去，她坐在灯下整理药谱，没再抬头。', ending: '独行' };
            }
            return { affection: 0, msg: '' };
        }
    }
};

// ============ 晏万解结局演出（6 个） ============
var TM_ENDINGS = {
    'tm_ending_同解': {
        id: 'tm_ending_同解', npcId: TM_NPC_ID, title: '结局·同解', icon: '🪡',
        route: '同解',
        scenes: [
            { speaker: 'narrator', text: '三日后，晏万解把毒堂堂主的印信交给祖母，把万解丹的丹方供进祠堂——供在她母亲回祠的名位旁边。唐老太太只留了四个字：「由她去罢。」又添了半句，「解药，别断。」', type: 'description' },
            { speaker: 'npc', text: '「丹方在我脑子里，炉子在天下。」她背起药箱与你并肩出蜀，白手套换成了你熟悉的那双布手套——她戴你的，你戴她的，「往后你走哪儿，我的药庐开到哪儿。管得松些。」' },
            { speaker: 'narrator', text: '多年后，江湖有一对「解毒双影」的传说：一人辨毒，一人制解，专管人间毒事。南疆的蛊、北海的瘴、西域的奇毒，都在那本越写越厚的药谱上挨着号。', type: 'description' },
            { speaker: 'narrator', text: '有人见过他们在雪夜的客栈歇脚。她难得不毒舌，靠在{playerTa}肩上打盹，手心里还攥着半张没写完的方子——纸角上「万解」两个字，写得端端正正。她说，这个名字，她娘取对了。', type: 'description' }
        ],
        finalText: '——— 结局·同解（道侣·同行）———'
    },
    'tm_ending_守炉': {
        id: 'tm_ending_守炉', npcId: TM_NPC_ID, title: '结局·守炉', icon: '🏡',
        route: '守炉',
        scenes: [
            { speaker: 'narrator', text: '你留在了蜀中。毒堂偏院那炉火，从此两个人守。她制解药，你司火候——唐门三百年，头一炉解药的名分，就这么堂堂正正立起来了。', type: 'description' },
            { speaker: 'narrator', text: '她还是寅时起，银针还是日日探腕——只是针色记录的那页纸上，从此多了一个人的字迹。腕间的青黑一年淡过一年，她说那是万解丹的功效，你说是有人替她记时辰的功效。她嘴硬，不认，耳朵却红了。', type: 'description' },
            { speaker: 'npc', text: '「今年蜀中的雨，比去年多三场。」她守着火，把新缝的一双手套丢给你，「……戴上。炉边烫，第几双了，还学不会爱惜手。」话是骂的，手套的针脚里，垫着防烫的药绸。' },
            { speaker: 'narrator', text: '毒堂的弟子私下说，堂主还是那么嘴毒，骂人还是带着笑——只是骂完了，会往偏院的方向看一眼，眉眼就软了。', type: 'description' },
            { speaker: 'narrator', text: '蜀中多雨，炉火不熄。年年归蜀的人，年年有一盏灯。', type: 'description' }
        ],
        finalText: '——— 结局·守炉（道侣·归隐）———'
    },
    'tm_ending_医针': {
        id: 'tm_ending_医针', npcId: TM_NPC_ID, title: '结局·医针', icon: '⚔️',
        route: '医针',
        scenes: [
            { speaker: 'narrator', text: '你们成了江湖闻名的医毒知己。一年一会，风雨无阻——你带针入蜀，她带药出堂，谁也不欠谁。', type: 'description' },
            { speaker: 'npc', text: '「今年你的针，快了半息。」她收回手腕，面上波澜不惊，袖中却把一匣新制的万解丹塞给你，「愿赌服输。这一匣归你——明年，把半息赢回去。」' },
            { speaker: 'narrator', text: '有人问你们是什么关系。她答「药友」，{playerTa}答「药友」。说完两人对视，都绷不住先笑了——毒堂堂主笑起来的时候，蜀中的雨都显得多余。', type: 'description' }
        ],
        finalText: '——— 结局·医针（挚友·同行）———'
    },
    'tm_ending_药客': {
        id: 'tm_ending_药客', npcId: TM_NPC_ID, title: '结局·药客', icon: '🏮',
        route: '药客',
        scenes: [
            { speaker: 'narrator', text: '{playerTa}成了唐门药庐的常客。东厢那个位子，年年留着，年年是{playerTa}。', type: 'description' },
            { speaker: 'narrator', text: '她制毒照旧，制解也照旧——只是每年入秋，药庐柜台上会多出一匣按{playerTa}旧伤配的药，标签上的字，写得比药谱还工整。', type: 'description' },
            { speaker: 'npc', text: '「今年领药，晚了六天。」她把药匣推过柜台，白手套的指尖在匣盖上敲了敲，「……路上，雨大？」话问得别扭，茶却早就沏好了，是{playerTa}惯喝的那种。' },
            { speaker: 'narrator', text: '药庐的伙计有回问{playerTa}：「你算我们堂主什么？」{playerTa}想了想：「药客。」伙计们似懂非懂，只有柜台后那位嘴毒的堂主听见了，低头继续对药谱——那一页的页脚，多画了一只小小的、戴手套的手。', type: 'description' }
        ],
        finalText: '——— 结局·药客（挚友·归隐）———'
    },
    'tm_ending_无解': {
        id: 'tm_ending_无解', npcId: TM_NPC_ID, title: '结局·无解', icon: '🗡️',
        route: '无解',
        scenes: [
            { speaker: 'narrator', text: '那夜毒堂，她当着你的面推倒了丹炉。三粒万解丹滚进灰烬，她一粒一粒拾起来，又一粒一粒碾碎——碾得很慢，很稳，像在完成一道验了二十二年的方子。', type: 'description' },
            { speaker: 'narrator', text: '第二日起，唐门毒堂只制毒，不制解。药谱送到祠堂存档那天，她提笔勾掉了封面上「万解」两个字——一笔一笔，勾得极干净。唐老太太在祠堂外站了半晌，什么也没说，拄杖走了。', type: 'description' },
            { speaker: 'npc', text: '「解药救不了不肯回头的人。」后来有弟子问她为什么弃了半生的心血，她隔着白手套理着毒砂，语气像在念别人的药谱，「天下的毒，我不解了。」' },
            { speaker: 'narrator', text: '多年后你再到蜀中，毒堂的灯还亮着，她的毒名满江湖——只是那双亲手缝的布手套，她再没拿出来过第二回。祠前那盏长明灯下，供着的旧银簪旁边，空着一个位置，积了灰。', type: 'description' }
        ],
        finalText: '——— 结局·无解（辜负）———'
    },
    'tm_ending_独行': {
        id: 'tm_ending_独行', npcId: TM_NPC_ID, title: '结局·独行', icon: '🏔️',
        route: '独行',
        scenes: [
            { speaker: 'narrator', text: '后来你还是入过几次蜀。药庐开着，她对你礼数周全，报价公道，像对每一位远来的药客。', type: 'description' },
            { speaker: 'narrator', text: '万解丹的丹方，她封进了一只樟木匣，收在毒堂最高的那格药柜里——匣上没有锁，也没有封条，就是再没人见它下来过。', type: 'description' },
            { speaker: 'narrator', text: '再后来，江湖偶有传闻——唐门晏堂主的毒愈发精绝，制解的手艺也愈发精绝，两样都是天下第一。只是蜀中多雨，她的白丝手套再没摘过，寅时的偏院里，那盏灯一直是一个人守。', type: 'description' }
        ],
        finalText: '——— 结局·独行（错过）———'
    }
};

// ============ 性别语境事件（femctx 女玩家 / mctx 男玩家，互斥） ============
var TM_GENDER_CTX_EVENTS = {
    // 女玩家：内堂姊妹的眼光
    'tm_event_femctx': {
        id: 'tm_event_femctx', npcId: TM_NPC_ID, title: '内堂的提醒', icon: '🪷',
        desc: '内堂的姊妹把你叫住了。',
        minAffection: 55, trigger: { random: 0.35 }, cooldown: 0, flag: 'tm_e_femctx_done',
        requirePlayerFemale: true,
        autoTrigger: { location: '唐门', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '内堂廊下，两个相熟的姊妹把你叫住，左右看了看，压低声。', type: 'description' },
            { speaker: 'npc', text: '「姑娘。」年长的那个开门见山，「毒堂小姐从不让人近身三尺——你是头一个。门里上上下下都看在眼里了。」' },
            { speaker: 'npc', text: '「小姐那个人，嘴毒，心比谁都软，就是什么都自己扛。她娘的事压了她二十二年，手套戴了二十二年。我怕你跟着她，扛的日子过得辛苦。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「她毒她的舌，我拆我的台——正好。」', effect: 'tease', affection: 8 },
                { text: '「姊姊，我自愿的。辛苦我认。」', effect: 'accept', affection: 7 },
                { text: '「你们是怕我委屈，还是怕她破例？」', effect: 'probe', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'tease': aff = 8; msg = '两个姊妹对视一眼，年长的先笑出声：「……拆台？」她拍着你的手背，眼角的纹路都松了，「好妹子。她那张嘴毒了二十二年，早该有人拆了。你拆——内堂给你递梯子。」'; break;
                case 'accept': aff = 7; msg = '姊妹们叹了口气：「自愿的……好。」年纪小的那个从怀里摸出一包蜜饯塞给你，「毒堂守夜的人，得先喂饱。往后小姐守炉，你守她——蜜饯，我们内堂包了。」'; break;
                case 'probe': aff = 6; msg = '年长的那个捻着衣角，顿了顿：「……两样都怕。」她望着毒堂的方向，「她破例一次，就要拿十倍的毒舌端回来。你舍得看她那样，就留下。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // 男玩家：毒堂男弟子的流言
    'tm_event_mctx': {
        id: 'tm_event_mctx', npcId: TM_NPC_ID, title: '毒堂流言', icon: '🌫️',
        desc: '毒堂的男弟子把你拦下了。',
        minAffection: 55, trigger: { random: 0.35 }, cooldown: 0, flag: 'tm_e_mctx_done',
        requirePlayerMale: true,
        autoTrigger: { location: '唐门', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '暗器坊外，一个胆大的毒堂男弟子把你拦下，左右看了看，压低声。', type: 'description' },
            { speaker: 'npc', text: '「那位……客卿。」男弟子咬着牙，「你跟小姐的事，门里传遍了。外姓男子收了小姐亲手缝的手套——三百年的唐门，头一遭。守旧派那几位老供奉的脸，黑得能滴出毒来。」' },
            { speaker: 'npc', text: '「我不是说这不好。我是说，小姐那个人，别人戳她一指头，她能拿十倍的毒舌端回来。门里的嘴她压得住，江湖的嘴呢？你受得住她端，她受得住这满江湖的嘴吗？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「嘴归嘴。她毒她的舌，我站我的位。」', effect: 'defy', affection: 8 },
                { text: '「兄弟，我们还没到那一步。」', effect: 'deny', affection: 3 },
                { text: '「谁嚼她的舌根，先问我的拳头。」', effect: 'shield', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'defy': aff = 8; msg = '男弟子眼睛亮了：「……行！这话我原样带给小姐——不对，我不能带。」他吐吐舌头跑了。可当天夜里毒堂偏院的灯，你看得出，比平日熄得晚——守炉的人，心情不坏。'; break;
                case 'deny': aff = 3; msg = '男弟子盯了你半晌：「……没到那一步。」他拍拍衣摆走了，「那你袖子里那双布手套算什么？那个针脚，满唐门都知道是小姐的手艺——你还给她去？」'; break;
                case 'shield': aff = 7; msg = '男弟子怔了怔，忽然咧嘴一笑：「小姐要是听见这句，毒舌得损你三天——损完请你喝她私藏的茶。」他跑进暗器坊，声音远远飘下来，「守旧派那几张老脸，其实早被小姐的万解丹吓软一半啦！」'; break;
            }
            return { affection: aff, msg: msg };
        }
    }
};

// ============ 合并进总事件池 ============
if (typeof NPC_PERSONAL_EVENTS !== 'undefined') {
    Object.assign(NPC_PERSONAL_EVENTS, TM_MAIN_EVENTS);
    Object.assign(NPC_PERSONAL_EVENTS, TM_GENDER_CTX_EVENTS);
}

// ============ 注册结局集与副作用回调 ============
if (typeof registerEndingSet === 'function') {
    registerEndingSet(TM_NPC_ID, TM_ENDINGS);
}
if (typeof registerEndingCallback === 'function') {
    registerEndingCallback(TM_NPC_ID, function(endingName, npc) {
        if (endingName === '同解' || endingName === '守炉') {
            if (npc && typeof npc.setFlag === 'function') npc.setFlag('dao_companion');
            if (window.showMessage) window.showMessage('🪡 你与晏万解结为道侣！唐门暗器与毒理感悟大幅提升', 'success');
        } else if (endingName === '医针' || endingName === '药客') {
            if (npc && npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 30);
            if (window.showMessage) window.showMessage('🪡 你与晏万解成了彼此最信得过的医毒知己', 'success');
        } else if (endingName === '无解') {
            if (window.showMessage) window.showMessage('💔 晏万解拆了万解丹炉。天下的毒，她不解了', 'error');
        }
    });
}

// ============ 自动触发 + 每日钩子（复用 maybeAutoTriggerPersonalEvent） ============
function maybeAutoTriggerTmEvent(source) {
    return maybeAutoTriggerPersonalEvent(TM_NPC_ID, source, { finalEvents: ['tm_event_013'] });
}

if (typeof window !== 'undefined' && window.timeSystem && window.timeSystem.onNewDaySubscribe) {
    window.timeSystem.onNewDaySubscribe(function() {
        try {
            if (window.currentCharData && window.currentCharData.location === '唐门') {
                maybeAutoTriggerTmEvent('daily');
            }
            // 性别语境：每日在该派过夜 + 对应性别 + 好感≥55 + 未触发
            if (!window.currentCharData || !window.npcManager) return;
            var loc = window.currentCharData.location || '';
            if (loc !== '唐门') return;
            var npc = window.npcManager.getNPC ? window.npcManager.getNPC(TM_NPC_ID) : null;
            if (!npc) return;
            var aff = (npc.relationship && npc.relationship.affection) || 0;
            if (aff < 55) return;
            var isF = window.currentCharData.gender === 'female';
            var ctxId = isF ? 'tm_event_femctx' : 'tm_event_mctx';
            if (typeof hasEventTriggered === 'function' && hasEventTriggered(ctxId)) return;
            var ev = NPC_PERSONAL_EVENTS[ctxId];
            if (!ev) return;
            if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npc)) return;
            setTimeout(function() {
                if (document.querySelector && document.querySelector('.personal-event-modal')) return;
                if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npc)) return;
                if (typeof triggerPersonalEvent === 'function') triggerPersonalEvent(ctxId);
            }, 1200);
        } catch (e) { console.warn('[晏万解线] 每日触发失败:', e); }
    });
}

// ============ 导出 ============
if (typeof window !== 'undefined') {
    window.TM_MAIN_EVENTS = TM_MAIN_EVENTS;
    window.TM_ENDINGS = TM_ENDINGS;
    window.maybeAutoTriggerTmEvent = maybeAutoTriggerTmEvent;
}
console.log('[晏万解线] 唐门感情线加载完成：结局 ' + Object.keys(TM_ENDINGS).length + ' 个 + 主线事件 ' + Object.keys(TM_MAIN_EVENTS).length + ' 个 + 性别语境 ' + Object.keys(TM_GENDER_CTX_EVENTS).length + ' 个');
