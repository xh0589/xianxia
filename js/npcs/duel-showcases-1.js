// ==================== duel-showcases-1.js - 双人高光对局·卷一 v20.80 ====================
// 依赖：npc-personal-events.js（NPC_PERSONAL_EVENTS / canPlayerAccessPersonalEvent / triggerPersonalEvent）、
//       jealousy-social.js（requireGuestFeelings 门禁的 _jealHasFeelings / asNpc 渲染的 _jealGuestInfo /
//       开帘播种 _jealOnSceneShow / pair 写回 _jealWriteback / others 三方好感结算）
// 加载顺序：在 jealousy-social.js 之后
//
// 「对局」是什么：你把两个人放在心上，两个人也各自把你放在心上——她们/他们头一回照面。
// 不撞破、不捉奸、不撕破脸：照面必须有真实的由头（护镖合营 / 跨界协查 / 对账 / 议戒旧例），
// 交锋必须走各自的本行（哨语对调子、档规对簿规、算盘对潮录、木鱼对白子），
// 谁也不知道自己不该知道的——名字只在有来路时出口。
//
// 机制：每桩标 guestId + requireGuestFeelings（来客也得对你有心，对局才成立）；
//   来客的台词用 speaker:'npc' + asNpc（引擎按 guestId 换名号头像，琥珀色气泡）；
//   effects 返回 others（来客的好感账）+ pair（主客社交关系写回 npcRelationships 真源）——
//   初次照面由引擎当场种关系（门派底色：正邪带霜、五岳连枝……），戏演完，账留下。
//   居间调停（social-intervene）日后读得到这笔账：你亲手种下的疙瘩，也能亲手调解。
//
// 卷一四桩：翻译大战（铁掌帮·裘霜莺 × 天龙教·檀望舒）/ 公文互批（侠隐阁·简知忆 × 阎罗殿·聂明泽）
//           对账（全真教·翀玉衡 × 蓬莱派·瀛晚照）/ 辩戒（恒山派·祁清禅 × 武当派·阙守拙）
//
// 声口铁律（随册入档，一字不越）：
//   裘霜莺——哨语三条（一长一短＝过来）、凶脸、短句凶腔耳根红、素坯泥哨、苇滩、师妹；不借任何人的腔。
//   檀望舒——全桩台词带「（用XX的调子）」标注，本声一次不出现（本声专属主线与终章）；半面残铜镜。
//   简知忆——归档/附页/危险程度/存疑不究/勘语/正卷/近手那格/档规；禁朱笔簿册那套冥府语。
//   聂明泽——只用簿/档/册/格/签/朱笔/判语栏/未定/并案意象。
//   翀玉衡——记/此债记账/利息/两讫/全押/存疑/停珠/功业账；零酒字；你那栏只进不出。
//   瀛晚照——观汐台/潮信图录/旧螺/「岸上人」栏/潮/时辰；潮不记账，潮只回来。
//   祁清禅——抄经/木鱼/晚课/回向/拍子/白云庵；静，话极少，极稳。
//   阙守拙——钟杵/白石数目/脚印/剑鞘裹素布/「武当不催人」；数目话，慢。

