// ==================== hengshan-nanyue-events.js - 奚湘筠线情缘事件/结局/性别语境 v1.0（衡山·南岳扩线） ====================
// 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / registerEndingSet / registerEndingCallback /
//       hasEventTriggered / checkEventTrigger / triggerPersonalEvent / canPlayerAccessPersonalEvent）
//       npcs/npc-system.js（executeEmotionInteraction 已加 bond_dao 拦截）
// 加载顺序：在 npc-personal-events.js 之后
// 女主·奚湘筠（衡山派掌门莫大先生的关门弟子，约二十三岁，拉胡琴）。话极少，把话放在乐音里，一次一两句。
// 她的慢不是冷——是烟雨的慢，眼神是温的。《潇湘夜雨》她只肯拉半阙：师父说过，拉完的人就该下山了。
// 心口的事只有这一个执念：那半阙没拉完的曲子。终章她把下半阙拉完，「下山」被重新定义——
// 下山不是离开，是带着胡琴与人同行（或按玩家选择留下）。
// 随身物：一块松香（师父给的，用到只剩小小一块，中间一个指窝）、半阙《潇湘夜雨》的旧谱（下半阙空白）。
// 已埋意象复用：回雁琴台（fx_hy_qintai，莫大先生胡琴声彻夜不绝处）/《潇湘夜雨》既是琴曲也是衡山剑法前三十六路
// （琴中藏剑）/ 衡岳云海晨课 / 祝圣寺香火会 / 回雁峰。莫大先生为正典掌门长辈，共存不改设定；她是年轻接班人。
// 用字铁律：她的乐器是胡琴——一律写「胡琴/琴弓/琴弦（胡琴弦）/运弓/按弦/拉琴」，
// 全库古琴意象是逍遥派闻人酌专属，本文件行文禁用一切古琴专属字眼，只用胡琴语汇（拉/运弓/按弦/琴弓/琴弦）。
// 男女玩家皆可追，主线共享（代词按性别），各有专属性别语境事件（femctx/mctx）。

var XIANG_NPC_ID = 'sect_leader_衡山派';

