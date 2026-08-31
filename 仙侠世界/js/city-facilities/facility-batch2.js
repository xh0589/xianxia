// ==================== facility-batch2.js - 第二批15个设施 ====================
// 13个情境设施 + 2个官府基础设施
// 依赖：scenario-engine.js

// ========== 情境设施（13个） ==========

// 1. 钱庄
scenarioEngine.register('money_house', {
    id: 'money_house', name: '钱庄', icon: '🏦',
    desc: '存放灵石、抵押法宝、办理贷款',
    scenarios: [{
        id: 'loan', name: '灵石贷款', icon: '💰',
        desc: '钱庄可以抵押物品换取灵石',
        startNode: 'loan_start',
        nodes: {
            loan_start: {
                desc: '钱庄掌柜热情招呼："客官要存灵石还是借贷？本店抵押公道，利息优惠。"',
                choices: [
                    { text: '📦 抵押一件装备换取灵石', next: 'loan_mortgage', require: { stones: -1 }, effects: { msg: '你抵押了一件装备，获得300灵石。', msgType: 'success', stones: 300, time: 10 } },
                    { text: '💰 借贷灵石（需支付利息）', next: 'loan_borrow', effects: { time: 10 } },
                    { text: '💳 存入灵石赚取利息', next: 'loan_deposit', effects: { stones: -50, msg: '你存入50灵石作为本金。', time: 10 } },
                    { text: '👋 暂时不需要', next: null }
                ]
            },
            loan_borrow: {
                desc: '"借贷100灵石，一月后需还120灵石。客官可愿意？"',
                choices: [
                    { text: '✅ 借贷100灵石', next: null, effects: { stones: 100, msg: '你借了100灵石，一月后需还120。', time: 10 } },
                    { text: '❌ 利息太高了', next: null }
                ]
            },
            loan_deposit: {
                desc: '掌柜为你办理了存单："每月可领取5%的利息，随时可取。"',
                choices: [
                    { text: '✅ 存入50灵石', next: null, effects: { stones: -50, msg: '存入50灵石，每月可领利息。', time: 10 } },
                    { text: '❌ 算了', next: null }
                ]
            }
        }
    }]
});

// 2. 契约所
scenarioEngine.register('contract_hall', {
    id: 'contract_hall', name: '契约所', icon: '📜',
    desc: '签订具有约束力的法契，保障交易安全',
    scenarios: [{
        id: 'contract', name: '签订护送契约', icon: '🤝',
        desc: '有人委托你护送一批货物',
        startNode: 'ct_start',
        nodes: {
            ct_start: {
                desc: '契约所执事递来一份文书："有商人委托护送一批灵药到青木城，报酬200灵石。"\n\n契约条款：\n1. 保证货物安全送达\n2. 如遇超过金丹期的敌人可放弃\n3. 赔偿条款：货物损失需赔50%',
                choices: [
                    { text: '📝 签订契约，接受委托', next: 'ct_accept', effects: { time: 10 } },
                    { text: '❌ 条款太苛刻，拒绝', next: null },
                    { text: '📋 看看其他契约', next: null, effects: { msg: '执事又拿出几份契约，但报酬都不如这份。', time: 5 } }
                ]
            },
            ct_accept: {
                desc: '你签下名字，契约化作一道灵光没入你的神识——\n\n"契约已成，若违约将受灵气反噬。"\n\n你接过货物，踏上前往青木城的路。',
                choices: [
                    { text: '🚶 出发护送', next: null, effects: { exp: 40, stones: 200, rep: 5, msg: '一路平安抵达，获得200灵石和40经验！', msgType: 'success', time: 60 } },
                    { text: '🏃 中途放弃（违约）', next: null, effects: { qi: -50, noto: 5, msg: '你撕毁契约，灵气反噬，真气大损！', msgType: 'warning' } }
                ]
            }
        }
    }]
});

