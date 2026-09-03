// ==================== male-lead-bridge.js - 男主论交（情敌和解）事件 v1.0 ====================
// 依赖：npcs/npc-personal-events.js、npcs/male-lead-rivalry.js（detectRivalRomance 已扩展含男主）
//       npc-system.js（setNPCRelationshipPair/adjustNPCRelationshipPair）
// 加载顺序：在 male-lead-rivalry.js 之后
// 复用既有 npcRelationships 配对图 + adjustNPCRelationshipPair 分段逻辑（enemy→neutral→friend→至交）。
// 每位男主独立声口 6 档文案，非通用模板。

var ML_BRIDGE_CD = 14;
var ML_BRIDGE_INTIMATE = 80;

// 档位判定（同女主角版）
function _mlResolveBridgeTier(bRel, bStr, aRel, aStr, choice) {
    if (aRel === 'friend' && aStr >= ML_BRIDGE_INTIMATE) return 'intimate';
    if (aRel === 'friend' && bRel !== 'friend') return 'friend_form';
    if (aRel === 'friend' && bRel === 'friend') return 'friend_deepen';
    if (bRel === 'enemy' && (aRel === 'neutral' || aStr < bStr)) return 'enemy_ease';
    if (bRel === 'neutral' || (bRel === 'enemy' && aRel === 'neutral')) return 'neutral_warm';
    return 'neutral_warm';
}

function _mlPlayerTa() { return (window.currentCharData && window.currentCharData.gender === 'female') ? '她' : '他'; }

// 4 位男主 × 6 档 独立文案
var ML_BRIDGE_TIER_MSGS = {
    'sect_leader_铸剑山庄': { // 冶砚：炉火/铸剑声口
        enemy_ease: function(r){ return '冶砚收了火气，给'+r+'递了把钳子——头一回，他把情敌当炉友不当敌。再论交几回，或可放下。'; },
        neutral_warm: function(r){ return '冶砚送'+r+'出炉房，破天荒说了句「慢走」。他回身把锤子在掌心转了一圈，搁下。再撮合几回，或可成友。'; },
        friend_form: function(r){ return '冶砚把一柄刚开刃的剑递给'+r+'看：「这柄，我替你调的配重。」'+r+'接了——两个铸剑的，在一柄剑上停了战。你这一局，撮合成了。'; },
        friend_deepen: function(r){ return '他俩交换关于'+_mlPlayerTa()+'的糗事，冶砚笑得虎牙全露：「'+_mlPlayerTa()+'怕烫？」'+r+'答：「'+_mlPlayerTa()+'连炉灰都敢碰。」两人笑成一团。再论交几回，或可结金兰。'; },
        intimate: function(r){ return '冶砚把自己那柄三年铸成的剑横在两人之间，让'+r+'握住剑鞘——两双手叠在剑上。「这柄剑，等了三年。」他哑声，「今天，它认了第二个人。」'+_mlPlayerTa()+'来时，他俩再不争先后，只论炉友。'; }
    },
    'sect_leader_药王谷': { // 芩木：医毒/茶声口
        enemy_ease: function(r){ return '芩木收了温润的凉意，给'+r+'倒了杯热茶——头一回，他把情敌当客人不当敌。再论交几回，或可放下。'; },
        neutral_warm: function(r){ return '芩木送'+r+'出药庐，破天荒说了句「慢走」。他回身把那只凉茶杯烫了遍。再撮合几回，或可成友。'; },
        friend_form: function(r){ return '芩木把那张改到十八遍的方子递给'+r+'看：「这味，你师父的方子差在哪。」'+r+'看了一眼：「差在剂量。」芩木竟笑了——两个医毒的，在一张方子上停了战。'; },
        friend_deepen: function(r){ return '他俩交换关于'+_mlPlayerTa()+'的糗事，芩木笑得眼底终于到底：「'+_mlPlayerTa()+'怕苦？」'+r+'答：「'+_mlPlayerTa()+'连断肠草都敢尝。」两人笑。再论交几回，或可结金兰。'; },
        intimate: function(r){ return '芩木把一丸解百毒的药推到'+r+'面前：「从前我替自己留的。今天，替你留。」'+r+'懂了，把自己的一味独门毒草也放进药篓。两人在一壶药茶里结了金兰——'+_mlPlayerTa()+'来时，他俩再不争先后，只论药友。'; }
    },
    'sect_leader_茅山派': { // 昴既明：符箓/阴阳声口
        enemy_ease: function(r){ return '昴既明收了银光，给'+r+'让了半步进符阁——头一回，他把情敌当客不当敌。再论交几回，或可放下。'; },
        neutral_warm: function(r){ return '昴既明送'+r+'出符阁，破天荒说了句「慢走」。他回身把未画完的符收好。再撮合几回，或可成友。'; },
        friend_form: function(r){ return '昴既明把一道渡魂符递给'+r+'看：「这道，我替师兄画的。」'+r+'没说话，把自己的护身符也挂上阁墙——两道符并挂。你这一局，撮合成了。'; },
        friend_deepen: function(r){ return '他俩交换关于'+_mlPlayerTa()+'的糗事，昴既明清冷里裂一线暖：「'+_mlPlayerTa()+'怕鬼？」'+r+'答：「'+_mlPlayerTa()+'连阴阳眼都敢看。」两人在符阁笑。再论交几回，或可结金兰。'; },
        intimate: function(r){ return '昴既明把那道护身符横在两人之间，让'+r+'握住符角——两双手叠在符上。「这道符，我画了三年。」他哑声，「今天，它认了第二个人。」'+_mlPlayerTa()+'来时，他俩再不争先后，只论符友。'; }
    },
    'sect_leader_金刚宗': { // 赫渊：金刚线/塔声口
        enemy_ease: function(r){ return '赫渊松了右臂金刚线一圈，给'+r+'让了塔门半步——头一回，他把情敌当客不当敌。再论交几回，或可放下。'; },
        neutral_warm: function(r){ return '赫渊送'+r+'出塔，破天荒开了口「慢走」。他回身把金刚线又松了一圈。再撮合几回，或可成友。'; },
        friend_form: function(r){ return '赫渊把那块闭口禅木牌翻回正面，递给'+r+'看：「这块，我刻了二十年。」'+r+'没说话，把自己的念珠也放在塔案上。两个守戒的，在一块木牌上停了战。'; },
        friend_deepen: function(r){ return '他俩交换关于'+_mlPlayerTa()+'的糗事，赫渊沉静里罕见地有了暖：「'+_mlPlayerTa()+'怕苦行？」'+r+'答：「'+_mlPlayerTa()+'连金刚线都敢解。」两人在塔里笑。再论交几回，或可结金兰。'; },
        intimate: function(r){ return '赫渊把那圈金刚线解下，横在两人之间，让'+r+'握住线头——两双手叠在线上。「这圈线，我缠了二十年。」他哑声，「今天，它认了第二个人。」'+_mlPlayerTa()+'来时，他俩再不争先后，只论塔友。'; }
    }
};

