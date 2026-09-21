// ==================== hengshan-beiyue-events.js - 祁清禅线情缘事件/结局/性别语境 v1.0（恒山扩线） ====================
// 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / registerEndingSet / registerEndingCallback /
//       hasEventTriggered / checkEventTrigger / triggerPersonalEvent / canPlayerAccessPersonalEvent）
//       npcs/npc-system.js（executeEmotionInteraction 已加 bond_dao 拦截）
// 加载顺序：在 npc-personal-events.js 之后
// 女主·祁清禅（恒山派白云庵戒律首座、定逸师太关门弟子，约二十一岁，庵中最年轻的执戒人）。
// 说话轻而缓，端方自律，偶用佛语但不说教。与定逸师太（掌门长辈，闭关清修，正典不改）并存：
// 师太是掌门，清禅是年轻接班人、代掌戒律堂——不越位。
// 心口的事：她抄了六年的《华严经》临近抄完，回向页空了六年——头一回把一个俗家名字抄了进去，是玩家的。
// 感情线是「戒与人心」的拉扯，收束克制：不还俗，守着庵堂，也守着世间一个人。
// 随身物：敲旧的木鱼（铜锔细裂）、那页抄经纸（回向页）。信物是敲旧的木鱼与回向页。
// 织入恒山既有意象：晨钟清课（sect-exclusive-events）、绝壁采药/见性峰白云草（deep-data）、
// 香道护香·携棍不携刀/功德碑不刻名（sect-story-arc）、正殿漏雨·本地松木（story-arc）、见性峰静室（facilities）。
// 男女玩家皆可追，主线共享（代词按性别），各有专属性别语境事件（femctx/mctx）。

var HENG_NPC_ID = 'sect_leader_恒山派';

