/**
 * storylines-v2/batch2.js — NPC故事线重写·第二批（v13.4）
 *
 * 收录：贾有道(merchant_01) / 丹大师(alchemist_01)
 * 格式与 batch1 完全一致（五段线：相遇→交集→秘密→抉择→终章）：
 *   - 第1~4段 autoTrigger random（第1段0.4、2~4段0.3）；终章仅手动触发
 *   - 第3段解锁秘密（effects 返回 secretId；秘密底子在 special-npcs.js）
 *   - 第4段不可回头抉择记录到 xianxia_storyline_choices（复用 batch1 全局）
 *   - 终章 _dynamicScenes 按第4段选择双分支收尾
 *     （triggerPersonalEvent 的 _dynamicScenes 支持由 batch1 的全局包装提供，
 *       对所有 NPC_PERSONAL_EVENTS 事件生效，此处无需重复包装）
 * 自动触发挂钩：再包一层 getGreeting（幂等链式），并追加每日兜底订阅。
 */
(function () {
    'use strict';

    // ============ 抉择读写（batch1 已暴露全局；缺失时本地兜底实现） ============
    var LS_KEY = 'xianxia_storyline_choices';
    function getChoiceFn() {
        if (typeof window.getStorylineChoice === 'function') return window.getStorylineChoice;
        return function (npcId) {
            try {
                var all = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
                return all[npcId] || null;
            } catch (e) { return null; }
        };
    }
    function recordChoiceFn() {
        if (typeof window.recordStorylineChoice === 'function') return window.recordStorylineChoice;
        return function (npcId, choice) {
            var all = {};
            try { all = JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch (e) {}
            all[npcId] = choice;
            try { localStorage.setItem(LS_KEY, JSON.stringify(all)); } catch (e) {}
        };
    }

    // ============ 贾有道（merchant_01）============
    // 秘密底子（special-npcs.js）：暗中从事禁品交易——背后是为被掳之子付的赎金
    var MERCHANT_EVENTS = {
        'merchant01_event_1': {
            id: 'merchant01_event_1', npcId: 'merchant_01',
            title: '摊角的长命锁', icon: '🔒',
            desc: '收摊时你替他搬货，一只木匣翻倒，滚出一枚旧长命锁。',
            minAffection: 15,
            trigger: { random: 0.4 }, cooldown: 3,
            flag: 'merchant01_e1_done',
            autoTrigger: { timeRange: [17, 21], random: 0.4 },
            scenes: [
                { speaker: 'narrator', text: '坊市收摊，你搭手帮贾有道搬货。摊角的木匣没扣紧，翻倒时滚出一枚银长命锁——样式很旧，錾的「平安」二字被摩挲得发亮。', type: 'description' },
                { speaker: 'narrator', text: '一贯笑脸迎人的贾掌柜，几乎是劈手把锁夺了回去。反应过来失态，他才又堆起笑：「小玩意儿，不值钱的。」', type: 'description' },
                { speaker: 'player_select', text: '你如何做？', options: [
                    { text: '当没看见，继续搬货', effect: 'ignore', affection: 1 },
                    { text: '「这锁的錾工是老手法，现在少见了。」搭句话给他台阶', effect: 'craft', affection: 3 },
                    { text: '轻声问一句：「是令郎的？」', effect: 'ask', affection: 4 }
                ]}
            ],
            effects: function (npc, choice) {
                var aff = 0, msg = '';
                switch (choice) {
                    case 'ignore': aff = 1; msg = '他把匣子收进货架最里层，那天的生意照常做完。只是收摊时，他朝你拱了拱手，比平日深了一些。'; break;
                    case 'craft': aff = 3; msg = '他顺着话头接了：「青云观的老錾工，十几年前的手艺喽。」话是闲话，肩膀却松了下来。'; break;
                    case 'ask': aff = 4; msg = '他的笑僵了一瞬，末了低声道：「是啊。」——两个字，像从很深的地方捞上来的。'; break;
                }
                return { affection: aff, msg: msg };
            }
        },
        'merchant01_event_2': {
            id: 'merchant01_event_2', npcId: 'merchant_01',
            title: '后巷的醉话', icon: '🍶',
            desc: '旅馆后巷，他抱着酒坛在数日子。',
            minAffection: 25,
            trigger: { random: 0.3 }, cooldown: 3,
            flag: 'merchant01_e2_done',
            autoTrigger: { timeRange: [19, 24], random: 0.3 },
            scenes: [
                { speaker: 'narrator', text: '亥时的旅馆后巷，你听见有人在絮絮说话。绕过去一看——贾有道坐在台阶上，怀里抱着个空酒坛，指头蘸着酒在膝盖上写写画画。', type: 'description' },
                { speaker: 'npc', text: '腊月初七……去年是腊月初七到的，前年也是。……今年该到信了吧？该到了吧。', emotion: 'drunk' },
                { speaker: 'narrator', text: '他数到一半抬起头看见你，愣了愣，居然没遮掩，只是摆摆手让你坐。', type: 'description' },
                { speaker: 'player_select', text: '你如何做？', options: [
                    { text: '递过去一壶清水：「酒伤本钱，贾掌柜的算盘向来精。」', effect: 'water', affection: 4 },
                    { text: '什么都不说，陪他坐到月亮偏西', effect: 'sit', affection: 3 },
                    { text: '「等谁的信？我认识京城里送信的，帮你催催。」', effect: 'offer', affection: 2 }
                ]}
            ],
            effects: function (npc, choice) {
                var aff = 0, msg = '';
                switch (choice) {
                    case 'water': aff = 4; msg = '他接过来喝了大半壶，笑了：「你这人，账算到我头上来了。」那晚他再没碰酒。'; break;
                    case 'sit': aff = 3; msg = '两个人谁都没说话。临了他拍拍你的肩：「坐这一会儿，比你买我十回货都强。」'; break;
                    case 'offer': aff = 2; msg = '「催不得。」他说得很轻，「有些信，只能等它自己来。」'; break;
                }
                return { affection: aff, msg: msg };
            }
        },
        'merchant01_event_3': {
            id: 'merchant01_event_3', npcId: 'merchant_01',
            title: '夹层的信', icon: '✉️',
            desc: '你替他送新账本上门，旧账本的夹层里滑出了一沓信。',
            minAffection: 35,
            trigger: { random: 0.3 }, cooldown: 0,
            flag: 'merchant01_e3_done',
            autoTrigger: { random: 0.3 },
            unlockSecret: 'merchant_secret_01',
            scenes: [
                { speaker: 'narrator', text: '新账本送到他住处，他去倒茶，你顺手把旧账摞齐——夹层里滑出一沓信纸，散了满桌。', type: 'description' },
                { speaker: 'narrator', text: '每一封都极短，字迹稚嫩却工整：「父安。勿寻。」落款只有一个「安」字。最早的一封，纸都黄脆了——十二年前。', type: 'description' },
                { speaker: 'narrator', text: '贾有道端着茶站在门口，没有夺，也没有吼。他把茶放下，坐下来，一封一封按日期把信理齐，才开口。', type: 'description' },
                { speaker: 'npc', text: '犬子贾平安，十二年前上元灯会被人从我的货轿里抱走的。幽阑教的手法。——他们每年捎一封信来，我就每年给他们备一批「货」。', emotion: 'bitter' },
                { speaker: 'npc', text: '禁品生意人人喊打。骂名的钱，我拿去换这沓信了。你说，这笔账我是赚还是赔？', emotion: 'deep' },
                { speaker: 'player_select', text: '你如何回应？', options: [
                    { text: '「十二年……这么大的事，你一个人扛到现在。」', effect: 'shoulder', affection: 5 },
                    { text: '「禁品害过的人是真，孩子没错也是真。两笔账分开算。」', effect: 'fair', affection: 4 },
                    { text: '「把平安带回来——剩下的账，我帮你一起了。」', effect: 'pledge', affection: 6 }
                ]}
            ],
            effects: function (npc, choice) {
                var aff = 0, msg = '', secretId = null;
                switch (choice) {
                    case 'shoulder': aff = 5; msg = '他低头摆弄那些信，摆了很久，说：「商人嘛，最会算的就是哪些话不能对人讲。」'; break;
                    case 'fair': aff = 4; msg = '他抬起眼看了你一下，像是头一回被人这样算账。「分开算……你这话，我想了十二年没敢想。」'; break;
                    case 'pledge': aff = 6; msg = '他背过身去倒了半天才把茶倒满，声音哑的：「这话，出了这个门就当我没听过——但我记下了。」'; break;
                }
                secretId = 'merchant_secret_01';
                return { affection: aff, msg: msg, secretId: secretId };
            }
        },
        'merchant01_event_4': {
            id: 'merchant01_event_4', npcId: 'merchant_01',
            title: '撞在一夜的两条路', icon: '⚖️',
            desc: '儿子的下落有了眉目——官府的海捕文书也到了。',
            minAffection: 45,
            trigger: { random: 0.3 }, cooldown: 0,
            flag: 'merchant01_e4_done',
            autoTrigger: { random: 0.3 },
            scenes: [
                { speaker: 'narrator', text: '线人递来两个消息，前后脚到的。头一个：幽阑教内乱，掳走平安的那个香主失了势，孩子如今被扣在南边的分舵里。', type: 'description' },
                { speaker: 'narrator', text: '第二个：官府海捕文书连夜张贴，将彻查长安禁品渠道——第一批名单上，就有贾有道的字号。', type: 'description' },
                { speaker: 'npc', text: '查到我铺子的那天，就是我断信的日子。他们一旦拿了人证物证，幽阑教立刻就会撕票灭迹——这些年不是没死过票。', emotion: 'serious' },
                { speaker: 'narrator', text: '他把那枚长命锁放在桌上，推到你面前。这是他头一回把它交到别人手里。', type: 'description' },
                { speaker: 'player_select', text: '此抉择无法回头——你如何答？', options: [
                    { text: '「烧了账簿，我陪你南下寻子。官府那边，天塌下来我顶着。」', effect: 'find' },
                    { text: '「自首。用十年暗账换官府出兵——能救儿子的力量，比你我大。」', effect: 'confess' },
                    { text: '「我做你的白手套：明面配合官府拖住抄查，暗地先雇人去南边探路。」', effect: 'glove' }
                ]}
            ],
            effects: function (npc, choice) {
                recordChoiceFn()('merchant_01', choice);
                var aff = 0, msg = '';
                switch (choice) {
                    case 'find': aff = 4; msg = '他盯着你看了一会儿，忽然笑了，笑着笑着眼圈红了：「好。十二年了，总算有人跟我说『儿子要紧』这三个字。」'; break;
                    case 'confess': aff = 5; msg = '他沉默了很久很久，把长命锁收回怀里贴身放好：「……你这法子最脏，也最干净。容我今夜给祖宗上一炷香。」'; break;
                    case 'glove': aff = 4; msg = '「白手套——」他咀嚼着这个词，精明的光一点点回到眼里，「这买卖险。可险，才有活路。我信你一回。」'; break;
                }
                return { affection: aff, msg: msg };
            }
        },
        'merchant01_event_5': {
            id: 'merchant01_event_5', npcId: 'merchant_01',
            title: '终章·重开的摊位', icon: '🏮',
            desc: '风波过后，坊市东角的老摊位重新支了起来。',
            minAffection: 55,
            trigger: { random: 0.3 }, cooldown: 0,
            flag: 'merchant01_e5_done',
            // 终章仅手动触发：无 autoTrigger
            _dynamicScenes: function () {
                var c = getChoiceFn()('merchant_01');
                if (c === 'find') {
                    return [
                        { speaker: 'narrator', text: '南疆之行两个月。回来的那天，贾有道在你面前坐下，从怀里掏出一封新的信和一张镖局回执，并排摆在桌上。', type: 'description' },
                        { speaker: 'npc', text: '人找到了。在山寨后院喂蛊虫——他不记得我了。我喊他的名字，他躲在门后看我，像看一个生客。', emotion: 'bitter' },
                        { speaker: 'npc', text: '我没逼他。把长命锁从门缝塞进去，人就走了。现在每个月托镖局捎一包糖霜桃片——他小时候最馋这个。', emotion: 'warm' },
                        { speaker: 'player_select', text: '你如何回应？', options: [
                            { text: '「他今天吃你的糖，明天就会想起你的脸。慢慢来。」', effect: 'slow', affection: 7 },
                            { text: '「十二年的账，两年还不完。您已经还得很快了。」', effect: 'fast', affection: 6 }
                        ]}
                    ];
                }
                if (c === 'confess') {
                    return [
                        { speaker: 'narrator', text: '自首换了个戴罪立功的名目，服劳役半年。出狱那天是个大晴天，你提前一个时辰就候在了衙门口。', type: 'description' },
                        { speaker: 'narrator', text: '他瘦了一圈，背却挺得笔直。狱卒递还随身之物——就一枚长命锁，被他攥得温热。', type: 'description' },
                        { speaker: 'npc', text: '官府按暗账端了三个分舵。平安所在的那一处扑了个空——人被提前转移了。', emotion: 'neutral' },
                        { speaker: 'narrator', text: '他顿了顿，从袖中抖开今年的信。信只有六个字，末尾却多了一句从前没有的话。', type: 'description' },
                        { speaker: 'npc', text: '「父安。勿寻。——爹，我梦见长命锁了。」', emotion: 'moved' },
                        { speaker: 'player_select', text: '你如何回应？', options: [
                            { text: '「记起来了，就是快找到了。走吧，先回家吃口热的。」', effect: 'home', affection: 7 },
                            { text: '「这半年，值了。」', effect: 'worth', affection: 6 }
                        ]}
                    ];
                }
                // glove（默认分支）
                return [
                    { speaker: 'narrator', text: '两头周旋的那一个月，贾有道白了半个头顶。官府那边他以「配合调查」纳罚结案，南边的探子也带回了关押图。', type: 'description' },
                    { speaker: 'narrator', text: '来年开春，他自己都没等到安排——平安背着个小包袱，凭着记忆里的长命锁，一路讨饭摸回了长安，站在坊市口喊了一声爹。', type: 'description' },
                    { speaker: 'npc', text: '……哎！——哎！爹在这儿！', emotion: 'moved' },
                    { speaker: 'narrator', text: '如今坊市东角的老摊位重新支起来了，招牌换了新的，摊子比从前小了一半，多了一个跑堂喊价的小伙计，嗓门很亮。', type: 'description' },
                    { speaker: 'player_select', text: '你如何回应？', options: [
                        { text: '「摊子小了，秤准了。这买卖划算。」', effect: 'scale', affection: 7 },
                        { text: '冲小伙计招招手：「来，给叔也报个价。」', effect: 'play', affection: 6 }
                    ]}
                ];
            },
            scenes: [],
            effects: function (npc, choice) {
                var aff = 0, msg = '';
                switch (choice) {
                    case 'slow': aff = 7; msg = '「哎。」他把信折好贴身收着，「慢慢来。我现在别的没有，就是不缺耐心了。」'; break;
                    case 'fast': aff = 6; msg = '「哈哈——」他抹了把脸，「跟你做生意这两年，是我这辈子学得最快的。」'; break;
                    case 'home': aff = 7; msg = '「好！」他把信揣进怀里最贴身的地方，「走，今天这顿，我请——你可劲儿点。」'; break;
                    case 'worth': aff = 6; msg = '他把长命锁举起来对着日头看了看，锁身亮得晃眼。「值。」'; break;
                    case 'scale': aff = 7; msg = '「准头比大小金贵——这话我要是三十年前就懂，能少走多少弯路哟。」他笑着，眼角的皱纹挤成一朵花。'; break;
                    case 'play': aff = 6; msg = '小伙计脆生生报了个价，贾有道在后头嚷嚷：「别听他的，叔是自己人，成本价！」——那是你头一回听见他把「成本价」三个字说得这么大方。'; break;
                }
                return { affection: aff, msg: msg };
            }
        }
    };

    // ============ 丹大师（alchemist_01）============
    // 秘密底子（special-npcs.js）：曾炼丹失败炸毁过一个山洞——里面埋着他的师弟
    var ALCHEMIST_EVENTS = {
        'alchemist01_event_1': {
            id: 'alchemist01_event_1', npcId: 'alchemist_01',
            title: '文火的执念', icon: '🔥',
            desc: '一炉最普通的活血丹，他偏要用文火煨上三天。',
            minAffection: 15,
            trigger: { random: 0.4 }, cooldown: 3,
            flag: 'alchemist01_e1_done',
            autoTrigger: { timeRange: [6, 12], random: 0.4 },
            scenes: [
                { speaker: 'narrator', text: '清晨的炼丹房，丹大师守着一炉最寻常的活血丹。旁人武火两个时辰出炉的活儿，他用文火，煨了整整两天还没起鼎。', type: 'description' },
                { speaker: 'narrator', text: '你进门时，他正往炉膛里添第三根细炭——动作轻得像怕惊醒什么。', type: 'description' },
                { speaker: 'player_select', text: '你如何做？', options: [
                    { text: '蹲下来帮他看火，什么也不问', effect: 'watch', affection: 3 },
                    { text: '「师父，这文火的诀窍，能教教我吗？」', effect: 'learn', affection: 4 },
                    { text: '「这样太费炭了，不划算吧？」', effect: 'cost', affection: 1 }
                ]}
            ],
            effects: function (npc, choice) {
                var aff = 0, msg = '';
                switch (choice) {
                    case 'watch': aff = 3; msg = '他瞥了你一眼，往旁边挪了挪，给你腾出半张蒲团。火光把两个人的影子投在墙上，安安静静。'; break;
                    case 'learn': aff = 4; msg = '「文火的诀窍？」他难得地笑了，「就一条——急不得。你记住这条，比什么都强。」'; break;
                    case 'cost': aff = 1; msg = '「炭钱我出。」他淡淡地说，往炉里又添了一根细炭。'; break;
                }
                return { affection: aff, msg: msg };
            }
        },
        'alchemist01_event_2': {
            id: 'alchemist01_event_2', npcId: 'alchemist_01',
            title: '炉盖上的圆', icon: '🌙',
            desc: '谷里都说丹大师越老越胆小。深夜的炼丹房里，你看见了另一回事。',
            minAffection: 25,
            trigger: { random: 0.3 }, cooldown: 3,
            flag: 'alchemist01_e2_done',
            autoTrigger: { timeRange: [20, 24], random: 0.3 },
            scenes: [
                { speaker: 'narrator', text: '药王谷的年轻弟子私下议论：丹大师的手越来越慢，一炉护心丹守足六个时辰寸步不离，跟新手似的。', type: 'description' },
                { speaker: 'narrator', text: '深夜你路过炼丹房，门缝里透着火光。他没有在炼丹——丹炉是冷的。他就坐在炉前，借着烛火，用手指在炉盖上一遍一遍描着一个圆圆的轮廓。', type: 'description' },
                { speaker: 'narrator', text: '那个圆，像一朵开到最盛的丹火。', type: 'description' },
                { speaker: 'player_select', text: '你如何做？', options: [
                    { text: '推门进去，给他披一件外袍', effect: 'cloak', affection: 4 },
                    { text: '轻轻退开，明早照常来问安', effect: 'leave', affection: 2 },
                    { text: '隔着门缝轻声问：「师父，在想什么？」', effect: 'ask', affection: 3 }
                ]}
            ],
            effects: function (npc, choice) {
                var aff = 0, msg = '';
                switch (choice) {
                    case 'cloak': aff = 4; msg = '他怔了怔，任你把袍子披上，忽然说：「我师弟以前也总这样——半夜给我送外套，嫌我守炉不要命。」说完他自己愣住了，像是很多年没提过这两个字。'; break;
                    case 'leave': aff = 2; msg = '次日清晨他精神如常，只是案上多了一包润喉的蜜枣——大约是谢你昨夜嘴严。'; break;
                    case 'ask': aff = 3; msg = '炉盖上的手指停了停。「在想一个火候。」他说，「一个我再也没开过的火候。」'; break;
                }
                return { affection: aff, msg: msg };
            }
        },
        'alchemist01_event_3': {
            id: 'alchemist01_event_3', npcId: 'alchemist_01',
            title: '烧熔的护心镜', icon: '🪞',
            desc: '北坡清理旧洞窟，你捡回来半块烧熔的护心镜。',
            minAffection: 35,
            trigger: { random: 0.3 }, cooldown: 0,
            flag: 'alchemist01_e3_done',
            autoTrigger: { random: 0.3 },
            unlockSecret: 'alchemist_secret_01',
            scenes: [
                { speaker: 'narrator', text: '北坡清淤，你在塌方乱石的深处捡到半块护心镜——边缘烧熔变形，背面刻着一个「合」字。谷里的老人说，那是三十年前封掉的旧丹房。', type: 'description' },
                { speaker: 'narrator', text: '你把它交给丹大师。他捏着那半块镜子，捏了很久很久，久到你以为他不会再开口了。', type: 'description' },
                { speaker: 'npc', text: '三十年前，师父中了丹毒，命悬一线。我和师弟师兄弟俩合炉炼续命丹——九转的丹，武火催到第七转，火不够旺。我私自加了三成。', emotion: 'heavy' },
                { speaker: 'narrator', text: '他的声音很平，平得像在念别人的丹方。', type: 'description' },
                { speaker: 'npc', text: '丹鼎炸的时候，师弟把我推进了安全死角。塌下来的横梁，替我挡了。……师父最后也没等来那炉丹。', emotion: 'deep' },
                { speaker: 'npc', text: '打那以后，我只敢用文火。人皆笑我胆小——他们不知道，我这双手，是被我师弟用命换回来的。', emotion: 'bitter' },
                { speaker: 'player_select', text: '你如何回应？', options: [
                    { text: '「错的是那三成火，不是你这双手。」', effect: 'hands', affection: 5 },
                    { text: '「师弟推你那一把，是要你活下去，不是要你罚自己三十年。」', effect: 'live', affection: 6 },
                    { text: '「师弟……叫什么名字？」', effect: 'name', affection: 4 }
                ]}
            ],
            effects: function (npc, choice) {
                var aff = 0, msg = '', secretId = null;
                switch (choice) {
                    case 'hands': aff = 5; msg = '他摊开自己的双手看了看——指节粗大，满是经年的烫痕。「这双手炼了三十年的文火丹，也算……对得起它了吧。」'; break;
                    case 'live': aff = 6; msg = '他猛地抬头看你，喉咙动了动，半天只说出一句：「……这话，我得慢慢学着信。」'; break;
                    case 'name': aff = 4; msg = '「陈合。」他指腹擦过镜背上那个「合」字，「合炉的合。我师弟一辈子就想跟我合炉炼成九转金丹。」'; break;
                }
                secretId = 'alchemist_secret_01';
                return { affection: aff, msg: msg, secretId: secretId };
            }
        },
        'alchemist01_event_4': {
            id: 'alchemist01_event_4', npcId: 'alchemist_01',
            title: '火候到了', icon: '⛰️',
            desc: '长老会要在旧丹房原址起丹楼。动土前夜，他来找你。',
            minAffection: 45,
            trigger: { random: 0.3 }, cooldown: 0,
            flag: 'alchemist01_e4_done',
            autoTrigger: { random: 0.3 },
            scenes: [
                { speaker: 'narrator', text: '长老会议定：北坡旧丹房原址清淤建楼，三日后动土。当天夜里，丹大师提着一盏灯来找你，眼底两团青黑。', type: 'description' },
                { speaker: 'npc', text: '连着两夜，我都梦见师弟站在火里，一句话不说，只做了个口型——四个字：「火候到了」。', emotion: 'haunted' },
                { speaker: 'npc', text: '旧丹房的丹案底下，压着我们俩合注的丹方残卷——九转金丹的前半卷。还有……他的遗骨。三十年了，我不能让他再压在瓦砾底下。', emotion: 'deep' },
                { speaker: 'narrator', text: '他攥紧了灯提梁，指节发白：「可洞里的支撑早就朽了，二次塌方说来就来。要进去，就得真气护体、速进速出——我这个年纪，只赌得起一次。」', type: 'description' },
                { speaker: 'player_select', text: '此抉择无法回头——你如何答？', options: [
                    { text: '「我陪你进去。你只管找东西，塌方我来扛。」', effect: 'rush' },
                    { text: '「先请温蘅谷主派人加固支撑，稳妥之后再进——晚几天，不算晚。」', effect: 'safe' },
                    { text: '「别进去了。你口述，把那卷丹方默出来，让徒弟们替你们把这炉丹炼完。」', effect: 'disciples' }
                ]}
            ],
            effects: function (npc, choice) {
                recordChoiceFn()('alchemist_01', choice);
                var aff = 0, msg = '';
                switch (choice) {
                    case 'rush': aff = 5; msg = '他深深看了你一眼，朝你郑重一揖到底：「三十年了，头一回有人愿意陪我进那个洞。……好，天亮就走。」'; break;
                    case 'safe': aff = 4; msg = '「晚几天不算晚……」他喃喃重复了一遍，紧绷的肩背慢慢松了下来，「也对。我这急脾气改了三十年，最后一程，不该再急这一次。」'; break;
                    case 'disciples': aff = 4; msg = '他怔了很久，忽然笑了，笑得眼泪都出来了：「好啊——好啊！让徒弟们炼。他要是泉下有知，肯定乐意带几个徒孙。」'; break;
                }
                return { affection: aff, msg: msg };
            }
        },
        'alchemist01_event_5': {
            id: 'alchemist01_event_5', npcId: 'alchemist_01',
            title: '终章·第一炉武火', icon: '🎆',
            desc: '新丹楼落成那日，药王谷来了很多人。',
            minAffection: 55,
            trigger: { random: 0.3 }, cooldown: 0,
            flag: 'alchemist01_e5_done',
            // 终章仅手动触发：无 autoTrigger
            _dynamicScenes: function () {
                var c = getChoiceFn()('alchemist_01');
                if (c === 'rush') {
                    return [
                        { speaker: 'narrator', text: '你们进去了一炷香。遗骨请了出来，残卷也从丹案的暗格里取到了——退出洞的那一刻，身后轰然二次塌方，一块碎石砸在你肩上。他死死拽着你跑完了最后十步。', type: 'description' },
                        { speaker: 'narrator', text: '三日后，师弟葬在了后山的丹炉旁，碑上刻「陈合之墓」——弟子的名字，立在兄长的位置旁边。两半丹方合成完整的一卷，摊在新丹楼的案上。', type: 'description' },
                        { speaker: 'narrator', text: '落成那日，众人散尽后，丹大师站上了主炉位。武火，猛火，三十年来头一炉。', type: 'description' },
                        { speaker: 'narrator', text: '第九转丹成的刹那，鼎盖一声轻响，药香冲天。他回头看你，满脸是泪，满脸是笑：「成了——师弟，火候到了！」', type: 'description' },
                        { speaker: 'player_select', text: '你如何回应？', options: [
                            { text: '「这一转，是他陪您一起开的炉。」', effect: 'together', affection: 8 },
                            { text: '「九转金丹的第一转。往后还有八转，我陪您慢慢炼。」', effect: 'eight', affection: 7 }
                        ]}
                    ];
                }
                if (c === 'safe') {
                    return [
                        { speaker: 'narrator', text: '温蘅亲自带了三名筑基弟子，支撑加固了整三日，人才进去。遗骨与残卷，完好取出。', type: 'description' },
                        { speaker: 'narrator', text: '安葬那日，他在坟前跪了很久。回来后整理残卷，忽然整个人僵在了案前——卷尾有几行小字，墨色比正文新。', type: 'description' },
                        { speaker: 'npc', text: '是师弟的字。他早就补全了后半卷的批注……最后写着：「师兄性急，见此卷时，吾想必已不在。九转之路远，替我看完。」', type: 'description' },
                        { speaker: 'narrator', text: '他捧着残卷坐了一夜。第二天清晨，你看见他把那行字一遍一遍誊在新丹楼的楹柱内侧，笔笔端正。', type: 'description' },
                        { speaker: 'player_select', text: '你如何回应？', options: [
                            { text: '「他没怪你，还把后半程托给了你。那就一转一转，好好炼完。」', effect: 'finish', affection: 7 },
                            { text: '什么也不说，替他研墨', effect: 'ink', affection: 6 }
                        ]}
                    ];
                }
                // disciples（默认分支）
                return [
                    { speaker: 'narrator', text: '他没有进洞。三天三夜，他就坐在新丹楼的案前口述默方——从第一味主药到最后一道文武转换的火候，一字一句，徒弟们轮流执笔。', type: 'description' },
                    { speaker: 'narrator', text: '默到第七转时他停了很久，说：「这里是师弟加的批注。当年我还嫌他画蛇添足。」说到这里，声音哑了一下，又接着往下背。', type: 'description' },
                    { speaker: 'narrator', text: '丹成那日，药香飘满了整座药王谷。第一粒丹，被他亲手供在了旧丹房遗址的门前。', type: 'description' },
                    { speaker: 'npc', text: '火候不在炉子里，在人心里。这是我师弟教的——我今天，总算敢说自己是他的师兄了。', emotion: 'warm' },
                    { speaker: 'player_select', text: '你如何回应？', options: [
                        { text: '「那这份火候，也教教我吧。」', effect: 'inherit', affection: 7 },
                        { text: '朝着旧丹房的方向，和他一起敬了敬', effect: 'bow', affection: 6 }
                    ]}
                ];
            },
            scenes: [],
            effects: function (npc, choice) {
                var aff = 0, msg = '';
                switch (choice) {
                    case 'together': aff = 8; msg = '他仰头看着丹楼上腾起的药香，重重地点头：「嗯。往后每一转，都是合炉。」'; break;
                    case 'eight': aff = 7; msg = '「好——」他握住你的手腕，掌心的烫痕硌得你有点疼，「那从明天起，你就是我这九转丹楼的二炉手。」'; break;
                    case 'finish': aff = 7; msg = '他搁下笔，望着楹柱上那行字，缓缓直起了背：「替他看完。好。这一卷，我们师徒一起看完。」'; break;
                    case 'ink': aff = 6; msg = '墨研得很浓。他誊完最后一个字，把笔搁在你的墨碟上：「你这砚墨的本事，也有三分火候了。」'; break;
                    case 'inherit': aff = 7; msg = '「求之不得。」他从案头拿起一根拨火的细炭条，郑重放进你手里，「明日卯时，从认炭开始。」'; break;
                    case 'bow': aff = 6; msg = '他侧头看了你一眼，没说话，把你歪了一点的那半个躬，轻轻扶正了些。'; break;
                }
                return { affection: aff, msg: msg };
            }
        }
    };

    // ============ 注册到全局事件池 ============
    Object.keys(MERCHANT_EVENTS).forEach(function (k) { NPC_PERSONAL_EVENTS[k] = MERCHANT_EVENTS[k]; });
    Object.keys(ALCHEMIST_EVENTS).forEach(function (k) { NPC_PERSONAL_EVENTS[k] = ALCHEMIST_EVENTS[k]; });

    // ============ 秘密注入（幂等，独立于 batch1 的注入表） ============
    var STORYLINE_SECRET_MAP_B2 = {
        merchant_01: ['merchant_secret_01'],
        alchemist_01: ['alchemist_secret_01']
    };

    function injectStorylineSecretsB2() {
        if (!window.npcManager || typeof window.npcManager.getNPC !== 'function') return;
        var data = window.SPECIAL_NPC_DATA || {};
        Object.keys(STORYLINE_SECRET_MAP_B2).forEach(function (npcId) {
            var npc = window.npcManager.getNPC(npcId);
            if (!npc) return;
            if (npc.secrets && npc.secrets[STORYLINE_SECRET_MAP_B2[npcId][0]]) return; // 已注入
            var src = data[npcId] && data[npcId].secrets;
            if (!src) return;
            npc.secrets = npc.secrets || {};
            Object.keys(src).forEach(function (sk) {
                npc.secrets[sk] = JSON.parse(JSON.stringify(src[sk]));
            });
        });
    }

    // 再包一层 getPersonalEventButtons（链式调用 batch1 的包装 → 原生）
    var _origGetPEB2 = (typeof window.getPersonalEventButtons === 'function') ? window.getPersonalEventButtons : null;
    window.getPersonalEventButtons = function (npc, npcId) {
        try { injectStorylineSecretsB2(); } catch (e) {}
        return _origGetPEB2 ? _origGetPEB2(npc, npcId) : '';
    };

    // ============ 自动触发挂钩（再包一层 getGreeting，链式） ============
    var B2_NPC_IDS = ['merchant_01', 'alchemist_01'];
    var B2_FINAL_EVENTS = { merchant_01: 'merchant01_event_5', alchemist_01: 'alchemist01_event_5' };

    var _origGetGreeting2 = (typeof window.getGreeting === 'function') ? window.getGreeting : null;
    window.getGreeting = function (npc, player) {
        try {
            if (npc && B2_NPC_IDS.indexOf(npc.id) >= 0 && typeof window.maybeAutoTriggerPersonalEvent === 'function') {
                window.maybeAutoTriggerPersonalEvent(npc.id, 'greet', { finalEvents: [B2_FINAL_EVENTS[npc.id]] });
            }
        } catch (e) {}
        return _origGetGreeting2 ? _origGetGreeting2(npc, player) : '你好。';
    };

    // daily 源：新的一天开始时兜底（玩家与NPC同城时）
    if (typeof window.timeSystem !== 'undefined' && window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') {
        window.timeSystem.onNewDaySubscribe(function () {
            try {
                if (!window.currentCharData || !window.npcManager) return;
                var loc = window.currentCharData.location || ''; // P0-2规范字段（v13.5审查修正：currentLocation从未被赋值）
                B2_NPC_IDS.forEach(function (nid) {
                    var npc = window.npcManager.getNPC(nid);
                    if (npc && npc.location === loc) {
                        window.maybeAutoTriggerPersonalEvent(nid, 'daily', { finalEvents: [B2_FINAL_EVENTS[nid]] });
                    }
                });
            } catch (e) { console.warn('[故事线v2·批次2] 每日自动触发失败:', e); }
        });
    }

    console.log('📖 故事线v2·第二批已加载：贾有道 / 丹大师（各5段，共10事件）');
})();
