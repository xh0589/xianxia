/**
 * xianxia-npc-system.js - NPC完整系统
 * 从Degrees of Lewdity提取的NPC功能集成
 */

// ==================== 通用工具函数 ====================
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function randomChoice(array) {
    if (!array || array.length === 0) return '';
    return array[Math.floor(Math.random() * array.length)];
}

function deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            result[key] = deepMerge(result[key] || {}, source[key]);
        } else {
            result[key] = source[key];
        }
    }
    return result;
}

function npcNowGameMinute() {
    if (window.GameScheduler && typeof window.GameScheduler.nowMinute === 'function') return window.GameScheduler.nowMinute();
    if (window.timeSystem && window.timeSystem.gameTime) return Number(window.timeSystem.gameTime.totalMinutes) || 0;
    return 0;
}

function npcLastMeetGameMinute(npc) {
    if (!npc || !npc.memory) return null;
    var value = Number(npc.memory.lastMeetGameMinute);
    if (Number.isFinite(value) && value >= 0) return value;
    // 旧存档只有现实时间戳，无法无损映射到游戏历法；从加载时刻重新起算，避免瞬间衰减。
    if (npc.memory.lastMeetTime || npc.memory.firstMet) {
        npc.memory.lastMeetGameMinute = npcNowGameMinute();
        return npc.memory.lastMeetGameMinute;
    }
    return null;
}

function markNPCMetNow(npc) {
    if (!npc || !npc.memory) return;
    npc.memory.lastMeetGameMinute = npcNowGameMinute();
    // 保留现实时间仅供旧UI/调试兼容，不再参与任何玩法判定。
    // v12.3 修复：此处原为 markNPCMetNow(npc) 无限递归导致 Maximum call stack size exceeded
    if (!npc.memory.lastMeetTime) npc.memory.lastMeetTime = Date.now();
}

// ==================== 深谈大类定义 ====================
const DEEP_TALK_CATEGORIES = {
    topics: {
        id: 'topics',
        name: '📖 话题',
        icon: '📖',
        description: '日常闲聊，增进感情',
        subOptions: [
            { id: 'recent', name: '近况如何', desc: '聊聊最近的生活', minAffection: 0, affectionCost: 0 },
            { id: 'hobbies', name: '兴趣爱好', desc: '了解NPC喜欢什么', minAffection: 10, affectionCost: 0 },
            { id: 'history', name: '过往经历', desc: 'NPC讲述自己的故事', minAffection: 20, affectionCost: 0 },
            { id: 'future', name: '未来打算', desc: 'NPC的人生目标', minAffection: 30, affectionCost: 0 },
            { id: 'worries', name: '烦恼心事', desc: 'NPC倾诉烦恼', minAffection: 40, affectionCost: 0 },
            { id: 'dreams', name: '梦想愿望', desc: 'NPC的梦想', minAffection: 50, affectionCost: 0 },
            { id: 'complaints', name: '吐槽抱怨', desc: 'NPC发泄不满', minAffection: 20, affectionCost: 0 }
        ]
    },
    intel: {
        id: 'intel',
        name: '🗣️ 情报',
        icon: '🗣️',
        description: '打听消息',
        subOptions: [
            { id: 'market_prices', name: '坊市物价', desc: '哪里买东西便宜', minAffection: 0, affectionCost: 0 },
            { id: 'secret_realms', name: '秘境消息', desc: '哪里有秘境/宝物', minAffection: 10, affectionCost: 0 },
            { id: 'gossip', name: '人物八卦', desc: '其他NPC/妖兽的事', minAffection: 15, affectionCost: 0 },
            { id: 'sect_movements', name: '门派动向', desc: '各门派在做什么', minAffection: 20, affectionCost: 0 },
            { id: 'black_market', name: '黑市消息', desc: '地下交易情报', minAffection: 30, affectionCost: 0 }
        ]
    },
    love: {
        id: 'love',
        name: '💕 爱情',
        icon: '💕',
        description: '情感互动',
        subOptions: [
            { id: 'express_like', name: '表达好感', desc: '说些好听的话', minAffection: 40, affectionCost: 0 },
            { id: 'spend_time', name: '共度时光', desc: '一起散步/赏景', minAffection: 50, affectionCost: 0 },
            { id: 'confess', name: '倾诉心意', desc: '认真表白', minAffection: 60, affectionCost: 0 },
            { id: 'intimate', name: '亲密接触', desc: '牵手/拥抱', minAffection: 70, affectionCost: 0 },
            { id: 'bond_dao', name: '确定关系', desc: '结为道侣', minAffection: 80, affectionCost: 0 }
        ]
    },
    requests: {
        id: 'requests',
        name: '🙏 请求',
        icon: '🙏',
        description: '向NPC求助',
        // P1-4: 门槛与 ADVANCED_REQUEST_TYPES 统一，affectionCost 仅为UI提示，实际扣费在执行时
        subOptions: [
            { id: 'teach_skill', name: '请教功法', desc: 'NPC传授功法', minAffection: 60, affectionCost: 0, minFavor: 30 },
            { id: 'request_heal', name: '请求治疗', desc: '恢复生命/真气', minAffection: 30, affectionCost: 0, minFavor: 5 },
            { id: 'request_accompany', name: '请求陪同', desc: 'NPC陪你去某地', minAffection: 50, affectionCost: 0, minFavor: 20 },
            { id: 'borrow_item', name: '请求借物', desc: '借装备/书籍', minAffection: 40, affectionCost: 0, minFavor: 10 },
            { id: 'request_guidance', name: '请求指点', desc: '修炼方向建议', minAffection: 20, affectionCost: 0, minFavor: 5 },
            { id: 'request_asylum', name: '请求庇护', desc: '躲避仇家', minAffection: 70, affectionCost: 0, minFavor: 40 }
        ]
    },
    quests: {
        id: 'quests',
        name: '📜 委托',
        icon: '📜',
        description: '承接NPC委托',
        subOptions: [
            { id: 'accept_quest', name: '承接委托', desc: '查看NPC的委托任务', minAffection: 10, affectionCost: 0 }
        ]
    },
    cultivation_guidance: {
        id: 'cultivation_guidance',
        name: '🧘 修炼指导',
        icon: '🧘',
        description: '提升实力',
        subOptions: [
            { id: 'breakthrough_guide', name: '突破指导', desc: '如何突破境界', minAffection: 30, affectionCost: 10 },
            { id: 'inner_arts', name: '心法讲解', desc: '内功心法解析', minAffection: 20, affectionCost: 5 },
            { id: 'combat_tips', name: '战斗技巧', desc: '实战经验分享', minAffection: 20, affectionCost: 5 },
            { id: 'root_cultivation', name: '灵根修炼', desc: '针对灵根的修炼法', minAffection: 30, affectionCost: 10 },
            { id: 'insight_share', name: '感悟分享', desc: '修炼心得交流', minAffection: 40, affectionCost: 8 }
        ]
    },
    gifts: {
        id: 'gifts',
        name: '🎁 赠礼',
        icon: '🎁',
        description: '给NPC送东西',
        subOptions: [
            { id: 'give_gift', name: '赠送礼物', desc: '打开背包选物品赠送', minAffection: 0, affectionCost: 0 }
        ]
    },
    farewell: {
        id: 'farewell',
        name: '👋 告别',
        icon: '👋',
        description: '结束对话',
        subOptions: [
            { id: 'farewell_normal', name: '普通告别', desc: '"我先走了"', minAffection: 0, affectionCost: 0 },
            { id: 'farewell_promise', name: '约定再见', desc: '"下次再来"', minAffection: 20, affectionCost: 0 },
            { id: 'farewell_reluctant', name: '依依不舍', desc: '"不想走"', minAffection: 60, affectionCost: 0 },
            { id: 'farewell_hurry', name: '匆匆离开', desc: '"有事，先走了"', minAffection: 0, affectionCost: 0 }
        ]
    }
};

// ==================== 深谈分支对话树定义 ====================
// 每个分支树按 (npcId, categoryId, subOptionId) 索引
// 当玩家选择有分支树的子选项时，进入分支选择模式
const DEEP_TALK_BRANCHES = {
    // 清虚道人 - 话题 > 过往经历
    'mentor_01_topics_history': {
        intro: {
            text: function(npc) {
                const name = npc.name;
                return name + ' 沉思片刻，目光变得深邃：「我年轻时也曾游历四方……那段经历，改变了我的一生。」';
            },
            choices: [
                { text: '「我想听你详细说说」', next: 'trust_path', effect: { affection: 2, trust: 2 } },
                { text: '「只说你愿意说的就好」', next: 'respect_path', effect: { respect: 2, affection: 1 } },
                { text: '「算了，不提也罢」', next: 'end', effect: { affection: 0 } }
            ]
        },
        trust_path: {
            text: function(npc) {
                return npc.name + ' 微微一笑：「你是第一个愿意听我说这些的人。当年我在西域游历，曾遇到一个神秘的女子……」';
            },
            choices: [
                { text: '「后来呢？发生了什么？」', next: 'secret_hint', effect: { affection: 3, trust: 3 } },
                { text: '「那位女子对你很重要吧？」', next: 'deep_understanding', effect: { affection: 4, trust: 2 } }
            ]
        },
        respect_path: {
            text: function(npc) {
                return npc.name + ' 赞许地点头：「你懂得分寸，很好。那我便说说我能说的部分。」';
            },
            choices: [
                { text: '「洗耳恭听」', next: 'end', effect: { respect: 3, affection: 1 } },
                { text: '「以后你愿意说时，我随时都在」', next: 'end', effect: { affection: 3, trust: 2 } }
            ]
        },
        secret_hint: {
            text: function(npc) {
                return npc.name + ' 压低声音：「那女子……其实是魔教圣女。我们之间有过一段情缘，但终究是正邪不两立。」';
            },
            choices: [
                { text: '「正邪之分真有那么重要吗？」', next: 'end', effect: { affection: 5, trust: 5, unlockSecret: 'mentor_secret_01' } },
                { text: '「你后悔吗？」', next: 'end', effect: { affection: 3, trust: 3 } }
            ]
        },
        deep_understanding: {
            text: function(npc) {
                return npc.name + ' 眼中闪过一丝怀念：「她……确实很重要。有些事，过去了就让它过去吧。」';
            },
            choices: [
                { text: '「我明白了，尊重你的选择」', next: 'end', effect: { respect: 4, affection: 2 } },
                { text: '「如果有一天你想倾诉，我在这里」', next: 'end', effect: { affection: 3, trust: 4 } }
            ]
        },
        end: { text: function() { return '（对话结束）'; }, isEnd: true }
    },

    // 灵素 - 话题 > 烦恼心事
    'healer_01_topics_worries': {
        intro: {
            text: function(npc) {
                return npc.name + ' 轻叹一声：「其实……我最近确实有些心事。总觉得身体越发不如从前了。」';
            },
            choices: [
                { text: '「让我帮你看看？」', next: 'heal_check', effect: { affection: 2, trust: 2 } },
                { text: '「别太劳累了，休息一下吧」', next: 'care_path', effect: { affection: 2, respect: 1 } },
                { text: '「每个人都会有不舒服的时候」', next: 'comfort_path', effect: { affection: 1 } }
            ]
        },
        heal_check: {
            text: function(npc) {
                return npc.name + ' 犹豫了一下，伸出手腕：「你还会医术？……那麻烦你了。」';
            },
            choices: [
                { text: '「你体内有一股奇毒……！」', next: 'secret_reveal', effect: { affection: 4, trust: 4, unlockSecret: 'healer_secret_01' } },
                { text: '「只是劳累过度，需要调养」', next: 'end', effect: { affection: 3, trust: 2 } }
            ]
        },
        care_path: {
            text: function(npc) {
                return npc.name + ' 眼中一暖：「谢谢你的关心……很少有人会这样对我说。」';
            },
            choices: [
                { text: '「你值得被关心」', next: 'end', effect: { affection: 4, trust: 3 } },
                { text: '「以后有什么需要尽管说」', next: 'end', effect: { affection: 3, trust: 2, respect: 1 } }
            ]
        },
        comfort_path: {
            text: function(npc) {
                return npc.name + ' 微微一笑：「你说得对，是我多虑了。」';
            },
            choices: [
                { text: '「开心点，我请你吃好吃的」', next: 'end', effect: { affection: 2, moodBoost: 5 } },
                { text: '「需要我帮忙采药就说」', next: 'end', effect: { affection: 3, trust: 1 } }
            ]
        },
        secret_reveal: {
            text: function(npc) {
                return npc.name + ' 脸色一变：「你……你怎么知道？这毒我从未告诉过任何人。」';
            },
            choices: [
                { text: '「让我帮你找解药」', next: 'end', effect: { affection: 6, trust: 5, unlockSecret: 'healer_secret_02' } },
                { text: '「这件事我不会告诉别人」', next: 'end', effect: { affection: 4, trust: 6 } }
            ]
        },
        end: { text: function() { return '（对话结束）'; }, isEnd: true }
    },

    // 铁山 - 话题 > 吐槽抱怨
    'warrior_01_topics_complaints': {
        intro: {
            text: function(npc) {
                return npc.name + ' 不满地哼了一声：「最近真是憋屈！上面那些老东西就知道下命令，根本不懂前线的情况！」';
            },
            choices: [
                { text: '「我支持你，你说的对」', next: 'ally_path', effect: { affection: 2, trust: 2 } },
                { text: '「也许他们有他们的考量」', next: 'diplomatic_path', effect: { respect: 2 } },
                { text: '「别放在心上，喝酒去」', next: 'drink_path', effect: { affection: 1 } }
            ]
        },
        ally_path: {
            text: function(npc) {
                return npc.name + ' 拍了拍你的肩膀：「好兄弟！就你懂我！上次那些命令害得我损失了好几个好手。」';
            },
            choices: [
                { text: '「需要我帮忙做什么吗？」', next: 'quest_offer', effect: { affection: 3, trust: 3 } },
                { text: '「下次有什么行动叫上我」', next: 'end', effect: { affection: 3, trust: 2 } }
            ]
        },
        diplomatic_path: {
            text: function(npc) {
                return npc.name + ' 皱眉：「你这话说得……倒也有道理。不过我就是咽不下这口气。」';
            },
            choices: [
                { text: '「忍一时风平浪静」', next: 'end', effect: { respect: 2, affection: 1 } },
                { text: '「那就用实力说话」', next: 'end', effect: { affection: 2, respect: 1 } }
            ]
        },
        drink_path: {
            text: function(npc) {
                return npc.name + ' 眼睛一亮：「好！走！不醉不归！」';
            },
            choices: [
                { text: '「干杯！」', next: 'end', effect: { affection: 3, moodBoost: 10 } },
                { text: '「边喝边说说你的烦恼」', next: 'end', effect: { affection: 4, trust: 2 } }
            ]
        },
        quest_offer: {
            text: function(npc) {
                return npc.name + ' 想了想：「确实有件事需要你帮忙……最近后山有妖兽出没，我一个人应付不来。」';
            },
            choices: [
                { text: '「包在我身上！」', next: 'end', effect: { affection: 5, trust: 4, respect: 3 } },
                { text: '「我考虑一下……」', next: 'end', effect: { affection: 2, trust: 1 } }
            ]
        },
        end: { text: function() { return '（对话结束）'; }, isEnd: true }
    }
};

// ==================== NPC职业特有交互 ====================
const OCCUPATION_SPECIFIC_ACTIONS = {
    '导师': {
        id: 'teaching', name: '📚 授课', desc: '学习功法', minAffection: 20,
        action: function(npc, player) {
            const skills = npc.combat?.skills || [];
            if (skills.length === 0) return { success: false, msg: '没有可传授的功法' };
            const skill = randomChoice(skills);
            if (!player.learnedSkills) player.learnedSkills = [];
            if (!player.learnedSkills.includes(skill)) {
                player.learnedSkills.push(skill);
                return { success: true, msg: `学会了【${skill}】！` };
            }
            return { success: true, msg: `【${skill}】早已掌握，又加深了理解。` };
        }
    },
    '商人': {
        id: 'trade', name: '💰 交易', desc: '买卖物品', minAffection: 0,
        action: function(npc, player) {
            // 关闭NPC对话，打开商店
            const modal = document.querySelector('.npc-dialog-modal');
            if (modal) modal.remove();
            if (typeof window.openWanderMerchant === 'function') {
                window.openWanderMerchant(1.0);
            } else if (typeof window.openShop === 'function') {
                window.openShop(npc.id);
            } else {
                return { success: false, msg: '商店系统未就绪' };
            }
            return { success: true, msg: '打开了商店', suppressMessage: true };
        }
    },
    '战士': {
        id: 'spar', name: '⚔️ 切磋', desc: '对练战斗', minAffection: 10,
        action: function(npc, player) {
            // 关闭NPC对话，进入战斗
            const modal = document.querySelector('.npc-dialog-modal');
            if (modal) modal.remove();
            const entity = { type: 'enemy', npcId: npc.id, name: npc.name, data: npc.combat || {} };
            if (typeof window.openBattleWithEntity === 'function') {
                window.openBattleWithEntity(entity);
            } else if (typeof window.startBattle === 'function') {
                window.startBattle(npc);
            }
            return { success: true, msg: '切磋开始', suppressMessage: true };
        }
    },
    '治疗师': {
        id: 'heal', name: '💊 诊治', desc: '治疗伤势', minAffection: 0,
        action: function(npc, player) {
            const healed = player.health < (player.maxHealth || 100) || player.qi < (player.maxQi || 50);
            player.health = player.maxHealth || 100;
            player.qi = player.maxQi || 50;
            return { success: true, msg: healed ? '伤势已痊愈，真气已恢复！' : '你状态很好，无需诊治。' };
        }
    },
    '铁匠': {
        id: 'forge', name: '🔨 锻造', desc: '打造/强化装备', minAffection: 10,
        action: function(npc, player) {
            const modal = document.querySelector('.npc-dialog-modal');
            if (modal) modal.remove();
            if (typeof window.openCraftingUI === 'function') {
                window.openCraftingUI('forging');
            } else {
                return { success: false, msg: '锻造系统未就绪' };
            }
            return { success: true, msg: '打开了锻造界面', suppressMessage: true };
        }
    },
    '炼丹师': {
        id: 'alchemy', name: '⚗️ 炼丹', desc: '炼制丹药', minAffection: 10,
        action: function(npc, player) {
            const modal = document.querySelector('.npc-dialog-modal');
            if (modal) modal.remove();
            if (typeof window.openCraftingUI === 'function') {
                window.openCraftingUI('pilfer');
            } else if (typeof window.openAlchemyRoom === 'function') {
                window.openAlchemyRoom();
            } else {
                return { success: false, msg: '炼丹系统未就绪' };
            }
            return { success: true, msg: '打开了炼丹界面', suppressMessage: true };
        }
    },
    '长老': {
        id: 'report', name: '👑 请示', desc: '门派事务', minAffection: 0,
        action: function(npc, player) {
            if (typeof window.openSectTasks === 'function') {
                window.openSectTasks();
            } else {
                return { success: false, msg: '门派系统未就绪' };
            }
            return { success: true, msg: '打开了门派事务', suppressMessage: true };
        }
    },
    '隐士': {
        id: 'dao_discuss', name: '🧘 论道', desc: '交流修行', minAffection: 20,
        action: function(npc, player) {
            const expGain = 10 + Math.floor(Math.random() * 20);
            if (player.exp !== undefined) player.exp += expGain;
            return { success: true, msg: `论道获益良多，获得${expGain}点修炼经验！` };
        }
    },
    '村民': {
        id: 'chat', name: '🌾 唠嗑', desc: '闲聊家常', minAffection: 0,
        action: function(npc, player) {
            const rumors = [
                '听说后山有妖怪出没，小心些。',
                '最近城里来了个奇怪的人。',
                '你知道吗，村口的老槐树有灵气！',
                '我听说附近有秘境要开启了。'
            ];
            return { success: true, msg: randomChoice(rumors) };
        }
    },
    '竞争对手': {
        id: 'duel', name: '⚔️ 对决', desc: '一决高下', minAffection: -30,
        action: function(npc, player) {
            const modal = document.querySelector('.npc-dialog-modal');
            if (modal) modal.remove();
            const entity = { type: 'enemy', npcId: npc.id, name: npc.name, data: npc.combat || {} };
            if (typeof window.openBattleWithEntity === 'function') {
                window.openBattleWithEntity(entity);
            }
            return { success: true, msg: '对决开始', suppressMessage: true };
        }
    }
};

// ==================== 深谈子选项响应 ====================
function getDeepTalkResponse(npc, categoryId, subOptionId, insufficientAff = false) {
    const name = npc.name;
    const aff = npc.relationship?.affection || 0;

    // 好感度严重不足时返回负面对话
if (insufficientAff) {
const negativeResponses = {
'topics': [`${name}冷淡地看了你一眼：「我们还没熟到可以聊这些。」`, `${name}皱眉：「不太方便说。」`, `${name}转身走开：「我还有事，先走了。」`, `${name}把话岔开：「今天天气不错。」——态度已经很明白了。`, `${name}打了个哈欠：「改天吧，今天没心思。」`, `${name}斜了你一眼：「你哪来的这么多问题？」`, `${name}抱臂：「这话留着跟你的好朋友说去。」`, `${name}淡淡道：「交情没到，话就别说满。」`],
'intel': [`${name}警惕地看着你：「这种信息不能随便告诉外人。」`, `${name}冷笑：「你凭什么觉得我会告诉你？」`, `${name}摇头：「无可奉告。」`, `${name}压低声音：「这消息值钱着呢，白给可不行。」`, `${name}摆手：「我也只是听说，不敢乱讲。」`, `${name}眯眼：「你怎么偏偏对这事感兴趣？」`, `${name}摇头：「打听太多，对你没好处。」`, `${name}冷笑：「消息贩子都没你勤快。」`],
'love': [`${name}后退一步：「你……你离我远点！」`, `${name}厌恶地皱眉：「请不要开这种玩笑。」`, `${name}冷冷道：「我们之间没有可能。」`, `${name}怒视：「再这样我就叫人了！」`, `${name}脸色一沉：「再说这种话，连朋友都没得做。」`, `${name}慌忙岔开话题：「你、你说什么呢！」`, `${name}叹气：「别拿我打趣了。」`, `${name}沉默半晌：「……我们，不合适。」`],
'requests': [`${name}冷哼：「你算什么东西，也配向我求助？」`, `${name}不耐烦地摆手：「我没空搭理你。」`, `${name}皱眉：「等你什么时候有点诚意了再说。」`, `${name}摊手：「我自己的一摊子事都没理清。」`, `${name}摇头：「帮你是情分，不帮是本分。」`, `${name}背过身去：「找别人吧。」`, `${name}冷冷道：「上次的事你还记得就好。」`, `${name}不耐烦：「还有完没完？」`],
'quests': [`${name}狐疑地看着你：「我凭什么相信你？」`, `${name}摇头：「你不行，找别人吧。」`, `${name}冷笑：「你连自己都顾不好，还想帮我？」`, `${name}皱眉：「这差事有风险，你扛不住。」`, `${name}摆手：「再练练吧，别送命。」`, `${name}怀疑地看着你：「你行吗？」`, `${name}淡淡道：「机会多的是，不急这一回。」`, `${name}合上册子：「委托不是求来的，是挣来的。」`],
'cultivation_guidance': [`${name}摇头：「你现在的修为还不够格。」`, `${name}淡淡道：「等你到了那个境界自然会懂。」`, `${name}嘲讽道：「好高骛远可不行。」`, `${name}摇头：「根基未稳，学了也是白学。」`, `${name}淡淡道：「功法不是越多人知道越好。」`, `${name}嘲讽：「一步登天？梦里快些。」`, `${name}摆手：「先把基础功课做完再来。」`, `${name}负手而立：「心不静，传什么都是浪费。」`],
'gifts': [`${name}看了一眼：「不需要。」`, `${name}皱眉：「你这是在羞辱我吗？」`, `${name}摆手：「拿回去吧，我不缺这个。」`, `${name}瞥了一眼：「……收下了。」（看不出喜怒）`, `${name}推回去：「心意领了，东西拿走。」`, `${name}皱眉：「下次送点用得上的。」`, `${name}淡淡道：「无功不受禄。」`, `${name}掂了掂：「就这？」`],
'farewell': [`${name}头也不回：「别再来了。」`, `${name}冷淡道：「不送。」`, `${name}哼了一声：「总算走了。」`, `${name}头也不抬：「嗯。」`, `${name}摆摆手，算是道别。`, `${name}淡淡道：「走吧。」`, `${name}没有回头，只挥了挥手。`, `${name}眼皮都没抬一下。`]
};
        for (const key in negativeResponses) {
            if (categoryId.startsWith(key)) {
                return negativeResponses[key];
            }
        }
        return [`${name}冷冷地看着你，一言不发。`];
    }

    // 好感度低时的普通回复（不够热情但不至于负面对话）
    const lowAffResponses = {
        'topics_recent': [`${name}简短道：「还行。」`, `${name}敷衍道：「就那样吧。」`],
        'topics_hobbies': [`${name}平淡道：「没什么特别的爱好。」`, `${name}随口道：「偶尔看看书。」`],
        'intel_market_prices': [`${name}犹豫了一下：「价格还行吧，自己去看。」`, `${name}简短道：「不知道，不关心。」`],
        'love_express_like': [`${name}尴尬地笑了笑：「你开玩笑的吧？」`, `${name}低头避开你的目光：「我们不合适。」`],
        'requests_teach_skill': [`${name}犹豫：「功法不能随便外传。」`, `${name}摇头：「你还没准备好学这个。」`],
        'farewell_farewell_normal': [`${name}点头：「嗯。」`, `${name}淡淡道：「走吧。」`]
    };

    const responses = {
        'topics_recent': [`${name}微笑道：「最近在专心修炼，倒也充实。」`, `${name}想了想：「和往常一样，修炼、讲道、休息。」`, `${name}叹了口气：「最近遇到些烦心事，不过还好。」`],
        'topics_hobbies': [`${name}眼睛一亮：「我最喜欢研究古籍里的功法。」`, `${name}笑道：「闲暇时喜欢在山中赏景。」`, `${name}想了想：「我对炼丹很感兴趣。」`],
        'topics_history': [`${name}沉思片刻：「我年轻时也曾游历四方，见过不少奇事。」`, `${name}缓缓道来：「说起我的出身，其实有些曲折……」`, `${name}笑了笑：「往事如烟，不提也罢。」`],
        'topics_future': [`${name}目光坚定：「我希望能突破金丹，追求更高境界。」`, `${name}憧憬道：「我想开宗立派，传承道统。」`, `${name}微笑：「只求能平安度日，与知己相伴。」`],
        'topics_worries': [`${name}低声道：「其实我最近修炼遇到了瓶颈。」`, `${name}犹豫了一下：「有些心事，不知当讲不当讲。」`, `${name}叹气：「修行之路，越走越孤独。」`],
        'topics_dreams': [`${name}眼中闪着光：「我最大的梦想是探索上古秘境。」`, `${name}认真道：「我想著书立说，流传后世。」`, `${name}微笑：「能和你这样聊天，也算圆了一个梦。」`],
        'topics_complaints': [`${name}不满道：「最近坊市物价涨得太离谱了。」`, `${name}抱怨：「门派里有些琐事真是烦人。」`, `${name}摇头：「现在的年轻人，唉，一代不如一代。」`],
        'intel_market_prices': [`${name}压低声音：「最近灵石兑换比例涨了，囤货的好时机。」`, `${name}想了想：「东街那家店的丹药性价比不错。」`, `${name}摇头：「药材价格一直在涨，建议多囤些。」`],
        'intel_secret_realms': [`${name}神秘道：「听说东荒发现了一个上古秘境。」`, `${name}低声道：「北冥深处可能有宝物出世。」`, `${name}谨慎道：「我听说有个秘境，但入口很危险。」`],
        'intel_gossip': [`${name}凑近些：「你听说了吗？某某和某某闹翻了。」`, `${name}笑道：「最近有个有趣的八卦……」`, `${name}摇头：「这些事情还是少说为妙。」`],
        'intel_sect_movements': [`${name}正色道：「武当派最近在招贤纳士。」`, `${name}思索道：「各门派都在暗中准备什么。」`, `${name}道：「听说天山派和炎城有些摩擦。」`],
        'intel_black_market': [`${name}压低声音：「黑市最近有批来历不明的法宝。」`, `${name}环顾四周：「地下交易所有些好东西，但风险也大。」`, `${name}警告道：「黑市水深，小心为上。」`],
        'love_express_like': [`${name}脸微红：「你这么说，我都不好意思了。」`, `${name}微笑着：「和你在一起，总是很愉快。」`, `${name}低头：「谢谢你的心意，我记在心里了。」`],
        'love_confess': [`${name}怔住了，半晌才道：「你……你是认真的吗？」`, `${name}眼中闪着泪光：「我等你这句话很久了。」`, `${name}沉默片刻：「对不起，我需要时间考虑。」`],
        'love_bond_dao': [`${name}郑重地点头：「好，从今往后，你我便是道侣。」`, `${name}握住你的手：「我愿意。」`, `${name}微笑道：「天地为证，日月为鉴。」`],
        'requests_teach_skill': [`${name}点头：「既然你诚心求教，我就指点你一二。」`, `${name}严肃道：「功法传授讲究缘分，你我有缘。」`, `${name}微笑道：「这套功法我也是多年摸索，今天传给你。」`],
        'requests_request_heal': [`${name}关切道：「我来看看你的伤势。」`, `${name}点头：「放松，我为你运功疗伤。」`],
        'requests_request_guidance': [`${name}沉思片刻：「你的修炼方向没错，但需要更多耐心。」`, `${name}指点道：「我建议你多关注心境修炼。」`, `${name}微笑道：「你天资不错，只是方法可以改进。」`],
        'cultivation_guidance_breakthrough_guide': [`${name}正色道：「突破的关键在于心境，而非蛮力。」`, `${name}思索道：「每个人的突破之路都不同，但核心是积累。」`, `${name}微笑道：「我当年突破时，靠的是顿悟。」`],
        'cultivation_guidance_inner_arts': [`${name}缓缓道：「心法修炼讲究循环渐进。」`, `${name}闭目道：「感受天地灵气在体内的流转。」`, `${name}指点道：「内功心法贵在坚持。」`],
        'farewell_farewell_normal': [`${name}点头：「路上小心，后会有期。」`, `${name}微笑道：「慢走。」`, `${name}摆手：「改日再聊。」`],
        'farewell_farewell_promise': [`${name}笑道：「说好了，下次再来找我。」`, `${name}点头：「一言为定，我等你。」`],
        'farewell_farewell_reluctant': [`${name}依依不舍：「这么快就要走了吗……」`, `${name}轻声道：「我会想你的。」`],
        'farewell_farewell_hurry': [`${name}理解地点头：「既然有事，先去吧。」`, `${name}关切道：「注意安全，事情办完了可以来找我。」`]
    };

    // 好感度低时优先使用低好感版回复
    const key = `${categoryId}_${subOptionId}`;
    if (aff < 20 && lowAffResponses[key]) {
        return lowAffResponses[key];
    }
    const finalRes = responses[key] || [`${name}微微点头，似乎理解了你的意思。`];
    // P2-1: 情报选项实际效果注入
    try {
        if (categoryId === 'intel' && !insufficientAff) {
            injectIntelEffect(subOptionId, npc);
        }
    } catch (e) {}
    return finalRes;
}

