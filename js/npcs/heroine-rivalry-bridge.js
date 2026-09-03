// ==================== heroine-rivalry-bridge.js - 情敌和解/亲密系统 v1.0 ====================
// 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / triggerPersonalEvent /
//       canPlayerAccessPersonalEvent / hasEventTriggered）
//       npcs/npc-system.js（setNPCRelationshipPair / adjustNPCRelationshipPair / getRelationBetween）
//       npcs/heroine-rivalry.js（HEROINE_ROSTER / detectRivalRomance）
// 加载顺序：在 heroine-rivalry.js 之后
//
// 设计宪法：情敌配对关系演进由真实状态驱动——玩家已同时与两位女主角缔情（故她们是情敌），
//   且至少一位已对玩家质问过（吃醋对峙已发生，彼此知晓存在）。
//   通过玩家"邀约论交"撮合，配对关系沿 enemy → neutral → friend → 至交(金兰) 演进，
//   复用既有 npcRelationships 关系图与 adjustNPCRelationshipPair 的分段逻辑，无人为计数器。
//   约束：须人在该女主角门派、吃醋已发生、有情敌、配对未至"至交"（friend 且强度≥80）、冷却 14 天。

var BRIDGE_COOLDOWN_DAYS = 14;
var BRIDGE_INTIMATE_STRENGTH = 80; // friend 强度达此值视为"至交/金兰"（亲密）

// ============ 配对关系查询/初始化 ============
function getHeroinePairRelation(aId, bId) {
    var a = window.npcManager && window.npcManager.getNPC ? window.npcManager.getNPC(aId) : null;
    if (a && a.npcRelationships && a.npcRelationships[bId]) {
        return a.npcRelationships[bId];
    }
    // 回退：用公开 API 取关系类型（无强度）
    var relType = null;
    if (typeof window.getNPCRelationship === 'function') {
        relType = window.getNPCRelationship(aId, bId);
    }
    return { relation: relType || 'neutral', strength: 0 };
}

// 首次发现有情敌且吃醋已发生 → 初始化配对为 enemy/60（她们已知彼此、互为情敌）
function initHeroinePairIfNeeded(aId, bId) {
    var cur = getHeroinePairRelation(aId, bId);
    if (cur && cur.relation && cur.relation !== 'neutral') return cur; // 已建立
    if (cur && cur.strength) return cur; // 已有强度
    var a = window.npcManager && window.npcManager.getNPC ? window.npcManager.getNPC(aId) : null;
    var b = window.npcManager && window.npcManager.getNPC ? window.npcManager.getNPC(bId) : null;
    if (!a || !b) return cur;
    if (typeof window.setNPCRelationshipPair === 'function') {
        window.setNPCRelationshipPair(a, b, 'enemy', 60);
    }
    return { relation: 'enemy', strength: 60 };
}

