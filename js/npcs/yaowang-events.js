// ==================== yaowang-events.js - 芩木线情缘事件/结局/性别语境 v1.0 ====================
// 依赖：npcs/npc-personal-events.js
// 男主·芩木（药王谷谷主继承人，医毒双修，温润锋芒，温润是戒律也是藏毒的壳）。

var SU_NPC_ID = 'sect_leader_药王谷';

var SU_MAIN_EVENTS = {
    'su_event_001': {
        id: 'su_event_001', npcId: SU_NPC_ID, title: '诊脉', icon: '🩺',
        desc: '你受了伤，他伸手诊脉，指尖温。',
        minAffection: 12, trigger: { random: 0.4 }, cooldown: 0, flag: 'su_e001_done',
        autoTrigger: { location: '药王谷', random: 0.45 },
        scenes: [
            { speaker: 'narrator', text: '你在药圃里被一株毒藤划了手，肿起一片。芩木经过，二话没说抓过你的手腕。', type: 'description' },
            { speaker: 'npc', text: '「别动。」他指尖搭在你脉上，温而稳，「脉没乱，皮肉伤。」他从袖里摸出一小瓶，「抹上，三日消。」' },
            { speaker: 'narrator', text: '他诊完没立刻松手，浅褐眼底在你腕上停了一瞬。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「多谢。药钱我付。」', effect: 'pay', affection: 4 },
                { text: '「你诊脉，手怎么这么凉？」', effect: 'cold', affection: 6 },
                { text: '反手握一下他指尖', effect: 'hold', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'pay': aff = 4; msg = '他笑了一下，眼底却没笑：「……药钱免。举手之劳。」他松了手，「下回离那藤远点，它认生人。」'; break;
                case 'cold': aff = 6; msg = '他怔了怔：「……常年配药，手凉。」他缩回手，却把袖口往下拉了拉——你看见他腕内侧一片细密的针痕，金针渡穴的旧伤。「医者不自医。」他说，温润得听不出情绪。'; break;
                case 'hold': aff = 7; msg = '他指尖一颤，没躲。许久，他低声：「……你的手比我还凉。」他把药瓶塞进你掌心，指尖收回去之前在你掌心停了一瞬——一闪即收，像没碰过。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'su_event_002': {
        id: 'su_event_002', npcId: SU_NPC_ID, title: '毒舌', icon: '🔪',
        desc: '他损你，损得温润，却句句到点。',
        minAffection: 18, trigger: { random: 0.35 }, cooldown: 0, flag: 'su_e002_done',
        autoTrigger: { location: '药王谷', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '你配错了一剂药，芩木拿过药方，看了许久。', type: 'description' },
            { speaker: 'npc', text: '「这味药三钱，你下了一两。」他笑得温润，「吃下去死不了，也就躺七天——算你有良心。」他把方子一搁，「但你这良心，不值钱。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「那你教我。」', effect: 'learn', affection: 7 },
                { text: '「你嘴这么毒，药王谷没人揍你？」', effect: 'tease', affection: 6 },
                { text: '低头认错', effect: 'admit', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'learn': aff = 7; msg = '他看了你一眼，笑意终于到眼底：「……行。来。」他重新摊开方子，一笔一笔讲给你听——这一讲，从午后讲到天黑。'; break;
                case 'tease': aff = 6; msg = '他罕见地笑出声：「……揍我？药王谷里，想揍我的人不少，敢下手的没有——我手里有他们的方子。」他顿了顿，「你例外。你想揍，我让你揍。」'; break;
                case 'admit': aff = 5; msg = '他点头：「认错就好。」他重新写了一剂递你，「这剂下对。下回再错，我不教你了——我替你配。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'su_event_003': {
        id: 'su_event_003', npcId: SU_NPC_ID, title: '半夏', icon: '🌱',
        desc: '他种了一味毒草，你问起。',
        minAffection: 25, trigger: { random: 0.35 }, cooldown: 0, flag: 'su_e003_done',
        autoTrigger: { location: '药王谷', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '药圃深处，你发现一小片用围栏隔开的毒草——半夏、附子、断肠草。芩木蹲在里面除草，动作轻得像在哄孩子。', type: 'description' },
            { speaker: 'npc', text: '「药王谷的继承人，种毒草。」他没抬头，温润的声，「你说，是为什么？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「以毒攻毒。」', effect: 'truth', affection: 7 },
                { text: '「因为你想杀人。」', effect: 'accuse', affection: 4 },
                { text: '蹲下帮他除草', effect: 'weed', affection: 8 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'truth': aff = 7; msg = '他抬头，浅褐眼底终于有了真东西：「……你看出来了。」他拔起一株半夏，「医者手里，半夏是化痰的良药；狠人手里，它是夺命的毒。差别只在剂量——和人。」'; break;
                case 'accuse': aff = 4; msg = '他笑了一下，温润得发凉：「……杀人？我要想杀人，用不着种草。」他把半夏递你，「这株，救过三个人。你看它长得像毒，它救过三个人。」'; break;
                case 'weed': aff = 8; msg = '你没说话，蹲他旁边帮他拔草。他侧头看你，许久：「……你不怕我。」你说：「你怕的是自己。」他沉默了，把拔下的半夏轻轻放进药篓——那一瞬，他眼底到了底。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'su_event_004': {
        id: 'su_event_004', npcId: SU_NPC_ID, title: '不眠', icon: '🌙',
        desc: '他熬药不眠，你陪。',
        minAffection: 32, trigger: { random: 0.3 }, cooldown: 0, flag: 'su_e004_done',
        autoTrigger: { timeRange: [21, 3], location: '药王谷', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '深夜药庐，炉上一锅药熬着。芩木守着，眼下青了一片，手在袖里轻轻抖——熬夜的虚。', type: 'description' },
            { speaker: 'npc', text: '「你还没睡。」他没回头，温润的声，「这药要文火三个时辰，离了人不行。你回。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「我替你看火，你去睡。」', effect: 'replace', affection: 8 },
                { text: '「我陪你。」坐下', effect: 'stay', affection: 7 },
                { text: '去泡一壶茶', effect: 'tea', affection: 6 },
                { text: '「守个火都熬红眼，药王谷就这本事？」', effect: 'jeer', affection: -4 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'replace': aff = 8; msg = '他摇头：「……药方只有我认得。」但往旁边挪了挪，给你让了炉前一个位，「你坐着，我看着。」——他没睡，但有你在，手不抖了。'; break;
                case 'stay': aff = 7; msg = '他没再赶你。两个人守一锅药，炉火噼啪。许久他低声：「……有人陪着，文火都不那么长了。」'; break;
                case 'tea': aff = 6; msg = '你泡了壶茶回来。他接过去，指尖在杯壁停了一下：「……温的。」他喝了一口，看你，「你倒记得，我喝温茶。」'; break;
                // v20.25 真负选项：他的温润是修出来的，拿行医之本打趣，笑就挂不住了
                case 'jeer': aff = -4; msg = '他还是笑着，笑得很周全：「这位说得是。」——从那夜起，药庐的门照开，茶照是温的，只是再没有一样，是专门为你留的。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'su_event_005': {
        id: 'su_event_005', npcId: SU_NPC_ID, title: '旧方', icon: '📜',
        desc: '一张救不活的人的旧方。',
        minAffection: 40, trigger: { random: 0.3 }, cooldown: 0, flag: 'su_e005_done',
        autoTrigger: { location: '药王谷', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '你整理药庐，从抽屉底翻出一张发黄的方子，最后写「无效」二字。芩木进来，看见你手里的方子，脚步顿住。', type: 'description' },
            { speaker: 'npc', text: '「……那张，是我师父的。」他声音温润得听不出，「我七岁那年的一场瘟，我师父治的。最后一个人——他没救回来。那张方子，他改了十七遍。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「他尽力了。」', effect: 'comfort', affection: 6 },
                { text: '「你想把它改到第十八遍。」', effect: 'see', affection: 9 },
                { text: '把方子折好还他', effect: 'return', affection: 5 },
                { text: '「改十七遍都救不回人，令师技艺不过如此。」', effect: 'insult', affection: -5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '', item = null;
            switch (choice) {
                case 'comfort': aff = 6; msg = '他摇头：「……我师父说，医者说不出尽力。尽力救不回来，就是没本事。」他看着方子，「这句话，我记了二十年。」'; break;
                case 'see': aff = 9; msg = '他猛地看你，浅褐眼底亮了：「……你怎么知道。」他半晌没说话，从你手里把方子拿回去，摊在案上，「我已经改到第十一遍。」——他第一次，在你面前露出不是温润的东西。'; break;
                case 'return': aff = 5; item = 'mat_thousand_lingzhi'; msg = '他接过方子，指尖摩挲了一下「无效」二字。「……谢了。」他把它收进袖里最深处——和那些半夏放在一起。次日你房里多了株千年灵芝，附一张字条：方子的谢礼。别让旁人看见。'; break;
                // v20.25 真负选项：亡师是他二十年心口的方子，这一句划的是「无效」二字上头
                case 'insult': aff = -5; msg = '他把方子从你手里抽走，很轻，像抽走一段你不配碰的旧事。「……说完了？」他声音还是温润的，「请回吧。药庐今晚不待客。」门外起了风，你听见里面碾药的声音，碾了一夜。'; break;
            }
            return { affection: aff, msg: msg, item: item };
        }
    },
    'su_event_006': {
        id: 'su_event_006', npcId: SU_NPC_ID, title: '以毒攻毒', icon: '☠️',
        desc: '他用毒救人，被长老非议。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'su_e006_done',
        autoTrigger: { location: '药王谷', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '议事药堂。李时珍长老当众发难：「谷主继承人当众用断肠草救人——药王谷行医百年，何时用过毒？」芩木站堂中，温润的笑没变。', type: 'description' },
            { speaker: 'npc', text: '「李长老。」芩木开口，温润得像茶汤，「那病人中的是蛊毒，只有断肠草能解。我若不用毒，他今日就死。医者的命，比药王谷的名声重——还是轻？」' },
            { speaker: 'player_select', text: '你如何应对？', options: [
                { text: '「芩木救的是人，不是名声。」', effect: 'defend', affection: 6 },
                { text: '「李长老，您不该当众为难他。」', effect: 'rebuke', affection: 8 },
                { text: '站他身侧不说话', effect: 'side', affection: 11 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'defend': aff = 6; msg = '芩木侧头看你，温润的笑终于到了眼底：「……谢。」李时珍哼一声退了。事后他低声：「你替我说话，比我自己说管用——我嘴毒，招人。」'; break;
                case 'rebuke': aff = 8; msg = '李时珍拂袖：「……谷主继承人带了个人，倒硬气了。」走了。芩木轻声：「你倒敢得罪长老。」他眼底有暖，「为我去得罪人——我记着。」'; break;
                case 'side': aff = 11; msg = '他看了你一眼，没让你退。李时珍看完这一幕，叹气：「……罢了。」走了，丢下一句，「别让你师父看见你这温润底下，藏的是不是毒。」——芩木握了一下拳，松开。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'su_event_007': {
        id: 'su_event_007', npcId: SU_NPC_ID, title: '温润的来历', icon: '🎭',
        desc: '他承认，温润是装的。',
        minAffection: 55, trigger: { random: 0.3 }, cooldown: 0, flag: 'su_e007_done',
        autoTrigger: { location: '药王谷', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '药庐深夜。他端着一碗药没喝，看着它出神。你进去时，他罕见地没笑。', type: 'description' },
            { speaker: 'npc', text: '「我跟你说个事。」他声音温润，但没笑，「我这温润，是装的。」' },
            { speaker: 'npc', text: '「我七岁那场瘟，我师父没救回最后一个人，他病倒，也走了。他临终说——『木儿，医者不能带情绪，笑一个给我看。』」他看着那碗药，「我就笑了。笑到现在。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「你累了。不笑也没关系。」', effect: 'rest', affection: 11 },
                { text: '「你师父若看见你现在，会松口气。」', effect: 'see', affection: 8 },
                { text: '把那碗药端给他「先喝。」', effect: 'drug', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'rest': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 15) : { ok: true };
                    if (!_py.ok) { aff = 4; msg = '药香熏得人发沉，你话没说完先睡了。醒来人在外间，身上盖着谷里的蜀葵被。（精力不足，那一夜你先撑不住了）'; break; }
                    aff = 11; msg = '他怔了很久，浅褐眼底第一次有了水光——又压下去。「……行。」他把药喝了，「我不笑。」——那夜药庐的灯，亮到很晚，他靠在案上，第一次在你面前没笑。' + '（精力-15）'; break; }
                case 'see': aff = 8; msg = '他低头看药碗，许久：「……他要是看见你，会更松口气。」他喝了药，「笑到现在，头一回有人跟我说，不笑没关系。」'; break;
                case 'drug': aff = 7; msg = '他接过药，看了你一眼：「……你倒像我的病人。」他喝了，碗底朝天，「药喝完，笑不笑，我自己定。」但他那晚，确实没再笑——却也没再绷着。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'su_event_008': {
        id: 'su_event_008', npcId: SU_NPC_ID, title: '毒与医', icon: '⚖️',
        desc: '他承认，他既是医也是毒。',
        minAffection: 62, trigger: { random: 0.3 }, cooldown: 0, flag: 'su_e008_done',
        autoTrigger: { location: '药王谷', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '又是深夜药圃。他在毒草那片围栏里，手里捏着一株断肠草，看你来，没藏。', type: 'description' },
            { speaker: 'npc', text: '「我跟你说最后一件事。」他声音温润，「我学毒，是因为我师父。他救不了那个人，病倒走的——他若懂毒，以毒攻毒，那个人能活。」' },
            { speaker: 'npc', text: '「我学了毒，就成了医和毒两个东西。药王谷容不下毒。」他看着断肠草，看你，「可我容得下。因为我想——医该医的，毒该毒的。你别怕我。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「我不怕。我帮你分清。」', effect: 'share', affection: 12 },
                { text: '「医和毒，都是救人。」', effect: 'same', affection: 8 },
                { text: '接过断肠草，放回药篓', effect: 'take', affection: 9 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'share': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 15) : { ok: true };
                    if (!_py.ok) { aff = 5; msg = '你撑不住先歪了头，他把你送回房。那句「一起担」，改日再说。（精力不足，那一夜你先撑不住了）'; break; }
                    aff = 12; msg = '他看了你很久，浅褐眼底终于没藏：「……行。」他把断肠草递你，「那你跟我，一起分。」——药王谷的毒草圃，从那夜起，多了一个人。' + '（精力-15）'; break; }
                case 'same': aff = 8; msg = '他笑了一下，温润但到眼底：「……你看得比我还清。」他把断肠草放回药篓，「医和毒，都是救人。这句话，我师父没说过。」'; break;
                case 'take': aff = 9; msg = '你没说话，把他手里的断肠草接过来，放回药篓。他看着你把毒草收好，许久：「……你替我收毒，我替你收命。」他低声，「这账，我记得。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'su_event_009': {
        id: 'su_event_009', npcId: SU_NPC_ID, title: '尝毒之诺', icon: '🔗',
        desc: '他要亲尝「同归」的最后一味，向你讨一个诺。',
        minAffection: 68, trigger: { random: 0.3 }, cooldown: 0, flag: 'su_e009_done',
        autoTrigger: { location: '药王谷', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '药庐深夜。「同归」方改到第十八遍，只差最后一味——芩木把一盏暗红的药液搁在灯下，指腹在盏沿摩挲。', type: 'description' },
            { speaker: 'npc', text: '「方子最后一味，得亲尝。尝出药性，才敢写进方里。」他温润地笑，「我师父当年也是这么尝的——他没尝完。」' },
            { speaker: 'npc', text: '「我尝毒，可能一夜，可能三夜。」他看你，浅褐眼底灯花一映，「跟你讨个诺：我要是醒不过来，你把方子烧了。别让药王谷再走我师父的老路。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「我应你。但你得醒——方我烧，人我拽。」', effect: 'promise', affection: 14 },
                { text: '「你尝毒，我守着你。」', effect: 'guard', affection: 9 },
                { text: '「……这种话，不该对人说吗？」', effect: 'press', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'promise': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 15) : { ok: true };
                    if (!_py.ok) { aff = 6; msg = '你守到后半夜先撑不住歪了头。醒来时药盏空了，方子上多了一行小字的药性——他自己守完了全程。（精力不足，那一夜你先撑不住了）'; break; }
                    aff = 14; msg = ('他怔了怔，忽然笑了，笑第一次到眼底：「……行。」他把方子推到你手边压着，「那你替我看火。我尝毒，你看我。」灯下那张方子，纸是温的。') + '（精力-15）'; break; }
                case 'guard': aff = 9; msg = '他摇头：「烧方不行，那是我师父的。」但他把那盏药液分了一半到另一盏，「那你应我这个——我尝毒，你在。有人在，我少用三分解药。」'; break;
                case 'press': aff = 5; msg = '他别开脸：「……不该。」半晌把药盏又摆正，「可我跟你说了。」他低头，「我师父走的时候，身边没人。我不想那样。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'su_event_010': {
        id: 'su_event_010', npcId: SU_NPC_ID, title: '李时珍的考校', icon: '🐉',
        desc: '李时珍拿绝症医案当面考你，芩木替你担。',
        minAffection: 72, trigger: { random: 0.3 }, cooldown: 0, flag: 'su_e010_done',
        autoTrigger: { location: '药王谷', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '议事药堂。李时珍把一桩死症医案拍在案上：三毒同侵，谷中长老束手。「继承人身边这位，懂医？」他眼皮都不抬，「治。」', type: 'description' },
            { speaker: 'narrator', text: '你刚翻开医案，一只温润的手按在案页上。芩木站到你身前半步。', type: 'description' },
            { speaker: 'npc', text: '「李长老，此人，我担。」他笑还温润，眼底却没笑，「这案子若有差池，我署名。方我开，毒我尝。」' },
            { speaker: 'npc', text: '李时珍盯了他半晌，又看你：「哦？你担？」他把医案推过来，「那老夫看你担不担得起。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '对李时珍一礼：「绝不折谷主继承人的名。」', effect: 'respect', affection: 8 },
                { text: '低声对芩木：「别拿你的名声担我。」', effect: 'stand', affection: 7 },
                { text: '什么也不说，站到他身侧并肩看案', effect: 'side', affection: 11 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'respect': aff = 8; msg = '李时珍把医案翻回去，哼了一声：「……知礼的，未必是庸医。」散堂后芩木低声：「老头子最厌狂徒。你这一礼，比我十张方子管用。」'; break;
                case 'stand': aff = 7; msg = '他侧头看你，浅褐眼底暖了一瞬：「……我的名声，本来就不值钱。」但他没从你身前半步挪开。'; break;
                case 'side': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 15) : { ok: true };
                    if (!_py.ok) { aff = 4; msg = '论案论到后半夜，你靠着药柜先睡着了。醒来时案子定了，医案上并排署着两个名字。（精力不足，那一场你先撑不住了）'; break; }
                    aff = 11; msg = ('他没让你退。两个人把那桩死症从午时论到亥时——散案时李时珍丢下一句：「方尚可。人尚可。」芩木这回的笑，到了眼底。') + '（精力-15）'; break; }
            }
            return { affection: aff, msg: msg };
        }
    },
    'su_event_011': {
        id: 'su_event_011', npcId: SU_NPC_ID, title: '毒反噬', icon: '☠️',
        desc: '尝毒第三夜，毒攻了心。',
        minAffection: 78, trigger: { random: 0.3 }, cooldown: 0, flag: 'su_e011_done',
        autoTrigger: { location: '药王谷', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '尝毒第三夜，药庐的灯忽然灭了。你冲进去——芩木倒在药柜前，唇色青黑，却还维持着那个温润的笑。', type: 'description' },
            { speaker: 'npc', text: '「……没事。」他声音细得像线，「毒攻心。挺过去，方就成了；挺不过——」他没说下去。' },
            { speaker: 'narrator', text: '他的手在袖里抖，另一只手却把那张「同归」方死死压在身下，像怕它被风吹走。', type: 'description' },
            { speaker: 'player_select', text: '你必须立刻做点什么。', options: [
                { text: '抱起他，以自身真气连夜替他压毒', effect: 'hold', affection: 14 },
                { text: '喊他：「芩木！医者不带情绪——现在别笑，给我咬牙挺住！」', effect: 'shout', affection: 10 },
                { text: '灌下半成品的解药，转身守炉把剩下三味熬完', effect: 'drug', affection: 11 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'hold': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 20) : { ok: true };
                    if (!_py.ok) { aff = 6; msg = '丑时你的真气先竭了，后半夜是他反过来把你拽回榻边。毒压下去一半靠药，一半靠人。（精力不足，那一夜你先撑不住了）'; break; }
                    aff = 14; msg = ('你把他抱进怀里，真气一缕一缕渡进他心脉。毒火与你的气缠斗一夜——天亮时他唇色终于回暖，睁眼第一件事是抬手碰了碰你的脸：「……你熬了一夜。」后来那张「同归」方的最后一味药性旁，多了四个小字：有人守夜。') + '（精力-20）'; break; }
                case 'shout': aff = 10; msg = '他一怔，笑没了——随即咬住牙。你第一次见芩木不笑、不温润、狼狈地硬挺。毒过去时他满头汗：「……喊得好。我师父走的时候，没人这么喊他。」'; break;
                case 'drug': aff = 11; msg = '你灌下解药，转身守炉，把剩下三味连夜熬完。天明药成，他已能坐起。他接过药碗，指尖在碗壁停了一下：「……温的。」他看你，「你连我喝药要温的都记得。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'su_event_013': {
        id: 'su_event_013', npcId: SU_NPC_ID, title: '终章·一张为你开的方', icon: '💍',
        desc: '他把那张改了十七遍的方，递给你。',
        minAffection: 85, trigger: { random: 1.0 }, cooldown: 0, flag: 'su_e013_done',
        endingMap: { '医毒同道': 'su_ending_医毒同道', '守药': 'su_ending_守药', '方友': 'su_ending_方友', '茶客': 'su_ending_茶客', '焚方': 'su_ending_焚方', '错过': 'su_ending_错过' },
        scenes: [
            { speaker: 'narrator', text: '药庐。芩木把一张方子摊在你面前——发黄的那张，最后「无效」二字，被他改成「有效」。', type: 'description' },
            { speaker: 'npc', text: '「改到第十八遍了。」他温润地笑，到眼底，「我师父没改成的方，我改成了——因为等的人，来了。」' },
            { speaker: 'npc', text: '「{playerName}。」他把方子推向你，「这方子里每一味药我都先尝过，药性不写在纸上。方名我起好了——两个字：同归。」' },
            { speaker: 'player_select', text: '你的选择将决定你们的关系走向', options: [
                { text: '「要。我带你和这张方下山——医毒济世，哪里有病就去哪里。」', effect: 'lover_travel', affection: 30 },
                { text: '「要。但哪儿也不去。我留在药王谷，陪你守每一炉药。」', effect: 'lover_stay', affection: 28 },
                { text: '「方我接。人就算了——我做你药理的对手，年年药王谷论方。」', effect: 'friend', affection: 20 },
                { text: '「方我接。药庐给我留个茶位——年年尝新方我来试药，不谈风月，只谈药性。」', effect: 'friend_stay', affection: 18 },
                { text: '「我都不要。我只是个路过的病人。」', effect: 'none', affection: 0 }
            ]}
        ],
        effects: function(npc, choice) {
            // v20.25 门槛 5→3：三度伤透即寒心（旧 5 门槛对本线数学不可达，坏结局形同虚设）
            // v20.71 辜负独立成结局「焚方」：伤透的心与单纯的错过分开记账
            var negCount = (window._negativeChoiceCount && window._negativeChoiceCount[SU_NPC_ID]) || 0;
            if (negCount >= 3 && (choice === 'lover_travel' || choice === 'lover_stay')) {
                return { affection: 0, msg: '他看着你，温润的笑没变，但眼底什么都没了：「……改了十八遍，等的是这么一句。」他把方子凑近药炉的火——纸卷起来，「有效」二字先烧没了。「你走吧。这方，我焚了。」', ending: '焚方' };
            }
            switch (choice) {
                case 'lover_travel': return { affection: 30, msg: '他怔了半晌，温润地笑出声，眼底全亮：「……好。下山。我把药圃托付给师兄了。」他把那张方子折好，塞进你袖里，「师父没改成的，我替他改成了——替他，也替我。」', ending: '医毒同道' };
                case 'lover_stay': return { affection: 28, msg: '他点头，把方子和药篓一起拢进你怀里：「……行。药王谷的炉，往后有两盏火。」他声音温润，「你陪我守——医和毒，我都不必一个人分。」', ending: '守药' };
                case 'friend': return { affection: 20, msg: '他笑了一下，虎牙没有，温润到底：「论方对手？行。」他把方子塞你手里，「那你接得住我一炉新方再说。」', ending: '方友' };
                case 'friend_stay': return { affection: 18, msg: '「茶位？」他温润地笑了，「行。茶我温着，方你看着。」他把方子推过来，「往后每改一遍，你头一个看——试药的活，也归你。」', ending: '茶客' };
                case 'none': return { affection: 0, msg: '他沉默了很久，把方子收回袖里。「……也好。」他声音恢复温润，「药庐的门，我照常落锁。路过的病人，药王谷不缺。」', ending: '错过' };
            }
            return { affection: 0, msg: '' };
        }
    }
};

var SU_ENDINGS = {
    'su_ending_医毒同道': {
        id: 'su_ending_医毒同道', npcId: SU_NPC_ID, title: '结局·医毒同道', icon: '⚖️', route: '医毒同道',
        scenes: [
            { speaker: 'narrator', text: '三日后，芩木回谷一趟，把谷主继承人之印还到李时珍案上。老头子掂着印看了他半晌：「绝方留了没有？」他拍拍药箱：「方子都在我这儿。」李时珍哼了一声，收了印，却把茶推给他——谷规写着：喝过这盏茶的离人，谷门永远给他留一道缝。', type: 'description' },
            { speaker: 'npc', text: '「药圃托付给您了。」他背一只药篓，跟你并肩下山，「我自个儿，就是一张方。」' },
            { speaker: 'narrator', text: '多年后，江湖有「医毒双圣」的传说：一人医该医的，一人毒该毒的。专治不治之症。', type: 'description' },
            { speaker: 'narrator', text: '有人见过他们在瘟疫的村落歇脚。他难得没端着温润，靠在{playerTa}肩上打了个盹——药篓搁在脚边，半夏与解药并排。他不装了。', type: 'description' }
        ],
        finalText: '——— 结局·医毒同道（道侣·同行）———'
    },
    'su_ending_守药': {
        id: 'su_ending_守药', npcId: SU_NPC_ID, title: '结局·守药', icon: '🏡', route: '守药',
        scenes: [
            { speaker: 'narrator', text: '你留在了药王谷。药庐的门，从那夜起再没落锁。', type: 'description' },
            { speaker: 'narrator', text: '毒草圃里多了一个人除草的位置，方子由你改，药由他熬。', type: 'description' },
            { speaker: 'npc', text: '「火对了。」他看炉，「文火——正好。」他笑，温润到底，「你改方的手，比师父稳。」' },
            { speaker: 'narrator', text: '李时珍偶尔路过药庐，看这场景，嘀咕一句「毒草圃倒旺了」，走了。但走时步子慢了些。', type: 'description' },
            { speaker: 'narrator', text: '药庐再没有不眠的冷夜——两盏灯，一炉温。', type: 'description' }
        ],
        finalText: '——— 结局·守药（道侣·归隐）———'
    },
    'su_ending_方友': {
        id: 'su_ending_方友', npcId: SU_NPC_ID, title: '结局·方友', icon: '🤝', route: '方友',
        scenes: [
            { speaker: 'narrator', text: '你们成了江湖闻名的药理论方搭档。年年药王谷论方，胜负各半。', type: 'description' },
            { speaker: 'npc', text: '「今年这方，比去年利。」他收方子，「……再松几年，你就能接住我那张十八遍的方了。」' },
            { speaker: 'narrator', text: '有人问你们是什么关系。他答「对手」，{playerTa}答「对手」。说完两人对视，都先笑了——温润到底，眼底也到底。', type: 'description' }
        ],
        finalText: '——— 结局·方友（挚友·同行）———'
    },
    'su_ending_茶客': {
        id: 'su_ending_茶客', npcId: SU_NPC_ID, title: '结局·茶客', icon: '🍵',
        route: '茶客',
        scenes: [
            { speaker: 'narrator', text: '{playerTa}成了药庐的常客。案头那只杯子，茶永远是温的——温的，是芩木的规矩。', type: 'description' },
            { speaker: 'narrator', text: '每改一遍方，{playerTa}头一个看；每出一炉新药，{playerTa}头一个试。两个人不谈风月，只谈药性。', type: 'description' },
            { speaker: 'npc', text: '「这一遍改的是君药。」他把方子推过来，指尖点了点，「……你试出来是什么，我写什么。」' },
            { speaker: 'narrator', text: '李时珍偶尔路过药庐，看见一个试药、一个记方，嘀咕一句「毒草圃倒旺了」，走了。但走时步子慢了些。', type: 'description' }
        ],
        finalText: '——— 结局·茶客（挚友·归隐）———'
    },
    'su_ending_焚方': {
        id: 'su_ending_焚方', npcId: SU_NPC_ID, title: '结局·焚方', icon: '🔥',
        route: '焚方',
        scenes: [
            { speaker: 'narrator', text: '那张改了十八遍的方，被他亲手凑到药炉火上。「有效」二字先卷了边，然后是他的十七遍心血，最后是师父那一笔。', type: 'description' },
            { speaker: 'narrator', text: '第二日，药庐换了新锁。毒草圃的篱笆加高了一尺，那片半夏，再没让任何人看过。', type: 'description' },
            { speaker: 'narrator', text: '药王谷谷主医术愈发精深，温润愈发周全——谷里人说，谷主的笑从没出过错。', type: 'description' },
            { speaker: 'narrator', text: '只有李时珍知道，那年继承人改方到天明，改到第十八遍。焚方那夜，药庐的灯亮了一整夜——第二天，谷主的茶，再没温给过谁。', type: 'description' }
        ],
        finalText: '——— 结局·焚方（辜负）———'
    },
    'su_ending_错过': {
        id: 'su_ending_错过', npcId: SU_NPC_ID, title: '结局·错过', icon: '🏔️', route: '错过',
        scenes: [
            { speaker: 'narrator', text: '后来你还是去过几次药王谷。药庐开着，他对你客气，温润如常，像个对远来客。', type: 'description' },
            { speaker: 'narrator', text: '那张改到十八遍的方，被划掉「有效」，压在药庐最底。', type: 'description' },
            { speaker: 'narrator', text: '再后来，江湖偶有传闻——药王谷谷主医术愈发精深，只是再没人见他，为谁改过一张方到天明。', type: 'description' }
        ],
        finalText: '——— 结局·错过（错过）———'
    }
};

var SU_GENDER_CTX_EVENTS = {
    'su_event_femctx': {
        id: 'su_event_femctx', npcId: SU_NPC_ID, title: '药庐女弟子', icon: '🌿',
        desc: '李时珍把你叫住了。',
        minAffection: 55, trigger: { random: 0.35 }, cooldown: 0, flag: 'su_e_femctx_done',
        requirePlayerFemale: true,
        autoTrigger: { location: '药王谷', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '李时珍把你叫到药圃后头，难得没眯眼。', type: 'description' },
            { speaker: 'npc', text: '「姑娘。」李时珍开门见山，「药王谷的女弟子少，药庐的活重——芩木那小子，对谁都温润，可对谁都温润，就是谁都不近。我怕你跟着他，温润成伤。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「他温润成伤，我认。我自己医。」', effect: 'heal', affection: 8 },
                { text: '「李长老，我自愿的。」', effect: 'accept', affection: 7 },
                { text: '「您是怕他伤我，还是怕他破戒？」', effect: 'probe', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'heal': aff = 8; msg = '李时珍点头：「……你能自医，倒比他强。」他拍你肩，「那小子的温润底下藏毒，你看得见就行——别替他扛。」'; break;
                case 'accept': aff = 7; msg = '李时珍叹气：「自愿的……好。」他背手，「药庐的门，给你留着。温润成伤，别怨他。」'; break;
                case 'probe': aff = 6; msg = '李时珍眯眼看了你半晌：「……两样都怕。」他走了，丢下一句，「他破戒不破戒我看不见，他伤不伤你——我看得见。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'su_event_mctx': {
        id: 'su_event_mctx', npcId: SU_NPC_ID, title: '药庐两个男修', icon: '🌿',
        desc: '师兄把你拉到一旁。',
        minAffection: 55, trigger: { random: 0.35 }, cooldown: 0, flag: 'su_e_mctx_done',
        requirePlayerMale: true,
        autoTrigger: { location: '药王谷', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '药圃后头，李时珍的弟子把你拦下，左右看了一眼，压低声。', type: 'description' },
            { speaker: 'npc', text: '「师弟。」他盯着你，「你跟谷主继承人……药庐里两个大男人成天熬药，谷里都传开了。」' },
            { speaker: 'npc', text: '「我不是说这不好。我是说，江湖上两个男修同行，嘴比断肠草还毒——你受得住，他受得住吗？他那个温润，护短护得狠，护不住自己。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「他护短，我扛事。嘴归嘴。」', effect: 'defy', affection: 8 },
                { text: '「师兄，我们还没到那一步。」', effect: 'deny', affection: 3 },
                { text: '「他要是被嚼舌根，我先开方。」', effect: 'shield', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'defy': aff = 8; msg = '他点头：「……行。你扛得住。」他拍你肩，「嘴归嘴，谁敢动你们，先过我——我跟谷主继承人一个药圃长大。」'; break;
                case 'deny': aff = 3; msg = '他看了你一眼，没多说：「……没到那一步。」他背手走了，「那行。但他记你，我看得见——温润底下，藏不住的。」'; break;
                case 'shield': aff = 7; msg = '他笑了：「你倒护他。」他想了想，「他那温润，真有人嚼舌根，他自己先开方——你跟他，倒是一样。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    }
};

if (typeof NPC_PERSONAL_EVENTS !== 'undefined') {
    Object.assign(NPC_PERSONAL_EVENTS, SU_MAIN_EVENTS);
    Object.assign(NPC_PERSONAL_EVENTS, SU_GENDER_CTX_EVENTS);
}
if (typeof registerEndingSet === 'function') registerEndingSet(SU_NPC_ID, SU_ENDINGS);
if (typeof registerEndingCallback === 'function') {
    registerEndingCallback(SU_NPC_ID, function(endingName, npc) {
        if (endingName === '医毒同道' || endingName === '守药') {
            if (npc && typeof npc.setFlag === 'function') npc.setFlag('dao_companion');
            if (window.showMessage) window.showMessage('🌿 你与芩木结为道侣！医毒感悟大幅提升', 'success');
        } else if (endingName === '方友' || endingName === '茶客') {
            if (npc && npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 30);
            if (window.showMessage) window.showMessage('🌿 你与芩木成了彼此最信得过的论方搭档', 'success');
        } else if (endingName === '焚方') {
            if (window.showMessage) window.showMessage('🔥 芩木焚了那张改到第十八遍的方。有些温润，烧一次就凉透了', 'error');
        }
    });
}

// 扩展男主名册
if (typeof window !== 'undefined' && window.MALE_LEAD_ROSTER) {
    window.MALE_LEAD_ROSTER.push({ id: SU_NPC_ID, name: '芩木', sect: '药王谷', eventId: 'su_event_rival', reconcileId: 'su_event_reconcile', femctxId: 'su_event_femctx', mctxId: 'su_event_mctx' });
}

function maybeAutoTriggerSuEvent(source) { return maybeAutoTriggerPersonalEvent(SU_NPC_ID, source, { finalEvents: ['su_event_013'] }); }
if (typeof window !== 'undefined' && window.timeSystem && window.timeSystem.onNewDaySubscribe) {
    window.timeSystem.onNewDaySubscribe(function() {
        try {
            if (!window.currentCharData || !window.npcManager) return;
            if (window.currentCharData.location === '药王谷') maybeAutoTriggerSuEvent('daily');
            if (window.currentCharData.location !== '药王谷') return;
            var npc = window.npcManager.getNPC ? window.npcManager.getNPC(SU_NPC_ID) : null;
            if (!npc) return;
            var aff = (npc.relationship && npc.relationship.affection) || 0;
            if (aff < 55) return;
            var isF = window.currentCharData.gender === 'female';
            var ctxId = isF ? 'su_event_femctx' : 'su_event_mctx';
            if (typeof hasEventTriggered === 'function' && hasEventTriggered(ctxId)) return;
            var ev = NPC_PERSONAL_EVENTS[ctxId];
            if (!ev) return;
            if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npc)) return;
            setTimeout(function() {
                if (document.querySelector && document.querySelector('.personal-event-modal')) return;
                if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npc)) return;
                if (typeof triggerPersonalEvent === 'function') triggerPersonalEvent(ctxId);
            }, 1200);
        } catch (e) { console.warn('[芩木线] 每日触发失败:', e); }
    });
}

if (typeof window !== 'undefined') {
    window.SU_MAIN_EVENTS = SU_MAIN_EVENTS;
    window.SU_ENDINGS = SU_ENDINGS;
    window.maybeAutoTriggerSuEvent = maybeAutoTriggerSuEvent;
}
console.log('[芩木线] 药王谷男主线加载完成：结局 ' + Object.keys(SU_ENDINGS).length + ' 个 + 主线事件 ' + Object.keys(SU_MAIN_EVENTS).length + ' 个 + 性别语境 ' + Object.keys(SU_GENDER_CTX_EVENTS).length + ' 个');
