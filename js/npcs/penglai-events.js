// ==================== penglai-events.js - 瀛晚照线情缘事件/结局/性别语境 v1.0（蓬莱扩线） ====================
// 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / registerEndingSet / registerEndingCallback /
//       hasEventTriggered / checkEventTrigger / triggerPersonalEvent / canPlayerAccessPersonalEvent）
//       npcs/npc-system.js（executeEmotionInteraction 已加 bond_dao 拦截）
// 加载顺序：在 npc-personal-events.js 之后
// 女主·瀛晚照（蓬莱派观汐台执录、白眉真人座下亲传。说话像潮信——极准，几时几刻几分，从不用形容词；
// 唯独讲起蜃楼，话会多）。蓬莱是海外仙岛：海市蜃楼、环岛潮汐阵、二十年的潮信图录（掌门曾夸「有几分意思」）。
// 心口的事：她母亲（前任观汐执录）二十年前的一个傍晚出海追蜃楼，没回来。晚照每日黄昏录海市，
// 是因为蜃楼里「有过那个影子」——她不说「找娘」，她说「录全」。
// 随身物：母亲的旧螺（贴耳能听见潮）、潮信图录。性格：静、执拗、把疼记成数目。信物是旧螺。
// 男女玩家皆可追，主线共享（代词按性别），各有专属性别语境事件（femctx/mctx）。

var PL_NPC_ID = 'sect_leader_蓬莱派';

