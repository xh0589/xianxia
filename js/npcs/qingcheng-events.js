// ==================== qingcheng-events.js - 幽翠微线情缘事件/结局/性别语境 v1.0（青城扩线） ====================
// 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / registerEndingSet / registerEndingCallback /
//       hasEventTriggered / checkEventTrigger / triggerPersonalEvent / canPlayerAccessPersonalEvent）
//       npcs/npc-system.js（executeEmotionInteraction 已加 bond_dao 拦截）
// 加载顺序：在 npc-personal-events.js 之后
// 女主·幽翠微（青城派掌门余沧海最小的弟子、松风观后山茶园的看茶人，约二十岁。爽利清亮，嘴快但不毒——
// 她的直是干净，不是刺：晏万解的刺朝人，幽翠微的快朝事。骂火候不骂人，算账不算人。）
// 心口的事（只此一桩）：她偶然撞见掌门一桩见不得光的旧事（天师洞外夜焚一封旧信，功德簿上被撕去的一页），
// 还没想好说不说。在此之前，她先护住茶园和师弟们。终章由她自己拍板——落点在她敢为自己的判断担责，
// 不清门户、不动掌门：余沧海正典枭雄地位不动，她的选择只关乎她自己怎么活。
// 信物：一罐青城雪茶——她自己炒的头一茬，罐子是旧的，茶是新的。
// 织入的青城旧意象：松风亭晨课（以松涛和太极）、山产出山（商行压价）、采药道巡山（先声后剑）、
// 山下雹灾施斋、天师洞坐忘、竹林听雨。
// 男女玩家皆可追，主线共享（代词按性别），各有专属性别语境事件（femctx/mctx）。

var QING_NPC_ID = 'sect_leader_青城派';

