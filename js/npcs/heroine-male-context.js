// ==================== heroine-male-context.js - 男修追女掌门语境事件 v1.0 ====================
// 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / triggerPersonalEvent /
//       canPlayerAccessPersonalEvent / hasEventTriggered）
// 加载顺序：在 npc-personal-events.js 之后
//
// 设计宪法：男玩家追求女主角（多为女掌门），与女玩家处境不同——
//   "男修入女修门派"的舆论、"入赘"的眼光、权力不对等的猜疑。
//   仅男玩家可触发（requirePlayerMale），一次性，每位女主角各 1 个。
//
// 修罗宫男线（苛刻破例，v20.25 按现行代码校注）：明规矩「只收情伤女子」拒男，
//   但入门处给活路——男子可应宫主亲出的情伤四问（与女线同套考题，
//   sect-join-flow.js xiuluoMaleTrialAttempt）：得分≥40 通过（女线≥20 即可），
//   通过 → 以「试情弟子」入派，绯泪主线对其开放；不通过 → 拒收，他日可再应（不死路、无反噬）。
//   门槛高在考题本身与宫规更苛，不靠恶名。故男玩家亦可恋绯泪。
//   四位女主角男玩家语境俱全：温蘅/绯泪/霄凌/蓝凤凰。

var MALE_CTX_EVENTS = {
    // ---- 温蘅：入赘的眼光 ----
    'bh_event_mctx': {
        id: 'bh_event_mctx', npcId: 'sect_leader_百花谷', title: '入赘的眼光', icon: '🌸',
        desc: '谷里弟子看你的眼神，变了。',
        minAffection: 55, trigger: { random: 0.35 }, cooldown: 0, flag: 'bh_e_mctx_done',
        requirePlayerMale: true,
        autoTrigger: { location: '百花谷', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '你路过采药堂，几个女弟子的话声压低了，又飘过来。', type: 'description' },
            { speaker: 'npc', text: '「……一个男修，成天往谷主药庐跑，像什么样子。」另一个答：「谷主怕是又要破例收个男弟子了——百花谷哪有男修入赘的规矩。」' },
            { speaker: 'narrator', text: '温蘅不知何时站在你身后，笑眼弯弯，把那几个弟子吓得噤声。', type: 'description' },
            { speaker: 'npc', text: '「百花谷确实没男修入赘的规矩。」她替你解围，语气却认真，「但我这条命，我自己做主。规矩是给活人让路的，不是堵门的。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「我不是来入赘的。我是来娶谷主下山的。」', effect: 'leave_with', affection: 8 },
                { text: '「我不在乎她们怎么说。」', effect: 'defy', affection: 6 },
                { text: '「谷主，我是不是给你添麻烦了？」', effect: 'worry', affection: 5 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'leave_with': aff = 8; msg = '她怔了一下，笑出声：「……你倒敢在大庭广众说。」她把一枝新折的花塞进你手里，「那就别让人说闲话——光明正大地来，光明正大地走。我跟你。」'; break;
                case 'defy': aff = 6; msg = '她点头：「这话该我说。」她挽起袖子，朝那几个弟子一笑——笑眼弯弯，弟子们作鸟兽散。「她们怕我，不是怕你。你怕什么闲话。」'; break;
                case 'worry': aff = 5; msg = '她看着你，眼神软了一瞬：「你倒替我着想。」她轻声，「麻烦是我选的，不是你添的。我选了，就担得起。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 绯泪：男人与刀（男玩家经破例试炼入修罗宫后可达）----
    'xl_event_mctx': {
        id: 'xl_event_mctx', npcId: 'sect_leader_修罗宫', title: '男人与刀', icon: '🩸',
        desc: '她忽然问起你与郗寒舟。',
        minAffection: 55, trigger: { random: 0.35 }, cooldown: 0, flag: 'xl_e_mctx_done',
        requirePlayerMale: true,
        autoTrigger: { location: '修罗宫', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '你以试情弟子身份入宫已有些时日。深夜，她把你叫到大殿。那根断簪横在案上，她没看你，看着簪子。', type: 'description' },
            { speaker: 'npc', text: '——你是个男人。我破例收的男人。' },
            { speaker: 'npc', text: '——我上一个为男人动心，叫郗寒舟。我亲手杀了他。寒烟门那夜，他用假情报把我换出去。' },
            { speaker: 'npc', text: '她终于抬头，绯红眼底翻涌着你读不懂的东西：——你既受了寒冰与心蛊的试炼进来，我便问你一句。你是个男人，我会不会，又赌错一次？' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「我不是郗寒舟。你既肯破例收我，便该知道，我不一样。」', effect: 'prove', affection: 9 },
                { text: '「你杀了他，是因为他赌了你的命。我受试炼进来，是拿自己的命。」', effect: 'understand', affection: 8 },
                { text: '「绯泪，你若怕，我现在就走。」', effect: 'backoff', affection: 4 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'prove': aff = 9; msg = '她看了你很久，忽然把断簪推过案头一半：「……好。我不信男人。但我可以，试着信你——你既受得住寒冰心蛊，便比他多一分骨头。」她指尖在簪子上停了一瞬，「别让我再拔一次刀。」'; break;
                case 'understand': aff = 8; msg = '她沉默良久：「……你是头一个，把这笔账算清楚的人。郗寒舟赌了我的命，你拿自己的命受试炼——这一进一出，我记着。」她把断簪收回。'; break;
                case 'backoff': aff = 4; msg = '她眼神一冷：「走？」她冷笑，「我又没说要你走。你既受了试炼进门，便是我自己选的——怕，是我的事，你别替我决定。」她把一盏茶推给你，「留下。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 琤霄凌：童姥的提醒 ----
    'ts_event_mctx': {
        id: 'ts_event_mctx', npcId: 'sect_leader_天山派', title: '童姥的提醒', icon: '❄️',
        desc: '童姥把你单独拎了出来。',
        minAffection: 55, trigger: { random: 0.35 }, cooldown: 0, flag: 'ts_e_mctx_done',
        requirePlayerMale: true,
        autoTrigger: { location: '天山派', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '你被一股灵力拎上了梁。童姥盘在你对面，上下打量你，像看一柄待估价的剑。', type: 'description' },
            { speaker: 'npc', text: '「小子。」童姥的声音像碎冰，「小霄凌守了十二年剑，连个能拔霜鸣的人都没等到。你是男的——姥姥问你，你是来拔剑的，还是来娶人的？」' },
            { speaker: 'npc', text: '「男的守不了剑，男的只会想拔。」童姥嗤笑，「你要是只想娶个媳妇下山，趁早滚，别耽误她那柄剑。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「我既要拔霜鸣，也要娶她。两样我都不放手。」', effect: 'both', affection: 9 },
                { text: '「我是来陪她守剑的。剑出不出现，她说了算。」', effect: 'guard', affection: 7 },
                { text: '「童姥，您怕我伤她，还是怕我配不上霜鸣？」', effect: 'probe', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'both': aff = 9; msg = '童姥大笑，笑得梁上落灰：「好大的口气。」她拍了拍你的肩，力道不轻，「行。既要又要，姥姥记下了。小霄凌那柄剑，你敢拔，就别拔一半。」'; break;
                case 'guard': aff = 7; msg = '童姥挑眉，难得没嗤笑：「……守剑，不拔剑。男的能做到这个，少见。」她跃下梁，「行。你去守吧。姥姥看你守不守得住。」'; break;
                case 'probe': aff = 6; msg = '童姥盯了你半晌，忽然笑了，笑得意味深长：「两样都怕。」她跃回梁上，「配不配得上，不是姥姥说了算——是霜鸣说了算。你去问她那柄剑。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 蓝凤凰：养男修 ----
    'wx_event_mctx': {
        id: 'wx_event_mctx', npcId: 'sect_leader_五仙教', title: '养男修', icon: '🦋',
        desc: '毒娘子在蛊堂嚼舌根。',
        minAffection: 55, trigger: { random: 0.35 }, cooldown: 0, flag: 'wx_e_mctx_done',
        requirePlayerMale: true,
        autoTrigger: { location: '五仙教', random: 0.4 },
        scenes: [
            { speaker: 'narrator', text: '蛊堂外，你听见毒娘子和几个长老压低的声音。', type: 'description' },
            { speaker: 'npc', text: '「教主养个男修在教里，像什么话。」毒娘子冷笑，「五仙教历代教主，哪个像她——男修入了五仙教，不是图色就是图权。」' },
            { speaker: 'narrator', text: '蓝凤凰不知何时倚在门边，妖媚一笑。锁骨下的黑纹鼓了一下——心蛊听见了。', type: 'description' },
            { speaker: 'npc', text: '「毒娘子。」蓝凤凰声音懒懒的，「图色图权，你替我操哪门子心。」她锁骨一抬，「我的心蛊认他，不图色不图权，图心动。你那点毒，比不上他一根手指头让我心动。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「我不是图色图权。我图她。」', effect: 'choose', affection: 9 },
                { text: '「毒长老若不信，我愿以血试蛊自证。」', effect: 'prove', affection: 7 },
                { text: '「蓝凤凰，别为她结仇。」', effect: 'care', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var aff = 0, msg = '';
            switch (choice) {
                case 'choose': aff = 9; msg = '蓝凤凰笑出声，笑得花枝乱颤：「……你这嘴，比我养过的蛊还会咬人。」毒娘子拂袖走了，她才低声：「她怕的不是你图色图权——她怕我心蛊动了，五仙教就不再是她能拿捏的五仙教了。」'; break;
                case 'prove': aff = 7; msg = '她按住你的手：「傻话。试蛊是试给人看的，不是试给心蛊的。」她看毒娘子离开的方向，「你的血，我自己认得。不必溅给她看。」'; break;
                case 'care': aff = 6; msg = '她妖媚地笑，眼底却认真：「……你倒是护着我。」她轻声，「毒娘子结不了我的仇——她只是嘴毒。但你说这话，我心蛊记你一笔。」'; break;
            }
            return { affection: aff, msg: msg };
        }
    }
};

// ============ 合并进总事件池 ============
if (typeof NPC_PERSONAL_EVENTS !== 'undefined') {
    Object.assign(NPC_PERSONAL_EVENTS, MALE_CTX_EVENTS);
}

// ============ 每日钩子：男玩家在某女主角门派 + 好感≥55 + 未触发 → 触发男修语境 ============
if (typeof window !== 'undefined' && window.timeSystem && window.timeSystem.onNewDaySubscribe) {
    window.timeSystem.onNewDaySubscribe(function() {
        try {
            if (!window.currentCharData || window.currentCharData.gender !== 'male') return;
            if (!window.npcManager) return;
            var roster = window.HEROINE_ROSTER || [
                { id: 'sect_leader_百花谷', sect: '百花谷', mctxId: 'bh_event_mctx' },
                { id: 'sect_leader_修罗宫', sect: '修罗宫', mctxId: 'xl_event_mctx' },
                { id: 'sect_leader_天山派', sect: '天山派', mctxId: 'ts_event_mctx' },
                { id: 'sect_leader_五仙教', sect: '五仙教', mctxId: 'wx_event_mctx' }
            ];
            var loc = window.currentCharData.location || '';
            for (var i = 0; i < roster.length; i++) {
                var h = roster[i];
                if (h.sect !== loc) continue;
                var npc = window.npcManager.getNPC ? window.npcManager.getNPC(h.id) : null;
                if (!npc) continue;
                var aff = (npc.relationship && npc.relationship.affection) || 0;
                if (aff < 55) continue;
                if (typeof hasEventTriggered === 'function' && hasEventTriggered(h.mctxId)) continue;
                var ev = NPC_PERSONAL_EVENTS[h.mctxId];
                if (!ev) continue;
                if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npc)) continue;
                setTimeout(function(evId, npcInst) {
                    if (document.querySelector && document.querySelector('.personal-event-modal')) return;
                    var ev2 = NPC_PERSONAL_EVENTS[evId];
                    if (!ev2) return;
                    if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev2, npcInst)) return;
                    if (typeof triggerPersonalEvent === 'function') triggerPersonalEvent(evId);
                }.bind(null, h.mctxId, npc), 1200);
            }
        } catch (e) { console.warn('[男修语境] 每日触发失败:', e); }
    });
}

if (typeof window !== 'undefined') {
    window.MALE_CTX_EVENTS = MALE_CTX_EVENTS;
}
console.log('[男修语境] 男修追女掌门语境事件加载完成：' + Object.keys(MALE_CTX_EVENTS).length + ' 个（仅男玩家）');
