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

// v20.73：名册补 amId/finaleId 两字段——heroine-aftermath.js 的道侣回访钩子读的是
// window.HEROINE_ROSTER（旧条目缺这两字段，回访事件一直触发不了的死路，此处一并修通）；
// 夙孤鸿（峨眉派）入册，对峙/和好事件见本文件 em_event_rival / em_event_reconcile。
// v20.74：晏万解（唐门）入册——第六位女主，对峙/和好事件见本文件 tm_event_rival / tm_event_reconcile。
// v20.75：瀛晚照（蓬莱派）入册——第七位女主，对峙/和好事件见本文件 pl_event_rival / pl_event_reconcile。
// v20.76：祁清禅（恒山派）、岳清晓（泰山派）、幽翠微（青城派）、奚湘筠（衡山派）入册——第八至十一位女主，
//   对峙/和好事件见本文件 heng/tai/qing/xiang 前缀的 _event_rival / _event_reconcile；钩子逻辑对名册泛化，未动。
// v20.77：耿雪衣（血手门）、拓银沙（飞蝎坞）、伏璃茵（烈日教）、檀望舒（天龙教）入册——第十二至十五位女主，
//   对峙/和好事件见本文件 xue/xie/lie/long 前缀的 _event_rival / _event_reconcile；钩子逻辑对名册泛化，未动。
//   反派阵营纪律：对峙背景在各自门派（药庐/沙漠/圣火龛后廊/传声房档房），组织黑暗只做氛围侧写，
//   不写阵营洗白、不写首领出场、不写血腥惨状。信物独占：白药方子只属于耿雪衣、蝎册金蝎壳只属于拓银沙、
//   灯芯只属于伏璃茵、铜镜石片只属于檀望舒。伏璃茵仰头哭额度已在主线用尽——吃醋桩不写她哭；
//   檀望舒的本声只属于主线与终章——吃醋桩台词全部带「（用XX的调子）」标注，本声一次不出现。
// v20.78：戚巧机（神机门）、裘霜莺（铁掌帮）、姬云锦（昆仑派）、翀玉衡（全真教）入册——第十六至十九位女主，
//   对峙/和好事件见本文件 sj/tz/kl/qz 前缀的 _event_rival / _event_reconcile；钩子逻辑对名册泛化，未动。
//   专属语言系统纪律：戚巧机＝误差/齿数比/游隙/算不出（对物说话，人前短句），裘霜莺＝哨语三句/凶脸/素坯泥哨
//   （短句凶腔耳根红，不借任何人的腔），姬云锦＝舞谱/名目/步位/读舞（剑舞谱，零乐器，卡壳就擦剑捻素绸），
//   翀玉衡＝记/此债记账/利息/两讫/全押/存疑（功业账，零酒字，账房腔越正经越重）。「算不出」「全押」是各自
//   终章题眼——吃醋桩只呼应、不抢说。四人之间、与既有十五位之间意象不串用。
// v20.79：竺照禅（少林寺）入册——第二十位女主，对峙/和好事件见本文件 shao 前缀的 _event_rival / _event_reconcile；
//   钩子逻辑对名册泛化，未动。专属语言系统纪律：竺照禅＝批注/功课/佛号/戒律/栴檀林（佛相毒舌的比丘尼戒师，
//   骂人先合十念阿弥陀佛再引经据典；信物批注经＋盘得发亮的念珠；执念是骂遍天下人、关于你的那句最锋利的批注
//   落不下去——那一页始终空白）。motif 禁区：恒山比丘尼线的整套功课法器、嵩山出家人的衣装、峨眉的责具、
//   全真账房的禁字、伏璃茵的火器、檀望舒的镜与调子标注，一概不碰；与既有十九位意象零串用。
var HEROINE_ROSTER = [
    { id: 'sect_leader_百花谷', name: '温蘅', sect: '百花谷', eventId: 'bh_event_rival', reconcileId: 'bh_event_reconcile', amId: 'bh_event_aftermath', finaleId: 'bh_event_014' },
    { id: 'sect_leader_修罗宫', name: '绯泪', sect: '修罗宫', eventId: 'xl_event_rival', reconcileId: 'xl_event_reconcile', amId: 'xl_event_aftermath', finaleId: 'xl_event_033' },
    { id: 'sect_leader_天山派', name: '琤霄凌', sect: '天山派', eventId: 'ts_event_rival', reconcileId: 'ts_event_reconcile', amId: 'ts_event_aftermath', finaleId: 'ts_event_013' },
    { id: 'sect_leader_五仙教', name: '蓝凤凰', sect: '五仙教', eventId: 'wx_event_rival', reconcileId: 'wx_event_reconcile', amId: 'wx_event_aftermath', finaleId: 'wx_event_013' },
    { id: 'sect_leader_峨眉派', name: '夙孤鸿', sect: '峨眉派', eventId: 'em_event_rival', reconcileId: 'em_event_reconcile', amId: 'em_event_aftermath', finaleId: 'em_event_013' },
    { id: 'sect_leader_唐门', name: '晏万解', sect: '唐门', eventId: 'tm_event_rival', reconcileId: 'tm_event_reconcile', amId: 'tm_event_aftermath', finaleId: 'tm_event_013' },
    { id: 'sect_leader_蓬莱派', name: '瀛晚照', sect: '蓬莱派', eventId: 'pl_event_rival', reconcileId: 'pl_event_reconcile', amId: 'pl_event_aftermath', finaleId: 'pl_event_013' }, // v20.75 瀛晚照入册
    { id: 'sect_leader_恒山派', name: '祁清禅', sect: '恒山派', eventId: 'heng_event_rival', reconcileId: 'heng_event_reconcile', amId: 'heng_event_aftermath', finaleId: 'heng_event_013' }, // v20.76 祁清禅入册
    { id: 'sect_leader_泰山派', name: '岳清晓', sect: '泰山派', eventId: 'tai_event_rival', reconcileId: 'tai_event_reconcile', amId: 'tai_event_aftermath', finaleId: 'tai_event_013' }, // v20.76 岳清晓入册
    { id: 'sect_leader_青城派', name: '幽翠微', sect: '青城派', eventId: 'qing_event_rival', reconcileId: 'qing_event_reconcile', amId: 'qing_event_aftermath', finaleId: 'qing_event_013' }, // v20.76 幽翠微入册
    { id: 'sect_leader_衡山派', name: '奚湘筠', sect: '衡山派', eventId: 'xiang_event_rival', reconcileId: 'xiang_event_reconcile', amId: 'xiang_event_aftermath', finaleId: 'xiang_event_013' }, // v20.76 奚湘筠入册
    { id: 'sect_leader_血手门', name: '耿雪衣', sect: '血手门', eventId: 'xue_event_rival', reconcileId: 'xue_event_reconcile', amId: 'xue_event_aftermath', finaleId: 'xue_event_013' }, // v20.77 耿雪衣入册
    { id: 'sect_leader_飞蝎坞', name: '拓银沙', sect: '飞蝎坞', eventId: 'xie_event_rival', reconcileId: 'xie_event_reconcile', amId: 'xie_event_aftermath', finaleId: 'xie_event_013' }, // v20.77 拓银沙入册
    { id: 'sect_leader_烈日教', name: '伏璃茵', sect: '烈日教', eventId: 'lie_event_rival', reconcileId: 'lie_event_reconcile', amId: 'lie_event_aftermath', finaleId: 'lie_event_013' }, // v20.77 伏璃茵入册
    { id: 'sect_leader_天龙教', name: '檀望舒', sect: '天龙教', eventId: 'long_event_rival', reconcileId: 'long_event_reconcile', amId: 'long_event_aftermath', finaleId: 'long_event_013' }, // v20.77 檀望舒入册
    { id: 'sect_leader_神机门', name: '戚巧机', sect: '神机门', eventId: 'sj_event_rival', reconcileId: 'sj_event_reconcile', amId: 'sj_event_aftermath', finaleId: 'sj_event_013' }, // v20.78 戚巧机入册
    { id: 'sect_leader_铁掌帮', name: '裘霜莺', sect: '铁掌帮', eventId: 'tz_event_rival', reconcileId: 'tz_event_reconcile', amId: 'tz_event_aftermath', finaleId: 'tz_event_013' }, // v20.78 裘霜莺入册
    { id: 'sect_leader_昆仑派', name: '姬云锦', sect: '昆仑派', eventId: 'kl_event_rival', reconcileId: 'kl_event_reconcile', amId: 'kl_event_aftermath', finaleId: 'kl_event_013' }, // v20.78 姬云锦入册
    { id: 'sect_leader_全真教', name: '翀玉衡', sect: '全真教', eventId: 'qz_event_rival', reconcileId: 'qz_event_reconcile', amId: 'qz_event_aftermath', finaleId: 'qz_event_013' }, // v20.78 翀玉衡入册
    { id: 'sect_leader_少林寺', name: '竺照禅', sect: '少林寺', eventId: 'shao_event_rival', reconcileId: 'shao_event_reconcile', amId: 'shao_event_aftermath', finaleId: 'shao_event_013' } // v20.79 竺照禅入册
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

// ============ 二十位女主角的吃醋对峙事件 ============
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
    },
    // ---- 夙孤鸿：戒律首座不质问，她点名 ----
    'em_event_rival': {
        id: 'em_event_rival', npcId: 'sect_leader_峨眉派', title: '点名', icon: '📿',
        desc: '金顶夜巡点名，她把你的名签翻了出来。',
        minAffection: 45, trigger: { random: 1.0 }, cooldown: 0, flag: 'em_e_rival_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '金顶，亥时夜巡点名。她一签一签念过去，念到你名下——停了。她把簿子往回翻，一页一页，把你近来缺席的日子，当着满阶弟子，一个不落念了出来。', type: 'description' },
            { speaker: 'npc', text: '「峨眉戒六条，第二条：不欺。」她合上簿子，木戒尺横在掌心，终于抬眼看你，「你心里有了人。日子，你以为我数不出来？」' },
            // v20.26 好感以 effects 真源为准（有无道侣两档），选项行不标数
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「不瞒你。我心里确实有了人。」', effect: 'admit' },
                { text: '「点你的名便是，扯什么心事。」', effect: 'deny' },
                { text: '一言不发，在金顶石上单膝跪下，领戒', effect: 'kneel' }
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
                        ? '她盯着你看了很久，把戒尺收回袖中——收比打重。「……道侣。」她重复这两个字，金顶的夜风掀起她衣角，「好。你的名签，我自己划。峨眉的戒，管不了已有主的人。」她转过身去，「走吧。今夜起，巡山的台阶，我一个人走。」'
                        : '她极轻地「嗯」了一声，把簿子合上。「……' + rival.name + '。」名签落在页上，咔的一声，她用戒尺压住，「记下了。峨眉不抢人，峨眉等人自己回头。」她抬了抬下巴，「回去想清楚。想清楚了，来戒堂领罚。」';
                    break;
                case 'deny':
                    aff = dao ? -18 : -11;
                    msg = '她笑了——金顶上你见过她笑，屈指可数，这一次没有温度。「扯？」她把簿子重新翻开，一页页念给你听：「某日，你未来。某日，你未来。某日——猴王下山接的人，我在金顶望见了。」她合簿，「戒尺打的是手，不是心。心烂了的，峨眉的戒管不了——我也懒得管。」她拂袖入云雾，「去吧。点名，散了。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 15);
                    break;
                case 'kneel':
                    aff = dao ? -2 : 5;
                    msg = dao
                        ? '你跪下。她站着没动，戒尺抬起来——终究没有落。「……你与' + rival.name + '都结了道侣契，还来领峨眉的戒。」她声音哑了。她俯身，把你衣领扶正，像扶一个犯戒的弟子，「起来。戒，我打不下去。不是舍不得——是你把心放在别人那里了，我这把尺，没有立场管你。」夜风过处，她先别开了脸。'
                        : '你跪下。戒尺落下来——落在你肩上，轻得像掸雪。「……你倒敢跪。」她俯视着你，眼底有什么东西晃了一下，又按住，「起来。峨眉的戒罚行不罚心。你的心思野了，戒管不着。」她把戒尺收回袖中，半晌，补了一句，轻得几乎散在夜风里，「但你肯跪——我记着。哪天你想清楚了，再来领罚，我等着。」';
                    if (npc.relationship && !dao) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 晏万解：制毒的人不质问，她验。银针一搭，针色替她说话 ----
    'tm_event_rival': {
        id: 'tm_event_rival', npcId: 'sect_leader_唐门', title: '针色', icon: '🪡',
        desc: '她以银针探你腕间，针色变了。',
        minAffection: 45, trigger: { random: 1.0 }, cooldown: 0, flag: 'tm_e_rival_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '毒堂偏院。你一进门就看见了——那座小丹炉拆散了：炉架、火门、三十六枚机簧，一件一件码在案上，码得整整齐齐。她坐在案后，白丝手套褪了一只，指间捻着一根银针。', type: 'description' },
            { speaker: 'npc', text: '「来得正好。」她抬眼，唇角带笑，眼底不带，「伸手。」' },
            { speaker: 'narrator', text: '银针在你腕间一探，捻、提——针色变了。她盯着那截针看了很久，久到灯花爆了一声。', type: 'description' },
            { speaker: 'npc', text: '「三分药气，不是我毒堂的路数。」她把银针搁回针囊，声音还是软的，软得像淬了毒的棉，「你身上有别人的药。你上山的日子，我也数得出来——一天比一天稀。」' },
            // v20.26 好感以 effects 真源为准（有无道侣两档），选项行不标数
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「不瞒你。我心里确实有了人。」', effect: 'admit' },
                { text: '「一针定人的罪？堂主这回，验错了。」', effect: 'deny' },
                { text: '取出她缝的那双布手套戴上，把双手摊到她面前', effect: 'glove' }
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
                        ? '她把那只褪下的手套，一根手指一根手指地戴了回去。「……道侣。」她念这两个字，像在念一味配错的药。案上拆散的炉子，她没再装，「好。往后你的时辰，不必我记了——' + rival.name + '会替你记。」她起身吹了灯，「下山罢。蜀道湿滑，你那位道侣，该心疼了。」'
                        : '她极轻地「嗯」了一声，把银针收进针囊，囊口抽得很紧。「……' + rival.name + '。」她重复了一遍这个名字，「记下了。唐门不抢人——毒谱上也没写过要抢。」她捏起案上一枚机簧，捏得指节发白，「回去想清楚。想清楚了，来毒堂。炉子我拆着，等你一句话，装回去。」';
                    break;
                case 'deny':
                    aff = dao ? -18 : -11;
                    msg = '她笑了——毒堂里你见过她笑，多半带着刺，这一次连刺都懒得带。「验错？」她把银针重新拈起来，在你眼前转了半圈，「这针淬过我自己腕上的血，三分药气它就变色。' + rival.name + '与你' + (dao ? '连道侣契都结了' : '在一处煎过药') + '——针替你说得比你还清楚。」她抬手把码好的机簧尽数扫落，叮叮当当滚了一地。「你说得对，是我验错了。」她背过身去，「我不该验你。我该验我自己——怎么就信了你。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 15);
                    break;
                case 'glove':
                    aff = dao ? -2 : 5;
                    msg = dao
                        ? '你把手套戴上，双手摊到她面前。她盯着那密得看不见接头的针脚，看了很久——终究没碰。「……你与' + rival.name + '都结了道侣契，还戴着我缝的针脚。」她声音哑下去，「戴上做什么？我说过，戴着我才能碰你。如今我碰不得了。」她把自己的白手套也戴好，一根手指一根手指，「手套你收着。炉子我自己装。走吧。」'
                        : '你把手套戴上，双手摊到她面前。她整个人僵住——那是她亲手缝的，针脚密得看不见接头。她抬眼看你，眼底那层冷一寸一寸裂开：「……你倒记得我说过的话。」她伸出褪了手套的那只手，极慢地覆上你的手背，指尖在抖，「戴着手套碰你，是护你。」她忽然把手抽回去，攥进袖中，「可你戴着它，牵过别人的手——脏的是我这层布。」她别过脸，半晌，「手套别摘。摘了……我怕我舍不得再生气。」';
                    if (npc.relationship && !dao) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 瀛晚照：观汐台的执录不质问，她报数目。日子她数得比潮还准 ----
    'pl_event_rival': {
        id: 'pl_event_rival', npcId: 'sect_leader_蓬莱派', title: '你上岸的日子', icon: '🐚',
        desc: '她翻图录翻到你名下那一页，日子一天一天报给你听。',
        minAffection: 45, trigger: { random: 1.0 }, cooldown: 0, flag: 'pl_e_rival_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '观汐台，晚潮将起。她立在录案边翻图录——翻到你名下那一页，停了。海风把纸页吹得哗哗响，她的指尖按在那一行上，按得很实。', type: 'description' },
            { speaker: 'npc', text: '「你上岸的日子。」她没有抬头，报数目，一字不多，「这个月，四日。上个月，十一日。上上个月，十九日。」' },
            { speaker: 'npc', text: '她合上图录，纸页在风里响成一片。她终于抬眼看你，目光还是稳的，只有袖口收紧了：「潮信不许错。你——也不许。」' },
            // v20.26 好感以 effects 真源为准（有无道侣两档），选项行不标数
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「不瞒你。我心里确实有了人。」', effect: 'admit' },
                { text: '「潮信是准的。人心，不在潮信里。」', effect: 'deny' },
                { text: '取出她给的那只旧螺贴上耳，当着她的面，听潮', effect: 'conch' }
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
                        ? '她盯着你看了三息——她数息也数得准。「……道侣。」两个字从她嘴里出来，像录进册子的两个字。她重新翻开图录，提笔，在你名下添了一行小注：字很工整，墨透过了纸背。「好。往后你上岸的日子，不必我记了——' + rival.name + '会替你记。」她吹了灯，台上只剩潮声，「下台罢。台沿滑。」'
                        : '她极轻地「嗯」了一声，合上图录。「……' + rival.name + '。」她把这个名字记在页角，字很小，一笔一笔却工整，「记下了。观汐台不抢人——潮，也不抢岸。」她搁下笔，「回去想清楚。想清楚了，上台来。你名下这一页，我留着空，等你一句话补满。」';
                    break;
                case 'deny':
                    aff = dao ? -18 : -11;
                    msg = '她不争，只把图录重新翻开，一页一页念给你听：「本月初三，戌时，你未来。初六，未来。初九——」她顿了一息，「初九那日，' + rival.name + '门里的人，在渡口看见你。潮信不许错；我的眼睛，也不许错。」她合上册子，声音很轻，「我原把你记作时辰不差的人。今日这一笔，我划了。」她把图录抱回架前，背对着你，「潮不骗人。人骗。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 15);
                    break;
                case 'conch':
                    aff = dao ? -2 : 5;
                    msg = dao
                        ? '你取出旧螺，贴上耳。潮声一层一层涌进来。她盯着你手里那只螺——银线的裂，磨亮的螺身，二十年，如今在你手里。她看了很久，声音哑下去：「……结了道侣契的人，还听着我给的潮。」她转头看海，「听见潮，就是我在想你——这话录下了，我不划。」半晌，「只是往后这潮，你听你的。台，少上。」'
                        : '你取出旧螺，贴上耳。潮声一层，又一层。她盯着你手里那只螺，海风哗哗地翻她的图录，她忽然伸手把纸页按住，按得极实。「……你记得我说过的话。」她低下头，耳根红了，声音还是平的，「听见潮，就是我在想你。今日的潮——我比昨日多想了一回。」她合上图录，「' + rival.name + '的事，你自己了断。观汐台的页空着，我等一个时辰不错的人。」';
                    if (npc.relationship && !dao) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 祁清禅：抄经的木鱼乱了一拍，回向页写乱了 ----
    'heng_event_rival': {
        id: 'heng_event_rival', npcId: 'sect_leader_恒山派', title: '木鱼乱了一拍', icon: '🪷',
        desc: '晚课的木鱼，她敲乱了一拍。',
        minAffection: 45, trigger: { random: 1.0 }, cooldown: 0, flag: 'heng_e_rival_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '抄经堂，灯下。她端坐抄着《华严经》，袖里那只旧木鱼搁在案角。你进来时，木鱼声顿了半拍，才又续上——像心里被什么撞了一下。', type: 'description' },
            { speaker: 'npc', text: '她搁下笔，把镇纸下那页回向页翻了过来——那半页空白里，写着的俗家名字，墨迹乱了。「……抄不下去了。」' },
            { speaker: 'npc', text: '她抬眼看你，灯影里眼睛很静，只有捏着木鱼的指尖收紧了些：「抄经六年，木鱼没乱过一拍。今夜乱了——乱在你来了。」' },
            // v20.26 好感以 effects 真源为准（有无道侣两档），选项行不标数
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「不瞒你。我心里确实有了人。」', effect: 'admit' },
                { text: '「木鱼在你手里，乱了与我何干。」', effect: 'deny' },
                { text: '取出她袖里那只旧木鱼，替她敲三声，把这一晚的回向做完', effect: 'fish' }
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
                        ? '她盯着你看了很久，把那页乱了的回向页扣了回去——压在镇纸底下。「……道侣。」她念这两个字，像替别人念一句回向。袖里的木鱼，她没有再敲。「好。往后你的时辰，我不必抄了——' + rival.name + '会替你抄。」她吹了灯，抄经堂里只剩山夜，「下山罢。石阶上有露，滑。」'
                        : '她极轻地「嗯」了一声，把那页乱了的回向页折好，压回镇纸下。「……' + rival.name + '。」她把这个名字念了一遍，一笔一笔很稳，像把它抄进经里，「记下了。白云庵不抢人——回向十方众生，也回向放下。」她重新提笔，「回去想清楚。想清楚了，上山来。回向页这一页，我留着空白，等你一句话补满。」';
                    break;
                case 'deny':
                    aff = dao ? -18 : -11;
                    msg = '她不争，只把那页回向页重新翻过来，一笔一笔念给你听：头一年抄的是谁的名，哪一日木鱼乱过一回——「华严经不许妄语；我的木鱼，也不许。」她合上经，「我原把你抄作心不定的人。今夜这一笔，我划了。」她背过身去，木鱼再没有响，「去罢。回向众生——不回向欺我的人。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 15);
                    break;
                case 'fish':
                    aff = dao ? -2 : 5;
                    msg = dao
                        ? '你取出那只旧木鱼，举槌替她敲下去——第一声轻，第二声稳，第三声，她的诵声跟着木鱼声起，把这一晚的回向做完。她盯着你手里的木鱼，铜锔的裂、磨亮的鱼身，六年，如今在你手里。良久，声音哑下去：「……结了道侣契的人，还替我敲木鱼。」她把木鱼收回袖中，「听见木鱼，就是我在想你——这一句抄进回向里了，我不划。」半晌，「只是往后这木鱼，你敲你的。抄经堂，少上。」'
                        : '你取出那只旧木鱼，举槌替她敲下去——第一声轻，第二声稳，第三声，她的诵声跟着木鱼声起。她盯着你手里的木鱼，灯影落在那道铜锔的裂上，忽然伸手把经页按住。「……你记得我说过的话。」她低下头，耳根红了，声音还是轻的，「听见木鱼，就是我在想你。今夜的木鱼——我比昨夜多想了一回。」她把木鱼收回袖中，「' + rival.name + '的事，你自己了断。白云庵这半页回向空着，我等一个心定的人。」';
                    if (npc.relationship && !dao) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 岳清晓：临火人不绕弯，把你堵在火坛边当面说 ----
    'tai_event_rival': {
        id: 'tai_event_rival', npcId: 'sect_leader_泰山派', title: '当面说', icon: '🔥',
        desc: '她把你堵在火坛边，当面直说。',
        minAffection: 45, trigger: { random: 1.0 }, cooldown: 0, flag: 'tai_e_rival_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '玉皇顶，寅时未明。她立在火坛边，火钩扛在肩上，炭火烧得通红。你上来，她不躲闪，也不绕弯，转身正对着你——眼睛比火还亮，只是这亮里带着气。', type: 'description' },
            { speaker: 'npc', text: '「我看见了。」她把火钩往炭堆里一顿，火星子跳起来，「你心里有了别人。这事我不闷着、不藏着——当面跟你说。」' },
            { speaker: 'npc', text: '她盯着你，火光在脸上跳：「一千次日出我都看着，没误过一回。你这一桩，我也数着——数着数着，数不明白了。」' },
            // v20.26 好感以 effects 真源为准（有无道侣两档），选项行不标数
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「不瞒你。我心里确实有了人。」', effect: 'admit' },
                { text: '「你想多了。」', effect: 'deny' },
                { text: '取出那幅「日」字摩崖拓片，当着她的面，就着火光举给她看', effect: 'rubbing' }
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
                        ? '她愣住，手里的火钩差点掉，她接住，攥紧了。「……道侣。' + rival.name + '。」她笑了一声，笑得比哭还直白。她转身去拨炭，火苗腾起来，照着她半张脸，「好。往后你的时辰，我不必数了——' + rival.name + '会替你数。」她合上档册，封皮上写了三个字，写得很重：不临火。「下山罢。第一缕日头，往后我一个人迎。」'
                        : '她极轻地「嗯」了一声，把火钩扛回肩上。「……' + rival.name + '。」她把这个名字说出来，直得像报时辰，「记下了。火坛不抢人——第一缕日头，谁早起归谁。」她拨了拨炭，「回去想清楚。想清楚了，上顶来。火坛左手边那个位置，我空着，等你一句话填上。」';
                    break;
                case 'deny':
                    aff = dao ? -18 : -11;
                    msg = '她不争，只把那本临火档册翻开，一页一页念给你听：这个月哪一日、什么时辰你上顶，哪一日你没来——她顿了一息，「没来那日，' + rival.name + '与你' + (dao ? '连道侣契都结了' : '在山下我看见了') + '。火坛不许误；我的眼睛，也不许误。」她合上册子，「我原把你记作守火的人。今夜这一笔，我划了。」她背过身，火钩拨炭拨得哗啦响，「日头天天出——看不看，它都出。你走罢。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 15);
                    break;
                case 'rubbing':
                    aff = dao ? -2 : 5;
                    msg = dao
                        ? '你取出那幅「日」字摩崖拓片，就着火光举起来——圆廓里那一横亮得极透，像纸里封着光。她盯着那拓片，看了很久，声音低下去：「……结了道侣契的人，还收着我拓了十年的『日』。」她转头看东边的天，「见了这『日』，就是见了我——这话我说过，记下了，不划。」半晌，「只是往后这『日』，你看你的。火坛，少上。」'
                        : '你取出那幅「日」字摩崖拓片，就着火光举起来。她盯着那拓片上圆廓的一横，火光映在她脸上，忽然伸手把档册按住。「……你记得我说过的话。」她低下头，耳根红了，话还是直的，「见了这『日』，就是见了我。今日的日头——我比昨日多看了一眼。」她把档册收好，「' + rival.name + '的事，你自己了断。火坛左手边那个位置空着，我等一个守火的人。」';
                    if (npc.relationship && !dao) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 幽翠微：焙房的茶炒过了火，头一回 ----
    'qing_event_rival': {
        id: 'qing_event_rival', npcId: 'sect_leader_青城派', title: '茶炒过了火', icon: '🍵',
        desc: '焙房里那一锅，她炒过了火——头一回。',
        minAffection: 45, trigger: { random: 1.0 }, cooldown: 0, flag: 'qing_e_rival_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '青城后山茶园，焙房。你还没进门就闻见了——锅里那一撮雪茶炒过了火，焦气。她立在灶前，茶夹还捏在手里，手背上新旧烫痕叠着，今日又添了一道。', type: 'description' },
            { speaker: 'npc', text: '「火候走神了。」她没回头，语速快，快得有点空，「我守这焙房的火八年，误一息就是一年的味——今日误了。」她终于转身，眼睛在灯下亮得很，「误在你上山。」' },
            { speaker: 'npc', text: '她把茶夹搁下：「我这人嘴快，不绕弯。你心里有了人。这锅过火的茶——你说，是谁的错。」' },
            // v20.26 好感以 effects 真源为准（有无道侣两档），选项行不标数
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「不瞒你。我心里确实有了人。」', effect: 'admit' },
                { text: '「你想多了。」', effect: 'deny' },
                { text: '坐到灶前，接过茶夹，替她看住这一锅的火候', effect: 'fire' }
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
                        ? '她愣住，那锅过火的茶，她一撮一撮拣出来倒掉，倒得干净。「……道侣。' + rival.name + '。」她把这三个字说得很快，快得滴水不漏，随即把手在围裙上擦了擦，擦得很干。「好。往后你的时辰，我不必数了——' + rival.name + '会替你数。」她把架顶那只旧茶罐往最高一格推了推，「下山罢。蜀道湿滑，你那位道侣，该心疼了。」'
                        : '她极轻地「嗯」了一声，把茶夹搁回灶上。「……' + rival.name + '。」她把这个名字说了一遍，快，「记下了。茶园不抢人——旧罐认茶，茶认看火的人。」她挑起那撮过火的茶，「回去想清楚。想清楚了，上山来。茶园东头那块看云石，我给你留着，等你一句话。」';
                    break;
                case 'deny':
                    aff = dao ? -18 : -11;
                    msg = '她不争，只把那只旧罐翻过来，罐底压着的字条一行一行念给你听：雹灾夜押粮的是谁，采药道押后的是谁，竹林里听她半宿没劝一句的是谁——「都记着。你说我想多了——' + rival.name + '与你' + (dao ? '连道侣契都结了' : '在一处喝过茶') + '，满山都知道，你当我这茶夹是摆设？」她把那撮过火的茶尽数倒进灶火，白烟腾起一股。「走罢。茶炒过了，我重炒。看走了眼的人——我不重看了。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 15);
                    break;
                case 'fire':
                    aff = dao ? -2 : 5;
                    msg = dao
                        ? '你坐到灶前，接过茶夹，替她看这一锅过了火的茶。她盯着你手上的茶夹，看了很久——终究没拦。「……都结了道侣契了，还替我看火。」声音低下去。她把茶夹接回去，「茶不掺假，人也不掺假——这话我说过，记下了，不划。」半晌，「只是往后这火，你看你的。焙房，少来。」'
                        : '你坐到灶前，接过茶夹，替她看这一锅的火候。她整个人僵住——那茶夹是她的命，如今在你手里。她抬眼看你，眼底那层焦躁一寸一寸裂开：「……你记得我说过的话。」她伸手扶住你执夹的手腕，指尖在抖，「火，退半根柴——风门开一线。」她忽然把手抽回去，「' + rival.name + '的事，你自己了断。我那只旧罐搁在架上，等一个懂火候的人。」';
                    if (npc.relationship && !dao) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 奚湘筠：那半阙《潇湘夜雨》，今夜停了一音 ----
    'xiang_event_rival': {
        id: 'xiang_event_rival', npcId: 'sect_leader_衡山派', title: '停了一音', icon: '🎻',
        desc: '那半阙《潇湘夜雨》，今夜停了一音。',
        minAffection: 45, trigger: { random: 1.0 }, cooldown: 0, flag: 'xiang_e_rival_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '衡山回雁琴台，夜雨细密。她抱着胡琴拉那半阙《潇湘夜雨》——十年，从没差过一板。今夜，琴弓在弦上顿了顿，停了一音。她袖里那块松香，捏得紧了些。', type: 'description' },
            { speaker: 'npc', text: '她收了弓，没回头，只说了两个字：「……你来了。」雨落着，她把琴弦一根一根拭过去，拭得很慢，「这半阙，十年没停过。今夜停了——你听出来了。」' },
            { speaker: 'npc', text: '她终于回头，眼神温温的，却慢：「话，我放在乐音里。这一音停的——是你。」' },
            // v20.26 好感以 effects 真源为准（有无道侣两档），选项行不标数
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「不瞒你。我心里确实有了人。」', effect: 'admit' },
                { text: '「你想多了。」', effect: 'deny' },
                { text: '取出那块松香，替她把弓毛擦三下，听她把这半阙拉完', effect: 'rosin' }
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
                        ? '她盯着雨幕，看了很久，手里的琴弓慢慢收拢。「……道侣。」她只说了这两个字，没有下文。良久，把那半阙旧谱收进谱匣，上了锁。「往后这曲子，我不必拉给你听了——' + rival.name + '会听。」她抱起胡琴下台，背影很直，「走罢。夜雨路滑。」'
                        : '她极轻地「嗯」了一音，像在谱上按了一个板眼。「……' + rival.name + '。」她把这个名字说得很慢，「记下了。回雁琴台不抢人——松香，只认一双手。」她把琴弓收好，「回去想清楚。想清楚了，上台来。台侧那个蒲团，我留着，等你一句话。」';
                    break;
                case 'deny':
                    aff = dao ? -18 : -11;
                    msg = '她不争，只把那半阙旧谱摊开，一页一页指给你看——檐下听半阙的、雾夜提灯的、香火会守火的、寅时托住弓肘的，每一处板眼旁都有极小的记号。「谱上没写名字。」她的声音很低，「可每一处记号——都是你。你说我想多了——' + rival.name + '与你' + (dao ? '连道侣契都结了' : '在一处走过旱路') + '，满山的雨都听见了，你当我这耳朵是摆设？」她合上谱，琴弓横在弦上，把一声极短的锐音掐断在雨里，「走罢。这半阙，今夜不拉了。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 15);
                    break;
                case 'rosin':
                    aff = dao ? -2 : 5;
                    msg = dao
                        ? '你取出那块松香，替她把弓毛擦了三下——不多，不少，十六年的规矩。她盯着你的手，看了很久——终究没抽开。「……都结了道侣契了，还替我擦松香。」声音哑下去，「雨里闻到松香，就是我在想你——这话我说过，不划。」半晌，「只是往后这弓，你擦你的。琴台，少上。」'
                        : '你取出那块松香，替她把弓毛擦了三下。她整个人僵住——那松香她捏了十六年，指窝都磨出来了，如今在你手里。她抬眼看你，眼底那层凉一寸一寸裂开：「……你记得我说过的话。」她拉了一弓，起音半句，又收住，「雨里闻到松香，就是我在想你。今夜——我比昨夜多想了一回。」她把松香收回袖中，「' + rival.name + '的事，你自己了断。琴台的蒲团空着，我等一个听雨的人。」';
                    if (npc.relationship && !dao) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 耿雪衣：不吵不闹，只是平的裂缝——报数报重、碾药过头（v20.77 血手门） ----
    'xue_event_rival': {
        id: 'xue_event_rival', npcId: 'sect_leader_血手门', title: '报数报重了', icon: '🌿',
        desc: '她把今天的数目报了两遍——她从没报错过。',
        minAffection: 45, trigger: { random: 1.0 }, cooldown: 0, flag: 'xue_e_rival_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '药庐，灯下。她在碾药，药碾子骨碌、骨碌，比平时轻。你进来，她没抬头，照旧报今天的数目：「今天抬进来三个，都缝好了。」停了一息，又报了一遍：「今天抬进来三个，都缝好了。」——同一句话，报重了。她报数八年，从没重过。', type: 'description' },
            { speaker: 'npc', text: '她终于停了碾子。碾盘里那撮白药碾过了头——白药末要碾到细沙那样粗，今天碾成了粉。她把药末扫进纸包，语气平得像报天气：「你和别人赶集的日子，我在方子上记了一笔。」她把那张方子推过来——药味底下，多了一行小字，写着一个日子。「不是病，是日子。」' },
            { speaker: 'npc', text: '她抬眼看你，目光还是干净的，声音还是轻的，只是没有再碾药：「我学医八年，认脉从没认错。今天认自己的脉，认不出来。」她把手拢在药碾子上，「你说——这算什么症？」' },
            // v20.26 好感以 effects 真源为准（有无道侣两档），选项行不标数
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「不瞒你。我心里确实有了人。」', effect: 'admit' },
                { text: '「你认错了。赶集就是赶集。」', effect: 'deny' },
                { text: '取出她开的那张头一张伤风方子，当着她的面，把药味一味一味报给她听', effect: 'recipe' }
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
                        ? '她盯着你看了很久，把那张记了日子的方子对折，收进那一沓方纸的最深处。「……道侣。」她把这两个字嚼了一遍，像在尝一味陌生的药。「好。往后你的日子，我不必记了——' + rival.name + '会替你记。」她吹了灯，药庐暗下来，只有篱笆外一畦白药还香着，「下山罢。关外雪深，脚下看着点。」'
                        : '她极轻地「嗯」了一声，把那张方子收回去，抚平，折好，压回镇纸底下。「……' + rival.name + '。」她把这个名字报了一遍，平的，像报一个数目，「记下了。药庐不抢人——药碾子认药，人认自己的心。」她把药碾子拉回手边，「回去想清楚。想清楚了，来药庐。方子上那一行日子，我留着空白，等你一句话补满。」';
                    break;
                case 'deny':
                    aff = dao ? -18 : -11;
                    msg = '她不争，只把那一沓方纸一本一本翻给你看：哪一日你替她烧过水，哪一日你顶雪讨回老姜，哪一日集市报账——每一笔都比方子工整。「药不许『差不多』；我的记性，也不许。」她合上纸沓，「你说我认错了——' + rival.name + '与你' + (dao ? '连道侣契都结了' : '在一处赶过集、吵过菜价的架') + '，关外三十里都传遍了，你当我药庐的耳朵是摆设？」她把那撮碾过头的药末尽数扫进灶火，白烟腾起一股。「走罢。这撮药，我重碾。看走了眼的人——我不重看了。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 15);
                    break;
                case 'recipe':
                    aff = dao ? -2 : 5;
                    msg = dao
                        ? '你取出那张头一张伤风方子，就着灯一味一味报给她听：姜三片，枣五枚，葱白两段。她盯着你手里那张方子，看了很久——终究没有收回去。「……结了道侣契的人，还收着我的方子。」声音低下去。她把碾过头的药末包好，「报得出方子，就是没忘——这话我说过，记下了，不划。」半晌，「只是往后这方子，你收你的。药庐，少上。」'
                        : '你取出那张头一张伤风方子，就着灯一味一味报给她听：姜三片，枣五枚，葱白两段，水两碗，煎一碗，热服，覆被取汗。她碾药的手停住——盯着那张方子，灯影落在她干净的眼睛里，那层平一寸一寸裂开：「……你记得我说过的话。」她低下头，耳根红了，声音还是平的，「普通病，要普通的方子。你打的喷嚏，是我八年里最金贵的那种病。」她把方子重新塞回你手里，塞得很实，「' + rival.name + '的事，你自己了断。方子上那行日子空着——我等一个报得出方子的人。」';
                    if (npc.relationship && !dao) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 拓银沙：嘴硬直球——蝎册一合，金蝎翘尾，沙漠式威胁（v20.77 飞蝎坞） ----
    'xie_event_rival': {
        id: 'xie_event_rival', npcId: 'sect_leader_飞蝎坞', title: '蝎册一合', icon: '🦂',
        desc: '她把蝎册当着你的面合上了——生意归生意。',
        minAffection: 45, trigger: { random: 1.0 }, cooldown: 0, flag: 'xie_e_rival_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '入夜的蝎房屋顶，她坐着晒册子。你上来，她还没等你开口，牛皮面的蝎册「啪」地一合，收进怀里——动作比分窝还快。肩上的金蝎尾钩翘起来，翘得老高，冲着你的方向。', type: 'description' },
            { speaker: 'npc', text: '「少废话。」她没看你，看着沙海尽头的星子，嗓门照旧亮，亮里却没有笑，「你心里有人了。生意归生意，情分归情分——可这笔账，我怎么算怎么不明白。」' },
            { speaker: 'npc', text: '她转过头来，眯着眼，一字一顿：「全坞我就标了一个『不蛰』。蝎册三十年没看走眼过——金蝎倒好，冲着你翘尾，冲着别人也翘尾？」她拍了拍怀里的册子，把那句沙漠里的话直直砸出来：「我看上的人，沙漠里还没有抢得动的。你倒说说，这一页，怎么算？」' },
            // v20.26 好感以 effects 真源为准（有无道侣两档），选项行不标数
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「不瞒你。我心里确实有了人。」', effect: 'admit' },
                { text: '「你想多了。哥们一场，扯什么心事。」', effect: 'deny' },
                { text: '取出那具软布包着的金蝎壳，一层一层打开，搁在她掌心', effect: 'shell' }
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
                        ? '她盯着你看了两息，忽然仰头大笑——笑声撞在黄泥墙上弹回来，笑得比哪回都响，响得发狠。「……道侣。' + rival.name + '。」她抹了把笑出来的眼角，把蝎册往怀里又勒紧一分，「好！好啊！」她顺着屋脊滑下去，站起来拍拍沙，下巴还抬着，眼睛却红了，「往后你的账你自己记——坞里这本，我替你合上了。」她大步往蝎房走，「下去罢。沙漠夜里凉，别在我屋顶上冻着。」'
                        : '她「哦」了一声，就一个字，难得这么轻。随即又把蝎册掏出来，翻到最后一页，盯着那两个字看了半晌——没划。「……' + rival.name + '。」她把这个名字报得直直的，「记下了。坞里的册不抢人——蛰不蛰，蝎有蝎的判断。」她把册子收回怀里，「回去想清楚。想清楚了，进坞来。册上那两个字我留着——等你一句话。」';
                    break;
                case 'deny':
                    aff = dao ? -18 : -11;
                    msg = '她不吵，只一把抓过你的手翻过来——虎口上那两个「入行的印」还在。「哥们？」她撒开你的手，掰着指头一笔一笔数：哪一夜分窝你没叫，哪一夜蝎潮你顶了缺口，哪一页生意册她连夜替你划了名——「风把脚印抹了，话抹不了。你说我想多了——' + rival.name + '与你' + (dao ? '连道侣契都结了' : '同走过一条商道、同分过一囊水') + '，整条西线都知道，你当我金蝎的鼻子是摆设？」金蝎顺着她的胳膊爬回肩上，尾钩收得紧紧的。「走罢。蝎册没看走眼过——看走眼的这一页，我自己撕。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 15);
                    break;
                case 'shell':
                    aff = dao ? -2 : 5;
                    msg = dao
                        ? '你取出那具软布包着的金蝎壳，一层一层打开。她盯着那具壳——手伸到一半，停在半空。「……结了道侣契的人，还收着我的壳。」声音低下去，低得哑。金蝎顺着她的胳膊爬到壳边，尾钩在旧壳上轻轻搭了一下。她看了很久：「壳在你手里，就是没忘——这话我说过，记在册子外头，不划。」她把壳一层一层包好，推回你怀里，「只是往后这壳，你收你的。蝎房屋顶，少上。」'
                        : '你取出那具软布包着的金蝎壳，一层一层打开，搁在她掌心。她整个人僵住——那是金蝎头一回蜕的壳，她头一个给你看的，尾钩的弧度还在。她盯着壳，指尖顺着尾钩摸了一遍，摸得极轻：「……你一直带着。」她抬眼看你，耳根红了，话还是直的，「金蝎翘尾是替你急，收尾是替你委屈——它这笔账我认不出来，它自己认得出来。」她把壳推回你掌心，替你把指头一根一根合拢，「' + rival.name + '的事，你自己了断。册上那两个字——我等一个带着壳的人。」';
                    if (npc.relationship && !dao) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 伏璃茵：圣女腔撑不住——仪轨串词、上错「照十方」、事后吐槽连珠炮（v20.77 烈日教） ----
    // 纪律：仰头哭两次额度已在主线用尽——本桩及和解桩全程不许她哭。
    'lie_event_rival': {
        id: 'lie_event_rival', npcId: 'sect_leader_烈日教', title: '照十方', icon: '🎭',
        desc: '大仪上，她把给外客的祝词诵成了「照十方」。',
        minAffection: 45, trigger: { random: 1.0 }, cooldown: 0, flag: 'lie_e_rival_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '正午大仪，你照旧站在香案左边第三根柱子后头。圣女主仪，一炷香一炷香地诵经——诵到给外客的祝词那一段，满场清清楚楚听见她把「尘秽不侵」诵成了「照十方」。那是供高台的仪词，三百年没给外客用过。三百教众无人察觉，高台上的影子纹丝不动。只有你看见：她拢在袖中的手，攥紧了。', type: 'description' },
            { speaker: 'narrator', text: '仪散，殿后烟囱底下。她已经等着了，一见你，语速决堤：「『照十方』！我诵成『照十方』！那段词是供高台用的——我把它诵给了你带来的那位！你知道这算什么吗？算把人家当祖宗牌位供！」她一巴掌拍在烟道上，灰簌簌往下掉，「三百个人，主诵长老，护法团，没一个听出错——就我知道我为什么错！」' },
            { speaker: 'npc', text: '她转身指着你，眼睛亮得急：「你都看见了！你站在柱子后头，看见我攥拳，看见我肩膀绷着，看见我把那个人的名字诵进『照十方』里——你都看见了还不帮我？！」她来回走了两步，圣女宝相碎了一地，「我能怎么办？仪轨说圣女的心要静如圣火——静个鬼！它烧得比圣火台还旺，烧的全是些不能诵的词！」' },
            // v20.26 好感以 effects 真源为准（有无道侣两档），选项行不标数
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「不瞒你。我心里确实有了人。」', effect: 'admit' },
                { text: '「你想多了。串个仪词而已。」', effect: 'deny' },
                { text: '取出那根捻熄过的灯芯，托在她眼前', effect: 'wick' }
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
                        ? '她愣住，连珠炮戛然而止。「……道侣。」这两个字她嚼得很慢，慢得回到圣女语速，眼睛却红着。她忽然笑了一声，笑得比吐槽还累：「好。大仪的客位，往后' + rival.name + '也站得——柱子后头那个位置，不用你站了。」她把圣女冠扶正，冠坠纹丝不动，转身往殿里走，赤金法衣的下摆扫过门槛，「走罢。今日仪散——吐槽役，收工。」'
                        : '她极轻地「嗯」了一声，语速骤降。「……' + rival.name + '。」她把这个名字诵得一个字一个字，像诵经，「记下了。烈日教不抢人——圣火照四方，不照一家。」她朝烟囱瞥了一眼，吐槽腔回来了半分，「回去想清楚。想清楚了，来龛后廊。后台的票就一张——空着，我等一个持票的。」';
                    break;
                case 'deny':
                    aff = dao ? -18 : -11;
                    msg = '她不吵，只掰着指头一笔一笔数：沙暴夜谁压过穹顶，巡井夜谁走过迎风位，东沙丘谁改过她的班表——「守夜房的档全记着名，你当我十二个守夜的是瞎子？你说串个仪词而已——' + rival.name + '与你' + (dao ? '连道侣契都结了' : '在一处走过夜路，被巡夜的祭司瞧了个正着') + '，那句『照十方』就是替那位诵的！」她胸口起伏了两下，硬生生把圣女宝相端回脸上，语速慢回融金：「外客说笑了。圣女的仪，昼夜如一——方才院中的话，是风说的。」她转身入殿。此后一个月，她见你只还标准的圣女颔首——后台的话，再没对你开过。';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 15);
                    break;
                case 'wick':
                    aff = dao ? -2 : 5;
                    msg = dao
                        ? '你取出那根捻熄过的灯芯。她的连珠炮卡在半截——盯着那截焦黑的芯，看了很久，伸手想碰，又收回去。「……结了道侣契的人，还替我收着唯一一次违逆。」声音低下去，低得不属于任何一副面孔，「芯在你手里，灯下的账就没忘——这话我说过，记下了，不划。」她转头看圣火龛的方向，「只是往后这根芯，你收你的。后台——不必来了。」'
                        : '你取出那根捻熄过的灯芯，托在她眼前。她愣住——眼睛钉在那截焦黑的一头上，嘴巴张了张，吐槽役头一回词穷。「你……」她的语速慢慢回来，不是圣女的，是小院里那副，「带着呢。」她伸手把灯芯在你掌心扶正，指尖停了一瞬，耳根红了，嘴还硬：「行。『照十方』是我串的词——串的账我认。全教熄过火的就这一根，知道它的就你一个人。」她把你的手合拢，「' + rival.name + '的事，你自己了断。后台的票就一张——我等一个带芯的。」';
                    if (npc.relationship && !dao) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 檀望舒：最痛的形式——忍不住用情敌的调子对你说话、对残铜镜练语气又擦掉（v20.77 天龙教） ----
    // 纪律：本声只属于主线与终章——本桩台词全部带「（用XX的调子）」标注，本声一次不出现。
    'long_event_rival': {
        id: 'long_event_rival', npcId: 'sect_leader_天龙教', title: '借来的调子', icon: '🪞',
        desc: '她忍不住，用那个人的调子对你说了话。',
        minAffection: 45, trigger: { random: 1.0 }, cooldown: 0, flag: 'long_e_rival_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '传声房，灯下。满墙铜镜牌垂着，旧档房里静得很。你推门进来时，她正坐在镜架前——架上摆着那半面残铜镜，镜面上擦痕一道叠着一道。她对着镜子，在练一个人的语气：尾音怎么挑，停顿落在哪半息。你认得那个调子——是你心里那位的。', type: 'description' },
            { speaker: 'npc', text: '听见门响，她回头。没来得及收，那个调子先从嘴里滑出来：（用你心里那位的调子）「你回来啦。」——两个字，分毫不差，连尾音那点软都一样。话音落地她自己先僵住，脸色一变，急急换了一口声：（用黑袍知客的调子）「传错了。收回。」' },
            { speaker: 'npc', text: '她把残铜镜扣过去——镜面朝下，动作很快，像怕你看清那些擦痕。她回过身，先借护法长老的凶腔把场压住：（用护法长老的调子）「方才那句，无此令！」压完，她自己先泄了气，换讲经长老的沙哑老嗓，一个字一个字，很慢：（用讲经长老的调子）「老身练了一百口声，学谁像谁——今日头一回，练了一口不想像的，收不住。」她瞥了一眼扣着的镜子，换孩子的稚声，很轻：（用孩子的调子）「练了，擦了。擦了三遍，没擦干净。」' },
            // v20.26 好感以 effects 真源为准（有无道侣两档），选项行不标数
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「不瞒你。我心里确实有了人。」', effect: 'admit' },
                { text: '「你想多了。传声房学人说话，本来就是差事。」', effect: 'deny' },
                { text: '取出那半块风磨石片，搁进她掌心', effect: 'stone' }
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
                        ? '她盯着你看了很久，手扶着腰间的铜镜牌——开口是最标准的知客腔：（用黑袍知客的调子）「……道侣。' + rival.name + '。记下了。」传完这一句，知客腔撑不住，换云婆婆的哑嗓，很软：（用云婆婆的调子）「娃儿，往后你叫那个名字，别当着她的面叫——她听了，要拿别人的调子应你。」她把残铜镜从架上收下来，一层一层包进布里，抬眼时眼角红着，声却稳：（用黑袍知客的调子）「下山罢。夜路风大——传声房，今日无令。」'
                        : '她极轻地「嗯」了一声——这一声借的是孩子的稚声，像怕惊动什么：（用孩子的调子）「……' + rival.name + '。」她把这个名字报了一遍，随即换知客腔记档：（用黑袍知客的调子）「记下了。传声房不抢人——令传谁家，牌验谁家。」她把残铜镜重新摆正，镜面朝上，擦痕还在，「回去想清楚。想清楚了，来传声房。镜上留的那半句——等你一句话补满。」';
                    break;
                case 'deny':
                    aff = dao ? -18 : -11;
                    msg = '她不争，只把残铜镜拿起来，托到你面前——镜里半张脸，半张是你的。（用讲经长老的调子）「传声房三条：牌验人，文验令，声验凭。」她把镜子放低，换护法的凶腔，凶腔里却压着抖：（用护法长老的调子）「你说我练声是差事——' + rival.name + '与你' + (dao ? '连道侣契都结了' : '同走过一条夜路') + '，传声房的耳朵辨得出百口声，辨不出一个真字？！」她把镜子往架上一扣，扣得比方才重：（用黑袍知客的调子）「走罢。今夜令传完了——往后传声房，不练你的声。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 15);
                    break;
                case 'stone':
                    aff = dao ? -2 : 5;
                    msg = dao
                        ? '你取出那半块风磨石片——回音壁那夜一人一块的证物。她的眼睛钉在你掌心，手伸到一半，停住。（用云婆婆的调子）「……结了道侣契的人，还替壁收着证物。」声音低下去。她换知客腔，很慢：（用黑袍知客的调子）「石片在你手里，壁就应过你一声——这笔账，传声房不划。」她把残铜镜包好，收回架里，「只是往后这石片，你收你的。档房的灯——少来。」'
                        : '你取出那半块风磨石片，搁进她掌心。她僵住——手指收拢，收得很紧，像怕它长腿跑了。（用孩子的调子）「你一直带着。」她抬眼看你，眼睛在灯下亮得很，换云婆婆的软嗓，软嗓的尾巴却在抖：（用云婆婆的调子）「壁应过你一声。那晚婆婆下山，走得比谁都快——不是怕巡夜，是怕自己的心跳声传得太远，谷里全是回音，藏不住。」她把石片收进袖子，和残铜镜收在一处：（用黑袍知客的调子）「' + rival.name + '的事，你自己了断。传声房的令——等一个带着石片的人。」';
                    if (npc.relationship && !dao) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 戚巧机：把你与别人同行的时辰当误差重算，算到机关雀滴答乱拍（v20.78 神机门） ----
    'sj_event_rival': {
        id: 'sj_event_rival', npcId: 'sect_leader_神机门', title: '算不出的误差', icon: '⚙️',
        desc: '她把你与别人同行的时辰，当成一组误差重算了三遍。',
        minAffection: 45, trigger: { random: 1.0 }, cooldown: 0, flag: 'sj_e_rival_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '工坊，灯下。检修册摊在案上，她坐在册子后头，围裙口袋里那枚黄铜齿轮攥在手心——攥得指节的轮廓隔着布都看得见。案上那只装到一半的机关雀本该安静养簧，今夜滴答乱拍，一拍错一拍，像一屋子的雨忽然乱了点。', type: 'description' },
            { speaker: 'npc', text: '「某日，你酉时来。某日，你没来。某日——」她报数，短句，平的，平得发毛，「某日，你跟别人同行了半程山路。这半程，我当误差记了。重算了三遍：齿没错，轴没错，游隙没错。」' },
            { speaker: 'npc', text: '「误差重算到第四遍，雀的滴答乱了。」她终于抬眼看你，灯花在她眼底爆了一下，「雀没坏。是持册的人，手抖了。」她摊开掌心，那枚齿轮的齿数比刻痕硌出一道白印，「我算得出一比七，算得出两千枚齿里哪一枚带毛边，算得出三十六具傀儡的绞点。你这几日的时辰——算不出。你说，这组误差，出在哪儿？」' },
            // v20.26 好感以 effects 真源为准（有无道侣两档），选项行不标数
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「不瞒你。我心里确实有了人。」', effect: 'admit' },
                { text: '「你想多了。山道上同走半程，算不得什么。」', effect: 'deny' },
                { text: '取出她塞给你的那枚刻齿数比的黄铜齿轮，摆在检修册旁边，齿对着齿', effect: 'gear' }
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
                        ? '她盯着你看了很久，把检修册合上，把那页重算误差的纸折好，折进册子最深处。「……道侣。」她把这两个字嚼了一遍，像嚼一枚陌生的铁齿。「好。往后你的时辰，我不必记了——' + rival.name + '会替你记。」她吹了灯，工坊暗下来，机关雀的滴答还没顺，一拍，一拍，她没再去理，「下山罢。山道上有散落的齿轮，脚下看着点。」'
                        : '她极轻地「嗯」了一声，把那枚攥烫的齿轮收回围裙口袋，收得很轻。「……' + rival.name + '。」她把这个名字报了一遍，平的，像报一个齿数，「记下了。神机门不抢人——齿轮认齿轮，轴认轴。」她把检修册拉回手边，「回去想清楚。想清楚了，来工坊。这组误差我留着空白，等你一句话重算。」';
                    break;
                case 'deny':
                    aff = dao ? -18 : -11;
                    msg = '她不争，只把检修册一页一页翻给你听：哪一夜西墙你掌的灯，哪一日倒轴你替她数的七圈，哪一页损耗册登过「人，两个，无恙」——笔笔比齿面还平。「齿轮不许『差不多』；我的册，也不许。」她合上册子，「你说我想多了——' + rival.name + '与你' + (dao ? '连道侣契都结了' : '同走过一条山道，巡夜的师兄弟瞧了个正着') + '，门上往来的册子都登着，你当我机簧房这几千枚齿的耳朵是摆设？」她伸手把滴答乱拍的机关雀按住，按得极稳，「走罢。这组误差，我自己重算。算错了账的人——我不重算了。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 15);
                    break;
                case 'gear':
                    aff = dao ? -2 : 5;
                    msg = dao
                        ? '你取出那枚黄铜齿轮，摆在检修册旁——两枚齿轮，一新一旧，齿数比的刻痕出自同一双手。她盯着那两枚齿，手伸到一半，停在半空。「……结了道侣契的人，还带着我的齿。」声音低下去。她把自己的那枚收回口袋最里层，「齿轮在你手里，户口就没忘——这话我说过，记下了，不划。」她把罩布重新罩上机关雀，「只是往后这枚齿，你收你的。工坊——少来。」'
                        : '你取出那枚黄铜齿轮，摆在检修册旁边。她僵住——那是山道上她塞给你的头一枚，齿面的刻痕让你的掌心磨得发亮。她伸手把两枚齿轮并排对齐，齿对着齿，对得极正：「……你记得我说过的话。」她抬眼看你，耳根红了，声音还是平的，「齿数比刻在齿上，是图房的户口。神机门的齿轮个个有户口——你带着它，等于替我认了八年账。」她把检修册往你这边推了回来，「' + rival.name + '的事，你自己了断。这组误差空着——我等一个带着齿的人替我重算。」';
                    if (npc.relationship && !dao) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 裘霜莺：哨语乱套——对着苇滩吹了半宿「过来」，差事哨一夜全吹错（v20.78 铁掌帮） ----
    'tz_event_rival': {
        id: 'tz_event_rival', npcId: 'sect_leader_铁掌帮', title: '吹了半宿的哨', icon: '🐦',
        desc: '那夜她对着苇滩吹了半宿「过来」——今日码头的差事哨，全吹乱了。',
        minAffection: 45, trigger: { random: 1.0 }, cooldown: 0, flag: 'tz_e_rival_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '湖畔堤上，天没亮透。守夜的帮众说，昨夜苇滩上有人吹了半宿「过来」——三短促，一串接一串，雀群起了又落，落了又起，到底没人去。今日码头的差事哨全乱了套：她冲卸货的脚夫吹了三短促——那是叫自家人的；冲巡夜的船吹了一长一短——那是「你来了」。三句哨语，她吹了十一年，一夜全错。', type: 'description' },
            { speaker: 'npc', text: '「哨吹岔了。」她立在堤上没看你，手指把腰后那排哨从头到尾按了一遍，凶脸平平的，「十一年，三句，没吹岔过一回。昨夜岔到后半夜。」' },
            { speaker: 'npc', text: '她转过身，凶脸迎着湖风，耳根红着，话短得一句咬一句：「岔的原因，我知道。你心里有人了。你跟那个人在湖边走过，我在堤上看见了。」她从腰后摸出那支磨得最旧的哨，攥住，「那夜的『过来』，我吹了半宿。你——一回没来。」' },
            // v20.26 好感以 effects 真源为准（有无道侣两档），选项行不标数
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「不瞒你。我心里确实有了人。」', effect: 'admit' },
                { text: '「你想多了。巡夜吹哨，本来就是差事。」', effect: 'deny' },
                { text: '取出她塞给你的那支磨旧的哨，凑到唇边，吹一长一短——把「你来了」还给她', effect: 'whistle' }
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
                        ? '她盯着你看了两息，把腰后那排哨一根一根按回去，按到最后一根，手停了。「……道侣。」这两个字出口，短得像被掐断的哨音。她转身朝苇滩举起哨，吹了一声长音——雀群黑压压起来一片，「好。往后你走你的道——水寨这三句，我不替你岔了。」她把哨按回腰后，背对着你，「下堤罢。夜里湖风硬。」'
                        : '她「唔」了一声，就一个字，比平日还短。「……' + rival.name + '。」她把这个名字咬出来，凶的，平的，「记下了。水寨不抢人——哨叫谁，雀知道。」她攥着那支旧哨攥了半天，松开，「回去想清楚。想清楚了，来堤上。那半宿的『过来』我留着——应不应，你一句话。」';
                    break;
                case 'deny':
                    aff = dao ? -18 : -11;
                    msg = '她不吵，只把腰后那排哨一根一根取下来，举给你看——哪支是走镖路上收的，哪支是替谁家孩子哄哭练成的，哪支吹过雾夜的三句行船令：「差事册记着每一支哨的来历；你当我水寨的耳朵是摆设？」她把哨一根一根收回去，收到最后一根，抬眼，凶脸上挂了霜，「你说差事——' + rival.name + '与你' + (dao ? '连道侣契都结了' : '在湖边同走过一段堤，守夜的老周瞧了个正着') + '，满码头都在传，我那半宿的『过来』是替谁吹的？」她一声长音把雀群唤回滩里，背过身去，「走罢。往后哨语第三句——不吹给你了。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 15);
                    break;
                case 'whistle':
                    aff = dao ? -2 : 5;
                    msg = dao
                        ? '你把旧哨凑到唇边，吹了一长一短——哑鸭下水的调，拍子却一拍不差。她僵住，听着这声「你来了」，按着哨排的手停在腰后。「……结了道侣契的人，还记着我的哨语。」声音低下去，低到凶腔都够不着。她朝湖面看了很久，「一长一短吹得出，就是没忘——这话我说过，记下了，不划。」她把那支旧哨从你手里拿回去，用袖口擦了一遍，又塞回你手里，塞得很实，「只是往后这哨，你收你的。堤上——少来。」'
                        : '你把旧哨凑到唇边，吹了一长一短——哑鸭下水的调，拍子却一拍不差。她僵住——耳根先红，凶脸后绷，绷了三息，没绷住：「……你记得我说过的话。」她伸手把哨夺回去，夺了又塞回你掌心，攥着你的指头一根一根合拢，掌心全是薄茧和泥灰，「一长一短，长在心头，短在舌尖。你练了半日，我在三步外听了半日。」她别过脸看苇滩，声音压得极低，「' + rival.name + '的事，你自己了断。哨语第三句——我只吹给一个听得懂的人。」';
                    if (npc.relationship && !dao) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 姬云锦：晨课「问松」跳岔半式——剑意发堵，如雪压松枝（v20.78 昆仑派） ----
    'kl_event_rival': {
        id: 'kl_event_rival', npcId: 'sect_leader_昆仑派', title: '问松岔了半式', icon: '❄️',
        desc: '晨课的「问松」，她把第四式跳岔了半式——十年，没有岔过。',
        minAffection: 45, trigger: { random: 1.0 }, cooldown: 0, flag: 'kl_e_rival_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '昆仑舞台，卯时晨课。崖畔老松斜出雪壁，枝上覆着薄雪。她跳「问松」——六代的谱，剑剑问出去，顿处「问而不答」。今日第四式，剑尖本该朝着老松，却朝着观位偏处你坐的方向，岔了半式；顿处本该留半息，她顿足了三息——剑意发堵，堵得像雪压松枝，枝子直不起来。她收剑，取柄布擦剑，擦一柄本来就干净的剑。', type: 'description' },
            { speaker: 'npc', text: '「你来了。」她没抬眼，掌门腔端得平平整整，平整得刻意，「晨课的问松，我跳岔了。半式。」她把剑又擦了一遍，「谱注『问而不答』，我跳了十年，顿处从没堵过。今日堵了——堵的不是谱上的东西。」' },
            { speaker: 'npc', text: '她终于抬眼看你，袖口的素绸束得紧，指尖捻着双环扣的活结捻了一捻：「你心里有人了。我读旁人的剑意，十年，一式一式读得出来。我自己的剑意——」她顿了顿，话在喉咙里卡了一息，卡完才过来，「今日头一回，读不出。那岔出去的半式，你也看见了。你说，那半式剑尖，想指哪儿？」' },
            // v20.26 好感以 effects 真源为准（有无道侣两档），选项行不标数
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「不瞒你。我心里确实有了人。」', effect: 'admit' },
                { text: '「你想多了。晨课跳岔，是风向变了。」', effect: 'deny' },
                { text: '走到台沿，抬手把她岔掉的半式按回去，剑尖归向老松——再停在她心口前一寸：「指这儿。不关风的事。」', effect: 'read' }
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
                        ? '她盯着你看了很久，把剑归背——归剑的动作比平日慢了半拍，像一式没收住的末式。「……道侣。」她把这两个字读了一遍，像读一条从没人教过她的注脚，「好。往后我晨课的时辰，你不必记了——' + rival.name + '会替你看舞。」她转身朝崖畔老松端端正正福了一礼，礼是给山的，「下山罢。石阶雪深，脚下看着点。」'
                        : '她极轻地「嗯」了一声，这一声轻得像顿处那半息。「……' + rival.name + '。」她把这个名字读了一遍，很慢，像把它入谱，「记下了。昆仑不抢人——舞是祭山的，顿处是等人的。」她把柄布收进剑柄缠好，缠得极实，「回去想清楚。想清楚了，上舞台来。今日岔的那半式——我留着，等你一句话把它跳完。」';
                    break;
                case 'deny':
                    aff = dao ? -18 : -11;
                    msg = '她不争，只把舞谱摊开在石案上，一页一页指给你看：迎雪「雪落剑先迎」、问松「问而不答」、送鸿「送而不留」、听泉「听水知心」——六代手订，一字不讹。「谱不许错一字；我的剑，也不许。」她合上谱，「你说风向——' + rival.name + '与你' + (dao ? '连道侣契都结了' : '在雪道上同走过一程，洒扫的老仆瞧了个正着') + '，我的剑尖朝着你岔了半式，你说是风推的？昆仑的剑，不跟风走。」她收剑背身，素绸袖带在雪光里扬了一下，「走罢。今日晨课的后半谱——我不跳了。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 15);
                    break;
                case 'read':
                    aff = dao ? -2 : 5;
                    msg = dao
                        ? '你走到台沿，抬手把她岔掉的半式按回去，剑尖归向老松——再停在她心口前一寸。她低头看着那一寸，看了很久，没退，也没应。「……结了道侣契的人，还读得懂我的剑。」声音低下去。她轻轻把你的手挪回老松的方向，挪得很慢，「答不在松那边，在剑收回来的地方——这句读法我写下了，不划。」她退后半步，把剑归背，「只是往后你的读法，你读你自己的。舞台——少上。」'
                        : '你走到台沿，把那岔掉的半式按回去，剑尖归向老松——再停在她心口前一寸。她整个人僵住，老松枝上的雪落下来，落了她一肩，她没拂。她盯着心口前那一寸看了很久，耳根在晨光里一寸一寸红上来：「……你读得懂我的舞。」她抬眼，眼底的冰化成了水，「剑尖不骗人。它指哪儿，你读哪儿——读得比我跳得明白。」她转身重新起剑，把第四式从头走了一遍，这一遍剑尖朝着老松，收剑时顿处留足半息，她朝着顿处开口，很轻，「' + rival.name + '的事，你自己了断。舞台上那半式岔剑我留着——等一个读得懂舞的人，陪我把它跳完。」';
                    if (npc.relationship && !dao) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 翀玉衡：把那人的时辰记成「外账·应收」——算盘拨到一半停珠（v20.78 全真教） ----
    'qz_event_rival': {
        id: 'qz_event_rival', npcId: 'sect_leader_全真教', title: '外账·应收', icon: '🧮',
        desc: '她把那人陪你的时辰，一笔一笔记进了「应收」——算盘拨到一半，停了珠。',
        minAffection: 45, trigger: { random: 1.0 }, cooldown: 0, flag: 'qz_e_rival_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '功录房，灯下。你推门进来，算盘珠声戛然而止——她坐在案后，外账摊着，小银算盘擎在手里，珠子拨到一半，停着。案角新开一页，栏头四个字，笔笔端正：外账·应收。栏里一笔一笔：某日，彼与此人同行山道半程。记。某日，此人之名与彼并见于客单。记——笔记在「应收」，欠账的那一栏，写的是你的名字。', type: 'description' },
            { speaker: 'npc', text: '「你来了。」她没搁笔，账房腔，字正腔圆，端得刻意，「全真记账，外账记外事。你的这些时辰，一笔一笔，作不出价，抵不了销——我只得新开一栏，记『应收』。」她把那颗停住的珠又拨了一下，珠没动，「利息几何，我算了三夜。算不出。」' },
            { speaker: 'npc', text: '她终于抬眼，灯花在她眼底爆了一下，指尖压着栏脚：「我记账十二年，外账十一万笔，不差一铢。栏脚的批注，栏栏都有两个字可写——讫，或者疑。」她压着那行空白的栏脚，压得很实，「这一栏，我不知道写什么。你说，这笔账，到底是谁欠谁？」' },
            // v20.26 好感以 effects 真源为准（有无道侣两档），选项行不标数
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「不瞒你。我心里确实有了人。」', effect: 'admit' },
                { text: '「你想多了。同行半程山路，算不得债。」', effect: 'deny' },
                { text: '取出她给你的那颗旧算盘珠，搁在她停住的珠旁边', effect: 'bead' }
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
                        ? '她盯着你看了很久，把笔搁回笔山——搁得比落笔还轻。「……道侣。」她把这两个字核了一遍，像核一个对不上的债名，核完把「应收」那一页合上，压进账摞最底下，「好。往后你的时辰，我不必记了——' + rival.name + '会与你对。」她吹了灯，功录房暗下来，腰间算盘上那颗拨到一半的珠她没收，就让它停在半路，「下山罢。终南夜风硬，脚下看着点。」'
                        : '她极轻地「嗯」了一声，把那颗停住的珠一颗一颗归了零——归完，又拨到一半。「……' + rival.name + '。」她把这个名字报了一遍，平的，像报一个债名，「记下了。功录房不抢人——账认债，算盘认珠。」她把外账收进袖中，「回去想清楚。想清楚了，来功录房。这一栏的息口我留着空白，等你一句话填上。」';
                    break;
                case 'deny':
                    aff = dao ? -18 : -11;
                    msg = '她不争，只把外账一页一页翻给你听：哪一日你酉时未来对账，哪一日客单上你的名字与那人并了一栏，哪一日三清殿前有人看见你们并辔入城——「全真的账不许『差不多』；我的算盘，也不许。」她合上账，「你说算不得债——' + rival.name + '与你' + (dao ? '连道侣契都结了' : '同守过一盏灯、同分过一匹马') + '，各观的客单上都登着，你当我功录房的耳朵是摆设？」她把算盘一推，满盘的珠噼啪归零，脆得像冰，「走罢。这一栏应收，我自己销。记多了账的人——我不重记了。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 15);
                    break;
                case 'bead':
                    aff = dao ? -2 : 5;
                    msg = dao
                        ? '你取出那颗旧算盘珠，搁在她停住的珠旁边——旧珠与新珠并在一处，一颗师承，一颗徒传。她盯着那两颗珠，手伸到一半，停住。「……结了道侣契的人，还带着我师父的珠。」声音低下去。她把停住的珠归了零，只把那颗旧珠用布裹好，替你收进你怀里，收得很实，「珠在你手里，账就没忘对——这话我说过，记下了，不划。」她合上外账，「只是往后这颗珠，你收你的。功录房——少来。」'
                        : '你取出那颗旧算盘珠，搁在她停住的珠旁边。她僵住——押册那夜她把这颗珠分给你，说一人一颗，算对账的凭；今日你把它带回来，搁在她算不下去的珠旁边。她盯着那两颗珠，灯花在她眼底爆了一下，账房腔一寸一寸裂开：「……你记得我说过的话。」她把旧珠拿起来，放回你掌心，替你合拢指头，耳根红着，腔还端着，「珠是对账的凭。这颗珠还你，记『存』，不记『讫』——存着，就总有往来。」她把那页应收折进账摞，「' + rival.name + '的事，你自己了断。这一栏息口空白——我等一个带着珠的人来填。」';
                    if (npc.relationship && !dao) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 竺照禅：讲经讲岔了一偈——佛号念了三声，毒舌失灵，念珠拨得飞快（v20.79 少林寺） ----
    'shao_event_rival': {
        id: 'shao_event_rival', npcId: 'sect_leader_少林寺', title: '讲岔的那一偈', icon: '📿',
        desc: '今日讲经，她头一回讲岔了一偈——佛号念了三声，毒舌失灵。',
        minAffection: 45, trigger: { random: 1.0 }, cooldown: 0, flag: 'shao_e_rival_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '栴檀林，酉时晚课刚散。你推开经堂的门，她坐在案后，批注经摊开着——摊开的正是那一页，空白的那一页，半个月了，一笔批注都没落下去。那串盘得发亮的念珠在她手里拨得飞快，一颗撵着一颗，全无功课的章法。案头摞着今日讲经的稿子——下院庵主应方丈之请去大雄宝殿讲戒，讲了一炷香的经，她讲岔了一偈，用三声「阿弥陀佛」圆了回来。殿里的老僧说，竺照禅今日毒舌失灵——下了高座，一个人都没骂。', type: 'description' },
            { speaker: 'npc', text: '「施主来了。」她先合十，念了一声「阿弥陀佛」——佛号是稳的，手不稳，念珠在袖子里拨得飞快。「今日讲经，贫尼讲岔了一偈。就一偈。」她把批注经往你这边转了半寸，那一页空白朝上，「贫尼讲戒十几年，旁批比原文毒，从没批错过一个字。今日错了——错的不是经，是批经的人，心乱了。」' },
            { speaker: 'npc', text: '她终于抬眼看你，灯花在她眼底爆了一下，指尖压着那页空白：「你心里有人了。你与那人同行了半程山路，贫尼在高座上看经会讲的僧册，看见了。」她压着空白页，压得很实，「贫尼骂得动天下人，引经据典，骂得人被点醒还要谢贫尼。唯独关于你的那句批注，最锋利的那句——落不下去。这一页空了半个月。你说，这一戒，是贫尼持不住了，还是这一偈，贫尼讲不圆了？」' },
            // v20.26 好感以 effects 真源为准（有无道侣两档），选项行不标数
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「不瞒你。我心里确实有了人。」', effect: 'admit' },
                { text: '「你想多了。同走半程山路，算不得什么。」', effect: 'deny' },
                { text: '取出她塞给你的那串念珠，摆在批注经那页空白上，亲手替她拨过一轮——把佛号一颗一颗还给她', effect: 'beads' }
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
                        ? '她盯着你看了很久，合十，念了一声「阿弥陀佛」——佛号出口，后头却没有跟骂，这在她是从来没有的事。「……道侣。」她把这两个字嚼了一遍，像嚼一偈批不动的经。「好。往后你的功课，贫尼不必点了——' + rival.name + '会替你念。」她合上批注经，把那页空白压进经的最深处，又亲手抚平了经角，「下山罢，施主。山道夜露重，脚下看着点。」'
                        : '她「阿弥陀佛」了一声，这一声应得极轻，像顿住的半偈。「……' + rival.name + '。」她把这个名字念了一遍，很慢，像替一条新戒提名，「记下了。栴檀林不抢人——讲经认经，念珠认人。」她把念珠收回袖中，收得很稳，「回去想清楚。想清楚了，来栴檀林。那一页空白，贫尼替你留着——等你一句话，落批。」';
                    break;
                case 'deny':
                    aff = dao ? -18 : -11;
                    msg = '她不争，只把批注经一页一页翻给你看：哪一页她替迟到的香客批过「功课不勤，佛前也懒」，哪一页她批得满寺僧人绕着走，哪一页记着「是日，彼来庵中，坐了一炷香，没走神」——笔笔比原文毒，唯独关于你的那一页，空白。「经不许『差不多』；贫尼的批注，也不许。」她合上经，「你说贫尼想多了——' + rival.name + '与你' + (dao ? '连道侣契都结了' : '同走过半程山路，扫塔的居士瞧了个正着') + '，连方丈释玄慈都知道了，你当我这管全寺戒律的耳朵是摆设？」她手里的念珠停了，停得死死的，「走罢，施主。这一页，贫尼自己批。批不动的人——贫尼不骂第二遍。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 15);
                    break;
                case 'beads':
                    aff = dao ? -2 : 5;
                    msg = dao
                        ? '你取出那串念珠，摆在那页空白上——珠子还是她盘得发亮的那串，亮里掺了你的手温。她盯着那串珠，手伸到一半，停住。「……结了道侣契的人，还带着贫尼的珠。」声音低下去。她把珠子收回，没入袖，系在了经函的角上，「珠在你手里，功课就没忘——这话贫尼说过，批下了，不勾。」她合上批注经，「只是往后这串珠，你收你的。栴檀林——少来。」'
                        : '你取出那串念珠，摆在那页空白上，亲手替她拨过一轮——一颗，一颗，拨得不快，一颗也没漏。她僵住——那是她塞给你的珠，说「持着珠，贫尼的功课就废不了」；今日你把它带回来，拨在她批不下去的那一页上。她看着你拨完那一轮，耳根一寸一寸红上来，毒舌开了三回口，三回失灵：「……施主记得贫尼说过的话。」她把珠子拿起来，放回你掌心，替你合拢手指，指腹上的茧压着你的手背，「珠是功课的凭。这一轮你拨回来，贫尼不批——批了就勾了；不批，就总有往来。」她把那页空白压平，「' + rival.name + '的事，你自己了断。这一页空着——贫尼等一个持珠的人来落批。」';
                    if (npc.relationship && !dao) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 4);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    }
};

// ============ 二十位女主角的「和好」事件：对峙后好感养回 → 第二次机会 / 苦涩收束 ============
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
            // v20.26 好感以 effects 真源为准（有无道侣两档：12/8/5 与 4/6/2），选项行不再标数
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '接上断簪，交还她', effect: 'fix' },
                { text: '「这簪子，我替你收着。」', effect: 'keep' },
                { text: '「绯泪，我对不住你。」', effect: 'apologize' }
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
    },
    // ---- 夙孤鸿：划掉的名签，她重新录了回去 ----
    'em_event_reconcile': {
        id: 'em_event_reconcile', npcId: 'sect_leader_峨眉派', title: '尺归原位', icon: '🏮',
        desc: '戒堂案上，那把收起来的木戒尺又摆正了。',
        minAffection: 55, trigger: { random: 1.0 }, cooldown: 0, flag: 'em_e_reconcile_done',
        requireRivalRomance: true, requireEventDone: 'em_event_rival',
        scenes: [
            { speaker: 'narrator', text: '戒堂。她那把收起来的木戒尺，重新摆回了案上——摆得端端正正，尺身磨得发亮。尺下压着一张名签：你的。从「划去」的那一叠里，捡回来的。', type: 'description' },
            { speaker: 'npc', text: '「你的名签，我重新录了。」她没看你，在剪灯芯，「戒六条：不弃。——这条戒管别人，也管我。」' },
            // v20.26 好感以 effects 真源为准（有无道侣两档），选项行不标数
            { speaker: 'npc', text: '「只是重录的规矩，我自己定。」灯花亮了一下，她才回头，「往后你来金顶，事先报时辰。不报——尺照打。报了而没来……」她顿了顿，「没来，我也等。但等，是我的功课，不关你的事。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「往后我的名签，只挂金顶一处。」', effect: 'only' },
                { text: '「时辰我报。但有些事，我做不到了。」', effect: 'honest' },
                { text: '什么都不说，把案上戒尺拿起来，双手递回她手里', effect: 'silent' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = detectRivalRomance(npc.id) || { name: '那人' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'only':
                    aff = dao ? -2 : 10;
                    msg = dao
                        ? '她笑了一下，只一下。「只挂一处？」她把名签压回那叠最上面，压得很实，「你的道侣' + rival.name + '，怕是不依。我懂分寸。——这张名签我替你留着，你路过时，来灯下坐一坐。这就是我能许你的『只一处』。」'
                        : '她盯着你看了很久，垂下眼，把名签收进袖袋最里层——不是案上，是袖袋。「……好。」灯芯哔剥响了一声，「往后金顶夜巡，我少走一步——那一步，省下来等你上山。」';
                    if (npc.relationship && !dao) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 8);
                    break;
                case 'honest':
                    aff = dao ? 2 : 4;
                    msg = dao
                        ? '「做不到。」她点头，平静得出奇，「持戒的人，不勉强人。」她把灯往你这边推了半寸，「那你把做得到的说与我听。戒堂的账，只录做得到的——做不到的，不录，也不怪。」'
                        : '「……你倒老实。」她重新坐下，铺纸提笔，「报时辰。」你报了，她一笔一笔记下，记完把纸压在戒尺底下，「往后这把尺，管的不是你——是你报的时辰。峨眉的话，一句顶一把尺。」';
                    break;
                case 'silent':
                    aff = 6;
                    msg = '你把戒尺拿起来，双手递回她手里。她一怔，手指收拢，握住尺——像握住一柄剑。「……你这是做什么。」她声音很低。你说：尺在你手里，我去哪儿，你都知道。她低头看着那把磨旧的尺，看了很久，忽然把它插回袖中，只露出半截。「去吧。」她转身又剪了一次灯芯，「明晚一更，金顶点名。——你的名签，我第一个念。」那夜戒堂的灯，亮到三更。';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 晏万解：拆了的她一件件装回去，炉子给你第二回火 ----
    'tm_event_reconcile': {
        id: 'tm_event_reconcile', npcId: 'sect_leader_唐门', title: '新手套', icon: '🧵',
        desc: '拆散的丹炉装回去了，炉火又点上了。',
        minAffection: 55, trigger: { random: 1.0 }, cooldown: 0, flag: 'tm_e_reconcile_done',
        requireRivalRomance: true, requireEventDone: 'tm_event_rival',
        scenes: [
            { speaker: 'narrator', text: '毒堂偏院。那座拆散的丹炉，一件一件装回去了——炉架归位，火门合缝，三十六枚机簧一枚不缺。炉膛里的火重新点上，火色很稳。案边搁着一双新缝的布手套，针脚密得看不见接头。', type: 'description' },
            { speaker: 'npc', text: '「拆的时候痛快，装的时候一件一件对号。」她没回头，正拿镊子校最后一枚簧，「我这个人就这点出息——坏脾气发完了，还得自己收拾。」' },
            // v20.26 好感以 effects 真源为准（有无道侣两档），选项行不标数
            { speaker: 'npc', text: '簧「嗒」地一声归位。她直起腰，把那双手套往你这边推了半寸：「旧的脏了，我重缝了一双。」她顿了顿，「炉子也给你第二回火。要不要——你说。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「往后我这双手，只戴你缝的。」', effect: 'only' },
                { text: '「手套我戴。但有些事，我做不到了。」', effect: 'honest' },
                { text: '什么都不说，坐到炉前接过火钳，替她看这一炉的火候', effect: 'silent' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = detectRivalRomance(npc.id) || { name: '那人' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'only':
                    aff = dao ? -2 : 10;
                    msg = dao
                        ? '她笑了一下，只一下，把手套收回去半寸——又停住，终究还是推回你面前。「只戴我缝的？」她低头拨了拨炉火，「你的道侣' + rival.name + '，怕是不依。分寸我懂。」火星子跳了一下，「手套你收着。路过蜀中，进毒堂坐一坐，我给你验一回针——这就是我能许你的『只一处』。」'
                        : '她盯着你看了很久，忽然伸手——褪了手套的那只——在你腕间搭了一下，像验脉，又像只是碰一碰。「……好。」她把手套替你戴上，一根手指一根手指地理平针脚，「往后炉子我守，火你看。' + rival.name + '的事，你自己了断——唐门的毒谱上，不留糊涂账。」';
                    if (npc.relationship && !dao) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 8);
                    break;
                case 'honest':
                    aff = dao ? 2 : 4;
                    msg = dao
                        ? '「做不到。」她点头，平静得出奇，「制解药的人最清楚——有些毒，解不了就是不。」她把火门掩了半寸，「那你把做得到的说与我听。这炉火我给你留着，留多久，看你说得出多少。」'
                        : '「……你倒老实。」她哼了一声，把手套塞进你怀里，「老实人吃亏。吃亏的人，我另配一副药。」她重新坐下校簧，「' + rival.name + '的事，你给了我个了断。断不干净也无妨——毒堂的规矩，一日三验，我验得起。」';
                    break;
                case 'silent':
                    aff = 6;
                    msg = '你坐到炉前，接过火钳，替她看这一炉的火候。她在你身后站了半晌，没说话。火光在两个人脸上跳。许久，她把那双新套搁到你膝上，声音低下去：「……我拆东西的时候，最怕的不是装不回去。」她伸手掸了掸你肩上的灰，「是装回去以后，没人陪我看火。」炉膛里「哔剥」响了一声，火色正好。那夜偏院的灯，亮到天明。';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 瀛晚照：旧册归架，新册的第一页记的是你上岸的时辰 ----
    'pl_event_reconcile': {
        id: 'pl_event_reconcile', npcId: 'sect_leader_蓬莱派', title: '新册', icon: '📜',
        desc: '观汐台的录案上，摆着一册崭新的图录。',
        minAffection: 55, trigger: { random: 1.0 }, cooldown: 0, flag: 'pl_e_reconcile_done',
        requireRivalRomance: true, requireEventDone: 'pl_event_rival',
        scenes: [
            { speaker: 'narrator', text: '观汐台，晚潮。录案上摆着一册崭新的图录，封皮还空着；旧的二十年，归了架。她翻开新册第一页——页上只录了一行：你最近一回上岸的时辰，精确到刻。', type: 'description' },
            { speaker: 'npc', text: '「旧册记满了。记满的那一夜，我发过一场脾气。」她没抬头，指腹在那一行上按了按，「新起一册。第一页记什么，规矩我自己定——记真的。」' },
            // v20.26 好感以 effects 真源为准（有无道侣两档），选项行不标数
            { speaker: 'npc', text: '她把新册往你这边推了半寸。后头一页一页，全是空的。「你的时辰，还录不录——你说。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「往后我的时辰，只录进你这一册。」', effect: 'only' },
                { text: '「时辰我报。但有些事，我做不到了。」', effect: 'honest' },
                { text: '什么都不说，提笔蘸墨，把今晚这一笔潮的时辰替她录进新册', effect: 'silent' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = detectRivalRomance(npc.id) || { name: '那人' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'only':
                    aff = dao ? -2 : 10;
                    msg = dao
                        ? '她笑了一下，只一下，把新册收回案心——又停住，终究没有合上。「只录我这一册？」她提起笔，没蘸墨，「你的道侣' + rival.name + '，怕是不依。分寸，我懂。」台外潮涨了一线，「册子你来看。路过蓬莱，上台来，陪我录一笔晚潮——这就是我能许你的『只一处』。」'
                        : '她盯着你看了很久，然后把新册收进图录匣最里层——旧册摆在外架，新册收在里面。「……好。」她点了灯，「往后黄昏的潮，我少录一笔。」你问为什么。「那一笔——」她蘸了墨，耳根红着，话还是平的，「省下来，等你上岸。」';
                    if (npc.relationship && !dao) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 8);
                    break;
                case 'honest':
                    aff = dao ? 2 : 4;
                    msg = dao
                        ? '「做不到。」她点头，平得像退潮，「潮信不勉强潮。」她把新册翻过一页，空白朝上，「那你把做得到的说与我听。这一册只录真的——录不下的，不录，也不怪。」'
                        : '「……你倒老实。」她重新蘸墨，「报时辰。」你报了，她一笔一笔记下，记完，指腹在页角按了很久。「往后这一册，录你报的时辰。」她合上册子，「观汐台的话，一句顶一笔潮。」';
                    break;
                case 'silent':
                    aff = 6;
                    msg = '你提起案上的笔，蘸墨，把今晚这一笔潮录进新册：酉时三刻，潮涨一线。字不如她的工整，一笔一笔却实。她站在你旁边看完。你搁笔，她忽然说：「二十年，替我执笔的手，只有一双。」她合上新册，提笔在封皮上写了两个小字：潮平。「第二双，今晚录进来了。」那夜观汐台的灯，亮到三更。';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 祁清禅：乱字的那一页没扔，重新铺开了 ----
    'heng_event_reconcile': {
        id: 'heng_event_reconcile', npcId: 'sect_leader_恒山派', title: '那页乱字', icon: '🕯️',
        desc: '抄经堂里，那页写乱的回向页重新铺开了。',
        minAffection: 55, trigger: { random: 1.0 }, cooldown: 0, flag: 'heng_e_reconcile_done',
        requireRivalRomance: true, requireEventDone: 'heng_event_rival',
        scenes: [
            { speaker: 'narrator', text: '抄经堂，灯下。那页写乱的回向页没有扔——重新铺在了案上，正面朝上，镇纸压着两角；旁边裁了一方新的经纸，笔砚摆得端端正正。乱掉的那一行，她没描，也没弃。', type: 'description' },
            { speaker: 'npc', text: '「戒本里说，不弃。」她在剪灯芯，没看你，「乱掉的那一行是我自己的——自己的不弃，别人的，更不弃。」' },
            // v20.26 好感以 effects 真源为准（有无道侣两档），选项行不标数
            { speaker: 'npc', text: '灯花亮了一下，她才回头：「只是续抄的规矩，我自己定。往后你上山，事先报时辰。不报——木鱼照敲它自己的。报了而没来……」她顿了顿，「没来，是你的缘。等，是我的功课。不关你的事。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「往后我上山的时辰，只报你一处。」', effect: 'only' },
                { text: '「时辰我报。但有些事，我做不到了。」', effect: 'honest' },
                { text: '什么都不说，提笔蘸墨，把那行乱字替她一笔一笔描端正', effect: 'silent' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = detectRivalRomance(npc.id) || { name: '那人' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'only':
                    aff = dao ? -2 : 10;
                    msg = dao
                        ? '她笑了一下，只一下，把那页纸推回案心——又停住，终究没有扣上。「只报一处？」她提起笔，没蘸墨，「你的道侣' + rival.name + '，怕是不依。分寸，我懂。」灯花哔剥响了一声，「经纸你收着。路过恒山，进抄经堂灯下坐一坐——这就是我能许你的『只一处』。」'
                        : '她盯着你看了很久，垂下眼，把那页纸收进经函最上一层——不是镇纸下，是函里。「……好。」灯芯哔剥响了一声，「往后晚课的木鱼，我少敲一声——那一声，省下来等你上山。」';
                    if (npc.relationship && !dao) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 8);
                    break;
                case 'honest':
                    aff = dao ? 2 : 4;
                    msg = dao
                        ? '「做不到。」她点头，静得像晚课散，「持戒的人，不勉强人。」她把灯往你这边推了半寸，「那你把做得到的说与我听。戒堂的记录只录做得到的——做不到的，不录，也不怪。」'
                        : '「……你倒老实。」她重新铺纸提笔，「报时辰。」你报了，她一笔一笔记下，记完把纸折好，压进经函，「往后这一页，不管你的缘——管你报的时辰。白云庵的话，一句顶一声木鱼。」';
                    break;
                case 'silent':
                    aff = 6;
                    msg = '你提起笔，蘸墨，把那行乱字一笔一笔描端正。字不如她的工整，一笔一笔却实。她站在旁边看完最后一笔，忽然说：「六年抄经，替我研墨的手，只有一双。」她把那页纸正面朝上压进镇纸下——再也不扣着了。「第二双，今晚描进来了。」那夜抄经堂的灯，亮到三更。';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 岳清晓：划掉的档她撕了，新页空着压着火钩 ----
    'tai_event_reconcile': {
        id: 'tai_event_reconcile', npcId: 'sect_leader_泰山派', title: '空白页', icon: '🌄',
        desc: '临火的档册翻到一页空白，压着火钩。',
        minAffection: 55, trigger: { random: 1.0 }, cooldown: 0, flag: 'tai_e_reconcile_done',
        requireRivalRomance: true, requireEventDone: 'tai_event_rival',
        scenes: [
            { speaker: 'narrator', text: '玉皇顶，卯时刚过。火照旧旺，她却没急着收炭——档册摊在石台上，摊到一页空白，火钩压着页角，像在等人。', type: 'description' },
            { speaker: 'npc', text: '「划掉的那页，我撕了。」她没看你，话还是快的，只是比平日慢了半拍，「撕了就撕了。火坛的档，我有权改。」' },
            // v20.26 好感以 effects 真源为准（有无道侣两档），选项行不标数
            { speaker: 'npc', text: '她拿指尖在空白页上敲了敲：「新页写什么，规矩我定。往后你上顶，事先报时辰。不报——炭我自己拨。报了而没来……」她耳根有点红，「没来，是你的事。等，是我的事。都记。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「往后我上顶的时辰，只报火坛一处。」', effect: 'only' },
                { text: '「时辰我报。但有些事，我做不到了。」', effect: 'honest' },
                { text: '什么都不说，接过火钩，替她拨这一炉炭，拨到火色正好', effect: 'silent' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = detectRivalRomance(npc.id) || { name: '那人' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'only':
                    aff = dao ? -2 : 10;
                    msg = dao
                        ? '她笑了一下，只一下，把档册收回半寸——又停住，终究没有合上。「只报一处？」她提起炭笔，没落，「你的道侣' + rival.name + '，怕是不依。规矩，我懂。」火星子跳了一下，「档册你收着。路过泰山，上火坛边烤烤手——这就是我能许你的『只一处』。」'
                        : '她盯着你看了很久，忽然提起炭笔，在空白页顶头写下两个字，写完把册子啪地合上，塞进你怀里——「常来」。「……好。」她耳根红透，下巴还抬着，「往后火坛左手边那个位置，规矩我定。' + rival.name + '的事，你自己了断——火坛的档，不留糊涂数。」';
                    if (npc.relationship && !dao) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 8);
                    break;
                case 'honest':
                    aff = dao ? 2 : 4;
                    msg = dao
                        ? '「做不到。」她点头，直得像拨炭，「火坛不勉强人——火不旺，就是不旺。」她把档册翻过一页，空白朝上，「那你把做得到的说与我听。这一本只记真的——不旺的，不记，也不怪。」'
                        : '「……你倒老实。」她把炭笔蘸了蘸，「报时辰。」你报了，她一笔一笔记下，记完指腹在页角敲了两下，「往后这一本，记你报的时辰。」她合上册子，「泰山的话，一句顶一缕晨。」';
                    break;
                case 'silent':
                    aff = 6;
                    msg = '你接过火钩，蹲到火坛边，替她拨这一炉炭——拨平、看风向、封炉的时辰，一样一样照她教的来。她站在旁边看到火色正好，忽然说：「临火十年，替我拨炭的手，只有一双。」她把火钩接过去，没归龛，插在石台边的雪里——柄朝着你。「第二双，今朝认下了。」那晨玉皇顶的火，烧得比哪天都亮。';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 幽翠微：过火的那锅清了，新炒的一锅火候正好 ----
    'qing_event_reconcile': {
        id: 'qing_event_reconcile', npcId: 'sect_leader_青城派', title: '第二锅', icon: '🍃',
        desc: '过火的那锅茶清了，她重新炒了一锅。',
        minAffection: 55, trigger: { random: 1.0 }, cooldown: 0, flag: 'qing_e_reconcile_done',
        requireRivalRomance: true, requireEventDone: 'qing_event_rival',
        scenes: [
            { speaker: 'narrator', text: '焙房。过火的那锅早清了，灶上坐着新炒的一锅——她的手稳，火色正好。架顶那只旧罐取了下来，摆在灶台上，罐口开着一线，让香气先说话。', type: 'description' },
            { speaker: 'npc', text: '「骂火候不骂人；骂完了——」她没回头，拿干布擦着罐口，擦得慢，「还得自己重新炒。我就这点出息，脾气发完了，茶还得回罐。」' },
            // v20.26 好感以 effects 真源为准（有无道侣两档），选项行不标数
            { speaker: 'npc', text: '她把旧罐往你这边推了半寸：「走神的那锅茶倒了。新炒的这一锅，喝不喝——你说。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「往后我这盏茶，只喝你焙的。」', effect: 'only' },
                { text: '「茶我喝。但有些事，我做不到了。」', effect: 'honest' },
                { text: '什么都不说，坐到灶前接过茶夹，替她看住这一锅的火', effect: 'silent' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = detectRivalRomance(npc.id) || { name: '那人' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'only':
                    aff = dao ? -2 : 10;
                    msg = dao
                        ? '她笑了一下，只一下，把罐子收回半寸——又停住，终究还是推回你面前。「只喝我焙的？」她低头拨了拨灶火，「你的道侣' + rival.name + '，怕是不依。分寸，我懂。」火星子跳了一下，「罐子你收着。路过蜀中，进焙房坐一坐，我给你煎一盏——这就是我能许你的『只一处』。」'
                        : '她盯着你看了很久，忽然揭开罐子，把新茶拣了一撮包进纸包，纸包上一行快字，塞给你：水要活火。「……好。」她把罐子推上架顶——这一回，罐口朝外，「往后头一茬的火，两个人看。' + rival.name + '的事，你自己了断——青城的规矩，账实相符。」';
                    if (npc.relationship && !dao) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 8);
                    break;
                case 'honest':
                    aff = dao ? 2 : 4;
                    msg = dao
                        ? '「做不到。」她点头，快得像常，「看火的人最清楚——过火的茶，就是过火的茶，补救不来。」她把灶门掩了半寸，「那你把做得到的说与我听。这只罐只装真的——装不下的，不装，也不怪。」'
                        : '「……你倒老实。」她哼了一声，把纸包的茶塞进你怀里，「老实人吃亏。吃亏的人，我另炒一锅补他。」她重新坐下看火，「' + rival.name + '的事，你给了断。断不干净也无妨——焙房的规矩，一日三验火，我验得起。」';
                    break;
                case 'silent':
                    aff = 6;
                    msg = '你坐到灶前，接过茶夹，替她看这一锅的火——退半根柴、开一线风门，她报一句，你应一句。茶出锅时满屋清香。她盯着火色看了一会儿，忽然说：「火候走神的时候，我最怕的不是炒焦。」她把茶夹从你手里拿回来，在锅沿上轻轻敲了两下，「是火回来了，没人陪我看灶。」灶膛里哔剥响了一声，火色正好。那夜焙房的灯，亮到天明。';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 奚湘筠：旧谱重新摊开，空白的半阙朝着门 ----
    'xiang_event_reconcile': {
        id: 'xiang_event_reconcile', npcId: 'sect_leader_衡山派', title: '空白朝外', icon: '🌧️',
        desc: '那份旧谱重新摊开了，空白的半阙朝着门。',
        minAffection: 55, trigger: { random: 1.0 }, cooldown: 0, flag: 'xiang_e_reconcile_done',
        requireRivalRomance: true, requireEventDone: 'xiang_event_rival',
        scenes: [
            { speaker: 'narrator', text: '琴台侧屋。那份旧谱重新摊在案上——上半阙墨色陈旧，下半阙洇毛的空白朝着门外，像专门留给进来的人看。琴弓搁在谱边，弓毛上的松香，新擦过。', type: 'description' },
            { speaker: 'npc', text: '「曲子停了，没有死。」她坐在灯下，声音慢得像常，「师父说，曲成之日，下山之时。——我心里添了半句：曲停之日，等人之时。」' },
            // v20.26 好感以 effects 真源为准（有无道侣两档），选项行不标数
            { speaker: 'npc', text: '她把琴弓扶正，才抬眼看你：「只是等的规矩，我自己定。往后你上琴台，事先报雨。不报——我拉我的。报了而没来……」顿了顿，「没来，是你的事。听雨，是我的事。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「往后我听雨的位子，只留琴台一处。」', effect: 'only' },
                { text: '「位子我留。但有些事，我做不到了。」', effect: 'honest' },
                { text: '什么都不说，拿起松香，替她把弓毛擦三下', effect: 'silent' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = detectRivalRomance(npc.id) || { name: '那人' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'only':
                    aff = dao ? -2 : 10;
                    msg = dao
                        ? '她笑了一下，很慢，把那份谱收回案心——又停住，终究没有合上。「只留琴台？」她拿起弓，没拉，「你的道侣' + rival.name + '，怕是不依。板眼，我懂。」檐外的雨落了一阵，「谱你收着。路过衡山，上台来听半阙——这就是我能许你的『只一处』。」'
                        : '她盯着你看了很久，把那份旧谱收进谱匣最里层——摊着的收起来，收着的才是真的。「……好。」她拉了一弓试音，音很清，「往后夜雨，曲子停在老地方，会多停一板——那一板，省下来等你上台。」';
                    if (npc.relationship && !dao) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 8);
                    break;
                case 'honest':
                    aff = dao ? 2 : 4;
                    msg = dao
                        ? '「做不到。」她点头，慢得像曲终，「琴不勉强人——雨不落，就是不落。」她把谱翻过一页，空白朝上，「那你把做得到的说与我听。这份谱只记真的板眼——记不下的，不记，也不怪。」'
                        : '「……你倒老实。」她展开一张新纸，「报雨期。」你报了，她一笔一笔记下，记完把纸压进谱匣，「往后这份谱，不管你的行止——管你报的雨期。衡山的话，一句顶一板。」';
                    break;
                case 'silent':
                    aff = 6;
                    msg = '你拿起松香，替她把弓毛擦了三下——不多，不少。她看着你的手，看了很久，忽然说：「十六年，替弓擦香的，只有我一双手。」她拉了一弓，音清亮，檐外的雨都像停了一息。「第二双，今晚擦进来了。」她把松香收进袖袋外层，放得很近。那夜琴台的灯，亮到三更。';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 耿雪衣：那张伤风方子重新开给你——吵完架，多塞一把葱（v20.77 血手门） ----
    'xue_event_reconcile': {
        id: 'xue_event_reconcile', npcId: 'sect_leader_血手门', title: '重开的方子', icon: '📜',
        desc: '药庐的案上，摊着一张新开的方子——葱白比寻常多一把。',
        minAffection: 55, trigger: { random: 1.0 }, cooldown: 0, flag: 'xue_e_reconcile_done',
        requireRivalRomance: true, requireEventDone: 'xue_event_rival',
        scenes: [
            { speaker: 'narrator', text: '药庐，灯下。案上摊着一张新写的方子——姜三片，枣五枚，葱白两段，字极工整；方子旁边搁着一小捆葱白，洗得干干净净，比方子上写的多出一把。药碾子刷净了，那撮碾过头的药，早重碾过了。', type: 'description' },
            { speaker: 'npc', text: '「坐。」她没抬头，在剪灯芯，声音平得像报数目，「方子重开了。上回那张，多记了一行日子——日子不是病，不该混在药味里。」她剪完灯芯，才回头，「这一张，只写病。你伤风了就来抓药；不伤风——也来。」' },
            // v20.26 好感以 effects 真源为准（有无道侣两档），选项行不标数
            { speaker: 'npc', text: '她把那捆葱白往你这边推了半寸，耳根有点红，语气还是平的：「吵完架，多塞一把葱。我塞了。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「往后我来药庐的日子，只报你一处。」', effect: 'only' },
                { text: '「日子我报。但有些事，我做不到了。」', effect: 'honest' },
                { text: '什么都不说，坐到灶前接过药碾，替她把今晚这撮白药碾到正好', effect: 'silent' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = detectRivalRomance(npc.id) || { name: '那人' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'only':
                    aff = dao ? -2 : 10;
                    msg = dao
                        ? '她笑了一下，只一下，把葱白收回半寸——又停住，终究还是推回你面前。「只报一处？」她低头又剪了一次灯芯，「你的道侣' + rival.name + '，怕是不依。分寸，我懂。」灯花哔剥响了一声，「方子你收着。路过血手门，进药庐灯下坐一坐，喝碗井水——这就是我能许你的『只一处』。」'
                        : '她盯着你看了很久，垂下眼，把那张新方子折好，收进那一沓方纸的最上头——不是镇纸下，是最上头。「……好。」灯芯哔剥响了一声，「往后我报数，少报一句——那一句，省下来问你几时上山。」';
                    if (npc.relationship && !dao) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 8);
                    break;
                case 'honest':
                    aff = dao ? 2 : 4;
                    msg = dao
                        ? '「做不到。」她点头，平得像煎药，「开方子的人，不勉强人。症不在你身上，方子就不灵。」她把灯往你这边推了半寸，「那你把做得到的说与我听。药庐的账只记做得到的——做不到的，不记，也不怪。」'
                        : '「……你倒老实。」她哼了一声，把那捆葱白包进纸包，塞进你怀里，「老实人吃亏。吃亏的人，我多塞一把葱。」她重新在药碾子前坐下，「' + rival.name + '的事，你给了断。断不干净也无妨——药庐的规矩，数目天天报，我等得起。」';
                    break;
                case 'silent':
                    aff = 6;
                    msg = '你坐到灶前，接过药碾，替她把今晚这撮白药碾到细沙那样的粗——不过头，不欠火候。她站在灯边看你碾完最后一转，忽然说：「八年碾药，替我碾到正好的手，只有我一双。」她把那张新方子折好，塞进你怀里，「第二双，今晚认下了。」药碾子骨碌、骨碌，一屋子白药香。那夜药庐的灯，亮到三更。';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 拓银沙：掰腕子第三局——踹翻凳子，又给你递水囊（v20.77 飞蝎坞） ----
    'xie_event_reconcile': {
        id: 'xie_event_reconcile', npcId: 'sect_leader_飞蝎坞', title: '第三局', icon: '💪',
        desc: '对练场的矮桌上，她把胳膊砸了下来——第三局，定输赢。',
        minAffection: 55, trigger: { random: 1.0 }, cooldown: 0, flag: 'xie_e_reconcile_done',
        requireRivalRomance: true, requireEventDone: 'xie_event_rival',
        scenes: [
            { speaker: 'narrator', text: '蝎房外的对练场，矮桌上两只碗，一壶沙水。她坐在对面，袖口撸到肘，小臂上的旧白痕在灯下一道道发亮。前几日她踹翻的那条凳子，已经扶正了——踹痕还在，此刻坐在上头的是你。', type: 'description' },
            { speaker: 'npc', text: '「上回两局，一胜一负，账压了半个月没盘。」她把胳膊往桌上一砸，掌心朝上，咧嘴冲你笑，笑得恢复了平日的大，只有耳根还红着，「第三局，定输赢。你输了——往后蝎房分窝的班，我说了算。」' },
            // v20.26 好感以 effects 真源为准（有无道侣两档），选项行不标数
            { speaker: 'npc', text: '没等你搭手，她先一脚踹在凳子腿上——凳子晃了晃，没翻。她把自己的水囊拔了塞子，先灌了一大口，然后把囊推到你面前，下巴一抬：「喝。沙漠里的规矩，掰腕子不占渴的便宜。喝完再掰。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「往后我这条胳膊，只搁你这张桌上。」', effect: 'only' },
                { text: '「腕子我掰。但有些事，我做不到了。」', effect: 'honest' },
                { text: '什么都不说，把沙水一口喝干，攥住她的手，把这第三局掰到底', effect: 'silent' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = detectRivalRomance(npc.id) || { name: '那人' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'only':
                    aff = dao ? -2 : 10;
                    msg = dao
                        ? '她笑了一下，只一下，把手抽回去半寸——又停住，终究还是砸回桌上。「只搁我桌上？」她抓起沙水灌了一大口，「你的道侣' + rival.name + '，怕是不依。沙漠的规矩，我懂。」她把碗墩下，「水囊你收着。路过西线，进蝎房喝碗沙水——这就是我能许你的『只一处』。」'
                        : '她盯着你看了很久，忽然一把攥住你的手——不是掰腕子的攥法，就是攥着，攥得死紧。「……好！」她放声大笑，笑得蝎房屋顶掉沙，笑完没撒手，「往后蝎册上那两个字，我添一行小注——' + rival.name + '的事，你自己了断。坞里的册，不留糊涂账。」';
                    if (npc.relationship && !dao) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 8);
                    break;
                case 'honest':
                    aff = dao ? 2 : 4;
                    msg = dao
                        ? '「做不到。」她点头，直得像分水，「沙漠里不勉强人——水囊空了就是空了。」她把沙水往你面前又推了推，「那你把做得到的说与我听。这张桌上只认真家伙——做不到的，不记，也不怪。」'
                        : '「……你倒老实。」她哼了一声，把那只碗的沙水给你续满，「老实人吃亏。吃亏的人，我多掰一局补他。」她重新架好胳膊，「' + rival.name + '的事，你给了断。断不干净也无妨——对练场的规矩，第三局后头还有第三局，我掰得起。」';
                    break;
                case 'silent':
                    aff = 6;
                    msg = '你把沙水一口喝干，碗往桌上一墩，攥住她的手。第三局在灯下掰——她的手压下来，你顶回去；你压过去，她又撑起来，掰到最后两双手一起抖，两个人一起笑，笑完她一脚把那条凳子真踹翻了，踹翻了自己又去把水囊捡回来塞你怀里：「……行，平局。」她重新坐下，难得没拔嗓门，「掰腕子八年，能跟我掰成平局的手，就你一双。」金蝎爬上桌沿，尾钩轻轻搭在两只交握的手背上。那夜对练场的灯，亮到天明。';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 伏璃茵：灯芯龛前，吐槽役复工——这一场吐槽的是她自己（v20.77 烈日教） ----
    'lie_event_reconcile': {
        id: 'lie_event_reconcile', npcId: 'sect_leader_烈日教', title: '吐槽役复工', icon: '🕯️',
        desc: '小院里那盏豆大的灯又点上了，后台的位子空着等人。',
        minAffection: 55, trigger: { random: 1.0 }, cooldown: 0, flag: 'lie_e_reconcile_done',
        requireRivalRomance: true, requireEventDone: 'lie_event_rival',
        scenes: [
            { speaker: 'narrator', text: '圣火龛后的小院，入夜。她屋里那盏灯点着——灯芯剪得短，火苗豆大。案上那只檀木匣摆着，匣盖开着，里头衬的旧布空空的：灯芯该在谁怀里，两个人都知道。她坐在匣边的蒲团上，圣女冠摘下来搁在手边，没戴——一副等了很久的架势。', type: 'description' },
            { speaker: 'npc', text: '「吐槽役，复工。」一见你，她语速决堤，拍着身边的蒲团催你坐，「今日头一个段子：主诵长老的经越诵越回去了，上回把『尘秽不侵』诵成『尘秽不进』——不进？沙暴还挑日子进门？」她眉飞色舞，说到一半忽然刹住，看了你一眼，声音低了半度。' },
            // v20.26 好感以 effects 真源为准（有无道侣两档），选项行不标数
            { speaker: 'npc', text: '「……上回那句『照十方』，我想了半个月。」她把圣女冠拿起来，在手里转了半圈，又搁下，没戴，「串词是我的错，词后头的心是我的事——这两笔，我自己记在灯下了。往后吐槽役的场子，你只听，不必应。别走就行。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「往后你后台的观众席，只设一处——这儿。」', effect: 'only' },
                { text: '「段子我听。但有些事，我做不到了。」', effect: 'honest' },
                { text: '什么都不说，把那盏豆大的灯芯挑亮一分，听她把今晚的段子讲完', effect: 'silent' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = detectRivalRomance(npc.id) || { name: '那人' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'only':
                    aff = dao ? -2 : 10;
                    msg = dao
                        ? '她笑了一下，只一下，把身边的蒲团推回半寸——又停住，终究还是拉了回来。「只设一处？」她拿起冠，没戴，「你的道侣' + rival.name + '，怕是不依。分寸，我懂。」灯花哔剥响了一声，「檀木匣你看着。路过烈日教，来龛后听半场吐槽——这就是我能许你的『只一处』。」'
                        : '她盯着你看了很久，忽然把圣女冠戴回去——戴得端端正正，冠坠一声轻响。可身边的蒲团，她拍了拍：「……好。」她的眼睛在豆大的灯下亮得惊人，「往后大仪，我少诵一句废话——那一句省下来，回后台讲给你听，长老又诵错了什么。」';
                    if (npc.relationship && !dao) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 8);
                    break;
                case 'honest':
                    aff = dao ? 2 : 4;
                    msg = dao
                        ? '「做不到。」她点头，平静得出奇，「诵经的人最清楚——有些词诵出去，就收不回来。」她把匣盖掩了半寸，「那你把做得到的说与我听。这一场只记真段子——记不下的，不记，也不怪。」'
                        : '「……你倒老实。」她哼了一声，把热水壶往你面前推了推，「老实人吃亏。吃亏的人，我多吐一场槽补他。」她重新盘腿坐好，「' + rival.name + '的事，你给了断。断不干净也无妨——吐槽役天天开工，我等得起。」';
                    break;
                case 'silent':
                    aff = 6;
                    msg = '你伸手把那盏豆大的灯芯挑亮了一分。屋里豁亮起来——她愣了愣，没拦，看着你挑完灯芯，看着灯苗立直，忽然吐槽腔重新决堤，可这一回比哪回都慢：「十四年，替我挑灯芯的只有我自己。挑亮了怕扎眼，挑暗了怕看不清仪文。」灯花哔剥响了一声，她抱着膝盖，下巴搁在膝上看你：「第二双手，今晚认下了。」那夜小院的灯亮到三更，吐槽役讲到词穷，词穷了她把檀木匣盖合上，压住一张字条：明日段子，备货中——观众不许缺席。';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 檀望舒：她用无关紧要的人的调子说「算了」，却把铜镜收进袖子——镜面朝向变了（v20.77 天龙教） ----
    'long_event_reconcile': {
        id: 'long_event_reconcile', npcId: 'sect_leader_天龙教', title: '算了', icon: '🌙',
        desc: '旧档房的灯下，残铜镜头一回镜面朝上摆着。',
        minAffection: 55, trigger: { random: 1.0 }, cooldown: 0, flag: 'long_e_reconcile_done',
        requireRivalRomance: true, requireEventDone: 'long_event_rival',
        scenes: [
            { speaker: 'narrator', text: '传声房旧档房，灯下。那半面残铜镜摆在案上——镜面朝上。打从你对镜练声被她撞见的那日起，这面镜子一直扣着；今夜，它朝上了。她坐在案那头，腰间的铜镜牌垂着一排，见你进来，抬眼，开口用的是坛口扫坛老仆的调子——一个顶顶无关紧要的人。', type: 'description' },
            { speaker: 'npc', text: '（用扫坛老仆的调子）「算了。」两个字，传得平平的，像替别人传一道不相干的令。传完她自己顿了顿——像是也想不起这口声是从谁身上学来、又为什么偏偏学了它。她摇摇头，把案上的残铜镜拿起来，收进袖子，镜面朝内，动作很轻。' },
            // v20.26 好感以 effects 真源为准（有无道侣两档），选项行不标数
            { speaker: 'npc', text: '她抬眼看你，换云婆婆的哑嗓：（用云婆婆的调子）「娃儿，别站着，坐。」传完再换知客腔，一字一字，很正式：（用黑袍知客的调子）「那夜传错的声，传声房认。镜子扣了半月，今夜朝上一个时辰——镜子的朝向，就是心事的度量。」她顿了顿，换孩子的稚声，很轻：（用孩子的调子）「你猜，往后它朝哪边？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「往后这面镜子朝哪边，由我来定。」', effect: 'only' },
                { text: '「镜子我陪你看。但有些事，我做不到了。」', effect: 'honest' },
                { text: '什么都不说，取出那半块风磨石片，搁在她袖边——残铜镜旁边', effect: 'silent' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = detectRivalRomance(npc.id) || { name: '那人' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'only':
                    aff = dao ? -2 : 10;
                    msg = dao
                        ? '她笑了一下，只一下，袖口按着镜子按紧了一分。「由你定？」她借护法长老的凶腔撑场，凶腔里却没力气：（用护法长老的调子）「放肆——镜子是传声房的镜子。」传完自己先泄了，换云婆婆的哑嗓：（用云婆婆的调子）「娃儿，你的道侣' + rival.name + '，怕是不依。分寸，婆婆懂。」灯花哔剥响了一声，「石片你收着。路过西漠，进档房灯下坐一坐——这就是我能许你的『只一处』。」'
                        : '她盯着你看了很久，慢慢把残铜镜从袖子里取出来——镜面朝上，摆在案心，朝你这边推了半寸。（用孩子的调子）「……好。」两个字传得很轻，像怕惊动灯苗。她随即换知客腔补一道正式的令：（用黑袍知客的调子）「自今日起，传声房残铜镜，镜面朝上，不包布——朝向定了，不再改。」传完令她低头看灯，耳根红着，「' + rival.name + '的事，你自己了断。我那半句——等一个定镜子朝向的人。」';
                    if (npc.relationship && !dao) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 8);
                    break;
                case 'honest':
                    aff = dao ? 2 : 4;
                    msg = dao
                        ? '「做不到。」她点头，借讲经长老的沙哑老嗓传这两个字，传得很慢：（用讲经长老的调子）「传声的人最清楚——有些令传出去，收不回。」她把袖口的镜子按深了半寸，「那你把做得到的传与她听。传声房只传真令——传不到的，不传，也不怪。」'
                        : '「……你倒老实。」她哼了一声——这一声哼没走任何人的调子，哼出来她自己先愣了半息，随即急急换云婆婆的软嗓找补：（用云婆婆的调子）「老实娃儿，婆婆不叫你吃亏。」她把袖子拢紧，「' + rival.name + '的事，你给了断。断不干净也无妨——传声房的灯夜夜点着，我等得起。」';
                    break;
                case 'silent':
                    aff = 6;
                    msg = '你取出那半块风磨石片，搁在她袖边——残铜镜收着的地方。她僵住，一只手按着袖里的镜子，一只手覆上石片，覆了很久。（用云婆婆的调子）「壁的证物，镜的半面——今晚搁到一处了。」声音很软，软到最后她换孩子的稚声，像替自己传的令：（用孩子的调子）「镜子不用扣着了。」她把残铜镜从袖子里重新取出来，镜面朝上，摆回案心，石片抵着镜边。那夜档房的灯亮到三更，满墙铜镜牌安安静静，案上的镜子一直朝上，谁也没有再去擦它。';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 戚巧机：误差那一页她重算了第四遍——这回检修的是持册的人（v20.78 神机门） ----
    'sj_event_reconcile': {
        id: 'sj_event_reconcile', npcId: 'sect_leader_神机门', title: '重检修', icon: '🕰️',
        desc: '那页误差她重算了第四遍——这回检修的，是持册的人。',
        minAffection: 55, trigger: { random: 1.0 }, cooldown: 0, flag: 'sj_e_reconcile_done',
        requireRivalRomance: true, requireEventDone: 'sj_event_rival',
        scenes: [
            { speaker: 'narrator', text: '工坊，灯下。那只拆开检修的机关雀装回去了——翼簧归位，音膛坐正，滴答一拍是一拍，不乱了。案上摊着检修册，那页记误差的纸上，重写了一行小字：「误差一组。因：齿无误，轴无误，持册者心乱。检修自己。记。」册子旁边摆着一枚新刻的黄铜齿轮，齿面上刻痕还亮着，齿数比是新的。', type: 'description' },
            { speaker: 'npc', text: '「误差那本账，我重算了。」她没抬头，在给雀的翼簧上油，声音平得像登册体，「齿无误，轴无误，游隙无误——算到第四遍才算出来，乱的是持册的人。」她放下油壶，抬眼看你，「天下的游隙我都算得出，唯独自己这颗心——这一笔，我认账。」' },
            // v20.26 好感以 effects 真源为准（有无道侣两档），选项行不标数
            { speaker: 'npc', text: '她把那枚新刻的齿轮往你这边推了半寸，刻痕在灯下亮着：「只是检修的规矩，我自己定。往后你上山，事先报时辰。不报——雀乱它的滴答。报了而没来……」耳根有点红，语气还是平的，「没来，是你的事。留灯，是我的事。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「往后我上山的时辰，只报你一处。」', effect: 'only' },
                { text: '「时辰我报。但有些事，我做不到了。」', effect: 'honest' },
                { text: '什么都不说，坐到案前，替她把雀的翼簧上一遍油，听滴答一拍一拍稳下来', effect: 'silent' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = detectRivalRomance(npc.id) || { name: '那人' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'only':
                    aff = dao ? -2 : 10;
                    msg = dao
                        ? '她笑了一下，只一下，把齿轮收回半寸——又停住，终究还是推回你面前。「只报一处？」她低头又给翼簧上了一遍油，「你的道侣' + rival.name + '，怕是不依。游隙，我懂。」灯花哔剥响了一声，「齿轮你收着。路过神机门，进工坊灯下坐一坐，听半刻滴答——这就是我能许你的『只一处』。」'
                        : '她盯着你看了很久，伸手把那枚新刻的齿轮收进围裙口袋最外层——不是最里层，是一伸手就够得着的地方。「……好。」案上的机关雀滴答稳稳走了一拍，像应了一声，「往后检修册的晚课，我少记一笔——那一笔，省下来问你几时上山。」';
                    if (npc.relationship && !dao) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 8);
                    break;
                case 'honest':
                    aff = dao ? 2 : 4;
                    msg = dao
                        ? '「做不到。」她点头，平得像登册体，「修机关的人最清楚——游隙不合就是不合，硬装上去，咬不上。」她把检修册翻过一页，空白朝上，「那你把做得到的说与我听。这一册只记真的——记不下的，不记，也不怪。」'
                        : '「……你倒老实。」她哼了一声，把那枚新刻的齿轮塞进你怀里，「老实人吃亏。吃亏的人，我另刻一组更细的齿数比补他。」她重新在案前坐下，拿起油壶，「' + rival.name + '的事，你给了断。断不干净也无妨——工坊的规矩，一季一检修，我等得起。」';
                    break;
                case 'silent':
                    aff = 6;
                    msg = '你坐到案前，拿起小油壶，替她把雀的翼簧一道一道上油——不多，不少，游隙半丝。滴答从慢到稳，满屋子细响。她站在灯边看你上完最后一道簧，忽然说：「八年检修，替雀上簧的手，只有我一双。」她把那枚新刻的齿轮从案上拿起来，塞进你怀里，「第二双手，今晚认下了。」那夜工坊的灯亮到三更，雀立在案心，滴答一拍一拍，像两个人并排对着记当日的账。';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 裘霜莺：吹岔的那排哨她重新校了——第九窑的头一支哨，等你吹头一声（v20.78 铁掌帮） ----
    'tz_event_reconcile': {
        id: 'tz_event_reconcile', npcId: 'sect_leader_铁掌帮', title: '回哨', icon: '🪶',
        desc: '吹岔的那排哨她一支支重新校了——新哨摆在案上，等人吹头一声。',
        minAffection: 55, trigger: { random: 1.0 }, cooldown: 0, flag: 'tz_e_reconcile_done',
        requireRivalRomance: true, requireEventDone: 'tz_event_rival',
        scenes: [
            { speaker: 'narrator', text: '哨架小屋，灯下。那排吹岔了的哨，她一支一支重新校过——哪支当差，哪支唤雀，各归各位。架子第二层多了一支：八窑那支半声哨，擦得干干净净，摆在黑风口那支哑哨旁边。案上搁着一支新烧成的哨，泥胎还带着窑温——第九窑的头一支，能响的。', type: 'description' },
            { speaker: 'npc', text: '「吹岔了的哨，我校回来了。」她没看你，手指把腰后哨排从头到尾按了一遍，凶脸平平的，「差事是差事，私是私——那夜混了，混了半宿。」她按完最后一根，抬眼，「哨不会自己岔。吹哨的人岔了。这一笔，我认。」' },
            // v20.26 好感以 effects 真源为准（有无道侣两档），选项行不标数
            { speaker: 'npc', text: '她把那支第九窑的新哨往你这边推了半寸，耳根有点红，话还是短的：「只是回哨的规矩，我自己定。往后你进水寨，事先吹哨。不吹——我吹我的。吹了而没来……」顿了顿，「没来，是你的事。听哨，是我的事。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「往后我这一口哨，只吹给你这一处窑棚。」', effect: 'only' },
                { text: '「哨我吹。但有些事，我做不到了。」', effect: 'honest' },
                { text: '什么都不说，拿起那支新哨，吹一长一短还她——把「你来了」还给她', effect: 'silent' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = detectRivalRomance(npc.id) || { name: '那人' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'only':
                    aff = dao ? -2 : 10;
                    msg = dao
                        ? '她笑了一下——凶脸的笑只有一瞬，把哨收回半寸，又停住，终究还是推回你面前。「只吹我窑棚？」她低头把腰后哨排重新勒了一遍，「你的道侣' + rival.name + '，怕是不依。分寸，我懂。」小屋外苇滩沙沙响了一阵，「哨你收着。路过洞庭，进窑棚烤烤火——这就是我能许你的『只一处』。」'
                        : '她盯着你看了很久，忽然抓起那支新哨，冲你吹了一长一短——「你来了」，当面吹的，一声比一声稳，吹完把哨塞进你怀里，塞得很凶：「……好。往后这一句，只吹给你。」苇滩外头的雀群起了一次，又落，「' + rival.name + '的事，你自己了断——水寨的哨语，第三句不吹给第二个人。」';
                    if (npc.relationship && !dao) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 8);
                    break;
                case 'honest':
                    aff = dao ? 2 : 4;
                    msg = dao
                        ? '「做不到。」她点头，短得像差事哨，「水寨不勉强人——窑火不旺，就是不旺。」她把新哨往你面前又推了推，「那你把做得到的说与我听。这一窑只烧真的——烧不成的，不烧，也不怪。」'
                        : '「……你倒老实。」她哼了一声，把新哨塞进你怀里，「老实人吃亏。吃亏的人，我多烧一窑补他。」她重新在窑口坐下，「' + rival.name + '的事，你给了断。断不干净也无妨——窑棚的规矩，每日酉时一哨，我等得起。」';
                    break;
                case 'silent':
                    aff = 6;
                    msg = '你拿起新哨，凑到唇边，吹了一长一短——哑鸭下水的调，拍子却一拍不差。她僵住——听着这声「你来了」，凶脸上的表情一寸一寸松下来，松到底忽然别过脸去，再转回来时耳朵红着，嘴上还凶：「……你吹的哨，十一年了，全洞庭就数你最难听。」骂完她取出自己那支，回吹了一长一短，一声比一声稳，苇滩的雀群起了满空，绕着小屋的屋顶落了一圈。她重新坐下，难得没绷嗓门：「能把我的哨语吹回来的第二张嘴，今晚认下了。」那夜哨架小屋的灯亮到后半夜，新哨摆上架子第二层，和八窑那支半声的并排——哑东西们，头一回凑出了一声齐整的响。';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 姬云锦：岔掉的那半式她没改——谱的顿处旁添了新注脚「等人」（v20.78 昆仑派） ----
    'kl_event_reconcile': {
        id: 'kl_event_reconcile', npcId: 'sect_leader_昆仑派', title: '顿处的新注', icon: '🌲',
        desc: '岔掉的那半式她没改——谱的顿处旁，添了一行新注：等人。',
        minAffection: 55, trigger: { random: 1.0 }, cooldown: 0, flag: 'kl_e_reconcile_done',
        requireRivalRomance: true, requireEventDone: 'kl_event_rival',
        scenes: [
            { speaker: 'narrator', text: '舞台，卯时，晨光刚落，雪停了。那函舞谱她重新摊在石案上——岔掉的半式没有涂去，顿处旁添了一行新注，墨迹未干，注脚只有两个字：「等人」。六代的谱，注脚栏里从没出现过这两个字。她的素绸重新束上袖，双环扣的活结照旧；剑架旁多挂了一柄客剑，是从器械房请出来的，穗子擦得干干净净。', type: 'description' },
            { speaker: 'npc', text: '「岔掉的半式，我不改。」她擦着剑，没看你，掌门腔稳稳的，「谱注传了六代，人人把跳岔的都涂了。我不涂——我把它写进谱。昆仑的剑不骗人，舞也不涂错。」' },
            // v20.26 好感以 effects 真源为准（有无道侣两档），选项行不标数
            { speaker: 'npc', text: '她把剑归架，才抬眼看你，晨光落在眼底：「只是等人的规矩，我自己定。往后你上舞台，事先报名。不报——我跳我的。报了而没来……」她捻了捻素绸袖带，耳根红着，话还是稳的，「没来，是你的事。等答，是我的剑的事。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「往后我读舞的位子，只留你这一处舞台。」', effect: 'only' },
                { text: '「名我报。但有些事，我做不到了。」', effect: 'honest' },
                { text: '什么都不说，走到偏处的观位坐下，拂去蒲团上的雪，看她把问松的后半谱跳完', effect: 'silent' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = detectRivalRomance(npc.id) || { name: '那人' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'only':
                    aff = dao ? -2 : 10;
                    msg = dao
                        ? '她笑了一下，只一下，把舞谱收回案心半寸——又停住，终究没有合上。「只留一处？」她拿起剑，没拔，「你的道侣' + rival.name + '，怕是不依。步位，我懂。」台外的雪光里，一两片雪还在落，「谱你收着。路过昆仑，上舞台来读半式——这就是我能许你的『只一处』。」'
                        : '她盯着你看了很久，忽然提笔，把顿处那行新注一笔一笔描实：「等人——人来了。」描完把笔搁回笔山，「……好。」她拿起剑，朝老松的方向虚虚一礼，礼很轻，「往后晨课的问松，我少跳一式——那一式，省下来听你读舞。」';
                    if (npc.relationship && !dao) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 8);
                    break;
                case 'honest':
                    aff = dao ? 2 : 4;
                    msg = dao
                        ? '「做不到。」她点头，稳得像收剑入鞘，「剑不勉强人——松不答，就是不答。」她把舞谱翻过一页，空白朝上，「那你把做得到的说与我听。这一谱只记真的步位——记不下的，不记，也不怪。」'
                        : '「……你倒老实。」她把剑归架，「报名。」你报了，她一笔一笔写进谱的新页，写完把笔收进笔山，「往后这一谱，不管你的行止——管你报的名。昆仑的话，一句顶一式剑。」';
                    break;
                case 'silent':
                    aff = 6;
                    msg = '你走到偏处的观位，拂去蒲团上的雪，坐下。她在台上僵了一息——那个位子空了半个月，雪落了几层，她没让人扫。她没再多话，束袖，起剑，把问松的后半谱从头跳完——顿处留足半息，剑尖朝着老松，收剑时朝着你的方向停了一寸。舞毕收剑，她隔着剑背看你，忽然说：「十年晨课，替我看住岔掉半式的，只有那株老松。」她把剑柄朝你递了递：「第二双眼睛，今朝认下了。」那晨舞台的雪停了，老松的枝子一层一层直了回来。';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 翀玉衡：应收那一页她亲手转账——转进功业日记最末一栏，只进不出（v20.78 全真教） ----
    'qz_event_reconcile': {
        id: 'qz_event_reconcile', npcId: 'sect_leader_全真教', title: '转账的那一栏', icon: '🖋️',
        desc: '应收的那一页她亲手销了账——一笔一笔，转进了日记最末那一栏。',
        minAffection: 55, trigger: { random: 1.0 }, cooldown: 0, flag: 'qz_e_reconcile_done',
        requireRivalRomance: true, requireEventDone: 'qz_event_rival',
        scenes: [
            { speaker: 'narrator', text: '功录房，灯下。那页「外账·应收」让她亲手销了——销法是全真的：不烧，不撕，在栏头旁边批了两个小字「转账」，把满页的账一笔一笔誊进了功业日记的最末一栏。案上裁了一方新页，栏头空着；小银算盘摆在案心——没挂在腰间，头一回，摆在伸手就够得着的地方。', type: 'description' },
            { speaker: 'npc', text: '「应收的那页，我转了。」她没看你，拿布擦着算盘，一颗珠一颗珠擦得极慢，「账收得回来，也销得掉；转出去的账——只进，不出。」她把布搁下，「账房头一条大忌，是把活人记成死账。我把你记了半个月的死账——这一笔过错，我记我自己栏里了。」' },
            // v20.26 好感以 effects 真源为准（有无道侣两档），选项行不标数
            { speaker: 'npc', text: '她把算盘往你这边推了半寸：「只是对账的规矩，我自己定。往后你来功录房，事先报时辰。不报——我拨我的珠。报了而没来……」耳根有点红，账房腔还端着，「没来，是你的事。守栏，是我的事。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「往后我的时辰，只记进你这一栏。」', effect: 'only' },
                { text: '「时辰我报。但有些事，我做不到了。」', effect: 'honest' },
                { text: '什么都不说，提笔蘸墨，在那方空白栏头，按账目格式写下今日头一笔：是日，彼来功录房，对账一笔。记。', effect: 'silent' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = detectRivalRomance(npc.id) || { name: '那人' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'only':
                    aff = dao ? -2 : 10;
                    msg = dao
                        ? '她笑了一下，只一下，把算盘收回半寸——又停住，终究还是推回你面前。「只记我一栏？」她提起笔，没蘸墨，「你的道侣' + rival.name + '，怕是不依。账理，我懂。」灯花哔剥响了一声，「算盘你收着。路过终南，进功录房对一笔账——这就是我能许你的『只一栏』。」'
                        : '她盯着你看了很久，伸手把那具小银算盘从案心解下来，挂回腰间——挂在最外层，伸手就够得着的地方。「……好。」灯花哔剥响了一声，「往后酉时的对账，我少拨一颗珠——那一颗，省下来等你上山的时辰。」';
                    if (npc.relationship && !dao) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 8);
                    break;
                case 'honest':
                    aff = dao ? 2 : 4;
                    msg = dao
                        ? '「做不到。」她点头，平得像外账，「记账的人不勉强人——作不出价的债，记，不催。」她把那方空白新页翻过去，空白朝上，「那你把做得到的说与我听。这一栏只记真的——记不下的，不记，也不怪。」'
                        : '「……你倒老实。」她重新蘸墨，「报时辰。」你报了，她一笔一笔记下，记完把纸压进算盘底下，「往后这一栏，不管你的行止——管你报的时辰。全真的话，一句顶一颗珠。」';
                    break;
                case 'silent':
                    aff = 6;
                    msg = '你提起笔，蘸墨，在那方空白栏头按账目格式写下今日头一笔：是日，彼来功录房，对账一笔。记。字不如她的齐整，一笔一笔却实。她站在旁边看你写完最后一笔，忽然说：「十二年记账，替我拨珠的，只有我自己一双手。」她把那方新页收进日记最里层，把算盘摆在日记旁边，一册一具，端端正正。「第二双手，今晚拨通了。」那夜功录房的灯亮到三更，算盘珠归了零，一颗也没停在半路——谁的账都没讫，两个人心里都有数。';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 竺照禅：空白那一页她落了批——四个字，比哪一页都毒，也比哪一页都轻（v20.79 少林寺） ----
    'shao_event_reconcile': {
        id: 'shao_event_reconcile', npcId: 'sect_leader_少林寺', title: '批注落了', icon: '📿',
        desc: '空白的那一页她落了批——四个字：此人免批。',
        minAffection: 55, trigger: { random: 1.0 }, cooldown: 0, flag: 'shao_e_reconcile_done',
        requireRivalRomance: true, requireEventDone: 'shao_event_rival',
        scenes: [
            { speaker: 'narrator', text: '栴檀林，灯下。那函批注经摊在案上——空白的那一页落了批，墨迹未干，四个字：「此人免批。」四字底下还有一行小注：「免批者，非无过，乃骂不得也。」念珠没在她手里，搁在经案角上——头一回，珠离了手。经堂里静得能听见翻页的余声，庵外栴檀的叶子被风翻了一翻。', type: 'description' },
            { speaker: 'npc', text: '「空白的那一页，贫尼批了。」她没看你，把经页的边角一寸一寸对齐，讲经腔稳稳的，「贫尼讲戒十几年，批注从不让人——今日头一回让了：天下人都骂得，你，免批。」她对齐了最后一角，抬眼，「戒律是替活人留的，批注是替活人的心留的。贫尼的心乱了半个月——这一笔，贫尼认。」' },
            // v20.26 好感以 effects 真源为准（有无道侣两档），选项行不标数
            { speaker: 'npc', text: '她把经案角上那串念珠往你这边推了半寸，耳根有点红，毒舌找回了半分精神：「只是批注的规矩，贫尼自己定。往后你来栴檀林，事先报时辰。不报——贫尼念贫尼的经。报了而没来……」她拨了一颗珠，「没来，是你的事。留页，是贫尼的事。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「往后我的功课，只在你这一处栴檀林报。」', effect: 'only' },
                { text: '「时辰我报。但有些事，我做不到了。」', effect: 'honest' },
                { text: '什么都不说，提笔蘸墨，在「此人免批」四字旁边，按她的批注体回批一行：免批者，教不得也。教不得者，舍不得也。', effect: 'silent' }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = detectRivalRomance(npc.id) || { name: '那人' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'only':
                    aff = dao ? -2 : 10;
                    msg = dao
                        ? '她笑了一下，只一下，佛相的笑没有撑过一息，把念珠收回半寸——又停住，终究还是推回你面前。「只报一处？」她低头拨了一颗珠，「你的道侣' + rival.name + '，怕是不依。戒相，贫尼懂。」灯花哔剥响了一声，「珠你收着。路过少林，进栴檀林听半刻讲经——这就是贫尼能许你的『只一处』。」'
                        : '她盯着你看了很久，伸手把经案角上的念珠拿起来，盘回腕上——盘得很正，一伸手就够得着的地方。「……阿弥陀佛。」这一声佛号念得极稳，稳得像落定的批注，「好。往后晚课的经，贫尼少念一页——那一页省下来，问你几时上山。」';
                    if (npc.relationship && !dao) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 8);
                    break;
                case 'honest':
                    aff = dao ? 2 : 4;
                    msg = dao
                        ? '「做不到。」她点头，佛相平得像讲经腔，「讲戒的人不勉强人——经不答，就是经不答；珠不转，就是珠不转。」她把批注经翻过一页，空白朝上，「那你把做得到的说与贫尼听。这一页只批真的——批不下的，不批，也不怪。」'
                        : '「……施主倒老实。」她轻哼了一声，毒舌归了位，「老实人吃亏。吃亏的人，贫尼另教——多批一页补你。」她重新在经案前坐下，把念珠盘正，「' + rival.name + '的事，你给了断。断不干净也无妨——栴檀林的规矩，一日一功课，贫尼等得起。」';
                    break;
                case 'silent':
                    aff = 6;
                    msg = '你提起笔，蘸墨，在「此人免批」四字旁边，按她的批注体回批一行：免批者，教不得也。教不得者，舍不得也。字不如她的毒，一笔一笔却实。她站在灯边看你批完最后一笔，忽然说：「十几年功课，替贫尼的批注续笔的手，只有贫尼自己一双。」她把腕上的念珠解下来，同那函批注经一并推到你手边，一函一串，端端正正。「第二双手，今晚认下了。」那夜栴檀林的灯亮到三更，那一页两条批注并排，一条毒，一条实——像两个人并排对着做当日的功课。';
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
            // v20.25 情敌探测走全局版：男主入门文件加载时会把 window.detectRivalRomance 换成八人扫描版
            // （含四位男主）——本钩子旧版闭着本地函数（只扫四位女主），情敌若是男主，女主永远"看不见"。
            var _det = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance : detectRivalRomance;
            for (var i = 0; i < HEROINE_ROSTER.length; i++) {
                var h = HEROINE_ROSTER[i];
                if (h.sect !== loc) continue;                       // 玩家须在该女主角所在门派
                var npc = window.npcManager.getNPC ? window.npcManager.getNPC(h.id) : null;
                if (!npc) continue;
                var aff = (npc.relationship && npc.relationship.affection) || 0;

                // 1) 吃醋对峙：好感≥45、未对峙过、有情敌
                if (aff >= 45 && !hasEventTriggered(h.eventId) && _det(h.id)) {
                    var ev = NPC_PERSONAL_EVENTS[h.eventId];
                    if (ev && (!canPlayerAccessPersonalEvent || canPlayerAccessPersonalEvent(ev, npc))) {
                        _delayedRivalryFire(h.eventId, npc);
                    }
                    continue; // 当日已对峙则不重复触发和好
                }

                // 2) 和好：已对峙过、好感养回≥55、未和好过、仍有情敌
                if (h.reconcileId && aff >= 55 && hasEventTriggered(h.eventId)
                    && !hasEventTriggered(h.reconcileId) && _det(h.id)) {
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
