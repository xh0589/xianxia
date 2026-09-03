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
            gossip: { all: ['告诉你个秘密...', '你听说某某的事了吗？'] },
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
            gossip: { all: ['听说铁匠铺的老王生病了...', '你听说某某的事了吗？'] },
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
            gossip: { all: ['听说某某在秘境里遇到了危险...'] },
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
            gossip: { all: ['我听说了一些有趣的消息...', '你知道某某商人的事吗？'] },
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
            gossip: { all: ['我有个惊天秘密要告诉你...', '你知道某某的真实身份吗？'] },
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
            gossip: { all: ['我听说村里来了个修仙的天才...', '你知道吗，后山有妖怪！'], warm: ['其实我知道一些关于你身世的事...'] },
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
            history: '八岁入天山，与师姐琤青鸾相依。十八岁那年天魔袭击天山，师姐以己身挡下她致命一击、血溅霜鸣剑。此后她再不笑、只守剑。二十六岁代童姥掌天山日常，江湖称"雪隐剑姬"',
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
    }
};

// 导出
if (typeof window !== 'undefined') {
    window.SPECIAL_NPC_DATA = SPECIAL_NPC_DATA;
    window.SPECIAL_NPC_DEFINITIONS = SPECIAL_NPC_DEFINITIONS;
}

console.log(`🎭 10个特殊NPC数据已加载`);
console.log(`📋 固定核心NPC定义已加载: ${Object.keys(SPECIAL_NPC_DEFINITIONS).length} 个`);