// ==================== male-lead-reconcile.js - 男主和好事件 v1.0 ====================
// 依赖：npcs/npc-personal-events.js、npcs/male-lead-rivalry.js（detectRivalRomance 已扩展）
// 加载顺序：在 male-lead-rivalry.js 之后
// 吃醋对峙后，好感养回≥55 + 仍有情敌 + 一次性 → 触发和好。道侣走苦涩、表白走二次机会。

var MALE_RECONCILE_EVENTS = {
    // ---- 冶砚：炉房和好 ----
    'lu_event_reconcile': {
        id: 'lu_event_reconcile', npcId: 'sect_leader_铸剑山庄', title: '炉火又亮', icon: '🍵',
        desc: '炉房的灯，又亮了。',
        minAffection: 55, trigger: { random: 1.0 }, cooldown: 0, flag: 'lu_e_reconcile_done',
        requireRivalRomance: true, requireEventDone: 'lu_event_rival',
        scenes: [
            { speaker: 'narrator', text: '炉房。你推门——炉火又亮了，比上次那只凉茶暖。冶砚背对你在打铁，听见脚步，锤没停。', type: 'description' },
            { speaker: 'npc', text: '「你又来了。」他声音闷，火气消了大半，「我以为你不来了。」' },
            { speaker: 'npc', text: '「炉前的位，我给你留着。」他把锤一搁，回头看你，琥珀眼底有真东西，「你愿意推门，就一直能推。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「我以后只来你这炉房。」', effect: 'only', affection: 10 },
                { text: '「炉我坐。但有些事我做不到了。」', effect: 'honest', affection: 4 },
                { text: '什么都不说，帮他拉风箱', effect: 'silent', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            if (!rival) return { affection: 0, msg: '（无人可论交——你已无他情。）' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'only':
                    aff = dao ? -2 : 10;
                    msg = dao
                        ? '他笑了一下，虎牙没露：「……只来我这？你道侣'+rival.name+'，怕是不依。」他摇头，「炉前的位给你留着，但只做炉友——你要来，别说得满。」'
                        : '他怔了怔，琥珀眼底亮了一瞬，随即垂下：「……好。」他把风箱拉杆也递你一根，「两根杆，一起拉。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 8);
                    break;
                case 'honest':
                    aff = dao ? 2 : 4;
                    msg = dao
                        ? '他点头，火气平了：「'+rival.name+'既是你道侣，你做不到的，我懂。」他把炉前的凳推近，「炉房不收道侣，只收炉友。你来，我留位。」'
                        : '他叹了口气：「……你倒老实。」他把炉火拨旺，「做不到的，慢慢来。炉先坐着——门没落锁。」';
                    break;
                case 'silent':
                    aff = 6;
                    msg = '你没说话，过去拉风箱。他看你拉，许久，锤落得比往日稳。「……不说话也好。」他低声，「炉火，又暖了。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 芩木：药庐和好 ----
    'su_event_reconcile': {
        id: 'su_event_reconcile', npcId: 'sect_leader_药王谷', title: '热茶', icon: '🍵',
        desc: '她推来的茶，又是热的了。',
        minAffection: 55, trigger: { random: 1.0 }, cooldown: 0, flag: 'su_e_reconcile_done',
        requireRivalRomance: true, requireEventDone: 'su_event_rival',
        scenes: [
            { speaker: 'narrator', text: '药庐。芩木推一只热茶到你面前——和上次那只凉的，同一位置。', type: 'description' },
            { speaker: 'npc', text: '「你又来了。」他温润地笑，浅褐眼底有了真东西，「我以为你不来了。」' },
            { speaker: 'npc', text: '「茶给你。药庐的门……」他顿了顿，「你愿意推，就一直能推。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '「我以后只来你这药庐。」', effect: 'only', affection: 10 },
                { text: '「茶我喝。但有些事我做不到了。」', effect: 'honest', affection: 4 },
                { text: '什么都不说，把茶喝了', effect: 'silent', affection: 6 }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            if (!rival) return { affection: 0, msg: '（无人可论交——你已无他情。）' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'only':
                    aff = dao ? -2 : 10;
                    msg = dao
                        ? '他笑了一下，温润里有苦：「……只来我这？你道侣'+rival.name+'，怕是不依。」他摇头，「茶给你喝，但只做药友——你来，别说得满。」'
                        : '他怔了怔，浅褐眼底亮了一瞬，随即垂下：「……好。」他起身去烫第二只杯子，「两只，都温着。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 8);
                    break;
                case 'honest':
                    aff = dao ? 2 : 4;
                    msg = dao
                        ? '他点头，温润平了：「'+rival.name+'既是你道侣，你做不到的，我懂。」他把热茶推近，「药庐不收道侣，只收常客。你来，我留位。」'
                        : '他叹了口气：「……你倒老实。」他把茶推给你，「做不到的，慢慢来。茶先喝——门没落锁。」';
                    break;
                case 'silent':
                    aff = 6;
                    msg = '你把热茶喝了。他看着你喝完，弯了弯眼：「……不说话也好。」他起身去烫第二只杯子，「明日还有一盏。」——药庐的灯，又亮到很晚。';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 5);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 昴既明：符阁和好 ----
    'ms_event_reconcile': {
        id: 'ms_event_reconcile', npcId: 'sect_leader_茅山派', title: '符阁开线', icon: '🍵',
        desc: '符阁落锁的门，又开出一条道。',
        minAffection: 55, trigger: { random: 1.0 }, cooldown: 0, flag: 'ms_e_reconcile_done',
        requireRivalRomance: true, requireEventDone: 'ms_event_rival',
        scenes: [
            { speaker: 'narrator', text: '符阁外。门前的积雪被扫出一条道——从阶下直通到门内。他没看你，但那条道是给你扫的。', type: 'description' },
            { speaker: 'npc', text: '「朱砂今日研好了。」他声音清冷，但没拦你，「……你要进来，就进来。」' },
            { speaker: 'npc', text: '「门我没落锁。」他终于看你，银光里雪化了一线，「但你要进来——就只守这一道符。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '踏上那条扫出的道，进门', effect: 'enter', affection: 10 },
                { text: '「符，我守。」', effect: 'promise', affection: 8 },
                { text: '「我可能守不住。」', effect: 'honest', affection: 4 }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            if (!rival) return { affection: 0, msg: '（无人可论交——你已无他情。）' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'enter':
                    aff = dao ? 0 : 10;
                    msg = dao
                        ? '你踏上道，进了符阁。他没拦，但护身符挂在中龛，没让你近。「你道侣是'+rival.name+'。」他背对你，「守符要一心。你既有了'+rival.name+'——符阁的门，开这一回，是还你的情。下回，别来了。」'
                        : '你踏上道，进了符阁。他让了半步，没拦。符阁里两道符并挂——他画的，和你的。他看着符：「……守得住，就守。守不住，门我还会扫。」';
                    break;
                case 'promise':
                    aff = dao ? 3 : 8;
                    msg = dao
                        ? '他看了你很久：「……你已把'+rival.name+'当道侣，符怎么守？」他摇头，「话我记下了。但守符要一心——你心里两个名字，符不认。门，开这一线，是最后的。」'
                        : '他点头，银光里一线雪化开：「……行。符认你，我也不拦。」他让开身，「门开着。但'+rival.name+'的事，你给我个了断——符道不容二心。」';
                    break;
                case 'honest':
                    aff = 4;
                    msg = '他沉默半晌，难得露出一点笑意，清冷里的暖：「……守不住也来。这才叫守。」他让开半步，「门开着。能守多久守多久——符等得起。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    },
    // ---- 赫渊：塔内和好 ----
    'jg_event_reconcile': {
        id: 'jg_event_reconcile', npcId: 'sect_leader_金刚宗', title: '塔门开', icon: '🍵',
        desc: '金刚塔的门，又开了。',
        minAffection: 55, trigger: { random: 1.0 }, cooldown: 0, flag: 'jg_e_reconcile_done',
        requireRivalRomance: true, requireEventDone: 'jg_event_rival',
        scenes: [
            { speaker: 'narrator', text: '金刚塔。门开着——赫渊盘坐塔内，金刚线松了一线。他没睁眼，但为你留了门。', type: 'description' },
            { speaker: 'npc', text: '他许久没动，然后——极轻地开口：「……你来了。」闭口禅，又为你续上了。「我以为你不来了。」' },
            { speaker: 'npc', text: '「塔门我没闭。」他睁眼，沉静的眼底有真东西，「你愿意进，就一直能进。」' },
            { speaker: 'player_select', text: '你如何回应？', options: [
                { text: '进塔，盘坐他旁边', effect: 'enter', affection: 10 },
                { text: '「我以后只守你这塔。」', effect: 'only', affection: 8 },
                { text: '「我可能守不住。」', effect: 'honest', affection: 4 }
            ]}
        ],
        effects: function(npc, choice) {
            var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(npc.id) : null;
            if (!rival) return { affection: 0, msg: '（无人可论交——你已无他情。）' };
            var dao = rival.isDaoCompanion;
            var aff = 0, msg = '';
            switch (choice) {
                case 'enter':
                    aff = dao ? 0 : 10;
                    msg = dao
                        ? '你进塔，盘坐他旁边。他没拦，但金刚线缠回了一圈。「你道侣是'+rival.name+'。」他背对你，「守塔要一心。你既有了'+rival.name+'——塔门开这一回，是还你的情。下回，别来了。」'
                        : '你进塔，盘坐他旁边。他让了半寸，没拦。两人盘坐，金刚线松着。「……守得住，就守。守不住，门我还留。」他低声。';
                    break;
                case 'only':
                    aff = dao ? 3 : 8;
                    msg = dao
                        ? '他看了你很久：「……你已把'+rival.name+'当道侣，塔怎么守？」他摇头，「话我记下了。但守塔要一心——你心里两个名字，塔不认。门，开这一回，是最后的。」'
                        : '他点头，沉静的眼底一线暖：「……行。塔认你，我也不拦。」他让开身，「门开着。但'+rival.name+'的事，你给我个了断——塔里不容二心。」';
                    break;
                case 'honest':
                    aff = 4;
                    msg = '他沉默半晌，沉静的眼底罕见地有了暖：「……守不住也来。这才叫守。」他把金刚线松了一圈，「门开着。能守多久守多久——塔等得起。」';
                    if (npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 6);
                    break;
            }
            return { affection: aff, msg: msg };
        }
    }
};

if (typeof NPC_PERSONAL_EVENTS !== 'undefined') {
    Object.assign(NPC_PERSONAL_EVENTS, MALE_RECONCILE_EVENTS);
}

// 每日钩子：男主门派 + 吃醋已发生 + 好感≥55 + 仍有情敌 + 未和好 → 触发
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
                var rivalId = h.id === 'sect_leader_铸剑山庄' ? 'lu_event_rival'
                    : h.id === 'sect_leader_药王谷' ? 'su_event_rival'
                    : h.id === 'sect_leader_茅山派' ? 'ms_event_rival'
                    : h.id === 'sect_leader_金刚宗' ? 'jg_event_rival' : null;
                var reconId = h.id === 'sect_leader_铸剑山庄' ? 'lu_event_reconcile'
                    : h.id === 'sect_leader_药王谷' ? 'su_event_reconcile'
                    : h.id === 'sect_leader_茅山派' ? 'ms_event_reconcile'
                    : h.id === 'sect_leader_金刚宗' ? 'jg_event_reconcile' : null;
                if (!rivalId || !reconId) continue;
                var npc = window.npcManager.getNPC ? window.npcManager.getNPC(h.id) : null;
                if (!npc) continue;
                var aff = (npc.relationship && npc.relationship.affection) || 0;
                if (aff < 55) continue;
                if (typeof hasEventTriggered === 'function' && !hasEventTriggered(rivalId)) continue; // 吃醋须已发生
                if (typeof hasEventTriggered === 'function' && hasEventTriggered(reconId)) continue; // 未和好
                if (typeof window.detectRivalRomance !== 'function' || !window.detectRivalRomance(h.id)) continue;
                var ev = NPC_PERSONAL_EVENTS[reconId];
                if (!ev) continue;
                if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npc)) continue;
                setTimeout(function(evId, npcInst) {
                    if (document.querySelector && document.querySelector('.personal-event-modal')) return;
                    var ev2 = NPC_PERSONAL_EVENTS[evId];
                    if (!ev2) return;
                    if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev2, npcInst)) return;
                    if (typeof triggerPersonalEvent === 'function') triggerPersonalEvent(evId);
                }.bind(null, reconId, npc), 1200);
            }
        } catch (e) { console.warn('[男性和好] 每日触发失败:', e); }
    });
}

if (typeof window !== 'undefined') window.MALE_RECONCILE_EVENTS = MALE_RECONCILE_EVENTS;
console.log('[男性和好] 男主和好事件加载完成：' + Object.keys(MALE_RECONCILE_EVENTS).length + ' 个');