// ============ 四位女主角的"论交"事件（情敌会面） ============
var HEROINE_BRIDGE_EVENTS = {
    // ---- 温蘅：在百花谷接待情敌 ----
    'bh_event_bridge': {
        id: 'bh_event_bridge', npcId: 'sect_leader_百花谷', title: '药庐论交', icon: '🌸',
        desc: '你邀的那位，到了百花谷。',
        minAffection: 50, trigger: { random: 1.0 }, cooldown: BRIDGE_COOLDOWN_DAYS, flag: 'bh_e_bridge_cd',
        requireEventDone: 'bh_event_rival', requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你递了信出去。三日后，那位情敌如约到了百花谷药庐。', type: 'description' },
            { speaker: 'narrator', text: '温蘅在门口迎她，笑眼弯弯如常，琥珀色的眼底却没笑——两个 share 过你的女人，头一次正面相对。', type: 'description' },
            { speaker: 'npc', text: '「请坐。」温蘅推过一只茶杯——热的，「你比我以为的，要镇定。」' },
            { speaker: 'narrator', text: '她没看那人，看着你。', type: 'description' },
            { speaker: 'player_select', text: '你如何撮合？', options: [
                { text: '「你们都为我好。不如各说一句真话。」', effect: 'mediate', affection: 3 },
                { text: '替她们互相传一句对方的好', effect: 'convey', affection: 2 },
                { text: '「我先回避，你们自己谈。」', effect: 'leave', affection: 1 }
            ]}
        ],
        effects: function(npc, choice) { return _applyBridgeEffects(npc, choice, '温蘅'); }
    },
    // ---- 绯泪：在修罗宫接待情敌 ----
    'xl_event_bridge': {
        id: 'xl_event_bridge', npcId: 'sect_leader_修罗宫', title: '大殿论交', icon: '🩸',
        desc: '她竟肯让那人进修罗宫。',
        minAffection: 50, trigger: { random: 1.0 }, cooldown: BRIDGE_COOLDOWN_DAYS, flag: 'xl_e_bridge_cd',
        requireEventDone: 'xl_event_rival', requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你请绯泪给那人一个机会。她沉默了很久，最后让侍女开门——那人进了修罗宫大殿。', type: 'description' },
            { speaker: 'narrator', text: '绯泪坐主位，没起身。两个女人隔着一张长案，寒意从指间渗出来。', type: 'description' },
            { speaker: 'npc', text: '——你能来，我意外。' },
            { speaker: 'narrator', text: '她看着你，意思很明白：你撮合，我听。', type: 'description' },
            { speaker: 'player_select', text: '你如何撮合？', options: [
                { text: '「你们都吃过苦。别在我这儿再吃一次。」', effect: 'mediate', affection: 3 },
                { text: '替她们互相传一句对方的好', effect: 'convey', affection: 2 },
                { text: '「我先回避，你们自己谈。」', effect: 'leave', affection: 1 }
            ]}
        ],
        effects: function(npc, choice) { return _applyBridgeEffects(npc, choice, '绯泪'); }
    },
    // ---- 琤霄凌：在天山派接待情敌 ----
    'ts_event_bridge': {
        id: 'ts_event_bridge', npcId: 'sect_leader_天山派', title: '雪庐论交', icon: '❄️',
        desc: '她破例让那人进了雪庐。',
        minAffection: 50, trigger: { random: 1.0 }, cooldown: BRIDGE_COOLDOWN_DAYS, flag: 'ts_e_bridge_cd',
        requireEventDone: 'ts_event_rival', requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你请琤霄凌见那人一面。她在雪庐门口站了很久，最后推开了门——那人踏进天山雪庐。', type: 'description' },
            { speaker: 'narrator', text: '两柄剑——霜鸣与那人的——隔庐相挂。霄凌没拔剑，但手按在鞘上。', type: 'description' },
            { speaker: 'npc', text: '「坐。」她声音像雪后的风，「你既然来了，便不是来抢剑的。」' },
            { speaker: 'narrator', text: '她看向你。', type: 'description' },
            { speaker: 'player_select', text: '你如何撮合？', options: [
                { text: '「她守剑十二年，你也有你的执。别互相难为。」', effect: 'mediate', affection: 3 },
                { text: '替她们互相传一句对方的好', effect: 'convey', affection: 2 },
                { text: '「我先回避，你们自己谈。」', effect: 'leave', affection: 1 }
            ]}
        ],
        effects: function(npc, choice) { return _applyBridgeEffects(npc, choice, '琤霄凌'); }
    },
    // ---- 蓝凤凰：在五仙教接待情敌 ----
    'wx_event_bridge': {
        id: 'wx_event_bridge', npcId: 'sect_leader_五仙教', title: '蛊窟论交', icon: '🦋',
        desc: '她带那人看了万蛊窟。',
        minAffection: 50, trigger: { random: 1.0 }, cooldown: BRIDGE_COOLDOWN_DAYS, flag: 'wx_e_bridge_cd',
        requireEventDone: 'wx_event_rival', requireRivalRomance: true,
        scenes: [
            { speaker: 'narrator', text: '你请蓝凤凰见那人。她妖媚一笑，竟带那人进了万蛊窟——千百只蛊瓮码成墙。', type: 'description' },
            { speaker: 'narrator', text: '她锁骨下的蝶形黑纹鼓了一下，又安静——心蛊认得出，眼前这人也喂过你。', type: 'description' },
            { speaker: 'npc', text: '「哟。」她凤目一挑，「我的心蛊都比你客气。坐吧——五仙教待客，不喂蛊。」' },
            { speaker: 'narrator', text: '她侧头看你，等你开口。', type: 'description' },
            { speaker: 'player_select', text: '你如何撮合？', options: [
                { text: '「你们都为我不敢动情/动了情。别把账算对方头上。」', effect: 'mediate', affection: 3 },
                { text: '替她们互相传一句对方的好', effect: 'convey', affection: 2 },
                { text: '「我先回避，你们自己谈。」', effect: 'leave', affection: 1 }
            ]}
        ],
        effects: function(npc, choice) { return _applyBridgeEffects(npc, choice, '蓝凤凰'); }
    }
};

