// ==================== special-features.js — 特色景致真剧本（v21.4） ====================
// 此前 24 处特色景致没有专属剧本，点击走通用兜底：一句话 + 免费历练+20 + 声望+3，
// 零成本无限连点——是印钞机也是内容空洞。本文件给每一处景致写专属剧本：
// 有场景、有选择、有成本、有成败分支，奖励全部走 RewardService 统一结算。
// 注册进情境引擎（id = 景致中文名），location-system.triggerSpecialFeature 的兜底
// 分支优先查这里；查不到的未知景致仍走兜底，但兜底已加成本加日限加削奖。
// 纪律：每个选项必有成本（精力/真气/健康/钱）或明确风险（roll 败分支），没有白拿的历练。
(function () {
    'use strict';
    if (!window.scenarioEngine || typeof window.scenarioEngine.register !== 'function') return;

    function lv() {
        try { return (typeof window.getRealmTier === 'function') ? window.getRealmTier((window.currentCharData || {}).realm) : 1; }
        catch (e) { return 1; }
    }
    function sk(name) {
        try { return (typeof window.getLifeSkill === 'function') ? (window.getLifeSkill(name) || 0) : 0; }
        catch (e) { return 0; }
    }
    // 境界成功率：高境界做险事更稳，但永远不满保
    function realmProb(base) { return function () { return Math.min(0.9, base + lv() * 0.05); }; }
    // 生活技能成功率：练了才有好结果
    function skillProb(skillName, base) { return function () { return Math.min(0.92, base + sk(skillName) * 0.008); }; }

    var FEATURES = [
        {
            name: '木灵塔', icon: '🌳', city: '青木城', desc: '木灵栖身的古塔，塔身藤纹如经',
            scene: '塔身的藤纹在暮色里微微发亮——青木城的老人说，塔里住着位木灵，岁数比城还大。塔门没锁，灵不灵，看缘分。',
            choices: [
                { text: '🍃 登塔与木灵感应（真气20）', require: { qi: 20 }, effects: { cost: { qi: 20 }, time: 40, roll: {
                    prob: realmProb(0.4),
                    win: { exp: 6, karma: 1, msg: '塔顶藤纹缠上你的手腕，不紧，像把脉。片刻后一片叶脉落入你掌心——木灵认了你这个客。历练+6，因果+1。', msgType: 'success' },
                    lose: { exp: 2, msg: '你在塔顶坐了一个时辰，藤纹动都没动。下楼时守塔老人笑："木灵今天不想见客。"历练+2。' }
                } } },
                { text: '💧 以灵泉之水浇塔根（灵石10）', require: { stones: 10 }, effects: { cost: { stones: 10 }, time: 20, karma: 2, exp: 3, msg: '你把一壶灵泉水浇进塔根，藤纹舒展开一寸。浇树的钱不贵，心意贵。因果+2，历练+3。', msgType: 'success' } },
                { text: '📜 抄录塔身木纹经文（精力15）', require: { energy: 15 }, effects: { cost: { energy: 15 }, time: 50, lifeSkill: { name: '学识', exp: 2 }, exp: 4, msg: '木纹不是花纹，是经文——你拓了半卷，字迹古拙，学识+2，历练+4。' } }
            ]
        },
        {
            name: '仙雾阁', icon: '🌫️', city: '蓬莱仙岛', desc: '终年锁在雾里的阁，传闻仙人偶来对弈',
            scene: '雾从海面漫上来，把阁只剩一个檐角。本地人说雾里有路，走着走着就能走到阁门口——也有人走一整天，走回原地。',
            choices: [
                { text: '🚶 踏雾寻路（精力20，可能撞崖）', require: { energy: 20 }, effects: { cost: { energy: 20 }, time: 80, roll: {
                    prob: realmProb(0.35),
                    win: { exp: 8, karma: 1, msg: '雾忽然开了条缝——你看见阁中石桌上摆着残局，黑白子都还没落尘。你没敢碰，退出时雾合上了。历练+8，因果+1。', msgType: 'success' },
                    lose: { health: -10, exp: 3, msg: '你在雾里转了两个时辰，一头撞上崖壁。雾散时你离起点只有十步。挂了彩，历练+3。', msgType: 'warning' }
                } } },
                { text: '🍵 在雾外候一壶茶（真气15）', require: { qi: 15 }, effects: { cost: { qi: 15 }, time: 40, exp: 4, msg: '你在崖边生了小火，候一壶茶。雾里始终没人出来，但茶气混着雾气，喝下去通体清润。历练+4。' } },
                { text: '🖌️ 辨读崖上雾刻题字（学识）', require: { energy: 10 }, effects: { cost: { energy: 10 }, time: 30, roll: {
                    prob: skillProb('学识', 0.4),
                    win: { lifeSkill: { name: '学识', exp: 2 }, exp: 4, msg: '崖壁上的刻痕被雾气蚀了大半，你辨出四个字："仙不在阁"。学识+2，历练+4。', msgType: 'success' },
                    lose: { exp: 2, msg: '刻痕太浅，你只认出像个"仙"字。雾一涌，什么都没了。历练+2。' }
                } } }
            ]
        },
        {
            name: '灵龟池', icon: '🐢', city: '蓬莱仙岛', desc: '老龟驮碑的池子，龟龄不可考',
            scene: '池底卧着片青灰色的"石头"——那石头在呼吸。岸碑记载：此龟来时蓬莱还没名，问它话，它答不答看心情。',
            choices: [
                { text: '🥬 喂灵龟一束海芝（灵石15）', require: { stones: 15 }, effects: { cost: { stones: 15 }, time: 20, karma: 2, exp: 3, msg: '老龟浮上来，慢吞吞嚼完海芝，冲你眨了下眼。喂过它的人都说，那天做事格外顺。因果+2，历练+3。', msgType: 'success' } },
                { text: '🔮 抚龟甲问卜（真气20）', require: { qi: 20 }, effects: { cost: { qi: 20 }, time: 30, roll: {
                    prob: realmProb(0.45),
                    win: { exp: 7, karma: 1, msg: '龟甲纹路在你掌下微微发烫，排出一列你看不懂的卦形——但心里某件悬着的事忽然有了答案。历练+7，因果+1。', msgType: 'success' },
                    lose: { exp: 2, msg: '老龟把头缩回壳里，半天不出来。问卜不问强扭的卦。历练+2。' }
                } } },
                { text: '🧘 池边静坐观龟息（精力10）', require: { energy: 10 }, effects: { cost: { energy: 10 }, time: 40, exp: 4, msg: '龟一息，你一息。坐到后来你的呼吸不知不觉慢了半拍，起身时耳目清亮。历练+4。' } }
            ]
        },
        {
            name: '潮汐殿', icon: '🌊', city: '东海龙宫', desc: '龙宫记潮的大殿，潮信比历法准',
            scene: '殿里没有灯，光从水面折下来，随潮一晃一晃。殿柱上刻满潮痕——千年潮信都在这几道刻痕里，水族说读懂潮，就读懂了海的脾气。',
            choices: [
                { text: '🌒 观潮悟水理（真气25）', require: { qi: 25 }, effects: { cost: { qi: 25 }, time: 60, roll: {
                    prob: realmProb(0.4),
                    win: { exp: 8, lifeSkill: { name: '学识', exp: 1 }, msg: '潮起潮落之间你忽然看懂了柱上刻痕的记法——那不是记账，是海的呼吸图谱。历练+8，学识+1。', msgType: 'success' },
                    lose: { exp: 3, msg: '你看了一下午，潮痕还是潮痕。水里的道理，急不来。历练+3。' }
                } } },
                { text: '🐚 沿潮隙拾贝（精力20）', require: { energy: 20 }, effects: { cost: { energy: 20 }, time: 40, roll: {
                    prob: 0.6,
                    win: { spiritStones: 30, exp: 3, msg: '退潮的缝隙里你摸到一枚夜光贝，贝珠温润，龙宫账房肯出30灵石。历练+3。', msgType: 'success' },
                    lose: { exp: 2, copper: 100, msg: '贝壳捡了半筐，都是空的。只有铜板大的小蟹陪了你一下午。历练+2，铜钱+100（蟹贩收的）。' }
                } } },
                { text: '📋 帮潮官录潮信（精力15）', require: { energy: 15 }, effects: { cost: { energy: 15 }, time: 30, rep: 2, exp: 4, msg: '潮官正缺个识字的帮手。你录了半卷潮信，他往你手里塞了块避水糖："下回涨潮别乱走。"本城声望+2，历练+4。', msgType: 'success' } }
            ]
        },
        {
            name: '龙魂锻体', icon: '🐉', city: '东海龙宫', desc: '以龙魂余威淬体的古法，疼是真疼',
            scene: '殿心悬着一缕暗金色的魂影——老龙蜕骨时留下的一缕魂，千年不散。水族勇士成年礼都在这里过：站进去，扛得住是龙孙，扛不住抬出去。',
            choices: [
                { text: '🔥 受龙魂淬体（气血-20 精力-25，险）', require: { health: 40, energy: 25 }, effects: { cost: { health: 20, energy: 25 }, time: 60, roll: {
                    prob: realmProb(0.35),
                    win: { exp: 12, msg: '龙魂贯体的瞬间你听见了潮声以外的东西——像是心跳，你的，也是它的。淬体功成，皮膜下隐有金纹流转。历练+12。', msgType: 'success' },
                    lose: { health: -25, exp: 5, msg: '第三息你就被龙威压得跪了下去，抬出来时七窍渗血。疼是真疼，骨头也是真硬了一分。气血-25，历练+5。', msgType: 'warning' }
                } } },
                { text: '👀 在殿外远观龙魂礼（真气10）', require: { qi: 10 }, effects: { cost: { qi: 10 }, time: 30, exp: 3, msg: '今日恰有水族少年受礼。你隔着殿门看完全程——他扛下来了，你也跟着攥了一手心的汗。历练+3。' } }
            ]
        },
        {
            name: '炎帝像', icon: '🗿', city: '炎城', desc: '城心的炎帝石像，炉工们的祖师',
            scene: '炎城的炉子再旺，旺不过这座像前长明的一炉火。像底座刻满火纹，老炉工说那不是纹，是炎帝当年留下的火候口诀——看不懂的看热闹，看得懂的看门道。',
            choices: [
                { text: '🕯️ 敬香祭拜（铜钱100）', require: {}, effects: { cost: { copper: 100 }, time: 15, karma: 2, exp: 2, msg: '三炷香插进炉灰，火苗窜高半尺。炉工们冲你点头——在炎城，敬过炎帝的都是自家人。因果+2，历练+2。', msgType: 'success' } },
                { text: '🔥 参悟像底火纹（真气25）', require: { qi: 25 }, effects: { cost: { qi: 25 }, time: 60, roll: {
                    prob: skillProb('锻造', 0.35),
                    win: { lifeSkill: { name: '锻造', exp: 2 }, exp: 6, msg: '火纹在你眼里慢慢活了——那不是刻痕，是风箱的呼吸节奏。你悟了两分控火的门道。锻造+2，历练+6。', msgType: 'success' },
                    lose: { exp: 2, msg: '你盯着火纹看到眼花流泪，口诀还是口诀，看不懂。老炉工笑："火候不到，急什么。"历练+2。' }
                } } },
                { text: '🧹 为像前长明灯添油拭座（精力20）', require: { energy: 20 }, effects: { cost: { energy: 20 }, time: 30, rep: 2, karma: 1, exp: 4, msg: '你添了灯油，把像座擦得见影。收摊时炉工行会的老头往你手里塞了块火石："炎城记得干活的人。"本城声望+2，因果+1，历练+4。', msgType: 'success' } }
            ]
        },
        {
            name: '百草园', icon: '🌿', city: '万毒谷', desc: '毒谷里唯一不毒的园子，药王手笔',
            scene: '万毒谷寸草皆毒，唯独这片园子干干净净——当年药王与毒尊赌一局赢来的地界，园里种的全是解药。守园的哑仆比划着告诉你：采药可以，认错了草，园子外没人救得了你。',
            choices: [
                { text: '🌱 采药（精力20，毒刺有险）', require: { energy: 20 }, effects: { cost: { energy: 20 }, time: 50, roll: {
                    prob: skillProb('医术', 0.45),
                    win: { spiritStones: 40, lifeSkill: { name: '医术', exp: 2 }, exp: 4, msg: '你认全了七叶一枝花和它的毒邻居，采得干干净净。药市收你这筐好货，40灵石，医术+2，历练+4。', msgType: 'success' },
                    lose: { health: -8, lifeSkill: { name: '医术', exp: 1 }, exp: 2, msg: '第三株你就认岔了——毒刺扎进指头，哑仆眼疾手快给你抹了解药。疼出一身汗，医术+1，历练+2。', msgType: 'warning' }
                } } },
                { text: '☠️ 辨毒苗（医术）', require: { energy: 15 }, effects: { cost: { energy: 15 }, time: 40, roll: {
                    prob: skillProb('医术', 0.5),
                    win: { lifeSkill: { name: '医术', exp: 2 }, exp: 5, msg: '园子东墙角混进来三株毒苗，你一株株起出来堆到墙外。哑仆冲你竖了个大拇指。医术+2，历练+5。', msgType: 'success' },
                    lose: { health: -10, exp: 2, msg: '毒苗的汁水溅上手背，起了一片红疹——好在园里的药就近，抹上就消。历练+2。', msgType: 'warning' }
                } } },
                { text: '💦 帮园仆浇水除草（精力15）', require: { energy: 15 }, effects: { cost: { energy: 15 }, time: 30, karma: 2, exp: 3, msg: '哑仆不会说话，收工时往你怀里塞了一把晒干的宁神草。在毒谷，这是很重的谢礼。因果+2，历练+3。', msgType: 'success' } }
            ]
        },
        {
            name: '毒经阁', icon: '📕', city: '万毒谷', desc: '万毒门藏经之所，毒与医本是一体',
            scene: '阁里的书分两架：左架讲毒，右架讲解。守阁长老说得直白："只读左架的出去害人，只读右架的出去挨害。两架都读，才配出谷。"',
            choices: [
                { text: '📖 读毒经（真气20）', require: { qi: 20 }, effects: { cost: { qi: 20 }, time: 60, lifeSkill: { name: '毒术', exp: 2 }, exp: 4, msg: '左架第一册讲"七步断肠散"的十二种解法——毒经其实一半篇幅在讲解。毒术+2，历练+4。' } },
                { text: '📋 替药铺抄录解毒方（精力20）', require: { energy: 20 }, effects: { cost: { energy: 20 }, time: 50, roll: {
                    prob: skillProb('医术', 0.5),
                    win: { spiritStones: 30, karma: 1, exp: 3, msg: '谷外药铺重金求抄解毒方，你抄得一字不差。掌柜付了30灵石，另送你一句："方子救的是谷外的人。"因果+1，历练+3。', msgType: 'success' },
                    lose: { spiritStones: 10, exp: 2, msg: '你抄漏了两味药引，掌柜皱着眉只肯给十灵石的辛苦费："回去再读读。"历练+2。' }
                } } },
                { text: '🙏 两架各读半卷（真气25）', require: { qi: 25 }, effects: { cost: { qi: 25 }, time: 70, lifeSkill: [{ name: '毒术', exp: 1 }, { name: '医术', exp: 1 }], exp: 5, karma: 1, msg: '守阁长老看你在两架之间来回走，难得地点了头："毒医一体，你摸到门了。"毒术+1，医术+1，因果+1，历练+5。', msgType: 'success' } }
            ]
        },
        {
            name: '凤栖台', icon: '🦚', city: '凤凰巢', desc: '凤裔祭天的高台，凡人止步之地',
            scene: '台是整块火山岩凿出来的，台阶九十九级，每级都烫脚。凤裔不拦你上台——它们的规矩是：能上去的，就是有请来的资格。台顶风里有灰烬的味道，也有传说里凤鸣的余音。',
            choices: [
                { text: '🔺 登台望凤巢（精力25，灼烫）', require: { energy: 25 }, effects: { cost: { energy: 25 }, time: 60, roll: {
                    prob: realmProb(0.4),
                    win: { exp: 10, karma: 2, msg: '第九十九级踏上去的瞬间，巢方向传来一声长鸣——不是给你听的，但你听见了。心口那团火亮了一瞬。历练+10，因果+2。', msgType: 'success' },
                    lose: { exp: 3, msg: '你爬到六十几级就被烫得退了下来。凤裔在台上看着你，没有嘲笑，也没有邀请。历练+3。' }
                } } },
                { text: '🪶 捧还台上落羽（精力15）', require: { energy: 15 }, effects: { cost: { energy: 15 }, time: 30, rep: 3, karma: 2, msg: '台角遗着一根赤金色的落羽。你双手捧还到台心的羽冢——凤裔的首领朝你颔首，这是外人能得到的最高礼遇。本城声望+3，因果+2。', msgType: 'success' } },
                { text: '🙇 台下遥拜（真气10）', require: { qi: 10 }, effects: { cost: { qi: 10 }, time: 15, karma: 1, exp: 2, msg: '你在台下整衣遥拜。拜的不是凤，是那股子浴火再来的心气。因果+1，历练+2。' } }
            ]
        },
        {
            name: '熔火渊', icon: '🌋', city: '凤凰巢', desc: '火山口的熔潭，凤裔浴火之地',
            scene: '渊口的热浪隔着十丈就燎眉毛。凤裔说这是浴火重生的圣地，凡人说这是玩命的深坑——两种说法都对，看你站哪个位置。',
            choices: [
                { text: '🔥 渊边淬体（气血-15，险）', require: { health: 40, energy: 20 }, effects: { cost: { health: 15, energy: 20 }, time: 50, roll: {
                    prob: realmProb(0.35),
                    win: { exp: 10, msg: '你在渊边坐到皮肤赤红，渊火的热力一丝丝渗进骨缝——杂质随着汗烧了出去。淬体功成，历练+10。', msgType: 'success' },
                    lose: { health: -20, exp: 4, msg: '一阵渊火突然爆起，燎了你半边衣甲。你滚出十丈才压住身上的火苗。气血-20，历练+4——伤是白受的，见识不是。', msgType: 'warning' }
                } } },
                { text: '💰 投灵石祭渊火（灵石50）', require: { stones: 50 }, effects: { cost: { stones: 50 }, time: 30, roll: {
                    prob: 0.55,
                    win: { karma: 2, exp: 8, msg: '灵石落渊，火光猛地一旺，卷上来一缕暖流没入你眉心——渊火收了祭，回了礼。因果+2，历练+8。', msgType: 'success' },
                    lose: { karma: 1, exp: 2, msg: '灵石沉下去，连个响都没有。凤裔在旁边看你："心诚就行，它不缺钱。"因果+1，历练+2。' }
                } } },
                { text: '👁️ 观渊火脉络（真气20）', require: { qi: 20 }, effects: { cost: { qi: 20 }, time: 40, lifeSkill: { name: '锻造', exp: 1 }, exp: 5, msg: '渊火的纹路有起有伏，你看懂了三分——那是天然的炉温曲线。铸剑人求一辈子的好火候，在这里白看。锻造+1，历练+5。' } }
            ]
        },
        {
            name: '赤羽市', icon: '🪶', city: '凤凰巢', desc: '凤裔巢外的以物易物市集',
            scene: '赤羽市不用钱——凤裔瞧不上灵石，这儿以物易物，一根赤羽能换一车货，也可能换不来一碗水。摊主们全是南疆猎户和不要命的行商，讲价靠嘴，吃亏靠命。',
            choices: [
                { text: '🗣️ 讨价换货（灵石30做本钱）', require: { stones: 30 }, effects: { cost: { stones: 30 }, time: 40, roll: {
                    prob: skillProb('口才', 0.4),
                    win: { spiritStones: 90, lifeSkill: { name: '口才', exp: 1 }, exp: 3, msg: '你用30灵石收了两根品相上佳的赤羽，转手被凤裔祭师用90灵石请走——他们要的是羽毛齐整，不是便宜。净赚60，口才+1，历练+3。', msgType: 'success' },
                    lose: { exp: 2, msg: '你收的"赤羽"掉色——是染的鸡毛。摊主早跑没影了。30灵石买了个教训，历练+2。', msgType: 'warning' }
                } } },
                { text: '👂 逛市听消息（精力10）', require: { energy: 10 }, effects: { cost: { energy: 10 }, time: 30, exp: 2, copper: 150, msg: '你在市里泡了半天，听齐了南疆三条商道的行情，顺手帮猎户算了笔账，赚了150铜钱茶钱。历练+2。' } },
                { text: '🎤 卖艺换赏（音律/口才）', require: { energy: 20 }, effects: { cost: { energy: 20 }, time: 40, roll: {
                    prob: function () { return Math.min(0.85, 0.35 + sk('音律') * 0.01 + sk('口才') * 0.005); },
                    win: { spiritStones: 25, lifeSkill: { name: '音律', exp: 1 }, exp: 2, msg: '赤羽市不认钱但认本事——你一段曲子唱完，猎户们往你脚边扔了值25灵石的货。音律+1，历练+2。', msgType: 'success' },
                    lose: { exp: 1, msg: '唱到一半被凤鸣盖了过去。行商笑你："在凤凰门口卖曲，胆子不小。"历练+1。' }
                } } }
            ]
        },
        {
            name: '佛窟', icon: '🛕', city: '金城', desc: '沙漠深处的石窟，佛像半埋沙中',
            scene: '金城的商队路过都要停一停——窟里的佛像只剩半张脸露在沙外，另半张埋在沙里，百年了，沙也没把它埋完。窟壁壁画褪了色，佛的眼睛还是亮的。',
            choices: [
                { text: '🙏 礼佛上香（铜钱50）', require: {}, effects: { cost: { copper: 50 }, time: 20, karma: 2, exp: 2, msg: '一炷沙枣枝当香，插在沙里。佛没说话，你心里那块石头轻了二两。因果+2，历练+2。', msgType: 'success' } },
                { text: '📿 窟中静坐观像（真气20）', require: { qi: 20 }, effects: { cost: { qi: 20 }, time: 60, roll: {
                    prob: realmProb(0.4),
                    win: { exp: 8, karma: 1, msg: '坐到日头偏西，你忽然看懂了那半张脸——埋着的不是佛，是看客的心。出定时一身沙，满心清亮。历练+8，因果+1。', msgType: 'success' },
                    lose: { exp: 3, msg: '窟里太静，静得你耳鸣。杂念比沙子还多，坐了一个时辰就出来了。历练+3。' }
                } } },
                { text: '🖌️ 描摹壁画残卷（精力20）', require: { energy: 20 }, effects: { cost: { energy: 20 }, time: 50, lifeSkill: { name: '学识', exp: 2 }, exp: 4, msg: '壁画讲的是佛国旧事，你描了半卷本生图。金城书商见了直呼好东西——你没卖，收进了行囊。学识+2，历练+4。' } }
            ]
        },
        {
            name: '烽火台', icon: '🔥', city: '大漠孤城', desc: '孤城的眼，兽潮来时的第一声',
            scene: '大漠孤城能立三百年不倒，靠的就是这一串烽火台。台上戍卒三班倒，眼睛熬得通红——妖兽不挑日子，烽火就不能断人。',
            choices: [
                { text: '👁️ 助戍卒瞭望一班（精力25）', require: { energy: 25 }, effects: { cost: { energy: 25 }, time: 60, roll: {
                    prob: realmProb(0.5),
                    win: { rep: 3, exp: 6, msg: '半夜你盯出了三十里外一线扬尘——是兽群改道，提前两个时辰示警，全城少死一个人。戍卒们敬你是条汉子。本城声望+3，历练+6。', msgType: 'success' },
                    lose: { rep: 1, exp: 3, msg: '你瞭望了一班，什么都没看出来，但多一双眼睛总没错。换班时戍卒递给你半囊水。本城声望+1，历练+3。' }
                } } },
                { text: '🪵 为烽燧添薪（精力15）', require: { energy: 15 }, effects: { cost: { energy: 15 }, time: 30, karma: 1, rep: 1, exp: 3, msg: '红柳柴捆上三丈高的台不容易，你扛了两趟。烽燧旺一分，孤城安一分。因果+1，本城声望+1，历练+3。', msgType: 'success' } },
                { text: '🍶 陪戍卒喝碗烈酒（铜钱80）', require: {}, effects: { cost: { copper: 80 }, time: 30, exp: 4, msg: '酒是刀子酒，话是掏心话——你听了一耳朵兽潮旧事，哪年破了西墙，哪队人没回来。历练+4。这些名字值得有人记着。' } }
            ]
        },
        {
            name: '大塔遗迹', icon: '🗼', city: '佛国遗址', desc: '半塌的佛塔，塔心传闻有旧供',
            scene: '塔斜得像要倒，三百年了就是不倒。塔心的门洞被黄沙堵了一半，进去的人都说里头有旧供器，也有塌下来的梁——拿命换东西的买卖，遗址里天天有人做。',
            choices: [
                { text: '⛏️ 探塔心（精力30，塔随时塌）', require: { energy: 30 }, effects: { cost: { energy: 30 }, time: 80, roll: {
                    prob: realmProb(0.4),
                    win: { spiritStones: 60, exp: 8, msg: '塔心的旧供案上摆着一只鎏金舍利瓶，瓶里三颗舍利子早已化沙——但瓶子本身， 巡礼人出60灵石请走了。你退出来十步，塔心轰然塌了一片。历练+8。', msgType: 'success' },
                    lose: { health: -15, exp: 4, msg: '横梁塌下来的时候你滚得快，只被砸了肩背。旧供没摸着，命摸着了。气血-15，历练+4。', msgType: 'warning' }
                } } },
                { text: '📜 读塔身残铭（真气15）', require: { qi: 15 }, effects: { cost: { qi: 15 }, time: 50, roll: {
                    prob: skillProb('学识', 0.45),
                    win: { lifeSkill: { name: '学识', exp: 2 }, exp: 5, msg: '残铭记的是佛国末年的事：塔不是佛修的，是百姓一锹一锹修的。学识+2，历练+5。', msgType: 'success' },
                    lose: { exp: 2, msg: '梵文残铭蚀得只剩笔画，你一个都认不全。风一吹，沙又盖住一行。历练+2。' }
                } } },
                { text: '🧹 清理塔基积沙（精力20）', require: { energy: 20 }, effects: { cost: { energy: 20 }, time: 40, karma: 3, rep: 1, exp: 4, msg: '你清了一下午塔基的积沙，露出整圈的莲花浮雕。路过的巡礼人跟着你一起清，走时朝你合十。因果+3，本城声望+1，历练+4。', msgType: 'success' } }
            ]
        },
        {
            name: '经冢', icon: '📜', city: '佛国遗址', desc: '埋经的坟冢，佛国最后的体面',
            scene: '佛国亡时，僧人们没逃——他们把毕生抄的经卷埋进这座冢，说"法在，国就不算亡"。冢上的土每年被风削一层，巡礼人每年添一层。',
            choices: [
                { text: '⛰️ 为经冢培土（精力20）', require: { energy: 20 }, effects: { cost: { energy: 20 }, time: 40, karma: 3, exp: 4, msg: '你从三里外背来两筐土，一锹一锹培上冢顶。风还在削，但今天它没削动。因果+3，历练+4。', msgType: 'success' } },
                { text: '🕳️ 掘取残经（精力25，损阴德）', require: { energy: 25 }, effects: { cost: { energy: 25 }, time: 60, roll: {
                    prob: 0.55,
                    win: { lifeSkill: { name: '学识', exp: 3 }, exp: 5, karma: -2, msg: '你掘出半函贝叶经，字还清楚——学识+3，历练+5。填土时你的手一直在抖，因果-2。有些东西读了就欠了债。', msgType: 'warning' },
                    lose: { karma: -1, exp: 2, msg: '挖到三尺只有沙。回填时冢顶塌了一角，你补了半晌土，越补心越虚。因果-1，历练+2。', msgType: 'warning' }
                } } },
                { text: '🔄 绕冢诵行（真气20）', require: { qi: 20 }, effects: { cost: { qi: 20 }, time: 30, karma: 2, exp: 3, msg: '绕冢七匝，你不会经文，就数自己的脚步。第七匝走完，风声里好像真有诵经声——也可能是你自己心里的。因果+2，历练+3。', msgType: 'success' } }
            ]
        },
        {
            name: '菩提残林', icon: '🌳', city: '佛国遗址', desc: '枯了半边的菩提林，活的那半还在长',
            scene: '这片林子一半枯成白石色，一半绿得发亮——僧人说枯的那半是佛国的业，绿的那半是后来人的愿。林深处的老菩提树下有块坐石，石面被坐出两个浅窝。',
            choices: [
                { text: '🧘 菩提树下打坐（真气30）', require: { qi: 30 }, effects: { cost: { qi: 30 }, time: 80, roll: {
                    prob: realmProb(0.4),
                    win: { exp: 10, karma: 2, msg: '坐进石窝的那一瞬，满林叶子同时响了一下，又静了。你没悟出什么大道理，只是忽然不急了。历练+10，因果+2。', msgType: 'success' },
                    lose: { exp: 4, msg: '枯枝的影子在眼皮上晃了一下午，心猿意马。起身时腰酸，但坐过的石头是暖的。历练+4。' }
                } } },
                { text: '📿 拾捡菩提子（精力15）', require: { energy: 15 }, effects: { cost: { energy: 15 }, time: 30, roll: {
                    prob: 0.65,
                    win: { spiritStones: 25, karma: 1, exp: 3, msg: '你捡了一兜落地的菩提子，颗颗饱满。巡礼人出25灵石请走——他们请的不是子，是这片林的心意。因果+1，历练+3。', msgType: 'success' },
                    lose: { exp: 2, msg: '捡到的都是空壳，风一吹就瘪。你把它们埋回树根旁——壳也是林的。历练+2。' }
                } } },
                { text: '🧹 清扫林中落叶（精力20）', require: { energy: 20 }, effects: { cost: { energy: 20 }, time: 40, karma: 2, exp: 4, msg: '扫到日头偏西，石路露了出来。有个巡礼的老僧朝你合十："施主扫的不是叶，是路。"因果+2，历练+4。', msgType: 'success' } }
            ]
        },
        {
            name: '冰魄锻炉', icon: '❄️', city: '冰原城', desc: '以寒代火的奇炉，寒铁在此成器',
            scene: '冰原城的铁匠铺没有炉火——炉膛里烧的是万载寒晶，越冷，寒铁越听话。老锻师说这叫"以寒淬魄"，火候反着来：手要热，心要冷。',
            choices: [
                { text: '👀 观冰魄淬炼（真气20）', require: { qi: 20 }, effects: { cost: { qi: 20 }, time: 50, lifeSkill: { name: '锻造', exp: 2 }, exp: 4, msg: '你看了一炉寒铁出膛——淬的不是水，是更冷的寒晶粉。反着来的火候，看懂了就是新天地。锻造+2，历练+4。' } },
                { text: '💪 帮锻工拉寒箱（精力25）', require: { energy: 25 }, effects: { cost: { energy: 25 }, time: 60, roll: {
                    prob: 0.6,
                    win: { lifeSkill: { name: '锻造', exp: 2 }, spiritStones: 30, exp: 5, msg: '寒箱一拉一整炉，你拉得又稳又匀。锻师付了30灵石工钱，还说下炉找你："手感是天生的。"锻造+2，历练+5。', msgType: 'success' },
                    lose: { health: -10, lifeSkill: { name: '锻造', exp: 1 }, exp: 3, msg: '手汗滴上寒晶，粘掉一层皮。锻师骂了你一句，还是教了你怎么看火候。气血-10，锻造+1，历练+3。', msgType: 'warning' }
                } } },
                { text: '🔧 为炉子除霜保养（精力15）', require: { energy: 15 }, effects: { cost: { energy: 15 }, time: 30, rep: 1, exp: 3, msg: '冰魄炉最怕炉膛结杂霜，你拿铜铲刮了整整一层。锻师们省了半天工夫，请你喝了碗热羊乳。本城声望+1，历练+3。' } }
            ]
        },
        {
            name: '寒潭', icon: '🧊', city: '极寒之地', desc: '千年不冻的深潭，潭水冷过冰',
            scene: '四周的冰厚得能跑马车，唯独这潭水不冻——不是暖，是冷到了头，冷得连冻都冻不动。极寒之地的体修把这儿当关房：下去一次，要么脱胎，要么抬走。',
            choices: [
                { text: '🥶 入潭淬体（气血-10 精力-20，险）', require: { health: 35, energy: 20 }, effects: { cost: { health: 10, energy: 20 }, time: 50, roll: {
                    prob: realmProb(0.35),
                    win: { exp: 10, msg: '入水那一瞬像被万针扎透，十息之后，针变成了火——寒气逼到底，体内的阳气反而烧了起来。你上潭时浑身冒着白汽，骨头是新的。历练+10。', msgType: 'success' },
                    lose: { health: -20, exp: 4, msg: '你在潭里没撑过三十息就被同伴拖了上来，眉毛结着冰，话都说不利索。淬体没成，冻是真冻。气血-20，历练+4。', msgType: 'warning' }
                } } },
                { text: '🪣 汲取寒潭水（精力10）', require: { energy: 10 }, effects: { cost: { energy: 10 }, time: 20, exp: 2, copper: 200, msg: '寒潭水镇心火，山下的丹房收，一桶200铜钱。你打了两桶，手冻得差点握不住绳。历练+2。' } },
                { text: '🧘 潭边照影静坐（真气10）', require: { qi: 10 }, effects: { cost: { qi: 10 }, time: 30, exp: 3, msg: '潭面平得像镜子，照出来的你比平时年轻，也比平时诚实。你在潭边坐了一炷香，什么也没求。历练+3。' } }
            ]
        },
        {
            name: '冰灵淬体', icon: '❄️', city: '极寒之地', desc: '引冰灵入体的古法，九死一生的买卖',
            scene: '极寒之地的灵气凝成了形——夜里能看见冰蓝色的光屑在风里走，那就是冰灵。体修们拿命换机缘：引冰灵入体走一个大周天，成了皮骨如寒铁，败了经脉冻裂。',
            choices: [
                { text: '💠 引冰灵入体（真气-30 气血-15，大险）', require: { qi: 60, health: 50 }, effects: { cost: { qi: 30, health: 15 }, time: 90, roll: {
                    prob: realmProb(0.3),
                    win: { exp: 14, msg: '冰灵顺着你的呼吸进来，沿着经脉走了一整圈——所过之处先是冻裂般的疼，然后是被重新铸过的凉。你睁眼时，睫毛上的霜没有化。淬体大成，历练+14。', msgType: 'success' },
                    lose: { qi: -30, health: -25, exp: 6, msg: '冰灵走到膻中穴就散了架，寒气乱窜，你在雪地里跪了半个时辰才压住。真气-30，气血-25，历练+6——败一次，就知道下次该怎么呼吸。', msgType: 'warning' }
                } } },
                { text: '✋ 只淬双手（精力-20 气血-5）', require: { energy: 20, health: 20 }, effects: { cost: { energy: 20, health: 5 }, time: 40, exp: 6, msg: '你把双手插进冰灵汇聚的雪窝，一炷香后拔出来——十指冻得发青，但攥拳时指节咔咔作响，稳得像铁。历练+6。' } },
                { text: '🚶 见好就收（无耗）', require: {}, effects: { time: 10, exp: 1, msg: '你看了半宿冰灵，没动手。有些机缘要等身体配得上它——这不是怂，是账算得清。历练+1。' } }
            ]
        },
        {
            name: '万剑崖', icon: '🗡️', city: '万剑宗', desc: '历代剑修面壁的崖，剑痕入石三分',
            scene: '崖壁上剑痕累累，从山脚到云端——每一道都是某位前辈面壁时的手笔。最深处那道痕只有三尺，可历代掌门都说：看懂它的，三百年来只有一个。',
            choices: [
                { text: '🧘 面壁悟剑（真气30）', require: { qi: 30 }, effects: { cost: { qi: 30 }, time: 80, roll: {
                    prob: realmProb(0.4),
                    win: { exp: 10, msg: '你盯着那道三尺剑痕看到天黑——忽然看懂了：它不是在刻剑，是在收剑。满崖的剑痕都在往外放，只有它在往回收。这一眼，值十年苦功。历练+10。', msgType: 'success' },
                    lose: { health: -5, exp: 3, msg: '剑痕里的剑意太密，你看到气血翻涌，退出来时眼前还在飞白线。悟剑不成反被剑啄。气血-5，历练+3。', msgType: 'warning' }
                } } },
                { text: '👆 以指临摹剑痕（精力20，剑气割手）', require: { energy: 20 }, effects: { cost: { energy: 20 }, time: 50, roll: {
                    prob: realmProb(0.45),
                    win: { exp: 8, msg: '你的手指离剑痕三寸临摹，剑气顺着指缝钻——你摹完一式"回风落雁"，指头麻了三天，剑也活了三分。历练+8。', msgType: 'success' },
                    lose: { health: -10, exp: 3, msg: '剑气割破了指尖，血珠滴在崖根。守崖弟子递给你布条："都这样，不丢人。"气血-10，历练+3。', msgType: 'warning' }
                } } },
                { text: '👂 崖下听剑鸣（真气15）', require: { qi: 15 }, effects: { cost: { qi: 15 }, time: 30, exp: 4, msg: '起风的时候，满崖剑痕一起响——不是声音，是剑意撞在风上的颤。你闭眼听了半晌，像听了一场千人的合奏。历练+4。' } }
            ]
        },
        {
            name: '试剑台', icon: '⚔️', city: '万剑宗', desc: '剑修较技的石台，剑气削平了台角',
            scene: '试剑台立了八百年，台角被剑气削得溜圆。台上立着一具守台石傀——剑宗先辈封在里面的剑意，谁上台它就跟谁走三剑。赢它的，名字刻上旁边的碑。',
            choices: [
                { text: '⚔️ 与守台石傀过招（精力30）', require: { energy: 30 }, effects: { cost: { energy: 30 }, time: 60, roll: {
                    prob: realmProb(0.4),
                    win: { exp: 10, rep: 2, msg: '三剑，你接下了第三剑——石傀收势，退回了台心。碑前执事提笔问你名字。八百年的碑上，多了一道新痕。历练+10，本城声望+2。', msgType: 'success' },
                    lose: { health: -20, exp: 5, msg: '第二剑你就被剑气掀下了台，摔得背过气去。石傀没有追击——它只走三剑，从不欺人。气血-20，历练+5：知道差在哪，比赢更值钱。', msgType: 'warning' }
                } } },
                { text: '👀 台下观摩他人试剑（精力10）', require: { energy: 10 }, effects: { cost: { energy: 10 }, time: 30, exp: 3, msg: '今天上台的是个年轻剑修，三剑输了两剑半，下台时却在笑。你旁观者清，把他输的那半剑看了个明白。历练+3。' } },
                { text: '🧹 为试剑台养护磨剑石（精力15）', require: { energy: 15 }, effects: { cost: { energy: 15 }, time: 30, karma: 1, rep: 1, exp: 3, msg: '台边的磨剑石被剑气啃出了沟，你拿细砂把石面养平。执事点头："剑台的规矩，剑要利，石要平。"因果+1，本城声望+1，历练+3。', msgType: 'success' } }
            ]
        },
        {
            name: '碧波潭', icon: '💧', city: '碧落仙宫', desc: '仙宫前的深潭，潭水碧得像玉化开',
            scene: '碧波潭的水一眼能望到底，底上没有沙，只有一整块碧玉似的岩。仙宫的人说这潭是宫主的砚台——蘸的是碧波，写的是天书。',
            choices: [
                { text: '🧘 潭畔静坐悟水（真气25）', require: { qi: 25 }, effects: { cost: { qi: 25 }, time: 60, roll: {
                    prob: realmProb(0.4),
                    win: { exp: 8, karma: 1, msg: '水面无风自平，你看着看着，呼吸跟着水纹的节奏慢了下来——心一静，潭底的玉岩纹路竟像一篇功法。历练+8，因果+1。', msgType: 'success' },
                    lose: { exp: 3, msg: '一只水鸟落在潭心，把你攒了半炷香的静气啄得粉碎。你笑着起身——输给水鸟，不冤。历练+3。' }
                } } },
                { text: '🫧 潭底寻碧波玉髓（精力25）', require: { energy: 25 }, effects: { cost: { energy: 25 }, time: 50, roll: {
                    prob: 0.5,
                    win: { spiritStones: 70, exp: 3, msg: '你在玉岩缝里抠出一枚指甲盖大的碧波玉髓，水头好得晃眼。仙宫外市收70灵石。历练+3。', msgType: 'success' },
                    lose: { exp: 2, msg: '潜了三趟，摸上来的都是普通石头。潭水太清，清得你不好意思多摸。历练+2。' }
                } } },
                { text: '🚶 绕潭徐行听涛（真气10）', require: { qi: 10 }, effects: { cost: { qi: 10 }, time: 20, exp: 3, msg: '潭水拍岩的声音很轻，像有人在很远的地方翻书。你绕潭走了三圈，把心里的事一件件放下了。历练+3。' } }
            ]
        },
        {
            name: '珊瑚林', icon: '🪸', city: '碧落仙宫', desc: '海底珊瑚成林，红白相间如霞',
            scene: '珊瑚枝高过人头，走进去像走进一片凝固的霞。林子里有鲛人的旧歌谣刻在礁上，也有偷采珊瑚的人留下的绳痕——仙宫对后者不客气。',
            choices: [
                { text: '🪸 采拾脱落珊瑚枝（精力25）', require: { energy: 25 }, effects: { cost: { energy: 25 }, time: 50, roll: {
                    prob: 0.6,
                    win: { spiritStones: 50, exp: 3, msg: '你只捡自然脱落的枯枝——仙宫的规矩是活珊瑚不能碰，枯枝随便拾。一筐红珊瑚卖了50灵石。历练+3。', msgType: 'success' },
                    lose: { health: -8, spiritStones: 10, exp: 2, msg: '枯枝没找着几根，手倒是被珊瑚茬划得全是口子。勉强凑了小半筐，卖了10灵石。气血-8，历练+2。', msgType: 'warning' }
                } } },
                { text: '🛡️ 巡护珊瑚林（精力20）', require: { energy: 20 }, effects: { cost: { energy: 20 }, time: 50, roll: {
                    prob: realmProb(0.45),
                    win: { karma: 2, rep: 2, exp: 4, msg: '你撞见两个偷采活珊瑚的，人赃并获扭送仙宫外署。执事记了你的名——珊瑚林百年才长一尺，护住一寸是一寸。因果+2，本城声望+2，历练+4。', msgType: 'success' },
                    lose: { exp: 3, msg: '偷采的听见脚步就跑了，你只捡回他们丢下的半筐活珊瑚，一株株移回礁盘。没抓着人，救回了珊瑚。历练+3。' }
                } } },
                { text: '🎵 听礁上鲛人歌谣（真气15）', require: { qi: 15 }, effects: { cost: { qi: 15 }, time: 30, lifeSkill: { name: '音律', exp: 1 }, exp: 4, msg: '礁上的刻痕是曲谱，你按着谱子哼了一遍——调子起时，林子里的水都仿佛跟着晃。音律+1，历练+4。' } }
            ]
        },
        {
            name: '灵泉', icon: '⛲', city: '灵界·蓬莱仙境', desc: '上界灵泉，灵气凝成的活水',
            scene: '灵界的泉不往低处流——水从石缝里涌出来，悬成一线，绕着泉眼转了三圈才落地。会盟执事说：这是上界的规矩，好东西，先敬天，再敬客。',
            choices: [
                { text: '💧 掬饮灵泉（无耗，恢复）', require: {}, effects: { time: 20, qi: 40, energy: 20, exp: 2, msg: '泉水入口是甜的，甜过之后四肢百骸都轻了——真气+40，精力+20。上界的泉，一口抵凡间一炉丹。历练+2。', msgType: 'success' } },
                { text: '🛁 泉畔沐灵（无耗，恢复）', require: {}, effects: { time: 60, health: 50, energy: 30, exp: 2, msg: '你在泉边沐了半个时辰，旧伤新乏都被灵水洗了下去——气血+50，精力+30。会盟执事远远看着，没有拦：客礼如此。历练+2。', msgType: 'success' } },
                { text: '🏺 汲灵泉一壶（精力15）', require: { energy: 15 }, effects: { cost: { energy: 15 }, time: 30, karma: 1, exp: 3, msg: '执事给了你一只玉壶："汲一壶是客礼，汲一缸是贪心。"你汲了一壶，谢过泉眼。因果+1，历练+3。', msgType: 'success' } }
            ]
        }
    ];

    // 注册：id 用景致中文名，triggerSpecialFeature 按名查
    FEATURES.forEach(function (f) {
        window.scenarioEngine.register(f.name, {
            id: f.name, name: f.name, icon: f.icon, desc: f.desc,
            scenarios: [{
                id: 'visit', name: '探访', icon: f.icon, desc: f.desc,
                startNode: 'start',
                nodes: { start: { desc: f.scene, choices: f.choices } }
            }]
        });
    });

    console.log('[special-features] v21.4 已注册 ' + FEATURES.length + ' 处特色景致真剧本');
})();