// 3. 镖局
scenarioEngine.register('escort_office', {
    id: 'escort_office', name: '镖局', icon: '🚩',
    desc: '押送货物、护送人物，赚取酬劳',
    scenarios: [{
        id: 'escort', name: '押送灵矿', icon: '⛏️',
        desc: '一批灵矿需押送至金城',
        startNode: 'es_start',
        nodes: {
            es_start: {
                desc: '镖头抱拳："这批灵矿价值不菲，路上可能有山贼觊觎。\n报酬300灵石，你敢接吗？"',
                choices: [
                    { text: '✅ 接！', next: 'es_road', effects: { time: 10 } },
                    { text: '❌ 风险太大，不接', next: null }
                ]
            },
            es_road: {
                desc: '你押着镖车走了大半日，行至一片密林时，前方突然杀出一伙山贼！',
                choices: [
                    { text: '⚔️ 击退山贼！', next: 'es_fight', effects: { qi: -20, time: 15 } },
                    { text: '💰 花钱买路', next: null, effects: { stones: -100, msg: '山贼拿了钱让开道路。', time: 10 } },
                    { text: '🏃 绕路而行', next: null, effects: { time: 30, exp: 10, msg: '你绕路多走了半日，但安全抵达。', msgType: 'info' } }
                ]
            },
            es_fight: {
                desc: '你三下五除二解决了山贼，押着镖车继续赶路。',
                choices: [
                    { text: '✅ 安全送达，领取报酬', next: null, effects: { stones: 300, exp: 40, rep: 5, msg: '货物安全送达！获得300灵石和40经验！', msgType: 'success', time: 30 } }
                ]
            }
        }
    }]
});

// 4. 善堂
scenarioEngine.register('charity_hall', {
    id: 'charity_hall', name: '善堂', icon: '🏮',
    desc: '捐赠物资获取功德，功德可用于祈福抵消业障',
    scenarios: [{
        id: 'donate', name: '捐赠物资', icon: '🎁',
        desc: '善堂正在募集粮食和药材',
        startNode: 'do_start',
        nodes: {
            do_start: {
                desc: '善堂管事拱手："施主慈悲，今冬城中难民众多，急需粮食和药材。"\n\n捐赠物资可获得功德，功德可抵消业障、祈福增运。',
                choices: [
                    { text: '🌾 捐赠粮食（消耗50灵石）', next: null, effects: { stones: -50, rep: 5, msg: '你捐赠了粮食，功德+5。', msgType: 'success', time: 10 } },
                    { text: '💊 捐赠药材（消耗30灵石）', next: null, effects: { stones: -30, rep: 3, msg: '你捐赠了药材，功德+3。', time: 10 } },
                    { text: '🙏 捐赠大量物资（消耗200灵石）', next: 'do_generous', effects: { time: 10 } },
                    { text: '🚶 四处散步看看', next: null, effects: { msg: '你在善堂外随意走动，感受冬日的寒风。', time: 5 } }
                ]
            },
            do_generous: {
                desc: '管事大喜："施主大善！我替城中百姓谢过施主！"',
                choices: [
                    { text: '✅ 捐赠200灵石', next: null, effects: { stones: -200, rep: 15, exp: 20, msg: '你的善举传遍全城，声望大增！', msgType: 'success', time: 15 } },
                    { text: '❌ 还是捐少一点', next: 'do_start' }
                ]
            }
        }
    }]
});

