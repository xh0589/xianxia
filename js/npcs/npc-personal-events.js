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
                { text: '「看人。」——「那你看我，像能信的人吗？」', effect: 'depends', affection: 8, subOption: 'like' }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'believe': aff = 3; msg = '她笑了笑：「天真。」但语气不冷。'; break;
                case 'doubt': aff = 5; msg = '她低头：「……我也是。」'; break;
                case 'like': aff = 8; msg = '她看了你很久：「……有趣。」'; break;
                case 'unlike': aff = 2; msg = '她淡淡地笑了一下。'; break;
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
        desc: '绯泪把她的真名告诉了你。',
        trigger: { random: 0.5 },
        cooldown: 0,
        flag: 'xl_e013_done',
        scenes: [
            { speaker: 'narrator', text: '你的房间里多了一封信，信上只有两个字。', type: 'description' },
            { speaker: 'narrator', text: '「绯泪」——那是她的真名。', type: 'description' },
            { speaker: 'narrator', text: '你去找她。她正坐在梳妆台前，把那根断簪插回发髻。', type: 'description' },
            { speaker: 'narrator', text: '她从镜子里看到你，笑了一下。', type: 'description' },
            { speaker: 'npc', text: '……你知道真名，在修仙界意味着什么吗？' },
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
            { speaker: 'npc', text: '两个人都知道他不是故意的。但「不是故意的」并不能让我死而复生。' },
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
                { text: '「我想做你的朋友。你扛就行，我在你身边。」', effect: 'friend_rest', affection: 15 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '', ending = '';
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
            }
            return { affection: aff, msg: msg, ending: ending };
        }
    }
};

