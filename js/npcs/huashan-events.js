// ==================== huashan-events.js - 竺听雨线情缘事件/结局/性别语境 v1.0（v20.72 第三批扩线） ====================
// 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / registerEndingSet / registerEndingCallback /
//       hasEventTriggered / checkEventTrigger / triggerPersonalEvent / canPlayerAccessPersonalEvent）
//       npcs/npc-system.js（executeEmotionInteraction 已加 bond_dao 拦截）
// 加载顺序：在 npc-personal-events.js 之后
// 男主·竺听雨（华山派大师兄、代掌门。笑傲担待型——总在笑，什么都自己扛；软肋是没人跟他说过「你可以不硬撑」）。
// 与前掌门（师父）并存于追忆：十年前华山遭逢大变，师父重伤而逝、临终托孤托派；风不平（师叔祖）当年负气下山，线内回归坐镇。
// 男女玩家皆可追，主线共享（代词按性别），各有专属性别语境事件（femctx/mctx）。
// 注：本线已入 MALE_LEAD_ROSTER（v20.73：吃醋对峙/和好/论交/道侣回访四桩已接线，见 male-lead-*.js）。

var HS_NPC_ID = 'sect_leader_华山派';

// ============ 主线事件（hs_event_001 ~ 011 + 终章 013） ============
var HS_MAIN_EVENTS = {
    'hs_event_001': {
        id: 'hs_event_001', npcId: HS_NPC_ID, title: '苍龙岭', icon: '🌉',
        desc: '栈道湿滑，他一把捞住了你。',
        minAffection: 12, trigger: { random: 0.4 }, cooldown: 0, flag: 'hs_e001_done',
        autoTrigger: { location: '华山派', random: 0.45 },
        scenes: [
            { speaker: 'narrator', text: '苍龙岭的栈道又湿又窄，你脚下一滑，整个人朝崖外荡出去——一只手从后面捞住你的后领，稳稳把你拎回了正道。', type: 'description' },
            { speaker: 'npc', text: '「山路滑，扶着我。」身后的人笑得爽朗，青衫上落着松针，腰间挂着个旧酒葫芦，「华山别的没有，陡，管够。」' },
            { speaker: 'narrator', text: '你回头——是华山大师兄竺听雨。他掌心一层厚茧，虎口磨得发亮。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '道谢，扶着他的手臂走完栈道', effect: 'thanks', affection: 5 },
                { text: '「我自己能走。」甩开手，又滑了一下', effect: 'proud', affection: 4 },
                { text: '注意到他掌心的茧：「你的剑，练得很苦。」', effect: 'callus', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'thanks': aff = 5; msg = '他一路扶着你走完苍龙岭，嘴上不闲：「华山迎客的礼数，就是先吓人一跳，再捞回来。」到岭头他松手，冲你一笑，「下回还走这条——我巡山，天天在。」'; break;
                case 'proud': aff = 4; msg = '你甩开他的手，下一步又滑——他又捞住你，笑出了声：「嘴硬。」这回他没松手，「硬到岭头再放你。」'; break;
                case 'callus': aff = 7; msg = '他愣了一下，把手翻过来看了看，笑了：「……头一回有人盯我的手，不盯我的剑。」他收手入袖，走了两步又回头，「剑也苦。改日云台峰，让你看它苦出来的样子。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'hs_event_002': {
        id: 'hs_event_002', npcId: HS_NPC_ID, title: '云台论剑', icon: '⚔️',
        desc: '他跟你过招，招招留手，事后请你喝酒。',
        minAffection: 18, trigger: { random: 0.35 }, cooldown: 0, flag: 'hs_e002_done',
        autoTrigger: { location: '华山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '云台峰论剑台，他跟你过了三十招——招招留手，却始终让你打得酣畅。收剑时他先赞你：「好剑。野路子，但有生气。」', type: 'description' },
            { speaker: 'npc', text: '「走，喝酒去。」他把剑往背上一挂，解下腰间酒葫芦晃了晃，「论剑的规矩——赢的请酒，输的陪喝。今天算平。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '陪他喝，请他指点剑路', effect: 'learn', affection: 7 },
                { text: '「下次别留手。我要真的赢你一次。」', effect: 'real', affection: 6 },
                { text: '「华山剑法，也就剩下花架子了。」', effect: 'mock', affection: -4 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'learn': aff = 7; msg = '一葫芦酒喝到半，他把你的剑路拆了个通透，末了自己先笑了：「说好的喝酒，怎么又上起课了。」他把葫芦塞给你，「剩下的归你。学费。」'; break;
                case 'real': aff = 6; msg = '他举杯的手停了停，看你，笑得深了些：「……行。」他碰了你的杯，「下次不留手。输给我别哭。」——可你看得出，他记下这句话了，记得很认真。'; break;
                // 真负选项：华山凋零是他心口的债，「花架子」三个字戳的是十年苦撑
                case 'mock': aff = -4; msg = '他脸上的笑没掉，只是眼睛里的光沉了一沉：「花架子？」他把葫芦收回腰间，站起身，掸了掸衣上松针，「华山如今是瘦了。瘦，也没塌。」他冲你拱拱手，先走了——那顿酒，他一个人喝的。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'hs_event_003': {
        id: 'hs_event_003', npcId: HS_NPC_ID, title: '笑的人', icon: '🏮',
        desc: '满山的事都归他，他总在笑——直到你撞见深夜崖边的他。',
        minAffection: 25, trigger: { random: 0.35 }, cooldown: 0, flag: 'hs_e003_done',
        autoTrigger: { timeRange: [22, 3], location: '华山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '白日里他是全华山最忙的人：师弟的功课、山门的账、香客的纠纷、剑盟的帖子——事事过他的手，件件带着笑。深夜你辗转难眠走到崖边，却看见他一个人坐在松树下，卷起袖口，往小臂的旧伤上抹药。', type: 'description' },
            { speaker: 'npc', text: '他察觉有人，袖子放下来的动作快得像练过千百遍——然后回头，又是那副笑：「哟，也睡不着？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '过去坐下，不说话，陪他看松影', effect: 'sit', affection: 8 },
                { text: '「你笑起来，比不笑的时候吓人。」', effect: 'call', affection: 7 },
                { text: '「华山都败落这样了，你撑着有什么用。」', effect: 'mock', affection: -5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'sit': aff = 8; msg = '你在他旁边坐下，什么都没说。松涛一阵一阵。很久，他忽然开口，声音比白日低：「……这条胳膊，是三年前护山门留下的。」他没看你，「跟你说这个干什么。」可他到底说了——对谁都没说过的事。'; break;
                case 'call': aff = 7; msg = '他一愣，随即笑骂：「……你这人。」笑容挂了两息，自己先撑不住了，垮下来一角。他望着松影，半晌：「不笑，师弟们该慌了。大师兄嘛。」他重新卷起袖口把药抹完——这回没避着你。'; break;
                // 真负选项：拿「败落」戳他十年的撑，比骂他本人狠十倍
                case 'mock': aff = -5; msg = '他坐在松影里没动，笑还挂在脸上，可那双眼睛一寸寸静了下去：「有什么用？」他重复了一遍，声音很轻，「师父走的时候问我同样的话——我答不上来，就只能撑着。」他站起身，拍拍衣上的松针，「夜深了，回吧。」从那天起他见你照旧笑，只是那些笑，再没到过眼底。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'hs_event_004': {
        id: 'hs_event_004', npcId: HS_NPC_ID, title: '雨夜剑堂', icon: '🌧️',
        desc: '每逢雨夜，他在剑堂坐一整夜。',
        minAffection: 32, trigger: { random: 0.3 }, cooldown: 0, flag: 'hs_e004_done',
        autoTrigger: { location: '华山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '入夜落雨。你路过剑堂，看见竺听雨一个人坐在堂中——没点灯，没练剑，就听着檐外的雨。师弟说，每逢雨夜他都这样，十年了。', type: 'description' },
            { speaker: 'npc', text: '「师父走的那天，就是这么大雨。」他没回头，声音混在雨声里，「我在堂外跪了一夜。雨太大，连哭声都听不见——也好。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '进堂，陪他坐到雨停', effect: 'stay', affection: 8 },
                { text: '去取一坛「千年醉」，拍开泥封', effect: 'wine', affection: 7, item: 'food_thousand_wine' },
                { text: '「淋雨听雨，矫情。」', effect: 'scoff', affection: -3 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'stay': aff = 8; msg = '你进堂，在他旁边坐下。两个人一句话没说，听了一夜的雨。天蒙蒙亮雨停时，他伸了个懒腰，冲你笑：「……十年了，头一回觉得雨夜短。」'; break;
                case 'wine': aff = 7; msg = '泥封拍开，酒香混着雨气漫开。他回头看见酒坛，眼睛亮了：「千年醉？你倒舍得。」两个人就着雨声分了这坛酒。他喝到半酣，忽然说：「师父生前也爱这口。他要是看见——」他顿住，把后半句就酒咽了，「看见我跟人喝酒，得骂我功课没做完。」'; break;
                // 真负选项：雨夜是他祭师父的私礼，「矫情」二字等于掀了他的灵堂
                case 'scoff': aff = -3; msg = '他坐在黑暗里没动。半晌，笑了一声，那笑比雨还冷：「矫情。」他重复了一遍，「……也是。」那夜之后剑堂的雨夜照旧，只是他再没跟人提过师父走的那天，下多大雨。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'hs_event_005': {
        id: 'hs_event_005', npcId: HS_NPC_ID, title: '剑名听雨', icon: '🗡️',
        desc: '他那柄剑，是师父的断剑重铸的。',
        minAffection: 40, trigger: { random: 0.3 }, cooldown: 0, flag: 'hs_e005_done',
        autoTrigger: { location: '华山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '他例行擦剑，你凑近看——剑身中段有一道极细的锻接痕，像愈合的骨。', type: 'description' },
            { speaker: 'npc', text: '「看出来了？」他把剑横过来，指腹抚过那道痕，「师父的剑。那年断的——我求铸剑山庄重新锻的，锻接了三次才成。」' },
            { speaker: 'npc', text: '「剑成那天下着雨，檐水顺着剑脊淌。我忽然就想通名字了。」他笑了笑，「听雨。师父没听完的雨，我替他听。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「好剑。断过又接上的，比没断过的硬。」', effect: 'praise', affection: 7 },
                { text: '接过布，替他把剑身擦完', effect: 'wipe', affection: 8 },
                { text: '「那你打算听到什么时候？」', effect: 'ask', affection: 9 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'praise': aff = 7; msg = '他怔了怔，把剑举到眼前又看了一遍那道锻痕，笑了：「……这话我爱听。」他收剑入鞘，「铸剑的师傅也说过——断口接得好，比原胚还韧。人也一样。」他说「人」的时候，看了你一眼。'; break;
                case 'wipe': aff = 8; msg = '你接过布，顺着剑脊一寸寸擦。他没拦，就在旁边看着——华山大师兄的剑，满山没人碰得，你擦完了整柄。收布时他低声：「……手法挺稳。往后擦剑的活，分你一半。」这话在别人听来是客套，你听得出是托付。'; break;
                case 'ask': aff = 9; msg = '他擦剑的手停了。雨点打在剑脊上，一声一声。「听到什么时候？」他望着剑身上自己的影子，很久，说，「……听到有人跟我说，雨停了，可以收剑了。」他抬眼看你，笑意浅淡，「你问这个干什么。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'hs_event_006': {
        id: 'hs_event_006', npcId: HS_NPC_ID, title: '临终托付', icon: '📜',
        desc: '他终于说起十年前那场大变。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'hs_e006_done',
        autoTrigger: { location: '华山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '松风夜。他难得没带酒，也没带笑，坐在崖边石上，像放了很久的剑。', type: 'description' },
            { speaker: 'npc', text: '「十年前，华山遭了一场大变。」他望着山下灯火，「外敌勾着内鬼上山，一场火，烧了半个华山。师父杀退来人，自己也重伤——撑了七天。」' },
            { speaker: 'npc', text: '「第七天夜里，他把我叫到榻前，说：『华山，交给你了。』」竺听雨的声音很平，平得像背了十年，「那年我十八。我说好。——这个『好』字，我说了十年，一天没敢收回来。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「你可以不笑。至少现在，这里没别人。」', effect: 'unmask', affection: 9 },
                { text: '「他托付的是华山，还是把你整个人都押进去了？」', effect: 'see', affection: 8 },
                { text: '「辛苦了。」', effect: 'thanks', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'unmask': aff = 9; msg = '他侧头看你，看了很久。然后他真的把笑收了起来——你头一回看清他不笑的脸，眉宇间全是十年的重量。「……不笑，原来是这个滋味。」他低声说，「轻。」那一夜松风大作，两个人在崖边坐到风停，谁都没再说话。'; break;
                case 'see': aff = 8; msg = '他浑身一震，像被人一剑点中旧伤：「……你怎么知道。」他望着山下，声音哑了，「师父说的是『华山交给你』。可这十年，我把竺听雨也一起交进去了——账、剑、笑、命，全充了华山的库。」他转头看你，「你是头一个，把这两样分开问的人。」'; break;
                case 'thanks': aff = 6; msg = '他愣了一下，随即笑出来，这回的笑有点真：「……辛苦。」他咀嚼着这两个字，「十年了，满山的人谢我护着他们，没人跟我说过辛苦。」他仰头灌了口不存在的酒——腰间葫芦是空的，他浑然不觉。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'hs_event_007': {
        id: 'hs_event_007', npcId: HS_NPC_ID, title: '撑', icon: '⛰️',
        desc: '他承认，华山是他拿命垫着的。',
        minAffection: 55, trigger: { random: 0.3 }, cooldown: 0, flag: 'hs_e007_done',
        autoTrigger: { location: '华山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '账房的灯亮到三更。你进去送醒神汤，看见案上摊着华山的账——亏空的数字触目惊心，好几笔「外捐」的落款，都是竺听雨自己的私产。', type: 'description' },
            { speaker: 'npc', text: '「看见了？」他没遮，反而把账本推到你面前，笑得坦然，「华山这些年能开伙、能修栈道、能给师弟们换冬衣——一半是山门的进项，一半，是我垫的。」' },
            { speaker: 'npc', text: '「别劝。」他先一步堵你，「我乐意。华山在，师父的托付就在。我这条命本来就是捡回来替他花的——」他顿了顿，声音低下去，「……就是有时候，夜里算账，算着算着，有点撑不住。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「账，分我一半。华山也分我一半——我不是外人。」', effect: 'share', affection: 11 },
                { text: '「撑不住就说撑不住。这不丢人。」', effect: 'admit', affection: 8 },
                { text: '「那你干脆封山散伙，何必拖着自己。」', effect: 'quit', affection: -4 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'share': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 15) : { ok: true };
                    if (!_py.ok) { aff = 4; msg = '账算到后半夜，你先趴在案上睡着了。醒来时身上盖着他的外袍，账本收好了，最上面那页多了一行他的字：外捐一笔——记两个人名下。（精力不足，那一夜你先撑不住了）'; break; }
                    aff = 11; msg = ('他握着笔的手停在半空，很久没落下去。再抬头时，那双总带笑的眼睛红了：「……分你一半。」他重复了一遍，忽然笑出声，笑得肩膀都在抖，「十年，头一回有人跟我抢这个。」他把账本挪到你面前，笔递过来，「那，从今晚这笔起。」') + '（精力-15）'; break; }
                case 'admit': aff = 8; msg = '他怔住，笑容一层层褪下去，露出底下那个疲惫的人：「……撑不住。」他对着账本，极轻地说了一遍，像试这三个字的分量。然后他抬起头，眼眶微红，却在笑：「说出来，居然天没塌。」'; break;
                // 真负选项：「散伙」二字等于判华山死刑，判他十年支撑无意义
                case 'quit': aff = -4; msg = '他脸上还挂着笑，手却慢慢把账本合上了：「散伙？」他的声音很轻很稳，稳得吓人，「师父把华山交到我手上的时候，比现在还薄。我都没散——你替我散？」那晚你被请出了账房。此后他见你依旧有笑有礼，只是华山的账，再没让你看过一眼。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'hs_event_008': {
        id: 'hs_event_008', npcId: HS_NPC_ID, title: '你可以不硬撑', icon: '🍶',
        desc: '一句话，把十年笑着的人钉在原地。',
        minAffection: 62, trigger: { random: 0.3 }, cooldown: 0, flag: 'hs_e008_done',
        autoTrigger: { timeRange: [21, 3], location: '华山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '又是雨夜。剑堂点了一盏灯，他照旧坐在堂中听雨——这回桌上摆着两只杯，一壶温酒，像等了很久。', type: 'description' },
            { speaker: 'npc', text: '「坐。」他给你斟酒，笑得很松，「今夜不聊华山。就听雨。」' },
            { speaker: 'narrator', text: '雨声潺潺。他一杯接一杯，话比平日多，说的都是些陈年小事：师弟偷酒、香客求剑、师父罚他抄书——说着说着，声音慢下来。', type: 'description' },
            { speaker: 'npc', text: '「……你说，一个人笑十年，会不会忘了怎么哭。」他望着杯中的酒，像问你，又像问自己。' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「竺听雨。你可以不硬撑——在我这儿，不用。」', effect: 'tell', affection: 12 },
                { text: '不说话，把他的酒杯拿开，肩膀借他', effect: 'shoulder', affection: 9 },
                { text: '「华山还需要你笑。哭什么。」', effect: 'duty', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'tell': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 15) : { ok: true };
                    if (!_py.ok) { aff = 5; msg = '酒意混着雨声，你话说完就歪在了桌上。半梦半醒间，有人替你挡了穿堂的雨风，很轻地说了句什么——第二天他照旧笑着，只是看你的眼神不一样了。（精力不足，那一夜你先撑不住了）'; break; }
                    aff = 12; msg = ('他端杯的手停在半空。雨声忽然显得很响。他维持那个笑容维持了两息——然后它塌了，十年头一回塌得干干净净。他没哭，就是坐在那儿，肩膀松下来，整个人像卸了一座山。「……好。」很久，他说，声音哑得不像他，「那今夜，我不撑了。」那一夜剑堂的灯亮到天明，他说了十年的话，一夜说完。') + '（精力-15）'; break; }
                case 'shoulder': aff = 9; msg = '你拿开他的酒杯，把肩膀递过去。他愣愣看了你半晌，忽然低笑：「……这算什么礼数。」话这么说，头却真的靠了过来，很沉。雨下了一夜，两个人谁都没动。天亮时他直起身，眼睛里有血丝，也有光：「酒钱记账上。肩膀——也记。」'; break;
                case 'duty': aff = 5; msg = '他看了你一眼，把杯中酒一口饮尽，重新笑起来：「……说得对。」笑容端端正正，无懈可击。可你看着他把第二杯又满上，忽然明白——你把那扇门，亲手关回去了。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'hs_event_009': {
        id: 'hs_event_009', npcId: HS_NPC_ID, title: '思过崖之诺', icon: '🔗',
        desc: '石壁的最后一笔，他想让你在场。',
        minAffection: 68, trigger: { random: 0.3 }, cooldown: 0, flag: 'hs_e009_done',
        autoTrigger: { location: '华山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '他带你上思过崖。崖壁深处一面石壁，刻着十二道剑痕——每一道都深可及腕，新旧不一，最早的已生了苔。', type: 'description' },
            { speaker: 'npc', text: '「师父的绝笔。」他的手掌贴上第一道剑痕，「他临终前在壁上刻了『听雨』剑意的总诀，刻到第十二笔，没了力气。最后一笔，他留白了。」' },
            { speaker: 'npc', text: '「我续了十年。十二笔我参透了十一笔，可最后那笔——」他摇头，笑了笑，笑意里有你从没见过的挫，「师父留过一个字：那一笔叫『归』。一个人的剑意，刻不出『归』。」' },
            { speaker: 'npc', text: '「所以跟你讨个诺。」他转身看你，目光笔直，「刻完最后一笔那日，你在。——我想让『归』字落成时，崖上不止我一个人。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「我应你。那一日，我在。」', effect: 'promise', affection: 14 },
                { text: '「不止我在。你的剑也在——它等了十年了。」', effect: 'guard', affection: 9 },
                { text: '「……这种话，不该对人说吗？」', effect: 'press', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'promise': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 15) : { ok: true };
                    if (!_py.ok) { aff = 6; msg = '你们在崖前站到日暮，山风太硬，你先撑不住打了个晃。他一把扶住你，把自己外袍解下来裹你身上：「……诺先记着。人先送回去。」（精力不足，那一日你先撑不住了）'; break; }
                    aff = 14; msg = ('他看了你很久，忽然解下腰间那个旧酒葫芦，塞进你手里：「师父的酒葫芦。在我腰上挂了十年——挂它，是怕忘了托付。」他掌心按在葫芦上，连着你的手一起握了一下，「你拿着。等最后一笔落成那天，我们用它装第一壶新酒。」') + '（精力-15）'; break; }
                case 'guard': aff = 9; msg = '他一怔，回头看了看石壁上十二道剑痕，忽然笑了，笑得眼热：「……它等十年，我等十年。」他拔剑出鞘半寸，又推回去，「行。人、剑、诺——那日一起到齐。」'; break;
                case 'press': aff = 5; msg = '他别开眼，望着崖下云海：「……不该。」半晌，声音低下来，「可这十年，能说的话我全说给了华山。头一回，想说给一个人。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'hs_event_010': {
        id: 'hs_event_010', npcId: HS_NPC_ID, title: '风不平的考校', icon: '🐉',
        desc: '负气下山三十年的师叔祖回山了，考的是你。',
        minAffection: 72, trigger: { random: 0.3 }, cooldown: 0, flag: 'hs_e010_done',
        autoTrigger: { location: '华山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '山门来了个背着断剑的老者——风不平，华山老一辈的剑痴，当年因剑气之争负气下山，三十年不回。他站在山门前，谁也不看，只看你：「你就是围着听雨那小子转的人？让老夫瞧瞧，配不配站在华山大师兄身边。」', type: 'description' },
            { speaker: 'narrator', text: '话音落，一道苍老凌厉的剑风平地卷起，直压你面门——是考校，也是三十年积郁的下马威。你正要硬接，一道青影横身挡在身前。', type: 'description' },
            { speaker: 'npc', text: '竺听雨单掌接下那道剑风，脚下青砖寸裂，笑却还挂着：「师叔祖。此人，我担。」' },
            { speaker: 'npc', text: '风不平眯眼：「哦？你担？」断剑出鞘三寸，「华山如今就剩你一根柱子——柱子上再挂个人，你担得起？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '对老者一礼：「担不担得起，前辈看完日子再断。」', effect: 'respect', affection: 8 },
                { text: '低声对听雨：「让开。这一考，我自己接。」', effect: 'stand', affection: 7 },
                { text: '什么也不说，上前与他并肩，同迎剑风', effect: 'side', affection: 11 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'respect': aff = 8; msg = '风不平盯着你看了半晌，断剑「锵」地归鞘：「……嘴皮子像他，骨头比他还硬。」老者拂袖进山门，走出两步丢下一句，「小子，华山交给你俩，老夫放心一半。」竺听雨在你旁边低笑：「他三十年没夸过人。你赚大了。」'; break;
                case 'stand': aff = 7; msg = '他侧头看你，笑容深了：「……接得住吗？」话这么问，脚下却真的让开半步。那道剑风扫过你时，他的手一直虚悬在你身侧三寸——你接住了考校，他接住了你。'; break;
                case 'side': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 15) : { ok: true };
                    if (!_py.ok) { aff = 4; msg = '剑风太烈，你被掀退好几步，眼前发黑。清醒过来时考校已散，风不平在山门内留下一句「柱子边上这根，还得再练」。（精力不足，那一场你先撑不住了）'; break; }
                    aff = 11; msg = ('你上前并肩，与他同迎那道剑风。青砖在两个人脚下一起裂开——风不平看着这一幕，忽然仰天大笑，笑声震得松针簌簌：「好！好一根双柱！」老者当晚留在华山，喝光了竺听雨藏的最后三坛酒，临睡前嘟囔了一句：「当年要有个人跟老夫并肩……华山何至于此。」') + '（精力-15）'; break; }
            }
            return { affection: aff, msg: msg };
        }
    },
    'hs_event_011': {
        id: 'hs_event_011', npcId: HS_NPC_ID, title: '风雨苍龙', icon: '🌩️',
        desc: '暴雨夜，苍龙岭栈道断了。',
        minAffection: 78, trigger: { random: 0.3 }, cooldown: 0, flag: 'hs_e011_done',
        autoTrigger: { location: '华山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '暴雨如注。后山两名小师妹采药被困在苍龙岭外段——话音未落，竺听雨已经冲进雨里。你追到岭上时，栈道塌了一半，绳索尽头，两个小师妹吊在崖壁，竺听雨趴在断口，双手死死拽着绳。', type: 'description' },
            { speaker: 'npc', text: '「绳撑得住！」他在暴雨里吼，声音却骗不了人——他的手臂在抖，十年旧伤那条胳膊，正一寸寸往下滑，「先拉小的！别管我——」' },
            { speaker: 'player_select', text: '你必须立刻做点什么。', options: [
                { text: '扑上去抓住绳子，把人连他一起往回拽', effect: 'hold', affection: 14 },
                { text: '大喊：「竺听雨！松一根手换口气——华山不能没有你，她们也不能！」', effect: 'shout', affection: 10 },
                { text: '把绳子绕上崖松，以身作桩，让他腾手', effect: 'anchor', affection: 11 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'hold': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 20) : { ok: true };
                    if (!_py.ok) { aff = 6; msg = '雨水灌得人睁不开眼，你拽到一半脱了力，最后那几步是他自己咬着牙倒手爬回来的——两个小师妹都上来了，他的手掌磨得血肉模糊。（精力不足，那一夜你先撑不住了）'; break; }
                    aff = 14; msg = ('你扑进泥水里抓住绳子，两个人四只手，一节一节往回拽。小师妹先上来，最后是他——他翻上崖口那一刻，暴雨里你听见他说了句什么，凑近才听清：「……你来了。」这个什么都自己扛的人，第一次把「你来了」三个字说得像救命。') + '（精力-20）'; break; }
                case 'shout': aff = 10; msg = '他在暴雨里怔了一瞬——随即换了手，倒出一只来扣住崖沿。三个人都上来了。他瘫在泥水里大笑，笑到咳嗽：「华山不能没有我？……头一回听人把我排在她俩前头。」他望向你，雨水顺着下巴淌，眼睛却亮得吓人。'; break;
                case 'anchor': aff = 11; msg = '你把绳子绕上崖松，拿整个身体的重量压住松根。手上力道一松，他腾出手，三下两下把人拽了上来。事后他检查了你被绳子勒出血痕的腰，一边上药一边骂：「……拿身子当桩，不要命了？」骂到一半自己停了，半晌，低声：「谢了。华山记你一笔大功——我记你一笔。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'hs_event_013': {
        id: 'hs_event_013', npcId: HS_NPC_ID, title: '终章·石壁最后一笔', icon: '💍',
        desc: '十年续刻，只差最后那个「归」字。',
        minAffection: 85, trigger: { random: 1.0 }, cooldown: 0, flag: 'hs_e013_done',
        endingMap: { '携剑': 'hs_ending_携剑', '守崖': 'hs_ending_守崖', '松风': 'hs_ending_松风', '崖客': 'hs_ending_崖客', '断崖': 'hs_ending_断崖', '孤云': 'hs_ending_孤云' },
        scenes: [
            { speaker: 'narrator', text: '思过崖。石壁上十一道新剑痕排在那道最旧的绝笔之后——十年的功课，只差最后一笔。竺听雨把「听雨」剑横在你面前，剑身映着崖前的天光。', type: 'description' },
            { speaker: 'npc', text: '「参透了。」他笑得像个终于交课的弟子，「师父的最后一笔叫『归』。我想了十年——一个人的剑，出鞘是离，收鞘是别，怎么也刻不出『归』。」' },
            { speaker: 'npc', text: '「{playerName}。」他把剑推向你，连剑带十年的重量，「『归』字要两个人落笔。你执剑尾，我执剑首——华山的最后一笔，跟我一起刻。」' },
            { speaker: 'player_select', text: '你的选择将决定你们的关系走向', options: [
                { text: '「刻。刻完我带你和听雨下山——双剑走江湖，风雨由人，去处随心。」', effect: 'lover_travel', affection: 30 },
                { text: '「刻。但哪儿也不去。我留在华山，陪你守思过崖的每一场云海。」', effect: 'lover_stay', affection: 28 },
                { text: '「剑意我借。人就算了——我做你的论剑对手，年年云台峰见。」', effect: 'friend', affection: 20 },
                { text: '「剑意我借。崖庐给我留一坛酒——年年雨夜我来听雨，不谈风月，只谈剑与酒。」', effect: 'friend_stay', affection: 18 },
                { text: '「我都不要。我只是个路过的登山客。」', effect: 'none', affection: 0 }
            ]}
        ],
        effects: function(npc, choice) {
            // 三度伤透即寒心：辜负独立成结局「断崖」，与「孤云」（错过）分账
            var negCount = (window._negativeChoiceCount && window._negativeChoiceCount[HS_NPC_ID]) || 0;
            if (negCount >= 3 && (choice === 'lover_travel' || choice === 'lover_stay')) {
                return { affection: 0, msg: '他看着你，笑还挂在脸上，眼底却一寸寸静了：「……刻了十年，等的是这么一句。」他收剑转身，面对石壁，忽然挥剑——不是刻，是抹。十一道新痕，一道一道，被他亲手削平，石屑混着十年的汗落了一地。「走吧。华山的最后一笔，大师兄一个人刻。」那日起，思过崖的栈道封了。', ending: '断崖' };
            }
            switch (choice) {
                case 'lover_travel': return { affection: 30, msg: '他怔了半晌，忽然大笑，笑声撞在崖壁上嗡嗡作响：「好——下山！」两个人四只手同执一柄剑，最后一笔落进石壁，「归」字成，剑意圆。他把代掌门的印交还风不平，背剑与你并肩走下苍龙岭，「师父，最后一笔刻完了。这回，换我去听人间的雨。」', ending: '携剑' };
                case 'lover_stay': return { affection: 28, msg: '他握剑的手紧了紧，笑意一路漫到眼底：「……好。华山有你，才算真的续上了。」最后一笔落成，「归」字浑成。他把剑归鞘，把你拢进臂弯，望着崖前云海，「往后华山的账、剑、雨——都两个人分。」', ending: '守崖' };
                case 'friend': return { affection: 20, msg: '「对手？」他挑眉，笑出虎牙，「行——年年云台峰，谁输了谁请酒。」最后一笔他自己落的，刻完把剑一横，「第一坛，现在就开始算。」', ending: '松风' };
                case 'friend_stay': return { affection: 18, msg: '「留酒？」他愣了一下，笑得肩膀直抖，「华山别的不多，酒管够。」最后一笔落成后，崖庐的角落多了一坛封好的「千年醉」，坛身两个刻字：候客。', ending: '崖客' };
                case 'none': return { affection: 0, msg: '他沉默了很久，把剑一寸寸收回鞘中。「……也好。」笑容重新挂好，端端正正，「登山客看完云海就该下山了。华山的路，向来送客送到山门。」', ending: '孤云' };
            }
            return { affection: 0, msg: '' };
        }
    }
};

// ============ 竺听雨结局演出（6 个） ============
var HS_ENDINGS = {
    'hs_ending_携剑': {
        id: 'hs_ending_携剑', npcId: HS_NPC_ID, title: '结局·携剑', icon: '⚔️',
        route: '携剑',
        scenes: [
            { speaker: 'narrator', text: '三日后，竺听雨把代掌门的印信捧到风不平面前。老者掂着印看了半晌：「柱子拔了，华山塌不塌？」他指了指身后并肩立着的两个人：「塌不了。柱子成双了。」风不平哼了一声，接了印，转身时把那个旧酒葫芦抛还给他——「你师父的葫芦。带着，别辱没它。」', type: 'description' },
            { speaker: 'npc', text: '「华山托付给您了。」他把葫芦挂回腰间，背剑与你并肩下山，「我自个儿——往后归你管。」' },
            { speaker: 'narrator', text: '多年后，江湖有「听雨双剑」的传说：一柄是断剑重铸的旧剑，一柄是与之并肩的新剑。哪里的账不平、哪里的雨太大，哪里就有他们。', type: 'description' },
            { speaker: 'narrator', text: '有人见过他们在雨夜的客栈歇脚。他难得没笑也没撑，靠在{playerTa}肩上睡着了——檐外雨声潺潺，他睡得极沉。那夜的雨，终于不用一个人听了。', type: 'description' }
        ],
        finalText: '——— 结局·携剑（道侣·同行）———'
    },
    'hs_ending_守崖': {
        id: 'hs_ending_守崖', npcId: HS_NPC_ID, title: '结局·守崖', icon: '🏡',
        route: '守崖',
        scenes: [
            { speaker: 'narrator', text: '你留在了华山。思过崖的崖庐，从此住着两个人——栈道重修那日，他把它修宽了一尺，说：「宽些，两个人并排走。」', type: 'description' },
            { speaker: 'narrator', text: '华山的账还是他算，只是灯下多了一个对账的人；雨夜他照旧听雨，只是身边温着两杯酒。', type: 'description' },
            { speaker: 'npc', text: '「今年冬衣的账，平了。」他合上账本，转头看你，笑得眼睛发亮，「……十年，头一回，平账的时候身边有人。」' },
            { speaker: 'narrator', text: '风不平偶尔路过崖庐，看见一个算账、一个添灯，嘀咕一句「俗」，走了。但走时步子慢了些，葫芦里的酒也留下了。', type: 'description' },
            { speaker: 'narrator', text: '石壁上那个「归」字，日日映着华山的云海。归处不在远方——归处就是崖上这两盏灯。', type: 'description' }
        ],
        finalText: '——— 结局·守崖（道侣·归隐）———'
    },
    'hs_ending_松风': {
        id: 'hs_ending_松风', npcId: HS_NPC_ID, title: '结局·松风', icon: '🌲',
        route: '松风',
        scenes: [
            { speaker: 'narrator', text: '你们成了江湖闻名的论剑对手。年年云台峰之约，胜负各半——输的请酒，赢的陪喝，反正酒都是他腰上那只葫芦里倒出来的。', type: 'description' },
            { speaker: 'npc', text: '「今年你快了半招。」他收剑，把葫芦抛过来，「……再松几年，你就能赢我一整坛了。」' },
            { speaker: 'narrator', text: '有人问你们是什么关系。他答「对手」，{playerTa}答「对手」。说完两人对视，都先笑了——松风过岭，满山都是他们的笑声。', type: 'description' }
        ],
        finalText: '——— 结局·松风（挚友·同行）———'
    },
    'hs_ending_崖客': {
        id: 'hs_ending_崖客', npcId: HS_NPC_ID, title: '结局·崖客', icon: '🍶',
        route: '崖客',
        scenes: [
            { speaker: 'narrator', text: '{playerTa}成了思过崖崖庐的常客。角落里那坛「千年醉」封了又开、开了又封——坛身「候客」两个字，被他描过三遍。', type: 'description' },
            { speaker: 'narrator', text: '每逢雨夜，崖庐必点两盏灯。他听雨，{playerTa}温酒；雨停之前，谁也不谈华山的事。', type: 'description' },
            { speaker: 'npc', text: '「今年的雨，比去年密。」他给两只杯都满上，把大的那只推过来，「……剑的事明天再谈。今夜，只谈酒。」' },
            { speaker: 'narrator', text: '小师弟有回问{playerTa}：「你算大师兄什么？」{playerTa}想了想：「崖客。」小师弟挠头不懂，只有帐房先生听见了，笑着摇头，把「外捐」那页翻了过去——那页账上，如今记着两个名字。', type: 'description' }
        ],
        finalText: '——— 结局·崖客（挚友·归隐）———'
    },
    'hs_ending_断崖': {
        id: 'hs_ending_断崖', npcId: HS_NPC_ID, title: '结局·断崖', icon: '💔',
        route: '断崖',
        scenes: [
            { speaker: 'narrator', text: '十一道剑痕被他亲手削平。石壁重归空白，只剩最上头师父那道绝笔——孤零零的，像一句没等来回音的话。', type: 'description' },
            { speaker: 'narrator', text: '第二日，思过崖栈道封了。封条是他亲手贴的，落款没有名字，只有一枚酒葫芦的印。', type: 'description' },
            { speaker: 'narrator', text: '华山大师兄照旧事事担待、夜夜听雨，笑照旧挂着——只是满山的人都发现，大师兄的笑，再没到过眼底。', type: 'description' },
            { speaker: 'narrator', text: '风不平上崖看过一次那面石壁，下来后把自己关在房里喝了一夜。第二天他对弟子说：「『归』字那一笔，他这辈子刻不成了。不是没力气——是没处归了。」', type: 'description' }
        ],
        finalText: '——— 结局·断崖（辜负）———'
    },
    'hs_ending_孤云': {
        id: 'hs_ending_孤云', npcId: HS_NPC_ID, title: '结局·孤云', icon: '☁️',
        route: '孤云',
        scenes: [
            { speaker: 'narrator', text: '后来你还是上过几次华山。崖庐开着，他对你客气周到，笑得分毫不差，像对每一位远来的客。', type: 'description' },
            { speaker: 'narrator', text: '思过崖石壁上，师父的绝笔之后永远空着最后一笔——满华山都说，大师兄的剑意差一步圆满，差在哪，没人知道。', type: 'description' },
            { speaker: 'narrator', text: '再后来，江湖偶有传闻——华山代掌门剑法愈发精深，华山的账愈发齐整，只是再没人见他，为谁温过雨夜里的那第二杯酒。', type: 'description' }
        ],
        finalText: '——— 结局·孤云（错过）———'
    }
};

// ============ 性别语境事件（femctx 女玩家 / mctx 男玩家，互斥） ============
var HS_GENDER_CTX_EVENTS = {
    // 女玩家：剑堂老仆的眼光
    'hs_event_femctx': {
        id: 'hs_event_femctx', npcId: HS_NPC_ID, title: '剑堂老仆的话', icon: '🏮',
        desc: '看了一辈子剑堂的老仆把你叫住了。',
        minAffection: 55, trigger: { random: 0.35 }, cooldown: 0, flag: 'hs_e_femctx_done',
        requirePlayerFemale: true,
        autoTrigger: { location: '华山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '剑堂的老仆给你添茶，添着添着，忽然开口。他在剑堂扫了四十年地，看着竺听雨从八岁扫到二十八。', type: 'description' },
            { speaker: 'npc', text: '「姑娘。」老仆压低声音，「大师兄这个人，什么都往身上揽——华山的账、师弟的冬衣、他师父的名声。老朽就怕……」' },
            { speaker: 'npc', text: '「就怕有一天，他把你，也当成一样要扛的『华山』。他对你好得滴水不漏，那好啊，是担待，不是过日子。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「他扛华山，我拆他的担子——一样一样拆。」', effect: 'undo', affection: 8 },
                { text: '「老丈，我自愿的。担子重，我搭手。」', effect: 'accept', affection: 7 },
                { text: '「您是怕我受委屈，还是怕他累死？」', effect: 'probe', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'undo': aff = 8; msg = '老仆愣了愣，布满皱纹的脸笑开了：「……拆担子。」他给你续满茶，「好姑娘。他那担子，老朽看了四十年，没人敢拆——你拆。拆下来的每一样，老朽替你收着。」'; break;
                case 'accept': aff = 7; msg = '老仆叹气，又点头：「自愿的……好。」他把茶壶往你手边推了推，「雨夜剑堂的灯，往后给你留半盏。搭手的人，得先喝口热的。」'; break;
                case 'probe': aff = 6; msg = '老仆擦杯子的手停了：「……两样都怕。」他望着剑堂正梁，「他八岁进山门，笑到二十八。老朽就盼着，有个人能让他哪天哭一场——哭完，人就松了。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // 男玩家：两个男修并肩执剑，江湖的眼光
    'hs_event_mctx': {
        id: 'hs_event_mctx', npcId: HS_NPC_ID, title: '云台流言', icon: '🌫️',
        desc: '旧日剑盟的故人把你拦下了。',
        minAffection: 55, trigger: { random: 0.35 }, cooldown: 0, flag: 'hs_e_mctx_done',
        requirePlayerMale: true,
        autoTrigger: { location: '华山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '云台峰下，一位旧日剑盟的故人拦住你，左右看了看，压低声。', type: 'description' },
            { speaker: 'npc', text: '「贤弟。」故人盯着你，「你跟华山大师兄……一个屋檐下听雨、一面石壁上刻剑，江湖上都传遍了。」' },
            { speaker: 'npc', text: '「我不是说这不好。我是说，华山如今就剩他一根柱子，多少双眼睛等着看这根柱子倒——你受得住那些嘴，他受得住吗？他那个人，天塌下来先笑一笑再自己顶。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「嘴归嘴。他顶他的天，我拆我的谣。」', effect: 'defy', affection: 8 },
                { text: '「故人，我们还没到那一步。」', effect: 'deny', affection: 3 },
                { text: '「他要是被谣言压弯了，我先替他把天顶回去。」', effect: 'shield', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'defy': aff = 8; msg = '故人盯着你看了半晌，忽然抱拳：「……行。这话够硬。」他让开路，「剑盟里那几个碎嘴的，我去递话——华山的柱子边上添了根新的，谁嘴痒，先问剑。」'; break;
                case 'deny': aff = 3; msg = '故人意味深长地「哦」了一声：「没到那一步。」他背着手走了，走出几步回头，「那雨夜剑堂的第二只杯，是谁放的？贤弟，华山的人都看得见，就你们俩装看不见。」'; break;
                case 'shield': aff = 7; msg = '故人笑了：「你倒护他。」他想了想，拍拍你的肩，「他那人，护了华山十年，头一回有人抢着护他——这比什么辟谣都管用。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    }
};

// ============ 合并进总事件池 ============
if (typeof NPC_PERSONAL_EVENTS !== 'undefined') {
    Object.assign(NPC_PERSONAL_EVENTS, HS_MAIN_EVENTS);
    Object.assign(NPC_PERSONAL_EVENTS, HS_GENDER_CTX_EVENTS);
}

// ============ 注册结局集与副作用回调 ============
if (typeof registerEndingSet === 'function') {
    registerEndingSet(HS_NPC_ID, HS_ENDINGS);
}
if (typeof registerEndingCallback === 'function') {
    registerEndingCallback(HS_NPC_ID, function(endingName, npc) {
        if (endingName === '携剑' || endingName === '守崖') {
            if (npc && typeof npc.setFlag === 'function') npc.setFlag('dao_companion');
            if (window.showMessage) window.showMessage('🌧️ 你与竺听雨结为道侣！华山剑意感悟大幅提升', 'success');
        } else if (endingName === '松风' || endingName === '崖客') {
            if (npc && npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 30);
            if (window.showMessage) window.showMessage('🌧️ 你与竺听雨成了彼此最信得过的论剑知己', 'success');
        } else if (endingName === '断崖') {
            if (window.showMessage) window.showMessage('💔 竺听雨削平了石壁上的十一道剑痕。「归」字那一笔，他这辈子再没刻过', 'error');
        }
    });
}

// ============ 自动触发 + 每日钩子（复用 maybeAutoTriggerPersonalEvent） ============
function maybeAutoTriggerHsEvent(source) {
    return maybeAutoTriggerPersonalEvent(HS_NPC_ID, source, { finalEvents: ['hs_event_013'] });
}

if (typeof window !== 'undefined' && window.timeSystem && window.timeSystem.onNewDaySubscribe) {
    window.timeSystem.onNewDaySubscribe(function() {
        try {
            if (window.currentCharData && window.currentCharData.location === '华山派') {
                maybeAutoTriggerHsEvent('daily');
            }
            // 性别语境：每日在该派过夜 + 对应性别 + 好感≥55 + 未触发
            if (!window.currentCharData || !window.npcManager) return;
            var loc = window.currentCharData.location || '';
            if (loc !== '华山派') return;
            var npc = window.npcManager.getNPC ? window.npcManager.getNPC(HS_NPC_ID) : null;
            if (!npc) return;
            var aff = (npc.relationship && npc.relationship.affection) || 0;
            if (aff < 55) return;
            var isF = window.currentCharData.gender === 'female';
            var ctxId = isF ? 'hs_event_femctx' : 'hs_event_mctx';
            if (typeof hasEventTriggered === 'function' && hasEventTriggered(ctxId)) return;
            var ev = NPC_PERSONAL_EVENTS[ctxId];
            if (!ev) return;
            if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npc)) return;
            setTimeout(function() {
                if (document.querySelector && document.querySelector('.personal-event-modal')) return;
                if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npc)) return;
                if (typeof triggerPersonalEvent === 'function') triggerPersonalEvent(ctxId);
            }, 1200);
        } catch (e) { console.warn('[竺听雨线] 每日触发失败:', e); }
    });
}

// ============ 导出 ============
if (typeof window !== 'undefined') {
    window.HS_MAIN_EVENTS = HS_MAIN_EVENTS;
    window.HS_ENDINGS = HS_ENDINGS;
    window.maybeAutoTriggerHsEvent = maybeAutoTriggerHsEvent;
}

// 扩展男主名册（v20.73：竺听雨入册，吃醋对峙/和好/论交/道侣回访四桩接线于 male-lead-*.js）
if (typeof window !== 'undefined' && window.MALE_LEAD_ROSTER && window.MALE_LEAD_ROSTER.push) {
    window.MALE_LEAD_ROSTER.push({ id: HS_NPC_ID, name: '竺听雨', sect: '华山派', eventId: 'hs_event_rival', reconcileId: 'hs_event_reconcile', femctxId: 'hs_event_femctx', mctxId: 'hs_event_mctx' });
}
console.log('[竺听雨线] 华山派感情线加载完成：结局 ' + Object.keys(HS_ENDINGS).length + ' 个 + 主线事件 ' + Object.keys(HS_MAIN_EVENTS).length + ' 个 + 性别语境 ' + Object.keys(HS_GENDER_CTX_EVENTS).length + ' 个');