// P2-1: 情报效果注入
function injectIntelEffect(subOptionId, npc) {
    if (!window.currentCharData) return;
    var cd = window.currentCharData;
    if (subOptionId === 'market_prices') {
        // 当前城市物价折扣5%，持续24游戏小时
        var city = window.locationSystem && window.locationSystem.getCurrentLocation ? window.locationSystem.getCurrentLocation() : '';
        if (city) {
            if (!window._cityPriceBuffs) window._cityPriceBuffs = {};
            window._cityPriceBuffs[city] = { multiplier: 0.95, expiresGameMinute: ((window.timeSystem?.gameTime?.totalMinutes) || 0) + 24 * 60 };
            if (window.showMessage) window.showMessage('💰 获得了「物价情报」：' + city + '物价临时下降5%（24小时）', 'success');
        }
    } else if (subOptionId === 'secret_realms') {
        // 标记附近秘境，48小时内地图显示
        var nowMin = (window.timeSystem?.gameTime?.totalMinutes) || 0;
        if (!window._unlockedRealms) window._unlockedRealms = {};
        var realm = npc.location || '未知';
        window._unlockedRealms[realm] = { expiresGameMinute: nowMin + 48 * 60, hint: '听NPC说附近有秘境可探索' };
        if (window.showMessage) window.showMessage('🗺️ 获得了「秘境线索」：' + realm + '附近可能有秘境（48小时）', 'success');
    } else if (subOptionId === 'black_market') {
        // 解锁黑市入口
        if (!window._blackMarketAccess) window._blackMarketAccess = false;
        window._blackMarketAccess = true;
        if (window.showMessage) window.showMessage('🔓 解锁了黑市访问权！', 'success');
    } else if (subOptionId === 'sect_movements') {
        // 记录门派情报
        if (!window._knownSectIntel) window._knownSectIntel = {};
        var sectName = npc.sect || '未知';
        window._knownSectIntel[sectName] = (window._knownSectIntel[sectName] || 0) + 1;
        if (window.showMessage) window.showMessage('📜 获得了门派情报：' + sectName, 'info');
    } else if (subOptionId === 'gossip') {
        // 八卦+1票
        if (typeof cd._gossipCount !== 'number') cd._gossipCount = 0;
        cd._gossipCount++;
    }
    // 好感+2 (给情报)
    if (typeof npc.changeAffection === 'function') npc.changeAffection(2);
}

// ==================== NPC类定义 ====================
class NPC {
    constructor(id, name, options = {}) {
        this.id = id;
        this.name = name;
        this.gender = options.gender || 'female';
        this.age = options.age || 20;
        this.appearance = options.appearance || {};
        this.personality = options.personality || {};
        this.occupation = options.occupation || '';
        this.location = options.location || 'unknown';
        this.isFollowing = false;   // 是否跟随玩家（队友NPC专用）
        this.followTarget = null;   // 跟随目标ID（通常是玩家）
        this.relationship = {
            affection: 0, hatred: 0, favor: 0, favorMax: 50, respect: 0,
             love: 0, fear: 0, trust: 0, flags: new Set(), history: []
        };
        this.statusEffects = new Map();
        this.dialogueTree = options.dialogueTree || this.generateDefaultDialogue();
        this.ai = { schedule: options.schedule || [], preferences: options.preferences || {}, fears: options.fears || [], likes: options.likes || [], dislikes: options.dislikes || [] };
        this.background = options.background || { origin: '', family: '', history: '', goal: '', secret: '' };
        this.personalityBig5 = options.personalityBig5 || { openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50, neuroticism: 50 };
        this.combat = options.combat || { level: 20, realm: '炼气', layer: 1, attack: 30, defense: 30, speed: 30, skills: [] };
        this.profession = options.profession || { type: 'wanderer', level: 30, specialization: '' };
        this.preferences = options.preferences || { likedItems: [], dislikedItems: [], giftMultiplier: 1.0 };
        this.schedule = options.schedule || { default: [] };
        this.state = { mood: 50, energy: 100, health: 100, stress: 0, isBroken: false, breakType: null, location: options.location || 'unknown', currentActivity: '' };
        this.memory = {
            playerActions: [], impressions: {}, questsGiven: [], firstMet: false, meetCount: 0,
            lastMeetTime: 0, lastMeetGameMinute: null, lastAction: null, lastActionTime: 0, lastActionGameMinute: null, totalGifts: 0, totalHelps: 0, totalAttacks: 0, totalRefusals: 0,
            // F-18：送礼疲倦（现实式厌烦——非次数上限，而是随游戏日衰减的自身状态）
            giftFatigue: 0, lastGiftDay: 0
        };
        this.quirks = options.quirks || [];
        this.motivations = options.motivations || [{ type: 'wealth', weight: 0.3 }, { type: 'power', weight: 0.3 }, { type: 'knowledge', weight: 0.4 }];
        
        // ==================== P2：故事线进度追踪 ====================
        // 存储每个NPC的故事线进度：{ story_01: { stage: 3, completed: true, ... } }
        this.storylineProgress = options.storylineProgress || {};
        
        // ==================== P3：秘密系统 2.0 ====================
        // 秘密数据结构（增强版）：
        // { secret_id: {
        //   id, title, content, desc, unlocked,
        //   type: 'personal'|'sect'|'world',
        //   unlockConditions: [ // 条件链（AND）
        //     { type: 'affection', min: 40 },
        //     { type: 'event_completed', eventId: 'xl_event_s001' },
        //     { type: 'deep_talk_choice', branchId: 'trust_path' }
        //   ],
        //   effects: {
        //     unlockDialogueOptions: ['call_true_name'],
        //     unlockEvent: 'xl_event_true_name',
        //     affectionGain: 10,
        //     revealSecret: false
        //   },
        //   exposureRisk: {
        //     tellOthers: { affectionPenalty: -20, npcReaction: 'anger' },
        //     useAgainst: { affectionPenalty: -30, npcReaction: 'betrayal' }
        //   }
        // }}
        this.secrets = options.secrets || {};
        // 记录已解锁秘密触发的效果（防止重复触发）
        this._appliedSecretEffects = options._appliedSecretEffects || {};

        // ==================== P1-3：NPC关系网 ====================
        // 记录与其他NPC的关系：{ npcId: { relation: '好友'|'师徒'|'同门'|'仇敌'|'恋人'|'亲属', strength: 0-100 } }
        // 用于帮助/伤害NPC时影响其亲友的态度
        this.npcRelationships = options.npcRelationships || {};

        // ==================== v11.8 物品与NPC联动 ====================
        // NPC背包
        this.inventory = options.inventory || {
            items: [],  // [{ templateId, count, durability }]
            maxSlots: 10
        };
        // NPC装备（简化版，只装备核心几件）
        this.npcEquipment = options.npcEquipment || {
            mainHand: null,  // 武器
            body: null,       // 防具
            accessory: null   // 饰品
        };
        // NPC需求物品
        this._wantedItems = options._wantedItems || [];

        // P2-10: NPC生命周期系统字段
        this._protectionLevel = options._protectionLevel;  // normal/important/core
        this._criticalDays = 0;
        this._isCritical = false;
        this._isGone = false;
        this._leaveReason = null;
        this._leaveTime = null;
        this._deathReason = null;
        this._deathTime = null;
        this._birthTime = null;
        this._lastAgeUpdate = 0;
        this._lastActiveBehavior = 0;
        this._lastQuestTime = 0;
        this._lastNeedCheck = 0;
        this._consumptionSchedule = null;  // 懒构建
        this._personalQuests = [];  // 个人任务
        this._consumptionSchedule = null;  // 懒构建
    }
    
    // 解锁指定秘密（返回是否成功解锁，附带效果对象）
    unlockSecret(secretId) {
        var secret = this.secrets[secretId];
        if (!secret) return { success: false, reason: 'not_found' };
        if (secret.unlocked) return { success: false, reason: 'already_unlocked' };
        secret.unlocked = true;
        // 应用解锁效果
        var result = this.applySecretEffect(secretId);
        return { success: true, effects: result };
    }
    
    // 检查秘密是否满足解锁条件（支持条件链 AND）
    checkSecretCondition(secretId) {
        var secret = this.secrets[secretId];
        if (!secret || secret.unlocked) return false;
        var conditions = secret.unlockConditions;
        if (!conditions || !Array.isArray(conditions) || conditions.length === 0) {
            // 没有条件时默认可解锁
            return true;
        }
        // 所有条件必须满足（AND逻辑）
        for (var i = 0; i < conditions.length; i++) {
            var cond = conditions[i];
            if (!this._checkSingleCondition(cond)) {
                return false;
            }
        }
        return true;
    }
    
    // 检查单个条件
    _checkSingleCondition(cond) {
        if (!cond) return false;
        switch (cond.type) {
            case 'affection':
                return this.relationship.affection >= (cond.min || 0);
            case '_removed_trust':
                return this.relationship.trust >= (cond.min || 0);
            case 'respect':
                return this.relationship.respect >= (cond.min || 0);
            case 'event_completed':
                // 检查个人事件是否已完成
                if (typeof window.hasEventTriggered === 'function') {
                    return window.hasEventTriggered(cond.eventId);
                }
                return false;
            case 'deep_talk_choice':
                // 检查深谈中选择记录
                return this.memory.impressions && this.memory.impressions['deep_talk_' + cond.branchId] > 0;
            case 'favor':
                return this.relationship.favor >= (cond.min || 0);
            case 'player_realm':
                var player = window.currentCharData || {};
                var realm = player.realm || '';
                return realm === cond.realm || (cond.realmList && cond.realmList.indexOf(realm) >= 0);
            default:
                return false;
        }
    }
    
    // 获取秘密的解锁条件描述（用于UI显示）
    getSecretConditionDescription(secretId) {
        var secret = this.secrets[secretId];
        if (!secret || secret.unlocked) return '已解锁';
        var conditions = secret.unlockConditions;
        if (!conditions || conditions.length === 0) return '可解锁';
        var descs = [];
        for (var i = 0; i < conditions.length; i++) {
            var cond = conditions[i];
            switch (cond.type) {
                case 'affection': descs.push('好感≥' + cond.min); break;
                case '_removed_trust': descs.push('信任≥' + cond.min); break;
                case 'respect': descs.push('敬重≥' + cond.min); break;
                case 'event_completed': descs.push('完成事件「' + (cond.eventName || cond.eventId) + '」'); break;
                case 'deep_talk_choice': descs.push('在深谈中选择特定选项'); break;
                case 'favor': descs.push('情分≥' + cond.min); break;
                case 'player_realm': descs.push('境界达到' + (cond.realm || cond.realmList?.join('或') || '')); break;
                default: descs.push('未知条件'); break;
            }
        }
        return descs.join('，');
    }
    
    // 应用秘密解锁效果
    applySecretEffect(secretId) {
        var secret = this.secrets[secretId];
        if (!secret || !secret.unlocked) return null;
        // 防止重复触发
        if (this._appliedSecretEffects[secretId]) return null;
        this._appliedSecretEffects[secretId] = true;
        
        var effects = secret.effects || {};
        var result = { affectionGain: 0, unlockedDialogue: [], unlockedEvent: null, messages: [] };
        
        // 好感度奖励
        if (effects.affectionGain) {
            this.changeAffection(effects.affectionGain);
            result.affectionGain = effects.affectionGain;
            result.messages.push('好感度+' + effects.affectionGain);
        }
        
        // 解锁新对话选项
        if (effects.unlockDialogueOptions && Array.isArray(effects.unlockDialogueOptions)) {
            if (!this.memory._unlockedSecretDialogues) {
                this.memory._unlockedSecretDialogues = [];
            }
            effects.unlockDialogueOptions.forEach(function(opt) {
                if (this.memory._unlockedSecretDialogues.indexOf(opt) < 0) {
                    this.memory._unlockedSecretDialogues.push(opt);
                    result.unlockedDialogue.push(opt);
                }
            }.bind(this));
            result.messages.push('解锁新对话选项');
        }
        
        // 解锁新个人事件
        if (effects.unlockEvent) {
            result.unlockedEvent = effects.unlockEvent;
            result.messages.push('解锁新个人事件');
        }
        
        return result;
    }
    
    // 检查玩家是否有某个秘密解锁的对话选项
    hasUnlockedDialogueOption(optionId) {
        return this.memory._unlockedSecretDialogues &&
               this.memory._unlockedSecretDialogues.indexOf(optionId) >= 0;
    }
    
    generateDefaultDialogue() {
        return { greeting: ['你好，{playerName}。', '很高兴见到你。', '有什么事吗？'], affectionLow: ['我不太想和你说话。', '请离开。', '我很忙。'], affectionMid: ['最近怎么样？', '有什么新鲜事吗？', '你想聊聊吗？'], affectionHigh: ['看到你真好！', '我一直在等你。', '和你在一起很开心。'], special: {} };
    }
    
    getDialogue(category = 'greeting') {
        const tree = this.dialogueTree;
        const aff = this.relationship.affection;
        if (tree[category]) return tree[category][Math.floor(Math.random() * tree[category].length)].replace('{playerName}', playerName || '朋友');
        if (aff < -50) return randomChoice(tree.affectionLow || ['走开']);
        if (aff < 0) return randomChoice(tree.greeting);
        if (aff < 50) return randomChoice(tree.affectionMid);
        return randomChoice(tree.affectionHigh);
    }
    
    getAvailableTopics() {
        const tree = this.dialogueTree;
        if (!tree.topics) return ['greeting'];
        const aff = this.relationship?.affection || 0;
        return Object.keys(tree.topics).filter(topic => {
            if (tree.topicRequirements?.[topic]) return aff >= (tree.topicRequirements[topic].minAffection ?? -100);
            return true;
        });
    }

    // === 记忆系统 ===
    recordPlayerAction(action, result = 'neutral') {
        this.memory.playerActions.push({ action, result, gameMinute: npcNowGameMinute(), timestamp: Date.now() });
        if (this.memory.playerActions.length > 50) this.memory.playerActions = this.memory.playerActions.slice(-50);
        this.memory.lastAction = action;
        this.memory.lastActionTime = Date.now();
        this.memory.lastActionGameMinute = npcNowGameMinute();
        if (action === 'gift') this.memory.totalGifts++;
        else if (action === 'help') this.memory.totalHelps++;
        else if (action === 'attack') { this.memory.totalAttacks++; this.addStress(20); this.changeFear(10); } // v20.37 威压账：挨过打的人怕你
        else if (action === 'refuse_quest') this.memory.totalRefusals++;
        else if (action === 'talk' || action === 'greet') {
            this.memory.meetCount++;
            if (!this.memory.firstMet) {
                this.memory.firstMet = true;
                this.memory.firstMetDay = window.timeSystem && window.timeSystem.getAbsoluteDay ? window.timeSystem.getAbsoluteDay() : 0;
            }
        }
        this.memory.impressions[action] = (this.memory.impressions[action] || 0) + 1;
        this.updateRelationshipFromAction(action, result);
    }

    updateRelationshipFromAction(action, result) {
        let baseChange = 0;
        switch (action) {
            // F-18：gift 的好感由 confirmGiftToNPC 直接应用（含疲倦/特质），此处不再 +3（删双重计数）
            case 'gift': baseChange = 0; break;
            case 'help': baseChange = 5; break;
            case 'talk': baseChange = 1; break;
            case 'deep_talk': baseChange = 2; break;
            case 'greet': baseChange = 0; break;
            case 'attack': baseChange = -15; break;
            case 'refuse_quest': baseChange = -3; break;
            case 'refuse_request': baseChange = -5; break;
        }
        const count = this.memory.impressions[action] || 0;
        if (count > 3) baseChange = Math.floor(baseChange * 0.7);
        if (count > 10) baseChange = Math.floor(baseChange * 0.5);
        if (result === 'positive') baseChange = Math.abs(baseChange);
        else if (result === 'negative') baseChange = -Math.abs(baseChange);
        if (baseChange > 0) this.changeAffection(baseChange);
        else if (baseChange < 0) {
            this.relationship.affection = clamp(this.relationship.affection + baseChange, -100, 100);
            if (action === 'attack') this.changeHatred(Math.abs(baseChange));
        }
    }

    getHoursSinceLastMeet() {
        const last = npcLastMeetGameMinute(this);
        if (last == null) return -1;
        return Math.max(0, Math.floor((npcNowGameMinute() - last) / 60));
    }

    getMemoryImpression() {
        if (!this.memory.firstMet) return 'first';
        const hours = this.getHoursSinceLastMeet();
        if (hours < 0) return 'first';
        if (hours < 1) return 'just_now';
        if (hours < 6) return 'recent';
        if (hours < 24) return 'today';
        if (hours < 72) return 'few_days';
        if (hours < 168) return 'week';
        return 'long_ago';
    }

    // ==================== v11.8 物品与NPC联动：NPC背包/装备/使用 ====================
    // 添加物品到NPC背包
    addItemToInventory(templateId, count) {
        count = count || 1;
        if (!this.inventory) this.inventory = { items: [], maxSlots: 10 };
        var existing = null;
        for (var i = 0; i < this.inventory.items.length; i++) {
            if (this.inventory.items[i].templateId === templateId) {
                existing = this.inventory.items[i]; break;
            }
        }
        if (existing) {
            existing.count = (existing.count || 1) + count;
        } else {
            if (this.inventory.items.length >= this.inventory.maxSlots) return false;
            this.inventory.items.push({ templateId: templateId, count: count });
        }
        return true;
    }

    // 从NPC背包移除物品
    removeItemFromInventory(templateId, count) {
        count = count || 1;
        if (!this.inventory || !this.inventory.items) return false;
        var idx = -1;
        for (var i = 0; i < this.inventory.items.length; i++) {
            if (this.inventory.items[i].templateId === templateId) {
                idx = i; break;
            }
        }
        if (idx < 0) return false;
        var item = this.inventory.items[idx];
        item.count -= count;
        if (item.count <= 0) {
            this.inventory.items.splice(idx, 1);
        }
        return true;
    }

    // 装备物品到NPC装备栏
    equipItemToSlot(templateId) {
        if (!this.npcEquipment) this.npcEquipment = { mainHand: null, body: null, accessory: null };
        var tpl = window.itemById && window.itemById[templateId];
        if (!tpl) return false;
        var slot = null;
        if (tpl.type === 'weapon' || tpl.slot === 'mainHand') slot = 'mainHand';
        else if (tpl.type === 'armor' || tpl.slot === 'body') slot = 'body';
        else slot = 'accessory';
        this.npcEquipment[slot] = { templateId: templateId, name: tpl.name || templateId };
        // 更新NPC战斗属性
        if (tpl.combatBonus) {
            this.combat.attack = (this.combat.attack || 0) + (tpl.combatBonus.attack || 0);
            this.combat.defense = (this.combat.defense || 0) + (tpl.combatBonus.defense || 0);
        }
        return true;
    }

    // NPC使用消耗品（自动嗑药）
    useConsumable() {
        if (!this.inventory || !this.inventory.items) return false;
        for (var i = 0; i < this.inventory.items.length; i++) {
            var item = this.inventory.items[i];
            var tpl = window.itemById && window.itemById[item.templateId];
            if (!tpl) continue;
            if (tpl.type === 'consumable' && tpl.effect) {
                var eff = tpl.effect;
                if (eff.hp_recovery && this.state.health < 100) {
                    this.state.health = Math.min(100, this.state.health + eff.hp_recovery);
                    this.removeItemFromInventory(item.templateId, 1);
                    return true;
                }
                if (eff.qi_recovery && this.state.energy < 100) {
                    this.state.energy = Math.min(100, this.state.energy + eff.qi_recovery);
                    this.removeItemFromInventory(item.templateId, 1);
                    return true;
                }
                if (eff.mood_boost && this.state.mood < 50) {
                    this.state.mood = Math.min(100, this.state.mood + eff.mood_boost);
                    this.removeItemFromInventory(item.templateId, 1);
                    return true;
                }
            }
        }
        return false;
    }

    // 获取NPC需求物品列表
    getWantedItems() {
        var wants = [];
        if (this.state.health < 60) {
            wants.push({ templateId: 'vitality_pill', reason: '需要疗伤丹药', itemName: '疗伤丹药' });
        }
        if (this.state.mood < 40) {
            wants.push({ templateId: 'food_roast_meat', reason: '心情不佳，需要美食', itemName: '美食' });
        }
        if (this.combat && this.combat.exp > 80) {
            wants.push({ templateId: 'foundation_pill', reason: '修炼瓶颈，需要辅助丹药', itemName: '辅助丹药' });
        }
        if (this._wantedItems && this._wantedItems.length > 0) {
            for (var wi = 0; wi < this._wantedItems.length; wi++) {
                wants.push(this._wantedItems[wi]);
            }
        }
        return wants;
    }

    // === 四轨关系 ===
    changeAffection(amount) {
        const oldAffection = this.relationship.affection;
        this.relationship.affection = clamp(this.relationship.affection + amount, -100, 100);
        this.updateFavorMax(); // 0.2.4：favorMax 随好感扩（此前定义从不调用，favorMax 永远 50）
        this.updateRelationship();
    }
    
    changeFavor(amount) {
        // 道侣情分无限
        if (this.relationship.flags && this.relationship.flags.has('dao_companion')) {
            this.relationship.favor = this.relationship.favorMax;
            return this.relationship.favor;
        }
        this.relationship.favor = clamp(this.relationship.favor + amount, 0, this.relationship.favorMax);
        return this.relationship.favor;
    }
    changeLove(amount) { this.relationship.love = clamp(this.relationship.love + amount, 0, 100); }
    changeFear(amount) { this.relationship.fear = clamp(this.relationship.fear + amount, 0, 100); }
    changeHatred(amount) { this.relationship.hatred = clamp(this.relationship.hatred + amount, 0, 100); }
    // F-19：trust（信任）轨——此前分支对话 trust 选项调 changeTrust 但方法未定义致 TypeError
    changeTrust(amount) {
        this.relationship.trust = clamp(this.relationship.trust + amount, 0, 100);
        this.updateRelationship();
    }
    
    updateRelationship() {
        const rel = this.relationship;
        
        
        this.relationship.history.push({ gameMinute: npcNowGameMinute(), timestamp: Date.now(), affection: rel.affection, love: rel.love });
    }
    
    updateFavorMax() { this.relationship.favorMax = Math.floor((this.relationship.affection + 100) / 200 * 50 + 50); }
    changeRespect(amount) { this.relationship.respect = clamp(this.relationship.respect + amount, 0, 100); this.updateRelationship(); return this.relationship.respect; }
    canAffordRequest(requestCost) { return this.relationship.favor >= requestCost; }
    executeRequest(requestCost, effectFn) {
        if (!this.canAffordRequest(requestCost)) {
            // v20.37 威压轨：情分不够时，威压可代付（二比一）——应你不是因为情分，是因为怕。
            // 威压是消耗品（代付减半），且这笔勉强的情要记怨。威压是资源，不是白送的通行证。
            const _fear = Number(this.relationship.fear) || 0;
            if (_fear < requestCost * 2) return { success: false, msg: '情分不足' };
            this.changeFear(-Math.ceil(requestCost / 2));
            this.changeHatred(2);
            if (effectFn && typeof effectFn === 'function') return effectFn(this);
            return { success: true, msg: '请求成功' };
        }
        this.changeFavor(-requestCost);
        if (effectFn && typeof effectFn === 'function') return effectFn(this);
        return { success: true, msg: '请求成功' };
    }
    
