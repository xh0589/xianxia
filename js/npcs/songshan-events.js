// ==================== songshan-events.js - 逵佩南线情缘事件/结局/性别语境 v1.0（嵩山派男主扩线） ====================
// 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / registerEndingSet / registerEndingCallback /
//       hasEventTriggered / checkEventTrigger / triggerPersonalEvent / canPlayerAccessPersonalEvent）
//       npcs/npc-system.js（executeEmotionInteraction 已加 bond_dao 拦截）
// 加载顺序：在 npc-personal-events.js 之后
// 男主·逵佩南（嵩山派掌门左冷禅养子、执法堂首座，约 28 岁。条文型精确——五岳并盟事务里最能干的一个：
//   文书他核、法度他执、得罪人的活他接。性子精密寡言，说话像念条文，长句短判，很晚才学会幽默。
//   生父是执法堂老书办，病故于任上，留下半枚执法令牌下符；左冷禅收他入府，取名「佩南」——
//   佩，佩符；南，生父故乡在山南。养父拿他当刀，他不愿做刀，但也不反——他把自己的规矩立起来。
//   执念只有一个：执法之人最讲规矩，却在慢慢学会为一个人「例外」）。
// 嵩山派既有设定：并派章程两本之异（见 js/sects/sect-story-arc.js 嵩山段「抄章程」）、五岳盟使巡山核验名册库甲、
//   峻极剑谱夜讲/嵩山十七路剑「长枪大戟般堂皇」（见 js/sects/sects-deep-data.js、sect-internal.js 嵩山段）、盟旗演武台。
// 信物：半枚执法令牌（下符，009 相赠）。上符存执事堂，合符则判——他的那一半，此生只给一个人。
// 男女玩家皆可追，主线共享（代词按性别），各有专属性别语境事件（femctx/mctx）。
// 注：本线已入 MALE_LEAD_ROSTER（吃醋对峙/和好两桩由 male-lead-*.js 稍后接线，名册先行）。

var SONG_NPC_ID = 'sect_leader_嵩山派';