function _mlApplyBridgeEffects(npc, choice) {
    var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
    if (!rival) return { affection: 0, msg: '（无人可论交——你已无他情。）' };
    var rivalNpc = window.npcManager && window.npcManager.getNPC ? window.npcManager.getNPC(rival.id) : null;
    if (!rivalNpc) return { affection: 0, msg: '（情敌不在。）' };

    // 确保配对初始化（复用既有 setNPCRelationshipPair）
    var before = (window.getNPCRelationship && window.getNPCRelationship(npc.id, rival.id))
        ? { relation: window.getNPCRelationship(npc.id, rival.id), strength: (npc.npcRelationships && npc.npcRelationships[rival.id] && npc.npcRelationships[rival.id].strength) || 0 }
        : { relation: 'neutral', strength: 0 };
    // 若无配对，初始化为 enemy/60
    if (!npc.npcRelationships || !npc.npcRelationships[rival.id]) {
        if (typeof window.setNPCRelationshipPair === 'function') window.setNPCRelationshipPair(npc, rivalNpc, 'enemy', 60);
    }
    var bRel = (npc.npcRelationships && npc.npcRelationships[rival.id] && npc.npcRelationships[rival.id].relation) || 'neutral';
    var bStr = (npc.npcRelationships && npc.npcRelationships[rival.id] && npc.npcRelationships[rival.id].strength) || 0;

    var delta = (choice === 'mediate') ? 26 : (choice === 'convey') ? 18 : 10;
    var result = null;
    if (typeof window.adjustNPCRelationshipPair === 'function') {
        result = window.adjustNPCRelationshipPair(npc, rivalNpc, delta, { defaultRelation: 'enemy' });
    }
    var after = result || { relation: bRel, strength: bStr };
    var aRel = after.relation || 'neutral';
    var aStr = Number(after.strength) || 0;

    var aff = (choice === 'mediate') ? 3 : (choice === 'convey' ? 2 : 1);
    var tier = _mlResolveBridgeTier(bRel, bStr, aRel, aStr, choice);
    var table = ML_BRIDGE_TIER_MSGS[npc.id] || ML_BRIDGE_TIER_MSGS['sect_leader_铸剑山庄'];
    var fn = table[tier] || table.neutral_warm;
    return { affection: aff, msg: fn(rival.name) };
}

