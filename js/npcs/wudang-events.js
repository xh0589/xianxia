// ==================== wudang-events.js - 阙守拙线情缘事件/结局/性别语境 v1.0（v20.74 第四批扩线） ====================
// 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / registerEndingSet / registerEndingCallback /
//       hasEventTriggered / checkEventTrigger / triggerPersonalEvent / canPlayerAccessPersonalEvent）
//       npcs/npc-system.js（executeEmotionInteraction 已加 bond_dao 拦截）
// 加载顺序：在 npc-personal-events.js 之后
// 男主·阙守拙（武当三代首徒、真武殿执剑侍。慢拙实型——满山求快，他一人练慢；话极少、不笑、一句顶十句。
//   太极剑「先学慢，再学快」是掌门宋远桥当年留住他的口诀；佩剑名「不争」，天道不争，剑无鞘，信物是他亲手做的剑鞘）。
// 祖师张三丰闭关百年，真武殿所供佩剑「问道」百年无人请得动，偶在祖师像前留墨（既有设定见 js/sects/sect-story-arc.js 武当段）。
// 男女玩家皆可追，主线共享（代词按性别），各有专属性别语境事件（femctx/mctx）。
// 注：本线已入 MALE_LEAD_ROSTER（v20.74：吃醋对峙/和好两桩由 male-lead-*.js 稍后接线，名册先行）。

var WD_NPC_ID = 'sect_leader_武当派';