// ============ 主线事件（xiang_event_001 ~ 011 + 终章 013） ============
var XIANG_MAIN_EVENTS = {
    'xiang_event_001': {
        id: 'xiang_event_001', npcId: XIANG_NPC_ID, title: '雨声', icon: '🌧️',
        desc: '初上衡山，夜雨里飘来半阙胡琴。',
        minAffection: 12, trigger: { random: 0.4 }, cooldown: 0, flag: 'xiang_e001_done',
        autoTrigger: { location: '衡山派', random: 0.45 },
        scenes: [
            { speaker: 'narrator', text: '你初上衡山。七十二峰的秋雨又细又密，云海沉在崖路下头，石阶润得发黑。引路的小弟子指着雨幕深处一座高台：「回雁琴台。」话音未落，台的方向飘来一缕胡琴声——低，慢，像把满山的雨一根一根接住。', type: 'description' },
            { speaker: 'narrator', text: '曲子拉到一半，停了。停得极干净，像一滴墨落在纸上就收住了笔。台上立着一名青衣的年轻女子，胡琴抱在臂弯，琴弓未收，望着雨幕出神。她察觉了你的脚步，回过头来——眼神是温的，温得像山间的雾，只是慢，不着急落在你身上。', type: 'description' },
            { speaker: 'npc', text: '「……雨来了。」她只说了这三个字，便又不作声了。弓尖虚虚搭在琴弦上，不按下去，像在等雨先开口。' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '立在阶下不出声，陪她把这一场雨听完', effect: 'wait', affection: 8 },
                { text: '拱手请教：「师姐，方才这支曲子，叫什么？」', effect: 'ask', affection: 7 },
                { text: '笑一声：「拉到一半就停——这叫听客好等。」', effect: 'jest', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'wait': aff = 8; msg = '你在阶下站定，不上前，不出声。雨落它的，她抱她的胡琴。一炷香后她收了弓，把胡琴往怀里拢了拢，朝阶下看过来：「半阙，你也听得完。」她说完这一句，转身下台，走过你身边时脚步放慢了半息——衡山的规矩，琴台不留客；可她留了，留的是这一句。往后每夜雨里，那半阙照旧，阶下多了一个听雨的位置。'; break;
                case 'ask': aff = 7; msg = '她看了你两息，弓尖朝雨幕虚虚一点：「潇湘夜雨。」顿了顿，又补上半句，「……只有半阙。」你问下半阙呢。她没有答，低头把琴弓上的浮雨用袖口拭去，一下，一下，拭得很慢。可第二天夜里你再上琴台，那半阙拉到收尾处，弓速缓了——像在等什么人跟上，不再径自收住。'; break;
                case 'jest': aff = 5; msg = '她不恼，也不笑，只把琴弓慢慢收回臂弯：「曲子停在哪儿，雨就落到哪儿。」她望了一眼你肩头淋湿的一片，「你的肩，也接了半阙。」话说得没头没尾，你却听懂了——她不是在回你的玩笑，是在告诉你：那半阙不是没拉完，是留给雨的。这一夜之后，你逢雨便想起琴台，想起那个把话放在乐音里的人。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'xiang_event_002': {
        id: 'xiang_event_002', npcId: XIANG_NPC_ID, title: '半阙', icon: '🎻',
        desc: '满山都说，师姐的曲子永远只到一半。',
        minAffection: 18, trigger: { random: 0.35 }, cooldown: 0, flag: 'xiang_e002_done',
        requireEventDone: 'xiang_event_001',
        autoTrigger: { location: '衡山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '你在衡山住了些日子，渐渐听出规律：每夜雨落，回雁琴台的胡琴便响；每夜，曲子都停在同一个地方——半阙。挑水的师弟告诉你：「师姐的曲子，十年就这半阙。谁也没听过后半截。」', type: 'description' },
            { speaker: 'npc', text: '这夜雨大。半阙拉罢，她没有像往常一样收弓下台，却对着雨幕坐着，琴弓在膝上搁了很久。她忽然开口，没有回头：「檐下凉。」——她早就知道你每夜在檐下听。', type: 'description' },
            { speaker: 'narrator', text: '雨声哗哗。她的背影在灯影里显得很薄，像一页没写完的谱。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '上台阶下坐着，不说话，陪她听雨到琴台灯尽', effect: 'listen', affection: 8 },
                { text: '轻声问：「下半阙——是不会拉，还是不肯拉？」', effect: 'ask', affection: 6 },
                { text: '笑一声：「拉不完的曲子，夜夜拉它做什么。」', effect: 'mock', affection: -4 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'listen': aff = 8; msg = '你上台阶下，隔着半步坐下，什么都不问。雨落了一夜，灯芯剪了两回，她始终没有再说话——可那半步，她没有让你挪远。灯尽时她起身，把外袍上的一片湿痕抚平，走了两步，停下：「明夜，带件干的坐。」就五个字。第二天琴台角落多了一块蒲团，是新的，蒲草的味道混在雨气里，闻着发暖。'; break;
                case 'ask': aff = 6; msg = '她的弓在膝上顿了顿。很久，雨都落过一阵了，她才开口：「……怕。」一个字，没有下文。你等着，不催。她又坐了一炷香，才添了半句：「拉完了，人就该下山了。」说完她自己像是也说怔了，低头看膝上的琴弓，看了很久。这一夜的话，比她一个月的都多——多出来的，全是给你的。'; break;
                // 真负选项：半阙是她十年的执念，笑它「拉不完」等于笑她这十年白守
                case 'mock': aff = -4; msg = '琴弓从她膝上拿起来了——不是收，是横回琴上，弓毛咬住弦，把一声极短的锐音掐断在雨里。「拉不完？」她的声音还是慢的，慢得听不出火气，可字字都沉，「十年，夜夜拉给它听的东西——你叫它做什么。」她抱起胡琴下台，没有看你。那一夜之后，琴台的琴声改到更深的时辰，避开了你檐下的位置。你站过的地方，雨水冲得干干净净。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'xiang_event_003': {
        id: 'xiang_event_003', npcId: XIANG_NPC_ID, title: '松香', icon: '🟤',
        desc: '她拉琴前总要擦一块松香，那块松香小得只剩一个指窝。',
        minAffection: 25, trigger: { random: 0.35 }, cooldown: 0, flag: 'xiang_e003_done',
        requireEventDone: 'xiang_event_002',
        autoTrigger: { location: '衡山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '你注意到一个细节：她每夜拉琴前，必从袖中取出一块松香，在弓毛上来回擦三下——不多，不少。那块松香琥珀色，磨得只剩小小一块，中间凹着一个指窝，是常年捏出来的。琴台上下没人碰过它。', type: 'description' },
            { speaker: 'npc', text: '这夜擦松香时，她察觉了你的目光。手停了半息，随即照旧擦完第三下，把松香收进袖中——收得比往常快了些。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '不碰，只问：「那块松香——用了几年了？」', effect: 'ask', affection: 7 },
                { text: '什么也不问，看她擦香、调弦，陪她把半阙听完', effect: 'stay', affection: 6 },
                { text: '伸手就要去拿：「给我瞧瞧，什么宝贝。」', effect: 'grab', affection: -5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'ask': aff = 7; msg = '她看了你三息，雨都在那三息里落远了。然后她把手从袖中抽出来，摊开——那块小小的松香躺在指窝里，琥珀色被灯照得透出一点旧光。「七岁起。」她说，「师父给的。」就这两个短句，她把松香收好，用一方素布裹了，裹得很仔细。可从这天起，她擦松香不再避你——第三下擦完，偶尔会抬眼看看你，像在确认听的人还在。'; break;
                case 'stay': aff = 6; msg = '你没问。看她擦香三下，看她按弦试音，看半阙从弓下淌出来又停在老地方。灯尽时她收琴，忽然说：「松香，是让弓毛咬住弦的。」她望着檐外的雨，「没有它，声音出不来。」说完就下台了。你后来才懂这句话的分量——她把自己十年里最要紧的东西，拣了一句最平的，讲给你听。第二天起，她擦松香的时辰，比往常早了一刻。'; break;
                // 真负选项：松香是师父给的、她捏了十六年的东西，伸手去夺等于夺她的命门
                case 'grab': aff = -5; msg = '你的手伸到一半，她的腕先到了——拉琴的手，慢了一世的人，这一下快得没有一点声音。「别碰。」她把松香按回袖中，声音还是慢的，眼神却头一回从你身上挪开了，「它不是玩意儿。」这一夜的半阙，她拉得极早，早到雨还没落透。之后一个月，她擦松香都侧过身去，袖口挡着。你很久以后才明白：她怕的不是你碰，是你碰过了，随手还回来——像还一件不值钱的东西。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'xiang_event_004': {
        id: 'xiang_event_004', npcId: XIANG_NPC_ID, title: '夜雨引雾', icon: '🌫️',
        desc: '小弟子在祝融峰的云海里迷了路，她抱琴上了台口。',
        minAffection: 32, trigger: { random: 0.3 }, cooldown: 0, flag: 'xiang_e004_done',
        requireEventDone: 'xiang_event_003',
        autoTrigger: { timeRange: [21, 3], location: '衡山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '夜雨夹雾，衡岳云海翻上崖路。祝融峰下送香火的小弟子天黑还没回山，有人在雾里迷了路——云海一起，灯照不出三丈，喊声落地就被雨吃掉了。', type: 'description' },
            { speaker: 'npc', text: '奚湘筠已经抱着胡琴上了琴台最外沿，油布卸了，弓毛擦好。「我拉。」她只说了一个字，随即对台下的弟子道，「声音比灯远。他在云海里，听得见半阙。」', type: 'description' },
            { speaker: 'narrator', text: '雨横风斜，琴台外沿湿滑。《潇湘夜雨》的半阙在夜雨里拉了一遍，又从头拉一遍——半阙短，引路要长，她一遍一遍地循环，弓速不乱。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '提灯上崖路，循着琴声一路喊话接应迷路的孩子', effect: 'lamp', affection: 8 },
                { text: '站上琴台风口，卸了外袍撑开，替她挡斜进来的雨', effect: 'shield', affection: 7 },
                { text: '「迷个路罢了，天亮雾散自己就回来了，何必冒雨拉琴。」', effect: 'shrug', affection: -3 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'lamp': aff = 8; msg = '你提着灯扎进崖路，琴声在头顶，你一程一程地喊：「循声走！灯在这儿！」云海里哭声应了一声，又一声——小弟子顺着琴声与你的灯，深一脚浅一脚地摸回台上，跪下就朝琴台磕头。她没有停弓，只在孩子磕完头后说了四个字：「雨凉，换衣。」孩子被带走了，半阙才收。她转头看你的灯——灯一夜没灭。「……灯稳。」她说。慢人的一句夸，比满山的雨都重。'; break;
                case 'shield': aff = 7; msg = '你站上风口，把外袍撑在栏上，斜雨扑了你一身，琴台这一角却干了。她一遍一遍拉那半阙，弓速没有乱过一息——五遍拉完，云海底下传来应声，孩子回来了。下台时她才看你，看你湿透的半边肩，看了很久，说：「雨，偏的。」你不懂。旁边的师妹替你懂：师姐是说，往后琴台的风口，她记下了，不会再叫雨偏着你淋。第二天台角多了一件叠得方正的干外袍。'; break;
                // 真负选项：她把琴声当救人的灯，「何必冒雨拉琴」戳的正是她这半阙十年里唯一的用处
                case 'shrug': aff = -3; msg = '她回过头，在雨里看了你一眼。那一眼还是温的，却慢慢地收回去了，像潮退。「孩子在雾里。」她说完这五个字，转身继续拉，一遍，又一遍。孩子是她一个人循声引回来的，收弓时手在抖——不是冷的。你后来听守夜的师弟说：师姐刚学琴那年也在云海里迷过路，满山只有师父的琴声找得到她。那夜起她记下一条：声音比灯远。你今晚笑掉的，是她十年的灯。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'xiang_event_005': {
        id: 'xiang_event_005', npcId: XIANG_NPC_ID, title: '旧谱', icon: '📜',
        desc: '她给你看那半阙《潇湘夜雨》的旧谱。',
        minAffection: 40, trigger: { random: 0.3 }, cooldown: 0, flag: 'xiang_e005_done',
        requireEventDone: 'xiang_event_004',
        autoTrigger: { location: '衡山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '雨后，她把你叫进琴台的侧屋。案上摊着一份旧谱——《潇湘夜雨》，上半阙墨色陈旧，一笔一笔都稳；下半阙空白。可那空白不是干净的空白：密密麻麻写满了起了又收的草稿墨痕，写了洇掉、洇掉再写，纸面都起了毛。', type: 'description' },
            { speaker: 'npc', text: '「衡山剑法的前三十六路，也叫潇湘夜雨。」她的指尖落在谱首，「琴里藏剑。上半阙是师父给的，下半阙——」指尖停在空白处，停住，「要自己长出来。」', type: 'description' },
            { speaker: 'narrator', text: '谱角有一行极小的旧字，是长者的笔迹：「曲成之日，下山之时。」墨比别处深，像被人一遍遍看过。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '铺纸研墨，陪她把上半阙一笔一笔摹一份', effect: 'copy', affection: 8 },
                { text: '指着那片洇毛的空白：「这后头——你想写成什么？」', effect: 'ask', affection: 6 },
                { text: '「我替你下山去，访一访江湖上《潇湘夜雨》的旧谱残卷。」', effect: 'seek', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'copy': aff = 8; msg = '你铺纸，她教你摹法——谱字可以摹，板眼之间的空白不能填，「空白是气口。气口要留给自己。」两人伏案摹到灯芯烧尽，雨在檐外落了又停。她吹了灯，黑地里忽然说：「十年，摹这份谱的，只有我一双手。」第二天，新摹的那一份收进了谱匣最里层，谱尾并排两个名字，一个写得稳，一个写得更稳——是照着她的笔迹，练过的。'; break;
                case 'ask': aff = 6; msg = '她的指尖在那片洇毛的空白上停了很久。「雨停。」她说。就两个字。你等着，她又坐了一炷香，才添了下半句：「雨停了以后，人往哪儿走——写不出。」她合上谱，动作很轻，像怕惊动纸上的墨痕。可那份谱当晚没有归匣，摊在案头。往后你每回来，它都摊着，空白朝外，像一页没说完的话，专门留着给人看。'; break;
                case 'seek': aff = 7; msg = '她抬起头看你，慢慢地摇：「谱在江湖上死了很久了。」你没听，下山去了。十日回来，访到三卷杂谱残卷，纸都脆了。她就着灯一卷一卷翻，一卷一卷摇头：「……都不是。」摇完头，却把三卷都收进了谱匣最外层，收得整齐。「找过的路，」她合上匣子，声音很轻，「也算路。」这三个短句，你后来想了很多年——她的话少，可一句都不白给。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'xiang_event_006': {
        id: 'xiang_event_006', npcId: XIANG_NPC_ID, title: '下山的话', icon: '🏔️',
        desc: '她讲起拜师那天，师父只说了一句话。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'xiang_e006_done',
        requireEventDone: 'xiang_event_005',
        autoTrigger: { location: '衡山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '雨歇的黄昏，她坐在琴台最外沿，胡琴横在膝上，没有拉。今天她说话，比这半年加起来都多——虽然每句之间，都隔着一场雨的工夫。', type: 'description' },
            { speaker: 'npc', text: '「七岁，师父在山门口捡的我。」她望着云海退下去的地方，声音很慢，「他看了看我的手，给了这份谱，给了那块松香。就说了一句——」' },
            { speaker: 'npc', text: '「『拉完这支曲子，你就下山。』」她把琴弓在膝上转了半圈，「十年，我只敢拉半阙。半阙拉不完，人就不用下山。」顿了顿，「……骗了师父十年。」', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？（这一桩，没有对错，只有听法）', options: [
                { text: '「那就先不拉完。我听着半阙，就很好。」', effect: 'stay', affection: 9 },
                { text: '什么都不说，陪她在台沿坐到檐雨滴尽', effect: 'sit', affection: 8 },
                { text: '「下山，也许不是离开——是把曲子带下山去。」', effect: 'echo', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'stay': aff = 9; msg = '她转过头来看你。暮色落在她脸上，眼睛里有雨后云海那样的光。「……听着半阙，就很好。」她把这句话极慢地重复了一遍，像把它按进谱里的一个板眼。然后她低头看膝上的胡琴，看了很久，忽然拉了一弓——就一弓，起音半句，又收住了。「骗下去罢。」她说。声音很轻，可是那晚下台的时候，她走在你侧后半步——十年里，她头一回没有走在所有人前头。'; break;
                case 'sit': aff = 8; msg = '你没说话。檐雨一滴一滴地尽了，云海一寸一寸地沉下去，她膝上的琴弓转了一圈又一圈。雨滴尽时她起身，理了理衣上的潮气，忽然说：「师父说完那句话，也是这样一个黄昏。我一个人坐到天黑。」她看了你一眼，眼神温温的，「今天坐着，是两个人。不一样。」她没有说不一样在哪里。可当晚琴台的灯，比哪一天都熄得晚。'; break;
                case 'echo': aff = 7; msg = '她浑身轻轻一震，像琴弦上落了一滴雨。「带下山去……」她盯着你，看了很久很久，眼眶慢慢红了，声音却还是慢的，「十年，满山的人都当那半阙是我的病。师父说下山，师叔们说下山——」她深吸了一口气，把胡琴往怀里拢了拢，「你是头一个，说下山不是离开。」她转回去望云海，「这句话，我要写进谱里。」那片洇毛的空白上，当晚落了新新的一行小字，只有四个字：「携曲下山。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'xiang_event_007': {
        id: 'xiang_event_007', npcId: XIANG_NPC_ID, title: '琴台彻夜', icon: '🕯️',
        desc: '祝圣寺香火会之夜，她要以半阙陪一夜香火。',
        minAffection: 55, trigger: { random: 0.3 }, cooldown: 0, flag: 'xiang_e007_done',
        requireEventDone: 'xiang_event_006',
        autoTrigger: { location: '衡山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '祝圣寺香火会，衡山一年里最盛的一夜。衡岳云海连日不散，门里循旧例：回雁琴台彻夜奏《潇湘夜雨》，琴声陪香火到天明。可她只有半阙——拉完一遍，从头再来，一夜循环。三更未过，满山香火正旺，她运弓的小臂已经开始发抖。', type: 'description' },
            { speaker: 'npc', text: '「半阙，也够陪一夜。」她对自己说，也像对琴说。汗把鬓发黏在颊上，她腾出一指把它别回去，弓没有停。台下的弟子们面面相觑——这一夜还长得很。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '上台守在琴侧：擦松香、温手、换弓，一夜不离', effect: 'tend', affection: 11 },
                { text: '坐在台下守那炉随喜的香火，曲终一轮便添一炷香', effect: 'fire', affection: 8 },
                { text: '唤门中弟子轮值候场，趁间请她下来歇一刻', effect: 'relief', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'tend': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 11) : { ok: true };
                    if (!_py.ok) { aff = 4; msg = '你要上台，眼前却先黑了一黑——连日听雨守夜，你的气力早掏空了。她半阙拉到间隙，反手把你按回台侧的干处，眉头拧起来：「守一夜先倒一个，学的谁。」她自己撑到了天明，下台时小臂抖得端不住琴，却先把那块松香塞进你手里替你拢住指头——松香是温的，她掌心的温度。（精力不足，那一夜你先撑不住了）'; break; }
                    aff = 11; msg = ('你在琴侧守了一夜：弓毛乏了，你递松香，三下，一下不多；她指尖凉了，你把手炉挪近半寸；琴弓的马尾松了，你替她换上备弓——每一样都赶在半阙与半阙的间隙里，不出一点声。天光白时最后一轮收尾，满山香火与琴声一同落定。她瘫坐台沿，小臂抖得抬不起来，转头看你，笑得很慢，眼里全是灯尽后的水光：「一夜。你没坐。」') + '（精力-11）'; break; }
                case 'fire': aff = 8; msg = '你坐在台下守那炉随喜的香火——半阙终了一轮，你添一炷香；再终一轮，再添一炷。一夜添了四十一炷，香灰积得雪白，炉火没有暗过一息。天明她下台，眼睛先找的不是迎她的师弟，是那炉香，再看守香的人。「火，一夜没断。」她说。顿了顿，又添了半句，慢得几乎听不见，「……像有人在台下，替我数着板眼。」'; break;
                case 'relief': aff = 7; msg = '你唤齐了四位会琴的师弟轮值候场，趁半阙收束的间隙请她下来——她摇头：「这支曲子，只能我拉。」话是硬的，人却依了你的安排：换场的空当，她在侧屋歇了三刻。出来时琴弓已经上好松香，三下，不多不少——是你替她擦的。她捏着弓看了你一眼，什么也没说。可那一夜之后的每一夜，她擦松香的第三下，都会朝你的方向偏过半分。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'xiang_event_008': {
        id: 'xiang_event_008', npcId: XIANG_NPC_ID, title: '琴中藏剑', icon: '🗡️',
        desc: '寅时，她第一次试拉下半阙的头一句。',
        minAffection: 62, trigger: { random: 0.3 }, cooldown: 0, flag: 'xiang_e008_done',
        requireEventDone: 'xiang_event_007',
        autoTrigger: { timeRange: [4, 6], location: '衡山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '寅时，琴台方向传来一声异音——不是半阙里的任何一个音。你赶去时，她立在台心，弓按在弦上，整个人绷得像拉满的弓。衡山的琴里藏剑：下半阙的头一句一出，琴音便化成剑意，台前一片云海被生生劈开一道口子，雨幕横飞。', type: 'description' },
            { speaker: 'npc', text: '剑意顺着琴弓往回吃人。她的虎口已经渗了血，弓却在弦上下不来——那一句起了，收不住，人被自己的曲子钉在台心，离台沿只有半步。', type: 'description' },
            { speaker: 'narrator', text: '台外的云海还在翻，剑意一卷一卷往外荡。这一刻，琴台上下只有你离她最近。', type: 'description' },
            { speaker: 'player_select', text: '你必须立刻做点什么。', options: [
                { text: '抢上去，把那小块松香按进她掌心：「先擦香。弓不打滑。」', effect: 'rosin', affection: 12 },
                { text: '立到她身后，双手稳稳托住她的弓肘：「慢。雨要慢慢落。」', effect: 'steady', affection: 9 },
                { text: '低声吩咐赶来的弟子，把琴台四周的灯尽数点起来', effect: 'lamp', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'rosin': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 12) : { ok: true };
                    if (!_py.ok) { aff = 5; msg = '你抢上一步，连日守夜的身子却先晃了晃——她剑意缠身，竟还分出一手把你从台沿拽了回来。松香是你跌坐时从台板上摸到、反手抛进她怀里的。她以腕抵香，就着弓毛擦了一记，剑意松了半扣，那一句才收得住。天亮时她独自裹了虎口的伤，来寻你，只说四个字：「香，接住了。」慢人的声音哑着，却把「接住」两个字咬得很稳。（精力不足，那一寅时你先撑不住了）'; break; }
                    aff = 12; msg = ('你抢上去，抓起台角的松香按进她掌心——她指下意识地一捏，弓毛蹭过松香，咬弦的力道回来了半分。「先擦香。」你贴着她耳边说，「弓不打滑。剑再快，也快不过你运弓的三下。」她喘了一息，就着你的话把弓速压慢，剑意一扣一扣地退回琴腹，云海合拢，雨幕垂下来。收弓时她跌坐台心，虎口的血滴在谱上，她先看的是你有没有被剑气扫到。看完才低头，极轻地说：「……头一句，收住了。有你一半。」') + '（精力-12）'; break; }
                case 'steady': aff = 9; msg = '你立到她身后，双手托住她的弓肘——肘在抖，像一泓要溢的水。「慢。」你说，「雨要慢慢落。潇湘的夜雨，从来不是砸下来的。」她的呼吸乱了三息，第四息起，跟着你的话慢下来。弓速一寸一寸压住，剑意顺着琴弦一层一层退回琴腹，云海的口子缓缓合拢。收弓时她没有回头，只把弓肘在你掌心里又搁了一息——就一息，比任何话都长。天亮她自己在谱上记了一行小字：「头一句，起于寅时，收于一双手。」'; break;
                case 'lamp': aff = 6; msg = '琴台四周的灯一盏一盏亮起来，照得翻涌的云海如在白昼——剑意在光里显了形，她借着看清了剑意的走向，一扣一扣把它收回弓下。曲收时天将明，她还立在台心，望着那一圈灯，忽然说：「剑意吃黑，不吃光。」她转头看你，「点灯的人，懂琴。」这一夜之后，琴台的四角添了常明的灯——师弟们说，是师姐吩咐添的，添灯那晚，她说了整整一句话：「灯，为拉夜曲的人点。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'xiang_event_009': {
        id: 'xiang_event_009', npcId: XIANG_NPC_ID, title: '松香之诺', icon: '🎐',
        desc: '她把用了十六年的那块松香，放进你手里。',
        minAffection: 68, trigger: { random: 0.3 }, cooldown: 0, flag: 'xiang_e009_done',
        requireEventDone: 'xiang_event_008',
        autoTrigger: { location: '衡山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '雨歇后的黄昏，她把你留下。琴台的灯下，她从袖中取出那块松香——琥珀色，磨得只剩小小一块，中间的指窝被灯照得发亮。十六年的体温，都在这一个指窝里。', type: 'description' },
            { speaker: 'npc', text: '「松香，给你。」她把它放进你掌心，替你把手指一根一根合拢，动作很慢，很稳，像在谱上落一个不许错的板眼，「雨里闻到松香，就是我在想你。」', type: 'description' },
            { speaker: 'npc', text: '「师父的松香，是让弓咬住弦的。」她收回手，耳根红着，声音还是慢的，「我的——往后咬着人。」', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '合拢手指握紧松香，郑重收进怀里贴身的口袋', effect: 'take', affection: 14 },
                { text: '「松香我收着。可你运弓的手，不能再空着等下半阙。」', effect: 'vow', affection: 9 },
                { text: '看着她，问：「为什么是我？」', effect: 'ask', affection: 8 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'take': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 14) : { ok: true };
                    if (!_py.ok) { aff = 6; msg = '你抬手接香，连日奔波的身子却乏得指尖发颤，松香险些从指间滑出去——她先一步拢住，把松香连同你的手一起按在她掌心。「拿稳。」她低着头说，「这块香，我拿了十六年，才拿稳。」那晚的灯燃到很晚。你下台时，松香已经贴身收好，隔着衣裳，那个指窝贴着心口，是温的。（精力不足，那一夜你乏得厉害，香是她替你捂热的）'; break; }
                    aff = 14; msg = ('你合拢手指，把松香握紧，收进怀里贴身的口袋——指窝贴着心口，还带着她的体温。她看你收好，从头到尾没有移开眼，像看你把一句谱落定。然后她吹熄了灯。黑暗里，她把额头轻轻抵在你肩上，就一息：「雨里闻到松香，就是我在想你。闻到松香还在——」她顿了顿，声音低下去，「就是琴，还拉得下去。」') + '（精力-14）'; break; }
                case 'vow': aff = 9; msg = '她替你合拢的手指紧了一下。「不空着等……」她重复这五个字，转头望檐外的雨后云海，声音慢得像常，「下半阙，十年没敢起弓。」话到这里收住了，可第二天起，琴台的夜里多了一件事：半阙拉罢，她会试着往下运一弓——就一弓，起头一句，收不住就停。每一停，她都朝台侧你的位置看一眼。看一眼，再起下一夜的弓。'; break;
                case 'ask': aff = 8; msg = '她没有立刻答。她转身翻开那份旧谱，一页一页指给你看：檐下听半阙的人，雾夜里提灯的人，香火会守火的人，寅时托住弓肘的人。谱上没写名字，可每一处板眼旁都有极小的记号——她合上谱：「松香只认一双手。」她说，「十六年，替弓擦香的，只有我自己。往后——」她抬起眼，耳根红透，慢吞吞地把话说完，「多一个。你自己看。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'xiang_event_010': {
        id: 'xiang_event_010', npcId: XIANG_NPC_ID, title: '莫大先生之问', icon: '🧓',
        desc: '掌门回山，坐在琴台最高一级，听她拉完半阙。',
        minAffection: 72, trigger: { random: 0.3 }, cooldown: 0, flag: 'xiang_e010_done',
        requireEventDone: 'xiang_event_009',
        autoTrigger: { location: '衡山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '莫大先生回山了。老人没有进正堂，背着那把旧胡琴，径直坐上回雁琴台最高的一级石阶，任夜雨落在笠上。她立在台心，为师父拉了半阙《潇湘夜雨》——十年如一的半阙。老人听完，很久没有作声。', type: 'description' },
            { speaker: 'narrator', text: '然后他开口了，声音像干枯的芦苇擦过：「这支曲子，在她手里十年，永远只有半阙。满山的人都劝她拉完。」老人的目光越过雨幕，落在你身上，「你说——下半阙，该不该拉？」', type: 'description' },
            { speaker: 'npc', text: '奚湘筠一步跨到你身前，背脊绷得笔直，声音发紧：「师父。谱是弟子自己的谱，与外客无干——」', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '对莫大先生一礼：「该不该拉完，师姐心里早有板眼。在下只是个听雨的。」', effect: 'answer', affection: 8 },
                { text: '「下半阙接的不是谱上的音——是寅时那一句剑意。她怕的不是拉完，是拉坏。」', effect: 'sword', affection: 7 },
                { text: '与她并肩而立：「弟子斗胆反问先生——当年您拉完这支曲子下山时，山下有什么？」', effect: 'side', affection: 11 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'answer': aff = 8; msg = '老人盯着你看了半晌，笠沿的雨线断了又续。他忽然低低笑了一声，笑声像弓毛擦过旧弦：「十年，上这台来的人，没有一个不先劝她拉完。」他把背上的旧胡琴往怀里拢了拢，「你不劝。你听雨。」他起身下阶，走过她身边时停了一步：「雨有到的时候。曲子也有。」——满山寂静里，她绷直的背，慢慢松了。'; break;
                case 'sword': aff = 7; msg = '老人的眼睛忽然亮了一下——像剑从云海里出鞘的那一瞬。「衡山的琴里藏剑。」他缓缓地说，「看得出来这一层的，一百年里没有几个。」他转头看她，目光在雨里放了很久：「你怕拉坏，所以只敢拉半。可剑意已经自己长出头一句了——它不等你。」他下阶时留下最后一句话，轻得像雨，「你的下半阙，往后拉给懂的人听。」那晚她在琴台坐到天明，谱上洇毛的空白处，新落了一个起音的记号。'; break;
                case 'side': aff = 11; msg = '你上前一步，与她并肩。她的手臂绷得像上满的弓，袖底的指尖却悄悄松了半分。莫大先生按弓的手，彻底停住了。雨落满了整个琴台，没有人说话。很久很久，老人才开口，声音哑得厉害：「……雨。」他就答了一个字，起身，把笠上的水抖落，「山下只有雨。雨里有人听曲。」他一步一步走进云海，背影孤高如旧，只留下八个字落在台上：「曲归她。山，也归她。」事后她立在原地很久，轻声说：「师父拉完曲子下山，四十年——没有跟人说过山下有什么。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'xiang_event_011': {
        id: 'xiang_event_011', npcId: XIANG_NPC_ID, title: '山洪夜雨', icon: '⛈️',
        desc: '秋雨三日，回雁峰下的崖路塌了。',
        minAffection: 78, trigger: { random: 0.3 }, cooldown: 0, flag: 'xiang_e011_done',
        requireEventDone: 'xiang_event_010',
        autoTrigger: { timeRange: [22, 4], location: '衡山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '秋雨连下三日。半夜，回雁峰下传来一声闷雷似的轰响——崖路塌了一段，山洪顺着石阶往下奔。祝圣寺随喜过夜的四名香客和两个小弟子，被困在残崖那一段上，崖下的水还在涨，一刻一个尺。', type: 'description' },
            { speaker: 'npc', text: '奚湘筠已经在崖口。胡琴用油布裹好负在背后，缆索盘在臂上，报得干脆——她的话从来没有这样密过：「崖路三十丈，水涨一刻一尺，窗口两刻。我下去背人——崖上，替我把缆稳住。」', type: 'description' },
            { speaker: 'narrator', text: '雨把所有声音都吞了。她已把缆索在崖桩上绕了第一圈，背影很直，一步一步踩着塌口的残木往下探。', type: 'description' },
            { speaker: 'player_select', text: '你必须立刻做点什么。', options: [
                { text: '随她下崖：她背人，你在暴雨里替她稳缆、接人', effect: 'rope', affection: 14 },
                { text: '先扑上塌口，用身子顶住那根将断未断的残木，替她多挣一刻', effect: 'brace', affection: 15 },
                { text: '守在琴台高处，把崖路一线的灯尽数点亮，照亮她上下的路', effect: 'lamp', affection: 10 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'rope': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 14) : { ok: true };
                    if (!_py.ok) { aff = 6; msg = '你追下崖去，一脚踏滑塌口的碎石，整个人往下坠了半丈——是她在暴雨里反手扣住你的腕，把你推回崖上稳处。「稳缆。」她只说了两个字，自己翻身下崖。两刻之后，六个人一个不少地回来了。她坐在雨里骂你：「气力平日都长在哪里了？」骂完，却把救人那段缆在你磨破的掌心上绕了两圈，打了个结。（精力不足，那一夜崖上你先撑不住了）'; break; }
                    aff = 14; msg = ('暴雨像墙。你与她一上一下——她下崖背人，你在崖口把缆索一寸一寸地稳；每接回一个，你就把缆往崖桩上多绕一圈。六个人一个接一个从洪水上头回到崖上，最后一个小弟子上来时，朝你二人跪下就磕头。你去扶，才发觉两只手掌全被缆勒开了口子——她在雨里看了你的手一眼，没有说话，转身把六个人一个一个点齐。点完，她负着油布裹的胡琴在雨里站定，忽然说：「三十丈，六个人，两刻。」顿了顿，添了半句，「……缆，从头到尾没有松过一寸。」') + '（精力-14）'; break; }
                case 'brace': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 14) : { ok: true };
                    var _py2 = (_py.ok && typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 20) : { ok: _py.ok };
                    if (!_py.ok || !_py2.ok) { aff = 8; msg = '你扑上塌口，肩刚顶上残木，第二段塌方就把你掀翻在泥水里，眼前发黑——是她弃了缆索翻上崖来拽住你，六个人由闻讯赶到的师弟们接应着绕远路带了回来。两个人瘫在雨里，谁也没站住，靠着崖桩对喘。她先开口，声音哑的：「……顶不住的崖，不许顶。这是琴台第一课。」话是训，手却一直扣着你的腕，没有松。（精力不足，那一夜塌口你先撑不住了）'; break; }
                    aff = 15; msg = ('你扑上塌口，肩抵崖石，用整个身子顶住那根将断未断的残木——塌方在你脚下又滑了一尺，你硬生生替那条崖路多挣出一刻。头顶上她背着人一个一个越过你的肩线，每过一个是那半阙里的一个音，她竟就着暴雨低低地哼，一声一声给你数着板眼：「一——」「二——」……「六——」残木彻底塌下去时你被泥水卷走半丈，是她扑下来扣住你的腕——那一下的力道比缆索还硬。崖上她先点人：六口，一个不少。再回头点你，从头到脚，点得很慢。点完她在雨里抱着膝坐了一会儿，肩膀轻轻抖了一下——没有哭。站起来时声音慢得像常：「六个人。加一。」') + '（精力-34）'; break; }
                case 'lamp': aff = 10; msg = '你守在琴台高处，把崖路一线的灯一盏一盏点亮，又爬上榜棚把最高那盏拨到最旺——三十丈崖路亮成一条线。她借着光下崖背人，六口，一个不少。回崖时她先看的不是人，是那一线灯：「灯，一夜没有暗过。」你报数：「灯芯剪了三回。」她点头，从怀里取出那方素布，把松香的位置空出来，将崖路的一小截缆头裹了进去——琴台的谱匣里，从此收着一件不是谱的东西。裹缆头那晚她记了一行小字：「雨夜，灯明，人归。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'xiang_event_013': {
        id: 'xiang_event_013', npcId: XIANG_NPC_ID, title: '终章·夜雨阑', icon: '🎻',
        desc: '大雨之夜，她要把《潇湘夜雨》拉完。',
        minAffection: 85, trigger: { random: 1.0 }, cooldown: 0, flag: 'xiang_e013_done',
        requireEventDone: 'xiang_event_011',
        autoTrigger: { location: '衡山派', random: 1.0 },
        endingMap: { '烟雨': 'xiang_ending_烟雨', '守雁': 'xiang_ending_守雁', '雨行': 'xiang_ending_雨行', '雁信': 'xiang_ending_雁信', '雨尽': 'xiang_ending_雨尽', '过雁': 'xiang_ending_过雁' },
        scenes: [
            { speaker: 'narrator', text: '入冬头一场大雨之夜，衡岳云海齐到峰腰。回雁琴台挤满了人，却都默契地给台心让开了位置。莫大先生立在阶下的雨里，笠沿垂着，看不见面目——满山弟子屏息。', type: 'description' },
            { speaker: 'npc', text: '奚湘筠立在台心，旧谱摊在琴架上，下半阙的空白处已写满了新墨。她朝你伸出手——掌心向上，不说话。', type: 'description' },
            { speaker: 'narrator', text: '你把那块松香放进她掌心。她就着你的手，把它捏进指窝，在弓毛上擦了三下——不多，不少，十六年的规矩。', type: 'description' },
            { speaker: 'narrator', text: '《潇湘夜雨》，十年来的头一回，响起了下半阙。雨声、琴声、剑意合成一处，云海豁然中分开到天际——剑意没有再吃人，它顺着弓走，像雨顺着檐走。曲终，满山只剩雨。', type: 'description' },
            { speaker: 'npc', text: '「{playerName}。」她抱着胡琴，弓还没有收，眼神温温地落在你身上，慢得像这场雨，「师父说，拉完的人，就该下山了。今夜，我拉完了。」她顿了顿，「怎么下山——你说。」', type: 'description' },
            { speaker: 'player_select', text: '你的选择将决定你们的关系走向', options: [
                { text: '「跟我下山。带上胡琴——雨落在哪里，潇湘夜雨就拉到哪里。」', effect: 'lover_travel', affection: 30 },
                { text: '「留在衡山。回雁琴台添第二把椅——你拉琴，我听雨，年年如此。」', effect: 'lover_stay', affection: 28 },
                { text: '「你下山拉曲给江湖人听。我陪你走旱路——一年一程路，一年一会听。」', effect: 'friend', affection: 20 },
                { text: '「给我在山下留个常客的位子。落雨时我寄信来——你把信，压进旧谱。」', effect: 'friend_stay', affection: 18 },
                { text: '「曲拉完了，你就该下山了。我不过是过衡山的客。」', effect: 'none', affection: 0 }
            ]}
        ],
        effects: function(npc, choice) {
            // 三度伤透即寒心：辜负独立成结局「雨尽」，与「过雁」（错过）分账
            var negCount = (window._negativeChoiceCount && window._negativeChoiceCount[XIANG_NPC_ID]) || 0;
            if (negCount >= 3 && (choice === 'lover_travel' || choice === 'lover_stay')) {
                return { affection: 0, msg: '她看着你，看了很久很久——那双温了十年的眼睛，一寸一寸地凉下去，像雨落进深潭。然后她低头，把弓毛上的松香一点一点拭净，拭得极慢，极干净，收进匣中；连同那份写满了下半阙的旧谱，一并上了锁。「……好。」她说，就一个字。曲终的那一句还悬在雨里，她没有收弓，任由它散掉——十年的半阙，一夜拉完，一夜拉死。「我以为檐下听曲的，是人。」她抱起胡琴，独自走下琴台，背影笔直，「原来只是躲雨的客。」那一夜之后，回雁琴台再没有琴声。弟子们说，师姐的胡琴入了匣，松香入了匣，下半阙——此生再没有人听见过。', ending: '雨尽' };
            }
            switch (choice) {
                case 'lover_travel': return { affection: 30, msg: '她终于收了弓，忽然笑了——笑得很慢，像云海一寸一寸地开：「……下山。」她把琴台的事一样一样交代给师妹：灯的位置，蒲团的位置，香火会添弓的规矩；自己只带了胡琴，和那份谱——上下两阙都写全了的谱。「曲拉完了。」她握住你的手，掌心有松香的味道，握得很稳，「雨停了以后，人往哪儿走——谱上写不出的那一句，往后，往有雨的地方走。」那一夜的雨落得极慢，回雁琴台的灯，亮到了天明。阶下，莫大先生朝着你们下山的方向，立了很久很久。', ending: '烟雨' };
                case 'lover_stay': return { affection: 28, msg: '她盯着雨幕，很久，转过身来——眼睛弯着，弯成雨后云海的弧度：「……好。」她把琴弓收好，「我留衡山。你也留。」第二日，回雁琴台添了一把椅，摆在谱架左手边，椅脚垫了石，稳稳的。她向师妹交代台里的规矩，末了一条是：「夜雨的曲子，两个人听。」师妹问蒲团够不够，她一字不废：「够。他的那一个，我早备下了。」旧谱摊在案头，谱尾多了一行小字，墨迹很新：「夜雨阑。琴台，有二人。」——下山？她把这两个字重新写了：曲拉完了，人不必走。', ending: '守雁' };
                case 'friend': return { affection: 20, msg: '她想了想，忽然笑开——十年里难得有这样不设防的一笑：「一年一程，一年一听？」她拿琴弓轻轻敲了敲谱面，「潇湘夜雨上下两阙，统共七十二板。你算过要听多少年么？」她不等你答，已转身把胡琴归了油布，背对着你，声音慢悠悠地落下来，「七十二板，一年一板——够你听一辈子。旱路的驿站，雨夜我拉曲，你点灯。」那夜旧谱的末页多了一行小注：「有同行者，岁以雨为期。」', ending: '雨行' };
                case 'friend_stay': return { affection: 18, msg: '「常客的位子？」她把旧谱收拢，掂了掂，像在掂一份谱的分量，「琴台的规矩，夜曲不留外客。」她顿了顿，翻开谱尾的空白页，把山下的驿路、渡口、落雨的节气，一笔一笔写清楚，递给你，「信可以来。来的信——压进谱里。」她看你，耳根微红，话还是慢的，「你的信，雨误了，它也不会误。」那一年起，半阙的旧谱成了全谱——下半阙的板眼之间，压着一页一页山下来的信，信纸带着雨气的潮，墨迹没有一页洇过。', ending: '雁信' };
                case 'none': return { affection: 0, msg: '她执弓的手在半空停了很久很久。然后她把弓收回，用袖口把琴弦上的雨一滴一滴拭净，拭得极慢，像把这十年一并拭过。「曲拉完了。」她的声音慢得像常，听不出波澜，「客，下山罢。夜雨路滑。」她抱起胡琴，独自走下琴台——师父的话，她终于做到了：拉完的人，就该下山。你立在琴台上，看她的背影走进云海，一步一步，没有回头，像一只过天的雁，什么声音也没有留下。那一夜的雨，落到天明才停。', ending: '过雁' };
            }
            return { affection: 0, msg: '' };
        }
    }
};

// ============ 奚湘筠结局演出（6 个） ============
var XIANG_ENDINGS = {
    'xiang_ending_烟雨': {
        id: 'xiang_ending_烟雨', npcId: XIANG_NPC_ID, title: '结局·烟雨', icon: '🌧️',
        route: '烟雨',
        scenes: [
            { speaker: 'narrator', text: '三日后，奚湘筠把琴台托付给师妹，灯的规矩、蒲团的规矩、香火会添弓的规矩，一样一样交代到最后一笔。她随身只带了胡琴和那份写全了的谱——松香在你怀里，她说，香在哪儿，弓就跟到哪儿。', type: 'description' },
            { speaker: 'npc', text: '「雨落在哪里，潇湘夜雨就拉到哪里。」她与你并肩走在下山的第一段石阶上，雨丝落在两人肩头，「谱上写不出的那一句，往后用路来写。」' },
            { speaker: 'narrator', text: '多年后，江湖上有个传说：烟雨里有两个旅人，一个背胡琴，一个提灯。哪里的雨夜里有人迷路、有人伤心、有人等不到归客，哪里就有半阙胡琴——不，如今是全阙了。听过的都说，那支曲子的下半阙，比上半阙暖。', type: 'description' },
            { speaker: 'narrator', text: '有人问她，曲子拉完了，人怎么还不肯歇。她想了想，答话里难得有一个不是短句的字：「陪。」{playerTa}在边上把灯挑亮了些。她没有接话，可那晚的潇湘夜雨，她从头到尾拉了两遍——头一遍给雨，第二遍给身边的人。', type: 'description' }
        ],
        finalText: '——— 结局·烟雨（道侣·同行）———'
    },
    'xiang_ending_守雁': {
        id: 'xiang_ending_守雁', npcId: XIANG_NPC_ID, title: '结局·守雁', icon: '🏡',
        route: '守雁',
        scenes: [
            { speaker: 'narrator', text: '你留在了衡山。回雁琴台添了第二把椅，摆在谱架左手边，椅脚垫着石。每夜雨落，她拉曲，你听——曲是全阙的了，可每夜她仍旧在老地方停一停，停那一息，是留给你的。', type: 'description' },
            { speaker: 'narrator', text: '她说话还是一次一两句，慢得像烟雨——只有谱上落了新句的那几夜，话会多半句。你说半句也好听。她不认，可往后每一页新谱的谱尾，都并着两个名字，一个写得稳，一个写得更稳。', type: 'description' },
            { speaker: 'npc', text: '「今夜的雨，比昨夜密。」她调着弦，把谱往你那边推了半寸，「你那一杯茶，煨在炉上。」话是慢的，推过来的谱角，指尖却按了很久才松开。', type: 'description' },
            { speaker: 'narrator', text: '莫大先生偶尔回山，不上正堂，只坐琴台最高一级，听他们拉一夜曲，一句话不说，走时把笠上的雨抖落。有一年香火会，老人在满山弟子面前说了一句话：「衡山的琴，交给她了。」顿了顿，又添了三个字，「……和他们。」', type: 'description' },
            { speaker: 'narrator', text: '琴台的弟子私下说：师姐还是话少，曲子还是慢——只是每夜拉完，会朝左手边看一眼，眉眼就松半分，像云海退了一线。回雁峰的雁年年北归，琴台的灯夜夜长明。', type: 'description' }
        ],
        finalText: '——— 结局·守雁（道侣·归隐）———'
    },
    'xiang_ending_雨行': {
        id: 'xiang_ending_雨行', npcId: XIANG_NPC_ID, title: '结局·雨行', icon: '🎻',
        route: '雨行',
        scenes: [
            { speaker: 'narrator', text: '你成了与她走旱路的人。一年一程，一年一会——入冬头一场雨起程，她在前头背胡琴，你在后头提灯；驿站的雨夜里她拉曲，你在檐下添香。七十二板的曲子，一年走一板。', type: 'description' },
            { speaker: 'npc', text: '「前头渡口叫『雁回』，雨急，船家不开夜渡。」她把谱摊在驿站灯下，一程一程指给你看：哪一程的雨最细，哪一程的雾最厚，哪一程——她的指尖顿了顿，「师父当年下山，走的就是这一程。」' },
            { speaker: 'narrator', text: '有人问你们是什么关系。她答「琴侣」，{playerTa}答「琴侣」。答完两人一个看谱一个挑灯，谁也没有多说——雨期极准，约极稳，一年一程，谁也不欠谁。', type: 'description' },
            { speaker: 'narrator', text: '后来谱上的每一程，你们都走过。江湖上的人都说，那位拉胡琴的女先生曲子极全、极慢，跟她同行的人灯极稳——雨夜里迷路的行人只要望见那一灯一琴，就知道能回家了。', type: 'description' }
        ],
        finalText: '——— 结局·雨行（挚友·同行）———'
    },
    'xiang_ending_雁信': {
        id: 'xiang_ending_雁信', npcId: XIANG_NPC_ID, title: '结局·雁信', icon: '✉️',
        route: '雁信',
        scenes: [
            { speaker: 'narrator', text: '{playerTa}成了衡山雨讯的常客。琴台下那个位置年年留着；每年入冬头一场雨，谱匣里添一页山下来的信。', type: 'description' },
            { speaker: 'narrator', text: '她照旧守台，照旧拉曲——只是每夜半阙终了，会把山下来的信从谱匣里取出来，一页一页抚平，压进谱尾的空白里。信纸带着山下驿路的尘土气，压在谱里，墨色不曾洇过一页。', type: 'description' },
            { speaker: 'npc', text: '「今年的信，迟了三天。」她把信压进谱里，指尖在页角敲了敲，「……驿路上，雨大？」话问得别扭，回信的纸却早已裁好，字写得比谱上的板眼还工整。', type: 'description' },
            { speaker: 'narrator', text: '师妹有回问她：山下那位，算你什么人。她想了想：「听雨的常客。」师妹似懂非懂。只有她自己知道——那份写全了的旧谱，上半阙是师父的，下半阙是自己的，谱尾压着的那一叠，是山下的。三样并在一处，才算一支完整的《潇湘夜雨》。', type: 'description' }
        ],
        finalText: '——— 结局·雁信（挚友·归隐）———'
    },
    'xiang_ending_雨尽': {
        id: 'xiang_ending_雨尽', npcId: XIANG_NPC_ID, title: '结局·雨尽', icon: '🌑',
        route: '雨尽',
        scenes: [
            { speaker: 'narrator', text: '那一夜她没有回头。写全了的旧谱，她一页一页理齐，收进匣中，上了锁；松香从弓毛上拭净，一同入匣——先收谱，再收香，收得很慢，很稳，像在谱上落最后几个板眼。', type: 'description' },
            { speaker: 'narrator', text: '胡琴入了油布，油布入了琴匣。第二天，她向莫大先生复命，只有六个字：「曲毕。不拉了。」老人看了她很久，什么也没有问，背着旧胡琴下山去了——那一日，满山弟子头一回见师父的背影这样沉。', type: 'description' },
            { speaker: 'npc', text: '「檐下听曲的，原来是躲雨的客。」后来有弟子问她，琴台为什么空了，她望着云海，语气慢得像在说别人的曲子，「往后，衡山没有夜曲了。雨照落——落它的，与我无干。」' },
            { speaker: 'narrator', text: '多年后你再上衡山，回雁琴台的灯还亮着，她接了门中事务，剑极稳，话极少，礼数周全，分毫不差——只是袖中再没有那块松香，琴台上的琴匣积着灰，锁没有开过。每年入冬头一场雨，台上的人会朝阶下望一眼，随即收回去，收得很干净，像一阙拉完了、再不许人提起的曲子。', type: 'description' }
        ],
        finalText: '——— 结局·雨尽（辜负）———'
    },
    'xiang_ending_过雁': {
        id: 'xiang_ending_过雁', npcId: XIANG_NPC_ID, title: '结局·过雁', icon: '🌫️',
        route: '过雁',
        scenes: [
            { speaker: 'narrator', text: '后来你还是上过几次衡山。回雁琴台对外客开放，她——不，台上已经是她的师妹了。师妹说，师姐在曲终的第二天就下了山，如师祖当年的旧例：拉完的人，下山去了。', type: 'description' },
            { speaker: 'narrator', text: '江湖上偶有传闻：有一位拉胡琴的女先生，只拉一支曲子，曲子极全，极慢。听客散尽时，她总朝着衡山的方向坐一会儿——坐一会儿，就走。', type: 'description' },
            { speaker: 'narrator', text: '再后来，传闻说她成了名，成了衡山新一代里最会拉曲的那一个，莫大先生听闻只说了两个字：「拉完了。」可雨夜里听过她曲子的人都说，那支全阙的《潇湘夜雨》，下半阙最暖，暖得叫人不敢多听。', type: 'description' },
            { speaker: 'narrator', text: '每年入冬头一场雨，回雁琴台空着，灯却点一夜——是山下托付的香客添的油。雨落一夜，琴声没有。过的雁不落回雁峰，落过的雨，也追不回来了。', type: 'description' }
        ],
        finalText: '——— 结局·过雁（错过）———'
    }
};

// ============ 性别语境事件（femctx 女玩家 / mctx 男玩家，互斥） ============
var XIANG_GENDER_CTX_EVENTS = {
    // 女玩家：衡山女弟子的提醒
    'xiang_event_femctx': {
        id: 'xiang_event_femctx', npcId: XIANG_NPC_ID, title: '台下的提醒', icon: '🌸',
        desc: '两个衡山女弟子在阶下把你叫住了。',
        minAffection: 55, trigger: { random: 0.35 }, cooldown: 0, flag: 'xiang_e_femctx_done',
        requirePlayerFemale: true,
        autoTrigger: { location: '衡山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '听罢夜曲下台，两个相熟的衡山女弟子在阶下把你叫住，左右看了看，压低声。', type: 'description' },
            { speaker: 'npc', text: '「姑娘。」年长的那个开门见山，「师姐十年一天说不上十句话——这几日，她一日能说十句了。满山都看在眼里了。」' },
            { speaker: 'npc', text: '「师姐那个人，曲子慢，心事重。半阙压了她十年，那块松香捏了她十六年。她开始写下半阙了——写下半阙，是要把心挪出来。我怕你跟着她，日子过得比守琴台还熬人。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「她拉她的曲，我听我的雨——正好。」', effect: 'tease', affection: 8 },
                { text: '「姊姊，我自愿的。熬人我认。」', effect: 'accept', affection: 7 },
                { text: '「你们是怕我委屈，还是怕她破例？」', effect: 'probe', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'tease': aff = 8; msg = '两个师妹对视一眼，年长的先笑出声：「……听雨？」她拍着你的手背，眼角的纹路都松了，「好姑娘。她那场雨一个人听了十年，早该有人搬把椅子了。你听——往后夜曲收弓，我们师姊妹给你煨姜汤，琴台下的姜汤，管够。」'; break;
                case 'accept': aff = 7; msg = '师妹们叹了口气：「自愿的……好。」年纪小的那个从怀里摸出一包烘好的雁峰云雾茶饼塞给你，「陪夜听曲的人，得先暖着。往后师姐拉曲，你守她——茶饼和炭，我们师姊妹包了。」'; break;
                case 'probe': aff = 6; msg = '年长的那个捻着衣角，顿了顿：「……两样都怕。」她望着琴台的方向，雨后的云海正在退，「她破例一回，就要拿十年的慢补回来。你舍得看她那样熬，就留下——留下了，就别再叫她一个人听雨。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // 男玩家：云海练剑男弟子的流言
    'xiang_event_mctx': {
        id: 'xiang_event_mctx', npcId: XIANG_NPC_ID, title: '云海流言', icon: '🌫️',
        desc: '云海晨课的男弟子把你拦下了。',
        minAffection: 55, trigger: { random: 0.35 }, cooldown: 0, flag: 'xiang_e_mctx_done',
        requirePlayerMale: true,
        autoTrigger: { location: '衡山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '云海晨课的崖路上，一个胆大的衡山男弟子把你拦下，左右看了看，压低声。', type: 'description' },
            { speaker: 'npc', text: '「那位……山上的客。」男弟子压着嗓子，「你跟师姐的事，满山传遍了。她是莫大先生的关门弟子，往后衡山的掌门位子上坐着的人——师姐拉曲，满山屏息；她看你，眼神是温的。练剑的师兄弟都瞧见了。」' },
            { speaker: 'npc', text: '「我不是说这不好。我是说，师姐那个人，十年只说半句话，一句话要在心里过三遍。山里的嘴她压得住，山下的嘴呢？你受得住她这份慢，她受得住这满山的看么？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「嘴归嘴。她拉她的半阙，我站我的位置。」', effect: 'defy', affection: 8 },
                { text: '「兄弟，我们还没到那一步。」', effect: 'deny', affection: 3 },
                { text: '「谁嚼她的舌根，先问过我的剑。」', effect: 'shield', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'defy': aff = 8; msg = '男弟子眼睛亮了：「……行！这话我原样带给师姐——不对，我不敢带。」他吐吐舌头跑了。可当晚琴台的灯，你看得出，比平日熄得晚——拉曲的人收弓收得慢，慢里带着一点不难察觉的松。第二夜，台侧你的位置上，多了一盏挡风的灯。'; break;
                case 'deny': aff = 3; msg = '男弟子盯了你半晌：「……没到那一步。」他拍拍衣摆要走，走了两步又回头，「那你怀里那块松香算什么？十六年的东西，指窝都磨出来了，满山都知道师姐袖里从不离身——你还给她去？」你没答。他咂咂嘴，「行罢。雨夜里的事，雨知道。」'; break;
                case 'shield': aff = 7; msg = '男弟子怔了怔，忽然咧嘴一笑：「师姐要是听见这句，能拿半个时辰不说话来谢你——不说话，就是她最高兴的时候。」他抱着剑跑进云海，声音远远飘下来，「嚼舌根的那几位老师叔，其实早叫寅时那一句剑意吓软啦！琴里藏剑，藏的是护短！」'; break;
            }
            return { affection: aff, msg: msg };
        }
    }
};

// ============ 合并进总事件池 ============
if (typeof NPC_PERSONAL_EVENTS !== 'undefined') {
    Object.assign(NPC_PERSONAL_EVENTS, XIANG_MAIN_EVENTS);
    Object.assign(NPC_PERSONAL_EVENTS, XIANG_GENDER_CTX_EVENTS);
}

// ============ 注册结局集与副作用回调 ============
if (typeof registerEndingSet === 'function') {
    registerEndingSet(XIANG_NPC_ID, XIANG_ENDINGS);
}
if (typeof registerEndingCallback === 'function') {
    registerEndingCallback(XIANG_NPC_ID, function(endingName, npc) {
        if (endingName === '烟雨' || endingName === '守雁') {
            if (npc && typeof npc.setFlag === 'function') npc.setFlag('dao_companion');
            if (window.showMessage) window.showMessage('🎻 你与奚湘筠结为道侣！潇湘夜雨的琴音剑意感悟大幅提升', 'success');
        } else if (endingName === '雨行' || endingName === '雁信') {
            if (npc && npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 30);
            if (window.showMessage) window.showMessage('🎻 你与奚湘筠成了以雨为期的知己', 'success');
        } else if (endingName === '雨尽') {
            if (window.showMessage) window.showMessage('🌧️ 奚湘筠封了胡琴。半阙拉完的那一夜，曲子也死了——她不再拉了', 'error');
        }
    });
}

// ============ 自动触发 + 每日钩子（复用 maybeAutoTriggerPersonalEvent） ============
function maybeAutoTriggerXiangEvent(source) {
    return maybeAutoTriggerPersonalEvent(XIANG_NPC_ID, source, { finalEvents: ['xiang_event_013'] });
}

if (typeof window !== 'undefined' && window.timeSystem && window.timeSystem.onNewDaySubscribe) {
    window.timeSystem.onNewDaySubscribe(function() {
        try {
            if (window.currentCharData && window.currentCharData.location === '衡山派') {
                maybeAutoTriggerXiangEvent('daily');
            }
            // 性别语境：每日在该派过夜 + 对应性别 + 好感≥55 + 未触发
            if (!window.currentCharData || !window.npcManager) return;
            var loc = window.currentCharData.location || '';
            if (loc !== '衡山派') return;
            var npc = window.npcManager.getNPC ? window.npcManager.getNPC(XIANG_NPC_ID) : null;
            if (!npc) return;
            var aff = (npc.relationship && npc.relationship.affection) || 0;
            if (aff < 55) return;
            var isF = window.currentCharData.gender === 'female';
            var ctxId = isF ? 'xiang_event_femctx' : 'xiang_event_mctx';
            if (typeof hasEventTriggered === 'function' && hasEventTriggered(ctxId)) return;
            var ev = NPC_PERSONAL_EVENTS[ctxId];
            if (!ev) return;
            if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npc)) return;
            setTimeout(function() {
                if (document.querySelector && document.querySelector('.personal-event-modal')) return;
                if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npc)) return;
                if (typeof triggerPersonalEvent === 'function') triggerPersonalEvent(ctxId);
            }, 1200);
        } catch (e) { console.warn('[奚湘筠线] 每日触发失败:', e); }
    });
}

// ============ 导出 ============
if (typeof window !== 'undefined') {
    window.XIANG_MAIN_EVENTS = XIANG_MAIN_EVENTS;
    window.XIANG_ENDINGS = XIANG_ENDINGS;
    window.maybeAutoTriggerXiangEvent = maybeAutoTriggerXiangEvent;
}
console.log('[奚湘筠线] 衡山感情线加载完成：结局 ' + Object.keys(XIANG_ENDINGS).length + ' 个 + 主线事件 ' + Object.keys(XIANG_MAIN_EVENTS).length + ' 个 + 性别语境 ' + Object.keys(XIANG_GENDER_CTX_EVENTS).length + ' 个');
