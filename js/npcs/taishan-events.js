// ==================== taishan-events.js - 岳清晓线情缘事件/结局/性别语境 v1.0（泰山扩线） ====================
// 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / registerEndingSet / registerEndingCallback /
//       hasEventTriggered / checkEventTrigger / triggerPersonalEvent / canPlayerAccessPersonalEvent）
//       npcs/npc-system.js（executeEmotionInteraction 已加 bond_dao 拦截）
// 加载顺序：在 npc-personal-events.js 之后
// 女主·岳清晓（泰山派掌门天门道人之孙女、玉皇顶晨光临火人。爽利明亮的山里人性子，说话直接从不绕弯，
// 爱讲光与云海。她的执念只有一个：全泰山第一缕日光归她管——她看过一千次日出，却没有一次是与人同看。
// 她要的不是有人陪看日出，是终于肯把「第一缕」分出去。天门道人为正典掌门长辈（刚直守正），共存不改设定；
// 她是年轻接班人，不越位。线是暖线：冲突来自「职责（临火/守仪）与私心」和泰山派门规，不靠虐。
// 随身物：一只竹管，藏着她的摩崖「日」字拓片——拓了十年，只有这一幅送得出手。信物是「日」字拓片。
// 男女玩家皆可追，主线共享（代词按性别），各有专属性别语境事件（femctx/mctx）。
// 已织入泰山派既有埋象：日观峰观旭/紫气东来（se_tsn_richu）、摩崖碑拓/岱庙残碑剑意总诀（se_tsn_shibi）、
// 泰山十八盘道/十八盘剑法（fx_ta_shibapan、art_ta_shibapan）、大雪封山与仪门「守山不演」批语（sect-story-arc）。

var TAI_NPC_ID = 'sect_leader_泰山派';

