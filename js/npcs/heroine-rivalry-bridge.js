// ==================== heroine-rivalry-bridge.js - 情敌和解/亲密系统 v1.0 ====================
// 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / triggerPersonalEvent /
//       canPlayerAccessPersonalEvent / hasEventTriggered）
//       npcs/npc-system.js（setNPCRelationshipPair / adjustNPCRelationshipPair / getRelationBetween）
//       npcs/heroine-rivalry.js（HEROINE_ROSTER / detectRivalRomance）
// 加载顺序：在 heroine-rivalry.js 之后
//
// 设计宪法：情敌配对关系演进由真实状态驱动——玩家已同时与两位女主角缔情（故她们是情敌），
//   且至少一位已对玩家质问过（吃醋对峙已发生，彼此知晓存在）。
//   通过玩家"邀约论交"撮合，配对关系沿 enemy → neutral → friend → 至交(金兰) 演进，
//   复用既有 npcRelationships 关系图与 adjustNPCRelationshipPair 的分段逻辑，无人为计数器。
//   约束：须人在该女主角门派、吃醋已发生、有情敌、配对未至"至交"（friend 且强度≥80）、冷却 14 天。

var BRIDGE_COOLDOWN_DAYS = 14;
var BRIDGE_INTIMATE_STRENGTH = 80; // friend 强度达此值视为"至交/金兰"（亲密）

// ============ 配对关系查询/初始化 ============
function getHeroinePairRelation(aId, bId) {
    var a = window.npcManager && window.npcManager.getNPC ? window.npcManager.getNPC(aId) : null;
    if (a && a.npcRelationships && a.npcRelationships[bId]) {
        return a.npcRelationships[bId];
    }
    // 回退：用公开 API 取关系类型（无强度）
    var relType = null;
    if (typeof window.getNPCRelationship === 'function') {
        relType = window.getNPCRelationship(aId, bId);
    }
    return { relation: relType || 'neutral', strength: 0 };
}

// 首次发现有情敌且吃醋已发生 → 初始化配对为 enemy/60（她们已知彼此、互为情敌）
function initHeroinePairIfNeeded(aId, bId) {
    var cur = getHeroinePairRelation(aId, bId);
    if (cur && cur.relation && cur.relation !== 'neutral') return cur; // 已建立
    if (cur && cur.strength) return cur; // 已有强度
    var a = window.npcManager && window.npcManager.getNPC ? window.npcManager.getNPC(aId) : null;
    var b = window.npcManager && window.npcManager.getNPC ? window.npcManager.getNPC(bId) : null;
    if (!a || !b) return cur;
    if (typeof window.setNPCRelationshipPair === 'function') {
        window.setNPCRelationshipPair(a, b, 'enemy', 60);
    }
    return { relation: 'enemy', strength: 60 };
}

