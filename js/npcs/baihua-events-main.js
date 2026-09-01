// ==================== baihua-events-main.js - 温蘅主线情缘事件（bh_event_001~014） ====================
// 依赖：npcs/npc-personal-events.js
// 加载顺序：在 npc-personal-events.js 之后、baihua-personal-events.js 之前
// 说明：事件结构同绯泪线；autoTrigger 字段为 v12.3 新增（自动弹出触发配置）

var BAIHUA_NPC_ID = 'sect_leader_百花谷';

// ---- 主线事件 第一批（001~004） ----
var BAIHUA_MAIN_EVENTS_A = {
    'bh_event_001': {
        id: 'bh_event_001', npcId: BAIHUA_NPC_ID, title: '药很苦', icon: '🌿',
        desc: '你修炼岔气被抬进药庐，谷主亲自为你诊治。',
        minAffection: 20, trigger: { random: 0.4 }, cooldown: 0, flag: 'bh_e001_done',
        autoTrigger: { random: 0.45 },
        scenes: [
            { speaker: 'narrator', text: '你修炼时岔了气，被师姐们抬进了药庐。', type: 'description' },
            { speaker: 'narrator', text: '温蘅坐在榻边为你诊脉，指尖很凉，动作却很稳。', type: 'description' },
            { speaker: 'npc', text: '「不碍事，气冲了膻中，歇两天就好。」她递来一碗药，「喝了它。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '捏着鼻子一口气喝完', effect: 'drink', affection: 4 },
                { text: '皱眉：「能加勺蜜吗？」', effect: 'honey', affection: 5 },
                { text: '放着不喝，趁她转身倒掉', effect: 'dump', affection: -2 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'drink': aff = 4; msg = '她收走空碗，弯了弯眼睛：「痛快。」出门前补了一句，「明天还有一碗。」'; break;
                case 'honey': aff = 5; msg = '「不能。」她看着你，笑意不变，「苦味入心，去火。你要是嫌苦，下次就别逞强。」你只好喝了。「这不就喝完了。」她替你把碗收走，出门时脚步很轻。'; break;
                case 'dump': aff = -2; msg = '她没回头：「倒了也没用，苦的是你自己。」第二天，你的药变成了双倍。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'bh_event_002': {
        id: 'bh_event_002', npcId: BAIHUA_NPC_ID, title: '花圃的规矩', icon: '🌺',
        desc: '你误入了核心花圃。',
        minAffection: 25, trigger: { random: 0.4 }, cooldown: 0, flag: 'bh_e002_done',
        autoTrigger: { location: '百花谷', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '你抄近路回住处，没注意脚下的木牌——「核心花圃，外人止步」。', type: 'description' },
            { speaker: 'narrator', text: '你踩进花圃才发现满地都是不认识的花草。正想退出去，身后传来一个声音。', type: 'description' },
            { speaker: 'npc', text: '「别动。」她快步过来，蹲下身查看你脚边的植株，松了口气，「还好，没踩断。」' },
            { speaker: 'npc', text: '她抬头看你，笑眼弯弯：「你知道这是什么地方吗？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「不知道，我错了。」', effect: 'admit', affection: 3 },
                { text: '「是核心花圃……牌子上写的。」', effect: 'sign', affection: 4 },
                { text: '「我在看这株开紫花的——它叫什么？」', effect: 'flower', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'admit': aff = 3; msg = '「知道错就好。」她拍拍你的腿让你退出去，「下不为例。」——后来你路过花圃都绕着走。'; break;
                case 'sign': aff = 4; msg = '她笑了：「看得见牌子，看不见路？你这眼睛啊。」——她没再说什么，但你总觉得她记得这件事。'; break;
                case 'flower': aff = 6; msg = '她愣了一下，随即认真起来：「紫参。开花要七年。你运气好，再早来一个月它还没打苞。」她起身让你出去，临走补了一句：「想看花，走正门来问我。翻墙的不算。」——第二天，正门的木牌旁多了一块小牌子：「看花找温蘅。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'bh_event_003': {
        id: 'bh_event_003', npcId: BAIHUA_NPC_ID, title: '试毒的人', icon: '⚗️',
        desc: '新药需要有人试毒，她找上了你。',
        minAffection: 30, trigger: { random: 0.4 }, cooldown: 0, flag: 'bh_e003_done',
        autoTrigger: { location: '百花谷', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '药庐里药香浓得化不开。温蘅在配一种新药，需要有人试药。', type: 'description' },
            { speaker: 'npc', text: '「这药能解南疆的噬心蛊，但药性烈，第一次喝的人会头晕呕吐。」她把瓷瓶放在桌上，「我需要一个信得过的人帮我试。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「为什么找我？」', effect: 'why', affection: 5 },
                { text: '直接拿起来喝', effect: 'drink', affection: 7 },
                { text: '「能不能找别人？」', effect: 'others', affection: -1 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'why': aff = 5; msg = '她想了想：「因为你上次喝那么苦的药，都没骗我说不苦。」——你还是喝了。这次吐得没那么厉害。'; break;
                case 'drink': aff = 7; msg = '你吐得昏天黑地，她一直扶着你，手很稳。「好了，吐出来就好了。」她的声音听不出情绪，但你吐完抬头时，看见她在发呆。「……怎么了？」「没什么。」她移开视线，「药性记录一下：半刻发作，呕两次。」——从那以后，谷里的新药试毒名单上总有你的名字。'; break;
                case 'others': aff = -1; msg = '「可以。」她收起瓷瓶，笑容如常。——后来你听说，那药最后是她自己试的，昏了一整天。你去看她，她笑着说「没事」。你没信。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'bh_event_004': {
        id: 'bh_event_004', npcId: BAIHUA_NPC_ID, title: '夜诊', icon: '🌙',
        desc: '三更天，山下有人求医。',
        minAffection: 35, trigger: { random: 0.4 }, cooldown: 0, flag: 'bh_e004_done',
        autoTrigger: { timeRange: [21, 5], location: '百花谷', random: 0.5 },
        scenes: [
            { speaker: 'narrator', text: '三更天，有人砸响了谷门——山下村子的孩子高热惊厥。', type: 'description' },
            { speaker: 'narrator', text: '温蘅披衣起身，药箱一提就走。你看她一个人，跟了上去。', type: 'description' },
            { speaker: 'narrator', text: '山路夜露重。她走在前面，步子又快又稳，全然没有白日里慢悠悠的样子。', type: 'description' },
            { speaker: 'narrator', text: '孩子救回来了。农家人穷，只有一篮鸡蛋。她收了三个，剩下的硬塞了回去。', type: 'description' },
            { speaker: 'narrator', text: '回程路上，她走在你旁边，忽然开口。', type: 'description' },
            { speaker: 'npc', text: '「白天在谷里，我是谷主。晚上下山，我就是个大夫。」她看着前面的路，「大夫不需要笑，也不需要客气。你刚才看到的那个，才是我。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「我觉得两个都是你。」', effect: 'both', affection: 6 },
                { text: '「哪个更累？」', effect: 'tired', affection: 8 },
                { text: '默默走着，把手里的灯笼举高一点照路', effect: 'lantern', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'both': aff = 6; msg = '她侧头看了你一眼，月光下看不清表情。「……嘴倒是甜。」但她嘴角是弯的。——回到谷口她停下：「鸡蛋分你两个。」她只收了三个。'; break;
                case 'tired': aff = 8; msg = '她沉默了很久。「你第一个问这个。」——那天之后，她偶尔会在你面前露出一点疲惫。不多，但有。'; break;
                case 'lantern': aff = 5; msg = '她放慢了半步，和你并肩走完剩下的路。——灯笼的光很弱，但一路没灭。'; break;
            }
            return { affection: aff, msg: msg };
        }
    }
};

// ---- 主线事件 第二批（005~009） ----
var BAIHUA_MAIN_EVENTS_B = {
    'bh_event_005': {
        id: 'bh_event_005', npcId: BAIHUA_NPC_ID, title: '她的手', icon: '🤲',
        desc: '你握到了她的手。',
        minAffection: 40, trigger: { random: 0.4 }, cooldown: 0, flag: 'bh_e005_done',
        autoTrigger: { location: '百花谷', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '她递药给你时，你握到了她的手——掌心有茧，指腹全是细小的疤，深深浅浅。', type: 'description' },
            { speaker: 'narrator', text: '她察觉到你的目光，把手收了回去。', type: 'description' },
            { speaker: 'npc', text: '「制药的人都会这样。切药、碾药、试毒。」她说得很平常，「不好看吧。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「好看。这是一双救过很多人的手。」', effect: 'beautiful', affection: 7 },
                { text: '「疼吗？」', effect: 'pain', affection: 8 },
                { text: '移开目光当作没看见', effect: 'avoid', affection: -1 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'beautiful': aff = 7; msg = '她怔了一下，然后笑了，这次的笑有点不一样。「……油嘴滑舌。」但耳根有点红。——后来她递东西给你，不再刻意避开你的视线。'; break;
                case 'pain': aff = 8; msg = '她愣住了。「这么多年了，早就……」她顿住，重新看了看自己的手，「你还真是我见过第一个问这个的。」「不疼。」她又强调了一遍。——你决定以后帮她做那些粗活。'; break;
                case 'avoid': aff = -1; msg = '她若无其事地继续包药。那天她的话比平时少。——她把手拢进了袖子里。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'bh_event_006': {
        id: 'bh_event_006', npcId: BAIHUA_NPC_ID, title: '迷幻术', icon: '🌫️',
        desc: '有人闯谷寻仇，她当你的面用了迷幻术。',
        minAffection: 45, trigger: { random: 0.4 }, cooldown: 0, flag: 'bh_e006_done',
        autoTrigger: { location: '百花谷', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '一个黑衣修士闯进谷来，扬言谷主三年前治死了他弟弟，要讨个公道。', type: 'description' },
            { speaker: 'narrator', text: '弟子们拔剑围上去，温蘅抬手拦下，独自走上前，还是那副笑眼弯弯的样子。', type: 'description' },
            { speaker: 'npc', text: '「你弟弟的脉案我还留着，要不要一起看看？」' },
            { speaker: 'narrator', text: '那人暴起出手。你根本没看清她怎么动的——袖中花粉一扬，那人僵在原地，眼神涣散。', type: 'description' },
            { speaker: 'narrator', text: '她俯下身，声音很轻。', type: 'description' },
            { speaker: 'npc', text: '「你弟弟是中了噬心蛊才死的。我没能救回来，我很抱歉。但你要是再来寻仇——」她直起身，笑容不变，「百花谷的迷幻术，能让他在幻境里磕一辈子头。念在他姐姐来求过情，这次算了。送客。」' },
            { speaker: 'narrator', text: '人被架走了。她转过身看到你，笑容一如往常。', type: 'description' },
            { speaker: 'npc', text: '「吓到了？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「没有。你做得对。」', effect: 'right', affection: 6 },
                { text: '「三年前到底怎么回事？」', effect: 'what', affection: 7 },
                { text: '「你刚才那样，不像平时的你。」', effect: 'different', affection: 4 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'right': aff = 6; msg = '「嗯。」她点点头，忽然低声道，「可他走出这道山门，就会忘了我的抱歉，只记得恨。医术救不了人心——这就是我学迷幻术的原因，至少能让他们冷静下来听完一句话。」——那天傍晚，你在药庐外看到她独自坐了很久。'; break;
                case 'what': aff = 7; msg = '她看了你一会儿：「你真想知道？」……「是真的。我没救回来。寻仇的人没错，错的只是病。」她声音很平，「所以我不辩解。辩解没用，把人打发走就行。」——「错的只是病」，这句话你记了很久。'; break;
                case 'different': aff = 4; msg = '她歪了歪头：「平时才是我吗？」她拍拍你的肩走了，留下你站在原地想了很久。——你开始分不清哪张笑脸才是她。也许都是，也许都不是。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'bh_event_007': {
        id: 'bh_event_007', npcId: BAIHUA_NPC_ID, title: '恩将仇报', icon: '💔',
        desc: '你发现了她救过的人回头害她。',
        minAffection: 50, trigger: { random: 1.0 }, cooldown: 0, flag: 'bh_e007_done',
        unlockSecret: 'bh_secret_01',
        scenes: [
            { speaker: 'narrator', text: '你在整理药庐时无意翻到一本旧册子，里面夹着一封撕碎的信。', type: 'description' },
            { speaker: 'narrator', text: '你拼起来看——是三年前一个被她救活的商人写的。信里咒她「假仁假义」，只因他破产后再登门，她按规矩收了诊金。', type: 'description' },
            { speaker: 'narrator', text: '你还没看完，身后传来声音。', type: 'description' },
            { speaker: 'npc', text: '「翻别人的东西，可不是好习惯。」她语气还是软软的，但你后颈发凉。' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '把信递给她，道歉', effect: 'return', affection: 6 },
                { text: '「他为什么骂你？你救了他的命。」', effect: 'why', affection: 7 },
                { text: '「对不起，我不该看。」低头要走', effect: 'leave', affection: 8 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'return': aff = 6; msg = '她接过信扫了一眼，随手放进烛火里。「烧了干净。」她看着火苗，「你不是第一个偷看我东西的人，但你是第一个把信递回来的。」'; break;
                case 'why': aff = 7; msg = '她笑了：「救命的恩，抵不过三钱银子的怨。这种事，我见得比你吃过的饭还多。」她说得轻描淡写，指尖却在无意识地摩挲袖口。'; break;
                case 'leave': aff = 8; msg = '「站住。」她叫住你，犹豫了一下，「……坐下。我给你讲个故事。」'; break;
            }
            return { affection: aff, msg: msg };
        },
        afterScenes: [
            { speaker: 'narrator', text: '她给自己倒了杯茶。', type: 'description' },
            { speaker: 'npc', text: '「我小时候不是这样的。师父说我年轻时脾气冷厉，说话带刺，病人被我吓跑过好几个。」' },
            { speaker: 'npc', text: '「我十九岁那年，师父快不行了。他把我的手放在一个垂死的孩子身上，说：『阿蘅，医者手里握着人命，不能带情绪。你恨谁、怨谁、怕谁，都不能带到这张脸上来。』」' },
            { speaker: 'npc', text: '「他咽气前最后一句话是：『笑一个给我看看。』」' },
            { speaker: 'narrator', text: '她端着茶杯，笑眼弯弯，像在讲别人的故事。', type: 'description' },
            { speaker: 'npc', text: '「我就笑了。笑着送他走的。」' }
        ],
        afterMsg: '从那天起你就明白了：她的温柔不是天性，是修行。或者说，是戒律。'
    },
    'bh_event_008': {
        id: 'bh_event_008', npcId: BAIHUA_NPC_ID, title: '医者病了', icon: '🤒',
        desc: '她自己病倒了，却不肯休息。',
        minAffection: 55, trigger: { random: 0.4 }, cooldown: 0, flag: 'bh_e008_done',
        autoTrigger: { location: '百花谷', random: 0.45 },
        scenes: [
            { speaker: 'narrator', text: '连日制药，温蘅病倒了。你去看她，她裹着被子坐在床上，还在批药方。', type: 'description' },
            { speaker: 'npc', text: '「这点小病，睡一觉就……咳咳……就好了。」她咳嗽着，还想摆手赶你走，「药庐离不开人。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '直接把药方抽走', effect: 'take', affection: 7 },
                { text: '煮了一碗姜粥端给她', effect: 'porridge', affection: 9 },
                { text: '听她的话退出去了，但守在门外', effect: 'wait', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'take': aff = 7; msg = '「喂——」「今天药庐关门。」你把纸压在茶壶底下，「弟子们说，他们已经三天没见你正经吃过饭了。」她瞪着你，瞪着瞪着自己先笑了：「……你这徒弟，胆子越来越大了。」——她睡了入冬以来最沉的一觉。'; break;
                case 'porridge': aff = 9; msg = '她看着粥，很久没动。「……我只是想起来，上一次有人给我煮粥，还是我师父病的时候。」她慢慢喝完了整碗。碗底朝天。她把碗还你时说了声「多谢」——不是谷主对弟子的那种。'; break;
                case 'wait': aff = 6; msg = '半个时辰后她开门，看到你靠在门框上打盹。「……进来吧。」她侧身让你，「固执。」——第二天你着了凉，换她守着你。你们俩就这样扯平了。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'bh_event_009': {
        id: 'bh_event_009', npcId: BAIHUA_NPC_ID, title: '花语', icon: '🌷',
        desc: '她教你花语。',
        minAffection: 60, trigger: { random: 0.4 }, cooldown: 0, flag: 'bh_e009_done',
        autoTrigger: { location: '百花谷', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '她带你在花圃除草，随手指点各种花草。', type: 'description' },
            { speaker: 'npc', text: '「芍药说要走了；紫藤说欢迎回家；茉莉说『你是我的』——所以谷里不给未婚弟子戴茉莉。」她一本正经地科普，你分不清真假。' },
            { speaker: 'narrator', text: '忽然，她掐掉一枝枯枝。', type: 'description' },
            { speaker: 'npc', text: '「你知道吗，每朵花都有想说没说的话。人也一样。」她拍掉手上的土，「区别是花藏不住，人藏得住。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「那你现在这朵，是什么花？」', effect: 'you', affection: 8 },
                { text: '「人在藏什么？」', effect: 'hide', affection: 7 },
                { text: '认真记笔记', effect: 'note', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'you': aff = 8; msg = '她手里的动作停了停。「……向日葵吧。」她难得没有立刻接话，「永远朝着光，永远不用别人看清它的脸。」——后来你每次看到向日葵都会想起她。有一次你说漏了嘴，她红着脸把你轰出了花圃。'; break;
                case 'hide': aff = 7; msg = '「藏『算了』。」她说，「想说的话到了嘴边，想想，算了。藏多了，人就成花圃了——看着茂盛，其实每一株都挤得喘不过气。」——你想帮她松松土。哪怕一株也好。'; break;
                case 'note': aff = 5; msg = '她看你记得认真，忍俊不禁：「傻徒弟，花语哪有标准答案。我说是什么，就是什么。」但她还是放慢了语速，把每种花都讲了一遍。——那本笔记你留了很多年。'; break;
            }
            return { affection: aff, msg: msg };
        }
    }
};

// ---- 主线事件 第三批（010~014） ----
var BAIHUA_MAIN_EVENTS_C = {
    'bh_event_010': {
        id: 'bh_event_010', npcId: BAIHUA_NPC_ID, title: '面具', icon: '🎭',
        desc: '你问出了那个所有人都想问的问题。',
        minAffection: 65, trigger: { random: 1.0 }, cooldown: 0, flag: 'bh_e010_done',
        scenes: [
            { speaker: 'narrator', text: '黄昏，药庐。她在核对账目，你帮她研墨。屋里很静。', type: 'description' },
            { speaker: 'narrator', text: '你终于问出了那个问题：「谷主，你对每个人，都是这样笑的吗？」', type: 'description' },
            { speaker: 'narrator', text: '笔尖顿住了。一滴墨在纸上晕开。', type: 'description' },
            { speaker: 'npc', text: '她没有抬头：「你觉得呢？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「对弟子是礼，对外人是墙。对我……我不知道。」', effect: 'dontknow', affection: 9 },
                { text: '「是。」', effect: 'yes', affection: 0 },
                { text: '后悔了，改口说随便问问', effect: 'casual', affection: -2 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '', secretId = null;
            switch (choice) {
                case 'dontknow':
                    aff = 9;
                    msg = '她放下笔，抬起头认真地看了你很久。「这个问题，牡丹憋了十年没敢问。」她忽然笑了，这次的笑意到了眼底，「答案是对的。至于对你——」她没说完，低头继续记账，「往后你就知道了。」';
                    secretId = 'bh_secret_02';
                    break;
                case 'yes':
                    aff = 0;
                    msg = '「嗯。」她应了一声，屋子里安静得可怕。过了很久她才开口：「知道就好。还问什么。」语气听不出喜怒。';
                    secretId = 'bh_secret_02';
                    break;
                case 'casual':
                    aff = -2;
                    msg = '「嗯，随便问问。」她重复了一遍你的话，笔尖继续走。那天之后她对你客气如初，但你总觉得有什么东西被关在了门外。';
                    break;
            }
            return { affection: aff, msg: msg, secretId: secretId };
        },
        afterScenes: [
            { speaker: 'npc', text: '她像是自言自语：「白鹿泽这地方，三面环水，一面通官道。百花谷有多少家底，方圆千里的修士都数得清。」她合上账本，「一个小门派，一群女修，守着一屋子救命的药——你说，我们靠什么活到今天？」' },
            { speaker: 'narrator', text: '你想到了迷幻术，说出了口。', type: 'description' },
            { speaker: 'npc', text: '「迷幻术只能唬人。」她伸出一根手指，指腹上一道深色的旧疤，「是毒。十六年前黑风寨来『借粮』，我往他们首领的酒里下了一味『七日醉』——不死，就是躺七天。第七天他醒来，带着人走了，从此黑风寨绕着白鹿泽走。」' },
            { speaker: 'npc', text: '「医术是我的善，毒是我的刀。两样都得有，缺一样，百花谷早就没了。」她看着你，笑眼弯弯，「现在你知道谷主的『温柔』值多少钱了吧？」' }
        ],
        afterMsg: '你意识到，她递给你的每一杯茶都可以是药，也可以是别的什么。但她从来没有。'
    },
    'bh_event_011': {
        id: 'bh_event_011', npcId: BAIHUA_NPC_ID, title: '牡丹的酒', icon: '🍶',
        desc: '牡丹长老把你拖到了后山。',
        minAffection: 70, trigger: { random: 0.4 }, cooldown: 0, flag: 'bh_e011_done',
        autoTrigger: { location: '百花谷', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '长老牡丹拎着一坛酒来找你，不由分说把你拖到了后山。', type: 'description' },
            { speaker: 'npc', text: '「喝。」她给你倒了一碗，「我问你，你对谷主，是怎么想的？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '如实回答', effect: 'honest', affection: 6 },
                { text: '「长老为何这么问？」', effect: 'why', affection: 7 },
                { text: '打哈哈敷衍', effect: 'dodge', affection: -3 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'honest': aff = 6; msg = '牡丹盯着你看了半天，忽然泄了气似的灌了口酒：「……行，是个实诚人。」'; break;
                case 'why': aff = 7; msg = '「她救我那年我八岁，全家死于兵灾。她把我背回谷里，教我认字、习武、制毒。」牡丹看着酒碗，「二十年，我从没见她对谁特别过——直到你来了。」'; break;
                case 'dodge': aff = -3; msg = '牡丹冷笑一声，起身就走：「连自己心思都不敢认的人，也配？」'; break;
            }
            return { affection: aff, msg: msg };
        },
        afterScenes: [
            { speaker: 'narrator', text: '临走前，牡丹回过头。', type: 'description' },
            { speaker: 'npc', text: '「我只提醒你一句。她那个人，谁都暖不了。二十年了，多少人敬她、慕她、求她，她都对人家笑——笑完呢？笑完谁也没走进去过。」她把酒坛塞给你，「你要是只想玩玩，趁早收手。你要是认真的……那就别让她再一个人守着那间药庐了。」' }
        ],
        afterMsg: '那晚的酒很烈。你抱着酒坛在后山坐到月落。'
    },
    'bh_event_012': {
        id: 'bh_event_012', npcId: BAIHUA_NPC_ID, title: '质问', icon: '⚔️',
        desc: '牡丹当面质问了谷主。',
        minAffection: 75, trigger: { random: 0.4 }, cooldown: 0, flag: 'bh_e012_done',
        autoTrigger: { location: '百花谷', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '议事厅外，你抱着药材正要进去，听到里面牡丹的声音。', type: 'description' },
            { speaker: 'npc', text: '「新药的试毒名单、花圃的正门木牌、连昨天的晚膳都是你亲自端的——谷主，你自己数数，这些待遇谷里谁能比？」' },
            { speaker: 'npc', text: '「牡丹，他是弟子——」那是温蘅的声音。' },
            { speaker: 'npc', text: '「弟子？那你怎么不给我端饭？」' },
            { speaker: 'narrator', text: '你站在门口，进也不是退也不是。厅内安静了几息。', type: 'description' },
            { speaker: 'npc', text: '温蘅的声音很轻，但没有笑意：「……你说得对。是我失了分寸。」' },
            { speaker: 'narrator', text: '这是你第一次听到她用没有笑意的声音说话。你推门进去，把药材放下，当着牡丹的面说——', type: 'description' },
            { speaker: 'player_select', text: '你说什么？', options: [
                { text: '「谷主没有失分寸。是我僭越了，该罚罚我。」', effect: 'stand', affection: 8 },
                { text: '「长老说得对，是我逾矩了。但从今日起我会摆正位置——以弟子的身份。」', effect: 'position', affection: 6 },
                { text: '「长老，你喜欢谷主二十年都没敢说，就别拿规矩压我了。」', effect: 'truth', affection: -4 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'stand': aff = 8; msg = '牡丹怒极反笑：「好啊，一个敢当，一个敢受！」温蘅猛地抬头看你。——那天晚上，温蘅让人给你送来一碟桂花糕。没有署名。'; break;
                case 'position': aff = 6; msg = '温蘅捏着茶盏的手紧了紧，什么都没说。牡丹看看你又看看她，忽然叹了口气：「你们啊。」摔门走了。——「摆正位置」四个字，你说得平静，她听得失神。'; break;
                case 'truth': aff = -4; msg = '牡丹拔剑，温蘅厉声喝止：「牡丹！」场面一度非常难看。温蘅最后只说了一句：「都出去。」——但牡丹此后反而服气了。只是某天你发现枕头底下多了一包解毒散，牡丹的独门配方。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'bh_event_013': {
        id: 'bh_event_013', npcId: BAIHUA_NPC_ID, title: '看穿我', icon: '👁️',
        desc: '深夜药庐，她想请你帮个忙。',
        minAffection: 80, trigger: { random: 1.0 }, cooldown: 0, flag: 'bh_e013_done',
        unlockSecret: 'bh_secret_03',
        scenes: [
            { speaker: 'narrator', text: '深夜，药庐的灯还亮着。她叫你来，桌上摆着一壶茶、两只杯。', type: 'description' },
            { speaker: 'npc', text: '「牡丹的事，谢谢你。」她给你倒了杯茶。' },
            { speaker: 'npc', text: '「这些天我一直在想一件事。」她捧着茶杯，「我看人很准。三句话就能知道对方想要什么、怕什么、瞒着什么。师父说这是天赋，牡丹说这是毛病。」' },
            { speaker: 'npc', text: '「可是{playerName}，从来没有人试着看穿过我。」她抬起眼，「他们要么信了我的笑，要么怕我的毒。没有人问过我那句——你问了。」' },
            { speaker: 'npc', text: '她把茶杯转了半圈，「所以今晚我想请你帮个忙。看看我，像我看别人那样，告诉我你看到了什么。说错了也不要紧。」' },
            { speaker: 'player_select', text: '你看到了什么？', options: [
                { text: '「我看到一个撑了二十年的人。撑得太久了，久到忘了可以不撑。」', effect: 'hold', affection: 12 },
                { text: '「我看到一个很好看的谎。谎话说久了，连自己都快信了——但你没信，不然今晚不会叫我过来。」', effect: 'lie', affection: 11 },
                { text: '「我看到温蘅。」（只叫名字，什么都不说）', effect: 'name', affection: 10 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'hold': aff = 12; msg = '她的睫毛颤了一下。茶杯里的水面晃出细纹。「……第一句就说错了。」她低下头，声音闷闷的，「不是忘了。是不敢。」'; break;
                case 'lie': aff = 11; msg = '她久久没有说话。烛花爆了一声。然后你听见一声极轻的、几乎听不见的：「……好准。」'; break;
                case 'name': aff = 10; msg = '她怔住了。「……谷里多久没人叫过我这个字了。牡丹都只叫我谷主。」她低头喝茶，喝得很慢，「就凭这两个字，今晚这壶茶，值了。」'; break;
            }
            return { affection: aff, msg: msg };
        },
        afterScenes: [
            { speaker: 'narrator', text: '那一晚你们聊到天亮。聊了什么你后来记不太清了，只记得她笑了很多次——不是那种标准的、谷主式的微笑，是会露出牙齿、会被茶水呛到的笑。', type: 'description' },
            { speaker: 'narrator', text: '天亮时，她站在门口，晨光照在她脸上。', type: 'description' },
            { speaker: 'npc', text: '「{playerName}。」她背对着你，「秘密要藏一辈子才叫秘密。我这三条，如今都在你这儿了。」' }
        ]
    },
    'bh_event_014': {
        id: 'bh_event_014', npcId: BAIHUA_NPC_ID, title: '终章·花开', icon: '💍',
        desc: '百花圃中，她递给你一朵亲手种的花。',
        minAffection: 85, trigger: { random: 1.0 }, cooldown: 0, flag: 'bh_e014_done',
        endingMap: { '并肩': 'bh_ending_并肩', '归谷': 'bh_ending_归谷', '知己': 'bh_ending_知己', '药庐': 'bh_ending_药庐', '面具': 'bh_ending_面具', '花冢': 'bh_ending_花冢' },
        scenes: [
            { speaker: 'narrator', text: '暮春，百花圃。所有花都开了。她站在花圃中央等你，手里捧着一个陶盆——盆里是一株你叫不出名字的花，花瓣边缘泛着极淡的金色。', type: 'description' },
            { speaker: 'npc', text: '「认不出来吧？正常，这是我杂交出来的新品种，全世界只有这一株。」她把陶盆递到你面前，「养了九年，今年第一次开。」' },
            { speaker: 'npc', text: '「我一直没给它起名字。想着等它开了，看它像谁，就用谁的名字。」她抬起眼，琥珀色的眼睛里映着满圃的花，「现在我看着它——觉得它像你。」' },
            { speaker: 'npc', text: '「所以，{playerName}。」她把陶盆轻轻放进你手里，指尖收回去之前在你掌心停了一瞬，「这株花，连同种花的人，你要不要？」' },
            { speaker: 'player_select', text: '你的选择将决定你们的关系走向', options: [
                { text: '「要。我要带着它走遍天下——边走边医，哪里有病人就去哪里。」', effect: 'lover_travel', affection: 30 },
                { text: '「要。但我哪儿也不去。我把它摆在药庐窗台上，陪你晒每一年的太阳。」', effect: 'lover_stay', affection: 28 },
                { text: '「花我收下。人就算了——我做你采药行医的搭档，天下无双的那种。」', effect: 'friend_travel', affection: 20 },
                { text: '「花我收下。药庐的茶我也想一直喝下去——做个常客，行吗？」', effect: 'friend_stay', affection: 18 },
                { text: '「我都不要。我只是个过路人。」', effect: 'none', affection: 0 }
            ]}
        ],
        effects: function(npc, choice) {
            // 花冢兜底：累计负面选择≥5时，恋人选项转为辜负结局
            var negCount = (window._negativeChoiceCount && window._negativeChoiceCount[BAIHUA_NPC_ID]) || 0;
            if (negCount >= 5 && (choice === 'lover_travel' || choice === 'lover_stay')) {
                return { affection: 0, msg: '她看着你，忽然轻轻叹了口气：「……原来我这些年，看人也有走眼的时候。」她把陶盆收了回去，笑容依旧，眼底却什么都没有了。', ending: '花冢' };
            }
            switch (choice) {
                case 'lover_travel': return { affection: 30, msg: '她笑出了声，眼泪跟着掉下来：「好——好啊。收拾行李，明天就出发！……先让我把药庐交代一下。」', ending: '并肩' };
                case 'lover_stay': return { affection: 28, msg: '她怔了很久，然后极轻地点头，声音哑哑的：「……好。窗台朝东，早上晒得到。」', ending: '归谷' };
                case 'friend_travel': return { affection: 20, msg: '她眨眨眼把泪憋回去，伸手锤了你肩膀一下：「行，搭档。工钱面议。」', ending: '知己' };
                case 'friend_stay': return { affection: 18, msg: '「常客？」她哼了一声，别过脸去，「……茶钱记你账上。」她的耳朵红了。', ending: '药庐' };
                case 'none': return { affection: 0, msg: '她愣了一下，随即笑了——标准的、谷主式的、无懈可击的微笑。「也好。」她把陶盆抱回怀里，「茶以后就不给你留了。」', ending: '面具' };
            }
            return { affection: 0, msg: '' };
        }
    }
};

// ---- 合并主线事件 ----
var BAIHUA_MAIN_EVENTS = {};
Object.assign(BAIHUA_MAIN_EVENTS, BAIHUA_MAIN_EVENTS_A);
Object.assign(BAIHUA_MAIN_EVENTS, BAIHUA_MAIN_EVENTS_B);
Object.assign(BAIHUA_MAIN_EVENTS, BAIHUA_MAIN_EVENTS_C);

// v12.3 修复：主线事件必须合并进总事件池，否则个人事件面板与自动触发均不可见
if (typeof NPC_PERSONAL_EVENTS !== 'undefined') {
    Object.assign(NPC_PERSONAL_EVENTS, BAIHUA_MAIN_EVENTS);
}

if (typeof window !== 'undefined') {
    window.BAIHUA_MAIN_EVENTS = BAIHUA_MAIN_EVENTS;
}
console.log('[温蘅线] 主线事件已加载并注册：' + Object.keys(BAIHUA_MAIN_EVENTS).length + ' 个');
