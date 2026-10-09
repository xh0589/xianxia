// ==================== npc-personal-events.js - NPC个人事件系统 v1.0 ====================
// 依赖：npcs/npc-system.js (NPC类, showNPCDialog)
// 加载顺序：在 npc-system.js 之后，在 npc-milestones.js 之后
//
// 个人事件 = 好感度驱动的剧情事件，通过完成特定事件解锁秘密

// ============ 个人事件定义 ============
var NPC_PERSONAL_EVENTS = {};

// 修罗女个人事件
// 侍妾线专属事件
var XIULUO_CONCUBINE_EVENTS = {
    'xl_event_s001': {
        id: 'xl_event_s001',
        npcId: 'sect_leader_修罗宫',
        title: '梳头',
        icon: '🪥',
        desc: '晨起，她把梳子递给你。',
        minAffection: 20,
        requireConcubine: true,
        trigger: { random: 0.3 },
        cooldown: 3,
        flag: 'xl_s001_done',
        scenes: [
            { speaker: 'narrator', text: '清晨，绯泪坐在妆台前，把梳子递给你。', type: 'description' },
            { speaker: 'npc', text: '——我懒得动。你帮我梳。' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '接过梳子帮她梳头', effect: 'comb', affection: 3 },
                { text: '「我不会梳。」', effect: 'refuse', affection: -1 }
            ]}
        ],
        effects: function(npc, choice) {
            return { affection: choice === 'comb' ? 3 : -1, msg: choice === 'comb' ? '她平时从不让人碰她头发——但今天没有说话。' : '她默默接过梳子自己梳了。' };
        }
    },
    'xl_event_s002': {
        id: 'xl_event_s002',
        npcId: 'sect_leader_修罗宫',
        title: '留宿',
        icon: '🌙',
        desc: '深夜你该回自己房间了，但你没走。',
        requireConcubine: true,
        trigger: { type: 'time', timeRange: [22, 4], location: '修罗宫', random: 0.2 },
        cooldown: 5,
        flag: 'xl_s002_done',
        scenes: [
            { speaker: 'narrator', text: '夜深了，你该回自己房间了。', type: 'description' },
            { speaker: 'narrator', text: '绯泪没有开口让你走——你也没走。', type: 'description' },
            { speaker: 'player_select', text: '你如何选择？', options: [
                { text: '留下来', effect: 'stay', affection: 4 },
                { text: '起身回房', effect: 'leave', affection: 1 }
            ]}
        ],
        effects: function(npc, choice) {
            return { affection: choice === 'stay' ? 4 : 1, msg: choice === 'stay' ? '第二天醒来时你发现被子多了一层——是她的。' : '她看了你一眼，什么都没说。' };
        }
    },
    'xl_event_s003': {
        id: 'xl_event_s003',
        npcId: 'sect_leader_修罗宫',
        title: '吃醋',
        icon: '😒',
        desc: '你多看了某个外来修士两眼，她当晚让你「抄门规十遍」。',
        requireConcubine: true,
        trigger: { type: 'time', timeRange: [18, 22], location: '修罗宫', random: 0.15 },
        cooldown: 7,
        flag: 'xl_s003_done',
        scenes: [
            { speaker: 'narrator', text: '你刚跟一个外来修士说了几句话回来。', type: 'description' },
            { speaker: 'npc', text: '好看吗？——那你去他门派啊。' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「你吃醋了？」', effect: 'tease', affection: 2 },
                { text: '「我错了，下次不看了。」', effect: 'apologize', affection: 4 },
                { text: '假装没注意到', effect: 'ignore', affection: -1 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'tease': aff = 2; msg = '她冷笑了一声：「你想多了。」'; break;
                case 'apologize': aff = 4; msg = '她脸色缓和了些：「……知道就好。」'; break;
                case 'ignore': aff = -1; msg = '她沉默了一会儿，什么都没说。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'xl_event_s004': {
        id: 'xl_event_s004',
        npcId: 'sect_leader_修罗宫',
        title: '旧伤',
        icon: '🩹',
        desc: '你无意间看到她后背的旧疤。',
        requireConcubine: true,
        trigger: { type: 'time', timeRange: [20, 23], location: '修罗宫', random: 0.2 },
        cooldown: 0,
        flag: 'xl_s004_done',
        scenes: [
            { speaker: 'narrator', text: '你无意间看到她后背有一道很长的旧疤。', type: 'description' },
            { speaker: 'narrator', text: '她下意识侧身想遮住，但停住了。', type: 'description' },
            { speaker: 'npc', text: '……看够了？——看够了就去拿药，我自己够不着。' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '去拿药，帮她上药', effect: 'help', affection: 5 },
                { text: '问她这道疤的来历', effect: 'ask', affection: 3 },
                { text: '当作没看见', effect: 'ignore', affection: -2 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'help': aff = 5; msg = '她让你上药——这是她的让步。'; break;
                case 'ask': aff = 3; msg = '她沉默了一下：「以前的事。」'; break;
                case 'ignore': aff = -2; msg = '她穿好衣服，什么都没说。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'xl_event_s005': {
        id: 'xl_event_s005',
        npcId: 'sect_leader_修罗宫',
        title: '怕黑',
        icon: '🕯️',
        desc: '你发现绯泪晚上不熄灯。',
        requireConcubine: true,
        trigger: { type: 'time', timeRange: [23, 3], location: '修罗宫', random: 0.2 },
        cooldown: 0,
        flag: 'xl_s005_done',
        scenes: [
            { speaker: 'narrator', text: '你半夜醒来，发现绯泪坐在你床沿。', type: 'description' },
            { speaker: 'npc', text: '——你醒了。没事，睡你的。' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '伸手揽住她', effect: 'hold', affection: 4 },
                { text: '问她怎么了', effect: 'ask', affection: 2 },
                { text: '装作不知道，继续睡', effect: 'sleep', affection: 1 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'hold': aff = 4; msg = '她僵了一下，然后慢慢靠了过来。'; break;
                case 'ask': aff = 2; msg = '她摇头：「没什么。睡吧。」'; break;
                case 'sleep': aff = 1; msg = '过了很久，你感觉到她轻轻叹了口气。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'xl_event_s006': {
        id: 'xl_event_s006',
        npcId: 'sect_leader_修罗宫',
        title: '簪子',
        icon: '🪮',
        desc: '她把断簪递给你保管。',
        requireConcubine: true,
        trigger: { type: 'time', timeRange: [8, 20], location: '修罗宫', random: 0.25 },
        cooldown: 0,
        flag: 'xl_s006_done',
        scenes: [
            { speaker: 'narrator', text: '绯泪把那根断簪递给你。', type: 'description' },
            { speaker: 'npc', text: '你帮我保管。弄丢了——你就把自己赔给我。' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '郑重收下', effect: 'accept', affection: 8 },
                { text: '「我会好好保管的。」', effect: 'promise', affection: 5 },
                { text: '「这太贵重了……」', effect: 'hesitate', affection: 2 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'accept': aff = 8; msg = '她看了你很久，眼神柔和了些。'; break;
                case 'promise': aff = 5; msg = '她点了点头：「嗯。」'; break;
                case 'hesitate': aff = 2; msg = '她收了回去：「……算了。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    }
};

// 弟子线专属事件
var XIULUO_DISCIPLE_EVENTS = {
    'xl_event_d001': {
        id: 'xl_event_d001',
        npcId: 'sect_leader_修罗宫',
        title: '考核',
        icon: '⚔️',
        desc: '门派考核中，绯泪亲自下场替你挡了一击。',
        minAffection: 20,
        requireDisciple: true,
        trigger: { type: 'trial', location: '修罗宫', random: 0.3 },
        cooldown: 0,
        flag: 'xl_d001_done',
        scenes: [
            { speaker: 'narrator', text: '门派考核中，你被分到与一个实力悬殊的对手对战。', type: 'description' },
            { speaker: 'narrator', text: '就在你即将落败时，一道身影挡在了你面前。', type: 'description' },
            { speaker: 'npc', text: '——下来。连我的人都敢动？' },
            { speaker: 'narrator', text: '全场沉默。她回头看了你一眼。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「多谢宫主。」', effect: 'thanks', affection: 5 },
                { text: '沉默，但眼神坚定', effect: 'silent', affection: 4 },
                { text: '「下次我不会输。」', effect: 'determined', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'thanks': aff = 5; msg = '她没回头：「下次打不过就跑。」'; break;
                case 'silent': aff = 4; msg = '她看了你一眼，转身走了。'; break;
                case 'determined': aff = 6; msg = '她嘴角微动：「……最好如此。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'xl_event_d002': {
        id: 'xl_event_d002',
        npcId: 'sect_leader_修罗宫',
        title: '夜课',
        icon: '📖',
        desc: '深夜她突然出现在你修炼的地方，亲自指点你。',
        requireDisciple: true,
        trigger: { type: 'time', timeRange: [20, 2], location: '修罗宫', random: 0.25 },
        cooldown: 5,
        flag: 'xl_d002_done',
        scenes: [
            { speaker: 'narrator', text: '深夜，你还在练功房修炼。', type: 'description' },
            { speaker: 'narrator', text: '门被推开——绯泪站在门口。', type: 'description' },
            { speaker: 'npc', text: '看清楚了——我只演示一次。要是学不会，我亲自教你第二遍。' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '认真看她的演示', effect: 'watch', affection: 4 },
                { text: '「谢谢宫主指点。」', effect: 'thanks', affection: 3 },
                { text: '「我一定学会。」', effect: 'promise', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) {
            return { affection: choice === 'promise' ? 5 : (choice === 'watch' ? 4 : 3), msg: '她演示完后看了你一眼：「记住了？」' };
        }
    },
    'xl_event_d003': {
        id: 'xl_event_d003',
        npcId: 'sect_leader_修罗宫',
        title: '令牌',
        icon: '🪪',
        desc: '她把一枚金色令牌扔到你面前。',
        requireDisciple: true,
        trigger: { type: 'time', timeRange: [8, 18], location: '修罗宫', random: 0.2 },
        cooldown: 0,
        flag: 'xl_d003_done',
        scenes: [
            { speaker: 'narrator', text: '绯泪把一枚金色令牌扔到你面前。', type: 'description' },
            { speaker: 'npc', text: '拿着。以后修罗宫所有地方你都能去——除了我寝宫。' },
            { speaker: 'npc', text: '……除非你来找我。' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「多谢宫主信任。」', effect: 'thanks', affection: 3 },
                { text: '「我一定不负所托。」', effect: 'promise', affection: 4 },
                { text: '沉默接过', effect: 'silent', affection: 2 }
            ]}
        ],
        effects: function(npc, choice) {
            return { affection: choice === 'promise' ? 4 : (choice === 'thanks' ? 3 : 2), msg: '她转身走了，好像什么都没发生过。' };
        }
    },
    'xl_event_d004': {
        id: 'xl_event_d004',
        npcId: 'sect_leader_修罗宫',
        title: '出师',
        icon: '🎉',
        desc: '你突破瓶颈，她站在远处看着你。',
        requireDisciple: true,
        trigger: { type: 'breakthrough', location: '修罗宫', random: 0.5 },
        cooldown: 0,
        flag: 'xl_d004_done',
        scenes: [
            { speaker: 'narrator', text: '你刚刚突破了一个瓶颈，修为大涨。', type: 'description' },
            { speaker: 'narrator', text: '你看到她站在远处——看了你一会儿，转身走了。', type: 'description' },
            { speaker: 'narrator', text: '第二天，你收到一把匕首，附着一张纸条。', type: 'description' },
            { speaker: 'npc', text: '恭喜。这把刀——我当年突破时用的。' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '去当面道谢', effect: 'thanks', affection: 5 },
                { text: '收好，以后用这把刀保护她', effect: 'protect', affection: 6 },
                { text: '留一封回信', effect: 'letter', affection: 4 }
            ]}
        ],
        effects: function(npc, choice) {
            return { affection: choice === 'protect' ? 6 : (choice === 'thanks' ? 5 : 4), msg: '她没有回应，但后来你发现她嘴角带着一丝笑意。' };
        }
    },
    'xl_event_d005': {
        id: 'xl_event_d005',
        npcId: 'sect_leader_修罗宫',
        title: '护短',
        icon: '🛡️',
        desc: '有人当着你面说修罗宫闲话，绯泪出手了。',
        requireDisciple: true,
        trigger: { type: 'time', timeRange: [10, 16], location: '修罗宫', random: 0.2 },
        cooldown: 0,
        flag: 'xl_d005_done',
        scenes: [
            { speaker: 'narrator', text: '你正在山门外，听到有人在说修罗宫的闲话。', type: 'description' },
            { speaker: 'narrator', text: '你还没反应，那人被一股灵力掀翻在地。', type: 'description' },
            { speaker: 'narrator', text: '绯泪站在廊下，没有看你。', type: 'description' },
            { speaker: 'npc', text: '——修罗宫的人，轮不到外人评头论足。' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「多谢宫主维护。」', effect: 'thanks', affection: 4 },
                { text: '沉默，但站到她身后', effect: 'stand', affection: 5 },
                { text: '「下次让我自己来。」', effect: 'independent', affection: 3 }
            ]}
        ],
        effects: function(npc, choice) {
            return { affection: choice === 'stand' ? 5 : (choice === 'thanks' ? 4 : 3), msg: '她淡淡地「嗯」了一声，转身走了。' };
        }
    }
};

var XIULUO_EVENTS = {
    // === 好感 0-20：初识·试探期 ===
    'xl_event_001': {
        id: 'xl_event_001',
        npcId: 'sect_leader_修罗宫',
        title: '深夜的灯',
        icon: '🪔',
        desc: '你值夜时发现议事厅的灯还亮着。',
        minAffection: 20,
        trigger: { random: 0.5 },
        cooldown: 0,
        flag: 'xl_e001_done',
        autoTrigger: { random: 0.45 },
        scenes: [
            { speaker: 'narrator', text: '你值夜巡逻时，发现议事厅的灯还亮着。', type: 'description' },
            { speaker: 'narrator', text: '你走近，看见绯泪独自坐在里面——不是在批文件，只是在发呆。', type: 'description' },
            { speaker: 'narrator', text: '她听到脚步声，抬头。', type: 'description' },
            { speaker: 'npc', text: '……你怎么还没睡？' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「我值夜。」', effect: 'duty', affection: 2 },
                { text: '「宫主也没睡。」', effect: 'care', affection: 3 },
                { text: '给她端了杯热茶才走', effect: 'tea', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'duty': aff = 2; msg = '她点头：「嗯。去吧。」'; break;
                case 'care': aff = 3; msg = '她摇头：「睡不着。你忙你的。」'; break;
                case 'tea': aff = 5; msg = '她看着那杯茶，过了很久才喝。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'xl_event_002': {
        id: 'xl_event_002',
        npcId: 'sect_leader_修罗宫',
        title: '你怎么在这里',
        icon: '🌅',
        desc: '她「偶然」出现在你修炼的地方附近。',
        trigger: { random: 0.3 },
        cooldown: 3,
        flag: 'xl_e002_done',
        autoTrigger: { location: '修罗宫', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '清晨，你路过修罗宫的花圃。', type: 'description' },
            { speaker: 'narrator', text: '绯泪独自站在花圃前，手里捏着一片叶子，不知道在想什么。', type: 'description' },
            { speaker: 'narrator', text: '听到脚步声，她回过头。', type: 'description' },
            { speaker: 'npc', text: '……早。你也睡不着？' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「习惯了早起修炼。」', effect: 'diligent', affection: 2 },
                { text: '「宫主起得真早。」', effect: 'curious', affection: 3 },
                { text: '沉默点头后走开', effect: 'silent', affection: 0 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'diligent': aff = 2; msg = '绯泪轻笑：「好习惯。」'; break;
                case 'curious': aff = 3; msg = '她摇头：「我根本没睡。」'; break;
                case 'silent': msg = '绯泪没再说话。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'xl_event_003': {
        id: 'xl_event_003',
        npcId: 'sect_leader_修罗宫',
        title: '你吃饭了吗',
        icon: '🍲',
        desc: '她找理由接近你，问得漫不经心。',
        trigger: { random: 0.3 },
        cooldown: 0,
        flag: 'xl_e003_done',
        autoTrigger: { location: '修罗宫', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '你完成了今天的门派任务，正准备回去休息。', type: 'description' },
            { speaker: 'narrator', text: '一个侍女匆匆走来：「宫主让你去一趟。」', type: 'description' },
            { speaker: 'narrator', text: '你来到议事厅，绯泪坐在案前，面前摆着一碗热汤。', type: 'description' },
            { speaker: 'npc', text: '你最近很勤快。这碗汤是厨房多做的——你喝了再走。' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「多谢宫主。」一饮而尽', effect: 'drink', affection: 3 },
                { text: '「……宫主自己喝吧。」', effect: 'refuse', affection: -2 },
                { text: '「宫主……有什么事要吩咐吗？」', effect: 'ask', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'drink': aff = 3; msg = '她眼中闪过一丝满意。'; break;
                case 'refuse': aff = -2; msg = '她面无表情：「随你。」'; break;
                case 'ask': aff = 5; msg = '她摇头：「没有。就是看你瘦了。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // === 好感 20-40：靠近·暗流 ===
    'xl_event_004': {
        id: 'xl_event_004',
        npcId: 'sect_leader_修罗宫',
        title: '断裂的玉簪',
        icon: '💔',
        desc: '绯泪深夜坐在池塘边，手里摩挲一根断簪。',
        trigger: { random: 0.4 },
        cooldown: 0,
        flag: 'xl_e004_done',
        autoTrigger: { location: '修罗宫', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '夜色渐深，你路过修罗宫后院的池塘。', type: 'description' },
            { speaker: 'narrator', text: '绯泪坐在池塘边，手里摩挲着一根断簪——她没有察觉你来。', type: 'description' },
            { speaker: 'narrator', text: '你走近时她迅速收起断簪，回过头。', type: 'description' },
            { speaker: 'npc', text: '……你来了。坐吧。' },
            { speaker: 'narrator', text: '她沉默了一会儿，忽然问了一个问题。', type: 'description' },
            { speaker: 'npc', text: '你相信「永远」吗？' },
            { speaker: 'player_select', text: '你如何回答？', options: [
                { text: '「相信。」', effect: 'believe', affection: 3 },
                { text: '「不太信。」', effect: 'doubt', affection: 5 },
                { text: '「看人。」——「那你看我，像能信的人吗？」', effect: 'depends', affection: 4 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'believe': aff = 3; msg = '她笑了笑：「天真。」但语气不冷。'; break;
                case 'doubt': aff = 5; msg = '她低头：「……我也是。」'; break;
                case 'depends': aff = 4; msg = '她若有所思地看了你一会儿：「你倒是会说话。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'xl_event_005': {
        id: 'xl_event_005',
        npcId: 'sect_leader_修罗宫',
        title: '茶凉了',
        icon: '🍵',
        desc: '绯泪让侍女给你上茶，但她在处理公务，一直没空理你。',
        trigger: { random: 0.3 },
        cooldown: 5,
        flag: 'xl_e005_done',
        autoTrigger: { location: '修罗宫', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '你在议事厅等待绯泪处理公务。', type: 'description' },
            { speaker: 'narrator', text: '她让侍女给你上了茶，但一直在批文件，没空理你。', type: 'description' },
            { speaker: 'narrator', text: '茶凉了。她终于抬头。', type: 'description' },
            { speaker: 'npc', text: '……你怎么不喝？' },
            { speaker: 'narrator', text: '她走过来，手指碰了一下杯壁，皱眉。', type: 'description' },
            { speaker: 'npc', text: '凉了。换一杯。' },
            { speaker: 'narrator', text: '她亲手给你倒了新茶。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「没事，凉了也能喝。」', effect: 'casual', affection: 4 },
                { text: '「谢谢宫主。」', effect: 'polite', affection: 3 },
                { text: '什么都不说，默默喝', effect: 'silent', affection: 2 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'casual': aff = 4; msg = '她看你一眼：「不行。凉茶伤胃。」'; break;
                case 'polite': aff = 3; msg = '她没回应，但嘴角微动。'; break;
                case 'silent': aff = 2; msg = '她看了你一会儿，然后回去继续批文。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'xl_event_006': {
        id: 'xl_event_006',
        npcId: 'sect_leader_修罗宫',
        title: '雨夜·屋檐下',
        icon: '🌧️',
        desc: '下雨天，绯泪把伞给你，自己淋雨走。',
        trigger: { random: 0.5 },
        cooldown: 7,
        flag: 'xl_e006_done',
        autoTrigger: { location: '修罗宫', random: 0.45 },
        scenes: [
            { speaker: 'narrator', text: '大雨滂沱，你在修罗宫某处屋檐下躲雨。', type: 'description' },
            { speaker: 'narrator', text: '绯泪从走廊另一头走来，手里拿着一把伞。', type: 'description' },
            { speaker: 'narrator', text: '她看见你，停住。', type: 'description' },
            { speaker: 'npc', text: '……没带伞？' },
            { speaker: 'narrator', text: '她把伞递给你。', type: 'description' },
            { speaker: 'npc', text: '拿着。别淋雨。' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「宫主怎么回去？」', effect: 'concern', affection: 5 },
                { text: '「一起走吧。」（撑开伞）', effect: 'together', affection: 10 },
                { text: '接过伞说谢谢', effect: 'thanks', affection: 3 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'concern': aff = 5; msg = '她笑：「我淋惯了。」转身走入雨中。'; break;
                case 'together': aff = 10; msg = '她怔了一下，走进伞下。沉默着走了一段路，她低声说：「……很久没和人撑伞了。」'; break;
                case 'thanks': aff = 3; msg = '她点头离开。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // === 好感 40-60：剖白·试探与退缩 ===
    'xl_event_007': {
        id: 'xl_event_007',
        npcId: 'sect_leader_修罗宫',
        title: '旧物·寒烟门',
        icon: '📦',
        desc: '绯泪让你看到她保存的旧物——寒烟门的遗物。',
        trigger: { random: 0.3 },
        cooldown: 0,
        flag: 'xl_e007_done',
        scenes: [
            { speaker: 'narrator', text: '你来到绯泪的寝宫，她正在整理一个旧木箱。', type: 'description' },
            { speaker: 'narrator', text: '看见你来，她下意识想合上——但犹豫了一下，打开了。', type: 'description' },
            { speaker: 'narrator', text: '箱子里：一件旧衣裳、一张画、一根断簪的另一半碎片。', type: 'description' },
            { speaker: 'npc', text: '……这是很久以前的东西了。那个人……来自一个早已灭亡的小门派，叫寒烟门。' },
            { speaker: 'npc', text: '他叫郗寒舟。' },
            { speaker: 'narrator', text: '她说出这个名字时，声音很轻，像怕惊醒什么。', type: 'description' },
            { speaker: 'npc', text: '……我杀了他。' },
            { speaker: 'narrator', text: '她停了一下，没有说为什么。', type: 'description' },
            { speaker: 'npc', text: '寒烟门灭门那晚，有隐情。但我现在不想说。' },
            { speaker: 'npc', text: '以后吧。以后我再告诉你。' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「你……恨他吗？」', effect: 'hate', affection: 6 },
                { text: '「他值得你记这么久吗？」', effect: 'worth', affection: 8 },
                { text: '伸手碰了一下那半截簪子', effect: 'touch', affection: 10 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'hate': aff = 6; msg = '她沉默良久：「恨过。现在不恨了。只是……忘不掉。」'; break;
                case 'worth': aff = 8; msg = '她笑了——自嘲的那种：「不值得。但我蠢。」'; break;
                case 'touch': aff = 10; msg = '她没阻止，轻声说：「……你碰了它，就是答应替我保管了。」（获得任务物品「半截断簪」）'; break;
            }
            return { affection: aff, msg: msg, item: choice === 'touch' ? 'half_broken_hairpin' : null };
        }
    },
    'xl_event_008': {
        id: 'xl_event_008',
        npcId: 'sect_leader_修罗宫',
        title: '梦呓',
        icon: '😴',
        desc: '你在绯泪寝宫外值夜，听到她在说梦话。',
        trigger: { random: 0.3 },
        cooldown: 0,
        flag: 'xl_e008_done',
        autoTrigger: { timeRange: [22, 4], location: '修罗宫', random: 0.45 },
        scenes: [
            { speaker: 'narrator', text: '你在绯泪寝宫外值夜。', type: 'description' },
            { speaker: 'narrator', text: '里面传来梦话——声音很轻，带着哭腔：「……你别走……我……我不怪你……」', type: 'description' },
            { speaker: 'narrator', text: '你犹豫了一下，敲门。她惊醒。', type: 'description' },
            { speaker: 'npc', text: '……谁？' },
            { speaker: 'narrator', text: '你说「是我」。沉默了很久，她开口。', type: 'description' },
            { speaker: 'npc', text: '……进来。' },
            { speaker: 'narrator', text: '她坐在床沿，头发散乱，没看你。', type: 'description' },
            { speaker: 'npc', text: '……你什么都没听见。' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「我什么都没听见。」', effect: 'deny', affection: 4 },
                { text: '「我听见了。」——「……我没听清。」', effect: 'partial', affection: 6 },
                { text: '走过去，把外衣披在她肩上', effect: 'care', affection: 12 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'deny': aff = 4; msg = '她点了点头：「……好。」'; break;
                case 'partial': aff = 6; msg = '她眼里的光暗了一下：「……那就好。」'; break;
                case 'care': aff = 12; msg = '她僵住了，低声：「……你真不怕我杀了你？」但没推开。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'xl_event_009': {
        id: 'xl_event_009',
        npcId: 'sect_leader_修罗宫',
        title: '桃花笺',
        icon: '🌸',
        desc: '门缝下塞了一张纸条——绯泪的字迹说后山桃花开了。',
        trigger: { random: 0.3 },
        cooldown: 7,
        flag: 'xl_e009_done',
        autoTrigger: { location: '修罗宫', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '你发现门缝下塞了一张纸条。', type: 'description' },
            { speaker: 'narrator', text: '绯泪的字迹：「今天后山的桃花开了。你不是说想看吗？——算了，当我没说。」', type: 'description' },
            { speaker: 'player_select', text: '你是否去后山看看？', options: [
                { text: '去后山——她果然在', effect: 'go', affection: 8 },
                { text: '不去，但把纸条收好', effect: 'keep', affection: 3 },
                { text: '当作没看见', effect: 'ignore', affection: 0 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'go': aff = 8; msg = '你在桃树下找她，她别过脸：「……巧合而已。」但她嘴角是上扬的。'; break;
                case 'keep': aff = 3; msg = '你收好纸条。后来她也没提这件事。'; break;
                case 'ignore': aff = 0; msg = '你什么都没做。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // === 好感 60-80：心动·矛盾与拉扯 ===
    'xl_event_010': {
        id: 'xl_event_010',
        npcId: 'sect_leader_修罗宫',
        title: '灵根失衡',
        icon: '❄️🔥',
        desc: '绯泪运功过度，双灵根短暂失衡。',
        trigger: { random: 0.3 },
        cooldown: 0,
        flag: 'xl_e010_done',
        autoTrigger: { location: '修罗宫', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '你听说绯泪练功时出了状况，赶到她寝宫时她正试图自己压制。', type: 'description' },
            { speaker: 'npc', text: '——谁让你进来的？' },
            { speaker: 'narrator', text: '你没出去。她看了你几秒，泄了气。', type: 'description' },
            { speaker: 'npc', text: '……过来。' },
            { speaker: 'narrator', text: '你靠近后，她抓住你的手按在自己肩上的灵力交汇处。', type: 'description' },
            { speaker: 'npc', text: '——帮我压一下这个。左边冰、右边火，你别搞反了。' },
            { speaker: 'narrator', text: '你帮她压住灵力时，她闭眼低声说：「……你要是这时候动手，我完全没有还手之力。」', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「我永远不会对你动手。」', effect: 'promise', affection: 20 },
                { text: '「你这是在试探我？」', effect: 'test', affection: 15 },
                { text: '专心帮她压制，不说话', effect: 'focus', affection: 12 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'promise': aff = 20; msg = '她沉默了一会儿：「……嗯。我信你。」'; break;
                case 'test': aff = 15; msg = '她睁眼看你：「是。你通过了。」'; break;
                case 'focus': aff = 12; msg = '她收功后看了你很久：「……你可以留在这里。以后可以。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'xl_event_011': {
        id: 'xl_event_011',
        npcId: 'sect_leader_修罗宫',
        title: '谁的簪',
        icon: '🪮',
        desc: '绯泪看到你在把玩那半截断簪。',
        trigger: { random: 0.3 },
        cooldown: 0,
        flag: 'xl_e011_done',
        scenes: [
            { speaker: 'narrator', text: '你正在把玩那半截断簪，绯泪推门进来。', type: 'description' },
            { speaker: 'npc', text: '……你还留着它。' },
            { speaker: 'narrator', text: '她的语气不是疑问，而是确认。', type: 'description' },
            { speaker: 'npc', text: '……留着吧。我送出去的东西，从不收回。' },
            { speaker: 'narrator', text: '她看了一眼那根簪子，眼神很复杂。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「那你还等他吗？」', effect: 'wait', affection: 10 },
                { text: '「他可能还活着。」', effect: 'alive', affection: 8 },
                { text: '把簪子递给她：「你想留着吗？」', effect: 'return', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'wait': aff = 10; msg = '她摇头：「不等了。只是……那根簪子，是我唯一能证明‘那个人真的存在过’的东西了。」'; break;
                case 'alive': aff = 8; msg = '她猛地转头看你，眼神复杂：「……你希望他活着，还是死了？」'; break;
                case 'return': aff = 6; msg = '她怔住：「……你留着吧。我送出去的东西，从不收回。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'xl_event_012': {
        id: 'xl_event_012',
        npcId: 'sect_leader_修罗宫',
        title: '修罗宫的月',
        icon: '🌙',
        desc: '绯泪坐在屋顶上看月亮，你也爬上去。',
        trigger: { random: 0.3 },
        cooldown: 0,
        flag: 'xl_e012_done',
        autoTrigger: { timeRange: [20, 24], location: '修罗宫', random: 0.45 },
        scenes: [
            { speaker: 'narrator', text: '你看到绯泪坐在修罗宫最高的屋顶上，看着月亮。', type: 'description' },
            { speaker: 'narrator', text: '你爬上去，坐在她旁边。', type: 'description' },
            { speaker: 'npc', text: '……你也上来了。' },
            { speaker: 'narrator', text: '她沉默了很久，忽然说。', type: 'description' },
            { speaker: 'npc', text: '你知道吗？修罗宫这个名字，是我取的。修罗——阿修罗，好斗、善妒、不得解脱。我以前觉得……我就是那样的人。' },
            { speaker: 'npc', text: '但我现在不那么认为了。' },
            { speaker: 'npc', text: '……我现在觉得，修罗也可以被温柔对待。' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '握住她的手', effect: 'hold', affection: 15 },
                { text: '「你现在……还是觉得自己是修罗吗？」', effect: 'ask', affection: 10 },
                { text: '沉默，陪她看月亮', effect: 'silent', affection: 12 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'hold': aff = 15; msg = '她没抽开——这是重要的一步。'; break;
                case 'ask': aff = 10; msg = '她想了想：「……是。但我想学着当人了。」'; break;
                case 'silent': aff = 12; msg = '过了一会儿，她轻轻靠在你肩上——很轻，像怕压碎什么。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // === 好感 80-100：承诺·代价与选择 ===
    'xl_event_013': {
        id: 'xl_event_013',
        npcId: 'sect_leader_修罗宫',
        title: '真名·绯泪',
        icon: '💌',
        desc: '绯泪把她的名字，正式交给了你。',
        trigger: { random: 0.5 },
        cooldown: 0,
        flag: 'xl_e013_done',
        scenes: [
            { speaker: 'narrator', text: '你的房间里多了一封信，两页。', type: 'description' },
            { speaker: 'narrator', text: '第一页两个字：「绯泪」。这两个字你听了不知多少回，一直当它是称呼。', type: 'description' },
            { speaker: 'narrator', text: '第二页是半张旧笺，边角磨得起了绒，一看就是贴身带了许多年。上头一行妇人的字：', type: 'description' },
            { speaker: 'narrator', text: '「绯，是娘嫁衣上拆下来的颜色。泪，是娘留给你的——往后要哭，就哭值钱的那一种。」', type: 'description' },
            { speaker: 'narrator', text: '没有落款，只有指甲掐出来的一个小小的月牙印。', type: 'description' },
            { speaker: 'narrator', text: '你这才明白：那两个字不是名，是名讳。名讳这东西，亲娘叫完，她收了半辈子，没许任何人叫。', type: 'description' },
            { speaker: 'narrator', text: '你去找她。她正坐在梳妆台前，把那根断簪插回发髻。', type: 'description' },
            { speaker: 'narrator', text: '她从镜子里看到你，笑了一下。', type: 'description' },
            { speaker: 'npc', text: '……你知道把名讳交到你手上，在修仙界意味着什么吗？' },
            { speaker: 'npc', text: '意味着——我把我的命，交到你手上了。' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「我也会把我的命交给你。」', effect: 'mutual', affection: 20 },
                { text: '「……为什么相信我？」', effect: 'why', affection: 15 },
                { text: '沉默，走过去替她扶正簪子', effect: 'fix', affection: 18 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'mutual': aff = 20; msg = '她笑了——第一次笑得像个小女孩。'; break;
                case 'why': aff = 15; msg = '她想了想：「因为你看了我那么多次，都没有转身走。」'; break;
                case 'fix': aff = 18; msg = '她闭上眼睛，声音很轻：「……你扶正了它，就要一直帮我扶下去。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'xl_event_014': {
        id: 'xl_event_014',
        npcId: 'sect_leader_修罗宫',
        title: '郗寒舟的真相',
        icon: '📜',
        desc: '绯泪终于愿意讲完寒烟门的全部故事。',
        trigger: { random: 0.5 },
        cooldown: 0,
        flag: 'xl_e014_done',
        scenes: [
            { speaker: 'narrator', text: '绯泪终于愿意讲完那个故事。', type: 'description' },
            { speaker: 'npc', text: '那年寒烟门被围，他用一个假情报把我骗出去。' },
            { speaker: 'npc', text: '他说「你在这边等我，我处理完就来接你」。' },
            { speaker: 'npc', text: '我等到的是一群要杀我的人。' },
            { speaker: 'narrator', text: '她说到这里停了很久。', type: 'description' },
            { speaker: 'npc', text: '我逃出来了。我回去找他。他站在废墟前面，没有跑。' },
            { speaker: 'npc', text: '我说「你把我交出去了」。他说「我没有全信——但哪怕只有一成怀疑，我也赌不起」。' },
            { speaker: 'npc', text: '我说「你赌了。赌的是我的命」。' },
            { speaker: 'narrator', text: '她又停了一下。', type: 'description' },
            { speaker: 'npc', text: '……然后我拔了刀。那把他送我的刀。' },
            { speaker: 'npc', text: '他也没躲。' },
            { speaker: 'narrator', text: '她说完这句话，好像用完了所有力气。', type: 'description' },
            { speaker: 'npc', text: '两个人都知道他不是故意的。但「不是故意的」并不能让寒烟门死而复生。' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「那你现在还恨他吗？」', effect: 'hate_now', affection: 15 },
                { text: '「如果你再见到他，会怎么做？」', effect: 'meet', affection: 10 },
                { text: '抱住她', effect: 'hug', affection: 20 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'hate_now': aff = 15; msg = '她想了想：「恨过。现在……我好像没那么恨了。因为我又遇到了想等的人。」'; break;
                case 'meet': aff = 10; msg = '她沉默了很久：「……把簪子还给他。然后告诉他——我不等了。」'; break;
                case 'hug': aff = 20; msg = '她身体僵住了，然后慢慢放松，把脸埋在你肩上。她没哭，但肩膀在抖。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'xl_event_033': {
        id: 'xl_event_033',
        npcId: 'sect_leader_修罗宫',
        title: '终章·选择',
        icon: '💍',
        desc: '绯泪把修好的玉簪交给你——这是最后的抉择。',
        trigger: { random: 1.0 },
        cooldown: 0,
        flag: 'xl_e033_done',
        endingMap: { '共主': 'xl_ending_共主', '归心': 'xl_ending_归心', '比邻': 'xl_ending_比邻', '归处': 'xl_ending_归处', '霜烬': 'xl_ending_霜烬', '修罗': 'xl_ending_修罗' },
        scenes: [
            { speaker: 'narrator', text: '绯泪在修罗宫大殿等你。她穿着那件绯色衣裳——不是宫主正装，而是她自己。', type: 'description' },
            { speaker: 'narrator', text: '她手里拿着那根修好的玉簪——她把断簪接上了，金线缠绕断裂处，像一道愈合的伤疤。', type: 'description' },
            { speaker: 'npc', text: '我修好了它。' },
            { speaker: 'npc', text: '——现在，我想把它交给你。' },
            { speaker: 'npc', text: '你愿意……替我保管一辈子吗？' },
            { speaker: 'narrator', text: '她把簪子放在桌上，推到你的面前。', type: 'description' },
            { speaker: 'npc', text: '——你选吧。不管选什么，我都认。' },
            { speaker: 'player_select', text: '你的选择将决定你们的关系走向', options: [
                { text: '「我想做你的恋人。我们一起扛。」', effect: 'lover_carry', affection: 30 },
                { text: '「我想做你的恋人。你扛就行，我在你身边。」', effect: 'lover_rest', affection: 25 },
                { text: '「我想做你的朋友。我们一起扛。」', effect: 'friend_carry', affection: 20 },
                { text: '「我想做你的朋友。你扛就行，我在你身边。」', effect: 'friend_rest', affection: 15 },
                { text: '「我不想再和你有任何关系。从此恩断义绝。」', effect: 'break', affection: -20 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '', ending = '';
            // 霜烬兜底：累计负面选项≥3 时，恋人选项转为放手结局（与温蘅花冢/琤霄凌断鸣/蓝凤凰蛊噬同构）
            // v20.25 门槛 5→3：三度伤透即寒心——旧门槛对多数线数学不可达（一条线总共没有 5 个负选项），坏结局形同虚设
            var negCount = (window._negativeChoiceCount && window._negativeChoiceCount['sect_leader_修罗宫']) || 0;
            if (negCount >= 3 && (choice === 'lover_carry' || choice === 'lover_rest')) {
                return { affection: 0, msg: '她看着你，良久没动。然后她拿起那根修好的簪子——又掰断了，金线崩开，像一道愈合又被撕开的疤。「……我修好了它，等你来接。你来了，却不像来接的。」她把半截簪子放在桌上，推向你，「你我各拿一半。谁也不欠谁。」', ending: '霜烬' };
            }
            switch (choice) {
                case 'lover_carry':
                    aff = 30;
                    msg = '她走过来，把那根簪子轻轻插进你的发髻：「……那说好了。谁先放手，谁就是小狗。」';
                    ending = '共主';
                    break;
                case 'lover_rest':
                    aff = 25;
                    msg = '她低头笑了一下：「……好。你在就行。」她把簪子收进怀里，拍了拍。';
                    ending = '归心';
                    break;
                case 'friend_carry':
                    aff = 20;
                    msg = '她看了你很久，点了点头：「……好。那说好了。」她伸出手——像男人之间那样，握了一下你的手腕。';
                    ending = '比邻';
                    break;
                case 'friend_rest':
                    aff = 15;
                    msg = '她松了口气，笑了笑：「……嗯。这样也很好。」她把簪子收好：「走吧，去吃饭。」';
                    ending = '归处';
                    break;
                case 'break':
                    aff = -20;
                    msg = '她把簪子攥在掌心，指节发白。半晌，她当着你的面把那根修好的簪子掰断——金线崩飞，断裂声很轻，却比任何一句话都重。「——你走吧。」她没回头，「以后见面，就是敌人。修罗宫从此没有绯泪——只有修罗女。」';
                    ending = '修罗';
                    break;
            }
            return { affection: aff, msg: msg, ending: ending };
        }
    }
};

// ============ 她的日常（10件，xl_015~024）——绯泪做了但不说的那些事 ============
var XIULUO_DAILY_EVENTS = {
    'xl_event_015': { id: 'xl_event_015', npcId: 'sect_leader_修罗宫', title: '安神茶', icon: '🍵', desc: '你早上打哈欠，她路过时看了你一眼。', minAffection: 20, trigger: { random: 0.3 }, cooldown: 0, flag: 'xl_e015_done', autoTrigger: { random: 0.3 },
        scenes: [
            { speaker: 'narrator', text: '你早上顶着两个黑眼圈打了个哈欠。', type: 'description' },
            { speaker: 'narrator', text: '绯泪路过时看了你一眼，没说话。', type: 'description' },
            { speaker: 'narrator', text: '当天下午，你桌上多了一壶安神茶——但她不在。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '喝了一口，放回去', effect: 'drink', affection: 3 },
                { text: '去找她道谢', effect: 'thanks', affection: 5 },
                { text: '当作没注意到', effect: 'ignore', affection: 0 }
            ]}
        ],
        effects: function(npc, choice) { var aff = 0, msg = ''; switch(choice) { case 'drink': aff = 3; msg = '她后来看了一眼空壶，没说什么。'; break; case 'thanks': aff = 5; msg = '她别过脸：「……顺手。」'; break; case 'ignore': aff = 0; msg = '茶凉了，没人动过。'; break; } return { affection: aff, msg: msg }; }
    },
    'xl_event_016': { id: 'xl_event_016', npcId: 'sect_leader_修罗宫', title: '一件薄氅', icon: '🧥', desc: '天冷，你出门时只穿了单衣。', minAffection: 20, trigger: { random: 0.3 }, cooldown: 0, flag: 'xl_e016_done', autoTrigger: { random: 0.3 },
        scenes: [
            { speaker: 'narrator', text: '天气转冷，你出门时只穿了单衣。', type: 'description' },
            { speaker: 'narrator', text: '你回房时发现门口放着一件薄氅——尺寸是你的。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '穿上它出门', effect: 'wear', affection: 4 },
                { text: '去还给她', effect: 'return', affection: 3 },
                { text: '放着没动', effect: 'ignore', affection: 0 }
            ]}
        ],
        effects: function(npc, choice) { var aff = 0, msg = ''; switch(choice) { case 'wear': aff = 4; msg = '后来她看到你穿着，嘴角微动了一下。'; break; case 'return': aff = 3; msg = '她没接：「你留着。我不冷。」'; break; case 'ignore': aff = 0; msg = '第二天那件薄氅不见了。'; break; } return { affection: aff, msg: msg }; }
    },
    'xl_event_017': { id: 'xl_event_017', npcId: 'sect_leader_修罗宫', title: '桂花糕', icon: '🍪', desc: '你随口说想吃甜的。', minAffection: 20, trigger: { random: 0.3 }, cooldown: 0, flag: 'xl_e017_done', autoTrigger: { timeRange: [6, 10], random: 0.3 },
        scenes: [
            { speaker: 'narrator', text: '你随口说了一句「今天想吃甜的」。', type: 'description' },
            { speaker: 'narrator', text: '晚饭时，你碗边多了一碟桂花糕。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '吃了，很甜', effect: 'eat', affection: 3 },
                { text: '去问她是不是她放的', effect: 'ask', affection: 5 },
                { text: '没碰', effect: 'ignore', affection: -1 }
            ]}
        ],
        effects: function(npc, choice) { var aff = 0, msg = ''; switch(choice) { case 'eat': aff = 3; msg = '她远远看你吃了，转身走了。'; break; case 'ask': aff = 5; msg = '她低头翻文件：「厨房多做的。」——但你看到厨房今天没做桂花糕。'; break; case 'ignore': aff = -1; msg = '后来那碟桂花糕被收走了。'; break; } return { affection: aff, msg: msg }; }
    },
    'xl_event_018': { id: 'xl_event_018', npcId: 'sect_leader_修罗宫', title: '瞒不住的伤', icon: '💊', desc: '你受了伤但瞒着没说。', minAffection: 20, trigger: { random: 0.3 }, cooldown: 0, flag: 'xl_e018_done', autoTrigger: { random: 0.3 },
        scenes: [
            { speaker: 'narrator', text: '你受了点伤，但觉得不严重，没说。', type: 'description' },
            { speaker: 'narrator', text: '当晚你门口出现了一瓶伤药。', type: 'description' },
            { speaker: 'narrator', text: '她知道，但没问。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '用了药，去道谢', effect: 'thank', affection: 5 },
                { text: '默默用药，不提', effect: 'silent', affection: 3 },
                { text: '放着没用', effect: 'ignore', affection: -1 }
            ]}
        ],
        effects: function(npc, choice) { var aff = 0, msg = ''; switch(choice) { case 'thank': aff = 5; msg = '她看了一眼你的伤口：「下次别瞒着。」'; break; case 'silent': aff = 3; msg = '第二天她看到你伤口处理过了，没说话。'; break; case 'ignore': aff = -1; msg = '第三天的药瓶换了一瓶新的——她还是没问。'; break; } return { affection: aff, msg: msg }; }
    },
    'xl_event_019': { id: 'xl_event_019', npcId: 'sect_leader_修罗宫', title: '接你回来', icon: '🚶', desc: '你出远门回来，她去接你了。', minAffection: 25, trigger: { random: 0.3 }, cooldown: 0, flag: 'xl_e019_done', autoTrigger: { random: 0.3 },
        scenes: [
            { speaker: 'narrator', text: '你出远门回来，在门口遇到了绯泪。', type: 'description' },
            { speaker: 'npc', text: '……回来了？' },
            { speaker: 'narrator', text: '她说「正好路过」，但你回来那条路绕了三个弯。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「嗯，回来了。」', effect: 'warm', affection: 4 },
                { text: '「你在等我？」', effect: 'tease', affection: 6 },
                { text: '点头，直接走过去', effect: 'cold', affection: 0 }
            ]}
        ],
        effects: function(npc, choice) { var aff = 0, msg = ''; switch(choice) { case 'warm': aff = 4; msg = '她点了点头，跟在你后面走了一段。'; break; case 'tease': aff = 6; msg = '她停了一下：「……顺路。」但耳朵红了。'; break; case 'cold': aff = 0; msg = '她站在原地，看你的背影走远。'; break; } return { affection: aff, msg: msg }; }
    },
    'xl_event_020': { id: 'xl_event_020', npcId: 'sect_leader_修罗宫', title: '留灯', icon: '🪔', desc: '你值夜时议事厅的灯一直亮着。', minAffection: 30, trigger: { random: 0.3 }, cooldown: 0, flag: 'xl_e020_done', autoTrigger: { timeRange: [21, 3], random: 0.3 },
        scenes: [
            { speaker: 'narrator', text: '你值夜时，议事厅的灯亮着。', type: 'description' },
            { speaker: 'narrator', text: '不是因为她还在——是给你留的。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '心里一暖', effect: 'warm', affection: 3 },
                { text: '去议事厅看看', effect: 'check', affection: 4 },
                { text: '没在意', effect: 'ignore', affection: 0 }
            ]}
        ],
        effects: function(npc, choice) { var aff = 0, msg = ''; switch(choice) { case 'warm': aff = 3; msg = '从那天起，你值夜时灯都会亮着。'; break; case 'check': aff = 4; msg = '议事厅里没人，但桌上有一杯热茶。'; break; case 'ignore': aff = 0; msg = '第二天灯灭了。但第三天又亮了。'; break; } return { affection: aff, msg: msg }; }
    },
    'xl_event_021': { id: 'xl_event_021', npcId: 'sect_leader_修罗宫', title: '殿上的盏', icon: '☕', desc: '议事厅里多了一只杯盏。', minAffection: 35, trigger: { random: 0.2 }, cooldown: 0, flag: 'xl_e021_done', autoTrigger: { random: 0.25 },
        scenes: [
            { speaker: 'narrator', text: '议事厅里多了一只杯盏，和她的那只是一对。', type: 'description' },
            { speaker: 'narrator', text: '她不喝你那只杯子，但你走了之后她会拿起来看一下。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '用那只杯子喝茶', effect: 'use', affection: 4 },
                { text: '假装没注意到', effect: 'ignore', affection: 2 },
                { text: '问她是不是一对的', effect: 'ask', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) { var aff = 0, msg = ''; switch(choice) { case 'use': aff = 4; msg = '她看到你用那只杯子，低头翻文件——但嘴角有弧度。'; break; case 'ignore': aff = 2; msg = '她也没说什么，但那只杯子一直放在那里。'; break; case 'ask': aff = 5; msg = '她抬头看了一眼：「……是。怎么了？」然后又低下头。'; break; } return { affection: aff, msg: msg }; }
    },
    'xl_event_022': { id: 'xl_event_022', npcId: 'sect_leader_修罗宫', title: '怕你冷', icon: '🧣', desc: '冬天她给你披了一件大氅。', minAffection: 40, trigger: { random: 0.3 }, cooldown: 0, flag: 'xl_e022_done', autoTrigger: { random: 0.3 },
        scenes: [
            { speaker: 'narrator', text: '冬天，你站在外面跟人说话。', type: 'description' },
            { speaker: 'narrator', text: '一件大氅从后面披过来，她人已经走远了。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '追上她', effect: 'chase', affection: 5 },
                { text: '裹紧大氅，继续说话', effect: 'wear', affection: 3 },
                { text: '让人把大氅还回去', effect: 'return', affection: -1 }
            ]}
        ],
        effects: function(npc, choice) { var aff = 0, msg = ''; switch(choice) { case 'chase': aff = 5; msg = '你追上她时，她没回头：「穿着。别着凉。」'; break; case 'wear': aff = 3; msg = '后来你发现这件大氅是她的——上面有她的气息。'; break; case 'return': aff = -1; msg = '她没接，转身走了。'; break; } return { affection: aff, msg: msg }; }
    },
    'xl_event_023': { id: 'xl_event_023', npcId: 'sect_leader_修罗宫', title: '热汤', icon: '🥣', desc: '你忙到错过饭点，门口多了一碗热汤。', minAffection: 30, trigger: { random: 0.3 }, cooldown: 0, flag: 'xl_e023_done', autoTrigger: { timeRange: [17, 20], random: 0.3 },
        scenes: [
            { speaker: 'narrator', text: '你忙到错过了饭点。', type: 'description' },
            { speaker: 'narrator', text: '回到房间时，门口放着一碗热汤，旁边压着一张字条。', type: 'description' },
            { speaker: 'narrator', text: '字条上只有两个字：「趁热。」', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '喝了，去还碗', effect: 'drink', affection: 4 },
                { text: '喝了，假装不知道', effect: 'silent', affection: 3 },
                { text: '没喝', effect: 'ignore', affection: -1 }
            ]}
        ],
        effects: function(npc, choice) { var aff = 0, msg = ''; switch(choice) { case 'drink': aff = 4; msg = '她还碗时她看了一眼空碗，什么也没说。'; break; case 'silent': aff = 3; msg = '第二天，又有一碗汤放在门口。'; break; case 'ignore': aff = -1; msg = '第二天没有汤了。'; break; } return { affection: aff, msg: msg }; }
    },
    'xl_event_024': { id: 'xl_event_024', npcId: 'sect_leader_修罗宫', title: '怕黑的路灯', icon: '💡', desc: '你提到过怕黑，之后路灯永远亮着。', minAffection: 45, trigger: { random: 0.2 }, cooldown: 0, flag: 'xl_e024_done', autoTrigger: { random: 0.25 },
        scenes: [
            { speaker: 'narrator', text: '你提到过晚上走路会怕。', type: 'description' },
            { speaker: 'narrator', text: '从那天起，你回房间那条路的路灯永远亮着。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '去问她是不是她让人点的', effect: 'ask', affection: 4 },
                { text: '心里记住', effect: 'remember', affection: 3 },
                { text: '没注意到', effect: 'ignore', affection: 0 }
            ]}
        ],
        effects: function(npc, choice) { var aff = 0, msg = ''; switch(choice) { case 'ask': aff = 4; msg = '她没抬头：「晚上太黑，不安全。」——但修罗宫从来没出过安全问题。'; break; case 'remember': aff = 3; msg = '后来你发现，只要你在修罗宫，那条路的路灯就没灭过。'; break; case 'ignore': aff = 0; msg = '灯一直亮着。'; break; } return { affection: aff, msg: msg }; }
    }
};

// ============ 她的靠近（8件，xl_025~032）——她在主动让你发现 ============
var XIULUO_APPROACH_EVENTS = {
    'xl_event_025': { id: 'xl_event_025', npcId: 'sect_leader_修罗宫', title: '偶然路过', icon: '🚶‍♀️', desc: '她「偶然」出现在你修炼的地方附近。', minAffection: 25, trigger: { random: 0.3 }, cooldown: 0, flag: 'xl_e025_done', autoTrigger: { location: '修罗宫', random: 0.3 },
        scenes: [
            { speaker: 'narrator', text: '你正在修炼，余光瞥到廊下有个人影。', type: 'description' },
            { speaker: 'narrator', text: '你转头看过去——绯泪站在那里，像是在看风景。', type: 'description' },
            { speaker: 'npc', text: '……你继续。我路过。' },
            { speaker: 'narrator', text: '但你多看她一眼，她就走了——第二天她又来了。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '对她笑了一下', effect: 'smile', affection: 4 },
                { text: '「宫主有事吗？」', effect: 'ask', affection: 3 },
                { text: '继续修炼，不理她', effect: 'ignore', affection: 0 }
            ]}
        ],
        effects: function(npc, choice) { var aff = 0, msg = ''; switch(choice) { case 'smile': aff = 4; msg = '她愣了一下，别过脸——但第三天她又来了。'; break; case 'ask': aff = 3; msg = '她摇头：「没有。你练你的。」但她没走。'; break; case 'ignore': aff = 0; msg = '她站了一会儿，走了。'; break; } return { affection: aff, msg: msg }; }
    },
    'xl_event_026': { id: 'xl_event_026', npcId: 'sect_leader_修罗宫', title: '借你书', icon: '📖', desc: '她给你一本功法，说是「多余的」。', minAffection: 30, trigger: { random: 0.3 }, cooldown: 0, flag: 'xl_e026_done', autoTrigger: { random: 0.3 },
        scenes: [
            { speaker: 'narrator', text: '绯泪扔给你一本功法。', type: 'description' },
            { speaker: 'npc', text: '拿着。我多了一本。' },
            { speaker: 'narrator', text: '你翻开，发现里面有她批注的笔记——那是她自己的。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「谢谢，我会认真看的。」', effect: 'thanks', affection: 4 },
                { text: '「这是你的吧？」', effect: 'tease', affection: 5 },
                { text: '收下，没说什么', effect: 'silent', affection: 2 }
            ]}
        ],
        effects: function(npc, choice) { var aff = 0, msg = ''; switch(choice) { case 'thanks': aff = 4; msg = '她点头：「有不懂的来问。」'; break; case 'tease': aff = 5; msg = '她沉默了一下：「……被你看出来了。」然后转身走了。'; break; case 'silent': aff = 2; msg = '她看了你一眼，走了。'; break; } return { affection: aff, msg: msg }; }
    },
    'xl_event_027': { id: 'xl_event_027', npcId: 'sect_leader_修罗宫', title: '她等你', icon: '🌙', desc: '你值夜时她「恰好」也在巡夜。', minAffection: 35, trigger: { random: 0.3 }, cooldown: 0, flag: 'xl_e027_done', autoTrigger: { timeRange: [21, 5], random: 0.3 },
        scenes: [
            { speaker: 'narrator', text: '你值夜时，看到绯泪在不远处「巡夜」。', type: 'description' },
            { speaker: 'narrator', text: '你知道今天不是你一个人值夜——她知道你今天值夜才来的。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '走过去跟她一起走', effect: 'together', affection: 6 },
                { text: '远远点个头', effect: 'nod', affection: 3 },
                { text: '假装没看见', effect: 'ignore', affection: 0 }
            ]}
        ],
        effects: function(npc, choice) { var aff = 0, msg = ''; switch(choice) { case 'together': aff = 6; msg = '她没说话，但你走过来后她放慢了脚步。'; break; case 'nod': aff = 3; msg = '她点了点头，继续「巡夜」。'; break; case 'ignore': aff = 0; msg = '后来你发现她在原地站了一会儿才走。'; break; } return { affection: aff, msg: msg }; }
    },
    'xl_event_028': { id: 'xl_event_028', npcId: 'sect_leader_修罗宫', title: '送点心', icon: '🧁', desc: '她给你带了点心，说是「厨房多做了」。', minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'xl_e028_done', autoTrigger: { timeRange: [14, 18], random: 0.3 },
        scenes: [
            { speaker: 'narrator', text: '绯泪端着一碟点心走过来。', type: 'description' },
            { speaker: 'npc', text: '厨房多做的。你吃了吧。' },
            { speaker: 'narrator', text: '你吃了之后，她嘴角才松下来。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「好吃。」', effect: 'praise', affection: 4 },
                { text: '「谢谢宫主。」', effect: 'polite', affection: 3 },
                { text: '「你吃了吗？」', effect: 'share', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) { var aff = 0, msg = ''; switch(choice) { case 'praise': aff = 4; msg = '她别过脸：「……嗯。」但嘴角是上扬的。'; break; case 'polite': aff = 3; msg = '她点头：「不喜欢就放着。」但你看到她是开心的。'; break; case 'share': aff = 5; msg = '她怔了一下：「我吃过了。」——但她没吃，那是她专门给你留的。'; break; } return { affection: aff, msg: msg }; }
    },
    'xl_event_029': { id: 'xl_event_029', npcId: 'sect_leader_修罗宫', title: '她记得', icon: '💭', desc: '她记得你昨天说过的话。', minAffection: 40, trigger: { random: 0.3 }, cooldown: 0, flag: 'xl_e029_done', autoTrigger: { random: 0.3 },
        scenes: [
            { speaker: 'narrator', text: '你昨天随口说了一件事。', type: 'description' },
            { speaker: 'npc', text: '——你昨天不是说过，想去后山看看？' },
            { speaker: 'narrator', text: '她每一句都记住了。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「你还记得啊。」', effect: 'surprised', affection: 5 },
                { text: '「嗯，有空去。」', effect: 'casual', affection: 3 },
                { text: '「不用了。」', effect: 'refuse', affection: 0 }
            ]}
        ],
        effects: function(npc, choice) { var aff = 0, msg = ''; switch(choice) { case 'surprised': aff = 5; msg = '她没看你：「你说的我都记得。」声音很轻。'; break; case 'casual': aff = 3; msg = '她点了点头，没再说什么。'; break; case 'refuse': aff = 0; msg = '她沉默了一下：「……随你。」'; break; } return { affection: aff, msg: msg }; }
    },
    'xl_event_030': { id: 'xl_event_030', npcId: 'sect_leader_修罗宫', title: '你去哪了', icon: '🚪', desc: '你出去办事回来，她在门边。', minAffection: 50, trigger: { random: 0.3 }, cooldown: 0, flag: 'xl_e030_done', autoTrigger: { location: '修罗宫', random: 0.3 },
        scenes: [
            { speaker: 'narrator', text: '你出去办事回来，看到绯泪站在门边。', type: 'description' },
            { speaker: 'npc', text: '……回来了？' },
            { speaker: 'narrator', text: '不像是「正好」在那里。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「嗯，刚回来。」', effect: 'warm', affection: 4 },
                { text: '「你在等我？」', effect: 'tease', affection: 5 },
                { text: '点头直接走过去', effect: 'cold', affection: 0 }
            ]}
        ],
        effects: function(npc, choice) { var aff = 0, msg = ''; switch(choice) { case 'warm': aff = 4; msg = '她跟在你后面走了几步，然后说：「……厨房有饭。」'; break; case 'tease': aff = 5; msg = '她停了一下：「……没有。正好路过。」但她在那里站了快一个时辰。'; break; case 'cold': aff = 0; msg = '她看着你的背影，没跟上来。'; break; } return { affection: aff, msg: msg }; }
    },
    'xl_event_031': { id: 'xl_event_031', npcId: 'sect_leader_修罗宫', title: '她承认了', icon: '💬', desc: '你说「你在等我吗」，她沉默了三秒。', minAffection: 60, trigger: { random: 0.2 }, cooldown: 0, flag: 'xl_e031_done', autoTrigger: { random: 0.2 },
        scenes: [
            { speaker: 'narrator', text: '绯泪又在「路过」你修炼的地方。', type: 'description' },
            { speaker: 'player_select', text: '你问她：「你在等我吗？」', options: [
                { text: '静静等她回答', effect: 'wait', affection: 6 },
                { text: '开玩笑的语气', effect: 'joke', affection: 4 },
                { text: '「我开玩笑的。」', effect: 'backoff', affection: 2 }
            ]}
        ],
        effects: function(npc, choice) { var aff = 0, msg = ''; switch(choice) { case 'wait': aff = 6; msg = '她沉默了三秒：「……是。」然后转身走了。那是她第一次承认。'; break; case 'joke': aff = 4; msg = '她看了你一眼：「……好笑吗？」但嘴角是松的。'; break; case 'backoff': aff = 2; msg = '她没说话，但你看到她眼里的光暗了一下。'; break; } return { affection: aff, msg: msg }; }
    },
    'xl_event_032': { id: 'xl_event_032', npcId: 'sect_leader_修罗宫', title: '碰你的手', icon: '🤲', desc: '递东西时她的手指不经意碰到你。', minAffection: 70, trigger: { random: 0.3 }, cooldown: 0, flag: 'xl_e032_done', autoTrigger: { random: 0.3 },
        scenes: [
            { speaker: 'narrator', text: '绯泪给你递东西时，手指不经意碰到了你的手。', type: 'description' },
            { speaker: 'narrator', text: '她停了一下，没躲。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '装作没注意，但没抽开', effect: 'stay', affection: 4 },
                { text: '握住她的手', effect: 'hold', affection: 8 },
                { text: '缩回手', effect: 'shrink', affection: -1 }
            ]}
        ],
        effects: function(npc, choice) { var aff = 0, msg = ''; switch(choice) { case 'stay': aff = 4; msg = '她多停了一秒才收回手——那是试探。'; break; case 'hold': aff = 8; msg = '她怔住了，但没有抽开——过了很久，她轻声说：「……你认真的？」'; break; case 'shrink': aff = -1; msg = '她收回手，之后很长一段时间没再「路过」了。'; break; } return { affection: aff, msg: msg }; }
    }
};

// 合并到总事件池
Object.assign(NPC_PERSONAL_EVENTS, XIULUO_EVENTS);
Object.assign(NPC_PERSONAL_EVENTS, XIULUO_CONCUBINE_EVENTS);
Object.assign(NPC_PERSONAL_EVENTS, XIULUO_DISCIPLE_EVENTS);
Object.assign(NPC_PERSONAL_EVENTS, XIULUO_DAILY_EVENTS);
Object.assign(NPC_PERSONAL_EVENTS, XIULUO_APPROACH_EVENTS);

// ============ 结局演出场景定义 ============
var XIULUO_ENDINGS = {
    'xl_ending_共主': {
        id: 'xl_ending_共主', npcId: 'sect_leader_修罗宫', title: '结局·共主', icon: '👑',
        route: '共主',
        scenes: [
            { speaker: 'narrator', text: '绯泪把那根簪子插进你的发髻。', type: 'description' },
            { speaker: 'npc', text: '那说好了。谁先放手，谁就是小狗。' },
            { speaker: 'narrator', text: '她笑了——不是宫主的笑，是少女的笑。', type: 'description' },
            { speaker: 'narrator', text: '第二天，她当众宣布：「从此以后，你的话就是我的话。」', type: 'description' },
            { speaker: 'narrator', text: '你成了修罗宫的副门主——也是她唯一认可的人。', type: 'description' },
        ],
        finalText: '——— 结局·共主（道侣+副门主）———'
    },
    'xl_ending_归心': {
        id: 'xl_ending_归心', npcId: 'sect_leader_修罗宫', title: '结局·归心', icon: '💕',
        route: '归心',
        scenes: [
            { speaker: 'narrator', text: '绯泪把簪子收进怀里，拍了拍。', type: 'description' },
            { speaker: 'npc', text: '……好。你在就行。' },
            { speaker: 'narrator', text: '她不再一个人扛所有事了。因为她知道有人在等她。', type: 'description' },
            { speaker: 'narrator', text: '后来，修罗宫的人都说宫主变了——她会在晚饭前赶回来。', type: 'description' },
        ],
        finalText: '——— 结局·归心（纯道侣）———'
    },
    'xl_ending_比邻': {
        id: 'xl_ending_比邻', npcId: 'sect_leader_修罗宫', title: '结局·比邻', icon: '🤝',
        route: '比邻',
        scenes: [
            { speaker: 'narrator', text: '绯泪握了一下你的手腕，力道很轻。', type: 'description' },
            { speaker: 'npc', text: '……那说好了。' },
            { speaker: 'narrator', text: '她转身看着大殿外的天空，很久。', type: 'description' },
            { speaker: 'npc', text: '你是第一个让我觉得……可以信任的人。' },
            { speaker: 'narrator', text: '后来，你成了修罗宫的副门主。她站在你左边——不是主位，是并肩的位置。', type: 'description' },
        ],
        finalText: '——— 结局·比邻（朋友+副门主）———'
    },
    'xl_ending_归处': {
        id: 'xl_ending_归处', npcId: 'sect_leader_修罗宫', title: '结局·归处', icon: '🏠',
        route: '归处',
        scenes: [
            { speaker: 'narrator', text: '绯泪把簪子收好，笑了一下。', type: 'description' },
            { speaker: 'npc', text: '走吧，去吃饭。' },
            { speaker: 'narrator', text: '她走在前面，脚步比平时轻。', type: 'description' },
            { speaker: 'narrator', text: '后来，你每天都能在修罗宫吃到热饭。她不在大殿的时候，你总能在厨房找到她。', type: 'description' },
        ],
        finalText: '——— 结局·归处（常伴左右）———'
    },
    'xl_ending_霜烬': {
        id: 'xl_ending_霜烬', npcId: 'sect_leader_修罗宫', title: '结局·霜烬', icon: '💔',
        route: '霜烬',
        scenes: [
            { speaker: 'narrator', text: '绯泪没有说再见。', type: 'description' },
            { speaker: 'narrator', text: '你只是发现，她不再看你了。', type: 'description' },
            { speaker: 'narrator', text: '那根断簪——她修好了，又掰断了。', type: 'description' },
            { speaker: 'npc', text: '你我各拿一半，谁也不欠谁。' },
            { speaker: 'narrator', text: '她把半截簪子放在桌上，转身走了。', type: 'description' },
        ],
        finalText: '——— 结局·霜烬（放手）———'
    },
    'xl_ending_修罗': {
        id: 'xl_ending_修罗', npcId: 'sect_leader_修罗宫', title: '结局·修罗', icon: '⚔️',
        route: '修罗',
        scenes: [
            { speaker: 'narrator', text: '绯泪把那根簪子掰断。', type: 'description' },
            { speaker: 'narrator', text: '断裂的声音很轻，但比任何一句话都重。', type: 'description' },
            { speaker: 'npc', text: '——你走吧。以后见面，就是敌人。' },
            { speaker: 'narrator', text: '她没有回头。', type: 'description' },
            { speaker: 'narrator', text: '修罗宫从此不再有「绯泪」——只有修罗女。', type: 'description' },
        ],
        finalText: '——— 结局·修罗（死敌）———'
    }
};

// ============ 触发结局演出 ============
// ============ 结局注册表（v12.3）：支持多NPC各自的结局定义集 ============
var NPC_ENDING_SETS = {};      // npcId → { 结局名: 结局定义 }
var NPC_ENDING_CALLBACKS = {}; // npcId → function(endingName, npc) 结局副作用回调

function registerEndingSet(npcId, endingSet) {
    NPC_ENDING_SETS[npcId] = endingSet;
}
function registerEndingCallback(npcId, cb) {
    NPC_ENDING_CALLBACKS[npcId] = cb;
}

function showEndingScene(endingId, npcId) {
    // v12.3：优先从该NPC的注册结局集查找，回退到修罗宫表（向后兼容）
    var endingSet = (npcId && NPC_ENDING_SETS[npcId]) ? NPC_ENDING_SETS[npcId] : XIULUO_ENDINGS;
    var endingDef = endingSet[endingId] || XIULUO_ENDINGS[endingId];
    if (!endingDef) return;
    var npc = window.npcManager?.getNPC(endingDef.npcId);
    if (!npc) return;
    // 复用事件面板显示结局演出
    showPersonalEventScene(npc, endingDef);
}

// ============ 事件触发状态 ============
var personalEventFlags = {};

function initPersonalEventSystem() {
    // 优先从 GameState 已恢复的全局变量读取
    if (window.personalEventFlags && Object.keys(window.personalEventFlags).length > 0) {
        personalEventFlags = window.personalEventFlags;
    } else {
        // 回退到 localStorage
        var saved = localStorage.getItem('xianxia_personal_event_flags');
        if (saved) {
            try { personalEventFlags = JSON.parse(saved); } catch(e) {}
        }
    }
    // 同步回 window 全局，确保 GameState 后续能读取
    window.personalEventFlags = personalEventFlags;

    // 恢复运行时内存变量（如果 GameState 已恢复，则使用恢复值）
    if (!window._eventCooldowns || Object.keys(window._eventCooldowns).length === 0) {
        window._eventCooldowns = {};
    }
    if (!window._lastInteractDay || Object.keys(window._lastInteractDay).length === 0) {
        window._lastInteractDay = {};
    }
    if (!window._negativeChoiceCount || Object.keys(window._negativeChoiceCount).length === 0) {
        window._negativeChoiceCount = {};
    }

    // 注入 SECT_DEEP_DATA 中定义的门派核心NPC秘密到对应NPC实例
    injectSectSecrets();
    console.log('[个人事件] 系统初始化完成');
}

// 重置个人事件进度（新游戏时调用）
function resetPersonalEventFlags() {
    personalEventFlags = {};
    window.personalEventFlags = {};
    window._eventCooldowns = {};
    window._lastInteractDay = {};
    window._negativeChoiceCount = {};
    if (window.currentCharData) {
        window.currentCharData._npcRoutes = {};
    }
    try { localStorage.removeItem('xianxia_personal_event_flags'); } catch(e) {}
}

function savePersonalEventFlags() {
    // 写入 localStorage（兼容旧方式）
    try { if (window.saveToStorage) { if (!window.saveToStorage('xianxia_personal_event_flags', JSON.stringify(personalEventFlags))) throw new Error('xianxia_personal_event_flags' + ' 未落盘'); } else localStorage.setItem('xianxia_personal_event_flags', JSON.stringify(personalEventFlags)); } catch(e) { console.warn('[静默失败] js/npcs/npc-personal-events.js:1232 · 个人事件标志存档：某条 NPC 感情线的剧情进度没存上，读档后这条线打回原形，玩家以为还挂着的进展全没了', e && e.message); }
    // 同步到 window 全局变量，确保 GameState.collectFullGameState 能读取
    window.personalEventFlags = personalEventFlags;
}

function hasEventTriggered(eventId) {
    return personalEventFlags[eventId] === true;
}

function markEventTriggered(eventId) {
    personalEventFlags[eventId] = true;
    savePersonalEventFlags();
}

// v20.4：个人线资格统一门禁（v18.8 的「须为其门下弟子」已废除）。
// 缘由：八条感情线分踞八派，玩家同时只能入一门——若以「该派弟子身份」为门槛，
// 除本派外的七条线永远不可达，整套多线感情（含吃醋/情敌）形同虚设。
// 现行门槛：①与此人结识过；②人在其所在地（剧情发生在其门内，跨图无法成立）。
// 身份类门槛（侍妾/弟子）只落在各自链的 requireConcubine / requireDisciple 上，不再整线拦人。
// 所在地校验保留在底层：手动触发经对话面板本就同地才非远程，但自动触发（greet）不受 UI 约束，须在此守住。
function getPersonalEventSectId(eventDef) {
    var npcId = eventDef && eventDef.npcId;
    if (typeof npcId !== 'string') return null;
    var prefix = 'sect_leader_';
    return npcId.indexOf(prefix) === 0 ? npcId.slice(prefix.length) : null;
}

function canPlayerAccessPersonalEvent(eventDef, npc) {
    if (!eventDef || !npc || !window.currentCharData) return false;
    var memory = npc.memory || {};
    if (!(memory.firstMet === true || (memory.meetCount || 0) > 0)) return false;

    var sectId = getPersonalEventSectId(eventDef);
    // v20.84 集体戏：灯市/擂台/坊市/大典都不在门派里发生——标了 anyLocation 的事件跳过地点闸
    if (sectId && !eventDef.anyLocation) {
        if ((window.currentCharData.location || '') !== sectId) return false;
    }

    var isConcubine = !!(window.currentCharData.isConcubine || (window.discipleState && window.discipleState.isConcubine));
    if (eventDef.requireConcubine && !isConcubine) return false;
    if (eventDef.requireDisciple) {
        var d = window.discipleState || {};
        if (!d.isInSect || d.sectId !== sectId || isConcubine) return false;
    }
    // v20.2 吃醋事件：需玩家已与另一位女主角缔结表白/道侣，否则不可触发（手动与自动均守此门）
    if (eventDef.requireRivalRomance) {
        if (typeof window.detectRivalRomance !== 'function') return false;
        if (!window.detectRivalRomance(eventDef.npcId)) return false;
    }
    // v20.80 双人对局门禁：指定的来客也得把玩家放在心上——两头都有戏，对局才成立
    if (eventDef.requireGuestFeelings) {
        if (typeof window._jealHasFeelings !== 'function') return false;
        if (!eventDef.guestId || !window._jealHasFeelings(eventDef.guestId)) return false;
    }
    // v20.80 第二条情缘线门禁：世上至少还有一人把玩家放在心上（集体交锋的前提）
    if (eventDef.requireSecondRomance) {
        if (typeof window._jealAllRivals !== 'function') return false;
        if (window._jealAllRivals(eventDef.npcId).length < 1) return false;
    }
    // v20.80 同行嫌疑门禁：队伍里带着另一位江湖人（你带谁来见谁，嫌疑就在谁身上）
    if (eventDef.requirePartyCompanion) {
        if (typeof window._jealPartySuspects !== 'function') return false;
        if (!window._jealPartySuspects(eventDef.npcId)) return false;
    }
    // v20.2 和好事件：需指定的前置事件（如吃醋对峙）已发生过
    if (eventDef.requireEventDone) {
        if (typeof hasEventTriggered !== 'function') return false;
        if (!hasEventTriggered(eventDef.requireEventDone)) return false;
    }
    // v20.2 女修同修语境事件：仅女玩家可触发（同性恋情的社会语境）
    if (eventDef.requirePlayerFemale) {
        if (!window.currentCharData || window.currentCharData.gender !== 'female') return false;
    }
    // v20.2 男修追女掌门语境事件：仅男玩家可触发
    if (eventDef.requirePlayerMale) {
        if (!window.currentCharData || window.currentCharData.gender !== 'male') return false;
    }
    // v20.2 道侣回访：须已与该女主角结为道侣（dao_companion flag）
    if (eventDef.requireDaoCompanion) {
        if (!npc.hasFlag || !npc.hasFlag('dao_companion')) return false;
    }
    // v20.25 撕破脸锁门：拿秘密要挟翻过脸的人，私人线暂闭——
    // 情面养回五成，才肯再单独听你说话；届时旧怨翻篇，门重开（旗随记忆销去）。
    if (npc.hasFlag && npc.hasFlag('leverage_hostile')) {
        var affHostile = (npc.relationship && npc.relationship.affection) || 0;
        if (affHostile < 50) return false;
        try {
            if (npc.relationship && npc.relationship.flags && npc.relationship.flags.delete) npc.relationship.flags.delete('leverage_hostile');
            else if (typeof npc.clearFlag === 'function') npc.clearFlag('leverage_hostile');
        } catch (e) {}
    }
    return true;
}

// ============ 检查事件是否可触发（仅冷却检查） ============
// 链式解锁由 isChainHead 在 renderChain 中处理
function checkEventTrigger(eventDef, player) {
    if (!eventDef || !player) return false;
    if (hasEventTriggered(eventDef.id)) return false;
    
    // 检查冷却（基于游戏天数的冷却）
    if (eventDef.cooldown > 0) {
        var cdKey = 'cd_' + eventDef.id;
        var lastTriggerDay = window._eventCooldowns ? (window._eventCooldowns[cdKey] || 0) : 0;
        var currentDay = window.timeSystem?.gameTime?.currentDay || 0;
        if (lastTriggerDay > 0 && currentDay - lastTriggerDay < eventDef.cooldown) return false;
    }
    
    return true;
}

// ============ 触发事件 ============
function triggerPersonalEvent(eventId) {
    var eventDef = NPC_PERSONAL_EVENTS[eventId];
    if (!eventDef) return false;
    _ensureAmbientTag(eventDef); // v20.25 手动触发也认定日常小事（免手动路径漏标）
    
    var npc = window.npcManager?.getNPC(eventDef.npcId);
    if (!npc) return false;
    // v18.8：即使外部直接调用全局函数，也不能绕过个人线资格。
    if (!canPlayerAccessPersonalEvent(eventDef, npc)) return false;
    
    // 不再立即标记完成，改为事件正常结束后再标记
    // 存储在临时变量中，renderPersonalEventScene 结束时调用
    window._pendingEventComplete = eventId;
    showPersonalEventScene(npc, eventDef);
    return true;
}

// ============ 单页对话流：显示事件（所有对话追加在同一滚动面板中） ============
function showPersonalEventScene(npc, eventDef) {
    var playerName = window.currentCharData?.name || '道友';
    var npcName = npc.name;
    var npcIcon = npc.appearance?.icon || '👤';
    
    // 移除旧的个人事件面板
    var old = document.querySelector('.personal-event-modal');
    if (old) old.remove();
    
    // 创建聊天流面板
    var modal = document.createElement('div');
    modal.className = 'personal-event-modal fixed inset-0 bg-black/85 flex items-center justify-center z-[60]';
    modal.style.backdropFilter = 'blur(4px)';
    modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
    
    var html = '<div class="bg-gray-900 border-2 border-purple-500 rounded-xl p-4 max-w-2xl w-full mx-4 max-h-[88vh] flex flex-col">';
    html += '<div class="flex items-center justify-between mb-3 pb-2 border-b border-gray-700">';
    html += '<div class="flex items-center gap-2">';
    html += '<span class="text-2xl">' + (eventDef.icon || '💬') + '</span>';
    html += '<h3 class="text-lg font-bold text-yellow-500">' + eventDef.title + '</h3>';
    html += '<span class="text-xs text-gray-500">' + (eventDef.desc || '') + '</span>';
    html += '</div>';
    html += '<button onclick="this.closest(\'.personal-event-modal\').remove();" class="text-gray-400 hover:text-white text-2xl">&times;</button>';
    html += '</div>';
    html += '<div id="pe-msg-area" class="flex-1 overflow-y-auto space-y-3 pr-1 mb-2" style="min-height: 320px;"></div>';
    html += '</div>';
    
    modal.innerHTML = html;
    document.body.appendChild(modal);
    
    var msgArea = modal.querySelector('#pe-msg-area');
    
    // 事件状态
    window._currentPersonalEvent = { npc: npc, eventDef: eventDef, msgArea: msgArea, finished: false };

    // v20.80 见面即结识：双人事件开帘前先补关系——动态情敌当场换真名，主客初见当场种社交关系并补一拍旁白
    try { if (window._jealOnSceneShow) window._jealOnSceneShow(npc, eventDef); } catch (e) {}

    renderPersonalEventScene(0);
}

// 渲染单个场景（追加到对话流）
function renderPersonalEventScene(index) {
    var ev = window._currentPersonalEvent;
    if (!ev || ev.finished) return;
    var eventDef = ev.eventDef;
    var scene = eventDef.scenes[index];
    if (!scene) {
        // 事件正常结束：标记完成
        appendPEMessage('system', '—— 事件结束 ——');
        ev.finished = true;
        // 在事件正常结束时才标记完成
        if (window._pendingEventComplete) {
            markEventTriggered(window._pendingEventComplete);
            window._pendingEventComplete = null;
        }
        // v20.25 私人相处占时辰：主线大事件一场要耗去大半日——递盏茶不记账，赴一场心事要时辰。
        var _finEv = ev.eventDef;
        var _finNpc = ev.npc || {};
        if (_finEv && !_finEv.ambient && window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
            try { window.timeSystem.advanceTime(20, '与' + (_finNpc.name || '故人') + '的相处'); } catch (e) {}
        }
        // v20.25 日常事件重入：记下这桩小事发生的日头（存 NPC 记忆，随档走），隔够日子才会再遇
        if (_finEv && _finEv.ambient && _finNpc) {
            try {
                if (!_finNpc.memory) _finNpc.memory = {};
                if (!_finNpc.memory._ambientLastDay) _finNpc.memory._ambientLastDay = {};
                var _ambToday = (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') ? (Number(window.timeSystem.getAbsoluteDay()) || 0) : 0;
                _finNpc.memory._ambientLastDay[_finEv.id] = _ambToday;
            } catch (e) {}
        }
        return;
    }

    var npc = ev.npc;
    var npcName = npc.name;
    var npcIcon = npc.appearance?.icon || '👤';
    var playerName = window.currentCharData?.name || '道友';
    var playerTa = (window.currentCharData && window.currentCharData.gender === 'female') ? '她' : '他';
    var playerTaPoss = (window.currentCharData && window.currentCharData.gender === 'female') ? '她的' : '他的';

    if (scene.speaker === 'narrator') {
        appendPEMessage('narrator', scene.text.replace(/{playerName}/g, playerName).replace(/{npc_name}/g, npcName).replace(/{playerTa}/g, playerTa).replace(/{playerTaPoss}/g, playerTaPoss));
        ev._nextIndex = index + 1;
        setTimeout(function() { renderPersonalEventScene(ev._nextIndex); }, 350);
    } else if (scene.speaker === 'npc') {
        // v20.80 双人同框：场景标了 asNpc（第二位人物 id）就以 Ta 的名号头像开口气泡（琥珀色，与主人家的粉色区分）
        var _spIcon = npcIcon, _spName = npcName, _spType = 'npc';
        if (scene.asNpc && typeof window._jealGuestInfo === 'function') {
            var _gInfo = window._jealGuestInfo(scene.asNpc);
            if (_gInfo) { _spIcon = _gInfo.icon; _spName = _gInfo.name; _spType = 'npc2'; }
        }
        appendPEMessage(_spType, scene.text.replace(/{playerName}/g, playerName).replace(/{npc_name}/g, npcName).replace(/{as_name}/g, _spName).replace(/{playerTa}/g, playerTa).replace(/{playerTaPoss}/g, playerTaPoss), _spIcon, _spName, scene.emotion);
        ev._nextIndex = index + 1;
        setTimeout(function() { renderPersonalEventScene(ev._nextIndex); }, 450);
    } else if (scene.speaker === 'player_select') {
        var optionsHtml = '<div class="bg-gray-700/50 p-3 rounded-lg border border-gray-600"><p class="text-sm text-gray-300 mb-2">' + scene.text.replace(/{playerName}/g, playerName).replace(/{playerTa}/g, playerTa).replace(/{playerTaPoss}/g, playerTaPoss) + '</p><div class="space-y-2">';
        scene.options.forEach(function(opt, oi) {
            optionsHtml += '<button onclick="handlePersonalEventChoice(' + index + ',' + oi + ')" class="w-full text-left p-2.5 bg-gray-700 hover:bg-gray-600 hover:border-yellow-500 rounded-lg border border-gray-600 text-sm text-gray-200 transition-colors">' + opt.text.replace(/{playerName}/g, playerName).replace(/{playerTa}/g, playerTa).replace(/{playerTaPoss}/g, playerTaPoss) + '</button>';
        });
        optionsHtml += '</div></div>';
        appendPEMessage('choice', optionsHtml);
    }
}

// 追加一条消息到对话流
function appendPEMessage(type, content, npcIcon, npcName, emotion) {
    var ev = window._currentPersonalEvent;
    if (!ev) return;
    var msgArea = ev.msgArea;
    
    var div = document.createElement('div');
    if (type === 'narrator') {
        div.className = 'bg-gray-800/60 p-3 rounded-lg border-l-4 border-gray-500';
        div.innerHTML = '<p class="text-gray-400 text-sm italic">' + content + '</p>';
    } else if (type === 'npc' || type === 'npc2') {
        // v20.80 npc2 = 双人同框里第二位的说话气泡（琥珀色左边框），主人家仍是粉色
        var _bdColor = (type === 'npc2') ? 'border-amber-500' : 'border-pink-500';
        var _nmColor = (type === 'npc2') ? 'text-amber-300' : 'text-pink-400';
        div.className = 'bg-gray-700/50 p-3 rounded-lg border-l-4 ' + _bdColor;
        var emotionHtml = '';
        if (emotion) {
            var emotionMap = { 'hesitant': '😅 犹豫', 'neutral': '😐 平静', 'friendly': '😊 友好', 'warm': '😌 温和', 'happy': '😄 开心', 'grateful': '🥺 感激', 'serious': '😑 严肃', 'deep': '😔 深邃', 'determined': '😤 坚定', 'generous': '😊 慷慨', 'solemn': '😐 庄重' };
            emotionHtml = '<span class="text-xs text-gray-400">' + (emotionMap[emotion] || emotion) + '</span>';
        }
        div.innerHTML = '<div class="flex items-center gap-2 mb-1"><span class="text-xl">' + (npcIcon || '👤') + '</span><span class="text-sm font-bold ' + _nmColor + '">' + (npcName || '') + '</span><span class="ml-auto">' + emotionHtml + '</span></div><p class="text-gray-200 text-sm">' + content + '</p>';
    } else if (type === 'choice') {
        div.className = 'my-1';
        div.innerHTML = content;
    } else {
        div.className = 'text-center py-2';
        div.innerHTML = '<p class="text-gray-500 text-xs">' + content + '</p>';
    }
    
    msgArea.appendChild(div);
    // 自动滚动到底部
    msgArea.scrollTop = msgArea.scrollHeight;
}

// ============ v26.9 NPC 事件后果受控枚举（609 个裸 effect 取值 → 8 类真实结算） ============
// 病根：2818 个选项的 effect 是裸字符串、609 个不同取值，引擎层不认任何取值——
//       每个事件自带 effects() 闭包 switch(choice)，漏一个 case 就静默什么都不发生；
//       实测 938 个闭包只回 affection/msg，直接写 npc 的只有 trust（540 个选项，19.2%）。
//       hatred / favor / respect / love / fear 五轨 **零闭包触碰**，全是空闲账。
// 修法：给 effect 定 8 类受控类型，每类有真实结算；未登记的走兼容层（只改好感）并告警。
// 零骰：全部为确定性写入，无 Math.random。

// ---- 空闲账本探针 ----
function _peRel(npc) { return (npc && npc.relationship) ? npc.relationship : null; }
// 夹取写入，返回**实际**变化量（0 底轨在 0 处写入返回 0，据此换账或如实说明，不假装生效）
function _peBump(npc, track, delta) {
    var rel = _peRel(npc);
    if (!rel || !delta) return 0;
    var lo = (track === 'affection') ? -100 : 0;
    var before = Number(rel[track]);
    if (!isFinite(before)) before = 0;
    var after = Math.max(lo, Math.min(100, before + delta));
    rel[track] = after;
    return after - before;
}
// 玩家账（知情账/欠账/路线账）：window.eventFlags 随存档走（core/game-state.js:481 存、:805 清）
function _peLedger(bucket, key, n) {
    if (!window.eventFlags || typeof window.eventFlags !== 'object') window.eventFlags = {};
    var k = bucket + '_' + key;
    var v = (Number(window.eventFlags[k]) || 0) + n;
    window.eventFlags[k] = v;
    return v;
}
function _peSign(n) { return (n > 0 ? '+' : '') + n; }

// 启途接线：从事件定义里把这个 effect 取值对应的选项原话找出来（启途要把「约」记进档）
// 找不到就返回空串——记档那一步会跳过，不硬编一句假话。
function _peOptionText(eventDef, value) {
    if (!eventDef || !Array.isArray(eventDef.scenes)) return '';
    for (var i = 0; i < eventDef.scenes.length; i++) {
        var os = eventDef.scenes[i] && eventDef.scenes[i].options;
        if (!os || !os.length) continue;
        for (var j = 0; j < os.length; j++) {
            if (os[j] && os[j].effect === value && typeof os[j].text === 'string') return os[j].text;
        }
    }
    return '';
}
function _peNeg(npcId) {
    if (!window._negativeChoiceCount) window._negativeChoiceCount = {};
    window._negativeChoiceCount[npcId] = (window._negativeChoiceCount[npcId] || 0) + 1;
}

// ---- 8 类受控类型。每类 settle() 必须写进真账本，且对不同取值给出可测的不同结果 ----
var NPC_EFFECT_KINDS = {
    // ① 立誓：守诺 / 应下 / 坦白 / 专一 / 担责 —— 信任轨 + 承诺旗落笔（旗随存档走）
    pledge: {
        label: '立誓', icon: '🤝',
        settle: function (c) {
            var w = c.w, lines = [];
            var d = c.guard.trustTouched ? 0 : _peBump(c.npc, 'trust', w);
            var flag = 'pe_pledge_' + c.value;
            if (c.npc && typeof c.npc.setFlag === 'function') c.npc.setFlag(flag);
            var n = _peLedger('pe_pledge', c.npcId, 1);
            if (d > 0) lines.push({ icon: '🤝', text: '信任 ' + _peSign(d), tone: 'good' });
            else if (c.guard.trustTouched) lines.push({ icon: '🤝', text: '信任已另有账在记（不重复计）', tone: 'flat' });
            else lines.push({ icon: '🤝', text: '信任已满，未再动', tone: 'flat' });
            lines.push({ icon: '📌', text: '承诺落笔：' + flag + '（第 ' + n + ' 桩）', tone: 'mark' });
            return { deltas: { trust: d }, lines: lines };
        }
    },
// ② 温存：亲近 / 照料 / 同行 / 玩笑 —— 爱意轨 + 情分轨
    // 四个子分支走**不同账本配比**：玩笑只混熟不心；亲昵走爱意；同行走情分；照料两样都顾。
    // 不拆分支的话 130 个取值会落成同一笔账——那就是换了说法的假选择。
    warmth: {
        label: '温存', icon: '🫧',
        settle: function (c) {
            var w = c.w, br = c.branch, lines = [], d = {};
            var dlWant, dfWant, 说;
            if (br === 'tease') {            // 打趣玩笑：混熟，不动心
                dlWant = 0; dfWant = w;
                说 = '玩笑只换熟，不换心';
            } else if (br === 'close') {      // 亲昵：走爱意
                dlWant = 2 * w; dfWant = w;
                说 = '这一下近了';
            } else if (br === 'along') {      // 同行：走情分
                dlWant = w; dfWant = 2 * w;
                说 = '同路一段，情分记着';
            } else {                          // 照料：两样都顾（默认）
                dlWant = w; dfWant = 2 * w;
                说 = '照料之功，两样都记';
            }
            var dl = (dlWant && !c.guard.loveTouched) ? _peBump(c.npc, 'love', dlWant) : 0;
            var df = _peBump(c.npc, 'favor', dfWant);
            d.love = dl; d.favor = df;
            lines.push({ icon: '🫧', text: 说, tone: 'flat' });
            if (dlWant && dl > 0) lines.push({ icon: '💗', text: '爱意 ' + _peSign(dl), tone: 'good' });
            else if (dlWant && c.guard.loveTouched) lines.push({ icon: '💗', text: '爱意已另有账在记（不重复计）', tone: 'flat' });
            else if (dlWant) lines.push({ icon: '💗', text: '爱意已满，未再动', tone: 'flat' });
            if (df > 0) lines.push({ icon: '🎁', text: '情分 ' + _peSign(df), tone: 'good' });
            else lines.push({ icon: '🎁', text: '情分已满，未再动', tone: 'flat' });
            return { deltas: d, lines: lines };
        }
    },
    // ③ 敬服：请教 / 挺身 / 居中 / 精进 —— 敬重轨 + 「护过她 / 居过中」两本专项旗
    respect: {
        label: '敬服', icon: '🎖',
        settle: function (c) {
            var br = c.branch, lines = [], 倍 = 1;
            if (br === 'shield') {           // 挺身护短：敬重翻倍，并落「护过她」旗
                倍 = 2;
                if (c.npc && typeof c.npc.setFlag === 'function') c.npc.setFlag('pe_shielded_' + c.npcId);
                lines.push({ icon: '🛡', text: '这一下是替她挡的，她记着', tone: 'mark' });
            } else if (br === 'mediate') {   // 居中调停：落「居中」旗
                if (c.npc && typeof c.npc.setFlag === 'function') c.npc.setFlag('pe_broker_' + c.npcId);
                lines.push({ icon: '🤝', text: '替两边说话的人，她记着', tone: 'mark' });
            }
            var d = _peBump(c.npc, 'respect', c.w * 倍);
            lines.push({
                icon: '🎖',
                text: d > 0 ? '敬重 ' + _peSign(d) : '敬重已满，未再动',
                tone: d > 0 ? 'good' : 'flat'
            });
            if (d <= 0) {
                var n = _peLedger('pe_learned', c.npcId, 1);
                lines.push({ icon: '📖', text: '敬重已满，转记受教：第 ' + n + ' 次', tone: 'mark' });
            }
            return { deltas: { respect: d }, lines: lines };
        }
    },
    // ④ 得知：探问 / 记事 / 读文 / 受托盯看 —— 知情账（eventFlags，别的系统可读）+ NPC 记忆印象
    insight: {
        label: '得知', icon: '🔎',
        settle: function (c) {
            var key = c.npcId + '_' + c.value;
            var n = _peLedger('pe_know', key, 1);
            var mem = (c.npc && c.npc.memory) ? c.npc.memory : null;
            var before = (mem && mem.impressions) ? (Number(mem.impressions['pe_insight_' + c.value]) || 0) : 0;
            if (mem && mem.impressions) mem.impressions['pe_insight_' + c.value] = before + 1;
            return {
                deltas: { know: n },
                lines: [
                    { icon: '🔎', text: '知情账：' + key + ' 第 ' + n + ' 回', tone: 'know' },
                    { icon: '🧠', text: '她记下这一问（印象 ' + (before + 1) + ' 次）', tone: 'mark' }
                ]
            };
        }
    },
// ⑤ 结怨：四个子分支走**不同账本组合**（嘲讽伤敬重 / 伤人留恐惧 / 背叛砸信任 / 争执两败）
    // 分支保证可辨：每支都往 eventFlags 记一本**专属名字**的账（轻重蔑/伤人/背弃/争执），
    // 不靠 0 底轨凑差别——敬重/信任在 0 处减不动是事实，那种情形下如实说明而不是假装减了。
    spite: {
        label: '结怨', icon: '🥀',
        settle: function (c) {
            var w = c.w, br = c.branch || 'humiliate', lines = [], d = {};
            if (br === 'humiliate') {          // 嘲讽：她不怕你，只是不屑你
                d.hatred = _peBump(c.npc, 'hatred', w);
                d.respect = _peBump(c.npc, 'respect', -w);
                var ns = _peLedger('pe_slight', c.npcId, 1);
                lines.push({ icon: '🥀', text: '怨 ' + _peSign(d.hatred) + '（轻蔑不为敬）', tone: 'bad' });
                lines.push({
                    icon: '🎖',
                    text: d.respect < 0 ? '敬重 ' + _peSign(d.respect) : '她本来就没敬重过你，轻蔑减无可减',
                    tone: d.respect < 0 ? 'bad' : 'flat'
                });
                lines.push({ icon: '🪨', text: '轻蔑账：第 ' + ns + ' 回', tone: 'mark' });
            } else if (br === 'harm') {        // 伤人：她怕了
                d.hatred = _peBump(c.npc, 'hatred', w);
                d.fear = _peBump(c.npc, 'fear', w);
                var nh = _peLedger('pe_hurt', c.npcId, 1);
                lines.push({ icon: '🥀', text: '怨 ' + _peSign(d.hatred), tone: 'bad' });
                lines.push({ icon: '😨', text: '惧 ' + _peSign(d.fear) + '（她记住这一下了）', tone: 'bad' });
                lines.push({ icon: '🩸', text: '伤人账：第 ' + nh + ' 回', tone: 'mark' });
            } else if (br === 'betray') {      // 背叛 / 闪躲：伤的是信任
                d.hatred = _peBump(c.npc, 'hatred', Math.ceil(w / 2));
                d.trust = c.guard.trustTouched ? 0 : _peBump(c.npc, 'trust', -w);
                if (c.npc && typeof c.npc.setFlag === 'function') c.npc.setFlag('pe_betray_' + c.value);
                var nb = _peLedger('pe_broke', c.npcId, 1);
                lines.push({ icon: '🥀', text: '怨 ' + _peSign(d.hatred), tone: 'bad' });
                lines.push({
                    icon: '🤝',
                    text: c.guard.trustTouched ? '信任已另有账在记（不重复计）'
                        : (d.trust < 0 ? '信任 ' + _peSign(d.trust) : '信任本就是空的——这一回伤不到它，只有怨'),
                    tone: 'bad'
                });
                lines.push({ icon: '🚩', text: '背弃留痕：pe_betray_' + c.value + '（第 ' + nb + ' 回）', tone: 'mark' });
            } else {                            // quarrel 争执：两败俱伤
                d.hatred = _peBump(c.npc, 'hatred', w);
                d.respect = _peBump(c.npc, 'respect', -w);
                d.trust = c.guard.trustTouched ? 0 : _peBump(c.npc, 'trust', -Math.ceil(w / 2));
                var nq = _peLedger('pe_quarrel', c.npcId, 1);
                lines.push({ icon: '🥀', text: '怨 ' + _peSign(d.hatred), tone: 'bad' });
                lines.push({
                    icon: '🎖',
                    text: d.respect < 0 ? '敬重 ' + _peSign(d.respect) : '敬重减无可减（她从未敬重过你）',
                    tone: d.respect < 0 ? 'bad' : 'flat'
                });
                lines.push({
                    icon: '🤝',
                    text: c.guard.trustTouched ? '信任已另有账在记（不重复计）'
                        : (d.trust < 0 ? '信任 ' + _peSign(d.trust) : '信任减无可减'),
                    tone: 'bad'
                });
                lines.push({ icon: '⚔', text: '争执账：第 ' + nq + ' 回', tone: 'mark' });
            }
            return { deltas: d, lines: lines };
        }
    },
// ⑥ 付价：三种真资源（灵石 / 精力 / 精力+她怕）；出力再分「真出力 / 跑腿 / 采集」三档代价
    cost: {
        label: '付价', icon: '⚖',
        settle: function (c) {
            var w = c.w, br = c.branch || 'labor', sub = c.sub || '', cd = window.currentCharData, lines = [], d = {};
            function 付精力(耗, 涉险) {
                var paid = (typeof window._payCost === 'function') ? window._payCost('energy', 耗) : { ok: false, why: 'no_pay_api' };
                d.energy = (paid && paid.ok) ? -耗 : 0;
                if (paid && paid.ok) {
                    lines.push({ icon: 涉险 ? '🩸' : '🔋', text: (涉险 ? '涉险：' : '') + '精力 −' + 耗, tone: 'cost' });
                } else {
                    _peLedger('pe_debt', c.npcId, 耗); _peNeg(c.npcId);
                    lines.push({ icon: '⚖', text: '精力不足（' + ((paid && paid.why) || 'unknown') + '），欠下 ' + 耗 + '，负账 +1', tone: 'cost' });
                }
                return paid;
            }
            if (br === 'coin') {
                var have = cd ? (Number(cd.spiritStones) || 0) : 0;
                if (cd && have >= w) {
                    cd.spiritStones = have - w; d.spiritStones = -w;
                    lines.push({ icon: '💰', text: '灵石 −' + w + '（余 ' + cd.spiritStones + '）', tone: 'cost' });
                } else {
                    _peLedger('pe_debt', c.npcId, w); _peNeg(c.npcId);
                    lines.push({ icon: '⚖', text: '灵石不足（余 ' + have + '），欠下 ' + w + '，负账 +1', tone: 'cost' });
                }
            } else if (br === 'risk') {
                付精力(w, true);
                d.fear = _peBump(c.npc, 'fear', Math.ceil(w / 2));
                lines.push({ icon: '😨', text: '惧 ' + _peSign(d.fear), tone: 'bad' });
            } else { // labor：真出力 / 跑腿（折半）/ 采集（另记一本采得账）
                if (sub === 'errand') {
                    var 半 = Math.max(1, Math.ceil(w / 2));
                    付精力(半, false);
                    lines.push({ icon: '🏃', text: '跑腿一趟，耗 ' + 半 + '（比真出大力轻）', tone: 'mark' });
                } else if (sub === 'gather') {
                    付精力(w, false);
                    var ng = _peLedger('pe_gather', c.npcId, 1);
                    lines.push({ icon: '🧺', text: '采得账：第 ' + ng + ' 趟（东西进了她的库，不进你的囊）', tone: 'mark' });
                } else {
                    付精力(w, false);
                }
            }
            return { deltas: d, lines: lines };
        }
    },
    // ⑦ 疏离：冷落 / 离场 / 回绝定缘 —— 三支走不同账（爱意为 0 时如实说明，不假装减了）
    distance: {
        label: '疏离', icon: '🚪',
        settle: function (c) {
            var w = c.w, br = c.branch, lines = [], d = {};
            var 怨增 = (br === 'refuse') ? w : Math.ceil(w / 2);
            d.hatred = _peBump(c.npc, 'hatred', 怨增);
            var dl = c.guard.loveTouched ? 0 : _peBump(c.npc, 'love', -w);
            d.love = dl;
            var 说;
            if (br === 'ignore') 说 = '当没看见——这一下连话都省了';
            else if (br === 'leave') 说 = '转身就走——她记的是那道背影';
            else if (br === 'refuse') 说 = '把话说绝了——不是冷淡，是回绝';
            else 说 = '疏远留痕';
            lines.push({ icon: '🚪', text: 说 + '：怨 ' + _peSign(d.hatred), tone: 'bad' });
            lines.push({
                icon: '🫧',
                text: dl < 0 ? '爱意 ' + _peSign(dl)
                    : (c.guard.loveTouched ? '爱意已另有账在记（不重复计）' : '爱意本就是空的（冷落落不到账上，只落怨）'),
                tone: dl < 0 ? 'bad' : 'flat'
            });
            if (br === 'refuse') {
                if (c.npc && typeof c.npc.setFlag === 'function') c.npc.setFlag('pe_refused_' + c.npcId);
                lines.push({ icon: '🚩', text: '已回绝留痕：pe_refused_' + c.npcId + '（往后这场线按回绝过算）', tone: 'mark' });
            } else if (br === 'leave') {
                var nl = _peLedger('pe_coldwalk', c.npcId, 1);
                lines.push({ icon: '👣', text: '冷脚印：第 ' + nl + ' 回', tone: 'mark' });
            }
            return { deltas: d, lines: lines };
        }
    },
// ⑧ 启途：把这一桩钉成「往后算数」的标记 —— 关系旗（hasFlag 可读）+ 路线账（eventFlags 随存档走）
    // 启途接线：原写法只留一个名字，读侧拿不到「约」的内容，玩家在后续对话里也无从看见这条路。
    //   现在多记一本注记账——把玩家自己按下的那句原话存进 eventFlags（随存档走），
    //   读侧 openRouteLabel() 才有话可说；并且旗第一次落与重落给不同的回执（玩家看得出差别）。
    open: {
        label: '启途', icon: '🧭',
        settle: function (c) {
            var flag = peOpenFlagName(c.npcId, c.value);
            var 首落 = !(c.npc && typeof c.npc.hasFlag === 'function' && c.npc.hasFlag(flag));
            if (c.npc && typeof c.npc.setFlag === 'function') c.npc.setFlag(flag);
            var v = _peLedger('pe_route', c.npcId, 1);
            var lines = [
                { icon: '🧭', text: (首落 ? '路线已开：' : '这条路你又走了一遍：') + flag, tone: 'mark' },
                { icon: '🗺️', text: '这条路往后算数（第 ' + v + ' 次开路）', tone: 'mark' }
            ];
            // 注记账：记下「约」的原话。已有注记不覆写——第一次说的才是那桩约。
            var noteKey = peOpenNoteKey(c.npcId, c.value);
            var note = (c.choiceText || '').replace(/\s+/g, ' ').slice(0, 60);
            if (!window.eventFlags || typeof window.eventFlags !== 'object') window.eventFlags = {};
            if (!window.eventFlags[noteKey] && note) {
                window.eventFlags[noteKey] = note;
                lines.push({ icon: '📜', text: '约的原话已记进档（往后读档还在）：' + note, tone: 'mark' });
            } else if (window.eventFlags[noteKey]) {
                lines.push({ icon: '📜', text: '这一约头一回说的是：' + window.eventFlags[noteKey], tone: 'flat' });
            }
            // 头一回落旗时给一点分量：往后再撞见同一条路不会重复给（首落判定）
            var d = {};
            if (首落 && c.npc) {
                d.trust = _peBump(c.npc, 'trust', 1);
                lines.push({
                    icon: '🤝',
                    text: d.trust > 0 ? '立约之人，她记你一笔信任 +' + d.trust : '立约之人，她记下这一笔（信任已满，未再动）',
                    tone: d.trust > 0 ? 'good' : 'flat'
                });
            }
            return { deltas: d, lines: lines };
        }
    }
};

// ---- 609 取值 → 'kind' 或 'kind:branch'（逐条按选项实际文义归类，非正则猜） ----
var NPC_EFFECT_SPEC = {
    pledge:
        'vow promise keep accept trust vouch remember determined declare take_blame mutual only present both_hands both_fire ' +
        'seal sign host_sign guest_file mark record file ritual fix tell admit yes own reassure side take return cover witness ' +
        'both obey wear sheath anchor token rosin wick sword let beads third glove seed gui banner anchorline keep_half bead ' +
        'pledge apprentice book drink_promise send_token suppress trust_me confess',
'warmth:close':
        'hold touch hug hand lean sit sleep close nod leg share stay',
    'warmth:along':
        'accompany walk go join visit follow escort ferry boat carry drag together wait',
    'warmth:tease':
        'tease jest joke banter play light_now',
    warmth:
        'care warm tea watch tend comfort escort together silent lamp ink treat ' +
        'friend_stay lover_stay lover_travel friend_travel friend_carry friend_rest friend_spar lover_carry lover_rest ' +
        'eat feed feed_true porridge soup drink wine honey sweet help aid assist quiet mute worry concern relief hope ' +
        'soothe use water lantern join cloak call dawn meet comb smile alive tired beautiful more flower kitchen ' +
        'stool half come heal robe roof lamps ease bag box child man kin help_wrap shoulder calm bend pick meal catch ' +
        'give stitch thread shell gear needle gentle soft mirror dance taste mother vigil rest mend brace face hot drug ' +
        'wipe light rewalk first seat wood lover fill game feel live ' +
        'afar bandage greet offer steward save silent_do take_needle',
'respect:shield': 'shield defend guard stand protect rally rescue',
    'respect:mediate': 'mediate convey clerk counter',
    respect:
        'learn teach praise respect study practice diligent drill prep prepare endure work carve forge master manage ' +
        'guide persuade compete position defer amend solve finish find thanks self back steady shout salute kneel focus brave careful ' +
        'choose prove apologize polite thank bow prize her_choice fear_ok solemn proud smooth bridge plan duty defy ' +
        'craft hands humble honor safe train vigil',
    insight:
        'ask why how what where who ask_bead ask_blank ask_cloth ask_damo ask_doc ask_heng ask_note ask_page ask_qin ask_rule ' +
        'ask_wd ask_zhu ask_zhupi probe honest truth origin verify check reason dontknow depends read read_count read_loud ' +
        'read_name read_pine read_trust read_wait word words scribe page note annotate copy translate point count understand ' +
        'clear see look story talk speak reckon hear guess doubt believe press answer heart name echo starter report break worth ' +
        'peek letter surprised scent chance unfair who_for qi conch test same howlong reverse shock debate bluff real fit ' +
        'reef pen keel chess thin thick lead trace pass split valve weir tags tag format rules code channel law annex account ' +
        'drum dry shelf relay listen whistle curious search replace skim knock mention right different you sign signal caller ' +
        'write plain fear rubbing seek flip gap line blank public snake callout fault who_win match straw windward throat ' +
        'street rule smoke say acknowledge straight draw aside recipe ' +
        'ask_carve ask_fourth ask_friend ask_later direct delivery name_it remember_date route cost fair ' +
        'blame_gap reframe thanks_owed silent_test breakthrough',
    'spite:humiliate': 'mock mock_neg scoff sneer taunt jeer laugh laugh_neg cruel worthless useless sloppy dark scorn insult hate hate_now leech',
    'spite:harm': 'grab grab_neg stab rip tear burn blood pain snap shut douse snatch force',
    'spite:betray': 'deny deflect lie flee desert sneak snoop leak erase undo remove unmask forget cross sell_neg buy_neg ' +
        'stall_neg obey_neg push_neg leave_neg shrug_neg tease_neg tool_neg bowl_neg dilute excuse',
    'spite:quarrel': 'argue complain blame rebuke scold accuse',
    'cost:coin': 'pay price buy pawn haggle exchange swap trade lend bet debt cheap double triple two stall sell',
'cost:labor:errand': 'fetch deliver run sweep sail shift',
    'cost:labor:gather': 'gather sort sift fish weed brew cook boil charcoal clay coal grain oil salvage',
    'cost:labor': 'haul climb dive wade dig labor carry chain rope runner basket redo herd allnight drive mount tour ' +
        'wind bellows hook stack salt burn_too pluck callus stone gild hammer pole',
    'cost:risk': 'spar chase rush intercept dash fire blast breach ride cut hurry strike fireline barehand destroy trick',
    'cost:coin': 'pay price buy pawn haggle exchange swap trade lend bet debt cheap double triple two stall sell',
    'distance:ignore':
        'ignore dumb casual skip never untouched drop normal shrug dump bow_out mimic',
    'distance:leave':
        'leave leave_neg leave_with quit retreat out alone others other_way avoid independent giveup partial dodge backoff',
    'distance:refuse':
        'refuse cold dismiss no_love miss none hesitate leftover enough fall up neutral stop slow hide bitter regret ' +
        'shrink push loss notest',
    open: 'unseal friend again enter continue year boat side_guest side_host cheer_guest cheer_host host_first host_ans ' +
        'wait_glove take_chopsticks hisbowl newpair glove_on refire light_now returnwhistle allin add rival wujiu daily ' +
        'companion next shore ferry defect redeem third_way disciples vessel'
};

// 同类内不同取值的权重差异（未列者取 kind 默认权重）
var NPC_EFFECT_WEIGHTS = {
    vow: 3, promise: 3, only: 3, present: 3, seal: 3, mutual: 3, tell: 3, reassure: 3, cover: 3, witness: 3, both: 3,
    lover_travel: 4, lover_carry: 4, lover_stay: 3, friend_travel: 3, friend_stay: 3, friend_rest: 3, hug: 3, hold: 2,
    stay: 2, share: 2, care: 2, silent: 1, wait: 2, lamp: 2,
    rescue: 3, shield: 3, defend: 3, rally: 3, guard: 2, learn: 2, teach: 2, praise: 2, respect: 2, mediate: 3, convey: 2,
    ask: 1, probe: 2, honest: 2, admit: 2, press: 2, answer: 2, read: 1,
    stab: 4, grab: 3, tear: 3, rip: 3, burn: 3, force: 3, hurt: 3,
    betray: 4, deny: 3, deflect: 2, lie: 3, unmask: 3, forget: 2,
    mock: 3, taunt: 3, sneer: 2, jeer: 2, argue: 3, accuse: 2, hate: 3,
    pay: 3, buy: 3, price: 3, bet: 3, cheap: 1, double: 2,
    spar: 3, ambush: 4, fire: 3, blast: 3, cut: 3, chase: 2,
    refuse: 3, ignore: 2, dismiss: 3, quit: 3, giveup: 3, retreat: 2, cold: 2, none: 3, alone: 3, no_love: 3, others: 3,
    friend: 3, none_o: 3
};
var NPC_EFFECT_DEFAULT_W = { pledge: 2, warmth: 1, respect: 2, insight: 1, spite: 2, cost: 2, distance: 2, open: 1 };

var NPC_EFFECT_MAP = (function () {
    var map = {};
    for (var k in NPC_EFFECT_SPEC) {
        var list = String(NPC_EFFECT_SPEC[k]).split(/\s+/);
        for (var i = 0; i < list.length; i++) {
            if (!list[i]) continue;
            map[list[i]] = k;
        }
    }
    return map;
})();

// 兼容层台账：未登记取值走原路径（只改好感），每个取值只告警一次（可逐步收敛）
var NPC_EFFECT_COMPAT = { unknown: {}, unknownOptions: 0, settledOptions: 0, warned: {} };

// ---- 结算入口 ----
// guard: {trustTouched, loveTouched} —— 闭包或通用层已经动过的轨不再重复写（防双计）
function settleNpcEventConsequence(npc, eventDef, choice, guard) {
    var value = String(choice == null ? '' : choice);
    var spec = NPC_EFFECT_MAP[value];
    if (!spec) {
        NPC_EFFECT_COMPAT.unknownOptions++;
        NPC_EFFECT_COMPAT.unknown[value] = (NPC_EFFECT_COMPAT.unknown[value] || 0) + 1;
        if (!NPC_EFFECT_COMPAT.warned[value]) {
            NPC_EFFECT_COMPAT.warned[value] = true;
            console.warn('[个人事件] 后果取值未登记，走兼容层（只改好感）："' + value + '"（事件 ' +
                (eventDef && eventDef.id) + '）——请把它登记进 NPC_EFFECT_SPEC');
        }
        return null;
    }
var parts = spec.split(':');
    var kind = parts[0];
    var branch = parts[1] || null;
    var sub = parts[2] || null;
    var def = NPC_EFFECT_KINDS[kind];
    if (!def || typeof def.settle !== 'function') {
        console.warn('[个人事件] 后果类型 ' + kind + ' 已登记但没有结算函数（值 "' + value +
            '"）——这是「登记了但不处理」的空实现，必须补 settle()');
        return null;
    }
    var w = NPC_EFFECT_WEIGHTS[value];
    if (typeof w !== 'number') w = NPC_EFFECT_DEFAULT_W[kind] || 1;
var ctx = {
        npc: npc, npcId: (eventDef && eventDef.npcId) || (npc && npc.id) || 'unknown',
        value: value, kind: kind, branch: branch, sub: sub, w: w,
        choiceText: _peOptionText(eventDef, value),
        guard: guard || { trustTouched: false, loveTouched: false }
    };
    var out;
    try {
        out = def.settle(ctx);
    } catch (e) {
        console.warn('[个人事件] 后果结算抛错（值 "' + value + '" 类型 ' + spec + '）：' + (e && e.message));
        return null;
    }
    if (!out || !out.lines || !out.lines.length) {
        console.warn('[个人事件] 后果结算返回空结果（值 "' + value + '" 类型 ' + spec + '）——结算函数可能是空实现');
        return null;
    }
NPC_EFFECT_COMPAT.settledOptions++;
    return {
        kind: kind, branch: branch, sub: sub, label: def.label, icon: def.icon,
        value: value, deltas: out.deltas || {}, lines: out.lines
    };
}

// 把结算行画进对话流（与既有「好感度 +N」同一条结算流，不是假面板）
function renderNpcEventConsequence(ev, outcome) {
    if (!ev || !ev.msgArea || !outcome) return;
    var toneColor = {
        good: 'text-rose-300', bad: 'text-red-400', cost: 'text-amber-300',
        mark: 'text-sky-300', know: 'text-cyan-300', flat: 'text-gray-500'
    };
    var div = document.createElement('div');
    div.className = 'text-center py-0.5';
    var html = '<p class="text-[10px] text-gray-600">后果·' + outcome.label + '（' + outcome.value + '）</p>';
    for (var i = 0; i < outcome.lines.length; i++) {
        var ln = outcome.lines[i];
        html += '<p class="' + (toneColor[ln.tone] || 'text-gray-400') + ' text-xs">' + ln.icon + ' ' + ln.text + '</p>';
    }
div.innerHTML = html;
    ev.msgArea.appendChild(div);
    ev.msgArea.scrollTop = ev.msgArea.scrollHeight;
}

// ======================================================================
// 启途接线：「启途」旗标的消费端
//
// 病根（实测）：⑧ 启途是八类后果里**唯一一类结算后不留任何可读状态**的——
//   它只写 npc.relationship.flags 里的 pe_open_<npcId>_<value> 和 eventFlags.pe_route_<npcId>，
//   两本账全仓零读方（实测：pe_pledge/pe_shielded/pe_broker/pe_betray/pe_refused/pe_know/
//   pe_slight/pe_hurt/pe_broke/pe_quarrel/pe_learned/pe_debt/pe_gather/pe_coldwalk/pe_route
//   在 js/ 树外的命中数均为 0）。其余七类结算的是 affection/hate/fear/trust/love/favor/
//   respect 与灵石/精力——那些轨与真资源全仓有读方，所以只有「启途」是白点。
//
// 度量结论（.scratch/open-flag-progress/）：988 场 2938 个选项里，open 类共 76 个选项、
//   73 面旗标。逐个跑它所属事件的 effects() 看分支返不返 ending：
//     · 33 面 —— 分支自带 ending 且已挂 endingMap（例：shao_event_013 的 friend → 禅契）。
//                 后果**已经兑现**，旗标只是冗余记账，不另造消费者。
//     · 40 面 —— 分支不返 ending，旗标当时真的无人读（下表 NPC_OPEN_ROUTE_FOLLOWS 接其中 8 面，
//                 每条都注明前情在哪个事件哪一句；余下列在 NPC_OPEN_ROUTE_OPEN_REMAIN 注明为何不接）。
//
// 读侧 API（本节新增，全在引擎层，别的文件不必改）：
//   hasOpenRoute / openRoutesOf / openRouteCount / openRouteLabel / applyEventEffects
//   handlePersonalEventChoice 改调 applyEventEffects（不包事件对象——本文件在 仙侠.html 里
//   排第 97 位，heroine-aftermath/wujiu-jealousy 等消费端在 151~159 位，晚于本文件覆盖式赋值，
//   在这里装饰会被冲掉，故挂在唯一的调用点上）。
// ======================================================================

// 旗名与账名（写侧与读侧共用的唯一定义，改这里两处一起改）
function peOpenFlagName(npcId, value) { return 'pe_open_' + npcId + '_' + value; }
function peOpenNoteKey(npcId, value) { return 'pe_open_note_' + npcId + '_' + value; }
function peRouteKey(npcId) { return 'pe_route_' + npcId; }

// 取一个 NPC（认 npc 对象或 npcId 两种写法）
function _peOpenNpc(who) {
    if (!who) return null;
    if (typeof who === 'string') {
        return (window.npcManager && typeof window.npcManager.getNPC === 'function')
            ? window.npcManager.getNPC(who) : null;
    }
    return who;
}

// ★旗标读侧：这条关系上「已经开过哪些路」。先看 NPC 旗（随 NPC 存档往返，见 npc-system.js:1426/1559），
//   旗不在时回落到 eventFlags 的注记账（随 GameState.eventFlags 存档，见 core/game-state.js）。
function hasOpenRoute(who, value) {
    var npc = _peOpenNpc(who);
    if (npc && typeof npc.hasFlag === 'function' && npc.hasFlag(peOpenFlagName(npc.id, value))) return true;
    var id = npc ? npc.id : who;
    return !!(window.eventFlags && window.eventFlags[peOpenNoteKey(id, value)]);
}

// 该关系上开过的全部路（按开路先后）
function openRoutesOf(who) {
    var npc = _peOpenNpc(who);
    var id = npc ? npc.id : who;
    var out = [];
    try {
        if (npc && npc.relationship && npc.relationship.flags && typeof npc.relationship.flags.forEach === 'function') {
            npc.relationship.flags.forEach(function (f) {
                var s = String(f);
                if (s.indexOf('pe_open_' + id + '_') === 0) out.push(s.slice(('pe_open_' + id + '_').length));
            });
        }
    } catch (eOpen1) {
        console.warn('[启途] 读关系旗上的已开路失败（' + id + '）：' + (eOpen1 && eOpen1.message));
    }
    if (window.eventFlags && typeof window.eventFlags === 'object') {
        var pfx = 'pe_open_note_' + id + '_';
        for (var k in window.eventFlags) {
            if (k.indexOf(pfx) === 0 && out.indexOf(k.slice(pfx.length)) < 0) out.push(k.slice(pfx.length));
        }
    }
    return out;
}

// 开过几条路（eventFlags 的路线账，随存档走）
function openRouteCount(who) {
    var npc = _peOpenNpc(who);
    var id = npc ? npc.id : who;
    return (Number(window.eventFlags && window.eventFlags[peRouteKey(id)]) || 0);
}

// 某条路的「约」——结算那一刻把玩家自己按下的那句原话记进 eventFlags，随存档走。
// （NPC 旗只存名字不存话；话存在这里，所以读档后仍能把这面旗原样说给玩家听。）
function openRouteLabel(who, value) {
    var npc = _peOpenNpc(who);
    var id = npc ? npc.id : who;
    var s = window.eventFlags && window.eventFlags[peOpenNoteKey(id, value)];
    return typeof s === 'string' ? s : '';
}

// ---------------------------------------------------------------------
// 消费端表：每条注明「前情在哪个事件的哪一句」——没有前情可指的，不许进这张表。
// 键是消费端事件 id；aff 是本条给玩家的**额外**好感（原有效果之外另计，正负皆可）。
// ---------------------------------------------------------------------
var NPC_OPEN_ROUTE_FOLLOWS = {
    // 唐门·白丝手套那条线：tm_event_duel_lu opt1「wait_glove」立下的条件是
    // 「晏姑娘的手套还没摘——她肯空手接你的针那日，你再落凿」。而 tm_event_aftermath 开场
    // 就是「她坐在炉前，手套褪下来搁在膝上，空着那双带青痕的手」——那个条件兑现了。
    'tm_event_aftermath': [
        {
            npc: 'sect_leader_唐门', value: 'wait_glove', aff: 4, icon: '🧤',
            line: '炉前那双手套是她自己褪下来的——炉前立过的那个约（你刻碑前要等她空手接针），今日算兑现了。'
        },
        {
            npc: 'sect_leader_唐门', value: 'glove_on', aff: -3, icon: '🧤',
            line: '手套是你替她一只一只戴回去的。她退回手套里——碑上那两个字，往后有的等了。'
        }
    ],
    // 无咎·灶上那条线：wujiu_event_j08 opt2 写下「都归灶上管」，
    // wujiu_event_j09 开场他一手一碗「我不跟人争。饭压实了——一样」——那句是它的下半句。
    'wujiu_event_j09': [
        {
            npc: 'shaolin_wujiu', value: 'add', aff: 4, icon: '🍚',
            line: '「都归灶上管」那句你亲笔添在名帖底下——今日两碗一样平的饭，他把那句的下半句说完了。'
        }
    ],
    // 少林·碗筷那条线：shao_event_duel_wujiu opt1「take_chopsticks」当众把「常来」坐实，
    // wujiu_event_j07 开场就是那只锔钵「不盛饭，盛两双筷子」——那双筷子要有位置，得先当众认过。
    'wujiu_event_j07': [
        {
            npc: 'sect_leader_少林寺', value: 'take_chopsticks', aff: 3, icon: '🥢',
            line: '钵里那双筷子，是你当众认下的「常吃」——第三回递过去的，第四回就不用再找话头了。'
        }
    ],
    // 无咎·名帖为什么写两个名字：j07 之后筷子已经不是两双（newpair 三双）／碗已经不是他的（hisbowl）
    'wujiu_event_j08': [
        {
            npc: 'shaolin_wujiu', value: 'newpair', aff: 3, icon: '🥢',
            line: '上回你给他换的那双竹筷还插在钵里——三双筷子摆着，名帖上多写一个名字，就不算瞒。'
        },
        {
            npc: 'shaolin_wujiu', value: 'hisbowl', aff: 3, icon: '🥣',
            line: '往后你吃的是他那只碗——碗都换了主人，名帖上再添一个名字，他不写才叫欺心。'
        }
    ],
    // 无咎·灶火那条线：j04 opt0「refire」拨火重新生起来（「这碗热一热，一人一半」），
    // j05 他却把钵端出灶房——火是灭的，才需要把钵当人情送出去。
    'wujiu_event_j05': [
        {
            npc: 'shaolin_wujiu', value: 'refire', aff: 3, icon: '🔥',
            line: '上回你蹲下去把那碗饭重新生起来了——灶上的火是热的，所以这一回他端的是自家那只钵。'
        }
    ],
    // 少林·季检时灶台边上「多摆了一副碗筷」：wujiu_event_008 opt1「friend」
    // 「留你在灶上……你上山，他烧饭，永远有一碗热的」。
    'shao_event_duel_wujiu': [
        {
            npc: 'shaolin_wujiu', value: 'friend', aff: 3, icon: '🍚',
            line: '灶角那只碗是你在柴账上留过名的那一只——他今日摆出来，不是季检摆的。'
        }
    ]
};

// 余下未接的 open 旗：逐条注明「为什么没有可指认的前情」，不硬造消费者。
// kind: 'served' = 该分支自带 ending 且已挂 endingMap（后果已兑现，旗标只是冗余记账）
//       'stance' = 该分支的差别已由同一分支的好感增减交付（旗标只是把这一笔记了个名字）
var NPC_OPEN_ROUTE_LEDGER_NOTE = {
    // 12 面「双派对局里的立场」旗：对局场没有后续事件，立场的好坏当場就记在好感上
    stance: ['side_host', 'side_guest', 'allin', 'cheer_host', 'cheer_guest', 'host_first',
        'host_ans', 'light_now', 'wait_glove', 'unseal', 'take_chopsticks', 'returnwhistle'],
    // 27 面「立约后未再兑现」旗：所属分支不返 ending，且该关系上查无以它为前情的后续事件
    noFollowup: ['again', 'enter', 'next', 'ferry', 'continue', 'shore', 'year', 'boat', 'daily',
        'third_way', 'disciples', 'vessel', 'redeem', 'refire', 'defect', 'companion'],
    // 2 面「写在自己这一场的末选上」旗：由本场最后一个选项落下，而本场不是 ambient、无重演，
    //   同一条路上没有第二个场可读它（j09 那两碗，端过就完了）
    selfTerminal: ['wujiu', 'rival']
};

// 记一笔：这个事件消费端对某条路的读账（测试与面板都用它，避免「表里有、代码里没读」）
function _peOpenFollowHits(evId) { return (NPC_OPEN_ROUTE_FOLLOWS[evId] || []).length; }

// ★★消费端挂载点：事件自己的 effects() 跑完之后，把「开过的路」对它产生的后果接上。
//   之所以拦在这一层而不是装饰事件对象：本文件在 仙侠.html 里排第 97 位，
//   heroine-aftermath.js(157)/wujiu-jealousy.js(159)/shaolin-pojie-events.js(151) 都晚于它，
//   在本文件尾部装饰会被它们的覆盖式赋值冲掉；而 handlePersonalEventChoice 是全游戏
//   唯一调用 events() 的地方（js/npcs/npc-personal-events.js:1988），拦这里既唯一又顺序无关。
function applyEventEffects(eventDef, npc, choice) {
    var out = null;
    if (eventDef && typeof eventDef.effects === 'function') {
        try { out = eventDef.effects(npc, choice); }
        catch (e) {
            console.warn('[启途] 事件 effects() 抛错（' + ((eventDef && eventDef.id) || '?') + ' / ' + choice + '）：' + (e && e.message));
            out = null;
        }
    }
    if (!out) out = {};
    var evId = (eventDef && eventDef.id) || '';
    var rules = NPC_OPEN_ROUTE_FOLLOWS[evId];
    if (!rules || !rules.length) return out;
    var hit = [];
    for (var i = 0; i < rules.length; i++) {
        var r = rules[i];
        // 同一条关系（事件所属 NPC 就是这面旗的主人）时直接用手上这个 NPC 实例读旗，
        // 不绕 npcManager——懒注册的门派 NPC 在册前，绕注册表会把旗读丢。
        var who = (npc && npc.id === r.npc) ? npc : r.npc;
        if (!hasOpenRoute(who, r.value)) continue;   // ← 旗标在这里被读
        hit.push(r);
        if (r.aff && npc && npc.relationship) {
            npc.relationship.affection = Math.max(-100, Math.min(100,
                (Number(npc.relationship.affection) || 0) + r.aff));
            out.affection = (Number(out.affection) || 0) + r.aff;
        }
    }
    if (!hit.length) return out;
    // 玩家看得见的：一条「旧路应验」提示 + 好感增减
    var d = (Number(out.affection) || 0);
    out.msg = (out.msg ? out.msg + '\n\n' : '')
        + '🧭 已开的路应验（' + hit.map(function (r) { return r.value; }).join('、') + '）：'
        + (d > 0 ? '好感 ' + (d > 0 ? '+' : '') + d : (d < 0 ? '好感 ' + d : '无好感增减'));
    for (var j = 0; j < hit.length; j++) {
        out.msg += '\n' + hit[j].icon + ' ' + hit[j].line;
    }
    out.openRouteHits = hit.map(function (r) { return r.npc + ':' + r.value; });
    return out;
}

// 处理选择分支（在对话流中追加玩家的选择和后续对话）
window.handlePersonalEventChoice = function(sceneIndex, choiceIndex) {
    var ev = window._currentPersonalEvent;
    if (!ev || ev.finished) return;
    
    var scene = ev.eventDef.scenes[sceneIndex];
    if (!scene || scene.speaker !== 'player_select') return;
    
    var choice = scene.options[choiceIndex];
    if (!choice) return;
    
    var playerName = window.currentCharData?.name || '道友';
    var npc = ev.npc;
    var npcName = npc.name;
    var npcIcon = npc.appearance?.icon || '👤';
    
    // 追加玩家选择的气泡
    var playerDiv = document.createElement('div');
    playerDiv.className = 'bg-blue-900/50 p-3 rounded-lg border-l-4 border-blue-500 ml-8';
    var _ptChoice = (window.currentCharData && window.currentCharData.gender === 'female') ? '她' : '他';
    var _ptPossChoice = (window.currentCharData && window.currentCharData.gender === 'female') ? '她的' : '他的';
    playerDiv.innerHTML = '<div class="flex items-center gap-2 mb-1"><span class="text-sm font-bold text-blue-300">' + playerName + '</span></div><p class="text-gray-200 text-sm">' + choice.text.replace(/{playerName}/g, playerName).replace(/{playerTa}/g, _ptChoice).replace(/{playerTaPoss}/g, _ptPossChoice) + '</p>';
    ev.msgArea.appendChild(playerDiv);
    ev.msgArea.scrollTop = ev.msgArea.scrollHeight;
    
// 应用效果
    // v26.9 受控枚举：先拍下闭包动手前的信任/爱意轨，结算时据此避开重复计账
    // （实测 938 个闭包里 540 个选项会自己写 trust，另有通用层给 tell/vow 写 love）
    var _peGuard = { trustTouched: false, loveTouched: false };
    if (npc && npc.relationship) {
        _peGuard._trust0 = Number(npc.relationship.trust) || 0;
        _peGuard._love0 = Number(npc.relationship.love) || 0;
    }
    var result = applyEventEffects(ev.eventDef, npc, choice.effect);
    // 吃醋事件：按情敌性别加一句有意思的话语（同性/异性分流）
    if (ev.eventDef.requireRivalRomance && result && result.msg && typeof window.detectRivalRomance === 'function' && typeof window._rivalSexFlavor === 'function') {
        var _rivalForFlavor = window.detectRivalRomance(ev.eventDef.npcId);
        if (_rivalForFlavor && _rivalForFlavor.gender) {
            var _flavorLine = window._rivalSexFlavor(npc, _rivalForFlavor);
            if (_flavorLine) result.msg = _flavorLine + result.msg;
        }
    }
    // v20.33 信任折价：吃醋场上，信任是话语的成色——被谎言磨到 10 以下时，
    // 安抚类选择的好感加成减半（实现见 jealousy-deep.js；涨路：赴约+1、陪节+2）。
    if (result && typeof result.affection === 'number' && result.affection > 0
        && /_event_(probe|cold)$/.test(ev.eventDef.id || '')
        && typeof window._jealTrustDiscount === 'function') {
        window._jealTrustDiscount(ev.eventDef, npc, choice.effect, result);
    }
    // v20.36 深情账：吃醋场上的坦白与立誓是真诚里程碑——深情+1（0~100）。
    // 深情涨路只认真诚时刻：结契打底、陪节+1、此处坦白/立誓+1；日常陪伴不积（那是好感的账）。
    if (ev.eventDef.requireRivalRomance && npc && npc.relationship
        && (choice.effect === 'tell' || choice.effect === 'vow')) {
        npc.relationship.love = Math.min(100, (Number(npc.relationship.love) || 0) + 1);
    }
    if (result.affection && npc) {
        npc.relationship.affection = Math.max(-100, Math.min(100, (npc.relationship.affection || 0) + result.affection));
        
        // 好感变化实时反馈
        var affDiv = document.createElement('div');
        affDiv.className = 'text-center py-0.5';
        var affSymbol = result.affection > 0 ? '💗' : '💔';
        affDiv.innerHTML = '<p class="text-gray-500 text-xs">' + affSymbol + ' 好感度 ' + (result.affection > 0 ? '+' : '') + result.affection + '</p>';
ev.msgArea.appendChild(affDiv);
        ev.msgArea.scrollTop = ev.msgArea.scrollHeight;
    }

    // ===== v26.9 受控枚举结算：裸 effect 取值 → 8 类真实后果（信任/爱意/情分/敬重/怨/惧/知情账/灵石/精力/欠账/旗） =====
    // 放在好感之后：好感仍是原来那一笔标量，这里补的是它从来没告诉玩家的其余后果。
    // 闭包或上面通用层已经动过的轨按快照标记，结算层不重复写（trust 540 个选项、love tell/vow 两处）。
    if (npc && npc.relationship) {
        _peGuard.trustTouched = (Number(npc.relationship.trust) || 0) !== _peGuard._trust0;
        _peGuard.loveTouched = (Number(npc.relationship.love) || 0) !== _peGuard._love0;
    }
    var _peOutcome = null;
    try {
        _peOutcome = settleNpcEventConsequence(npc, ev.eventDef, choice.effect, _peGuard);
    } catch (e) {
        // 不让结算层的异常掐断事件流：这一笔后果跳过，好感与反应照旧落地，并留告警
        console.warn('[个人事件] 后果结算入口抛错（事件 ' + (ev.eventDef && ev.eventDef.id) + ' 取值 "' + choice.effect + '"）：' + (e && e.message));
    }
    if (_peOutcome) renderNpcEventConsequence(ev, _peOutcome);

    // 记录冷却天数
    if (ev.eventDef.cooldown > 0) {
        if (!window._eventCooldowns) window._eventCooldowns = {};
        window._eventCooldowns['cd_' + ev.eventDef.id] = window.timeSystem?.gameTime?.currentDay || 0;
    }
    
    // 记录互动天数（用于好感衰减）
    if (!window._lastInteractDay) window._lastInteractDay = {};
    window._lastInteractDay[ev.eventDef.npcId] = window.timeSystem?.gameTime?.currentDay || 0;
    
    // 追加NPC反应
    if (result.msg) {
        var npcDiv = document.createElement('div');
        npcDiv.className = 'bg-gray-700/50 p-3 rounded-lg border-l-4 border-pink-500';
        npcDiv.innerHTML = '<div class="flex items-center gap-2 mb-1"><span class="text-xl">' + npcIcon + '</span><span class="text-sm font-bold text-pink-400">' + npcName + '</span></div><p class="text-gray-200 text-sm">' + result.msg + '</p>';
        ev.msgArea.appendChild(npcDiv);
        ev.msgArea.scrollTop = ev.msgArea.scrollHeight;
    }

    // ===== v20.80 双人同框结算：others = 在场第三方的好感账，pair = 主客社交关系写回（npcRelationships 真源） =====
    if (result.others && Array.isArray(result.others)) {
        for (var _oi = 0; _oi < result.others.length; _oi++) {
            var _oth = result.others[_oi];
            if (!_oth || !_oth.id) continue;
            var _onpc = window.npcManager?.getNPC(_oth.id);
            if (!_onpc || !_onpc.relationship) continue;
            if (typeof _oth.affection === 'number' && _oth.affection !== 0) {
                _onpc.relationship.affection = Math.max(-100, Math.min(100, (_onpc.relationship.affection || 0) + _oth.affection));
                var _oDiv = document.createElement('div');
                _oDiv.className = 'text-center py-0.5';
                _oDiv.innerHTML = '<p class="text-gray-500 text-xs">' + (_oth.affection > 0 ? '💗 ' : '💔 ') + (_onpc.name || _oth.id) + ' 好感度 ' + (_oth.affection > 0 ? '+' : '') + _oth.affection + '</p>';
                ev.msgArea.appendChild(_oDiv);
                ev.msgArea.scrollTop = ev.msgArea.scrollHeight;
            }
            if (typeof _oth.trust === 'number' && _oth.trust !== 0) {
                _onpc.relationship.trust = Math.max(-100, Math.min(100, (Number(_onpc.relationship.trust) || 0) + _oth.trust));
            }
        }
    }
    if (result.pair && typeof window._jealWriteback === 'function') {
        try {
            var _pairWith = result.pair.with || ev.eventDef.guestId || null;
            if (_pairWith && _pairWith !== ev.eventDef.npcId) {
                var _pRes = window._jealWriteback(ev.eventDef.npcId, _pairWith, Number(result.pair.delta) || 0, result.pair.opts || {});
                if (_pRes && _pRes.text && result.pair.show !== false) {
                    var _pDiv = document.createElement('div');
                    _pDiv.className = 'text-center py-0.5';
                    _pDiv.innerHTML = '<p class="text-gray-500 text-xs">🕸️ ' + _pRes.text + '</p>';
                    ev.msgArea.appendChild(_pDiv);
                    ev.msgArea.scrollTop = ev.msgArea.scrollHeight;
                }
            }
        } catch (e) {}
    }
    
    // 检查是否解锁秘密（v12.3：effects 返回的 secretId 优先 → 事件声明的 unlockSecret → 旧硬编码兜底）
    var secretId = (result && typeof result.secretId !== 'undefined') ? result.secretId : (ev.eventDef.unlockSecret || null);
    if (!secretId) {
        if (ev.eventDef.id === 'xl_event_007') secretId = 'xl_secret_02';
        else if (ev.eventDef.id === 'xl_event_010') secretId = 'xl_secret_03';
        else if (ev.eventDef.id === 'xl_event_013') secretId = 'xl_secret_01';
    }
    
    if (secretId && npc && typeof npc.unlockSecret === 'function') {
        if (npc.unlockSecret(secretId)) {
            var secretTitle = (npc.secrets && npc.secrets[secretId]) ? npc.secrets[secretId].title : '未知';
            var secDiv = document.createElement('div');
            secDiv.className = 'text-center py-1';
            secDiv.innerHTML = '<p class="text-yellow-400 text-xs">🔓 解锁秘密：' + secretTitle + '</p>';
            ev.msgArea.appendChild(secDiv);
            ev.msgArea.scrollTop = ev.msgArea.scrollHeight;
        }
    }
    
    // ===== 处理物品奖励（如事件007的半截断簪） =====
    // 两条来源都要认：effects() 回的 result.item，与只写在选项上的 choice.item；
    // 形如 {id,count} 的对象要摊平——旧版把整枚对象塞给 addItem，东西不入库、屏上还印成 [object Object]。
    var gift = result.item || choice.item || null;
    var giftId = (gift && typeof gift === 'object') ? gift.id : gift;
    var giftCount = (gift && typeof gift === 'object' && gift.count > 0) ? gift.count : 1;
    if (giftId && (typeof window.giveWithReceipt === 'function' || typeof window.addItem === 'function')) {
        // DES-72（第一百三十批）：旧写法丢了返回值——「获得物品：X ×N」照印，囊里真进了几件不管
        var 收 = typeof window.giveWithReceipt === 'function'
            ? window.giveWithReceipt(giftId, giftCount, { quiet: true })
            : { got: Number(window.addItem(giftId, giftCount)) || 0, count: giftCount, name: (window.itemById && window.itemById[giftId] && window.itemById[giftId].name) || giftId };
        var itemDiv = document.createElement('div');
        itemDiv.className = 'text-center py-1';
        var giftName = 收.name || giftId;
        var 礼话 = 收.got >= 收.count
            ? '获得物品：' + giftName + (收.count > 1 ? ' ×' + 收.count : '')
            : (收.got > 0
                ? '行囊只塞得下 ' + giftName + ' ' + 收.got + '/' + 收.count + ' 件，另 ' + (收.count - 收.got) + ' 件没带走'
                : giftName + ' ×' + 收.count + ' 一件也没能带走：'
                  // DES-90（第一百三十九批）：问不到账时不许由站点断言满包；NPC 赠礼是一次性剧情，改用②形
                  + ((typeof window.addItemFailText === 'function' && window.addItemFailText(giftName)) || '它没有跟你走。'));
        itemDiv.innerHTML = '<p class="text-green-400 text-xs">📦 ' + 礼话 + '</p>';
        ev.msgArea.appendChild(itemDiv);
        ev.msgArea.scrollTop = ev.msgArea.scrollHeight;
    }
    
    // ===== 处理结局路线（如事件015的ending） =====
    if (result.ending) {
        if (!window.currentCharData) window.currentCharData = {};
        if (!window.currentCharData._npcRoutes) window.currentCharData._npcRoutes = {};
        window.currentCharData._npcRoutes[ev.eventDef.npcId] = result.ending;
        var routeDiv = document.createElement('div');
        routeDiv.className = 'text-center py-1';
        routeDiv.innerHTML = '<p class="text-purple-400 text-xs">🌟 路线确定：' + result.ending + '</p>';
        ev.msgArea.appendChild(routeDiv);
        ev.msgArea.scrollTop = ev.msgArea.scrollHeight;
        
        // 选「扛」的结局（共主、比邻）→ 设置副门主身份（仅修罗宫）
        if ((result.ending === '共主' || result.ending === '比邻') && ev.eventDef.npcId === 'sect_leader_修罗宫') {
            if (window.discipleState) {
                window.discipleState.rank = 1; // 副掌门
                if (window.discipleState.sectId !== '修罗宫') {
                    window.discipleState.sectId = '修罗宫';
                }
            }
        }
        
        // v12.3：结局自定义副作用回调（百花谷等新感情线注册）
        var endingCb = NPC_ENDING_CALLBACKS[ev.eventDef.npcId];
        if (typeof endingCb === 'function') {
            try { endingCb(result.ending, npc); } catch(e) { console.warn('[个人事件] 结局回调失败:', e); }
        }
        // v20.24 道侣名册落笔：结局回调落过 dao_companion 旗的，统一写进 bonds 名册
        // （八条主角线的婚后制度——双修/随行/护法/子嗣——全读名册，此前只有旗、册上无名）
        try {
            if (window.ensureDaoBond && npc && typeof npc.hasFlag === 'function' && npc.hasFlag('dao_companion')) {
                window.ensureDaoBond(ev.eventDef.npcId);
            }
        } catch (e) { console.warn('[个人事件] 道侣名册落笔失败:', e); }
        
        // 触发结局演出（v12.3：优先读事件声明的 endingMap，回退到修罗宫映射）
        var endingMap = ev.eventDef.endingMap || { '共主': 'xl_ending_共主', '归心': 'xl_ending_归心', '比邻': 'xl_ending_比邻', '归处': 'xl_ending_归处' };
        var endingId = endingMap[result.ending];
        if (endingId && typeof showEndingScene === 'function') {
            setTimeout(function() { showEndingScene(endingId, ev.eventDef.npcId); }, 1500);
        }
    }
    
    // 追踪累计负面选项（用于触发霜烬结局）
    if (result.affection < 0) {
        if (!window._negativeChoiceCount) window._negativeChoiceCount = {};
        window._negativeChoiceCount[ev.eventDef.npcId] = (window._negativeChoiceCount[ev.eventDef.npcId] || 0) + 1;
    }
    
    // 继续后续场景
    var next = sceneIndex + 1;
    ev._nextIndex = next;
    setTimeout(function() { renderPersonalEventScene(ev._nextIndex); }, 400);
};

// ============ 注入 SECT_DEEP_DATA 中定义的门派核心NPC秘密 ============
// 幂等：每次调用都会检查，若NPC实例还没有secrets则注入
function injectSectSecrets() {
    if (!window.npcManager) return;
    var dd = window.SECT_DEEP_DATA;
    if (!dd || Object.keys(dd).length === 0) {
        console.warn('[个人事件] SECT_DEEP_DATA 为空，请先调用 initSectsDeepData()');
        return;
    }
    try {
        var allNpcs = window.npcManager.getAllNPCs ? window.npcManager.getAllNPCs() : [];
        Object.keys(dd).forEach(function(sectName) {
            var sectData = window.SECT_DEEP_DATA[sectName];
            if (!sectData || !sectData.masters) return;
            sectData.masters.forEach(function(master) {
                if (!master || !master.secrets) return;
                for (var i = 0; i < allNpcs.length; i++) {
                    var n = allNpcs[i];
                    if (n.name === master.name && (!n.secrets || Object.keys(n.secrets).length === 0)) {
                        n.secrets = {};
                        Object.keys(master.secrets).forEach(function(sKey) {
                            var secretDef = master.secrets[sKey];
                            n.secrets[sKey] = JSON.parse(JSON.stringify(secretDef));
                        });
                        // 已有_unlockedSecretDialogues则保留
                        if (!n.memory._unlockedSecretDialogues) {
                            n.memory._unlockedSecretDialogues = [];
                        }
                    }
                }
            });
        });
    } catch (e) {
        console.warn('[个人事件] 秘密注入失败:', e);
    }
}

// 根据事件ID推断所属链（通用链E / 侍妾链S / 弟子链D）
function getEventChain(ev) {
    if (ev.requireConcubine) return 'concubine';
    if (ev.requireDisciple) return 'disciple';
    return 'main';
}

// 获取链内序号（从事件ID提取数字）
function getChainOrder(ev) {
    var m = ev.id.match(/_event_(s|d)?(\d+)/i);
    if (m) return parseInt(m[2], 10);
    return 0;
}

// 判断事件是否为链中当前可触发节点（前一个已完成，且自己未完成）
// v12.3 通用化：按 npcId+链 分组，找序号比自己小的最大事件并检查其完成状态，
// 不再依赖 xl_ 前缀字符串拼接，对任意NPC的感情线生效
function isChainHead(ev) {
    // v20.25 日常（ambient）小事不入主线链：萌芽期就碰得上，不再被终章锁死；
    // 会不会重复发生由重入冷却（_ambientRearmOk）控制，不再只出现一次。
    if (ev.ambient) return true;
    if (hasEventTriggered(ev.id)) return false;
    var chain = getEventChain(ev);
    var order = getChainOrder(ev);
    if (order <= 1) return true;
    var prevMax = null;
    for (var key in NPC_PERSONAL_EVENTS) {
        var e = NPC_PERSONAL_EVENTS[key];
        if (!e || e.npcId !== ev.npcId) continue;
        if (getEventChain(e) !== chain) continue;
        var o = getChainOrder(e);
        if (o > 0 && o < order && (!prevMax || o > getChainOrder(prevMax))) prevMax = e;
    }
    if (!prevMax) return true; // 链首（前一节点不存在于事件池）
    return hasEventTriggered(prevMax.id);
}

// v20.25 日常事件就地认定：xl/bh 两组的 015~032 是"她做了但不说"的生活小事，
// 不是主线节点——运行时打 ambient 标（加载序不保证，故不靠挂载序），并给重入周期 14 日。
// v20.27 恋爱事件真实代价：兑现承诺先付精力（打坐/炼丹同一口井，无旁路字段）。
// 无账本环境（测试沙盒/未开局）不扣不亏——只认 currentCharData.energy 真源。
window._payCost = function (kind, n) {
    var cd = window.currentCharData;
    if (!cd) return { ok: true };
    if (kind !== 'energy') return { ok: false, why: 'unknown' };
    if ((Number(cd.energy) || 0) < n) return { ok: false, why: 'exhausted' };
    cd.energy = Number(cd.energy) || 0;
    cd.energy -= n;
    return { ok: true };
};

function _ensureAmbientTag(ev) {
    if (!ev || ev.ambient || typeof ev.id !== 'string') return;
    if (/^(xl|bh)_event_0(1[5-9]|2[0-9]|3[0-2])$/.test(ev.id)) {
        ev.ambient = true;
        if (!ev.repeatEvery) ev.repeatEvery = 14;
    }
}

// v20.25 日常小事重入闸门：同一桩"她递了盏茶"要隔够日子才会再来（默认 14 日）。
// 上次发生的日头记在 NPC 记忆里随存档走；无历法环境不重入（宁可不发，不白送好感）。
function _ambientRearmOk(npc, ev) {
    if (!ev || !ev.ambient) return false;
    var m = (npc && npc.memory && npc.memory._ambientLastDay) || null;
    if (!m) return false; // 从未发生过的事由未触发分支放行，这里只管重入
    var last = Number(m[ev.id]) || 0;
    if (!last) return false;
    var today = 0;
    try {
        if (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') today = Number(window.timeSystem.getAbsoluteDay()) || 0;
    } catch (e) {}
    if (!today) return false;
    return (today - last) >= (Number(ev.repeatEvery) || 14);
}

// ============ 清单是否罗列：全局唯一判定口 ============
// v22.0 这里是「默认关」：设置没勾就不罗列清单，事件改由交谈自然引出。
// 本批把默认翻过来（禁止设计.md 第 2 条 + 「看不见不是沉浸，是丢内容」）：
//   清单默认罗列——入口必须看得见；只有玩家在设置里**显式勾掉**才进沉浸模式。
// 判据只认「显式 false」，所以：
//   · 没写过这个键的档（新档 / 从没碰过这个开关的老档）→ 罗列；
//   · v22.0 时代真把它勾掉过的玩家 → 仍按他自己的选择走（不推翻玩家已表达的偏好）；
//   · 勾选过 true 的老档 → 罗列（与旧行为一致）。
// 因此旧档零迁移：一个键都没有的场合从「关」变「开」，写过的都不动。
function isPersonalEventListShown() {
    return !(window._settings && window._settings.socialEventPanel === false);
}

// ============ 获取NPC的个人事件按钮（用于对话面板显示） ============
// v20.3 修订：不再用「首个事件测门禁，不过就整栏隐藏」的探针法——
// 那会让异派/不在场/远程查看时整栏凭空消失，玩家不知道为什么。
// 改为：只要有私人线就显示整栏，逐条事件各自给出锁定原因（含门派/地点/身份/性别/道侣等）。
function getPersonalEventButtons(npc, npcId) {
    if (!npc || !npcId) return '';

    // 每次调用时尝试注入秘密（幂等，确保NPC实例已获得secrets数据）——
    // 懒注册的门派掌门（registerSectNPCs 到访才建）全靠这趟面板级补注入，必须先于沉浸闸执行。
    injectSectSecrets();

    // 沉浸模式：只有玩家显式把设置页「社交面板显示个人事件」勾掉，才不罗列清单——
    // 事件改由交谈自然引出（personalEventGreetGate：拦面板开场 / 「她叫住了你」概率弹出）。
    // 各故事线（batch1/2/3 等）对 window.getPersonalEventButtons 的包装链最终都落到这里，一处判定全局生效。
    if (!isPersonalEventListShown()) return '';

    // 查找属于该NPC的所有个人事件
    var eventList = [];
    for (var key in NPC_PERSONAL_EVENTS) {
        var ev = NPC_PERSONAL_EVENTS[key];
        if (ev.npcId === npcId) {
            eventList.push(ev);
        }
    }
    // 「已开的路」与事件桩是两笔账：旗开着却查不到桩（事件号改名、桩被搬去别的批次）时，
    // 仍然要把这条路告诉玩家——只落旗不落字等于丢内容。所以这里不是「有桩才画」。
    var _routes = openRoutesOf(npcId);
    if (eventList.length === 0 && _routes.length === 0) return '';

    var player = window.currentCharData || {};
    var isConcubine = player.isConcubine || window.discipleState?.isConcubine || false;
    var isDisciple = window.discipleState?.isInSect && window.discipleState?.sectId === '修罗宫' && !isConcubine;
    var affection = npc.relationship?.affection || 0;
    var homeSect = npcId.indexOf('sect_leader_') === 0 ? npcId.slice('sect_leader_'.length) : '';
    var playerLoc = player.location || '';
    var ds = window.discipleState || {};
    var isConcubineOfThis = isConcubine; // 侍妾身份本就只属其门（侍妾链仅绯泪有）
    var metNpc = !!(npc.memory && (npc.memory.firstMet === true || (npc.memory.meetCount || 0) > 0));

    // 统计已触发数量（v20.35：只数一次性事件——日常可重演桩不算"完成"，单独分组）
    var oneShotList = eventList.filter(function(ev) { return !ev.ambient; });
    var triggeredCount = oneShotList.filter(function(ev) { return hasEventTriggered(ev.id); }).length;

    // 按链分组排序：主链 E → 侍妾链 S → 弟子链 D（ambient 日常桩另组，不进主链）
    var mainChain = eventList.filter(function(ev) { return getEventChain(ev) === 'main' && !ev.ambient; })
        .sort(function(a, b) { return getChainOrder(a) - getChainOrder(b); });
    var concubineChain = eventList.filter(function(ev) { return getEventChain(ev) === 'concubine'; })
        .sort(function(a, b) { return getChainOrder(a) - getChainOrder(b); });
    var discipleChain = eventList.filter(function(ev) { return getEventChain(ev) === 'disciple'; })
        .sort(function(a, b) { return getChainOrder(a) - getChainOrder(b); });

    // 使用 details/summary 实现默认收起
    var html = '<details class="mb-3 group">';
    html += '<summary class="cursor-pointer select-none text-sm font-bold text-green-400 hover:text-green-300 mb-1 flex items-center gap-2">';
    html += '<span class="transition-transform group-open:rotate-90">▶</span>';
    html += '<span>📜 个人事件</span>';
    html += '<span class="text-xs text-gray-500 font-normal">（已完成 ' + triggeredCount + '/' + oneShotList.length + ' · 日常可重演 ' + eventList.filter(function(ev) { return !!ev.ambient; }).length + ' 桩）</span>';
// v20.33 信任露出：信任是话语的成色（吃醋安抚折价线 10），养回靠到场——赴约+1、陪节+2
    html += '<span class="text-xs text-gray-500 font-normal">· 信任 ' + ((npc.relationship && npc.relationship.trust) || 0) + '</span>';
    // 已开的路在收起状态下也要看得见：<details> 默认折起，明写条数，玩家才知道点开有东西
    if (_routes.length > 0) {
        html += '<span class="text-xs text-sky-400 font-normal" data-open-route-count="' + _routes.length + '">· 🧭 已开 ' + _routes.length + ' 条路</span>';
    }
    // 未结识时在标题旁给一句总括提示，不再整栏隐藏
    if (!metNpc) {
        html += '<span class="text-xs text-gray-600 font-normal">· 尚未与此人结识</span>';
    }
html += '</summary>';
    html += '<div class="space-y-3">';

    // 启途接线·「已开的路」：启途旗标过去只落旗不说话，玩家看不见自己开过什么。
    // 这里把本关系上已开过的路连同「约的原话」列出来——原话是结算那一刻玩家自己按下的那句，
    // 存在 eventFlags 里随存档走，所以读档后这块仍在（NPC 旗也在，见 npc-system.js:1426/1559）。
    if (_routes.length > 0) {
        html += '<div class="bg-sky-950/30 border border-sky-800/50 rounded p-2">';
        html += '<p class="text-xs font-bold text-sky-300 mb-1">🧭 已开的路（' + _routes.length +
            ' 条 · 共走过 ' + openRouteCount(npcId) + ' 回）</p>';
        for (var _ri = 0; _ri < _routes.length; _ri++) {
            var _rv = _routes[_ri];
            var _rl = openRouteLabel(npcId, _rv);
            html += '<p class="text-xs text-sky-200/80">· <span class="text-sky-400">' + _rv + '</span>' +
                (_rl ? '：「' + _rl + '」' : '（约的原话未存档）') + '</p>';
        }
        html += '</div>';
    }

    
    // 渲染一条事件链（带标题）
    function renderChain(chainList, chainTitle) {
        if (chainList.length === 0) return '';
        var chainHtml = '';
        chainHtml += '<div class="text-xs font-bold text-gray-400 mb-1">' + chainTitle + '</div>';
        chainHtml += '<div class="space-y-1.5">';
        chainList.forEach(function(ev) {
            var isTriggered = hasEventTriggered(ev.id);
            var chainHead = isChainHead(ev);
            var canTrigger = true;
            var reasons = [];

            // v20.3：原因不做短路，全部汇总——玩家一次看全要补什么。
            // 已完成的事件只显示「已完成」，不再堆叠其他条件。

            // 见识/地点前置（结识 + 人在其门内；不再要求弟子身份）
            if (!metNpc) {
                canTrigger = false;
                reasons.push('尚未结识');
            } else if (homeSect && playerLoc !== homeSect) {
                canTrigger = false;
                reasons.push('需亲至「' + homeSect + '」');
            }

            // 链式解锁：只有链头（前一个已完成且自己未完成）才可触发
            if (!isTriggered && !chainHead) {
                canTrigger = false;
                reasons.push('需先完成上一个事件');
            }

            // 检查好感度
            if (!isTriggered && affection < ev.minAffection) {
                canTrigger = false;
                reasons.push('好感≥' + ev.minAffection + '（当前' + affection + '）');
            }

            // 检查侍妾/弟子要求（链级）
            if (getEventChain(ev) === 'concubine' && !isConcubineOfThis) {
                canTrigger = false;
                reasons.push('需要侍妾身份');
            }
            if (getEventChain(ev) === 'disciple' && !isDisciple) {
                canTrigger = false;
                reasons.push('需要弟子身份');
            }

            // v20.2 新增门禁的逐条原因
            if (ev.requireRivalRomance && (typeof window.detectRivalRomance !== 'function' || !window.detectRivalRomance(ev.npcId))) {
                canTrigger = false;
                reasons.push('需先与另一位缔结情缘');
            }
            // v20.80 双人同框门禁的逐条原因
            if (ev.requireGuestFeelings && (typeof window._jealHasFeelings !== 'function' || !ev.guestId || !window._jealHasFeelings(ev.guestId))) {
                canTrigger = false;
                reasons.push('需那位来客也把你放在心上');
            }
            if (ev.requireSecondRomance && (typeof window._jealAllRivals !== 'function' || window._jealAllRivals(ev.npcId).length < 1)) {
                canTrigger = false;
                reasons.push('需世上另有一人把你放在心上');
            }
            if (ev.requirePartyCompanion && (typeof window._jealPartySuspects !== 'function' || !window._jealPartySuspects(ev.npcId))) {
                canTrigger = false;
                reasons.push('需队伍里另有一位故人同行');
            }
            if (ev.requireEventDone && (typeof hasEventTriggered !== 'function' || !hasEventTriggered(ev.requireEventDone))) {
                canTrigger = false;
                reasons.push('需先经历前情');
            }
            if (ev.requirePlayerFemale && player.gender !== 'female') {
                canTrigger = false;
                reasons.push('仅女修可经历');
            }
            if (ev.requirePlayerMale && player.gender !== 'male') {
                canTrigger = false;
                reasons.push('仅男修可经历');
            }
            if (ev.requireDaoCompanion && !(npc.hasFlag && npc.hasFlag('dao_companion'))) {
                canTrigger = false;
                reasons.push('需先结为道侣');
            }

            // 调用 checkEventTrigger 检查其他条件（简化版）
            if (canTrigger && typeof checkEventTrigger === 'function') {
                var evPlayer = window.currentCharData || {};
                if (!checkEventTrigger(ev, evPlayer)) {
                    canTrigger = false;
                    reasons.push('条件未满足');
                }
            }
            
            var btnClass = 'w-full text-left px-3 py-2 rounded text-sm transition-colors flex items-center gap-2 border ';
            if (isTriggered) {
                btnClass += 'bg-gray-800/40 border-gray-700 text-gray-500 cursor-default';
                chainHtml += '<div class="' + btnClass + '"><span>✅</span><span>' + ev.title + '</span><span class="text-xs text-gray-500 ml-auto">已完成</span></div>';
            } else if (canTrigger) {
                btnClass += 'bg-green-800/40 border-green-600 text-green-300 hover:bg-green-700/50 hover:border-green-500 cursor-pointer';
                chainHtml += '<button onclick="triggerPersonalEvent(\'' + ev.id + '\'); this.closest(\'.personal-event-modal\') ? this.closest(\'.personal-event-modal\').remove() : this.closest(\'.fixed\').remove();" class="' + btnClass + '"><span>' + (ev.icon || '📜') + '</span><span>' + ev.title + '</span><span class="text-xs text-green-400 ml-auto">可触发</span></button>';
            } else {
                btnClass += 'bg-gray-800/20 border-gray-700 text-gray-500 cursor-default';
                var reasonText = reasons.join('、') || '未知条件';
                chainHtml += '<div class="' + btnClass + '" title="' + reasonText + '"><span>🔒</span><span class="tracking-widest">？？？</span><span class="text-xs text-gray-600 ml-auto">' + reasonText + '</span></div>';
            }
        });
        chainHtml += '</div>';
        return chainHtml;
    }
    
    // 渲染主链（通用事件）
    html += renderChain(mainChain, '🎭 主线情缘');

    // v20.35 日常可重演桩（小心眼/余波/被晾等）：单独分组——不占主链"已完成"名额，
    // 演过之后标「已上演·可重演」而不是「已完成」，日子到了还会再撞见。
    var ambientChain = eventList.filter(function(ev) { return !!ev.ambient; });
    if (ambientChain.length > 0) {
        var ambientHtml = '';
        ambientHtml += '<div class="text-xs font-bold text-gray-400 mb-1">🌗 日常相处（可重演）</div>';
        ambientHtml += '<div class="space-y-1.5">';
        ambientChain.forEach(function(ev) {
            var cls = 'w-full text-left px-3 py-2 rounded text-sm transition-colors flex items-center gap-2 border ';
            if (hasEventTriggered(ev.id)) {
                cls += 'bg-gray-800/40 border-gray-700 text-gray-500 cursor-default';
                ambientHtml += '<div class="' + cls + '" title="会发生在日常里的桩——日子到了还会再撞见"><span>🔁</span><span>' + ev.title + '</span><span class="text-xs text-gray-500 ml-auto">已上演·可重演</span></div>';
                return;
            }
            var areasons = [];
            if (!metNpc) areasons.push('尚未结识');
            else if (homeSect && playerLoc !== homeSect) areasons.push('需亲至「' + homeSect + '」');
            if (affection < (ev.minAffection || 0)) areasons.push('好感≥' + ev.minAffection + '（当前' + affection + '）');
            if (ev.requireDaoCompanion && !(npc.hasFlag && npc.hasFlag('dao_companion'))) areasons.push('需先结为道侣');
            if (ev.requireRivalRomance && (typeof window.detectRivalRomance !== 'function' || !window.detectRivalRomance(ev.npcId))) areasons.push('需先与另一位缔结情缘');
            if (ev.requireGuestFeelings && (typeof window._jealHasFeelings !== 'function' || !ev.guestId || !window._jealHasFeelings(ev.guestId))) areasons.push('需那位来客也把你放在心上');
            if (ev.requireSecondRomance && (typeof window._jealAllRivals !== 'function' || window._jealAllRivals(ev.npcId).length < 1)) areasons.push('需世上另有一人把你放在心上');
            if (ev.requirePartyCompanion && (typeof window._jealPartySuspects !== 'function' || !window._jealPartySuspects(ev.npcId))) areasons.push('需队伍里另有一位故人同行');
            if (ev.requireEventDone && (typeof hasEventTriggered !== 'function' || !hasEventTriggered(ev.requireEventDone))) areasons.push('需先经历前情');
            if (ev.requireFestivalWound) {
                // 账本驱动桩：由每日钩子按账实弹，手动触发会弹到占位景——只给"自然来"的展示
                cls += 'bg-gray-800/20 border-gray-700 text-gray-500 cursor-default';
                ambientHtml += '<div class="' + cls + '" title="节日账上有亏欠、你回门时自然撞见"><span>🌙</span><span class="tracking-widest">？？？</span><span class="text-xs text-gray-600 ml-auto">日子到了自然来</span></div>';
                return;
            }
            if (areasons.length > 0) {
                cls += 'bg-gray-800/20 border-gray-700 text-gray-500 cursor-default';
                ambientHtml += '<div class="' + cls + '" title="' + areasons.join('、') + '"><span>🔒</span><span class="tracking-widest">？？？</span><span class="text-xs text-gray-600 ml-auto">' + areasons.join('、') + '</span></div>';
            } else {
                cls += 'bg-green-800/40 border-green-600 text-green-300 hover:bg-green-700/50 hover:border-green-500 cursor-pointer';
                ambientHtml += '<button onclick="triggerPersonalEvent(\'' + ev.id + '\'); this.closest(\'.personal-event-modal\') ? this.closest(\'.personal-event-modal\').remove() : this.closest(\'.fixed\').remove();" class="' + cls + '"><span>' + (ev.icon || '🌗') + '</span><span>' + ev.title + '</span><span class="text-xs text-green-400 ml-auto">可撞见</span></button>';
            }
        });
        ambientHtml += '</div>';
        html += ambientHtml;
    }
    // 侍妾/弟子专线：恒渲染，未达身份时逐条给「需要侍妾身份/需要弟子身份」原因（不再整栏隐藏）
    html += renderChain(concubineChain, '💕 侍妾专线');
    html += renderChain(discipleChain, '⚔️ 弟子专线');
    
    html += '</div></details>';
    return html;
}

// ============ v22.0 交谈即入戏：通用事件接线 ============
// 玩家在设置里勾掉「社交面板显示个人事件」（沉浸模式）后清单不再罗列——
// 那时该发生的事必须在交谈时自然发生，否则整条私人线不可达。接线分两路：
//   ① 拦面板（确定性）：事件已就绪（链头/好感/资格门禁/条件全过、夜戏守夜时辰）且
//      「门槛低」（好感≤20）或本就没有自动弹出标记的——玩家一开口，事件直接开场，社交面板不再显示。
//      ambient 日常小事隔够重演周期（默认14日）也会在交谈里自然撞见，主线大事优先。
//   ② 概率弹出：带 autoTrigger 标记的高门槛事件走原有 maybeAutoTriggerPersonalEvent('greet')
//      ——「她叫住了你」，弹不弹看概率与时辰，不拦面板；各线原有的 daily/sect 钩子照旧。
// 面板开关开启时不拦截（玩家自己点清单），只保留②。
// 默认口径（本批翻面后）：清单默认罗列 ⇒ 默认**不**拦截，面板照常出，玩家自己点；
// 玩家在设置里显式勾掉「社交面板显示个人事件」才进沉浸模式，那时清单不画，就绪的事必须当场开场。

// 事件此刻是否就绪（与自动触发同一套门禁，另守 autoTrigger.timeRange 时辰窗——夜戏夜演）
function isEventReadyNow(npc, ev, affection) {
    if (!ev || !npc || !window.currentCharData) return false;
    if (typeof _ensureAmbientTag === 'function') _ensureAmbientTag(ev);
    if (hasEventTriggered(ev.id)) {
        // 一次性事件演过即毕；日常小事隔够重演周期可再撞见
        if (!(ev.ambient && typeof _ambientRearmOk === 'function' && _ambientRearmOk(npc, ev))) return false;
    }
    if (!isChainHead(ev)) return false;
    if ((affection || 0) < (ev.minAffection || 0)) return false;
    if (!canPlayerAccessPersonalEvent(ev, npc)) return false;
    if (!checkEventTrigger(ev, window.currentCharData)) return false;
    if (ev.autoTrigger && ev.autoTrigger.timeRange && typeof inHourRange === 'function') {
        var rawHour = window.timeSystem && window.timeSystem.gameTime ? window.timeSystem.gameTime.currentHour : null;
        var hour = (rawHour === null || rawHour === undefined) ? 12 : Number(rawHour);
        if (!inHourRange(hour, ev.autoTrigger.timeRange)) return false;
    }
    return true;
}

// 这条私人线是否已演到终章（泛化自各线硬编码的 finalEvents：主链序号最大的一桩已完成即终章）
// 终章之后不再自动弹出/拦截——余韵留白，与各线原有「finalEvents 之后停弹」的口径一致。
function isPersonalLineFinished(npcId) {
    var maxOrder = 0, maxEv = null;
    for (var key in NPC_PERSONAL_EVENTS) {
        var ev = NPC_PERSONAL_EVENTS[key];
        if (!ev || ev.npcId !== npcId || ev.ambient) continue;
        if (getEventChain(ev) !== 'main') continue;
        var o = getChainOrder(ev);
        if (o > maxOrder) { maxOrder = o; maxEv = ev; }
    }
    return !!(maxEv && hasEventTriggered(maxEv.id));
}

// 拦面板：找一桩就绪的低门槛/无弹出标记事件直接开场；成功返回 true（调用方不再显示社交面板）
function tryInterceptPersonalEvent(npc, npcId) {
    if (!npc || !npcId || !window.currentCharData) return false;
    if (typeof NPC_PERSONAL_EVENTS === 'undefined') return false;
    if (typeof document !== 'undefined' && document.querySelector && document.querySelector('.personal-event-modal')) return false; // 已有事件在演，不叠台
    var affection = (npc.relationship && npc.relationship.affection) || 0;
    var best = null, bestRank = null;
    for (var key in NPC_PERSONAL_EVENTS) {
        var ev = NPC_PERSONAL_EVENTS[key];
        if (!ev || ev.npcId !== npcId) continue;
        // 拦截资格：门槛低（好感≤20）或本就没有自动弹出标记（有标记的高门槛事件走自己的概率路，不必拦）
        if (!((ev.minAffection || 0) <= 20 || !ev.autoTrigger)) continue;
        if (!isEventReadyNow(npc, ev, affection)) continue;
        // 主线大事优先于日常小事；同组按链序取最靠前的一桩
        var rank0 = ev.ambient ? 1 : 0, rank1 = getChainOrder(ev);
        if (!best || rank0 < bestRank[0] || (rank0 === bestRank[0] && rank1 < bestRank[1])) {
            best = ev; bestRank = [rank0, rank1];
        }
    }
    if (!best) return false;
    return triggerPersonalEvent(best.id) === true;
}

// 交谈总闸（showNPCDialog 亲至分支调用）：返回 true = 已拦面板开场，调用方直接 return
function personalEventGreetGate(npc, npcId) {
    if (!npc || !npcId) return false;
    if (typeof NPC_PERSONAL_EVENTS === 'undefined') return false;
    var hasAny = false;
    for (var k in NPC_PERSONAL_EVENTS) {
        if (NPC_PERSONAL_EVENTS[k] && NPC_PERSONAL_EVENTS[k].npcId === npcId) { hasAny = true; break; }
    }
if (!hasAny) return false;
    if (isPersonalLineFinished(npcId)) return false; // 终章已演完，余韵留白
    // 沉浸模式（玩家显式关掉了清单罗列）：先试确定性拦面板——
    // 清单不画，就绪的事必须在这一句话里开场，否则整条私人线不可达。
    if (!isPersonalEventListShown()) {
        if (tryInterceptPersonalEvent(npc, npcId)) return true;
    }
    // 概率路：全线通用「她叫住了你」——此前只有逐线硬编码的几条线有 greet 源，
    // 其余二十多条线只能等每日兜底；现在凡亲至交谈皆有机会自然弹出。
    if (typeof maybeAutoTriggerPersonalEvent === 'function') {
        try { maybeAutoTriggerPersonalEvent(npcId, 'greet'); } catch (e) {}
    }
    return false;
}

// ============ 导出 ============
if (typeof window !== 'undefined') {
    window.NPC_PERSONAL_EVENTS = NPC_PERSONAL_EVENTS;
    window.initPersonalEventSystem = initPersonalEventSystem;
    window.checkEventTrigger = checkEventTrigger;
    window.canPlayerAccessPersonalEvent = canPlayerAccessPersonalEvent;
    window.triggerPersonalEvent = triggerPersonalEvent;
    window.hasEventTriggered = hasEventTriggered;
    window.resetPersonalEventFlags = resetPersonalEventFlags;
    window.getPersonalEventButtons = getPersonalEventButtons;
    window.getSecretDisplayHtml = getSecretDisplayHtml;
    window.getSecretHtml = getSecretDisplayHtml;
    window.injectSectSecrets = injectSectSecrets;
// v22.0 交谈即入戏
    window.isEventReadyNow = isEventReadyNow;
    window.isPersonalLineFinished = isPersonalLineFinished;
    window.tryInterceptPersonalEvent = tryInterceptPersonalEvent;
    window.personalEventGreetGate = personalEventGreetGate;
    // 清单是否罗列（唯一判定口）：默认罗列，只有显式勾掉设置才进沉浸模式
    window.isPersonalEventListShown = isPersonalEventListShown;
}

// ============ 秘密显示HTML（用于对话面板） ============
// 直接从npc.secrets读取（已由showNPCDialog注入），不依赖SECT_DEEP_DATA
function getSecretDisplayHtml(npc) {
    if (!npc || !npc.secrets) return '';
    var keys = Object.keys(npc.secrets);
    if (keys.length === 0) return '';
    
    var unlocked = [];
    var locked = [];
    for (var i = 0; i < keys.length; i++) {
        var s = npc.secrets[keys[i]];
        if (s.unlocked) unlocked.push(s);
        else locked.push(s);
    }
    
    var html = '<details class="mt-2" open>';
    html += '<summary class="cursor-pointer text-yellow-400 text-xs font-bold">🔐 秘密（' + unlocked.length + '/' + keys.length + '）<span class="ml-1 w-3.5 h-3.5 rounded-full bg-blue-500 text-white inline-flex items-center justify-center cursor-help" style="font-size:9px;line-height:1" onclick="event.stopPropagation();showTooltip(\'秘密是NPC不愿提起的过往\')">?</span></summary>';
    html += '<div class="mt-2 space-y-2">';
    
    for (var ui = 0; ui < unlocked.length; ui++) {
        var s = unlocked[ui];
        html += '<div class="bg-green-900/30 border border-green-700/50 rounded p-2">';
        html += '<p class="text-xs text-green-400 font-bold">✅ ' + (s.title || s.id) + '</p>';
        html += '<p class="text-xs text-gray-300 mt-1">' + (s.content || s.desc || '') + '</p>';
        html += '</div>';
    }
    for (var li = 0; li < locked.length; li++) {
        var s = locked[li];
        html += '<div class="bg-gray-800/40 border border-gray-700 rounded p-2">';
        html += '<p class="text-xs text-gray-500">🔒 ???</p>';
        html += '<p class="text-xs text-gray-600 mt-1">尚未解锁</p>';
        html += '</div>';
    }
    html += '</div></details>';
    return html;
}

// ============ 日常好感衰减机制（v12.3：扩展至所有有感情线的核心NPC） ============
// v20.3 修订：
//   1. 名册补齐 8 位——四男主线此前不在衰减之列，久不联系好感纹丝不动，与「感情需维系」的现实逻辑相悖。
//   2. 互动时钟取两个真实来源中较近者：个人事件当天 / 亲至本人处见面当天（远程查看不计入，见 npc-system.js showNPCDialog 的 isRemote 分支）。
//      旧版只认个人事件——玩家天天登门问候却因事件池空转而照样衰减，不合常理。
//   3. 道侣不衰减：结契之盟是制度性羁绊（ registerEndingCallback 落 dao_companion 标记），非路人情分，不随未见而磨蚀。
//   4. 默认关闭：衰减属可选难度，由设置页「难度设置 → 感情维系衰减」开关控制（window._settings.affectionDecay）。
//      未开启时本机制完全不参与，任何好感都不会因未联系而下降。
function checkDailyAffectionDecay() {
    if (!(window._settings && window._settings.affectionDecay === true)) return; // 默认不开启
    // 第二十四波：洞府「客房」不再是死账——卡面写着「好感衰减暂停 30 天」，此前全仓没人兑现。
    // 客房落成起三十日内，人来人往有个落脚处，故人的情分不因少走动而磨蚀；期满衰减照旧。
    try {
        if (window.CaveFacilities && typeof window.CaveFacilities.getFacilities === 'function') {
            var _facs = window.CaveFacilities.getFacilities('player') || [];
            var _todayG = 0;
            if (typeof window.getAbsoluteDay === 'function') _todayG = Math.floor(window.getAbsoluteDay() || 0);
            else if (window.timeSystem && window.timeSystem.gameTime) _todayG = Math.floor(window.timeSystem.gameTime.currentDay || 0);
            for (var _fi = 0; _fi < _facs.length; _fi++) {
                var _f = _facs[_fi];
                if (_f && _f.facilityId === 'fac_guest_room' && (_todayG - (Number(_f.installedDay) || 0)) <= 30) return;
            }
        }
    } catch (eGuest) {}
    var coreIds = ['sect_leader_修罗宫', 'sect_leader_百花谷', 'sect_leader_天山派', 'sect_leader_五仙教',
                   'sect_leader_铸剑山庄', 'sect_leader_药王谷', 'sect_leader_茅山派', 'sect_leader_金刚宗',
                   'sect_leader_峨眉派', 'sect_leader_华山派', 'sect_leader_唐门', 'sect_leader_武当派',
                   'sect_leader_蓬莱派', 'sect_leader_逍遥派',
                   'sect_leader_恒山派', 'sect_leader_嵩山派', 'sect_leader_泰山派',
                   'sect_leader_青城派', 'sect_leader_衡山派', 'sect_leader_丐帮',
                   'sect_leader_阎罗殿', 'sect_leader_血手门', 'sect_leader_飞蝎坞',
                   'sect_leader_烈日教', 'sect_leader_天龙教',
                   'sect_leader_神机门', 'sect_leader_霹雳堂', 'sect_leader_天书阁',
                   'sect_leader_大隐阁', 'sect_leader_侠隐阁', 'sect_leader_天涯海阁',
                   'sect_leader_大旗门', 'sect_leader_铁掌帮', 'sect_leader_昆仑派',
                   'sect_leader_全真教', 'sect_leader_少林寺', 'shaolin_wujiu']; // v20.75 蓬莱瀛晚照、逍遥闻人酌入册；v20.76 第二批六人入册；v20.77 第三批反派五人入册；v20.78 第四批奇门十人入册；v20.79 少林竺照禅+破戒僧无咎入册（三十六派全覆盖收官）
    for (var i = 0; i < coreIds.length; i++) {
        var npc = window.npcManager?.getNPC(coreIds[i]);
        if (!npc) continue;
        if ((npc.relationship?.affection || 0) <= -50) continue;
        // 道侣之盟不随未见而磨蚀
        if (npc.hasFlag && npc.hasFlag('dao_companion')) continue;

        if (!window._lastInteractDay) window._lastInteractDay = {};
        var npcId = npc.id;
        var currentDay = window.timeSystem?.gameTime?.currentDay || 0;
        var lastDay = window._lastInteractDay[npcId] || 0;
        // 见面当天（游戏历法）：1440 游戏分钟为一天，与 time-system.js 的 currentDay 换算一致
        // NEW-39：改调公共读取函数 npcLastMeetGameMinute（null=从未谋面），不再就地绕行——两处口径统一
        var totalMin = Number(window.timeSystem?.gameTime?.totalMinutes) || 0;
        var lastMeetMin = (typeof window.npcLastMeetGameMinute === 'function') ? window.npcLastMeetGameMinute(npc) : null;
        if (lastMeetMin != null && totalMin >= lastMeetMin) {
            var meetDay = Math.floor(lastMeetMin / 1440) + 1;
            if (meetDay > lastDay) lastDay = meetDay;
        }
        if (lastDay <= 0) lastDay = currentDay; // 无任何互动记录（新档首日）不起算
        var daysSince = currentDay - lastDay;

        if (daysSince >= 3 && daysSince < 7) {
            npc.relationship.affection = Math.max(-100, (npc.relationship.affection || 0) - 1);
        } else if (daysSince >= 7) {
            npc.relationship.affection = Math.max(-100, (npc.relationship.affection || 0) - 3);
        }
    }
}

// 注册每日钩子
if (typeof window !== 'undefined' && window.timeSystem && window.timeSystem.onNewDaySubscribe) {
    window.timeSystem.onNewDaySubscribe(function(oldDay, newDay) {
        checkDailyAffectionDecay();
    });
}

// 注册修罗宫结局集（v12.3：结局注册表，百花谷等新线在各自文件中注册）
registerEndingSet('sect_leader_修罗宫', XIULUO_ENDINGS);

// v20.25 绯泪线名册落笔：共主（道侣+副门主）、归心（纯道侣）两个定情结局才点道侣旗；
// 比邻是并肩之谊、归处是常伴之暖，皆非结契——名册只认真拜过堂的人。
// （此前修罗宫是唯一没有结局回调的主角线：旗不落，回访/双修/护法全断线。）
registerEndingCallback('sect_leader_修罗宫', function(endingName, npc) {
    if (endingName === '共主' || endingName === '归心') {
        if (npc && typeof npc.setFlag === 'function') npc.setFlag('dao_companion');
        if (window.showMessage) window.showMessage('🥀 你与绯泪定下白首之约——修罗宫上下，从此认你这半个主人。', 'success');
    }
});

// 导出
if (typeof window !== 'undefined') {
    window.showEndingScene = showEndingScene;
    window.XIULUO_ENDINGS = XIULUO_ENDINGS;
    window.NPC_ENDING_SETS = NPC_ENDING_SETS;
    window.registerEndingSet = registerEndingSet;
    window.registerEndingCallback = registerEndingCallback;
window._ambientRearmOk = _ambientRearmOk;
    window._ensureAmbientTag = _ensureAmbientTag;
    // v26.9 后果受控枚举：类型表 / 映射表 / 兼容层台账 / 结算与渲染入口，全部挂 window 供测试与调试取数
    window.NPC_EFFECT_KINDS = NPC_EFFECT_KINDS;
    window.NPC_EFFECT_SPEC = NPC_EFFECT_SPEC;
    window.NPC_EFFECT_MAP = NPC_EFFECT_MAP;
    window.NPC_EFFECT_WEIGHTS = NPC_EFFECT_WEIGHTS;
    window.NPC_EFFECT_COMPAT = NPC_EFFECT_COMPAT;
    window.settleNpcEventConsequence = settleNpcEventConsequence;
    window.renderNpcEventConsequence = renderNpcEventConsequence;
    // 启途接线：旗标的读侧与消费端（后续事件/面板靠它们看见已开的路）
    window.peOpenFlagName = peOpenFlagName;
    window.peOpenNoteKey = peOpenNoteKey;
    window.peRouteKey = peRouteKey;
    window.hasOpenRoute = hasOpenRoute;
    window.openRoutesOf = openRoutesOf;
    window.openRouteCount = openRouteCount;
    window.openRouteLabel = openRouteLabel;
    window.applyEventEffects = applyEventEffects;
    window.NPC_OPEN_ROUTE_FOLLOWS = NPC_OPEN_ROUTE_FOLLOWS;
    window.NPC_OPEN_ROUTE_LEDGER_NOTE = NPC_OPEN_ROUTE_LEDGER_NOTE;
}

console.log('[个人事件] 系统加载完成，已注册 ' + Object.keys(NPC_PERSONAL_EVENTS).length + ' 个事件');

// 自动初始化（SECT_DEEP_DATA 已先于NPC系统加载，直接调用）
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPersonalEventSystem);
    } else {
        initPersonalEventSystem();
    }
}
