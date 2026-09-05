// ==================== baihua-events-extra.js - 温蘅日常/接近事件（bh_event_015~032） ====================
// 依赖：npcs/npc-personal-events.js、baihua-events-main.js（BAIHUA_NPC_ID）
// 加载顺序：在 baihua-events-main.js 之后

// ============ 她的日常（bh_event_015~024）——她做了但不说的那些事 ============
var BAIHUA_DAILY_EVENTS = {
    'bh_event_015': { id: 'bh_event_015', npcId: BAIHUA_NPC_ID, title: '提神药茶', icon: '🍵', desc: '你熬夜修炼打瞌睡，桌角多了一壶药茶。', minAffection: 20, trigger: { random: 0.3 }, cooldown: 0, flag: 'bh_e015_done', autoTrigger: { random: 0.3 },
        scenes: [
            { speaker: 'narrator', text: '你熬夜修炼，白天顶着两个黑眼圈打瞌睡。', type: 'description' },
            { speaker: 'narrator', text: '傍晚回房，桌角多了一壶提神药茶——微苦，回甘。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '喝了，去找她道谢', effect: 'thanks', affection: 5 },
                { text: '默默喝完', effect: 'drink', affection: 3 },
                { text: '放着没动', effect: 'ignore', affection: 0 }
            ]}
        ],
        effects: function(npc, choice) { var aff = 0, msg = ''; switch(choice) {
            case 'thanks': aff = 5; msg = '她头也没抬：「人参薄荷，提神不伤身。……下次早点睡。」'; break;
            case 'drink': aff = 3; msg = '第二天她瞥了你一眼：「今天精神不错。」'; break;
            case 'ignore': aff = 0; msg = '茶凉了，没人动过。'; break; } return { affection: aff, msg: msg }; }
    },
    'bh_event_016': { id: 'bh_event_016', npcId: BAIHUA_NPC_ID, title: '伤药', icon: '💊', desc: '练武蹭破了皮，枕边多了一罐药膏。', minAffection: 20, trigger: { random: 0.3 }, cooldown: 0, flag: 'bh_e016_done', autoTrigger: { random: 0.3 },
        scenes: [
            { speaker: 'narrator', text: '你练武时蹭破了手肘，没当回事。', type: 'description' },
            { speaker: 'narrator', text: '第二天早上，枕边多了一罐伤药膏。标签上是她的小楷：「一日三次，别沾水。」', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '涂了，去道谢', effect: 'thanks', affection: 5 },
                { text: '乖乖涂药', effect: 'use', affection: 4 },
                { text: '没用，搁在一边', effect: 'ignore', affection: -1 }
            ]}
        ],
        effects: function(npc, choice) { var aff = 0, msg = ''; switch(choice) {
            case 'thanks': aff = 5; msg = '她正在碾药，头也不抬：「顺手做的。」——罐子上却刻着你的名字。'; break;
            case 'use': aff = 4; msg = '几天后她看到你肘上的痂：「愈合得不错。」语气像在自夸。'; break;
            case 'ignore': aff = -1; msg = '那罐药膏后来不见了。她再没提过。'; break; } return { affection: aff, msg: msg }; }
    },
    'bh_event_017': { id: 'bh_event_017', npcId: BAIHUA_NPC_ID, title: '花粥', icon: '🥣', desc: '你随口说胃口不好。', minAffection: 22, trigger: { random: 0.3 }, cooldown: 0, flag: 'bh_e017_done', autoTrigger: { timeRange: [6, 10], random: 0.3 },
        scenes: [
            { speaker: 'narrator', text: '你随口抱怨了一句「最近胃口不好」。', type: 'description' },
            { speaker: 'narrator', text: '第二天的早饭碗里，是一碗百合莲子粥，清甜软糯。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '吃完，添了第二碗', effect: 'more', affection: 5 },
                { text: '去问她是不是她做的', effect: 'ask', affection: 4 },
                { text: '还是没胃口，剩下了', effect: 'leftover', affection: -1 }
            ]}
        ],
        effects: function(npc, choice) { var aff = 0, msg = ''; switch(choice) {
            case 'more': aff = 5; msg = '添粥的时候，掌勺的师姐笑了：「谷主说你要是能吃完两碗，以后天天做。」'; break;
            case 'ask': aff = 4; msg = '「厨房随手煮的。」她说。——但配方里那味安神的合欢花，是她的私藏。'; break;
            case 'leftover': aff = -1; msg = '她路过看到你的碗，什么都没说。第二天的粥换回了白粥。'; break; } return { affection: aff, msg: msg }; }
    },
    'bh_event_018': { id: 'bh_event_018', npcId: BAIHUA_NPC_ID, title: '驱虫香囊', icon: '🌿', desc: '夏天蚊虫多，门口挂上了香囊。', minAffection: 24, trigger: { random: 0.3 }, cooldown: 0, flag: 'bh_e018_done', autoTrigger: { random: 0.3 },
        scenes: [
            { speaker: 'narrator', text: '入夏，谷里蚊虫渐多。', type: 'description' },
            { speaker: 'narrator', text: '不知何时，你门口挂上了一只驱虫香囊——艾草和薄荷的味道，针脚细密。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '一直戴着', effect: 'wear', affection: 4 },
                { text: '拆开研究配方，去找她讨教', effect: 'study', affection: 5 },
                { text: '嫌味道怪，摘了', effect: 'remove', affection: -1 }
            ]}
        ],
        effects: function(npc, choice) { var aff = 0, msg = ''; switch(choice) {
            case 'wear': aff = 4; msg = '整个夏天你没被咬过一口。'; break;
            case 'study': aff = 5; msg = '她挑眉：「看出来了？」然后真的给你讲了一下午驱虫药理。——那是你听她讲课讲得最久的一次。'; break;
            case 'remove': aff = -1; msg = '香囊被摘下来那天，她在廊下看了很久。'; break; } return { affection: aff, msg: msg }; }
    },
    'bh_event_019': { id: 'bh_event_019', npcId: BAIHUA_NPC_ID, title: '手绘地图', icon: '🗺️', desc: '你想去北边采一味主药。', minAffection: 28, trigger: { random: 0.3 }, cooldown: 0, flag: 'bh_e019_done', autoTrigger: { random: 0.3 },
        scenes: [
            { speaker: 'narrator', text: '你提到想去北边采一味主药，说说也就忘了。', type: 'description' },
            { speaker: 'narrator', text: '第二天，你门口贴着一张手绘地图：三条采集路线，每条都标了危险等级。末尾一行小字：「走中路。近的那条有蛇。」', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '按图走中路', effect: 'follow', affection: 5 },
                { text: '偏走近路，结果真被蛇咬了', effect: 'snake', affection: 2 },
                { text: '没去成', effect: 'skip', affection: 0 }
            ]}
        ],
        effects: function(npc, choice) { var aff = 0, msg = ''; switch(choice) {
            case 'follow': aff = 5; msg = '中路不但安全，路边还正好长着一丛你要找的药——地图上画了个小小的圈。'; break;
            case 'snake': aff = 2; msg = '你捂着肿起来的小腿回到谷里。她一边给你上药一边笑，笑得肩膀直抖：「说了有蛇。」——但药是现成的，连蛇毒血清都备好了。'; break;
            case 'skip': aff = 0; msg = '那张地图你在门上贴了很久，舍不得撕。'; break; } return { affection: aff, msg: msg }; }
    },
    'bh_event_020': { id: 'bh_event_020', npcId: BAIHUA_NPC_ID, title: '留灯的药庐', icon: '🪔', desc: '晚归时，药庐的灯还亮着。', minAffection: 30, trigger: { random: 0.3 }, cooldown: 0, flag: 'bh_e020_done', autoTrigger: { timeRange: [21, 3], random: 0.3 },
        scenes: [
            { speaker: 'narrator', text: '你出诊归来已是深夜。远远地，你看见药庐的灯还亮着。', type: 'description' },
            { speaker: 'narrator', text: '后来你才知道，那盏灯不是她在用功——是给你留的门灯。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '去敲门道晚安', effect: 'knock', affection: 5 },
                { text: '第二天提起这事', effect: 'mention', affection: 4 },
                { text: '装作没注意', effect: 'ignore', affection: 0 }
            ]}
        ],
        effects: function(npc, choice) { var aff = 0, msg = ''; switch(choice) {
            case 'knock': aff = 5; msg = '她开门时披着外衫，眼里没有睡意。「回来了？」她侧身让你进去，「灶上有汤。」'; break;
            case 'mention': aff = 4; msg = '「灯坏了。」她说。可第二天，那盏灯换成了新的，还是亮着。'; break;
            case 'ignore': aff = 0; msg = '灯每晚都亮着。你假装不知道为谁而亮。'; break; } return { affection: aff, msg: msg }; }
    },
    'bh_event_021': { id: 'bh_event_021', npcId: BAIHUA_NPC_ID, title: '一对杯盏', icon: '☕', desc: '药庐案头多了一只客用茶杯。', minAffection: 35, trigger: { random: 0.2 }, cooldown: 0, flag: 'bh_e021_done', autoTrigger: { random: 0.25 },
        scenes: [
            { speaker: 'narrator', text: '药庐的案头上，不知何时多了一只客用茶杯——青瓷的，和她那只正好成一对。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '用那只杯子喝茶', effect: 'use', affection: 5 },
                { text: '问她杯子哪来的', effect: 'ask', affection: 4 },
                { text: '没敢动', effect: 'untouched', affection: 0 }
            ]}
        ],
        effects: function(npc, choice) { var aff = 0, msg = ''; switch(choice) {
            case 'use': aff = 5; msg = '她看见你用那只杯子，愣了一下，然后很自然地拎起壶给你续了茶。从那天起，那只杯子就是你的了。'; break;
            case 'ask': aff = 4; msg = '「买的。」她说，「一只两只，价钱一样。」——可那对杯子的釉色纹样，是定制的。'; break;
            case 'untouched': aff = 0; msg = '杯子一直在那里，落了灰又被擦净，再落灰。'; break; } return { affection: aff, msg: msg }; }
    },
    'bh_event_022': { id: 'bh_event_022', npcId: BAIHUA_NPC_ID, title: '暖房旁的院子', icon: '🏠', desc: '入冬，你的住处被安排到暖房旁。', minAffection: 42, trigger: { random: 0.3 }, cooldown: 0, flag: 'bh_e022_done', autoTrigger: { random: 0.3 },
        scenes: [
            { speaker: 'narrator', text: '入冬第一天，管事的师姐通知你搬院子——新院子在暖房旁边，「仓库腾出来的」。', type: 'description' },
            { speaker: 'narrator', text: '你搬进去才发现：屋里温度刚好，窗边还留着一个空花架。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '搬进去，并给她送了一篓暖炉用的炭', effect: 'coal', affection: 5 },
                { text: '老老实实道谢', effect: 'thanks', affection: 3 },
                { text: '嫌搬家麻烦，不搬', effect: 'refuse', affection: 0 }
            ]}
        ],
        effects: function(npc, choice) { var aff = 0, msg = ''; switch(choice) {
            case 'coal': aff = 5; msg = '她看着那篓炭，又看看你：「……暖房的炭是公账。」顿了顿，「不过，谢了。」'; break;
            case 'thanks': aff = 3; msg = '「暖房余温，不用白不用。」她说得理直气壮。'; break;
            case 'refuse': aff = 0; msg = '那个冬天有点冷。花架空着。'; break; } return { affection: aff, msg: msg }; }
    },
    'bh_event_023': { id: 'bh_event_023', npcId: BAIHUA_NPC_ID, title: '药膳', icon: '🍲', desc: '养伤期间，每餐都有对症的药膳。', minAffection: 26, trigger: { random: 0.3 }, cooldown: 0, flag: 'bh_e023_done', autoTrigger: { random: 0.3 },
        scenes: [
            { speaker: 'narrator', text: '你受伤休养期间，每一餐都出现了对症的药膳——一日三餐，顿顿不重样。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '吃得干干净净', effect: 'eat', affection: 4 },
                { text: '偷偷去厨房道谢', effect: 'kitchen', affection: 5 },
                { text: '吃腻了，抱怨了两句', effect: 'complain', affection: -2 }
            ]}
        ],
        effects: function(npc, choice) { var aff = 0, msg = ''; switch(choice) {
            case 'eat': aff = 4; msg = '你的伤好得比预想快。她来复诊时看了看伤口：「嗯，药没白费。」'; break;
            case 'kitchen': aff = 5; msg = '厨房师姐神秘一笑：「方子是谷主开的，火候是她盯的。」——她明明每天忙得脚不沾地。'; break;
            case 'complain': aff = -2; msg = '第二天起，药膳没有了。换成普通饭菜。你竟然有点想念那个味道。'; break; } return { affection: aff, msg: msg }; }
    },
    'bh_event_024': { id: 'bh_event_024', npcId: BAIHUA_NPC_ID, title: '三个月前的话', icon: '💭', desc: '三个月前你随口说过的话，她记得。', minAffection: 45, trigger: { random: 0.2 }, cooldown: 0, flag: 'bh_e024_done', autoTrigger: { random: 0.25 },
        scenes: [
            { speaker: 'narrator', text: '你三个月前随口提过一嘴：你对某味常见药材过敏。', type: 'description' },
            { speaker: 'narrator', text: '今天你偶然发现——之后所有开给你的方子里，都没有那味药。包括其他医师开的。', type: 'description' },
            { speaker: 'narrator', text: '你问了才知道：她跟全谷的医师都打过招呼了。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '发现了，去问她', effect: 'ask', affection: 6 },
                { text: '一直没发现', effect: 'never', affection: 0 }
            ]}
        ],
        effects: function(npc, choice) { var aff = 0, msg = ''; switch(choice) {
            case 'ask': aff = 6; msg = '她正在晒药，闻言手一顿：「……医者本分。」阳光落在她低下的侧脸上，耳朵尖有点红。'; break;
            case 'never': aff = 0; msg = '你始终没发现。有些温柔，就这样无声无息地护着你。'; break; } return { affection: aff, msg: msg }; }
    }
};

