// ==================== heroine-rivalry.js - 女主角吃醋/互动系统 v1.0 ====================
// 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / triggerPersonalEvent /
//       canPlayerAccessPersonalEvent / hasEventTriggered）
//       npcs/npc-system.js（npc.hasFlag('dao_companion') / npc.memory._loveAccepted_confess）
// 加载顺序：在四位女主角事件文件（baihua/tianshan/wuxian 系列）之后
//
// 设计宪法：吃醋由真实关系状态驱动——玩家已与他人「表白成功」或「结为道侣」时，
//   另一位女主角（好感已深、自己在意）才会察觉并质问。无人为计数器。
//   每位女主角对情敌只对峙一次，由既有 personalEventFlags（按事件 id）一次性标记。
//   场景文本泛指「你心里那位」，具体情敌名在 effects 反应文里由 detectRivalRomance 动态点出。

var HEROINE_ROSTER = [
    { id: 'sect_leader_百花谷', name: '温蘅', sect: '百花谷', eventId: 'bh_event_rival', reconcileId: 'bh_event_reconcile' },
    { id: 'sect_leader_修罗宫', name: '绯泪', sect: '修罗宫', eventId: 'xl_event_rival', reconcileId: 'xl_event_reconcile' },
    { id: 'sect_leader_天山派', name: '琤霄凌', sect: '天山派', eventId: 'ts_event_rival', reconcileId: 'ts_event_reconcile' },
    { id: 'sect_leader_五仙教', name: '蓝凤凰', sect: '五仙教', eventId: 'wx_event_rival', reconcileId: 'wx_event_reconcile' }
];

/**
 * 探测玩家已与之缔结情缘的「另一位」女主角（情敌）。
 * @param {string} excludeId 当前女主角ID，排除自身
 * @returns {{id,name,sect,isDaoCompanion}|null}
 */
function detectRivalRomance(excludeId) {
    if (!window.npcManager) return null;
    for (var i = 0; i < HEROINE_ROSTER.length; i++) {
        var r = HEROINE_ROSTER[i];
        if (r.id === excludeId) continue;
        var npc = window.npcManager.getNPC ? window.npcManager.getNPC(r.id) : null;
        if (!npc) continue;
        var isDao = !!(npc.hasFlag && npc.hasFlag('dao_companion'));
        var confessed = !!(npc.memory && npc.memory._loveAccepted_confess);
        if (isDao || confessed) {
            return { id: r.id, name: r.name, sect: r.sect, isDaoCompanion: isDao, gender: 'female' };
        }
    }
    return null;
}

