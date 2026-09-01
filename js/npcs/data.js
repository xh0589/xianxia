// ========================================
// js/npcs/data.js - NPC预设数据
// Phase 1: 首批10个核心NPC
// ========================================

const NPC_DATA = {
    // ==================== 1. 导师型NPC ====================
    mentor_01: {
        id: 'mentor_01',
        name: '清虚道人',
        gender: 'male',
        age: 50,
        occupation: '长老',
        location: '武当派',
        icon: '🧘',
        appearance: {
            hair: '白色长发',
            eyes: '深邃',
            clothing: '道袍',
            features: '仙风道骨'
        },
        background: {
            origin: '青云门',
            family: '修仙世家',
            history: '自幼出家，修行三十年，佛法精深，武功高强',
            goal: '维护佛门正统，普度众生',
            secret: '年轻时曾与魔教圣女有过一段情缘'
        },
        personalityBig5: {
            openness: 60,
            conscientiousness: 90,
            extraversion: 30,
            agreeableness: 80,
            neuroticism: 10
        },
        combat: {
            level: 75,
            realm: '筑基',
            layer: 7,
            attack: 60,
            defense: 80,
            speed: 50,
            skills: ['达摩剑法', '易筋经', '金钟罩']
        },
        profession: {
            type: 'teacher',
            level: 85,
            specialization: '修炼指导'
        },
        preferences: {
            likedItems: [{category: '佛经', multiplier: 2}],
            dislikedItems: [{category: '酒肉', multiplier: 0.5}],
            giftMultiplier: 0.8
        },
        schedule: {
            default: [
                {time: '04:00-06:00', location: '修炼室', activity: '早课打坐'},
                {time: '06:00-08:00', location: '修炼室', activity: '指导弟子'},
                {time: '08:00-12:00', location: '讲堂', activity: '讲经说法'},
                {time: '12:00-14:00', location: '食堂', activity: '用斋'},
                {time: '14:00-18:00', location: '修炼室', activity: '闭关修炼'},
                {time: '18:00-20:00', location: '讲堂', activity: '答疑'},
                {time: '20:00-22:00', location: '修炼室', activity: '休息'}
            ]
        },
        dialogueTree: {
            topics: {
                greeting: {
                    all: ['{playerName}，你来修炼室有何事？', '阿弥陀佛，施主来了。', '今日修炼可有什么进展？'],
                    warm: ['看到你这么勤奋，为师很欣慰。']
                },
                cultivation: {
                    all: ['修炼讲究循序渐进，不可急于求成。', '我最近在参悟《清心诀》，颇有收获。', '你知道如何提升境界吗？'],
                    warm: ['我可以指点你几招修炼方法。']
                },
                sect: {
                    all: ['青云门最近又在招新了。', '各门派之间关系微妙啊...', '你对哪个门派感兴趣？']
                },
                market: {
                    all: ['最近坊市物价不太稳定。', '灵石现在比较紧缺啊。']
                },
                dungeon: {
                    all: ['后山的秘境据说有宝物出世。', '探险要注意安全。']
                },
                gossip: {
                    all: ['告诉你个秘密...', '你听说某某的事了吗？']
                },
                personal: {
                    all: ['其实我有心事想找人说说...', '你相信命运吗？']
                },
                quest: {
                    all: ['我有个忙可能需要你的帮助...', '最近有些事情需要人去处理。']
                }
            },
            topicRequirements: {
                personal: { minAffection: 40 },
                quest: { minAffection: 30 }
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
        appearance: {
            hair: '黑色长发',
            eyes: '温柔',
            clothing: '白色长裙',
            features: '气质温婉'
        },
        background: {
            origin: '药王谷',
            family: '医道世家',
            history: '自幼学习医术，精通药理和针灸',
            goal: '悬壶济世，救治更多人',
            secret: '身患奇毒，时日无多'
        },
        personalityBig5: {
            openness: 70,
            conscientiousness: 85,
            extraversion: 60,
            agreeableness: 90,
            neuroticism: 30
        },
        combat: {
            level: 30,
            realm: '炼气',
            layer: 3,
            attack: 20,
            defense: 40,
            speed: 35,
            skills: ['针灸术', '草药辨识']
        },
        profession: {
            type: 'healer',
            level: 80,
            specialization: '医术'
        },
        preferences: {
            likedItems: [{category: '草药', multiplier: 2}],
            dislikedItems: [{category: '武器', multiplier: 0.5}],
            giftMultiplier: 1.2
        },
        schedule: {
            default: [
                {time: '07:00-12:00', location: '医馆', activity: '坐诊'},
                {time: '12:00-14:00', location: '花园', activity: '采药'},
                {time: '14:00-19:00', location: '医馆', activity: '制药'},
                {time: '19:00-22:00', location: '住所', activity: '休息'}
            ]
        },
        dialogueTree: {
            topics: {
                greeting: {
                    all: ['你好，{playerName}。哪里不舒服吗？', '欢迎来到医馆。'],
                    warm: ['看到你这么健康，我很高兴。']
                },
                cultivation: {
                    all: ['修炼过度会伤身，要注意休息。', '我可以教你一些恢复体力的方法。']
                },
                market: {
                    all: ['最近药材价格上涨了不少。', '你知道哪里能买到稀有草药吗？']
                },
                gossip: {
                    all: ['听说铁匠铺的老王生病了...', '你听说某某的事了吗？']
                },
                personal: {
                    all: ['其实我也有自己的烦恼...', '你相信命运吗？']
                },
                quest: {
                    all: ['我需要一些稀有药材，你能帮我采集吗？']
                }
            },
            topicRequirements: {
                personal: { minAffection: 40 },
                quest: { minAffection: 30 }
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
        appearance: {
            hair: '短发',
            eyes: '锐利',
            clothing: '战甲',
            features: '肌肉发达'
        },
        background: {
            origin: '边陲小镇',
            family: '军人世家',
            history: '从小习武，参加过多次战役',
            goal: '成为最强战士',
            secret: '曾经败给过一个神秘对手'
        },
        personalityBig5: {
            openness: 40,
            conscientiousness: 80,
            extraversion: 70,
            agreeableness: 50,
            neuroticism: 40
        },
        combat: {
            level: 65,
            realm: '筑基',
            layer: 5,
            attack: 80,
            defense: 70,
            speed: 55,
            skills: ['铁拳功', '战甲术', '冲锋']
        },
        profession: {
            type: 'guard',
            level: 70,
            specialization: '战斗指导'
        },
        preferences: {
            likedItems: [{category: '武器', multiplier: 2}],
            dislikedItems: [{category: '佛经', multiplier: 0.5}],
            giftMultiplier: 1.0
        },
        schedule: {
            default: [
                {time: '05:00-08:00', location: '演武场', activity: '晨练'},
                {time: '08:00-12:00', location: '军营', activity: '训练士兵'},
                {time: '12:00-14:00', location: '食堂', activity: '用膳'},
                {time: '14:00-18:00', location: '演武场', activity: '切磋'},
                {time: '18:00-22:00', location: '军营', activity: '休息'}
            ]
        },
        dialogueTree: {
            topics: {
                greeting: {
                    all: ['{playerName}，来切磋一场吗？', '有什么需要帮忙的？'],
                    warm: ['你的进步很大，值得称赞。']
                },
                cultivation: {
                    all: ['战斗是最好的修炼方式。', '你知道如何提升战斗力吗？']
                },
                market: {
                    all: ['武器价格最近波动很大。', '好装备需要花大价钱。']
                },
                dungeon: {
                    all: ['秘境里有很多强敌，要小心。', '我上次去秘境差点回不来。']
                },
                gossip: {
                    all: ['听说某某在秘境里遇到了危险...']
                },
                quest: {
                    all: ['我需要你去帮我做件事...']
                }
            },
            topicRequirements: {
                quest: { minAffection: 30 }
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
        appearance: {
            hair: '梳得整齊',
            eyes: '精明',
            clothing: '华丽长袍',
            features: '笑容满面的胖子'
        },
        background: {
            origin: '商业世家',
            family: '贾家',
            history: '三代经商，人脉广泛',
            goal: '建立商业帝国',
            secret: '暗中从事禁品交易'
        },
        personalityBig5: {
            openness: 75,
            conscientiousness: 60,
            extraversion: 85,
            agreeableness: 40,
            neuroticism: 20
        },
        combat: {
            level: 25,
            realm: '炼气',
            layer: 2,
            attack: 15,
            defense: 20,
            speed: 25,
            skills: ['逃跑术']
        },
        profession: {
            type: 'merchant',
            level: 90,
            specialization: '贸易'
        },
        preferences: {
            likedItems: [{category: '灵石', multiplier: 3}],
            dislikedItems: [{category: '赃物', multiplier: 0.5}],
            giftMultiplier: 0.5
        },
        schedule: {
            default: [
                {time: '08:00-12:00', location: '坊市', activity: '开店'},
                {time: '12:00-14:00', location: '餐馆', activity: '午餐'},
                {time: '14:00-18:00', location: '坊市', activity: '进货'},
                {time: '18:00-22:00', location: '旅馆', activity: '社交'}
            ]
        },
        dialogueTree: {
            topics: {
                greeting: {
                    all: ['欢迎光临小店，{playerName}！', '今天想买点什么？'],
                    warm: ['你是我最尊贵的客人。']
                },
                market: {
                    all: ['最近灵石涨价了...', '我有个好消息，进了一批好货。'],
                    warm: ['我可以给你特别优惠。']
                },
                dungeon: {
                    all: ['听说秘境里有稀有材料出售。']
                },
                gossip: {
                    all: ['我听说了一些有趣的消息...', '你知道某某商人的事吗？']
                },
                quest: {
                    all: ['我需要你去帮我取件东西...']
                }
            },
            topicRequirements: {
                quest: { minAffection: 30 }
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
        appearance: {
            hair: '银色长发',
            eyes: '冰冷',
            clothing: '蓝色道袍',
            features: '周身散发着寒气'
        },
        background: {
            origin: '天山派',
            family: '修仙世家',
            history: '修炼寒冰功法百年，实力深不可测',
            goal: '突破金丹期',
            secret: '体内寒冰真气反噬，随时可能走火入魔'
        },
        personalityBig5: {
            openness: 30,
            conscientiousness: 95,
            extraversion: 15,
            agreeableness: 20,
            neuroticism: 60
        },
        combat: {
            level: 90,
            realm: '金丹',
            layer: 5,
            attack: 85,
            defense: 90,
            speed: 70,
            skills: ['寒冰掌', '冰霜剑阵', '绝对零度']
        },
        profession: {
            type: 'teacher',
            level: 80,
            specialization: '寒冰功法'
        },
        preferences: {
            likedItems: [{category: '冰属性材料', multiplier: 2}],
            dislikedItems: [{category: '火属性物品', multiplier: 0.3}],
            giftMultiplier: 0.6
        },
        schedule: {
            default: [
                {time: '00:00-04:00', location: '修炼室', activity: '修炼寒冰功'},
                {time: '04:00-08:00', location: '修炼室', activity: '打坐'},
                {time: '08:00-12:00', location: '议事厅', activity: '处理门派事务'},
                {time: '12:00-14:00', location: '食堂', activity: '用斋'},
                {time: '14:00-18:00', location: '修炼室', activity: '指导弟子'},
                {time: '18:00-24:00', location: '修炼室', activity: '闭关'}
            ]
        },
        dialogueTree: {
            topics: {
                greeting: {
                    all: ['有事禀报？', '没什么事就退下吧。'],
                    warm: ['你倒是个可造之材。']
                },
                cultivation: {
                    all: ['寒冰功法讲究心如止水。', '你的修为还有很大提升空间。']
                },
                sect: {
                    all: ['其他门派不过如此。', '天山派的寒冰功法天下第一。']
                },
                quest: {
                    all: ['我需要你去取一样东西...']
                }
            },
            topicRequirements: {
                quest: { minAffection: 40 }
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
        appearance: {
            hair: '黑色长发',
            eyes: '狡黠',
            clothing: '紫色长衫',
            features: '风度翩翩但眼神危险'
        },
        background: {
            origin: '神秘组织',
            family: '未知',
            history: '天才修士，但行事不正',
            goal: '收集所有秘籍',
            secret: '其实是魔教卧底'
        },
        personalityBig5: {
            openness: 85,
            conscientiousness: 30,
            extraversion: 90,
            agreeableness: 15,
            neuroticism: 50
        },
        combat: {
            level: 70,
            realm: '筑基',
            layer: 8,
            attack: 75,
            defense: 55,
            speed: 80,
            skills: ['幻影步', '迷魂术', '邪剑诀']
        },
        profession: {
            type: 'wanderer',
            level: 60,
            specialization: '暗杀'
        },
        preferences: {
            likedItems: [{category: '毒药', multiplier: 2}],
            dislikedItems: [{category: '解毒丹', multiplier: 0.3}],
            giftMultiplier: 0.7
        },
        schedule: {
            default: [
                {time: '00:00-06:00', location: '野外', activity: '执行任务'},
                {time: '06:00-12:00', location: '城镇', activity: '打探消息'},
                {time: '12:00-14:00', location: '酒馆', activity: '社交'},
                {time: '14:00-20:00', location: '野外', activity: '修炼'},
                {time: '20:00-24:00', location: '据点', activity: '汇报'}
            ]
        },
        dialogueTree: {
            topics: {
                greeting: {
                    all: ['哟，这不是{playerName}吗？', '又见面了，有趣的人。'],
                    warm: ['我们或许可以合作...']
                },
                cultivation: {
                    all: ['修炼嘛，不择手段才是王道。', '你知道邪剑诀的威力吗？']
                },
                sect: {
                    all: ['正道人士都是伪君子。', '魔教其实也没那么坏。']
                },
                gossip: {
                    all: ['我有个惊天秘密要告诉你...', '你知道某某的真实身份吗？']
                },
                quest: {
                    all: ['跟我合作，我有好事分享。']
                }
            },
            topicRequirements: {
                quest: { minAffection: 20 }
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
        appearance: {
            hair: '花白',
            eyes: '慈祥',
            clothing: '粗布麻衣',
            features: '满脸皱纹'
        },
        background: {
            origin: '新手村',
            family: '世代务农',
            history: '一辈子没离开过村子，见过很多修仙者来来往往',
            goal: '希望孙子能成为修仙者',
            secret: '年轻时也曾梦想修仙'
        },
        personalityBig5: {
            openness: 30,
            conscientiousness: 70,
            extraversion: 50,
            agreeableness: 85,
            neuroticism: 40
        },
        combat: {
            level: 5,
            realm: '凡人',
            layer: 0,
            attack: 5,
            defense: 5,
            speed: 5,
            skills: []
        },
        profession: {
            type: 'farmer',
            level: 40,
            specialization: '农耕'
        },
        preferences: {
            likedItems: [{category: '食物', multiplier: 2}],
            dislikedItems: [{category: '武器', multiplier: 0.5}],
            giftMultiplier: 1.5
        },
        schedule: {
            default: [
                {time: '05:00-08:00', location: '田地', activity: '耕作'},
                {time: '08:00-12:00', location: '村庄', activity: '闲聊'},
                {time: '12:00-14:00', location: '家中', activity: '午休'},
                {time: '14:00-18:00', location: '田地', activity: '耕作'},
                {time: '18:00-22:00', location: '家中', activity: '休息'}
            ]
        },
        dialogueTree: {
            topics: {
                greeting: {
                    all: ['哎呀，是{playerName}啊。', '小伙子/姑娘，有什么事吗？'],
                    warm: ['你就像我孙子一样可爱。']
                },
                gossip: {
                    all: ['我听说村里来了个修仙的天才...', '你知道吗，后山有妖怪！'],
                    warm: ['其实我知道一些关于你身世的事...']
                },
                quest: {
                    all: ['你能帮我去后山采些草药吗？']
                }
            },
            topicRequirements: {
                quest: { minAffection: 20 }
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
        appearance: {
            hair: '黑色短发',
            eyes: '专注',
            clothing: '炼丹围裙',
            features: '手上总有药味'
        },
        background: {
            origin: '药王谷',
            family: '炼丹世家',
            history: '三代炼丹，经验丰富',
            goal: '炼制出传说中的九转金丹',
            secret: '曾经炼丹失败炸毁过一个山洞'
        },
        personalityBig5: {
            openness: 60,
            conscientiousness: 95,
            extraversion: 25,
            agreeableness: 60,
            neuroticism: 50
        },
        combat: {
            level: 40,
            realm: '筑基',
            layer: 2,
            attack: 30,
            defense: 45,
            speed: 35,
            skills: ['炼丹术', '毒雾']
        },
        profession: {
            type: 'crafter',
            level: 90,
            specialization: '炼丹'
        },
        preferences: {
            likedItems: [{category: '草药', multiplier: 2}, {category: '炼丹材料', multiplier: 2}],
            dislikedItems: [{category: '武器', multiplier: 0.5}],
            giftMultiplier: 1.0
        },
        schedule: {
            default: [
                {time: '06:00-12:00', location: '炼丹房', activity: '炼丹'},
                {time: '12:00-14:00', location: '药房', activity: '采药'},
                {time: '14:00-18:00', location: '炼丹房', activity: '研究丹方'},
                {time: '18:00-22:00', location: '住所', activity: '休息'}
            ]
        },
        dialogueTree: {
            topics: {
                greeting: {
                    all: ['欢迎来到炼丹房，{playerName}。', '需要什么丹药？'],
                    warm: ['你是我见过最有天赋的炼丹学徒。']
                },
                cultivation: {
                    all: ['丹药可以辅助修炼，但不能依赖。', '你知道各种丹药的功效吗？']
                },
                market: {
                    all: ['最近药材价格涨了。', '稀有材料不好找啊。']
                },
                quest: {
                    all: ['我需要一些稀有药材来炼制新药。']
                }
            },
            topicRequirements: {
                quest: { minAffection: 30 }
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
        appearance: {
            hair: '短发',
            eyes: '坚定',
            clothing: '皮围裙',
            features: '肌肉发达，满身汗水'
        },
        background: {
            origin: '炎城',
            family: '铁匠世家',
            history: '祖传铸剑技艺，擅长打造法器',
            goal: '铸造出传世神兵',
            secret: '曾经打造过一把被诅咒的剑'
        },
        personalityBig5: {
            openness: 40,
            conscientiousness: 90,
            extraversion: 35,
            agreeableness: 65,
            neuroticism: 30
        },
        combat: {
            level: 50,
            realm: '筑基',
            layer: 3,
            attack: 60,
            defense: 50,
            speed: 40,
            skills: ['锤击', '铁甲术']
        },
        profession: {
            type: 'crafter',
            level: 85,
            specialization: '铸剑'
        },
        preferences: {
            likedItems: [{category: '矿石', multiplier: 2}, {category: '武器', multiplier: 1.5}],
            dislikedItems: [{category: '丹药', multiplier: 0.5}],
            giftMultiplier: 1.0
        },
        schedule: {
            default: [
                {time: '06:00-12:00', location: '铁匠铺', activity: '打铁'},
                {time: '12:00-14:00', location: '餐馆', activity: '午餐'},
                {time: '14:00-18:00', location: '铁匠铺', activity: '锻造'},
                {time: '18:00-22:00', location: '家中', activity: '休息'}
            ]
        },
        dialogueTree: {
            topics: {
                greeting: {
                    all: ['欢迎，{playerName}！需要打造什么？', '有什么需要帮忙的吗？'],
                    warm: ['你的装备我来打造，放心！']
                },
                market: {
                    all: ['矿石价格又涨了。', '好材料可遇不可求。']
                },
                quest: {
                    all: ['我需要你去帮我找一些稀有矿石。']
                }
            },
            topicRequirements: {
                quest: { minAffection: 30 }
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
        appearance: {
            hair: '白色长发',
            eyes: '深邃如星空',
            clothing: '破旧道袍',
            features: '胡须及腰，眼神神秘'
        },
        background: {
            origin: '未知',
            family: '未知',
            history: '无人知晓他的来历，据说活了上百年',
            goal: '寻找传人',
            secret: '曾是上古大能，因遭背叛而隐居'
        },
        personalityBig5: {
            openness: 95,
            conscientiousness: 50,
            extraversion: 10,
            agreeableness: 70,
            neuroticism: 20
        },
        combat: {
            level: 95,
            realm: '元婴',
            layer: 1,
            attack: 90,
            defense: 85,
            speed: 80,
            skills: ['上古法术', '时空扭曲', '灵魂攻击']
        },
        profession: {
            type: 'wanderer',
            level: 95,
            specialization: '上古功法'
        },
        preferences: {
            likedItems: [{category: '古籍', multiplier: 3}],
            dislikedItems: [{category: '现代法器', multiplier: 0.5}],
            giftMultiplier: 2.0
        },
        schedule: {
            default: [
                {time: '00:00-06:00', location: '山洞', activity: '修炼'},
                {time: '06:00-12:00', location: '山洞', activity: '打坐'},
                {time: '12:00-18:00', location: '山林', activity: '游历'},
                {time: '18:00-24:00', location: '山洞', activity: '冥想'}
            ]
        },
        dialogueTree: {
            topics: {
                greeting: {
                    all: ['哦？又一个来访者...', '{playerName}，你与我见过的其他人不同。'],
                    warm: ['你我有缘，我便传你一些本事。']
                },
                cultivation: {
                    all: ['真正的修炼，在于心境。', '你知道上古修炼之法吗？'],
                    warm: ['我可以传授你失传的上古功法。']
                },
                personal: {
                    all: ['我的过去...说来话长。', '我曾经也和你一样年轻。'],
                    warm: ['我选你为传人，因为...你让我看到了当年的自己。']
                },
                quest: {
                    all: ['我需要你去完成一件重要的事情...']
                }
            },
            topicRequirements: {
                personal: { minAffection: 50 },
                quest: { minAffection: 40 }
            }
        }
    }
};

// 导出
if (typeof window !== 'undefined') {
    window.NPC_DATA = NPC_DATA;
}
