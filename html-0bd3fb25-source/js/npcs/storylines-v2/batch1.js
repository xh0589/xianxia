/**
 * storylines-v2/batch1.js — NPC故事线重写·第一批（v12.6）
 *
 * 收录：清虚道人(mentor_01) / 灵素(healer_01) / 铁山(warrior_01)
 * 格式：直接使用 NPC_PERSONAL_EVENTS 格式（五段线：相遇→交集→秘密→抉择→终章）
 *   - 第1~4段 autoTrigger random（第1段0.4、2~4段0.3）；终章仅手动触发（无 autoTrigger）
 *   - 第3段解锁秘密（effects 返回 secretId）
 *   - 第4段为不可回头抉择，选择记录到 localStorage（xianxia_storyline_choices）
 *   - 终章按第4段选择双分支收尾（_dynamicScenes 动态生成 scenes）
 * 链式顺序依赖 npc-personal-events.js 的 isChainHead（事件ID序号 _event_N），
 * 自动弹出复用 maybeAutoTriggerPersonalEvent（baihua-personal-events.js v12.3.1 泛化版）。
 */
(function () {
    'use strict';

    // ============ 抉择记录（跨会话持久化，供终章读取） ============
    var LS_KEY = 'xianxia_storyline_choices';

    function _loadChoices() {
        try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch (e) { return {}; }
    }
    function recordStorylineChoice(npcId, choice) {
        var all = _loadChoices();
        all[npcId] = choice;
        try { localStorage.setItem(LS_KEY, JSON.stringify(all)); } catch (e) {}
    }
    function getStorylineChoice(npcId) {
        return _loadChoices()[npcId] || null;
    }
    window.recordStorylineChoice = recordStorylineChoice;
    window.getStorylineChoice = getStorylineChoice;

    // ============ 清虚道人（mentor_01）============
    // 秘密底子（special-npcs.js）：年轻时曾与魔教圣女有过一段情缘
    var MENTOR_EVENTS = {
        'mentor01_event_1': {
            id: 'mentor01_event_1', npcId: 'mentor_01',
            title: '残局的访客', icon: '♟️',
            desc: '修炼室的棋盘上摆着一盘没下完的旧局。',
            minAffection: 15,
            trigger: { random: 0.4 }, cooldown: 3,
            flag: 'mentor01_e1_done',
            autoTrigger: { random: 0.4 },
            scenes: [
                { speaker: 'narrator', text: '你奉命送书简去修炼室。门虚掩着，清虚道人不在，案上棋盘黑白纠缠——是一盘下到中局的残棋。', type: 'description' },
                { speaker: 'narrator', text: '白子被围在角上，气数将尽，却还留着一眼活棋。棋盒盖内侧写着两个小字：「勿救」。', type: 'description' },
                { speaker: 'player_select', text: '你如何做？', options: [
                    { text: '按捺住好奇，把书简放好便退出去', effect: 'leave', affection: 2 },
                    { text: '忍不住替白子落了一手救棋', effect: 'save', affection: 1 },
                    { text: '记下棋局，想回头问问其中来历', effect: 'ask_later', affection: 3 }
                ]}
            ],
            effects: function (npc, choice) {
                var aff = 0, msg = '';
                switch (choice) {
                    case 'leave': aff = 2; msg = '晚间他路过书房，看了你一眼：「今日的事，老道知道。」'; break;
                    case 'save': aff = 1; msg = '次日那手棋被抹平了，棋盘擦得很干净，像什么都没发生过。'; break;
                    case 'ask_later': aff = 3; msg = '你问起残局，他执子的手停了停：「一局旧棋罢了。——你倒是有心。」'; break;
                }
                return { affection: aff, msg: msg };
            }
        },
        'mentor01_event_2': {
            id: 'mentor01_event_2', npcId: 'mentor_01',
            title: '讲经跳过的那一年', icon: '📜',
            desc: '讲堂上他讲《清心诀》，讲到某一年忽然停住了。',
            minAffection: 25,
            trigger: { random: 0.3 }, cooldown: 3,
            flag: 'mentor01_e2_done',
            autoTrigger: { random: 0.3 },
            scenes: [
                { speaker: 'narrator', text: '讲经堂上，清虚道人讲自己游历红尘的见闻，一年一年讲得妙趣横生。唯独讲到某一年，话头忽然收住，只说了句「那年山中多雨」。', type: 'description' },
                { speaker: 'npc', text: '……后来的事，后来再说。今日经讲到此。', emotion: 'hesitant' },
                { speaker: 'narrator', text: '散场后众人离去，你发现他独自坐在蒲团上，望着窗外的雨出神。', type: 'description' },
                { speaker: 'player_select', text: '你如何做？', options: [
                    { text: '默默留下，陪他坐了一会儿', effect: 'stay', affection: 4 },
                    { text: '递上一盏热茶，什么都不问', effect: 'tea', affection: 3 },
                    { text: '直接问他那年发生了什么', effect: 'press', affection: -1 }
                ]}
            ],
            effects: function (npc, choice) {
                var aff = 0, msg = '';
                switch (choice) {
                    case 'stay': aff = 4; msg = '雨声里他忽然开口：「你不问？」——「你想说的时候自然会说。」他笑了笑，没再说话。'; break;
                    case 'tea': aff = 3; msg = '他接过茶，掌心贴着杯壁暖了很久。「好孩子。」'; break;
                    case 'press': aff = -1; msg = '他脸上的温和淡了下去：「有些事，问了也是揭人伤疤。」'; break;
                }
                return { affection: aff, msg: msg };
            }
        },
        'mentor01_event_3': {
            id: 'mentor01_event_3', npcId: 'mentor_01',
            title: '玉簪与画像', icon: '🪮',
            desc: '你替他整理旧籍，翻出了一只不该出现的木匣。',
            minAffection: 35,
            trigger: { random: 0.3 }, cooldown: 0,
            flag: 'mentor01_e3_done',
            autoTrigger: { random: 0.3 },
            unlockSecret: 'mentor_secret_01',
            scenes: [
                { speaker: 'narrator', text: '藏书阁整理旧籍，一只樟木匣从书架顶层滑落——里面没有经卷，只有一支旧玉簪，和一幅折了很多折的画像。', type: 'description' },
                { speaker: 'narrator', text: '画上的红衣女子眉目张扬，簪正是这支玉簪。画像背面题着一行小字，墨色很旧：「山高水长，勿念。」', type: 'description' },
                { speaker: 'npc', text: '……看到了？', emotion: 'serious' },
                { speaker: 'narrator', text: '他不知何时站在门口。沉默了很久，他伸手接过木匣，却没有合上盖子。', type: 'description' },
                { speaker: 'npc', text: '她姓萧。那时候我还俗名未废。……她是魔教的圣女，我是名门正道的弟子。这故事怎么结尾，你大约猜得到。', emotion: 'deep' },
                { speaker: 'player_select', text: '你如何回应？', options: [
                    { text: '「她若泉下有知，未必愿你如此自苦。」', effect: 'comfort', affection: 5 },
                    { text: '「正魔之别是立场，不是人心。」', effect: 'understand', affection: 4 },
                    { text: '什么都别说，只是替他把匣盖轻轻合上', effect: 'silent', affection: 5 }
                ]}
            ],
            effects: function (npc, choice) {
                var aff = 0, msg = '', secretId = null;
                switch (choice) {
                    case 'comfort': aff = 5; msg = '他怔了很久，忽然笑了，眼角的皱纹里像落了雪：「四十年了，头一回有人替她说话。」'; break;
                    case 'understand': aff = 4; msg = '「立场……」他低声重复了一遍这个词，「若四十年前有人对我说这句话就好了。」'; break;
                    case 'silent': aff = 5; msg = '匣盖合拢的一瞬，他长长吐出一口气，仿佛卸下了背了四十年的东西。「多谢。」'; break;
                }
                secretId = 'mentor_secret_01';
                return { affection: aff, msg: msg, secretId: secretId };
            }
        },
        'mentor01_event_4': {
            id: 'mentor01_event_4', npcId: 'mentor_01',
            title: '故人之信', icon: '✉️',
            desc: '一封没有署名的信送到山门，指名交给清虚道人。',
            minAffection: 45,
            trigger: { random: 0.3 }, cooldown: 0,
            flag: 'mentor01_e4_done',
            autoTrigger: { random: 0.3 },
            scenes: [
                { speaker: 'narrator', text: '信是山下驿站转来的，火漆封印的样式你在典籍里见过——魔教「幽阑教」的记号。收信人一栏写的却不是「清虚道人」，是一个你从没听过的名字。', type: 'description' },
                { speaker: 'narrator', text: '他在灯下读完信，久久没有说话。信纸的末尾只有一句：「萧氏未绝，病重，愿于死前一见故人。」', type: 'description' },
                { speaker: 'npc', text: '她若真是萧氏血脉……我这一身道袍，去，还是不去？', emotion: 'deep' },
                { speaker: 'narrator', text: '烛火摇了摇。他看向你，这是他第一次用「请教」的眼神看你。', type: 'description' },
                { speaker: 'player_select', text: '此抉择无法回头——你如何答？', options: [
                    { text: '「去。有些面，不见是一辈子的坎。」', effect: 'go' },
                    { text: '「不去。让她安走，让往事安眠。」', effect: 'stay' },
                    { text: '「托人带一支玉簪去，代你看她最后一眼。」', effect: 'send_token' }
                ]}
            ],
            effects: function (npc, choice) {
                if (typeof window.recordStorylineChoice === 'function') window.recordStorylineChoice('mentor_01', choice);
                var aff = 0, msg = '';
                switch (choice) {
                    case 'go': aff = 4; msg = '他闭了闭眼：「好。……替我备一件蓑衣吧，听说山下又在下雨。」'; break;
                    case 'stay': aff = 3; msg = '他沉默良久，点了点头：「你说得对。修行四十年，不能败给四十年前。」'; break;
                    case 'send_token': aff = 4; msg = '他把玉簪用素绢包好，交到你手上：「你的法子最好。老道欠你一回。」'; break;
                }
                return { affection: aff, msg: msg };
            }
        },
        'mentor01_event_5': {
            id: 'mentor01_event_5', npcId: 'mentor_01',
            title: '终章·雨停之后', icon: '🌧️',
            desc: '下山归来那日，清虚道人在山门口等雨停。',
            minAffection: 55,
            trigger: { random: 0.3 }, cooldown: 0,
            flag: 'mentor01_e5_done',
            // 终章仅手动触发：无 autoTrigger
            // 双分支：按第4段抉择动态生成 scenes
            _dynamicScenes: function () {
                var c = (typeof window.getStorylineChoice === 'function') ? window.getStorylineChoice('mentor_01') : null;
                if (c === 'go') {
                    return [
                        { speaker: 'narrator', text: '他去了七日。回来那日山下落着雨，你就站在山门的檐下等他——不知道为什么，你就是觉得该去等。', type: 'description' },
                        { speaker: 'narrator', text: '他的道袍下摆全是泥，手里却空着。玉簪没有带回来。', type: 'description' },
                        { speaker: 'npc', text: '见到了。她瘦得厉害，可笑起来还是画像上的样子。', emotion: 'warm' },
                        { speaker: 'npc', text: '她说：「你来晚了四十年，好在来了。」……我说，往后的日子，我每年下山看她一次。她摇头说不用——但我知道她会等的。', emotion: 'warm' },
                        { speaker: 'player_select', text: '你如何回应？', options: [
                            { text: '「明年下雨的时候，我陪您一起下山。」', effect: 'promise', affection: 6 },
                            { text: '「这一趟，值得。」', effect: 'worth', affection: 4 }
                        ]}
                    ];
                }
                if (c === 'send_token') {
                    return [
                        { speaker: 'narrator', text: '玉簪送出去的第三日，山下带回一个薄薄的包袱。里面是一件叠得整整齐齐的红衣袖——是从画像女子身上裁下来的。', type: 'description' },
                        { speaker: 'npc', text: '她懂了。四十年前是我负她，四十年后……是她饶了我。', emotion: 'deep' },
                        { speaker: 'narrator', text: '他把红袖和玉簪放进樟木匣，这一次，亲手合上了盖子。', type: 'description' },
                        { speaker: 'player_select', text: '你如何回应？', options: [
                            { text: '「有些人不必再见，也一直都在。」', effect: 'bless', affection: 6 },
                            { text: '「您把这件事处理得很好。」', effect: 'praise', affection: 4 }
                        ]}
                    ];
                }
                // stay（默认分支）
                return [
                    { speaker: 'narrator', text: '他没有下山。那封信被他压在棋盒底下，压了整整一个月。', type: 'description' },
                    { speaker: 'narrator', text: '一个月后的清晨，你在后山看见他蹲在一株山茶前培土——土里埋着的，是那只樟木匣。', type: 'description' },
                    { speaker: 'npc', text: '葬了。不是忘了她，是放过我自己。', emotion: 'solemn' },
                    { speaker: 'npc', text: '老道修了一辈子「放下」，原来放下不在经里，在这捧土里。', emotion: 'deep' },
                    { speaker: 'player_select', text: '你如何回应？', options: [
                        { text: '「师父这一课，比讲经堂上讲得好。」', effect: 'respect', affection: 6 },
                        { text: '默默陪他把土培完', effect: 'silent', affection: 5 }
                    ]}
                ];
            },
            scenes: [],
            effects: function (npc, choice) {
                var aff = 0, msg = '';
                switch (choice) {
                    case 'promise': aff = 6; msg = '他大笑起来，笑声惊起了檐下的雨珠：「好！一言为定！」'; break;
                    case 'worth': aff = 4; msg = '他望着山下的雨幕，轻轻「嗯」了一声。'; break;
                    case 'bless': aff = 6; msg = '匣盖合拢的声音很轻，他却听得清清楚楚。'; break;
                    case 'praise': aff = 4; msg = '「是你成全的。」他把匣子放回架上，摆得很正。'; break;
                    case 'respect': aff = 6; msg = '他拍了拍手上的泥，头一回笑得像个普通的老人。'; break;
                    case 'silent': aff = 5; msg = '山茶花种下了。来年春天会开的。'; break;
                }
                return { affection: aff, msg: msg };
            }
        }
    };

    // ============ 灵素（healer_01）============
    // 秘密底子（special-npcs.js）：身患奇毒，时日无多
    var HEALER_EVENTS = {
        'healer01_event_1': {
            id: 'healer01_event_1', npcId: 'healer_01',
            title: '抓错的药', icon: '🌿',
            desc: '她在称一味药时，手抖了一下。',
            minAffection: 15,
            trigger: { random: 0.4 }, cooldown: 3,
            flag: 'healer01_e1_done',
            autoTrigger: { random: 0.4 },
            scenes: [
                { speaker: 'narrator', text: '医馆午后，灵素在为你配调理的药。戥子称到「七叶一枝花」时，她的手腕忽然一颤，多挑了一钱。', type: 'description' },
                { speaker: 'narrator', text: '她盯着那多出来的一钱药看了两秒，像是不认识自己的手。', type: 'description' },
                { speaker: 'npc', text: '……抱歉，重新称。今天的手不听话。', emotion: 'hesitant' },
                { speaker: 'player_select', text: '你如何回应？', options: [
                    { text: '「是不是累了？歇一歇，我自己随便抓抓就行。」', effect: 'care', affection: 4 },
                    { text: '「医者的手不能抖——要不要紧？」', effect: 'worry', affection: 3 },
                    { text: '装作没看见，等她自己缓过来', effect: 'ignore', affection: 1 }
                ]}
            ],
            effects: function (npc, choice) {
                var aff = 0, msg = '';
                switch (choice) {
                    case 'care': aff = 4; msg = '她愣了一下，随即笑了：「哪有你这么跟大夫说话的。……不过，谢谢。」'; break;
                    case 'worry': aff = 3; msg = '「没事，昨夜看医书睡晚了。」她说得太流畅了，流畅得像背过。'; break;
                    case 'ignore': aff = 1; msg = '她重新称好了药，包药纸的边角折得一丝不苟。'; break;
                }
                return { affection: aff, msg: msg };
            }
        },
        'healer01_event_2': {
            id: 'healer01_event_2', npcId: 'healer_01',
            title: '夜半的咳嗽', icon: '🌙',
            desc: '深夜路过后院，医馆的灯还亮着。',
            minAffection: 25,
            trigger: { random: 0.3 }, cooldown: 3,
            flag: 'healer01_e2_done',
            autoTrigger: { timeRange: [21, 24], random: 0.3 },
            scenes: [
                { speaker: 'narrator', text: '夜半你取东西路过后院，医馆的灯还亮着。窗纸上映着她伏案的影子——然后是一阵极力压低的咳嗽，咳得影子都在发抖。', type: 'description' },
                { speaker: 'narrator', text: '咳嗽停了。你听见研墨的声音，她还在写什么。', type: 'description' },
                { speaker: 'player_select', text: '你如何做？', options: [
                    { text: '敲门，给她端一碗润喉的蜜水', effect: 'help', affection: 4 },
                    { text: '不打扰，明早再来探望', effect: 'retreat', affection: 2 },
                    { text: '在窗外轻声问一句「还没歇息？」', effect: 'greet', affection: 3 }
                ]}
            ],
            effects: function (npc, choice) {
                var aff = 0, msg = '';
                switch (choice) {
                    case 'help': aff = 4; msg = '开门时她眼眶微红，却先笑了：「这么晚了……蜜水给我吧，账记在你下次抓药的折扣上。」'; break;
                    case 'retreat': aff = 2; msg = '次日清晨你去探望，桌上多了一小罐润喉的蜜渍枇杷——她说是「顺手做的」。'; break;
                    case 'greet': aff = 3; msg = '窗内的灯灭得很快。「这就睡了！」——声音里的沙哑藏不住。'; break;
                }
                return { affection: aff, msg: msg };
            }
        },
        'healer01_event_3': {
            id: 'healer01_event_3', npcId: 'healer_01',
            title: '针尾的黑', icon: '🩺',
            desc: '你撞见了她给自己施针的样子。',
            minAffection: 35,
            trigger: { random: 0.3 }, cooldown: 0,
            flag: 'healer01_e3_done',
            autoTrigger: { timeRange: [20, 24], random: 0.3 },
            unlockSecret: 'healer_secret_01',
            scenes: [
                { speaker: 'narrator', text: '你落了东西在医馆，折回去取。内室的门没关严——灵素坐在榻上，挽着袖子，正把一枚长针刺进自己臂弯。', type: 'description' },
                { speaker: 'narrator', text: '拔针的时候，针尾凝出一滴极深的黑。黑得不像血，像化不开的墨。', type: 'description' },
                { speaker: 'narrator', text: '她抬头看见你，握针的手僵在半空。这一次，她连借口都没找。', type: 'description' },
                { speaker: 'npc', text: '……进来吧，把门关上。', emotion: 'serious' },
                { speaker: 'npc', text: '「噬心蛊引」。十年前在南疆采药时中的。它很耐心，我也很有耐心——我们比一比谁先熬死谁。', emotion: 'neutral' },
                { speaker: 'narrator', text: '她说得很平静，平静得像在念别人的病历。只有攥着棉布的那只手，指节泛白。', type: 'description' },
                { speaker: 'player_select', text: '你如何回应？', options: [
                    { text: '「为什么不告诉任何人？」', effect: 'why', affection: 4 },
                    { text: '「从今天起，你的药童就是我。解药的事，我们一起想办法。」', effect: 'pledge', affection: 6 },
                    { text: '伸出手，把她手里的针轻轻拿过来', effect: 'take_needle', affection: 5 }
                ]}
            ],
            effects: function (npc, choice) {
                var aff = 0, msg = '', secretId = null;
                switch (choice) {
                    case 'why': aff = 4; msg = '「说了又能怎样呢？」她笑了笑，「医者最怕的不是病，是当了病人。」'; break;
                    case 'pledge': aff = 6; msg = '她别过脸去，好一会儿才转回来，眼睛亮亮的：「……你这人，真是。」'; break;
                    case 'take_needle': aff = 5; msg = '针到了你手里，她的眼泪毫无预兆地掉下来。她自己也吓了一跳，慌忙去擦：「对不起，十年没哭过，忘了这个也会生锈。」'; break;
                }
                secretId = 'healer_secret_01';
                return { affection: aff, msg: msg, secretId: secretId };
            }
        },
        'healer01_event_4': {
            id: 'healer01_event_4', npcId: 'healer_01',
            title: '解药的代价', icon: '⚖️',
            desc: '她终于找到了解药的方子——代价写在第一行。',
            minAffection: 45,
            trigger: { random: 0.3 }, cooldown: 0,
            flag: 'healer01_e4_done',
            autoTrigger: { random: 0.3 },
            scenes: [
                { speaker: 'narrator', text: '她把一张药方推到你面前。方子完备，主药、辅药、炮制手法一应俱全——唯独主药「雪心莲」三个字旁边画了个圈。', type: 'description' },
                { speaker: 'npc', text: '雪心莲只生在南疆的蛊母洞窟里，那是幽阑教的地界。十年前我就是在那里中的毒。', emotion: 'serious' },
                { speaker: 'narrator', text: '她顿了顿，声音低了下去：「而且我的脉象撑不过半年。这一趟，快去快回也要两个月。」', type: 'description' },
                { speaker: 'npc', text: '所以我一直在犹豫——是用剩下的时间去赌一条活路，还是安安静静把该做的事做完。', emotion: 'deep' },
                { speaker: 'player_select', text: '此抉择无法回头——你如何答？', options: [
                    { text: '「药我去取。你只需要答应我一件事：好好活到我回来。」', effect: 'fetch' },
                    { text: '「不赌。剩下的时间，我们把你的医书写完。」', effect: 'book' },
                    { text: '「把方子抄给我。天下之大，总有第三个拿到雪心莲的法子。」', effect: 'third_way' }
                ]}
            ],
            effects: function (npc, choice) {
                if (typeof window.recordStorylineChoice === 'function') window.recordStorylineChoice('healer_01', choice);
                var aff = 0, msg = '';
                switch (choice) {
                    case 'fetch': aff = 5; msg = '她盯着你看了很久很久，最后轻轻「嗯」了一声。那一声很轻，却是她十年来第一次把命交到别人手里。'; break;
                    case 'book': aff = 4; msg = '她沉默半晌，忽然笑了：「好啊。那就麻烦你当个研墨的——我的字，最近抖得厉害。」'; break;
                    case 'third_way': aff = 4; msg = '「第三个法子……」她把方子抄了一份给你，指尖在「雪心莲」上停了停，「那我就把命再借来几个月，等你。」'; break;
                }
                return { affection: aff, msg: msg };
            }
        },
        'healer01_event_5': {
            id: 'healer01_event_5', npcId: 'healer_01',
            title: '终章·春日的医馆', icon: '🌸',
            desc: '医馆的院子里，今年的药苗抽了新芽。',
            minAffection: 55,
            trigger: { random: 0.3 }, cooldown: 0,
            flag: 'healer01_e5_done',
            // 终章仅手动触发：无 autoTrigger
            _dynamicScenes: function () {
                var c = (typeof window.getStorylineChoice === 'function') ? window.getStorylineChoice('healer_01') : null;
                if (c === 'fetch') {
                    return [
                        { speaker: 'narrator', text: '你回来那天，她正在院里晒药。听见脚步声，她回过头——然后手里的竹匾「哐当」掉在了地上。', type: 'description' },
                        { speaker: 'narrator', text: '你把雪心莲递过去。她没有接，先是看了看药，又抬眼看了看你的脸——看你有没有缺胳膊少腿。', type: 'description' },
                        { speaker: 'npc', text: '……先说好，我只是检查一下药材成色。', emotion: 'hesitant' },
                        { speaker: 'narrator', text: '检查着检查着，眼泪就砸在了药瓣上。她一边哭一边骂你逞英雄，手却把那株莲攥得死紧。', type: 'description' },
                        { speaker: 'player_select', text: '你如何回应？', options: [
                            { text: '「哭完了就煎药。说好的，好好活着。」', effect: 'live', affection: 7 },
                            { text: '「这次换我当大夫——医嘱是：不许再瞒我任何事。」', effect: 'doctor', affection: 6 }
                        ]}
                    ];
                }
                if (c === 'third_way') {
                    return [
                        { speaker: 'narrator', text: '三个月后，你带着一位云游的老丹师回到百花谷。老丹师验过她的脉，又验了方子，沉吟许久，说出四个字：「以针换莲。」', type: 'description' },
                        { speaker: 'narrator', text: '以她毕生的针法造诣为引，替代雪心莲的「心火」——凶险，但有六成把握。', type: 'description' },
                        { speaker: 'npc', text: '六成……比我原本的零成强多了。', emotion: 'happy' },
                        { speaker: 'narrator', text: '施针那日你在门外守了一天一夜。门开的时候，她自己走出来，脸色苍白，冲你比了一个「六」以外的手势——成了。', type: 'description' },
                        { speaker: 'player_select', text: '你如何回应？', options: [
                            { text: '「我就说，天无绝人之路。」', effect: 'smile', affection: 7 },
                            { text: '什么也不说，扶她坐下，把煎好的药递过去', effect: 'quiet', affection: 6 }
                        ]}
                    ];
                }
                // book（默认分支）
                return [
                    { speaker: 'narrator', text: '入秋那天，《青囊补遗》最后一个字落笔。她搁下笔，靠在椅背上，长长舒了一口气——像是把一辈子都写完了。', type: 'description' },
                    { speaker: 'npc', text: '书成了。毒发的时候，我大概会是个快乐的病人。', emotion: 'warm' },
                    { speaker: 'narrator', text: '扉页上有两行字。第一行是她的名字。第二行墨迹更新一些：「同砚：{playerName}」。', type: 'description' },
                    { speaker: 'player_select', text: '你如何回应？', options: [
                        { text: '「这本书会救人。你也一样——所以不许偷懒，接着治你的病。」', effect: 'insist', affection: 7 },
                        { text: '「能与你同砚，是我修行路上最好的运气。」', effect: 'thanks', affection: 6 }
                    ]}
                ];
            },
            scenes: [],
            effects: function (npc, choice) {
                var aff = 0, msg = '';
                switch (choice) {
                    case 'live': aff = 7; msg = '她破涕为笑，抹了把脸：「知道了知道了——啰嗦。」'; break;
                    case 'doctor': aff = 6; msg = '「遵命，大夫。」她认认真真地朝你拱了拱手，眼里还有泪光。'; break;
                    case 'smile': aff = 7; msg = '「嗯。」她笑着点头，阳光落在她脸上，比药还暖。'; break;
                    case 'quiet': aff = 6; msg = '药很苦。她喝得很慢，像是在品什么难得的东西。'; break;
                    case 'insist': aff = 7; msg = '「……真拿你没办法。」她把医书抱进怀里，抱得很紧。'; break;
                    case 'thanks': aff = 6; msg = '她低头看着扉页上并排的两个名字，耳根悄悄红了。'; break;
                }
                return { affection: aff, msg: msg };
            }
        }
    };

    // ============ 铁山（warrior_01）============
    // 秘密底子（special-npcs.js）：曾经败给过一个神秘对手
    var WARRIOR_EVENTS = {
        'warrior01_event_1': {
            id: 'warrior01_event_1', npcId: 'warrior_01',
            title: '深夜的木桩', icon: '🥊',
            desc: '演武场的人都走了，只有木桩还在挨打。',
            minAffection: 15,
            trigger: { random: 0.4 }, cooldown: 3,
            flag: 'warrior01_e1_done',
            autoTrigger: { timeRange: [20, 24], random: 0.4 },
            scenes: [
                { speaker: 'narrator', text: '亥时的演武场只剩一个月亮。铁山还在打桩——不是练功的路数，每一拳都闷得很，像在跟木桩置气。', type: 'description' },
                { speaker: 'narrator', text: '拳头上缠的布渗了血，他浑然不觉。', type: 'description' },
                { speaker: 'player_select', text: '你如何做？', options: [
                    { text: '扔给他一卷干净的绷带', effect: 'bandage', affection: 4 },
                    { text: '站到木桩另一侧，替他扶住桩身', effect: 'hold', affection: 3 },
                    { text: '喊他「再打下去手就废了」', effect: 'shout', affection: 2 }
                ]}
            ],
            effects: function (npc, choice) {
                var aff = 0, msg = '';
                switch (choice) {
                    case 'bandage': aff = 4; msg = '他接过去，愣了一下，咧嘴笑了：「……谢了。明天食堂给你留鸡腿。」'; break;
                    case 'hold': aff = 3; msg = '他又打了十几拳才停下来，看着扶桩的你喘着粗气笑：「行啊，这桩晃都不晃。」'; break;
                    case 'shout': aff = 2; msg = '「废不了！」他吼回来，但到底还是收了拳。'; break;
                }
                return { affection: aff, msg: msg };
            }
        },
        'warrior01_event_2': {
            id: 'warrior01_event_2', npcId: 'warrior_01',
            title: '庆功宴上的走神', icon: '🍶',
            desc: '所有人都敬他酒，他却盯着自己的右手看。',
            minAffection: 25,
            trigger: { random: 0.3 }, cooldown: 3,
            flag: 'warrior01_e2_done',
            autoTrigger: { timeRange: [17, 22], random: 0.3 },
            scenes: [
                { speaker: 'narrator', text: '山贼被剿了，军营摆庆功宴。敬铁山的酒一碗接一碗，他来者不拒，豪气干云。', type: 'description' },
                { speaker: 'narrator', text: '热闹散到一半，你看见他一个人坐在粮垛边上，摊开右手掌心，借着火把的光看了很久。那只手上没有伤。', type: 'description' },
                { speaker: 'player_select', text: '你如何做？', options: [
                    { text: '坐到他旁边，递过去一碗酒', effect: 'sit', affection: 3 },
                    { text: '「在看什么？手相我可不懂。」开个玩笑', effect: 'joke', affection: 4 },
                    { text: '不去打扰，远远陪他坐一会儿', effect: 'afar', affection: 2 }
                ]}
            ],
            effects: function (npc, choice) {
                var aff = 0, msg = '';
                switch (choice) {
                    case 'sit': aff = 3; msg = '他跟你碰了碗，一口干了，什么也没说。但那晚他没再看手掌。'; break;
                    case 'joke': aff = 4; msg = '他哈哈大笑，把手一合：「看个屁的手相——是在想当年要是这一拳再快半寸就好了。」笑声很响，落得很快。'; break;
                    case 'afar': aff = 2; msg = '后来他也看见了远处的你，抬手举了举碗。隔着一堆篝火，算是敬过了。'; break;
                }
                return { affection: aff, msg: msg };
            }
        },
        'warrior01_event_3': {
            id: 'warrior01_event_3', npcId: 'warrior_01',
            title: '断掉的枪杆', icon: '🗡️',
            desc: '他的帐子里供着两样东西：半截枪，一面碎镜。',
            minAffection: 35,
            trigger: { random: 0.3 }, cooldown: 0,
            flag: 'warrior01_e3_done',
            autoTrigger: { random: 0.3 },
            unlockSecret: 'warrior_secret_01',
            scenes: [
                { speaker: 'narrator', text: '他受伤养病，托你回帐取伤药。枕头底下压着一个黑布包——你本不想动，可布包开了，滚出来半截断枪的枪杆。', type: 'description' },
                { speaker: 'narrator', text: '断口平滑如镜，是被一击斩断的。枪杆上刻着一个「铁」字，笔迹稚嫩，像是很久以前少年人自己刻的。', type: 'description' },
                { speaker: 'npc', text: '……看到了就看吧。反正也不是什么见不得人的东西——就是丢人。', emotion: 'bitter' },
                { speaker: 'narrator', text: '他不知何时站在帐门口，胳膊上还缠着你去找的伤药。', type: 'description' },
                { speaker: 'npc', text: '八年前，雁回坡。一个人，一柄刀，三招。我的枪断了，人也躺了半个月。他没杀我，说「枪不错，人太躁」，然后就走了。', emotion: 'deep' },
                { speaker: 'narrator', text: '他攥了攥拳头：「八年了。我不知道他是谁，也不知道他为什么留我性命。我只知道——我这口气，咽不下。」', type: 'description' },
                { speaker: 'player_select', text: '你如何回应？', options: [
                    { text: '「咽不下就对了。这口气会让你变强。」', effect: 'fire', affection: 4 },
                    { text: '「他不杀你，或许是因为那一战他也记住了你。」', effect: 'honor', affection: 5 },
                    { text: '「总有一天你会找到他。到时候我帮你擂鼓。」', effect: 'drum', affection: 5 }
                ]}
            ],
            effects: function (npc, choice) {
                var aff = 0, msg = '', secretId = null;
                switch (choice) {
                    case 'fire': aff = 4; msg = '他重重哼了一声，眼睛却亮了：「对！老子这些年就没敢懈怠过一天！」'; break;
                    case 'honor': aff = 5; msg = '他愣住了。八年来所有人都在安慰他，你是第一个说他「被人记住」的。「……你这张嘴，挺会说。」'; break;
                    case 'drum': aff = 5; msg = '「擂鼓就算了，吵。」他嘴上嫌弃，拳头却朝你胸口轻轻捶了一下——那是他认可一个人的礼数。'; break;
                }
                secretId = 'warrior_secret_01';
                return { affection: aff, msg: msg, secretId: secretId };
            }
        },
        'warrior01_event_4': {
            id: 'warrior01_event_4', npcId: 'warrior_01',
            title: '雁回坡的战书', icon: '⚔️',
            desc: '八年前那个人，托人送来了一封信。',
            minAffection: 45,
            trigger: { random: 0.3 }, cooldown: 0,
            flag: 'warrior01_e4_done',
            autoTrigger: { random: 0.3 },
            scenes: [
                { speaker: 'narrator', text: '信是猎户送进山的：一页白纸，只有一行字——「雁回坡，十月十五，枪可曾修好？」没有落款。', type: 'description' },
                { speaker: 'narrator', text: '铁山捏着那张纸，手背上青筋隆起。他等这句话等了八年，可真等到手里，反而半天没吭声。', type: 'description' },
                { speaker: 'npc', text: '……我这几年练的全是正面硬功。他要是还用那招斜劈断枪，我一点办法都没有。', emotion: 'serious' },
                { speaker: 'narrator', text: '营房外演武场的灯火通明。他忽然转头看你，眼神像一头困了八年的兽。', type: 'description' },
                { speaker: 'player_select', text: '此抉择无法回头——你如何答？', options: [
                    { text: '「我陪你一起去。你斗枪，我盯他的刀。」', effect: 'together' },
                    { text: '「先用这三个月，把他那一招拆干净再去。」', effect: 'train' },
                    { text: '「这是你们两个人的约定，谁也别帮。去，堂堂正正打一场。」', effect: 'alone' }
                ]}
            ],
            effects: function (npc, choice) {
                if (typeof window.recordStorylineChoice === 'function') window.recordStorylineChoice('warrior_01', choice);
                var aff = 0, msg = '';
                switch (choice) {
                    case 'together': aff = 4; msg = '他咧嘴一笑，牙关咬得咯咯响：「好兄弟！有你在后面，老子前面就没人能站得住！」'; break;
                    case 'train': aff = 5; msg = '他盯着你看了半天，缓缓点头：「……八年都等了，不差这三个月。你说得对。」'; break;
                    case 'alone': aff = 5; msg = '他沉默了很久，忽然笑了，笑得畅快：「对！这一架从头到尾都是我和他的事。——谢了，你懂我。」'; break;
                }
                return { affection: aff, msg: msg };
            }
        },
        'warrior01_event_5': {
            id: 'warrior01_event_5', npcId: 'warrior_01',
            title: '终章·雁回坡上', icon: '🏔️',
            desc: '十月十五，雁回坡。',
            minAffection: 55,
            trigger: { random: 0.3 }, cooldown: 0,
            flag: 'warrior01_e5_done',
            // 终章仅手动触发：无 autoTrigger
            _dynamicScenes: function () {
                var c = (typeof window.getStorylineChoice === 'function') ? window.getStorylineChoice('warrior_01') : null;
                if (c === 'together' || c === 'train') {
                    return [
                        { speaker: 'narrator', text: '雁回坡的风很大。（' + (c === 'together' ? '你站在坡下，按约定盯着那柄刀。' : '三个月拆招苦练，你陪他把每一寸破绽都磨了一遍。') + '）', type: 'description' },
                        { speaker: 'narrator', text: '枪与刀撞在一起的那一刻，整面山坡都静了。三十招，五十招——第八十一招上，铁山的枪尖停在对方咽喉前一寸，稳稳的，不进不退。', type: 'description' },
                        { speaker: 'narrator', text: '那人低头看着枪尖，忽然笑了：「八年前我说枪不错，人太躁。」', type: 'description' },
                        { speaker: 'npc', text: '现在呢？！', emotion: 'determined' },
                        { speaker: 'narrator', text: '「现在——」那人转身收刀，「枪也不错，人也不躁了。这一场，是你赢了。」', type: 'description' },
                        { speaker: 'narrator', text: '下山路上，铁山一路没说话。快到山门时，他忽然把断了八年的旧枪杆掏出来，扔进了山涧。', type: 'description' },
                        { speaker: 'player_select', text: '你如何回应？', options: [
                            { text: '「扔得好。往后你的枪，只会往前走。」', effect: 'forward', affection: 7 },
                            { text: '「今晚的酒我请。不醉不归！」', effect: 'wine', affection: 6 }
                        ]}
                    ];
                }
                // alone（默认分支）
                return [
                    { speaker: 'narrator', text: '他没让你跟。你只在山脚下等到日头偏西——然后看见他一步一步走下来。', type: 'description' },
                    { speaker: 'narrator', text: '左臂吊着，嘴角带血，走路一瘸一拐。可他腰杆挺得笔直，怀里抱着那半截旧枪杆，像抱着一件凯旋的兵器。', type: 'description' },
                    { speaker: 'npc', text: '……输了。第八十九招，枪又被断了。', emotion: 'neutral' },
                    { speaker: 'narrator', text: '他说完这句，忽然咧开满口血的嘴笑了。', type: 'description' },
                    { speaker: 'npc', text: '但他娘的，这回我接住了他那招！八十九招！老子比八年前多活了八十招！——哈哈哈哈！', emotion: 'happy' },
                    { speaker: 'player_select', text: '你如何回应？', options: [
                        { text: '「下一场，就是第九十招的事。我等着看。」', effect: 'next', affection: 7 },
                        { text: '「先去医院！灵素看见你这副样子会骂死你！」', effect: 'clinic', affection: 6 }
                    ]}
                ];
            },
            scenes: [],
            effects: function (npc, choice) {
                var aff = 0, msg = '';
                switch (choice) {
                    case 'forward': aff = 7; msg = '「哈！」他大笑着追上山风，背影亮堂得晃眼。'; break;
                    case 'wine': aff = 6; msg = '「这可是你说的！」当晚军营的酒坛子空了七个。'; break;
                    case 'next': aff = 7; msg = '「一言为定！」他把断枪往肩上一扛，走得更起劲了。'; break;
                    case 'clinic': aff = 6; msg = '提到灵素，他缩了缩脖子，脚步果然加快了三分。'; break;
                }
                return { affection: aff, msg: msg };
            }
        }
    };

    // ============ 注册到全局事件池 ============
    Object.keys(MENTOR_EVENTS).forEach(function (k) { NPC_PERSONAL_EVENTS[k] = MENTOR_EVENTS[k]; });
    Object.keys(HEALER_EVENTS).forEach(function (k) { NPC_PERSONAL_EVENTS[k] = HEALER_EVENTS[k]; });
    Object.keys(WARRIOR_EVENTS).forEach(function (k) { NPC_PERSONAL_EVENTS[k] = WARRIOR_EVENTS[k]; });

    // ============ 终章动态 scenes 支持：包装 triggerPersonalEvent ============
    var _origTriggerPE = (typeof window.triggerPersonalEvent === 'function') ? window.triggerPersonalEvent : null;
    window.triggerPersonalEvent = function (eventId) {
        var def = NPC_PERSONAL_EVENTS[eventId];
        if (def && typeof def._dynamicScenes === 'function') {
            def.scenes = def._dynamicScenes();
        }
        if (_origTriggerPE) return _origTriggerPE(eventId);
        return null;
    };

    // ============ 秘密注入（幂等）：special-npcs.js 数据 → NPC 实例 ============
    var STORYLINE_SECRET_MAP = {
        mentor_01: ['mentor_secret_01'],
        healer_01: ['healer_secret_01'],
        warrior_01: ['warrior_secret_01']
    };

    function injectStorylineSecrets() {
        if (!window.npcManager || typeof window.npcManager.getNPC !== 'function') return;
        var data = window.SPECIAL_NPC_DATA || {};
        Object.keys(STORYLINE_SECRET_MAP).forEach(function (npcId) {
            var npc = window.npcManager.getNPC(npcId);
            if (!npc) return;
            if (npc.secrets && npc.secrets[STORYLINE_SECRET_MAP[npcId][0]]) return; // 已注入
            var src = data[npcId] && data[npcId].secrets;
            if (!src) return;
            npc.secrets = npc.secrets || {};
            Object.keys(src).forEach(function (sk) {
                npc.secrets[sk] = JSON.parse(JSON.stringify(src[sk]));
            });
        });
    }

    // 打开个人事件面板前注入（幂等，覆盖存档恢复/延迟建NPC等情况）
    var _origGetPEB = (typeof window.getPersonalEventButtons === 'function') ? window.getPersonalEventButtons : null;
    window.getPersonalEventButtons = function (npc, npcId) {
        try { injectStorylineSecrets(); } catch (e) {}
        return _origGetPEB ? _origGetPEB(npc, npcId) : '';
    };

    // ============ 自动触发挂钩 ============
    var V2_NPC_IDS = ['mentor_01', 'healer_01', 'warrior_01'];
    var V2_FINAL_EVENTS = { mentor_01: 'mentor01_event_5', healer_01: 'healer01_event_5', warrior_01: 'warrior01_event_5' };

    // greet 源：包装 getGreeting（npc-system.js 全局函数）
    var _origGetGreeting = (typeof window.getGreeting === 'function') ? window.getGreeting : null;
    window.getGreeting = function (npc, player) {
        try {
            if (npc && V2_NPC_IDS.indexOf(npc.id) >= 0 && typeof window.maybeAutoTriggerPersonalEvent === 'function') {
                window.maybeAutoTriggerPersonalEvent(npc.id, 'greet', { finalEvents: [V2_FINAL_EVENTS[npc.id]] });
            }
        } catch (e) {}
        return _origGetGreeting ? _origGetGreeting(npc, player) : '你好。';
    };

    // daily 源：新的一天开始时兜底（玩家与NPC同城时）
    if (typeof window.timeSystem !== 'undefined' && window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') {
        window.timeSystem.onNewDaySubscribe(function () {
            try {
                if (!window.currentCharData || !window.npcManager) return;
                var loc = window.currentCharData.location || ''; // P0-2规范字段（v13.5审查修正：currentLocation从未被赋值）
                V2_NPC_IDS.forEach(function (nid) {
                    var npc = window.npcManager.getNPC(nid);
                    if (npc && npc.location === loc) {
                        window.maybeAutoTriggerPersonalEvent(nid, 'daily', { finalEvents: [V2_FINAL_EVENTS[nid]] });
                    }
                });
            } catch (e) { console.warn('[故事线v2] 每日自动触发失败:', e); }
        });
    }

    console.log('📖 故事线v2·第一批已加载：清虚道人 / 灵素 / 铁山（各5段，共15事件）');
})();
