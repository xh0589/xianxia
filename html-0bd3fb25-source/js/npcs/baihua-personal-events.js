// ==================== baihua-personal-events.js - 温蘅线结局/注册/自动触发系统 v12.3 ====================
// 依赖：npcs/npc-personal-events.js（NPC_PERSONAL_EVENTS / registerEndingSet / registerEndingCallback /
//       hasEventTriggered / isChainHead / checkEventTrigger / triggerPersonalEvent）
// 依赖：baihua-events-main.js、baihua-events-extra.js
// 加载顺序：在上述文件之后

// ============ 结局演出定义（6个） ============
var BAIHUA_ENDINGS = {
    'bh_ending_并肩': {
        id: 'bh_ending_并肩', npcId: 'sect_leader_百花谷', title: '结局·并肩', icon: '🌸',
        route: '并肩',
        scenes: [
            { speaker: 'narrator', text: '三日后，温蘅当众宣布：谷主之位交由牡丹代理。', type: 'description' },
            { speaker: 'narrator', text: '牡丹愣了很久，最后骂骂咧咧地接下了印信。', type: 'description' },
            { speaker: 'npc', text: '「走吧。」她背着一个不小的药箱，冲你扬了扬下巴，「江湖那么大，病人那么多——可耽误不起。」' },
            { speaker: 'narrator', text: '多年以后，江湖上有了「百花双圣」的传说：一个治病，一个治心。', type: 'description' },
            { speaker: 'narrator', text: '有人说曾见过他们在雪山脚下支起药棚，她笑着给人诊脉——那笑容和传闻中一模一样。只有站在她身边的人知道，那不是面具。', type: 'description' }
        ],
        finalText: '——— 结局·并肩（恋人·同行）———'
    },
    'bh_ending_归谷': {
        id: 'bh_ending_归谷', npcId: 'sect_leader_百花谷', title: '结局·归谷', icon: '🏡',
        route: '归谷',
        scenes: [
            { speaker: 'narrator', text: '你留在了百花谷。', type: 'description' },
            { speaker: 'narrator', text: '谷里的人渐渐发现，谷主对着窗台那盆金边花发呆的时间变多了。', type: 'description' },
            { speaker: 'narrator', text: '更奇怪的是——她的笑，在你面前越来越少。', type: 'description' },
            { speaker: 'npc', text: '「看什么看。」她发现你在看她，别过脸去，耳朵有点红，「……饭好了，去摆碗筷。」' },
            { speaker: 'narrator', text: '牡丹说得对，她那个人谁都暖不了。但牡丹不知道——她只是把盔甲脱了下来，放在了你看得见的地方。', type: 'description' }
        ],
        finalText: '——— 结局·归谷（恋人·守护）———'
    },
    'bh_ending_知己': {
        id: 'bh_ending_知己', npcId: 'sect_leader_百花谷', title: '结局·知己', icon: '🤝',
        route: '知己',
        scenes: [
            { speaker: 'narrator', text: '你们成了江湖闻名的采药搭档。她管配药，你管试毒。', type: 'description' },
            { speaker: 'narrator', text: '南疆的蛊、北冥的毒、蜀地的瘴——你们一起趟过大半个天下。', type: 'description' },
            { speaker: 'npc', text: '「下次走官道。」她一边写行医笔记一边说，「上次那条山路，你差点摔下去。」' },
            { speaker: 'narrator', text: '有人问起你们是什么关系。', type: 'description' },
            { speaker: 'npc', text: '「搭档。」她答得干脆，说完自己先笑了。' }
        ],
        finalText: '——— 结局·知己（朋友·同行）———'
    },
    'bh_ending_药庐': {
        id: 'bh_ending_药庐', npcId: 'sect_leader_百花谷', title: '结局·药庐', icon: '🍵',
        route: '药庐',
        scenes: [
            { speaker: 'narrator', text: '你成了药庐的常客。', type: 'description' },
            { speaker: 'narrator', text: '你的茶永远温在那只成对的杯子里——她每天早上烧第一壶水时，会顺手把你的杯子也烫一遍。', type: 'description' },
            { speaker: 'npc', text: '「今天有新到的陈皮，尝尝。」' },
            { speaker: 'narrator', text: '牡丹有一次忍不住问你：「你这算什么？」', type: 'description' },
            { speaker: 'narrator', text: '你想了想，说：「常客。」', type: 'description' }
        ],
        finalText: '——— 结局·药庐（朋友·守护）———'
    },
    'bh_ending_花冢': {
        id: 'bh_ending_花冢', npcId: 'sect_leader_百花谷', title: '结局·花冢', icon: '🥀',
        route: '花冢',
        scenes: [
            { speaker: 'narrator', text: '她抱着陶盆站在花圃里，看着你离开的方向，站了很久很久。', type: 'description' },
            { speaker: 'narrator', text: '第二年春天，那株金边花枯死了。她没有再培育新的。', type: 'description' },
            { speaker: 'narrator', text: '百花谷依旧满园花开，依旧救人无数。', type: 'description' },
            { speaker: 'narrator', text: '只是再没有一个姓{playerName}的弟子。', type: 'description' }
        ],
        finalText: '——— 结局·花冢（辜负）———'
    },
    'bh_ending_面具': {
        id: 'bh_ending_面具', npcId: 'sect_leader_百花谷', title: '结局·面具', icon: '😊',
        route: '面具',
        scenes: [
            { speaker: 'narrator', text: '后来你还是去过几次百花谷。她对你很好，礼数周全，笑容标准。', type: 'description' },
            { speaker: 'narrator', text: '药庐的灯还亮着，但那只客用的杯子收起来了。', type: 'description' },
            { speaker: 'narrator', text: '再后来，你在江湖上偶尔听说百花谷的消息——一切都好，谷主医术愈发精深。', type: 'description' },
            { speaker: 'narrator', text: '只是你再也没见过第二个，像她那样笑的人。', type: 'description' }
        ],
        finalText: '——— 结局·面具（错过）———'
    }
};

