// ==================== male-lead-rivalry.js - 男主吃醋事件 + 扩展情敌探测 v1.0 ====================
// 依赖：npcs/npc-personal-events.js、npcs/heroine-rivalry.js（detectRivalRomance/HEROINE_ROSTER）
// 加载顺序：在 heroine-rivalry.js + 四位男主事件文件之后
//
// 功能：
//   1. 扩展 detectRivalRomance：除女主角外，也探测男主情敌（男主↔男主、男主↔女主 互测）。
//   2. 4 位男主各 1 个吃醋对峙事件（requireRivalRomance），复用既有门禁与每日钩子机制。

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

// ============ 4 位男主吃醋对峙事件 ============
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
                    : h.id === 'sect_leader_金刚宗' ? 'jg_event_rival' : null;
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