// ============ 四位女主角的吃醋对峙事件 ============
var HEROINE_RIVALRY_EVENTS = {
    // ---- 温蘅：笑眼弯弯，最安静的人，碎起来最重 ----
    'bh_event_rival': {
        id: 'bh_event_rival', npcId: 'sect_leader_百花谷', title: '药庐的冷茶', icon: '🥀',
        desc: '她递来的茶，是凉的。',
        minAffection: 45, trigger: { random: 1.0 }, cooldown: 0, flag: 'bh_e_rival_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '药庐的灯还亮着，她坐在窗下，面前两只杯子——一只热的，一只凉的。她把凉的那只推给你。', type: 'description' },
            { speaker: 'npc', text: '「坐。」她笑眼弯弯如常，只是没看你，「——我听说了。你在外头，有了别的人。」' },
            { speaker: 'npc', text: '「医者手里握着人命，不能带情绪——这话我跟你说过。」她终于抬眼，琥珀色眼底什么都没有，「可我没说过，医者不能疼。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「是。我不瞒你。」', effect: 'admit', affection: -4 },
                { text: '「你听谁胡说的。」', effect: 'deny', affection: -10 },
                { text: '「……我没有辜负你。」', effect: 'defend', affection: -6 }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = detectRivalRomance(npc.id) || { name: '那位' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'admit':
                    aff = dao ? -8 : -4;
                    msg = dao
                        ? '她怔了很久，笑了：「……道侣。好啊。」她把热的那只茶倒进药炉，「茶凉了就别喝了。药庐以后也不必来了——你的道侣，会替你温茶。」'
                        : '她点了点头，像是早料到：「那位是' + rival.name + '吧。」她把热茶推到一边，「你瞒着，我反倒高看你一眼。如今……茶你自己倒。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 2);
                    break;
                case 'deny':
                    aff = dao ? -16 : -10;
                    msg = '她笑出了声，笑得花枝乱颤，眼底却凉透了：「' + rival.name + '的事，半个江湖都知道——你当我百花谷的耳目是摆设？」她起身，把凉茶泼在药炉火里，火「噗」地灭了。「以后别来了。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 15);
                    break;
                case 'defend':
                    aff = dao ? -12 : -6;
                    msg = '她静静看着你，琥珀色眼底第一次有了真的东西——是疼。「没辜负？」她轻声，「你与' + rival.name + (dao ? '结了道侣' : '动了情') + '，再站到我药庐里说没辜负我——」她摇头，「温蘅这辈子最怕的，就是有人笑着拿刀。」';
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 绯泪：寒冰入骨，最烈 ----
    'xl_event_rival': {
        id: 'xl_event_rival', npcId: 'sect_leader_修罗宫', title: '断簪', icon: '🩸',
        desc: '她把你曾收的断簪，拍在桌上。',
        minAffection: 45, trigger: { random: 1.0 }, cooldown: 0, flag: 'xl_e_rival_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '修罗宫大殿空旷。她背对你立着，听见你进来，反手把一物拍在柱上——是当初她给你保管的那根断簪。', type: 'description' },
            { speaker: 'npc', text: '——你看清楚了。' },
            { speaker: 'npc', text: '她转过身，寒冰真气在指尖凝成一线：「你心里另有了人，还敢踏进修罗宫？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「是。我不骗你。」', effect: 'admit', affection: -5 },
                { text: '「你想多了。」', effect: 'deny', affection: -12 },
                { text: '不退半步，迎上她的寒意', effect: 'stand', affection: 4 }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = detectRivalRomance(npc.id) || { name: '那人' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'admit':
                    aff = dao ? -10 : -5;
                    msg = dao
                        ? '她指间的寒意一颤，忽地笑了，笑得凄厉：「道侣？' + rival.name + '？」她把断簪推回你手里，又收回去，「……滚。下一次再让我看见你，修罗宫不留情。」'
                        : '她冷笑：「' + rival.name + '。我以为你至少会编个名字。」她把断簪收回，「滚回去想清楚——要她，还是我。别两头占着。」';
                    break;
                case 'deny':
                    aff = dao ? -20 : -12;
                    msg = '她眼神一沉，寒冰真气陡盛，你衣襟凝出霜花：「你当我修罗宫的暗哨是吃素的？' + rival.name + '与你' + (dao ? '已结道侣' : '情愫暗生') + '，我这里账目清清楚楚。」断簪被她两指一掰——「咔」地又断了一截，「你走吧。簪子各拿一半，谁也不欠谁。」';
                    break;
                case 'stand':
                    aff = dao ? 0 : 4;
                    msg = dao
                        ? '你没退。寒意贴上你脖颈，她没下杀手。良久，她收回手：「……你敢站这儿，是真不怕死，还是真不要她。」她背过身，「滚。今晚我杀心已起，再见必见血。」'
                        : '你没退。她寒意顿住，盯了你许久：「……' + rival.name + '让你有这胆子？」她忽然笑了，冷得厉害，「行。你既敢留下，我倒要看看，你能站到几时。」她把断簪插回桌案，「滚。下次再来，先想好怎么交代。」';
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 琤霄凌：剑修，最沉。她不质问，她拦门 ----
    'ts_event_rival': {
        id: 'ts_event_rival', npcId: 'sect_leader_天山派', title: '霜鸣不鸣', icon: '🥶',
        desc: '她把你拦在雪庐门外，霜鸣未出鞘。',
        minAffection: 45, trigger: { random: 1.0 }, cooldown: 0, flag: 'ts_e_rival_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '雪庐外大雪。琤霄凌立在阶上，手按霜鸣剑鞘，没让你近前。', type: 'description' },
            { speaker: 'npc', text: '「站住。」她声音像雪后的风，冷而平，「——我知道了。你心里那位。」' },
            { speaker: 'npc', text: '「我不问你为何。」她终于看你，冰蓝眼底一寸一寸地冻下去，「我只问一句——你来天山，是躲她，还是躲我？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「都不是。我是来看你。」', effect: 'visit', affection: 2 },
                { text: '「……我对不住你。」', effect: 'admit', affection: -8 },
                { text: '「我有我的难处。」', effect: 'excuse', affection: -6 }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = detectRivalRomance(npc.id) || { name: '那人' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'visit':
                    aff = dao ? -6 : 2;
                    msg = dao
                        ? '她手按剑鞘的指节一紧，良久松开：「道侣都立了，还来看我——你是来告诉我，霜鸣不必再等？」她让开半步，没让你进，「回去。雪庐的门，今日起为' + rival.name + '落锁。」'
                        : '她看了你很久，肩线没松：「' + rival.name + '的事，我已听见风声。你既来了——今日不拔剑。」她让开半步，雪庐门开一线，「但霜鸣认主，要的是一心一意。你心里两个名字，剑不认。」';
                    break;
                case 'admit':
                    aff = dao ? -14 : -8;
                    msg = '她极轻地「嗯」了一声，像雪落进雪里。「对不住。」她把霜鸣从鞘中抽出半寸——剑身那道裂纹，在雪光下清清楚楚，「这道疤，是替我挡刀的人留的。我原想，再给一人挡刀——」她收剑入鞘，「不必了。你走吧。霜鸣今日不饮血，是我最后的体面。」';
                    break;
                case 'excuse':
                    aff = dao ? -12 : -6;
                    msg = '她沉默半晌，冰蓝眼底结了一层霜：「难处。」她重复，「我守剑十二年，等一个人——这是我的难处。你的难处，是' + rival.name + '。」她转身，「门落锁了。雪大，下山慢些。」';
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 蓝凤凰：心蛊会替她反应，她笑得越媚越危险 ----
    'wx_event_rival': {
        id: 'wx_event_rival', npcId: 'sect_leader_五仙教', title: '蛊动', icon: '🖤',
        desc: '她锁骨下的蝶形黑纹，在你进门时猛地鼓了一下。',
        minAffection: 45, trigger: { random: 1.0 }, cooldown: 0, flag: 'wx_e_rival_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '万蛊窟。她倚在蛊瓮上，你一进门，她锁骨下的蝶形黑纹猛地鼓了一下——像闻见了什么。', type: 'description' },
            { speaker: 'npc', text: '「哟。」她妖媚地挑眉，凤目却没笑，「我的心蛊，比我还吃醋——它闻见了旁人的味道。」' },
            { speaker: 'npc', text: '「动情喂蛊，蛊成则心死。」她指尖点着锁骨那团黑纹，一下一下，「我替你担了这么久的死——你倒好，去喂别人了？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「是我负了你。」', effect: 'admit', affection: -7 },
                { text: '「你想多了。」', effect: 'deny', affection: -11 },
                { text: '「它若是心蛊，我替你压。」', effect: 'shield', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = detectRivalRomance(npc.id) || { name: '那人' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'admit':
                    aff = dao ? -14 : -7;
                    msg = dao
                        ? '她愣了愣，黑纹在她皮下又鼓了一下，她按住锁骨，笑得惨然：「道侣……' + rival.name + '。」她摇头，「好。我替你担死，你去替别人担生——这账，五仙教记下了。」她背过身，「忘情散，我自己饮。你走。」'
                        : '她点头，妖媚的笑淡下去：「' + rival.name + '。记下了。」她从瓮里取一丸忘情散，在指尖转着，「我养心蛊十八年，没敢动情。你倒敢，两头动——」她把药一饮而尽，「滚。下次见，心蛊若认了你作宿主，别怪它不客气。」';
                    break;
                case 'deny':
                    aff = dao ? -18 : -11;
                    msg = '她笑出声，笑得花枝乱颤，黑纹在她皮下鼓得像要破壳：「否认？' + rival.name + '与你的味道，' + (dao ? '连道侣契都结了' : '缠在一起') + '——我的蛊不撒谎。」她猛地收笑，凤目阴冷，「你以为忘情散压得住？我告诉你——它压不住了。你走吧。它若破壳，第一个找的是你。」';
                    break;
                case 'shield':
                    aff = dao ? -2 : 6;
                    msg = dao
                        ? '你伸手覆上她锁骨黑纹处，以真气引蛊。黑纹鼓动渐缓。她看着你的手，眼底翻涌：「……你与' + rival.name + '都结了道侣，还来替我压蛊——」她没推开你，「你不怕她知道？」半晌，「……这蛊认了你。可我不能让你两处都担。」她抽开你手，「走吧。别再来——下次，它真要破壳了。」'
                        : '你伸手覆上她锁骨黑纹，以真气引蛊。黑纹鼓动渐缓。她盯着你，凤目里有水光：「……你倒敢碰。' + rival.name + '不在意？」她没推开你，许久，「这蛊认了你。但我不会让你两头担——」她抽开手，「你先回去，把自己理清楚。心蛊破壳前，别再来五仙教。」';
                    break;
            }
            return { affection: aff, msg: msg };
        }
    }
};

// ============ 四位女主角的「和好」事件：对峙后好感养回 → 第二次机会 / 苦涩收束 ============
var HEROINE_RECONCILE_EVENTS = {
    // ---- 温蘅：你把好感养回来了，她笑眼又弯，但茶不再两只 ----
    'bh_event_reconcile': {
        id: 'bh_event_reconcile', npcId: 'sect_leader_百花谷', title: '热茶', icon: '🍵',
        desc: '她递来的茶，又是热的了。',
        minAffection: 55, trigger: { random: 1.0 }, cooldown: 0, flag: 'bh_e_reconcile_done',
        requireRivalRomance: true, requireEventDone: 'bh_event_rival',
        scenes: [
            { speaker: 'narrator', text: '药庐。她推一只热茶到你面前——和上次那只凉的，同一位置。', type: 'description' },
            { speaker: 'npc', text: '「你又来了。」她笑眼弯弯，琥珀色眼底有了一点真东西，「我以为你不来了。」' },
            { speaker: 'npc', text: '「茶给你。药庐的门……」她顿了顿，「你愿意推开，就一直能推开。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「我以后只来你这药庐。」', effect: 'only', affection: 10 },
                { text: '「茶我喝。但有些事我做不到了。」', effect: 'honest', affection: 4 },
                { text: '什么都不说，把茶喝了', effect: 'silent', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = detectRivalRomance(npc.id) || { name: '那位' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'only':
                    aff = dao ? -2 : 10;
                    msg = dao
                        ? '她笑了一下，笑里有苦：「……只来我这？你道侣' + rival.name + '，怕是不依。」她摇头，「茶你喝，话别说的太满。但药庐的门——为你留着。你要来，就只做我的……旧相识。」'
                        : '她怔了怔，琥珀色眼底亮了一瞬，随即垂下：「……好。」她把另一只杯子也烫了，「这两只，以后都温着。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 8);
                    break;
                case 'honest':
                    aff = dao ? 2 : 4;
                    msg = dao
                        ? '她点了点头，平静得像早料到：「' + rival.name + '既是你道侣，你做不到的，我懂。」她把热茶推近，「药庐不收道侣，只收常客。你来做常客——我答应。」'
                        : '她叹了口气：「……你倒是老实。」她把茶推给你，「做不到的，慢慢来。茶先喝——药庐的门，没落锁。」';
                    break;
                case 'silent':
                    aff = 6;
                    msg = '你把热茶喝了。她看着你喝完，弯了弯眼：「……不说话也好。」她起身去烫第二只杯子，「明日还有一盏。」——药庐的灯，又亮到很晚。';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 绯泪：寒冰化了一线，她把断成两截的簪子接回 ----
    'xl_event_reconcile': {
        id: 'xl_event_reconcile', npcId: 'sect_leader_修罗宫', title: '接簪', icon: '🔮',
        desc: '她把掰断的簪子，重新接到了一起。',
        minAffection: 55, trigger: { random: 1.0 }, cooldown: 0, flag: 'xl_e_reconcile_done',
        requireRivalRomance: true, requireEventDone: 'xl_event_rival',
        scenes: [
            { speaker: 'narrator', text: '修罗宫后殿。她坐在妆台前，手里捏着那根被她掰成两截的断簪——接了很久，没接上。', type: 'description' },
            { speaker: 'npc', text: '她听见你进来，没回头。半晌，把断簪往后一递：「……你手稳，你来接。」' },
            { speaker: 'npc', text: '「我不爱求人。」她声音很轻，「但这个，我接不上。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '接上断簪，交还她', effect: 'fix', affection: 12 },
                { text: '「这簪子，我替你收着。」', effect: 'keep', affection: 8 },
                { text: '「绯泪，我对不住你。」', effect: 'apologize', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = detectRivalRomance(npc.id) || { name: '那人' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'fix':
                    aff = dao ? 4 : 12;
                    msg = dao
                        ? '你把断簪接上，递还她。她接过，指尖停在你掌心一瞬：「……接得真好。」她轻声，「可惜接得上簪子，接不上' + rival.name + '。」她把簪子收进匣，「你走吧——簪子我留作念想。修罗宫的门，不开给你了。」'
                        : '你把断簪接上，递还她。她盯着接缝看了许久，忽然笑了，笑得有泪：「……你倒接得稳。」她把簪子插回发间，「行。再信你一回——但' + rival.name + '的事，你得给我个交代。」';
                    break;
                case 'keep':
                    aff = dao ? 6 : 8;
                    msg = dao
                        ? '你把断簪收进自己怀里。她没拦，看着你收：「……' + rival.name + '的道侣，收着我的断簪。」她冷笑，却没再掰断，「你走吧。簪子在你那，我认——可人，我不认了。」'
                        : '你把断簪收进怀里。她瞪了你一眼：「……弄丢了，你把自己赔给我。」——但她没追讨。修罗宫的门，那夜没落锁。';
                    break;
                case 'apologize':
                    aff = dao ? 2 : 5;
                    msg = dao
                        ? '她背对你，肩线一僵。「对不住。」她重复，「' + rival.name + '听了，怕也不信。」她没回头，「滚吧。这句话，留着给道侣说。」'
                        : '她沉默良久，回头看了你一眼：「……对不住三个字，能接簪子？」她把断簪推给你，「接上。接得上，我就收你这句话。」';
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 琤霄凌：雪庐的门又开了一线，霜鸣轻鸣 ----
    'ts_event_reconcile': {
        id: 'ts_event_reconcile', npcId: 'sect_leader_天山派', title: '门开一线', icon: '🪟',
        desc: '雪庐落锁的门，又被扫出一条道。',
        minAffection: 55, trigger: { random: 1.0 }, cooldown: 0, flag: 'ts_e_reconcile_done',
        requireRivalRomance: true, requireEventDone: 'ts_event_rival',
        scenes: [
            { speaker: 'narrator', text: '雪庐外。她立在阶上，门前积雪被她扫出一条道——从阶下直通到门内。她没看你，但那条道是给你扫的。', type: 'description' },
            { speaker: 'npc', text: '「霜鸣今日鸣了一声。」她声音还是冷的，但没拦你，「……它好像，又认了你一点。」' },
            { speaker: 'npc', text: '「门我没落锁。」她终于看你，冰蓝眼底雪化了一线，「但你要进来——就只守这柄剑。守不守得住，看你。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '踏上那条扫出的道，进门', effect: 'enter', affection: 10 },
                { text: '「霜鸣，我守。」', effect: 'promise', affection: 8 },
                { text: '「我可能守不住。」', effect: 'honest', affection: 4 }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = detectRivalRomance(npc.id) || { name: '那人' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'enter':
                    aff = dao ? 0 : 10;
                    msg = dao
                        ? '你踏上那条道，进了雪庐。她没拦，但霜鸣挂在中龛，没让你近。「你道侣是' + rival.name + '。」她背对你，「守霜鸣，要一心一意。你既有了' + rival.name + '——雪庐的门，开这一回，是还你的情。下回，别来了。」'
                        : '你踏上那条道，进了雪庐。她让了半步，没拦。雪庐里两柄剑并挂——霜鸣，和你的。她看着剑：「……守得住，就守。守不住，门我还会扫。」';
                    break;
                case 'promise':
                    aff = dao ? 3 : 8;
                    msg = dao
                        ? '她看了你很久：「……你已把' + rival.name + '当道侣，霜鸣怎么守？」她摇头，「话我记下了。但守剑要一心——你心里有两个名字，剑不认。雪庐的门，今日开这一线，是最后的。再开，要你先把' + rival.name + '的名字，从心里抹了。」'
                        : '她点了点头，冰蓝眼底一线雪化开：「……行。霜鸣认你，我也不拦。」她让开身，「门开着。但' + rival.name + '的事，你给我个了断——剑道不容二心。」';
                    break;
                case 'honest':
                    aff = 4;
                    msg = '她沉默半晌，难得露出一点笑意，冷冽里的暖：「……守不住也来。这才叫守。」她让开半步，「门开着。能守多久守多久——霜鸣等得起。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 蓝凤凰：忘情散减了半丸，心蛊又认了你 ----
    'wx_event_reconcile': {
        id: 'wx_event_reconcile', npcId: 'sect_leader_五仙教', title: '减药', icon: '💊',
        desc: '她把忘情散，减了半丸。',
        minAffection: 55, trigger: { random: 1.0 }, cooldown: 0, flag: 'wx_e_reconcile_done',
        requireRivalRomance: true, requireEventDone: 'wx_event_rival',
        scenes: [
            { speaker: 'narrator', text: '万蛊窟药庐。她在饮忘情散——但今日只饮了半丸，留半丸在碗底。她看见你，凤目一挑。', type: 'description' },
            { speaker: 'npc', text: '「……你倒还来。」她妖媚地笑，指尖点着锁骨——蝶形黑纹安安静静，「它没破壳。因为你还来。」' },
            { speaker: 'npc', text: '「散我减了半。」她把碗推到你面前，碗底那半丸黑糊糊，「……你来，它就安；你不来，它就闹。我拿它没办法——拿你，倒有点办法。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '把那半丸倒掉', effect: 'dump', affection: 12 },
                { text: '「我常来。」', effect: 'promise', affection: 8 },
                { text: '「这药伤身，少饮。」', effect: 'care', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = detectRivalRomance(npc.id) || { name: '那人' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'dump':
                    aff = dao ? 4 : 12;
                    msg = dao
                        ? '你把碗底半丸倒掉。她没拦，看着药流进土里：「……你道侣' + rival.name + '，还管我饮不饮药。」她笑得惨然，「心蛊认了你，可你认了' + rival.name + '。散我减了——但门，只为你常客开。来可以，别碰蛊。」'
                        : '你把碗底半丸倒掉。她怔了怔，妖媚的笑碎了一瞬：「……你倒敢。」黑纹在她皮下安安静静，「行。散我减。' + rival.name + '的事，你给我个了断——心蛊认了你，我不让它白认。」';
                    break;
                case 'promise':
                    aff = dao ? 2 : 8;
                    msg = dao
                        ? '她挑眉，凤目里有水光：「常来？你道侣' + rival.name + '，准你来五仙教常客？」她摇头，「散我减半。但来可以——只做看蛊的客。别碰心蛊，碰了，' + rival.name + '也救不了你。」'
                        : '她点了点头，把碗收了：「……常来。这话我记着。」黑纹在她皮下鼓了一下，又安静，「' + rival.name + '的事，你给了断。心蛊认了你——它认的，我认。」';
                    break;
                case 'care':
                    aff = 6;
                    msg = '她愣了愣，凤目罕见地软了一瞬：「……少饮。十年来没人跟我说过。」她把碗搁下，「散我减。你常来——它就安。」黑纹在她锁骨下，安安静静，像也听懂了。';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    }
};

// ============ 合并进总事件池 ============
if (typeof NPC_PERSONAL_EVENTS !== 'undefined') {
    Object.assign(NPC_PERSONAL_EVENTS, HEROINE_RIVALRY_EVENTS);
    Object.assign(NPC_PERSONAL_EVENTS, HEROINE_RECONCILE_EVENTS);
}

// ============ 每日钩子：玩家在某女主角门派过夜 → 触发吃醋/和好 ============
if (typeof window !== 'undefined' && window.timeSystem && window.timeSystem.onNewDaySubscribe) {
    window.timeSystem.onNewDaySubscribe(function() {
        try {
            if (!window.currentCharData || !window.npcManager) return;
            var loc = window.currentCharData.location || '';
            for (var i = 0; i < HEROINE_ROSTER.length; i++) {
                var h = HEROINE_ROSTER[i];
                if (h.sect !== loc) continue;                       // 玩家须在该女主角所在门派
                var npc = window.npcManager.getNPC ? window.npcManager.getNPC(h.id) : null;
                if (!npc) continue;
                var aff = (npc.relationship && npc.relationship.affection) || 0;

                // 1) 吃醋对峙：好感≥45、未对峙过、有情敌
                if (aff >= 45 && !hasEventTriggered(h.eventId) && detectRivalRomance(h.id)) {
                    var ev = NPC_PERSONAL_EVENTS[h.eventId];
                    if (ev && (!canPlayerAccessPersonalEvent || canPlayerAccessPersonalEvent(ev, npc))) {
                        _delayedRivalryFire(h.eventId, npc);
                    }
                    continue; // 当日已对峙则不重复触发和好
                }

                // 2) 和好：已对峙过、好感养回≥55、未和好过、仍有情敌
                if (h.reconcileId && aff >= 55 && hasEventTriggered(h.eventId)
                    && !hasEventTriggered(h.reconcileId) && detectRivalRomance(h.id)) {
                    var ev2 = NPC_PERSONAL_EVENTS[h.reconcileId];
                    if (ev2 && (!canPlayerAccessPersonalEvent || canPlayerAccessPersonalEvent(ev2, npc))) {
                        _delayedRivalryFire(h.reconcileId, npc);
                    }
                }
            }
        } catch (e) { console.warn('[吃醋线] 每日触发失败:', e); }
    });
}

// 延迟弹出，模拟「她叫住你」；弹出前再过一次门禁
function _delayedRivalryFire(evId, npcInst) {
    setTimeout(function() {
        if (document.querySelector && document.querySelector('.personal-event-modal')) return;
        var ev = NPC_PERSONAL_EVENTS[evId];
        if (!ev) return;
        if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npcInst)) return;
        if (typeof triggerPersonalEvent === 'function') triggerPersonalEvent(evId);
    }, 1200);
}
if (typeof window !== 'undefined') window._delayedRivalryFire = _delayedRivalryFire;

// ============ 导出 ============
if (typeof window !== 'undefined') {
    window.HEROINE_ROSTER = HEROINE_ROSTER;
    window.detectRivalRomance = detectRivalRomance;
    window.HEROINE_RIVALRY_EVENTS = HEROINE_RIVALRY_EVENTS;
    window.HEROINE_RECONCILE_EVENTS = HEROINE_RECONCILE_EVENTS;
}
console.log('[吃醋线] 女主角吃醋/互动系统加载完成：' + Object.keys(HEROINE_RIVALRY_EVENTS).length + ' 个对峙事件 + ' + Object.keys(HEROINE_RECONCILE_EVENTS).length + ' 个和好事件');
