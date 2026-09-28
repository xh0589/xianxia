// ========================================
// js/npcs/special-npcs.js - 10个特殊NPC预设数据
// 从data.js拆出，独立加载
// 加载顺序：在 npc-system.js 之前
// ========================================

const SPECIAL_NPC_DATA = {
    // ==================== 1. 导师型NPC ====================
    mentor_01: {
        id: 'mentor_01',
        name: '清虚道人',
        gender: 'male',
        age: 50,
        occupation: '长老',
        location: '武当派',
        icon: '🧘',
        appearance: { hair: '白色长发', eyes: '深邃', clothing: '道袍', features: '仙风道骨' },
        background: { origin: '青云门', family: '修仙世家', history: '自幼出家，修行三十年，佛法精深，武功高强', goal: '维护佛门正统，普度众生', secret: '年轻时曾与魔教圣女有过一段情缘' },
        personalityBig5: { openness: 60, conscientiousness: 90, extraversion: 30, agreeableness: 80, neuroticism: 10 },
        combat: { level: 75, realm: '筑基', layer: 7, attack: 60, defense: 80, speed: 50, skills: ['达摩剑法', '易筋经', '金钟罩'] },
        profession: { type: 'teacher', level: 85, specialization: '修炼指导' },
        preferences: { likedItems: [{category: '佛经', multiplier: 2}], dislikedItems: [{category: '酒肉', multiplier: 0.5}], giftMultiplier: 0.8 },
        schedule: { default: [
            {time: '04:00-06:00', location: '修炼室', activity: '早课打坐'},
            {time: '06:00-08:00', location: '修炼室', activity: '指导弟子'},
            {time: '08:00-12:00', location: '讲堂', activity: '讲经说法'},
            {time: '12:00-14:00', location: '食堂', activity: '用斋'},
            {time: '14:00-18:00', location: '修炼室', activity: '闭关修炼'},
            {time: '18:00-20:00', location: '讲堂', activity: '答疑'},
            {time: '20:00-22:00', location: '修炼室', activity: '休息'}
        ]},
        dialogueTree: { topics: {
            greeting: { all: ['{playerName}，你来修炼室有何事？', '阿弥陀佛，施主来了。', '今日修炼可有什么进展？'], warm: ['看到你这么勤奋，为师很欣慰。'] },
            cultivation: { all: ['修炼讲究循序渐进，不可急于求成。', '我最近在参悟《清心诀》，颇有收获。', '你知道如何提升境界吗？'], warm: ['我可以指点你几招修炼方法。'] },
            sect: { all: ['青云门最近又在招新了。', '各门派之间关系微妙啊...', '你对哪个门派感兴趣？'] },
            market: { all: ['最近坊市物价不太稳定。', '灵石现在比较紧缺啊。'] },
            dungeon: { all: ['后山的秘境据说有宝物出世。', '探险要注意安全。'] },
            gossip: { all: ['{playerName}，来得正好——今日功课，老道批过了。字比上月上进，心比上月还浮。', '晨课的钟听过没有？听过钟的人，一天都站得稳。', '《清心诀》不难，难在一个「清」字。心清不是没事，是有了事，不动。', '参悟急不得。水到渠成——渠要是没成，是水还没到。', '各派香火冷暖，与山门无干。我们修的是道，不是热闹。', '坊市的价，涨也是风，跌也是风。修行人心里，得有杆不动的秤。', '后山秘境开了？去可以，戌时前回——夜里的山气，浊。', '藏书阁你常去。三楼西头那排樟木匣，蒙尘最厚的那只——别动它。不是不能动，是老道还没想好，要不要再开。', '今日月色，倒像四十年前的某一夜。……随口一提，不必记。', '老道夜里失眠，不数羊——数星。数来数去，有一颗总在老地方。星没动，人老了。', '有心事？出家人没有心事，只有功课。功课里的心事，念一遍，放一炷香。', '阁里有几卷经要晒。你有空，搭把手——晒经这活，急脾气干不来。', '去吧。今日无事，就是好事。'] },
            personal: { all: ['其实我有心事想找人说说...', '你相信命运吗？'] },
            quest: { all: ['我有个忙可能需要你的帮助...', '最近有些事情需要人去处理。'] }
        }, topicRequirements: { personal: { minAffection: 40 }, quest: { minAffection: 30 } } },
        // v12.6 故事线v2：秘密定义（由 storylines-v2/batch1.js 注入 NPC 实例）
        secrets: {
            'mentor_secret_01': {
                id: 'mentor_secret_01',
                title: '旧情·魔教圣女',
                content: '清虚道人年轻时曾与魔教圣女萧氏有过一段无果的情缘。藏书阁的樟木匣里，那支玉簪和画像就是她留下的。',
                desc: '他尘封四十年的过往',
                type: 'personal',
                unlockConditions: [
                    { type: 'affection', min: 35 },
                    { type: 'event_completed', eventId: 'mentor01_event_3', eventName: '玉簪与画像' }
                ],
                unlocked: false
            }
        }
    },

    // ==================== 2. 治疗师NPC ====================
    healer_01: {
        id: 'healer_01',
        name: '灵素',
        gender: 'female',
        age: 26,
        occupation: '长老',
        location: '百花谷',
        icon: '👩‍⚕️',
        appearance: { hair: '黑色长发', eyes: '温柔', clothing: '白色长裙', features: '气质温婉' },
        background: { origin: '药王谷', family: '医道世家', history: '自幼学习医术，精通药理和针灸', goal: '悬壶济世，救治更多人', secret: '身患奇毒，时日无多' },
        personalityBig5: { openness: 70, conscientiousness: 85, extraversion: 60, agreeableness: 90, neuroticism: 30 },
        combat: { level: 30, realm: '炼气', layer: 3, attack: 20, defense: 40, speed: 35, skills: ['针灸术', '草药辨识'] },
        profession: { type: 'healer', level: 80, specialization: '医术' },
        preferences: { likedItems: [{category: '草药', multiplier: 2}], dislikedItems: [{category: '武器', multiplier: 0.5}], giftMultiplier: 1.2 },
        schedule: { default: [
            {time: '07:00-12:00', location: '医馆', activity: '坐诊'},
            {time: '12:00-14:00', location: '花园', activity: '采药'},
            {time: '14:00-19:00', location: '医馆', activity: '制药'},
            {time: '19:00-22:00', location: '住所', activity: '休息'}
        ]},
        dialogueTree: { topics: {
            greeting: { all: ['你好，{playerName}。哪里不舒服吗？', '欢迎来到医馆。'], warm: ['看到你这么健康，我很高兴。'] },
            cultivation: { all: ['修炼过度会伤身，要注意休息。', '我可以教你一些恢复体力的方法。'] },
            market: { all: ['最近药材价格上涨了不少。', '你知道哪里能买到稀有草药吗？'] },
            gossip: { all: ['{playerName}？气色不错——手伸出来，搭个脉。……嗯，脉稳。走吧。', '脸色不对就早说。病这东西，拖不得，瞒更不得。', '修炼过了子时的，都该来我这儿排队。你们拿命换修为，我拿针换你们的命。', '伤没好透别硬练。旧伤叠新伤，神仙也接不上。', '药材又涨了。涨吧——有几味药，涨到天上去我也不进：来路不干净的药，救人也害人。', '城南有人装病骗药，被骗过一次，我记他一年。药铺的账，比人心清。', '我这儿几根针，针尾乌了三年——你猜是药浸的？……是药浸的。南疆的药，讲究。', '我自己？我好得很。医者不能病——病人瞧见医者咳嗽，心先凉半截。这是行医的规矩。', '心事？没有。病人有心事，医者只有病历。', '帮我个忙：山里几味药，替我采一趟。认得的才采，认不得的画下来带给我。', '按时喝药，不许倒——倒没倒，我闻得出来。', '……夜里要是路过医庐，看见灯还亮着——别敲窗，我数脉呢。'] },
            personal: { all: ['其实我也有自己的烦恼...', '你相信命运吗？'] },
            quest: { all: ['我需要一些稀有药材，你能帮我采集吗？'] }
        }, topicRequirements: { personal: { minAffection: 40 }, quest: { minAffection: 30 } } },
        // v12.6 故事线v2：秘密定义（由 storylines-v2/batch1.js 注入 NPC 实例）
        secrets: {
            'healer_secret_01': {
                id: 'healer_secret_01',
                title: '噬心蛊引',
                content: '灵素十年前在南疆采药时中了「噬心蛊引」，针尾凝出的血黑如墨。她一直在用自己的医术与毒比耐心。',
                desc: '她瞒着所有人的病',
                type: 'personal',
                unlockConditions: [
                    { type: 'affection', min: 35 },
                    { type: 'event_completed', eventId: 'healer01_event_3', eventName: '针尾的黑' }
                ],
                unlocked: false
            }
        }
    },

    // ==================== 3. 战士NPC ====================
    warrior_01: {
        id: 'warrior_01',
        name: '铁山',
        gender: 'male',
        age: 30,
        occupation: '长老',
        location: '金刚宗',
        icon: '⚔️',
        appearance: { hair: '短发', eyes: '锐利', clothing: '战甲', features: '肌肉发达' },
        background: { origin: '边陲小镇', family: '军人世家', history: '从小习武，参加过多次战役', goal: '成为最强战士', secret: '曾经败给过一个神秘对手' },
        personalityBig5: { openness: 40, conscientiousness: 80, extraversion: 70, agreeableness: 50, neuroticism: 40 },
        combat: { level: 65, realm: '筑基', layer: 5, attack: 80, defense: 70, speed: 55, skills: ['铁拳功', '战甲术', '冲锋'] },
        profession: { type: 'guard', level: 70, specialization: '战斗指导' },
        preferences: { likedItems: [{category: '武器', multiplier: 2}], dislikedItems: [{category: '佛经', multiplier: 0.5}], giftMultiplier: 1.0 },
        schedule: { default: [
            {time: '05:00-08:00', location: '演武场', activity: '晨练'},
            {time: '08:00-12:00', location: '军营', activity: '训练士兵'},
            {time: '12:00-14:00', location: '食堂', activity: '用膳'},
            {time: '14:00-18:00', location: '演武场', activity: '切磋'},
            {time: '18:00-22:00', location: '军营', activity: '休息'}
        ]},
        dialogueTree: { topics: {
            greeting: { all: ['{playerName}，来切磋一场吗？', '有什么需要帮忙的？'], warm: ['你的进步很大，值得称赞。'] },
            cultivation: { all: ['战斗是最好的修炼方式。', '你知道如何提升战斗力吗？'] },
            market: { all: ['武器价格最近波动很大。', '好装备需要花大价钱。'] },
            dungeon: { all: ['秘境里有很多强敌，要小心。', '我上次去秘境差点回不来。'] },
            gossip: { all: ['{playerName}！来得早。刚热完身——来，陪我走两招。', '站有站相。当兵的最先练的不是枪，是站。', '切磋点到为止。真打，另约地方——军中的规矩，血不溅自家营。', '你的枪比上月稳。稳就好。快是花活，稳是命。', '装备涨价？铁还是那块铁，涨的是人心。好甲贵——命更贵，这账不用算。', '秘境的强敌，我一人打过三个。回来路上数了数，后怕。你要去，结伴。', '八年了，有个人欠我一枪。帐里那半截枪杆你见过？见过就见过——别问。说不出名字的账，最熬人。', '夜里我擦枪，擦到断口那儿总慢半拍。不是枪的事。', '帮我去趟校场，把那几个新兵练练站姿，我嗓子哑了。练不好晚上我亲自去——那他们就得哭了。', '心事？行伍的人没有心事，只有军令。军令之外的东西，压进枪杆里。', '去吧。站直了走。'] },
            quest: { all: ['我需要你去帮我做件事...'] }
        }, topicRequirements: { quest: { minAffection: 30 } } },
        // v12.6 故事线v2：秘密定义（由 storylines-v2/batch1.js 注入 NPC 实例）
        secrets: {
            'warrior_secret_01': {
                id: 'warrior_secret_01',
                title: '雁回坡之败',
                content: '八年前雁回坡，铁山被一名神秘刀客三招断枪。他不知道对方是谁，只知道那口气咽不下——帐中供着的半截枪杆就是明证。',
                desc: '他八年咽不下的一口气',
                type: 'personal',
                unlockConditions: [
                    { type: 'affection', min: 35 },
                    { type: 'event_completed', eventId: 'warrior01_event_3', eventName: '断掉的枪杆' }
                ],
                unlocked: false
            }
        }
    },

    // ==================== 4. 商人NPC ====================
    merchant_01: {
        id: 'merchant_01',
        name: '贾有道',
        gender: 'male',
        age: 45,
        occupation: '商人',
        location: '帝都·长安',
        icon: '💰',
        appearance: { hair: '梳得整齊', eyes: '精明', clothing: '华丽长袍', features: '笑容满面的胖子' },
        background: { origin: '商业世家', family: '贾家', history: '三代经商，人脉广泛', goal: '建立商业帝国', secret: '暗中从事禁品交易' },
        personalityBig5: { openness: 75, conscientiousness: 60, extraversion: 85, agreeableness: 40, neuroticism: 20 },
        combat: { level: 25, realm: '炼气', layer: 2, attack: 15, defense: 20, speed: 25, skills: ['逃跑术'] },
        profession: { type: 'merchant', level: 90, specialization: '贸易' },
        preferences: { likedItems: [{category: '灵石', multiplier: 3}], dislikedItems: [{category: '赃物', multiplier: 0.5}], giftMultiplier: 0.5 },
        schedule: { default: [
            {time: '08:00-12:00', location: '坊市', activity: '开店'},
            {time: '12:00-14:00', location: '餐馆', activity: '午餐'},
            {time: '14:00-18:00', location: '坊市', activity: '进货'},
            {time: '18:00-22:00', location: '旅馆', activity: '社交'}
        ]},
        dialogueTree: { topics: {
            greeting: { all: ['欢迎光临小店，{playerName}！', '今天想买点什么？'], warm: ['你是我最尊贵的客人。'] },
            market: { all: ['最近灵石涨价了...', '我有个好消息，进了一批好货。'], warm: ['我可以给你特别优惠。'] },
            dungeon: { all: ['听说秘境里有稀有材料出售。'] },
            gossip: { all: ['哎哟{playerName}！稀客稀客——里边请，茶刚沏的。', '您来小店，蓬荜生辉。这话我一天说八十遍——说给您这回，是真心的。', '灵石又涨了。涨吧，行情我记了三十年账，涨跌都有来路——只有一次，我算错过。', '给您留着好货呢，上批剩的，成色您挑。亏本？跟您不谈亏本，谈长久。', '听说某某商人的事了？唉，同行。买卖做得越大，夜里越睡不好。我睡得着——睡得很沉。', '我那账本，夹层……哦，没什么。账本就是账本，您要退换，凭票据，三层夹缝我都给您翻。', '柜台底下空着一块——以前有个孩子，总在那儿写功课，字丑。现在我还老往那儿看。柜台空一块，心里也空一块。', '心事？生意人没有心事，只有盈亏。亏的那笔……不能记账上。记在别处了。', '帮我取件东西。别问是什么货——问了我也不说，但来路干净。我求人办的事里，就这一件干净的。', '慢走！——哎，等等。外头要是见着一个背书箱的少年……没什么。您慢走。'] },
            quest: { all: ['我需要你去帮我取件东西...'] }
        }, topicRequirements: { quest: { minAffection: 30 } } },
        // v13.4 故事线v2·第二批：秘密定义（由 storylines-v2/batch2.js 注入 NPC 实例）
        secrets: {
            'merchant_secret_01': {
                id: 'merchant_secret_01',
                title: '禁品账簿',
                content: '贾有道账本的夹层里另有一本流水——十年禁品交易的暗账。最后一页钉着一沓没寄出的信，全是同一个孩子的笔迹：「父安，勿寻。」十二年前他的独子贾平安被幽阑教掳走，禁品买卖是他换儿子活命的租金。',
                desc: '他奸商面孔下的十二年',
                type: 'personal',
                unlockConditions: [
                    { type: 'affection', min: 35 },
                    { type: 'event_completed', eventId: 'merchant01_event_3', eventName: '夹层的信' }
                ],
                unlocked: false
            }
        }
    },

    // ==================== 5. 长老NPC ====================
    elder_01: {
        id: 'elder_01',
        name: '玄冰子',
        gender: 'male',
        age: 65,
        occupation: '长老',
        location: '天山派',
        icon: '❄️',
        appearance: { hair: '银色长发', eyes: '冰冷', clothing: '蓝色道袍', features: '周身散发着寒气' },
        background: { origin: '天山派', family: '修仙世家', history: '修炼寒冰功法百年，实力深不可测', goal: '突破金丹期', secret: '体内寒冰真气反噬，随时可能走火入魔' },
        personalityBig5: { openness: 30, conscientiousness: 95, extraversion: 15, agreeableness: 20, neuroticism: 60 },
        combat: { level: 90, realm: '金丹', layer: 5, attack: 85, defense: 90, speed: 70, skills: ['寒冰掌', '冰霜剑阵', '绝对零度'] },
        profession: { type: 'teacher', level: 80, specialization: '寒冰功法' },
        preferences: { likedItems: [{category: '冰属性材料', multiplier: 2}], dislikedItems: [{category: '火属性物品', multiplier: 0.3}], giftMultiplier: 0.6 },
        schedule: { default: [
            {time: '00:00-04:00', location: '修炼室', activity: '修炼寒冰功'},
            {time: '04:00-08:00', location: '修炼室', activity: '打坐'},
            {time: '08:00-12:00', location: '议事厅', activity: '处理门派事务'},
            {time: '12:00-14:00', location: '食堂', activity: '用斋'},
            {time: '14:00-18:00', location: '修炼室', activity: '指导弟子'},
            {time: '18:00-24:00', location: '修炼室', activity: '闭关'}
        ]},
        dialogueTree: { topics: {
            greeting: { all: ['有事禀报？', '没什么事就退下吧。'], warm: ['你倒是个可造之材。'] },
            cultivation: { all: ['寒冰功法讲究心如止水。', '你的修为还有很大提升空间。'] },
            sect: { all: ['其他门派不过如此。', '天山派的寒冰功法天下第一。'] },
            gossip: { all: ['来了。站着说——没什么事就退下。', '你倒勤勉。勤勉好——天山的雪，就是勤勉下的。', '寒冰功法，心如止水。心乱的人练这个，是把刀往自己怀里送。', '修为还浅。浅不怕，浮才怕。', '其他门派？不过如此。这话是我说的——天山没了我，才知道谁不过如此。', '花圃你路过没有？那几株雪参长歪了。歪就歪着——药圃的花比人诚实：人蔫了撑着，花蔫了低头。', '本座从不吃药。药是给病人的。天山的天，还压得住本座这块石头。', '心事？哼。冰封的湖底下有没有鱼，湖自己不说，你也不必凿开看。', '替我去北坡取些雪胆草，布裹着手摘，别沾体温。……别问谁病了，山里病的人多了。', '退下吧。——站住。夜里风大，把领子立起来。年轻人不怕冷，老了就知道了。本座，就是老了。'] },
            quest: { all: ['我需要你去取一样东西...'] }
        }, topicRequirements: { quest: { minAffection: 40 } } },
        // v13.5 故事线v2·第三批：秘密定义（由 storylines-v2/batch3.js 注入 NPC 实例）
        secrets: {
            'elder_secret_01': {
                id: 'elder_secret_01',
                title: '雪下的裂',
                content: '玄冰子修炼寒冰功法百年，真气反噬早已入髓——每一次运功都如万针穿髓，撑不过三年。北境三宗环伺，天山派需要他这尊金丹压山石，所以他宁可把药倒进花圃，也绝不当众承认自己是个病人。',
                desc: '他撑着门派的那条裂缝',
                type: 'personal',
                unlockConditions: [
                    { type: 'affection', min: 35 },
                    { type: 'event_completed', eventId: 'elder01_event_3', eventName: '红冰' }
                ],
                unlocked: false
            }
        }
    },

    // ==================== 6. 竞争对手NPC ====================
    rival_01: {
        id: 'rival_01',
        name: '柳随风',
        gender: 'male',
        age: 25,
        occupation: '修士',
        location: '野外',
        icon: '🎭',
        appearance: { hair: '黑色长发', eyes: '狡黠', clothing: '紫色长衫', features: '风度翩翩但眼神危险' },
        background: { origin: '神秘组织', family: '未知', history: '天才修士，但行事不正', goal: '收集所有秘籍', secret: '其实是魔教卧底' },
        personalityBig5: { openness: 85, conscientiousness: 30, extraversion: 90, agreeableness: 15, neuroticism: 50 },
        combat: { level: 70, realm: '筑基', layer: 8, attack: 75, defense: 55, speed: 80, skills: ['幻影步', '迷魂术', '邪剑诀'] },
        profession: { type: 'wanderer', level: 60, specialization: '暗杀' },
        preferences: { likedItems: [{category: '毒药', multiplier: 2}], dislikedItems: [{category: '解毒丹', multiplier: 0.3}], giftMultiplier: 0.7 },
        schedule: { default: [
            {time: '00:00-06:00', location: '野外', activity: '执行任务'},
            {time: '06:00-12:00', location: '城镇', activity: '打探消息'},
            {time: '12:00-14:00', location: '酒馆', activity: '社交'},
            {time: '14:00-20:00', location: '野外', activity: '修炼'},
            {time: '20:00-24:00', location: '据点', activity: '汇报'}
        ]},
        dialogueTree: { topics: {
            greeting: { all: ['哟，这不是{playerName}吗？', '又见面了，有趣的人。'], warm: ['我们或许可以合作...'] },
            cultivation: { all: ['修炼嘛，不择手段才是王道。', '你知道邪剑诀的威力吗？'] },
            sect: { all: ['正道人士都是伪君子。', '魔教其实也没那么坏。'] },
            gossip: { all: ['哟，{playerName}。风把你吹来的？今天刮的是南风。', '又见面了。我这人记性差，记不住事——只记得住人。', '消息我这儿最灵，风里听来的。风不说谎，就是爱添油加醋。', '坊市价又乱了？乱市好——乱市里，人人都是风的熟人。', '合作可以。丑话在前：跟我走的路，风大。风大的地方站不稳的人多——你站得稳吗？', '昨夜我在河边喝了点酒，烧了点纸。……烤火。纸比柴贵，我认。', '有些人该死没死，是我经手的——别多问。风过无痕，我这是给自己留口风。', '心事？我的心事跟我的名字一样，随风。随久了，落不了地。落不了地的东西，别捡。', '帮我送几封信到北边。别看内容——看了，你我今儿就不能这么说话了。', '走了？顺路。你走大路，我走风向。'] },
            quest: { all: ['跟我合作，我有好事分享。'] }
        }, topicRequirements: { quest: { minAffection: 20 } } },
        // v13.5 故事线v2·第三批：秘密定义（由 storylines-v2/batch3.js 注入 NPC 实例）
        secrets: {
            'rival_secret_01': {
                id: 'rival_secret_01',
                title: '两份名册',
                content: '柳随风是幽阑教安插在正道地界的暗桩，代号「随风」。但十年经手的正道俘虏，他一个都没杀，全寻由头放了；那份拖了三个月没上交的正道布防图抄本，最终被他付之一炬——叛教的死罪，他用行动犯了一半。',
                desc: '影子自己都没承认过的立场',
                type: 'personal',
                unlockConditions: [
                    { type: 'affection', min: 35 },
                    { type: 'event_completed', eventId: 'rival01_event_3', eventName: '两份名册' }
                ],
                unlocked: false
            }
        }
    },

    // ==================== 7. 村民NPC ====================
    villager_01: {
        id: 'villager_01',
        name: '张大爷',
        gender: 'male',
        age: 60,
        occupation: '村民',
        location: '太虚山',
        icon: '👴',
        appearance: { hair: '花白', eyes: '慈祥', clothing: '粗布麻衣', features: '满脸皱纹' },
        background: { origin: '新手村', family: '世代务农', history: '一辈子没离开过村子，见过很多修仙者来来往往', goal: '希望孙子能成为修仙者', secret: '年轻时也曾梦想修仙' },
        personalityBig5: { openness: 30, conscientiousness: 70, extraversion: 50, agreeableness: 85, neuroticism: 40 },
        combat: { level: 5, realm: '凡人', layer: 0, attack: 5, defense: 5, speed: 5, skills: [] },
        profession: { type: 'farmer', level: 40, specialization: '农耕' },
        preferences: { likedItems: [{category: '食物', multiplier: 2}], dislikedItems: [{category: '武器', multiplier: 0.5}], giftMultiplier: 1.5 },
        schedule: { default: [
            {time: '05:00-08:00', location: '田地', activity: '耕作'},
            {time: '08:00-12:00', location: '村庄', activity: '闲聊'},
            {time: '12:00-14:00', location: '家中', activity: '午休'},
            {time: '14:00-18:00', location: '田地', activity: '耕作'},
            {time: '18:00-22:00', location: '家中', activity: '休息'}
        ]},
        dialogueTree: { topics: {
            greeting: { all: ['哎呀，是{playerName}啊。', '小伙子/姑娘，有什么事吗？'], warm: ['你就像我孙子一样可爱。'] },
            gossip: { all: ['哎呀，{playerName}！吃了没？没吃上家坐，锅里温着粥。', '小伙子/姑娘，慢点走。村里的路我不扫第二遍，你摔了没人扶。', '你如今是仙师了……仙师也是人变的。你小时候掏鸟窝我可见过——仙师的底细，我门儿清。', '村里又来了个修仙的天才？天才不天才的，肯回来把村口的桥修了，就是好天才。', '后山有妖怪？有。妖怪也得吃饭——它吃它的，你走你的，井水不犯河水。', '房梁上有个木盒，我每年掸一回灰。里头有件袖套，白的。你猜谁的？——不猜了，猜出来我就得讲，讲了我就得哭。老了，哭不动，就先放着。', '当年我要是走了，这会儿大概也在哪座山上飞来飞去。让出去的那张凭信，四十年了。后来他回来看过我一回，坐门槛上陪我抽了袋烟，谁也没提当年——提它干嘛呢，日子都过了。', '帮我去后山采把草药？老腿不中用了。认得的叶子你掐，认不得的别碰——山里的东西，认生。', '回吧回吧，天黑早归。仙师也一样：夜里的黑，对谁都一样黑。'] },
            quest: { all: ['你能帮我去后山采些草药吗？'] }
        }, topicRequirements: { quest: { minAffection: 20 } } },
        // v13.5 故事线v2·第三批：秘密定义（由 storylines-v2/batch3.js 注入 NPC 实例）
        secrets: {
            'villager_secret_01': {
                id: 'villager_secret_01',
                title: '没送出去的拜帖',
                content: '张大爷年轻时真的过了仙门收徒的初选——出发前弟弟染了急症，家里凑不出第二份盘缠，他把凭信让给了同村人，自己留下来守家。房梁上的旧木盒里，洗白的道袍袖套和泛黄的拜帖守了四十年。',
                desc: '田埂上埋了几十年的念想',
                type: 'personal',
                unlockConditions: [
                    { type: 'affection', min: 35 },
                    { type: 'event_completed', eventId: 'villager01_event_3', eventName: '房梁上的木盒' }
                ],
                unlocked: false
            }
        }
    },

    // ==================== 8. 炼丹师NPC ====================
    alchemist_01: {
        id: 'alchemist_01',
        name: '丹大师',
        gender: 'male',
        age: 55,
        occupation: '长老',
        location: '药王谷',
        icon: '🔥',
        appearance: { hair: '黑色短发', eyes: '专注', clothing: '炼丹围裙', features: '手上总有药味' },
        background: { origin: '药王谷', family: '炼丹世家', history: '三代炼丹，经验丰富', goal: '炼制出传说中的九转金丹', secret: '曾经炼丹失败炸毁过一个山洞' },
        personalityBig5: { openness: 60, conscientiousness: 95, extraversion: 25, agreeableness: 60, neuroticism: 50 },
        combat: { level: 40, realm: '筑基', layer: 2, attack: 30, defense: 45, speed: 35, skills: ['炼丹术', '毒雾'] },
        profession: { type: 'crafter', level: 90, specialization: '炼丹' },
        preferences: { likedItems: [{category: '草药', multiplier: 2}, {category: '炼丹材料', multiplier: 2}], dislikedItems: [{category: '武器', multiplier: 0.5}], giftMultiplier: 1.0 },
        schedule: { default: [
            {time: '06:00-12:00', location: '炼丹房', activity: '炼丹'},
            {time: '12:00-14:00', location: '药房', activity: '采药'},
            {time: '14:00-18:00', location: '炼丹房', activity: '研究丹方'},
            {time: '18:00-22:00', location: '住所', activity: '休息'}
        ]},
        dialogueTree: { topics: {
            greeting: { all: ['欢迎来到炼丹房，{playerName}。', '需要什么丹药？'], warm: ['你是我见过最有天赋的炼丹学徒。'] },
            cultivation: { all: ['丹药可以辅助修炼，但不能依赖。', '你知道各种丹药的功效吗？'] },
            market: { all: ['最近药材价格涨了。', '稀有材料不好找啊。'] },
            gossip: { all: ['来了。小声些——炉上的丹到了火候，惊不得。', '{playerName}，你的手稳。炼丹先看手：手不稳的，我这儿不留。', '丹药是拐杖，不是腿。瘸了拄拐可以，腿好好的拄拐——那是懒。', '九转金丹？传说罢了。传说里的东西，火候写不进方子。', '药材又涨。涨跌是市价，火候是丹价——两码事，别混。', '我这炉，三十年没碰过武火。为什么只用文火？……文火慢。慢，来得及。', '旧丹房那边塌了半面的山洞，别去。底下压着半卷丹方，两人合注的——取不出来了。也不想取。', '心事？炼丹的人，心事都成烟了——从烟囱走，不搁心里。', '帮我盯一炷香的火。文火别动它。烧过了时辰你喊我；没烧过，你就看着。看着，也是炼丹的一半。', '去吧，慢走。这世上除了火候，没什么急事。'] },
            quest: { all: ['我需要一些稀有药材来炼制新药。'] }
        }, topicRequirements: { quest: { minAffection: 30 } } },
        // v13.4 故事线v2·第二批：秘密定义（由 storylines-v2/batch2.js 注入 NPC 实例）
        secrets: {
            'alchemist_secret_01': {
                id: 'alchemist_secret_01',
                title: '塌方的旧丹房',
                content: '三十年前，丹大师与师弟合炉炼续命丹救中毒的师父。他贪快私自加了三成武火，丹鼎炸塌了半面山洞——师弟把他推进安全死角，自己被埋在了里面。师父最后也没救回来。从此他只敢用文火，那座旧丹房的原址上，还压着师弟的遗骨和半卷二人合注的丹方。',
                desc: '他三十年不敢碰武火的缘故',
                type: 'personal',
                unlockConditions: [
                    { type: 'affection', min: 35 },
                    { type: 'event_completed', eventId: 'alchemist01_event_3', eventName: '烧熔的护心镜' }
                ],
                unlocked: false
            }
        }
    },

    // ==================== 9. 铁匠NPC ====================
    craftsman_01: {
        id: 'craftsman_01',
        name: '铁匠老王',
        gender: 'male',
        age: 40,
        occupation: '长老',
        location: '铸剑山庄',
        icon: '🔨',
        appearance: { hair: '短发', eyes: '坚定', clothing: '皮围裙', features: '肌肉发达，满身汗水' },
        background: { origin: '炎城', family: '铁匠世家', history: '祖传铸剑技艺，擅长打造法器', goal: '铸造出传世神兵', secret: '曾经打造过一把被诅咒的剑' },
        personalityBig5: { openness: 40, conscientiousness: 90, extraversion: 35, agreeableness: 65, neuroticism: 30 },
        combat: { level: 50, realm: '筑基', layer: 3, attack: 60, defense: 50, speed: 40, skills: ['锤击', '铁甲术'] },
        profession: { type: 'crafter', level: 85, specialization: '铸剑' },
        preferences: { likedItems: [{category: '矿石', multiplier: 2}, {category: '武器', multiplier: 1.5}], dislikedItems: [{category: '丹药', multiplier: 0.5}], giftMultiplier: 1.0 },
        schedule: { default: [
            {time: '06:00-12:00', location: '铁匠铺', activity: '打铁'},
            {time: '12:00-14:00', location: '餐馆', activity: '午餐'},
            {time: '14:00-18:00', location: '铁匠铺', activity: '锻造'},
            {time: '18:00-22:00', location: '家中', activity: '休息'}
        ]},
        dialogueTree: { topics: {
            greeting: { all: ['欢迎，{playerName}！需要打造什么？', '有什么需要帮忙的吗？'], warm: ['你的装备我来打造，放心！'] },
            market: { all: ['矿石价格又涨了。', '好材料可遇不可求。'] },
            gossip: { all: ['来了？炉子刚旺——打点什么，说话。', '{playerName}，你的剑该开刃了。拿来，不收钱——收你一句实话：近来夜里，睡得好不好？', '装备我来打，放心。这双手三十年没出过一把烂剑。……烂的，只有一把。', '矿石涨价？铁不背这个锅，涨的是人心里那点贪。好料难找——找得到的，我都在找。', '墙上那块粉笔板看见没？十七道杠。徒弟问是记工，同行问是记账——都不是。第三道杠在川东，今年还得动身。', '我打的剑，一把一把都有数。有一把不在数里，在命里。哪天你在江湖上听见一把剑，夜里会哭——绕开走。它认得出打它的人。这话，我只说给你。', '帮我带趟货：三把农具，送李家村。农具收钱，剑不收——农具养人，剑，不一定。', '心事？打铁的人心事都在锤上——一锤一个，敲扁了就凉了。', '走好。——等等，锤子递我，趁炉还红。夜里打铁，吵是吵，心里静。'] },
            quest: { all: ['我需要你去帮我找一些稀有矿石。'] }
        }, topicRequirements: { quest: { minAffection: 30 } } },
        // v13.5 故事线v2·第三批：秘密定义（由 storylines-v2/batch3.js 注入 NPC 实例）
        secrets: {
            'craftsman_secret_01': {
                id: 'craftsman_secret_01',
                title: '咒剑「哭夜」',
                content: '铁匠老王三十岁那年贪利接黑活，用来历不明的陨铁铸成咒剑「哭夜」——买主携剑屠门之后，剑像活了似的在江湖流转，十七任主人家家横死。他墙上的粉笔板记了二十年：十七道划痕，十七个地名，是他一路追赶、试图赶在悲剧前买回咒剑的足迹。',
                desc: '他用二十年追自己造的孽',
                type: 'personal',
                unlockConditions: [
                    { type: 'affection', min: 35 },
                    { type: 'event_completed', eventId: 'craftsman01_event_3', eventName: '墙里的账本' }
                ],
                unlocked: false
            }
        }
    },

    // ==================== 10. 神秘老者NPC ====================
    mysterious_01: {
        id: 'mysterious_01',
        name: '神秘老者',
        gender: 'male',
        age: 99,
        occupation: '隐士',
        location: '洞府',
        icon: '🧙',
        appearance: { hair: '白色长发', eyes: '深邃如星空', clothing: '破旧道袍', features: '胡须及腰，眼神神秘' },
        background: { origin: '未知', family: '未知', history: '无人知晓他的来历，据说活了上百年', goal: '寻找传人', secret: '曾是上古大能，因遭背叛而隐居' },
        personalityBig5: { openness: 95, conscientiousness: 50, extraversion: 10, agreeableness: 70, neuroticism: 20 },
        combat: { level: 95, realm: '元婴', layer: 1, attack: 90, defense: 85, speed: 80, skills: ['上古法术', '时空扭曲', '灵魂攻击'] },
        profession: { type: 'wanderer', level: 95, specialization: '上古功法' },
        preferences: { likedItems: [{category: '古籍', multiplier: 3}], dislikedItems: [{category: '现代法器', multiplier: 0.5}], giftMultiplier: 2.0 },
        schedule: { default: [
            {time: '00:00-06:00', location: '山洞', activity: '修炼'},
            {time: '06:00-12:00', location: '山洞', activity: '打坐'},
            {time: '12:00-18:00', location: '山林', activity: '游历'},
            {time: '18:00-24:00', location: '山洞', activity: '冥想'}
        ]},
        dialogueTree: { topics: {
            greeting: { all: ['哦？又一个来访者...', '{playerName}，你与我见过的其他人不同。'], warm: ['你我有缘，我便传你一些本事。'] },
            cultivation: { all: ['真正的修炼，在于心境。', '你知道上古修炼之法吗？'], warm: ['我可以传授你失传的上古功法。'] },
            personal: { all: ['我的过去...说来话长。', '我曾经也和你一样年轻。'], warm: ['我选你为传人，因为...你让我看到了当年的自己。'] },
            gossip: { all: ['哦？又是你。洞府的门，你敲得比风还轻——风我都记得住，你更记得住。', '{playerName}，你与我见过的人，都不同。他们求长生，你——你好像只是路过。', '真正的修炼在心境。这话人人会说；说的人里，一万年有一个当真。', '上古的功法？功法没失传，失传的是肯下笨功夫的人。', '你让我看到了……当年的一些人。他们比你吵。吵，也好。', '洞府里四盏长明灯，三盏亮着。你数过。——第四盏别点。不是规矩，是我的事，还没到。', '万年前我抽过一根签。抽中的人总觉得是天意——天意个屁。有些天意，是人心。', '我的过去说来话长，长过你走的所有路。拣短的说：我曾有三个朋友。「曾经」这个词，就是我全部的过去。', '替我看样东西：北边的天，最近夜里可有异色？看清了回来告诉我什么颜色。我等这个颜色，等了很久了。', '去吧。路上若遇见肯为你做局的人——做局害你的，杀；做局保你的，也别轻饶，先问为什么。问清楚了……替我谢谢他们。'] },
            quest: { all: ['我需要你去完成一件重要的事情...'] }
        }, topicRequirements: { personal: { minAffection: 50 }, quest: { minAffection: 40 } } },
        // v13.5 故事线v2·第三批：秘密定义（由 storylines-v2/batch3.js 注入 NPC 实例）
        secrets: {
            'mysterious_secret_01': {
                id: 'mysterious_secret_01',
                title: '第四支签',
                content: '神秘老者是上古最后一位守界人。万年前天隙将破，补天需三人以身引灵，四人抽签——他「抽中」了。后来才知道签是三位挚友做了局：他们合谋保他，因为他天赋最高、路最长。他一怒掀了祭坛，封印迟滞三百年才合拢，三人在迟滞的妖潮中魂飞。洞府里四座长明灯，三亮一冷——那盏冷的，他几千年不敢点。',
                desc: '他恨了一万年、也不敢碰的那盏灯',
                type: 'personal',
                unlockConditions: [
                    { type: 'affection', min: 35 },
                    { type: 'event_completed', eventId: 'mysterious01_event_3', eventName: '第四盏灯' }
                ],
                unlocked: false
            }
        }
    },

    // v20.79 第五批少林收官：破戒僧·无咎（特殊紧凑线主角，独立 id，不占掌门位、不入任何名册）。
    // 与释玄慈方丈（远景一句「留他在灶上，是少林寺的福气」）、竺照禅（005 戒堂问话一场对手戏）正典共存；
    // 豁口钵自锔、戒折页第五百零一条「不欺心」在 wujiu 线展开；酒具全禁（破酒戒旧事只一句「药酒」带过）
    shaolin_wujiu: {
        id: 'shaolin_wujiu',
        name: '无咎',
        gender: 'male',
        age: 28,
        occupation: '少林寺火头僧（被戒堂公开除名的破戒僧，却没被逐出山门——他烧的饭全寺离不开）',
        location: '少林寺',
        icon: '🍲',
        appearance: { hair: '烧短的头发茬', eyes: '笑起来先看你吃没吃饱', clothing: '旧僧袍挽到肘，围裙上灶灰渐层洗不掉', features: '双手烫疤层层，一把大铲磨得发亮' },
        background: {
            origin: '逃荒年间被少林灶房收留的孩子，从挑水烧火做到火头',
            family: '没有——灶房是家，全寺僧众是家人',
            history: '少林建寺以来唯一一个被戒堂公开除名的破戒僧，除名文书他自己裱在灶房墙上「辟邪」。破的戒条条是为了别人：喝过一碗药酒是替人暖身续命、撒过的谎全替人挡过灾、动过的那回刀是挡在香客身前。讲自己破戒的事像讲别人的笑话，口头禅「佛看见，也会懂的。」',
            goal: '把第五百零一条戒——「不欺心」——念完',
            secret: '破色戒那一夜无人知晓，是你来的那晚；他在戒折页上添了「第五百零一条：不欺心」，然后坐了一夜'
        },
        personalityBig5: { openness: 70, conscientiousness: 60, extraversion: 66, agreeableness: 76, neuroticism: 30 },
        combat: { level: 58, realm: '金丹', layer: 1, attack: 66, defense: 60, speed: 52, skills: ['铁臂铲法', '灶火金刚', '破戒禅心'] },
        schedule: { default: [
            {time: '03:00-06:00', location: '灶房', activity: '生火熬粥'},
            {time: '06:00-09:00', location: '斋堂', activity: '行早斋'},
            {time: '09:00-11:00', location: '后山', activity: '挑水劈柴'},
            {time: '11:00-14:00', location: '灶房', activity: '备午斋'},
            {time: '14:00-17:00', location: '菜园', activity: '种菜担粪'},
            {time: '17:00-20:00', location: '灶房', activity: '备晚斋'},
            {time: '20:00-22:00', location: '灶房', activity: '擦钵、看墙上那份除名文书'}
        ]}
    }
};

