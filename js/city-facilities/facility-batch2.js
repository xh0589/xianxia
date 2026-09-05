// ==================== facility-batch2.js - 第二批15个设施 ====================
// 13个情境设施 + 2个官府基础设施
// 依赖：scenario-engine.js

// ========== 情境设施（13个） ==========

// 1. 钱庄（v20.18：存款真起息、欠条真到期、账目走钱庄账房 BankService）
scenarioEngine.register('money_house', {
    id: 'money_house', name: '钱庄', icon: '🏦',
    desc: '存放灵石按月生息、抵押法宝、签借据（逾期有人登门）',
    scenarios: [{
        id: 'loan', name: '钱庄业务', icon: '💰',
        desc: '存取生息、抵押卖断、借据清偿，一笔一笔都登簿',
        startNode: 'loan_start',
        nodes: {
            loan_start: {
                desc: function () {
                    return (window.BankService && typeof window.BankService.describe === 'function')
                        ? window.BankService.describe()
                        : '钱庄掌柜热情招呼："客官存灵石月息五、随存随取，抵押公道，借贷也便。"';
                },
                choices: [
                    { text: '📦 当一件龙鳞甲换灵石（250，卖断）', next: null, require: { items: { itemId: 'mat_dragon_scale', count: 1 } }, effects: { msg: '掌柜验了货："龙鳞甲是真货，行价250灵石，卖断不赎。"鳞甲锁进了柜台，灵石落进你的口袋。', msgType: 'success', stones: 250, take: [{ itemId: 'mat_dragon_scale', count: 1 }], time: 10 } },
                    { text: '💰 存入100灵石（月息五，起息今日）', next: null, require: { stones: 100 }, effects: { bank: { op: 'deposit' , amount: 100 }, time: 5 } },
                    { text: '🏦 存入500灵石（月息五，利随本清）', next: null, require: { stones: 500 }, effects: { bank: { op: 'deposit', amount: 500 }, time: 5 } },
                    { text: '🧳 取出存款（利息一并结清）', next: null, effects: { bank: { op: 'withdraw' }, time: 5 } },
                    { text: '💳 借贷灵石（欠条会传出去）', next: 'loan_borrow', effects: { time: 5 } },
                    { text: '🧾 还清欠柜上的账', next: null, effects: { bank: { op: 'repay' }, time: 10 } },
                    { text: '👋 暂时不需要', next: null }
                ]
            },
            loan_borrow: {
                desc: '"借贷100灵石，一月后连本带利还120。欠条留名，商路上传开了可不好看。"\n\n（逾期未还：账房会按日登门划扣，身上划不够就得上点手段。）',
                choices: [
                    { text: '✅ 签下欠条，领100灵石', next: null, effects: { bank: { op: 'borrow', amount: 100 }, karma: -3, noto: 2, msg: '你按下手印领了100灵石——欠条是会走路的东西，行商圈里从此多了一句你的闲话。', msgType: 'warning', time: 10 } },
                    { text: '❌ 利息太高了', next: null }
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
                    { text: '🚶 出发护送', next: null, require: { energy: 30 }, effects: { cost: { energy: 30 }, time: 60, roll: {
                        prob: function() { var lv = (typeof window.getRealmTier === 'function') ? window.getRealmTier((window.currentCharData || {}).realm) : 1; return Math.max(0.4, Math.min(0.9, 0.55 + lv * 0.05)); },
                        win: { exp: 40, stones: 200, rep: 5, msg: '路上喝退两拨劫道的，安然抵达青木城，货主当面点清。历练+40，声望+5！', msgType: 'success' },
                        lose: { qi: -30, health: -20, stones: 100, exp: 25, rep: -3, msg: '山道上撞了邪修！你拼死护住大半货物，仍有灵药受损——货主只付了一半酬金，一路上怨气不断。', msgType: 'warning' }
                    } } },
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
                    { text: '⚔️ 击退山贼！（真刀真枪，会输）', next: null, require: { qi: 40 }, effects: { time: 45, roll: {
                        prob: function() { var lv = (typeof window.getRealmTier === 'function') ? window.getRealmTier((window.currentCharData || {}).realm) : 1; return Math.max(0.35, Math.min(0.85, 0.45 + lv * 0.06)); },
                        win: { qi: -25, exp: 40, rep: 5, stones: 300, msg: '你把山贼杀得四散奔逃，镖车安全送达！获得300灵石和40历练！', msgType: 'success' },
                        lose: { qi: -60, health: -25, stones: 150, exp: 30, msg: '群贼围攻，你挂了彩才护住镖车。镖头扣了货损赔款，只拿到150灵石——但这场硬仗比银子值钱。', msgType: 'warning' }
                    } } },
                    { text: '💰 花钱买路', next: null, effects: { stones: -100, msg: '山贼拿了钱让开道路。', time: 10 } },
                    { text: '🏃 绕路而行', next: null, effects: { time: 30, exp: 10, msg: '你绕路多走了半日，但安全抵达。', msgType: 'info' } }
                ]
            }
        }
    }]
});