// ============ 二十位女主角的"论交"事件（情敌会面） ============
// v20.76：恒山·祁清禅 / 泰山·岳清晓 / 青城·幽翠微 / 衡山·奚湘筠 四人论交事件接入。
// v20.77：血手门·耿雪衣 / 飞蝎坞·拓银沙 / 烈日教·伏璃茵 / 天龙教·檀望舒 四人论交事件接入。
//   反派阵营纪律：论交场景在各自主场（药庐篱笆口/坞外沙丘/圣火龛后廊/传声房旧档房），
//   组织黑暗只做氛围侧写，不写阵营洗白、不写首领出场；檀望舒档位文案全程带「（用XX的调子）」标注，
//   本声不出现；伏璃茵档位文案不写她哭。
// v20.78：神机门·戚巧机 / 铁掌帮·裘霜莺 / 昆仑派·姬云锦 / 全真教·翀玉衡 四人论交事件接入。
//   论交场景在各自主场（工坊/苇滩堤上/崖畔舞台/功录房）；专属语言系统与吃醋桩同一套纪律：
//   sj＝误差/齿比/滴答，tz＝哨语/凶脸/菱角，kl＝舞谱/名目/读舞（零乐器），qz＝记账/利息/两讫（零酒字）。
// v20.79：少林寺·竺照禅 论交事件接入。论交场景在主场栴檀林；专属语言系统与吃醋桩同一套纪律：
//   shao＝批注/功课/佛号/戒律（批注经≠恒山比丘尼线的整套功课法器，两不相犯；不碰戒尺等他人 motif）。
var HEROINE_BRIDGE_EVENTS = {
    // ---- 温蘅：在百花谷接待情敌 ----
    'bh_event_bridge': {
        id: 'bh_event_bridge', npcId: 'sect_leader_百花谷', title: '药庐论交', icon: '🌸',
        desc: '你邀的那位，到了百花谷。',
        minAffection: 50, trigger: { random: 1.0 }, cooldown: BRIDGE_COOLDOWN_DAYS, flag: 'bh_e_bridge_cd',
        requireEventDone: 'bh_event_rival', requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你递了信出去。三日后，那位情敌如约到了百花谷药庐。', type: 'description' },
            { speaker: 'narrator', text: '温蘅在门口迎她，笑眼弯弯如常，琥珀色的眼底却没笑——两个 share 过你的女人，头一次正面相对。', type: 'description' },
            { speaker: 'npc', text: '「请坐。」温蘅推过一只茶杯——热的，「你比我以为的，要镇定。」' },
            { speaker: 'narrator', text: '她没看那人，看着你。', type: 'description' },
            { speaker: 'player_select', text: '你如何撮合？', options: [
                { text: '「你们都为我好。不如各说一句真话。」', effect: 'mediate', affection: 3 },
                { text: '替她们互相传一句对方的好', effect: 'convey', affection: 2 },
                { text: '「我先回避，你们自己谈。」', effect: 'leave', affection: 1 }
            ]}
        ],
        effects: function(npc, choice) { return _applyBridgeEffects(npc, choice, '温蘅'); }
    },
    // ---- 绯泪：在修罗宫接待情敌 ----
    'xl_event_bridge': {
        id: 'xl_event_bridge', npcId: 'sect_leader_修罗宫', title: '大殿论交', icon: '🩸',
        desc: '她竟肯让那人进修罗宫。',
        minAffection: 50, trigger: { random: 1.0 }, cooldown: BRIDGE_COOLDOWN_DAYS, flag: 'xl_e_bridge_cd',
        requireEventDone: 'xl_event_rival', requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你请绯泪给那人一个机会。她沉默了很久，最后让侍女开门——那人进了修罗宫大殿。', type: 'description' },
            { speaker: 'narrator', text: '绯泪坐主位，没起身。两个女人隔着一张长案，寒意从指间渗出来。', type: 'description' },
            { speaker: 'npc', text: '——你能来，我意外。' },
            { speaker: 'narrator', text: '她看着你，意思很明白：你撮合，我听。', type: 'description' },
            { speaker: 'player_select', text: '你如何撮合？', options: [
                { text: '「你们都吃过苦。别在我这儿再吃一次。」', effect: 'mediate', affection: 3 },
                { text: '替她们互相传一句对方的好', effect: 'convey', affection: 2 },
                { text: '「我先回避，你们自己谈。」', effect: 'leave', affection: 1 }
            ]}
        ],
        effects: function(npc, choice) { return _applyBridgeEffects(npc, choice, '绯泪'); }
    },
    // ---- 琤霄凌：在天山派接待情敌 ----
    'ts_event_bridge': {
        id: 'ts_event_bridge', npcId: 'sect_leader_天山派', title: '雪庐论交', icon: '❄️',
        desc: '她破例让那人进了雪庐。',
        minAffection: 50, trigger: { random: 1.0 }, cooldown: BRIDGE_COOLDOWN_DAYS, flag: 'ts_e_bridge_cd',
        requireEventDone: 'ts_event_rival', requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你请琤霄凌见那人一面。她在雪庐门口站了很久，最后推开了门——那人踏进天山雪庐。', type: 'description' },
            { speaker: 'narrator', text: '两柄剑——霜鸣与那人的——隔庐相挂。霄凌没拔剑，但手按在鞘上。', type: 'description' },
            { speaker: 'npc', text: '「坐。」她声音像雪后的风，「你既然来了，便不是来抢剑的。」' },
            { speaker: 'narrator', text: '她看向你。', type: 'description' },
            { speaker: 'player_select', text: '你如何撮合？', options: [
                { text: '「她守剑十二年，你也有你的执。别互相难为。」', effect: 'mediate', affection: 3 },
                { text: '替她们互相传一句对方的好', effect: 'convey', affection: 2 },
                { text: '「我先回避，你们自己谈。」', effect: 'leave', affection: 1 }
            ]}
        ],
        effects: function(npc, choice) { return _applyBridgeEffects(npc, choice, '琤霄凌'); }
    },
    // ---- 蓝凤凰：在五仙教接待情敌 ----
    'wx_event_bridge': {
        id: 'wx_event_bridge', npcId: 'sect_leader_五仙教', title: '蛊窟论交', icon: '🦋',
        desc: '她带那人看了万蛊窟。',
        minAffection: 50, trigger: { random: 1.0 }, cooldown: BRIDGE_COOLDOWN_DAYS, flag: 'wx_e_bridge_cd',
        requireEventDone: 'wx_event_rival', requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你请蓝凤凰见那人。她妖媚一笑，竟带那人进了万蛊窟——千百只蛊瓮码成墙。', type: 'description' },
            { speaker: 'narrator', text: '她锁骨下的蝶形黑纹鼓了一下，又安静——心蛊认得出，眼前这人也喂过你。', type: 'description' },
            { speaker: 'npc', text: '「哟。」她凤目一挑，「我的心蛊都比你客气。坐吧——五仙教待客，不喂蛊。」' },
            { speaker: 'narrator', text: '她侧头看你，等你开口。', type: 'description' },
            { speaker: 'player_select', text: '你如何撮合？', options: [
                { text: '「你们都为我不敢动情/动了情。别把账算对方头上。」', effect: 'mediate', affection: 3 },
                { text: '替她们互相传一句对方的好', effect: 'convey', affection: 2 },
                { text: '「我先回避，你们自己谈。」', effect: 'leave', affection: 1 }
            ]}
        ],
        effects: function(npc, choice) { return _applyBridgeEffects(npc, choice, '蓝凤凰'); }
    },
    // ---- 夙孤鸿：在峨眉戒堂接待情敌 ----
    'em_event_bridge': {
        id: 'em_event_bridge', npcId: 'sect_leader_峨眉派', title: '戒堂论交', icon: '🪷',
        desc: '她竟亲自开了山门，接那人上金顶。',
        minAffection: 50, trigger: { random: 1.0 }, cooldown: BRIDGE_COOLDOWN_DAYS, flag: 'em_e_bridge_cd',
        requireEventDone: 'em_event_rival', requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你递了信出去。三日后，那位如约到了峨眉——山门竟是夙孤鸿亲自开的。', type: 'description' },
            { speaker: 'narrator', text: '戒堂内，两人隔一张长案对坐。案上一把木戒尺、两盏素茶。她没带鸣鸿——论交不带剑，是峨眉最高的礼。', type: 'description' },
            { speaker: 'npc', text: '「坐。」她把素茶推过去，茶是热的，「持戒的人，不问来历。你既进了峨眉的门——就是客。」' },
            { speaker: 'narrator', text: '说完她看向你，意思明白：人是你请来的，戒是破是守，你开口。', type: 'description' },
            { speaker: 'player_select', text: '你如何撮合？', options: [
                { text: '「你们两个，一个持戒，一个执念。别互相难为。」', effect: 'mediate', affection: 3 },
                { text: '替她们互相传一句对方的好', effect: 'convey', affection: 2 },
                { text: '「我先回避，你们自己谈。」', effect: 'leave', affection: 1 }
            ]}
        ],
        effects: function(npc, choice) { return _applyBridgeEffects(npc, choice, '夙孤鸿'); }
    },
    // ---- 晏万解：在唐门毒堂接待情敌 ----
    'tm_event_bridge': {
        id: 'tm_event_bridge', npcId: 'sect_leader_唐门', title: '毒堂论交', icon: '🍵',
        desc: '她给那人斟了三盏茶，只有一盏没毒。',
        minAffection: 50, trigger: { random: 1.0 }, cooldown: BRIDGE_COOLDOWN_DAYS, flag: 'tm_e_bridge_cd',
        requireEventDone: 'tm_event_rival', requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你递了信出去。三日后，那位如约到了唐门——毒堂的正门竟开着。晏万解立在黑漆长案后，白丝手套在灯下泛着冷光。', type: 'description' },
            { speaker: 'narrator', text: '案上三盏茶，汤色各异：一盏清亮，一盏微浊，一盏沉着一线极细的青。唐门待客的旧例，她头一回摆给这个人看。', type: 'description' },
            { speaker: 'npc', text: '「唐门的客，先喝茶。」她唇角一挑，眼里带笑，话里带刺，「三盏里只有一盏没毒。敢端哪盏，端哪盏——不敢端，门在那边。」' },
            { speaker: 'narrator', text: '说完她侧头看你，意思明白：人是你请来的，这茶是毒是礼，你开口。', type: 'description' },
            { speaker: 'player_select', text: '你如何撮合？', options: [
                { text: '「她敢端你的茶，你敢斟她的盏。这一局，别论毒，论人。」', effect: 'mediate', affection: 3 },
                { text: '替她们互相传一句对方的好', effect: 'convey', affection: 2 },
                { text: '「我先回避，你们自己谈。」', effect: 'leave', affection: 1 }
            ]}
        ],
        effects: function(npc, choice) { return _applyBridgeEffects(npc, choice, '晏万解'); }
    },
    // ---- 瀛晚照：在蓬莱观汐台接待情敌 ----
    'pl_event_bridge': {
        id: 'pl_event_bridge', npcId: 'sect_leader_蓬莱派', title: '观汐论交', icon: '🌊',
        desc: '观汐台上两盏海茶，她把二十年的图录推到了那人面前。',
        minAffection: 50, trigger: { random: 1.0 }, cooldown: BRIDGE_COOLDOWN_DAYS, flag: 'pl_e_bridge_cd',
        requireEventDone: 'pl_event_rival', requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你递了信出去。三日后，那位如约到了蓬莱——她在观汐台待客：两盏海茶，一人一盏，潮正涨到一线，像约好的。', type: 'description' },
            { speaker: 'narrator', text: '恰逢海上起海市。她录罢楼影，忽然把图录朝那人推了过去——二十年的册子，除了她自己，蓬莱没人碰过。', type: 'description' },
            { speaker: 'npc', text: '「一百三十九次，我都记下了。」她报着数目，把册子又推近半寸，「那个人的时辰，上头页页有。你翻——翻到哪页，算哪页。」' },
            { speaker: 'narrator', text: '说完她侧头看你，意思明白：人是你请来的，这册子是开是合，你开口。', type: 'description' },
            { speaker: 'player_select', text: '你如何撮合？', options: [
                { text: '「她肯把二十年推给你翻，你敢接这一册。这一局，别论潮，论人。」', effect: 'mediate', affection: 3 },
                { text: '替她们互相传一句对方的好', effect: 'convey', affection: 2 },
                { text: '「我先回避，你们自己谈。」', effect: 'leave', affection: 1 }
            ]}
        ],
        effects: function(npc, choice) { return _applyBridgeEffects(npc, choice, '瀛晚照'); }
    },
    // ---- 祁清禅：在恒山白云庵客堂接待情敌 ----
    'heng_event_bridge': {
        id: 'heng_event_bridge', npcId: 'sect_leader_恒山派', title: '白云庵论交', icon: '🪷',
        desc: '白云庵的客堂里，两盏白云草茶，木鱼摆在两盏之间。',
        minAffection: 50, trigger: { random: 1.0 }, cooldown: BRIDGE_COOLDOWN_DAYS, flag: 'heng_e_bridge_cd',
        requireEventDone: 'heng_event_rival', requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你递了信出去。三日后，那位如约到了恒山——她在白云庵的客堂待客：两盏白云草茶，一人一盏，晨钟刚落，香烟直直地悬着。', type: 'description' },
            { speaker: 'narrator', text: '她没带戒堂的记录，也没提戒——白云庵待客不谈戒，是她最高的礼。案上只摆着那只旧木鱼，摆在两盏茶的正中间。', type: 'description' },
            { speaker: 'npc', text: '「坐。」她把茶推过去，茶是热的，「戒管我，不管客。你既进了白云庵的门——就是客。」' },
            { speaker: 'narrator', text: '说完她看向你，意思明白：人是你请来的，经函是开是合，你开口。', type: 'description' },
            { speaker: 'player_select', text: '你如何撮合？', options: [
                { text: '「你们两个，一个守戒，一个守心。别互相难为。」', effect: 'mediate', affection: 3 },
                { text: '替她们互相传一句对方的好', effect: 'convey', affection: 2 },
                { text: '「我先回避，你们自己谈。」', effect: 'leave', affection: 1 }
            ]}
        ],
        effects: function(npc, choice) { return _applyBridgeEffects(npc, choice, '祁清禅'); }
    },
    // ---- 岳清晓：在泰山玉皇顶火坛边接待情敌 ----
    'tai_event_bridge': {
        id: 'tai_event_bridge', npcId: 'sect_leader_泰山派', title: '火坛论交', icon: '🔥',
        desc: '玉皇顶的火坛边，她破例多备了一个挡风的位置。',
        minAffection: 50, trigger: { random: 1.0 }, cooldown: BRIDGE_COOLDOWN_DAYS, flag: 'tai_e_bridge_cd',
        requireEventDone: 'tai_event_rival', requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你递了信出去。三日后，那位如约到了泰山——她在玉皇顶的火坛边待客：炭拨得通红，两盏风灯，一人一盏，风从东边来，她用身子挡着。', type: 'description' },
            { speaker: 'narrator', text: '火坛左手边三百年没站过人——今日她在左手位外的雪地上，拿炭笔划了一道线，划得很直，像划一条火界。', type: 'description' },
            { speaker: 'npc', text: '「火坛的规矩，迎旭向火，不背火。」她把火钩往雪里一插，话快得像常，「站到这儿的，都是客——客向火，我向东方。谁心里有杂，火先照出来。」' },
            { speaker: 'narrator', text: '说完她侧头看你，意思明白：人是你请来的，这火是仪是礼，你开口。', type: 'description' },
            { speaker: 'player_select', text: '你如何撮合？', options: [
                { text: '「她守了一千次火，你也守过你的人。这一局，别论火，论人。」', effect: 'mediate', affection: 3 },
                { text: '替她们互相传一句对方的好', effect: 'convey', affection: 2 },
                { text: '「我先回避，你们自己谈。」', effect: 'leave', affection: 1 }
            ]}
        ],
        effects: function(npc, choice) { return _applyBridgeEffects(npc, choice, '岳清晓'); }
    },
    // ---- 幽翠微：在青城松风观后山茶园接待情敌 ----
    'qing_event_bridge': {
        id: 'qing_event_bridge', npcId: 'sect_leader_青城派', title: '茶园论交', icon: '🍃',
        desc: '松风观后山茶园，焙房前两只新盏，旧罐摆在中间。',
        minAffection: 50, trigger: { random: 1.0 }, cooldown: BRIDGE_COOLDOWN_DAYS, flag: 'qing_e_bridge_cd',
        requireEventDone: 'qing_event_rival', requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你递了信出去。三日后，那位如约到了青城——她在松风观后山的茶园待客：焙房前两只小凳、两只新盏，灶上刚坐的水，头一道香正要出来。', type: 'description' },
            { speaker: 'narrator', text: '架顶那只旧罐取了下来，摆在两人正中间——她没说这罐里的茶给谁不给谁，罐口开着，让香气先说话。', type: 'description' },
            { speaker: 'npc', text: '「青城待客，先喝茶。」她斟茶，手很稳，话很快，「茶不骗人——心里有没有杂，一啜自己知道。敢端的端，不敢端的，灶在那边，烤火去。」' },
            { speaker: 'narrator', text: '说完她侧头看你，意思明白：人是你请来的，这罐是开是合，你开口。', type: 'description' },
            { speaker: 'player_select', text: '你如何撮合？', options: [
                { text: '「她肯把旧罐摆到你们中间，你敢接这一盏。这一局，别论茶，论人。」', effect: 'mediate', affection: 3 },
                { text: '替她们互相传一句对方的好', effect: 'convey', affection: 2 },
                { text: '「我先回避，你们自己谈。」', effect: 'leave', affection: 1 }
            ]}
        ],
        effects: function(npc, choice) { return _applyBridgeEffects(npc, choice, '幽翠微'); }
    },
    // ---- 奚湘筠：在衡山回雁琴台接待情敌 ----
    'xiang_event_bridge': {
        id: 'xiang_event_bridge', npcId: 'sect_leader_衡山派', title: '琴台论交', icon: '🌧️',
        desc: '回雁琴台的夜雨里，半阙拉给两个人听。',
        minAffection: 50, trigger: { random: 1.0 }, cooldown: BRIDGE_COOLDOWN_DAYS, flag: 'xiang_e_bridge_cd',
        requireEventDone: 'xiang_event_rival', requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你递了信出去。三日后，那位如约到了衡山——她在回雁琴台待客：夜雨细密，台上两只蒲团，一人一只，灯芯剪得亮。', type: 'description' },
            { speaker: 'narrator', text: '她没说话，抱胡琴在臂弯，取出松香擦了三下——然后拉那半阙《潇湘夜雨》。今夜的半阙没有停在老地方，多行了半板，停在两个人面前。', type: 'description' },
            { speaker: 'npc', text: '「曲子替我说话。」弓尖虚搭在弦上，她的声音慢得像常，「听雨，听曲——琴台上没有敌人，只有听客。」' },
            { speaker: 'narrator', text: '说完她看向你，意思明白：人是你请来的，曲子是续是停，你开口。', type: 'description' },
            { speaker: 'player_select', text: '你如何撮合？', options: [
                { text: '「她把十年的半阙拉给你们两个听。这一局，别论曲，论人。」', effect: 'mediate', affection: 3 },
                { text: '替她们互相传一句对方的好', effect: 'convey', affection: 2 },
                { text: '「我先回避，你们自己谈。」', effect: 'leave', affection: 1 }
            ]}
        ],
        effects: function(npc, choice) { return _applyBridgeEffects(npc, choice, '奚湘筠'); }
    },
    // ---- 耿雪衣：在血手门药庐篱笆口接待情敌（v20.77） ----
    'xue_event_bridge': {
        id: 'xue_event_bridge', npcId: 'sect_leader_血手门', title: '篱笆口论交', icon: '🌿',
        desc: '药庐篱笆口两只矮凳，那一沓方纸摆在两只碗中间。',
        minAffection: 50, trigger: { random: 1.0 }, cooldown: BRIDGE_COOLDOWN_DAYS, flag: 'xue_e_bridge_cd',
        requireEventDone: 'xue_event_rival', requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你递了信出去。三日后，那位如约到了血手门——她在药庐篱笆口待客：两只矮凳，两碗井水，碗沿的豁口都朝着她自己那边。晒药匾摊在篱笆边，一畦白药清香，把廊下飘过来的血腥气顶得干干净净。', type: 'description' },
            { speaker: 'narrator', text: '她没提门里的暗事，也没报数目——药庐待客只谈天气和药，是她最高的礼。那一沓方纸从屋里取了出来，摆在两只碗的正中间，最上头一张，是新开的伤风方子。', type: 'description' },
            { speaker: 'npc', text: '「坐。」她把水推过去，声音平得像报数目，「药庐的规矩：榻上躺的是伤口，篱笆外站的是客。」她蹲下去翻药，「今天的日头好——晒药正好，晒开些难开的东西，也正好。」' },
            { speaker: 'narrator', text: '说完她抬头看你，意思明白：人是你请来的，这一沓方纸是开是合，你开口。', type: 'description' },
            { speaker: 'player_select', text: '你如何撮合？', options: [
                { text: '「她肯把方纸摆到你们中间，你敢翻头一张。这一局，别论药，论人。」', effect: 'mediate', affection: 3 },
                { text: '替她们互相传一句对方的好', effect: 'convey', affection: 2 },
                { text: '「我先回避，你们自己谈。」', effect: 'leave', affection: 1 }
            ]}
        ],
        effects: function(npc, choice) { return _applyBridgeEffects(npc, choice, '耿雪衣'); }
    },
    // ---- 拓银沙：在飞蝎坞坞外沙丘接待情敌（v20.77） ----
    'xie_event_bridge': {
        id: 'xie_event_bridge', npcId: 'sect_leader_飞蝎坞', title: '沙丘论交', icon: '🌌',
        desc: '坞外沙丘上一囊沙水，她头一碗斟给了那人。',
        minAffection: 50, trigger: { random: 1.0 }, cooldown: BRIDGE_COOLDOWN_DAYS, flag: 'xie_e_bridge_cd',
        requireEventDone: 'xie_event_rival', requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你递了信出去。三日后，那位如约到了飞蝎坞——她把客待在了坞外的沙丘上：两张毡子，一囊沙水，金蝎伏在两人中间的沙脊上，尾钩搭着，没翘。沙海尽头的星子一颗一颗亮上来，坞里的黄泥墙远远伏在坡下。', type: 'description' },
            { speaker: 'narrator', text: '她没带蝎册上桌——册子勒在怀里，牛皮边角露着，她按了一把，先声明：「册子不进沙丘。丘上不论账。」水囊摆在两张毡子中间，一人半碗，斟酒的架势，斟的是水。', type: 'description' },
            { speaker: 'npc', text: '「沙漠里待客，先分水。」她给那人斟了头一碗，自己后斟，嗓门照旧亮，「喝了我的水，就是客。客要是在丘上蛰人——」她咧嘴一笑，把后半句咽了，改口，「算了，今晚不吓唬客。」' },
            { speaker: 'narrator', text: '说完她侧头看你，意思明白：人是你请来的，这一囊水是分是不分，你开口。', type: 'description' },
            { speaker: 'player_select', text: '你如何撮合？', options: [
                { text: '「她肯把头一碗水斟给你，你敢把这半碗喝干。这一局，别论册，论人。」', effect: 'mediate', affection: 3 },
                { text: '替她们互相传一句对方的好', effect: 'convey', affection: 2 },
                { text: '「我先回避，你们自己谈。」', effect: 'leave', affection: 1 }
            ]}
        ],
        effects: function(npc, choice) { return _applyBridgeEffects(npc, choice, '拓银沙'); }
    },
    // ---- 伏璃茵：在烈日教圣火龛后廊接待情敌（v20.77） ----
    'lie_event_bridge': {
        id: 'lie_event_bridge', npcId: 'sect_leader_烈日教', title: '龛后论交', icon: '🔥',
        desc: '圣火龛后廊两只蒲团，吐槽役的场子头一回开了双席。',
        minAffection: 50, trigger: { random: 1.0 }, cooldown: BRIDGE_COOLDOWN_DAYS, flag: 'lie_e_bridge_cd',
        requireEventDone: 'lie_event_rival', requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你递了信出去。三日后，那位如约到了烈日教——她把客待在了圣火龛的后廊：两只蒲团，一壶白开水，龛火隔着一道墙，火光从窗棂里筛出来，一线一线的红。她没穿全副仪装，圣女冠没戴——摘冠待客，十四年头一回。', type: 'description' },
            { speaker: 'narrator', text: '那只檀木匣摆在两只蒲团中间，匣盖合着，没开。她起先坐得笔直，圣女腔融金，一句一顿；说到第三句撑不住了，语速「唰」地换档：「算了算了，后廊没有教众，只有观众——坐，都坐随意些，蒲团是旧的，干净。」', type: 'description' },
            { speaker: 'npc', text: '「吐槽役今晚加开一场，客座一名。」她给两人斟白开水，斟得四平八稳，嘴上不饶人，「丑话说前头：这一场的段子不损人，只损事——损完了，谁也不许记仇。」她瞥了那人一眼，又瞥你一眼，「都听明白了？明白就开讲。」' },
            { speaker: 'narrator', text: '说完她侧头看你，意思明白：人是你请来的，这一场是开是散，你开口。', type: 'description' },
            { speaker: 'player_select', text: '你如何撮合？', options: [
                { text: '「她肯摘了冠开这场子，你敢接这个蒲团。这一局，别论仪，论人。」', effect: 'mediate', affection: 3 },
                { text: '替她们互相传一句对方的好', effect: 'convey', affection: 2 },
                { text: '「我先回避，你们自己谈。」', effect: 'leave', affection: 1 }
            ]}
        ],
        effects: function(npc, choice) { return _applyBridgeEffects(npc, choice, '伏璃茵'); }
    },
    // ---- 檀望舒：在天龙教传声房旧档房接待情敌（v20.77） ----
    'long_event_bridge': {
        id: 'long_event_bridge', npcId: 'sect_leader_天龙教', title: '档房论交', icon: '🗣️',
        desc: '旧档房两碗枣茶，半面残铜镜朝上摆在两人中间。',
        minAffection: 50, trigger: { random: 1.0 }, cooldown: BRIDGE_COOLDOWN_DAYS, flag: 'long_e_bridge_cd',
        requireEventDone: 'long_event_rival', requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你递了信出去。三日后，那位如约到了天龙教——她把客待在了传声房的旧档房：两碗枣茶冒着热气，满墙的旧铜镜牌一盏灯下排成一排，那半面残铜镜摆在两只碗的正中间，镜面朝上。档房的老仆说，这面镜子扣了半月，从没朝上过待客的案。', type: 'description' },
            { speaker: 'narrator', text: '她坐在里侧，腰间的铜镜牌摘下来，搁在镜子旁边，牌面朝下——传声房的规矩，待客不验牌。灯芯挑得亮，两个人的影子在档房的墙上并排坐着。', type: 'description' },
            { speaker: 'npc', text: '她开口，先借云婆婆的哑嗓迎客：（用云婆婆的调子）「娃儿们，枣茶烫，吹一吹再喝。」传完换知客腔，一字一字，很正式：（用黑袍知客的调子）「传声房传百口声，今晚只传一句——百声皆供教用，今晚的声，供客。」传完自己先松了半分，换孩子的稚声补了半句：（用孩子的调子）「镜子朝上的事，不许问。」' },
            { speaker: 'narrator', text: '说完她侧头看你，意思明白：人是你请来的，这面镜子是朝上是朝下，你开口。', type: 'description' },
            { speaker: 'player_select', text: '你如何撮合？', options: [
                { text: '「她肯把镜子朝上摆到你们中间，你敢看这半张脸。这一局，别论声，论人。」', effect: 'mediate', affection: 3 },
                { text: '替她们互相传一句对方的好', effect: 'convey', affection: 2 },
                { text: '「我先回避，你们自己谈。」', effect: 'leave', affection: 1 }
            ]}
        ],
        effects: function(npc, choice) { return _applyBridgeEffects(npc, choice, '檀望舒'); }
    },
    // ---- 戚巧机：在神机门工坊接待情敌（v20.78） ----
    'sj_event_bridge': {
        id: 'sj_event_bridge', npcId: 'sect_leader_神机门', title: '工坊论交', icon: '⚙️',
        desc: '工坊里两只矮凳，机关雀摆在两只凳子的正中间。',
        minAffection: 50, trigger: { random: 1.0 }, cooldown: BRIDGE_COOLDOWN_DAYS, flag: 'sj_e_bridge_cd',
        requireEventDone: 'sj_event_rival', requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你递了信出去。三日后，那位如约到了神机门——她把客待在了图房后头的小工坊：两只矮凳，一壶热水，西墙的齿轮滴答一拍是一拍，像满屋子的人在各自岗位上陪着。机关雀立在两只凳子的正中间，墨晶的眼转了转，认了认客，又认了认她。', type: 'description' },
            { speaker: 'narrator', text: '她没提图房的差事，也没背齿数比——工坊待客只听滴答，是她最高的礼。案上的检修册摊开在一页空白上，页角压着那枚刻齿数比的黄铜齿轮，齿面在灯下亮着。', type: 'description' },
            { speaker: 'npc', text: '「坐。」她给两人斟水，短句，平得像登册体，「工坊的规矩：案上是游隙，屋里是人。进了这个门——就是客。」她蹲下去给雀的翼簧上油，「滴答不骗人，谁心里有杂，雀先听出来。听开了，杂音自己就顺了。」' },
            { speaker: 'narrator', text: '说完她抬头看你，意思明白：人是你请来的，这一堂雀课是开是散，你开口。', type: 'description' },
            { speaker: 'player_select', text: '你如何撮合？', options: [
                { text: '「她肯把机关雀摆到你们中间，你敢听这头一拍滴答。这一局，别论机关，论人。」', effect: 'mediate', affection: 3 },
                { text: '替她们互相传一句对方的好', effect: 'convey', affection: 2 },
                { text: '「我先回避，你们自己谈。」', effect: 'leave', affection: 1 }
            ]}
        ],
        effects: function(npc, choice) { return _applyBridgeEffects(npc, choice, '戚巧机'); }
    },
    // ---- 裘霜莺：在铁掌帮苇滩堤上接待情敌（v20.78） ----
    'tz_event_bridge': {
        id: 'tz_event_bridge', npcId: 'sect_leader_铁掌帮', title: '苇滩论交', icon: '🐦',
        desc: '苇滩外两只小凳，那包炒菱角摆在两只凳子中间。',
        minAffection: 50, trigger: { random: 1.0 }, cooldown: BRIDGE_COOLDOWN_DAYS, flag: 'tz_e_bridge_cd',
        requireEventDone: 'tz_event_rival', requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你递了信出去。三日后，那位如约到了铁掌帮——她把客待在了苇滩外的堤上：两只小凳，一壶湖水，荷叶包的炒菱角摆在两只凳子的正中间，包得方方正正。滩上的雀群起了又落，落了又起，像替谁打着拍子。', type: 'description' },
            { speaker: 'narrator', text: '她没提帮里的差事，腰后那排差事哨全数留在了小屋——水寨待客只分菱角、不吹差事哨，是她最高的礼。八窑那支半声哨取下来搁在凳角，哨身擦得干干净净。', type: 'description' },
            { speaker: 'npc', text: '「坐。」她把头一把菱角分给那人，后一把分给你，凶腔，话短，「吃了我的菱角，就是客。客不许在滩上蛰人——今晚这滩上没有敌人，只有客。」她把手在衣襟上擦了擦，耳根有点红，「菱角烫。吹一吹再吃。」' },
            { speaker: 'narrator', text: '说完她侧头看你，意思明白：人是你请来的，这一包菱角是分是不分，你开口。', type: 'description' },
            { speaker: 'player_select', text: '你如何撮合？', options: [
                { text: '「她肯把头一把菱角分给你，你敢接这半张荷叶。这一局，别论哨，论人。」', effect: 'mediate', affection: 3 },
                { text: '替她们互相传一句对方的好', effect: 'convey', affection: 2 },
                { text: '「我先回避，你们自己谈。」', effect: 'leave', affection: 1 }
            ]}
        ],
        effects: function(npc, choice) { return _applyBridgeEffects(npc, choice, '裘霜莺'); }
    },
    // ---- 姬云锦：在昆仑派崖畔舞台接待情敌（v20.78） ----
    'kl_event_bridge': {
        id: 'kl_event_bridge', npcId: 'sect_leader_昆仑派', title: '舞台论交', icon: '🌲',
        desc: '崖畔舞台两只蒲团，她为客起了半式「迎雪」。',
        minAffection: 50, trigger: { random: 1.0 }, cooldown: BRIDGE_COOLDOWN_DAYS, flag: 'kl_e_bridge_cd',
        requireEventDone: 'kl_event_rival', requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你递了信出去。三日后，那位如约到了昆仑——她把客待在了崖畔的舞台：两只蒲团，一壶雪水，崖端那株老松枝上覆着雪。她束起素绸舞袖，双环扣，扣人的那环是活结——然后当着客人的面起剑，跳了半式「迎雪」。舞台的古礼「不舞于生人」，她为这半式，破了第二回。', type: 'description' },
            { speaker: 'narrator', text: '她没论仪轨，也没念注脚——昆仑待客以开舞为礼，是她最高的礼。舞谱摊在石案上，翻到「迎雪」的注脚页：雪落剑先迎，山答人后应。剑架旁那柄客剑让她请了出来，与舞剑并挂在一处。', type: 'description' },
            { speaker: 'npc', text: '「舞是祭山的仪。」她收剑，掌门腔端得平稳，只有耳根微红，「今晚这半式，不祭山，不祭天——祭客。看过我舞的，都是客；客谱上的顿处，今晚不必顿。」' },
            { speaker: 'narrator', text: '说完她看向你，意思明白：人是你请来的，这半式是续是收，你开口。', type: 'description' },
            { speaker: 'player_select', text: '你如何撮合？', options: [
                { text: '「她肯为你们起半式迎雪，你敢把这半式读完。这一局，别论仪，论人。」', effect: 'mediate', affection: 3 },
                { text: '替她们互相传一句对方的好', effect: 'convey', affection: 2 },
                { text: '「我先回避，你们自己谈。」', effect: 'leave', affection: 1 }
            ]}
        ],
        effects: function(npc, choice) { return _applyBridgeEffects(npc, choice, '姬云锦'); }
    },
    // ---- 翀玉衡：在全真教重阳宫功录房接待情敌（v20.78） ----
    'qz_event_bridge': {
        id: 'qz_event_bridge', npcId: 'sect_leader_全真教', title: '功录房论交', icon: '🧮',
        desc: '功录房案上两盏素茶，那具小银算盘头一回离了腰间，摆在案心。',
        minAffection: 50, trigger: { random: 1.0 }, cooldown: BRIDGE_COOLDOWN_DAYS, flag: 'qz_e_bridge_cd',
        requireEventDone: 'qz_event_rival', requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你递了信出去。三日后，那位如约到了全真教——她把客待在了重阳宫功录房：两盏素茶冒着热气，那具小银算盘从腰间摘下来，摆在案心正对两人的位子——柜台之外，算盘不上案，这是她今晚自己破的例。', type: 'description' },
            { speaker: 'narrator', text: '她没谈外账，也没拨珠——功录房待客只分茶、不记账，是她最高的礼。功业日记摊在最末一页空白上，栏头还没落，笔搁在笔山上，笔尖朝外，是把账给人看的架势。', type: 'description' },
            { speaker: 'npc', text: '「坐。」她把茶推过去，账房腔，一字一板，「功录房的规矩：外账认债，客账认人。进了这个门——茶一人一盏，今晚不记债。」她顿了顿，把案心的算盘又摆正了半分，「算盘离了腰。离了腰，它就不是法器，是俗物——俗物陪客，正好。」' },
            { speaker: 'narrator', text: '说完她侧头看你，意思明白：人是你请来的，这一页空白栏是立是收，你开口。', type: 'description' },
            { speaker: 'player_select', text: '你如何撮合？', options: [
                { text: '「她肯把那页空白栏摆到案心，你敢陪她坐完这盏茶。这一局，别论债，论人。」', effect: 'mediate', affection: 3 },
                { text: '替她们互相传一句对方的好', effect: 'convey', affection: 2 },
                { text: '「我先回避，你们自己谈。」', effect: 'leave', affection: 1 }
            ]}
        ],
        effects: function(npc, choice) { return _applyBridgeEffects(npc, choice, '翀玉衡'); }
    },
    // ---- 竺照禅：在少林寺下院栴檀林接待情敌（v20.79） ----
    'shao_event_bridge': {
        id: 'shao_event_bridge', npcId: 'sect_leader_少林寺', title: '栴檀林论交', icon: '📿',
        desc: '栴檀林经案上两盏素茶，批注经摊在那页落不下批的空白上——头一回开给客看。',
        minAffection: 50, trigger: { random: 1.0 }, cooldown: BRIDGE_COOLDOWN_DAYS, flag: 'shao_e_bridge_cd',
        requireEventDone: 'shao_event_rival', requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你递了信出去。三日后，那位如约到了少林——她把客待在了下院栴檀林：两只蒲团，两盏素茶，庵外的栴檀叶子被风翻得一响一响。那函批注经摊在经案正中间，摊开的不是戒页，不是功课页，是那页落不下批的空白——她的旁批比原文毒，满寺没人挨过她的批不认账；这页空白，今晚开给客看。', type: 'description' },
            { speaker: 'narrator', text: '她没提寺里的戒律，也没讲经——栴檀林待客只斟茶、不讲戒，是她最高的礼。念珠从腕上取下来，搁在蒲团角上，盘得发亮的珠子今晚安安静静。寺务归方丈释玄慈，戒律归她；今晚这间下院不归谁管——只归一个主人待客。', type: 'description' },
            { speaker: 'npc', text: '「坐。」她给两人斟茶，先合十念了一声「阿弥陀佛」，佛号是稳的，毒舌今晚收着锋，「栴檀林的规矩：戒管少林的出家人，茶管进了这道庵门的。进了这个门——都是客。」她把茶推过去，「贫尼的嘴毒，毒在批注里——骂谁，是把谁当自己人教。今晚不教，只吃茶。」' },
            { speaker: 'narrator', text: '说完她侧头看你，意思明白：人是你请来的，这一函经是开是合，你开口。', type: 'description' },
            { speaker: 'player_select', text: '你如何撮合？', options: [
                { text: '「她肯把那页落不下批的空白开在案心，你敢陪她坐完这盏茶。这一局，别论戒，论人。」', effect: 'mediate', affection: 3 },
                { text: '替她们互相传一句对方的好', effect: 'convey', affection: 2 },
                { text: '「我先回避，你们自己谈。」', effect: 'leave', affection: 1 }
            ]}
        ],
        effects: function(npc, choice) { return _applyBridgeEffects(npc, choice, '竺照禅'); }
    }
};

