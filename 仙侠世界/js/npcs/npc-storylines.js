// ==================== npc-storylines.js - 核心NPC故事线 v10.0 ====================
// 每个核心NPC采用5段结构：认识→第一次求助→暴露矛盾/秘密→玩家关键选择→长期结果
// 加载顺序：在 npc-system.js 之后加载

var NPC_STORYLINES = {
    // ==================== 1. 清虚道人（导师）====================
    mentor_01: {
        name: '清虚道人',
        story: [
            {
                stage: 1, title: '初识高人',
                trigger: { minAffection: 0, autoTrigger: true },
                dialogue: [
                    '{npc}正在修炼室中打坐，见你到来缓缓睁开眼：「你来了，我等你很久了。」',
                    '{npc}微笑道：「我看你骨骼清奇，是个修炼的好苗子。」',
                    '{npc}起身道：「既然有缘相遇，不如我指点你几招？」'
                ],
                choices: [
                    { text: '恭敬行礼：「多谢前辈指点！」', effect: 'affection+5, exp+20', nextStage: true },
                    { text: '警惕：「你有什么目的？」', effect: 'affection-2, exp+5', nextStage: true }
                ]
            },
            {
                stage: 2, title: '第一次求助',
                trigger: { minAffection: 20, minDays: 2 },
                dialogue: [
                    '{npc}面露难色：「最近修炼遇到了瓶颈，需要一味罕见的药材——千年灵芝。」',
                    '{npc}叹道：「据说东荒的原始森林深处有此灵药，但我年事已高，不便远行。」',
                    '{npc}期待地看着你：「能否帮我寻来此药？」'
                ],
                choices: [
                    { text: '「没问题，我这就去东荒寻药！」', effect: 'affection+10, quest_gather_herbs', nextStage: true },
                    { text: '「我现在没空，改天吧。」', effect: 'affection-5', nextStage: false },
                    { text: '「千年灵芝太危险了，我推荐别人去。」', effect: 'affection-3', nextStage: false }
                ]
            },
            {
                stage: 3, title: '暴露秘密',
                trigger: { minAffection: 40, stage2Complete: true },
                dialogue: [
                    '{npc}沉默良久，终于开口：「其实…我年轻时曾与魔教圣女有过一段情缘。」',
                    '{npc}眼中闪过痛苦：「此事我一直藏在心底，但近日得知她被困在魔教地牢。」',
                    '{npc}握紧拳头：「我想去救她，但…这会让我背叛师门。」'
                ],
                choices: [
                    { text: '「我帮你去救她！」', effect: 'affection+15, secret_unlocked', nextStage: true },
                    { text: '「你疯了？这会毁了你的一切！」', effect: 'affection-10', nextStage: false },
                    { text: '沉默不语，等待他继续说', effect: 'affection+2', nextStage: true }
                ]
            },
            {
                stage: 4, title: '关键选择',
                trigger: { minAffection: 60, stage3Complete: true },
                dialogue: [
                    '{npc}郑重地看着你：「我决定去救她，但需要你的帮助。」',
                    '{npc}道：「魔教地宫机关重重，我一个人无法应对。」',
                    '他递给你一块玉佩：「这是我师父的信物，若我回不来，请将此物交给掌门。」'
                ],
                choices: [
                    { text: '「我陪你一起去魔教地宫！」', effect: 'affection+20, quest_dungeon', nextStage: true },
                    { text: '「我去找掌门求援，名正言顺。」', effect: 'affection+10, quest_talk', nextStage: true },
                    { text: '「抱歉，这太危险了，我不能参与。」', effect: 'affection-20, story_end_bad', nextStage: true }
                ]
            },
            {
                stage: 5, title: '长期结果',
                trigger: { stage4Complete: true },
                dialogue: [
                    '结局取决于你的选择……',
                    '若你陪他去魔教地宫：成功救出圣女，{npc}感激涕零，与你结为忘年之交。',
                    '若你找掌门求援：掌门率众清理魔教，{npc}受到嘉奖，但圣女被秘密处决，{npc}郁郁寡欢。',
                    '若你拒绝：{npc}独自前往，九死一生，虽然救出圣女但身受重伤，修为大减，从此隐居。'
                ],
                choices: [
                    { text: '「无论结果如何，我都尊重你的选择。」', effect: 'story_complete', nextStage: false }
                ]
            }
        ]
    },

    // ==================== 2. 灵素（治疗师）====================
    healer_01: {
        name: '灵素',
        story: [
            {
                stage: 1, title: '医馆相遇',
                trigger: { minAffection: 0, autoTrigger: true },
                dialogue: [
                    '你走进医馆，看到一位白衣女子正在为病人诊治。',
                    '{npc}抬头对你微笑：「你看起来气色不太好，要不要我帮你看看？」',
                    '{npc}温柔道：「放心，不收你诊金。」'
                ],
                choices: [
                    { text: '「那就麻烦你了。」（让她诊治）', effect: 'health+20, affection+3', nextStage: true },
                    { text: '「我没事，只是路过看看。」', effect: 'affection+1', nextStage: true }
                ]
            },
            {
                stage: 2, title: '求药之人',
                trigger: { minAffection: 15, minDays: 1 },
                dialogue: [
                    '{npc}正在翻看医书，眉头紧锁。',
                    '{npc}抬头看到你，勉强笑了笑：「你来得正好，我正需要帮助。」',
                    '{npc}道：「最近城中出现了一种怪病，我需要采集几种稀有药材来研制解药。」'
                ],
                choices: [
                    { text: '「需要什么药材？我去帮你找。」', effect: 'affection+10, quest_gather_herbs', nextStage: true },
                    { text: '「我认识一些药商，可以帮你问问。」', effect: 'affection+5', nextStage: true },
                    { text: '「抱歉，我不擅长采药。」', effect: 'affection-3', nextStage: false }
                ]
            },
            {
                stage: 3, title: '身患奇毒',
                trigger: { minAffection: 35, stage2Complete: true },
                dialogue: [
                    '{npc}在诊治病人时突然咳嗽不止，脸色苍白。',
                    '你搀扶她坐下，她虚弱地笑了笑：「没事…老毛病了。」',
                    '在你的追问下，她终于坦白：「其实我自幼身中奇毒，一直在寻找解药。」'
                ],
                choices: [
                    { text: '「我一定帮你找到解药！」', effect: 'affection+15, secret_unlocked', nextStage: true },
                    { text: '「你身为医者，为何不给自己解毒？」', effect: 'affection+2', nextStage: true },
                    { text: '「这…太可惜了。」（不知如何是好）', effect: 'affection+0', nextStage: true }
                ]
            },
            {
                stage: 4, title: '解毒之法',
                trigger: { minAffection: 50, stage3Complete: true },
                dialogue: [
                    '{npc}拿出一张古方：「这是我师门传下的解毒之法，但需要一味传说中的药材——凤凰血。」',
                    '{npc}道：「凤凰血只在南疆火山深处的凤凰巢才有，守护兽是上古火凤。」',
                    '{npc}认真地看着你：「这一去九死一生，我不希望你为我冒险。」'
                ],
                choices: [
                    { text: '「我这就去南疆取凤凰血！」', effect: 'affection+20, quest_dungeon', nextStage: true },
                    { text: '「我们一起去找凤凰血。」', effect: 'affection+15, quest_dungeon', nextStage: true },
                    { text: '「我…我需要考虑一下。」', effect: 'affection-10, story_end_bad', nextStage: true }
                ]
            },
            {
                stage: 5, title: '结局',
                trigger: { stage4Complete: true },
                dialogue: [
                    '结局取决于你的选择……',
                    '若你取来凤凰血：{npc}成功解毒，从此摆脱病痛，她感激不尽，愿与你结为至交。',
                    '若你陪她去：途中你们经历生死，感情更加深厚，虽九死一生但最终成功。',
                    '若你犹豫不决：{npc}独自前往，虽然成功但留下暗伤，最终隐居山林。'
                ],
                choices: [
                    { text: '「愿医者仁心，终有善报。」', effect: 'story_complete', nextStage: false }
                ]
            }
        ]
    },

    // ==================== 3. 铁山（战士）====================
    warrior_01: {
        name: '铁山',
        story: [
            {
                stage: 1, title: '演武场上的较量',
                trigger: { minAffection: 0, autoTrigger: true },
                dialogue: [
                    '你看到一位壮汉正在演武场中练拳，拳风虎虎生威。',
                    '{npc}注意到你，停下来打量你：「看起来你也练过？来切磋切磋？」',
                    '{npc}咧嘴一笑：「放心，我会手下留情的。」'
                ],
                choices: [
                    { text: '「好！请指教！」（切磋）', effect: 'affection+5, exp+10', nextStage: true },
                    { text: '「我只是路过看看。」', effect: 'affection+1', nextStage: true }
                ]
            },
            {
                stage: 2, title: '昔日之耻',
                trigger: { minAffection: 20, minDays: 1 },
                dialogue: [
                    '{npc}独自喝着闷酒，神色阴郁。',
                    '你上前询问，他叹了口气：「三年前，我败给了一个神秘人，至今未能雪耻。」',
                    '{npc}握紧拳头：「那人用的是魔教功法，我怀疑他是魔教的人。」'
                ],
                choices: [
                    { text: '「我帮你调查那个神秘人！」', effect: 'affection+10, quest_investigate', nextStage: true },
                    { text: '「过去的就让它过去吧。」', effect: 'affection-5', nextStage: false },
                    { text: '「那人有什么特征吗？」', effect: 'affection+3', nextStage: true }
                ]
            },
            {
                stage: 3, title: '仇人踪迹',
                trigger: { minAffection: 40, stage2Complete: true },
                dialogue: [
                    '{npc}急匆匆跑来：「我找到他了！那个神秘人就在西漠的古城中！」',
                    '{npc}眼中燃着怒火：「他如今是魔教的一个护法，正在策划攻打正道联盟。」',
                    '{npc}道：「我要去阻止他，但…我需要你的帮助。」'
                ],
                choices: [
                    { text: '「我陪你去西漠！」', effect: 'affection+15, quest_dungeon', nextStage: true },
                    { text: '「我们应该先通知正道联盟。」', effect: 'affection+5', nextStage: true },
                    { text: '「太危险了，从长计议吧。」', effect: 'affection-10', nextStage: false }
                ]
            },
            {
                stage: 4, title: '巅峰对决',
                trigger: { minAffection: 60, stage3Complete: true },
                dialogue: [
                    '你们来到西漠古城，找到了那个魔教护法。',
                    '护法冷笑道：「鐵山，當年饒你一命，你竟敢找上門來？」',
                    '{npc}怒吼：「今日便是你的死期！」'
                ],
                choices: [
                    { text: '与铁山并肩作战（战斗）', effect: 'affection+20, quest_combat', nextStage: true },
                    { text: '在旁策应，伺机偷袭', effect: 'affection+10', nextStage: true },
                    { text: '劝铁山冷静，先撤退', effect: 'affection-15, story_end_bad', nextStage: true }
                ]
            },
            {
                stage: 5, title: '结局',
                trigger: { stage4Complete: true },
                dialogue: [
                    '结局取决于你的选择……',
                    '并肩作战：你们联手击败了护法，{npc}一雪前耻，从此视你为生死之交。',
                    '策应偷袭：虽然击败了敌人，但{npc}觉得不够光明正大，心中略有遗憾。',
                    '劝他撤退：{npc}虽然听从了你的建议，但从此一蹶不振，失去了往日的锐气。'
                ],
                choices: [
                    { text: '「胜败已定，前路还长。」', effect: 'story_complete', nextStage: false }
                ]
            }
        ]
    },

    // ==================== 4. 贾有道（商人）====================
    merchant_01: {
        name: '贾有道',
        story: [
            {
                stage: 1, title: '坊市偶遇',
                trigger: { minAffection: 0, autoTrigger: true },
                dialogue: [
                    '你在坊市中闲逛，看到一个精明的商人在跟人讨价还价。',
                    '{npc}注意到你，露出商人特有的笑容：「这位道友，我看你气度不凡，要不要看看新到的货？」',
                    '{npc}神秘地压低声音：「有好东西哦。」'
                ],
                choices: [
                    { text: '「有什么好东西？让我看看。」', effect: 'affection+3', nextStage: true },
                    { text: '「我只是随便看看。」', effect: 'affection+1', nextStage: true }
                ]
            },
            {
                stage: 2, title: '资金周转',
                trigger: { minAffection: 15, minDays: 1 },
                dialogue: [
                    '{npc}愁眉苦脸地算着账本。',
                    '见你来了，他叹气道：「最近生意不好做啊，一批货被劫了，资金周转不开。」',
                    '{npc}搓着手：「道友能不能借我些灵石周转？利润分你两成！」'
                ],
                choices: [
                    { text: '「借你500灵石。」', effect: 'affection+10, spiritStones-500', nextStage: true },
                    { text: '「借你200灵石。」', effect: 'affection+5, spiritStones-200', nextStage: true },
                    { text: '「抱歉，我手头也紧。」', effect: 'affection-5', nextStage: false }
                ]
            },
            {
                stage: 3, title: '禁品交易',
                trigger: { minAffection: 35, stage2Complete: true },
                dialogue: [
                    '{npc}神秘兮兮地拉你到角落：「道友，我有一批…特殊的货。」',
                    '{npc}低声道：「是从魔教那边弄来的禁品，虽然风险大，但利润极高。」',
                    '{npc}期待地看着你：「要不要一起干？」'
                ],
                choices: [
                    { text: '「算我一份！」（参与禁品交易）', effect: 'affection+10, spiritStones+500, karma-10', nextStage: true },
                    { text: '「这是违法的，你疯了？」', effect: 'affection-5, karma+5', nextStage: false },
                    { text: '「我不参与，但也不会告发你。」', effect: 'affection+2', nextStage: true }
                ]
            },
            {
                stage: 4, title: '东窗事发',
                trigger: { minAffection: 50, stage3Complete: true },
                dialogue: [
                    '{npc}惊慌失措地找到你：「不好了！官府查到那批禁品了！」',
                    '{npc}道：「他们要查封我的店铺，抓我去坐牢！」',
                    '{npc}哀求道：「道友，你一定要帮我！」'
                ],
                choices: [
                    { text: '「我帮你藏货，疏通关系。」', effect: 'affection+20, spiritStones-200, karma-5', nextStage: true },
                    { text: '「你去自首吧，我会照顾你的家人。」', effect: 'affection+5, karma+10', nextStage: true },
                    { text: '「这事我管不了，你好自为之。」', effect: 'affection-20, story_end_bad', nextStage: true }
                ]
            },
            {
                stage: 5, title: '结局',
                trigger: { stage4Complete: true },
                dialogue: [
                    '结局取决于你的选择……',
                    '疏通关系：{npc}逃过一劫，从此更加信任你，成为你的专属供应商。',
                    '劝他自首：{npc}入狱数年，但出狱后改过自新，开了一家正经店铺。',
                    '不管他：{npc}锒铛入狱，家产充公，你失去了一个商人朋友。'
                ],
                choices: [
                    { text: '「商道即人道，愿你领悟。」', effect: 'story_complete', nextStage: false }
                ]
            }
        ]
    },

    // ==================== 5. 玄冰子（长老）====================
    elder_01: {
        name: '玄冰子',
        story: [
            {
                stage: 1, title: '冰宫长老',
                trigger: { minAffection: 0, autoTrigger: true },
                dialogue: [
                    '你来到天山派，一位白发老者正在指导弟子修炼。',
                    '{npc}看到你，微微颔首：「能来到此地，也是有缘人。」',
                    '{npc}道：「老夫玄冰子，天山派长老。」'
                ],
                choices: [
                    { text: '「久仰长老威名。」', effect: 'affection+3', nextStage: true },
                    { text: '「我只是路过。」', effect: 'affection+1', nextStage: true }
                ]
            },
            {
                stage: 2, title: '寒冰真气反噬',
                trigger: { minAffection: 20, minDays: 1 },
                dialogue: [
                    '你看到{npc}在密室中运功，脸色忽青忽白，似乎在压制什么。',
                    '他睁开眼，勉强一笑：「被你看到了…我修炼的寒冰真气出了岔子。」',
                    '{npc}道：「寒冰真气反噬，若不及时压制，恐有走火入魔之危。」'
                ],
                choices: [
                    { text: '「我帮你找火属性的灵药来中和！」', effect: 'affection+10, quest_gather', nextStage: true },
                    { text: '「要不要我帮你护法？」', effect: 'affection+5', nextStage: true },
                    { text: '「你自己小心。」', effect: 'affection-2', nextStage: false }
                ]
            },
            {
                stage: 3, title: '走火入魔',
                trigger: { minAffection: 40, stage2Complete: true },
                dialogue: [
                    '{npc}突然真气暴走，寒冰真气肆虐，整个密室都被冰封！',
                    '他眼中闪过一丝红光，艰难地开口：「快…快走！我要控制不住了！」',
                    '{npc}痛苦地蜷缩在地：「去…去找我师弟…他…知道怎么救我…」'
                ],
                choices: [
                    { text: '「我不走！我帮你压制！」', effect: 'affection+15, health-20', nextStage: true },
                    { text: '「我这就去找你师弟！」', effect: 'affection+10, quest_talk', nextStage: true },
                    { text: '后退逃跑', effect: 'affection-20, story_end_bad', nextStage: true }
                ]
            },
            {
                stage: 4, title: '救治之法',
                trigger: { minAffection: 60, stage3Complete: true },
                dialogue: [
                    '{npc}的师弟赶来，查看后摇头：「师兄的寒冰真气已经侵入心脉，除非找到天火灵珠。」',
                    '师弟道：「天火灵珠在火山深处，由炎魔兽守护，极其危险。」',
                    '{npc}虚弱道：「不…不必为我冒险…」'
                ],
                choices: [
                    { text: '「我去火山取天火灵珠！」', effect: 'affection+20, quest_dungeon', nextStage: true },
                    { text: '「我们一起去找天火灵珠。」', effect: 'affection+15', nextStage: true },
                    { text: '「对不起，我无能为力…」', effect: 'affection-20, story_end_bad', nextStage: true }
                ]
            },
            {
                stage: 5, title: '结局',
                trigger: { stage4Complete: true },
                dialogue: [
                    '结局取决于你的选择……',
                    '取来天火灵珠：{npc}成功压制寒冰真气，修为更上一层楼，对你感激不尽。',
                    '陪他一起：虽然过程凶险，但你们成功获得天火灵珠，{npc}视你为救命恩人。',
                    '无能为力：{npc}最终走火入魔，被寒冰真气反噬，修为尽废。'
                ],
                choices: [
                    { text: '「冰火相济，大道可期。」', effect: 'story_complete', nextStage: false }
                ]
            }
        ]
    },

    // ==================== 6. 柳随风（竞争对手）====================
    rival_01: {
        name: '柳随风',
        story: [
            {
                stage: 1, title: '初次交锋',
                trigger: { minAffection: 0, autoTrigger: true },
                dialogue: [
                    '一位风度翩翩的白衣公子拦住了你的去路。',
                    '他优雅地拱手：「在下柳随风，听说阁下是最近崛起的后起之秀？」',
                    '柳随风微微一笑：「可敢与我一较高下？」'
                ],
                choices: [
                    { text: '「有何不敢！」（切磋）', effect: 'affection+5, exp+15', nextStage: true },
                    { text: '「我没兴趣。」', effect: 'affection-3', nextStage: false },
                    { text: '「改日再战。」', effect: 'affection+1', nextStage: true }
                ]
            },
            {
                stage: 2, title: '亦敌亦友',
                trigger: { minAffection: 15, minDays: 1 },
                dialogue: [
                    '你再次遇到柳随风，他正在追杀一群山贼。',
                    '他解决完山贼后，对你笑道：「又见面了，看来我们真有缘分。」',
                    '柳随风擦了擦剑上的血：「这世道不太平，要不要一起行动？」'
                ],
                choices: [
                    { text: '「好，一起上路。」', effect: 'affection+8', nextStage: true },
                    { text: '「我习惯独来独往。」', effect: 'affection-2', nextStage: false }
                ]
            },
            {
                stage: 3, title: '真实身份',
                trigger: { minAffection: 35, stage2Complete: true },
                dialogue: [
                    '你无意中发现柳随风身上的魔教令牌。',
                    '他见你发现，脸色一变，随后苦笑：「被你发现了…我是魔教派来的卧底。」',
                    '柳随风道：「但我从未做过伤天害理之事，只是…身不由己。」'
                ],
                choices: [
                    { text: '「我相信你，会帮你保守秘密。」', effect: 'affection+15, secret_unlocked', nextStage: true },
                    { text: '「你居然是魔教的人！」（翻脸）', effect: 'affection-20', nextStage: false },
                    { text: '「你为什么要加入魔教？」', effect: 'affection+5', nextStage: true }
                ]
            },
            {
                stage: 4, title: '身不由己',
                trigger: { minAffection: 55, stage3Complete: true },
                dialogue: [
                    '柳随风找到你，神情凝重：「魔教命令我刺杀正道联盟的盟主。」',
                    '他苦笑道：「若我不从，他们就会杀我家人。我…我不知道该怎么办。」',
                    '柳随风道：「你是我唯一信任的人，帮我拿个主意。」'
                ],
                choices: [
                    { text: '「我帮你救出家人，再揭发魔教！」', effect: 'affection+20, quest_dungeon', nextStage: true },
                    { text: '「假意刺杀，我们设局反杀。」', effect: 'affection+15', nextStage: true },
                    { text: '「你的事我管不了。」', effect: 'affection-20, story_end_bad', nextStage: true }
                ]
            },
            {
                stage: 5, title: '结局',
                trigger: { stage4Complete: true },
                dialogue: [
                    '结局取决于你的选择……',
                    '救出家人：你们成功救出他的家人并揭发魔教，柳随风弃暗投明，成为正道盟友。',
                    '设局反杀：你们成功设局歼灭魔教刺客，但柳随风的身份暴露，不得不远走他乡。',
                    '不管他：柳随风被迫执行刺杀，虽然成功但良知不安，最终消失在江湖中。'
                ],
                choices: [
                    { text: '「命运弄人，愿你终得自由。」', effect: 'story_complete', nextStage: false }
                ]
            }
        ]
    },

    // ==================== 7. 张大爷（村民）====================
    villager_01: {
        name: '张大爷',
        story: [
            {
                stage: 1, title: '村口老者',
                trigger: { minAffection: 0, autoTrigger: true },
                dialogue: [
                    '一位白发苍苍的老人坐在村口的大树下，看着来来往往的人。',
                    '{npc}看到你，慈祥地笑道：「年轻人，你是修仙者吧？」',
                    '{npc}眼中闪过怀念：「我年轻时也曾梦想修仙，可惜…」'
                ],
                choices: [
                    { text: '「老人家年轻时也修过仙？」', effect: 'affection+3', nextStage: true },
                    { text: '「我只是路过。」', effect: 'affection+1', nextStage: true }
                ]
            },
            {
                stage: 2, title: '未竟之梦',
                trigger: { minAffection: 15, minDays: 1 },
                dialogue: [
                    '你来到村口，看到{npc}拿着一本泛黄的书籍发呆。',
                    '他见你来了，把书递给你：「这是我年轻时得到的一本修炼心得，可惜我资质不够，未能修炼。」',
                    '{npc}叹道：「如今我年事已高，这本秘籍留在我这里也是浪费，不如送给你。」'
                ],
                choices: [
                    { text: '「多谢老人家！」（接过秘籍）', effect: 'affection+10, item_secret_art', nextStage: true },
                    { text: '「这太贵重了，我不能收。」', effect: 'affection+5', nextStage: true }
                ]
            },
            {
                stage: 3, title: '深藏不露',
                trigger: { minAffection: 30, stage2Complete: true },
                dialogue: [
                    '你发现{npc}在深夜时分偷偷练功，动作虽然生疏但颇有章法。',
                    '他看到你，尴尬地停下：「被你发现了…我这些年一直在偷偷修炼。」',
                    '{npc}道：「虽然进展缓慢，但我不甘心放弃这个梦想。」'
                ],
                choices: [
                    { text: '「我教你正确的修炼方法！」', effect: 'affection+15', nextStage: true },
                    { text: '「老人家精神可嘉。」', effect: 'affection+5', nextStage: true },
                    { text: '「你都这把年纪了，何必呢？」', effect: 'affection-10', nextStage: false }
                ]
            },
            {
                stage: 4, title: '最后的心愿',
                trigger: { minAffection: 50, stage3Complete: true },
                dialogue: [
                    '{npc}找到你，郑重地说：「我时日无多了，但我有一个心愿。」',
                    '{npc}道：「我想在临死前突破到炼气期，哪怕只有一天，我也想真正感受一下修仙者的境界。」',
                    '{npc}期待地看着你：「你能帮我吗？」'
                ],
                choices: [
                    { text: '「我帮你找筑基丹和灵气充沛的地方！」', effect: 'affection+20, spiritStones-200', nextStage: true },
                    { text: '「我运功帮你打通经脉。」', effect: 'affection+15, qi-50', nextStage: true },
                    { text: '「这…恐怕很难。」', effect: 'affection-10, story_end_bad', nextStage: true }
                ]
            },
            {
                stage: 5, title: '结局',
                trigger: { stage4Complete: true },
                dialogue: [
                    '结局取决于你的选择……',
                    '帮他突破：在你们的努力下，{npc}成功突破到炼气期，虽然年迈但终于圆梦，含笑仙逝。',
                    '运功打通经脉：你的真气帮他冲开经脉，他虽未能完全突破，但感受到了修仙的境界，无憾而终。',
                    '无能为力：{npc}带着遗憾离世，你心中愧疚，决定以后多帮助有梦想的人。'
                ],
                choices: [
                    { text: '「梦想无分老幼，愿您一路走好。」', effect: 'story_complete', nextStage: false }
                ]
            }
        ]
    },

    // ==================== 8~12 精简版 ====================
    // 丹大师、铁匠老王、神秘老者、柳如是、紫烟仙子
    alchemist_01: {
        name: '丹大师',
        story: [
            { stage: 1, title: '炼丹奇才', trigger: { minAffection: 0, autoTrigger: true }, dialogue: ['你走进炼丹房，看到一位老者正在专注地炼丹。', '{npc}头也不抬：「要丹药自己拿，别打扰我炼丹。」', '你注意到他炼丹的手法极为纯熟，显然是个中高手。'], choices: [{ text: '「大师的炼丹术果然名不虚传。」', effect: 'affection+3', nextStage: true }, { text: '「我只是看看。」', effect: 'affection+1', nextStage: true }] },
            { stage: 2, title: '炸炉之秘', trigger: { minAffection: 20, minDays: 1 }, dialogue: ['{npc}看着一堆废丹叹气：「又失败了…自从那次炸炉后，我的炼丹术就大不如前。」', '你好奇地问：「炸炉？」', '{npc}苦笑：「十年前我炼制神丹时炸毁了半个山洞，从此留下心理阴影。」'], choices: [{ text: '「我帮你寻找失传的丹方！」', effect: 'affection+10', nextStage: true }, { text: '「慢慢来，总会恢复的。」', effect: 'affection+3', nextStage: true }] },
            { stage: 3, title: '神丹再现', trigger: { minAffection: 40, stage2Complete: true }, dialogue: ['{npc}激动地拿出一张古方：「我找到了！当年炸炉时我以为是失败，其实那神丹已经炼成了！」', '他道：「但神丹被埋在废墟下，需要人去挖出来。」', '{npc}期待地看着你。'], choices: [{ text: '「我帮你去废墟挖掘！」', effect: 'affection+15', nextStage: true }, { text: '「太危险了，从长计议。」', effect: 'affection-5', nextStage: false }] },
            { stage: 4, title: '丹道传承', trigger: { minAffection: 60, stage3Complete: true }, dialogue: ['{npc}成功取回神丹，但他没有服用，而是交给了你。', '他道：「我老了，这神丹给你，希望你能在丹道上走得更远。」', '{npc}微笑道：「这是我的传承，好好珍惜。」'], choices: [{ text: '「多谢大师！」', effect: 'affection+20, item_legendary', nextStage: true }, { text: '「这太贵重了，我不能收。」', effect: 'affection+10', nextStage: true }] },
            { stage: 5, title: '结局', trigger: { stage4Complete: true }, dialogue: ['{npc}将毕生所学传授给你，虽然你没有正式拜师，但在他心中，你已是他的传人。', '从此，丹道一脉有了新的传承。'], choices: [{ text: '「丹道永传，薪火不灭。」', effect: 'story_complete', nextStage: false }] }
        ]
    },

    craftsman_01: {
        name: '铁匠老王',
        story: [
            { stage: 1, title: '铁匠铺', trigger: { minAffection: 0, autoTrigger: true }, dialogue: ['叮叮当当的打铁声从铁匠铺中传出。', '一个赤膊壮汉正在打铁，汗水在炉火映照下闪闪发光。', '{npc}看到你，咧嘴一笑：「要打什么兵器？」'], choices: [{ text: '「我想打一把好剑。」', effect: 'affection+3', nextStage: true }, { text: '「随便看看。」', effect: 'affection+1', nextStage: true }] },
            { stage: 2, title: '陨铁传说', trigger: { minAffection: 20, minDays: 1 }, dialogue: ['{npc}神秘地拿出一块黑色的金属：「这是天外陨铁，我祖传的宝贝。」', '他道：「用这块陨铁可以打造出一把绝世神兵，但我一个人力有不逮。」', '{npc}期待地看着你。'], choices: [{ text: '「我帮你一起打造！」', effect: 'affection+10', nextStage: true }, { text: '「我帮你找其他铁匠帮忙。」', effect: 'affection+5', nextStage: true }] },
            { stage: 3, title: '铸剑', trigger: { minAffection: 40, stage2Complete: true }, dialogue: ['你们开始锻造陨铁，需要七七四十九天不间断的锤炼。', '{npc}道：「期间需要大量灵石维持炉火，还需要你的真气辅助。」', '铁水在炉中翻滚，神兵即将出世。'], choices: [{ text: '「我全力支持！」', effect: 'affection+15, qi-100', nextStage: true }, { text: '「我每天来帮忙几个时辰。」', effect: 'affection+8', nextStage: true }] },
            { stage: 4, title: '神兵出世', trigger: { minAffection: 60, stage3Complete: true }, dialogue: ['神兵终于铸成！剑身流光溢彩，散发着强大的灵气。', '{npc}将剑递给你：「这把剑是你的了，没有你的帮助，它不可能问世。」', '他笑道：「给它取个名字吧。」'], choices: [{ text: '「就叫它长青吧」', effect: 'affection+15, item_legendary', nextStage: true }, { text: '「还是你取名吧。」', effect: 'affection+10', nextStage: true }] }
        ]
    }
};

// 导出到全局（统一使用 window.NPC_STORYLINES）
window.NPC_STORYLINES = NPC_STORYLINES;
// 兼容旧命名（小写s）
window.NPC_Storylines = NPC_STORYLINES;
window.npc_storylines = NPC_STORYLINES;