// 5. 斗法台
scenarioEngine.register('arena_stage', {
    id: 'arena_stage', name: '斗法台', icon: '⚔️',
    desc: '公开比武，赢取排名和奖金',
    scenarios: [{
        id: 'duel', name: '上台挑战', icon: '⚔️',
        desc: '斗法台上有人正在叫阵',
        startNode: 'du_start',
        nodes: {
            du_start: {
                desc: '斗法台上，一名修士正在叫阵："还有没有人敢上来？"\n\n台下观众议论纷纷，此人已经连胜三场。',
                choices: [
                    { text: '⚔️ 上台挑战！', next: 'du_fight', effects: { time: 10 } },
                    { text: '👀 先看看他的路数', next: null, effects: { msg: '你观察了一会，发现他擅长快攻。', time: 10 } },
                    { text: '👋 不凑这个热闹', next: null }
                ]
            },
            du_fight: {
                desc: function(v) { return '你跃上斗法台，对面修士冷笑一声："又来一个送分的！"\n\n双方抱拳行礼，战斗开始！'; },
                choices: [
                    { text: '💪 全力进攻，快速取胜', next: 'du_win_fast', effects: { qi: -30, time: 10 } },
                    { text: '🧘 稳扎稳打，防守反击', next: 'du_win_steady', effects: { qi: -20, time: 15 } }
                ]
            },
            du_win_fast: {
                desc: '你一出手就是凌厉攻势，对手措手不及，三招之内被你打下擂台！\n\n台下爆发出喝彩声！',
                choices: [
                    { text: '✅ 领取胜者奖金', next: null, effects: { stones: 100, exp: 30, rep: 5, msg: '你获得100灵石奖金和30经验！', msgType: 'success' } },
                    { text: '⚔️ 继续挑战下一个', next: null, effects: { stones: 50, exp: 20, msg: '你继续守擂，又赢了一场！', msgType: 'success', qi: -20 } }
                ]
            },
            du_win_steady: {
                desc: '你稳扎稳打，消耗对手的体力。\n\n十招之后，对手露出破绽，你一招制敌！',
                choices: [
                    { text: '✅ 领取胜者奖金', next: null, effects: { stones: 80, exp: 25, rep: 3, msg: '你获得80灵石奖金！', msgType: 'success' } }
                ]
            }
        }
    }]
});

// 6. 观星台
scenarioEngine.register('observatory', {
    id: 'observatory', name: '观星台', icon: '🔭',
    desc: '观测天象，预知灾害与机缘',
    scenarios: [{
        id: 'stargaze', name: '观测天象', icon: '⭐',
        desc: '登台观星，预知未来',
        startNode: 'st_start',
        nodes: {
            st_start: {
                desc: '你登上观星台，夜风拂面，星河璀璨。\n\n观星老人正在台上观测星象，见到你来了，微微点头。',
                choices: [
                    { text: '🔭 观测天象，预知未来', next: 'st_read', effects: { qi: -10, time: 20 } },
                    { text: '🗣️ 向观星老人请教', next: null, effects: { exp: 10, msg: '老人指点你几句星象之理，你有所感悟。', time: 15 } },
                    { text: '👋 只是看看风景', next: null, effects: { msg: '你站在台上看了一会星空，心中宁静。', time: 5 } }
                ]
            },
            st_read: {
                desc: function(v) {
                    var events = ['三日后城西将有暴雨', '近日城中灵气异常，或有宝物出世', '北方有妖气聚集，恐有兽潮', '星象平稳，近日无大事'];
                    var idx = Math.floor(Math.random() * events.length);
                    return '你凝神观望星象，只见北斗闪烁，紫微星明暗不定。\n\n你隐约感应到：' + events[idx];
                },
                choices: [
                    { text: '📝 记下天象，日后验证', next: null, effects: { exp: 20, msg: '你获得了一条天象信息。', msgType: 'info', time: 5 } },
                    { text: '🔮 再仔细看看', next: null, effects: { qi: -15, exp: 15, msg: '你消耗真气深入观测，看到了更多细节。', time: 15 } }
                ]
            }
        }
    }]
});

// 7. 碑林
scenarioEngine.register('stele_forest', {
    id: 'stele_forest', name: '碑林', icon: '🪦',
    desc: '先贤碑文，蕴含武道真意，可触发顿悟',
    scenarios: [{
        id: 'inscribe', name: '参悟碑文', icon: '📖',
        desc: '碑林中刻满历代先贤的感悟',
        startNode: 'stl_start',
        nodes: {
            stl_start: {
                desc: '你步入碑林，一块块石碑矗立在松柏之间。\n\n每块碑上都刻着不同的文字——有剑法心得、有修炼感悟、有阵法要诀。\n\n这里的每一块碑都可能是一场机缘。',
                choices: [
                    { text: '📖 选择一块剑法碑文参悟', next: 'stl_sword', effects: { time: 20 } },
                    { text: '📖 选择一块修炼碑文参悟', next: 'stl_cultivate', effects: { time: 20 } },
                    { text: '📖 选择一块阵法碑文参悟', next: 'stl_array', effects: { time: 20 } },
                    { text: '👋 随意走走', next: null, effects: { msg: '你在碑林中漫步，感受着先贤的气息。', time: 10 } }
                ]
            },
            stl_sword: {
                desc: function(v) {
                    var insight = Math.random() < 0.4;
                    return insight ? '你凝视剑碑，眼前仿佛出现一位剑客在演练剑法。\n\n忽然间，你悟通了其中一式！' : '你仔细研读碑文，但其中剑意高深，你暂时未能领悟。';
                },
                choices: [
                    { text: '✅ 继续参悟', next: null, effects: { exp: 30, msg: Math.random() < 0.4 ? '你领悟了剑法真意！历练+30' : '你略有感悟，历练+15', time: 15 } }
                ]
            },
            stl_cultivate: {
                desc: '这是一块修炼心得的碑文，记录了一位前辈突破金丹期的心路历程。\n\n文字中充满了对天道的感悟。',
                choices: [
                    { text: '🧘 静心参悟', next: null, effects: { exp: 25, qi: 20, msg: '你有所感悟，修为略有精进。', msgType: 'success', time: 20 } }
                ]
            },
            stl_array: {
                desc: '碑上刻着一幅复杂的阵法图，似乎是某种聚灵阵的变体。',
                choices: [
                    { text: '🔍 仔细研究阵法图', next: null, effects: { exp: 20, msg: '你记下了这个阵法，日后可用。', time: 20 } }
                ]
            }
        }
    }]
});