// ============ 注册结局集与副作用回调 ============
if (typeof registerEndingSet === 'function') {
    registerEndingSet('sect_leader_百花谷', BAIHUA_ENDINGS);
}
if (typeof registerEndingCallback === 'function') {
    registerEndingCallback('sect_leader_百花谷', function(endingName, npc) {
        if (endingName === '并肩' || endingName === '归谷') {
            // 恋人结局：设置道侣标记
            if (npc && typeof npc.setFlag === 'function') npc.setFlag('dao_companion');
            if (window.showMessage) window.showMessage('🌸 你与温蘅结为道侣！医术感悟大幅提升', 'success');
        } else if (endingName === '知己' || endingName === '药庐') {
            // 挚友结局：信任大幅提升
            if (npc && npc.relationship) npc.relationship.trust = Math.min(100, (npc.relationship.trust || 0) + 30);
            if (window.showMessage) window.showMessage('🌸 你与温蘅成为了彼此最信任的人', 'success');
        }
    });
}

// ============ v12.3 自动触发系统（世界驱动而非菜单驱动） ============
// 触发源：
//   'greet' - 玩家与温蘅互动问候时（主要途径）
//   'sect'  - 玩家进入百花谷山门/内院时
//   'daily' - 新的一天开始且玩家在百花谷时（兜底）
function inHourRange(hour, range) {
    if (!range || range.length !== 2) return true;
    var a = range[0], b = range[1];
    if (a <= b) return hour >= a && hour < b;
    return hour >= a || hour < b; // 跨午夜区间
}

/**
 * 通用个人事件自动触发（v12.3.1 从百花谷专用泛化，绯泪线复用）
 * @param {string} npcId 目标NPC（如 'sect_leader_百花谷' / 'sect_leader_修罗宫'）
 * @param {string} source 触发源：'greet' | 'sect' | 'daily'
 * @param {object} [opts] opts.finalEvents: 终章事件ID数组——任一完成后停止自动弹出
 */
