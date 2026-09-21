// ==================== male-lead-aftermath.js - 男主道侣回访（结契后）事件 v1.0 ====================
// 依赖：npcs/npc-personal-events.js、npc-system.js（dao_companion flag）
// 加载顺序：在十六位男主事件文件 + male-lead-rivalry.js 之后
// 终章结局演出后，道侣关系不戛然而止。结契后回访——安静收束 + 真实增益。
// v20.76 第二批：嵩山逵佩南（执法堂晨光）、丐帮桑拾玖（讯房晨光）入册，九位男主齐。
// v20.77 第三批：阎罗殿聂明泽（档房晨光，两个名字正式归档同一页——接「携簿/并档」道侣结局）入册，十位男主齐。
// v20.78 第四批：霹雳堂雷惊蛰（药坊晨光，批注双人核——接「携光/近听」）、天书阁宓书言（万卷楼晨光，批语不过四作废——接「同讎/存疑」）、
// 大隐阁隗九爻（街口晨光，签头空着正好留往后——接「破卦/尽言」）、侠隐阁简知忆（东院晨光，空白档页头一行落了字——接「携卷/填栏」）、
// 天涯海阁狄长亭（总驿晨光，铜符离了身人有归站——接「同程/挑灯」）、大旗门樊惊筹（旗房晨光，收口针头一回载字——接「卸旗/并针」）入册，十六位男主齐。