// ============ 统一效果：按当前配对档位推进 + 每位女主角独立声口文案 ============
function _playerTa() { return (window.currentCharData && window.currentCharData.gender === 'female') ? '她' : '他'; }

// 档位判定（统一），返回 tier key
function _resolveBridgeTier(bRel, bStr, aRel, aStr, choice) {
    if (aRel === 'friend' && aStr >= BRIDGE_INTIMATE_STRENGTH) return 'intimate';
    if (aRel === 'friend' && bRel !== 'friend') return 'friend_form';
    if (aRel === 'friend' && bRel === 'friend') return 'friend_deepen';
    if (bRel === 'enemy' && (aRel === 'neutral' || aStr < bStr)) {
        return (choice === 'leave') ? 'enemy_leave' : 'enemy_ease';
    }
    if (bRel === 'neutral' || (bRel === 'enemy' && aRel === 'neutral')) return 'neutral_warm';
    return 'neutral_warm';
}

// 每位女主角 × 档位 独立文案（去模板化）
var _BRIDGE_TIER_MSGS = {
    'sect_leader_百花谷': { // 温蘅：医者/药茶声口
        enemy_ease: function(r){ return '温蘅收了冷脸，给'+r+'续了一杯茶——这是头一回，她把那人当客人，不当敌。药庐的灯，今晚为两个人亮着。再论交几回，或可放下。'; },
        enemy_leave: function(r){ return '你回避了。两个女人独在药庐——没动手，但也没谈拢。温蘅出来时笑眼是凉的：「下次别让她一个人来。」茶凉在桌上，没人收。'; },
        neutral_warm: function(r){ return '温蘅送'+r+'出门，破天荒说了句「慢走」。她回身揉了揉太阳穴：「医者不自医，我倒给自己添了心病。」再撮合几回，或可成友。'; },
        friend_form: function(r){ return '温蘅把那只客用杯子推给'+r+'：「往后，你也是我这药庐的客。」——她把对方的名字，记进了那本只记弟子的册子。敌意散了，留的是同病相怜。你这一局，撮合成了。'; },
        friend_deepen: function(r){ return '她俩交换关于'+_playerTa()+'的糗事，温蘅笑得被茶呛到：「'+_playerTa()+'竟也怕苦？」'+r+'答：「我那碗药，'+_playerTa()+'一滴没剩。」两人笑成一团。再论交几回，或可结金兰。'; },
        intimate: function(r){ return '温蘅给'+r+'把了脉，又让'+r+'给她把了脉——两个医者互诊。「你的心脉，比我乱。」温蘅笑。「彼此彼此。」'+r+'答。她们在一壶药茶里结了金兰——此后药庐的客杯，永远备两只。'+_playerTa()+'来时，再不争先后，只论姊妹。'; }
    },
    'sect_leader_修罗宫': { // 绯泪：断簪/寒冰声口
        enemy_ease: function(r){ return '绯泪收了指尖的寒意，给'+r+'倒了一杯茶——没说话，但茶是热的。修罗宫的寒，今晚让了一线。再论交几回，或可放下。'; },
        enemy_leave: function(r){ return '你回避了。大殿里两个女人没拔刀，但也没说话。绯泪出来时眼神冷得能冻血：「下次，别让她一个人来修罗宫。」'; },
        neutral_warm: function(r){ return '绯泪送'+r+'出殿，破天荒没背手：「……慢走。」她回身把那根断簪在掌心转了一圈，收进袖里。再撮合几回，或可成友。'; },
        friend_form: function(r){ return '绯泪把那根修好的断簪递给'+r+'看：「金线是我接的。」'+r+'看了一眼：「接得真丑。」绯泪竟笑了——两个被'+_playerTa()+'伤过的人，在一根簪子上停了战。你这一局，撮合成了。'; },
        friend_deepen: function(r){ return '她俩交换关于'+_playerTa()+'的糗事，绯泪罕见地笑出声：「'+_playerTa()+'怕黑？」'+r+'答：「路灯是'+_playerTa()+'那盏。」两人对视，都先别开了脸——怕对方看见自己眼底的暖。再论交几回，或可结金兰。'; },
        intimate: function(r){ return '绯泪把那根断簪掰成两截——一截递给'+r+'，一截自己留。「各拿一半。」她轻声，「从前我说谁也不欠谁，是对敌人。这回——是对姊妹。」修罗宫头一回，有了不靠寒冰维系的关系。'+_playerTa()+'来时，她俩再不争先后，只论姊妹。'; }
    },
    'sect_leader_天山派': { // 琤霄凌：霜鸣/双剑声口
        enemy_ease: function(r){ return '霄凌手按霜鸣鞘，没拔。她给'+r+'让了半步进雪庐——这是头一回，她让情敌近她的剑。再论交几回，或可放下。'; },
        enemy_leave: function(r){ return '你回避了。雪庐里两柄剑没出鞘，但剑意在空气里绞成一团。霄凌出来时手按鞘：「下次，别让她一个人进雪庐。」'; },
        neutral_warm: function(r){ return '霄凌送'+r+'出庐，破天荒扫了条道：「……雪大，慢走。」她回身把霜鸣挂回中龛，指腹在裂纹上停了一瞬。再撮合几回，或可成友。'; },
        friend_form: function(r){ return '霄凌把霜鸣从墙上取下，让'+r+'看那道裂纹：「这是师姐留的。」'+r+'没说话，只把自己的剑也挂上庐墙——两柄剑并挂。「你的剑，也认了主。」霄凌轻声。你这一局，撮合成了。'; },
        friend_deepen: function(r){ return '她俩交换关于'+_playerTa()+'的糗事，霄凌难得露出少年气：「'+_playerTa()+'练『雪落』腕太软。」'+r+'答：「'+_playerTa()+'那招我也看过。」两人在雪庐笑，霜鸣在墙上轻鸣一声。再论交几回，或可结金兰。'; },
        intimate: function(r){ return '霄凌把霜鸣横在两人之间，让'+r+'握住剑鞘——两双手叠在霜鸣上。「师姐让我把它练成。」霄凌哑声，「我练了十二年。今天，它认了第二个人。」霜鸣轻鸣，像在应。两柄剑从此并挂雪庐，不饮血，只应和。'+_playerTa()+'来时，她俩再不争先后，只论姊妹。'; }
    },
    'sect_leader_五仙教': { // 蓝凤凰：心蛊/蝶声口
        enemy_ease: function(r){ return '蓝凤凰锁骨下的黑纹鼓了一下又安静。她给'+r+'让了座——「五仙教待客，不喂蛊。」心蛊认得出，眼前这人也喂过'+_playerTa()+'。再论交几回，或可放下。'; },
        enemy_leave: function(r){ return '你回避了。蛊窟里黑纹在她俩之间鼓动，没破壳。蓝凤凰出来时妖媚的笑是凉的：「下次别让她一个人进蛊窟——心蛊不挑嘴。」'; },
        neutral_warm: function(r){ return '蓝凤凰送'+r+'出窟，破天荒没拿忘情散：「……慢走。」她回身把那只空蛊瓮推了推——像在想让谁也能往里看一眼。再撮合几回，或可成友。'; },
        friend_form: function(r){ return '蓝凤凰把锁骨下的黑纹给'+r+'看：「心蛊。嗜真情。」'+r+'看了很久：「我也喂过'+_playerTa()+'。」「那它认得你。」蓝凤凰轻声——心蛊在两人之间，第一次没朝一人鼓动。你这一局，撮合成了。'; },
        friend_deepen: function(r){ return '她俩交换关于'+_playerTa()+'的糗事，蓝凤凰笑得花枝乱颤：「'+_playerTa()+'怕我的心蛊？」'+r+'答：「'+_playerTa()+'连忘情散都敢夺。」两人笑——黑纹安安静静，像也听懂了。再论交几回，或可结金兰。'; },
        intimate: function(r){ return '蓝凤凰把那只空蛊瓮推到'+r+'面前：「从前我等它装心蛊。今天，我想让它装点别的。」'+r+'懂了，把自己的一缕真气也渡进瓮里。心蛊在她俩之间化成一只银蝶，绕两人飞了一圈——不再噬谁，只随她们。「姊妹的蛊，不噬人。」蓝凤凰轻声。'+_playerTa()+'来时，她俩再不争先后，只论姊妹。'; }
    }
};

