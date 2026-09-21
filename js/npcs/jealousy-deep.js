// ==================== jealousy-deep.js - 吃醋事件扩容包 v20.30（已接线） ====================
// 已挂载：仙侠.html 中排在 male-lead-reconcile.js 之后（二十人全局 detectRivalRomance 就位后加载）。
// v20.76：第二批六人（五岳+丐帮）入册——恒山祁清禅 / 嵩山逵佩南 / 泰山岳清晓 /
//         青城幽翠微 / 衡山奚湘筠 / 丐帮桑拾玖，全档配齐，规模十四人 56 桩 → 二十人 80 桩。
// v20.77：第三批五人（反派线主角）入册——阎罗殿聂明泽 / 血手门耿雪衣 / 飞蝎坞拓银沙 /
//         烈日教伏璃茵 / 天龙教檀望舒，全档配齐，规模二十人 80 桩 → 二十五人 100 桩。
//         反派阵营只作氛围（档房/药庐/蝎房/圣火龛/传声房），不洗白、不写首领；
//         声口铁律随册入档：檀望舒全桩带「（用XX的调子）」标注且绝不用本声（本声专属主线 68/72 档与终章）、
//         伏璃茵全桩不许哭（仰头哭专属主线）、聂明泽只用簿/档/册/格/签/朱笔意象、耿雪衣禁丹炉字样、
//         拓银沙「不蛰」页只合不揭（说破专属终章）；五人信物互不串用，亦不碰既有二十人的信物。
// v20.78：第四批十人入册——神机门戚巧机 / 霹雳堂雷惊蛰 / 天书阁宓书言 / 大隐阁隗九爻 /
//         侠隐阁简知忆 / 天涯海阁狄长亭 / 大旗门樊惊筹 / 铁掌帮裘霜莺 / 昆仑派姬云锦 /
//         全真教翀玉衡，全档配齐，规模二十五人 100 桩 → 三十五人 140 桩。
//         声口铁律随册入档：戚巧机全桩只用误差/游隙/齿比/「算不出」语，雷惊蛰话极轻、
//         要紧的话更轻且每桩自补「……我说了。我真的说了。」，宓书言批语从不超四字（破例只为你），
//         隗九爻卦辞只认「莫尽」、签头那颗风干山楂从不吃（吃了等于卦死），简知忆批注腔
//         （归档/附页/危险程度/存疑不究）而禁朱笔簿册那套冥府语，狄长亭每句都像道别、
//         公文腔藏挽留，樊惊筹军中短句、暗针一针一字，裘霜莺哨语三条（一长一短/三短促/两声低回），
//         姬云锦舞有名目（迎雪/问松/送鸿）而嘴上说不来喜欢，翀玉衡账房腔（记/此债记账/利息/
//         两讫/全押/存疑）且你那栏只进不出；十人信物互不串用，亦不碰既有二十五人的信物。
// v20.79：少林寺·竺照禅入册——比丘尼，佛相毒舌：骂人先合十念「阿弥陀佛」，再引经据典，
//         经旁批注比原文毒；念珠盘得发亮；执念是批注经那一页空白——骂遍天下人，
//         关于你的那句最锋利的批注落不下去。全桩只用佛号/批注/功课/戒律/讲经/栴檀林语，
//         与恒山祁清禅的静修语汇彻底拉开（清禅是功课回向的静，照禅是批注毒舌的利），
//         飞鸽信写成偈语格式、偈下缀小批；信物（批注经/念珠）不串用，亦不碰既有三十五人的信物。
//         全档配齐，规模三十五人 140 桩 → 三十六人 144 桩。
//
// 设计宪法（与 heroine-rivalry.js 一脉相承）：
//   · 吃醋由真实关系状态驱动，无人为计数器、无随机穿帮。
//   · 正常情侣几乎不可能撞破情敌——因此本包的重心不是「发现」，而是：
//       试探（没证据、只觉你分身乏术）→ 敲打（情敌成了道侣、事实公开，立规矩）
//       → 节日余波（帖子被推/被放鸽子之后，你亲眼看见 Ta 一个人过的样子）
//       → 小心眼日常（不需要知道情敌是谁，只需知道你把心分成了两半）
//   · 节日余波全部读 festival-bridge 的既有账本（bonds[*].festival），零新增存档键、零编造事实：
//     情敌名字只在「你当夜确实陪了 Ta」时才出现（账本里 spent 为证）。
//
// 事件规模（144 桩，三十六位恋爱对象 × 4 类）：
//   试探  36 桩 · 一次性 · 有情敌 + 好感≥40 + 人在其门派
//   敲打  36 桩 · 一次性 · 试探已发生 + 情敌已成道侣（事实公开才立规矩）
//   余波  36 桩 · 可重演（每年每节一回到门）· 节前推帖/放鸽子后的次日～十二日内，你在 Ta 门中时
//   小心眼 36 桩 · 日常小事（ambient，30 日重入）· 有情敌 + 好感≥45，随机偶遇
//
// 每日钩子优先级与计划一致：余波 > 试探 > 敲打 > 小心眼（余波是账上实亏，必弹；其余三类吃概率）。
//
// 与既有链的咬合：试探 → 敲打 由 requireEventDone 串联；既有一击式「对峙/和好」
// 不动，本包把「一次性摊牌」之间原本空着的日常填实。

// ============ 公共工具 ============
// 门派 → 事件前缀（与既有文件同一套缩写）
var JEALOUSY_SEC_PREFIX = {
    '百花谷': 'bh', '修罗宫': 'xl', '天山派': 'ts', '五仙教': 'wx',
    '铸剑山庄': 'lu', '药王谷': 'su', '茅山派': 'ms', '金刚宗': 'jg',
    '峨眉派': 'em', '华山派': 'hs', '唐门': 'tm', '武当派': 'wd',
    '蓬莱派': 'pl', '逍遥派': 'xy',
    '恒山派': 'heng', '嵩山派': 'song', '泰山派': 'tai', '青城派': 'qing',
    '衡山派': 'xiang', '丐帮': 'gai',
    '阎罗殿': 'yan', '血手门': 'xue', '飞蝎坞': 'xie', '烈日教': 'lie',
    '天龙教': 'long',
    '神机门': 'sj', '霹雳堂': 'pi', '天书阁': 'shu', '大隐阁': 'dy', '侠隐阁': 'yin',
    '天涯海阁': 'ty', '大旗门': 'dq', '铁掌帮': 'tz', '昆仑派': 'kl', '全真教': 'qz',
    '少林寺': 'shao'
};

function _jealPrefix(npcId) {
    var sect = (typeof npcId === 'string' && npcId.indexOf('sect_leader_') === 0)
        ? npcId.slice('sect_leader_'.length) : '';
    return JEALOUSY_SEC_PREFIX[sect] || null;
}

// 三十六人名册（女主 + 男主，任一未加载则跳过，加载序不敏感）
function _jealRoster() {
    var out = [];
    if (typeof HEROINE_ROSTER !== 'undefined' && HEROINE_ROSTER) out = out.concat(HEROINE_ROSTER);
    if (typeof window !== 'undefined' && window.MALE_LEAD_ROSTER) out = out.concat(window.MALE_LEAD_ROSTER);
    return out;
}

function _jealNpc(id) {
    return (window.npcManager && window.npcManager.getNPC) ? window.npcManager.getNPC(id) : null;
}

function _jealAff(npc) {
    return (npc && npc.relationship && npc.relationship.affection) || 0;
}

// 统一延迟弹出（与 heroine-rivalry 的 _delayedRivalryFire 同款：门禁二次校验 + 弹窗互斥）
// onFired：真正弹出成功后才执行（如写节日账本旗）——绝不能在门禁复检前落旗，
// 否则 requireFestivalWound 会在 triggerPersonalEvent 复检时把刚标过旗的伤判成「无伤」。
function _jealFire(evId, npcInst, onFired) {
    setTimeout(function() {
        if (document.querySelector && document.querySelector('.personal-event-modal')) return;
        var ev = NPC_PERSONAL_EVENTS[evId];
        if (!ev) return;
        if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npcInst)) return;
        if (typeof triggerPersonalEvent === 'function' && triggerPersonalEvent(evId)) {
            if (typeof onFired === 'function') onFired();
        }
    }, 1200);
}

// ============ 一、试探（36 桩，一次性） ============
// 没有证据。他们只是觉出你把时间分成了两半——每个人用各自的本行察觉。
var JEALOUSY_PROBE_EVENTS = {
    // ---- 温蘅：医者的手不会说谎，脉会 ----
    'bh_event_probe': {
        id: 'bh_event_probe', npcId: 'sect_leader_百花谷', title: '双营', icon: '🫖',
        desc: '她替你搭脉，眉头轻轻动了一下。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'bh_e_probe_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '药庐。她替你搭脉，三息之后，指尖在你腕上多停了一息。', type: 'description' },
            { speaker: 'npc', text: '「脉象双营。」她收回手，语气如常，「气血两头分养——养过双胎的人才有这种脉。你显然不是。」' },
            { speaker: 'npc', text: '「你近来奔走多，我不问去处。」她给你倒茶，手很稳，「我只问一句——你的心事，如今有几处？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「……有一处，不止一处。」', effect: 'tell' },
                { text: '「心事只放在你这里。」', effect: 'reassure' },
                { text: '「脉象也有看走眼的时候。」', effect: 'deflect' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            var dao = rival && rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'tell':
                    aff = dao ? -7 : -4;
                    msg = '她安静片刻，点了点头：「……我探过脉，知道两头分养是什么模样。」她望着窗外，「——' + (rival ? rival.name : '那位') + '？」她轻轻「嗯」了一声，「你肯说，我领这份情。只是这脉象骗不了人，往后的日子，你我都得学着看。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
                case 'reassure':
                    aff = 3;
                    msg = '她笑了笑，没接话。半晌，她把方才那盏茶重新温过，递给你：「脉象我可以再诊一回。」她轻声，「心——你自己报。我记账，不戳穿。」';
                    break;
                case 'deflect':
                    aff = dao ? -9 : -6;
                    msg = '她也不恼，把药碾子往你面前推了推：「行。那我替你碾药，碾着碾着，一回只要半日——你有的是『看走眼』的日子。」她低头碾药，药碾子一声一声，「药庐的门开着。你的账，开着开着就大了。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 5);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 绯泪：修罗宫的账本，缺了一页 ----
    'xl_event_probe': {
        id: 'xl_event_probe', npcId: 'sect_leader_修罗宫', title: '缺页', icon: '📕',
        desc: '她说你的行踪，账上缺一页。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'xl_e_probe_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '修罗宫后殿。她面前摊着一册薄簿——暗哨的行踪账，翻到你名下那一页。', type: 'description' },
            { speaker: 'npc', text: '「你的行踪，我这儿有账。」她指尖点在簿上，「这个月，你空了三天。账上只写着『不知所踪』。」' },
            { speaker: 'npc', text: '「修罗宫不问客人行迹——」她抬眼，寒冰般的目光在你脸上停住，「客人不算。你算不算，你自己说。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「那三天，我在陪另一个人。」', effect: 'tell' },
                { text: '「我的行踪，只报给你一个人。」', effect: 'reassure' },
                { text: '「翻我账本，问过我没有。」', effect: 'deflect' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            var dao = rival && rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'tell':
                    aff = dao ? -8 : -5;
                    msg = '她盯着你看了三息，忽然提笔，在那页空缺上写了一行字，推给你看——「' + (rival ? rival.name : '那人') + '处」。字写得极稳。「缺页补上了。」她合上簿子，「修罗宫的账，从今往后——一笔一笔，当面写。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
                case 'reassure':
                    aff = dao ? -2 : 4;
                    msg = dao
                        ? '她冷冷看你：「话好听。」笔尖在簿上敲了敲，「那三天，你的人不在我这儿——账不认话，认人。」'
                        : '她「哼」了一声，耳根却有一点不易察觉的颜色：「那三天，你最好也只在一个人那儿。」她把簿子抽走，「缺页我留着。补不上——你就把自己钉在这儿补。」';
                    break;
                case 'deflect':
                    aff = dao ? -12 : -8;
                    msg = '殿里的温度陡地一沉。她慢慢把簿子合上：「翻你的账，是我不对。」声音平得吓人，「修罗宫的规矩，账目不清——是要见血的。你回去把三天补清楚，再来。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 8);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 琤霄凌：剑认一心，它多应了一次 ----
    'ts_event_probe': {
        id: 'ts_event_probe', npcId: 'sect_leader_天山派', title: '剑应双鸣', icon: '⚔️',
        desc: '霜鸣朝你，鸣了两次。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'ts_e_probe_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '雪庐。你进门那刻，中龛上的霜鸣轻轻一鸣——她正在擦剑的手停了。因为剑鸣响了第二声，朝着你。', type: 'description' },
            { speaker: 'npc', text: '「霜鸣认主，认的是一心。」她把剑横在膝上，冰蓝的眼落在你身上，「它朝你应过一回，我信了。这一回——它应了两声。」' },
            { speaker: 'npc', text: '「剑不撒谎。」她声音平平，「你也不必答剑。答我：你心里如今住着几个名字？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「两个。我不瞒你。」', effect: 'tell' },
                { text: '「只有一个，它听错了。」', effect: 'reassure' },
                { text: '「一把剑的话，你也信。」', effect: 'deflect' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            var dao = rival && rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'tell':
                    aff = dao ? -7 : -4;
                    msg = '她垂眼看着剑身那道裂纹，很久。「……两个。」她重复了一遍，像在试这两个字的分量，「（' + (rival ? rival.name : '那人') + '）名字我不用问了，剑已经替你说完。」她把霜鸣归鞘，「剑道不容二心——这句是我说的。今天不加你的罪。这句话什么时候兑现，你自己记。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
                case 'reassure':
                    aff = dao ? -3 : 3;
                    msg = dao
                        ? '她看你一眼，没拆穿，只把霜鸣往你面前一推：「那你自己试。握它。」剑在你手里安安静静的，她收回去了，「……今日它倦了。往后的事，你自己心里有数。」'
                        : '她把剑鞘往你手里一塞：「那就好。剑在这儿挂着——它再双鸣一次，你当面给我个交代。」顿了顿，「我等你交代，等得起。我等了它十二年。」';
                    break;
                case 'deflect':
                    aff = dao ? -11 : -7;
                    msg = '她沉默了半晌，把霜鸣用布一层一层裹好。「剑的话我信。」她声音比雪还静，「你的话——我再听几回。听够了，我自己会拔它。届时对你拔，还是对天拔，看那时我剩多少体面。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 6);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 蓝凤凰：心蛊绕着一个名字打转 ----
    'wx_event_probe': {
        id: 'wx_event_probe', npcId: 'sect_leader_五仙教', title: '绕名', icon: '🦋',
        desc: '蛊房里的小蛊，围着一个名字不肯走。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'wx_e_probe_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '万蛊窟。你隔着水幕就看见：一只小蓝蝶蛊绕着你名姓的签子打转，一圈，又一圈。她倚在瓮边，也不去捉，任你进门。', type: 'description' },
            { speaker: 'npc', text: '「哟，巧。」她指尖点了点那圈蝶影，「它绕了三天了。我们养蛊的知道——蛊不闹没事的动静。」' },
            { speaker: 'npc', text: '「我心口这只更没出息。」她按住锁骨下那团黑纹，笑吟吟的，凤目却在量你，「闻到你的味道，它不闹了——改成绕着『你』和『另一个味道』打转，转得我心口疼。说说吧，那另一个味道，是谁？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「……是我记挂着另一个人。」', effect: 'tell' },
                { text: '「你的蛊认生，过两日就散。」', effect: 'reassure' },
                { text: '「蛊的话，也值当你问出口。」', effect: 'deflect' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            var dao = rival && rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'tell':
                    aff = dao ? -8 : -5;
                    msg = '蝶蛊的圈子停了。她也有些意外，随即笑得妖媚：「……' + (rival ? rival.name : '那人') + '。心蛊连名字都报给我了，你倒自己先招了——行，这份痛快，我记账。」她按住锁骨，笑意底下有一点真东西，「蛊喂的是真心。你分它一半，它就疼一半。它疼——我也跟着疼。往后的账，你自己掂量。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
                case 'reassure':
                    aff = dao ? -3 : 4;
                    msg = dao
                        ? '「认生？」她嗤地一笑，「蛊认的是道侣契的味道——它认生认了三天。」她把蝶蛊招回掌心，「你走吧。它绕完这圈，该绕别的了。我也该学着绕开你。」'
                        : '她挑着凤目看你，忽地凑近半尺：「哦？那你怎么不敢看我的心蛊？」她退开，咯咯笑起来，「——散不散，两日后见分晓。它要是还绕，你就得给五仙教一个说法。」';
                    break;
                case 'deflect':
                    aff = dao ? -13 : -8;
                    msg = '她抚着锁骨黑纹，一下，一下，笑意淡得像药炉的余温：「值当。怎么不值当——我这条命都押在蛊上，蛊说的话，就是我命里的话。」她转身，水幕落下，「你走吧。它绕完三天，第四天该绕进我心口了。届时我疼起来——我指着你疼。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 6);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 冶砚：看火候的手，从不看走眼 ----
    'lu_event_probe': {
        id: 'lu_event_probe', npcId: 'sect_leader_铸剑山庄', title: '火候', icon: '🔥',
        desc: '他说你答话时，眼神飘了一下。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'lu_e_probe_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '炉房。你随口推了一句「改日前来」，他手里的锤没落，偏头看你。', type: 'description' },
            { speaker: 'npc', text: '「你方才说『有事』的时候，眼神往左飘了一下。」他说得又直又闷，「炉上看火，差一息就是废铁。我看人——跟看火候一样，不差。」' },
            { speaker: 'npc', text: '「你最近事多。」他把锤搁下，抱臂，琥珀眼底炉火一映，「我没打听你。我就想听你自己说——你那『事』里，是不是有了别人？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「是。心里多了一个人。」', effect: 'tell' },
                { text: '「事是真有事，人只有你。」', effect: 'reassure' },
                { text: '「你打铁打魔怔了。」', effect: 'deflect' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            var dao = rival && rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'tell':
                    aff = dao ? -8 : -5;
                    msg = '他「哦」了一声，闷得出奇，转身朝炉里拉了三下风箱，火猛地窜起来又落下去。「……' + (rival ? rival.name : '那人') + '。」他背对着你，声音混着风声，「行。你自己说出来的，我记下了。铸剑的不会拆别人炉子——但我的炉，也不烧两头开的铁。你自己琢磨这句话。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
                case 'reassure':
                    aff = dao ? -3 : 4;
                    msg = dao
                        ? '他盯着你看了半晌，忽然咧嘴一笑，笑得糙：「成，这话我收了。」他重新举锤，「炉前给你留着位——『人只有我』这五个字，你得跟铁一样，一锤一锤砸实了给我看。」'
                        : '他把锤往你手里一塞：「行，你手里拿一回锤就知道——火是两头烧不得的。」顿了顿，声音低下去，「我信你一回。就一回，砸不结实，这锤我不再给你。」';
                    break;
                case 'deflect':
                    aff = dao ? -12 : -8;
                    msg = '他也不恼，拎起锤「当」地一声砸在你脚前半寸的铁砧上，火星溅了一地。「打铁打魔怔。」他重复，「打铁的魔怔，就是眼里揉不得铁渣——你现在就是那颗渣。」他一指门口，「炉房今日歇了。你回去把话想直了再来。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 7);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 芩木：脉分两至，一支在别处 ----
    'su_event_probe': {
        id: 'su_event_probe', npcId: 'sect_leader_药王谷', title: '两至', icon: '🌿',
        desc: '他说你的脉，分成了两支。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'su_e_probe_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '药庐。他替你诊脉，诊得比往常久。收回手时，他先笑了笑——那笑温润，却让药庐里的药气都沉了半钱。', type: 'description' },
            { speaker: 'npc', text: '「心主血脉。」他慢慢说，「一个人的心尖血，往一处去，脉来一支。你的——」他指尖虚点了两下，「两支。一支在这儿。另一支，去了别处。」' },
            { speaker: 'npc', text: '「医者不说假话。」他抬眼，浅褐眼底清清亮亮，「我也不逼你答。你坐一会儿——什么时候愿意说，药庐的账，什么时候才结。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「另一支脉，是我分给另一个人的。」', effect: 'tell' },
                { text: '「两支脉，一支都没断你的。」', effect: 'reassure' },
                { text: '「诊金我照付，话我照旧。」', effect: 'deflect' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            var dao = rival && rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'tell':
                    aff = dao ? -7 : -4;
                    msg = '他安静地听完，提笔开方，笔锋稳得没有一丝抖：「……' + (rival ? rival.name : '那人') + '。」他把方子推给你，上面只有一味药名，他指给你看——「远志」。他轻声，「益智安神，交通心肾。心肾不交、两头牵系的方子，我给你开了。方子会过期——人心别过期。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
                case 'reassure':
                    aff = dao ? -3 : 4;
                    msg = dao
                        ? '他笑意不减：「一支都没断我的——」他收回三指，「那就好。只是我的脉枕，往后你要自己带。药庐的茶，也换回你从前喝的那款——单人的那款。」'
                        : '他把脉枕往你身后一推，示意你坐下：「两支都在，那今日两支都归我诊。」他重新搭上你的腕，指腹温热，「我记性极好。你另一支脉几时野到别处去——我一诊就知道。别怪我没提醒你。」';
                    break;
                case 'deflect':
                    aff = dao ? -13 : -8;
                    msg = '他也不劝，起身把药柜最上层的一个青瓷罐取下来，放在你面前：「诊金照付，好。」他温润地笑，「这是安神定志丸，治『口是心非』的——我原想着，用不上。如今看，你早晚用得着。」他替你包好，绳结系得极仔细，「拿去吧。药王谷从不跟病人置气。只是下次来，这药要是原封没动——你的脉，我也不用诊了。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 7);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 昴既明：卜了一卦，卦名唤作「分心」 ----
    'ms_event_probe': {
        id: 'ms_event_probe', npcId: 'sect_leader_茅山派', title: '分心卦', icon: '🪶',
        desc: '他把卦纸推给你，卦名就一个字：分。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'ms_e_probe_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '符阁。案上摊着一张新卜的卦纸，墨迹未干。他左眼银光落在纸上，不看你。', type: 'description' },
            { speaker: 'npc', text: '「无事不卜。」他声音清冷，「昨夜起卦，问的是——你近日为何来得少了。」' },
            { speaker: 'npc', text: '他把卦纸推过来。卦辞他不解，只指卦名给你看，一个字：分。「茅山不说诳语。」他抬眼，「卦不敢骗我。你——敢不敢不骗自己？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「卦是真的。我心里多了人。」', effect: 'tell' },
                { text: '「这卦，解错了。」', effect: 'reassure' },
                { text: '「道士的卦，也能定人的心？」', effect: 'deflect' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            var dao = rival && rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'tell':
                    aff = dao ? -7 : -4;
                    msg = '他执笔，在卦纸角上落了四个字，推还给你——「各安其位」。他平静道：「' + (rival ? rival.name : '那人') + '，我不问是谁。卦象既分，强合则凶。」他把朱砂笔搁下，「茅山的规矩，凶卦要化解。化解之法——你自己悟。悟不出来那日，卦纸我焚，符灯我灭。茅山不渡不肯回头的人。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
                case 'reassure':
                    aff = dao ? -4 : 3;
                    msg = dao
                        ? '「解错了？」他拈起卦纸，就着烛火点了，看它烧成灰，「卦可以错。心不会。」他起身，「你既不肯认——那本座明日再卜一问：问『他几时回来』。卦若不吉，你莫怪茅山嘴冷。」'
                        : '他把卦纸折好，收进袖中：「错不错，卦不许愿。」他替你斟了杯冷茶，「茶喝了，回去。三日内我再卜一次——三日内你若人来了，卦就换。卦换不换，看腿，不看嘴。」';
                    break;
                case 'deflect':
                    aff = dao ? -12 : -8;
                    msg = '他「嗯」了一声，当真取来罗盘，在你面前摆了摆，银光扫过你面门，忽地一顿。「……心口位置，磁场乱了。」他收回罗盘，声音听不出喜怒，「道士不定人的心——道心自定。」他把符阁的门闩抽开一半，「今日到此。你回去让心口静一静。它静不下来——下次我来替你静。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 6);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 赫渊：不说。木牌背面添了一道新划 ----
    'jg_event_probe': {
        id: 'jg_event_probe', npcId: 'sect_leader_金刚宗', title: '新划', icon: '🪵',
        desc: '他没说话，把木牌推过来，给你看背面。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'jg_e_probe_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '金刚塔内。他照例不说话，从袖中摸出「闭口禅」木牌，推到你面前——翻到背面。那道划花的旧痕旁边，多了一道新的。', type: 'description' },
            { speaker: 'npc', text: '他伸出三根手指，又收回去。然后开口，声音低哑，破了禅：「三日。」他望着你，「你七日，少了三日。」' },
            { speaker: 'npc', text: '他重新闭口，垂目拨珠。塔里安静得能听见香灰落下来。——他的意思很清楚：数目他数着，话，他在等你自己说。' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「少的那三日，我给了旁人。」', effect: 'tell' },
                { text: '「数目错了。我算给你看。」', effect: 'reassure' },
                { text: '「数我？你是方丈还是账房。」', effect: 'deflect' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            var dao = rival && rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'tell':
                    aff = dao ? -8 : -5;
                    msg = '他拨珠的手停了。塔内静了很久。然后他拿起木牌，背面那道新划上又添了一划，推给你——两划了。「因果。」他开口第二句，声音更哑，「' + (rival ? rival.name : '那人') + '……名字不必知。佛说，因果自受。」他闭目，「你去吧。划满五划那日，我开口说最后一次话。说什么——你届时便知。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
                case 'reassure':
                    aff = dao ? -4 : 5;
                    msg = dao
                        ? '他看你一眼，把木牌收回袖中，重新合十。不辩，不恼——比恼更重。半晌，他开口一句：「数目。」两个字，门闩落下，送客。'
                        : '他当真掰着指头，与你一道把那七日的数目重数了一遍，数到你来过的日子，他点了三下头。然后他把木牌往你面前一放——意思：你写。你提笔，背面那道新划旁边，你写了三个字：「补三日」。他看了，收牌，拨珠。塔内，活了。';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 3);
                    break;
                case 'deflect':
                    aff = dao ? -14 : -9;
                    msg = '他拨珠的手没有停。过了很久，他开口，声音平得像塔外的天：「……方丈。」他重复这两个字，「方丈不数人。方丈数心跳。」他抬眼看你，沉静的眼底第一次有了冷意，「你的心跳，快。做贼的心跳，贫僧听得多了。」他合十，「出塔。塔门今日落闩。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 8);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 夙孤鸿：戒律与数目，点名点到一支空签 ----
    'em_event_probe': {
        id: 'em_event_probe', npcId: 'sect_leader_峨眉派', title: '点名', icon: '🪷',
        desc: '金顶夜巡点名，你的名签近来常不在。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'em_e_probe_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '金顶。子夜点名，戒律首座按签唱名。唱到你那支，她停了一停——签在，人近日常不在。云海在脚下翻涌，她把那支签拈起来，就着灯笼看了很久。', type: 'description' },
            { speaker: 'npc', text: '「峨眉点卯，签在人在，签在人不在——记缺。」她声音又清又冷，像戒尺磕在案上，「你这个月，缺了五回。数目不会错。」' },
            { speaker: 'npc', text: '「我不问你去了哪儿。戒律只数数目，不问缘由。」她抬眼，杏眼里映着一点灯火，「但你若想我往后不数——就自己说。你的心思，如今分了几处？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「五回，都给了另一个人。」', effect: 'tell' },
                { text: '「名签在这儿，心也在这儿。」', effect: 'reassure' },
                { text: '「点你的卯，管我的腿？」', effect: 'deflect' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            var dao = rival && rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'tell':
                    aff = dao ? -7 : -4;
                    msg = '她捏着那支名签，半晌没有说话。云海翻过一层，她才开口：「……' + (rival ? rival.name : '那人') + '。」她把签放回原处，放得端端正正，「肯说，就不算犯戒。峨眉的缺，记在签上；你这句话，我记在戒尺背面。」她顿了顿，「往后的卯，你缺一回，我数一回。数到我不想数的那日——你自己来销。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
                case 'reassure':
                    aff = dao ? -3 : 4;
                    msg = dao
                        ? '她看你一眼，不接话，把名签在灯下翻了个面——背面空着。「签在，人不在。」她声音平平，「戒律认签不认话。你这句话，等你的腿来兑现。」'
                        : '她把名签往你手里一按：「那就拿好。签在谁手里，卯就点给谁。」她转身继续巡夜，走出两步，又停下，背对着你，「——下回夜巡，跟上来。金顶风大，一个人巡，冷。」';
                    break;
                case 'deflect':
                    aff = dao ? -12 : -8;
                    msg = '她没恼。她只是把戒尺从腰间解下来，当着你的面，一寸一寸收进了袖中。「管你的腿——」她重复了一遍，声音比云顶的雪还静，「戒尺收起来了。从今往后，你的卯，我不点了。」她提灯转身，灯影在云海边缩成一点，「峨眉不缺你一个名签。缺的时候——你自己摸着黑来数。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 7);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 竺听雨：账与雨，来期记在册，凳子空了两夜 ----
    'hs_event_probe': {
        id: 'hs_event_probe', npcId: 'sect_leader_华山派', title: '雨账', icon: '🌧️',
        desc: '账本上你的来期他记着；雨夜剑堂，你的位子空着。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'hs_e_probe_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '账房。他翻着华山的账，翻到一页——不是门派的总账，是他自己另记的一册小簿。你瞥见那页抬头，写的是你的来期。', type: 'description' },
            { speaker: 'npc', text: '「别多心，华山穷，什么都得记。」他笑着把簿子往回抽，抽得随意，指节却按得发白，「这个月你来五回，比上月少三回。账上不会错——我别的本事没有，数目记得牢。」' },
            { speaker: 'npc', text: '「前两夜下雨。」他望向剑堂的方向，笑还挂着，声音松松的，「雨夜我在剑堂听雨，旁边那只凳，空了两夜。」他把簿子合上，「账，我自己平得了。凳子空不空——你说句话，我好记。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「凳子空着，是我陪别人去了。」', effect: 'tell' },
                { text: '「雨再大，我只往你这一处躲。」', effect: 'reassure' },
                { text: '「记这么细，华山收我账钱？」', effect: 'deflect' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            var dao = rival && rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'tell':
                    aff = dao ? -8 : -5;
                    msg = '他笑了一声，提笔在那页上记了一笔，字写得又快又稳：「……' + (rival ? rival.name : '那位') + '。」他吹干墨，把簿子推给你看——那一笔底下注了四个小字：「实报，销账。」他抬头，笑意没散，眼底却静了下来，「你肯说实话，华山这本账就平得了。往后你的来期，照旧记——我记账，从不记恨。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
                case 'reassure':
                    aff = dao ? -3 : 4;
                    msg = dao
                        ? '「躲雨。」他笑着点头，把簿子收进抽屉，「话好听。账不认话——认凳子。」他摆摆手，「不说了，不说了。雨夜的账，往后我自己听。」'
                        : '他把那册小簿往你面前一推，笔也递给你：「那这笔你自己记。你来一回，记一笔——记满一页，我把这页裱起来，挂剑堂。」他笑，「雨夜听雨，两个人听，雨声都轻些。这话我记账上，不算虚言。」';
                    break;
                case 'deflect':
                    aff = dao ? -13 : -8;
                    msg = '「收，怎么不收。」他笑起来，连连摆手，「华山穷得只剩账了——账钱没有，人情账倒有一笔。」他把簿子合上，锁进抽屉，钥匙在指上转了一圈，笑意还挂着，声音却沉了半寸，「账房今日盘账，不留客。你回吧。等哪天你想清了那两夜的雨——剑堂的门没锁。凳子……我搬走了。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 7);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 晏万解：银针试毒，针尖认得别人的药气 ----
    'tm_event_probe': {
        id: 'tm_event_probe', npcId: 'sect_leader_唐门', title: '针色', icon: '🪡',
        desc: '她替你验茶，银针的针尖，变了色。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'tm_e_probe_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '唐门毒堂。她把一盏茶推到你面前，笑吟吟看你端杯——眼看要喝，一线白丝掠过，银针先你一步插进了盏里。针尖拔出来时，黑了半分。', type: 'description' },
            { speaker: 'npc', text: '「别怕，茶没毒。」她捻着银针对着灯看，笑得好看，话也好看，「茶是没毒——针不干净。这针尖上沾着别人的药气，淡得很，混在你的汗气里，端盏的时候才熏出来。」' },
            { speaker: 'npc', text: '「我这双手自幼浸毒，十种毒近不了身，十种香认得出。」她把银针往盘里一丢，叮的一声，笑还挂着，「药气沾人，心气也沾人。你把心气分给了别处半份——别瞒我的针。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「……药气是另一个人的。我不瞒。」', effect: 'tell' },
                { text: '「我身上只有你的味道，针认错了。」', effect: 'reassure' },
                { text: '「唐门的针，如今管到我茶碗里了？」', effect: 'deflect' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            var dao = rival && rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'tell':
                    aff = dao ? -8 : -5;
                    msg = '她擦针的手停了，把那根银针擦了一遍，又擦了一遍，擦得锃亮。「……' + (rival ? rival.name : '那人') + '。」她把针收进针囊，声音还带着刺，刺尖却软了半分，「唐门毒谱有条旧例：自己招了的，罚减一半。剩下一半——」她瞪你一眼，「往后你每来一回，我验一回。验到针尖干净了，罚才算完。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
                case 'reassure':
                    aff = dao ? -3 : 4;
                    msg = dao
                        ? '她笑了，笑得很甜，把茶盏往案前一推：「只有我的味道？话真甜。」她收起银针，白丝手套的指尖在盏沿敲了敲，「针不听话，针认颜色。下回它再变色——你自己端盏，当着我的面喝下去。」'
                        : '她一怔，白丝手套的指尖蜷了蜷，把银针收了回去：「……哼。」她把茶盏重新推到你面前，耳根有点红，话还是硬的，「喝。这盏茶你今日喝不完，我就当你的嘴，是给别人尝过糖了。」后来她把你的茶又验了三回，回回针尖干净。她不说，茶却泡得一回比一回好。';
                    break;
                case 'deflect':
                    aff = dao ? -13 : -8;
                    msg = '她脸上的笑没散，反倒更亮了。「管到你茶碗里。」她把盘里的银针一根一根收齐，慢慢数着，「唐门的针，一根验七步化心散，一根验九转还魂香——最末这根，」她把针囊扣上，咔的一声，「验人心。毒堂今日打烊。你回去想清楚那半份药气是谁的，再来。来的时候——自带茶。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 7);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 阙守拙：推手数拍子，扫阶数脚印 ----
    'wd_event_probe': {
        id: 'wd_event_probe', npcId: 'sect_leader_武当派', title: '半拍', icon: '☯️',
        desc: '推手时你慢了半拍——他数出来了。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'wd_e_probe_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '真武殿前。晨雾没散，他与你推手。推到第七个回合，他收了掌，站在原地，看了看自己的手，又看你。', type: 'description' },
            { speaker: 'npc', text: '「慢了半拍。」他说。停了一会儿，像等你把这句话接住，才继续，「第四回合慢的。第六回合，又慢。从前推手，你不慢。」' },
            { speaker: 'npc', text: '「扫阶的时候，我数脚印。」他望着殿外的石阶，说得很慢，「你这个月的脚印，稀。人心分出去一半——」他收回目光，落在你脸上，「拍子就散。拍子不撒谎。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「慢的那半拍，是给另一个人了。」', effect: 'tell' },
                { text: '「拍子没散。再推一回，你听着。」', effect: 'reassure' },
                { text: '「推手就推手，数我的脚印做什么。」', effect: 'deflect' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            var dao = rival && rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'tell':
                    aff = dao ? -8 : -5;
                    msg = '他没有立刻答。他抬起手，掌心对着掌心，像量那半拍的距离。「……' + (rival ? rival.name : '那人') + '。」他把这个名字放得很轻，像放下一柄剑，「你肯说，好。武当的规矩，说实话的，不罚。」他收手，「只是拍子——你自己捡回来。捡回来了，再跟我推手。」他转身进殿，走了两步，补了半句，「我等得起。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
                case 'reassure':
                    aff = dao ? -3 : 4;
                    msg = dao
                        ? '他看你一会儿，抬手，作了个「请」的势。这一回他推得极慢，慢得你不得不跟上。推完，他收掌，摇头：「拍子在。心——」他没说下去，把掌收了，「再推。推到拍子回来为止。」'
                        : '他点头，抬手。这一回推手，他忽然快了半拍——你猝不及防，竟接住了。他收掌，嘴角动了动，勉强算个笑：「接得住。」他说，「接得住，就别散。」顿了顿，又补一句，「脚印，我不数了。拍子——我替你数。」';
                    break;
                case 'deflect':
                    aff = dao ? -13 : -8;
                    msg = '他不争辩。他弯腰，把手掌平放在石阶上，像数什么看不见的东西。数完，起身：「三百六十五级台阶，我扫了二十年。」他说得很慢，「哪一级有脚印，哪一级没有——不用手数。」他拢了袖，背过身去，面向真武殿的门，「今日推手，到此。你回去数自己的脚印。数完了，来说给我听。说不来——」晨钟响了一声，他停住，剩下半句留在钟声里。';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 7);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 瀛晚照：潮信图录的页角，「岸上人」的日子稀了 ----
    'pl_event_probe': {
        id: 'pl_event_probe', npcId: 'sect_leader_蓬莱派', title: '岸上人', icon: '🐚',
        desc: '她翻着潮信图录，报出你上岸的日子——数目稀了。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'pl_e_probe_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '观汐台。黄昏录潮，她案头的图录摊开着——不在潮信那一页。页角有一栏小注，注的是「岸上人」，底下一行行的日子，全是你的。她的指尖停在最末几行上，停了很久。', type: 'description' },
            { speaker: 'npc', text: '「你上岸的日子。」她开口，声音平得像在念录，「这个月，四日。上月，十一日。再上月，十九日。」她指尖一行一行点过去，「潮涨几时来、几时退，二十年，我记的数目没有错过一回。你的日子——如今也成数目了。」' },
            { speaker: 'npc', text: '「录潮的人，不问岸上事。」她抬眼，目光平得像无风的海面，「只是这一栏稀下来，我录潮的手会停。停一回，误一笔。你答我一句——你心里的日子，如今分给几处？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「分了两处。日子我不瞒你。」', effect: 'tell' },
                { text: '「岸上人这一栏，往后只记我一个。」', effect: 'reassure' },
                { text: '「你录你的潮，数我的日子做什么。」', effect: 'deflect' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            var dao = rival && rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'tell':
                    aff = dao ? -8 : -5;
                    msg = '她执笔的手停了。海风把图录掀过半页，她按住，在那一栏的空行上落了今天的日期，日期底下注了两个小字：「实报」。「……' + (rival ? rival.name : '那人') + '。」她把这个名字念得很平，像念一笔潮信，「名字我不必问。日子会报。」她合上图录，「图录不记假话。你肯报，这一栏就续得下去。只是往后的数目，我照旧记——记到几时，看数目，不看我。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
                case 'reassure':
                    aff = dao ? -3 : 4;
                    msg = dao
                        ? '「只记你一个。」她把图录合上了，合得极轻，「话我听见了。纸不认话——认日子。」她重新翻开潮信那一页，执笔录潮，不再看你，「亥时的潮会回。你的日子几时回，册子记着。」'
                        : '她执笔的手顿了半息。半晌，她把「岸上人」那一栏的纸页抚平，声音照旧平，耳根却有一点颜色：「那这一栏，我裁厚些。」她低头补录今日的潮，「裁厚了的纸，经得起多记。记满一页——满一页的日子，你自己来数。」';
                    break;
                case 'deflect':
                    aff = dao ? -13 : -8;
                    msg = '她不恼。她提笔，把今日的潮一笔一笔录完，字迹稳得没有一丝波动。录完，她把图录转向你，指那一栏稀下去的日子：「数目我照记。观汐台的规矩——潮来了记，潮退了记，不来的，空着。」她合上册子，抱在怀里，「空栏不难看。难看的是一年年空下去。你回吧。这一栏几时补、补不补，纸等着。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 7);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 闻人酌：斟酒尝出杯底残味，棋路里数出你的火气 ----
    'xy_event_probe': {
        id: 'xy_event_probe', npcId: 'sect_leader_逍遥派', title: '残味', icon: '🍶',
        desc: '他给你斟酒，杯底那一线残味，他尝出来了。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'xy_e_probe_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '酒仙池边。他照旧躺在坛边，就着你的手给你斟酒——斟到一半，停了。他把你的杯子拿起来，对着天光晃了晃，竟自己先抿了一口，咂了咂。', type: 'description' },
            { speaker: 'npc', text: '「杯底有别人的酒。」他懒懒地说，像说一桩天下最好笑的事，「太白先生写过『两人对酌山花开』——你这一盏里，倒像坐着两位。」' },
            { speaker: 'npc', text: '「前日下棋，你那一路的火气也不对。」他把杯子还你，撑着下巴看你，眼里的醉意退了一线，「棋有棋路，酒有酒味，琴有琴拍——三样都藏不住事。说说吧，我这坛边，几时成了第二席？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「……那半盏，是陪另一个人喝的。」', effect: 'tell' },
                { text: '「杯底干净。往后我的盏，只在你这儿斟。」', effect: 'reassure' },
                { text: '「喝你的酒，还要验你的杯底？」', effect: 'deflect' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            var dao = rival && rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'tell':
                    aff = dao ? -8 : -5;
                    msg = '他斟酒的手停了半拍，随即笑出声——笑声还是那个笑声，盏却给你续满了。「……' + (rival ? rival.name : '那人') + '。」他举盏与你一碰，「坦白从宽，古今同理。」他饮了半盏，指尖在坛沿上敲了敲，「酒我照斟，棋我照陪。只是这一坛，往后的封泥上，我得多写一行小字：分过盏的人。这行字压不压得住酒味——你自己掂量。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
                case 'reassure':
                    aff = dao ? -3 : 4;
                    msg = dao
                        ? '「只在我这儿斟？」他笑起来，替你把酒续满，满得溢出一线，「好话。酒不认话——认杯底。」他仰头饮尽自己那盏，「下回杯底再有味，你自己当着我的面，把它喝干净。喝得干净，这话我就当听过。」'
                        : '他一怔，酒瓢悬在半空，悬了三息。耳根有点红，话还是懒的：「行。这话我记在坛上了。」他把你的盏斟满，又把自己的斟满，两盏一碰，「坛记性好。开坛那日——你说的每一个字，都跟着酒味一起出来。到时候别赖。」';
                    break;
                case 'deflect':
                    aff = dao ? -13 : -8;
                    msg = '「验杯底。」他点点头，竟当真把你的杯子倒扣在坛盖上，扣得端端正正，「酒仙池的规矩，本来不验——今日破个例。」他抱起琴，拨了半阙，琴音清清冷冷，与平日的懒散判若两人，「你回吧。等哪天你想说清那半盏是谁的了——」琴音停了，他重新躺回坛边，把琴盖在脸上，「坛在这儿，酒还温着。温到几时，看我高兴。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 7);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 祁清禅：晚课的木鱼，少敲了一声 ----
    'heng_event_probe': {
        id: 'heng_event_probe', npcId: 'sect_leader_恒山派', title: '少一声', icon: '📿',
        desc: '晚课的木鱼少敲了一声——她自己听出来了。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'heng_e_probe_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '白云庵晚课。你照例在檐下听——今日木鱼声声不疾不徐，敲到收尾处，忽然停了：少了一声。满殿的经声随之一顿。她跪在队首抱着木鱼，脊背很直，没有回头。', type: 'description' },
            { speaker: 'npc', text: '课散，她下阶来，旧木鱼抱在袖中，那道铜锔的细裂朝着外。「木鱼管拍子。」她声音很轻，「六年晚课，它没有少过一声。今日，少了一声。」' },
            { speaker: 'npc', text: '她抬眼看你，温静，不躲。「抄经也一样。昨夜回向页上，我写乱了一行——笔没有错，是心挪了挪。」她顿了顿，「挪心的不是我。是你——你近日来庵里少了。施主，你的心，挪去了哪儿？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「挪了一行，是我的错。我心里多了一个人。」', effect: 'tell' },
                { text: '「少的那一声，我替你补。往后你的晚课，我场场来听。」', effect: 'reassure' },
                { text: '「木鱼是木头，少一声便少一声。」', effect: 'deflect' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            var dao = rival && rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'tell':
                    aff = dao ? -7 : -4;
                    msg = '她合掌的手停了半息。半晌，她把木鱼搁在阶旁石上，从袖中取出那页抄经的回向页——写乱的那一行没有抹，也没有描。「……' + (rival ? rival.name : '那人') + '。」她把这个名字念得很轻，像念别人的回向。「你肯说，我领这份情。」她把回向页折回原痕，「华严的回向页，名字抹不得——抹了，经就乱了。这一行，我陪你慢慢抄。抄顺了，木鱼的那一声，也就回来了。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
                case 'reassure':
                    aff = dao ? -3 : 4;
                    msg = dao
                        ? '「场场来听。」她垂下眼，指腹在木鱼的铜锔上抚过一遍。「话是好的。木鱼不认话——它认拍子。」她把木鱼收回袖中，「下回晚课再少一声，就是你没来。它不会一直少——你不来，它就不敲了。」'
                        : '她的指尖在铜锔上停了停。半晌，她把木鱼从袖中取出，搁进你掌心：「那你敲。」你敲了一声，声音发闷，她听着，微微摇头，眼角却松了松。「拍子不对。明日起晚课，我教你。」她把木鱼收回去，用素布裹好，「学的人，要日日到场。木鱼认人——敲熟了，声就暖了。」';
                    break;
                case 'deflect':
                    aff = dao ? -11 : -7;
                    msg = '她不辩。她只把袖中那块素布解下来，将木鱼一层一层裹好，动作很轻，很稳。「少一声，便是少一声。」她重复了一遍，声音比平日更轻，「木鱼安的是心。心挪了，声就散——声散了，满殿的晚课都跟着乱。」她合掌，侧身让开石阶，「今日多言了。施主请回。静室的晚课，明日起改个时辰——改在你不路过的时辰。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 6);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 逵佩南：来山日的档册，日子那条腿缺了 ----
    'song_event_probe': {
        id: 'song_event_probe', npcId: 'sect_leader_嵩山派', title: '对不上的数目', icon: '🖋️',
        desc: '你来嵩山的日子他记在册上——缺了三日，他逐条核了出来。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'song_e_probe_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '执法堂。他在核每月的山门档册——谁人入山、所为何事、几日离去，逐件有据。核到你名下，他的指尖在一行上停住，顿了顿，翻回前两页，又核了一遍。', type: 'description' },
            { speaker: 'npc', text: '「你的档。」他把卷宗推过来，语气像在念条文，「本月你入山四次。档册记事，四件事都写着——日子只有三个。缺的那一日，无事可记。」他抬眼，「执法堂核档，讲三条腿齐整：来路、口气、日子。你的——日子那条腿，缺了。」' },
            { speaker: 'npc', text: '「我没有查你。」他把卷宗合上，合得端端正正，「档是死的，人是活的。缺的是条，还是人，档说不出——」他的目光落在你脸上，停住，稳得像在等一枚画押，「你自己报。你的日子，如今分给几处？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「缺的那一日，我陪另一个人去了。」', effect: 'tell' },
                { text: '「日子只是纸上缺了。人一天也没缺过你这儿。」', effect: 'reassure' },
                { text: '「核到我头上——执法堂有这一条么。」', effect: 'deflect' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            var dao = rival && rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'tell':
                    aff = dao ? -8 : -5;
                    msg = '他执笔，在档册那一行空缺上落了个小注，笔锋极稳：「' + (rival ? rival.name : '那人') + '处」。注后「实报」两个字，他写得尤其小。「肯报，按条，罚减等。」他搁笔，「但减的只是今日。往后你的档，你自己写，我核。执法堂的道理：自首的，存档；瞒的——」他把卷宗归架，归得极正，「存到另一册去。两册的分量，你回去自己掂。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
                case 'reassure':
                    aff = dao ? -3 : 4;
                    msg = dao
                        ? '「人没缺过一日。」他重复了一遍，像在核一条陌生的条文。「档不认话——认日子。」他把卷宗收回去，收得极稳，「这一条，暂记『待核』。下月日子再缺——我亲自立案。立案的人是我，断的人也是我。断什么，你已经知道了。」'
                        : '他翻页的手停了半息。半晌，他从卷袋里抽出一张空白签，写了一行小字，折成三折递给你：「回执。」你展开——「档缺一目，人称未缺。存照。」『存照』两个字写得极重。「执法堂不收人的回执。」他耳廓微红，语气照旧平平，「今日破例。你收着——日子补齐了，来换正本。」';
                    break;
                case 'deflect':
                    aff = dao ? -12 : -8;
                    msg = '他「嗯」了一声，当真翻开执法堂的新章，一页一页翻到末尾，指给你看一条空白：「第一百零七条往后，没有『核到你头上』这一条。」他合上新章，「因为从来没人敢叫我无据而核。今日我核了——有据。」他起身，玄衣一振，吹熄了案上的灯，「回去。三日后再来。三日内你把缺的那一日说清楚，按条，我不贴你；说不清——我贴。贴的不是你，是那一行小注：『此目待释』。挂在堂口，满山都看得见。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 7);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 岳清晓：迎旭的火，走神了半拍 ----
    'tai_event_probe': {
        id: 'tai_event_probe', npcId: 'sect_leader_泰山派', title: '火走神', icon: '🔥',
        desc: '迎旭那日她的火慢了半拍——她直说：怪你。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'tai_e_probe_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '寅时，玉皇顶。你照例上来陪她临火——今日的火色不对。天边裂白那一刻，坛里的火本该最旺，却慢了半拍，紫气东来散了一线。她握着火钩立在坛前，盯着那半拍的火，脸上的光一寸一寸黯下去。', type: 'description' },
            { speaker: 'npc', text: '「火走神了。」她头也不回，声音照旧直，直得发冷，「临火十年，误过零回。今日慢半拍。」她把火钩往炭里一拨，拨得哗啦一响，「不怪炭，不怪风。」' },
            { speaker: 'npc', text: '她转过身来，眼睛盯着你，情绪全摆在脸上，一点也不藏：「怪你。你这几日没上顶——我记档，记到你上顶的日子那一栏，笔落不下去。」她把火钩往地上一顿，「临火人记档，不是疑心谁。是我这一档记了一千次日出，就你这一栏，如今记不上了。你直说——你的心，挪哪儿去了？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「直说。我心里多了一个人。」', effect: 'tell' },
                { text: '「往后寅时，我先你一步上盘道。档，你亲手记。」', effect: 'reassure' },
                { text: '「你的火走神，与我上不上顶有什么相干。」', effect: 'deflect' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            var dao = rival && rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'tell':
                    aff = dao ? -8 : -5;
                    msg = '她愣了足有两息，握火钩的手紧了紧，又慢慢松开。「……' + (rival ? rival.name : '那人') + '。」她把这个名字嚼了一遍，转身朝火坛拨了三下炭，火苗窜起来又落下去。「行。你直说——比满山的人都直。」她当着你的面记档，那日的火色写得极稳，页尾添了一行小字：实报。「泰山的规矩，自首的不没收档。」她合上档，下巴一抬，眼底的光却没回来，「只是你这一栏，我不销。留着——留到你自己拿脚把它走直为止。留几天，你陪我一起数。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
                case 'reassure':
                    aff = dao ? -3 : 4;
                    msg = dao
                        ? '「先我一步？」她笑了一声，笑得极短，把档合上了，「好话。」她扛起火钩走到台沿，望着东边，「火不认话——认人。下回迎旭它再走神，你就站坛子左手边，当面看着它走。看它走神的工夫，够不够你上顶。」'
                        : '她手里的火钩差点没拿住——接住了，接得极稳，脸上的光唰地一下全回来了，比坛里的火还亮：「你说的！」她当场掏出档册，翻到新的一页，笔塞进你手里，「写。你上顶的日子那一栏，往后你自己写，我核。」你写完，她把档收回去吹干，揣进怀里，揣得极实。「写一日，核一日。缺一回——」她咬牙切齿，「我就下十八盘找你当面核！」';
                    break;
                case 'deflect':
                    aff = dao ? -12 : -8;
                    msg = '她瞪着你，瞪得眉毛都立起来了，火光在她眼睛里跳。「相干？」她拿火钩指着坛里的火，「这火，寅时烧给谁看？满泰山的第一缕日光，一半归山，一半——」她猛地收住，火钩撤回去，转身拨炭，拨得火星子噼啪响，「走。今日的档，我不记你那一栏了。」第二日你从师弟口中听说：师姐那日迎旭迎得极全，只是火坛左手边那块她惯常让人坐的石头，她拿布拂了一遍又一遍——拂完，把布叠得方方正正搁在石头上，像再不用了。';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 7);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 幽翠微：一匾茶青炒过了火，怪手，手怪心 ----
    'qing_event_probe': {
        id: 'qing_event_probe', npcId: 'sect_leader_青城派', title: '炒过火', icon: '🍃',
        desc: '这一匾杀青过了火——她骂火，骂手，最后骂到你头上。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'qing_e_probe_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '松风观后山焙房。你才跨过排水沟，就听见锅里的茶铲刮得特别快——她这一匾杀青，锅温明明过了，手却慢了半拍。茶香里带出一线焦边。她把锅离了火，拈起一片叶子对着日头看，叶脉黄了。', type: 'description' },
            { speaker: 'npc', text: '「坏了。」她把茶铲往灶台上一丢，话快得像炒茶，「锅温过了三十息，手慢了三十息。头一茬，炒成柴了。」她瞪着那锅茶，忽然又弯腰抓了一把闻闻，脸色变了，「不对。火没错——火是我自己看的。手没错——手是炒了十年的手。」' },
            { speaker: 'npc', text: '她直起身指着你，一点弯都不绕：「是心错了。你这几日不上山，我一炒茶，到你平日来的那个时辰，手就顿半拍。顿一匾，焦一匾。」她在围裙上擦手，声音清亮，亮到末尾有点空，「茶不等人。人呢——人等不等茶？你给我句直话。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「直话：我的心分了半，给了另一个人。」', effect: 'tell' },
                { text: '「人等茶。往后你炒茶的时辰，我在檐下。」', effect: 'reassure' },
                { text: '「炒焦一匾茶，赖得着我么。」', effect: 'deflect' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            var dao = rival && rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'tell':
                    aff = dao ? -8 : -5;
                    msg = '她擦围裙的手停住了。她盯着你看了两息，转身把那锅过火的茶全铲出来，又看了一眼——像确认这锅还有没有救。「……' + (rival ? rival.name : '那人') + '。」她把这个名字说得很快，快得像怕自己说不完，「行。你认账，比这锅茶有救。」她把过火的茶分成两匾，一匾推给你，「青城的规矩：焦茶不扔，留着提神。这匾你拿走，什么时候想明白了，什么时候泡来喝。苦完了——回来，我新炒的出锅。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
                case 'reassure':
                    aff = dao ? -3 : 4;
                    msg = dao
                        ? '「檐下？」她抄起茶铲，把那匾茶重新坐回灶上，火拨起来了，不看你，「好话。茶不认话——认手劲。」火色一亮，她的手也稳了，炒得极匀，「下回我的手再顿半拍，你人不在檐下——那一锅出来就不是焦茶，是凉茶。凉了的锅，比焦了的难救。你自己掂。」'
                        : '她怔了半拍，茶铲悬在锅上，悬了三息，耳根先红了，话还是快的：「你说的！这话记在茶账上了——」她猛地想起锅里还热着，赶紧低头翻炒，那一匾茶炒得极好。出锅时她当场分了你半包，包口封得紧紧的，「头一茬。过火的不给你。」她别过脸去，「往后每回新炒，头一包是你的。架顶那只旧罐认这个规矩——我也认。」';
                    break;
                case 'deflect':
                    aff = dao ? -12 : -8;
                    msg = '「赖你？」她点点头，点得飞快，抄起那锅过火的茶走到灶前，哗地一声全倒进了灶膛——白烟腾起一股，满焙房的焦香冲上来一次，散了。「茶焦了，你说我赖。」她把锅坐回去，拿茶夹把最后一片叶子夹回匾里，「看茶的人骂火不骂人——今日破例，骂一回人。」她蹲在灶前重新生火，背对着你，火光映着她的侧脸，「走。这锅我重炒。重炒出来是谁的错，锅知道，我知道。」灶火噼啪响了一声，她添了一句，声音混在火风里，「你最好也知道。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 7);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 奚湘筠：夜雨的半阙里，一音停了 ----
    'xiang_event_probe': {
        id: 'xiang_event_probe', npcId: 'sect_leader_衡山派', title: '一音停了', icon: '🎻',
        desc: '夜雨的半阙里停了一音——她说，是我拉错了。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'xiang_e_probe_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '回雁琴台，夜雨。你照例立在檐下听那半阙——今晚拉到惯常的收尾处，弓毛忽然在弦上顿住：一音停了。停得极干净，像一滴墨落纸就收了笔。她抱着胡琴坐在台上，没有回头，弓尖悬在弦上，不落。', type: 'description' },
            { speaker: 'npc', text: '「昨夜，你不在檐下。」她开口，还是那么几个字，慢，字与字之间落着雨，「一音停了。是我拉错了。」' },
            { speaker: 'npc', text: '她这才回头，眼神是温的，慢慢地落在你脸上。「曲子藏不住事。心分了两处——」弓毛轻按了一下弦，一个极低的音渗出来，又停住，「我听得出。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「你听得出。我心里多了一个人。」', effect: 'tell' },
                { text: '「心没分两处。那一音，是你自己拉岔了。」', effect: 'reassure' },
                { text: '「拉胡琴的，一音停了也赖檐下听客？」', effect: 'deflect' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            var dao = rival && rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'tell':
                    aff = dao ? -7 : -4;
                    msg = '她按弦的手没有动。雨在台上落了一阵，她低下头，看膝上那份旧谱——下半阙洇毛的空白，朝着外。「……' + (rival ? rival.name : '那人') + '。」她把这个名字念得很轻，像念谱上的一个板眼，「你肯说。」她用袖口把弓毛上的浮雨拭去，一下，一下，「半阙我照拉。下半阙——」谱合上了，合得极轻，「本来想慢慢长出来。如今，慢慢长，慢慢誊。誊成的那日，你若还在檐下——雨知道。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
                case 'reassure':
                    aff = dao ? -3 : 4;
                    msg = dao
                        ? '「我拉岔了。」她重复了一遍，转回去对着雨幕。半晌，她把那半阙从头拉起，拉到停住的那一音——弓速不缓、不停，过去了。拉完她收弓，只说了四个字：「曲子过去了。」胡琴裹进油布，「人——你自己想。」'
                        : '她的眼睛在你身上停了两息。忽然她把胡琴放回膝上，弓毛压弦，把停住的那一音重新拉了一遍——这一回音没有停，拉得很长，长到末尾微微上扬，混进雨声里。「岔了？」她问，极难得地，眼角松了一点。当夜的半阙收弓后，台角那只蒲团，朝檐下挪近了半步。她没说给谁坐。也不必说。';
                    break;
                case 'deflect':
                    aff = dao ? -11 : -7;
                    msg = '她不辩。她收起弓，把胡琴一层一层裹进油布，裹得很慢。「赖听客。」三个字她念了一遍，声音照旧慢，字字都沉，「师父说，曲成之日，下山之时。我十年只拉半阙——是不想下山。」她系好油布的绳，抱着琴起身，走过你身边时脚步停了半息，「今夜的话，雨听见了。往后的夜曲，改个时辰。改在没有人的时辰。」她下台后，琴台的灯还亮了一夜——灯在，曲没有。';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 6);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 桑拾玖：你的事，他比你先知道 ----
    'gai_event_probe': {
        id: 'gai_event_probe', npcId: 'sect_leader_丐帮', title: '三条腿齐', icon: '🥣',
        desc: '你不来的日子，来路、口气、日子，他全有。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'gai_e_probe_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '城南沙粥棚。他照旧说书，眉飞色舞，满棚叫好。你坐下时他的书没有停，一碗豁口粗碗的粥却已经搁在你手边——温的，像早算准了你来的时辰。书说到关窍，他折扇一收，转头看你，眼里还带着笑。', type: 'description' },
            { speaker: 'npc', text: '「来得正好，客官。」他拍拍身边条凳，语气像接着说书，「我这儿正有一段——有位客人，近日日日走两条道，一条通我们这儿，另一条，不知通哪儿。这一段，列位说说，是真是假？」满棚哄笑。只有他自己不笑，舀了口粥，等你答话。' },
            { speaker: 'npc', text: '人散了，他收碗，声音落下来，平得像在讯房核签：「消息三条腿：来路、口气、日子。」他把两只豁口碗摞起来，摞得整整齐齐，「你的事，来路我有了，日子我有了。只差口气——」他抬眼看你，「讯房管天下人的消息。你的，我想听你自己说。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「我说。我心里多了一个人，日子分了两处。」', effect: 'tell' },
                { text: '「一条道。我走的道，从头到尾就这一条。」', effect: 'reassure' },
                { text: '「讯房的，查我查得挺全啊。」', effect: 'deflect' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            var dao = rival && rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'tell':
                    aff = dao ? -8 : -5;
                    msg = '他摞碗的手停了半拍。他沉默了一会儿，忽然笑了，笑得比说书时轻：「……' + (rival ? rival.name : '那人') + '。三条腿，齐了。」他把最后半碗粥倾回桶里，倾得很稳，「讯房的规矩：实话出口，消息就不核第二遍了。」他收好碗，望了一眼棚柱左边第三个位子——你的座，「只是你这一段，我不能拿去说书。说了，满棚笑；我笑——」他顿了顿，「就是假的了。往后你的事，你亲口来报。报给谁？报给这棚里第一个盛给你的那碗粥。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
                case 'reassure':
                    aff = dao ? -3 : 4;
                    msg = dao
                        ? '「就这一条。」他点点头，像给一条消息落了个批注，「好话。讯房不认话——认日子。」他把那只温着的粥碗收走了，收得极慢，「日子报上来是什么，比嘴说的真。你回去自己核一核你的日子——核完了来，把口气那条腿，报给我。报实了，这一案才算结。」'
                        : '他愣了一息，转脸朝棚顶，像认真核这条消息，耳根有点红，说书的腔调还在，声音却压低了：「……这一段，三分真、七分好听——不对。」他把碗重新搁回你手里，又添了半勺粥，「这一段，十分真。入册。」他清了清嗓子，恢复如常，「讯房的册子，入了就不销。你记着。」';
                    break;
                case 'deflect':
                    aff = dao ? -13 : -8;
                    msg = '「查。」他把这个字咂摸了一遍，笑了，把折扇收进袖里，「讯房管消息，不管人——这规矩我守了十二年。今日你叫它查。好。」他把碗一只一只摞回架上，摞得极齐，「那我就查到底：你这几日两条道，来路、日子，我背得出——哪一日你上了哪座山、哪一夜你没来，一件一件，不差一个字。」他背起百衲衣，暮色里背对着你，「想听么？——你不想。那就不说了。粥棚的书照讲，你那一段，从明日起跳过。跳过的时候满棚会问，问的时候我只笑，不答。」他走进暮色里，声音远远飘回来，「笑而不答，是讯房最重的规矩。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 7);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 聂明泽：你的档他复核了三遍——日子那条，对不上 ----
    'yan_event_probe': {
        id: 'yan_event_probe', npcId: 'sect_leader_阎罗殿', title: '复核', icon: '🖊️',
        desc: '他把你的档抽出来复核——来档的日子，对不上了。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'yan_e_probe_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '阎罗殿后山档房。千架旧册，灯油味压着纸味。他在复核上月的来档——核到你名下，笔停了。翻回前两页，又核一遍。核完，他把你的档从架上调了出来：那档格不知何时挪过，挪在离他手最近的一格。', type: 'description' },
            { speaker: 'npc', text: '「你的档。」他把册子推过来，念得又快又平，像倒豆子，「本月，你来四次。录了——三次。」停了一下。「一次，空白。无事由。」' },
            { speaker: 'npc', text: '「档规，卷二：有疑，复核。我复核了。」他的指尖压在那行空白上，指节有点白。「复核的结论，只有一条。此事……」他顿住，抽出一张新档纸，落笔写了两个字，又拿笔划掉。「……记档。」他抬眼看你，「你的日子，如今分几处。你自己，报。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「……两处。我不瞒你。」', effect: 'tell' },
                { text: '「一处。空白那条，你记岔了。」', effect: 'reassure' },
                { text: '「我做什么、几时做，还要报给你的档？」', effect: 'deflect' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            var dao = rival && rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'tell':
                    aff = dao ? -8 : -5;
                    msg = '他盯着那张划掉字的档纸，看了很久。然后他提笔——不是朱笔——在空白那行添了个小注，一笔一划：「' + (rival ? rival.name : '那人') + '处」。写完，照例念给你核对，念完耳朵红了。「档，不问心的去处。」他搁笔，「只录日子。你肯报实——按规，销疑。」他把你的档归回那格离他手最近的档格，归的时候按了按，按得很实。「只是这一格，我不挪回去了。档规说：复核中的卷，搁近手处。复核的期限……」他停了极小的一息，「规上，没有这一条。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
                case 'reassure':
                    aff = dao ? -3 : 4;
                    msg = dao
                        ? '「一处。」他重复了一遍，像在核一条陌生的档。「档不认话——认日子。」他把你的卷宗合上，「此事，暂记『待释』。下月日子再空——我亲自复核。」顿了顿，声音低了半格，「复核的人是我。记档的人，也是我。」'
                        : '他翻页的手停了半拍。半晌，他把那张划掉字的档纸撕下来，折成三折，塞进你手里——「档不出档房。」他耳根红着，语气照旧平，「这是头一回。你收着。上头写了什么——你看见了。没看见……」他把你的档归回原格，归得极实，「回去，对着灯照。看得见。」';
                    break;
                case 'deflect':
                    aff = dao ? -12 : -8;
                    msg = '他不辩。他只把你的档合上，归格，摆得和案角平行。「档规，卷一，第三条。」他一字一顿，「所见，皆录。」他取出一枚新档签，提笔写了两个字——「未定」——贴在你的档格正面，按平。「贴着『未定』的卷，每日一复核。」他坐回去，执笔，没抬头。笔尖走纸，走了一行，停住。「判官大人说，记档的手比刀冷。」他盯着那行字，「我没驳过这句。今日想驳——」他把笔搁下，「冷的手，贴签的时候，手是抖的。你看出来了。档里没有这一条。你也不必记。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 7);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 耿雪衣：白药碾过了头——她的手，从不出错 ----
    'xue_event_probe': {
        id: 'xue_event_probe', npcId: 'sect_leader_血手门', title: '碾过头', icon: '🌿',
        desc: '那日的白药碾过了头三转——她报数报重了你，还问这样是不是很奇怪。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'xue_e_probe_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '血手门一角的药庐。素灯，药匾，满院白药泡在香气里。你进门时她在碾药——药碾子骨碌、骨碌，碾了足有一炷香还没停。白药三十转就够，她分明碾过了五十。', type: 'description' },
            { speaker: 'npc', text: '「哦。」她终于抬头，看了一眼碾盘，语气平得像报数，「碾过头了。浪费。」她把药粉拢出来看了看，很认真地更正，「不浪费。就是细过头了。细过头也能用——只是我的手，今日出了错。」' },
            { speaker: 'npc', text: '她放下药碾子洗手，水珠顺着指尖往下滴。「碾药三年，手没有出过错。今日我数来庐里的人——数重了一个。把你，数了两回。」她看着你，眼睛干净，不设防，「数了一遍，又数一遍。这样……是不是很奇怪？」她没等你答，自己去看匾里的白药，背对着你，声音还是平的，「你的日子，最近像分成了两处。数不到的那一处——是什么？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「是一个人。我不瞒你。」', effect: 'tell' },
                { text: '「没有人。你数重了，就是数重了。」', effect: 'reassure' },
                { text: '「你数你的药，数我做什么。」', effect: 'deflect' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            var dao = rival && rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'tell':
                    aff = dao ? -8 : -5;
                    msg = '她翻药的手停了。她沉默了一会儿，回身坐下，取过一张新方纸，提笔——「那我记下来。」她在纸头写下你的名字，底下一行小字：' + (rival ? rival.name : '那人') + '处。写完念了一遍，像核对一张方子。「药庐记人，记缝过的针数。你这一条——」笔尖停了停，她想得很认真，「你这一条，我记日子。几日在这儿，几日在那儿。」她把方纸折成三折，没有收进布包，压在了灯座底下。「压在灯底下，每晚都照见。不是查你。」她补了一句，补得很快，「是怕忘。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
                case 'reassure':
                    aff = dao ? -3 : 4;
                    msg = dao
                        ? '「数重了。」她重复了一遍，点点头，回去接着碾药。药碾子骨碌、骨碌，碾过五十转，停了——这一回，是三十转。「药认数。」她说，声音还是平的，「下回再数重，就不是药的错了。」她把碾好的药收进纸包，包角折得整整齐齐，「你这一条，我先记『再核』。再核不难——人来，就数得着。」'
                        : '她的耳朵慢慢红了，语气还努力端着平：「哦。数重了。」她把药碾子推回原位，忽然想起什么，从灯座底下抽出一张方纸递给你——一张伤风的方子：姜三片，枣五枚，葱白两段。「不能白来。」她说得很认真，「往后你伤风了，有地方去。不伤风……」她想了想，「不伤风也可以来。药庐不只看病。这一条，是我今日新想的。」';
                    break;
                case 'deflect':
                    aff = dao ? -12 : -8;
                    msg = '她看了你两息。眼睛里没有火，只有真真正正的困惑，像听不懂一句外乡话。「做什么。」她重复了一遍，自己点了点头，「对。数是我的事。」她把那碟碾过头的白药端到药匾里摊开——摊得极匀，一星也没浪费。「碾过头的，晒一晒，也能用。」她坐回药碾子前，背对着你，碾盘骨碌、骨碌。「从今日起，不数你了。不数，不是忘——」碾盘的声音停了半拍，「是把你的名字，从『数』那一栏，挪到别处去了。」你问挪到哪儿。她没答。第二日门里人说：药庐那张「普通日子」的清单上，有一行字被人擦掉了，擦掉，又描了回去。描的是哪一行，报信的人没敢细看——只说描完以后，那人对着清单在灯下坐了半宿，什么也没做。';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 7);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 拓银沙：金蝎的须，在你袖口打了结 ----
    'xie_event_probe': {
        id: 'xie_event_probe', npcId: 'sect_leader_飞蝎坞', title: '两种味', icon: '🦂',
        desc: '金蝎爬到你腕上忽然停了须——它闻见你身上有别人的味。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'xie_e_probe_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '飞蝎坞，蝎房后的对练场。竹钳声、沙簌簌。你进门时她正在分窝，金蝎从她肩头窜下来，顺着沙地直奔你的手腕——照旧。可今日它爬到一半停住了，须竖得高高的，在空气里左一下、右一下，像被什么绊住了。', type: 'description' },
            { speaker: 'npc', text: '「嗯？」她把竹钳往窝里一插，两步抢过来，抓起你的手腕凑近看，眼睛眯起来，「须打结了。三年，这东西想爬谁爬谁——没在谁身上打过结。」她把鼻子凑到你袖口闻了一下，闻完脸色变了，啪地把你的手腕搁下。「两种味。」' },
            { speaker: 'npc', text: '她转身一脚把凳子踹翻，踹得特别响——嘴上却压得平平的：「生意归生意。你去哪儿、沾谁的味，坞里不管。」她抄起竹钳接着分窝，分了两个，啪地一撂，回头瞪你，嗓门大起来，话却咬着牙，「可蝎管！蝎的须不撒谎——你直说，这味，是在哪儿绊住的？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「直说：心里有个人。味，是Ta的。」', effect: 'tell' },
                { text: '「路上绊的——客栈的香，杂味而已。」', effect: 'reassure' },
                { text: '「一只蝎子，也管得我沾谁的味？」', effect: 'deflect' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            var dao = rival && rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'tell':
                    aff = dao ? -8 : -5;
                    msg = '她捏竹钳的手停住了。她盯着你看了足有两息，忽然蹲下去，把脸埋进蝎窝边上闷了一会儿——站起来时耳根通红，嗓门硬拔回平时的亮度：「行！你直说——比满坞的人都直！」她把竹钳往掌心里啪地一拍，绕着对练场走了两圈，忽然站定：「' + (rival ? rival.name : '那人') + '那儿，对吧。」不是问，是认——大漠里的人，金蝎的须绊在什么味上，她猜得出。「这条我记下了。我不拦你——拓银沙拦的是蝎，不是人。」她把金蝎从你腕上摘下来，放回肩头，声音压低了半调，「可你记着一条：日子分两处，哪一处都别塌。塌一处——」她下巴一抬，大漠的风把辫梢的红线吹起来，「我亲自去看。看了不是拦。看了是认——认我拓银沙认下的人，值不值。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
                case 'reassure':
                    aff = dao ? -3 : 4;
                    msg = dao
                        ? '「杂味。」她把这两个字嚼了一遍，笑了一声，笑得特别短，把竹钳归回窝架。「好话。」她拍拍金蝎的壳，「蝎不认话——认味。下回须再打结，你把手腕伸到我面前来。」她转身接着分窝，声音甩过来，「须要是再打结——我册子上就得添一页。添谁的页，你心里比我清楚。」'
                        : '她捏着竹钳的手顿了半拍，眯起眼把你从头到脚打量了一遍，打量了足有三息——忽然把竹钳一撂，抓起你的手腕翻来覆去又验了一遍，验得特别仔细。验完她松开手，别过脸去骂了句糙话，耳根红到脖子：「他娘的。杂味就杂味，你早说清楚——」她一脚把踹翻的凳子勾回原位，坐下，拍拍身边的空处，「坐。今晚的沙水我请。心里打结的人，多喝两碗——坞里的规矩。」';
                    break;
                case 'deflect':
                    aff = dao ? -12 : -8;
                    msg = '「蝎管？」她愣了一息，随即点点头，点得飞快，笑着把金蝎从你腕上摘下来——放归窝里，放得特别轻。「对。蝎不管。」她转身把蝎册啪地一合，合得架子上的沙都跳了跳，「蝎就是须灵——三年，头一回白灵。」她大步往坞外走，走到坞门口猛地回头，嗓门大得震得黄泥墙掉沙，「只一句直话！大漠里，须绊上了什么，蝎的法子是断了它——人的法子我不知道，可我册子上今日合上的这一页，再翻开的时候，你最好别叫我只剩一句糙话可说！」第二日坞里小子们说：幺女昨夜一个人在对练场掰腕子，掰到三更，赢了每一局，赢完骂自己。';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 7);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 伏璃茵：正午大仪串了词——私下里吐槽连珠炮 ----
    'lie_event_probe': {
        id: 'lie_event_probe', npcId: 'sect_leader_烈日教', title: '串了词', icon: '🕯️',
        desc: '正午大仪她串了半句诵文——散仪后，殿后小巷的吐槽朝你劈头盖脸。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'lie_e_probe_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '正午，圣火台。大仪如常，三百教众跪得鸦雀无声，她赤金法衣立在台侧，圣女冠端正，呼吸按着仪轨的拍子。诵文诵到第七段——她串了词。只半句，「焚尽尘与妄」诵成了「尘妄两难焚」。主诵长老没听出来，教众没听出来。只有你站在客位的柱子后头，看见她袖中的指尖抖了一下。', type: 'description' },
            { speaker: 'npc', text: '散仪，殿后小巷。她在等你——看见你，圣女腔先垮，语速唰地提上来：「听见了？你听见了对不对！别装，你那副『什么都没听见』的脸最气人——」她把你往墙影里拽了半步，声音压着，话却劈头盖脸，「八年！我诵了八年的文，一个字没串过！长老说我这张嘴是圣火开过光的——开什么光，是练出来的，一年三百六十五天不停，今日串在一个外客手里！」' },
            { speaker: 'npc', text: '她忽然收声，深吸一口气，冠一扶，切回圣女腔，特别慢：「……失仪。远客不必挂怀。」切完维持不了三息，语速又唰地回来：「你知道最气人的是什么吗。我知道我为什么串词。」她瞪着你，眼睛发亮，亮里掺着一点别的，「诵到第七段，你站在那根柱子后头——你的影子，和前日来递帖的那个人的影子，叠在一处了。我一晃神，词就串了。你现在直说：你这道影子，如今叠着几个人的？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「直说：叠着一个人。我不瞒你。」', effect: 'tell' },
                { text: '「一道影子。是你自己串的——串了词，重诵便是。」', effect: 'reassure' },
                { text: '「你串你的词，赖得着我的影子？」', effect: 'deflect' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            var dao = rival && rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'tell':
                    aff = dao ? -8 : -5;
                    msg = '她扶冠的手停住了。她静了两息——这是八年吐槽里最长的两息。然后她语速慢下来，慢到接近圣女腔又没进去：「……' + (rival ? rival.name : '那人') + '。」她把这个名字嚼了一遍，靠着墙，望了望殿与殿之间那一线天，忽然吐槽回来了，火力却只有半分：「行。你直说——比主诵长老的经直。」她低头摆弄冠上的赤金坠，声音又低了半调，「串了的词，我不重诵。经上写焚尽尘与妄——你这一条，我记在『难焚』那一栏里。难焚的……」她瞥你一眼，眼睛亮着，亮底下压着点什么，「难焚的，慢诵。慢诵，就是了。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
                case 'reassure':
                    aff = dao ? -3 : 4;
                    msg = dao
                        ? '「一道影子。」她重复了一遍，嘴角抽了一下，圣女腔先出来：「远客说是。」维持了三息，绷不住，语速唰地回来：「那我今日串的半句，白串了？八年的完美，毁在一句谎上——」她忽然收声，深吸一口气，把冠扶正，「行。经认话，圣火不认。下回大仪我再串词，就是影子还没散。」她转身入殿，赤金法衣的下摆扫过门槛，声音极轻地飘回来，「串词的时候，你最好就站在那根柱子底下。不在——我串的下一句，可就没这么客气了。」'
                        : '她摆弄冠坠的手停了，转脸朝墙影，静了两息——耳根先红了，吐槽还硬：「重诵？」她猛地转回来，语速快得像火，「你知道重诵半句串词要多大的脸面吗？经文册要报长老，长老要报高台——」她忽然收住，声音压低，眼角弯下去，弯得特别亮，「……不过，你说是就是。我信一回。信一回，就是下回大仪我诵得特别稳。诵稳了，你最好在柱子底下——圣女的经，值得诵稳的人，没几个。」';
                    break;
                case 'deflect':
                    aff = dao ? -12 : -8;
                    msg = '「赖影子。」她点点头，点得特别认真，忽然把冠一扶，切回圣女腔，一字一字慢：「失仪，是我自己修行不到，与客无干。此事，到此为止。」圣女腔说完，她转身往殿里走——走出两步，站住，没回头，声音陡然落到吐槽最低的那一档：「八年，我串词没赖过谁。头一回赖，被原样退回来了。好，很好。」她抬手把冠扶得更正，「从今日起，大仪的客位，我叫知客祭司挪一挪。挪到影子不叠的柱子那儿去。」她跨过门槛，侧脸端得极正，「这不是罚。这是仪轨。仪轨——」法衣的下摆落下来，把后半句盖住了。第二日知客祭司来知会你：圣女亲自动了客位的仪轨，动完，她在圣火龛前多巡了一回火，在风口站了很久——比仪轨规定的，久得多。';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 7);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 檀望舒：对着残铜镜练一个新调子——听见你的脚步，擦掉了 ----
    'long_event_probe': {
        id: 'long_event_probe', npcId: 'sect_leader_天龙教', title: '擦掉了', icon: '🪞',
        desc: '她在传声房对着残铜镜练一个新调子——你进门，她把它擦掉了。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'long_e_probe_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '天龙教传声房。你申时过去寻她，门里传出一个声音——陌生，可她练得极认真：一句话，反复三遍，第三遍连气口都严丝合缝。你推门，那声音戛然而止。她坐在案前，手里那面半面残铜镜，镜面朝下——她刚用袖子擦过，擦得特别干净，像从没照过。', type: 'description' },
            { speaker: 'npc', text: '（用黑袍知客的调子）「客至。」她平平地传了两个字，把腰间铜镜牌按了按，眼睛弯起来笑——笑没撑住，换了把沙哑老嗓：（用讲经长老的调子）「老朽讲经四十年，最怕的不是忘词——是串词。」传完自己吐了吐舌头，嗓子恢复平时的干脆，「长老没讲过后半句，后半句是我添的。传声房传声，不加字——今日破了例。」' },
            { speaker: 'npc', text: '她顿了顿，目光从那面扣在案上的铜镜上扫过去，忽然换了把软和嗓子：（用云婆婆的调子）「娃儿，方才那个调子——莫问。」三个字说完自己切回来，干脆里带一点强撑的亮：「云婆婆处理事情的法子，是莫问。我的法子不一样。」她把铜镜收进袖子，抬眼看你，笑意收了半分，「传声房的规矩，传声不问根。可你这一条——不问，我睡不着。方才那个调子，你多半也猜着是谁的了。你直说：它怎么就卡在我喉咙里了？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「直说：那人的调子，你听过一回就够了——心里有个人，我不瞒你。」', effect: 'tell' },
                { text: '「卡了就卡了，练顺它。你的百声，哪一口不是练顺的？」', effect: 'reassure' },
                { text: '「学舌的毛病，也值得问我？」', effect: 'deflect' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            var dao = rival && rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'tell':
                    aff = dao ? -8 : -5;
                    msg = '她收镜子的手停住了。她看了你两息，忽然把铜镜从袖子里又拿出来——搁在案上，这一回镜面朝上，半面镜子里的半张脸，笑得有点复杂。（用黑袍知客的调子）「客事，两处。」她把这四个字传得特别平，传完换了把沙哑老嗓：（用讲经长老的调子）「人心两间房，左右各一——老朽讲经，讲的是左间；右间，经管不着。」传完她低头，用袖子把镜面擦了一遍，擦得极轻。（用云婆婆的调子）「娃儿，那个调子，婆婆照旧练。」她抬眼，干脆里带着强撑的亮：「练，不是惦记——是传声房的规矩：卡在喉咙里的调子，练顺了，才放得下。」她把铜镜收好，忽然又传了一句，用你的调子，学得极像，连你的气口都在：（用你的调子）「我不瞒你。」传完自己先笑了，笑完声音低下去：「你听，你四个字，我一回就学像了。有些人的调子，我一回也学像了——不同的是，你的，我练到像；那个，我练到……不敢像。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
                case 'reassure':
                    aff = dao ? -3 : 4;
                    msg = dao
                        ? '（用黑袍知客的调子）「客说笑。」她把这三个字传得极标准，一丝温度都不差——传完把铜镜收进袖子，换了把软和嗓子：（用云婆婆的调子）「娃儿，哄人的话，婆婆听得多。听着暖手，不当真。」传完自己吐了吐舌头，干脆回来了：「婆婆的话，我借一借。我自己的——」她顿了顿，看了看袖子里那面镜子，忽然摆手，「算了。传声房的规矩：传不准的令，不传。你这一条，令先挂着——挂着不难，人来，就传得着。」'
                        : '她眼睛亮了一息，把铜镜又掏出来——这一回镜面对着自己，对着镜子把你的笑练了一遍，练完擦掉，又练。（用你的调子）「卡了就卡了，练顺它。」她用你的腔调把这句话说完，连你的尾音都在，说完把镜子一收，耳根有点红，干脆得特别亮：「这一句，传声房收下了——收下的，不擦。」她拍拍腰间铜镜牌，忽然凑近半步，声音压低：（用云婆婆的调子）「娃儿，婆婆年轻时，也等过人这么说一句。等到了，攥了一辈子。」传完自己先笑：「婆婆攥了一辈子。我才开始攥——攥不攥得住，看你。」';
                    break;
                case 'deflect':
                    aff = dao ? -12 : -8;
                    msg = '她脸上的笑停住了。她静静看了你两息，开口是最标准的黑袍知客腔：（用黑袍知客的调子）「客事。传声房，不问根。」传完这一句，她转身把铜镜收进案屉最里层，抽屉推得特别实。（用护法长老的凶腔）「散了！练声！」她拿凶腔把自己轰出传声房，轰完靠在门框上，先笑了一下，笑没到眼底：「你看，我连骂自己，都得借别人的嗓子。」她把腰间铜镜牌摘下来，搁在案上，牌面朝下：「从今日起，卡在喉咙里的调子，不练了。不练，就是——喉咙干净。喉咙干净了，传令也干净。」她拎起油壶给灯添油，背对着你，灯影里传出来最后一句，用云婆婆的调子，学得特别软：（用云婆婆的调子）「娃儿，喉咙干净了，学谁的调子，都不疼了。」第二日云婆婆告诉你：那孩子昨夜对着镜子练了半宿调子——不是练像，是练忘。忘不忘得掉，镜子知道。';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 7);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 戚巧机：你的时辰漂了两刻——她重算了七遍，算不出 ----
    'sj_event_probe': {
        id: 'sj_event_probe', npcId: 'sect_leader_神机门', title: '误差', icon: '⚙️',
        desc: '她把你到门的时辰当误差重算了七遍——机关雀都替她滴答乱了拍。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'sj_e_probe_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '神机门工坊。铜屑味，满架齿轮。她伏在校准台前给一只机关雀上弦——你进门，雀翅滴答快了一拍。她没抬头，先报数：「本月，你到门的时辰漂了两刻。第一次漂一刻，第二次漂一刻半。」她这才抬头，眼下有两团淡淡的青，「机关漂了时辰，我校得回来。你漂了——我重算了七遍。」她把校准笔搁下，搁得很轻，「算不出。」', type: 'description' },
            { speaker: 'npc', text: '「两个齿轮咬在一处，其中一个把齿分给了别的轮子——剩下的齿比，全变了。」她翻开案上的工册，册页密密麻麻，全是算式，算到第七行，行尾三个字写得特别小：算不出。「这不是机关的误差。」她的指尖压在那三个字上，「这是游隙。齿与齿之间的空。空多大，我量得出——空里装着谁，我量不出。」' },
            { speaker: 'npc', text: '架上那只机关雀又滴答了一声，乱了拍。她抬眼看了看雀，没骂它，反而把雀拢进掌心按了按，按得特别轻，像按自己的心口。「雀的拍子跟着上弦的手走。」她低头看你，眼睛很亮，亮里有一点撑不住的直，「手乱了，雀就乱。你直说——你的时辰，如今咬着几副齿轮？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「两副。我不瞒你——漂掉的时辰，是在另一个人那儿。」', effect: 'tell' },
                { text: '「一副。漂的是路，不是人。」', effect: 'reassure' },
                { text: '「人到门的时辰，几时归你的算学了？」', effect: 'deflect' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            var dao = rival && rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'tell':
                    aff = dao ? -8 : -5;
                    msg = '她握校准笔的手停住了。她静了三息——这是她报数报了十年的人最长的一次静默。然后她翻开工册新的一页，提笔，把第七行那句「算不出」原样抄了过去，抄完在旁边补了一行小字：' + (rival ? rival.name : '那人') + '处。「误差入了册，就不是误差了。」她合上册子，耳根红着，语气还像在报数，「是参数。参数不怕大，怕没名没姓。」她从颈间摘下一枚黄铜小齿轮，齿数极细，塞进你手心，按实。「齿数二十七。你收着它——收着它，你漂到哪儿，我这儿的雀都算得出来你几时回。」架上机关雀滴答了一声，这一声，拍子是稳的。';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
                case 'reassure':
                    aff = dao ? -3 : 4;
                    msg = dao
                        ? '「漂的是路。」她重复了一遍，点点头，把工册上那行「算不出」用尺压平了，压得特别用力。「路有里程，里程我核得着。」她重新拿起校准笔，笔尖悬在纸上，悬了很久没有落下，「只是核里程的算学里，没有一项叫『等』。等没有公式。等——」她终于落笔，落下的不是算式，是三个字，写得特别小，「不好算。」'
                        : '她上弦的手停了半拍。半晌，她把机关雀从架上取下来，拧开雀腹的小舱——舱里一枚米粒大的铜轮，轮齿上刻着极细的痕。「雀记人话，也记人声的拍子。」她把雀凑到你唇边，耳根红着，语气硬撑着平，「说一句。随便什么。」你说了一句。雀翅滴答复述了一遍，连你的尾音都在。她把雀归架，背对着你，声音低了半格：「漂是漂不出这一拍的。往后你的时辰漂了——我放雀去找。找着了，它替你报；找不着……」她停了停，「找不着，我自己去。」';
                    break;
                case 'deflect':
                    aff = dao ? -12 : -8;
                    msg = '「归算学。」她点点头，点得很认真，把工册合上，归进案头最里层。「不归。」她更正了自己，更正得特别慢，「算学只管齿轮。齿轮不管人——这一条，我今日才学会。」她坐回校准台前，背对着你，手里的活换了：不再校那只跟你惯了的机关雀，改校一只从没上过户的新雀。第二日工坊里人说：昨夜戚师姐把旧雀拆了，拆到最里层那枚记声的铜轮，对着灯看了半宿，没有装回去。天快亮时她把铜轮包进绢里，收进了心口。收完她对新雀说了一句话，声音很轻，轻得新雀都没记下拍子：「算不出，就不算了。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 7);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 雷惊蛰：方子册的批注受潮了——「是日，硝受潮。人也受潮。」 ----
    'pi_event_probe': {
        id: 'pi_event_probe', npcId: 'sect_leader_霹雳堂', title: '受潮', icon: '🧨',
        desc: '他把心事抄进火药方子册——批注写着「是日，硝受潮。人也受潮。」',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'pi_e_probe_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '霹雳堂防火棚。他坐在灯下绑引信，手极轻——火药活，重不得。你随口说起昨日出趟门，说到一半，他捻引信的手停了半拍，停完，那根引信剪得比平日短了一截。他没有抬头，说了一句什么，声音极轻——你俯身，没听清。他又说了一遍，更轻：「……昨日，你和人同行了半程路。」说完自己补了一句，补得特别认真：「……我说了。我真的说了。」', type: 'description' },
            { speaker: 'npc', text: '他从案头取过火药方子册，推到你面前——页边批注极小，一行一行的蝇头字：「是日，硝受潮。」底下另起一行，字更小，小到要凑近灯才看得清：「人也受潮。」他指着那行小字，声音轻得像怕惊动纸上的墨：「册子只记事实。」顿了顿，「硝受潮，引信就慢。人受潮——」他的指尖在那五个字上停了停，「册上没有这一条的方子。我查了三夜。」' },
            { speaker: 'npc', text: '他合上册子，合得极轻，极轻里有一点重：「查不着，就自己拟。」他抬眼看你，眼睛很静，静底下压着东西，「拟了三条，全不成句。火药的性子我摸得着，人受潮的性子——摸不着。」他把册子往你那边又推了半寸，推完低下头去继续绑引信，声音落回最轻的那一档：「你答我。这潮，是从哪一处渗进来的？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「心里住了个人。潮，是从Ta那头渗的——我不瞒你。」', effect: 'tell' },
                { text: '「路上落了雨，淋的。方子册不记天气。」', effect: 'reassure' },
                { text: '「你的方子册，几时管到人潮不潮了？」', effect: 'deflect' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            var dao = rival && rival.isDaoCompanion;
            var pg = (typeof window !== 'undefined' && window.currentCharData && window.currentCharData.gender === 'female') ? '她' : '他';
            var aff = 0, msg = '';
            switch (choice) {
                case 'tell':
                    aff = dao ? -8 : -5;
                    msg = '他捻引信的手停住了。他静了很久，静得灯花都爆了一声——然后他翻开方子册，提笔，蘸墨，在那行「人也受潮」底下添了新批注，一笔一划，轻得像落灰：「' + (rival ? rival.name : '那人') + '处。潮源，明。」写完又另起一行，字更小：「' + pg + '肯报实。硝，可晒。」写完他把册子转过来给你看，看完又收回去，收得极慢。「批注记实，不记怨。」他说，声音还是极轻，「硝受潮，晒三日还能用。人受潮——」他顿了顿，从怀里取出一只防火布囊，囊口系得极紧，塞进你手里，按实。「囊里是引信头。最燥的。」他低下头去，耳根一点一点红了，「你收着。你燥，我这儿的日子才引得着。」停了停，他又补一句，比方才还轻：「……我说了。我真的说了。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
                case 'reassure':
                    aff = dao ? -3 : 4;
                    msg = dao
                        ? '「淋的。」他重复了一遍，点点头，把那根剪短了的引信拿起来，对着灯看，看了很久。「淋的，晒干就好。」他说，语气轻得听不出信没信。他把方子册翻回批注那页，提笔，在「人也受潮」旁边添了两个字：「待验。」写完合册，归案，动作一样一样都轻。「验的法子我想好了。」他重新拿起引信，这一根剪得比平日长，「往后' + pg + '说落了雨的日子，我都记。记满一页，对一对——雨是真下在路上，还是下在心上。」'
                        : '他捻引信的手停了半拍，没有抬头，耳根先红了。半晌，他把那根剪短了的引信搁下，另取了一根新的，重新量，重新剪——这一根剪得特别长。「短的引得快。」他说，声音轻到你要屏息，「快的不好。我等得起，用长的。」他把长引信盘好，收进防火布囊，布囊没有收进案屉，搁在了你手边。他在册上又添了一行批注，添完给你看：「是日，' + pg + '言路雨。信，七分。」「册子不记天气。」他终于抬眼看了你一下，又低下去，「记。方子册什么都记——记不清的那几行，不是墨淡，是写的时候，手抖。」他停了停，补了一句：「……我说了。今天说的比一整年都多。你出去的时候，把门带上。轻一点。」';
                    break;
                case 'deflect':
                    aff = dao ? -12 : -8;
                    msg = '「管到。」他重复了一遍，点点头，点得很慢。然后他做了一件你没见过的事：他把方子册上那页批注，整页裁了下来——裁得极齐，齐得像没裁过。裁下来的纸他没有烧，折成三折，压进了防火布囊最底层。「册子不管人了。」他说，声音还是轻的，轻得没有一丝火气，「从今日起，批注只记硝磺。」他把册子归架，归得极正，「硝不淋雨。硫不淋雨。册子干净。」你转身要走，背后极轻地飘来半句，轻得你几乎以为是灯花的声音：「……人淋雨。这一条，裁了。」第二日堂里人说：昨夜引信房熄灯极早，天没亮训练场上却响过一声闷雷似的东西——不是雷，是一挂没头没尾的爆竹，只响了一声就哑了。哑的那半挂，是他自己拆的引信头。拆引信头的人说了一句什么，没人听清——他说话，从来没人听清。';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 7);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 宓书言：给你身边那人立了条批注「讹」——又划掉改「存疑」，页角戳破了 ----
    'shu_event_probe': {
        id: 'shu_event_probe', npcId: 'sect_leader_天书阁', title: '讹', icon: '✒️',
        desc: '校讎房新添一条批注：「讹」，划掉改「存疑」——页角叫笔尖戳破了。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'shu_e_probe_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '天书阁校讎房。他在校书，剑横在案上——校讎剑客的剑，专裁错页。你等他搁笔，目光扫过案头那一卷：页边批注全在四字以内，「衍文，删」「倒简，乙」，一笔是一笔。翻到末页，你瞥见页角一条新的：批注「讹」一个字，墨划得很重；划掉的旁边改了两个字——「存疑」。页角叫笔尖戳破了，破口是新的。', type: 'description' },
            { speaker: 'npc', text: '他看见你的目光，不遮不掩，把那卷推过来：「这一页，不是书。」话短得像他的批注，「校的是你昨日同行半程的那个人。」他把剑往卷上一压，「『讹』，是初判。划掉，是复核。」顿了一顿，「存疑，不改——校讎规矩：拿不准的，存疑，不能妄改。可页角破了。」' },
            { speaker: 'npc', text: '「十年校书，手没有破过页。」他看着那个破口，眼神很稳，稳底下压着一点自己也没校平的东西，「破页的手，校不了书。也校不了——」他收声，收得干脆，像裁掉一个衍字，「你答：这一条，是讹，还是不讹。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「不讹。确有其人——存疑不得，我说与你听。」', effect: 'tell' },
                { text: '「讹。这条你校岔了——划了它。」', effect: 'reassure' },
                { text: '「我身边有什么人，也轮得着你立批注？」', effect: 'deflect' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            var dao = rival && rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'tell':
                    aff = dao ? -8 : -5;
                    msg = '他压卷的手停住了。他看了你很久，提笔，把那条「存疑」重新校了一遍——没有划掉，在旁边补了一行小注，小注破天荒超了四字：「' + (rival ? rival.name : '那人') + '处。实。」写完他盯着那个超出来的字看了半晌，没有再裁。「校讎改字，要有实证。」他合上卷，语气照旧短，「你肯说，就是实证。」他把那个戳破的页角用浆糊细细补上，补得看不出来，补完把卷推回你面前：「补页的手，今日抖了一回。抖的原因——」他顿住，换了四个字，「不校了。存。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
                case 'reassure':
                    aff = dao ? -3 : 4;
                    msg = dao
                        ? '「校岔了。」他重复了一遍，点点头，提笔，当真把那条批注划了——划得极平，平得像没有过。划完他没有搁笔，在页脚另起一条，四字：「疑在言外。」他把卷合上，「话可以划。日子划不掉——日子是底本。」他起身裁了一页新纸，压在你手边，「往后你的事，我不批。我只存目。存目的意思：条目在，内容——等你来校。」'
                        : '他压卷的手停了半拍。半晌，他把那条「存疑」看了又看，忽然提笔，在批注旁边极小地添了两个字：「愿讹。」添完自己先愣了一下，像校出了自己的错字，耳根红了，却没有划。「愿讹——盼着这条是错的。」他解释得极短，解释完把卷合上，塞回案头最里层，「这条不入正卷。入不入私卷——」他背过身去整理书页，声音低了半格，「私卷没有。今日，立了。」';
                    break;
                case 'deflect':
                    aff = dao ? -12 : -8;
                    msg = '「轮得着。」他点点头，点得很慢。然后他把那卷拿起来，翻到破页，看了一会儿——把那条「存疑」连同小注，整条裁了下来。裁得极齐。「校讎房只校书。」他把裁下的纸条压在镇纸底下，压得平平的，「书外的事，不校。这一条，是我僭越。」他重新执笔校旧卷，笔笔极稳，稳得比平日过分。你转身要走，他在你背后添了四个字，轻得像批注：「僭越，认罚。」第二日阁里人说：校讎先生昨夜把镇纸底下那张纸条又取出来看了一遍，看完没有烧，也没有贴回去——夹进了他自己那部从不外借的剑谱校记里。夹在哪一页，没人知道。只知道那一日之后，他校书的批注更短了，短到有三页，一个字都没批。';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 7);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 隗九爻：连起三卦全大凶——签头那颗风干山楂，他吃了 ----
    'dy_event_probe': {
        id: 'dy_event_probe', npcId: 'sect_leader_大隐阁', title: '吃了签头', icon: '🍡',
        desc: '他连起三卦全大凶，还把糖葫芦吃完了——签头那颗，他从不吃。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'dy_e_probe_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '大隐阁前台阶。他蹲在台阶上吃糖葫芦，竹签上的山楂数一颗是一卦——这是他起卦的法子，全阁都知道。你在旁边坐下，他头也不抬，一连起了三卦：第一卦，「剩四颗，诸事宜静」；第二卦，他数到一半停了；第三卦，他把剩下的山楂全吃了——连签头那颗风干的。那颗山楂干得发皱，他从不吃，说签头是卦的魂，魂要留着。', type: 'description' },
            { speaker: 'npc', text: '他举着光签子端详了半天，半仙腔都懒得端了：「剩一颗，大凶。一颗不剩——」他把光签子在指间转了个圈，「没有卦辞。二十年数签，没有出过没有卦辞的卦。」他忽然拿光签子指你，干饭人的语气混进来：「三卦全凶。凶得这么齐整，二十年头一回。你猜凶在哪儿？」' },
            { speaker: 'npc', text: '他站起来，拍拍衣摆上的糖渣，居高临下看你，眼睛却不像平日起卦那样半睁半闭：「卦辞『莫尽』——我娘教的，凡事莫尽，尽了，卦就死了。」他把光签子插回台阶缝里，插得端端正正，「今日我把签头吃了。等于卦都不用看了。」他弯腰凑近半步，声音压低，压低里有一点自己都没察觉的急：「你自己招：你的日子，分作几份了？分到几份，才算把我的『莫尽』分了个尽？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「两份。我不瞒你——凶卦，我自己认。」', effect: 'tell' },
                { text: '「一份。你起岔了——重数，这串我赔你。」', effect: 'reassure' },
                { text: '「你数你的山楂，凶吉几时轮得到我头上？」', effect: 'deflect' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            var dao = rival && rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'tell':
                    aff = dao ? -8 : -5;
                    msg = '他直起腰，看了你两息，忽然笑了，笑得台阶上的日光都松了半分：「好。认凶的人，比改卦的人有出息。」他从怀里摸出新一串糖葫芦——摸出来的时候顿了一下，分明是早备好的——插回台阶缝里那根光签子旁边。「三卦全凶，卦不用看了，人得看。」他重新蹲下去，数了一颗，「第一卦，改判：凶在不明。今日明了，凶去一半。」又数一颗，「第二卦：' + (rival ? rival.name : '那人') + '处的那一份——」他停了停，没有数下去，把那颗山楂摘下来搁在你手心，「这一颗你拿着。拿着，别吃。莫尽。」他抬头看你，半仙腔难得端正：「你那份日子尽不尽，我管不着。签头那颗我吃了，是我失守。往后你的卦——我一颗一颗数，数到最后一颗，永远留。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
                case 'reassure':
                    aff = dao ? -3 : 4;
                    msg = dao
                        ? '「赔我。」他点点头，接过你递的钱，掂了掂，真去山下买了三串回来——三串摆在台阶上，一串没动。「赔的串，起不了卦。」他说，「卦要用自己的糖。」他蹲在三串糖葫芦中间，像蹲在三卦中间，「你这一份，我先记着『待数』。待数的卦不凶，也不吉——」他拿起其中一串，数了一颗又放下，「就是悬着。悬着的滋味，你尝过么？我这二十年，天天替人悬。」'
                        : '他数签的手停了。半晌，他忽然把那根光签子从台阶缝里拔出来，翻来覆去看了三遍，又凑近闻了闻——签头那点糖霜被他舔得干干净净。「重数就重数。」他把光签子往你手里一塞，耳根有点红，半仙腔端得晃晃悠悠，「你数。你数的卦，我认。」你数了，他说一颗不剩。他盯着光签子看了半晌，忽然笑了：「一颗不剩——好卦。尽了的卦是死卦，可你手里这根是签头都甜的。」他把光签子收进袖子，收得极快，「这一根，入册。册上写什么我想好了：『是日，大凶改判。判词——』」他顿住，摆摆手，「判词超四个字了，不说了。说了要泄天机。」';
                    break;
                case 'deflect':
                    aff = dao ? -12 : -8;
                    msg = '「轮不到。」他点点头，点得特别痛快，忽然把台阶缝里那根光签子拔了出来，收进袖子——收得干干净净，像收一件从此不再用的东西。「大隐阁的卦，卦金随喜，凶吉不找上门。」他拍拍衣摆站起来，「今日这三卦，是我自己找的门。找错了。」他往阁里走，走了两级台阶，停下，没回头，干饭腔也没了：「二十年，我数签头那颗从来不吃——你当是规矩，其实是馋。馋那颗最酸的，酸得倒牙，倒完牙，日子才算过完整。」他跨进门去，声音从门里飘出来，飘得很轻：「今日吃了。原来酸的尽了，不是日子完整——是嘴里空了。」第二日阁里人说：隗先生昨夜没有数签，蹲在台阶上把一根光签子在手里转到三更。转完他对着台阶缝说了一句话，巡夜的听见了半句：「……莫尽。这一条，先违为敬。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 7);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 简知忆：给那人新立了一档——危险程度「高」，附页三页全销毁 ----
    'yin_event_probe': {
        id: 'yin_event_probe', npcId: 'sect_leader_侠隐阁', title: '新档', icon: '🗃️',
        desc: '他给那人新立了一档：危险程度「高」——附页写了三页，又全部销毁。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'yin_e_probe_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '侠隐阁档廊。他建的人档排满三间屋子，一人一卷，附页单钉。你今日寻他，他案头压着一卷新档，封皮空白，栏里「危险程度」三个字写得新鲜：「高」。他见你目光落上去，手先按住了卷宗——按得比翻书快。', type: 'description' },
            { speaker: 'npc', text: '「附页，写了。」他用批注腔说话，又快又平，「三页。销毁了。」他敲了敲卷皮，「档规：附页超三页，建档人失格。失格的附页不能留档——销毁。」他顿了顿，看你一眼，「但危险程度那一栏，留着。高。」' },
            { speaker: 'npc', text: '他把卷宗往灯下挪了挪，挪的动作慢下来：「想知道销毁那三页写了什么？档里不录。」他的指尖在卷皮上点了两下，「要旨我念给你听，念完入档：你的日子，近日两日不明。侠隐阁给你建了三年档，日日为继——独这两日，附页断档。断档就要立新档。新档的封皮，空白。」他抬眼，「你报：这一卷空白，给谁开名？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「给那人开。名字我自己报——我不瞒你。」', effect: 'tell' },
                { text: '「不必开。那两日我记岔了——在你这儿，档错了。」', effect: 'reassure' },
                { text: '「建档是你的差事——如今建到我头上来了？」', effect: 'deflect' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            var dao = rival && rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'tell':
                    aff = dao ? -8 : -5;
                    msg = '他按卷的手停住了。他静了两息，提笔，在那卷空白的封皮上落名——落的是你的名字，不是那人的。「档规补录。」他用批注腔念给你听，念得极平，平里有一点不平，「『危险程度：高』一栏，对象更正。高险不在' + (rival ? rival.name : '那人') + '——在附页断档这件事本身。」他把封皮吹干，合卷，归进离他手最近的一格。「销毁的三页附页，按规重建。」他取了三张新附页纸，钉好，推到你面前，「头一页的正文我念，你录：『是日，你肯报名。险，降为存疑。』」念完他自己先停了停，补了一句不在档规里的话，很轻：「存疑不究——这四个字，头一回写着发虚。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
                case 'reassure':
                    aff = dao ? -3 : 4;
                    msg = dao
                        ? '「档错了。」他重复了一遍，点点头，把新档的危险程度一栏原样圈了——圈而不销。「档不认错，档只存疑。」他翻开附页，写了一行：「言档错。存疑，不究。」写完合卷，「存疑不究是档廊的宽条。宽条用在你名下——三间档廊，头一卷。」他把卷归架，归得极正，「只是宽条也有期限。期限到了，重勘。重勘要本人在档廊——你记着这一条就行。」'
                        : '他按卷的手停了半拍。半晌，他把封皮翻过来——背面另有一行小字，墨迹比正面新：「危险程度：想一直说话。」他看见你看见了，耳根红了一层，批注腔没有垮，垮的是语速：「背面这行，不入档。入档要核，核不过。」他把卷宗塞回案头最里层，动作快得像销毁附页，「正面那卷是给档廊的。背面那行——」他背过身去理旧档，声音混在纸页声里，「是给我自己的。我自己那页档，空白三年。今日想往上录一行，录到一半，停了。」你问录的什么。他没答，理档的手停在一卷上，停了很久。';
                    break;
                case 'deflect':
                    aff = dao ? -12 : -8;
                    msg = '「建到。」他点点头，把那卷新档合上，合得极轻——轻得像怕惊动档里的什么。「档廊建档，凭的是日子不明。日子明了，档自动结。」他把卷归架，归到最顶层，「你嫌档建到头上。好。从今日起，你名下：不建档，不附页，不核。」他坐回案后，批注腔平得没有一丝波澜，「不核，就是档廊三间屋子，独你那一格——空白。空白不占地方。」你转身要走，他在背后添了最后一条批注，轻得像自言自语：「另：建档人自己那页，也空白。两页空白，隔着三间屋子对望。此条，存疑不究。」第二日档廊的书记说：简先生昨夜把自己那卷空白档取下来了，对着灯坐了一宿，一个字没录。天亮他把档归回原格，归格前在封皮上写了四个字，又用指腹抹了——墨没干，抹成一片淡痕。淡痕认得出头一个字：「等」。';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 7);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 狄长亭：替你写路引，把里程多算了三站 ----
    'ty_event_probe': {
        id: 'ty_event_probe', npcId: 'sect_leader_天涯海阁', title: '多算三站', icon: '📮',
        desc: '他替你写路引，把里程多算了三站——多出来的三站，是他舍不得的三天。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'ty_e_probe_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '天涯海阁驿亭案前。他在替你写路引——公文笔，一笔不苟，写完双手奉上，姿态像送你出千里：「前路不利，慢行。」你展开路引核站名，核了一遍，又核一遍：从此处到你要去的地方，路引上多了三站。多三站，路上就多三日。', type: 'description' },
            { speaker: 'npc', text: '他见你数站名，指尖在袖中轻轻一收，公文腔一丝不乱：「引是我写的。站名，是我核的。」他顿了顿，躬身半度，像念驿册上的成例，「多三站——册上的说法：绕道修路，不通。」他直起身，眼睛抬起来看你一眼，又落下去，「可路是通的。我昨夜走过。走了三遍。」' },
            { speaker: 'npc', text: '「绕道三站，册上无据。无据的站名，驿亭不该写。」他的声音末了一句低下去，低得像公文末行的小注，「写了，就是写引的人，私心多算了三日。」他从案头取过一枚铜符——半枚，断口磨得温润——压在路引旁边，没有推给你，也没有收回。「你既数出来了，我便不瞒：这三日，我想……」他收声，换成公文腔，字字端正，端正得发抖，「建议滞留数日。此为公文，不涉私情。批在哪一栏——你定。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「不绕。多出来的三日，我心里有谁——我说清楚。」', effect: 'tell' },
                { text: '「引我收着。三站我照走——每一站的驿册，我报到你这儿。」', effect: 'reassure' },
                { text: '「驿站写引把站名都数错——天涯海阁的公事，这么不当心？」', effect: 'deflect' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            var dao = rival && rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'tell':
                    aff = dao ? -8 : -5;
                    msg = '他奉引的手停住了。他听完，久久没有说话，然后低头在路引的备注栏里落笔——公文笔，一笔不苟，写的却不是公文：「' + (rival ? rival.name : '那人') + '处。三站，销。」销完他把笔搁正，双手把路引重新奉上，姿态还是送客的姿态，话却破了公文腔半句：「驿站核里程，核得清山高水远。」他抬眼看你，眼底的东西压得很深，「核不清的是——写引的人，为什么把三日算得那么顺手。」他把那半枚铜符往你那边推了半寸，又停住，收回去，收得很慢：「符不给你。给了，就是留客。留客不合驿规——」他顿了顿，声音低到最低，「可我今日，想违一回驿规。你答：这三站，销得，还是销不得。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
                case 'reassure':
                    aff = dao ? -3 : 4;
                    msg = dao
                        ? '「报到。」他重复了一遍，点头，把路引折好，用镇纸压平——压得极正。「驿册认报到，不认人心。」他翻开案头的驿册，在你名下添了一行小注：「言三站照走。存照。」添完他看那行字看了很久，忽然说了一句不在册例里的话，很轻：「三站走完，你到了地方。地方是' + (rival ? rival.name : '那人') + '的。驿册上写得出每一站的里程——写不出我为什么把里程算多了。」他合上册子，公文腔归位，「此条不入册。入册要核——核不过。」'
                        : '他执笔的手停了半拍。半晌，他把那半枚铜符从案头拿起来，翻过来——符背刻着一行极小的字，刻痕新：「候。」他把符放回原处，放得端端正正，耳根却红了：「每一站都报到——好。」他的公文腔努力端着，端得有点晃，「驿亭的回批，我每一站都写。回批的格式，册上没有定例，我自拟一个：第一站批『安』，第二站批『安』，第三站——」他顿住，拿起笔在你路引的末站栏里先写好了那一批，写完把引推过来给你看。末站批的是两个字：「归来。」他垂下眼，声音低下去，「公文的字，私人的心。混在一栏里，不合体例。不合体例的批语——」他停了停，「我留着。你收着。」';
                    break;
                case 'deflect':
                    aff = dao ? -12 : -8;
                    msg = '「当心。」他重复了一遍，点点头，忽然笑了——那种极轻的、把什么都收进去的笑。「是。不当心。」他把路引从你手里接回去，坐回案后，把那张多算三站的引纸对折，再对折，压进案屉最底层。「天涯海阁核里程，十年无错。」他取出新纸，重写路引，这一张站名分毫不差，笔笔是标准的公文体，「错的这一张，作废。作废的引，按例焚——」他握着那张折好的引纸，握了很久，终究没有焚，压进了案屉。「从今日起，你名下的引，站名照册。」他双手奉上新引，姿态无懈可击，「多出来的，一站也没有。」你接引要走，他忽然在背后躬身半度，公文腔送客，声音却像纸被压出折痕：「客行千里，驿亭无权过问。只是——」他直起身，把那半枚铜符从案头收进袖中，收得极慢，「断了的符，本来是要给一个人续的。今日先收着。收着，不算错站。」第二日老驿丞说：长亭昨夜把驿册翻到天亮，翻的不是你的站名，是旧年废引存档那一格——格里新压了一张折了四折的路引。压引的人在册尾添了一行小注：「是日，引误三站。误者，甘领。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 7);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 樊惊筹：护腕加了一排加固针——37 针，一针一字 ----
    'dq_event_probe': {
        id: 'dq_event_probe', npcId: 'sect_leader_大旗门', title: '加固针', icon: '🪡',
        desc: '话更短了，针脚更密了——他给你的护腕加了一排拆不出来的加固针。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'dq_e_probe_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '大旗门校场帐。他在补旗——旗布厚，他的针更厚，可暗针走得比营里谁都细。你把旧护腕解下来谢他上回的加固，他接过去，就着灯翻了个面，眉头一皱，只说两个字：「松了。」当夜他没多话，坐在灯下给护腕加针。次日还你，你接在手里一掂——沉了：护腕内侧多了一排加固针，针码极密，密得能挡风。', type: 'description' },
            { speaker: 'npc', text: '「加固了。」他回身去理旗，话短得像砸帐篷钉，「掉不了。」你翻过来数那排针——一针一针数过去，恰好三十七针。营里传他的暗针一针一字，三十七针，是一句话。你问他什么话。他不答，把铁皮针线盒往案上一搁，盒盖开着，里头的针码排得整整齐齐。' },
            { speaker: 'npc', text: '「针码记事。」他终于开口，眼睛盯着你，像盯一个掉队的兵，「护腕戴松了。松，是在别人腕上松的。」他伸手把护腕从你手里拿回去，指腹在那排加固针上压了一遍，压得极重，「三十七针，你不用猜。报——这护腕，近来戴过几只腕？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「两只。我报——我不瞒你。」', effect: 'tell' },
                { text: '「一只。腕子瘦了——松的是腕，不是心。」', effect: 'reassure' },
                { text: '「你的针线活，几时管到我戴过谁的腕？」', effect: 'deflect' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            var dao = rival && rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'tell':
                    aff = dao ? -8 : -5;
                    msg = '他捏护腕的手停住了。他盯着你看了两息，忽然把护腕翻回正面，从针线盒里取针穿线——线的颜色，和护腕一模一样。「报了，就好办。」军中短句，一句一顿。他当着你的面，在三十七针后头续针，续了四针，续完咬线，把护腕按回你手里。「三十七针那句，营里没人猜得着。」他的耳根有点红，话更短了，「如今三十八，三十九，四十，四十一——四十一针，一句话。」你数给他听，问他哪一句。他把针线盒合上，合得咔的一声：「跟上。」顿了顿，「别掉队。」再顿了顿，声音低下去，低得完全不像他，「掉队了——我去捡。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
                case 'reassure':
                    aff = dao ? -3 : 4;
                    msg = dao
                        ? '「瘦了。」他重复了一遍，点点头，把护腕收回去，重新量你的腕——量得极认真，用打仗量地形的手法。量完他在灯下改针，把那排加固针拆了三针，重新走，走出一个收口的活扣。「死的加固，防不住活的腕子。」他把护腕还你，「活扣。松紧随腕。」他坐回去理旗，背对着你，补了一句，短得几乎听不见：「扣是我打的。解开——得回来找我。」'
                        : '他量腕的手停了半拍。半晌，他把护腕攥在手里，攥了很久，忽然从铁皮针线盒最底层取出一根新针——比常用针细一半，针尾缠了一圈红线。「细针走暗活。」他把护腕内侧翻出来，就着灯，用细针在原针脚旁边补了一道极细的线，补完把线头藏进布里，藏得无影无踪。「这一道，看不出来。」他耳根红着，话照旧短，「看不出来的针脚，是给自己走的。」他把护腕塞回你手里，按实，「松的是腕——好。腕我给你收。收完这一句，报给你听：三十七针那句话，往后只走暗的。暗的，不用你猜。戴着，就知道。」';
                    break;
                case 'deflect':
                    aff = dao ? -12 : -8;
                    msg = '「管到。」他重复了一遍，点点头。然后他做了一件全营没人见过的事：把那排加固针，一针一针拆了。拆得极稳，布上连个针眼都没撑大。拆完三十七针，他把线头理齐，护腕叠好，还你——轻飘飘的，跟没加固过一样。「针线活不管人。」他把铁皮针线盒合上，归进案角，「管旗。」他拿起旗继续补，锤帐篷钉的声音一声一声，比平日重。你转身要走，他在背后砸下最后一钉，声音混在锤声里，短得不能再短：「拆了。」顿了顿，「拆得出来——才后悔拆。」第二日营里人说：都尉昨夜把一面旧旗拆了重缝，缝到三更。缝的还是那四个字，一针一字，针针都密。缝完他坐在灯下把铁皮针线盒打开又合上，合上又打开，开合了三十七回。数着的亲兵说：数到三十七，都尉停了手，对着针线盒说了一个字——「松」。盒里没有松的东西。松的是别处。';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 7);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 裘霜莺：哨语乱套——对着苇滩吹了半宿「过来」 ----
    'tz_event_probe': {
        id: 'tz_event_probe', npcId: 'sect_leader_铁掌帮', title: '乱哨', icon: '🪈',
        desc: '她对着没人的苇滩吹了半宿「过来」——素坯哨在掌心攥出了汗。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'tz_e_probe_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '铁掌帮后山苇滩。天没亮你打滩边过，听见鸟哨响——一长一短，又三短促，又两声低回，吹得乱。哨语你识得：一长一短是「你来了」，三短促是「过来」，两声低回是「没事，就是想吹一下」。可今夜的次序全乱了——「过来」连着吹了三十几遍，滩里明明没有人可过来。天蒙蒙亮，她坐在滩头，手里攥着一支素坯泥哨，哨口叫牙咬得发白。', type: 'description' },
            { speaker: 'npc', text: '她看见你，凶脸先上：「站住！」哨子往掌心一拍，站起来，朝你走了两步，又停住，「……谁叫你来的。」她低头看自己手里的哨，看了半晌，认输似的把哨举起来给你看——素坯的，没上釉，坯身一道汗印子。「哨语乱套了。」她的声音压着，凶压不住底下的哑，「对着滩吹了半宿『过来』。滩里没有你。」' },
            { speaker: 'npc', text: '「这哨是素坯，没烧透——音闷，最像人声。」她攥着哨，攥得指节发白，「我想烧一支像人声的哨。烧了七支，全裂。」她忽然瞪你，眼睛里的凶亮亮的，亮底下有一层水光，死撑着不落，「你倒是说说——我这一滩的哨，乱给谁听的？你心里的滩上，如今还藏着几个人？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「藏着一个。我不瞒你——哨语，我替你理回来。」', effect: 'tell' },
                { text: '「没人。哨吹岔了而已——重吹一长一短，我这不就站在这儿。」', effect: 'reassure' },
                { text: '「你吹你的哨，岔没岔，关我什么事？」', effect: 'deflect' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            var dao = rival && rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'tell':
                    aff = dao ? -8 : -5;
                    msg = '她攥哨的手停住了。她盯着你看了三息，忽然转身一脚踢飞滩头一块石子，石子打水漂跳了四五下——她踢完就蹲下去了，蹲在苇子边上，肩膀一耸一耸，半天，站起来时眼眶通红，凶脸硬撑回来：「行！你直说——比帮里那群打哑谜的汉子强！」她把素坯哨在衣襟上蹭了蹭汗印子，蹭完又攥住，「' + (rival ? rival.name : '那人') + '——是吧。」不是问，是认。她深吸一口气，声音压回哨语那样低：「我不拦人。铁掌帮拦的是欺人的，不拦走心的。」她抬起哨，对着滩吹了一声——两声低回，吹得极稳，「没事，就是想吹一下。这一条，从今夜起改章程：想吹一下的时候——」她瞪你，耳朵红透，「你就得来。不来，我就一直吹。吹到你来为止。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
                case 'reassure':
                    aff = dao ? -3 : 4;
                    msg = dao
                        ? '「岔了。」她重复了一遍，冷笑一声，笑得特别短。「哨不岔。哨认人。」她把素坯哨收回怀里，收得极快，「人岔了，哨才跟着岔。」她转身往滩里走，走了两步停下，背对着你，凶腔里裹着一点别的东西，「' + (rival ? rival.name : '那人') + '那头的哨音什么样，我不知道。我只知道一条——你耳朵里要是装得下两种哨，我这半宿的『过来』，就是白吹。」她抬手抹了把脸，「白吹的哨，铁掌帮没有过。你是头一个。记住了，头一个。」'
                        : '她举哨的手停在半空。半晌，她当真把哨凑到唇边，重新吹了一声——一长一短，「你来了」。吹完她盯着你看，看得极凶，凶到耳根，「听见没有。这一条没乱。」她把哨往你手里一塞，塞得又急又重，「素坯的，没烧透，摔不得。你收着——收着它，往后你人到滩边，不用我吹，哨自己知道。」她转过身去踢滩上的石子，一颗一颗踢进水里，声音混在水声里，低得几乎不像她：「半宿的『过来』，原来是吹给明早的你听的。提前了。提前吹的哨——」她顿了顿，「不算丢人吧。」';
                    break;
                case 'deflect':
                    aff = dao ? -12 : -8;
                    msg = '「关你什么事。」她重复了一遍，点点头，点得特别慢。然后她把那支素坯哨举起来，看了很久——忽然扬手，作势要往滩石上砸。砸到一半，手停了。她把哨收回来，收进怀里，收得极紧，像收一件差点没了的东西。「对。」她的凶脸平了，平了比凶吓人，「哨是我的。乱也是我的乱。」她弯腰把滩头的哨架一支一支收起来——那是她平日练哨插的一排苇管——收得干干净净，「从今夜起，苇滩不吹了。哨语册子上，你那一页，我自己撕。」她抱着哨架往帮里走，走出十几步，忽然回头，凶腔拔得极高，高得破了一线：「只一样！撕下来的那页我没烧——铁掌帮的东西，撕了也留着！你哪天想听『过来』了，滩上没有，册子上有！」第二日帮里人说：堂主昨夜把七支烧裂的哨从匣子里全倒出来，对着灯一支一支重新上过一遍釉。上完釉她吹了一支试音——吹的是两声低回。没事，就是想吹一下。吹完她把那支哨单独收进匣底，匣底垫了软布。软布是新裁的，裁得方方正正，像给什么人备的。';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 7);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 姬云锦：晨课「问松」跳岔了半式——剑意发堵，像雪压了松枝 ----
    'kl_event_probe': {
        id: 'kl_event_probe', npcId: 'sect_leader_昆仑派', title: '岔半式', icon: '🌲',
        desc: '「问松」跳岔了半式，剑意发堵——素绸舞袖带绑得比平日紧。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'kl_e_probe_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '昆仑派晨课场，雪未消。她舞「问松」——这一套她舞了十年，剑意像雪压松枝，压而不折，稳。你立在雪坎边看。舞到中途，她岔了半式：剑尖沉了一寸，沉下去没有接住，松枝上的雪塌了一片。她收剑，立在原地，腕上那条素绸舞袖带绑得比平日紧，紧得指尖发白。', type: 'description' },
            { speaker: 'npc', text: '「你来了。」她先说三个字，像报数。剑归背后，她盯着地上那半式的雪痕，盯了很久：「问松，岔了半式。十年，没有岔过。」她的语气很平，平得像在背舞的名目，「迎雪不岔，问松不岔，送鸿不岔——剑客的腕不说谎。腕岔了，是心岔了。」' },
            { speaker: 'npc', text: '她抬手，把素绸袖带按了按，按得更紧了些。「古礼：不舞于生人。」她看着你，雪光映在脸上，「我为你破这一礼。破礼那日我以为想清楚了——今日才知道，破礼的人，腕先知道疼。」她的剑意发堵，堵在喉间那半句上，半晌，她把那半句放出来，放得很直：「雪坎边站过人。剑比我先知道。你报：我这套剑，如今替几个人分着心？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「替一个人。我不瞒你——岔的半式，我认。」', effect: 'tell' },
                { text: '「没有人。雪晃了眼——重舞，我替你看着松。」', effect: 'reassure' },
                { text: '「你晨课岔你的式，赖得着雪坎边站人？」', effect: 'deflect' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            var dao = rival && rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'tell':
                    aff = dao ? -8 : -5;
                    msg = '她按袖带的手停住了。她静了三息——晨课场上，她的静从来只有起势那一瞬。然后她重新拔剑，就着塌了雪的松枝，把岔掉的半式重舞了一遍——这一遍，剑尖沉稳，接住了。「岔的式，补上了。」她收剑，气息微乱，耳根在雪光里红得很清楚，「' + (rival ? rival.name : '那人') + '——剑认了这个名字。认，不是拦。」她解下腕上素绸袖带，走过来，绑在你的腕上，绑得极紧，和她自己绑的一样紧，「昆仑的舞袖带，绑给谁，剑就替谁看着路。你两处日子——」她退开一步，剑归背，语气回到名目一样平，「哪一处落雪，袖带会先冷。冷了，回来。我把半式，再舞给你看一遍。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
                case 'reassure':
                    aff = dao ? -3 : 4;
                    msg = dao
                        ? '「晃了眼。」她重复了一遍，点点头，没有再舞。她把剑背好，弯腰把塌落的雪一片一片拢回松枝上——拢雪的手极稳，稳得像起势。「剑不晃眼。」她拢完雪，直起身，「剑只认腕。腕认心。」她看着你，眼神平得没有一丝雪光，「你说没有人——好。存疑。」她顿了顿，把这两个字咬得很轻，轻得像不忍用在你身上，「昆仑校剑，存疑的式子不删，留着。留到腕不岔的那一日，当面对校。」她转身往场里走，走了两步，声音落回来，平里裂了一线，「对校那日，你最好在场。不在——我就自己跟雪对。」'
                        : '她按袖带的手停了半拍。半晌，她当真重新起势——迎雪的头一式，剑意铺开，雪光跟着剑走。舞到收势，剑尖挑起一蓬雪，雪落下来，落了你满肩。她收剑立在雪里，耳根红着，语气还端着平：「看着松了？」你点头。她把腕上素绸袖带解松了一扣，只松了一扣，「袖带绑紧，腕才稳。今日松一扣——」她别过脸去看松枝，「松一扣，是给站雪坎里的人松的。这一条，舞谱上没有。舞谱上没有的，」她顿了顿，声音低下去，「我自己记。」';
                    break;
                case 'deflect':
                    aff = dao ? -12 : -8;
                    msg = '「赖得着。」她重复了一遍，点点头。然后她做了一件十年没做过的事：晨课未散，她先收了剑——收得极静，静得没有一点雪声。「剑岔式，是剑客自己的事。」她把素绸袖带从腕上解下来，一折，两折，收进怀里，「与你无干。这一条，你说得对。」她立在雪里，身姿还是起势的身姿，话却一句比一句短：「古礼，不舞于生人。我破礼破了一年。今日你替我把礼正回来了——正得好。」她转身往场心走，走了三步，停下，没有回头：「从明日起，晨课十二套，套套有人看。看的人多了，腕就稳了。」她的声音平得像结了冰的湖，「腕稳了，剑意就不堵了。堵着的那半式——」长久的停顿，雪落在她的肩上，她没有拂，「我自己咽。咽得下去。剑客咽雪，是本分。」第二日晨课的弟子说：先生今日舞了十二套，套套精准，一套没有岔。只是问松那一套，舞到中途，先生朝雪坎边望了一眼——雪坎边没有人。望完那一眼，剑意沉到底，再没有浮上来过。';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 7);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 翀玉衡：那笔时辰记成「外账·应收」——算盘拨到一半停了珠 ----
    'qz_event_probe': {
        id: 'qz_event_probe', npcId: 'sect_leader_全真教', title: '停珠', icon: '🧮',
        desc: '她把那人陪你的时辰记成「外账·应收」——算盘拨到一半，停了珠。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'qz_e_probe_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '全真教功业房。她记功业日记，一日一结，小银算盘拨得脆响。你进门，她没有抬头，先拨算盘：啪，停了。啪，又停了。那颗珠子推到一半搁着——她盯着那颗珠，眉头拧得比对着经卷还紧。日记摊在案上，摊开的那页记着你的名字，名字旁边新起了一栏，栏名五个字：「外账·应收」。', type: 'description' },
            { speaker: 'npc', text: '「这一笔，入不了账。」她把日记转过来推给你看，指尖点在「外账·应收」上，账房腔又平又快，「你昨日与人同行的时辰，我记了外账。外账者，账外之账——记得了数目，讨不得利息。」她拨了一下那颗停住的珠，推回去，又推回来，推了两回，停了手。' },
            { speaker: 'npc', text: '「功业账记你三年。」她终于抬头，账房腔里混进一点压不住的东西，又立刻压回去，「笔笔有着落，笔笔讨得回来。独这一栏——记下了，不知道讨谁。」她把小银算盘往日记上一压，压得极正，「你今日给我报个数：你心里这本账，如今开着几页？哪一页打算全押？哪一页——」她顿了顿，指尖在算珠上极轻地一碰，「存疑？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「两页。我不瞒你——外账，我当面认。」', effect: 'tell' },
                { text: '「一页。全押——你那颗停住的珠，我替你推到位。」', effect: 'reassure' },
                { text: '「人心几页账，几时轮得着你的算盘拨？」', effect: 'deflect' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            var dao = rival && rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'tell':
                    aff = dao ? -8 : -5;
                    msg = '她压算盘的手停住了。她看了你三息，忽然把日记翻过一页，提笔，在新页起了一栏——栏名三个字：「当面账」。「外账销了。」她账房腔平着，笔却写得比平日重，「销入当面账。债务人：' + (rival ? rival.name : '那人') + '处时辰。债权人——」她的笔尖悬了一悬，落下去，「记我名下。」写完她把日记合上，小银算盘拿起来，当你的面，把那颗停了半日的珠推到位——啪，一声脆响。「记，就是认了。」她耳根红着，账房腔没有垮，「全真教的账，认了就得付息。利息的算法——」她拨了两颗珠，又停住，「算法超出一页了。改日面结。改日，」她抬眼看你，看得很直，「不许赖。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
                case 'reassure':
                    aff = dao ? -3 : 4;
                    msg = dao
                        ? '「全押。」她重复了一遍，账房腔纹丝不动，指尖却把那颗珠又推回去半格。「押要有凭。」她翻开日记，在「外账·应收」底下添了一行小字：「言全押。存疑。」写完她合上册子，语气平得像结账，「存疑，不究——不是宽你，是账房的规矩：口头的押，不入正册。入册要日子，要数目，要两讫的凭据。」她把算盘收回袖中，顿了顿，声音低了半格，「你拿日子来。日子一到，我立刻销疑。销疑那一笔——」她停了停，「我等着记。等了三年了，不差这几日。」'
                        : '她伸过来的手停在半空——你已经替她把那颗珠推到位了，啪的一声，脆得功业房的灯都晃了一下。她盯着那颗珠看了很久，耳根慢慢红了，账房腔端不住了半句：「……推珠的手，账房里只认两只。一只我的。」她把日记合上，又打开，把「外账·应收」那一栏整栏圈了，圈完在旁边批了两个字：「两讫。」批完她自己先愣了愣，「讫得这么快，不合规矩。」她没有划掉，「不合规矩的这一笔，三年就这一条。我给它单立一页——页名我想好了。」她抬眼看你，眼睛亮亮的，亮里全是算盘珠子，「叫『只进不出』。你那栏，从今日起，只进不出。」';
                    break;
                case 'deflect':
                    aff = dao ? -12 : -8;
                    msg = '「轮得着。」她点点头，忽然把小银算盘从日记上拿起来，收回袖子——收得干脆，像收一件从此不再用的东西。「账房拨的是功业，不是人心。」她账房腔平得没有一丝波澜，「这一条，我今日入册：是日，越界。越界者，自销其栏。」她当真提笔，把「外账·应收」那一栏从栏名到数目，一笔一笔销了——销得干干净净，销完在栏尾落了两个字：「两讫。」你把这两个字看了三遍，越看越不对：讫了的账，两清；可她落笔的手，稳得过分。「账讫了。」她合上日记，归架，归得极正，「讫了的账不欠人，人也不欠它。」她吹熄了半盏灯。你转身要走，黑暗里她的声音飘过来，账房腔还在，腔里那点东西压不住了，「另记一条，不入册：讫了的账房，夜里对算盘。对算盘不为结账——」极轻的一声珠响，只一声，没有第二声，「为听个响。」第二日功业房的书记说：昨夜翀姑娘把三年日记从头核了一遍，核到天亮，笔笔无误。独独最后一页，栏格画好了，栏名空着。空栏名画了三寸长——三寸长的栏，三年的日记里没有过。';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 7);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 竺照禅：她给你讲经，句句像在点台下的你 ----
    'shao_event_probe': {
        id: 'shao_event_probe', npcId: 'sect_leader_少林寺', title: '点人', icon: '🪷',
        desc: '她给你讲了一场经，每一句都像在点你——阿弥陀佛，念得比平日多了三声。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'shao_e_probe_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '少林寺讲经堂，早课刚散，僧众退尽，她却在法座上没起身——单讲给你一个人听。批注经摊在经案上，页边批注密密麻麻，小字比经文还锋利。你坐在台下头一排。她讲一句，念珠响一声；讲得越慢，佛号越多，一声一声「阿弥陀佛」，念得比平日多了三声。末了一句讲的是：「心如猿猴，攀一枝复攀一枝。」讲完，她把念珠搁下，珠声停在空殿里。', type: 'description' },
            { speaker: 'npc', text: '「阿弥陀佛。」她合十，佛号念得端端正正，垂下的眼却直直看你，「贫尼讲经二十年，三百场法会，没有讲岔过一句。今日给你讲，岔了三句。」她把批注经往前推了半寸，页边的批注比原文还毒，骂的全是前人注疏：「第一句岔在猿猴那一节——讲的时候，贫尼看了台下。第二句岔在哪儿，贫尼不说。第三句岔在佛号：今日的佛号，比平日多了三声。佛号多数，经上有名目，叫『心有未明之事』。」' },
            { speaker: 'npc', text: '「有没有，台下的人自己知道。」她把念珠提起来，珠子盘得发亮，二十年的手泽深得像漆，「经云：诸法因缘生。你近日上山，上一日，缺一日——因缘不在少林的香火，也不在贫尼的经。」她忽然俯身，佛相不变，话变毒了：「你报与贫尼：你心里那部经，贫尼如今算什么位——算经文，还是算经边的批注？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「算批注。我不瞒你——批注是贴着经文、最不肯离开的字。」', effect: 'tell' },
                { text: '「算经文。批注都是闲笔——往后每一场法会，我都来坐头排。」', effect: 'reassure' },
                { text: '「讲岔了是你自己功夫不到，赖得着台下坐人？」', effect: 'deflect' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            var dao = rival && rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'tell':
                    aff = dao ? -8 : -5;
                    msg = '她捻珠的手停住了。她静了三息，忽然合十：「阿弥陀佛。」佛号念完，佛相没动，她却把批注经翻到最末一页——那一页空白，一个字也没有，纸面干净得能照见人影。「' + (rival ? rival.name : '那人') + '，这个名字，贫尼看明白了。」她把经翻回来，指尖压着那页空白，「贫尼批遍天下人，批注的毒，撑得讲经堂二十年的香火。独独关于你的这一句——笔悬着，落不下去。落下去就作真；作了真，贫尼就骂不动你；骂不动你，就是——」她搁下念珠，头一回没有先念佛号就说了实话，「就是贫尼认了输。经文到不了的地方，批注到得了；批注到不了的地方，」她合上经，合经的声音很轻，「人到得了。你回去，把方才那句批注的话做出来。做出来了，这页空白就有了下落；做不出来——」她抬眼，毒舌归位，「贫尼就当你今日讲的，也是巧语。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
                case 'reassure':
                    aff = dao ? -3 : 4;
                    msg = dao
                        ? '「头排。」她重复了一遍，点点头，先合十：「阿弥陀佛。」佛号念得极圆，圆完毒舌跟上：「好话。经上管这种好话叫巧语——巧语如绸，裹着人，人还觉着暖。」她翻开批注经，提笔，在猿猴那一句旁边添了两个小字：「存疑。」添完她合上册子，「存疑不骂，是贫尼给你留的体面。批注存疑存老了，要么销，要么改判。改判的那一日——」她把念珠收回袖中，声音低了半格，「你最好在山上。不在，贫尼就自己判。自己判的批注，向来比骂人的毒。」'
                        : '她伸向念珠的手停在半空。半晌，她当真把今日的经收了——收得比平日早了一刻，法会头一回散得这么早。她走下法座，批注经抱在臂弯里，耳根红着，毒舌撑着佛相：「经文闲笔，你倒是会分。」她把经案上那串念珠绕了两圈，绕得极慢，「头排的位子，二十年来坐过的人，贫尼都记得。记得的不是人——是人走了以后，头排空出来的那一段。」她抬眼看你，看得很直，「你坐进来，那段就满了。满了的头排，经上讲不出名目。讲不出名目的，」她顿了顿，声音低下去，「贫尼批。」';
                    break;
                case 'deflect':
                    aff = dao ? -12 : -8;
                    msg = '「赖得着。」她点点头，先合十：「阿弥陀佛。」这一声佛号念得极长，长完她睁眼，佛相还是那尊佛相，话却一句比一句平：「是贫尼功夫不到。经上说：风动幡动，皆是心动。台下坐不坐人，与讲岔的经无干——这三句岔经，贫尼自己认，自己罚。罚是今夜加一座晚课，课里替天下讲岔经的人忏一回悔。」她把批注经合上，归案，归得极正，念珠一圈一圈绕回腕上：「至于台下坐人的事——从明日起，头排不设了。法会人人有座，独头排撤了。撤了，讲经的人就不用往下看；不往下看，经就不会岔。」你转身要走，她在法座上坐着没有动，佛号从背后飘过来，一声，又一声，数着念，数到第七声停了。第二日知客的僧人说：昨夜师父在栴檀林里站到五更，念珠拨完了一遍又一遍。回殿以后，师父在批注经那页空白上落了一行小字，落完又划了。划了的那页，还是空白——只是纸面上，多了一道压得极深的笔痕。';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 7);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    }
};

// ============ 二、敲打（36 桩，一次性，试探之后） ============
// 触发门：试探已发生 + 情敌已成道侣（道侣契是阳谋，人尽皆知——不再需要「撞破」）。
// 到这一步，他们不问「是不是」了——问「怎么办」。各自立各自的规矩。
var JEALOUSY_COLD_EVENTS = {
    // ---- 温蘅：药分单双，从此按方抓药 ----
    'bh_event_cold': {
        id: 'bh_event_cold', npcId: 'sect_leader_百花谷', title: '单方的药', icon: '🍵',
        desc: '她给你抓的药，变成了一份。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'bh_e_cold_done',
        requireRivalRomance: true, requireEventDone: 'bh_event_probe',
        scenes: [
            { speaker: 'narrator', text: '药庐。你进门时，她正把配好的药分成两份——看了看，又把第二份收了回去，只留一份在你面前。', type: 'description' },
            { speaker: 'npc', text: '「道侣契的事，百花谷的采药人都知道了。」她笑眼弯弯，语气像在说今日天气，「喜酒我没喝上——药方倒是先给你添了麻烦。」' },
            { speaker: 'npc', text: '「往后的规矩，我说一次。」她把那单份药推给你，「药，一人份。茶，一人盏。药庐的门——你还是随时推。」她顿了顿，琥珀色眼底有光，但很静，「只是我这儿的『自己人』，从今天起换字了。换哪个字，你哪天亲口来问，我哪天答。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「我来问。现在就开始问。」', effect: 'vow' },
                { text: '「规矩我认。单份的，也挺好。」', effect: 'accept' },
                { text: '「不过成了个道侣，你至于吗。」', effect: 'argue' }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'vow':
                    aff = 6;
                    msg = '她碾药的手停了停，耳根有一点颜色：「……现在就开始问？」她把药碾子一推，转过身去收药柜，背得很直，「那你先回答——你那位道侣知道你每回来药庐，抓的什么药吗？」她没回头，「答不上来，就先答。答上来，再问。药庐等得起——我给你熬药的人，更等得起。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
                    break;
                case 'accept':
                    aff = 3;
                    msg = '她点点头，把包药的纸裁得整整齐齐：「单份的也挺好——这话像大夫说的。」她把药包递给你，指尖在你掌心多停了半息，「药苦。往后没人给你配糖了——自己记着买。」';
                    break;
                case 'argue':
                    aff = -15;
                    msg = '她没吵，只是把那只你惯用的茶盏收了，搁回最高一层的柜上，动作轻得像收一件旧物：「至于吗。」她重复了一遍，笑眼弯弯，「你抱病三日，我衣不解带守的那三夜——你如今问我至于吗。」她替你拉开药庐的门，「今日药不给了。回去把这句『不至于』，对着你自己的心，再说一遍。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 10);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 绯泪：账本并页，一字千金 ----
    'xl_event_cold': {
        id: 'xl_event_cold', npcId: 'sect_leader_修罗宫', title: '并页', icon: '🗡️',
        desc: '她把两页账，钉成了一页。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'xl_e_cold_done',
        requireRivalRomance: true, requireEventDone: 'xl_event_probe',
        scenes: [
            { speaker: 'narrator', text: '修罗宫后殿。她把行踪簿摊开——你名下那一页，和另一页并在一起，用一枚寒铁钉钉住了。另一页，写着你道侣的名号。', type: 'description' },
            { speaker: 'npc', text: '「道侣契。修罗宫的暗哨，昨日把喜帖的抄本放在我案头。」她说得很平，平得像结了冰的湖面，「——我让人退了。退一次，退两次。第三次，我亲自去随礼。」' },
            { speaker: 'npc', text: '「从今天起，我的账并页了。」她指尖敲在那枚铁钉上，「你们两个的日子，我一页记。谁先亏欠——」她抬眼，寒冰的目光里烧着一点别的东西，「修罗宫找谁讨，你自己心里有数。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「要讨就讨我。别动她。」', effect: 'vow' },
                { text: '「并页就并页。这笔账，我认记。」', effect: 'accept' },
                { text: '「成个道侣而已，你发什么疯。」', effect: 'argue' }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'vow':
                    aff = 5;
                    msg = '她盯着「别动她」三个字看了很久，忽然笑了，笑得冷又有点亮：「放心。修罗宫做事，从来只找正主。」她把铁钉按实，「你既把两个名字押在一页上——那这一页的每一笔，都只欠我一个人。她那边的事，你自己摆平；摆不平，来我这儿——」她顿住，把簿子合上，「……我教你摆平。别误会。账要平，人才平安。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
                    break;
                case 'accept':
                    aff = 2;
                    msg = '「认记就好。」她收起簿子，「修罗宫的账，利息按天算。你对哪一边失了约，另一边——」她淡淡道，「就按双份收。」';
                    break;
                case 'argue':
                    aff = -18;
                    msg = '殿内的烛火「唰」地矮了半截——她周身的寒气把火苗压了下去。她反而笑了：「发疯。」她一字一字，「修罗宫三百口人，从没见过我发疯。今日让你做头一个。」她拔剑三寸，又按回去，「滚。今日剑下不收命——收的是你从前的脸面。下次再来，带着你那份交代来；带不来——就带着伤来，我也认。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 12);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 琤霄凌：剑分双穗，自己选一条路走 ----
    'ts_event_cold': {
        id: 'ts_event_cold', npcId: 'sect_leader_天山派', title: '双穗', icon: '❄️',
        desc: '霜鸣剑穗上，多了一条红绳。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'ts_e_cold_done',
        requireRivalRomance: true, requireEventDone: 'ts_event_probe',
        scenes: [
            { speaker: 'narrator', text: '雪庐外。她把霜鸣横在门前雪地上——剑穗上系了两条绳：旧的青，新结的红。', type: 'description' },
            { speaker: 'npc', text: '「成契那日，山下喜宴的锣鼓，雪山上都听得见。」她声音很稳，「天山派没随礼。我们的礼，重——今日给你。」' },
            { speaker: 'npc', text: '「青的这根，跟了我十二年。」她指着旧绳，「红的是今早结的。」她抬眼，冰蓝的眼在雪光里亮得吓人，「剑道不容二心，你也成过道侣契——这话如今该反过来问你：你打算怎么个走法？选一条，走到底。两条都选——」她把剑往前推了半尺，「就都别走。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「两条我都背。背不动，我自己担。」', effect: 'vow' },
                { text: '「容我想清楚。给我些日子。」', effect: 'accept' },
                { text: '「一条剑穗，也要逼我表态？」', effect: 'argue' }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'vow':
                    aff = 4;
                    msg = '「背不动，自己担。」她把这句话重复了一遍，忽然伸手，把红绳解下来，塞进你手里，「那这根你拿着。」你愣住时，她已退了半步，「青的留下。不是让你选完——是让你记着：红的这条，是你自己接的。哪天你连它也背不动了，天山雪大——埋得起。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
                case 'accept':
                    aff = 3;
                    msg = '「想清楚」三个字她点了点头：「行。剑等得起，我也等得起——十二年都等了。」她抱起霜鸣，「但别在我这儿想。去雪线上走走，边走边走。天山有条规矩：想不明白的人，进不了雪庐的门。哪天你想明白了，门自己会开——我夜里给你留着灯，你别回头看见就行。」';
                    break;
                case 'argue':
                    aff = -16;
                    msg = '她没动怒。她只是当着你，把那条红绳解下来，一根一根抽成丝，撒进雪里。「逼你？」她声音轻得像雪落，「我用十二年月下练剑的功夫，换你一句『不至于』。」她抱起霜鸣转身，「雪庐落锁。这回不落铁锁——落剑锁。剑锁认人：心里有几个名字，就锁几道。你自己数。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 10);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 蓝凤凰：蛊分两坛，各安天命 ----
    'wx_event_cold': {
        id: 'wx_event_cold', npcId: 'sect_leader_五仙教', title: '两坛', icon: '🏺',
        desc: '她面前摆了两坛酒，说这是新的规矩。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'wx_e_cold_done',
        requireRivalRomance: true, requireEventDone: 'wx_event_probe',
        scenes: [
            { speaker: 'narrator', text: '万蛊窟。她面前并排放着两坛酒，坛口都封着红泥。她拍开一坛的封泥，先给自己斟满。', type: 'description' },
            { speaker: 'npc', text: '「道侣契的喜酒，天下人都有，我不能例外。」她仰头饮尽，凤目被酒烧得发亮，「这是喜酒一坛。」她又拍开第二坛，「这是忘情散泡的酒——散我改方了，拿酒泡，不苦。」' },
            { speaker: 'npc', text: '「新的规矩，你听好。」她拿指尖把两坛酒往两边一分，「喜酒你随时来讨，我随时给你斟。这坛忘情酒——」她按着坛口，笑意艳，眼底冷，「你来一次，我少喝一口；你一个月不来……」她笑了，「我把它当水喝。心蛊要是趁醉破壳，五仙教可不管赔。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「两坛我都接。但忘情这坛，封存。」', effect: 'vow' },
                { text: '「规矩我记下了。喜酒我常来讨。」', effect: 'accept' },
                { text: '「动不动拿命说事，很累。」', effect: 'argue' }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'vow':
                    aff = 6;
                    msg = '你把两坛都抱过去，忘情那坛推到高处。她仰着脸看你忙，忽然笑出了声，笑里带着酒气：「……封存。行。」她替你斟喜酒，斟得慢，斟满了酒面隆起一线不肯溢，「我们养蛊的懂——酒封得越久，开坛越烈。你封得住这坛，我就把喜酒给你酿一辈子。封不住——」她举起自己那盏一饮而尽，「那这坛我替你喝。喝死之前，记得来跟我说一声。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
                    break;
                case 'accept':
                    aff = 3;
                    msg = '「常来讨？」她把喜酒坛往你这边推了半尺，「五仙教的规矩，喜酒讨三回，得随一回礼——礼不要银子。」她点了点自己心口，那团黑纹安静地伏着，「要一句实话：每回来，告诉它一句，你这心里，如今几斤几两、它占几钱。它记性好得很，不许赖账。」';
                    break;
                case 'argue':
                    aff = -17;
                    msg = '她把杯放下，笑了，笑得很艳：「累？」她抱起那坛忘情酒，当着你的面拍掉封泥剩下的一半，「好。不拿命说事了——直接办。」酒香瞬间炸开，浓得发苦，「坐。陪我喝。喝到你说一句不累的真话为止。」她给自己斟上，「放心，毒不死。心蛊替我挡着——它护主护得紧，就是护完主，该发疯的就是它了。你我，一起。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 10);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 冶砚：炉前立碑，名字要刻清楚 ----
    'lu_event_cold': {
        id: 'lu_event_cold', npcId: 'sect_leader_铸剑山庄', title: '碑上名字', icon: '⚒️',
        desc: '炉房门口立了块新碑，等他刻字。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'lu_e_cold_done',
        requireRivalRomance: true, requireEventDone: 'lu_event_probe',
        scenes: [
            { speaker: 'narrator', text: '炉房门口立了块半人高的新碑，铁一般的石料，一个字还没刻。冶砚抱着锤站在碑边，像守着一炉将成的铁。', type: 'description' },
            { speaker: 'npc', text: '「你成契的事，山庄收了三份贺帖。」他把锤往地上一顿，「我一份没写。写什么？——『贺』字我刻得，落款处我的名字，往哪儿搁？」' },
            { speaker: 'npc', text: '「铸剑山庄的规矩，炉前留名，一生一名。」他指着碑，「这块碑，今日刻字。刻谁，你说了算——刻一个，或者……」他闷声道，「你说刻几个，我刻几个。反正炉前这碑，从不撒谎，也从不抹字。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「刻两个。名字后头，各注一笔情由。」', effect: 'vow' },
                { text: '「先空着。等我亲手来刻。」', effect: 'accept' },
                { text: '「一块石头，你也能演一场戏。」', effect: 'argue' }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'vow':
                    aff = 5;
                    msg = '他盯着你看了半晌，忽然抡锤，当当两声——两个名字落在碑上，笔画深得像铁水浇的。退开两步看了看，他把锤递给你：「情由。你说，我刻。」听完，他沉默地刻完，末了在两个名字中间刻了道横线，线上压着一柄小锤，「铸剑山庄解不了的双头账，让炉子看着。」他背过身去，声音闷闷的，「……两个都得顾到。少顾一个，这碑，我砸了重刻。砸碑那天，你最好在。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
                    break;
                case 'accept':
                    aff = 4;
                    msg = '「亲手来刻。」他把锤挂回墙上，点了下头，「行。碑我不刻了，錾子给你留着。」他往炉房走，走了两步又停，「只是有句话——錾子刻石，一錾是一錾，改不了。你磨蹭到哪天，这碑就空白到哪天。空白的碑，江湖上叫『无字碑』，那是留给死人记功用的。」他说得直，「盼着你别用得上这三个字。」';
                    break;
                case 'argue':
                    aff = -16;
                    msg = '他没答话。他抡起锤，一锤砸在碑上——石屑纷飞，碑身裂了一道纹，从顶裂到底，可一个字也没刻上去。「演？」他喉结滚了滚，声音像炉底闷着的火，「我爹给娘刻碑那年，我在炉房拉了一夜风箱。他们那辈，一名一碑一炉火。」他放下锤，「你走吧。碑裂了——裂了的碑不值钱，也不撒谎了。正好，配你今日这句话。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 10);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 芩木：药单两份，各自署名 ----
    'su_event_cold': {
        id: 'su_event_cold', npcId: 'sect_leader_药王谷', title: '署名', icon: '📜',
        desc: '他开的药单，要各自署名。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'su_e_cold_done',
        requireRivalRomance: true, requireEventDone: 'su_event_probe',
        scenes: [
            { speaker: 'narrator', text: '药庐。案上两张新方并排放着，字迹一样温润，抬头却各写了两个名字。他搁笔，请你过目。', type: 'description' },
            { speaker: 'npc', text: '「你成契的喜帖，药王谷收着了。我回了礼——」他指指其中一张方子，「一副养血的。你道侣那边，托人送去了，用的『药王谷』落款，没写我名字。礼数干净，你放心。」' },
            { speaker: 'npc', text: '「药王的规矩，方各有主。」他把另一张推给你，「这一张，是你的。两张方，两味相同的药都有——」他抬眼，浅褐眼底温润如水、水下沉石，「同药不同量。量的分寸，往后我自己调。你只需做到一件事：两张方，都得有人按时来取。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「两张方，我亲自来取。一次不落。」', effect: 'vow' },
                { text: '「你的分寸，我信。药我按时吃。」', effect: 'accept' },
                { text: '「开两张方子，你把自己当成药了？」', effect: 'argue' }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'vow':
                    aff = 6;
                    msg = '他执笔在两张方尾都落了「按时」两个字，落得极慢极稳：「好。」他把方子折成两个同样的角，递给你，「药王谷有句老话——方子改十次，不如病人忌一次口。」他望着你，「你这张方子上，忌的是『失信』。忌得住，我这儿的药，永远给你留着最好的火候。」顿了顿，「……忌不住也没关系。药庐治得起。就是我这双手，往后给你配药时，会想起今日。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
                    break;
                case 'accept':
                    aff = 3;
                    msg = '「信我最好。」他把方子推近，「我的分寸，就是——你来得勤，我这边药量轻一分；来得疏，就重一分。」他温润地笑，「所以，为了我少开些苦药，你常来。」';
                    break;
                case 'argue':
                    aff = -16;
                    msg = '他脸上的温润没散，只是慢条斯理地把案上另一张方子收了，锁进抽屉，锁得很轻、很实。「把自己当成药？」他轻声重复，「是。我这一肚子方子，你当笑话——药王谷立谷三百年，靠的可不是笑话。」他把你的那张方单独留下，抽屉的钥匙挂上脖子，「回去把药吃了。从今往后，我给你配的药，只治身，不治心——心的那部分，你自己负气，自己扛。扛不住那日，药庐还开。只是挂号时，记得报上今日这句妙语，好让我记清：第几副药，是白配的。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 10);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 昴既明：卦纸压灯，等一个解 ----
    'ms_event_cold': {
        id: 'ms_event_cold', npcId: 'sect_leader_茅山派', title: '压灯', icon: '🕯️',
        desc: '他把那张分心卦，压在了符灯底下。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'ms_e_cold_done',
        requireRivalRomance: true, requireEventDone: 'ms_event_probe',
        scenes: [
            { speaker: 'narrator', text: '符阁。那日那张「分」字卦纸，被玉镇压在了长明灯的灯座之下——压住了，却没焚。', type: 'description' },
            { speaker: 'npc', text: '「你的契，茅山收了贺帖。」他执朱砂笔，不停，「帖子我供在祖师案前了。道士不藏话——卦也供着，灯也点着，你心里那位若哪天路过茅山，进殿一看，什么都明白了。」' },
            { speaker: 'npc', text: '「茅山的规矩：凶卦焚则灾了，压则待定。」他搁笔，银光在灯下流转，「我替你选了『压』。」他抬眼，「卦下压着的，是一个『解』字——解卦的人，得在灯下守够一夜。守不守，什么时候守——茅山的门，不催。但灯油耗的是我的。我烧得起多久，你自己看。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「今夜就守。灯归我，卦归我解。」', effect: 'vow' },
                { text: '「灯别灭。我记着这笔油。」', effect: 'accept' },
                { text: '「一张卦纸，供到祖师爷面前，闹不闹？」', effect: 'argue' }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'vow':
                    aff = 6;
                    msg = '他看你三息，起身，把蒲团挪到灯前，让开：「请。」那一夜你守灯，他在阁中画了一夜的符，笔声与灯花交替。天亮时他把卦纸从灯座下抽出——纸角焦了一圈，卦名那字被灯焰燎去一半，只剩「刀」。他端详良久，收进袖里，「……解了一半。」他难得语气松了半分，「剩下一半，你自己慢慢走。茅山的灯，往后只为你留三更——道士也要修行。这话是推托，也是实话。分着听。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
                    break;
                case 'accept':
                    aff = 3;
                    msg = '「油钱不必记。」他重新执笔，「茅山渡人二十年，没收过分毫——忽然收你，祖师看着呢。」笔锋顿了顿，补了一句，「你若实在过意不去——每月初一，灯下坐半个时辰。不算卦金。算……让这盏灯，亮得像个等人回来的样子。」';
                    break;
                case 'argue':
                    aff = -17;
                    msg = '他「嗯」了一声，当真走到祖师案前，把帖子从案上取了下来，连同灯下卦纸一并抽了出来。他捏着两样东西站了很久，然后——把卦纸放回灯座下，帖子却没再供回去。「你说得对，闹。」他声音清冷如旧，「所以从今天起，不闹了。卦继续压着，帖子焚了。茅山从今往后，只认你香火的有无，不认你心事的多寡。」他执起朱砂笔，再没看你，「香客满天下——贫僧……贫道今日，也只做你的出家人。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 12);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 赫渊：木牌正反面，一次说清 ----
    'jg_event_cold': {
        id: 'jg_event_cold', npcId: 'sect_leader_金刚宗', title: '两划满', icon: '🔔',
        desc: '背面那两道新划，今天刻到了第三道。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'jg_e_cold_done',
        requireRivalRomance: true, requireEventDone: 'jg_event_probe',
        scenes: [
            { speaker: 'narrator', text: '金刚塔内。他一见到你，就把木牌推了过来，翻到背面——那三道划痕并排着，像三炷香。', type: 'description' },
            { speaker: 'npc', text: '「契成了。贫僧在塔里，听见山下的钟替你们贺。」他开口，声音低哑，破了很久的禅，「木牌上，划了三道。」' },
            { speaker: 'npc', text: '「闭口禅，破一次，添一划。」他望着你，沉静的眼里古井无波，波底下有东西，「五划——贫僧说过，说最后一次话。」他双手合十，「今日提前破了规矩。你听完，往后不必再猜我的数目。最后一话只有八个字——」他一字一顿：「『塔在，人在，门不常开。』」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「门不常开，我挑对的日子来。」', effect: 'vow' },
                { text: '「八个字，我一个字一个字记下了。」', effect: 'accept' },
                { text: '「装哑巴装了这么久，就憋出这八个字？」', effect: 'argue' }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'vow':
                    aff = 6;
                    msg = '他拨珠的手停了。良久，他拿起木牌，把背面那三道划痕，用指甲一道道抚平——抚不平，划痕还在。他索性把木牌翻到正面，推给你：「挑日子。」他开口第二句，破到底了，「贫僧不会告诉你哪天该来。但你可以——每月初一，塔前扫地。扫完，门开。这是规矩，也是……」他闭目，佛珠转回去，后半句轻得几乎听不见，「……盼头。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
                    break;
                case 'accept':
                    aff = 3;
                    msg = '「记下就好。」他把木牌收回袖中，重新合十垂目。塔内重归寂静。你起身告辞，走到塔门时，身后忽然又响起那低哑的一声——「灯。」你回头，他望着佛前长明灯，没有看你，「塔里夜黑。贫僧为你……留了一盏。别说贫僧破戒。香客夜访迷路——是寺院之责。」';
                    break;
                case 'argue':
                    aff = -18;
                    msg = '塔内静了十个呼吸。然后他伸手，拿起木牌，就着你面前的烛台，把背面那三道划痕，一道一道，烙成了焦黑的三道。他烙得很稳，烙完，把木牌放在你面前合十——一句话没有。然后他起身，亲自去落塔门闩。铁闩入扣那一声，闷得像敲在钟上。门外风声里，飘进来今天的第一句，也是最后一句：「阿弥陀佛。施主——木牌送你。划痕留你。贫僧的禅……重新闭关。」门内，再无声息。';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 14);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 夙孤鸿：第七条空白十年，今日立一条不刻的新戒 ----
    'em_event_cold': {
        id: 'em_event_cold', npcId: 'sect_leader_峨眉派', title: '第七条', icon: '📏',
        desc: '她把师父的戒尺拿出来，指给你看第七条的空白。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'em_e_cold_done',
        requireRivalRomance: true, requireEventDone: 'em_event_probe',
        scenes: [
            { speaker: 'narrator', text: '戒堂。灯下，她把师父传的那把木戒尺横在案上——六条戒刻得深深浅浅，第七条的位置，空白了十年。她请你坐下，自己站着。', type: 'description' },
            { speaker: 'npc', text: '「你成契的事，峨眉知道了。」她声音端方，像在诵戒，「喜帖送到戒堂，我压在案头，三日没拆。今日拆了。」' },
            { speaker: 'npc', text: '「师父刻这把尺，刻到第七条，留了白。她说，第七条要等她自己想明白了再刻。」她指尖按在那段空白上，按得很轻，「她没想明白就走了。这十年，我没敢替她刻。」她抬眼看你，「今日我只想明白一件事——立一条新戒，不必刻在尺上。往后你在峨眉的门里，名字不许再缺卯。缺一回，罚一回。罚什么，我当面定。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「罚我认。这条戒，我陪你守。」', effect: 'vow' },
                { text: '「规矩我记下了。卯，我按时点。」', effect: 'accept' },
                { text: '「成个道侣而已，你也要立戒管我？」', effect: 'argue' }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'vow':
                    aff = 5;
                    msg = '她按着戒尺的手松了半分。半晌，她从袖里摸出一小包素点心，搁在你手边——还是那个老样子，尺端着，点心递上来。「陪我守。」她把这三个字重复了一遍，声音低了些，「峨眉的戒，守起来冷。有人陪着——」她把戒尺收好，没再说下去。走到门口，她回头补了一句，「第七条的空白，我留着。等哪天有人配得上刻它，再刻。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
                    break;
                case 'accept':
                    aff = 3;
                    msg = '「按时点卯，好。」她把戒尺收回腰间，恢复了戒律首座的样子，「峨眉的规矩，说到做到——罚则我也说到做到。你头一回缺卯，罚抄戒文一遍。」她顿了顿，语气没变，话却软了一线，「抄完，斋堂给你留一盏汤。这是规矩外头的。」';
                    break;
                case 'argue':
                    aff = -16;
                    msg = '她没吵。她只是把案上那张喜帖拿起来，对折，再对折，收进了裹戒尺的布囊——和你的名签放在一起。「管你？」她声音平得没有一丝纹，「戒律首座不管人，只管数目。你的卯，从今往后，我不点了。」她吹熄了戒堂的灯，黑暗里只余一句，「灯灭了，路你自己认。峨眉的山门夜里落锁——落锁之后敲门的，我当香客待。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 11);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 竺听雨：总账后头，给你单立一页私账 ----
    'hs_event_cold': {
        id: 'hs_event_cold', npcId: 'sect_leader_华山派', title: '一页私账', icon: '📒',
        desc: '他在华山总账后头，给你单立了一页。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'hs_e_cold_done',
        requireRivalRomance: true, requireEventDone: 'hs_event_probe',
        scenes: [
            { speaker: 'narrator', text: '账房。案上摊着华山的总账，后头夹了一页新纸——墨迹刚干，抬头写着你的名字。他坐在那儿，笑吟吟的，像等你很久了。', type: 'description' },
            { speaker: 'npc', text: '「喜帖我随了礼。」他先说这个，摆摆手，「华山的账紧，礼薄，你别嫌。礼单上我的落款是『代掌门』——随的公款。」他指指那页新纸，「这一页，是我的私账。私账上，头一笔记的是你。」' },
            { speaker: 'npc', text: '「你成了契，江湖上都知道了。」他笑意不减，声音却慢下来，「我这十年，替华山垫账、替师弟们扛事，什么账都认。今日立个新规矩——」他指尖点在那页纸上，「这一页，只记你欠我的、我欠你的。旁的账都好平，这一页，得两个人对着记。你认不认？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「认。这一页，我陪你记下去。」', effect: 'vow' },
                { text: '「账页我认。数目慢慢对。」', effect: 'accept' },
                { text: '「成个道侣而已，至于单立一页？」', effect: 'argue' }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'vow':
                    aff = 6;
                    msg = '他怔了一下，随即笑开——这一回笑得没挂着什么，是真的。「记下去。」他把这三个字念了一遍，摇摇头，「华山的账，没记过这么长的期。」他提笔，在页尾落了一行小字，推给你看——「此页不设结账日。」他收了笔，「师父的酒葫芦在我房里挂着。等这一页记满，我拿它装酒，请你喝头一盏。记满要多少年——」他笑，「我等着算。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
                    break;
                case 'accept':
                    aff = 3;
                    msg = '「慢慢对，好。」他把账页抚平，夹回总账后头，位置记得极熟，「华山的规矩，账不怕慢，就怕糊。你来一回，我对一笔。」他给你斟茶，斟得满，「茶是账房自己买的——公款不报销这个。」';
                    break;
                case 'argue':
                    aff = -17;
                    msg = '他不笑了。这是你头一回见他脸上没有笑。他把那页新账从总账里抽出来，就着烛火看了很久——没烧，折了三折，收进怀里。「至于。」他只说了这两个字，起身推窗。窗外正落雨。他望着雨，背对着你，声音和雨声混在一起，「十年前有人临终托了我一句话，我答了个好字，说了十年。」他摆摆手，像把什么挥开，「账房今日不盘了。你回吧——雨大，路上滑。这句是大师兄说的，不是私账上那个人说的。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 12);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 晏万解：毒谱立新页，炉上的份例改了 ----
    'tm_event_cold': {
        id: 'tm_event_cold', npcId: 'sect_leader_唐门', title: '谱上新页', icon: '⚗️',
        desc: '唐门毒谱的最后一页，立着你的名字。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'tm_e_cold_done',
        requireRivalRomance: true, requireEventDone: 'tm_event_probe',
        scenes: [
            { speaker: 'narrator', text: '唐门毒堂。毒谱摊在案上，她翻到最末——新立的一页，抬头写着你的名字，底下一行行小字，记着你中过什么毒、解过什么药，日子记得极密。', type: 'description' },
            { speaker: 'npc', text: '「你成契的事，唐门收了三份喜帖。」她合上谱子，笑吟吟的，「祖母让人回了礼——唐门的礼，你是知道的，都带着针。帖子我没拆，谱上倒是添了一页。」' },
            { speaker: 'npc', text: '「堂里这炉丹，名字是我娘取的。丹还没出炉，份例的规矩我早定好了。」她指尖敲在那页谱上，笑里带刺，「原先的规矩：谁中毒，谁服——一视同仁。今日改了。你那份，单搁。搁不搁得住，看你把这一页，写满几行。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「规矩你定。这一页，我亲自来写。」', effect: 'vow' },
                { text: '「谱页我认。单搁的那份，替我留着。」', effect: 'accept' },
                { text: '「成个道侣而已，你连解药都分份？」', effect: 'argue' }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'vow':
                    aff = 5;
                    msg = '她翻谱子的手停住了。抬眼看你，嘴角那点笑压不住，又硬压下去：「……亲自来写。」她把笔推到你面前，「唐门毒谱，外人的手碰笔是大忌。今日破第一回例。」你写了一行，她盯着看，等墨干了才合上谱子，抱在怀里，声音低下去，「炉里的丹还差着火候。等它出炉那日——头一份不入库，搁你这页谱里。别多想，这是份例，不是情分。」她的耳朵很红。';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
                    break;
                case 'accept':
                    aff = 3;
                    msg = '「留着。」她把谱子合上，收进案头最里格，「不过唐门的规矩，单搁的份例有期限——你按时来，药是温的；你不来，」她吹熄了半盏灯，「药就回炉。话搁在这儿，别怪炉火不认人。」';
                    break;
                case 'argue':
                    aff = -16;
                    msg = '她笑了，这一回笑里没有刺，只有冷。「分份。」她把毒谱上那一页撕了下来，撕得很齐，折成三折，「唐门的解药，从不分给嫌多的人。」她把纸页收进袖中，谱子扣上，「走吧。我替你验茶的那根针，从今日起收起来。针收完了——你在唐门，连盏茶都没得验。」灯灭了。黑暗里那双白丝手套亮了一亮，被她的袖子盖住。';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 11);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 阙守拙：白石数日子，鞘离山百日 ----
    'wd_event_cold': {
        id: 'wd_event_cold', npcId: 'sect_leader_武当派', title: '数到一百', icon: '🗡️',
        desc: '他说，鞘离山满百日，剑要自己去寻。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'wd_e_cold_done',
        requireRivalRomance: true, requireEventDone: 'wd_event_probe',
        scenes: [
            { speaker: 'narrator', text: '真武殿。不争挂在剑架上——依旧无鞘。他坐在剑下，面前一排小白石子，从左往右，一颗一颗，数给你看。', type: 'description' },
            { speaker: 'npc', text: '「成契。」他开口，两个字，停了停，「我知道了。那日山上的钟，多响了三声——小道童撞的。不是我。」' },
            { speaker: 'npc', text: '「武当有条老例。」他把白石拢到一处，「鞘离山百日，剑自己去寻。」他抬眼看你，看得很慢，「鞘在你手里。我从你成契那日起，数日子。」他指那排石子，「一颗，一天。数到一百会怎样——你知道。我不说。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「不用数到一百。鞘，我自己送回山来。」', effect: 'vow' },
                { text: '「你数。数出来的日子，我认。」', effect: 'accept' },
                { text: '「一具剑鞘，也值得你这么算？」', effect: 'argue' }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'vow':
                    aff = 6;
                    msg = '他数石子的手停了。他看你，看得比平常久。然后他把那排石子一把拢开——拢得很干净。「那就不数了。」他说。他把不争从剑架上取下来，走到你面前，双手横剑：「剑先认鞘。你——认剑。」你没接，他就那么端着，端到你伸手碰了剑柄，才收手。「鞘回山，剑不出。」他说得很轻，「这四个字，我想了三年。今日，说全了。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
                    break;
                case 'accept':
                    aff = 3;
                    msg = '「好。」他把白石重新摆回一排，摆得很齐，「数日子不难。难的是——」他把最后一颗石子放下去，「数满了，人没来。」他起身去扫殿外的石阶，扫一遍，停一遍，像在等你说什么。你没说。他扫完了那日的阶，末了多扫了一级——那一级，是你惯常站的。';
                    break;
                case 'argue':
                    aff = -17;
                    msg = '他没说话。他把那排白石一颗一颗捡回手心，拢住。殿里很静，只有石子相碰的声音，一下，一下。捡完，他起身，把不争从剑架上取下来，走进了内殿——内殿的阶，他二十年不曾让人扫。帘子落下前，他留了一句，很慢：「鞘留在你处。钟——从今日起，不替你响。」第二日晨钟照旧。小道童说，师兄平日替上山的人留的那一杵，今日，没撞。';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 12);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 瀛晚照：图录另起一册，「岸上人」那一栏等你答话 ----
    'pl_event_cold': {
        id: 'pl_event_cold', npcId: 'sect_leader_蓬莱派', title: '新册', icon: '📖',
        desc: '她把图录里「岸上人」那一栏，另订了新页。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'pl_e_cold_done',
        requireRivalRomance: true, requireEventDone: 'pl_event_probe',
        scenes: [
            { speaker: 'narrator', text: '观汐台。你成契的喜帖送到蓬莱那日，帖是弟子们代收的。黄昏录潮，她案头摊着那册图录——翻开着，「岸上人」那一栏底下，裁开了一道新缝，另订了几页白纸，订得极齐。', type: 'description' },
            { speaker: 'npc', text: '「你成契的事，岛上知道了。」她声音照旧平，像在报潮，「帖子到岛，是初九。我翻到这一栏，是初九夜里，戌时三刻。翻了半个时辰。」' },
            { speaker: 'npc', text: '「观汐台有条旧规：录潮，不问岸上事。」她把笔搁下，笔搁得端端正正，「今日我改一回例。往后你的日子，另起一册记。原先这一栏——收不收你的名，你今日自己答。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「名不移。两册都记——你记多久，我认多久。」', effect: 'vow' },
                { text: '「另册就另册。数目你定，日子我来走。」', effect: 'accept' },
                { text: '「成个道侣而已，你连一册图录都要分？」', effect: 'argue' }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'vow':
                    aff = 5;
                    msg = '她按着新册的手松了半分。半晌，她把那几页新订的白纸合上——没有再翻开。她提笔，在原栏你的名字底下，添了一行小注，笔画比录潮还工整：「名不移。两册并记。」写完她把图录收好，声音低了些：「观汐台二十年，破例的页脚，一只手数得过来。」她望了一眼海平线，「你这一行，往后我记到册子订不动为止。订不动了——」她顿了顿，「再订。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
                    break;
                case 'accept':
                    aff = 3;
                    msg = '「好。」她把新册用线订实，封皮上不题字，「另册的第一笔，今日记下了：某年某月初九，岸上人自知。」她给你斟了盏热茶，斟得很满——录潮的手，斟茶从来只半盏，说是怕洒在纸上。今日满了。她推盏给你，「数目我定，日子你走。走一日，记一日。册子不催人——册子等。」';
                    break;
                case 'argue':
                    aff = -16;
                    msg = '她不争辩。她提笔，蘸墨，把「岸上人」那一栏里你的名字裁了下来——不是划掉，是拿裁纸刀裁的，裁口极直。裁下来的那一条纸，她看了很久，没有给你，压进了图录匣最底层。「分册。」她重复了一遍这两个字，声音平得没有一丝纹，「观汐台的纸，从来不怕裁。怕的是——裁下来的那一页，没人认领。」她吹熄了台灯，黑暗里潮声一层一层，「你回吧。新册今日不记了。往后记不记，看潮，也看你。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 11);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 闻人酌：残局收进匣中，替你酿的酒封了泥 ----
    'xy_event_cold': {
        id: 'xy_event_cold', npcId: 'sect_leader_逍遥派', title: '封坛', icon: '🏺',
        desc: '石桌的残局收进了匣里，池边新酒封了泥。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'xy_e_cold_done',
        requireRivalRomance: true, requireEventDone: 'xy_event_probe',
        scenes: [
            { speaker: 'narrator', text: '酒仙池边。你成契的喜帖，逍遥派收了——满山当笑话讲：守藏人听完，只说了一个「好」字，转身回琅嬛剪了一夜灯芯。今日你来，石桌上干干净净：那局摆了不知多少年的残棋，收进了一只木匣，匣盖合着。', type: 'description' },
            { speaker: 'npc', text: '「别找了，局在匣里。」他躺在坛边，朝你晃了晃酒盏，「喜帖我也随了礼——琅嬛抄的一部残谱，天底下独一份。逍遥派的礼，向来只给懂的人。」' },
            { speaker: 'npc', text: '「只是有两桩事，今日得立个规矩。」他坐起来，指指那只匣，又指指池边一坛封了泥的新酒——封泥上的字被泥抹平了，看不出原先题的什么，「其一，局收了。白子还在你手里——子在你手，局就没死透。这是你欠我的。其二，这坛酒，是去年替你酿的。今日，封泥。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「匣我来开，泥我来启。局和酒，都等你我。」', effect: 'vow' },
                { text: '「规矩我认。匣存着，坛封着——日子长着呢。」', effect: 'accept' },
                { text: '「成个道侣而已，收什么局、封什么酒？」', effect: 'argue' }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'vow':
                    aff = 6;
                    msg = '他斟酒的手停在半空。然后他笑了，笑得比平日都久：「都等你我。」他把这四个字咂摸了一遍，仰头饮尽盏中酒，「好。匣的钥匙，挂在琅嬛的灯下——你几时来取，灯几时亮。」他拍了拍那坛封泥，泥上的字他没说，你也没问，「这坛泥，我今日封的，来日你启。启封那日——」他抱起琴，拨了一个音，音很轻，「我把存着的那句话，一并说了。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
                    break;
                case 'accept':
                    aff = 3;
                    msg = '「日子长着呢。」他把这五个字念了一遍，点点头，「这话在理。庄生说，藏舟于壑，藏山于泽——酒存着不怕，怕的是存酒的人，先忘了坛在哪儿。」他把木匣从石桌上拿起来，掂了掂，又放回去了——没锁，「匣不上锁。锁是防外人的，你不算外人。坛也不沉池——沉了，你启封那日，还得湿一身。」他重新躺下，「规矩立完了。剩下的，日子慢慢走。」';
                    break;
                case 'argue':
                    aff = -17;
                    msg = '他不答。他把那盏酒慢慢倾回坛里，一线，一线，倾得很稳。倾完，他笑了一下，笑意与平日无异：「收局，封酒。」他抱起那只木匣，站起身，「逍遥派入山第一课：不留人，也不送人。我学了一半，学不下去——今日总算见识着另一半的好处了。不留，就不必收；不送，就不必封。」他往琅嬛走，走了两步，停住，背对着你，「匣归琅嬛，坛沉池底。你手里那枚白子——留着。子是你解过的，我收不回来。」顿了顿，声音还是懒的，懒得很用力，「收不回来的东西，最伤人。你拿着，正好。」帘影一晃，人进了福地。';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 12);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 祁清禅：回向页不重抄，木鱼每日少敲一声 ----
    'heng_event_cold': {
        id: 'heng_event_cold', npcId: 'sect_leader_恒山派', title: '新的一页', icon: '🪷',
        desc: '你成契那日，她把那页回向纸重新压进了经函。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'heng_e_cold_done',
        requireRivalRomance: true, requireEventDone: 'heng_event_probe',
        scenes: [
            { speaker: 'narrator', text: '白云庵抄经堂。你成道侣契那日，喜帖送到恒山，知客代收的。傍晚你上山，抄经堂的灯下她端坐着，案上摊着那页华严的回向页——旁边另有一张新纸，墨研好了，笔搁在砚上，湿着。', type: 'description' },
            { speaker: 'npc', text: '「契的事，庵里知道了。」她没抬头，声音又轻又平，「戒堂的记录上，昨夜添了一笔。我自己抄的——抄完，看了很久。」她搁下笔，「回向页上那一行，六年前乱过一次。昨夜，又乱了一次。」' },
            { speaker: 'npc', text: '她抬眼，温静。「戒不是捆人的，是安心的——这话我平日讲给弟子听。」她把那张新纸往你面前推了半寸，「今日我给自己立一条规矩：回向页不重抄。名字留着，经是经，名是名，两不相乱。」她的指尖按在纸边，「只是晚课的木鱼，从今日起，每日一声不敲。为什么少一声——你不必问。你想得来的时候，那一声，我替你敲回来。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「那一声，我今日起就来听你敲回来。」', effect: 'vow' },
                { text: '「规矩好。你抄你的经，敲你的木鱼——我得空就来。」', effect: 'accept' },
                { text: '「成个道侣是喜事，你木鱼少敲一声做什么。」', effect: 'argue' }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'vow':
                    aff = 6;
                    msg = '她按着纸的手停住了。半晌，她把木鱼取过来，搁在案上回向页旁边——六年了，这只木鱼没有离过她的袖。「来听。」她把这三个字念得很轻，像念一行经，「晚课酉时。不要迟。」她顿了顿，话里透出一点极淡的亮，「少的那一声，明日起，一声一声补回来。补满了，回向页上乱过的那一行——我当着你，把它抄顺。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
                    break;
                case 'accept':
                    aff = 3;
                    msg = '「得空就来。」她点点头，把那张新纸折了两折，压进经函最底下——没有扔，留着。「白云庵的晚课，风雨不停。我敲我的木鱼，风雨不停。」她重新执笔，笔锋照旧稳，「少一声，不是拍子乱了。是拍子里留了个空。空着——人来，拍子自己就合上了。」';
                    break;
                case 'argue':
                    aff = -16;
                    msg = '她不辩。她只把摊开的新纸收起来，笔搁回笔山，砚台盖上，一样一样归位，案上收得干干净净。「做什么。」她把这三个字念了一遍，声音比平日更轻，「师太闭关前说过：木鱼敲的不是拍子，是心里的余数。心里有余，就少敲一声——少的那一声，不是给经的。」她吹熄了灯。黑暗里只有素布裹木鱼的声音，一层，又一层。「明日的晚课，改个时辰。戒堂的规矩，改了时辰要告知全庵。」她停了停，「你不必告知——你本来也不必来。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 11);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 逵佩南：空了九年的第一百零八条，今日当面问你 ----
    'song_event_cold': {
        id: 'song_event_cold', npcId: 'sect_leader_嵩山派', title: '第一百零八条', icon: '⚖️',
        desc: '他把新章翻到那条空白的「例外」，连同半枚下符，摆在你面前。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'song_e_cold_done',
        requireRivalRomance: true, requireEventDone: 'song_event_probe',
        scenes: [
            { speaker: 'narrator', text: '执法堂。你成道侣契那日，喜帖送到嵩山——他亲自核过、画押、归档，程序一样不缺。今夜，他案上摊着一册新订的《执法堂新章》，翻到最末：第一百零七条，条文齐整；第一百零八条，条名两个字「例外」，条文——空白。', type: 'description' },
            { speaker: 'npc', text: '「契的事，档上有了。」他说，语气像在念条文，「贺礼是执法堂代公中出的——公事公办。这一册，」他的指尖落在那条空白上，「是私事。」' },
            { speaker: 'npc', text: '「执法之人，一生只写一个例外。」他从腰间解下那半枚执法令牌，下符，搁在新章旁边——铜色沉暗，断口与执事堂存的上符严丝合缝。「九年，这一条空着。空着，是因为我在等自己想清楚。如今想清楚了——」他抬眼看你，目光很稳，「例外立了。条文两款：其一，你的日子分几处，档册逐条核——我不问，但我要知道。其二，这半枚下符，此生只给一人。」他把令牌往你面前推了半寸，「第二款写给谁——你今日当面答。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「条文我陪你写。两款，我都画押担着。」', effect: 'vow' },
                { text: '「例外立了就立了。符你收着——日子我走给你看。」', effect: 'accept' },
                { text: '「一条空了九年的条文，你至于今天来填？」', effect: 'argue' }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'vow':
                    aff = 6;
                    msg = '他看了你三息，把笔递过来——笔杆调了个头，笔尖朝着他自己。「执法堂的条文，没有外人执笔的先例。」他把新章摊平，镇纸压实，「今日有第一个例外。写。」你逐款写下，他在旁边看着，墨干之后逐字核了一遍——核完，他在条文末尾落了「可存」两个字，落得极重。「画押，就是担着。」他把那半枚下符收起来——没有给你，也没有收回腰间，搁在了你与新章之间，「往后这一条的执法：执的是我，保的是你。条文若有违背之日，按新章：先核，后断。断的时候——」他合上册子，声音照旧平，末尾却松了半分，「我从轻。这三个字，也写进去了。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
                    break;
                case 'accept':
                    aff = 3;
                    msg = '「收着。」他把令牌收回腰间，收得很稳，「执法堂不催人——条文催。」他把新章合在那页空白上，镇纸压正，「日子怎么走，档册记。记到数目齐的那天——这一册的第一百零八条，我亲手补全条文。」他抬眼，「补的时候告知你。来——核档，要两个人当面。」';
                    break;
                case 'argue':
                    aff = -17;
                    msg = '他没有动眉。他只是把那册新章合上，合得极慢，像怕压坏了那页空白。然后他把半枚令牌从案上收回腰间，系好，系得很实。「至于。」他把这两个字念了一遍，语气像在核一条被驳回的判词，「九年，我不敢写这一条——怕写错。今日你替我确定了一件事：它空着，比错着好。」他起身，吹灯。黑暗里卷宗归架的声音，一下，极轻。「执法堂今夜闭堂。例外一条，按旧例：归档，存『未结』格。那一格的卷，永不结案。」他立在案后，声音平平，听不出喜怒，「何时结——条文说：要两心相合。合不上，立着就是伪档。执法堂不存伪档。你回去吧。此事，退回原档。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 12);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 岳清晓：火坛左手边的位子，问你还要不要 ----
    'tai_event_cold': {
        id: 'tai_event_cold', npcId: 'sect_leader_泰山派', title: '左手边', icon: '🌄',
        desc: '她拿炭笔在火坛左边的石头上画过你的位子——今日直问你还来不来。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'tai_e_cold_done',
        requireRivalRomance: true, requireEventDone: 'tai_event_probe',
        scenes: [
            { speaker: 'narrator', text: '玉皇顶。你成契的事，满泰山都知道了——临火人那日的档，记得特别重：晴，无风，火色，平。你卯时上顶，她在火坛前，左手边那块石头还在，炭笔画的位子也还在，只是画痕上落了一层晨霜。', type: 'description' },
            { speaker: 'npc', text: '「来了？」她不回头，火钩拨着炭，「契的事，恭喜。」两个字说得特别快，快得像把炭丢进火里，「泰山的规矩，恭喜要当面——所以我当面说了。说完，该说我的事了。」' },
            { speaker: 'npc', text: '她转过身，火钩往地上一拄，下巴朝左手边那块石头一抬，情绪全写在脸上——不是恼，是比恼更亮的东西：「这个位子，泰山三百年没人站过。炭笔是我画的。临火人画位子是什么意思，满山都知道。」她往前走了一步，「如今你成了契。我不绕弯——泰山的人不绕弯。这个位子，你还来不来？来，怎么个来法？不来，我今天就抹了它，抹得干干净净，省得我迎旭的时候碍眼！」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「来。两处日子，这个位子我担一半。担不动，我自己扛。」', effect: 'vow' },
                { text: '「位子先别抹。给我些日子——我把它走直了。」', effect: 'accept' },
                { text: '「一道炭笔印子，你也要逼我表态？」', effect: 'argue' }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'vow':
                    aff = 6;
                    msg = '她瞪着你看了三息，忽然蹲下去，从怀里掏出那块布，把石头上的晨霜擦了一遍——擦得极用力，擦完站起来，拿脚尖把石头边的位置踢正。「站。」你站过去。她上下打量，火钩往肩上一扛，脸上的光一寸一寸全回来了，亮得晃眼：「好！泰山的档，今天起多一栏新的。」那日的档她让你亲手记：迎旭，火旺，风静——页尾一行小字，她口述，你落笔：「左手边，有人。」写完她吹干，把档揣进怀里，拍了拍，下巴一抬：「这一栏是你写的。写了，就不许抹。要抹——先问过我的炭笔！」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
                    break;
                case 'accept':
                    aff = 3;
                    msg = '「走直。」她念了一遍，点头，火钩收了，「行。位子我不抹——炭笔印子，泰山的风雪都抹不掉，我更抹不得。」她转回火坛前拨炭，拨得哗啦响，「只是把话说在前头：我记档。你来一日，记『来』；不来，记『未』。记到你自己把它走直那日——那一页档，我让你抄一遍，抄完贴在火坛内墙上。起风的时候，我念给你听。」';
                    break;
                case 'argue':
                    aff = -16;
                    msg = '她愣住。握火钩的手紧了紧，指节都白了——然后她笑了一声，笑得发冷，是你没见过的样子。「逼你表态。」她蹲下去，拿布把石头上那道炭笔印子一点一点擦干净——擦得极慢，擦完起身，掸了掸火钩上的灰。「我画了半年，纠结了半年，等你上顶等了半年——你一句话，我擦了。」她背对着你，朝东边的天，声音照旧直，直得冷，「下山吧。明日的迎旭，火坛左手边，从今往后没有位子。档上那一栏，我也销了。泰山的人做事，销就销干净。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 11);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 幽翠微：旧罐分两半，新规矩当面立 ----
    'qing_event_cold': {
        id: 'qing_event_cold', npcId: 'sect_leader_青城派', title: '罐底', icon: '🫖',
        desc: '她把架顶那只旧罐取下来，开盖给你看罐底压着什么。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'qing_e_cold_done',
        requireRivalRomance: true, requireEventDone: 'qing_event_probe',
        scenes: [
            { speaker: 'narrator', text: '焙房。你成道侣契那日，喜帖送到青城——她代观里收了，回的礼是一包新茶，包口封得方方正正。今夜你上山，她正在架子前，把那只架顶的旧罐取下来——罐底那个「焙」字刻痕，擦得发亮。', type: 'description' },
            { speaker: 'npc', text: '「契的事，我知道了。回礼的茶是我自己包的——包上写的『青城新雨』，规规矩矩，没错。」她把罐子搁在案上，开了盖，「这只罐，一年到头装头一茬雪茶。装进去的时候满山都知道——出来的时候分给谁，从前只有我知道。」' },
            { speaker: 'npc', text: '她把罐子倒过来——罐底压着一页折得方方正正的旧纸。「前任看茶人的规矩：罐底的纸，不给活人看。」她没展开那页纸，把罐子推到你面前，「今日我立个新规矩。这罐茶从今往后分两半：一半头一茬，照旧入罐，给山；另一半——」她的指尖在罐沿上敲了敲，敲得很轻，「单搁。搁给谁，规矩说了算：搁给心不劈叉的人。你的心如今劈了叉——这半罐茶，你说，怎么搁？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「怎么搁你定。我那半——我自己来讨，一茬不落。」', effect: 'vow' },
                { text: '「新规矩好。你单搁的那半罐，留着。我心不劈了再来讨。」', effect: 'accept' },
                { text: '「一罐茶也立新规矩，你至于么。」', effect: 'argue' }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'vow':
                    aff = 6;
                    msg = '她敲罐沿的手停住了。她看了你两息，忽然转身从架上取了个新纸包，拆开，把半包新茶按进罐里——按得极实。「一茬不落。」她念了一遍，把罐盖扣上，扣得咔一声脆响，「青城的茶账上，今日立一条新规：出锅的头一包，不入架。头一包——」她把罐子推到案角最靠你的位置，离灯近、离风远，「搁这儿。人来，茶是温的；人不来，」她转头朝灶火添了把柴，「我重炒。重炒到你来为止。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
                    break;
                case 'accept':
                    aff = 3;
                    msg = '「留着。」她点头，把罐底那页旧纸压回去，又添了一页新的——新页空白，压在旧页上头。「空纸不压人。」她合上罐盖，「你来讨的那天，我亲手写日子——日子写在你那半罐上。什么时候把日子走满了，纸自然就写满了。」她把罐子搁回架顶，拍了拍手上的灰，「茶账不催人——罐子催。罐里是当年的头一茬，经不得放。经不得放，你就常来。」';
                    break;
                case 'argue':
                    aff = -17;
                    msg = '「至于。」她念了一遍，不辩——只把罐子倒过来，取出罐底那页纸，当着你的面展开：纸旧了，一行小字，墨色沉了，「茶给配喝的人。」「前任看茶人守了三十一年。她守的时候，也有人说她至于。」她把纸照原折痕折好，放回罐底，扣盖，「今日你添了一句：不至于。」她端起罐子，放回架顶最高的那一格，放得极稳，「好。罐归架顶，规归规，我归炒茶——各归各位。」她蹲回灶前生火，火光映着她的侧脸，「下山吧。路滑。——这句是关心，不是规矩。关心，我是不至于的。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 11);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 奚湘筠：半阙里多出一个气口，留给你 ----
    'xiang_event_cold': {
        id: 'xiang_event_cold', npcId: 'sect_leader_衡山派', title: '气口', icon: '🌧️',
        desc: '成契之后，她的半阙里多出一个气口——她说，留给你。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'xiang_e_cold_done',
        requireRivalRomance: true, requireEventDone: 'xiang_event_probe',
        scenes: [
            { speaker: 'narrator', text: '回雁琴台，夜雨。你成道侣契的事，衡山知道了——她从师妹口中听的，听完，说了一个「哦」字，没有问第二句。今夜琴台上的半阙照拉，拉到惯常停住的地方——弓没有收，多了一个停顿：不是停，是悬着，像一口气没有吐完。', type: 'description' },
            { speaker: 'npc', text: '「契。我知道了。」她坐在台上，胡琴抱在臂弯，字少如常，雨落在字与字之间，「半阙拉了十年。今夜，多出一个气口。」' },
            { speaker: 'npc', text: '她把膝上的旧谱翻开，下半阙那片洇毛的空白，在灯下朝着你。「师父说，板眼之间的空白是气口。气口——留给自己。」她的指尖落在空白上，停住，「今日我改一个字。这个气口——」她抬眼看你，眼神是温的，温底下压着极深的东西，「留给你。曲成之日，下山之时。你把这个气口听完——下半阙，我才开始写。听不完，」谱合上了，「曲就停在这儿。规矩就这一句。你——答。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「答。气口你留着——我夜夜来听。」', effect: 'vow' },
                { text: '「规矩好。曲你拉，谱你写——日子我慢慢走。」', effect: 'accept' },
                { text: '「成个契而已，你把十年的曲子都停在这儿，至于么。」', effect: 'argue' }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'vow':
                    aff = 6;
                    msg = '她按着谱的手停了半息。半晌，她从袖中取出那块松香，素布解开，在弓毛上擦了三下——擦得极慢，像这三下是擦给谁看的。「夜夜。」两个字她念了一遍。念完，她把那半阙从头拉起——拉到气口处，弓毛悬着，她隔着雨幕望向檐下你的位置，「气口不长。」她说，「长短——够一个人上台阶。」那一夜你上了琴台的台阶。她没有停弓，曲子从气口往下，拉出了一段你从没听过的音——拉得短，收住了，像不敢多拉。收弓前她说了四个字：「明夜，接着。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
                    break;
                case 'accept':
                    aff = 3;
                    msg = '「慢慢走。」她点头，把谱用素布包好，收进谱匣最里层——放得平平的，「曲子不催人。」她把松香取出来，又收回袖中，「夜里的琴台，灯留到你上台阶的时辰。不上——」她望着雨幕，半晌，补了半句，声音很轻，「灯自己灭。灭了，不是熄。是记时辰。时辰记着——我认得。你来，别赖。」';
                    break;
                case 'argue':
                    aff = -17;
                    msg = '她不答。她把旧谱一页一页收进谱匣，收得极慢——像在给曲子收最后一板。谱匣合上，铜扣落下，一声。「至于。」她把这两个字念出来，慢，字字沉进雨声里，「师父说，曲成之日，下山之时。我十年没有拉完——是不想下山。」她把胡琴收进油布，一层，一层，「今日你问我至于。」油布的绳系好了，系得极实。她抱着琴起身，走到台口，停了半息，没有回头，「夜里的曲，从明日起，停。不是收曲——是衡山的雨照落，落它的。曲拉不拉，与它无干了。」她下台后，琴台的灯照旧亮。台角那只蒲团，她收走了。收去了哪里，没有人知道。';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 12);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 桑拾玖：你名下那支签拔了下来，你的消息他不核了 ----
    'gai_event_cold': {
        id: 'gai_event_cold', npcId: 'sect_leader_丐帮', title: '不核了', icon: '🔒',
        desc: '他把你名下那支竹签从墙上拔下来——你的消息，他说从此不核了。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'gai_e_cold_done',
        requireRivalRomance: true, requireEventDone: 'gai_event_probe',
        scenes: [
            { speaker: 'narrator', text: '讯房。你成道侣契的消息，总网上比你开口早了三日——三日前的茶，他已经在案上摆了两只碗。今夜，他从签墙上取下一支竹签，三千七百支，他一取就取到了：签尾刻着你的名字。', type: 'description' },
            { speaker: 'npc', text: '「契的事，恭喜。」他把碗搁下，语气平得像在核签，「这条消息三日到的——来路，城南舵口接力；日子，是你成契那日；口气，是喜信。三条腿齐整，讯房核了三遍。」他把那支竹签搁在案中央，「核完，没有归档。」' },
            { speaker: 'npc', text: '「讯房管天下人的消息。」他的指尖压在那支签上，压得很稳，「独你这一支，今日我从墙上拔下来。规矩立了：往后你的消息，我不收、不核、不入册。」他抬眼，眼里没有笑，「为什么，我说一遍，你听着：核来的消息是档，档是死的。你的——我要活的。活的就是：你的日子分几处、粥喝了谁家的、书听了哪一段，全从你亲口来。你亲口说，我信；你不说，我等。这条规矩——你认不认？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「认。这一支你拔下来，往后我亲自递。」', effect: 'vow' },
                { text: '「规矩好。签你收着——我的话，慢慢递。」', effect: 'accept' },
                { text: '「成个契而已，你拔什么签——讯房还有这个先例？」', effect: 'argue' }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'vow':
                    aff = 6;
                    msg = '他压着签的手松了。他看了你一会儿，忽然从案屉里摸出刻签的小刀——刀柄磨得发亮，递给你：「那你亲手刻第一条。」你接刀。他把灯往你这边挪了挪，看你刻完，拿过签核了一遍——核得极认真，像核天下所有的档。「来路：本人亲口。」他念完批注，把签挂回墙上——没有挂回原处，挂在离案最近的那一排最末。「讯房的墙，挂签讲次序，十二年没破过。」他收刀入屉，声音压低了，「最末那一排——是我抬头就看得见的位置。这个先例，今日有了。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
                    break;
                case 'accept':
                    aff = 3;
                    msg = '「慢慢递。」他点头，把那支签挂回墙上，挂回原处，挂得端端正正，「签归位，规矩归位。」他给你斟茶，斟得满，「讯房不催人——催来的消息，口气那条腿是虚的，核不得。」他端起自己那碗，吹了吹浮叶，「只一样记着：我等。等的时候，粥棚的书照讲。讲到你那一段，我照样跳过——跳的时候，你最好在棚里。不在，跳就是真跳了。」';
                    break;
                case 'argue':
                    aff = -18;
                    msg = '他笑了。笑得跟粥棚说书时一样眉飞色舞——只有眼睛没有笑。「先例。」他把那支竹签从案中央拿回去，捏在手心里，看了一会儿，「十二年，讯房拔过两支签：一支假信，拔了查；一支漏了风，拔了堵。」他顿了顿，「第三支，今日，拔了收。拔了收，没有先例——你问的，是规矩管不管我。」他把签收进怀里，没有挂回墙上，起身拍了拍百衲衣上的灰，「回去吧。讯房今夜早闭堂。粥棚明日的书照旧——只是你那一段，从今日起不讲了。」他吹熄了灯，黑暗里签墙被他的袖口带得沙沙响，「不讲，不是忘。心里的消息，比墙上的全。全到什么地步——你哪天想知道，我背给你听。包括你以为我不知道的那些日子。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 12);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 聂明泽：他给自己开了一卷新档——头一条，记的是你 ----
    'yan_event_cold': {
        id: 'yan_event_cold', npcId: 'sect_leader_阎罗殿', title: '记档', icon: '🗂️',
        desc: '你成契那日，他开了一卷新档——第一条，记的是你的日子。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'yan_e_cold_done',
        requireRivalRomance: true, requireEventDone: 'yan_event_probe',
        scenes: [
            { speaker: 'narrator', text: '档房。你成道侣契那日，阎罗殿的贺礼按例发出去——他经的手，录了，归了，程序一样不缺。今夜，他案上搁着一卷新档：纸是新的，签是空的。他坐在案后，笔山上那支朱笔扣着帽，旁边一管墨笔——蘸好了墨，搁着，等人。', type: 'description' },
            { speaker: 'npc', text: '「契的事，档上有了。」他说，一字一顿，「贺礼是档房代殿里办的。公事。」他的指尖落在那卷新档上，「这一卷——是私事。」' },
            { speaker: 'npc', text: '「记档人，不给自己开档。」他把新档推过来半寸，「规上没有这一条。今日，我违规。」他翻开档，第一页空白，笔搁在你手边。「第一条，我想好了，就这么记：你的日子，分几处——我不问，但我要知道。」他抬眼看你，目光很稳，稳得像在等一枚画押，「第二条，我还没想好。你今日答我：第二条，记谁。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「写。两条我都画押——担着。」', effect: 'vow' },
                { text: '「违规就违规。你记你的，我走我的——日子自己会说清楚。」', effect: 'accept' },
                { text: '「贺礼都按公事办了——你再开一卷私档，至于么。」', effect: 'argue' }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'vow':
                    aff = 6;
                    msg = '他搁着的笔停了停。他看了你三息，把笔递过来——笔杆调了个头，笔尖朝着他自己。「规上，没有外人执笔的先例。」他把档页摊平，镇纸压实，「今日，有第一个。写。」你写下第二条——他俯身逐字核了一遍，核完，在末尾添了两个小字：「可存。」写得极重。「画押，就是担着。」他把档合上，没有归架，搁在案头——搁在离他手最近的那一格。「从今日起，这一卷，我随身。」顿了顿，声音低了半格，「档规说：复核中的卷，搁近手处。这一卷——永久复核。永久，近手。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
                    break;
                case 'accept':
                    aff = 3;
                    msg = '「你记你的，我走我的。」他点点头，把这句话原样写进了第二条，一笔一划。写完念给你核对，念完合上档。「档不催人。」他把它搁进离手最近的那一格，「日子自己会说清楚——说清楚那日，这一卷，结案。」他重新执笔核旧卷，笔尖顿了顿，「结案的时候要知会你。归档，要两个人当面。」极小的一停，「这也是规。今日，我自己定的。」';
                    break;
                case 'argue':
                    aff = -17;
                    msg = '他不辩。他只把那卷新档合上，合得极慢，像怕压皱了那页空白。然后他把档归回架子最底层，归得极实。「至于。」他把这两个字念了一遍，像在核一条被驳回的判语，「十年，我违规两回。头一回，丢了一页档。」他把墨笔洗了，搁回笔山，朱笔的帽按了按，按得严严实实，「第二回，是今日。你替我确定了一件事：这一卷，不开，比开好。」他吹熄了灯。黑暗里卷宗归架的声音，一下，极轻。「档房今夜早闭。那卷档，退回『未开』格。未开的档——」长久的停顿。黑暗里他的声音比平时更平，「不再调出来。这一条，我背得熟。你回吧。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 12);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 耿雪衣：「普通日子」清单当面摊开——有一行，写了又擦 ----
    'xue_event_cold': {
        id: 'xue_event_cold', npcId: 'sect_leader_血手门', title: '清单', icon: '📋',
        desc: '她把那张「普通日子」清单摊给你看——「被人骂晚归」那行，写了又擦。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'xue_e_cold_done',
        requireRivalRomance: true, requireEventDone: 'xue_event_probe',
        scenes: [
            { speaker: 'narrator', text: '药庐。你成道侣契那日，血手门的贺礼是门里按规矩遣人送的——她一整日没有出院子，只在院里翻白药，一匾一匾，翻得极匀。今夜灯下，她从枕头底下取出一张纸，摊平，推到你面前。纸上不是方子：抬头写着「普通日子」三个字，底下一行一行——赶一次集；为菜价和人吵一架；被人骂「怎么这么晚才回来」。', type: 'description' },
            { speaker: 'npc', text: '「写了三年。」她说，语气像念方子，「每一行后头，本来注着小字——跟谁去，跟谁吵，谁骂。」她的指尖落在最末一行，「这一行，『被人骂晚归』，注脚一直空着。昨日，我填了一个字。」顿了顿，「今日，擦了。」' },
            { speaker: 'npc', text: '她抬眼看你，眼睛还是干净的，只是头一回，干净里盛了点撑不住的东西。「骂人的人，得是家里等着的人。这个道理，是门里教我缝针的那个人说的。」她把清单又推近半寸，「你如今成了契。我昨日填的那个字，擦了——擦掉，也还在。今日我只问一句：这一行，往后是空着，还是不空。不空——注脚里，写谁。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「不空。注脚写你——晚归的人，我来当。」', effect: 'vow' },
                { text: '「清单留着。赶集那行，等集日，我来叫你。」', effect: 'accept' },
                { text: '「立个清单等着人骂——你至于么。」', effect: 'argue' }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'vow':
                    aff = 6;
                    msg = '她推清单的手停住了。她看了你很久，然后低头，提笔，蘸墨——写方子的手，稳了三年，今日抖了一回。她在那一行旁边写下自己的名字，一笔一笔，写得极慢，写完，没有擦。她拿药臼压了压灯花，火苗立直了，照着清单上的墨迹干透。「墨干了。」她说，「干了，就擦不掉了。擦，也有痕。」她把清单折成三折，收进灯座底下——不是枕头底下。「地方从今夜起换了。枕头底下是存着，灯底下是过着。」她抬头，耳朵红着，语气平平，「记着：往后你晚归，有人骂。骂得按清单来——一句，都不会少。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
                    break;
                case 'accept':
                    aff = 3;
                    msg = '「留着。」她点点头，把清单按原折痕折好，收回灯座底下，「清单不催人。」她坐回药碾子前，碾盘骨碌、骨碌，「赶集那行，集日我去。为菜价吵架那行，也去。」顿了顿，「被人骂晚归那行——」碾盘的声音很匀，「那一行等不得集日。那是随机的。」她把碾好的药收进纸包，推给你，「白药。不伤风也能用——安神。这一条，方书上没有。是我自己想的。」';
                    break;
                case 'argue':
                    aff = -17;
                    msg = '「至于。」她重复了一遍，点点头，认认真真想了一会儿，然后把清单折成三折，收回枕头底下——收得极实。「三年，这张纸我给两个人看过。」她说，语气还是平的，平到有点空，「头一个，是门里教我缝针的人。她说：雪衣，这不是清单，是方子——治一种叫『活得像个人』的病。」她去翻匾里的白药，背对着你，「今日，你是第二个。你说：至于。」院子里很静，只有她翻药的声音，一匾，又一匾。「方子抓错了，收起来。收起来，不是撕掉——药庐不撕方子。只是，不抓了。」灯花爆了一下，她拿药臼压了压，「回去吧。门口路黑，走稳。这句是按清单来的——惦记人回没回家，也是普通日子。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 11);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 拓银沙：金蝎半夜出窝去「道贺」——她追出去三十里 ----
    'xie_event_cold': {
        id: 'xie_event_cold', npcId: 'sect_leader_飞蝎坞', title: '生意归生意', icon: '🏜️',
        desc: '你成契那夜金蝎半夜出窝，她追了三十里捞回来——今日当面立规矩。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'xie_e_cold_done',
        requireRivalRomance: true, requireEventDone: 'xie_event_probe',
        scenes: [
            { speaker: 'narrator', text: '飞蝎坞，对练场。你成道侣契的消息，比沙暴先一步进坞——大漠里的风声，从来比人快。消息那夜，金蝎半夜出窝，直奔坞门，她骑着巨蝎追出去三十里才捞回来——捞回来的时候，金蝎毫发无损，她一身是沙。今夜，蝎册摊在矮桌上，她盘腿坐在你对面，桌上两碗沙水，一碗满的，一碗空的。', type: 'description' },
            { speaker: 'npc', text: '「契的事，恭喜。」两个字咬得特别脆，像劈竹，说完她灌了口沙水，把空碗啪地扣在桌上，「沙漠的规矩，恭喜要当面——我当面说了。说完，该说我的了。」她指着金蝎，嗓门震得墙上的沙往下掉，「这东西半夜出窝，爬上官道——你猜它去干什么？道贺！」她拍着蝎壳，「贺谁的道、说什么喜，它不会讲人话，我替它讲不了！追回来我骂了它半个时辰，它冲我翘尾钩——三年，它没冲我翘过钩！」' },
            { speaker: 'npc', text: '她忽然把蝎册啪地一合，声音压下来，压得特别低，像沙漠的夜：「听好。我不拦你——拓银沙拦的是蝎，不是人，这句从前算数，如今也算数。」她把那碗满的沙水推到你面前，「可规矩，今日立：你的日子分两处，哪一处都得端平。你欺人，我帮你打；人欺你，我的蝎先认得他。」她抬眼瞪着你，大漠人的眼睛不藏火，只藏直，「哪天你端不平了——回坞来，当面说。说了，什么都好讲。瞒着——」她一脚把凳子踹翻，踹得特别响，「我就把这东西放你窗台上，叫你慢慢尝什么叫瞒！」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「规矩认了。两处日子，我当面端平——端不平，我自己回坞来说。」', effect: 'vow' },
                { text: '「沙水喝了，规矩记了。日子怎么走——你看。」', effect: 'accept' },
                { text: '「成个契，你放蝎子盯我的窗台——坞里的规矩是这么立的？」', effect: 'argue' }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'vow':
                    aff = 6;
                    msg = '她愣了两息，忽然仰头大笑，笑声撞在黄泥墙上弹回来，惊得墙头两只蝎子簌簌溜走：「好！这才是我要的话！」她把沙水给两只碗都满上，端起来跟你一碰，豁口碰豁口，一声脆响，「沙漠里碰了碗，话就算数——不许赖！」她一口喝干，抹了把嘴，翻开蝎册推到你面前——推到某一页，又啪地合上，合得特别快。「这一页标了什么，到时候我亲自给你看。」她把册子收进怀里，耳根有点红，嗓门照旧大，「先记一条：全册我就这一页，翻回头看过。什么意思——你聪明，你自己想！」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
                    break;
                case 'accept':
                    aff = 3;
                    msg = '「你看。」她点点头，一脚把踹翻的凳子勾回原位，坐下，「好。沙漠不认嘴，认脚——走出来的道，才算道。」她把蝎册收进怀里，忽然把金蝎从肩头摘下来，搁在你我之间的矮桌上。金蝎尾钩竖了一竖，又乖乖伏下去。「这东西今夜归你看着。」她说得特别理所当然，「它闻得出你心里打结不打结——打了结，它比我先知道。知道的时候它翘钩。翘了钩，你自己回坞来报。」她给自己倒沙水，喝了半碗，补了一句，声音混在沙风里，「报，不丢人。瞒得连蝎都闻不出来——才丢人。」';
                    break;
                case 'argue':
                    aff = -17;
                    msg = '她的笑停住了。她盯着你看了三息，大漠的风把辫梢的红线吹起来——然后她伸手，把金蝎轻轻放归窝里，放得特别稳，亲手放的。「坞里的规矩。」她重复了一遍，声音忽然不高了。不高，比高吓人。「这东西半夜出窝，我追了三十里——我怕的不是它蜇人。我怕它走丢。」她坐下，把蝎册合上，归架，摆正，「追了三十里，捞回来，我骂了它半个时辰。骂的什么，你想听么？」她拿竹钳拨着窝里的沙，背对着你，「我骂它：傻子，人家的事，轮不着你操心。」竹钳的声音停了半拍，「从今日起，坞里的册子，你的页——生意归生意，茶归茶，水归水。那一页本来要留给你看的半页……」她把竹钳插回沙里，「没有半页。我说错了。」第二日坞里小子们说：幺女昨夜分窝分到天明，分完拿炭笔把册子上的一页擦了，擦得干干净净，擦完对着窝架坐了半个时辰，一句话也没有说。';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 11);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 伏璃茵：为你名下的客名行祈福仪——用错了「照十方」的仪轨 ----
    'lie_event_cold': {
        id: 'lie_event_cold', npcId: 'sect_leader_烈日教', title: '错仪轨', icon: '👑',
        desc: '她为你的名行祈福仪，诵成了高台专用的「照十方」——错了一整个等级。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'lie_e_cold_done',
        requireRivalRomance: true, requireEventDone: 'lie_event_probe',
        scenes: [
            { speaker: 'narrator', text: '圣火龛。你成道侣契那日，喜帖送到烈日教——按仪轨，客名入教，圣女亲行一回祈福仪：圣火龛前，诵「圣火照四方」三遍，祝客尘世顺遂。今夜她行仪，你站在龛侧。诵到第二遍，她的词变了：「圣火照十方。」十方，是高台专用的仪，祈的是教运昌隆——拿它祈一个活人的尘世，错了一整个等级。侍仪的赤袍祭司吓得没敢抬头。她诵完三遍，挥手退了祭司，关了龛门——火前只剩你们两个。', type: 'description' },
            { speaker: 'npc', text: '「我知道我诵错了。」她先开口，圣女腔一句没撑，吐槽火力全开，「照十方、照四方，我诵了八年，何曾错过？今日错在你的名下——你知道为什么吗？」她指着圣火龛，眼睛发亮，「因为我这一颗心，轮到你这一条，仪轨已经管不动了！高台的仪轨自己漏了出来——自己漏的，你懂么？就是说我心里，你早就不在『客』那一栏里了！」' },
            { speaker: 'npc', text: '她忽然收声，深吸一口气，抬手扶冠——这一回没扶正，手停在半空，索性不扶了，冠歪着半分。她再开口，语速慢下来，一字一字搁在实处：「仪轨错了，我明日自去戒堂领罚——罚是我自己的，不欠你。」她看着你，火光里那半分歪着的冠，比端正的时候更像个人，「今日只立一条规矩：往后你的名，我不行客仪了。不行客仪，就是——仪轨的册子上，你不是客。不是客……」龛里的火苗晃了一下，她没躲，「你自己说，在哪一栏。当着火，说。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「我说。仪轨册拿来——我自己写我那一栏。」', effect: 'vow' },
                { text: '「罚你领，栏也挪。日子慢些走——你慢慢挪我。」', effect: 'accept' },
                { text: '「祈福诵错一句词而已——你要去戒堂领罚，至于么。」', effect: 'argue' }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'vow':
                    aff = 6;
                    msg = '她扶冠的手停在半空——她索性把冠摘了，搁在火龛旁边。八年，没人见过圣女当着火摘冠。她取出仪轨册，翻开，把笔递给你，笔杆调了个头：「仪轨是公器，外客执笔——八年没有这个先例。」她的语速很快，字却一个一个稳，「今日有第一个。写。」你在「客」栏外头写下自己的名字，旁边添了一行小注：火边。她俯身看了很久，看完，吐槽没有出来——半晌只说了一句，声音低到最低的一档：「……『火边』。你知道全教离火最近的位置，仪轨里叫什么吗。」她合上册子，耳根红着，嘴又硬回来：「叫圣位。今日这个位置分你一半。高台要是问起——我就说，仪轨革新。革新要罚，罚就罚，反正我已经在领了，不差一回！」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
                    break;
                case 'accept':
                    aff = 3;
                    msg = '「慢慢挪。」她点点头，把冠戴回去——这一回扶正了，扶得一丝不苟，「好。仪轨册不催人。」她给圣火龛添了一勺灯油，动作回到仪轨的拍子上，「戒堂的罚，我领得规规矩矩；栏，我挪得慢慢腾腾。」她关上龛门，隔着火光瞥你一眼，忽然又漏出半句吐槽：「只一样说在前头——火边那半个位置，挪过去就挪不回来了。我们这教的仪轨什么都管，独独这一条……」她转身入殿，声音极轻地飘回来，「独独这一条，没有仪轨。是我自己定的。我自己定的，高台也管不着。」';
                    break;
                case 'argue':
                    aff = -17;
                    msg = '「至于。」她重复了一遍。扶冠的手慢慢放下来——她没有恼，先笑了一下，笑得吐槽都没了火力，肩膀垮了半分：「对。至于。诵错一句仪，戒堂跪一炷香，我熟，跪了八年——」她忽然收声，把冠从头上摘下来，捧在手里，看了很久。「可你知道戒堂的罚录，今日会记哪一条么。」她的声音很平，平得没有一点吐槽，「不会记『失仪』。会记：圣女，为客名一行，用照十方仪。高台的仪，祈了活人——戒堂八年的罚录，没记过这样的行。」她把冠戴回去，戴正，一丝不歪，切回圣女腔，一字一字慢：「此事，到此为止。客，请回。」说完她转身开龛门，门缝里极快地、快得像风说的，塞出来半句吐槽：「……八年头一回为人错词，好，很好，圣火作证，往后你的祈福我全按客仪诵，一个字都不会错——」龛门合上。第二日赤袍祭司说：圣女领罚领得极规矩，领完在圣火龛的风口站了半个时辰，一句话也没说。';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 12);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 檀望舒：你的贺令，她用三口声传——第三口，学的是你 ----
    'long_event_cold': {
        id: 'long_event_cold', npcId: 'sect_leader_天龙教', title: '贺令', icon: '🎭',
        desc: '你成契的贺令她当面传了三遍——第三遍，用的是你的调子。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'long_e_cold_done',
        requireRivalRomance: true, requireEventDone: 'long_event_probe',
        scenes: [
            { speaker: 'narrator', text: '天龙教，外坛廊下。你成道侣契的消息比你先一步到教——贺令按教规传下来，令归传声房传。今夜她当面把这道贺令传给你：先换香主的平板腔：（用香主的调子）「贺客成道侣之契，教中照例送礼。」传完换讲经长老的沙哑老嗓：（用讲经长老的调子）「愿客道侣同心，经年不改。」两口声传完，她停了很久——第三口声，她练了三遍才开口，用的是你的调子：（用你的调子）「檀望舒，我成契了。先告诉你一声。」', type: 'description' },
            { speaker: 'npc', text: '第三口传完，她把笑收了，嗓子干脆，却不如平时亮：「前两口是教规。第三口是我添的——传声房传声，不加字，这一句违规。」她拍拍腰间铜镜牌，「你这句话，我从来没有听你亲口说过——所以只能练。练的时候，我把自己站在听的那一头。」她看着你，廊下的风把牌穗吹起来，「练到第三遍就收住了。收住，不是学不像。是练明白了：这四个字，你说给我和说给别人，是一个调子。」' },
            { speaker: 'npc', text: '她忽然换了把软和嗓子：（用云婆婆的调子）「娃儿，婆婆给你立个规矩。」传完自己切回来，干脆归位，一字一顿：「规矩是我的，不是婆婆的——婆婆的规矩太软，软得能还价。」她把铜镜牌攥在手心，「从今日起，凡你名下的令，我全传——用什么调子传，我定。这一条规矩只管一件事：你的名字进我耳朵，我要验来路。你现在直说——认，还是不认？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「认。往后我的令，只归你传——调子你定。」', effect: 'vow' },
                { text: '「规矩好。令你传，日子我走——走到能传的那日，你自然听见。」', effect: 'accept' },
                { text: '「贺个契而已，添三口声——传声房的规矩，几时这么松了？」', effect: 'argue' }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'vow':
                    aff = 6;
                    msg = '她攥着铜镜牌的手停了。她看了你很久，忽然换了把软和嗓子：（用云婆婆的调子）「娃儿，婆婆等了一辈子一句话——今日看别人等到了。」传完自己摆手，干脆回来，亮得跟平时不一样：「婆婆的话不作数。我自己的那一条——」她把腰间铜镜牌摘下来，攥在手里给你看，牌背刻着一行细痕，刻得浅，分明是后来添的。「传声房的规矩：牌验人。从今日起，这块牌多验一条——你的令，不验门，不验路，闻声即落。」她把牌收回腰间，忽然凑近半步，用你的调子传了一句，学得极像，连气口都在：（用你的调子）「檀望舒，往后我的令，都归你传。」传完自己先笑了，耳根红着：「你看，你的令我替你练像了——下回你亲口说，照抄就是。抄得像，牌认。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
                    break;
                case 'accept':
                    aff = 3;
                    msg = '（用黑袍知客的调子）「客言，闻讫。」她把这三个字传得极标准，传完自己吐了吐舌头：「太标准了，不像我——传声房传令传多了，连我自己都分不清哪一口是我。」她拍拍腰间铜镜牌，干脆回来：「好。令你传，日子你走——走到能传的那日，传声房的耳朵比谁都灵。」她转身进屋，走到门口又回头传了一句，用云婆婆的调子，学得特别软：（用云婆婆的调子）「娃儿，婆婆给你留灯。」传完补了半句自己的：「婆婆不留——我留。灯留不留，不看令。看我。」';
                    break;
                case 'argue':
                    aff = -17;
                    msg = '她的笑停住了。她站在廊下，风把铜镜牌吹得磕在牌套上，一声，又一声。（用护法长老的凶腔）「松？」她把这个字传得极凶，凶完自己切回香主的平板腔：（用香主的调子）「教规：贺令三句，不多不少。」传完她看着你，干脆全收了：「第三口声，你知道是怎么来的么。是练的。你亲口对人说这句话的样子，我没有见过——传声房的耳朵学得了天下所有的调子，独独学不到你对别人说话的那一口。」她把袖中铜镜捏出来，扣在手心，「学不到，只能练。练了三遍，练明白一件事：这四个字，你说给谁，都是一个调子。」她收镜入袖，转身进传声房，门留了一条缝，缝里传出来最后一句，用黑袍知客的调子，平得没有一点温度：（用黑袍知客的调子）「此后客令，传声房照教规传——不加字。」顿了顿，门缝里漏出云婆婆的软声，极轻：（用云婆婆的调子）「……娃儿，婆婆嗓子疼。」第二日云婆婆告诉你：那孩子昨夜没有练任何调子，对着半面残铜镜坐到三更——镜子照半张脸，她看了半宿，末了说了一句：婆婆，我今日不想当任何人。';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 12);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 戚巧机：三年没装壳的机关摆上台面——游隙，她量出来了 ----
    'sj_event_cold': {
        id: 'sj_event_cold', npcId: 'sect_leader_神机门', title: '游隙', icon: '🔩',
        desc: '你成契那夜，她把那台从不给人看的机关上了弦——小齿轮松了，她说游隙大了。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'sj_e_cold_done',
        requireRivalRomance: true, requireEventDone: 'sj_event_probe',
        scenes: [
            { speaker: 'narrator', text: '工坊。你成道侣契那日，神机门的贺礼按例送到——一对黄铜镇纸，她亲手做的，齿数一模一样。今夜她坐在校准台前，面前摆着一台没装壳的机关：铜座上大小两副齿轮咬着，小齿轮有一点松，她拨一拨，晃。机关雀栖在架边，翅翼滴答，拍子不稳。', type: 'description' },
            { speaker: 'npc', text: '「契成了。贺礼是我做的，公事。」她没抬头，指尖压着那枚晃的小齿轮，「这台——私事。上了三年弦，一直没装壳。」她把机关往你那边推了半寸，「齿轮咬合有个说法，叫游隙。齿与齿之间的空。小了咬死，大了——晃，磨，日子久了，散架。」她的指尖在那枚小齿轮上按了按，「你的日子如今咬着两副齿轮。游隙，我量出来了。大了。」' },
            { speaker: 'npc', text: '「这个误差我算不出。重算了十七遍，十七遍不一样。」她终于抬头，眼下的青比上回更深，「所以不算了——改立规矩。从今日起，神机门添一条门规：你的两副齿轮，哪一齿晃了，当面报我。报清楚，游隙我来校；瞒着——」架上机关雀滴答乱了一拍，她不看雀，看你，「瞒着，机器会散。机器散了，这台上了三年弦的东西，我亲手停了发条。你答：这条规矩，认不认？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「认。往后哪一齿晃了，我当面报你——游隙，你校。」', effect: 'vow' },
                { text: '「规矩认下。日子照走——走到要校的那日，我自己来你台前。」', effect: 'accept' },
                { text: '「成个契，你造台机关量我的日子——神机门的算学，管得这么宽？」', effect: 'argue' }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'vow':
                    aff = 6;
                    msg = '她压齿轮的手停住了。她看了你三息，忽然给机关上满弦——滴答，滴答，大齿轮带着小齿轮走，走得匀了。「游隙，校上了。」她说，耳根红着，语气还像报数，「校法在门规里。校法需要两个人在场——缺一个，咬不上。」她从颈间摘下那枚黄铜小齿轮，同齿数的那一枚，摁进你手心，按得极实。「齿数二十七。这一副齿轮从今日起分两处装——你一处，我一处。」她把没装壳的机关往台中正挪了挪，「壳，不装了。装了壳，晃不晃就看不见了。」她顿了顿，声音低了半格，「我要看得见。每一齿，都要。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
                    break;
                case 'accept':
                    aff = 3;
                    msg = '「来。」她点点头，把机关挪回台里侧，却没有收——搁在她一抬手就够得着的地方。「门规不催人。」她拿起校准笔继续手上的活，笔尖顿了顿，「只记一条：游隙我量了，记下了。记的格式是——『存』。」她给机关雀上了半圈弦，雀翅的拍子稳回来，「存着的数，不作废。你几时来校，它几时作数。台前的灯——」她没抬头，「我给它改成常明的了。常明费油。费油这一条，门规里没有，我自拟的。」';
                    break;
                case 'argue':
                    aff = -17;
                    msg = '她不辩。她把那台上了三年弦的机关，慢慢停了发条——停得极轻，像怕弄疼它。然后她取来外壳，一片一片装上。三年没装壳的机关，今夜装了壳。「量误差，是本行。」她合上最后一片壳，扣严，「量你——是我僭越。」她把装好壳的机关收进台底最深处，收完坐回校准台前，背对着你。架上那只机关雀滴答了一夜，拍子全是乱的。第二日工坊里人说：戚师姐昨夜把一台旧机关拆了，拆到最里层的发条，又一齿一齿装回去。装回去还能走，走得分毫不差。她对着那台机器坐到天亮，末了说了四个字，声音很轻——「算不出了。」这一回，连「算不出」都算不出了。';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 12);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 雷惊蛰：批注新起一页——「是日，贺礼出库。硝，足。人，不足。」 ----
    'pi_event_cold': {
        id: 'pi_event_cold', npcId: 'sect_leader_霹雳堂', title: '批注新页', icon: '📖',
        desc: '你成契那日他在方子册新起一页批注——「人，不足」三个字，写得比硝磺都轻。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'pi_e_cold_done',
        requireRivalRomance: true, requireEventDone: 'pi_event_probe',
        scenes: [
            { speaker: 'narrator', text: '霹雳堂防火棚。你成道侣契那日，堂里的贺礼是一箱「满堂红」爆竹——他经手出库，录了账，写了回执，一笔不缺。今夜棚里灯下，他在绑引信，手边的方子册摊开着，批注栏新起了一页，蝇头小字记着流水：「是日，贺礼出库。硝，足。人，不足。」他见你看，捻引信的手没有停——只是那根引信，剪得比平日又短了一截。', type: 'description' },
            { speaker: 'npc', text: '「……贺礼，公事。」他说得极轻，你俯身才听见。他把那根短引信搁下，搁得极轻，补了一句：「……我说了。我真的说了。」他把册子翻过来，批注页朝你：「『人，不足』三个字，午时写的。写的时候想清楚了一件事——写下来，就算说过了。」他的指尖压在那三个字上，压得极轻，像怕把它们压死。' },
            { speaker: 'npc', text: '他合上册子，从案头取过一页新纸，钉进批注栏，推到你手边——批注的位置，空着。「……规矩，今日立。」他的话一句比一句轻，轻到最后你要凑到他唇边才听得清，「这一页，专记你的日子。你来一日，记一日；你不来，也记。批注不出册——」他抬眼看你，眼睛很静，静底下压着一样烧了多年的东西，「册子记厚了你还不来，我就把批注入火药的方子。入了方子——」他顿了顿，把此生最要紧的半句话说出来，比硝磺落地还轻，「就是放。不冲人。冲天。无声的烟花，我练了三年，攒着的。攒给哪一夜，你知道。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「知道。那一夜的烟花，放给我看。往后批注你写，我对。」', effect: 'vow' },
                { text: '「册子你记。日子我走——走到批注那日，我自己回来对。」', effect: 'accept' },
                { text: '「成个契，你在方子册里记酸话——霹雳堂的火药，几时掺过这些？」', effect: 'argue' }
            ]}
        ],
        effects: function(npc, choice) {
            var pg = (typeof window !== 'undefined' && window.currentCharData && window.currentCharData.gender === 'female') ? '她' : '他';
            var aff = 0, msg = '';
            switch (choice) {
                case 'vow':
                    aff = 6;
                    msg = '他捻引信的手停住了。他静了很久，然后提笔蘸墨，在新批注页写下头一行，一笔一划，轻得像落灰：「是夜，' + pg + '在。硝，干。」写完他把这一页撕下来，折成三折，塞进你手里，塞得极实。「……收着。」他顿了顿，照例补，「……我说了。我真的说了。」他耳根红透，手回到引信上——这一根绑得特别慢，特别结实。「无声烟花的方子，我抄在批注背面了。哪一夜到了——你点火。」他低着头，声音轻到灯花底下，「点火的人，得是批注里的人。这一条，霹雳堂没有。」他停了停，「我现拟的。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
                    break;
                case 'accept':
                    aff = 3;
                    msg = '他点点头，把册子合上，归案。「……册子不催人。」说完自觉声音太轻，又凑近你耳边补了一遍，气息扫过你的耳廓：「我说了。册子不催人。我真的说了。」他重新拿起引信，绑了几根，忽然停手——把那根剪短的引信挑出来，重新量，重新剪，剪长了，又续上一截慢捻的芯子，捻得极匀。「……长引，烧得慢。」他不抬头，「烧得慢，等的人不急。这个道理，方子里有。我查到了——查到第三夜才敢信。」他把盘好的长引信收进防火布囊，布囊搁在你手边，没有推，也没有收回去。';
                    break;
                case 'argue':
                    aff = -17;
                    msg = '他的手停住了。他看了你两息，极轻地说了一个字：「……掺。」说完他把方子册合上，把新钉的那页批注连同「人，不足」那一页，一起裁了下来——裁得极齐。他没有烧，折成四折，压进防火布囊最底层，囊口系死。「……火药不掺了。」他的声音轻得像灰，「批注栏，从今日起只记硝磺。硝不潮，硫不潮，册子干净。」他吹熄了灯。黑暗里你听见他把册子归架，极轻，极正；引信盒的盖子扣上，咔的一声，是他今夜最响的一句话。你走到棚口，背后极轻地飘来半句，轻得你几乎以为是夜风：「……人受潮。这一条，裁了。裁了，也还在囊里。囊不烧——霹雳堂的东西，烧之前，都要先想清楚烧给谁看。」第二日堂里人说：昨夜三更，训练场响过一声没有声音的东西——天上开了一圈光，光落了，四下里没有一个人听见。无声的烟花，三年只练成过七回。这一回，没有观众。';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 12);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 宓书言：第十日，重讎那条「存疑」——批语破了四字 ----
    'shu_event_cold': {
        id: 'shu_event_cold', npcId: 'sect_leader_天书阁', title: '破例七字', icon: '📜',
        desc: '他重讎那条「存疑」，批语从不超四字的人——破例写了七个字。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'shu_e_cold_done',
        requireRivalRomance: true, requireEventDone: 'shu_event_probe',
        scenes: [
            { speaker: 'narrator', text: '天书阁校讎房。你成道侣契那日，阁里的贺礼是一函新装的书，装函是他亲手做的，针脚齐得像刻版。今夜案上摊着那一卷——正是页角戳破的那页：批注「讹」划掉，「存疑」两个字还在，破口补过了，补痕细看才见。他坐在案后，校讎剑横在膝上，灯花剪过两回——分明等了很久。', type: 'description' },
            { speaker: 'npc', text: '「契成了。」他先开口，四个字，又四个字，「贺礼，发讫。」他把那卷推过来半寸，指尖点着补过的页角：「这一页，挂了十日。校讎规矩：存疑之条，十日一重讎。」他看着你，「今日，第十日。」' },
            { speaker: 'npc', text: '他提笔蘸墨，笔悬在批注栏上。「重讎的结论，两条路。一，维持存疑。二，改批。」他顿了顿，执笔的手稳了十年，笔尖却微微一颤，「批语从不超四字。这是我给自己立的规。」他抬眼，「今夜，破例一回。」笔落下去，在「存疑」旁边添了一行小字，一笔一划：「疑在己。不在人。」七个字。写完他搁笔，把卷推到你面前：「读。读完你定：这一页——结卷，还是重讎。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「重讎。你疑你自己——那我给你作证。往后每十日，我来赴一讎。」', effect: 'vow' },
                { text: '「结卷。存疑便存疑——疑挂在页上，人过日子。」', effect: 'accept' },
                { text: '「成个契，你还在讎这一页——天书阁的校讎，也太闲了。」', effect: 'argue' }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'vow':
                    aff = 6;
                    msg = '他执笔的手停住了。他看了你很久，忽然翻开新的一页，提笔写四个字：「每旬一讎。」写完又批了一行更小的：「讎者二人。」他把校讎剑归背，动作很慢，很轻。「讎书，一个人。」他说，「讎日子——」他顿了顿，又破了一回例，这一回五个字，「两个人。」他把那页戳破过的页角连同新批，一并裁下来，折好，塞进你手里。「页出卷，无先例。今日有。」他耳根红着，话照旧短，「你收着。收得住的日子，『讹』字不成立。收不住——」他背过身去剪灯花，声音低半格，「收不住，你拿回来。我重补。补页的手，只在你这儿抖。抖，认。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
                    break;
                case 'accept':
                    aff = 3;
                    msg = '「结。」他点点头，合卷，「疑，留页上。」他把卷归架——破页的页角朝外，没有藏。「天书阁不销字。」他坐回案前，接着校旧卷，笔笔极稳，「人过日子，页存疑。疑解那日——」笔尖顿了半拍，「你自己来改批。改，我认。不改——」他剪了一下灯花，「也认。」极小的一停，「认和认，不一样。这一条的区别，批注写不清。你慢慢校。」';
                    break;
                case 'argue':
                    aff = -17;
                    msg = '他执笔的手停住了。他看了你两息，搁笔，收剑，动作一样一样极准，准得像刻版。「闲。」他重复了一遍，点点头，「对。」他把那卷合上，归到架顶——校讎房最高一格，十年不动的那一格。「你的条，结卷。」他坐回案前，背对着你，「结卷，不重讎。校讎规矩：结卷之条，不再看。」灯花爆了一声，他没有剪。你转身要走，他在背后添了四个字，轻得像批注：「存疑，不改。」第二日天书阁的书记说：校讎先生昨夜校了一卷新书——新装的、页页空白的书。空卷不用校。他校了一夜，天亮在封皮上写了两个字，又划掉。划掉的两个字，书记没看清，只看清划的时候，笔尖又把纸戳破了。十年不破页的手，两夜，破了两次。';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 12);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 隗九爻：三串糖葫芦插在台阶缝里——一卦没吃，立的是「莫尽」的规矩 ----
    'dy_event_cold': {
        id: 'dy_event_cold', npcId: 'sect_leader_大隐阁', title: '立签', icon: '🍢',
        desc: '你成契那日他备了三串糖葫芦，一串没吃——签子立着，规矩也立着。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'dy_e_cold_done',
        requireRivalRomance: true, requireEventDone: 'dy_event_probe',
        scenes: [
            { speaker: 'narrator', text: '大隐阁前台阶。你成道侣契那日，大隐阁随的贺礼是三串糖葫芦——阁里人都说隗先生大方，三串，够起九卦。今夜他蹲在台阶上，三串糖葫芦原封插在他身边的台阶缝里，一串没动。见你来，他抬头看看你，又看看糖葫芦，忽然咧嘴：「来得正好。这一卦，我一个人起不了。」', type: 'description' },
            { speaker: 'npc', text: '他拔出一串，横在膝上，没数：「头一卦，问你的契。剩四颗——诸事宜静。」不吃。「第二卦，问我的卦。」他数了数，「剩一颗，大凶。」还是不吃。他把第三串拿起来给你看——签头那颗风干山楂，干得发皱：「第三卦，我没敢起。」他把三串并排插回台阶缝里，插得端端正正，「二十年数签，头一回把卦立着不吃。」' },
            { speaker: 'npc', text: '「知道为什么？」他拍拍手蹲好，半仙腔端起来，端得前所未有地正，「卦辞『莫尽』。糖葫芦吃尽，卦就死了；留在签上，卦还活着——活卦才等得来下文。」他拍拍那三串立着的签，「今日你的契成了，是大喜。大喜的卦，不敢尽——尽了就没了。」他忽然正经起来，正经得完全不像他：「所以今日立个规矩：你的两处日子，留一处给我起卦。卦起几回，山楂吃几颗，最后一颗，永远留在签上。你答——这规矩，吉，还是凶？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「吉。往后我的卦你起——签头那颗，你我各分一半。」', effect: 'vow' },
                { text: '「规矩你立。日子我走——走到卦上，我买新签还你。」', effect: 'accept' },
                { text: '「成个契，你蹲台阶吃糖葫芦立规矩——大隐阁的半仙，也太不讲究。」', effect: 'argue' }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'vow':
                    aff = 6;
                    msg = '他拍手的手停在半空。他愣了两息，忽然大笑，把三串糖葫芦从台阶缝里全拔出来，举得高高：「各分一半！卦辞里没有这一条——今日有了！」他挑出签头那颗风干山楂，掰成两半，大的那半摁进你手里，小的那半搁进自己嘴里，嚼得极认真，极慢。「签头那颗，二十年没吃过。今日吃了半颗。」他咽下去，指着你手里那半颗，「另半颗的意思，你猜。」你说猜不着。他蹲回去，满意得像个赢了卦的：「猜不着，好。猜不着，就是还有下文——莫尽。」他把剩下两串重新插回台阶缝，插给你看，「这两串立着，是活卦。活卦的下文，明日起，一日一颗，你陪我对数。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
                    break;
                case 'accept':
                    aff = 3;
                    msg = '「新签。」他点点头，点得极认真，「好兆头。肯买签，就是有下一卦。」他把三串拔回来，就着台阶开吃，一颗一卦，吃得极香——吃到最末一串的签头，停住了。那颗风干山楂他没有吃，用蜡纸包了，收进怀里，收得极妥帖。「这一颗存着。」他拍拍怀，干饭腔里漏出半句半仙腔，「存给一个日子。到了那个日子，卦辞要改。」改什么，他不说。他起身拍拍衣摆，走了两级台阶又回头，补了半句，声音难得正经：「莫尽。这两个字你收好。你的日子走到走不动的那一日——来台阶上，卦和糖葫芦，都现成。」';
                    break;
                case 'argue':
                    aff = -17;
                    msg = '他的笑停住了。他蹲在台阶上看了你很久，然后慢慢把三串糖葫芦收进蜡纸，一串一串，包得整整齐齐——包好，收进怀里，收得极深。「不讲究。」他重复了一遍，忽然不端半仙腔，也不混干饭腔，说得特别平，平得发空，「大隐阁的仙，吃人间这一口糖——我娘说，肯吃不算俗，不知道分给谁吃，才算。」他起身，拎起空竹签，回阁去了。当夜阁里人看见他在灯下起卦，一连三卦，卦卦大凶。他盯着三根凶签看了半晌，忽然自嘲地笑了一声，吹了灯。第二日台阶上多了一根新糖葫芦签，插在缝里——山楂吃光了，独签头那颗风干的留着。插签的人没留名。可大隐阁的规矩人人都懂：起完卦留着签头那颗，是卦死了、人还留着一口气的意思。';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 12);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 简知忆：为你立了「正档」——附页从此不销毁 ----
    'yin_event_cold': {
        id: 'yin_event_cold', npcId: 'sect_leader_侠隐阁', title: '正档', icon: '📁',
        desc: '你成契那日他开了你的正档——附页第一行：危险程度：想一直说话。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'yin_e_cold_done',
        requireRivalRomance: true, requireEventDone: 'yin_event_probe',
        scenes: [
            { speaker: 'narrator', text: '侠隐阁档廊。你成道侣契那日，侠隐阁的贺仪按档规发讫——他录了，归了，批了「已讫」二字。今夜他案上摊着一卷新档，封皮上写着你的名字。档廊的规矩：正档才上封皮，附页从不上名。他见你进来，先把另一卷封皮空白的合上，压到案底，再翻开你名下这一卷：「正档。今日立的。」', type: 'description' },
            { speaker: 'npc', text: '「档规卷一：正档只为两种人开。」他用批注腔说话，又快又平，「一，大险。二——」他翻到附页第一页，推到你面前，「许过心的。」附页第一页只有一行字，写得极小，极密，像怕纸不够用：「危险程度：想一直说话。」' },
            { speaker: 'npc', text: '「这一条，从前要销毁。附页超三页即销毁——我立的规。」他的指尖压着那行字，「从今日起不销毁了。规改了。档廊的规，我立，我改。」他看着你，批注腔没有垮，垮的是尾音那一点平，「只一个条件：正档每年重勘一回。重勘要本人在场。人不到——」他合上卷，合得极轻，「档就死了。死档入地库。侠隐阁的地库，三百年没有见过天光。」他把卷宗往你那边推回半寸：「你答：每年重勘——到，还是不到。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「到。年年重勘，当面核——附页你写，我念。」', effect: 'vow' },
                { text: '「档你建，日子我走——走到重勘的日子，我自然到。」', effect: 'accept' },
                { text: '「成个契，你给我立正档——侠隐阁的档，几时管到人许心了？」', effect: 'argue' }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'vow':
                    aff = 6;
                    msg = '他压附页的手停住了。他静了两息，取笔，在附页末尾添了一行小字：「重勘：岁一，二人在场。」写完他把这页附页起下来，钉进你手里那卷，钉得极慢——像在钉一册比档更厚的东西。「附页出档，档廊三百年没有先例。」他收笔，耳根有点红，批注腔端不住，漏出半句不像批注的话，「今日有了。这一页你收着。你收着，就算在场。」他顿了顿，目光扫过档廊最顶那一格——三间屋子，独那一格空着，「档廊的人，天下谁都建了档。我自己那页——空白三年。你问我为什么空白。建档的人，不给自己建档，这是规。」他合上你的正档，归进近手那一格，「今日，我想再破一条规。破哪条——明年重勘那日，你来了，我念给你听。附页，我写好了。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
                    break;
                case 'accept':
                    aff = 3;
                    msg = '他点点头，在附页上录了一行：「存疑，不究。」录完用档腔认真解释：「这不是敷衍。是档语——存疑不究，就是：疑问留在页上，人不追。你哪日来重勘，疑哪日自销。」他把正档归进近手的那一格——离他手最近的架子。「档廊规矩：正档存近手。」他回身去理旧档，理着理着，忽然没头没尾添了一句，没有回头：「近手三百年，存过两卷。另一卷——封皮空白。不要问。问，就超三页了。」';
                    break;
                case 'argue':
                    aff = -17;
                    msg = '他静了。这是你认识他以来，批注腔的人头一回静——静比说吓人。他慢慢合上那卷新档，把附页第一页也合进去，把那行「危险程度：想一直说话」一并合上了。「几时管到。」他重复你的话，语气极平，「对。档廊不管人心。」他把正档归架——不是近手那一格，是最顶那一格，最高的、十年不动的那一层。「从今日起，你的档：不勘，不注，不销毁。」他坐回案后，取过一卷旧档，「不销毁，就是留着。留着，不再翻开。」灯花爆了一声。你转身要走，他在背后用批注腔添了最后一条，平得像刻上去的：「销档，要二人在场。缺一人——永结。」当夜档廊的灯亮到天明。书记说：简先生那夜把自己那卷空白档取下来了，对着灯坐到五更，一个字没有录。归格的时候，他在封皮上写了两个字——「已结」。第二日，又划了。划完，还是没有写别的。';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 12);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 狄长亭：贺文的留底上有一行颤笔——「建议滞留数日」 ----
    'ty_event_cold': {
        id: 'ty_event_cold', npcId: 'sect_leader_天涯海阁', title: '归期栏', icon: '🧭',
        desc: '他往站册添了一栏，栏名「归期」——旁的栏可以空，这一栏要你填。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'ty_e_cold_done',
        requireRivalRomance: true, requireEventDone: 'ty_event_probe',
        scenes: [
            { speaker: 'narrator', text: '天涯海阁驿亭。你成道侣契那日，贺文出自他手——公文笔，端楷齐整，当日发讫。今夜驿亭案上，他在装订一沓旧路引，全是过期的。你来，他起身相迎，躬身半度，话像又一次送你出门：「前路有利，恭喜。」贺完，他站着，没有让座——他的每一句话都像为送客备的，不为留人备。', type: 'description' },
            { speaker: 'npc', text: '他坐回去，取出一份文书的留底，摊平——是那日贺文的底稿。端楷的公文写到末行，添了一行小字，笔锋发颤，颤得不像同一只手：「建议滞留数日。」「这一行，不在发文里。」他指给你看，语气平得像念站名，「发讫的文书不追回。追回，犯规。」他的指尖在那行颤字上描了一遍，描得极慢，「违了。今日认。」' },
            { speaker: 'npc', text: '他合上留底，取过一张空白路引，展开，推到你手边，指着站名栏：「从今日起立一条规矩——驿亭的规矩，我立。你名下的路引，往后由我发。站名我核，一站一站，数清楚。」他的指尖移到站名栏之下，停在一条空行上，「站册添一栏。栏名——归期。」他抬眼看你，眼睛很静，静得像目送你走完千里：「旁的栏可以空。归期这一栏，你填。填不填，怎么填——」他顿了顿，躬身半度，公文腔，可末一个字又透出那点颤，「前路不利。不利之处，有人等。此句不入公文，此句是我自己的。你答：这一栏，填不填？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「填。往后每张引的归期栏，我自己填——填了，就照着回来。」', effect: 'vow' },
                { text: '「引你发。归期我记在心里——记在心里的，比纸上的牢。」', effect: 'accept' },
                { text: '「成个契，你添一栏拴我——天涯海阁的驿站，几时管起人的归期了？」', effect: 'argue' }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'vow':
                    aff = 6;
                    msg = '他推引的手停住了。他看了你三息，忽然起身，走到驿案最里层的架子前，取下一枚铜符——半枚，断口磨得温润，系着褪色的绦。「驿站铜符，断而为二：一半存亭，一半随行人。」他把那半枚摁进你掌心，摁得极实，手有一点点抖，话却还是公文腔，「存亭的那一半——今日寄存到你名下。两半，你都拿着。」他坐回来，展开那张空白引，提笔在归期栏里落下头一批。不是日子，是四个字：「人在，即归。」写完他端详那四个字，低低说了一句：「又颤了。」这一回他没有藏，让你看足了：「颤笔，驿站视为废字。我视为——心口出来的字。心口出来的，写不端正。」他把引纸吹干，双手奉上，像奉一道从此生效的公文。';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
                    break;
                case 'accept':
                    aff = 3;
                    msg = '「在心里。」他重复了一遍，点点头，把那张空白引折好，收进案头最前面的一格——最顺手的那一格。「驿站不强人所写。」他重新去绑旧路引，动作极轻，「只是归期这一栏，从今日起我替你记。」你问怎么记。他不抬头：「你来一回，记一回。你不来——写『候』。」他顿了顿，把「候」字写得端端正正，给你看，「候字，站册原无此格。我自拟了一格。自拟，就是：这个字在册上，从此有名有分。」他把笔搁正，补了一句，声音低下去半格，「前路不利的时候，驿站替人候着。这一条也不在公文里。这一条——驿亭里只有我知道。如今，两个。」';
                    break;
                case 'argue':
                    aff = -17;
                    msg = '他躬身的手停在半空。他慢慢直起身，公文腔一丝不乱，字却一个字比一个字冷：「拴。这个字，驿站收下了。」他把那张空白引收起来，对折，再对折，压进案屉最底层，锁上——钥匙收进袖中，收得极深。「从今日起，你的路引照成例发：站名准到站，一站不多。」他把「一站不多」四个字说得极清楚，像报数。「多算三站那一条，作废。作废，就是官册无名。册上无名——」他起身剪灯花，背对着你，声音终于低了半格，那点颤透出来，「那三日，就是我数错了。数错，不是想你。」当夜驿亭的灯亮到五更。老驿丞说：长亭那夜抄路引，抄了三十张，张张站名分毫不差；抄到最末一张，忽然停了笔——那张引上的站名，是你从来没有去过的地方。他盯着看了半晌，把它整张裁了，裁下来的纸压进砚台底下，压得平平整整。压完他对着砚台说了一句话，很轻，老驿丞只听清了三个字：「……误三站。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 12);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 樊惊筹：37 针后头续了第 38 针——空针，等一个字 ----
    'dq_event_cold': {
        id: 'dq_event_cold', npcId: 'sect_leader_大旗门', title: '空针', icon: '🪖',
        desc: '你成契那夜他把护腕续了一针——第 38 针只穿了针眼，没有走线。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'dq_e_cold_done',
        requireRivalRomance: true, requireEventDone: 'dq_event_probe',
        scenes: [
            { speaker: 'narrator', text: '大旗门校场帐。你成道侣契那日，大旗门的贺礼是一面红战旗——他亲手缝的，旗面四个字，每个字九针暗针，全营说樊都尉这四个字费的心比旗多。今夜他坐在帐里，面前是你那只护腕。你进来，他不抬头，针不停：「坐。」', type: 'description' },
            { speaker: 'npc', text: '他缝完最后一针，咬线，把护腕丢给你——丢得很准。「验。」你翻过来：37 针加固针都在，后头却续了一针——第 38 针只穿了针眼，线没有走，空着。「空针。」他拿起铁皮针线盒，打开，盒里的针码一排一排，粗细长短，每排都有数。「一针一字。37 针，一句话。」他指指那枚空针眼，「第 38 针，字没想好。空着。」' },
            { speaker: 'npc', text: '他合上针线盒，军中腔，一句是一句：「今日立规。军规。」他看着你，背挺得像旗杆，「你的日子两营。哪一营塌了，报我——报，不算逃；瞒，才算。」他把铁皮针线盒推到你手边，「盒子你带着。粗针缝旗，细针缝衣，最长那根——」他顿了顿，声音低半格，「最长那根缝暗针。暗针拆了，只有它能原样走回去。」他站起身，「第 38 针那个字，你定。定了，报我，我走线。你答：认不认。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「认。第 38 针今日就定——缝个『等』字。」', effect: 'vow' },
                { text: '「盒子你留着。日子我走——走到要缝的那天，我自己回帐。」', effect: 'accept' },
                { text: '「成个契，你拿军规管我——大旗门的旗，几时管到人的营了？」', effect: 'argue' }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'vow':
                    aff = 6;
                    msg = '他愣了一息——校场上十年不眨眼的猛将，愣了一息。然后他坐下，开铁皮盒，取最长那根针，穿线，动作一样一样极稳，稳得像在缝旗。「等。」他重复了一遍，落针，走暗线——这一针走得极慢，极密。走完咬线，他把护腕举到灯前看了很久。「38 针，一句话。」他把护腕摁进你手里，摁得极实，「这句话是：我等你报。」他合上铁皮盒，塞进你的行囊，塞得极深、极正：「盒子归你。军规——针线盒在哪儿，人在哪儿。人在哪儿，」他吹熄了灯，黑暗里声音又短又低，「我都找得着。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
                    break;
                case 'accept':
                    aff = 3;
                    msg = '「回来。」他点点头，把铁皮盒收回原处——却把最长那根针单独取出来，用油纸包了，递给你。「针随身。」军中腔，「暗针拆了，先穿这根。缝不上——」他顿了顿，「回帐。」他继续缝旗，锤帐篷钉的声音一下一下。你起身要走，他在背后补了一句，最短：「别掉队。」隔了一息，又一句，更轻：「掉了，我去捡。」';
                    break;
                case 'argue':
                    aff = -17;
                    msg = '他合盒的手停住了。他看了你两息，忽然把铁皮针线盒重新打开——把最长那根针取出来，归回原排，合盖，把盒子归到帐角最深处，压上两捆旗布。「旗不管人。」他说，军中腔平得像旗布，「对。旗只管方向。」他拿起护腕，把那枚空针拆了——拆掉，重新缝死，缝得严严实实。「空针，收了。」他把护腕丢还给你，丢得还是很准，「收了，就是字不想了。不想，省针，省线。」当夜校场的灯亮到三更。守夜的兵说：都尉那夜在灯下缝旗，缝了拆，拆了缝——「百年好合」四个字，拆了个干净。天亮前又缝回去。缝回去的字，针码比原先密一倍。他对着旗坐到天亮，末了说了一句话，对着旗说的，很轻：「跟上。」没有人应他。';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 12);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 裘霜莺：第八支素坯哨出窑没裂——哨语册改了一条 ----
    'tz_event_cold': {
        id: 'tz_event_cold', npcId: 'sect_leader_铁掌帮', title: '像人声的哨', icon: '🔥',
        desc: '像人声的哨烧成了——「两声低回」那一条，她改了章程。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'tz_e_cold_done',
        requireRivalRomance: true, requireEventDone: 'tz_event_probe',
        scenes: [
            { speaker: 'narrator', text: '铁掌帮后山窑口。你成道侣契那日，帮里的贺礼是十挂爆竹，全帮替你热闹——她没跟着热闹，蹲在窑前烧哨。今夜窑火将熄，第八支素坯哨出窑：没裂。她捧着哨对灯看，看了半天，见你过来，凶脸先上：「看什么看！过来！」', type: 'description' },
            { speaker: 'npc', text: '她把新哨塞进你手里——哨身还温着，泥色素净，哨口磨得极滑。「像人声的哨，烧成了。」她压着嗓子，压不住嘴角，「烧了八支，裂了七支。这支——你吹。」你吹了一声：两声低回。音闷，落地又弹起来，真像有人在很远的地方喊你。她听着，忽然把哨抢回去，自己吹了一遍——也是两声低回，可她吹的这两声慢，第二声更低，低得像在等人应。' },
            { speaker: 'npc', text: '「一样的哨语。」她瞪你，「味儿不一样。知道差在哪儿？」你摇头。她把哨塞回你手里，凶脸绷不住，耳根先红：「你吹，是吹了。我吹——」她攥了攥拳，掌心那支素坯攥出了汗印子，「是等应。」她站起来，朝窑火走了两步，背对你：「今日改章程。哨语册子，别的条都不动：一长一短是『你来了』，三短促是『过来』。独一条改：两声低回，从『没事，就是想吹一下』——改成『只吹给一个人』。」她回过头，窑火映着半张脸，凶得发亮：「那个人是你。你答：这哨要是别人也吹给你听——你理不理？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「理。你的哨语我全记下了——往后只应你的哨。」', effect: 'vow' },
                { text: '「哨我收着。想听了，我自己上苇滩找你——你吹，我应。」', effect: 'accept' },
                { text: '「成个契，你把哨语册都改了——铁掌帮的哨，也太小题大做。」', effect: 'argue' }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'vow':
                    aff = 6;
                    msg = '她攥哨的手忽然松了。她愣了两息，凶脸彻底绷不住，转身朝着窑火——转得太急，辫梢扫着窑沿，她不管：「全记下了？」她回过头，把哨举到唇边，当场吹了一声——一长一短。吹完瞪你：「这是什么？」你说：你来了。她点头，再吹——三短促。你说：过来。她吹第三声，两声低回，吹完不问，直接把哨塞进你怀里，塞得极深，声音压到不能再压：「这一声，你应。」你说：只吹给一个人。窑火噼啪。她忽然笑了，笑得又凶又亮，像是要哭，抬脚把窑门踹上：「章程定了！」她的声音从窑门后头弹出来，还是凶的，凶得发颤，「从今日起这支哨不外传——你想听，就对着苇滩吹。滩听得见，我听得见。两声低回，我半夜也起。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
                    break;
                case 'accept':
                    aff = 3;
                    msg = '「我吹。」她重复了一遍，把素坯哨往你手里一按，按着你的手指合拢，合得极实。「好。苇滩天不亮最好——鸟不吵人。」她蹲回去收拾窑口，收了两下，忽然又从坯堆里摸出一支没烧的哨坯，举给你看：「第九支，坯我起好了。这支不烧像人声的。」她把坯放回堆子正中，放得极认真，「这支烧出来——要像两个人的声。烧法我还没想好。想好了，」她抬眼，凶脸，话不凶，「你陪我守窑。守窑的规矩：一夜不许睡。睡了的，罚吹哨给我听。」';
                    break;
                case 'argue':
                    aff = -17;
                    msg = '她塞哨的手停住了。她看了你两息，凶脸慢慢冷下来——冷下来比凶起来更凶。「小题大做。」她重复了一遍，把哨从你怀里拿了回来，攥进掌心。「七支裂的，第八支没裂的——你叫它小题大做。」她转身蹲到窑前，开了窑门，把这支没裂的哨放回窑膛最深处。「章程收回。哨语册照旧：两声低回，『没事，就是想吹一下』。」她关上窑门，声音平平的，「没事，就是谁吹都一样。谁吹都一样，就是——」窑火噼啪响了一声，她没说完，起身拍拍手，从你身边走出窑棚，辫梢扫过你的肩，扫得极轻。那一夜苇滩没有哨声。第二夜也没有。帮里人说：堂主三日没吹哨。三日里她把那支素坯攥在手里，攥出汗，汗印子干了又攥出来。第四日晨练，有人听见后山方向极轻地响了两声，低的，回的——吹到一半，断了。那不是哨语。哨语册上没有这一条：吹一半的。';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 12);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 姬云锦：古礼三条，她为你破了头一条——今夜立第三条 ----
    'kl_event_cold': {
        id: 'kl_event_cold', npcId: 'sect_leader_昆仑派', title: '问名', icon: '🗡️',
        desc: '她为你破了「不舞于生人」，今夜又立一条：看舞的，报名。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'kl_e_cold_done',
        requireRivalRomance: true, requireEventDone: 'kl_event_probe',
        scenes: [
            { speaker: 'narrator', text: '昆仑派晨课场。你成道侣契那日，晨课她舞了十二套，舞到日头把身上的雪都晒化了。今夜她在场心，素绸舞袖带解下来搭在臂弯——带子叫汗浸透了，绑了一整日。剑还在手里，人立在雪光里，分明是在等你。', type: 'description' },
            { speaker: 'npc', text: '「契，成了。」她说三个字，第四个字卡在喉间——「贺」字到了嘴边，咽了。她抬剑，剑尖点着雪地：「今日晨课，十二套。迎雪、问松、送鸿，各舞三遍。」她看着你，「剑客的舞，一名一人。迎雪迎的是师门，问松问的是故友，送鸿送的是同路。」剑尖在雪里划了一道，划得很浅，「三套舞，都是你的名字起的头。你的名字，配哪一套——想不出来。」' },
            { speaker: 'npc', text: '「想不出来，今夜就站在这儿想。」她收剑，把素绸带从臂弯拿起来，攥在掌心，「昆仑古礼两条。一，不舞于生人——为你，破了。」她把带子攥紧了些，「二，舞名不重——一个舞名，一生只许一个人。」她抬眼，雪光落在脸上，「从今日起添第三条：我的舞，谁看，谁报名。报了名，我舞；不报——」她顿了顿，声音低下去，低得像雪落，「我就问。剑先问，人后问。你答：这一条，接不接？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「接。往后谁来听舞都报名——头一个名，每日我来报。」', effect: 'vow' },
                { text: '「条子认下。日子我走——走到晨课的时辰，我自到雪坎报名。」', effect: 'accept' },
                { text: '「成个契，你拿舞规拴我——昆仑的剑，几时管到看舞的人了？」', effect: 'argue' }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'vow':
                    aff = 6;
                    msg = '她攥带子的手停住了。她看了你很久——十年晨课不眨眼的人，今夜眨了一回。「头一个名。」她重复了一遍，忽然转身拔剑，就地下了一式。只一式，没有名目，不是迎雪不是问松不是送鸿，剑尖挑起一蓬雪，雪跟着剑走，落在你肩上。她收剑，气息微乱，耳根在雪光里红得清清楚楚：「这一式，舞名未许。」她把素绸舞袖带绑上你的腕，绑得极紧，和她自己绑的一样紧，「先系在你这儿。许名那日——」她转身往场心走，走了两步，站住，背对着你，声音低得像雪落，「许了名，它就不止一式了。名是什么，我不能说。说出来，就不合古礼；不合古礼的舞——」她顿了顿，「舞不成。你等着。等我把这一式的名字，舞完整。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
                    break;
                case 'accept':
                    aff = 3;
                    msg = '「自到。」她点点头，把素绸带重新绑回腕上，绑得极实。「好。晨课卯时，雪坎第三株松——你来，就知道。」她提剑要走，走了两步，停住：「第三株松底下的雪，我每日扫一条道。扫了十日。」她说得像报舞的名目一样平，「扫道，不是等。是晨课。晨课顺路扫一条道——顺路给谁，松知道，我不知道。」她走进雪光里，背影直得像剑。第二日晨课，场边的弟子看见：问松那一套，先生舞得极慢，慢到每一式都朝着雪坎第三株松的方向。弟子问：先生，今日这套怎么慢了。她收剑，答了两个字：「雪深。」';
                    break;
                case 'argue':
                    aff = -17;
                    msg = '她抬剑的手慢慢放下了。她看了你两息，忽然收剑——收得极静，静得没有一丝雪声。「管到。」她重复了一遍，把素绸舞袖带从腕上解下来，一折，两折，收进怀里。「古礼第一条，我为你破。破了的礼，昆仑记档：破礼的人，自己担。」她说得像背舞名一样平，「我以为担一个人担惯了。今日你教我一条：担礼的，看礼的人也要担一半。」她转身往场心最里那一院走——那是舞前净心的人住的地方。「从今日起，晨课照旧，舞照旧。只一样——」她在院门前站住，背对你，雪光映着半张侧脸，「舞名，不问你了。迎雪是迎雪，问松是问松。你名字起头的那一套——不想了。」院门合上。当夜晨课场的雪叫人扫得干干净净。第二日晨课她舞了十二套，套套精准，套套稳，一式没有岔——只是腕上没有绑素绸带。弟子私下说：先生今日的舞好看，好看得像舞给没有人看。舞给没有人看的时候，剑意最清，也最冷。';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 12);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 翀玉衡：功业日记末页新起一栏——「此债记账」 ----
    'qz_event_cold': {
        id: 'qz_event_cold', npcId: 'sect_leader_全真教', title: '此债记账', icon: '📒',
        desc: '她为你单开一栏「此债记账」——利息按日计，两讫，永无。',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'qz_e_cold_done',
        requireRivalRomance: true, requireEventDone: 'qz_event_probe',
        scenes: [
            { speaker: 'narrator', text: '全真教功业房。你成道侣契那日，教里的贺礼入了她的账——入完账她对自己说了一个字：「记。」今夜功业房灯下她在结账，小银算盘就在手边。你进来，她没有抬头，算珠啪、啪——拨到某一珠，停了。她盯着那颗珠看了两息，忽然把功业日记翻到最末一页：那一页是新起的，栏名四个字，「此债记账」。', type: 'description' },
            { speaker: 'npc', text: '「契成了。公账记讫，两讫。」她把日记推过来，指尖压着那一栏新账，「这一栏，私账。私账，不两讫。」她的账房腔又平又快，像拨珠，「债起何日：三年前经堂，你听我结账，听了一刻钟，没有打断。这一笔，当夜就记了。」她翻过一页——下一页还是这一栏，还是这四个字，日子却隔了三年，「记了三年。利，按年滚。」' },
            { speaker: 'npc', text: '「利率我自拟。」她终于抬头，指尖夹着一枚算珠，轻轻一拨，「按日。你来一日，利止一日；你不来，利滚一日。」她合上日记，把小银算盘压在上头，压得极正，「今日立规：这一栏的账，从今日起你也知情。知情，就是认账。认账——」她顿了顿，账房腔里混进一点压不住的、又被她按回去的东西，「认账，就是两造画押。两造画押的债，全真教的账上只此一笔。只此一笔，就是——」她把算盘往你那边推了半寸，推得极慢，「全押。你答：这一账，认不认？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「认。本息一起——我全押在你这一栏。」', effect: 'vow' },
                { text: '「账你记。日子我走——利止利滚，珠子你拨。」', effect: 'accept' },
                { text: '「成个契，你立一栏债账拴我——全真教的修行，修到算盘上了？」', effect: 'argue' }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'vow':
                    aff = 6;
                    msg = '她拨珠的手停住了。她看了你三息，忽然把小银算盘捧起来——双手捧着，捧得极郑重，像捧一只香炉。「全押。」她重复了一遍，提笔，在日记那一栏的末尾写下四个字，一笔一划：「本金：全押。」写完搁笔，指尖把那颗停了两夜的珠推到位——啪，一声脆响。「珠落位，账成立。」她合上日记，把算盘收回怀里，收得极深：「从今日起这一栏随我走。我随账走。」她起身剪灯花，背对着你，账房腔终于裂了一道小缝，缝里漏出来的声音很小：「利率改了。从今日起不按日。」你问按什么。她把灯花剪得端端正正，没有回头：「按一辈子。一辈子的利，经书上叫来世债。我不信来世——」她顿了顿，「我只信：这辈子，收不完。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
                    break;
                case 'accept':
                    aff = 3;
                    msg = '「我拨。」她点点头，把日记收回案头最里层，算珠啪的一声，把那颗停住的珠拨回一半——又停在一半。「停在一半，就是账活着。」她说账语说得极认真，「珠推到底，账就死了。死账入地库——全真教的功业账，三百年没进过地库。」她继续结账，结了几行，忽然说：「你走你的日子，成。只一样记着：利止于人到。人不到，利越滚，我越——」珠停了，她改了口，「利越滚，越近两讫。两讫是好词。账上的好词。」灯花爆了一声。她没有抬头，「好词，不该说得像哭。今夜这笔账结歪了。歪账——明日我自己平。」';
                    break;
                case 'argue':
                    aff = -17;
                    msg = '她拨珠的手停住了。她看了你两息，忽然把功业日记合上——合得极轻，轻得像怕惊动账里的什么。「算盘。」她重复了一遍，点点头，「修行修到算盘上——对。全真教的功业账，一珠一业，我拨了二十年。」她把日记归到架子最顶层，把小银算盘收进袖子，袖口系得紧紧的。「从今日起，这一栏，销。销，就是本息两清，条目两讫。」她把「两讫」说得极整齐，整齐得不差一个音，「三年前经堂那一刻钟——算你还了。算你还了，就是账平了。」她吹熄了半盏灯。你转身要走，黑暗里她的声音飘过来，账房腔还平着，平得中间裂了一道：「账平，好。账平了，拨珠的人也就平了。这一条不入账。这一条——」袖中算珠极轻地响了一声，只一声，没有第二声，「我不认。」第二日功业房的人看见：昨夜的账结到天亮，行行极整齐；独最末一行，珠子推到一半，停了。停珠不入账——结账的人都知道，那叫存疑。存疑的账，她二十年里头一回留着没平。';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 12);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 竺照禅：批注经新添一条骂自己的批注——「荒废的不是经」 ----
    'shao_event_cold': {
        id: 'shao_event_cold', npcId: 'sect_leader_少林寺', title: '荒废的不是经', icon: '📖',
        desc: '批注经上突然多了一条骂自己的批注：「功课荒废。批：荒废的不是经。」',
        minAffection: 40, trigger: { random: 1.0 }, cooldown: 0, flag: 'shao_e_cold_done',
        requireRivalRomance: true, requireEventDone: 'shao_event_probe',
        scenes: [
            { speaker: 'narrator', text: '少林寺讲经堂。你成道侣契那日，消息比山门的香火先上山。今夜她在灯下批经，批注经摊在经案上，你进来，她没有抬头，笔还在走——写完一笔，搁笔，把那一页转过来给你看。页上新添了一条批注，小字比平日密，也比平日毒：「功课荒废。批：荒废的不是经。」', type: 'description' },
            { speaker: 'npc', text: '「契，成了。」她先合十：「阿弥陀佛。」佛号念得极圆，圆完，指尖点在那条批注上，「念。贫尼的批注骂了二十年人，今夜头一条，骂的是自己。」她的声音又平又毒，「功课荒废——荒废的不是经。经摊在案上，一个字没有荒废；荒废的是什么，批注不点名。不点名，是你自己知道。」' },
            { speaker: 'npc', text: '「少林的戒律是立给僧众的，你不在戒内。」她把念珠提起来，珠子盘得发亮，「所以今夜贫尼为你另立一条规矩——三款，不多。」她一款一款数，数一款，拨一颗珠：「第一款：贫尼讲经的时辰，你在何处不论，脸朝着少林。第二款：你心里的节，先留一个给法座。第三款：说不得的话，上山来说与贫尼——贫尼这张毒舌，天下什么话都骂得，独你的说不得，骂不动。」数完第三款，她把念珠搁下：「你答：接不接。接了，贫尼把你写进批注经。写进去，你就是经里的人——经里的人走到哪儿，」她顿了顿，佛相不变，话毒得发亮，「批注跟到哪儿。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「接。三款全接——再添一款：你的批注，往后由我监批。」', effect: 'vow' },
                { text: '「条子认下。日子我走——走到早课的时辰，我自上山听经。」', effect: 'accept' },
                { text: '「成个契，你引经据典拴我——少林的戒台，几时管到俗家了？」', effect: 'argue' }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'vow':
                    aff = 6;
                    msg = '她执笔的手停住了。她看了你三息，合十——这一回佛号没有念出来，念到一半，叫她自己的毒舌打断：「监批。」她把这两个字咀嚼了一遍，提起笔，在那页空白旁边新起一栏，栏名两个字：「监批」。写完她把批注经转过来给你看，看的却不是新栏，是新栏旁边那页空白：「经里的人有监批的，二十年的批注，头一例。监批管批注，不管人——贫尼的毒舌，天下骂遍，头一回有人管。」她耳根红着，佛相撑得辛苦，索性不撑了，声音压低，一句比一句利：「监批上任，头一桩公案交给你：那页空白，几时批得下去——你给贫尼定个日子。定了日子不来，批注就悬着；批注悬着，贫尼只好骂你。骂你倒容易——」她合上经，把念珠绕回腕上，绕了两圈，「难的是骂完，这页就废了。废了的页，天下没有第二张。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
                    break;
                case 'accept':
                    aff = 3;
                    msg = '「自上山。」她点点头，把批注经合上，归到经案最里层。「好。早课卯时，讲经堂头排——你来，就知道。」她起身剪灯花，剪得端端正正，忽然又说：「日子走不走得成，是戒的事；贫尼等不等，是贫尼的事。这两桩，经上不许通融。」她剪完灯花，看着灯，毒舌软了一度，软得自己先愣了一下，「今夜通融了：你走你的日子，贫尼等贫尼的。」她顿了顿，像是要把那句话收回去，收不回，索性批了一句：「方才那句，不作数。」你问哪句不作数。她把念珠拨了一颗，声音低下去：「都不作数。出了口的话，跟落了笔的批注一样——划不掉的。你只当贫尼今夜功课荒废。荒废的不是经。」';
                    break;
                case 'argue':
                    aff = -17;
                    msg = '她合十的手慢慢放下了。她看了你两息，先念了一声佛：「阿弥陀佛。」这一声念得极长，长完她睁眼，佛相还在，人冷了：「管到俗家。对——戒台管戒，不管俗家。这一句你说得合律，经上有出处。」她提起笔，把那条「功课荒废」的批注一笔一笔销了——销得干干净净，销完把批注经合上，归架，归到最高一层。「今夜的批注，作废。作废不是没有写过——二十年的批注里，作废的那些，最毒。」她拂了拂僧袖，袖口那串念珠绕得极紧。「从今日起，三款规矩，全撤。戒律归还戒台，你归还你的日子。缘起缘灭，经上写得明白——贫尼今日头一回，盼经文写得不明白。」她拂了拂僧袖，袖口那串念珠绕得极紧。第二日当值的弟子说：昨夜师父在讲经堂加了一座晚课，课里佛号念得比平日多了一倍。念完佛号，师父对着那页批注经坐了很久——销了批注的那一页，纸薄了一层。薄纸不受墨。从今往后，那一页连批注都批不得了。';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 12);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    }
};

// ============ 三、节日余波（36 桩，可每年每节重演一次） ============
// 账本真源：festival-bridge 写在 bonds[*].festival 的账格。推了帖（declined）、
// 放了鸽子（stood）的——节过后的日子里，你走进 Ta 的门，会看见 Ta 一个人过节的样子。
// 情敌名字只在账本里有「spent」实证时才点出——你确实把那一夜许给了 Ta。
var JEAL_FEST_NAME = { shangyuan: '上元灯节', qixi: '七夕', zhongqiu: '中秋', chuxi: '除夕' };

// 每位 × 每节：Ta 一个人是怎么过的（余波场景的第一句）
var JEAL_AFTER_NARR = {
    'sect_leader_百花谷': {
        shangyuan: '上元过后第二天。药庐檐下挂着一盏走马灯——过了节没人收，灯纸叫夜风吹破了一角。她坐在灯下碾药，人影安安静静。',
        qixi: '七夕过后第二天。药庐窗台上那对茶盏收了一只，剩下那只扣在托盘上，控干了水，收进柜子的姿态，像收一件旧物。',
        zhongqiu: '中秋过后第二天。药炉上温着一只小锅——月饼馅的甜气混着药气，调子不合，她还在熬。锅边搁着半块月饼，切得整整齐齐，没动过。',
        chuxi: '除夕过后第二天。药庐大扫除，她把两只茶盏并排擦净，擦完，把其中一只放回最高层的柜里，踩着凳子放的。'
    },
    'sect_leader_修罗宫': {
        shangyuan: '灯节过后第二天。修罗宫大殿当中悬着那盏没人碰过的花灯，烛泪糊了满台。她在台下练剑，剑穗系的是灯节那日的红绳。',
        qixi: '七夕过后第二天。暗哨的簿子上多了一页新账，封皮写着「七夕」。她头也不抬地翻给你看——簿上只有四个字：「一夜，无事。」无事，就是最大的事。',
        zhongqiu: '中秋过后第二天。后殿案上供着那个月饼——她没切。刀就搁在旁边，两天了，月饼完好如初，像一件证物。',
        chuxi: '除夕过后第二天。她在擦那半副没收走的碗筷，擦得极亮。擦完摆回原处，摆成一双。侍女进来换水，看见桌上是双份的，什么都没敢说。'
    },
    'sect_leader_天山派': {
        shangyuan: '灯节过后第二天。雪庐外那串红灯笼还挂着，冻硬了，烛台里淌出一圈蜡盘。她在雪里擦剑，擦一阵，抬头看那串灯笼，再擦一阵。',
        qixi: '七夕过后第二天。观星台的茶盏收了，雪扫得干干净净，只在台阶最上头留了一块没扫——那块石头上摆过茶。她今日在雪线上练剑，练的是双剑。天山剑法，原本就是双人使的。',
        zhongqiu: '中秋过后第二天。雪庐案上那半块月饼冻得梆硬。她拿刀把那半块也切了——切成薄片，一片一片，摆在霜鸣剑前的雪地上。给剑过节，天山派的老规矩。',
        chuxi: '除夕过后第二天。雪庐门框上贴了新联，字锋如剑。下联的位置原本有两个字的位置留白——她昨夜写了，又揭了。纸屑还在门槛上压着。'
    },
    'sect_leader_五仙教': {
        shangyuan: '灯节过后第二天。万蛊窟的洞口挂了一串小灯笼，蛊生们悄悄挂的——教主没让摘。她坐在灯笼底下喂蛊，一抬手，小蛊们往灯笼那处飞，她也不拦。',
        qixi: '七夕过后第二天。她把心蛊放出来透气。蛊虫不往蛊瓮去，绕着后山那株双生藤打转——那藤两棵共一根，苗人叫它「同心藤」。她看着，拿指尖绕自己的穗子。',
        zhongqiu: '中秋过后第二天。蛊瓮边摆着半坛月下的酒，启了封，没再斟。她拿银针逗那只绕名姓签子的小蛊，逗一会儿，停一停，听一听心口。',
        chuxi: '除夕过后第二天。她把忘情散的方子改了三处，说「药性烈些，忘得干净些」。药童劝：方子改三处，就成药性险了。她说：险才好。——这句话是对药童说的，声音却是给谁听的不一定。'
    },
    'sect_leader_铸剑山庄': {
        shangyuan: '灯节过后第二天。炉房门口挂着山庄统一扎的灯笼，别家的都摘了，他这间没摘。他在炉前打一副双镰——农具不该打双的，他打得极用心。',
        qixi: '七夕过后第二天。砧子边多了个小木盒，打开是那枚没了铃舌的小银铃。他坐在炉前对着它喝茶，不锻，不敲，就看。',
        zhongqiu: '中秋过后第二天。那块没动过的月饼还搁在砧子上。今早学徒擦砧子想拿走，他一锤砸在边上：「搁着。」如今月饼底下垫了块新铁板，防止串了铁腥。',
        chuxi: '除夕过后第二天。炉房添了副新碗筷，红漆的，崭新。摆在一双的位置。学徒问留饭给谁，他说：「留灶。」——庄里老话，灶上留饭，等还没归家的人。'
    },
    'sect_leader_药王谷': {
        shangyuan: '灯节过后第二天。谷里给每位执事发了节礼单，他在你的名字旁边注了四个字：「代领，挂账。」字是他自己写的，账也真是自己挂的——按谷规，代领的礼钱要从自己月俸里垫。',
        qixi: '七夕过后第二天。药圃里他一个人在间苗，间得极慢。学徒远远看着：师父把两株靠得近的幼苗都留下了，间苗本是去一的活，他今日改成了移栽——挪开了，都留着。',
        zhongqiu: '中秋过后第二天。药庐案上摆着他新炒的一味药——酸枣仁，安神的。炒的火候是双份的方子，装罐却只装了一罐。标签上写：「一人份。炒多了。是我失算。」',
        chuxi: '除夕过后第二天。他在晒谷场支了张方桌，摆两副杯筷喝茶。谷里人过去行礼，他笑吟吟招呼众人坐下吃茶——人坐满了，他对面那副杯筷还是空的，茶续了一回又一回。'
    },
    'sect_leader_茅山派': {
        shangyuan: '灯节过后第二天。符阁的符灯换成了灯节那种圆罩灯。他在解那张上元的卦——卦象是「灯下有人不在」，解得极慢，一张卦解两天，这在茅山是不该有的耐心。',
        qixi: '七夕过后第二天。观星台新拓了一块小碑，碑上是他自己写的一行小字：「双星不孤，各守一方。」弟子问师父这是谁的卦词，他说：「没有谁的。我自己写的——写碑不要卦。」',
        zhongqiu: '中秋过后第二天。符阁供月用的果盘收了，独独留了那半张「长」字符。他把剩下的朱砂调稀了，一笔一笔描那个字，描一遍，等干，再描一遍。朱砂用完了，他就着月光描。',
        chuxi: '除夕过后第二天。新岁头一支签，他替全山卜了个上上。轮到他自己那一支，他看了很久，把签文收进袖子没挂。当值弟子说：师父的签呢？他说：「岁首不言。」'
    },
    'sect_leader_金刚宗': {
        shangyuan: '灯节过后第二天。塔前那排灯笼收了，最末一盏收不走——线冻脆了，缠在铁钩上。他站在梯子上拆，拆了一炷香。香客来拜，看见方丈仰头对付一盏灯，没人敢催。',
        qixi: '七夕过后第二天。塔基新供了一对并蒂石莲——山下匠人雕废的一对，他买回来了，摆在佛前两侧。摆完，合十念了一段经，念的是超度「未生之愿」的经文——愿没起成，也算一桩小丧事。',
        zhongqiu: '中秋过后第二天。供盘里那块大的月饼，他让人切了，分给全塔僧众，说「施主们的心意，同沾」。分到最后一瓣，盘里没了。他自己那块，原来一开始就没切下来。',
        chuxi: '除夕过后第二天。塔门前的雪扫得干干净净——扫了，又落，又扫。小沙弥说：方丈，明日再扫也一样。他说：「明日明日再扫。」——今日今日扫完。至于为什么今日要扫完，他没说。'
    },
    'sect_leader_峨眉派': {
        shangyuan: '上元过后第二天。戒堂檐下那盏灯还亮着——她昨夜没让人撤。灯下压着一支名签，签上没写字。她坐在灯边擦戒尺，擦得很慢，擦完一遍，又擦一遍。',
        qixi: '七夕过后第二天。金顶的云海散得早。她照旧巡夜，巡到舍身崖边停了停——崖边石头上摆着两只素点心，一只收走了，一只留着。留给谁，她没说。猴王下山来闻了闻，她罕见地没赶。',
        zhongqiu: '中秋过后第二天。斋堂的月饼分给了满山弟子，她自己那块没动，搁在戒堂的灯下。猴群下来讨食，她掰了半块给猴王，剩下半块，还是搁着，搁得端端正正。',
        chuxi: '除夕过后第二天。峨眉落了雪。她扫戒堂门前的雪，扫出一块空地——空地的形状，像给谁留的一个站位。她站在边上看了片刻，又挥帚把雪扫平了。扫平了，脚印还是多出来的那一行。'
    },
    'sect_leader_华山派': {
        shangyuan: '灯节过后第二天。华山的灯笼摘了大半，剑堂檐下那盏还挂着。他在堂里坐着，没点灯，也没落雨——天晴。弟子说，师父晴天也坐，坐了半宿，坐得比雨夜还久。',
        qixi: '七夕过后第二天。账房的总账后头，那页私账翻开着，页上没添新笔。他在页边研墨，研了很久，没落一笔。窗外没下雨，松风一阵一阵，替他把纸角掀了又按住。',
        zhongqiu: '中秋过后第二天。华山分节礼，他替全派垫的账上又添了一笔。案上摆着一壶酒、两只杯——酒是从师父那只葫芦里倒出来的，倒满了两只，他自己只喝了一只。另一只，摆到酒凉。',
        chuxi: '除夕过后第二天。他在思过崖石壁前站了半个时辰。十二道剑痕上落了霜，他一道一道拂过去，拂得很轻。到那片空白处，他站得最久——什么也没刻，拱了拱手，转身下山了。'
    },
    'sect_leader_唐门': {
        shangyuan: '蜀中灯节过后第二天。毒堂檐下挂着一排小灯，是晚辈们扎的，她没让摘。她坐在灯下擦银针，擦一根，就着灯光照一照，再擦一根。案上那盏节令的茶，从热放到凉，没人动。',
        qixi: '七夕过后第二天。药炉的火压到最小，她坐在炉边看火，看得很久。药童进来添炭，看见她把手套的口又勒紧了些——堂里炉热，唐门的人都知道：堂主勒手套，不是怕热，是怕热伤了谁。那一夜的热，她只温了自己。',
        zhongqiu: '中秋过后第二天。唐门有旧例：节令的月饼先过银针——不为验毒，为验甜。案上那只月饼扎满了针孔，甜是验过了，没人吃。她把针孔连着饼屑一并扫进纸里，包好，收进了袖子。',
        chuxi: '除夕过后第二天。毒堂封炉，唐门岁末的老规矩。封炉前她往炉膛里多添了一把炭——炉子原不必添，火自己够煨一夜。她添那把炭的时候，像在给谁留什么；添完，站在炉前看了一会儿，才把炉门封上，封得很实。'
    },
    'sect_leader_武当派': {
        shangyuan: '灯节过后第二天。武当山门的灯笼摘了，殿门口那对还挂着。他在灯笼底下扫阶，扫到末一级，站住，仰头把那只歪了的灯笼扶正。灯笼晃了两晃，他等它晃定了，才下山。',
        qixi: '七夕过后第二天。真武殿的供果换了，两盘换成一盘。他把那盘摆得极正，摆完退后三步看了看，又上前挪了半寸。夜里他一个人在月下推手，推得很慢——推手要两个人，他推的是一个人的份，掌风一起一落，像在替谁数拍子。',
        zhongqiu: '中秋过后第二天。供在祖师剑前的那块月饼，他分给了满山小道童，自己没留。夜里他坐在问道的剑架底下，坐了很久。守夜的小道童说，那夜剑鸣了一声，很轻——照旧，只有师兄听见。师兄应了剑一句话，没人听清。',
        chuxi: '除夕过后第二天。新岁的晨钟一百零八杵，他撞了一百零九。抱钟杵的小道童数到第九杵，看他，他只说了三个字：「多一杵。」没说替谁。那日他扫阶从头扫到尾，扫了两遍——第一遍扫雪，第二遍，像把没有的脚印也扫掉。'
    },
    'sect_leader_蓬莱派': {
        shangyuan: '海岛灯节过后第二天。满湾的潮灯放出去又收回来，独独观汐台那一盏没收——她说是留着照潮。夜里她在灯下摹节夜的海市，摹了一半，停笔，把案上另一只没人用过的灯盏擦了擦，摆回原处，摆得很正。',
        qixi: '七夕过后第二天。蓬莱放流灯，满海的灯顺潮往南去。她那一盏没放——灯上只写了一个字：「岸」。灯搁在台沿，搁了整夜。天亮她收回去，收进图录匣，与二十年的潮信放在一处。',
        zhongqiu: '中秋过后第二天。中秋的月潮是一年最大的一次，她却在观汐台录潮录到天明——满岛的弟子都去赏月了，台上只她一个人，一笔，一笔。案上摆着两块节饼，一块分给了守阵的师弟，另一块收着，收得整整齐齐。',
        chuxi: '除夕过后第二天。除夕封阵是蓬莱的老规矩，她带着弟子把环岛潮汐阵一处一处封好。封到最后一处阵眼，她多留了一线潮路——留潮路不合规矩，弟子们没敢问。初一的潮涨上来，那一线恰好通到岸边，像给谁留的一扇门。'
    },
    'sect_leader_逍遥派': {
        shangyuan: '灯节过后第二天。酒仙池的新坛都封了泥，封泥上照例该题酒名——最新那一坛没题，泥抹得平平整整。他躺在坛边抚琴，弹的是灯节的热闹调子，弹到一半，换成了一段没人听过的慢曲。慢曲没有名字，弹给谁听，他也不说。',
        qixi: '七夕过后第二天。他自斟自饮，对影成三人——影子那两个，一个他唤「太白」，一个他唤「无崖子」。酒斟了三盏，他自己的那盏喝得最慢。夜深他朝石桌那边举了举盏，石桌空空如也——残局早收进了匣里，连枰都擦了。',
        zhongqiu: '中秋过后第二天。琅嬛福地晒书，满架的卷册摊了一院子。他搬了张躺椅守在书中间，说是怕猫——琅嬛没有猫。晒到日头偏西，他把一册棋谱单独收了起来，压在枕下，压得很平。',
        chuxi: '除夕过后第二天。守岁他是一个人守的——残局从匣里请了出来，黑白摆开，自己跟自己下。下到三更，他捏着最后一枚黑子投了子，把枰一推，笑说「散局」。收枰的时候，白子缺的那一枚位置，他空着，没有替补。'
    },
    'sect_leader_恒山派': {
        shangyuan: '灯节过后第二天。白云庵檐下挂着一排弟子们扎的小灯——她没让摘。夜里她在灯下抄灯经，抄到末行停笔：回向的位置，空着。灯燃到天明，那行空白也空到天明。',
        qixi: '七夕过后第二天。庵里乞巧，她带着满庵抄经——抄完各归各函，独自己那张，比旁人多折了一折，收进了袖里。小师侄问：师姐的经归哪儿？她说：「不归。这一张，等一个回向。」回向给谁，她没说。',
        zhongqiu: '中秋过后第二天。斋堂分节饼，她自己那块没有动，搁在佛前的木鱼旁边。傍晚她多敲了一课晚课——课表上没有这一课。守夜的弟子听见，那一课的木鱼，收尾处多敲了一声。多给谁的，没有人敢问。',
        chuxi: '除夕过后第二天。白云庵岁末撞钟，钟罢她独坐抄经堂到天明。案上那页回向纸摊着，纸边一碗白云草茶，从温放到凉，没有动。知客的师侄来收灯，看见茶凉了要换，她摇头：「留着。凉了的茶，也是茶。」'
    },
    'sect_leader_嵩山派': {
        shangyuan: '灯节过后第二天。嵩山的节灯摘了，执法堂的灯还亮着——他一个人在堂里核节期的夜禁文书，核到五更。管档的阿婆送宵夜进去，看见「未结」格那册薄卷宗摊在案头，页边一行新批的小字：灯节之夜，天下无事，独此卷缺目。',
        qixi: '七夕过后第二天。他把那册薄卷宗多加了一遍核印——执法堂的规矩，重档三核。当值弟子数着印数犯嘀咕：首座的卷宗，旁的档一核，这册三核。多出来那两遍的墨色，一遍比一遍新，最新一遍的日期，恰是七夕次日。',
        zhongqiu: '中秋过后第二天。派中分节礼，名册上你的名字旁边，他写了四个字「代领，归档」——公事公办，程序一样不缺。写完他把那行字又核了一遍，核完，在「归档」底下画了一道极轻的线。阿婆说：理档三十年，头一回见首座在名册上画线。',
        chuxi: '除夕过后第二天。岁末封档，执法堂的老规矩——他把「未结」格那册薄卷宗用油纸单独包了，包一层，压一遍，包了三层。封完档他在架前立了一会儿，把腰间那半枚下符解下来，往格里放——放了，又取出来，终究还是系回了腰间。这一来一回，堂里的灯看到五更。'
    },
    'sect_leader_泰山派': {
        shangyuan: '灯节过后第二天。山下灯会的火光，玉皇顶望得见——她临火照旧，礼成不下山，蹲在台边看那点远处的灯火，看到灯火一盏一盏熄了。那日的档上多了一行：晴，灯，多。火色——平。写完「平」字她顿了顿，没有改。',
        qixi: '七夕过后第二天。她一个人上日观峰看了半夜的天——临火人看星不看斗，看的是来日的天色，这一夜破例看星。看到半夜，忽然掏出拓包，就着星光拓了一张「日」字：夜里没有日头，这张注定是废的。废了她也没揉，折好收进竹管——竹管上的麻线，那夜多缠了一匝。',
        zhongqiu: '中秋过后第二天。中秋的月从东边起，火坛的火也朝东——她说临火十年，月与日都归她管。那夜满山赏月，她守火，月到中天她让师弟把半块月饼送下山去：「搁火坛左手边，那块石头上。」搁了，没人吃。落了霜，她拂了，又搁回去。',
        chuxi: '除夕过后第二天。泰山岁末的火不熄——她守着火到天明，档记得特别齐整。那一页档的末行，十年都写「独迎」两个字。那一夜她写完，盯着那两个字看了半晌，拿炭笔在旁边画了一个极轻的圈。圈是什么意思，她没跟人讲。'
    },
    'sect_leader_青城派': {
        shangyuan: '灯节过后第二天。焙房檐下挂着一盏小灯，师弟们扎的，她没让摘。她在灯下炒那一年最后的一匾茶青，炒得特别慢。出锅后她拈起最新的一芽，就着灯照了照色，照完，搁进了罐底，压平。',
        qixi: '七夕过后第二天。她晒了两匾茶青——一匾是观里的，一匾她说是「客茶」。客没有来。那匾客茶她自己分给了师弟们，分时特别匀，独留了最匀的一份到最末——留到傍晚，封进纸包，写上「茶末」两个字，搁进了架子最底层。',
        zhongqiu: '中秋过后第二天。青城分节礼的山产，你那份她代领回了焙房，挂在茶账上——「代领」两个字写得歪歪扭扭，写完她重描了一遍，还是歪。那日她炒的火比平日旺，满焙房的茶香压都压不住，师弟问，她说：「火走神了，不是我。」',
        chuxi: '除夕过后第二天。岁末焙房封灶，青城的老规矩。封灶前她把架顶那只旧罐用布包了收起来——布包里塞了一页纸，纸上写着一个日子，是你从前说过要来山的那一日。包完罐，她把布包按得特别实，像把那一天也按了进去。'
    },
    'sect_leader_衡山派': {
        shangyuan: '灯节过后第二天。山下灯节的喧闹飘得上琴台——她照拉那半阙，拉到收尾，弓速缓下来，像在等人跟上。没有人来。那夜的曲子拉了两遍半阙，第二遍拉到惯常停住的地方，弓毛在弦上悬了一炷香，才收。',
        qixi: '七夕过后第二天。夜雨。琴台的灯亮了一整夜，台角那只蒲团没有收——雨打湿了半边，她拧干了，摊开晾着，晾干了又放回原位，位置没有挪一寸。她在台上坐到天明，胡琴抱在膝头，一夜没有拉。',
        zhongqiu: '中秋过后第二天。衡岳的云海退得早，满山赏月。她一个人坐在琴台上，没有拉曲，只把那块松香取出来，在弓毛上擦了三下——擦完三下，又擦了三下。擦完收香入袖，看月。月看她。看到月沉西壁，谁也没有先动。',
        chuxi: '除夕过后第二天。祝圣寺的岁末钟，琴台封琴——封琴前她把那半阙拉了一遍，拉到惯常停住的地方，没有停，坐着。坐到天明，灯尽了，她把胡琴收进油布，一层一层裹好，裹得特别慢，像裹一整年的雨。'
    },
    'sect_leader_丐帮': {
        shangyuan: '灯节过后第二天。粥棚灯节不歇业，他把书说到半夜——人散了，他抱着百衲衣坐在棚柱上，怀里两只豁口碗，一只朝上，一只倒扣。倒扣的那只他自己搁的，搁得端端正正，像讯房所有的东西一样，各有各的位置。',
        qixi: '七夕过后第二天。讯房的灯亮到三更。他把你名下那支竹签拔出来核了一遍——核完挂回去，挂回去又拔出来，再核一遍。当值弟子说：长老核签从来不过两遍。那一夜，三遍。第三遍核完，签没有挂回原处，挂在了离案最近的那一排。',
        zhongqiu: '中秋过后第二天。帮里分粥，他亲自盛了最末一碗，摆在案角——碗口的豁朝里。朝里的那只是补过的，针脚极密，是他自己的手法。那碗粥从温放到凉，他一口没动。收碗时他把粥倾回桶里，碗涮净，倒扣在架上，扣得很正。',
        chuxi: '除夕过后第二天。他往义仓去理旧布，理到天黑——那方褪色的青布包，他叠好收进怀里。出仓时他跟老师傅说了一句：「明年会更好。」老师傅问怎么个更好法，他笑了，笑得跟说书时一样眉飞色舞，一个字也没有答。'
    },
    'sect_leader_阎罗殿': {
        shangyuan: '灯节过后第二天。档房节期封门，千架旧册安安静静。他一个人在案前核节期的来档——最末一册是你的：回帖摊平在案上，旁边搁着那枚「未定」的档签。他把签看了很久，末了把签压在回帖的「事由」一栏上，压得端端正正。',
        qixi: '七夕过后第二天。他的案头摆着一排新裱的档案套，一册一名，签都写好了。最末一册没有名——签是空白的，四角却裁得整整齐齐。当值的弟子说：记档先生七夕那夜裱了一宿的空套。空套裱给谁，没人敢问，他也没说。',
        zhongqiu: '中秋过后第二天。殿里分节礼，你那份他按例代领回了档房，记在册上——「代领」两个字写得极小，写完又用笔在底下画了一道极轻的线。那月饼在案上从节夜摆到今日，包纸的角都没有动过。',
        chuxi: '除夕过后第二天。岁末封档是档房的老规矩，他把你的档用油纸单独包了——包一层，压一遍，包了三层。封完他在架前立了一会儿，把笔山上那支朱笔拿起来，拔开一半笔帽，又扣回去，搁正，归架。这一来一回，档房的灯看到五更。'
    },
    'sect_leader_血手门': {
        shangyuan: '灯节过后第二天。药庐的素灯下多挂了一盏小节灯，门里人扎的，她没让摘。她坐在灯下碾白药，碾得特别慢。案上那张「普通日子」的清单摊着，「赶一次集」那一行，今日多了一行小注：集散了。注完她看了看，没有擦。',
        qixi: '七夕过后第二天。她在院里晒了两匾白药——一匾是药庐存用的，一匾她说是「客药」。客没有来。傍晚她把客药分给了门里人，分得特别匀，独留了最匀的一把到最末，包进纸里，写了两个字：安稳。写完压在了灯座底下。',
        zhongqiu: '中秋过后第二天。门里分节礼，你那份她代领回了药庐，记在清单背面——「代领了」三个字写得极小，写完在旁边画了一个极轻的圈。那夜她在灯下缝东西，顶针在灯下一闪一闪，针脚密得能挡雨。缝的是什么，没给人看。',
        chuxi: '除夕过后第二天。岁末药庐封灶，她把药碾子用布包好收起来——布包里塞了一张纸，纸上写着一个日子：你从前说过要带她去赶集的那一日。包完她把布包按得特别实，像把那一天也按了进去。开春，院里的白药发了新芽，她蹲在匾边看了很久，没有说话。'
    },
    'sect_leader_飞蝎坞': {
        shangyuan: '灯节过后第二天。坞外集市的灯火，对练场望得见——她扛着钩杖坐在蝎房屋顶看那点远处的灯火，看到灯火一盏一盏熄了。金蝎伏在她手边，尾钩竖了一竖。蝎册的封皮上，那一夜多了一道攥出来的沙印。',
        qixi: '七夕过后第二天。她把金蝎带到坞后的沙坡上放风——放了，又唤回来；唤回来，又放出去。蝎第三回爬回来的时候，爬得特别慢，像在等谁一起把它收走。她盘腿坐在沙里，怀里两囊沙水，一囊满的，一囊空的。空的那囊她倒扣着搁在沙上，搁得端端正正。',
        zhongqiu: '中秋过后第二天。坞里分节礼，你那份她代领回了对练场，挂在册架上——「代领」两个字用炭笔写的，写得歪歪扭扭，写完她重描了一遍，还是歪。那夜她坐在蝎房屋顶看月，看到半夜，金蝎伏在她手边，人和蝎都没有出声。',
        chuxi: '除夕过后第二天。沙漠的岁末风硬，她把蝎房的窝一个一个封好——封到最末一窝，她往窝里搁了一块干粮。坞里小子问搁给谁的，她说：给蝎。蝎不吃干粮，全坞都知道。没有人点破。她把窝封得特别实，像把什么一并封了进去。'
    },
    'sect_leader_烈日教': {
        shangyuan: '灯节过后第二天。教外的灯火，圣火台望得见——她按仪轨巡夜火，在风口站得比仪轨规定的久了一炷香。当值的赤袍祭司说：那夜圣女巡火巡得极稳，只在第三巡的时候，于龛前停了半息；停完，她给圣火多添了一勺油——仪轨里，没有添油这一条。',
        qixi: '七夕过后第二天。她的小院没有让人侍奉，独自在灯下坐了一夜——屋里的灯剪得极短，火苗只有豆大。第二日案头那只檀木小匣收得干干净净，匣盖上多压了一枚赤金的冠坠。是谁的、给谁的，她没说。正午大仪，她的经文诵得特别稳，稳得主诵长老点了两回头。',
        zhongqiu: '中秋过后第二天。教里分节礼，你那份她代领回了小院，记在仪轨册的空白页——「代领」两个字用的是圣女的馆阁体，端正规矩，写完在旁边画了一个极轻的圈。那夜圣火龛的火特别亮，添油的人多添了一勺，祭司们没敢问。',
        chuxi: '除夕过后第二天。岁末教中封井，七口井一口一口封过来——封到第三口，她封得特别慢。封完她在井台上站了一会儿，从袖里取出一截红绳，系在井栏上，系得特别紧。开春井启，红绳还在。没有人去解，也没有人敢问系给谁。'
    },
    'sect_leader_天龙教': {
        shangyuan: '灯节过后第二天。传声房的灯亮到三更——她坐在灯下擦那面半面残铜镜，擦得能照人，又擦。案上传令的册子翻开着，翻到空白的那一行，页角压着铜镜牌。送油的黑袍教众说：那夜传声房特别静，一口调子都没有漏出来——传声房静下来，八年头一回。',
        qixi: '七夕过后第二天。她在外坛廊下传令，传到亥时，令传完了，人没有下来。守夜的师兄说：檀姑娘在廊下站了半夜，偶尔开口练一句——练的是谁的调子，练到一半就收，收了又练。练的不是令。令不会练到一半就收。',
        zhongqiu: '中秋过后第二天。教里分节礼，你那份她代领回了传声房——「代领」两个字她没有写，是传的：她用香主的调子给分礼的教众传了一句，传完自己愣了半息，像没料到这一句会用那口声。那夜传声房的灯亮到三更，案上多了一碟枣，枣动过一颗，剩下半颗搁在铜镜旁边。',
        chuxi: '除夕过后第二天。岁末教中封坛，传声房的令封到开年。她背着人把半面残铜镜带到了坛后的回音壁——七里风磨石壁，喊一声应一声。她对着石壁喊了一句，石壁应了一声。喊的什么，风太大，没人听清。回来的时候她的嗓子微微发哑，嗓音却特别干脆：（用黑袍知客的调子）「年下的令，传讫。」'
    },
    'sect_leader_神机门': {
        shangyuan: '灯节过后第二天。工坊门口那盏走马灯是她自己扎的——灯里不是纸人，是一副齿轮，齿带着影走，影子转一圈，机关滴答一声。她在灯下重算上月的时辰漂移，算完把机关雀也拧上弦陪着——雀的滴答和走马灯的影子，对了一夜的拍子，一拍都没有差。',
        qixi: '七夕过后第二天。她做了一对铜鹊，摆在案头——七夕的鹊桥，她做了机关的。两只铜鹊相向，机括咬合，本该走到一处。她看了一夜：发条的劲不够，两只鹊各走到一半，停住了。天亮她把其中一只拆了，拆下来的零件没有归匣，摆在案头正中央。拆的理由没有入册，只在底板上刻了三个极小的字：「力不足。」',
        zhongqiu: '中秋过后第二天。门里分节礼，你那份她代领回了工坊，记在工册上——「代领」两个字写得极工整，一笔一划像用尺量过。那夜她在屋顶校一台测影的铜仪：月光穿铜管落在刻度上，量的是月的高度。量了三回，第三回铜管偏了——偏朝山下的路。偏了约莫一炷香，她把铜仪对回月亮。工册上那夜多了一条误差记录：「是夜，仪偏路。路无刻度。无刻度——算不出。」',
        chuxi: '除夕过后第二天。岁末工坊换发条，她给每台机关都换了新的——换到那只机关雀，她的手停了很久，末了没有换，反把旧发条拆下来，收进颈间那只黄铜齿轮匣里。新发条走得准，旧发条走的是三年。工册上她只记了四个字：「旧件，存照。」存照的物件不入机，入匣——这一条，门规里也没有。'
    },
    'sect_leader_霹雳堂': {
        shangyuan: '灯节过后第二天。堂前满地爆竹纸屑，他自己放的那一挂「满堂红」，放完把纸屑扫了，扫成一堆，埋进土里——霹雳堂的法子：爆竹纸归土，来年的土更实。方子册的批注栏那夜新添一行流水：「是日，灯明。人未来。硝，干。我，潮。」写完他对着那两个字看了半晌，没有划。潮了的批注不能入火药方——这一条他知道，他没有销，压了块镇纸。',
        qixi: '七夕过后第二天。他放了一回无声的烟花——没有响，只有天上一圈光，开了，落了。守夜的人说：堂主放完，在训练场仰头站了很久，站到光散尽，回棚在册子上记了一行：「是夜，放一回。光无人看。光，不亏。」记完他把引信盒打开又合上，合上又打开，末了挑了一根最长的引信盘好，单独收进了布囊。',
        zhongqiu: '中秋过后第二天。堂里分节礼，你那份他代领回了防火棚，记在册上——「代领」两个字写得极轻，轻得几乎看不清，像怕惊动纸。那只月饼从节夜摆到今日，他没有动。批注写着：「勿食。存。」存的是什么，批注不展开——方子册的规矩，批注四字为限，多一个字，他都不肯写给你。',
        chuxi: '除夕过后第二天。岁末堂里封炉，他把引信一束一束用防火布包好——包到你那一份，布囊是新的，囊口系的是活扣。活扣，一拉就开。霹雳堂上下的引信全是死结，独这一束系活扣。册上批注一行：「正月初一，拟放。点火人——」后头空着。空着的批注，二十年来头一条。'
    },
    'sect_leader_天书阁': {
        shangyuan: '灯节过后第二天。校讎房檐下挂了盏小节灯，师弟们扎的，他没让摘。那夜他在灯下校一部旧本灯词——校到「众里寻他千百度」一句，笔停了。他没有批，也没有划，页角空白了一炷香。香尽了，他提笔批了两个极小的字：「存疑。」第二日有人翻那卷，「存疑」旁边多了一个圈，圈旁又添了一个更小的字：「不讹。」',
        qixi: '七夕过后第二天。他晒旧书，一函一函摊满院子——晒到阁里的借阅册，你的名字在末行：某年某日借书一册，未还。他把那页册子重讎了三遍，讎完没有批「催还」二字。他拿镇纸把册页压住，压到日头偏西，收函的时候，那册归架，封皮朝外——阁里的规矩：封皮朝外的书，是等人来取的。',
        zhongqiu: '中秋过后第二天。阁里分节礼，你那份他代领回了校讎房，记在册上——「代领」两个字没有超四字，他写完却觉得违规，在旁边补了个极小的注：「破例。」那夜他坐在灯下，校讎剑横在膝上，月光落在剑脊。他坐到了三更，没有拔剑，也没有翻页——剑和卷都干净，独灯花剪了两回。',
        chuxi: '除夕过后第二天。岁末阁中封架，他把那卷页角补过的书单独用袱纸包了——包得极正，四角齐齐，像新装的函。封架之前他在袱纸上批了四个字：「待新岁讎。」批完他看了看，又添了三个字，添完自己盯了半晌——三个字超了四字的规。他没有划：「讎者二。」'
    },
    'sect_leader_大隐阁': {
        shangyuan: '灯节过后第二天。他蹲在台阶上看山下的灯，看灯手里还拈着一串糖葫芦——吃到签头那颗，手停了。他把签子插回台阶缝里，光看着灯。灯一盏一盏远下去，他的签子立了一夜。守阁的说：先生吃糖葫芦从来一口气吃完。那一夜，头一回剩了签头。剩签头的卦，卦辞只有一个词：莫尽。',
        qixi: '七夕过后第二天。他给织女星起了一卦——他自己说的。起完卦没有念卦辞，把签揣进袖子，蹲在台阶上一颗一颗吃山楂。有人问卦象如何，他摆摆手：「莫尽。」问第二遍，还是这两个字。问第三遍，他把光签子举起来给你看——签头那颗留着，没吃。「留着的那颗，是替人问的。」他说完抬头看天河，看到脖子酸了，就躺在台阶上接着看。',
        zhongqiu: '中秋过后第二天。阁里分节礼，你那份他代领回了台阶，记在一根竹签上——「代领」两个字写得歪歪扭扭，旁边画了一串糖葫芦。那夜月亮极圆，他对月坐着，手里举着月饼比了三次——第三次没有放下来，对着月亮说了一句什么。巡夜的听见了三个字：「莫尽。」月亮没有答。他自己点了点头，像得到了答复，把月饼收好，一口没吃。',
        chuxi: '除夕过后第二天。岁末阁里收签，他把一捆卦签收进匣子——收到最末一根，签头还挂着那颗风干山楂的，他没有收，插在台阶缝里，签子冲着山下。他对签子说：「这一卦不封。开年头一卦，留给它。」头场雪落下来之前，有人看见他又出门，把签子上的雪拂了，扶正，回阁前在门口站了一会儿——像等谁先跨进去。'
    },
    'sect_leader_侠隐阁': {
        shangyuan: '灯节过后第二天。档廊节期上灯，他巡廊提着一盏小灯——灯照档脊，一架一架。巡到近手那一格，他停了。格上两卷：一卷封皮写你的名字，一卷封皮空白。他把两卷对照着看了很久，在附页录了一行：「是夜，灯节。近手格档脊，温。」录完归档，归得极正。灯灭的时候，他先灭的是廊灯，后灭的是案灯——案灯多亮了半刻，照着那格近手档。',
        qixi: '七夕过后第二天。他在档廊坐到五更，没有重勘，就是坐着。值夜的书记说：简先生把顶格那卷空白档取下来摊开，对着坐半夜，天快亮时在附页写了一行，写完立刻销毁——销毁的纸屑没有烧，压在灯座底下。压到五更，出廊的时候又改了主意，把纸屑收进了袖子。收进袖子的销毁件，档规没有这一条。',
        zhongqiu: '中秋过后第二天。阁里分节礼，你那份他代领回了档廊，记在附页上——「代领」两个字后头又跟了一行：「危险程度：低。」这一行评的是节礼还是别的，他没有注。那夜廊里的灯亮到天明。晨起书记进廊，发现近手那格的两卷档叫挪了位置——封皮有你名字的那卷挪到最外，空白的那卷退到最里。都在同一格，谁也没出去。',
        chuxi: '除夕过后第二天。岁末档廊封库，他一格一格贴封条——贴到近手那一格，停了。那一格没有封。封条写了，贴在格子旁边：「此格不封。事由：候人。」候谁，封条不注。有人来问，他按档规答四个字：「存疑，不究。」答完把库门带上，带得极轻，轻得像怕吵醒格子里的什么。'
    },
    'sect_leader_天涯海阁': {
        shangyuan: '灯节过后第二天。驿站节期停发，他在亭里理旧年的文书——理到你名下，停了停，取出一张空白路引，提笔写站名，写到一半搁了笔。那张半张的路引他卷起来压在砚台底下。第二日砚台添墨，路引还在，上头多了一行颤笔小字：「前路不利，愿与同行。」小字没有站名，没有日期——不是公文，是私笔。私笔压在公文底下，驿亭三百年的旧例里没有这一压。',
        qixi: '七夕过后第二天。驿亭旧俗，七夕发一道「桥帖」贺鹊桥——那年的桥帖出自他手。公文写完，末行多批了两个字：「何处。」老驿丞不懂，问他。他说：桥过了，总有个去处。老驿丞再问何处，他很久没有答，末了把桥帖贴出去。夜里的风把帖角吹得响了一夜，「何处」两个字，抖了一夜。',
        zhongqiu: '中秋过后第二天。阁里分节礼，你那份他代领回了驿亭，记在站册上——「代领」用的公文体，端端正正，写完他把那半枚铜符压在字上，压了一夜。天明收符，符下那两个字完好。那夜驿亭的灯亮到天明，他坐在灯下数站名——从此处到你处，数一遍，回头再数一遍。去路三遍，回路三遍，遍遍多三站。',
        chuxi: '除夕过后第二天。岁末驿道封冻，他逐段探路——探到绕道三站那一段，走得极慢：去一遍，回一遍。回来时他把界碑上的雪拂了，在碑侧添了三个字的注：「春可行。」随行的驿卒问注给谁看，他说：给路。说完他又看了界碑一眼。路不用人注——驿里的人都知道，那三个字是注给开春第一程的行人。行人是谁，站册空白。'
    },
    'sect_leader_大旗门': {
        shangyuan: '灯节过后第二天。营里灯节轮值，他自己讨了值——值哨在旗杆台上，全营最高，望得见山下的灯河。他在台上站了一夜。天明下哨的兵抬头看，都尉还站着。兵问看见什么了，他说：「灯。」问多少盏，他想了很久：「没数。」数灯的人不站旗杆台。站旗杆台的，在等一个看灯回来的人——这一条，军中没有，他自己定的。',
        qixi: '七夕过后第二天。他缝了一夜香囊——不是给自己的，营里人人一只，针脚粗，线密。缝到最末一只他停了手：那只香囊的布不同、线不同，里头的针脚，数得出是三十七针。次日发香囊，人人有份，独独那只三十七针的没有发。它收进了他铠甲最里层，贴心口那一面——收的时候他左右看了看，看得极快，像做贼。猛将做贼，全营头一回。',
        zhongqiu: '中秋过后第二天。营里分节礼，你那份他代领回了帐，记在名册上——「代领」两个字写得极重，笔笔都深。那夜营中会餐赏月，他没有去，坐在帐里就着灯缝那面四个字的战旗。缝完他把旗举起来，对着月光比了比——旗是方的，月是圆的。他点了点头，像比对上了什么，把旗叠好，叠得方方正正，压在枕下。',
        chuxi: '除夕过后第二天。岁末封旗，他一箱一箱封过去——封到最后一箱，往里搁了一样多余的东西：那只铁皮针线盒。封箱的兵问：盒子不是随人走的么。他压下箱盖，砸实，军中短句：「盒子等人。」顿了顿，又一句：「人来，开箱。」箱封上之前，他把盒盖打开看了一眼——针码一排一排，最长那根针的位置，空的。空位他看了一息，没有补针。'
    },
    'sect_leader_铁掌帮': {
        shangyuan: '灯节过后第二天。苇滩岁末数鸟，她天不亮就去了，数了一整日——傍晚回来的册子上，多出一个记号。记的不是鸟。同去的师妹说：堂主对着灯火的方向吹了一声哨，两声低回的——吹完把册子上的记号划了，划完，又描了回去。描回去的记号旁边，她添了极小的两个字：「不算。」数鸟的册子上，什么不算，她没有讲。',
        qixi: '七夕过后第二天。素坯窑的火生了一夜——她烧第九支哨。天明开窑，第九支没裂，她却没有取，蹲在窑前看了半晌，在窑册上记了一行：「音正。不像两人。续烧。」第十支的坯那日起好了，起坯的时候她在泥身上按了两个指印——一个深，一个浅，并排。烧出来像不像两个人，要等开窑。她没有等，把坯送进窑，封了窑门，坐在门口守着，守到天黑。',
        zhongqiu: '中秋过后第二天。帮里分节礼，你那份她代领回了苇滩，记在哨语册子背面——「代领」两个字歪歪扭扭，写完她在旁边添了一个新哨语记号，记号的样子像一轮月亮。那夜月亮照苇滩，她坐在滩头对月吹哨：一长一短，三短促，两声低回——三条轮着吹，吹了一遍又一遍，三十几遍。跟那夜一样。只那夜滩里没有人，这夜滩里有一滩的月光。月光不应哨。她吹到天亮，把哨收了，收进怀里，贴着那支素坯。',
        chuxi: '除夕过后第二天。岁末帮中封窑，她把那支没裂的哨用软布包好收进匣子——软布是新裁的，裁得方方正正。封窑前她吹了最后一声哨，两声低回，吹得极慢。守窑的师妹问：这一条是什么。她关上窑门，凶脸，话不凶：「没事。」顿了顿，声音低下去，「就是想吹一下。」说完她在窑前又站了一会儿，对着窑门小声补了一句：「年初一，再吹。」'
    },
    'sect_leader_昆仑派': {
        shangyuan: '灯节过后第二天。晨课场的雪映着远处的灯河，她晨课多舞了一套——「迎雪」。雪早停了，名目还是迎雪。舞完她立在雪坎上望山下：灯一盏连着一盏，铺到天边。她对着雪地说了三个字：「迎的不是雪。」说完自己怔了怔，像觉得这一句说破了什么，把素绸舞袖带又缠紧了一圈。缠完她重新起势，从头再舞——这一遍迎雪，一式没有岔。',
        qixi: '七夕过后第二天。她舞了一套「送鸿」——鸿雁北归是春秋两季，七夕没有鸿。她还是舞了，舞得完整，一式不减，剑尖最后指着天河。看课的弟子问：先生，送谁。她收剑，答了两个字：「同路。」答完走进雪里，脚印一直印到雪坎第三株松底下。松下的道是她日日扫的，那夜又扫了一遍——扫完她把扫帚立在松边，立得笔直，像替谁守着门。',
        zhongqiu: '中秋过后第二天。门里分节礼，你那份她代领回了晨课场——没有带回屋，带到了练场。她把节礼搁在场边的石头上，像供在松前。月光落在雪上，她提剑立在月光里，没有舞，就是立着。立到三更，她开口，声音极低，像怕吵了松：「问松。松不答。」她把节礼收回屋，摆在屋子正中——最显眼的位置，摆完退开两步看了看，又把素绸带解下来，搭在礼盒上。',
        chuxi: '除夕过后第二天。岁末昆仑封剑——封剑前她把十二套舞了一遍，一套一套，从迎雪舞到那套没有名目的。无名那套舞到最后一式，她停了：剑尖挑起一蓬雪，雪落在剑脊上，没有化。她在雪光里持剑立到天明。封剑的时候，她把素绸舞袖带一圈一圈缠在剑上，缠得极紧。封剑的弟子问：先生，带子怎么随剑封。她答：「带子认腕。」顿了顿，声音低下去，「腕在等。剑替我守着它。」'
    },
    'sect_leader_全真教': {
        shangyuan: '灯节过后第二天。功业房结岁账，她把账多翻出一栏——外账。外账栏素来空着，那夜记了一笔：「上元。应收：一夜。」记完拨算盘，推到一半，停了。那颗珠停在半途，一夜没有推过去。第二日这笔还在，没有销，没有讫，栏名倒改了——改成了「是夜，候收。」候收不是账房的词。她自己拟的，拟完在页脚注了极小的四个字：「格式自拟。」',
        qixi: '七夕过后第二天。她把功业日记摊开，从头核——核到三年前七夕那一页：那页记着「是夜，听人诵经一刻」。谁在诵，经是什么，日记没有录。她把三年前的日记和今年的日记并排摆着，比了很久，拨了一颗算珠，又拨一颗。两颗珠停在两个位置，没有并到一处。合日记之前，她在那页旧账的页脚添了个小注：「此笔，仍在。」仍在的账不催——账房腔说得出这句话，说不出的那半句，她关在了日记里。',
        zhongqiu: '中秋过后第二天。教里分节礼，你那份她代领回了功业房，记在日记上——「代领」两个字底下又记了一行：「不计利。」不计利，账语里是白送的意思；可她把它记在了债的那一栏。白送的东西记在债栏——全真教功业账三百年的格式里没有这一条。她没有销，在旁边批了五个字：「格式，我自拟。」批完她看着那五个字，看了很久，把小银算盘搁在日记上，搁了一夜。',
        chuxi: '除夕过后第二天。岁末封账，她把功业日记用油布包了，小银算盘收进囊——收的时候，那颗停了半年的珠子，她啪的一声推到了底。只推了这一颗。封账的人问：这一珠什么意思。她系紧囊口，答得极平：「意思是大年初一，头一笔账。」问是什么账。她把日记归架，声音从架子后头飘出来，账房腔平着，平得像结了冰：「条目——人在。」人在，不是账房的词。可这一笔，她记在了正栏最头一行。'
    },
    'sect_leader_少林寺': {
        shangyuan: '灯节过后第二天。讲经堂隔着山门望得见灯河，她夜里不点灯，隔着殿看了一夜。看到三更，她回房翻开批注经，在上元那页的眉批处落了一句：「灯下看人，比看经清楚。」批完自己读了三遍，又在这句底下缀了四个小字：「妄语。不划。」批了妄语还不划的批注，二十年，只此一条。',
        qixi: '七夕过后第二天。她给僧众讲《四十二章经》，讲到离欲那一章，讲岔了一句——两个字的位置念倒了，满座听着，都当是新的疏解。散座以后她一个人在栴檀林里立了半个时辰，回殿来，在那一句底下批了四个字：「不是口误。」批完她把经翻过去一页——下一页是空白。空白那页她没有批，只用念珠压着，压了一夜。',
        zhongqiu: '中秋过后第二天。寺里分节饼，你那份她代领了。领回来她提笔在包饼的素纸上批了一句：「此施主功德最多。」批完她对着那一句看了很久——功德最多，人没有来，两桩事对不上。那块饼她没有转送，也没有吃，用素纸重新包了，搁在批注经那页空白旁边。素纸上后来又添了两个小字：「留着。」留给谁，批注没有写。没有写，满讲经堂都知道。',
        chuxi: '除夕过后第二天。岁末少林撞钟，例是一百零八声，一声一愿。她执钟杵，撞完一百零八声，多撞了一声。司钟的弟子问：多的这一声，愿给谁。她搁下钟杵，答得极稳：「给十方施主。」夜里回讲经堂，她在批注经的岁末页批了一句：「第一百零九声，不为十方。」批完她读了一遍，这一句她没有缀小注——不必缀小注的批注，二十年，这是头一条。'
    }
};

// 每位 × 两种结局（推帖 declined / 放鸽子 stood）：Ta 开口说的第一句
var JEAL_AFTER_STATUS = {
    'sect_leader_百花谷': {
        declined: '「节过了。」她笑眼弯弯，把热茶推给你，「帖子上的字我读了三遍——『事由』两个字，写得真好，谁都挑不出错。」她把另一只杯子烫了烫，又收回去，「我不怪你。我只是从今天起得学着——茶，一个人喝才热。」',
        stood: '她看见你进来，先站起来替你拍了拍肩上的雪，动作一切如常。然后她说：「那日我把药庐的灯拨亮了些，怕你夜里来看不清路。」她坐回去，拿起药碾，「灯拨亮了些——原来不是灯不够亮，是路不通。」药碾子一圈一圈，她的手很稳，「你今日来……是路过，还是想起这儿了？」'
    },
    'sect_leader_修罗宫': {
        declined: '「坐。」她把一柄短匕拍在案上，刀尖齐齐对准你坐的方向，「修罗宫不拦客人，先讲规矩——推帖可以，账上记一笔。你来，是想销账，还是来看账？」',
        stood: '「我等了整日。」她说这话时在削一只苹果，皮不断，「暗哨劝了我三次，说——」她刀上一顿，「说你不会来了。我说：修罗宫的帖子，没人敢不回。他们说：不是不敢，是不在。」她把削好的苹果推过来，果肉一点没老，「现在你来告诉我——在不在？」'
    },
    'sect_leader_天山派': {
        declined: '「节过了。」她收剑入鞘，看了你一眼，只一眼，「你回帖说事由。剑客重信，你既说了由，我不再问。」她抱剑立在雪里，「但今日起，雪庐的门你推开之前——先想清楚，你今日是不是来『练剑』的。不是，就别推。」',
        stood: '她没提那夜的事。她只问你：「今日带剑了？」你说带了。她点头：「好。陪我走一趟双剑。」走了一炷香，你招式错了两回，她都不挑。走到尽头她收势，忽然说：「双剑最忌分心——剑错一步，人错一世。」她望着你，「你那天夜里，也是这么错的吧。」'
    },
    'sect_leader_五仙教': {
        declined: '「哟，来了。」她懒懒地支着腮，锁骨下的黑纹安安静静的，「心蛊今日也乖——它知道你把那夜给了别人，它不绕了。」她笑，「它绕了两天，第三天就不绕了。我养它十八年，它头一回这么快放手。」她把酒坛往你这边推了半寸又收住，「你猜，是它乖，还是我心里的蛊，也学着乖了？」',
        stood: '「帖子你没回。」她开门见山，妖媚的笑没撤，声音底下一寸没退，「蛊替我记着呢——那夜你的味道，混着别人身上的。」她伸出手指在你面前晃了晃，「我不查你，我懂规矩。可我这条命是押在蛊上的，蛊说没回音，我就得给自己一个说法。你现在站着的地方，是我讨说法的地方——说吧。」'
    },
    'sect_leader_铸剑山庄': {
        declined: '「来了？」他手里在锉一副镰刀，头也不抬，「推帖的措辞我让学徒查了字典——『改日』，『有事』。好，我给你讲铸剑人的道理：火候不等人。你说改日，炉子就信改日。炉子好哄，」他停了锉，抬眼，「我不好哄。你今日给我个日期，比什么都强。」',
        stood: '他把那副红漆碗筷从灶台上一端，连饭带菜走到你面前——饭是热的，菜是全乎的，一炷香前刚出锅。「坐。吃完再说。」你吃完，他把碗一收：「这是我那晚自己吃的席。」锤子往砧上一搁，「我守到落闸。落闸前我在想，是不是我这炉火，熏着你眼睛了。」他盯着你，「今日你吃饱了，该说句实话了。」'
    },
    'sect_leader_药王谷': {
        declined: '「来了？先坐，喝口热的。」他推过茶，语气温润如常，「节是过了。你的帖子我留着呢——」他真的从袖中抽出那张回帖，纸都抚平了，「留着不为难你，留个凭据。药王谷的规矩：代领的礼，挂在我的账上。」他浅褐的眼弯着，「钱是小事。你听我说这一句是大事——往后你忙，我这边就挂不上账了。挂不上账的意思，就是你不来了。你品品。」',
        stood: '他给你诊脉，一言不发，诊完收手。「脉浮，心不定——不是你的脉。」他说，「是那晚我等的脉。」他起身把窗推开条缝透气，背对着你，「我等了一晚上。中途还替药圃收了回苗，怕人看出我在等。」他回过头来，温润地笑，「如今你站在这儿，我该说点什么。可为医者知道：有些话跟病一样，说出来好得快，不说——」他顿了顿，「就只能慢慢熬。你选哪种？」'
    },
    'sect_leader_茅山派': {
        declined: '「来了。」他把茶斟了两盏，推你一盏，自己那盏没动，「卦我昨儿起过了，问你来不来。卦说：来。」他看着那盏没动的茶，「卦准了，所以我今日不卜你，问你。你自己报——那夜你的事，是什么事？茅山观星二十年的耳朵，听过太多谎。谎我听得出来。我就是想听你自己说。」',
        stood: '符阁的灯亮着。他坐在灯下，面前摆着那张没焚的卦纸，见你进来，用镇纸把卦纸压平，才开始说话：「我卜了一辈子，替人断生死。那夜我头一回盼卦不准——灯到三更，我反而盼你不来。」他指尖压着镇纸，「你今日来了。那我也把盼来了的实话给你：茅山的门可以夜夜替你开。但那本卦簿，我打算誊一页副本。誊给谁、留多久——你拿话换。」'
    },
    'sect_leader_金刚宗': {
        declined: '他在扫塔前最后一级台阶。见你来，让开半步，继续扫。扫完把扫帚搁好，才开口，声音低哑：「帖子看了。看了五遍。」他望着塔门，「五遍不是不信。是盼着哪一遍，字能变一变。」他侧身让开塔门，做了个「请」的手势，「进来说话。塔里安静——安静地方说的话，算数。」',
        stood: '塔门开着。他在塔中坐着，面前木牌翻到正面。他见你进来，把木牌往前推了推——正面那三个字，他指给你看：「闭口禅。」然后他合十，破着禅开口，一字一句：「那日我守着塔门。有人进塔，我抬头；不是施主。又进一人——又不是。」他闭目，「老僧今日只问一句——施主那一夜，是身不由己，还是心不由己。此题难，可以回去想。但答案，老僧要等到。」'
    },
    'sect_leader_峨眉派': {
        declined: '「帖子你推了。」她端坐着，声音端方，「事由我看了。戒律不问事由真假——只数你缺了几回。」她推过来一盏热茶，推得不轻不重，「茶是斋堂的，我给你留的。喝不喝随你。留着，是我的规矩。」',
        stood: '她见你进来，先看了一眼天色，再看你。「那夜金顶落了雪。」她说，「我巡夜巡到三更，又多巡了一更——不为查你。为我自己。」她把戒尺往案上一搁，搁得很正，「坐。站着听训的规矩是对弟子立的。你坐。」'
    },
    'sect_leader_华山派': {
        declined: '「来了？」他笑着起身，像全然没这回事，「帖子你推了，推得客气。华山的账上，我替你记了一笔『事忙』——」他把茶推过来，笑意松松的，「账好记。雨夜那只凳子，不好记。」',
        stood: '他在账房等你。见你进来，先笑了：「我猜你今日来。」他摆手，「别多想，我不会卜——账上写的。你欠我一夜，华山欠我一山，两笔我都没催过。」他给你斟茶，斟得很满，「今日也不催。就聊一句——那夜的雨，你那边，下没下？」'
    },
    'sect_leader_唐门': {
        declined: '「节过了。」她头也不抬，在擦银针，「你回帖的事由，我让晚辈抄下来了——字写得好，一个错处都挑不出。」她把针收进囊，才抬眼，嘴角还挂着点笑，「唐门不留客。只是针替我留——从今日起你来，我不验你的茶了。针省着点用。你的盏，我验不动。」',
        stood: '她见你进来，先笑了一下，笑得很亮，亮得刻意。「来了？」她把手里的东西搁下——是缝到一半的一双手套，「那夜我在炉边温了一壶解药。温着，不是给你——人不来，药就只能温着。」她把壶盖扣回去，扣得轻，「今日你来了。好。先喝盏茶，让我验验针。针尖干净，咱们再说那夜。」'
    },
    'sect_leader_武当派': {
        declined: '「帖子。」他先开口，还是慢，「你推了。回帖我读了三遍。」他给你斟茶，斟得满，「第三遍，把『改日』两个字，读出来了。」他放下茶壶，「武当不催人。钟照撞，茶照满。只是白石那副数目——我替你收起来了。」',
        stood: '他见你进来，没起身，只把身边的蒲团拍了拍，请你坐。你坐下，他才说：「那夜，我坐在这儿。」他望着真武殿的门，「门开了三回。每回我都抬头。」停了停，「第三回，是月亮进来。我把月亮，当成了人。」他转眼看你，「这个错，我记着。今日你来了——替我销了它。」'
    },
    'sect_leader_蓬莱派': {
        declined: '「节过了。」她合上图录，声音平得像在报潮，「你的回帖我收进图录匣了。事由那一行，我照抄了一遍——抄的时候数了数，十六个字。」她抬眼看你，「十六个字，没有一个是日子。观汐台只认日子。你几时补我那一天，几时来销这一笔。」',
        stood: '她见你进来，先看了一眼台外的潮线，再看你。「那夜我守在台上。」她说，「亥时的潮回了两回——头一回我抬头，是巡夜的师弟。第二回，我没抬。」她翻开图录，那一页记着节夜的潮，潮信极准，页脚却空着一行，「页脚留了一行，留给你上岸的时辰。空了一夜。今日你来了——报时辰罢，我补录。」'
    },
    'sect_leader_逍遥派': {
        declined: '「来了？」他躺在坛边，酒盏盖着眼睛，「帖子你推了，推得文雅——事由那四个字，我品了三日，品出个『言之有理』。」他把盏拿下来，笑还挂着，「逍遥派不催人。只是酒仙池的规矩，今日新立：推帖的人，往后斟酒——斟七分。」',
        stood: '「那夜我在石桌边坐到四更。」他斟了杯酒推给你，语气懒散得像在说别人的事，「等人这种事，庄生早写透了——『相濡以沫，不如相忘于江湖』。我背了一夜。」他给自己也斟上，盏却没举，「背到天亮才明白：庄生是等的人没来，才说这话的。你今日来了——这句话，当我没背过。」'
    },
    'sect_leader_恒山派': {
        declined: '「节过了。」她搁下笔，起身见礼，温静如常。「你的回帖我收了。事由那一行，我抄了一遍——抄的时候数了数，十六个字。」她替你把一盏白云草茶温上，「十六个字，没有一个是日子。白云庵不问事由真假，晚课的木鱼只认拍子。那一夜，它少敲了一声。你几时报我一个时辰，我几时把那一声敲回来。」',
        stood: '她见你进来，先替你掸了掸肩上的雨——你肩上并没有雨，她掸得极轻，像掸一页经纸上的浮灰。然后她说：「那夜，庵门没有落闩。」她的声音很轻，「晚课前我跟知客说：有人叩门，不问名姓，先引到避风处。」她坐回去，把经纸抚平，「后来叩门的是风。风我引了进来，坐了半夜，喝了一盏凉茶。今日你来了——那半盏凉茶，我换盏热的。话，你喝了茶，慢慢说。」'
    },
    'sect_leader_嵩山派': {
        declined: '「节过了。」他把卷宗搁下，语气像在念条文，「你的回帖，归档编号我查过了：事由一栏，两个字——『有事』。」他把茶推过来，斟得满，斟得特别平，「执法堂核档，讲来路、口气、日子三条腿。『有事』两个字，来路不明，口气未核，日子空白。三条腿全缺。」他看着你，「但我没有驳回。回帖存了档。存了档，就是没有结案。结案——你自己来。」',
        stood: '他在堂里核档，见你进来，笔没有停，核完那一行才抬头：「那夜，执法堂的灯亮到五更。」他说得极平，「不是等你——历年重核，节令之夜，执法堂的老规矩。」他把笔搁下，「重核到三更，我多核了一目：山门夜册，入山一栏，空白。空白我盯了一夜。」他把茶壶往你那边推了推，「坐。茶自己斟。今夜的册子，你当面把那一栏补上。」'
    },
    'sect_leader_泰山派': {
        declined: '「节过了。」她在火坛前拨炭，不回头，火钩拨得特别响，「你的回帖，师弟念给我听了。词是好词，挑不出错——挑不出错，最气人。」她转过身，脸上的光全收了，话照旧直，「泰山的人不藏话。那夜我的火烧得特别平。越平，我越拨。拨到天亮，火坛的炭全叫我拨成了灰。」她把火钩往地上一拄，「今日你来了。好。那夜的档，你自己说——记什么。」',
        stood: '她见你上顶，先看天，再看你，然后指了指火坛左边——那块石头擦得干干净净，没有霜。「那夜我摆了两盏茶。」她说，声音不低，「一盏我喝了。一盏放到凉——凉茶我没有倒，端下山，浇了山门口的老松。」她扛起火钩，「别问为什么浇老松，问就是你矫情。今日你来了——碗我洗了，茶重新沏。话你自己说：那夜，你的事，是什么事？」'
    },
    'sect_leader_青城派': {
        declined: '「来了？」她在架前擦茶夹，头也不抬，话照旧快，「回帖我收了。事由两个字，我读了三遍——读得都会背了，越背越觉得工整。工整得，挑不出一分真。」她放下茶夹，抬眼，「焙房的茶，你不来的那夜，我多炒了一锅。炒过火的，自己封了。别问味道。」她把一只新纸包推过案来，「这包是新炒的。喝了，当面告诉我：那夜的事，值不值我毁一锅茶？」',
        stood: '她见你进焙房，手上的动作顿了半拍，随即照常——把案边的小凳拉出来，摆好，摆得特别正。「坐。」她给你斟茶，斟得特别满，「那夜我摆了两只碗，等到灶火自己熄了。火熄的时候我想，好，省柴。」她说得很快，快到末尾有点空，「茶今日重沏了。碗还是那两只。你端着——还认得它的温度吧？认得，就把那夜的事，直说给我听。」'
    },
    'sect_leader_衡山派': {
        declined: '「节过了。」她坐在台上，胡琴横在膝头，弓没有拉。「帖子。」她说了一个词，停了一会儿，雨落在字与字之间，「收了。事由——没问。」她终于抬眼，眼神是温的，温里压着极平的东西，「半阙，那夜照拉。停的地方，照停。」她的弓毛在弦上轻轻压了一下，没有出声，「只是那夜的气口，比平日长。长多少——雨知道。」',
        stood: '她见你上台阶，没有起身，只把台角那只蒲团朝你推了半尺——推得极慢，像怕惊动什么。「那夜。」她开口，还是那么几个字，「灯，亮到天明。」她望着雨幕，「弓拉了三遍半阙。第三遍，错了一音。」她顿了顿，「十年，头一回错音。错给那夜的。」她终于转头看你，眼睛不躲，「今日你来了。曲，重新拉给你听。这一遍——你替我听稳不稳。」'
    },
    'sect_leader_丐帮': {
        declined: '「节过了。」他在粥棚摞碗，见你坐下，把一只温着的碗搁在你面前——搁得特别稳。「你的回帖，三日前到讯房。」他在你对面坐下，语气平得像核签，「来路：你亲笔；口气：『有事』；日子：节夜。」他端起自己那只碗，没喝，「三条腿齐整——好档。不好的是，那夜粥棚我这一段书，讲到关窍，自己跳过去了。满棚等下回。」他抬眼，眼里没有笑，「下回，就是今日。你说。」',
        stood: '他在讯房补衣，见你进来，针没有停，缝完那一针才抬头：「那夜，粥棚给你留了一只碗。」他说，声音很平，「老师傅问了三遍：收不收。我说，不收——消息三条腿，你那条腿没到，碗就不能收。」他把针别回衣襟，把百衲衣叠了一折，「天亮我自己收的碗。粥凉了，我喝了。」他抬眼看你，「讯房的规矩：过夜的档，必有因。那夜的因——你今日来了，正好。坐。茶是温的，话慢慢说。」'
    },
    'sect_leader_阎罗殿': {
        declined: '「节过了。」他搁下笔，把你的回帖推到案中央，语气像在念档，「事由一栏，我核过了。两个字。」他给你斟茶，斟得满，斟得特别平，「档房核档，核三样：来路、日子、事由。你的回帖——来路是你亲笔，日子是节夜，事由，『有事』。三样齐整，是好档。」他抬眼看你，「只是齐整，不等于对。这一档我复核了三遍。第三遍，添了个小注。」他把纸翻过来给你看——纸角两个小字：未定。「未定的，你自己回来释。」',
        stood: '他在核档，见你进来，笔没有停，核完那一行才抬头：「那夜，档房的灯亮到五更。」他说得极平，「不是等你——岁末重核，节令之夜，档房的老规矩。」他把笔搁下，「重核到三更，我多核了一目：来档的册子，你名下那一栏，空白。」他顿了顿，「空白，我又核了一遍。」他把茶壶往你那边推了推，「坐。茶是温的。今夜的册子——你自己，把那一栏补上。」'
    },
    'sect_leader_血手门': {
        declined: '「节过了。」她搁下药碾子，给你倒了碗水——碗沿的豁口朝着她自己那边。「回帖我收了。事由那一行，我读了三遍——写得很工整。」她说，语气像报数，「越工整，越像方子上抄的。方子上抄来的字，都管用；抄来的事由，不管用。」她坐回药匾前，「我不怪你。我只是从今天起学着认一件事：节，一个人过，叫过日子。那夜我翻了三次白药——翻到第三次我才明白，我等的不是药干。」',
        stood: '她见你进来，先抬头看了一眼灯——素灯的火比平时旺。「那夜我给素灯多添了一回油，火苗比平时亮。怕门口的路黑，你寻不着。」她坐回去，接着翻药匾，「火亮了一夜，没有人来。天亮我回想了一遍——不是灯不够亮。是路不通这儿。」她的声音还是平的，平里有一道极小的缝，「你今日来……是路过，还是想起这儿有间庐？」'
    },
    'sect_leader_飞蝎坞': {
        declined: '「节过了。」她在分窝，竹钳敲得特别响，不回头，「你的回帖，坞里人念给我听了——词是好词，挑不出错。挑不出错，最气人。」她转过身，脸上的光全收了，话照旧直，「沙漠的人不藏话。那夜我坐在蝎房屋顶看远处的灯火，看到灯一盏一盏熄——金蝎伏在我手边，尾钩竖了一竖。」她下巴一抬，金蝎在她肩头上翘了翘尾钩，「今日你来了。好。那夜的账，你自己直说——怎么记。」',
        stood: '她见你进坞，先看天，再看你，然后一脚把凳子踹翻——踹翻了又扶起来，摆正，摆得特别齐。「那夜我摆了两碗沙水。」她说，声音不低，「一碗我喝了。一碗放到天亮——沙水搁一夜就澄了，澄了我也没倒，喝了。」她抄起竹钳接着分窝，分了两个，啪地一撂，「别问为什么喝澄了的，问就是你矫情。今日你来了——沙水重新兑，碗重新摆。那夜的事，你自己直说：是什么事？」'
    },
    'sect_leader_烈日教': {
        declined: '「节过了。」她立在龛侧，圣女腔先出来，特别慢：「回帖收了。事由，按仪轨，记档。」一句说完，她挥手退了侍立的祭司——退得特别快，门一合，吐槽垮下来：「按仪轨记档，你知道记的是什么吗？是仪轨册上，你那一栏还在『客』字底下——客的回帖，连事由都不必核！」她指着圣火龛，眼睛发亮，亮底下压着东西，「那夜我在风口站得比仪轨久了一炷香。风大，火稳——火稳最气人：我八年没让风搅过火，那夜我居然盼风大些。风大了，我望教外的灯火，就有借口了。」她瞪着你，「今日你来了。直说：那夜的事由，到底是什么事。」',
        stood: '她见你进小院，正在剪灯——灯剪得极短，火苗只有豆大。她没有抬头，圣女腔先出来：「远客至。」三息之后绷不住，剪刀搁下了，语速唰地回来：「那夜，这屋的灯亮到天明。不是我等你——是我守戒，圣女的夜火之戒，恰好那夜当值，恰好。」她坐到窗边，声音慢慢低下去，「守到三更，我做了一件没有仪轨的事：我把灯从案头挪到了窗台。挪完我想了半天，照什么呢？窗外没有路，也没有人。」她抬眼看你，灯下眼睛特别亮，「今日你来了。灯，我挪回案头了。那夜的事——你自己报。」'
    },
    'sect_leader_天龙教': {
        declined: '「节过了。」她坐在传声房，铜镜牌搁在案上——她在等你。（用香主的调子）「客之回帖，照教规，收讫。事由，记讫。」传完她把册子一推，干脆垮出来：「教规教规——你这一条，都快传成教规了，你知不知道！」她拿起铜镜牌翻了个面，声音低了半调，「那夜我在传声房传完令，自己给自己添了半句——添的什么，你猜。（用云婆婆的调子）『娃儿，灯还亮着。』」传完她看着你，眼睛弯着，笑没有到底，「婆婆的灯是给娃儿留的。我那半句给谁留——传声房的规矩，传声不问根。可你这一条，不问，我睡不着。今日你来了。那夜的事由，你自己传——用你自己的调子传。别人的调子，我听腻了。」',
        stood: '她在廊下擦铜镜，见你上来，擦镜的手没有停。（用黑袍知客的调子）「客至。」传完她把镜子收了，干脆回来，却不如平时亮：「那夜，我在外坛廊下等到亥时。等，不是教规——教规说传声房传令，不等人。」她拍拍腰间铜镜牌，「等到亥时，我练了一句话，练了三遍——第三遍连气口都严丝合缝。你猜练的什么。」她没等你答，用你的调子传了出来：（用你的调子）「檀望舒，今夜我晚些到。」传完她先笑了，笑完声音低下去：「你从来没有说过这句话——是我替你练的。练完，擦掉了。擦掉，不是忘了：传声房的耳朵，听过的调子忘不掉；没有听过的话——记得更牢。」'
    },
    'sect_leader_神机门': {
        declined: '「节过了。」她搁下校准笔，把一只黄铜小齿轮的匣子推到你面前——匣盖开着。「回帖读了。事由一栏，两个字。」她的话像报数，尾音却有一点游隙，「两个字，算不出漂移量。漂移要算，得有日子——你的回帖里没有日子。」她合上匣子，合上又打开，「这副齿轮送你。齿数二十七。你回来的日子，我拿它算。算的依据不止齿轮——」她抬眼，耳根红着，声音低了半格，「机关雀也认。它滴答的拍子，从我上弦的手上传过去。你过节那夜，我的手乱了拍，它替我乱了一整夜。」',
        stood: '她见你进来，先起身替你拉了一只凳子——拉完用尺量了量凳子与案的距离，量完才请你坐。「那夜我在门里的钟台上。」她说，报数一样报，报到中间空了一拍，「钟打亥时，打一次，我抬头一次。打了三次，我抬了三次。」她把校准笔拿起来，又搁下，「第三次，我没有等钟打。我先敲了——提前一刻。提前敲，是想叫它替你报个到。」她把笔搁正，看你的眼神像核对一处漂移，「钟台提前，神机门建门以来只有过两个人。头一个是造钟的祖师。他为什么提前，册上无事由。」她顿了顿，「今日我补上了。事由两个字，你自己猜——猜不出，我念给你。」'
    },
    'sect_leader_霹雳堂': {
        declined: '「节过了。」他在防火棚里绑引信，见你来，手停了，先说了一句极轻的话——你俯身才听清：「回帖，读了。」说完他把那根引信绑完，绑完才续上：「……我说了。我真的说了。」他把方子册翻开，批注页朝你——那页有一行流水账：「是夜，爆竹一挂。响，好。听者，无。」他合上册子，从布囊里取出那根最长的引信，盘着，没有用。「长引烧得慢。」他盯着它，「慢，是不催人。那夜我想点它一回——点了，天上开一圈光。你看见了，我批注就只用两个字。」你问哪两个字。他把引信收进布囊，系得极紧，声音轻到灯花底下：「……看见了。」',
        stood: '他见你进来，先把棚里的灯拨亮了一分——防火棚的灯素来只有豆大。「那夜，我在棚里。」他说得极轻，你要屏息才听得全，「戌时我放过一响爆竹。不是号令——号令的爆竹有三条章程，那一响，没有章程。」他取过方子册，翻到那夜的批注：四个字，「亥时，人不。」。「写的是『人不到』。」他把册子推过来半寸，耳根红着，「写到一半，划了。改成五个字。五个字，超了批注四字的规——超了，也认了。」你凑近灯看：那五个字写得比哪一行都轻，轻得几乎浮在纸上：「人，为何不来。」'
    },
    'sect_leader_天书阁': {
        declined: '「节过了。」他合上卷，把你的回帖搁在案中央——搁完用镇纸压住，压得端端正正。「回帖，讎过了。三遍。」他的话短得像批注，「一遍：事由，两个字。二遍：两个字，不讹。三遍——」他提起镇纸，又压回去，「三遍讎纸。纸是好纸。好纸写两个字，惜。」他给你斟了盏茶，斟的手极稳，「天书阁校讎，讎字不讎心。只是今夜我批了一条，四字以内——『纸惜』。」他看着你，灯花在他眼里爆了一下，「意思，你自己讎。讎不出来，存疑。存疑，不改。」',
        stood: '他在校讎房核卷，见你进来，笔没有停，核完那一行才抬头：「那夜，校讎房的灯亮到三更。」他说得极平，「不是等你——岁末重讎，节令之夜，校讎房的老例。」他搁下笔，取过一卷书推给你——正是页角补过的那卷。「重讎到三更，多讎了一条：借阅册末行。」他翻开册子，指给你看，你名字那一行小注：某年某日借书一册，未还。「那夜这一行我讎了三遍。讎完批了两个字——」他把册子转过来。页角新批的字极小：「不催。」他耳根有一点红，话照旧短：「不催，不是讎语。讎语是『存疑，不改』。你这一条——」他把剑归背，动作很慢，「不是疑。是笃。笃的条，不催。等人自己还。」'
    },
    'sect_leader_大隐阁': {
        declined: '「节过了。」他蹲在台阶上，手里一串糖葫芦——没吃。见你来，他先晃了晃签子：「来得巧。这卦立了两日，没人陪我对数。」他把你拉到台阶上坐下，重新起卦，数一颗，递你一颗，数到剩两颗，手停了。「剩一颗，诸事宜静。剩两颗——」他想了想，「卦辞里没有。卦辞里没有，就是天也不知道怎么办。」他把两颗里的一颗摘下来塞给你，签头那颗风干山楂留着，不吃：「你的回帖我读了。事由两个字。两个字的卦，起不得——起了是大凶。大凶我不怕，我怕的是这个。」他指了指签头那颗，「莫尽。你那夜，我差点把它吃了。差点，就是没有。没有，就还有下文。」',
        stood: '他在台阶上，身边立着两根空竹签——签上的山楂全吃尽了，连签头那颗也没剩。见你进来，他盯着你看了三息，忽然笑了：「来了。」笑完他把空签拔起来给你看，干饭腔没有出来，出来的全是半仙腔，端得极正：「那夜我立了两根签。一根我的，一根你的。我的那根，我吃了。你的那根，我也替你吃了——替吃，就是替卦。替人担卦，损。」他把空签插回台阶缝，插得端端正正，「损也认了。那夜的卦象，今日可以告诉你：剩一颗，大凶。大凶我吃进肚里了——凶在我这儿，不在你那儿。」他起身拍拍衣摆，走了两步回头，「明年过节，我立两根整的。这回你自己吃。签头那颗留着——莫尽。这两个字，你替我记着。我记了二十年，近来，总想分一半给人记。」'
    },
    'sect_leader_侠隐阁': {
        declined: '「节过了。」他合上附页，把你的回帖搁在档案中央——搁完批注腔就来了，又快又平：「来路：你亲笔。日子：节夜。事由：两个字。」他抬眼，「三样齐整，好档。不好的是——那夜我巡廊，在近手那格前多站了一刻。站的一刻没有录。不录的时辰不入档。」他顿了顿，批注腔裂了一道缝，「不入档的，反而忘不了。」他把回帖推回你面前半寸：「今日你来了，正好。这一档你自己批。批语长短不拘——档廊四字的规，在你这儿，我破。」',
        stood: '他在档廊理附页，见你进来，笔没有停，写完那一行才抬头：「那夜，档廊的灯亮到五更。」他说得极平，「不是等你——岁末大清点，节令之夜，档廊的老例。」他搁笔，取出一册附页翻开，朝你——那夜的记录：「亥时，巡廊一遍。子时，巡廊二遍。丑时——」丑时后头没有字，只按着一个极小的指印。「三遍没有走。」他说，「坐下了。坐在近手那格前，握着附页。握的那页是空白。」他合上附页，把茶壶往你那边推了推，「空白握了半个时辰。握空白页做什么，档规里没有这一条——你来了，正好补录。怎么补，档廊不问。你写，我核。核完，这一册，归近手。」'
    },
    'sect_leader_天涯海阁': {
        declined: '「节过了。」他立在驿亭案后，见你进来，先躬身半度——躬完双手捧起案上的回帖，呈给你看：「回帖，收讫。事由，核讫。两个字。」他把回帖收进案头第一格，收得极郑重，像收一道从此不再启封的公文，「驿亭不问事由。驿亭问站名——」他取出一张新路引展开，站名栏空白，「这张引，是那夜写了一半的。写到一半，停了。停的原因，册上不录。录了就不是公文，是私笔。」他把笔递给你，笔杆调了个头，公文腔里透出那点颤：「站名你写。写到哪儿都成——写完，归期栏里，给我留一个日子。日子没有，就写『候』。候字的格式我自拟过了。拟了三年，头一回敢用。」',
        stood: '他在驿亭装订旧路引，见你进来，装订的手没有停，装完那一沓才抬头：「那夜，驿亭的灯亮到亥时。」他说得像念站名一样平，「不是等你。驿亭不等人——驿亭等时辰。那夜我等的是时辰：亥时三刻。你从前说过，节夜必归亥时。」他搁下针线，从案底取出半枚铜符——断口朝着你，「三刻过了，我把铜符攥了一回。驿站旧例：符攥手，是留人。」他把铜符搁在案上，推到你的手边，躬身半度，公文腔，末一个字颤了：「坐。茶温着。那夜的站册空了一栏——归期。你今日来，正好补。补完，符你收着。收符的人走夜路，驿亭替他点灯。这一条不在公文里。这一条，我认。」'
    },
    'sect_leader_大旗门': {
        declined: '「节过了。」他在帐里缝旗，见你进来，针没有停，缝完那一针才抬头，两个字：「坐。」你坐下，他取出名册翻开——你的名字底下，那日他代记着一笔：「节夜，有事。」他指着那两个字：「事，何事。」军中腔，一句是一句。你顿了顿，他把名册合上了：「报不出，就不报。军规：报不出的，先记着。」他打开铁皮针线盒，取出最长那根针，就着灯穿线：「记着的事，缝上。缝上的事，能拆。」他抓过你的护腕，针落进第三十八个针眼——那枚空针眼，今夜走了线，一针，咬线，「拆不出来的，」他把护腕按回你手里，按得极实，话最短，「才叫记着。」',
        stood: '他从旗杆台下哨，见你进来，先看天，再看你：「那夜，我在台上。」军中腔，像报数，「灯看到三更。三更灯灭，我又站了一更。」他带你进帐，倒了碗热水塞给你，才继续：「站岗不是我的岗。我的岗是这个。」他坐下，把铁皮针线盒搁在膝头打开——针码一排一排，最长那根的位置，今夜是满的，「那夜台上，我只想了一件事：护腕要是松着回来，我加固。要是没回来——」他合上盒，咔的一声，「我把针线盒带上旗杆台。盒子在哪儿，人在哪儿。人在哪儿，等。」他看着你，耳根红着，话还是短：「坐。水喝。话，慢慢报。军规没有这一条——我定的。」'
    },
    'sect_leader_铁掌帮': {
        declined: '「节过了。」她攥着那支素坯哨，见你进棚，没有收哨，也没有上凶脸，只说了一句：「回帖，读了。」回帖折成方块，夹在哨语册子的封皮里——折痕都发白了，分明取出来读过许多遍。「事由，两个字。」她的指尖点了点那两个字，「两个字，搁在册子上，连一声哨都不算。哨是一长一短，也是两个字的意思——可哨有人应。」她把回帖塞回封皮，压平，凶脸这才回来，声音却不凶：「我不怨你。我怨我这双耳朵——那夜把苇子风听成了脚步声，听了三十几回。三十几回，册子上有账。」',
        stood: '她见你进苇滩，先看天，再看你，然后一脚把脚边的石子踢翻——踢翻了又弯腰捡起来，揣进兜里。「那夜我摆了两只碗。」她说，声音不低，「一只盛汤，一只空着。空的没有倒扣——正摆，等人来盛。」她攥着素坯哨，哨身的汗印子发亮。「亥时过了。汤凉了，我喝了。空碗收起来之前，我对着它吹了一声——两声低回。那一条，册子上写的是『没事，就是想吹一下』。」她终于抬眼看你，凶里的水光没有再藏，「骗人的。今日你来了，汤重新盛，碗重新摆。空的那只归你——帮里的规矩：碗在谁手里，汤给谁盛。这一条今日立的，谁也不许改。」'
    },
    'sect_leader_昆仑派': {
        declined: '「节过了。」她收剑立在雪里，看你的眼神像起势一样直。「回帖读了。事由，不问。」她说得像报舞的名目一样平，「剑客不问事由——问式。那夜我舞了一遍问松。舞完，一式没有岔。」她按了按腕上的素绸带，「没有岔，可是带子多绑了一圈。多绑，不是腕冷。」她侧身让开雪坎那条道——道是她扫出来的，扫得笔直，直通第三株松，「今日你来了，正好。晨课的舞，你看。看的不是式——式我自己校得着。看的是，」她顿了顿，雪光落在她脸上，「雪坎边站了人，我的剑意，堵不堵。」',
        stood: '她见你进晨课场，起势的手没有停，舞完那一式才收剑：「那夜，我在这里立着。」她说得极平，「没有舞。立着，不是晨课——那夜我破了晨课。破课等人。」她把剑归背，从场边石头上取过节礼递给你——礼盒没有开，盒上搭着那条素绸舞袖带，叠得方方正正。「带子解了三回。三回都重新绑上了。」她耳根在雪光里红着，语气还端着平，「绑，是怕你不来。解，是怕你来。三回之后我明白了——带子无罪。罪在舞的人心里有式，式里有人。」她把带子从盒上拿起来，绑上你的腕，绑得极紧，「从今日起带子归你。绑完了——晨课的时辰，你立在雪坎就好。立着，就是报了名。舞，我来。」'
    },
    'sect_leader_全真教': {
        declined: '「节过了。」她合上日记，把你的回帖搁在案中央——搁完拿小银算盘压住，压得极正。「回帖，核了。事由，两个字。」她账房腔又平又快，「功业账不核事由。核日子——日子是节夜，账上有。」她拨了两颗算珠，拨完停了：「那夜我把这颗珠拨了半个时辰。半个时辰的珠不入账。不入账的珠，账房的语里没有名目。」她抬头，账房腔里裂了一道小缝，裂了又按回去，「我自拟了一个——『停珠』。停珠不结账。不结，是等人。今日你来了，正好：这笔停珠的账，你自己结。怎么结我不干涉——你结，我认。你结多少，我记多少。你的那一栏，从来只进不出。」',
        stood: '她在功业房结账，见你进来，拨珠的手没有停，结完那一行才抬头：「那夜，功业房的灯亮到三更。」她说得平，平得像报账，报着报着空了一拍，「不是等你——岁末结账，节令之夜，功业房的老例。」她搁下算盘，把日记翻开朝你——那夜的页：「亥时，结账。子时，结账。丑时，珠，停。」三行，丑时后头没有数目。「丑时起，数结不动了。」她说得极轻，「数结不动的账房，二十年头一回。结不动的缘故我核了。核出来的结论没有入账——入了账，就要写你的名字。」她斟了茶推给你，「坐。茶温。今夜的账，你陪我结。你报数目，我拨珠。两个人的手——」她看了看自己的手，手很稳，「两个人结，才不抖。」'
    },
    'sect_leader_少林寺': {
        declined: '「节过了。」她把批注经合上，你的回帖压在经案中央，用念珠压着——压得极正。「事由两个字，贫尼批过了。」她先合十：「阿弥陀佛。」佛号念完，毒舌跟上：「批的是：字圆，笔稳，无一是真。经上管这个叫巧语——巧语如绸，裹得严实，裹的人自己先信了。」她把回帖往你面前推了半寸：「今夜不骂你。只一桩功课：你把事由念一遍，念完批给贫尼听——『事由』两个字，几个字才抵得过一个真字。批得贫尼服了，这页就算圆了；批不服——」她顿了顿，念珠拨了一颗，「就悬着。悬着的批注，贫尼天天看。」',
        stood: '她见你进来，手里的念珠正停——停得极突兀，像拨了一整夜。「那夜，贫尼在栴檀林里站到三更。」她没合十，也没念佛号，话说得平平，「风大，珠拨了一遍。拨到最后一颗，给自己立了一桩功课：数到头一颗，山门口再没有人，回殿销一句话。」你问销哪一句。她的目光落在经案上批注经的那页空白上，落了一息，收回来：「批不下去的那一句。等人是贫尼的本事，销句是佛的本事——那夜贫尼本想认输一回。」她收回目光，毒舌归位，毒得很薄：「你没来，好在贫尼数珠数得慢。你今日来了——两桩好，你自己挑一桩认。」'
    }
};

// 有实证「那夜你陪了别人」时追加的一句（{rival} 由账本 spent 记录代入）
var JEAL_AFTER_SPENT = {
    'sect_leader_百花谷': '「对了，你的『事由』我后来知道了。」她仍在碾药，声音很平，「{rival}那夜的节，是你陪的。药庐也听得到风声——你不必接这句。有些话碾着碾着就碎了，正好。」',
    'sect_leader_修罗宫': '「还有一笔，一并记了。」她指尖划过那页账，停在一行，「那夜的节，你在{rival}处。」她合上簿子，铁钉被她按得咔了一声，「修罗宫不抢人，修罗宫记账。你两头逛的那一夜，两头都记得你——很好。都记得，就都别忘了。」',
    'sect_leader_天山派': '「山下那夜的灯火，雪山看得清。」她望着远处，声音平平，「你在{rival}那边的灯下。」她收回目光，落在你脸上，「不必解释。剑客看见的就是看见了的。我只再问一遍那句老话——你今日推雪庐的门，是哪把剑引你来的？」',
    'sect_leader_五仙教': '「那夜你身上两种味道缠在一处。」她指尖点了点自己心口，笑意艳艳，「{rival}……名字，心蛊报给我的。」她把酒坛往你手里一塞，「拿着，替我抱着。它认得你手温，你抱一会儿，它今日就安静一会儿——它安静了，我才问得出那句：你拿我当什么？」',
    'sect_leader_铸剑山庄': '「那夜的节，你在{rival}那儿过的。」他把双镰拎起来看了看，刃口对着光，「我打这副双镰的时候想明白了：铁能开双刃，是因为两边都在一炉里烧过。」他把镰放下，锤子点着砧边，「你两头都得给我烧着。哪一头凉了，我这炉子，就只烧一头了。」',
    'sect_leader_药王谷': '「那夜的礼，我是从{rival}那边听说你在的。」他把账本合上，笑容一丝没变，「巧了。你那晚若真病着，我这边脉案还空着——如今看，脉案得添一栏：『另册』。」他把笔搁正，「别多心。药王谷的『另册』，是给惦记得起的人立的。你现在，还进得去这个册。」',
    'sect_leader_茅山派': '「那夜的卦我重起了一遍。」他把卦纸转过来给你看——「分」字旁边添了个批注，「应验了。你在{rival}处。」他语气平静，「茅山断卦二十年，判人只判一句：卦不欺人，人自欺。」他把卦纸推近半寸，「如今你来了——要么把这页撕了走，要么坐一夜，把『自欺』两个字，从你命里批出去。」',
    'sect_leader_金刚宗': '「那夜，你与{rival}上山，从我塔前过。」他扫帚停在那一级台阶上，「老僧在塔里，听见两个人的脚步。」他把扫帚立正，合十，「台阶一人宽。往后你们要一并来——老僧就把这塔前，修宽些。若各来各的……」他没说完，转身接着扫他那一级台阶。',
    'sect_leader_峨眉派': '「还有数目要对。」她声音平平，「那夜的节，你在{rival}处。金顶望得远——望不见人，望得见灯。」她把名签收进袖中，收得端端正正，「我不问长短。戒律只记一笔：你的灯，那夜没点在峨眉。」',
    'sect_leader_华山派': '「另有一笔，我得对一对。」他翻开小簿，指在一行上，笑意还挂着，「那夜你在{rival}那儿。华山的账房消息灵——不是打听，是账自己走到我案头的。」他合上簿子，「我不记恨。我记账。记恨是公款，记账——是私账。」',
    'sect_leader_唐门': '「另——那半份药气，我后来辨出来了。」她仍在擦针，声音很平，「那夜的节，你在{rival}处。唐门的针认药气，不认人。」她把针收进针囊，扣上，「不必解释。只提醒一句：喝了别人的茶，记得先验针。伤在别处——唐门的解药，贵得很。」',
    'sect_leader_武当派': '「另一个数目。」他声音还是平的，「那夜的节，你在{rival}处。山门望得见山下的灯——我数了。数到你那对，停了。」他给自己斟了盏茶，没喝，「不必解释。钟撞过了，数目数过了。我只问一句：往后你上山——赶在钟停之前。」',
    'sect_leader_蓬莱派': '「另一个数目。」她翻开图录，指尖停在页角那一栏，「那夜的节，你在{rival}处。海上的灯，观汐台望得见——我数到第三盏，停笔了。」她合上册子，声音照旧平，「不必解释。潮信记的是实数：那夜你的灯，没点在蓬莱。这一笔，我录得比哪一笔都清楚。」',
    'sect_leader_逍遥派': '「另有一盏。」他晃着酒盏，笑吟吟的，「那夜的节，你在{rival}处。消息是酒送来的——天下的酒一个味，独你那夜的盏，隔着一座山，都是别家的香。」他仰头饮尽，把盏倒扣在坛盖上，「不必解释。我只是从那夜起改了个规矩：你的盏，往后我亲手洗。」',
    'sect_leader_恒山派': '「另一桩。」她收着经纸，声音很轻，「那夜的节，你在{rival}处。风声是知客的师侄带进庵的——白云庵不打听人，可钟声隔得开墙，隔不开风。」她收纸的手停了停，「不必解释。回向页上那一行，我不抹。不抹，是我的功课。只是木鱼少的那一声，从今日起记在你名下。何时补——你记得就好。记得，晚课就不算白敲。」',
    'sect_leader_嵩山派': '「另一目，一并核了。」他把夜册推到案中央，指尖落在一行上，「那夜的节，你在{rival}处。来路：山下舵口接力；口气：无疑似；日子：节夜。三条腿——齐整。」他合上册子，合得极正，「执法堂不抢人，执法堂存照。这一目我存了档，判语栏空白。空白，是等你亲口报。报完——我再判。判什么，你自己想。」',
    'sect_leader_泰山派': '「另有一句，直说。」她扛着火钩，眼睛盯着你，一点也不藏，「那夜的节，你在{rival}处。山下的灯，顶上看得到——哪一对灯是谁的，我临火十年，一眼一个准。」她转回火坛，拨了一下炭，「不必解释。泰山的人不解释，只记档。那夜的档我记了：晴，灯，多。火色——」她的火钩顿了顿，顿得极重，「平。这个字我写得平平整整。你几时把它烧旺，你自己想。」',
    'sect_leader_青城派': '「另一锅。」她在灶前，火光映着侧脸，话照旧快，「那夜的节，你在{rival}处。消息比茶先下山——山下传的事，用不着我打听。」她放下茶铲，拈了一撮新茶对着灯照，「不必解释。看茶的人只认一个理：锅里的火可以两头旺，人的心不能两头烧。心两头烧——茶都是苦的。」她把茶按回罐里，扣好盖，「这句说完了。想明白了来喝茶。茶我照沏——苦不苦，你自己的舌头报给我。」',
    'sect_leader_衡山派': '「另一夜。」她擦着弓毛，没有抬头，「那夜的节，你在{rival}处。雨声传得远——山下的喜声混在雨里，飘得上琴台。」她把松香收回袖中，「不必解释。曲子认耳朵。那夜的半阙，我拉给一副陌生的檐下听了。」她抬眼，眼神照旧温，温里有一点极轻的冷，「这一句，在曲子里是一个音。音落了——曲子记得。你，也记得。」',
    'sect_leader_丐帮': '「另一段。」他摞着碗，声音压平了，「那夜的节，你在{rival}处。讯房的消息，你知道——比你开口早。三条腿齐整，核了三遍，没有一处可疑。」他把最后一只碗倒扣上架，扣得极正，「不必解释。解释了就是虚的，讯房不核虚信。只一样记着：你那一段书，我在粥棚照样跳过。跳过不是关子——」他把茶推给你，「是真的。真的东西讲不得，只能等人回来，喝着粥，慢慢听。」',
    'sect_leader_阎罗殿': '「另一目。」他合上册子，指尖落在一行上，声音比平时更平，「那夜的节，你在{rival}处。来路：分舵接力；口气：无疑似；日子：节夜。三样——齐整。」他把册子归架，归得极实，「不必解释。档不认解释，认记录。这一目我记了，判语栏，空着。」停了停，「判语栏空着，不是忘了——是等你回来，亲口报。报完，我判。判什么……」他把笔搁正，「规上没有这个格式。我自己，想一个。」',
    'sect_leader_血手门': '「另一件事。」她仍在翻药匾，声音很平，「那夜的节，你在{rival}处。门里的风传话——你不必接这句。有些话，报完了，就像碾过头的白药：还能用，只是不好看。」她把匾里的白药拢进纸包，包角折得整整齐齐，「药庐记人，本来记缝过的针数。你这一条，我改记日子了——几日在这儿，几日在那儿，都记清了。」她把纸包压到架子最底层，「这一句不是怨。怨是有火的人才做的事。我只是把清单上你的名次，往后挪了一行——挪完，又描回去了。描回去的意思，你多半不懂。」',
    'sect_leader_飞蝎坞': '「另一句，直说。」她扛着钩杖，眼睛盯着你，一点也不藏，「那夜的节，你在{rival}处。大漠的风声，你知道——比沙暴先到。哪边的灯火、是谁的，我这双看了三年蝎的眼睛，一眼一个准。」她转回蝎窝，竹钳敲了一声，「不必解释。沙漠的人不解释，只记册。那夜册上我记了：风，灯，多。心色——」竹钳顿了顿，顿得特别重，「平。这两个字我写得平平整整。你几时把它焐热，你自己想。」',
    'sect_leader_烈日教': '「另一件事。」她立在龛前，声音先是圣女腔，后慢慢垮成吐槽，「那夜的节，你在{rival}处。教里的风声，你知道——沙漠的风声比沙暴快，我们教里的比沙漠还快，因为要过高台。」她给圣火添了一勺油，火苗亮了一分，「不必解释。仪轨册只记事实：那夜圣火照四方，你的影子，不在四方之内。」她把油罐合上，合得特别实，「这一笔，我记在『照十方』那一栏里——别问为什么。十方大，装得下一个远的人。八年头一回，我把错的仪轨，用在了对的地方。高台问起，我就说：仪轨革新。」',
    'sect_leader_天龙教': '「另一条。」她把铜镜牌攥在手心，声音干脆，却发紧，「那夜的节，你在{rival}处。教里的风声比令先到——到的时候，我做了一件特别没出息的事：我把那个人的调子，练了一遍。」她停了停，指尖在牌面上蹭了蹭，「练了一遍，就卡在喉咙里了。这几日说话，顺口就漏出来——漏出来的调子是Ta的，话是我的。你知道最气人的是什么吗。（用护法长老的凶腔）『话是我的！』」凶完她自己愣了半息，把牌收了，声音低到最低，「不必解释。传声房只记一件事：那夜，令传讫，调子——是借的。调子借了传讫的话，听的人，心里最清楚是谁的。」',
    'sect_leader_神机门': '「另一条记录。」她仍在校机，声音平得像报数，「那夜的节，你在{rival}处。神机门的时辰器天下最准——你那夜在何处，我的水漏有刻。刻到亥时，断了。」她搁下校准笔，把那只黄铜齿轮匣打开——匣里除了齿轮，还有一张极小的纸条，纸条上的字小得像刻度：「重算十九遍，遍遍不同。第二十遍，停算。」她把纸条给你看，看完收回去，扣严。「不必解释。机关不认解释，认校准。这一条我记在游隙名下——游隙可以吃掉。你回来给我一个日子，日子给了，我算得出往后。」',
    'sect_leader_霹雳堂': '「另一行。」他仍在绑引信，声音轻得你要凑近，「那夜的节，你在{rival}处。霹雳堂的耳朵灵——火药铺子都是耳朵，响声走地皮。」他绑完一根引信，搁下，翻开方子册的批注页，新页上一行流水小字：「是日，硝干。人未潮——潮在别处。」念完他合上册子，压好。「不必解释。批注记实，不记怨。」他顿了顿，从怀里摸出防火布囊，搁在案上你这一侧，没有推：「囊里那根最长的引信，我如今留着不盘了。留给哪一夜——」他抬起眼，声音比灯花还轻，「……我说了。我真的说了：留给你回来的那一夜。回来的夜，不潮。」',
    'sect_leader_天书阁': '「另一条。」他合上卷，指尖点在页角——新批注一个字：「实」。旁边小注着{rival}的名字。「那夜的节，你在{rival}处。阁里的消息比书快——来路明，不必讎。」他搁下笔，极平，「从前批的『存疑』，如今证实了。证实，疑就销了。销疑的页角——」他把那页起下来，递给你，裁口齐得像刻版，「出卷，不作证。你的条，从今日起新页起。新页新墨，不带旧批。」他顿了顿，声音低了半格：「不必解释。校讎认证，不认解释。只一样：新页头一批，我要你在场。批语我写，讎批的人——」他把校讎剑归背，归得极慢，「你。」',
    'sect_leader_大隐阁': '「另一卦。」他蹲在台阶上，手里一串新糖葫芦，没吃，「那夜的节，你在{rival}处。山下集市的风声比卦快——人间的消息，从来比签子上的先熟。」他数了一颗山楂递给你，自己那颗没吃。「那夜我替你起了一卦。起了三回，回回大凶。凶在哪儿，今日告诉你——」他把签子立在台阶缝里，与旧的两根并排，「凶不在{rival}。凶在这一颗。」他指指签头的风干山楂，「它差点叫我吃了。差点吃，就是差点尽。尽了，卦死，下文就没了。」他拍拍手上的糖渣，半仙腔混着干饭腔：「不必解释。卦不认解释，认陪。你回来陪我数一串——数几颗归你，签头那颗归我。我的那颗，永远不吃。莫尽。」',
    'sect_leader_侠隐阁': '「另一档。」他合上附页，批注腔又快又平，「那夜的节，你在{rival}处。来路：山下眼线接力；口气：无疑似；日子：节夜。三样齐整——档，成立。」他把你的正档归回近手格，归得极实。「那一卷，我也建了附档。」他顿了顿，「危险程度栏，空白。写不出。」你问为什么写不出。他盯着那格看了两息，批注腔头一回慢了下来：「写『高』——」他把附页收回去，「高了，我就得按规处置。处置的法子档规有三种，三种我一种都用不出手。写『低』，是欺档。」他坐回案后，提笔，笔悬着没有落，「不必解释。档认记录。你这一条，我记在『存疑』名下——存疑，不究。不究，不是忘。忘是销掉。销字，我落不下笔。」',
    'sect_leader_天涯海阁': '「另一站。」他在理站册，公文腔一丝不乱，「那夜的节，你在{rival}处。驿路的消息，驿亭日日收——你那夜宿在哪一站，册上有明数。」他合上站册，合得极轻。「不必解释。驿亭不留客。」他把「不留客」三个字说得极端正，端正完，从袖中取出半枚铜符，攥了一回，又收回去。「那夜我做了一件不合公文的事：从此处到{rival}处的驿路，我把三程都算了一遍。算完，在册尾批了一行。」他把册子翻开给你看——册尾一行颤笔小字：「路平。不须赶。此处候。」他合上册子，声音里那点颤压不住了：「批语超出格式。超格，犯规。犯规我认，罚我领。这一行不入公文，入的是——」他停了很久，公文腔终于垮了半句，「私笔。私笔只此一行。你回来，自己把它描成公文。描成公文，它就名正言顺了。」',
    'sect_leader_大旗门': '「另一栏。」他合上名册，军中腔一句是一句，「那夜的节，你在{rival}处。营里的探马回来了——探马探的是防务，报的清楚。你的事，混在防务里报上来的。」他打开铁皮针线盒，把针码一根一根排齐，排得极正。「不必解释。军里不听解释，听报。你这一条记在名册上，判语栏——」他取出最长那根针，对着灯看了看，「空着。空着不是放过。空着是留针眼。针眼留着，就是等走线。」他把针归排，合上盒，把盒子推到你手边半寸：「你回来，当面报。报完，我走线。缝什么字，你定，我缝。」他盯着你，猛将的脸上光收了收，声音压到最短：「定出来的字，我要是不想缝——也缝。缝完我自己拆。拆针脚最疼。这一条，营里没人知道。你知道就行。」',
    'sect_leader_铁掌帮': '「另一声哨。」她攥着素坯哨，凶脸一点也不藏，「那夜的节，你在{rival}处。苇滩的风知道——风向哪边吹、声从哪边来，我这双吹了三年哨的耳朵，一听就分得出。」她把哨举到唇边，没有吹，又放下来。「不必解释。哨语册子不记解释，只记声。那夜我把册子上的条目吹了三十几遍——三短促，『过来』。吹完我明白一条：」她声音低了半调，凶压不住底下那点哑，「『过来』是哨语里最响的一条。可最想吹的那一条，册子上没有——册子上写不出来。写不出来的，我只能不吹。」她把哨收进怀里，贴着那支素坯：「不吹，憋着。憋坏了算我的。你要是回来——回来我就吹给你听。吹哪一条，你到了就知道。」',
    'sect_leader_昆仑派': '「另一式。」她按着素绸袖带，声音平得像舞的名目，「那夜的节，你在{rival}处。昆仑的雪白——白雪反光。你那夜在哪一扇灯下，晨课场望得见一角。」她转身回练场，提起剑，没有起势。「不必解释。剑认看见的。那夜我把问松从头舞了一遍，一式没有岔——最岔的是收势之后：我持剑在雪里立了半个时辰。」她看着你，雪光落在眼里，「立着的时候想明白一条：松不答。松从来不答。要答的——」她的剑尖沉了一寸，又抬起来，「不是松。你回来，在雪坎边站一回，看我舞一套。舞完你答我一句：剑意堵没堵。堵没堵，看舞的人知道。舞的人自己——十年了，头一回不知道。」',
    'sect_leader_全真教': '「另一笔。」她合上日记，账房腔又平又快，「那夜的节，你在{rival}处。功业账的消息来自经堂的值册——值册记谁节夜不在，一目了然。」她拨了一下算盘，拨完又推回去，把珠推回原位。「不必解释。账认册。这一笔记在外账栏——外账，应收。只是有一样对不上。」她抬头，账房腔裂了道小缝，「应收的时辰，越积越多，利息越滚越大。利息滚了，就该讨。讨账是账房的本分——」她把小银算盘往日记上一压，压得极正，「那夜我讨不出手。讨不出手，账书里没有教过。我对着算盘坐到五更，五更给自己记了一笔。条目：『不忍』。」她顿了顿，声音低下去，「『不忍』不是账房的词。不是账房的词，就是全真教三百年的账，装不下这一笔。装不下的笔，只能搁在我自己那一栏。我那栏——你知道的，只进不出。」',
    'sect_leader_少林寺': '「另一句。」她合上批注经，先合十——佛号念到一半，咽了回去：「那夜的节，你在{rival}处。少林戒不打听——可知客堂的册子记谁上山谁下山，册子不是打听，是记性。」她袖中的念珠极轻地响了一声。「不必解释。贫尼这张毒舌骂遍天下，独独关于你的这一句，骂不出口——骂出口，毒就进了你身；不骂出口，毒就回贫尼自己。」她把批注经翻到那页空白，摊在灯下给你看：「你看清楚。这一页空着，不是没有可批——是最锋利的那一句，落不下笔。落了笔就是铁案；铁案是要关人的。贫尼关不住你，也关不住{rival}——」她合上经，毒舌沉到底，「只关得住贫尼自己。关自己的那一句判词，你几时回来听，它几时才作数。」'
};

// 余波回应选项（每位 3 项）与效果文案
var JEAL_AFTER_CHOICES = {
    'sect_leader_百花谷': {
        options: [
            { text: '「往后每一个节，我先求你的帖。」', effect: 'vow' },
            { text: '「帖子我撕了。节就在药庐过，往后。」', effect: 'present' },
            { text: '「我真是有事……你就不能体谅一回？」', effect: 'argue' }
        ],
        effects: function (npc, choice, ctx) {
            var rivalName = ctx && ctx.spentName;
            var aff, msg;
            if (choice === 'vow') {
                aff = rivalName ? 4 : 8;
                msg = '她碾药的手停了：「……先求我的帖。」她轻声重复，像把这句话夹进药方里，「好。百花谷的规矩——帖子先递先得，概不退换。」她顿了顿，声音小了些，「那你记着，你递的不是帖，是往后的每一年。」';
                if (rivalName) msg += '她把碎掉那角灯纸收进抽屉，「这盏破灯也留着。留个记性：哪一个节，我是自己过的。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            } else if (choice === 'present') {
                aff = 7;
                msg = '你把那张回帖在烛上点了。她盯着火光看了很久，忽然起身，把檐下那盏破灯摘了下来：「那这盏也烧了。」她烧得慢，火苗舔着灯纸，「旧的一起清了，新的才算数——药庐的规矩，比江湖的严。」灯灰落尽，她拍拍手，琥珀色眼底亮得像也烧过一遍，「下回节，茶两只。人两个。就这么定了。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
            } else {
                aff = rivalName ? -9 : -5;
                msg = '「体谅。」她点点头，「我天天体谅病人疼，体谅药苦，体谅炉子不听话——原来体谅攒多了，在你那儿就成了理所应当。」她把药碾一收，「你走吧。今日的药不抓了。不是生气，是——」她想了想，找得很准，「药得配给认账的人。」';
                if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - (rivalName ? 8 : 4));
            }
            return { affection: aff, msg: msg };
        }
    },
    'sect_leader_修罗宫': {
        options: [
            { text: '「账你记，罚你定。我领。」', effect: 'vow' },
            { text: '「帖子我收回来了。下节，修罗宫头一位。」', effect: 'present' },
            { text: '「我为修罗宫出生入死，一个节你都计较？」', effect: 'argue' }
        ],
        effects: function (npc, choice, ctx) {
            var rivalName = ctx && ctx.spentName;
            var aff, msg;
            if (choice === 'vow') {
                aff = rivalName ? 4 : 8;
                msg = '她当真抽出一张罚单推过来——「自罚守宫三日，扫大殿，不带剑。」字写得铁画银钩。你提笔就签了，她盯着你的笔尖，寒冰的眼底裂开一道细缝，「……修罗宫的令，签了要认。」她把罚单仔细折好收进匣子，匣子是装过断簪的那种，「三日。每日我来查。查到你偷懒，加三日。」';
                if (rivalName) msg += '查到第三日她照例来，袖子里露出一角红绳——灯节那根。她顺着你的目光「哼」了一声：「罚单上没写不许留着这个。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            } else if (choice === 'present') {
                aff = 7;
                msg = '你当面把回执撕了。殿里的寒气忽然松了半寸——暗哨们私下说，那是三年来头一回。她收了桌上的簿子：「头一位。」她把「头一位」三个字念了一遍，忽然抬手把殿门落了闸，「那今日提前演练。修罗宫闭门——谁也不见，包括账本。」那晚大殿的灯亮到三更，断簪从匣子里又拿出来擦了擦，放回去了。擦得很干净，没插回去。有些事，慢慢来。';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
            } else {
                aff = rivalName ? -10 : -6;
                msg = '「出生入死。」她把短匕「夺」地钉进案里，入木三分，「修罗宫最敬刀口上的人——所以你今日这句，才格外刺耳。刀口上讨回来的交情，拿到节令上来讲价？」她盯着你，一字一字，「账可以销。这句话，收回去，再进门。收不回去——」她拔了匕，「这扇门往后就记在另一本账上了。那本账，不销。」';
                if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - (rivalName ? 10 : 6));
            }
            return { affection: aff, msg: msg };
        }
    },
    'sect_leader_天山派': {
        options: [
            { text: '「下节双剑。我上山，与你合璧。」', effect: 'vow' },
            { text: '「我这就回帖改期。从今往后，天山只有这一帖。」', effect: 'present' },
            { text: '「剑是剑，节是节，你别什么都往剑道上扯。」', effect: 'argue' }
        ],
        effects: function (npc, choice, ctx) {
            var rivalName = ctx && ctx.spentName;
            var aff, msg;
            if (choice === 'vow') {
                aff = rivalName ? 4 : 8;
                msg = '她没说好。她只是把那柄双剑之一的「云应」从架上取下来，递给你：「先练。」你练了一夜，她挑了七处错，一处比一处轻。天亮收剑，她说：「第七处我留着力气没挑。」她望着雪线尽头，「练合璧最要紧的是记拍子——两个人都记拍子，才不会撞。你的拍子，往后记天山的。记岔了……」她收剑入鞘，「记岔一次，我陪你重来。重来的次数，也是拍子。」';
                if (rivalName) msg += '收剑时她忽然道：「你那夜的拍子，记的是别处的鼓。」她说得平平，说完就走了。——她肯说出来，比什么都不说，好。';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            } else if (choice === 'present') {
                aff = 7;
                msg = '她看你改帖，看了很久，然后做了一件天山派二十年来没人见过的事——她把霜鸣解下来，横放在雪庐门槛上。剑为闩，是剑派的最高礼，意思是：此门此后为你而设。你跨过剑进门，她在身后说：「跨剑不回头。回头，剑起，门落。」你没回头。门后的雪地上，她站出的那道影子，一直站到月上中天。';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
            } else {
                aff = rivalName ? -10 : -6;
                msg = '「好。」她只说了一个字，然后当着你把双剑合在一起，一柄归鞘——今日之后，天山的雪线上只剩一柄剑的影子。弟子们听见那夜雪庐有剑鸣，一声，很长的。次日她照旧巡山，见你依旧颔首，礼数分毫不差——分毫不差。剑派表达决裂，从来不是刀兵，是你再也得不到她一处破绽。想修回来？得从「礼数分毫不差」这五字开始。';
                if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - (rivalName ? 10 : 6));
            }
            return { affection: aff, msg: msg };
        }
    },
    'sect_leader_五仙教': {
        options: [
            { text: '「下节起，我的心口也给你养一只蛊。双生蛊，同生同死。」', effect: 'vow' },
            { text: '「忘情酒封存。往后节令，我来五仙教讨喜酒。」', effect: 'present' },
            { text: '「一口酒一句话，至于么。」', effect: 'argue' }
        ],
        effects: function (npc, choice, ctx) {
            var rivalName = ctx && ctx.spentName;
            var aff, msg;
            if (choice === 'vow') {
                aff = rivalName ? 5 : 9;
                msg = '她腾地坐直了：「双生蛊。」她把这三个字翻来覆去念了两遍，凤目里的水光终于兜不住，「你知不知道双生蛊是什么——是拿命签的契，苗人拿来结两姓之好，解蛊的方法天下只有三处。」她深吸一口气，把笑重新摆好，妖媚如常，声音却哑：「我教里养了十八年蛊，头一回替自己留一只不喂的。你要真想养——拿你半滴心头血来。」她把一只白玉小盅推过来，盅里空空，「盅先给你。血，你养足了日子再来。心蛊说了：它等你。它好久没这么乖了——因为它知道，这回的饵，是真的。」';
                if (rivalName) msg += '她把空盅又往你那边推了半寸，「{rival}那边的血，别算进这只盅里。这只盅，一盅只认一滴。」'.replace('{rival}', rivalName);
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
            } else if (choice === 'present') {
                aff = 7;
                msg = '你把那坛忘情酒抱起来就要往外走，她一把没抓住，愣在原地——半晌，忽然笑得前仰后合，笑着笑着按住心口：「……好。好！」她擦了下眼角，抬手召来蛊生，「传我的话：这坛封泥换新，落锁，钥匙——」她指指你怀里的酒坛，「随坛走。他放哪儿，钥匙就在哪儿。我们养蛊的认死理：锁要是防不住想开的人，那锁就成了诚心。诚心，我押你。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            } else {
                aff = rivalName ? -10 : -6;
                msg = '「至于么。」她轻轻重复，手指在酒坛沿上弹了一下，酒面震出一圈细纹。她没发怒，只是把心口那团黑纹撩开给你看——黑纹下面，隐隐多了一缕新的红线，缠成一个小圈，圈着一个陌生方向。「心蛊昨夜自己咬了自己一口，圈了个方向。」她收起黑纹，笑意温温的，「咬的是它自己。它疼了，我跟着疼。你要我拿什么回你——拿它咬死自己那一声吗？」她把酒坛抱回怀里，「你走吧。今日五仙教不打烊，可我这儿的酒，只卖实话。」';
                if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - (rivalName ? 10 : 6));
            }
            return { affection: aff, msg: msg };
        }
    },
    'sect_leader_铸剑山庄': {
        options: [
            { text: '「下节的酒我自带。炉前，就咱俩，烧一炉慢火。」', effect: 'vow' },
            { text: '「这副红漆碗筷我收了。往后我的碗，就搁你这灶上。」', effect: 'present' },
            { text: '「江湖这么大，我总不能哪都去不得吧。」', effect: 'argue' }
        ],
        effects: function (npc, choice, ctx) {
            var rivalName = ctx && ctx.spentName;
            var aff, msg;
            if (choice === 'vow') {
                aff = rivalName ? 4 : 8;
                msg = '他把锤子往砧上一靠，咧嘴笑了——铸剑人高兴了也只会这个。当夜他真的把炉火压成了慢火，两个人围着炉子说话，说的全是铁。快天亮时他忽然说：「我娘说过，男人慢下来，要么老了，要么有人了。」他把火钳搁下，琥珀色的眼里炉火很温，「我没老。你是第二个。往后的慢火，我留着。」';
                if (rivalName) msg += '话落他又补了一句，闷闷的：「那夜的火，也是这么烧的？……行，别答。答了我就得拿锤。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            } else if (choice === 'present') {
                aff = 7;
                msg = '你把那副红漆碗筷往自己包袱里一收。学徒们都看傻了——山庄的灶规，收碗等于认灶。冶砚背对你们站着，站了足足十息，然后他一锤砸在锣上，当的一声绕山转：「开炉！」整个铸剑山庄都响了。他头也不回地喊：「挂名！灶上一份，名字——」他卡住了，耳根通红，回头瞪你，「你自己报！」你报了。锤声重新响起来，比刚才那声还响。';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
            } else {
                aff = rivalName ? -10 : -6;
                msg = '「去得，去得。」他连连点头，点头点得像锤落，然后他把炉门哗地拉开，热浪扑面，「江湖是大的，人心是小的——这是铸剑山庄三百年的话。大的你到处去，小的你两头烧，如今还嫌炉子小？」他拿起锤，一下一下打一块熟铁，打得很重，「门不关。灶不撤。就是我这炉里的火候——往后你自己拿捏。烧糊了，别怪铁不结实。铁这辈子，只认守着它的人。」';
                if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - (rivalName ? 10 : 6));
            }
            return { affection: aff, msg: msg };
        }
    },
    'sect_leader_药王谷': {
        options: [
            { text: '「往后节礼，我亲自登门领。挂账的钱，翻倍还你。」', effect: 'vow' },
            { text: '「账我认。但那本『另册』——如今还有我的名字没有？」', effect: 'present' },
            { text: '「几文钱的礼钱，你也记？」', effect: 'argue' }
        ],
        effects: function (npc, choice, ctx) {
            var rivalName = ctx && ctx.spentName;
            var aff, msg;
            if (choice === 'vow') {
                aff = rivalName ? 4 : 8;
                msg = '「翻倍就不必了。」他从账上把你名字旁的「挂账」划去，重新写了两个字：「亲领。」笔锋温润，「药王谷的账，亲领三个字，一年只写两次——端午、中秋。你名字旁这一行，往后比谁都齐。」写完他合上账本，浅褐的眼里带笑，「钱就不必了。你缺的不是钱，是一个肯替你垫月俸的大夫。这大夫——」他指了指自己，「跑不了。」';
                if (rivalName) msg += '临了你走出两步，他在身后轻轻补一句：「那晚那边的礼钱，我也一并垫了。不是我大方——是我垫得起，那边不能垫。这一笔，你记我这儿就好。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            } else if (choice === 'present') {
                aff = 8;
                msg = '他翻开账本后头夹着的一册薄簿——「另册」两个字是他自己题的签。册页上你的名字端端正正，旁边一行小字：「七夕前七日至，七夕日至，七夕夜不至。记三次。三次之后——」他指尖压在那行字末端，声音温润依旧，「三次之后，还记。另册不设除名条。药王谷立谷三百年，头一次给活人立这种规矩，你担待些。」他把簿子合上，按在掌心，「现在你看见了。看见，就是进册。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
            } else {
                aff = rivalName ? -10 : -6;
                msg = '「是几文钱。」他把账本往前一推，请你验看，笑容没动，「你自己看——代领的是节礼，垫的是整份，钱是你那份的两倍。多的那一倍，我垫的是我自己的名分。」他抬起眼，浅褐眼底温润的水面终于起了纹，「谷里人问：这位的礼谁垫？我说我垫。他们说：你垫的什么钱，你垫的是脸面。」他取下账本上的绳结，一圈一圈绕好，「今日这句话，记不进账——有些事不记账。不记账的，最重。你走吧。药庐门开，另册页合。什么时候那句话收回去了——它自己会开。」';
                if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - (rivalName ? 10 : 6));
            }
            return { affection: aff, msg: msg };
        }
    },
    'sect_leader_茅山派': {
        options: [
            { text: '「下节我在符灯下守岁。灯油我自带，守到你赶我走为止。」', effect: 'vow' },
            { text: '「那页副本——誊的时候，我在旁边。」', effect: 'present' },
            { text: '「我来看你，不是来算卦的。」', effect: 'argue' }
        ],
        effects: function (npc, choice, ctx) {
            var rivalName = ctx && ctx.spentName;
            var aff, msg;
            if (choice === 'vow') {
                aff = rivalName ? 4 : 8;
                msg = '「赶你走？」他难得地、极轻地笑了一下，像符纸上第一笔落下前的那口气，「茅山的灯，烧的是香油，不是留难。」他起身从库里取了一小坛油递给你，坛口贴着封条，是他自己的笔迹：「这是本座历年香油钱省下的。给你——守灯的人，自带灯油，茅山没有这个先例。」他把坛塞进你怀里，补了一句，「从今天起有了。」';
                if (rivalName) msg += '临出门他叫住你，把卦纸副本摊开，在「应验」二字旁添了四个小字：「来日方长。」墨迹干了，他吹了吹灰，「拿回去。批命不是道士的事——是你自己的。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            } else if (choice === 'present') {
                aff = 8;
                msg = '他开始誊。你就坐在灯下研墨。誊到中段他停了笔——副本只誊到那一夜为止，后头留白。他把笔搁下：「留白，是留给后头能写的日子。」你把墨锭放下，他看你一眼，银光里有一点极淡的、像被谁惊动过的东西，「你知道茅山誊抄的规矩吗？副本与正卷，一灯同照，永不分离。」他说得很平，像在念一条清规，念完自己先静了半晌，「……去吧。墨晾干。明晚再来。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
            } else {
                aff = rivalName ? -10 : -6;
                msg = '「不算卦。」他重复了一遍，点了点头，当真把卦簿收进抽屉，落锁，钥匙挂上颈间。「也好。」他重新拿起朱砂笔，「卦不卜了，道不同不相为谋——茅山规矩，卦簿一合，人客两清。」他蘸了朱砂开始画符，笔稳得没有一丝迟疑，「今日符阁不谢客。你坐。坐多久都行。就是——」他目光不离符纸，声音清冷如常，「往后你的事，本座不再夜夜起卦。省下来的那些夜，本座用来睡觉。你不必愧疚。这是我自己选的：不卜，不听，不想。道士修行最深的一课——舍。」他画完最后一笔，吹干，「你若要替我补这一课，现在可以走了。」';
                if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - (rivalName ? 10 : 6));
            }
            return { affection: aff, msg: msg };
        }
    },
    'sect_leader_金刚宗': {
        options: [
            { text: '「下节起，初一十五，塔前扫雪的是我。」', effect: 'vow' },
            { text: '「那晚的门，是我没来。这道业障，我背。」', effect: 'present' },
            { text: '「你出家人，也讲究这些？」', effect: 'argue' }
        ],
        effects: function (npc, choice, ctx) {
            var rivalName = ctx && ctx.spentName;
            var aff, msg;
            if (choice === 'vow') {
                aff = rivalName ? 5 : 9;
                msg = '他看了你很久，从塔角取下另一把扫帚——竹柄磨得发亮，是用了多年的旧物。他把扫帚递过来，扫柄朝你：「塔前第一级，留给你。」他提着另一把走下台阶，走了几步，破了禅添一句，「雪是天扫的，人是自己扫的。往后……天雪时，第一级有人候着。」声音散在风里。小沙弥后来跟你说：方丈把那排灯笼全换成了新的，就为初一那日，塔前亮堂些。';
                if (rivalName) msg += '接过扫帚时他补了句极轻的话：「那夜塔前，两个人的脚步，老僧也替你数过。往后第一级的雪——替两个人扫，也扫得。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
            } else if (choice === 'present') {
                aff = 7;
                msg = '「业障不业障，不在嘴上。」他把面前的木牌推到你手里，正面朝上，「拿着。守塔门半日。不说话，只开门。」你抱着木牌在塔门边站了半日，进出的香客都看这怪人。日落他下来换你，接过木牌，掂了掂，忽然说：「手心的汗，比老僧那夜的雪化得快。」他收牌入袖，侧身让出塔门，「进。今日晚课，你坐第二排。——第二排，从前只留给我俗家的亲人。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
            } else {
                aff = rivalName ? -11 : -6;
                msg = '「出家人。」他轻轻重复这三个字，合十的手停在胸前没放下。他望着塔前的灯笼，良久才说：「佛前长明灯，油尽，是谁添的？是出家人。山下施粥，雨夜，是谁守的？是出家人。」他收回手，声音低哑平稳，「出家人不是没有心。是把心分给众生——分到你这儿，剩下多少，施主自己掂量过了，今日说出来。」他转身登塔，一步一级，在第三级停了一停，没回头，「门不闭。经照念。只是塔顶那盏灯，老僧今日亲手摘了。不是怪你——灯也累了，歇歇。施主回程，路上小心。」';
                if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - (rivalName ? 10 : 6));
            }
            return { affection: aff, msg: msg };
        }
    },
    'sect_leader_峨眉派': {
        options: [
            { text: '「往后每一个节，我先上金顶。名签我自己放。」', effect: 'vow' },
            { text: '「灯下那支空签我拿走了。签在我，人在。」', effect: 'present' },
            { text: '「我真是有事……峨眉的规矩，管到节令上了？」', effect: 'argue' }
        ],
        effects: function (npc, choice, ctx) {
            var rivalName = ctx && ctx.spentName;
            var aff, msg;
            if (choice === 'vow') {
                aff = rivalName ? 4 : 8;
                msg = '她看着你，半晌，把那支空名签推过来，笔搁在你手边：「自己放。」她声音端方，「峨眉的签，头一回由外人写名字。」你写完，她把签收进袖袋——不是签筒，是袖袋。「签我收了。往后你放的每一支，我亲点。」她顿了顿，声音低了些，「点到这把尺传下去的那日——数目，不会错。」';
                if (rivalName) msg += '收签时她补了一句，平平的：「那边的签，你自己记着放。峨眉不替你点别家的卯——可你两头都别缺。缺哪头，都是缺。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            } else if (choice === 'present') {
                aff = 7;
                msg = '你伸手把灯下那支空签拿起来。她没拦。你把签收进怀里，她起身把戒堂的窗关严了：「签在你身上，卯就在你身上。」她重新坐下，擦她的戒尺，「峨眉的规矩，认签不认人——今日破例，认你。」灯花爆了一下，她抬眼看了看灯，「往后这盏灯，你回得及，自己撤；回不及——我留着。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
            } else {
                aff = rivalName ? -9 : -5;
                msg = '「管到节令。」她点点头，把那盏茶收回去了，动作不重，「戒律不管节令，戒律管数目。我在金顶点了一夜的卯，头一回，数不动你这一行。」她起身，吹了灯。黑暗里她的声音还清清楚楚，「你走吧。有事的人，峨眉不留。往后你若事事都有事——」静了一息，「事大了，别处也留不下你。」';
                if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - (rivalName ? 8 : 4));
            }
            return { affection: aff, msg: msg };
        }
    },
    'sect_leader_华山派': {
        options: [
            { text: '「往后每一个节，剑堂的雨我陪你听。凳子我自带。」', effect: 'vow' },
            { text: '「那页私账拿出来。今日这一笔，我当面对。」', effect: 'present' },
            { text: '「我真是有事……你笑一笑，这事就过了吧。」', effect: 'argue' }
        ],
        effects: function (npc, choice, ctx) {
            var rivalName = ctx && ctx.spentName;
            var aff, msg;
            if (choice === 'vow') {
                aff = rivalName ? 5 : 9;
                msg = '他愣了一下，随即笑开，连连摆手：「自带凳子——」他把这四个字咂摸了一遍，起身当真从墙角搬来一只凳，掸了掸灰，摆在剑堂那只旧凳旁边，「摆这儿。华山雨多，凳子不怕潮，怕空。」他坐回去，给自己斟了茶，给你也斟上，「往后下雨，你来不来，凳子都在。你来——」他望着檐外的天，「雨声能轻一半。这话我记账上，不算虚言。」';
                if (rivalName) msg += '临了他拨了拨灯芯，轻声补一句：「那夜的雨，那边也有屋檐吧。有就好。」他笑笑，「这句是私账。公账上，我只记你平安。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
            } else if (choice === 'present') {
                aff = 8;
                msg = '他把总账翻开，抽出那页私账，摊在灯下推给你。页上头一笔是你的名字，底下的数目却都空着。「空着好。」他说，「华山记账有个老例：数目当面填，填一笔，两个人画押。」他提笔蘸墨，笔杆调过来递给你，「今日你来的这一笔，算头一笔。画押。」你落了名，他在旁边也落了。他把账页吹干，仔仔细细夹回总账——夹完，用手在封皮上按了按，像按实一桩心事。';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
            } else {
                aff = rivalName ? -10 : -6;
                msg = '「笑一笑。」他重复了一遍，当真笑了——笑得标准，笑得周全，像给全华山看的那种笑。然后他起身，走到窗边，把窗推开。窗外无雨。「事过没过，账知道。」他背对着你，声音和平时一样松，松得让人心里发沉，「我这一笑，十年没敢收。你今日要我拿它当『过了』——」他回头，笑意还挂着，眼底却静得像雨后的潭，「过了。账房今日不盘。你回吧。华山的门不下锁——私账那页，落了锁。」';
                if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - (rivalName ? 10 : 6));
            }
            return { affection: aff, msg: msg };
        }
    },
    'sect_leader_唐门': {
        options: [
            { text: '「往后每一个节，我先来唐门。茶，你验。」', effect: 'vow' },
            { text: '「那壶药，往后我陪你温。火你看，炭我添。」', effect: 'present' },
            { text: '「我真是有事……唐门验毒，如今连节令也验？」', effect: 'argue' }
        ],
        effects: function (npc, choice, ctx) {
            var rivalName = ctx && ctx.spentName;
            var aff, msg;
            if (choice === 'vow') {
                aff = rivalName ? 4 : 8;
                msg = '她擦针的手停了。「……你验。」她把这两个字重复了一遍，从针囊里抽出一根新针，穿进一只小小的针荷包，系在你腰间——结打得是唐门的样式，紧，却好解。「这根针，不认毒，只认你的盏。往后你喝茶，自己验。验不来，」她抬眼，笑里带着钩，「就回来，我替你验。我的针，从不看走眼。」';
                if (rivalName) msg += '临走她在身后补了一句，声音带刺，刺却是钝的：「{rival}那儿的茶，少喝。不是吃醋——是唐门毒谱上，没有那一家的页。出了事，我认不得。」话虽这么说，一小包药还是塞进了你手里。'.replace('{rival}', rivalName);
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            } else if (choice === 'present') {
                aff = 7;
                msg = '你把那壶凉了的药重新坐上炉子，自己添了炭，蹲下来陪她看火。她站在旁边看你，看了一会儿，忽然也蹲下来，肩膀挨着你的肩膀。「看火很闷。」她说。可她没走。炉火一点点旺起来，她的白丝手套映着火光，指尖泛红。「……往后封炉的时候，你替我添那把炭。」她说得很轻，「两个人添的炭，火煨得久些。这是炉子告诉我的，不是我。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
            } else {
                aff = rivalName ? -9 : -5;
                msg = '「验节令。」她点点头，把银针一根一根收回针囊，收得咔咔作响，「是，唐门毒堂堂主，替一个外人验盏节令的茶——你嫌多了。」她起身，走到炉边，背对着你，声音混着炉风，「走吧。忙你的事去。只一样记着：唐门的炉子，一年封一回。封了，谁的炭添进去——都不旺。」';
                if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - (rivalName ? 8 : 4));
            }
            return { affection: aff, msg: msg };
        }
    },
    'sect_leader_武当派': {
        options: [
            { text: '「往后每一个节，晨钟未响我就上山。头一杵，我陪你听。」', effect: 'vow' },
            { text: '「鞘，我这次带回来了。鞘回山，剑不出。」', effect: 'present' },
            { text: '「我真是有事……武当的钟，如今也替我数日子？」', effect: 'argue' }
        ],
        effects: function (npc, choice, ctx) {
            var rivalName = ctx && ctx.spentName;
            var aff, msg;
            if (choice === 'vow') {
                aff = rivalName ? 5 : 9;
                msg = '他点头。点得很重——像把这个点头钉进了台阶里。第二天没亮，他站在钟楼，把钟杵的绳头留了一半在你手里，身边让出半个位：「头一杵，沉。你——扶绳尾。」钟声落下去，满山都醒了。钟停，他说：「往后头一杵，两个人听。武当的规矩里没有这一条——」他想了想，自己补了四个字，「今日有了。」';
                if (rivalName) msg += '下钟楼时他忽然说：「{rival}那对的灯，我也望见了。」他说得很平，「灯亮，好。只是武当山门的灯，往后留一对给你。年年。」'.replace('{rival}', rivalName);
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
            } else if (choice === 'present') {
                aff = 8;
                msg = '你把随身带的那具剑鞘解下来，双手递过去。他没接，看了那具鞘很久，然后摇头：「鞘留在你手里。」他握住你的手，连鞘一起合上——他的掌心很热，剑茧硌着你的手背，「鞘在你手里，剑在我身边。这话从前说过——」他停了半拍，「从前说，是当赠别。今日再说，是当守约。鞘不离你，你不离山门。就这么数。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
            } else {
                aff = rivalName ? -10 : -6;
                msg = '「数日子。」他重复了一遍，点头，像认下这个罪名。他起身，走到剑架边，把不争的剑柄理正——理了一遍，又理一遍，其实不歪。「钟，是撞给满山听的。不是只撞给你。」他背对着你，「只是那一杵多的，撞了三年——」他停住。殿外的钟恰好响了报时的更，他等钟声过去，才把剩下半句说完，很轻，「今日，不撞了。」他去扫阶。那日的阶，他从上头扫起——末一级，没留给你站。';
                if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - (rivalName ? 10 : 6));
            }
            return { affection: aff, msg: msg };
        }
    },
    'sect_leader_蓬莱派': {
        options: [
            { text: '「往后每一个节，我先来蓬莱。潮信你录，日子我上岸给你。」', effect: 'vow' },
            { text: '「图录拿出来。页脚那一行，我今日当面补。」', effect: 'present' },
            { text: '「我真是有事……观汐台连节令也要录？」', effect: 'argue' }
        ],
        effects: function (npc, choice, ctx) {
            var rivalName = ctx && ctx.spentName;
            var aff, msg;
            if (choice === 'vow') {
                aff = rivalName ? 4 : 8;
                msg = '她录潮的手停了。「……日子你给。」她把这四个字重复了一遍，像在核一笔潮信。半晌，她从笔袋里抽出一支新笔，笔杆上的漆还没磨掉——分明是备了许久的。「观汐台的笔，从来只录潮。」她把笔搁在你手边，「今日破例。往后你上岸的时辰，你自己报，我录——报迟一刻，我照迟一刻记。」话是硬的，搁笔的手却把笔杆调了个头，笔尖朝着自己。';
                if (rivalName) msg += '临了你下台，她在身后补了一句，声音平平：「{rival}处的灯，我也数过。灯亮，好。」她低头续录，「只是蓬莱的潮灯，往后一年一盏，盏盏留着你上岸的时辰。两头的灯都别误——误哪头，册子上都看得见。」'.replace('{rival}', rivalName);
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            } else if (choice === 'present') {
                aff = 7;
                msg = '她把图录取来，摊在灯下，翻到那一页——页脚空着的那一行，她指给你看。你提笔，把今日上岸的时辰一笔一画写上去。她看着，等墨干透，才合上册子。「补上了。」她说。然后她做了一件观汐台二十年没有过的事：她把潮信的正册与记你的那一栏，用同一根线订在了一处。「两册并一册。」她抚平封皮，「往后岸上人的日子，与潮信同册同线——潮不误，人不散。这是观汐台的规矩。今日改的。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
            } else {
                aff = rivalName ? -9 : -5;
                msg = '「也要录。」她点点头，把图录合上，动作不重，「潮涨要录，潮退要录。你今日这一句，我照实记。」她翻开册子，当真提笔落了一行，念给你听——「某年某节，岸上人言：有事。事由：无。」她合上册子，「观汐台录了二十年潮，从没记过一笔『无』。你是头一个。」她吹熄了灯，黑暗里潮声一层一层，「你回吧。有事的人，蓬莱不拦。只是册子上的『无』字，一笔是一笔——写满了，这一栏就裁了。」';
                if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - (rivalName ? 8 : 4));
            }
            return { affection: aff, msg: msg };
        }
    },
    'sect_leader_逍遥派': {
        options: [
            { text: '「往后每一个节，酒仙池头一坛我陪你封。泥你抹，名字我写。」', effect: 'vow' },
            { text: '「匣里的残局请出来。今日这半局，我陪你续。」', effect: 'present' },
            { text: '「我真是有事……逍遥派最讲自在，管我过节？」', effect: 'argue' }
        ],
        effects: function (npc, choice, ctx) {
            var rivalName = ctx && ctx.spentName;
            var aff, msg;
            if (choice === 'vow') {
                aff = rivalName ? 5 : 9;
                msg = '他怔了一息，随即笑出声，笑得酒坛嗡嗡作响：「名字你写。」他把这四个字咂摸了一遍，翻身坐起，当真从琅嬛取来笔，笔杆调个头递给你，「酒仙池的酒，我起了半辈子名——『醉月』『听泉』『三更』，一个比一个风雅。头一回，有人抢这差事。」他拍开新坛的封泥，酒香炸开，「来。今年的头一坛，现在就封。你写名字，我抹泥——写坏了不打紧，酒认人不认字。」';
                if (rivalName) msg += '临了你下山，他举盏在后头晃了晃：「那夜{rival}处的酒，想必也不坏。」他说得像玩笑，盏却饮尽了，「只是外头的酒再香——封泥上写着你名字的，天下只此一坛。坛等得起，我替你看着。」'.replace('{rival}', rivalName);
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
            } else if (choice === 'present') {
                aff = 8;
                msg = '他去琅嬛把那只木匣捧了出来，开匣，把残局一手一手摆回枰上——摆得极熟，每一颗子的位置，他闭着眼都记得。你执黑续了一手，他盯着枰面看了很久，忽而抬眼：「白子缺一枚。」他指枰上那个空位，「缺的这一枚，在你手里。局差最后一手——你几时把子带来，局几时活。」那日两人复盘到三更。收枰时，匣没锁，钥匙挂在琅嬛的灯下。他说：「钥匙挂低些。夜里来的人，不必摸黑。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
            } else {
                aff = rivalName ? -10 : -6;
                msg = '「讲自在。」他点点头，当真笑了——笑得标准，笑得周全。他把盏里的酒倾回坛中，一线，一线，倾得很稳。「逍遥派管天管地，不管人过节——这话对。」他抱起那只木匣，「匣归琅嬛最高一格，坛沉池底。都不是赌气，是自在。」他重新躺回坛边，琴盖搭上脸，声音从琴底下传出来，懒懒的，「你忙你的。往后你来，酒照斟——斟七分。七分的道理，你自己品。品出来了，算你自在；品不出来——」琴底下静了半晌，「算我自在。」';
                if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - (rivalName ? 10 : 6));
            }
            return { affection: aff, msg: msg };
        }
    },
    'sect_leader_恒山派': {
        options: [
            { text: '「往后每一个节，我先上恒山。你的晚课，我听头一场。」', effect: 'vow' },
            { text: '「回向页拿出来。乱的那一行，我今日陪你抄顺。」', effect: 'present' },
            { text: '「我真是有事……你们出家人，也记节令的账？」', effect: 'argue' }
        ],
        effects: function (npc, choice, ctx) {
            var rivalName = ctx && ctx.spentName;
            var aff, msg;
            if (choice === 'vow') {
                aff = rivalName ? 4 : 8;
                msg = '她收经纸的手停了。「……头一场。」她把这三个字念了一遍，很轻，像怕惊动灯焰。半晌，她从经函底下取出那张新纸——从前折好收着的那张，摊平在案上，笔搁在你手边。「晚课酉时。庵里的规矩，俗客听课，坐东檐。」她顿了顿，「东檐底下的位子，从今日起，我叫人日日掸。」';
                if (rivalName) msg += '出殿前她忽然又说了一句，声音很轻：「{rival}处的灯，我也替你回了一炷香。灯没有错。只是木鱼少的那一声——你记得补。记得，晚课就不算白敲。」'.replace('{rival}', rivalName);
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            } else if (choice === 'present') {
                aff = 7;
                msg = '她看了你两息，转身把回向页从经函里取出来——摊平在灯下，推到你手边。「乱的那一行，你抄。」你执笔，她在旁边研墨，研得极慢。那一行你抄了一遍，她俯身看了看，点头：「笔稳。比我那夜稳。」她等墨干透，把回向页收起来——这一回没有压在镇纸下，收进了经函最里层，与六年的华严放在一起。「经的地方，就是心的地方。」她合上函，声音轻如常，耳尖却有一点暖，「它收进去了。往后你知道它在哪儿。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
            } else {
                aff = rivalName ? -9 : -5;
                msg = '「也记。」她点点头，把笔搁正，「出家人不记节令的账——记晚课的拍子。拍子不记你来不来，木鱼记。」她吹熄了半盏灯，殿里暗下来，「那夜少敲的一声，不是账。是——」她找了一会儿词，找得很准，「是我给自己留的空。你今日嫌它多。」灯花爆了一下，她没有再剪，「你回吧。白云庵的门，不落闩。晚课的时辰，从今日起改早——改在你不路过的时辰。这不是赌气，是安置。安置得对不对，你下山慢慢想。」';
                if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - (rivalName ? 8 : 4));
            }
            return { affection: aff, msg: msg };
        }
    },
    'sect_leader_嵩山派': {
        options: [
            { text: '「往后每一个节，我先上嵩山。你核档，我掌灯。」', effect: 'vow' },
            { text: '「新章拿出来。第一百零八条，今日我当面填。」', effect: 'present' },
            { text: '「我真是有事……执法的，连过节也要管？」', effect: 'argue' }
        ],
        effects: function (npc, choice, ctx) {
            var rivalName = ctx && ctx.spentName;
            var aff, msg;
            if (choice === 'vow') {
                aff = rivalName ? 4 : 8;
                msg = '他核卷的手停了。「……掌灯。」他念了一遍，起身，当真从架底取出一只蒲团，摆在掌灯的位置旁边——摆得极正，像量过尺寸。「历年重核，年年节令之夜。」他说，语气像在念条文，条文末尾却松了半分，「掌灯的位置，九年空着。从今日起，有人。」';
                if (rivalName) msg += '归卷时他忽然添了一句，声音特别平：「{rival}处的档，我不核。不核——是执法堂的体面，也是我自己的。两处日子，一处掌灯。灯掌稳了，档就对得上；对不上——」他把卷推正，「档会替我记着。」'.replace('{rival}', rivalName);
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            } else if (choice === 'present') {
                aff = 8;
                msg = '他看了你三息，开架，取出那册《执法堂新章》——翻到最末，摊平在你面前，镇纸压住两角。「第一百零八条，条名『例外』。」他把笔递给你，笔杆调了个头，「条文，你填。怎么填，我不教。执法堂的例外，该由例外自己写。」你执笔写下，他立在旁边看，写完他逐字核了一遍——核完，提笔在条文末尾添了四个字：「此条，两心。」他吹干墨，把新章合上，归到架上最外一格。「从今日起，此条生效。」他顿了顿，「生效之日：今日。失效——条文里没有这一栏。没有这一栏，就是没有失效。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
            } else {
                aff = rivalName ? -10 : -6;
                msg = '「也管。」他点点头，当真翻开执法的册子，翻了两页，又合上——动作极稳，稳得像在结账。「执法堂管条令，不管节令——对。」他把册子归架，「但档有一栏：来档。来档管的是说过要来、没有来的人。」他坐回案后，执笔，不再看你，「那夜那一栏，我给你空了三日。空三日，是我破的例。今日你嫌我管得多。」笔尖落在纸上，一声，极轻，「从今日起，不空了。不空，就是照条归档。归档的条文你知道——满山都查得到。你回吧。判语下来那日，执法堂遣人知会。知会的格式，特别客气。你收着——别嫌它冷。」';
                if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - (rivalName ? 10 : 6));
            }
            return { affection: aff, msg: msg };
        }
    },
    'sect_leader_泰山派': {
        options: [
            { text: '「往后每一个节，寅时之前我上十八盘。第一缕，我陪你迎。」', effect: 'vow' },
            { text: '「档拿出来。那夜那笔『火色，平』，我今日改掉。」', effect: 'present' },
            { text: '「我真是有事……你记你的档，把我写进去做什么。」', effect: 'argue' }
        ],
        effects: function (npc, choice, ctx) {
            var rivalName = ctx && ctx.spentName;
            var aff, msg;
            if (choice === 'vow') {
                aff = rivalName ? 5 : 9;
                msg = '她愣了一息，火钩差点脱手——接住了，脸上的光唰地全回来，比火坛的火还亮：「你说的！泰山不认嘴，认脚！」她把你拉到火坛左边，拿袖子把那块石头又擦了一遍，擦得特别用力，「从明日起，这个位子归你。寅时风大——你站风口，我挡着。」那日的档她让你看着记完：晴，风静。末行她添了五个字：「左手边，有人。」写完吹干，把档揣进怀里，拍了拍。';
                if (rivalName) msg += '下山时她忽然回头，下巴一抬：「{rival}处的灯火，顶上望得见——我望见了。望见了，我什么都没说。」她转身继续下山，走了两步又补一句，「两处的灯，你哪处都别叫它灭。灭一处，顶上都看得见。看得见的时候——我不跟你客气。」'.replace('{rival}', rivalName);
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
            } else if (choice === 'present') {
                aff = 8;
                msg = '她当真从怀里掏出档册，翻到那夜那一页，推到你手边——「火色，平」两个字写得极重，旁边还有一个极轻的炭笔圈。「改。」她把炭笔递给你，抱臂，眼睛盯着你，「泰山的档，临火人亲笔——旁人改，头一回。改坏了，罚你抄十遍。」你拿炭笔把「平」字圈掉，在旁边写了两个字：「有人。」她凑近看，看完不说话，忽然把档册拿回去，就着灯又看了一遍——看得特别久。「好字。」她终于说，把档册合上，这一回没有揣回怀里，放进了火坛角那只竹管——装「日」字拓片的那只。「从今日起——你跟它，一个管。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
            } else {
                aff = rivalName ? -10 : -6;
                msg = '「写进去。」她点点头，点得特别快，从怀里掏出档册——翻到那一页，忽然把整册档倒过来，推到你面前：「那你念。从头念到尾——哪一页、哪一行，不是火色、不是风向、不是炭数？」她站在火坛前，火光映着脸，脸上的光全收了，「临火人的档，十年，独你那一栏不是火。是人。」她把档册收回去，合上，抱在怀里，「今日你嫌我写多了。好。从今日起，档照记——你那一栏，不记了。不记，就是泰山的日夜风雪、迎旭火色，都与你无干。下山。」她转回火坛，开始擦火钩，擦得特别慢，「路滑。走稳。——这一句，是我给你记的最后一行。」';
                if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - (rivalName ? 10 : 6));
            }
            return { affection: aff, msg: msg };
        }
    },
    'sect_leader_青城派': {
        options: [
            { text: '「往后每一个节，我先上青城。你炒茶，我添柴。」', effect: 'vow' },
            { text: '「你给我的那包『茶末』，我带来了。今日当面沏——你尝尝苦不苦。」', effect: 'present' },
            { text: '「我真是有事……看茶的，管得我过节？」', effect: 'argue' }
        ],
        effects: function (npc, choice, ctx) {
            var rivalName = ctx && ctx.spentName;
            var aff, msg;
            if (choice === 'vow') {
                aff = rivalName ? 4 : 8;
                msg = '她添炭的手停了。「……添柴。」她念了一遍，转身从灶边搬出那只小凳，摆在灶口最好的位置——不熏烟、只暖手的那一处，独她知道。「灶口的位子有讲究。坐错了，熏一身，一天的人都嫌你焦。」她蹲下去重新拨火，火光映着耳尖，「从今日起，那个位子归你。柴你添，火色我核。火色不撒谎——」她顿了顿，往灶里添了把柴，声音压低了半调，「人也不许。」';
                if (rivalName) msg += '收茶夹时她忽然说，语速照旧快：「{rival}那儿的茶，少喝。不是小气——是我不识那边的火候。不识的火候，我舍不得你喝坏了。喝坏了，回来——我的灶，替你重炒一锅养回来。」'.replace('{rival}', rivalName);
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            } else if (choice === 'present') {
                aff = 8;
                msg = '你从怀里摸出那包「茶末」——包口原封没动。她盯着那包茶看了两息，话忽然快了：「带来了？带来了就——」她猛地伸手把茶包接过去，拆封，拈一撮进碗，冲水，动作快得一气呵成。茶香漫上来，她端着碗对灯照了照，耳根忽然红了：「……头一茬。」她认了，认得声音特别小，「『末』字是我自己写的。写大些，满山就不疑。」她把那碗茶推到你手边，「喝。这碗今日沏开了，就不是茶末了。」她蹲回灶前添柴，背对着你，声音混在火风里，「从今日起，我给你的茶包，不写这两个字了。写什么——你想。想不出好的，就写我的名字。我的名字，满山都认得。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
            } else {
                aff = rivalName ? -10 : -6;
                msg = '「管得。」她点点头，把茶夹放下了——放得特别轻，轻得像在收一件东西。「看茶的人管火，不管人——这话我平日讲。」她站在架子前，背对着你，「可火有火规：灶里的火，只烧一处。烧两处，两处都熄。」她把架顶那只旧罐取下来，用布包好，收进柜里，「今日你嫌我管得宽。好。从今日起，不管了——茶照炒，包照分，分给谁，不问。不问，就是不等了。」她拍拍手上的灰，「下山吧。路滑。走到山脚下，你最好把今日这句话想明白。想不明白也不要紧——」她顿了顿，「青城茶最重的火规，就四个字：不候过火。」';
                if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - (rivalName ? 10 : 6));
            }
            return { affection: aff, msg: msg };
        }
    },
    'sect_leader_衡山派': {
        options: [
            { text: '「往后每一个节，我先上衡山。你的夜曲，我听头一个半阙。」', effect: 'vow' },
            { text: '「台角的蒲团，我把它抱下来了。往后它跟着我上山下山。」', effect: 'present' },
            { text: '「我真是有事……衡山的夜曲，也数我来不来？」', effect: 'argue' }
        ],
        effects: function (npc, choice, ctx) {
            var rivalName = ctx && ctx.spentName;
            var aff, msg;
            if (choice === 'vow') {
                aff = rivalName ? 4 : 8;
                msg = '她擦弓的手停了。「……头一个半阙。」她念了一遍，很久没有说话——雨在檐外落了一阵。她起身，走到台角，从琴案底下取出另一只蒲团——新的，蒲草味混着雨气。两只蒲团，她并排摆好，中间隔着半步。「半步。」她说，「是弓的位置。近了，弓拉不开。」她坐回去，胡琴归膝，弓毛压弦，那夜的半阙从头拉起——拉到气口，弓悬着，她隔着雨幕望向檐下你的位置，「气口。从今日起——你听。」';
                if (rivalName) msg += '收弓时她忽然添了半句，声音很轻：「{rival}处的雨，也落。落了——好。」她把胡琴裹进油布，裹了一层，停了停，「两处的雨，哪一处都别淋透。淋透了，曲子听得出来。曲子听出来——我就听出来了。」'.replace('{rival}', rivalName);
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            } else if (choice === 'present') {
                aff = 7;
                msg = '她看着你把台角那只蒲团抱下来——没有拦，看着，看你把它抱到面前。「蒲团不重。」她说，「重的，是位子。」她伸手，把蒲团上的蒲草抚平了一遍，抚得极慢。当夜，她亲自把蒲团摆回台角——位置朝檐下挪近了半步，比从前近。收琴前，她从袖中取出那块松香，素布解开——把松香放进你手里。「七岁，师父给的。」她说，「十六年，我捏着。从今日起——你捏一半。捏出指窝来，」她把弓毛收进油布，收了一层，「窝的深浅，就是年头。年头，不撒谎。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
            } else {
                aff = rivalName ? -9 : -5;
                msg = '「也数。」她念了一遍，把弓收回琴上，收得极轻——像收一口气。「曲子不数人。」她望着雨幕，声音慢，字字沉，「它数耳朵。那夜的半阙，我拉给一副空檐下听了。空檐下——曲子记得。比人记得久。」她开始收胡琴，油布一层一层裹好，「今日你嫌它数得多。」油布的绳系上了，系得极实，「从今日起，夜里的曲，停。不是收曲——是衡山的雨照落。落它的。」她抱琴起身，走到台口，停了半息，没有回头，「蒲团你带走。位子——我拂干净了。干净，就是不见灰。也不见人。」';
                if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - (rivalName ? 8 : 4));
            }
            return { affection: aff, msg: msg };
        }
    },
    'sect_leader_丐帮': {
        options: [
            { text: '「往后每一个节，我先来粥棚。头一碗粥，我陪你喝。」', effect: 'vow' },
            { text: '「你拔下来的那支签——今日我自己刻一行。」', effect: 'present' },
            { text: '「我真是有事……讯房的，也数我过不过节？」', effect: 'argue' }
        ],
        effects: function (npc, choice, ctx) {
            var rivalName = ctx && ctx.spentName;
            var aff, msg;
            if (choice === 'vow') {
                aff = rivalName ? 5 : 9;
                msg = '他摞碗的手停了。「……头一碗。」他念了一遍，忽然蹲下去，把那只豁口朝里的碗从案角拿回来——摆在案中央，盛粥，八分满，推到你手边。「粥棚的规矩，头一碗给长者。今日改。」他给自己也盛了一碗，端起来，与你的碗碰了一下，豁口碰豁口，一声脆响，「头一碗，给来的人。」他喝了一口，声音压低，像告诉你一桩讯房的秘密，「这条规矩，我立的。谁不服——让他来，我把他编成书讲。讲得满棚笑，笑完了，谁也不记得规矩本身。」';
                if (rivalName) msg += '收碗时他忽然补了一句，语气平得像核签：「{rival}那儿的粥，我也叫人送了一碗过去。送了——是讯房的礼数。你记着一样：两处的碗，哪一只先凉，我的网比你先知道。」'.replace('{rival}', rivalName);
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
            } else if (choice === 'present') {
                aff = 8;
                msg = '他看你拿起刻刀——没有拦，只把灯往你这边挪了挪，看你刻。你在那支签的背面刻了一行字：下节，头一碗。他接过去，核了一遍——核得极认真，像核天下所有的档。「来路：本人亲手。」他念完批注，取出刻刀，在你那行字旁边刻了一个日子——刻得特别小，是今日。「讯房的规矩，批语要配日子。」他把签挂回墙上，还是离案最近的那一排最末，「节到了，签自己对。对出来的消息——」他收刀入屉，坐下，给你斟茶，「不坏。你刻的，更不坏。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
            } else {
                aff = rivalName ? -10 : -6;
                msg = '「也数。」他点点头，笑了——笑得跟说书时一样眉飞色舞，只有眼睛没有笑，「讯房不数来不来——数日子。你的日子，三条腿，我这墙上三千七百支签，哪一支都替你数得出。」他把碗一只一只收回去，收得特别齐，「今日你嫌数得宽。好。」最后一只碗倒扣上架，扣得端端正正，「从今日起，不数了。不数，就是：你的事，不入档，不上墙，不进我这心里。三个『不』——讯房最重的规矩，销案的人才配。」他吹了灯，黑暗里门开了，晚风灌进来，「你回吧。粥棚的书照讲。你那一段——且听下回分解。下回，」门轻轻合上，「没有下回。」';
                if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - (rivalName ? 10 : 6));
            }
            return { affection: aff, msg: msg };
        }
    },
    'sect_leader_阎罗殿': {
        options: [
            { text: '「往后每一个节，我先来阎罗殿。你核档，我掌灯。」', effect: 'vow' },
            { text: '「那枚『未定』的签，今日揭了——当着我，换一枚新的。」', effect: 'present' },
            { text: '「我真是有事……生死簿都不管人过节，你管我？」', effect: 'argue' }
        ],
        effects: function (npc, choice, ctx) {
            var rivalName = ctx && ctx.spentName;
            var aff, msg;
            if (choice === 'vow') {
                aff = rivalName ? 4 : 8;
                msg = '他核档的手停住了。「……掌灯。」他念了一遍，很轻，像在核一个字。半晌，他当真从案底取出一只旧垫子，摆在掌灯的位置旁边——摆得极正，像量过尺寸。「岁末重核，年年节令之夜。」他说，语气像在念规，规的末尾却松了半分，「掌灯的位置，十年空着。从今日起，有人。」';
                if (rivalName) msg += '归册时他忽然添了一句，声音特别平：「{rival}处的档，我不核。不核，是档房的规——也是我自己的。」他把案上的册子推正，「两处日子，一处掌灯。灯掌稳了，日子就对得上；对不上——」他顿了顿，「册子替我记着。」'.replace('{rival}', rivalName);
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            } else if (choice === 'present') {
                aff = 8;
                msg = '他看了你三息，起身，把那枚「未定」的档签从格上取下来——揭了，揭得极慢，像揭一枚贴了十年的封条。他把新签搁在旧签旁边，研墨，把笔递给你，笔杆调了个头：「新签，你写。」他说，「档房贴签，签由卷定——今日破例。破例的签，该由破例的人写。」你提笔写了两个字：常核。他俯身看了很久，看完把新签贴回档格最正面，按平。旧签他没有丢——收进了袖子，不是档袋。「揭签，不弃签。」他坐回去，耳根红着，语气照旧平，「旧签存照。存照的意思：这一卷，有过一段未定的日子。从今日起——定了。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
            } else {
                aff = rivalName ? -10 : -6;
                msg = '「我管。」他点点头，把墨笔扣上笔帽，搁回笔山——搁得极实。「生死簿记人该死的日子。」他一字一顿，「你的日子——我只记你来不来。」他把你那卷档从近手的格里取出来，归回高架，归到最远的那一格，摆正。「从今日起，不复核了。不复核，就是：你来不来，空不空白，档房不问。」灯花爆了一下，他没有剪，「你回吧。这一卷，核讫——判语：存而未结。」他取出另一册，不再看你。黑暗里笔尖走纸，走了一行，停了很久。「存而未结的卷，规上说我背得出来。搁在哪一格，我也背得出来。」他的声音比平时更低，「我背给自己听过。背得很轻。」';
                if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - (rivalName ? 10 : 6));
            }
            return { affection: aff, msg: msg };
        }
    },
    'sect_leader_血手门': {
        options: [
            { text: '「往后每一个节，我先进药庐。你翻药，我看灯。」', effect: 'vow' },
            { text: '「清单拿出来。赶集那一行——明日就是集日，我带你去。」', effect: 'present' },
            { text: '「我真是有事……血手门的人，也记过节的账？」', effect: 'argue' }
        ],
        effects: function (npc, choice, ctx) {
            var rivalName = ctx && ctx.spentName;
            var aff, msg;
            if (choice === 'vow') {
                aff = rivalName ? 4 : 8;
                msg = '她翻药的手停住了。「……看灯。」她念了一遍，很轻，像核对一条方子。半晌，她从灶边搬出那只小凳，摆在素灯旁边——不熏烟、只暖手的那一处，独她知道。「灯下的位子有讲究。坐错了，一身药气，一天的人都嫌你苦。」她坐回药碾子前，灯花映着耳尖，「从今日起，那个位子归你。数目我数——你在旁边听着，就数得着。」';
                if (rivalName) msg += '收碾子时她忽然说，语气照旧平：「{rival}那儿要是伤了风，别乱吃药——那边的方子，我不识。不识的方子，我舍不得你喝坏了。喝坏了，回来——我的白药，从头碾给你养回来。」'.replace('{rival}', rivalName);
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            } else if (choice === 'present') {
                aff = 8;
                msg = '她看了你两息，转身把清单从灯座底下取出来——摊平在灯下，推到你手边。「赶集」那一行，三年的注脚都是空白。「写。」她把笔递给你，「清单的注脚，我自己写——你的，破例。」你写下明日的日子。她俯身看了很久，看完起身，从枕头底下取出那件没上过身的干净衣裳，在灯前比了比，耳朵红着，语气平平：「赶集要穿干净衣裳。这一件我缝了三年——一直在等清单上的日子。」她把衣裳叠好收回去，把清单塞进你怀里，「清单你收一夜。明日我若是起晚了——你照着清单骂我。『被人骂晚归』那一行，今日先演一遍。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
            } else {
                aff = rivalName ? -10 : -6;
                msg = '「也记。」她点点头，把药碾子归了位——归得特别轻，轻得像在收一件东西。「门里的人记账，记抬进来几个、缝好几个、吃了几碗饭。」她立在架子前，背对着你，「我多记一样：日子普不普通。普通的，都在清单上——清单就是我的方子。」她把灯座底下那包「安稳」的白药取出来，归回架子最底层，「今日你嫌我记多了。好。从今日起，不记了——药照碾，数照报，清单不添注脚了。」她回灶前封了火，火光映着侧脸，「回去吧。门口的路黑，走稳。这句不是按清单来的——是按三年来的。三年记着你，今日嫌多了，这一句，也收不回。」';
                if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - (rivalName ? 10 : 6));
            }
            return { affection: aff, msg: msg };
        }
    },
    'sect_leader_飞蝎坞': {
        options: [
            { text: '「往后每一个节，灯火熄之前我在坞里。蝎房屋顶，我陪你数灯。」', effect: 'vow' },
            { text: '「蝎册拿出来。你啪地合上的那一页——今日当着我翻开。」', effect: 'present' },
            { text: '「我真是有事……你们坞里人，过节也记册？」', effect: 'argue' }
        ],
        effects: function (npc, choice, ctx) {
            var rivalName = ctx && ctx.spentName;
            var aff, msg;
            if (choice === 'vow') {
                aff = rivalName ? 5 : 9;
                msg = '她愣了一息，竹钳差点脱手——接住了，脸上的光唰地全回来，比坞外集市的灯火还亮：「你说的！沙漠不认嘴，认脚！」她一把攥住你的手腕把你拽到对练场，下巴朝蝎房屋顶一抬，「从明日起，那个屋顶归你——风大，我挡着。」那夜她当真拉你上了屋顶，金蝎伏在两人中间，尾钩竖了一竖，又缓缓伏下去。「伏钩，是认了。」她说，声音压低了半调，「它认过你一回，今夜是第二回——第二回，比头一回稳。」';
                if (rivalName) msg += '下屋顶时她忽然回头，下巴一抬：「{rival}那儿的灯火，屋顶上望得见——我望见了。望见了，我什么都没说。」她接着下屋顶，走了两步又补一句，「两处的灯，你哪处都别叫它灭。灭一处，屋顶上望得见。望得见的时候——我不跟你客气。」'.replace('{rival}', rivalName);
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
            } else if (choice === 'present') {
                aff = 8;
                msg = '她盯着你看了三息，手慢慢伸向册架——把蝎册取下来，攥在手里，攥得特别紧。「这一页，三年我就翻回头看过。」她坐下，把册子摊在膝头，翻到那一页——翻到了，忽然又啪地合上，耳根通红，嗓门拔起来：「他娘的，不行！今日不能给你看！」她抱着册子站起来绕着对练场走了两圈，金蝎追着她跑。她忽然站定，咬牙切齿，把册子重新翻开——那一页密密麻麻全是蝇头小注，最末一行是新添的。她没有让你看字，只把册子塞进你手里，背过身去：「自己看。看完笑出声，我就掰腕子掰到你服。」你翻开——那一页最末一行小注写着：此条，候一个日子。候的是什么日子，她没说。可蝎册旁那支炭笔，那夜被她削得特别尖。';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
            } else {
                aff = rivalName ? -10 : -6;
                msg = '「记册。」她点点头，点得特别快，忽然把蝎册啪地一合，归架——归得特别实。「对。坞里的册子记生意，不记节——今日你教了我一条。」她抄起钩杖背过身，朝蝎窝走，声音不高，不高比高吓人，「这东西为你半夜出窝，我追了三十里。追回来我骂了它半个时辰——你知道我骂的什么？」竹钳敲在窝壁上，一声，「我骂它：人家把你当生意，你把自己搭进去做什么。」她蹲在窝架前背对着你分窝，「回去吧。从今日起，坞里的册子，你的页——生意归生意。本来要留给你的那半页……」竹钳的声音停了，「擦了。擦得干干净净。沙漠的人做事，擦，就擦干净。」';
                if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - (rivalName ? 10 : 6));
            }
            return { affection: aff, msg: msg };
        }
    },
    'sect_leader_烈日教': {
        options: [
            { text: '「往后每一个节，我先进烈日教。你巡火，我站风口。」', effect: 'vow' },
            { text: '「仪轨册拿出来。我的名字，今日我自己从『客』栏里挪走。」', effect: 'present' },
            { text: '「我真是有事……你们教里诵经，也管得着我人在哪儿？」', effect: 'argue' }
        ],
        effects: function (npc, choice, ctx) {
            var rivalName = ctx && ctx.spentName;
            var aff, msg;
            if (choice === 'vow') {
                aff = rivalName ? 4 : 8;
                msg = '她添油的手停住了。「……站风口。」她念了一遍，忽然吐槽垮出来，火力却只有半分：「风口是全教最冷的位置，你知道么？仪轨规定站一炷香，我站了八年——」她忽然收声，转身退了侍立的祭司，声音压低，「好。从今日起，风口那一炷香，我拆成两半。」她把你拉到龛侧，指着地上火光照得到的位置，「另一半你站这儿。这个位置，全教最暖——仪轨里没有它。」她给圣火添了一勺油，火苗亮起来，映在她眼睛里，「仪轨里没有的，是我自己的。」';
                if (rivalName) msg += '收油罐时她忽然补了一句，语速特别快：「{rival}那儿要是冷了，别硬撑——那边的火候，我不识。不识的火候，我舍不得你冻着。冻着了回来——我们教的圣火，经上写焚尽尘与妄，没写不能暖人。暖人这一条，是我自己革的新。」'.replace('{rival}', rivalName);
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            } else if (choice === 'present') {
                aff = 8;
                msg = '她看了你三息，圣女腔先出来半句：「仪轨是公器——」半句没撑住，转身进屋取册子，脚步特别快，像怕自己慢了会反悔。她把仪轨册摊平在火龛前，翻到「客」栏，把笔递给你，笔杆调了个头：「写。外人执笔，八年没有先例——今日有第一个。」你把自己的名字从客栏里挪出来，挪到火边那一栏的空白处，旁边添了一行小注：同巡火。她俯身看了很久，看完没有吐槽——半晌，她抬手把圣女冠扶正，扶得一丝不苟，声音特别轻：「……你知道，全教的仪轨册，离火最近的那一栏，八年来只有一个名字。」她合上册子，耳根红着，嘴又硬回来：「今日两个。高台问起——我就说仪轨革新。革新要罚，罚我领得规规矩矩。栏，我不挪回去。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
            } else {
                aff = rivalName ? -10 : -6;
                msg = '「管得着。」她点点头，把油罐搁下——搁得特别轻，轻得像在收一件东西。圣女腔先出来，一字一字慢：「经不管人在哪儿。经只管火。」圣女腔说完，吐槽没有跟上来——这是最叫你不安的。她立在龛前沉默了一会儿，火光照着她的侧脸，端得极正。「八年，我诵经没有串过词。为你串了半句的那日起，我明白了一件事：串词的经，是诵经的人有心了。」她抬手把圣女冠摘下来，捧在手里，看了很久，「今日你嫌我的心管得宽。好。」她把冠戴回去，戴得一丝不歪，「从今日起，你名下的祈福，我全按客仪诵——一个字，都不会错。不错，就是无心了。」她开龛门，风进来，火没有晃，「回去吧。经照诵，火照巡。只是风口那半炷香——从今日起我站满。站满，是仪轨。仪轨管着我，正好。」';
                if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - (rivalName ? 10 : 6));
            }
            return { affection: aff, msg: msg };
        }
    },
    'sect_leader_天龙教': {
        options: [
            { text: '「往后每一个节，我先进天龙教。你传令，我在灯下听。」', effect: 'vow' },
            { text: '「残铜镜拿出来。今日我用你的调子说一句话——你照着镜子听。」', effect: 'present' },
            { text: '「我真是有事……传声房的令，几时管到人过节了？」', effect: 'argue' }
        ],
        effects: function (npc, choice, ctx) {
            var rivalName = ctx && ctx.spentName;
            var aff, msg;
            if (choice === 'vow') {
                aff = rivalName ? 4 : 8;
                msg = '她攥牌的手停住了。她看了你两息，忽然起身进传声房——出来的时候手里多了一盏灯，新的，灯罩特别小。她把灯挂在廊下的台阶边，位置正对着传声房的门：（用云婆婆的调子）「娃儿，婆婆等人，灯挂在门口。」传完自己切回来，干脆垮出来：「婆婆挂门口，我挂台阶——台阶离门近。从今日起，节夜的灯归它，你归灯底下坐着。令我传给教里——添出来的那半句，传给你。」她顿了顿，忽然用你的调子传了一句，学得极像：（用你的调子）「檀望舒，我来了。」传完自己先笑，耳根红着：「你看，你这一句我替你练像了。下回你亲口说，照抄就是——抄得像，灯认。」';
                if (rivalName) msg += '收灯时她忽然补了一句，换成知客的平板腔：（用黑袍知客的调子）「{rival}处的令，细听；我这儿的半句，也细听。」传完自己吐了吐舌头，「太标准了，不像我——意思是，两处的令，别叫它串了。串了，我的耳朵先知道。我的耳朵知道了——」她拍拍铜镜牌，干脆回来，「就不好办了。」'.replace('{rival}', rivalName);
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            } else if (choice === 'present') {
                aff = 8;
                msg = '她愣了半息：「照着镜子听？」她把半面残铜镜从袖里取出来——镜面朝上，举得极慢。「这面镜子只照半张脸。传声房的规矩就是它定的：学谁的声都只学一半——剩下一半，留给我自己。」镜子里的半张脸看着你，「我的调子，八年，没有几个人肯费心听。你要听——听仔细了。」你在台阶上坐下，开口，用她的干脆，学她的话传给她一句：你传的令归教里，添的半句归我。她手里的镜子晃了一下。她低头看着镜子里那半张脸，看了很久，抬起头时耳根红着，声音里掺了一点哑：「……你学我的调子，学得不像。」她用袖子把镜面擦了一遍，擦完把镜子朝你举过来——半面镜子里，头一回照进来两个人。「不像，才好。像的是令；不像的——才是人说的话。这镜子今日归你收半日。还的时候，用你那口不像的调子，多说一句。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
            } else {
                aff = rivalName ? -10 : -6;
                msg = '「管得着。」她点点头，把铜镜牌收进怀里——收进牌套最里层，穗子系得特别实。（用香主的调子）「教规：传声房传令，不问客事。」传完她坐得端端正正，干脆全收了：「这条教规，我守了八年。破例的那一日，是我把你的话练了三遍——练三遍，不是传令，是问客事。」她起身掸了掸袍子，走到廊口，站住，背对着你：「从今日起，客事归教规。令照传，调子照学，你的名字进令——闻声即落，不多一个字。」她下了台阶，铜镜牌磕在牌套上，一声，又一声。暮色暗下来，最后一句从台阶底下飘上来，用云婆婆的调子，学得特别软，软得像在哄自己：（用云婆婆的调子）「娃儿，嗓子干净的人，念经没人听。」第二日云婆婆告诉你：那孩子昨夜没有练任何调子，把半面残铜镜抱到坛后的回音壁站了半宿——站了半宿，一声都没有喊。回来的时候她说了一句：婆婆，今日我把嗓子收回来了。收回来，还是我自己的。';
                if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - (rivalName ? 10 : 6));
            }
            return { affection: aff, msg: msg };
        }
    },
    'sect_leader_神机门': {
        options: [
            { text: '「往后每一个节，我先进神机门。你上弦，我掌灯。」', effect: 'vow' },
            { text: '「黄铜齿轮匣拿出来。今日我替你上一次弦——你教我拍子。」', effect: 'present' },
            { text: '「我真是有事……你的机关量得着时辰，量不着人心。」', effect: 'argue' }
        ],
        effects: function (npc, choice, ctx) {
            var rivalName = ctx && ctx.spentName;
            var aff, msg;
            if (choice === 'vow') {
                aff = rivalName ? 4 : 8;
                msg = '她握校准笔的手停住了。「……掌灯。」她重复了一遍，像在核一个新参数。半晌，她把案上半校的机关挪开，从架底取出一只旧座钟——钟里的铃是拆掉的。「神机门节夜有个旧例：子时上弦一回，一年时辰不差。」她把钟的钥匙摁进你手心，钥匙是热的，焐了不知几年。「掌灯的看钟面，上弦的听拍子。拍子要对上两个人。」她把钟摆上案心，摆得端端正正，耳根红着，语气像在报数，「从今夜起，这只钟入册——册名我想好了。」你问叫什么。「不迟。」她答完，把钟又朝你推了半寸，「不迟的意思是：钟走到哪儿，人跟到哪儿。」';
                if (rivalName) msg += '收钟的时候她忽然添了一句，平得像报误差：「{rival}处的时辰，我不校。不校，就是——我的机器只管自家门里。」她扣上齿轮匣，「两处日子，一只钟。钟不停，时辰就对得上。对不上——」她停了停，「机关雀比我先知道。」'.replace('{rival}', rivalName);
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            } else if (choice === 'present') {
                aff = 8;
                msg = '她盯着你看了三息，慢慢把颈间那只黄铜齿轮匣取下来，打开——匣里那副主齿轮和存照的旧发条并排躺着。「上弦的法子不难。」她把你的手引到弦轴上，她的手凉，弦轴热，「三圈半。多半圈崩，少半圈走不到天明。」你上弦，她数拍子，数完忽然说：「拍子乱了。」你心里一紧，她却不看钟，看的是你的手：「……乱在我。我的手抖了，传给你的。」她合上匣子，这一回把匣子摁进你手里，不许你还：「匣子你收着。齿轮匣随人——人在，弦就有人上。这一条，门规里没有。」架上机关雀滴答了一声，这一声的拍子，头一回是跟着你走的。';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
            } else {
                aff = rivalName ? -10 : -6;
                msg = '「量不着。」她点点头，把齿轮匣合上，归进案头最里层的匣屉。「机器量时辰，不量人心。」她坐回校准台前，背对着你，校准笔落下去，笔笔极稳——稳得过分。「我僭越了。今日把僭越退回去：往后你的时辰，神机门不量。不量，不记，不算。」灯花爆了一声，她没有剪。你转身要走，架上那只机关雀忽然滴答乱拍，乱得整间工坊都听得见。她伸手把它按住，按雀的手有一点点抖。「它没有学过量你。」她的声音低了半格，「它只是见了你，拍子就乱。这个毛病——」她把雀收进袖子，「修不好。我不想修。」';
                if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - (rivalName ? 10 : 6));
            }
            return { affection: aff, msg: msg };
        }
    },
    'sect_leader_霹雳堂': {
        options: [
            { text: '「往后每一个节，我先进霹雳堂。你绑引信，我看火。」', effect: 'vow' },
            { text: '「方子册拿出来。『人，不足』那一页——今日当着我，你添下文。」', effect: 'present' },
            { text: '「我真是有事……火药棚里的人，也管得着我在哪儿过节？」', effect: 'argue' }
        ],
        effects: function (npc, choice, ctx) {
            var rivalName = ctx && ctx.spentName;
            var aff, msg;
            if (choice === 'vow') {
                aff = rivalName ? 4 : 8;
                msg = '他捻引信的手停住了。他静了很久，然后把方子册拿起来，翻到批注页，把笔递给你——笔杆调了个头，笔尖朝着他自己。「批注向来是我一个人写。外人执笔——霹雳堂二十年没有。」他的声音极轻，「今日有第一个。写。」你落笔写了一行：是夜，人在棚中，硝干。他俯身看，看完在你的字后头添了一个极小的字：「好。」写完他合上册子，收进怀里，贴着心口按实，照例补了一句：「……我收了。我真的收了。」他从防火布囊里取出那根最长的引信，盘得特别匀，塞给你：「节夜点它。它烧得慢。慢，就是一夜都过不完——过不完，就有一夜的话，慢慢说。」';
                if (rivalName) msg += '收布囊的时候他忽然补了一句，声音轻到你要俯身两次才听清：「{rival}那儿的火要是太旺，别硬撑——那边的火性，我不识。不识的火，我舍不得你烫着。烫着了回来——伤药我自己配，方子拟了三日，在册子里。」'.replace('{rival}', rivalName);
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            } else if (choice === 'present') {
                aff = 8;
                msg = '他盯着你看了两息，把火药方子册从怀里取出来，翻到那一页——「是日，贺礼出库。硝，足。人，不足。」他把册子摊平推到你面前，笔递过来，手极稳，声音极不稳：「批注是我写的。补批——你来。」你接过笔，问写什么。他看着灯，灯火在他眼睛里晃：「写什么都行。你写完，我在你的字后头批一个字。」你写：此页往后，不足销了。他俯身看，看了很久，提笔在你字旁批下去，批得一字一顿，写完自己先愣住——批的不是一个字，是四个字：「已足。录讫。」他耳根红透，声音落到灯花底下：「超规了。四字批注，批了四个字的批注……」他没有划，把册子合上，合得极慢，像怕压坏墨，「不划。这一页，是我二十年写得最超规的一页。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
            } else {
                aff = rivalName ? -10 : -6;
                msg = '「管得着。」他重复了一遍，点点头，把方子册合上，归架——归得极正。「火药不管过节。火药管燥湿。」他重新拿起引信盘，一盘一盘，盘得极匀。「我僭越了。这一条，销。」他说「销」字的时候极轻，轻得像掸掉一星药灰。销完他吹了灯。黑暗里你听见他把铁皮盒收好，咔的一声，只一声。你转身要走，黑暗里飘出来半句，轻得你以为是夜风：「……人，不足。这三个字销不掉。字销得掉——人销不掉。」第二日堂里人说：昨夜引信房的灯熄得极早，三更却响过一挂极短的爆竹，短得只有三响。三响不是任何号令。帮里的老人听见了，说：三响的爆竹，霹雳堂只有一种放法——放给不肯回头的人听，响一声是「在」，响两声是「等」，响三声，是「我不问了」。';
                if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - (rivalName ? 10 : 6));
            }
            return { affection: aff, msg: msg };
        }
    },
    'sect_leader_天书阁': {
        options: [
            { text: '「往后每一个节，我先进天书阁。你讎书，我剪灯。」', effect: 'vow' },
            { text: '「那卷破页角的书拿出来。今日的批注我写——你讎。」', effect: 'present' },
            { text: '「我真是有事……天书阁的校讎，也管到人过节了？」', effect: 'argue' }
        ],
        effects: function (npc, choice, ctx) {
            var rivalName = ctx && ctx.spentName;
            var aff, msg;
            if (choice === 'vow') {
                aff = rivalName ? 4 : 8;
                msg = '他执卷的手停住了。「……剪灯。」他重复了一遍，点点头，起身把案上的旧卷往你那边挪了半盏灯的位置——挪得不熏眼、不挡手，独他知道的那一处。「剪灯的不翻页，翻页的不剪灯。校讎房的老例。」他重新点了灯，火苗立直，「从今日起，节夜的灯归你，讎归我。讎的是——」他翻开一卷，指了指封皮，字短得像批注，「不是书。是日子。日子讎细了，一个字都不会错。」';
                if (rivalName) msg += '归卷的时候他忽然添了一句，短得像批注：「{rival}处的条，我不讎。校讎房只讎进了自家门的书。」他把卷摆正，「两处日子，一盏灯。灯稳，字就稳。字不稳——」他顿了顿，「你拿回来。我重讎。重讎不丢人。不来讎，才丢人。」'.replace('{rival}', rivalName);
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            } else if (choice === 'present') {
                aff = 8;
                msg = '他盯着你看了两息，起身，从近手那一格取下那卷——页角补过的。摊开，笔递给你，笔杆调了个头：「批注由卷主写。校讎的人，讎。今日倒过来。」你接过笔，在那条批注栏里，「存疑」旁边写下三个字：不疑了。他俯身讎，讎了很久，然后取校讎笔在你的字外圈了一个极小的圈，圈得极圆。「讎规：疑销，圈之。」他合上卷，耳根红着，话照旧短，「圈了的条，永不再开。」他把卷归架，归到最外一格，封皮朝外：「天书阁千卷，圈了的——」他顿了顿，「含这卷，两卷。另一卷在哪儿，不告诉你。告诉你，就不叫存照了。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
            } else {
                aff = rivalName ? -10 : -6;
                msg = '「管得着。」他重复了一遍，点点头，把那卷合上，归到架子最顶——十年不动的那一格。「校讎房管字。字不管人。」他坐回案前，取过旧卷，笔笔极稳，稳得像刻意。「你的条，结卷。结卷不销字——天书阁不销字。」灯花爆了一声，他没有剪。你转身要走，他在背后添了四个字，轻得像批注：「存疑，不改。」第二日天书阁的书记说：校讎先生昨夜讎了一卷空白的新书，讎到天亮，天亮在封皮批了一条，批语两个字：「卷讫。」空白卷，讫不了。他批完「卷讫」，对着那两个字坐到五更——没有划，只是把卷合上，搁在了离手最近的地方。';
                if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - (rivalName ? 10 : 6));
            }
            return { affection: aff, msg: msg };
        }
    },
    'sect_leader_大隐阁': {
        options: [
            { text: '「往后每一个节，我先上大隐阁的台阶。你数签，我买山楂。」', effect: 'vow' },
            { text: '「你存着的那颗风干山楂拿出来。今日你我分了——卦辞当场改。」', effect: 'present' },
            { text: '「我真是有事……你蹲台阶数糖葫芦，也配叫起卦？」', effect: 'argue' }
        ],
        effects: function (npc, choice, ctx) {
            var rivalName = ctx && ctx.spentName;
            var aff, msg;
            if (choice === 'vow') {
                aff = rivalName ? 4 : 8;
                msg = '他摆手的手停住了。他盯着你看了两息，忽然大腿一拍，站起来：「买山楂！好卦！这是有人管饭的卦！」他从怀里摸出那颗蜡纸包着的风干山楂，摁进你手里，摁完不撒手：「光给你不行。立签的规矩：头一颗你数，末一颗我数，中间的我们一起数。」他拉着你重新蹲回台阶，抽出新签，一颗一颗数得极认真，「新规矩头一卦——剩四颗，诸事宜静。」他瞥你一眼，眼睛弯弯的，「静，就是别动。节过完了，我带你下山买山楂。买三串。一串给现在，一串给明年，一串——」他把第三串的位置空着，拍了拍台阶缝，「给那个说得出名字的日子。」';
                if (rivalName) msg += '数签的时候他忽然补了半句，半仙腔混着干饭腔：「{rival}那一处，我不占。不占，就是——我的签只管自家台阶。」他把一颗山楂丢进嘴里，「两处日子，一串签。签不尽，日子就不尽。尽了——」他把签头那颗立回台阶缝，「还有它。它永远不尽。记着：莫尽。」'.replace('{rival}', rivalName);
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            } else if (choice === 'present') {
                aff = 8;
                msg = '他愣了半息：「当场改？」他把那颗风干山楂从怀里取出来，蜡纸拆开——山楂干得发皱，皱得像个小太阳。「这一颗存了二十年。二十年的卦辞全指着它：莫尽。」他把它掰成两半，掰得极认真，像分一道符，大的那半摁进你手里，小的那半搁进自己嘴里。嚼了两下，忽然停住：「……酸。」说完「酸」字他自己笑起来，笑得越来越大，笑完眼睛有点红，「酸就对了。卦辞改了——新卦辞，我当场拟两个字。」你问哪两个字。他指指你手里那半颗，又指指自己嘴里那半颗：「同味。」他把蜡纸收好，收进怀里，收得极妥帖：「纸留着，纸记旧卦辞。人跟新卦辞走——新卦辞是：签头那颗，从此两个人分。分了，也不尽。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
            } else {
                aff = rivalName ? -10 : -6;
                msg = '「配。」他重复了一遍，忽然不笑了。他蹲在台阶上，把三根签子一根一根收进蜡纸，收得整整齐齐。「糖葫芦不配起卦。」他说得特别平，「我娘说：吃的是山楂，数的是日子。你叫它起卦——起卦可以不信。日子，信不信都过。」他起身拍拍衣摆，把台阶缝里的签拔了，收进阁里。第二日台阶缝里空了。阁里人问隗先生，签怎么收了，他蹲在门口扒饭，头也不抬：「卦死了。」问卦死了怎么办，他扒完一口饭，答了两个字：「莫尽。」答完自己愣了半息，把碗搁下，望着山门外的台阶缝——缝里空着，他望了很久，望到饭凉，末了对着空缝说了一句，谁也没听清：「……签收了，缝还留着。留缝，就是还想起。」';
                if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - (rivalName ? 10 : 6));
            }
            return { affection: aff, msg: msg };
        }
    },
    'sect_leader_侠隐阁': {
        options: [
            { text: '「往后每一个节，我先进侠隐阁的档廊。你勘档，我掌灯。」', effect: 'vow' },
            { text: '「封皮空白那一卷拿出来。今日写上名字——我看着你写。」', effect: 'present' },
            { text: '「我真是有事……你建你的档，比人过节还大？」', effect: 'argue' }
        ],
        effects: function (npc, choice, ctx) {
            var rivalName = ctx && ctx.spentName;
            var aff, msg;
            if (choice === 'vow') {
                aff = rivalName ? 4 : 8;
                msg = '他掌灯的手停住了。「……掌灯。」他重复了一遍，批注腔，尾音却松了。他把案头的档往你那边推了半盏灯的位置——推到灯光正好、不晃眼的地方：「勘档的在灯下，掌灯的在案左。左，是影子不落字的地方。」他顿了顿，从架底取出一只旧蒲团，摆在案左，摆得极正：「蒲团早备下了。备下的日子——档里没有这一条，不要问。」他翻开档，耳根红着，批注腔努力端平：「从今夜起：节夜，你掌灯，我勘档，勘到五更。这一条入正册——册上的格式我拟好了。」你问格式叫什么。「『同勘』。」他答完，把灯又朝你拨正了半分，「档廊三百年，勘档都是一个人。同勘——头一回。头一回的格式，往后就是例。」';
                if (rivalName) msg += '归档的时候他忽然添了一句，批注腔平着：「{rival}处的附档，我不勘。危险程度一栏，永远空白。」他把档压得极正，「空白不是宽纵，是档廊的规矩——我不勘的，我不碰。你的两处日子，一卷档。档在近手，就不会死。死档入地库——」他看了一眼最顶那一格，「地库冷。我舍不得。」'.replace('{rival}', rivalName);
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            } else if (choice === 'present') {
                aff = 8;
                msg = '他盯着你看了三息，起身，走到最顶那一格——十年不动的那一格，把那卷封皮空白的档取下来。档上的灰是干净的，擦过，擦痕很新。「这一卷，空白三年。」他把档摊在案上，笔递给你，笔杆调了个头：「档规：封皮的名，档主自己写。我没有档主——你写。」你接过笔，问写什么。他看着空白封皮，灯火在他眼睛里一动不动：「写什么都行。你写什么，我核什么。」你落下你自己的名字。他俯身核，核了很久，然后在名字旁边补了一行极小的注，注完把档合上，归进近手那一格，压得极实：「注写的什么，不念给你听。念出来，就超三页了。」他坐回去，批注腔端回来了，端得有点晃：「空白有名。有名，就是——不空了。不空的档，年年勘。勘的人两个。这一条，今日入册。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
            } else {
                aff = rivalName ? -10 : -6;
                msg = '「比人大。」他重复了一遍，点点头，把你那卷档合上，归架——归的位置，不是近手那一格了。「档不管节。档管日子。」他坐回案后，取过旧档，批注腔平得没有一丝缝，「你的条，结了。结的格式：不勘，不注，不候。」他说「不候」的时候，笔尖顿了半拍——半拍，在档廊里听得见灯花响。你转身要走，他在背后补了最后一条录，平得像刻的：「另录：我自己那页，仍空白。从前空白，是没人写。今夜起空白——是写的人走了。」第二日书记说：简先生昨夜把那卷空白档又取下来了，抱着坐到五更，一个字没写。归格的时候他在封皮上批了四个字，又划了。划掉的四个字书记没看清——只看清划得极重，重得破了纸。破了纸的封皮，他没有补。档廊的人都知道：简先生补页的手天下第一。不补的页，是他不肯补。';
                if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - (rivalName ? 10 : 6));
            }
            return { affection: aff, msg: msg };
        }
    },
    'sect_leader_天涯海阁': {
        options: [
            { text: '「往后每一个节，我先进天涯海阁。你发引，我报站名。」', effect: 'vow' },
            { text: '「半枚铜符拿出来。今日对符——对不对得上，你自己看。」', effect: 'present' },
            { text: '「我真是有事……天涯海阁的驿站，也管到人过节了？」', effect: 'argue' }
        ],
        effects: function (npc, choice, ctx) {
            var rivalName = ctx && ctx.spentName;
            var aff, msg;
            if (choice === 'vow') {
                aff = rivalName ? 4 : 8;
                msg = '他执笔的手停住了。他起身，整了整衣冠，躬身半度——这一躬比从前都深，直起身时声音也比从前都稳：「报站名，好。驿站旧例：报了站名的人，路就不算白走。」他取过一张新引，展开，压在案头最前，「从今夜起，每年节夜，本亭头一张路引发给你。站名栏——」他把笔递过来，笔杆调了个头，「你自己填。填一处是一处。填完归期栏，我批。」你问批什么。他研墨，研得极慢，极匀：「批『准』。驿站批文千百字，独这个字——」他抬眼，公文腔里透着那点颤，「我批得最稳。」';
                if (rivalName) msg += '收引的时候他忽然添了一句，公文腔，末字却颤：「{rival}处的路，我核过站名，站站有驿，驿驿有灯。」他把路引压得极正，「路好，就是——我放心得下。这一句不入公文。两处日子，一个归期。归期填了，路就不错。错了——」他把铜符攥了一回，「驿亭的灯，照点。」'.replace('{rival}', rivalName);
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            } else if (choice === 'present') {
                aff = 8;
                msg = '他愣了半息，从袖中取出那半枚铜符——断口朝外，符身温的。「对符要两半。」他说，公文腔稳，捧符的手不稳，「另半枚，驿亭寻了三年。寻访记录到最末一页，写着：疑在驿路火焚之年，止。」你从行囊里取出你那半枚——从前他塞给你的那半。两个断口对上去：严丝合缝。符面上的四个字，隔了这些年，合成了一句整话：「道远，珍重。」他盯着那四个字看了很久，指尖一笔一笔描过去，描完声音终于颤了，颤得没有再藏：「老驿丞说，断符的人，是替远行的人断的。」他把对上的符用绢包好，塞进你怀里，塞得极实：「从今日起，符随人。人在，符在。这一条入站册——」他提笔，手颤着，字却一笔一划，「册名：不远。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
            } else {
                aff = rivalName ? -10 : -6;
                msg = '「管得着。」他重复了一遍，躬身半度——躬得极标准，直起身时，脸上那点颤全收了。「驿站管路。路不管人。」他把那张写了一半的路引收起来，笔搁正，墨归池，半枚铜符也收进袖中——一样一样端端正正，正得像送客千里。「从今夜起，你名下的引照成例发：站名准到站，归期一栏——裁去。」他吹熄了半盏灯，黑暗里公文腔念了一遍成例，念得极准：「客行天明，驿亭启门，不留。」你转身要走，最后一句从黑暗里飘出来，不是公文腔了，颤得彻彻底底：「……前路不利。不利的那条路，我替你走过一回了。走完才明白——不利的不是路。是说『管得着』的人。」第二日老驿丞说：长亭昨夜把站册抄到天亮，抄完，把最末一页裁了。裁掉的那页是空白的。空白页他留了三年，昨夜自己裁了。裁完对着裁口说了一句话，老驿丞只听清两个字：「……对不住。」';
                if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - (rivalName ? 10 : 6));
            }
            return { affection: aff, msg: msg };
        }
    },
    'sect_leader_大旗门': {
        options: [
            { text: '「往后每一个节，我先回大旗门。你缝旗，我递线。」', effect: 'vow' },
            { text: '「铁皮针线盒拿出来。今日那三十七针，你一针一针念给我听。」', effect: 'present' },
            { text: '「我真是有事……大旗门的旗，管得着人在哪儿过节？」', effect: 'argue' }
        ],
        effects: function (npc, choice, ctx) {
            var rivalName = ctx && ctx.spentName;
            var aff, msg;
            if (choice === 'vow') {
                aff = rivalName ? 4 : 8;
                msg = '他排针的手停住了。他看了你两息，从铁皮盒里取出最长那根针，穿了线，递到你手里：「递线。」你递，他缝——那夜的头一针，是你递的线。缝完他咬线，军中腔，比平日慢了半拍：「递线，要在帐里。军规。」他把针线盒收好，这一回没有归案角，把盒子摆在了案头正中——你的这一侧，「从今夜起，盒子在案头。案头，就是伸手够得着的地方。」他吹了灯，黑暗里那句话又短又低：「节夜灯灭，我缝，你递。递到天亮——这是我定的军规。军规不改。」';
                if (rivalName) msg += '收盒的时候他忽然补了一句，短得像砸钉：「{rival}那处的护腕，我不缝。营里的针线，只认营里的人。」他把盒盖压得咔的一声，「两营的日子，一盒针。针码不乱。乱了——回来。回来我重排。重排不丢人。丢人的是，」他顿了顿，下一句极轻，「乱着，还报『没乱』。」'.replace('{rival}', rivalName);
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            } else if (choice === 'present') {
                aff = 8;
                msg = '他愣了半息：「念？」他把铁皮盒捧过来，打开——针码一排一排，粗细分明，长短有序，每排都有数。他取出护腕，就着灯摊平，一针一针指给你：「头一针，跟。第二针，上。第三针，别。」念到第十针，他停了停，声音低下去，却没有跳过：「第十针，掉。第十一针，队。第十二针，我。」他一针一针念到底，帐里只有他的声音和灯花。念完三十七针，他把护腕翻过来，内侧那排加固针在灯下密密的：「三十七针，合起来一句。」他把护腕摁进你手里，摁得极实，耳根红着，军中短句一字一顿：「跟上，别掉队，我捡你。」念完他自己先别过脸去收针，收了两根，收不下去了，把盒盖一合：「听清了就好。听清了——往后这句话不用针念了。你来了，我当面说。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
            } else {
                aff = rivalName ? -10 : -6;
                msg = '「管不着。」他重复了一遍，点点头，把铁皮针线盒合上——咔。「旗管方向。不管人。」他把那面战旗拿起来，一折，两折，叠得方方正正，归箱，压上旗布。「护腕还你。第三十八针——拆了。」他把护腕递过来，走过线的那一针拆得干干净净，布上针眼都没有撑大。「拆了，就是字不定了。不定，不缝。不缝——」他把针线盒归到帐角最深处，压上两捆旗布，压得极实，「就不松。」你转身要走，他在背后补了最后一句，军中腔，平得像旗布：「散队。」散队是操练的口令。可他说完，人没有动。当夜校场的灯亮到三更。守夜的兵说：都尉一个人坐在灯下开针线盒，把针码一排一排数过去，数了三十七排。数完他对着盒子说了两个字：「……对不住。」都尉这辈子说「对不住」的次数，老兵们掰指头数得过来。';
                if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - (rivalName ? 10 : 6));
            }
            return { affection: aff, msg: msg };
        }
    },
    'sect_leader_铁掌帮': {
        options: [
            { text: '「往后每一个节，我先上铁掌帮的苇滩。你吹哨，我应。」', effect: 'vow' },
            { text: '「素坯哨拿出来。教我一条哨语——我先吹给你听。」', effect: 'present' },
            { text: '「我真是有事……你的哨，管得着人在哪儿响？」', effect: 'argue' }
        ],
        effects: function (npc, choice, ctx) {
            var rivalName = ctx && ctx.spentName;
            var aff, msg;
            if (choice === 'vow') {
                aff = rivalName ? 5 : 9;
                msg = '她攥哨的手松了。她盯着你看了三息，忽然抬脚把窑门踹得山响——踹完回头，凶脸红透：「应，你说的！那你记好：从今日起，我吹『过来』，你在苇滩也好、在天边也好——应一声，哪怕哼一声，都算！」她掏出哨语册子，哗啦啦翻到末页，末页是新起的空白页，页头两个字写得歪歪扭扭，描过一遍：「未编。」她把册子塞回怀里，声音压下来，压得凶腔发颤：「未编的那一条——还没吹。等我烧成了那支像两个人声的哨，开窑那日吹。那一日，」她瞪你，眼睛亮得像窑火，「你只管听。听一遍，你就会了。」';
                if (rivalName) msg += '收册子的时候她忽然回头，下巴一抬，凶腔，话却不凶：「{rival}那处的哨，我不吹。哨语不外传——这一条，今日立的。」她把素坯攥进掌心，「两处的日子，一滩的声。声认人，不认门。你的声来了，隔多少里，哨都接。不来——」她顿了顿，声音沉下去半调，「我就一直吹。吹到接上为止。吹到接上，算我赢。」'.replace('{rival}', rivalName);
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
            } else if (choice === 'present') {
                aff = 8;
                msg = '她愣了半息：「教你？」她把素坯哨攥在手心，看看哨，又看看你，忽然把哨摁进你手里：「拿稳。素坯没烧透，掉了就完了。」她站到你身后，托着你的手，教你口型、教你气口——她的手粗，指腹全是攥哨磨的茧，托你的手却极轻：「头一条，不教『过来』。」她引着你的手吹了一声——一长一短。音闷，落在苇子上又弹回来。「这一条，『你来了』。」她松开手，退开半步，耳根红到脖子，凶脸硬撑着：「你先记这条。别的条——你来了，才有别的。」你问别的还有什么。她把哨收回去，自己吹了一声——两声低回，吹得极慢，吹完背过身去，望着苇滩：「别的，就是这条。这条册子上没有写。册子上没有的——」她的声音混进苇风里，「听过的才算数。今日，你算数了。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
            } else {
                aff = rivalName ? -10 : -6;
                msg = '「管不着。」她重复了一遍，点点头，把素坯哨收进怀里最深处。「哨管鸟。不管人。」她转身往窑棚走，走出两步，站住：「苇滩那半宿，我吹了三十几遍『过来』——你也管不着，是吧。」你没答。她自己点了点头，点得很慢：「行。管不着。」她进了窑棚，窑门关上。那一夜苇滩静得很。第二夜也静。第三夜帮里的小师妹忍不住，去窑棚外听——棚里传出起泥坯的声音，一个，又一个，起到天明。第四日她出来，眼睛通红，手里攥着一支烧成了的素坯哨——第九支，没裂。她从你身边过，没有瞪你，也没有停，只哑着嗓子说了一句：「第九支，音正。像一个人。」走出两步，背后极轻地补了半句，轻得只有苇滩听见：「……像两个人的，我不烧了。」';
                if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - (rivalName ? 10 : 6));
            }
            return { affection: aff, msg: msg };
        }
    },
    'sect_leader_昆仑派': {
        options: [
            { text: '「往后每一个节，我先上昆仑的晨课场。你舞，我立雪坎。」', effect: 'vow' },
            { text: '「素绸舞袖带解下来。今日我替你绑——绑完你舞一套我看。」', effect: 'present' },
            { text: '「我真是有事……昆仑的剑舞，缺一个人看，也碍不着什么。」', effect: 'argue' }
        ],
        effects: function (npc, choice, ctx) {
            var rivalName = ctx && ctx.spentName;
            var aff, msg;
            if (choice === 'vow') {
                aff = rivalName ? 4 : 8;
                msg = '她绑带子的手停住了。她看了你很久，忽然拔剑，就地下势——舞的是那套没有名目的。这一回，她把它舞完整了：剑尖挑雪，雪落满你双肩，收势时她的呼吸微乱，剑归背。「舞完了。」她说，耳根在雪光里红着，「舞完整了，名目就该许了。」你问名目是什么。她摇头，收剑，往晨课场走，走到雪坎第三株松底下站住：「名目不当夜许。许名目的人，得在明日卯时立在这道雪坎上——你来了，就知道了。」她立在松底下，背对你，声音落在雪上，极轻：「松等了十年。不差这一个卯时。」';
                if (rivalName) msg += '收剑的时候她忽然添了一句，平得像舞的名目：「{rival}那处的雪坎，我不去。昆仑的剑，只认自家山上的雪。」她把素绸带缠紧一圈，「两处日子，一套舞。舞不岔，日子就不岔。岔了——」她抬眼看你，雪光里眼神极直，「回来报。报了，我重舞。重舞不丢人。丢人的是站在雪坎上，等一个不来报的人。」'.replace('{rival}', rivalName);
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            } else if (choice === 'present') {
                aff = 8;
                msg = '她愣了半息，随即当真抬手——把素绸舞袖带从腕上解下来，一圈，一圈，递到你手里。她的腕上有带子的压痕，红的，十年的绑法不轻。你替她绑，绑到一半她忽然说：「紧。」你松了半扣。她盯着腕上的带子看了很久：「……不紧。」她的声音极低，「你绑的，不紧。我自己绑的，紧——紧了十年，是怕它松。」她抬臂，带子飘起来，就地下势：舞的是迎雪。舞到中途，腕上的带子松了半扣，她没有管，一路舞到收势。收势后她微微喘着，耳根红着，对你说：「你看。松了，也没有岔。」她把带子头掖好，掖得极仔细：「从今日起，带子的松紧归你。松了——就松着。松着舞出来的迎雪，比紧着的，好看。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
            } else {
                aff = rivalName ? -10 : -6;
                msg = '「碍不着。」她重复了一遍，点点头——点完，她做了一件你没见过的事：把素绸舞袖带从腕上解下来，一折，两折，收进怀里，然后把背后的剑归正，归得一丝不苟。「舞管剑。不管看舞的。」她说得字字平，平得像在背名目，「从明日起，晨课照旧。十二套，套套精准——不会再岔了。」她转身往场心最里那院走，走出三步站住，背对你，雪光落在侧脸上：「没有人看，剑意最清。最清——」长久的停顿，她把最后半句说完，轻得像雪落，「就不用等谁了。」院门合上。第二日晨课，弟子们说：先生今日的舞极好，套套精准，一式不岔，连雪坎边都没有望过一眼。第三株松底下的雪，她没有扫。没扫的雪落了一夜，把那条道埋了——埋了那条她扫过十日的道。';
                if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - (rivalName ? 10 : 6));
            }
            return { affection: aff, msg: msg };
        }
    },
    'sect_leader_全真教': {
        options: [
            { text: '「往后每一个节，我先进全真教的功业房。你结账，我报数。」', effect: 'vow' },
            { text: '「那颗停珠拿出来。今日我替你推到位——当着我。」', effect: 'present' },
            { text: '「我真是有事……你的算盘，管得着人几天不来？」', effect: 'argue' }
        ],
        effects: function (npc, choice, ctx) {
            var rivalName = ctx && ctx.spentName;
            var aff, msg;
            if (choice === 'vow') {
                aff = rivalName ? 4 : 8;
                msg = '她拨珠的手停住了。「……报数。」她重复了一遍，账房腔，指尖却把那颗珠攥住了。她翻开日记新起一页，提笔写栏名，一笔一划：「节夜，同账。」写完她把算盘挪到案心——案心是两个人都够得着的地方：「从今夜起，这一栏两个人结：你报数，我拨珠。同结的账，三百年的格式里没有。」她顿了顿，账房腔裂了一道小缝，缝里漏出来的不像账房，「没有，就自我起。我起的格式，往后就是例。例曰：同账不拆。拆账要两讫——而咱们这一账，」她拨了一颗珠，啪，「永远讫不了。讫不了，就是永远有下一页。」';
                if (rivalName) msg += '合日记的时候她忽然添了一句，账房腔，利钱却透着：「{rival}处的时辰记在外账。外账归外账——你这一栏，只进不出。」她把算盘压得极正，「两处日子，一栏账。账在近手，利就不滚。滚了——」她抬头，看你看得极直，「你来结。利我算，本你担。担着担着，本息就都是你的了。」'.replace('{rival}', rivalName);
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            } else if (choice === 'present') {
                aff = 8;
                msg = '她愣了半息，随即当真把小银算盘取出来——那颗停珠，推到一半，停了半年。「推。」她把算盘递到你手里，递的时候手有一点点抖，账房腔努力端平，「珠子小。推的是一辈子的账。」你伸手推——啪，一声，脆得功业房的灯都晃了一下。声音还没落，她的眼眶已经红了。红了，话还是账房腔：「记：是夜，停珠，落位。」记完她合上日记，合得很慢，「停珠落位，就是——这一笔，在我心里结了半年，今日结讫。」她把算盘收回去，收进怀里，收得极深。收完忽然又说了一句，不是账房腔了，声音极小：「结讫的是疑。结不讫的是——珠落位之后，我居然盼着它再停半日。停着的珠子，好歹有个等的名目。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
            } else {
                aff = rivalName ? -10 : -6;
                msg = '「管得着。」她重复了一遍，点点头，把小银算盘收进袖子——袖口系紧。「算盘管功业。不管人。」她合上日记，归进案头最里层：「从今夜起，你那一栏，销。销，就是本息两讫，条目——」她把那两个字说得特别慢，慢得像在推一颗推不动的珠，「两讫。」她吹熄了半盏灯。黑暗里账房腔念了一遍销账的格式，念得极整齐，整齐得像在念给自己听：「两讫的账，不再入册。不入册——就是不再想。」你转身要走，黑暗里算珠响了一声，只一声。第二日功业房的书记说：昨夜先生的账结到天亮，最末一页栏格画得端端正正，栏名「两讫」。可「两讫」两个字后头，有一小片晕开的痕，晕了「讫」字的一半。送茶进去的时候，先生正攥着那把小银算盘——算盘上有一颗珠，推到位，又拨回来，拨回来，又推到位。推了一夜。始终，没有停。';
                if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - (rivalName ? 10 : 6));
            }
            return { affection: aff, msg: msg };
        }
    },
    'sect_leader_少林寺': {
        options: [
            { text: '「往后每一个节，我先上少林的法座。你讲经，我坐头排。」', effect: 'vow' },
            { text: '「那页空白取出来。今日头一笔批注我来落——落我自己的名字。」', effect: 'present' },
            { text: '「我真是有事……你那页批注空着就空着，碍得着少林几炷香？」', effect: 'argue' }
        ],
        effects: function (npc, choice, ctx) {
            var rivalName = ctx && ctx.spentName;
            var aff, msg;
            if (choice === 'vow') {
                aff = rivalName ? 4 : 8;
                msg = '她拨珠的手停住了。「头排。」她重复了一遍，合十，佛号这一回念全了，念完耳根却红了，赶忙用毒舌压：「头排好坐，经难听——贫尼的经句句点人，坐头排的若是心虚，三句就要出汗。」她翻开批注经，提笔，在那页空白的旁边新起一栏批注，栏名两个字：「在场」。写完她把笔搁正：「从今夜起这一栏随节走：节到，人到，栏就满。满的批注，天下的经里只有两种——一种是佛号，一种是你来了。」她顿了顿，佛相撑不住半息，垮成一句极轻的实话：「二十年批注，骂人的批下去了千千万万。留人的批注，这是头一条。」';
                if (rivalName) msg += '合经的时候她忽然添了一句，佛相不变，话毒如常：「{rival}处的香火旺不旺，贫尼不问。少林只问一桩：你的节，头一炷香上哪座山——上错了山，批注记着。」她把念珠绕回腕上，绕了两圈，「记着的批注不骂人。记着的批注，等人自己上山来看。」'.replace('{rival}', rivalName);
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            } else if (choice === 'present') {
                aff = 8;
                msg = '她愣了半息，随即当真把批注经取过来——翻到那页空白，空白得二十年，纸色都比旁的页深了。她把笔递到你手里，递的时候指尖抖了一下，毒舌努力端着：「名字好落。落了，这一页就不空了——不空了，贫尼二十年的执念就算破了。」你落笔。最后一划写完，她把笔接回去，对着那个名字读了三遍，读完忽然在你的名字旁边，用她的小字批了一句。批得极短，只四个字：「最锋利句。」你探头要看，她合上经，死活不肯再开，毒舌全线垮掉，佛号也忘了念：「看什么。看了，贫尼就要骂你了。」她把经抱在怀里，抱了很久，才从经上头露出半句，声音极小：「原来最锋利的那一句，不毒。不毒，贫尼这一生——一句都批不动了。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
            } else {
                aff = rivalName ? -10 : -6;
                msg = '「碍不着。」她点点头，先合十：「阿弥陀佛。」念了三声，念完睁眼，佛相还在，话冷了：「香火旺，旺给十方看。这一页空，空给一个人。」她把批注经归架，归到最高一层，又把经案上你的旧回帖一并收了，收得极整齐：「从今夜起，头排撤了。法会人人有座，独头排不设——不设，就不用等人坐；不等人坐，批注就不用悬着。」她剪了灯花，讲经堂暗下去一半。你转身要走，黑暗里她的声音飘过来，毒舌还在，毒得极轻，轻得像自言自语：「香火的数目，账上查得着。批注的数目——」念珠响了一声，只一声，没有第二声，「空白的页，天下没有第二张。你今日嫌它碍不着，它明日就碍不着你了。碍不着，就是缘灭。缘灭这两个字，贫尼讲了一辈子，今日头一回，讲不出口。」第二日当值的弟子说：昨夜师父对着批注经坐到天亮，那页空白她看了一夜，天亮提笔批了一句，批完又划了。划掉的批注还是空白——只是纸面上多了一道笔痕，深得透了纸背。';
                if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - (rivalName ? 10 : 6));
            }
            return { affection: aff, msg: msg };
        }
    }
};

function _jealAfterEffectsFactory(npcId) {
    var ch = JEAL_AFTER_CHOICES[npcId];
    return function (npc, choice) {
        var ctx = (npc.memory && npc.memory._jealAfterCtx) || null;
        return ch.effects(npc, choice, ctx);
    };
}

function _mkAfterEvent(prefix, npcId, icon, title) {
    var ch = JEAL_AFTER_CHOICES[npcId] || JEAL_AFTER_CHOICES['sect_leader_百花谷'];
    return {
        id: prefix + '_event_after', npcId: npcId, title: title, icon: icon,
        desc: '节过后的门内，藏着一句没说出口的话。',
        minAffection: 30, trigger: { random: 1.0 }, cooldown: 0,
        flag: prefix + '_e_after_done',
        requireFestivalWound: true,           // 本包扩展门禁：账上有未看的伤才放得开
        ambient: true, repeatEvery: 60,       // 不吃时辰、不占主线链；实际重演由账本格控制
        scenes: [
            { speaker: 'narrator', text: '（触发时按节令与账本实时生成）', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: ch.options }
        ],
        effects: _jealAfterEffectsFactory(npcId)
    };
}

var JEALOUSY_AFTERMATH_EVENTS = {
    bh_event_after: _mkAfterEvent('bh', 'sect_leader_百花谷', '🏮', '灯下的旧杯'),
    xl_event_after: _mkAfterEvent('xl', 'sect_leader_修罗宫', '🏮', '没碰过的灯'),
    ts_event_after: _mkAfterEvent('ts', 'sect_leader_天山派', '🏮', '没扫的那块雪'),
    wx_event_after: _mkAfterEvent('wx', 'sect_leader_五仙教', '🏮', '不绕了'),
    lu_event_after: _mkAfterEvent('lu', 'sect_leader_铸剑山庄', '🏮', '没摘的灯笼'),
    su_event_after: _mkAfterEvent('su', 'sect_leader_药王谷', '🏮', '另册'),
    ms_event_after: _mkAfterEvent('ms', 'sect_leader_茅山派', '🏮', '灯下的卦纸'),
    jg_event_after: _mkAfterEvent('jg', 'sect_leader_金刚宗', '🏮', '塔前第一级'),
    em_event_after: _mkAfterEvent('em', 'sect_leader_峨眉派', '🏮', '灯下的空签'),
    hs_event_after: _mkAfterEvent('hs', 'sect_leader_华山派', '🏮', '空着的凳'),
    tm_event_after: _mkAfterEvent('tm', 'sect_leader_唐门', '🏮', '没验的茶'),
    wd_event_after: _mkAfterEvent('wd', 'sect_leader_武当派', '🏮', '多撞的一杵'),
    pl_event_after: _mkAfterEvent('pl', 'sect_leader_蓬莱派', '🏮', '没放的灯'),
    xy_event_after: _mkAfterEvent('xy', 'sect_leader_逍遥派', '🏮', '没题的坛'),
    heng_event_after: _mkAfterEvent('heng', 'sect_leader_恒山派', '🏮', '少敲的一声'),
    song_event_after: _mkAfterEvent('song', 'sect_leader_嵩山派', '🏮', '空白的判栏'),
    tai_event_after: _mkAfterEvent('tai', 'sect_leader_泰山派', '🏮', '火色平'),
    qing_event_after: _mkAfterEvent('qing', 'sect_leader_青城派', '🏮', '封起的过火锅'),
    xiang_event_after: _mkAfterEvent('xiang', 'sect_leader_衡山派', '🏮', '长过平日的气口'),
    gai_event_after: _mkAfterEvent('gai', 'sect_leader_丐帮', '🏮', '倒扣的碗'),
    yan_event_after: _mkAfterEvent('yan', 'sect_leader_阎罗殿', '🏮', '未定的一页'),
    xue_event_after: _mkAfterEvent('xue', 'sect_leader_血手门', '🏮', '留下的清单'),
    xie_event_after: _mkAfterEvent('xie', 'sect_leader_飞蝎坞', '🏮', '合上的蝎册'),
    lie_event_after: _mkAfterEvent('lie', 'sect_leader_烈日教', '🏮', '多添的一勺油'),
    long_event_after: _mkAfterEvent('long', 'sect_leader_天龙教', '🏮', '传错的令'),
    sj_event_after: _mkAfterEvent('sj', 'sect_leader_神机门', '🏮', '乱了拍的雀'),
    pi_event_after: _mkAfterEvent('pi', 'sect_leader_霹雳堂', '🏮', '受潮的批注'),
    shu_event_after: _mkAfterEvent('shu', 'sect_leader_天书阁', '🏮', '不催的一行'),
    dy_event_after: _mkAfterEvent('dy', 'sect_leader_大隐阁', '🏮', '立着的空签'),
    yin_event_after: _mkAfterEvent('yin', 'sect_leader_侠隐阁', '🏮', '空白的封皮'),
    ty_event_after: _mkAfterEvent('ty', 'sect_leader_天涯海阁', '🏮', '裁去的归期'),
    dq_event_after: _mkAfterEvent('dq', 'sect_leader_大旗门', '🏮', '第三十八针'),
    tz_event_after: _mkAfterEvent('tz', 'sect_leader_铁掌帮', '🏮', '吹给月光的哨'),
    kl_event_after: _mkAfterEvent('kl', 'sect_leader_昆仑派', '🏮', '多绑的一圈'),
    qz_event_after: _mkAfterEvent('qz', 'sect_leader_全真教', '🏮', '停在半途的珠'),
    shao_event_after: _mkAfterEvent('shao', 'sect_leader_少林寺', '🏮', '空白的批注')
};

// 余波场景实时拼装：第一句按节令、第二句按推帖/放鸽子、有实证再加一句、末了给选择
function _jealComposeAfter(ev, npc, wound) {
    var fkey = wound.fkey, festKey = String(fkey).split('_')[0];
    var fname = (wound.ent && wound.ent.fname) || JEAL_FEST_NAME[festKey] || '那个节';
    var status = wound.ent.status === 'stood' ? 'stood' : 'declined';
    var narr = (JEAL_AFTER_NARR[ev.npcId] && JEAL_AFTER_NARR[ev.npcId][festKey])
        || ((JEAL_AFTER_NARR['sect_leader_百花谷'] || {})[festKey] || '');
    var st = (JEAL_AFTER_STATUS[ev.npcId] || {})[status] || '';
    var spentLine = '';
    if (wound.spentName) {
        var tpl = (JEAL_AFTER_SPENT[ev.npcId] || '').replace(/\{rival\}/g, wound.spentName);
        spentLine = tpl;
    }
    ev.desc = fname + '过后，你在' + ((npc && npc.name) || 'Ta') + '的门里。';
    var scenes = [
        { speaker: 'narrator', text: narr, type: 'description' },
        { speaker: 'npc', text: st }
    ];
    if (spentLine) scenes.push({ speaker: 'npc', text: spentLine });
    scenes.push({ speaker: 'player_select', text: '你如何回应？', options: (JEAL_AFTER_CHOICES[ev.npcId] || {}).options });
    ev.scenes = scenes;
    if (npc) {
        if (!npc.memory) npc.memory = {};
        npc.memory._jealAfterCtx = { fkey: fkey, status: status, spentName: wound.spentName || null };
    }
}

// ============ 四、小心眼（36 桩，日常 ambient，30 日重入） ============
// 不需要知道情敌是谁，只需知道你把心分成了两半。都是小事，小得说不出口——
// 说不出口的，才最像真的小心眼。
var JEALOUSY_SULK_EVENTS = {
    // ---- 温蘅：两只杯子，如今一只烫着 ----
    'bh_event_sulk': {
        id: 'bh_event_sulk', npcId: 'sect_leader_百花谷', title: '第二只杯', icon: '🍵',
        desc: '药庐的托盘上，第二只杯子空着。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'bh_e_sulk_done',
        ambient: true, repeatEvery: 30, requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '药庐。她给你斟茶，斟完，托盘上第二只杯子也烫了一遍——烫完，没斟，收回柜里。她做得很自然，像在做一件家务。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「茶斟两杯。我赶上了今天。」', effect: 'two' },
                { text: '当作没看见，把茶喝了', effect: 'dumb' }
            ]}
        ],
        effects: function (npc, choice) {
            var aff = 0, msg = '';
            if (choice === 'two') {
                aff = 5;
                msg = '她斟茶的手一顿，随即真的又烫了一只杯子，斟满，摆在托盘上：「赶上了今天——」她笑眼弯弯，「那把明天的也赶上。杯我天天烫，人你自己算日子。」';
            } else {
                aff = -2;
                msg = '你把茶喝了。她全程温声细语，一切如常。只是你走后，学徒收拾药庐，问那只烫了没用的杯子怎么又烫回去了——她想了想：「杯垫旧了，换新的试试。」杯垫没换过。学徒不敢再问。';
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 绯泪：你的那一页，快翻完了 ----
    'xl_event_sulk': {
        id: 'xl_event_sulk', npcId: 'sect_leader_修罗宫', title: '薄页', icon: '📕',
        desc: '行踪簿上你那一页，越写越薄。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'xl_e_sulk_done',
        ambient: true, repeatEvery: 30, requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你进门时，她正翻那本行踪簿，翻到你名下那页——纸都磨薄了，字却稀稀拉拉。她把簿子合上，不遮掩，也不解释。', type: 'description' },
            { speaker: 'npc', text: '「簿子快见底了。」她说，「页是我裁厚的，字得你来写。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「那今日先写一笔。」', effect: 'write' },
                { text: '「簿子都成你的经了。」', effect: 'tease' }
            ]}
        ],
        effects: function (npc, choice) {
            var aff = 0, msg = '';
            if (choice === 'write') {
                aff = 4;
                msg = '她把笔推给你。你当着她的面，写了一行今日的事。她拿过去看了看，吹干，收好，寒冰的脸上看不出动静——只是翻页那一下，比平时轻。';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 2);
            } else {
                aff = -3;
                msg = '「经？」她把簿子往案上一放，语气平得没有一丝波澜，「修罗宫供过经。经不会两头跑。」她继续练剑，一招一式标准得没有破绽，「今日账目到此。你走吧——趁我没想把这页也抄一份送出去。」';
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 琤霄凌：霜鸣又双鸣了，她替你瞒着剑 ----
    'ts_event_sulk': {
        id: 'ts_event_sulk', npcId: 'sect_leader_天山派', title: '瞒剑', icon: '🗡️',
        desc: '剑鸣了两次，她只说了一次。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'ts_e_sulk_done',
        ambient: true, repeatEvery: 30, requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '雪庐。你进门，霜鸣「嗡」地双鸣——一声正，一声偏，偏的那声追着你的影子。她听见了，却只说：「它今日认你。」', type: 'description' },
            { speaker: 'narrator', text: '她说谎。天山的剑客不说谎——这是她头一次。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「方才那一声，我听见了。是我心里有名。」', effect: 'own' },
                { text: '谢了一句，坐下喝茶', effect: 'dumb' }
            ]}
        ],
        effects: function (npc, choice) {
            var aff = 0, msg = '';
            if (choice === 'own') {
                aff = 5;
                msg = '她执剑的手停了停，冰蓝的眼第一次正眼看你：「……认了？」她点点头，把霜鸣往你面前横过来，「那按天山的规矩——剑听见了，就得当场立个字据。名字不写，写日子。你下一回上山的日子。」她等你把日子报了，收剑，「剑记日子，比我牢。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 3);
            } else {
                aff = -2;
                msg = '你坐下喝茶。她练剑，你喝茶，一屋安静。只是茶尽三巡，霜鸣又双鸣了一声，她这次连「认你」都不说了——她把剑取下来，挂去了内室。剑挂了内室，意思是：有些耳朵，先收着。';
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 蓝凤凰：心蛊开始记日子 ----
    'wx_event_sulk': {
        id: 'wx_event_sulk', npcId: 'sect_leader_五仙教', title: '数日子', icon: '🦋',
        desc: '心蛊在你名字旁边，点了三个点。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'wx_e_sulk_done',
        ambient: true, repeatEvery: 30, requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '蛊房。你名姓的签子上，小蓝蝶蛊用翅尖点了三个小白点——三天一格，点了三格：你三日没来了。她倚在瓮边看着，也不赶。', type: 'description' },
            { speaker: 'npc', text: '「它如今会数日子了。」她指尖点了点那三个白点，笑吟吟的，「蛊这东西，饿了才学本事。它想你想出才艺来了——你说，我是奖它，还是罚它？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「奖它。明天还来，让它学数到十。」', effect: 'prize' },
                { text: '「蛊都学会催人了，五仙教好规矩。」', effect: 'tease' }
            ]}
        ],
        effects: function (npc, choice) {
            var aff = 0, msg = '';
            if (choice === 'prize') {
                aff = 5;
                msg = '她当真捻了一星蜜喂那小蛊：「学数到十——」她笑，凤目弯起来，「它学不会的。蛊的记性只有七天。所以你这七天得来够数，它才敢数到七。」她把小蛊放回签上，「它记不住的，我替它记。放心，我的心蛊记性最好——它记的账，连月老都抵赖不掉。」';
            } else {
                aff = -3;
                msg = '「好规矩？」她把小蛊招回掌心，拢在手心，隔断了你的方向，「行，那换个规矩——它以后不点点了，改成见你进门就装死。」她拢着手，笑意艳艳，「蛊装死，我这心口就得疼一回。你要试试新规矩，随时来。」';
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 冶砚：灶上给你留的碗，他端回去了 ----
    'lu_event_sulk': {
        id: 'lu_event_sulk', npcId: 'sect_leader_铸剑山庄', title: '端回去', icon: '🍚',
        desc: '灶上给你留的饭，他自己端回去吃了。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'lu_e_sulk_done',
        ambient: true, repeatEvery: 30, requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你傍晚进庄，正撞见伙房师傅从灶上端走一碗留饭——给你留的那碗。转眼的工夫，冶砚从后头追上来，一把夺过，就地扒了两口，把碗扣回灶上。', type: 'description' },
            { speaker: 'npc', text: '「看什么？」他嘴里还嚼着，含混不清，「凉了浪费。庄里的规矩，留饭过午自处理——我就是那个处理。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「以后到点我回。碗你给我留着。」', effect: 'keep' },
                { text: '「你馋了就说，别拿规矩挡。」', effect: 'tease' }
            ]}
        ],
        effects: function (npc, choice) {
            var aff = 0, msg = '';
            if (choice === 'keep') {
                aff = 5;
                msg = '他把碗从灶上重新取下来，抹了把嘴，郑重其事地搁回灶眼上正中间：「成。往后这碗按顿算——过午自处理作废，新规矩：过午等人。」他拍拍你的肩，掌心的炉灰蹭在你肩上，「炉火跟留饭一样，旺的时候你不在，等它自己凉了再回来——那叫烧炭，不叫过日子。」';
            } else {
                aff = -3;
                msg = '「我馋？」他愣了一瞬，忽然把空碗往你怀里一塞，「行，馋。往后的留饭我全馋了。」说完他真就挨着伙房坐下了，冲师傅喊，「以后他那份也打我账上——省得剩。」他头也不抬地扒饭，耳朵根比炉火还红。';
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 芩木：他把你的脉案誊了两份 ----
    'su_event_sulk': {
        id: 'su_event_sulk', npcId: 'sect_leader_药王谷', title: '双份脉案', icon: '📜',
        desc: '同一页脉案，他誊了两份，收法不同。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'su_e_sulk_done',
        ambient: true, repeatEvery: 30, requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '药庐。他在誊你的脉案——誊完一份，想了想，又誊一份。第一份归了档，第二份折成三折，收进了贴身的袖袋。', type: 'description' },
            { speaker: 'npc', text: '「档是谷里的规矩，袖袋是我的。」他面不改色，「你多心了？抱歉，大夫的手艺是分开记的：公是公，私是私。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「袖袋那份，以后按日子记，别按脉。」', effect: 'daily' },
                { text: '「一份足矣，大夫别累着。」', effect: 'dumb' }
            ]}
        ],
        effects: function (npc, choice) {
            var aff = 0, msg = '';
            if (choice === 'daily') {
                aff = 6;
                msg = '他执笔的手顿了顿，浅褐眼底漾开一点极淡的暖意：「按日子记——」他当真取来一册空白小簿，封皮题了两个小字：「来鹤。」你问谁的名字，他说：「药王谷有株老鹤顶兰，一年只来一回，来了就开。我原先怕它不来。」他把小簿收进袖袋，挨着那份脉案，「如今不怕了。来不来，都记。开了，再记一笔。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 2);
            } else {
                aff = -2;
                msg = '「不累。」他温润地笑，手上不停，第三份也誊出来了——三份并排晾墨，他一份一份收：一份归档，一份入柜，一份……他捏着看了看，放回你面前，「这份送你。替我看着我自己。」他说得云淡风轻，像在送出一盏多余的茶。你拿着那页纸，忽然觉得药庐里最苦的并不是药。';
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 昴既明：他给你留的灯，改了三更后熄 ----
    'ms_event_sulk': {
        id: 'ms_event_sulk', npcId: 'sect_leader_茅山派', title: '三更灯', icon: '🕯️',
        desc: '符阁的灯说：以后只留到三更。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'ms_e_sulk_done',
        ambient: true, repeatEvery: 30, requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你过符阁，当值弟子小声告诉你：师父前日把阁里的留灯收了，改挂在门房——「夜里来的人，不必摸黑。灯在这儿，随取随点，三更后收回。」弟子说完就跑，像传错了一句话。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '去门房把灯摘下来，照原样挂回符阁', effect: 'back' },
                { text: '谢过弟子，取灯夜访', effect: 'take' }
            ]}
        ],
        effects: function (npc, choice) {
            var aff = 0, msg = '';
            if (choice === 'back') {
                aff = 6;
                msg = '第二天你路过符阁，那盏灯竟还挂在门房——你摘了，进门，挂回原钩。他在灯下研朱，头也不抬：「挂回来，就是嫌它照得不够高。」他搁下朱砂，抬眼看灯，也看你，「挂高些。山上夜路陡，灯矮了——照不见人，就照得见心事。」你踩着凳子把灯挂高，他在下面扶凳子，一句话没说。下凳时你鞋带松了，他先你一步蹲下去系好了——系完才想起来，两人都站在原地，安静了半息。';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 3);
            } else {
                aff = 4;
                msg = '你当真取了灯。夜访时他在画符，就着你带来的灯，一符两看。画完他吹干朱砂，把灯往你那边推了推：「茅山规矩，借灯还愿——灯你留着，愿你自己许。许什么，明儿来报。」他说得一本正经，像在立一道门规。只有收灯时，他指腹在灯罩上抹了一下灰，很轻，像抹平一页没写完的卦。';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 2);
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 赫渊：塔前石阶，他数给你看 ----
    'jg_event_sulk': {
        id: 'jg_event_sulk', npcId: 'sect_leader_金刚宗', title: '阶上数', icon: '🪜',
        desc: '九十九级台阶，他扫到哪一级，记到哪一级。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'jg_e_sulk_done',
        ambient: true, repeatEvery: 30, requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你上山，远远看见他扫到第三十七级就停了，扶着扫帚往山路上看。看了片刻，低头继续扫。小沙弥抱着簸箕跟你咬耳朵：「方丈扫阶有数的——数到你在的那一级，就歇。今天数到三十七，人就来了。」', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '从第一级开始，替他往回扫', effect: 'sweep' },
                { text: '在塔门下站定，等他扫完上来', effect: 'wait' }
            ]}
        ],
        effects: function (npc, choice) {
            var aff = 0, msg = '';
            if (choice === 'sweep') {
                aff = 6;
                msg = '你从顶上往回扫。扫到第三十七级，两把扫帚头碰头。他看着你靴底带起的雪，合十：「台阶是扫不完的。」你说不扫完睡不着。他静了一会儿，低哑的声音很轻：「……那从今日起，塔前归你我。一人一级，扫完落闸。」他把扫帚递给你半截竹柄，自己退到第二级，「你扫一级，老僧扫一级。雪大的日子——」他想了想，「雪大的日子，一起扫完再落闸。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 3);
            } else {
                aff = 4;
                msg = '你在塔门下站着，从第一级站到第九十九级扫完。他上来时肩头微雪，见你浑身也落了雪，「唔」了一声，从袖里抖出一块干布——袖里备着干布，也不知备了多少天。他把布按在你肩上，说了今天唯一一句话：「站阶不站门。门风口。」说完先进门去了。塔里的香，那天烧得比哪天都慢。';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 2);
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 夙孤鸿：斋堂从不「多做」的那包素点心 ----
    'em_event_sulk': {
        id: 'em_event_sulk', npcId: 'sect_leader_峨眉派', title: '素点心', icon: '🍡',
        desc: '她说点心是斋堂多做的——峨眉的斋堂，从不多做。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'em_e_sulk_done',
        ambient: true, repeatEvery: 30, requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '戒堂。你进门，她案头摆着一小包素点心，布巾包得方方正正。见你看，她把点心往你手边一推：「斋堂多做的。」——峨眉的斋堂，按人数下料，从不多做。', type: 'description' },
            { speaker: 'npc', text: '「拿着。」她低头继续誊戒文，笔不停，「多的东西，搁着坏。坏东西，犯戒。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「多出来的这包，往后日日给我留着。」', effect: 'keep' },
                { text: '「斋堂多做？怕不是首座多心。」', effect: 'tease' }
            ]}
        ],
        effects: function (npc, choice) {
            var aff = 0, msg = '';
            if (choice === 'keep') {
                aff = 5;
                msg = '她誊戒文的笔停了停。「……日日。」她重复了一遍，把布巾解开重新包了包，包得更方正，「峨眉戒律没有这一条。戒律没有的——」她把点心搁回案头最里侧，离灯近、离风远的地方，「就归我管。你按时来领。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 2);
            } else {
                aff = -3;
                msg = '「多心。」她搁下笔，把点心收回去，收进抽屉，落了锁，动作端方得没有一丝破绽，「首座的心，轮不到旁人点。」她重新执笔誊戒，墨比方才浓，「点心给猴王了。它不多心——它只多吃。」';
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 竺听雨：雨夜檐下，多摆了一只凳 ----
    'hs_event_sulk': {
        id: 'hs_event_sulk', npcId: 'sect_leader_华山派', title: '两只凳', icon: '🌧️',
        desc: '雨夜剑堂檐下摆了两只凳，他说凳子出来透气。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'hs_e_sulk_done',
        ambient: true, repeatEvery: 30, requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '雨夜。你路过剑堂，檐下摆着两只凳——他惯坐的那只旁边多了一只，凳面上搭着块干布，防的是雨溅。堂里没点灯，只有雨声。', type: 'description' },
            { speaker: 'npc', text: '「哟。」他从堂里探出头，笑得爽朗，「凳子闷久了，搬出来透透气。」——夜里落雨，没有太阳，凳子透气，透的是雨。' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「这只凳我坐了。往后雨夜，它归我。」', effect: 'sit' },
                { text: '「透气？大师兄的凳子也学你打趣。」', effect: 'tease' }
            ]}
        ],
        effects: function (npc, choice) {
            var aff = 0, msg = '';
            if (choice === 'sit') {
                aff = 5;
                msg = '他「嗳」了一声，转身进堂，再出来时手里多了一壶温酒、两只杯。「凳子归你，酒就得归你斟。」他把杯递给你，在旧凳上坐下。雨声铺天盖地，他忽然说：「师父在的时候，雨夜也摆两只凳。」他望着檐外的雨，笑还挂着，声音轻了，「一只摆着，一只空着。空那只，他说是留给『还没来的人』。我笑他十年。今日——我摆出来了。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 3);
            } else {
                aff = -2;
                msg = '「打趣。」他哈哈一笑，把那只凳搬回堂里，搬得干脆，「凳子脸皮薄，经不起打趣。」他在门口回头，笑意还挂着，话却说得慢，「雨大，进来坐？——坐我那只。多出来的那只，收起来了。收起来的东西，下回下雨，再看搬不搬得出来。」';
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 晏万解：多缝的一双手套，说是顺手 ----
    'tm_event_sulk': {
        id: 'tm_event_sulk', npcId: 'sect_leader_唐门', title: '第二双手套', icon: '🧵',
        desc: '她说是顺手多缝的——唐门的手套，从不顺手。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'tm_e_sulk_done',
        ambient: true, repeatEvery: 30, requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '毒堂。她案头摆着一双新缝的布手套，针脚密得看不见线头。见你看，她头也不抬：「顺手多缝的。」——唐门制毒的手，一双白丝手套三年才换一回，她从不「顺手」。', type: 'description' },
            { speaker: 'npc', text: '「你那双旧了。」她咬断一根线，把手套往你那边推了半寸，又停住，「……试试。不合手，我拆了重缝。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '戴上手套，把手伸给她看：「合手。往后我的手套，都归你缝。」', effect: 'keep' },
                { text: '「毒堂堂主改行缝手套了？唐门知道要笑话你。」', effect: 'tease' }
            ]}
        ],
        effects: function (npc, choice) {
            var aff = 0, msg = '';
            if (choice === 'keep') {
                aff = 5;
                msg = '她盯着你戴好手套的手看了很久，忽然伸手，把你腕口那圈线捋平——她的白丝手套碰着你的布手套，两只手都裹着，谁也不会伤着谁。「归我缝。」她收回手，声音还是硬的，耳根却红了，「唐门没这条规矩。今日立。往后你的手，」她顿了顿，「破了、凉了、沾了别人的药——都先回来，让我看。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 2);
            } else {
                aff = -3;
                msg = '「笑话我？」她把手套收了回去，收得飞快，「行。唐门的手艺，不缝给外人。」她低头继续擦她的银针，擦得叮叮响，「你走吧。这双手套，明日起戴在药童手上——他手小，凑合。你的手可金贵，沾不得我们唐门的针脚。」话虽毒，那双手套到底没给药童。后来有人在她的针线匣底见过——压在最底下，针脚朝着里。';
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 阙守拙：扫阶扫到双数，他就停 ----
    'wd_event_sulk': {
        id: 'wd_event_sulk', npcId: 'sect_leader_武当派', title: '双数的阶', icon: '🧹',
        desc: '扫阶扫到双数他就停——双数的脚印，不该一个人扫。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'wd_e_sulk_done',
        ambient: true, repeatEvery: 30, requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '清晨你上山，他在扫山门前的石阶。扫到中段，扫帚忽然停了——他拄着帚站在阶上，低头数雪里那行脚印，嘴唇微微动，数得很慢。', type: 'description' },
            { speaker: 'narrator', text: '抱簸箕的小道童凑到你耳边：「师兄扫阶数脚印。单数，扫完；双数——就停。师兄说，双数是成双，成双的脚印，不该一个人扫。」', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '接过扫帚，替他把剩下那半段扫完', effect: 'sweep' },
                { text: '装作没听见，跟他打个招呼，先进殿', effect: 'dumb' }
            ]}
        ],
        effects: function (npc, choice) {
            var aff = 0, msg = '';
            if (choice === 'sweep') {
                aff = 5;
                msg = '你伸手接扫帚，他没推让，等你握住了帚柄才松手。两个人一上一下，把剩下的阶扫完。扫到最后一级，他把扫帚接回去，靠正，说了三个字：「成双了。」停了停，又补四个字：「扫干净了。」小道童后来说，师兄那日下山赶集，买回来两块糖饼——买了两块，自己吃了一块，另一块，搁在你常坐的蒲团边上。';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 3);
            } else {
                aff = -2;
                msg = '你跟他招呼，他点头，扫帚没动，那半段阶也没扫。你进殿回头，他还站在停下的那处，像那个数目没数完。午间小道童悄悄说：师兄今日扫阶，少扫了一段；撞钟，多撞了一杵。「钟是一百零八杵的数，师兄撞了一百零九。多的那一杵替谁撞的，师兄不说，我们不敢问。」';
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 瀛晚照：图录只记海市——那一页，多摹了一只贝 ----
    'pl_event_sulk': {
        id: 'pl_event_sulk', npcId: 'sect_leader_蓬莱派', title: '多摹的贝', icon: '🪸',
        desc: '图录从不记贝——新摹的蜃楼边上，多了一只。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'pl_e_sulk_done',
        ambient: true, repeatEvery: 30, requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '观汐台。你翻她案头的图录等新墨干——一页新摹的蜃楼边上，多了一只螺贝，纹路画得极细。不是你腰间那只旧螺，是滩上寻常一只花贝——上回你拾起来看过，又放回了水里。图录二十年只记海市，从不记贝。', type: 'description' },
            { speaker: 'npc', text: '她见你看那一页，头也不抬，笔尖不停：「摹错了。手滑。」——录潮的手，二十年没有滑过。' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「这只贝，记着罢。往后我拾过的，你都摹进图录。」', effect: 'keep' },
                { text: '翻过那页，只夸蜃楼摹得好，不提贝', effect: 'dumb' }
            ]}
        ],
        effects: function (npc, choice) {
            var aff = 0, msg = '';
            if (choice === 'keep') {
                aff = 5;
                msg = '她执笔的手停了半息。「……记着。」她重复了一遍，把那页图录抚平，贝的旁边添了一行极小的注——注的不是贝名，是日子：你拾起它、又放回水里的那一日。「观汐台的规矩，只录海市。」她合上册子，声音照旧平，耳根却有一点颜色，「规矩外头的，归我。你拾过的贝壳、踩过的滩、上岸的时辰——我一样一样记。记满了，另订一册。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 2);
            } else {
                aff = -2;
                msg = '你把那页翻了过去，夸蜃楼摹得好。她「嗯」了一声，没接话。当夜的潮她录得极早。第二日你再翻图录，那只贝还在——旁边多添了一笔，画得更细了。翻册子的师妹问：这是什么贝？她答得很快，快得像早就想好了：「不是贝。是日子。」师妹没听懂。你没在场——在场也未必听得懂。';
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 闻人酌：给你斟的酒，永远比别人满一线 ----
    'xy_event_sulk': {
        id: 'xy_event_sulk', npcId: 'sect_leader_逍遥派', title: '满一线', icon: '🍶',
        desc: '一圈斟下来人人七分——你的盏，十分。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'xy_e_sulk_done',
        ambient: true, repeatEvery: 30, requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '酒仙池边来了几位游方的酒客，他坐起来陪盏。一圈斟下来，人人七分——斟到你，手腕一沉，斟了十分，酒面隆起一线，晃而不溢。酒客们没瞧出来，你瞧出来了。', type: 'description' },
            { speaker: 'npc', text: '「坛自己歪的。」他重新躺下，闭着眼，「酒仙池的坛，认人。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '当场饮尽，再替他斟一盏——也斟十分', effect: 'fill' },
                { text: '不动声色，也只饮七分，剩三分搁在盏里', effect: 'dumb' }
            ]}
        ],
        effects: function (npc, choice) {
            var aff = 0, msg = '';
            if (choice === 'fill') {
                aff = 5;
                msg = '你举盏饮尽，滴酒不剩，然后提起酒瓢，替他也斟了一盏——斟十分，酒面隆起一线，晃而不溢。他睁开眼，盯着那一线看了半晌，忽然低低笑出声：「……学我斟酒。」他坐起来，端起那盏，没喝，先敬了你一下，「行。往后这坛，你来，十分；你不来——」他饮尽，把盏倒扣在坛盖上，「它自己给我斟七分。剩的三分，替你存着。坛认人，存得住。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 2);
            } else {
                aff = -2;
                msg = '你饮了七分，剩三分搁在盏里。他看见了，什么也没说，起身把坛里剩的酒滤了一遍，滤得很慢。第二日酒客们又来，他斟酒照旧人人七分——独你的盏换了，换成一只小盏。小盏斟七分，浅得像个客套。酒客问为何换盏，他懒懒答：「盏换错了。」顿了顿，又补一句，像玩笑，又不像，「人换盏，不换心。心要是有多的——盏再大，也只盛得下七分。」';
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 祁清禅：抄经写乱一行，乱处不落经批，落了一个「客」字 ----
    'heng_event_sulk': {
        id: 'heng_event_sulk', npcId: 'sect_leader_恒山派', title: '乱了一行', icon: '🪵',
        desc: '她替戒堂抄的经文乱了一行——乱处，恰在你名字旁边。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'heng_e_sulk_done',
        ambient: true, repeatEvery: 30, requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '抄经堂。你进门时，她正替戒堂抄课诵文，小楷一行一行极匀——你站到案边看，她的笔锋经过功德栏刻着你名字的那一处，忽然一滞：一行乱了。她停笔，看着那一行，不抹，不描，搁笔等墨干。', type: 'description' },
            { speaker: 'npc', text: '「经上说，心如工画师。」她说得极轻，像对纸说话，「画了六年，今日——越过了一行。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「这一行不算错。越过去的那一笔，经也容它。」', effect: 'mend' },
                { text: '装作没看见，只夸她的小楷匀', effect: 'dumb' }
            ]}
        ],
        effects: function (npc, choice) {
            var aff = 0, msg = '';
            if (choice === 'mend') {
                aff = 5;
                msg = '她搁笔的手停了停。半晌，她重新执笔——没有把那一行重抄，只在乱行旁边添了一行极小的注。你凑近看，注的是两个字：「客来。」她把墨吹干，合上卷子，指尖在卷角停了半息。「戒堂的文，注要归档。」她说，耳尖有一点暖，「归档不问注的缘由。我知道就够了。下回你来——早些越过那一行。越得早，注就注得从容。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 2);
            } else {
                aff = -2;
                msg = '你夸她小楷匀。她「嗯」了一声，没有接话，把那一行重新抄了——抄完整页都匀，独新行的墨色深了一点。当晚戒堂的记录上多了一笔小字，你后来从知客的师侄口中听到：「抄经者，抄时心动一次。」——记在她自己名下。第二日你下山，她在石阶上送你，忽然说：「越过一行的心，经上不怪。」说完转身进殿。你把这句话想了一路，越想越深。';
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 逵佩南：「未结」格的薄卷宗，又厚了 ----
    'song_event_sulk': {
        id: 'song_event_sulk', npcId: 'sect_leader_嵩山派', title: '薄卷宗', icon: '📚',
        desc: '未结格那册卷宗又厚了几页——封皮上的三个字，他不给人看。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'song_e_sulk_done',
        ambient: true, repeatEvery: 30, requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '执法堂西厢。他核着卷宗，你在案角翻新订的执法条例——翻着翻着，听见他合卷的声音：卷宗库「未结」格那册薄卷宗，不知何时搁在了案头。册子不算厚，可比你上回见的，分明厚了几页。封皮扣着朝下，三个字压在底下。', type: 'description' },
            { speaker: 'npc', text: '「闲卷。」他把薄卷宗归回「未结」格，摆得端端正正，语气没有起伏，「执法堂的规矩：无案由者，不入架，不离格。」他顿了顿，背对着你，「这一册，不入架，不离格，月月见厚。你说，它违不违例？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「违不违例，翻开核一遍才知道。核给我看。」', effect: 'read' },
                { text: '「首座大人档存得跟经似的——执法堂先自查吧。」', effect: 'tease' }
            ]}
        ],
        effects: function (npc, choice) {
            var aff = 0, msg = '';
            if (choice === 'read') {
                aff = 5;
                msg = '他归架的手停住了。西厢里只有灯芯的响。半晌，他把那册薄卷宗从格里取回来，翻开封皮——三个字你终于看见了：你的名字。内页一行一行小楷，记的全是你来嵩山的日子：几时上山、核过哪条、说过哪句话，判词的格式，比堂上的公文还工整。「档不给人看。」他说，可卷宗没有合，「今日破例。」他当着你的面核到最末一页，提笔，把今日的日期添上——添完合卷，归格。这一回，封皮朝上。「封皮朝上，执法堂三十年没有过这个例。」他的耳廓红着，声音照旧平，「你就是例。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 2);
            } else {
                aff = -3;
                msg = '「自查。」他念了一遍，点点头，当真取出执法堂的自查簿，翻到空白页，提笔：「自查一目：档房桑某？」——笔锋在纸上悬了三息，他把簿子合上了。「不必查了。」他把自查簿归架，「查过了。判语：不违例。」他坐回案后继续核卷，声音平平，听不出什么，「条例管案由，不管日子。这一册，记的是日子。」那夜过后，「未结」格的薄卷宗又厚了一页。记的是什么，只有灯知道——那盏灯，亮到五更。';
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 岳清晓：「日」字拓废了一张，废片她一张不扔 ----
    'tai_event_sulk': {
        id: 'tai_event_sulk', npcId: 'sect_leader_泰山派', title: '废了一张', icon: '🎋',
        desc: '她拓的「日」字废了一张——废片压得平平整整，一张不扔。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'tai_e_sulk_done',
        ambient: true, repeatEvery: 30, requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '岱庙碑林。她照旧拓碑——你坐在旁边的石头上看她上纸、濡湿、捶打。捶到中段，她的手腕忽然一虚，拓包滑过去半寸：这一张废了。她盯着那张废片看了两息，没有出声，把它搁到一边——毡边压着的废片已经一沓，每张都压得平平整整，一张没扔。', type: 'description' },
            { speaker: 'npc', text: '「三百多张。」她一边研墨一边说，像讲别人的事，「十年，我就废了这么多张。从前废一张，我知道为什么——手重了，心急了。」她把那张新废片压到最上头，压平，「今日这张，不知道为什么。不知道的——最气人。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「我知道为什么。要不要我说？」', effect: 'tell' },
                { text: '捡起废片端详：「废得好，像幅写意。」', effect: 'joke' }
            ]}
        ],
        effects: function (npc, choice) {
            var aff = 0, msg = '';
            if (choice === 'tell') {
                aff = 5;
                msg = '她捏着拓包的手停了。「说。」她下巴一抬，脸上的光全聚过来，不躲也不让。你说：拓的时候你在看我，没有看碑。她愣了一息，忽然蹲下去，把脸埋进那一沓废片里闷了一会儿——抬起头时耳根通红，话照旧直：「好！这下你也知道了——这张，也记你账上！」她把那张废片塞进你手里，按实，「拿好。收着它——哪天你把我手稳住了，我拓一张成的跟你换。换的时候，这张就是凭据！」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 3);
            } else {
                aff = -2;
                msg = '「写意？」她一把将废片抢回去，压平，瞪你，眼睛瞪得溜圆，「我拓了十年的『日』字，你说写意！」她当日收拓收得特别早，下山走在你前头，十八盘走得飞快。到山门口她忽然站住，回头，火钩往肩上一扛，下巴一抬：「明日寅时，上顶。」你问做什么。她咬牙切齿：「看我拓。你看着，我手就稳——不稳，我就认，认是谁的错！」第二日那张，她当真拓稳了。拓完没有给你，卷进竹管，麻线松了一匝又缠上一匝，缠得特别仔细。';
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 幽翠微：给你的纸包写着「茶末」，拆开是头一茬 ----
    'qing_event_sulk': {
        id: 'qing_event_sulk', npcId: 'sect_leader_青城派', title: '茶末', icon: '🍵',
        desc: '她塞给你的纸包上写着「茶末」——拆开一看，芽头全是头一茬。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'qing_e_sulk_done',
        ambient: true, repeatEvery: 30, requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '焙房。你下山前，她往你手里塞了个小纸包，包口拧着，包上写了两个字：茶末。「炒过了火的，苦。」她头也不抬地擦着茶夹，「泡浓些，别嫌。」——你捏了捏那包茶：芽头细匀，香气压着纸往外透，分明是头一茬，还是顶上那一等。', type: 'description' },
            { speaker: 'npc', text: '「捏什么？」她瞥见你的手，话比平时更快，「茶末就是茶末。焙房的规矩，过火的不出山门——写个『末』字，你才好拿。写头一茬，」她顿了顿，低头继续擦夹子，「出了山门，满山要问是给谁的。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '当面拆开：「这是头一茬。给茶的人，也是顶上那一等。」', effect: 'point' },
                { text: '顺着她：「茶末好，茶末不花钱——下回多给些。」', effect: 'play' }
            ]}
        ],
        effects: function (npc, choice) {
            var aff = 0, msg = '';
            if (choice === 'point') {
                aff = 5;
                msg = '她擦夹子的手停了。耳根先红了，嘴上还硬：「眼睛尖。」她一把将纸包夺回去，拆开，拈了一撮对着灯照——照了半晌，认了：「……头一茬。」她忽然把那包茶分成两份，大的那份重新塞回你手里，小的那份自己封进罐子，动作又快又利落，「新规矩：从今日起，茶末和头一茬，一个包。一个包，满山就不用问了。」她把罐子归架，背对着你，声音压低了半调，「问给谁的——罐知道，你知道，我知道。够了。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 2);
            } else {
                aff = -2;
                msg = '「不花钱？」她抬起头，茶夹指着你，想骂，没骂出来，自己先气笑了：「行，好——不花钱的茶，喝！」她放下夹子，转身从架子第二层又拿了一包，把「茶末」两个字描得更重，塞进你怀里，「下回的下回的——这包也先拿着。拿这么多苦茶回去，泡浓些，别嫌！」你下山后拆开——还是头一茬。从此你每回下山，她都塞你一包「茶末」，包越来越沉，字越写越歪，有一回「末」字都缺了一点。满山没有人点破。看茶人的嘴快，满山都知道它在护什么。';
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 奚湘筠：旧谱的空白上写了又洇掉——半个字，是你的名字 ----
    'xiang_event_sulk': {
        id: 'xiang_event_sulk', npcId: 'sect_leader_衡山派', title: '写了又洇', icon: '📜',
        desc: '旧谱洇毛的空白上添了一行新墨——写了，又拿纸洇掉了。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'xiang_e_sulk_done',
        ambient: true, repeatEvery: 30, requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '琴台侧屋，雨刚停。她把旧谱摊在案上去收胡琴——你替她看着案，目光落在下半阙那片洇毛的空白上：密密麻麻的草稿痕里多了一行新墨，笔锋才收，又拿纸洇过——洇得不彻底，纸纤维里沉着半个字的形状。是你名字的头一笔。', type: 'description' },
            { speaker: 'npc', text: '她回来，看见你在看谱，脚步停了半息。不躲，不合谱，只立在案边。半晌，她说：「写错了。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「没有写错。写全它——我看着你写。」', effect: 'keep' },
                { text: '装作没看见，只夸上半阙的墨色旧得好', effect: 'dumb' }
            ]}
        ],
        effects: function (npc, choice) {
            var aff = 0, msg = '';
            if (choice === 'keep') {
                aff = 5;
                msg = '她的指尖在谱角停了停。侧屋里雨从檐上下来，一滴，一滴。半晌，她坐下，执笔——蘸了墨，悬在那行洇掉的字上，悬了很久，终究没有落，把笔搁下了。「写全了——曲就该拉完了。」她说，很轻，「拉完了，人该下山了。师父的旧话。」她合上谱，合得极慢，像怕压疼那半个字。「今日不写。不是不想。」她把谱推到你手边——谱匣的钥匙，她一并搁在谱上，「你收着。我想明白『下山』两个字的那日，你还我。还的时候——那半个字，我当着你写全。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 3);
            } else {
                aff = -2;
                msg = '你夸上半阙的墨色旧得好。她「嗯」了一声，把谱合上，收进匣里。当夜琴台上的半阙，她拉得特别早，收弓收得特别干净——像把一件东西收整齐了。第二日你再上台，蒲团还在台角，蒲团边却多了一盏灯——挡风的灯，新的，灯罩特别小。师妹告诉你：师姐昨夜添的，说下台的路滑，给下台的人照。谁下台——都照。灯只一盏。它等谁，灯没有说，她也没有。';
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 桑拾玖：新段子里的主角分明是你，关窍处他跳过了 ----
    'gai_event_sulk': {
        id: 'gai_event_sulk', npcId: 'sect_leader_丐帮', title: '且听下回', icon: '📖',
        desc: '粥棚的新段子，主角分明是你——讲到关窍，他跳过去了。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'gai_e_sulk_done',
        ambient: true, repeatEvery: 30, requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '城南沙粥棚。他讲一段新书：有个过路人来粥棚，喝了一碗温的，坐在棚柱左边第三个位子上，听书听到半夜——满棚听得有滋有味，他讲得眉飞色舞，折扇开合。讲到那过路人凑近说了一句什么，满棚伸长了脖子——他折扇一收：「且听下回分解。」', type: 'description' },
            { speaker: 'npc', text: '人散了，他收碗，看见你还坐着，一点也不意外：「还听？」他把两只豁口碗摞起来，摞得整整齐齐，「这一段，三分真，七分好听。你想听的那三分——在跳过去的那一句里。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「那就别等下回。跳过去的那句，当着我的面讲。」', effect: 'face' },
                { text: '跟众人一起笑，夸这段书热闹，装作不知道', effect: 'laugh' }
            ]}
        ],
        effects: function (npc, choice) {
            var aff = 0, msg = '';
            if (choice === 'face') {
                aff = 5;
                msg = '他摞碗的手停了。他看了你一会儿，忽然蹲下去，把你喝过的那只碗拿回来，摆回案上——摆在案头离条凳最近的位置，豁口朝里。「豁口朝里的，是自家的。」他说得极平，像在解释一条讯房的规矩，「跳过去那一句，不能讲给满棚。讲了，满棚笑；笑了，它就成书了——成书，就假了。」他给你添了半碗温粥，推过来，「当着你，只一句：过路人凑近说的那一句，书里我没有写。」他抬眼，粥棚的火光映在眼里，没有笑，「写什么——你下回来的时候，自己问。你问，我答。这一段，从今日起，只讲给一个人听。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 2);
            } else {
                aff = -2;
                msg = '你跟着众人笑，夸这段书热闹。他「嗳」了一声，也笑，折扇又打开了——可那一夜的书，他没有接着讲，改讲了一段旧的，眉飞色舞，满堂喝彩。只有老师傅听出一点不对：他讲书，讲到一半总要朝棚柱左边第三个位子望一眼。那夜，一眼也没望。你离棚时他在帮着收碗，头也不抬，声音压得只有碗听得见：「跳过去的书，不是丢了。讯房跳过的段，都在册子里存着。」他把最后一只碗倒扣上架，扣得端端正正，「册子存满了——一次讲完。讲的时候，听客一个就够。」';
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 聂明泽：复核记录上写了一行又划掉——规上无此格式 ----
    'yan_event_sulk': {
        id: 'yan_event_sulk', npcId: 'sect_leader_阎罗殿', title: '无此格式', icon: '🧾',
        desc: '复核记录上有一条写了又划掉——规上，没有这个格式。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'yan_e_sulk_done',
        ambient: true, repeatEvery: 30, requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '档房。你等他核完卷，顺手翻他案头的复核记录——一行一事，小楷极匀。翻到最末一行，有一条写了又划掉的：墨划得很重，纸没有破，对着灯照，照得出头一个字——「心」。', type: 'description' },
            { speaker: 'npc', text: '他归座，看见你捏着那页纸对着灯。他没有拦，站在案边。半晌，他说：「规上，没有这一条的格式。」顿了顿，「没有格式的——不能录。」他伸手把那页纸翻了过去，扣在案上，动作很轻，「不能录的……写出来了。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「那就别按格式。写全它——我看着你写。」', effect: 'mend' },
                { text: '装作没看见，只夸他的小楷匀', effect: 'dumb' }
            ]}
        ],
        effects: function (npc, choice) {
            var aff = 0, msg = '';
            if (choice === 'mend') {
                aff = 5;
                msg = '他翻纸的手停住了。档房里静得能听见灯花爆了一声。半晌，他坐下来，提笔，蘸墨——笔悬在那条划掉的字上，悬了很久，终究没有添，把笔搁下了。「写全了，这一卷就要单独立格。」他说得很慢，「单独立格的规——近手的卷，不单独立。」他把那页纸折回原痕，收进了袖子，不是档袋。「从今日起，这一条，出记录。」他耳尖红着，「记录是公的。出记录，收进的地方……」长久的停顿，「规上没有这一格。我自己，设一个。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 2);
            } else {
                aff = -2;
                msg = '你夸他小楷匀。他「嗯」了一声，把那页纸收回去，归进卷里，摆正。当晚他核卷核到很晚。第二日你再翻案头的复核记录——最末一页多了一条新的，没有划掉，格式与旧条都不合：事由一栏，只一个字，「等」。判语一栏，一行小字：「不判。规管不着这一条。」记档人说，这一卷已经入了近手格。近手是多近，他把那格档往你面前推过一回给你看——离他手最近的一格，格底垫了新纸。垫新纸的意思，档规卷三：珍卷，防潮。';
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 耿雪衣：塞给你一张伤风方子——你没伤风，方尾写着「预服」 ----
    'xue_event_sulk': {
        id: 'xue_event_sulk', npcId: 'sect_leader_血手门', title: '伤风方', icon: '🍲',
        desc: '她塞给你一张伤风方子——你没伤风，方尾注着两个字：预服。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'xue_e_sulk_done',
        ambient: true, repeatEvery: 30, requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '药庐。你临走前，她往你手里塞了张折好的方纸，折角折得整整齐齐。你展开：一张伤风的方子——姜三片，枣五枚，葱白两段，煎法服法一行一行，末尾多注了两个字：预服。', type: 'description' },
            { speaker: 'npc', text: '「你没伤风。我知道。」她低头翻着药匾，语气平得像报数，「方子不光治病。也治『万一』。」她翻过一瓣白药，「万一你哪天晚归，受了凉，趁症起来就煎。要是过了症——」顿了顿，「过了症，就想不起来煎了。所以现在给你。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「预服，我记下了。往后晚归，先煎它，再进门。」', effect: 'point' },
                { text: '「姜三片枣五枚——这方子，比门里灶上的腌菜还素。」', effect: 'joke' }
            ]}
        ],
        effects: function (npc, choice) {
            var aff = 0, msg = '';
            if (choice === 'point') {
                aff = 5;
                msg = '她翻药的手停了。她抬头看了你两息，耳朵慢慢红了，语气还端着平：「哦。你认得方子。」她进屋再出来，手里多了一张纸，当面摊开——是那张清单。「被人骂晚归」那一行，今日多了一行小注：晚归，先煎药，再骂。「注是我今日添的。」她拿药臼压了压纸角，「骂和煎药，次序我想了三日。先煎药——骂可以等，伤风不能。」她把清单折好收回灯座底下，把那张伤风方子重新塞回你怀里，按实，「方子你收着。清单在灯底下。两样，都是活的。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 2);
            } else {
                aff = -2;
                msg = '「比腌菜素。」她重复了一遍，认认真真想了一会儿，点头：「对。腌菜有盐，方子没有。」她把方子收回去——你以为她要收起来，她却在末尾添了一味：枣，五枚改七枚。「甜了。」她重新折好，塞回你怀里，塞得特别实，「方子素，才长久——这个道理，门里没人懂。」她转身去翻药匾。那夜药庐的灯亮到很晚。第二日门里人说：昨夜药庐的白药碾到三更，碾的量刚刚好，一星也没过头。只是药碾子最后多骨碌了两声——像有人推了一把，又没推。';
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 拓银沙：金蝎赖在你行李上——她说它是顺路 ----
    'xie_event_sulk': {
        id: 'xie_event_sulk', npcId: 'sect_leader_飞蝎坞', title: '顺路', icon: '🐾',
        desc: '金蝎赖在你行李上不下来——她来收，说是顺路。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'xie_e_sulk_done',
        ambient: true, repeatEvery: 30, requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '飞蝎坞边的客屋。清早你打开行李——金蝎趴在你的衣服上，尾钩收着，八条腿拢着，趴得特别乖，像趴了一夜。你还没出声，门被一把推开，她站在门口，手里捏着半块没吃完的干粮。看清屋里的阵势，她愣了一息，把干粮两口塞进嘴里。', type: 'description' },
            { speaker: 'npc', text: '「他娘的——这东西最近反了！」她两步进来，一把捏住金蝎的壳往上提，金蝎八条腿抱住你的衣袖不撒手，她拽了两下没拽动，恼了：「叫你乱爬！这是客的屋子！」她骂蝎，耳根却一点一点红了，嗓门一点一点低了，低到最后完全变了味：「……我又不是特意来看你的。顺路。对练场在反方向，可我——顺路！」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「顺路。那你问问它——它趴了一夜，是替谁顺的路？」', effect: 'face' },
                { text: '「行行，顺路。告诉它：下回顺路，记得带铺盖。」', effect: 'play' }
            ]}
        ],
        effects: function (npc, choice) {
            var aff = 0, msg = '';
            if (choice === 'face') {
                aff = 5;
                msg = '她捏着蝎壳的手停住了。金蝎趁机爬回你的衣袖，尾钩翘了一翘，又乖乖伏下。她盯着它看了两息，忽然一屁股坐在你床沿，声音压下来，不咋呼了：「……它昨夜不回窝。我把它送回去三回，三回都爬出来。」她指着金蝎，指得特别凶，手指头却没有力气，「它什么意思，我知道。坞里人都知道——金蝎趴窝，是替主人惦记人。」她忽然站起来，把金蝎从你袖子上摘下来抱在怀里，转身往门口走，走到门口站住，背对着你，辫梢的红线一动不动：「它惦记的，是怕有人心里分了两处，丢了一处。」她跨出门槛，嗓门拔回平时的亮度，最后半句却混进了沙风里，「……明夜窗户别闩。不是查你——是坞规！」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 3);
            } else {
                aff = -2;
                msg = '「带铺盖？」她愣了一息，随即仰头大笑，笑得墙上的沙簌簌往下掉：「哈哈哈哈——你胆子肥了，敢编排坞里的金蝎！」她捏着金蝎的壳举到眼前，跟它面对面，说得特别认真：「听见没？人家不嫌你——往后顺路，讲究点！」金蝎尾钩一翘，在她拇指上轻轻敲了一下。她啧了一声，把它放回你的行李上。那日对练，她打得比平时凶，竹钳敲得窝壁啪啪响；晚课散了，她又「顺路」打你客屋门口过，往窗里丢了一小罐伤药——罐口封得特别实，罐身上拿炭笔歪歪扭扭写了三个字：顺路给。坞里的守卫捡起来验过，说那三个字写得特别用力，力透罐底。';
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 伏璃茵：七口井按仪轨取水，第三井错了序 ----
    'lie_event_sulk': {
        id: 'lie_event_sulk', npcId: 'sect_leader_烈日教', title: '井序', icon: '🏺',
        desc: '七口井按仪轨取水，她第三井错了序——井水不语，她语。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'lie_e_sulk_done',
        ambient: true, repeatEvery: 30, requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '烈日教七口井。圣女每月初一按仪轨取水：七井各取一瓢，供圣火龛——井序有定，八年没错过一回。今日你恰好在井台边陪她走，她取到第三井，手停了：这一瓢该取「客井」的水，她取的却是你平日饮水的那一口——瓢已经下去了，水特别清。', type: 'description' },
            { speaker: 'npc', text: '她盯着那瓢水看了两息，把它倒了，重新按仪轨取了一遍。取完，她把水瓢搁下，挥手退了随侍的祭司——退得特别快。然后圣女腔当场垮掉，语速唰地提上来：「看见了？你看见了！别装没看见——井水不语，我语！」她指着那瓢重取的水，吐槽劈头盖脸：「七口井，八年，哪口井的水做什么用，我脑子里全有册子——今日手先去了你那口。手先去了，什么意思？」她瞪着你，眼睛发亮，亮里掺着窘，「意思是我这只手，把你那一笔记得比仪轨牢！仪轨在脑子里，你在手上——脑子管不住手，你满意了？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「错了就错了。你那瓢水——今日当着我，喝了它。」', effect: 'soothe' },
                { text: '「圣女殿下，井水都是水——你的手不认仪轨，认人。」', effect: 'tease' }
            ]}
        ],
        effects: function (npc, choice) {
            var aff = 0, msg = '';
            if (choice === 'soothe') {
                aff = 5;
                msg = '她指着水瓢的手停住了。她愣了两息，耳根先红，吐槽还硬：「喝了它？仪轨的水供圣火龛，谁给你开的这个例——」话没说完，手已经把那瓢水端起来了，端得特别快，像怕自己慢了会反悔。她喝了半瓢，把瓢搁下，抹了抹嘴，圣女腔回来一秒：「……水是甜的。」一秒之后垮掉：「甜，你听见了？我当着你夸你那口井的水甜——这话传出去，高台能把我的冠摘了当香炉！」她把水瓢归回原位，剩下半瓢没有倒回井里——搁在了井台上。「剩下半瓢归你。」她说，声音低了半调，「从今日起，每月初一，第三井我多取一瓢。多的这一瓢不入仪轨——不入仪轨的，是我自己的。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 2);
            } else {
                aff = -2;
                msg = '「认人。」她把这两个字嚼了一遍，脸上特别认真，认真地点了点头：「对。认人。」她忽然收了吐槽，转身把水瓢一只一只归位——归完，立在井台边沉默了一会儿。第二日当值的赤袍祭司跟你说了一件小事：昨日圣女遣了众人，独自立在第三口井边半个时辰，立完做了一件事——给那口井的水瓢换了一只新的。新瓢的柄上缠了红线，缠得特别密。祭司没敢问给谁缠的。她只说了一句，用的是圣女腔，特别慢：「井不认人。瓢认。」圣女腔说完就走了，走出两步，飘回来极轻的半句吐槽，轻得只有井水听见：「……认人有什么用。人家的影子，还叠着别人的。」';
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 檀望舒：说着说着漏出一口别人的调子——她自己愣了半息 ----
    'long_event_sulk': {
        id: 'long_event_sulk', npcId: 'sect_leader_天龙教', title: '顺口', icon: '💬',
        desc: '她说着话忽然漏出一口别人的调子——说完，她自己愣了半息。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'long_e_sulk_done',
        ambient: true, repeatEvery: 30, requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '外坛廊下，黄昏。你们并肩坐着说台下的小事——说到一半，她忽然开口，出来的不是平日那口干脆，是一口你陌生的调子：腔调、尾音，像前日来寻你的那个人。半句出口，她自己比你先愣住：话停在半空，腰间铜镜牌磕在廊柱上，响了一声。', type: 'description' },
            { speaker: 'npc', text: '（用黑袍知客的调子）「此条，不入令。」她先拿一口知客腔把这句漏话压下去，压完绷不住，嗓子干脆，却发虚：「……顺口了。传声房的耳朵有个老毛病：调子听一回就卡在喉咙里，说着说着，自己漏出来。」她把铜镜牌拿起来翻了个面，又翻回来，「这口调子，是前日来寻你的那个人的。我只听了一回——就一回。」' },
            { speaker: 'npc', text: '她忽然换了把软和嗓子：（用云婆婆的调子）「娃儿，卡在喉咙里的调子，像扎在脚底的刺。不拔，走路疼。」传完自己切回来，干脆低了半调：「婆婆的话，我借一借。我自己的那一条——」她停住，看你，看了两息，忽然别过脸去，看廊外的黄昏，「为什么卡住的是这口调子，不是别人的——你是真不知道，还是装不知道？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「我知道。刺我来拔——今日我用你的调子，说一句话还你。」', effect: 'point' },
                { text: '「顺口就顺口呗。你的百声，哪一口不是顺的——小事。」', effect: 'dodge' }
            ]}
        ],
        effects: function (npc, choice) {
            var aff = 0, msg = '';
            if (choice === 'point') {
                aff = 5;
                msg = '她翻牌子的手停住了。她转过头来，眼睛慢慢亮了——亮了又先压住，拿一口标准知客腔压的：（用黑袍知客的调子）「客，请讲。」传完自己撑不过三息，干脆垮出来：「讲讲讲——啊不，传声房的规矩，听令要端坐。」她当真端坐好了，两手放在膝上，像等说书的孩子。你开口，用她平日的干脆，学她的话还给她：卡在喉咙里的调子，不是刺，是户口。她愣了足有三息——忽然抬手捂住脸，铜镜牌磕在额头上，声音从指头缝里漏出来，特别闷：（用讲经长老的调子）「……老朽讲经四十年，今日头一回——被人把我的话，讲还给我。」传完她放下手，耳根通红，干脆得特别亮：「这一句，传声房收下了。你用的调子——也收。从今日起，那口调子再卡在我喉咙里，我不拔了。疼就疼着。疼着，才知道是谁的调子在替我疼。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 3);
            } else {
                aff = -2;
                msg = '「小事。」她重复了一遍，点点头，嗓子回到干脆，干脆得特别乖：（用黑袍知客的调子）「客言，闻讫。此条，不入令。」传完她起身掸了掸袍子，下台阶的时候忽然换了口凶腔：（用护法长老的调子）「练声！」——拿凶腔把自己轰走，轰出两步，肩膀垮了垮。那夜传声房的灯亮到三更。第二日云婆婆告诉你一件小事：那孩子昨夜对着半面残铜镜练了一夜的调子——练得极认真，一句话反复三遍，第三遍连气口都严丝合缝。练完，她用袖子把镜面擦了，擦得特别干净。练的是谁的调子，云婆婆隔着门缝没听清——只听见她末了说了一句，用的是特别干脆的那口：「练不像的，是你的事；练像了的——还是你的事。」';
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 戚巧机：机关雀比你先打拍子——她说那是故障，拆了却没有齿错 ----
    'sj_event_sulk': {
        id: 'sj_event_sulk', npcId: 'sect_leader_神机门', title: '快一拍', icon: '🐦',
        desc: '机关雀总比她先知道你来——她说是故障，拆了查，没有一齿错。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'sj_e_sulk_done',
        ambient: true, repeatEvery: 30, requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '工坊。你离门还有半条甬道，架上的机关雀忽然滴答了一声，翅翼半张——她正在校机，手停了。你进门，雀又滴答一声，这一回拍子稳稳落定。她盯着雀看了两息，把它从架上取下来，拧开雀腹，对着灯查齿——查了很久，一处一处全查过，没有一齿错。', type: 'description' },
            { speaker: 'npc', text: '「没有齿错。」她合上雀腹，语气像报数，报得有点用力，「齿不错而先鸣，册上叫『虚应』。虚应是故障。」她把雀归架，归到离门口最近的钉子上了——归完自己看了一眼那个位置，没有挪回去。「故障要修。这个——」她背过身去拿校准笔，「这个我想再记两日数据。数据不够，修了也是白修。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「不是故障。它替谁掐着时辰，你上弦的时候不知道么？」', effect: 'point' },
                { text: '「一只雀，叫两声就叫两声——也值得你拆开来查？」', effect: 'dodge' }
            ]}
        ],
        effects: function (npc, choice) {
            var aff = 0, msg = '';
            if (choice === 'point') {
                aff = 5;
                msg = '她拿校准笔的手停住了。她背对着你站了两息，忽然把雀从架子上取下来，托在掌心，走到你面前——雀在她掌心里滴答，拍子跟你的呼吸对上了。「上弦的时候，」她的声音低了半格，「我在雀舱里刻过一行小刻度。刻完自己忘了刻的是什么。」她把雀腹拧开一条缝，让你看——舱壁上一行极小的刻痕，刻的是你头一回进工坊的时辰。「虚应不是故障。」她耳根红着，语气还硬撑着报数，「虚应是——它记得的东西，比我记得牢。从今日起这条不入误差册。入误差册要销项。这一条，」她合上雀腹，把雀搁回离门最近的钉子上，「我留着。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 3);
            } else {
                aff = -2;
                msg = '「不值得。」她点点头，把雀归架——归回了原先靠里的钉子，动作极轻。「一只雀。」她坐回校准台前，背对着你，笔尖落下去，一笔一笔极稳。那夜工坊的灯亮到很晚。第二日工坊里人说：戚师姐昨夜把那只机关雀又拆开查了一遍，查完没有装回去，对着满案的零件坐到三更。天快亮她忽然把零件全装回去了，装完给雀上了满弦，搁在耳边听了一宿。听什么，没人敢问。只听见天亮时她对着雀说了一句话，声音很轻，轻得像报一个再也修不好的误差：「……你替我记着罢。我这儿，算不出的越来越多了。」';
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 雷惊蛰：塞给你一只防火布囊——囊角的批注写着「预备」 ----
    'pi_event_sulk': {
        id: 'pi_event_sulk', npcId: 'sect_leader_霹雳堂', title: '预备的囊', icon: '🧯',
        desc: '他塞给你一只防火布囊——你没有伤，囊角批着两个字：预备。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'pi_e_sulk_done',
        ambient: true, repeatEvery: 30, requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '防火棚。你临走前，他从案底下取出一只防火布囊，塞进你手里——塞得极实。囊不重，捏着里头是细末的东西，囊口系的是活扣。囊角有一行批注，字极小，要凑近灯才看得清：「预备。」', type: 'description' },
            { speaker: 'npc', text: '「不是伤药。」他说得极轻，你俯身才听全，「是燥硝。晒了三日的。人走路，容易受潮——潮了，脸上看不出来。」他把你的手连同布囊一起按住，按完自己先红了耳根，手却没有收回去，「批注在囊里。路上冷了再看。看了——」他顿了顿，声音更低，「看了就找个屋檐。屋檐底下拆囊。拆囊的手，不能是冻着的。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '当场拆开囊角的批注，就着灯念给他听', effect: 'point' },
                { text: '「一囊硝？你当我是炮仗，走哪儿响哪儿？」', effect: 'joke' }
            ]}
        ],
        effects: function (npc, choice) {
            var pg = (typeof window !== 'undefined' && window.currentCharData && window.currentCharData.gender === 'female') ? '她' : '他';
            var aff = 0, msg = '';
            if (choice === 'point') {
                aff = 5;
                msg = '你拆开批注，就着灯念——纸上一行蝇头小字：「是日，囊与人。愿其路不寒。」念完你抬头，他正盯着灯，喉结动了一下，极轻地开口：「……批注四字为限。这一条，九个字。」他伸手想把纸拿回去，拿到一半停住了，手落回案上，落得很轻，「超规了。超规的批注要销毁。」他看着你手里的纸，看了很久，忽然说：「不销了。」他取过笔，在批注末尾添了日期，添完把纸重新折好，折成三折，替你收回囊里，按实。「入册的批注，销不得。」他的声音轻到底了，「从今日起，这一条算正批。正批的意思——」他顿了顿，补了那句惯常的话，这一回补得又快又轻，像怕自己反悔，「……我写了。我真的写了。写给' + pg + '的。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 3);
            } else {
                aff = -2;
                msg = '「炮仗。」他重复了一遍，认认真真想了想，摇头，摇得极轻：「炮仗响给人听。你不是。」他把布囊从你手里拿回去——你以为他要收起来，他却解开囊口，往里头又添了一包东西，添完重新系好活扣，系得比原先松了些，好拆。「添的是姜炭。」他说，声音轻得像怕惊动囊里的东西，「硝管燥，炭管暖。两样齐了，路就不寒了。」他把囊重新塞回你怀里。那夜防火棚的灯亮到三更。第二日堂里人说：堂主昨夜配了一囊东西，配得极慢，一味一味全晒过研过。配完他在册子上记了一笔流水，记账的师弟瞥见了一眼——「是日，配囊一。用途：不记。」用途栏空着的批注，方子册二十年头一条。师弟问为什么不记，堂主正在绑引信，头也没抬，声音轻得几乎听不见：「记了，就要问给谁。问给谁——' + pg + '会不好意思。」';
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 宓书言：夹在你书里一张勘误签——「是条：宜常见」 ----
    'shu_event_sulk': {
        id: 'shu_event_sulk', npcId: 'sect_leader_天书阁', title: '勘误签', icon: '🔖',
        desc: '你借的书里夹了张勘误签——签上批的不是书，是你。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'shu_e_sulk_done',
        ambient: true, repeatEvery: 30, requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '校讎房。你归还上月借的书，他接过，照例当页翻验——翻到一半，指尖停了。书里夹着一张勘误签，不是你的。签上的字你认得：他的批注体，极小，极稳。他把签抽出来，看了一眼——看完没有收，也没有还你，搁在案上，用镇纸压了半边，露着另外半边给你看：批注五个字，「是条：宜常见。」', type: 'description' },
            { speaker: 'npc', text: '「夹错了。」他说，话短得像裁纸，「这张不是勘误。勘误批书。」他看着那张签，看了两息，「这张批的是借书的人。」他把镇纸挪开，签整个露出来——签的背面还有一行更小的字：「批语超四字。超字之批，只此一签。」他抬眼，「规矩我知道。批了，就是不打算守这一回。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「签我收着。『宜常见』三个字——明日我就来常见。」', effect: 'point' },
                { text: '「校讎先生的批注，几时批到活人身上了？」', effect: 'dodge' }
            ]}
        ],
        effects: function (npc, choice) {
            var aff = 0, msg = '';
            if (choice === 'point') {
                aff = 5;
                msg = '他压签的手停住了。他看了你三息，忽然把签拿起来，翻到背面，就着案上的笔墨添了一行——添完推给你看。背面原那行小字底下，新添四个字，一笔一划：「明日，候。」他把笔搁正，耳根红着，话照旧短：「候，不是勘误。勘误等错处。」他顿了顿，声音低了半格，「候，等人。等人的签，天书阁没有格式。今日有了——自你这一张起。」他把签递到你手里，递得极稳，「收好。签在，候就在。你明日不来——」他背过身去整理卷册，声音混在纸页声里，「签我不撤。撤签，要两个人当面。这一条，也是今日新立的。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 3);
            } else {
                aff = -2;
                msg = '「活人。」他重复了一遍，点点头，把那张签收了回去——收进袖中，不是案屉。「批活人，僭越。」他坐回案前，取过你的还书，一页一页重新翻验，验得比方才仔细三倍。验完他在借书册上落了一行：「书还讫。无损。」笔尖顿了顿，他又添了半行，添得极小：「人，未见损。未再见。」他合上册子，归架。那夜校讎房的灯亮到三更。第二日阁里的书记说：先生昨夜把那张「宜常见」的勘误签裱了——用裱孤本的手艺，裱得极郑重，裱完压在玻璃案砖底下，砖底下从此多了一条批注。有人问裱一张签做什么，先生头也没抬，答了四个字：「存照，待讎。」待讎什么，他没说。案砖底下那张签，背面新添的四个字，书记瞥见过一回——「明日，候。」候的明日过了许多个，签还裱在那儿，砖擦得干干净净。';
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 隗九爻：两串一样的糖葫芦叫你挑——挑哪串，卦都一样 ----
    'dy_event_sulk': {
        id: 'dy_event_sulk', npcId: 'sect_leader_大隐阁', title: '一样的卦', icon: '🍡',
        desc: '他摆两串糖葫芦叫你挑一串起卦——你挑完他才说：两串，一样。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'dy_e_sulk_done',
        ambient: true, repeatEvery: 30, requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '大隐阁前台阶。他蹲着，面前并排插着两串糖葫芦——你数了数，两串的山楂一样多，一样大，连签头那颗风干的山楂都一样皱。他抬头见你来，也不起身，往台阶上拍了拍：「坐。挑一串。」你问挑什么。他把两串签子都扶正了，扶得端端正正：「挑一串，起一卦。规矩你懂：剩几颗，什么卦辞。」', type: 'description' },
            { speaker: 'npc', text: '你挑了左边那串。他点点头，没有数，反而把右边那串拔起来也数了数——数完咂咂嘴：「巧了。一样的。」他把两串并排立回台阶缝里，半仙腔端起来，端得晃晃悠悠：「挑哪串，卦都一样。一样的卦还叫你挑——你道为什么？」他斜眼看你，眼睛里全是憋着的笑，「挑，就不是我一个人蹲在这儿了。这叫『借挑留人』。卦书上没有这一页——我娘教的。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「留。今日这两串一起数——你一颗，我一颗，签头都不许吃。」', effect: 'point' },
                { text: '「绕这么大弯子就为拉人陪着吃？半仙的排场呢？」', effect: 'joke' }
            ]}
        ],
        effects: function (npc, choice) {
            var aff = 0, msg = '';
            if (choice === 'point') {
                aff = 5;
                msg = '他拔签的手停住了。他愣了两息，忽然一拍大腿：「一起数！好卦！这是双人卦！」他把两串全拔出来，塞一串给你，蹲得离你极近，「规矩改一改：你数一颗我数一颗，数错了罚——罚把签头那颗吃了。」他先数，数完一颗得意洋洋地看你。你们数到日头偏西，两串都数到了签头——两颗风干山楂并排立着，谁也没吃。「双人卦，卦辞现拟。」他抹抹嘴，拟得极认真，「剩两颗，皆是签头——」他忽然收了笑，看着那两颗山楂，声音难得正经，「卦辞叫『成双莫尽』。这四个字，二十年糖葫芦，头一回凑得齐。」他把空签插回台阶缝，两根并排，插得端端正正，「签留着。留双签，卦就成对。成对的卦——」他拍拍手上的糖渣，「来年还灵。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 3);
            } else {
                aff = -2;
                msg = '「排场。」他咂咂嘴，把两串糖葫芦全拔起来，收进蜡纸，「排场是给信卦的人摆的。你既嫌绕——」他把蜡纸包揣进怀里，起身拍拍衣摆，「那就不绕了。直说：我一个人蹲这儿，蹲得台阶缝都认得我了。想拉个人陪，又怕人笑，才摆的两串。」他说完自己先笑了，笑得没心没肺，「你看，直说了，也就这么回事。」那日他没有再起卦。第二日阁里人说：先生昨夜把山下集市的糖葫芦全包圆了——十几串，全插在台阶缝里，插了满满一排。有人问插这么多做什么，先生蹲在中间，数得头也不抬：「起个大卦。」问卦问什么。他数完最后一颗，把签头那颗风干山楂挨个扶正，扶得极仔细：「问一个人，几时再来挑一串。这一卦要数到明年——签多，不怕慢。」';
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 简知忆：附页写着「危险程度：想一直说话」——第二页空着给你写 ----
    'yin_event_sulk': {
        id: 'yin_event_sulk', npcId: 'sect_leader_侠隐阁', title: '附页第二页', icon: '📄',
        desc: '他给你补附页，第一页写满，第二页空着——空页推到你面前：你写。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'yin_e_sulk_done',
        ambient: true, repeatEvery: 30, requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '档廊。他在给你的档补附页，补得极专心——你走近了他才发觉，合卷已经来不及，索性没有合，只把附页往灯下挪了挪，挪成你看不全的角度。你还是瞥见了第一页末行：「危险程度：想一直说话。」他的耳根红了，批注腔没有垮：「附页，不许看。」', type: 'description' },
            { speaker: 'npc', text: '「档规：附页属勘档人，本人回避。」他说得又快又平，说完自己停了一息，忽然把附页翻过去——第二页，空白，推到你面前，推的动作快得像怕自己反悔，「第二页，给你写。」他别过脸去理档签，理得哗啦响，「写什么入什么档。你写的，我不勘。不勘——」他顿了顿，声音低了半格，「不勘，就是全信。档廊三百年，全信的附页，这是头一页。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '提笔就写：「此人危险程度：想一直见。」写完合卷归他', effect: 'point' },
                { text: '「空白页推给人写——档廊的规矩这么松了？」', effect: 'dodge' }
            ]}
        ],
        effects: function (npc, choice) {
            var aff = 0, msg = '';
            if (choice === 'point') {
                aff = 5;
                msg = '他理档签的手停住了。他看着你写完，看着你合卷——合完他没有立刻接，站在原地把那一行在嘴里过了一遍，过了两遍，才伸手把卷接过去，接得极轻。「想一直见。」他用批注腔念了一遍，念完批注腔垮了半句，「和第一页……对上了。」他把附页钉进正卷，钉得极慢，极正，钉完在骑缝处落了勘档人的小印。印完他忽然说：「档规：附页两造各执其半，此卷合一，不分执。」他耳根红着，语速快回来，「合一，就是这卷档不出档廊——要读，两个人一起来读。你来的日子，档廊的灯我都点两盏。第二盏不是勘档用的。」你问是做什么用的。他把卷归进近手格，背对着你：「照路。档廊深，你的步子——我记在附页背面了。这一条超页了。超页，不销毁。今日改的规。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 3);
            } else {
                aff = -2;
                msg = '「松了。」他点点头，把空白附页收了回去——收得极快，快得像抢救一页差点外泄的档。「档规不松。今日算我失手。」他坐回案后重新理档，批注腔端得平平整整，「失手的附页，按规重起。重起的页——」他取新纸，裁得极正，裁完没有推给你，收进了自己的档袋，「不给人写了。给人写的规矩，收回。」那夜档廊的灯亮到五更。第二日书记说：简先生昨夜把重起的那页附页写满了，写完没有钉进任何人的档——钉进了他自己那卷空白档里，钉在头一页。空白档三年头一回有了附页。附页写的什么，书记没敢看，只瞥见末行四个字，批注腔写的，平平整整：「存疑，不究。」存疑不究是宽条，档廊人人会用。可用在自己档上的，三百年来，头一个。';
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 狄长亭：送公文绕路四十里——「前路不利，绕行的」 ----
    'ty_event_sulk': {
        id: 'ty_event_sulk', npcId: 'sect_leader_天涯海阁', title: '绕路', icon: '🧭',
        desc: '他送公文绕了四十里路过你这儿——公文上盖的驿印，日期是三天前的。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'ty_e_sulk_done',
        ambient: true, repeatEvery: 30, requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你歇脚的客栈门口，一匹驿马停下来——狄长亭翻身下马，风尘满肩，双手呈上一封公文：「借问，此处可是某某落脚的客栈？有驿递公文一封，面呈。」你接过来看：公文是真的，火漆是完的，只是驿印的日期是三天前的，而这条路，无论如何也不在驿路正线上。', type: 'description' },
            { speaker: 'npc', text: '「驿递误期，是重罪。」他先开口，公文腔一丝不苟，「误了三日，我自去领罚。」他躬身半度，像交割完就要走，走到马前又停住，扶着鞍，没有上马，「只是押送的路，我选了绕行。绕行四十里——册上的说法：前路不利。」他顿了顿，声音低下去，那点颤又透出来：「前路哪里不利，册上没写。册上没写的，我说给你：四十里，多走一日半。一日半，够我在你门口，多站这一刻。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「公文留下，罚我陪你去领。领完罚——你送我回去。」', effect: 'point' },
                { text: '「驿丞知道你拿公文绕路么？天涯海阁的驿马，成了你的私马了？」', effect: 'tease' }
            ]}
        ],
        effects: function (npc, choice) {
            var aff = 0, msg = '';
            if (choice === 'point') {
                aff = 5;
                msg = '他扶鞍的手停住了。他回过头看你，看了三息，忽然笑了——那种极轻的、把公文腔全笑散了的笑：「陪我去领罚。」他重复了一遍，像核对一个不敢信的站名，「驿亭领罚，罚跪牌楼一炷香。你陪跪——」他摇头，摇得很慢，「不成。罚是我一个人的。」他把马缰系在店门口的桩上，系得端端正正，系完拍了拍手上的土，「但『送我回去』这一条，我批了。」他躬身半度，这一躬不是公文里的躬，躬得很深，「批文在此：即日启程，同回驿亭。沿途站名——」他直起身，耳根红着，声音稳下来了，稳得像终于等来了正班，「你报。你报一站，我记一站。记满一页，就是一路。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 3);
            } else {
                aff = -2;
                msg = '「私马。」他点点头，解下驿马缰绳，牵正，翻身上马——动作利落得像从来没有下过马。「驿马归驿，绕路归我。四十里的草料，我用自己的月钱补。」他在马上躬身半度，标准的驿礼，「多谢指教。公文送到，签押不必——面呈之件，见了人，就算讫。」马走出两步，他忽然勒住，回头补了一句，公文腔，字字端正，端正得像用尽了力气：「另：天涯海阁的驿路，天下最直。直的驿路上，肯绕四十里的——」他顿了顿，缰绳在他手里收紧了半分，「三百年的驿册上，今日头一桩。头一桩叫人不留情面，往后就没有第二桩了。这一条，也入册。」马蹄声远去。第二日老驿丞说：长亭回来领了罚，跪牌楼一炷香，跪得笔直。跪完他把那封公文的存根取出来，在背面添了一行小字。老驿丞凑近看过一眼——「是日，绕行四十里。呈讫。人笑我。笑，也认。」';
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 樊惊筹：新护腕里子37针——旧的那只，他背着人量过 ----
    'dq_event_sulk': {
        id: 'dq_event_sulk', npcId: 'sect_leader_大旗门', title: '量过的手腕', icon: '🧤',
        desc: '他丢给你一只新护腕，说你腕子瘦了——可他近日根本没碰过你的手腕。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'dq_e_sulk_done',
        ambient: true, repeatEvery: 30, requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '校场。你来看操，散操时他路过你身边，一样东西丢过来——你接住：一只新护腕，针脚密得发亮。他脚步没停，丢下一句：「换上。旧的松了。」你怔住：这几日他根本没有碰过你的手腕，连衣袖都没有沾到。', type: 'description' },
            { speaker: 'npc', text: '你追上去问怎么知道松了。他站住，回头，脸上没有什么表情，耳根却红了：「量过。」你问几时量的。他看着校场的旗杆，看了两息，像在决定招不招：「上月你演武，护腕滑了半寸，你自己往上推了一回。」他顿了顿，「推的那一下，我看见了。看见了，就量了——用眼睛量的。眼睛量的尺寸，营里没有第二双。」他把新护腕往你手里按了按，「里子三十七针。跟旧的一样。不一样的只有一样——」他转身要走，声音压到最短，「新的，收紧了半寸。半寸，是那双眼睛量出来的。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '当场换上新的，把旧的解下来还他：「旧的也归你收着。」', effect: 'point' },
                { text: '「用眼睛量尺寸——樊都尉，你操练的时候都看些什么？」', effect: 'joke' }
            ]}
        ],
        effects: function (npc, choice) {
            var aff = 0, msg = '';
            if (choice === 'point') {
                aff = 5;
                msg = '他接旧护腕的手停住了。他捧着那只旧的看了两息——旧的里子磨得发白，三十七针还在，针脚比新的旧了一色。他忽然把旧护腕翻开，就着天光，一针一针验了一遍，验得极慢。验完他点头，军中腔，尾音却松了：「针没松。布松了。」他把旧护腕揣进怀里——不是行囊，是怀里，贴心口那一面，揣得极快，快到像是怕自己反悔。「旧的归我。」他说完转身就走，走出五步，忽然站住，背对着你补了一句，声音压得极低：「营里的规矩，收旧物要登记。这一只——」他抬手按了按胸口，「不登。不登的东西，就是我的。」他大步走了。当夜守帐的兵说：都尉在灯下给一只旧护腕重新走了边，走完边又用油布包了三层，包完搁在枕边。搁枕边的东西，都尉从来只有一样：军令。';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 3);
            } else {
                aff = -2;
                msg = '「看些什么。」他站住，回头，认认真真答了：「看阵。阵里有人。」答完他觉得这话不对，眉头拧起来，像缝错了针要拆，「……不是。看的是——」他没有说完，把新护腕从你手里拿回去，翻开里子给你看那排针：「三十七针，一针一息。人打一套拳，呼吸多少息，护腕吃多少汗。尺寸不在腕上，在息上。」他把护腕塞回你手里，塞得极实，耳根红着，话更短了：「息，我数过。」说完转身就走，走得比操练还快。第二日营里人说：都尉昨夜在灯下拆了自己的护腕——他自己那只，用了五年的，拆了里子重新缝。缝完有人看见里子的针码变了，变成三十七针。营里都尉的护腕从来是十八针，粗针大线，全营都知道。十八改三十七，改的是什么，没人敢问。只看见都尉缝完把两只护腕并排摆在灯下看了一夜——一只旧的，一只新的。新的那只的尺寸，明眼人一看就认得：不是都尉自己的腕。';
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 裘霜莺：教你吹「过来」——你吹得和她一模一样，她偏说错 ----
    'tz_event_sulk': {
        id: 'tz_event_sulk', npcId: 'sect_leader_铁掌帮', title: '口风不对', icon: '🎵',
        desc: '她教你哨语，你学得一模一样，她咬定口风不对——不对在哪儿，说不出口。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'tz_e_sulk_done',
        ambient: true, repeatEvery: 30, requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '苇滩。她说今日教你哨语，教得极凶：口型不对，重来；气口不对，重来。教到「三短促」——过来——你吹了一遍，她张口就要骂，骂到一半卡住了。你吹的，和她自己吹的一模一样，连第二声末尾那点微微的上挑都在。她盯着你手里的哨，盯了三息，一把抢了回去。', type: 'description' },
            { speaker: 'npc', text: '「不对。」她背过身去自己吹了一遍——三短促，跟你吹的分毫不差。吹完她耳朵红透了，凶腔硬撑着：「我吹的才对。你吹的——不对。」你问哪儿不对。她把哨攥在掌心，攥了半天，攥出一手汗，忽然爆发：「不对就是不对！你想——你要是吹得跟谁都对得上，往后满江湖的人拿这一声喊你，你分得出哪个是我吗？！」她说完自己先愣了，凶脸垮了半截，声音落下去，落进苇子里，「……分不出，我就找不着你了。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「那我改。这一声我只吹你听的版本——跑调跑到独一份。」', effect: 'point' },
                { text: '「行行行，你对我错。哨语册上再给我记一笔『笨』得了。」', effect: 'play' }
            ]}
        ],
        effects: function (npc, choice) {
            var aff = 0, msg = '';
            if (choice === 'point') {
                aff = 5;
                msg = '她攥哨的手松了。她猛地转回身，凶脸上的红还没退，眼睛却亮了：「独一份？好！这才像话！」她当场把哨塞回你手里，重新教——这一回教得格外凶，格外细：「第二声末尾挑高半分，挑完压住，压出一点哑——对，就是这个难听的劲儿！这个难听法，满江湖独你一份！」你吹了一遍，她听完整个人松下来，抱着胳膊在苇滩上走了两圈，走回来时凶腔里全是得意：「记好了。往后这一声，不管隔几重山，我一耳朵就认出来——认出来了，」她停住，耳根又红，声音压下去，「我就知道该往哪儿应。」她从怀里掏出哨语册子，翻到末页「未编」那页，当着你的面添了一行，添得笔画极重：「三短促变调一支：专号。听者：我。」写完合册，塞回怀里，拍了拍，拍得极实。';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 3);
            } else {
                aff = -2;
                msg = '「记笨。」她哼了一声，当真掏出哨语册子，翻到末页，提笔要写——笔悬在纸上，悬了很久，落下去写的不是「笨」。写完了她也不给你看，合上册子塞回怀里，凶腔收了一半：「行，你对我错。对的人不跟错的人计较。」她转身往滩里走，走了几步，把哨从怀里摸出来，朝身后一丢——丢得又准又稳，你伸手接住。「哨你拿着。笨的人练哨费哨，你那支素坯的，摔了我心疼。」她头也不回地走进苇子深处。那一夜苇滩的哨声响到很晚。第二日帮里的师妹说：堂主昨夜在滩里练「三短促」，练了一遍又一遍——奇怪的是，她把自己的口风越练越歪，歪到最后，跟你白天吹的那一版本分毫不差。师妹问她练这个做什么，堂主把哨收了，凶着脸答：「笨人吹的调，总得有人肯吹得一样笨。不然他一个人笨，多没意思。」';
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 姬云锦：晨课名册不肯添你——散课后自己添在了教习一栏 ----
    'kl_event_sulk': {
        id: 'kl_event_sulk', npcId: 'sect_leader_昆仑派', title: '教习栏', icon: '📃',
        desc: '管名册的弟子问要不要把你添进观课栏，她说「不添」——散课后名册上多了你的名字。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'kl_e_sulk_done',
        ambient: true, repeatEvery: 30, requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '晨课场。你近来常去看她舞剑，管名册的弟子照规矩来问：「观课栏，添名么？」她正在缠素绸舞袖带，头也不抬：「不添。」弟子愣住，你也有点愣。她缠完带子，起势，舞的是迎雪，舞得极稳——稳得像方才那句话根本没有出口。', type: 'description' },
            { speaker: 'npc', text: '散课，弟子们走尽，她收剑，从案上取过名册——你这才看清，她提笔在名册上落了一个名字：你的。落的不是观课栏。是名册最末一行，那一栏的栏名三个字：「教习位」。她写完，把名册合上，才转头看你，语气平得像背舞的名目：「观课的人，站在哪儿都成，不用名册。教习不一样——教习有位子。位子在册上，册上有名，」她把名册递到你手里，让你自己看那一行，「名在册在。这一栏，昆仑立派以来，上头只写过先生一个人的名字。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「教习教什么，我明日卯时就位——你只管舞。」', effect: 'point' },
                { text: '「方才说不添的是你，添了的也是你——剑客的话，到底信哪句？」', effect: 'tease' }
            ]}
        ],
        effects: function (npc, choice) {
            var aff = 0, msg = '';
            if (choice === 'point') {
                aff = 5;
                msg = '她递名册的手停住了。她看着你，看了三息，忽然把名册从你手里抽回去——抽回去不是收，是翻开到教习那一页，提笔在「教习」二字旁边又添了一行小注。添完她合册，把册子摁进你怀里，这一回不许你还：「教什么，注上写了。自己看。」你翻开：小注四个字，「校我剑意」。你抬头，她别过脸去看松，耳根红着，语气还端着平：「剑客的剑意，自己校不着——十年了，问松岔半式，我三日才知道岔在哪儿。从明日起，你在教习位上，我舞，你校。岔了半式，」她顿了顿，声音低下去，落进雪里，「你当场告诉我。当场告诉我的那个人，册上有名。有名的人说的话——剑听。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 3);
            } else {
                aff = -2;
                msg = '「信哪句。」她把名册收了回去，收得不快不慢，「都信。两句都是真的。」她提剑往场心走，走了两步站住，背对你，答得像校剑一样认真：「『不添』，是说给弟子听的——观课栏添了名，你就是客。客，我看舞的时候，得端着。」她顿了顿，「『添了』，是说给册子听的。册子上你的名字落在教习栏——教习不是客。」她走进雪光里，背影直得像剑，最后一句落回来，轻得像雪落：「问哪句是真心的，就问错了。两句加起来，才是。」第二日晨课，弟子们发现名册末行多了个名字，栏位是教习位，全昆仑立派以来第二个。有胆大的弟子问先生：教习是哪一位。她舞完那一套迎雪，收势，朝雪坎边看了一眼——雪坎边立着一个人。她答了两个字，答得极稳，稳得全场都听清了：「名册。」名册上有的，就是有的。剑客认册，也认册上那个名字。';
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 翀玉衡：结账结出「找零」——功业账上从来找不出零 ----
    'qz_event_sulk': {
        id: 'qz_event_sulk', npcId: 'sect_leader_全真教', title: '找零', icon: '🪙',
        desc: '她给你结了一笔「找零」——功业账上，从来没有找得出零的账。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'qz_e_sulk_done',
        ambient: true, repeatEvery: 30, requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '功业房。你来还上回借的经卷，她接过，验了，入册，然后从算盘旁边取过一样东西推给你——一小锭银子，成色极好。「找零。」她说，账房腔又平又快，「上次替我捎药材，脚钱的账结多了三钱。功业账日结日清，多出来的要找回。」你说不必。她把银子又推近半寸，推得极坚决：「账上找得出的，必须找。找不出的——」她顿了顿，指尖在算珠上极轻地碰了一下，「才留在账上。」', type: 'description' },
            { speaker: 'npc', text: '你收了银子要走，她忽然又叫住你，从抽屉里取出一样东西，一并塞过来——一颗算珠。银算盘上的珠子，磨得极亮，分明用了很多年。「这一颗不是账上的。」她说得极快，快得像怕自己反悔，「不入册，不结息，不找回。账房的语里，这一颗叫『私赠』。」她别过脸去拨算盘，啪，啪，拨得极响，「私赠的意思——你拿着它，什么时候想听算盘响了，就回来。回来不算讨账。不算讨账的往来，」她的声音低下去，混在算珠声里，「才是往来。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「珠子收下了。利息我照付——往后隔三差五，回来听响。」', effect: 'point' },
                { text: '「三钱银子一颗旧算珠——全真教的账，利钱就这么薄？」', effect: 'joke' }
            ]}
        ],
        effects: function (npc, choice) {
            var aff = 0, msg = '';
            if (choice === 'point') {
                aff = 5;
                msg = '她拨珠的手停住了。她背对着你坐了两息，忽然翻开功业日记，提笔，当着你起了一行新账——栏目写得端端正正：「听响。」底下记：「是日，立约。约：隔三差五。差几，不计。」写完她把日记转过来给你看，看完合上，账房腔端得极稳，稳里透着一点藏不住的轻快：「『听响』入了正栏。入正栏的账，日结日清——独这一栏不清。」她拨了一颗算珠，啪，「这一栏的规矩我自拟：只记来，不记去。来的日子，笔笔都算进项。」她抬眼看你，眼睛亮亮的，亮里全是算珠的光，「进项的意思，账房的人都懂：进一笔，多一笔。多到哪天满了——」她顿了顿，把小银算盘往你那边推了半寸，「满了也不结。这一栏，我要它永远差一页。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 3);
            } else {
                aff = -2;
                msg = '「薄。」她点点头，把那锭银子拿了回去——拿回去的动作很平，没有赌气，反而打开抽屉，把银子搁进最里层，跟着一匣子旧物摆在一处。你瞥见那匣子里：几枚磨亮的算珠、一截红绳、半块墨——全是不入册的东西。「利钱厚薄，账上有数。」她合上抽屉，账房腔一丝不乱，「私赠的厚薄，账上没有数。没有数的东西，你拿它跟账上的比——」她拨了一颗珠，啪的一声，比平日响，「比错了。」她低头继续结账，不再看你。那夜功业房的灯亮到三更。第二日书记说：先生昨夜结账结得极慢，一页账核了三遍。核到后半夜，她把那匣子不入册的旧物取出来，一样一样摆在案上，摆完对着看了很久，末了一样一样全收回去——独独那颗给了人的算珠的位置，她空着没有补。空着的位置上，她压了一张小笺。笺上账房腔写的，平平整整：「此珠在外。在外，即是未讫。未讫——极好。」';
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 竺照禅：念珠拨得飞快，嘴上「贫尼没有不痛快」 ----
    'shao_event_sulk': {
        id: 'shao_event_sulk', npcId: 'sect_leader_少林寺', title: '贫尼没有不痛快', icon: '📿',
        desc: '她的念珠拨得飞快——你问她怎么了，她说「贫尼没有不痛快，阿弥陀佛」。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'shao_e_sulk_done',
        ambient: true, repeatEvery: 30, requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '少林寺讲经堂，早课散后。她坐在窗边批经，左手念珠拨得飞快，珠子相碰，快得有了风声。批注笔悬在纸上，半天没有落。当值的弟子小声说：今日讲经，师父岔了三句——三句，二十年没有过的事。你问她怎么了。她搁下笔，先合十：「贫尼没有不痛快，阿弥陀佛。」佛号念完，念珠根本没有停。', type: 'description' },
            { speaker: 'npc', text: '「珠拨得快，是腕上有风。」她把念珠往袖里收，收得极深，「经云：心如猿猴。猿猴在经里，不在贫尼身上——贫尼功课清净，戒律齐整，批注锋利如常，一切都好。」她说「一切都好」四个字，一个字一个字咬得极稳，说完把批注经翻到有批注的那几页，偏偏把经案底下那页空白压住了——压得太快，快过了她翻经二十年的任何一回。' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「不痛快就跟佛说——佛那儿说不出口，跟我说。」', effect: 'point' },
                { text: '「念珠是无辜的。拨断一颗，你的批注就得添一条——多毒，我倒要见识。」', effect: 'joke' }
            ]}
        ],
        effects: function (npc, choice) {
            var aff = 0, msg = '';
            if (choice === 'point') {
                aff = 5;
                msg = '她拨珠的手停住了。她端坐了两息，忽然合十——这一回佛号没有念出来，念到一半叫她自己咽了：「跟佛说，贫尼说了二十年，佛没有认过一句。」她把念珠从袖里取出来，搁在经案上，往你这边推了半寸：「今日换个说法的人。要说的很短：讲经岔的三句，头一句是台下坐了人；第二句是台下坐了人，人不看贫尼；第三句——」她盯着那串念珠，毒舌沉到底，「第三句是贫尼想批那页空白，笔落下去之前，你在台下咳了一声。」她抬眼，佛相全线垮掉：「你问怎么了。这就是怎么了。说完了，你负责：从今日起，贫尼讲经，你在台下坐好；贫尼批注，你不许咳。咳一声，罚你听一整场——一整场，句句点你。」';
                if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 3);
            } else {
                aff = -2;
                msg = '「多毒。」她把你的话念了一遍，点点头，竟真把念珠从袖里取出来搁在经案上：「好啊。拨断一颗，贫尼就批一条，头一个批给你看。」珠子照旧没有停，她批她的经，你在旁边站着，走也不是，留也不是。半晌她忽然搁笔，把批注经合上，合十：「阿弥陀佛。今日贫尼修行不到——经讲不得家常，话当不得真。」她起身把经归架，走过你身边时脚步慢了半拍，话落下来，极轻，毒没有了，只剩一点小钩子：「珠没有断。只是贫尼昨夜数过：这些日子，多拨出来的珠子，一千三百颗。多出来的珠子去了哪儿，经上不说——」她走出两步，停了停，「经上不说，你知道。」那一夜讲经堂的灯熄得极晚。第二日弟子说：师父散座后独自把白日岔掉的三句重讲了一遍，讲到第三句，她在法座下面坐到灯尽。';
            }
            return { affection: aff, msg: msg };
        }
    }
};

// ============ 五、被晾提醒（36 桩，道侣账实驱动，一轮不见一回） ============
// v20.34：不需要计数器——「被晾」本身就在账上：bond.lastMetDay 是既有字段。
// 道侣超过三十日没见过你，你回门时 Ta 不闹，只让你看看 Ta 是怎么数的日子。
// 看过即在本轮缺席里销账（bond.neglectFiredDay，写 bond 条目内随档走）；再见一面，
// lastMetDay 翻新，下一轮三十日才重新作数——零新增顶层存档键。
var JEAL_NEGLECT_DAYS = 30;

var JEAL_NEGLECT = {
    'sect_leader_百花谷': {
        narr: '你推开药庐的门，她在擦托盘——托盘上第二只杯擦得发亮，釉面都磨薄了。她抬眼，不抱怨，先问一句：「用过饭了？」',
        speak: '「药是好的，炉是好的。」她给你倒茶，「就是这只杯——我天天擦，擦出一个说法。说法是什么，你知道。」',
        vow: '她手里的活停了停，随即从柜里取出一只新杯，滚水烫过，摆正在托盘上：「好。往后我天天烫——你只管来走。」',
        deflect: '「体谅。」她点头，把杯子收了，搁回最高一层：「我体谅。只是这杯，往后不烫了。落灰——就落着吧。」'
    },
    'sect_leader_修罗宫': {
        narr: '她正翻行踪簿，翻到你名下那页——空着，一个字没有，纸边都被翻毛了。她见你进来，把簿子转过来，推到你面前。',
        speak: '「修罗宫不追人。」她指尖点在那页空白上，「但这一页，账上已经给你起好了名——『失踪人口』。来，销案。当面销。」',
        vow: '她把笔推给你，簿子摊开在你面前：「自己写。从今往后，你写的每一笔，我当面看。」',
        deflect: '「忙。」她把簿子合上，声音不重：「修罗宫的账，『忙』字有它的位置。但『忙』字，销不掉别的字。」'
    },
    'sect_leader_天山派': {
        narr: '雪庐外那条雪路扫得干干净净——一个脚印也没有。她扫到你跟前，停了，扫帚拄在雪里，也不说话。',
        speak: '「天山的雪不认人，路认。」她收回扫帚，「这条路再没人走，我就封了。雪埋掉——就当它从没存在过。」',
        vow: '她把扫帚塞进你手里：「那往后，这条路归你扫。」她自己先往雪路上走了，没回头，「你扫的，我认。」',
        deflect: '「知道了。」她把扫帚收回去，「那我教你认封路。」那日雪庐的门，关得比往常早了半尺。'
    },
    'sect_leader_五仙教': {
        narr: '蛊房里，你名姓签子上那只小蝶蛊在睡觉——不绕了，不点点了。她倚着瓮边看你进来，笑吟吟的，笑比平时薄。',
        speak: '「你知道，蛊放弃一个人的时候，是干什么吗？」她指尖抚了抚心口那团黑纹，「睡觉。我这心口这只，睡了多少天了——它今早才醒。你说，怪谁？」',
        vow: '她捻了一星蜜喂那小蛊：「醒醒，等的回来了。」回头看你，凤目亮起来：「它如今只认你——再把它哄睡，我可不管叫了。」',
        deflect: '「怪谁？」她笑了，笑意不达眼底，「蛊不怪。蛊诚实——你不来，它睡；你来，它醒。比人强。」'
    },
    'sect_leader_铸剑山庄': {
        narr: '炉房的炉火还燃着，灶边那张凳子却是凉的——凳面上落了层炉灰。他看见你，起身，拿手把凳子抹了抹，才说：「坐。」',
        speak: '「火没灭。」他把风箱拉了一下，「留着，总有人来烤。你嘛——」他闷声道，「你也数数，那日子。」',
        vow: '他一拍风箱，火苗窜起半尺：「成！这凳子往后归你，火也归你——你不来的日子，我给你封着火。」',
        deflect: '他闷了一会儿，把火钳塞你手里：「那你封火。火封死了，再点难点。」他顿了顿，「人也一样。」'
    },
    'sect_leader_药王谷': {
        narr: '药庐案上搁着一张方子——日期是许多天前的，字迹还新，药没取。他见你看，把方子收了，叠得整整齐齐：「过期了。作废。」',
        speak: '「药王谷的方子有期限。」他重新给你沏了杯新茶，「人也一样。这盏是新的，趁热喝。下一盏——别让我一个人沏。」',
        vow: '他把新茶推给你，斟到七分：「好。往后我这庐里的方子，给你留一行——不设期限。」他顿了顿，「人也一样。」',
        deflect: '「体谅。」他把方子收进抽屉，落了锁，「不怪你。只是下一张方——你得自己来取了。」'
    },
    'sect_leader_茅山派': {
        narr: '符阁里，他的签筒收着，灯还点着。他见你来，不起卦，只斟茶。当值弟子小声说：师父许多天没替你起卦了——说，卜的人不来，卦不灵。',
        speak: '「茅山规矩，卦不欺人。」他把茶推过来，「我不起卦，起的是等。等的人来了——你自己说，那些日子，你忙什么去了？」',
        vow: '他把签筒取出来，搁在你手边：「那往后，你的卦，你来，我起。」他左眼银光落在你身上，「卦不欺人——你也别欺。」',
        deflect: '「忙。」他把茶收了，「茅山的茶有个规矩——第三遍，就没味了。人也一样。」'
    },
    'sect_leader_金刚宗': {
        narr: '塔前的台阶扫得干干净净——唯独你惯常站的那一级，干净得过分。他在塔里看着你，看了很久，说了一个字。',
        speak: '「阶。」他说，「无人踩，会长草。这一级，贫僧一日一扫。」他垂目，「扫得它，长不出来。」',
        vow: '他把扫帚递给你：「那你扫。」他想了想，又补一句，声音哑的：「贫僧替你看着阶。」',
        deflect: '他合十念了声佛号，才开口：「草长得快。」他没看你，「扫阶的人——心里别长草就行。」'
    },
    'sect_leader_峨眉派': {
        narr: '你回峨眉，戒堂的灯亮着。她在灯下点一摞名签——点到你的那支，停了停，把签搁在一边，没放回签筒。她抬眼看见你，先问一句：「用过早课了？」',
        speak: '「峨眉的卯，一日一点。」她把那支签推到你面前，「你这支，我替你压了许多天。压签犯戒——犯戒的账，你自己看怎么销。」',
        vow: '她把签收进袖袋，不是签筒：「好。往后你的卯，我亲点。」她重新执笔誊戒，「亲点的卯，缺不得。缺一回——罚你陪我一夜巡山。这罚则，峨眉没有过。今日有。」',
        deflect: '「忙。」她点点头，把签放回签筒，放得端端正正，「峨眉不拦忙人。只是签筒里的签，一日不点，落一日灰。」她拨了拨灯芯，「灰厚了，名字就看不清了。」'
    },
    'sect_leader_华山派': {
        narr: '你回华山，账房的灯亮到三更。他在总账后头翻那页私账——页边的空白上，画了许许多小雨点，一天一个。见你进来，他把账合上，先笑：「回来了？吃了没？」',
        speak: '「华山的账，一天一结。」他把账重新摊开，指给你看页边那排雨点，「这是你不在的日子。我记不动账的时候，就画雨点——画着画着，一页就快满了。」他笑，「你看。」',
        vow: '他把笔塞给你：「那往后你画。」他往椅背上一靠，难得地松，「你来一回，划掉一个雨点；划完了，这页咱们记新账。」他望着你笑，这一回笑意没挂着什么，「私账不怕慢。就怕——画雨点的手，比记账的手勤。」',
        deflect: '「忙。」他笑着摆手，把账合上，「华山谁不忙。我也忙——忙着替你记。」他起身去推窗，窗外没雨，「雨点照画，账照结。就是这页私账，往后挪到总账最后一页去——最后一页，没人翻。」'
    },
    'sect_leader_唐门': {
        narr: '你回唐门，毒堂的药炉还燃着，炉上那壶药温了又添水、添了水又温干。她坐在炉边缝手套，见你进来，先把线头咬断，才抬眼：「用过饭了？」',
        speak: '「解药怕回温。」她把手套搁下，「回温三遍，药性就散了。我这壶，这些日子回了——」她算了算，「不止十遍。药性散了，话没散。话就一句：人来，药性才齐。」',
        vow: '她「哼」了一声，起身把那壶回温的旧药泼了，重新坐上一壶清水：「好。往后这炉子，你来——才生火。你不来，」她看了看炉膛，「火我压着，不灭。压到几时，你试试。」',
        deflect: '「忙。」她重新拿起手套，针脚缝得极密，「唐门上下都忙——制毒的忙，制解药的也忙。」她咬断一根线，「只是我这炉子，谁来了才温谁的药。你不来——炉子照旧封着，省炭。」'
    },
    'sect_leader_武当派': {
        narr: '你回武当，山门前的石阶扫得极净——净得像许多年没人走过。他拄着扫帚站在阶尽头，见你来，先把你从末一级到第一级的脚印数了一遍，才抬眼。',
        speak: '「阶扫净了，脚印就留不住。」他说得很慢，「这些日子，我一日扫三遍。」停了停，「扫这么净——不为干净。为数。谁上山的脚印，几步，什么时辰。阶不记，我替它记。」',
        vow: '他把扫帚递给你，帚柄朝你：「那往后，这段阶，你扫。」他自己退开半步，把阶尽头让出来，「你扫，脚印留得住。」他想了想，又补了一句，很慢，「小时候，墙上有人给我留过八个字——先学慢，再学快。我学了半辈子。今日才明白后半句：慢，是为了不错过上山的人。」',
        deflect: '「忙。」他点头，把扫帚收了回去，「满山都忙。」他转身又去扫阶，扫一级，停一级。第二日小道童说，师兄那日把阶扫到天黑——钟，少撞了一杵。'
    },
    'sect_leader_蓬莱派': {
        narr: '你回蓬莱，观汐台的灯亮着。她在理图录——二十年的册子理了满案。见你进来，她把手里那册合上，先问一句：「用过饭了？」',
        speak: '「潮信一日两报，误不得。」她推过来一册新订的空录，翻开，指给你看「岸上人」那一栏——空着，一行都没有。「这些日子你不来，这一栏我没记。空栏不合规矩——我替你想了个说法：岸上人出海了。」她抬眼，「出海的人，几时回？」',
        vow: '她把笔搁在你手边：「那这一栏，你亲笔补。」她往录案边让出半个位子，让得很自然，「补一回，销一空。往后的潮信，黄昏那一笔——」她低头理册子，理得很慢，「等你上岸了再录。」',
        deflect: '「忙。」她点点头，把那册空录收了回去，收进图录匣最里层，「海上的事也都忙——潮忙，风忙。」她重新执笔录潮，「只是潮再忙，亥时必回。这一栏我替你空到几时——潮信知道，我也知道。数目不说谎。」'
    },
    'sect_leader_逍遥派': {
        narr: '你回逍遥，酒仙池边他躺着，琴盖在脸上。听见你的脚步，琴掀开一条缝：「来了？」他坐起来——石桌上摆着一局新棋，黑白都摆好了，对面的盏里，酒还剩一半。',
        speak: '「这局摆了多少天，你猜。」他给对面的盏续了酒，续满，「摆棋的人有个规矩：每日一局，局局摆双份的盏。你那半份，我替你喝了一半——另一半，得你来了喝。」他指指池边的空坛，「你看，坛都空了几只了。」',
        vow: '「好。」他把对面的盏推到你手边，这一回只斟了七分，「往后的盏，你自己斟——斟几分，看你几时来。」他执黑，让你执白，先替你落了一子，落得很慢，「局我每日摆着。你不来，我替你下白子。下得太臭——你来了，记得骂。」',
        deflect: '「忙。」他笑了笑，把对面的盏收了，收得干脆，「天下人都忙，独我闲——闲人的酒，忙人喝不着，不亏。」他重新躺回坛边，琴盖回脸上。第二日弟子说，守藏人昨夜把石桌擦了三遍，棋收了，枰却没收——枰面朝着你惯坐的那个方向。'
    },
    'sect_leader_恒山派': {
        narr: '你回恒山，抄经堂的灯还亮着。她在灯下抄经，木鱼搁在案头——晚课的拍子还没有散。听见你进来，她搁笔，先问一句：「用过饭了？」',
        speak: '「木鱼一日敲一个拍子。」她把木鱼往你面前推了半寸，「这些日子你不来，晚课的拍子，我替你多敲了一遍。敲到今日，少了一声。」她抬眼，温静，「少那一声，不是忘。是留。留的那一声——你来了，你来敲。」',
        vow: '她把木鱼推到你手边：「那你敲。」你敲了一声，声闷，她听着，微微点头：「拍子不对。」话这么说，木鱼却收下了，收得极稳，「从今日起，晚课末一声，我教你。教会了——白云庵的拍子，你算管了一半。」',
        deflect: '「忙。」她点点头，把木鱼收回案头，摆正，「俗务忙，庵里不拦。」她重新执笔抄经，笔锋照旧稳，「只是那少的一声，从今日起我自己补上。补满了，拍子就全了。拍子全了——」灯花爆了一下，她没有抬头，「就没有留着的位置了。这不是怨，是报拍子。报拍子，是白云庵的规矩。」'
    },
    'sect_leader_嵩山派': {
        narr: '你回嵩山，执法堂的灯亮到三更。他在灯下核历年旧案——每年今夜的重核，他一个人核到了今日。见你进来，他搁笔，先问一句：「用过饭了？」',
        speak: '「档不隔年——我自己定的例。」他把册子推到案中央，翻开，指给你看一栏：来档，你的名字，日子一栏空了一行又一行。「这些空格，我没有替你填。空着就是空着，档不撒谎。」他看着你，「今日你来了，你自己填。填完，这一册就结了。不填——」他把册子合上，「它就一直挂在『未结』格里。未结的卷，年年今夜，我都得重核一遍。」',
        vow: '他把笔递过来，笔杆调了个头：「填。」你在日子那一栏写下今日的日期，他俯身核了一遍，核完落了一个批：「可存。」「从今日起，你的档，你写，我核。」他把册子收回去，收得极正，「核，要两个人当面。缺一个人——条文说：待释。待释的卷，」他吹熄了半盏灯，「我不想你这一册是。」',
        deflect: '「忙。」他点点头，把册子合上，合得特别慢，「天下都忙。执法堂的档最忙——一日一页，不等人。」他把册子归架，摆正，「日子那一栏的空格，我替你填了。填的是两个字：『查无』。」他坐回案后，取出另一卷，「『查无』入档，这一册就结了。结了，不隔年，不占格。」灯花爆了一下，他没有抬头，「结案的回执，明日遣人送给你。格式——特别客气。」'
    },
    'sect_leader_泰山派': {
        narr: '你回泰山，玉皇顶的火照旧旺。她在火坛前拨炭——见你上来，火钩没有停，把那块炭拨得特别响，拨得火苗窜起半尺，才抬眼：「来了？吃了没？」',
        speak: '「档上这些日子，你那一栏全是『未』。」她从怀里掏出档册，翻开，推给你——一页一页，字写得端端正正，每个「未」字都特别重。「我不替你圆。未就是未。」她扛起火钩，「临火的人等得起火，等不起档——火误一时，档误一日，日子误下去，就是一本烂账。今日你来了，这页档，你说怎么记？」',
        vow: '她盯着你看了两息，忽然把炭笔塞进你手里：「那你记！自己记——记坏了，罚你抄十遍！」你在那页「未」字底下写了个「来」，她凑近看，看完把档册收回去，吹了吹笔痕，揣进怀里，拍了拍：「好！从今日起，这一栏你记。你记『来』，我核『来』；你敢记『未』——」她咬牙切齿，「我就下十八盘，当面核你！」',
        deflect: '「忙。」她点点头，点得特别快，把档册收回去，合上，「谁都忙。火不忙——寅时到，它就烧；卯时到，它就迎。」她转身拨炭，拨得噼啪响，「从今日起，你那一栏，我不记了。不记，就是泰山的档，火色、风向、炭数，页页都全。」她的火钩往地上一顿，顿得极重，「独你那一栏，空白。空白——比『未』字干净。」'
    },
    'sect_leader_青城派': {
        narr: '你回青城，焙房的灶火还温着。她在架前理茶包——一包一包，封口上「茶末」两个字写得歪歪扭扭。见你进来，她把包放下，先问一句：「吃了没？灶上煨着薯。」',
        speak: '「茶，不等人。」她把一包茶推到案角，包口原封没动，「这些日子你不来，新炒的出了三回锅。三回，我回回分你一包。分到今日——」她的指尖点了点架子第二层，那一层纸包码得整整齐齐，「架满了。茶放旧了就苦。苦茶，你叫我给谁？」',
        vow: '她盯着那一架的茶看了两息，忽然一包一包往下拿，拿了最旧的一包拆开，拈了一撮进碗：「那就今日——从最旧的喝起。」她冲了水，把碗塞进你手里，「青城的规矩：茶放多久，人多久来，晚来的喝苦的。」她蹲下去添柴，火光映着侧脸，声音压低了半调，「可苦完了，新炒出锅——头一包还是你的。这句，罐认，我认。你最好也认。」',
        deflect: '「忙。」她「哦」了一声，转身把那包茶归架，归得整整齐齐，「山外忙，山里也忙。茶不忙——它按时长，按时炒。」她擦着茶夹，一根一根擦，「从今日起，分你的包，不分了。不分，省事——架子空了，心也省了。」她放下夹子，终于抬眼看你，话照旧快，快到末尾有点空，「省了好。看茶的人，心不能满——满了，火就走神。」'
    },
    'sect_leader_衡山派': {
        narr: '你回衡山，琴台的灯亮着。她抱着胡琴坐在台上——没有拉，松香捏在手里，素布解开了。听见你的脚步，她抬眼，看了你一会儿，说：「檐下，凉。」',
        speak: '「灯，这些日子，亮到天明。」她把松香收回袖中，「不是等。夜曲的规矩——灯亮着，曲就得在。」她停了很久，雨落在字与字之间，「曲拉给空檐下听——拉了许多夜。许多夜是多少，蒲团知道，我不知道。我不数。」',
        vow: '她看了你两息，起身，把袖中那块松香又取了出来——素布解开，搁进你手里。「那松香，你收一半。」她坐回去，胡琴归膝，「从今夜起，灯，留到你上台阶的时辰。曲，拉到你坐下的时辰。」弓毛压弦，一声，极低，极稳，「这两句，是规矩。规矩——不改。」',
        deflect: '「忙。」她点点头，把素布一层一层裹好，松香收进袖中，「雨也忙。」她说，「云海忙，雁忙。」她望着雨幕，半晌，又添一句，「灯，从今夜起，早灭。早灭，省油。」当夜的半阙，她拉得特别早——拉到停住的地方，弓收了，灯熄了，人下了台。台角的蒲团她收走了。收得特别齐，齐得像再不会拿出来。'
    },
    'sect_leader_丐帮': {
        narr: '你回丐帮，讯房的灯亮着。他在灯下补那身百衲衣——针脚极密。见你进来，针没有停，缝完那一针才抬头：「来了？粥棚给你温着。」',
        speak: '「案边那个座，这些日子，我擦了三遍。」他放下针，朝案边那个座位点了点——当真擦得干干净净，干净得发空，「讯房的规矩：座，不白擦。擦了，是等人坐。」他拿起茶壶，给你斟了一碗，斟得满，「等到今日，茶换了八遍。第八遍——你来了，正好。」',
        vow: '他看了你一会儿，忽然起身，把案角那只碗拿过来——豁口朝里的那只，摆在案边的座上，摆得极稳。「那碗，归位了。」他坐回去，重新拿起针，又像想起什么，补了一句，声音压低，「从今日起，粥棚的头一碗，两份。一份在这座。座上人坐着——份就不凉。」针穿过布，极轻，「这一句，不是说书。是入册的。」',
        deflect: '「忙。」他点点头，把针收起来，百衲衣叠了一折，「天下都忙。消息最忙——一日一条，不等人。」他把茶碗收走，涮了，倒扣在架上——扣的那只，扣得端端正正，「从今日起，这座，不擦了。不擦，就落灰。灰落厚了——它就是个寻常座。」他吹熄了灯，黑暗里签墙沙沙响了一声，是他的袖子带过去的，「粥棚的书照讲。你那一段——跳过去了。跳的时候满棚笑，我也笑。我笑的时候，」门轻轻开了，「最真。你知道，讯房的笑，三分真，七分应付。」'
    },
    'sect_leader_阎罗殿': {
        narr: '你回阎罗殿，档房的灯还亮着。他在灯下核旧册——千架旧册，他一个人核到了今日。听见你进来，他搁笔，先问一句：「用过饭了？」',
        speak: '「你的档格，这些日子，我挪了三回。」他把那卷档推到案中央——档格的位置，分明从高架挪到了案头。「档规说：复核中的卷，搁近手处。我把它搁到了近手处。」顿了顿，「挪到近手，核了一回来档——日子那一栏，空了一行又一行。空白不撒谎。」他看着你，「今日你来了。这一页，怎么记，你说。」',
        vow: '他看了你两息，把笔递过来，笔杆调了个头：「那你自己记。」你在日子那一栏写下一个「来」字。他俯身核了一遍，核完在下面添了两个小字：「可存」。「从今日起，你的档，你写，我核。」他把档卷归回那格离他手最近的位置，归得极实，「核，要两个人当面。缺一个——规上说，待释。待释的卷……」他吹熄了半盏灯，「我不想你这一卷是。」',
        deflect: '「忙。」他点点头，把档卷合上，合得特别慢，「天下都忙。档房最忙——一日一页，不等人。」他把档卷归回高架，归到挪近手之前的那格远位，摆正，「从今日起，这一卷不复核了。不复核，就是结案。结案，就是——」长久的停顿。他坐回去核另一册，没有抬头，「不再近手。这一条，不是怨，是程序报告。程序，是档房的规矩。」'
    },
    'sect_leader_血手门': {
        narr: '你回血手门，药庐的素灯还亮着。她在灯下缝东西——顶针在灯下一闪一闪，针脚极密。听见你进来，针没有停，缝完那一针才抬眼：「吃了没？灶上有糙米饭。」',
        speak: '「院里的白药，这些日子我一匾一匾翻过来了。」她搁下针线，朝院里的药匾点点头，「翻药等日头，不等人——我等的是人。」她从灯座底下取出那张清单，摊开，「被人骂晚归」那一行的注脚，空着。「这一行的日子，我数了三十几日。数完明白一个道理：骂人的人是我——怎么缺的也是我。」她看着你，语气平，平里有一道极小的缝，「今日你来了。这一行，注脚怎么填，你说。」',
        vow: '她看了你两息，忽然把笔递给你——写方子的手，稳了三年，今日松了半扣。「那你填注脚。」你在那一行旁边写了两个字：在家。她俯身看了很久，看完把清单压回灯座底下，压得平平整整，又把那件没上过身的干净衣裳从枕下取出来，抖开，搭在椅背上。「从今日起，清单过着过。」她坐回去接着缝，针脚穿过布的声音极轻，「集日到了，我穿它；骂人的日子到了——骂得规规矩矩，一句按着一句，全按清单来。」',
        deflect: '「忙。」她点点头，把清单折成三折，收回灯座底下，「门里人都忙——抬人的忙，缝人的忙。」她重新拿起针线，针脚照旧密，「从今日起，这一行的日子，我不数了。不数，注脚就一直空着。空着——不是擦掉。是不等了。」灯花爆了一下，她拿药臼压了压，「清单有清单的记法。有的条目记在纸上，有的记在白药里。白药不说话。可白药年年发新芽——发出来的那茬，比纸上的字活得久。」'
    },
    'sect_leader_飞蝎坞': {
        narr: '你回飞蝎坞，对练场的灯还亮着。她一个人坐在矮桌前擦竹钳——一根一根，擦得发亮。听见你进来，她抬眼，先问一句：「吃了没？灶上有干粮，还热。」',
        speak: '「对面那只碗，这些日子我涮了三十几遍。」她朝矮桌上的空碗努努嘴——那只碗当真擦得发亮，亮得发空。「坞里的规矩：碗不白涮。涮了，是等人喝沙水。」她拎起水囊给你倒了一碗，倒得满，「等到今日，沙水倒了八回。第八回——你来了，正好。」',
        vow: '她看了你两息，忽然把那只空碗啪地搁在矮桌正中，倒上沙水，两只碗都满：「那从今日起，这只碗有主了。」她端起碗跟你一碰，豁口碰豁口，一声脆响，「沙漠里碰了碗，话就算数——你来，我倒；你不来，碗在桌上摆着。摆久了，全坞都看得见。」她一口喝干，抹了把嘴，声音压低半调，「这不是威胁。是坞规——坞规我立的。谁不服，先掰腕子。」',
        deflect: '「忙。」她点点头，把那只碗收回去，涮了，倒扣在架上——扣得端端正正，「天下都忙。风声最忙——一日一阵，不等人。」她重新拿起竹钳擦，一根，又一根，「从今日起，这只碗不涮了。不涮，就落沙。沙落厚了——它就是只寻常碗。」她吹熄了灯，黑暗里蝎房的钳声簌簌响过一阵，是她的袖子带过去的，「对练场照开。掰腕子照旧有对手——对手照旧不是你。是谁，你不必知道。想知道，回来，先把那碗澄了的沙水喝了。」'
    },
    'sect_leader_烈日教': {
        narr: '你回烈日教，小院的灯亮着——火苗剪得极短，只有豆大。她坐在灯下，仪轨册合着。听见你进来，她抬眼，圣女腔先出来：「远客回。」三息之后绷不住，册子一合，头一句问的是：「吃过没？灶上留着一份。」',
        speak: '「风口的那炷香，这些日子，我根根站满了。」她把仪轨册推到案心，声音先平着，慢慢垮下来：「仪轨规定一炷香，我站了一炷半——多的半炷，不入仪轨，是我自己的。」她忽然收了吐槽，语气低下去：「三十几个半炷香，你知道我在等什么吗。我在等一阵从教外吹进来的风。你头一回来教那日，站在客位的柱子底下，风恰好从外头来。」她看着你，「今日你来了。这一条，册上怎么记，你说。」',
        vow: '她看了你两息，忽然起身，把圣女冠从头上摘下来——搁在仪轨册旁边，冠的赤金坠在灯下晃了一晃。「好。从今日起，风口那半炷香，不是我一个人的了。」她的语速很快，字却一个一个稳：「半炷香，你陪我站。站，不入仪轨——不入仪轨的，高台管不着。」她把册子翻开到空白页，提笔，写了一行小字：同巡火。三个字写得特别慢，写完她端详了很久，吐槽没有出来，半晌只漏了半句，极轻：「……八年，我写过最稳的一行字。」',
        deflect: '「忙。」她点点头，圣女腔先出来，特别慢：「尘务为重。教中，不留客。」一句说完，吐槽没有跟上来——她给灯添了油，火苗亮了一分，她盯着那点火苗看了半晌。「从今日起，风口的香，我按仪轨站。一炷，不多半炷。」她把仪轨册合上，归架，摆正，「多出来的半炷，不倒掉——倒掉是妄费，香是教里按数发的。」她吹熄了灯，黑暗里她的声音特别平，平得没有一点吐槽，「三十几个半炷，我交回香库。交的时候，祭司会问缘由。缘由我想好了——圣女夜巡，仪轨归正。归正两个字，你懂么。就是：从今日起，我的每一炷香都有仪轨管着。没有一炷，是我自己的。」'
    },
    'sect_leader_天龙教': {
        narr: '你回天龙教，传声房的灯还亮着。她坐在灯下擦那面半面残铜镜——擦得能照人，又擦。听见你进来，她抬眼：（用黑袍知客的调子）「客回。」传完把镜子一收，干脆垮出来：「吃了没？灶上温着。」',
        speak: '「传令的册子，这些日子我传到了最末一页。」她把册子推到案心——最末一页上，空着一行。「传声房的规矩：一日一令，一页一行。独这一行空着——空着，不是没有令。」她把铜镜牌拿起来翻了个面，又翻回来，「（用云婆婆的调子）『娃儿，婆婆等人，一日算一日。』」传完自己切回来，干脆低了半调：「婆婆的算法，我借了三十几日。一日一日，册子作证。今日你来了。这一行空令，怎么传，你说。」',
        vow: '她看了你两息，忽然把册子推到你面前，笔杆调了个头：「那这一行，你写。」她的干脆特别亮：「传声房的规矩，外人执笔——八年没有先例。今日有第一个。」你在空白那行写下：明日辰时，传我。她俯身看了很久，看完居然用你的调子把它念了一遍：（用你的调子）「明日辰时，传我。」念完她合上册子，耳根红着：「你写的，我传了。传讫，就入规——传声房的令，落地不空。明日辰时起，这一行，我一日传一遍。传的时候——」她顿了顿，声音低了半调，「用我平日那口干脆的调子。那口调子没有几个人肯费心听。从明日起，叫你听腻。」',
        deflect: '「忙。」她点点头，把册子合上，合得特别轻。（用黑袍知客的调子）「尘务为重。教中，不留客。」传完，吐槽没有跟上来——她把铜镜牌收回怀里，穗子系好，系得特别实。「从今日起，册上的空行，我填了。」她提起灯添油，灯罩下她的侧脸特别静，「填什么，我想好了——（用香主的调子）『无令』。」平板腔传完，她搁下灯，声音低到最低：「『无令』两个字，八年的册子上没有过。有了，就是这一页谁也不等了。」她吹熄灯，黑暗里铜镜牌磕在案角，一声，极轻：「传声房传声，不加字——今夜我加半句。加的半句是：嗓子收回来了。收回来的嗓子，不疼了。疼不疼的，从明日起，与你无干。」'
    },
    'sect_leader_神机门': {
        narr: '你回神机门，工坊的灯还亮着。她在校那只机关雀——雀不动，她的手也不动。听见你进来，她没有抬头，先报了一个数：「三十七日。发条没有上过。雀的拍子，慢了三十七拍。」',
        speak: '「机关的发条，三十日一上。不上，游隙就攒下来。」她这才抬头，眼下两团青，「游隙攒多了，我校得回来。可有一种游隙没有齿轮——」她把雀推到你面前，雀腹里多了一个小刻度盘，盘的指针停在某一日，「叫人不来。这个刻度盘，图纸上没有。图纸没教过我怎么做这种东西。我做出来了。」',
        vow: '她盯着你看了两息，忽然把钥匙取出来，当场给雀上弦——三圈半，一圈不多，一圈不少。雀翅滴答，拍子回来了，回来的拍子跟你的呼吸对上了。「钥匙，从今日起归你。」她把钥匙摁进你掌心，按着你的手指合拢，「上弦的人在场，拍子才准。这一条我拟的——工坊的图纸一千卷，管得着齿轮，管不着这一条。」她顿了顿，声音低了半格：「管不着的，我才敢自己定。」',
        deflect: '「忙。」她点点头，把钥匙收回去，自己上弦——三圈半，上得极稳。「机器忙起来不上弦。人忙起来，不数日子。」她转回校准台前，背对着你，手底下的活换了：她在拆那个刻度盘。拆到一半，停了，又装回去。装回去，拿纸把盘面糊住了。第二日工坊里人说：戚师姐昨夜给雀腹里那个刻度盘糊了纸，纸上批了三个极小的字：「勿再看。」糊完纸她把雀搁在离门最近的钉子上，没有挪。钉子上挂了一夜，滴答的拍子一夜没有乱——乱拍子要人在场才乱。人不在，它就准。准得叫人心口发堵。'
    },
    'sect_leader_霹雳堂': {
        narr: '你回霹雳堂，防火棚的灯只有豆大。他在灯下盘引信——盘了满满一捆，全是慢捻的长引。听见你进来，他的手没有停，盘完那一根才抬头：「回来了。吃了没？灶上温着粥。」',
        speak: '「这一捆，全长引。」他把引信举起来给你看，声音极轻，「长引烧得慢。烧得慢，人来得及回来。」他搁下引信，从枕头底下取出一册子，翻开，推到你面前——批注栏一页一页，全是流水账，一日一行，格式一样：「是日，硝干。人未来。」他翻了三十几页，翻到最末一页。最末一页只有四个字：「不记了。」',
        vow: '他盯着「不记了」那一页看了很久，忽然提笔，在底下添了一行批注，一笔一划：「是日，人来。销前条。」添完他把册子合上，抱在怀里，按了按，照例补那一句——这一回补得比平时响，响得你不用俯身就听清了：「……我说了。我真的说了。」他从那一捆引信里挑出最长的一根，系在你腕上，系的是活扣：「这根最慢。你戴着它走——慢引记路。记路，就是记着回来。」',
        deflect: '「忙。」他点点头，把册子合上，收回枕头底下。「硝忙，硫忙，引信也忙。」他把那一捆长引信收起来，一根一根用防火布包好，包得极妥帖。「从今日起，长的不盘了。盘长的，就是等人。」他吹熄了灯。黑暗里他的声音轻得像灰：「改盘短的。短的烧得快。快，就是——不等了。」第二日堂里人说：昨夜三更，训练场上响过一声没有声音的东西——天上一圈光，开了，落了。放光的人在光底下站了一会儿，回来在册子上记了一行。记的什么没人看见，只看见那一行的墨在末尾晕开了——晕开的地方，像有人拿指腹按着纸，按了很久。按纸的手，堂里人都知道，稳了二十年。'
    },
    'sect_leader_天书阁': {
        narr: '你回天书阁，校讎房的灯还亮着。他在灯下理一摞借阅签——签一张一张，全是还书的人留下的。听见你进来，他没有搁签，理完那一张才抬头：「来了。茶温着。」',
        speak: '「这三十几日，我把借阅签重讎了三遍。」他把那摞签推到案中央，「签上最末一行，是你借书的日子。重讎一遍，就是重读一遍。」他另取出一卷书——空白封皮的新卷，卷里夹着一小叠附页，「空卷不该有附页。这一卷有三十几页。一日一页。」他没有翻开，「页上的字，都不超四字。不超四字的讎，我讎了三十几夜。」',
        vow: '他看了你两息，忽然把那卷空白档翻开——附页一日一页，页页四字，排得整整齐齐。你看见：「风从北。」「雪未化。」「灯太明。」最末一页，两个字：「人来。」他把附页理齐，当着你的面钉进了卷里，钉得极慢。「附页不入卷，讎规。」他钉完说，「这一卷起，讎规改一条：四字之限，废了。」他在封皮上落了新批，七个字：「此后批语，不拘字。」',
        deflect: '「忙。」他点点头，把那摞借阅签收回去，一张一张归架，归得极正。「讎字认忙。不认日子。」他坐回案前，取出那卷空白档，把三十几页附页一页一页起下来，归匣。「从今日起，附页销毁。空卷归空。」他吹熄了半盏灯。你转身要走，他在背后添了四个字，轻得像批注：「存疑，不改。」第二日阁里的书记说：先生昨夜销毁附页，销到最末一页，停了。那一页他看了半晌，没有销——夹进了匣底。夹进去之前，他把页角折了一下。折角的页，讎语里有个说法，叫「此条候人」。候到几时，匣知道。'
    },
    'sect_leader_大隐阁': {
        narr: '你回大隐阁，他蹲在台阶上——台阶缝里插着三十几根光竹签，签签吃净，独独最末一根上还剩一颗风干山楂。听见你的脚步，他没有抬头：「灶上有粥。稠的。」',
        speak: '「一日一根签。」他拿光签子指了指台阶缝，「数着签，日子就算得着。算到今日——」他把最末那根拔出来给你看，签头那颗山楂干得更皱了，「山楂还剩一颗，人没回来。签头这颗，卦的魂。魂在，卦不死。」他终于抬头，半仙腔没有端起来，只剩一句实话，「卦不死，人熬得慌。三十几卦，卦卦凶——凶的不是卦。凶的是没人陪我对数。」',
        vow: '他盯着你看了三息，忽然把那根签头的山楂掰成两半，大的那半摁进你手里，小的搁进自己嘴里，嚼得龇牙咧嘴，却笑了。「人回来，卦辞就改。」他把三十几根光签从台阶缝里全拔出来，捆成一把，塞给你，「新卦辞我当场拟：剩一人——大吉。这一条卦书上没有，我娘也没教过。」他拍拍手上的糖渣，站起来，「签你收着。往后吃糖葫芦，最后一颗不吃，种下去。种下去，长出来的——」他想了想，很认真地选了个字，「叫下文。」',
        deflect: '「忙。」他点点头，把递山楂的手收了回去，山楂安回签头，签子插回台阶缝最深处。「人忙，卦也忙。」他起身拍拍衣摆，进阁去了。进阁前他留了一句，半仙腔都没有了：「从今日起不数签了。不数签，日子就算不着。算不着——也好。」第二日阁里人说：先生昨夜蹲在灶前烧东西，烧了半晌，又掏出来，再烧，再掏。烧的是蜡纸，三十几张。最末一张他从火里抢出来了，抢出来包了一样东西收进怀里。包的什么没人看见，只看见他收的时候说了两个字，极轻：「……莫尽。」'
    },
    'sect_leader_侠隐阁': {
        narr: '你回侠隐阁，档廊的灯还亮着。他在灯下巡廊——巡到近手那一格，脚步慢了。听见你进来，他没有回头，巡完那一段才转过身：「来了。廊口的茶温着。」',
        speak: '「你这一卷，重勘了三十一回。」他用批注腔说，又快又平，「重勘要有事由。事由栏，我回回空白。」他从案头取出附页推给你——附页上一栏记着日子，一日一格，三十几格，栏名两个字：「未到。」他顿了顿，「档廊的『未到』栏素来不记——记了，就是催。我不催。」他把附页往你那边又推了半寸，「我只是记。记，不要人答。你看着就行。」',
        vow: '他看了你两息，提笔，在「未到」栏的末尾添了一行：「是日，到。」添完他把整栏圈了——三十一格日子，一笔圈尽。圈完附页不销毁，钉进了正卷。「圈了的栏要销页。」他钉着说，「这一栏留。留的缘故我批了。」你把卷翻过来看，圈尾一行极小的批注腔：「此栏生还。」他合卷，归进近手格，这一回归到了最外面：「从今日起，重勘二人在场。缺一个——不勘。不勘，就搁着。搁在近手，比什么都强。」',
        deflect: '「忙。」他点点头，把附页收回去，归匣。「档廊认忙。独不认日子。」他坐回案后，取出重勘的册子，把你那一卷从「日勘」一栏挪到「不勘」栏——挪得极工整。「不勘栏，就是：卷在，勘停。」他吹熄了半盏灯。你转身要走，黑暗里飘来最后一条录，平得像刻上去的：「另录：重勘册三百年没有空栏。你的栏空了以后，册子头一回有了空处。空处正对着廊门——开门第一眼，就是它。此条，存疑，不究。」'
    },
    'sect_leader_天涯海阁': {
        narr: '你回天涯海阁，驿亭的灯亮着最亮的一档——驿亭的灯分档，最亮一档是给急递文书留的。他在灯下抄站册，听见你进来，搁笔，起身，躬身半度，头一句问的是：「路上用了饭么？亭里有热饼。」',
        speak: '「站册三十日一抄，旧例。」他把站册推过来，「这一回抄得慢——多出了一栏。多的这栏，例上没有。」册上那一栏写着「候客」，栏下一日一行，三十几行，行行两个字：「未来。」他的声音很平，平得像念站名，「『未来』两个字，不是站册语。站册语是『道阻』『改期』。那两句我写不出——写了，就是替你寻了借口。借口寻了，我这三十几日，就真的白等了。」',
        vow: '他盯着那一栏看了很久，忽然提笔，在栏末添了今日的日期，日期后头写两个字：「已到。」写完他把站册合上，双手压了压，像压一道生效的公文。「候客栏，结了。」他公文腔，尾音透颤，「结不是销。结是——这一栏有下文了。下文是你。」他取出那半枚铜符，压在「候客」的栏名上，压得端端正正：「符压栏。从今日起，驿亭的灯为你留档：你来，最亮一档。你不来——」他顿了顿，「也留中亮。中亮，是抄册的灯。册在抄，人就在等。这一条不入公文。这一条，驿亭里只有灯知道。如今，你也知道。」',
        deflect: '「忙。」他点点头，躬身半度，把站册收进案头最里层，收得极正。「驿路认忙。人忙，路也忙。」他坐回灯下接着抄册，笔笔极稳。「从今日起，候客栏裁去。裁去的由头我拟好了：例无此栏，故裁。」他吹熄了最亮一档的灯，换了一盏小的——小灯是深夜抄册用的。你转身要走，他起身相送，躬身半度，标准的驿礼，礼成之后添了一句，公文腔字字端正：「客行千里，一路顺风。」老驿丞后来说：长亭那夜躬完身，很久没有直起来。直起来以后，候客栏并没有裁——他拿一张纸把那栏糊上了。糊栏的纸上写了两个字，也是「未来」。糊上了，字还在纸背面。他说：裁栏要经驿丞，糊栏，只要浆糊。'
    },
    'sect_leader_大旗门': {
        narr: '你回大旗门，校场上晚操刚散。他立在旗杆底下收旗，见你进来，朝你走了两步，站住，话到嘴边改成了最短的一句：「来了。帐里有热粥。」',
        speak: '「你那只护腕，我三十几日没有见。」他从怀里取出一只新护腕——不是你的旧物，是新缝的，针码三十七针，三十七针旁边又多了密密的一排小针。「人不在，针在走。一日一排。缝完数一数，数完拆。」他把护腕翻过来给你看——里侧那排小针拆了又缝、缝了又拆，针眼挨着针眼，密得像一段没有说出口的话。「针眼拆得掉。布记得住。」他合上护腕，军中腔，平里压着东西，「布上被针走过的数目——三十几日，没有人替我数过。」',
        vow: '他盯着你看了两息，忽然把护腕摁进你手里：「戴上。」你戴上，他就着灯圈着你的腕看了一遍，看完点头，开铁皮盒取最长针穿线，当场坐下：「拆掉的那一排，今夜重新走。一针一日。」他在灯下一针一针把那些针眼重新走满，走得比新的还慢。走完咬线，举到灯前验了，才还给你，军中腔，一字一顿：「重缝了。双层。里层是你没来的三十几日，外层是你回来的这一日。两层缝在一处——」他收针，声音低了半格，「拆不出来了。拆，我也不拆了。」',
        deflect: '「忙。」他点点头，把护腕收回去，叠好，收进怀里。「军里认忙。阵认忙，旗也认忙。」他扛起战旗往旗杆走，一步是一步。「从今日起，那排小针不缝了。缝了就要数，数了就要等。军中最忌三样——今日一并收了。」他把旗绑上杆，砸钉，一声一声，砸得极响。晚操散后，守夜的兵看见都尉一个人坐在灯下开针线盒，把针码一排一排查过去，查完归位。归到最末一排，他停了停，往那一排里添了一根新针——顶细的一根。兵的规矩：细针缝里衣。都尉的里衣，从来是自己粗针大线缝的。'
    },
    'sect_leader_铁掌帮': {
        narr: '你回铁掌帮，苇滩的晚风正紧。她坐在滩头，背对着风口，怀里插着一排哨——全是素坯。听见你回来，她没有转身，先说了三个字：「灶上汤。」顿了顿，又补了两个字：「热的。」',
        speak: '「三十几日。」她这才转过身，掌心摊着一把素坯哨，「日子是拿哨数的。一日起一支坯——起了试音，音不对，捏碎。」她摊开另一只手，掌心里一把碎坯，碎口都叫汗手磨圆了。「音不对，你道哪儿不对？」她拈起一支，吹了一声——两声低回，吹完自己听，听完把哨攥紧，「缺了应。哨是半句话，应是另半句。半句话吹了三十几日——」她凶脸垮了半截，声音哑下去，「苇子都叫我吹哑了。」',
        vow: '她盯着你看了三息，忽然把哨举到唇边，当场吹了一声——一长一短，「你来了」。吹完她瞪你，瞪得极凶：「应！」你应了。她整个人松下来，把那把素坯全塞进你怀里，塞得你抱不住：「都归你！三十几日起的，一支没扔——全在等下半句。」她挑出磨得最亮的那支，收进自己怀里，贴好，拍了拍：「这支归我。这支只吹一条：你来了。从今日起别的条你吹，我应。你在哪儿吹——」她下巴一抬，凶腔回来了，嗓门拔得极高，高得苇滩上的宿鸟全飞了，「我都听得见！」',
        deflect: '「忙。」她点点头，把那把哨一支一支收回怀里。「苇子也忙。秋天忙黄，冬天忙枯。」她转过身去，重新背对风口坐下。「从今日起，哨语收了。收了，就吹给风。风不应——不应就不欠谁的。」那一夜苇滩没有哨声。第二夜也没有。第三夜师妹去看她，回来说：堂主在滩头坐到三更，一声没有吹。三更前她把磨得最亮的那支哨拿出来，举到唇边——到底没有吹，攥回去了。攥了一夜。第二日天亮，师妹看见堂主摊开手心，对着那支哨说了一句话，极轻：「……别哑。人不来了，你也不能哑。哑了，等人回来那天——拿什么吹给那个人听。」'
    },
    'sect_leader_昆仑派': {
        narr: '你回昆仑派，晨课未起，雪坎扫得干干净净——独独第三株松底下那条道，雪埋了，埋了三十几日，一层压一层。她立在练场边上缠素绸舞袖带，见你来，只说了一句：「来了。雪深，走扫过的这边。」',
        speak: '「晨课一日未歇。」她说得像报舞的名目，「十二套，套套精准。独独一样改了——舞，改朝练场了。从前朝雪坎。」她缠好袖带，看了一眼松底下那条埋了的道，「道我停了扫。扫了，怕人误会——误会我还在等。等了三十几日，误会不误会的，雪都知道。」她收回目光，看你，眼神平得没有一丝雪光，「昆仑的剑认看见的：那条道上，三十几日，没有一个脚印。脚印没有，剑意就堵。堵着舞出来的十二套——精准，可是空。」',
        vow: '她看了你两息，忽然把练场边的竹帚拿起来——塞进你手里。她自己取了第二把：「那你扫。」两个人从练场边一直扫到松底下，她扫得极慢，慢得像在舞。扫完她把帚立在松边，转过身，语气头一回有了缝：「道不扫，不是不等。是等这件事，剑客不肯叫手做——手一空下来，就去扫道。扫了道，就等于认了。」她解下腕上素绸带，重新绑，绑得比从前松了一扣：「从今日起，晨课朝雪坎。坎上有道，道上有人。剑意朝着人舞出来的那一式——」她耳根在雪光里红着，声音极轻，「十年前我娘看我爹时，就是这么舞的。明日还给你看。」',
        deflect: '「忙。」她点点头，把袖带缠完，又缠紧了一圈。「雪也忙。落了就埋道。」她提剑走到练场中央，起势——舞的是迎雪，一式一式，精准得像没有人看。「从今日起，晨课照旧朝山门。松下的道，不等雪化了。也不扫了。」她舞完收剑，从你身边走过，脚步没有停，只在走过第三步的时候，落回来一句，轻得像雪落：「埋了也好。埋了，就不用天天去看有没有脚印。看脚印这件事——」她的背影直得像剑，剑却微微沉了半分，「比舞十二套，累。」'
    },
    'sect_leader_全真教': {
        narr: '你回全真教，功业房的灯还亮着。她在灯下结账，算珠拨得极慢——不像结账，像在数什么。听见你进来，她没有抬头，把那一珠推到底，才抬眼：「回来了。灶上茶温着。先吃茶，再对账。」',
        speak: '「功业账日结。这三十几日，独有一笔结不动。」她把日记推过来——那一页栏名「人在」，栏下一日一行，三十几行，格式一样：「借：一日。」她的账房腔又平又快，快里有一道按不住的缝：「借，是丢了一日。丢了的日子要有进项抵——这一栏进项，空了三十几日。进项怎么补，账书上有法子。」她收回日记，拨了一颗珠，拨得极轻，「法子我不敢翻。翻了就要认：法子在册上，人不在册上。」',
        vow: '她盯着你看了三息，忽然翻开日记到那一页，把笔递过来——笔杆调了个头：「补。」你在进项栏写下今日的日期，日期旁添两个字：人在。她俯身核，核完把那颗停了三十几日的珠啪的一声推到底——脆得功业房的灯都跳了一下。「讫了。」她合上日记，收进怀里，「从今日起这一栏改规：借方我记，贷方你填。你填什么，我认什么。」她把小银算盘取出来，压在你手边的案角上：「算盘是账的胆。胆搁你这儿。这一条不入日记——」她按了按自己的心口，按得极轻，「入这里。这里头的账，不结，不讫，不清。」',
        deflect: '「忙。」她点点头，合上日记，归进案头最里层。「天下都忙。功业账最忙——一日一页，不等人。」她继续结账，算珠拨得极整齐。「从今日起，『人在』栏销。销栏，就是：借方不记，贷方不等，账目自行两平。」她吹熄了半盏灯。你转身要走，黑暗里算珠响了一声，只一声，极轻。第二日功业房的人说：先生昨夜结账结到天亮。结完，她把小银算盘上那颗珠拨回了中间——推到底是讫，拨回是销，停在中间，账语里没有名目。没有名目的珠，她看了半晌，在日记末页写了一行。写完没有核——她记账三十年，头一回不核。不核的那一行，墨迹透到了纸背。纸背上认得出两个字：「存疑。」'
    },
    'sect_leader_少林寺': {
        narr: '你回少林寺，栴檀林边的道上落了一层叶。她在讲经堂门口站着，手里捧着批注经——翻开的那页是空白，分明刚刚才翻开过，听见你的脚步，又合上了。合得不急，合得很稳。她合十，佛号先出来了：「阿弥陀佛。施主回来了。灶上的粥还温。」',
        speak: '「功课一日没有荒废，经一场没有讲岔。」她引你进殿，把批注经搁在经案上，手却没有从念珠上拿开，「独独一桩，三十几日办不成。桩头在那一页——空白了三十几日。贫尼每日翻开看一遍，看完合上。骂遍天下人的毒舌，关于你最锋利的那一句，落不下去——落下去就作真，作了真，贫尼二十年的毒就白毒了。」她终于抬眼，佛相端然，话里有钩：「白毒不白毒，你回来验。」',
        vow: '她盯着你看了三息，忽然把批注经翻开到那一页，把笔搁在你手里——笔杆调了个头：「那你批。批什么，贫尼都认它是『最锋利句』。」你落笔，她在旁边看着，看你写完，念了一遍，合十，这一声佛号念得发颤：「阿弥陀佛——原来你出口的字，比贫尼的笔毒。」她把经收进怀里，收得极深：「从今日起这一页立了格式：你写经文，贫尼缀批注。你的字是正文，贫尼的批，是一辈子贴着正文的批。」她把念珠绕回腕上，绕了两圈，按实：「珠拨了三十几日，拨的就是今日这一颗。」',
        deflect: '「忙。」她点点头，把笔收回去，批注经合上，归架，归到最高一层。「天下都忙。经云：诸行无常——无常不是托词，是正法。贫尼懂法。」她继续理经案，念珠拨得极匀，匀得像量过。「从今日起，那一页空着。空着好。空着，不关任何人。」你转身要走，殿里的念珠响了一声，只一声，极轻。第二日当值的弟子说：昨夜师父把批注经从架顶取下来，抱着坐到三更。那页空白她看了一夜，天亮时在页上批了两个小字，批完又划了。两个字是什么，没人看清；看清的只有划字那一笔——力透纸背，透得那页纸，从此再也写不了字了。'
    }
};

function _jealNeglectDue(bondId) {
    var cd = (typeof window !== 'undefined') ? window.currentCharData : null;
    var bonds = (cd && cd.bonds) || {};
    var bond = bonds[bondId];
    if (!bond || bond.type !== 'dao_companion') return null;
    if (!(bond.lastMetDay > 0)) return null;
    var today = 1;
    try {
        if (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') {
            today = Number(window.timeSystem.getAbsoluteDay()) || 1;
        }
    } catch (e) {}
    var gap = today - bond.lastMetDay;
    if (gap < JEAL_NEGLECT_DAYS) return null;
    // 本轮缺席已提醒过（旗在 bond 条目内随档走）；再见一面 lastMetDay 翻新，才重新作数
    if (bond.neglectFiredDay >= bond.lastMetDay) return null;
    return { gap: gap, bond: bond };
}

function _mkNeglectEvent(prefix, npcId, icon, title) {
    var t = JEAL_NEGLECT[npcId] || JEAL_NEGLECT['sect_leader_百花谷'];
    return {
        id: prefix + '_event_neglect', npcId: npcId, title: title, icon: icon,
        desc: '你太久没来了。有些账，是自己会数日子的。',
        minAffection: 30, trigger: { random: 1.0 }, cooldown: 0, flag: prefix + '_e_neglect_done',
        requireDaoCompanion: true,
        ambient: true, repeatEvery: JEAL_NEGLECT_DAYS, // 实际重入由 lastMetDay 账控制
        scenes: [
            { speaker: 'narrator', text: t.narr, type: 'description' },
            { speaker: 'npc', text: t.speak },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「往后的日子，我常来。」', effect: 'vow' },
                { text: '「近来实在忙……你体谅。」', effect: 'deflect' }
            ]}
        ],
        effects: function (npc, choice) {
            var aff, msg;
            if (choice === 'vow') {
                aff = 5; msg = t.vow;
                if (npc.relationship) npc.relationship.trust = Math.min(100, (Number(npc.relationship.trust) || 0) + 3);
            } else {
                aff = -3; msg = t.deflect;
                if (npc.relationship) npc.relationship.trust = Math.max(-100, (Number(npc.relationship.trust) || 0) - 2);
            }
            return { affection: aff, msg: msg };
        }
    };
}

var JEALOUSY_NEGLECT_EVENTS = {
    bh_event_neglect: _mkNeglectEvent('bh', 'sect_leader_百花谷', '🍵', '擦亮的空杯'),
    xl_event_neglect: _mkNeglectEvent('xl', 'sect_leader_修罗宫', '📕', '失踪人口'),
    ts_event_neglect: _mkNeglectEvent('ts', 'sect_leader_天山派', '❄️', '没人走的路'),
    wx_event_neglect: _mkNeglectEvent('wx', 'sect_leader_五仙教', '🦋', '睡着的蛊'),
    lu_event_neglect: _mkNeglectEvent('lu', 'sect_leader_铸剑山庄', '🔥', '凉了的凳'),
    su_event_neglect: _mkNeglectEvent('su', 'sect_leader_药王谷', '🌿', '过期的方'),
    ms_event_neglect: _mkNeglectEvent('ms', 'sect_leader_茅山派', '🕯️', '收起的签'),
    jg_event_neglect: _mkNeglectEvent('jg', 'sect_leader_金刚宗', '🪵', '长草的阶'),
    em_event_neglect: _mkNeglectEvent('em', 'sect_leader_峨眉派', '🪷', '压了多日的签'),
    hs_event_neglect: _mkNeglectEvent('hs', 'sect_leader_华山派', '🌧️', '页边的雨点'),
    tm_event_neglect: _mkNeglectEvent('tm', 'sect_leader_唐门', '🍶', '回温的药'),
    wd_event_neglect: _mkNeglectEvent('wd', 'sect_leader_武当派', '👣', '扫三遍的阶'),
    pl_event_neglect: _mkNeglectEvent('pl', 'sect_leader_蓬莱派', '🌊', '空着的栏'),
    xy_event_neglect: _mkNeglectEvent('xy', 'sect_leader_逍遥派', '♟️', '摆好的局'),
    heng_event_neglect: _mkNeglectEvent('heng', 'sect_leader_恒山派', '📿', '留着的一声'),
    song_event_neglect: _mkNeglectEvent('song', 'sect_leader_嵩山派', '📜', '空白的日子栏'),
    tai_event_neglect: _mkNeglectEvent('tai', 'sect_leader_泰山派', '🔥', '满页的未字'),
    qing_event_neglect: _mkNeglectEvent('qing', 'sect_leader_青城派', '🍵', '架满的茶末'),
    xiang_event_neglect: _mkNeglectEvent('xiang', 'sect_leader_衡山派', '🎻', '拉到空檐下'),
    gai_event_neglect: _mkNeglectEvent('gai', 'sect_leader_丐帮', '🧵', '擦了三遍的座'),
    yan_event_neglect: _mkNeglectEvent('yan', 'sect_leader_阎罗殿', '🏷️', '挪回来的档'),
    xue_event_neglect: _mkNeglectEvent('xue', 'sect_leader_血手门', '🍚', '空着的注脚'),
    xie_event_neglect: _mkNeglectEvent('xie', 'sect_leader_飞蝎坞', '🥢', '擦得发亮'),
    lie_event_neglect: _mkNeglectEvent('lie', 'sect_leader_烈日教', '🌅', '多出的半炷香'),
    long_event_neglect: _mkNeglectEvent('long', 'sect_leader_天龙教', '🎐', '挂起的令'),
    sj_event_neglect: _mkNeglectEvent('sj', 'sect_leader_神机门', '⏰', '数日子的雀'),
    pi_event_neglect: _mkNeglectEvent('pi', 'sect_leader_霹雳堂', '🎆', '不记了的一页'),
    shu_event_neglect: _mkNeglectEvent('shu', 'sect_leader_天书阁', '🔖', '折角的附页'),
    dy_event_neglect: _mkNeglectEvent('dy', 'sect_leader_大隐阁', '🎋', '台阶缝的签'),
    yin_event_neglect: _mkNeglectEvent('yin', 'sect_leader_侠隐阁', '📇', '未到的栏'),
    ty_event_neglect: _mkNeglectEvent('ty', 'sect_leader_天涯海阁', '✉️', '候客的栏'),
    dq_event_neglect: _mkNeglectEvent('dq', 'sect_leader_大旗门', '🚩', '拆了又缝的针'),
    tz_event_neglect: _mkNeglectEvent('tz', 'sect_leader_铁掌帮', '🌾', '缺了应的哨'),
    kl_event_neglect: _mkNeglectEvent('kl', 'sect_leader_昆仑派', '🧹', '雪埋的道'),
    qz_event_neglect: _mkNeglectEvent('qz', 'sect_leader_全真教', '🪶', '结不动的账'),
    shao_event_neglect: _mkNeglectEvent('shao', 'sect_leader_少林寺', '🍂', '批不下去的那页')
};

// ============ 合并进总事件池 ============
if (typeof NPC_PERSONAL_EVENTS !== 'undefined') {
    Object.assign(NPC_PERSONAL_EVENTS, JEALOUSY_PROBE_EVENTS);
    Object.assign(NPC_PERSONAL_EVENTS, JEALOUSY_COLD_EVENTS);
    Object.assign(NPC_PERSONAL_EVENTS, JEALOUSY_AFTERMATH_EVENTS);
    Object.assign(NPC_PERSONAL_EVENTS, JEALOUSY_SULK_EVENTS);
    Object.assign(NPC_PERSONAL_EVENTS, JEALOUSY_NEGLECT_EVENTS);
}

// ============ 门禁扩展：requireFestivalWound ============
// 包装 canPlayerAccessPersonalEvent（本文件在其之后加载；全局函数声明可重新赋值，
// 其余脚本内的裸调用随之生效，与 male-lead-rivalry 覆写 detectRivalRomance 同一手法）。
(function () {
    if (typeof canPlayerAccessPersonalEvent !== 'function') return;
    var _origAccess = canPlayerAccessPersonalEvent;
    canPlayerAccessPersonalEvent = function (eventDef, npc) {
        if (!_origAccess(eventDef, npc)) return false;
        if (eventDef.requireFestivalWound && !_jealFindWound(eventDef.npcId)) return false;
        return true;
    };
})();

// ============ 账本读取（festival-bridge 的既有账格，零新增存档键） ============
function _jealFindWound(npcId) {
    var cd = (typeof window !== 'undefined') ? window.currentCharData : null;
    var bonds = (cd && cd.bonds) || {};
    var bond = bonds[npcId];
    if (!bond || bond.type !== 'dao_companion') return null;
    var fes = bond.festival;
    if (!fes) return null;
    var today = 1;
    try {
        if (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') {
            today = Number(window.timeSystem.getAbsoluteDay()) || 1;
        }
    } catch (e) {}
    for (var fkey in fes) {
        var ent = fes[fkey];
        if (!ent) continue;
        if (ent.status !== 'declined' && ent.status !== 'stood') continue;
        if (ent.aftermathFired) continue;
        if (!(ent.dueDay > 0)) continue;
        var gap = today - ent.dueDay;
        if (gap < 1 || gap > 12) continue;
        // 有实证：同一 fkey，别的道侣账格是 spent——那夜确实陪了 Ta
        var spentName = null;
        for (var oid in bonds) {
            if (oid === npcId) continue;
            var ob = bonds[oid];
            if (!ob || ob.type !== 'dao_companion' || !ob.festival) continue;
            var oe = ob.festival[fkey];
            if (oe && oe.status === 'spent') {
                var onpc = (window.npcManager && window.npcManager.getNPC) ? window.npcManager.getNPC(oid) : null;
                spentName = (onpc && onpc.name) || ob.name || null;
                break;
            }
        }
        return { fkey: fkey, ent: ent, spentName: spentName };
    }
    return null;
}

// ============ 节日余波·飞鸽补账（窗口过期、人没回门——账不销，追到纸上） ============
// 余波原门是「节后十二日内人恰在 Ta 门中」；玩家若一直不回，伤就静默过期——躲账比欠账更伤叙事。
// 故窗口一过（gap>12），每日钩子替 Ta 寄一封飞鸽信销这一回合：旗同样落在既有账格内（letterSent），
// 来年此节再账一回合。情敌名字沿用铁律——账上有 spent 实证才点。
var JEAL_LETTER = {
    'sect_leader_百花谷': {
        declined: '节过了。帖上那个「事由」，我读了三遍——没有一个字是真的，也没有一个字是假的。我不问。药庐的门给你留着，想起来就推。只是茶容易凉，往后，你快些。',
        stood: '那夜我把灯拨亮了些，等你等到灯油尽了。不怪你——我只怕你是真遇上了事，没人帮。读信时若平安，就够了。'
    },
    'sect_leader_修罗宫': {
        declined: '推帖那笔，账上记了。修罗宫的账，不设时限。今日不讨——只寄信告诉你：我记着。几时讨、讨不讨，看你回来时的表现。',
        stood: '我等了一整日，暗哨劝了我三回。你没来，也没递一个字。这笔我用铁钉钉进账里了——拔不掉。不必回信，回来当面销。修罗宫不追人，修罗宫记账。'
    },
    'sect_leader_天山派': {
        declined: '帖你推了，由我不问。剑客重信——你说了由，我认这个由。只是雪庐的剑，记着那夜。下次推门之前，先问你的心：是哪把剑引你来的。',
        stood: '那夜我在观星台摆了两盏茶，等你等到雪埋了阶。茶没喝，浇了剑。剑没恼——它只鸣了一声。那声什么意思，你自己懂。'
    },
    'sect_leader_五仙教': {
        declined: '哟，推帖啦？心蛊绕着你的签子转了两天才肯散。酒我给你留着——酒放得住，人放不住。下回来讨喜酒，记得带句实话当礼。',
        stood: '帖子你没回，那夜你也没来。蛊替我记着呢——不查你，就留一句：我这条命押在蛊上，蛊没回音，我就得给自己讨个说法。回来，把说法给我。'
    },
    'sect_leader_铸剑山庄': {
        declined: '推帖的话，我让学徒查了字典——「改日」「有事」。炉子好哄，我不好哄。不讨你补节，就讨你一个日子。白纸黑字，我等。',
        stood: '守你到落闸，那席我自己吃的。饭凉了热过一回，吃完。写信不为讨账——为你回来时，给我句实话：是不是我这炉火，熏着你眼睛了。'
    },
    'sect_leader_药王谷': {
        declined: '你的回帖我留着，纸都抚平了，留个凭据。代领的礼我替你垫了，挂我账上——钱是小事。只记一句：往后你忙，我这儿挂不上账了；挂不上账，就是你不来了。珍重。',
        stood: '那夜我等了一晚上，中途还替药圃收了回苗，怕人看出我在等。医者知道：有些话跟病一样，说出来好得快。这封是我说的——你那份，回来慢慢说。'
    },
    'sect_leader_茅山派': {
        declined: '昨夜又起了一卦，问你来不来。卦说：会。那夜你的事由，我不卜——茅山的耳朵听过太多谎。你自己来报。灯留着。',
        stood: '卜了一辈子，那夜头一回盼卦不准。灯到三更，我反而盼你不来——你当真没来。卦簿我誊一页副本留着。誊给谁、留多久——你回来，拿话换。'
    },
    'sect_leader_金刚宗': {
        declined: '帖子看了。五遍。五遍不是不信——是盼着哪一遍，字能变一变。塔里安静，安静地方说的话算数。回来，说。',
        stood: '那日老僧守着塔门。有人进塔，抬头，不是施主；又进一人，又不是。只问一句：施主那一夜，身不由己，还是心不由己。此题难，可以回去想。老僧等。'
    },
    'sect_leader_峨眉派': {
        declined: '帖子你推了。事由我看了——戒律不问真假，只数数目。你的名签我替你压着，压一日，犯一日的戒。不催你。峨眉雪大，路滑，回来时走正道。',
        stood: '那夜金顶落雪，我巡夜多巡了一更。不为查你——为我自己。你不来，我不怪。只留一句：戒堂的灯给你留到三更，三更后我收。收了，你回来就自己点。'
    },
    'sect_leader_华山派': {
        declined: '帖子推了，账上记了笔「事忙」。我不催——华山的账，催出来的都是坏账。只一句：雨夜的凳子我照旧摆着。摆到哪天不摆了，我自己知道，你也知道。',
        stood: '那夜剑堂的雨，我一个人听完了。听到后半夜，把两只凳摞了回去——摞的时候我在想，是不是我凳子摆早了。回来喝盏茶，把这句给我个下落。'
    },
    'sect_leader_唐门': {
        declined: '帖子你推了，事由我让晚辈抄下来收着。字写得好，挑不出错——唐门写毒谱也是这个写法。我不催你。只记一笔：我案上的茶，你不来喝就凉；凉了，我就倒。倒了几回，我心里有数。',
        stood: '那夜我在炉边温了一壶药，温干了添水，添水又温干。不是等你——是药性不许等。信到你手上时，你若是平安的，就够了。回来先喝盏茶，我的针，还替你验。'
    },
    'sect_leader_武当派': {
        declined: '回帖读了三遍。第三遍，把「改日」两个字读出来了。武当不催人。白石那副数目，我拿出来数了一回——没数满，又收回去。你几时上山，提前说一声。钟，留头一杵重的给你。',
        stood: '那夜我在殿里坐着，门开了三回，回回抬头。第三回进来的是月亮。我把月亮当成了人——这个错，我记着。你回来销它。赶在钟停之前。'
    },
    'sect_leader_蓬莱派': {
        declined: '帖子你推了。事由十六个字，我照抄了一遍，收进图录匣。观汐台不问事由——只记日子。你推帖的那一日，「岸上人」那一栏，我照旧空着。空到几时，看潮，也看你。回来时，报个时辰。',
        stood: '那夜我在台上守到潮平。亥时的潮回了两回——头一回抬头，是巡夜的师弟；第二回，是风。风我也记了，记完觉得不对，撕了。二十年，头一回撕录。你回来，把那一行补上：补的不是潮，是人。'
    },
    'sect_leader_逍遥派': {
        declined: '帖子你推了，事由文雅，我品了三日。逍遥派不催人——只是酒仙池新开了坛，头一盏没人对饮，我敬了月亮。月亮不推帖。你几时回来，坛几时再开。封泥我给你留着，泥上无名，等你来题。',
        stood: '那夜石桌边我坐到四更，残局从匣里请了出来，自己跟自己下。白子那一面赢了——赢在它缺一枚，我补不得。你回来，把你手里那枚带来。局差最后一手，酒差最后一盏，都在你那儿。'
    },
    'sect_leader_恒山派': {
        declined: '节过了。你回帖的事由，我抄了一遍——抄得极稳，一个字没有乱。白云庵不问事由真假，晚课的木鱼只认拍子：那一夜，它少敲了一声。少的一声不是怨，是留。留到几时，庵门不落闩。你回来，报个时辰，我替你敲回来——敲回来，拍子就全了。经上说，拍子全了，叫安心。',
        stood: '那夜庵门没有落闩。晚课前我跟知客说：有人叩门，不问名姓，先引到避风处。后来叩门的是风——风我引了进来，坐了半夜。不怪你。木鱼只认拍子，不认脚步。你回来时，晚课还没有散。灯，给你留到酉时。'
    },
    'sect_leader_嵩山派': {
        declined: '节过了。回帖已归档，归档编号我核过：来路明，口气稳，日子——空白。三条腿缺一，按条该驳回。我没有驳，存进了「待释」格。待释的档不隔年：年内你自己来释。释了，此卷结案；结案的抄本我留了一份给你，抄本的条名拟好了——「例外」。',
        stood: '那夜执法堂的灯亮到五更。不是等你——历年重核，节令之夜的老规矩。重核到三更，我多核了一目：山门夜册，入山一栏，空白。空白我盯了一夜，盯完添了条小注：「此夜，档有缺目。」缺的是什么，我没有写。你回来，自己报——报实了，我补档；报不实，我帮你核。执法堂的话算数：帮你核，只此一次。'
    },
    'sect_leader_泰山派': {
        declined: '节过了。你的回帖，师弟念给我听——词好，挑不出错。挑不出错，最气人。那夜的档我记了：晴，灯，多，火色平。「平」字写得极重——重到你回来一眼就看得见。别替我写「事由」。泰山的人只认日子：你哪日上顶，哪一日我把「平」改成「旺」。炭笔就搁在火坛边，你自己改。改坏了，罚你抄十遍。',
        stood: '那夜我摆了两盏茶。一盏喝了，一盏放到凉——凉茶没有倒，端下山浇了山门口的老松。别问为什么浇老松，问就是你矫情。你回来，茶重新沏，碗重新摆。只记着一句：临火人的茶，第二遍比第一遍苦。苦了你还要喝——这茶，我就沏一辈子。'
    },
    'sect_leader_青城派': {
        declined: '节过了。回帖上「有事」两个字，我读了三遍——工整得挑不出一分真，这样的字，最亏。那夜我多炒了一锅，过火了。过火的我自己封了，封得特别紧，别问味道。你回来，新炒的正出锅——头一包给你，包口我封，字你写。写什么你想；想不出好的，就写「回」字。「回」字，茶认。',
        stood: '那夜我摆了两只碗，等到灶火自己熄了。火熄的时候我想，好，省柴。想着想着，又把火生回来了，重新沏了一碗——自己喝了。不许笑。看茶的人平常不喝别人的茶，那一碗，特别苦。你回来，我重新沏。这一回，你看着我沏，我看着你喝。喝到我当面问出一句「好」为止——问不出「好」，就再沏。'
    },
    'sect_leader_衡山派': {
        declined: '节过了。帖子，收了。事由——没问。那夜半阙照拉，停的地方照停，只是气口比平日长。长多少，没有数——数的时候，弓会乱。你回来，报一个时辰。时辰我写在谱尾。谱尾的字，极少。一个，就够。够了，就是够了。',
        stood: '那夜灯亮到天明。弓拉了三遍半阙——第三遍，错了一音。十年，头一回错。错了以后我坐到天亮，想明白一件事：音不是弓错的，是檐下空了，曲子听出来的。你回来，曲重新拉。这一遍的音——你替我听稳不稳。稳了，事情就过去了；不稳，再拉。曲不怕重拉，怕檐下空。'
    },
    'sect_leader_丐帮': {
        declined: '节过了。回帖三日前到讯房——三条腿核完，归档了。归档的抄本上没有条名，只有一行小注：「此段，且听下回。」且听下回，是粥棚的话。讯房的且听下回，从不落空：我说下回，就有下回。你回来，报一个日子。日子我刻在签上——刻了的日子，不坏。',
        stood: '那夜粥棚给你留了一只碗。老师傅问了三遍收不收，我说不收——消息三条腿，你那条腿没到，碗就不能收。天亮我自己收的碗，凉粥喝了。喝的时候想一件事：这一段书讲出去，满棚笑；不讲，只有我自己知道。你回来，来粥棚。头一碗粥，两份。这个规矩今日立的——立给你。'
    },
    'sect_leader_阎罗殿': {
        declined: '节过了。回帖归档，签号我核过：来路明，日子是节夜，事由一栏——两个字。三样齐整，判语栏我空着。档房的判语栏不空过夜，独你这一卷，空了十二日。今日起不空了，我添了个小注：未定。未定，不是判语，是等。你回来，自己释——释了，此卷结案。结案的副本我裱好了，套名也想好了：近手。',
        stood: '那夜档房的灯亮到五更。不是等你——岁末重核，节令之夜的老规矩。重核到三更，我多核了一目：来档的册子，你那一栏，空白。空白我盯了很久，盯完添了条小注：此夜，册有缺目。缺的是什么，我没有写。不写，不是不知——档规说，缺目等人报。你回来，报。报实了，我补册；报不实，我替你核。记档人的话算数：替你核，只此一回。'
    },
    'sect_leader_血手门': {
        declined: '节过了。回帖我收了，事由那一行读了三遍——很工整，比我抄的方子还工整。工整的事由不管用，跟抄来的方子不管用，是一个道理。那夜我翻了三次白药，翻到第三次才明白：我等的不是药干。你回来，替我煎一碗姜枣葱白——方子在灯座底下，姜三片，枣五枚，葱白两段。煎好了我教你看火候。会看火候的人，才陪我过得了普通日子。',
        stood: '那夜我给素灯多添了一回油，火苗比平时亮——怕门口的路黑。火亮了一夜，没有人来。天亮我回想了一遍：不是灯不够亮，是路不通这儿。不怪你。我只把那一夜留了一样东西：清单上「被人骂晚归」那一行，添了个小注——人不回，不骂，留着灯。你回来，看灯。灯还亮着，就是注脚还作数。'
    },
    'sect_leader_飞蝎坞': {
        declined: '节过了。你的回帖比沙暴先一步进坞——词是好词，挑不出错，挑不出错最气人。那夜我坐在蝎房屋顶看坞外的灯火，看到灯一盏一盏熄，金蝎伏在我手边，尾钩竖了一竖。我不拦你——拓银沙拦的是蝎，不是人。只一样，你回来当面直说：那夜的事，是什么事。直说的时候带上嗓门，别带回帖——回帖是念给坞里人听的，念出去，就不是你的了。',
        stood: '那夜我摆了两碗沙水。一碗喝了，一碗放到天亮——沙水搁一夜就澄了，澄了我也没倒，喝了。别问为什么，问就是你矫情。我不恼你。蝎也不恼，它只是趴在我手边，尾钩翘了一夜。你回来，沙水重新兑，碗重新摆。只记着一条：沙漠的人，第二碗沙水比第一碗苦。苦了你还要喝——这沙水，我就兑一辈子。'
    },
    'sect_leader_烈日教': {
        declined: '节过了。回帖收了，事由按仪轨记档——客字底下的事由，八年没有核过一回。那夜我在风口站得比仪轨久了一炷香。风大，火稳，火稳最气人：我居然盼风大些，好把望教外灯火这件事，赖给风。不赖你。经上写焚尽尘与妄——你这一条，我记在难焚那一栏，慢诵。你回来，报一个时辰。时辰我写在仪轨册的册尾。册尾的字极少。一个，就够。',
        stood: '那夜小院的灯亮到天明。不是等你——是守戒，圣女的夜火之戒，恰好当值。守到三更，我把灯从案头挪到了窗台。挪完我想了半天：照什么呢。窗外没有路，也没有人。这一条没有仪轨，我没有记进册子——没记，不等于没有。你回来，灯还在案头。那夜的事，你自己报；我报的是：火苗一夜没有晃。晃都没晃一下，最气人。'
    },
    'sect_leader_天龙教': {
        declined: '节过了。回帖照教规收了——（用香主的调子）「事由，记讫。」传完这一句，我搁了笔。教规传得了事由，传不了那夜：传声房的灯亮到三更，我练了一句话，练了三遍——用你的调子，练的是「今夜我晚些到」。你从来没有说过这句话。是我替你练的，练完擦掉了。擦掉不是忘了，传声房的耳朵你知道的：听过的调子忘不掉，没有听过的话——记得更牢。你回来，报一个时辰。时辰我写在册尾——册尾的字极少。一个，就够。（用云婆婆的调子）「娃儿，婆婆留的灯，不灭。」——婆婆不留。我留。灭不灭，看你回得快不快。',
        stood: '那夜我在外坛廊下等到亥时。等，不是教规——教规说传声房传令，不等人。我练了一句话，练了三遍，第三遍连气口都严丝合缝：（用你的调子）「檀望舒，今夜我晚些到。」你从来没有说过这句话。练完我擦掉了，擦得特别干净——镜子照半张脸，擦镜子的时候，我把那半张脸也顺便擦了。不恼你。只把一句话挂在册尾：（用黑袍知客的调子）「此令，长挂。」挂起的令等什么，传声房八年的册子都知道——等人回来，亲手销。你回来销它。销的法子特别简单：用你自己的调子，叫一声我的名字。'
    },
    'sect_leader_神机门': {
        declined: '节过了。回帖归档，「事由」一栏我重算了——两个字，重算了七遍，还是算不出漂移量。节夜机关雀的拍子乱了一夜，我没有上弦：弦没有上而拍子乱，图纸上叫「虚应」。虚应不是故障，虚应是雀在替谁掐时辰。替谁掐的，雀不说，我也不问——不问，是想你自己说。你回来，给我一个日子。日子给了我，我算得出往后。算往后的刻度盘我做好了，盘上没有名目。名目等你回来起。起好了，入册。',
        stood: '那夜我在钟台上。钟打亥时，打一次我抬头一次，打了三次，我抬了三次。第三次我没有等钟——我先敲了，提前一刻。带钟的师弟问为什么提前。我说：校准。校准是官话。私话记在工册上了，只一行：「是夜，欲替人先报到。」人没有到，钟先到了。机器认时辰，不认预感——我敲了提前钟，就是认了。你回来，先听雀的拍子。拍子稳了，那三十七拍的虚应，我就当它是替你数的日子。数完了，日子归零，从头再数。从头数的时候，你在场。'
    },
    'sect_leader_霹雳堂': {
        declined: '节过了。回帖读了。事由两个字，我把它抄进了方子册的批注栏——抄完在底下添了一行：「是日，人未潮。」未潮是好事。硝怕潮，人怕潮，都是一样的怕。只是回帖上的事由太干了，干得像晒过三日的硝——晒得越干，越一点就着。我不点。我把火收着，收进防火布囊里了。囊在你的老地方，囊角的批注我新写了，九个字：「人回，硝干，路不寒。」九个字，超规了。批注四字为限的规，这些日子我超了不少行，一行也没有销毁。不销毁的缘故，我说了。……我说了。我真的说了：缘故全是你。',
        stood: '那夜我在防火棚。戌时我放过一响爆竹——不是号令，号令有三条章程，那一响没有章程。那一响就是想响一声。棚里太静了，静得能听见铁皮盒里引信的声音。引信不点不响，那夜它自己响了一声。我知道那是什么：硝太燥。不是硝燥，是人燥。人燥了，等不来，就自己响一声给自己听。你回来，先喝粥。粥在灶上，火我给你压着——压的是慢引的火。慢引的火压得住三十七日。第三十八日，粥还是温的。这一句是批注，也是实话。批注和实话一样的时候，我就不超规了。'
    },
    'sect_leader_天书阁': {
        declined: '节过了。回帖讎过三遍。一遍：字不讹。二遍：字不讹。三遍我没有讎字，讎了纸——好纸，写两个字，惜。天书阁不催人，借阅册也不催：你名下「借书一册未还」那一行，我没有批「催还」。批的是两个字：「不催。」不催不是讎语。讎语只认「存疑，不改」——你这一条我不疑。不疑，就是等。等你回来还书，也等你回来还一样书上没有的东西。那样东西叫什么，批注写不下。写不下的，我裁了一页夹在册子里。你回来，自己抽出来看。看的时候轻一点——裁页的手，那夜抖了。十年校讎，手没有抖过。',
        stood: '那夜校讎房的灯亮到三更。岁末重讎，节令之夜，老例——这句话我也说给自己听了一遍。重讎到三更，多讎了一条：借阅册末行。你那一行「未还」两个字，我盯着看了半夜，看完在旁边批了四个字：「还了，就好。」还了就好——校讎房三百年的批注，没有批过这样的条。批完我没有划。不划，就是作数。作数的批注要人验：你回来，当着我的面，把那一行讎一遍。讎什么，你懂。书要还，人要讎。讎完这一条，我请你喝茶——茶不在讎规里。不在讎规里的事，我只做这一件。'
    },
    'sect_leader_大隐阁': {
        declined: '节过了。回帖比糖葫芦先到——人间的消息跑起来，从来是这个样子。事由两个字，我读了。读完给你起了一卦，卦没有告诉你：那一卦签头剩一颗，大凶。大凶的卦我不烧，我把它腌了——山楂腌进罐子，就不算尽了。不尽，就还有下文。下文是什么，卦书上不写，我自己写：你回来，台阶上有新糖葫芦，三串。一串给现在，一串给明年，一串立着不吃。立着的那串起一卦，卦问你几时来。你几时来，卦几时灵。莫尽。这两个字我记了二十年，头一回觉得它不是卦辞——是句人话。',
        stood: '那夜我在台阶缝里立了两根签，一根我的，一根你的。我的那根我吃了——起卦的人要自己先吃，这是规矩。你的那根，我等到亥时，山楂叫风吹落了一颗。落了，我拾起来，擦干净，安回去。安完我想明白了：人不像山楂，人落了，安不回去。所以我把你那根也吃了。替人吃签，就是替人担卦。那一卦的卦象是：剩一颗，大凶。凶我担走了，担得干干净净。你回来，只管当吉卦回来。吉卦的卦辞我拟好了，五个字：「人来了，诸吉。」这五个字卦书上没有——卦书上没有的，我这儿有。我这儿有的，都留给你。'
    },
    'sect_leader_侠隐阁': {
        declined: '节过了。回帖归档，编号照你名下旧例。事由一栏两个字，三样齐整，是好档。档好，人不好——人没有来。这一条我补了附页，附页不入正卷，附页写着：「是夜，档廊灯至五更。灯，不为勘档。」这一行没有来路，没有口气，按规销毁。我没有销毁。不销毁的缘故批在附页末尾，四个字：「存疑，不究。」你回来，附页在近手那格的卷首，你自己看。看完要是笑我，笑完请在附页背面写一行勘语。你写什么，我都归档——归正卷。档廊三百年，头一回有别人的字进正卷。头一回，给你。',
        stood: '那夜我在档廊。不是等人——岁末大清点，节令之夜，档廊的老例。清点到亥时，多清了一格：近手那一格。格里有什么，你知道。我把封皮空白的那一卷取下来，抱了半个时辰，归回去。归回去之前在封皮上写了四个字，写完又划了。划掉的字不能给人看——这是档规。可是划掉的字还在档上：档认写过的，不认划掉的。这一条是我立的规，今夜它向着你。你回来，到档廊来。封皮上那四个字压在划痕底下，对着灯，照得出来。照出来了，你念给我听。念出来就作数——档规：二人在场，才作数。'
    },
    'sect_leader_天涯海阁': {
        declined: '节过了。回帖收讫，事由记讫——记讫的公文压在驿案第一格，最顺手的那一格。那夜我写了一张路引，站名写到一半，搁了笔。搁笔的缘故不在公文里，在引的背面：你的事由两个字，我的站名二十个。两个字装不下二十个，我就把二十个收了。收了，不是不写了——是等你回来，同写。写到哪儿都成。我只求一件事：归期栏里，留一个日子。日子不要「改日」。改日是没有站的站名，驿路三千站，站站有名，独它没有。它没有，我的灯就不知道哪一夜该亮到最亮一档。',
        stood: '那夜我在驿亭，站到亥时过了三刻。亥时三刻，是站册上最末一个时辰。时辰过了，册上就没有时辰了——册上没有时辰的时候，人没有地方搁，只能搁在灯底下。我把铜符攥了一回。攥符留人，驿亭的老例；我当差六年，头一回攥。攥的是存亭的那一半。你那一半在行囊里，隔着三十几日，它热不热，我不知道。符的事，符自己知道。你回来，我们对一回符。断口对上了，我就在站册上落一行：「符全。」符全，在驿路的语里，叫——路不远了。路不远了的意思，公文写不出。公文写不出的，我留着你回来，当面写。'
    },
    'sect_leader_大旗门': {
        declined: '节过了。回帖，营里人念给我听了。事由，两个字。两个字我记进了名册——记的时候添了半行。名册不许添，我是都尉，添了。添的是：「人有事。事，认。」认事，不认远。这是军规，也是实话。护腕那排小针，我缝了拆、拆了缝，三十几日，针眼比针密。你回来，护腕在你案头老地方，铁皮盒也在。开盒，最长针那一排多了一根新的——顶细的一根，缝里衣用的。我的里衣从来粗线。细针给谁备的，你猜得着。猜着了不要当面说。当面说，我认——军汉不会拐弯，只会认。认了，往后就都认。',
        stood: '那夜我在旗杆台上。站到三更，灯一盏一盏灭，我数到最末一盏。数完又站了一更。这一更不在值册上，是我自己添的。自己添的时辰，营里叫私事——私事不入册。不入册，就没人看见：那夜我把针线盒带上了台。台上风大，风不管针线，管人的手。我的手不冷。缝了三十七针，全拆了。拆完重新缝了一个字，没有拆。什么字，你回来翻开护腕里子自己看。看完记着一条军规：暗针走给两个人看——缝的，和戴的。我缝了，你戴。所以那一个字，全营只有你认得。认得了，就别再叫它在风里等第三十八日。'
    },
    'sect_leader_铁掌帮': {
        declined: '节过了。回帖师妹念给我听，念完我抢过来自己又读了一遍——读到第三遍，我把回帖折成方块，收进了哨语册子的封皮里。收回帖不犯规矩，册子里夹私货才犯。犯了就犯了，罚我认：捏了自己一把，捏得挺狠。那夜苇滩的哨，我吹了三十几遍，你知道是哪一条。吹完我在册子上记了一行：「是夜，苇子哑了。我也哑了。」哑的不是哨。哨好好的，音正，气足。哑的是那个想应我的人不在——没人应，吹得再正，也是哑的。你回来，到苇滩来。我吹一声，你应一声。应了，这三十几遍就算全数销账。哨语册子不记账，今日记了。为你记的，规矩我破的，账我销的——你就应一声就行。',
        stood: '那夜我在滩头摆了两只碗，一只盛热汤，一只空着。空的没有倒扣——倒扣是不等了，正摆是等人来盛。亥时过了，汤凉了，我喝了。空碗收起来之前，我对着它吹了一声哨：两声低回。那一条的意思，册子上写的是「没事，就是想吹一下」。骗人的。那夜有事。事就是：我把哨语三条全吹遍了，一条也没有人应。没人应的哨语，吹到后来就不是哨语了，是自言自语。你回来，滩头的汤我重新盛。碗还是那两只——空的那只，往后归你。归你的意思，帮里的规矩：碗在谁手里，汤给谁盛。这一条，我今日立，立给你，谁也不许改。'
    },
    'sect_leader_昆仑派': {
        declined: '节过了。回帖读了。事由——不问。剑客不问事由，问式。那夜我舞了一遍问松，一式没有岔；舞完在松底下立了半个时辰，立的时候想了半式——那半式没有名目。无名目的式，昆仑的剑没有舞过。为你，我破这一条。破了，就要认：认这半式是你的。你回来，卯时到晨课场。我把那半式舞完给你看——舞完，名目当着你的面许。许出来的名目，一生只用一回，只许一个人。这两条都是古礼。古礼我破过一条了，不差再守两条。守给你的那两条，比破的那一条，重。',
        stood: '那夜我立在晨课场。没有舞——立着不是晨课，那夜我破了课。雪落了一夜，肩上落了一层，我没有拂。不拂，是不肯认自己在等；认了等，剑客的腕就先输了半分。你回来，看第三株松底下那条道。道上的雪我没有扫——雪不扫，脚印留得住。留得住，我就知道你来过几回、没有来过几回。三十几日，雪一层压一层。压得最实的那一层底下，有我扫过的旧道。旧道你走过。你回来，在新雪上走一回——你的脚印，我当扫道。扫完，我舞问松。这一遍，式不会岔：雪坎边有人，剑意就不堵。不堵的剑意，才配叫问松。'
    },
    'sect_leader_全真教': {
        declined: '节过了。回帖核了。事由，两个字——两个字在功业账上叫「摘要」。摘要不认明细。你这一笔，我记了摘要，明细留白。留白不是忘：留白要人来，口述，我记。那夜我把一颗算珠拨了半个时辰。珠不入账。不入账的珠，账房的语里没有名目——我自拟了一个，叫「停珠」。停珠停久了，会成一笔账。账名我想好了，叫「停珠账」：欠账的你，讨账的我，数目——不录。不录的缘故：录了，就要讨。讨这个字，我对着算盘练了一夜，练不出手。你回来，这笔账两造当面核。数目你口述，珠子我来拨。你述多少，是多少——你那栏，从来只进不出。这一条，是账规，也是我自己的规。两条，都作数。',
        stood: '那夜我在功业房到三更。岁末结账，节令之夜，老例——这句话，我也说给自己听了一遍。结到丑时，数目结不动了。三十年，功业房的数目没有结不动过。结不动的缘故我核了，核出来三个字，没有入账：入账就要写你的名字。写名字，就是讨账了。我对着一颗算珠坐到天亮——推到底是讫，拨回来是销，我推到底又拨回来，来回了三十几遍。三十几遍，账语里也没有名目。天亮我明白了：没有名目的事，才是要紧的事。要紧的事，我记在这里，不记在账上。你回来，这颗珠我当着你的面推到底——啪的一声，你听着。那一声，就是「停珠账」结讫。结讫之后，起新账。新账的利我算过了：按一辈子。一辈子收不完——收不完，好。收不完，说明这笔账，这辈子讫不了。'
    },
    'sect_leader_少林寺': {
        declined: '节过了。回帖上山，贫尼念了一遍，批了一遍——批注比平日毒，毒却没有进字，进了贫尼自己。偈写在下面：\n「事由圆如秋月，\n巧语如绸裹山门。\n批注骂到第三遍——\n佛号多念去岁一声。」\n偈下贫尼自批一行：此偈妄语，不划。划偈容易，划那一声佛号难。你回来，报个时辰，法座的头排留着：头排冷暖，经不管，贫尼管。',
        stood: '那夜贫尼在栴檀林里站到三更。风大，珠拨了一遍，数到最后一颗，山门口没有人。偈写在下面：\n「山门灯点到三更，\n风上山来人不上山。\n数珠数满一轮——\n多出的那声钟，撞给谁听。」\n偈下批：撞错的是钟，认下的愿是贫尼的。钟不认错，愿认。贫尼不骂你，只录一笔：二十年讲经没有讲岔过一句，独那夜在林子里，对着风讲岔了一句。讲完风散了，贫尼才明白——不是讲岔，是没人听。你回来，听贫尼重讲那一句。这一遍，讲给人。'
    }
};
// 有 spent 实证时信末追一句（{rival} 代入）——情敌名字只在账本为证时出口
var JEAL_LETTER_SPENT = {
    'sect_leader_百花谷': '另——那夜的节，{rival}陪的你。风声传到药庐了。我不追问，有些话，碾着碾着就碎了。',
    'sect_leader_修罗宫': '另记一笔：那夜你在{rival}处。修罗宫不抢人，修罗宫记账——两头，都记得你。',
    'sect_leader_天山派': '山下那夜的灯，雪山看得清——你在{rival}的灯下。不必解释，剑客认看见的。',
    'sect_leader_五仙教': '那夜的名字，心蛊也报给我了——{rival}。别答。答了，我就得信。',
    'sect_leader_铸剑山庄': '那夜你在{rival}那儿过的。打双镰时我想明白了：铁开双刃，是两边都在一炉里烧过。你——两头都得给我烧着。',
    'sect_leader_药王谷': '那夜的礼，我从{rival}那边听说你在。脉案添一栏「另册」吧。别多心——另册，是给惦记得起的人立的。',
    'sect_leader_茅山派': '那夜的卦重起了——应验。你在{rival}处。卦不欺人，人自欺。来，坐一夜，把这两个字从你命里批出去。',
    'sect_leader_金刚宗': '那夜你与{rival}上山，从老僧塔前过——两个人的脚步，都听见了。往后一并来，老僧就把塔前的路，修宽些。',
    'sect_leader_峨眉派': '另——那夜的灯，你点在{rival}处。金顶望得见。我不问长短，戒律只记数目：你的灯，那夜没在峨眉亮。',
    'sect_leader_华山派': '另记一笔：那夜你在{rival}处。是账自己走到我案头的，不是打听。我不记恨——记恨是公款，记账，是私账。',
    'sect_leader_唐门': '另——那夜你在{rival}处。我的针，辨出了你身上那半份药气。不必解释。只记着：伤了，别在别处寻药。唐门的针，只验回自家门的人。',
    'sect_leader_武当派': '另一个数目：那夜你在{rival}处。山门望得见山下的灯，我数过一回，数到你那对，停了。后头的数目——你上山来，当面数给我。',
    'sect_leader_蓬莱派': '另一个数目：那夜的节，你在{rival}处。海上的灯，观汐台望得见。我数到第三盏，停了笔——那一笔潮，是我二十年里头一回，录迟了一刻。潮信误一刻，尚可补；册子上那一栏，空着，补不得。',
    'sect_leader_逍遥派': '另有一盏：那夜你在{rival}处。天下的酒一个味，你那夜的盏，隔着一座山，都是别家的香。不必解释——我只是把你的盏收了，收在琅嬛最高一格。盏等酒，也等人。',
    'sect_leader_恒山派': '另——那夜的节，你在{rival}处。风声隔墙进了庵，我没有问，风自己说的。不必解释。回向页上那一行，我不抹——不抹是我的功课。只是木鱼少的那一声，记在你名下。回来，自己敲回来。敲回来，这一页经，才算抄圆。',
    'sect_leader_嵩山派': '另一目：那夜，你在{rival}处。来路：山下舵口；口气：无疑似；日子：节夜。三条腿齐整，核了三遍，存照。不必解释——解释的那一栏，我给你留着空白。空白，是等你亲口。回来报实了，此卷仍结。报不实——执法堂的档，替我记着。',
    'sect_leader_泰山派': '另一行：那夜的灯，你在{rival}处。顶上望得见——哪一对灯是谁的，我临火十年，一眼一个准。不必解释。档我照实记了：火色，平。你回来，自己上顶改那两个字——炭笔在火坛边。改不动，你说一声，我替你改。改成什么，看你报得实不实。',
    'sect_leader_青城派': '另一锅：那夜，你在{rival}处。消息比茶先下山，山下的事，用不着我打听。不必解释。只记着一个理：锅里的火可以两头旺，人的心不能两头烧。两头烧完，回来喝茶——我的灶只烧一处。这一处，你最好也只烧一处。',
    'sect_leader_衡山派': '另一夜：那夜的节，你在{rival}处。雨声传得远，山下的喜声混在雨里，飘得上琴台。不必解释。曲子认耳朵——那夜的半阙，拉给了一副陌生的檐下。这一句，在曲里是一个音。音落了，曲记得。你回来，我重新拉一遍——稳不稳，你的耳朵报给我。',
    'sect_leader_丐帮': '另一段：那夜，你在{rival}处。讯房的消息，比你开口早——三条腿齐整，核了三遍，归档。不必解释，解释就是虚的，讯房不核虚信。只一句在册：你那一段书，我在粥棚照样跳过。跳过不是关子，是真的。真的讲不得——只能等你回来，喝着粥，慢慢听。',
    'sect_leader_阎罗殿': '另一目：那夜，你在{rival}处。来路：分舵接力；口气：无疑似；日子：节夜。三样齐整，复核三遍，记录在案。不必解释——档不认解释，认记录。判语栏，我仍空着。空白，是等你亲口。回来报实了，此卷仍结；报不实——档房的册子，替我记着。册子不催人。可册子，不忘。',
    'sect_leader_血手门': '另一件事：那夜，你在{rival}处。门里的风传话，我没有问，风自己说的。不必解释。药庐记人，本来记缝过的针数——你这一条，我改记日子了。几日在这儿，几日在那儿，记清了，又描了一遍。描的意思，你不懂也不要紧。回来，煎药给我看。煎得好，清单上销一行；煎不好——再教。教人这件事，我不嫌烦。缝了三年针，什么没有重缝过。',
    'sect_leader_飞蝎坞': '另一句：那夜，你在{rival}处。大漠的风声，比沙暴先到——哪边的灯火、是谁的，我这双看了三年蝎的眼睛，一眼一个准。不必解释。沙漠的人不解释，只记册。那夜册上我记了：风，灯，多，心色平。你回来，自己改这两个字——炭笔在册架上。改不动，说一声，我替你改。改成什么，看你报得实不实。实不实——金蝎的须，比我先知道。',
    'sect_leader_烈日教': '另一件事：那夜，你在{rival}处。教里的风声比沙漠的快，因为要过高台。不必解释。仪轨册只记事实：那夜圣火照四方，你的影子不在四方之内。这一笔我记进了「照十方」那一栏——十方大，装得下一个远的人。八年头一回，我把错的仪轨用在对的地方。你回来，自己把名字从客栏里挪走。笔在册案上。挪歪了不要紧——歪了，我握着你的手，重描一遍。',
    'sect_leader_天龙教': '另一条：那夜，你在{rival}处。教里的风声比令先到——到的时候，我做了一件特别没出息的事：把那个人的调子，练了一遍。练了一遍，就卡在喉咙里了。这几日说话顺口就漏：调子是Ta的，话是我的。（用护法长老的凶腔）「话是我的！」——凶完我自己愣了半息。凶没有用。传声房只记一件事：那夜令传讫，调子是借的。你回来，把这根刺从我喉咙里拔出去。拔的法子是婆婆教的：（用云婆婆的调子）「娃儿，脚底的刺，谁扎的谁拔。」——婆婆的话我借一借。谁扎的，你知道。',
    'sect_leader_神机门': '另一条记录：那夜，你在{rival}处。水漏有刻度——你那处的时辰，是我的机器自己记下来的，不是我打听的。机器记下的，我不赖机器，也不怨你。我只怨自己的手：重算了十九遍。你回来，同我校一回钟。掌灯的是你，上弦的是我。钟校上了，时辰就不漂——漂也不怕。漂了，雀先知；雀知了，我知；我知了，就不算了。不算了，就是认了。认了的误差，图纸上叫「许用」。许用，许的是你。',
    'sect_leader_霹雳堂': '另一行批注：那夜，你在{rival}处。火药铺子的耳朵灵——响声走地皮，地皮不撒谎。我不怨地皮。我怨自己那行批注：写完「是日，人未潮」，底下又添了一行「潮在别处」。两行并排看，册子头一回自相矛盾——硝的册子不许矛盾，人的册子管不住。你回来，坐在炉边烘一烘。防火布囊里的硝，我晒了三日，晒得极燥。燥硝给你，不是给路。这一条超四字——超就超了。超规的行，全是你的。',
    'sect_leader_天书阁': '另一条：那夜，你在{rival}处。阁里的消息比书快，来路明，不必讎。我不怨消息。怨的是批注——「实」字批在你名下那夜，我把那个字讎了三遍，越讎越实。实了的字，校讎房不划。你回来，新页你自己批。批什么，你定；你定的，我圈。圈了的批注，天书阁含你这一条，只有两条。另一条在谁的卷里，不说——说了，超四字。',
    'sect_leader_大隐阁': '另一卦：那夜，你在{rival}处。山下的风声比卦先熟——人间的消息，从来是这个样子。我不怨风声。怨的是那三卦：卦卦大凶，凶得我差点把签头那颗吃了。差点吃，就是差点尽。你回来，陪我起一卦。新卦辞我拟好了：「人来，诸吉。」这一卦只问一件事：你来不来。来的卦，大凶我也当吉信；不来的卦，大吉——我也不信。莫尽。这两个字替你留着：留一颗山楂，留一卦下文，留一个我。',
    'sect_leader_侠隐阁': '另一档：那夜，你在{rival}处。来路：眼线接力；口气：无疑似；日子：节夜。三样齐整，档成立。附档的危险程度一栏，我依旧空白——写高，是我偏了心；写低，是我欺了档。偏心和欺档，档廊都容不得，独这一栏，我两样都容了。你回来，当面重勘。勘语格式我拟好了：你说，我录。录讫，疑销。疑销之后，「未到」栏改名——改叫「已到」。已到栏吉利。档廊三百年没有人想到立这一栏，我立了。立栏等一个人来填头一笔。头一笔，你写。',
    'sect_leader_天涯海阁': '另一站：那夜，你在{rival}处。驿路的消息日日来——你宿在哪一站，册上有明数。我不怨册。怨的是册尾我那行批注：「路平。不须赶。此处候。」八个字，超了格式，犯了规。罚，我领；批，我不改。你回来，把这八个字描成公文。描成公文，「此处候」就名正言顺——名正言顺的候，驿路三千站，站站认。认了，你走到哪一站，哪一站的灯，就都是回家的灯。这一条不入公文。这一条，只入你我的站册。',
    'sect_leader_大旗门': '另一栏：那夜，你在{rival}处。探马探的是防务——你的事，混在防务里报上来的。报得清楚，我不怨探马。怨的是那排针眼：拆了缝，缝了拆，三十几日，布叫针走得密密麻麻。密到后来我明白了——针码不乱，是军汉的心不乱；针码乱了，就是心乱了。你回来，当面报。报完，那排针眼我当着你的面缝死。缝死不是瞒。缝死是：从这排起，针码不再乱。针码不再乱，跟军汉的心不再乱，是一回事。这句话，我这辈子只说这一回。说给你，就算数。',
    'sect_leader_铁掌帮': '另一声哨：那夜，你在{rival}处。苇滩的风知道——风打哪边来，我一听就分得出，这双耳朵吹了三年哨，骗不了。我不怨风。怨的是那三十几遍「过来」：吹出去，没有应。没有应的哨语，吹到后来就是自言自语。自言自语我不怕——我怕的是吹顺了嘴，往后你来了，我也只会自言自语。你回来，我吹一声就好：一长一短，「你来了」。你应一声。应了，册子上那三十几遍全销。销完我教你一条新的——新的那条，册子上没有，苇滩上没有，帮里谁也没有听过。听过的那日起，它就叫你的名了。',
    'sect_leader_昆仑派': '另一式：那夜，你在{rival}处。昆仑的雪白，白雪反光——你在哪一扇灯下，晨课场望得见一角。我不怨雪。怨的是岔掉的半式：问松舞了十年，那夜岔在雪坎边上。岔了，剑意就堵；堵了，松就不答。你回来，雪坎边站好，看我重舞一套。这一遍不岔——岔不岔，看舞的人知道。舞完你答我一句：那半式，等得名目么。等不等得名目，松知道，雪知道。你答了，我就知道。知道了，名目当场就许。',
    'sect_leader_全真教': '另一笔：那夜，你在{rival}处。经堂的值册记谁节夜不在——一目了然。我不怨值册。怨的是外账那一栏：「应收」积了三十几日，利滚得比本厚。利厚了该讨，账房的本分——我讨不出手。讨不出手，账房三十年没有教过我这一课。你回来，当面结这一笔：数目你口述，珠子我拨。珠推到位，账就活了。账活，不是因为利在滚——是因为这一栏，只进不出，只有你写得动。写得动的栏，全真教三百年的功业账上，只此一栏。只此一栏，只此一人。这一条不入账。这一条，入我。',
    'sect_leader_少林寺': '另一偈：那夜的节，你在{rival}处。知客堂的册子记谁上山谁下山——册子不是打听，贫尼不打听。偈曰：\n「香火旺在别家门，\n佛号念到一半轻。\n批不下去的那一句，\n毒回贫尼自身。」\n偈下批：毒回自身，贫尼不怕；怕的是批注经那一页，又白一年。你回来，替贫尼批那一页。你写正文，贫尼缀批——天下的正文，贫尼的毒舌都骂得；独你的，骂不得。骂不得的缘故，偈里没有写。没有写的缘故，你回来，贫尼当面批给你听。'
};

// 过期伤：与 _jealFindWound 同账同源，只认窗口已过（gap>12）且未看未寄的
function _jealFindStaleWound(npcId) {
    var cd = (typeof window !== 'undefined') ? window.currentCharData : null;
    var bonds = (cd && cd.bonds) || {};
    var bond = bonds[npcId];
    if (!bond || bond.type !== 'dao_companion') return null;
    var fes = bond.festival;
    if (!fes) return null;
    var today = 1;
    try {
        if (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') {
            today = Number(window.timeSystem.getAbsoluteDay()) || 1;
        }
    } catch (e) {}
    for (var fkey in fes) {
        var ent = fes[fkey];
        if (!ent) continue;
        if (ent.status !== 'declined' && ent.status !== 'stood') continue;
        if (ent.aftermathFired || ent.letterSent) continue;
        if (!(ent.dueDay > 0)) continue;
        if (today - ent.dueDay <= 12) continue; // 窗口内归当面余波管
        var spentName = null;
        for (var oid in bonds) {
            if (oid === npcId) continue;
            var ob = bonds[oid];
            if (!ob || ob.type !== 'dao_companion' || !ob.festival) continue;
            var oe = ob.festival[fkey];
            if (oe && oe.status === 'spent') {
                var onpc = (window.npcManager && window.npcManager.getNPC) ? window.npcManager.getNPC(oid) : null;
                spentName = (onpc && onpc.name) || ob.name || null;
                break;
            }
        }
        return { fkey: fkey, ent: ent, spentName: spentName };
    }
    return null;
}

function _jealLetterBody(npcId, wound) {
    var t = (JEAL_LETTER[npcId] || {})[wound.ent.status === 'stood' ? 'stood' : 'declined'];
    if (!t) return null;
    if (wound.spentName) {
        t += '\n\n' + String(JEAL_LETTER_SPENT[npcId] || '').replace(/\{rival\}/g, wound.spentName);
    }
    return (wound.ent.fname || '节') + '过了。\n\n' + t;
}

// ============ 每日钩子：试探 / 敲打 / 小心眼 / 节日余波 ============
if (typeof window !== 'undefined' && window.timeSystem && window.timeSystem.onNewDaySubscribe) {
    window.timeSystem.onNewDaySubscribe(function () {
        try {
            if (!window.currentCharData || !window.npcManager) return;
            var loc = window.currentCharData.location || '';

            // 1) 节日余波（最高优先，账上实亏必弹）：账上有未看的伤 + 人恰在 Ta 门中
            var cd = window.currentCharData;
            var bonds = cd.bonds || {};
            for (var bid in bonds) {
                var b = bonds[bid];
                if (!b || b.type !== 'dao_companion') continue;
                var p2 = _jealPrefix(bid);
                if (!p2) continue;
                var sect2 = bid.indexOf('sect_leader_') === 0 ? bid.slice('sect_leader_'.length) : '';
                if (sect2 !== loc) continue;
                var wound = _jealFindWound(bid);
                if (!wound) continue;
                var afterEv = NPC_PERSONAL_EVENTS[p2 + '_event_after'];
                var afterNpc = _jealNpc(bid);
                if (!afterEv || !afterNpc) continue;
                _jealComposeAfter(afterEv, afterNpc, wound);
                _jealFire(p2 + '_event_after', afterNpc, function () {
                    wound.ent.aftermathFired = true; // 本节此伤已当面看过，来年此节再账一回合
                    return true;
                });
                return;
            }

            // 1b) 飞鸽补账：窗口已过、人一直没回门——账不静默作废，Ta 的信追到纸上（一天也只一桩）
            if (window.MailSystem && typeof window.MailSystem.sendNPCMail === 'function') {
                for (var lid in bonds) {
                    var lb = bonds[lid];
                    if (!lb || lb.type !== 'dao_companion') continue;
                    if (_jealPrefix(lid) === null) continue;
                    var stale = _jealFindStaleWound(lid);
                    if (!stale) continue;
                    var lbody = _jealLetterBody(lid, stale);
                    var lnpc = _jealNpc(lid);
                    if (!lbody || !lnpc) continue;
                    try {
                        window.MailSystem.sendNPCMail(lnpc, lbody, 'important');
                    } catch (e) { continue; } // 信没寄成不落旗——账不丢，改日再寄
                    stale.ent.letterSent = true;      // 信已寄出（旗在既有账格内，零新增存档键）
                    stale.ent.aftermathFired = true;  // 本年此节这一回合，账在纸上销了
                    return;
                }
            }

            // 1c) 被晾提醒：道侣超三十日未见——账实（lastMetDay）驱动，回门即见一回（一天也只一桩）
            for (var nid in bonds) {
                var nb = bonds[nid];
                if (!nb || nb.type !== 'dao_companion') continue;
                var p3 = _jealPrefix(nid);
                if (!p3) continue;
                var sect3 = nid.indexOf('sect_leader_') === 0 ? nid.slice('sect_leader_'.length) : '';
                if (sect3 !== loc) continue;
                var due = _jealNeglectDue(nid);
                if (!due) continue;
                var neglectEv = NPC_PERSONAL_EVENTS[p3 + '_event_neglect'];
                var neglectNpc = _jealNpc(nid);
                if (!neglectEv || !neglectNpc) continue;
                _jealFire(p3 + '_event_neglect', neglectNpc, function () {
                    nb.neglectFiredDay = (typeof window.timeSystem.getAbsoluteDay === 'function')
                        ? Number(window.timeSystem.getAbsoluteDay()) || 0 : 0;
                    return true;
                });
                return;
            }

            var roster = _jealRoster();
            if (typeof window.detectRivalRomance !== 'function') return;
            for (var i = 0; i < roster.length; i++) {
                var r = roster[i];
                if (!r || !r.id || r.sect !== loc) continue;
                var prefix = _jealPrefix(r.id);
                if (!prefix) continue;
                var npc = _jealNpc(r.id);
                if (!npc) continue;
                var aff = _jealAff(npc);
                var rival = window.detectRivalRomance(r.id);
                if (!rival) continue; // 一切吃醋的前提：另有一人真实存在

                // 2) 试探：好感≥40，一次性
                var probeId = prefix + '_event_probe';
                if (aff >= 40 && typeof hasEventTriggered === 'function' && !hasEventTriggered(probeId)
                    && Math.random() < 0.3) {
                    _jealFire(probeId, npc);
                    return; // 一天一桩，不连发
                }

                // 3) 敲打：试探已过 + 情敌已成道侣（事实公开）——才立规矩
                var coldId = prefix + '_event_cold';
                if (aff >= 40 && rival.isDaoCompanion
                    && typeof hasEventTriggered === 'function'
                    && hasEventTriggered(probeId) && !hasEventTriggered(coldId)
                    && Math.random() < 0.25) {
                    _jealFire(coldId, npc);
                    return;
                }

                // 4) 小心眼：日常小事，30 日重入（与 ambient 重入机制共用 NPC 记忆）
                var sulkId = prefix + '_event_sulk';
                var sulkEv = NPC_PERSONAL_EVENTS[sulkId];
                if (aff >= 45 && sulkEv && Math.random() < 0.22) {
                    var sulkOk = (typeof hasEventTriggered !== 'function') || !hasEventTriggered(sulkId)
                        || (typeof window._ambientRearmOk === 'function' && window._ambientRearmOk(npc, sulkEv));
                    if (sulkOk) { _jealFire(sulkId, npc); return; }
                }
            }
        } catch (e) { console.warn('[吃醋扩容] 每日触发失败:', e); }
    });
}

// ============ v20.33 信任折价 ============
// 吃醋场上，信任是话语的成色：试探/敲打的安抚类选择（reassure/accept），
// 信任被谎言磨到 10 以下时好感加成减半——Ta 不是不听，是只敢信一半。
// 成色养回靠到场：赴约+1（dao-bridge）、陪节+2（festival-bridge）。
// 引擎调用点在 npc-personal-events.js 结算处（带 typeof 守卫，同 _rivalSexFlavor 手法）。
function _jealTrustDiscount(eventDef, npc, choiceEffect, result) {
    if (!result || typeof result.affection !== 'number' || result.affection <= 0) return;
    if (choiceEffect !== 'reassure' && choiceEffect !== 'accept') return;
    var t = (npc && npc.relationship) ? (Number(npc.relationship.trust) || 0) : 0;
    if (t < 10) {
        result.affection = Math.max(1, Math.round(result.affection / 2));
        result.msg = (result.msg || '') + '（只是这话，Ta 眼下只敢信一半。）';
    }
}

// ============ 导出 ============
if (typeof window !== 'undefined') {
    window.JEALOUSY_PROBE_EVENTS = JEALOUSY_PROBE_EVENTS;
    window.JEALOUSY_COLD_EVENTS = JEALOUSY_COLD_EVENTS;
    window.JEALOUSY_AFTERMATH_EVENTS = JEALOUSY_AFTERMATH_EVENTS;
    window.JEALOUSY_SULK_EVENTS = JEALOUSY_SULK_EVENTS;
    window.JEALOUSY_NEGLECT_EVENTS = JEALOUSY_NEGLECT_EVENTS;
    window._jealFindWound = _jealFindWound;
    window._jealFindStaleWound = _jealFindStaleWound;
    window._jealLetterBody = _jealLetterBody;
    window._jealTrustDiscount = _jealTrustDiscount;
    window._jealNeglectDue = _jealNeglectDue;
}
console.log('[吃醋扩容] 已加载：试探 ' + Object.keys(JEALOUSY_PROBE_EVENTS).length
    + ' + 敲打 ' + Object.keys(JEALOUSY_COLD_EVENTS).length
    + ' + 余波 ' + Object.keys(JEALOUSY_AFTERMATH_EVENTS).length
    + ' + 小心眼 ' + Object.keys(JEALOUSY_SULK_EVENTS).length
    + ' + 被晾 ' + Object.keys(JEALOUSY_NEGLECT_EVENTS).length);

