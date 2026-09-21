// ==================== jingang-events.js - 赫渊线情缘事件/结局/性别语境 v1.0 ====================
// 男主·赫渊（法名净渊，金刚宗苦行僧，闭口禅，肉身证道，守戒至动情破戒）。

var JG_NPC_ID = 'sect_leader_金刚宗';

var JG_MAIN_EVENTS = {
    'jg_event_001': {
        id: 'jg_event_001', npcId: JG_NPC_ID, title: '不语', icon: '📿',
        desc: '你跌下崖，他接住你，一个字没说。',
        minAffection: 12, trigger: { random: 0.4 }, cooldown: 0, flag: 'jg_e001_done',
        autoTrigger: { location: '金刚宗', random: 0.45 },
        scenes: [
            { speaker: 'narrator', text: '你在金刚塔旁的石阶踩空，整个人往后仰——一双手稳稳托住你后背，你后脑没磕上石阶。你抬头，是个灰色苦行僧，光头戒疤，唇线紧抿。', type: 'description' },
            { speaker: 'npc', text: '他没说话。把你扶正，退一步，双手合十，行了个礼。' },
            { speaker: 'narrator', text: '你等他开口，他没开。指了指石阶上的青苔——意思是别踩。又指了指你，又指了指塔——意思是不知。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「你……不会说话？」', effect: 'mute', affection: 5 },
                { text: '合十还礼', effect: 'bow', affection: 7 },
                { text: '「我带你看看塔。」', effect: 'guide', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'mute': aff = 5; msg = '他摇头，又点头。从袖里摸出一块木牌——上刻「闭口禅」三字。他指了指自己，又摇头。你懂了：他不是不会说，是不说。'; break;
                case 'bow': aff = 7; msg = '他看你还礼，眉目动了一下——像笑了，又没笑。他朝塔方向比了个「请」的手势，陪你走了一圈。整路无言。'; break;
                case 'guide': aff = 6; msg = '他顿了顿，没拒绝。你带他看塔，他听着，偶尔点头。到塔顶，他忽然指了指远处——苦行崖的方向。又指了指你。意思：下回来。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'jg_event_002': {
        id: 'jg_event_002', npcId: JG_NPC_ID, title: '护体', icon: '🛡️',
        desc: '他以肉身替你挡了一击。',
        minAffection: 18, trigger: { random: 0.35 }, cooldown: 0, flag: 'jg_e002_done',
        autoTrigger: { location: '金刚宗', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '演武场上，一个弟子失控，金刚杵朝你飞来。一道灰色身影挡在你身前——杵砸在他肩上，发出金石声。他纹丝未动。', type: 'description' },
            { speaker: 'npc', text: '他回头看你，没说话，把你往后推了一步。肩上青了一片，他没揉。' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「你伤了。让我看看。」', effect: 'check', affection: 7 },
                { text: '「你为什么挡？」', effect: 'why', affection: 6 },
                { text: '什么都不说，扶住他胳膊', effect: 'hold', affection: 8 },
                { text: '「练这一身铁，原就是给人砸的。」', effect: 'mock', affection: -3 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'check': aff = 7; msg = '他没躲，让你看。肩上一片青，下面是练金刚不坏练出的硬茧。你碰，他肌肉一绷——不是痛，是怕你碰。'; break;
                case 'why': aff = 6; msg = '他沉默很久。从袖里摸出木牌——「闭口禅」。又指了指你，指了指自己的心。意思：不挡你，乱道心。'; break;
                case 'hold': aff = 8; msg = '你扶住他胳膊。他僵了一下——肌肉硬得像铁。但他没抽开。许久，他低头看了眼你扶着他的手，嘴唇动了一下，没出声。'; break;
                // v20.25 真负选项：拿人家的血肉当兵器评头论足，是会被记账的（坏结局从此攒得数）
                case 'mock': aff = -3; msg = '他放下胳膊，看你的眼神第一次冷了。他没恼——恼是要动气的，他只是退开两步，重新合十，像把你从「人」的位置挪回了「香客」。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'jg_event_003': {
        id: 'jg_event_003', npcId: JG_NPC_ID, title: '破戒', icon: '🔓',
        desc: '他为你开了口——修闭口禅以来第一次。',
        minAffection: 25, trigger: { random: 0.3 }, cooldown: 0, flag: 'jg_e003_done',
        autoTrigger: { location: '金刚宗', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '你在苦行崖迷了路，天黑没下去。崖风大。你听见脚步——他来了，灰衣被风灌满。他走到你面前，张了张嘴。', type: 'description' },
            { speaker: 'npc', text: '「……下。」一个字，哑，像很多年没用过的嗓子。他指了指下山的路。' },
            { speaker: 'narrator', text: '你愣住——他修闭口禅三年，这是头一次开口。为你。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「你……说话了。」', effect: 'shock', affection: 8 },
                { text: '「你为我破戒了。」', effect: 'point', affection: 9 },
                { text: '什么都不说，跟他下山', effect: 'follow', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'shock': aff = 8; msg = '他没看你，喉结动了一下：「……三年，头一回。」半晌，「你迷路。我不说，你下不去。」——他为你破戒，理直气壮。'; break;
                case 'point': aff = 9; msg = '他沉默良久，点头。又摇头：「……戒是给自己守的。你迷路，我不说，戒就白守了。」他看你，「这一字，值。」'; break;
                case 'follow': aff = 7; msg = '你没说话，跟他下山。他走在前，没再开口。但到山下，他停步，回头看你一眼——嘴唇动了动，没出声。意思：你在，我就还说话。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'jg_event_004': {
        id: 'jg_event_004', npcId: JG_NPC_ID, title: '苦行', icon: '🏔️',
        desc: '他在苦行崖面壁，你送水。',
        minAffection: 32, trigger: { random: 0.3 }, cooldown: 0, flag: 'jg_e004_done',
        autoTrigger: { location: '金刚宗', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '苦行崖。赫渊面壁而坐，赤背，背上自虐式炼体的旧伤一道道。你送水上山，他没回头。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '把水放他身边，默默陪坐', effect: 'sit', affection: 9 },
                { text: '「你背上伤，让我看看。」', effect: 'check', affection: 7 },
                { text: '「你多久没喝了？」', effect: 'ask', affection: 6 },
                { text: '「自虐成性，别练废了没人抬。」', effect: 'sneer', affection: -4 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'sit': aff = 9; msg = '你坐他旁边。他许久没动，忽然伸手——把水碗端起来喝了一口，又放下。没看你。但你坐下后，他面壁的脊背，松了一线。'; break;
                case 'check': aff = 7; msg = '他没躲。你看了那些伤——不是别人打的，是自虐炼体。他背肌一绷：「……苦行。还债。」没说还什么债。'; break;
                case 'ask': aff = 6; msg = '他指了指日头——意思一天。你把水碗递到他唇边，他顿了一下，喝了。喉结动三次。「……你送，我喝。」他哑声。'; break;
                // v20.25 真负选项：苦行是他还债的方式，拿这个打趣，伤的是实处
                case 'sneer': aff = -4; msg = '面壁的背影一动不动。半晌，他哑声说了今日头一句整话：「……水搁下，你走吧。」语气平，平得像塔下的石阶——门没摔，只是关上了。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'jg_event_005': {
        id: 'jg_event_005', npcId: JG_NPC_ID, title: '旧伤', icon: '🩹',
        desc: '你看到他心口一道极旧的疤。',
        minAffection: 40, trigger: { random: 0.3 }, cooldown: 0, flag: 'jg_e005_done',
        autoTrigger: { location: '金刚宗', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '他炼体后赤背擦汗，你瞥见他心口一道极旧的疤——不像苦行伤，像刀。', type: 'description' },
            { speaker: 'npc', text: '他察觉你的目光，把衣拢上。许久：「……我五岁那年，金刚塔下，有人想取我的血炼魔。一位苦行僧替我挡了这一刀——死了。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「他替你死了。你替他活着。」', effect: 'live', affection: 8 },
                { text: '「你苦行，是还他的命。」', effect: 'debt', affection: 9 },
                { text: '轻轻按那道疤', effect: 'touch', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '', item = null;
            switch (choice) {
                case 'live': aff = 8; msg = '他闭眼，许久：「……你说对了。我活，是替他活。」他睁眼，看你，「你让我活，不止替他。」'; break;
                case 'debt': aff = 9; msg = '他猛地看你，沉静的眼底动了：「……你怎么知道。」他半晌，「我苦行，还他的命。可你来了——这债，我不知怎么还了。」'; break;
                case 'touch': aff = 5; item = 'mat_pearl'; msg = '他没躲。你指尖按在那道旧疤上，他心跳稳得像鼓。许久，他低声：「……你按着它，比苦行还重。」——不是痛，是别的。临走他解下腕上三枚捻了二十年的旧木珠，塞进你手心：「替我捻。想我的时候捻。」'; break;
            }
            return { affection: aff, msg: msg, item: item };
        }
    },
    'jg_event_006': {
        id: 'jg_event_006', npcId: JG_NPC_ID, title: '还命', icon: '⚖️',
        desc: '他说，苦行是为还一段命。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'jg_e006_done',
        autoTrigger: { location: '金刚宗', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '又是苦行崖。他这次没面壁，看着崖下云海。你上山，他没回头。', type: 'description' },
            { speaker: 'npc', text: '「我跟你说了那道疤。」他声音哑，开了口，「那位苦行僧，是我师父。他替我死。我苦行，是想把这条命还——还清了，我才能……」他顿住。' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「才能什么？」', effect: 'ask', affection: 9 },
                { text: '「才能为自己活。」', effect: 'self', affection: 8 },
                { text: '「你不用还。命是你自己的。」', effect: 'own', affection: 8 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'ask': aff = 9; msg = '他许久没说话，喉结动了几下。「……才能，不欠。」他没说完，但你懂——他不欠了，才敢为你活。'; break;
                case 'self': aff = 8; msg = '他猛地看你，眼底有东西碎了：「……你说对了。」他声音哑，「我想还清，才敢为自己——为你活。」他第一次，把「你」和「自己」放在一起。'; break;
                case 'own': aff = 8; msg = '他摇头：「……命不是我自己的。是师父用命换的。」他看你，「可你这么说，我头一回觉得——也许，这条命，也该有我自己一份。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'jg_event_007': {
        id: 'jg_event_007', npcId: JG_NPC_ID, title: '破戒的代价', icon: '⚠️',
        desc: '动情即破戒，破戒伤修为。',
        minAffection: 55, trigger: { random: 0.3 }, cooldown: 0, flag: 'jg_e007_done',
        autoTrigger: { location: '金刚宗', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '金刚塔内。他在诵经，你进去，他停下来。鸠摩智在塔外，冷眼看着。', type: 'description' },
            { speaker: 'npc', text: '「师父。」赫渊起身，对鸠摩智行礼。鸠摩智看他许久，走了，丢下一句：「动情即破戒。你金刚不坏，破一道，再修三年。」' },
            { speaker: 'npc', text: '赫渊没辩。转身看你，沉静的眼：「……破戒伤修为。我知。」他顿了顿，「但我破的，不止戒律。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「那我走。别让你破更多。」', effect: 'leave', affection: 5 },
                { text: '「你破的，是你的道心吗？」', effect: 'ask', affection: 8 },
                { text: '「破戒伤修为，我替你修。」', effect: 'share', affection: 11 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'leave': aff = 5; msg = '他拦住你，难得话多：「……走也没用。戒已经破了。你走了，我修回来——可我不想修回来。」他看你，「你走了，我才真破。」'; break;
                case 'ask': aff = 8; msg = '他沉默良久：「……道心。金刚不坏是身，道心是心。身破了能修，心破了——」他看你，「心破了，修不回。但我不想修回。」'; break;
                case 'share': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 15) : { ok: true };
                    if (!_py.ok) { aff = 4; msg = '你熬到后半夜，他那句话你只接了半句就撑不住歪了头。他替你拢了拢衣袍，没再往下说。（精力不足，那一夜你先撑不住了）'; break; }
                    aff = 11; msg = '他看了你很久，沉静的眼底有了水光——又压下去。「……你替不了。但你这话，比三年苦行还重。」他伸手，第一次主动——握了一下你的手，松开，「我破戒，你陪我修。」' + '（精力-15）'; break; }
            }
            return { affection: aff, msg: msg };
        }
    },
    'jg_event_008': {
        id: 'jg_event_008', npcId: JG_NPC_ID, title: '沉默的真相', icon: '🤐',
        desc: '他承认，闭口禅是怕一开口就乱道心。',
        minAffection: 62, trigger: { random: 0.3 }, cooldown: 0, flag: 'jg_e008_done',
        autoTrigger: { location: '金刚宗', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '苦行崖深夜。他盘坐，你坐他旁边。他罕见地主动开口。', type: 'description' },
            { speaker: 'npc', text: '「我跟你说最后一件事。」他声音哑，「我修闭口禅，不是修行——是怕。怕一开口，就乱道心。」' },
            { speaker: 'npc', text: '「我师父死那夜，我哭了一夜。第二日，我立誓不开口——不乱。」他看你，「可你来了。我开口了。道心乱了——可我不想修回去。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「那就别修回去。」', effect: 'stay', affection: 12 },
                { text: '「你乱的不是道心，是动了心。」', effect: 'heart', affection: 9 },
                { text: '什么都不说，靠他肩上', effect: 'lean', affection: 8 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'stay': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 15) : { ok: true };
                    if (!_py.ok) { aff = 5; msg = '后半夜你实在撑不住，靠着桩子睡着了。醒来时肩上多了一件僧袍，话只说了一半。（精力不足，那一夜你先撑不住了）'; break; }
                    aff = 12; msg = '他看了你很久，沉静的眼底全亮了：「……行。」他难得话多，「我不修回去。这副嗓子，留给你说话。」' + '（精力-15）'; break; }
                case 'heart': aff = 9; msg = '他怔住，许久：「……你看得比我还清。」他低声，「道心乱，是动了心。我动了——为你。我不修回去。」'; break;
                case 'lean': aff = 8; msg = '你没说话，靠他肩上。他浑身僵——肌肉硬得像铁。半晌，他肩松了一线，把头轻轻靠过来。「……你靠着我，比苦行崖的石头暖。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'jg_event_009': {
        id: 'jg_event_009', npcId: JG_NPC_ID, title: '身毁之诺', icon: '🔗',
        desc: '他的金刚身已现毁相，向你讨一个诺。',
        minAffection: 68, trigger: { random: 0.3 }, cooldown: 0, flag: 'jg_e009_done',
        autoTrigger: { location: '金刚宗', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '苦行崖深夜。赫渊赤背盘坐，月光下看得分明——他金刚不坏的身上裂了几道细纹，是连番破戒的代价。身毁，已有相了。', type: 'description' },
            { speaker: 'npc', text: '「金刚身会毁，道心不悔。」他声音哑，「但身毁那日，我有一件事放不下。」' },
            { speaker: 'npc', text: '「跟你讨个诺。」他转头看你，沉静的眼像一口深井，「身毁那日，别让我死在苦行崖。把我抬到金刚塔下——我守了二十年塔，想下去看看人间。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「我应你。身毁那日，我背你下崖，一步不停。」', effect: 'promise', affection: 14 },
                { text: '「你不会身毁。你的命，我替你看着。」', effect: 'guard', affection: 9 },
                { text: '「……这种话，不该对人说吗？」', effect: 'press', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'promise': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 15) : { ok: true };
                    if (!_py.ok) { aff = 6; msg = '崖上夜风硬，你靠着崖壁先睡沉了。醒来时肩上多了一件僧袍，他还面着壁，手里的念珠一颗一颗地捻。（精力不足，那一夜你先撑不住了）'; break; }
                    aff = 14; msg = ('他看了你很久，忽然抬手，在你头顶虚按了一下——很轻，像按一座塔。「……记住你说的。」他收手，从颈间解下三颗旧木珠塞进你掌心：「到时候，捏着珠子喊我法名。我在哪，都听得见。」') + '（精力-15）'; break; }
                case 'guard': aff = 9; msg = '他摇头：「……身会毁的。佛也有涅槃。」但他顿了顿，把臂上金刚线解下一圈，缠上你手腕，「那你应我这个——身毁那日，你留着线。线在，就等于我下了山。」'; break;
                case 'press': aff = 5; msg = '他闭眼，良久，说了两个字：「……不该。」又睁眼看你，「可我说了。守戒二十年，妄语戒，我只对你想破。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'jg_event_010': {
        id: 'jg_event_010', npcId: JG_NPC_ID, title: '鸠摩智的考校', icon: '🐉',
        desc: '鸠摩智当面考你，赫渊替你接了一掌。',
        minAffection: 72, trigger: { random: 0.3 }, cooldown: 0, flag: 'jg_e010_done',
        autoTrigger: { location: '金刚宗', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '金刚塔下，鸠摩智拦住你的去路，抬掌未落：「破戒的人，没资格护人。小辈——你凭什么站在他身边？」', type: 'description' },
            { speaker: 'narrator', text: '掌风未至先压下来，像一座山。你正要硬接，一道灰衣身影挡在身前。', type: 'description' },
            { speaker: 'npc', text: '赫渊赤手接了这一掌，金刚身嗡然如钟鸣。他一字一句，从牙关里挤出来——这是他二十年来说得最长的一段话：「师父。他的资格，我给。我身的戒，为他破；我身的债，为他还。这一掌要落，落我。」' },
            { speaker: 'npc', text: '鸠摩智盯了他半晌，收了掌势：「哦？你给？」他绕着你俩走了半圈，「那老夫看你给不给得起。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '对鸠摩智一礼：「凭不凭，弟子用往后日子证。」', effect: 'respect', affection: 8 },
                { text: '低声对赫渊：「别替我接掌——我自己接一半。」', effect: 'stand', affection: 7 },
                { text: '什么也不说，站到他身侧并肩', effect: 'side', affection: 11 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'respect': aff = 8; msg = '鸠摩智收了掌，盯着你看了很久，忽然笑了：「不讨饶的小辈，胆子不小。」他走后赫渊吐出一口气，背心全是汗，唇角却松了一线：「……你这一礼，替我接了半掌。」'; break;
                case 'stand': aff = 7; msg = '他侧头看你，沉静眼底动了动：「……我的金刚身，不疼。」顿了顿，低声，「但你接一半——疼，就分一半。」他没把你往身后推。'; break;
                case 'side': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 15) : { ok: true };
                    if (!_py.ok) { aff = 4; msg = '掌风余劲掀得你退了几步，眼前发黑。醒来时考校已散，鸠摩智在塔门留了一句「护食护到破戒」。（精力不足，那一场你先撑不住了）'; break; }
                    aff = 11; msg = ('他看了你一眼，没让你退。你上前与他并肩，迎着他没接完的那半掌风。鸠摩智看着你俩，忽然合十：「破戒破到这个份上——也罢，老夫替你们向祖宗禀。」那夜赫渊替你揉肩上掌风震出的淤青，指尖很轻：「……疼，说明身没毁。好。」') + '（精力-15）'; break; }
            }
            return { affection: aff, msg: msg };
        }
    },
    'jg_event_011': {
        id: 'jg_event_011', npcId: JG_NPC_ID, title: '魔反噬', icon: '🌑',
        desc: '心口旧伤里的炼魔之种，反噬了。',
        minAffection: 78, trigger: { random: 0.3 }, cooldown: 0, flag: 'jg_e011_done',
        autoTrigger: { timeRange: [23, 4], location: '金刚宗', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '丑时，赫渊心口那道旧疤突然爆出黑气——五岁那年有人种进他体内的炼魔之种，被金刚气压了二十年，终于在他身毁最甚的夜里反噬。', type: 'description' },
            { speaker: 'narrator', text: '他盘坐在塔下，金刚气与魔气在体内相撕，额上青筋黑一道白一道，手里的念珠一颗一颗崩断。', type: 'description' },
            { speaker: 'player_select', text: '你必须立刻做点什么。', options: [
                { text: '从背后抱住他，以自身真气助金刚气压魔气', effect: 'hold', affection: 14 },
                { text: '捏着那三颗旧木珠，大喊他的法名', effect: 'name', affection: 10 },
                { text: '按住他心口旧疤，以掌心温度引魔气外泄', effect: 'press', affection: 11 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'hold': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 20) : { ok: true };
                    if (!_py.ok) { aff = 6; msg = '魔气燎得你经脉生疼，你撑到半程昏了过去，后半程是他自己熬到天明的。醒来时他还保持着盘坐的姿势，黑气散了，地上的断珠被他一颗一颗拾好了。（精力不足，那一夜你先撑不住了）'; break; }
                    aff = 14; msg = ('你从背后抱住他，真气不要命地渡进他背脉。金刚气借了你的力，把黑气一寸一寸压回旧疤——鸡鸣时，黑气从他心口散尽，像二十年的陈雪化了。他反手把你紧紧攥住，声音哑得不像话：「……债还清了。这条命，往后是我自己的——也是你的。」') + '（精力-20）'; break; }
                case 'name': aff = 10; msg = '你捏着三颗旧木珠，扯着嗓子喊他的法名，一声，两声，第三声——他睁开了眼，沉静的眼底没有魔，只有你。「……听见了。」他说。念珠没再断。'; break;
                case 'press': aff = 11; msg = '你一掌按上他心口旧疤，以体温度引魔气外泄。黑气顺着你掌心退出去，你的手臂麻到肘弯——天亮时他抓过你的手腕把脉，指尖微颤：「……你把毒引了自己一半。我治。这条命往后用来治你。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'jg_event_013': {
        id: 'jg_event_013', npcId: JG_NPC_ID, title: '终章·为你破最后一戒', icon: '💍',
        desc: '他取下金刚线，递给你。',
        minAffection: 85, trigger: { random: 1.0 }, cooldown: 0, flag: 'jg_e013_done',
        endingMap: { '破戒同道': 'jg_ending_破戒同道', '守寺': 'jg_ending_守寺', '禅友': 'jg_ending_禅友', '塔客': 'jg_ending_塔客', '锁心': 'jg_ending_锁心', '错过': 'jg_ending_错过' },
        scenes: [
            { speaker: 'narrator', text: '金刚塔内。赫渊把右臂上缠了二十年的金刚线，一圈一圈解下，递到你面前。', type: 'description' },
            { speaker: 'npc', text: '「这是金刚宗守戒僧的线。」他声音哑，话多，「我缠了二十年——今日解了。戒，我破了最后一道。」' },
            { speaker: 'npc', text: '「{playerName}。」他把线推向你，松开了掌中的另一头，「这线离了手，就没打算收回来。断在谁手里，就算谁的。」' },
            { speaker: 'player_select', text: '你的选择将决定你们的关系走向', options: [
                { text: '「要。我带你下山——破戒证道，哪里有苦难就去哪里。」', effect: 'lover_travel', affection: 30 },
                { text: '「要。但哪儿也不去。我留在金刚宗，陪你守每一座塔。」', effect: 'lover_stay', affection: 28 },
                { text: '「线我接。人就算了——我做你炼体的对手，年年金刚宗论体。」', effect: 'friend', affection: 20 },
                { text: '「线我接。塔门给我留道缝——年年扫塔我来搭手，不谈风月，只谈同修。」', effect: 'friend_stay', affection: 18 },
                { text: '「我都不要。我只是个路过的香客。」', effect: 'none', affection: 0 }
            ]}
        ],
        effects: function(npc, choice) {
            // v20.25 门槛 5→3：三度伤透即寒心（旧 5 门槛对本线数学不可达，坏结局形同虚设）
            // v20.71 辜负独立成结局「锁心」：伤透的心与单纯的错过分开记账
            var negCount = (window._negativeChoiceCount && window._negativeChoiceCount[JG_NPC_ID]) || 0;
            if (negCount >= 3 && (choice === 'lover_travel' || choice === 'lover_stay')) {
                return { affection: 0, msg: '他看着你，把金刚线一圈一圈重新缠回右臂——最后一圈，勒在心口的位置。「……我解了二十年，等的是这么一句。」他合十，眼里那点活气一寸一寸沉下去：「你走吧。线缠回来了，心，也锁了。」', ending: '锁心' };
            }
            switch (choice) {
                case 'lover_travel': return { affection: 30, msg: '他怔了半晌，沉静的眼底全亮了：「……好。下山。」他把线塞进你掌心，「我守了二十年戒，头一回——为一个人破。」', ending: '破戒同道' };
                case 'lover_stay': return { affection: 28, msg: '他点头，把线和你一起拢进怀里：「……行。金刚塔下，往后有两盏灯。」他声音哑，「你陪我守——我不守戒，守你。」', ending: '守寺' };
                case 'friend': return { affection: 20, msg: '他罕见地笑了一下，沉静里裂一线暖：「论体对手？行。」他把线塞你手里，「那你接得住我一掌龙象般若再说。」', ending: '禅友' };
                case 'friend_stay': return { affection: 18, msg: '「留道缝？」他顿了一下，合十，「行。门缝我留，扫帚你拿。」他把线绕上你手腕一圈，「论体的日子你记着——掌我出，药你上。」', ending: '塔客' };
                case 'none': return { affection: 0, msg: '他沉默了很久，把线重新缠回臂上。「……也好。」他声音恢复哑，「金刚塔的门，我照常闭。路过的香客，金刚宗不缺。」', ending: '错过' };
            }
            return { affection: 0, msg: '' };
        }
    }
};

var JG_ENDINGS = {
    'jg_ending_破戒同道': {
        id: 'jg_ending_破戒同道', npcId: JG_NPC_ID, title: '结局·破戒同道', icon: '📿', route: '破戒同道',
        scenes: [
            { speaker: 'narrator', text: '三日后，赫渊把法王继承人之印交还鸠摩智，一并解下的还有从小缠在腕上的旧数珠。鸠摩智收了印，没接数珠：「还俗的人，念不起我这本经了。」', type: 'description' },
            { speaker: 'npc', text: '「塔托付给您了。」他背一行囊，跟你并肩下山，「我自个儿，就是一具破戒的肉身。」' },
            { speaker: 'narrator', text: '多年后，江湖有「破戒双圣」的传说：一人破戒证道，一人护人证心。专渡苦厄。', type: 'description' },
            { speaker: 'narrator', text: '有人见过他们在荒村的夜里歇脚。他难得没缠金刚线，靠在{playerTa}肩上打了个盹——戒疤在月光下亮着。他不守戒了，因为守的人在身边。', type: 'description' }
        ],
        finalText: '——— 结局·破戒同道（道侣·同行）———'
    },
    'jg_ending_守寺': {
        id: 'jg_ending_守寺', npcId: JG_NPC_ID, title: '结局·守寺', icon: '🏡', route: '守寺',
        scenes: [
            { speaker: 'narrator', text: '你留在了金刚宗。金刚塔的门，从那夜起再没闭过。', type: 'description' },
            { speaker: 'narrator', text: '塔里多了一个人擦塔的位置，苦行由他修，灯由你点。', type: 'description' },
            { speaker: 'npc', text: '「火对了。」他看塔灯，「亮——正好。」他看你，沉静里有暖，「你点的，比师父亮。」' },
            { speaker: 'narrator', text: '鸠摩智偶尔路过塔，看这场景，嘀咕一句「塔里人气旺了」，走了。但走时步子慢了些。', type: 'description' },
            { speaker: 'narrator', text: '苦行崖再不冷——两盏灯，一具破戒的肉身。', type: 'description' }
        ],
        finalText: '——— 结局·守寺（道侣·归隐）———'
    },
    'jg_ending_禅友': {
        id: 'jg_ending_禅友', npcId: JG_NPC_ID, title: '结局·禅友', icon: '🤝', route: '禅友',
        scenes: [
            { speaker: 'narrator', text: '你们成了江湖闻名的炼体搭档。年年金刚宗论体，胜负各半。', type: 'description' },
            { speaker: 'npc', text: '「今年这一掌，比去年沉。」他收拳，「……再松几年，你就能接住我龙象般若了。」' },
            { speaker: 'narrator', text: '有人问你们是什么关系。他合十「同修」，{playerTa}答「同修」。说完两人对视，都先笑了——沉静里裂一线暖。', type: 'description' }
        ],
        finalText: '——— 结局·禅友（挚友·同行）———'
    },
    'jg_ending_塔客': {
        id: 'jg_ending_塔客', npcId: JG_NPC_ID, title: '结局·塔客', icon: '🧹',
        route: '塔客',
        scenes: [
            { speaker: 'narrator', text: '{playerTa}成了金刚塔下的常客。塔门永远留着一道缝——缝的大小，正好过一个人。', type: 'description' },
            { speaker: 'narrator', text: '每年扫塔，两个人一帚一桶：他擦塔身，{playerTa}扫塔院。论体的日子，掌他出，药{playerTa}上。', type: 'description' },
            { speaker: 'npc', text: '「今日这一掌，收了三成力。」他收掌，合十，「……你接得住五成的那天，塔门给你开整扇。」' },
            { speaker: 'narrator', text: '鸠摩智有回问{playerTa}：「你算他什么？」{playerTa}想了想：「塔客。」老僧盯了{playerTa}半晌，忽然合十：「破戒的人肯为谁留门缝——施主，你赢了。」', type: 'description' }
        ],
        finalText: '——— 结局·塔客（挚友·归隐）———'
    },
    'jg_ending_锁心': {
        id: 'jg_ending_锁心', npcId: JG_NPC_ID, title: '结局·锁心', icon: '🔒',
        route: '锁心',
        scenes: [
            { speaker: 'narrator', text: '金刚线被他一圈一圈缠回右臂——最后一圈，勒在心口旧疤的位置。像锁一道门。', type: 'description' },
            { speaker: 'narrator', text: '第二日，他入金刚塔底死关。塔门是他自己闭的，缝也没留。', type: 'description' },
            { speaker: 'narrator', text: '三年后他出关，金刚不坏身圆满，话更少了——闭口禅，重新修起。', type: 'description' },
            { speaker: 'narrator', text: '鸠摩智说，他那日入关前只留了一句话：「这一回，不是身毁，是心锁。」钥匙他丢在了塔底——没人再捡得起来。', type: 'description' }
        ],
        finalText: '——— 结局·锁心（辜负）———'
    },
    'jg_ending_错过': {
        id: 'jg_ending_错过', npcId: JG_NPC_ID, title: '结局·错过', icon: '🏔️', route: '错过',
        scenes: [
            { speaker: 'narrator', text: '后来你还是去过几次金刚宗。塔门开着，他对你客气，沉静如常，像个对远来香客。', type: 'description' },
            { speaker: 'narrator', text: '那圈解下的金刚线，被重新缠回他右臂，再没解过。', type: 'description' },
            { speaker: 'narrator', text: '再后来，江湖偶有传闻——金刚宗法王继承人炼体愈发精深，只是再没人见他，为谁解过那圈金刚线。', type: 'description' }
        ],
        finalText: '——— 结局·错过（错过）———'
    }
};

var JG_GENDER_CTX_EVENTS = {
    'jg_event_femctx': {
        id: 'jg_event_femctx', npcId: JG_NPC_ID, title: '塔内女修', icon: '📿',
        desc: '密宗金刚护法把你叫住了。',
        minAffection: 55, trigger: { random: 0.35 }, cooldown: 0, flag: 'jg_e_femctx_done',
        requirePlayerFemale: true,
        autoTrigger: { location: '金刚宗', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '密宗金刚护法把你叫到塔后，难得没板脸。', type: 'description' },
            { speaker: 'npc', text: '「姑娘。」护法开门见山，「金刚宗的女修少，苦行崖的活苦——净渊那小子，对谁都沉静，可对谁都沉静，就是谁都不近。我怕你跟着他，沉静成伤。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「他沉静成伤，我认。我自己暖。」', effect: 'warm', affection: 8 },
                { text: '「护法，我自愿的。」', effect: 'accept', affection: 7 },
                { text: '「您是怕他伤我，还是怕他破戒？」', effect: 'probe', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'warm': aff = 8; msg = '护法点头：「……你能自暖，倒比他强。」他拍你肩，「那小子的沉静底下藏戒，你看得见就行——别替他扛。」'; break;
                case 'accept': aff = 7; msg = '护法叹气：「自愿的……好。」他背手，「塔门，给你留着。沉静成伤，别怨他。」'; break;
                case 'probe': aff = 6; msg = '护法看了你半晌：「……两样都怕。」他走了，丢下一句，「他破戒不破戒我看不见，他伤不伤你——我看得见。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'jg_event_mctx': {
        id: 'jg_event_mctx', npcId: JG_NPC_ID, title: '塔内两个男修', icon: '📿',
        desc: '密宗金刚护法把你拦下了。',
        minAffection: 55, trigger: { random: 0.35 }, cooldown: 0, flag: 'jg_e_mctx_done',
        requirePlayerMale: true,
        autoTrigger: { location: '金刚宗', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '塔后，密宗金刚护法把你拦下，左右看了一眼，压低声。', type: 'description' },
            { speaker: 'npc', text: '「师弟。」他盯着你，「你跟净渊……塔里两个大男人成天苦行，金刚宗都传开了。」' },
            { speaker: 'npc', text: '「我不是说这不好。我是说，江湖上两个男修同行，嘴比戒疤还毒——你受得住，他受得住吗？他那个沉静，护短护得狠，护不住自己。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「他护短，我扛事。嘴归嘴。」', effect: 'defy', affection: 8 },
                { text: '「护法，我们还没到那一步。」', effect: 'deny', affection: 3 },
                { text: '「他要是被嚼舌根，我先炼体。」', effect: 'shield', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'defy': aff = 8; msg = '护法点头：「……行。你扛得住。」他拍你肩，「嘴归嘴，谁敢动你们，先过我——我跟净渊一个塔里长大。」'; break;
                case 'deny': aff = 3; msg = '护法看了你一眼，没多说：「……没到那一步。」他背手走了，「那行。但他记你，我看得见——沉静底下，藏不住。」'; break;
                case 'shield': aff = 7; msg = '护法笑了：「你倒护他。」他想了想，「他那沉静，真有人嚼舌根，他自己先炼体——你跟他，倒是一样。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    }
};

if (typeof NPC_PERSONAL_EVENTS !== 'undefined') {
    Object.assign(NPC_PERSONAL_EVENTS, JG_MAIN_EVENTS);
    Object.assign(NPC_PERSONAL_EVENTS, JG_GENDER_CTX_EVENTS);
}
if (typeof registerEndingSet === 'function') registerEndingSet(JG_NPC_ID, JG_ENDINGS);
if (typeof registerEndingCallback === 'function') {
    registerEndingCallback(JG_NPC_ID, function(endingName, npc) {
        if (endingName === '破戒同道' || endingName === '守寺') {
            if (npc && typeof npc.setFlag === 'function') npc.setFlag('dao_companion');
            if (window.showMessage) window.showMessage('📿 你与赫渊结为道侣！炼体感悟大幅提升', 'success');
        } else if (endingName === '禅友' || endingName === '塔客') {
            if (npc && npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 30);
            if (window.showMessage) window.showMessage('📿 你与赫渊成了彼此最信得过的炼体搭档', 'success');
        } else if (endingName === '锁心') {
            if (window.showMessage) window.showMessage('🔒 赫渊把金刚线缠回了心口。有些人锁了心，钥匙就再没人找得到', 'error');
        }
    });
}

if (typeof window !== 'undefined' && window.MALE_LEAD_ROSTER) {
    window.MALE_LEAD_ROSTER.push({ id: JG_NPC_ID, name: '赫渊', sect: '金刚宗', eventId: 'jg_event_rival', reconcileId: 'jg_event_reconcile', femctxId: 'jg_event_femctx', mctxId: 'jg_event_mctx' });
}

function maybeAutoTriggerJgEvent(source) { return maybeAutoTriggerPersonalEvent(JG_NPC_ID, source, { finalEvents: ['jg_event_013'] }); }
if (typeof window !== 'undefined' && window.timeSystem && window.timeSystem.onNewDaySubscribe) {
    window.timeSystem.onNewDaySubscribe(function() {
        try {
            if (!window.currentCharData || !window.npcManager) return;
            if (window.currentCharData.location === '金刚宗') maybeAutoTriggerJgEvent('daily');
            if (window.currentCharData.location !== '金刚宗') return;
            var npc = window.npcManager.getNPC ? window.npcManager.getNPC(JG_NPC_ID) : null;
            if (!npc) return;
            var aff = (npc.relationship && npc.relationship.affection) || 0;
            if (aff < 55) return;
            var isF = window.currentCharData.gender === 'female';
            var ctxId = isF ? 'jg_event_femctx' : 'jg_event_mctx';
            if (typeof hasEventTriggered === 'function' && hasEventTriggered(ctxId)) return;
            var ev = NPC_PERSONAL_EVENTS[ctxId];
            if (!ev) return;
            if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npc)) return;
            setTimeout(function() {
                if (document.querySelector && document.querySelector('.personal-event-modal')) return;
                if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npc)) return;
                if (typeof triggerPersonalEvent === 'function') triggerPersonalEvent(ctxId);
            }, 1200);
        } catch (e) { console.warn('[赫渊线] 每日触发失败:', e); }
    });
}

if (typeof window !== 'undefined') {
    window.JG_MAIN_EVENTS = JG_MAIN_EVENTS;
    window.JG_ENDINGS = JG_ENDINGS;
    window.maybeAutoTriggerJgEvent = maybeAutoTriggerJgEvent;
}
console.log('[赫渊线] 金刚宗男主线加载完成：结局 ' + Object.keys(JG_ENDINGS).length + ' 个 + 主线事件 ' + Object.keys(JG_MAIN_EVENTS).length + ' 个 + 性别语境 ' + Object.keys(JG_GENDER_CTX_EVENTS).length + ' 个');
