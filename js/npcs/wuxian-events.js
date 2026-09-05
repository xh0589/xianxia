// ==================== wuxian-events.js - 蓝凤凰线情缘事件/结局/自动触发 v1.0 ====================
// 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / registerEndingSet / registerEndingCallback /
//       hasEventTriggered / isChainHead / checkEventTrigger / triggerPersonalEvent / canPlayerAccessPersonalEvent）
// 加载顺序：在 npc-personal-events.js 之后

var WUXIAN_NPC_ID = 'sect_leader_五仙教';

// ============ 蓝凤凰主线事件（wx_event_001 ~ 013） ============
var WUXIAN_MAIN_EVENTS = {
    'wx_event_001': {
        id: 'wx_event_001', npcId: WUXIAN_NPC_ID, title: '蝶引', icon: '🦋',
        desc: '一只银蝶落在你肩上，引你入了万蛊窟。',
        minAffection: 14, trigger: { random: 0.4 }, cooldown: 0, flag: 'wx_e001_done',
        autoTrigger: { location: '五仙教', random: 0.45 },
        scenes: [
            { speaker: 'narrator', text: '你在五仙教后山迷路，一只银蝶忽地落你肩上，扑闪着引你走向一处洞窟。', type: 'description' },
            { speaker: 'narrator', text: '洞口帘子一掀，蓝凤凰倚在里面，狭长凤目似笑非笑：「我的蝶引错人，可不是好事。」', type: 'description' },
            { speaker: 'npc', text: '「但它从不引错人。」她指尖一勾，银蝶飞回她掌心，停在她指甲上——那指甲染着靛蓝。「说吧，你凭什么，让它选了你？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「许是我身上的味道，像它认识的人。」', effect: 'scent', affection: 5 },
                { text: '「大概是巧合。」', effect: 'chance', affection: 2 },
                { text: '「那得问它。我又不懂蝶。」', effect: 'honest', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'scent': aff = 5; msg = '她眼神动了一下，随即笑得更媚：「身上像它认识的人——这话，倒是头回听。」银蝶在她指间颤了颤，像认了什么。'; break;
                case 'chance': aff = 2; msg = '她笑出声，笑得花枝乱颤：「巧合？五仙教不信巧合，只信蛊。」——但她没赶你走。'; break;
                case 'honest': aff = 6; msg = '她怔了怔，忽地把蝶推向你：「那便学着懂。」银蝶绕你一圈，又回到她肩。——从这天起，它一见你就飞过来。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'wx_event_002': {
        id: 'wx_event_002', npcId: WUXIAN_NPC_ID, title: '蛊瓮', icon: '🏺',
        desc: '她让你替她守一夜蛊瓮。',
        minAffection: 20, trigger: { random: 0.35 }, cooldown: 0, flag: 'wx_e002_done',
        autoTrigger: { location: '五仙教', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '五仙教后窟，千百只蛊瓮码成墙。她指了其中一只最大的：「今夜它躁，我压不住。你替我守着——别让它响。」', type: 'description' },
            { speaker: 'npc', text: '「响一声，便少一只蛊瓮里的安静。」她说完便要走，又回头，「怕不怕？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「怕。但我守着。」', effect: 'fear_ok', affection: 6 },
                { text: '「它为何躁？」', effect: 'why', affection: 7 },
                { text: '「怕什么，一只蛊而已。」', effect: 'brave', affection: -1 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'fear_ok': aff = 6; msg = '她看了你一眼，凤目里有一瞬的软：「怕还守，这才叫守。」那夜她回来得比说的早。'; break;
                case 'why': aff = 7; msg = '她沉默半晌：「……它在替谁躁。」没再答。但那夜她坐在你旁边，瓮没再响过。'; break;
                case 'brave': aff = -1; msg = '她冷笑：「不怕的，从没守过一夜。」瓮在你手里响了一整夜——第二天，她把那只瓮单独封了，没让你再近。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'wx_event_003': {
        id: 'wx_event_003', npcId: WUXIAN_NPC_ID, title: '忘情散', icon: '💊',
        desc: '你撞见她饮一丸苦得反胃的药。',
        minAffection: 26, trigger: { random: 0.35 }, cooldown: 0, flag: 'wx_e003_done',
        autoTrigger: { location: '五仙教', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '后园药庐，她正饮一丸黑糊糊的药，眉头皱得极少见。你一进门，她险些呛住。', type: 'description' },
            { speaker: 'npc', text: '「……看什么。」她抹了嘴角，又恢复那副妖媚模样，「养颜的。」' },
            { speaker: 'narrator', text: '那药苦味冲鼻，绝不是养颜之物。她见你不信，叹了口气。', type: 'description' },
            { speaker: 'npc', text: '「忘情散。压制心蛊用的。」她把空碗一搁，「动一次情，蛊强一分；散压不住，我便不是我了。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「那就不动情。」', effect: 'no_love', affection: 4 },
                { text: '「怕蛊，就承认自己怂了呗。」', effect: 'cruel', affection: -4 },
                { text: '「有别的法子吗？」', effect: 'other_way', affection: 7 },
                { text: '夺过碗：「这药伤身。」', effect: 'snatch', affection: 8 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'no_love': aff = 4; msg = '她笑了，笑得凉：「说得轻巧。蛊在你身上，看你忍不忍得住。」——这话像在说你，又像说她从前。'; break;
                case 'other_way': aff = 7; msg = '她怔了一下：「……十年来，没人问过这句。」没说有，也没说没有。但你看见，她那天的药，少饮了半碗。'; break;
                case 'snatch': aff = 8; msg = '她没抢回来，只看着空碗：「你……」半天，「你这是要害我。」但她嘴角，是弯的。那天她把药减了一丸。'; break;
                // v20.25 真负选项：拿她的命门激将，凤目里的光就灭了一分（坏结局从此攒得数）
                case 'cruel': aff = -4; msg = '她慢慢把碗搁下，脸上那点破绽收得干干净净：「怂？」她笑起来，妖媚如常，眼底没了，「好。你记住了——今日的话。」往后你再撞见她，她喝什么药都当着你喝，笑吟吟的，像喂给你看。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'wx_event_004': {
        id: 'wx_event_004', npcId: WUXIAN_NPC_ID, title: '心蛊', icon: '🖤',
        desc: '她第一次让你看到那只养在心里的蛊。',
        minAffection: 33, trigger: { random: 0.3 }, cooldown: 0, flag: 'wx_e004_done',
        autoTrigger: { location: '五仙教', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '月夜，万蛊窟深处。她解开衣领一线，让你看锁骨下——那有一只蝶形黑纹，在皮下缓缓鼓动。', type: 'description' },
            { speaker: 'npc', text: '「心蛊。养在我心口，嗜我真情。」她合上衣，声音平，「动一次情，它便强一分；强到破壳，我便成它的傀，再不是我。」' },
            { speaker: 'npc', text: '「十八岁那年，我动过一次情。它差点破壳。我用忘情散断了那段情，才压住它——代价是，再不能动情。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「那就让我替你看着它。」', effect: 'watch', affection: 8 },
                { text: '「若有人愿意，替你被它噬呢？」', effect: 'take', affection: 9 },
                { text: '「……这不公平。」', effect: 'unfair', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'watch': aff = 8; msg = '她侧头，凤目在月下亮得惊人：「看着它，就是看着我死。」——但她把衣领拢好时，手指在颤。'; break;
                case 'take': aff = 9; msg = '她猛地抬头，黑纹在她皮下鼓了一下：「……你不知道这话有多重。」很久，「也不知道，我有多想答应你。」'; break;
                case 'unfair': aff = 6; msg = '她笑了，笑里有苦：「公平？我养它十八年，没人跟我说过公不公平。」——但这一夜之后，她偶尔会把你叫到窟里，什么也不做，只坐着。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'wx_event_005': {
        id: 'wx_event_005', npcId: WUXIAN_NPC_ID, title: '试蛊', icon: '🐍',
        desc: '她让你试一只新蛊的反应。',
        minAffection: 40, trigger: { random: 0.3 }, cooldown: 0, flag: 'wx_e005_done',
        autoTrigger: { location: '五仙教', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '她培育出一只新蛊——不伤人，只随人心绪变颜色。她把蛊虫放在你掌心。', type: 'description' },
            { speaker: 'npc', text: '「攥紧，想事。」她盯着你掌心，「看它变什么色。」' },
            { speaker: 'narrator', text: '你攥紧掌心，想着眼前这人。蛊虫由青转红，又由红转——她忽然伸手把蛊虫捏走了。', type: 'description' },
            { speaker: 'npc', text: '「……行了。」她把蛊虫收回瓮，没给你看它最后变了什么色，「试验结束。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「它变成了什么？」', effect: 'ask', affection: 7 },
                { text: '「你怕了。」', effect: 'fear', affection: 5 },
                { text: '不追问，由她收回', effect: 'let', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '', item = null;
            switch (choice) {
                case 'ask': aff = 7; msg = '她背过身收蛊：「红的。」半晌，「红的代表……你不必知道。」——但那天之后，她养蛊时总让你在旁。'; break;
                case 'fear': aff = 5; msg = '她回头，凤目一挑：「我怕？」她笑得花枝乱颤，但你看见，她握蛊虫的手，攥得发白。「……是。我怕。」'; break;
                case 'let': aff = 6; item = 'mat_beast_fang'; msg = '她见你不追问，松了口气，少有地柔了声：「你这人……倒识趣。」——那以后她试蛊，头一个找的是你。你转身时一枚蛊兽的毒牙丢进你衣领：「含住能拔毒。记住，再中毒，先找我。」'; break;
            }
            return { affection: aff, msg: msg, item: item };
        }
    },
    'wx_event_006': {
        id: 'wx_event_006', npcId: WUXIAN_NPC_ID, title: '旧情', icon: '🥀',
        desc: '她带你去看了十八岁那人的坟。',
        minAffection: 46, trigger: { random: 0.3 }, cooldown: 0, flag: 'wx_e006_done',
        autoTrigger: { location: '五仙教', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '她带你出教，走了半日山路，到一座无碑坟前。坟头野草齐腰。', type: 'description' },
            { speaker: 'npc', text: '「十八岁那年那人。汉家书生，说要带我走。」她蹲下拔草，「我动了情，心蛊破壳前夜，他替我挡了教中刺客这一刀——死在我面前。」' },
            { speaker: 'npc', text: '「我服忘情散，把他忘了个干净。只记得——他临死说的最后一句。」她顿住，「我忘了那句是什么了。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '蹲下帮她一起拔草', effect: 'weed', affection: 7 },
                { text: '「他若知道你为他忘情，会不甘心。」', effect: 'regret', affection: 10 },
                { text: '「忘了也好。记得太苦。」', effect: 'forget', affection: 4 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'weed': aff = 7; msg = '她没推开你。两个人把坟头草拔净，她忽然轻声：「……谢了。」这是她第一次，为旧情之外的人说谢。'; break;
                case 'regret': aff = 10; msg = '她手停住，半晌：「……他若知道，该怨我。」她把一根草攥碎，「但也该怨我。怨我比忘我好。」'; break;
                case 'forget': aff = 4; msg = '她摇头：「忘了，就没人记得他来过。」——回程路上她走在你前面，但你看见，她袖口擦过眼角一次。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'wx_event_007': {
        id: 'wx_event_007', npcId: WUXIAN_NPC_ID, title: '蝶舞', icon: '🦋',
        desc: '月夜她于蛊窟前舞蝶影步。',
        minAffection: 54, trigger: { random: 0.3 }, cooldown: 0, flag: 'wx_e007_done',
        autoTrigger: { timeRange: [21, 3], location: '五仙教', random: 0.45 },
        scenes: [
            { speaker: 'narrator', text: '子夜，万蛊窟前空地。她在月下练蝶影步，身形过处，蝶影纷飞，分不清哪个是她，哪只蝶。', type: 'description' },
            { speaker: 'narrator', text: '她收势，喘着气，一只银蝶停在她汗湿的鬓角。她看见你，没赶你走。', type: 'description' },
            { speaker: 'npc', text: '「……看够了？」她把鬓角那只蝶拢回指尖，「这套步法，是我为了追那人，年轻时偷学的。他死了，我才学成。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「现在，它是为了谁？」', effect: 'who_for', affection: 8 },
                { text: '请她教你一式蝶影步', effect: 'learn', affection: 7 },
                { text: '什么也不说，在月下陪她到蝶散', effect: 'stay', affection: 11 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'who_for': aff = 8; msg = '她愣了一下，银蝶在她指尖颤：「……我不知道。」很久，「以前为追他，现在——」她没说现在为谁。你也没问。'; break;
                case 'learn': aff = 7; msg = '她挑眉：「教你？」却还是带你过了一遍起手式。到第三式，两只蝶影在月下交叠——她没收回。'; break;
                case 'stay': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 15) : { ok: true };
                                    if (!_py.ok) { aff = 4; msg = '蝶香催眠，你后半场是睡着的。醒来枕边多了一片带鳞粉的蝶翼，凉丝丝的。（精力不足，那一夜你先撑不住了）'; break; }
                                    aff = 11; msg = ('一整夜没人说话。蝶散尽时她经过你身边，把鬓角那只银蝶，轻轻别在了你衣襟上：「……留着。」') + '（精力-15）'; break; }
            }
            return { affection: aff, msg: msg };
        }
    },
    'wx_event_008': {
        id: 'wx_event_008', npcId: WUXIAN_NPC_ID, title: '忘情散断', icon: '⚠️',
        desc: '忘情散的药力，第一次压不住心蛊。',
        minAffection: 62, trigger: { random: 0.3 }, cooldown: 0, flag: 'wx_e008_done',
        autoTrigger: { location: '五仙教', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '药庐传来瓷器碎裂声。你冲进去，蓝凤凰伏在案上，锁骨下那只蝶形黑纹正在皮下剧烈鼓动，像要破壳。', type: 'description' },
            { speaker: 'narrator', text: '忘情散的药碗碎了一地。她抬眼，凤目里翻涌着你不认得的妖冶与痛——心蛊要噬主了。', type: 'description' },
            { speaker: 'player_select', text: '你必须立刻做点什么。', options: [
                { text: '握住她的手，以自身真气引开蛊的噬势', effect: 'qi', affection: 14 },
                { text: '跪下抓起碎瓷片割掌，以血喂蛊', effect: 'blood', affection: 11 },
                { text: '抱住她，什么都不做只稳住她', effect: 'hold', affection: 10 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'qi': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 20) : { ok: true };
                                    if (!_py.ok) { aff = 6; msg = '你撑到一半就眼前发黑，剩下的那截，她一个人接了回去。（精力不足，那一夜你先撑不住了）'; break; }
                                    aff = 14; msg = ('你的真气灌入她经脉，心蛊被引得偏了一线——她喘着气把你推开：「……你怎么敢拿真气引心蛊。」黑纹退回去。她握着你的手，很久没松。') + '（精力-20）'; break; }
                case 'blood': aff = 11; msg = '心蛊嗅到你血，竟舍她而扑你掌——被她一把按回。她把你割伤的手攥紧，眼底有水光：「它要的，不是这个血。」但她替你包扎的手，一直在抖。'; break;
                case 'hold': aff = 10; msg = '她僵在你怀里，黑纹鼓动渐缓。「……没用。」她哑声，「但你抱着，它好像……不那么凶了。」这是她第一次承认，有人比忘情散管用。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'wx_event_009': {
        id: 'wx_event_009', npcId: WUXIAN_NPC_ID, title: '解蛊之诺', icon: '🔗',
        desc: '她与你立下一个关于心蛊的誓。',
        minAffection: 68, trigger: { random: 0.3 }, cooldown: 0, flag: 'wx_e009_done',
        autoTrigger: { location: '五仙教', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '万蛊窟深处，她把一只空蛊瓮推到你面前。', type: 'description' },
            { speaker: 'npc', text: '「心蛊若有一日破壳，我不愿成它的傀。」她抬眼，「我与你讨个誓：到那天，你亲手把心蛊从我心里剜出来，封进这只瓮——哪怕我因此忘了你。」' },
            { speaker: 'npc', text: '「……行不行？」这是她第一次，用这种声音跟你说话。' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「我应你。剜出来，我陪你把忘的，一点一点记回来。」', effect: 'promise', affection: 14 },
                { text: '「不会有那天。我替你压着它。」', effect: 'guard', affection: 9 },
                { text: '「……你就不怕我剜的时候手抖？」', effect: 'joke', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'promise': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 15) : { ok: true };
                                    if (!_py.ok) { aff = 6; msg = '你应完那句话人就先倒了。她是看着你睡着的脸受下这诺的——亏你当真应了。（精力不足，那一夜你先撑不住了）'; break; }
                                    aff = 14; msg = ('她看了你很久，把空瓮推到你怀里：「……记住你说的。」——那只瓮后来一直放在你屋中，像一个没有内容的誓。') + '（精力-15）'; break; }
                case 'guard': aff = 9; msg = '她摇头：「压不住的。」但没再争。从那天起，她服忘情散时，会让你坐在她旁边——像一个怕黑的人，留了一盏灯。'; break;
                case 'joke': aff = 7; msg = '她愣了一下，笑出了声，笑得眼角有泪：「……这时候还贫。」——但她攥着你的手，攥得很紧。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'wx_event_010': {
        id: 'wx_event_010', npcId: WUXIAN_NPC_ID, title: '教中非议', icon: '🏰',
        desc: '教中长老当面质疑她动了情。',
        minAffection: 72, trigger: { random: 0.3 }, cooldown: 0, flag: 'wx_e010_done',
        autoTrigger: { location: '五仙教', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '议事蛊堂，毒娘子长老当众发难：「教主近来忘情散减半，心蛊活跃。教中传言，教主动了凡情。」', type: 'description' },
            { speaker: 'narrator', text: '堂中蛊师齐齐看你。蓝凤凰没辩，凤目扫过毒娘子，正要开口——你先一步站出来。', type: 'description' },
            { speaker: 'player_select', text: '你如何应对这发难？', options: [
                { text: '「是我缠着教主。心蛊若要噬，噬我。」', effect: 'shield', affection: 12 },
                { text: '「教主减药，是为试解心蛊之法，与情无关。」', effect: 'cover', affection: 8 },
                { text: '什么也不说，站到蓝凤凰身侧', effect: 'side', affection: 9 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            var _pt = (window.currentCharData && window.currentCharData.gender === 'female') ? '她' : '他';
            switch (choice) {
                case 'shield': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 15) : { ok: true };
                                    if (!_py.ok) { aff = 5; msg = '你话放到一半，人先撑不住。第二日的闲话，到底还是她自己挡的。（精力不足，那一夜你先撑不住了）'; break; }
                                    aff = 12; msg = ('毒娘子冷笑：「你？」蓝凤凰却忽然笑得妖媚：「是。'+_pt+'缠我。怎么，本教主护短，毒娘子里外都管？」堂上再没人敢出声。') + '（精力-15）'; break; }
                case 'cover': aff = 8; msg = '毒娘子将信将疑地退了。事后蓝凤凰低声：「……你倒是会替我圆。」她眼里，有一瞬极淡的暖。'; break;
                case 'side': aff = 9; msg = '她没让你退。毒娘子看完这一幕，冷哼一声拂袖：「教主自重。」走时丢下一句，「别忘了前任教主怎么死的。」——这一句，蓝凤凰握拳了很久。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'wx_event_011': {
        id: 'wx_event_011', npcId: WUXIAN_NPC_ID, title: '破蛊前夜', icon: '🌕',
        desc: '心蛊将破，她做了最后的准备。',
        minAffection: 78, trigger: { random: 0.3 }, cooldown: 0, flag: 'wx_e011_done',
        autoTrigger: { location: '五仙教', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '她把你叫到蛊窟深处，交给你一只银匣——里面是那把剜蛊的银刀，和那只空瓮。', type: 'description' },
            { speaker: 'npc', text: '「今夜它要破壳了。」她声音平得像在说别人的事，「忘情散已压不住。你若剜，我活，但忘你；你若不剜，它噬我，我便成傀，你须杀我。」' },
            { speaker: 'npc', text: '「……我更想让你剜。」她极轻地补，「就算忘你，至少……我还活着，能再被你认回来。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「我不剜。我以真情喂它，看它敢不敢破壳。」', effect: 'feed_true', affection: 15 },
                { text: '「我剜。然后陪你把忘的，一寸一寸找回来。」', effect: 'cut', affection: 11 },
                { text: '抱住她：「还有第三条路——让它认主。」', effect: 'third', affection: 12 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'feed_true': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 20) : { ok: true };
                                    if (!_py.ok) { aff = 6; msg = '蛊啸最凶那一轮你没扛住，那一夜是她独自喂过去的。（精力不足，那一夜你先撑不住了）'; break; }
                                    aff = 15; msg = ('她猛地抬头——黑纹在她皮下剧烈鼓动，却没破壳。「你疯了。真情喂蛊，它会成蝶——你也会被它认作宿主。」她声音在抖，「……你当真？」') + '（精力-20）'; break; }
                case 'cut': aff = 11; msg = '她把银刀推回你手里，闭上了眼：「……动手吧。」——但你握刀的手，被她按住。「等天亮。让我再记你一夜。」'; break;
                case 'third': aff = 12; msg = '她怔住：「认主？让心蛊……认你为主？」黑纹忽地停了一瞬，像在听。「这法子，没人试过。」她低声，「但我们，可以试。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'wx_event_013': {
        id: 'wx_event_013', npcId: WUXIAN_NPC_ID, title: '终章·蝶变', icon: '💍',
        desc: '心蛊在黎明破壳，变成了一只蝶。',
        minAffection: 85, trigger: { random: 1.0 }, cooldown: 0, flag: 'wx_e013_done',
        endingMap: { '同蛊': 'wx_ending_同蛊', '毒谷': 'wx_ending_毒谷', '毒友': 'wx_ending_毒友', '蛊邻': 'wx_ending_蛊邻', '蛊噬': 'wx_ending_蛊噬', '断蛊': 'wx_ending_断蛊' },
        scenes: [
            { speaker: 'narrator', text: '黎明。万蛊窟。她躺在你怀里，锁骨下的黑纹已鼓成蝶形，将破未破。忘情散的碗，空了。', type: 'description' },
            { speaker: 'npc', text: '「{playerName}。」她声音很轻，「它要选了。你选不选我——选了，它便认你为主，化蝶飞出；不选，它噬我，我忘你，或你杀我。」' },
            { speaker: 'npc', text: '「心蛊认了你，我拔不回来了——拔回来，就是我认输。」她指尖点了点你腕上的蝶，「往后它蛰哪儿，哪儿就是你的家。」' },
            { speaker: 'player_select', text: '你的选择将决定你们的关系走向', options: [
                { text: '「要。我选你。心蛊认主——化蝶飞，我们下山，以毒济世。」', effect: 'lover_travel', affection: 30 },
                { text: '「要。但哪儿也不去。我留在五仙教，陪你守这一谷的蛊。」', effect: 'lover_stay', affection: 28 },
                { text: '「蝶我接。人就算了——我做你天下第一的毒蛊搭档，毒手搭档。」', effect: 'friend_travel', affection: 20 },
                { text: '「蝶我接。往后你炼出新蛊，头一个找我试——试砸了算五仙教的，试活了是你的名声。」', effect: 'friend_stay', affection: 18 },
                { text: '「我不选。我替你剜，让你忘了我。」', effect: 'none', affection: 0 }
            ]}
        ],
        effects: function(npc, choice) {
            // 蛊噬兜底：累计负面选择≥3时，道侣选项转辜负（v20.25 门槛 5→3，负选项现已攒得够）
            var negCount = (window._negativeChoiceCount && window._negativeChoiceCount[WUXIAN_NPC_ID]) || 0;
            if (negCount >= 3 && (choice === 'lover_travel' || choice === 'lover_stay')) {
                return { affection: 0, msg: '她看着你，忽然惨笑：「……原来养了十八年的蛊，等的是这么一句不选。」黑纹猛地破壳——却没有化蝶，而是一口噬回她心口。她当场昏死。再醒来，她忘了天下人，也包括你。', ending: '蛊噬' };
            }
            switch (choice) {
                case 'lover_travel': return { affection: 30, msg: '你握紧她的手。黑纹破壳——一只银蝶自她锁骨下飞出，绕你二人数圈，落回她指尖。她睁眼，眼里有泪，有笑：「……它认了你。我没忘你。」她把蝶拢进你掌心，「下山。我替他，把这条命，活出点人味来。」', ending: '同蛊' };
                case 'lover_stay': return { affection: 28, msg: '银蝶破壳而出，停在她指间。她把蝶推向你掌心，又拢回：「……好。五仙教的门，往后为你留着。」她声音哑，「守一谷蛊，也守一个人。」', ending: '毒谷' };
                case 'friend_travel': return { affection: 20, msg: '她哼了一声，妖媚地挑眉：「毒手搭档？那你别死我前头。」蝶影在她肩纷飞——她收了蛊，却没收了那份少见的少年气。', ending: '毒友' };
                case 'friend_stay': return { affection: 18, msg: '「常客？」她妖媚一笑，却红了耳尖，「……五仙教的毒茶钱，记你账上。」银蝶在她肩头一颤，像在替她笑。', ending: '蛊邻' };
                case 'none': return { affection: 0, msg: '你拿起银刀。她闭上眼，一滴泪滚下来。黑纹破壳——化蝶飞走，她……忘了一切。再睁眼，她不认得你，只是看着你，妖媚而客气：「这位道友，来五仙教何事？」', ending: '断蛊' };
            }
            return { affection: 0, msg: '' };
        }
    }
};

// ============ 蓝凤凰结局演出（6个） ============
var WUXIAN_ENDINGS = {
    'wx_ending_同蛊': {
        id: 'wx_ending_同蛊', npcId: WUXIAN_NPC_ID, title: '结局·同蛊', icon: '🦋',
        route: '同蛊',
        scenes: [
            { speaker: 'narrator', text: '三日后，蓝凤凰把教主之位交予毒娘子，背一只蛊瓮下山。', type: 'description' },
            { speaker: 'npc', text: '「心蛊认了你，便是你身上的蝶了。」她把银蝶拢在你肩，「我跟着我的蝶走——天南海北，哪里有冤，就去哪里下毒。」' },
            { speaker: 'narrator', text: '多年后，江湖有「蝶蛊双仙」的传说：一人以毒惩恶，一人以蛊救善。', type: 'description' },
            { speaker: 'narrator', text: '有人见过他们在苗寨歇脚，她靠在他肩看那只银蝶——她终于敢动情，因为情蛊已化蝶，不再噬她，只随她。', type: 'description' }
        ],
        finalText: '——— 结局·同蛊（道侣·同行）———'
    },
    'wx_ending_毒谷': {
        id: 'wx_ending_毒谷', npcId: WUXIAN_NPC_ID, title: '结局·毒谷', icon: '🏡',
        route: '毒谷',
        scenes: [
            { speaker: 'narrator', text: '你留在了五仙教。那扇蛊门，从那夜起再没落下。', type: 'description' },
            { speaker: 'narrator', text: '银蝶住在她肩头，也住在你肩——它认了两个主，便不再噬谁。', type: 'description' },
            { speaker: 'npc', text: '「今日新养出一只解蛊。」她把蛊瓮推到你常坐的位置，「你看着——这是替人解情蛊用的，比忘情散温和。」' },
            { speaker: 'narrator', text: '毒娘子偶尔路过，看这场景，嘀咕一句「教主再不是从前的教主了」，走了。但走时脚步慢了些。', type: 'description' },
            { speaker: 'narrator', text: '养蛊的人，终于不必靠忘情散续命——因为有人，成了她的解药。', type: 'description' }
        ],
        finalText: '——— 结局·毒谷（道侣·归隐）———'
    },
    'wx_ending_毒友': {
        id: 'wx_ending_毒友', npcId: WUXIAN_NPC_ID, title: '结局·毒友', icon: '🤝',
        route: '毒友',
        scenes: [
            { speaker: 'narrator', text: '你们成了江湖闻名的毒蛊搭档。一个下毒，一个解蛊，天下奇毒都拦不住你们。', type: 'description' },
            { speaker: 'npc', text: '「这次南疆那蛊，归我。」她把蛊虫收进瓮，「下次中原那毒，归你。」她说完，自己先笑了。' },
            { speaker: 'narrator', text: '有人问你们是什么关系。她答「搭档」，你答「搭档」。说完对视一眼，都先笑了——银蝶在两人中间飞了一圈，像也听懂了。', type: 'description' }
        ],
        finalText: '——— 结局·毒友（挚友·同行）———'
    },
    'wx_ending_蛊邻': {
        id: 'wx_ending_蛊邻', npcId: WUXIAN_NPC_ID, title: '结局·蛊邻', icon: '🍵',
        route: '蛊邻',
        scenes: [
            { speaker: 'narrator', text: '{playerTa}成了五仙教的常客。蛊门外，总有一瓮温着的解蛊茶。', type: 'description' },
            { speaker: 'narrator', text: '她依旧妖媚，依旧养蛊——只是蛊门不落了。', type: 'description' },
            { speaker: 'npc', text: '「今日又来？」她掀帘子，妖媚一笑，却红了耳尖，「……茶，多温一盏。」' },
            { speaker: 'narrator', text: '毒娘子有次问{playerTa}：「你算她什么？」{playerTa}想了想，说：「常客。」毒娘子笑出了声——这一笑，倒比从前少了毒气。', type: 'description' }
        ],
        finalText: '——— 结局·蛊邻（挚友·归隐）———'
    },
    'wx_ending_蛊噬': {
        id: 'wx_ending_蛊噬', npcId: WUXIAN_NPC_ID, title: '结局·蛊噬', icon: '💔',
        route: '蛊噬',
        scenes: [
            { speaker: 'narrator', text: '心蛊破壳那夜，没化蝶，而是噬回了她心口。', type: 'description' },
            { speaker: 'narrator', text: '她忘了一切——教主之位、忘情散、十八岁那人，还有你。', type: 'description' },
            { speaker: 'narrator', text: '毒娘子代掌了五仙教。她依旧在教中，妖媚如常，只是再不近人，再不养心蛊。', type: 'description' },
            { speaker: 'narrator', text: '只是再没有一个姓{playerName}的人，能掀动那扇蛊门。', type: 'description' }
        ],
        finalText: '——— 结局·蛊噬（辜负）———'
    },
    'wx_ending_断蛊': {
        id: 'wx_ending_断蛊', npcId: WUXIAN_NPC_ID, title: '结局·断蛊', icon: '🦋',
        route: '断蛊',
        scenes: [
            { speaker: 'narrator', text: '银蝶破壳飞走。她忘了一切。', type: 'description' },
            { speaker: 'narrator', text: '你留在五仙教，做了个不惹眼的蛊师，日日从她门前过。', type: 'description' },
            { speaker: 'npc', text: '「这位道友，又来？」她妖媚而客气，「五仙教不收外客——但你若想学蛊，我可以教。」' },
            { speaker: 'narrator', text: '她不认得你。但那只飞走的银蝶，每年春日，都会飞回她肩头停一停——像在替你，认她一认。', type: 'description' }
        ],
        finalText: '——— 结局·断蛊（错过）———'
    }
};

// ============ 合并主线事件进总事件池 ============
if (typeof NPC_PERSONAL_EVENTS !== 'undefined') {
    Object.assign(NPC_PERSONAL_EVENTS, WUXIAN_MAIN_EVENTS);
}

// ============ 注册结局集与副作用回调 ============
if (typeof registerEndingSet === 'function') {
    registerEndingSet(WUXIAN_NPC_ID, WUXIAN_ENDINGS);
}
if (typeof registerEndingCallback === 'function') {
    registerEndingCallback(WUXIAN_NPC_ID, function(endingName, npc) {
        if (endingName === '同蛊' || endingName === '毒谷') {
            if (npc && typeof npc.setFlag === 'function') npc.setFlag('dao_companion');
            if (window.showMessage) window.showMessage('🦋 你与蓝凤凰结为道侣！蛊术感悟大幅提升', 'success');
        } else if (endingName === '毒友' || endingName === '蛊邻') {
            if (npc && npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 30);
            if (window.showMessage) window.showMessage('🦋 你与蓝凤凰成了彼此最信得过的毒蛊搭档', 'success');
        }
    });
}

// ============ 自动触发包装 + 每日钩子 ============
function maybeAutoTriggerWuxianEvent(source) {
    return maybeAutoTriggerPersonalEvent(WUXIAN_NPC_ID, source, { finalEvents: ['wx_event_013'] });
}

if (typeof window !== 'undefined' && window.timeSystem && window.timeSystem.onNewDaySubscribe) {
    window.timeSystem.onNewDaySubscribe(function() {
        try {
            if (window.currentCharData && window.currentCharData.location === '五仙教') {
                maybeAutoTriggerWuxianEvent('daily');
            }
        } catch (e) { console.warn('[蓝凤凰线] 每日自动触发失败:', e); }
    });
}

// ============ 导出 ============
if (typeof window !== 'undefined') {
    window.WUXIAN_MAIN_EVENTS = WUXIAN_MAIN_EVENTS;
    window.WUXIAN_ENDINGS = WUXIAN_ENDINGS;
    window.maybeAutoTriggerWuxianEvent = maybeAutoTriggerWuxianEvent;
}
console.log('[蓝凤凰线] 五仙教感情线加载完成：结局 ' + Object.keys(WUXIAN_ENDINGS).length + ' 个 + 主线事件 ' + Object.keys(WUXIAN_MAIN_EVENTS).length + ' 个');