// ============ 她的日常（18件）——绯泪做了但不说的那些事 ============
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
    'xl_event_018': { id: 'xl_event_018', npcId: 'sect_leader_修罗宫', title: '伤药', icon: '💊', desc: '你受了伤但瞒着没说。', minAffection: 20, trigger: { random: 0.3 }, cooldown: 0, flag: 'xl_e018_done', autoTrigger: { random: 0.3 },
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
    'xl_event_021': { id: 'xl_event_021', npcId: 'sect_leader_修罗宫', title: '一对杯盏', icon: '☕', desc: '议事厅里多了一只杯盏。', minAffection: 35, trigger: { random: 0.2 }, cooldown: 0, flag: 'xl_e021_done', autoTrigger: { random: 0.25 },
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

// ============ 她的靠近（12件）——她在主动让你发现 ============
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
    try { localStorage.setItem('xianxia_personal_event_flags', JSON.stringify(personalEventFlags)); } catch(e) {}
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

// v18.8：个人线资格统一门禁。
// 当前个人事件池只有百花谷主/修罗宫主，两条线的叙事都发生在本门内部；
// 因此不能只靠 UI 调用位置保证资格，底层触发函数也必须验证：已见过、本门身份、人在本门。
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
    if (sectId) {
        var ds = window.discipleState || {};
        if (!ds.isInSect || ds.sectId !== sectId) return false;
        if ((window.currentCharData.location || '') !== sectId) return false;
    }

    var isConcubine = !!(window.currentCharData.isConcubine || (window.discipleState && window.discipleState.isConcubine));
    if (eventDef.requireConcubine && !isConcubine) return false;
    if (eventDef.requireDisciple) {
        var d = window.discipleState || {};
        if (!d.isInSect || d.sectId !== sectId || isConcubine) return false;
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
        return;
    }
    
    var npc = ev.npc;
    var npcName = npc.name;
    var npcIcon = npc.appearance?.icon || '👤';
    var playerName = window.currentCharData?.name || '道友';
    
    if (scene.speaker === 'narrator') {
        appendPEMessage('narrator', scene.text.replace(/{playerName}/g, playerName).replace(/{npc_name}/g, npcName));
        ev._nextIndex = index + 1;
        setTimeout(function() { renderPersonalEventScene(ev._nextIndex); }, 350);
    } else if (scene.speaker === 'npc') {
        appendPEMessage('npc', scene.text.replace(/{playerName}/g, playerName).replace(/{npc_name}/g, npcName), npcIcon, npcName, scene.emotion);
        ev._nextIndex = index + 1;
        setTimeout(function() { renderPersonalEventScene(ev._nextIndex); }, 450);
    } else if (scene.speaker === 'player_select') {
        var optionsHtml = '<div class="bg-gray-700/50 p-3 rounded-lg border border-gray-600"><p class="text-sm text-gray-300 mb-2">' + scene.text + '</p><div class="space-y-2">';
        scene.options.forEach(function(opt, oi) {
            optionsHtml += '<button onclick="handlePersonalEventChoice(' + index + ',' + oi + ')" class="w-full text-left p-2.5 bg-gray-700 hover:bg-gray-600 hover:border-yellow-500 rounded-lg border border-gray-600 text-sm text-gray-200 transition-colors">' + opt.text.replace(/{playerName}/g, playerName) + '</button>';
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
    } else if (type === 'npc') {
        div.className = 'bg-gray-700/50 p-3 rounded-lg border-l-4 border-pink-500';
        var emotionHtml = '';
        if (emotion) {
            var emotionMap = { 'hesitant': '😅 犹豫', 'neutral': '😐 平静', 'friendly': '😊 友好', 'warm': '😌 温和', 'happy': '😄 开心', 'grateful': '🥺 感激', 'serious': '😑 严肃', 'deep': '😔 深邃', 'determined': '😤 坚定', 'generous': '😊 慷慨', 'solemn': '😐 庄重' };
            emotionHtml = '<span class="text-xs text-gray-400">' + (emotionMap[emotion] || emotion) + '</span>';
        }
        div.innerHTML = '<div class="flex items-center gap-2 mb-1"><span class="text-xl">' + (npcIcon || '👤') + '</span><span class="text-sm font-bold text-pink-400">' + (npcName || '') + '</span><span class="ml-auto">' + emotionHtml + '</span></div><p class="text-gray-200 text-sm">' + content + '</p>';
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
    playerDiv.innerHTML = '<div class="flex items-center gap-2 mb-1"><span class="text-sm font-bold text-blue-300">' + playerName + '</span></div><p class="text-gray-200 text-sm">' + choice.text.replace(/{playerName}/g, playerName) + '</p>';
    ev.msgArea.appendChild(playerDiv);
    ev.msgArea.scrollTop = ev.msgArea.scrollHeight;
    
    // 应用效果
    var result = ev.eventDef.effects(npc, choice.effect);
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
    if (result.item && typeof window.addItem === 'function') {
        window.addItem(result.item, 1);
        var itemDiv = document.createElement('div');
        itemDiv.className = 'text-center py-1';
        itemDiv.innerHTML = '<p class="text-green-400 text-xs">📦 获得物品：' + (window.itemById?.[result.item]?.name || result.item) + '</p>';
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

// ============ 获取NPC的个人事件按钮（用于对话面板显示） ============
function getPersonalEventButtons(npc, npcId) {
    if (!npc || !npcId) return '';
    // v18.8：游客、异派弟子、远程档案、尚未见面的NPC不展示私人事件入口。
    var anyEvent = null;
    for (var gateKey in NPC_PERSONAL_EVENTS) {
        if (NPC_PERSONAL_EVENTS[gateKey] && NPC_PERSONAL_EVENTS[gateKey].npcId === npcId) { anyEvent = NPC_PERSONAL_EVENTS[gateKey]; break; }
    }
    if (anyEvent && !canPlayerAccessPersonalEvent(anyEvent, npc)) return '';
    
    // 每次调用时尝试注入秘密（幂等，确保NPC实例已获得secrets数据）
    injectSectSecrets();
    
    // 查找属于该NPC的所有个人事件
    var eventList = [];
    for (var key in NPC_PERSONAL_EVENTS) {
        var ev = NPC_PERSONAL_EVENTS[key];
        if (ev.npcId === npcId) {
            eventList.push(ev);
        }
    }
    if (eventList.length === 0) return '';
    
    var player = window.currentCharData || {};
    var isConcubine = player.isConcubine || window.discipleState?.isConcubine || false;
    var isDisciple = window.discipleState?.isInSect && window.discipleState?.sectId === '修罗宫' && !isConcubine;
    var affection = npc.relationship?.affection || 0;
    
    // 统计已触发数量
    var triggeredCount = eventList.filter(function(ev) { return hasEventTriggered(ev.id); }).length;
    
    // 按链分组排序：主链 E → 侍妾链 S → 弟子链 D
    var mainChain = eventList.filter(function(ev) { return getEventChain(ev) === 'main'; })
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
    html += '<span class="text-xs text-gray-500 font-normal">（已完成 ' + triggeredCount + '/' + eventList.length + '）</span>';
    html += '</summary>';
    html += '<div class="space-y-3">';
    
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
            
            // 链式解锁：只有链头（前一个已完成且自己未完成）才可触发
            if (!isTriggered && !chainHead) {
                canTrigger = false;
                reasons.push('需先完成上一个事件');
            }
            
            // 检查是否已触发
            if (isTriggered) {
                canTrigger = false;
                reasons.push('已完成');
            }
            
            // 检查好感度
            if (canTrigger && affection < ev.minAffection) {
                canTrigger = false;
                reasons.push('好感≥' + ev.minAffection + '（当前' + affection + '）');
            }
            
            // 检查侍妾/弟子要求（链级）
            if (canTrigger && getEventChain(ev) === 'concubine' && !isConcubine) {
                canTrigger = false;
                reasons.push('需要侍妾身份');
            }
            if (canTrigger && getEventChain(ev) === 'disciple' && !isDisciple) {
                canTrigger = false;
                reasons.push('需要弟子身份');
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
    // 渲染侍妾链（仅侍妾可见）
    if (isConcubine) {
        html += renderChain(concubineChain, '💕 侍妾专线');
    }
    // 渲染弟子链（仅弟子可见）
    if (isDisciple) {
        html += renderChain(discipleChain, '⚔️ 弟子专线');
    }
    
    html += '</div></details>';
    return html;
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
function checkDailyAffectionDecay() {
    var coreIds = ['sect_leader_修罗宫', 'sect_leader_百花谷'];
    for (var i = 0; i < coreIds.length; i++) {
        var npc = window.npcManager?.getNPC(coreIds[i]);
        if (!npc) continue;
        if ((npc.relationship?.affection || 0) <= -50) continue;
        
        if (!window._lastInteractDay) window._lastInteractDay = {};
        var npcId = npc.id;
        var currentDay = window.timeSystem?.gameTime?.currentDay || 0;
        var lastDay = window._lastInteractDay[npcId] || currentDay;
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

// 导出
if (typeof window !== 'undefined') {
    window.showEndingScene = showEndingScene;
    window.XIULUO_ENDINGS = XIULUO_ENDINGS;
    window.NPC_ENDING_SETS = NPC_ENDING_SETS;
    window.registerEndingSet = registerEndingSet;
    window.registerEndingCallback = registerEndingCallback;
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