// ============ 主线事件（song_event_001 ~ 011 + 终章 013） ============
var SONG_MAIN_EVENTS = {
    'song_event_001': {
        id: 'song_event_001', npcId: SONG_NPC_ID, title: '执法堂前', icon: '📜',
        desc: '入门头一桩官司，就断在执法堂首座手里。',
        minAffection: 12, trigger: { random: 0.4 }, cooldown: 0, flag: 'song_e001_done',
        autoTrigger: { location: '嵩山派', random: 0.45 },
        scenes: [
            { speaker: 'narrator', text: '你入嵩山派第三日，撞上两个老弟子欺负新来的小师弟——你出手拦了，头一拳是你先动的。当日傍晚，三个人一并被传进执法堂。', type: 'description' },
            { speaker: 'narrator', text: '堂上案后坐着一个人，玄衣银扣，腰悬半枚铜符，正把一卷条令摊平。他不过二十七八年纪，眉目沉静，念条文的声音不高，字字像刻上去的：「嵩山门规第七条：同门斗殴，双方同罚。你先动手，加一等。」', type: 'description' },
            { speaker: 'npc', text: '他抬眼看你，目光落在你拳峰的擦伤上，停了半息：「但，你动手时，对方正在夺剑。条令有但书：护幼止暴者，罚减等。你的伤，算数。」他把判词写完，推过来，「看一遍。有异议，三日内递状。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '逐字看完判词，拱手：「条文背得比我熟——受罚，认。」', effect: 'law', affection: 8 },
                { text: '「敢问首座：若是你在场，那一拳，动不动？」', effect: 'ask', affection: 7 },
                { text: '什么也不辩，低头领罚', effect: 'take', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'law': aff = 8; msg = '他把判词收回去，归档，动作停了一瞬。「认罚的人多，认条文的人少。」他重新提笔，在卷末添了一行小字，「多数人被罚，只记得疼。你记得是第七条——记条文的人，往后才不会白疼。」他起身，玄衣一振，「逵佩南。执法堂首座。你的名字，我记下了。不是记在罚档，是记在别处。」'; break;
                case 'ask': aff = 7; msg = '提笔的手悬住。堂上安静得能听见烛芯的响。他认真想了很久，久到你以为他不答，他才开口，一字一顿：「动。但我会先念第七条，再动拳——条文念完还来得及，就先念。」他把笔搁下，看你，「拳头快过条文的人，嵩山每年都有十几个。条文快过拳头的，我今日头一回见有人问。这个问题，值钱。」'; break;
                case 'take': aff = 6; msg = '你不辩，他也不再问，只把判词副本折好递给你：「收着。不是羞辱——是凭据。」你接过，纸上判词工整，末了一行小注却出人意料：「护幼，义举；先动，违规。义与规两全之法，本堂仍在修订。」你抬头看他，他已经低头理下一卷宗，耳廓微红，「那行小注，条令里没有。是我加的。别外传。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'song_event_002': {
        id: 'song_event_002', npcId: SONG_NPC_ID, title: '章程两本', icon: '🖋️',
        desc: '《并派章程》抄本与底本对不上——他两本都存。',
        minAffection: 18, trigger: { random: 0.35 }, cooldown: 0, flag: 'song_e002_done',
        requireEventDone: 'song_event_001',
        autoTrigger: { location: '嵩山派', random: 0.42 },
        scenes: [
            { speaker: 'narrator', text: '执事堂重抄《并派章程》，缺人手，把你借去誊录。抄到第三十七条，你发现抄本与底本对不上——底本「并派之后，各派旧例不废」一行被人墨笔圈掉，旁改「旧例尽废」，圈改的笔锋极重，透纸三分。', type: 'description' },
            { speaker: 'narrator', text: '你正对着那行字发怔，身后有人开口，声音平平：「两本对不上，不是你的错。」执法堂首座逵佩南不知何时立在案边，把两本章程并排摆开，逐字比对了一遍，比对得极慢，极准。', type: 'description' },
            { speaker: 'npc', text: '「底本出自执事堂旧档，新本出自上面。」他直起身，「执法堂两本都存。条文不站队，只记录。」他看你一眼，「你在抄本——两本同时在世，你照哪本抄？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「两本都抄。末尾附一行：此条两本有异，请掌门定夺。」', effect: 'both', affection: 8 },
                { text: '「照首座存的抄。执法堂存哪本，哪本就是真的。」', effect: 'follow', affection: 7 },
                { text: '嗤一声：「什么章程——还不是盟主一句话的事。」', effect: 'mock', affection: -4 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'both': aff = 8; msg = '他盯着你看了足有三息，忽然转身，从自己的卷袋里取出一页旧纸——上面是一模一样的一行附注，墨色已陈。「当年也有人这么抄。」他把那页纸压回袋底，声音没有起伏，尾音却松了半分，「一行附注，救过一条章程。你今日这一行，我记档。」当夜他把你的抄本亲自查验了一遍，一字未改，只在卷末批了两个字：可存。'; break;
                case 'follow': aff = 7; msg = '「错了。」他摇头，摇得很干脆，「执法堂存的也不是真的——存的是『有过这两本』这件事。真不真，要两本对着看才看得出来。」他把两本章程一左一右推到你面前，「照两本抄。我的手会错，眼不会；眼也会错，档不会。」顿了顿，他补了一句，学得极慢的幽默：「这句是玩笑的一半。另一半太冷，冻在库里。」'; break;
                // 真负选项：章程是他一刀一笔护着的底线，「盟主一句话」五个字，把他九年核档的工夫说成了儿戏
                case 'mock': aff = -4; msg = '他把两本章程收回袖中，动作不快，却收得极稳。「盟主一句话，能圈掉一行字。」他立在案边，烛光把他影子钉在地上，「圈不掉两本都在世这件事。执法堂存在的意义，就是让圈掉的那行字，还有个地方躺着。」他拱手，礼数一分不缺，人已经退开三步，「抄你的本。抄完交执事堂，不必过我。」此后你再核文书，他照旧查验，照旧批字，只是批语短了，再没多过一个字。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'song_event_003': {
        id: 'song_event_003', npcId: SONG_NPC_ID, title: '卷宗库的灯', icon: '🏮',
        desc: '深夜卷宗库还亮着灯——他把自己断过的案，一年重读一遍。',
        minAffection: 25, trigger: { random: 0.35 }, cooldown: 0, flag: 'song_e003_done',
        requireEventDone: 'song_event_002',
        autoTrigger: { timeRange: [22, 3], location: '嵩山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '深夜你过执法堂后院，卷宗库的窗纸透着灯。推门进去，逵佩南坐在满架卷宗中间，一案一案地读，读得极慢——不是理档，是重读。案卷封皮上的日期，全是往年今日的旧案。', type: 'description' },
            { speaker: 'npc', text: '「执法堂的规矩，我自己定的那条：凡经我手的判词，判后每年今夜，重读一遍。」他没抬头，指腹抚过一行判词，「执法的人一忘事，条文就成了刀。重读，是磨刀——磨的是我自己。」', type: 'description' },
            { speaker: 'narrator', text: '你扫了一眼架目：「未结」一格，空的。只有一册极薄的卷宗搁在格角，封皮崭新，像是今年才立的。窗外，太室山崖顶的方向传来一声老雕的夜唳。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '挽袖坐下，陪他把整架旧案核到天亮', effect: 'help', affection: 8 },
                { text: '指那册薄卷宗：「未结格是空的——这一册，为什么没字？」', effect: 'thin', affection: 7 },
                { text: '「半夜读档，首座大人还真是照本宣科。」', effect: 'mock', affection: -5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'help': aff = 8; msg = '你坐下陪他核档。他递卷，你掌灯，谁也不说话，库里只有纸页翻动的声音。五更天，最后一册归架，他吹熄灯，在门口站了一会儿，说了一句不像他的话：「往年今夜，核完档我总要坐一会儿——不是累，是空。」他侧头看你，晨光正落在他半边肩上，「今年没空。多一个人掌灯，档就只是档，不是刀了。」'; break;
                case 'thin': aff = 7; msg = '他顺着你的手指看过去，沉默了很久，久到你以为他不答。然后他取下那册薄卷宗，翻开——内页雪白，一个字也没有。「没有被告，没有案由，没有判词。」他把卷宗放回原处，摆得端端正正，「今年立的。立它的时候我只知道一件事：这桩案子，永远不结。」他关上库门，落锁，声音很轻，「里面写什么，我还没想好。想好之前，它空着。空着，也是档。」'; break;
                // 真负选项：「照本宣科」戳的是他的根——他比谁都清楚条文是死的，所以才要一年一年亲自磨
                case 'mock': aff = -5; msg = '翻卷的手停住。他把那页判词轻轻抚平，合卷，归档，一套动作做得比平日还稳。「照本宣科。」他把这四个字念了一遍，像核对一条陌生的条文，「宣科的人不怕科条错——怕的是没人宣。」他起身，吹灯，库里黑下来，只剩他的声音，平平的，听不出什么，「你回去睡。今夜核到哪一册，与外人无干。」此后卷宗库的灯照旧夜夜亮，只是门上多了一道闩。你路过时，灯会暗一瞬——是他背过身去了。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'song_event_004': {
        id: 'song_event_004', npcId: SONG_NPC_ID, title: '盟使巡山', icon: '🏵️',
        desc: '五岳盟使持令旗上山核验——要他把库甲数目「写得好看些」。',
        minAffection: 32, trigger: { random: 0.3 }, cooldown: 0, flag: 'song_e004_done',
        requireEventDone: 'song_event_003',
        autoTrigger: { location: '嵩山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '五岳盟使持令旗上山，点名核验弟子名册与库甲。逵佩南全程陪同，名册一页页翻，库甲一件件点，点得盟使脸上的笑渐渐挂不住——数目太实了，实得没有一分可供渲染的余地。', type: 'description' },
            { speaker: 'npc', text: '歇脚时盟使呷着茶，慢悠悠点他：「首座，五岳大会在即，库甲的数目么——写丰盈些，盟主脸上有光，你脸上也有。」逵佩南垂手立着，答得不快不慢：「库甲一件对一件，件件有实物。数目，就是数目。」', type: 'description' },
            { speaker: 'narrator', text: '盟使拂袖去了。暮色里他立在库房门前，望着那杆五岳令旗被抬下山，忽然对你说：「名册可以修饰，人还在。库甲不能——甲是命。虚报一件甲，将来就有一条命穿着不存在的甲上阵。」', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「盟使这一笔会记到执事堂。你就不怕？」', effect: 'fear', affection: 7 },
                { text: '陪他把库甲重新点一遍，点到掌灯——让他手里多一份实据', effect: 'verify', affection: 8 },
                { text: '「数目略圆一圆，两全其美，何必把人都得罪尽。」', effect: 'smooth', affection: -4 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'fear': aff = 7; msg = '「怕。」他答得出人意料地干脆，「怕，是一种预估：预估了，就能设防。」他领你进库房，指着架上码得方方正正的甲片，「执事堂要记我一笔，随他记。库甲这一架，件件对得上实物——实物不会替我求情，但实物不会说谎。」他锁上库门，把钥匙挂回腰间，与那半枚铜符碰出一声轻响，「得罪人的活我接了九年。接得动的，才叫活。」'; break;
                case 'verify': aff = 8; msg = '你陪他从黄昏点到掌灯，一甲一胄，逐件画押。点完最后一架，他把两份实据并排收进卷袋：「一份存执法堂，一份——」他想了想，抽出一份递给你，「你存。两处存同一件事，事就压不死。」他吹熄库房的灯，黑暗里你听见他极轻地舒了一口气，像卸下什么，「今日你点的每一笔，都比盟使那一笔值钱。」'; break;
                // 真负选项：「圆一圆」三个字，等于要他把甲片后头那些命，也一并圆掉
                case 'smooth': aff = -4; msg = '他转过头看你，看了很久，看得你后颈发凉。「两全。」他把这两个字放在舌上碾了一遍，「全的是谁的数目？虚一件甲，圆一个脸面。将来上阵的人穿着不存在的甲——他圆什么？」他不再看你，推门进库房，一件一件重新点起甲来，声音从门缝里传出来，又平又冷，「执法堂不设『两全』这一条。你回去吧。道不同，档也不同。」那一份本该给你的实据，他没有再提。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'song_event_005': {
        id: 'song_event_005', npcId: SONG_NPC_ID, title: '养父的刀', icon: '🗡️',
        desc: '他替养父送了九年信——这一回，他数了数对方的白发。',
        minAffection: 40, trigger: { random: 0.3 }, cooldown: 0, flag: 'song_e005_done',
        requireEventDone: 'song_event_004',
        autoTrigger: { location: '嵩山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '他这三日不在山上——替执事堂送信去了南边一座不肯并入的小门派。你再见他时是深夜，执法堂灯还亮着，他坐在案后，把一纸回执摊得平平整整：老掌门按了手印，那杆祖传的铁枪，随文书一并入了嵩山库房。', type: 'description' },
            { speaker: 'npc', text: '「养父说过：刀，不需要问为什么砍。」他望着那纸回执，语气听不出好坏，「我送了九年信。九年，三十七封。每一封送完，回执归档，结案。」他停了很久，久到烛花爆了一声，「这一回不一样。老掌门按手印的时候，我数了他的白发。一根一根，数到二十七根，他自己先笑了，说：小哥，别数了。」', type: 'description' },
            { speaker: 'narrator', text: '他把回执折成方块，收进卷袋——收得很稳，只是收完之后，两只手在案上平放着，像需要放在什么地方才不至于失礼。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「刀不问，人记。你数了那二十七根白发——你就不是刀。」', effect: 'man', affection: 9 },
                { text: '「下一封信，带我去。多一个人，多听一半的话。」', effect: 'join', affection: 8 },
                { text: '「盟主养你成人，你还怨上他了？」', effect: 'stab', affection: -6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'man': aff = 9; msg = '案后的人静了很久。然后他抬手，把那盏凉透的茶倒掉，重新斟了一盏热的——推到你对面，自己那盏没斟。「执法堂断案，讲一个『心证』。」他声音还是平的，平得有些用力，「数白发，不是条文里的事。归档的时候我一直在想，这一笔该记在哪一栏。」他看着你，一字一字地说，「你替我定了栏。记在『人』字栏。刀没有这一栏——所以，我不是。」'; break;
                case 'join': aff = 8; msg = '「带你去？」他重复了一遍，像在核一条没见过的条文，「送信是得罪人的活。得罪人的活，历来我一个人接。」你说不必历来。他低头把卷袋系好，系得极慢，抬起头时，眉目间那点沉水似的东西散了一线：「好。下一封，带你。」他把回执归档，忽然又补了一句，学得很拙的玩笑话，「你耳朵比我好使——对面骂人的时候，你听得见，我记不下。」'; break;
                // 真负选项：他不是怨养父——他是在「刀」与「人」之间站了九年，这一句把他九年的站处说成了白眼狼
                case 'stab': aff = -6; msg = '他没有动怒，连眉毛都没有动。他只是把案上那纸回执重新展开，对着灯，一个字一个字又读了一遍——读得像在给自己定罪，又像在给自己辩护。「养育之恩，记档，终生不敢忘。」他开口，声音比平日更稳，稳得近乎冷，「怨，是另一个卷宗里的字。你今夜翻错了卷。」他起身，吹灯，送客的话说得合乎全礼：「夜深。执法堂不留闲人。」你在门外站了很久。门里重新亮起灯——他把那三十七封旧信的回执，一封一封，全翻了出来。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'song_event_006': {
        id: 'song_event_006', npcId: SONG_NPC_ID, title: '佩南', icon: '🌄',
        desc: '峻极峰头，他头一回讲自己名字的来历——和那半枚铜符。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'song_e006_done',
        requireEventDone: 'song_event_005',
        autoTrigger: { location: '嵩山派', random: 0.42 },
        scenes: [
            { speaker: 'narrator', text: '峻极殿夜讲散后，传功长老讲的那句「嵩山剑，贵在一个正字」还在檐下回响。他难得没有回执法堂，约你上峻极峰头的平台。山南的灯火在脚下铺开，一直铺到看不见的地方。', type: 'description' },
            { speaker: 'npc', text: '「我生父是执法堂的老书办。抄了一辈子档，病故在任上——病故，不是殉职，堂里抚恤照足数发的，这笔两清。」他讲得平平静静，像念别人的卷宗，「他留下半枚执法令牌。令牌是合符之制：上符存执事堂，下符执法者佩身，合符则判。」', type: 'description' },
            { speaker: 'narrator', text: '他从腰间解下那半枚铜符，托在掌心。断口的茬早被摩挲得温润，符面一个「执」字，只剩半边。「养父收我入府那日给我取名：佩，佩符；南——」他抬手指了指山南那片灯火，「我父亲的故乡，在山南。他让我佩着符，朝着南。取名的人没解释过。我自己解释了很多年。」', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '双手捧过那半枚铜符，看罢，郑重奉还', effect: 'token', affection: 9 },
                { text: '「佩符的人站在亮处，影子只在身后。这个名字，取得好。」', effect: 'light', affection: 8 },
                { text: '「逵家……还有旁人么？」', effect: 'kin', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'token': aff = 9; msg = '他微怔了一下，把铜符放进你双手。符比看上去沉，断口温润，「执」字的半边笔画里积着几十年的手泽。你捧看片刻，双手奉还。他接回去，却没有立刻系回腰间——握着，握了一会儿。「它给过两个人手温。」他说，「我父亲的，我的。今夜是第三个。」他把符收好，转身望着山南，声音散在风里，几乎听不清，「我父亲要是知道它上过峰顶，看了这一山灯火——档里没写过他看过什么。我替他补上了。」'; break;
                case 'light': aff = 8; msg = '山风掠过平台，他侧过头看你，看了很久。「解释了很多年，」他说，「解释出来的都不如你这十个字。」他重新望向山南，肩背的线条松了极少的一线，「站在亮处，影子在身后——执法的人，本来就该这样站。这些年我总疑心自己站反了，站在影子里，拿条文当灯。」他顿了顿，摇头，「不是拿条文当灯。是把灯，当成了条文。」这句话他没说下去。那一夜下山，他走在你前面，脚步比平日慢了半拍，像特意等一等身后的人。'; break;
                case 'kin': aff = 6; msg = '「没有了。」他答得很快，快得像早就核过这一条，「逵姓人丁薄。病故的、散佚的，档里都在，世上没有。」他说完，山头上静了一会儿，他又开口，语气仍旧平平，内容却不像条文，「从前我觉得无妨。执法堂在，条文在，山南的灯火在——亲不亲的，档里不记这一栏。」他弯腰拾起脚边一颗小石，掂了掂，又放下，「近来偶尔想：档里不记的，未必没有。譬如这一栏，从前是空的。近来……」他没说近来如何。你也没有问。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'song_event_007': {
        id: 'song_event_007', npcId: SONG_NPC_ID, title: '堂皇剑', icon: '⚔️',
        desc: '盟旗演武台上，他教你嵩山十七路剑——教的不是招，是「正」。',
        minAffection: 55, trigger: { random: 0.3 }, cooldown: 0, flag: 'song_e007_done',
        requireEventDone: 'song_event_006',
        autoTrigger: { location: '嵩山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '盟旗演武台，五岳令旗在杆顶猎猎作响。他今日带剑——玄衣换成劲装，银扣一颗颗系到领口。他先演三路嵩山剑给你看：长枪大戟，堂堂正正，剑风过处，演武台的旗影都被压得伏了一伏。', type: 'description' },
            { speaker: 'npc', text: '「嵩山剑不求快，不求奇，求一个正。」他收剑立定，气息不乱，「正，则势自成。条令也是这个理——条令不求赢人，求站得直。」他把一柄练手剑递给你，「拆招。我喂你十七路，一路一路来。接得住几路，是几路。」', type: 'description' },
            { speaker: 'narrator', text: '他的剑来得极有法度，每一路都先报路数再出手，像念条文——偏偏路路堂皇，压得你只有招架的份。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '全力接剑，陪他从日头正中拆到演武台掌灯', effect: 'drill', affection: 11 },
                { text: '「堂皇有余，机变不足——遇上不讲正的奸人，怎么办？」', effect: 'why', affection: 8 },
                { text: '架开剑：「十七路太笨重。要我说，留第一路就够了。」', effect: 'cut', affection: -4 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'drill': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 11) : { ok: true };
                    if (!_py.ok) { aff = 4; msg = '拆到第十一路，你手腕发沉，剑尖垂了半寸。他立刻收剑，报路数的声音停了：「今日到此。」他把你的剑接过去归架，又解下自己的外袍搭在你肩上——动作合乎礼数，落点却不在礼数上，「第十七路留个尾巴。下回从第十一路续。条令不许人一口气吃成胖子——剑也不许。」（精力不足，那一场你先歇了）'; break; }
                    aff = 11; msg = ('十七路拆完，演武台掌灯。你汗透重衣，他也在喘——这是他头一回在你面前喘。他把练手剑归架，归得一丝不苟，回身看你，忽然极认真地说：「第十一路到第十七路，你接住了五路。第五路你变了个身法，条令里没有——」他停了停，「变得对。堂皇是骨，你那一下是肉。骨立住了，肉自己会长。」掌灯的老弟子远远喊了声「首座」，他摆手，把你那份力竭的狼狈和自己的，一并挡在了灯影外。') + '（精力-11）'; break; }
                case 'why': aff = 8; msg = '喂招的手停了。他想了想，答得像在堂上宣判：「正面对。」你疑心自己听错，他把剑横过来，指着剑身，「奸人诱你侧身，你一側，势就斜；势斜，剑就乱。嵩山剑遇奸，只有一法：我把这一路走得更正，正到他的奸无处落脚。」他收剑入势，「条令对奸，也是正面对——所以条令叫条令，不叫机变。机变赢一时，正，赢一世。」那一夜他把「正」字诀拆成十七个桩子，一个桩子一个桩子喂给你，喂到月亮偏西。'; break;
                // 真负选项：「笨重」「留一路」掀的不是剑，是他九年执条的整个立身之法——堂皇，正是他的命
                case 'cut': aff = -4; msg = '他的剑没有停，也没有快——只是把你那柄练手剑轻轻压回你手里，压得你手腕一沉。「第一路叫『开门』。」他说，「门开了，后十六路才进得来。只留第一路——」他收剑归架，银扣在灯下一闪，「门开着，屋里空了。」他拱手，礼数周全，「剑各有所好。嵩山的剑笨重，配笨重的人，刚好。」此后演武台上他照旧演武，照旧堂皇，只是不再报路数给你听。旗影猎猎，你和他之间隔了一杆令旗的距离。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'song_event_008': {
        id: 'song_event_008', npcId: SONG_NPC_ID, title: '第十七个例外', icon: '🌙',
        desc: '深夜执法堂阶前，他报了一串数目——第十七个例外，没有落纸。',
        minAffection: 62, trigger: { random: 0.3 }, cooldown: 0, flag: 'song_e008_done',
        requireEventDone: 'song_event_007',
        autoTrigger: { timeRange: [21, 3], location: '嵩山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '深夜你回住处，执法堂前的石阶上坐着一个人。逵佩南没有掌灯，膝上摊着一份没有批完的文书，像是坐了很久，又像是根本没在看文书。见你来，他往旁边挪了半尺——挪出来的位置，不多不少，刚好一个人坐。', type: 'description' },
            { speaker: 'npc', text: '「我在核一个数。」他不看你，看檐角的月亮，「今年，我开过十七个例外。十六个落在档里，条条有出处，合哪一款、减哪一等，查得到。」他把手里的文书折起来，折得方方正正，「第十七个，没有落纸。」', type: 'description' },
            { speaker: 'npc', text: '你问第十七个在哪。他沉默了一会儿，说：「在石阶上坐着。」又沉默了一会儿，补了一句，「这句是玩笑。不好笑的话——我记下来，改日重讲。」', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '进去沏一壶酽茶，陪他在石阶上坐到天亮', effect: 'tea', affection: 12 },
                { text: '「那就别落纸。查不到的东西——我替你收着另一半。」', effect: 'word', affection: 9 },
                { text: '什么都不说，在他挪出来的那半尺位置上坐下', effect: 'sit', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'tea': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 12) : { ok: true };
                    if (!_py.ok) { aff = 5; msg = '茶沏到第三壶，你先撑不住，靠着廊柱睡着了。醒来时天光微亮，身上盖着他解下来的外袍，手边一盏茶温着——茶面上没有一片叶子沉底，是滤过两遍的。盏底压着一小张裁得极方的纸，上一行小字工整如判词：先睡的不算陪。下回补。纸角盖了半枚符印——他拿令牌蘸的印泥。（精力不足，那一夜你先撑不住了）'; break; }
                    aff = 12; msg = ('你沏了酽茶，陪他在石阶上坐到天亮。茶续了四道，话不多——他偶尔报一个数，你偶尔应一声。东方泛白时，他手里那份折好的文书始终没有再展开。他把凉透的茶根泼进石缝，忽然开口：「往年这个时辰，我把一夜想完的事归档。今夜的事归不了档——」他转头看你，眼里有血丝，神色却前所未有地清楚，「归档要有名目。你这个名目，条令里没有。我查了一夜，查不到。查不到，很好。」') + '（精力-12）'; break; }
                case 'word': aff = 9; msg = '折文书的手停在半空。他侧过头，就着月光看你，看了很久很久，久到月亮都挪了一寸。「收着另一半。」他低声重复，像在核对一枚合符，「上符存执事堂，下符佩在身——你说的那一半，从来不在条令里。」他把折好的文书收进袖中，起身，掸了掸衣摆，动作恢复了平日的精确，声音却低了半度，「好。不落纸。落纸的要归档，归档的要年检——这一个，不检。放在你那里，比放在档里稳。」'; break;
                case 'sit': aff = 7; msg = '你在他挪出来的位置上坐下。他往那边又让了半寸，两人都没说话。石阶凉，月亮高，檐角的风偶尔响一声。坐到四更，他忽然开口，声音很轻：「执法堂九年，来递状的、来领罚的、来求情的——头一回有人来，什么都不为。」他站起身，把膝上文书收好，朝你伸出手，拉你起来，掌心干燥而稳，「回去睡。明夜若还坐，位置照旧。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'song_event_009': {
        id: 'song_event_009', npcId: SONG_NPC_ID, title: '半符之赠', icon: '🎖️',
        desc: '他把生父留下的那半枚执法令牌，搁进了你的掌心。',
        minAffection: 68, trigger: { random: 0.3 }, cooldown: 0, flag: 'song_e009_done',
        requireEventDone: 'song_event_008',
        autoTrigger: { location: '嵩山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '他约你到卷宗库。库门开着，灯点着，「未结」格前，他立在那里等你——手里托着那半枚执法令牌，铜色沉沉，断口温润。', type: 'description' },
            { speaker: 'npc', text: '「执法令，合符之制。上符在执事堂，下符，在我。」他拉起你的手，把令牌搁进你掌心，指腹按了按，按得很实，「持此半符：卷宗库任何时辰可入；任何案卷可调；任何判词——」他停了停，把最后一条念完，念得比前两条慢，「可驳。包括我断的。包括断在你身上的。」', type: 'description' },
            { speaker: 'narrator', text: '库灯之下，他的神色与平日无异，精确，端正，只有搁符的那只手收回去时，在袖中握了一下。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '攥紧令牌：「我收符。今夜陪你把整架『历年重核』核到天亮。」', effect: 'promise', affection: 14 },
                { text: '当即将符佩在胸前，长揖到底：「此符，我当条文收——条文不破。」', effect: 'match', affection: 9 },
                { text: '「……为什么是我？」', effect: 'why', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'promise': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 14) : { ok: true };
                    if (!_py.ok) { aff = 6; msg = '核到三更，你眼皮发沉，手里的卷册滑了半寸。他扶住卷册，也扶住你：「今夜到此。」送你出库门，又把那半枚令牌往你掌心里按了按，按回原样，「符收好了。诺不变——档也不变。历年重核的架子，往后年年有你一盏灯。」（精力不足，那一夜你先撑不住了）'; break; }
                    aff = 14; msg = ('你攥紧令牌陪他核档。那一夜卷宗库的灯亮到五更，他把历年重核的架子一层一层拆给你看：哪一年判重了，哪一条引错了，哪一桩他至今想起来还要在后颈冒汗。核完最后一册，他在总目上添了一行小字，写完把笔搁下：「自今年起，重核，二人。」他吹灯前看了你一眼，库里将暗未暗，「我父亲抄了一辈子档，档里没有他的名字。我的档里有——从今夜起，也有你的。」') + '（精力-14）'; break; }
                case 'match': aff = 9; msg = '你佩符，长揖。他侧身受了半礼，另半礼伸手扶住——扶得很稳。「条文不破。」他把这四个字核了一遍，点头，「批注一条：条文会破。破了要有人执——执的人也会错。错了，」他的目光落在你胸前那半枚铜符上，「要有人驳。这一条不在符的用法里，在赠符的人心里。」他送你出库门，落锁，钥匙与符的轻响在夜里碰了一声，像合了一次符。'; break;
                case 'why': aff = 5; msg = '他被问住了。库灯芯响了一声，他答得很慢，像逐条核对自己：「其一，你把条令背给我听过——头一个。其二，你替我定过『人』字栏。其三——」他停住了。停得很长，长到你以为没有其三。然后他说：「其三，第十七个例外，要存处。」他把库灯挑亮了些，转身归架卷宗，背对着你，声音混在纸页声里，「三条都合规矩。第三条最不合。第三条最真。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'song_event_010': {
        id: 'song_event_010', npcId: SONG_NPC_ID, title: '养父的手令', icon: '📃',
        desc: '执事堂手令下来：旧案缺页，大会之前「补全」——他问你，该怎么断。',
        minAffection: 72, trigger: { random: 0.3 }, cooldown: 0, flag: 'song_e010_done',
        requireEventDone: 'song_event_009',
        autoTrigger: { location: '嵩山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '五岳大会前一日，执事堂下来一纸手令，不钤印，字迹极工整：着执法堂将当年南边那桩门派并案的旧卷呈上，缺页一处，大会之前「补全」。他把那卷旧档调出来与你同看——当年那座不肯并入的小门派，处置经过记到关键一页，页脚裁去了半幅，切口很旧，裁的人手法很熟。', type: 'description' },
            { speaker: 'npc', text: '「补全，有两个补法。」他把手令与旧档并排摆平，像堂上摆证据，「一个，照执事堂的意思补——补出来的页，字字体面，大会好看。一个，照实补——去南边，当面向老掌门问清当年事，问出来的字，未必体面。」', type: 'description' },
            { speaker: 'narrator', text: '他坐得笔直，望着你，把这一桩他一个人的难题，头一回摆到了两个人中间：「执法之人从条令。条令从上出。上面的条令，要下面的档改——你说，首座该怎么断？」', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「缺页照实补。补一页真话——去南边，当面问。」', effect: 'truth', affection: 11 },
                { text: '「手令抄录归档，一字不易。让档先说话，别让人先说话。」', effect: 'file', affection: 9 },
                { text: '「这是你与盟主之间的事。我一个外人，不该听。」', effect: 'out', affection: 3 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'truth': aff = 11; msg = '他闭了一下眼。再睁开时，眼底那点连日核档的血丝仿佛都定住了。「照实补。」他把这三个字念完，起身，从架上取下行旅用的文书袋，一件一件往里收：勘合、路引、旧案副本，收得极有条理，「条令第一条我入堂那年就背过：档贵真。背了九年，今夜才有人陪我把它念出声。」他在袋口停了一下，回头看你，「南边路远。老掌门的白发，我数过一回——第二回，你陪我去数。」这不是问句。是判词。'; break;
                case 'file': aff = 9; msg = '「归档。」他重复了一遍，唇角极轻微地动了一下——你如今看得懂，这是他的大笑，「手令也是档。入档，就有了出处；有了出处，就压不死。」他提笔，把手令一字不易抄录入卷，抄到「补全」二字时笔锋顿了顿，仍照原样收笔，「当年有人抄章程，附一行『请掌门定夺』，救回一条旧例。今夜你教我这一手——比那一行更稳。」他把抄卷入柜，落锁，「档先说话。说话之前，我先去南边取证。」'; break;
                case 'out': aff = 3; msg = '「外人。」他把这两个字放进口里核了核，核得很快，快得像怕自己反悔，「档里没有『外人』这一栏。有名字的，都在档里。」他把手令收进卷袋，动作照旧精确，只是精确里透出一点收势的意味，「不该听的话，你听了，没走。这就不是外人。」他吹熄了一半的灯，留一半，「回去吧。此事我自断——断法，方才已经记档了。记在你名下那一页：旁听，无言，未走。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'song_event_011': {
        id: 'song_event_011', npcId: SONG_NPC_ID, title: '卷宗库夜火', icon: '🔥',
        desc: '三更火起，有人要烧掉那页真话——他冲进火里，先救档。',
        minAffection: 78, trigger: { random: 0.3 }, cooldown: 0, flag: 'song_e011_done',
        requireEventDone: 'song_event_010',
        autoTrigger: { timeRange: [22, 4], location: '嵩山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '三更，卷宗库方向火光冲天——库角被人泼了灯油，火头专往「历年旧案」那一架舔。你赶到时，逵佩南已经冲进烟里：他不救别的，直扑旧案架，把那卷南边旧案连同整摞档册往怀里拢。火光照见库门外一条黑影翻墙而去，追不上了。', type: 'description' },
            { speaker: 'narrator', text: '火星如雨。他抱着档册退到门边，衣袖烧穿了一线，浑然不觉——怀里那摞卷宗裹着他的外袍，裹得比护自己严密。横梁在烟里爆了一声。', type: 'description' },
            { speaker: 'npc', text: '「档在人在！」他把卷宗塞进你怀里，反手抽剑，十七路剑的第一路「开门」迎着塌下来的火舌撑开一片空地，头也不回地喝：「带档出去——这是判词！」', type: 'description' },
            { speaker: 'player_select', text: '火场瞬息万变——你必须立刻做点什么。', options: [
                { text: '把档册交给赶来的弟子，返身冲回他身边，背靠背撑住库门', effect: 'back', affection: 12 },
                { text: '冲在他身前，硬替他挡下塌落的燃烧横梁', effect: 'shield', affection: 14 },
                { text: '高喊：「执法堂弟子听令——列队！传档、泼水、护首座！」', effect: 'rally', affection: 10 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'back': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 14) : { ok: true };
                    if (!_py.ok) { aff = 6; msg = '你返身冲进烟里，撑了十几息，眼前发黑，被他一把拎出火场。醒来时天已大亮，火扑灭了，档保住了——他守在廊下，袖口的烧痕还开着，手里端着一盏滤过两遍的温茶。见你睁眼，他把茶递过来，判词一样地说：「力竭入烟，记过一次。下次——」他停了停，「没有下次。下次我锁门。」（精力不足，那一场你先倒下了）'; break; }
                    aff = 12; msg = ('档册交出去，你返身入烟，与他背靠背撑住库门。他的剑是墙，你的肩是墙，火舌卷过一轮又一轮，两个人钉在门里寸步不退。天光放亮时火熄了，旧案架保住了大半。他拄剑站在焦土里，低头清点怀里的卷宗，一册一册报数，报到最后一册，忽然停了——那册薄卷宗，「未结」格里那册没有字的，被他压在最里面，护得最好。他抬眼看你，脸上全是烟灰，说：「今夜，你是第十七个例外的——证人。」') + '（精力-14）'; break; }
                case 'shield': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 14 + 20) : { ok: true };
                    if (!_py.ok) { aff = 7; msg = '横梁砸下来，你抢出半步，肩背硬受了一记——半边衣襟烧起来，被人拖出火场。醒来时他在廊下守着你，替你上药的手极稳，稳得过分。上完最后一道药，他开口，判词的调子，字字却烫：「以身挡梁，记功一次。功过相抵之后——」他把你烧穿的衣袖折好，压在药碗底下，「余下的，记在我名下。执法堂没有这一条，我今夜新立。」（精力不足，你受了伤）'; break; }
                    aff = 14; msg = ('你抢到他身前，双臂上架，硬受那根燃烧的横梁——焦木压臂的一瞬，身后剑光暴涨，十七路剑一路连一路，堂堂皇皇把火舌逼开三尺。他趁势拖着你滚出库门，火在门里轰然合拢。天亮清点：档保住了，人保住了，你两条手臂燎起一串泡。他蹲在你面前上药，一言不发，上到第三道，忽然极轻地说：「条令第九条，护幼止暴者罚减等。」他抬眼，眼里血丝密布，「你护的不是幼，是我。这一条没有但书——我今日补上：挡梁者，执法堂终生留档。」') + '（精力-34）'; break; }
                case 'rally': aff = 10; msg = '你一嗓子喊出去，慌乱的执法堂弟子应声列队——传档的传档，泼水的泼水，两名力士把首座硬架出了火场。火势被一条人龙截住，天亮前压灭。事后他立在焦土前清点卷宗，逐册画押，画到「未结」格那一册时，笔停了半息，收得比哪一册都稳。他转身朝列队的弟子拱手，逐一还礼，最后还到你面前，礼行到底：「号令出自你，队列成于你。今夜执法堂的条理，是你立的——这一功，入档，具名。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'song_event_013': {
        id: 'song_event_013', npcId: SONG_NPC_ID, title: '终章·第一百零八条', icon: '⚖️',
        desc: '他自订《执法堂新章》一百零八条——最后一条「例外」，悬笔未落。',
        minAffection: 85, trigger: { random: 1.0 }, cooldown: 0, flag: 'song_e013_done',
        requireEventDone: 'song_event_011',
        autoTrigger: { location: '嵩山派', random: 1.0 },
        endingMap: { '携令': 'song_ending_携令', '例外': 'song_ending_例外', '磨勘': 'song_ending_磨勘', '同寮': 'song_ending_同寮', '废例': 'song_ending_废例', '空衙': 'song_ending_空衙' },
        scenes: [
            { speaker: 'narrator', text: '五岳大会散了。南边旧案的缺页照实补全、归档，执事堂没有追究，也没有嘉奖——盟主的朱批只有三个字：「知道了。」三个字压下来，嵩山上下噤了半月，只有执法堂的灯，夜夜照旧。', type: 'description' },
            { speaker: 'narrator', text: '这一夜他唤你到堂中。案上摊着一部手订的新册——《嵩山执法堂新章》，一百零八条，全是他一笔一笔自订的，副册已呈执事堂备案。他翻到末页：第一百零八条，条名两个字——「例外」。条文空白，墨已研好，笔已搁在砚上。', type: 'description' },
            { speaker: 'npc', text: '「前一百零七条，条条有出处，字字站得住。」他立在案后，玄衣银扣，腰间的符绳空着——那半枚令牌在你那里，「第一百零八条，我拟了一年，只拟出条名。执法之人最讲规矩，一部章里只许写一个例外——写下去，就再没有涂改的余地。」他提起笔，悬在纸上，抬眼看你，「落笔之前，依例，问一声当堂的人。你说——这一条，怎么写？」' },
            { speaker: 'player_select', text: '你的选择将决定你们的关系走向', options: [
                { text: '「写我的名字。写完，携我这半枚符随你下山——山外头，也有人等着条文替他撑腰。」', effect: 'lover_travel', affection: 30 },
                { text: '「写我的名字。我留在嵩山——往后第一百零八条，两个人一起守。」', effect: 'lover_stay', affection: 28 },
                { text: '「写：每年今夜，重核旧档，许一人同勘。一年一会——友人之约，止于灯下。」', effect: 'friend', affection: 20 },
                { text: '「别写名字。给我在执法堂留个常座——你核档，我沏茶，各自安好。」', effect: 'friend_stay', affection: 18 },
                { text: '「首座，条文就是条文。我是过嵩山一程的旅人——不该入你的第一百零八条。」', effect: 'none', affection: 0 }
            ]}
        ],
        effects: function(npc, choice) {
            // 三度伤透即废例：辜负独立成结局「废例」，与「空衙」（错过）分开记档
            var negCount = (window._negativeChoiceCount && window._negativeChoiceCount[SONG_NPC_ID]) || 0;
            if (negCount >= 3 && (choice === 'lover_travel' || choice === 'lover_stay')) {
                return { affection: 0, msg: '他听完你的答话，提笔，落笔，一字一字写下了你的名字——写得极工整。然后他搁笔，盯着那三个字看了很久很久，忽然伸手，把那页纸从新章上拆下来，凑到灯上点了。火舌卷上来，他把纸页放进铜盆，看它烧成灰，全程脊背笔直。「第一百零八条，废。」他的声音平得像在念别人的判词，「例外要两心相合才立得住。我这一心合了三次，三次都记着档；你那一心——查无实据。」他吹熄灯，黑暗里只剩最后一句，「依例，此案，结案。」', ending: '废例' };
            }
            switch (choice) {
                case 'lover_travel': return { affection: 30, msg: '悬了半年的笔，落了下去。你的名字入条，笔画工整如刻——写完他通读一遍，核了一遍，又在条末添了八个字：「符分两半，人同一路。」他把新章合上，副册留堂，正本收进行囊，解下腰间空了的符绳系在你腕上：「上符在执事堂，我留一纸呈文：下符随人走，执法堂自今日起，堂在人在，人走——」他极轻微地笑了一下，九年来的头一个不加批注的笑，「人走，堂跟着挪。」', ending: '携令' };
                case 'lover_stay': return { affection: 28, msg: '他落笔。第一百零八条全文十九个字，他写了三遍才写成——前两遍都作废了，作废的纸他也没烧，一并归档：「立档为证：此条难写，难在落笔的手会抖。执法九年，手抖，头一回。」第三遍写成，他把笔搁下，长长出了一口气，像把一年的悬案断了，「条文：例有一人，终身不结。」他抬眼看你，眼底灯火通明，「你的名目，我查到了。不在条令里——在新章里。从今夜起，有出处了。」', ending: '例外' };
                case 'friend': return { affection: 20, msg: '他沉默片刻，点头，落笔：「第一百零八条：历年重核之夜，许一人同勘。」写完通读，批了两个字：可存。「同勘，是执法堂最重的礼。」他合上新章，把那盏库灯挑亮，「一年一会，你核我听，错处你指，我记。友人之约——」他把「友人」二字核了核，收进档里，收得很稳，「也是档。好档。」', ending: '磨勘' };
                case 'friend_stay': return { affection: 18, msg: '他看了你很久，落笔：「第一百零八条：堂中设常座一位，沏茶，听档，不问案。」写完，他亲自搬了一张椅子放在案侧——放的位置极讲究，不在灯下，不在风口，在灯光刚好照得到的地方。「常座。」他掸了掸椅背，礼数周全地做了个请的手势，「执法堂九年，没有过这个位子。条令里没有的东西，原来坐上去——是暖的。」', ending: '同寮' };
                case 'none': return { affection: 0, msg: '悬着的笔，停了三息，收回砚上。他把墨盖好，动作一丝不苟，像收一件用不上的刑具。「旅人。」他念了一遍这两个字，点头，「条令第五条：过所验讫，任行不留。」他送你下山，一路无话，礼数周全。到山门，他停步，拱手，直起身时从袖中取出一份文书递给你——是你入山以来执法堂关于你的全部档册，末页一行小注：「此人经过嵩山，山记得。」', ending: '空衙' };
            }
            return { affection: 0, msg: '' };
        }
    }
};

// ============ 逵佩南结局演出（6 个） ============
var SONG_ENDINGS = {
    'song_ending_携令': {
        id: 'song_ending_携令', npcId: SONG_NPC_ID, title: '结局·携令', icon: '⚖️',
        route: '携令',
        scenes: [
            { speaker: 'narrator', text: '下山那日，执法堂弟子列队送到山门。他摆手止了队列，只带了一部新章正本、一柄剑，和腕上系着你那半枚符的符绳。他回头望了一眼峻极峰——望得清清楚楚，也收得干干净净。', type: 'description' },
            { speaker: 'narrator', text: '后来江湖上多了一对道侣的传说：一人佩剑，一人携卷，走到哪里，哪里的冤滞事就多一桩了断。断事不用刀，用条文——条文念完还不服的，剑也堂皇。', type: 'description' },
            { speaker: 'narrator', text: '有人问过他：离了嵩山，你的条令还算数么？他正在灯下核一桩路见不平的旧卷宗，头也不抬：「条令在哪座山上都算数。算数的不是山，是执条的人，和听条的人。」', type: 'description' },
            { speaker: 'npc', text: '篝火边你问他，第一百零八条往后还添不添字。他想了想，很认真地答：「添。走到一处，添一处——例外的条文跟着例外的人走，这才叫合符。」说完自己先愣了一下，像核出这句是玩笑话，随即决定不收回。', type: 'description' }
        ],
        finalText: '——— 结局·携令（道侣·同行）———'
    },
    'song_ending_例外': {
        id: 'song_ending_例外', npcId: SONG_NPC_ID, title: '结局·例外', icon: '🏮',
        route: '例外',
        scenes: [
            { speaker: 'narrator', text: '你留在了嵩山。《执法堂新章》一百零八条在执事堂备了案——盟主朱批仍是三个字「知道了」，可这三个字之后，嵩山上下再没人敢动执法堂的档。', type: 'description' },
            { speaker: 'npc', text: '传功长老打趣他：「新章末尾那一条，不像条文，像判词。」他核档，头也不抬：「是判词。判给两个人的——终身，不结。」', type: 'description' },
            { speaker: 'narrator', text: '每年今夜，卷宗库的灯亮到五更。他读档，你掌灯；读到错处，你指出来，他记档。上符仍存执事堂，他不在意了——下符在你手里，合符的时候，从来都是全的。', type: 'description' },
            { speaker: 'narrator', text: '那册「未结」的薄卷宗，如今厚得和南边旧案一样了。你问过一回里面写了什么，他说：写了九年，写的全是你——头一页，是你入门第三日先动的那一拳。', type: 'description' }
        ],
        finalText: '——— 结局·例外（道侣·归隐）———'
    },
    'song_ending_磨勘': {
        id: 'song_ending_磨勘', npcId: SONG_NPC_ID, title: '结局·磨勘', icon: '📜',
        route: '磨勘',
        scenes: [
            { speaker: 'narrator', text: '一年一会，成了你们之间的定约。卷宗库的灯下，历年重核之夜，多一个人同勘——他读，你听；错处你指，他记，记完两人各归各路，来年再会。', type: 'description' },
            { speaker: 'npc', text: '「今年你指了我三处错。」勘罢他封卷，难得多评了一句，「两处是笔误。一处——是九年前判重了半等。这一处，我补了判词。」他顿了顿，「补判词比判错难。难的事，都是你逼出来的。谢，记档。」', type: 'description' },
            { speaker: 'narrator', text: '有人问他，你算他什么人。他想了很久，答：「勘档的人。」答完觉得四个字不够，又核了一遍，补了八个字：「一生之误，许他三处。」', type: 'description' }
        ],
        finalText: '——— 结局·磨勘（挚友·同行）———'
    },
    'song_ending_同寮': {
        id: 'song_ending_同寮', npcId: SONG_NPC_ID, title: '结局·同寮', icon: '🍵',
        route: '同寮',
        scenes: [
            { speaker: 'narrator', text: '你成了执法堂的常客。案侧那张常座，嵩山上下没人敢坐——不在灯下，不在风口，在灯光刚好照得到的地方。首座留的位子，条令里查无此项，堂里人人遵守。', type: 'description' },
            { speaker: 'narrator', text: '他来你就沏茶，他核档你就听档。可以说话，也可以不说话。新弟子私下管你们叫「执法堂的两盏灯」——一盏精确，一盏温。', type: 'description' },
            { speaker: 'npc', text: '有一夜他核完档，指着你跟新入堂的弟子说：「这位——堂中常座。比上符还靠得住。」说完自己愣了愣，像在核这句是不是玩笑，核完，决定算数，又给你续了一盏茶。', type: 'description' }
        ],
        finalText: '——— 结局·同寮（挚友·归隐）———'
    },
    'song_ending_废例': {
        id: 'song_ending_废例', npcId: SONG_NPC_ID, title: '结局·废例', icon: '💔',
        route: '废例',
        scenes: [
            { speaker: 'narrator', text: '他烧了那一页纸。灰烬冷透之后，他把铜盆刷洗干净，归回原处——做事有始有终，连心死都死得合乎条理。', type: 'description' },
            { speaker: 'narrator', text: '《执法堂新章》重新誊订，第一百零八条整条削去，通章只剩一百零七条。执事堂来文问过一句「何以删条」，他批复四个字：查无实据。', type: 'description' },
            { speaker: 'narrator', text: '那半枚下符，他没有讨回。执法之人最讲规矩——给出去的东西，从不讨回。只是卷宗库「未结」格里，那册薄卷宗封了口，火漆压符，归档为「永不启」。', type: 'description' },
            { speaker: 'npc', text: '传功长老问过一回：为何废例。他正在归架卷宗，答得平静：「例外要两心相合。合不上，立着就是伪档——执法堂不存伪档。」长老叹了口气，走了。此后历年重核之夜，库灯照旧亮到五更，掌灯的位置空着，谁也不许站。', type: 'description' }
        ],
        finalText: '——— 结局·废例（辜负）———'
    },
    'song_ending_空衙': {
        id: 'song_ending_空衙', npcId: SONG_NPC_ID, title: '结局·空衙', icon: '🌫️',
        route: '空衙',
        scenes: [
            { speaker: 'narrator', text: '你下山之后，执法堂的灯照旧夜夜亮，条文照旧条条核，历年重核照旧一夜不落。什么都没变，像什么都不曾有过。', type: 'description' },
            { speaker: 'narrator', text: '只是《新章》第一百零八条永远空着。有人说首座大人忘了补，他不解释——条名「例外」两个字挂着，条文空白，一挂就是很多年。', type: 'description' },
            { speaker: 'narrator', text: '那半枚下符还在你手里。他从不讨回，也从不提起。只有每年重核之夜，库灯亮到五更，他会把那页写着「此人经过嵩山，山记得」的档册调出来，核一遍，归架，再核一遍——像一桩永远核不完的案。', type: 'description' },
            { speaker: 'npc', text: '新入堂的弟子问老书办：首座大人的新章，为何留一条空白？老书办搁下笔，压低声音：「那不是空白。那是衙门口的石阶——位子留好了，人没来坐。衙还开着，就是空了。」', type: 'description' }
        ],
        finalText: '——— 结局·空衙（错过）———'
    }
};

// ============ 性别语境事件（femctx 女玩家 / mctx 男玩家，互斥） ============
var SONG_GENDER_CTX_EVENTS = {
    // 女玩家：卷宗库档房老妪的提醒
    'song_event_femctx': {
        id: 'song_event_femctx', npcId: SONG_NPC_ID, title: '档房阿婆的话', icon: '🌸',
        desc: '执法堂管档三十年的阿婆把你叫住，压低了声音。',
        minAffection: 55, trigger: { random: 0.35 }, cooldown: 0, flag: 'song_e_femctx_done',
        requirePlayerFemale: true,
        autoTrigger: { location: '嵩山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '卷宗库管档的阿婆把你叫住了。老人家在执法堂理了三十年档，看着逵佩南从跟着养父上山的沉默少年，熬成了条令比谁都熟的执法首座——堂里哪一册档动过，都瞒不过她的眼睛。', type: 'description' },
            { speaker: 'npc', text: '「姑娘。」她压低声音，朝「未结」格努努嘴，「首座给你立了一册卷宗。老身理档三十年，头一回见『永不结』的卷。」她掰着指头，「封皮上就三个字。里头写的什么，老身不敢翻——只知道越来越厚，快赶上南边那桩旧案了。」', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「结不结案，阿婆去问立卷的人——问我做什么。」', effect: 'tease', affection: 8 },
                { text: '「那册卷宗里，都记了些什么？」', effect: 'thick', affection: 7 },
                { text: '「阿婆，条文说『档不隔年』——我这一册，记到哪一年？」', effect: 'year', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'tease': aff = 8; msg = '阿婆连连摆手，笑得皱纹都挤到一处：「老身可不敢问。问了他要多核三夜档——上月盟旗演武台，你当众替他指正了一路剑，他愣了半晌，就说了两个字：『记档。』当晚卷宗库的灯亮到五更。」她朝你眨眨眼，「姑娘，老身什么都没说。你自个儿瞧去。」'; break;
                case 'thick': aff = 7; msg = '阿婆凑近了些，声音压得更低：「记的可全了——你入门头一日先动的那一拳，替库甲掌的灯，石阶上沏的茶，一页一页，判词的格式，比堂上的公文还工整。」她直起腰叹气，「老身理了三十年档，头一回见有人把日子过成卷宗，还把卷宗过得像日子。」'; break;
                case 'year': aff = 6; msg = '阿婆一怔，随即笑出了声，又赶紧捂嘴：「姑娘这一问问到根上了。」她朝库门那边望了望，声音低得几乎听不见，「档不隔年，是他自己定的例。你这一册——他在年款那一栏写的是一个字，不是年份。老身瞅见过一回，是个『永』字。三十年了，头一回见这个字入档。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // 男玩家：嵩山同门间的流言
    'song_event_mctx': {
        id: 'song_event_mctx', npcId: SONG_NPC_ID, title: '演武台外的议论', icon: '🍃',
        desc: '盟旗演武台外，几个嵩山弟子压低了声音。',
        minAffection: 55, trigger: { random: 0.35 }, cooldown: 0, flag: 'song_e_mctx_done',
        requirePlayerMale: true,
        autoTrigger: { location: '嵩山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '盟旗演武台外，几个嵩山弟子凑在一处，见你过来，声音忽然压低——低得又不够彻底。', type: 'description' },
            { speaker: 'npc', text: '「他教你十七路剑了？」大师兄模样的摇头，「上一回他给人拆招，还是盟主亲自考校的时候。嵩山剑『正』字诀，他一路一路喂——你们知道这意味着什么？」', type: 'description' },
            { speaker: 'npc', text: '「这还不算。」最小的那个把声音压得更低，「他腰间那半枚执法符，多少年不离身，听说连执事堂调用都要过他的手。前几日有人瞧见，他把符解下来给人看了一整夜。还有——卷宗库的灯，今年夜夜多亮一个时辰。你们说，这是什么意思？」', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「什么意思，他自己会说。轮不到旁人猜。」', effect: 'defy', affection: 8 },
                { text: '「诸位，演武台走一场——输的替执法堂搬一日档。」', effect: 'spar', affection: 7 },
                { text: '「就是你们想的那个意思。我不忌讳。」', effect: 'own', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'defy': aff = 8; msg = '几个弟子面面相觑，大师兄起身拱手：「……有理。」他让开路，「首座执条九年，条下没冤过一个人。兄台稳，我们放心。」自此嵩山弟子见你都客客气气，流言改成了敬语——这话后来传到他耳朵里，他只批了两个字：合例。'; break;
                case 'spar': aff = 7; msg = '演武台一场，你赢了两招。最小的那个搬档搬得龇牙咧嘴，忽然回头：「兄台的剑，有首座那路『正』字诀的意思——又收得住。」你笑而不答。那路剑，那分收得住，都是演武台上一路一路喂出来的；你本来也没打算瞒谁。搬完档，执法堂的茶水间多了一个人常坐。'; break;
                case 'own': aff = 6; msg = '满场一静。最小的把刚喝的茶喷了半口。大师兄盯着你看了半晌，忽然深深一揖：「……好胆。这话，我记下了。」次日流言就停了——不是压下去的，是满派都知道了：那个人自己认的。又过了几日，执法堂新批的条令末尾，多了一行谁也没见过的小注：言之有据者，不问出身。'; break;
            }
            return { affection: aff, msg: msg };
        }
    }
};

// ============ 合并进总事件池 ============
if (typeof NPC_PERSONAL_EVENTS !== 'undefined') {
    Object.assign(NPC_PERSONAL_EVENTS, SONG_MAIN_EVENTS);
    Object.assign(NPC_PERSONAL_EVENTS, SONG_GENDER_CTX_EVENTS);
}

// ============ 注册结局集与副作用回调 ============
if (typeof registerEndingSet === 'function') {
    registerEndingSet(SONG_NPC_ID, SONG_ENDINGS);
}
if (typeof registerEndingCallback === 'function') {
    registerEndingCallback(SONG_NPC_ID, function(endingName, npc) {
        if (endingName === '携令' || endingName === '例外') {
            if (npc && typeof npc.setFlag === 'function') npc.setFlag('dao_companion');
            if (window.showMessage) window.showMessage('⚖️ 你与逵佩南结为道侣！嵩山剑理与执法条令感悟大幅提升', 'success');
        } else if (endingName === '磨勘' || endingName === '同寮') {
            if (npc && npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 30);
            if (window.showMessage) window.showMessage('⚖️ 你与逵佩南成了勘档论条的知己', 'success');
        } else if (endingName === '废例') {
            if (window.showMessage) window.showMessage('📜 逵佩南烧了第一百零八条。执法的人一生只写一个例外——他亲手废了', 'error');
        }
    });
}

// ============ 自动触发 + 每日钩子（复用 maybeAutoTriggerPersonalEvent） ============
function maybeAutoTriggerSongEvent(source) {
    return maybeAutoTriggerPersonalEvent(SONG_NPC_ID, source, { finalEvents: ['song_event_013'] });
}

if (typeof window !== 'undefined' && window.timeSystem && window.timeSystem.onNewDaySubscribe) {
    window.timeSystem.onNewDaySubscribe(function() {
        try {
            if (window.currentCharData && window.currentCharData.location === '嵩山派') {
                maybeAutoTriggerSongEvent('daily');
            }
            // 性别语境：每日在该派过夜 + 对应性别 + 好感≥55 + 未触发
            if (!window.currentCharData || !window.npcManager) return;
            var loc = window.currentCharData.location || '';
            if (loc !== '嵩山派') return;
            var npc = window.npcManager.getNPC ? window.npcManager.getNPC(SONG_NPC_ID) : null;
            if (!npc) return;
            var aff = (npc.relationship && npc.relationship.affection) || 0;
            if (aff < 55) return;
            var isF = window.currentCharData.gender === 'female';
            var ctxId = isF ? 'song_event_femctx' : 'song_event_mctx';
            if (typeof hasEventTriggered === 'function' && hasEventTriggered(ctxId)) return;
            var ev = NPC_PERSONAL_EVENTS[ctxId];
            if (!ev) return;
            if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npc)) return;
            setTimeout(function() {
                if (document.querySelector && document.querySelector('.personal-event-modal')) return;
                if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npc)) return;
                if (typeof triggerPersonalEvent === 'function') triggerPersonalEvent(ctxId);
            }, 1200);
        } catch (e) { console.warn('[逵佩南线] 每日触发失败:', e); }
    });
}

// ============ 导出 ============
if (typeof window !== 'undefined') {
    window.SONG_MAIN_EVENTS = SONG_MAIN_EVENTS;
    window.SONG_ENDINGS = SONG_ENDINGS;
    window.maybeAutoTriggerSongEvent = maybeAutoTriggerSongEvent;
}

// 扩展男主名册（逵佩南入册，吃醋对峙/和好两桩由 male-lead-*.js 稍后接线，名册 push 先行）
if (typeof window !== 'undefined' && window.MALE_LEAD_ROSTER && window.MALE_LEAD_ROSTER.push) {
    window.MALE_LEAD_ROSTER.push({ id: SONG_NPC_ID, name: '逵佩南', sect: '嵩山派', eventId: 'song_event_rival', reconcileId: 'song_event_reconcile', femctxId: 'song_event_femctx', mctxId: 'song_event_mctx' });
}
console.log('[逵佩南线] 嵩山派感情线加载完成：结局 ' + Object.keys(SONG_ENDINGS).length + ' 个 + 主线事件 ' + Object.keys(SONG_MAIN_EVENTS).length + ' 个 + 性别语境 ' + Object.keys(SONG_GENDER_CTX_EVENTS).length + ' 个');