// ============ 统一效果：按当前配对档位推进 + 每位女主角独立声口文案 ============
function _playerTa() { return (window.currentCharData && window.currentCharData.gender === 'female') ? '她' : '他'; }

// 档位判定（统一），返回 tier key
function _resolveBridgeTier(bRel, bStr, aRel, aStr, choice) {
    if (aRel === 'friend' && aStr >= BRIDGE_INTIMATE_STRENGTH) return 'intimate';
    if (aRel === 'friend' && bRel !== 'friend') return 'friend_form';
    if (aRel === 'friend' && bRel === 'friend') return 'friend_deepen';
    if (bRel === 'enemy' && (aRel === 'neutral' || aStr < bStr)) {
        return (choice === 'leave') ? 'enemy_leave' : 'enemy_ease';
    }
    if (bRel === 'neutral' || (bRel === 'enemy' && aRel === 'neutral')) return 'neutral_warm';
    return 'neutral_warm';
}

// 每位女主角 × 档位 独立文案（去模板化）
var _BRIDGE_TIER_MSGS = {
    'sect_leader_百花谷': { // 温蘅：医者/药茶声口
        enemy_ease: function(r){ return '温蘅收了冷脸，给'+r+'续了一杯茶——这是头一回，她把那人当客人，不当敌。药庐的灯，今晚为两个人亮着。再论交几回，或可放下。'; },
        enemy_leave: function(r){ return '你回避了。两个女人独在药庐——没动手，但也没谈拢。温蘅出来时笑眼是凉的：「下次别让她一个人来。」茶凉在桌上，没人收。'; },
        neutral_warm: function(r){ return '温蘅送'+r+'出门，破天荒说了句「慢走」。她回身揉了揉太阳穴：「医者不自医，我倒给自己添了心病。」再撮合几回，或可成友。'; },
        friend_form: function(r){ return '温蘅把那只客用杯子推给'+r+'：「往后，你也是我这药庐的客。」——她把对方的名字，记进了那本只记弟子的册子。敌意散了，留的是同病相怜。你这一局，撮合成了。'; },
        friend_deepen: function(r){ return '她俩交换关于'+_playerTa()+'的糗事，温蘅笑得被茶呛到：「'+_playerTa()+'竟也怕苦？」'+r+'答：「我那碗药，'+_playerTa()+'一滴没剩。」两人笑成一团。再论交几回，或可结金兰。'; },
        intimate: function(r){ return '温蘅给'+r+'把了脉，又让'+r+'给她把了脉——两个医者互诊。「你的心脉，比我乱。」温蘅笑。「彼此彼此。」'+r+'答。她们在一壶药茶里结了金兰——此后药庐的客杯，永远备两只。'+_playerTa()+'来时，再不争先后，只论姊妹。'; }
    },
    'sect_leader_修罗宫': { // 绯泪：断簪/寒冰声口
        enemy_ease: function(r){ return '绯泪收了指尖的寒意，给'+r+'倒了一杯茶——没说话，但茶是热的。修罗宫的寒，今晚让了一线。再论交几回，或可放下。'; },
        enemy_leave: function(r){ return '你回避了。大殿里两个女人没拔刀，但也没说话。绯泪出来时眼神冷得能冻血：「下次，别让她一个人来修罗宫。」'; },
        neutral_warm: function(r){ return '绯泪送'+r+'出殿，破天荒没背手：「……慢走。」她回身把那根断簪在掌心转了一圈，收进袖里。再撮合几回，或可成友。'; },
        friend_form: function(r){ return '绯泪把那根修好的断簪递给'+r+'看：「金线是我接的。」'+r+'看了一眼：「接得真丑。」绯泪竟笑了——两个被'+_playerTa()+'伤过的人，在一根簪子上停了战。你这一局，撮合成了。'; },
        friend_deepen: function(r){ return '她俩交换关于'+_playerTa()+'的糗事，绯泪罕见地笑出声：「'+_playerTa()+'怕黑？」'+r+'答：「路灯是'+_playerTa()+'那盏。」两人对视，都先别开了脸——怕对方看见自己眼底的暖。再论交几回，或可结金兰。'; },
        intimate: function(r){ return '绯泪把那根断簪掰成两截——一截递给'+r+'，一截自己留。「各拿一半。」她轻声，「从前我说谁也不欠谁，是对敌人。这回——是对姊妹。」修罗宫头一回，有了不靠寒冰维系的关系。'+_playerTa()+'来时，她俩再不争先后，只论姊妹。'; }
    },
    'sect_leader_天山派': { // 琤霄凌：霜鸣/双剑声口
        enemy_ease: function(r){ return '霄凌手按霜鸣鞘，没拔。她给'+r+'让了半步进雪庐——这是头一回，她让情敌近她的剑。再论交几回，或可放下。'; },
        enemy_leave: function(r){ return '你回避了。雪庐里两柄剑没出鞘，但剑意在空气里绞成一团。霄凌出来时手按鞘：「下次，别让她一个人进雪庐。」'; },
        neutral_warm: function(r){ return '霄凌送'+r+'出庐，破天荒扫了条道：「……雪大，慢走。」她回身把霜鸣挂回中龛，指腹在裂纹上停了一瞬。再撮合几回，或可成友。'; },
        friend_form: function(r){ return '霄凌把霜鸣从墙上取下，让'+r+'看那道裂纹：「这是师姐留的。」'+r+'没说话，只把自己的剑也挂上庐墙——两柄剑并挂。「你的剑，也认了主。」霄凌轻声。你这一局，撮合成了。'; },
        friend_deepen: function(r){ return '她俩交换关于'+_playerTa()+'的糗事，霄凌难得露出少年气：「'+_playerTa()+'练『雪落』腕太软。」'+r+'答：「'+_playerTa()+'那招我也看过。」两人在雪庐笑，霜鸣在墙上轻鸣一声。再论交几回，或可结金兰。'; },
        intimate: function(r){ return '霄凌把霜鸣横在两人之间，让'+r+'握住剑鞘——两双手叠在霜鸣上。「师姐让我把它练成。」霄凌哑声，「我练了十二年。今天，它认了第二个人。」霜鸣轻鸣，像在应。两柄剑从此并挂雪庐，不饮血，只应和。'+_playerTa()+'来时，她俩再不争先后，只论姊妹。'; }
    },
    'sect_leader_五仙教': { // 蓝凤凰：心蛊/蝶声口
        enemy_ease: function(r){ return '蓝凤凰锁骨下的黑纹鼓了一下又安静。她给'+r+'让了座——「五仙教待客，不喂蛊。」心蛊认得出，眼前这人也喂过'+_playerTa()+'。再论交几回，或可放下。'; },
        enemy_leave: function(r){ return '你回避了。蛊窟里黑纹在她俩之间鼓动，没破壳。蓝凤凰出来时妖媚的笑是凉的：「下次别让她一个人进蛊窟——心蛊不挑嘴。」'; },
        neutral_warm: function(r){ return '蓝凤凰送'+r+'出窟，破天荒没拿忘情散：「……慢走。」她回身把那只空蛊瓮推了推——像在想让谁也能往里看一眼。再撮合几回，或可成友。'; },
        friend_form: function(r){ return '蓝凤凰把锁骨下的黑纹给'+r+'看：「心蛊。嗜真情。」'+r+'看了很久：「我也喂过'+_playerTa()+'。」「那它认得你。」蓝凤凰轻声——心蛊在两人之间，第一次没朝一人鼓动。你这一局，撮合成了。'; },
        friend_deepen: function(r){ return '她俩交换关于'+_playerTa()+'的糗事，蓝凤凰笑得花枝乱颤：「'+_playerTa()+'怕我的心蛊？」'+r+'答：「'+_playerTa()+'连忘情散都敢夺。」两人笑——黑纹安安静静，像也听懂了。再论交几回，或可结金兰。'; },
        intimate: function(r){ return '蓝凤凰把那只空蛊瓮推到'+r+'面前：「从前我等它装心蛊。今天，我想让它装点别的。」'+r+'懂了，把自己的一缕真气也渡进瓮里。心蛊在她俩之间化成一只银蝶，绕两人飞了一圈——不再噬谁，只随她们。「姊妹的蛊，不噬人。」蓝凤凰轻声。'+_playerTa()+'来时，她俩再不争先后，只论姊妹。'; }
    },
    'sect_leader_峨眉派': { // 夙孤鸿：戒尺/名签/金顶夜巡声口
        enemy_ease: function(r){ return '夙孤鸿的戒尺没有动。她给'+r+'续了一盏茶——热的。这是头一回，她把那人当客，不当罪人。戒堂的灯，今晚为两个人亮着。再论交几回，或可放下。'; },
        enemy_leave: function(r){ return '你回避了。戒堂里两人没动尺，但茶凉在了案上。夙孤鸿出来时神色如常，只在阶前停了一停：「下次，别让她一个人上金顶。——夜里风大。」'; },
        neutral_warm: function(r){ return '夙孤鸿送'+r+'到山门，破天荒没念送客戒：「……山路滑，慢走。」她回身把那把木戒尺摆回案上，摆正了，又挪了半寸。再撮合几回，或可成友。'; },
        friend_form: function(r){ return '夙孤鸿把戒尺尾那片空白给'+r+'看：「第七条，师父没刻，我也没刻。」'+r+'看了很久：「不刻的，比刻了的狠。」她竟笑了一下——两个被'+_playerTa()+'伤过的人，在一段空白上停了战。你这一局，撮合成了。'; },
        friend_deepen: function(r){ return '她俩交换关于'+_playerTa()+'的糗事，夙孤鸿难得笑出声：「'+_playerTa()+'背戒条，背着背着哭了？」'+r+'答：「'+_playerTa()+'在金顶云海里迷过路，是我领下来的。」灯花哔剥响了一声，两人一齐低头喝茶——都怕对方看见自己眼底的暖。再论交几回，或可结金兰。'; },
        intimate: function(r){ return '夙孤鸿解下鸣鸿剑柄上那条旧红剑穗，三道结——戒、定、慧——她拆开一道，递给'+r+'。「师父系的结。拆了不是弃，是分。」两道结留在她掌心，她只说了一句：「往后'+_playerTa()+'来，不必争先后。问剑就是。」峨眉金顶从此多了一盏长明的灯，是两个人一起点的。'+_playerTa()+'来时，她俩再不争先后，只论姊妹。'; }
    },
    'sect_leader_唐门': { // 晏万解：银针/丹炉/毒谱/手套声口
        enemy_ease: function(r){ return '晏万解把汤色最浊的那盏收回去，给'+r+'换了一盏清的——这是头一回，她待那人不用毒堂的规矩。毒堂的灯，今晚为两个人亮着。再论交几回，或可放下。'; },
        enemy_leave: function(r){ return '你回避了。毒堂里三盏茶没人端，凉在案上。晏万解出来时白手套的指尖在门框上敲了两下：「下次，别让她一个人进毒堂。——我的茶，不等人。」'; },
        neutral_warm: function(r){ return '晏万解送'+r+'出毒堂，破天荒没摆那三盏茶：「……蜀道湿滑，慢走。」她回身把拆了一半的机簧一枚一枚装回去，装完了才吹灯。再撮合几回，或可成友。'; },
        friend_form: function(r){ return '晏万解把自己的毒谱推到'+r+'面前，翻到空白那一页：「你的名记这儿——不记仇家那一栏。」'+r+'看了很久，问记在哪一栏。「解药那一栏。」她说完自己也愣了一下，随即笑了——两个被'+_playerTa()+'伤过的人，在一页空白上停了战。你这一局，撮合成了。'; },
        friend_deepen: function(r){ return '她俩交换关于'+_playerTa()+'的糗事，晏万解笑得被茶呛住：「'+_playerTa()+'试我的毒，试到一半先晕了？」'+r+'答：「'+_playerTa()+'替我煎药，煎糊过三回，第四回才敢端上来。」灯花爆了一声，两人一齐低头喝茶——都怕对方看见自己眼底的暖。再论交几回，或可结金兰。'; },
        intimate: function(r){ return '晏万解从贴身匣子里取出那根银针——淬过她自己腕上的血，替她试毒试了二十二年。她用一线药绸缠好针尾，递到'+r+'面前。「毒我认得你。」她声音很轻，「解药，也该认得。往后进蜀，你若中了旁人的毒，扎一针，针色替我告诉你是什么。」'+r+'没推辞，解下随身的旧物搁在案上，两个人就这么换了。「姊妹的账，两清。」毒堂从此多了一炉不熄的火，是两个人一起看的。'+_playerTa()+'来时，她俩再不争先后，只论姊妹。'; }
    },
    'sect_leader_蓬莱派': { // 瀛晚照：螺/潮信/图录/海市声口
        enemy_ease: function(r){ return '瀛晚照给'+r+'续了一盏海茶——热的。这是头一回，她待那人不用观汐台的客礼，用的是自家人添茶的规矩。台上的灯，今晚为两个人亮着。再论交几回，或可放下。'; },
        enemy_leave: function(r){ return '你回避了。观汐台上两人没争执，海茶却凉在了盏里，图录合着没开。瀛晚照送你下台时只报了一个数：「茶，两盏，都凉了。」顿了顿，又添一句：「下次，别让她一个人上台。——黄昏潮急，台沿滑。」'; },
        neutral_warm: function(r){ return '瀛晚照送'+r+'下台阶，破天荒多说了一个字：「慢。」她回身录今晚的潮，末一笔顿了顿，字比平日小了半分。再撮合几回，或可成友。'; },
        friend_form: function(r){ return '瀛晚照把图录翻到空白页，蘸了笔，推到'+r+'面前：「录一笔。不录怨，录潮。」'+r+'想了想，落笔录下头一回见'+_playerTa()+'的日子。瀛晚照看完那一行，说了句不是数目的话：「录得工整。」两个被'+_playerTa()+'伤过的人，在一页新录上停了战。你这一局，撮合成了。'; },
        friend_deepen: function(r){ return '她俩交换关于'+_playerTa()+'的糗事，瀛晚照头一回连着说了五句：「'+_playerTa()+'误过一回戌时的潮，在礁上站了半夜。」'+r+'答：「'+_playerTa()+'学我摹蜃楼，把楼摹成了船。」海风哗哗翻动图录，两人一齐低头吃茶——都怕对方看见自己眼底的暖。再论交几回，或可结金兰。'; },
        intimate: function(r){ return '这晚海市起得格外大。瀛晚照铺纸，邀'+r+'同摹一座楼——她摹楼身，'+r+'摹楼腰那缕炊烟，合成一幅。收笔时她把图录翻回第一页，蜃楼深处那个模糊的小人影，推到'+r+'面前：「这一页，二十年里看过的人，不满一只手。今日，添一个。」'+r+'看了很久，没有问影子是谁，只说：「楼是真的。」两人就在这幅合摹的蜃楼下结了金兰——往后观汐台的图录匣里，多了一页两人的落款。'+_playerTa()+'来时，她俩再不争先后，只论姊妹。'; }
    },
    'sect_leader_恒山派': { // 祁清禅：木鱼/戒/回向/抄经声口（v20.76）
        enemy_ease: function(r){ return '祁清禅给'+r+'续了一盏茶——热的。这是头一回，她把那人当客，不当业障。客堂的灯，今晚为两个人亮着。再论交几回，或可放下。'; },
        enemy_leave: function(r){ return '你回避了。客堂里两人没争执，白云草茶却凉在了盏里，案上的木鱼没人碰。祁清禅送你下石阶时只说了一句：「茶，两盏，都凉了。」顿了顿，又添一句：「下次，别让她一个人上山。——夜里风大。」'; },
        neutral_warm: function(r){ return '祁清禅送'+r+'到山门，破天荒说了一整句：「石阶有露——慢走。」她回身把那页乱了的经纸一笔一笔抚平，收进了经函。再撮合几回，或可成友。'; },
        friend_form: function(r){ return '祁清禅把经函翻到一页空白，蘸了笔，推到'+r+'面前：「写一行。不写怨——写回向。」'+r+'想了想，落笔录下头一回见'+_playerTa()+'的日子。祁清禅看完那一行，说了句不是佛语的话：「字端正。」两个被'+_playerTa()+'伤过的人，在一页回向上停了战。你这一局，撮合成了。'; },
        friend_deepen: function(r){ return '她俩交换关于'+_playerTa()+'的糗事，祁清禅难得笑出声——笑完自己先怔住：「'+_playerTa()+'晚课打瞌睡？」'+r+'答：「'+_playerTa()+'替我抄经，把我的名字抄错了。」灯花哔剥响了一声，两人一齐低头喝茶——都怕对方看见自己眼底的暖。再论交几回，或可结金兰。'; },
        intimate: function(r){ return '祁清禅取出那只旧木鱼，举槌敲了一声——第二声，她让'+r+'敲。「木鱼不怕裂，怕停。」她很轻地说，「一声给你，一声给我——往后晚课，不停了。」两人在佛灯前合敲了三声，就着木鱼声结了金兰——往后白云庵的客堂，永远备两盏茶。'+_playerTa()+'来时，她俩再不争先后，只论姊妹。'; }
    },
    'sect_leader_泰山派': { // 岳清晓：火坛/档册/拓片/第一缕声口（v20.76）
        enemy_ease: function(r){ return '岳清晓把风灯往'+r+'那边推了半寸——替那人挡了风。这是头一回，她把火坛的风口分人。玉皇顶的炭，今晚拨得比哪天都亮。再论交几回，或可放下。'; },
        enemy_leave: function(r){ return '你回避了。火坛边两人没争执，两盏茶却凉在了风里，档册合着没开。岳清晓下顶时只报了一个数：「灯，两盏，都灭了。」顿了顿，又添一句：「下次，别让她一个人爬十八盘。——寅时霜重。」'; },
        neutral_warm: function(r){ return '岳清晓送'+r+'下顶路，破天荒多说了一整句：「路滑——扶栏。」她回身翻开档册，末一笔顿了顿，字比平日大了半分。再撮合几回，或可成友。'; },
        friend_form: function(r){ return '岳清晓把竹管里的「日」字拓片取出来，展开在'+r+'面前：「拓了十年，就成这一幅。」'+r+'就着晨光看了很久那一横：「光是真的。」她竟笑了，笑声撞在石壁上弹回来——两个被'+_playerTa()+'伤过的人，在一幅拓片上停了战。你这一局，撮合成了。'; },
        friend_deepen: function(r){ return '她俩交换关于'+_playerTa()+'的糗事，岳清晓笑得直拍火坛：「'+_playerTa()+'爬十八盘歇了三回？」'+r+'答：「'+_playerTa()+'陪我看云海，把金梁叫成白梁。」两人对视，一齐仰头看日头——都怕对方看见自己眼底的暖。再论交几回，或可结金兰。'; },
        intimate: function(r){ return '岳清晓在石台上铺开新拓纸，邀'+r+'同拓一幅「日」字——她拓圆廓，'+r+'拓里头那一横，合成一幅。收手时她在档册的空白页上并排写下两个名字——一个大，一个小。「往后这一页，不写独迎了。」两人就在这幅合拓的「日」字下结了金兰——往后玉皇顶的火坛边，多了一对不灭的风灯。'+_playerTa()+'来时，她俩再不争先后，只论姊妹。'; }
    },
    'sect_leader_青城派': { // 幽翠微：旧罐/火候/头一茬声口（v20.76）
        enemy_ease: function(r){ return '幽翠微给'+r+'换了只最热的盏——这是头一回，她待那人不用待客的规矩，用的是自家人续茶的规矩。焙房的灯，今晚为两个人亮着。再论交几回，或可放下。'; },
        enemy_leave: function(r){ return '你回避了。焙房前两人没争执，两盏茶却凉了，旧罐开着没人动。幽翠微出来时茶夹在锅沿上敲了两下：「下次，别让她一个人上山。——我的茶，不等人。」'; },
        neutral_warm: function(r){ return '幽翠微送'+r+'出茶园坡口，破天荒收了半句快话：「蜀道湿——仔细脚下。」她回身重新起了灶，火色比哪一天都稳。再撮合几回，或可成友。'; },
        friend_form: function(r){ return '幽翠微把旧罐揭开，拣出一撮头一茬新茶，分作两个纸包，推一包给'+r+'：「罐是旧的，茶是新的。我的茶给谁，不分敌友——分配不配。」'+r+'看着那纸包看了很久，收进了怀里。两个被'+_playerTa()+'伤过的人，在一撮新茶上停了战。你这一局，撮合成了。'; },
        friend_deepen: function(r){ return '她俩交换关于'+_playerTa()+'的糗事，幽翠微笑得扶着灶台：「'+_playerTa()+'添柴添反了？」'+r+'答：「'+_playerTa()+'替我煎茶，把活火叫成大火。」灶膛哔剥响了一声，两人一齐低头喝茶——都怕对方看见自己眼底的暖。再论交几回，或可结金兰。'; },
        intimate: function(r){ return '幽翠微把旧罐从架顶取下来，揭开盖，推到'+r+'面前：「罐底压着我自己的主意。三十一年，没让外人看过——今日，添一个。」'+r+'看了很久，没有问那页纸是什么，解下随身的旧物搁在灶台上，两个人就这么换了。「姊妹的账，两清。」焙房从此多了一炉不熄的火，是两个人一起看的。'+_playerTa()+'来时，她俩再不争先后，只论姊妹。'; }
    },
    'sect_leader_衡山派': { // 奚湘筠：松香/半阙/琴台声口（只用胡琴语汇，v20.76）
        enemy_ease: function(r){ return '奚湘筠把台角的蒲团往'+r+'那边挪了半寸——挪出了风口。这是头一回，她把琴台的干处让人。回雁琴台的灯，今晚为两个人亮着。再论交几回，或可放下。'; },
        enemy_leave: function(r){ return '你回避了。琴台上两人没争执，半阙拉了一遍，雨落了一阵。奚湘筠下台时只说了三个字：「曲，停了。」顿了顿，又添半句：「下次，别让她一个人上台。——夜雨，阶滑。」'; },
        neutral_warm: function(r){ return '奚湘筠送'+r+'下台阶，破天荒多说了一个字：「慢。」她回身把旧谱收进谱匣，指腹在那片洇毛的空白上停了一息。再撮合几回，或可成友。'; },
        friend_form: function(r){ return '奚湘筠把旧谱翻到下半阙的空白，推到'+r+'面前：「听一板。不听怨——听雨。」'+r+'想了想，用指尖在空白旁点了一个板眼。奚湘筠看着那个板眼，说了句不是短句的话：「点对了。」两个被'+_playerTa()+'伤过的人，在一页空白上停了战。你这一局，撮合成了。'; },
        friend_deepen: function(r){ return '她俩交换关于'+_playerTa()+'的糗事，奚湘筠难得连着说了两句：「'+_playerTa()+'檐下听曲，淋透了？」'+r+'答：「'+_playerTa()+'替我掌灯，把灯掌倒了。」檐外的雨落了一阵，两人一齐低头喝茶——都怕对方看见自己眼底的暖。再论交几回，或可结金兰。'; },
        intimate: function(r){ return '这晚的雨落得格外细。奚湘筠取出那块松香，在弓毛上擦了三下，抱弓为'+r+'拉了一遍半阙——拉完，往下多运了一弓：下半阙的头一句，头一回拉给第二个人听。句收，她把松香推到'+r+'面前：「师父给的松香，让弓咬住弦。往后——让人咬住人。」'+r+'没推辞，解下随身的旧物搁在她掌心，两个人就这么换了。「姊妹的曲，不必争板。」回雁琴台从此多了一盏不灭的灯，是两个人一起点的。'+_playerTa()+'来时，她俩再不争先后，只论姊妹。'; }
    },
    'sect_leader_血手门': { // 耿雪衣：白药/方子/药庐/报数声口（v20.77）
        enemy_ease: function(r){ return '耿雪衣把豁口朝外的那只碗换给了'+r+'——豁口朝着自己，完口朝着客。这是头一回，她把那人当客待，不当伤口。药庐的灯，今晚为两个人亮着。再论交几回，或可放下。'; },
        enemy_leave: function(r){ return '你回避了。篱笆口两人没争执，两碗井水却放到日头偏西，没人喝。耿雪衣送你到篱笆口，只报了一个数：「水，两碗，都凉了。」顿了顿，又添一句：「下次，别让她一个人进血手门。——关外的风硬。」'; },
        neutral_warm: function(r){ return '耿雪衣送'+r+'出篱笆，破天荒多说了一整句：「关外的路滑——慢走。」她回身蹲到晒药匾边翻药，翻得比平日慢，一瓣一瓣摆正。再撮合几回，或可成友。'; },
        friend_form: function(r){ return '耿雪衣把新碾的白药分作两个纸包，推一包给'+r+'：「白药止血，也安神。我的药给谁，不分敌友——分需不需要。」'+r+'捏着那包药看了很久，收进了怀里。两个被'+_playerTa()+'伤过的人，在一包白药上停了战。你这一局，撮合成了。'; },
        friend_deepen: function(r){ return '她俩交换关于'+_playerTa()+'的糗事，耿雪衣难得笑出了小声——笑完自己先怔住：「'+_playerTa()+'伤风，喝药喝到舔碗？」'+r+'答：「'+_playerTa()+'替我看火，把姜下在枣前头，顺序全反。」药匾在日头底下沙沙响，两人一齐低头喝水——都怕对方看见自己眼底的暖。再论交几回，或可结金兰。'; },
        intimate: function(r){ return '耿雪衣取出那枚缝了八年的顶针，搁进'+r+'掌心：「坑是现成的。我替自己缝了八年——你替我缝一针。」'+r+'没推辞，解下随身的旧物搁在晒药匾上，两个人就这么换了。「姊妹的账，两清。」药庐的篱笆口从此每天摆两只井水碗，豁口都朝里。'+_playerTa()+'来时，她俩再不争先后，只论姊妹。'; }
    },
    'sect_leader_飞蝎坞': { // 拓银沙：蝎册/金蝎/沙水/掰腕子声口（v20.77）
        enemy_ease: function(r){ return '拓银沙把水囊往'+r+'那边推了过去，让那人先喝头一口——沙漠的规矩，主人后喝。这是头一回，她跟那人同坐一道沙丘。飞蝎坞的星子，今晚照着两个人。再论交几回，或可放下。'; },
        enemy_leave: function(r){ return '你回避了。沙丘上两人没吵，半囊沙水却放到星子偏西，没人动。拓银沙下丘时只撂了一句：「下次，别让她一个人过戈壁。——黑风不长眼。」'; },
        neutral_warm: function(r){ return '拓银沙送'+r+'到谷口，破天荒没掰腕子、没打赌：「……水囊带着。」她回身进蝎房，就着灯翻开蝎册，炭笔在空白页上悬了悬——落下去写的，不是「蛰」字。再撮合几回，或可成友。'; },
        friend_form: function(r){ return '拓银沙把蝎册翻到一页新的，推到'+r+'面前：「标什么，你自己定——我的册，还没让谁自己写过标。」'+r+'想了想，提炭笔写了两个字：不蛰。拓银沙盯着那两个字看了半晌，把册子「啪」地一合：「好字！」两个被'+_playerTa()+'伤过的人，在一页册子上停了战。你这一局，撮合成了。'; },
        friend_deepen: function(r){ return '她俩交换关于'+_playerTa()+'的糗事，拓银沙笑得直拍蝎房屋顶：「'+_playerTa()+'挨了蜇不叫，憋得脖子通红？」'+r+'答：「'+_playerTa()+'掰腕子输给我，赖着又掰了两局。」金蝎爬上沙脊听了一耳朵，尾钩轻轻晃了晃。再论交几回，或可结金兰。'; },
        intimate: function(r){ return '拓银沙把软布包一层一层打开——金蝎头一回蜕的壳，摆在两人中间：「蝎一生只信一次。这具壳，头一个看的是'+_playerTa()+'，第二个是你。」'+r+'解下随身的旧物搁进布包里，两个人就这么换了。「姊妹的账两清——谁也不欠谁。」飞蝎坞的蝎房外从此多了一顶常扎的帐，分窝夜里永远备两柄竹钳。'+_playerTa()+'来时，她俩再不争先后，只论姊妹。'; }
    },
    'sect_leader_烈日教': { // 伏璃茵：灯芯/圣火/吐槽/仪轨声口（不写她哭，v20.77）
        enemy_ease: function(r){ return '伏璃茵给'+r+'续了一壶白开水——头一回，后台的位子分人坐了。圣火龛后廊的灯，今晚为两个人亮着。再论交几回，或可放下。'; },
        enemy_leave: function(r){ return '你回避了。后廊里两人没争执，白开水却凉在了壶里，檀木匣开着没人碰。伏璃茵送你出龛廊时只丢下四个字，圣女腔：「风说的。」顿了顿，又用吐槽腔补了半句：「下次，别让她一个人过沙海。——七口井的灯，一盏都误不得。」'; },
        neutral_warm: function(r){ return '伏璃茵送'+r+'到西墙，破天荒没端冠、没念仪轨：「……路上带水，井亭的水甜。」她回身进龛，把檀木匣取出来，开了盖看了看，又合上。再撮合几回，或可成友。'; },
        friend_form: function(r){ return '伏璃茵把檀木匣打开，让'+r+'看里头那截捻熄过的灯芯：「全教就这一根，熄过。」'+r+'看了很久：「熄过的，比没熄过的真。」她愣了愣，随即吐槽决堤：「你听听——全大漠能接住我这句话的，一只手数得过来，今日又多一个。」两个被'+_playerTa()+'伤过的人，在一根灯芯前停了战。你这一局，撮合成了。'; },
        friend_deepen: function(r){ return '她俩交换关于'+_playerTa()+'的糗事，伏璃茵笑得扶住廊柱：「'+_playerTa()+'大仪上躲在柱子后头，腮帮子憋得鼓鼓的？」'+r+'答：「'+_playerTa()+'把圣火龛当灶膛，凑上去烤过手。」龛火哔剥响了一声，两人一齐憋笑——都怕吵着巡夜的，又怕对方看见自己眼底的暖。再论交几回，或可结金兰。'; },
        intimate: function(r){ return '伏璃茵把后廊那两只蒲团并到一处，拍了拍，让'+r+'坐：「后台的位子，从来只有一个。今日起，两个。」'+r+'解下随身的旧物搁在匣边，两个人就这么换了。「姊妹的场子，不设正席——谁想损事，先举手。」圣火龛后廊的灯从此夜夜多点一盏，吐槽役的段子有了两个常客。'+_playerTa()+'来时，她俩再不争先后，只论姊妹。'; }
    },
    'sect_leader_天龙教': { // 檀望舒：残铜镜/传声/石片/调子声口（台词全程带「（用XX的调子）」标注，本声不出现，v20.77）
        enemy_ease: function(r){ return '檀望舒给'+r+'续了一碗枣茶——用的是云婆婆的调子劝人喝。这是头一回，她把档房的灯分了一半给那人。天龙教的档房，今晚为两个人亮着。再论交几回，或可放下。'; },
        enemy_leave: function(r){ return '你回避了。档房里两人没争执，两碗枣茶却凉在灯下，包布的残镜没人开。檀望舒送你出档房时借知客的调子传了一句：（用黑袍知客的调子）「下次，别让她一个人过谷口。——梁上的夜路，塌了半截。」'; },
        neutral_warm: function(r){ return '檀望舒送'+r+'下山道，破天荒一路没换调子——全是知客腔，端端正正：「……风大，走里侧。」她回身进档房，取出半面残铜镜擦了擦，又原样包回布里。再撮合几回，或可成友。'; },
        friend_form: function(r){ return '檀望舒把半面残铜镜从布里取出来，推到'+r+'面前：（用黑袍知客的调子）「照半张脸。传声房的规矩——学谁的声，只学一半，剩下一半归本人。」'+r+'看着镜里那半张脸，看了很久：「归你自己的那半，留着。」她愣了愣，随即借孩子的稚声传了一句：（用孩子的调子）「姐姐懂。」两个被'+_playerTa()+'伤过的人，在半面残镜前停了战。你这一局，撮合成了。'; },
        friend_deepen: function(r){ return '她俩交换关于'+_playerTa()+'的糗事，檀望舒笑弯了腰，笑完当即把'+_playerTa()+'的调子学了一遍，连讪笑的尾音都学：「'+_playerTa()+'把护法长老认成马倌，还作了个揖？」'+r+'答：「'+_playerTa()+'冲着回音壁喊了三声，听了一夜回音。」灯下的旧铜镜牌轻轻碰响了一声，两人一齐低头喝茶——都怕对方看见自己眼底的暖。再论交几回，或可结金兰。'; },
        intimate: function(r){ return '檀望舒把半面残铜镜摆到两人中间——镜面朝上。（用云婆婆的调子）「镜子朝上，心事就轻。」她说，「今晚朝上。」'+r+'解下随身的旧物搁在镜边，两个人就这么换了。「姊妹的令，不传——只应。」天龙教的传声房从此多了一道不入册的私令，两个人知道内容：档房的灯点了，就来。'+_playerTa()+'来时，她俩再不争先后，只论姊妹。'; }
    },
    'sect_leader_神机门': { // 戚巧机：齿轮/齿数比/滴答/雀课/游隙声口（v20.78）
        enemy_ease: function(r){ return '戚巧机把西墙那侧的矮凳往'+r+'那边挪了半寸——挪出了滴答最吵的风口。这是头一回，她让那人坐进自己的工坊听墙。神机门的机簧房，今晚的滴答为两个人走着。再论交几回，或可放下。'; },
        enemy_leave: function(r){ return '你回避了。工坊里两人没争执，那壶热水却放到灯花结了痂，没人斟。戚巧机送你到山门，只报了一个数：「水，一壶，凉了。」顿了顿，又补一句短句：「下次，别让她一个人上山。——山道上有散齿轮，硌脚。」'; },
        neutral_warm: function(r){ return '戚巧机送'+r+'下山道，破天荒说了一整句：「游隙半丝——慢走。」她回身坐进工坊，拿起油壶给那道没上完的翼簧上油，一道一道，比哪一夜都稳。再撮合几回，或可成友。'; },
        friend_form: function(r){ return '戚巧机把机关雀推到案心，让'+r+'听雀课：「它拣人学。学岔了的句子，我不纠——登册。」'+r+'听了很久，说了一句：「岔的，比对的更像人。」她愣了愣，低头登册，登完添了一行小字：雀课，听众两名。两个被'+_playerTa()+'伤过的人，在一堂雀课上停了战。你这一局，撮合成了。'; },
        friend_deepen: function(r){ return '她俩交换关于'+_playerTa()+'的糗事，戚巧机笑得扶住了案角：「'+_playerTa()+'捡齿轮按齿数分堆，分错了三枚？」'+r+'答：「'+_playerTa()+'替我掌灯，把灯罩扣在了齿轮上。」案上的机关雀歪着头听，音膛轻轻震了一下，像把这一段也记下了。再论交几回，或可结金兰。'; },
        intimate: function(r){ return '戚巧机取出一枚新刻的黄铜齿轮，搁进'+r+'掌心——齿背上刻的齿数比是「一比一」：「等齿传动，不增速，不减速。装一处，两处一辈子一起转。这样的齿对，我这辈子算得出三处。」'+r+'没推辞，解下随身的旧物搁在检修册上，两个人就这么换了。「姊妹的游隙不必算——半丝，刚刚好。」神机门的工坊从此每逢检修夜多一只矮凳，雀课的位子常备两个。'+_playerTa()+'来时，她俩再不争先后，只论姊妹。'; }
    },
    'sect_leader_铁掌帮': { // 裘霜莺：哨语/凶脸/菱角/窑/雀群声口（短句凶腔，不借腔，v20.78）
        enemy_ease: function(r){ return '裘霜莺把荷叶包的炒菱角往'+r+'手里塞了过去——先分后吃，水寨的规矩。这是头一回，她跟那人在同一片滩上分食。洞庭的苇滩，今晚雀群落了两回。再论交几回，或可放下。'; },
        enemy_leave: function(r){ return '你回避了。堤上两人没吵，那包菱角却放到月头偏西，没人拆。裘霜莺送你回客棚，只撂了四个字，凶腔：「菱角，凉了。」顿了顿，又添半句：「下次，别让她一个人过湖。——夜雾不长眼。」'; },
        neutral_warm: function(r){ return '裘霜莺送'+r+'到渡口，破天荒没吹送船哨，只说了两个字：「看路。」她回身进哨架小屋，把腰后那排哨一支一支重新校了一遍，校到那支磨得最旧的，停了停。再撮合几回，或可成友。'; },
        friend_form: function(r){ return '裘霜莺把腰后的哨排解下来，让'+r+'挑一支：「挑哪支，我教你吹哪支。我的哨，外人碰不得。」'+r+'想了想，挑了那支黑风口的哑哨：「哑的。哑哨认人。」她盯着'+r+'看了半晌，把哨按进'+r+'手里：「挑得好。」两个被'+_playerTa()+'伤过的人，在一排哨上停了战。你这一局，撮合成了。'; },
        friend_deepen: function(r){ return '她俩交换关于'+_playerTa()+'的糗事，裘霜莺笑得凶脸全开，惊得哨架小屋屋顶的雀群扑棱棱起了一片：「'+_playerTa()+'练吹哨，吹成哑鸭下水？」'+r+'答：「'+_playerTa()+'把雀群当仪仗，冲着雀作了个揖。」两人笑完互相瞪了一眼——都怕对方看见自己眼底的暖。再论交几回，或可结金兰。'; },
        intimate: function(r){ return '裘霜莺把哨架最上层那支素坯捧下来，摆在两人中间——没上釉、带指痕的那支，十一年，帮里没人碰过。「我娘拦下的窑，留给我。」她声音放低，「今日多一个人碰它——姊妹碰的，不算破例。」'+r+'伸手在泥胎的指痕上按了一按，没推辞，解下随身的旧物搁在素坯旁边，两个人就这么换了。「姊妹的哨，一呼一应——不用翻译。」水寨的堤上从此每逢夜巡多两个位子，差事哨外的那一句，永远有两双耳朵。'+_playerTa()+'来时，她俩再不争先后，只论姊妹。'; }
    },
    'sect_leader_昆仑派': { // 姬云锦：舞谱/名目/步位/读舞/素绸声口（剑舞谱，零乐器，v20.78）
        enemy_ease: function(r){ return '姬云锦把偏处的蒲团往'+r+'那边挪了半寸——挪到了背风的一侧。这是头一回，她让那人坐进舞台的观位。昆仑的雪，今晚落得稳了些。再论交几回，或可放下。'; },
        enemy_leave: function(r){ return '你回避了。舞台上两人没争执，那半式迎雪停在第四式，那壶雪水放到台沿结了冰。姬云锦送你下台阶，只说了三个字：「舞，收了。」顿了顿，又添半句：「下次，别让她一个人过雪线。——卯时冰硬。」'; },
        neutral_warm: function(r){ return '姬云锦送'+r+'下山道，破天荒多说了一整句：「雪深——走里侧。」她回身到舞台，把素绸袖带解下来重新束了一遍，双环扣，扣人的那环，打得比平日松了些。再撮合几回，或可成友。'; },
        friend_form: function(r){ return '姬云锦把舞谱摊开到「问松」的注脚页，推到'+r+'面前：「读一式。不读怨——读顿处。」'+r+'想了想，指尖点在那四个字上：「问而不答——答不在松那边。」姬云锦盯着她看了很久，忽然收剑，朝她端端正正回了半礼——读舞人见读舞人的礼。两个被'+_playerTa()+'伤过的人，在一页舞谱上停了战。你这一局，撮合成了。'; },
        friend_deepen: function(r){ return '她俩交换关于'+_playerTa()+'的糗事，姬云锦难得笑弯了眼，笑完赶紧扶正剑架：「'+_playerTa()+'读舞，把迎雪读成了打架？」'+r+'答：「'+_playerTa()+'卯时在冰面上站桩，滑下山道半程。」崖端的老松抖落了一层雪，两人一齐低头饮雪水——都怕对方看见自己眼底的暖。再论交几回，或可结金兰。'; },
        intimate: function(r){ return '姬云锦解下袖上那段素绸，当着'+r+'的面把双环扣拆开重打——一环扣剑，一环扣人，这一回，两环都扣了人。「舞谱六代的注脚，传的不是仪轨，是话。」她说得很轻，「姊妹的注脚，我先写一行：此舞无名，名自两个人来。」'+r+'没推辞，解下随身的旧物与素绸并排搁在舞谱上，两个人就这么换了。「姊妹的舞，不争顿处。」昆仑的舞台从此每逢卯时晨课多一只蒲团，偏处的观位常留两个。'+_playerTa()+'来时，她俩再不争先后，只论姊妹。'; }
    },
    'sect_leader_全真教': { // 翀玉衡：记/利息/两讫/存疑/算盘珠声口（功业账，零酒字，v20.78）
        enemy_ease: function(r){ return '翀玉衡给'+r+'续了第二盏素茶——茶盏落案，位置摆得端端正正。这是头一回，她在功录房待人没拨算盘。重阳宫的功录房，今晚的灯为两个人亮着。再论交几回，或可放下。'; },
        enemy_leave: function(r){ return '你回避了。功录房里两人没争执，两盏素茶却放到三更，没人动。翀玉衡送你到三清殿前，只报了一笔账：「茶，两盏，都凉了。记。」顿了顿，又报一笔：「下次，别让她一个人上终南。——山道石阶，夜里结冰。」'; },
        neutral_warm: function(r){ return '翀玉衡送'+r+'出山门，破天荒没算送别的利息，只说了四个字：「慢走。记。」她回身进功录房，翻开日记记了一笔新的一页，记完没拨珠——拨珠是要算息的，这一笔，她没算。再撮合几回，或可成友。'; },
        friend_form: function(r){ return '翀玉衡把功业日记推到'+r+'手边，翻到一页空白栏：「立一栏。不记怨——记往来。息口你自己定。」'+r+'想了想，提笔落了一笔：是日，与功录房共一盏茶。记。翀玉衡看完那一笔，破天荒没纠格式，只说了三个字：「记得正。」两个被'+_playerTa()+'伤过的人，在一页空白栏上停了战。你这一局，撮合成了。'; },
        friend_deepen: function(r){ return '她俩交换关于'+_playerTa()+'的糗事，翀玉衡笑得腰间算盘珠直响：「'+_playerTa()+'对账，把自己的债对成了功？」'+r+'答：「'+_playerTa()+'把功过帖当功德箱，投了三张。」算盘珠响了一声，两人一齐低头吃茶——都怕对方看见自己眼底的暖。再论交几回，或可结金兰。'; },
        intimate: function(r){ return '翀玉衡取出那枚她师父算盘上拆下来的旧珠，搁进'+r+'掌心：「这颗珠我收了十五年。珠是对账的凭——给你，记『姊妹』，不记『债』，不算息。」'+r+'没推辞，解下随身的旧物搁在日记上，两个人就这么换了。「姊妹的账，永不讫——不讫，就总有往来。」功录房从此每逢对账夜多一盏茶，空白栏常留两个栏头。'+_playerTa()+'来时，她俩再不争先后，只论姊妹。'; }
    },
    'sect_leader_少林寺': { // 竺照禅：批注/功课/佛号/戒律/栴檀林声口（佛相毒舌，骂是教，v20.79）
        enemy_ease: function(r){ return '竺照禅先朝'+r+'合十念了一声「阿弥陀佛」——佛号念完，毒舌收着锋，把一盏素茶推了过去。这是头一回，她在栴檀林待人没讲戒。少林的栴檀林，今晚的灯为两个人亮着。再论交几回，或可放下。'; },
        enemy_leave: function(r){ return '你回避了。栴檀林里两人没争执，两盏素茶却放到灯花结了痂，没人动。竺照禅送你出庵门，只撂下一句：「茶，两盏，都凉了。」顿了顿，又补一句：「下次，别让她一个人上少林。——山道夜露重。」'; },
        neutral_warm: function(r){ return '竺照禅送'+r+'到庵门口，破天荒没赠临别偈语，只说了四个字：「夜风凉。慢走。」她回身进经堂，把批注经翻到那页空白，看了半晌，没落批——又合上了。再撮合几回，或可成友。'; },
        friend_form: function(r){ return '竺照禅把批注经推到'+r+'手边，翻到那页空白：「批一行。不批怨——批真话。贫尼的批注骂人，这一页不骂。」'+r+'想了想，提笔落了一行：是日，与栴檀林共一盏茶。茶苦，人不毒。竺照禅看完那一行，破天荒没纠一个字，只说了三个字：「批得好。」两个被'+_playerTa()+'伤过的人，在一页空白的批注上停了战。你这一局，撮合成了。'; },
        friend_deepen: function(r){ return '她俩交换关于'+_playerTa()+'的糗事，竺照禅笑得忘了念佛号，笑完补了一声「阿弥陀佛」：「'+_playerTa()+'听贫尼讲戒，把功课听岔了一偈？」'+r+'答：「'+_playerTa()+'把念珠供在经案上，冲着它作了个揖。」庵外的栴檀叶响了一阵，两人一齐低头吃茶——都怕对方看见自己眼底的暖。再论交几回，或可结金兰。'; },
        intimate: function(r){ return '竺照禅从贴身的布袋里倒出一颗散珠——不在串上的那一颗，受戒那年攥在手心的，盘了十几年，亮得发暗红。她搁进'+r+'掌心：「念珠认串，也认人。串上的珠有数，这颗没数——没数的，才舍得给人。」'+r+'没推辞，解下随身的旧物搁在批注经上，两个人就这么换了。「姊妹的戒，贫尼不讲——戒管身，珠管心。」栴檀林从此每逢晚课多一只蒲团，那页空白的批注旁，多了一个可以落批的人。'+_playerTa()+'来时，她俩再不争先后，只论姊妹。'; }
    }
};

