// ==================== heroine-aftermath.js - 道侣回访（结契后）事件 v1.0 ====================
// 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / triggerPersonalEvent /
//       canPlayerAccessPersonalEvent / hasEventTriggered）
//       npcs/npc-system.js（npc.hasFlag('dao_companion')）
// 加载顺序：在四位女主角事件文件之后
//
// 设计宪法：终章结局演出后，道侣关系不该戛然而止。结契后回访——
//   须已与该女主角结为道侣（requireDaoCompanion）、终章已发生、人在该派过夜、一次性。
//   安静收束 + 小幅真实增益（真元/信任），复用既有状态，无人为配额。
//   绯泪线因修罗宫禁男，自然只对女玩家可达（男玩家无法入门、无法结契）。

var AFTERMATH_EVENTS = {
    // ---- 温蘅：药庐晨光 ----
    'bh_event_aftermath': {
        id: 'bh_event_aftermath', npcId: 'sect_leader_百花谷', title: '药庐晨光', icon: '🌸',
        desc: '结契后头一个清晨，药庐的灯还亮着。',
        minAffection: 80, trigger: { random: 1.0 }, cooldown: 0, flag: 'bh_e_aftermath_done',
        requireDaoCompanion: true, requireEventDone: 'bh_event_014',
        scenes: [
            { speaker: 'narrator', text: '结契后头一个清晨。你醒来时，药庐的灯还亮着——她比你还早，正在配药，听见你动静，没回头。', type: 'description' },
            { speaker: 'npc', text: '「醒了？」温蘅笑眼弯弯，把一碗温着的药茶推到你手边，「医者的道侣，得先学会一件事——」她点你额头一指，「别让自己病。你病了，我分心。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「那你以后别一个人守夜配药。我替你盯着。」', effect: 'share', affection: 6 },
                { text: '喝一口药茶：「苦。」', effect: 'bitter', affection: 5 },
                { text: '拉过她的手：「你也别累着。」', effect: 'care', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'share': aff = 6; msg = '她怔了怔，笑了：「……行。两个守夜的人。」她把配药的活分了一半给你——笨手笨脚，她没嫌弃，只在你切歪的药根上轻轻一扶。药庐的灯，从那夜起是两盏。'; break;
                case 'bitter': aff = 5; msg = '她弯了弯眼：「苦就对了。苦入心，去火。」她替你把碗收走，又塞了一颗蜜饯，「道侣的药，也得有人哄着喝。」'; break;
                case 'care': aff = 7; msg = '她没抽手，指尖在你掌心停了一瞬：「……我知道。」她轻声，「二十年了，头一次有人这么跟我说。」她反手握了握你，「一起，别累着。」'; break;
            }
            if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            if (typeof window.addEssence === 'function') window.addEssence(8); // 道侣共修，真元+8
            return { affection: aff, msg: msg };
        }
    },
    // ---- 绯泪：簪与人 ----
    'xl_event_aftermath': {
        id: 'xl_event_aftermath', npcId: 'sect_leader_修罗宫', title: '簪与人', icon: '🩸',
        desc: '她把修好的簪子，插进了你的发髻。',
        minAffection: 80, trigger: { random: 1.0 }, cooldown: 0, flag: 'xl_e_aftermath_done',
        requireDaoCompanion: true, requireEventDone: 'xl_event_033',
        scenes: [
            { speaker: 'narrator', text: '结契后，她在妆台前叫你坐下。那根修好的玉簪——金线缠着断裂处——她捏了很久。', type: 'description' },
            { speaker: 'npc', text: '——别动。' },
            { speaker: 'narrator', text: '她绕到你身后，把簪子轻轻插进你的发髻。指腹在你鬓角停了一瞬，凉的。', type: 'description' },
            { speaker: 'npc', text: '——从前这簪子，是我一个人的疤。她声音很轻，如今它在『我们』头上。以后你戴它，我戴你。' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「那我以后，也替你梳头。」', effect: 'comb', affection: 7 },
                { text: '「绯泪，这簪子以后不断了。」', effect: 'promise', affection: 8 },
                { text: '转身把她拉到镜前：「我也替你戴。」', effect: 'mirror', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'comb': aff = 7; msg = '她僵了一瞬——她从不让人碰她头发。半晌，她背对你坐下：「……梳。」从那以后，修罗宫的妆台前，是两个人。'; break;
                case 'promise': aff = 8; msg = '她看着镜中你的影，许久没说话。然后她极轻地「嗯」了一声——这是她信过的最重的一个字。'; break;
                case 'mirror': aff = 6; msg = '她被你按在妆台前，瞪了你一眼，没挣。你替她插簪时，她从镜里看你，绯红眼底第一次没有寒意，只有人。'; break;
            }
            if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            if (typeof window.addEssence === 'function') window.addEssence(8);
            return { affection: aff, msg: msg };
        }
    },
    // ---- 琤霄凌：双剑晨练 ----
    'ts_event_aftermath': {
        id: 'ts_event_aftermath', npcId: 'sect_leader_天山派', title: '双剑晨练', icon: '❄️',
        desc: '雪庐外，她在等你一起练剑。',
        minAffection: 80, trigger: { random: 1.0 }, cooldown: 0, flag: 'ts_e_aftermath_done',
        requireDaoCompanion: true, requireEventDone: 'ts_event_013',
        scenes: [
            { speaker: 'narrator', text: '结契后，你习惯了雪庐外那道霜白身影。她已在等你，霜鸣横于身前，旁边插着一柄——你的剑。', type: 'description' },
            { speaker: 'npc', text: '「来。」霄凌还是只一个字，但剑尖朝你一摆，是邀你拔剑。「师姐让我把它练成。如今我替她，再教一个人。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '拔剑，与她同练「雪落」', effect: 'spar', affection: 7 },
                { text: '「师叔，我想学霜鸣那一式。」', effect: 'learn', affection: 6 },
                { text: '不拔剑，只看她练', effect: 'watch', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'spar': aff = 7; msg = '两柄剑在雪光里划出同一道弧——你的雪落，终于不软了。她收剑，难得露出少年气：「……成了。」霜鸣在鞘中轻鸣一声，像在应。'; break;
                case 'learn': aff = 6; msg = '她看了你一眼：「霜鸣认了主才肯出鞘。它认你——但它那一式，得我用命教。」她拔出霜鸣半寸，剑身那道裂纹在雪光下，已是愈合的疤。「来，我教你。」'; break;
                case 'watch': aff = 5; msg = '她舞了一阵霜鸣，剑风扫开半圈雪。收剑时她看你：「……不练？」她把剑递给你，「守剑的人也得练剑。来。」——她握着你的手，带你过了第一式。'; break;
            }
            if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            if (typeof window.addEssence === 'function') window.addEssence(8);
            return { affection: aff, msg: msg };
        }
    },
    // ---- 蓝凤凰：减药之后 ----
    'wx_event_aftermath': {
        id: 'wx_event_aftermath', npcId: 'sect_leader_五仙教', title: '减药之后', icon: '🦋',
        desc: '结契后，她的忘情散又减了一丸。',
        minAffection: 80, trigger: { random: 1.0 }, cooldown: 0, flag: 'wx_e_aftermath_done',
        requireDaoCompanion: true, requireEventDone: 'wx_event_013',
        scenes: [
            { speaker: 'narrator', text: '结契后第七日。药庐里，她把忘情散的药碗端起来——又放下。锁骨下的银蝶安静地停着。', type: 'description' },
            { speaker: 'npc', text: '「……今日这丸，我不饮了。」蓝凤凰妖媚地笑，凤目却认真，「心蛊认了你作主，化成了蝶——它不再嗜我真情，我也再不必压。散，可以停了。」' },
            { speaker: 'npc', text: '她把药碗推到你面前：「你替我倒掉。这一碗，倒了，就是我往后不必再为情偿命的记号。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '把药倒进土里', effect: 'dump', affection: 8 },
                { text: '「留半丸，以防万一。」', effect: 'keep_half', affection: 6 },
                { text: '把碗收进她手里：「这碗，你自己决定。」', effect: 'her_choice', affection: 7 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'dump': aff = 8; msg = '药流进土里，黑糊糊化开。她看着，许久，忽然笑了——笑得有泪：「……十八年。头一回，不用饮这玩意儿活。」银蝶在她锁骨下振翅，像在替她高兴。'; break;
                case 'keep_half': aff = 6; msg = '她怔了一下：「……你倒谨慎。」她点头，「行。留半丸。但不是为压情——是为哪天我犯了糊涂，你拿它砸我。」她笑了，「砸醒我。」'; break;
                case 'her_choice': aff = 7; msg = '她看着碗，又看你。「……你这人。」她把碗端起来，自己倒进了土里，「我的命，我自己定。但你让我自己定——这比什么都重。」银蝶落在她指尖。'; break;
            }
            if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
            if (typeof window.addEssence === 'function') window.addEssence(8);
            return { affection: aff, msg: msg };
        }
    }
};

// ============ 合并进总事件池 ============
if (typeof NPC_PERSONAL_EVENTS !== 'undefined') {
    Object.assign(NPC_PERSONAL_EVENTS, AFTERMATH_EVENTS);
}

// ============ 每日钩子：道侣玩家在该派过夜 + 终章已发生 + 未回访 → 触发 ============
if (typeof window !== 'undefined' && window.timeSystem && window.timeSystem.onNewDaySubscribe) {
    window.timeSystem.onNewDaySubscribe(function() {
        try {
            if (!window.currentCharData || !window.npcManager) return;
            var roster = window.HEROINE_ROSTER || [
                { id: 'sect_leader_百花谷', sect: '百花谷', amId: 'bh_event_aftermath', finaleId: 'bh_event_014' },
                { id: 'sect_leader_修罗宫', sect: '修罗宫', amId: 'xl_event_aftermath', finaleId: 'xl_event_033' },
                { id: 'sect_leader_天山派', sect: '天山派', amId: 'ts_event_aftermath', finaleId: 'ts_event_013' },
                { id: 'sect_leader_五仙教', sect: '五仙教', amId: 'wx_event_aftermath', finaleId: 'wx_event_013' }
            ];
            var loc = window.currentCharData.location || '';
            for (var i = 0; i < roster.length; i++) {
                var h = roster[i];
                if (h.sect !== loc) continue;
                var npc = window.npcManager.getNPC ? window.npcManager.getNPC(h.id) : null;
                if (!npc) continue;
                if (!npc.hasFlag || !npc.hasFlag('dao_companion')) continue; // 须已结契
                if (typeof hasEventTriggered === 'function' && !hasEventTriggered(h.finaleId)) continue; // 终章须已发生
                if (typeof hasEventTriggered === 'function' && hasEventTriggered(h.amId)) continue; // 未回访过
                var ev = NPC_PERSONAL_EVENTS[h.amId];
                if (!ev) continue;
                if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npc)) continue;
                setTimeout(function(evId, npcInst) {
                    if (document.querySelector && document.querySelector('.personal-event-modal')) return;
                    var ev2 = NPC_PERSONAL_EVENTS[evId];
                    if (!ev2) return;
                    if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev2, npcInst)) return;
                    if (typeof triggerPersonalEvent === 'function') triggerPersonalEvent(evId);
                }.bind(null, h.amId, npc), 1200);
            }
        } catch (e) { console.warn('[道侣回访] 每日触发失败:', e); }
    });
}

if (typeof window !== 'undefined') {
    window.AFTERMATH_EVENTS = AFTERMATH_EVENTS;
}
console.log('[道侣回访] 结契后回访事件加载完成：' + Object.keys(AFTERMATH_EVENTS).length + ' 个');
