// ==================== wujiu-jealousy.js - 破戒僧·无咎吃醋套装 v20.80（灶台九桩） ====================
// 依赖：npc-personal-events.js（NPC_PERSONAL_EVENTS / canPlayerAccessPersonalEvent / hasEventTriggered）、
//       jealousy-social.js（_jealPartySuspects / _jealOnSceneShow 的 composeRival 合成 / 关系写回）、
//       heroine-rivalry.js + male-lead-rivalry.js（全局 detectRivalRomance）
// 加载顺序：在 jealousy-social.js 之后
//
// 无咎不在任何名册（特殊紧凑线），此前吃醋全套与他无缘——这一包补上他的独特反应。
// 他的吃醋不撞进任何一套既有模板：不对峙、不质问、不冷战、不写偈子。
// 他是火头僧——心里的事，全进灶：柴账上多出的行、抖了的手、压歪的饭、凉掉的第三更、
// 端出灶房又收上最高架的那只锔钵。全寺都从他的饭里读出他的心事，只有他自己装作不知道。
//
// 声口铁律（与主线一致）：憨直里带自嘲，讲心事像讲别人的笑话；口头禅「佛看见，也会懂的。」
// 灶的理压过一切情绪的理：饭是饭，账是账，火是火。信物专属：锔钵（七枚锔钉）、戒折页、
// 柴账、压实的饭、锅巴头功——一概是他的，不碰任何一位名册主角的意象；
// 禁用：酒具（破酒戒旧事只主线一句带过）、木鱼/抄经纸（恒山）、批注经/念珠（竺照禅）、
// 糖葫芦/山楂（隗九爻）、百衲衣/青布（嵩山）。
// 合唱队：挑水老杂役（灶房三十年的翻译官）、山下送豆老居士、小武僧——他的心事由旁人说破，
// 他自己永远只说「吃饭」。
//
// 九桩结构：柴账（察觉）→ 手抖（藏不住）→ 成精的锅（日常·可重演）→ 凉了的饭（受伤）
//   → 端出灶房的那碗（气度·动态情敌合成）→ 灶角的眼（同行嫌疑·队伍门禁）
//   → 两双筷子（定情后的独占）→ 灶王爷的名帖（日常·可重演）→ 压实的饭（顶峰·两碗一样平）
// 动态情敌桩（j05/j09）标 composeRival：开帘时由 jealousy-social 引擎按 detectRivalRomance
// 当场把 {rival} 换成真名——名随人换，每次开帘从原稿重新合成。
// 关系网真源：j05/j09 的选择通过 effects 返回 pair 写回无咎↔情敌的社交关系（npcRelationships），
// 戏演完，账留下。