// 4. 善堂
scenarioEngine.register('charity_hall', {
    id: 'charity_hall', name: '善堂', icon: '🏮',
    desc: '捐赠物资积累功德，功德可抵消一身业障',
    scenarios: [{
        id: 'donate', name: '捐赠物资', icon: '🎁',
        desc: '善堂正在募集粮食和药材',
        startNode: 'do_start',
        nodes: {
            do_start: {
                desc: '善堂管事拱手："施主慈悲，今冬城中难民众多，急需粮食和药材。"\n\n捐赠实打实换米下锅——功德能抵一身业障，恶业深重的人捐得越多，账消得越快。',
                choices: [
                    { text: '🌾 捐赠粮食（消耗50灵石）', next: null, effects: { stones: -50, rep: 5, karma: 2, msg: '你捐赠了粮食，粥棚当日起灶。功德簿上记了你一笔，业障若负，便消减二分。', msgType: 'success', time: 10 } },
                    { text: '💊 捐赠药材（消耗30灵石）', next: null, effects: { stones: -30, rep: 3, karma: 1, msg: '你捐赠了药材，病棚的人有药可煎了。功德簿上记了你一笔。', time: 10 } },
                    { text: '🙏 捐赠大量物资（消耗200灵石）', next: 'do_generous', effects: { time: 10 } },
                    { text: '🚶 四处散步看看', next: null, effects: { msg: '你在善堂外随意走动，感受冬日的寒风。', time: 5 } }
                ]
            },
            do_generous: {
                desc: '管事大喜："施主大善！我替城中百姓谢过施主！"',
                choices: [
                    { text: '✅ 捐赠200灵石', next: null, effects: { stones: -200, rep: 15, karma: 4, exp: 20, msg: '你的善举传遍全城，声望大增！功德簿上重重记了一笔——负业缠身的人，这一笔能压下大半口气。', msgType: 'success', time: 15 } },
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
                desc: '你跃上斗法台，对面修士冷笑一声："又来一个送分的！"\n\n双方抱拳行礼，战斗开始！台下赌盘已经开了赔率。',
                choices: [
                    { text: '💪 全力进攻（险中求胜）', next: null, require: { qi: 30 }, effects: { time: 10, roll: {
                        prob: function() { var lv = (typeof window.getRealmTier === 'function') ? window.getRealmTier((window.currentCharData || {}).realm) : 1; return Math.max(0.3, Math.min(0.8, 0.35 + lv * 0.06)); },
                        win: { qi: -30, stones: 100, exp: 30, rep: 5, fame: 1, msg: '三招之内你把对手打下擂台！100灵石奖金入袋，台下喝彩声里有人记住了你的名号。', msgType: 'success' },
                        lose: { qi: -45, health: -25, exp: 20, msg: '对手的身法比你想象的快——一掌把你拍下台去，哄笑声里你爬起来掸了掸灰。', msgType: 'warning' }
                    } } },
                    { text: '🧘 稳扎稳打（后手更稳）', next: null, require: { qi: 20 }, effects: { time: 15, roll: {
                        prob: function() { var lv = (typeof window.getRealmTier === 'function') ? window.getRealmTier((window.currentCharData || {}).realm) : 1; return Math.max(0.25, Math.min(0.75, 0.28 + lv * 0.06)); },
                        win: { qi: -20, stones: 80, exp: 25, rep: 3, msg: '十招之后对手力竭破绽大开，你一击制胜！奖金80灵石。', msgType: 'success' },
                        lose: { qi: -30, health: -15, exp: 20, msg: '你守到第十招，一口气没换匀，被他一记劈山掌震得倒退了半步——半步便是输。', msgType: 'warning' }
                    } } }
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
                desc: '你凝视剑碑，碑上刻痕深深浅浅，仿佛一位剑客在你眼前反复演练同一式剑招。',
                choices: [
                    { text: '🧘 盘膝坐下，深参剑意', next: null, effects: { time: 25, roll: {
                        prob: 0.4,
                        win: { exp: 30, msg: '你忽然悟通了剑碑中的一式真意！历练+30', msgType: 'success' },
                        lose: { exp: 15, msg: '碑文剑意高深，你只得皮毛，略有感悟。历练+15' }
                    } } },
                    { text: '👋 状态不佳，改日再来', next: null }
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

// 9. 当铺（v20.20：真当票——当期一月、凭票赎回加息一成五、过期死当；当金/卖断价随本城行情现算）
scenarioEngine.register('pawn_shop', {
    id: 'pawn_shop', name: '当铺', icon: '🔨',
    desc: '紧急变现：典当可赎，卖断给足行价，票面写多少就是多少',
    scenarios: [{
        id: 'pawn', name: '典当物品', icon: '💎',
        desc: '龙鳞甲可当可卖——当有赎期，卖无回头',
        startNode: 'pw_start',
        nodes: {
            pw_start: {
                desc: function () {
                    return (window.PawnService && typeof window.PawnService.describe === 'function')
                        ? window.PawnService.describe()
                        : '当铺掌柜拨着算盘："本店只收大件——龙鳞甲这类硬货。当有赎期，卖无回头。"';
                },
                choices: [
                    { text: '📜 把龙鳞甲当上（按行情折当金，当期一月可赎）', next: null, require: { items: { itemId: 'mat_dragon_scale', count: 1 } }, effects: { pawn: { op: 'pawn', itemId: 'mat_dragon_scale', count: 1, base: 250 }, time: 5 } },
                    { text: '🧾 拿当票赎回物件（当金加息一成五）', next: null, effects: { pawn: { op: 'redeem' }, time: 5 } },
                    { text: '💎 卖断龙鳞甲（行价现算，死当无回头）', next: null, require: { items: { itemId: 'mat_dragon_scale', count: 1 } }, effects: {
                        stones: function () { return Math.round(250 * facilitySellMod()); },
                        take: [{ itemId: 'mat_dragon_scale', count: 1 }],
                        msg: '掌柜把鳞甲翻来覆去验了两遍，按本城行市点足了现钱："死当成交，票根收好——只是个纪念了。"', time: 10 } },
                    { text: '👋 只是看看', next: null }
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
                desc: function () {
                    var P = Math.round(500 * (window.facilityBuyMod ? window.facilityBuyMod() : 1));
                    return '拍卖行中座无虚席，台上正在拍卖一件珍品。\n\n"下一件拍品——筑基丹一枚，起拍价' + P + '灵石！"（拍行随本城行情定价，贵地起拍就贵）';
                },
                choices: [
                    { text: '💰 参与竞拍筑基丹', next: 'au_bid', effects: { time: 10 } },
                    { text: '👀 只是看看热闹', next: null, effects: { exp: 5, msg: '你见识了各种珍品，开阔了眼界。', time: 15 } },
                    { text: '📦 把自己的物品上架拍卖', next: null, effects: { msg: '寄售要押信物排队，档期排到下月了——急出手的话，去商会代售台更实在。', time: 10 } }
                ]
            },
            au_bid: {
                desc: function () {
                    var P = Math.round(500 * (window.facilityBuyMod ? window.facilityBuyMod() : 1));
                    return '你举牌出价' + P + '灵石！\n\n立刻有人加价到' + Math.round(P * 1.1) + '。\n\n拍卖师看向你："这位客官还要加价吗？"';
                },
                choices: [
                    { text: '💰 咬牙一口加到落槌', next: 'au_bid2', effects: { time: 5 } },
                    { text: '❌ 放弃，价格太高了', next: null, effects: { msg: '你放弃了竞拍。', time: 5 } }
                ]
            },
            au_bid2: {
                desc: function () {
                    var H = Math.round(500 * (window.facilityBuyMod ? window.facilityBuyMod() : 1) * 1.2);
                    return '对方犹豫了一下，没有再加价。\n\n"' + H + '灵石第一次！第二次！第三次！成交！"\n\n你成功拍下了一枚筑基丹！';
                },
                choices: [
                    { text: '✅ 付款取货', next: null, effects: {
                        stones: function () { return -Math.round(500 * (window.facilityBuyMod ? window.facilityBuyMod() : 1) * 1.2); },
                        items: [{ itemId: 'pill_foundation', count: 1 }],
                        msg: function () { var H = Math.round(500 * (window.facilityBuyMod ? window.facilityBuyMod() : 1) * 1.2); return '你付了 ' + H + ' 灵石，获得筑基丹×1！'; },
                        msgType: 'success', time: 10 } }
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
                desc: function () {
                    var base = '你穿过几条暗巷，来到一处地下集市。\n\n一个戴斗笠的人低声说："要货吗？刚从秘境里弄出来的好东西。"\n\n他打开包袱一角，露出一卷泛黄的卷轴——上面写着"禁术·噬魂诀"。';
                    var st = (window.FenceCredit && window.FenceCredit.describe) ? window.FenceCredit.describe() : '';
                    return base + (st ? '\n\n' + st : '');
                },
                choices: [
                    { text: '💰 买下禁术残卷（500灵石）', next: 'bl_buy', effects: { time: 10 } },
                    { text: '🕯️ 问一句：柜底可有真货', next: 'bl_hidden', effects: { time: 5 } },
                    { text: '🔍 仔细看看，别是假货', next: 'bl_check', effects: { time: 10 } },
                    { text: '🚫 举报给镇邪司', next: null, effects: { rep: 8, karma: 2, noto: 2, fence: { op: 'trust', delta: -2, kind: 'snitch' }, msg: '镇邪司连夜抄了这批禁术，你得了嘉奖；但黑市最恨黑吃黑——告示墙上贴了你的名号，信用簿上记了重重一笔（黑市信用 -2）。', msgType: 'warning', time: 15 } },
                    { text: '🕯️ 托中间人说和（100灵石）', next: null, effects: { cost: { stones: 100 }, fence: { op: 'settle' }, msg: '银子过了三道手，墙上条子揭了。黑市重新接你的单——下次做事留三分余地。', msgType: 'info', time: 15 } },
                    { text: '👋 不碰这种脏东西', next: null }
                ]
            },
            bl_hidden: {
                desc: function () {
                    var s = (window.FenceCredit && window.FenceCredit.summary) ? window.FenceCredit.summary() : null;
                    var trust = s ? s.trust : 0;
                    var price = Math.round(500 * (trust >= 4 ? 0.85 : 0.9));
                    return '斗笠人左右看了看，把你引到柜底："街面上那卷是残的。这卷是全的——只当交情到位的人卖。"\n\n全册噬魂诀，' + price + '灵石。真货沉手，业障也沉。';
                },
                choices: [
                    { text: '🕯️ 取下全册', next: null, effects: { fence: { op: 'deal', min: 2 }, time: 10,
                        stones: function () { var s = (window.FenceCredit && window.FenceCredit.summary) ? window.FenceCredit.summary() : null; return -Math.round(500 * ((s && s.trust) >= 4 ? 0.85 : 0.9)); },
                        items: [{ itemId: 'mat_shihun_scroll', count: 1 }], noto: 5, karma: -8, msg: function () { var s = (window.FenceCredit && window.FenceCredit.summary) ? window.FenceCredit.summary() : null; return '全册入手（' + Math.round(500 * ((s && s.trust) >= 4 ? 0.85 : 0.9)) + '灵石，成交一笔）。东西摆不上台面，也洗不干净——但暗柜记住了你是能做成买卖的人。'; }, msgType: 'warning' } },
                    { text: '👋 交情没到，不硬凑', next: null }
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
                    { text: '📖 收起来，以后研究', next: null, effects: { stones: -500, noto: 5, karma: -5, fence: { op: 'deal', min: -1 }, items: [{ itemId: 'mat_shihun_scroll', count: 1 }], msg: '噬魂诀残卷入手——禁物无市价，摆不上台面也洗不干净。这一笔成交，暗巷里记你一面。', msgType: 'warning', time: 10 } },
                    { text: '🔥 当场销毁', next: null, effects: { stones: -500, karma: 5, fence: { op: 'deal', min: -1 }, msg: '你不想这种东西害人，当着斗笠人的面烧了它。灵石白花了，但街角几个老住户朝你拱了拱手。', msgType: 'success', time: 5 } }
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

// 14. 工曹署（v20.22：查图纸照旧，另开真承揽——勘河修渠有工钱，贵地工钱随行情，也有栽下来的一天）
function worksJobPay() { return Math.round(80 * (window.facilityBuyMod ? window.facilityBuyMod() : 1)); }
function takeWorksJob() {
    var log = window.gameLog || { add: function() {} };
    var p = window.currentCharData;
    if (!p || (p.qi || 0) < 20) { log.add('河工堤上八尺高，没二十点真气打底你踩不稳脚手架。改日再来。', 'warning'); return false; }
    if (!window.RewardService) { log.add('工曹署账上今日没支应，改日再来。', 'warning'); return false; }
    var rng = (typeof window.__workRng === 'function') ? window.__workRng() : Math.random();
    var pay = worksJobPay();
    // 工本（真气20）与工钱同一笔交割：赢拿全钱，摔了拿四成还挂彩，任一环节不足整笔不成交
    var eff = rng < 0.85
        ? { qi: -20, stones: pay, msg: '你随河工队勘了一段渠线，日暮验收合格。工钱 ' + pay + ' 灵石（随本城工价行情现算），工本真气 20。', msgType: 'success' }
        : { qi: -20, stones: Math.round(pay * 0.4), health: -10, msg: '堤石松了半块，你从脚手架上摔下来——工头照付了四成工钱，你的胳膊肿了半日。', msgType: 'warning' };
    var res2 = window.RewardService.apply(eff, { source: 'works', city: (typeof window.getCurrentCityName === 'function' && window.getCurrentCityName()) || '' });
    if (!res2 || res2.success === false) { if (window.showMessage) window.showMessage('工钱交割未成。', 'warning'); return false; }
    log.add(eff.msg, eff.msgType);
    if (window.timeSystem && window.timeSystem.advanceTime) window.timeSystem.advanceTime(40, '工曹署承揽');
    if (window.updateStatusPanel) window.updateStatusPanel();
    return true;
}
function openWorksBureau() {
    var log = window.gameLog || { add: function() {} };
    var p = window.currentCharData;
    if (!p || (p.qi || 0) < 10) { log.add('卷宗库要点灵灯才看得清图纸，你真气不济，只好改日再来。', 'warning'); return; }
    p.qi -= 10;
    p.tempering = (p.tempering || 0) + 3;
    log.add('你耗了10点真气提灯，在工曹署翻了一个时辰的图纸——水渠、灵脉、城墙，人情世故都在字缝里。历练+3。', 'info');
    if (window.timeSystem && window.timeSystem.advanceTime) {
        window.timeSystem.advanceTime(10, '工曹署查阅');
    }
    // v20.22 承揽台（有弹窗才显式给选项，无则维持轻交互旧口径）
    if (typeof window.showModal === 'function') {
        window.showModal('🏗️ 工曹署·承揽台',
            '<p class="text-xs text-gray-400 mb-2">书吏指着墙上一排工牌："勘河八尺堤，去人就有力气换工钱——本城工钱现算 ' + worksJobPay() + ' 灵石，摔下来另说。"</p>' +
            '<button onclick="takeWorksJob()" class="bg-stone-700 hover:bg-stone-600 text-xs px-3 py-2 rounded">🧱 承揽河工（真气20，约40时辰）</button>');
    }
}

// 15. 盐铁局（v20.22：核账照旧，另放官盐引——官价领引、凭引行盐，贵地盐贵引子也值钱，行商之路自此通）
function saltBuyCharter() {
    var log = window.gameLog || { add: function() {} };
    if (!window.RewardService) { log.add('盐铁局今日不收状子，改日再来。', 'warning'); return false; }
    var res = window.RewardService.apply({
        stones: -80, items: [{ itemId: 'mat_salt_charter', count: 1 }],
        msg: '你按官价 80 灵石领了一张官盐引。引纸盖着盐铁局的朱印——拿去贵地出手，盐路上的利自己挣。', msgType: 'success'
    }, { source: 'salt_iron', city: (typeof window.getCurrentCityName === 'function' && window.getCurrentCityName()) || '' });
    if (!res || res.success === false) {
        if (window.showMessage) window.showMessage('领引需官价 80 灵石，手头不足。', 'warning');
        return false;
    }
    if (window.timeSystem && window.timeSystem.advanceTime) window.timeSystem.advanceTime(15, '盐铁局领引');
    return true;
}
// v20.23 私盐道：行商多给一成二收引，代价是过手留名——盐铁局的缉私册子上会多一行字
function saltSmugglePrice() {
    var sellMod = (typeof window.facilitySellMod === 'function') ? window.facilitySellMod() : 1;
    return Math.round(100 * sellMod * 1.12);
}
function saltSellSmuggler() {
    var log = window.gameLog || { add: function() {} };
    if (!window.RewardService) { log.add('渡口今日没有盐商的船，改日再来。', 'warning'); return false; }
    var price = saltSmugglePrice();
    var res = window.RewardService.apply({
        take: [{ itemId: 'mat_salt_charter', count: 1 }], stones: price, noto: 3,
        msg: '渡口盐商验了朱印，' + price + ' 灵石当面付清——比商会代售多给一成二。只是盐船离岸时他提了一嘴："引子过手的名姓，局里的册子上可都记着。"', msgType: 'success'
    }, { source: 'salt_smuggle', city: (typeof window.getCurrentCityName === 'function' && window.getCurrentCityName()) || '' });
    if (!res || res.success === false) {
        if (window.showMessage) window.showMessage('行囊里没有官盐引，盐商的船不载空手人。', 'warning');
        return false;
    }
    // 缉私：私市过手四刻内被拿问的概率不低（rng 可注入测试）
    var rng = (typeof window.__smugRng === 'function') ? window.__smugRng() : Math.random();
    if (rng < 0.25) {
        var p = window.currentCharData || {};
        var paid = window.XianXia && window.XianXia.DataManager && window.XianXia.DataManager.deductSpiritStones
            ? window.XianXia.DataManager.deductSpiritStones(60) : false;
        if (!paid) { p.health = Math.max(0, (p.health || 0) - 10); }
        log.add(paid ? '盐课巡船兜住了你的舢板——盐引没拿住，罚款 60 灵石交了，人放回来。'
                     : '盐课巡船兜住了你的舢板，罚款凑不出，局里蹲了一宿，饿损了元气（健康-10）。');
    } else {
        log.add('盐引脱手，恶名+3——官盐引走私市，缉私的册子记你一笔。', 'warning');
    }
    if (window.timeSystem && window.timeSystem.advanceTime) window.timeSystem.advanceTime(30, '渡口卖引');
    return true;
}
function openSaltIronOffice() {
    var log = window.gameLog || { add: function() {} };
    var p = window.currentCharData;
    if (!p || (p.qi || 0) < 10) { log.add('账山堆得比人高，没真气提灯你连第一页都翻不动。改日再来吧。', 'warning'); return; }
    p.qi -= 10;
    p.tempering = (p.tempering || 0) + 3;
    log.add('你耗了10点真气核了半个时辰账——玄铁产量、灵盐流转，一个时辰的市井见识换历练+3。', 'info');
    if (window.timeSystem && window.timeSystem.advanceTime) {
        window.timeSystem.advanceTime(10, '盐铁局查阅');
    }
    // v20.22 官盐引窗口；v20.23 盐路分官私两道：商会抽佣稳当，私盐行多给一成二但有官非
    if (typeof window.showModal === 'function') {
        window.showModal('⚒️ 盐铁局·官盐引',
            '<p class="text-xs text-gray-400 mb-2">槽吏敲着柜子："官价 80 灵石一张引。牌面行价 100——贵地出手更高，贱地出手吃亏，盐路自己走。"</p>' +
            '<p class="text-xs text-gray-500 mb-2">出引有两道：商会代售台抽佣一成五，稳当；渡口盐商行私价收引（本城私价现算 ' + saltSmugglePrice() + '），多给一成二——但私市过手，缉私册子记名，四刻内兜上巡船就是罚款 60 起。</p>' +
            '<div style="display:flex;gap:8px"><button onclick="saltBuyCharter()" class="bg-cyan-800 hover:bg-cyan-700 text-xs px-3 py-2 rounded">🧂 官价领一张盐引（80 灵石）</button>' +
            '<button onclick="saltSellSmuggler()" class="bg-red-900 hover:bg-red-800 text-xs px-3 py-2 rounded">🚢 渡口卖给私盐行（' + saltSmugglePrice() + '，恶名+3，有官非）</button></div>');
    }
}

// 导出
window.openWorksBureau = openWorksBureau;
window.openSaltIronOffice = openSaltIronOffice;
window.saltSellSmuggler = saltSellSmuggler;

console.log('[第二批设施] 15个设施已注册（13个情境 + 2个基础）');