function _applyBridgeEffects(npc, choice, hostName) {
    var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
    if (!rival) return { affection: 0, msg: '（无人可论交——你已无他情。）' };
    var rivalNpc = window.npcManager && window.npcManager.getNPC ? window.npcManager.getNPC(rival.id) : null;
    if (!rivalNpc) return { affection: 0, msg: '（情敌不在。）' };

    initHeroinePairIfNeeded(npc.id, rival.id);
    var before = getHeroinePairRelation(npc.id, rival.id);
    var bRel = before.relation || 'neutral';
    var bStr = Number(before.strength) || 0;

    // delta：mediate 最有效，convey 次之，leave 最弱（不宜传话、她俩自己又没熟）
    var delta = (choice === 'mediate') ? 26 : (choice === 'convey') ? 18 : 10;

    var result = null;
    if (typeof window.adjustNPCRelationshipPair === 'function') {
        result = window.adjustNPCRelationshipPair(npc, rivalNpc, delta, { defaultRelation: 'enemy' });
    }
    var after = result || getHeroinePairRelation(npc.id, rival.id);
    var aRel = after.relation || 'neutral';
    var aStr = Number(after.strength) || 0;

    var aff = (choice === 'mediate') ? 3 : (choice === 'convey' ? 2 : 1);

    var tier = _resolveBridgeTier(bRel, bStr, aRel, aStr, choice);
    var table = _BRIDGE_TIER_MSGS[npc.id] || _BRIDGE_TIER_MSGS['sect_leader_百花谷'];
    var fn = table[tier] || table.neutral_warm;
    return { affection: aff, msg: fn(rival.name) };
}

