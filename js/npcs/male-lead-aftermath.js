// ==================== male-lead-aftermath.js - 男主道侣回访（结契后）事件 v1.0 ====================
// 依赖：npcs/npc-personal-events.js、npc-system.js（dao_companion flag）
// 加载顺序：在四位男主事件文件 + male-lead-rivalry.js 之后
// 终章结局演出后，道侣关系不戛然而止。结契后回访——安静收束 + 真实增益。

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
                    : h.id === 'sect_leader_金刚宗' ? 'jg_event_013' : null;
                var amId = h.id === 'sect_leader_铸剑山庄' ? 'lu_event_aftermath'
                    : h.id === 'sect_leader_药王谷' ? 'su_event_aftermath'
                    : h.id === 'sect_leader_茅山派' ? 'ms_event_aftermath'
                    : h.id === 'sect_leader_金刚宗' ? 'jg_event_aftermath' : null;
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