    getRelationshipStatus() {
        const rel = this.relationship;
        if (rel.affection >= 60 && rel.hatred < 30) return { type: 'friend', name: '至交', color: 'text-green-400' };
        if (rel.hatred >= 60 && rel.respect < 30) return { type: 'enemy', name: '死敌', color: 'text-red-600' };
        if (rel.hatred >= 60 && rel.respect >= 60) return { type: 'fear_enemy', name: '敢怒不敢言', color: 'text-orange-400' };
        if (rel.affection >= 60 && rel.respect >= 60) return { type: 'follower', name: '追随者', color: 'text-purple-400' };
        // v20.37 威压轨露出：怕你到这份上，关系形态就叫畏惧（情深者不受此判——前面几档先接住）
        if (rel.fear >= 60) return { type: 'intimidated', name: '畏惧', color: 'text-red-300' };
        if (rel.affection < 20 && rel.respect < 30) return { type: 'stranger', name: '路人', color: 'text-gray-400' };
        if (rel.respect >= 60) return { type: 'awe', name: '敬畏', color: 'text-yellow-400' };
        return { type: 'neutral', name: '普通', color: 'text-blue-400' };
    }
    
    setFlag(flag) { this.relationship.flags.add(flag); }
    hasFlag(flag) { return this.relationship.flags.has(flag); }
    removeFlag(flag) { this.relationship.flags.delete(flag); }
    
    addStatusEffect(name, duration, effects) {
        const safeDuration = Math.max(1, Math.floor(Number(duration) || 1));
        const effect = {
            name: name,
            duration: safeDuration,
            maxDuration: safeDuration,
            effects: effects ? JSON.parse(JSON.stringify(effects)) : {}
        };
        effect.tick = () => {
            effect.duration -= 1;
            if (effect.duration <= 0) {
                this.statusEffects.delete(name);
                return false;
            }
            return true;
        };
        this.statusEffects.set(name, effect);
    }
    removeStatusEffect(name) { this.statusEffects.delete(name); }
    getStatusEffects() { return Array.from(this.statusEffects.values()); }
    tickStatusEffects() {
        for (const [name, effect] of this.statusEffects) {
            if (!effect.tick()) gameLog.add(`${this.name} 的状态效果 "${name}" 结束了`, 'info');
        }
    }
    getStatBonuses() {
        let bonuses = {};
        for (const [, effect] of this.statusEffects) {
            if (effect.effects && effect.effects.stats) bonuses = deepMerge(bonuses, effect.effects.stats);
        }
        return bonuses;
    }
    
    interact(type = 'talk') {
        this.relationship.history.push({ timestamp: Date.now(), type, result: this.getInteractionResult(type) });
        return this.getInteractionResult(type);
    }
    
    getInteractionResult(type) {
        switch (type) {
            case 'talk': return { success: true, dialogue: this.getDialogue(), affectionChange: 0 };
            case 'gift': return this.relationship.affection > 0 ? { success: true, affectionChange: 5, dialogue: '谢谢你！' } : { success: false, affectionChange: -2, dialogue: '我不需要你的东西。' };
            case 'help': return this.relationship.affection > 50 ? { success: true, dialogue: '感谢你的帮助！' } : { success: false, dialogue: '我现在不需要帮助。' };
            default: return { success: false };
        }
    }
    
    // === 压力系统 ===
    addStress(amount) {
        this.state.stress = clamp(this.state.stress + amount, 0, 100);
        if (this.state.stress >= 80 && !this.state.isBroken) this.triggerMentalBreak();
        return this.state.stress;
    }
    reduceStress(amount) {
        this.state.stress = clamp(this.state.stress - amount, 0, 100);
        if (this.state.stress < 40 && this.state.isBroken) this.recoverFromBreak();
        return this.state.stress;
    }
    triggerMentalBreak() {
        this.state.isBroken = true;
        const neuroticism = this.personalityBig5?.neuroticism || 50;
        if (neuroticism > 60) { this.state.breakType = 'paranoid'; this.state.mood = Math.max(0, this.state.mood - 30); this.relationship.hatred = Math.min(100, this.relationship.hatred + 20); }
        else { this.state.breakType = 'rage'; this.state.currentActivity = '愤怒暴走'; }
    }
    recoverFromBreak() { this.state.isBroken = false; this.state.breakType = null; this.state.mood = Math.min(100, this.state.mood + 20); }
    dailyStressRecovery() { this.reduceStress(5); if (this.state.mood > 70) this.reduceStress(3); }
    
    // === 特质系统 ===
    getGiftMultiplier() {
        let m = 1.0;
        for (const q of this.quirks || []) { if (q.id === 'greedy') m *= 0.7; else if (q.id === 'generous') m *= 1.3; else if (q.id === 'stoic') m *= 0.8; }
        return m;
    }
    getRequestSuccessBonus() {
        let b = 0;
        for (const q of this.quirks || []) { if (q.id === 'people_pleaser') b += 30; else if (q.id === 'stubborn') b -= 20; else if (q.id === 'jealous') b -= 10; }
        return b;
    }
    getDialogueModifier() {
        for (const q of this.quirks || []) { if (q.id === 'poison_tongue') return '（毒舌）'; if (q.id === 'optimist') return '（乐观）'; if (q.id === 'pessimist') return '（悲观）'; }
        return '';
    }

    // === 深谈系统 ===
    getAvailableDeepTalkCategories() {
        const aff = this.relationship.affection;
        const cats = [];
        for (const key in DEEP_TALK_CATEGORIES) {
            const cat = DEEP_TALK_CATEGORIES[key];
            if (cat.subOptions.some(sub => aff >= sub.minAffection)) cats.push(cat);
        }
        return cats;
    }

    getAvailableSubOptions(categoryId) {
        const aff = this.relationship.affection;
        for (const key in DEEP_TALK_CATEGORIES) {
            const cat = DEEP_TALK_CATEGORIES[key];
            if (cat.id === categoryId) return cat.subOptions.filter(sub => aff >= sub.minAffection);
        }
        return [];
    }
    
    // ==================== P2：故事线进度管理 ====================
    // 检查是否可以触发某个故事线阶段
    canTriggerStorylineStage(npcId, storyId, stageIndex) {
        if (!window.NPC_STORYLINES[storyId]) return false;
        
        const storyline = window.NPC_STORYLINES[storyId];
        const stage = storyline.story[stageIndex];
        if (!stage) return false;
        
        const progress = this.storylineProgress[storyId] || {};
        const currentStage = progress.stage || 0;
        
        // 检查前置条件：必须完成前一阶段
        if (stageIndex > 0 && !progress.completedStages) {
            progress.completedStages = [];
        }
        if (stageIndex > 0 && !progress.completedStages.includes(stageIndex - 1)) {
            return false;
        }
        
        // 检查触发条件
        const aff = this.relationship.affection || 0;
        const favor = this.relationship.favor || 0;
        
        if (stage.trigger.minAffection && aff < stage.trigger.minAffection) return false;
        if (stage.trigger.minFavor && favor < stage.trigger.minFavor) return false;
        if (stage.trigger.minDays) {
            const firstMetDay = this.memory.firstMetDay || 0;
            const currentDay = window.timeSystem && window.timeSystem.getAbsoluteDay ? window.timeSystem.getAbsoluteDay() : 0;
            const daysPassed = Math.max(0, currentDay - firstMetDay);
            if (daysPassed < stage.trigger.minDays) return false;
        }
        if (stage.trigger.stage2Complete && !progress.stage2Completed) return false;
        
        return true;
    }
    
    // 推进故事线阶段
    advanceStorylineStage(npcId, storyId, stageIndex, choiceResult) {
        if (!this.storylineProgress[storyId]) {
            this.storylineProgress[storyId] = { stage: 0, completedStages: [] };
        }
        
        const progress = this.storylineProgress[storyId];
        const storyline = window.NPC_STORYLINES[storyId];
        const stage = storyline.story[stageIndex];
        
        // 记录阶段完成
        if (!progress.completedStages.includes(stageIndex)) {
            progress.completedStages.push(stageIndex);
        }
        
        // 更新当前阶段
        progress.stage = stageIndex;
        
        // 如果选择nextStage为true，标记下一阶段可解锁
        if (choiceResult && choiceResult.nextStage) {
            progress.stageReady = stageIndex + 1;
        }
        
        // 保存进度到localStorage（持久化）
        this.saveStorylineProgress();
    }
    
    // 保存故事线进度到GameState统一存档（不再使用独立localStorage）
    // 进度信息已通过 serialize() 纳入 GameState
    saveStorylineProgress() {
        // 进度已保存在 this.storylineProgress 中，serialize() 会序列化它
        // 不再写入独立 localStorage
        return true;
    }
    
    // 从GameState统一存档加载故事线进度（不再使用独立localStorage）
    // 进度信息已通过 NPC.deserialize() 从 GameState 恢复
    loadStorylineProgress() {
        // 已通过 NPC.deserialize() 恢复 storylineProgress
        // 不再读取独立 localStorage
        if (!this.storylineProgress) this.storylineProgress = {};
        return true;
    }

    getOccupationAction() { return OCCUPATION_SPECIFIC_ACTIONS[this.occupation] || null; }
    
    serialize() {
        if (typeof migrateLegacyRelationships === 'function') migrateLegacyRelationships(this);
        const storylineProgress = this.storylineProgress ? {...this.storylineProgress} : {};
        const secrets = this.secrets ? JSON.parse(JSON.stringify(this.secrets)) : {};
        return {
            id: this.id,
            name: this.name,
            gender: this.gender,
            age: this.age,
            location: this.location,
            isFollowing: this.isFollowing || false,
            followTarget: this.followTarget || null,
            // 关系
            relationship: { ...this.relationship, flags: Array.from(this.relationship.flags), history: this.relationship.history.slice(-50) },
            // NPC之间的关系网：npcRelationships 为唯一新式真源，relationships.bonds 仅保留兼容镜像
            npcRelationships: this.npcRelationships ? JSON.parse(JSON.stringify(this.npcRelationships)) : {},
            statusEffects: Array.from(this.statusEffects.entries()).map(([k, v]) => [k, {
                name: v.name || k,
                duration: Math.max(0, Number(v.duration) || 0),
                maxDuration: Math.max(0, Number(v.maxDuration) || Number(v.duration) || 0),
                effects: v.effects ? JSON.parse(JSON.stringify(v.effects)) : {}
            }]),
            storylineProgress: storylineProgress,
            secrets: secrets,
            // v13.9 物品与NPC联动：行囊/装备纳入存档（此前读档即丢，为审计5 P0-4根因之一）
            inventory: this.inventory ? { items: JSON.parse(JSON.stringify(this.inventory.items || [])), maxSlots: this.inventory.maxSlots || 10 } : null,
            npcEquipment: this.npcEquipment ? JSON.parse(JSON.stringify(this.npcEquipment)) : null,
            // v14.2 16Personalities 五维性格（连续倾向条）
            personality16: this.personality16 ? JSON.parse(JSON.stringify(this.personality16)) : null,
            _appliedSecretEffects: this._appliedSecretEffects ? {...this._appliedSecretEffects} : {},
            // ===== 新增：P0-1 保存所有动态状态 =====
            memory: this.memory ? {
                playerActions: this.memory.playerActions ? this.memory.playerActions.slice(-50) : [],
                impressions: this.memory.impressions ? {...this.memory.impressions} : {},
                firstMet: this.memory.firstMet || false,
                meetCount: this.memory.meetCount || 0,
                lastMeetTime: this.memory.lastMeetTime || 0,
                lastMeetGameMinute: this.memory.lastMeetGameMinute ?? null,
                lastAction: this.memory.lastAction || null,
                lastActionTime: this.memory.lastActionTime || 0,
                lastActionGameMinute: this.memory.lastActionGameMinute ?? null,
                totalGifts: this.memory.totalGifts || 0,
                totalHelps: this.memory.totalHelps || 0,
                totalAttacks: this.memory.totalAttacks || 0,
                totalRefusals: this.memory.totalRefusals || 0,
                firstMetDay: this.memory.firstMetDay || 0,
                _unlockedSecretDialogues: this.memory._unlockedSecretDialogues ? [...this.memory._unlockedSecretDialogues] : [],
                // F-5 修复：爱情线冷却与告白承诺标志之前未序列化，读档冷却清零 + 前置承诺丢失，可绕过冷却直接 bond_dao
                _loveCd: this.memory._loveCd ? {...this.memory._loveCd} : {},
                _loveAccepted_confess: this.memory._loveAccepted_confess || false,
                // F-18：送礼疲倦持久化
                giftFatigue: this.memory.giftFatigue || 0,
                lastGiftDay: this.memory.lastGiftDay || 0,
                // v20.25/v20.30：日常小事重入日头（小心眼等），不随档走则读档后永远不再触发
                _ambientLastDay: this.memory._ambientLastDay ? {...this.memory._ambientLastDay} : null,
                // 深谈分支进度/选择史/记忆事件同为白名单制，漏一则读档清零（嵌套结构走 JSON 深拷贝）
                _branchState: this.memory._branchState ? JSON.parse(JSON.stringify(this.memory._branchState)) : null,
                _choiceHistory: this.memory._choiceHistory ? JSON.parse(JSON.stringify(this.memory._choiceHistory)) : null,
                _events: this.memory._events ? JSON.parse(JSON.stringify(this.memory._events)) : null
            } : null,
            state: this.state ? {
                mood: this.state.mood ?? 50,
                energy: this.state.energy ?? 100,
                health: this.state.health ?? 100,
                stress: this.state.stress ?? 0,
                isBroken: this.state.isBroken || false,
                breakType: this.state.breakType || null,
                location: this.state.location || this.location || 'unknown',
                currentActivity: this.state.currentActivity || ''
            } : null,
            appearance: this.appearance ? {...this.appearance} : null,
            occupation: this.occupation || null,
            combat: this.combat ? {
                level: this.combat.level || 0,
                realm: this.combat.realm || '凡人',
                layer: this.combat.layer || 1,
                attack: this.combat.attack || 0,
                defense: this.combat.defense || 0,
                speed: this.combat.speed || 0,
                skills: this.combat.skills || []
            } : null,
            background: this.background ? {
                origin: this.background.origin || '',
                family: this.background.family || '',
                history: this.background.history || '',
                goal: this.background.goal || '',
                secret: this.background.secret || ''
            } : null,
            preferences: this.preferences ? {
                likedItems: this.preferences.likedItems || [],
                dislikedItems: this.preferences.dislikedItems || [],
                giftMultiplier: this.preferences.giftMultiplier || 1.0
            } : null,
            profession: this.profession ? {
                type: this.profession.type || 'wanderer',
                level: this.profession.level || 0,
                specialization: this.profession.specialization || ''
            } : null,
            personalityBig5: this.personalityBig5 ? {...this.personalityBig5} : null,
            quirks: this.quirks ? [...this.quirks] : null,
            motivations: this.motivations ? [...this.motivations] : null,
            _goal: this._goal ? JSON.parse(JSON.stringify(this._goal)) : null,
            // P0-4: 补充缺失的NPC生活数据
            schedule: this.schedule ? JSON.parse(JSON.stringify(this.schedule)) : null,
            dialogueTree: this.dialogueTree ? JSON.parse(JSON.stringify(this.dialogueTree)) : null,
            ai: this.ai ? JSON.parse(JSON.stringify(this.ai)) : null,
            inventory: this.inventory ? JSON.parse(JSON.stringify(this.inventory)) : null,
            npcEquipment: this.npcEquipment ? JSON.parse(JSON.stringify(this.npcEquipment)) : null,
            _wantedItems: this._wantedItems ? [...this._wantedItems] : null,
            introducedBy: this.introducedBy || null,
            firstImpression: this.firstImpression || null,
            // P2-10: 生命周期系统存档
            protectionLevel: this._protectionLevel || null,
            criticalDays: this._criticalDays || 0,
            isCritical: !!this._isCritical,
            personalQuests: this._personalQuests ? JSON.parse(JSON.stringify(this._personalQuests)) : [],
            isGone: !!this._isGone,
            leaveReason: this._leaveReason || null,
            leaveGameMinute: this._leaveGameMinute || 0,
            returnDueGameMinute: this._returnDueGameMinute || 0,
            criticalStartedGameMinute: this._criticalStartedGameMinute ?? null,
            lastAgeUpdateGameMinute: this._lastAgeUpdate ?? null,
            lastNeedCheckGameMinute: this._lastNeedCheck ?? null,
            lastNeedRequestGameMinute: this._lastNeedRequestGameMinute ?? null,
            lastActiveBehaviorGameMinute: this._lastActiveBehaviorGameMinute ?? null
        };
    }
    static deserialize(data) {
        const npc = new NPC(data.id, data.name, { gender: data.gender, age: data.age });
        npc.location = data.location;
        npc.relationship = { ...data.relationship, flags: new Set(data.relationship.flags || []), history: data.relationship.history || [] };
        // F-19：旧存档无 trust 字段，载入补默认 0（信任轨）
        if (npc.relationship.trust == null) npc.relationship.trust = 0;
        // 恢复NPC之间的关系网
        if (data.relationships && data.relationships.bonds) {
            if (!npc.relationships) npc.relationships = {};
            npc.relationships.bonds = JSON.parse(JSON.stringify(data.relationships.bonds));
        }
        migrateLegacyRelationships(npc); // v18.2 载入即迁移旧→新
        if (data.npcRelationships) {
            npc.npcRelationships = JSON.parse(JSON.stringify(data.npcRelationships));
        }
        // 恢复状态效果，不能只保存文案占位；tick 由 addStatusEffect 重建
        if (Array.isArray(data.statusEffects)) {
            npc.statusEffects.clear();
            data.statusEffects.forEach(function(entry) {
                if (!entry || entry.length < 2) return;
                var key = entry[0];
                var raw = entry[1] || {};
                var duration = Math.max(1, Number(raw.duration) || 1);
                npc.addStatusEffect(raw.name || key, duration, raw.effects || {});
                var restored = npc.statusEffects.get(raw.name || key);
                if (restored) restored.maxDuration = Math.max(duration, Number(raw.maxDuration) || duration);
            });
        }
        // 恢复故事线进度
        if (data.storylineProgress) {
            npc.storylineProgress = {...data.storylineProgress};
        } else {
            npc.storylineProgress = {};
        }
        // 恢复秘密状态
        if (data.secrets) {
            npc.secrets = JSON.parse(JSON.stringify(data.secrets));
        } else {
            npc.secrets = {};
        }
        // 恢复秘密效果触发记录
        if (data._appliedSecretEffects) {
            npc._appliedSecretEffects = {...data._appliedSecretEffects};
        } else {
            npc._appliedSecretEffects = {};
        }
        // v13.9 恢复行囊与装备（v11.8联动的存档补全）
        if (data.inventory && Array.isArray(data.inventory.items)) {
            npc.inventory = { items: JSON.parse(JSON.stringify(data.inventory.items)), maxSlots: data.inventory.maxSlots || 10 };
        } else {
            npc.inventory = { items: [], maxSlots: 10 };
        }
        if (data.npcEquipment) {
            npc.npcEquipment = JSON.parse(JSON.stringify(data.npcEquipment));
        }
        // v14.2 恢复16Personalities五维性格
        if (data.personality16) {
            npc.personality16 = JSON.parse(JSON.stringify(data.personality16));
        }
        // ===== 新增：P0-1 恢复所有动态状态 =====
        if (data.memory) {
            npc.memory = {
                playerActions: data.memory.playerActions || [],
                impressions: data.memory.impressions || {},
                firstMet: data.memory.firstMet || false,
                meetCount: data.memory.meetCount || 0,
                lastMeetTime: data.memory.lastMeetTime || 0,
                lastMeetGameMinute: data.memory.lastMeetGameMinute ?? null,
                lastAction: data.memory.lastAction || null,
                lastActionTime: data.memory.lastActionTime || 0,
                lastActionGameMinute: data.memory.lastActionGameMinute ?? null,
                totalGifts: data.memory.totalGifts || 0,
                totalHelps: data.memory.totalHelps || 0,
                totalAttacks: data.memory.totalAttacks || 0,
                totalRefusals: data.memory.totalRefusals || 0,
                firstMetDay: data.memory.firstMetDay || 0,
                _unlockedSecretDialogues: data.memory._unlockedSecretDialogues || [],
                // F-5 修复：恢复爱情线冷却与告白承诺标志，否则读档后可绕过冷却直接 bond_dao
                _loveCd: data.memory._loveCd || {},
                _loveAccepted_confess: data.memory._loveAccepted_confess || false,
                // F-18：送礼疲倦恢复
                giftFatigue: data.memory.giftFatigue || 0,
                lastGiftDay: data.memory.lastGiftDay || 0,
                // v20.25/v20.30：日常小事重入日头恢复
                _ambientLastDay: data.memory._ambientLastDay ? {...data.memory._ambientLastDay} : null,
                // 深谈分支进度/选择史/记忆事件恢复
                _branchState: data.memory._branchState ? JSON.parse(JSON.stringify(data.memory._branchState)) : null,
                _choiceHistory: data.memory._choiceHistory ? JSON.parse(JSON.stringify(data.memory._choiceHistory)) : null,
                _events: data.memory._events ? JSON.parse(JSON.stringify(data.memory._events)) : null
            };
        }
        if (data.state) {
            npc.state = {
                mood: data.state.mood ?? 50,
                energy: data.state.energy ?? 100,
                health: data.state.health ?? 100,
                stress: data.state.stress ?? 0,
                isBroken: data.state.isBroken || false,
                breakType: data.state.breakType || null,
                location: data.state.location || data.location || 'unknown',
                currentActivity: data.state.currentActivity || ''
            };
        }
        if (data.appearance) npc.appearance = {...data.appearance};
        if (data.occupation) npc.occupation = data.occupation;
        if (data.combat) npc.combat = {
            level: data.combat.level || 0,
            realm: data.combat.realm || '凡人',
            layer: data.combat.layer || 1,
            attack: data.combat.attack || 0,
            defense: data.combat.defense || 0,
            speed: data.combat.speed || 0,
            skills: data.combat.skills || []
        };
        if (data.background) npc.background = {
            origin: data.background.origin || '',
            family: data.background.family || '',
            history: data.background.history || '',
            goal: data.background.goal || '',
            secret: data.background.secret || ''
        };
        if (data.preferences) npc.preferences = {
            likedItems: data.preferences.likedItems || [],
            dislikedItems: data.preferences.dislikedItems || [],
            giftMultiplier: data.preferences.giftMultiplier || 1.0
        };
        if (data.profession) npc.profession = {
            type: data.profession.type || 'wanderer',
            level: data.profession.level || 0,
            specialization: data.profession.specialization || ''
        };
        if (data.personalityBig5) npc.personalityBig5 = {...data.personalityBig5};
        if (data.quirks) npc.quirks = [...data.quirks];
        if (data.motivations) npc.motivations = [...data.motivations];
        // v14.11 补全：_goal 此前只存不读（审计5 P0-4 尾巴）
        if (data._goal) npc._goal = JSON.parse(JSON.stringify(data._goal));
        if (data.isFollowing != null) npc.isFollowing = data.isFollowing;
        if (data.followTarget != null) npc.followTarget = data.followTarget;
        // P0-4: 恢复缺失的NPC生活数据
        if (data.schedule) npc.schedule = JSON.parse(JSON.stringify(data.schedule));
        if (data.dialogueTree) npc.dialogueTree = JSON.parse(JSON.stringify(data.dialogueTree));
        if (data.ai) npc.ai = JSON.parse(JSON.stringify(data.ai));
        if (data.inventory) npc.inventory = JSON.parse(JSON.stringify(data.inventory));
        if (data.npcEquipment) npc.npcEquipment = JSON.parse(JSON.stringify(data.npcEquipment));
        if (data._wantedItems) npc._wantedItems = [...data._wantedItems];
        if (data.introducedBy != null) npc.introducedBy = data.introducedBy;
        if (data.firstImpression != null) npc.firstImpression = data.firstImpression;
        // P2-10: 恢复生命周期系统字段
        if (data.protectionLevel != null) npc._protectionLevel = data.protectionLevel;
        if (data.criticalDays != null) npc._criticalDays = data.criticalDays;
        if (data.isCritical != null) npc._isCritical = !!data.isCritical;
        if (data.personalQuests && Array.isArray(data.personalQuests)) {
            npc._personalQuests = JSON.parse(JSON.stringify(data.personalQuests));
        }
        npc._isGone = !!data.isGone;
        npc._leaveReason = data.leaveReason || null;
        npc._leaveGameMinute = Number(data.leaveGameMinute) || 0;
        npc._returnDueGameMinute = Number(data.returnDueGameMinute) || 0;
        npc._criticalStartedGameMinute = data.criticalStartedGameMinute == null ? null : Number(data.criticalStartedGameMinute);
        npc._lastAgeUpdate = data.lastAgeUpdateGameMinute == null ? null : Number(data.lastAgeUpdateGameMinute);
        npc._lastNeedCheck = data.lastNeedCheckGameMinute == null ? null : Number(data.lastNeedCheckGameMinute);
        npc._lastNeedRequestGameMinute = data.lastNeedRequestGameMinute == null ? null : Number(data.lastNeedRequestGameMinute);
        npc._lastActiveBehaviorGameMinute = data.lastActiveBehaviorGameMinute == null ? null : Number(data.lastActiveBehaviorGameMinute);
        return npc;
    }
}

// ==================== NPC管理器 ====================
class NPCManager {
    constructor() { this.npcs = new Map(); this.activeNPCs = []; this.dialogueQueue = []; }
    addNPC(npc) { if (npc instanceof NPC) { this.npcs.set(npc.id, npc); this.activeNPCs.push(npc); gameLog.add(`NPC "${npc.name}" 加入了游戏`, 'info'); return true; } return false; }
    removeNPC(npcId) {
        const npc = this.npcs.get(npcId);
        if (npc) { this.npcs.delete(npcId); this.activeNPCs = this.activeNPCs.filter(n => n.id !== npcId); gameLog.add(`NPC "${npc.name}" 离开了游戏`, 'info'); return true; }
        return false;
    }
    getNPC(npcId) { return this.npcs.get(npcId); }
    getAllNPCs() { return Array.from(this.npcs.values()); }
    getNPCsAtLocation(location) { return this.activeNPCs.filter(npc => npc.location === location); }
    talkToNPC(npcId, topic = null) {
        const npc = this.npcs.get(npcId);
        if (!npc) { showMessage('找不到这个NPC', 'error'); return null; }
        const result = npc.interact('talk');
        if (result.affectionChange) npc.changeAffection(result.affectionChange);
        return result;
    }
    giftToNPC(npcId, item) {
        const npc = this.npcs.get(npcId);
        if (!npc) return false;
        const result = npc.interact('gift');
        if (result.affectionChange) npc.changeAffection(result.affectionChange);
        return result.success;
    }
    helpNPC(npcId) {
        const npc = this.npcs.get(npcId);
        if (!npc) return false;
        const result = npc.interact('help');
        
        return result.success;
    }
    updateAll(hours = 1) {
        // 获取游戏时间（小时）
        let gameHour = 6;
        if (window.timeSystem && window.timeSystem.gameTime) {
            gameHour = window.timeSystem.gameTime.currentHour;
        }
        
        for (const npc of this.activeNPCs) {
            npc.tickStatusEffects();
            this.updateNPCAI(npc, gameHour, hours);
        }
    }
    