// ============ 合并进总事件池 ============
if (typeof NPC_PERSONAL_EVENTS !== 'undefined') {
    Object.assign(NPC_PERSONAL_EVENTS, HEROINE_BRIDGE_EVENTS);
}

// ============ 每日钩子：玩家在某女主角门派 + 吃醋已发生 + 有情敌 + 未至至交 → 触发论交 ============
if (typeof window !== 'undefined' && window.timeSystem && window.timeSystem.onNewDaySubscribe) {
    window.timeSystem.onNewDaySubscribe(function() {
        try {
            if (!window.currentCharData || !window.npcManager) return;
            if (typeof window.HEROINE_ROSTER === 'undefined') return;
            var loc = window.currentCharData.location || '';
            for (var i = 0; i < window.HEROINE_ROSTER.length; i++) {
                var h = window.HEROINE_ROSTER[i];
                if (h.sect !== loc) continue;
                // 吃醋对峙须已发生（她们已知彼此）
                if (typeof hasEventTriggered === 'function' && !hasEventTriggered(h.eventId)) continue;
                var npc = window.npcManager.getNPC ? window.npcManager.getNPC(h.id) : null;
                if (!npc) continue;
                var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(h.id) : null;
                if (!rival) continue; // 无情敌
                // 确保配对初始化
                initHeroinePairIfNeeded(h.id, rival.id);
                var pair = getHeroinePairRelation(h.id, rival.id);
                // 已至"至交"（friend 且 强度≥80）→ 不再触发
                if (pair.relation === 'friend' && (Number(pair.strength) || 0) >= BRIDGE_INTIMATE_STRENGTH) continue;
                var bridgeId = h.id === 'sect_leader_百花谷' ? 'bh_event_bridge'
                    : h.id === 'sect_leader_修罗宫' ? 'xl_event_bridge'
                    : h.id === 'sect_leader_天山派' ? 'ts_event_bridge'
                    : 'wx_event_bridge';
                var ev = NPC_PERSONAL_EVENTS[bridgeId];
                if (!ev) continue;
                if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npc)) continue;
                // 冷却检查（既有 cd 机制：window._eventCooldowns）
                if (typeof checkEventTrigger === 'function' && !checkEventTrigger(ev, window.currentCharData)) continue;
                // 延迟弹出
                setTimeout(function(evId, npcInst) {
                    if (document.querySelector && document.querySelector('.personal-event-modal')) return;
                    var ev2 = NPC_PERSONAL_EVENTS[evId];
                    if (!ev2) return;
                    if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev2, npcInst)) return;
                    if (typeof triggerPersonalEvent === 'function') triggerPersonalEvent(evId);
                }.bind(null, bridgeId, npc), 1200);
            }
        } catch (e) { console.warn('[情敌论交] 每日触发失败:', e); }
    });
}

// ============ 导出 ============
if (typeof window !== 'undefined') {
    window.HEROINE_BRIDGE_EVENTS = HEROINE_BRIDGE_EVENTS;
    window.getHeroinePairRelation = getHeroinePairRelation;
    window.initHeroinePairIfNeeded = initHeroinePairIfNeeded;
}
console.log('[情敌论交] 情敌和解/亲密系统加载完成：' + Object.keys(HEROINE_BRIDGE_EVENTS).length + ' 个论交事件');