function maybeAutoTriggerPersonalEvent(npcId, source, opts) {
    opts = opts || {};
    if (!window.npcManager || !window.currentCharData) return false;
    if (typeof NPC_PERSONAL_EVENTS === 'undefined') return false;
    var npc = window.npcManager.getNPC ? window.npcManager.getNPC(npcId) : null;
    if (!npc) return false;
    // v18.8：自动触发与手动触发共用同一资格门禁，游客/异派/未见面均不可进入私人线。
    var gateProbe = null;
    for (var gk in NPC_PERSONAL_EVENTS) {
        if (NPC_PERSONAL_EVENTS[gk] && NPC_PERSONAL_EVENTS[gk].npcId === npcId) { gateProbe = NPC_PERSONAL_EVENTS[gk]; break; }
    }
    if (gateProbe && typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(gateProbe, npc)) return false;
    // 终章之后不再自动弹出
    var finalEvents = opts.finalEvents || [];
    for (var fe = 0; fe < finalEvents.length; fe++) {
        if (typeof hasEventTriggered === 'function' && hasEventTriggered(finalEvents[fe])) return false;
    }

    var affection = npc.relationship?.affection || 0;
    var rawHour = window.timeSystem && window.timeSystem.gameTime ? window.timeSystem.gameTime.currentHour : null;
    var hour = (rawHour === null || rawHour === undefined) ? 12 : Number(rawHour);
    var playerLoc = window.currentCharData.location || '';

    var candidates = [];
    for (var key in NPC_PERSONAL_EVENTS) {
        var ev = NPC_PERSONAL_EVENTS[key];
        if (!ev || ev.npcId !== npcId) continue;
        if (!ev.autoTrigger) continue; // 仅标记 autoTrigger 的事件参与自动弹出
        if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npc)) continue;
        if (hasEventTriggered(ev.id)) continue;
        if (typeof isChainHead === 'function' && !isChainHead(ev)) continue; // 链式顺序
        if (affection < (ev.minAffection || 0)) continue;
        if (typeof checkEventTrigger === 'function' && !checkEventTrigger(ev, window.currentCharData)) continue;

        var t = ev.autoTrigger;
        // 时空校验：让事件长在世界里
        if (t.timeRange && !inHourRange(hour, t.timeRange)) continue;
        if (t.location && source !== 'greet' && playerLoc !== t.location) continue;
        candidates.push(ev);
    }
    if (candidates.length === 0) return false;

    // 随机取一个候选事件，按概率决定是否弹出；每次检查最多弹1个
    var ev = candidates[Math.floor(Math.random() * candidates.length)];
    var chance = ev.autoTrigger.random || 0.5;
    if (source === 'daily') chance = chance * 0.4; // 每日兜底概率降低
    if (Math.random() >= chance) return false;

    // 延迟弹出，模拟"她叫住了你"
    setTimeout(function() {
        if (document.querySelector('.personal-event-modal')) return; // 已有事件面板则跳过
        // 1.2秒内玩家可能已离开门派/叛门，弹出前再次校验。
        if (typeof canPlayerAccessPersonalEvent === 'function' && !canPlayerAccessPersonalEvent(ev, npc)) return;
        if (typeof triggerPersonalEvent === 'function') triggerPersonalEvent(ev.id);
    }, 1200);
    return true;
}

/** 百花谷兼容包装（旧调用点不变） */
function maybeAutoTriggerBaihuaEvent(source) {
    return maybeAutoTriggerPersonalEvent('sect_leader_百花谷', source, { finalEvents: ['bh_event_014'] });
}
/** 绯泪包装：终章 xl_event_033 后停止 */
function maybeAutoTriggerFeiLeiEvent(source) {
    return maybeAutoTriggerPersonalEvent('sect_leader_修罗宫', source, { finalEvents: ['xl_event_033'] });
}

// ============ 每日钩子（兜底触发源） ============
if (typeof window !== 'undefined' && window.timeSystem && window.timeSystem.onNewDaySubscribe) {
    window.timeSystem.onNewDaySubscribe(function() {
        try {
            if (window.currentCharData && window.currentCharData.location === '百花谷') {
                maybeAutoTriggerBaihuaEvent('daily');
            }
            if (window.currentCharData && window.currentCharData.location === '修罗宫') {
                maybeAutoTriggerFeiLeiEvent('daily');
            }
        } catch (e) { console.warn('[感情线] 每日自动触发失败:', e); }
    });
}

// ============ 导出 ============
if (typeof window !== 'undefined') {
    window.BAIHUA_ENDINGS = BAIHUA_ENDINGS;
    window.maybeAutoTriggerBaihuaEvent = maybeAutoTriggerBaihuaEvent;
    window.maybeAutoTriggerPersonalEvent = maybeAutoTriggerPersonalEvent;
    window.maybeAutoTriggerFeiLeiEvent = maybeAutoTriggerFeiLeiEvent;
}
console.log('[温蘅线] 百花谷感情线加载完成：结局 ' + Object.keys(BAIHUA_ENDINGS).length + ' 个 + 自动触发系统');
