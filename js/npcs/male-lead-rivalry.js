// ==================== male-lead-rivalry.js - 男主吃醋事件 + 扩展情敌探测 v1.0 ====================
// 依赖：npcs/npc-personal-events.js、npcs/heroine-rivalry.js（detectRivalRomance/HEROINE_ROSTER）
// 加载顺序：在 heroine-rivalry.js + 十六位男主事件文件之后
//
// 功能：
//   1. 扩展 detectRivalRomance：除女主角外，也探测男主情敌（男主↔男主、男主↔女主 互测）。
//   2. 16 位男主各 1 个吃醋对峙事件（requireRivalRomance），复用既有门禁与每日钩子机制。
//   v20.76 第二批：嵩山逵佩南（执法卷宗察觉，「待勘」记失态）、丐帮桑拾玖（讯房消息察觉，装作不知道）入册。
//   v20.77 第三批：阎罗殿聂明泽（生死簿记档人，把醋意写成「并案？」一页档，朱笔悬着落不下去）入册。
//   v20.78 第四批：霹雳堂雷惊蛰（酸话记成流水账批注，引信剪得比平日短）、天书阁宓书言（批「讹」又划掉改「存疑」，
//   页角被笔尖戳破）、大隐阁隗九爻（连起三卦全大凶，把签头那颗风干山楂吃了）、侠隐阁简知忆（新立一档「危险程度：高」，
//   附页写三页又全销毁）、天涯海阁狄长亭（路引里程多算三站）、大旗门樊惊筹（护腕加一排拆不出的加固针）入册，十六位男主齐。

// ============ 扩展情敌探测：在原女主角探测基础上加男主 ============
var _origDetectRivalRomance = (typeof window !== 'undefined') ? window.detectRivalRomance : null;
function _detectRivalRomanceAll(excludeId) {
    // 先查男主名册
    var roster = (typeof window.MALE_LEAD_ROSTER === 'object') ? window.MALE_LEAD_ROSTER : [];
    if (window.npcManager) {
        for (var i = 0; i < roster.length; i++) {
            var r = roster[i];
            if (!r || r.id === excludeId) continue;
            var npc = window.npcManager.getNPC ? window.npcManager.getNPC(r.id) : null;
            if (!npc) continue;
            var isDao = !!(npc.hasFlag && npc.hasFlag('dao_companion'));
            var confessed = !!(npc.memory && npc.memory._loveAccepted_confess);
            if (isDao || confessed) {
                return { id: r.id, name: r.name, sect: r.sect, isDaoCompanion: isDao, gender: 'male' };
            }
        }
    }
    // 回退到原女主角探测
    if (typeof _origDetectRivalRomance === 'function') return _origDetectRivalRomance(excludeId);
    return null;
}
if (typeof window !== 'undefined') window.detectRivalRomance = _detectRivalRomanceAll;

// ============ 吃醋时：情敌与吃醋NPC异性才加一句，同性不额外感叹 ============
// 只在情敌性别≠吃醋NPC性别时发声——NPC意识到玩家还喜欢另一性，值得点一句。
// 同性则不发声（对方性别对NPC无意外）。
function _rivalSexFlavor(npc, rival) {
    if (!npc || !rival || !rival.gender) return '';
    if (npc.gender === rival.gender) return ''; // 同性：不额外感叹
    var n = npc.name || '他', rn = rival.name || '那人';
    if (npc.gender === 'male') {
        // NPC男，情敌女
        return n + '顿了一下：「……' + rn + '是个姑娘。」他眼神复杂了一瞬，「没想到你也喜欢女子。」';
    }
    // NPC女，情敌男
    return n + '顿了一下：「……' + rn + '是个男人。」她眼神复杂了一瞬，「没想到你也喜欢男子。」';
}
if (typeof window !== 'undefined') window._rivalSexFlavor = _rivalSexFlavor;