// ============ 她的靠近（bh_event_025~032）——她主动但不承认的那些时刻 ============
var BAIHUA_APPROACH_EVENTS = {
    'bh_event_025': { id: 'bh_event_025', npcId: BAIHUA_NPC_ID, title: '恰好浇水', icon: '🚶‍♀️', desc: '她在你练剑的地方「恰好」浇花。', minAffection: 25, trigger: { random: 0.3 }, cooldown: 0, flag: 'bh_e025_done', autoTrigger: { location: '百花谷', random: 0.3 },
        scenes: [
            { speaker: 'narrator', text: '你在后山练剑，温蘅提着水壶在不远处的花畦浇水。', type: 'description' },
            { speaker: 'narrator', text: '你练了一个时辰，她浇了一个时辰——那片花畦都快被她淹了。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '练完剑，过去陪她浇花', effect: 'join', affection: 5 },
                { text: '默默给她搬了个凳子', effect: 'stool', affection: 6 },
                { text: '问她是不是专门来的', effect: 'ask', affection: 3 }
            ]}
        ],
        effects: function(npc, choice) { var aff = 0, msg = ''; switch(choice) {
            case 'join': aff = 5; msg = '「那株别碰，刚打苞。」她指挥着你浇水，嘴角一直弯着。'; break;
            case 'stool': aff = 6; msg = '她看着凳子愣了一下，然后坐下了。「……这花畦确实高，蹲久了腿麻。」——她之前可是站了一个时辰。'; break;
            case 'ask': aff = 3; msg = '「花需要人浇。」她说得理直气壮，「你练你的剑。」'; break; } return { affection: aff, msg: msg }; }
    },
    'bh_event_026': { id: 'bh_event_026', npcId: BAIHUA_NPC_ID, title: '借你医经', icon: '📖', desc: '她丢给你一本《百花医经》残卷。', minAffection: 33, trigger: { random: 0.3 }, cooldown: 0, flag: 'bh_e026_done', autoTrigger: { random: 0.3 },
        scenes: [
            { speaker: 'narrator', text: '她路过你的院子，随手丢给你一本书：「多余的。」', type: 'description' },
            { speaker: 'narrator', text: '你翻开一看——《百花医经》残卷。谷里藏经阁都没有的孤本。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '认真研读，做了笔记还给她', effect: 'study', affection: 6 },
                { text: '随手翻了翻', effect: 'skim', affection: 3 },
                { text: '转手借给了同门', effect: 'lend', affection: -2 }
            ]}
        ],
        effects: function(npc, choice) { var aff = 0, msg = ''; switch(choice) {
            case 'study': aff = 6; msg = '她还书时翻到你夹的笺条，一页一页看得很慢。「……有两处注错了。」她把书又塞回给你，「改完再还我。」'; break;
            case 'skim': aff = 3; msg = '「不喜欢？」她收回书，神色如常。——后来你再没见过那本书。'; break;
            case 'lend': aff = -2; msg = '书被弄脏了一角。她接回来时用袖子擦了擦，什么都没说。'; break; } return { affection: aff, msg: msg }; }
    },
    'bh_event_027': { id: 'bh_event_027', npcId: BAIHUA_NPC_ID, title: '谷口散步', icon: '🌾', desc: '你晚归时，她在谷口「恰好散步」。', minAffection: 35, trigger: { random: 0.3 }, cooldown: 0, flag: 'bh_e027_done', autoTrigger: { timeRange: [17, 23], random: 0.3 },
        scenes: [
            { speaker: 'narrator', text: '你外出办事归来天色已晚。谷口的花径上，一个淡青色的身影正在「散步」。', type: 'description' },
            { speaker: 'npc', text: '看到你，她「哦」了一声：「回来了。」转身在前带路，步子很慢。' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '跟上，讲路上的见闻', effect: 'talk', affection: 5 },
                { text: '默默跟着走', effect: 'silent', affection: 3 },
                { text: '说你不用等{playerTa}', effect: 'point', affection: 1 }
            ]}
        ],
        effects: function(npc, choice) { var aff = 0, msg = ''; switch(choice) {
            case 'talk': aff = 5; msg = '她听得认真，偶尔问一句。走到住处时她说：「下次早些回。」顿了顿，「晚饭会凉。」'; break;
            case 'silent': aff = 3; msg = '一路无话。但她的步子始终配合着你的速度。'; break;
            case 'point': aff = 1; msg = '「谁等你了。」她加快脚步走在前面，「我在看晚霞。」——那天阴天，没有晚霞。'; break; } return { affection: aff, msg: msg }; }
    },
    'bh_event_028': { id: 'bh_event_028', npcId: BAIHUA_NPC_ID, title: '送花糕', icon: '🧁', desc: '她端着一碟花糕到你的院子。', minAffection: 48, trigger: { random: 0.3 }, cooldown: 0, flag: 'bh_e028_done', autoTrigger: { timeRange: [14, 18], random: 0.3 },
        scenes: [
            { speaker: 'narrator', text: '午后，她端着一碟花糕出现在你的院子门口：「厨房多做。」', type: 'description' },
            { speaker: 'narrator', text: '碟子里只有四块——刚好两人份。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '请她坐下一起吃', effect: 'share', affection: 6 },
                { text: '塞一块到她嘴里', effect: 'feed', affection: 8 },
                { text: '道谢收下', effect: 'thanks', affection: 4 }
            ]}
        ],
        effects: function(npc, choice) { var aff = 0, msg = ''; switch(choice) {
            case 'share': aff = 6; msg = '她犹豫了一瞬，真的坐下了。两人就着一碟糕吃了一下午茶。临走她说：「……桂花味的，下回做给你。」'; break;
            case 'feed': aff = 8; msg = '她猝不及防咬了一口，瞪圆了眼睛瞪你。半晌，她鼓着腮帮子含糊道：「……甜的。」耳朵红透了。'; break;
            case 'thanks': aff = 4; msg = '「嗯。」她把碟子放下就走了。第二天你发现桌上多了一小罐蜂蜜——配糕吃的。'; break; } return { affection: aff, msg: msg }; }
    },
    'bh_event_029': { id: 'bh_event_029', npcId: BAIHUA_NPC_ID, title: '一碗梅子', icon: '🍋', desc: '你上周随口说过喜欢吃酸的。', minAffection: 40, trigger: { random: 0.3 }, cooldown: 0, flag: 'bh_e029_done', autoTrigger: { random: 0.3 },
        scenes: [
            { speaker: 'narrator', text: '你上周随口说过一句：喜欢吃酸的东西。', type: 'description' },
            { speaker: 'narrator', text: '今天你的碗里多了几颗醋渍梅子——开胃，生津，酸得恰到好处。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '吃光，一颗不剩', effect: 'eat', affection: 4 },
                { text: '抬头看她', effect: 'look', affection: 5 },
                { text: '没注意', effect: 'miss', affection: 0 }
            ]}
        ],
        effects: function(npc, choice) { var aff = 0, msg = ''; switch(choice) {
            case 'eat': aff = 4; msg = '第二天，碗里又有梅子。从此没断过。'; break;
            case 'look': aff = 5; msg = '她正假装专心吃饭，察觉你的目光，耳根慢慢红了：「……看什么，吃饭。」'; break;
            case 'miss': aff = 0; msg = '梅子有点酸。你没吃出来。'; break; } return { affection: aff, msg: msg }; }
    },
    'bh_event_030': { id: 'bh_event_030', npcId: BAIHUA_NPC_ID, title: '门边的药筐', icon: '🧺', desc: '门边放着一筐要晾晒的药材。', minAffection: 52, trigger: { random: 0.3 }, cooldown: 0, flag: 'bh_e030_done', autoTrigger: { location: '百花谷', random: 0.3 },
        scenes: [
            { speaker: 'narrator', text: '你出门时，发现门边放着一筐要送去晾晒的药材——而晾药架明明就在隔壁院子。', type: 'description' },
            { speaker: 'narrator', text: '廊子那头，她正站在花丛边「赏花」，眼神却时不时往这边飘。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '帮她把药筐抬去晾药架', effect: 'carry', affection: 5 },
                { text: '配合地喊：「谷主，这筐太重了！」', effect: 'callout', affection: 6 },
                { text: '直接无视，出门', effect: 'ignore', affection: 0 }
            ]}
        ],
        effects: function(npc, choice) { var aff = 0, msg = ''; switch(choice) {
            case 'carry': aff = 5; msg = '晾好药材回头，她已经不在廊子那头了。只有风把花香吹过来。'; break;
            case 'callout': aff = 6; msg = '她慢悠悠踱过来，拿起一束药看了看：「是不轻。」然后很自然地和你一人抬一边——那段路，你们走了平时三倍的时间。'; break;
            case 'ignore': aff = 0; msg = '傍晚回来，药筐还在。只是摆得更整齐了，像在等。'; break; } return { affection: aff, msg: msg }; }
    },
    'bh_event_031': { id: 'bh_event_031', npcId: BAIHUA_NPC_ID, title: '等灯匠', icon: '💬', desc: '你终于问了那个问题。', minAffection: 60, trigger: { random: 0.2 }, cooldown: 0, flag: 'bh_e031_done', autoTrigger: { random: 0.2 },
        scenes: [
            { speaker: 'narrator', text: '你终于问出了口：「你是不是在等我？」', type: 'description' },
            { speaker: 'narrator', text: '她沉默了整整三息，然后移开视线。', type: 'description' },
            { speaker: 'npc', text: '「……药庐的灯坏了。我在等灯匠。」' },
            { speaker: 'narrator', text: '灯匠当天下午就来了。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '顺着说：「那灯匠挺慢的。」', effect: 'slow', affection: 7 },
                { text: '笑而不语', effect: 'smile', affection: 5 },
                { text: '追问：「真的？」', effect: 'press', affection: 2 }
            ]}
        ],
        effects: function(npc, choice) { var aff = 0, msg = ''; switch(choice) {
            case 'slow': aff = 7; msg = '她绷着的肩膀松了下来，轻轻哼了一声：「……就是挺慢的。」两个人都笑了。'; break;
            case 'smile': aff = 5; msg = '你笑着没说话。她瞪了你一眼，先笑了。有些话不用戳破。'; break;
            case 'press': aff = 2; msg = '「灯匠的事有什么真假。」她板起脸走了——步子却很快，像逃。'; break; } return { affection: aff, msg: msg }; }
    },
    'bh_event_032': { id: 'bh_event_032', npcId: BAIHUA_NPC_ID, title: '递药时的指尖', icon: '🤝', desc: '递药瓶时，指尖相触。这一次她没有缩回去。', minAffection: 70, trigger: { random: 0.3 }, cooldown: 0, flag: 'bh_e032_done', autoTrigger: { random: 0.3 },
        scenes: [
            { speaker: 'narrator', text: '她递药瓶给你，指尖相触。', type: 'description' },
            { speaker: 'narrator', text: '这一次，她没有像往常一样很快缩回去。', type: 'description' },
            { speaker: 'narrator', text: '两个人都看着那只药瓶，谁都没说话。药庐里静得能听见烛芯燃烧的声音。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '轻轻握住她的手', effect: 'hold', affection: 8 },
                { text: '就让它停在那里', effect: 'stay', affection: 6 },
                { text: '先缩回来', effect: 'retreat', affection: 1 }
            ]}
        ],
        effects: function(npc, choice) { var aff = 0, msg = ''; switch(choice) {
            case 'hold': aff = 8; msg = '她的手在你掌心里僵了一瞬，然后慢慢翻转过来，与你十指相扣。她依旧看着那只药瓶，声音很轻：「……药，还没吃。」'; break;
            case 'stay': aff = 6; msg = '指尖相贴了很久。最后是她先开口：「好了。」她抽回手，把药瓶塞进你掌心握紧，「按时吃。」——掌心残留的温度很久没有散。'; break;
            case 'retreat': aff = 1; msg = '你先缩回了手。她垂下眼，若无其事地把药瓶放在桌上：「那我先忙了。」'; break; } return { affection: aff, msg: msg }; }
    }
};

// ---- 合并注册到总事件池 ----
if (typeof NPC_PERSONAL_EVENTS !== 'undefined') {
    Object.assign(NPC_PERSONAL_EVENTS, BAIHUA_DAILY_EVENTS);
    Object.assign(NPC_PERSONAL_EVENTS, BAIHUA_APPROACH_EVENTS);
}

if (typeof window !== 'undefined') {
    window.BAIHUA_DAILY_EVENTS = BAIHUA_DAILY_EVENTS;
    window.BAIHUA_APPROACH_EVENTS = BAIHUA_APPROACH_EVENTS;
}
console.log('[温蘅线] 日常/接近事件已加载：' + Object.keys(BAIHUA_DAILY_EVENTS).length + '+' + Object.keys(BAIHUA_APPROACH_EVENTS).length + ' 个');