// ============ 主线事件（pl_event_001 ~ 011 + 终章 013） ============
var PL_MAIN_EVENTS = {
    'pl_event_001': {
        id: 'pl_event_001', npcId: PL_NPC_ID, title: '潮信', icon: '🌊',
        desc: '观汐台的执录，头也不抬报出你进山门的时辰。',
        minAffection: 12, trigger: { random: 0.4 }, cooldown: 0, flag: 'pl_e001_done',
        autoTrigger: { location: '蓬莱派', random: 0.45 },
        scenes: [
            { speaker: 'narrator', text: '你初上蓬莱，被引去观汐台。台踞岛角，三面临海，栏杆上刻着一排水痕线。黄昏将尽，一名青衣女弟子立在台前录潮，笔尖不停，从头到尾没有抬头。', type: 'description' },
            { speaker: 'npc', text: '「未时三刻，你进的山门。」她的声音很平，平得像在念录，「潮信不许错。人，也不许。」' },
            { speaker: 'narrator', text: '录完这一笔晚潮，她才抬眼看你。目光干净，也极稳，像没有风的海面。「瀛晚照，观汐台执录。新来的，报上来意。」', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '安静立在栏边，等她录完这一笔潮再开口', effect: 'wait', affection: 8 },
                { text: '如实报上进门的时辰，请她核对录册', effect: 'verify', affection: 7 },
                { text: '笑一声：「连我进山门的时辰，师姐也记？」', effect: 'jest', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'wait': aff = 8; msg = '你在栏边站定，不说话。潮涨一线，她录一笔；天黑透，她合上册子，这才转身正眼看你：「等得起。观汐台等得起潮的人，潮信也不误他。」她重新翻开录册，把你的名字报进去，一笔一笔，写得很工整——观汐台认人，就认这一站。'; break;
                case 'verify': aff = 7; msg = '你报上时辰——未时三刻。她低头对录，指尖在那一行上停住，又抬起：「不错。」她眼里第一次有了一点极淡的波动，「时辰不差的人，二十年里，你是第二个。」你问第一个是谁。她合上录册，没有答，可那本册子，她抱得比方才紧了些。'; break;
                case 'jest': aff = 5; msg = '她不笑，也不恼，只把录册翻过半页，指尖点着：「三月初三，辰时，山门。三月初五，巳时，后山。三月初七——」她合上册子，「潮信不许错，人也不许。说笑的人，我也照实记。」话是冷的，可你那一页，她记得很细，连你笑了几回都在角上点了点。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'pl_event_002': {
        id: 'pl_event_002', npcId: PL_NPC_ID, title: '海市', icon: '🏯',
        desc: '海面浮起亭台楼阁的倒影，她盯着蜃楼太久。',
        minAffection: 18, trigger: { random: 0.35 }, cooldown: 0, flag: 'pl_e002_done',
        autoTrigger: { location: '蓬莱派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '这日黄昏，海面忽然静得像镜。波涛之上，缓缓浮起一座飞檐翘角的亭台——栏影、楼身、阶前一线白石，历历在目，像谁把海那头的城搬了过来。转瞬，又散了。', type: 'description' },
            { speaker: 'npc', text: '瀛晚照盯着那座蜃楼。笔尖悬在图录上方，悬着，没有落。她盯得太久了——久过任何一次海市该看的时辰。', type: 'description' },
            { speaker: 'narrator', text: '蜃楼散尽，她才落笔，只记了四个字：「三月初三，楼见。」你看见她执笔的手，袖口微微收紧。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '也朝海市望去，把你看见的细节一一说与她听', effect: 'record', affection: 8 },
                { text: '轻声问：「方才那座楼里——你看见了什么？」', effect: 'ask', affection: 6 },
                { text: '笑一声：「假的东西，转瞬就散，也值得记？」', effect: 'mock', affection: -4 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'record': aff = 8; msg = '你立在台边，把飞檐的走向、栏杆的层数、楼影的方位，一样一样说给她听。她听着，忽然转头看你：「你也看见了。」她低头补录，笔尖在页尾添了一行小注——二十年的图录，蜃楼向来只记四个字，注，是头一回有。注的是：「楼见，有同见者一人。」'; break;
                case 'ask': aff = 6; msg = '她的笔停住了。很久，才说：「炊烟。」声音很轻，「楼腰上，有一缕炊烟。」说完她就合上了图录，像把一句多说的话也一并合了进去。可第二天黄昏，观汐台的台角，给你留出了一块站的地方——不宽，正好一个人。'; break;
                // 真负选项：录海市是她二十年的执念，蜃楼里「有过那个影子」，笑它假等于笑她半生
                case 'mock': aff = -4; msg = '她执笔的手没有停，只是指节一寸一寸收紧，笔尖划破了纸。「假？」她声音平得没有一丝波澜，「潮也是水做的，月也是远的。你说它们假么。」她合上图录，背对着你立定，「看不懂的东西，下台去。」那晚的潮，她一个人录的。你后来才知道：二十年图录里，那一页的墨最重，透了三层纸。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'pl_event_003': {
        id: 'pl_event_003', npcId: PL_NPC_ID, title: '旧螺', icon: '🐚',
        desc: '她腰间那只磨得发亮的旧螺。',
        minAffection: 25, trigger: { random: 0.35 }, cooldown: 0, flag: 'pl_e003_done',
        autoTrigger: { location: '蓬莱派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '你注意到她腰间挂着一只旧螺。螺身磨得发亮，螺口有一道细裂，用银线细细锔过。观汐台上下没人碰它——弟子们说，那是执录的娘留下的。', type: 'description' },
            { speaker: 'npc', text: '这日录潮，螺从她衣侧滑出来，在风里轻轻晃。她察觉了你的目光，按着图录的手，停了半息。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '不碰，只问：「那只螺——贴耳能听见什么？」', effect: 'ask', affection: 7 },
                { text: '什么也不问，陪她把这一笔潮录完', effect: 'stay', affection: 6 },
                { text: '伸手就要去拿：「给我看看，什么宝贝。」', effect: 'grab', affection: -5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'ask': aff = 7; msg = '她看了你三息。然后解下那只旧螺——第一次，把它放进你的掌心。「贴耳。」你贴上去：潮声涌进来，一层一层，潮声里像有人喊了一声名字，就一声，听不真。你抬头，她望着海面：「听不真。我听了二十年，也没听真。」她收回螺，指腹摩挲过那道银线的裂，很轻，「可每天黄昏，我还是听一回。」'; break;
                case 'stay': aff = 6; msg = '你没问。潮起潮落，她录她的，你看你的海。天黑透时她收册，忽然说：「这只螺，是我娘留下的。」就这一句，没有下文——可从这天起，你在观汐台录潮，她不再避你，那只旧螺晃出来时，也不再急着按回去。'; break;
                // 真负选项：旧螺是她娘留在人间的最后一样东西，伸手去夺等于掀她的命门
                case 'grab': aff = -5; msg = '你的手伸到一半，她的腕先扣过来了——录潮从不急的人，这一动比潮还快。「别碰。」她把旧螺按回衣内，声音还是平的，指尖却在袖中微微发抖，「它不是给人看的东西。」这一笔潮她录得极早。之后一个月，她腰间的螺，收在衣内，再没露出来过——你很久以后才明白，她怕的不是你碰，是你碰了之后，随手还回来。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'pl_event_004': {
        id: 'pl_event_004', npcId: PL_NPC_ID, title: '潮阵之夜', icon: '🌙',
        desc: '环岛潮汐阵的阵眼被海草缠死了。',
        minAffection: 32, trigger: { random: 0.3 }, cooldown: 0, flag: 'pl_e004_done',
        autoTrigger: { timeRange: [21, 3], location: '蓬莱派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '夜里，礁区方向钟声告急——环岛潮汐阵的阵眼被海草缠死了，潮力走不动，浪头一下一下砸在岛岸上。这是「潮信失调」的险情：阵眼若不在三更前疏通，整阵都要倒灌。', type: 'description' },
            { speaker: 'npc', text: '瀛晚照已经在礁区了。外袍卸了，手里一柄阵钩，报数目给围着的弟子，一个字不多：「阵眼在水下三丈。海草缠了枢石七层。我下去。岸上盯潮线，报给我。」', type: 'description' },
            { speaker: 'narrator', text: '她涉水已到腰。夜潮凉，海草滑，水下三丈——一个人，不够。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '跟她一起潜下去，你割上层，她清枢石', effect: 'dive', affection: 8 },
                { text: '立在礁上执阵灯，替她报潮线、递工具', effect: 'lamp', affection: 7 },
                { text: '「一把海草罢了，潮头一来自己就冲开了，何必拼命。」', effect: 'shrug', affection: -3 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'dive': aff = 8; msg = '夜水凉得像刀。你上她下，一层一层地割——第七层海草挑开时，潮力「轰」地一声走通，满阵的灯影齐齐一亮。上岸时她喘着，先报数目：「三更差一刻，阵通。潮信，无误。」报完转头看你，发梢还在滴水：「你闭气，比守潮的师兄弟长。」顿了顿，又添了两个字，「……多谢。」——从执录嘴里，这两个字比潮信还稀罕。'; break;
                case 'lamp': aff = 7; msg = '你执灯、报潮：「潮上一线！」「回流！」她在水下声声应着。阵通时她攀上礁石，先看你的灯——灯一夜没歪。「灯稳。」她拧着衣角的水，「观汐台的灯，稳比亮值钱。」当夜的守阵名录上，她的名字旁边多了一个名字。执笔的师弟说，执录写你名字的那一笔，比写潮信还工整。'; break;
                // 真负选项：她把潮阵看得比命重，「何必拼命」戳的正是她娘当年出海时岸上说的那句话
                case 'shrug': aff = -3; msg = '她回过头，在灯影里看了你一眼。那一眼比夜潮还凉。「潮，不等人。」她说完这四个字，转身扎进水里。阵是她一个人在三更前疏通的，上岸时腿在抖，扶着礁石才站住，没有看你。你后来才听守阵的老师弟说：那年执录的娘出海，岸上也有人讲过这句话——「何必拼命」。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'pl_event_005': {
        id: 'pl_event_005', npcId: PL_NPC_ID, title: '图录', icon: '📖',
        desc: '她给你看二十年的海市图录。',
        minAffection: 40, trigger: { random: 0.3 }, cooldown: 0, flag: 'pl_e005_done',
        autoTrigger: { location: '蓬莱派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '雨后，她把你叫进观汐台的侧屋。架上一摞一摞的册子码得极齐——二十年的潮信图录，一年一册，脊背上的字从大到小，从稚到稳。她抽出最旧的一册，在你面前翻开。', type: 'description' },
            { speaker: 'npc', text: '「每一座蜃楼，我都摹了下来。」她一页一页翻过去——飞檐、栏影、楼身，连炊烟那一缕的走向，都一笔一笔描着，「二十年，一百三十七次海市。」她报数目的声音里，有一点难得的暖，「掌门说，这部图录，有几分意思。」', type: 'description' },
            { speaker: 'narrator', text: '图录的第一页笔迹最旧：蜃楼深处一个极小的人影，模糊得几乎看不清。那一页的页角，被摩挲得发亮。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「图录上这处礁区，我替你出海查探。」', effect: 'reef', affection: 7, item: 'spirit_stone' },
                { text: '铺纸研墨，陪她摹一页蜃楼', effect: 'copy', affection: 8 },
                { text: '「这部图录——你想录到什么为止？」', effect: 'ask', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '', item = null;
            switch (choice) {
                case 'reef': aff = 7; item = { id: 'spirit_stone', count: 2 }; msg = '她报出礁区的方位、水深、潮时，一字不多。你出海两日，回来时一身盐花，怀里揣着两块从礁缝里凿下的灵石。她接过去对灯翻看：「成色，与图录上那次楼底的石色一致。」她把灵石收进图录匣最里层，提笔记了一笔：「礁区已验，石二枚，出外客之手。」——「外客」两个字，她描了描，描得很轻。'; break;
                case 'copy': aff = 8; msg = '你铺纸，她教你摹法——先飞檐，后栏影，楼身要留白，「留白也是录，海上的东西，看不全的要老老实实看不全」。两人伏案摹到灯芯烧尽。她吹了灯，黑地里忽然说：「二十年，摹图录的，只有我一双手。」第二天，那一页新摹的楼影被订进了图录，页脚并排两个名字，一个小，一个更小。'; break;
                case 'ask': aff = 6; msg = '她翻页的手停在第一页——那个模糊的小人影上。「录全。」她说，「每一座楼都录全。录全了——」她没有说下去，合上了册子。可那册图录没有归架，搁在了案头。往后每天黄昏你来观汐台，它都摊在案上，翻着新的一页，像在等谁一起看。'; break;
            }
            return { affection: aff, msg: msg, item: item };
        }
    },
    'pl_event_006': {
        id: 'pl_event_006', npcId: PL_NPC_ID, title: '出海的人', icon: '🕯️',
        desc: '她讲起二十年前那个傍晚。',
        minAffection: 45, trigger: { random: 0.3 }, cooldown: 0, flag: 'pl_e006_done',
        autoTrigger: { location: '蓬莱派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '黄昏，潮平。她坐在观汐台最外沿，手里攥着那只旧螺。今天她没有录潮——她说话，说得比这半年加起来都多。', type: 'description' },
            { speaker: 'npc', text: '「我娘是前任观汐执录。」她望着海面，声音很平，平得像背过很多遍，「二十年前，三月初六，酉时，海上起了一座蜃楼——二十年来最大的一座。楼里，有炊烟。」' },
            { speaker: 'npc', text: '「娘说，楼里有人做饭，就不是假的。」她把旧螺在掌心里转了半圈，「她带了船出去。走前跟我说：亥时潮回，她就回。」亥时，潮回了。船没有回。' },
            { speaker: 'npc', text: '「图录上记：三月初六，楼见，出海一人，未归。」她收起旧螺，「十二个字。我娘的二十年，在册子上，是十二个字。」' },
            { speaker: 'player_select', text: '你如何回应？（这一桩，没有对错，只有听法）', options: [
                { text: '「往后的图录，我陪你录。录到楼全，录到那个影子看清为止。」', effect: 'vow', affection: 9 },
                { text: '什么都不说，陪她在台沿坐到潮彻底平', effect: 'stay', affection: 8 },
                { text: '「楼里有人做饭，就不是假的——那图录上的影子，也不是假的。」', effect: 'echo', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'vow': aff = 9; msg = '她转头看你。暮色落在她脸上，眼里有潮一样的光。「陪我录……」她重复了一遍，很轻，像怕惊动什么。然后她把旧螺举到眼前，对着最后一线天光看了很久，「娘的十二个字，我守了二十年。」她把螺收好，「你要录——好。从明天起，图录上，添第二个名字。」'; break;
                case 'stay': aff = 8; msg = '你没说话。潮一寸一寸地平下去，天一寸一寸地黑透，她手里的旧螺转了一圈又一圈。潮平尽时她起身，理了理衣上的海风，忽然说：「娘出海那晚，我也坐在这里。一个人坐的。」她看了你一眼，「今天坐着，是两个人。不一样。」她没有说不一样在哪里，可当晚观汐台的录册上，那一笔潮，写得比哪一天都缓。'; break;
                case 'echo': aff = 7; msg = '她浑身轻轻一震，像海面落了一滴雨。「不是假的……」她盯着你，看了很久，眼眶慢慢红了，声音却还是平的，「二十年，满岛的人都劝我，楼是假的。掌门说假的，师叔们说假的——」她深吸了一口气，「你是头一个，说不是假的。」她转向大海，「这句话，我要入录。」当晚的图录上多了一行小注，墨迹很新：「楼中影，非假。有言者一人。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'pl_event_007': {
        id: 'pl_event_007', npcId: PL_NPC_ID, title: '春潮守阵', icon: '🌀',
        desc: '春潮大汛，潮阵将崩，她一个人压阵眼。',
        minAffection: 55, trigger: { random: 0.3 }, cooldown: 0, flag: 'pl_e007_done',
        autoTrigger: { location: '蓬莱派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '二月十八，春潮大汛。蓬莱环岛潮汐阵的水位比往年高了三线，阵枢在水下发出不祥的闷响，满阵灯影一齐摇晃——阵，要崩了。岸上弟子奔走，有人喊去请掌门，有人喊弃阵保岛。', type: 'description' },
            { speaker: 'npc', text: '瀛晚照立在阵眼礁区，短打已束好，阵钩负在背后。「阵枢偏了三寸。压不回去，潮力倒灌，全岛的岸都要撕开。」她报数目，一字不多，「水下三丈，潮头一息两涌。我下去压枢——岸上，替我盯潮线。」', type: 'description' },
            { speaker: 'narrator', text: '弟子们面面相觑。春潮的力道，三丈的水，压枢的人会被潮头一下一下砸在海底。她已经涉水而去了，背影很直。', type: 'description' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '跟着潜下去，用身子替她扛住阵枢', effect: 'brace', affection: 11 },
                { text: '立在阵眼口的潮线石上，替她一声一声报潮', effect: 'watch', affection: 8 },
                { text: '喊聚门中弟子，扛来阵桩缆索，众人合力守阵', effect: 'rally', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'brace': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 11) : { ok: true };
                    if (!_py.ok) { aff = 4; msg = '你要往下扎，眼前却先黑了一黑——连日守潮，你的气力早掏空了。她在水中反手把你推回礁上，眉头拧死：「守一潮先倒一个，你学的谁的？」她自己扎了下去，一炷香后浮上来报数：「枢，压住了。你回。」话说得冷，下水前却把阵钩塞进了你手里——钩柄上，有她掌心的温度。（精力不足，那一潜你先撑不住了）'; break; }
                    aff = 11; msg = ('春潮的力道像一座山压下来。你们两人摸到枢石，她挂钩，你扛枢——潮头第一涌把你们掀起半丈，第二涌震得耳底流血，第三涌落下时，枢石「咔」的一声，归位了。上岸，两人齐齐瘫在礁上，满岛的灯影都稳了。她喘着，还先报数：「二月十八，辰时三刻，阵枢归位。潮信——无误。」报完转头看你，忽然笑了，笑纹里全是水光：「三涌。你都扛住了。」') + '（精力-11）'; break; }
                case 'watch': aff = 8; msg = '你立在潮线石上，一潮一报：「潮上！」「潮头！」「回落！」她在水下声声应着。阵枢归位时她浮上来，唇色青紫，先问：「潮头，第几线？」你答：第五线，两息。她点头：「不错。」顿了顿，看你，「岸上报潮不报错的人，二十年，你是头一个。潮信不许错——你也不许。」'; break;
                case 'rally': aff = 7; msg = '你喊聚了八名师弟，扛来阵桩，缆索连成一线——岸上八个人一齐绞桩，她在水下压枢。阵通时众人瘫在岸上，她第一个起身，取出图录记档：「二月十八，春潮，阵枢偏三寸，合力正之。」记完，在你的名字后头添了一行小注：「桩索之法，此人想的。」——观汐台的录，从不记人。这一夜，破例了。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'pl_event_008': {
        id: 'pl_event_008', npcId: PL_NPC_ID, title: '蜃楼里的人', icon: '🏮',
        desc: '拂晓前，海上起了近年最大的一次蜃楼。',
        minAffection: 62, trigger: { random: 0.3 }, cooldown: 0, flag: 'pl_e008_done',
        autoTrigger: { timeRange: [4, 6], location: '蓬莱派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '寅时未到，满海忽然死静。值夜的弟子刚要敲钟，钟声卡在了喉咙里——波涛之上浮起一座蜃楼，比二十年来任何一次都大：楼台、长街、石桥，连街心的石板纹路都看得见。长街尽头，有一个执灯的人影。', type: 'description' },
            { speaker: 'npc', text: '那影提着一盏灯，立在街口，像在等人。瀛晚照站在观汐台边缘，望着那个影子——笔从她手里掉下去，落在图录上，拖出长长一道墨。她没有捡。她整个人朝海面倾了半寸。', type: 'description' },
            { speaker: 'narrator', text: '台沿的夜露很滑。台下就是海，潮还没平。二十年前的那座蜃楼，也是这个时辰起的——这话，满台的人没人敢说出口。', type: 'description' },
            { speaker: 'player_select', text: '你必须立刻做点什么。', options: [
                { text: '站到她身边去，不拉她，只说：「潮还没平。」', effect: 'stand', affection: 12 },
                { text: '把笔捡起来，塞回她手里：「时辰还没记。你记。」', effect: 'pen', affection: 9 },
                { text: '低声吩咐弟子把观汐台的灯尽数点起来，照亮这座蜃楼', effect: 'lamp', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'stand': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 12) : { ok: true };
                    if (!_py.ok) { aff = 5; msg = '你抢上一步，连日守潮的身子却先晃了晃——她反手扶住你，把你从台沿拉回栏内。「守潮的人，先倒。」她声音哑得厉害，手很凉，却把你按在栏杆里侧站定了。那座蜃楼在天亮前散尽，她一个人录到了最后。第二天图录上添了八个字：「楼中有人执灯。」墨比别处深。（精力不足，那一拂晓你先撑不住了）'; break; }
                    aff = 12; msg = ('你站到她身边，肩并着肩，没有伸手。「潮还没平。」你说。她盯着海里那个影子，很久很久，身子一寸一寸直了回来。「……还没平。」她重复，声音在抖，「亥时的潮会回。那年，也是亥时的潮会回。」她退后半步，退回栏内，弯腰拾起笔，一笔一笔记：三月初三，寅时，楼见，二十年来最大，楼中执灯一人。记到最后一笔，天光白了。她转头看你，眼睛通红，却亮：「谢你。你说的是潮——不是拦我。」') + '（精力-12）'; break; }
                case 'pen': aff = 9; msg = '你把笔捡起来，塞回她手里，替她合拢五指。她盯着手里的笔，很久，又看看海里的影子——慢慢转过身，对着图录，把时辰、楼形、执灯人的方位，一笔一笔录了下去。录完，她极轻地说：「娘没录完的楼，我替她录。」那一拂晓的图录，是她二十年来最稳的一笔字。稳，是因为手边有人递笔。'; break;
                case 'lamp': aff = 6; msg = '观汐台的灯一盏一盏亮起来，照得蜃楼里的长街如在白昼——那个执灯的影子在街口立了很久，像也在看台上的灯。蜃楼散时她还立在原地，忽然说：「二十年前那个拂晓，台上没有灯。」她转头看你，「今天有。」这一笔她也入了录：「楼见，灯齐。」页脚注了一行小字：「点灯人，客。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'pl_event_009': {
        id: 'pl_event_009', npcId: PL_NPC_ID, title: '潮信之诺', icon: '🎐',
        desc: '她把母亲的旧螺，放进你手里。',
        minAffection: 68, trigger: { random: 0.3 }, cooldown: 0, flag: 'pl_e009_done',
        autoTrigger: { location: '蓬莱派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '录罢晚潮，她把你留下。观汐台的灯下，她解下腰间那只旧螺——银线的裂，磨亮的螺身，二十年的体温都在这一只螺里。', type: 'description' },
            { speaker: 'npc', text: '「螺，给你。」她把旧螺放进你手里，替你把手指一根一根合拢，动作很慢，很稳，像在录一笔不许错的潮，「听见潮，就是我在想你。」' },
            { speaker: 'npc', text: '「娘的螺，是用来听潮的。」她收回手，耳根红着，声音却平得像念录，「我的，是用来想人的。出海的人没有回来——螺不能再出海。它在岸上，得在一个岸上的人手里。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '合拢手指握住旧螺，举到耳边，听那一层一层的潮', effect: 'take', affection: 14 },
                { text: '「螺我收着。可你录潮的手，不能再空着等亥时。」', effect: 'vow', affection: 9 },
                { text: '看着她，问：「为什么是我？」', effect: 'ask', affection: 8 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'take': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 14) : { ok: true };
                    if (!_py.ok) { aff = 6; msg = '你抬手接螺，连日涉海的身子却乏得指尖发颤，旧螺差点从指间滑出去——她先一步拢住，把螺连同你的手一起按在她掌心。「拿稳。」她低着头说，「这只螺，我拿了二十年，才拿稳。」那晚的灯燃到很晚。你下台时，旧螺已经系在了你腰间，银线的裂贴着皮肉，是温的。（精力不足，那一夜你乏得厉害，螺绳是她替你系的）'; break; }
                    aff = 14; msg = ('你合拢手指，把螺贴上耳。潮声涌进来，一层，一层——潮声里像有人喊了一声名字。这一次，你忽然觉得听真了半分。你抬头问她喊的是什么。她望着灯影，很久，声音很小：「我也不知道。娘没有教过我。」她吹熄了灯。黑暗里，她把额头轻轻抵在你肩上，就一息：「听见潮，就是我在想你。听见名字——就是潮信，不骗人。」') + '（精力-14）'; break; }
                case 'vow': aff = 9; msg = '她替你合拢的手指紧了一下。「不空着等……」她重复这五个字，忽然转头看海，声音恢复了执录的平，「潮信从不空等。亥时的潮，二十年没有误过。」话是硬的，可第二天值夜的师弟说：执录录潮，从不用形容词的人，那天的录尾，多写了两个字——「潮安」。'; break;
                case 'ask': aff = 8; msg = '她没有立刻答。她转身翻开今年的图录，一页一页指给你看：三月初三，有人陪看楼到潮平。二月十八，有人潜入春潮扛枢。寅时，有人说，楼里的影子不是假的。她合上册子：「图录不记假话。为什么是你——册子上都写着。」她顿了顿，耳根红透，硬邦邦地补完最后一句，「……你自己看。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'pl_event_010': {
        id: 'pl_event_010', npcId: PL_NPC_ID, title: '白眉真人的考校', icon: '🧓',
        desc: '掌门出关，把二十年的图录摊在船案上。',
        minAffection: 72, trigger: { random: 0.3 }, cooldown: 0, flag: 'pl_e010_done',
        autoTrigger: { location: '蓬莱派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '白眉真人出关了。掌门的法舟停在观汐台下，老人不上台，只把二十年的潮信图录一册一册摊在船案上，摊了满满一案，任海风翻页。满岛弟子屏息。', type: 'description' },
            { speaker: 'narrator', text: '老人翻到第一页——那个模糊的小人影。他看了很久，忽然抬眼，指向你，只问了一句：「她的图录记了二十年海市。你说——哪一页上，是真的？」', type: 'description' },
            { speaker: 'npc', text: '瀛晚照一步跨到你身前，背脊绷得笔直，声音发紧：「掌门。图录是弟子一人记的，与外客无干——」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '对白眉真人一礼：「楼是假的，潮是真的。记的人——二十年没有记错一笔，页页是真的。」', effect: 'answer', affection: 8 },
                { text: '翻到第一页，指那个小人影：「真人要看真的，请看这一页。二十年前出海的人，和二十年后记的人，是一条心。」', effect: 'page', affection: 7 },
                { text: '与她并肩而立：「弟子斗胆反问真人——蓬莱的潮信，哪一页不是有人拿命守出来的？」', effect: 'side', affection: 11 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'answer': aff = 8; msg = '老人盯着你看了半晌，白眉一动，忽然笑了，笑声像浪拍船底：「八十年，上我这艘船的，没有一个不先翻册子看楼。」他把图录合上，「你不看楼。你看人。」他转头对晚照说，「录上的字是稳的，记的人心里苦了二十年。苦有人认得——晚照，往后这部图录，记给两个人看。」满岛寂静里，她绷直的背，慢慢松了。'; break;
                case 'page': aff = 7; msg = '老人俯身，就着你的手看那个小人影，看了很久很久。海风把图录一页一页翻过去，没有人说话。最后他直起身，声音很轻：「三月初六，二十年前。老夫也在观汐台上，看着那条船出的海。」他把手掌按在图录上，「楼的真假，老夫不问了。记的人是真的——老夫今日，问了一句多余的话。」他吩咐把图录归架，离台前只对晚照说了一句：「你娘的录，你守得好。」'; break;
                case 'side': aff = 11; msg = '你上前一步，与她并肩。她的手臂绷得像拉满的弓，袖底的指尖却悄悄松了半分。白眉真人看看你，又看看她，浑浊的眼睛里忽然有了笑意：「好。」他把满案图录尽数推到案心，「潮信是蓬莱的根，图录是潮信的灯。守灯的人，一个，灯孤；两个，灯明。」老人登舟离去时，案上留下四个字：「台，交给你们。」事后晚照在原地立了很久，轻声说：「掌门八十年，没有把台许给过谁。娘守了二十年，也没得过这四个字。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'pl_event_011': {
        id: 'pl_event_011', npcId: PL_NPC_ID, title: '海怒', icon: '⛈️',
        desc: '台风夜，渔船在礁区搁浅。',
        minAffection: 78, trigger: { random: 0.3 }, cooldown: 0, flag: 'pl_e011_done',
        autoTrigger: { location: '蓬莱派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '台风夜。黑浪一排一排砸过礁区的灯塔，一条渔船在礁上搁了浅，船灯一明一灭——船上六口人，潮还在涨，再有两刻，船就要散架在礁石上。', type: 'description' },
            { speaker: 'npc', text: '瀛晚照已在岸边：短打、缆索、船钩，报数干脆利落：「礁区三里，浪高两丈，窗口两刻。潮阵离不得人——我出海救人，岸上守阵。」她环视一圈，台风把所有声音都吞了。她提起船钩，就往水里去。', type: 'description' },
            { speaker: 'player_select', text: '你必须立刻做点什么。', options: [
                { text: '随她出海：她钩船救人，你在浪里递缆', effect: 'rope', affection: 14 },
                { text: '先一步扎进水里，用身子顶住船龙骨，替她挣出救人的时辰', effect: 'keel', affection: 15 },
                { text: '留守潮阵，把阵灯尽数点亮，照亮她回来的路', effect: 'lamp', affection: 10 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'rope': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 14) : { ok: true };
                    if (!_py.ok) { aff = 6; msg = '你追进浪里，一个黑浪把你拍在礁石上——手脚乏透了，缆索脱了手。她单手把你推回岸滩，自己扎进浪里，两刻之后，把船上六口人一个一个带了回来。坐在雨里，她骂你：「气力平日都长在哪里了？」骂完，却把救人的那段缆，在你擦破的小臂上绕了两圈，打了个结。（精力不足，那一夜浪里你先撑不住了）'; break; }
                    aff = 14; msg = ('黑浪像墙。你与她一前一后凿进三里礁区——她钩船，你递缆；浪头每砸下来一次，你就把缆往礁缝里多楔一寸，六个人一个接一个，从散架的船上拽过浪来。最后一个船婆上岸时朝着你二人跪下就磕头，你去扶，才发觉自己两只手掌全被缆勒开了口子——她报数从不漏字的人，这一夜没有报疼。船灯熄时台风也衰了，她坐在滩上喘，忽然说：「潮信说，子时三刻，人回岸。」她转头看你，雨水海水在脸上分不清，「说对了。人，也说对了。」') + '（精力-14）'; break; }
                case 'keel': { var _py = (typeof window !== 'undefined' && window._payCost) ? window._payCost('energy', 20) : { ok: true };
                    if (!_py.ok) { aff = 8; msg = '你潜到船底，第二个浪头就把你按在礁石上，眼前发黑——是她弃了船钩扎下来拽住你，船上六口人由闻灯赶来的岸上师弟们接了过去。两个人被拖上滩，谁也没站住，靠着灯塔在雨里对喘。她先开口，声音哑的：「……顶不住的浪，不许顶。潮信第一课。」话是训，手却一直扣着你的腕，没有松。（精力不足，那一刻你先撑不住了）'; break; }
                    aff = 15; msg = ('你扎进黑浪，摸到船底——龙骨已断了一半，你把肩抵上礁石，用背顶住龙骨，替那条船在礁上多挣出一刻。头顶上她把人一个一个拽过你的头顶，每拽一个报一声数：「一个！」「两个！」……「六个！」船散架时你被浪掀出去，是她在浪里扣住你的腕——那一下的力道比缆索还硬，拽得你整条手臂发麻。上岸她先点人：六口，一个不少。再回头点你，从头到脚，点得很慢，点完蹲在雨里抱着膝，肩膀轻轻抖了一下——没有哭。站起来时声音平得像常：「图录记：台风夜，船搁浅，六人生还。」顿了顿，用只有你听得见的声音添了两个字，「……加一。」') + '（精力-20）'; break; }
                case 'lamp': aff = 10; msg = '你守住潮阵，把阵灯一盏一盏点亮，又爬上榜棚把灯塔的火拨到最旺——三里礁区亮如白昼。她借着光救人，六口，一个不少。上岸她先看的不是船，是灯塔：「灯一夜没有暗过。」你报数：「灯芯剪了三回。」她点头，取图录记档：「台风夜，阵灯彻夜，出海者安归。」记完瞥你一眼，「守灯的人，册子记下了。」——观汐台的录不记人。这一夜，又破例了。'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    'pl_event_013': {
        id: 'pl_event_013', npcId: PL_NPC_ID, title: '终章·海市', icon: '🌅',
        desc: '一年一度最大的海市之夜，蜃楼深处有个人影。',
        minAffection: 85, trigger: { random: 1.0 }, cooldown: 0, flag: 'pl_e013_done',
        autoTrigger: { location: '蓬莱派', random: 1.0 },
        endingMap: { '同潮': 'pl_ending_同潮', '守岭': 'pl_ending_守岭', '泛舟': 'pl_ending_泛舟', '话潮': 'pl_ending_话潮', '沉璧': 'pl_ending_沉璧', '空潮': 'pl_ending_空潮' },
        scenes: [
            { speaker: 'narrator', text: '一年一度最大的海市之夜。黄昏起，满海静得像镜，然后，亭台、长街、石桥、炊烟——一层一层从波涛上升起来，历历如对面岛上的城。观汐台挤满了人，却都默契地给执录让开了台角。', type: 'description' },
            { speaker: 'npc', text: '瀛晚照立在台沿，图录摊在手里。蜃楼深处，长街尽头，一个人影——衣冠、身量，像极了图录第一页上的那一个。炊烟从楼腰升起，一缕，笔直。', type: 'description' },
            { speaker: 'npc', text: '「二十年。」她盯着那个影子，声音很轻，「一百三十八次海市，我都记下了。这一次——」她朝海面迈了一步，「这一次，像娘回来收录。」' },
            { speaker: 'narrator', text: '脚下的潮还没有涨上来。台边的灯一盏一盏亮了。她站在海风里，图录被吹得哗哗作响——这一步迈不迈得出去，就在你一句话之间。', type: 'description' },
            { speaker: 'npc', text: '「{playerName}。」她没有回头，「潮信说，亥时的潮会回。我这二十年，记到今夜为止。往后怎么记——你说。」' },
            { speaker: 'player_select', text: '你的选择将决定你们的关系走向', options: [
                { text: '「跟我走。带上那半册没录完的海图——潮在哪里，图录就记到哪里。」', effect: 'lover_travel', affection: 30 },
                { text: '「留在蓬莱。观汐台添第二把椅——每年春潮，我们两个一起录。」', effect: 'lover_stay', affection: 28 },
                { text: '「图录你照记。给我一条船罢——一叶舟，一年一会，你讲海图上每一处礁给我听。」', effect: 'friend', affection: 20 },
                { text: '「给我在台边留个常客的位子。我年年寄信来——你把信，压进图录。」', effect: 'friend_stay', affection: 18 },
                { text: '「潮要涨了。我只是上岛的过客——该下台了。」', effect: 'none', affection: 0 }
            ]}
        ],
        effects: function(npc, choice) {
            // 三度伤透即寒心：辜负独立成结局「沉璧」，与「空潮」（错过）分账
            var negCount = (window._negativeChoiceCount && window._negativeChoiceCount[PL_NPC_ID]) || 0;
            if (negCount >= 3 && (choice === 'lover_travel' || choice === 'lover_stay')) {
                return { affection: 0, msg: '她背对着你，站了很久很久，没有回头。「……好。」她说。她合上图录，走到台沿——不是朝海，是俯身，把二十年的潮信图录摊在栏杆上，一页一页，沉进海里。纸落水，墨化开，楼影、栏影、那一缕炊烟，一页一页没进黑潮。然后她回身，伸手向你的腰间——你腰间那只旧螺。你没有躲。她解下螺，银线的裂在灯下亮了一下，沉了下去，最后一样。「蜃楼骗了我二十年。」她的声音平得没有一丝波澜，「你也骗。」她下了台，背影笔直，再没有回头。那一夜的海市散得极慢，观汐台上，再没有人录潮。', ending: '沉璧' };
            }
            switch (choice) {
                case 'lover_travel': return { affection: 30, msg: '她终于回过头。海市的灯影落在她脸上，她看你，看了很久，忽然笑了，笑纹里全是水光：「……潮在哪里，图录就记到哪里。」她唤过值守的师妹，把二十年的潮信图录一册一册交到她手上，录潮的规矩，一条一条交代到最后一笔；自己怀里，只揣了那半册没录完的海图。「图录留在蓬莱。海图跟我走。」她握住你的手，手很凉，握得很紧，「娘的海没有录完——你陪我，替她录。」那一夜的海市散得极慢，观汐台的灯，亮到了天明。', ending: '同潮' };
                case 'lover_stay': return { affection: 28, msg: '她盯着海市，很久，转过身来——眼睛弯着，像亥时回来的潮：「……好。」她合上图录，「我留蓬莱。你也留蓬莱。」第二天，观汐台添了一把椅，摆在录案左手边，椅脚垫了石，稳稳的。她对值守的师妹交代录潮的规矩，末了一条是：「黄昏的潮，两个人录。」师妹问笔够不够，她一字不废：「够。他的那一支，我早就备下了。」录案的抽屉里躺着一支新笔，笔杆上的漆磨掉了一角——分明是被人握了很久的。', ending: '守岭' };
                case 'friend': return { affection: 20, msg: '她想了想，忽然笑开——笑得毫不矜持，二十年的执拗松了个干净：「一叶舟？」她把海图卷起来，在你肩上敲了一下，「蓬莱的海图，一处礁一个名字。你算过要讲多少年么？」她不等你答，已经转身去录今夜的潮了，笔尖悬着，背对着你，「一年一会。潮信不骗人——船来时，台上的灯，我给你留。」那夜的图录上多了一行小注：「有舟子出海，岁以潮信为约。」', ending: '泛舟' };
                case 'friend_stay': return { affection: 18, msg: '「常客？」她把图录收拢，掂了掂，像在掂一笔潮信的分量，「观汐台的规矩，外客不上台。」她顿了顿，取出一页空白录纸，把山下的邮驿、潮路、寄信的时节，一笔一笔写清楚，递给你，「信可以来。来的信——我压进图录。」她看你，耳根微红，话还是平的，「你的信，潮信误了，它也不会误。」那一年起，蓬莱潮信图录的每一册里，都压着几页岸上来的信，信纸带过海风的咸味，字迹没有一页受潮。', ending: '话潮' };
                case 'none': return { affection: 0, msg: '她执图录的手在半空停了很久很久。然后她转过身去，面朝大海，把今夜的潮一笔录完，字迹稳得像常：「三月初三，亥时，楼见，二十年来最大。楼中人影一，未近。」海市散了，她合上册子，没有再看你一眼。「潮涨了。」她说，「过客下台罢。台沿滑。」潮照旧在亥时回来，一如年年。你下了台，她留在台上——执录与图录，灯与潮，各归各位。', ending: '空潮' };
            }
            return { affection: 0, msg: '' };
        }
    }
};

// ============ 瀛晚照结局演出（6 个） ============
var PL_ENDINGS = {
    'pl_ending_同潮': {
        id: 'pl_ending_同潮', npcId: PL_NPC_ID, title: '结局·同潮', icon: '⛵',
        route: '同潮',
        scenes: [
            { speaker: 'narrator', text: '三日后，瀛晚照把二十年的潮信图录托付给师妹，录潮的规矩交代到最后一笔。她随身只带了半册没录完的海图——旧螺还在你手里，她说，螺不再出海了，可听潮的人，可以出海。', type: 'description' },
            { speaker: 'npc', text: '「潮在哪里，图录就记到哪里。」她与你并肩立在船头，海风把她的衣角吹得笔直，「娘的楼，我在蓬莱录了二十年，没有录完。外头的海大——你陪我，替她录。」' },
            { speaker: 'narrator', text: '多年后，沿海一线有个传说：有一条船，船无定线，哪里有海市，船就到哪里。船上有一位女执录，录潮信极准，几时几刻几分，从不用形容词；录案边永远多一个人，替她掌灯、递笔、压纸。', type: 'description' },
            { speaker: 'narrator', text: '有人问她海图录到什么为止。她想了想，答话里难得有一个不是数目的字：「全。」{playerTa}在边上补了半句：「录全了，回家。」她没有接话，可那天傍晚的潮信，她记早了一刻——船头调了向，朝着家的方向。', type: 'description' }
        ],
        finalText: '——— 结局·同潮（道侣·同行）———'
    },
    'pl_ending_守岭': {
        id: 'pl_ending_守岭', npcId: PL_NPC_ID, title: '结局·守岭', icon: '🏝️',
        route: '守岭',
        scenes: [
            { speaker: 'narrator', text: '你留在了蓬莱。观汐台添了第二把椅，摆在录案左手边，椅脚垫着石。每年春潮来，两个人一同守阵眼；潮平了，并排坐在台上，录这一年头一座海市。', type: 'description' },
            { speaker: 'narrator', text: '她说话还是报数目，几时几刻几分，一字不废——只有录到蜃楼里那缕炊烟时，字会写得慢些，一笔一笔。你说慢些好看。她不认，可往后每年，那一页的字都是慢的。', type: 'description' },
            { speaker: 'npc', text: '「今年春潮，比去年低半线。」她录着潮，把图录往你那边推了半寸，「你的那一页。笔蘸好了。」话是平的，推过来的册子，指尖却在页角按了很久才松开。' },
            { speaker: 'narrator', text: '观汐台的弟子私下说：执录还是话少，录潮还是极准——只是每天黄昏录潮，台沿多一个人；她录完了，会朝那边看一眼，眉眼就松半分，像潮退了一线。', type: 'description' },
            { speaker: 'narrator', text: '岛上的潮年年涨落，观汐台的灯夜夜长明。两个人录潮，字是会变的——变缓，变暖。', type: 'description' }
        ],
        finalText: '——— 结局·守岭（道侣·归隐）———'
    },
    'pl_ending_泛舟': {
        id: 'pl_ending_泛舟', npcId: PL_NPC_ID, title: '结局·泛舟', icon: '🛶',
        route: '泛舟',
        scenes: [
            { speaker: 'narrator', text: '你成了与她出海的人。一叶舟，一年一会——春潮平时她出蓬莱，你在约定的渡口接她，船头摊开海图，海图指到哪里，船就到哪里。', type: 'description' },
            { speaker: 'npc', text: '「前头礁区叫『断舵』，潮急，船离它三丈以内不许走。」她把海图摊在船头，一处一处礁讲给你听：哪一礁下藏着沉船，哪一礁看过海市，哪一礁——她的指尖顿了顿，「娘出海那年，船从那里过。」' },
            { speaker: 'narrator', text: '有人问你们是什么关系。她答「舟侣」，{playerTa}答「舟侣」。答完两人各自低头看海图，一人捏着一角，谁也没有多说——潮信极准，约极稳，一年一会，谁也不欠谁。', type: 'description' },
            { speaker: 'narrator', text: '后来海图上每一处礁，你们都去过。她的图录越记越厚，你的船越划越熟。海上的人都说，那条小舟认得所有的礁——因为船上有两个人，一个记了二十年，一个听了一年又一年。', type: 'description' }
        ],
        finalText: '——— 结局·泛舟（挚友·同行）———'
    },
    'pl_ending_话潮': {
        id: 'pl_ending_话潮', npcId: PL_NPC_ID, title: '结局·话潮', icon: '✉️',
        route: '话潮',
        scenes: [
            { speaker: 'narrator', text: '{playerTa}成了蓬莱潮讯的常客。观汐台台边那个位子年年留着；每年春潮来，录册上有一行：「岸上书至。」', type: 'description' },
            { speaker: 'narrator', text: '她照旧守台，照旧录潮——只是每年潮平后，会把岸上来的信从图录匣里取出来，一页一页抚平，压进当年的册子里。信纸带过海风的咸味，压在录里，墨色不曾潮过一页。', type: 'description' },
            { speaker: 'npc', text: '「今年的信，迟了四天。」她把信压进册子，指尖在页角敲了敲，「……潮路上，风大？」话问得别扭，回信纸却早已裁好，字写得比录潮还工整。' },
            { speaker: 'narrator', text: '师妹有回问她：岸上那位，算你什么人。她想了想：「潮信的常客。」师妹似懂非懂。只有执录自己知道——图录最末那一页，二十年的楼影、炊烟、岸上来的信，并排记在一处，都是「真的」。', type: 'description' }
        ],
        finalText: '——— 结局·话潮（挚友·归隐）———'
    },
    'pl_ending_沉璧': {
        id: 'pl_ending_沉璧', npcId: PL_NPC_ID, title: '结局·沉璧', icon: '🌑',
        route: '沉璧',
        scenes: [
            { speaker: 'narrator', text: '那一夜她没有回头。二十年的潮信图录，她一页一页沉进海里——先沉最新的，再沉最旧的；先沉楼影的页，再沉炊烟的页。沉得很慢，很稳，像在录一笔验了二十年的潮。', type: 'description' },
            { speaker: 'narrator', text: '最后沉的是那只旧螺——从你腰间解下来的，银线的裂在浪里亮了一下，没了。第二天，观汐台的架子空了。她向白眉真人复命，只有八个字：「录毕。往后，不记了。」', type: 'description' },
            { speaker: 'npc', text: '「蜃楼骗了我二十年。」后来有弟子问她，执录为什么不录潮了，她望着海面，语气像在念别人的录，「往后，蓬莱没有潮信了。潮照涨——涨它的，与我无干。」' },
            { speaker: 'narrator', text: '多年后你再上蓬莱，观汐台的灯还亮着。她对你礼数周全，报数照旧，分毫不差——只是腰间再没有那只旧螺，图录的架子上空了二十年，积着灰。每年春潮来，台上的人会朝岸边望一眼，随即收回去，收得很干净，像一页记完了的录。', type: 'description' }
        ],
        finalText: '——— 结局·沉璧（辜负）———'
    },
    'pl_ending_空潮': {
        id: 'pl_ending_空潮', npcId: PL_NPC_ID, title: '结局·空潮', icon: '🌫️',
        route: '空潮',
        scenes: [
            { speaker: 'narrator', text: '后来你还是上过几次蓬莱。观汐台对外客开放，她对你礼数周全，报数照旧，分毫不差，像对每一位上来看潮的人。', type: 'description' },
            { speaker: 'narrator', text: '潮信图录年年新记，二十年，三十年——楼影、栏杆、那一缕炊烟，都一笔一笔记全了。只是页页之上，再没有过岸上人的注。', type: 'description' },
            { speaker: 'narrator', text: '再后来，岛上偶有传闻——蓬莱执录的潮信愈发准了，蜃楼愈发录得全了，掌门说这部图录「大可传世」。只是潮照涨，观汐台的人，只是多了一个。', type: 'description' },
            { speaker: 'narrator', text: '春潮夜，她一个人在台上录潮。录完最后一笔，会朝台下的石阶望一眼——望一眼，就收回去了。她的图录照记，只是再没记过岸上的人。', type: 'description' }
        ],
        finalText: '——— 结局·空潮（错过）———'
    }
};

// ============ 性别语境事件（femctx 女玩家 / mctx 男玩家，互斥） ============
var PL_GENDER_CTX_EVENTS = {
    // 女玩家：蓬莱女弟子的提醒
    'pl_event_femctx': {
        id: 'pl_event_femctx', npcId: PL_NPC_ID, title: '台下的提醒', icon: '🪸',
        desc: '两个蓬莱女弟子在阶下把你叫住了。',
        minAffection: 55, trigger: { random: 0.35 }, cooldown: 0, flag: 'pl_e_femctx_done',
        requirePlayerFemale: true,
        autoTrigger: { location: '蓬莱派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '录罢晚潮下台，两个相熟的蓬莱女弟子在阶下把你叫住，左右看了看，压低声。', type: 'description' },
            { speaker: 'npc', text: '「姑娘。」年长的那个开门见山，「师姐的潮信图录从不记岸上的人——你的名字，上头一回进了图录。满岛都看在眼里了。」' },
            { speaker: 'npc', text: '「师姐那个人，录潮极准，心事极拗。她娘的一桩事沉了她二十年，那只旧螺挂了她二十年。她把螺给了你——我怕你跟着她，日子过得比守潮还辛苦。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「她录她的潮，我守我的灯——正好。」', effect: 'tease', affection: 8 },
                { text: '「姊姊，我自愿的。辛苦我认。」', effect: 'accept', affection: 7 },
                { text: '「你们是怕我委屈，还是怕她破例？」', effect: 'probe', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'tease': aff = 8; msg = '两个师妹对视一眼，年长的先笑出声：「……守灯？」她拍着你的手背，眼角的纹路都松了，「好姑娘。她那盏灯一个人守了二十年，早该有人换班了。你守——我们师姊妹给你送灯油。」'; break;
                case 'accept': aff = 7; msg = '师妹们叹了口气：「自愿的……好。」年纪小的那个从怀里摸出一包晒好的潮菜塞给你，「观汐台守夜的人，得先喂饱。往后师姐录潮，你录她——潮菜，我们师姊妹包了。」'; break;
                case 'probe': aff = 6; msg = '年长的那个捻着衣角，顿了顿：「……两样都怕。」她望着观汐台的方向，「她破例一回，就要拿十倍的数目端回来。你舍得看她那样，就留下。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // 男玩家：环岛男弟子的流言
    'pl_event_mctx': {
        id: 'pl_event_mctx', npcId: PL_NPC_ID, title: '环岛流言', icon: '🌫️',
        desc: '守潮的男弟子把你拦下了。',
        minAffection: 55, trigger: { random: 0.35 }, cooldown: 0, flag: 'pl_e_mctx_done',
        requirePlayerMale: true,
        autoTrigger: { location: '蓬莱派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '礁区外，一个胆大的环岛守潮男弟子把你拦下，左右看了看，压低声。', type: 'description' },
            { speaker: 'npc', text: '「那位……岸上的客。」男弟子咬着牙，「你跟执录的事，满岛传遍了。她把那只旧螺给了外客——她娘留下的那只。二十年的蓬莱，那只螺没有离过她的身，头一遭。」' },
            { speaker: 'npc', text: '「我不是说这不好。我是说，执录那个人，别人戳她一指头，她能拿十倍的数目端回来。岛上的嘴她压得住，岸上的嘴呢？你受得住她端，她受得住这满岸的嘴么？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「嘴归嘴。她录她的潮，我站我的位。」', effect: 'defy', affection: 8 },
                { text: '「兄弟，我们还没到那一步。」', effect: 'deny', affection: 3 },
                { text: '「谁嚼她的舌根，先问我的拳头。」', effect: 'shield', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'defy': aff = 8; msg = '男弟子眼睛亮了：「……行！这话我原样带给执录——不对，我不能带。」他吐吐舌头跑了。可当晚观汐台的灯，你看得出，比平日熄得晚——录潮的人，心情不坏。'; break;
                case 'deny': aff = 3; msg = '男弟子盯了你半晌：「……没到那一步。」他拍拍衣摆走了，「那你腰间那只旧螺算什么？那道银线的裂，满岛都知道是执录娘的遗物——你还给她去？」'; break;
                case 'shield': aff = 7; msg = '男弟子怔了怔，忽然咧嘴一笑：「执录要是听见这句，能拿数目损你三天——损完了，请你喝她灶上煨的潮平鱼汤。」他跑进礁区，声音远远飘下来，「嚼舌根的那几位老的，其实早叫执录春潮里那一扛吓软啦！」'; break;
            }
            return { affection: aff, msg: msg };
        }
    }
};

// ============ 合并进总事件池 ============
if (typeof NPC_PERSONAL_EVENTS !== 'undefined') {
    Object.assign(NPC_PERSONAL_EVENTS, PL_MAIN_EVENTS);
    Object.assign(NPC_PERSONAL_EVENTS, PL_GENDER_CTX_EVENTS);
}

// ============ 注册结局集与副作用回调 ============
if (typeof registerEndingSet === 'function') {
    registerEndingSet(PL_NPC_ID, PL_ENDINGS);
}
if (typeof registerEndingCallback === 'function') {
    registerEndingCallback(PL_NPC_ID, function(endingName, npc) {
        if (endingName === '同潮' || endingName === '守岭') {
            if (npc && typeof npc.setFlag === 'function') npc.setFlag('dao_companion');
            if (window.showMessage) window.showMessage('🐚 你与瀛晚照结为道侣！蓬莱潮阵与蜃楼剑意感悟大幅提升', 'success');
        } else if (endingName === '泛舟' || endingName === '话潮') {
            if (npc && npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 30);
            if (window.showMessage) window.showMessage('🐚 你与瀛晚照成了潮信为约的知己', 'success');
        } else if (endingName === '沉璧') {
            if (window.showMessage) window.showMessage('🌊 瀛晚照沉了潮信图录。蜃楼骗了她二十年——她不记了', 'error');
        }
    });
}

// ============ 自动触发 + 每日钩子（复用 maybeAutoTriggerPersonalEvent） ============
function maybeAutoTriggerPlEvent(source) {
    return maybeAutoTriggerPersonalEvent(PL_NPC_ID, source, { finalEvents: ['pl_event_013'] });
}

if (typeof window !== 'undefined' && window.timeSystem && window.timeSystem.onNewDaySubscribe) {
    window.timeSystem.onNewDaySubscribe(function() {
        try {
            if (window.currentCharData && window.currentCharData.location === '蓬莱派') {
                maybeAutoTriggerPlEvent('daily');
            }
            // 性别语境：每日在该派过夜 + 对应性别 + 好感≥55 + 未触发
            if (!window.currentCharData || !window.npcManager) return;
            var loc = window.currentCharData.location || '';
            if (loc !== '蓬莱派') return;
            var npc = window.npcManager.getNPC ? window.npcManager.getNPC(PL_NPC_ID) : null;
            if (!npc) return;
            var aff = (npc.relationship && npc.relationship.affection) || 0;
            if (aff < 55) return;
            var isF = window.currentCharData.gender === 'female';
            var ctxId = isF ? 'pl_event_femctx' : 'pl_event_mctx';
            if (typeof hasEventTriggered === 'function' && hasEventTriggered(ctxId)) return;
            var ev = NPC_PERSONAL_EVENTS[ctxId];
            if (!ev) return;
            if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npc)) return;
            setTimeout(function() {
                if (document.querySelector && document.querySelector('.personal-event-modal')) return;
                if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npc)) return;
                if (typeof triggerPersonalEvent === 'function') triggerPersonalEvent(ctxId);
            }, 1200);
        } catch (e) { console.warn('[瀛晚照线] 每日触发失败:', e); }
    });
}

// ============ 导出 ============
if (typeof window !== 'undefined') {
    window.PL_MAIN_EVENTS = PL_MAIN_EVENTS;
    window.PL_ENDINGS = PL_ENDINGS;
    window.maybeAutoTriggerPlEvent = maybeAutoTriggerPlEvent;
}
console.log('[瀛晚照线] 蓬莱感情线加载完成：结局 ' + Object.keys(PL_ENDINGS).length + ' 个 + 主线事件 ' + Object.keys(PL_MAIN_EVENTS).length + ' 个 + 性别语境 ' + Object.keys(PL_GENDER_CTX_EVENTS).length + ' 个');