    // 增强版NPC日程更新：使用游戏时间+NPC个性化日程表
    updateNPCAI(npc, gameHour, hoursDelta) {
        hoursDelta = hoursDelta || 1;
        // ===== 新增：如果NPC正在跟随玩家，跳过位置调度 =====
        if (npc.isFollowing) {
            npc.state.energy = Math.min(100, (npc.state.energy || 100) + 0.5 * hoursDelta);
            npc.state.mood = Math.min(100, (npc.state.mood || 50) + 0.5 * hoursDelta);
            npc.state.currentActivity = '跟随玩家';
            // 不修改 npc.location，保持与玩家一致
            return;
        }
        // 获取NPC的日程数据
        const schedule = npc.schedule?.default || [];
        if (schedule.length > 0) {
            // 查找当前时间对应的日程项
            const currentSchedule = this.findCurrentSchedule(schedule, gameHour);
            if (currentSchedule) {
                npc.state.location = currentSchedule.location || npc.location;
                npc.state.currentActivity = currentSchedule.activity || '空闲';
                npc.location = currentSchedule.location || npc.location;
                
                // 状态自然恢复
                if (currentSchedule.activity === '休息' || currentSchedule.activity === '睡眠') {
                    npc.state.energy = Math.min(100, (npc.state.energy || 100) + 5 * hoursDelta);
                    npc.state.mood = Math.min(100, (npc.state.mood || 50) + 2 * hoursDelta);
                } else if (currentSchedule.activity === '用餐' || currentSchedule.activity === '进食') {
                    npc.state.energy = Math.min(100, (npc.state.energy || 100) + 10 * hoursDelta);
                    npc.state.mood = Math.min(100, (npc.state.mood || 50) + 3 * hoursDelta);
                }
            } else {
                npc.state.currentActivity = this.getDefaultActivity(gameHour);
            }
        } else {
            npc.state.currentActivity = this.getDefaultActivity(gameHour);
        }
        
        // ===== v11.8 NPC自主生活：自动修炼 =====
        var isCultivating = npc.state.currentActivity === '修炼' || npc.state.currentActivity === '打坐';
        var expGain = hoursDelta * (isCultivating ? 1.0 : 0.2);
        npc.combat.exp = (npc.combat.exp || 0) + expGain;
        
        // ===== v11.8 NPC自主生活：自动突破检测 =====
        this.checkAutoBreakthrough(npc);
        
        // ===== v11.8 NPC自主生活：心情/压力自然波动 =====
        npc.state.mood = clamp(npc.state.mood + (Math.random() - 0.5) * 2 * hoursDelta, 0, 100);
        npc.state.energy = clamp(npc.state.energy - 0.3 * hoursDelta, 0, 100);
        if (npc.state.currentActivity === '休息' || npc.state.currentActivity === '睡眠') {
            npc.state.energy = clamp(npc.state.energy + 5 * hoursDelta, 0, 100);
        }
        
        // 每日压力自然恢复（每6小时恢复1点）
        npc.reduceStress(0.2 * hoursDelta);
        
        // ===== v11.8 NPC自主生活：关系自然衰减（长时间不见面） =====
        var lastMeetGameMinute = npcLastMeetGameMinute(npc);
        if (lastMeetGameMinute != null) {
            var daysSince = (npcNowGameMinute() - lastMeetGameMinute) / 1440;
            if (daysSince > 3) {
                npc.relationship.affection = Math.max(-100, npc.relationship.affection - 0.1 * hoursDelta);
            }
        }
        
        // ===== v11.8 NPC自主生活：主动行为检查（每6小时） =====
        if (gameHour % 6 === 0) {
            this.checkActiveBehavior(npc);
        }
        
        // 情绪触发主动行为
        if (gameHour % 6 === 0 && typeof window.executeEmotionAction === 'function') {
            try { window.executeEmotionAction(npc); } catch (e) {}
        }
    }
    
    // ===== v11.8 NPC自主生活：自动突破 =====
    checkAutoBreakthrough(npc) {
        var exp = npc.combat.exp || 0;
        var layer = npc.combat.layer || 1;
        var realm = npc.combat.realm || '炼气';
        // 经验阈值：每层需要 100 + layer * 20
        var threshold = 100 + layer * 20;
        if (exp < threshold) return;
        
        // 基础突破概率 30%
        var baseChance = 0.30;
        // 根据情绪调整
        if (npc.state.mood > 70) baseChance += 0.1;
        if (npc.state.mood < 30) baseChance -= 0.1;
        // 压力影响
        if (npc.state.stress > 60) baseChance -= 0.1;
        baseChance = clamp(baseChance, 0.05, 0.8);
        
        if (Math.random() < baseChance) {
            // 突破成功
            var newLayer = layer + 1;
            var maxLayer = 9;
            if (newLayer > maxLayer) {
                // 境界突破（简化版：不跨境界自动突破）
                npc.combat.exp = exp - threshold;
                if (window.showMessage) {
                    window.showMessage('⬆️ ' + npc.name + ' 修炼有所精进（' + realm + '·' + layer + '层）', 'info');
                }
                return;
            }
            npc.combat.layer = newLayer;
            npc.combat.exp = Math.max(0, exp - threshold);
            // 属性提升
            npc.combat.attack = (npc.combat.attack || 0) + 2;
            npc.combat.defense = (npc.combat.defense || 0) + 2;
            npc.state.mood = Math.min(100, (npc.state.mood || 50) + 10);
            
            if (window.showMessage) {
                window.showMessage('⬆️ ' + npc.name + ' 突破至 ' + realm + (newLayer) + '层！', 'success');
            }
            // 记录
            npc.recordPlayerAction('auto_breakthrough', 'positive');
        } else {
            // 突破失败，消耗部分经验
            npc.combat.exp = Math.max(0, exp - threshold * 0.3);
            npc.state.mood = Math.max(0, (npc.state.mood || 50) - 5);
            npc.addStress(10);
        }
    }
    
    // ===== v11.8 NPC自主生活：主动行为 =====
    checkActiveBehavior(npc) {
        // P2-10e: 先调用生命周期系统（垂危检查/寿命/主动行为真实化）
        if (window.NPCLifeSystem) {
            try {
                if (npc._protectionLevel === undefined) {
                    npc._protectionLevel = window.NPCLifeSystem.getAutoProtectionLevel(npc);
                }
                window.NPCLifeSystem.checkCriticalCondition(npc);
                // 已被垂危机制处理的NPC不再产生主动行为
                if (npc._isCritical || npc._isGone) return;
                // 调用P2-10d主动行为真实化
                window.NPCLifeSystem.executeActiveBehavior(npc);
            } catch (e) { console.warn('[NPCLifeSystem] checkActiveBehavior error', e); }
        }
        var aff = npc.relationship?.affection || 0;
        var mood = npc.state?.mood || 50;

        // 好感度>60 且 心情不错 → 可能主动找玩家
        if (aff > 60 && mood > 50 && Math.random() < 0.1) {
            var behaviors = ['send_message', 'give_gift', 'invite'];
            var chosen = behaviors[Math.floor(Math.random() * behaviors.length)];
            switch (chosen) {
                case 'send_message':
                    if (window.showMessage) {
                        window.showMessage('📩 ' + npc.name + '给你传音：「最近可好？有空来坐坐。」', 'info');
                    }
                    npc.recordPlayerAction('active_contact', 'positive');
                    npc.changeAffection(1);
                    break;
                case 'give_gift':
                    if (window.showMessage) {
                        window.showMessage('🎁 ' + npc.name + '托人送来了一份小礼物。', 'success');
                    }
                    npc.recordPlayerAction('active_gift', 'positive');
                    break;
                case 'invite':
                    if (window.showMessage) {
                        window.showMessage('📩 ' + npc.name + '邀请你一同探索秘境。', 'info');
                    }
                    npc.recordPlayerAction('active_invite', 'positive');
                    break;
            }
            return;
        }
        
        // 好感度<-30 且 心情差 → 可能找麻烦
        if (aff < -30 && mood < 30 && Math.random() < 0.08) {
            if (window.showMessage) {
                window.showMessage('💢 你听说' + npc.name + '在背后说了你的坏话。', 'warning');
            }
            npc.recordPlayerAction('active_hostile', 'negative');
            npc.changeHatred(5);
            return;
        }
        
        // NPC需要帮助（随机请求）
        if (aff > 20 && Math.random() < 0.05) {
            var requests = [
                { msg: '需要一些灵草炼丹', item: 'mat_lingzhi', reward: '好感+5' },
                { msg: '想找人切磋武艺', action: 'spar', reward: '好感+3' },
                { msg: '需要帮忙采集材料', action: 'gather', reward: '好感+4' }
            ];
            var req = requests[Math.floor(Math.random() * requests.length)];
            if (window.showMessage) {
                window.showMessage('🙏 ' + npc.name + '：' + req.msg + '（' + req.reward + '）', 'info');
            }
            // 标记NPC有请求
            if (!npc._pendingRequests) npc._pendingRequests = [];
            npc._pendingRequests.push({ type: 'auto', msg: req.msg, expiredDay: this._getCurrentDay() + 3 });
        }
    }
    
    _getCurrentDay() {
        try {
            if (window.timeSystem && window.timeSystem.gameTime) return window.timeSystem.gameTime.currentDay;
        } catch (e) {}
        return 0;
    }
    
    // 解析日程时间范围并查找匹配项
    findCurrentSchedule(schedule, gameHour) {
        for (const entry of schedule) {
            if (!entry.time) continue;
            
            // 解析时间格式如 '04:00-06:00' 或 '06:00-12:00'
            const timeRange = entry.time.split('-');
            if (timeRange.length === 2) {
                const startHour = parseInt(timeRange[0].split(':')[0]);
                const endHour = parseInt(timeRange[1].split(':')[0]);
                
                // 处理跨天情况（如 22:00-02:00）
                if (startHour <= endHour) {
                    if (gameHour >= startHour && gameHour < endHour) {
                        return entry;
                    }
                } else {
                    // 跨天：22:00-02:00
                    if (gameHour >= startHour || gameHour < endHour) {
                        return entry;
                    }
                }
            }
        }
        return null;
    }
    
    // 默认活动（无日程时使用）
    getDefaultActivity(hour) {
        if (hour >= 5 && hour < 8) return '晨练';
        if (hour >= 8 && hour < 12) return '工作';
        if (hour >= 12 && hour < 14) return '用餐休息';
        if (hour >= 14 && hour < 18) return '修炼';
        if (hour >= 18 && hour < 21) return '社交';
        if (hour >= 21 && hour < 24) return '休闲';
        return '休息';
    }
    
    // 获取NPC当前所在位置的详细描述
    getNPCLocationDescription(npc) {
        const activity = npc.state?.currentActivity || '空闲';
        const location = npc.state?.location || npc.location || '未知';
        return `在${location}${activity}`;
    }
    
    // 获取NPC附近可交互的NPC列表
    getNearbyNPCs(location) {
        if (!location) return [];
        return this.activeNPCs.filter(npc =>
            npc.state?.location === location || npc.location === location
        );
    }
    serialize() { return Array.from(this.npcs.values()).map(npc => npc.serialize()); }
    deserialize(data) {
        this.npcs.clear(); this.activeNPCs = [];
        for (const npcData of data) { const npc = NPC.deserialize(npcData); this.npcs.set(npc.id, npc); this.activeNPCs.push(npc); }
    }
}

// ==================== 对话系统 ====================
class DialogueSystem {
    constructor() {
        this.dialogues = new Map();
        this.choices = [];
        this.currentDialogue = null;
        this.branchDialogues = {};
    }
    startDialogue(npcId, dialogueId) {
        const npc = npcManager.getNPC(npcId);
        if (!npc) return false;
        const dialogue = this.getDialogue(dialogueId);
        if (!dialogue) return false;
        this.currentDialogue = { npcId, dialogueId, nodes: dialogue.nodes, currentNode: dialogue.startNode || 'start', flags: new Set(dialogue.flags || []) };
        return true;
    }
    getDialogueNode(dialogueId, nodeId) {
        const dialogue = this.getDialogue(dialogueId);
        if (!dialogue || !dialogue.nodes[nodeId]) return null;
        return dialogue.nodes[nodeId];
    }
    makeChoice(choiceIndex) {
        if (!this.currentDialogue) return false;
        const node = this.currentDialogue.nodes[this.currentDialogue.currentNode];
        if (!node || !node.choices || !node.choices[choiceIndex]) return false;
        const choice = node.choices[choiceIndex];
        if (choice.action) choice.action();
        this.currentDialogue.currentNode = choice.nextNode;
        if (choice.nextNode === 'end') this.endDialogue();
        return true;
    }
    endDialogue() { this.currentDialogue = null; }
    getDialogue(id) { return this.dialogues.get(id); }
    addDialogue(id, dialogue) { this.dialogues.set(id, dialogue); }
    registerBranchDialogue(id, dialogueTree) {
        this.branchDialogues = this.branchDialogues || {};
        this.branchDialogues[id] = dialogueTree;
    }
    startBranchDialogue(npcId, treeId) {
        const npc = window.npcManager?.getNPC(npcId);
        if (!npc) return false;
        const tree = this.branchDialogues?.[treeId];
        if (!tree) return false;
        this.currentDialogue = { type: 'branch', npcId, treeId, nodes: tree.nodes, currentNode: tree.startNode || 'intro', flags: new Set(), history: [] };
        return true;
    }
    getCurrentBranchText() {
        if (!this.currentDialogue || this.currentDialogue.type !== 'branch') return '';
        const node = this.currentDialogue.nodes[this.currentDialogue.currentNode];
        if (!node) return '';
        let text = node.text || '';
        text = text.replace('{playerName}', window.currentCharData?.name || window.playerName || '道友');
        return text;
    }
    getCurrentBranchChoices() {
        if (!this.currentDialogue || this.currentDialogue.type !== 'branch') return [];
        const node = this.currentDialogue.nodes[this.currentDialogue.currentNode];
        if (!node || !node.choices) return [];
        return node.choices.filter(c => !c.condition || c.condition());
    }
}

// ==================== 好感度系统 ====================
class AffectionSystem {
    constructor() {
        this.levels = [
            { min: -100, max: -50, name: '死敌', color: '#ff0000' },
            { min: -49, max: -20, name: '厌恶', color: '#ff4444' },
            { min: -19, max: 0, name: '陌生', color: '#888888' },
            { min: 1, max: 20, name: '友好', color: '#4488ff' },
            { min: 21, max: 40, name: '亲密', color: '#44aaff' },
            { min: 41, max: 60, name: '喜欢', color: '#ff88cc' },
            { min: 61, max: 80, name: '爱慕', color: '#ff4488' },
            { min: 81, max: 100, name: '挚爱', color: '#ff0044' }
        ];
    }
    getLevel(affection) { for (const l of this.levels) { if (affection >= l.min && affection <= l.max) return l; } return this.levels[2]; }
    getColor(affection) { return this.getLevel(affection).color; }
    getName(affection) { return this.getLevel(affection).name; }
}

// ==================== v10.0 NPC关系网络深化 ====================
// 7种关系类型：亲属/师徒/同门/朋友/道侣/仇敌/债务恩情
var RELATION_TYPES = {
    family: { name: '亲属', icon: '👨‍👩‍👧', color: 'text-pink-400' },
    master: { name: '师徒', icon: '📖', color: 'text-yellow-400' },
    sect_mate: { name: '同门', icon: '🏛️', color: 'text-blue-400' },
    friend: { name: '朋友', icon: '🤝', color: 'text-green-400' },
    dao_companion: { name: '道侣', icon: '💕', color: 'text-red-400' },
    enemy: { name: '仇敌', icon: '⚔️', color: 'text-red-600' },
    rival: { name: '宿敌', icon: '💢', color: 'text-red-500' },
    debtor: { name: '债务/恩情', icon: '💰', color: 'text-yellow-600' }
};

function generateNPCRelations(npcs) {
    if (!npcs || npcs.length < 2) return;
    // 按门派/背景分组
    var sectMap = {};
    npcs.forEach(function(npc) {
        var s = npc.background?.origin || npc.location || 'unknown';
        if (!sectMap[s]) sectMap[s] = [];
        sectMap[s].push(npc);
    });
    
    // 同门自动成为朋友
    Object.values(sectMap).forEach(function(group) {
        if (group.length < 2) return;
        group.forEach(function(npc, i) {
            if (!npc.relationships) npc.relationships = {};
            if (!npc.relationships.bonds) npc.relationships.bonds = {};
            var b = npc.relationships.bonds;
            // 同门朋友
            for (var j = 1; j < Math.min(3, group.length); j++) {
                var friend = group[(i + j) % group.length];
                if (friend.id === npc.id) continue;
                if (!b.friends) b.friends = [];
                if (b.friends.indexOf(friend.id) < 0) b.friends.push(friend.id);
                // 自动建立同门关系
                if (!b.sect_mates) b.sect_mates = [];
                if (b.sect_mates.indexOf(friend.id) < 0) b.sect_mates.push(friend.id);
            }
        });
    });
    
    // 师徒关系（按门派分组内生成，禁止跨门派）
    Object.values(sectMap).forEach(function(group) {
        if (group.length < 2) return;
        var sorted = group.slice().sort(function(a, b) {
            return (b.combat?.level || 0) - (a.combat?.level || 0);
        });
        // 每组取前1-2名作为师父候选
        var masterCount = Math.min(1 + Math.floor(sorted.length / 3), sorted.length - 1);
        for (var i = 0; i < masterCount; i++) {
            var master = sorted[i];
            if (!master.relationships) master.relationships = {};
            if (!master.relationships.bonds) master.relationships.bonds = {};
            for (var k = i + 1; k < sorted.length; k++) {
                var student = sorted[k];
                var diff = (master.combat?.level || 0) - (student.combat?.level || 0);
                if (diff > 15 && Math.random() < 0.4) {
                    if (!master.relationships.bonds.students) master.relationships.bonds.students = [];
                    if (master.relationships.bonds.students.indexOf(student.id) < 0) {
                        master.relationships.bonds.students.push(student.id);
                    }
                    if (!student.relationships) student.relationships = {};
                    if (!student.relationships.bonds) student.relationships.bonds = {};
                    if (!student.relationships.bonds.masters) student.relationships.bonds.masters = [];
                    if (student.relationships.bonds.masters.indexOf(master.id) < 0) {
                        student.relationships.bonds.masters.push(master.id);
                    }
                }
            }
        }
    });
}

function getNPCRelationship(npcId1, npcId2) {
    var npc1 = window.npcManager?.getNPC(npcId1);
    if (!npc1 || !npc1.npcRelationships) return null;
    var rel = npc1.npcRelationships[npcId2];
    if (!rel) return null;
    var t = (typeof rel === 'string') ? rel : (rel.relation || null);
    return t ? normalizeNPCRelationType(t) : null;
}

// v12.1：统一 NPC↔NPC 关系图。新式 npcRelationships 为真源，旧 bonds 只做兼容镜像。
function normalizeNPCRelationType(type) {
    var map = {
        '好友': 'friend', '朋友': 'friend', friend: 'friend', sworn_siblings: 'friend',
        '同门': 'sect_mate', sect_mate: 'sect_mate',
        '仇敌': 'enemy', enemy: 'enemy',
        '师父': 'master', master: 'master',
        '徒弟': 'student', student: 'student',
        '道侣': 'dao_companion', '恋人': 'dao_companion', dao_companion: 'dao_companion',
        '亲属': 'relative', relative: 'relative',
        '普通': 'neutral', neutral: 'neutral'
    };
    return map[type] || String(type || 'neutral');
}

function inverseNPCRelationType(type) {
    type = normalizeNPCRelationType(type);
    if (type === 'master') return 'student';
    if (type === 'student') return 'master';
    return type;
}

function syncOneRelationshipToLegacy(npc, otherId, relationType) {
    if (!npc) return;
    if (!npc.relationships) npc.relationships = {};
    if (!npc.relationships.bonds) npc.relationships.bonds = {};
    var b = npc.relationships.bonds;
    ['friends','enemies','sect_mates','students','masters'].forEach(function(k) {
        if (!Array.isArray(b[k])) b[k] = [];
        b[k] = b[k].filter(function(id) { return id !== otherId; });
    });
    var rel = normalizeNPCRelationType(relationType);
    var bucket = rel === 'enemy' ? 'enemies'
        : rel === 'sect_mate' ? 'sect_mates'
        : rel === 'master' ? 'students'
        : rel === 'student' ? 'masters'
        : (rel === 'friend' || rel === 'dao_companion' || rel === 'relative') ? 'friends' : null;
    if (bucket && b[bucket].indexOf(otherId) < 0) b[bucket].push(otherId);
}

function setNPCRelationshipPair(npcA, npcB, relationType, strength) {
    if (!npcA || !npcB || npcA.id === npcB.id) return false;
    var relA = normalizeNPCRelationType(relationType);
    var relB = inverseNPCRelationType(relA);
    var safeStrength = Math.max(0, Math.min(100, Math.round(Number(strength) || 0)));
    if (!npcA.npcRelationships) npcA.npcRelationships = {};
    if (!npcB.npcRelationships) npcB.npcRelationships = {};
    npcA.npcRelationships[npcB.id] = { relation: relA, strength: safeStrength };
    npcB.npcRelationships[npcA.id] = { relation: relB, strength: safeStrength };
    return true;
}

function migrateLegacyRelationships(npc) {
    if (!npc) return;
    if (!npc.npcRelationships) npc.npcRelationships = {};
    var b = npc.relationships && npc.relationships.bonds;
    if (!b) return;
    var mapping = [
        ['friends','friend'], ['enemies','enemy'], ['sect_mates','sect_mate'],
        ['students','master'], ['masters','student'], ['rivals','rival']
    ];
    mapping.forEach(function(pair) {
        (b[pair[0]] || []).forEach(function(id) {
            if (!npc.npcRelationships[id]) npc.npcRelationships[id] = { relation: pair[1], strength: 50 };
        });
    });
}

function adjustNPCRelationshipPair(npcA, npcB, delta, options) {
    options = options || {};
    if (!npcA || !npcB) return null;
    migrateLegacyRelationships(npcA); migrateLegacyRelationships(npcB);
    var current = npcA.npcRelationships[npcB.id] || { relation: options.defaultRelation || 'neutral', strength: 0 };
    var rel = normalizeNPCRelationType(current.relation);
    var nextStrength;
    if (rel === 'enemy' && delta > 0) {
        // 调解的正向 delta 表示降低敌意；敌意降至阈值后转为普通关系。
        nextStrength = Math.max(0, (Number(current.strength) || 50) - delta);
        if (nextStrength <= 20) { rel = 'neutral'; nextStrength = Math.max(0, 20 - nextStrength); }
    } else {
        nextStrength = Math.max(0, Math.min(100, (Number(current.strength) || 0) + delta));
        if (rel === 'neutral' && nextStrength >= 40) rel = 'friend';
    }
    setNPCRelationshipPair(npcA, npcB, rel, nextStrength);
    return { relation: rel, strength: nextStrength };
}

// P2-9 已退役（v18.2）：bonds 镜像停止写入；本函数仅保留「旧档→新源」一次性迁移语义
function syncNPCRelationships(npc) {
    if (!npc) return;
    migrateLegacyRelationships(npc);
}

function getNPCRelationshipNetwork(npcId) {
    var npc = window.npcManager?.getNPC(npcId);
    if (npc) syncNPCRelationships(npc);
    var map = (npc && npc.npcRelationships) || {};
    var result = [];
    function addRel(id, type) {
        var other = window.npcManager?.getNPC(id);
        if (other) result.push({ npcId: id, npcName: other.name, type: type, icon: RELATION_TYPES[type]?.icon || '❓' });
    }
    Object.keys(map).forEach(function (id) {
        var rel = map[id];
        addRel(id, (typeof rel === 'string') ? rel : (rel.relation || 'neutral'));
    });
    return result;
}

// ==================== P1-3: NPC关系网传播系统 ====================
// 获取NPC重要关系列表（3-6名），用于对话面板显示
function getNPCImportantRelations(npcId, maxCount) {
    maxCount = maxCount || 6;
    var npc = window.npcManager?.getNPC(npcId);
    if (!npc) return [];
    
    var allRelations = [];
    // 先从 npc.npcRelationships 读取（新式）
    if (npc.npcRelationships) {
        for (var relId in npc.npcRelationships) {
            var relData = npc.npcRelationships[relId];
            var other = window.npcManager?.getNPC(relId);
            if (other) {
                allRelations.push({
                    npcId: relId,
                    npcName: other.name,
                    icon: other.appearance?.icon || '👤',
                    relation: relData.relation || 'friend',
                    strength: relData.strength || 50
                });
            }
        }
    }
    // 再从 npc.relationships.bonds 读取（旧式）
    var network = getNPCRelationshipNetwork(npcId);
    network.forEach(function(rel) {
        // 去重
        var exists = allRelations.some(function(r) { return r.npcId === rel.npcId; });
        if (!exists) {
            allRelations.push({
                npcId: rel.npcId,
                npcName: rel.npcName,
                icon: '👤',
                relation: rel.type,
                strength: 50
            });
        }
    });
    
    // 随机打乱后取前 maxCount 个
    for (var i = allRelations.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = allRelations[i]; allRelations[i] = allRelations[j]; allRelations[j] = tmp;
    }
    return allRelations.slice(0, maxCount);
}

// 获取重要关系HTML片段（用于对话面板）
function getRelationsNetworkHTML(npcId) {
    var relations = getNPCImportantRelations(npcId, 6);
    if (relations.length === 0) return '';
    
    var html = '<div class="mt-3 bg-gray-700/30 rounded-lg p-2 border border-gray-600">';
    html += '<h4 class="text-xs font-bold text-gray-400 mb-1">🔗 重要关系</h4>';
    html += '<div class="flex flex-wrap gap-1.5">';
    relations.forEach(function(rel) {
        var relName = '';
        var relColor = 'text-gray-400';
        switch (rel.relation) {
            case 'friend': relName = '朋友'; relColor = 'text-green-400'; break;
            case 'enemy': relName = '仇敌'; relColor = 'text-red-400'; break;
            case 'sect_mate': relName = '同门'; relColor = 'text-blue-400'; break;
            case 'master': relName = '师父'; relColor = 'text-yellow-400'; break;
            case 'student': relName = '弟子'; relColor = 'text-purple-400'; break;
            case 'family': relName = '亲属'; relColor = 'text-pink-400'; break;
            case 'dao_companion': relName = '道侣'; relColor = 'text-red-500'; break;
            default: relName = rel.relation; break;
        }
        html += '<span class="text-xs bg-gray-800 px-1.5 py-0.5 rounded border border-gray-600" title="' + relName + '">';
        html += rel.icon + ' ' + rel.npcName + ' <span class="' + relColor + '">[' + relName + ']</span>';
        html += '</span>';
    });
    html += '</div></div>';
    return html;
}

// 当玩家帮助NPC时，其亲友态度改善
function propagateHelpToRelations(npcId, helpStrength) {
    helpStrength = helpStrength || 3;
    var relations = getNPCImportantRelations(npcId, 10);
    var affected = [];
    relations.forEach(function(rel) {
        var other = window.npcManager?.getNPC(rel.npcId);
        if (other && other.relationship) {
            var change = Math.max(1, Math.floor(helpStrength / 2));
            other.changeAffection(change);
            other.recordPlayerAction('friend_helped', 'positive');
            affected.push(other.name);
        }
    });
    if (affected.length > 0 && window.showMessage) {
        window.showMessage('💬 ' + affected.join('、') + ' 因你帮助了TA的朋友而对你态度改善。', 'info');
    }
}

