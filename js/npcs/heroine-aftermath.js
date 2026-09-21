// ==================== heroine-aftermath.js - 道侣回访（结契后）事件 v1.0 ====================
// 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / triggerPersonalEvent /
//       canPlayerAccessPersonalEvent / hasEventTriggered）
//       npcs/npc-system.js（npc.hasFlag('dao_companion')）
// 加载顺序：在二十位女主角事件文件之后（v20.76：恒山/泰山/青城/衡山四位新女主回访接入；
//   v20.77：血手门·耿雪衣 / 飞蝎坞·拓银沙 / 烈日教·伏璃茵 / 天龙教·檀望舒 四位新女主回访接入；
//   v20.78：神机门·戚巧机 / 铁掌帮·裘霜莺 / 昆仑派·姬云锦 / 全真教·翀玉衡 四位新女主回访接入。
//   反派阵营纪律：回访场景在各自主场（药庐/蝎房/圣火龛/传声房），组织黑暗只做氛围侧写；
//   檀望舒回访台词全程带「（用XX的调子）」标注、本声不作台词出现；伏璃茵回访不写她哭。
//   v20.78 纪律：回访场景在各自主场（工坊/窑棚/舞台/功录房），专属语言系统与吃醋桩同一套——
//   sj＝误差/齿比/滴答/雀课，tz＝哨语/凶脸/素坯哨，kl＝舞谱/名目/读舞（零乐器），qz＝记账/利息/两讫（零酒字））
//   v20.79：少林寺·竺照禅 回访接入。回访场景在主场栴檀林；专属语言系统与吃醋桩同一套——
//   shao＝批注/功课/佛号/戒律（批注经＋念珠两样信物；恒山比丘尼线的整套功课法器一概不碰，两不相犯）。
//
// 设计宪法：终章结局演出后，道侣关系不该戛然而止。结契后回访——
//   须已与该女主角结为道侣（requireDaoCompanion）、终章已发生、人在该派过夜、一次性。
//   安静收束 + 小幅真实增益（真元/信任），复用既有状态，无人为配额。
//   绯泪线男女玩家皆可回访（v20.25 更正旧注）：修罗宫明面收情伤女子，但有宫主亲出的
//   男线破例（sect-join-flow.js xiuluoMaleTrialAttempt，同套情伤四问、通过分更高）；
//   结契旗自 v20.25 起由修罗宫终章结局回调落下，回访门禁只认旗、不认性别。

