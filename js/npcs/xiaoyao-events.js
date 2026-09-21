// ==================== xiaoyao-events.js - 闻人酌线情缘事件/结局/性别语境 v1.0（v20.75 第五批扩线） ====================
// 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / registerEndingSet / registerEndingCallback /
//       hasEventTriggered / checkEventTrigger / triggerPersonalEvent / canPlayerAccessPersonalEvent）
//       npcs/npc-system.js（executeEmotionInteraction 已加 bond_dao 拦截）
// 加载顺序：在 npc-personal-events.js 之后
// 男主·闻人酌（逍遥派亲传、琅嬛福地守藏人。慵懒机锋型——天下最闲的人：躺在酒坛边抚琴、石桌上下残棋、
//   琅嬛福地看尽天下武学书卷，从不认真练功；可酒仙池的酒曲、琅嬛的灯油、山门的亏空，都是他暗中维持——
//   北冥神功早已大成，闲是他的道。「闻人」是复姓，生僻；「酌」是师父取的：酌酒，也是斟酌。
//   话像醉话，句句是真；引经据典，半开玩笑半认真；从不把疼说破，疼了就斟酒。
//   心口的事：师父无崖子某日背着琴出门，只说了一句「我去云游」，再没回来。逍遥派入山第一课是
//   「不留人，也不送人」——他学会了一半「不留人」，「送人」这一半，学不会）。
// 逍遥派既有设定：琅嬛福地（藏天下武学）、酒仙池（灵泉酿酒）、长老天琴（以琴音伤人于无形）/棋圣（以棋入道）、
//   北冥神功/凌波微步（见 js/sects/sects-deep-data.js 逍遥段）；日常事件「棋局残谱」「北冥遗音」的真身皆是他。
// 信物：石桌残局里的一枚白子（009 相赠）。他的酒壶不送人。
// 男女玩家皆可追，主线共享（代词按性别），各有专属性别语境事件（femctx/mctx）。
// 注：本线已入 MALE_LEAD_ROSTER（v20.75：吃醋对峙/和好两桩由 male-lead-*.js 稍后接线，名册先行）。

var XY_NPC_ID = 'sect_leader_逍遥派';