var MALE_AFTERMATH_EVENTS = {
    // ---- 冶砚：炉房晨光 ----
    'lu_event_aftermath': {
        id: 'lu_event_aftermath', npcId: 'sect_leader_铸剑山庄', title: '炉房晨光', icon: '🔥',
        desc: '结契后头一个清晨，炉房的灯还亮着。',
        minAffection: 80, trigger: { random: 1.0 }, cooldown: 0, flag: 'lu_e_aftermath_done',
        requireDaoCompanion: true, requireEventDone: 'lu_event_013',
        scenes: [
            { speaker: 'narrator', text: '结契后头一个清晨。你醒来时，炉房的灯还亮着——冶砚比你还早，在打铁，听见你动静，没回头。', type: 'description' },
            { speaker: 'npc', text: '「醒了？」冶砚虎牙露出来，把一柄刚开刃的小刀推到你手边，「铸剑的道侣，得先学一件事——别让自己冷。你冷了，炉也冷。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「那你以后别一个人守炉。我替你拉风箱。」', effect: 'share', affection: 6 },
                { text: '握住那柄小刀：「烫。」', effect: 'hot', affection: 5 },
                { text: '拉过他的手：「你也别累着。」', effect: 'care', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'share': aff = 6; msg = '他咧嘴笑，虎牙全露：「……行。两个守炉的人。」他把风箱拉杆分了一根给你——笨手笨脚，他没嫌弃，只在你拉的节奏乱时轻轻一扶。炉房的灯，从那夜起是两盏。'; break;
                case 'hot': aff = 5; msg = '他弯了弯眼：「烫就对了。铸剑的火，暖人。」他替你把小刀收好，「道侣的刀，也得有人哄着用。」'; break;
                case 'care': aff = 7; msg = '他没抽手，掌心很烫。「……我知道。」他低声，「头一回有人跟我说这句。」他反手握了握你，「一起，别累着。」'; break;
            }
            if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            if (typeof window.addEssence === 'function') window.addEssence(8);
            return { affection: aff, msg: msg };
        }
    },
    // ---- 芩木：药庐晨光 ----
    'su_event_aftermath': {
        id: 'su_event_aftermath', npcId: 'sect_leader_药王谷', title: '药庐晨光', icon: '🌿',
        desc: '结契后头一个清晨，药庐的灯还亮着。',
        minAffection: 80, trigger: { random: 1.0 }, cooldown: 0, flag: 'su_e_aftermath_done',
        requireDaoCompanion: true, requireEventDone: 'su_event_013',
        scenes: [
            { speaker: 'narrator', text: '结契后头一个清晨。你醒来时，药庐的灯还亮着——芩木在熬药，听见你动静，没回头。', type: 'description' },
            { speaker: 'npc', text: '「醒了？」芩木温润地笑，把一碗温药推到你手边，「医毒的道侣，得先学一件事——别让自己病。你病了，我分心。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「那你以后别一个人熬药。我替你看火。」', effect: 'share', affection: 6 },
                { text: '喝一口药：「苦。」', effect: 'bitter', affection: 5 },
                { text: '拉过他的手：「你也别累着。」', effect: 'care', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'share': aff = 6; msg = '他温润地笑，眼底终于到底：「……行。两个守药的人。」他把炉前的位分了一半给你——笨手笨脚，他没嫌弃，只在你火候错时轻轻一扶。药庐的灯，从那夜起是两盏。'; break;
                case 'bitter': aff = 5; msg = '他弯了弯眼：「苦就对了。苦入心，去火。」他替你把碗收走，又塞了一颗蜜饯，「道侣的药，也得有人哄着喝。」'; break;
                case 'care': aff = 7; msg = '他没抽手，指尖凉。「……我知道。」他低声，「头一回有人跟我说这句。」他反手握了握你，「一起，别累着。」'; break;
            }
            if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            if (typeof window.addEssence === 'function') window.addEssence(8);
            return { affection: aff, msg: msg };
        }
    },
    // ---- 昴既明：符阁晨光 ----
    'ms_event_aftermath': {
        id: 'ms_event_aftermath', npcId: 'sect_leader_茅山派', title: '符阁晨光', icon: '🪔',
        desc: '结契后头一个清晨，符阁的灯还亮着。',
        minAffection: 80, trigger: { random: 1.0 }, cooldown: 0, flag: 'ms_e_aftermath_done',
        requireDaoCompanion: true, requireEventDone: 'ms_event_013',
        scenes: [
            { speaker: 'narrator', text: '结契后头一个清晨。你醒来时，符阁的灯还亮着——昴既明在画符，听见你动静，执笔的手没停。', type: 'description' },
            { speaker: 'npc', text: '「醒了？」他声音清冷，把一道护身符推到你手边，「伏魔的道侣，得先学一件事——别让邪祟近你。你近了，我分心。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「那你以后别一个人守阁。我替你研朱砂。」', effect: 'share', affection: 6 },
                { text: '接过护身符，收好', effect: 'take', affection: 5 },
                { text: '拉过他的手：「你也别累着。」', effect: 'care', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'share': aff = 6; msg = '他看了你一眼，银光里有暖：「……行。两个守阁的人。」他把朱砂钵分了一半给你——笨手笨脚，他没嫌弃，只在你研的朱砂粗时轻轻一扶。符阁的灯，从那夜起是两盏。'; break;
                case 'take': aff = 5; msg = '他看你把符收进最贴身的地方，银光敛了：「……你收着。」他继续画下一道，「我给你画的，不止这一道。」'; break;
                case 'care': aff = 7; msg = '他没抽手，指尖凉。「……我知道。」他低声，「头一回有人跟我说这句。」他反手握了握你，「一起，别累着。」'; break;
            }
            if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            if (typeof window.addEssence === 'function') window.addEssence(8);
            return { affection: aff, msg: msg };
        }
    },
    // ---- 赫渊：塔内晨光 ----
    'jg_event_aftermath': {
        id: 'jg_event_aftermath', npcId: 'sect_leader_金刚宗', title: '塔内晨光', icon: '📿',
        desc: '结契后头一个清晨，塔内的灯还亮着。',
        minAffection: 80, trigger: { random: 1.0 }, cooldown: 0, flag: 'jg_e_aftermath_done',
        requireDaoCompanion: true, requireEventDone: 'jg_event_013',
        scenes: [
            { speaker: 'narrator', text: '结契后头一个清晨。你醒来时，塔内的灯还亮着——赫渊盘坐，金刚线没缠回，听见你动静，没睁眼。', type: 'description' },
            { speaker: 'npc', text: '他许久没动，然后——极轻地开口：「……醒了。」闭口禅，又为你续上了。「炼体的道侣，得先学一件事——别让自己伤。你伤了，我分心。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「那你以后别一个人守塔。我替你点灯。」', effect: 'share', affection: 6 },
                { text: '盘坐他旁边，闭目同修', effect: 'sit', affection: 7 },
                { text: '拉过他的手：「你也别累着。」', effect: 'care', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'share': aff = 6; msg = '他看了你一眼，沉静的眼底有暖：「……行。两个守塔的人。」他把塔灯分了一盏给你——笨手笨脚，他没嫌弃，只在你点的灯不稳时轻轻一扶。塔内的灯，从那夜起是两盏。'; break;
                case 'sit': aff = 7; msg = '你没说话，盘坐他旁边。他没动，许久，肩靠过来一点点——很轻。「……你坐着，比苦行崖的石头暖。」他低声。'; break;
                case 'care': aff = 7; msg = '他没抽手，掌心热——炼体的人。「……我知道。」他低声，「头一回有人跟我说这句。」他反手握了握你，「一起，别累着。」'; break;
            }
            if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            if (typeof window.addEssence === 'function') window.addEssence(8);
            return { affection: aff, msg: msg };
        }
    },
    // ---- 竺听雨：崖庐雨霁（v20.73 入册） ----
    'hs_event_aftermath': {
        id: 'hs_event_aftermath', npcId: 'sect_leader_华山派', title: '崖庐雨霁', icon: '🌧️',
        desc: '结契后头一个清晨，崖庐的灯还亮着。',
        minAffection: 80, trigger: { random: 1.0 }, cooldown: 0, flag: 'hs_e_aftermath_done',
        requireDaoCompanion: true, requireEventDone: 'hs_event_013',
        scenes: [
            { speaker: 'narrator', text: '结契后头一个清晨。你醒来时，崖庐的灯还亮着——雨停了，檐水一滴一滴。竺听雨在案前对账，「听雨」剑靠在案边，听见你动静，没回头。', type: 'description' },
            { speaker: 'npc', text: '「醒了？」他回头笑，把一盏温酒推到你手边，「华山的道侣，得先学一件事——别自己扛。你扛着不说，我分心。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「那你以后别一个人扛账。我替你对灯。」', effect: 'share', affection: 6 },
                { text: '拉他到石壁前，看那个新刻的「归」字', effect: 'gui', affection: 5 },
                { text: '拉过他的手：「你也别撑着。」', effect: 'care', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'share': aff = 6; msg = '他愣了一下，笑开，眼睛发亮：「……行。两个扛账的人。」他把账本推过半尺，笔也给你——你算错两笔，他没纠正，只在你把纸揉成团时笑出了声。崖庐的灯，从那夜起是两盏。'; break;
                case 'gui': aff = 5; msg = '雨霁。他跟你走到石壁前，那个「归」字的新痕里积着一线雨水。「……师父的第十二笔等了十年，第十三笔等你。」他伸手把那线水抹了，回头笑得没半点撑的意思，「往后年年雨停，我们来看它一回。」'; break;
                case 'care': aff = 7; msg = '他没抽手，掌心一层厚茧，很烫。「……我知道。」他低声，「十年了，头一回有人跟我说这句。」他反手握了握你，「一起，别撑着。」'; break;
            }
            if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            if (typeof window.addEssence === 'function') window.addEssence(8);
            return { affection: aff, msg: msg };
        }
    },
    // ---- 阙守拙：山门晨光，剑已归鞘（v20.74 入册） ----
    'wd_event_aftermath': {
        id: 'wd_event_aftermath', npcId: 'sect_leader_武当派', title: '山门晨光', icon: '🔔',
        desc: '结契后头一个清晨，石阶上有扫帚声。',
        minAffection: 80, trigger: { random: 1.0 }, cooldown: 0, flag: 'wd_e_aftermath_done',
        requireDaoCompanion: true, requireEventDone: 'wd_event_013',
        scenes: [
            { speaker: 'narrator', text: '结契后头一个清晨。天没亮透，身边的人已经不在——山门外，扫帚声一下一下，从阶头扫下来。他在扫千级石阶，「不争」连着鞘搁在阶旁——那具曾在你手里的鞘，回到了剑上，七道铜丝在晨光里发亮。', type: 'description' },
            { speaker: 'npc', text: '听见你的脚步，他停了扫帚，抬头：「醒了？」他从阶旁抱起钟杵，双手递过来，「武当的道侣，得先学一件事——别不声不响地走。你走了，我慢。寻不着。」' },
            { speaker: 'npc', text: '晨雾未散，阶旁的「不争」带鞘而立，很静。他看你，半晌，把剩下半句放下：「剑归鞘那日，我来寻你。」一字一顿，「寻着了。往后——不许再走丢。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '接过钟杵：「钟我撞。你扫你的阶——扫帚后头，多一双脚印。」', effect: 'share', affection: 6 },
                { text: '走到阶旁的「不争」前，蹲下，替他把那具鞘正一正', effect: 'sheath', affection: 5 },
                { text: '拉过他的手：「起这么早。你别累着。」', effect: 'care', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'share': aff = 6; msg = '他松开钟杵，让开半步，「嗯」得极轻——像把什么二十七年的事，放进了别人手里。你抱杵撞出去，头一杵堂堂正正，惊起满山宿鸟。他听着钟，拾起扫帚重新扫起来——扫三步，退两步，比平日更慢，慢到和你的钟声一下一下对上。武当的晨钟，从这日起，一个人撞，一个人听——两个人。'; break;
                case 'sheath': aff = 5; msg = '你走到「不争」前蹲下，把那具鞘亲手正了正——七道铜丝，一道一道按实。他看你按，喉结动了动，半天，说：「这一天，我走了二十七年。」顿了顿，又添两个字，「值。」宋远桥恰好过山门，听见了，站住，捋须笑：「守拙，你也会说这样的话了。」他不答，耳根红了，把扫帚往你手里塞。'; break;
                case 'care': aff = 7; msg = '他没抽手，掌心的帚茧凉凉的，很稳。「……我知道。」他低声。隔了半晌，多出一句，「二十七年，头一回有人跟我说这句。」他反手握了握你，「一起。别赶。」'; break;
            }
            if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            if (typeof window.addEssence === 'function') window.addEssence(8);
            return { affection: aff, msg: msg };
        }
    },
    // ---- 闻人酌：琅嬛晨光，封泥上写着你名字的酒开了封（v20.75 入册） ----
    'xy_event_aftermath': {
        id: 'xy_event_aftermath', npcId: 'sect_leader_逍遥派', title: '琅嬛晨光', icon: '🏮',
        desc: '结契后头一个清晨，琅嬛福地的灯还亮着。',
        minAffection: 80, trigger: { random: 1.0 }, cooldown: 0, flag: 'xy_e_aftermath_done',
        requireDaoCompanion: true, requireEventDone: 'xy_event_013',
        scenes: [
            { speaker: 'narrator', text: '结契后头一个清晨。你醒来时，身边的人已不在——酒仙池边水声轻响。他坐在池边，那坛封泥上写着你名字的酒开了封，泥封端端正正搁在坛盖上；琅嬛福地方向望过去，灯亮着，是两盏。听见你的脚步，他回头，笑得比酒还懒。', type: 'description' },
            { speaker: 'npc', text: '「醒了？」他把开了封的新酒斟出来——头一盏，双手递到你面前，「逍遥的道侣，得先学一件事——别把自己斟空。你空了，这一池的酒，就没人尝得出好赖了。」' },
            { speaker: 'npc', text: '他给自己斟了第二盏，望着池水，半晌，把剩下半句放下：「解局的人，我等了半生。」他侧头看你，笑得慵懒，眼底却正经，「等到了。往后——局是两个人的局，酒是两个人的酒。不许再把盏留空。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「往后酒仙池的曲，两个人添；琅嬛的灯，两个人剪。」', effect: 'share', affection: 6 },
                { text: '走到石桌边，看那局新摆的棋：「这局，两个人下。」', effect: 'game', affection: 5 },
                { text: '拉过他的手：「往后疼了，别只顾斟酒——斟两盏，一盏给我。」', effect: 'care', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'share': aff = 6; msg = '他拎着酒壶的手停了一停，随即笑开，眼睛比池水还亮：「……行。曲两个人添，灯两个人剪。」他把那盏头道酒又给你续上，「笨手笨脚也不打紧——我教。守藏人教出来的徒弟，酒量都差不了。」琅嬛福地的灯，从这晨起是两盏。酒仙池的酒，从这坛起，两个人喝。'; break;
                case 'game': aff = 5; msg = '你走到石桌边——那局守了半生的残棋已解完，枰面擦得干干净净；新摆的一局，黑白各半，是两个人的开局。他跟过来，把白子的匣推到你手边：「旧局解了，是送岁月。新局摆上，是给留下的人。」他执黑，落子在枰心，笑得慵懒，「这手我想了半生——今日才敢落。」'; break;
                case 'care': aff = 7; msg = '他没抽手，指腹一层抚琴的薄茧，凉凉的。「……我知道。」他低声。隔了半晌，多出一句，半玩笑半认真，「这半生，疼了就斟酒——酒替我把疼喝了。今日倒好，有人要分一盏。」他反手握了握你，把自己盏里的酒分作两半，「一起。别省。」'; break;
            }
            if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            if (typeof window.addEssence === 'function') window.addEssence(8);
            return { affection: aff, msg: msg };
        }
    },
    // ---- 逵佩南：执法堂晨光，第一百零八条有了名字（v20.76 入册） ----
    'song_event_aftermath': {
        id: 'song_event_aftermath', npcId: 'sect_leader_嵩山派', title: '执法堂晨光', icon: '⚖️',
        desc: '结契后头一个清晨，执法堂的灯还亮着。',
        minAffection: 80, trigger: { random: 1.0 }, cooldown: 0, flag: 'song_e_aftermath_done',
        requireDaoCompanion: true, requireEventDone: 'song_event_013',
        scenes: [
            { speaker: 'narrator', text: '结契后头一个清晨。你醒来时，身边的人已不在——执法堂的灯还亮着。逵佩南在案后重读旧案，玄衣银扣系得一丝不苟；案角摊着那部《执法堂新章》，翻在末页，第一百零八条「例外」，条文里你的名字写得工整如刻。听见你的脚步，他没抬头，把案边一盏酽茶推过来——滤过两遍，温着。', type: 'description' },
            { speaker: 'npc', text: '「醒了？」他把手里的卷宗归档，归得一丝不苟，才抬眼，「执法堂的道侣，得先学一件事——别拿话把自己判了。你闷着不说，我这里查不到条文可对。」' },
            { speaker: 'npc', text: '他解下腰间那条空了的符绳，叠得方方正正，搁进你掌心。晨光落在新章末页你的名字上。他看你，半晌，把剩下半句放下，判词一样，一字一顿：「上符在执事堂，下符随人。堂在人在——往后历年重核，两个人的灯。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「往后你读档，我掌灯——每年今夜，一起重核。」', effect: 'share', affection: 6 },
                { text: '把符绳收进怀里最贴身的一层：「符在人在。」', effect: 'token', affection: 5 },
                { text: '拉过他的手：「又核了一夜档。你别熬着。」', effect: 'care', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'share': aff = 6; msg = '他执卷的手停了半息，眼角露出一点那个不加批注的笑：「……好。历年重核，二人——这一条，新章里有出处。」他把案上的卷宗分了一半推到你手边，又把灯往你那边挪了挪，「掌灯的手笨不要紧。灯亮着，档就只是档，不是刀。」执法堂的灯，从这晨起是两盏。'; break;
                case 'token': aff = 5; msg = '他看你把符绳收进最贴身的一层，喉结动了动，半天，说：「我父亲抄了一辈子档，符没离过身。如今符离了身——」他顿了顿，耳廓微红，把后半句学得极慢地放下来，「离得对。条令里没有这一条。是我加的。别外传。」'; break;
                case 'care': aff = 7; msg = '他没抽手，掌心一层经年执笔的干茧，很暖。「……我知道。」他低声。隔了半晌，多出一句，「九年，头一回有人跟我说这句。」他反手握了握你，把新章轻轻合上，「一起。别瞒。」'; break;
            }
            if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            if (typeof window.addEssence === 'function') window.addEssence(8);
            return { affection: aff, msg: msg };
        }
    },
    // ---- 桑拾玖：讯房晨光，册子新开，头一条是两个人的（v20.76 入册） ----
    'gai_event_aftermath': {
        id: 'gai_event_aftermath', npcId: 'sect_leader_丐帮', title: '讯房晨光', icon: '🥣',
        desc: '结契后头一个清晨，讯房的灯还亮着。',
        minAffection: 80, trigger: { random: 1.0 }, cooldown: 0, flag: 'gai_e_aftermath_done',
        requireDaoCompanion: true, requireEventDone: 'gai_event_013',
        scenes: [
            { speaker: 'narrator', text: '结契后头一个清晨。你醒来时，身边的人已不在——讯房那头传来竹签翻动的轻响。桑拾玖坐在灯下核签，百衲衣穿得整整齐齐；你袖口那方青布，他夜里又把针脚压了一遍，密得摸不出线头。听见你的脚步，他没抬头，把半碗温着的粥推过来。', type: 'description' },
            { speaker: 'npc', text: '「醒了？」他把最后一支签核完插回墙上，才回头，「讯房的道侣，得先学一件事——别把话咽回去。你咽着，我核得了天下人的签，核不了你的。」' },
            { speaker: 'npc', text: '他把锅里熬好的粥给你盛上，头一碗，双手端过来。晨光落在他洗得发白的百衲衣上。他看你，声音很平，平得像核一支签，说的却是自己的事：「娘的故事，我讲完了。讲了，就没再收回去的道理。」他顿了顿，「从今日起，册子新开一本——你的事，我的事，入在一处。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「往后你核签，我烧水——讯房的灯，两个人点。」', effect: 'share', affection: 6 },
                { text: '接粥喝一口：「你自己的故事，再讲一段。一晚一段，我慢慢听。」', effect: 'story', affection: 5 },
                { text: '拉过他的手：「又核了一夜签。你别熬着。」', effect: 'care', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'share': aff = 6; msg = '他执签的手停了半息，随即笑开——讯房长老不设防的笑，原先只对着湖水有过。「……好。一个烧水，一个核签，这叫过日子。」他把条凳往案边挪了挪，又给你把粥续上，「笨手笨脚不要紧——水烧糊了，顶多今夜的故事换个讲法。」讯房的灯，从这晨起是两个人点。'; break;
                case 'story': aff = 5; msg = '他愣了一下，失笑：「我自己的故事，没别人的好听。」话虽如此，他还是坐下了，从十四岁那年冬天讲起——这一回没有收住，讲到雪，讲到湖边洗衣裳的妇人，讲完把碗涮净，收好，「入册了。头一条。」他抬眼看你，耳朵红着，「册子不厚。你得听一辈子。」'; break;
                case 'care': aff = 7; msg = '他没抽手，掌心一层搅粥烧火的暖意。「……我知道。」他低声。隔了半晌，多出一句，「十二年，头一回有人跟我说这句。」他反手握了握你，把那半碗粥往你手边又推了推，「一起。别熬。」'; break;
            }
            if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            if (typeof window.addEssence === 'function') window.addEssence(8);
            return { affection: aff, msg: msg };
        }
    },
    // ---- 聂明泽：档房晨光，两个名字写进同一页的正式归档（v20.77 入册） ----
    'yan_event_aftermath': {
        id: 'yan_event_aftermath', npcId: 'sect_leader_阎罗殿', title: '档房晨光', icon: '📜',
        desc: '结契后头一个清晨，甲字一号格里立着两页档。',
        minAffection: 80, trigger: { random: 1.0 }, cooldown: 0, flag: 'yan_e_aftermath_done',
        requireDaoCompanion: true, requireEventDone: 'yan_event_013',
        scenes: [
            { speaker: 'narrator', text: '结契后头一个清晨。你醒来时，身边的人已不在——档房的灯还亮着。聂明泽立在甲字一号格前，蓝布直裰穿得整整齐齐；晨光从纸窗落进去，格内两页档，页首并排两个名字。他手里那支朱笔，笔帽开着。听见你的脚步，他没回头，先把那两页档对齐，才把案边一盏热水推过来。', type: 'description' },
            { speaker: 'npc', text: '「醒了？」他这才转身，耳根微红，语气仍旧又短又平，「档房的道侣，得先学一件事——别把话咽回袖子里。你咽着不说，我背得出天下千架的档，核不了你那一页。」' },
            { speaker: 'npc', text: '他把朱笔搁回笔山，帽开着，没扣。他看你，半晌，把剩下半句放下，短，平，却一字一顿像落印：「命格：未定。这一栏，今日起改注。」他把你那页档转过来——「命格」栏里新落两个朱字，笔画工整如刻：「已定」。「所定的格式：两人，一格。永久。」他顿了顿，「归档，完毕。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「往后你核档，我烧水——档房的灯，两个人点。」', effect: 'share', affection: 6 },
                { text: '把格里那页「聂明泽」抽出来，看他自己那一档写了什么', effect: 'read', affection: 5 },
                { text: '拉过他的手：「又核了一夜档。你别熬着。」', effect: 'care', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'share': aff = 6; msg = '他执笔的手停了半息，随即笑了——极短的一声，像纸页落进格里。「……好。一个烧水，一个归档。这一条，档规有出处：同案格式。」他把西窗下那张小案往自己案边挪近半尺，又把灯芯挑亮，「笨手笨脚不要紧。水烧干了，顶多你那一页，我多核一遍。」档房的灯，从这晨起是两个人点。'; break;
                case 'read': aff = 5; msg = '你从那格抽出「聂明泽」——他生平第一页属于自己的档，通篇只有一条，今晨新添一行小字，墨迹未干：「甲字一号格，同格者，安。今起，添一字：归。」他看你读，耳根一寸一寸红上来，却没拦；等你读完，才把纸页接回去，对齐，归格，格门合得极轻。「这一页的批注，往后年年添。」他背过身理笔山，声音压得平平的，尾音却漏了，「你随便查。档规卷一：所见皆录。我所见——皆是你那一页。」'; break;
                case 'care': aff = 7; msg = '他没抽手，指腹一层常年握笔的茧，凉凉的，很稳。「……我知道。」他低声。隔了半晌，多出一句，「十年，头一回有人跟我说这句。」他反手握了握你，把朱笔的笔帽扣回去——扣了一半，又留着半线没扣严，「一起。别熬。档，慢慢核。灯——两个人熄。」'; break;
            }
            if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            if (typeof window.addEssence === 'function') window.addEssence(8);
            return { affection: aff, msg: msg };
        }
    },
    // ---- 雷惊蛰：药坊晨光，方子册新开一页，批注双人核（v20.78 入册） ----
    'pi_event_aftermath': {
        id: 'pi_event_aftermath', npcId: 'sect_leader_霹雳堂', title: '药坊晨光', icon: '🎆',
        desc: '结契后头一个清晨，药坊的灯还亮着。',
        minAffection: 80, trigger: { random: 1.0 }, cooldown: 0, flag: 'pi_e_aftermath_done',
        requireDaoCompanion: true, requireEventDone: 'pi_event_013',
        scenes: [
            { speaker: 'narrator', text: '结契后头一个清晨。你醒来时，身边的人已不在——药坊那头传来筛药的轻响。雷惊蛰在案前焙药，短褐袖子挽到肘弯；案角摊着方子册，摊开的是新的一页，头一行批注墨迹未干：「是日，天晴。二人。」防火布囊挂在案头，囊口的焦痕被晨光照得发亮。听见你的脚步，他没回头，先把册角对齐了，才把案边一盏温水推过来。', type: 'description' },
            { speaker: 'npc', text: '「醒了？」他回头，耳根微红，声音照旧很轻，「霹雳堂的道侣，得先学一件事——别把话闷在胸腔里。你闷着，我称得出满堂的硝硫，称不出你心里那一味。」' },
            { speaker: 'npc', text: '他把方子册从案角拿起来，放到你手里，翻到那页新的，炭笔搁在页边。「批注的格式，今日起改。」他看你，话说得轻，一字却是一字，「是日，二人——从这一行起，一日一行。你说，我记；我说，你记。记了的，才算说了。这是我立的规矩。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「往后你配药，我看火——药坊的灯，两个人点。」', effect: 'share', affection: 6 },
                { text: '接过炭笔，在批注底下添一行：「是日，册子摊开了。人没再合上。」', effect: 'write', affection: 5 },
                { text: '拉过他的手：「又起早焙药。你别累着。」', effect: 'care', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'share': aff = 6; msg = '他筛药的手停了半息，随即笑了——极轻的一声，像一蓬光簌簌摊开。「……好。一个看火，一个配药。这一条，册子有出处：批注双人核。」他把西窗下那张小案往自己案边挪近半尺，又把灯芯挑亮，「笨手笨脚不要紧。火候猛了，顶多那日的批注多一个字：糊。」药坊的灯，从这晨起是两个人点。'; break;
                case 'write': aff = 5; msg = '你接过炭笔，在那行批注底下添了一句：「是日，册子摊开了。人没再合上。」他凑过来看，看了很久，耳根一寸一寸红上来，却没挡；看完他把册子接回去，对齐，抱在怀里按了一下，又破天荒放回案角——摊开着，字朝上。「方子册不外阅。」他背过身去理药簸，声音压得极轻，尾音却漏了，「这一册外阅。册规：所言皆录。我这一生所言——都是你那一页。」'; break;
                case 'care': aff = 7; msg = '他没抽手，指腹一层常年捏样尺的茧，凉凉的，很稳。「……我知道。」他低声。隔了半晌，多出一句，「十六年，头一回有人跟我说这句。」他反手握了握你，把那盏温水又往你手边推了推，「一起。别受潮。」'; break;
            }
            if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            if (typeof window.addEssence === 'function') window.addEssence(8);
            return { affection: aff, msg: msg };
        }
    },
    // ---- 宓书言：万卷楼晨光，卷尾「存疑」旁新添一行「疑定了」（v20.78 入册） ----
    'shu_event_aftermath': {
        id: 'shu_event_aftermath', npcId: 'sect_leader_天书阁', title: '万卷楼晨光', icon: '📖',
        desc: '结契后头一个清晨，万卷楼的灯还亮着。',
        minAffection: 80, trigger: { random: 1.0 }, cooldown: 0, flag: 'shu_e_aftermath_done',
        requireDaoCompanion: true, requireEventDone: 'shu_event_013',
        scenes: [
            { speaker: 'narrator', text: '结契后头一个清晨。你醒来时，身边的人已不在——万卷楼顶层的灯还亮着。宓书言在案后校一部新卷，月白直裰穿得整整齐齐，「校讎」剑靠在扶手边；案头单独摆着那部校完的残卷，翻开在卷尾，「黑甚濃」四个字朝着晨光，旁边的小注底下新添了一行，墨迹未干：「疑，定了。」听见你的脚步，他没抬头，先把卷角对齐，才把案边一方温砚推过来——墨是新研的，浓淡正好。', type: 'description' },
            { speaker: 'npc', text: '「醒了？」他这才搁下校笔，耳根微红，语速照旧又快又平，「天书阁的道侣，得先学一件事——别把心里的字存疑不圈。你存着，我校得动天下的字，校不动你的沉默。」' },
            { speaker: 'npc', text: '他从签筒里抽出一张空白竹纸签，搁进你掌心，签面朝上。「批语不过四——这一条，为你作废。」他看你，晨光里目光平平的，平里有真东西，「从今日起，你写给我的签，几个字都收。收了——永久收存。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「往后你校卷，我研墨——万卷楼的灯，两个人点。」', effect: 'share', affection: 6 },
                { text: '拿起那张签，蘸他研的墨，写五个字：「墨甚濃矣。」', effect: 'tag', affection: 5 },
                { text: '拉过他的手：「又起早校卷。你别熬着。」', effect: 'care', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'share': aff = 6; msg = '他执笔的手停了半息，随即笑了——极短的一声，像纸页落进格里。「……好。一个研墨，一个校卷。这一条，阁里有出处：对校。」他把西窗下那张小案往自己案边挪近半尺，又把灯芯挑亮，「笨手笨脚不要紧。墨研浓了，顶多那夜的校记多一条：是日，墨甚浓。」万卷楼的灯，从这晨起是两个人点。'; break;
                case 'tag': aff = 5; msg = '你拿起那张签，写了五个字：「墨甚濃矣。」他低头去核——逐字核了一遍笔锋，核完耳根红到颈侧，把那张签收进签筒最里侧那一格，和当年那张旧签并排放好。「五个字的批，犯规。」他背过身去理卷角，声音压得平平的，尾音却漏了，「犯规的批，一生只收两张。一张收存。一张——随身。」'; break;
                case 'care': aff = 7; msg = '他没抽手，虎口一层剑茧，指腹一层笔茧，两种茧叠在一处，凉凉的，很稳。「……我知道。」他低声。隔了半晌，多出一句，「十五年，头一回有人跟我说这句。」他反手握了握你，把校记轻轻合上，「一起。别熬。卷，慢慢校。日子——比夜长。」'; break;
            }
            if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            if (typeof window.addEssence === 'function') window.addEssence(8);
            return { affection: aff, msg: msg };
        }
    },
    // ---- 隗九爻：街口晨光，新签数出「剩六颗」，下半句自己说全（v20.78 入册） ----
    'dy_event_aftermath': {
        id: 'dy_event_aftermath', npcId: 'sect_leader_大隐阁', title: '街口晨光', icon: '🍡',
        desc: '结契后头一个清晨，食摊街口最早的火是他生起的。',
        minAffection: 80, trigger: { random: 1.0 }, cooldown: 0, flag: 'dy_e_aftermath_done',
        requireDaoCompanion: true, requireEventDone: 'dy_event_013',
        scenes: [
            { speaker: 'narrator', text: '结契后头一个清晨。你醒来时，身边的人已不在——食摊街口最早的火已经生起来了，糖葫芦婶子的糖锅在他手边咕嘟着。隗九爻蹲在炉子前添柴，青衫袖子挽着；那根老竹签插在他领口，签头空着，留着一圈浅浅的印子——那颗风干的山楂，卦破那夜给了你。听见你的脚步，他没回头，先给糖锅搅了一勺，才用下巴点了点身边的小凳。', type: 'description' },
            { speaker: 'npc', text: '「醒了？」他回头，耳朵微红，声音慢条斯理，带着晨火的烟味，「大隐阁的道侣，得先学一件事——别把话吞一半。你吞一半，我猜得出天下的卦，猜不出你的半句。」' },
            { speaker: 'npc', text: '他从糖锅边拿起一串新糖葫芦，举平，一颗一颗数给你看，数完插在两人中间：「剩六颗。六为顺。」他看你，破天荒把下半句自己说全了：「顺者——往后的话，句句说全。说全了要出事，事，两个人当。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「往后你起卦，我付账——这条街的账，两个人欠。」', effect: 'share', affection: 6 },
                { text: '拔下那颗头一红的山楂，咬一口：「甜。」', effect: 'sweet', affection: 5 },
                { text: '拉过他的手：「又起早看火。你别累着。」', effect: 'care', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'share': aff = 6; msg = '他举签的手停了半息，随即笑出声——笑到一半变成整声的笑。「……好。一个起卦，一个付账，这叫过日子。」他冲街口扬声喊，中气足得半条街都听见：「都听着——往后我这一摊的账，记两个名字。利息，我付。」摊主们笑骂成一片，婶子端来两碗豆花，他推一碗给你，耳朵红着，慢条斯理补了句：「笨手笨脚不要紧。账欠多了，顶多明年多起一卦：大富。」'; break;
                case 'sweet': aff = 5; msg = '你咬下那颗头一红的山楂，他看你嚼，看得很认真，像在等一卦的结果。「甜？」他把领口那根老竹签抽出来，转了半圈，「这根签，签头空了半年。婶子要塞颗新的给我，三回——我没让。」他把老签收回领口，收得贴着心口，耳朵红着，话却说得全乎：「不用塞了。签头那颗该留的山楂——人已经收着了。签头空着，正好。空出来的位置，往后年年数给她看。」'; break;
                case 'care': aff = 7; msg = '他没抽手，掌心一层糖火的暖意，很稳。「……我知道。」他低声。隔了半晌，破天荒说了一整句，「二十年，头一回有人跟我说这句。」他反手握了握你，又给糖锅搅了一勺，「一起。别累。火，慢慢添。卦——两个人起。」'; break;
            }
            if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            if (typeof window.addEssence === 'function') window.addEssence(8);
            return { affection: aff, msg: msg };
        }
    },
    // ---- 简知忆：东院晨光，那页空白了半辈子的档，头一行落了字（v20.78 入册） ----
    'yin_event_aftermath': {
        id: 'yin_event_aftermath', npcId: 'sect_leader_侠隐阁', title: '东院晨光', icon: '🗂️',
        desc: '结契后头一个清晨，那页空白档纸写了头一行字。',
        minAffection: 80, trigger: { random: 1.0 }, cooldown: 0, flag: 'yin_e_aftermath_done',
        requireDaoCompanion: true, requireEventDone: 'yin_event_013',
        scenes: [
            { speaker: 'narrator', text: '结契后头一个清晨。你醒来时，身边的人已不在——东院档房的灯还亮着。简知忆坐在案后，灰袍穿得整整齐齐，那支笔杆磨秃的档笔捏在手里。案上摊着油布包——包里是那页他从没写过自己的档纸，空白了半辈子。今夜，纸上了头一行字，墨迹未干。听见你的脚步，他没抬头，先把笔搁上笔架，才把案边一盏温茶推过来。', type: 'description' },
            { speaker: 'npc', text: '「醒了？」他这才回头，耳根微红，批注腔照旧极平，「侠隐阁的道侣，得先学一件事——别把自己归进『存疑，不究』。你存疑——我究。究一辈子。」' },
            { speaker: 'npc', text: '他把那页档纸转过来给你看——头一行，一笔一划：「姓名：简知忆。职业：建档。亲属栏——」亲属栏里是你的名字，写得比满档任何字都大。他看你，半晌，把剩下半句放下，一字一顿像盖印：「这一栏，那夜你填的。你填什么，是什么。今日归档：两人，一卷，永久收存，不销毁。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「往后你建档，我研墨——东院的灯，两个人点。」', effect: 'share', affection: 6 },
                { text: '把那页档纸拿过来细看：他自己那一档，还写了什么', effect: 'read', affection: 5 },
                { text: '拉过他的手：「又核了一夜档。你别熬着。」', effect: 'care', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'share': aff = 6; msg = '他执笔的手停了半息，随即笑了——极短的一声，像档页落进架里。「……好。一个研墨，一个归档。这一条，格式里有出处：同卷。」他把案侧的小凳往自己案边挪近半尺，又把灯芯挑亮，「笨手笨脚不要紧。墨研浓了，顶多那页批注多一个字：糊。」东院档房的灯，从这晨起是两个人点。'; break;
                case 'read': aff = 5; msg = '你把那页档纸拿过来细看——他生平第一档，通篇只有三条：姓名、职业、亲属栏。亲属栏底下，今晨新添了一行小注，墨迹未干：「注：此栏空白十一年。空白缘由，今日查清：非不能写，是候人填。填讫。查毕，归档。」他看你读，耳根一寸一寸红上来，却没拦；等你读完，才把档纸接回去，对齐，用油布包好——没上架，收进了贴胸的衣襟。「自己的档，不上架。」他背过身去理笔架，声音压得平平的，尾音却漏了，「上架的档，是给别人查的。这一卷，给你。一查，一辈子。」'; break;
                case 'care': aff = 7; msg = '他没抽手，指尖一层常年握档笔的茧，凉凉的，很稳。「……我知道。」他低声。隔了半晌，多出一句，「十一年，头一回有人跟我说这句。」他反手握了握你，把那支磨秃的档笔收进笔袋，「一起。别熬。档，慢慢核。清晨——两个人醒。」'; break;
            }
            if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            if (typeof window.addEssence === 'function') window.addEssence(8);
            return { affection: aff, msg: msg };
        }
    },
    // ---- 狄长亭：总驿晨光，铜符离了身，人有归站（v20.78 入册） ----
    'ty_event_aftermath': {
        id: 'ty_event_aftermath', npcId: 'sect_leader_天涯海阁', title: '总驿晨光', icon: '🐎',
        desc: '结契后头一个清晨，总驿的灯刚熄。',
        minAffection: 80, trigger: { random: 1.0 }, cooldown: 0, flag: 'ty_e_aftermath_done',
        requireDaoCompanion: true, requireEventDone: 'ty_event_013',
        scenes: [
            { speaker: 'narrator', text: '结契后头一个清晨。你醒来时，身边的人已不在——总驿文书案的灯刚熄，灯芯还温着。狄长亭在重装昨夜的存根，油布披风搭得整整齐齐；案角那半枚铜符擦得发亮，符边立着一纸新路引，去向栏里两个字写得端端正正：「归站。」存根册摊开在新的一页，批注栏一行小字，这一回的颤笔和从前不一样——是暖的：「是日，晴。灯，没挑就亮了。」听见你的脚步，他没抬头，先把存根的页角压平，才把案边一盏热水推过来。', type: 'description' },
            { speaker: 'npc', text: '「醒了？」他这才回头，耳根微红，声音又轻又软，「天涯海阁的道侣，得先学一件事——别不打招呼就过站。你过站不言语，我点着灯追，追到哪一站，是哪一站。」' },
            { speaker: 'npc', text: '他把那半枚铜符拿起来，搁进你掌心，合上你的手指——稳了一辈子的手，合你手指的时候，照旧轻轻抖了一下。「驿制：见符如见人。」他公文腔一字一字，念完声音低下去，出了格式，「今日起，多一条：你在哪一站——哪一站，就是归站。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「往后你跑路，我守站——总驿的灯，两个人挑。」', effect: 'share', affection: 6 },
                { text: '把铜符收进怀里最贴身的一层：「符在，我就回来。」', effect: 'token', affection: 5 },
                { text: '拉过他的手：「又起早重装存根。你别熬着。」', effect: 'care', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'share': aff = 6; msg = '他装存根的手停了半息，随即笑了——极轻的一声，像灯光落在擦亮的符面上。「……好。一个跑路，一个守站，这叫归站。」他把文书案边那张小案往自己案边挪近半尺，又把驿门的灯挂到两个人都够得着的钩上，「笨手笨脚不要紧。灯挑亮了，顶多那夜的存根多一条批注：是夜，灯明，人不困。」总驿的灯，从这晨起是两个人挑。'; break;
                case 'token': aff = 5; msg = '你把铜符收进最贴身的一层，他看你收，喉结动了动，半天，说：「十年，这符离身就一回——给你那夜。」他顿了顿，耳根红着，把剩下半句学得极慢地放下来，「如今好了。符离了身，人有归站。驿制里没有这一条——是我加的。别外传。」'; break;
                case 'care': aff = 7; msg = '他没抽手，掌心一层常年执缰的薄茧，温温的，很稳。「……我知道。」他低声。隔了半晌，多出一句，「十年，头一回有人跟我说这句。」他反手握了握你，把存根册轻轻合上，收笔，「一起。别熬。路长——长不过一辈子。」'; break;
            }
            if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            if (typeof window.addEssence === 'function') window.addEssence(8);
            return { affection: aff, msg: msg };
        }
    },
    // ---- 樊惊筹：旗房晨光，收口针头一回载了字（v20.78 入册） ----
    'dq_event_aftermath': {
        id: 'dq_event_aftermath', npcId: 'sect_leader_大旗门', title: '旗房晨光', icon: '🏴',
        desc: '结契后头一个清晨，点将台边的旗杆立得笔直。',
        minAffection: 80, trigger: { random: 1.0 }, cooldown: 0, flag: 'dq_e_aftermath_done',
        requireDaoCompanion: true, requireEventDone: 'dq_event_013',
        scenes: [
            { speaker: 'narrator', text: '结契后头一个清晨。你醒来时，身边的人已不在——旗房外天没亮透，他已经练完了早课，旗杆立在点将台边，晨风过处旗面平展。旗房里，针线破天荒收着：铁皮针线盒盒盖扣好，线轴按粗细排齐；案上一副新护腕，内衬朝上——三十七道暗针旁边多了一排新针，针距和针码里的都不一样，数不出字，只有那排针脚很密，很稳。听见你的脚步，他回头，两个字：「醒了。」', type: 'description' },
            { speaker: 'npc', text: '「大旗门的道侣，得先学一件事。」他走过来，把那副新护腕给你戴上，收带，动作像军令，话比军令短，「别掉队。掉队——」他顿了顿，破天荒把整句说完了，「我调旗，回头找你。」' },
            { speaker: 'npc', text: '他把铁皮针线盒打开，盒盖内侧的刻格转进晨光里，四十二格清清楚楚。他的粗手指落在收口针那一行的空格上，按住了：「我娘说，这两式只用来收口，不载字。」他抬眼看你，耳朵红着，话短，一字是一字，「昨夜改了。收口的针，载一个字。字，你定。你定一个，我缝一辈子。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「往后你扛旗，我烧水——点将台下，两个人站。」', effect: 'share', affection: 6 },
                { text: '凑近看那排新针，一道一道数出来：「这一排，几个字？」', effect: 'count', affection: 5 },
                { text: '拉过他的手：「又起早练功。你别累着。」', effect: 'care', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'share': aff = 6; msg = '他收带的手停了半息，随即笑了——短促的一声，像旗角抽了一下风。「……好。一个扛旗，一个烧水。」他把点将台下那只马扎往背风的老位置又挪正了半尺，摆得很实，「笨手笨脚不要紧。水烧干了，顶多那日的军情多一条：水，干了，人，在。」点将台下，从这晨起是两个人站。夜里的旗房，一个缝，一个递线。'; break;
                case 'count': aff = 5; msg = '你凑近数那排新针——一道一道数完，八道。你问，八个什么字。他不答，把铁皮盒的刻格转过来对着你，粗手指一格一格点过去，点完自己念了，念得很平，耳朵很红：「旗，在，人，在，我，扛，着，呢。」他顿了顿，咬断一根线头，「三十七针里没有『着呢』。新字。新字的规矩：不藏布里。当面说。」'; break;
                case 'care': aff = 7; msg = '他没抽手，掌心一层扛旗杆的厚茧，很暖。「……我知道。」他低声。隔了半晌，多出两个字，「二十六年。」又隔了半晌，才把那一整句放下来，「头一回有人跟我说这句。」他反手握了握你，把铁皮针线盒合上，盒盖扣得很轻，「一起。别累。旗，慢慢扛。针脚——慢慢数。」'; break;
            }
            if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            if (typeof window.addEssence === 'function') window.addEssence(8);
            return { affection: aff, msg: msg };
        }
    }
};

if (typeof NPC_PERSONAL_EVENTS !== 'undefined') {
    Object.assign(NPC_PERSONAL_EVENTS, MALE_AFTERMATH_EVENTS);
}

// 每日钩子：道侣玩家在某男主门派 + 终章已发生 + 未回访 → 触发
if (typeof window !== 'undefined' && window.timeSystem && window.timeSystem.onNewDaySubscribe) {
    window.timeSystem.onNewDaySubscribe(function() {
        try {
            if (!window.currentCharData || !window.npcManager) return;
            if (typeof window.MALE_LEAD_ROSTER === 'undefined') return;
            var loc = window.currentCharData.location || '';
            var roster = window.MALE_LEAD_ROSTER || [];
            for (var i = 0; i < roster.length; i++) {
                var h = roster[i];
                if (!h || h.sect !== loc) continue;
                var finaleId = h.id === 'sect_leader_铸剑山庄' ? 'lu_event_013'
                    : h.id === 'sect_leader_药王谷' ? 'su_event_013'
                    : h.id === 'sect_leader_茅山派' ? 'ms_event_013'
                    : h.id === 'sect_leader_金刚宗' ? 'jg_event_013'
                    : h.id === 'sect_leader_华山派' ? 'hs_event_013'
                    : h.id === 'sect_leader_武当派' ? 'wd_event_013'
                    : h.id === 'sect_leader_逍遥派' ? 'xy_event_013'
                    : h.id === 'sect_leader_嵩山派' ? 'song_event_013'
                    : h.id === 'sect_leader_丐帮' ? 'gai_event_013'
                    : h.id === 'sect_leader_阎罗殿' ? 'yan_event_013'
                    : h.id === 'sect_leader_霹雳堂' ? 'pi_event_013'
                    : h.id === 'sect_leader_天书阁' ? 'shu_event_013'
                    : h.id === 'sect_leader_大隐阁' ? 'dy_event_013'
                    : h.id === 'sect_leader_侠隐阁' ? 'yin_event_013'
                    : h.id === 'sect_leader_天涯海阁' ? 'ty_event_013'
                    : h.id === 'sect_leader_大旗门' ? 'dq_event_013' : null;
                var amId = h.id === 'sect_leader_铸剑山庄' ? 'lu_event_aftermath'
                    : h.id === 'sect_leader_药王谷' ? 'su_event_aftermath'
                    : h.id === 'sect_leader_茅山派' ? 'ms_event_aftermath'
                    : h.id === 'sect_leader_金刚宗' ? 'jg_event_aftermath'
                    : h.id === 'sect_leader_华山派' ? 'hs_event_aftermath'
                    : h.id === 'sect_leader_武当派' ? 'wd_event_aftermath'
                    : h.id === 'sect_leader_逍遥派' ? 'xy_event_aftermath'
                    : h.id === 'sect_leader_嵩山派' ? 'song_event_aftermath'
                    : h.id === 'sect_leader_丐帮' ? 'gai_event_aftermath'
                    : h.id === 'sect_leader_阎罗殿' ? 'yan_event_aftermath'
                    : h.id === 'sect_leader_霹雳堂' ? 'pi_event_aftermath'
                    : h.id === 'sect_leader_天书阁' ? 'shu_event_aftermath'
                    : h.id === 'sect_leader_大隐阁' ? 'dy_event_aftermath'
                    : h.id === 'sect_leader_侠隐阁' ? 'yin_event_aftermath'
                    : h.id === 'sect_leader_天涯海阁' ? 'ty_event_aftermath'
                    : h.id === 'sect_leader_大旗门' ? 'dq_event_aftermath' : null;
                if (!finaleId || !amId) continue;
                var npc = window.npcManager.getNPC ? window.npcManager.getNPC(h.id) : null;
                if (!npc) continue;
                if (!npc.hasFlag || !npc.hasFlag('dao_companion')) continue;
                if (typeof hasEventTriggered === 'function' && !hasEventTriggered(finaleId)) continue;
                if (typeof hasEventTriggered === 'function' && hasEventTriggered(amId)) continue;
                var ev = NPC_PERSONAL_EVENTS[amId];
                if (!ev) continue;
                if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npc)) continue;
                setTimeout(function(evId, npcInst) {
                    if (document.querySelector && document.querySelector('.personal-event-modal')) return;
                    var ev2 = NPC_PERSONAL_EVENTS[evId];
                    if (!ev2) return;
                    if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev2, npcInst)) return;
                    if (typeof triggerPersonalEvent === 'function') triggerPersonalEvent(evId);
                }.bind(null, amId, npc), 1200);
            }
        } catch (e) { console.warn('[男主回访] 每日触发失败:', e); }
    });
}

if (typeof window !== 'undefined') window.MALE_AFTERMATH_EVENTS = MALE_AFTERMATH_EVENTS;
console.log('[男主回访] 男主道侣回访事件加载完成：' + Object.keys(MALE_AFTERMATH_EVENTS).length + ' 个');