function _applyBridgeEffects(npc, choice, hostName) {
    var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
    if (!rival) return { affection: 0, msg: '（无人可论交——你已无他情。）' };
    var rivalNpc = window.npcManager && window.npcManager.getNPC ? window.npcManager.getNPC(rival.id) : null;
    if (!rivalNpc) return { affection: 0, msg: '（情敌不在。）' };

    initHeroinePairIfNeeded(npc.id, rival.id);
    var before = getHeroinePairRelation(npc.id, rival.id);
    var bRel = before.relation || 'neutral';
    var bStr = Number(before.strength) || 0;

    // delta：mediate 最有效，convey 次之，leave 最弱（不宜传话、她俩自己又没熟）
    var delta = (choice === 'mediate') ? 26 : (choice === 'convey') ? 18 : 10;

    var result = null;
    if (typeof window.adjustNPCRelationshipPair === 'function') {
        result = window.adjustNPCRelationshipPair(npc, rivalNpc, delta, { defaultRelation: 'enemy' });
    }
    var after = result || getHeroinePairRelation(npc.id, rival.id);
    var aRel = after.relation || 'neutral';
    var aStr = Number(after.strength) || 0;

    var aff = (choice === 'mediate') ? 3 : (choice === 'convey' ? 2 : 1);

    var tier = _resolveBridgeTier(bRel, bStr, aRel, aStr, choice);
    var table = _BRIDGE_TIER_MSGS[npc.id] || _BRIDGE_TIER_MSGS['sect_leader_百花谷'];
    var fn = table[tier] || table.neutral_warm;
    return { affection: aff, msg: fn(rival.name) };
}