var WUJIU_JEAL_EVENTS = {
    'wujiu_event_j01': {
        id: 'wujiu_event_j01', npcId: 'shaolin_wujiu', title: '柴账', icon: '🪵',
        desc: '灶房的柴账上，这个月多了一行小字。',
        minAffection: 40, trigger: { random: 0.3 }, cooldown: 0, flag: 'wujiu_ej01_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你上山来灶房搭手，挑水的老杂役把你拉到柴垛边，压着嗓子，翻开一本油浸浸的册子——灶房的柴账。他指给你看最新的一行小字：「是月，柴费二分。」', type: 'description' },
            { speaker: 'narrator', text: '「柴费得凶，是火烧得凶。」老汉把册子合上，「灶上这半个月，火就没温柔过。他没多说过一个字——全寺的饭照旧香，就火，凶。」他朝灶房努努嘴，「你在外头的事，山下香客都传上来了。他不问。他只烧火。」', type: 'description' },
            { speaker: 'npc', text: '无咎盛了饭出来，照旧冒尖，照旧压实——只是压完，手在碗沿上停了半息。他把碗递给你，蹲回灶边添柴，声音混在热气里，平得像报账：「吃饭。灶上没事——就是柴费得快。火凶，饭香。」', emotion: 'neutral' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '把话说明白：「我心里有人了。这事，我不瞒你。」', effect: 'tell' },
                { text: '「柴账只管柴，别管人。你的饭，天下最好吃。」', effect: 'comfort' },
                { text: '「你想多了。烧你的火吧。」', effect: 'deflect' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            var rname = rival ? rival.name : '那人';
            var aff = 0, msg = '';
            switch (choice) {
                case 'tell': aff = 6; msg = '他添柴的手停了两息，然后笑了，笑比平常慢了半拍：「好。话说在明处，像饭压在碗里——实。」他把锅重新坐上，火拨得旺了些，「' + rname + '……这名字我在香客嘴里听过。人在江湖，心在人身上，我懂。」他背对着你，声音混在柴火声里，「佛看见，也会懂的。我懂不懂的——你那碗饭，往后照旧给你盛。就是要学着自己端平。」当夜柴账上多了一行小字，老杂役后来指给你看：「心乱半月，自今夜，不乱。」那两个字「不乱」，写得特别用力，笔画都劈了。'; if (npc.relationship) npc.relationship.trust = Math.min(100, (Number(npc.relationship.trust) || 0) + 3); break;
                case 'comfort': aff = 3; msg = '他摆摆手，手上的灰扑下来一片：「饭好不好吃，是吃的人定的，不是我定的。」话说得谦虚，可那晚的锅巴，最大最完整的一块，铲下来进了你的碗。他看你捧着锅巴，忽然补了一句，说得一本正经：「柴账记柴，米账记米——你这一句，我记在哪本账上，你别问。」老杂役在旁边咳嗽了一声，把笑憋进了水瓢里。'; break;
                case 'deflect': aff = -4; msg = '他添柴的手没停：「没想多。柴就是柴。」之后他一个字也没再问，饭照旧，笑照旧，锅铲起落照旧稳。可老杂役悄悄告诉你：那个月的柴账，月底又多了一行——「柴费，如常。」老汉说，如常两个字最吓人：「人心乱的时候，火凶；人心没处放了，火就如常了。凶是还在乎，如常——是认了。」你后来想过好几回要不要把那句话说圆，可每回到灶房，他都先开口：「吃饭。」话头堵得严严实实，像那口压得实实的饭。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'wujiu_event_j02': {
        id: 'wujiu_event_j02', npcId: 'shaolin_wujiu', title: '手抖', icon: '🤲',
        desc: '他舀汤的手抖了一下——三十年，头一回。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'wujiu_ej02_done',
        requireRivalRomance: true, requireEventDone: 'wujiu_event_j01',
        scenes: [
            { speaker: 'narrator', text: '晌午的灶房忙得像打仗。无咎一手掂锅一手舀汤，三十年滴洒不漏的功夫——今天，手抖了一下。一勺滚汤泼在手背上，那里烫疤叠着烫疤，又添了新的一道。', type: 'description' },
            { speaker: 'npc', text: '他甩了甩手，自己先笑了，笑得比往常响，响得像遮掩：「手有自己的想法。」他把勺搁下，用围裙裹住手背，继续颠锅，「不碍事。灶上的人，烫疤就是工龄。」', emotion: 'hesitant' },
            { speaker: 'narrator', text: '轮到盛你的饭——那只手又抖了一下。饭压歪了，一边高一边低。他盯着那碗歪饭看了两息，像盯着一个不认识的东西。老杂役在旁边看得直咂嘴：三十年，那人盛饭从没歪过。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '接碗就吃：「歪的也好吃。我都吃光。」', effect: 'eat' },
                { text: '拉过他的手看那道新烫：「疼不疼？」', effect: 'burn' },
                { text: '不说话，把饭吃净，自己洗了碗放回灶角', effect: 'silent' }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'eat': aff = 5; msg = '他看着你把那碗歪饭吃得干干净净，碗底都见了光。半晌，他把围裙一解，重新生了一小锅火：「这碗算失手。失手的饭叫人吃了——」他压了新的一碗，压得平平的，边是边、角是角，推到你面前，「这碗才是正经的。方才那碗，算我练功。」你问他练的什么功。他蹲回灶边，半天，闷闷地答了四个字：「手上的功。」老杂役后来翻译：灶上的规矩，手不听心的使唤了，就得重新练——练到心说什么，手做什么。那一个月，他天天练，全寺跟着天天吃双份的好饭。'; break;
                case 'burn': aff = 6; msg = '他的手僵了一下——一只四十岁的大手，从你掌心里往回抽，抽了两息，到底没抽走。烫疤叠着烫疤，新的一道已经起了白泡。「疼。」他答得老实，随即又自嘲，「旧账上添新账，不亏。」当晚戒堂的药房送来一瓶烫伤膏，送药的小沙弥说，药头师父什么都没问，就说了一句「灶上的手，金贵」。他接了药，朝药房的方向合了合十，回头跟你说：「你看，破戒僧的手，也有人疼。」他说「也有人疼」四个字的时候，看着灶火，没看你。'; if (npc.relationship) npc.relationship.trust = Math.min(100, (Number(npc.relationship.trust) || 0) + 2); break;
                case 'silent': aff = 4; msg = '你把饭吃净，端起碗到水缸边洗了，倒扣回灶角——灶房的规矩，谁吃完谁洗碗。他瞥了一眼，什么也没说，只是那晚添柴添得特别勤。第二天，你的饭又是压得平平整整的了，边上还多卧了一张豆腐皮。老杂役蹲在门槛上跟你咬耳朵：「昨夜他压了三回火，压一回，念叨一句。」你问念叨什么。老汉学着他的腔调，压低声音：「——那人把碗洗了。碗认那人。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'wujiu_event_j03': {
        id: 'wujiu_event_j03', npcId: 'shaolin_wujiu', title: '成精的锅', icon: '🍲',
        desc: '全寺都说灶房的锅成精了——饭格外香，人格外闷。',
        minAffection: 45, trigger: { random: 0.25 }, cooldown: 0, flag: 'wujiu_ej03_done',
        ambient: true, repeatEvery: 30,
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '小武僧们最近在传一桩怪事：灶房的锅成精了。饭格外香，香得晚课的佛号都念快了半拍——可掌锅的人格外闷，闷得一天说不上十句话。他们公推你去「查案」，查完回来汇报。', type: 'description' },
            { speaker: 'narrator', text: '你到灶房一看：锅没成精。锅还是那三口锅，人是把话全下了锅。无咎颠着勺，热气腾起来，他的脸在热气后头，看不真。听见你进来，他只问了三个字，问得跟三十年来的每一天一模一样：', type: 'description' },
            { speaker: 'npc', text: '「吃了没？」', emotion: 'neutral' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「锅真成精了——它替你说话呢。」', effect: 'jest' },
                { text: '「有话就说。锅替你说不了一辈子。」', effect: 'say' },
                { text: '坐下，陪他吃一顿饭，什么都不问', effect: 'sit' }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'jest': aff = 4; msg = '他愣了一拍，笑出声，笑得锅铲都停了：「你倒会听锅说话。」他掀开锅盖，热气腾了满屋：「锅成精，人不能成锅。人得吃饭。」他给你盛了饭，多添了半勺，添得理直气壮：「听得懂锅话的人，配吃锅赏的饭。」你捧着碗问他，锅都说什么了。他想了想，答得极认真：「锅说——那人今日来得早。」'; break;
                case 'say': aff = 5; msg = '他的锅铲停住了。灶房里只剩柴火噼啪。半晌，他把饭压进碗里，压得特别实，递给你，才开口：「说什么呢。要说的，饭里都说了。」话虽这么说，那晚你帮他看火的时候，他忽然又开了腔，声音压得很低：「灶上的饭，好不好吃，灶自己知道。我烧了三十年——头一回盼着灶别知道。」你问为什么。他往灶膛里添了根柴，火星子噼啪跳：「灶要是知道了，饭就该咸了。」'; break;
                case 'sit': aff = 6; msg = '你坐下，他盛饭，两个人吃了一顿饭，一句话没说。你吃完洗碗，他看火。灶房里只有筷子碰碗的声、柴火的声、锅里的声——三种声音，倒比说话还热闹。你走的时候，他在背后开口了，声音混在热气里：「往后想吃饭，就来。灶房没门槛——门槛是给人设的，不是给吃饭设的。」老杂役蹲在角上削扁担，后来跟人学舌：「那顿饭，师父添了三回柴。」他顿了顿，把话翻成人话：「添柴是怕火灭。怕火灭——是心里热。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'wujiu_event_j04': {
        id: 'wujiu_event_j04', npcId: 'shaolin_wujiu', title: '凉了的饭', icon: '🌙',
        desc: '三更，灶头那碗多盛的饭凉了——火没人看。',
        minAffection: 50, trigger: { random: 0.3 }, cooldown: 0, flag: 'wujiu_ej04_done',
        requireRivalRomance: true, requireEventDone: 'wujiu_event_j02',
        scenes: [
            { speaker: 'narrator', text: '三更天，你误了事情摸到灶房——灶头那碗多盛的饭还在，可它是凉的。灶膛里的火压死了，没人看。无咎坐在灶边的条凳上，没添柴，没颠勺，两只手笼在袖子里，像半截凉透的灶塔。', type: 'description' },
            { speaker: 'npc', text: '他听见门响，没抬头，只朝灶头那碗饭偏了偏下巴：「凉了。」顿了顿，他把自己的旧话原样搬了出来，一个字一个字，像在念别人写的话：「饭凉了，再热给谁吃，都不是那个味了。——这个道理，我比谁都懂。」', emotion: 'deep' },
            { speaker: 'narrator', text: '你这才明白：不是他忘了看火。是昨夜你没来，他守着那碗饭，守到它凉，守着它凉完——他拿自己的话，浇自己的心。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '蹲下去拨火，重新生起来：「这碗热一热，一人一半。」', effect: 'refire' },
                { text: '「往后火也为自己看——凉了，就别等。」', effect: 'self' },
                { text: '端起那碗凉饭，当场吃了', effect: 'eat' }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'refire': aff = 7; msg = '你蹲到灶膛前拨火，他看了你两息，也蹲了下来——两个人一个递柴一个拨,火重新活了。饭热上锅的时候，他把留三分火眼盖七分灰的老法子又教了你一遍，教得极耐心，像把一样要紧的东西往你手里放。饭热好了，他摇头：「味不一样了。」可他端起来，喝了半碗，喝得很慢。喝完把碗推给你：「不一样，也是饭。凉了的饭不能糟践——凉了的心，也不能。」那晚你们把灶房的火看了一整夜，天亮时，全寺的早粥照常出锅，没人知道三更天有一碗饭凉过、又热过。'; break;
                case 'self': aff = 6; msg = '他抬起头，看着你看了很久——火光没起来，可他眼睛里像有什么东西亮了一下。忽然他笑了，这一笑没有自嘲，只有憨：「为自己看火。三十年，头一回听人这么说。」他起身，从柴垛上抽了一根最直的柴，添进灶膛：「好。这根柴，为我自己添的。」火苗窜起来的时候，他又添了一根：「这根，为你添的。」老杂役后来说，那夜灶房的火燃到了天亮，第二日全寺的粥格外稠——掌锅的人熬粥的时候哼了曲儿，跑了调，可谁都听得出来，那是高兴。'; break;
                case 'eat': aff = 5; msg = '你端起那碗凉饭，站在灶房中间，一口一口吃了。他起身要拦，手抬到半空又放下，就那么看着你吃完——凉饭凉粥，就着三更的冷气。你把碗递回去，他接了，到水缸边洗，洗得很慢，一只碗洗了三遍。「凉饭伤胃。」他背对着你说，声音闷闷的，「可你把它吃了——它就没白凉。」他把碗倒扣回灶头，转过身，认认真真看了你一眼：「这话灶上说了三十年，今夜才有人拿肚子给我作证。」第二夜起，灶头那碗多盛的饭又是热的了——只是看火的时辰，他比从前挪早了半个时辰，像怕再叫谁赶上一碗凉的。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'wujiu_event_j05': {
        id: 'wujiu_event_j05', npcId: 'shaolin_wujiu', title: '端出灶房的那碗', icon: '🥣',
        desc: '那只锔钵三十年没出过灶房——今天，他端出去了。',
        minAffection: 55, trigger: { random: 0.3 }, cooldown: 0, flag: 'wujiu_ej05_done',
        requireRivalRomance: true, composeRival: true,
        scenes: [
            { speaker: 'narrator', text: '这日山上来了一位远客——{rival}，来找你。路过灶房，被一阵饭香勾住了脚步，站在门口，进也不是，走也不是。', type: 'description' },
            { speaker: 'narrator', text: '无咎颠着勺，抬头看了一眼。就一眼——烧了三十年火的人看人，看的不是脸，是这人吃没吃饭、赶路急不急、脸色透不透。看完这一眼，他把勺搁下了。', type: 'description' },
            { speaker: 'npc', text: '他走到灶头，捧起自己那只豁口的锔钵，盛了一碗饭——压得特别实，实得像给自家人盛的。然后当着满灶房杂役的眼，端着它，跨出了灶房的门槛。老杂役的水桶「哐当」掉在了地上。', emotion: 'solemn' },
            { speaker: 'narrator', text: '他把钵端到{rival}面前，双手递过去，递得像捧斋：「远来的客，先吃饭。这山上的事，饭最大——饭比恩怨大。」{rival}看着那只碗：粗瓷，豁口，一排发暗的铜锔钉，饭冒尖压得实。看了很久，接了，吃了，吃得干干净净。', type: 'description' },
            { speaker: 'narrator', text: '饭后他把钵收回来，到水缸边洗了三遍，擦干——没有放回灶头那个三十年的老位置，而是搁上了最高的架子。他拍拍手上的灰，对你只说了一句，语气和平常没有任何不同：', type: 'description' },
            { speaker: 'npc', text: '「钵认人。不因为它被谁吃了——因为我把它收了。」', emotion: 'neutral' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「那只钵——你亲手端出去的。」', effect: 'acknowledge' },
                { text: '搬凳子把钵从高架取下来，放回灶头老位置', effect: 'return' },
                { text: '「端出灶房做给谁看？做给我看，还是做给{rival}看——你的大度？」', effect: 'mock' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            var rname = rival ? rival.name : '那人';
            var rid = rival ? rival.id : null;
            var aff = 0, msg = '', others = null, pair = null;
            switch (choice) {
                case 'acknowledge':
                    aff = 7;
                    msg = '他擦着手，不否认：「端出去的。」他蹲到灶边添柴，火光一明一暗，「给人一碗饭，双手端，是灶房的礼。那人上了山，寻的是你，路过的是我的灶——是客。客吃饭，天经地义。」半晌，他的声音低下去，低得几乎混进柴火声里：「可那碗饭吃完，我把钵收回来，洗了三遍。不是嫌脏。」他添柴的手停了半息，「佛看见，也会懂的。我自己的钵，我自己收——这一桩，佛也没法替我懂。」他不再说了，起身给你盛饭，压得实实的。那只钵在高架上待了一夜，第二天清早，又回到了灶头的老位置——老杂役说，师父一早把它请下来的时候，嘴里念叨了一句：「吃饭的家伙，还是搁在吃饭的地方。」';
                    if (rid) { others = [{ id: rid, affection: 3 }]; pair = { delta: 6, with: rid }; }
                    break;
                case 'return':
                    aff = 9;
                    msg = '你搬了凳子，把那只锔钵从最高的架子上捧下来，走回灶头，把它放回三十年的老位置——锔钉朝着火，豁口迎着光。他站在原地看着你做完，一句话没拦。等你转身，他才在背后开口，声音混在柴火声里，哑了半拍：「放回来了……好。」那夜三更，灶头那碗多盛的饭又是这只钵盛的，冒尖，压实，热气腾腾。老杂役眯着眼看灶头：「钵回来了。」他往灶膛添了根柴，答了一个字：「回来了。」——后来他跟人说，那夜师父炒盐试了三回味，回回都正：「手稳了。手稳，是心落了地。」';
                    if (rid) { others = [{ id: rid, affection: 3 }]; pair = { delta: 8, with: rid }; }
                    break;
                case 'mock':
                    aff = -5;
                    msg = '他添柴的手停住了。他没有回头，看着灶膛里的火，看了很久，才开口，声音平得像报账：「做给谁看？饭盛了三十年，一碗一碗，没有一碗是做给人看的。」他把火拨了拨，火星子噼啪跳：「那人上山，路过我的灶，没吃饭——我给了一碗。就这么回事。」此后他没再提过那只钵。老杂役说，之后几日，师父的饭照旧，笑照旧，只是那只高架上的锔钵——他再没抬头看过一眼。「不抬头看，不是忘了。」老汉压低嗓子，「是不敢看。看了，就要想；想了，饭就要咸。」';
                    break;
            }
            return { affection: aff, msg: msg, others: others, pair: pair };
        }
    },
    'wujiu_event_j06': {
        id: 'wujiu_event_j06', npcId: 'shaolin_wujiu', title: '灶角的眼', icon: '👀',
        desc: '你带着同行的人来灶房——他多盛了一碗，多拿了一双筷子。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'wujiu_ej06_done',
        requirePartyCompanion: true,
        scenes: [
            { speaker: 'narrator', text: '今日你上山，队伍里的那位故人跟着一路到了灶房门口——站在门槛外头，不进，也不走。', type: 'description' },
            { speaker: 'narrator', text: '无咎颠着勺，灶角的眼朝门槛外扫了一遍，又扫了一遍。他没问一个字。只是转身，从碗架上多拿了一只碗，筷筒里多抽了一双筷子。', type: 'description' },
            { speaker: 'npc', text: '他把那只碗盛得冒尖，端到门槛外，双手递过去：「来了就吃饭。灶房不问恩怨，只问饿不饿。」门槛外那位愣了一下，接了碗。他拍拍手上的灰，转身回灶，像只是做了一件跟呼吸一样平常的事。', emotion: 'neutral' },
            { speaker: 'narrator', text: '饭吃到一半，他蹲在灶边添柴，状似随口地问了一句，语气平常得像在问柴火干不干：', type: 'description' },
            { speaker: 'npc', text: '「那位——爱吃么？」', emotion: 'hesitant' },
            { speaker: 'narrator', text: '问得满含灶理。可你听懂了他在问什么。老杂役低着头擦碗，嘴角抽了半天，到底没敢笑出声。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '老实介绍：「同路的朋友。一路同行好几年了。」', effect: 'honest' },
                { text: '「路上的同伴，仅此而已。」', effect: 'companion' },
                { text: '「下回，我一个人来。」', effect: 'alone' }
            ]}
        ],
        effects: function(npc, choice) {
            var comp = (typeof window._jealPartySuspects === 'function') ? window._jealPartySuspects(npc.id) : null;
            var cname = comp ? comp.name : '那位';
            var aff = 0, msg = '';
            switch (choice) {
                case 'honest': aff = 6; msg = '他点点头，添柴，火苗窜起来半尺：「同路好几年——好。」他把「好」字咬得很实，「肯跟你走远路的人，脚底板可信。」他站起身拍拍灰，竟又朝门槛外走去，给' + cname + '的碗里添了半勺饭，添完大声宣布：「脚底板可信的人，饭添半勺。灶房新规——今日立的。」门槛外那位哭笑不得地接了。你走的时候他送到院门口，忽然说：「下回来，还带着。' + cname + '那只碗，吃得干净——碗洗得省事。」话说得平平，可他站在那儿，一直看着你们两个人走下山道，看了很久。'; break;
                case 'companion': aff = 3; msg = '他「唔」了一声，不置可否，把火看住。你那碗饭吃完，他收了碗去洗，连门槛外那只一起。两只碗在水缸边并排洗着，他忽然像自言自语地说了一句：「灶房的门槛，不认名分，认饭量——是谁，碗知道。」你问他碗知道什么。他把碗倒扣好，擦手：「知道谁吃得香。」老杂役后来悄悄跟你说：那日师父收筷子，两双，一手一双，站在筷筒前愣了愣——到底还是插回了同一个筒。「插回一个筒，」老汉嘿嘿一笑，「就是不打算分。」'; break;
                case 'alone': aff = -4; msg = '他添柴的手顿了半拍。「一个人来。」他把这三个字重复了一遍，声音不高，火光照着他半边脸，「饭是给众人吃的。你不用为我腾地方。」他不再看你，只顾看火，火钳翻了两下，翻得比平常重。门槛外那位放下半碗饭，识趣地先告辞了。你坐着没动，他朝门口偏了偏下巴：「去送送。来了吃饭的人，碗吃了一半就走——是我的不是，不是你的。」老杂役说，那晚柴账上多了一行，只有两个字：「火，小。」老汉翻译给你听：「火小，是人心气低。他不怨你——他就把自己那口气，压进灶膛里了。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'wujiu_event_j07': {
        id: 'wujiu_event_j07', npcId: 'shaolin_wujiu', title: '两双筷子', icon: '🥢',
        desc: '柜台上那只锔钵盛着两双筷子——有人问起了。',
        minAffection: 60, trigger: { random: 0.3 }, cooldown: 0, flag: 'wujiu_ej07_done',
        requireDaoCompanion: true, requireRivalRomance: true, composeRival: true,
        scenes: [
            { speaker: 'narrator', text: '官道边的小食铺开了月余。柜台上摆着那只豁口的锔钵——不盛饭，盛两双筷子。一双是他的，粗，短，被锅铲的手磨得发乌；一双是你的，新，竹子的清香还没散尽。过路的都当是店家摆设，只有熟客知道，那钵谁也不许碰。', type: 'description' },
            { speaker: 'narrator', text: '今日有个行脚商在铺子里吃饭，闲话江湖，说起你的旧相识——{rival}的名字，在闲话里出现了两回。他掌着勺，一勺一勺舀汤，手稳得像秤。闲话过去了，他给行脚商多添了半碗汤，分文没多收。', type: 'description' },
            { speaker: 'npc', text: '夜里收了铺，他擦柜台，擦到那只钵跟前，忽然开口：「那双筷子，今儿有人问起了。」他朝柜台努努下巴，「客人问：掌柜的，钵里怎么摆两双筷子。」他把柜台擦完，直起腰，顿了顿，「我说——钵归我管。」', emotion: 'hesitant' },
            { speaker: 'narrator', text: '你问他怕不怕。一个被除过名的人，比谁都知道被人议论是什么滋味。他把抹布叠得方方正正，想了半天。', type: 'description' },
            { speaker: 'npc', text: '「怕什么。」他抬眼看你，灶膛的余火映在脸上，「第五百零一条，不欺心。这条我守了半辈子。筷子摆在柜台上，你摆在我心里——我要是怕人议论，把筷子收了，那才叫欺。」他顿了顿，又自嘲地笑，「再说，议论是议论，饭是饭。议论又不顶饱。」', emotion: 'warm' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '拿起你那双筷子：「明日赶集，给你换双更好的。」', effect: 'newpair' },
                { text: '「把筷子收了吧。往后我吃你那只碗。」', effect: 'hisbowl' },
                { text: '「第二双筷子——谁来了都归谁吧？」', effect: 'mock' }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'newpair': aff = 8; msg = '他愣住，随即笑开了，笑得灶膛的余火都跟着颤：「换更好的？」他把围裙一摘就要出门，被你拉住，又坐回去，还是笑，笑完认真起来：「好。明日赶集。要竹子的，不上漆——漆的掉皮，掉了皮，寒碜。」第二日赶集，他挑筷子挑了半个时辰，拿起一双对着日头照三遍，放下，再拿一双，再照。最后买回来的，是最普通的一双老竹筷，两个铜板。他把它插进钵里，跟旧的那双并排，退后两步端详，满意了：「这个好。普通的，用得久。」打那天起，柜台上的锔钵里插着三双筷子——两双旧的一双新的。有客人问，他答得千篇一律：「钵归我管。筷子，归它管。」'; break;
                case 'hisbowl': aff = 7; msg = '他擦柜台的手停了两息。他把钵里那双你的筷子拿起来，看了看——又放回去，摆得整整齐齐，还是两双。「不收。」他说得声音不高，一个字一个字，「你吃我的碗，和你的筷子——都算数。」他背过身去继续擦柜台，你看不见他的脸，只看见耳朵，红到了根：「钵盛两双筷子，是这只钵跟我立的约。改约——得先问过钵。」那晚打烊，他把钵从柜台上捧下来，洗了，擦干，又捧上去，摆正。一套动作做得像上香。你问他钵答应了没有。他吹了灯，黑暗里声音闷闷地传来：「答应了。它豁着口都没走——它比人长情。」'; break;
                case 'mock': aff = -5; msg = '笑声停了。他看着你——不是恼，是那种看人把账算错了的眼神。他把第二双筷子从钵里拿出来，托在掌心，托了半天：「谁来了都归谁？」他摇头，把筷子放回钵里，放得极正，「这双筷子，认下的那天，就只认一个人。被除过名的人最知道一样理——东西认下了，就不能再认第二回；再认，头一回就作废了。」他把钵端回柜台正中，之后三日，盛饭用的都是公碗。第四日，锔钵回了柜台，两双筷子，一双不少。又有客人问，钵里怎么摆两双筷子。这回他没答「钵归我管」——他盛了碗饭，压得特别实，端上桌，才回头答了一句：「等人回家吃饭。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'wujiu_event_j08': {
        id: 'wujiu_event_j08', npcId: 'shaolin_wujiu', title: '灶王爷的名帖', icon: '🧧',
        desc: '腊月廿三送灶，他的名帖上写了两个名字。',
        minAffection: 50, trigger: { random: 0.25 }, cooldown: 0, flag: 'wujiu_ej08_done',
        ambient: true, repeatEvery: 30,
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '腊月廿三，送灶的日子。少林寺的灶房最重这个节——无咎说，灶王爷不管戒堂的事，只管灶上的事，是这间屋子唯一的天。戒堂对送灶的仪轨睁一只眼闭一只眼，唯独这天，灶房的糖瓜份例翻倍。', type: 'description' },
            { speaker: 'narrator', text: '他研墨铺纸，写一张名帖，要贴在灶壁上——灶王爷上天言事，名帖就是引路的话头。你凑过去看：帖上头一个名字是你，笔画端正，一笔一划，认真得像在写第五百零一条。', type: 'description' },
            { speaker: 'npc', text: '你的名字底下，还有一行小字——是另一个名字。他见你看，不藏，反而指给你瞧，挠了挠头，难得的为难：「这个，是我添的。」他把笔搁下，「这事怎么跟灶王爷报，我想了三天。想明白了——两个都报。」', emotion: 'hesitant' },
            { speaker: 'npc', text: '「灶王爷老，眼不花。你心里有谁，他一照就亮。」他把名帖端端正正贴上灶壁，抚平四角，「与其瞒着叫天上查出来，不如老实报了。这是灶上的理，也是——」他顿了顿，自己笑了，「也是我的理。」', emotion: 'warm' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「佛看见也会懂的。灶王爷也懂。」', effect: 'echo' },
                { text: '「把那行小字划了——报上去做什么。」', effect: 'cross' },
                { text: '提笔在两个名字底下，添一行更小的字：「都归灶上管。」', effect: 'add' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            var rname = rival ? rival.name : '那人';
            var aff = 0, msg = '';
            switch (choice) {
                case 'echo': aff = 6; msg = '他愣愣地看了你两息，忽然笑开了，笑得肩膀直抖：「你拿我的话堵我！」他擦着灶台还在乐，「行，行。佛懂，灶王爷懂，我最懂——三个懂，一个不少。」他收了笑，往灶膛里添了把松枝，火苗窜起来，映得那张名帖发亮，「今年这灶，送得值。」当晚的糖瓜，最大最完整的一块他掰给了你：「灶王爷嘴上甜了——你的嘴，也得甜。」老杂役在旁边看着，跟小武僧咬耳朵：「三十年，头一回见师父给人分糖瓜分得这么偏心。」小武僧问偏到哪儿了。老汉想了想：「偏到——大块的全给了，他自己嚼了粘牙的边角。」'; break;
                case 'cross': aff = -5; msg = '他压着名帖的手没有动。他摇头，摇得很慢：「不划。」他把那行小字的边角又抚平了一遍，「我报给灶王爷的，是实话。划了，就是谎话。我这辈子谎话说过——回回是替人挡灾的。这一句不一样。」他拍拍灶壁，声音低下来，「这一句，我想叫天上记着。' + rname + '也好，你也好——天上的账本比我的全。记上了，谁也赖不掉，谁也别想赖。」他给你盛了块糖瓜，还是给了大的，可那晚他话少了，看火看得特别久。老杂役说，送灶那夜灶王爷的轿子（一炷香）烧得特别直——「香直，是天听了。听了两个名字的那一炉。」'; break;
                case 'add': aff = 8; msg = '你提起笔，在两个名字底下，添了一行更小的字：「都归灶上管。」他凑过来看，先愣住，再一拍大腿，灶房的锅碗都跟着跳了一下：「好！——都归灶上管！」他搓着手在名帖前转了两圈，「这话我想了十年没敢写，叫你一笔写上了！」等墨干透，他把名帖贴到灶壁最高的位置，退三步，端详，又上前抚平一个角，这才罢休：「今年灶王爷上天，捎的是三句实话。」当晚他熬了一锅糖，糖稀拉得能透光，头一碗端给你：「写字的手，吃头一碗。」老杂役蹲在灶边啃着糖瓜含混地说：三句实话，头一句是饭香，第二句是火旺，第三句——他朝名帖努努嘴，没说完，笑纹里全是糖。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'wujiu_event_j09': {
        id: 'wujiu_event_j09', npcId: 'shaolin_wujiu', title: '压实的饭', icon: '⚖️',
        desc: '两碗饭，一样平，一样实——谁的心安，谁的饭才真香。',
        minAffection: 65, trigger: { random: 0.3 }, cooldown: 0, flag: 'wujiu_ej09_done',
        requireRivalRomance: true, composeRival: true,
        scenes: [
            { speaker: 'narrator', text: '这一日{rival}上了山——不是寻事，是寻你。冤家路窄，灶房门口，你们撞了个正着：无咎抱着一捆柴正出来，{rival}踏着一路风尘正上去。', type: 'description' },
            { speaker: 'narrator', text: '两个把你放在心上的人，头一回照面，照在灶房门口。没人介绍，也不用介绍——抱柴的看见来人鞋上的尘土，来人看见抱柴的手上的茧，各自心里，都有数了。', type: 'description' },
            { speaker: 'narrator', text: '他没问，没看，抱着柴进了灶房，系上围裙，生火。半晌，饭香飘出来，飘得整座院子都是。他盛了两碗饭出来——都压实了，压得平平整整，两碗的尖，一般高。', type: 'description' },
            { speaker: 'npc', text: '他把一碗摆在{rival}面前，一碗摆在你面前，退后半步，手在围裙上擦了擦，声音平得像报账：「我不跟人争。饭压实了——一样。」他又顿了顿，把后半句说完，「谁的心安，谁的饭才真香。」', emotion: 'solemn' },
            { speaker: 'narrator', text: '{rival}看着面前那碗饭，看了很久。碗是粗瓷，锔钉发暗，饭冒尖压实，热气笔直地升。灶房里很静，只有灶膛里的火，噼啪，噼啪。两双眼睛，一前一后，都落到了你身上。', type: 'description' },
            { speaker: 'player_select', text: '两碗一样平的饭。你端哪一碗？', options: [
                { text: '端起无咎的那一碗', effect: 'wujiu' },
                { text: '端起{rival}的那一碗', effect: 'rival' },
                { text: '把两碗都端到灶边的条凳上：「一起吃。灶边坐得下。」', effect: 'both' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            var rname = rival ? rival.name : '那人';
            var rid = rival ? rival.id : null;
            var aff = 0, msg = '', others = null, pair = null;
            switch (choice) {
                case 'wujiu':
                    aff = 5;
                    msg = '你端起灶前那一碗。无咎转身去添柴，背对着你们，可你看见他的肩膀，松了一瞬。' + rname + '在原地坐了一坐，起身，掸了掸衣摆，朝灶房拱了拱手：「饭是好饭。」三个字，说完就走了，脚步不快不慢，走得极稳。灶房里剩你们两个，他把火拨旺，闷了半天，开口还是灶上的理：「那人那碗，我压得跟你的一样平。没吃完——」他拿火钳翻了翻柴，「心不安的人，饭吃不干净。」他把你的碗又添了半勺，「你心安。多吃。」柴账那晚多了一行小字，老杂役指给你看过：「两碗饭，一碗见底，一碗见心。」';
                    if (rid) { others = [{ id: rid, affection: -6 }]; pair = { delta: -10, with: rid }; }
                    break;
                case 'rival':
                    aff = -6;
                    msg = '你端起' + rname + '面前那一碗。灶房里静得能听见火。无咎看着你的手，看了两息——转过身，往灶膛里又添了根柴，声音平得没有一丝缝：「趁热。」就这两个字。那顿饭你吃得安稳，' + rname + '坐了一会儿，道了谢，下山去了。你吃完把碗递回去，他接了，洗了——那只锔钵洗得格外干净，洗完扣回灶头，豁口朝外。老杂役说，那晚柴账上多了一行，只有两个字：「火，稳。」老汉把账本合上，叹了口气：「人把事全压住的时候，火是最稳的。稳得——没有一点活气。」';
                    if (rid) { others = [{ id: rid, affection: 5 }]; pair = { delta: -8, with: rid }; }
                    break;
                case 'both':
                    aff = 9;
                    msg = '你把两碗饭都端到灶边的条凳上，坐下，拍拍身边的空位：「一起吃。灶边坐得下。」无咎站在原地，整整三息——然后解了围裙，坐下了。' + rname + '也站着看了一会儿，到底也坐下了。三个人围着一条灶凳吃一顿饭，谁也没说话，只有筷子碰碗的声、灶膛的声、和窗外山风的声。饭吃完，他收碗去洗，洗着洗着忽然开口：「灶上的饭，人多吃着最香——今日这顿，两碗全见了底。」他把碗摞好，回头看你一眼，嘴角是压不住的：「柴账上得记这一笔：三人，两碗饭，一灶火——不亏。」' + rname + '走的时候，在灶房门口站了站，朝里头拱了拱手。他擦着手出来还礼，两个人谁也没多话——可老杂役说，那一眼一拱手，比多少话都值钱。';
                    if (rid) { others = [{ id: rid, affection: 4 }]; pair = { delta: 12, with: rid }; }
                    break;
            }
            return { affection: aff, msg: msg, others: others, pair: pair };
        }
    }
};

// ============ 合并进总事件池 ============
if (typeof NPC_PERSONAL_EVENTS !== 'undefined') {
    Object.assign(NPC_PERSONAL_EVENTS, WUJIU_JEAL_EVENTS);
}

// ============ 每日钩子（灶台套装专用：与主线钩子分开，终章之后照发） ============
// 优先级：压实的饭（顶峰） > 灶角的眼（同行嫌疑） > 端出灶房的那碗 > 其余按序；
// 一天至多一桩，弹前门禁二次校验（与 jealousy-deep 的 _jealFire 同款）。
function _wujiuJealFire(evId, npcInst) {
    setTimeout(function() {
        if (document.querySelector && document.querySelector('.personal-event-modal')) return;
        var ev = NPC_PERSONAL_EVENTS[evId];
        if (!ev) return;
        if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npcInst)) return;
        if (typeof triggerPersonalEvent === 'function') triggerPersonalEvent(evId);
    }, 1200);
}

var WUJIU_JEAL_ORDER = ['wujiu_event_j09', 'wujiu_event_j06', 'wujiu_event_j05',
                        'wujiu_event_j01', 'wujiu_event_j02', 'wujiu_event_j04',
                        'wujiu_event_j07', 'wujiu_event_j03', 'wujiu_event_j08'];

if (typeof window !== 'undefined' && window.timeSystem && window.timeSystem.onNewDaySubscribe) {
    window.timeSystem.onNewDaySubscribe(function() {
        try {
            if (!window.currentCharData || !window.npcManager) return;
            var npc = window.npcManager.getNPC ? window.npcManager.getNPC('shaolin_wujiu') : null;
            if (!npc) return;
            if (!(npc.memory && (npc.memory.firstMet === true || (npc.memory.meetCount || 0) > 0))) return;
            var aff = (npc.relationship && npc.relationship.affection) || 0;
            if (aff < 40) return;
            var isDao = !!(npc.hasFlag && npc.hasFlag('dao_companion'));
            // 人在少林寺（未还俗时的日常），或已结道侣（还俗后食铺随你走，地点不设限）
            var loc = window.currentCharData.location || '';
            if (loc !== '少林寺' && !isDao) return;
            if (typeof window.detectRivalRomance !== 'function') return;
            if (!window.detectRivalRomance('shaolin_wujiu')) return;
            if (document.querySelector && document.querySelector('.personal-event-modal')) return;

            for (var i = 0; i < WUJIU_JEAL_ORDER.length; i++) {
                var evId = WUJIU_JEAL_ORDER[i];
                var ev = NPC_PERSONAL_EVENTS[evId];
                if (!ev) continue;
                if (aff < (ev.minAffection || 0)) continue;
                // 两双筷子只在还俗定情后上演，且不受「人在少林」限制
                if (evId === 'wujiu_event_j07' && !isDao) continue;
                if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npc)) continue;
                var done = (typeof hasEventTriggered === 'function') && hasEventTriggered(evId);
                if (done && !(ev.ambient && typeof window._ambientRearmOk === 'function' && window._ambientRearmOk(npc, ev))) continue;
                var chance = ev.ambient ? 0.22 : 0.3;
                if (Math.random() >= chance) continue;
                _wujiuJealFire(evId, npc);
                return; // 一天一桩，不连发
            }
        } catch (e) { console.warn('[无咎灶台套装] 每日触发失败:', e); }
    });
}

// ============ 导出 ============
if (typeof window !== 'undefined') {
    window.WUJIU_JEAL_EVENTS = WUJIU_JEAL_EVENTS;
    window.WUJIU_JEAL_ORDER = WUJIU_JEAL_ORDER;
}
console.log('[无咎灶台套装] 吃醋九桩加载完成：' + Object.keys(WUJIU_JEAL_EVENTS).length + ' 桩（柴账/手抖/成精的锅/凉了的饭/端出灶房的那碗/灶角的眼/两双筷子/灶王爷的名帖/压实的饭）');
