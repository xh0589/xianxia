// ==================== heroine-female-context.js - 女修同修语境事件 v1.0 ====================
// 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / triggerPersonalEvent /
//       canPlayerAccessPersonalEvent / hasEventTriggered）
// 加载顺序：在 npc-personal-events.js 之后
//
// 设计宪法：女玩家与女主角的同性恋情，面临与男玩家不同的社会语境——
//   门规、舆论、师父眼光、自身的"头一次"。这些不是惩罚，是真实的处境纹理。
//   仅女玩家可触发（requirePlayerFemale），一次性，每位女主角各 1 个，承认而非回避这件事。
//   男玩家看不到这些事件，其体验不变。

var FEM_CTX_EVENTS = {
    // ---- 温蘅：牡丹的眼光 ----
    'bh_event_femctx': {
        id: 'bh_event_femctx', npcId: 'sect_leader_百花谷', title: '牡丹的眼光', icon: '🌸',
        desc: '牡丹把你拉到一边，欲言又止。',
        minAffection: 55, trigger: { random: 0.35 }, cooldown: 0, flag: 'bh_e_femctx_done',
        requirePlayerFemale: true,
        autoTrigger: { location: '百花谷', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '牡丹把你拽到花圃后头，左右看了一眼，压低声音。', type: 'description' },
            { speaker: 'npc', text: '「我不绕弯子。」牡丹盯着你，「谷主二十年，从没对谁特别过——你是头一个。可你也是个姑娘。」' },
            { speaker: 'npc', text: '「我不是说这不好。我是说，白鹿泽三面环水，方圆千里的嘴，能淹死一个门派。」她叹气，「你若是个男子，倒省了这些口舌。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「嘴长在别人身上。谷主的事，我说了算。」', effect: 'defy', affection: 7 },
                { text: '「我知道。所以我想更小心，不让人抓把柄。」', effect: 'careful', affection: 5 },
                { text: '「牡丹姐，你是在劝我，还是在试我？」', effect: 'probe', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var _pt = (window.currentCharData && window.currentCharData.gender === 'female') ? '她' : '他';
            var aff = 0, msg = '';
            switch (choice) {
                case 'defy': aff = 7; msg = '牡丹愣了一下，忽然笑了，笑得有点狠：「……行。你护着她，比我当年敢。」她拍你肩，「嘴归嘴，谁敢动你们，先过我牡丹这关。」'; break;
                case 'careful': aff = 5; msg = '牡丹点头：「你倒清醒。」她想了想，「谷主也清醒——可清醒的人，活得最累。你替她挡点，她能松一口气。」'; break;
                case 'probe': aff = 6; msg = '牡丹沉默了一瞬：「……两样都有。」她别过脸，「我守了她二十年。你是姑娘，我才多说这一句——换作男子，我连问都不问，直接拔剑。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 绯泪：头一次 ----
    'xl_event_femctx': {
        id: 'xl_event_femctx', npcId: 'sect_leader_修罗宫', title: '头一次', icon: '🩸',
        desc: '她忽然说了一句没头没尾的话。',
        minAffection: 55, trigger: { random: 0.35 }, cooldown: 0, flag: 'xl_e_femctx_done',
        requirePlayerFemale: true,
        autoTrigger: { location: '修罗宫', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '深夜议事厅，只有你和绯泪。她批完最后一份文书，忽然开口，没看你。', type: 'description' },
            { speaker: 'npc', text: '——我这辈子，为一个男人动过心。他叫郗寒舟。' },
            { speaker: 'npc', text: '——我以为我这辈子，只会为男人动心。' },
            { speaker: 'npc', text: '她终于转头看你，绯红眼底有极淡的茫然：——直到你。你是个姑娘。这事儿……我头一回遇见。' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「动心就是动心，不分男女。你为郗寒舟动过，为我也能。」', effect: 'accept', affection: 8 },
                { text: '「你是不是觉得，这对你来说很陌生？」', effect: 'understand', affection: 6 },
                { text: '「绯泪，我不想让你为难。」', effect: 'backoff', affection: 3 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'accept': aff = 8; msg = '她沉默了很久，忽然低低笑了一声：「……你说得轻巧。可你说对了。」她把那根断簪在指间转了一圈，收进袖里，「动心就是动心。不分男女。——我认了。」'; break;
                case 'understand': aff = 6; msg = '她点头：「陌生。不是怕，是……没料到。」她看着你，「我活了这些年，以为自己的心我懂。你来了，我才知道，我不懂。」'; break;
                case 'backoff': aff = 3; msg = '她眼神一冷，又软下来：「……你倒替我着想。」半晌，「可我没说，我为难。」她把一盏茶推给你，「别替我决定。我自己来。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 琤霄凌：童姥的话 ----
    'ts_event_femctx': {
        id: 'ts_event_femctx', npcId: 'sect_leader_天山派', title: '两个女娃娃', icon: '❄️',
        desc: '童姥说了句没头没尾的话。',
        minAffection: 55, trigger: { random: 0.35 }, cooldown: 0, flag: 'ts_e_femctx_done',
        requirePlayerFemale: true,
        autoTrigger: { location: '天山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '童姥盘在梁上，看你和霄凌一前一后走过院落，忽然嗤笑。', type: 'description' },
            { speaker: 'npc', text: '「小霄凌。」童姥的声音从头顶落下，「你那小剑客，是个女娃娃啊。」' },
            { speaker: 'npc', text: '霄凌脚步一顿，没抬头：「……师叔祖说笑了。」' },
            { speaker: 'npc', text: '童姥却不管她，看着你：「姥姥活了快一百年，什么没见过。两个女娃娃，挺好——比当年我跟李秋水那丫头强，至少你们没互相下死手。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '对童姥一礼：「多谢师叔祖成全。」', effect: 'respect', affection: 7 },
                { text: '「我们没互相下死手。我们是一起拔剑的。」', effect: 'together', affection: 8 },
                { text: '看向霄凌，等她表态', effect: 'wait', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'respect': aff = 7; msg = '童姥大笑：「会说话。」她跃下梁，拍了拍霄凌的肩，「姥姥替你担了——天山派，护着自己人。」霄凌没说话，但耳尖红了。'; break;
                case 'together': aff = 8; msg = '童姥挑眉，又笑了：「一起拔剑？好大的口气。」她看了眼霄凌按在霜鸣上的手，「行。一起拔剑的，姥姥记下了。」——霄凌终于看你一眼，冰蓝眼底有暖。'; break;
                case 'wait': aff = 5; msg = '霄凌沉默半晌，对童姥一礼：「……师叔祖，她是我认的人。剑道不分男女，我也不分。」童姥嗤笑一声走了，丢下一句：「开窍了。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 蓝凤凰：心蛊不挑男女 ----
    'wx_event_femctx': {
        id: 'wx_event_femctx', npcId: 'sect_leader_五仙教', title: '心蛊不挑男女', icon: '🦋',
        desc: '她锁骨下的黑纹，在你进门时鼓了一下。',
        minAffection: 55, trigger: { random: 0.35 }, cooldown: 0, flag: 'wx_e_femctx_done',
        requirePlayerFemale: true,
        autoTrigger: { location: '五仙教', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '万蛊窟。你一进门，她锁骨下的蝶形黑纹鼓了一下——又安静。', type: 'description' },
            { speaker: 'npc', text: '「……它认你。」蓝凤凰妖媚地笑，凤目却认真，「我心蛊嗜真情，不分男女——它只认心动不心动。」' },
            { speaker: 'npc', text: '「我原以为，我这辈子只为一个男人动过心。」她指尖点着黑纹，「如今它为你鼓——我才知道，原来它也不挑男女。」' },
            { speaker: 'npc', text: '「五仙教倒没门规管这个。毒娘子若敢嚼舌根，我让她尝尝心蛊。」她笑，「你怕不怕？」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「心蛊不挑男女，我也不挑。我挑你。」', effect: 'choose', affection: 9 },
                { text: '「我不怕毒娘子。我怕你为这又饮忘情散。」', effect: 'worry', affection: 7 },
                { text: '「它若敢噬你，我替你扛。」', effect: 'shield', affection: 8 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'choose': aff = 9; msg = '她怔了一瞬，黑纹在皮下鼓得欢——然后安静下来。「……你这嘴，比我的心蛊还会骗人。」她别过脸，耳尖在靛蓝发间红了，「可我信了。」'; break;
                case 'worry': aff = 7; msg = '她动作一顿，低头看了看那只药碗。「……你还是头一个，怕我饮散多过怕我下毒的。」她把碗推远一寸，「行。为你，今天这丸，减半。」'; break;
                case 'shield': aff = 8; msg = '她笑出声，笑得花枝乱颤：「替我扛心蛊？你倒敢。」黑纹却安安静静——它认了你的话。「可你别忘了，它若噬我，第一个找的就是你。」她轻声，「但我答应你，不到那一步。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    }
};

// ============ 合并进总事件池 ============
if (typeof NPC_PERSONAL_EVENTS !== 'undefined') {
    Object.assign(NPC_PERSONAL_EVENTS, FEM_CTX_EVENTS);
}

// ============ 每日钩子：女玩家在某女主角门派 + 好感≥55 + 未触发 → 触发女修同修语境 ============
if (typeof window !== 'undefined' && window.timeSystem && window.timeSystem.onNewDaySubscribe) {
    window.timeSystem.onNewDaySubscribe(function() {
        try {
            if (!window.currentCharData || window.currentCharData.gender !== 'female') return;
            if (!window.npcManager) return;
            var roster = window.HEROINE_ROSTER || [
                { id: 'sect_leader_百花谷', sect: '百花谷', femctxId: 'bh_event_femctx' },
                { id: 'sect_leader_修罗宫', sect: '修罗宫', femctxId: 'xl_event_femctx' },
                { id: 'sect_leader_天山派', sect: '天山派', femctxId: 'ts_event_femctx' },
                { id: 'sect_leader_五仙教', sect: '五仙教', femctxId: 'wx_event_femctx' }
            ];
            var loc = window.currentCharData.location || '';
            for (var i = 0; i < roster.length; i++) {
                var h = roster[i];
                if (h.sect !== loc) continue;
                var npc = window.npcManager.getNPC ? window.npcManager.getNPC(h.id) : null;
                if (!npc) continue;
                var aff = (npc.relationship && npc.relationship.affection) || 0;
                if (aff < 55) continue;
                if (typeof hasEventTriggered === 'function' && hasEventTriggered(h.femctxId)) continue;
                var ev = NPC_PERSONAL_EVENTS[h.femctxId];
                if (!ev) continue;
                if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npc)) continue;
                setTimeout(function(evId, npcInst) {
                    if (document.querySelector && document.querySelector('.personal-event-modal')) return;
                    var ev2 = NPC_PERSONAL_EVENTS[evId];
                    if (!ev2) return;
                    if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev2, npcInst)) return;
                    if (typeof triggerPersonalEvent === 'function') triggerPersonalEvent(evId);
                }.bind(null, h.femctxId, npc), 1200);
            }
        } catch (e) { console.warn('[女修同修] 每日触发失败:', e); }
    });
}

if (typeof window !== 'undefined') {
    window.FEM_CTX_EVENTS = FEM_CTX_EVENTS;
}
console.log('[女修同修] 女修同修语境事件加载完成：' + Object.keys(FEM_CTX_EVENTS).length + ' 个（仅女玩家）');