// ============ 主线事件（heng_event_001 ~ 011 + 终章 013） ============
var HENG_MAIN_EVENTS = {
    'heng_event_001': {
        id: 'heng_event_001', npcId: HENG_NPC_ID, title: '晨钟', icon: '🌅',
        desc: '白云庵的晨钟里，最年轻的戒律首座在敲一只很旧的木鱼。',
        minAffection: 12, trigger: { random: 0.4 }, cooldown: 0, flag: 'heng_e001_done',
        autoTrigger: { location: '恒山派', random: 0.45 },
        scenes: [
            { speaker: 'narrator', text: '你头一遭上恒山，天没亮就到了白云庵。山门朝东，晨钟一声一声落下来，正殿里一排灰衣尼众肃立清课，诵经声如潮。队首一个年轻尼众敲着木鱼——那木鱼很旧，漆磨尽了，露出温润的木纹，可每一声都稳，不急不缓，满殿的经声都跟着她的手腕走。', type: 'description' },
            { speaker: 'npc', text: '清课散，她收木鱼，转身看见立在殿外的你，停下，微微合掌：「晨钟不拒晚来的人。施主要上香，请进殿。」她的声音很轻，很缓，像怕惊动了殿里的什么。' },
            { speaker: 'narrator', text: '你这才知道她叫祁清禅，定逸师太的关门弟子，白云庵的戒律首座——庵里最年轻的执戒人，也是最轻声说话的一个。弟子们私下说：首座的规矩最严，话最轻。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '立在檐下，把余下的半卷晨课听完，再进殿', effect: 'listen', affection: 8 },
                { text: '问那只木鱼：「它看起来，比殿里那只新木鱼旧得多」', effect: 'ask', affection: 7 },
                { text: '笑：「我是来赶恒山晨景的，不想景在殿里。」', effect: 'jest', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'listen': aff = 8; msg = '你没进殿，立在檐下把半卷晨课听完。经声起起落落，木鱼声声稳稳，听到最后一声收住，你才合掌进门。下石阶时你发现她立在阶侧，旧木鱼抱在袖中：「肯把课听完的人，不是赶香的。」她想了想，又说，「施主下回来，直接进殿——不必过知客。」白云庵认人，就认这一立。'; break;
                case 'ask': aff = 7; msg = '她低头看了看手中木鱼，指腹在那道铜锔的细裂上停了停：「旧物。跟我的年头，比殿里那只新的长。」话说得轻，没有多讲，可她也没有走。晨雾未散，你们在殿檐下站了一小会儿，她把清课的次第说给你听——哪一卷先，哪一卷后，哪一声该缓，哪一声该停。说完她轻声道：「规矩也是一样的。学会了，就不觉得严。」'; break;
                case 'jest': aff = 5; msg = '她没有脸红，也没有恼，只微微偏头，像认真想了想这句话：「景在殿里，也在殿外。」她把木鱼收好，「你若为景来，清课那一炷香，是一日头一景——施主来得正好。」话说得平平的，可后来知客的师侄引你入座，给你留的是檐下头一排——那个位置，看得见晨钟，也看得见正殿。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'heng_event_002': {
        id: 'heng_event_002', npcId: HENG_NPC_ID, title: '门槛', icon: '📿',
        desc: '戒律首座的规矩，说得比晨雾还轻，可一动不动。',
        minAffection: 18, trigger: { random: 0.35 }, cooldown: 0, flag: 'heng_e002_done',
        requireEventDone: 'heng_event_001',
        autoTrigger: { location: '恒山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '你进偏门时赶得急，一脚踩上了门槛；过抄经堂，又顺手扶了一把门框。没有人喝止你——可当晚的戒堂记录上多了一笔，字很小，很工整：「俗客踩门槛一次，扶门框一次。」', type: 'description' },
            { speaker: 'npc', text: '「门槛是庵堂的肩膀。」第二天她在石阶上拦住你解释，语气轻得像在说天气，「要跨，不要踩。门框是殿的脊背——扶它，它会疼。」说完她像是怕讲重了，顿了顿，补了一句，「戒不是捆人的。是安心的。安放了，人就自在。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '受教，请她把在家居士的一整套规矩讲给你听', effect: 'learn', affection: 7 },
                { text: '「戒是安心的」——请她把这四个字讲透', effect: 'probe', affection: 6 },
                { text: '笑：「规矩套规矩，白云庵连走路都要管？」', effect: 'mock', affection: -4 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'learn': aff = 7; msg = '她真的讲了。从进山门先迈哪只脚，到上香的次序，到哪些殿可进、哪些檐下止步——她讲得很慢，讲一句，问一句你可听明白。讲完她在一张裁剩的经纸上给你写了张小条，字迹是小楷，端端正正。「不必一次记全。」她把笔收好，「戒，从不催人。」后来你进出白云庵，脚步有了分寸。她看在眼里，什么也不说，只是那晚的戒堂记录上，少了一笔。'; break;
                case 'probe': aff = 6; msg = '她在石阶上想了很久，山风把袖口吹得轻轻动，她也不理会。「我七岁进山，」她说，「晨课总起得太早，心浮，坐不住。师父不骂，只敲木鱼——木鱼慢下来，我的心就跟着慢下来。」她抬眼看你，「心是会跑的。戒，是给它一个安放的地方。安放了，人就稳。」说完这么多，她忽然止住，合掌，「多言了。」可往后她见你，话就多出一两句来。'; break;
                // 真负选项：戒律是她安身立命之处，笑规矩琐碎，等于笑她这半生端着的安放
                case 'mock': aff = -4; msg = '她的话在半途停住。她没有辩，只把袖中那张写好的小条，慢慢折起来，收了回去：「规矩管走路，也管心。」她微微合掌，下了石阶，灰衣的背影很直。后来许久，她见你礼数周全，那张小条却再没有拿出来过——你很久以后才从知客的师侄口中知道：那晚戒堂的记录上添了一笔，「执戒者，言语失当一次」。她把这笔记在了自己名下。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'heng_event_003': {
        id: 'heng_event_003', npcId: HENG_NPC_ID, title: '敲旧的木鱼', icon: '🪵',
        desc: '她随身那只木鱼，漆磨尽了，裂口用铜锔锔着。',
        minAffection: 25, trigger: { random: 0.35 }, cooldown: 0, flag: 'heng_e003_done',
        requireEventDone: 'heng_event_002',
        autoTrigger: { location: '恒山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '你留意到她那只旧木鱼。大殿清课用的是新的大木鱼；这只小的，她随身带——鱼身磨得能照见人影，侧面一道细裂，用两枚铜锔锔着，敲击处凹下去浅浅一层，是年复一年敲出来的。', type: 'description' },
            { speaker: 'npc', text: '傍晚你经过静室窗下，听见里面木鱼声声，不疾不徐。窗纸上映着她端坐的影子，木鱼搁在膝头，敲击声很轻，像怕惊动山里的暮色。挑水的小师侄低声告诉你：首座的晚课六年没有断过，风雨无阻——这只木鱼，是她受具足戒那天，定逸师太亲手给她的。', type: 'description' },
            { speaker: 'npc', text: '她听见窗外的脚步，敲击声没有乱，也没有抬头：「施主要听课，进来坐。外头风大。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '推门进去，陪她坐完这一整段晚课', effect: 'sit', affection: 7 },
                { text: '问那两枚铜锔：「裂口，是什么时候裂的？」', effect: 'ask', affection: 6 },
                { text: '推门就去拿木鱼：「给我听听，跟殿里那只一个声么」', effect: 'grab', affection: -5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'sit': aff = 7; msg = '你进去坐了。晚课很长，木鱼声很轻，山里的夜一寸一寸从声音的缝隙里漏进来。课毕她收木鱼：「施主坐得住。」她给你斟了盏温水，是见性峰的白云草茶，「坐得住的人不多。坐得住，说明心里有个安放的地方。」茶是热的，两人没有多话，可你走时，她提着灯送到了院门——白云庵的晚课，从不送客。这是头一回。'; break;
                case 'ask': aff = 6; msg = '她的指腹在铜锔上停了停。「带课第三年，敲重了。」她说得很平，像在讲别人的事，「声音裂了。师太没有责我，只找人锔了它——锔好还我，说了一句：木鱼不怕裂，怕停。」她抬眼看你，「从那天它敲到今天。裂还在。在就在着罢。」她重新抱起木鱼，「人也是一样。裂过的地方，锔住了，比原先还结实。」'; break;
                // 真负选项：木鱼是师太亲手所授、安她六年晚课的心，伸手去夺等于掀她的静
                case 'grab': aff = -5; msg = '你的手伸到一半，她先把木鱼放下了——放得很轻，很稳，可覆在木鱼上的手没有收。「木鱼不是玩器。」她声音还是轻的，一个字一个字却压得很稳，「它安的是心。心被惊了，声就散了。」她把木鱼收进袖中，那晚的晚课提早收了灯。之后一个月，静室的晚课窗纸里多掩了一层布帘——你很久以后才明白：她护的不是木鱼，是木鱼声里那一点静。那一点静，经不起谁伸手就来、随手就敲。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'heng_event_004': {
        id: 'heng_event_004', npcId: HENG_NPC_ID, title: '抄经夜', icon: '📜',
        desc: '深夜的抄经堂还亮着灯，有一页纸始终扣着。',
        minAffection: 32, trigger: { random: 0.3 }, cooldown: 0, flag: 'heng_e004_done',
        requireEventDone: 'heng_event_003',
        autoTrigger: { timeRange: [21, 3], location: '恒山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '深夜，抄经堂的灯还亮着。你起来饮水，隔窗看见灯下那个端坐的身影——祁清禅在抄经，脊背很直，运笔很匀。案头抄好的经页摞成一函一函，边角齐得像用刀裁过。', type: 'description' },
            { speaker: 'npc', text: '「《华严经》，抄了六年。」她搁笔见礼，一点也不惊讶，像早知道窗外有人，「不剩几卷了。顺的话，年内能圆满。」案头有一页纸扣在镇纸下，与经页分开放着——看不见上面写了什么。' },
            { speaker: 'narrator', text: '你注意到：她说别的事，话都很轻；说到这部经，话里就有一点分量。那页扣着的纸，她整理经函时绕着走，连衣袖拂过都要留意。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '挽袖研墨，陪她坐完这一夜', effect: 'ink', affection: 8 },
                { text: '脱下外袍掩住漏风的窗缝，替她把灯添满油', effect: 'robe', affection: 7 },
                { text: '趁她起身添灯油，掀开镇纸下那页扣着的纸', effect: 'peek', affection: -4 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'ink': aff = 8; msg = '你研墨。墨香在灯下慢慢浓起来，她抄她的经，你添你的墨，一夜几乎没说什么话。灯芯爆了一下，她忽然停笔：「抄经六年，没有人陪我坐过夜。」这话说得极轻，说完又低头抄经——可那一夜的字，比平日丰润了些。天将亮她收笔，把半盏放温的白云草茶推给你：「墨研得好。往后……不必熬夜来陪。」话是推的，可第二夜你再经过抄经堂，那盏灯，明显挑得亮了些。'; break;
                case 'robe': aff = 7; msg = '你把外袍掩上窗缝，风止了，灯焰直了。她抬头看了看外袍，又看看你，没有道谢，只把案往窗的反方向挪了半尺，重新运笔。天亮你走时，外袍被叠得整整齐齐还回来，袍子上压着一小包晒干的白云草茶。「驱风寒的。」她说，「山里夜凉。往后睡不着，别在窗外站着——要听课，进堂里来坐。」'; break;
                // 真负选项：那页扣着的纸是她六年里唯一不肯示人的心事，掀它等于掀她的心
                case 'peek': aff = -4; msg = '你的指尖刚碰到纸角，身后木鱼声停了——你没有听见她走过来。「施主。」她的声音还是轻的，可那份轻沉到了底，「扣着的东西，有它扣着的道理。」她收回那页纸，把你碰过的纸角一寸一寸抚平，重新压在镇纸下，然后立在灯边，等你出去。她没有熄灯，也没有再抄。那一夜抄经堂的灯亮到天明，往后半个月，她抄经的时辰改到了白天——窗纸上映着的那个影子，坐得比从前更直。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'heng_event_005': {
        id: 'heng_event_005', npcId: HENG_NPC_ID, title: '香道', icon: '🥾',
        desc: '十五护香，恒山的规矩：携棍，不携刀。',
        minAffection: 40, trigger: { random: 0.3 }, cooldown: 0, flag: 'heng_e005_done',
        requireEventDone: 'heng_event_004',
        autoTrigger: { location: '恒山派', random: 0.42 },
        scenes: [
            { speaker: 'narrator', text: '十五香期。白云庵有个老规矩：弟子随行护送香客，携棍不携刀——慈悲门里，不出刀。你随祁清禅下山，香客的队伍前后十几人，她持一根棍走在头里，不快，也不慢。', type: 'description' },
            { speaker: 'npc', text: '香道上，一位背着沉重供篮的老妇渐渐落了后，喘着，在路边石上坐下来歇。队伍往前走了几步，停住——她等人，从不催人。' },
            { speaker: 'narrator', text: '崖上偶有人探头探脑——当年抢香客的山寇散伙了，余党却没有绝。她抬眼望了一望，持棍的手紧了半分，话仍旧轻轻的：「不急。日落前，到得了山下。」', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '回身接过老妇的供篮，扶她走完最陡的那一段', effect: 'carry', affection: 8, item: 'spirit_grass' },
                { text: '走在队尾，眼睛盯着崖上，替她罩住整支队伍', effect: 'guard', affection: 7 },
                { text: '「一队人不能为一个老婆婆耽搁——让她慢慢走，后头赶上就是」', effect: 'hurry', affection: -3 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '', item = null;
            switch (choice) {
                case 'carry': aff = 8; item = { id: 'spirit_grass', count: 2 }; msg = '你接过供篮，扶老妇走完最陡的一段石阶。到了平路，老妇从篮底摸出两个白云草香囊，硬塞给你一个：「娃儿，菩萨看着你。」队伍在日落前到了山下，一个也没落下。回程祁清禅走在你身侧，忽然说：「恒山的香道走了这些年，功德碑添了几块——都没有刻名字。」她看你一眼，「帮人的人不留名。被帮的人记着，就够了。」进山门前，她把一包晒好的白云草塞给你，「药圃里采的。泡茶，安神。」'; break;
                case 'guard': aff = 7; msg = '你走在队尾，眼睛不离崖上。有两回崖上的影子动了动，你咳嗽一声，影子就缩了回去。到山下老妇上了香，你在殿外等队伍，她持棍出来，看了你一眼：「崖上，你看了全程。」不是问话。回程她放慢半步，与你并走了一段——护香的首座从不与人并走。那天，破了一回例。走过功德碑时她停了停：「碑上不刻名。刻名的念头一起，护香就护不长了。」'; break;
                // 真负选项：恒山护香「不催人」是慈悲门的根，「为一人耽搁」正戳她信了一辈子的东西
                case 'hurry': aff = -3; msg = '她站住了，回头看你。那一眼很静，静得你把后半句话咽了回去。「队伍不为一个人耽搁？」她说得很慢，「那队伍做什么用。」她自己回身去，接过供篮，扶老妇走完了最陡的一段。到山下，老妇谢了又谢，她念了声佛号；回程经过你身边，她没有说话。后来香道上她仍旧持棍走在头里，只是你的位置，从她身侧挪到了队尾——挪得很客气，也很稳，像一条写进了章程的规矩。'; break;
            }
            return { affection: aff, msg: msg, item: item };
        }
    },
    'heng_event_006': {
        id: 'heng_event_006', npcId: HENG_NPC_ID, title: '回向页', icon: '🪷',
        desc: '她把那页扣了六年的纸，翻了过来。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'heng_e006_done',
        requireEventDone: 'heng_event_005',
        autoTrigger: { location: '恒山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '晚课毕，她把你留在抄经堂。灯下，六年的《华严经》经函摞得整整齐齐，她把手按在最上一函，很久没有说话——像在那里掂一样很重的东西。', type: 'description' },
            { speaker: 'npc', text: '「六年前起笔的时候，我想：经抄圆满，回向十方众生。」她取出那页始终扣着的纸，这一次，当着你的面翻了过来，「经文停在半页。剩下的半页，我空了六年。」' },
            { speaker: 'narrator', text: '灯下你看得清楚：那半页空白里，端端正正写着一个俗家的名字——你的名字。墨迹深深浅浅，分明不止写过一遍，也不止想抹过一遍。', type: 'description' },
            { speaker: 'npc', text: '「抄经一辈子，最后一页是回向页。」她的声音轻得像常，只有捏着纸边的指尖收紧了些，「我头一回抄进去一个俗家的名字。不该的。可我每回想抹，笔就落不下去。」' },
            { speaker: 'player_select', text: '你如何回应？（这一桩，没有对错，只有听法）', options: [
                { text: '「那就别抹。留白也是经——名字在，经还是经。」', effect: 'vow', affection: 9 },
                { text: '什么都不说，陪她坐完这一炷香', effect: 'stay', affection: 8 },
                { text: '「回向里有名字——众生两个字，才不是空的。」', effect: 'echo', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'vow': aff = 9; msg = '她看了你很久。灯芯爆了一下，她低下头，把那页纸重新抚平，压回镇纸下——这一次，是正面朝上的。「留白也是经。」她重复了一遍，很轻，像怕惊动纸上的字，「六年了。戒本里说，回向要清净。没有人对我说过——名字也可以留着。」她熄了灯。黑暗里你听见她念了一声佛号，那一声佛号念得比晚课里哪一声都慢，尾音里有一点极轻、极轻的松。'; break;
                case 'stay': aff = 8; msg = '你没说话。香一寸一寸烧下去，她坐在案的另一边，那页纸摊在两人中间，谁也没有去碰。香尽时她把纸收起来，动作很慢：「头一回写下这个名字的夜里，我一个人坐到天明。」她抬眼看你，「今天坐着，是两个人。不一样。」她没有说不一样在哪里。可从这天起，她抄经的时辰又挪回了夜里——窗下那盏灯，重新为你亮着，镇纸下的纸，不再扣着了。'; break;
                case 'echo': aff = 7; msg = '她捏着纸的手轻轻颤了一下。她低头看那个名字，看了很久，再抬眼时，眼里有一点灯照不亮的东西。「众生不是空的。」她一个字一个字说得很慢，像把这几个字一笔一笔写在纸上，「起笔的时候，我以为名字是挂碍。你是头一个对我讲——名字也可以是经。」她把那页纸折好，收进经函最上一层，「这句话，我记进回向里。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'heng_event_007': {
        id: 'heng_event_007', npcId: HENG_NPC_ID, title: '绝壁采药', icon: '🌿',
        desc: '见性峰药圃后的绝壁上，一个小师妹滑了脚。',
        minAffection: 55, trigger: { random: 0.3 }, cooldown: 0, flag: 'heng_e007_done',
        requireEventDone: 'heng_event_006',
        autoTrigger: { location: '恒山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '见性峰的药圃在峰后绝壁上，白云草入秋熟，根扎在崖壁的缝里。采药的小师妹滑了脚——半个身子悬在崖外，一只手抓着一根老藤，药篓已经掉下去，在崖壁上弹了两下，没了影。', type: 'description' },
            { speaker: 'npc', text: '祁清禅已经赶到崖边。棍横放下，绳索往腰间系，话仍旧轻，可一个字一个字都咬得稳：「藤是三年的藤，吃得住一个人，吃不住两个。我下去——崖上替我拉住绳，看住藤，报给我。」', type: 'description' },
            { speaker: 'narrator', text: '崖风从下面往上灌，藤在响。崖上的弟子们都白了脸；她已经转身攀下了崖壁，背影很稳。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '系上副绳跟着下去，她解藤，你托人', effect: 'climb', affection: 11 },
                { text: '钉在崖边拉绳，盯住藤，一寸一寸报给她', effect: 'hold', affection: 8 },
                { text: '喊聚采药的弟子，众人合力压绳打桩', effect: 'rally', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'climb': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 11) : { ok: true };
                    if (!_py.ok) { aff = 4; msg = '你要系绳，眼前却先黑了一黑——连日护送香道、夜里陪课，你的气力早掏空了。她把你从崖边推回来，手很稳，眉头却拧着：「拉绳的人先倒了，崖下的人靠谁。」她自己下了崖，一刻钟后背着人上来。安置好师妹，她回头看你还站在崖边，话仍旧轻：「回去歇。崖上风大，不要站在这里等。」走时把她腕上那只白云草香囊解下来塞给你——安神的。（精力不足，那一崖你先撑不住了）'; break; }
                    aff = 11; msg = ('崖风像刀。你们两人一寸一寸往下挪——她解藤，你托人；藤断的那一瞬，你把小师妹按进崖壁的凹处，自己指头抠进石缝里，血渗出来也没有松。上到崖顶，满队的人瘫在地上。她先点人：一个，不少。再回头点你的十根指头，点得很慢，点完取出袖里的药，一笔一笔替你上：「跟着我下崖的人，今日你是头一个。」顿了顿，又很轻地添了半句，「也是最后一个——我不想有第二个。」') + '（精力-11）'; break; }
                case 'hold': aff = 8; msg = '你钉在崖边拉绳，盯着那根藤：「藤偏了半尺！」「风来了，等一等！」她在崖壁上一声声应着，字字都稳。人背上来时，小师妹跪在崖顶哭，她先收了绳，盘好，才来看你的手——掌心两道勒红的印子。「拉绳拉得稳的人，」她替你上药，话很轻，「比下崖的还要紧。绳稳，心就稳。」从这天起，庵里护送、采药，凡她到崖边，手里的绳，都放心交给你拉。'; break;
                case 'rally': aff = 7; msg = '你喊聚了七八个采药的弟子，打桩压绳，全队一齐往回收——她在崖壁上护住人，崖上一寸一寸地拉。人上来时满队瘫在地上，风还在灌。她第一个起身，理了理衣上的土，朝崖上众人一个一个合掌：「今日之功，在诸位。」当晚的戒堂记录上多了一行字，很工整：「见性峰采药，坠一人，众救之——记其法，以备后来。」写你名字的那一笔，落在「法」字旁边，比抄经的字还要稳些。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'heng_event_008': {
        id: 'heng_event_008', npcId: HENG_NPC_ID, title: '漏雨夜', icon: '🌧️',
        desc: '暴雨夜，藏经阁的老漏点又开了——那里放着六年的经函。',
        minAffection: 62, trigger: { random: 0.3 }, cooldown: 0, flag: 'heng_e008_done',
        requireEventDone: 'heng_event_007',
        autoTrigger: { timeRange: [22, 4], location: '恒山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '秋雨暴作的夜。正殿翻修过了，梁用的本地松木，可藏经阁的老漏点又开了——雨水顺着瓦缝渗下来，正对着阁里那一架经函。架上是她抄了六年的《华严经》，一函一函，全是她的心血。', type: 'description' },
            { speaker: 'npc', text: '祁清禅已经在阁里了。经函一摞一摞往干处搬，灯点不着，她用袖子护着一点火种。见你冲进来，她头也不抬，话轻而不乱：「架上还余六函。漏点就在头顶——先盖油布，再搬。纸怕水，也怕颠。」', type: 'description' },
            { speaker: 'narrator', text: '屋顶的漏点在变大，雨要是下到黎明，六函经就保不住了。阁外雨声如瀑，阁里只有一点护在袖中的火。', type: 'description' },
            { speaker: 'player_select', text: '你必须立刻做点什么。', options: [
                { text: '冒雨上房，用瓦和油布把漏点压死', effect: 'roof', affection: 12 },
                { text: '依她的话搬纸，一函一函过手，压稳在干处', effect: 'carry', affection: 9 },
                { text: '把阁里能点的灯尽数点起，替她数函、盯漏点', effect: 'lamps', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'roof': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 12) : { ok: true };
                    if (!_py.ok) { aff = 5; msg = '你攀上檐口，雨里的瓦滑得站不住，腿一软险些栽下去——是她扔了怀里的经函接住你，把你拖回檐下。「纸湿了能晾，」她声音哑着，按着你肩的手微微发抖，「人摔了，接不回来。」那一夜她一个人把六函经抱到干处，压上油布，守到天明。第二天你帮她一函一函晾纸，页页完好——只是她的眼底，青得遮不住。（精力不足，那一夜房上你先撑不住了）'; break; }
                    aff = 12; msg = ('秋雨凉得像冰。你伏在房上，一块瓦一块瓦地摸漏点，油布压了三层，瓦片再压上去——每压死一处，阁下的雨声就轻一分。下来时你浑身透湿，她抱着干袍子立在檐下等你，先看油布，再看你：「漏，压住了。六函，一页没湿。」数完她顿了顿，很轻地说了一声，「多谢。」——从首座嘴里，这两个字比白云草开花还稀罕。那晚的戒堂记录上有一行字，是她事后亲笔补的：「经阁雨夜，经安，人安。」人安两个字，墨比别处重些。') + '（精力-12）'; break; }
                case 'carry': aff = 9; msg = '你依她的话，一函一函过手，压稳在干处，覆上油布。两人一盏灯下递了半夜的纸，几乎没有话，只偶尔她轻轻提醒：「这一函，平着抱。」天亮雨歇，六函完好，一页未潮。她收好最后一函，忽然说：「六年抄经，我一直以为是我一个人守它。」她看看压得整整齐齐的经函，又看看你，「原来下雨的时候，是有人递纸的。」'; break;
                case 'lamps': aff = 6; msg = '你把阁里的灯一盏一盏点起来，数函、盯漏点，报给她听：「第三处漏点往西偏了半尺！」灯下她按你的声音一步一步挪纸，两人一报一应，配合得像排演过许多年。雨歇时她清点函数：六函，一函不少。她收了笔，对你说：「今夜，你的眼睛，借我用了。」第二天藏经阁的值守单子上多了一条小规矩，字很小：「雨夜查函，需二人。」——戒律首座立的规矩，头一条就把你写了进去。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'heng_event_009': {
        id: 'heng_event_009', npcId: HENG_NPC_ID, title: '木鱼之诺', icon: '🎐',
        desc: '她把那只敲旧的木鱼，推到你的手边。',
        minAffection: 68, trigger: { random: 0.3 }, cooldown: 0, flag: 'heng_e009_done',
        requireEventDone: 'heng_event_008',
        autoTrigger: { location: '恒山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '晚课毕，她把你留进静室。案上摆着那只旧木鱼——铜锔的裂、磨亮的鱼身、凹下去浅浅一层的敲击处。旁边放着一支没有点的香。', type: 'description' },
            { speaker: 'npc', text: '「大殿的木鱼，领的是课。」她把旧木鱼往你面前推了推，动作很慢，很稳，「这一只，领的是我的心。六年的晚课，它安过的东西，都在里头。」' },
            { speaker: 'npc', text: '「拿着。」她抬眼看你，耳根微红，话仍旧轻而缓，「听见木鱼，就是我在替你念。山里灯早，山下夜长——睡不着的时候敲一声。一声就好，不要多敲。多了，心就乱了。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '接过木鱼，与她同敲三声，把这一晚的回向做完', effect: 'take', affection: 14 },
                { text: '「木鱼我收着。可你晚课的窗，别再掩那层布了。」', effect: 'vow', affection: 9 },
                { text: '看着她，问：「为什么是我？」', effect: 'ask', affection: 8 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'take': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 14) : { ok: true };
                    if (!_py.ok) { aff = 6; msg = '你抬手接木鱼，连日没有好眠的身子乏得指尖发颤，木鱼差点从指间滑出去——她先一步拢住，把木鱼连同你的手一起按在你掌心。「拿稳。」她低着头说，「这只木鱼，我拿了六年，才拿稳。」那晚的回向你没有陪她做完，她让你先回去歇，自己敲完了三声，第二天一声一声讲给你听，讲得很认真。木鱼如今搁在你案头，铜锔的裂贴着木头，是温的。（精力不足，那一夜晚课你先撑不住了）'; break; }
                    aff = 14; msg = ('你接过木鱼，举槌敲下去。第一声轻，第二声稳，第三声——她的诵声跟着木鱼声起，两个声音一高一低，缠在一起，把这一晚的回向做完。回向毕，她没有收回木鱼，只看着案上那只旧的，看了很久：「你敲的声，是稳的。」她忽然抬眼，灯影里的眼睛很静，「晚课敲了六年，都是我一个人敲。今夜起——它有回音了。」那一夜你下山，木鱼揣在怀里，木纹贴着皮肤，还有一点温，像谁的脉搏。') + '（精力-14）'; break; }
                case 'vow': aff = 9; msg = '她推木鱼的手指停了一停。「不掩布。」她重复了一遍，垂下眼，像是笑了一下——她的笑很轻，像木鱼的一声，「那层布，是挡静的。」她把木鱼塞进你手里，替你把手指一根一根合拢，「如今静下了山，就不用挡了。」从这天起，静室的晚课窗纸里，再没有那层布帘。庵里的弟子说，首座的课近来敲得晚了一些——像在等声音传到山下去，等一个回音。'; break;
                case 'ask': aff = 8; msg = '她没有立刻答。她点了那支香，在香烟里说得很慢：「抄了六年的经，回向页空了六年；敲了六年的木鱼，安的是一颗心。」她看你，「戒本说，万法缘起。让我信这一句的——你是头一个。」香烧到一半，她把最后一句说完了，耳根红透，话却还是稳的：「为什么是你，香烧完了你自己想。想不明白，明晚再来——我等你。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'heng_event_010': {
        id: 'heng_event_010', npcId: HENG_NPC_ID, title: '师太的考校', icon: '🧓',
        desc: '定逸师太出关，把六年的经函摊在供案上。',
        minAffection: 72, trigger: { random: 0.3 }, cooldown: 0, flag: 'heng_e010_done',
        requireEventDone: 'heng_event_009',
        autoTrigger: { location: '恒山派', random: 0.43 },
        scenes: [
            { speaker: 'narrator', text: '定逸师太出关了。老师太不进殿，只把六年的《华严经》经函一函一函摊在供案上，摊了满满一案，任山风翻页。满庵弟子屏息——谁都知道，老师太的戒，是全恒山最严的。', type: 'description' },
            { speaker: 'narrator', text: '老师太翻到最后一页——那页写着俗家名字的回向页。她看了很久，忽然抬眼，指向你，只问了一句：「她的经，抄了六年众生。你说——这一页上有了名字，经，脏了没有？」', type: 'description' },
            { speaker: 'npc', text: '祁清禅一步跨到你身前，背脊绷得笔直，声音还是轻的，可一个字比一个字紧：「师太。经是弟子一人抄的，与外客无干——」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '对师太一礼：「名字不脏。经是心抄的——心真，名字就真。」', effect: 'answer', affection: 8 },
                { text: '翻到头一函，指六年的经摞：「请师太先看这六年——页页端正，末尾才长出一个名字。」', effect: 'page', affection: 7 },
                { text: '与她并肩而立：「弟子斗胆反问师太——白云庵的香火回向众生，众生是少了一个，还是多了一个？」', effect: 'side', affection: 11 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'answer': aff = 8; msg = '老师太盯着你看了半晌，手里的念珠停住，忽然笑了，笑声像山风过殿：「六年抄经，页页端正——端正到最后一页，长出一个名字来。」她合上经函，「戒在心中，不在纸上。心真，名字就真——好话。」她转头对清禅说，「这一页，你自己抄完。抄圆了，我收。」满殿寂静里，你身旁那个绷直的背，慢慢、慢慢松了下来。'; break;
                case 'page': aff = 7; msg = '老师太俯身，就着你的手，从第一年的函看到第六年的函——字迹从稚到稳，山风一页一页翻过去，没有人说话。最后她直起身，手掌按在那页回向页上：「六年端正，不易。」她看清禅，声音忽然缓了，「为师当年抄戒，末页抄过一个渡我劫难的人的名字——也想抹。到底没有抹。」她出殿前只留下一句：「名字留着，经还是经。抄圆它。」'; break;
                case 'side': aff = 11; msg = '你上前一步，与她并肩。她的手臂绷得像拉满的弓，袖底的指尖却悄悄松了半分。定逸师太看看你，又看看她，浑浊的眼睛里忽然有了笑意：「好。」她把满案经函尽数推到案心，「香火回向众生。众生里多一个人——功德是大了，不是小了。」老师太离殿时，在供案上留下四个字：「庵，交给你们。」事后清禅在原地立了很久，很轻地说：「师太这些年，没有把庵许给过谁。——这四个字，比一函经还重。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'heng_event_011': {
        id: 'heng_event_011', npcId: HENG_NPC_ID, title: '山洪夜', icon: '⛈️',
        desc: '香道上山洪暴发，十几个人被困在对岸。',
        minAffection: 78, trigger: { random: 0.3 }, cooldown: 0, flag: 'heng_e011_done',
        requireEventDone: 'heng_event_010',
        autoTrigger: { location: '恒山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '秋汛夜。连日大雨，香道上的溪水涨过了桥面；进香归来的香客队伍十几个人被困在对岸，木桥已被冲垮了一半，剩下的半截桥架在洪流上晃，对岸的灯笼在雨里一明一灭。', type: 'description' },
            { speaker: 'npc', text: '祁清禅已经赶到岸边。棍、绳、油布，她一样一样交代，话轻，一个字不多：「水齐腰，流急两分，窗口半个时辰。断桥吃不住人——我下水扶梁，岸上拉绳，掌灯。」', type: 'description' },
            { speaker: 'narrator', text: '洪流在黑地里吼，对岸的灯笼挤成一小团。她已经把绳系上腰，往水里去了，背影很直。', type: 'description' },
            { speaker: 'player_select', text: '你必须立刻做点什么。', options: [
                { text: '随她下水：她扶梁，你打桩，人拉着绳一个一个过来', effect: 'wade', affection: 14 },
                { text: '先一步扎进洪里，用背顶住断桥当墩，让人从你背上过', effect: 'bridge', affection: 15 },
                { text: '守住此岸，把灯笼举高，敲那只旧木鱼，替过水的人叫方向', effect: 'shore', affection: 10 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'wade': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 14) : { ok: true };
                    if (!_py.ok) { aff = 6; msg = '你追进水里，一个急流把你撞在桥墩上，绳脱了手——她单手撑住洪流，把你推回岸上，声音被水打得一沉一浮：「守住灯！」她自己扶梁，半个时辰里把十几个人一个一个带了回来。坐在雨里，她先点人，再回头说你：「气力平日都长在哪里了？」话是轻的，说完却把救人那段绳，在你擦破的手腕上绕了两圈，打了个结。（精力不足，那一夜洪流里你先撑不住了）'; break; }
                    aff = 14; msg = ('洪流像墙。你与她一前一后趟进水里——她扶梁，你打桩；水头每冲一次，你就把桩往河床里多砸一寸，绳在两桩之间绷得笔直，人拉着绳一个一个过来。最后一个老香客上岸时，满队的人跪在雨里磕头，你去扶，才发觉两只手掌全被绳勒开了口子——她点人从不漏数，这一夜没有点自己的疼。对岸的灯灭时，洪也退了。她坐在岸边喘，忽然说：「戒本里讲：同渡一泓者，同其命。」她转头看你，雨水在脸上分不清，「今夜，渡过了。」') + '（精力-14）'; break; }
                case 'bridge': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 14 + 20) : { ok: true };
                    if (!_py.ok) { aff = 8; msg = '你先扎进水里，第二个水头就把你按在断梁上，眼前发黑——是她弃了棍扑下来拽住你，对岸那十几个人由闻讯赶来的弟子队掌灯接力，一个一个涉水传了过来。两人被扶上岸，谁也没站住，靠着桥墩在雨里对喘。她先开口，声音哑的：「……顶不住的水，不许顶。戒堂第一课。」话是训，手却一直扣着你的腕，没有松。（精力不足，那一刻洪流里你先撑不住了）'; break; }
                    aff = 15; msg = ('你扎进洪流，摸到断桥——梁已断了一半，你把肩抵上桥墩，用背顶住梁，替那半截桥在水里多挣出一刻。她扶着人一个一个从你头顶上过，每过一个报一声数，声音轻，却字字送到：「一个。」「两个。」……「十四个。」桥塌时你被水掀出去，是她扎进水里扣住你的腕——那一下的力道比绳还硬，拽得你整条手臂发麻。上岸她先点人：十四口，一个不少。再回头点你，从头到脚，点得很慢，点完蹲在雨里抱着膝，肩膀轻轻抖了一下——没有哭。站起来时声音轻得像常：「记档：汛夜，桥断，十四人安渡。」顿了顿，用只有你听得见的声音补了一句，「……你也算在里头。」') + '（精力-34）'; break; }
                case 'shore': aff = 10; msg = '你守住此岸，把灯笼尽数举上桥墩，又取出那只旧木鱼——一声，一声，敲穿雨声和水声，送到对岸去。过水的人循着木鱼声走，一步没有走偏；她在水里扶梁，木鱼声每响一次，手臂就稳一分。十四个人过完，灯没有灭，木鱼没有停。事后她在岸边的记档上写了一行字，很小：「守灯击鱼者，与渡人同功。」第二天那只旧木鱼放回你手里时，她说：「你敲的声，水淹不掉。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'heng_event_013': {
        id: 'heng_event_013', npcId: HENG_NPC_ID, title: '终章·经圆', icon: '🌄',
        desc: '《华严经》明晨圆满，回向页只差最后一笔。',
        minAffection: 85, trigger: { random: 1.0 }, cooldown: 0, flag: 'heng_e013_done',
        requireEventDone: 'heng_event_011',
        autoTrigger: { location: '恒山派', random: 1.0 },
        endingMap: { '同渡': 'heng_ending_同渡', '守灯': 'heng_ending_守灯', '香伴': 'heng_ending_香伴', '话经': 'heng_ending_话经', '灯灭': 'heng_ending_灯灭', '经尾': 'heng_ending_经尾' },
        scenes: [
            { speaker: 'narrator', text: '《华严经》可以圆满的前夜。抄经堂的灯挑得很亮，六年的经函在案上码得整整齐齐，最上头是那页回向页——经文已经抄全，只余回向空着，墨研好了，等天亮。殿外的山夜很静，只有长明灯的火苗，一跳，一跳。', type: 'description' },
            { speaker: 'npc', text: '祁清禅坐在灯下，那只旧木鱼摆在案头。她看着那半页空白的回向，看了很久，忽然开口，声音轻得像常：「六年前起笔的时候，我想，抄完了这部经，世间就多一部圆经。」' },
            { speaker: 'npc', text: '「如今只差这一页了。」她抬眼看你，灯影里的眼睛很静，静得像在忍什么，「回向怎么写，我想了六年，想到今夜。——还是想问问你。」' },
            { speaker: 'narrator', text: '山风掠过殿檐，灯焰低了低。这一页回向落不落笔，就在你一句话之间。', type: 'description' },
            { speaker: 'npc', text: '「{playerName}。」她唤你的名字，一个字一个字都很慢，「天亮经就圆了。这最后一笔——你说。」' },
            { speaker: 'player_select', text: '你的选择将决定你们的关系走向', options: [
                { text: '「跟我走。经留在庵里，木鱼带上——木鱼声在哪里，你的功课就在哪里。」', effect: 'lover_travel', affection: 30 },
                { text: '「抄圆它。我留在恒山脚下——每天晨钟，我做山门外头一个听的人。你守庵，我守你。」', effect: 'lover_stay', affection: 28 },
                { text: '「经照抄圆，回向照写众生。十五香期我来——你持棍走头里，我背供篮。」', effect: 'friend', affection: 20 },
                { text: '「给我在抄经堂留个俗家的蒲团。我从山下写信来——你把信，压进经函。」', effect: 'friend_stay', affection: 18 },
                { text: '「经该圆了。我只是香道上的过客——该下山了。」', effect: 'none', affection: 0 }
            ]}
        ],
        effects: function(npc, choice) {
            // 三度伤透即寒心：辜负独立成结局「灯灭」，与「经尾」（错过）分账
            var negCount = (window._negativeChoiceCount && window._negativeChoiceCount[HENG_NPC_ID]) || 0;
            if (negCount >= 3 && (choice === 'lover_travel' || choice === 'lover_stay')) {
                return { affection: 0, msg: '她看了你很久很久，灯影里的眼睛，一点一点暗下去。「……好。」她说。她拿起那页回向页，折起来——折得整整齐齐，三道折痕，对得像刀裁，然后走到佛灯前，把它送进了火里。纸卷起来，那个名字在火里红了一瞬，黑了。她回身敲木鱼——头一声，铜锔的细裂在夜里裂开了，声音散了。她停住手：「晚课，到此为止。」她的声音轻得像常，轻得像在念别人的戒，「戒是安心的。我的心安放错了地方——收回来，重新安放。」第二天经圆，回向页上一片空白，她只写了四个字：「回向众生。」后来白云庵的晚课，木鱼每日少敲一声。弟子问起，首座说：「最后一声，敲错过。」', ending: '灯灭' };
            }
            switch (choice) {
                case 'lover_travel': return { affection: 30, msg: '她终于抬起眼。灯影落在她脸上，她看你，看了很久，忽然极轻地笑了——笑得像木鱼的一声，眼睛却亮起来：「……木鱼声在哪里，功课就在哪里。」她唤过值守的师妹，把六年的经函一函一函交托出去，戒堂的规矩一条一条交代到最后一笔；自己随身，只带了那只旧木鱼和一身干净的海青。「经留在白云庵。木鱼跟我走。」她握住你的手，指腹上有墨茧，握得很轻，却很稳，「我不还俗，戒也不舍。可经里的众生有你——你在哪里，我的回向就在哪里。」那一夜抄经堂的灯亮到天明；天亮时晨钟响起，她敲着木鱼和上钟声，与你一同下了山。', ending: '同渡' };
                case 'lover_stay': return { affection: 28, msg: '她看着那半页空白的回向，很久，转过身来——眼睛弯着，弯得像晚课后的那弯新月：「……好。」她提笔蘸墨，就着灯，把最后一笔写得很慢，很稳：「回向十方众生——及山下，一人。」写完她收了笔，耳根红着，话仍旧轻：「你守山下的人。我守庵里的经。」第二天，白云庵的晨钟照响，山门外多了一个听钟的俗家弟子——每日头一个来，风雨无阻。殿里的香火很旺，她敲木鱼领课，钟声的末尾会朝山门望一眼——那一眼很轻，轻得像木鱼的一敲，可满庵的人都看见了，谁也没有说破。', ending: '守灯' };
                case 'friend': return { affection: 20, msg: '她想了想，忽然笑开——笑得六年的端方都松了一松：「背供篮？」她把那页回向页卷起来，在你肩上轻轻敲了一下，「恒山的香道，初一十五，陡坡长路——你算过要背多少年么？」她不等你答，已经转身去写她的回向了，笔尖悬着，背对着你，「十五，山门口。香客齐了队伍就走——背篮的人走我右手边，这是护香的老规矩。」那年的回向页写的是「回向十方众生」；戒堂的记录上添了一行小字：「香道有伴，俗家一位，岁走长路。」', ending: '香伴' };
                case 'friend_stay': return { affection: 18, msg: '「俗家的蒲团？」她把经函拢了拢，掂了掂，像在掂六年的分量，「白云庵抄经堂的规矩，俗客不入。」她顿了顿，取出一页空白纸，把她抄经的时辰、清课散的时间、山下的邮驿，一笔一笔写清楚，递给你，「信可以来。来的信——我压进经函。」她看你，耳根微红，话仍旧轻而缓，「经函不受潮。你的信，也不会。」那一年起，白云庵的抄经堂里，经函底下总压着几页山下来的信，纸带着俗世的尘土，压进经里，页页平整。', ending: '话经' };
                case 'none': return { affection: 0, msg: '她执笔的手在半空停了很久很久。然后她垂下眼，把回向页的最后一笔写得很稳：「回向十方众生。」字端正，一笔没有颤。经圆了，她把经函供进藏经阁，吹了灯，没有再看你一眼。「晨钟要响了。」她说，「香客下山罢——石阶上有露，滑。」钟照旧在黎明响起，清课照旧，木鱼照旧稳。你下了山，她留在庵里——经与回向，灯与钟，各归各位。后来香道上有传闻：白云庵首座的《华严经》圆了，功德回向众生。只有她自己知道，那半页空白她空了六年——到底，空了一生。', ending: '经尾' };
            }
            return { affection: 0, msg: '' };
        }
    }
};

// ============ 祁清禅结局演出（6 个） ============
var HENG_ENDINGS = {
    'heng_ending_同渡': {
        id: 'heng_ending_同渡', npcId: HENG_NPC_ID, title: '结局·同渡', icon: '🛶',
        route: '同渡',
        scenes: [
            { speaker: 'narrator', text: '三日后，祁清禅把六年的经函交托给师妹，戒堂的规矩交代到最后一笔。她随身只带了那只旧木鱼和一身干净的海青——戒没有舍，庵没有别；她说，经抄圆了，回向有了去处，抄经的人可以走一走了。', type: 'description' },
            { speaker: 'npc', text: '「木鱼声在哪里，功课就在哪里。」她与你并肩走在山道上，晨风把衣角吹得很直，「华严经上讲，不忘初心，方得始终。我的初心在庵里，始终在路上。你陪我走——慢慢走，不赶。」' },
            { speaker: 'narrator', text: '多年后，南北的香道上有个说法：有一位行脚的比丘尼与一位俗家施主同行，每到一处寺院做晚课，每遇一处难处搭一把手。比丘尼带一只木鱼，铜锔着一道旧裂；俗家施主背一只供篮，篮里常备着白云草茶。', type: 'description' },
            { speaker: 'narrator', text: '有人问他们是什么关系。比丘尼答「同渡」，{playerTa}答「同渡」。答完两人各走各的路，一个敲木鱼，一个背供篮，谁也不多说——戒很稳，路很长，众生很大，里头有一个人。', type: 'description' }
        ],
        finalText: '——— 结局·同渡（道侣·同行）———'
    },
    'heng_ending_守灯': {
        id: 'heng_ending_守灯', npcId: HENG_NPC_ID, title: '结局·守灯', icon: '🕯️',
        route: '守灯',
        scenes: [
            { speaker: 'narrator', text: '你留在了恒山脚下。山脚第一户人家，院子对着白云庵的山门——每天晨钟响之前，你已经在门口了；每日头一炷香是你上的，最后一场晚课的木鱼声，也是你听着睡的。', type: 'description' },
            { speaker: 'narrator', text: '她照旧守庵，照旧领课——只是每年晒经的日子，会把回向页上「及山下一人」那五个字给你看一眼。你说写得好。她不认，可晒经的那天，那一页总是朝着太阳摆得最久。', type: 'description' },
            { speaker: 'npc', text: '「今天的晨钟，晚了一刻。」清课毕她把木鱼交给你收好，话轻轻的，「听钟的人，知道为什么么？」你问为什么。她望向钟楼，很轻地说：「钟下多一个人，众生里就多一个人。」' },
            { speaker: 'narrator', text: '庵里的弟子私下说：首座还是话少，戒还是严——只是每天晚课，静室的窗不再掩布帘，木鱼敲得晚一些，像等山门外头一个听钟的人吃过晚饭，好让声音传得更远。', type: 'description' },
            { speaker: 'narrator', text: '恒山的雪年年来，殿里的灯夜夜亮。一个人守着庵，一个人守着灯——灯是庵的灯，守灯的人，在庵的心里。', type: 'description' }
        ],
        finalText: '——— 结局·守灯（道侣·相守）———'
    },
    'heng_ending_香伴': {
        id: 'heng_ending_香伴', npcId: HENG_NPC_ID, title: '结局·香伴', icon: '🥾',
        route: '香伴',
        scenes: [
            { speaker: 'narrator', text: '你成了她香道上的伴。初一十五，天不亮你就在山门口；她持棍出来领队，你背着供篮走在右手边——陡坡她放慢，长路你们少话，一队的香客跟在后头，走得稳稳的。', type: 'description' },
            { speaker: 'npc', text: '「前头第三道坡，老人家走里侧。」她把香道一段一段指给你听：哪块石头滑，哪个拐弯有风，哪块路边的石头——她的棍尖顿了顿，「当年有位老人家爬不动，坐在那里歇过。后来立了功德碑，没有刻名字。」' },
            { speaker: 'narrator', text: '有人问你们是什么关系。她答「香伴」，{playerTa}答「香伴」。答完两人各看各的香道，一个持棍，一个背篮，谁也不多说——香期很准，队伍很稳，初一十五，谁也不欠谁。', type: 'description' },
            { speaker: 'narrator', text: '后来恒山的香道被你们走成了熟路。功德碑又添了几块，仍旧不刻名字。山上的香客都说，走在头里的那一队最让人放心——因为队里有两个人，一个守了六年的戒，一个背了一年的篮，还要背很多年。', type: 'description' }
        ],
        finalText: '——— 结局·香伴（挚友·同行）———'
    },
    'heng_ending_话经': {
        id: 'heng_ending_话经', npcId: HENG_NPC_ID, title: '结局·话经', icon: '✉️',
        route: '话经',
        scenes: [
            { speaker: 'narrator', text: '{playerTa}成了白云庵抄经堂的常客。堂边那个俗家的蒲团年年留着；每年晒经，经函最上头压着几页山下来的信，页页平整。', type: 'description' },
            { speaker: 'narrator', text: '她照旧守庵，照旧抄经——只是每年华严会毕，会把山下来的信从经函里取出来，一页一页抚平，重新压回最底下。信纸带着俗世的尘土，压进经函，墨色不曾潮过一页。', type: 'description' },
            { speaker: 'npc', text: '「今年的信，迟了四天。」她把信压进函里，指尖在页角敲了敲，「……香道上，雨大？」话问得别扭，回信的纸却早已裁好，字写得比抄经还工整。' },
            { speaker: 'narrator', text: '师妹有回问她：山下那位，算你什么人。她想了想：「经函的常客。」师妹似懂非懂。只有首座自己知道——那部《华严经》的回向页上，十方众生与经函的常客，记在一处，都是「真的」。', type: 'description' }
        ],
        finalText: '——— 结局·话经（挚友·相守）———'
    },
    'heng_ending_灯灭': {
        id: 'heng_ending_灯灭', npcId: HENG_NPC_ID, title: '结局·灯灭', icon: '🌑',
        route: '灯灭',
        scenes: [
            { speaker: 'narrator', text: '那一夜她把回向页自己送进了火里。先解开折得整齐的三道折痕，再放进灯焰——她送得很慢，很稳，像做完晚课的最后一道。那个名字在火里红了一瞬，卷起来，黑了。', type: 'description' },
            { speaker: 'narrator', text: '第二天经圆，回向页上一片空白，她只写了四个字：「回向众生。」她向定逸师太复命，只有八个字：「经圆。心，收回来了。」老师太看了她很久，念了一声佛号，什么也没有多问。', type: 'description' },
            { speaker: 'npc', text: '「戒是安心的。」后来有弟子问，首座的晚课木鱼为什么每日少敲一声，她望着大殿的长明灯，语气像在念别人的戒，「最后一声，敲错过。错了——就停。往后白云庵的晚课，课到此为止。」' },
            { speaker: 'narrator', text: '多年后你再上恒山，晨钟照响，她对你礼数周全，问讯如仪，分毫不差——只是那只旧木鱼的铜锔裂开了，她没有再锔，也没有再敲那一声。每逢晚课散，她会在佛灯前多坐一会儿；灯是亮的，可她不再为任何下山的人留灯了。', type: 'description' }
        ],
        finalText: '——— 结局·灯灭（辜负）———'
    },
    'heng_ending_经尾': {
        id: 'heng_ending_经尾', npcId: HENG_NPC_ID, title: '结局·经尾', icon: '🌫️',
        route: '经尾',
        scenes: [
            { speaker: 'narrator', text: '后来你还是上过几次恒山。白云庵对香客开放，她对你礼数周全，问讯如仪，分毫不差，像对每一位上山进香的人。', type: 'description' },
            { speaker: 'narrator', text: '《华严经》那年就圆了，回向页上写着：「回向十方众生。」字迹端正，页页清净——那半页空了六年的空白，到底空着；俗家的名字，终究没有写进回向里。', type: 'description' },
            { speaker: 'narrator', text: '再后来，香道上偶有传闻——白云庵首座的戒愈发严了，课愈发稳了，定逸师太说这部《华严经》「大可传世」。香火照旧旺，晨钟照旧响，只是静室的晚课，多坐了一个人。', type: 'description' },
            { speaker: 'narrator', text: '十五香期，她持棍领队走到山门口，会忽然停一停，朝香道下面望一眼——望一眼，就收回去了，收得很干净，像木鱼的一声，该停就停。戒照守，经照抄，只是那页回向，她再没有翻开过。', type: 'description' }
        ],
        finalText: '——— 结局·经尾（错过）———'
    }
};

// ============ 性别语境事件（femctx 女玩家 / mctx 男玩家，互斥） ============
var HENG_GENDER_CTX_EVENTS = {
    // 女玩家：白云庵师姊妹的提醒
    'heng_event_femctx': {
        id: 'heng_event_femctx', npcId: HENG_NPC_ID, title: '殿角私语', icon: '💮',
        desc: '两个白云庵的师姊妹在殿角把你叫住了。',
        minAffection: 55, trigger: { random: 0.35 }, cooldown: 0, flag: 'heng_e_femctx_done',
        requirePlayerFemale: true,
        autoTrigger: { location: '恒山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '晚课散，你出殿门，两个相熟的白云庵师姊妹在殿角把你叫住，左右看了看，压低声。', type: 'description' },
            { speaker: 'npc', text: '「姑娘。」年长的那个开门见山，「首座的《华严经》抄了六年，回向页空了六年——前些日子，那半页空白里写上了你的名字。满庵都看在眼里了。」' },
            { speaker: 'npc', text: '「首座那个人，戒守得最严，心端得最平。她把俗家名字抄进经的最后一页——这对她，比破一条戒还重。她受得住戒，受不受得住山下的嘴？你跟着她，舍不舍得看她那样端着？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「她抄她的经，我走我的香道——正好。」', effect: 'tease', affection: 8 },
                { text: '「师姊，我自愿的。辛苦我认。」', effect: 'accept', affection: 7 },
                { text: '「你们是怕我委屈，还是怕她破例？」', effect: 'probe', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'tease': aff = 8; msg = '两个师姊妹对视一眼，年长的先笑出声：「……走香道？」她拍着你的手背，眼角的纹路都松了，「好姑娘。她那条香道一个人走了六年，早该有人并着走了。你走——庵里的师姊妹给你备雨鞋，恒山的香道，雨天滑。」'; break;
                case 'accept': aff = 7; msg = '师姊妹们轻叹一口气：「自愿的……好。」年纪小的那个从袖里摸出一包新晒的白云草塞给你，「陪首座坐晚课的人，得先暖着自己。往后她抄经，你陪着——白云草茶，我们师姊妹包了。」'; break;
                case 'probe': aff = 6; msg = '年长的那个捻着衣角，顿了顿：「……两样都怕。」她望着静室的方向，声音又压低了些，「她破例一回，就要拿十夜的晚课端回来。你舍得看她那样端，就留下——留下了，就别再让她端回去。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // 男玩家：守香道老护法的直言
    'heng_event_mctx': {
        id: 'heng_event_mctx', npcId: HENG_NPC_ID, title: '山下之言', icon: '🌫️',
        desc: '守了半辈子香道的老护法把你拦下了。',
        minAffection: 55, trigger: { random: 0.35 }, cooldown: 0, flag: 'heng_e_mctx_done',
        requirePlayerMale: true,
        autoTrigger: { location: '恒山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '山门外，一个守了半辈子香道的老护法把你拦下，左右看了看，压低声。', type: 'description' },
            { speaker: 'npc', text: '「那位……山下的客。」老护法咬着牙，「你跟首座的事，满山传遍了。她把回向页的空白写上了你的名字——那部经，她抄了六年。六年的恒山，那一页没有给外人看过一眼，头一遭。」' },
            { speaker: 'npc', text: '「我不是说这不好。我是说，首座那个人，别人戳她一指头，她能多念十夜经端回来。庵里的嘴她压得住，山下的嘴呢？她替你念经，你替她扛不扛得住这六年的经函？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「嘴归嘴。她抄她的经，我走我的香道。」', effect: 'defy', affection: 8 },
                { text: '「老丈，我们还没到那一步。」', effect: 'deny', affection: 3 },
                { text: '「谁嚼她的舌根，先问问我护没护过这条香道。」', effect: 'shield', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'defy': aff = 8; msg = '老护法眼睛亮了：「……行！这话我原样带给首座——不对，我不能带。」他吐吐舌头走了。可当晚静室的灯，你看得出，比平日熄得晚——抄经的人，心情不坏。第二天下山，香道口的石头上不知谁放了一包白云草茶，是给你备着的。'; break;
                case 'deny': aff = 3; msg = '老护法盯了你半晌，从鼻子里哼出一口气：「……没到那一步。」他拍拍衣摆走了，走出两步又回头，「那她空了六年的回向页上，你的名字算什么？满山都知道那页纸压在她镇纸底下——你还给她抹了去？」'; break;
                case 'shield': aff = 7; msg = '老护法怔了怔，忽然咧嘴一笑：「首座要是听见这句，能念三天佛号压你的躁——念完了，请你喝她灶上煨的白云草茶。」他扛起棍往山门里去，声音远远飘下来，「嚼舌根的那几位，其实早叫首座崖上救人那一背吓软啦！」'; break;
            }
            return { affection: aff, msg: msg };
        }
    }
};

// ============ 合并进总事件池 ============
if (typeof NPC_PERSONAL_EVENTS !== 'undefined') {
    Object.assign(NPC_PERSONAL_EVENTS, HENG_MAIN_EVENTS);
    Object.assign(NPC_PERSONAL_EVENTS, HENG_GENDER_CTX_EVENTS);
}

// ============ 注册结局集与副作用回调 ============
if (typeof registerEndingSet === 'function') {
    registerEndingSet(HENG_NPC_ID, HENG_ENDINGS);
}
if (typeof registerEndingCallback === 'function') {
    registerEndingCallback(HENG_NPC_ID, function(endingName, npc) {
        if (endingName === '同渡' || endingName === '守灯') {
            if (npc && typeof npc.setFlag === 'function') npc.setFlag('dao_companion');
            if (window.showMessage) window.showMessage('🪷 你与祁清禅结为道侣！恒山剑意与华严戒体感悟大幅提升', 'success');
        } else if (endingName === '香伴' || endingName === '话经') {
            if (npc && npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 30);
            if (window.showMessage) window.showMessage('🪷 你与祁清禅成了香经为约的知己', 'success');
        } else if (endingName === '灯灭') {
            if (window.showMessage) window.showMessage('🕯️ 祁清禅把那页名字送进了佛灯。晚课到此为止——木鱼每日少敲一声', 'error');
        }
    });
}

// ============ 自动触发 + 每日钩子（复用 maybeAutoTriggerPersonalEvent） ============
function maybeAutoTriggerHengEvent(source) {
    return maybeAutoTriggerPersonalEvent(HENG_NPC_ID, source, { finalEvents: ['heng_event_013'] });
}

if (typeof window !== 'undefined' && window.timeSystem && window.timeSystem.onNewDaySubscribe) {
    window.timeSystem.onNewDaySubscribe(function() {
        try {
            if (window.currentCharData && window.currentCharData.location === '恒山派') {
                maybeAutoTriggerHengEvent('daily');
            }
            // 性别语境：每日在该派过夜 + 对应性别 + 好感≥55 + 未触发
            if (!window.currentCharData || !window.npcManager) return;
            var loc = window.currentCharData.location || '';
            if (loc !== '恒山派') return;
            var npc = window.npcManager.getNPC ? window.npcManager.getNPC(HENG_NPC_ID) : null;
            if (!npc) return;
            var aff = (npc.relationship && npc.relationship.affection) || 0;
            if (aff < 55) return;
            var isF = window.currentCharData.gender === 'female';
            var ctxId = isF ? 'heng_event_femctx' : 'heng_event_mctx';
            if (typeof hasEventTriggered === 'function' && hasEventTriggered(ctxId)) return;
            var ev = NPC_PERSONAL_EVENTS[ctxId];
            if (!ev) return;
            if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npc)) return;
            setTimeout(function() {
                if (document.querySelector && document.querySelector('.personal-event-modal')) return;
                if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npc)) return;
                if (typeof triggerPersonalEvent === 'function') triggerPersonalEvent(ctxId);
            }, 1200);
        } catch (e) { console.warn('[祁清禅线] 每日触发失败:', e); }
    });
}

// ============ 导出 ============
if (typeof window !== 'undefined') {
    window.HENG_MAIN_EVENTS = HENG_MAIN_EVENTS;
    window.HENG_ENDINGS = HENG_ENDINGS;
    window.maybeAutoTriggerHengEvent = maybeAutoTriggerHengEvent;
}
console.log('[祁清禅线] 恒山感情线加载完成：结局 ' + Object.keys(HENG_ENDINGS).length + ' 个 + 主线事件 ' + Object.keys(HENG_MAIN_EVENTS).length + ' 个 + 性别语境 ' + Object.keys(HENG_GENDER_CTX_EVENTS).length + ' 个');