// 当玩家伤害NPC时，其亲友记仇
function propagateHarmToRelations(npcId, harmStrength) {
    harmStrength = harmStrength || 5;
    var relations = getNPCImportantRelations(npcId, 10);
    var affected = [];
    relations.forEach(function(rel) {
        var other = window.npcManager?.getNPC(rel.npcId);
        if (other && other.relationship) {
            var change = -Math.max(1, Math.floor(harmStrength / 2));
            other.changeAffection(change);
            other.recordPlayerAction('friend_harmed', 'negative');
            affected.push(other.name);
        }
    });
    if (affected.length > 0 && window.showMessage) {
        window.showMessage('💢 ' + affected.join('、') + ' 因你伤害了TA的朋友而对你心生不满！', 'warning');
    }
}

// ==================== NPC任务系统 ====================
class NPCQuestSystem {
    constructor() { this.quests = new Map(); this.completedQuests = new Set(); this.availableQuests = []; }
    registerQuestTemplate(t) { this.quests.set(t.id, t); }
    getAvailableQuests(npcId, minAffection = 30) {
        const npc = window.npcManager?.getNPC(npcId);
        if (!npc || npc.relationship?.affection < minAffection) return [];
        return this.availableQuests.filter(q => q.npcId === npcId && !this.completedQuests.has(q.id));
    }
    acceptQuest(questId) {
        const q = this.quests.get(questId); if (!q) return false;
        if (!window.playerQuestProgress) window.playerQuestProgress = { activeQuests: [], completedQuests: [], totalCompleted: 0 };
        if (!window.playerQuestProgress.activeQuests.find(x => x.id === questId)) { window.playerQuestProgress.activeQuests.push({ ...q, status: 'active', acceptedAt: Date.now() }); }
        return true;
    }
    completeQuest(questId) {
        this.completedQuests.add(questId);
        // 完成任务增加情分
        this.changeFavor(5);
        return true;
    }
    registerDefaultQuests() {
        const defaults = [
            { id: 'quest_gather_herbs', title: '采集草药', type: 'collection', npcId: 'healer_01', minAffection: 30, rewards: { spiritStones: 50, affection: 10 } },
            { id: 'quest_defeat_bandits', title: '击败山贼', type: 'combat', npcId: 'warrior_01', minAffection: 40, rewards: { spiritStones: 100 } },
            { id: 'quest_deliver_message', title: '传递消息', type: 'delivery', npcId: 'mentor_01', minAffection: 20, rewards: { respect: 10 } },
            { id: 'quest_mine_ore', title: '采集矿石', type: 'collection', npcId: 'craftsman_01', minAffection: 30, rewards: { spiritStones: 80 } },
            { id: 'quest_explore_dungeon', title: '探索秘境', type: 'exploration', npcId: 'mysterious_01', minAffection: 50, rewards: { spiritStones: 200 } }
        ];
        defaults.forEach(q => this.registerQuestTemplate(q)); this.availableQuests = defaults;
    }
}

// ==================== NPC请求系统 ====================
class NPCRequestSystem {
    constructor() { this.requests = new Map(); }
    registerRequestType(c) { this.requests.set(c.id, c); }
    registerDefaultRequests() {
        const defaults = [
            { id: 'teach_skill', name: '传授功法', minAffection: 40, cost: { spiritStones: 100 }, effect: (npc, p) => { if (p.essence) p.essence += 20; npc.changeAffection(5); return { success: true, msg: '获得20点真元' }; } },
            { id: 'heal', name: '请求治疗', minAffection: 20, cost: { spiritStones: 30 }, effect: (npc, p) => { if (p.health) p.health = p.maxHealth || 100; npc.changeAffection(3); return { success: true, msg: '伤势已痊愈' }; } },
            { id: 'accompany', name: '陪同探索', minAffection: 50, cost: { spiritStones: 50 }, effect: (npc, p) => { npc.changeAffection(10); return { success: true, msg: npc.name + '加入了队伍' }; } },
            { id: 'guidance', name: '指点修炼', minAffection: 40, cost: {}, effect: (npc, p) => { if (p.tempering) p.tempering += 15; npc.changeRespect(5); return { success: true, msg: '获得15点历练' }; } }
        ];
        defaults.forEach(r => this.registerRequestType(r));
    }
    executeRequest(npcId, requestType) {
        const npc = window.npcManager?.getNPC(npcId); const config = this.requests.get(requestType);
        if (!npc || !config) return { success: false, msg: '请求不存在' };
        // v14.11 审计5：同地点守卫
        if (typeof npcNotCoLocated === 'function' && npcNotCoLocated(npc)) return { success: false, msg: '你们并不在一处，无法当面' + (config.name || '办理') + '。' };
        if (npc.relationship?.affection < config.minAffection) return { success: false, msg: '好感度不足' };
        return config.effect(npc, window.currentCharData);
    }
}

// ==================== NPC事件系统 ====================
class NPCEventSystem {
    constructor() { this.events = []; this.eventHistory = []; }
    checkEvents() {
        const npcs = window.npcManager?.getAllNPCs() || [];
        npcs.forEach(npc1 => {
            Object.keys(npc1.npcRelationships || {}).forEach(rivalId => {
                var relR = npc1.npcRelationships[rivalId];
                var rType = (typeof relR === 'string') ? relR : (relR && relR.relation);
                if (rType !== 'rival') return;
                const rival = window.npcManager?.getNPC(rivalId);
                if (rival && rival.state?.location === npc1.state?.location && Math.random() < 0.1) this.triggerConflict(npc1, rival);
            });
        });
    }
    triggerConflict(npc1, npc2) { npc1.relationship.hatred = Math.min(100, (npc1.relationship.hatred || 0) + 10); npc2.relationship.hatred = Math.min(100, (npc2.relationship.hatred || 0) + 10); }
}

// ==================== 打招呼/告别系统 ====================
function getGreeting(npc, player) {
    if (!npc || !player) return '你好。';

    // ====== 特殊NPC专属问候 ======
    // v20.4：问候自动触发已移至 showNPCDialog 的非远程分支（见该处），
    // 此处只负责生成问候语——远程查看不该触发「她叫住了你」的事件场景。
    if (npc.id === 'sect_leader_修罗宫') {
        return getFeiLeiGreeting(npc, player);
    }
    if (npc.id === 'sect_leader_百花谷') {
        return getWenHengGreeting(npc, player);
    }

    const affection = npc.relationship?.affection || 0;
    const memory = npc.memory || {};
    const personality = npc.personalityBig5 || {};
    const state = npc.state || {};
    const hour = window.timeSystem?.gameTime?.currentHour || 12;
    const playerFame = window.currentCharData?.fame || 0;
    let timeGreeting = '你好';
    if (hour >= 5 && hour < 9) timeGreeting = '早安';
    else if (hour >= 9 && hour < 12) timeGreeting = '上午好';
    else if (hour >= 12 && hour < 14) timeGreeting = '午安';
    else if (hour >= 14 && hour < 18) timeGreeting = '下午好';
    else if (hour >= 18 && hour < 21) timeGreeting = '傍晚好';
    else timeGreeting = '夜深了';
    const memImp = typeof npc.getMemoryImpression === 'function' ? npc.getMemoryImpression() : 'first';
    let baseGreeting;

    // ====== 首次见面（按名气阈值） ======
    if (memImp === 'first' || !memory.firstMet) {
        if (affection >= 0) {
            if (playerFame >= 90) return `${timeGreeting}，你就是${player.name}？久仰大名，如雷贯耳。`;
            if (playerFame >= 50) return `${timeGreeting}，你就是${player.name}？久仰了。`;
            if (playerFame >= 20) return `${timeGreeting}，你就是${player.name}？略有耳闻。`;
            return `${timeGreeting}，你是新来的${player.name}？`;
        } else {
            if (playerFame >= 90) return `${timeGreeting}……你就是${player.name}？久仰大名，如雷贯耳。`;
            if (playerFame >= 50) return `${timeGreeting}……你就是${player.name}？久仰了。`;
            if (playerFame >= 20) return `${timeGreeting}……你就是${player.name}？略有耳闻。`;
            return `${timeGreeting}……你是谁？`;
        }
    }

    // ====== 后续见面问候池（按好感度随机） ======
    const greetingPool = {
        high: [
            `${timeGreeting}，${player.name}！见到你真好！`,
            `${timeGreeting}，${player.name}，今天气色不错！`,
            `${player.name}！正想找你呢！`,
            `${timeGreeting}，${player.name}，你来了我真高兴！`,
            `${player.name}，一天不见就惦记着你。`
        ],
        midHigh: [
            `${timeGreeting}，${player.name}，很高兴又见到你`,
            `${player.name}，好久不见，近来可好？`,
            `${timeGreeting}，${player.name}，正等着你呢。`,
            `${player.name}，你来了，坐吧。`,
            `${player.name}，最近忙什么呢？`
        ],
        mid: [
            `${timeGreeting}，${player.name}，最近怎么样`,
            `${player.name}，最近在忙什么？`,
            `${timeGreeting}，${player.name}，又见面了。`,
            `${player.name}，你看起来精神不错。`,
            `${player.name}，来，这边坐。`
        ],
        low: [
            `${timeGreeting}，${player.name}`,
            `${player.name}，你来了。`,
            `${timeGreeting}，${player.name}，有什么事？`,
            `${player.name}，又见面了。`,
            `${player.name}，有事直说。`
        ],
        cold: [
            `${timeGreeting}，有什么事吗`,
            `${player.name}，找我有事？`,
            `${timeGreeting}，${player.name}，你怎么来了？`,
            `${player.name}，有话直说。`,
            `${player.name}，什么事？`
        ],
        dislike: [
            `${timeGreeting}……又是你`,
            `${player.name}……你怎么又来了？`,
            `${timeGreeting}……你还没走啊？`,
            `${player.name}……有什么事快说。`,
            `${player.name}……阴魂不散。`
        ],
        hate: [
            '走开，我不想理你',
            `${player.name}……别烦我。`,
            `${player.name}走开。`,
            `${player.name}滚。`
        ]
    };

    if (affection >= 80) baseGreeting = randomChoice(greetingPool.high);
    else if (affection >= 60) baseGreeting = randomChoice(greetingPool.midHigh);
    else if (affection >= 40) baseGreeting = randomChoice(greetingPool.mid);
    else if (affection >= 20) baseGreeting = randomChoice(greetingPool.low);
    else if (affection >= 0) baseGreeting = randomChoice(greetingPool.cold);
    else if (affection >= -30) baseGreeting = randomChoice(greetingPool.dislike);
    else baseGreeting = randomChoice(greetingPool.hate);

    // ====== 名气追加词缀（仅好感≥0时） ======
    if (affection >= 0) {
        if (playerFame >= 90) {
            baseGreeting += randomChoice(['，你如今可是名动天下了。', '，天下谁人不识君啊。', '，你的事迹天下皆知。']);
        } else if (playerFame >= 50) {
            baseGreeting += randomChoice(['，你现在也算个人物了。', '，你的事迹我有所耳闻。', '，你最近风头正劲。']);
        } else if (playerFame >= 20) {
            baseGreeting += randomChoice(['，听说你最近混得还行。', '，听说过你的事。', '，你最近挺活跃的。']);
        }
    }

    // ====== 时间间隔后缀 ======
    const hours = typeof npc.getHoursSinceLastMeet === 'function' ? npc.getHoursSinceLastMeet() : -1;
    if (hours > 0 && hours < 1) baseGreeting += '，我们刚见过吧';
    else if (hours >= 1 && hours < 6) baseGreeting += '，几个时辰不见';
    else if (hours >= 6 && hours < 24) baseGreeting += '，一天不见';
    else if (hours >= 24 && hours < 72) baseGreeting += '，好久不见';
    else if (hours >= 168) baseGreeting += '，你最近去哪了？好久不见';

    // ====== 上次行为后缀 ======
    const lastActions = memory.playerActions || [];
    const recentAction = lastActions[lastActions.length - 1];
    if (recentAction) {
        if (recentAction.action === 'gift' && recentAction.result !== 'negative') baseGreeting += '，谢谢你上次的礼物';
        else if (recentAction.action === 'help' && recentAction.result !== 'negative') baseGreeting += '，上次多亏了你帮忙';
        else if (recentAction.action === 'attack') baseGreeting += '……你上次做的事我可记得';
        else if (recentAction.action === 'refuse_quest') baseGreeting += '，上次的事……我还在想呢';
        else if (recentAction.action === 'deep_talk') baseGreeting += '，上次聊得很开心';
    }

    // ====== 性格/心情后缀 ======
    if (personality.extraversion > 70) baseGreeting += '！';
    else if (personality.extraversion < 30) baseGreeting += '...';
    if (state.mood < 30) baseGreeting += '（心情不太好）';
    else if (state.mood > 70) baseGreeting += '（心情不错）';

    // ====== 怪癖/情绪修饰 ======
    const quirkMod = typeof npc.getDialogueModifier === 'function' ? npc.getDialogueModifier() : '';
    if (quirkMod) baseGreeting = quirkMod + ' ' + baseGreeting;

    return baseGreeting;
}

// ==================== 绯泪（修罗宫主）专属问候 ====================
function getFeiLeiGreeting(npc, player) {
    if (!npc || !player) return '……';
    const affection = npc.relationship?.affection || 0;
    const memory = npc.memory || {};
    const state = npc.state || {};
    const playerFame = window.currentCharData?.fame || 0;
    const isDaoCompanion = npc.relationship?.flags?.has('dao_companion') || false;

    // 记忆印象
    const memImp = typeof npc.getMemoryImpression === 'function' ? npc.getMemoryImpression() : 'first';

    // ====== 首次见面（按名气阈值，宫主气度——冷淡但有礼） ======
    if (memImp === 'first' || !memory.firstMet) {
        if (playerFame >= 90) return '「' + player.name + '……你比传闻中要沉稳些。」';
        if (playerFame >= 50) return '「' + player.name + '？有所耳闻。说吧，何事。」';
        if (playerFame >= 20) return '「' + player.name + '……这个名字似乎听过。」';
        return '「你就是' + player.name + '？修罗宫近日并无访客预约。」';
    }

    // ====== 道侣专属问候（覆盖好感≥80档） ======
    if (isDaoCompanion) {
        const hour = window.timeSystem?.gameTime?.currentHour || 12;
        const isNight = hour >= 21 || hour < 5;
        const isLate = hour >= 18 && hour < 21;

        const daoGreetings = [
            '「你来了。」' + (state.mood > 60 ? '（眼底有光）' : ''),
            '「正想着你，你就来了。」',
            '「今天怎么想到来找我？」' + (state.mood > 50 ? '（带笑）' : ''),
            '「……想你了。」' + (affection >= 90 ? '（别过脸）' : '（声音很轻）'),
            '「你最近都不怎么来找我。」' + (affection >= 80 ? '（抱怨）' : ''),
        ];
        const longAbsence = [
            '「你还知道回来？」' + (affection >= 80 ? '（藏不住的高兴）' : ''),
            '「我以为你不回来了。」（声音很轻）',
            '「下次出门，带上我。」'
        ];
        const nightGreetings = [
            '「还不睡？……那我陪你。」',
            '「夜里凉，过来。」',
            '「这么晚还来，不冷么？」'
        ];
        const moodLowGreetings = [
            '「……别说话，让我靠一会儿。」',
            '「让我抱一下就好。」',
            '「今天别走。」'
        ];
        const moodHighGreetings = [
            '「今天心情好，陪你走走。」',
            '「你今日倒是格外顺眼。」',
            '「我让人做了你爱吃的点心。」',
            '「过来坐。」（语气温柔）'
        ];

        // 检查上次见面间隔
        const hours = typeof npc.getHoursSinceLastMeet === 'function' ? npc.getHoursSinceLastMeet() : -1;
        if (hours >= 168) return randomChoice(longAbsence);
        if (isNight) return randomChoice(nightGreetings);
        if (state.mood < 30) return randomChoice(moodLowGreetings);
        if (state.mood > 70) return randomChoice(moodHighGreetings);
        return randomChoice(daoGreetings);
    }

    // ====== 后续见面问候池（按好感度） ======
    const greetingPool = {
        high: [
            '「……你来了。」（语气松下来）',
            '「我正好要找你。」',
            '「今天别走太远。」',
            '「你最近很忙？都不见人影。」',
            '「过来坐。」'
        ],
        midHigh: [
            '「' + player.name + '，你来了。」',
            '「你最近倒是挺勤快。」',
            '「正好，我有事问你。」',
            '「没打扰你修炼吧？」',
            '「你来得正好。」'
        ],
        mid: [
            '「' + player.name + '……又见面了。」',
            '「你来做什么？」',
            '「有事？」',
            '「你倒是很闲。」',
            '「嗯。」（点头）'
        ],
        low: [
            '「' + player.name + '？什么事。」',
            '「你又来了。」',
            '「说。」',
            '「我很忙，长话短说。」'
        ],
        cold: [
            '「嗯。」',
            '「你来做什么？」',
            '「有事就说。」'
        ],
        dislike: [
            '「……你又来做什么？」',
            '「我很忙，别打扰我。」',
            '「……你还没走？」'
        ],
        hate: [
            '「……别让我说第二遍。」',
            '「滚。」',
            '「你再靠近一步试试。」'
        ]
    };

    let baseGreeting;
    if (affection >= 80) baseGreeting = randomChoice(greetingPool.high);
    else if (affection >= 60) baseGreeting = randomChoice(greetingPool.midHigh);
    else if (affection >= 40) baseGreeting = randomChoice(greetingPool.mid);
    else if (affection >= 20) baseGreeting = randomChoice(greetingPool.low);
    else if (affection >= 0) baseGreeting = randomChoice(greetingPool.cold);
    else if (affection >= -30) baseGreeting = randomChoice(greetingPool.dislike);
    else baseGreeting = randomChoice(greetingPool.hate);

    // ====== 情绪前缀（绯泪版） ======
    const moodPrefixes = {
        ecstatic: '她眉眼间难得有一丝柔和，',
        happy: '她看起来心情不错，',
        sad: '她声音比平时轻，',
        angry: '她冷冷地看着你，',
        tired: '她揉了揉眉心，'
    };
    if (state.mood < 30) baseGreeting = '她声音比平时轻，' + baseGreeting;
    else if (state.mood > 70) baseGreeting = '她看起来心情不错，' + baseGreeting;

    // ====== 时间间隔后缀 ======
    const hours = typeof npc.getHoursSinceLastMeet === 'function' ? npc.getHoursSinceLastMeet() : -1;
    if (hours > 0 && hours < 1) baseGreeting += '（冷淡）';
    else if (hours >= 24 && hours < 72) baseGreeting += '（略微停顿）';
    else if (hours >= 168) baseGreeting += '（目光在你身上多停了一瞬）';

    return baseGreeting;
}

// ==================== 温蘅（百花谷主）专属问候 v12.3 ====================
// 语言风格：轻声细语、花意象、话里有话；与绯泪的冷淡短句形成反差
function getWenHengGreeting(npc, player) {
    if (!npc || !player) return '……来了？';
    const affection = npc.relationship?.affection || 0;
    const memory = npc.memory || {};
    const state = npc.state || {};
    const playerFame = window.currentCharData?.fame || 0;
    const isDaoCompanion = npc.relationship?.flags?.has('dao_companion') || false;
    const memImp = typeof npc.getMemoryImpression === 'function' ? npc.getMemoryImpression() : 'first';

    // ====== 首次见面（按名气阈值——谷主的客气里带着打量） ======
    if (memImp === 'first' || !memory.firstMet) {
        if (playerFame >= 90) return '「' + player.name + '？久仰。进来吧，正好新到了一批芍药。」';
        if (playerFame >= 50) return '「你就是' + player.name + '？比传闻里……年轻些。请进。」';
        if (playerFame >= 20) return '「' + player.name + '？名字听过的。来看花，还是来看病？」';
        return '「面生啊。百花谷不常待客——不过既然来了，就看看花吧。」';
    }

    // ====== 道侣专属问候（覆盖好感≥80档） ======
    if (isDaoCompanion) {
        const hour = window.timeSystem?.gameTime?.currentHour || 12;
        const isNight = hour >= 21 || hour < 5;
        const daoGreetings = [
            '「回来了。洗手，喝药——今天的不苦，我加了蜜。」',
            '「正给你晒着药呢。等等，马上好。」',
            '「今天花开得很好。……你来得也很好。」',
            '「过来。」（放下药碾，拍了拍身边的位子）',
            '「昨晚睡得好吗？」（头也不抬地问，耳根有点红）'
        ];
        const nightGreetings = [
            '「还不睡？医嘱是亥时歇息——我特批你破例一次。」',
            '「夜里凉。」（把一盏温着的茶推过来）'
        ];
        const moodLowGreetings = [
            '「……让我靠一会儿。就一会儿。」',
            '「今天不想笑。你别介意。」'
        ];
        const moodHighGreetings = [
            '「今天心情好。药庐的账都算平了。」',
            '「给你留了桂花糕。就一块，别多吃。」'
        ];
        if (isNight) return nightGreetings[Math.floor(Math.random() * nightGreetings.length)];
        if (state.mood < 30) return moodLowGreetings[Math.floor(Math.random() * moodLowGreetings.length)];
        if (state.mood > 70) return moodHighGreetings[Math.floor(Math.random() * moodHighGreetings.length)];
        return daoGreetings[Math.floor(Math.random() * daoGreetings.length)];
    }

    // ====== 后续见面问候池（按好感度） ======
    const greetingPool = {
        high: [
            '「来了？药庐的水刚烧开。」',
            '「正想着让人去叫你，你就来了。」',
            '「今天花开得很好。……你来得也很好。」',
            '「站那儿做什么，进来坐。」',
            '「上次的话还没说完呢。」（笑眼弯弯）'
        ],
        midHigh: [
            '「' + player.name + '，来啦。」',
            '「来得正好，帮我搭把手。」',
            '「今天想学点什么？」',
            '「嗯？」（抬头一笑，又低头继续碾药）',
            '「路上没被蛇咬吧？」（随口一问）'
        ],
        mid: [
            '「' + player.name + '？有事？」',
            '「来了。坐。」',
            '「今天来看花，还是来看病？」',
            '「嗯。」（点头，继续忙）'
        ],
        low: [
            '「……有事吗？」',
            '「药庐重地，别乱碰。」',
            '「嗯。」（淡淡的）'
        ],
        cold: [
            '「有事说事。」',
            '「我在忙。」'
        ],
        dislike: [
            '「……你又来做什么？」',
            '「药庐不欢迎你。」'
        ],
        hate: [
            '「出去。」',
            '「别让我说第二遍。」'
        ]
    };

    let baseGreeting;
    if (affection >= 80) baseGreeting = greetingPool.high[Math.floor(Math.random() * greetingPool.high.length)];
    else if (affection >= 60) baseGreeting = greetingPool.midHigh[Math.floor(Math.random() * greetingPool.midHigh.length)];
    else if (affection >= 40) baseGreeting = greetingPool.mid[Math.floor(Math.random() * greetingPool.mid.length)];
    else if (affection >= 20) baseGreeting = greetingPool.low[Math.floor(Math.random() * greetingPool.low.length)];
    else if (affection >= 0) baseGreeting = greetingPool.cold[Math.floor(Math.random() * greetingPool.cold.length)];
    else if (affection >= -30) baseGreeting = greetingPool.dislike[Math.floor(Math.random() * greetingPool.dislike.length)];
    else baseGreeting = greetingPool.hate[Math.floor(Math.random() * greetingPool.hate.length)];

    // ====== 情绪前缀（温蘅版：温柔底色下的细微变化） ======
    if (state.mood < 30) baseGreeting = '她的笑容比平时淡了一点，' + baseGreeting;
    else if (state.mood > 70 && affection < 80) baseGreeting = '她哼着不成调的小曲，' + baseGreeting;

    // ====== 时间间隔后缀 ======
    const hours = typeof npc.getHoursSinceLastMeet === 'function' ? npc.getHoursSinceLastMeet() : -1;
    if (hours >= 168) baseGreeting += '（她看了你很久，像在确认什么）';
    else if (hours >= 72) baseGreeting += '（她多看了你两眼）';

    return baseGreeting;
}

function getFarewell(npc, player) {
    if (!npc) return '再见。';
    const affection = npc.relationship?.affection || 0;
    const memory = npc.memory || {};
    let farewell;
    if (affection >= 80) farewell = '别走太久，我会担心你';
    else if (affection >= 60) farewell = '有空常来找我聊天';
    else if (affection >= 40) farewell = '下次见';
    else if (affection >= 20) farewell = '再见，路上小心';
    else farewell = '再见';
    const lastActions = memory.playerActions || [];
    const recentAction = lastActions[lastActions.length - 1];
    if (recentAction?.action === 'gift') farewell += '，谢谢你的礼物';
    else if (recentAction?.action === 'deep_talk') farewell += '，谢谢你听我说心里话';
    else if (recentAction?.action === 'refuse_quest') farewell += '，好吧，我自己想办法';
    return farewell;
}

// ==================== 初始化 ====================
function initNPCSystem() {
    window.npcManager = new NPCManager();
    window.dialogueSystem = new DialogueSystem();
    window.affectionSystem = new AffectionSystem();
    // P0-1: 使用独立命名，避免覆盖完整的任务/事件系统
    window.npcQuestSystem = new NPCQuestSystem();
    window.npcQuestSystem.registerDefaultQuests();
    window.npcEventSystem = new NPCEventSystem();
    window.npcRequestSystem = new NPCRequestSystem();
    window.npcRequestSystem.registerDefaultRequests();
    addSampleNPCs();
    const allNPCs = window.npcManager.getAllNPCs();
    if (allNPCs.length >= 2) generateNPCRelations(allNPCs);
    gameLog.add('NPC系统已初始化 (' + allNPCs.length + '个NPC)', 'info');
}

function addSampleNPCs() {
    // 优先从 SPECIAL_NPC_DATA 加载所有10个特殊NPC
    if (typeof SPECIAL_NPC_DATA !== 'undefined') {
        for (const key in SPECIAL_NPC_DATA) {
            const data = SPECIAL_NPC_DATA[key];
            const npc = new NPC(data.id, data.name, {
                gender: data.gender,
                age: data.age,
                occupation: data.occupation,
                location: data.location,
                appearance: data.appearance,
                personality: data.personality,
                personalityBig5: data.personalityBig5,
                background: data.background,
                combat: data.combat,
                profession: data.profession,
                preferences: data.preferences,
                schedule: data.schedule,
                dialogueTree: data.dialogueTree
            });
            npcManager.addNPC(npc);
        }
        return;
    }
    // 回退：硬编码4个基本NPC
    const mentor = new NPC('mentor_01', '清虚道人', { occupation: '导师', personality: { wise: true, patient: true }, likes: ['学习', '修炼'], dislikes: ['懒惰'], appearance: { hair: '白色长发', eyes: '深邃', clothing: '道袍', icon: '🧘' } });
    npcManager.addNPC(mentor);
    const merchant = new NPC('merchant_01', '万宝阁主', { occupation: '商人', personality: { cunning: true, friendly: true }, likes: ['金钱', '宝物'], dislikes: ['免费'], appearance: { hair: '黑色短发', eyes: '精明', clothing: '华丽长袍', icon: '💰' } });
    npcManager.addNPC(merchant);
    const warrior = new NPC('warrior_01', '铁拳', { occupation: '战士', personality: { brave: true, aggressive: true }, likes: ['战斗', '锻炼'], dislikes: ['逃跑'], appearance: { hair: '黑色短发', eyes: '锐利', clothing: '战甲', icon: '⚔️' } });
    npcManager.addNPC(warrior);
    const healer = new NPC('healer_01', '灵素', { occupation: '治疗师', personality: { kind: true, gentle: true }, likes: ['帮助他人', '草药'], dislikes: ['暴力'], appearance: { hair: '黑色长发', eyes: '温柔', clothing: '白色长裙', icon: '👩‍⚕️' } });
    npcManager.addNPC(healer);
}