// ============ 16 位男主吃醋对峙事件 ============
var MALE_RIVALRY_EVENTS = {
    // ---- 冶砚：铸剑山庄，火性，吃醋最直 ----
    'lu_event_rival': {
        id: 'lu_event_rival', npcId: 'sect_leader_铸剑山庄', title: '炉前的沉默', icon: '🥀',
        desc: '他一锤没落，盯着你。',
        minAffection: 45, trigger: { random: 1.0 }, cooldown: 0, flag: 'lu_e_rival_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '炉房。冶砚一锤悬着没落，琥珀眼底炉火一映，看的不是铁，是你。', type: 'description' },
            { speaker: 'npc', text: '「我听说了。」他声音闷，火性压着，「你在外头，有了别的人。」' },
            { speaker: 'npc', text: '「铸剑的，眼里不掺沙子。」他把锤一搁，「你给我句话。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「是。我不瞒你。」', effect: 'admit', affection: -5 },
                { text: '「你听谁胡说的。」', effect: 'deny', affection: -10 },
                { text: '「……我没辜负你。」', effect: 'defend', affection: -6 }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            if (!rival) return { affection: 0, msg: '（无人可对峙——你已无他情。）' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'admit':
                    aff = dao ? -10 : -5;
                    msg = dao
                        ? '他一锤砸在铁砧上，火星迸了一脸：「道侣？'+rival.name+'？」他背对你，「……滚。下回让我看见你，炉前没你位。」'
                        : '他「嘁」了一声，虎牙没露：「'+rival.name+'。我以为你至少编个名字。」他重新举锤，「滚回去想清楚——要我，还是'+rival.name+'。两头占着，炉前容不下。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 15);
                    break;
                case 'deny':
                    aff = dao ? -16 : -10;
                    msg = '他猛地砸锤，铁砧一声脆响：「'+rival.name+'的事，铸剑山庄的炉灰都飘到了——你当我眼瞎？」他把锤一扔，「滚。这炉前的位，你再坐不下。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 20);
                    break;
                case 'defend':
                    aff = dao ? -12 : -6;
                    msg = '他盯着你，琥珀眼底炉火渐灭：「……没辜负？」他冷笑，「你与'+rival.name+(dao?'结了道侣':'动了情')+'，再站到我炉前说没辜负我——」他摇头，「冶砚最怕的，就是有人笑着拿刀。」';
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 芩木：药王谷，温润，碎起来最冷 ----
    'su_event_rival': {
        id: 'su_event_rival', npcId: 'sect_leader_药王谷', title: '凉茶', icon: '🥀',
        desc: '他递来的茶，是凉的。',
        minAffection: 45, trigger: { random: 1.0 }, cooldown: 0, flag: 'su_e_rival_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '药庐。芩木推一只茶杯给你——凉的。他温润地笑，浅褐眼底什么都没有。', type: 'description' },
            { speaker: 'npc', text: '「我听说了。」他温润得听不出情绪，「你在外头，有了别的人。」' },
            { speaker: 'npc', text: '「医者不能带情绪——这话我跟你说过的。」他抬眼，「可我没说过，医者不能疼。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「是。我不瞒你。」', effect: 'admit', affection: -5 },
                { text: '「你听谁胡说的。」', effect: 'deny', affection: -10 },
                { text: '「……我没辜负你。」', effect: 'defend', affection: -6 }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            if (!rival) return { affection: 0, msg: '（无人可对峙——你已无他情。）' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'admit':
                    aff = dao ? -8 : -5;
                    msg = dao
                        ? '他怔了很久，温润地笑了：「……道侣。'+rival.name+'。」他把凉茶倒进药炉，「茶凉了就别喝了。药庐以后也不必来了——你的道侣，会替你温茶。」'
                        : '他点头，像是早料到：「那位是'+rival.name+'吧。」他把热茶推到一边，「你瞒着，我反倒高看你一眼。如今……茶你自己倒。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 12);
                    break;
                case 'deny':
                    aff = dao ? -16 : -10;
                    msg = '他笑出声，温润得发凉：「'+rival.name+'的事，半个江湖都知道——你当药王谷的耳目是摆设？」他把凉茶泼在药炉火里，火「噗」地灭。「以后别来了。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 15);
                    break;
                case 'defend':
                    aff = dao ? -12 : -6;
                    msg = '他静静看着你，浅褐眼底第一次有了真的东西——是疼。「没辜负？」他轻声，「你与'+rival.name+(dao?'结了道侣':'动了情')+'，再站到我药庐里说没辜负我——」他摇头，「芩木这辈子最怕的，就是有人笑着拿刀。」';
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 昴既明：茅山派，清冷，吃醋最沉 ----
    'ms_event_rival': {
        id: 'ms_event_rival', npcId: 'sect_leader_茅山派', title: '符阁的冷', icon: '🥀',
        desc: '他画符的笔，停了。',
        minAffection: 45, trigger: { random: 1.0 }, cooldown: 0, flag: 'ms_e_rival_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '符阁。昴既明执笔不动，朱砂滴在黄纸上，洇开。他左眼银光没看你。', type: 'description' },
            { speaker: 'npc', text: '「……我知道了。」他声音清冷，「你在外头，有了别的人。你心里那位。」' },
            { speaker: 'npc', text: '「我不问你为何。」他抬眼，银光里冻下去，「我来茅山，是为了走，还是为了躲你？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「都不是。我来看你。」', effect: 'visit', affection: 4 },
                { text: '「……我对不住你。」', effect: 'admit', affection: -8 },
                { text: '「我有我的难处。」', effect: 'excuse', affection: -6 }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            if (!rival) return { affection: 0, msg: '（无人可对峙——你已无他情。）' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'visit':
                    aff = dao ? -6 : 4;
                    msg = dao
                        ? '他执笔的手一紧，银光敛去：「道侣都立了，还来看我——你是来告诉我，符阁不必留灯了？」他收笔，「回去。门，今日起为'+rival.name+'落锁。」'
                        : '他看了你很久，银光里一线冻：「'+rival.name+'的事，我已听见风声。你既来了——今日不拔符。」他让开半步，符阁门开一线，「但护身符，要的是一心一意。你心里两个名字，符不认。」';
                    break;
                case 'admit':
                    aff = dao ? -14 : -8;
                    msg = '他极轻地「嗯」了一声，朱砂笔搁下。「对不住。」他把未画完的符推到一旁，「这道符，本来是替你画的。如今——不必了。你走吧。符阁的灯，今晚起不留。」';
                    break;
                case 'excuse':
                    aff = dao ? -12 : -6;
                    msg = '他沉默半晌，银光里结了一层霜：「难处。」他重复，「我渡了二十年魂，等一个人——这是我的难处。你的难处，是'+rival.name+'。」他转身，「门落锁了。」';
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 赫渊：金刚宗，沉默，吃醋最重 ----
    'jg_event_rival': {
        id: 'jg_event_rival', npcId: 'sect_leader_金刚宗', title: '塔内的沉默', icon: '🥀',
        desc: '他没说话，但金刚线缠紧了。',
        minAffection: 45, trigger: { random: 1.0 }, cooldown: 0, flag: 'jg_e_rival_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '金刚塔内。赫渊盘坐，右臂金刚线缠了一圈又一圈。他没看你，也没开口。', type: 'description' },
            { speaker: 'npc', text: '他沉默很久。然后从袖里摸出木牌——「闭口禅」三字。他把木牌翻过来——背面刻着一个名字，被他自己划花了。' },
            { speaker: 'npc', text: '他把木牌推到你面前。没说话。意思：你心里那位，他认得了。' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「……我对不住你。」', effect: 'admit', affection: -8 },
                { text: '「你想多了。」', effect: 'deny', affection: -12 },
                { text: '不说话，跪坐到他面前', effect: 'kneel', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            if (!rival) return { affection: 0, msg: '（无人可对峙——你已无他情。）' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'admit':
                    aff = dao ? -14 : -8;
                    msg = '他闭眼，许久。再睁眼，沉静的眼底什么都没了。「……对不住。」他合十，把木牌收回，「你走吧。这塔，我自个儿守。」——他没再开口。闭口禅，又续上了。';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 10);
                    break;
                case 'deny':
                    aff = dao ? -18 : -12;
                    msg = '他看你，沉静的眼底第一次有了冷意。他把木牌一翻——背面那个被划花的名字，是'+rival.name+'。「你想多了。」他哑声——为你破了闭口禅，「'+rival.name+'与你'+(dao?'已结道侣':'情愫暗生')+'。我渡了一辈子魂，没见过走眼成这样的。」他起身，「滚。塔门闭了。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 18);
                    break;
                case 'kneel':
                    aff = dao ? -4 : 5;
                    msg = dao
                        ? '你没说话，跪坐到他面前。他许久没动，金刚线松了一线。「道侣都立了……还跪我。」他闭眼，「走吧。别再来——再破戒，我修不回。」'
                        : '你没说话，跪坐到他面前。他看着你，许久，金刚线松了一线。他没开口，但把你面前的木牌——翻回正面。意思：闭口禅，今日为你续上。';
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 竺听雨：华山派，笑着说重话，痛了就不笑（v20.73 入册） ----
    'hs_event_rival': {
        id: 'hs_event_rival', npcId: 'sect_leader_华山派', title: '新立的一页', icon: '🥀',
        desc: '他笑着数你来的回数。',
        minAffection: 45, trigger: { random: 1.0 }, cooldown: 0, flag: 'hs_e_rival_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '雨夜。你上剑堂——堂里点着灯，竺听雨没在听雨。他坐在案后，面前摊着一本账，笔搁着，像在等人。', type: 'description' },
            { speaker: 'npc', text: '「来了。」他抬头笑，笑得跟平常一样松，「坐。今夜雨大，我不听雨——听你说句话。」' },
            { speaker: 'npc', text: '他把账本转过来推到你面前。新立的一页，一笔一笔记着你上山的日子。「我数了，这个月你来了三回。从前是七回。」他笑着说，眼底不笑，「华山的账，我十年没记错。这一页，我也不想记错。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「是。我不瞒你。」', effect: 'admit', affection: -5 },
                { text: '「你听谁胡说的。」', effect: 'deny', affection: -10 },
                { text: '「……我没辜负你。」', effect: 'defend', affection: -6 }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            if (!rival) return { affection: 0, msg: '（无人可对峙——你已无他情。）' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'admit':
                    aff = dao ? -10 : -5;
                    msg = dao
                        ? '他笑了一下，把那页账合上，指腹在页角压了压：「道侣。'+rival.name+'。」他摆手，摆得很轻，「……恭喜。华山欠你的这笔，我账上销了。」他走到檐下，背对你听雨——那夜他没笑，也没回头。'
                        : '他「哦」了一声，笑得比平常响：「'+rival.name+'。」他搁笔，笔在案上滚了半圈，「行啊。我以为你至少编个名字——你倒老实。」他重新翻开账本，「回去想清楚：要我，要'+rival.name+'。两头挂着，我这账记不平。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 15);
                    break;
                case 'deny':
                    aff = dao ? -16 : -10;
                    msg = '他笑出了声，笑声在空剑堂里荡了一下：「'+rival.name+'的事，苍龙岭挑水的师弟都听见过三回——你当华山没耳朵？」他把账本推到灯下，那一页一笔一笔全是你的来去日子，「我这十年最会记账。你骗谁都行，别骗这一页。」他起身，「雨大了。走吧。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 20);
                    break;
                case 'defend':
                    aff = dao ? -12 : -6;
                    msg = '他看着你，笑还挂在脸上，眼底却一寸寸静下去：「没辜负。」他把这三个字嚼了一遍，「你与'+rival.name+(dao?'结了道侣':'动了情')+'，再站到我剑堂里说没辜负——」他抬手摆了摆，声音仍是软的，「我笑了十年。笑底下藏着什么，我最认得。你别拿我的笑，还我。」';
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 阙守拙：武当派，话少而慢，数目不说谎（v20.74 入册） ----
    'wd_event_rival': {
        id: 'wd_event_rival', npcId: 'sect_leader_武当派', title: '十一双脚印', icon: '🥀',
        desc: '他扫着阶，数你这个月来的回数。',
        minAffection: 45, trigger: { random: 1.0 }, cooldown: 0, flag: 'wd_e_rival_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '晨雾里的山门石阶。阙守拙在扫阶，扫三步，退两步。你上山——他的扫帚停了。', type: 'description' },
            { speaker: 'npc', text: '「石阶上你的脚印。」他不看你，「这个月，十一双。从前，二十六双。」' },
            { speaker: 'npc', text: '扫帚又动起来，一下，一下。扫过两步，他才把后半句放下，放得极平：「我数得慢。慢，就数得清。」他顿了顿，「你给我句话。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「是。我不瞒你。」', effect: 'admit', affection: -5 },
                { text: '「你听谁胡说的。」', effect: 'deny', affection: -10 },
                { text: '「……我没辜负你。」', effect: 'defend', affection: -6 }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            if (!rival) return { affection: 0, msg: '（无人可对峙——你已无他情。）' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'admit':
                    aff = dao ? -10 : -5;
                    msg = dao
                        ? '他把扫帚立在阶旁，立得很直，半天没说话。「道侣。'+rival.name+'。」这两个字他说得极轻，像怕惊了阶上的雾。他重新扫起来，扫得比先前更慢：「好。这千级阶，我还数。只是不数你的了。」'
                        : '他「嗯」了一声，点头，像把一个数了很久的心事数实了：「'+rival.name+'。」扫帚又动起来，扫过两步，才有后半句，「老实。好。」他顿了顿，「回去想清楚：要我，要'+rival.name+'。一级阶，放不下两双脚印。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 15);
                    break;
                case 'deny':
                    aff = dao ? -16 : -10;
                    msg = '扫帚压在石阶上，不动了。「你的脚印，这个月十一双。」他终于抬眼看你，眼神直得没有一处可躲，「'+rival.name+'的事，看香火的小道童都数得出来。我每晨扫这千级阶——阶上过了什么，我最清。」他重新扫起来，一下比一下沉，「走吧。说谎的人，脚印是乱的。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 20);
                    break;
                case 'defend':
                    aff = dao ? -12 : -6;
                    msg = '他停了扫。半晌，把那三个字捡起来，放平：「没辜负。」他看你，目光直得像剑：「你与'+rival.name+(dao?'结了道侣':'动了情')+'，再站到这千级阶上，说没辜负——」他把扫帚收拢，声音很低，一字是一字，「我拙。拙，就记得实。你别叫我，重数一遍。」';
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 闻人酌：逍遥派，慵懒机锋，酒不会说谎（v20.75 入册） ----
    'xy_event_rival': {
        id: 'xy_event_rival', npcId: 'sect_leader_逍遥派', title: '七分酒', icon: '🥀',
        desc: '他给你斟酒，斟到七分停了。',
        minAffection: 45, trigger: { random: 1.0 }, cooldown: 0, flag: 'xy_e_rival_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '酒仙池边。闻人酌躺在酒坛边抚琴，见你上山，琴音没停，只抬了抬下巴示意石桌。桌上两只盏。他坐起身，提壶给你斟酒——斟到七分，停了。', type: 'description' },
            { speaker: 'npc', text: '「你这杯，上月见底要一盏半时辰。」他晃着自己那盏，笑得慵懒，「这个月，两盏。」' },
            { speaker: 'npc', text: '他把那七分酒推到你面前，指尖在盏沿轻轻敲了敲：「酒不会说谎。喝酒的人会。」他支着下巴看你，「你给我句话。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「是。我不瞒你。」', effect: 'admit', affection: -5 },
                { text: '「你听谁胡说的。」', effect: 'deny', affection: -10 },
                { text: '「……我没辜负你。」', effect: 'defend', affection: -6 }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            if (!rival) return { affection: 0, msg: '（无人可对峙——你已无他情。）' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'admit':
                    aff = dao ? -10 : -5;
                    msg = dao
                        ? '他给自己那盏续满，一饮而尽，把空盏倒扣在坛盖上。「道侣。'+rival.name+'。」他笑了笑，笑得慵懒，眼底不懒，「庄周梦蝶——我原先当自己是你盏里那一梦。如今醒了，梦有主了。」他躺回酒坛边，背对着你，「往后你的酒，'+rival.name+'替你斟。逍遥派的课：不留人。我……不送。」'
                        : '他「哦」了一声，笑意慵懒如常：「'+rival.name+'。」他给自己斟了一盏，慢慢晃着，「老实。我以为你至少编个名字——你倒把真的给我了。」他仰头饮尽，「回去想清楚：要我，要'+rival.name+'。一只盏，斟不下两种酒。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 15);
                    break;
                case 'deny':
                    aff = dao ? -16 : -10;
                    msg = '他不恼，反倒笑了，提壶把那七分酒倒回坛里：「'+rival.name+'的事，酒香飘得比流言远——满江湖都闻见了，你当我这座山没鼻子？」他把盏子搁下，语气仍旧慵懒，字却清楚，「我斟酒看手。你方才接盏的手，抖了一下——抖，不是盏沉，是盏里有心事。说谎的人，手不稳。」他躺回酒坛边，「走吧。这盏酒，酸了。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 20);
                    break;
                case 'defend':
                    aff = dao ? -12 : -6;
                    msg = '他把那七分酒端起来，对着天光看了看，又放回你面前。「没辜负。」他笑着把这三个字嚼了一遍，像嚼一颗酸果，「你与'+rival.name+(dao?'结了道侣':'动了情')+'，再坐到我的石桌边说没辜负——」他提壶给自己斟满，一饮而尽，「逝者如斯。我这半盏凉得多快，你不看。你只看我笑。」';
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 逵佩南：嵩山派，条文式精确寡言，把自己的失态记成一笔「待勘」（v20.76 入册） ----
    'song_event_rival': {
        id: 'song_event_rival', npcId: 'sect_leader_嵩山派', title: '一笔待勘', icon: '🥀',
        desc: '他把自己没写进条文的失态，记成了一笔「待勘」。',
        minAffection: 45, trigger: { random: 1.0 }, cooldown: 0, flag: 'song_e_rival_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '深夜执法堂。逵佩南在案后核卷，玄衣银扣系到领口。案角压着一页新纸，纸上只两个字：待勘。你进门，他没抬头，先把手里的卷宗归档——归得一丝不苟，才开口。', type: 'description' },
            { speaker: 'npc', text: '「执法堂新立一案。」他把那页纸推过来，声音平得像念条文，「无被告，无罪由。案由一桩：本人失态。失态没有写进条文——查不到出处的事，依例记『待勘』。」' },
            { speaker: 'npc', text: '「失态的来路，我核过了。」他抬眼看你，目光沉静，「你在外头与一个人的事。文书到了嵩山，字字体面，条条有出处。」他把笔搁下，「判词未写。依例，落笔之前，问一声当堂的人。你给我句话。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「是。我不瞒你。」', effect: 'admit', affection: -5 },
                { text: '「你听谁胡说的。」', effect: 'deny', affection: -10 },
                { text: '「……我没辜负你。」', effect: 'defend', affection: -6 }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            if (!rival) return { affection: 0, msg: '（无人可对峙——你已无他情。）' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'admit':
                    aff = dao ? -10 : -5;
                    msg = dao
                        ? '他提起笔，在那页「待勘」上一字一字写完判词，写得极工整，写完归档——归档的手稳如平日，只有纸角被指腹压出了一道折痕。「道侣。'+rival.name+'。」他把笔搁回砚上，「例外要两心相合。此案，不合。」他吹熄了灯，黑暗里声音仍旧平，平得近乎冷，「依例。结案。」'
                        : '「老实。」他把这两个字核了一遍，点头，在卷上记了一笔，「记在『人』字栏。」他重新提笔，笔悬在纸上，很久没有落下，「回去想清楚：要我，要'+rival.name+'。执法堂断案，一案不容两造——你这一案，两个名目，判词写不下去。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 15);
                    break;
                case 'deny':
                    aff = dao ? -16 : -10;
                    msg = '他从案下取出一摞卷宗，一页一页摊平——你的来去日子、你在外头说过的话，条条有出处，字字对得上。「执法堂核档，不核人。」他终于抬眼，眼神直得没有一处可躲，「'+rival.name+'的事，五岳的文书都到了我案上——你当嵩山没有眼睛？」他把那页「待勘」收起，收得极稳，「走吧。说谎的人，判词最乱。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 20);
                    break;
                case 'defend':
                    aff = dao ? -12 : -6;
                    msg = '「没辜负。」他把这三个字放进口里核了一遍，核得很慢，像核一条陌生的条文。然后他摇头，取出一页空白的判词纸，摊平，提笔——悬住，不落。「你与'+rival.name+(dao?'结了道侣':'动了情')+'，再站到我执法堂里说没辜负——」他把笔收回砚上，声音低了半度，「这一判，写不出。写不出的，记『待勘』。待勘没有期限。你——也没有。」';
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 桑拾玖：丐帮，讯房消息——你的事他比你先知道，但他装作不知道（v20.76 入册） ----
    'gai_event_rival': {
        id: 'gai_event_rival', npcId: 'sect_leader_丐帮', title: '压着的签', icon: '🥀',
        desc: '他讲别人的故事眉飞色舞——讲到你的，收住了。',
        minAffection: 45, trigger: { random: 1.0 }, cooldown: 0, flag: 'gai_e_rival_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '城南沙粥棚。桑拾玖照旧说书，满棚叫好。你坐下，他讲书的手没停，只把半碗粥推到你手边——粥温着，碗口的豁冲着他自个儿。', type: 'description' },
            { speaker: 'npc', text: '他讲一段新书收梢：「列位，说个过路人。这位过路人有意思——原先十天来听八回书，这个月，两回。」满棚笑。他也笑，眉飞色舞。笑完，把书收住，收得干干净净，「这一段，三分真，七分好听。真的那三分——」他端起粥碗呷了一口，眼睛看着你。' },
            { speaker: 'npc', text: '他压低了声音，只够你一个人听见，语气平得像在核签：「讯房的消息：你的事，我比你先知道。」他把碗搁下，「我装了半个月不知道。今日装不住了。你给我句话。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「是。我不瞒你。」', effect: 'admit', affection: -5 },
                { text: '「你听谁胡说的。」', effect: 'deny', affection: -10 },
                { text: '「……我没辜负你。」', effect: 'defend', affection: -6 }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            if (!rival) return { affection: 0, msg: '（无人可对峙——你已无他情。）' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'admit':
                    aff = dao ? -10 : -5;
                    msg = dao
                        ? '他把碗搁下，很久没说话——讯房的人手最稳，指节却在碗沿的豁口上按了一按。「道侣。'+rival.name+'。」他笑了笑，笑没到眼底，「我讲了十二年书，最苦的一段，是头一个知道、又不肯讲的那一段。」他把碗里的粥泼进棚边的沙地里，碗涮净，收进怀里，「故事讲错了人，比不讲还伤。我这条——自个儿销案。」'
                        : '「哦？」他挑了挑眉，眉飞色舞跟讲书时一模一样，眼睛却不笑，「'+rival.name+'。」他把这个名字入了心里那册子，入得极慢，「老实。来路这一条，齐了。」他把半碗粥又推回你面前，「回去想清楚：要我，要'+rival.name+'。一册子，压不下两个头条。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 15);
                    break;
                case 'deny':
                    aff = dao ? -16 : -10;
                    msg = '他笑出了声，笑得像讲书讲到满堂彩，眉飞色舞却一寸一寸收干净。「'+rival.name+'的事，讯房的接力一夜跑三千里——你当我那面签墙是摆设？」他从怀里摸出一支竹签，在案上轻轻磕了两下，又收回去，「消息三条腿：来路、口气、日子。你方才那句话，三条腿全断。」他把碗涮了，倒扣在案角，「走吧。讯房收天下消息，不收谎。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 20);
                    break;
                case 'defend':
                    aff = dao ? -12 : -6;
                    msg = '「没辜负。」他把这三个字在嘴里滚了一圈，像滚一个讲不圆的字。「你与'+rival.name+(dao?'结了道侣':'动了情')+'，再坐到我粥棚里说没辜负——」他端起碗呷了一口，搁下，声音压得极低，「讲别人的故事，我眉飞色舞。讲自个儿的，我收住。收住的那一半，你从来没看过。今日也不必看了。」';
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 聂明泽：阎罗殿，生死簿短句又短又平，把醋意写成「并案？」一页档，朱笔悬着落不下去（v20.77 入册） ----
    'yan_event_rival': {
        id: 'yan_event_rival', npcId: 'sect_leader_阎罗殿', title: '并案', icon: '🥀',
        desc: '他把你和另一个人，写进了同一页档。',
        minAffection: 45, trigger: { random: 1.0 }, cooldown: 0, flag: 'yan_e_rival_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '深夜档房。聂明泽在案后核档，核的却是同一页——翻过去，又翻回来。案角立着一页新档，页首墨迹未干：你的名字，并排还有一个名字，写在同一行。两个名字旁边，一个极小的批注，朱笔悬着没落：「并案？」', type: 'description' },
            { speaker: 'npc', text: '「你来了。」他没抬头，先把手里的册子归进近手的一格——归档的动作一丝不苟，归完才开口，又短又平，像念档，「档房上月新立一案。无罪状，无被告。案由一桩：这一页，归不了格。」' },
            { speaker: 'npc', text: '他把那页档摊平，转过来给你看——你的名字与那人的名字并排，中间只隔一寸笔迹。「一页两名。档规卷二：来路不明者，不入册。」他的指尖悬在「并案？」那个批注上方，没有碰，「你的来路很明。我查过四百遍。可这一页——朱笔悬着。落不下去。」他抬眼看你，「落笔之前，依例，问一声当堂的人。你给我句话。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「是。我不瞒你。」', effect: 'admit', affection: -5 },
                { text: '「你听谁胡说的。」', effect: 'deny', affection: -10 },
                { text: '「……我没辜负你。」', effect: 'defend', affection: -6 }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            if (!rival) return { affection: 0, msg: '（无人可对峙——你已无他情。）' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'admit':
                    aff = dao ? -10 : -5;
                    msg = dao
                        ? '他看着那两个名字，看了很久，然后把那页档对折，收进匣底。「道侣。'+rival.name+'。」四个字念得平平的，平得像念别人的档，念完才多出一行小字似的一句：「并案批注，作废。此页，不入册。」他把朱笔搁回笔山，笔帽扣严——扣得极严。「档规卷一：无主之档，焚。这一页有主。」他吹了灯，黑暗里声音仍旧平，「主，不是我。归档，完毕。」'
                        : '「老实。」他把这两个字核了一遍，点头，取朱笔——又悬住了。「记在『人』字栏。」他把笔搁下，耳朵红着，话却更平，「回去想清楚：要我，要'+rival.name+'。生死簿的格式，一页一个命格。两个名字挤在一页——我写得出来。核的人，核不下去。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 15);
                    break;
                case 'deny':
                    aff = dao ? -16 : -10;
                    msg = '他不恼，只把那页档推到灯下，指给你看两个名字。「档规卷一：所见皆录。」他从案下取出一沓旧档，一页一页摊平——你的来去日子、你在外头说过的话，条条有出处，「'+rival.name+'的事，江湖的文书早到了我案上。你当阎罗殿千架档，只收纸，不收人？」他把那页「并案？」收进匣底，收得极稳，「走吧。说谎的人，墨迹最乱。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 20);
                    break;
                case 'defend':
                    aff = dao ? -12 : -6;
                    msg = '「没辜负。」他把这三个字核了一遍，核得极慢，像核一页伪档。朱笔还悬着，一滴朱砂落下来，洇在两个名字中间。「你与'+rival.name+(dao?'结了道侣':'动了情')+'，再站到我案前说没辜负——」他把笔收回笔山，把那页档折上一折，立进甲字一号格，声音平得裂了一条缝，「这一页，缓。档规卷二：存疑者，缓。缓期——」他停了很久，「头一回，填不出来。」';
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 雷惊蛰：霹雳堂，声轻、要紧的话更轻，酸话记成流水账批注，引信剪得比平日短（v20.78 入册） ----
    'pi_event_rival': {
        id: 'pi_event_rival', npcId: 'sect_leader_霹雳堂', title: '受潮的批注', icon: '🥀',
        desc: '他把心里那点酸，记成了方子册里的一条流水账。',
        minAffection: 45, trigger: { random: 1.0 }, cooldown: 0, flag: 'pi_e_rival_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '三更，药坊。雷惊蛰坐在案前量引信，左手样尺，右手炭笔。案角摊着方子册——摊开的是批注页，今日的日期底下记着一行：「是日，硝受潮。人也受潮。」字比哪一条方子都小。长案尾头躺着一把今日扎好的引信，你一眼看出来：每一根，都剪得比平日短。', type: 'description' },
            { speaker: 'npc', text: '「你来了。」他没抬头，先把炭笔搁下，声音很轻，「批注里记了一条新的。」他把册子往你那边推了半寸，轻得你要俯身才听得见：「是日，有人在堂外头打听你。四回。四回，太多了。」' },
            { speaker: 'npc', text: '他指了指案尾那把引信，声音更轻：「今日的引信，我剪短了。」他顿了顿，像在心里称下一句药的份量，称完才说：「引信短，雷就快。雷快——人就来不及想。我想了三天，想不明白，只好剪引信。」耳根红着，手却稳。他抬眼看你：「记档之前，按批注的格式，问一声当堂的人。你给我句话。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「是。我不瞒你。」', effect: 'admit', affection: -5 },
                { text: '「你听谁胡说的。」', effect: 'deny', affection: -10 },
                { text: '「……我没辜负你。」', effect: 'defend', affection: -6 }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            if (!rival) return { affection: 0, msg: '（无人可对峙——你已无他情。）' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'admit':
                    aff = dao ? -10 : -5;
                    msg = dao
                        ? '他盯着批注里「人也受潮」那一行，看了很久，然后把册子合上了，合得端端正正。「道侣。'+rival.name+'。」这四个字他念得极轻，念完补了那句惯常的补白，比平日还轻：「……我说了。我真的说了。」他把炭笔收回怀里，「方子册的规矩：受潮的药，封缸，不入方。这一页批注——封缸。」他背过身，把那把短引信一根一根收回箱里，收得很稳，「封缸的药，不晒。也是规矩。」'
                        : '「老实。」他把这两个字放上秤，称了称，点头，取炭笔在批注里添了一行：「是日，那人认了。认了——也是方子。」写完他把册子抱在怀里按了一下，「回去想清楚：要我，要'+rival.name+'。一册方子，硝六硫四——两个方子挤在一册，秤不平。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 15);
                    break;
                case 'deny':
                    aff = dao ? -16 : -10;
                    msg = '他不恼，只从案尾拿起一根短引信，举到灯下给你看捻口。「霹雳堂验雷靠响。我验话，靠份量。」他声音还是轻的，字却一个一个钉得稳，「'+rival.name+'的事，山下带上来，比雷声还快——你当我这间药坊没有耳朵？」他把引信搁回去，搁得和案沿平行，「引信剪短，是因为想不明白。想不明白的事，你一句『胡说』，就更明白了。」他吹了灯，黑暗里声音轻得像批注：「走吧。说谎的人，引信都是短的。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 20);
                    break;
                case 'defend':
                    aff = dao ? -12 : -6;
                    msg = '「没辜负。」他把这三个字嚼了一遍，嚼得很慢，像嚼一味化不开的药。「你与'+rival.name+(dao?'结了道侣':'动了情')+'，再站到我药坊案前说没辜负——」他翻开方子册，炭笔悬在批注上方，悬了很久没有落，「这一条，我写不出来。写不出来的，不写。册子有规矩：写不出的条目，空着。」他把那一行空着，合上册子，抱在怀里，「空着，比受潮还沉。这一味——秤上称不出来。」';
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 宓书言：天书阁，校讎剑客、批语不超四字，给你身边那人批「讹」又划掉改「存疑」（v20.78 入册） ----
    'shu_event_rival': {
        id: 'shu_event_rival', npcId: 'sect_leader_天书阁', title: '讹字划掉', icon: '🥀',
        desc: '他给你身边那人立了一个字的批注——「讹」，又自己划掉了。',
        minAffection: 45, trigger: { random: 1.0 }, cooldown: 0, flag: 'shu_e_rival_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '三更，万卷楼顶层。宓书言在校一沓新到的竹纸，笔不停——可今夜这一页乱了。你走近案头看见：纸上写着一个名字，你身边那个人的名字。名字旁边落了一个字的批注：「讹」。字刚成形就被一笔划掉，划的笔画比写的重；划掉旁边，重新写了两个字：「存疑」。那一页的页角被笔尖戳破了一个洞，洞透着灯光。', type: 'description' },
            { speaker: 'npc', text: '「讹者，误字也。误字当圈，当改，当出校记。」他语速又快又平，像往常一样，可字与字之间，头一回不密了，「这个名字，我核了三遍。第一遍，结论：讹。第二遍：讹，疑。第三遍——」他停住，把笔搁下，「存疑。存疑，不改。」' },
            { speaker: 'npc', text: '他把那页戳破的纸转过来给你看，扶手边的「校讎」剑一寸没动，眼神却比剑锋还直：「天书阁的校记，录字，不录人。今夜这一页破例——录了人。」他的指尖在页角那个破洞上点了点，「落笔定稿之前，按我的规矩，问一声当堂的人。你给我句话。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「是。我不瞒你。」', effect: 'admit', affection: -5 },
                { text: '「你听谁胡说的。」', effect: 'deny', affection: -10 },
                { text: '「……我没辜负你。」', effect: 'defend', affection: -6 }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            if (!rival) return { affection: 0, msg: '（无人可对峙——你已无他情。）' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'admit':
                    aff = dao ? -10 : -5;
                    msg = dao
                        ? '他执笔的手停了半息。他看着「存疑」两个字，看了很久，然后提笔——把它们也划掉了。划完没有写新字，搁笔，笔搁得和砚台对齐。「道侣。'+rival.name+'。这四个字——」他顿了顿，「无从校起。无典可对，无古可证。」他把那页戳破的纸推到案头最远的一角，「存疑不改的规矩，我守了三年。今夜才明白：不改，不是存疑，是不敢定稿。这一页，定稿：讹。讹在我。」他吹了灯，黑暗里声音还是又快又平，平得起了毛边，「校记，明日补。」'
                        : '「老实。」他点头，提笔在那页上出校记，出得极慢：「是日，其人自承。承，则讹字可削。」写完他从签筒里抽出一张竹纸签，写了两个字压在你手边：「存疑。」他抬眼看你，耳根红着，话却撑得又平又稳，「回去想清楚：要我，要'+rival.name+'。一人各执一书，才叫校讎——你一个人执两本，我校不动。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 15);
                    break;
                case 'deny':
                    aff = dao ? -16 : -10;
                    msg = '他不恼，只从案下取出一摞校记，一页一页摊平——你来去的日子、你在外头说过的话，条条有出处，字字对得上。「校讎，以书校车，以证校言。」他终于抬眼，灯落在眼底，冷得像校到伪页时那样，「'+rival.name+'的事，江湖的传言早到我案上核过三遍了——你当万卷楼没有眼睛？」他把那页戳破的纸收进校记里，收得端端正正，「走吧。说谎的人，笔画最乱。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 20);
                    break;
                case 'defend':
                    aff = dao ? -12 : -6;
                    msg = '「没辜负。」他把这三个字校了一遍，校得很慢，像校一条对不上的异文：「主语阙。宾语阙。出处——」他停住，看你，「出处存疑。」他把那页戳破的纸拿起来，对着灯，页角的洞影落在你们两个人中间，「你与'+rival.name+(dao?'结了道侣':'动了情')+'，再站到我案前说没辜负——这句话，天下最好的校勘，也替你校不通。」他把纸放回案上，抚平，抚了三遍，「存疑，不改。这四个字，今夜头一回，写不下去。」';
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 隗九爻：大隐阁，半句仙×干饭人，连起三卦全大凶，把签头那颗风干山楂吃了（v20.78 入册） ----
    'dy_event_rival': {
        id: 'dy_event_rival', npcId: 'sect_leader_大隐阁', title: '三卦全凶', icon: '🥀',
        desc: '他连起三卦——全是大凶。末了，连签头那颗山楂都吃了。',
        minAffection: 45, trigger: { random: 1.0 }, cooldown: 0, flag: 'dy_e_rival_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '黄昏，食摊街口。隗九爻坐在红布幌子底下，没数新签——手里是那根磨得发亮的老竹签，签头那颗干缩发暗的山楂还在。案上横着三根新糖葫芦签，他一根一根数过去，数完，满街都听见了：每一根，都只剩末颗一颗。摊主们的手全停了，炭盆都静了。', type: 'description' },
            { speaker: 'npc', text: '「剩一颗。」他举起头一根签子，啧了一声，「大凶。」搁下，拿起第二根，一颗一颗数，「剩一颗。大凶。」第三根，他数得格外慢，「剩一颗——大凶，大凶。」他把签子搁下，抬头看你，破天荒把话说得句句全乎，一个扣都没留：「三卦起完，全凶。这句是全乎话——你猜无可猜了。」' },
            { speaker: 'npc', text: '然后他做了一件满街人从没见他做过的事——把老签头上那颗风干的山楂拔下来，扔进嘴里，嚼得嘎嘣响。「签头，吃了。」他一边嚼一边说，「这颗留给猜得中下半句的人，留了二十年。不留了，卦就不用看了。卦不用看——人总还要一句话。」他把光签子转了半圈，签头空着，指着你：「你给我句话。不给，我就替你猜了——我猜的，你可得认。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「是。我不瞒你。」', effect: 'admit', affection: -5 },
                { text: '「你听谁胡说的。」', effect: 'deny', affection: -10 },
                { text: '「……我没辜负你。」', effect: 'defend', affection: -6 }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            if (!rival) return { affection: 0, msg: '（无人可对峙——你已无他情。）' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'admit':
                    aff = dao ? -10 : -5;
                    msg = dao
                        ? '他把嘴里那颗山楂嚼完，咽下去，半天没说话——这条街上他最静的一回。「道侣。'+rival.name+'。」五个字，他说得全乎。他把那根光了头的老签收回袖子，收得很深，「我的卦辞就两个字：莫尽。守了二十年，没尽过。今夜一口气，全尽了。」他起身，掸掸青衫，朝满街的灯笼拱了拱手，「大凶三卦——卦没骗我。骗我的是签头那颗山楂：我当留着它，就还有得等。」他收了幌子，黑暗里只剩半句，这回是真的只有半句：「你走……」'
                        : '「哦。」他挑了挑眉，从签堆里抽出第四根签子数了数，数完啧了一声：「剩两颗。双数，吉——吉在你老实。」他把那颗山楂咬下来嚼了，「老实这一味，入卦。」他嚼完，用签子指指你，「回去想清楚：要我，要'+rival.name+'。一张案子坐不下两个卦师——两个卦师，那叫斗卦，不叫卦。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 15);
                    break;
                case 'deny':
                    aff = dao ? -16 : -10;
                    msg = '他笑出了声，笑得像街口叫卖，笑完把签子往案上一搁。「'+rival.name+'的事，这条街的摊主替你打听了半个月——糖葫芦婶子连那人惯用哪只手付钱都知道，你当我那本欠账簿是摆设？」他拈起一颗新山楂，在指间转了转，「我的卦是假的，账是真的。你这句话，账上都挂不住。」他把山楂放回签子上——放回去，没吃，「走吧。说谎的人，签头都不替他留。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 20);
                    break;
                case 'defend':
                    aff = dao ? -12 : -6;
                    msg = '「没辜负。」他把这三个字嚼了嚼，像嚼一颗发酸的果子，嚼完咂咂嘴：「酸。」他把那根光了头的签子举起来，对着最后一点天光看，「你与'+rival.name+(dao?'结了道侣':'动了情')+'，再坐到我街口来说没辜负——这一卦，我起了三遍，遍遍大凶。你当山楂骗你？」他把老签收回袖子，收的动作比平日慢，「莫尽的卦辞，今夜我想尽一句：大凶不在卦上。在签头——那颗山楂的位置，空了。」';
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 简知忆：侠隐阁，建档狂魔、批注腔，给那人新立一档「危险程度：高」，附页写三页又全销毁（v20.78 入册） ----
    'yin_event_rival': {
        id: 'yin_event_rival', npcId: 'sect_leader_侠隐阁', title: '危险程度：高', icon: '🥀',
        desc: '他给那人立了新档——附页写了三页，又全销毁了。',
        minAffection: 45, trigger: { random: 1.0 }, cooldown: 0, flag: 'yin_e_rival_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '深夜，侠隐阁东院档房。简知忆在案后立档——立的是新档，昨日还没有的那一份，纸色还白。你走近，看见页首四个字，笔画比满架的条目都重：「危险程度：高。」名字栏里，是你身边那个人的名字。案角一堆撕碎的纸屑，撕得很细，一片屑上还剩着半行墨：「附页，第三……」', type: 'description' },
            { speaker: 'npc', text: '「你来了。」他没抬头，先把那页档抚平，才开口，像往纸上落条：「此档昨日新立。条目如下：其人行止，其人兵器，其人与你同路的次数，与你说话时你笑的次数。归档。」他这才抬眼，档笔还捏在手里，「附页写了三页。全销毁了。附页上写的什么——存疑，不究。」' },
            { speaker: 'npc', text: '他把档页推过来，「危险程度」那一栏，「高」字的墨迹还没干透：「档房给天下人定危险程度，定了半架，没定错过。唯独这一档——定了三遍，三遍的答案不一样。」他把档笔搁上笔架，指腹的墨痕还新，「头一遍：高。第二遍：不高。第三遍——」他停了停，「答案放不下那一栏。归档入架之前，按规矩，问一声当档的人。你给我句话。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「是。我不瞒你。」', effect: 'admit', affection: -5 },
                { text: '「你听谁胡说的。」', effect: 'deny', affection: -10 },
                { text: '「……我没辜负你。」', effect: 'defend', affection: -6 }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            if (!rival) return { affection: 0, msg: '（无人可对峙——你已无他情。）' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'admit':
                    aff = dao ? -10 : -5;
                    msg = dao
                        ? '他提起档笔，在「危险程度」那个「高」字旁边悬了很久，终究没改，只在边上落了一条新批注，落得极小：「修正：非高。是躲不开。」写完他把档合上，自己送上了架，上架的动作和平日一样端正，只有放稳之后，多按了一下。「道侣。'+rival.name+'。此档，结案。批注：无归档价值。」他背过身去理笔架，声音压得平平的，「附页写了三页，销毁三页。第四页写的是什么——存疑，不究。不究，可是写了。」'
                        : '「老实。」他把这两个字核了一遍，点头，提笔在档上批了一条：「此人自认。注：十成条目。」写完他把档合上，没上架，压在案角，「回去想清楚：要我，要'+rival.name+'。一页档纸挤两个名字——归得了档，念的人念不出口。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 15);
                    break;
                case 'deny':
                    aff = dao ? -16 : -10;
                    msg = '他不争，只起身从架子第二排抽出一册底档，一页一页摊在灯下——你来去的日子、你在讲武堂说过的话，条条有出处。「侠隐阁替天下侠客立档。你的每一步，档比你先记完。」他终于抬眼，眼神直得没有一处可躲，「'+rival.name+'的事，底档比流言先到我案上——你当我这支笔，只会写自己的名字？」他把底档合上，归架，归得端端正正，「走吧。说谎的人，条目最乱。乱的条目——存疑，要究。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 20);
                    break;
                case 'defend':
                    aff = dao ? -12 : -6;
                    msg = '「没辜负。」他把这三个字批注了一遍，批得很慢，像核一条不该存在的条目。「你与'+rival.name+(dao?'结了道侣':'动了情')+'，再站到我档房案前说没辜负——」他提起档笔，悬在批注栏上方，笔尖抖了一下，「这条批注，我落不下去。落『危险程度』，危险的是你；落『无归档价值』，是我骗自己。」他把笔搁下，把那页档合上，压在怀里没上架，「存疑，不究——这四个字我写了一辈子。今夜头一回，底下压的是我自己的条目。」';
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 狄长亭：天涯海阁，娇柔而能干、公文腔藏挽留，替你写路引把里程多算三站（v20.78 入册） ----
    'ty_event_rival': {
        id: 'ty_event_rival', npcId: 'sect_leader_天涯海阁', title: '多算三站', icon: '🥀',
        desc: '他替你写路引，里程多算了三站——那三站，是他舍不得的三天。',
        minAffection: 45, trigger: { random: 1.0 }, cooldown: 0, flag: 'ty_e_rival_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '傍晚，江陵总驿文书案。狄长亭在写路引，墨笔一笔一笔极稳——可今夜的笔顺不对：去向栏先写，里程栏后写，写完里程栏，笔停住了，停了很久。你凑近看：你该走的路，四百里，七站。他手里那纸引——五百八十里，十站。多出来的三站站名，墨色比正文淡，笔画微微发颤，和那回写「建议滞留数日」时一模一样。', type: 'description' },
            { speaker: 'npc', text: '「劳驾。」他双手把路引呈上来，声音又轻又软，礼数一丝不乱：「沿驿路南行，原本四百里，七站。今夜这一纸——五百八十里，十站。」他顿了顿，公文腔，像在解释路况：「多出来的三站，路程不利。不利——建议滞留。」' },
            { speaker: 'npc', text: '「驿制卷一：路引里程，不得多写一里。」他自己把条令背了出来，背得很轻，像念别人的文书，然后把那纸路引折角对齐，重新呈上——话像道别，这回道的是他自己：「前路不利。早寻宿处。」他垂下眼，垂眼的样子像一纸等批的公文：「那三站不在路上。路上没有——在我案上。你给我句话。不给，这一纸，我自己登进存根：误发，作废。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「是。我不瞒你。」', effect: 'admit', affection: -5 },
                { text: '「你听谁胡说的。」', effect: 'deny', affection: -10 },
                { text: '「……我没辜负你。」', effect: 'defend', affection: -6 }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            if (!rival) return { affection: 0, msg: '（无人可对峙——你已无他情。）' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'admit':
                    aff = dao ? -10 : -5;
                    msg = dao
                        ? '他接了这句话，站在原地半晌，然后把路引收回去，展开，笔悬在里程栏上方，悬了很久很久。「道侣。'+rival.name+'。」四个字他用公文腔念出来，念得字字工整，念完声音才低下去半格：「驿制卷二：去向既定，引即生效。」他把那纸路引沿着里程栏齐齐撕成两半，撕得很轻，很周全，两半都登进了存根册，「三站，多写了。是我的误。你的路——不经过我的三站。」他合上存根，合得端端正正，黑暗里只剩一句又轻又软的道别：「前路有利。愿君，好走。」'
                        : '「是。」他替你答了一个字，答得极快，像怕自己听见第二个字。他把路引收回去，抚平，提笔在批注栏添了一条小注，这一回笔没有颤：「是日，其人自承。承——则里程改实。」写完他重新把路引呈到你手边，耳根红着，话仍旧端正，「回去想清楚：要我，要'+rival.name+'。一纸路引，一个去向栏——栏里放不下两个方向。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 15);
                    break;
                case 'deny':
                    aff = dao ? -16 : -10;
                    msg = '他不恼，只把案上的存根册翻开，一页一页转过去——你来去的日子、你宿过哪一站、你在哪个碑界折回过一次，页页有批注。「风讯楼的风讯，比雨先到。回程行客的鞋泥，比人先到。」他终于抬眼，眉眼里的软变成认路的清，「'+rival.name+'的事，一条一条都比你先送到我案上——你当我这双驿路上的耳朵，只听蹄声？」他合上存根，把那纸多算三站的路引推给你，「拿着走。说谎的人，路引最容易验伪。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 20);
                    break;
                case 'defend':
                    aff = dao ? -12 : -6;
                    msg = '「没辜负。」他把这三个字核了一遍，像核一段走不通的路，核完摇头，摇得很慢：「你与'+rival.name+(dao?'结了道侣':'动了情')+'，再站到我文书案前说没辜负——」他把路引上那三个发颤的站名抚平，抚得像抚一道折痕，「这三个字，就像这纸引：里程看着是对的，翻过来，背面全是舍不得的批注。」他把路引卷起，系上绳，没有递给你，收进了案头最里的一格：「驿制：去向不明之引，不发。你这句话——去向不明，滞留。」';
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 樊惊筹：大旗门，猛将针线活、军中短句，话更短针脚更密，护腕加一排拆不出的加固针（v20.78 入册） ----
    'dq_event_rival': {
        id: 'dq_event_rival', npcId: 'sect_leader_大旗门', title: '加固针', icon: '🥀',
        desc: '他的话更短，针脚更密——你的护腕上多了一排拆不出来的加固针。',
        minAffection: 45, trigger: { random: 1.0 }, cooldown: 0, flag: 'dq_e_rival_done',
        requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '深夜，旗房。樊惊筹缝着的那面纛旗叠到一半搁着，膝上摊的是你的护腕——你一直戴着的那副，昨儿被他说「加固」拿了来的。灯芯挑得很矮。他的话比平日更短，针脚比平日更密：内衬上新添一排针，针压着针，线走在夹层里，摸得出一道一道的棱，却挑不出一个能下手的线头。', type: 'description' },
            { speaker: 'npc', text: '「坐。」他没抬头，走完一针，收了线，才开口：「手。」你把手腕递过去，他把护腕给你戴上，按实，收带，一套动作像下军令。「拆不出。」他说。顿了顿，又补三个字：「加固针。」' },
            { speaker: 'npc', text: '他这才抬头。灯落在点将台上号令三百人的那张脸上，话比那天还短：「外头的事。听到了。」他看你，眼神很直，「缝了一排。一针，一个字。多少个字——不说。」他把针插回铁皮针线盒，盒盖扣上，扣得很严：「你给我句话。不给——就再加一排。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「是。我不瞒你。」', effect: 'admit', affection: -5 },
                { text: '「你听谁胡说的。」', effect: 'deny', affection: -10 },
                { text: '「……我没辜负你。」', effect: 'defend', affection: -6 }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            if (!rival) return { affection: 0, msg: '（无人可对峙——你已无他情。）' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'admit':
                    aff = dao ? -10 : -5;
                    msg = dao
                        ? '他看了你两息，然后把你腕上那副护腕解了下来——动作不重，你却没能拦住。「道侣。'+rival.name+'。」四个字，说完全句，没有下文。他坐到灯底下，捏起针，把那排加固针一道一道拆开。拆线比缝线快。拆完，他把线一根一根捋齐，收进铁皮盒，把护腕推回你手里，内衬空空，一道棱也没有了。「拆了。」他说，报军情的调子，「针码的规矩：加固针，护的是没定的人。定了——」他扣上盒盖，扣得很严，「不用加固。」'
                        : '「嗯。」他应了一个字，应得很实，把护腕收回去，重新给你戴上，收带，「老实。兵的德。」他低头去穿针，穿了半天——那根线头其实早就在针眼里，「回去想清楚：要我，要'+rival.name+'。一排针，缝得住一层布。两层布缝在一处——针脚要花。」';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 15);
                    break;
                case 'deny':
                    aff = dao ? -16 : -10;
                    msg = '他把针搁下了。没恼，只伸手把你的护腕内衬翻过来，朝着灯，指给你看那排新针：「数。」你数不清。他收回手，声音平的：「'+rival.name+'的事，北商道的镖队传了个遍——大旗门的耳朵，不光听鼓。」他把针收回盒里，「这一排，我缝了三夜。你一句话，连拆都不拆。」他吹了灯，黑暗里两个字，短，平：「走。别掉队。」——这一回，「别掉队」三个字说得比哪天都冷。';
                    if (npc.relationship) npc.relationship.trust = Math.max(-100, (npc.relationship.trust || 0) - 20);
                    break;
                case 'defend':
                    aff = dao ? -12 : -6;
                    msg = '「没辜负。」他把这三个字嚼了嚼——他不嚼话，他只是把这三个字在嘴里放了一会儿。「你与'+rival.name+(dao?'结了道侣':'动了情')+'，还戴着我缝的护腕，说没辜负——」他伸手把你腕上的带子正了正，正得很实，「护腕护腕，护的是腕。针脚护的是人。人护不住——」他收回手，收得很稳，「护腕就只是布。」他背过身去，重新拿起那面纛旗接着缝，针脚还是密，话更短：「别拆。布，也戴着。缝完这一排——再说。」';
                    break;
            }
            return { affection: aff, msg: msg };
        }
    }
};

// ============ 合并进总事件池 ============
if (typeof NPC_PERSONAL_EVENTS !== 'undefined') {
    Object.assign(NPC_PERSONAL_EVENTS, MALE_RIVALRY_EVENTS);
}

// ============ 每日钩子：玩家在某男主门派 + 好感≥45 + 有情敌 + 未对峙 → 触发男主吃醋 ============
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
                var eventId = h.id.replace('sect_leader_','') + '_event_rival';
                // 映射 event id
                var rivalId = h.id === 'sect_leader_铸剑山庄' ? 'lu_event_rival'
                    : h.id === 'sect_leader_药王谷' ? 'su_event_rival'
                    : h.id === 'sect_leader_茅山派' ? 'ms_event_rival'
                    : h.id === 'sect_leader_金刚宗' ? 'jg_event_rival'
                    : h.id === 'sect_leader_华山派' ? 'hs_event_rival'
                    : h.id === 'sect_leader_武当派' ? 'wd_event_rival'
                    : h.id === 'sect_leader_逍遥派' ? 'xy_event_rival'
                    : h.id === 'sect_leader_嵩山派' ? 'song_event_rival'
                    : h.id === 'sect_leader_丐帮' ? 'gai_event_rival'
                    : h.id === 'sect_leader_阎罗殿' ? 'yan_event_rival'
                    : h.id === 'sect_leader_霹雳堂' ? 'pi_event_rival'
                    : h.id === 'sect_leader_天书阁' ? 'shu_event_rival'
                    : h.id === 'sect_leader_大隐阁' ? 'dy_event_rival'
                    : h.id === 'sect_leader_侠隐阁' ? 'yin_event_rival'
                    : h.id === 'sect_leader_天涯海阁' ? 'ty_event_rival'
                    : h.id === 'sect_leader_大旗门' ? 'dq_event_rival' : null;
                if (!rivalId) continue;
                var npc = window.npcManager.getNPC ? window.npcManager.getNPC(h.id) : null;
                if (!npc) continue;
                var aff = (npc.relationship && npc.relationship.affection) || 0;
                if (aff < 45) continue;
                if (typeof hasEventTriggered === 'function' && hasEventTriggered(rivalId)) continue;
                if (typeof window.detectRivalRomance !== 'function') continue;
                if (!window.detectRivalRomance(h.id)) continue;
                var ev = NPC_PERSONAL_EVENTS[rivalId];
                if (!ev) continue;
                if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npc)) continue;
                setTimeout(function(evId, npcInst) {
                    if (document.querySelector && document.querySelector('.personal-event-modal')) return;
                    var ev2 = NPC_PERSONAL_EVENTS[evId];
                    if (!ev2) return;
                    if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev2, npcInst)) return;
                    if (typeof triggerPersonalEvent === 'function') triggerPersonalEvent(evId);
                }.bind(null, rivalId, npc), 1200);
            }
        } catch (e) { console.warn('[男主吃醋] 每日触发失败:', e); }
    });
}

if (typeof window !== 'undefined') {
    window.MALE_RIVALRY_EVENTS = MALE_RIVALRY_EVENTS;
}
console.log('[男主吃醋] 男主吃醋事件加载完成：' + Object.keys(MALE_RIVALRY_EVENTS).length + ' 个对峙事件 + 情敌探测扩展');