// 8. 异闻馆
scenarioEngine.register('oddity_museum', {
    id: 'oddity_museum', name: '异闻馆', icon: '📚',
    desc: '收集天下奇闻异事，探寻隐藏的秘密',
    scenarios: [{
        id: 'research', name: '查阅异闻录', icon: '🔍',
        desc: '馆中收藏了大量奇闻异事记录',
        startNode: 'od_start',
        nodes: {
            od_start: {
                desc: '异闻馆中堆满了各种卷宗和笔记。\n\n馆主是个白发老者，正在整理一堆泛黄的纸张。\n\n"最近有人来打听百年前的一场大战，你要不要也看看？"',
                choices: [
                    { text: '📜 查阅"百年前大战"卷宗', next: 'od_war', effects: { time: 20 } },
                    { text: '📜 查阅"秘境传说"卷宗', next: 'od_realm', effects: { time: 20 } },
                    { text: '📜 查阅"城中怪谈"卷宗', next: 'od_tale', effects: { time: 20 } },
                    { text: '👋 下次再来', next: null }
                ]
            },
            od_war: {
                desc: '卷宗记载：百年前正邪大战，战场就在城北百里外的荒原。\n\n据说那里至今仍有残存的阵法和未散尽的怨气，偶尔有人在那里捡到遗落的法器。',
                choices: [
                    { text: '🗺️ 记下位置，改日去探索', next: null, effects: { exp: 15, msg: '你获得了一条探索线索。', time: 5 } },
                    { text: '📋 继续查阅其他卷宗', next: 'od_start' }
                ]
            },
            od_realm: {
                desc: '卷宗记载：城东三十里有座无名山谷，每甲子会出现一次秘境入口。\n\n距离下一次开启还有三年。',
                choices: [
                    { text: '🗺️ 记下位置', next: null, effects: { exp: 10, msg: '你获得了一条秘境线索。', time: 5 } }
                ]
            },
            od_tale: {
                desc: '卷宗记载：城中最近有传闻，说深夜在城西老槐树下能听到女子的哭声。\n\n已经有好几个人去查看后失踪了。',
                choices: [
                    { text: '🔍 接下这个调查任务', next: null, effects: { exp: 15, msg: '你决定改日去查探此事。', time: 5 } },
                    { text: '📋 继续查阅其他卷宗', next: 'od_start' }
                ]
            }
        }
    }]
});