// ==================== 深谈子选项执行 ====================
// 深谈子选项 → 真实处理器映射表
const DEEP_TALK_REAL_HANDLERS = {
    // 赠礼（love分类，打开背包选物品赠送）
    give_gift: function(npcId) { closeNpcModal(); if (typeof window.giveGiftToNPC === 'function') { window.giveGiftToNPC(npcId); return true; } return false; },
    // 请求（高级请求系统）
    teach_skill: function(npcId) { closeNpcModal(); return callAdvancedRequest(npcId, 'teach_skill'); },
    request_heal: function(npcId) { closeNpcModal(); return callAdvancedRequest(npcId, 'request_heal'); },
    borrow_item: function(npcId) { closeNpcModal(); return callAdvancedRequest(npcId, 'borrow_item'); },
    request_guidance: function(npcId) { closeNpcModal(); return callAdvancedRequest(npcId, 'guidance'); },
    request_asylum: function(npcId) { closeNpcModal(); return callAdvancedRequest(npcId, 'request_asylum'); },
    // 同行
    request_accompany: function(npcId) { closeNpcModal(); return callAdvancedRequest(npcId, 'accompany'); },
    // 委托（接入NPCQuestSystem任务系统）
    accept_quest: function(npcId) {
        var npc = window.npcManager?.getNPC(npcId);
        if (!npc) { showMessage('NPC不存在', 'error'); return false; }
        var npcQuestSystem = window.npcQuestSystem;
        if (!npcQuestSystem) { showMessage('NPC委托系统未初始化', 'warning'); return false; }
        var available = npcQuestSystem.getAvailableQuests(npcId, 10);
        if (available.length === 0) {
            showMessage('📜 ' + npc.name + ' 暂时没有委托给你。', 'info');
            return true;
        }
        var questList = available.map(function(q) {
            var rewardText = '';
            if (q.rewards) {
                if (q.rewards.spiritStones) rewardText += '灵石+' + q.rewards.spiritStones + ' ';
                if (q.rewards.affection) rewardText += '好感+' + q.rewards.affection;
                if (q.rewards.respect) rewardText += '敬重+' + q.rewards.respect;
            }
            return '<button onclick="acceptNPCQuest(\'' + q.id + '\', \'' + npcId + '\')" class="w-full bg-gray-700 hover:bg-gray-600 p-3 rounded mb-2 text-left">' +
                '<p class="text-white font-bold">' + q.title + '</p>' +
                '<p class="text-xs text-gray-400">' + (q.type || '') + ' | ' + rewardText + '</p></button>';
        }).join('');
        showMessage('📜 ' + npc.name + ' 的委托：<br>' + questList, 'info');
        return true;
    },
    // 修炼指导（知识系统）
    breakthrough_guide: function(npcId) { return showCultivationGuide(npcId, '突破指导'); },
    inner_arts: function(npcId) { return showCultivationGuide(npcId, '心法讲解'); },
    combat_tips: function(npcId) { return showCultivationGuide(npcId, '战斗技巧'); },
    root_cultivation: function(npcId) { return showCultivationGuide(npcId, '灵根修炼'); },
    insight_share: function(npcId) { return showCultivationGuide(npcId, '感悟分享'); },
    // 爱情类（非赠礼的情感互动）
    express_like: function(npcId) { return executeEmotionInteraction(npcId, 'express_like'); },
    spend_time: function(npcId) { return executeEmotionInteraction(npcId, 'spend_time'); },
    confess: function(npcId) { return executeEmotionInteraction(npcId, 'confess'); },
    intimate: function(npcId) { return executeEmotionInteraction(npcId, 'intimate'); },
    bond_dao: function(npcId) { return executeEmotionInteraction(npcId, 'bond_dao'); }
};

// 辅助：关闭NPC对话框
function closeNpcModal() {
    var m = document.querySelector('.npc-dialog-modal');
    if (m) m.remove();
}

// 辅助：调用高级请求
function callAdvancedRequest(npcId, requestId) {
    var npc = window.npcManager?.getNPC(npcId);
    if (!npc) { showMessage('NPC不存在', 'error'); return false; }
    var result = executeAdvancedRequest(npc, requestId);
    if (result && result.success) {
        showMessage(result.msg, 'success');
        // 延时重新打开NPC面板
        setTimeout(function() { if (typeof window.showNPCDialog === 'function') window.showNPCDialog(npcId); }, 500);
    } else {
        showMessage(result ? result.msg : '请求失败', 'warning');
    }
    return true;
}

// 辅助：修炼指导（知识系统简化版）v12.0增强：每种指导有实际效果
function showCultivationGuide(npcId, guideType) {
    var npc = window.npcManager?.getNPC(npcId);
    if (!npc) return false;
    var aff = npc.relationship?.affection || 0;
    var cd = window.currentCharData;
    var msg = '';
    var extraMsg = '';
    var hasBuff = false;
    switch (guideType) {
        case '突破指导':
            msg = '突破之道在于心境与积累，切忌急功近利。';
            if (aff >= 20 && cd) {
                cd.tempering = (cd.tempering || 0) + 20;
                extraMsg = '历练+20';
            }
            break;
        case '心法讲解':
            msg = '心法是修炼之基，需循序渐进，日久自成。';
            if (aff >= 20 && cd) {
                cd.tempering = (cd.tempering || 0) + 15;
                extraMsg = '历练+15';
            }
            break;
        case '战斗技巧':
            msg = '战斗不在蛮力，而在先机与应变。';
            if (aff >= 20 && cd) {
                cd.tempering = (cd.tempering || 0) + 15;
                extraMsg = '历练+15';
            }
            break;
        case '灵根修炼':
            msg = '灵根乃先天之资，但后天的努力更为重要。';
            if (aff >= 20 && cd) {
                cd.tempering = (cd.tempering || 0) + 20;
                extraMsg = '历练+20';
            }
            break;
        case '感悟分享':
            msg = '修行路上，每一次感悟都是宝贵的财富。';
            if (aff >= 20 && cd) {
                cd.tempering = (cd.tempering || 0) + 25;
                extraMsg = '历练+25';
            }
            break;
        default:
            msg = '修炼之道，贵在坚持。';
            if (aff >= 20 && cd) {
                cd.tempering = (cd.tempering || 0) + 5;
            }
    }
    if (aff >= 20) {
        // v20.24 兑现"请教要耗情谊"的旧承诺：教人的意愿是有限资源，每问一次折一层情面
        // （配置里 affectionCost:10 此前从未落账——写价的没扣钱，如今价实相符）
        if (typeof npc.changeAffection === 'function') npc.changeAffection(-10);
        showMessage('🧘 ' + npc.name + ' 为你讲解' + guideType + '：' + msg + (extraMsg ? '（' + extraMsg + '，情面-10）' : ''), 'success');
        if (typeof window.updateCharacterStatus === 'function') {
            try { window.updateCharacterStatus(); } catch (e) {}
        }
    } else {
        showMessage(npc.name + ' 微微摇头：「你境界不够，说了也难领悟。」', 'warning');
    }
    return true;
}

// 辅助：情感互动（爱情类）
function executeEmotionInteraction(npcId, interactionType) {
var npc = window.npcManager?.getNPC(npcId);
if (!npc) return false;
if (typeof npcNotCoLocated === 'function' && npcNotCoLocated(npc)) { showMessage('你与' + npc.name + '并不在一处——隔空传情是听不见的。', 'warning'); return false; }
var aff = npc.relationship?.affection || 0;
var name = npc.name;
// v14.11 审计5：同地点守卫
if (npcNotCoLocated(npc)) { showMessage('你与' + name + '并不在一处——隔空传情是听不见的。', 'warning'); return false; }
// v14.11 爱情动作防刷：冷却 + 承诺链 + 冷面性格额外门槛
npc.memory = npc.memory || {};
npc.memory._loveCd = npc.memory._loveCd || {};
var LOVE_CD_DAYS = { confess: 3, intimate: 3, bond_dao: 7 };
var cdD = LOVE_CD_DAYS[interactionType] || 0;
var dayN = (window.timeSystem && window.timeSystem.getAbsoluteDay) ? window.timeSystem.getAbsoluteDay() : 0;
if (cdD > 0) {
    var lastT = npc.memory._loveCd[interactionType];
    if (lastT != null && (dayN - lastT) < cdD) {
        showMessage(name + ' 的心绪还没平复，频繁提起反而生分。（冷却中）', 'warning');
        return false;
    }
}
// v20.25 冷却只记成功：旧版开一次口（哪怕被拒）就写 3/7 日冷却——被拒反而"安全"，
// 攒够好感前反复试探零成本。现在：成的才记账；败的折情面（见 confess 分支）。
var _markLoveCd = function () { if (cdD > 0) npc.memory._loveCd[interactionType] = dayN; };
if (interactionType === 'intimate' || interactionType === 'bond_dao') {
    // v20.25 掌门人豁免取消：执一教之旗也是血肉之躯，牵手也得先过了告白这一关——
    // 旧版八位掌门可跳过告白直接亲密，关系递进没有门槛，情分贬值。
    if (!npc.memory._loveAccepted_confess) {
        showMessage(name + ' 后退半步，眼神认真起来：「……我们还没到那一步。」', 'warning');
        return false;
    }
}
if (interactionType === 'intimate') {
    var nf16 = (window.Personality16 && window.Personality16.ensure) ? window.Personality16.ensure(npc).nature : 0;
    if (nf16 <= -55 && aff < 85) { showMessage(name + ' 性情冷峻，身形微侧避开了你。（冷面之人需要更深的关系）', 'warning'); return false; }
}
switch (interactionType) {
        case 'express_like':
            if (aff >= 40) { showMessage('💕 ' + name + ' 脸微红：「你……你说什么呢。」好感度+2', 'success'); npc.changeAffection(2); npc.changeLove(3); }
            else { showMessage(name + ' 皱眉：「请不要开这种玩笑。」', 'warning'); }
            break;
        case 'spend_time':
            if (aff >= 50) { showMessage('👫 你和' + name + '一起散步赏景，心情愉悦。好感度+3', 'success'); npc.changeAffection(3); npc.changeLove(4); if (npc.state) npc.state.mood = Math.min(100, (npc.state.mood || 50) + 5); }
            else { showMessage(name + ' 婉拒：「下次吧。」', 'warning'); }
            break;
        case 'confess':
        if (aff >= 60) { showMessage('💕 ' + name + ' 怔住了，随后低声道：「我……我需要时间考虑。」好感度+5', 'success'); npc.changeAffection(5); npc.changeLove(8); npc.memory._loveAccepted_confess = true; _markLoveCd(); }
        else { if (typeof npc.changeAffection === 'function') npc.changeAffection(-2); showMessage(name + ' 摇头：「我们不合适。」——这话砸在地上，两个人都僵了一瞬。（情面-2）', 'warning'); }
        break;
        case 'intimate':
            if (aff >= 70) { showMessage('💕 你轻轻握住' + name + '的手，' + (npc.gender === 'male' ? '他' : '她') + '没有拒绝。好感度+5', 'success'); npc.changeAffection(5); npc.changeLove(10); _markLoveCd(); }
            else { showMessage(name + ' 后退一步：「请自重。」', 'warning'); }
            break;
        case 'bond_dao':
            // 绯泪（修罗宫主）/温蘅（百花谷主）的道侣路线由个人事件系统控制，不在深谈中触发
            if (npcId === 'sect_leader_修罗宫') {
                showMessage('绯泪看了你一眼：「……这件事，等你准备好了再说。」', 'info');
                break;
            }
            // v12.3 温蘅：关系走向由终章「花开」决定
            if (npcId === 'sect_leader_百花谷') {
                showMessage('温蘅眨了眨眼，笑容一如既往：「急什么呀。」', 'info');
                break;
            }
            // v20.2 琤霄凌：关系走向由终章「霜鸣」决定
            if (npcId === 'sect_leader_天山派') {
                showMessage('琤霄凌按住霜鸣的剑鞘，看了你一眼：「……霜鸣认了人，再说不迟。」', 'info');
                break;
            }
            // v20.2 蓝凤凰：关系走向由终章「蝶变」决定（心蛊未化蝶前不谈道侣）
            if (npcId === 'sect_leader_五仙教') {
                showMessage('蓝凤凰凤目一挑，指尖银蝶一颤：「……心蛊没认主前，谈这个，是嫌我命长？」', 'info');
                break;
            }
            // v20.3 冶砚：关系走向由终章「一柄为你铸的剑」决定
            if (npcId === 'sect_leader_铸剑山庄') {
                showMessage('冶砚挠了挠额前那缕焦黄头发，虎牙露出来：「……剑还没铸成呢，急什么。」', 'info');
                break;
            }
            // v20.3 芩木：关系走向由终章「一张为你开的方」决定
            if (npcId === 'sect_leader_药王谷') {
                showMessage('芩木温润地笑，眼底却不达底：「……方子还没改完呢，急什么。」', 'info');
                break;
            }
            // v20.3 昴既明：关系走向由终章「一道为你画的符」决定
            if (npcId === 'sect_leader_茅山派') {
                showMessage('昴既明清冷地看你一眼，左眼银光微动：「……符还没画完，急什么。」', 'info');
                break;
            }
            // v20.3 赫渊：关系走向由终章「为你破最后一戒」决定
            if (npcId === 'sect_leader_金刚宗') {
                showMessage('赫渊沉静地看你一眼，唇线紧抿——修闭口禅，不开口。', 'info');
                break;
            }
            if (aff >= 80) { showMessage('💕 ' + name + ' 郑重道：「天地为证，从今往后你我便是道侣！」好感度+10', 'success'); npc.changeAffection(10); npc.changeLove(20); npc.setFlag('dao_companion'); _markLoveCd();
                // v20.24 名册落笔：旗与册同源，双修/随行/护法/子嗣自此有据可依
                if (window.ensureDaoBond) window.ensureDaoBond(npcId); }
            else { showMessage(name + ' 沉默片刻：「对不起，我还没准备好。」', 'warning'); }
            break;
    }
    return true;
}

// 深谈子选项执行：优先调度真实处理器，回退到通用对话
// 新增：分支对话树检测 + 秘密对话选项
// v14.11 审计5：同地点守卫（队伍跟随视为同行；地名含·取尾段比对，互含亦视为同城）
function npcNotCoLocated(npc) {
    try {
        if (!npc || !window.currentCharData || !window.currentCharData.location) return false;
        if (npc.isFollowing) return false;
        var pl = String(window.currentCharData.location);
        var nl = String(npc.location || '');
        if (!nl) return false;
        if (pl === nl) return false;
        var pa = pl.split('·').pop(), na = nl.split('·').pop();
        if (pa === na) return false;
        if (pl.indexOf(nl) >= 0 || nl.indexOf(pl) >= 0) return false;
        return true;
    } catch (e) { return false; }
}

function executeDeepTalkSubOption(npcId, categoryId, subOptionId) {
    const npc = window.npcManager?.getNPC(npcId);
    if (!npc) { showMessage('NPC不存在', 'error'); return; }
    // v14.11 审计5：远程当面互动守卫
    if (npcNotCoLocated(npc)) { showMessage('你与' + npc.name + '并不在一处——隔空喊话是听不见的。', 'warning'); return; }
    const aff = npc.relationship?.affection || 0;
    let subOption = null, cat = null;
    for (const key in DEEP_TALK_CATEGORIES) {
        const c = DEEP_TALK_CATEGORIES[key];
        if (c.id === categoryId) { cat = c; subOption = c.subOptions.find(s => s.id === subOptionId); break; }
    }
    if (!subOption) { showMessage('选项不存在', 'error'); return; }

    // ====== 深谈2.0：检查是否有分支对话树 ======
    var branchKey = npcId + '_' + categoryId + '_' + subOptionId;
    var branchTree = DEEP_TALK_BRANCHES[branchKey];
    if (branchTree && typeof branchTree === 'object' && branchTree.intro) {
        // 进入分支选择模式
        showBranchDialog(npcId, categoryId, subOptionId, branchKey);
        return;
    }

    // ====== P0：优先调度真实处理器 ======
    var handler = DEEP_TALK_REAL_HANDLERS[subOptionId];
    if (handler) {
        var handled = handler(npcId);
        if (handled) {
            npc.recordPlayerAction('deep_talk_' + subOptionId, 'positive');
            return;
        }
    }

    const playerName = window.currentCharData?.name || '你';
    let insufficientAff = false;
    let penalty = 0;

    if (aff < subOption.minAffection) {
        insufficientAff = true;
        penalty = subOption.minAffection ? -Math.floor(subOption.minAffection / 10) : -2;
    }

    if (subOption.affectionCost > 0) {
        const favor = npc.relationship?.favor || 0;
        if (favor < subOption.affectionCost) {
            penalty += -2;
        }
    }

    let npcResponse = '';
    if (insufficientAff) {
        const negativeResponses = getDeepTalkResponse(npc, categoryId, subOptionId, true);
        npcResponse = randomChoice(negativeResponses);
    } else {
        const customDialogue = npc.dialogueTree?.topics?.[categoryId]?.all;
        if (customDialogue && customDialogue.length > 0) {
            const chosen = randomChoice(customDialogue);
            npcResponse = chosen.replace(/{playerName}/g, playerName);
        } else {
            const genericResponses = getDeepTalkResponse(npc, categoryId, subOptionId, false);
            npcResponse = randomChoice(genericResponses);
        }
    }

    const hoursSince = typeof npc.getHoursSinceLastMeet === 'function' ? npc.getHoursSinceLastMeet() : -1;
    if (hoursSince >= 0 && hoursSince < 1) npcResponse += '（我们刚见过）';
    else if (hoursSince >= 24) npcResponse += '（好久不见）';

    const mood = npc.state?.mood || 50;
    const stress = npc.state?.stress || 0;
    if (mood > 70) npcResponse += '（心情不错）';
    if (stress > 60) npcResponse += '（有些烦躁）';
    if (npc.state?.isBroken) npcResponse += '（状态不太稳定）';

    if (npc.background?.goal) {
        npcResponse += '\n\n（他最近的目标是：' + npc.background.goal + '）';
    }

    if (categoryId === 'farewell') {
        npcResponse = getFarewell(npc, { name: playerName });
    }

    const actionType = insufficientAff ? 'forced_talk' : 'deep_talk';
    const actionResult = insufficientAff ? 'negative' : 'positive';
    npc.recordPlayerAction(actionType, actionResult);
    npc.relationship.affection = clamp(aff + (insufficientAff ? penalty : 1), -100, 100);
    markNPCMetNow(npc);

    if (subOption.affectionCost > 0) {
        if (typeof npc.changeFavor === 'function') {
            npc.changeFavor(-subOption.affectionCost);
        } else {
            npc.relationship.favor = Math.max(0, (npc.relationship.favor || 0) - subOption.affectionCost);
        }
    }

    let modal = document.querySelector('.npc-dialog-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50 npc-dialog-modal';
        document.body.appendChild(modal);
    }

    let extraHtml = '';
    if (categoryId === 'farewell') {
        extraHtml = '<div class="text-xs text-gray-500 text-center mt-3">对话结束，面板将自动关闭...</div>';
        setTimeout(function() { var m = document.querySelector('.npc-dialog-modal'); if (m) m.remove(); }, 3000);
    } else {
        extraHtml = '<button onclick="this.closest(\'.fixed\').remove(); showSubCategoryDialog(\'' + npcId + '\', \'' + categoryId + '\')" class="w-full bg-blue-700 hover:bg-blue-600 px-3 py-2 rounded text-sm text-white mt-3">继续交谈</button>';
    }

    modal.innerHTML = '<div class="bg-gray-800 border-2 border-blue-500 rounded-xl p-6 max-w-xl w-full mx-4">' +
        '<div class="flex items-center gap-3 mb-4">' +
            '<button onclick="this.closest(\'.fixed\').remove(); showNPCDialog(\'' + npcId + '\')" class="text-gray-400 hover:text-white text-lg">&larr;</button>' +
            '<h3 class="text-lg font-bold text-white">' + (cat ? cat.icon : '💬') + ' ' + (cat ? cat.name : '对话') + '</h3>' +
            '<button onclick="this.closest(\'.fixed\').remove()" class="text-gray-400 hover:text-white text-2xl ml-auto">&times;</button>' +
        '</div>' +
        '<div class="bg-gray-900 p-4 rounded-lg mb-4 space-y-3">' +
            '<div class="flex items-start gap-2">' +
                '<span class="text-blue-400 font-bold text-sm">' + playerName + ':</span>' +
                '<span class="text-gray-300 text-sm">' + subOption.name + '</span>' +
            '</div>' +
            '<div class="flex items-start gap-2">' +
                '<span class="text-green-400 font-bold text-sm">' + npc.name + ':</span>' +
                '<span class="text-gray-200 text-sm">' + npcResponse + '</span>' +
            '</div>' +
        '</div>' +
        '<div class="text-xs text-gray-500 text-center">' + (insufficientAff ? '好感度 ' + penalty : (subOption.affectionCost > 0 ? '情分 -' + subOption.affectionCost : '好感度 +1')) + '</div>' +
        extraHtml +
    '</div>';
}

