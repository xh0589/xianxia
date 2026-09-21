// ==================== emei-events.js - 夙孤鸿线情缘事件/结局/性别语境 v1.0（v20.72 第三批扩线） ====================
// 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / registerEndingSet / registerEndingCallback /
//       hasEventTriggered / checkEventTrigger / triggerPersonalEvent / canPlayerAccessPersonalEvent）
//       npcs/npc-system.js（executeEmotionInteraction 已加 bond_dao 拦截）
// 加载顺序：在 npc-personal-events.js 之后
// 女主·夙孤鸿（峨眉派戒律首座，代掌门务。端庄持戒、刀子嘴，端的是规矩，软的是心肠）。
// 与灭绝师太（掌门，后山闭关中）并存：师太是掌门，孤鸿是亡师寂度座下首徒、现任戒律首座。
// 男女玩家皆可追，主线共享（代词按性别），各有专属性别语境事件（femctx/mctx）。
// 注：本线已入 HEROINE_ROSTER（v20.73：吃醋对峙/和好见 heroine-rivalry.js em_event_rival/reconcile，
//     论交/回访/试探/敲打/余波/小心眼/被晾全套已接线）。

var EM_NPC_ID = 'sect_leader_峨眉派';

// ============ 主线事件（em_event_001 ~ 011 + 终章 013） ============
var EM_MAIN_EVENTS = {
    'em_event_001': {
        id: 'em_event_001', npcId: EM_NPC_ID, title: '戒堂', icon: '📏',
        desc: '你夜闯戒堂，被她当场拿住。',
        minAffection: 12, trigger: { random: 0.4 }, cooldown: 0, flag: 'em_e001_done',
        autoTrigger: { location: '峨眉派', random: 0.45 },
        scenes: [
            { speaker: 'narrator', text: '夜里你抄近路误闯戒堂，堂内一盏孤灯。灯下坐着个缟素劲装的女子，正一笔一笔抄戒条——头也不抬。', type: 'description' },
            { speaker: 'npc', text: '「峨眉戒律第九条，夜行不走正道。」她的声音又清又冷，像戒尺敲在案上，「站好。背一遍条九，背不出不许走。」' },
            { speaker: 'narrator', text: '你这才看清她：眉目端严，腰间一柄木戒尺，磨得发亮。剑穗是褪了色的旧红。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '老老实实背戒条', effect: 'obey', affection: 5 },
                { text: '「背条九可以——你先把灯挑亮些，我看不清戒本。」', effect: 'tease', affection: 6 },
                { text: '不出声，走到案边替她研墨', effect: 'ink', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'obey': aff = 5; msg = '你磕磕绊绊背完。她听完，戒尺在案上轻轻一磕：「背得出，说明认得字。」她抬眼看了你一瞬，「下回走正道。」——放你走了。'; break;
                case 'tease': aff = 6; msg = '她终于抬头，杏眼里一点凉光：「看不清戒本，倒看得清我的灯？」话虽冷，她还是把灯挑亮了，「背。背完各走各路。」——你背完时，她在灯下多看了你一眼。'; break;
                case 'ink': aff = 7; msg = '你没说话，过去研墨。墨香漫开，她盯着你看了半晌，笔停了：「……研墨的力道倒是稳。」那夜戒条抄完，她收笔时说了句「多谢」，声音很轻，像不常说。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'em_event_002': {
        id: 'em_event_002', npcId: EM_NPC_ID, title: '峨眉戒律', icon: '⚖️',
        desc: '她拿戒尺敲你，敲得句句在理。',
        minAffection: 18, trigger: { random: 0.35 }, cooldown: 0, flag: 'em_e002_done',
        autoTrigger: { location: '峨眉派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '你在斋堂多拿了两只馒头，被巡堂的夙孤鸿逮个正着。戒尺敲在你手背上，不重，但响。', type: 'description' },
            { speaker: 'npc', text: '「取食有度，是戒；让食于人，是善。」她把馒头塞回笼屉，语气一丝不苟，「你两手都占，两样都缺。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '受教，把馒头分给旁边的香客', effect: 'learn', affection: 7 },
                { text: '「戒律管到天边，累不累？」与她辩', effect: 'debate', affection: 6 },
                { text: '「你这人，古板得像块戒尺。」', effect: 'mock', affection: -4 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'learn': aff = 7; msg = '你把馒头递给香客，她在一旁看着，戒尺收回腰间：「孺子可教。」顿了顿，从袖里摸出一小包素点心搁你手里，「这个，是我多拿的。」——戒律首座也会「多拿」。'; break;
                case 'debate': aff = 6; msg = '她不恼，反而认真与你辩了半个时辰，从「取食有度」辩到「心戒胜于形戒」。末了她收住话头，看你一眼：「……辩得歪，但敢辩。」她转身走了，戒尺在指间转了个圈——你头一回见她手上的活气。'; break;
                // 真负选项：她以戒律立身，「古板」二字戳的是她端了十年的架子
                case 'mock': aff = -4; msg = '她握着戒尺的手紧了紧，脸上没什么表情：「古板？」她把戒尺端端正正别回腰间，「峨眉的规矩，就是靠古板守到今天。」——那之后她见你，礼数周全，戒尺再没敲过你的手背。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'em_event_003': {
        id: 'em_event_003', npcId: EM_NPC_ID, title: '旧剑穗', icon: '🎗️',
        desc: '她剑上那截褪色的红穗，不许人碰。',
        minAffection: 25, trigger: { random: 0.35 }, cooldown: 0, flag: 'em_e003_done',
        autoTrigger: { location: '峨眉派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '演武场上她的剑出鞘如虹，你无意伸手想抚那截旧红剑穗——她的剑鞘先一步压住你的手，快得像早就等着。', type: 'description' },
            { speaker: 'npc', text: '「穗子不许碰。」她收剑，语气没有商量，「我师父留下的。她走前替我系上的——系了三道结。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「三道结，是什么讲究？」', effect: 'ask', affection: 7 },
                { text: '「穗子旧了，我替你重打一条更好的。」', effect: 'replace', affection: -5 },
                { text: '收回手：「我不动。你说给我听就好。」', effect: 'listen', affection: 8 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'ask': aff = 7; msg = '她沉默一瞬：「戒、定、慧。」她低头看那截红穗，声音低了些，「师父说，系住这三样，人就散不了。」——她肯告诉你，就是把你看进了「可以说话的人」那一档。'; break;
                // 真负选项：那是亡师遗物，「换条更好的」在她听来是拿钱帛度量念想
                case 'replace': aff = -5; msg = '她的眼神一寸寸冷下来：「更好的？」她把剑连穗拢进臂弯，像护着什么，「这条穗子旧一次，我就记得师父一次。你拿什么替？」——她转身走了，那之后许久，你在演武场再也遇不上她。'; break;
                case 'listen': aff = 8; msg = '她看了你很久，剑鞘慢慢移开。「……好。」她在场边石上坐下，头一回说了很长一段话：师父如何在她及笄那年替她换剑穗，如何说「孤鸿啊，穗子红了，心就别冷了」。你听完，天都黑了。她起身时耳根有点红：「话多误事。下不为例。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'em_event_004': {
        id: 'em_event_004', npcId: EM_NPC_ID, title: '金顶夜巡', icon: '🌙',
        desc: '她夜夜巡金顶，风雨无阻。',
        minAffection: 32, trigger: { random: 0.3 }, cooldown: 0, flag: 'em_e004_done',
        autoTrigger: { timeRange: [21, 3], location: '峨眉派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '子夜金顶，云海在月下翻涌。夙孤鸿提剑巡到舍身崖边，鬓角凝着霜——她夜夜如此，风雨无阻。', type: 'description' },
            { speaker: 'npc', text: '「睡不着？」她没回头，「金顶夜风割脸，回去。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '陪她巡完这一圈', effect: 'walk', affection: 7 },
                { text: '把带来的暖氅披她肩上', effect: 'cloak', affection: 8 },
                { text: '「峨眉哪有贼，你这是白冻着。」', effect: 'scoff', affection: -3 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'walk': aff = 7; msg = '你没走，跟在她身侧巡完一圈。云海无声，两个人的脚步声一前一后。到崖尽头她停住：「……你脚程倒是稳。」这话从她嘴里出来，就算是夸了。'; break;
                case 'cloak': aff = 8; msg = '她肩一僵，要拒——氅衣已经披实了。她拢了拢领口，别开脸：「多事。」半晌，声音低下去，「……暖的。」那一夜她巡到寅时，比平日多了一程。'; break;
                // 真负选项：夜巡是她守了师父之死的规矩，一句「白冻着」抹掉的是她的心事
                case 'scoff': aff = -3; msg = '她终于回头，月光下眉目冷得像崖边的霜：「没有贼，就不用守了？」她声音很平，「我师父就是在没有贼的夜里，被人摸上金顶的。」——你这才知道她夜夜巡的不是山，是一段旧痛。可她没再给你道歉的机会，提剑走进了云海里。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'em_event_005': {
        id: 'em_event_005', npcId: EM_NPC_ID, title: '猴王缴尺', icon: '🐒',
        desc: '猴王偷了她的戒尺，上了树。',
        minAffection: 40, trigger: { random: 0.3 }, cooldown: 0, flag: 'em_e005_done',
        autoTrigger: { location: '峨眉派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '后山猴王第三次下山作乱，这回偷的不是馒头——是夙孤鸿那把磨得发亮的戒尺。它蹲在松树顶上，举着尺冲她龇牙，满山猴子吱吱大笑。', type: 'description' },
            { speaker: 'npc', text: '戒律首座站在树下，脸黑了又白、白了又黑，袖子挽起一半又放下：「……畜生不知戒律。」她咬了咬后槽牙，「可那是师父的尺。」' },
            { speaker: 'player_select', text: '你如何帮忙？', options: [
                { text: '挽袖上树，跟猴王斗智斗勇', effect: 'climb', affection: 6 },
                { text: '拿灵果跟猴王「谈」一笔买卖', effect: 'trade', affection: 7, item: 'spirit_grass' },
                { text: '正色道：「尺乃峨眉体面，首座莫慌，我去请它下来。」', effect: 'solemn', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '', item = null;
            switch (choice) {
                case 'climb': aff = 6; msg = '你在树上跟猴王周旋半个时辰，被薅了一把头发，总算把尺夺了回来。夙孤鸿接过尺翻来覆去看了三遍，确认没牙印，才想起你：「……头上那个包，去药堂抹点。」她顿了顿，「算峨眉欠你一次。」'; break;
                case 'trade': aff = 7; item = 'spirit_grass'; msg = '你掏出灵果晃了晃，猴王眼睛都直了——一果换一尺，两清。它临走还从树洞里扒拉出两株崖上药草丢给你，算是「谢媒」。夙孤鸿接过戒尺，看你的眼神复杂：「……你跟畜生讲价，讲得比我还熟练。」话是损的，嘴角没绷住。'; break;
                case 'solemn': aff = 5; msg = '你一本正经的样子把满山猴子都看愣了。猴王歪头打量你半晌，竟真把尺扔了下来——大概没见过这么能唬的。夙孤鸿接住尺，别过脸去笑了一声，又立刻板回来：「咳。峨眉体面，今日全在你的嘴上。」'; break;
            }
            return { affection: aff, msg: msg, item: item };
        }
    },
    'em_event_006': {
        id: 'em_event_006', npcId: EM_NPC_ID, title: '孤鸿', icon: '🕊️',
        desc: '她说起自己名字的来历。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'em_e006_done',
        autoTrigger: { location: '峨眉派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '雪后初晴，金顶云海铺到天际。她破例没巡剑，坐在崖边看云。你走近，她没赶你。', type: 'description' },
            { speaker: 'npc', text: '「知道我的名字怎么来的吗。」她望着云海，声音比平日松，「雪夜，师父在山门口捡到我。窗外有只失群的孤雁，叫了一夜。」' },
            { speaker: 'npc', text: '「师父说：孤鸿哀鸣，其声也远。」她侧头看你，杏眼里映着云光，「她给我这个名字，是要我记得——一个人，也能飞得很远。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「从今往后，孤鸿不哀。」', effect: 'vow', affection: 9 },
                { text: '「你师父，是个很温柔的人。」', effect: 'master', affection: 6 },
                { text: '什么都不说，陪她坐到云散', effect: 'stay', affection: 8 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'vow': aff = 9; msg = '她怔住，转过头来看你——看了很久。云海在她眼底翻涌。「……其声也远。」她轻声重复了一遍师父的话，忽然说，「师父只教了前半句。后半句，是你补的。」'; break;
                case 'master': aff = 6; msg = '她垂下眼，指尖无意识摩挲剑穗：「温柔？」她想了想，「她戒尺打手心，一打一个准。」话是这么说，唇角却松了一线，「……是很温柔。」'; break;
                case 'stay': aff = 8; msg = '你没说话，在她身边坐下。两个人看云看了整整一个时辰，谁也没开口。云散时她起身，掸了掸衣上雪水：「你这个人——」她找不出词，末了说，「坐得住。」对戒律首座来说，这是极高的考语。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'em_event_007': {
        id: 'em_event_007', npcId: EM_NPC_ID, title: '戒是护心', icon: '🪷',
        desc: '她终于说出师父的最后一课。',
        minAffection: 55, trigger: { random: 0.3 }, cooldown: 0, flag: 'em_e007_done',
        autoTrigger: { location: '峨眉派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '戒堂深夜。她在灯下擦那把木戒尺，擦得很慢。你进去，她没像平日那样让你「站好」。', type: 'description' },
            { speaker: 'npc', text: '「师父走前留给我一句话。」她望着戒尺，「她说：『戒是护心的，不是杀心的。』」' },
            { speaker: 'npc', text: '「我端了十年戒尺，端得比谁都直。」她抬眼看你，杏眼里有点你自己没见过的东西，「可这些日子我发现——我护住了峨眉的戒，护不住自己的心。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「那就让戒，护住这颗心。它也是我认得的最干净的心。」', effect: 'guard', affection: 11 },
                { text: '「你师父留这句话，就是算到了今天。」', effect: 'see', affection: 8 },
                { text: '替她把戒尺擦完剩下的那一半', effect: 'wipe', affection: 9 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'guard': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 15) : { ok: true };
                    if (!_py.ok) { aff = 4; msg = '灯花爆了一声，你困得先伏在案上。醒来时身上盖着她的外氅，戒尺搁在你手边——像是让你替她看着。（精力不足，那一夜你先撑不住了）'; break; }
                    aff = 11; msg = ('她整个人僵在灯下，耳根以肉眼可见的速度红了。半晌，她把戒尺轻轻搁在案上，像放下什么重担：「……你这话，犯了峨眉第七条戒——」她顿了顿，「妄语。可我不罚你。」') + '（精力-15）'; break; }
                case 'see': aff = 8; msg = '她怔了很久，忽然低笑一声——你头一回听见她笑：「师父算无遗策。」她把戒尺收进袖中，「算到我守得住戒，守不住一个会说话的人。」'; break;
                case 'wipe': aff = 9; msg = '你伸手接过戒尺，替她擦完剩下的半截。木尺温润，六道戒痕深浅不一。她看着你的手，轻声：「轻一点。第六道是师父亲手刻的——她刻的时候，手抖了。」那一夜戒堂的灯，亮到很晚。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'em_event_008': {
        id: 'em_event_008', npcId: EM_NPC_ID, title: '剑上霜', icon: '❄️',
        desc: '黎明金顶，她独自练剑，剑上结霜。',
        minAffection: 62, trigger: { random: 0.3 }, cooldown: 0, flag: 'em_e008_done',
        autoTrigger: { timeRange: [4, 6], location: '峨眉派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '寅时金顶，天没亮。她的剑已经练了不知几个时辰——剑身上凝了一层薄霜，挥出去，霜花簌簌地落。', type: 'description' },
            { speaker: 'npc', text: '「吵醒你了？」她收剑，气息微乱，「我练剑，是天不亮就起的。师父在的时候就这样——她说，峨眉的剑，要比金顶的日出早。」' },
            { speaker: 'npc', text: '她望着东方将白未白的天，声音忽然低了：「我怕配不上『首座』两个字。满峨眉都在看着我——我不能让人看见我累。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「你已经配了。从今往后，累的时候有人看着你——看着，不评价。」', effect: 'enough', affection: 12 },
                { text: '拔剑：「陪我练到天亮。」', effect: 'spar', affection: 9 },
                { text: '「那就练得更狠些，配得上为止。」', effect: 'push', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'enough': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 15) : { ok: true };
                    if (!_py.ok) { aff = 5; msg = '寅时的风太冷，你话说到一半先打了个大喷嚏。她把外氅解下来裹你身上，剑也不练了：「……回去睡。这话，改日再说。」（精力不足，那一夜你先撑不住了）'; break; }
                    aff = 12; msg = ('她握着剑的手垂了下去。霜从剑身上化下来，一滴一滴落在雪地里。她背对着你站了很久，声音有点哑：「……看着，不评价。」她重复了一遍，忽然回身，把剑收了，「好。那你看着——今日的剑，我练给自己看。」日出跃上云海那一刻，她的剑光比朝霞还亮。') + '（精力-15）'; break; }
                case 'spar': aff = 9; msg = '她的眼睛亮了一下，剑锋一转：「接住。」两个人在黎明的金顶对练到日出，霜花溅了满身。收剑时她难得畅快：「……你的剑，敢跟我抢拍子。峨眉没人敢。」'; break;
                case 'push': aff = 5; msg = '她看了你一眼，点头：「也对。」提剑又练。可那天的剑，你看得出——比平日沉。她要的不是更狠，是有人说不必。这话她没说，你后来才懂。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'em_event_009': {
        id: 'em_event_009', npcId: EM_NPC_ID, title: '云阶之诺', icon: '🔗',
        desc: '大戒之期将近，她向你讨一个诺。',
        minAffection: 68, trigger: { random: 0.3 }, cooldown: 0, flag: 'em_e009_done',
        autoTrigger: { location: '峨眉派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '峨眉十年一次的大戒之期将近。戒律首座要登金顶、对云海、当众诵戒发誓——这是她接掌戒律以来最大的一场。', type: 'description' },
            { speaker: 'npc', text: '「诵戒的时候，我不能回头看任何人。」她在戒堂擦尺，语气如常，「戒律首座回头，戒就松了。」' },
            { speaker: 'npc', text: '「所以跟你讨个诺。」她把戒尺收进袖中，抬眼，杏眼很静，「那日你站在云阶第一级。我诵完戒转身——第一眼看见你，我的剑就不会抖。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「我应你。云阶第一级，风雨不改。」', effect: 'promise', affection: 14 },
                { text: '「我不止站云阶。誓台的侧翼，我替你盯着。」', effect: 'guard', affection: 9 },
                { text: '「……这种话，不该对人说吗？」', effect: 'press', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'promise': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 15) : { ok: true };
                    if (!_py.ok) { aff = 6; msg = '你们对着戒堂长谈，你困得先伏了案。醒来时肩上盖着她的氅衣，案上戒尺旁边压着一张字条：云阶第一级——记下了。（精力不足，那一夜你先撑不住了）'; break; }
                    aff = 14; msg = ('她看了你很久很久，久到灯花爆了两次。然后她从袖中取出那把木戒尺，轻轻放在你手里：「大戒之期，替我拿着它。」尺身温润，六道戒痕里浸着两代人的手泽。「我诵戒不能回头——但你手里有它，就等于我回头看过了。」') + '（精力-15）'; break; }
                case 'guard': aff = 9; msg = '她唇角动了一下，像笑又收住：「侧翼……」她点头，「好。誓台侧翼归你。」她抽出纸笔把誓仪的方位图画给你，一笔一笔，标得极细——戒律首座托付人的方式，就是把每一处都交代清楚。'; break;
                case 'press': aff = 5; msg = '她别开脸：「……不该。」半晌，声音低下去，「可我数来数去，满峨眉——只有你，我敢让他站在我转身的地方。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'em_event_010': {
        id: 'em_event_010', npcId: EM_NPC_ID, title: '掌门出关', icon: '🐉',
        desc: '灭绝师太出关考你，夙孤鸿替你挡。',
        minAffection: 72, trigger: { random: 0.3 }, cooldown: 0, flag: 'em_e010_done',
        autoTrigger: { location: '峨眉派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '后山闭死关多年的掌门灭绝师太，忽然出现在戒堂前。老尼眉目如电，上下打量你：「孤鸿身边站了个人？让师太瞧瞧，根基正不正。」', type: 'description' },
            { speaker: 'narrator', text: '话音未落，一线剑光已至——灭绝剑意，凛冽如三九霜刀，直取你眉心。是考校，也是下马威。', type: 'description' },
            { speaker: 'npc', text: '一道缟素身影横进来，剑鞘「锵」地架住那道剑光。夙孤鸿持鞘的手极稳，声音也稳：「掌门师伯。此人，我担。」' },
            { speaker: 'npc', text: '灭绝师太眯眼：「哦？你担？」剑光又沉三分，「戒律首座为人破例——你倒说说，担得起吗。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '对师太一礼：「根基正不正，弟子用日子证。」', effect: 'respect', affection: 8 },
                { text: '低声对孤鸿：「剑鞘放下，这一考我自己接。」', effect: 'stand', affection: 7 },
                { text: '什么也不说，走到她身侧并肩而立', effect: 'side', affection: 11 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'respect': aff = 8; msg = '灭绝师太收了剑光，盯着你看了半晌，忽然对夙孤鸿道：「知礼，不卑。」老尼拂袖回后山，走出十步丢下一句，「戒堂的茶，往后备两只杯。」——夙孤鸿握着剑鞘的手，松了。'; break;
                case 'stand': aff = 7; msg = '她侧头看你，杏眼里闪过一丝什么：「……你接不住。」话这么说，剑鞘却真的放下了半寸，「接三息。三息后我收场。」——那三息，是你此生站得最直的三息。'; break;
                case 'side': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 15) : { ok: true };
                    if (!_py.ok) { aff = 4; msg = '剑气压得人喘不过气，你眼前发黑先晃了晃。醒来时考校已散，她守在旁边，戒尺都忘了收。（精力不足，那一场你先撑不住了）'; break; }
                    aff = 11; msg = ('你上前与她并肩。灭绝师太看着你们两个，剑光一寸寸敛去，忽然笑了——满峨眉没人见过这位掌门笑：「寂度师妹一辈子端方，收你这个徒弟，倒是学会了并肩。」老尼走后，夙孤鸿轻声说：「她夸人了。用峨眉最古的礼数。」') + '（精力-15）'; break; }
            }
            return { affection: aff, msg: msg };
        }
    },
    'em_event_011': {
        id: 'em_event_011', npcId: EM_NPC_ID, title: '誓台惊变', icon: '🌩️',
        desc: '大戒之日，誓台上来了一剑。',
        minAffection: 78, trigger: { random: 0.3 }, cooldown: 0, flag: 'em_e011_done',
        autoTrigger: { location: '峨眉派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '大戒之日。金顶誓台，云海为证，夙孤鸿当众诵戒——诵到第六戒，一道黑虹自云海中暴起，直取誓台！是魔道刺客，蛰伏已久，等的就是她诵戒不能分神的这一刻。', type: 'description' },
            { speaker: 'narrator', text: '她的剑在鞘中——诵戒未毕，戒律首座的手不能碰兵刃。这是她自己立的规矩，此刻成了枷锁。', type: 'description' },
            { speaker: 'player_select', text: '你必须立刻做点什么。', options: [
                { text: '扑上誓台，以身替她挡这一剑', effect: 'hold', affection: 14 },
                { text: '大喊：「孤鸿！戒是护心的——先护你自己的心！」', effect: 'shout', affection: 10 },
                { text: '夺过仪仗弟子的剑，掷给她', effect: 'sword', affection: 11 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'hold': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 20) : { ok: true };
                    if (!_py.ok) { aff = 6; msg = '你扑到一半被剑气掀翻，最后那一寸是她自己侧身避过的——戒诵乱了半句，人没事。（精力不足，那一刻你先撑不住了）'; break; }
                    aff = 14; msg = ('你扑上誓台挡在她身前，黑虹透肩而过。剧痛里你听见她诵戒的声音断了——十年头一遭。她的剑终于出鞘，一剑，云海裂开，刺客坠入深渊。她扶住你，手在抖，声音也在抖：「第七戒……」她盯着你肩上的血，一字一字，「我今日才刻出来——戒，是护你。」') + '（精力-20）'; break; }
                case 'shout': aff = 10; msg = '她浑身一震——诵戒未毕的手，按上了剑柄。规矩碎了，剑出了鞘。一击，黑虹寸断。满山哗然里她收剑而立，望向你，唇形无声：「……谢了。」戒律首座当众破了自己的戒，可她站在誓台上，比任何时候都直。'; break;
                case 'sword': aff = 11; msg = '你夺剑掷出，长剑破空——她诵戒之声未停，反手接剑，剑光与诵声同落。刺客授首那一刻，她的第六戒刚好诵完，一个音都没错。收剑时她看了你一眼，杏眼里有惊涛，也有你读不懂的暖：「……你倒懂峨眉的规矩——戒可以借剑，剑不能乱戒。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'em_event_013': {
        id: 'em_event_013', npcId: EM_NPC_ID, title: '终章·第七条戒', icon: '💍',
        desc: '师父的戒尺上，第七条是空的。',
        minAffection: 85, trigger: { random: 1.0 }, cooldown: 0, flag: 'em_e013_done',
        endingMap: { '飞鸿': 'em_ending_飞鸿', '云庐': 'em_ending_云庐', '斗剑': 'em_ending_斗剑', '云客': 'em_ending_云客', '封剑': 'em_ending_封剑', '孤峰': 'em_ending_孤峰' },
        scenes: [
            { speaker: 'narrator', text: '金顶雪霁。夙孤鸿把那把木戒尺横在你面前——六道戒痕之后，尺尾一片空白，刀口新磨过，像随时要落下第七道。', type: 'description' },
            { speaker: 'npc', text: '「师父刻了六条戒，第七条空着。」她的声音很静，「我想了十年，想不出该刻什么。直到誓台那日——」' },
            { speaker: 'npc', text: '「{playerName}。」她把戒尺推到你掌心，指尖在你手背上停了一瞬，「第七条，我不刻了。师父说得对——戒是护心的，不是杀心的。我的心在这儿，你替我拿着。」' },
            { speaker: 'player_select', text: '你的选择将决定你们的关系走向', options: [
                { text: '「要。我带你和这把尺下山——双剑入世，哪里有不平就去哪里。」', effect: 'lover_travel', affection: 30 },
                { text: '「要。但哪儿也不去。我留在峨眉，陪你守金顶的每一场云海。」', effect: 'lover_stay', affection: 28 },
                { text: '「尺我接。人就算了——我做你的论剑知己，年年峨眉斗剑。」', effect: 'friend', affection: 20 },
                { text: '「尺我接。云阶第一级给我留着——年年大戒我来观礼，不谈风月，只谈戒。」', effect: 'friend_stay', affection: 18 },
                { text: '「我都不要。我只是个登山的过客。」', effect: 'none', affection: 0 }
            ]}
        ],
        effects: function(npc, choice) {
            // 三度伤透即寒心：辜负独立成结局「封剑」，与「孤峰」（错过）分账
            var negCount = (window._negativeChoiceCount && window._negativeChoiceCount[EM_NPC_ID]) || 0;
            if (negCount >= 3 && (choice === 'lover_travel' || choice === 'lover_stay')) {
                return { affection: 0, msg: '她看着你，杏眼里的光一寸寸冷下去。「……我想了十年，想不出第七条。」她收回戒尺，转身面向云海，拔剑——剑光映亮半座金顶。「今日想出来了。」她声音平得像雪，「第七条：此生封剑，不再对人。」剑归鞘，她走回戒堂，背影笔直，再没回头。', ending: '封剑' };
            }
            switch (choice) {
                case 'lover_travel': return { affection: 30, msg: '她怔在原地，耳根红透，声音却稳：「……好。」她解下剑穗上师父系的三道结，重新系紧，「戒、定、慧——加一个你。下山。」那日金顶的云海，满峨眉都说像一场送嫁。', ending: '飞鸿' };
                case 'lover_stay': return { affection: 28, msg: '她低下头，很久，再抬眼时杏眼里全是云光：「……好。金顶的风大。」她把戒尺塞回你手里，「往后夜巡，两个人。」——峨眉的弟子后来都说，戒律首座巡夜的脚步声，不知何时起变成了两双。', ending: '云庐' };
                case 'friend': return { affection: 20, msg: '她挑眉，戒尺在指间一转：「斗剑知己？」她忽然笑了，十年戒堂头一回这么松快，「行。年年大戒之后，金顶斗剑——输了的抄戒条一百遍。」', ending: '斗剑' };
                case 'friend_stay': return { affection: 18, msg: '「云阶第一级？」她沉吟片刻，点头，「那个位子，本来就没人敢站。」她把戒尺收回袖中，又取出一盏小铜灯递你，「观礼的灯，自己点。年年今夜，金顶见。」', ending: '云客' };
                case 'none': return { affection: 0, msg: '她沉默了很久，把戒尺一寸寸收回袖中。「……也好。」她声音恢复了戒堂里的清冷，「过客登山，看完云海就该下山了。峨眉的门，朝所有香客开。」', ending: '孤峰' };
            }
            return { affection: 0, msg: '' };
        }
    }
};

// ============ 夙孤鸿结局演出（6 个） ============
var EM_ENDINGS = {
    'em_ending_飞鸿': {
        id: 'em_ending_飞鸿', npcId: EM_NPC_ID, title: '结局·飞鸿', icon: '🕊️',
        route: '飞鸿',
        scenes: [
            { speaker: 'narrator', text: '三日后，夙孤鸿把戒律首座的木印供回戒堂正案，对满堂弟子行了最后一个师礼。灭绝师太在后山听完禀报，只留了四个字：「由她去罢。」又添了半句——「剑，别锈了。」', type: 'description' },
            { speaker: 'npc', text: '「戒尺给你收着。」她背剑与你并肩走下云阶，山风吹起那截旧红剑穗，「我这个人，往后归你管——管得松些。」' },
            { speaker: 'narrator', text: '多年后，江湖有「金顶双剑」的传说：一柄端方如戒，一柄随性如风。专管人间不平事。', type: 'description' },
            { speaker: 'narrator', text: '有人见过他们在雪夜的客栈歇脚。她难得没端着的坐姿，靠在{playerTa}肩上打盹——那把木戒尺搁在桌上，第七道戒痕始终空着。她说，那条戒不用刻了，人在，戒就在。', type: 'description' }
        ],
        finalText: '——— 结局·飞鸿（道侣·同行）———'
    },
    'em_ending_云庐': {
        id: 'em_ending_云庐', npcId: EM_NPC_ID, title: '结局·云庐', icon: '🏡',
        route: '云庐',
        scenes: [
            { speaker: 'narrator', text: '你留在了峨眉。金顶后崖那间旧云庐，从此住着两个人。', type: 'description' },
            { speaker: 'narrator', text: '她还是天不亮就起，练剑比日出早——只是云阶上从此多了一双脚步声。夜巡金顶，一盏灯变成两盏。', type: 'description' },
            { speaker: 'npc', text: '「今日云海，比昨日低三尺。」她巡到崖边，把暖氅往你肩上拢了拢，「……站近点。风大，我数你，不比数云少。」' },
            { speaker: 'narrator', text: '小弟子们私下说，戒律首座还是那么端方，戒尺还是敲得响——只是敲完人，会往金顶的方向看一眼，眉眼就软了。', type: 'description' },
            { speaker: 'narrator', text: '雪夜孤鸿不再哀鸣。云海之上，两个人一盏灯。', type: 'description' }
        ],
        finalText: '——— 结局·云庐（道侣·归隐）———'
    },
    'em_ending_斗剑': {
        id: 'em_ending_斗剑', npcId: EM_NPC_ID, title: '结局·斗剑', icon: '⚔️',
        route: '斗剑',
        scenes: [
            { speaker: 'narrator', text: '你们成了江湖闻名的斗剑知己。年年大戒之后，金顶之约，风雨无阻。', type: 'description' },
            { speaker: 'npc', text: '「今年你快了半招。」她收剑入鞘，面上波澜不惊，袖中却把一枚抄满戒条的纸卷塞给你，「愿赌服输。一百遍，抄完了——明年再赢回去。」' },
            { speaker: 'narrator', text: '有人问你们是什么关系。她答「对手」，{playerTa}答「对手」。说完两人对视，都绷不住先笑了——戒律首座笑起来，金顶的云都散了三分。', type: 'description' }
        ],
        finalText: '——— 结局·斗剑（挚友·同行）———'
    },
    'em_ending_云客': {
        id: 'em_ending_云客', npcId: EM_NPC_ID, title: '结局·云客', icon: '🏮',
        route: '云客',
        scenes: [
            { speaker: 'narrator', text: '{playerTa}成了峨眉大戒的常客。云阶第一级那个位置，年年观礼，年年是{playerTa}。', type: 'description' },
            { speaker: 'narrator', text: '她诵戒依旧不能回头——可满峨眉都知道，首座诵完戒转身，第一眼落在哪里。', type: 'description' },
            { speaker: 'npc', text: '「今年的灯，油添多了。」她巡夜路过{playerTa}落脚的客寮，把那盏小铜灯拨暗些，「……亮一夜伤油。明晚还点。」' },
            { speaker: 'narrator', text: '小弟子有回问{playerTa}：「你算我们首座什么？」{playerTa}想了想：「云客。」弟子们似懂非懂，只有戒堂那位端方的首座听见了，低头继续抄戒——那页纸上，多抄了一遍「有朋自远方来」。', type: 'description' }
        ],
        finalText: '——— 结局·云客（挚友·归隐）———'
    },
    'em_ending_封剑': {
        id: 'em_ending_封剑', npcId: EM_NPC_ID, title: '结局·封剑', icon: '🗡️',
        route: '封剑',
        scenes: [
            { speaker: 'narrator', text: '那日金顶，她当众拔剑又归鞘，说了此生第七道戒——「不再对人」。满山寂静，只有云海翻涌的声音。', type: 'description' },
            { speaker: 'narrator', text: '第二日起，戒律首座封剑。鸣鸿入匣，剑穗上师父系的三道结，她一道一道解下来，收进了木匣最底。', type: 'description' },
            { speaker: 'narrator', text: '峨眉的戒律愈发森严，她的戒尺敲得愈发准——只是再没有弟子见过首座练剑，天不亮的金顶，从此只有风。', type: 'description' },
            { speaker: 'narrator', text: '多年后灭绝师太圆寂前问她：「第七条，值么。」她跪在榻前，很久，答：「弟子刻得晚了。」老尼叹口气，没再问——那把木戒尺的尺尾，始终空着，谁也不敢提。', type: 'description' }
        ],
        finalText: '——— 结局·封剑（辜负）———'
    },
    'em_ending_孤峰': {
        id: 'em_ending_孤峰', npcId: EM_NPC_ID, title: '结局·孤峰', icon: '🏔️',
        route: '孤峰',
        scenes: [
            { speaker: 'narrator', text: '后来你还是登过几次峨眉。戒堂开着，她对你礼数周全，端方如仪，像对每一位远来的香客。', type: 'description' },
            { speaker: 'narrator', text: '那把木戒尺收在她袖中最深处，第七道戒痕始终没有刻。', type: 'description' },
            { speaker: 'narrator', text: '再后来，江湖偶有传闻——峨眉戒律首座剑法愈发精深，金顶夜巡风雨无阻，只是再没人见她，为谁在云阶上留过一个位置。', type: 'description' }
        ],
        finalText: '——— 结局·孤峰（错过）———'
    }
};

// ============ 性别语境事件（femctx 女玩家 / mctx 男玩家，互斥） ============
var EM_GENDER_CTX_EVENTS = {
    // 女玩家：监院师太的眼光
    'em_event_femctx': {
        id: 'em_event_femctx', npcId: EM_NPC_ID, title: '监院的提醒', icon: '🪷',
        desc: '监院师太把你叫住了。',
        minAffection: 55, trigger: { random: 0.35 }, cooldown: 0, flag: 'em_e_femctx_done',
        requirePlayerFemale: true,
        autoTrigger: { location: '峨眉派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '监院师太把你叫到斋堂后头，捻着佛珠，上下看你。', type: 'description' },
            { speaker: 'npc', text: '「姑娘。」监院开门见山，「孤鸿那孩子，自小什么都自己扛，扛成了习惯。她对人严，对自己更严。我怕你跟着她，端方日子过得辛苦。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「她端她的方，我拆我的台——正好。」', effect: 'tease', affection: 8 },
                { text: '「师太，我自愿的。辛苦我认。」', effect: 'accept', affection: 7 },
                { text: '「您是怕我委屈，还是怕她破例？」', effect: 'probe', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'tease': aff = 8; msg = '监院愣了愣，佛珠停了：「……拆台？」她忽然笑了，眼角的纹路都松了，「好孩子。她那把戒尺端了十年，早该有人拆了。你拆——师太给你递梯子。」'; break;
                case 'accept': aff = 7; msg = '监院叹气：「自愿的……好。」她拍拍你的手，「斋堂的素点心，往后给你多留一份——跟着端方人过日子，得先喂饱。」'; break;
                case 'probe': aff = 6; msg = '监院捻珠的手顿了顿：「……两样都怕。」她望着戒堂的方向，「她破例一次，就要拿十倍端回来。你舍得看她那样，就留下。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // 男玩家：两个男修同走金顶，山里山外的眼光
    'em_event_mctx': {
        id: 'em_event_mctx', npcId: EM_NPC_ID, title: '金顶流言', icon: '🌫️',
        desc: '师妹把你拦下了。',
        minAffection: 55, trigger: { random: 0.35 }, cooldown: 0, flag: 'em_e_mctx_done',
        requirePlayerMale: true,
        autoTrigger: { location: '峨眉派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '云阶半腰，一个胆大的小师妹把你拦下，左右看了看，压低声。', type: 'description' },
            { speaker: 'npc', text: '「那位……客卿。」小师妹咬着嘴唇，「你跟首座的事，山里传遍了。首座的戒律管得了峨眉，管不了山下的嘴——江湖上说，峨眉戒律首座『戒律有亏』。」' },
            { speaker: 'npc', text: '「我不是说这不好。我是说，她那个人，别人戳她一指头，她能端十倍回来。你受得住她端，她受得住这满江湖的嘴吗？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「嘴归嘴。她端她的方，我站我的位。」', effect: 'defy', affection: 8 },
                { text: '「师妹，我们还没到那一步。」', effect: 'deny', affection: 3 },
                { text: '「谁嚼她的舌根，先问我的剑。」', effect: 'shield', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'defy': aff = 8; msg = '小师妹眼睛亮了：「……行！这话我原样带给首座——不对，我不能带。」她吐吐舌头跑了。可当天夜里金顶巡剑的脚步声，你听得出，比平日轻快。'; break;
                case 'deny': aff = 3; msg = '小师妹盯了你半晌：「……没到那一步。」她拍拍裙摆走了，「那你站在云阶上干什么？那个位子，满峨眉都知道是留给谁的。」'; break;
                case 'shield': aff = 7; msg = '小师妹怔了怔，忽然咧嘴一笑：「首座要是听见这句，戒尺得敲你——敲完请你吃斋。」她跑上云阶，声音远远飘下来，「山下那些嘴，其实早被首座的剑吓哑一半啦！」'; break;
            }
            return { affection: aff, msg: msg };
        }
    }
};

// ============ 合并进总事件池 ============
if (typeof NPC_PERSONAL_EVENTS !== 'undefined') {
    Object.assign(NPC_PERSONAL_EVENTS, EM_MAIN_EVENTS);
    Object.assign(NPC_PERSONAL_EVENTS, EM_GENDER_CTX_EVENTS);
}

// ============ 注册结局集与副作用回调 ============
if (typeof registerEndingSet === 'function') {
    registerEndingSet(EM_NPC_ID, EM_ENDINGS);
}
if (typeof registerEndingCallback === 'function') {
    registerEndingCallback(EM_NPC_ID, function(endingName, npc) {
        if (endingName === '飞鸿' || endingName === '云庐') {
            if (npc && typeof npc.setFlag === 'function') npc.setFlag('dao_companion');
            if (window.showMessage) window.showMessage('🪷 你与夙孤鸿结为道侣！峨眉剑理感悟大幅提升', 'success');
        } else if (endingName === '斗剑' || endingName === '云客') {
            if (npc && npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 30);
            if (window.showMessage) window.showMessage('🪷 你与夙孤鸿成了彼此最信得过的论剑知己', 'success');
        } else if (endingName === '封剑') {
            if (window.showMessage) window.showMessage('🗡️ 夙孤鸿封了剑。第七条戒，她刻给了自己', 'error');
        }
    });
}

// ============ 自动触发 + 每日钩子（复用 maybeAutoTriggerPersonalEvent） ============
function maybeAutoTriggerEmEvent(source) {
    return maybeAutoTriggerPersonalEvent(EM_NPC_ID, source, { finalEvents: ['em_event_013'] });
}

if (typeof window !== 'undefined' && window.timeSystem && window.timeSystem.onNewDaySubscribe) {
    window.timeSystem.onNewDaySubscribe(function() {
        try {
            if (window.currentCharData && window.currentCharData.location === '峨眉派') {
                maybeAutoTriggerEmEvent('daily');
            }
            // 性别语境：每日在该派过夜 + 对应性别 + 好感≥55 + 未触发
            if (!window.currentCharData || !window.npcManager) return;
            var loc = window.currentCharData.location || '';
            if (loc !== '峨眉派') return;
            var npc = window.npcManager.getNPC ? window.npcManager.getNPC(EM_NPC_ID) : null;
            if (!npc) return;
            var aff = (npc.relationship && npc.relationship.affection) || 0;
            if (aff < 55) return;
            var isF = window.currentCharData.gender === 'female';
            var ctxId = isF ? 'em_event_femctx' : 'em_event_mctx';
            if (typeof hasEventTriggered === 'function' && hasEventTriggered(ctxId)) return;
            var ev = NPC_PERSONAL_EVENTS[ctxId];
            if (!ev) return;
            if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npc)) return;
            setTimeout(function() {
                if (document.querySelector && document.querySelector('.personal-event-modal')) return;
                if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npc)) return;
                if (typeof triggerPersonalEvent === 'function') triggerPersonalEvent(ctxId);
            }, 1200);
        } catch (e) { console.warn('[夙孤鸿线] 每日触发失败:', e); }
    });
}

// ============ 导出 ============
if (typeof window !== 'undefined') {
    window.EM_MAIN_EVENTS = EM_MAIN_EVENTS;
    window.EM_ENDINGS = EM_ENDINGS;
    window.maybeAutoTriggerEmEvent = maybeAutoTriggerEmEvent;
}
console.log('[夙孤鸿线] 峨眉派感情线加载完成：结局 ' + Object.keys(EM_ENDINGS).length + ' 个 + 主线事件 ' + Object.keys(EM_MAIN_EVENTS).length + ' 个 + 性别语境 ' + Object.keys(EM_GENDER_CTX_EVENTS).length + ' 个');