// 9. 当铺
scenarioEngine.register('pawn_shop', {
    id: 'pawn_shop', name: '当铺', icon: '🔨',
    desc: '紧急变现，抵押物品获取灵石',
    scenarios: [{
        id: 'pawn', name: '典当物品', icon: '💎',
        desc: '急需灵石时可以典当身上的物品',
        startNode: 'pw_start',
        nodes: {
            pw_start: {
                desc: '当铺掌柜拨着算盘："客官要典当什么？本店价格公道，过期不赎就归本店所有了。"',
                choices: [
                    { text: '💎 典当一件贵重物品', next: 'pw_do', effects: { time: 10 } },
                    { text: '🔄 赎回之前典当的物品', next: null, effects: { msg: '你暂时没有需要赎回的物品。', time: 5 } },
                    { text: '👋 只是看看', next: null }
                ]
            },
            pw_do: {
                desc: '掌柜看了看你的物品："这件东西可以当300灵石，当期一个月，月息10%。\n一个月内不来赎，东西就归我们了。"',
                choices: [
                    { text: '✅ 典当', next: null, effects: { stones: 300, msg: '你获得300灵石，一个月内需赎回。', time: 10 } },
                    { text: '❌ 太少了，不当了', next: null }
                ]
            }
        }
    }]
});

// 10. 拍卖行
scenarioEngine.register('auction_house', {
    id: 'auction_house', name: '拍卖行', icon: '🔨',
    desc: '竞拍稀有物品，也可能遇到恶意抬价',
    scenarios: [{
        id: 'auction', name: '参加拍卖会', icon: '🏛️',
        desc: '每月一次的拍卖会正在进行',
        startNode: 'au_start',
        nodes: {
            au_start: {
                desc: '拍卖行中座无虚席，台上正在拍卖一件珍品。\n\n"下一件拍品——筑基丹一枚，起拍价500灵石！"',
                choices: [
                    { text: '💰 参与竞拍筑基丹', next: 'au_bid', effects: { time: 10 } },
                    { text: '👀 只是看看热闹', next: null, effects: { exp: 5, msg: '你见识了各种珍品，开阔了眼界。', time: 15 } },
                    { text: '📦 把自己的物品上架拍卖', next: null, effects: { msg: '你可以将物品交给拍卖行寄售。', time: 10 } }
                ]
            },
            au_bid: {
                desc: '你举牌出价500灵石！\n\n立刻有人加价到550。\n\n拍卖师看向你："这位客官还要加价吗？"',
                choices: [
                    { text: '💰 加价到600灵石', next: 'au_bid2', effects: { time: 5 } },
                    { text: '❌ 放弃，价格太高了', next: null, effects: { msg: '你放弃了竞拍。', time: 5 } }
                ]
            },
            au_bid2: {
                desc: '对方犹豫了一下，没有再加价。\n\n"600灵石第一次！第二次！第三次！成交！"\n\n你成功拍下了一枚筑基丹！',
                choices: [
                    { text: '✅ 付款取货', next: null, effects: { stones: -600, items: [{ itemId: 'pill_foundation', count: 1 }], msg: '你获得筑基丹×1！', msgType: 'success', time: 10 } }
                ]
            }
        }
    }]
});

// 12. 黑市
scenarioEngine.register('black_market', {
    id: 'black_market', name: '黑市', icon: '🌙',
    desc: '非法交易市场，高风险高收益',
    scenarios: [{
        id: 'black_deal', name: '黑市交易', icon: '🗡️',
        desc: '有人在兜售禁术残卷',
        startNode: 'bl_start',
        nodes: {
            bl_start: {
                desc: '你穿过几条暗巷，来到一处地下集市。\n\n一个戴斗笠的人低声说："要货吗？刚从秘境里弄出来的好东西。"\n\n他打开包袱一角，露出一卷泛黄的卷轴——上面写着"禁术·噬魂诀"。',
                choices: [
                    { text: '💰 买下禁术残卷（500灵石）', next: 'bl_buy', effects: { time: 10 } },
                    { text: '🔍 仔细看看，别是假货', next: 'bl_check', effects: { time: 10 } },
                    { text: '🚫 举报给镇邪司', next: null, effects: { rep: 10, msg: '镇邪司查获了这批禁术，你获得嘉奖。', msgType: 'success', time: 15 } },
                    { text: '👋 不碰这种脏东西', next: null }
                ]
            },
            bl_check: {
                desc: '你仔细检查卷轴，发现纸张虽然泛黄，但墨迹很新——这是赝品！\n\n"敢拿假货骗人？"你冷声道。\n\n斗笠人脸色一变，转身就跑。',
                choices: [
                    { text: '🏃 追上去！', next: null, effects: { exp: 20, msg: '你追上了骗子，把他交给了官府。', msgType: 'success', rep: 5, time: 15 } },
                    { text: '👋 算了，多一事不如少一事', next: null, effects: { msg: '你离开了黑市。', time: 5 } }
                ]
            },
            bl_buy: {
                desc: '你付了灵石，接过卷轴。\n\n打开一看——这确实是真正的禁术残卷，但只有前半部分，修炼了会有严重后遗症。',
                choices: [
                    { text: '📖 收起来，以后研究', next: null, effects: { stones: -500, noto: 5, msg: '你获得了禁术残卷（残篇），但恶名略有上升。', msgType: 'warning', time: 10 } },
                    { text: '🔥 当场销毁', next: null, effects: { stones: -500, msg: '你不想这种东西害人，当场销毁了它。灵石白花了。', time: 5 } }
                ]
            }
        }
    }]
});