// ============ 主线事件（qing_event_001 ~ 011 + 终章 013） ============
var QING_MAIN_EVENTS = {
    'qing_event_001': {
        id: 'qing_event_001', npcId: QING_NPC_ID, title: '茶园', icon: '🍃',
        desc: '松风观后山的茶园里，看茶人正守着焙灶。',
        minAffection: 12, trigger: { random: 0.4 }, cooldown: 0, flag: 'qing_e001_done',
        autoTrigger: { location: '青城派', random: 0.45 },
        scenes: [
            { speaker: 'narrator', text: '你初上青城，被指去后山茶园寻一位师姐回话。茶园依着坡势一畦一畦铺开，绿得发亮。坡顶一座旧焙灶，灶前青衣女子正徒手翻着一匾茶青，指尖翻得极快，头也不抬。', type: 'description' },
            { speaker: 'npc', text: '「站那儿别动，你踩着我的排水沟了。」她声音清亮，快得像灶上的火，「往左三步，石头。——对，就那块。」她这才抬眼扫你一下，「新来的？回话等我这一匾杀青完，茶不等人，人等得起茶。」' },
            { speaker: 'narrator', text: '她说完又低头翻茶，灶火映着她半边脸。茶青在锅里沙沙地响，香气一层一层漫上来。你发现她翻茶的手背上，新旧烫痕叠着新旧烫痕。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '依言站上石头，卷起袖子：「灶下添柴我会，火色你说了算。」', effect: 'help', affection: 8 },
                { text: '老老实实等完这一匾，再问哪一畦的茶最好', effect: 'ask', affection: 7 },
                { text: '笑一声：「师姐好大的威风，一片茶叶也指挥人。」', effect: 'jest', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'help': aff = 8; msg = '你在灶下坐定，添柴、看火色，她报一句你应一句：「文火。」「再退半根柴。」「好。」一匾茶青杀完，她掂起一片对着日头看，叶脉透青，卷得刚好。「火候听得懂话。」她把茶匾递给你搭手，「茶园认人，不认嘴。你添的这几根柴，茶记得。」临走她朝你点点头，算是把名字互相报了——后山茶园，从此有你一个座。'; break;
                case 'ask': aff = 7; msg = '你等在沟边，看她在灶前忙完一整匾。茶青出锅，她才腾出手，抬下巴往坡上指：「最高那一畦，朝东，雾走得早，日头来得早——雪茶就出在那三行。」她说茶的时候话密得像雨点，一句叠一句，全是事，没有半句虚的，「记着了？明年头一茬，你来得巧就分你一盏。」'; break;
                case 'jest': aff = 5; msg = '她翻茶的手没停，话先回来了：「威风？」她拿茶夹敲了敲锅沿，「这片叶子下树到入罐，要过杀青、揉捻、焙干三道火，误一道，一季的收成就是柴。你管这个叫威风——那你管什么叫伺候？」话说得又快又直，直得你反而笑了。她也笑了一下，把手在围裙上一擦：「行了，会笑的人不坏。回话罢。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'qing_event_002': {
        id: 'qing_event_002', npcId: QING_NPC_ID, title: '松风晨课', icon: '🌲',
        desc: '松风亭的晨课，以松涛和太极。',
        minAffection: 18, trigger: { random: 0.35 }, cooldown: 0, flag: 'qing_e002_done',
        requireEventDone: 'qing_event_001',
        autoTrigger: { timeRange: [5, 8], location: '青城派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '青城天下幽——晨课设在松风亭，以松涛和太极。这日你随众弟子走拳，松风一阵一阵过亭，拳意跟着松涛起伏。散课后，幽翠微提着两篓新采的茶青从亭边过，脚步忽然停了。', type: 'description' },
            { speaker: 'npc', text: '「第三排那个师弟，云手塌了半边。」她冲着带课的师兄扬声，语速快得像报火色，「不是他的错，是亭前这块石板斜了两寸，桩放上去就歪。垫平它，比骂他一百遍管用。」带课师兄愣了愣，蹲下去看那石板，果然斜。', type: 'description' },
            { speaker: 'narrator', text: '满亭的人都笑起来。她把茶篓换了个肩，嘟囔了一句「拳是好的，地是歪的」，转身要走。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '追上去替她抬一篓茶：「评得准。走吧，路上讲讲哪块地还歪。」', effect: 'basket', affection: 8 },
                { text: '当场依她的话重新走一遍拳，走完请她再看一眼', effect: 'redo', affection: 7 },
                { text: '笑一声：「看茶的也评拳脚——茶园里还缺个军师？」', effect: 'mock', affection: -4 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'basket': aff = 8; msg = '你接过一篓茶青，与她并肩下坡。她一路话没停过：松风亭东墙的瓦松了雨会灌、晨课的石阶第三级冬天结暗冰、太极的呼吸和焙茶的火候其实是一个道理——「都是等」。到茶园她把篓子放下，拍拍手上的碎叶：「抬得不赖。下回晨课你来茶园这边站，我把哪块地歪都讲给你。」'; break;
                case 'redo': aff = 7; msg = '石板垫平，你依她方才的话重走一遍拳——云手撑圆，桩落得正正的。走完亭里静了一息，她挑挑眉：「拳脚我不精，可歪和正我分得出。你这一遍，正了。」她把茶篓换了个肩，难得放慢了语速，「学东西快的人，茶园里也有活给你干——头一茬采茶，缺的就是快手。」'; break;
                // 真负选项：她的快朝事不朝人，评的是歪石板不是人；笑她「看茶的」，等于把她守的茶园踩成下贱活计
                case 'mock': aff = -4; msg = '她站住了，回头，把你从头到脚看了一遍——不看人品的看法，看茶青成色的看法。「军师不敢当。」她声音还是清亮的，一个字不脏，「我只知道松风亭的茶汤，是看茶人一锅一锅炒出来的；你晨课走完拳，喉咙里那口回甘，也是茶园里长的。踩茶园抬拳脚——你这一句，地没歪，话歪了。」她提篓就走。那之后半个月，你在茶园边上过，她只当没看见你。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'qing_event_003': {
        id: 'qing_event_003', npcId: QING_NPC_ID, title: '旧罐', icon: '🫖',
        desc: '焙房架顶那只磨得发亮的旧茶罐。',
        minAffection: 25, trigger: { random: 0.35 }, cooldown: 0, flag: 'qing_e003_done',
        requireEventDone: 'qing_event_002',
        autoTrigger: { location: '青城派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '你注意到焙房架子最顶上供着一只旧茶罐。陶胎，罐身磨得发亮，罐口一圈细磕痕——满架新罐锃亮，独它旧得发暗。有个新来的小师弟踮脚要拿下来看，幽翠微的茶夹先一步到了，轻轻格开那只手。', type: 'description' },
            { speaker: 'npc', text: '「架顶那只，不装待客的茶。」她把小师弟拎回地上，语气不重，话却快而清楚，「待客的在第二层，随便拿。那只罐子有主——主不是人，是茶。每年头一茬雪茶才配进去，别的东西，装进去就是糟蹋。」', type: 'description' },
            { speaker: 'narrator', text: '小师弟跑了。她把旧罐取下来，用干布一点一点擦，擦得很慢——她做什么都快，唯独擦这只罐子慢。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '不碰，只问：「罐是旧的，茶是新的——这罐子跟了你几年？」', effect: 'ask', affection: 7 },
                { text: '什么也不问，帮她把满架茶罐挨个擦一遍归位', effect: 'stay', affection: 6 },
                { text: '伸手就要拿：「旧成这样，回头我寻只新罐换它。」', effect: 'grab', affection: -5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'ask': aff = 7; msg = '她擦罐的手停了停，把罐底翻过来给你看——底上一个褪色的刻痕，是个「焙」字。「前任看茶人留下的。」她说，「她在焙房守了三十一年，罐子传下来，规矩也传下来：罐是旧的才认茶，茶是新的才对得起罐。」她把罐子放回架顶，拍了拍手，「问得好。问罐子的人，多半也问得懂茶。」'; break;
                case 'stay': aff = 6; msg = '你没问。你搬了小凳，把第二层的茶罐一只一只取下来擦干净归位，她擦她的旧罐，你擦你的新罐，焙房里只有布过陶面的沙沙声。天擦黑时她忽然开口：「三十一年，前任看茶人一天没离过青城。」就这一句，没有下文——可从这天起，你进焙房不用通报了，架顶那只旧罐当着你的面擦，也不再避。'; break;
                // 真负选项：旧罐是两代看茶人的传承，伸手夺它、嫌它旧，等于把她守的规矩连根拔了
                case 'grab': aff = -5; msg = '你的手离罐还有半尺，她整个人已经横在架子前——采茶的手，快得像抢火中的茶匾。「旧？」她把罐子护在臂弯里，声音还稳，字却一个一个砸得清楚，「这只罐装过头一茬，装过送下山济灾的茶，装过三十一年。新罐子锃亮，装过什么？」她转身把旧罐放上架顶，最高的那一格。往后一个月，你进焙房，那把茶夹总在你和架子之间不远的地方搁着。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'qing_event_004': {
        id: 'qing_event_004', npcId: QING_NPC_ID, title: '天师洞外', icon: '🕯️',
        desc: '夜里她撞见了一件不该撞见的事。',
        minAffection: 32, trigger: { random: 0.3 }, cooldown: 0, flag: 'qing_e004_done',
        requireEventDone: 'qing_event_003',
        autoTrigger: { timeRange: [21, 3], location: '青城派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '深夜，你送伤药去值房，路过天师洞——青城天下幽，幽处最宜坐忘，此时洞前却立着一个人影：掌门余沧海独自站在洞口，就着一盏气死风灯，烧一封信。火苗舔上纸角，他烧得很稳，连指尖都没有动一下。', type: 'description' },
            { speaker: 'narrator', text: '坡下的茶篓后头，幽翠微蹲着，一动不动——她是给洞前送新茶来的，撞见了这一幕。信纸卷焦前，火光把那半页纸照得透亮：纸底一行名字，她在观里旧功德簿上见过——那一页上头，恰好撕去了一角。', type: 'description' },
            { speaker: 'narrator', text: '第二天清早，你再去茶园，她坐在焙灶前发呆，手背贴着一道新烫——炒了一夜茶，走了一夜神。见你来，她只说了一句，声音还是快的，快得有点空：「我看见了不该看的。」', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '不问看见了什么，接过茶铲替她看这一锅：「手烫了就去歇着。」', effect: 'fire', affection: 8 },
                { text: '「没想好，就先不想。想好了再说——说不说，都得你自己定。」', effect: 'words', affection: 7 },
                { text: '「掌门的事，轮得到你操心？茶园看好了就行。」', effect: 'shrug', affection: -3 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'fire': aff = 8; msg = '你没问。茶铲翻下去，火候你替她盯着，一锅茶青沙沙地响。她抱着烫伤的手坐在灶边，坐了半晌，忽然说：「茶要焦了。」你说没有，离火还早。她盯着锅看了一会儿：「……也是。你看得比我还准。」那天她头一回没掌灶。走的时候她在门口停了停，背对着你说：「这事搁我心里，比一锅焦茶还呛。可我还没想好——没想好的事，我不说。」'; break;
                case 'words': aff = 7; msg = '她猛地抬头看你，像被人一语点中灶门。「自己定……」她把这三个字咀嚼了一遍，肩膀松了半寸，「满观的人都当我没心没肺，嘴快。嘴快的人，最怕的恰恰是话砸出去收不回。」她低头看自己手背的烫，「你说得对。定不定在我，说没说也在我。在我就好——在我，我就不慌。」这一锅茶，她重新掌的灶，火色比哪一锅都稳。'; break;
                // 真负选项：茶园和师弟是她「先护住」的底线，也是她敢担事的底气；一句「轮不到你」把她的担当踩成多管闲事
                case 'shrug': aff = -3; msg = '她炒茶的手顿了一顿，随即又翻起来，语速比平常更快：「轮不到？」她把一撮茶青撒进锅里，「功德簿那页撕掉的名字，原先也是这门里的人。今天撕一页没人问，明天撕一页就没人敢问——茶园就在这座山里，师弟们就在这个观里，山塌一角，你说轮不轮得到我？」那夜她炒茶炒到三更。后来很久，她有事不再当你的面说——不是记恨，是学会了把话挑人讲。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'qing_event_005': {
        id: 'qing_event_005', npcId: QING_NPC_ID, title: '山产出山', icon: '🧺',
        desc: '商行年年压价，今年压到了茶园头上。',
        minAffection: 40, trigger: { random: 0.3 }, cooldown: 0, flag: 'qing_e005_done',
        requireEventDone: 'qing_event_004',
        autoTrigger: { location: '青城派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '青城的山产——药材、山果、竹器、茶叶——年年押给山下商行，商行年年压价。今年山货行市好，商行的秤却更黑了：雪茶压到往年的六成，还推说「青城的茶，出不得蜀」。', type: 'description' },
            { speaker: 'npc', text: '押货下山的是幽翠微。她把茶样一字排开，语速快得像炒茶：「六成？掌柜的，峨眉毛尖在蓉城卖几两，你柜上有单子；我这头一茬比它早半月下山，香气压得住它的价。你压的不是茶，是欺负青城山里人不识数。」她把算盘一推，「识数的来了。重新算。」', type: 'description' },
            { speaker: 'narrator', text: '掌柜的脸上一阵红一阵白。满铺子的伙计都停了手——这场价，谈的就是青城一年的香火钱。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '把随行货单摊开，替她一行一行对出商行的秤差', effect: 'reckon', affection: 8 },
                { text: '抱臂站在她侧后，一言不发，只让掌柜的看清青城来了两个人', effect: 'watch', affection: 7 },
                { text: '打圆场：「几片叶子罢了，何必争得这么难看。」', effect: 'cheap', affection: -4 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'reckon': aff = 8; msg = '你摊开货单，一行一行对：入库的秤、出库的价、往年的行情，笔笔有据。掌柜的额上见汗，最后认了八成半的价，还搭了一程免费的水运。出铺子她把算盘往你怀里一塞：「留着。你的手比我快，下回你来拨。」走了两步又回头，眼睛亮得很，「山里人不是不识数——是没人陪我们算。今天起，有人了。」'; break;
                case 'watch': aff = 7; msg = '你一言不发立在她侧后，腰里的家伙什让掌柜的多看了两眼。她谈她的价，你站你的桩，一个快一个稳。谈成出门，她轻哼一声：「看见没有，他给我们加半成，一半是账算得他没法，一半是你站得他心里没底。」她把茶银的封条拍了拍，「谈价这事的诀窍：话要占理，人要占势。今天两样都齐了。」'; break;
                // 真负选项：山产是青城一年香火钱、师弟们的口粮，「几片叶子」把她拼死护的东西说轻了
                case 'cheap': aff = -4; msg = '她谈价的话头断在半空。回头看你时，眼里那点热乎气凉了下去：「几片叶子？」她声音不高，字字清楚，「这几片叶子，是师弟们一筐一筐背下山的；是雹灾那年观里开仓施粥的本钱；是前任看茶人三十一年没离山的原因。你觉得难看——好，你出去站着，别脏了我的价。」那天价还是谈成了，回山的路上她走在头里，一路没跟你说话。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'qing_event_006': {
        id: 'qing_event_006', npcId: QING_NPC_ID, title: '采药道', icon: '⛰️',
        desc: '两个小师弟在采药道上被剪径的扣住了。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'qing_e006_done',
        requireEventDone: 'qing_event_005',
        autoTrigger: { location: '青城派', random: 0.42 },
        scenes: [
            { speaker: 'narrator', text: '傍晚，消息传回观里：两个小师弟在采药道上被一伙剪径的扣住了——劫的不是货，是「过路钱」，不给就要人上山赎。管事的正要集队巡山，幽翠微已经把药篓甩下了肩。', type: 'description' },
            { speaker: 'npc', text: '「集队要半个时辰，天黑只要一刻。」她一边束袖口一边说，话快人更快，「青城的规矩，先声后剑——我先去出声，剑留在后头。他们要的是钱，不是命，谈得拢。」她看了你一眼，「你脚程快不快？」', type: 'description' },
            { speaker: 'narrator', text: '山道上松涛一阵紧似一阵。远处采药道的隘口，隐约有火光。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「快。你出声，我押后——剑在我这儿。」与她一前一后上山道', effect: 'go', affection: 8 },
                { text: '「你先去谈，我这就回观搬巡山队，半时辰内必到。」', effect: 'report', affection: 7 },
                { text: '「茶园夜里离不开人，我替你守住焙房，你带人去。」', effect: 'guard', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0; var msg = '';
            switch (choice) {
                case 'go': aff = 8; msg = '隘口的火堆边，她扬声报的是青城的规矩、山道的旧账、剪径的下场，一句接一句，快得对面插不上话——真应了先声后剑，声先到，胆先寒。为首的掂量半晌，放了人，收了摊。下山的路上两个小师弟一左一右拽着她的袖子，她嘴上嫌「鼻涕蹭我衣裳了」，脚步放得极慢。到你面前她站定：「你今晚一个字没说，可你在，我的声就硬。记你一功——茶园头一茬，有你一份。」'; break;
                case 'report': aff = 7; msg = '你飞奔回观，巡山队举着火把上道时，她正跟剪径的谈第三轮——人赃并获，一个没跑。事后管事的问她怎么敢一个人拖住这么久，她朝你努努嘴：「他知道我该往哪儿站。谈的人在明处，搬兵的人在暗处，两头都亮堂，我就敢拖。」巡山队收队那晚，她往你房里送了一包炒好的雪茶：「搬兵的腿，值这包茶。」'; break;
                case 'guard': aff = 6; msg = '人救回来了，一个没伤。她回来时先奔焙房，见灶火未熄、茶匾归位、架顶旧罐安然，才长长吐出一口气：「守得好。」她一屁股坐在灶前的小凳上，「外头的事再大，回来见焙房是齐的，心就落地了。你守的不是屋子——是回来的人那口气。」第二天她把两个小师弟拎到茶园罚采茶，罚的规矩是：采满一篓，跟着你学认火候。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'qing_event_007': {
        id: 'qing_event_007', npcId: QING_NPC_ID, title: '雹灾之夜', icon: '🌨️',
        desc: '山下遭了雹灾，后山茶园也砸了半边。',
        minAffection: 55, trigger: { random: 0.3 }, cooldown: 0, flag: 'qing_e007_done',
        requireEventDone: 'qing_event_006',
        autoTrigger: { location: '青城派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '入夜，雹子说来就来，砸得茶园噼啪作响。半山以上的老茶树扛得住，半山以下新补的三亩嫩苗眼看要毁。天没亮，观里又传下话：山下村镇遭雹最重，房塌了半边，观里开仓施斋，缺人押粮下山。', type: 'description' },
            { speaker: 'npc', text: '幽翠微蓑衣都来不及披齐，站在雨雹里分派：「老三带人给嫩苗盖草帘，一畦一畦盖！师姐妹去库房点米——粥棚天亮就要开！」她自己两头跑，茶园到库房，库房到茶园，嗓子喊哑了一半，脚下没有一步乱的。', type: 'description' },
            { speaker: 'narrator', text: '押粮下山的路，夜里全是泥和冰雹，来回一趟要耗尽力气。她站在岔路口，看看茶园，又看看山门，一个人恨不得劈成两半用。', type: 'description' },
            { speaker: 'player_select', text: '你必须立刻做点什么。', options: [
                { text: '接过押粮的差事：「粥棚我去，茶园交给你——天亮前都保住。」', effect: 'relief', affection: 11 },
                { text: '留在茶园，跟她一畦一畦给嫩苗盖草帘', effect: 'straw', affection: 8 },
                { text: '喊聚值夜的师兄弟分成两队，一队茶园一队粥棚，她居中调度', effect: 'rally', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'relief': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 11) : { ok: true };
                    if (!_py.ok) { aff = 4; msg = '你扛起粮袋要走，连日的山路却让眼前先黑了一黑——她一把托住袋底，硬生生把粮袋夺回自己肩上。「押粮押的是力气，你这半步晃，下山要栽进沟里。」她把袋转手交给老三，「你守灶。粥棚误了开饭我认，你栽进沟里我不认。」那夜的粥棚迟开了半个时辰，她两头跑，跑完天亮的账：苗保住了七成，粥棚前排起的队一直排到了晌午。（精力不足，那一夜你先撑不住了）'; break; }
                    aff = 11; msg = ('你押粮下山，泥路冰雹，一趟背两袋。天亮时粥棚开饭，老灾民捧着热粥朝青城山的方向作揖——揖的就是山上那盏通宵的灯。你回山时天光发白，茶园里她瘫坐在泥地里，三亩嫩苗盖了七成草帘，手背上全是草帘的刺。她抬头看你，哑着嗓子先报账：「粥棚开饭几时？」你说天亮整。她点点头，忽然笑了：「两头都赶上了。行——这一夜，你记首功。」') + '（精力-11）'; break; }
                case 'straw': aff = 8; msg = '你与她一畦一畦盖草帘，雹子砸在笠帽上咚咚作响。她盖东头你盖西头，中间隔着一畦苗喊话，喊的全是正事：「这畦根浅，压两层！」「排水沟掏开，别存水！」天蒙蒙亮雹停了，三亩嫩苗保住七成。她挨畦查过去，查完直起腰，朝你伸出手，掌心躺着两根草茎：「盖帘的手艺，你出师了。往后头一茬采茶，头三行归你。」'; break;
                case 'rally': aff = 7; msg = '你敲响了值房的梆子，十几名师兄弟披衣而起。你分派：五人跟她盖草帘，五人押粮，其余守库房。她在雨雹里看了你一眼——那一眼很亮。天亮账清，她在施斋的名录边上添了一行小字：「雹夜，分队调度，出自外客。」管事的凑过来看，她把名录一合：「看什么，记功。青城的功，从来不记糊涂账。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'qing_event_008': {
        id: 'qing_event_008', npcId: QING_NPC_ID, title: '竹林听雨', icon: '🌧️',
        desc: '雨夜竹林，她把压了半年的话说了一半。',
        minAffection: 62, trigger: { random: 0.3 }, cooldown: 0, flag: 'qing_e008_done',
        requireEventDone: 'qing_event_007',
        autoTrigger: { timeRange: [19, 23], location: '青城派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '蜀中的雨说来就来。夜里她提灯来寻你，只说「陪我去竹林坐坐」——青城旧景，竹林听雨，雨打竹叶沙沙，像炒茶的声音。两人在竹亭里坐下，她盯着雨幕，很久没有开口。开口时，语速罕见地慢。', type: 'description' },
            { speaker: 'npc', text: '「天师洞那晚，掌门烧的是一封旧信。」她说，「信底有个名字。那个名字，我在观里旧功德簿上见过——见过的那一页，撕去了一角。撕口发黄，是多年前撕的。」雨声沙沙。她的声音混在雨里，「门里没有人提过这个人。可掌门的信，烧得那么稳，那么熟——像烧过很多回。」' },
            { speaker: 'npc', text: '「说不说，我想了半年。」她转头看你，眼睛在灯下亮得惊人，「说了，撕开的是几十年前的旧口，园子、师弟、这座山，都得跟着晃；不说，这根刺就在我心里，扎一天是一天。两样我都担得起——我只怕一样：拿不定主意的时候，把主意错交在别人手里。」', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？（这一桩，没有对错，只有听法）', options: [
                { text: '听完这一夜，天亮时只说一句：「先护住手里的。茶园是你的，师弟是你的——主意也是你的。」', effect: 'stay', affection: 12 },
                { text: '「想清楚再定。可不管你定说还是不说，我都站你茶园这一头。」', effect: 'side', affection: 9 },
                { text: '「这种大事，该递到长老们案头去，让他们断。」', effect: 'report', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'stay': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 12) : { ok: true };
                    if (!_py.ok) { aff = 5; msg = '你想陪她坐到天亮，连日的劳乏却先把你按在了亭柱上——半睡半醒间，听见她轻笑一声，把自己的蓑衣解下来盖在你身上。「守夜的人先倒了。」她自言自语，语气不恼，倒像炒茶时夸了一句火候刚好。那夜的雨她一个人听完的。天亮你醒来，亭桌上搁着一小撮新焙的茶，用纸包着，包上一行快字：「茶替我谢你。主意，我自己拿。」（精力不足，那一夜你先撑不住了）'; break; }
                    aff = 12; msg = ('雨下了整夜，你听了一整夜，没有插一句话——她说到哪里，你就听到哪里。天光泛白时雨歇了，竹叶上的水一滴滴落。她等着你说什么。你只说：「先护住手里的。茶园是你的，师弟是你的——主意也是你的。」她盯着你看了很久很久，忽然肩背整个松下来，像卸了一篓湿茶。「……对。」她声音有点哑，「半年了，满山的人要是都劝我说，或者都劝我不说，我早就乱了。你一样都没劝。」她起身，把灯递给你，「回吧。这事我心里有底了——底不是你给的，是你让我自己摸着的。」') + '（精力-12）'; break; }
                case 'side': aff = 9; msg = '「站我这一头？」她咀嚼着这五个字，忽然笑出声，笑得竹叶上的雨都震下来几滴，「行。这话我记下了——记在头一茬里头。」她伸手接了一捧亭外的雨，「说与不说，都是我的账；你只管站定，别跟着晃。晃的人多了，我反而看不清自己的秤。」那夜回观的路上，她走在前头，脚步比来时轻。'; break;
                case 'report': aff = 6; msg = '她摇头，摇得很干脆：「递上去，就不是我的主意了。」她把灯往膝前挪了挪，「长老们断他们的，断完了，山里的日子照旧是过我这一关。我要的不是一个结果——是我自己拿的主意，我自己担。」话虽驳了你，语气却不冲，末了还补一句，「不过你肯往正道上想，心是正的。这条我认。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'qing_event_009': {
        id: 'qing_event_009', npcId: QING_NPC_ID, title: '头一茬', icon: '🍵',
        desc: '她把那罐青城雪茶，放进你手里。',
        minAffection: 68, trigger: { random: 0.3 }, cooldown: 0, flag: 'qing_e009_done',
        requireEventDone: 'qing_event_008',
        autoTrigger: { location: '青城派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '清明前，雪茶开采。头一茬只采三行，芽尖带露，指尖不能沾油——采下来还要连夜过三道火：杀青、揉捻、焙干，焙灶离不得人，人离不得灶。幽翠微把闲杂人等都赶出了焙房，只留了你一个添柴的。', type: 'description' },
            { speaker: 'npc', text: '「头一茬的火，误一息就是一年的味。」她盯着锅，语速比火还快，「柴退半根。——好。风门开一线。——对。」三更过完，天将亮，最后一焙起锅，满屋香得让人不敢大声呼吸。', type: 'description' },
            { speaker: 'narrator', text: '她取出架顶那只旧罐，把新茶一捧一捧装进去，装得极慢。装完，她捧着罐子看了你一会儿——然后连罐带茶，放进你的手里，替你把手指一根一根合拢。', type: 'description' },
            { speaker: 'npc', text: '「罐是旧的，茶是新的。」她说，耳根有点红，话还是快的，「喝了我的茶，就得知道我的话的分量。这罐茶在我这儿，是规矩；在你那儿——是信。收好。」', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '双手接稳茶罐：「这一夜的火我看着的——茶不掺假，人也不会。」', effect: 'take', affection: 14 },
                { text: '「茶你留着。等你把那件事定了，庆也好，了也好——我再来喝这一罐。」', effect: 'vow', affection: 9 },
                { text: '捧着罐子，认真问：「为什么是我？」', effect: 'ask', affection: 8 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'take': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 14) : { ok: true };
                    if (!_py.ok) { aff = 6; msg = '你伸手接罐，熬了一夜的身子却乏得指尖发颤，旧罐晃了一下——她眼疾手快托住罐底，连罐带你的手一起按稳。「拿东西都拿不稳，还敢接我的茶。」她嘴上快，手上却把罐子重新用布裹了一层，塞进你怀里，「裹好了，摔不着。人乏了就回去睡，茶替我看着你。」你回到房里，怀里的罐子贴着心口，一直是温的。（精力不足，那一夜你乏得厉害，罐是她替你裹好的）'; break; }
                    aff = 14; msg = ('你双手接稳，罐身的旧陶磨着掌心，里头的新茶沙沙地沉了沉——像应了一声。你一夜添柴，看她三道火过得一丝不乱，此刻只说：「这一夜的火我看着的——茶不掺假，人也不会。」她愣了一下，随即别过脸去收拾茶匾，动作快得反常，耳根红透了：「……废话。我的茶什么时候掺过假。」半晌，焙房里又飘来一句，声音低了些，「罐底垫了张纸。纸别丢。等你哪天想喝茶了，自己烧水——水要活火，别糊弄。」') + '（精力-14）'; break; }
                case 'vow': aff = 9; msg = '她合拢你手指的动作停了。「定了再喝……」她把罐子抱回去，抱得很紧，像抱回一件差一点就送出去的贵重东西，「好。这话比收了茶还重。」她把旧罐放回架顶最高的那一格，拍了拍罐身，「等着。定了那天，头一盏是你烧的水。」——那之后每次你上茶园，架顶的罐子都擦得比先前更亮，像在等一个日子。'; break;
                case 'ask': aff = 8; msg = '「为什么是你？」她眨眨眼，忽然扳着手指头算起账来，语速又快上了天：「雹灾夜押粮的，是你；采药道押后的，是你；商行里对单子的，是你；竹林里听我讲半宿、一句没劝的——还是你。」她算完，手一摊，「账在这摆着。我的茶给谁，从来不凭嘴甜，凭账。」说完自己先绷不住笑了，「这答案，够不够直？」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'qing_event_010': {
        id: 'qing_event_010', npcId: QING_NPC_ID, title: '掌门问茶', icon: '👁️',
        desc: '余沧海亲自来了茶园，说是要讨一盏茶。',
        minAffection: 72, trigger: { random: 0.3 }, cooldown: 0, flag: 'qing_e010_done',
        requireEventDone: 'qing_event_009',
        autoTrigger: { location: '青城派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '这日晌午，茶园里来了个不寻常的客人——掌门余沧海，青袍缓带，只带一个随从，说是「讨盏新茶」。幽翠微是掌门最小的弟子，奉茶的手稳，礼数一丝不乱。余沧海呷了一口，不评茶，先评人：「听说你近日，与观里一位外客走得很近。」', type: 'description' },
            { speaker: 'npc', text: '掌门的语气闲适得像聊天气，目光却不闲——那双眼睛在茶烟后面，把茶园、焙房、架顶的旧罐、还有你，一样一样看过去。「年轻人爱交朋友，是好事。」他放下茶盏，「只是有些朋友，话多；有些话，多了伤山门。翠微，你说是不是？」', type: 'description' },
            { speaker: 'narrator', text: '幽翠微执壶的手停在半空。园子里静得能听见茶锅里的水汽声。这话里有钩，钩的是什么，你和她都听明白了。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '先一步答话，只谈茶不谈人：「掌门，这水再滚一分就老了。茶要趁热——话也是。」', effect: 'answer', affection: 8 },
                { text: '与她并肩而立：「茶园的账我陪她对过——笔笔干净。山门的事，她比谁护得都紧。」', effect: 'side', affection: 11 },
                { text: '给掌门续上茶，笑一笑：「掌门问茶，茶不懂人事。要问，问种茶的人；要信，信守山的人。」', effect: 'deflect', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'answer': aff = 8; msg = '余沧海的目光在你脸上停了两息，忽而一笑，把茶盏推过来：「烫手的茶都端得稳，话倒会挑时候说。」他重新呷了一口，站起身，掸了掸袍角：「茶是好茶。人——」他看了幽翠微一眼，那一眼深不见底，「也还算稳。」主仆二人去远了，她才慢慢吐出一口气，低声快语：「谢了。他那个人，你答慢半句，他能顺着半句走出一里地。」'; break;
                case 'side': aff = 11; msg = '你上前半步，与她并肩。她执壶的指尖微微一颤，随即稳住了。余沧海看看你，又看看她，茶烟后面那双枭雄的眼睛眯了眯：「账笔笔干净。」他把这四个字念了一遍，像在舌上掂一枚新茶的斤两，忽然抚掌，「好。青城守山七百年，守的就是一个『账目干净』。」他起身离园，走到坡口留下最后一句，不重，却人人听得见：「翠微，你的茶园——你自己看住了。」她立在原地，半晌，极轻地说：「他这是把园子正式交我了。也把担子，一并交了。」'; break;
                case 'deflect': aff = 7; msg = '你续茶的手很稳，话也稳。余沧海盯着那一线新注的水看了片刻，笑出了声：「好一张嘴。茶不懂人事——这话在理。」他饮尽那盏，起身，「守山的人，山信得过；信不信人，山说了算，不是老夫说了算。」人走了，茶园里安静下来，幽翠微收拾着茶盏，头也不抬地说：「你这一手，把他的话头引到山上去了。他一辈子最听不得『山』字——你倒是摸准了。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'qing_event_011': {
        id: 'qing_event_011', npcId: QING_NPC_ID, title: '塌坡夜', icon: '⛈️',
        desc: '连日暴雨，茶园上头的坡要塌了。',
        minAffection: 78, trigger: { random: 0.3 }, cooldown: 0, flag: 'qing_e011_done',
        requireEventDone: 'qing_event_010',
        autoTrigger: { timeRange: [21, 4], location: '青城派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '连下了七日雨。夜里丑时，后山传来闷响——茶园上头的老坡吃透了水，裂了一指宽的缝，坡脚就是师弟们住的三间茅棚，棚里还堆着观里过冬的义仓米和整园的扦插茶苗。再有一场大雨，坡塌下来，棚、米、苗，一样都留不住。', type: 'description' },
            { speaker: 'npc', text: '幽翠微蓑衣一披就冲进了雨里，嗓子已经喊开了：「棚里的人全出来，往焙房撤！老三带路！——东西后搬，人先走！」她在坡脚立定，仰头看那道裂缝，雨水顺着下颌往下淌，「缝还在走。棚里的米和苗，抢一样是一样。」', type: 'description' },
            { speaker: 'narrator', text: '雨幕里，茅棚的灯还亮着。米有二十袋，苗是整园的根——头一茬雪茶的母本扦插，全在那棚里。人已经撤干净了，剩下的，是拿力气和天抢时辰。', type: 'description' },
            { speaker: 'player_select', text: '你必须立刻做点什么。', options: [
                { text: '与她并肩抢搬：一袋米一担苗，暴雨里来回背，抢在塌坡之前', effect: 'carry', affection: 14 },
                { text: '人撤完后你再进棚，米苗全要，最后连她第一年亲手育的那畦母本苗一起挖出来背走', effect: 'dig', affection: 15 },
                { text: '守在坡口执灯数人头、报裂缝，做她和所有人力量的眼睛', effect: 'lamp', affection: 10 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'carry': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 14) : { ok: true };
                    if (!_py.ok) { aff = 6; msg = '你扛起米袋要冲，脚下一滑，连日的乏让你整个人跪进泥里——她一把拽起你，吼得比雷还响：「人先顾人！你塌在棚里，我搬米还有什么用！」她转头改派你去坡口执灯报缝。那夜的米抢出一半，苗抢出七成，人一个没伤。天亮她瘫在焙房门口，看看你，忽然说：「跪泥里那一下，手还死死攥着袋角。」她把蓑衣解下来披你身上，「力气养回来。茶园的日子长。」（精力不足，那一夜你先撑不住了）'; break; }
                    aff = 14; msg = ('雨像瓢泼。你与她一袋一袋往外背——她背米你背苗，泥路滑，两个人摔了又起，起了又跑。裂缝在头顶上咯咯地走，最后一担离棚，坡「轰」的一声塌下来，泥浆埋了半间棚。焙房里，二十袋米垛齐，茶苗一捆一捆沥着水，师弟们围着数，一个不少，一样不缺。她靠着米垛滑坐下去，喘着，忽然笑出声：「抢赢了。」她朝你伸出手，掌心全是泥，「击个掌——头一茬的功，有你一半。」') + '（精力-14）'; break; }
                case 'dig': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 14 + 20) : { ok: true };
                    if (!_py.ok) { aff = 8; msg = '你二次进棚，米袋上肩，再去挖那畦母本苗时，塌坡的头一波泥浆已经漫进门槛——是她在雨里死命把你拽出来的，两个人滚进泥水，苗畦埋了半边。她趴在雨里咳，先骂：「命比苗金贵，这话要我说几遍！」骂完却盯着半埋的苗畦看了很久，声音低下去，「……剩下的苗，天亮我带你一株一株挖。一株都不丢。」（精力不足，那一刻你先撑不住了）'; break; }
                    aff = 15; msg = ('米尽、苗尽，你第三趟进棚——塌坡前最后一刻，你跪进泥里，把她第一年亲手育的那畦母本苗连土整块挖起，抱在怀里退出棚门。身后棚顶塌落的闷响追着你的脚跟。焙房灯下，你把那整块苗土放到她面前：母本苗根须完好，一株不少。她蹲下去，两只手插进湿土里捧住苗根，半天没说话——再抬头时眼睛通红，话却还是快的：「这畦苗，是我进茶园第一年育的。育活了它，前任看茶人才把旧罐交给我。」她把苗抱进怀里，像抱一坛火种，「今晚你抢回来的不是苗。是我的来处。」') + '（精力-34）'; break; }
                case 'lamp': aff = 10; msg = '你立在坡口，灯举得笔直：「缝往东走了半指！」「泥浆下来了，西墙根躲开！」声声报进雨里，棚里的人应声换位，没有一步踩空。米苗抢完，最后一人出棚，你报「缝稳」，全场才敢松劲。她抹了把脸上的雨水，冲你举起大拇指：「灯一夜没歪，报一声准一声。茶园缺个掌灯的眼睛——今晚起，这双眼睛是你。」塌坡之后清点：人零伤，米二十袋，苗七成——她把这串数目念了三遍，念一遍看你一眼。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'qing_event_013': {
        id: 'qing_event_013', npcId: QING_NPC_ID, title: '终章·初雪', icon: '❄️',
        desc: '青城落了今冬第一场雪，她把主意定了。',
        minAffection: 85, trigger: { random: 1.0 }, cooldown: 0, flag: 'qing_e013_done',
        requireEventDone: 'qing_event_011',
        autoTrigger: { location: '青城派', random: 0.45 },
        endingMap: { '煎雪': 'qing_ending_煎雪', '焙春': 'qing_ending_焙春', '茶信': 'qing_ending_茶信', '留青': 'qing_ending_留青', '覆茶': 'qing_ending_覆茶', '空翠': 'qing_ending_空翠' },
        scenes: [
            { speaker: 'narrator', text: '青城落了今冬第一场雪。松风亭的松针托着雪线，茶园覆了薄薄一层白，焙房的烟囱照常冒着烟——雪天焙茶，火色最难拿，她偏挑今天开灶。你进园时，她正把最后一匾茶收起锅。', type: 'description' },
            { speaker: 'npc', text: '「来得正好。」她拍拍手上的茶末，语速还是快，可每个字都放得很稳，「有件事，今天定了，先告诉你。」她从怀里取出一页折得方正的纸，展开——是她的字，一笔一笔，清清楚楚记着那夜天师洞外所见：几时、何地、何人、焚信、功德簿撕页。', type: 'description' },
            { speaker: 'npc', text: '「我想了一年，定了。」她说，「这一页，我不递长老，也不烧掉——我留着。留到哪天它该开口，我自己一个字一个字说出去，我自己担每一个字。在那天之前，我先看我的茶园，护我的师弟，炒我的茶。」她把纸折好，收进那只旧罐的罐底，「主意是我拿的，账是我认的。这样，不管哪天说、哪天不说——我都不亏心。」', type: 'description' },
            { speaker: 'narrator', text: '雪落在焙房的瓦上，簌簌的。她转过身来，眼睛在雪光里亮得很，忽然放慢了语速——一年到头，她难得说这么慢的话。', type: 'description' },
            { speaker: 'npc', text: '「{playerName}。」她叫你的名字，「茶定了，主意也定了。就剩一桩没定——你。往后你的路在哪儿，我们两盏茶，是一处喝，还是各喝各的。你说。」', type: 'description' },
            { speaker: 'player_select', text: '你的选择将决定你们的关系走向', options: [
                { text: '「跟我走。带上那只旧罐——茶在哪儿焙，哪儿就是青城。」', effect: 'lover_travel', affection: 30 },
                { text: '「留在青城。焙房添第二把椅子——每年头一茬，两个人炒。」', effect: 'lover_stay', affection: 28 },
                { text: '「茶园你照看。我做你的买主——每年初雪，我上山讨一盏新茶。」', effect: 'friend', affection: 20 },
                { text: '「给我在茶园留个常客的座。我往山下寄信——你把信，压在罐底。」', effect: 'friend_stay', affection: 18 },
                { text: '「雪大了。我只是过山的客——该下山了。」', effect: 'none', affection: 0 }
            ]}
        ],
        effects: function(npc, choice) {
            // 三度伤透即寒心：辜负独立成结局「覆茶」，与「空翠」（错过）分账
            var negCount = (window._negativeChoiceCount && window._negativeChoiceCount[QING_NPC_ID]) || 0;
            if (negCount >= 3 && (choice === 'lover_travel' || choice === 'lover_stay')) {
                return { affection: 0, msg: '她听完，没有立刻答。然后她笑了一下——那笑很短，像灶膛里最后一点火星。「喝茶？」她转身取下架顶那只旧罐，揭开盖。今年头一茬的雪茶，一撮一撮，满罐的香。她把罐子倾过来，新茶簌簌地倒进灶膛的余烬里——白烟腾起一股，香气冲上来一次，随即散了。「茶倒给灶，是给不配喝的人看的。」她把空罐扣在灶台上，罐底朝天，「踩我的茶园的、笑我的茶的、叫我别多管闲事的——账我一笔一笔记着，跟这罐底一样，扣着，不装茶了。」她掸掸手，转身出焙房，背影又直又快，「下山罢。路滑，好走不送。」那一冬青城的雪下得很大。焙房的烟囱照常冒烟，茶照常炒——只是那只旧罐，从此倒扣在灶台最高处，再没有正过来过。', ending: '覆茶' };
            }
            switch (choice) {
                case 'lover_travel': return { affection: 30, msg: '她怔在雪光里，半晌，忽然笑开——笑得毫不掩饰，快人快语的本色全回来了：「茶在哪儿焙，哪儿就是青城？」她一把摘下围裙塞给旁边的师妹，转身交代得又快又清楚：「头一茬三行，清明前三天开采，指尖不许沾油！焙灶的火门春天要关半线！旧罐我带走——罐到哪儿，规矩到哪儿！」交代完她拎起那只旧罐，罐底压着那页纸，走到你面前，把冰凉的手塞进你掌心：「走。外头的雪大不大我不知道——反正煎雪的水，管够。」那天的焙房烧到很晚，师妹们说，师姐炒最后一锅茶时，哼了不成调的曲子。', ending: '煎雪' };
                case 'lover_stay': return { affection: 28, msg: '「第二把椅子？」她眼睛弯起来，随即板起脸一本正经地算账，语速飞快：「焙房一共九步见方，添椅子要挪茶匾架，挪架子要让火门，让火门——」她算到一半自己绷不住了，笑出声，「行。都让。地方挤，人挤一挤，暖。」第二天，焙房里真的添了第二把椅子，摆在灶前最好的看火位，椅脚垫了石，稳稳的。她对师妹们交代规矩，末一条是：「头一茬的火，两个人看。」师妹问柴够不够，她答得一字不废：「够。他劈的。」——柴房里的柴，早码得整整齐齐，码了半个月了。', ending: '焙春' };
                case 'friend': return { affection: 20, msg: '她掂了掂手里的茶罐，忽然乐了：「买主？行啊——那咱们把账立清楚。」她扳着手指头，快人快语地开条款：「一年一会，初雪为期；你上山，我开罐；头一盏你烧水，水要活火；账目当面清，谁也不欠谁。」说完她伸出小指，「拉钩。青城的茶不骗人，立约的人也不许骗。」那天的雪一直下到掌灯。她送你到山门，站在雪里挥手，声音顺着风飘上来：「明年初雪，早点上山——头一茬我给你留最上头的三行！」', ending: '茶信' };
                case 'friend_stay': return { affection: 18, msg: '「常客的座？」她把旧罐从灶台上拿下来，揭开盖想了想，又合上，「座可以有，茶园东头那块看云石，归你。信也可以有——」她把罐底那页自己的纸取出来看了一眼，重新放好，「罐底压着我的主意，再压你的信，正好：一个是我没说的，一个是你要说的。都收着。」她抬眼看你，耳根微红，话还是快的，「寄信走山下驿路，谷雨前的一封写茶园，霜降后的一封写你自己——写错时节，罚你明年自己采头一茬。」那一年起，青城后山焙房的旧罐底，除了那页折得方正的纸，又多了一叠山下来的信，信纸带过山外的风尘，一页都不曾受潮。', ending: '留青' };
                case 'none': return { affection: 0, msg: '她执罐的手在半空停了很久。焙房里的火噼啪响了一声，她回过神，把旧罐放回架顶最高的那一格，动作很轻，像放下一件本来要送人的东西。「也是。」她转身往灶里添了根柴，语速恢复了平常的快，快得滴水不漏，「雪大了，山路不好走，客该下山。茶园明春还要补苗，我忙我的。」她炒完那一锅茶，用布把灶台擦了三遍——平常一遍就够的。你下山那日，雪停了，她站在坡顶的茶园里没下来，只朝你扬了扬下巴：「路滑。好走。」从此青城初雪年年落，头一茬年年入罐。罐是旧的，茶是新的——只是再没有分出去过一份。', ending: '空翠' };
            }
            return { affection: 0, msg: '' };
        }
    }
};

// ============ 幽翠微结局演出（6 个） ============
var QING_ENDINGS = {
    'qing_ending_煎雪': {
        id: 'qing_ending_煎雪', npcId: QING_NPC_ID, title: '结局·煎雪', icon: '❄️',
        route: '煎雪',
        scenes: [
            { speaker: 'narrator', text: '三日后，幽翠微把茶园、焙灶、火候的规矩一条一条交代给师妹，末了把那只旧罐抱进怀里——罐是旧的，茶是新的，罐底压着那页她亲手写的纸。她说：「罐到哪儿，青城的规矩到哪儿。」', type: 'description' },
            { speaker: 'npc', text: '「茶在哪儿焙，哪儿就是青城。」她与你并肩立在山道上，回望了一眼满山的绿，「头一茬我带了母本苗，走到哪儿育到哪儿。你负责找好水——雪水、泉水、活火，一样都不能将就。」', type: 'description' },
            { speaker: 'narrator', text: '多年后，江湖上有个说法：有一对走山的人，每到一个地方，逢雪必煎茶。女的炒茶，三道火一丝不乱；男的看水，水开了才许揭罐。有人问那女的，罐底那页纸是什么。她说：「我的主意。」问的人不明白，{playerTa}也不解释——主意到了该说的那天，她自己会说，一个字都不借别人的嘴。', type: 'description' },
            { speaker: 'narrator', text: '后来那页纸始终没有到「该说的那天」。她不提，也不烧。有回夜宿破庙，你问她后不后悔。她往灶里添了根柴，火光映着半边脸：「不悔。留着它，我天天记得自己是谁——记得自己敢担事的人，走到哪儿，腰都是直的。」', type: 'description' }
        ],
        finalText: '——— 结局·煎雪（道侣·同行）———'
    },
    'qing_ending_焙春': {
        id: 'qing_ending_焙春', npcId: QING_NPC_ID, title: '结局·焙春', icon: '🔥',
        route: '焙春',
        scenes: [
            { speaker: 'narrator', text: '你留在了青城。焙房里添了第二把椅子，摆在灶前最好的看火位，椅脚垫着石。每年清明前，头一茬雪茶两个人炒：她掌锅，你看火；她报「退半根柴」，你手上从不误一息。', type: 'description' },
            { speaker: 'narrator', text: '那页纸还在旧罐底压着。她说过一回，就再没提——茶园照看，师弟照护，塌了的坡重新垒了石堰，义仓的米年年补满。她说主意是自己拿的，账是自己认的，日子就要过得对得起这两样。', type: 'description' },
            { speaker: 'npc', text: '「今年头一茬，香比去年厚。」她起锅时凑近嗅了嗅，把第一盏推给你，「水是你烧的，功有你一半。」话是算账的口气，推盏的指尖却在盏沿上多停了一息才松开。', type: 'description' },
            { speaker: 'narrator', text: '观里的师弟师妹私下说：师姐还是嘴快，评火候评得满园没人敢喘大气——只是每年头一茬开炒那夜，焙房的灯下是两个人影，一个报火色，一个添柴，配合得像一双手。', type: 'description' },
            { speaker: 'narrator', text: '青城的雪年年落，焙房的火年年旺。旧罐里年年有新茶——两个人炒的茶，火候里各带一半的性子：她的快，你的稳。', type: 'description' }
        ],
        finalText: '——— 结局·焙春（道侣·归隐）———'
    },
    'qing_ending_茶信': {
        id: 'qing_ending_茶信', npcId: QING_NPC_ID, title: '结局·茶信', icon: '🫖',
        route: '茶信',
        scenes: [
            { speaker: 'narrator', text: '你成了青城的买主。一年一会，初雪为期——雪落进茶园那天，你上山，她开罐，头一盏的水由你烧。约立得清清楚楚：账目当面清，谁也不欠谁。', type: 'description' },
            { speaker: 'npc', text: '「今年初雪迟了五天，我以为你误了约。」她把茶罐坐上炉，嘴上不饶人，眼睛却一直往山门的方向瞟，「路上雪大？——废话，肯定大。喝茶。」话快，盏满，热气把两个人的眉眼都熏松了。', type: 'description' },
            { speaker: 'narrator', text: '有人问你们是什么关系。她答「茶约」，{playerTa}答「茶约」。答完她给你算这一年的账：头一茬几两、火候几分、你烧水误了几回——算完把账页一合：「两清。明年再欠。」一年欠一回，年年两清，清了几十年。', type: 'description' },
            { speaker: 'narrator', text: '后来她成了青城最出名的看茶人，头一茬雪茶一出山，商行再不敢压价。江湖人说，她的茶不掺假，她的约不误期——因为每年初雪，山上总有一个准时上山的人，替满山茶客验那一盏的头道香。', type: 'description' }
        ],
        finalText: '——— 结局·茶信（挚友·同行）———'
    },
    'qing_ending_留青': {
        id: 'qing_ending_留青', npcId: QING_NPC_ID, title: '结局·留青', icon: '✉️',
        route: '留青',
        scenes: [
            { speaker: 'narrator', text: '{playerTa}成了青城后山的常客。茶园东头那块看云石年年留着，石面让她用茶麸擦得发亮；每年谷雨前、霜降后，山下驿路各来一封信——信到了，她当面拆，当面回，回信的字比炒茶还工整。', type: 'description' },
            { speaker: 'narrator', text: '看完的信，她一页一页抚平，压进那只旧罐的罐底——罐底原压着她自己那页没说的纸，如今纸上头又压着你的信。她说：「一个是我没说的，一个是你要说的。搁一处，正好。」', type: 'description' },
            { speaker: 'npc', text: '「霜降的信迟了三天。」她把新信压进罐底，指尖在罐沿敲了敲，「……驿路上，落雨了？」问得别扭，回信的纸却早裁好了，连你要问的茶园近况，都提前一条条写在头一行。', type: 'description' },
            { speaker: 'narrator', text: '师妹有回问她：山下那位，算你什么人。她想了想，答得很快：「罐底的常客。」师妹不懂。只有她自己知道——旧罐留青，青的是茶，是信，也是那年竹林听雨、没劝她一个字的人。', type: 'description' }
        ],
        finalText: '——— 结局·留青（挚友·归隐）———'
    },
    'qing_ending_覆茶': {
        id: 'qing_ending_覆茶', npcId: QING_NPC_ID, title: '结局·覆茶', icon: '🌑',
        route: '覆茶',
        scenes: [
            { speaker: 'narrator', text: '那一夜她把整罐头一茬倒进了灶膛。白烟腾起一股，满焙房的香，冲上来一次，就散了。她倒得很稳，手没有抖——炒茶的手从来不抖，倒茶也一样。', type: 'description' },
            { speaker: 'narrator', text: '空罐倒扣在灶台最高处，罐底朝天。她对着那只倒扣的罐子说了一句话，是说给自己听的：「茶给配喝的人。账给认账的人。都不配——就都收着。」', type: 'description' },
            { speaker: 'npc', text: '后来师妹问她，罐子怎么扣起来了。她翻着茶匾，头也不抬：「装过一回不该给的人。」顿了顿，又补一句，语速还是那么快，「茶没错，看茶的人也没错——错在眼。眼下回来了。」', type: 'description' },
            { speaker: 'narrator', text: '多年后你再上青城，茶园比从前更绿，她的茶在蓉城卖得更好，见你礼数周全，分毫不差——像见每一位上山买茶的客。只是焙房里那只旧罐，永远倒扣在高处，落了一层薄灰。每年头一茬出锅，她照例装罐——装的是架上新罐。旧的那只，再没有正过来过。', type: 'description' }
        ],
        finalText: '——— 结局·覆茶（辜负）———'
    },
    'qing_ending_空翠': {
        id: 'qing_ending_空翠', npcId: QING_NPC_ID, title: '结局·空翠', icon: '🌫️',
        route: '空翠',
        scenes: [
            { speaker: 'narrator', text: '后来你还是路过几次青城。后山茶园对香客开着，她见你礼数周全，报茶价，讲火候，分毫不差——像对每一个上山问茶的人。', type: 'description' },
            { speaker: 'narrator', text: '头一茬年年入罐，罐是那只旧罐，擦得比哪一年都亮。只是罐里的茶再没分出去过一份，罐底那页纸，压了一年又一年。', type: 'description' },
            { speaker: 'narrator', text: '再后来，江湖上都说青城后山有位看茶人，嘴快，手稳，茶不掺假，账不算错——掌门余沧海考校过满山弟子，独独一句没考校过她。她的茶园年年丰收，师弟个个出息，观里人说，幽师姐什么都拿得起，就是从不留人。', type: 'description' },
            { speaker: 'narrator', text: '初雪夜，她一个人在焙房炒最后一锅茶。炒完起锅，会朝山门的方向望一眼——望一眼，就收回去，收得很干净，像一页记完了的账。满山的绿年年照着她的茶园，山道上行人来来去去，空翠湿人衣——湿的谁的衣，她不说。', type: 'description' }
        ],
        finalText: '——— 结局·空翠（错过）———'
    }
};

// ============ 性别语境事件（femctx 女玩家 / mctx 男玩家，互斥） ============
var QING_GENDER_CTX_EVENTS = {
    // 女玩家：观里师姐妹的提醒
    'qing_event_femctx': {
        id: 'qing_event_femctx', npcId: QING_NPC_ID, title: '师姐妹的话', icon: '🌸',
        desc: '两个相熟的女弟子在焙房外把你叫住了。',
        minAffection: 55, trigger: { random: 0.35 }, cooldown: 0, flag: 'qing_e_femctx_done',
        requirePlayerFemale: true,
        autoTrigger: { location: '青城派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '帮完茶园的活出来，两个相熟的女弟子在焙房外的竹篱边把你叫住，左右看了看，压低声。', type: 'description' },
            { speaker: 'npc', text: '「姑娘。」年长的那个开门见山，「翠微是掌门最小的弟子，剑法不弱，偏偏窝在后山看茶——你知道为什么吗？她心里压着事。那桩事压了她快一年，满观都看得出她扛着。」' },
            { speaker: 'npc', text: '「她那个人，嘴快，话直，评起火候来六亲不认——可她把自己的事看得比一园茶还紧。如今她把那只旧茶罐都给你了。我怕你跟着她，得陪她一起扛那座山。」', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「她炒她的茶，我烧我的水——正好一灶。」', effect: 'tease', affection: 8 },
                { text: '「姊姊，我自愿的。山再重，两个人抬。」', effect: 'accept', affection: 7 },
                { text: '「你们是怕我吃亏，还是怕她破例？」', effect: 'probe', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'tease': aff = 8; msg = '两个师妹对视一眼，年长的先笑弯了腰：「……一灶？」她拍着你的手背，眼角的细纹都笑开了，「好姑娘。她那口灶一个人守了多少年，火都没旺过。你去烧水——我们师姐妹给你送柴。」'; break;
                case 'accept': aff = 7; msg = '师妹们叹了口气：「自愿的……好。」年纪小的那个从袖袋里摸出一包晒好的陈皮塞给你，「焙房守夜的人，得先润嗓子。往后她炒茶，你听她——她评火候的时候，你别往心里去，那是她的疼法。」'; break;
                case 'probe': aff = 6; msg = '年长的那个捻着竹篱上的叶子，顿了顿：「……两样都怕。」她望着焙房的方向，「她破例一回，就得拿十倍的规矩把自己捆回去。旧罐给了你，她如今炒茶比从前更凶——你舍得看她那样，就留下，好好留。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // 男玩家：巡山师兄弟的流言
    'qing_event_mctx': {
        id: 'qing_event_mctx', npcId: QING_NPC_ID, title: '山道上的嘴', icon: '🍶',
        desc: '巡山的男弟子在山道上把你拦下了。',
        minAffection: 55, trigger: { random: 0.35 }, cooldown: 0, flag: 'qing_e_mctx_done',
        requirePlayerMale: true,
        autoTrigger: { location: '青城派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '采药道上，一个胆大的巡山男弟子把你拦下，左右看了看，压低声。', type: 'description' },
            { speaker: 'npc', text: '「那位……山外来的客。」男弟子挠着头，「你跟幽师姐的事，满观传遍了。她把那只旧茶罐给了外客——前任看茶人传下来的那只。三十多年的青城，那罐没离过焙房的架顶，头一遭。」' },
            { speaker: 'npc', text: '「我不是说这不好。我是说，幽师姐那个人，跟商行谈价能把掌柜谈出满头的汗，掌门问茶她都接得住。观里的嘴她压得住——可掌门的眼睛呢？外头的嘴呢？你一个外客，受得住她这份直，护得住她这份快么？」', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「嘴归嘴。她炒她的茶，我站我的位。」', effect: 'defy', affection: 8 },
                { text: '「兄弟，我们还没到那一步。」', effect: 'deny', affection: 3 },
                { text: '「谁嚼她的舌根，先问问我这一担茶担子。」', effect: 'shield', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'defy': aff = 8; msg = '男弟子眼睛亮了：「……行！这话我原样带给幽师姐——不对，我不敢带。」他吐吐舌头跑了。可当晚焙房的灯，你看得出，比平日熄得晚——炒茶的人心情不坏，灶上的火都旺了半分。'; break;
                case 'deny': aff = 3; msg = '男弟子盯了你半晌：「……没到那一步。」他拍拍衣摆要走，又回过头来，压低声音补了一句，「那你房里那只旧茶罐算什么？罐底还压着信——满观都知道那是幽师姐的命根子，前任看茶人传下来的东西。你没到那一步，回头把罐子还她？你自己信不信这句话？」'; break;
                case 'shield': aff = 7; msg = '男弟子怔了怔，忽然咧嘴一笑：「幽师姐要是听见这句，能拿茶账损你三天——损完了，头一盏新茶还是你的。」他扛起巡山的枪往道上去，声音远远飘下来，「嚼舌根那几个，早叫她雹灾夜里那一嗓子吼软啦！」'; break;
            }
            return { affection: aff, msg: msg };
        }
    }
};

// ============ 合并进总事件池 ============
if (typeof NPC_PERSONAL_EVENTS !== 'undefined') {
    Object.assign(NPC_PERSONAL_EVENTS, QING_MAIN_EVENTS);
    Object.assign(NPC_PERSONAL_EVENTS, QING_GENDER_CTX_EVENTS);
}

// ============ 注册结局集与副作用回调 ============
if (typeof registerEndingSet === 'function') {
    registerEndingSet(QING_NPC_ID, QING_ENDINGS);
}
if (typeof registerEndingCallback === 'function') {
    registerEndingCallback(QING_NPC_ID, function(endingName, npc) {
        if (endingName === '煎雪' || endingName === '焙春') {
            if (npc && typeof npc.setFlag === 'function') npc.setFlag('dao_companion');
            if (window.showMessage) window.showMessage('🍃 你与幽翠微结为道侣！青城雪茶与茶园剑意感悟大幅提升', 'success');
        } else if (endingName === '茶信' || endingName === '留青') {
            if (npc && npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 30);
            if (window.showMessage) window.showMessage('🍃 你与幽翠微成了以茶为信的知己', 'success');
        } else if (endingName === '覆茶') {
            if (window.showMessage) window.showMessage('🫖 幽翠微把整罐头一茬倒进了灶膛。茶给配喝的人——她收着了', 'error');
        }
    });
}

// ============ 自动触发 + 每日钩子（复用 maybeAutoTriggerPersonalEvent） ============
function maybeAutoTriggerQingEvent(source) {
    return maybeAutoTriggerPersonalEvent(QING_NPC_ID, source, { finalEvents: ['qing_event_013'] });
}

if (typeof window !== 'undefined' && window.timeSystem && window.timeSystem.onNewDaySubscribe) {
    window.timeSystem.onNewDaySubscribe(function() {
        try {
            if (window.currentCharData && window.currentCharData.location === '青城派') {
                maybeAutoTriggerQingEvent('daily');
            }
            // 性别语境：每日在该派过夜 + 对应性别 + 好感≥55 + 未触发
            if (!window.currentCharData || !window.npcManager) return;
            var loc = window.currentCharData.location || '';
            if (loc !== '青城派') return;
            var npc = window.npcManager.getNPC ? window.npcManager.getNPC(QING_NPC_ID) : null;
            if (!npc) return;
            var aff = (npc.relationship && npc.relationship.affection) || 0;
            if (aff < 55) return;
            var isF = window.currentCharData.gender === 'female';
            var ctxId = isF ? 'qing_event_femctx' : 'qing_event_mctx';
            if (typeof hasEventTriggered === 'function' && hasEventTriggered(ctxId)) return;
            var ev = NPC_PERSONAL_EVENTS[ctxId];
            if (!ev) return;
            if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npc)) return;
            setTimeout(function() {
                if (document.querySelector && document.querySelector('.personal-event-modal')) return;
                if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npc)) return;
                if (typeof triggerPersonalEvent === 'function') triggerPersonalEvent(ctxId);
            }, 1200);
        } catch (e) { console.warn('[幽翠微线] 每日触发失败:', e); }
    });
}

// ============ 导出 ============
if (typeof window !== 'undefined') {
    window.QING_MAIN_EVENTS = QING_MAIN_EVENTS;
    window.QING_ENDINGS = QING_ENDINGS;
    window.maybeAutoTriggerQingEvent = maybeAutoTriggerQingEvent;
}
console.log('[幽翠微线] 青城感情线加载完成：结局 ' + Object.keys(QING_ENDINGS).length + ' 个 + 主线事件 ' + Object.keys(QING_MAIN_EVENTS).length + ' 个 + 性别语境 ' + Object.keys(QING_GENDER_CTX_EVENTS).length + ' 个');