var AFTERMATH_EVENTS = {
    // ---- 温蘅：药庐晨光 ----
    'bh_event_aftermath': {
        id: 'bh_event_aftermath', npcId: 'sect_leader_百花谷', title: '药庐晨光', icon: '🌸',
        desc: '结契后头一个清晨，药庐的灯还亮着。',
        minAffection: 80, trigger: { random: 1.0 }, cooldown: 0, flag: 'bh_e_aftermath_done',
        requireDaoCompanion: true, requireEventDone: 'bh_event_014',
        scenes: [
            { speaker: 'narrator', text: '结契后头一个清晨。你醒来时，药庐的灯还亮着——她比你还早，正在配药，听见你动静，没回头。', type: 'description' },
            { speaker: 'npc', text: '「醒了？」温蘅笑眼弯弯，把一碗温着的药茶推到你手边，「医者的道侣，得先学会一件事——」她点你额头一指，「别让自己病。你病了，我分心。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「那你以后别一个人守夜配药。我替你盯着。」', effect: 'share', affection: 6 },
                { text: '喝一口药茶：「苦。」', effect: 'bitter', affection: 5 },
                { text: '拉过她的手：「你也别累着。」', effect: 'care', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'share': aff = 6; msg = '她怔了怔，笑了：「……行。两个守夜的人。」她把配药的活分了一半给你——笨手笨脚，她没嫌弃，只在你切歪的药根上轻轻一扶。药庐的灯，从那夜起是两盏。'; break;
                case 'bitter': aff = 5; msg = '她弯了弯眼：「苦就对了。苦入心，去火。」她替你把碗收走，又塞了一颗蜜饯，「道侣的药，也得有人哄着喝。」'; break;
                case 'care': aff = 7; msg = '她没抽手，指尖在你掌心停了一瞬：「……我知道。」她轻声，「二十年了，头一次有人这么跟我说。」她反手握了握你，「一起，别累着。」'; break;
            }
            if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            if (typeof window.addEssence === 'function') window.addEssence(8); // 道侣共修，真元+8
            return { affection: aff, msg: msg };
        }
    },
    // ---- 绯泪：簪与人 ----
    'xl_event_aftermath': {
        id: 'xl_event_aftermath', npcId: 'sect_leader_修罗宫', title: '簪与人', icon: '🩸',
        desc: '她把修好的簪子，插进了你的发髻。',
        minAffection: 80, trigger: { random: 1.0 }, cooldown: 0, flag: 'xl_e_aftermath_done',
        requireDaoCompanion: true, requireEventDone: 'xl_event_033',
        scenes: [
            { speaker: 'narrator', text: '结契后，她在妆台前叫你坐下。那根修好的玉簪——金线缠着断裂处——她捏了很久。', type: 'description' },
            { speaker: 'npc', text: '——别动。' },
            { speaker: 'narrator', text: '她绕到你身后，把簪子轻轻插进你的发髻。指腹在你鬓角停了一瞬，凉的。', type: 'description' },
            { speaker: 'npc', text: '——从前这簪子，是我一个人的疤。她声音很轻，如今它在『我们』头上。以后你戴它，我戴你。' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「那我以后，也替你梳头。」', effect: 'comb', affection: 7 },
                { text: '「绯泪，这簪子以后不断了。」', effect: 'promise', affection: 8 },
                { text: '转身把她拉到镜前：「我也替你戴。」', effect: 'mirror', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'comb': aff = 7; msg = '她僵了一瞬——她从不让人碰她头发。半晌，她背对你坐下：「……梳。」从那以后，修罗宫的妆台前，是两个人。'; break;
                case 'promise': aff = 8; msg = '她看着镜中你的影，许久没说话。然后她极轻地「嗯」了一声——这是她信过的最重的一个字。'; break;
                case 'mirror': aff = 6; msg = '她被你按在妆台前，瞪了你一眼，没挣。你替她插簪时，她从镜里看你，绯红眼底第一次没有寒意，只有人。'; break;
            }
            if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            if (typeof window.addEssence === 'function') window.addEssence(8);
            return { affection: aff, msg: msg };
        }
    },
    // ---- 琤霄凌：双剑晨练 ----
    'ts_event_aftermath': {
        id: 'ts_event_aftermath', npcId: 'sect_leader_天山派', title: '双剑晨练', icon: '❄️',
        desc: '雪庐外，她在等你一起练剑。',
        minAffection: 80, trigger: { random: 1.0 }, cooldown: 0, flag: 'ts_e_aftermath_done',
        requireDaoCompanion: true, requireEventDone: 'ts_event_013',
        scenes: [
            { speaker: 'narrator', text: '结契后，你习惯了雪庐外那道霜白身影。她已在等你，霜鸣横于身前，旁边插着一柄——你的剑。', type: 'description' },
            { speaker: 'npc', text: '「来。」霄凌还是只一个字，但剑尖朝你一摆，是邀你拔剑。「师姐让我把它练成。如今我替她，再教一个人。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '拔剑，与她同练「雪落」', effect: 'spar', affection: 7 },
                { text: '「师叔，我想学霜鸣那一式。」', effect: 'learn', affection: 6 },
                { text: '不拔剑，只看她练', effect: 'watch', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'spar': aff = 7; msg = '两柄剑在雪光里划出同一道弧——你的雪落，终于不软了。她收剑，难得露出少年气：「……成了。」霜鸣在鞘中轻鸣一声，像在应。'; break;
                case 'learn': aff = 6; msg = '她看了你一眼：「霜鸣认了主才肯出鞘。它认你——但它那一式，得我用命教。」她拔出霜鸣半寸，剑身那道裂纹在雪光下，已是愈合的疤。「来，我教你。」'; break;
                case 'watch': aff = 5; msg = '她舞了一阵霜鸣，剑风扫开半圈雪。收剑时她看你：「……不练？」她把剑递给你，「守剑的人也得练剑。来。」——她握着你的手，带你过了第一式。'; break;
            }
            if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            if (typeof window.addEssence === 'function') window.addEssence(8);
            return { affection: aff, msg: msg };
        }
    },
    // ---- 蓝凤凰：减药之后 ----
    'wx_event_aftermath': {
        id: 'wx_event_aftermath', npcId: 'sect_leader_五仙教', title: '减药之后', icon: '🦋',
        desc: '结契后，她的忘情散又减了一丸。',
        minAffection: 80, trigger: { random: 1.0 }, cooldown: 0, flag: 'wx_e_aftermath_done',
        requireDaoCompanion: true, requireEventDone: 'wx_event_013',
        scenes: [
            { speaker: 'narrator', text: '结契后第七日。药庐里，她把忘情散的药碗端起来——又放下。锁骨下的银蝶安静地停着。', type: 'description' },
            { speaker: 'npc', text: '「……今日这丸，我不饮了。」蓝凤凰妖媚地笑，凤目却认真，「心蛊认了你作主，化成了蝶——它不再嗜我真情，我也再不必压。散，可以停了。」' },
            { speaker: 'npc', text: '她把药碗推到你面前：「你替我倒掉。这一碗，倒了，就是我往后不必再为情偿命的记号。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '把药倒进土里', effect: 'dump', affection: 8 },
                { text: '「留半丸，以防万一。」', effect: 'keep_half', affection: 6 },
                { text: '把碗收进她手里：「这碗，你自己决定。」', effect: 'her_choice', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'dump': aff = 8; msg = '药流进土里，黑糊糊化开。她看着，许久，忽然笑了——笑得有泪：「……十八年。头一回，不用饮这玩意儿活。」银蝶在她锁骨下振翅，像在替她高兴。'; break;
                case 'keep_half': aff = 6; msg = '她怔了一下：「……你倒谨慎。」她点头，「行。留半丸。但不是为压情——是为哪天我犯了糊涂，你拿它砸我。」她笑了，「砸醒我。」'; break;
                case 'her_choice': aff = 7; msg = '她看着碗，又看你。「……你这人。」她把碗端起来，自己倒进了土里，「我的命，我自己定。但你让我自己定——这比什么都重。」银蝶落在她指尖。'; break;
            }
            if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            if (typeof window.addEssence === 'function') window.addEssence(8);
            return { affection: aff, msg: msg };
        }
    },
    // ---- 夙孤鸿：金顶晨光（v20.73 峨眉入册） ----
    'em_event_aftermath': {
        id: 'em_event_aftermath', npcId: 'sect_leader_峨眉派', title: '金顶晨光', icon: '🪷',
        desc: '结契后头一个清晨，她练完剑，素茶给你温了一盏。',
        minAffection: 80, trigger: { random: 1.0 }, cooldown: 0, flag: 'em_e_aftermath_done',
        requireDaoCompanion: true, requireEventDone: 'em_event_013',
        scenes: [
            { speaker: 'narrator', text: '结契后头一个清晨。金顶云海未散，她已经练完了剑——鸣鸿归鞘，剑案边温着一盏素茶，是给你的。', type: 'description' },
            { speaker: 'npc', text: '「醒了。」夙孤鸿擦着剑，语气如常，只是今晨没念晨戒。——后来你才知道：那日她把戒六条里的「不弃」，多诵了三遍。' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「往后金顶夜巡，我陪你走。你点名，我掌灯。」', effect: 'share', affection: 6 },
                { text: '取出那把木戒尺，在第七条的空白处，写下今日的日子', effect: 'carve', affection: 7 },
                { text: '把自己的外袍披到她肩上：「晨雾凉。」', effect: 'care', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'share': aff = 6; msg = '她一怔，点头，从剑案后取出第二盏灯笼——新的，糊纸都还没上。「灯早备下了。」她把灯笼递给你，灯笼骨是凉的，她指尖是热的，「今夜起，金顶点名多念一个名字。——你的，和我的。」从此金顶夜巡的台阶上，多了一前一后两盏灯，谁也没熄过。'; break;
                case 'carve': aff = 7; msg = '你取出木戒尺，就着朱砂，在第七条的空白处写下今日的日子。她看着你写完，把尺接过去，看了很久——收进了怀里，不是剑案。「……写的什么。」她问，明明看见了。你说：第七条，我替你刻了，刻的是今日。她别过脸去看云海，半晌，肩线松了一寸：「戒不欺人。」她声音很轻，「你也不许。」'; break;
                case 'care': aff = 5; msg = '你把外袍披上她的肩。她没拂开——持戒十年的人，头一回在金顶上受了别人的暖。「……我惯了凉。」她说，手却把袍子拢紧了半寸。云海在天边裂开一线，第一缕晨光落在两个人身上，她眯了眯眼，「天亮了。」她说，「往后的天亮，我都与你一起看。」'; break;
            }
            if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            if (typeof window.addEssence === 'function') window.addEssence(8); // 道侣共修，真元+8
            return { affection: aff, msg: msg };
        }
    },
    // ---- 晏万解：炉前粥（v20.74 唐门入册） ----
    'tm_event_aftermath': {
        id: 'tm_event_aftermath', npcId: 'sect_leader_唐门', title: '炉前粥', icon: '🥣',
        desc: '结契后头一个清晨，炉上温的不是药，是粥。',
        minAffection: 80, trigger: { random: 1.0 }, cooldown: 0, flag: 'tm_e_aftermath_done',
        requireDaoCompanion: true, requireEventDone: 'tm_event_013',
        scenes: [
            { speaker: 'narrator', text: '结契后头一个清晨。毒堂偏院的小炉上温着一口砂锅——不是药，是粥，米香里混着一线药气。她坐在炉前，手套褪下来搁在膝上，空着那双带青痕的手，一枚一枚地拣米里的谷壳。你手上还戴着她缝的那双布手套——结契那夜起，你就没摘过。', type: 'description' },
            { speaker: 'npc', text: '「醒了。」晏万解头也不抬，「粥是我煮的，没下毒。你若嫌淡——下一回我给你搁三分砒霜提味。」她说完自己先绷不住，耳根红了，把砂锅推过来，「……空手煮的。手抖了三回，米洒了半捧。你尝尝，成不成。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '喝一口：「淡。往后我天天喝这碗淡的。」', effect: 'taste', affection: 7 },
                { text: '隔着自己的布手套，握住她空着的那只手', effect: 'barehand', affection: 6 },
                { text: '把膝上那双手套拿起来，替她一只一只戴回去', effect: 'glove_on', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'taste': aff = 7; msg = '你喝了一口。淡，米粒煮得开了花，锅底却有一层薄薄的焦香。她盯着你的脸色看，比验毒还紧张：「成不成？」你说淡，往后天天喝这碗淡的。她愣了愣，忽然把整口砂锅推到你面前，起身就往里屋走：「……天天。」走到门口又回头，耳根通红，毒舌到底没绷住，「天天喝，天天嫌淡——你这个人，嘴比我还毒。」从那日起，毒堂偏院的清晨，炉上先温粥，后温药。'; break;
                case 'barehand': aff = 6; msg = '你隔着自己的布手套，握住她空着的那只手。她僵了一瞬——二十二年浸毒的手，头一回这样被人握着，隔一层棉布，还是热的。「……空手碰不得人。」她声音低下去，「我练了很久。空手拣米，空手执壶，空手翻药谱——就是不敢空手碰你。」她反手扣住你的指节，扣得很用力，「你倒好。一来就替我练成了。」炉上的粥咕嘟了一声，谁也没去管。'; break;
                case 'glove_on': aff = 5; msg = '你把那双手套拿起来，替她一只一只戴回去。她没挣，只在你替她理平指缝时轻轻叹了口气：「……你替我戴回去，我这双手几时练得成空手碰人。」话是抱怨，手却任你摆弄。戴好了，她低头看着自己的手，看了半晌，忽然又一只一只褪下来，搁回膝上——然后空着手，捧起你的脸。「今日不戴。」她说，「粥凉了我重煮。你在，我不怕伤人。」'; break;
            }
            if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            if (typeof window.addEssence === 'function') window.addEssence(8); // 道侣共修，真元+8
            return { affection: aff, msg: msg };
        }
    },
    // ---- 瀛晚照：岸上人（v20.75 蓬莱入册） ----
    'pl_event_aftermath': {
        id: 'pl_event_aftermath', npcId: 'sect_leader_蓬莱派', title: '岸上人', icon: '🌅',
        desc: '结契后头一个清晨，观汐台的录案边摆着两把椅。',
        minAffection: 80, trigger: { random: 1.0 }, cooldown: 0, flag: 'pl_e_aftermath_done',
        requireDaoCompanion: true, requireEventDone: 'pl_event_013',
        scenes: [
            { speaker: 'narrator', text: '结契后头一个清晨。你醒来时身边已空——她在观汐台上。录案边摆着两把椅，左手那把椅脚垫着石，极稳。晨潮刚退一线。你上台时，她给你的那只旧螺在怀里贴着心口，是温的。', type: 'description' },
            { speaker: 'npc', text: '「醒了。」瀛晚照没有回头，笔尖不停，「卯时二刻，潮退一线。」录完这一笔，她才转身，把新册推到你面前——页首多了一栏，栏上三个字：岸上人。栏下只有一个名字：你的。「昨夜起，这一栏立了。」她说得平，那三个字的笔迹却比潮信还工整，「规矩我定死：这一栏，一辈子只录一个人。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '在左手那把椅上坐下，提笔，陪她录完这一笔晨潮', effect: 'record', affection: 7 },
                { text: '「往后黄昏录海市，你执笔，我掌灯。」', effect: 'lamp', affection: 6 },
                { text: '取出那只旧螺，贴到她耳边：「潮来了。你听。」', effect: 'shell', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'record': aff = 7; msg = '你在左手那把椅上坐下，提笔蘸墨。她报，你录——「卯时三刻，潮涨半线。」两人一报一录，录到晨潮尽。她接过册子核对，指腹在页脚停住：字不是她的，一笔一笔却实。「……不差。」她合上册子，眼角松了半线，像退潮。从这个清晨起，观汐台的录，是两个人录的——她报数，你执笔，灯归两个人掌。'; break;
                case 'lamp': aff = 6; msg = '「掌灯。」她把这两个字重复了一遍，搁下笔想了想，翻开新册记了一笔：「黄昏，录海市，掌灯一人。」记完抬头看你，耳根微红，话还是平的：「灯油在台下储物间，每晚三两——这个数，你记着。」晨风从海上上来。从不用形容词的人，今朝在潮信后头，添了一个不是数目的字：「稳。」'; break;
                case 'shell': aff = 5; msg = '你取出旧螺，贴到她耳边。她一怔——这只螺她听了二十年，给了你之后，自己一回也没再听过。潮声一层，又一层。她听了很久，抬眼时眼里是亮的：「……潮来了。」你说：听见潮，就是我在想你——这话你说过，今日还给你。她转头看海，肩线一寸一寸松下来，半晌，很轻地说：「这一笔，我不入录。」顿了顿，「入录的都是真的。这一笔，比真的还多一层。」'; break;
            }
            if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            if (typeof window.addEssence === 'function') window.addEssence(8); // 道侣共修，真元+8
            return { affection: aff, msg: msg };
        }
    },
    // ---- 祁清禅：晨钟两个人（v20.76 恒山入册） ----
    'heng_event_aftermath': {
        id: 'heng_event_aftermath', npcId: 'sect_leader_恒山派', title: '晨钟两个人', icon: '🕯️',
        desc: '结契后头一个清晨，晨钟落下来，木鱼在你手边。',
        minAffection: 80, trigger: { random: 1.0 }, cooldown: 0, flag: 'heng_e_aftermath_done',
        requireDaoCompanion: true, requireEventDone: 'heng_event_013',
        scenes: [
            { speaker: 'narrator', text: '结契后头一个清晨。你醒来时晨钟正一声一声落下来——她已经做完了早课，那只旧木鱼摆在你枕边，铜锔的裂贴着木头，还带着她掌心的温度。灯下，那页回向页摊开着，最后一行墨迹未干：「回向十方众生——及眼前一人。」', type: 'description' },
            { speaker: 'npc', text: '「醒了。」祁清禅在收经页，声音轻得像常，只是今晨没有先念功课。——后来你才知道：那日她把这页回向，重新誊了一遍，誊了两遍。' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「往后晨钟你敲木鱼，山门头一炷香归我上。」', effect: 'share', affection: 7 },
                { text: '取出木鱼敲一声，听她就着这一声念一句佛号', effect: 'fish', affection: 6 },
                { text: '把自己的外袍披到她肩上：「山里的早晨凉。」', effect: 'care', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'share': aff = 7; msg = '她一怔，随即极轻地笑了一下：「香重，你端得稳么？」你说端得稳。她把头一炷香递进你手里，又亲手扶了你一扶。从这日起，白云庵的晨钟里多了一炉香——她敲木鱼，你上香，钟落香起，谁也没有误过一回。'; break;
                case 'fish': aff = 6; msg = '你敲了一声，她就着这一声念了一句佛号——两个声音一高一低，缠在晨钟里。她听了很久，忽然说：「六年晚课，都是我一个人敲。如今——它有回音了。」她把木鱼往你手里推了推，替你把手指一根一根合拢。「收着。听见木鱼，就是我在替你念——往后，不必隔着山。」'; break;
                case 'care': aff = 5; msg = '你把外袍披上她的肩。她没拂开——持戒十年的人，头一回在早课里受了别人的暖。「……我惯了凉。」她说，手却把袍子拢紧了半寸。晨钟落完最后一声，头一缕晨光过山门，落在两个人身上。她眯了眯眼：「钟完了。」她说，「往后的晨钟，我都与你一起听。」'; break;
            }
            if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            if (typeof window.addEssence === 'function') window.addEssence(8); // 道侣共修，真元+8
            return { affection: aff, msg: msg };
        }
    },
    // ---- 岳清晓：火坛左手边（v20.76 泰山入册） ----
    'tai_event_aftermath': {
        id: 'tai_event_aftermath', npcId: 'sect_leader_泰山派', title: '火坛左手边', icon: '🌅',
        desc: '结契后头一个清晨，左手边的石头被她擦干净了。',
        minAffection: 80, trigger: { random: 1.0 }, cooldown: 0, flag: 'tai_e_aftermath_done',
        requireDaoCompanion: true, requireEventDone: 'tai_event_013',
        scenes: [
            { speaker: 'narrator', text: '结契后头一个清晨。寅时你醒来，身边已空——她在火坛边。炭早拨红了，风灯挂高了，火坛左手边那块石头被她擦得干干净净，上面摆着一册新档，摊开的头一页空着。天边刚裂开一线灰白。', type: 'description' },
            { speaker: 'npc', text: '「醒了。」岳清晓没回头，火钩不停，「卯时，第一缕，云梁厚三分——今日的光值得起早。」报完这一串她才转身，把档册塞进你手里，「『左手边，常设一位』那一行，今日生效。头一笔，你来写。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '接过炭笔，在头一行写下今日的日子，再画一个小小的日头', effect: 'write', affection: 7 },
                { text: '「往后你迎第一缕，我挡西北风。」', effect: 'wind', affection: 6 },
                { text: '取出那幅「日」字拓片，就着头一缕日光举给她看', effect: 'rubbing', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'write': aff = 7; msg = '你接过炭笔，在头一行写下：某年某月某日，晴，同看者一人。她凑过来验收，比验炭色还认真：「字不赖——比我师弟们强。」东方恰好第一缕爬上来，照得她半张脸通红。她忽然冲着云海扬声：「一千零二次——有人啦！」喊完自己先愣住，耳根红透，话却没收回。从这晨起，临火人的档册页页有两种字迹，一个大，一个小。'; break;
                case 'wind': aff = 6; msg = '「挡风。」她把这两个字重复了一遍，想了想，翻开档册记了一笔：「西北风口，常设一人。」记完抬头看你，耳根微红，话还是直的：「风向天天变——这一笔不变。」晨风从台下卷上来，她把火钩往雪里一插，用身子挡了半个风口。火坛左手边的位置，从今晨起站着一个活人。'; break;
                case 'rubbing': aff = 5; msg = '你取出那幅「日」字拓片，就着头一缕日光举起来——光透过纸背，圆廓里那一横亮得像一团真火。她看了很久，忽然把拓片接过去，卷好，塞回竹管，又把竹管斜背回你身上。「纸里封着它，纸外头站着你。」她替你勒紧麻线，勒了三道，声音低下去，「往后这光，天天一起看。」'; break;
            }
            if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            if (typeof window.addEssence === 'function') window.addEssence(8); // 道侣共修，真元+8
            return { affection: aff, msg: msg };
        }
    },
    // ---- 幽翠微：第二把椅子（v20.76 青城入册） ----
    'qing_event_aftermath': {
        id: 'qing_event_aftermath', npcId: 'sect_leader_青城派', title: '第二把椅子', icon: '🍃',
        desc: '结契后头一个清晨，焙房的第二把椅子摆正了。',
        minAffection: 80, trigger: { random: 1.0 }, cooldown: 0, flag: 'qing_e_aftermath_done',
        requireDaoCompanion: true, requireEventDone: 'qing_event_013',
        scenes: [
            { speaker: 'narrator', text: '结契后头一个清晨。焙房的灶火已经生了——灶前那第二把椅子摆到了最好的看火位，椅脚垫着石，极稳。她坐在灶前翻着茶青，旧罐摆在灶台上，罐口开着，里头的新茶香得一层一层。罐底那页折得方正的纸还压着——她没避你，放进去的时候，你在场。', type: 'description' },
            { speaker: 'npc', text: '「醒了。」幽翠微头也不抬，茶夹不停，「坐。今日的火最难拿——雪天焙茶，误一息就焦。你的差事：添柴，看火色，别说话。」顿了顿，她把一包纸包推过来，「山枣。空着肚子看不了火——这条规矩，今日生效。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '在第二把椅上坐下，添柴看火色，她报一句你应一句', effect: 'fire', affection: 7 },
                { text: '「往后头一茬，你掌锅，我看火——年年如此。」', effect: 'promise', affection: 6 },
                { text: '把旧罐捧下来，烧水活火，替她煎头一盏', effect: 'brew', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'fire': aff = 7; msg = '你添柴，她报——「文火。」「退半根。」「好。」一报一应，这一匾茶出锅时满屋清香。她捻起一片对着光看，叶脉透青：「火候听得懂话——你比茶还快懂。」她把头一盏推给你，指尖在盏沿多停了一息。「往后焙房的火，两个人看。这条规矩我立死了——立到白头。」'; break;
                case 'promise': aff = 6; msg = '「年年如此。」她把这四个字掂了掂，忽然笑出声：「好——立约！」她伸出小指勾住你的，用力一晃，「误了火候的，罚自己采头三行。」笑完她低头拨火，耳根红着，声音低下去：「……三十一年，前任看茶人没离过山。我如今懂了——不是走不开，是焙房里没人值得走开。」'; break;
                case 'brew': aff = 5; msg = '你把旧罐捧下来，烧水活火，煎头一盏——头一盏煎给她。她愣了一下，把手在围裙上擦了两遍才接，捧着盏看了很久没喝。「罐是旧的，茶是新的。」她说，「规矩你全学去了。」她一口喝干，把盏搁下，眼睛在灶火里亮得很：「行。往后头一盏——归你煎。」'; break;
            }
            if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            if (typeof window.addEssence === 'function') window.addEssence(8); // 道侣共修，真元+8
            return { affection: aff, msg: msg };
        }
    },
    // ---- 奚湘筠：琴台二椅（v20.76 衡山入册） ----
    'xiang_event_aftermath': {
        id: 'xiang_event_aftermath', npcId: 'sect_leader_衡山派', title: '琴台二椅', icon: '🎻',
        desc: '结契后头一个清晨，琴台第二把椅摆在谱架左手边。',
        minAffection: 80, trigger: { random: 1.0 }, cooldown: 0, flag: 'xiang_e_aftermath_done',
        requireDaoCompanion: true, requireEventDone: 'xiang_event_013',
        scenes: [
            { speaker: 'narrator', text: '结契后头一个清晨。你醒来时听见雨——檐外的雨又细又密。琴台上，第二把椅已经摆到谱架左手边，椅脚垫着石，极稳。她坐在灯下调弦，那份旧谱摊着：上半阙是师父的，下半阙是她的，谱尾一行新墨小字：「夜雨阑。琴台，有二人。」', type: 'description' },
            { speaker: 'npc', text: '「醒了。」奚湘筠没有抬头，弓尖虚搭在弦上，「雨，来了。」顿了顿，「坐。曲子调好了——调给雨的，也调给你。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '在第二把椅上坐下，听她把全阙从头拉一遍', effect: 'listen', affection: 7 },
                { text: '取出松香，替她把弓毛擦三下', effect: 'rosin', affection: 6 },
                { text: '煨一杯姜茶放到谱架边：「雨凉。先喝。」', effect: 'tea', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'listen': aff = 7; msg = '你在第二把椅上坐下。她运弓——全阙的《潇湘夜雨》，头一回从头到尾只拉给你一个人。雨声、琴声，一层缠着一层，曲终时檐外的雨恰好停了一息。她收了弓，转头看你，眼里是雨后云海的温：「师父说，拉完的人，就该下山了。」她停了很久，「我拉完了。——我没下山。山在这儿，你也在这儿。」'; break;
                case 'rosin': aff = 6; msg = '你取出松香，替她把弓毛擦了三下——不多，不少。她没有拦，看着你的手，看完，把松香收回袖中——没放里层，搁在了外层，一伸手就够得着的地方。「十六年，擦香的只有我自己。」她说得很轻，「往后——多一双。」她拉了一弓试音，音清亮，「弓毛咬住弦了。——心也是。」'; break;
                case 'tea': aff = 5; msg = '你煨了姜茶，放到谱架边。她看着那杯茶，看了很久，双手捧起来，捧在掌心——按弦的茧在杯壁上留下浅浅的印。「……暖。」她说，就一个字。喝完了，她把杯子搁下，忽然运弓——曲子的头一句比哪一天都高了半音，像雨也薄了一层。从这晨起，琴台多了一条规矩：炉上煨着一杯姜茶，常满。'; break;
            }
            if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            if (typeof window.addEssence === 'function') window.addEssence(8); // 道侣共修，真元+8
            return { affection: aff, msg: msg };
        }
    },
    // ---- 耿雪衣：灯下的日子（v20.77 血手门入册） ----
    'xue_event_aftermath': {
        id: 'xue_event_aftermath', npcId: 'sect_leader_血手门', title: '灯下的日子', icon: '🏮',
        desc: '结契后头一个清晨，药庐篱笆口有两串脚印，朝着集市的方向。',
        minAffection: 80, trigger: { random: 1.0 }, cooldown: 0, flag: 'xue_e_aftermath_done',
        requireDaoCompanion: true, requireEventDone: 'xue_event_013',
        scenes: [
            { speaker: 'narrator', text: '结契后头一个清晨。你醒来时身边已空——她在药庐灯下，那件没上过身的新衣裳穿得整整齐齐，针线包打好了，荷包里的钱数过两遍：各付各的，这条规矩她执行得比门规还严。篱笆外天刚透亮，雪梁那头，极隐约地滚过来年集的头一轮锣。', type: 'description' },
            { speaker: 'npc', text: '「醒了。」耿雪衣没抬头，还在清点针线包，声音平得像报数目，「今日廿九，年集，人最多。行程头一件，赶集；第二件，为菜价吵架——我吵，你不许帮腔。」清点完她才抬头，耳根有点红，「第三件，晚回家。我练好了那一句，嗓门很稳。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「走。往后这个家的日子，我们一起报、一起过、一起记。」', effect: 'share', affection: 7 },
                { text: '替她理正衣领，把针线包最沉的那一卷挪到自己肩上：「吵架归你，扛东西归我。」', effect: 'carry', affection: 6 },
                { text: '取出那张头一张伤风方子，展开递给她：「今天用不上这个。今天，我们都不病。」', effect: 'recipe', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'share': aff = 7; msg = '她怔了怔，把荷包仔细收进新衣裳最里层的口袋——像收一张核对无误的方子。「一起报，一起过。」她把这句话重复了一遍，一个字一个字核过，核完点头，「好。」雪梁那头的锣声一轮一轮地来，她背起针线包走到门口，忽然折回来，把灯座下那盏素灯提上——罩面白药畦纹的那盏，吹熄了旧的，点着新的提在手里：「赶集带灯做什么？」她提得很稳，「晚回家用。路，我给你照着。」从这日起，篱笆外的路上，清晨有两串脚印，黄昏有一盏灯。'; break;
                case 'carry': aff = 6; msg = '你把针线包里最沉的那一卷挪到自己肩上。她没拦，看你扛好，又把荷包、顶针、白药籽一样一样塞进你怀里剩下的空当，塞得整整齐齐：「扛归你，管归我——公道。」走到篱笆口她忽然站住，折回灯下，把那盏素灯的灯芯剪短了一分——像给一个家安顿睡下。「从前我出门，灯留着。」她带上门，声音还是平的，「今天熄了。灯等的那个人，跟我走在一路。」'; break;
                case 'recipe': aff = 5; msg = '你取出那张头一张伤风方子，在她面前展开。她看了一会儿——姜三片，枣五枚，葱白两段，字字工整。「今天用不上这个。」她接过方子，折好，没有收回柜子，而是塞进了针线包最里层，跟荷包收在一处。「开这张方子的时候，我以为普通日子是病。」她推开篱笆门，年集的锣声滚进来，她走进锣声里，回头朝你伸出手，「现在知道了——普通日子是方子。一味一味，都得两个人抓。」'; break;
            }
            if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            if (typeof window.addEssence === 'function') window.addEssence(8); // 道侣共修，真元+8
            return { affection: aff, msg: msg };
        }
    },
    // ---- 拓银沙：头一个看（v20.77 飞蝎坞入册） ----
    'xie_event_aftermath': {
        id: 'xie_event_aftermath', npcId: 'sect_leader_飞蝎坞', title: '头一个看', icon: '✨',
        desc: '结契后头一个清晨，她又风一样冲进来拽你——金蝎蜕了第二回壳。',
        minAffection: 80, trigger: { random: 1.0 }, cooldown: 0, flag: 'xie_e_aftermath_done',
        requireDaoCompanion: true, requireEventDone: 'xie_event_013',
        scenes: [
            { speaker: 'narrator', text: '结契后头一个清晨。你是被掀开的帐帘吵醒的——她风一样冲进来，辫子散了一半，比报匪警还急，一把攥住你的手腕就往蝎房最里间拽：金蝎蜕了第二回壳。新身嫩白，透着水光；旧壳完完整整卧在旁边，连尾钩的弧度都在。灯举得很低，她的手很稳，只有嗓门在抖。', type: 'description' },
            { speaker: 'npc', text: '「第二回！」拓银沙把壳捧起来，话还是直的：「头一回，我头一个给你看。第二回——」她想了想，把这个道理掰得很认真，「第二回不用给。你就住在这儿。往后它蜕几回，你就头一个知道几回，这条规矩，我立死了。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「往后蝎房分窝，一班两个人——你的钳，我的灯。」', effect: 'shift', affection: 7 },
                { text: '接过旧壳，用软布一层一层包好，搁回她怀里最里层：「壳归你。册，我们一起填。」', effect: 'keep', affection: 6 },
                { text: '把自己的水囊塞给她：「你打天不亮就守在这儿。先喝水。」', effect: 'water', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'shift': aff = 7; msg = '「一班两个人！」她一巴掌拍在大腿上，当场把坞里分窝的班册抓过来，你的名字写在她名字底下——并排，一个大，一个小。「打今日起，东栏三窝归你，蝎王窝归我。」她把一柄竹钳抛给你，钳柄上缠了新的布条，「还有那条『被蜇不许叫』的坞规——」她忽然回头，咧嘴一笑，声音低了半度，「在我这儿，你可以叫。」金蝎的新身从灯下爬过旧壳，两只叠在一处。从这晨起，飞蝎坞的班册上，同一页并着两个名字，年年并着。'; break;
                case 'keep': aff = 6; msg = '你把旧壳用软布一层一层包好，搁回她怀里最里层，按实了。她看着你做完这套动作，喉结动了动——满坞嗓门最大的人，这一刻没词。「……那时候壳给你，是怕你不当回事。」她拍了拍怀口，声音低下去，「今天你还给我，是当真了。壳收在怀里，比收在布包里强——布包里是念想，怀里是日子。」当夜她在蝎册最后一页那两个字底下添了一行小注，描一遍，描得发亮：不蛰。此生不改。两个人，一起看蜕。'; break;
                case 'water': aff = 5; msg = '你把水囊塞进她手里。她愣住——八年了，分水都是她分给别人，头一回有人把水囊先递给她。她灌了一大口，抹抹嘴，笑得蝎房屋顶掉沙，笑完眼睛亮着：「他娘的，你什么时候学会抢我的活儿。」她把水囊重新挂回你鞍上，挂得很正，「往后这囊水——你一半，我一半。咱俩走到哪儿，分到哪儿。」帐外沙漠的天一点点亮上来，金蝎的新身在灯下爬了一圈，两个人守着它，一直看到日头出沙海。'; break;
            }
            if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            if (typeof window.addEssence === 'function') window.addEssence(8); // 道侣共修，真元+8
            return { affection: aff, msg: msg };
        }
    },
    // ---- 伏璃茵：两个人的班（v20.77 烈日教入册） ----
    'lie_event_aftermath': {
        id: 'lie_event_aftermath', npcId: 'sect_leader_烈日教', title: '两个人的班', icon: '🔥',
        desc: '结契后头一个清晨，圣火龛的值守档上，两个名字头一回并在一班。',
        minAffection: 80, trigger: { random: 1.0 }, cooldown: 0, flag: 'lie_e_aftermath_done',
        requireDaoCompanion: true, requireEventDone: 'lie_event_013',
        scenes: [
            { speaker: 'narrator', text: '结契后头一个清晨。寅时，你醒来时身边已空——她在圣火龛前值守：添油、剪芯、查风口，一样一样按着仪轨来。龛边的值守档上，头一回并着两个名字：她的，和你的。你的名字后头还有一行小字批注，是吐槽腔的笔迹：「此人负责听我吐槽，不负责添油——添油的手艺，仪轨没教过他。」', type: 'description' },
            { speaker: 'npc', text: '「醒了。」伏璃茵没回头，语速融金，仪态端庄——龛下有教众走动，圣女的宝相得端着。等巡到龛后，拐过那道没人看得见的墙，语速当场换档：「你知道空班有多难受吗？大仪长老主了，我没事干——值守八年，头一回没事干，手都不知道往哪儿搁。」她踢了一脚沙子，「去曝日崖？太晒。去东沙丘？——大风净沙不是天天有，隔层霾看，还不如不看，看了更馋。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「往后龛前值守，寅时归你，戌时归我——你攒的吐槽，都记在我的班上讲。」', effect: 'shift', affection: 7 },
                { text: '「空班就空班。走，往东七里——大风净沙不等它，隔着霾的那团红，我先陪你看一场。」', effect: 'dawn', affection: 6 },
                { text: '取出那根灯芯，放回檀木匣的旧布上：「透气完了。往后匣子、芯、人，都在一处。」', effect: 'wick', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'shift': aff = 7; msg = '「寅班归我，戌班归你？」她把油壶搁下，转过身，圣女宝相压不住嘴角：「你知道这是什么排法吗？这是把一辈子都排进档里的排法。」她提笔把你的班次正式记进值守档——字写得极工整，比仪文还工整，写完把笔搁下，你名字后头那行吐槽批注她没划：「留着。往后教众问这行小字是谁批的——」她耳根红着，声音低下去，「我说是我。全教最正经的档，配最不正经的批注——两样都归我。」从这晨起，圣火龛的值守档上天天两个名字并一班，油两个人添，吐槽一个人讲给一个人听。'; break;
                case 'dawn': aff = 6; msg = '「隔着霾也去？」她盯着你看了两息，忽然把油壶搁下——搁得极轻，像怕惊着龛火，转身拽住你的手腕就往西墙跑：「那走！七里，来回两个时辰——赶回来迟了，我就说圣女夜巡查井去了，井是我的仪，谁敢问！」东沙丘的黎明凉得沁骨，两个人趴在沙脊上，看那团红隔着薄霾拱出来，朦朦的，糊糊的——可是真的。她看了很久，忽然仰起头——仰到一半愣住，摸了摸头顶：没有冠。她笑了，笑完嗓门比日头还亮：「隔霾看也比对着火龛馋强！这笔账记下了——大风净沙那日再来，看个透亮的！」'; break;
                case 'wick': aff = 5; msg = '你取出那根捻熄过的灯芯，放回檀木匣的旧布上。她看着你放好，添油的手停了很久。「……给你了的东西。」她声音低下去，不是圣女腔，也不是吐槽腔，「给了就不兴还——匣子是教里的地方，你是教外的人。」你说：匣子、芯、人，在一处了，还分什么教内教外。她愣着，忽然别过脸去，再转回来时眼睛红着，嘴上还硬：「行行行——灯芯等了三年，就等你这句。」她把匣盖合上，没有供回龛里，也没有藏，摆在了值守档的旁边：「往后不供、不藏——放着。放在我们两个人的班上。」'; break;
            }
            if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            if (typeof window.addEssence === 'function') window.addEssence(8); // 道侣共修，真元+8
            return { affection: aff, msg: msg };
        }
    },
    // ---- 檀望舒：传令路上（v20.77 天龙教入册） ----
    'long_event_aftermath': {
        id: 'long_event_aftermath', npcId: 'sect_leader_天龙教', title: '传令路上', icon: '⛰️',
        desc: '结契后头一个清晨，传声房有令要传外坛——跑令的是她，跟令的是你。',
        minAffection: 80, trigger: { random: 1.0 }, cooldown: 0, flag: 'long_e_aftermath_done',
        requireDaoCompanion: true, requireEventDone: 'long_event_013',
        scenes: [
            { speaker: 'narrator', text: '结契后头一个清晨。卯时前，传声房的令牌声就响了——今日有令要传外坛，跑令的是她；跟令的，是你。案上，那半面残铜镜不再包布，镜面朝上，照着半张脸；镜子旁边并排搁着两块风磨石片——一人一块的那两块，结契后就并在了一处，谁也没再分回去。', type: 'description' },
            { speaker: 'npc', text: '（用黑袍知客的调子）「前路风从西来，走里侧。」檀望舒传完令下阶，走到你身边，忽然换云婆婆的哑嗓：（用云婆婆的调子）「娃儿，乏了就讲，婆婆走慢些。」传完自己先笑，笑完把腰间铜镜牌扶正，这一回传的是正经的令，用的是讲经长老的沙哑老嗓，一个字一个字，很稳：（用讲经长老的调子）「今日这道令，添一句——跟令的人走里侧，传令的人走外侧。缘由：外侧风硬，传令的，惯吃风。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '用你自己的调子，朝她叫一声：「檀望舒。」然后等那一声「哎」', effect: 'name', affection: 7 },
                { text: '「往后传令路上，你传令，我背水——嗓子乏了，换我的班。」', effect: 'water', affection: 6 },
                { text: '把案上那半面镜子拿起来，镜面朝内，替她收回怀里：「镜子归人。人归我。」', effect: 'mirror', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'name': aff = 7; msg = '你叫了。她应了——那一声「哎」还是轻，还是生，却不再陌生了。应完她先别过脸去，再转回来时传的是知客腔，腔是稳的，耳尖是红的：（用黑袍知客的调子）「前路令文，添一口——每日酉时，应一声。不入册，不供教。」从这晨起，传声房真有一道不入册的私令：酉时，山道上跑令归来，一个人叫，一个人应——叫的人用自己的调子，应的人，也用自己的。回音壁还在坛后七里立着，风过还肯应；只是她越来越少上去了——活人的应，比石头的好，这笔账，她如今算得清清楚楚。'; break;
                case 'water': aff = 6; msg = '「嗓子乏了，换你的班。」她边走边把这句话嚼了一遍，忽然站住，把腰间铜镜牌摘下来——牌翻过来，背面刻着传声房的老规矩：声即是凭。她指给你看，随即用孩子的稚声在老规矩旁边添了一条新的，传得一字一字，很慢：（用孩子的调子）「新规第一条：传令的嗓子乏了，背水的替她说话。背水的声不好听——是真的。」传完自己先笑，笑完把铜镜牌挂回你腰间，和自己的并在一处：「往后传令路上，一面牌应一面牌。」'; break;
                case 'mirror': aff = 5; msg = '你把那半面残铜镜拿起来，镜面朝内，替她收回怀里，按实了。她没拦——看你收好，手在镜布上停了停：（用云婆婆的调子）「镜面朝内，是婆婆教的：心事重的时候，镜子朝里。」传完她自己摇了摇头，换知客腔更正，更正得很正式：（用黑袍知客的调子）「自今日起，这条规矩废了。镜子朝内、朝上，都一样——传声房的心事，不用镜子量了。」她拍了拍怀里那半面镜子，又拿起案上你那块风磨石片，替你塞回你怀里，塞得很实：（用孩子的调子）「证物各归各——人，不归各。」'; break;
            }
            if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            if (typeof window.addEssence === 'function') window.addEssence(8); // 道侣共修，真元+8
            return { affection: aff, msg: msg };
        }
    },
    // ---- 戚巧机：雀课两个人（v20.78 神机门入册） ----
    'sj_event_aftermath': {
        id: 'sj_event_aftermath', npcId: 'sect_leader_神机门', title: '雀课两个人', icon: '⚙️',
        desc: '结契后头一个清晨，雀课册上添了一栏——栏头两个字：同课。',
        minAffection: 80, trigger: { random: 1.0 }, cooldown: 0, flag: 'sj_e_aftermath_done',
        requireDaoCompanion: true, requireEventDone: 'sj_event_013',
        scenes: [
            { speaker: 'narrator', text: '结契后头一个清晨。你醒来时工坊的灯还亮着——她比你早，蹲在案前给机关雀的翼簧上油。那枚刻齿数比的黄铜齿轮摆在案心，她没带在身上，也没收进柜子，摆在两个人都够得着的地方。雀课册摊开着，昨夜的课添了新栏，栏头两个字，登册体一笔一划：同课。栏下已经记了一行：一句你的，一句她的，轮着学。', type: 'description' },
            { speaker: 'npc', text: '「醒了。」戚巧机没抬头，油壶还捏在手里，声音平得像登册体，「今日头一件事，雀课：它把你那句学了三遍，岔了一遍。误差记在雀身上，不公。」她上完最后一道簧，才抬头，耳根有点红，「误差的原因，我检修出来了：教课的人，心乱。这一笔，记我账上。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「往后雀课你教一句、我教一句——你记你的，我记我的，两下里对着记。」', effect: 'share', affection: 7 },
                { text: '把案心那枚齿轮拿起来，放回她掌心，替她合拢手指：「齿轮归你攥。户口归我带。」', effect: 'gear', affection: 6 },
                { text: '什么都不说，坐到案前，拿过小扳手，替她把雀的翼簧上一遍油', effect: 'oil', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'share': aff = 7; msg = '她怔了怔，把油壶搁下，翻开雀课册新的一页，当场立栏——栏头两个字写得比哪一笔都工整：同课。「一句你教，一句我教。」她把这条规矩念了一遍，像验一道游隙，验完点头，「游隙刚好。」从这晨起，工坊的雀课每晚两个人教，机关雀的句子越学越多，把两个人的腔都学岔了——用她的尾音，说你的话。她登册：「岔，不纠。岔得刚刚好。」'; break;
                case 'gear': aff = 6; msg = '你把齿轮放回她掌心，替她合拢手指。她盯着自己的手看了很久——那枚齿轮攥了八年，自打塞给你，就没离开过你的怀。「带着它，就是攥着我算不出的那一桩。」她声音低下去，随即又把手摊开，把齿轮摆回案心——还是那个两个人都够得着的位置，「不归你带，也不归我攥。齿轮在案上，人在屋里——户口，两个人一起带。」从这晨起，工坊的案心常摆着一枚黄铜齿轮，上油、检修、登册，一人一半，谁也没收走过。'; break;
                case 'oil': aff = 5; msg = '你坐到案前，拿过小扳手，替她把雀的翼簧一道一道上油——不紧，不松，游隙半丝。滴答从慢到稳，满屋子细响。雀儿的墨晶眼转了一圈，把你那句话又还了一遍，尾音里带着谷里的回声。她蹲在灯边看你上完最后一道簧，忽然说：「八年检修，替雀上簧的手，只有我一双。」她把小扳手插进你的工具囊，插得很实，「第二双手，今晨入了户口。」那晨工坊的滴答一拍是一拍，像满屋子的齿轮在一起背诗。'; break;
            }
            if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            if (typeof window.addEssence === 'function') window.addEssence(8); // 道侣共修，真元+8
            return { affection: aff, msg: msg };
        }
    },
    // ---- 裘霜莺：清晨的一呼一应（v20.78 铁掌帮入册） ----
    'tz_event_aftermath': {
        id: 'tz_event_aftermath', npcId: 'sect_leader_铁掌帮', title: '清晨的一呼一应', icon: '🐦',
        desc: '结契后头一个清晨，苇滩那头一长一短——她把酉时的差事，挪到了清晨。',
        minAffection: 80, trigger: { random: 1.0 }, cooldown: 0, flag: 'tz_e_aftermath_done',
        requireDaoCompanion: true, requireEventDone: 'tz_event_013',
        scenes: [
            { speaker: 'narrator', text: '结契后头一个清晨。你醒来时，苇滩那头响起一长一短——「你来了」，一声比一声稳，没有那夜吹岔的影子。你推门出去，她立在窑棚前，短打束袖，手里捧着那支素坯，泥胎上的指痕在晨光里清清楚楚。哨架最上层隔着窗纸看得见：空格还空着，八窑那支半声哨摆在旁边，摆得端端正正。', type: 'description' },
            { speaker: 'npc', text: '「醒了。」裘霜莺把素坯收进腰后，凶脸迎着晨光，耳根红着，话短，「酉时的一呼一应，今日起挪到清晨——清晨静，雀不吵，哨语传得最远。」她抬了抬下巴，腮帮子绷着，「叫。我练了半宿——那一声『哎』，练得比哪句哨语都凶。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '用人声叫她的名字，等那一声「哎」，再补一句：「往后清晨一呼，酉时一应——人声对人声，天天都不误。」', effect: 'name', affection: 7 },
                { text: '取出她塞给你的那支旧哨，吹一长一短还她：「哨语你吹，我应；人声我叫，你应——两下里分工。」', effect: 'whistle', affection: 6 },
                { text: '什么都不说，把她腰后的素坯接过来，捧回哨架最上层，摆在空格旁边：「话出了口，它不必进窑了——差一步，我们两个人慢慢凑。」', effect: 'plain', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'name': aff = 7; msg = '你叫了。她应了——那一声「哎」，练了半宿，出口还是涩的，涩得像八窑那半声，可它落了地。应完凶腔立刻跟上：「就这一声！明日、后日——每日就这一声，多一声没有。」话凶，耳朵红，她转身钻进窑棚，出来时手里多了一只荷叶包——炒菱角，还温的，塞进你怀里：「晨间的差事办完了。吃菱角。」从这晨起，水寨的堤上每日有一呼一应，人声对人声；苇滩的雀群听惯了，起了又落，落了又起，像替两个人打着拍子。'; break;
                case 'whistle': aff = 6; msg = '你把旧哨凑到唇边，吹了一长一短——哑鸭下水的调，拍子一拍不差。她僵住，听着这声「你来了」，凶脸上的表情一寸一寸松下来，松到底忽然别过脸去，再转回来时眼睛亮着，嘴上还凶：「你吹的哨，十一年了，全洞庭就数你最难听。」骂完她取出自己那支，回吹了一长一短，一声比一声稳：「哨语我吹，你应；人声你叫，我应——分工了，不许赖。」她那排腰后的哨，从这晨起多了一道不入差事册的规矩——她自己添的，添给一个人听。'; break;
                case 'plain': aff = 5; msg = '你把素坯接过来，捧回哨架最上层，摆在空格旁边。她看着你摆好，站在你身后半天没说话，忽然低声开口：「十一年，帮里没一个人碰过它。」她伸手把素坯扶正，扶得极轻，「你把它摆回来——你知道它搁哪儿。」晨光透过窗纸，落在泥胎的指痕上，一道一道都是软的。从这晨起，她掸哨架的灰，最后一掸总是掸素坯，掸完要叫你来看一眼——看一眼，它还在，还差一步，还有指望；指望这东西，两个人看着，才算数。'; break;
            }
            if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            if (typeof window.addEssence === 'function') window.addEssence(8); // 道侣共修，真元+8
            return { affection: aff, msg: msg };
        }
    },
    // ---- 姬云锦：晨课两个人（v20.78 昆仑派入册） ----
    'kl_event_aftermath': {
        id: 'kl_event_aftermath', npcId: 'sect_leader_昆仑派', title: '晨课两个人', icon: '❄️',
        desc: '结契后头一个清晨，舞台的晨课多出了半式——那半式无名，等你定名。',
        minAffection: 80, trigger: { random: 1.0 }, cooldown: 0, flag: 'kl_e_aftermath_done',
        requireDaoCompanion: true, requireEventDone: 'kl_event_013',
        scenes: [
            { speaker: 'narrator', text: '结契后头一个清晨。卯时你醒来，身边已空——她在舞台上，素绸束袖，双环扣的活结，扣人的那环打得比平日松。剑架上并挂两柄剑：她的舞剑，和你的。舞谱摊在石案上，翻到「问松」的注脚页，「问而不答」四个字旁边添了一行新注，墨迹未干，只有两个字：「有答。」', type: 'description' },
            { speaker: 'npc', text: '「醒了。」姬云锦没有回头，持剑朝崖端老松虚虚一礼，掌门腔端得平稳，只有耳根在晨光里红着，「晨课的谱，今日起多一式——问松之后，添半式。」她转过身，剑尖虚点舞谱上那行新注，「添的这半式，无名。谱上的规矩——谁读出来，谁定名。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '上台与她同舞：她跳问松的前半，你接那添出的半式——名目你定，定作「等人归」', effect: 'dance', affection: 7 },
                { text: '提笔在舞谱的新注旁落笔：「注不在谱，在剑。剑到了，注就成了。」', effect: 'write', affection: 6 },
                { text: '什么都不说，走到偏处的观位坐下，拂去蒲团上的雪——从今日起，这个位子不再是客位', effect: 'sit', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'dance': aff = 7; msg = '你上台接剑。她跳前半，你接后半——你的步位生，她不纠，只把自己的半式放慢半拍等你。舞毕两剑同收，老松枝上的雪落下来，落在两个人中间，像一场迟到的答。「『等人归』……」她把这三个字读了一遍，眼睛在谱下寸寸亮起来，忽然转身提笔，把名目一笔一划写进舞谱末页——那一页的留白，她终于肯让它有名了。「入谱。昆仑剑舞第七代，这半式的注脚：松答得慢，人先来了。」从这晨起，舞台的晨课是一个人舞，一个人读；顿处的半息，再也不用等了。'; break;
                case 'write': aff = 6; msg = '你提笔，在「有答」旁边落下那行注。她凑过来验看，验得比验剑意还认真，验完盯着那行字看了很久：「注不在谱，在剑……」她忽然收剑入鞘，按住柄布按了一遍，耳根红着，话还是稳的：「剑到了。这一注——成了。」她把舞谱收进怀里，没归绢函，贴身收着，「十年晨课，替我的谱落注的，只有师父的旧谱。第二双手，今朝入了谱。」那晨舞台的问松跳完，顿处没有顿——答，已经在台上了。'; break;
                case 'sit': aff = 5; msg = '你走到偏处的观位，拂去蒲团上的雪，坐下。她在台上僵了一息——那个位子打从迎雪那夜起就是留给你的，留过客位，留过读舞的位子，留到今日。她没再多话，束袖，起剑，把整套晨课从头舞完——迎雪，问松，和那添出的半式，式式朝着你的方向。舞毕收剑，她走下台来，站在你面前，伸手拉你起身，掌心是热的：「十年晨课，坐满全程的，只有那株老松。」她替你掸去肩上的雪，「第二个人，今朝认下了。」从这晨起，偏处的观位上有两只蒲团——一只读舞，一只陪坐。'; break;
            }
            if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            if (typeof window.addEssence === 'function') window.addEssence(8); // 道侣共修，真元+8
            return { affection: aff, msg: msg };
        }
    },
    // ---- 翀玉衡：不讫的那一栏（v20.78 全真教入册） ----
    'qz_event_aftermath': {
        id: 'qz_event_aftermath', npcId: 'sect_leader_全真教', title: '不讫的那一栏', icon: '🧮',
        desc: '结契后头一个清晨，日记最末一栏添了新笔：是日，结契。记。此笔无息——本就是人。',
        minAffection: 80, trigger: { random: 1.0 }, cooldown: 0, flag: 'qz_e_aftermath_done',
        requireDaoCompanion: true, requireEventDone: 'qz_event_013',
        scenes: [
            { speaker: 'narrator', text: '结契后头一个清晨。你醒来时，功录房那头已有了算盘珠声——一颗，一颗，拨得极慢极稳，不像对外账，像在数别的什么。案上功业日记摊在最末一栏，「全押」两个字旁边添了一笔新记，墨迹未干：「是日，结契。记。此笔无息——本就是人。」日记旁边，那具小银算盘的珠子尽数归零，独独一颗没归，孤零零拨在上头。', type: 'description' },
            { speaker: 'npc', text: '「醒了。」翀玉衡搁下笔，账房腔，字正腔圆，「今日头一笔，记了。息口：不算。」她把日记往你这边推了半寸，耳根红着，腔还端着，「这一栏，今日起改名——不叫『应收』，也不叫『存疑』。改成什么，你先说，我再落笔。功录房的规矩：栏头，由债主定。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「改叫『不讫』。不讫，就有明天——这一栏年年对，年年不讫。」', effect: 'name', affection: 7 },
                { text: '提笔在「全押」两个字底下添一行小注：「此栏只进不出——出的那日，两个人一起算。」', effect: 'annotate', affection: 6 },
                { text: '什么都不说，把那颗孤零零的珠子拨回去归零——再斟两盏茶，推一盏到她面前：晨间的对账，先吃茶，后拨珠', effect: 'tea', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'name': aff = 7; msg = '「不讫。」她把这两个字掂了一遍，像掂一颗珠，掂完忽然提笔——笔落得极稳，把栏头两个字写得比哪一笔账都大：不讫。「全真记账，两讫为安。」她合上日记，账房腔里裂开一条缝，「这一栏例外——不讫，就不安；不安，就有明天。」她把小银算盘从案上解下来挂回腰间，挂在最外层，伸手就够得着，「从今晨起，每日酉时对账添一笔定式：今日，我在。你报，我记——记到我们两个人一起坐化那日，再算。」'; break;
                case 'annotate': aff = 6; msg = '你提笔，在「全押」底下添了那行小注。她凑过来一笔一笔验看，验完半天没说话——那行「两个人一起算」，她读了三遍。「出的那日，一起算……」她把日记合上，抱在怀里，耳根红着，账房腔平得刻意：「记。此笔批注，入栏，永不销。」她把算盘珠拨得噼啪归零，独独留下那颗孤珠没归——「这颗不归。珠是对账的凭——留着它拨在上头，来世对总账的时候，一眼就认得出：这一栏，是从哪一年起，成了活账。」'; break;
                case 'tea': aff = 5; msg = '你把那颗孤珠拨回去归了零，斟了两盏茶，推一盏到她面前。她盯着那盏茶看了很久——十二年记账，案上的茶从来一盏，凉了换，换了凉，从没第二盏。「晨间对账的新规。」她双手捧起茶盏，拨珠的茧在盏壁上留下浅浅的印，声音低下去，「先吃茶，后拨珠。茶两盏，珠一算盘——这一笔，记。」她吃了半盏，忽然把日记重新翻开，在那笔新记后头又添一行，念给你听，账房腔里藏不住那点缝：「是日，彼替吾斟茶一盏，共两盏。记。利息——」笔尖顿了顿，「不要利息。这一笔账，本身就是息。」'; break;
            }
            if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            if (typeof window.addEssence === 'function') window.addEssence(8); // 道侣共修，真元+8
            return { affection: aff, msg: msg };
        }
    },
    // ---- 竺照禅：第二笔批注（v20.79 少林寺入册） ----
    'shao_event_aftermath': {
        id: 'shao_event_aftermath', npcId: 'sect_leader_少林寺', title: '第二笔批注', icon: '📿',
        desc: '结契后头一个清晨，批注经那页空白落了头一笔——笔尾空着半行，等你续。',
        minAffection: 80, trigger: { random: 1.0 }, cooldown: 0, flag: 'shao_e_aftermath_done',
        requireDaoCompanion: true, requireEventDone: 'shao_event_013',
        scenes: [
            { speaker: 'narrator', text: '结契后头一个清晨。你醒来时栴檀林那头已有了翻经的声音——一页，一页，翻得极慢极稳，晚课早做完了，她在做晨间的批注。批注经摊在经案正中：那一页曾经空白过半个月，如今落了一笔批注，墨迹未干；批注的笔尾空着半行，笔搁在经案上，笔尖朝着你这边，像等人。念珠搁在案角，盘得发亮的珠子安安静静，一颗也没在拨。', type: 'description' },
            { speaker: 'npc', text: '「醒了。」竺照禅没抬头，指尖还压着那半行空白，讲经腔字正腔圆，「晨间的功课，今日少一笔批注——贫尼批完了自己的半行，另外半行，比贫尼的来得慢。」她说完这句才抬头，耳根红着，毒舌开不了口，只得先合十念了一声「阿弥陀佛」，佛号念完才接上，「贫尼讲戒十几年，批注从不等第二笔。今日起这一页立新规：批注落两笔，一笔是贫尼的，一笔是你的。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '提笔续她那半行批注，用自己的字迹批：「骂是教，教是亲——亲，不骂。」', effect: 'annotate', affection: 7 },
                { text: '「往后晨昏功课你讲经，我研墨——你的毒舌，归我管。」', effect: 'ink', affection: 6 },
                { text: '什么都不说，把案角那串念珠拿起来，替她盘回腕上，替她系好结：「珠归手。页归两个人。」', effect: 'beads', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'annotate': aff = 7; msg = '你提笔，续完那半行批注。她凑过来验批，验得比验戒还认真，验完盯着「亲，不骂」三个字看了很久——看了三遍，忽然合十，念了一声长长的「阿弥陀佛」，念到一半自己先笑了，笑完耳根通红：「……贫尼骂了半辈子人，这一句，驳不倒。」她把批注经合上，这一回没有归架，抱进了怀里，「从今晨起，这一页的两笔批注，一笔归一个人——贫尼骂人之前，先想这一页；你笑贫尼毒舌之前，也想这一页。」从这晨起，栴檀林的功课是一个人批，一个人验；那半行空白，再也没有空过。'; break;
                case 'ink': aff = 6; msg = '「管贫尼的毒舌？」她把这几个字掂了一遍，掂完忽然笑出声，笑完赶紧补了一声佛号：「阿弥陀佛——十几年，方丈管寺务，戒堂管僧众，敢管贫尼这张嘴的，你是头一个。」她把笔递进你手里，自己研墨——研得极慢极稳，毒舌没了去处，只好跟着研墨的劲儿一句一句往外冒：「研浓些。批注的后半行要毒——毒，才入心。」说到「入心」两个字她自己先顿了半晌，耳根红透，把后半句咽了回去，改研墨。那晨栴檀林的灯亮到卯时三刻，一笔一研，两笔批注落在纸上，墨色深浅一样。'; break;
                case 'beads': aff = 5; msg = '你把念珠从案角拿起来，替她盘回腕上，替她系好结。她没拦——看你系完，拨了一颗珠，又拨一颗，把整串拨完了一遍才开口：「……珠离手十几年，昨夜离了一夜。」她把念珠盘进掌心攥住，攥得很实，声音低下去，「不是手放下的，是心放下的——心放下了，一夜的功课，比十年的都睡得沉。」庵外的栴檀叶被晨风翻了一响，她起身理了理衣，佛相端回来半分，话却说得很轻：「晨课没做完。今日起，晨课的规矩改一改：两个人，一个讲，一个听。」'; break;
            }
            if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            if (typeof window.addEssence === 'function') window.addEssence(8); // 道侣共修，真元+8
            return { affection: aff, msg: msg };
        }
    }
};

// ============ 合并进总事件池 ============
if (typeof NPC_PERSONAL_EVENTS !== 'undefined') {
    Object.assign(NPC_PERSONAL_EVENTS, AFTERMATH_EVENTS);
}

// ============ 每日钩子：道侣玩家在该派过夜 + 终章已发生 + 未回访 → 触发 ============
if (typeof window !== 'undefined' && window.timeSystem && window.timeSystem.onNewDaySubscribe) {
    window.timeSystem.onNewDaySubscribe(function() {
        try {
            if (!window.currentCharData || !window.npcManager) return;
            var roster = window.HEROINE_ROSTER || [
                { id: 'sect_leader_百花谷', sect: '百花谷', amId: 'bh_event_aftermath', finaleId: 'bh_event_014' },
                { id: 'sect_leader_修罗宫', sect: '修罗宫', amId: 'xl_event_aftermath', finaleId: 'xl_event_033' },
                { id: 'sect_leader_天山派', sect: '天山派', amId: 'ts_event_aftermath', finaleId: 'ts_event_013' },
                { id: 'sect_leader_五仙教', sect: '五仙教', amId: 'wx_event_aftermath', finaleId: 'wx_event_013' },
                { id: 'sect_leader_峨眉派', sect: '峨眉派', amId: 'em_event_aftermath', finaleId: 'em_event_013' },
                { id: 'sect_leader_唐门', sect: '唐门', amId: 'tm_event_aftermath', finaleId: 'tm_event_013' },
                { id: 'sect_leader_蓬莱派', sect: '蓬莱派', amId: 'pl_event_aftermath', finaleId: 'pl_event_013' },
                { id: 'sect_leader_恒山派', sect: '恒山派', amId: 'heng_event_aftermath', finaleId: 'heng_event_013' },
                { id: 'sect_leader_泰山派', sect: '泰山派', amId: 'tai_event_aftermath', finaleId: 'tai_event_013' },
                { id: 'sect_leader_青城派', sect: '青城派', amId: 'qing_event_aftermath', finaleId: 'qing_event_013' },
                { id: 'sect_leader_衡山派', sect: '衡山派', amId: 'xiang_event_aftermath', finaleId: 'xiang_event_013' },
                { id: 'sect_leader_血手门', sect: '血手门', amId: 'xue_event_aftermath', finaleId: 'xue_event_013' },
                { id: 'sect_leader_飞蝎坞', sect: '飞蝎坞', amId: 'xie_event_aftermath', finaleId: 'xie_event_013' },
                { id: 'sect_leader_烈日教', sect: '烈日教', amId: 'lie_event_aftermath', finaleId: 'lie_event_013' },
                { id: 'sect_leader_天龙教', sect: '天龙教', amId: 'long_event_aftermath', finaleId: 'long_event_013' },
                { id: 'sect_leader_神机门', sect: '神机门', amId: 'sj_event_aftermath', finaleId: 'sj_event_013' },
                { id: 'sect_leader_铁掌帮', sect: '铁掌帮', amId: 'tz_event_aftermath', finaleId: 'tz_event_013' },
                { id: 'sect_leader_昆仑派', sect: '昆仑派', amId: 'kl_event_aftermath', finaleId: 'kl_event_013' },
                { id: 'sect_leader_全真教', sect: '全真教', amId: 'qz_event_aftermath', finaleId: 'qz_event_013' },
                { id: 'sect_leader_少林寺', sect: '少林寺', amId: 'shao_event_aftermath', finaleId: 'shao_event_013' }
            ]; // v20.73：名册正源已补 amId/finaleId 字段（heroine-rivalry.js），此兜底表同步加峨眉；v20.74 同步加唐门；v20.75 同步加蓬莱；v20.76 同步加恒山/泰山/青城/衡山；v20.77 同步加血手门/飞蝎坞/烈日教/天龙教；v20.78 同步加神机门/铁掌帮/昆仑派/全真教；v20.79 同步加少林寺
            var loc = window.currentCharData.location || '';
            for (var i = 0; i < roster.length; i++) {
                var h = roster[i];
                if (h.sect !== loc) continue;
                var npc = window.npcManager.getNPC ? window.npcManager.getNPC(h.id) : null;
                if (!npc) continue;
                if (!npc.hasFlag || !npc.hasFlag('dao_companion')) continue; // 须已结契
                if (typeof hasEventTriggered === 'function' && !hasEventTriggered(h.finaleId)) continue; // 终章须已发生
                if (typeof hasEventTriggered === 'function' && hasEventTriggered(h.amId)) continue; // 未回访过
                var ev = NPC_PERSONAL_EVENTS[h.amId];
                if (!ev) continue;
                if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npc)) continue;
                setTimeout(function(evId, npcInst) {
                    if (document.querySelector && document.querySelector('.personal-event-modal')) return;
                    var ev2 = NPC_PERSONAL_EVENTS[evId];
                    if (!ev2) return;
                    if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev2, npcInst)) return;
                    if (typeof triggerPersonalEvent === 'function') triggerPersonalEvent(evId);
                }.bind(null, h.amId, npc), 1200);
            }
        } catch (e) { console.warn('[道侣回访] 每日触发失败:', e); }
    });
}

if (typeof window !== 'undefined') {
    window.AFTERMATH_EVENTS = AFTERMATH_EVENTS;
}
console.log('[道侣回访] 结契后回访事件加载完成：' + Object.keys(AFTERMATH_EVENTS).length + ' 个');