var MALE_BRIDGE_EVENTS = {
    'lu_event_bridge': {
        id: 'lu_event_bridge', npcId: 'sect_leader_铸剑山庄', title: '炉房论交', icon: '🤝',
        desc: '你邀的那位，到了铸剑山庄。',
        minAffection: 50, trigger: { random: 1.0 }, cooldown: ML_BRIDGE_CD, flag: 'lu_e_bridge_cd',
        requireEventDone: 'lu_event_rival', requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你递了信。三日后，那位情敌到了铸剑山庄炉房。', type: 'description' },
            { speaker: 'npc', text: '冶砚把锤一搁，琥珀眼底看着你，又看那人。「……你让我跟他论交？」他虎牙没露，「行。炉前的位，给他一个。」' },
            { speaker: 'player_select', text: '你如何撮合？', options: [
                { text: '「你们都为我好。各说一句真话。」', effect: 'mediate', affection: 3 },
                { text: '替他们互相传一句对方的好', effect: 'convey', affection: 2 },
                { text: '「我先回避，你们自己谈。」', effect: 'leave', affection: 1 }
            ]}
        ],
        effects: function(npc, choice) { return _mlApplyBridgeEffects(npc, choice); }
    },
    'su_event_bridge': {
        id: 'su_event_bridge', npcId: 'sect_leader_药王谷', title: '药庐论交', icon: '🤝',
        desc: '你邀的那位，到了药王谷。',
        minAffection: 50, trigger: { random: 1.0 }, cooldown: ML_BRIDGE_CD, flag: 'su_e_bridge_cd',
        requireEventDone: 'su_event_rival', requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你递了信。三日后，那位情敌到了药王谷药庐。', type: 'description' },
            { speaker: 'npc', text: '芩木推过两只热茶，温润地笑：「……你让我跟他论交？」他看你，「行。药庐的门，给他开一扇。」' },
            { speaker: 'player_select', text: '你如何撮合？', options: [
                { text: '「你们都为我好。各说一句真话。」', effect: 'mediate', affection: 3 },
                { text: '替他们互相传一句对方的好', effect: 'convey', affection: 2 },
                { text: '「我先回避，你们自己谈。」', effect: 'leave', affection: 1 }
            ]}
        ],
        effects: function(npc, choice) { return _mlApplyBridgeEffects(npc, choice); }
    },
    'ms_event_bridge': {
        id: 'ms_event_bridge', npcId: 'sect_leader_茅山派', title: '符阁论交', icon: '🤝',
        desc: '你邀的那位，到了茅山派。',
        minAffection: 50, trigger: { random: 1.0 }, cooldown: ML_BRIDGE_CD, flag: 'ms_e_bridge_cd',
        requireEventDone: 'ms_event_rival', requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你递了信。三日后，那位情敌到了茅山派符阁。', type: 'description' },
            { speaker: 'npc', text: '昴既明执笔不动，银光看那人一眼：「……你让我跟他论交？」他收笔，「行。符阁的位，给他留一个。」' },
            { speaker: 'player_select', text: '你如何撮合？', options: [
                { text: '「你们都为我好。各说一句真话。」', effect: 'mediate', affection: 3 },
                { text: '替他们互相传一句对方的好', effect: 'convey', affection: 2 },
                { text: '「我先回避，你们自己谈。」', effect: 'leave', affection: 1 }
            ]}
        ],
        effects: function(npc, choice) { return _mlApplyBridgeEffects(npc, choice); }
    },
    'jg_event_bridge': {
        id: 'jg_event_bridge', npcId: 'sect_leader_金刚宗', title: '塔内论交', icon: '🤝',
        desc: '你邀的那位，到了金刚宗。',
        minAffection: 50, trigger: { random: 1.0 }, cooldown: ML_BRIDGE_CD, flag: 'jg_e_bridge_cd',
        requireEventDone: 'jg_event_rival', requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你递了信。三日后，那位情敌到了金刚宗塔内。', type: 'description' },
            { speaker: 'npc', text: '赫渊盘坐塔内，金刚线松了一线。他看那人一眼，没开口——为你破了闭口禅：「……行。塔门，给他开一扇。」' },
            { speaker: 'player_select', text: '你如何撮合？', options: [
                { text: '「你们都为我好。各说一句真话。」', effect: 'mediate', affection: 3 },
                { text: '替他们互相传一句对方的好', effect: 'convey', affection: 2 },
                { text: '「我先回避，你们自己谈。」', effect: 'leave', affection: 1 }
            ]}
        ],
        effects: function(npc, choice) { return _mlApplyBridgeEffects(npc, choice); }
    }
};