// ==================== NPC对话面板（分层深谈版）====================
function showNPCDialog(npcId, screen = 'main') {
    var npc = window.npcManager?.getNPC(npcId);
    if (!npc) { showMessage('NPC不存在', 'error'); return; }
    // P1-6: 远程互动限制——非跟随状态的NPC必须同地点
    if (!npc.isFollowing) {
        var playerLoc = window.currentCharData?.location || '';
        var npcLoc = npc.location || '';
        if (playerLoc && npcLoc && playerLoc !== npcLoc) {
            // 允许查看档案，但标记为远程
            screen = 'remote';
        }
    }
    // 先移除旧NPC对话框（避免与entity-interaction面板的z-50冲突）
    const oldNpcModal = document.querySelector('.npc-dialog-modal');
    if (oldNpcModal) oldNpcModal.remove();
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50 npc-dialog-modal';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    const affection = npc.relationship?.affection || 0;
    const hatred = npc.relationship?.hatred || 0;
    const favor = npc.relationship?.favor || 0;
    const favorMax = npc.relationship?.favorMax || 50;
    const respect = npc.relationship?.respect || 0;
    const mood = npc.state?.mood || 50;
    const stress = npc.state?.stress || 0;
    let affectionLevel = '陌生人', affectionColor = 'text-gray-400';
    if (affection >= 80) { affectionLevel = '挚爱'; affectionColor = 'text-red-400'; }
    else if (affection >= 60) { affectionLevel = '知己'; affectionColor = 'text-purple-400'; }
    else if (affection >= 40) { affectionLevel = '朋友'; affectionColor = 'text-green-400'; }
    else if (affection >= 20) { affectionLevel = '熟人'; affectionColor = 'text-blue-400'; }
    else if (affection >= -20) { affectionLevel = '陌生人'; affectionColor = 'text-gray-400'; }
    else if (affection >= -50) { affectionLevel = '厌恶'; affectionColor = 'text-orange-400'; }
    else { affectionLevel = '仇人'; affectionColor = 'text-red-600'; }
    const relStatus = (typeof npc.getRelationshipStatus === 'function') ? npc.getRelationshipStatus() : null;
    const quirkMod = (typeof npc.getDialogueModifier === 'function') ? npc.getDialogueModifier() : '';
    const playerName = window.currentCharData?.name || '道友';
    // P1-6: 远程查看不记录见面/问候
    var isRemote = screen === 'remote';
    let greeting = ''; try { greeting = getGreeting(npc, { name: playerName }); } catch (e) { greeting = '你好。'; }
    if (!isRemote && typeof npc.recordPlayerAction === 'function') {
        if (!npc.memory.firstMet) npc.recordPlayerAction('first_meet', 'neutral');
        npc.recordPlayerAction('greet', 'neutral');
        markNPCMetNow(npc);
        // v20.4：问候自动触发只在亲至在场时进行——远程查看不该弹出「她叫住了你」的事件场景。
        if (npc.id === 'sect_leader_修罗宫' && typeof window.maybeAutoTriggerFeiLeiEvent === 'function') {
            try { window.maybeAutoTriggerFeiLeiEvent('greet'); } catch (e) { console.warn('[绯泪线] 自动触发失败:', e); }
        }
        if (npc.id === 'sect_leader_百花谷' && typeof window.maybeAutoTriggerBaihuaEvent === 'function') {
            try { window.maybeAutoTriggerBaihuaEvent('greet'); } catch (e) { console.warn('[温蘅线] 自动触发失败:', e); }
        }
        // F-1.2 重构：补全 npc:talked 事件 emit。quest-system.js 事件桥监听此事件推进 talk_to_npc/talk objective
        if (window.EventBus && typeof window.EventBus.emit === 'function') {
            try { window.EventBus.emit('npc:talked', { npcId: npcId, npcName: npc.name }); } catch (e) {}
        }
    }
    const occAction = OCCUPATION_SPECIFIC_ACTIONS[npc.occupation] || null;
    let occHtml = '';
    if (occAction && affection >= (occAction.minAffection || 0)) {
        occHtml = `<button onclick="executeOccupationAction('${npcId}')" class="flex items-center gap-2 bg-yellow-800 hover:bg-yellow-700 px-3 py-2 rounded text-sm text-white w-full transition-colors"><span>${occAction.name}</span><span class="text-xs text-gray-400">${occAction.desc}</span></button>`;
    }
    let categoriesHtml = '';
    for (const key in DEEP_TALK_CATEGORIES) {
        const cat = DEEP_TALK_CATEGORIES[key];
        categoriesHtml += `<button onclick="showSubCategoryDialog('${npcId}', '${cat.id}')" class="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded text-sm text-white w-full transition-colors"><span>${cat.icon}</span><span>${cat.name}</span><span class="text-xs text-gray-400 ml-auto">${cat.subOptions.length}项</span></button>`;
    }

    // === 新增：P0/P1 功能 ===
    // 1. 当前活动
    var currentActivity = npc.state?.currentActivity || '空闲';
    var location = npc.state?.location || npc.location || '未知';
    if (npc.isFollowing) location = '🚶 跟随玩家';

    // 2. 喜好/厌恶（v15.0 修正：元素为 {category, multiplier} 对象，取 category 标签防 [object Object]）
    var likedItems = (npc.preferences?.likedItems || []).map(function (e) { return typeof e === 'string' ? e : (e && (e.category || e.name)) || ''; }).filter(Boolean);
    var dislikedItems = (npc.preferences?.dislikedItems || []).map(function (e) { return typeof e === 'string' ? e : (e && (e.category || e.name)) || ''; }).filter(Boolean);
    var likesHtml = likedItems.length ? likedItems.join('、') : '未知';
    var dislikesHtml = dislikedItems.length ? dislikedItems.join('、') : '无';

    // 3. 特殊关系标识
    var specialRelationHtml = '';
    if (npc.relationship?.flags?.has('dao_companion')) {
        specialRelationHtml = '<span class="text-pink-400 text-xs ml-2">💕 道侣</span>';
    } else if (npc.relationship?.flags?.has('master')) {
        specialRelationHtml = '<span class="text-yellow-400 text-xs ml-2">📖 师徒</span>';
    } else if (npc.relationship?.flags?.has('sworn_siblings')) {
        specialRelationHtml = '<span class="text-blue-400 text-xs ml-2">🤝 结拜</span>';
    }

    // 4. 招募入队按钮（好感≥50）
    var recruitBtnHtml = '';
    if (affection >= 50) {
        recruitBtnHtml = `<button onclick="recruitNPCFromDialog('${npcId}')" class="bg-purple-700 hover:bg-purple-600 px-3 py-1.5 rounded text-xs text-white transition-colors">👥 招募入队</button>`;
    } else {
        recruitBtnHtml = `<span class="text-gray-600 text-xs">好感≥50可招募</span>`;
    }

    // 5. 好感度阶段提示
    var stageHint = '';
    var nextStage = '';
    if (affection < 20) { nextStage = '熟人(20)'; }
    else if (affection < 40) { nextStage = '朋友(40)'; }
    else if (affection < 60) { nextStage = '知己(60)'; }
    else if (affection < 80) { nextStage = '挚爱(80)'; }
    else { nextStage = '已满级'; }
    if (nextStage && nextStage !== '已满级') {
        stageHint = `<p class="text-xs text-gray-500 mt-0.5">下一阶段：${nextStage}</p>`;
    }

    // 7. 秘密预览
    var secretsHtml = '';
    if (typeof window.getSecretDisplayHtml === 'function') {
        secretsHtml = window.getSecretDisplayHtml(npc);
    }
    // 如果没有秘密显示，显示占位
    if (!secretsHtml) {
        secretsHtml = '<p class="text-xs text-gray-600">暂无已解锁的秘密</p>';
    }

    // 8. NPC目标
    var goalHtml = '';
    if (npc._goal) {
        var goalText = npc._goal.description || npc._goal.name || '未知目标';
        goalHtml = `<div class="text-xs text-gray-500">🎯 目标: ${goalText}</div>`;
    }

    // 9. P1-3: NPC关系网（重要关系）
    var relationsHtml = '';
    if (typeof window.getRelationsNetworkHTML === 'function') {
        relationsHtml = window.getRelationsNetworkHTML(npcId);
    }

    const html = `<div class="bg-gray-800 border-2 border-blue-500 rounded-xl p-6 max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <!-- 头部：头像 + 名称 + 关系标签 + 当前活动 -->
        <div class="flex items-center gap-4 mb-4">
            <div class="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-3xl">${npc.appearance?.icon || '👤'}</div>
            <div class="flex-1">
                <h3 class="text-xl font-bold text-white">${npc.name} ${quirkMod} ${specialRelationHtml}</h3>
                <p class="text-sm text-gray-400">${npc.occupation || '未知职业'} · ${npc.combat?.realm || '凡人'}${npc.combat?.layer || ''}层</p>
                <p class="text-xs text-blue-400">🏃 ${currentActivity} · 📍 ${location}</p>
                <p class="text-xs ${affectionColor}">${affectionLevel} (好感:${affection} 仇恨:${hatred})</p>
                ${relStatus ? `<p class="text-xs ${relStatus.color}">关系: ${relStatus.name}</p>` : ''}
            </div>
            <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>

        <!-- 好感度进度条 + 阶段提示 -->
        <div class="mb-3">
            <div class="flex justify-between text-xs text-gray-400 mb-1">
                <span>好感度</span>
                <span class="${affectionColor}">${affectionLevel} ${Math.max(0, affection)}/100</span>
            </div>
            <div class="w-full bg-gray-700 rounded h-3">
                <div class="h-3 rounded transition-all ${affection >= 0 ? 'bg-green-500' : 'bg-red-500'}" style="width: ${Math.abs(affection)}%"></div>
            </div>
            ${stageHint}
        </div>

        <!-- 对话区 -->
        <div class="bg-gray-900 p-3 rounded-lg mb-3 text-gray-300 text-sm">${greeting}</div>

        <!-- 深谈分类 -->
        <div class="flex gap-2 mb-3 flex-wrap">
            ${categoriesHtml}
        </div>

        <!-- 交互快捷栏（P1-6: 远程查看时隐藏互动按钮） -->
        ${isRemote ? (function(){
            var _homeLoc = npc.location || '';
            var _hasLine = false;
            try { for (var _k in (window.NPC_PERSONAL_EVENTS||{})) { if (window.NPC_PERSONAL_EVENTS[_k] && window.NPC_PERSONAL_EVENTS[_k].npcId === npcId) { _hasLine = true; break; } } } catch(e){}
            var _hint = _hasLine && _homeLoc ? '私人线需亲至「' + _homeLoc + '」方有进展。' : '部分功能不可用。';
            return '<div class="text-center text-xs text-gray-500 py-2">📡 远程查看（' + _hint + '）</div>';
        })() : `
        <div class="flex gap-2 mb-3 flex-wrap">
            ${recruitBtnHtml}
            <button onclick="comfortNPC('${npcId}')" class="bg-green-700/50 hover:bg-green-600/50 px-3 py-1.5 rounded text-xs text-green-300 transition-colors">🤗 安慰</button>
            <button onclick="encourageNPC('${npcId}')" class="bg-blue-700/50 hover:bg-blue-600/50 px-3 py-1.5 rounded text-xs text-blue-300 transition-colors">💪 鼓励</button>
            <button onclick="accompanyNPC('${npcId}')" class="bg-purple-700/50 hover:bg-purple-600/50 px-3 py-1.5 rounded text-xs text-purple-300 transition-colors">👫 陪伴</button>
        </div>
        `}

        <!-- P1-3: NPC关系网 -->
        ${relationsHtml}

        <!-- 情报/秘密 -->
        <div class="mb-3 bg-gray-700/30 rounded-lg p-3 border border-gray-600">
            <h4 class="text-sm font-bold text-gray-300 mb-2">📖 情报与秘密</h4>
            ${secretsHtml}
        </div>

        <!-- 情绪状态 -->
        <div class="mb-3 bg-gray-700/30 rounded-lg p-2 border border-gray-600/50">
            <div class="flex items-center justify-between mb-1">
                <span class="text-xs text-gray-400">情绪状态</span>
                <span class="text-xs ${(() => { try { return window.getEmotionState ? window.getEmotionState(mood).color : 'text-gray-400'; } catch(e) { return 'text-gray-400'; } })()}">
                    ${(() => { try { const e = window.getEmotionState ? window.getEmotionState(mood) : null; return e ? e.icon + ' ' + e.name : '😐 平静'; } catch(e) { return '😐 平静'; } })()}
                </span>
            </div>
            <div class="flex items-center gap-2 mb-1">
                <span class="text-xs text-gray-500">心情</span>
                <div class="flex-1 bg-gray-700 rounded h-1.5">
                    <div class="h-1.5 rounded bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all" style="width: ${mood}%"></div>
                </div>
                <span class="text-xs text-gray-400">${mood}</span>
            </div>
            <div class="flex items-center gap-2">
                <span class="text-xs text-gray-500">压力</span>
                <div class="flex-1 bg-gray-700 rounded h-1.5">
                    <div class="h-1.5 rounded ${stress > 60 ? 'bg-yellow-500' : stress > 80 ? 'bg-red-500' : 'bg-green-500'} transition-all" style="width: ${stress}%"></div>
                </div>
                <span class="text-xs text-gray-400">${stress}</span>
            </div>
        </div>

        <!-- 关系数据 -->
        <div class="grid grid-cols-2 gap-2 text-xs">
            <div><span class="text-gray-400">情分:</span><span class="text-yellow-400 ml-1">${favor}/${favorMax}</span></div>
            <div><span class="text-gray-400">敬畏:</span><span class="text-purple-400 ml-1">${respect}/100</span></div>
            <div></div>
            <div><span class="text-gray-400">仇恨:</span><span class="text-red-400 ml-1">${hatred}/100</span></div>
            <div class="col-span-2"><span class="text-gray-400">💡 喜好:</span> <span class="text-green-400 ml-1">${likesHtml}</span> <span class="text-gray-500 ml-2">讨厌:</span> <span class="text-red-400 ml-1">${dislikesHtml}</span></div>
            ${goalHtml}
        </div>

        <!-- 故事线 -->
        ${window.NPC_STORYLINES && npcId ? `
            <div class="mt-3">
                ${checkNPCStorylines(npcId) ?
                    `<button onclick="showStorylineDialogue('${npcId}')" class="w-full bg-purple-700 hover:bg-purple-600 px-3 py-2 rounded text-sm text-white transition-colors flex items-center gap-2">
                        <span>📖</span>
                        <span>触发故事线</span>
                    </button>` : ''
                }
            </div>
        ` : ''}

        <!-- 职业交互 -->
        ${occHtml ? `<div class="mt-3">${occHtml}</div>` : ''}

        <!-- 个人事件 -->
        ${typeof window.getPersonalEventButtons === 'function' ? window.getPersonalEventButtons(npc, npcId) : ''}

        <!-- v20.5 介入恩怨：居中调停 / 添油加醋 / 澄清辟谣（远程给需亲至锁定） -->
        ${typeof window.getInterventionButtons === 'function' ? window.getInterventionButtons(npc, npcId, isRemote) : ''}

        <!-- v20.6 他们耳朵里你的风声：玩家传闻印象（无风声则整块不显） -->
        ${typeof window.getPlayerRumorSection === 'function' ? window.getPlayerRumorSection(npc, npcId) : ''}
    </div>`;
    modal.innerHTML = html;
    document.body.appendChild(modal);
}

// 从面板招募NPC入队
function recruitNPCFromDialog(npcId) {
    if (typeof window.partySystem?.recruitNPC === 'function') {
        window.partySystem.recruitNPC(npcId);
    } else {
        showMessage('队伍系统未就绪', 'warning');
    }
}

// 从面板打开赠礼界面
function showGiftUI(npcId) {
    if (typeof window.showGiftDialog === 'function') {
        window.showGiftDialog(npcId);
    } else if (typeof window.giveGiftToNPC === 'function') {
        window.giveGiftToNPC(npcId);
    } else {
        showMessage('赠礼功能未实现', 'warning');
    }
}

// 子选项对话面板
// 深谈2.0：增加秘密对话选项显示
function showSubCategoryDialog(npcId, categoryId) {
    const npc = window.npcManager?.getNPC(npcId);
    if (!npc) { showMessage('NPC不存在', 'error'); return; }
    const oldModal = document.querySelector('.npc-dialog-modal');
    if (oldModal) oldModal.remove();
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50 npc-dialog-modal';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    const affection = npc.relationship?.affection || 0;
    let cat = null;
    for (const key in DEEP_TALK_CATEGORIES) { if (DEEP_TALK_CATEGORIES[key].id === categoryId) { cat = DEEP_TALK_CATEGORIES[key]; break; } }
    if (!cat) { showMessage('分类不存在', 'error'); return; }
    // 生成普通子选项HTML
    // v14.6：关系不足=可点击但有代价——样式保持可点观感，仅以小型琥珀警示标注预计好感损失
    var subsHtml = '';
    for (var si = 0; si < cat.subOptions.length; si++) {
        var s = cat.subOptions[si];
        var insufficient = affection < s.minAffection;
        var warnHtml = insufficient ? ' <span class="text-[10px] text-amber-400" title="好感不足，强行交谈将损失好感">⚠-' + (s.minAffection ? -Math.floor(s.minAffection / 10) : 2) + '</span>' : '';
        subsHtml += '<button onclick="executeDeepTalkSubOption(\'' + npcId + '\', \'' + categoryId + '\', \'' + s.id + '\')" class="flex items-center gap-2 ' + (insufficient ? 'bg-gray-700 hover:bg-gray-600 border-l-2 border-amber-500/70' : 'bg-gray-700 hover:bg-gray-600') + ' px-3 py-2 rounded text-sm text-white w-full transition-colors">' +
            '<span class="text-gray-300">' + s.name + '</span>' +
            '<span class="text-xs ml-auto ' + (insufficient ? 'text-amber-300/80' : 'text-gray-400') + '">' + s.desc + (s.affectionCost > 0 ? ' (情分-' + s.affectionCost + ')' : '') + warnHtml + '</span>' +
        '</button>';
    }

    var html = '<div class="bg-gray-800 border-2 border-blue-500 rounded-xl p-6 max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto">' +
        '<div class="flex items-center gap-3 mb-4">' +
            '<button onclick="this.closest(\'.fixed\').remove(); showNPCDialog(\'' + npcId + '\')" class="text-gray-400 hover:text-white text-lg">&larr;</button>' +
            '<h3 class="text-lg font-bold text-white">' + cat.icon + ' ' + cat.name + '</h3>' +
            '<p class="text-xs text-gray-400 ml-auto">' + cat.description + '</p>' +
            '<button onclick="this.closest(\'.fixed\').remove()" class="text-gray-400 hover:text-white text-2xl">&times;</button>' +
        '</div>' +
        '<div class="space-y-1.5">' + subsHtml + '</div>' +
    '</div>';
    modal.innerHTML = html;
    document.body.appendChild(modal);
}

// ==================== 深谈2.0：分支选择对话 ====================
// 显示分支对话树的一个节点，带2-3个选项供玩家选择
function showBranchDialog(npcId, categoryId, subOptionId, branchKey) {
    var npc = window.npcManager?.getNPC(npcId);
    if (!npc) { showMessage('NPC不存在', 'error'); return; }
    var tree = DEEP_TALK_BRANCHES[branchKey];
    if (!tree) { showMessage('分支对话不存在', 'error'); return; }

    // 从npc的内存中获取当前分支位置
    if (!npc.memory._branchState) npc.memory._branchState = {};
    if (!npc.memory._branchState[branchKey]) npc.memory._branchState[branchKey] = { currentNode: 'intro', history: [] };

    var state = npc.memory._branchState[branchKey];
    var currentNode = state.currentNode || 'intro';
    var node = tree[currentNode];
    if (!node) { showMessage('对话节点不存在', 'error'); return; }

    // v18.1 分支树接互动计时：促膝一场，一刻钟（与话题深谈同源语义）
    try { if (window.timeSystem && window.timeSystem.advanceTime) window.timeSystem.advanceTime(15, '促膝深谈'); } catch (eBT) {}

    // 检查是否为结束节点
    if (node.isEnd) {
        // 对话结束，返回子选项列表
        state.currentNode = 'intro';
        showSubCategoryDialog(npcId, categoryId);
        return;
    }

    // 获取节点文本
    var nodeText = '';
    if (typeof node.text === 'function') {
        nodeText = node.text(npc);
    } else {
        nodeText = node.text || '……';
    }
    // 替换占位符
    var playerName = window.currentCharData?.name || '你';
    nodeText = nodeText.replace(/{playerName}/g, playerName);

    // 生成选项按钮
    var choices = node.choices || [];
    var choicesHtml = '';
    for (var ci = 0; ci < choices.length; ci++) {
        var choice = choices[ci];
        var effectHint = '';
        if (choice.effect) {
            var hints = [];
            if (choice.effect.affection > 0) hints.push('💕+' + choice.effect.affection);
            else if (choice.effect.affection < 0) hints.push('💕' + choice.effect.affection);
            if (choice.effect.trust > 0) hints.push('🤝+' + choice.effect.trust);
            if (choice.effect.respect > 0) hints.push('👑+' + choice.effect.respect);
            if (choice.effect.unlockSecret) hints.push('🔐解锁秘密');
            if (hints.length > 0) effectHint = ' <span class="text-xs text-gray-500">(' + hints.join(' ') + ')</span>';
        }
        choicesHtml += '<button onclick="handleBranchChoice(\'' + npcId + '\', \'' + categoryId + '\', \'' + subOptionId + '\', \'' + branchKey + '\', ' + ci + ')" class="w-full bg-gray-700 hover:bg-gray-600 text-left px-4 py-3 rounded text-sm text-white transition-colors">' +
            choice.text + effectHint +
        '</button>';
    }

    // 查找或创建对话框
    var modal = document.querySelector('.npc-dialog-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50 npc-dialog-modal';
        document.body.appendChild(modal);
    }

    modal.innerHTML = '<div class="bg-gray-800 border-2 border-purple-500 rounded-xl p-6 max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto">' +
        '<div class="flex items-center gap-3 mb-4">' +
            '<button onclick="this.closest(\'.fixed\').remove(); showSubCategoryDialog(\'' + npcId + '\', \'' + categoryId + '\')" class="text-gray-400 hover:text-white text-lg">&larr;</button>' +
            '<h3 class="text-lg font-bold text-purple-300">💬 深谈</h3>' +
            '<button onclick="this.closest(\'.fixed\').remove()" class="text-gray-400 hover:text-white text-2xl ml-auto">&times;</button>' +
        '</div>' +
        '<div class="bg-gray-900 p-4 rounded-lg mb-4">' +
            '<div class="flex items-start gap-2">' +
                '<span class="text-green-400 font-bold text-sm shrink-0">' + npc.name + ':</span>' +
                '<span class="text-gray-200 text-sm">' + nodeText + '</span>' +
            '</div>' +
        '</div>' +
        '<div class="space-y-2">' + choicesHtml + '</div>' +
    '</div>';
    modal.style.display = 'flex';
}

// 处理分支对话中的选择
function handleBranchChoice(npcId, categoryId, subOptionId, branchKey, choiceIndex) {
    var npc = window.npcManager?.getNPC(npcId);
    if (!npc) { showMessage('NPC不存在', 'error'); return; }
    var tree = DEEP_TALK_BRANCHES[branchKey];
    if (!tree) { showMessage('分支对话不存在', 'error'); return; }

    if (!npc.memory._branchState) npc.memory._branchState = {};
    if (!npc.memory._branchState[branchKey]) npc.memory._branchState[branchKey] = { currentNode: 'intro', history: [] };
    var state = npc.memory._branchState[branchKey];
    var currentNode = state.currentNode || 'intro';
    var node = tree[currentNode];
    if (!node || !node.choices || !node.choices[choiceIndex]) { showMessage('无效选择', 'error'); return; }

    var choice = node.choices[choiceIndex];
    var effect = choice.effect || {};

    // 1. 应用效果
    if (effect.affection) npc.changeAffection(effect.affection);
    if (effect.trust) npc.changeTrust(effect.trust);
    if (effect.respect) npc.changeRespect(effect.respect);
    // 情绪提升
    if (effect.moodBoost && npc.state) {
        npc.state.mood = Math.min(100, (npc.state.mood || 50) + effect.moodBoost);
    }

    // 2. 记录选择后果
    recordChoiceConsequence(npc, branchKey, currentNode, choiceIndex, effect);

    // 3. 秘密解锁
    if (effect.unlockSecret && typeof npc.unlockSecret === 'function') {
        var unlockResult = npc.unlockSecret(effect.unlockSecret);
        if (unlockResult && unlockResult.success) {
            if (window.showMessage) {
                window.showMessage('🔐 解锁了新秘密！', 'success');
            }
        }
    }

    // 4. 更新记忆印象
    npc.recordPlayerAction('deep_talk_branch_' + currentNode, effect.affection > 0 ? 'positive' : 'neutral');

    // 5. 推进到下一个节点
    var nextNode = choice.next || 'end';
    state.currentNode = nextNode;
    state.history.push({ node: currentNode, choice: choiceIndex, nextNode: nextNode });

    // 6. 显示下一个节点
    showBranchDialog(npcId, categoryId, subOptionId, branchKey);
}

// ==================== 深谈2.0：秘密对话选项执行 ====================
// 当玩家选择"提及秘密"时触发
function executeSecretDialogueOption(npcId, categoryId, subOptionId) {
    var npc = window.npcManager?.getNPC(npcId);
    if (!npc) { showMessage('NPC不存在', 'error'); return; }

    // 从subOptionId解析出原始秘密对话选项ID
    var secretOptionId = subOptionId.replace('mention_secret_', '');

    // 查找这个秘密对话选项对应的秘密
    var secretTitle = '';
    var secretContent = '';
    if (npc.secrets) {
        for (var secretId in npc.secrets) {
            var sec = npc.secrets[secretId];
            if (sec.unlocked && sec.effects && sec.effects.unlockDialogueOptions) {
                for (var di = 0; di < sec.effects.unlockDialogueOptions.length; di++) {
                    if (sec.effects.unlockDialogueOptions[di] === secretOptionId) {
                        secretTitle = sec.title || '秘密';
                        secretContent = sec.content || '（秘密内容）';
                        break;
                    }
                }
            }
            if (secretTitle) break;
        }
    }

    var playerName = window.currentCharData?.name || '你';
    var playerRealm = window.currentCharData?.realm || '炼气';

    // 根据秘密类型生成不同回应
    var npcReaction = '';
    var affChange = 0;
    var trustChange = 0;

    // 好感度影响
    var aff = npc.relationship?.affection || 0;
    if (aff > 60) {
        npcReaction = npc.name + ' 微微一怔，眼中闪过一丝复杂：「你……你竟然知道这件事。既然你知道了，那我也不瞒你了。」' +
            '\n\n' + secretContent;
        affChange = 5;
        trustChange = 5;
    } else if (aff > 30) {
        npcReaction = npc.name + ' 脸色微变，压低声音：「你从哪里听说的？……这件事不要到处说。」' +
            '\n\n' + secretContent;
        affChange = 2;
        trustChange = 3;
    } else {
        npcReaction = npc.name + ' 神色大变，后退一步：「你……你怎么会知道？！这件事不许再提！」' +
            '\n\n（好感度不足，提及秘密反而引起反感）';
        affChange = -5;
        trustChange = -3;
    }

    // 应用效果
    if (affChange !== 0) npc.changeAffection(affChange);
    if (trustChange !== 0) npc.changeTrust(trustChange);

    // 记录
    npc.recordPlayerAction('secret_mention_' + secretOptionId, affChange > 0 ? 'positive' : 'negative');

    // 显示对话
    var modal = document.querySelector('.npc-dialog-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50 npc-dialog-modal';
        document.body.appendChild(modal);
    }

    modal.innerHTML = '<div class="bg-gray-800 border-2 border-purple-500 rounded-xl p-6 max-w-xl w-full mx-4">' +
        '<div class="flex items-center gap-3 mb-4">' +
            '<button onclick="this.closest(\'.fixed\').remove(); showSubCategoryDialog(\'' + npcId + '\', \'' + categoryId + '\')" class="text-gray-400 hover:text-white text-lg">&larr;</button>' +
            '<h3 class="text-lg font-bold text-purple-300">🔐 秘密对话</h3>' +
            '<button onclick="this.closest(\'.fixed\').remove()" class="text-gray-400 hover:text-white text-2xl ml-auto">&times;</button>' +
        '</div>' +
        '<div class="bg-gray-900 p-4 rounded-lg mb-4 space-y-3">' +
            '<div class="flex items-start gap-2">' +
                '<span class="text-blue-400 font-bold text-sm shrink-0">' + playerName + ':</span>' +
                '<span class="text-gray-300 text-sm">「关于' + secretTitle + '……」</span>' +
            '</div>' +
            '<div class="flex items-start gap-2">' +
                '<span class="text-green-400 font-bold text-sm shrink-0">' + npc.name + ':</span>' +
                '<span class="text-gray-200 text-sm">' + npcReaction + '</span>' +
            '</div>' +
        '</div>' +
        '<div class="text-xs text-gray-500 text-center">' +
            (affChange > 0 ? '好感度+' + affChange + ' 信任+' + trustChange : '好感度' + affChange + ' 信任' + trustChange) +
        '</div>' +
        '<button onclick="this.closest(\'.fixed\').remove(); showSubCategoryDialog(\'' + npcId + '\', \'' + categoryId + '\')" class="w-full bg-purple-700 hover:bg-purple-600 px-3 py-2 rounded text-sm text-white mt-3">继续交谈</button>' +
    '</div>';
}

// ==================== 深谈2.0：选择后果记录 ====================
// 记录玩家在深谈中的关键选择，影响后续可用对话选项
function recordChoiceConsequence(npc, branchKey, nodeId, choiceIndex, effect) {
    if (!npc || !branchKey) return;

    // 初始化记录
    if (!npc.memory._choiceHistory) npc.memory._choiceHistory = {};
    if (!npc.memory._choiceHistory[branchKey]) npc.memory._choiceHistory[branchKey] = [];

    // 记录这次选择
    npc.memory._choiceHistory[branchKey].push({
        nodeId: nodeId,
        choiceIndex: choiceIndex,
        effect: effect ? JSON.parse(JSON.stringify(effect)) : {},
        timestamp: Date.now()
    });

    // 只保留最近20条
    if (npc.memory._choiceHistory[branchKey].length > 20) {
        npc.memory._choiceHistory[branchKey] = npc.memory._choiceHistory[branchKey].slice(-20);
    }

    // 在记忆印象中标记此选择（用于秘密条件检查）
    if (effect && effect.unlockSecret) {
        npc.memory.impressions['deep_talk_' + branchKey] = (npc.memory.impressions['deep_talk_' + branchKey] || 0) + 1;
    }

    // 检查是否解锁了新的对话内容
    if (npc.memory._choiceHistory[branchKey].length >= 3) {
        // 连续选择3次以上，可能解锁深度对话
        npc.memory.impressions['deep_talk_loyal_' + branchKey] = true;
    }
}

// ==================== 执行职业交互 ====================
function executeOccupationAction(npcId) {
    const npc = window.npcManager?.getNPC(npcId);
    if (!npc) { showMessage('NPC不存在', 'error'); return; }
    const occAction = OCCUPATION_SPECIFIC_ACTIONS[npc.occupation];
    if (!occAction || !occAction.action) { showMessage('该NPC没有可执行的交互', 'warning'); return; }
    const result = occAction.action(npc, window.currentCharData || {});
    if (result) {
        if (!result.suppressMessage) {
            showMessage(result.msg, result.success ? 'success' : 'warning');
        }
        if (result.success) {
            npc.recordPlayerAction('occupation_interact', 'positive');
            if (npc.relationship) {
                npc.relationship.affection = clamp(npc.relationship.affection + 1, -100, 100);
            }
        }
    }
}

// ==================== v10.0 NPC目标与需求系统 ====================
// NPC每阶段拥有1个主要目标，玩家可帮助/阻碍/利用/无视
var NPC_GOAL_TYPES = {
    breakthrough: { name: '突破境界', icon: '⬆️', desc: '努力修炼突破当前境界' },
    find_material: { name: '寻找材料', icon: '🔍', desc: '寻找稀有材料' },
    revenge: { name: '复仇', icon: '⚔️', desc: '向仇人复仇' },
    heal_kin: { name: '救治亲友', icon: '🏥', desc: '寻找救治亲友的方法' },
    compete_position: { name: '争夺职位', icon: '👑', desc: '争夺门派职位' },
    repay_debt: { name: '偿还债务', icon: '💰', desc: '偿还欠下的债务' },
    find_master: { name: '寻找师父/弟子', icon: '📖', desc: '寻找合适的师父或弟子' },
    guard_sect: { name: '守护门派', icon: '🏛️', desc: '守护门派安危' },
    gather_herbs: { name: '采集灵药', icon: '🌿', desc: '采集大量灵药' },
    craft_treasure: { name: '炼制法宝', icon: '🔨', desc: '收集材料炼制法宝' }
};