// ============ 主线事件（xy_event_001 ~ 011 + 终章 013） ============
var XY_MAIN_EVENTS = {
    'xy_event_001': {
        id: 'xy_event_001', npcId: XY_NPC_ID, title: '酒坛边的人', icon: '🍶',
        desc: '躺在酒坛边的人把你当成了新来的杂役，支使你舀一瓢酒。',
        minAffection: 12, trigger: { random: 0.4 }, cooldown: 0, flag: 'xy_e001_done',
        autoTrigger: { location: '逍遥派', random: 0.45 },
        scenes: [
            { speaker: 'narrator', text: '你入逍遥派头一日，无人来接引。循着酒香走到酒仙池边，见酒坛旁躺着一个人——青衫半敞，一张琴盖在脸上，睡得正熟。', type: 'description' },
            { speaker: 'narrator', text: '那人头也不抬，只手一挥，指了指坛边的酒瓢：「新来的杂役？舀一瓢酒来。手放稳，别洒。」你舀了酒，双手端平递过去。他把琴从脸上挪开一条缝，抬眼看你——那眼神像醉，又像醒。', type: 'description' },
            { speaker: 'npc', text: '「手不抖。」他撑起半边身子，就着你的手喝了半瓢，把剩下半瓢递还给你，「行，你不是杂役的命。这半瓢赏你——喝了它，往后就是自己人。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '接过来一饮而尽：「好酒。这是谁酿的？」', effect: 'drink', affection: 8 },
                { text: '接过却不喝：「入门头一日就贪杯，怕是要失仪。」', effect: 'refuse', affection: 6 },
                { text: '把酒递回去：「先请教你是哪位——陌生人的酒，我不好白喝。」', effect: 'ask', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'drink': aff = 8; msg = '你仰头饮尽，酒线入喉，一路烧到丹田。他抚掌大笑，笑得又躺回了酒坛边：「豪气。酒仙池的酒，越喝越醒，只有心里有鬼的人才醉。」他弹了弹指头，「我，闻人酌，琅嬛福地看书的。记住了——往后在这座山上受了委屈，来找我喝酒。」'; break;
                case 'refuse': aff = 6; msg = '他也不恼，反倒来了兴致，把酒收回去自己饮了：「有意思。头一日入门就不肯醉的人，多半活得比肯醉的久。」他把琴横回膝上，随手拨了一声，「闻人酌。名字记不住不要紧，记『酒坛边那个』就行。」'; break;
                case 'ask': aff = 7; msg = '「陌生人？」他把这三个字嚼了嚼，眼里全是笑，「天底下与我陌生的，只有『不喝酒的人』和『不识字的人』两样。」他放下酒瓢，竟正正经经拱手行了个礼，礼行得极懒，却一式不缺，「逍遥派，闻人酌。闻人是复姓，生僻；酌，是师父取的——酌酒，也是斟酌。如今熟了。喝。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'xy_event_002': {
        id: 'xy_event_002', npcId: XY_NPC_ID, title: '残局', icon: '⚫',
        desc: '石桌上前人留下的半局残棋——他与你下了三手就停。',
        minAffection: 18, trigger: { random: 0.35 }, cooldown: 0, flag: 'xy_e002_done',
        autoTrigger: { location: '逍遥派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '琅嬛福地外的石台上摆着一张石桌，桌上一局残棋，黑白相持，不知是哪年哪月留下的。派中弟子偶来参悟，从没人下完过——连棋圣长老都只看过，没动过。', type: 'description' },
            { speaker: 'narrator', text: '他今日恰坐在枰前，手边一壶酒，像在等人。见你来，抬了抬下巴示意对面：「坐。三手。」你与他下了三手——第四手上，他捏着棋子不落，忽然停了。', type: 'description' },
            { speaker: 'npc', text: '「你棋里有火气。」他支着下巴看你，像看一坛新酒，「有火气，就有胜负心；有胜负心，就有『我』。这局棋，你是要下给它看，还是下给我看？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '执子请教：「师兄教我——这火气，该怎么安放？」', effect: 'learn', affection: 7 },
                { text: '「有火气才有棋。我先烧完这把火，再陪师兄下。」', effect: 'fire', affection: 8 },
                { text: '拂了棋子：「一局残棋摆这些年——你的棋，无聊。」', effect: 'flip', affection: -4 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'learn': aff = 7; msg = '他笑了：「安放？好俗的字——火气不是安放的，是让它自己找地方去的。」他把残局一手一手拆回去，拆到你那三手时停了，原样留着，一颗子也没动，「这三手，留着。烧得好。」那个下午，他把一整局的变化讲与你听，讲得比谁都耐心。'; break;
                case 'fire': aff = 8; msg = '他一怔，随即抚掌大笑，震得酒壶都跳了一跳：「好一个『先烧完再下』——庄生说『哀莫大于心死』，你这心，活得烫手。」他捏着棋子，终于落下，正落在你那股火气的必经之路上，「这局是前人留的，你今日替它接了一手。烧也罢，不烧也罢，都算续上了。」'; break;
                // 真负选项：这局残棋是「走的人」留下的局，他守的不是棋，是那个等他解局的人
                case 'flip': aff = -4; msg = '棋子哗啦落地。他不恼，慢慢俯身，把黑白子一颗一颗拾回原位——比你记得还准。拾完最后一颗，他给自己斟了杯酒：「无聊，是我的事。局，是留局的人的事。」他起身提酒走了。此后石桌边的残局照旧，只是对面的座位，他一直空着，谁也不许坐。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'xy_event_003': {
        id: 'xy_event_003', npcId: XY_NPC_ID, title: '北冥遗音', icon: '🎶',
        desc: '深夜深潭底的琴音——「北冥遗音」的真身，是他沉在潭底抚琴。',
        minAffection: 25, trigger: { random: 0.35 }, cooldown: 0, flag: 'xy_e003_done',
        autoTrigger: { timeRange: [22, 3], location: '逍遥派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '深夜过潭边，深潭底传来一缕琴音——若有若无，时断时续，像有人在水底抚琴。派中弟子都说这是「北冥遗音」，上古仙真留在潭底的琴心回响，百年难遇一闻。', type: 'description' },
            { speaker: 'narrator', text: '你屏息听了半晌——琴音里夹着酒气，还有酒瓢磕碰坛沿的轻响。这「遗音」哪里是遗音：分明是有人沉在潭底抚琴。水面一荡，那个熟悉的声音浮上来，懒洋洋的：「听了半天，要不下来听？上面风大。」', type: 'description' },
            { speaker: 'npc', text: '他坐在潭心一块露出水面的青石上，琴横在膝，半身干，半身湿。「水底传音最远。上面的世界太吵，我弹给鱼听。」他侧头看你，「你听见什么了？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '在潭边坐下，陪他听到天明', effect: 'listen', affection: 8 },
                { text: '「我听见一个『闷』字。琴是清的，人是闷的。」', effect: 'hear', affection: 7 },
                { text: '拣块石子丢进潭里：「半夜抚琴，扰人清梦。」', effect: 'stone', affection: -5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'listen': aff = 8; msg = '你在潭边坐下，他在水上弹。琴没有曲名，弹到哪算哪，停了你也不催。东方泛白时他收琴上岸，拧着袖子，哑声笑道：「庄周梦蝶——我昨夜梦见有人听琴。」他把琴弦一根根擦干，「今晨醒来，居然不是梦。赚。」'; break;
                case 'hear': aff = 7; msg = '抚琴的手停了半拍。他从水面上望过来，看了你很久，忽然笑出声：「闷？不至于不至于——我弹的是『闲』。」话虽如此，他又拨了一弦，声音很低，「……行，你赢了。一半是闲，一半是闷。这一半，多年没人听出来过。替我收着，别外传。」'; break;
                // 真负选项：潭底琴音是他唯一肯对自己诚实的地方，一颗石子打断的是那句「多年没人听出来过」
                case 'stone': aff = -5; msg = '石子入水，琴音戛然而止。潭面静了半晌，他浮上水来，抹了把脸，居然还笑：「好准头。」他抱着琴上了岸，语气比水面还平，「世人嫌吵，我自知趣。」此后夜里再没有过「北冥遗音」。弟子们都说遗音散了——只有你知道，不是散的。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'xy_event_004': {
        id: 'xy_event_004', npcId: XY_NPC_ID, title: '琅嬛福地', icon: '📚',
        desc: '他整理武学书卷，你搭手理了一夜。',
        minAffection: 32, trigger: { random: 0.3 }, cooldown: 0, flag: 'xy_e004_done',
        autoTrigger: { location: '逍遥派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '你头一回进琅嬛福地——万卷连架，藏着天下武学。他站在梯子上归书，脚边搁着酒壶，一手翻卷，一手端盏，见你进来也不下来：「来得正好。把那摞递我，按门派归架——剑在前，刀在后，拳掌随缘。」', type: 'description' },
            { speaker: 'narrator', text: '你与他理了一夜书卷。他理得极慢，每本都要翻两页、叹两句、饮一盏——偏偏又比你快。天光放亮时万卷归架，他坐在书阶上揉着眼睛：「琅嬛藏天下武学，外人进来，都问哪本最厉害。」', type: 'description' },
            { speaker: 'npc', text: '他伸了个懒腰，骨节噼啪作响：「我都读完了。没有最厉害的书，只有最合人的书。」他眯眼看你，「所以理书比读书难——得把每一本，都搁回它等它那个人的地方。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「那——等我的那本书，搁在哪儿？」', effect: 'ask', affection: 8 },
                { text: '帮他把最后一摞归架，再替他沏一壶酽茶醒酒', effect: 'tea', affection: 7 },
                { text: '趁他不备，去翻最深处那册封了蜡的镇库秘籍', effect: 'snoop', affection: -3 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'ask': aff = 8; msg = '他愣了一下，忽然笑了，起身在福地里横穿半座书架，从高格上抽出一册薄薄的书递到你手里：「早替你找好了。」你翻开——不是什么神功秘笈，是一册手抄的棋谱，边角画着一局没下完的残棋。「书等人，人等书。」他晃晃悠悠走回去接着理书，「你跟石桌上那局，互相等了不是一天两天了。」'; break;
                case 'tea': aff = 7; msg = '你归好最后一摞书，沏了壶酽茶。他双手捧着，吹了两口，难得说了句正经话：「书会受潮，人不能受潮——守藏人的规矩，我自己定的。」茶饮尽，他把盏子倒扣在书阶上，冲你笑了笑，「醒了。醒着的世界，看得见谁替我理了一夜书。」'; break;
                // 真负选项：镇库封着的不是秘籍是祸端，他守了这些年库，守的就是「不可轻动」这四个字
                case 'snoop': aff = -3; msg = '你的指尖刚碰到封蜡，身后两根手指不轻不重扣住了你的腕——扣得极稳，挣不动。他声音里还带着酒意，人已经站在了你背后：「那本不行。」他把你拉回来，另塞给你一册，「读书讲缘分，封书讲债。你的债还没到——别提前支。」他把镇库的书归回原架。此后你来福地，他总有意无意在书架间陪你多走一段。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'xy_event_005': {
        id: 'xy_event_005', npcId: XY_NPC_ID, title: '最闲的人', icon: '🏮',
        desc: '满派都说他懒——可酒、灯、账，都是他暗中维持的。',
        minAffection: 40, trigger: { random: 0.3 }, cooldown: 0, flag: 'xy_e005_done',
        autoTrigger: { location: '逍遥派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '逍遥派上下提起闻人酌，都摇头：天下最闲的人——不做早课，不当值，不议事，终年躺在酒坛边。可你留意到了三件事。', type: 'description' },
            { speaker: 'narrator', text: '酒仙池的酒曲，是有人半夜悄悄添的；琅嬛福地的灯油，月月续得上，账目分毫不差；上月山门亏空，是有人拿私藏的三卷古琴谱去当铺换了银子填的——当铺掌柜说，来当的人一身酒气，谱却用油纸包了七层，护得比命紧。', type: 'description' },
            { speaker: 'npc', text: '你拿这三件事去问他。他正在酒坛边斟酒，也不否认，只笑：「什么叫闲？舟自己不会走，是有人在水底下撑篙——岸上的人看了，都以为是舟在漂。」他把盏子朝你一举，「别拆穿撑篙的。拆穿了，他就得上岸装闲人，那才叫累。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「那我装作没看见。——但往后半夜添酒曲，带我一个。」', effect: 'help', affection: 9 },
                { text: '「天下最闲的人，把最难的活都干了。师兄，辛苦了。」', effect: 'see', affection: 8 },
                { text: '「为什么瞒着？有功不居名，图什么？」', effect: 'why', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'help': aff = 9; msg = '他端着酒盏，半天没动。「……带我一个。」他把这四个字重复了一遍，像尝一味没尝过的酒，忽然低低笑了，眼睛有点湿，「好。半夜池边凉，多穿。」自那日起，酒仙池半夜添曲的人多了一个。他掌灯，你添曲，谁也不提这桩差事——灯却一直亮着。'; break;
                case 'see': aff = 8; msg = '斟酒的手停了半拍。他低头把那一盏慢慢饮尽，抬眼时神色如常：「辛苦什么。撑篙也是修行，喝酒也是修行，一并做了，省一遍工夫。」话虽懒，他却给你满斟了一盏推过来，很轻地补了半句，「……这话，出了这个池子别认。闲人的名声，我还要用的。」'; break;
                case 'why': aff = 6; msg = '「图什么？」他认真想了想，给出一个醉话般的答案，「名是债。有功而有名，就得一辈子替那个名撑篙——我懒，只想撑给水和山看，不想撑给名看。」他打了个哈欠，重新躺回酒坛边，「舟漂得自在，篙撑得也自在。两全。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'xy_event_006': {
        id: 'xy_event_006', npcId: XY_NPC_ID, title: '师父的远游', icon: '🌫️',
        desc: '无崖子那日只说了一句「我去云游」——再没回来。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'xy_e006_done',
        autoTrigger: { location: '逍遥派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '这夜酒仙池边，他喝得比平日多。不谈棋，不谈书，头一回谈起一个人——他师父，无崖子。', type: 'description' },
            { speaker: 'npc', text: '「那日师父背着琴走到山门，我追上去，问：几时回来。」他斟了杯酒，望着盏中晃动的月，「师父说：我去云游。三个字，多的没有。然后——就没有然后了。」' },
            { speaker: 'npc', text: '「逍遥派入山第一课：不留人，也不送人。」他饮尽那杯，又斟满，「我学会了一半——不留人。送人这一半，学不会。人家走，我总要……数着日子。」说到这儿他不说了，举杯向天上那轮月敬了敬，像敬一位远行的人。' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「学不会，就不学了。——往后我不叫你送，也不走。」', effect: 'stay', affection: 9 },
                { text: '什么都不说，接过杯陪他喝，陪他敬那轮月', effect: 'drink', affection: 7 },
                { text: '「云游的人，总有游倦的一日。那日山门还在，酒还在。」', effect: 'hope', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'stay': aff = 9; msg = '他端着杯，怔怔看了你半晌。「……不叫我送，也不走。」他像蒙童念书一样把这九个字念了一遍，忽然低低笑出声，笑到肩头都在抖，「好话。」他给你满斟一盏，两盏相碰，声很轻，「这门课我荒了半生。今日头一回——想留级。」'; break;
                case 'drink': aff = 7; msg = '你不说话，接过杯陪他饮，陪他向月亮举了举。他看你一眼，眼里的笑软了三分：「能陪酒的满山都是，能陪沉默的，一个都没有。」他又斟了一杯，却不饮，搁在石桌角上，「这杯是替走的人留的。留了这些年——酒，从来没敢让它空过。」'; break;
                case 'hope': aff = 6; msg = '「游倦……」他晃着酒，像在算一笔很远的账，「师父的功夫是『化』字，四海于他不过是庭前一步，倦不了的。」话虽如此，他自己先笑了，「也罢。你说得对——山门在，酒在。等他那日倦了，我……」他顿了顿，把那半句咽回去，只给你斟了酒，「喝。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'xy_event_007': {
        id: 'xy_event_007', npcId: XY_NPC_ID, title: '琴心', icon: '🎼',
        desc: '他教你抚一段《北冥》——弹到一半他停了：「你指头里有话。说。」',
        minAffection: 55, trigger: { random: 0.3 }, cooldown: 0, flag: 'xy_e007_done',
        autoTrigger: { location: '逍遥派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '竹林下，他破天荒抱出了自己那张从不离身的琴，说要教你一段——《北冥》，逍遥派琴谱的头一曲。他先示范一遍：七弦之下，如渊停，如北风过野，弹罢林间竹叶无风自动。', type: 'description' },
            { speaker: 'narrator', text: '轮到你。你弹到一半，他忽然按弦，琴音止住。他凑近半寸，目光像酒里的火：「你指头里有话。」', type: 'description' },
            { speaker: 'npc', text: '「琴不欺人。嘴里能装的，指头装不了。」他单手斟了杯酒推到你手边，「说出来。说出来的，我才好接着教——《北冥》这一曲，教的不是音，是人。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '陪他把整曲弹完，弹到天亮', effect: 'dawn', affection: 11 },
                { text: '把心里的话如实说出来——说来路，说来处', effect: 'speak', affection: 8 },
                { text: '「指头里能有什么话。琴就是琴，师兄想多了。」', effect: 'scoff', affection: -4 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'dawn': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 11) : { ok: true };
                    if (!_py.ok) { aff = 4; msg = '弹到三更，你指尖由痛转麻，内息先散了。他按弦止了音，把你的琴收过去：「今日到这。」他斟了盏温酒给你驱寒，送你到竹林口，背对着你补了半句，「你指头里的话还没说完。睡醒了——回来接着说。」（精力不足，那一夜你先趴在竹案上睡着了）'; break; }
                    aff = 11; msg = ('两个人在竹下从黄昏弹到天明。他弹一句，你和一句，琴音一问一答，像两个人隔水说话。晨光初透时，你终于把整曲的最后一音收住——他按弦良久，低低笑了：「曲里有人了。你指头里的话，说完了。」他把那卷《北冥》琴谱卷好，塞进你怀里，「拿去。往后这一曲，你也算会了一半。另一半——慢慢弹给我听。」') + '（精力-11）'; break; }
                case 'speak': aff = 8; msg = '你说了。说山门外的故乡，说一路行来的风尘，说那些从没对人讲过的话。他不打断，只听着，酒在手里温着。你说完，他把方才你弹错的那一弦重按了一遍，替你正了音：「对了。」他说，「记住这个弹法。谱是死的，话是活的——琴说到哪，手就到哪。」'; break;
                // 真负选项：「琴不欺人」是他琴心的根，说他「想多了」，等于说他半生藏在琴里的话全是自作多情
                case 'scoff': aff = -4; msg = '他脸上的笑没散，按弦的手却慢慢收了回去。「也是。」他把琴收入囊中，语气仍旧慵懒，「是我想多了。」他提酒起身，走出两步又回头，补了一句，像玩笑，又不像，「琴就是琴——这话，师父当年也说过。说完他就云游去了。」此后竹林下琴音依旧，只是他不再叫你听。琴音清清冷冷，与你隔了一堵看不见的墙。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'xy_event_008': {
        id: 'xy_event_008', npcId: XY_NPC_ID, title: '你不一样', icon: '🌙',
        desc: '半醉的酒仙池边，他头一回说了真话：「数到今天——不数了。」',
        minAffection: 62, trigger: { random: 0.3 }, cooldown: 0, flag: 'xy_e008_done',
        autoTrigger: { timeRange: [21, 3], location: '逍遥派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '深夜的酒仙池边，他独自坐在新酒坛旁，喝到半醉。见你来，也不打趣，只拍了拍身边的坛沿，示意你坐。', type: 'description' },
            { speaker: 'npc', text: '「你来的时候，我在数。」他望着杯中酒，声音又懒又慢，字却清楚，「数你几时走。逍遥派的人，我都数过——来的，走的，几时来的，几时走的。从没数错过一回。」' },
            { speaker: 'npc', text: '「数到今天。」他把杯中酒一口饮尽，杯子倒扣在坛盖上，「不数了。」月光落在空杯上。他笑起来，笑意却有点淡，「你不一样。不一样到我——不敢数。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '把他手里的酒轻轻换成一盏热茶，陪他坐到酒醒天明', effect: 'tea', affection: 12 },
                { text: '「不数就不数。我几时走、几时留，往后我亲口告诉你。」', effect: 'word', affection: 9 },
                { text: '什么都不说，坐在坛边陪他到酒醒', effect: 'sit', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'tea': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 12) : { ok: true };
                    if (!_py.ok) { aff = 5; msg = '你陪到三更，眼皮越来越沉，先靠着酒坛睡着了。醒来时身上盖着他的外袍，手边一盏茶还温着——不知是谁斟的。盏底压着一小片竹叶，竹叶上几个酒渍小字：先睡的不算陪。下回补。（精力不足，那一夜你先撑不住了）'; break; }
                    aff = 12; msg = ('你把他手里的酒轻轻拿走，换上一盏刚沏的热茶，陪他在池边坐到酒醒，坐到天明。他没有挣，低头看了那盏茶很久，忽然低笑出声：「……喝酒喝了这些年，头一回有人把我的酒换成茶。」池风过处，他耳根有点红，声音却稳，「暖的。比酒好。」天亮时他把空盏收进袖里——收了，没还你。') + '（精力-12）'; break; }
                case 'word': aff = 9; msg = '他愣了愣，忽然大笑，笑得酒坛嗡嗡作响：「好——『亲口告诉你』！」他把最后半壶酒尽数倾进池里，像祭，又像立约，「行。我等着。那日你说『留』，这一池的酒我都替你酿；你说『走』……」他顿了顿，把空杯正了正，「我就送你。这门课的另一半，我补上。」'; break;
                case 'sit': aff = 7; msg = '你不说话，在坛边坐下。他喝他的，你看你的月亮，两不相催。酒醒时东方已白，他起身晃了晃，扶住酒坛站稳，难得没开玩笑：「陪喝酒的人多，陪醒酒的人少。」他走出几步，又回头，「明晚，还在这儿。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'xy_event_009': {
        id: 'xy_event_009', npcId: XY_NPC_ID, title: '待着之诺', icon: '⚪',
        desc: '他把残局里那枚白子，搁进了你的掌心。',
        minAffection: 68, trigger: { random: 0.3 }, cooldown: 0, flag: 'xy_e009_done',
        autoTrigger: { location: '逍遥派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '他约你到石桌边。那局残棋还在，枰上却少了一枚白子——被他拈在指间，摩挲着，像摩挲一件等了很久的旧物。', type: 'description' },
            { speaker: 'npc', text: '「这局，是走的人留下的。差最后一手。」他拉起你的手，把白子搁进你掌心，指腹微凉，按了按，「解局的人，我等他。等了多少年，我自己都数懒了。」' },
            { speaker: 'npc', text: '「白子在你手里，局在桌上。」他收回手，恢复了那副慵懒模样，眼睛却没躲你，「解了局，待着就别走。待着的人——我有句话，想问他很久了。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '攥紧白子，陪他把这局残棋复盘到天亮：「这个局，我解。那句话，我听。」', effect: 'promise', affection: 14 },
                { text: '执白子入枰，当场落在残局要害：「局现在解了——问吧。」', effect: 'solve', affection: 9 },
                { text: '「……为什么是我？」', effect: 'why', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'promise': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 14) : { ok: true };
                    if (!_py.ok) { aff = 6; msg = '复盘到三更，你内息发虚，棋子从指间滑了下去。他收了枰扶住你：「今日到这。」送你回房，又把那枚白子重新按回你掌心，笑了笑，「拿着。诺不变——局也不变。」（精力不足，那一夜你先撑不住了）'; break; }
                    aff = 14; msg = ('你攥紧白子，郑重点头。他长长吐出一口气，肩背松下来，像放下了等了很多年的什么。那一夜两人在灯下把这局残棋一手一手复盘，复到烛尽天明。他收起最后一颗子，懒懒地说：「解局那日，酒仙池的新酒正好开封——我留一坛，给那日。」白子在你掌心，带着他的体温。那句话，他没说。你没催。日子长。') + '（精力-14）'; break; }
                case 'solve': aff = 9; msg = '白子落枰，全局皆活——那局僵了不知多少年的残棋，竟被你这一子豁然解开。他盯着棋枰怔住，忽而仰天大笑，笑得扶住了石桌：「好手！好手！」笑到眼里有了水光，他抹一把脸看你，「那句话，我先存着。等你哪日想听了——不许反悔。」'; break;
                case 'why': aff = 5; msg = '他被问住了，指间空拈了个手势，半晌，给出一个慵懒的答：「因为你舀酒的时候手不抖，下棋的时候有火气，听琴的时候——听得出『闷』。」他把白子往你掌心里又按了按，声音低下去，「天下人都当我闲。只有你知道，我在等什么。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'xy_event_010': {
        id: 'xy_event_010', npcId: XY_NPC_ID, title: '天琴的考校', icon: '🎋',
        desc: '长老天琴在竹下抚了一段琴——琴里有一个「执」字。',
        minAffection: 72, trigger: { random: 0.3 }, cooldown: 0, flag: 'xy_e010_done',
        autoTrigger: { location: '逍遥派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '竹林深处，长老天琴设琴案而坐——逍遥派以琴音伤人于无形的长老，今日的琴里却没有杀意，只有一片静。她抚了一段，收势时指尖轻按，忽然睁眼看你。', type: 'description' },
            { speaker: 'npc', text: '「这段琴里，有一个『执』字。」天琴的声音清冷，像琴音本身，「你在哪一音里听见的？」' },
            { speaker: 'narrator', text: '竹林边，闻人酌倚着酒坛装睡——可你看得见，他搭在坛沿上的手指，轻轻敲着，比心跳快了半拍。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '长揖及地：「在琴停的那一音。弹的人不肯往下弹，听的人不肯罢休。」', effect: 'stop', affection: 11 },
                { text: '如实答：「弟子不懂琴。只听懂了——琴里有个不肯说破的人。」', effect: 'honest', affection: 8 },
                { text: '什么也不说，走到琴案前，替长老把停住的那一音续完', effect: 'continue', affection: 9 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'stop': aff = 11; msg = '天琴盯着你看了半晌，忽而仰面大笑，笑声惊起满林宿鸟：「好一个『弹的人不肯往下弹』！我这段琴，满派听出『雅』的十之八九，听出『我』的，只你一个。」她收琴起身，衣袖带风，「回去告诉酒坛边那个装睡的——他那个『执』字，不止我听见了。满山都听见了。」当夜酒仙池的酒曲添了双份。他躺在坛边哼一支不知名的小调，调子的尾音里，全是笑。'; break;
                case 'honest': aff = 8; msg = '天琴不笑，缓缓点头：「不懂琴，不羞。不懂人，才羞。」她抚了抚琴弦，「执藏在音里，音藏在人里。你听见了人——便是听见了执。」三日后，闻人酌在石桌边寻到你，斟了酒，只说四个字：「长老夸你。」说完自己先饮了——耳根有点红。'; break;
                case 'continue': aff = 9; msg = '你走到琴案前，抬手，把长老停住的那一音轻轻续完。琴音不响，天琴的瞳孔却微微一缩——你续的那一音，接的正是《北冥》下一段的关窍。「谁教你的？」她收琴起身，看了你很久，「教的人，比你还执。」她走了。竹林边「睡着」的闻人酌仍躺在酒坛边，敲坛沿的手指不知何时停了。你经过时，他闭着眼说了一句：「……那一音，你还给我了。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'xy_event_011': {
        id: 'xy_event_011', npcId: XY_NPC_ID, title: '夺书夜', icon: '⚡',
        desc: '邪道夜袭琅嬛福地——北冥神功第一次在人前出手。',
        minAffection: 78, trigger: { random: 0.3 }, cooldown: 0, flag: 'xy_e011_done',
        autoTrigger: { location: '逍遥派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '三更火起，四面杀声——邪道人马夜袭琅嬛福地，要夺镇库的秘籍。这一场早有征兆：邪道频探福地虚实，探了半年，探的就是今夜。满派皆惊，弟子四散，福地大门已被冲开半扇。', type: 'description' },
            { speaker: 'narrator', text: '火光里你看见他。他站在堂中，放下酒盏——放得很轻，没有声音。盏底触案的一瞬，他的人已在三十丈外：凌波微步如影掠水，北冥神功渊吞岳纳，邪道先锋的内力像泥牛入海。天下最闲的人，第一次在人前出手。', type: 'description' },
            { speaker: 'npc', text: '收功后，他坐在满地书卷中间，仰头看你，笑了：「逍遥人不执。」他拍了拍手边的书，顿了顿，认了，「——执这些书，执这座山。执得很。」' },
            { speaker: 'player_select', text: '第二波邪道人马已逼到门口——你必须立刻做点什么。', options: [
                { text: '冲到他身边，与他背靠背，共守福地大门', effect: 'back', affection: 12 },
                { text: '挡在他身前，以身作墙，硬接第二波攻势', effect: 'shield', affection: 14 },
                { text: '高喊：「逍遥弟子，关镇库门——护书，护守藏人！」', effect: 'rally', affection: 10 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'back': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 14) : { ok: true };
                    if (!_py.ok) { aff = 6; msg = '第二波来得更凶，你挡了十几招，眼前发黑，被震倒在书架边——醒来时福地已守住，他坐在你旁边翻书理卷。「你睡了。」他头也不抬，「你睡着的时候，我把你压塌的那架书归了位。——人，是我抱出来的。」（精力不足，那一场你先力竭了）'; break; }
                    aff = 12; msg = ('你冲到他身边，背靠背——你的剑是他的墙，他的掌是你的墙。邪道攻了三波，退了三波。天亮收兵，他撑着石案起身，哑着嗓子对你说了两个字：「你在。」顿了顿，又添一个字，「好。」这三个字，比万卷书都重。') + '（精力-14）'; break; }
                case 'shield': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 20) : { ok: true };
                    if (!_py.ok) { aff = 7; msg = '你挡下两刀，第三刀擦着肩头过去，血染了半边衣襟。混乱里有人把你抬进堂中——醒来时他守在榻边，手里端着酒盏，却没喝。见你睁眼，他笑得一如既往，眼底却比刀光冷：「下回再替我挡刀——先问问我，敢不敢欠。」（精力不足，你中了一刀）'; break; }
                    aff = 14; msg = ('你抢到他身前，硬接第二波——刀锋过肩背，你一步不退。身后他掌力翻渊，声音不急不缓：「你退一步，我就把这山翻过来。」两个人守福地守到天琴长老的琴音赶到。战后他翻出伤药，一寸一寸替你上药，上着上着笑了，笑里带骂：「这笔账记下了——记在琅嬛的账上。我的账。」') + '（精力-20）'; break; }
                case 'rally': aff = 10; msg = '你一嗓子喊出去，慌乱的逍遥弟子应声而定——镇库门合拢，书阵发动，凌波微步往来如织，把他和你都护在了阵心。邪道冲不动阵，天亮撤走。事后棋圣长老立在福地门前，望着满地归架的书卷，只说了四个字：「此局，续了。」他走到你身边，低声：「你喊的，我都听见了。——『护守藏人』那一句，也算。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'xy_event_013': {
        id: 'xy_event_013', npcId: XY_NPC_ID, title: '终章·一执', icon: '🍶',
        desc: '他在封泥上提笔——没写酒名，写了你的名字。',
        minAffection: 85, trigger: { random: 1.0 }, cooldown: 0, flag: 'xy_e013_done',
        autoTrigger: { location: '逍遥派', random: 1.0 },
        endingMap: { '携酒': 'xy_ending_携酒', '藏归': 'xy_ending_藏归', '对弈': 'xy_ending_对弈', '酒客': 'xy_ending_酒客', '断弦': 'xy_ending_断弦', '散席': 'xy_ending_散席' },
        scenes: [
            { speaker: 'narrator', text: '酒仙池，新酒告成，只待开封题泥。他蹲在坛边提笔——逍遥派的酒都是他起的名：「醉月」「听泉」「三更」，一个比一个风雅。', type: 'description' },
            { speaker: 'narrator', text: '笔锋悬了半晌。他没收笔，也没写酒名——一笔一画，在封泥上写下了你的名字。写完掷笔，盯着封泥上那三个字，自嘲地笑：「完了。这一坛，往后没法一个人喝了。」', type: 'description' },
            { speaker: 'npc', text: '「逍遥派的课：不留人，也不送人。」他站起身看你，一身酒气，满身月色，头一回不慵懒，「我今日破例——留人。你，留下。」' },
            { speaker: 'player_select', text: '你的选择将决定你们的关系走向', options: [
                { text: '「留下。但我也想游——拎着这坛没命名的新酒，随我下山。这坛酒往后叫什么，看你。」', effect: 'lover_travel', affection: 30 },
                { text: '「我留下。琅嬛福地的灯，往后两个人剪；酒仙池的酒，两个人喝。」', effect: 'lover_stay', affection: 28 },
                { text: '「琴棋可论，风月不谈。做你的弈友——一年一会，石桌残局，续一手。」', effect: 'friend', affection: 20 },
                { text: '「那就给我留个酒仙池的常客位子。你来我斟，我来你斟——各喝各的，各记各的账。」', effect: 'friend_stay', affection: 18 },
                { text: '「逍遥的课，前半句是——不留人。师兄不必为我破例，我只是个该下山的过客。」', effect: 'none', affection: 0 }
            ]}
        ],
        effects: function(npc, choice) {
            // 三度伤透即断弦：辜负独立成结局「断弦」，与「散席」（错过）分账
            var negCount = (window._negativeChoiceCount && window._negativeChoiceCount[XY_NPC_ID]) || 0;
            if (negCount >= 3 && (choice === 'lover_travel' || choice === 'lover_stay')) {
                return { affection: 0, msg: '他听完你的答话，笑了。笑意一寸一寸漫上来，眼里的光却一寸一寸静下去。「留——留错了人。」他走回琴案边，抱起那张从不离身的琴，亲手把七弦一根一根剪断。剪弦的声音很轻，像剪一段线。「逍遥人动了执，是我蠢。」他把断弦的琴搁在案上，「弦断了，酒也酸了。往后琴是琴，酒是酒。」那一夜，琅嬛福地的灯全熄了——熄了整整三夜。', ending: '断弦' };
            }
            switch (choice) {
                case 'lover_travel': return { affection: 30, msg: '他怔立半晌，忽然仰头大笑，笑声震得池水都皱了：「下山！好——云游这门课，我修得比你熟。」他把那坛写着你名字的酒封好口，一手拎坛，一手负琴，回头望了一眼山门——这一回，他望得清清楚楚，也放得干干净净。「走吧。」他冲你笑，「这坛酒往后叫什么——看你。」', ending: '携酒' };
                case 'lover_stay': return { affection: 28, msg: '他执笔的手抖了一下。他低头笑，笑了很久，抬头时眼里有水光：「灯两个人剪，酒两个人喝——这两句，我记在琅嬛的账上了。满账最重的一笔。」他把新酒的头一盏斟出来，双手递到你面前，「喝。从今日起，这一池的酒，有你一半。」', ending: '藏归' };
                case 'friend': return { affection: 20, msg: '他沉默了一会儿，把杯中酒饮尽，点头：「弈友。」他起身走到石桌边，把那局残棋摆正，对面的座位掸了掸灰，「一年一会，一手。——局还差最后一手，你慢慢想。我不催。等，我这些年练得最熟。」', ending: '对弈' };
                case 'friend_stay': return { affection: 18, msg: '他看了你很久，把那盏新酒搁在坛盖上，笑了：「常客。」他伸手指了指酒仙池边一块平整的青石，「你的位子。这些年我一直留着没让人坐——风打不到，月亮先照到。」', ending: '酒客' };
                case 'none': return { affection: 0, msg: '他脸上的笑顿了半拍，随即恢复如常。「过客。」他点点头，弯腰把那坛写着你名字的酒重新封好，自己拎回了池边，「逍遥派送客，送到山门。」他送你下山，一路无话。到山门分手时，他只递给你一杯酒：「路上喝。——外面的酒，都不如这个。」', ending: '散席' };
            }
            return { affection: 0, msg: '' };
        }
    }
};

// ============ 闻人酌结局演出（6 个） ============
var XY_ENDINGS = {
    'xy_ending_携酒': {
        id: 'xy_ending_携酒', npcId: XY_NPC_ID, title: '结局·携酒', icon: '🍶',
        route: '携酒',
        scenes: [
            { speaker: 'narrator', text: '下山那日，逍遥派上下都来送。他摆手：「逍遥派的规矩，不送人。」自己却拎着一坛酒送到山门，回头冲众人笑，「我随人走了——酒随我走。你们送的哪门子行？」', type: 'description' },
            { speaker: 'narrator', text: '那坛酒的封泥上写的是你的名字，一路下山都没开封。他说酒要等——「等到值得喝的那一日。」', type: 'description' },
            { speaker: 'narrator', text: '后来江湖上多了一对道侣的传说：一人负琴，一人携酒，四海同行；走到哪里，哪里的不平事就多一桩了断——琴音起处，酒香随后。', type: 'description' },
            { speaker: 'narrator', text: '有人问过他：逍遥人，不怕执么？他正在调琴弦，头也不抬：「怕过。后来发现——这一坛，比怕值得。」篝火边你问那坛酒到底叫什么。他想了想，笑了，还是不肯命名：「急什么。封泥上已经写了你——酒名，让酒自己慢慢想。」', type: 'description' }
        ],
        finalText: '——— 结局·携酒（道侣·同行）———'
    },
    'xy_ending_藏归': {
        id: 'xy_ending_藏归', npcId: XY_NPC_ID, title: '结局·藏归', icon: '🏮',
        route: '藏归',
        scenes: [
            { speaker: 'narrator', text: '你留在了逍遥派。琅嬛福地的灯，从此两个人剪——他归书，你挑灯，理到半夜，闲话满架，灯却从没熄过。', type: 'description' },
            { speaker: 'npc', text: '天琴长老难得打趣他：「以为你要闲一辈子。」他斟酒，头也不抬：「闲是闲。——如今是两个人，一起闲。」', type: 'description' },
            { speaker: 'narrator', text: '酒仙池的酒，两个人喝。石桌的残局还没下完，他不急，你也不急——白子在你手里，黑子在他手里，局在桌上，日子长。', type: 'description' },
            { speaker: 'narrator', text: '每年新酒封坛，他都唤你来题封泥。头一年你问写什么，他说随便。你想了一想，写了一个「待」字。他盯着那个字看了半天，笑了，举杯一饮而尽：「好字。比我起的所有酒名，都好。」', type: 'description' }
        ],
        finalText: '——— 结局·藏归（道侣·归隐）———'
    },
    'xy_ending_对弈': {
        id: 'xy_ending_对弈', npcId: XY_NPC_ID, title: '结局·对弈', icon: '⚫',
        route: '对弈',
        scenes: [
            { speaker: 'narrator', text: '一年一会，成了你们之间的定约。琅嬛福地外的石桌，一局残棋，每年续一手——胜负不论，续罢各走各路，来年再会。', type: 'description' },
            { speaker: 'npc', text: '「今年，你的棋里没有火气了。」续罢他斟酒，难得多评了半句，「换成别的了。」你问换成什么。他举杯不答，眼睛在笑。', type: 'description' },
            { speaker: 'narrator', text: '有人问他，你算他什么人。他想了很久，答：「解局的人。」答完饮酒，又觉得三个字不够，补了四个字：「难得。不等。」', type: 'description' }
        ],
        finalText: '——— 结局·对弈（挚友·同行）———'
    },
    'xy_ending_酒客': {
        id: 'xy_ending_酒客', npcId: XY_NPC_ID, title: '结局·酒客', icon: '🍵',
        route: '酒客',
        scenes: [
            { speaker: 'narrator', text: '你成了酒仙池的常客。池边那块平整的青石，逍遥派上下没人敢坐——风打不到，月亮先照到，闻人师兄留了这些年，留的就是这块。', type: 'description' },
            { speaker: 'narrator', text: '他来你就斟，你来他就斟。两个人可以喝，也可以醒；可以说话，也可以不说话。新酒出池，头一盏永远分作两杯——规矩没人定，人人都守。', type: 'description' },
            { speaker: 'npc', text: '有一夜他喝到半醉，指着你跟新入门的师妹说：「这位——酒仙池的常客。比酒曲还靠得住。」说完自己先笑倒在酒坛边，笑完了，把身边那盏酒往你那边推了推。', type: 'description' }
        ],
        finalText: '——— 结局·酒客（挚友·归隐）———'
    },
    'xy_ending_断弦': {
        id: 'xy_ending_断弦', npcId: XY_NPC_ID, title: '结局·断弦', icon: '💔',
        route: '断弦',
        scenes: [
            { speaker: 'narrator', text: '他把七弦一根一根剪断了。琴身完好，弦尽断——他把那张无弦琴搁上琅嬛福地最高的书架，琴头朝着山门的方向。', type: 'description' },
            { speaker: 'narrator', text: '那一夜，琅嬛福地的灯全熄了——熄了整整三夜。第四夜起，灯重新亮起，灯油照旧月月续，账目照旧分毫不差：他还是什么都维持着，只是不抚琴了，不教琴了，也不再等人解局。', type: 'description' },
            { speaker: 'npc', text: '天琴长老问过一回：为何剪弦。他正在添酒曲，答得很平静：「逍遥人动了执，是我蠢。弦断了，酒也酸了。往后琴是琴，酒是酒。」长老叹了口气，走了。', type: 'description' },
            { speaker: 'narrator', text: '石桌的残局，他亲手散了枰。那枚白子，谁也不知道去了哪里。酒仙池的酒照年开封，起名的还是他——名起得越来越雅，越来越，不像一个人。', type: 'description' }
        ],
        finalText: '——— 结局·断弦（辜负）———'
    },
    'xy_ending_散席': {
        id: 'xy_ending_散席', npcId: XY_NPC_ID, title: '结局·散席', icon: '🌫️',
        route: '散席',
        scenes: [
            { speaker: 'narrator', text: '你下山之后，酒仙池的酒照酿，琅嬛的灯照点，石桌的残局照旧。什么都没变，像什么都不曾有过。', type: 'description' },
            { speaker: 'narrator', text: '只是他再也不问那一句「你几时走」——对谁都不问了。逍遥派入山第一课：不留人，也不送人。他两半都学会了。学得太好了。', type: 'description' },
            { speaker: 'narrator', text: '后来有游方客上逍遥讨酒，守藏人接待如仪，话照旧慵懒，机锋照旧犀利。客走了，他自己收盏，把石桌擦得干干净净，把琴横回膝上——弹到一半，停了。宴席散了，收盏的人还在。', type: 'description' }
        ],
        finalText: '——— 结局·散席（错过）———'
    }
};

// ============ 性别语境事件（femctx 女玩家 / mctx 男玩家，互斥） ============
var XY_GENDER_CTX_EVENTS = {
    // 女玩家：酒仙池酿酒师妹的提醒
    'xy_event_femctx': {
        id: 'xy_event_femctx', npcId: XY_NPC_ID, title: '酿酒师妹的话', icon: '🌸',
        desc: '逍遥派酿酒的师妹把你叫住在酒仙池边。',
        minAffection: 55, trigger: { random: 0.35 }, cooldown: 0, flag: 'xy_e_femctx_done',
        requirePlayerFemale: true,
        autoTrigger: { location: '逍遥派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '酒仙池边管酿酒的师妹把你叫住了。这姑娘在逍遥派酿了八年酒，看着闻人酌从躺在酒坛边睡觉的年轻道人，熬成了躺在酒坛边睡觉的守藏人。', type: 'description' },
            { speaker: 'npc', text: '「师姐。」她压低声音，「师兄从不给人酿酒——酒仙池那坛新酒，封泥上写的是你的名字。」她朝池边最新的一坛努努嘴，封泥墨迹犹新，「你自个儿瞧瞧去。我可什么都没说。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「名字是他写的，还是封泥自己长出来的——你去问他。」', effect: 'tease', affection: 8 },
                { text: '「半夜添酒曲的活儿，今年是不是多了一个人搭手？」', effect: 'starter', affection: 7 },
                { text: '「师妹，酒有心。起名字的人，更有。」', effect: 'heart', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'tease': aff = 8; msg = '师妹一怔，扑哧笑出声又赶紧捂嘴：「师姐胆大。」她朝酒坛那边瞅了瞅，声音压得更低，「我可不敢问。问了，师兄要多喝三盏——上月天琴长老当众夸了你一句，他一个人对着池子，喝了半坛。」'; break;
                case 'starter': aff = 7; msg = '师妹眼睛一亮：「你知道酒曲！」她掰着指头，「半夜添的，添了好些年，谁也不告诉。今年邪门——池边的脚印多了两行，一深一浅，深的那行半夜还提灯。」说完吐吐舌头，「这话师姐听过就算，别说是我讲的。」'; break;
                case 'heart': aff = 6; msg = '师妹把这句话嚼了半晌，重重点头：「难怪今年的新酒格外香。」她把新舀的酒往你手边推了推，「师姐往后常来。池边那块青石——师兄擦了三遍，才许人坐的。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // 男玩家：逍遥同门间的流言
    'xy_event_mctx': {
        id: 'xy_event_mctx', npcId: XY_NPC_ID, title: '同门言论', icon: '🍃',
        desc: '竹林外，几个逍遥派弟子压低了声音。',
        minAffection: 55, trigger: { random: 0.35 }, cooldown: 0, flag: 'xy_e_mctx_done',
        requirePlayerMale: true,
        autoTrigger: { location: '逍遥派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '竹林外，几个逍遥派弟子凑在一处，见你过来，声音忽然压低——低得又不够彻底。', type: 'description' },
            { speaker: 'npc', text: '「他教你抚琴了？」大师兄模样的摇头，「上一回他教人抚琴，还是师父在山上的时候。《北冥》头一曲，他一个音一个音地带——你们知道这意味着什么？」' },
            { speaker: 'npc', text: '「这还不算。」最小的那个把声音压得更低，「师兄那张琴，多少年不离身。夺书夜那天，他把它搁在案上就出了手。还有——他半夜添酒曲，今年多酿了一坛。你们说，这是什么意思？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「什么意思，他自己会说。轮不到旁人猜。」', effect: 'defy', affection: 8 },
                { text: '「诸位，石桌一局——输了的请酒。」', effect: 'chess', affection: 7 },
                { text: '「就是你们想的那个意思。我不忌讳。」', effect: 'own', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'defy': aff = 8; msg = '几个弟子面面相觑，大师兄起身拱手：「……有理。」他让开路，「师兄守了琅嬛这些年，守得比谁都实。兄台稳，我们放心。」自此逍遥弟子见你都客客气气，流言改成了敬语。'; break;
                case 'chess': aff = 7; msg = '石桌一局，你赢了半子。最小的那个掏酒钱时挠头：「兄台的棋，有火气——又收得住。」你笑而不答。那火气，那收得住，都是酒坛边那个人一手一手喂出来的；你本来也没打算瞒谁。'; break;
                case 'own': aff = 6; msg = '满场一静。最小的把刚喝的酒喷了半口。大师兄盯着你看了半晌，忽然深深一揖：「……好胆。这话，我记下了。」次日流言就停了——不是压下去的，是满派都知道了：那个人自己认的。'; break;
            }
            return { affection: aff, msg: msg };
        }
    }
};

// ============ 合并进总事件池 ============
if (typeof NPC_PERSONAL_EVENTS !== 'undefined') {
    Object.assign(NPC_PERSONAL_EVENTS, XY_MAIN_EVENTS);
    Object.assign(NPC_PERSONAL_EVENTS, XY_GENDER_CTX_EVENTS);
}

// ============ 注册结局集与副作用回调 ============
if (typeof registerEndingSet === 'function') {
    registerEndingSet(XY_NPC_ID, XY_ENDINGS);
}
if (typeof registerEndingCallback === 'function') {
    registerEndingCallback(XY_NPC_ID, function(endingName, npc) {
        if (endingName === '携酒' || endingName === '藏归') {
            if (npc && typeof npc.setFlag === 'function') npc.setFlag('dao_companion');
            if (window.showMessage) window.showMessage('🍶 你与闻人酌结为道侣！逍遥琴心与北冥真气感悟大幅提升', 'success');
        } else if (endingName === '对弈' || endingName === '酒客') {
            if (npc && npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 30);
            if (window.showMessage) window.showMessage('🍶 你与闻人酌成了对弈论酒的知己', 'success');
        } else if (endingName === '断弦') {
            if (window.showMessage) window.showMessage('🎻 闻人酌剪了琴弦。逍遥人动了执——弦断酒酸', 'error');
        }
    });
}

// ============ 自动触发 + 每日钩子（复用 maybeAutoTriggerPersonalEvent） ============
function maybeAutoTriggerXyEvent(source) {
    return maybeAutoTriggerPersonalEvent(XY_NPC_ID, source, { finalEvents: ['xy_event_013'] });
}

if (typeof window !== 'undefined' && window.timeSystem && window.timeSystem.onNewDaySubscribe) {
    window.timeSystem.onNewDaySubscribe(function() {
        try {
            if (window.currentCharData && window.currentCharData.location === '逍遥派') {
                maybeAutoTriggerXyEvent('daily');
            }
            // 性别语境：每日在该派过夜 + 对应性别 + 好感≥55 + 未触发
            if (!window.currentCharData || !window.npcManager) return;
            var loc = window.currentCharData.location || '';
            if (loc !== '逍遥派') return;
            var npc = window.npcManager.getNPC ? window.npcManager.getNPC(XY_NPC_ID) : null;
            if (!npc) return;
            var aff = (npc.relationship && npc.relationship.affection) || 0;
            if (aff < 55) return;
            var isF = window.currentCharData.gender === 'female';
            var ctxId = isF ? 'xy_event_femctx' : 'xy_event_mctx';
            if (typeof hasEventTriggered === 'function' && hasEventTriggered(ctxId)) return;
            var ev = NPC_PERSONAL_EVENTS[ctxId];
            if (!ev) return;
            if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npc)) return;
            setTimeout(function() {
                if (document.querySelector && document.querySelector('.personal-event-modal')) return;
                if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npc)) return;
                if (typeof triggerPersonalEvent === 'function') triggerPersonalEvent(ctxId);
            }, 1200);
        } catch (e) { console.warn('[闻人酌线] 每日触发失败:', e); }
    });
}

// ============ 导出 ============
if (typeof window !== 'undefined') {
    window.XY_MAIN_EVENTS = XY_MAIN_EVENTS;
    window.XY_ENDINGS = XY_ENDINGS;
    window.maybeAutoTriggerXyEvent = maybeAutoTriggerXyEvent;
}

// 扩展男主名册（v20.75：闻人酌入册，吃醋对峙/和好两桩由 male-lead-*.js 稍后接线，名册 push 先行）
if (typeof window !== 'undefined' && window.MALE_LEAD_ROSTER && window.MALE_LEAD_ROSTER.push) {
    window.MALE_LEAD_ROSTER.push({ id: XY_NPC_ID, name: '闻人酌', sect: '逍遥派', eventId: 'xy_event_rival', reconcileId: 'xy_event_reconcile', femctxId: 'xy_event_femctx', mctxId: 'xy_event_mctx' });
}
console.log('[闻人酌线] 逍遥派感情线加载完成：结局 ' + Object.keys(XY_ENDINGS).length + ' 个 + 主线事件 ' + Object.keys(XY_MAIN_EVENTS).length + ' 个 + 性别语境 ' + Object.keys(XY_GENDER_CTX_EVENTS).length + ' 个');