// ============ 主线事件（tai_event_001 ~ 011 + 终章 013） ============
var TAI_MAIN_EVENTS = {
    'tai_event_001': {
        id: 'tai_event_001', npcId: TAI_NPC_ID, title: '晨火', icon: '🌄',
        desc: '寅时十八盘，有人在玉皇顶替全泰山守着第一缕日光。',
        minAffection: 12, trigger: { random: 0.4 }, cooldown: 0, flag: 'tai_e001_done',
        autoTrigger: { timeRange: [4, 7], location: '泰山派', random: 0.45 },
        scenes: [
            { speaker: 'narrator', text: '你头一遭赶寅时的十八盘。石阶陡得像立起来的，风从南天门灌下来，灯笼光只照得亮脚下一尺。爬到一半，上头忽然落下来一个声音，又亮又脆，像有人把一捧日光提前撒进了黑地里。', type: 'description' },
            { speaker: 'npc', text: '「稳住脚——一阶一阶上！泰山的路不欺生，只欺急！」那声音带笑，「对，就这么走。你步子比香客稳，比师弟们沉，好脚力！」' },
            { speaker: 'narrator', text: '玉皇顶到了。火坛前立着一个年轻女子，绛红劲装，袖口挽得利落，手里一柄火钩拨得炭火通红。天边刚裂开一线灰白，她回头看你，眼睛比火还亮，报家门跟报菜名似的爽快。', type: 'description' },
            { speaker: 'npc', text: '「岳清晓，玉皇顶临火人。」她把火钩往肩上一扛，下巴朝东方一抬，「看见没有？全泰山第一缕日光，归我管。天门道人是我爷爷——不过在这顶上，先认火，后认人。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '照她教的节奏，一步一步稳稳登上顶，先向她一揖', effect: 'climb', affection: 8 },
                { text: '问她：「第一缕日光归你管——是怎么个管法？」', effect: 'ask', affection: 7 },
                { text: '笑一声：「官封的？管日头还有俸禄么？」', effect: 'jest', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'climb': aff = 8; msg = '你不接话，先把最后十八级走完——脚跟落实再起第二步，跟她喊的节奏分毫不差。到顶，拱手。她拿火钩杆子横过来一比，眼睛笑成两道弯月：「好！泰山剑重势更重稳，你这一手登盘，比多少耍剑的都地道。」她转身拨火，火苗「腾」地立起来，「上来，站火坛左手边，风口我挡着。第一缕日头出来，头一个照到的是火，第二个——照到你。」'; break;
                case 'ask': aff = 7; msg = '「管法？」她来了精神，火钩往地上一顿，掰着指头给你数，「寅时起火，卯时封炉，风大加炭，雾浓拨灰——日头冒头那一瞬，火得比它旺，这叫『迎旭』。误了时辰，满山的紫气东来就散了半分。」她数完，忽然凑近半步，压低声音，像告诉你一件天大的事：「一千次了，一次没误过。这顶上就我一个人知道，日头出来前一息，天是什么颜色的。」'; break;
                case 'jest': aff = 5; msg = '她一点也不恼，反而笑出声，笑声撞在石壁上弹回来：「俸禄？有！」她一本正经地扳指头，「炭钱一份，灯油一份，另加——」她顿了顿，朝东边那片正在变灰的天一指，「那一个。全泰山头一份的日光，天天发，从不拖欠。」你顺着看过去，天边恰好裂开第一道金线。她瞥你一眼：「信了吧？这俸禄，山下拿金山银山来，我不换。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'tai_event_002': {
        id: 'tai_event_002', npcId: TAI_NPC_ID, title: '云海', icon: '☁️',
        desc: '她在日观峰讲光与云海，讲得眼睛发亮。',
        minAffection: 18, trigger: { random: 0.35 }, cooldown: 0, flag: 'tai_e002_done',
        requireEventDone: 'tai_event_001',
        autoTrigger: { timeRange: [5, 7], location: '泰山派', random: 0.42 },
        scenes: [
            { speaker: 'narrator', text: '清晨的日观峰，云海齐腰。她照例寅时起身临火，礼成之后却不急着下山，蹲在峰头石上，看云。见你上来，也不问你来做什么，直接往身边一拍石头：「来得巧！今天这云海，十年里排得进前十——坐！」', type: 'description' },
            { speaker: 'npc', text: '「你看东边那道云梁。」她指给你看，话密得像开了闸，「日头先从它后头透出来，光在云里走一段，出来就是金的；要是云薄，出来就是白的。金的难得——一旬顶多两回。」她说到兴头上，整个人都在发光，「还有那个！日头跳出来那一瞬，云海从灰翻成橘，跟谁把一炉炭火泼进了棉花里似的——」', type: 'description' },
            { speaker: 'narrator', text: '她讲了足有一炷香，从晨光讲到云色，从云色讲到石缝里那株迎客松今年又歪了半寸。讲完才发觉你一直在听，耳根一红，随即又理直气壮起来。', type: 'description' },
            { speaker: 'npc', text: '「……我话是不是太多了？」她挠挠下巴，「师弟们说，我讲光的时候，跟临火时拨炭一样，停不下来。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「不多。你说的那道金梁，我方才盯着看了——确实比别处亮。」', effect: 'listen', affection: 8 },
                { text: '请她把「认云断晴」的法子细细教你，明日你来对答', effect: 'learn', affection: 7 },
                { text: '「日头天天出，云天天有，也值得你讲了十年？」', effect: 'mock', affection: -4 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'listen': aff = 8; msg = '她愣住，随即眼睛「唰」地亮了，比方才讲云海时还亮：「你看出来了？！」她一把拽住你袖子往东指，「那道梁厚薄不匀，光走里头要拐三个弯——你居然真盯着看了！」这一日她讲得比哪天都多，末了日头升高，她收住话头，认认真真打量你：「我在这峰上讲光，讲了十年，听全的你是头一个。往后清晨你若来，石头给你留半块。」'; break;
                case 'learn': aff = 7; msg = '「要学？」她跳下石头，火钩都顾不上拿，当场开课：云梁走向、风向、霜气，一样一样掰开揉碎地讲，讲完让你复述，你答错半句她就纠正，比天门道人考功课还严。第二天清晨你报出「今日金梁，云厚三分」，她挑起眉，嘴角压不住地翘：「行啊你！比我那几个师弟开窍多了——他们学三年，还在问我『师姐云为什么会动』。」'; break;
                // 真负选项：讲光与云海是她十年不变的欢喜，笑它不值，等于笑她整个人的活法
                case 'mock': aff = -4; msg = '她讲了一半的话卡在喉咙里。脸上的光一寸一寸黯下去，像金梁被云吃掉了。她站起身，拍了拍衣摆上的霜，声音还是直直的，可直得发冷：「天天出，才难得。」她朝火坛走，走了两步停住，没回头，「你看不见，不怪你。这峰上的光，往后不必分你。」好几天，你在日观峰再没听过她讲云海——师弟们说，临火人这几天拨炭拨得特别响。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'tai_event_003': {
        id: 'tai_event_003', npcId: TAI_NPC_ID, title: '竹管', icon: '🎋',
        desc: '她随身一只从不许人碰的旧竹管。',
        minAffection: 25, trigger: { random: 0.35 }, cooldown: 0, flag: 'tai_e003_done',
        requireEventDone: 'tai_event_002',
        autoTrigger: { location: '泰山派', random: 0.42 },
        scenes: [
            { speaker: 'narrator', text: '你注意到她背上总斜挂着一只旧竹管。管身被手汗磨得发亮，管口的木塞缠了三道麻线。临火时她把它解下来，放在离火最远的石龛里；下雨天，她自己披蓑衣，竹管裹了三层油布。泰山派上下没人碰过它——师弟们说，那是师姐的命。', type: 'description' },
            { speaker: 'npc', text: '这日碑林拓印，竹管从她背上滑出来半寸，她反手就按住了，动作快过拨炭。她察觉了你的目光，也不躲，索性把它横到膝上，下巴一抬：「看什么？想看就光明正大地看。」', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '不伸手，只问：「管子里装的——是拓片？」', effect: 'ask', affection: 7 },
                { text: '什么也不问，替她把油布再裹紧一层', effect: 'guard', affection: 6 },
                { text: '伸手就要去拔木塞：「藏着什么宝贝，给我瞧瞧。」', effect: 'grab', affection: -5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'ask': aff = 7; msg = '她的手在竹管上按了很久，久到碑林的风翻过了三页纸。然后她拔开木塞——头一回，当着一个外人的面。管里滑出一卷拓片，纸色沉黄，拓的是一个「日」字，圆廓里那一横拓得极亮，像真有一团光封在纸里。「摩崖上的『日』字。」她说，「我拓的。拓了十年，废了三百多张，就这一幅，拿得出手。」她把拓片卷回去，塞好，忽然补了一句：「拿得出手，不等于给得出去。它还在等人。」'; break;
                case 'guard': aff = 6; msg = '你没问。天落雨点子的时候，你把她搁在石龛边的竹管拿过来，油布又多裹了一层，麻线勒紧三道。她看着你做，一句话没有，等你裹完，她伸手把竹管接过去，掂了掂：「比我裹得严实。」顿了顿，她把竹管重新背好，背得比往常正，「碑林的雨斜，你这层油布——记你一功。」打这天起，她临火解竹管时，不再背过身去。'; break;
                // 真负选项：竹管里是她十年的心血与心事，伸手硬夺等于掀她的命门
                case 'grab': aff = -5; msg = '你的手刚碰到木塞，她的腕子先到了——临火人拨炭的手，又快又稳，扣得你虎口发麻。「我说了，想看就光明正大地看。」她一字一顿，把竹管护进怀里，眼睛瞪得溜圆，火气全摆在脸上，「没说要你上手抢！」这一日她收拓收得极早，下山时走在你前头，一句话没有。往后一个月，那只竹管缠的麻线又多了一匝——你后来才明白，她防的不是看一眼，是有人把她的十年，当成随手可翻的热闹。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'tai_event_004': {
        id: 'tai_event_004', npcId: TAI_NPC_ID, title: '封山雪', icon: '❄️',
        desc: '大雪封山，十八盘上困着下不去的香客。',
        minAffection: 32, trigger: { random: 0.3 }, cooldown: 0, flag: 'tai_e004_done',
        requireEventDone: 'tai_event_003',
        autoTrigger: { location: '泰山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '入冬头一场大雪，封了十八盘。暮色里山道上传来哭喊——三个上香的香客被困在半盘的冰阶上，上不去，下不来，风一卷，人就要从崖边滑下去。执事堂的师弟们在山门口打转：雪这么大，掌门有令封山，可山上困着人。', type: 'description' },
            { speaker: 'npc', text: '岳清晓已经在系绳了。火钩卸下来交给师弟，蓑衣一披，风灯一提：「卯时我还得回顶上临火，来回正好。」她报得干脆利落，「冰阶半盘，绳要两道，灯要三盏。我去前头探，你们结绳跟上——泰山每年都要封山，封山之前，得先有人上得去。」', type: 'description' },
            { speaker: 'narrator', text: '风把她的话撕成一片一片。雪坡黑下来了，三盏灯不够，两个人不够。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '跟她一起上：她前头探路，你在后头结绳递人', effect: 'climb', affection: 8 },
                { text: '抢过最重的风灯，走在她外侧替她挡崖边的风', effect: 'wind', affection: 7 },
                { text: '「执事堂自会处置，封山是掌门令，你添什么乱。」', effect: 'shrug', affection: -3 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'climb': aff = 8; msg = '冰阶滑得像抹了油。她前头一步一凿，你后头把绳结一个一个递上去——第三个香客拽过崖沿时，两个人齐齐跌坐在雪里。回到山门，她拍着满身雪，先冲执事堂的师弟喊：「记档！大雪封山，救回三口，一个不少！」喊完转头看你，眉毛上还挂着冰碴，笑得见牙不见眼：「你打的那个双套结，比我师弟利索。往后封山救人——算你一个。」'; break;
                case 'wind': aff = 7; msg = '你提了最重的那盏灯，走在她崖边那一侧。风一阵一阵往灯罩里灌，你就用身子挡，半边肩膀湿透结冰。人救回来时，她的灯苗竟一路没歪过。下山她盯着你看了一路，忽然说：「临火十年，我知道一个理——火要旺，先得有人挡风。」她把那盏灯塞给你，「这盏归你了。灯是你护下来的，它认你。」'; break;
                // 真负选项：她把守山看得比命重，「添乱」二字，正是当年仪门批语「守山不演」要堵回去的那类嘴
                case 'shrug': aff = -3; msg = '她系绳的手停了。回头看你，眼神比冰阶还冷：「添乱？」她把这两个字嚼了一遍，转身就走，蓑衣一摆，扫了你一脸雪。人是她和师弟们救回来的，卯时的火也没误——只是回山那晚，她在执事堂记档时，一个字没提你。后来你才知道，朝廷封禅那年，仪门上刻过一句「守山的兵，不演戏」——她说，山门里头，最不该有人朝救火的人喊「添乱」。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'tai_event_005': {
        id: 'tai_event_005', npcId: TAI_NPC_ID, title: '碑林十年', icon: '🪨',
        desc: '岱庙碑林，她给你看她拓了十年的「日」字。',
        minAffection: 40, trigger: { random: 0.3 }, cooldown: 0, flag: 'tai_e005_done',
        requireEventDone: 'tai_event_004',
        autoTrigger: { location: '泰山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '雨后初晴，她把你叫进岱庙碑林。林子里碑碣林立，多是前贤墨宝，最深处一块残碑半埋土中——碑文是泰山剑意总诀，「重如岳」三字力透石背。她在残碑前铺开毡子，摆出棕刷、拓包、白芨水，一样一样码得极齐。', type: 'description' },
            { speaker: 'npc', text: '「看好了。」她上纸、濡湿、捶打，棕刷扫过，纸陷进每一道笔痕里，「拓片这个东西，骗不了人。手上有多少力，心里有多少静，纸上一目了然。」她拓得极慢，「我从十二岁拓到今年，拓了十年。别的字都拓得出手了——」她顿了顿，「就那个『日』字，拓了三百多张，只成了一张。」', type: 'description' },
            { speaker: 'narrator', text: '她从竹管里取出那幅拓片，在残碑旁展开。晨光斜进碑林，落在那个「日」字上——圆廓里那一横，墨色四周深、中间亮，像纸里真封着一轮初升的日头。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「总诀残碑缺的碑角，我替你去后山崖壁上找石色对得上的老石。」', effect: 'stone', affection: 7, item: 'spirit_stone' },
                { text: '铺纸研墨，安安静静陪她拓完这一幅', effect: 'copy', affection: 8 },
                { text: '「三百多张里就成了一张——那一张，你想给谁？」', effect: 'ask', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '', item = null;
            switch (choice) {
                case 'stone': aff = 7; item = { id: 'spirit_stone', count: 2 }; msg = '她报出崖壁的方位、石色、纹路，一字不多。你上后山三日，回来时两手石粉，怀里揣着两块从崖缝里凿下的老石，另捎回两块成色极好的灵石——石色与残碑断口分毫不差。她接过灵石对光翻看，又惊又喜：「这成色！压拓毡正好！」她把灵石收进拓匣最里层，提笔在记档上写：「碑角石已寻得，灵石二枚，出外客之手。」——「外客」两个字，她想了想，描了描，描得很轻。'; break;
                case 'copy': aff = 8; msg = '你铺纸，她教你拓法——先上水，后上纸，捶打要「雨点细，不许牛毛粗」，墨要「浓淡九层，一层一层上，急不得」。两人伏碑拓到日头升高。她吹了吹纸面的浮墨，忽然说：「十年了，碑林里拓印的，只有我一双手。」第二天，你那半幅歪歪扭扭的试拓被她订进了拓册，页脚并排两个名字，一个大，一个小——小的那个，写得格外工整。'; break;
                case 'ask': aff = 6; msg = '她拓包停在半空。碑林里静得能听见纸干的声音。她盯着那个「日」字看了很久，脸上那点亮藏不住了，一路红到耳根：「给谁……」她把拓片卷起来，卷得极慢，塞回竹管，木塞按实，才直起腰，「等人。」她下巴一抬，还是那副理直气壮的样子，「泰山顶上的规矩——第一缕日头，不轻给人。拓片也一样。」可她那只竹管，从这天起，麻线松了一匝。'; break;
            }
            return { affection: aff, msg: msg, item: item };
        }
    },
    'tai_event_006': {
        id: 'tai_event_006', npcId: TAI_NPC_ID, title: '一千次日出', icon: '🔥',
        desc: '火坛边，她讲起那一千次没有同伴的日出。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'tai_e006_done',
        requireEventDone: 'tai_event_005',
        autoTrigger: { timeRange: [5, 7], location: '泰山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '这日临火礼成，她没像往常那样急着收炭。她坐在火坛边的石沿上，火钩横在膝头，望着东边烧透了的云海，忽然开口，话比哪一天都直。', type: 'description' },
            { speaker: 'npc', text: '「我算过。」她说，「打十二岁跟我爷爷上顶，到今天，一千零一夜。我在玉皇顶看了一千次日出——没有一次，是跟人一起看的。」她拨了一下炭，火星子跳起来，映在她眼睛里，「门规写得明白：临火人迎第一缕日光，须独对。火坛前多站一个人，仪就杂了。」' },
            { speaker: 'npc', text: '「我爷爷说，第一缕是礼，不是情。归临火人管，不归临火人看。」她笑了一下，笑得比平时小，「我不吵也不闹，我管了一千次，一次没误。可是——」她抬起头，眼睛亮得吓人，「可是我想把第一缕分出去。就一次。分给谁，我还没想好——不对，」她盯住你，「我想了很久了。」' },
            { speaker: 'player_select', text: '你如何回应？（这一桩，没有对错，只有听法）', options: [
                { text: '「往后每一回临火，火坛左手边那个位置，留给我。」', effect: 'vow', affection: 9 },
                { text: '什么都不说，陪她把这一炉炭火看到熄', effect: 'stay', affection: 8 },
                { text: '「第一缕是礼——可礼是人守出来的。守了一千次的人，配分它。」', effect: 'echo', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'vow': aff = 9; msg = '她猛地转头看你，火钩从膝上滑下去，「哐」地磕在石沿上，她顾不上捡。「留给你……」她把这三个字重复了一遍，声音忽然小了，跟方才讲一千次日出的爽利判若两人。半晌，她弯腰捡起火钩，重新扛回肩上，站直，下巴一抬——又是那个理直气壮的临火人了：「好！说话算话！卯时的风冷，你自己备厚衣裳——位置，我给你留着。」'; break;
                case 'stay': aff = 8; msg = '你没说话。炭火一寸一寸暗下去，云海一层一层红上来，她手里的火钩转了一圈又一圈。火熄尽时她起身，拍拍衣摆，忽然说：「一千次里头，就今天这炉，我坐着看完的。」她看了你一眼，眼睛弯弯的，「一个人看火，是差事。两个人看火——」她没说下去，把火钩递给你，「替我送回龛里。往后这差事，分你一半。」'; break;
                case 'echo': aff = 7; msg = '她浑身一震，像被火星子燎了一下。她盯着你，看了很久很久，眼眶慢慢红了，嘴角却往上翘，红和亮在她脸上打了个照面，谁也没打赢谁。「配分它……」她吸了吸鼻子，扭头朝东边那轮已经完全跳出来的日头，扬声说了一句没头没尾的话：「听见没有——」回过头，耳根通红，声音却稳，「这句话，我要拓下来。拓在下一张『日』字旁边。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'tai_event_007': {
        id: 'tai_event_007', npcId: TAI_NPC_ID, title: '续火', icon: '🌬️',
        desc: '冬至大典前夜，山风掀了火坛，晨火将熄。',
        minAffection: 55, trigger: { random: 0.3 }, cooldown: 0, flag: 'tai_e007_done',
        requireEventDone: 'tai_event_006',
        autoTrigger: { timeRange: [21, 3], location: '泰山派', random: 0.42 },
        scenes: [
            { speaker: 'narrator', text: '冬至前夜，泰山上要行一年一度最重的续火大典：寅时迎旭，新火续旧火，火旺则来年满山紫气东来。偏偏半夜起了罡风，一阵狂风掀翻火坛的挡风口，炭火被打散在石台上，火星子滚了一地——寅时之前火种续不上，大典就要开天窗。', type: 'description' },
            { speaker: 'npc', text: '岳清晓已经跪在火坛前了。蓑衣都没披，两手拢着最后一点火种，报得又快又稳：「火种还剩三枚，炭湿了七成。风从西北口灌，得有人堵风口，得有人焙干炭——寅时前，两样都得成。」', type: 'description' },
            { speaker: 'narrator', text: '西北口正对着罡风，堵上去的人要被吹一整夜；湿炭焙干，要在火种边守一整夜。两个人，两件事，缺一不可。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「炭交给我。」你脱下外袍罩住炭堆，蹲在火种边焙了一夜', effect: 'coal', affection: 11 },
                { text: '抢去西北风口，用身子堵住灌风的缺口，替她护住火种', effect: 'gap', affection: 8 },
                { text: '敲起铜哨，唤聚守夜师弟，众人轮班守风焙炭', effect: 'rally', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'coal': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 11) : { ok: true };
                    if (!_py.ok) { aff = 4; msg = '你脱下外袍就要罩炭，连日奔走的身子却先晃了一晃，眼前发黑——她一把扶住你，把自己的蓑衣剥下来罩上炭堆，眉头拧死：「守火先倒一个，你学的谁的？」她自己蹲下去焙了一夜，寅时火续上了。收炭时她往你手里塞了个滚烫的炭炉：「抱着。焙炭的人先烤暖了，火才认人。」话说得硬，手一直没松。（精力不足，那一夜你先撑不住了）'; break; }
                    aff = 11; msg = ('外袍罩下去，你蹲在火种边，一寸一寸翻炭。夜里的湿气从石缝往上爬，你的膝盖先麻，指头再僵，火种在掌风里明明灭灭，你连大气都不敢喘。寅时初刻，最后一块炭焙透了，她拢着火种凑上来——「腾」的一声，新火续上旧火，火苗立得笔直，满坛通红。大典礼成，天门道人亲口赞了一个「旺」字。人群散了，她拉着你看自己燎起两个泡的掌心，又看你的，笑得眼睛发亮：「一样！这算不算——同心火？」') + '（精力-11）'; break; }
                case 'gap': aff = 8; msg = '你抢进西北口，背对罡风蹲下去，风像刀子一样从你脊背上刮过去，一整夜。火种在她掌心里保住了，炭焙干了，寅时火续上了。天亮她来换你，你整个人冻成了一弯弓，她盯着你看了三息，忽然解下自己颈上的红绳，绳上一枚小小的火漆牌，塞进你领口：「临火人的护身牌。堵过风口的人，戴得起。」'; break;
                case 'rally': aff = 7; msg = '铜哨一响，守夜的师弟们提着灯笼上来，八个，十个——风口轮班堵，炭堆轮班焙。寅时火续上时，满坛的火光映着一圈冻得嘶哈嘶哈的笑脸。她在执事堂记档：「冬至续火，罡风掀坛，合力正之。」记完，在你的名字后头添了一行小注：「哨聚之法，此人想的。」——临火人的档，向来只记火。这一夜，破例记了人。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'tai_event_008': {
        id: 'tai_event_008', npcId: TAI_NPC_ID, title: '长夜送火', icon: '🏮',
        desc: '风雪夜，正路断了，火种必须在寅时前送上玉皇顶。',
        minAffection: 62, trigger: { random: 0.3 }, cooldown: 0, flag: 'tai_e008_done',
        requireEventDone: 'tai_event_007',
        autoTrigger: { timeRange: [21, 3], location: '泰山派', random: 0.42 },
        scenes: [
            { speaker: 'narrator', text: '腊月廿三，祭山仪。火种照例由岱庙请出，寅时前送上玉皇顶。偏偏半夜风雪压塌了十八盘正道的护栏，索道封死，正路断了——火种在半盘的石亭里困着，风灯的火苗被穿堂风压得只剩一豆，再迟一刻，灯熄，火种绝，一年祭山仪就此作废。', type: 'description' },
            { speaker: 'npc', text: '岳清晓提着那盏风灯站在石亭口，雪片子糊了她满头满脸。「野路能走。」她语速极快，却字字清楚，「鹰嘴崖那一线，背着风，雪薄。就是窄——一人宽，左边是崖。」她把风灯举到胸前，用蓑衣裹了三层，「灯在我怀里。走。」', type: 'description' },
            { speaker: 'narrator', text: '鹰嘴崖的黑影在风雪里时隐时现。窄径覆雪，一步踏空就是万丈。她的灯护在怀里，两只手只剩一只手能扶崖。', type: 'description' },
            { speaker: 'player_select', text: '你必须立刻做点什么。', options: [
                { text: '走在她外侧，一手扶崖，一手揽住她的绳，用身子替灯挡雪', effect: 'shield', affection: 12 },
                { text: '抢在头里趟雪，一步一探，替她踩实每一块落脚的石', effect: 'lead', affection: 9 },
                { text: '沿崖线插灯为记，唤后队师弟们接力传火护灯', effect: 'relay', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'shield': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 12) : { ok: true };
                    if (!_py.ok) { aff = 5; msg = '你抢到她外侧，连日守火的身子却先晃了晃，一脚踩虚——是她反手拽住你的绳，把你按回崖壁，自己的蓑衣又剥下一层裹住你的肩。「护灯的人，先护好自己。」她声音哑得厉害，「灯我抱得住，你摔下去，我一个人上不去。」后半程她走里，你走外，两个人的绳拴在一起。寅时前两刻，灯进了玉皇顶。（精力不足，那一夜你先撑不住了）'; break; }
                    aff = 12; msg = ('鹰嘴崖窄得只容一人。你走外侧，左半边身子悬在风雪里，一手抠着崖缝，一手攥紧她腰间的绳。风一阵一阵往灯罩里扑，你就把脊背弓过去挡——雪在你背上积了半寸厚。她怀里那豆火苗，一路没有矮下去。寅时前两刻，玉皇顶的火坛迎进了火种，「腾」地立起来，满顶通红。她瘫坐在火坛边，先查灯，再查你，从头到脚点了一遍，点完忽然凑近，把你背上那半寸雪拍掉，声音低低的：「一千次临火，头一回——火是从别人背上护过来的。」') + '（精力-12）'; break; }
                case 'lead': aff = 9; msg = '你抢在头里，一步一探，雪底下是石是空，你用脚跟试出来再让她踩。三十丈鹰嘴崖，你试了三百多脚，靴子灌满了雪。到顶时她收灯，头一件事是把你的靴子夺过去倒雪，一边倒一边数落：「趟雪哪有趟出半腿冰的！」数落完，她抬头看你，眼睛比灯亮：「祭山仪的档上，我记一笔——引路人，一个。名字，头一个写。」'; break;
                case 'relay': aff = 6; msg = '你把随身的灯笼拆开，火纸分作八份，沿崖线一处一处插下去，唤后队师弟们接力护灯——八盏小灯在风雪里连成一线，像谁把一段星河钉在了崖上。火种进顶时，仪没有误。她立在火坛前看了那条灯线很久，忽然说：「临火十年，我以为护火靠的是我这一双手。」她转头看你，「今晚这条线告诉我——护火靠的是一条心。」祭山仪的档上，灯线单独记了一行。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'tai_event_009': {
        id: 'tai_event_009', npcId: TAI_NPC_ID, title: '日字拓片', icon: '📜',
        desc: '她把竹管里那幅拓了十年的「日」字，放进你手里。',
        minAffection: 68, trigger: { random: 0.3 }, cooldown: 0, flag: 'tai_e009_done',
        requireEventDone: 'tai_event_008',
        autoTrigger: { timeRange: [5, 7], location: '泰山派', random: 0.42 },
        scenes: [
            { speaker: 'narrator', text: '临火礼成，晨光正好。她把你留在玉皇顶，从背上解下那只竹管——缠了三道麻线的木塞，她一道一道拆开来，动作很慢，很稳，像在封一炉不许错的火。', type: 'description' },
            { speaker: 'npc', text: '「拓片，给你。」她把那幅「日」字展开在你面前，替你把手指一根一根按上纸边，「拓了十年，废了三百多张，就这一幅送得出手。」她的声音又快又亮，跟报时辰似的，可耳根红透了，「拿稳。纸里封着泰山一千个早晨的头一缕光——见了它，就是见了我。」' },
            { speaker: 'npc', text: '「门规说，第一缕不轻给人。」她收回手，背在身后，站得笔直，像在向谁交代，又像在向自己交代，「拓片不是第一缕。可它拓的是第一缕。它给谁——我说了算。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '双手接过，就着晨光把拓片举到眼前，认认真真看那一横里的光', effect: 'take', affection: 14 },
                { text: '「拓片我收着。可你临火的手，往后不许再空着等卯时。」', effect: 'vow', affection: 9 },
                { text: '看着她，问：「为什么是我？」', effect: 'ask', affection: 8 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'take': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 14) : { ok: true };
                    if (!_py.ok) { aff = 6; msg = '你伸手接拓片，连日奔走的身子乏得指尖发颤，纸角差点脱手——她先一步拢住，把拓片连同你的手一起按进她掌心。「拿稳。」她低着头说，声音闷闷的，「这张纸，我拿了十年，才拿稳。」那天的晨光很好。你下顶时，竹管已经斜背在了你身上，麻线是新缠的，缠得比她自己的还密。（精力不足，那一晨你乏得厉害，竹管是她替你背好的）'; break; }
                    aff = 14; msg = ('你双手接过，就着初升的晨光把拓片举起来——光透过纸背，那个「日」字亮起来，圆廓里那一横像一炉真火，一千个早晨的头一缕光，齐齐在你掌心的纸上烧。你看得眼睛发酸，她站在旁边，比你还紧张，火钩都不知道往哪儿搁：「怎么样？亮不亮？我跟你说，这一横我拓了七层墨，第七层是卯时三刻上的光最好——」她絮絮地讲，讲着讲着声音低下去，「十年，三百多张……就它成了。就它，我舍得给。」') + '（精力-14）'; break; }
                case 'vow': aff = 9; msg = '她按着你手指的手紧了一下。「不空着等……」她把这四个字嚼了一遍，忽然扭头朝东边大声说：「听见没有！往后卯时的风，两个人挡！」说完了自己先愣住，耳根红到脖子，赶紧找补，「……我的意思是，火坛边风大，多个人多件衣裳。」打这天起，玉皇顶的师弟们发现，临火人收炭收得快了，下山下得也快了——快到像在赶一个什么约。'; break;
                case 'ask': aff = 8; msg = '她没有立刻答。她转身掰着指头给你数：「封山雪那晚，有人结绳；碑林里，有人陪拓；冬至夜，有人焙炭；腊月廿三，有人拿背护灯。」数完，她把手一收，攥成拳，抵在胸口，理直气壮：「门规说第一缕不轻给。可没说——不许我记人。」她瞪你，眼睛亮得晃眼，「账都在这儿了。为什么是你，你自己算！」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'tai_event_010': {
        id: 'tai_event_010', npcId: TAI_NPC_ID, title: '天门考校', icon: '🧓',
        desc: '掌门天门道人亲临火坛，一句话问到你头上。',
        minAffection: 72, trigger: { random: 0.3 }, cooldown: 0, flag: 'tai_e010_done',
        requireEventDone: 'tai_event_009',
        autoTrigger: { location: '泰山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '天门道人上玉皇顶了。老掌门须发半白，腰背笔直，一身掌门法袍被山顶的风吹得猎猎作响。他不看人，先看火——火坛、炭色、风口、档册，一样一样验过去，验完，目光才落到你身上。满顶弟子屏息。', type: 'description' },
            { speaker: 'narrator', text: '老人开口，声音不高，字字像錾在碑上：「临火人之职，独迎第一缕，是泰山三百年的仪。」他看着你，「你说——玉皇顶的第一缕日光，是礼的，还是人的？」', type: 'description' },
            { speaker: 'npc', text: '岳清晓一步跨到你身前，背脊绷得笔直，火钩横在手里，声音发紧：「爷爷。仪是弟子一个人守的，与外客无干——」', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '对天门道人一揖：「礼是人守出来的。守了一千次的人，心比礼先亮。」', effect: 'answer', affection: 8 },
                { text: '取出那幅「日」字拓片，双手呈上：「请掌门看纸里封的光——礼在纸上，人在纸外。」', effect: 'rubbing', affection: 7 },
                { text: '与她并肩而立：「弟子斗胆——仪门刻着『守山的兵不演戏』。守山的人心里有没有火，掌门比我们清楚。」', effect: 'side', affection: 11 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'answer': aff = 8; msg = '老人盯着你看了半晌，白眉一动，忽然朗声笑了，笑声撞得火坛火星子直跳：「三百年，上这顶来的人，没有不先跟我论『礼』字的。」他转身看火，「礼在火里烧了三百年，烧火的人心里有没有光，火知道。」他回头对岳清晓说：「晓儿，你的火，比十年前旺。旺在哪儿——你自己心里有数。」满顶寂静里，她绷直的背，慢慢松了。'; break;
                case 'rubbing': aff = 7; msg = '天门道人展开那幅拓片，就着晨光看了很久很久。风把纸角掀起来，他抬手按住，指尖在那一横上停了停。「岱庙残碑，老夫年轻时也拓过。」他声音放缓了，「拓了三年，没成过一张。」他把拓片卷好，双手还给她——还给她，不是还给你，「十年磨一纸。这纸上的光不是拓来的，是守出来的。」他下顶前只留了一句：「仪，老夫不动。火坛边的位置——你自己定。」'; break;
                case 'side': aff = 11; msg = '你上前一步，与她并肩。她的手臂绷得像拉满的弓，攥火钩的指节发白，可你肩头挨上去的那一瞬，她的火钩悄悄往你这边斜了半寸。天门道人看看你，又看看她，刚直了一辈子的脸上，忽然有了一点极难得的笑意：「好。」他抬手，把火坛边的档册推到案心，「仪门的批语是老夫年轻时看着刻上去的。守山的人——」他一字一顿，「心里有火，山就有火。」老人下顶时，案上留下四个字：「顶，交给你们。」事后她攥着那四个字的手直抖，嘴上还硬：「我爷爷八十年……没把顶许给过谁。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'tai_event_011': {
        id: 'tai_event_011', npcId: TAI_NPC_ID, title: '冰盘道', icon: '⛏️',
        desc: '腊月最冷的长夜，祖孙两个香客冻倒在冰阶上。',
        minAffection: 78, trigger: { random: 0.3 }, cooldown: 0, flag: 'tai_e011_done',
        requireEventDone: 'tai_event_010',
        autoTrigger: { timeRange: [22, 3], location: '泰山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '腊月最冷的长夜。十八盘中段结了整面冰壳，山道上忽然传来微弱的呼救——一对上山还愿的祖孙被冰困在半盘，老人把孙子抱在怀里，两个人的眉毛都冻白了。再有一夜，人就冻僵在冰阶上。而寅时，玉皇顶还有大祭的续火等着临火人。', type: 'description' },
            { speaker: 'npc', text: '岳清晓已在盘道口：短打、绳索、火漆牌、两盏风灯，报得干脆利落：「冰壳三十丈，人在半盘，夜风七级。寅时前我须回顶续火——救人和守仪，中间只隔一个时辰。」她把绳往腰上一系，「都赶得上。前提是，快。」', type: 'description' },
            { speaker: 'player_select', text: '你必须立刻做点什么。', options: [
                { text: '随她上冰：她凿阶，你递绳打桩，两个人一段一段往上接', effect: 'rope', affection: 14 },
                { text: '先一步攀上冰壳，用自己的身子贴住老人，替祖孙俩焐住最后一口气', effect: 'warm', affection: 15 },
                { text: '守住盘道口，把风灯尽数点亮，召执事堂众人结绳接应', effect: 'lamp', affection: 10 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'rope': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 14) : { ok: true };
                    if (!_py.ok) { aff = 6; msg = '你追上冰壳，手脚乏透了，凿了两阶就滑下去半丈——是她把绳往你腰上一勒，将你拽回稳处。「守仪的人不许倒。」她声音哑的，把自己那盏风灯挂上你的桩，「灯给你，桩给我。」后半程她凿阶，你打桩递绳，祖孙两个是一段一段接下来的。回到盘道口，她先查你的手，再查老人的脉，查完才顾上自己——她两只掌心全是冰碴子划的口子。（精力不足，那一夜你先撑不住了）'; break; }
                    aff = 14; msg = ('冰壳像一面立起来的镜子。她前头一凿一阶，你后头一桩一绳——夜风七级，吹得人贴在冰面上像两枚钉子。三十丈冰壳，凿到第十九丈时她的手已经不听使唤，你把绳从自己腰上解下来系上她的腰：「这一段，我拉你。」老人和孩子拽过盘道口时，天边刚裂开一线灰白。她背着孩子冲在前头，你扶着老人殿后，寅时前两刻踏进玉皇顶——新火续上那一刻，她腾出一只冻僵的手，指了指东方：「看！赶上啦！一千零一次——头一回带着人赶上！」') + '（精力-14）'; break; }
                case 'warm': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 20) : { ok: true };
                    if (!_py.ok) { aff = 8; msg = '你抢先攀上冰壳，第二个风头就把你掀翻在冰面上，眼前发黑——是她弃了凿子爬上来拽住你，祖孙两个由闻灯赶来的执事堂师弟们接力接应下去。两个人被拖回盘道口，谁也没站住，靠着石碑在风里对喘。她先开口，牙关还在打架：「……焐不住的夜，不许硬焐。临火第一课。」话是训，手却一直扣着你的腕，扣得死紧，没有松过。（精力不足，那一刻你先撑不住了）'; break; }
                    aff = 15; msg = ('你先一步攀上冰壳，摸到祖孙身边——老人的怀已经焐不开孩子的脸了。你解下自己的大氅裹住两个人，整个身子贴上去，用胸口焐老人的后背，一下，一下，像她拨炭那样稳。头顶上她把绳一段一段放下来，每接住一个人报一声数：「孩子！」「老人！」你在最后，是她趴在冰沿上死死扣住你的腕拽上去的——那一下的力道比绳还硬。回顶续火时，新火「腾」地立起来，她瘫坐在火坛边，忽然伸手把你的手抓过去，塞进火坛边的暖龛里，一句话没说，塞了很久。档册上她记：「冰盘道，救二口，加一。」') + '（精力-20）'; break; }
                case 'lamp': aff = 10; msg = '你守住盘道口，把随身的、值夜的、龛里的风灯一盏一盏全点起来，又敲铜哨召来执事堂众人——三十丈冰盘道亮成一条灯河，绳结一站一站传上去。祖孙两个接下来时，天边已经泛灰。她冲回玉皇顶续火，寅时分秒没误。礼成后她提着灯下顶，头一件事是清点盘道口的灯：「四十一盏，一盏没灭。」她把这盏盏灯记进档：「长夜救急，灯河彻夜，仪与人两全。」记完瞥你一眼，「守灯的人，档上记下了。」——临火人的档不记人。这一夜，又破例了。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'tai_event_013': {
        id: 'tai_event_013', npcId: TAI_NPC_ID, title: '终章·第一缕', icon: '🌅',
        desc: '第一千零一次日出之前，她在火坛边等你一句话。',
        minAffection: 85, trigger: { random: 1.0 }, cooldown: 0, flag: 'tai_e013_done',
        requireEventDone: 'tai_event_011',
        autoTrigger: { timeRange: [4, 6], location: '泰山派', random: 1.0 },
        endingMap: { '同晖': 'tai_ending_同晖', '守晨': 'tai_ending_守晨', '岁晴': 'tai_ending_岁晴', '纸晖': 'tai_ending_纸晖', '烬晓': 'tai_ending_烬晓', '独晖': 'tai_ending_独晖' },
        scenes: [
            { speaker: 'narrator', text: '开春，天象极好——钦天监的旧历说，明日卯时，泰山将有十年不遇的大旭：云海齐腰，金梁横空，第一缕日光会把整面玉皇顶烧成赤金。满山弟子都在传，明日观旭，十年一遇。', type: 'description' },
            { speaker: 'npc', text: '寅时，火坛边。岳清晓已经把炭拨好了，新火压着，只等卯时迎旭。她今晚话很少——少得不像她。她扛着火钩，在火坛前来回走了三趟，终于站定，直截了当地开口：「明日，是我第一千零一次临火。」', type: 'description' },
            { speaker: 'npc', text: '「门规说，临火人独迎第一缕。爷爷说，第一缕是礼，不是情。」她盯着火，声音又快又亮，跟往常一模一样，可攥火钩的手背上，筋都绷起来了，「一千次，我都一个人接的。明日这一次——」她猛地转过头，眼睛在火光里亮得吓人，「我不想再接一个人的了。」' },
            { speaker: 'narrator', text: '天边还黑着。火坛的火苗一跳一跳。她站在你面前，站得笔直，像迎一千次日出那样迎着你的眼睛——这一步迈不迈得出去，就在你一句话之间。', type: 'description' },
            { speaker: 'npc', text: '「{playerName}。」她下巴一抬，声音放得又稳又直，「第一缕日头出来那一瞬，全泰山就我一个位置是空的——火坛左手边。明日卯时，它归谁，你说。」' },
            { speaker: 'player_select', text: '你的选择将决定你们的关系走向', options: [
                { text: '「跟我走。带上当年那幅『日』字——五岳四海，日出在哪座山头，我们临到哪座山头。」', effect: 'lover_travel', affection: 30 },
                { text: '「留在玉皇顶。临火人的档上添一笔——火坛左手边那个位置，往后天天是我。」', effect: 'lover_stay', affection: 28 },
                { text: '「火你照临。给我立个岁约——每年开春头一个大旭日，第一缕分我一半。」', effect: 'friend', affection: 20 },
                { text: '「给我在碑林留个常客的位子。我年年寄拓纸来——你拓的光，压进我的信里。」', effect: 'friend_stay', affection: 18 },
                { text: '「明日是大祭。我只是上山观旭的过客——火坛边，不该站外人。」', effect: 'none', affection: 0 }
            ]}
        ],
        effects: function(npc, choice) {
            // 三度伤透即寒心：辜负独立成结局「烬晓」，与「独晖」（错过）分账
            var negCount = (window._negativeChoiceCount && window._negativeChoiceCount[TAI_NPC_ID]) || 0;
            if (negCount >= 3 && (choice === 'lover_travel' || choice === 'lover_stay')) {
                return { affection: 0, msg: '她盯着你，盯了很久很久。然后她笑了——笑得比哭还直白：「分给你？好啊。」她转身从竹管里抽出那幅「日」字拓片，当着你的面，走到火坛前，把它送进了炭火里。纸卷着火苗蜷起来，那个「日」字亮了一瞬，一千个早晨的光在火里烧成一点白，没了。「拓了十年，我当你看得懂。」她的声音还是又快又亮，亮得没有一丝波澜，「你看不懂。跟那一晚笑云海的人，从头到尾是一个人。」卯时，第一缕日光爬上玉皇顶。她背对着日出，背对着你，收炭、封炉、记档，一样一样做完，档册上写：「一千零一次，独迎。」从此她临火，再没有朝山道口看过一眼。', ending: '烬晓' };
            }
            switch (choice) {
                case 'lover_travel': return { affection: 30, msg: '她愣住了。火钩「哐当」一声掉在石台上，她没捡。「走……」她把这个字重复了一遍，忽然弯腰捡起火钩，转身冲着山下的云海张开两条胳膊，声音亮得整座玉皇顶都在回响：「五岳四海！你知道有多少座山头有多少种日出么？！衡山的日头从云里钻，峨眉的日头带佛光，海上那个——我还没见过海上的！」她回过头，眼睛弯成两道金梁，「档册交给师弟，门规我去求爷爷。第一缕——」她一步跨过来，攥住你的手腕，攥得死紧，「从明日起，走到哪儿，分到哪儿！」', ending: '同晖' };
                case 'lover_stay': return { affection: 28, msg: '她盯着你，胸口起伏了两下，忽然一巴掌拍在火坛的石沿上，火星子跳起老高：「好！！」这一声答应得又脆又响，惊得崖边宿鸟扑棱棱飞了一片。她转身就翻档册，笔蘸得饱饱的，当着你面往「临火人」那一栏底下添了一行新字，一边写一边念：「火坛左手边，常设一位——」写完，她把档册「啪」地合上，塞进你怀里，耳根红透，下巴还抬着，「拿去。明日起，这一笔，天天点卯。」', ending: '守晨' };
                case 'friend': return { affection: 20, msg: '「岁约？」她眨眨眼，随即咧开嘴笑了，笑得毫不矜持，「好啊！每年开春头一个大旭日——」她掰着指头当场立约，语速快得像报时辰，「你上山，我留位；云海齐腰，金梁横空；你带酒我带炭，看完日出拓一张当年的『日』字，一人一半！」她伸出小指头勾住你的，用力一晃，「拉钩。泰山顶上的约，日头作证——误了约的，罚拓一百张废片！」', ending: '岁晴' };
                case 'friend_stay': return { affection: 18, msg: '「常客的位子？」她把档册翻到末页，想了想，提笔写下几行——碑林的位置、拓纸的规格、寄信的时节、哪个月的雨斜要多加一层油布，一笔一笔写得比记火还细，撕下来递给你：「碑林收信，岱庙后檐第三格。你寄拓纸来，我拓光了压回去——」她顿了顿，理直气壮地补完，「一来一往，纸上是光，信里是人。泰山顶上的邮驿误不了，误了我下山去追。」那一年起，岱庙碑林的拓册里，年年压着几页山下来的信，信纸带着墨香，一页都没有潮过。', ending: '纸晖' };
                case 'none': return { affection: 0, msg: '她攥火钩的手，在半空停了很久很久。然后她转过身去，面朝火坛，把明日大典的炭一样一样码好，压火、封口、记档，做得又稳又快，跟一千次里的每一次一模一样：「明日卯时，大祭，观旭。」档册合上，她没有回头，「香客的位置在日观峰，石阶往东三百级。火坛边风大——过客，早些下山。」第二天，十年不遇的大旭烧红了整面玉皇顶。她一个人立在火坛前迎了第一缕，迎得笔直。满山的人都在看日出，没有人看见临火人那一天把炭拨得格外亮。', ending: '独晖' };
            }
            return { affection: 0, msg: '' };
        }
    }
};

// ============ 岳清晓结局演出（6 个） ============
var TAI_ENDINGS = {
    'tai_ending_同晖': {
        id: 'tai_ending_同晖', npcId: TAI_NPC_ID, title: '结局·同晖', icon: '🌅',
        route: '同晖',
        scenes: [
            { speaker: 'narrator', text: '三日后，岳清晓把火坛的档册、炭谱、迎旭的时辰表，一样一样交接给师门选定的新临火人。天门道人在玉皇顶立了半宿，第二天只留下一句话：「火种带一缕下山去——泰山的光，也该出去照照别的山。」她随身只带了那只竹管，管里是新拓的一幅「日」字，墨迹还没干透。', type: 'description' },
            { speaker: 'npc', text: '「五岳四海，我数过了——能看日出的山头，一百三十七座。」她与你并肩立在山道口，晨光把两个人的影子钉在石阶上，「一座一座临过去。你在，第一缕就分你一半——不，」她想了想，改口改得理直气壮，「一半太抠。全给你我也乐意。」' },
            { speaker: 'narrator', text: '多年后，江湖上有个说法：有一对游方的道侣，专挑名山看日出。女的随身一只旧竹管，逢着好日头就拓一张「日」字，拓技极高，纸里像真封着光；拓完必在页脚记一行小字——某山某日，晴，同看者一人。', type: 'description' },
            { speaker: 'narrator', text: '有人问她拓到什么为止。她扛着行李想了想，答得又快又亮：「拓到走不动为止！」{playerTa}在边上补了半句：「走不动了，就回泰山。」她用力点头，点完又补一句：「回泰山，也得赶卯时的火！」', type: 'description' }
        ],
        finalText: '——— 结局·同晖（道侣·同行）———'
    },
    'tai_ending_守晨': {
        id: 'tai_ending_守晨', npcId: TAI_NPC_ID, title: '结局·守晨', icon: '🔥',
        route: '守晨',
        scenes: [
            { speaker: 'narrator', text: '你留在了玉皇顶。临火人的档册上添了泰山三百年没有过的一行：火坛左手边，常设一位。天门道人亲笔批的，批语只有两个字：「准了。」据说老人批完，背着手在火坛边站了半个时辰，走时嘀咕了一句「晓儿这火，是越烧越旺了」。', type: 'description' },
            { speaker: 'narrator', text: '她还是寅时起火，卯时迎旭，话还是密，性子还是直——只有第一缕日光爬上来的那一瞬，她会先扭头看你一眼，再去看日头。看你的那一眼，比看一千次日头都亮。', type: 'description' },
            { speaker: 'npc', text: '「今日金梁，云厚三分。」她拨着炭，把拓毡往你那边推了半寸，「你的那半张纸，铺好了。」话是指挥人的话，推过来的毡子，指尖却在边角上按了很久才松开。', type: 'description' },
            { speaker: 'narrator', text: '师弟们私下说：临火人还是那个临火人，火还是那么旺——只是每天卯时，火坛边多一个人；她迎完第一缕，会朝那边笑一下，满顶的晨光，就数那一下最好看。', type: 'description' },
            { speaker: 'narrator', text: '泰山的日头天天升，玉皇顶的火夜夜旺。两个人临火，档是会变的——变厚，变暖。', type: 'description' }
        ],
        finalText: '——— 结局·守晨（道侣·归隐）———'
    },
    'tai_ending_岁晴': {
        id: 'tai_ending_岁晴', npcId: TAI_NPC_ID, title: '结局·岁晴', icon: '⛰️',
        route: '岁晴',
        scenes: [
            { speaker: 'narrator', text: '你成了与她立岁约的人。每年开春，头一个大旭日——她提前三天托山下的邮驿捎信，信上只有一行字：「云薄，金梁，速来。」你上山，她在火坛左手边留位，炭她带，酒你带，看完日出，两人拓一张当年的「日」字，一人一半。', type: 'description' },
            { speaker: 'npc', text: '「今年这张，第七层墨上早了一刻。」她把拓片对着光举起来，眯眼验收，絮絮地讲，「早一刻，光就嫩。嫩的也好看——就是没有去年那张沉。」讲完把拓片一分为二，裁得笔直，塞一半进你手里，「收好。攒到一百张，我们铺满日观峰的石头晒一晒。」' },
            { speaker: 'narrator', text: '有人问你们是什么关系。她答「岁约」，{playerTa}答「岁约」。答完两人各自低头看手里那半张拓片，纸边对纸边，拼成一个完整的「日」字——谁也没有多解释一句。约极稳，一年一会，日头作证，误了罚拓一百张废片，十年了，谁也没被罚过。', type: 'description' },
            { speaker: 'narrator', text: '后来那半张半张的拓片，真的攒到了一百张。晒拓片那天，日观峰的石头铺满了「日」字，满山的师弟都来看。她站在中间，扛着火钩，讲光讲了整整一个时辰——这一次，没有人说她话多。', type: 'description' }
        ],
        finalText: '——— 结局·岁晴（挚友·同行）———'
    },
    'tai_ending_纸晖': {
        id: 'tai_ending_纸晖', npcId: TAI_NPC_ID, title: '结局·纸晖', icon: '✉️',
        route: '纸晖',
        scenes: [
            { speaker: 'narrator', text: '{playerTa}成了岱庙碑林的常客。后檐第三格那个位子年年留着；每年春讯一到，碑林的收信箱里必有几刀上好的拓纸，附一页山下来的信。', type: 'description' },
            { speaker: 'narrator', text: '她照旧临火，照旧拓碑——只是每年收了信，会把当春拓得最好的一幅「日」字压在回信里寄下山。信纸带过晨光的暖，压在拓册里，墨色十年不曾潮过一页。', type: 'description' },
            { speaker: 'npc', text: '「今年的拓纸，比去年厚半分。」她把纸一刀一刀码进龛里，指尖在纸沿上敲了敲，对着空气自言自语，「厚纸吃墨……那第七层墨，得再晚一刻上。」回信早就写好了，字写得比记火还工整，落款处照例画一个小小的日头。', type: 'description' },
            { speaker: 'narrator', text: '师妹有回问她：山下那位，算你什么人。她想了想，答得又快又亮：「纸晖——纸上的晖光。」师妹似懂非懂。只有临火人自己知道，拓册最末那一页，历年的「日」字与山下来的信并排压在一处，页脚她题了四个字：「都是真的。」', type: 'description' }
        ],
        finalText: '——— 结局·纸晖（挚友·归隐）———'
    },
    'tai_ending_烬晓': {
        id: 'tai_ending_烬晓', npcId: TAI_NPC_ID, title: '结局·烬晓', icon: '🌑',
        route: '烬晓',
        scenes: [
            { speaker: 'narrator', text: '那一幅拓了十年的「日」字，她在火坛前烧了。先烧页脚，再烧纸心；那个「日」字亮了一瞬，一千个早晨的光缩成一点白，没了。烧完她掸掸手，转身记档，字迹稳得像常：「一千零一次，独迎。」', type: 'description' },
            { speaker: 'narrator', text: '第二天，她把竹管也卸了下来，交给师妹：「空管子，装炭引正好。」从此玉皇顶的火照旧旺，迎旭的仪照旧全——只是临火人再没有拓过一张「日」字。碑林的师弟们说，师姐的拓包收进了箱底，箱底压着三百多张废片，一张也没舍得扔，也一张再没拿出来过。', type: 'description' },
            { speaker: 'npc', text: '「光有什么好讲的。」后来有新弟子问她，为什么清晨不再讲云海了，她拨着炭，语气又快又亮，亮得没有一丝波澜，「日头天天出——看不看，它都出。讲给听得懂的人，才叫讲。」她顿了一下，把炭钩得哗啦一响，「听不懂的，讲了也是风。」' },
            { speaker: 'narrator', text: '多年后你再上泰山，她对你礼数周全，报时辰照旧，分毫不差——只是火坛左手边那块石头上落了霜，再没人拂过。每年开春大旭，满山的人挤在日观峰看日出，临火人立在火坛前，背对着东方，迎完了那一缕，也就迎完了。她烧掉的不是拓片——是那个「分出去」的念头。', type: 'description' }
        ],
        finalText: '——— 结局·烬晓（辜负）———'
    },
    'tai_ending_独晖': {
        id: 'tai_ending_独晖', npcId: TAI_NPC_ID, title: '结局·独晖', icon: '🌫️',
        route: '独晖',
        scenes: [
            { speaker: 'narrator', text: '后来你还是上过几次泰山。玉皇顶对外客观旭，她对你礼数周全，报时辰照旧，分毫不差，像对每一位上山看日头的人。', type: 'description' },
            { speaker: 'narrator', text: '临火档年年新记，一千零一次，一千零二次——炭色、风向、云梁的厚薄，都一笔一笔记全了。只是页页之上，再没有过「同看者」的注。', type: 'description' },
            { speaker: 'narrator', text: '再后来，山上偶有传闻——临火人的迎旭愈发准了，「日」字却愈发拓得少了，竹管里的麻线缠了又缠，缠到第七匝。天门道人有一回清晨上顶，看了孙女很久，只说了一句：「晓儿，火是好火。就是太独了。」', type: 'description' },
            { speaker: 'narrator', text: '大旭日的清晨，她一个人在火坛前迎第一缕。迎完，会朝山道口的方向望一眼——望一眼，就收回去了，收得很干净，像一页记完了的档。第一缕日光照旧归她管。管了一辈子。', type: 'description' }
        ],
        finalText: '——— 结局·独晖（错过）———'
    }
};

// ============ 性别语境事件（femctx 女玩家 / mctx 男玩家，互斥） ============
var TAI_GENDER_CTX_EVENTS = {
    // 女玩家：泰山派女弟子的提醒
    'tai_event_femctx': {
        id: 'tai_event_femctx', npcId: TAI_NPC_ID, title: '盘道上的姐妹话', icon: '🧵',
        desc: '两个相熟的泰山女弟子在十八盘把你叫住了。',
        minAffection: 55, trigger: { random: 0.35 }, cooldown: 0, flag: 'tai_e_femctx_done',
        requirePlayerFemale: true,
        autoTrigger: { location: '泰山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '临罢晨火下顶，两个相熟的泰山女弟子在十八盘的半腰把你叫住，左右看了看，拉着你坐到道边的石上。', type: 'description' },
            { speaker: 'npc', text: '「姑娘。」年长的那个开门见山，「师姐的火坛，三百年没让人站过左手边——你的位置，她拿炭笔在石头上画出来了。满顶都看在眼里了。」' },
            { speaker: 'npc', text: '「师姐那个人，话密，心直，欢喜全挂在脸上。可她把『第一缕』看得比命重，她爷爷又是最刚直的掌门——门规压下来，她一个人扛得住，你舍得看她扛么？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「她临她的火，我看我的云——正好作伴。」', effect: 'tease', affection: 8 },
                { text: '「姊姊，我自愿的。门规再重，两个人扛，轻一半。」', effect: 'accept', affection: 7 },
                { text: '「你们是怕我委屈，还是怕她破例？」', effect: 'probe', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'tease': aff = 8; msg = '两个师妹对视一眼，年长的先笑出声：「……作伴？」她拍着你的手背，眼角的纹路都松了，「好姑娘。她一个人在顶上讲光讲了十年，早该有个接话的了。你接——我们师姊妹往火坛边送炭的时候，多送一副护膝。」'; break;
                case 'accept': aff = 7; msg = '师妹们叹了口气：「自愿的……好。」年纪小的那个从包袱里摸出一包晒好的山枣塞给你：「卯时守顶的人，得先垫肚子。往后师姐临火，你看她——枣子，我们师姊妹包了。」'; break;
                case 'probe': aff = 6; msg = '年长的那个捻着衣角，顿了顿：「……两样都怕。」她朝玉皇顶的方向望了一眼，「她破例一回，就要拿十倍的规矩端回来。老掌门那边，还得有人陪她一起回话。你舍得，就留下。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // 男玩家：守盘道男弟子的流言
    'tai_event_mctx': {
        id: 'tai_event_mctx', npcId: TAI_NPC_ID, title: '守盘的流言', icon: '🌬️',
        desc: '守十八盘的男弟子把你拦下了。',
        minAffection: 55, trigger: { random: 0.35 }, cooldown: 0, flag: 'tai_e_mctx_done',
        requirePlayerMale: true,
        autoTrigger: { location: '泰山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '十八盘道口，一个胆大的守盘男弟子把你拦下，左右看了看，压低声。', type: 'description' },
            { speaker: 'npc', text: '「那位……山上的客。」男弟子咬着牙，「你跟临火人的事，满山传遍了。她把竹管里的『日』字给你看了——她拓了十年的那一幅。三百年的泰山，火坛左手边没站过人，头一遭。」' },
            { speaker: 'npc', text: '「我不是说这不好。我是说，临火人那位爷爷，是天门道人——泰山派最刚直的掌门。门规压下来，她能拿十倍的规矩端回去，端得住。可你这外客的身份，端得住满山的嘴，端得住老掌门的考校么？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「嘴归嘴。她临她的火，我站我的位——考校我来受。」', effect: 'defy', affection: 8 },
                { text: '「兄弟，我们还没到那一步。」', effect: 'deny', affection: 3 },
                { text: '「谁嚼她的舌根，先问我的拳头。」', effect: 'shield', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'defy': aff = 8; msg = '男弟子眼睛亮了：「……行！这话我原样带给临火人——不对，我不能带。」他吐吐舌头跑了。可当天夜里玉皇顶的炭火，你远远看得见，拨得比平日旺——临火的人，心情不坏。'; break;
                case 'deny': aff = 3; msg = '男弟子盯了你半晌：「……没到那一步。」他拍拍衣摆要走，又回头，「那你怀里那只竹管算什么？三道麻线的木塞，满山都知道是临火人的命——你替她背着？」'; break;
                case 'shield': aff = 7; msg = '男弟子怔了怔，忽然咧嘴一笑：「临火人要是听见这句，能拿数目损你三天——损完了，拉你上顶看她私藏的金梁。」他跑进盘道，声音远远飘下来，「嚼舌根的那几位，其实早叫封山雪那一晚的绳结堵了嘴啦！」'; break;
            }
            return { affection: aff, msg: msg };
        }
    }
};

// ============ 合并进总事件池 ============
if (typeof NPC_PERSONAL_EVENTS !== 'undefined') {
    Object.assign(NPC_PERSONAL_EVENTS, TAI_MAIN_EVENTS);
    Object.assign(NPC_PERSONAL_EVENTS, TAI_GENDER_CTX_EVENTS);
}

// ============ 注册结局集与副作用回调 ============
if (typeof registerEndingSet === 'function') {
    registerEndingSet(TAI_NPC_ID, TAI_ENDINGS);
}
if (typeof registerEndingCallback === 'function') {
    registerEndingCallback(TAI_NPC_ID, function(endingName, npc) {
        if (endingName === '同晖' || endingName === '守晨') {
            if (npc && typeof npc.setFlag === 'function') npc.setFlag('dao_companion');
            if (window.showMessage) window.showMessage('🌅 你与岳清晓结为道侣！泰山剑意与紫气东来感悟大幅提升', 'success');
        } else if (endingName === '岁晴' || endingName === '纸晖') {
            if (npc && npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 30);
            if (window.showMessage) window.showMessage('🌅 你与岳清晓成了日头作证的知己', 'success');
        } else if (endingName === '烬晓') {
            if (window.showMessage) window.showMessage('🔥 岳清晓烧了那幅「日」字拓片。一千个早晨的光，她不再分了', 'error');
        }
    });
}

// ============ 自动触发 + 每日钩子（复用 maybeAutoTriggerPersonalEvent） ============
function maybeAutoTriggerTaiEvent(source) {
    return maybeAutoTriggerPersonalEvent(TAI_NPC_ID, source, { finalEvents: ['tai_event_013'] });
}

if (typeof window !== 'undefined' && window.timeSystem && window.timeSystem.onNewDaySubscribe) {
    window.timeSystem.onNewDaySubscribe(function() {
        try {
            if (window.currentCharData && window.currentCharData.location === '泰山派') {
                maybeAutoTriggerTaiEvent('daily');
            }
            // 性别语境：每日在该派过夜 + 对应性别 + 好感≥55 + 未触发
            if (!window.currentCharData || !window.npcManager) return;
            var loc = window.currentCharData.location || '';
            if (loc !== '泰山派') return;
            var npc = window.npcManager.getNPC ? window.npcManager.getNPC(TAI_NPC_ID) : null;
            if (!npc) return;
            var aff = (npc.relationship && npc.relationship.affection) || 0;
            if (aff < 55) return;
            var isF = window.currentCharData.gender === 'female';
            var ctxId = isF ? 'tai_event_femctx' : 'tai_event_mctx';
            if (typeof hasEventTriggered === 'function' && hasEventTriggered(ctxId)) return;
            var ev = NPC_PERSONAL_EVENTS[ctxId];
            if (!ev) return;
            if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npc)) return;
            setTimeout(function() {
                if (document.querySelector && document.querySelector('.personal-event-modal')) return;
                if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npc)) return;
                if (typeof triggerPersonalEvent === 'function') triggerPersonalEvent(ctxId);
            }, 1200);
        } catch (e) { console.warn('[岳清晓线] 每日触发失败:', e); }
    });
}

// ============ 导出 ============
if (typeof window !== 'undefined') {
    window.TAI_MAIN_EVENTS = TAI_MAIN_EVENTS;
    window.TAI_ENDINGS = TAI_ENDINGS;
    window.maybeAutoTriggerTaiEvent = maybeAutoTriggerTaiEvent;
}
console.log('[岳清晓线] 泰山感情线加载完成：结局 ' + Object.keys(TAI_ENDINGS).length + ' 个 + 主线事件 ' + Object.keys(TAI_MAIN_EVENTS).length + ' 个 + 性别语境 ' + Object.keys(TAI_GENDER_CTX_EVENTS).length + ' 个');