function assignNPCGoal(npc) {
    if (!npc) return null;
    // 从已有目标或随机分配
    var bg = npc.background || {};
    var existingGoal = npc._goal;
    // 已有目标且未完成，保留
    if (existingGoal && !existingGoal.completed) return existingGoal;
    
    var goalTypes = Object.keys(NPC_GOAL_TYPES);
    // 根据NPC职业/背景调整权重
    var weights = {};
    goalTypes.forEach(function(g) { weights[g] = 1; });
    if (npc.occupation === '导师' || npc.occupation === '长老') {
        weights.find_master = 3; weights.guard_sect = 3;
    }
    if (npc.occupation === '治疗师' || npc.occupation === '炼丹师') {
        weights.heal_kin = 3; weights.gather_herbs = 3;
    }
    if (npc.occupation === '战士' || npc.occupation === '竞争对手') {
        weights.revenge = 3; weights.breakthrough = 3;
    }
    if (npc.occupation === '商人') {
        weights.repay_debt = 3; weights.craft_treasure = 2;
    }
    if (bg.goal && bg.goal.indexOf('突破') >= 0) weights.breakthrough = 4;
    if (bg.goal && bg.goal.indexOf('复仇') >= 0) weights.revenge = 4;
    
    var totalW = 0;
    goalTypes.forEach(function(g) { totalW += weights[g] || 1; });
    var roll = Math.random() * totalW;
    var acc = 0;
    var chosen = 'breakthrough';
    for (var i = 0; i < goalTypes.length; i++) {
        acc += weights[goalTypes[i]] || 1;
        if (roll < acc) { chosen = goalTypes[i]; break; }
    }
    
    var goalDef = NPC_GOAL_TYPES[chosen];
    npc._goal = {
        type: chosen,
        name: goalDef.name,
        icon: goalDef.icon,
        desc: goalDef.desc,
        progress: 0,
        maxProgress: 3 + Math.floor(Math.random() * 5),
        completed: false,
        startedDay: (typeof window.getAbsoluteDay === 'function') ? window.getAbsoluteDay() : 0,
        playerHelp: 0,      // 玩家帮助次数
        playerHinder: 0,    // 玩家阻碍次数
        playerIgnored: 0    // 玩家无视次数
    };
    npc.recordPlayerAction('goal_assigned', 'neutral');
    return npc._goal;
}

function updateNPCGoalProgress(npc, amount) {
    if (!npc || !npc._goal || npc._goal.completed) return;
    npc._goal.progress = Math.min(npc._goal.maxProgress, (npc._goal.progress || 0) + amount);
    if (npc._goal.progress >= npc._goal.maxProgress) {
        npc._goal.completed = true;
        npc.changeAffection(5);
        npc.recordPlayerAction('goal_completed', 'positive');
        if (window.showMessage) {
            window.showMessage('🎯 ' + npc.name + ' 完成了目标：' + npc._goal.name, 'success');
        }
    }
}

function getNPCGoalStatus(npc) {
    if (!npc || !npc._goal) return null;
    var g = npc._goal;
    var pct = g.maxProgress > 0 ? Math.floor((g.progress / g.maxProgress) * 100) : 0;
    return {
        type: g.type, name: g.name, icon: g.icon, desc: g.desc,
        progress: g.progress, maxProgress: g.maxProgress,
        pct: pct, completed: g.completed,
        playerHelp: g.playerHelp, playerHinder: g.playerHinder
    };
}

// ==================== v10.0 NPC记忆深化系统 ====================
// 记忆分类：亲历事件/听闻事件/重大承诺/恩情/侮辱/伤害/共同战斗/任务结果
var MEMORY_CATEGORIES = {
    experienced: '亲历事件',
    heard: '听闻事件',
    promise: '重大承诺',
    favor: '恩情',
    insult: '侮辱',
    harm: '伤害',
    battle: '共同战斗',
    quest_result: '任务结果'
};

function recordNPCMemory(npc, category, event, importance) {
    if (!npc || !npc.memory) return;
    importance = importance || 1;
    if (!npc.memory._events) npc.memory._events = [];
    npc.memory._events.push({
        category: category,
        event: event,
        importance: importance,
        day: (typeof window.getAbsoluteDay === 'function') ? window.getAbsoluteDay() : 0,
        timestamp: Date.now()
    });
    // 只保留最近20条
    if (npc.memory._events.length > 20) {
        npc.memory._events = npc.memory._events.slice(-20);
    }
}

function getNPCImportantMemories(npc, minImportance) {
    minImportance = minImportance || 2;
    if (!npc || !npc.memory || !npc.memory._events) return [];
    return npc.memory._events.filter(function(e) { return e.importance >= minImportance; })
        .sort(function(a, b) { return b.importance - a.importance; });
}

// ==================== v10.0 请求与交换系统 ====================
// 高关系解锁：借物/求医/求助突破/传授功法/介绍他人/请求庇护/同行/调解关系
var ADVANCED_REQUEST_TYPES = {
    borrow_item: { name: '借物', icon: '📦', minAffection: 40, minFavor: 10, desc: '向NPC借用物品' },
    request_heal: { name: '求医', icon: '🏥', minAffection: 30, minFavor: 5, desc: '请求NPC治疗' },
    breakthrough_help: { name: '求助突破', icon: '⬆️', minAffection: 50, minFavor: 20, desc: '请求NPC帮助突破' },
    teach_skill: { name: '传授功法', icon: '📖', minAffection: 60, minFavor: 30, desc: '请求传授功法' },
    introduce: { name: '介绍他人', icon: '🤝', minAffection: 40, minFavor: 15, desc: '请NPC介绍认识其他人' },
    request_asylum: { name: '请求庇护', icon: '🛡️', minAffection: 70, minFavor: 40, desc: '请求NPC庇护' },
    accompany: { name: '同行', icon: '🚶', minAffection: 50, minFavor: 20, desc: '请求NPC同行动' },
    mediate: { name: '调解关系', icon: '☮️', minAffection: 60, minFavor: 25, desc: '请NPC帮忙调解关系' },
    // P1-3: 补充guidance定义，供request_guidance调用
    guidance: { name: '请求指点', icon: '🧘', minAffection: 20, minFavor: 5, desc: '修炼方向建议' }
};

function getAvailableAdvancedRequests(npc) {
    if (!npc) return [];
    var aff = npc.relationship?.affection || 0;
    var favor = npc.relationship?.favor || 0;
    var available = [];
    for (var key in ADVANCED_REQUEST_TYPES) {
        var req = ADVANCED_REQUEST_TYPES[key];
        if (aff >= req.minAffection && favor >= req.minFavor) {
            available.push({ id: key, name: req.name, icon: req.icon, desc: req.desc, minAffection: req.minAffection, minFavor: req.minFavor });
        }
    }
    return available;
}

function executeAdvancedRequest(npc, requestId) {
    if (!npc) return { success: false, msg: 'NPC不存在' };
    var req = ADVANCED_REQUEST_TYPES[requestId];
    if (!req) return { success: false, msg: '请求类型不存在' };
    var aff = npc.relationship?.affection || 0;
    var favor = npc.relationship?.favor || 0;
    if (aff < req.minAffection) return { success: false, msg: '好感度不足（需要' + req.minAffection + '）' };
    if (favor < req.minFavor) return { success: false, msg: '情分不足（需要' + req.minFavor + '）' };

    // v15.6 登门相求亦耗时辰（开口求人，无论成否）
    try { if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') window.timeSystem.advanceTime(15, '登门相求'); } catch (e) {}

    var cd = (typeof window.getCurrentCharData === 'function') ? window.getCurrentCharData() : window.currentCharData;
    var result = null;
    switch (requestId) {
        case 'borrow_item':
            if (!window.NPCBorrowService || typeof window.NPCBorrowService.borrowFromNPC !== 'function') {
                return { success: false, msg: '借物契约系统未就绪' };
            }
            return window.NPCBorrowService.borrowFromNPC(npc);
        case 'request_heal':
            // P2-2: 同时处理22部位伤口/流血/疼痛
            var healedWounds = 0;
            if (cd) {
                cd.health = cd.maxHealth || 100;
                cd.qi = cd.maxQi || 100;
                if (typeof window.hemostaticTreatment === 'function') {
                    try { window.hemostaticTreatment({ physiology: cd.physiology || cd }); healedWounds++; } catch(e) {}
                }
                if (cd.wounds && Array.isArray(cd.wounds)) {
                    cd.wounds.forEach(function(w) { if (w) { w.bleeding = false; w.externalBleedRate = 0; w.internalBleedRate = 0; w.stabilization = 100; w.stabilized = true; } });
                    healedWounds += cd.wounds.length;
                    cd.wounds = [];
                }
                if (cd.parts && typeof cd.parts === 'object') {
                    Object.keys(cd.parts).forEach(function(pid) {
                        var p = cd.parts[pid];
                        if (p) { p.structuralDamage = 0; p.nerveDamage = 0; p.fracture = false; p.woundIds = []; }
                    });
                }
                if (typeof window.updateCharacterStatus === 'function') window.updateCharacterStatus();
            }
            return { success: true, msg: npc.name + ' 为你疗伤，恢复了生命/真气并愈合了' + healedWounds + '处伤口！' };
        case 'breakthrough_help':
            if (cd) {
                cd.tempering = (cd.tempering || 0) + 50;
                if (typeof window.updateCharacterStatus === 'function') window.updateCharacterStatus();
            }
            return { success: true, msg: npc.name + ' 助你修炼，获得50点修炼经验！' };
        case 'teach_skill':
            // v12.1：只允许传授 skillPages 中真实存在的功法；无可教功法时改为修炼指点。
            if (cd) cd.tempering = (cd.tempering || 0) + 60;
            var taughtSkill = null;
            var taughtDef = null;
            var candidates = [];
            if (npc.skills && Array.isArray(npc.skills)) candidates = candidates.concat(npc.skills);
            if (npc.combat && Array.isArray(npc.combat.skills)) candidates = candidates.concat(npc.combat.skills);
            candidates = candidates.filter(function(v, i, arr) { return v && arr.indexOf(v) === i; });
            if (window.KnowledgeSystem) {
                for (var tsi = 0; tsi < candidates.length; tsi++) {
                    var c = candidates[tsi];
                    var rawId = typeof c === 'string' ? c : (c.id || c.skillId || c.name);
                    var rawName = typeof c === 'object' ? c.name : null;
                    var resolved = window.KnowledgeSystem.resolveSkillId(rawId, rawName);
                    if (resolved && window.KnowledgeSystem.hasDefinition && window.KnowledgeSystem.hasDefinition(resolved)) {
                        taughtSkill = resolved;
                        taughtDef = typeof window.findSkillById === 'function' ? window.findSkillById(resolved) : null;
                        break;
                    }
                }
            }
            if (taughtSkill && typeof window.KnowledgeSystem?.unlock === 'function') {
                window.KnowledgeSystem.unlock(taughtSkill, 'learned', { source: 'npc_teaching', completeness: 100 });
                return { success: true, msg: npc.name + ' 传授了你「' + ((taughtDef && taughtDef.name) || taughtSkill) + '」！' };
            }
            return { success: true, msg: npc.name + ' 暂无适合传授的完整功法，转而指点你的修炼关窍。修炼经验+60。' };
        case 'introduce':
            // P2-5: 优先从NPC关系网（同门/朋友/师徒/仇敌）选择被介绍者
            var allNpcs = window.npcManager.getAllNPCs();
            var introduced = null;
            // 1) 朋友/同门/师徒关系
            if (npc.npcRelationships) {
                var related = Object.keys(npc.npcRelationships)
                    .map(function(k) { return { id: k, rel: npc.npcRelationships[k] }; })
                    .filter(function(r) {
                        var rel = (r.rel && (r.rel.relation || r.rel)) || '';
                        return /friend|同门|master|sworn/i.test(String(rel)) || ['friend','master','sworn_siblings','sect_mate'].indexOf(rel) >= 0;
                    });
                if (related.length > 0) {
                    var pickRel = related[Math.floor(Math.random() * related.length)];
                    introduced = allNpcs.find(function(n) { return n.id === pickRel.id; });
                }
            }
            // 2) 同门派关系
            if (!introduced && npc.sect) {
                var sectMates = allNpcs.filter(function(n) { return n.id !== npc.id && n.sect === npc.sect && !n.introducedBy; });
                if (sectMates.length > 0) introduced = sectMates[Math.floor(Math.random() * sectMates.length)];
            }
            // 3) 亲友（npcRelationships 唯一真源）
            if (!introduced && npc.npcRelationships) {
                var bondIds = Object.keys(npc.npcRelationships).filter(function (id) { return id && npc.npcRelationships[id]; });
                if (bondIds.length > 0) {
                    var pickBond = bondIds[Math.floor(Math.random() * bondIds.length)];
                    introduced = allNpcs.find(function(n) { return n.id === pickBond; });
                }
            }
            // 4) 兜底：从未介绍过的NPC中随机
            if (!introduced) {
                var availableNpcs = allNpcs.filter(function(n) { return n.id !== npc.id && !n.introducedBy; });
                if (availableNpcs.length > 0) introduced = availableNpcs[Math.floor(Math.random() * availableNpcs.length)];
            }

            if (introduced) {
                introduced.introducedBy = npc.id;
                introduced.firstImpression = '通过' + npc.name + '认识，印象良好';
                npc.changeAffection(5);
                if (introduced.relationship) {
                    introduced.relationship.affection = Math.min(100, (introduced.relationship.affection || 0) + 5);
                }
                npc.recordPlayerAction('introduce', 'positive');
                return {
                    success: true,
                    msg: npc.name + ' 为你推荐了' + introduced.name + '，你们已经互相认识！',
                    data: { introducedTo: introduced.id }
                };
            } else {
                return { success: true, msg: npc.name + ' 暂时没有合适的人可以介绍给你' };
            }
        case 'request_asylum':
            // 庇护属于持久世界状态，统一交给游戏时间服务管理；不再混入 Date.now。
            if (!window.PlayerProtectionService) {
                return { success: false, msg: '庇护系统尚未就绪' };
            }
            var protectionState = window.PlayerProtectionService.grant(npc);
            if (!protectionState) return { success: false, msg: '庇护建立失败' };
            if (typeof npc.recordPlayerAction === 'function') npc.recordPlayerAction('provided_asylum', 'positive');
            if (npc.reputation) npc.reputation.local = (npc.reputation.local || 0) + 2;
            npc.changeAffection(3);
            return {
                success: true,
                msg: npc.name + '答应庇护你三天。这段时间被敌对势力追踪的概率降低一半。',
                data: { protectionState: protectionState }
            };
        case 'accompany':
            // 同行：将NPC加入队伍
            if (window.partySystem && typeof window.partySystem.recruitNPC === 'function') {
                var res = window.partySystem.recruitNPC(npc.id);
                if (res) {
                    npc.recordPlayerAction('accompany', 'positive');
                    if (npc.changeFavor) npc.changeFavor(-req.minFavor);
                    return {
                        success: true,
                        msg: npc.name + ' 已加入队伍！',
                        data: { member: npc }
                    };
                }
                return { success: false, msg: '招募失败，队伍可能已满' };
            } else {
                // 降级方案：如果party系统未就绪，记录同行意向
                npc.relationship.accompanying = true;
                npc.recordPlayerAction('accompany', 'positive');
                return { success: true, msg: npc.name + ' 同意与你同行，稍后确认加入队伍' };
            }
        case 'mediate':
            // v12.1：调解的是 NPC A↔NPC B 的关系，不再误改两人各自对玩家的好感。
            var medTarget = arguments.length > 2 ? arguments[2] : null;
            if (!medTarget) return { success: false, msg: '请先选择要调解的第二个NPC', needChoose: true };
            var targetNpcMed = (window.npcManager && typeof window.npcManager.getNPC === 'function') ? window.npcManager.getNPC(medTarget) : null;
            if (!targetNpcMed || targetNpcMed.id === npc.id) return { success: false, msg: '目标NPC不存在或不能调解自己' };
            var beforeRel = (npc.npcRelationships && npc.npcRelationships[targetNpcMed.id]) || null;
            var relationResult = adjustNPCRelationshipPair(npc, targetNpcMed, 15, { defaultRelation: 'neutral' });
            npc.recordPlayerAction('mediate', 'positive');
            targetNpcMed.recordPlayerAction ? targetNpcMed.recordPlayerAction('mediated', 'positive') : null;
            return {
                success: true,
                msg: '你成功缓和了' + npc.name + '与' + targetNpcMed.name + '的关系（' + (beforeRel ? normalizeNPCRelationType(beforeRel.relation) : 'neutral') + ' → ' + relationResult.relation + '，强度' + relationResult.strength + '）。',
                data: { mediated: [npc.id, targetNpcMed.id], relationship: relationResult }
            };
        default:
            return { success: true, msg: '请求已执行' };
    }
}

// ==================== 导出 ====================
if (typeof window !== 'undefined') {
    window.NPC = NPC;
    window.NPCManager = NPCManager;
    window.DialogueSystem = DialogueSystem;
    window.AffectionSystem = AffectionSystem;
    window.initNPCSystem = initNPCSystem;
    window.addSampleNPCs = addSampleNPCs;
    window.setNPCRelationshipPair = setNPCRelationshipPair;
    window.adjustNPCRelationshipPair = adjustNPCRelationshipPair;
    window.migrateLegacyRelationships = migrateLegacyRelationships;
    window.generateNPCRelations = generateNPCRelations;
    // 新游戏重置NPC系统
    window.resetNPCSystem = function() {
        if (window.npcManager) {
            window.npcManager.npcs = new Map();
            window.npcManager.activeNPCs = [];
        }
        window.npcManager = new NPCManager();
        window.dialogueSystem = new DialogueSystem();
        window.affectionSystem = new AffectionSystem();
        window.npcQuestSystem = new NPCQuestSystem();
        window.npcQuestSystem.registerDefaultQuests();
        window.npcEventSystem = new NPCEventSystem();
        window.npcRequestSystem = new NPCRequestSystem();
        window.npcRequestSystem.registerDefaultRequests();
        addSampleNPCs();
        // 注册所有门派的掌门/长老/弟子NPC，确保门派内院面板「👥 门派弟子」列表不为空
        if (typeof window.registerAllSectNPCs === 'function') {
            window.registerAllSectNPCs();
        }
        var allNPCs = window.npcManager.getAllNPCs();
        if (allNPCs.length >= 2) generateNPCRelations(allNPCs);
    };
    window.getNPCRelationship = getNPCRelationship;
    window.getNPCRelationshipNetwork = getNPCRelationshipNetwork;
    window.getNPCImportantRelations = getNPCImportantRelations;
    window.getRelationsNetworkHTML = getRelationsNetworkHTML;
    window.propagateHelpToRelations = propagateHelpToRelations;
    window.propagateHarmToRelations = propagateHarmToRelations;
    window.showNPCDialog = showNPCDialog;
    window.showSubCategoryDialog = showSubCategoryDialog;
    window.executeDeepTalkSubOption = executeDeepTalkSubOption;
    window.showBranchDialog = showBranchDialog;
    window.handleBranchChoice = handleBranchChoice;
    window.executeSecretDialogueOption = executeSecretDialogueOption;
    window.recordChoiceConsequence = recordChoiceConsequence;
    window.executeOccupationAction = executeOccupationAction;
    window.getGreeting = getGreeting;
    window.getFarewell = getFarewell;
    window.NPCQuestSystem = NPCQuestSystem;
    window.NPCEventSystem = NPCEventSystem;
    window.NPCRequestSystem = NPCRequestSystem;
    window.executeNPCRequest = function(npcId, requestType) {
        if (window.requestSystem && typeof window.requestSystem.executeRequest === 'function') {
            const result = window.requestSystem.executeRequest(npcId, requestType);
            if (result.success) { showMessage(result.msg, 'success'); const m = document.querySelector('.fixed.inset-0.z-50'); if (m) m.remove(); showNPCDialog(npcId); }
            else showMessage(result.msg, 'error');
        }
    };
    window.acceptNPCQuest = function(questId, npcId) {
        if (window.npcQuestSystem && typeof window.npcQuestSystem.acceptQuest === 'function') {
            const ok = window.npcQuestSystem.acceptQuest(questId);
            if (ok) {
                showMessage('📜 已接取委托！', 'success');
                // 接取后增加好感
                if (npcId) {
                    var npc = window.npcManager?.getNPC(npcId);
                    if (npc && typeof npc.changeAffection === 'function') npc.changeAffection(2);
                }
            } else {
                showMessage('接取失败', 'error');
            }
        }
    };
    window.DEEP_TALK_CATEGORIES = DEEP_TALK_CATEGORIES;
    window.DEEP_TALK_REAL_HANDLERS = DEEP_TALK_REAL_HANDLERS; // v13.6 导出供 secret-leverage.js 注入筹码处理器
    window.OCCUPATION_SPECIFIC_ACTIONS = OCCUPATION_SPECIFIC_ACTIONS;
    // ==================== P2：NPC故事线系统 ====================
    // 检查并触发NPC故事线
    
    function checkNPCStorylines(npcId) {
        if (!window.NPC_STORYLINES || !window.currentCharData) return false;
        
        const npc = window.npcManager.getNPC(npcId);
        if (!npc || !window.NPC_STORYLINES[npcId]) return false;
        
        const storyline = NPC_STORYLINES[npcId];
        const charData = window.currentCharData;
        
        // 加载该NPC的故事线进度（如果之前保存过）
        if (!npc.storylineProgress) {
            npc.loadStorylineProgress();
        }
        
        // 检查每个剧情阶段是否触发
        for (let i = 0; i < storyline.story.length; i++) {
            const stage = storyline.story[i];
            
            // 检查是否已经解锁此阶段（通过previous stage completion）
            const progress = npc.storylineProgress[npcId] || {};
            if (i > 0 && (!progress.completedStages || !progress.completedStages.includes(i - 1))) {
                continue; // 前一阶段未完成，当前阶段不可触发
            }
            
            // 检查前置条件
            if (stage.trigger.minAffection && npc.relationship.affection < stage.trigger.minAffection) {
                continue;
            }
            if (stage.trigger.minDays) {
                const firstMetDay = npc.memory.firstMetDay || 0;
                const currentDay = window.timeSystem && window.timeSystem.getAbsoluteDay ? window.timeSystem.getAbsoluteDay() : 0;
                const daysPassed = Math.max(0, currentDay - firstMetDay);
                if (daysPassed < stage.trigger.minDays) {
                    continue;
                }
            }
            if (stage.trigger.stage2Complete && !charData.quest_gather_herbs_completed) {
                continue;
            }
            
            // 故事线触发 - 显示对话
            showStorylineDialogue(npc, stage, i);
            
            // 标记该阶段为已解锁（但不完成，需要玩家选择）
            if (!npc.storylineProgress[npcId]) {
                npc.storylineProgress[npcId] = { stage: i, completedStages: [] };
            }
            npc.storylineProgress[npcId].stage = i;
            
            return true; // 触发了一个故事线阶段
        }
        
        return false;
    }
    
    function showStorylineDialogue(npc, stage, stageIndex) {
        // 创建故事线弹窗
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4';
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        
        const storyContent = `
            <div class="bg-gray-800 border-2 border-yellow-500 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <h3 class="text-xl font-bold text-yellow-500 mb-4">📖 ${npc.name} 的故事线：${stage.title}</h3>
                <div class="space-y-3 mb-6">
                    ${stage.dialogue.map(d => `<p class="text-gray-200 leading-relaxed">${d.replace('{npc}', npc.name)}</p>`).join('')}
                </div>
                <div class="space-y-3">
                    ${stage.choices.map((choice, idx) => `
                        <button onclick="handleStorylineChoice('${npcId}', ${idx}, this)"
                                class="w-full bg-gray-700 hover:bg-gray-600 text-left px-4 py-3 rounded transition">
                            ${choice.text}
                        </button>
                    `).join('')}
                    </div>
                </div>
                <button onclick="this.closest('.fixed').remove()" class="mt-4 w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">
                    稍后再说
                </button>
            </div>
        `;
        
        modal.innerHTML = storyContent;
        document.body.appendChild(modal);
    }
    
    function handleStorylineChoice(npcId, choiceIndex, buttonElement) {
        const npc = window.npcManager.getNPC(npcId);
        const storyline = window.NPC_STORYLINES[npcId];
        
        // 找到当前触发的阶段
        let currentStageIndex = -1;
        for (let i = 0; i < storyline.story.length; i++) {
            // 简单的阶段匹配逻辑（实际应更精确）
            if (storyline.story[i].choices.some(c => c.text === buttonElement.textContent.trim())) {
                currentStageIndex = i;
                break;
            }
        }
        
        if (currentStageIndex >= 0) {
            const choice = storyline.story[currentStageIndex].choices[choiceIndex];
            // 应用选择效果
            if (choice.effect.includes('affection+')) {
                const affGain = parseInt(choice.effect.match(/affection\+(\d+)/)[1]);
                npc.changeAffection(affGain);
            } else if (choice.effect.includes('affection-')) {
                const affLoss = parseInt(choice.effect.match(/affection-(\d+)/)[1]);
                npc.changeAffection(-affLoss);
            }
            
            // 处理任务相关效果
            if (choice.effect.includes('quest_')) {
                const questId = choice.effect.match(/quest_(\w+)/)[1];
                window.acceptNPCQuest(questId);
            }
            
            // 标记阶段完成
            if (choice.nextStage && npc.storylineProgress) {
                if (!npc.storylineProgress[npcId]) {
                    npc.storylineProgress[npcId] = { stage: currentStageIndex, completedStages: [] };
                }
                var progress = npc.storylineProgress[npcId];
                if (!progress.completedStages.includes(currentStageIndex)) {
                    progress.completedStages.push(currentStageIndex);
                }
                progress.stage = currentStageIndex + 1;
                npc.saveStorylineProgress();
            }
            
            showMessage(`你选择了：${choice.text}`, 'info');
        }
        
        // 关闭弹窗
        const modal = buttonElement.closest('.fixed');
        if (modal) modal.remove();
    }
    
    // 在每次打开NPC对话框时检查故事线
    const originalShowNPCDialog = showNPCDialog;
    showNPCDialog = function(npcId) {
        // 先显示原对话框
        originalShowNPCDialog(npcId);
        
        // 延迟检查故事线，确保对话框已显示
        setTimeout(() => {
            checkNPCStorylines(npcId);
        }, 500);
    };
    
    // v10.0 导出
    window.NPC_GOAL_TYPES = NPC_GOAL_TYPES;
    window.assignNPCGoal = assignNPCGoal;
    window.updateNPCGoalProgress = updateNPCGoalProgress;
    window.getNPCGoalStatus = getNPCGoalStatus;
    window.recordNPCMemory = recordNPCMemory;
    window.getNPCImportantMemories = getNPCImportantMemories;
    window.ADVANCED_REQUEST_TYPES = ADVANCED_REQUEST_TYPES;
    window.getAvailableAdvancedRequests = getAvailableAdvancedRequests;
    window.executeAdvancedRequest = executeAdvancedRequest;
    window.checkNPCStorylines = checkNPCStorylines;
    window.showStorylineDialogue = showStorylineDialogue;
    }