// ============ 主线事件（wd_event_001 ~ 011 + 终章 013） ============
var WD_MAIN_EVENTS = {
    'wd_event_001': {
        id: 'wd_event_001', npcId: WD_NPC_ID, title: '石阶', icon: '🧹',
        desc: '扫千级石阶的人，扫三步，退两步。',
        minAffection: 12, trigger: { random: 0.4 }, cooldown: 0, flag: 'wd_e001_done',
        autoTrigger: { location: '武当派', random: 0.45 },
        scenes: [
            { speaker: 'narrator', text: '武当山门千级石阶，云雾半掩。一个青衫道人正在扫地——扫三步，退两步，扫帚走得很慢。', type: 'description' },
            { speaker: 'narrator', text: '你当他是偷懒的杂役。走到阶头回头，却见他扫过的那一段，比哪一段都干净——连石缝里的青苔，都顺了纹理。', type: 'description' },
            { speaker: 'npc', text: '他察觉你的目光，扫帚顿了顿，半晌，说了一句：「石阶滑。走稳。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '拾起旁边的旧竹帚，陪他扫完这一段', effect: 'sweep', affection: 7 },
                { text: '「扫三步退两步——你这不是扫地，是扫心地。」', effect: 'see', affection: 8 },
                { text: '拱手问路，与他攀谈几句', effect: 'ask', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'sweep': aff = 7; msg = '你拾帚同扫。他不拦，只把步子放得更慢，慢到你能跟上。扫到半段，他忽然开口：「三步一退，是规矩。地要这样才扫得净。」顿了顿，又添两个字，「人也。」到阶头，他冲你点了点头，像多年的旧识。'; break;
                case 'see': aff = 8; msg = '执帚的手停在半空。他抬眼看你，看了很久：「……扫心地。」他把帚柄往石阶上一顿，「满山的人，都当我慢。」说完这句，他重新扫起来——扫帚的节奏，比先前轻快了一线。'; break;
                case 'ask': aff = 5; msg = '他听你问路，想了半天，答得一字一顿，没有一个字是废的。答完，又补一句：「天黑前下山。山云厚。」人拙，话拙，那份仔细却是真的。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'wd_event_002': {
        id: 'wd_event_002', npcId: WD_NPC_ID, title: '三招', icon: '⚔️',
        desc: '他让你先攻三招——三招，你连他衣角都没碰到。',
        minAffection: 18, trigger: { random: 0.35 }, cooldown: 0, flag: 'wd_e002_done',
        autoTrigger: { location: '武当派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '演武场上你向他讨教。他点头，收剑，空手立定：「你先。三招。」', type: 'description' },
            { speaker: 'narrator', text: '第一招你取他肩，第二招你撩他腰，第三招你全力一刺——他侧半步，腕一沉，你的剑尖贴着他袖口滑了过去。三招过罢，你连他的衣角都没碰到。', type: 'description' },
            { speaker: 'npc', text: '他收势，很认真地说：「你的剑，快。」停了停，又补一句，「比我快。但是直。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「直，怎么了？请师兄指教。」', effect: 'learn', affection: 7 },
                { text: '「再来三招。这回我要碰到你的袖子。」', effect: 'again', affection: 6 },
                { text: '「武当首徒，就这点出息——只会躲。」', effect: 'mock', affection: -4 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'learn': aff = 7; msg = '他蹲下身，拾了根树枝，在地上画了一个圆。话说得极慢，一字是一字：「直，快，但能断。圆，慢，但断不了。」画完，树枝递给你，「回去练。练圆。」那个圆，你练了半个月。'; break;
                case 'again': aff = 6; msg = '他看你一眼，点头，重新收剑：「好。」这三招你仍没碰到他的袖子，可第三招上，他退了半步——那半步，是让给你的。走时他丢下一句：「下回，不让。」这就是「还有下回」的意思。'; break;
                // 真负选项：他守的就是这个「拙」字，「只会躲」掀的是他二十年贴崖而立的根
                case 'mock': aff = -4; msg = '他不恼，只把剑缓缓归正，站得笔直：「躲，也是功夫。」他拱手，「师父教的功夫，不敢卖弄。」转身下石阶去了——此后演武场上见你，他照旧点头，只是不再替你画那个圆。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'wd_event_003': {
        id: 'wd_event_003', npcId: WD_NPC_ID, title: '剑名不争', icon: '🗡️',
        desc: '深夜真武殿，他擦剑——剑身刻着「不争」二字。',
        minAffection: 25, trigger: { random: 0.35 }, cooldown: 0, flag: 'wd_e003_done',
        autoTrigger: { timeRange: [22, 3], location: '武当派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '深夜过真武殿，殿灯还亮着。他独自坐在灯下擦剑，一寸一寸，比殿角的更香还慢。', type: 'description' },
            { speaker: 'narrator', text: '你走近——那剑没有鞘，剑身近锷处刻着两个小字：不争。', type: 'description' },
            { speaker: 'npc', text: '「不争。」他没抬头，指腹停在那两个字上，「师父赐的剑名。天道不争——所以，剑无鞘。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '在他旁边坐下，陪他把剑擦完', effect: 'sit', affection: 8 },
                { text: '「没有鞘的剑——不怕伤人，也不怕伤己么？」', effect: 'ask', affection: 7 },
                { text: '「不争？怕输的剑，也配叫剑。」', effect: 'mock', affection: -5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'sit': aff = 8; msg = '你在他旁边坐下，不说话。灯花爆了一声。他把剑擦完，忽然开口：「小时候，人说这名不配我。」顿了顿，「如今觉得配。争的人，擦不净剑。」他收剑横膝，把灯往你那边推了推，「天黑。照着回。」'; break;
                case 'ask': aff = 7; msg = '他想了很久，久到你以为他不答了：「怕。」就一个字。他把剑归回膝上，「所以日日擦。利器不敢懒。」他抬眼看你，眼神很直，「人也一样。我怕伤人，所以日日擦自己。」'; break;
                // 真负选项：「不争」是祖师爷传下的剑名，也是他二十七年立身的根，笑它怯懦等于笑他这个人
                case 'mock': aff = -5; msg = '擦剑的手停了。殿里很静，香灰直直落下来。他收剑，熄灯，在黑暗里说了一句，很轻，也很平：「怕输，就不会擦二十七年。」次日殿灯如常，只是他见你时，不再让你看剑。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'wd_event_004': {
        id: 'wd_event_004', npcId: WD_NPC_ID, title: '晨钟', icon: '🔔',
        desc: '钟杵上磨出两处手印——他替人撞了三年钟。',
        minAffection: 32, trigger: { random: 0.3 }, cooldown: 0, flag: 'wd_e004_done',
        autoTrigger: { timeRange: [4, 6], location: '武当派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '拂晓，真武殿的钟声从山顶滚下来，一声，又一声。你摸黑上到钟楼，见他抱着钟杵——杵上磨出两处手印，一深，一浅。', type: 'description' },
            { speaker: 'narrator', text: '看香火的小道童在旁边揉着眼睛嘟囔：本该撞钟的师兄贪睡，三年来都是阙师兄替他撞的，一个早课都没误过。', type: 'description' },
            { speaker: 'npc', text: '他见你来，手没停，钟声不乱：「吵到你了？」顿了顿，「快撞完了。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '上前接过钟杵：「今日头一杵，我来。」', effect: 'strike', affection: 8 },
                { text: '陪他撞完这轮钟，一起看日出', effect: 'stay', affection: 7 },
                { text: '「大清早的，钟声扰人清梦。」', effect: 'scold', affection: -3 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'strike': aff = 8; msg = '你接过钟杵。他让开半步，不放心似的叮嘱：「头一杵，要平。」你抱杵撞出去，钟声堂堂正正，惊起满山宿鸟。他听着，极轻地点了下头：「平。」自那日起，晨钟的头一杵他都等你——你来，你撞；你不来，他才自己撞。'; break;
                case 'stay': aff = 7; msg = '钟撞罢，天边泛白。他收了钟杵，陪你在钟楼边沿坐下，看云海从山尖一寸寸退下去。全程他说的话不超过十个字。日出时他起身，掸了掸道袍：「早课。」下楼的背影很直，步子却比平日轻。'; break;
                // 真负选项：三年替人撞钟是他不说出口的厚道，嫌它吵，等于把这份厚道当成了打扰
                case 'scold': aff = -3; msg = '钟杵停了半拍，又继续，钟声如旧。他没回头，撞完一轮才说：「对不住。」三个字，一字一顿。次日钟声照旧，只是末三杵轻了些——小道童说，阙师兄的钟，三年来从没吵醒过任何人，他一直是算着香客起身的时候撞的。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'wd_event_005': {
        id: 'wd_event_005', npcId: WD_NPC_ID, title: '云梯', icon: '🪜',
        desc: '他教你云梯纵，手始终虚扶——从没真的碰到你。',
        minAffection: 40, trigger: { random: 0.3 }, cooldown: 0, flag: 'wd_e005_done',
        autoTrigger: { location: '武当派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '崖边，他教你云梯纵。他先走了一遍：身影贴着崖壁三起三落，轻得像一片羽毛。', type: 'description' },
            { speaker: 'narrator', text: '轮到你练，他全程在你身后半步，两手虚虚扶着——你歪了，手到；你稳了，手又收回去。一整天，那双手从没真的碰到你。', type: 'description' },
            { speaker: 'npc', text: '日暮你忍不住问。他收手，答得认真：「碰到你，你就学不会了。」又补一句，「轻功要自己找。找到的，才是自己的。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「那明日，你还在我身后半步。」', effect: 'again', affection: 9 },
                { text: '故意往后一歪，试他那双手接不接', effect: 'fall', affection: 8 },
                { text: '长揖到地：「谢师兄倾囊。」', effect: 'thanks', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'again': aff = 9; msg = '他怔了一下，像没料到这样的答话，耳根慢慢红了。半晌，点头：「好。」次日，再次日，半月——崖边总有个身后半步的人，两手虚扶。三代弟子私下说，阙师兄教轻功，从没这样上心过。'; break;
                case 'fall': aff = 8; msg = '你往后一歪，风声过耳——那双手稳稳扣住你的手臂，比任何一次练功都实。他把你拽回来，皱着眉，一字一顿：「不许赌。」可他的手没有立刻松，站了半天，才又低声说了一句：「……吓到了。我。」那是你头一回听他说自己。'; break;
                case 'thanks': aff = 6; msg = '他侧身避开你的长揖，有些无措地摆手：「别。」站了半天，憋出一句：「你有天分。天分……该教。」人拙，话也拙，只有那份认真不拙。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'wd_event_006': {
        id: 'wd_event_006', npcId: WD_NPC_ID, title: '拙的来历', icon: '📜',
        desc: '被议下山那年，真武殿墙上多了一行新墨。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'wd_e006_done',
        autoTrigger: { location: '武当派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '夜话。他难得话多了一点点——说起小时候。', type: 'description' },
            { speaker: 'npc', text: '「体弱。慢。」他望着灯，「历次考较，垫底。殿里议过我下山——那年我十五，行李都收好了。」' },
            { speaker: 'npc', text: '「走的前夜，真武殿墙上多了一行新墨：『先学慢，再学快。』」他抬眼，「我当是祖师显迹，跪了一夜。次日，掌门留了我。一留，二十年。」' },
            { speaker: 'narrator', text: '后来你才辗转知晓：那行墨是宋远桥写的。掌门半夜搬了梯子写上去，写完又把梯子藏了。这件事，你没有告诉他——有些谎，是慈悲。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「写字的人和跪一夜的人，都没有错。」', effect: 'both', affection: 9 },
                { text: '「掌门一句话留你二十年——这份债，你怎么还？」', effect: 'ask', affection: 7 },
                { text: '什么都不说，替他把凉透的茶续上', effect: 'tea', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'both': aff = 9; msg = '他看着你，看了很久，脊背慢慢直了：「……都没有错。」他把这句话咀嚼了半晌，「我守了它二十年。写字的人，也守了二十年。」灯外夜风过，他忽然又添了一句，很轻：「谢你。懂。」'; break;
                case 'ask': aff = 7; msg = '他想也没想：「练剑。」一个字一个字往外放，「掌门要武当的剑传下去。我练慢，练实，练到能替这座山站桩——这就是还。」他望向真武殿的方向，「哪日守住了山，才算还清。」'; break;
                case 'tea': aff = 6; msg = '你替他续上热茶。他捧着杯子暖手，垂眼喝了一口，半天，说：「这些话，没跟人讲过。」又停了停，「讲了，胸口……松了些。」灯焰晃了一下，他的眉眼比平日软了一分。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'wd_event_007': {
        id: 'wd_event_007', npcId: WD_NPC_ID, title: '推手', icon: '☯️',
        desc: '太极推手，他教你「舍己从人」。',
        minAffection: 55, trigger: { random: 0.3 }, cooldown: 0, flag: 'wd_e007_done',
        autoTrigger: { location: '武当派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '清晨的真武殿前庭，他教你太极推手。双掌相搭，他的劲又沉又软，引着你的力走：「舍己从人。」', type: 'description' },
            { speaker: 'npc', text: '「别顶。」他的掌贴着你腕，慢慢引，「人来，我随；人去，我送。舍了自己，才知劲往哪儿去。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '陪他推一整夜，推到东方既白', effect: 'dawn', affection: 11 },
                { text: '问他：「你让了二十七年——让的时候，想不想争？」', effect: 'ask', affection: 8 },
                { text: '「舍己从人？说到底，是不敢跟人硬碰。」', effect: 'scoff', affection: -4 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'dawn': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 11) : { ok: true };
                    if (!_py.ok) { aff = 4; msg = '推到三更，你两臂发沉，步法先散了。他扶住你，收了势：「今日，到这。」送你到月洞门，又补一句，「底子好。睡吧。」（精力不足，你先趴在廊柱上睡着了）'; break; }
                    aff = 11; msg = ('两个人在前庭推手，从黄昏推到三更，从三更推到东方既白。全程他话极少，只是引，只是随。晨钟响时他忽然收手，看着你：「……顺了。」这是他给过的最高评价。收势后他又说，「下次，还推。」') + '（精力-11）'; break; }
                case 'ask': aff = 8; msg = '推手停了。他收掌，立在那里很久。久到你以为他不答了，他才开口：「想。」就一个字。他转身进殿，再出来时，多说了半句：「想的时候，就擦剑。擦净了，就不想了。」这半句，你记了很久。'; break;
                // 真负选项：「让」是他的功夫，不是他的怯——把舍己从人译成不敢硬碰，等于把他的道译成了病
                case 'scoff': aff = -4; msg = '他的掌还搭在你腕上，引的劲却散了。他收手，退一步，站定：「敢不敢，到时候你看得见。」拱手，「早课了。」从此清晨的前庭他照旧练剑，只是不再喊你推手。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'wd_event_008': {
        id: 'wd_event_008', npcId: WD_NPC_ID, title: '剑鸣', icon: '🌙',
        desc: '深夜「问道」自鸣一声，满殿只有他听见。',
        minAffection: 62, trigger: { random: 0.3 }, cooldown: 0, flag: 'wd_e008_done',
        autoTrigger: { timeRange: [21, 3], location: '武当派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '深夜真武殿。你与他论剑，忽听祖师像后供剑的方向传来一声清鸣——如龙吟，如滴水穿玉，一瞬即止。', type: 'description' },
            { speaker: 'narrator', text: '你悚然。他却不动：「问道剑鸣了。」祖师的佩剑，供奉百年，无人请得动，只在深夜偶有清音——满殿的人，历来只有他听得见。', type: 'description' },
            { speaker: 'npc', text: '「剑有心。」他望着架上那柄剑，声音很低，「心不静的人，听不见。我……心静，所以听见。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「那我陪你坐着，坐到听见为止。」', effect: 'wait', affection: 12 },
                { text: '问他：「剑鸣的时候，你心里是什么？」', effect: 'feel', affection: 8 },
                { text: '陪他静坐一会儿，退到殿门外守着', effect: 'guard', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'wait': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 12) : { ok: true };
                    if (!_py.ok) { aff = 5; msg = '你守到三更，眼皮越来越沉，先趴在经案上睡着了。醒来时身上盖着他的外袍，案头多了一行他的字，笔画笨拙：剑鸣了。你睡着。没叫你。（精力不足，那一夜你先撑不住了）'; break; }
                    aff = 12; msg = ('殿灯燃到三更，两个人对坐，谁都不说话。天将明时，架上剑忽又清鸣一声——比头一声长，像叹息，又像应答。你听见了。你抬头，他也正看你，眼里有你从没见过的东西。半晌，他说：「……它认你了。」这三个字，他说得很重。') + '（精力-12）'; break; }
                case 'feel': aff = 8; msg = '他静了很久，久到香落了一寸。「像……」他找词，找得笨拙，「像有人在殿那头，应我一声。」他垂下眼，「满山的人当我闷。剑鸣的时候，我不闷。殿里有剑，剑外有山——够了。」'; break;
                case 'guard': aff = 6; msg = '你陪坐片刻，悄悄退出去，坐在殿门外的石阶上守夜。风过庭院。天明前他出来，见你还在，脚步顿住。半晌，说：「夜凉。」回殿取了外袍，披在你身侧的廊柱上——仍旧没碰你的肩，可袍子是暖的。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'wd_event_009': {
        id: 'wd_event_009', npcId: WD_NPC_ID, title: '剑鞘之诺', icon: '🔗',
        desc: '他把一具新做的剑鞘交到你手里。',
        minAffection: 68, trigger: { random: 0.3 }, cooldown: 0, flag: 'wd_e009_done',
        autoTrigger: { location: '武当派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '他约你去真武殿。灯下摆着一具新做的剑鞘，木色还带着刨花的香气，鞘口缠了七道铜丝——一看便知是不擅此道的人，一遍一遍缠出来的。', type: 'description' },
            { speaker: 'npc', text: '「我做的。」他双手捧起剑鞘，递到你面前，「不争从来没有鞘。往后，它有。」' },
            { speaker: 'npc', text: '「鞘在你手里，剑在我身边。」他看着你，一字一顿，「剑归鞘那日，我来寻你。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '双手接过剑鞘：「这个诺，我收下了。」', effect: 'promise', affection: 14 },
                { text: '接过鞘，把自己的剑与「不争」并排放好：「鞘合不合，先问过剑。」', effect: 'fit', affection: 9 },
                { text: '「……为什么给我？」', effect: 'why', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'promise': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 14) : { ok: true };
                    if (!_py.ok) { aff = 6; msg = '殿夜太深，寒气浸骨，你先打了个晃。他扶住你，把剑鞘收起来，皱眉：「今日到这。」送你到山门，又把鞘塞回你怀里，「拿着。诺不变。」（精力不足，那一夜你先撑不住了）'; break; }
                    aff = 14; msg = ('你双手接过剑鞘。他长长吐出一口气，肩膀松下来，像放下了二十七年的什么。他转身从架上取下「不争」，横捧到祖师像前一揖——再回身看你，只一句：「阙守拙这辈子，话没说过满。这句也是。」剑鞘上还留着他掌心的温度。') + '（精力-14）'; break; }
                case 'fit': aff = 9; msg = '他看你把两柄剑并排放好，罕见地有些手足无措。半晌，说：「鞘是给不争做的。只合不争。」顿了顿，声音低了半度，「你的……要，我再做一具。」鞘口缠七道铜丝的人，再缠七道，也是肯的。'; break;
                case 'why': aff = 5; msg = '他被问住，捧鞘的手紧了紧。半天，答，仍旧只有几个字：「因为是你。」再多的话他说不出来，耳根红了。他把鞘往你手里按了按，转过身去：「拿着。」灯下他的背挺得笔直，像在用力。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'wd_event_010': {
        id: 'wd_event_010', npcId: WD_NPC_ID, title: '祖师的考校', icon: '🍂',
        desc: '扫叶的老道与你推手一局——祖师只问你一句。',
        minAffection: 72, trigger: { random: 0.3 }, cooldown: 0, flag: 'wd_e010_done',
        autoTrigger: { location: '武当派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '山道上遇见个扫叶的老道。青布道袍，竹帚扫落叶，扫三步，退两步——和他一个扫法。', type: 'description' },
            { speaker: 'narrator', text: '老道直起腰，冲你笑了笑，把帚一靠：「小友，陪老头子推一局手？」双掌一搭，你心头剧震——那股劲渊停岳峙，随你如何进，都如推云海。你这才知道：眼前是闭关百年的祖师，张三丰。', type: 'description' },
            { speaker: 'npc', text: '一局推罢，祖师收掌，看了你很久。只问了一句：「这孩子慢。你，等得起吗？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '长揖及地：「等得起。慢，有慢的走法。」', effect: 'wait', affection: 11 },
                { text: '如实答：「不知等几年。但今日的每一步，我都想同他走。」', effect: 'honest', affection: 8 },
                { text: '什么也不说，抬掌把这局没推完的手推完', effect: 'hand', affection: 9 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'wait': aff = 11; msg = '祖师盯着你看了半晌，忽而大笑，笑声惊起满山宿鸟：「好一个『慢有慢的走法』！」他拾起竹帚，扫着落叶走远，声音从叶影里飘来，「回去告诉那孩子——他的慢，有人肯等了。」当夜，真武殿祖师像侧的墙上多了半行新墨：「不争之剑，需争时，为一人争。」'; break;
                case 'honest': aff = 8; msg = '祖师不笑，缓缓点头：「不知，便是知。」他拍了拍你的手背，「肯说不知的，比说等的实。那孩子，实；你也实。」三日后，真武殿墙上多了半行新墨：「不争之剑，需争时，为一人争。」他在那半行墨下站了一下午。'; break;
                case 'hand': aff = 9; msg = '你一言不发，抬掌，把这局推手推完。舍己从人——祖师的劲如潮水，退尽时，他先收了手：「跟他学的？」他笑了，「教的人好，学的人也好。」老道扛帚而去。次日真武殿墙上多了半行新墨：「不争之剑，需争时，为一人争。」黄昏他寻到你，只说了五个字：「祖师见你了。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'wd_event_011': {
        id: 'wd_event_011', npcId: WD_NPC_ID, title: '魔教攻山', icon: '🌩️',
        desc: '魔教夜袭武当——他生平第一次拔「不争」。',
        minAffection: 78, trigger: { random: 0.3 }, cooldown: 0, flag: 'wd_e011_done',
        autoTrigger: { location: '武当派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '三更火起，四面杀声——魔教夜袭武当。这一场早有征兆：魔教频探武当虚实，探了半年，探的就是今夜。宋远桥在山门力战受创，三代弟子被困在石阶与山门之间。', type: 'description' },
            { speaker: 'narrator', text: '火光里你看见他。他立在石阶正中，手按在「不争」剑柄上——二十七年，满山没人见过这柄剑出鞘。', type: 'description' },
            { speaker: 'npc', text: '他拔剑。一剑。剑光不快，却重如山岳——魔教先锋连人带刀被这一剑压下了石阶。剑出之后，他脸色如纸，单膝跪地，「不争」拄在地上，人才撑住。', type: 'description' },
            { speaker: 'player_select', text: '你必须立刻做点什么。', options: [
                { text: '冲到他身边，与他背对背，共守山门', effect: 'back', affection: 12 },
                { text: '挡在他身前，以身作盾，硬接第二波攻势', effect: 'shield', affection: 14 },
                { text: '高喊：「三代弟子，结真武剑阵——护住剑侍！」', effect: 'rally', affection: 10 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'back': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 14) : { ok: true };
                    if (!_py.ok) { aff = 6; msg = '第二波来得更凶，你挡了十几招，眼前发黑，被震下石阶——醒来时山门已守住，他坐在你旁边，手臂上缠着布。「你睡了。」他说，「我背你下来的。」（精力不足，那一场你先力竭了）'; break; }
                    aff = 12; msg = ('你冲到他身边，背对背——你的剑是他的墙，他的剑是你的墙。魔教攻了三波，退了三波。天亮收兵，他撑着「不争」起身，哑着嗓子对你说了两个字：「你在。」顿了顿，又说，「好。」这两个字，比千军都重。') + '（精力-14）'; break; }
                case 'shield': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 20) : { ok: true };
                    if (!_py.ok) { aff = 7; msg = '你挡下两刀，第三刀擦着肩头过去，血染了半边衣襟。混乱里有人把你抬进殿中——醒来时他守在榻边，「不争」横在膝上。见你睁眼，他一字一顿：「不许再挡。」眼睛是红的。（精力不足，你中了一刀）'; break; }
                    aff = 14; msg = ('你挡在他身前，硬接第二波——刀锋过肩背，你一步不退。身后他拄剑起身，剑手在抖，声音不抖：「你退一步，我再出一剑。」两个人守山门守到宋远桥带伤杀回。战后他解下自己的护腕，一寸一寸替你把伤口缠好，缠完只说一句：「这条命，记账上。我的账。」') + '（精力-20）'; break; }
                case 'rally': aff = 10; msg = '你一嗓子喊出去，被困的三代弟子应声——真武剑阵立起，剑光连成一片，把他和你都护在了阵心。魔教冲不动阵，天亮撤走。事后宋远桥拄剑望着剑阵与剑侍，只说了两个字：「好。好。」他收了「不争」，走到你身边，低声：「你喊的，我听见了。每一声。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'wd_event_013': {
        id: 'wd_event_013', npcId: WD_NPC_ID, title: '终章·一争', icon: '💍',
        desc: '「这个『争』字，我只想用一回。——与你争一个道。」',
        minAffection: 85, trigger: { random: 1.0 }, cooldown: 0, flag: 'wd_e013_done',
        autoTrigger: { location: '武当派', random: 1.0 },
        endingMap: { '登云': 'wd_ending_登云', '守山': 'wd_ending_守山', '云游': 'wd_ending_云游', '听钟': 'wd_ending_听钟', '归鞘': 'wd_ending_归鞘', '空山': 'wd_ending_空山' },
        scenes: [
            { speaker: 'narrator', text: '真武殿。祖师像侧，那半行新墨犹在：「不争之剑，需争时，为一人争。」墨迹之下，他双手捧着「不争」，剑横胸前。', type: 'description' },
            { speaker: 'npc', text: '「不争这个字，我守了二十七年。」他看着你，目光直得像剑，「这个『争』字，我只想用一回。」' },
            { speaker: 'npc', text: '「——与你争一个道。」他把剑往前递了一寸，「你应不应？」' },
            { speaker: 'player_select', text: '你的选择将决定你们的关系走向', options: [
                { text: '「应。争一个山门外的道——你带剑，我带你，四海同走。」', effect: 'lover_travel', affection: 30 },
                { text: '「应。争一个山门内的道——我留下，真武殿的灯，往后两个人剪。」', effect: 'lover_stay', affection: 28 },
                { text: '「道可以论，风月不谈。做你的论剑知己——一年一会，山下茶棚推手三局。」', effect: 'friend', affection: 20 },
                { text: '「道可以论。殿里给我留一只蒲团——年年晨钟，我来撞头一杵。」', effect: 'friend_stay', affection: 18 },
                { text: '「这个『争』字，我不敢应。我只是一个下山去的过客。」', effect: 'none', affection: 0 }
            ]}
        ],
        effects: function(npc, choice) {
            // 三度伤透即封剑：辜负独立成结局「归鞘」，与「空山」（错过）分账
            var negCount = (window._negativeChoiceCount && window._negativeChoiceCount[WD_NPC_ID]) || 0;
            if (negCount >= 3 && (choice === 'lover_travel' || choice === 'lover_stay')) {
                return { affection: 0, msg: '他看着你，不怒，眼里那点光却一寸一寸静了下去。他朝你伸出手——你把那具剑鞘还了他。他掸净鞘上的灰，把「不争」缓缓归鞘，走到祖师像侧，将剑供了上去。「争过一次。」他说得很平，「争错了人。这样的剑，不如不出鞘。」自那日起，真武殿的剑侍只撞钟，只扫阶，不再练剑。', ending: '归鞘' };
            }
            switch (choice) {
                case 'lover_travel': return { affection: 30, msg: '他捧剑立着，很久没动——然后手开始抖。他向祖师像深深一揖：「弟子，下山。」直起身，他把「不争」负在背上，与你并肩走出真武殿。千级石阶他走得很慢，像要把每一级都记住。到阶底，他回头望了一眼山门，又看你，只说两个字：「走吧。」', ending: '登云' };
                case 'lover_stay': return { affection: 28, msg: '他捧剑的手紧了紧，深深点头：「好。」他从你手里接过剑鞘，把「不争」归了鞘——连剑带鞘，一起放进你掌心：「剑归鞘。人归山。」那一夜真武殿的灯剪到三更，灯下两个人的影子，头一回挨在一起。', ending: '守山' };
                case 'friend': return { affection: 20, msg: '他沉默了一会儿，收剑，点头：「知己。」他站定，拱手，一字一顿，「一年一会。茶棚，三局。」说完这句，他像是放下了什么，又像是空了什么——他没说。你也没问。', ending: '云游' };
                case 'friend_stay': return { affection: 18, msg: '他看了你很久，收剑：「蒲团。」他点头，「东窗下，留。向阳。」自那日起，真武殿东窗下多了一只蒲团，晒得总是暖的——小道童说，那是阙师兄每日搬进搬出的，风雨无阻。', ending: '听钟' };
                case 'none': return { affection: 0, msg: '他把剑一寸一寸收回去，剑光黯了。「过客。」他重复了一遍，站定，拱手，「武当送客，送到山门。」他亲自送你下千级石阶，扫过的石阶干干净净。到阶底，他说了最后一句：「走稳。」', ending: '空山' };
            }
            return { affection: 0, msg: '' };
        }
    }
};

// ============ 阙守拙结局演出（6 个） ============
var WD_ENDINGS = {
    'wd_ending_登云': {
        id: 'wd_ending_登云', npcId: WD_NPC_ID, title: '结局·登云', icon: '☁️',
        route: '登云',
        scenes: [
            { speaker: 'narrator', text: '下山前夜，他在真武殿跪了一宿。天明出来时，「不争」负在背上，鞘在腰间——你还给他的那具鞘，他又缠了七道铜丝，一道没少。', type: 'description' },
            { speaker: 'npc', text: '宋远桥送他们到山门，看了两人很久，最后只对阙守拙说了一句：「慢些走。」他认真点头：「嗯。她走得快——我喊她。」', type: 'description' },
            { speaker: 'narrator', text: '多年后，江湖有一对道侣的传说：一柄剑无鞘，一个人拙，走到哪里，哪里的不平事就多一桩了断。他的剑很慢，可每次都到。', type: 'description' },
            { speaker: 'narrator', text: '有人常听见他落在后头喊：「慢些走，等等我。」{playerTa}笑着回他「你分明轻功比我好」，他也不辩，只管慢慢跟。这句「慢些走，等等我」，成了他们之间的笑话——笑话是他的，路是两个人的。', type: 'description' }
        ],
        finalText: '——— 结局·登云（道侣·同行）———'
    },
    'wd_ending_守山': {
        id: 'wd_ending_守山', npcId: WD_NPC_ID, title: '结局·守山', icon: '🏮',
        route: '守山',
        scenes: [
            { speaker: 'narrator', text: '你留在了武当。真武殿的灯，从此两个人剪——他擦剑，你挑灯，一剪剪到半夜，说的话不超过十句，灯却从没熄过。', type: 'description' },
            { speaker: 'npc', text: '宋远桥难得笑了一回：「留了你二十年，不如一具鞘。」他认真答：「掌门留的是人。她留的是剑。剑归了鞘，人就哪里都不去了。」', type: 'description' },
            { speaker: 'narrator', text: '冬至夜，雪。他把外袍披到你身上，再将「不争」连着鞘一起搁进你怀里，看你抱稳了，才说：「剑归鞘了。」顿了顿，耳根微红，「人也归了。」', type: 'description' },
            { speaker: 'narrator', text: '千级石阶还是他扫，扫三步退两步——只是扫帚后头多了一双脚印。小道童们说，阙师兄成家以后，扫的台阶都比从前圆。', type: 'description' }
        ],
        finalText: '——— 结局·守山（道侣·归隐）———'
    },
    'wd_ending_云游': {
        id: 'wd_ending_云游', npcId: WD_NPC_ID, title: '结局·云游', icon: '🍵',
        route: '云游',
        scenes: [
            { speaker: 'narrator', text: '一年一会，成了你们之间的定约。山下茶棚，一壶粗茶，推手三局——胜负不论，论完各走各路，来年再会。', type: 'description' },
            { speaker: 'npc', text: '「今年，你的劲沉了。」推罢他递茶给你，难得多评了半句，「好。」从他嘴里，这一个「好」字，抵旁人的十个。', type: 'description' },
            { speaker: 'narrator', text: '有人问他，{playerTa}算他什么人。他想了很久，答：「知己。」答完喝茶，又觉得两个字不够，补了两个字：「难得。」', type: 'description' }
        ],
        finalText: '——— 结局·云游（挚友·同行）———'
    },
    'wd_ending_听钟': {
        id: 'wd_ending_听钟', npcId: WD_NPC_ID, title: '结局·听钟', icon: '🔔',
        route: '听钟',
        scenes: [
            { speaker: 'narrator', text: '{playerTa}成了真武殿的常客。东窗下那只蒲团，看香火的小道童从不敢挪——那是阙师兄特意留的，每日搬进搬出，晒得总是暖的。', type: 'description' },
            { speaker: 'narrator', text: '年年岁首的晨钟，头一杵他必把钟杵交到{playerTa}手里。这规矩满山皆知，无人有异议——掌门也只当没听见。', type: 'description' },
            { speaker: 'npc', text: '钟撞罢，两人坐在钟楼边沿看日出。他忽然开口：「剑有心，钟也有。」顿了顿，「心静的听得见。你如今，听得见了。」', type: 'description' }
        ],
        finalText: '——— 结局·听钟（挚友·归隐）———'
    },
    'wd_ending_归鞘': {
        id: 'wd_ending_归鞘', npcId: WD_NPC_ID, title: '结局·归鞘', icon: '💔',
        route: '归鞘',
        scenes: [
            { speaker: 'narrator', text: '不争永不出鞘。他把剑供回了真武殿祖师像侧——归鞘之前，他把那具鞘里里外外掸净了，铜丝一道一道捋平。', type: 'description' },
            { speaker: 'narrator', text: '从此剑侍只撞钟，只扫阶，不再练剑。演武场静了，前庭静了，殿里那柄「不争」，也静了。', type: 'description' },
            { speaker: 'npc', text: '宋远桥问过一次：为何封剑。他扫着台阶，答了一句：「争过一次，争错了人。这样的剑，不如不出鞘。」掌门沉默良久，叹口气，走了。', type: 'description' },
            { speaker: 'narrator', text: '小道童说，封剑那夜，阙师兄在祖师像前跪到天明。墙安安静静——没有再落一滴新墨。', type: 'description' }
        ],
        finalText: '——— 结局·归鞘（辜负）———'
    },
    'wd_ending_空山': {
        id: 'wd_ending_空山', npcId: WD_NPC_ID, title: '结局·空山', icon: '🌫️',
        route: '空山',
        scenes: [
            { speaker: 'narrator', text: '他照旧扫阶，扫三步退两步；照旧撞钟，一个早课不误。只是再没抬头看过山门。', type: 'description' },
            { speaker: 'narrator', text: '真武殿的「问道」后来又鸣过几回，满殿无人听见——心静的那个人，心空了。', type: 'description' },
            { speaker: 'narrator', text: '再后来，有游方客上武当问剑，剑侍接待如仪，答话一字是一字，没有一个字是多的。客走了，他把石阶扫得干干净净。云雾漫上来——武当的云雾，空了一半。', type: 'description' }
        ],
        finalText: '——— 结局·空山（错过）———'
    }
};

// ============ 性别语境事件（femctx 女玩家 / mctx 男玩家，互斥） ============
var WD_GENDER_CTX_EVENTS = {
    // 女玩家：真武殿香火道童的提醒
    'wd_event_femctx': {
        id: 'wd_event_femctx', npcId: WD_NPC_ID, title: '香火道童的话', icon: '🕯️',
        desc: '真武殿看香火的小道童把你叫住了。',
        minAffection: 55, trigger: { random: 0.35 }, cooldown: 0, flag: 'wd_e_femctx_done',
        requirePlayerFemale: true,
        autoTrigger: { location: '武当派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '真武殿看香火的小道童给你引路，走着走着，忽然停下。这孩子殿里当了八年差，看着阙守拙从擦剑的年轻道人，熬成了剑侍。', type: 'description' },
            { speaker: 'npc', text: '「姑娘。」道童压低声音，「剑侍从不让人碰不争——你来那日，剑自己响了一声。满殿就剑侍听见了，他对着剑站了半个时辰，一个字没说。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「剑响给我听，还是给他听——你去问他。」', effect: 'tease', affection: 8 },
                { text: '「他那具剑鞘，铜丝缠了七道。你知道为什么是七道么？」', effect: 'sheath', affection: 7 },
                { text: '「道童，剑有心，你们剑侍也有。」', effect: 'heart', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'tease': aff = 8; msg = '道童一怔，忽然拍手要笑，又赶紧捂住嘴：「姑娘胆大。」他往殿里瞅了瞅，压得更低，「我可不敢问。问了，剑侍的耳朵要红三天——上回掌门夸了你一句，红了三天。」'; break;
                case 'sheath': aff = 7; msg = '道童眼睛一亮：「你知道铜丝！」他掰着指头，「剑侍缠了拆、拆了缠，整整七遍——头一遍缠歪了，他重做了一夜。」说完吐吐舌头，「这话姑娘听过就算，别说是我讲的。」'; break;
                case 'heart': aff = 6; msg = '道童把这句话想了半天，重重点头：「难怪剑响。」他把香案上的贡果往你手边推了推，「姑娘往后常来。东窗下那只蒲团——剑侍每日搬出来晒的，晒的就是你来坐。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // 男玩家：三代弟子间的流言
    'wd_event_mctx': {
        id: 'wd_event_mctx', npcId: WD_NPC_ID, title: '三代言论', icon: '🌫️',
        desc: '演武场外，几个三代弟子压低了声音。',
        minAffection: 55, trigger: { random: 0.35 }, cooldown: 0, flag: 'wd_e_mctx_done',
        requirePlayerMale: true,
        autoTrigger: { location: '武当派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '演武场外，几个三代弟子凑在一处，见你过来，声音忽然压低——低得又不够彻底。', type: 'description' },
            { speaker: 'npc', text: '「剑侍让你三招，还肯教你云梯——上回教人功夫是三年前。那次也只教了半套。」大师兄模样的摇头。' },
            { speaker: 'npc', text: '「这还不算。」最小的那个把声音压得更低，「剑侍的不争没鞘，满山都知道。近来他夜夜做一具鞘——铜丝缠了七道。你们说，这是什么意思？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「什么意思，他自己会说。轮不到旁人猜。」', effect: 'defy', affection: 8 },
                { text: '「师弟们，推手三局——输了的请茶。」', effect: 'spar', affection: 7 },
                { text: '「就是你们想的那个意思。我不忌讳。」', effect: 'own', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'defy': aff = 8; msg = '几个弟子面面相觑，大师兄起身拱手：「……有理。」他让开路，「剑侍守殿二十七年，守得比谁都实。兄台稳，我们放心。」自此三代弟子见你都客客气气，流言改成了敬语。'; break;
                case 'spar': aff = 7; msg = '三局推手，你赢了两局。最小的那个掏茶钱时挠头：「兄台的劲，跟剑侍一个路数。」你笑而不答——那劲是他手把手引出来的，你本来也没打算瞒谁。'; break;
                case 'own': aff = 6; msg = '满场一静。最小的把刚喝的茶喷了半口。大师兄盯着你看了半晌，忽然深深一揖：「……好胆。这话，我记下了。」次日流言就停了——不是压下去的，是满山都知道了：那个人自己认的。'; break;
            }
            return { affection: aff, msg: msg };
        }
    }
};

// ============ 合并进总事件池 ============
if (typeof NPC_PERSONAL_EVENTS !== 'undefined') {
    Object.assign(NPC_PERSONAL_EVENTS, WD_MAIN_EVENTS);
    Object.assign(NPC_PERSONAL_EVENTS, WD_GENDER_CTX_EVENTS);
}

// ============ 注册结局集与副作用回调 ============
if (typeof registerEndingSet === 'function') {
    registerEndingSet(WD_NPC_ID, WD_ENDINGS);
}
if (typeof registerEndingCallback === 'function') {
    registerEndingCallback(WD_NPC_ID, function(endingName, npc) {
        if (endingName === '登云' || endingName === '守山') {
            if (npc && typeof npc.setFlag === 'function') npc.setFlag('dao_companion');
            if (window.showMessage) window.showMessage('☯️ 你与阙守拙结为道侣！武当剑意感悟大幅提升', 'success');
        } else if (endingName === '云游' || endingName === '听钟') {
            if (npc && npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 30);
            if (window.showMessage) window.showMessage('☯️ 你与阙守拙成了推心置腹的论剑知己', 'success');
        } else if (endingName === '归鞘') {
            if (window.showMessage) window.showMessage('⚔️ 阙守拙封了不争。这个「争」字，他用完了', 'error');
        }
    });
}

// ============ 自动触发 + 每日钩子（复用 maybeAutoTriggerPersonalEvent） ============
function maybeAutoTriggerWdEvent(source) {
    return maybeAutoTriggerPersonalEvent(WD_NPC_ID, source, { finalEvents: ['wd_event_013'] });
}

if (typeof window !== 'undefined' && window.timeSystem && window.timeSystem.onNewDaySubscribe) {
    window.timeSystem.onNewDaySubscribe(function() {
        try {
            if (window.currentCharData && window.currentCharData.location === '武当派') {
                maybeAutoTriggerWdEvent('daily');
            }
            // 性别语境：每日在该派过夜 + 对应性别 + 好感≥55 + 未触发
            if (!window.currentCharData || !window.npcManager) return;
            var loc = window.currentCharData.location || '';
            if (loc !== '武当派') return;
            var npc = window.npcManager.getNPC ? window.npcManager.getNPC(WD_NPC_ID) : null;
            if (!npc) return;
            var aff = (npc.relationship && npc.relationship.affection) || 0;
            if (aff < 55) return;
            var isF = window.currentCharData.gender === 'female';
            var ctxId = isF ? 'wd_event_femctx' : 'wd_event_mctx';
            if (typeof hasEventTriggered === 'function' && hasEventTriggered(ctxId)) return;
            var ev = NPC_PERSONAL_EVENTS[ctxId];
            if (!ev) return;
            if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npc)) return;
            setTimeout(function() {
                if (document.querySelector && document.querySelector('.personal-event-modal')) return;
                if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npc)) return;
                if (typeof triggerPersonalEvent === 'function') triggerPersonalEvent(ctxId);
            }, 1200);
        } catch (e) { console.warn('[阙守拙线] 每日触发失败:', e); }
    });
}

// ============ 导出 ============
if (typeof window !== 'undefined') {
    window.WD_MAIN_EVENTS = WD_MAIN_EVENTS;
    window.WD_ENDINGS = WD_ENDINGS;
    window.maybeAutoTriggerWdEvent = maybeAutoTriggerWdEvent;
}

// 扩展男主名册（v20.74：阙守拙入册，吃醋对峙/和好两桩由 male-lead-*.js 稍后接线，名册 push 先行）
if (typeof window !== 'undefined' && window.MALE_LEAD_ROSTER && window.MALE_LEAD_ROSTER.push) {
    window.MALE_LEAD_ROSTER.push({ id: WD_NPC_ID, name: '阙守拙', sect: '武当派', eventId: 'wd_event_rival', reconcileId: 'wd_event_reconcile', femctxId: 'wd_event_femctx', mctxId: 'wd_event_mctx' });
}
console.log('[阙守拙线] 武当派感情线加载完成：结局 ' + Object.keys(WD_ENDINGS).length + ' 个 + 主线事件 ' + Object.keys(WD_MAIN_EVENTS).length + ' 个 + 性别语境 ' + Object.keys(WD_GENDER_CTX_EVENTS).length + ' 个');