var DUEL_SHOWCASES_1 = {
    // ============ 一、翻译大战（铁掌帮 × 天龙教） ============
    // 由头：苇滩水路的护镖合营旧约——铁掌帮出人，天龙教出旗与路引。两家的门派旧怨比两个人
    // 的年纪都大（初见由引擎按正邪底色种下带霜的一笔），偏偏两位当家都把你放在了心上。
    'tz_event_duel_long': {
        id: 'tz_event_duel_long', npcId: 'sect_leader_铁掌帮', guestId: 'sect_leader_天龙教',
        title: '翻译大战', icon: '🗣️',
        desc: '一个说哨语，一个借调子——两边都要你翻译，两边都在试你翻得实不实。',
        minAffection: 45, trigger: { random: 0.4 }, cooldown: 0, flag: 'tz_e_duel_long_done',
        requireGuestFeelings: true,
        autoTrigger: { location: '铁掌帮', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '苇滩水路的护镖合营，是铁掌帮与天龙教的老约：帮里出人，教里出旗与路引。这一日天龙教的来人进了帮厅——檀望舒，腰上挂着半面残铜镜，站在厅中，还没开口，四下陪坐的师妹们已经在交头接耳：跟天龙教打交道的人都知道，这位的话，得「翻译」。', type: 'description' },
            { speaker: 'npc', asNpc: 'sect_leader_天龙教', text: '（用黑袍知客的调子）「苇滩水路，天龙教的旗先行，铁掌帮的人后随。护镖的分成，照旧例，七三。」——知客的调子，官腔四平八稳，一个字也不涉及她自己。', emotion: 'solemn' },
            { speaker: 'npc', text: '裘霜莺的脸当场就凶了。她最恨官腔。她把茶碗往桌上一磕，转头瞪你：「翻译。她这一串——到底谁七谁三？」', emotion: 'serious' },
            { speaker: 'narrator', text: '你把「七三」翻成人话：教里拿七，帮里拿三。霜莺一听就炸了，一拍桌子：「三？谁定的三？」她从怀里摸出那支素坯泥哨，含在唇边吹了一声短促的——三短促，哨语里，这是「谈崩」。', type: 'description' },
            { speaker: 'npc', asNpc: 'sect_leader_天龙教', text: '（用香主的调子）「哨语三条，本座听得懂。三短促，谈崩。」她顿了顿，调子换了一副，（用云婆婆的调子）「娃儿，谈崩就谈崩，嗓门恁大做啥子。」——云婆婆的调子软绵绵的，话却不软。', emotion: 'neutral' },
            { speaker: 'npc', text: '霜莺的耳根红了。望舒话里那些「翻译」她听不全懂，可那股子居高临下她懂。她指着你，短句凶腔：「她说什么。一个字一个字翻。敢漏半个字——把你扔苇滩去。」', emotion: 'serious' },
            { speaker: 'narrator', text: '分成谈到第三轮，不知怎么，话头拐了个弯——从护镖的账，拐到了「你身边那个人」身上。两位当家同时住了口，同时看向你。帮厅里忽然静得能听见灯花爆。', type: 'description' },
            { speaker: 'npc', asNpc: 'sect_leader_天龙教', text: '（用护法长老的凶腔）「渡口那夜，本座候了两个时辰。」凶腔压到一半，压不住后半句——她停了。你注意到：她嘴边的调子标注停在那里，头一回，她没有找到一副能用的调子。两息之后，她重新挂上一副，（用黑袍知客的调子）「失言。护镖的事，接着议。」', emotion: 'hesitant' },
            { speaker: 'npc', text: '霜莺把泥哨攥在手心里，指节都白了。她不懂天龙教那一套调子的规矩，可她听懂了「候了两个时辰」。她也有她的规矩——哨语三条，「过来」那一条，这辈子只吹给一个人。她忽然把哨子举到唇边，当着满厅的人，朝你吹了一声：一长，一短。然后她一字一顿，凶腔里裹着一点抖：「哨语。你翻给她听——什么意思。」', emotion: 'determined' },
            { speaker: 'player_select', text: '两边的眼睛都落在你身上。你怎么翻译？', options: [
                { text: '照实翻：「一长一短——是『过来』。」', effect: 'honest' },
                { text: '故意翻错：「帮里的迎客哨，意思是『远客上座』。」', effect: 'lie' },
                { text: '不翻译——接过她手里的泥哨，原样回吹一声：一长，一短', effect: 'returnwhistle' }
            ]}
        ],
        effects: function(npc, choice) {
            var GUEST = 'sect_leader_天龙教';
            var aff = 0, msg = '', oaff = 0, pd = 0;
            switch (choice) {
                case 'honest':
                    aff = 6; oaff = -3; pd = 5;
                    msg = '「过来。」两个字落地，霜莺的耳根一路红到了脖子，凶脸挂不住了，扭头就吼师妹：「上茶！愣着做什么！」——吼完自己先灌了一大口。檀望舒静静听完翻译，指尖在残铜镜的断口上摩了一遍，（用云婆婆的调子）「娃儿，脸红咯。」调子是打趣的调子，说完她自己顿了顿，又挂上一副官腔，（用黑袍知客的调子）「分成，五五。」满厅皆惊——天龙教让了两个数。霜莺狐疑地眯起眼：「她方才说什么？」你还没翻，望舒已经朝她微微颔首，转身出厅，走到门口停了一步，没回头，（用香主的调子）「哨语三条，本座记下了第一条。」';
                    break;
                case 'lie':
                    aff = -6; oaff = 2; pd = -4;
                    msg = '「远客上座。」你翻完，霜莺盯着你看了三息——她不傻，自己吹的哨语，自己知道吹的是什么。她试的从来不是望舒，是你。「远客。」她把这两个字嚼了嚼，声音很轻，轻得不像她，「好。远客上座。」她站起身，朝望舒一抱拳，语气恢复了官面：「分成照旧例，七三就七三。旗归你们，人归我们。」谈成了，谈得比谁都快。望舒深深看了你一眼，（用云婆婆的调子）「这位小友，翻译翻得——体贴。」霜莺送客送到帮厅门口，只留了一句给你，短句凶腔，一个字没吼出来：「护镖的账翻得，别的账——你往后自己翻。」';
                    break;
                case 'returnwhistle':
                    aff = 8; oaff = 0; pd = 2;
                    msg = '你从她手里接过泥哨，哨身上还带着她掌心的汗。你含住，原样回吹：一长，一短。「过来」对「我在」——哨语没有这一条应答，是你现编的，可满厅的师妹都听懂了。霜莺整个人钉在原地，凶脸碎了一地，耳朵红得像要滴血，半晌憋出一句：「……谁教你这么吹的！」声音是凶的，尾音是飘的。檀望舒看着你们两个，看了很久，（用黑袍知客的调子）「哨语，本座不懂。」她顿了顿，这一顿比哪一顿都长，（用云婆婆的调子）「但是本座看懂了。」她转身出厅，这一回分成让到了五五，路引当场画押。后来苇滩的护镖队里流传：那日帮厅里有一声哨，把七三吹成了五五——没人知道为什么，只有三位当事人各自记了一辈子。';
                    break;
            }
            return { affection: aff, msg: msg, others: [{ id: GUEST, affection: oaff }], pair: { delta: pd, with: GUEST } };
        }
    },

    // ============ 二、公文互批（侠隐阁 × 阎罗殿） ============
    // 由头：阎罗殿发来跨界协查公文，聂明泽亲自来侠隐阁核验回档——两套档规头一回正面相撞。
    // 巧的是，两家的档里，各有一页关于你：一本生死簿「命格：未定」，一栏「危险程度」空白。
    'yin_event_duel_yan': {
        id: 'yin_event_duel_yan', npcId: 'sect_leader_侠隐阁', guestId: 'sect_leader_阎罗殿',
        title: '公文互批', icon: '📜',
        desc: '两套档规互相批对方的公文——批着批着，批到了同一页：你。',
        minAffection: 45, trigger: { random: 0.4 }, cooldown: 0, flag: 'yin_e_duel_yan_done',
        requireGuestFeelings: true,
        autoTrigger: { location: '侠隐阁', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '协查的公文从阎罗殿发来：跨界旧案，请侠隐阁核验一人近三年行止。简知忆按档规验了公文的三条腿——来路明、口气稳、日子实，归进「待勘」格。核验这日，来人亲自上了东院：聂明泽，袖里插着一管朱笔。', type: 'description' },
            { speaker: 'npc', text: '知忆照档规待客，茶还没上，先批对方的公文——档廊的人，见不得格式错。「贵殿这纸跨界协查，签押的格式错了一行。」她的档笔悬着没落，「来路栏与判语栏，前后颠倒了。按档规，该驳回。」她顿了顿，抬眼，「驳回了，你就得再跑一趟。」', emotion: 'serious' },
            { speaker: 'npc', asNpc: 'sect_leader_阎罗殿', text: '聂明泽不恼。他把袖中朱笔抽出来，反手翻开侠隐阁的回档底稿，一页一页，看得极慢。「贵阁的勘语栏，『存疑不究』四个字——」朱笔在纸面上轻轻一点，「在阎罗殿的簿上，这四个字，叫『判语未定』。未定不是不究。未定，是等。」他抬起眼，「贵阁把『等』写成了『不究』。这一笔，比签押颠倒，错得大。」', emotion: 'serious' },
            { speaker: 'narrator', text: '两个人你来我往批了三轮，谁也没让谁一寸。你渐渐看明白了：这不是在核档，是两套档规都想把对方收编进自己的格子里。然后——聂明泽的手指停在回档底稿的一页上。那一页上，有你的名字。', type: 'description' },
            { speaker: 'npc', asNpc: 'sect_leader_阎罗殿', text: '「这一档。」他的声音低了半分，朱笔悬在你的名字上方，悬着，没落下去，「阎罗殿的生死簿上，也有一页。命格栏，四个字——未定。」他看向知忆，「贵阁的危险程度栏，写的什么？」', emotion: 'deep' },
            { speaker: 'npc', text: '知忆的档笔停在半空。停了三息，她答得一字一顿：「本阁的栏，写的是本阁的档规。贵殿的朱笔——不能跨格。」她合上回档底稿，动作很稳，「但，人在这里。你自己问。」', emotion: 'neutral' },
            { speaker: 'narrator', text: '两位记档人的目光同时落到你身上。一个手里是生死簿的「未定」，一个手里是危险程度的空白——两页档，都在等你自己给一句勘语。东院的空气凝住了，只有朱笔在指间转了半圈，停住。', type: 'description' },
            { speaker: 'player_select', text: '两页档都空着。你的勘语，怎么给？', options: [
                { text: '「据实写。我的命格我自己勘——两页，并案。」', effect: 'both' },
                { text: '「侠隐阁的档是侠隐阁的事。朱笔跨格，贵殿失仪了。」', effect: 'side_host' },
                { text: '「生死簿的未定，总悬着不是事。聂先生，落笔吧。」', effect: 'side_guest' }
            ]}
        ],
        effects: function(npc, choice) {
            var GUEST = 'sect_leader_阎罗殿';
            var aff = 0, msg = '', oaff = 0, pd = 0;
            switch (choice) {
                case 'both':
                    aff = 6; oaff = 4; pd = 8;
                    msg = '「并案。」两个字出口，两位记档人都怔了。知忆先醒过来，档笔落纸，在危险程度那一栏里写了四个字：「人在，语给。」写完把笔搁下，朝聂明泽微微颔首——这是档规里，主档人给协查人的全礼。聂明泽的朱笔在「未定」上方悬了最后一息，终于落下去，落的不是判语，是一行小注：「人自供稿，并案存参。」两套档规斗了一下午，谁也没收编谁——却因为一句「并案」，头一回并到了同一页上。他收簿起身，走到东院门口，回头看了知忆一眼：「贵阁的『存疑不究』——」朱笔在袖口顿了顿，「往后，改批『存疑，等人』。人，我替你等着核。」';
                    break;
                case 'side_host':
                    aff = 4; oaff = -6; pd = -8;
                    msg = '聂明泽的朱笔收回袖中，不怒，也不辩：「跨格，是我的失仪。」他把协查的公文一张一张理齐，动作慢得像在理自己的筋骨，「但，未定的那一页，阎罗殿收着。」他朝知忆拱手，礼数一丝不错，错的是话：「贵阁的档规护得住纸，护不住人。等——我们惯于等。」他出了东院，脚步在第十七级台阶上顿了半息。知忆站在原地，把回档底稿归档，归了很久——归完，她抽出一页附页，添了一行小字，添完没有销毁：「今日之语，记正卷。」她抬头看你，档廊三百年的静水里，头一回起了一点波纹：「正卷只进不毁。你这一句，档廊替你记一辈子。」';
                    break;
                case 'side_guest':
                    aff = -6; oaff = 4; pd = -5;
                    msg = '知忆的档笔落下去——不是落向栏目，是一滴墨，落在空白档案页上，洇开。她把那页合上，声音稳得听不出任何东西：「落笔，好。」她转向聂明泽，一字一顿，「贵殿的朱笔，今日跨格了。跨格的勘语，本阁——存疑，不究。」聂明泽看了她三息，朱笔终究没有落向你的命格栏。他把生死簿收进袖中，朝你微微摇头：「未定，比写死好。这一页，我继续替你悬着。」他走后，知忆在东院站到深夜。附页写了三行，销毁了三行——第四行留了下来，四个字：「存疑，不究。」第二天档廊的人发现，「近手」那一格的卷首，多了一页空白封皮，封皮上什么都没有。什么都没有，就是档廊最重的批注。';
                    break;
            }
            return { affection: aff, msg: msg, others: [{ id: GUEST, affection: oaff }], pair: { delta: pd, with: GUEST } };
        }
    },

    // ============ 三、对账（全真教 × 蓬莱派） ============
    // 由头：全真教的功业账与蓬莱的潮信图录之间，悬着一笔三年的香火旧账。瀛晚照携图录上山
    // 对档——翀玉衡要结旧账，也要私结另一笔：你的那一栏，蓬莱的册子上记了几笔。
    'qz_event_duel_pl': {
        id: 'qz_event_duel_pl', npcId: 'sect_leader_全真教', guestId: 'sect_leader_蓬莱派',
        title: '对账', icon: '🧮',
        desc: '算盘对潮录——公账三百年，私账没人记得动。今日两笔一起结。',
        minAffection: 45, trigger: { random: 0.4 }, cooldown: 0, flag: 'qz_e_duel_pl_done',
        requireGuestFeelings: true,
        autoTrigger: { location: '全真教', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '蓬莱的来客带着一只图录匣上山：两家之间悬着一笔三年的香火旧账。翀玉衡在功业房开账，银算盘往案上一摆，账珠擦得发亮——账房的规矩，对账开始，闲人免言。', type: 'description' },
            { speaker: 'npc', text: '「香火钱，三百两，悬三年。」她的手指搭在算珠上，不推，「利息按账走，一年两厘。此债记账——今日，两讫。」她抬起眼，账房腔一字不多，「另外。贵派的潮信图录里，有一栏，叫『岸上人』。这一栏记的是什么，蓬莱自己清楚。」', emotion: 'serious' },
            { speaker: 'npc', asNpc: 'sect_leader_蓬莱派', text: '瀛晚照打开图录，翻到一页，转过去，推到她面前：「潮，不记账。」她的手指顺着一行小字滑下去，「潮只回来。三年，『岸上人』那一栏，每一笔都是回来的潮——贵教的香船出海十七次，我录了十七笔。你记利息，我记潮。两种记法，先结哪一种？」', emotion: 'neutral' },
            { speaker: 'narrator', text: '算珠与录页来回了三轮。三百两的香火账，其实好结；不好结的是另一笔——玉衡推珠的时候，算盘上分明是「存疑」；晚照翻页的时候，图录里分明是「岸上人」。两本账，各记着同一个人：你。', type: 'description' },
            { speaker: 'npc', text: '翀玉衡忽然把算盘一合，「啪」的一声脆响，功业房里烛火都晃了晃。「公账结完了。」她看着你，账房腔没有乱，可语速比平常快了一线，「私账问一句。你的那一栏——在蓬莱的册子上，是只进不出，还是，不是？」', emotion: 'hesitant' },
            { speaker: 'npc', asNpc: 'sect_leader_蓬莱派', text: '晚照翻页的手停了一息。她合上图录，把它抱在怀里，抱得像抱一只旧螺：「这一问，图录不答。」她看向窗外——窗外是山，她看的是海的方向，「潮答。那年观汐台，亥时的潮回了两回。头一回我抬头，是你。」她顿了顿，声音低下去，「这一笔，我没入册。没入册的东西——最贵。」', emotion: 'deep' },
            { speaker: 'narrator', text: '「没入册的东西最贵」——翀玉衡的手指在算珠上收紧了。两个不说同一种话的人，在这一句上，听懂了彼此。功业房里很静，银算盘上最后一颗珠停在半途，推不到底，也拨不回来——账房的语里，这一颗珠，叫停珠。', type: 'description' },
            { speaker: 'player_select', text: '一本功业账，一本潮信录，两笔私账都摊开了。你怎么结？', options: [
                { text: '「公账照结；没入账的那一笔——我认。两笔，我都认。」', effect: 'both' },
                { text: '「香火钱三百两，我替蓬莱垫了。私账——你们自己对。」', effect: 'public' },
                { text: '「不对了。这笔账，我全押——两边的账，一起记。」', effect: 'allin' }
            ]}
        ],
        effects: function(npc, choice) {
            var GUEST = 'sect_leader_蓬莱派';
            var aff = 0, msg = '', oaff = 0, pd = 0;
            switch (choice) {
                case 'both':
                    aff = 6; oaff = 5; pd = 6;
                    msg = '翀玉衡把那颗停珠推到底——「啪」。讫了。公账两讫，利单她当场写了，写完就着烛火烧了：「公账的利，结给纸。」私账她另起一页，条目名自拟，拟了三个字：「同签押。」笔递过来的时候，账房腔终于乱了一线：「签押要两造。你，算一造。」瀛晚照这边，重新打开图录，翻到「岸上人」那一栏，就着功业房的烛火添了一行小字——添完把册页转过来给你看：新墨未干，记的不是潮，是今日的日子。她合上图录，说了今夜唯一一句不像录语的话：「潮回了两回的那年，我以为录迟一刻是手误。今日才知道——那一笔，是心误。心误的账，入册了。」';
                    break;
                case 'public':
                    aff = -4; oaff = -4; pd = -3;
                    msg = '三百两香火钱，你当场垫了，公账结得干干净净——干净得像把私账扫进了灰堆。翀玉衡收了银，账笔搁下，账房腔恢复了四平八稳：「公账，讫。私账——存疑。」她把功业账合上，合得很轻，轻得像怕惊动什么。瀛晚照把图录收进匣子，扣好：「潮不等人。不入册，我就自己记。」她朝你颔首，礼数周全，周全得没有一丝缝。两人在山门口分手，一个回海，一个回功业房，谁也没再提「岸上人」三个字。当夜，功业房的算盘响了一声——只一声，是停珠自己滑回了原位；观汐台的灯，比平常晚熄了一刻。两本账都还在记，只是从这一天起，各自记各自的，再没并到过一页上。';
                    break;
                case 'allin':
                    aff = 9; oaff = 7; pd = 10;
                    msg = '「全押。」账房最重的两个字，你当着两本账说出口。翀玉衡怔了整整三息，忽然笑了——账房先生笑起来，算盘都跟着颤。她双手把整档算珠一把推到底，噼啪一声连响，像放了挂小炮：「全押。此债记账——利，按一辈子算。算不清，好。算不清的账，讫不了；讫不了的账，才叫账。」她提笔落条目，笔尖都劈了。瀛晚照打开图录，翻到一页空白——二十年的潮信录，头一回见到空白页——她提笔写了四个字，合上，不给任何人看。后来你在观汐台上见过那四个字，就着月光，笔迹被海风吹得微微发颤：「潮，归于岸。」那晚功业房的灯与观汐台的灯，一南一北，亮到了同一个时辰。';
                    break;
            }
            return { affection: aff, msg: msg, others: [{ id: GUEST, affection: oaff }], pair: { delta: pd, with: GUEST } };
        }
    },

    // ============ 四、辩戒（恒山派 × 武当派） ============
    // 由头：佛道议戒是两家三年一次的老例，今年设在恒山白云庵。阙守拙携剑上山观戒——
    // 辩题「戒律管不管得住心」，辩到最后，每一条论据都指向同一个人：你。
    'heng_event_duel_wd': {
        id: 'heng_event_duel_wd', npcId: 'sect_leader_恒山派', guestId: 'sect_leader_武当派',
        title: '辩戒', icon: '☯️',
        desc: '木鱼少了一声，白石不入数——两个守戒的人，当着彼此认了同一件事。',
        minAffection: 45, trigger: { random: 0.4 }, cooldown: 0, flag: 'heng_e_duel_wd_done',
        requireGuestFeelings: true,
        autoTrigger: { location: '恒山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '佛道议戒，两家三年一次的老例，今年设在恒山白云庵。武当派的阙守拙携剑上山——剑还在鞘里，鞘上裹了素布，观戒的礼数，兵刃不露锋。禅堂里炭火初生，两边蒲团摆开，钟杵与木鱼各归各位。', type: 'description' },
            { speaker: 'npc', text: '祁清禅在禅堂主位待客，先敲了三声木鱼定拍——拍子稳得像庵前的石阶。「戒文不问门第，只问心。」她的声音很静，静得让炭火的声音都清晰起来，「阙道长上山观戒，请。今日的题——戒律，管不管得住心。」', emotion: 'solemn' },
            { speaker: 'npc', asNpc: 'sect_leader_武当派', text: '阙守拙在客座落定，剑鞘横在膝上，素布抚平。「武当管剑，不管心。」他说得很慢，像数数目，「剑有鞘。鞘，是剑的戒。心没有鞘——管不住，只能数。」他从袖中摸出一枚白石，搁在案上，「心动一回，数一枚。数到头，就算管住了。我数了半辈子。」', emotion: 'neutral' },
            { speaker: 'narrator', text: '木鱼一拍，白石一枚。戒与数你来我往，辩得极正，论据极稳——直到祁清禅的木鱼，停了一拍。那一拍，少敲了一声。白云庵的晚课拍子，她十年没有错过；今日当着客，错了一声。', type: 'description' },
            { speaker: 'npc', text: '她没有去补那一拍。她先念了一声佛号，很轻，轻得像给自己听的。「少的那一声——」她抬起眼，目光越过阙守拙，落在你身上，静得像古井，「经上有回向的一栏。回向栏里，记着一个名姓。道长，你的白石——数到过这一枚么。」', emotion: 'deep' },
            { speaker: 'npc', asNpc: 'sect_leader_武当派', text: '阙守拙的手指停在白石上。他看着案上那枚石子，看了很久，又抬眼看了看你——然后把白石收回了袖中。没有数。「那一枚，不入数。」他说，声音还是那么慢，只有剑鞘在膝上挪了半寸，泄露了什么，「数是数野心的。那一枚——」他停了足足两息，「不是野的。」', emotion: 'hesitant' },
            { speaker: 'narrator', text: '禅堂里静下来。一声少掉的拍子，一枚不入数的白石——两个守戒的人、两个计数的人，当着彼此的面，用各自的本行，认下了同一件事。辩题「戒律管不管得住心」，不用再辩了：答案已经由两个人同时给出——管不住。炭火哔剥响了一声，像是替谁叹了口气。', type: 'description' },
            { speaker: 'player_select', text: '辩不下去了。你怎么收这一场？', options: [
                { text: '「今日议戒，到此为止。戒管不住心——两位已经各自作证了。」', effect: 'close' },
                { text: '问祁清禅：「回向栏里那个名姓——是谁的？」', effect: 'ask_heng' },
                { text: '问阙守拙：「『那一枚不是野的』——什么意思？」', effect: 'ask_wd' }
            ]}
        ],
        effects: function(npc, choice) {
            var GUEST = 'sect_leader_武当派';
            var aff = 0, msg = '', oaff = 0, pd = 0;
            switch (choice) {
                case 'close':
                    aff = 5; oaff = 5; pd = 8;
                    msg = '你把辩题收了，两个人都像卸了一副担子。祁清禅拾起木鱼槌，把少的那一拍补敲了——「笃」，拍子全了，白云庵的晚课从这一声起恢复了十年的稳。阙守拙起身，却把那枚白石重新拿出来，搁在禅案的角上，没有收：「石头留在白云庵。下回议戒，我来取——取的时候，再数。」议戒的老例，从这一日起多了一条新注：主客各留一物，为下回之证。三年后武当山钟杵响时，恒山会有人上山；三年后白云庵木鱼定拍时，武当会有人听钟。你收的这一段辩，后来成了两家弟子口口相传的公案——公案的名字起得很平实：「管不住」。';
                    break;
                case 'ask_heng':
                    aff = 6; oaff = -2; pd = -3;
                    msg = '木鱼又响了一声——不是补拍，是止语。祁清禅答得很静：「回向栏，回向给众生。众生里——有一个，是特别的众生。」她没有看你，看着炭火，「那个名姓，晚课之后，我抄给你。纸上，不问。」阙守拙起身，拱手，拾起剑鞘，礼数一丝不乱：「戒文不问门第。问到这里——够了。」他下山的脚步很稳，稳得像数目，只有在第十七级台阶上，顿了半息。你后来数过，那半息不长，恰好够一声木鱼从庵里传到山道。晚课后，祁清禅真的抄了一个名姓给你，纸上只有名姓，没有旁注。她说：「回向栏里记名姓，不记因果。因果——」她把纸折成方胜，「在你手里，不在经上。」';
                    break;
                case 'ask_wd':
                    aff = -2; oaff = 6; pd = -3;
                    msg = '阙守拙看了你三息，把那枚白石重新拿出来，放进你的掌心——石头被袖中养了半辈子，是温的。「『不是野的』，什么意思——石头知道。」他说，「武当的白石，只数野心。野心入了数，数到头，就放下了。」他拾起剑鞘，把素布抚平，一字一字，慢得像敲钟杵：「那一枚，不入数。因为——它入了鞘。」鞘是剑的戒。剑已入鞘，戒已守住——这句话的意思，禅堂里三个人都听懂了。祁清禅的木鱼敲了一声，只一声，是送客的拍子，拍子很稳，稳得近乎温柔。阙守拙下山后第七日，武当山寄来一只小匣，匣里一枚白石，石上用刀刻了极小的两个字：「已数。」——入了数的，是放下了的；寄回来的，是放不下的。这笔数目账，你用了很多年才读懂。';
                    break;
            }
            return { affection: aff, msg: msg, others: [{ id: GUEST, affection: oaff }], pair: { delta: pd, with: GUEST } };
        }
    }
};

