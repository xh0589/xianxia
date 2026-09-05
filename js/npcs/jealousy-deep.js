// ==================== jealousy-deep.js - 吃醋事件扩容包 v20.30（已接线） ====================
// 已挂载：仙侠.html 中排在 male-lead-reconcile.js 之后（八人全局 detectRivalRomance 就位后加载）。
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
// 事件规模（32 桩，八位恋爱对象 × 4 类）：
//   试探  8 桩 · 一次性 · 有情敌 + 好感≥40 + 人在其门派
//   敲打  8 桩 · 一次性 · 试探已发生 + 情敌已成道侣（事实公开才立规矩）
//   余波  8 桩 · 可重演（每年每节一回到门）· 节前推帖/放鸽子后的次日～十二日内，你在 Ta 门中时
//   小心眼 8 桩 · 日常小事（ambient，30 日重入）· 有情敌 + 好感≥45，随机偶遇
//
// 每日钩子优先级与计划一致：余波 > 试探 > 敲打 > 小心眼（余波是账上实亏，必弹；其余三类吃概率）。
//
// 与既有链的咬合：试探 → 敲打 由 requireEventDone 串联；既有一击式「对峙/和好」
// 不动，本包把「一次性摊牌」之间原本空着的日常填实。

// ============ 公共工具 ============
// 门派 → 事件前缀（与既有文件同一套缩写）
var JEALOUSY_SEC_PREFIX = {
    '百花谷': 'bh', '修罗宫': 'xl', '天山派': 'ts', '五仙教': 'wx',
    '铸剑山庄': 'lu', '药王谷': 'su', '茅山派': 'ms', '金刚宗': 'jg'
};

function _jealPrefix(npcId) {
    var sect = (typeof npcId === 'string' && npcId.indexOf('sect_leader_') === 0)
        ? npcId.slice('sect_leader_'.length) : '';
    return JEALOUSY_SEC_PREFIX[sect] || null;
}

// 八人名册（女主 + 男主，任一未加载则跳过，加载序不敏感）
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

// ============ 一、试探（8 桩，一次性） ============
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
    }
};

// ============ 二、敲打（8 桩，一次性，试探之后） ============
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
    }
};

// ============ 三、节日余波（8 桩，可每年每节重演一次） ============
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
    'sect_leader_金刚宗': '「那夜，你与{rival}上山，从我塔前过。」他扫帚停在那一级台阶上，「老僧在塔里，听见两个人的脚步。」他把扫帚立正，合十，「台阶一人宽。往后你们要一并来——老僧就把这塔前，修宽些。若各来各的……」他没说完，转身接着扫他那一级台阶。'
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
    jg_event_after: _mkAfterEvent('jg', 'sect_leader_金刚宗', '🏮', '塔前第一级')
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

// ============ 四、小心眼（8 桩，日常 ambient，30 日重入） ============
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
    }
};

// ============ 四、被晾提醒（8 桩，道侣账实驱动，一轮不见一回） ============
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
    jg_event_neglect: _mkNeglectEvent('jg', 'sect_leader_金刚宗', '🪵', '长草的阶')
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
    'sect_leader_金刚宗': '那夜你与{rival}上山，从老僧塔前过——两个人的脚步，都听见了。往后一并来，老僧就把塔前的路，修宽些。'
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