// 13. 园林别苑
scenarioEngine.register('garden_villa', {
    id: 'garden_villa', name: '园林别苑', icon: '🌺',
    desc: '高端社交场所，可与名流雅士交流',
    scenarios: [{
        id: 'social', name: '参加雅集', icon: '🎭',
        desc: '今日有文人在此举办诗会',
        startNode: 'ga_start',
        nodes: {
            ga_start: {
                desc: '园林中花木掩映，亭台楼阁错落有致。\n\n几名文士正在水榭中吟诗作对，一名琴师在旁抚琴。\n\n气氛雅致而闲适。',
                choices: [
                    { text: '🎭 参与诗会，以文会友', next: 'ga_poem', effects: { time: 20 } },
                    { text: '🍵 与旁边的老者品茶论道', next: 'ga_tea', effects: { time: 20 } },
                    { text: '👀 只是四处走走', next: null, effects: { msg: '你在园林中散步，心情愉悦。', time: 10 } }
                ]
            },
            ga_poem: {
                desc: '你即兴作诗一首，虽然在座的都是文人，但也对你刮目相看。\n\n一名老者赞道："没想到修士中也有如此文采之人！"',
                choices: [
                    { text: '🙏 谦虚回应', next: null, effects: { rep: 5, exp: 15, msg: '你结交了几位文人朋友，声望+5。', msgType: 'success', time: 10 } },
                    { text: '😏 得意洋洋', next: null, effects: { noto: 2, exp: 10, msg: '有人觉得你太张扬了。', time: 10 } }
                ]
            },
            ga_tea: {
                desc: '老者是位退隐的修士，与你品茶论道，谈起了修炼心得。\n\n"修行一道，张弛有度。你最近是不是太急于突破了？"',
                choices: [
                    { text: '🙏 请教修炼心得', next: null, effects: { exp: 30, msg: '老者的一番话让你受益匪浅，历练+30。', msgType: 'success', time: 15 } },
                    { text: '😤 不劳您操心', next: null, effects: { msg: '老者摇摇头，不再多说。', time: 5 } }
                ]
            }
        }
    }]
});

// ========== 官府设施（基础功能，2个） ==========

// 14. 工曹署
function openWorksBureau() {
    var log = window.gameLog || { add: function() {} };
    log.add('你来到工曹署，查阅了城中工程图纸。目前正在修建一条新的水渠，预计下月完工。', 'info');
    if (window.currentCharData) {
        window.currentCharData.tempering = (window.currentCharData.tempering || 0) + 3;
    }
    if (window.timeSystem && window.timeSystem.advanceTime) {
        window.timeSystem.advanceTime(10, '工曹署查阅');
    }
}

// 15. 盐铁局
function openSaltIronOffice() {
    var log = window.gameLog || { add: function() {} };
    log.add('你来到盐铁局，查阅了官营产业的账目。本月玄铁产量稳定，灵盐供应充足。', 'info');
    if (window.currentCharData) {
        window.currentCharData.tempering = (window.currentCharData.tempering || 0) + 3;
    }
    if (window.timeSystem && window.timeSystem.advanceTime) {
        window.timeSystem.advanceTime(10, '盐铁局查阅');
    }
}

// 导出
window.openWorksBureau = openWorksBureau;
window.openSaltIronOffice = openSaltIronOffice;

console.log('[第二批设施] 15个设施已注册（13个情境 + 2个基础）');