/**
 * SPECIAL_NPC_DEFINITIONS — 固定核心NPC定义表
 * 优先级高于 sect-internal.js 中 registerSectNPCs 的随机生成
 * 当注册门派NPC时，若该NPC ID 在此表中，则使用固定定义而非随机生成
 *
 * 用途：确保绯泪（修罗宫主）等核心NPC的数据在每次读档/新游戏时一致
 * 格式：NPC ID → { name, gender, age, occupation, location, ... }
 */
var SPECIAL_NPC_DEFINITIONS = {
    'sect_leader_修罗宫': {
        name: '修罗女',
        trueName: '绯泪',       // 真名，用于个人事件剧情
        gender: 'female',
        age: 28,
        occupation: '宫主',
        location: '修罗宫',
        icon: '👑',
        appearance: { hair: '黑红长发', eyes: '绯红', clothing: '黑红纱衣', features: '冷艳绝伦' },
        background: {
            origin: '江南世家→寒烟门→修罗宫',
            family: '江南世族（已灭）',
            history: '江南世族出身，为郗寒舟踏入修仙路。寒烟门灭门后亲手杀了他，创立修罗宫',
            goal: '守护修罗宫，寻找值得信任的人',
            secret: '真名绯泪，冰火双灵根，寒烟门灭门真相'
        },
        personalityBig5: { openness: 40, conscientiousness: 60, extraversion: 30, agreeableness: 20, neuroticism: 70 },
        mainAttributes: { strength: 75, dexterity: 70, intelligence: 65, willpower: 80, constitution: 60, meridian: 85 },
        combatSkills: { 内功: 85, 轻功: 70, 绝技: 80, 剑法: 90, 拳掌: 50, 刀法: 40, 长兵: 30, 奇门: 60, 射术: 20 },
        combat: { level: 80, realm: '金丹', layer: 9, attack: 85, defense: 70, speed: 80 },
        skills: ['修罗杀意', '血影剑法', '天魔舞'],
        relationship: { affection: 20, trust: 15, respect: 0, favor: 0 },
        state: { mood: 50, stress: 30 },
        isFemale: true,
        _isFixedDefinition: true
    },
    // v20.3 男主·冶砚（铸剑山庄少庄主，铸剑师）——火性赤诚，与欧冶子（masters 教学线）并存
    'sect_leader_铸剑山庄': {
        name: '冶砚',
        trueName: '冶砚',
        title: '炉火少主',
        gender: 'male',
        age: 26,
        occupation: '少庄主',
        location: '铸剑山庄',
        icon: '🔥',
        appearance: { hair: '黑发短束，额前一缕被火烤得焦黄', eyes: '深琥珀，炉火映得发亮', clothing: '皮质铸剑围裙，袖口常年熏黑', features: '眉骨一道浅烫疤，笑起来露虎牙' },
        background: {
            origin: '孤儿→铸剑山庄',
            family: '欧冶子义子（生父母不详）',
            history: '五岁被欧冶子从炉灰里捡回，自幼在炉前长大。铸剑天赋惊人，二十岁已成庄中第一铸剑师。性如炉火，直来直去，不擅言辞；一诺千金。怕冷却从不说',
            goal: '铸出一柄配得上「天下第一」的剑，找到配得上这柄剑的人',
            secret: '炉火秘诀的真正来源；他怕冷的来历；为谁铸了三年未成的剑'
        },
        personalityBig5: { openness: 60, conscientiousness: 78, extraversion: 58, agreeableness: 65, neuroticism: 40 },
        mainAttributes: { strength: 70, dexterity: 75, intelligence: 65, willpower: 80, constitution: 75, meridian: 70 },
        combatSkills: { 内功: 75, 轻功: 60, 绝技: 72, 剑法: 78, 拳掌: 65, 刀法: 55, 长兵: 60, 奇门: 40, 射术: 30 },
        combat: { level: 72, realm: '金丹', layer: 4, attack: 76, defense: 68, speed: 65 },
        skills: ['天工锻诀', '炉火内功', '玄铁剑法'],
        relationship: { affection: 14, trust: 10, respect: 0, favor: 0 },
        state: { mood: 60, stress: 28 },
        _isFixedDefinition: true
    },
    // v20.3 男主·芩木（药王谷谷主继承人，医毒双修）——温润锋芒，与孙思邈（masters 教学线）并存
    'sect_leader_药王谷': {
        name: '芩木',
        trueName: '芩木',
        title: '温润毒医',
        gender: 'male',
        age: 28,
        occupation: '谷主继承人',
        location: '药王谷',
        icon: '🌿',
        appearance: { hair: '墨黑长发松松绾起，簪一支药草', eyes: '浅褐，温润如茶汤', clothing: '青白药袍，袖口常年染着药渍', features: '眉目温润，笑起来眼底却不达底' },
        background: {
            origin: '医家遗孤→药王谷',
            family: '药王谷老谷主之徒（父母为医者，死于瘟）',
            history: '七岁入药王谷，医术天赋惊人，二十岁已能独当一面。性温润，话不多但句句到点；笑得温润却眼底不达底——温润是修行的戒律，也是藏毒的壳',
            goal: '医该医的人，毒该毒的人，分清这两者',
            secret: '温润的来历；他学毒的真正缘由；那张救不活的人的旧方'
        },
        personalityBig5: { openness: 72, conscientiousness: 82, extraversion: 45, agreeableness: 70, neuroticism: 52 },
        mainAttributes: { strength: 50, dexterity: 78, intelligence: 88, willpower: 75, constitution: 62, meridian: 80 },
        combatSkills: { 内功: 76, 轻功: 70, 绝技: 74, 剑法: 45, 拳掌: 40, 刀法: 25, 长兵: 35, 奇门: 80, 射术: 30 },
        combat: { level: 70, realm: '金丹', layer: 5, attack: 68, defense: 65, speed: 72 },
        skills: ['青囊经', '百毒不侵体', '金针渡穴'],
        relationship: { affection: 14, trust: 10, respect: 0, favor: 0 },
        state: { mood: 58, stress: 32 },
        _isFixedDefinition: true
    },
    // v20.3 男主·昴既明（茅山派青年符箓伏魔道士，阴阳眼）——与茅山老祖（masters 教学线）并存
    'sect_leader_茅山派': {
        name: '昴既明',
        trueName: '昴既明',
        title: '阴阳道士',
        gender: 'male',
        age: 27,
        occupation: '伏魔首席',
        location: '茅山派',
        icon: '🪔',
        appearance: { hair: '墨黑长发松挽，插一支桃木簪', eyes: '右眼深褐，左眼底泛极淡的银——阴阳眼', clothing: '玄青道袍，袖口藏朱砂', features: '眉目清冷如月光，眉心一道朱砂点' },
        background: {
            origin: '荒村孤儿→茅山派',
            family: '不详（自幼被茅山老祖捡回）',
            history: '七岁那年高烧险死，醒来后开了阴阳眼，能见鬼神。茅山老祖收为关门弟子，专司伏魔渡魂。性冷淡寡言——见惯生死鬼神的人，话少。执拗于「渡」与「灭」之分',
            goal: '渡该渡的魂，灭该灭的魔，分清这两者',
            secret: '阴阳眼的来历（他幼时死过一次）；一道画了三年没画完的渡魂符；他为何只渡不灭'
        },
        personalityBig5: { openness: 68, conscientiousness: 85, extraversion: 28, agreeableness: 58, neuroticism: 48 },
        mainAttributes: { strength: 52, dexterity: 76, intelligence: 85, willpower: 82, constitution: 60, meridian: 78 },
        combatSkills: { 内功: 78, 轻功: 70, 绝技: 75, 剑法: 50, 拳掌: 38, 刀法: 30, 长兵: 35, 奇门: 92, 射术: 35 },
        combat: { level: 71, realm: '金丹', layer: 5, attack: 70, defense: 66, speed: 68 },
        skills: ['天罡伏魔诀', '阴阳瞳', '渡魂符'],
        relationship: { affection: 14, trust: 10, respect: 0, favor: 0 },
        state: { mood: 52, stress: 30 },
        _isFixedDefinition: true
    },
    // v20.3 男主·赫渊（法名净渊，金刚宗苦行僧）——与鸠摩智（masters 教学线）并存
    'sect_leader_金刚宗': {
        name: '赫渊',
        trueName: '赫渊',
        title: '苦行尊者',
        gender: 'male',
        age: 29,
        occupation: '法王继承人',
        location: '金刚宗',
        icon: '📿',
        appearance: { hair: '光头，戒疤九点', eyes: '深黑沉静，像井', clothing: '灰色苦行僧衣，右臂袒露缠着金刚线', features: '眉目端正庄严，唇线紧抿——修闭口禅' },
        background: {
            origin: '弃婴→金刚宗',
            family: '不详（襁褓弃于金刚塔下）',
            history: '弃婴被金刚宗收，自幼修苦行+闭口禅，炼体大成。法名净渊。性沉默——闭口禅多年，开口字字千金。守戒极严，肉身苦行，直至动情破戒',
            goal: '以肉身证道，还清欠的一段命',
            secret: '他破过一次戒（为谁）；苦行是为还一段命；闭口禅的真正来历'
        },
        personalityBig5: { openness: 50, conscientiousness: 90, extraversion: 15, agreeableness: 62, neuroticism: 55 },
        mainAttributes: { strength: 88, dexterity: 60, intelligence: 72, willpower: 90, constitution: 92, meridian: 70 },
        combatSkills: { 内功: 80, 轻功: 55, 绝技: 78, 剑法: 40, 拳掌: 92, 刀法: 50, 长兵: 45, 奇门: 30, 射术: 25 },
        combat: { level: 73, realm: '金丹', layer: 5, attack: 80, defense: 85, speed: 58 },
        skills: ['金刚不坏神功', '龙象般若功', '闭口禅'],
        relationship: { affection: 14, trust: 10, respect: 0, favor: 0 },
        state: { mood: 50, stress: 34 },
        _isFixedDefinition: true
    },
    'sect_leader_少林寺': {
        name: '释玄慈',
        gender: 'male',
        age: 75,
        occupation: '方丈',
        location: '少林寺',
        icon: '🧘',
        appearance: { hair: '白色短发', eyes: '深邃', clothing: '袈裟', features: '宝相庄严' },
        background: { origin: '少林寺', family: '佛门', history: '少林寺方丈，佛法精深', goal: '弘扬佛法' },
        personalityBig5: { openness: 50, conscientiousness: 90, extraversion: 20, agreeableness: 70, neuroticism: 10 },
        mainAttributes: { strength: 70, dexterity: 50, intelligence: 80, willpower: 90, constitution: 85, meridian: 75 },
        combatSkills: { 内功: 90, 轻功: 40, 绝技: 70, 拳掌: 85, 剑法: 75, 刀法: 30, 长兵: 60, 奇门: 20, 射术: 10 },
        combat: { level: 85, realm: '金丹', layer: 9, attack: 70, defense: 90, speed: 60 },
        skills: ['少林长拳', '达摩剑法', '易筋经', '金刚不坏神功'],
        relationship: { affection: 15, trust: 10, respect: 0, favor: 0 },
        state: { mood: 60, stress: 20 },
        _isFixedDefinition: true
    },
    'sect_leader_武当派': {
        name: '张三丰',
        gender: 'male',
        age: 120,
        occupation: '掌门',
        location: '武当派',
        icon: '🧙',
        appearance: { hair: '白色长发', eyes: '慈祥', clothing: '道袍', features: '仙风道骨' },
        background: { origin: '武当派', family: '道门', history: '武当派开山祖师', goal: '参悟天道' },
        personalityBig5: { openness: 80, conscientiousness: 70, extraversion: 30, agreeableness: 80, neuroticism: 5 },
        mainAttributes: { strength: 60, dexterity: 75, intelligence: 95, willpower: 90, constitution: 70, meridian: 90 },
        combatSkills: { 内功: 95, 轻功: 80, 绝技: 85, 拳掌: 70, 剑法: 90, 刀法: 20, 长兵: 30, 奇门: 40, 射术: 15 },
        combat: { level: 95, realm: '元婴', layer: 3, attack: 85, defense: 85, speed: 80 },
        skills: ['太极拳', '太极剑', '纯阳无极功'],
        relationship: { affection: 15, trust: 10, respect: 0, favor: 0 },
        state: { mood: 65, stress: 10 },
        _isFixedDefinition: true
    },
    // v20.2 天山派剑修·琤霄凌（人称"雪隐剑姬"）——外冷内热剑修感情线核心NPC
    // 与天山童姥（SECT_DEEP_DATA masters 掌门）并存：童姥隐修，霄凌代掌天山日常、为剑道首席
    'sect_leader_天山派': {
        name: '琤霄凌',
        trueName: '琤霄凌',       // 真名即琤霄凌，江湖称号"雪隐剑姬"
        title: '雪隐剑姬',
        gender: 'female',
        age: 30,                // 修为驻颜，外貌如二十许人
        occupation: '代掌门首席',
        location: '天山派',
        icon: '❄️',
        appearance: { hair: '银白长发高束，以一根素银簪绾住', eyes: '浅冰蓝，看人时像在量一柄剑', clothing: '霜白窄袖剑衣', features: '眉目清冷如雪后初晴，右腕常年缠一道束剑的素绫' },
        background: {
            origin: '北地寒门→天山派',
            family: '寒门孤女（父母早亡）',
            history: '八岁入天山，与师姐琤青鸾相依。师姐琤青鸾是同族堂姊——琤家那一辈，就她们两个上了山。青鸾殁后，天山门册上，再没添过第二个琤姓。十八岁那年天魔袭击天山，师姐以己身挡下她致命一击、血溅霜鸣剑。此后她再不笑、只守剑。二十六岁代童姥掌天山日常，江湖称"雪隐剑姬"',
            goal: '守好师姐留下的霜鸣，守住天山，等一个配得上拔霜鸣的人',
            secret: '霜鸣剑的真正来历；她为何从不拔剑出鞘；守剑二十年无人知她其实在等一句"你可以放下了"'
        },
        personalityBig5: { openness: 55, conscientiousness: 88, extraversion: 22, agreeableness: 40, neuroticism: 58 },
        mainAttributes: { strength: 62, dexterity: 88, intelligence: 80, willpower: 85, constitution: 60, meridian: 82 },
        combatSkills: { 内功: 80, 轻功: 78, 绝技: 72, 剑法: 92, 拳掌: 40, 刀法: 25, 长兵: 50, 奇门: 45, 射术: 30 },
        combat: { level: 74, realm: '金丹', layer: 5, attack: 78, defense: 66, speed: 82 },
        skills: ['天山剑诀', '霜鸣剑法', '雪隐步'],
        relationship: { affection: 12, trust: 10, respect: 0, favor: 0 },
        state: { mood: 42, stress: 35 },
        isFemale: true,
        _isFixedDefinition: true
    },
    // v20.2 五仙教教主·蓝凤凰——妖媚蛊女感情线核心NPC
    // 五仙教本为母系，教主历代皆女；与 SECT_DEEP_DATA masters 教主「蓝凤凰」同名（秘密按名注入，一致）
    'sect_leader_五仙教': {
        name: '蓝凤凰',
        trueName: '蓝凤凰',       // 江湖称号"蛊仙"
        title: '蛊仙',
        gender: 'female',
        age: 28,
        occupation: '教主',
        location: '五仙教',
        icon: '🦋',
        appearance: { hair: '乌黑长发松松挽起，插一支银蝶簪', eyes: '狭长凤目，眼尾微挑', clothing: '靛蓝苗银绣蛊纹窄袖衣', features: '妖媚入骨，行走间似有蝶影随行' },
        background: {
            origin: '苗疆五仙教圣女→教主',
            family: '五仙教历代母系传承',
            history: '十岁养出第一只本命蛊，十五岁继圣女位。十八岁那年动了凡情，所养「心蛊」嗜她真情、几欲破壳反噬——她亲手以忘情散断了那段情，自此再不近人。二十六岁接掌教主，江湖称"蛊仙"',
            goal: '守住心蛊不破，守住五仙教，不让任何人再因情蛊而死',
            secret: '心蛊的真正来历；她为何妖媚却从不动情；以忘情散续命的代价'
        },
        personalityBig5: { openness: 70, conscientiousness: 65, extraversion: 65, agreeableness: 35, neuroticism: 60 },
        mainAttributes: { strength: 55, dexterity: 82, intelligence: 85, willpower: 70, constitution: 58, meridian: 80 },
        combatSkills: { 内功: 78, 轻功: 75, 绝技: 88, 剑法: 50, 拳掌: 35, 刀法: 30, 长兵: 40, 奇门: 90, 射术: 25 },
        combat: { level: 76, realm: '金丹', layer: 5, attack: 72, defense: 64, speed: 80 },
        skills: ['万蛊诀', '蝶影步', '忘情散'],
        relationship: { affection: 14, trust: 10, respect: 0, favor: 0 },
        state: { mood: 55, stress: 30 },
        isFemale: true,
        _isFixedDefinition: true
    },
    // v12.3 百花谷谷主·温蘅（人称"花仙子"）——温柔医者感情线核心NPC
    'sect_leader_百花谷': {
        name: '温蘅',
        trueName: '温蘅',       // 真名即温蘅，江湖称号"花仙子"
        title: '花仙子',
        gender: 'female',
        age: 36,                // 天赋异禀，三十余岁已至金丹，容貌如二十许人
        occupation: '谷主',
        location: '百花谷',
        icon: '🌸',
        appearance: { hair: '乌黑长发挽松松髻，簪一朵时令花', eyes: '琥珀色，永远含笑', clothing: '淡青纱衣', features: '容貌如二十许人，笑眼弯弯' },
        background: {
            origin: '白鹿泽药农之女→百花谷',
            family: '药农世家（已故）',
            history: '六岁拜入百花谷，少年时性情冷厉；十九岁师父临终告诫"医者手里握着人命，不能带情绪"，从此学会微笑。二十岁接掌谷主之位，以医术与迷幻术立派，人称花仙子',
            goal: '守住百花谷，让医术庇护无力之人',
            secret: '温柔的来历；精通毒术的真正缘由；能看穿所有人却二十年没人看穿过她'
        },
        personalityBig5: { openness: 75, conscientiousness: 85, extraversion: 55, agreeableness: 90, neuroticism: 45 },
        mainAttributes: { strength: 45, dexterity: 70, intelligence: 88, willpower: 82, constitution: 65, meridian: 80 },
        combatSkills: { 内功: 78, 轻功: 72, 绝技: 70, 剑法: 68, 拳掌: 35, 刀法: 20, 长兵: 25, 奇门: 85, 射术: 40 },
        combat: { level: 72, realm: '金丹', layer: 4, attack: 60, defense: 62, speed: 74 },
        skills: ['百花医经', '迷幻术', '百花剑法'],
        relationship: { affection: 15, trust: 12, respect: 0, favor: 0 },
        state: { mood: 70, stress: 25 },
        isFemale: true,
        _isFixedDefinition: true
    },
    // v20.72 女主·夙孤鸿（峨眉派戒律首座，代掌门务）——端庄持戒感情线核心NPC
    // 与灭绝师太（掌门，后山闭关）并存：师太隐修，孤鸿执戒律、代掌门务
    'sect_leader_峨眉派': {
        name: '夙孤鸿',
        trueName: '夙孤鸿',     // 江湖称"峨眉剑戒"
        title: '峨眉剑戒',
        gender: 'female',
        age: 24,
        occupation: '戒律首座',
        location: '峨眉派',
        icon: '🪷',
        appearance: { hair: '墨黑长发束得一丝不苟，银戒簪绾住', eyes: '杏眼清亮，眉目端严，极少笑', clothing: '缟色素劲装，腰间悬一把磨亮的木戒尺', features: '剑上系一截褪色旧红剑穗，打了三道结' },
        background: {
            origin: '雪夜孤儿→峨眉派',
            family: '不详（襁褓弃于峨眉山门，窗外孤雁哀鸣一夜）',
            history: '被前任戒律首座寂度拾回抚养，取名孤鸿——「孤鸿哀鸣，其声也远」。自幼持戒如山，十八岁接戒尺，三年前师父在金顶夜袭中战殁，她接掌戒律、代掌门务。灭绝师太自此闭死关。她夜夜巡金顶，风雨无阻',
            goal: '守住师父留下的戒，守住金顶，想明白戒尺上第七条该刻什么',
            secret: '师父留白的第七条戒；她夜夜巡金顶的真正缘由；刀子嘴是怕一软就辜负师父'
        },
        personalityBig5: { openness: 58, conscientiousness: 90, extraversion: 30, agreeableness: 55, neuroticism: 45 },
        mainAttributes: { strength: 60, dexterity: 84, intelligence: 80, willpower: 86, constitution: 62, meridian: 80 },
        combatSkills: { 内功: 80, 轻功: 76, 绝技: 74, 剑法: 90, 拳掌: 45, 刀法: 25, 长兵: 50, 奇门: 40, 射术: 30 },
        combat: { level: 73, realm: '金丹', layer: 5, attack: 76, defense: 68, speed: 78 },
        skills: ['峨眉剑戒', '素心剑意', '金顶云步'],
        relationship: { affection: 14, trust: 10, respect: 0, favor: 0 },
        state: { mood: 48, stress: 38 },
        isFemale: true,
        _isFixedDefinition: true
    },
    // v20.72 男主·竺听雨（华山派大师兄、代掌门）——笑傲担待型感情线核心NPC
    // 与前掌门（师父）并存于追忆；风不平（师叔祖）线内回归坐镇
    'sect_leader_华山派': {
        name: '竺听雨',
        trueName: '竺听雨',     // 江湖称"华山首座"
        title: '华山首座',
        gender: 'male',
        age: 28,
        occupation: '代掌门',
        location: '华山派',
        icon: '🌧️',
        appearance: { hair: '黑发高束，松针常落肩头', eyes: '剑眉星目，嘴角总噙着一点笑', clothing: '青衫剑袍，腰间挂一只旧酒葫芦', features: '右手虎口一层厚茧，眉间一道淡旧疤' },
        background: {
            origin: '幼孤→华山派前掌门亲传',
            family: '不详（八岁入华山山门）',
            history: '十年前华山遭逢大变，外敌勾内鬼夜袭，前掌门杀退来人后重伤七日而逝，临终一句「华山，交给你了」。十八岁的竺听雨接下这个字，一人撑起凋零的华山：账他垫、伤他扛、笑他给。佩剑「听雨」是师父断剑重铸——师父没听完的雨，他替他听',
            goal: '重振华山门楣；在思过崖续完师父石壁剑意的最后一笔「归」',
            secret: '师父身故那夜的真相；华山账上他私产填了多少；「归」字为何一个人刻不出'
        },
        personalityBig5: { openness: 65, conscientiousness: 85, extraversion: 72, agreeableness: 68, neuroticism: 58 },
        mainAttributes: { strength: 72, dexterity: 85, intelligence: 76, willpower: 88, constitution: 74, meridian: 78 },
        combatSkills: { 内功: 78, 轻功: 80, 绝技: 75, 剑法: 90, 拳掌: 55, 刀法: 40, 长兵: 45, 奇门: 35, 射术: 25 },
        combat: { level: 74, realm: '金丹', layer: 6, attack: 78, defense: 68, speed: 80 },
        skills: ['华山剑法', '听雨剑意', '松风步'],
        relationship: { affection: 14, trust: 10, respect: 0, favor: 0 },
        state: { mood: 62, stress: 40 },
        _isFixedDefinition: true
    },

    // v20.74 第一批扩线：唐门·晏万解（女主）。与门主唐无痕（其父）、长老唐影/唐铸、唐老太太（祖母辈老封君）并存：
    // 无痕主门、老太太坐镇后堂、万解掌毒堂并为亲点下任当家——牵机散旧案与母姓之由在 tm_event_006/010 展开
    'sect_leader_唐门': {
        name: '晏万解',
        trueName: '晏万解',     // 江湖称"毒手仁心"
        title: '毒堂之主',
        gender: 'female',
        age: 22,
        occupation: '毒堂堂主（唐老太太亲点下任当家）',
        location: '唐门',
        icon: '🪡',
        appearance: { hair: '乌发绾蜀中髻，一支银针簪固定', eyes: '凤目微挑，看人时嘴角带笑、眼底不带', clothing: '深紫窄袖劲装，小臂常年覆白丝手套', features: '袖口暗器囊，衣领有淡淡药气混着一线冷香' },
        background: {
            origin: '唐门毒堂嫡女→毒堂堂主',
            family: '父为门主唐无痕；母系外姓女子，殁于牵机散旧案；祖母辈唐老太太坐镇',
            history: '自幼以毒淬体，百毒不侵，代价是毒积体内三分、双手浸毒，白丝手套从不离身。一门制毒，她偏偷偷制解药「万解丹」——「万解」二字是母亲取的。她随母姓晏，是纪念，也是无声的控告',
            goal: '把万解丹炼到第十八方；翻出牵机散旧案，还母亲清白',
            secret: '手套不是洁癖，是怕伤人；母亲试毒那夜的真相；万解丹一炉其实只成三粒'
        },
        personalityBig5: { openness: 70, conscientiousness: 78, extraversion: 55, agreeableness: 48, neuroticism: 62 },
        mainAttributes: { strength: 58, dexterity: 92, intelligence: 86, willpower: 80, constitution: 66, meridian: 74 },
        combatSkills: { 内功: 70, 轻功: 82, 绝技: 88, 剑法: 40, 拳掌: 45, 刀法: 30, 长兵: 25, 奇门: 95, 射术: 80 },
        combat: { level: 72, realm: '金丹', layer: 4, attack: 78, defense: 60, speed: 86 },
        skills: ['牵机散', '散花针', '百毒淬体'],
        relationship: { affection: 14, trust: 10, respect: 0, favor: 0 },
        state: { mood: 55, stress: 45 },
        isFemale: true,
        _isFixedDefinition: true
    },

    // v20.74 第一批扩线：武当·阙守拙（男主）。与张三丰（闭关百年的祖师，偶留墨迹）、宋远桥（现任掌门，主持山务）并存：
    // 守拙为三代首徒、真武殿执剑侍，守祖师佩剑「问道」——考校与旧墨之秘在 wd_event_006/010 展开
    'sect_leader_武当派': {
        name: '阙守拙',
        trueName: '阙守拙',     // 江湖称"不争剑侍"
        title: '真武殿执剑侍',
        gender: 'male',
        age: 27,
        occupation: '三代首徒（掌门宋远桥主持山务）',
        location: '武当派',
        icon: '☯️',
        appearance: { hair: '道髻，木簪，洗得发白的青道袍', eyes: '眼神慢而稳，看人像总慢半拍', clothing: '袖口磨出毛边的旧道袍，补丁针脚极齐', features: '腰间佩剑「不争」——没有鞘' },
        background: {
            origin: '病弱孤儿→山门石阶下被拾回武当',
            family: '不详',
            history: '幼时体弱又慢，历次考较垫底，被议下山那年真武殿墙上多了一行新墨「先学慢，再学快」——他当是祖师显迹，其实是掌门宋远桥写的，这一留就是二十年。如今三代首徒、真武殿执剑侍，守祖师佩剑「问道」，每晨扫阶撞钟',
            goal: '把「慢」字练到头；想明白「不争」什么时候该争',
            secret: '墙上那行墨其实是宋远桥写的；「问道」剑夜里自鸣过，满殿只有他听见'
        },
        personalityBig5: { openness: 50, conscientiousness: 92, extraversion: 22, agreeableness: 72, neuroticism: 30 },
        mainAttributes: { strength: 70, dexterity: 74, intelligence: 72, willpower: 94, constitution: 78, meridian: 82 },
        combatSkills: { 内功: 90, 轻功: 72, 绝技: 70, 剑法: 88, 拳掌: 80, 刀法: 30, 长兵: 40, 奇门: 30, 射术: 25 },
        combat: { level: 73, realm: '金丹', layer: 5, attack: 74, defense: 76, speed: 70 },
        skills: ['太极剑法', '云梯纵', '纯阳功'],
        relationship: { affection: 14, trust: 10, respect: 0, favor: 0 },
        state: { mood: 58, stress: 25 },
        _isFixedDefinition: true
    },

    // v20.75 第一批扩线（续）：蓬莱·瀛晚照（女主）。与白眉真人（掌门，闭关观海，不问世务）并存：
    // 晚照为观汐台执录、掌门座下亲传，代管岛务——母亲出海旧事与潮信图录在 pl_event_006/010 展开
    'sect_leader_蓬莱派': {
        name: '瀛晚照',
        trueName: '瀛晚照',     // 江湖称"潮信娘子"
        title: '观汐执录',
        gender: 'female',
        age: 23,
        occupation: '观汐台执录（掌门闭关，代管岛务）',
        location: '蓬莱派',
        icon: '🐚',
        appearance: { hair: '长发以一支珊瑚簪松挽，发梢常带海雾的湿意', eyes: '眼神极静，看人像在看潮——一等一等，很有耐心', clothing: '月白鲛绡长裙外罩青灰短打，便于潜潮', features: '腰间系一只磨得发亮的旧螺' },
        background: {
            origin: '蓬莱观汐台执录之女→观汐台执录',
            family: '母亲是前任观汐执录，二十年前一个傍晚出海追海市蜃楼，没有回来',
            history: '自幼在观汐台长大，跟着母亲录潮信、摹海市。母亲出海那日蜃楼里有炊烟，母亲说「楼里有人做饭，就不是假的」。此后她每日黄昏录海市，二十年图录成册——她不说找娘，她说「录全」。白眉真人曾评她的手绘「有几分意思」',
            goal: '把海市录全；守住环岛潮汐阵；弄明白蜃楼里那个执灯的影子',
            secret: '图录第一页上那个执灯人影是母亲；旧螺贴耳能听见潮，也能听见别的；她把疼记成数目，从不记成话'
        },
        personalityBig5: { openness: 66, conscientiousness: 92, extraversion: 26, agreeableness: 60, neuroticism: 50 },
        mainAttributes: { strength: 62, dexterity: 80, intelligence: 84, willpower: 90, constitution: 70, meridian: 82 },
        combatSkills: { 内功: 82, 轻功: 78, 绝技: 76, 剑法: 74, 拳掌: 40, 刀法: 30, 长兵: 45, 奇门: 70, 射术: 35 },
        combat: { level: 73, realm: '金丹', layer: 4, attack: 72, defense: 72, speed: 76 },
        skills: ['蓬莱剑法', '潮汐阵', '蜃楼步'],
        relationship: { affection: 14, trust: 10, respect: 0, favor: 0 },
        state: { mood: 50, stress: 36 },
        isFemale: true,
        _isFixedDefinition: true
    },

    // v20.75 第一批扩线（续）：逍遥·闻人酌（男主）。与无崖子（上代人物，一句「我去云游」走后未归）及长老天琴/棋圣并存：
    // 闻人酌为亲传弟子、琅嬛福地守藏人——「不留人也不送人」的入山第一课在 xy_event_006/010 展开
    'sect_leader_逍遥派': {
        name: '闻人酌',
        trueName: '闻人酌',     // 江湖称"醉藏仙"；「闻人」是复姓
        title: '琅嬛守藏',
        gender: 'male',
        age: 29,
        occupation: '亲传弟子、琅嬛福地守藏人（无崖子云游未归，山务由长老分理）',
        location: '逍遥派',
        icon: '🍶',
        appearance: { hair: '墨发半束，一支旧竹簪，常有一缕落在额前', eyes: '桃花眼半睁，看人像醉，其实什么都看在眼里', clothing: '洗旧的青衫，襟口微敞，袖里常年揣着酒盏', features: '指腹有琴茧，落子时手比抚琴时还稳' },
        background: {
            origin: '弃婴→无崖子拾回逍遥派，取名「酌」——酌酒，也是斟酌',
            family: '不详（师父无崖子云游未归）',
            history: '满派都说他懒：躺在酒坛边抚琴、石桌上下残棋、琅嬛福地看尽天下书卷，从不认真练功。可酒仙池的酒曲是他半夜添的、琅嬛的灯油是他月月续的、山门的亏空是他拿私藏古谱换钱填的——北冥神功早已大成，闲是他的道。师父那日背着琴出门，只说「我去云游」',
            goal: '把「不留人，也不送人」的入山第一课学完后半句；解开石桌上那局残棋',
            secret: '他怕羁绊，因为逍遥道的人最后都会走；残局是走的人留下的，差最后一手；他的疼从不说破，疼了就斟酒'
        },
        personalityBig5: { openness: 88, conscientiousness: 52, extraversion: 66, agreeableness: 64, neuroticism: 40 },
        mainAttributes: { strength: 66, dexterity: 88, intelligence: 92, willpower: 74, constitution: 68, meridian: 90 },
        combatSkills: { 内功: 92, 轻功: 88, 绝技: 80, 剑法: 60, 拳掌: 65, 刀法: 30, 长兵: 35, 奇门: 75, 射术: 30 },
        combat: { level: 74, realm: '金丹', layer: 6, attack: 76, defense: 66, speed: 84 },
        skills: ['北冥神功', '凌波微步', '七弦琴心'],
        relationship: { affection: 14, trust: 10, respect: 0, favor: 0 },
        state: { mood: 66, stress: 28 },
        _isFixedDefinition: true
    },

    // v20.76 第二批扩线：恒山·祁清禅（女主）。与定逸师太（掌门，闭关清修）并存：
    // 清禅为师太关门弟子、白云庵戒律首座，代掌戒堂——抄经回向页与锔过木鱼旧事在 heng_event_003/009 展开
    'sect_leader_恒山派': {
        name: '祁清禅',
        trueName: '祁清禅',     // 江湖称"白云首座"
        title: '戒堂木鱼',
        gender: 'female',
        age: 21,
        occupation: '白云庵戒律首座（定逸师太关门弟子，师太闭关清修，代掌戒堂）',
        location: '恒山派',
        icon: '📿',
        appearance: { hair: '剃度后的青发只余一层青影，头顶圆润，眉目清净', eyes: '目光温而定，看人像看灯火——不晃，也不灭', clothing: '灰僧袍洗得发白，袖口两处补丁针脚极齐，袈裟叠成方块抱在臂弯', features: '袖中一只磨得发亮的旧木鱼，铜锔着一道旧裂' },
        background: {
            origin: '山门孤儿→白云庵戒律首座',
            family: '自幼出家，定逸师太亦师亦母',
            history: '卯时诵戒、巳时抄经、亥时敲木鱼，十年无一日间断。《华严经》抄了六年，回向页一直空着。木鱼是受戒日师太所授，摔裂过一回，她锔了铜锔继续用，不换',
            goal: '把《华严经》抄圆，把回向页写好',
            secret: '回向页头一个想写的俗家名字是你的；晚课后的木鱼有时多敲一声，谁也没告诉是为谁'
        },
        personalityBig5: { openness: 58, conscientiousness: 94, extraversion: 24, agreeableness: 72, neuroticism: 34 },
        mainAttributes: { strength: 52, dexterity: 74, intelligence: 82, willpower: 94, constitution: 66, meridian: 78 },
        combatSkills: { 内功: 84, 轻功: 70, 绝技: 72, 剑法: 74, 拳掌: 36, 刀法: 24, 长兵: 40, 奇门: 58, 射术: 30 },
        combat: { level: 71, realm: '金丹', layer: 2, attack: 62, defense: 80, speed: 72 },
        skills: ['万花剑法', '恒山剑法·绵密', '木鱼安心咒'],
        relationship: { affection: 14, trust: 10, respect: 0, favor: 0 },
        state: { mood: 52, stress: 26 },
        isFemale: true,
        _isFixedDefinition: true
    },

    // v20.76 第二批扩线：嵩山·逵佩南（男主）。与左冷禅（正典掌门）并存：
    // 佩南为养子、执法堂首座，只管执法不夺权——并盟章程两本之异在 song_event_002 展开，左冷禅全程只以手令朱批出场
    'sect_leader_嵩山派': {
        name: '逵佩南',
        trueName: '逵佩南',
        title: '执法首座',
        gender: 'male',
        age: 28,
        occupation: '执法堂首座（左冷禅养子，掌五岳并盟章程与执法）',
        location: '嵩山派',
        icon: '⚖️',
        appearance: { hair: '发髻束得方正，一丝不乱，一根旧铜簪', eyes: '目光平直，看人像在核对卷宗', clothing: '玄色执法袍浆洗得笔挺，腰牌绳结每日重系', features: '腰间悬半枚执法令牌，断口很旧，铜面被摩挲得温亮' },
        background: {
            origin: '旧案遗孤→左冷禅收为养子',
            family: '养父左冷禅（他从不叫父亲，叫掌门）',
            history: '十四岁入执法堂，把堂规背到一字不差；二十岁头一回主审大案，得罪三位长老，没低头。五岳并盟的章程、卷宗、旧案他都管——自己的份，争得最少',
            goal: '把执法堂的条文改得比江湖规矩更公道',
            secret: '第一百零八条空了很多年——那一条他留给自己；他的善意从不宣之于口，全藏在判词里'
        },
        personalityBig5: { openness: 54, conscientiousness: 96, extraversion: 30, agreeableness: 44, neuroticism: 30 },
        mainAttributes: { strength: 78, dexterity: 72, intelligence: 88, willpower: 90, constitution: 80, meridian: 76 },
        combatSkills: { 内功: 80, 轻功: 66, 绝技: 74, 剑法: 86, 拳掌: 72, 刀法: 40, 长兵: 48, 奇门: 52, 射术: 34 },
        combat: { level: 75, realm: '金丹', layer: 7, attack: 82, defense: 78, speed: 70 },
        skills: ['峻极剑势', '大嵩阳神掌', '执法符令'],
        relationship: { affection: 14, trust: 10, respect: 0, favor: 0 },
        state: { mood: 48, stress: 44 },
        _isFixedDefinition: true
    },

    // v20.76 第二批扩线：泰山·岳清晓（女主）。与天门道人（正典掌门）并存：
    // 清晓为掌门孙女、玉皇顶晨光临火人，只管火坛不掌门派事务——摩崖「日」字拓片在 tai_event_005 展开
    'sect_leader_泰山派': {
        name: '岳清晓',
        trueName: '岳清晓',     // 江湖称"第一缕娘子"
        title: '临火执晨',
        gender: 'female',
        age: 22,
        occupation: '玉皇顶晨光临火人（天门道人之孙女）',
        location: '泰山派',
        icon: '🌄',
        appearance: { hair: '高马尾用红绳扎住，发梢常被火星燎得微黄', eyes: '眼睛亮而黑白分明，笑起来有两颗小虎牙', clothing: '赤色短打外罩防火粗布褂，袖口挽到小臂', features: '指尖常带一点火绒气味，贴身收着一卷拓片' },
        background: {
            origin: '生在泰山长在泰山→玉皇顶临火人',
            family: '爷爷天门道人掌门务，爹娘守过山道',
            history: '五岁爬十八盘，十二岁接火坛。泰山一千次日出她都看过，没有一次是与人同看。摩崖「日」字她拓了十年，只有一幅送得出手',
            goal: '晨火不断；看一次不是一个人看的日出',
            secret: '第一幅「日」字拓片没进卷袋，压在她枕头底下'
        },
        personalityBig5: { openness: 76, conscientiousness: 78, extraversion: 88, agreeableness: 74, neuroticism: 24 },
        mainAttributes: { strength: 72, dexterity: 76, intelligence: 70, willpower: 84, constitution: 78, meridian: 74 },
        combatSkills: { 内功: 76, 轻功: 74, 绝技: 70, 剑法: 80, 拳掌: 58, 刀法: 36, 长兵: 44, 奇门: 40, 射术: 38 },
        combat: { level: 71, realm: '金丹', layer: 3, attack: 76, defense: 70, speed: 72 },
        skills: ['泰山十八盘', '紫气东来诀', '临火步'],
        relationship: { affection: 14, trust: 10, respect: 0, favor: 0 },
        state: { mood: 70, stress: 24 },
        isFemale: true,
        _isFixedDefinition: true
    },

    // v20.76 第二批扩线：青城·幽翠微（女主）。与余沧海（正典掌门）并存：
    // 翠微为最小弟子、松风观后山茶園看茶人——她知道的「山门里的事」在 qing_event_004/010 展开，余沧海地位不动
    'sect_leader_青城派': {
        name: '幽翠微',
        trueName: '幽翠微',
        title: '青城看茶人',
        gender: 'female',
        age: 20,
        occupation: '松风观后山茶園看茶人（余沧海最小的弟子）',
        location: '青城派',
        icon: '🍃',
        appearance: { hair: '双鬟松挽，竹簪别住，鬓边几缕碎发', eyes: '眼神转得快，心思一动全写在眼睛里', clothing: '青色采茶短打系茶染围裙，兜里常年揣着茶样', features: '掌心有焙茶烫出的薄茧，指甲修得极短' },
        background: {
            origin: '山下茶户之女→余沧海关门小弟子',
            family: '家里在山下开茶铺，入派是为学剑护铺',
            history: '剑术天赋最好，却选了看茶园——茶不骗人，火候到了就是到了。青城雪茶头一茬由她炒，装茶的旧罐是娘留的。山门里有些事她看见了，不该看的，她还没想好说不说',
            goal: '护住茶园和师弟们；把头一茬雪茶炒到值得送人',
            secret: '功德簿被撕去一角的旧页在她手里；焙房第二把钥匙她没给过任何人'
        },
        personalityBig5: { openness: 74, conscientiousness: 70, extraversion: 80, agreeableness: 56, neuroticism: 36 },
        mainAttributes: { strength: 58, dexterity: 86, intelligence: 80, willpower: 74, constitution: 64, meridian: 76 },
        combatSkills: { 内功: 70, 轻功: 84, 绝技: 66, 剑法: 78, 拳掌: 44, 刀法: 30, 长兵: 36, 奇门: 56, 射术: 40 },
        combat: { level: 68, realm: '金丹', layer: 2, attack: 64, defense: 62, speed: 76 },
        skills: ['青城剑法', '雪茶焙香诀', '松涛步'],
        relationship: { affection: 14, trust: 10, respect: 0, favor: 0 },
        state: { mood: 64, stress: 34 },
        isFemale: true,
        _isFixedDefinition: true
    },

    // v20.76 第二批扩线：衡山·奚湘筠（女主）。与莫大先生（正典掌门）并存：
    // 湘筠为关门弟子、回雁琴台承传人——「潇湘夜雨只拉半阙」在 xiang_event_001/013 展开，莫大之问「曲归她，山也归她」
    'sect_leader_衡山派': {
        name: '奚湘筠',
        trueName: '奚湘筠',
        title: '回雁琴承',
        gender: 'female',
        age: 23,
        occupation: '莫大先生关门弟子、回雁琴台承传人',
        location: '衡山派',
        icon: '🎻',
        appearance: { hair: '长发半绾，一支乌木琴头簪', eyes: '眼神总像隔着一层雨汽，落在人身上很轻', clothing: '雨青长裙外罩素白衫，袖口被琴弓磨得发毛', features: '怀里揣一块松香，被体温焐得圆熟' },
        background: {
            origin: '湘江船家孤女→莫大先生拾回衡山',
            family: '师父如父，琴声如家',
            history: '《潇湘夜雨》她只拉半阙——师父说拉完的人就该下山。于是她把另一半一直留着，留了十年。琴音是派里最好的，话是派里最少的',
            goal: '把下半阙长出来',
            secret: '旧谱的下半阙空白处，她用铅笔淡淡记着指法——写到哪儿，看雨下到哪儿'
        },
        personalityBig5: { openness: 80, conscientiousness: 66, extraversion: 18, agreeableness: 68, neuroticism: 46 },
        mainAttributes: { strength: 50, dexterity: 88, intelligence: 84, willpower: 80, constitution: 60, meridian: 84 },
        combatSkills: { 内功: 80, 轻功: 82, 绝技: 78, 剑法: 76, 拳掌: 30, 刀法: 24, 长兵: 32, 奇门: 68, 射术: 28 },
        combat: { level: 71, realm: '金丹', layer: 3, attack: 70, defense: 68, speed: 78 },
        skills: ['衡山剑法', '潇湘夜雨', '琴中藏剑'],
        relationship: { affection: 14, trust: 10, respect: 0, favor: 0 },
        state: { mood: 54, stress: 32 },
        isFemale: true,
        _isFixedDefinition: true
    },

    // v20.76 第二批扩线：丐帮·桑拾玖（男主）。与洪七公（正典帮主）、鲁有脚（执法长老）并存：
    // 拾玖为讯房最年轻长老，只掌天下消息总口，不涉帮主之位——娘的百衲衣与青布在 gai_event_001/009 展开
    'sect_leader_丐帮': {
        name: '桑拾玖',
        trueName: '桑拾玖',     // 「拾玖」是当年灾民队伍里第十九个被收留的孩子
        title: '讯房守口',
        gender: 'male',
        age: 26,
        occupation: '讯房最年轻长老（掌天下消息总口，帮务归洪帮主，讯房只递一次口）',
        location: '丐帮',
        icon: '🥣',
        appearance: { hair: '短发用布条随便一扎，总有点乱', eyes: '听人说话时永远带着笑，像在给说书人对词', clothing: '补了十几年的百衲衣，每块补丁颜色来历各不相同', features: '袖口一方新青布，针脚比别处密' },
        background: {
            origin: '灾年逃荒的孩子→丐帮义庄养大',
            family: '娘病故在路上，留下一件百衲衣',
            history: '十二岁进讯房，听来的消息过耳不忘、从不外泄，帮里人人知道他嘴严。讲天下的故事眉飞色舞，讲自己的事就岔开。百衲衣补了十几年，最后一方青布是娘旧衣裁剩的，一直贴身收着',
            goal: '把讯房的故事讲到讲不动为止',
            secret: '那方青布他说过要缝给这辈子最信的人的袖口——话出了口，他自己先红了脸'
        },
        personalityBig5: { openness: 78, conscientiousness: 72, extraversion: 64, agreeableness: 70, neuroticism: 30 },
        mainAttributes: { strength: 60, dexterity: 80, intelligence: 95, willpower: 76, constitution: 66, meridian: 82 },
        combatSkills: { 内功: 70, 轻功: 82, 绝技: 64, 剑法: 50, 拳掌: 66, 刀法: 40, 长兵: 44, 奇门: 88, 射术: 36 },
        combat: { level: 68, realm: '金丹', layer: 2, attack: 62, defense: 66, speed: 78 },
        skills: ['听风辨讯', '百衲密针', '九州接力'],
        relationship: { affection: 14, trust: 10, respect: 0, favor: 0 },
        state: { mood: 62, stress: 30 },
        _isFixedDefinition: true
    },

    // v20.77 第三批反派阵营扩线：阎罗殿·聂明泽（男主）。与阎罗王（正典殿主秦广，见 sects-deep-data）、
    // 左判官（掌生死簿）、孟婆（右判官掌汤）并存：明泽为档房最不起眼的记档文吏，判官属下，不越位——
    // 殿主全程只以朱批/帘后存在感施压，互动位由记档人承接（yan_event_001 建档起）
    'sect_leader_阎罗殿': {
        name: '聂明泽',
        trueName: '聂明泽',
        title: '生死簿记档人',
        gender: 'male',
        age: 24,
        occupation: '档房记档人（左判官属下文吏，只记档，不索命）',
        location: '阎罗殿',
        icon: '📖',
        appearance: { hair: '束得一丝不苟，一根乱发都没有', eyes: '看人像在读档——先看名字，再看生辰', clothing: '洗得发白的青布直裰，袖口磨出了翻档的亮痕', features: '指腹一层握笔的茧，怀里总揣着一支朱笔' },
        background: {
            origin: '殿里捡回的无名孤儿→档房文吏',
            family: '没有——他把档房当家，把天下人的档当邻里',
            history: '能背全江湖的档案，却读不懂空气；说三个字停一下，被夸一句耳朵红着开始背条例。记档人的手比杀手干净，也比杀手冷。善意全是程序性的：把你的档案调到离他手最近的那一格',
            goal: '复核完那一页「命格：未定」',
            secret: '生死簿记尽了天下人该死的日子，唯独你那一页他「弄丢」过一回——丢档是死罪，他头一次知法犯法，自己都没弄明白为什么'
        },
        personalityBig5: { openness: 55, conscientiousness: 92, extraversion: 8, agreeableness: 60, neuroticism: 58 },
        mainAttributes: { strength: 34, dexterity: 58, intelligence: 96, willpower: 88, constitution: 44, meridian: 50 },
        combatSkills: { 内功: 40, 轻功: 36, 绝技: 30, 剑法: 20, 拳掌: 18, 刀法: 16, 长兵: 16, 奇门: 62, 射术: 20 },
        combat: { level: 36, realm: '筑基', layer: 2, attack: 26, defense: 30, speed: 44 },
        skills: ['过目千卷', '朱笔勾决', '纸甲藏锋'],
        relationship: { affection: 14, trust: 10, respect: 0, favor: 0 },
        state: { mood: 46, stress: 52 },
        _isFixedDefinition: true
    },

    // v20.77 第三批反派阵营扩线：血手门·耿雪衣（女主）。与血手人屠（正典门主）并存：
    // 雪衣为其养女，守门里一角的药庐，不学刀只学医、不涉门务——门主只以走廊尽头的脚步声/堂上的影子存在；
    // 血池十年一开、烧档之夜后档房新规等既有埋象已织入 xue 线
    'sect_leader_血手门': {
        name: '耿雪衣',
        trueName: '耿雪衣',
        title: '药庐守灯',
        gender: 'female',
        age: 21,
        occupation: '药庐守庐人（门主养女，门里抬回来的人她缝）',
        location: '血手门',
        icon: '🩹',
        appearance: { hair: '一根木簪松松挽着，总有几缕垂在耳边', eyes: '干净，看人像看伤口——先看多深，再想怎么缝', clothing: '洗得发白的青衣，袖口挽起，衣角有淡淡药渍', features: '掌心一层药碾磨出的薄茧，指上一枚磨亮的顶针' },
        background: {
            origin: '血手人屠从血地里捡回的养女',
            family: '门主是养父——她只称「他」',
            history: '全门嗓门最轻的人。把血腥讲得像天气：「今天抬进来七个，都缝好了。有一个没救回来，我吃了午饭。」不是装酷——她从小环境里的死亡就是日常，脱敏是真实的平。药庐八年，门里抬回来的人她缝',
            goal: '想知道普通日子长什么样——赶一次集、为菜价吵一次架、被人骂一次「怎么这么晚才回来」',
            secret: '她开出的第一张方子不是治伤的，是治伤风的——姜三片，枣五枚，葱白两段。方子她收着，对折，压在柜底'
        },
        personalityBig5: { openness: 62, conscientiousness: 78, extraversion: 20, agreeableness: 74, neuroticism: 24 },
        mainAttributes: { strength: 46, dexterity: 82, intelligence: 80, willpower: 84, constitution: 58, meridian: 70 },
        combatSkills: { 内功: 56, 轻功: 54, 绝技: 40, 剑法: 24, 拳掌: 30, 刀法: 26, 长兵: 22, 奇门: 72, 射术: 24 },
        combat: { level: 66, realm: '金丹', layer: 1, attack: 54, defense: 58, speed: 66 },
        skills: ['金疮百针', '白药掰两', '脉平如水'],
        relationship: { affection: 14, trust: 10, respect: 0, favor: 0 },
        state: { mood: 58, stress: 36 },
        isFemale: true,
        _isFixedDefinition: true
    },

    // v20.77 第三批反派阵营扩线：飞蝎坞·拓银沙（女主）。与蝎母（正典坞主）并存：
    // 银沙为幺女/少坞主，只管蝎不管坞务，几位兄长都怕娘、只有她敢掰腕子——
    // 坞规「被蜇不许叫」、蝎王窝三十年老种等既有埋象已织入 xie 线
    'sect_leader_飞蝎坞': {
        name: '拓银沙',
        trueName: '拓银沙',
        title: '蝎母幺女',
        gender: 'female',
        age: 23,
        occupation: '飞蝎坞少坞主/牧蝎人（坞务归蝎母，她只管蝎）',
        location: '飞蝎坞',
        icon: '🦂',
        appearance: { hair: '辫子盘在头顶，插一根沙漠红柳枝', eyes: '笑起来眯成缝，认真起来比蝎子还凶', clothing: '沙漠短打，靴筒里永远有沙，腰间一排小皮囊', features: '臂缚上一枚金蝎壳——蝎王窝老种蜕的头一枚' },
        background: {
            origin: '蝎母幺女，大漠里生、蝎房里大',
            family: '上头几位兄长都怕娘，只有她不怕',
            history: '坞里牧蝎最好的人，也是唯一敢跟汉子们掰腕子掀桌的。坞规「被蜇不许叫」她头一个守。说话糙，手上稳，蝎册上那个「不蛰」的标记是她亲手描的',
            goal: '把册上那一笔一直描下去——不让任何人把它改成「蛰」',
            secret: '掰腕子第三局她输给了一个人——那回她踹翻凳子落荒而逃，金蝎翘着尾钩追出半里地'
        },
        personalityBig5: { openness: 84, conscientiousness: 58, extraversion: 88, agreeableness: 60, neuroticism: 22 },
        mainAttributes: { strength: 82, dexterity: 84, intelligence: 66, willpower: 76, constitution: 78, meridian: 74 },
        combatSkills: { 内功: 66, 轻功: 80, 绝技: 74, 剑法: 40, 拳掌: 56, 刀法: 78, 长兵: 50, 奇门: 84, 射术: 44 },
        combat: { level: 74, realm: '金丹', layer: 4, attack: 76, defense: 62, speed: 82 },
        skills: ['蝎尾针', '驭蝎诀', '大漠分水刀'],
        relationship: { affection: 14, trust: 10, respect: 0, favor: 0 },
        state: { mood: 66, stress: 24 },
        isFemale: true,
        _isFixedDefinition: true
    },

    // v20.77 第三批反派阵营扩线：烈日教·伏璃茵（女主）。与烈日法王（正典教主）并存：
    // 璃茵为圣火看守/圣女，仪轨归长老、焰归她——法王只以高台远景存在；
    // 七口井井规、曝日崖「烈日淬体」、赤袍祭司等既有埋象已织入 lie 线
    'sect_leader_烈日教': {
        name: '伏璃茵',
        trueName: '伏璃茵',
        title: '守焰双相',
        gender: 'female',
        age: 22,
        occupation: '圣火看守·圣女（烈日法王座下，仪轨归长老，焰归她）',
        location: '烈日教',
        icon: '🕯️',
        appearance: { hair: '戴冠时一丝不乱，摘了冠松松垂到肩', eyes: '人前静得像井水，人后亮得像火星', clothing: '赤袍祭司常服，衣缘烫金，冠却总晚戴一刻', features: '指尖一点捻灯芯的薄茧，贴身一只檀木匣' },
        background: {
            origin: '七口井的井规人家女儿，被选进圣火龛守焰',
            family: '没有——教里都叫她「圣女」，没人叫她名字',
            history: '公开场合是完美圣女，私下是吐槽役。分水岭那日长老把「照十方」诵成「照四方」，她肩膀一抖——从那天起你成了她唯一的观众。仰头哭过两回，第三回她没忍住笑出声',
            goal: '亲眼看一次真正的日出——曝日崖上没人见过的那种',
            secret: '檀木匣里那根捻熄过的灯芯，档上批的是「风大，灯油不济」——那晚没有风'
        },
        personalityBig5: { openness: 76, conscientiousness: 70, extraversion: 52, agreeableness: 62, neuroticism: 44 },
        mainAttributes: { strength: 58, dexterity: 76, intelligence: 82, willpower: 86, constitution: 66, meridian: 78 },
        combatSkills: { 内功: 74, 轻功: 70, 绝技: 72, 剑法: 44, 拳掌: 52, 刀法: 36, 长兵: 30, 奇门: 68, 射术: 30 },
        combat: { level: 70, realm: '金丹', layer: 3, attack: 74, defense: 68, speed: 71 },
        skills: ['烈日真焰', '巡火步', '捻芯指'],
        relationship: { affection: 14, trust: 10, respect: 0, favor: 0 },
        state: { mood: 56, stress: 44 },
        isFemale: true,
        _isFixedDefinition: true
    },

    // v20.77 第三批反派阵营扩线：天龙教·檀望舒（女主）。与天龙王（正典教主，金丹八层、不见真容）并存：
    // 望舒只是传声房传令人，帘后归教主、传令归她——教主只以帘后影子与一句隔帘的话存在；
    // 经台旧谚、八方贡「进贡的先吃」、万魔洞隔日调息等既有埋象已织入 long 线
    'sect_leader_天龙教': {
        name: '檀望舒',
        trueName: '檀望舒',
        title: '百声传令',
        gender: 'female',
        age: 23,
        occupation: '传声房传令人（教令口传比文书还准，她只传令，不掌权）',
        location: '天龙教',
        icon: '🪞',
        appearance: { hair: '随手一挽，换完声常忘了自己没戴钗', eyes: '看人先看嘴——学口型的习惯', clothing: '黑袍传令服，里子却悄悄染了浅色', features: '袖中半片风磨石片，对镜练声磨得溜圆' },
        background: {
            origin: '传声房从小养大的孤女',
            family: '没有——教里她的声音是工具，工具不需要家',
            history: '传声房嗓子最好的人，学谁像谁，教令口传比文书还准。可她不知道自己本来的声音什么样——开口全是别人的调子：（用山门老仆的调子）「进来。」（用黑袍知客的调子）「出去。」',
            goal: '有人用她自己的调子叫一声「檀望舒」，她用自己的声音应',
            secret: '贴身收着半面残铜镜——镜里只照得下半张脸，她的声音也只留半句给自己'
        },
        personalityBig5: { openness: 80, conscientiousness: 74, extraversion: 58, agreeableness: 72, neuroticism: 40 },
        mainAttributes: { strength: 44, dexterity: 86, intelligence: 80, willpower: 72, constitution: 56, meridian: 80 },
        combatSkills: { 内功: 62, 轻功: 84, 绝技: 58, 剑法: 26, 拳掌: 30, 刀法: 22, 长兵: 20, 奇门: 86, 射术: 34 },
        combat: { level: 68, realm: '金丹', layer: 2, attack: 52, defense: 56, speed: 78 },
        skills: ['百声口技', '传音入密', '空谷回音'],
        relationship: { affection: 14, trust: 10, respect: 0, favor: 0 },
        state: { mood: 54, stress: 40 },
        isFemale: true,
        _isFixedDefinition: true
    },

    // v20.78 第四批奇门扩线：神机门·戚巧机（女主）。与鲁妙子（正典门主，见 SECT_LEADER_NAMES）并存：
    // 巧机是图房首席机师，机关归她、门务归门主；旧铜雀与「能记住人」的新雀在 sj 线展开
    'sect_leader_神机门': {
        name: '戚巧机',
        trueName: '戚巧机',
        title: '巧机算齿',
        gender: 'female',
        age: 22,
        occupation: '图房首席机师（跟机关说话比跟人多，齿数比是她的诗）',
        location: '神机门',
        icon: '⚙️',
        appearance: { hair: '随手拿细铜丝一绾，簪是半截锉刀', eyes: '看人先看手——手上茧在哪里，功夫就在哪里', clothing: '短打工装，袖口磨亮，兜里叮当响', features: '指腹一层薄茧，攥紧时掌心血印正好压住齿轮刻痕' },
        background: {
            origin: '神机门图房养大的匠户孤女',
            family: '没有——师父病故后，一只学舌的铜雀是她唯一的家人',
            history: '门里手最巧的机师，跟齿轮说话比跟人多，把齿数比当诗背；能算尽天下机关，唯独见你时心口那一下，只说得出三个字「算不出」',
            goal: '造一具「能记住人」且「不会坏」的机关雀',
            secret: '柜子里锁着一只散了架的铜雀——零件一枚没丢，记性丢了，她拼了八回没拼回去'
        },
        personalityBig5: { openness: 78, conscientiousness: 86, extraversion: 36, agreeableness: 64, neuroticism: 44 },
        mainAttributes: { strength: 46, dexterity: 88, intelligence: 84, willpower: 70, constitution: 52, meridian: 66 },
        combatSkills: { 内功: 55, 轻功: 62, 绝技: 50, 剑法: 20, 拳掌: 26, 刀法: 18, 长兵: 30, 奇门: 92, 射术: 40 },
        combat: { level: 58, realm: '筑基', layer: 9, attack: 40, defense: 46, speed: 72 },
        skills: ['十指悬丝', '听齿辨簧', '万机归一'],
        relationship: { affection: 14, trust: 10, respect: 0, favor: 0 },
        state: { mood: 54, stress: 42 },
        isFemale: true,
        _isFixedDefinition: true
    },

    // v20.78 第四批奇门扩线：霹雳堂·雷惊蛰（男主）。与雷震天（正典名册名）并存：雷震天为其父、上代堂主名讳（早亡），
    // 惊蛰接印仍自称「配药的」；无声花执念与火药方子册批注在 pi 线展开
    'sect_leader_霹雳堂': {
        name: '雷惊蛰',
        trueName: '雷惊蛰',
        title: '默雷堂主',
        gender: 'male',
        age: 23,
        occupation: '霹雳堂历代最年轻堂主（接了堂主印仍自称配药的）',
        location: '霹雳堂',
        icon: '🎆',
        appearance: { hair: '束得一丝不苟，鬓角有一点燎黄的旧痕', eyes: '看人先看嘴——听不清就俯身，俯得很近', clothing: '防火短褐，腰上一只囊口焦痕的旧布囊', features: '指节有火药染的洗不净的黄，指甲修得极短' },
        background: {
            origin: '霹雳堂雷家火药匠，七岁随老匠学验雷',
            family: '父亲是上代堂主雷震天，早亡；娘缝了那只防火布囊，走得早——囊口焦痕他一直没换',
            history: '老匠死于炸膛后他接过「验」字，如今验雷一枚验三遍。说话极轻，要紧的话更轻，说完必补「……我说了。我真的说了。」再把原话抄进火药方子册当批注',
            goal: '配成无声花，在满坡光底下，把那句话对一个不用捂耳朵的人说完',
            secret: '他想配一支没有声音的烟花——看花的人都捂着耳朵，捂着耳朵就听不见他在旁边说什么；十六年没说出口的话，全抄在方子册的批注里'
        },
        personalityBig5: { openness: 66, conscientiousness: 88, extraversion: 24, agreeableness: 74, neuroticism: 48 },
        mainAttributes: { strength: 48, dexterity: 88, intelligence: 82, willpower: 76, constitution: 54, meridian: 60 },
        combatSkills: { 内功: 40, 轻功: 38, 绝技: 46, 剑法: 12, 拳掌: 20, 刀法: 14, 长兵: 12, 奇门: 84, 射术: 52 },
        combat: { level: 34, realm: '筑基', layer: 1, attack: 28, defense: 26, speed: 38 },
        skills: ['研硝七遍', '验雷半寸', '默花无声'],
        relationship: { affection: 14, trust: 10, respect: 0, favor: 0 },
        state: { mood: 50, stress: 46 },
        _isFixedDefinition: true
    },

    // v20.78 第四批奇门扩线：天书阁·宓书言（男主）。与归藏子（正典阁主）并存：书言是总校勘，校书归他、阁务归归藏子
    // （归藏子只以催卷施压，已织入 shu 线）；校讎剑与「存疑不改」的页边字在 shu 线展开
    'sect_leader_天书阁': {
        name: '宓书言',
        trueName: '宓书言',
        title: '佩剑校书郎',
        gender: 'male',
        age: 27,
        occupation: '天书阁总校勘（佩剑「校讎」，给天下字句挑错、给江湖招式正名）',
        location: '天书阁',
        icon: '🖋️',
        appearance: { hair: '玉簪束发，一丝不乱，伏案久了鬓边压出一道印', eyes: '看人先看字——你写的每一个字他都过了目', clothing: '青衫洗得发白，袖口掖着一管笔、一叠夹批签', features: '中指第一节一枚厚茧，是笔茧不是剑茧——可他的剑比笔快' },
        background: {
            origin: '翰林院校书郎，辞官入天书阁任总校勘',
            family: '三代抄书之家：祖父抄书至眼盲，父亲校书校到人嫌',
            history: '书生气质，武功同样高强——对敌时当场修正对方招式名，「你这套叫『鸿雁来宾』？不对。第三式发力在肩不在腕，是『雁落平沙』」，剑随话到，一字一式。批语从不超四个字',
            goal: '校完那部三年残卷——除了卷尾那个永不改的字',
            secret: '他校了三年的残卷只有一个字终身不圈不改——你研墨夜随手写错的「墨」字脱了「土」，他裱进了卷尾，注「此处存疑。存疑，不改。」'
        },
        personalityBig5: { openness: 84, conscientiousness: 92, extraversion: 48, agreeableness: 52, neuroticism: 36 },
        mainAttributes: { strength: 62, dexterity: 78, intelligence: 96, willpower: 86, constitution: 64, meridian: 78 },
        combatSkills: { 内功: 74, 轻功: 72, 绝技: 70, 剑法: 88, 拳掌: 30, 刀法: 26, 长兵: 24, 奇门: 58, 射术: 30 },
        combat: { level: 70, realm: '金丹', layer: 3, attack: 76, defense: 62, speed: 80 },
        skills: ['一字之校', '剑鸣正讹', '存疑不注'],
        relationship: { affection: 14, trust: 10, respect: 0, favor: 0 },
        state: { mood: 52, stress: 40 },
        _isFixedDefinition: true
    },

    // v20.78 第四批奇门扩线：大隐阁·隗九爻（男主）。与观虚子（正典阁主）并存：九爻是隐进食摊街的隐修，阁务不沾
    // （观虚子全程不出场）；「莫尽」卦辞与签头风干山楂在 dy 线展开
    'sect_leader_大隐阁': {
        name: '隗九爻',
        trueName: '隗九爻',
        title: '市井半句仙',
        gender: 'male',
        age: 26,
        occupation: '大隐阁隐修（隐在食摊街口，以糖葫芦数签起卦为生，欠账遍及全街）',
        location: '大隐阁',
        icon: '🍡',
        appearance: { hair: '半披半束，插着一根糖葫芦竹签当簪', eyes: '总像没睡醒，可街对面谁掏了钱袋他先看见', clothing: '旧道袍洗成灰白，外头罩一件沾糖渍的粗布坎肩', features: '袖里常年半根糖葫芦，签头那颗山楂永远不吃' },
        background: {
            origin: '九华山嘴最碎的少年，隐进食摊街口的大隐阁隐士',
            family: '没有家人——师父十年前走得干净，留给他一园山楂树和一句没说完的话，一条食摊街就是他的家',
            history: '跟师父学卦、跟市井学吃饭，起卦不用蓍草不用铜钱，数签子上剩几颗山楂定吉凶。说话永远只说半句就停：「你今日……」——然后捻一颗山楂，让你猜',
            goal: '寻一个猜得中下半句的人，把签头那颗风干的山楂吃掉',
            secret: '他给自己起过一卦，卦辞两个字「莫尽」——话说尽了要出事，所以只说半句；他心里门儿清，这卦八成是当年师父哄他少顶嘴编的，却还是守了二十年'
        },
        personalityBig5: { openness: 76, conscientiousness: 48, extraversion: 70, agreeableness: 78, neuroticism: 28 },
        mainAttributes: { strength: 56, dexterity: 62, intelligence: 90, willpower: 84, constitution: 70, meridian: 76 },
        combatSkills: { 内功: 78, 轻功: 70, 绝技: 56, 剑法: 62, 拳掌: 34, 刀法: 28, 长兵: 26, 奇门: 66, 射术: 24 },
        combat: { level: 58, realm: '金丹', layer: 2, attack: 42, defense: 55, speed: 60 },
        skills: ['数签知机', '半句藏锋', '朝市大隐'],
        relationship: { affection: 14, trust: 10, respect: 0, favor: 0 },
        state: { mood: 58, stress: 32 },
        _isFixedDefinition: true
    },

    // v20.78 第四批奇门扩线：侠隐阁·简知忆（男主）。与燕南天（正典阁主）并存：知忆是档房文吏，只管档案不管阁务；
    // 空白自档页与「危险程度：想一直说话」在 yin 线展开；与阎罗殿聂明泽的念档腔全面拉开（批注腔，无朱笔/生死簿/命格字样）
    'sect_leader_侠隐阁': {
        name: '简知忆',
        trueName: '简知忆',
        title: '侠隐阁建档人',
        gender: 'male',
        age: 25,
        occupation: '侠隐阁档房文吏（侠名录岁末修名，他是最好使的那支笔）',
        location: '侠隐阁',
        icon: '🗂️',
        appearance: { hair: '用一截档案麻绳随手扎着，绳头还挂着页签', eyes: '看人一眼就归档——目光在你身上停留的时长都记了数', clothing: '靛青直裰，胸前一只油布包，包角磨圆', features: '右手食指内侧一道笔杆磨出的旧痕，中指茧比剑茧厚' },
        background: {
            origin: '武昌城脚吃着百家饭长大的孤儿，侠隐阁档房文吏',
            family: '没有——侠名录亲属栏涂改三次：同门、挚友、留白，最后只填得下一个人的名字',
            history: '建档狂魔，见人先归档：姓名、师承、兵器、忌口、走路先迈哪只脚。他给你建的那一档越写越不像档案：「危险程度：想一直说话。」「附页销毁。」',
            goal: '把自己那页档写全，且不进架子里',
            secret: '侠名录记尽天下人，唯独他自己那页空了八年——不是没人写，是他每回提笔又放下：写全了，就被收进架子里了'
        },
        personalityBig5: { openness: 80, conscientiousness: 94, extraversion: 44, agreeableness: 66, neuroticism: 40 },
        mainAttributes: { strength: 40, dexterity: 58, intelligence: 95, willpower: 85, constitution: 50, meridian: 56 },
        combatSkills: { 内功: 42, 轻功: 48, 绝技: 36, 剑法: 30, 拳掌: 22, 刀法: 18, 长兵: 16, 奇门: 52, 射术: 28 },
        combat: { level: 34, realm: '筑基', layer: 2, attack: 24, defense: 28, speed: 46 },
        skills: ['过目归档', '千架在胸', '落笔成档'],
        relationship: { affection: 14, trust: 10, respect: 0, favor: 0 },
        state: { mood: 52, stress: 44 },
        _isFixedDefinition: true
    },

    // v20.78 第四批奇门扩线：天涯海阁·狄长亭（男主）。与花无缺（正典阁主）并存：长亭是总驿写引人，驿路归他、阁务归阁主；
    // 半枚驿站铜符与颤笔「建议滞留数日」在 ty 线展开；意象走驿站/路引/马灯，与蓬莱派海螺潮信零接触
    'sect_leader_天涯海阁': {
        name: '狄长亭',
        trueName: '狄长亭',
        title: '驿路写引人',
        gender: 'male',
        age: 26,
        occupation: '天涯海阁总驿写引人（三十六站路引出自他手，公文腔藏挽留）',
        location: '天涯海阁',
        icon: '🏮',
        appearance: { hair: '风里束得整齐，发梢却总有一缕翘着——赶路赶的', eyes: '温和，看人先看路——他习惯了替你打量前路', clothing: '驿路青灰行装，肩上一只风雨不侵的信匣', features: '右手虎口一层挽缰的茧，写字时那层茧压着笔杆，颤笔就是这么来的' },
        background: {
            origin: '第一站被老驿丞捡回的无名孤儿，天涯海阁驿路行客、总驿写引人',
            family: '没有——十年前告老的老驿丞是师父也是养父，师徒两代家书写成路引',
            history: '三十六站驿路跑了十年，认路极准、手极稳、夜里听得出蹄声远近。轻声细语礼数周全，可每句都像道别——「前路不利」是想多看你一眼，「天色将晚，早寻宿处」是舍不得你走；学不会挽留，就把挽留全写进公文格式里',
            goal: '等到一个持着另一半铜符进站的人',
            secret: '贴身收着半枚驿站铜符——驿制见符如见人，持符者可于任何一站换马换灯换一夜安寝；十年里只有别人持符来求他，从没有人拿着另一半来找他'
        },
        personalityBig5: { openness: 72, conscientiousness: 82, extraversion: 40, agreeableness: 82, neuroticism: 54 },
        mainAttributes: { strength: 44, dexterity: 88, intelligence: 76, willpower: 80, constitution: 72, meridian: 58 },
        combatSkills: { 内功: 44, 轻功: 66, 绝技: 40, 剑法: 34, 拳掌: 26, 刀法: 22, 长兵: 20, 奇门: 48, 射术: 36 },
        combat: { level: 34, realm: '筑基', layer: 1, attack: 24, defense: 28, speed: 50 },
        skills: ['十里辨蹄', '纸上千里', '挑灯五分'],
        relationship: { affection: 14, trust: 10, respect: 0, favor: 0 },
        state: { mood: 50, stress: 46 },
        _isFixedDefinition: true
    },

    // v20.78 第四批奇门扩线：大旗门·樊惊筹（男主）。与铁中棠（正典门主）并存：惊筹是擎旗人，旗归他、门务归门主；
    // 三十七道暗针与针码对照在 dq 线展开；缝补意象限军用物件（护腕/行篷/纛旗），无顶针、无僧衣
    'sect_leader_大旗门': {
        name: '樊惊筹',
        trueName: '樊惊筹',
        title: '大旗门擎旗人',
        gender: 'male',
        age: 36,
        occupation: '大旗门擎旗人（阵前一声令下旗进人进，三百人的步子压在他一根旗杆上）',
        location: '大旗门',
        icon: '🏴',
        appearance: { hair: '铁冠束发，鬓角霜色早生', eyes: '阵前扫一眼就点清人数，灯下穿针一眼就找到线头', clothing: '旧甲外罩半旧战袍，甲缝里偶见一根不属于战场的细线', features: '左手掌心一道旗杆磨出的深沟，右手指尖却有针线磨出的细茧' },
        background: {
            origin: '军中缝纛匠之子，十六岁接父亲的旗杆，扛了二十年',
            family: '娘樊周氏，军中缝纛三十一年、纛旗四百二十七面，临了只教了他一句「旗是护人的，不是命换的」；父亲二十六年前在北商道抱旗淋了一夜雨，那年冬天没回来',
            history: '大旗门最悍的前锋，不会说整话，只会短促的军中用语：「跟上。」「别掉队。」「……冷不冷。」灯下做针线，手艺是娘教的，心里话全部缝进针脚',
            goal: '等一个能让他把旗放下、先护住的人——把那三十七个字当着一个愿意拆的人念完',
            secret: '护腕、行篷、他自己那面新纛的内衬里各缝了三十七道暗针，一道针脚一个字——同一句话他缝了三遍，因为一回也没敢说'
        },
        personalityBig5: { openness: 52, conscientiousness: 84, extraversion: 46, agreeableness: 58, neuroticism: 38 },
        mainAttributes: { strength: 96, dexterity: 60, intelligence: 64, willpower: 92, constitution: 88, meridian: 70 },
        combatSkills: { 内功: 80, 轻功: 44, 绝技: 76, 剑法: 30, 拳掌: 58, 刀法: 40, 长兵: 92, 奇门: 34, 射术: 46 },
        combat: { level: 76, realm: '金丹', layer: 6, attack: 86, defense: 82, speed: 56 },
        skills: ['擎旗不倒', '暗针缝纛', '令出如山'],
        relationship: { affection: 14, trust: 10, respect: 0, favor: 0 },
        state: { mood: 50, stress: 48 },
        _isFixedDefinition: true
    },

    // v20.78 第四批奇门扩线：铁掌帮·裘霜莺（女主）。与裘千仞（正典帮主）并存：霜莺是其孙女，
    // 管采石场与湖畔旧窑，不涉帮主之位；素坯泥哨与七窑哑火在 tz 线展开；
    // 与天龙教檀望舒的口技全面区分——霜莺只会鸟叫不会人声模仿，课题是「用自己的嗓子说话」
    'sect_leader_铁掌帮': {
        name: '裘霜莺',
        trueName: '裘霜莺',
        title: '凶脸唤雀',
        gender: 'female',
        age: 21,
        occupation: '铁掌帮采石场与湖畔旧窑管事（帮中上下都怵她，雀不怵）',
        location: '铁掌帮',
        icon: '🐦',
        appearance: { hair: '高马尾，发绳是烧窑用的耐火麻线', eyes: '不笑时像寻仇，笑起来小孩会哭——她自己知道，所以很少笑', clothing: '劲装短打，腰后一排小布袋，袋袋装着泥哨', features: '掌心铁掌功的厚茧，指腹却留着捏泥坯的细腻' },
        background: {
            origin: '铁掌帮裘氏正支，老帮主裘千仞之孙女',
            family: '母亲早逝，留下一句「哨是替嘴笨的人烧的」；老爷子疼她却不逼她问帮务',
            history: '天生凶脸，改以泥哨代言：一长一短＝「你来了」，三短促＝「过来」，两声低回＝「……没事，就是想吹一下」（这句她打死不承认是想你）。管采石场与湖畔旧窑，雾夜航船、码头夜巡全凭她一口哨令',
            goal: '烧一支「像人声的哨」——其实是要用自己的嗓子说完一句完整的话',
            secret: '哨架最上层那支无釉素坯是她七岁捏的第一支哨——十一年不进窑：不进窑，就永远差一步'
        },
        personalityBig5: { openness: 60, conscientiousness: 74, extraversion: 38, agreeableness: 60, neuroticism: 52 },
        mainAttributes: { strength: 88, dexterity: 72, intelligence: 60, willpower: 90, constitution: 84, meridian: 62 },
        combatSkills: { 内功: 66, 轻功: 52, 绝技: 62, 剑法: 20, 拳掌: 90, 刀法: 24, 长兵: 22, 奇门: 44, 射术: 50 },
        combat: { level: 55, realm: '筑基', layer: 9, attack: 76, defense: 84, speed: 70 },
        skills: ['铁掌桩功', '分水刺法', '唤雀哨音'],
        relationship: { affection: 14, trust: 10, respect: 0, favor: 0 },
        state: { mood: 52, stress: 44 },
        isFemale: true,
        _isFixedDefinition: true
    },

    // v20.78 第四批奇门扩线：昆仑派·姬云锦（女主）。与何足道（正典名册名）并存：何足道为前代旧名，
    // 云锦接剑为现任掌门、百年最年轻执剑人；「不舞于生人」古礼与素绸舞袖带在 kl 线展开；
    // 「谱」全程为剑舞谱（身段谱/步位图），与衡山派松香+半阙谱+胡琴零接触，剑柄素白无穗
    'sect_leader_昆仑派': {
        name: '姬云锦',
        trueName: '姬云锦',
        title: '剑舞掌门',
        gender: 'female',
        age: 24,
        occupation: '昆仑派掌门（西域玄门百年最年轻执剑人，剑舞祭山二十年无一失仪）',
        location: '昆仑派',
        icon: '🎐',
        appearance: { hair: '舞时散半肩，平时一束素绸——绸是及笄初舞的旧物', eyes: '看人像看步位，你站哪里她一眼就编排进舞里', clothing: '白袖束素绸，舞衣外罩掌门氅，氅角沾着瑶池的冰屑', features: '指节冻得发白也稳，握剑的手从不抖——抖的那回没人看见' },
        background: {
            origin: '昆仑山门脚下弃雪夜，被老掌门拾回养在舞台边',
            family: '师父即上代掌门（已故），无血亲，满门为家',
            history: '十四岁及笄初舞「迎雪」，接掌昆仑成百年最年轻执剑人。嘴上说不来「喜欢」二字，一说就卡壳、就转去擦剑——但她会跳：为你跳的那一套，名目本身就是话',
            goal: '让剑舞从死谱变活话——为读得懂舞的人，把谱末页的留白跳成有名目的舞',
            secret: '昆仑剑舞谱末页留白处藏着她自编三年、查无名目的一套舞——编给一个人，名目留给那个人定'
        },
        personalityBig5: { openness: 74, conscientiousness: 80, extraversion: 42, agreeableness: 56, neuroticism: 40 },
        mainAttributes: { strength: 66, dexterity: 92, intelligence: 78, willpower: 84, constitution: 68, meridian: 84 },
        combatSkills: { 内功: 76, 轻功: 88, 绝技: 82, 剑法: 92, 拳掌: 28, 刀法: 24, 长兵: 26, 奇门: 40, 射术: 30 },
        combat: { level: 76, realm: '金丹', layer: 6, attack: 84, defense: 70, speed: 90 },
        skills: ['迎雪剑舞', '两仪剑势', '天清诀意'],
        relationship: { affection: 14, trust: 10, respect: 0, favor: 0 },
        state: { mood: 52, stress: 42 },
        isFemale: true,
        _isFixedDefinition: true
    },

    // v20.78 第四批奇门扩线：全真教·翀玉衡（女主）。与马钰掌教代行（已织入 qz 线）并存：玉衡是功录房执事，
    // 只管账不管教务；功业日记与小银算盘在 qz 线展开；与逍遥派闻人酌的酒葫芦+账本零接触——玉衡是功业账，全文无酒字
    'sect_leader_全真教': {
        name: '翀玉衡',
        trueName: '翀玉衡',
        title: '功业记账',
        gender: 'female',
        age: 22,
        occupation: '全真教功录房执事（掌全教功过册与外账，十一年不差一铢）',
        location: '全真教',
        icon: '🧮',
        appearance: { hair: '道髻簪木钗，钗尾磨得发亮——是算盘珠改的', eyes: '看人像过账，一眼把你今日言行入了册', clothing: '青灰道袍浆洗挺括，腰间悬一具錾云纹的小银算盘', features: '指尖拨珠磨出薄茧，拨到那一栏时指会停半息' },
        background: {
            origin: '终南山下账房人家遗孤，七岁入全真观',
            family: '没有——师父坐化后，功录房的算盘就是她的家',
            history: '小银算盘被斥俗物，她拿账理当堂讲赢长老。你帮她一次她记一笔：「是日，彼替吾正了拂尘柄。记。」还的时候一本正经：「此债记账，你拿利息来还。」',
            goal: '找到那个让她那一栏账永远不肯两讫的人',
            secret: '功业日记末页那一栏只进不出，栏脚批着「此账，存疑」——不是算不平，是不肯平：账一旦两讫，就是你我互不相欠、再无往来'
        },
        personalityBig5: { openness: 68, conscientiousness: 96, extraversion: 52, agreeableness: 62, neuroticism: 36 },
        mainAttributes: { strength: 50, dexterity: 74, intelligence: 88, willpower: 78, constitution: 60, meridian: 80 },
        combatSkills: { 内功: 82, 轻功: 58, 绝技: 60, 剑法: 52, 拳掌: 30, 刀法: 22, 长兵: 20, 奇门: 64, 射术: 26 },
        combat: { level: 60, realm: '金丹', layer: 1, attack: 44, defense: 58, speed: 56 },
        skills: ['珠算通神', '过目成账', '清心守静'],
        relationship: { affection: 14, trust: 10, respect: 0, favor: 0 },
        state: { mood: 54, stress: 40 },
        isFemale: true,
        _isFixedDefinition: true
    },

    // v20.79 第五批少林收官：少林寺·竺照禅（女主，比丘尼戒师）。与释玄慈（正典方丈，本表上方旧卡）并存：
    // 后键覆盖前键（同 v20.74 武当张三丰→阙守拙先例）——方丈是寺中德高长辈，只在法会主位、隔殿佛号、
    // 朱批「照禅行事，自有分寸」里远景存在；戒律归照禅、寺务归方丈。批注经/念珠/栴檀林在 shao 线展开；
    // 木鱼/抄经纸（恒山专属）、百衲衣/青布（嵩山专属）、朱笔（阎罗殿专属）零接触，批注用「批笔」
    'sect_leader_少林寺': {
        name: '竺照禅',
        trueName: '竺照禅',
        title: '铁口栴檀庵主',
        gender: 'female',
        age: 46,
        occupation: '少林寺下院栴檀林庵主、延请戒师（戒律归她，寺务归方丈）',
        location: '少林寺',
        icon: '☸️',
        appearance: { hair: '带发修行，灰布包头一丝不苟', eyes: '看人像批功课——先找错处，再找可救处', clothing: '旧僧袍浆洗得笔挺，袖口磨出毛边', features: '指间一串盘得发亮的念珠，批经时搁在案角' },
        background: {
            origin: '嵩山少林寺下院栴檀林',
            family: '佛门带发修行，师父为上任栴檀林庵主',
            history: '师父临终一句「没学会心疼」骂出她的毒舌；批经三十年，旁批比原文还利，全寺僧人都怕她把功课批成筛子。骂人先合十念一声「阿弥陀佛」，然后引经据典地骂，骂得人被点醒还要谢她',
            goal: '把批注经里那一页空白落下去——骂遍天下人，关于你的最锋利一句，三十年落不下去',
            secret: '她那册批注经里关于你的最锋利一句，三十年落不下去；软话她一辈子没对人讲过，讲出来比骂还生涩'
        },
        personalityBig5: { openness: 72, conscientiousness: 92, extraversion: 44, agreeableness: 48, neuroticism: 26 },
        mainAttributes: { strength: 56, dexterity: 64, intelligence: 85, willpower: 92, constitution: 70, meridian: 78 },
        combatSkills: { 内功: 82, 轻功: 48, 绝技: 66, 剑法: 30, 拳掌: 60, 刀法: 20, 长兵: 44, 奇门: 36, 射术: 14 },
        combat: { level: 71, realm: '金丹', layer: 4, attack: 62, defense: 78, speed: 60 },
        skills: ['狮子吼', '禅心批注', '伏魔戒律'],
        relationship: { affection: 14, trust: 10, respect: 0, favor: 0 },
        state: { mood: 56, stress: 34 },
        isFemale: true,
        _isFixedDefinition: true
    }
};

// 导出
if (typeof window !== 'undefined') {
    window.SPECIAL_NPC_DATA = SPECIAL_NPC_DATA;
    window.SPECIAL_NPC_DEFINITIONS = SPECIAL_NPC_DEFINITIONS;
}

console.log(`🎭 10个特殊NPC数据已加载`);
console.log(`📋 固定核心NPC定义已加载: ${Object.keys(SPECIAL_NPC_DEFINITIONS).length} 个`);