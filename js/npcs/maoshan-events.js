// ==================== maoshan-events.js - 昴既明线情缘事件/结局/性别语境 v1.0 ====================
// 男主·昴既明（茅山派青年符箓伏魔道士，阴阳眼，见惯生死鬼神，性冷淡寡言）。

var MS_NPC_ID = 'sect_leader_茅山派';

var MS_MAIN_EVENTS = {
    'ms_event_001': {
        id: 'ms_event_001', npcId: MS_NPC_ID, title: '画符', icon: '🪔',
        desc: '你闯进他画符的静室，朱砂未干。',
        minAffection: 12, trigger: { random: 0.4 }, cooldown: 0, flag: 'ms_e001_done',
        autoTrigger: { location: '茅山派', random: 0.45 },
        scenes: [
            { speaker: 'narrator', text: '你推开静室的门。昴既明正端坐案前，朱砂笔悬着，黄纸上一道符画了一半。门一响，他左眼那点银光一闪——抬手，一道没画完的符朝你飞来，悬在你额前一寸。', type: 'description' },
            { speaker: 'npc', text: '「……活人。」他收了符，声音清冷，「下次敲门。静室里有的是不干净的，你撞上，我救不及。」' },
            { speaker: 'narrator', text: '他低头继续画符，没再看你。但你看见他执笔的手，稳得不像方才受惊的人。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「你画的是什么符？」', effect: 'ask', affection: 5 },
                { text: '「你方才那道符，能挡住什么？」', effect: 'shield', affection: 6 },
                { text: '「我帮你研朱砂。」', effect: 'help', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'ask': aff = 5; msg = '他笔没停：「镇宅。」「……挡得住，也挡不住。挡得住的是鬼，挡不住的是人。」'; break;
                case 'shield': aff = 6; msg = '他抬眼看你，右眼深褐、左眼泛银：「挡得住邪祟。挡不住你。」他说完顿了一下，「……你比邪祟难挡。」'; break;
                case 'help': aff = 7; msg = '他没拒绝。你坐他旁边研朱砂，他画符。一盏茶没说话——但那道符，画得比往日顺。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'ms_event_002': {
        id: 'ms_event_002', npcId: MS_NPC_ID, title: '阴阳眼', icon: '👁️',
        desc: '你发现他能看见你看不见的东西。',
        minAffection: 18, trigger: { random: 0.35 }, cooldown: 0, flag: 'ms_e002_done',
        autoTrigger: { location: '茅山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '夜里你走过古墓群，感觉身后有东西。回头——什么都没有。再转，昴既明不知何时立在你身后，左眼银光微亮。', type: 'description' },
            { speaker: 'npc', text: '「别回头。」他声音清冷，「跟着你的，是个没渡成的游魂。它没恶意，只是迷了路。」' },
            { speaker: 'npc', text: '他从袖里摸出一张渡魂符，朝你身后一抛——你什么都没看见，但空气里仿佛有什么轻了。' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「你能看见，不害怕吗？」', effect: 'fear', affection: 6 },
                { text: '「它去哪了？」', effect: 'where', affection: 7 },
                { text: '「你替它渡了？」', effect: 'ferry', affection: 8 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'fear': aff = 6; msg = '他沉默一瞬：「……见惯了。」他左眼银光敛去，「怕的不是鬼。怕的是活人——活人比鬼难懂。」'; break;
                case 'where': aff = 7; msg = '他指了指天上：「……走了。」他收手，「它该去的地方。你方才回头，它以为你认得它——其实它认错了人。」'; break;
                case 'ferry': aff = 8; msg = '他看了你一眼，左眼银光里第一次有了点别的：「……你倒是头一个问它去哪的，不是问它是什么。」他把空符纸收好，「渡了。它等的就是这一问。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'ms_event_003': {
        id: 'ms_event_003', npcId: MS_NPC_ID, title: '渡魂', icon: '🌌',
        desc: '他替一个游魂画渡魂符，你陪。',
        minAffection: 25, trigger: { random: 0.3 }, cooldown: 0, flag: 'ms_e003_done',
        autoTrigger: { timeRange: [22, 3], location: '茅山派', random: 0.45 },
        scenes: [
            { speaker: 'narrator', text: '深夜符箓阁。昴既明对空画符——你什么也看不见，但他在跟什么说话。', type: 'description' },
            { speaker: 'npc', text: '「……她说是等她女儿。」他对你低声，像在翻译，「女儿十年前下山了，没回来。她怕走远了，等不到。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「那你替她渡。她等够了。」', effect: 'ferry', affection: 8 },
                { text: '「我去帮她找她女儿。」', effect: 'find', affection: 7 },
                { text: '什么都不说，陪他画完', effect: 'silent', affection: 9 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'ferry': aff = 8; msg = '他点头，笔落符成。半晌，空气轻了。「……她走了。」他收笔，「她说，谢你。」——他没看你，但你看见他执笔的手，松了一分。'; break;
                case 'find': aff = 7; msg = '他抬眼：「……你要下山找？」他顿了顿，「她女儿，五年前就死了——在山下。她不知道。」他低头，「有些魂，等不到。但你想找，我陪你找。」'; break;
                case 'silent': aff = 9; msg = '你没说话，坐他旁边。他画完最后一笔，半晌：「……你不问她在哪，不问她是谁。你就坐着。」他左眼银光里有了暖，「她走前说，你身上有光。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'ms_event_004': {
        id: 'ms_event_004', npcId: MS_NPC_ID, title: '鬼夜', icon: '🌑',
        desc: '鬼夜，他守着你。',
        minAffection: 32, trigger: { random: 0.3 }, cooldown: 0, flag: 'ms_e004_done',
        autoTrigger: { timeRange: [23, 4], location: '茅山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '茅山每逢七月，古墓群那头声响不断。你夜里睡不着，推门——昴既明抱着桃木剑，坐在你门外廊下。', type: 'description' },
            { speaker: 'npc', text: '「回去睡。」他没回头，左眼银光在暗里发亮，「今晚墓群那边不太平。你住得近，我守着。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「我陪你守。」坐下', effect: 'stay', affection: 8 },
                { text: '「你不冷吗？我去拿件衣裳。」', effect: 'cloak', affection: 7 },
                { text: '「你守了我几夜了？」', effect: 'howlong', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'stay': aff = 8; msg = '他看了你一眼，没赶你。「……行。」他往旁边挪了挪，给你让了廊下一个位。两人守了一夜，他左眼银光没灭，但他说：「你在，比桃木剑管用。」'; break;
                case 'cloak': aff = 7; msg = '他接过衣裳，指尖顿了一下：「……我不冷。」但他披上了，「你倒记着我不冷。」他声音清冷，耳根却看不清颜色——暗里。'; break;
                case 'howlong': aff = 6; msg = '他沉默一瞬：「……七月整月。」他没回头，「你每晚睡不着，我就守着。」——他守了你整整一个月，没让你知道。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'ms_event_005': {
        id: 'ms_event_005', npcId: MS_NPC_ID, title: '未画完的符', icon: '📜',
        desc: '一道画了三年没画完的渡魂符。',
        minAffection: 40, trigger: { random: 0.3 }, cooldown: 0, flag: 'ms_e005_done',
        autoTrigger: { location: '茅山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '符箓阁深处，你发现一张压在镇纸下的符——朱砂画了一半，三年前的旧纸。昴既明进来，看见你看，脚步顿住。', type: 'description' },
            { speaker: 'npc', text: '「……那道，是替我师兄画的。」他声音清冷，「三年前他伏魔，魂散了。我画渡魂符想替他聚——画了三年，画不成。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「他魂散了，你渡不了。」', effect: 'truth', affection: 7 },
                { text: '「我帮你画。」', effect: 'help', affection: 8 },
                { text: '把符折好还他', effect: 'return', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'truth': aff = 7; msg = '他闭眼：「……我知道。」许久，「可画着，就觉得他还在。」他睁眼，左眼银光里有点红，「你看得清，比我自己清。」'; break;
                case 'help': aff = 8; msg = '他看了你很久：「……你画不来符。」但他把笔递你，「你握笔，我执手。」——那一夜，他握着你的手，画完了那道符。没渡成，但他画完了。'; break;
                case 'return': aff = 6; msg = '他接过符，指尖摩挲那道没画完的线。「……谢了。」他把它压回镇纸下——和那些渡过的游魂的空符放在一起。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'ms_event_006': {
        id: 'ms_event_006', npcId: MS_NPC_ID, title: '见惯生死', icon: '⚖️',
        desc: '他说见惯鬼神反而不怕死，怕的是活人。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'ms_e006_done',
        autoTrigger: { location: '茅山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '你问他怕不怕死。他正在磨朱砂，手顿住。', type: 'description' },
            { speaker: 'npc', text: '「不怕。」他声音清冷，「我七岁死过一次。死没什么可怕的——黑，然后有人喊你回来。」' },
            { speaker: 'npc', text: '「我怕的是活人。」他抬眼，左眼银光里映着你，「鬼要走的，我能渡。活人不走，我渡不了——你，就是那个不走的。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「我不走。你渡不了，就别渡。」', effect: 'stay', affection: 9 },
                { text: '「那你怕我，还是怕自己？」', effect: 'probe', affection: 7 },
                { text: '「我也怕活人。怕你。」', effect: 'fear', affection: 8 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'stay': aff = 9; msg = '他怔了很久，左眼银光动了一下：「……行。」他低头继续磨朱砂，「你不走，我就不渡。我守着——比守古墓群上心。」'; break;
                case 'probe': aff = 7; msg = '他沉默半晌：「……都怕。」他没看你，「怕你走，更怕你为我不走。我守了一辈子魂，头一回，想守个活人。」'; break;
                case 'fear': aff = 8; msg = '他罕见地笑了一下，清冷里裂一线暖：「……你怕我？」他收了朱砂，「那你跑啊。」——他没动，但他知道你不会跑。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'ms_event_007': {
        id: 'ms_event_007', npcId: MS_NPC_ID, title: '死过一次', icon: '🕯️',
        desc: '他幼时死过一次，阴阳眼的来历。',
        minAffection: 55, trigger: { random: 0.3 }, cooldown: 0, flag: 'ms_e007_done',
        autoTrigger: { location: '茅山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '又是鬼夜。他坐在你门外廊下，你推门出来，他罕见地没赶你回去。', type: 'description' },
            { speaker: 'npc', text: '「我跟你说个事。」他看着暗处，「我七岁那年高烧，死了三天。第三天我师父守着我，听见我在说胡话——我在跟一群看不见的人说话。」' },
            { speaker: 'npc', text: '「我活了。自那以后，左眼能见鬼神。」他抬眼，银光在暗里亮，「他们都说我是天选——其实我是被丢回来的。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「被丢回来，是因为还有人等你。」', effect: 'wait', affection: 9 },
                { text: '「你不该一个人守这些。」', effect: 'share', affection: 8 },
                { text: '坐他旁边，肩挨肩', effect: 'sit', affection: 10 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'wait': aff = 9; msg = '他看了你很久，银光里第一次没在渡魂：「……你说对了。」他声音轻，「我守了二十年，等的就是这个。」——等的不是魂，是有人跟他说一句，被丢回来，是因为有人等。'; break;
                case 'share': aff = 8; msg = '他点头：「……行。」他往旁边挪了挪，给你让位，「你守着我——我守着墓群。今晚换班。」他罕见地，有了点人气。'; break;
                case 'sit': aff = 10; msg = '你没说话，坐他旁边。他没动，许久，肩靠过来一点点——很轻。「……你不怕黑。」他说。「有你在，我也不怕了。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'ms_event_008': {
        id: 'ms_event_008', npcId: MS_NPC_ID, title: '渡你', icon: '🌉',
        desc: '他说，若你先死，他渡你。',
        minAffection: 62, trigger: { random: 0.3 }, cooldown: 0, flag: 'ms_e008_done',
        autoTrigger: { location: '茅山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '符箓阁深夜。他在画一道新符，朱砂比往日浓。你进去，他把符推到一旁，挡着。', type: 'description' },
            { speaker: 'npc', text: '「……这道，是给你画的。」他声音清冷，但没赶你，「渡魂符。我画了一道，防着——万一你走在前头。」' },
            { speaker: 'npc', text: '「我渡了一辈子魂。若是你，」他抬眼，银光里映着你，「我不让你迷路。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「那我走在后头。你先走，我渡你。」', effect: 'reverse', affection: 10 },
                { text: '「我们都不先走。一起走。」', effect: 'together', affection: 9 },
                { text: '接过那道符，收好', effect: 'take', affection: 8 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'reverse': aff = 10; msg = '他怔住，银光里第一次有了水色——又压下去。「……你渡不了我。你没阴阳眼。」他顿了顿，「但你肯——这一句，比符管用。」'; break;
                case 'together': aff = 9; msg = '他看了你很久，半晌：「……行。」他把那道符折好，塞进你袖里，「一起走。走远了，我替你画符——你替我留灯。」'; break;
                case 'take': aff = 8; msg = '他看你把符收进最贴身的地方，左眼银光敛了：「……你收着。」他低头继续画下一道，「我给你画的，不止这一道。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'ms_event_013': {
        id: 'ms_event_013', npcId: MS_NPC_ID, title: '终章·一道为你画的符', icon: '💍',
        desc: '他画了一道护身符，推向你。',
        minAffection: 85, trigger: { random: 1.0 }, cooldown: 0, flag: 'ms_e013_done',
        endingMap: { '符箓同道': 'ms_ending_符箓同道', '守坛': 'ms_ending_守坛', '符友': 'ms_ending_符友', '错过': 'ms_ending_错过' },
        scenes: [
            { speaker: 'narrator', text: '符箓阁。昴既明把一道金边符推到你面前——不是渡魂符，是护身符，朱砂画成，比往日浓。', type: 'description' },
            { speaker: 'npc', text: '「画成了。」他声音清冷，但银光里映着你，「我渡了二十年魂。头一回，画一道护活人的符。」' },
            { speaker: 'npc', text: '「{playerName}。」他把符推向你，「这道符，连同画符的人，你要不要？」' },
            { speaker: 'player_select', text: '你的选择将决定你们的关系走向', options: [
                { text: '「要。我带你下山——伏魔渡魂，哪里有邪祟就去哪里。」', effect: 'lover_travel', affection: 30 },
                { text: '「要。但哪儿也不去。我留在茅山，陪你守每一道符。」', effect: 'lover_stay', affection: 28 },
                { text: '「符我接。人就算了——我做你伏魔的搭档，年年茅山论符。」', effect: 'friend', affection: 20 },
                { text: '「我都不要。我只是个路过的看客。」', effect: 'none', affection: 0 }
            ]}
        ],
        effects: function(npc, choice) {
            var negCount = (window._negativeChoiceCount && window._negativeChoiceCount[MS_NPC_ID]) || 0;
            if (negCount >= 5 && (choice === 'lover_travel' || choice === 'lover_stay')) {
                return { affection: 0, msg: '他看着你，银光渐灭：「……我画了二十年，等的是这么一句。」他把那道护身符收回，朱砂被他亲手抹去。「你走吧。这道符，我留着自己画。」', ending: '错过' };
            }
            switch (choice) {
                case 'lover_travel': return { affection: 30, msg: '他怔了半晌，银光里有了暖：「……好。下山。」他把符塞进你袖里，「我渡魂的，头一回护个活人——你替我留灯，我替你画符。」', ending: '符箓同道' };
                case 'lover_stay': return { affection: 28, msg: '他点头，把符和你一起拢进怀里：「……行。茅山派的符阁，往后有两盏灯。」他声音清冷，但没赶你，「你陪我守——鬼夜，我守你；平日，你守我。」', ending: '守坛' };
                case 'friend': return { affection: 20, msg: '他罕见地笑了一下，清冷里裂一线暖：「论符对手？行。」他把符塞你手里，「那你接得住我一道天罡符再说。」', ending: '符友' };
                case 'none': return { affection: 0, msg: '他沉默了很久，把符收回袖里。「……也好。」他声音恢复清冷，「符阁的门，我照常落锁。路过的看客，茅山不缺。」', ending: '错过' };
            }
            return { affection: 0, msg: '' };
        }
    }
};

var MS_ENDINGS = {
    'ms_ending_符箓同道': {
        id: 'ms_ending_符箓同道', npcId: MS_NPC_ID, title: '结局·符箓同道', icon: '🪔', route: '符箓同道',
        scenes: [
            { speaker: 'narrator', text: '三日后，昴既明把伏魔首席之印交还茅山老祖。', type: 'description' },
            { speaker: 'npc', text: '「符阁托付给您了。」他背一道桃木剑，跟你并肩下山，「我自个儿，就是一道符。」' },
            { speaker: 'narrator', text: '多年后，江湖有「阴阳双符」的传说：一道渡魂，一道护人。专渡迷路的、护不该死的。', type: 'description' },
            { speaker: 'narrator', text: '有人见过他们在荒村的夜里歇脚。他难得没开阴阳眼，靠在{playerTa}肩上打了个盹——桃木剑搁在脚边，朱砂干透。他不渡了，因为要护的人在身边。', type: 'description' }
        ],
        finalText: '——— 结局·符箓同道（道侣·同行）———'
    },
    'ms_ending_守坛': {
        id: 'ms_ending_守坛', npcId: MS_NPC_ID, title: '结局·守坛', icon: '🏡', route: '守坛',
        scenes: [
            { speaker: 'narrator', text: '你留在了茅山派。符箓阁的门，从那夜起再没落锁。', type: 'description' },
            { speaker: 'narrator', text: '阁里多了一个人研朱砂的位置，符由他画，灯由你点。', type: 'description' },
            { speaker: 'npc', text: '「朱砂对了。」他收笔，「浓——正好。」他抬眼，银光里有暖，「你研的，比师父浓。」' },
            { speaker: 'narrator', text: '茅山老祖偶尔路过符阁，看这场景，嘀咕一句「阁里人气旺了」，走了。但走时步子慢了些。', type: 'description' },
            { speaker: 'narrator', text: '鬼夜再不冷——两盏灯，一道符。', type: 'description' }
        ],
        finalText: '——— 结局·守坛（道侣·归隐）———'
    },
    'ms_ending_符友': {
        id: 'ms_ending_符友', npcId: MS_NPC_ID, title: '结局·符友', icon: '🤝', route: '符友',
        scenes: [
            { speaker: 'narrator', text: '你们成了江湖闻名的伏魔搭档。年年茅山论符，胜负各半。', type: 'description' },
            { speaker: 'npc', text: '「今年这道，比去年利。」他收符，「……再松几年，你就能接住我天罡符了。」' },
            { speaker: 'narrator', text: '有人问你们是什么关系。他答「对手」，{playerTa}答「对手」。说完两人对视，都先笑了——清冷里裂一线暖。', type: 'description' }
        ],
        finalText: '——— 结局·符友（挚友·同行）———'
    },
    'ms_ending_错过': {
        id: 'ms_ending_错过', npcId: MS_NPC_ID, title: '结局·错过', icon: '🏔️', route: '错过',
        scenes: [
            { speaker: 'narrator', text: '后来你还是去过几次茅山。符阁开着，他对你客气，清冷如常，像个对远来客。', type: 'description' },
            { speaker: 'narrator', text: '那道护身符被他抹去朱砂，压在符阁镇纸下，再没补过。', type: 'description' },
            { speaker: 'narrator', text: '再后来，江湖偶有传闻——茅山伏魔首席道法愈发精深，只是再没人见他，为谁画过一道护身符。', type: 'description' }
        ],
        finalText: '——— 结局·错过（错过）———'
    }
};

var MS_GENDER_CTX_EVENTS = {
    'ms_event_femctx': {
        id: 'ms_event_femctx', npcId: MS_NPC_ID, title: '符阁女修', icon: '🪔',
        desc: '张天师把你叫住了。',
        minAffection: 55, trigger: { random: 0.35 }, cooldown: 0, flag: 'ms_e_femctx_done',
        requirePlayerFemale: true,
        autoTrigger: { location: '茅山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '张天师把你叫到符阁后头，难得没眯眼。', type: 'description' },
            { speaker: 'npc', text: '「姑娘。」张天师开门见山，「茅山的符阁，女弟子少——既明那小子，对谁都清冷，可对谁都清冷，就是谁都不近。我怕你跟着他，清冷成伤。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「他清冷成伤，我认。我自己暖。」', effect: 'warm', affection: 8 },
                { text: '「张长老，我自愿的。」', effect: 'accept', affection: 7 },
                { text: '「您是怕他伤我，还是怕他破戒？」', effect: 'probe', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'warm': aff = 8; msg = '张天师点头：「……你能自暖，倒比他强。」他拍你肩，「那小子的清冷底下藏符，你看得见就行——别替他扛。」'; break;
                case 'accept': aff = 7; msg = '张天师叹气：「自愿的……好。」他背手，「符阁的门，给你留着。清冷成伤，别怨他。」'; break;
                case 'probe': aff = 6; msg = '张天师眯眼看了你半晌：「……两样都怕。」他走了，丢下一句，「他破戒不破戒我看不见，他伤不伤你——我看得见。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'ms_event_mctx': {
        id: 'ms_event_mctx', npcId: MS_NPC_ID, title: '符阁两个男修', icon: '🪔',
        desc: '诸葛青把你拦下了。',
        minAffection: 55, trigger: { random: 0.35 }, cooldown: 0, flag: 'ms_e_mctx_done',
        requirePlayerMale: true,
        autoTrigger: { location: '茅山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '符阁后头，诸葛青长老把你拦下，左右看了一眼，压低声。', type: 'description' },
            { speaker: 'npc', text: '「师弟。」他盯着你，「你跟既明……符阁里两个大男人成天画符，茅山都传开了。」' },
            { speaker: 'npc', text: '「我不是说这不好。我是说，江湖上两个男修同行，嘴比朱砂还红——你受得住，他受得住吗？他那个清冷，护短护得狠，护不住自己。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「他护短，我扛事。嘴归嘴。」', effect: 'defy', affection: 8 },
                { text: '「长老，我们还没到那一步。」', effect: 'deny', affection: 3 },
                { text: '「他要是被嚼舌根，我先画符。」', effect: 'shield', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'defy': aff = 8; msg = '诸葛青点头：「……行。你扛得住。」他拍你肩，「嘴归嘴，谁敢动你们，先过我——我跟既明一个符阁长大。」'; break;
                case 'deny': aff = 3; msg = '诸葛青看了你一眼，没多说：「……没到那一步。」他背手走了，「那行。但他记你，我看得见——清冷底下，藏不住。」'; break;
                case 'shield': aff = 7; msg = '诸葛青笑了：「你倒护他。」他想了想，「他那清冷，真有人嚼舌根，他自己先画符——你跟他，倒是一样。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    }
};

if (typeof NPC_PERSONAL_EVENTS !== 'undefined') {
    Object.assign(NPC_PERSONAL_EVENTS, MS_MAIN_EVENTS);
    Object.assign(NPC_PERSONAL_EVENTS, MS_GENDER_CTX_EVENTS);
}
if (typeof registerEndingSet === 'function') registerEndingSet(MS_NPC_ID, MS_ENDINGS);
if (typeof registerEndingCallback === 'function') {
    registerEndingCallback(MS_NPC_ID, function(endingName, npc) {
        if (endingName === '符箓同道' || endingName === '守坛') {
            if (npc && typeof npc.setFlag === 'function') npc.setFlag('dao_companion');
            if (window.showMessage) window.showMessage('🪔 你与昴既明结为道侣！符箓感悟大幅提升', 'success');
        } else if (endingName === '符友') {
            if (npc && npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 30);
            if (window.showMessage) window.showMessage('🪔 你与昴既明成了彼此最信得过的伏魔搭档', 'success');
        }
    });
}

if (typeof window !== 'undefined' && window.MALE_LEAD_ROSTER) {
    window.MALE_LEAD_ROSTER.push({ id: MS_NPC_ID, name: '昴既明', sect: '茅山派', eventId: 'ms_event_rival', reconcileId: 'ms_event_reconcile', femctxId: 'ms_event_femctx', mctxId: 'ms_event_mctx' });
}

function maybeAutoTriggerMsEvent(source) { return maybeAutoTriggerPersonalEvent(MS_NPC_ID, source, { finalEvents: ['ms_event_013'] }); }
if (typeof window !== 'undefined' && window.timeSystem && window.timeSystem.onNewDaySubscribe) {
    window.timeSystem.onNewDaySubscribe(function() {
        try {
            if (!window.currentCharData || !window.npcManager) return;
            if (window.currentCharData.location === '茅山派') maybeAutoTriggerMsEvent('daily');
            if (window.currentCharData.location !== '茅山派') return;
            var npc = window.npcManager.getNPC ? window.npcManager.getNPC(MS_NPC_ID) : null;
            if (!npc) return;
            var aff = (npc.relationship && npc.relationship.affection) || 0;
            if (aff < 55) return;
            var isF = window.currentCharData.gender === 'female';
            var ctxId = isF ? 'ms_event_femctx' : 'ms_event_mctx';
            if (typeof hasEventTriggered === 'function' && hasEventTriggered(ctxId)) return;
            var ev = NPC_PERSONAL_EVENTS[ctxId];
            if (!ev) return;
            if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npc)) return;
            setTimeout(function() {
                if (document.querySelector && document.querySelector('.personal-event-modal')) return;
                if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npc)) return;
                if (typeof triggerPersonalEvent === 'function') triggerPersonalEvent(ctxId);
            }, 1200);
        } catch (e) { console.warn('[昴既明线] 每日触发失败:', e); }
    });
}

if (typeof window !== 'undefined') {
    window.MS_MAIN_EVENTS = MS_MAIN_EVENTS;
    window.MS_ENDINGS = MS_ENDINGS;
    window.maybeAutoTriggerMsEvent = maybeAutoTriggerMsEvent;
}
console.log('[昴既明线] 茅山派男主线加载完成：结局 ' + Object.keys(MS_ENDINGS).length + ' 个 + 主线事件 ' + Object.keys(MS_MAIN_EVENTS).length + ' 个 + 性别语境 ' + Object.keys(MS_GENDER_CTX_EVENTS).length + ' 个');