// ============ 合并进总事件池 ============
if (typeof NPC_PERSONAL_EVENTS !== 'undefined') {
    Object.assign(NPC_PERSONAL_EVENTS, HEROINE_BRIDGE_EVENTS);
}

// ============ 每日钩子：玩家在某女主角门派 + 吃醋已发生 + 有情敌 + 未至至交 → 触发论交 ============
if (typeof window !== 'undefined' && window.timeSystem && window.timeSystem.onNewDaySubscribe) {
    window.timeSystem.onNewDaySubscribe(function() {
        try {
            if (!window.currentCharData || !window.npcManager) return;
            if (typeof window.HEROINE_ROSTER === 'undefined') return;
            var loc = window.currentCharData.location || '';
            for (var i = 0; i < window.HEROINE_ROSTER.length; i++) {
                var h = window.HEROINE_ROSTER[i];
                if (h.sect !== loc) continue;
                // 吃醋对峙须已发生（她们已知彼此）
                if (typeof hasEventTriggered === 'function' && !hasEventTriggered(h.eventId)) continue;
                var npc = window.npcManager.getNPC ? window.npcManager.getNPC(h.id) : null;
                if (!npc) continue;
                var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(h.id) : null;
                if (!rival) continue; // 无情敌
                // 确保配对初始化
                initHeroinePairIfNeeded(h.id, rival.id);
                var pair = getHeroinePairRelation(h.id, rival.id);
                // 已至"至交"（friend 且 强度≥80）→ 不再触发
                if (pair.relation === 'friend' && (Number(pair.strength) || 0) >= BRIDGE_INTIMATE_STRENGTH) continue;
                var bridgeId = h.id === 'sect_leader_百花谷' ? 'bh_event_bridge'
                    : h.id === 'sect_leader_修罗宫' ? 'xl_event_bridge'
                    : h.id === 'sect_leader_天山派' ? 'ts_event_bridge'
                    : h.id === 'sect_leader_峨眉派' ? 'em_event_bridge' // v20.73 夙孤鸿入册
                    : h.id === 'sect_leader_唐门' ? 'tm_event_bridge' // v20.74 晏万解入册
                    : h.id === 'sect_leader_蓬莱派' ? 'pl_event_bridge' // v20.75 瀛晚照入册
                    : h.id === 'sect_leader_恒山派' ? 'heng_event_bridge' // v20.76 祁清禅入册
                    : h.id === 'sect_leader_泰山派' ? 'tai_event_bridge' // v20.76 岳清晓入册
                    : h.id === 'sect_leader_青城派' ? 'qing_event_bridge' // v20.76 幽翠微入册
                    : h.id === 'sect_leader_衡山派' ? 'xiang_event_bridge' // v20.76 奚湘筠入册
                    : h.id === 'sect_leader_血手门' ? 'xue_event_bridge' // v20.77 耿雪衣入册
                    : h.id === 'sect_leader_飞蝎坞' ? 'xie_event_bridge' // v20.77 拓银沙入册
                    : h.id === 'sect_leader_烈日教' ? 'lie_event_bridge' // v20.77 伏璃茵入册
                    : h.id === 'sect_leader_天龙教' ? 'long_event_bridge' // v20.77 檀望舒入册
                    : h.id === 'sect_leader_神机门' ? 'sj_event_bridge' // v20.78 戚巧机入册
                    : h.id === 'sect_leader_铁掌帮' ? 'tz_event_bridge' // v20.78 裘霜莺入册
                    : h.id === 'sect_leader_昆仑派' ? 'kl_event_bridge' // v20.78 姬云锦入册
                    : h.id === 'sect_leader_全真教' ? 'qz_event_bridge' // v20.78 翀玉衡入册
                    : h.id === 'sect_leader_少林寺' ? 'shao_event_bridge' // v20.79 竺照禅入册
                    : 'wx_event_bridge';
                var ev = NPC_PERSONAL_EVENTS[bridgeId];
                if (!ev) continue;
                if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npc)) continue;
                // 冷却检查（既有 cd 机制：window._eventCooldowns）
                if (typeof checkEventTrigger === 'function' && !checkEventTrigger(ev, window.currentCharData)) continue;
                // 延迟弹出
                setTimeout(function(evId, npcInst) {
                    if (document.querySelector && document.querySelector('.personal-event-modal')) return;
                    var ev2 = NPC_PERSONAL_EVENTS[evId];
                    if (!ev2) return;
                    if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev2, npcInst)) return;
                    if (typeof triggerPersonalEvent === 'function') triggerPersonalEvent(evId);
                }.bind(null, bridgeId, npc), 1200);
            }
        } catch (e) { console.warn('[情敌论交] 每日触发失败:', e); }
    });
}

// ============ 导出 ============
if (typeof window !== 'undefined') {
    window.HEROINE_BRIDGE_EVENTS = HEROINE_BRIDGE_EVENTS;
    window.getHeroinePairRelation = getHeroinePairRelation;
    window.initHeroinePairIfNeeded = initHeroinePairIfNeeded;
}
console.log('[情敌论交] 情敌和解/亲密系统加载完成：' + Object.keys(HEROINE_BRIDGE_EVENTS).length + ' 个论交事件');