if (typeof NPC_PERSONAL_EVENTS !== 'undefined') {
    Object.assign(NPC_PERSONAL_EVENTS, MALE_BRIDGE_EVENTS);
}

// 每日钩子：玩家在某男主门派 + 吃醋已发生 + 有情敌 + 配对未至至交 + cd → 触发论交
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
                var rivalEvId = h.id === 'sect_leader_铸剑山庄' ? 'lu_event_rival'
                    : h.id === 'sect_leader_药王谷' ? 'su_event_rival'
                    : h.id === 'sect_leader_茅山派' ? 'ms_event_rival'
                    : h.id === 'sect_leader_金刚宗' ? 'jg_event_rival' : null;
                var bridgeId = h.id === 'sect_leader_铸剑山庄' ? 'lu_event_bridge'
                    : h.id === 'sect_leader_药王谷' ? 'su_event_bridge'
                    : h.id === 'sect_leader_茅山派' ? 'ms_event_bridge'
                    : h.id === 'sect_leader_金刚宗' ? 'jg_event_bridge' : null;
                if (!rivalEvId || !bridgeId) continue;
                if (typeof hasEventTriggered === 'function' && !hasEventTriggered(rivalEvId)) continue; // 吃醋须已发生
                var npc = window.npcManager.getNPC ? window.npcManager.getNPC(h.id) : null;
                if (!npc) continue;
                var aff = (npc.relationship && npc.relationship.affection) || 0;
                if (aff < 50) continue;
                if (typeof window.detectRivalRomance !== 'function' || !window.detectRivalRomance(h.id)) continue;
                // 配对未至至交
                var pair = (npc.npcRelationships) ? npc.npcRelationships : null;
                if (pair) {
                    var rivalObj = null;
                    var det = window.detectRivalRomance(h.id);
                    if (det) rivalObj = pair[det.id];
                    if (rivalObj && rivalObj.relation === 'friend' && (Number(rivalObj.strength) || 0) >= ML_BRIDGE_INTIMATE) continue;
                }
                var ev = NPC_PERSONAL_EVENTS[bridgeId];
                if (!ev) continue;
                if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npc)) continue;
                if (typeof checkEventTrigger === 'function' && !checkEventTrigger(ev, window.currentCharData)) continue;
                setTimeout(function(evId, npcInst) {
                    if (document.querySelector && document.querySelector('.personal-event-modal')) return;
                    var ev2 = NPC_PERSONAL_EVENTS[evId];
                    if (!ev2) return;
                    if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev2, npcInst)) return;
                    if (typeof triggerPersonalEvent === 'function') triggerPersonalEvent(evId);
                }.bind(null, bridgeId, npc), 1200);
            }
        } catch (e) { console.warn('[男主论交] 每日触发失败:', e); }
    });
}

if (typeof window !== 'undefined') {
    window.MALE_BRIDGE_EVENTS = MALE_BRIDGE_EVENTS;
    window.ML_BRIDGE_TIER_MSGS = ML_BRIDGE_TIER_MSGS;
}
console.log('[男主论交] 男主情敌论交事件加载完成：' + Object.keys(MALE_BRIDGE_EVENTS).length + ' 个');