// ============ 合并进总事件池 ============
if (typeof NPC_PERSONAL_EVENTS !== 'undefined') {
    Object.assign(NPC_PERSONAL_EVENTS, DUEL_SHOWCASES_1);
}

// ============ 每日兜底钩子（卷一卷二共用） ============
// 对局带 autoTrigger，本可搭各自主人的每日钩子顺路弹出；但主人线终章完结后那条钩子会停摆，
// 这里的兜底不读终章，只认：人在主人门中 + 门禁全过（含来客对你有心）+ 低概率。一天至多一桩。
function _duelFire(evId, npcInst) {
    setTimeout(function() {
        if (document.querySelector && document.querySelector('.personal-event-modal')) return;
        var ev = NPC_PERSONAL_EVENTS[evId];
        if (!ev) return;
        if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npcInst)) return;
        if (typeof triggerPersonalEvent === 'function') triggerPersonalEvent(evId);
    }, 1200);
}

if (typeof window !== 'undefined' && window.timeSystem && window.timeSystem.onNewDaySubscribe) {
    window.timeSystem.onNewDaySubscribe(function() {
        try {
            if (!window.currentCharData || !window.npcManager) return;
            var loc = window.currentCharData.location || '';
            if (!loc) return;
            if (document.querySelector && document.querySelector('.personal-event-modal')) return;
            var pools = [window.DUEL_SHOWCASES_1 || {}, window.DUEL_SHOWCASES_2 || {}, window.DUEL_SHOWCASES_3 || {}, window.DUEL_SHOWCASES_4 || {}];
            var cands = [];
            pools.forEach(function(pool) {
                Object.keys(pool).forEach(function(eid) {
                    var ev = pool[eid];
                    if (!ev || !ev.autoTrigger || ev.autoTrigger.location !== loc) return;
                    if (typeof hasEventTriggered === 'function' && hasEventTriggered(eid)) return;
                    var npc = window.npcManager.getNPC ? window.npcManager.getNPC(ev.npcId) : null;
                    if (!npc) return;
                    if ((npc.relationship && npc.relationship.affection || 0) < (ev.minAffection || 0)) return;
                    if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npc)) return;
                    cands.push({ eid: eid, npc: npc });
                });
            });
            if (!cands.length) return;
            var pick = cands[Math.floor(Math.random() * cands.length)];
            if (Math.random() < 0.35) _duelFire(pick.eid, pick.npc);
        } catch (e) { console.warn('[双人对局] 每日兜底失败:', e); }
    });
}

// ============ 导出 ============
if (typeof window !== 'undefined') {
    window.DUEL_SHOWCASES_1 = DUEL_SHOWCASES_1;
}
console.log('[双人对局·卷一] 加载完成：' + Object.keys(DUEL_SHOWCASES_1).length + ' 桩（翻译大战/公文互批/对账/辩戒）');
