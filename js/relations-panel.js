// ==================== 人脉关系面板渲染（v2.0 优化版） ====================
var RELATIONS_PAGE_SIZE = 12;
var RELATIONS_CURRENT_PAGE = 1;
var RELATIONS_SEARCH_QUERY = '';
var RELATIONS_FILTER_MODE = 'all';
var RELATIONS_ACTIVE_FILTERS = {};
// 上一轮渲染后过滤/排序实剩多少人。翻页上下界原来按「全部已结识 NPC」算——
// 一旦下拉排序或筛选标签收窄了名单，页码会多出一截空页，点「下一页」画面纹丝不动。
var RELATIONS_FILTERED_COUNT = 0;

// 排序下拉的白名单——html 上 <select id="relations-filter"> 的五个取值。
// 下拉此前 onchange 只写 renderRelationsPanel()，选择从没落进 RELATIONS_FILTER_MODE，
// 于是下面 25 行排序分支永远走不到（'high'/'low'/'sect'/'location' 四支是死支）。
var RELATIONS_FILTER_MODES = ['all', 'high', 'low', 'sect', 'location'];

// 下拉当前取值 → 写入 RELATIONS_FILTER_MODE 并重画。
// 不在内白名单里的值一律当 'all'，并同步把 select 的显示值拨回 'all'，不让面板与下拉各说各话。
function setRelationsFilterMode(mode) {
    var m = RELATIONS_FILTER_MODES.indexOf(mode) >= 0 ? mode : 'all';
    RELATIONS_FILTER_MODE = m;
    RELATIONS_CURRENT_PAGE = 1;                    // 换档必须回第一页：旧页码在新排序下多半越界
    if (typeof document !== 'undefined') {
        var sel = document.getElementById('relations-filter');
        if (sel && sel.value !== m) sel.value = m;
    }
    renderRelationsPanel();
}

// 面板每次重画都把下拉拨回当前档——开关面板、翻页、点筛选标签之后，
// select 上还留着上一次手选的值而 RELATIONS_FILTER_MODE 已经变了，是另一种「两套排序」打架。
function syncRelationsFilterSelect() {
    if (typeof document === 'undefined') return;
    var sel = document.getElementById('relations-filter');
    if (sel && sel.value !== RELATIONS_FILTER_MODE) sel.value = RELATIONS_FILTER_MODE;
}

// 人脉卡片上那一个关系判词。
// 此前面板自带一套只看 affection 的七档（挚爱/知己/朋友/熟人/陌生人/厌恶/仇人），
// 同一张卡上又并排印 getRelationshipStatus 的判词（至交/死敌/路人/…）——
// 两套阶梯边界不同步，affection=-55、respect=0 的人会同时被印成「路人」和「仇人」。
// 判词只留一份、只认游戏判定用的 getRelationshipStatus，玩家看到的和系统算的是同一件事；
// 没有该方法的裸 NPC 对象（老存档里手搓的）才退回旧七档。
function getPanelRelationTier(npc, aff) {
    if (npc && typeof npc.getRelationshipStatus === 'function') {
        try {
            var st = npc.getRelationshipStatus();
            if (st && st.name) return { name: st.name, color: st.color || 'text-gray-400', judged: true };
        } catch (e) {
            console.warn('[静默失败] js/relations-panel.js:getPanelRelationTier · 关系判词读不出来，卡片退回旧七档好感分档', e && e.message);
        }
    }
    var a = aff || 0;
    if (a >= 80) return { name: '挚爱', color: 'text-red-400', judged: false };
    if (a >= 60) return { name: '知己', color: 'text-purple-400', judged: false };
    if (a >= 40) return { name: '朋友', color: 'text-green-400', judged: false };
    if (a >= 20) return { name: '熟人', color: 'text-blue-400', judged: false };
    if (a >= -20) return { name: '陌生人', color: 'text-gray-400', judged: false };
    if (a >= -50) return { name: '厌恶', color: 'text-orange-400', judged: false };
    return { name: '仇人', color: 'text-red-600', judged: false };
}

// ==================== v20.85 吃醋铃铛（J2）＋ 触发留痕（J6） ====================
// 用户原话：「爱情事件实在太多，可以想办法跳过或快速一览，好更好地体验吃醋事件」——
// 吃醋不是不好看，是抢不到弹窗位、也没有入口。本节把两件事补上：
//   J2 每位女主角行内一枚「她在等你」铃铛，让吃醋有主动入口；
//   J6 一行当日留痕，写清「今日 0 次触发：因弹窗占用」——玩家看得见原因，才不必猜。
//
// ★硬约束（禁止设计.md 第 2 条）：条件不满足时**不许整格隐藏**。铃铛一律画出来，
//   亮着就写清差哪一条，锁着就把全部原因逐条列出（不短路，全汇总）。

function relationsEsc(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function relationsHeroineEntry(npcId) {
    var roster = window.HEROINE_ROSTER || [];
    for (var i = 0; i < roster.length; i++) {
        if (roster[i] && roster[i].id === npcId) return roster[i];
    }
    return null;
}

// ==================== 已开的路 / 私人线：常驻可见（不靠点开 <details>） ====================
// 为什么在关系面板再画一遍：对话里的「已开的路」在 `<details>` 里，折起时看不见；
// 而 pe_open_* 旗标过去只写旗不落字（npc-personal-events.js 的「启途接线」读侧），
// 玩家看一份存档只看见数字，看不见自己开过哪条路、约的原话是什么。
// 人脉面板每张卡是常驻的：旗开过的路在这里一眼可见，卡片本身也常显示，可点进对话去兑现。
//
// ★纪律（禁止设计.md 第 2 条）：这里两段都「有就画、锁就亮锁 + 写清差哪一条」，
//   绝不因为条件不够就把整行/整卡藏起来。

// 这个人身上开过的路（旗在 NPC 关系旗上，原话在 eventFlags 注账里，都随存档走）
function relationsOpenRoutes(npc) {
    if (!npc || typeof window.openRoutesOf !== 'function') return null;
    var routes;
    try { routes = window.openRoutesOf(npc) || []; } catch (eRoutes) { return null; }
    if (!routes.length) return null;
    var walked = 0;
    try {
        walked = Number(typeof window.openRouteCount === 'function' ? window.openRouteCount(npc) : 0) || 0;
    } catch (eCount) { walked = 0; }
    var items = [];
    for (var i = 0; i < routes.length; i++) {
        var v = routes[i];
        var say = '';
        try {
            say = (typeof window.openRouteLabel === 'function') ? (window.openRouteLabel(npc, v) || '') : '';
        } catch (eLabel) { say = ''; }
        items.push({ value: v, label: say });
    }
    return { list: items, walked: walked };
}

function relationsOpenRoutesHtml(npc) {
    var r = relationsOpenRoutes(npc);
    if (!r) return '';
    var lines = '';
    for (var i = 0; i < r.list.length; i++) {
        var it = r.list[i];
        lines += '<p class="text-xs text-sky-200/80 leading-snug">· ' + relationsEsc(it.value)
            + (it.label ? '：「' + relationsEsc(it.label) + '」' : '（约的原话未存档）') + '</p>';
    }
    return '<div class="open-routes rounded px-2 py-1 border border-sky-800/60 bg-sky-950/30 mt-1.5"'
        + ' data-open-routes="' + r.list.length + '" data-open-routes-walked="' + r.walked + '"'
        + ' title="启途旗标（pe_open_*）：这些是你在这条关系上已经立下的约，读档后仍在">'
        + '<p class="text-xs font-bold text-sky-300">🧭 已开的路（' + r.list.length + ' 条 · 共走过 ' + r.walked + ' 回）</p>'
        + lines + '</div>';
}

// 这条私人线此刻的状态：共几桩、了了几桩、此刻能谈几桩、差哪一条
function relationsPrivateLine(npc) {
    var pool = window.NPC_PERSONAL_EVENTS;
    if (!npc || !pool || typeof pool !== 'object' || typeof npc.id !== 'string') return null;
    var id = npc.id;
    var aff = (npc.relationship && npc.relationship.affection) || 0;
    var met = !!(npc.memory && (npc.memory.firstMet === true || (npc.memory.meetCount || 0) > 0));
    var homeSect = id.indexOf('sect_leader_') === 0 ? id.slice('sect_leader_'.length) : '';
    var loc = String((window.currentCharData && window.currentCharData.location) || '');
    var locKey = loc.replace(/\s+/g, '');
    var atHome = !homeSect || locKey === homeSect.replace(/\s+/g, '');

    var total = 0, done = 0, ready = 0, nextAff = null;
    var hasTrig = typeof window.hasEventTriggered === 'function';
    var canReady = hasTrig && typeof window.isEventReadyNow === 'function';
    // 结构闸（结识 / 人在其门内）先判：这两条不过时 isEventReadyNow 必然全灭，
    // 跑一遍全池只是白费力气（isChainHead 每次都要扫全池）。
    var scanReady = canReady && met && atHome;
    for (var k in pool) {
        var ev = pool[k];
        if (!ev || ev.npcId !== id) continue;
        total++;
        var trig = hasTrig ? window.hasEventTriggered(ev.id) : false;
        if (trig && !ev.ambient) done++;
        if (!trig) {
            var need = Number(ev.minAffection) || 0;
            if (nextAff === null || need < nextAff) nextAff = need;
            if (scanReady && window.isEventReadyNow(npc, ev, aff)) ready++;
        }
    }
    if (total === 0) return null;
    var finished = typeof window.isPersonalLineFinished === 'function' ? !!window.isPersonalLineFinished(id) : false;

    // 锁着也要写清为什么锁：原因不短路，逐条汇总（禁止设计.md 第 2 条）
    var reasons = [];
    if (!met) reasons.push('尚未结识');
    else if (!atHome) reasons.push('需亲至「' + homeSect + '」');
    else if (nextAff !== null && aff < nextAff) reasons.push('好感≥' + nextAff + '（当前 ' + aff + '）');
    else if (finished) reasons.push('主线已走到终章（余韵留白）');
    else reasons.push('差的是某一条桩的条件（情缘/同行/前情等），面板里逐条 🔒 有写明');
    return { total: total, done: done, ready: ready, nextAff: nextAff, aff: aff, met: met, atHome: atHome, finished: finished, reasons: reasons };
}

function relationsPrivateLineHtml(npc) {
    var p = relationsPrivateLine(npc);
    if (!p) return '';
    var lit = p.ready > 0;
    var body;
    if (p.finished && !lit) body = '🔒 主线已走到终章（余韵留白）';
    else if (lit) body = '此刻可谈 ' + p.ready + ' 桩（在对话面板里点）';
    else body = '🔒 此刻无桩可谈 · ' + p.reasons.join('、');
    return '<div class="private-line rounded px-2 py-1 border mt-1.5 '
        + (lit ? 'border-green-700 bg-green-900/25' : 'border-gray-700 bg-gray-900/40') + '"'
        + ' data-private-total="' + p.total + '" data-private-done="' + p.done + '" data-private-ready="' + p.ready + '"'
        + ' title="这条关系上的私人线：共 ' + p.total + ' 桩，已了 ' + p.done + ' 桩">'
        + '<p class="text-xs font-bold ' + (lit ? 'text-green-300' : 'text-gray-400') + '">📜 私人线 ' + p.done + '/' + p.total + ' 桩已了</p>'
        + '<p class="text-xs leading-snug opacity-80">' + relationsEsc(body) + '</p>'
        + '</div>';
}

// 这一格该不该亮铃铛，以及差哪一条。三条点亮条件全部满足才亮：
//   _detect(h.id) 为真（世上真有另一位）／ aff ≥ 门槛 ／ 未对峙过（已对峙则改看和好）
// 返回 null 表示此人不在 HEROINE_ROSTER 上（非女主角），这一格不画铃铛——整行照旧显示。
function relationsJealousyBell(npc) {
    var h = relationsHeroineEntry(npc && npc.id);
    if (!h) return null;
    var aff = (npc.relationship && npc.relationship.affection) || 0;
    var met = !!(npc.memory && (npc.memory.firstMet === true || (npc.memory.meetCount || 0) > 0));
    var rival = (typeof window.detectRivalRomance === 'function') ? window.detectRivalRomance(h.id) : null;
    var hasTrig = (typeof window.hasEventTriggered === 'function') ? window.hasEventTriggered : null;
    var doneRival = !!(hasTrig && hasTrig(h.eventId));
    var doneReconcile = !h.reconcileId || !!(hasTrig && hasTrig(h.reconcileId));

    var goal = null, goalAff = 45, goalLabel = '对峙';
    if (!doneRival) { goal = h.eventId; goalAff = 45; goalLabel = '对峙'; }
    else if (h.reconcileId && !doneReconcile) { goal = h.reconcileId; goalAff = 55; goalLabel = '和好'; }

    // 原因不短路，逐条汇总（禁止设计.md 第 2 条）
    var reasons = [];
    if (!met) reasons.push('尚未结识');
    if (!rival) reasons.push('需先与另一位缔结情缘');
    if (aff < goalAff) reasons.push(goalLabel + '需好感≥' + goalAff + '（当前 ' + aff + '）');
    if (!goal) reasons.push('已对峙过（一次性）');

    var loc = (window.currentCharData && window.currentCharData.location) || '';
    var atSect = (h.sect === loc);
    if (goal && !atSect) reasons.push('需亲至「' + h.sect + '」（你现下在「' + (loc || '别处') + '」）');

    var ready = !!(goal && met && rival && aff >= goalAff);
    var state = ready ? (atSect ? 'lit' : 'waiting') : 'locked';
    return { h: h, state: state, goal: goal, goalLabel: goalLabel, rival: rival, aff: aff, atSect: atSect, reasons: reasons };
}

function relationsJealousyBellHtml(npc) {
    var b = relationsJealousyBell(npc);
    if (!b) return '';
    var icon = b.state === 'locked' ? '🔒' : '🔔';
    var tone = b.state === 'lit'
        ? 'border-yellow-600 bg-yellow-900/30 cursor-pointer hover:bg-yellow-900/50'
        : (b.state === 'waiting' ? 'border-amber-700 bg-amber-900/20' : 'border-gray-700 bg-gray-900/40');
    var head = b.state === 'lit'
        ? '她在等你 · 点她'
        : (b.state === 'waiting' ? '她在等你 · ' + b.h.sect : '锁着 · ' + b.goalLabel);
    var onclick = (b.state === 'lit')
        ? 'onclick="event.stopPropagation(); window.ringJealousyBell(\'' + relationsEsc(b.h.id) + '\');"'
        : 'onclick="event.stopPropagation();"';
    var body = b.reasons.length
        ? relationsEsc(b.reasons.join('、'))
        : ('她就在「' + relationsEsc(b.h.sect) + '」· 现在可以叫住她');
    return '<div class="jealousy-bell rounded px-2 py-1 border mt-1.5 ' + tone + '"'
        + ' data-jeal-state="' + b.state + '"'
        + ' data-jeal-npc="' + relationsEsc(b.h.id) + '"'
        + ' data-jeal-reasons="' + relationsEsc(b.reasons.join('|')) + '"'
        + ' title="' + relationsEsc((b.h.name || '') + '：' + b.reasons.join('、')) + '"'
        + ' ' + onclick + '>'
        + '<span class="text-xs font-bold">' + icon + ' ' + relationsEsc(head) + '</span>'
        + '<br><span class="text-xs leading-snug opacity-80">' + body + '</span>'
        + '</div>';
}

// 点铃铛：立刻叫住她。锁着的时候不弹，只返回原因——不许「按了没反应」。
function ringJealousyBell(npcId) {
    var h = relationsHeroineEntry(npcId);
    if (!h) return 'no-entry';
    var npc = (window.npcManager && window.npcManager.getNPC) ? window.npcManager.getNPC(npcId) : null;
    if (!npc) return 'no-npc';
    var b = relationsJealousyBell(npc);
    if (!b || b.state !== 'lit') return 'locked';
    if (typeof window.__jealRequestSeat !== 'function') return 'no-queue';
    var r = window.__jealRequestSeat(b.goal, npcId, h.name || '');
    renderRelationsPanel();   // 立刻反映：计入当日留痕，铃铛转态
    return r;
}

// J6：今日留痕。玩家看不见触发原因，就会以为「今天什么都没发生」——这一行就是给那个疑问的答案。
function relationsJealousyFooterHtml() {
    if (typeof window.__jealTodayReport !== 'function') return '';
    var rep;
    try { rep = window.__jealTodayReport(); } catch (e) { return ''; }
    if (!rep) return '';
    var head;
    if (rep.fired > 0) {
        head = '今日已叫住 ' + rep.fired + ' 次';
    } else if ((rep.pending && rep.pending.length) || rep.queued > 0) {
        head = '今日 0 次触发：因弹窗占用（已排队 ' + ((rep.pending && rep.pending.length) || rep.queued) + ' 桩，关掉那扇弹窗就补弹）';
    } else {
        head = '今日 0 次触发（无人在等你）';
    }
    var lines = [head];
    if (rep.pending && rep.pending.length) {
        lines.push('等空位：' + rep.pending.map(function (j) { return j.name || j.evId; }).join('、'));
    }
    if (rep.waiting && rep.waiting.length) {
        lines.push('在等你上门：' + rep.waiting.map(function (w) { return w.name + '（' + w.sect + '）'; }).join('、'));
    }
    if (rep.dropped) lines.push('今日落空 ' + rep.dropped + ' 桩（门禁未过／已对峙过）');
    return '<div class="jealousy-report rounded px-2 py-1.5 border border-gray-700 bg-gray-900/50 mt-2 mb-2" data-jeal-report="' + relationsEsc(rep.day) + '">'
        + '<p class="text-xs font-bold text-gray-300">🔎 谁把谁放在心上</p>'
        + lines.map(function (t) { return '<p class="text-xs text-gray-500 mt-0.5">' + relationsEsc(t) + '</p>'; }).join('')
        + '</div>';
}

function renderRelationsPanel() {
    const container = document.getElementById('relations-npc-list');
    const countDisplay = document.getElementById('relations-count');
    if (!container) return;
    syncRelationsFilterSelect();
    // v20.85 J3：L1 此前是「一天只试一次，只在跨日那一刻」——可 `_detect` 的真伪在日间是会变的
    // （你上午才与另一位定情，跨日扫描时世上还没有情敌）。玩家一打开关系面板就是一次重新点名，
    // 于是「换了个门派当天只能吃一次醋」不再是死规矩。同一人同一事件不会重复报名
    // （见 heroine-rivalry.js 的 JEAL_SCHEDULED / JEAL_TODAY_FIRED 两道闸）。
    try { if (typeof window.__jealScanRivalry === 'function') window.__jealScanRivalry('panel'); } catch (e) {}

    // 获取所有已结识的NPC（firstMet === true 或 meetCount > 0）
    var allNPCs = [];
    if (window.npcManager && typeof window.npcManager.getAllNPCs === 'function') {
        var rawList = window.npcManager.getAllNPCs();
        for (var i = 0; i < rawList.length; i++) {
            var npc = rawList[i];
            if (npc.memory && (npc.memory.firstMet === true || (npc.memory.meetCount || 0) > 0)) {
                allNPCs.push(npc);
            }
        }
    }

    // 搜索过滤
    if (RELATIONS_SEARCH_QUERY) {
        var q = RELATIONS_SEARCH_QUERY.toLowerCase().trim();
        allNPCs = allNPCs.filter(function(npc) {
            return npc.name.toLowerCase().indexOf(q) >= 0
                || (npc.occupation || '').toLowerCase().indexOf(q) >= 0
                || (npc.location || '').toLowerCase().indexOf(q) >= 0;
        });
    }

    // 快速筛选标签
    var activeFilter = RELATIONS_ACTIVE_FILTERS;
    if (activeFilter.sameLocation) {
        var playerLoc = window.currentCharData?.location || '';
        // DES-57：城名两串写法（舆图「帝都 · 长安」／NPC 账「帝都·长安」），认账前去空白
        var locKey = String(playerLoc || '').replace(/\s+/g, '');
        if (locKey) {
            allNPCs = allNPCs.filter(function (npc) { return String(npc.location || '').replace(/\s+/g, '') === locKey; });
        }
    }
    if (activeFilter.canInteract) {
        allNPCs = allNPCs.filter(function(npc) {
            return npc.state && npc.state.mood >= 20; // 情绪不愤怒即可互动
        });
    }
    if (activeFilter.hasNewEvents) {
        allNPCs = allNPCs.filter(function(npc) {
            var id = npc.id;
            // 检查是否有未触发的个人事件
            if (typeof window.NPC_PERSONAL_EVENTS !== 'object') return false;
            // v22.0「似有心事」：沉浸模式下事件清单不罗列，这枚筛选是玩家唯一的线索入口——
            // 只标「此刻就绪、一谈就会发生」的人（与交谈拦截同一套门禁），
            // 不再把远在天边的锁定事件也算成有心事。旧口径留作无门禁函数环境的兜底。
            if (typeof window.isEventReadyNow === 'function') {
                if (typeof window.isPersonalLineFinished === 'function' && window.isPersonalLineFinished(id)) return false;
                var affReady = (npc.relationship && npc.relationship.affection) || 0;
                for (var rkey in window.NPC_PERSONAL_EVENTS) {
                    var rev = window.NPC_PERSONAL_EVENTS[rkey];
                    if (rev.npcId === id && window.isEventReadyNow(npc, rev, affReady)) return true;
                }
                return false;
            }
            for (var key in window.NPC_PERSONAL_EVENTS) {
                var ev = window.NPC_PERSONAL_EVENTS[key];
                if (ev.npcId === id && !window.hasEventTriggered(ev.id)) return true;
            }
            return false;
        });
    }
    if (activeFilter.hasRequests) {
        allNPCs = allNPCs.filter(function(npc) {
            return npc.relationship && npc.relationship.affection >= 20;
        });
    }
    if (activeFilter.isCompanion) {
        allNPCs = allNPCs.filter(function(npc) {
            return npc.isInParty || npc.isFollowing;
        });
    }
    if (activeFilter.specialRelation) {
        allNPCs = allNPCs.filter(function(npc) {
            var aff = npc.relationship?.affection || 0;
            return aff >= 60 || aff <= -50; // 知己以上或仇人
        });
    }
    // v20.2 情缘筛选：仅显示四位女主角（无论当前好感，便于追踪吃醋/和好状态）
    if (activeFilter.isRomance) {
        var roster = (window.HEROINE_ROSTER || []).map(function(h){ return h.id; });
        allNPCs = allNPCs.filter(function(npc) { return roster.indexOf(npc.id) >= 0; });
    }

    // 排序
    const filterMode = RELATIONS_FILTER_MODE;
    if (filterMode === 'high') {
        allNPCs.sort(function(a, b) {
            return (b.relationship?.affection || 0) - (a.relationship?.affection || 0);
        });
    } else if (filterMode === 'low') {
        allNPCs.sort(function(a, b) {
            return (a.relationship?.affection || 0) - (b.relationship?.affection || 0);
        });
    } else if (filterMode === 'sect') {
        allNPCs.sort(function(a, b) {
            var sectA = getNPCSect(a);
            var sectB = getNPCSect(b);
            if (sectA < sectB) return -1;
            if (sectA > sectB) return 1;
            return 0;
        });
    } else if (filterMode === 'location') {
        allNPCs.sort(function(a, b) {
            var locA = a.location || '';
            var locB = b.location || '';
            if (locA < locB) return -1;
            if (locA > locB) return 1;
            return 0;
        });
    }

    // 更新计数
    if (countDisplay) {
        countDisplay.textContent = '共 ' + allNPCs.length + ' 人';
    }

    // 分页
    var totalPages = Math.max(1, Math.ceil(allNPCs.length / RELATIONS_PAGE_SIZE));
    if (RELATIONS_CURRENT_PAGE > totalPages) RELATIONS_CURRENT_PAGE = totalPages;
    var startIdx = (RELATIONS_CURRENT_PAGE - 1) * RELATIONS_PAGE_SIZE;
    var pageNPCs = allNPCs.slice(startIdx, startIdx + RELATIONS_PAGE_SIZE);
    // 过滤/排序之后真正剩多少人——翻页的上下界必须按这个算（见 changeRelationsPage）
    RELATIONS_FILTERED_COUNT = allNPCs.length;

    // 无NPC时显示占位
    if (allNPCs.length === 0) {
        // ★J6：留痕照样上屏。名单空只说明一个都没结识，不说明「今天为什么没吃醋」——
        //   把这一行吞掉，玩家打开关系面板只会看到「暂无结识之人」，那正是本节要治的困惑。
        container.innerHTML = relationsJealousyFooterHtml() +
            '<div class="flex justify-between items-center bg-gray-800 p-3 rounded">' +
            '<div class="flex items-center gap-3">' +
                '<span class="text-2xl">👤</span>' +
                '<div>' +
                    '<p class="font-bold text-gray-200">暂无结识之人</p>' +
                    '<p class="text-xs text-gray-500">游历四方，结识天下英豪</p>' +
                '</div>' +
            '</div>' +
        '</div>';
        return;
    }

    var html = relationsJealousyFooterHtml();   // J6：先给今日留痕，再列人
    for (var i = 0; i < pageNPCs.length; i++) {
        var npc = pageNPCs[i];
        var aff = npc.relationship?.affection || 0;
        
        var respect = npc.relationship?.respect || 0;
        var favor = npc.relationship?.favor || 0;
        var loc = npc.location || '未知';
        var occupation = npc.occupation || '未知';
        var icon = npc.appearance?.icon || '👤';
        var mood = npc.state?.mood ?? 50;
        var npcSect = getNPCSect(npc);

        // 关系判词：只此一份，取自 getRelationshipStatus（见 getPanelRelationTier 的理由）
        var relTier = getPanelRelationTier(npc, aff);

        // 心情图标
        var moodIcon = '😐';
        if (mood >= 80) moodIcon = '😄';
        else if (mood >= 60) moodIcon = '🙂';
        else if (mood >= 40) moodIcon = '😐';
        else if (mood >= 20) moodIcon = '😞';
        else moodIcon = '😡';

        // 门派标签
        var sectTag = npcSect !== '散修' ? '<span class="text-xs text-gray-600">🏛️ ' + npcSect + '</span>' : '';

        // 点击事件
        var safeId = npc.id.replace(/'/g, "\\'");

        // 简化卡片：只显示 姓名/身份/地点/关系/状态
        html += '<div class="bg-gray-800 p-2.5 rounded hover:bg-gray-750 transition cursor-pointer" onclick="window.showNPCDialog && window.showNPCDialog(\'' + safeId + '\')">' +
            '<div class="flex items-center justify-between">' +
                '<div class="flex items-center gap-2 min-w-0 flex-1">' +
                    '<span class="text-xl flex-shrink-0">' + icon + '</span>' +
                    '<div class="min-w-0">' +
                        '<p class="font-bold text-gray-200 text-sm truncate">' + npc.name + '</p>' +
                        '<p class="text-xs text-gray-500 truncate">' + occupation + ' · 📍' + loc + ' ' + sectTag + '</p>' +
                    '</div>' +
                '</div>' +
                '<div class="flex items-center gap-2 flex-shrink-0 ml-2">' +
                    '<span class="text-xs ' + relTier.color + ' font-bold" data-rel-tier="' + (relTier.judged ? 'judged' : 'fallback') + '">' + relTier.name + '</span>' +
                    '<span class="text-xs">' + moodIcon + '</span>' +
                '</div>' +
            '</div>' +
            '<div class="flex gap-3 text-xs text-gray-500 mt-1">' +
                '<span>💗' + aff + '</span>' +
                
                '<span>敬重' + respect + '</span>' +
                '<span>💝' + favor + '</span>' +
            '</div>' +
            relationsOpenRoutesHtml(npc) +          // 已开的路：旗标落成看得见的字（常驻，不折起）
            relationsPrivateLineHtml(npc) +         // 私人线进度 + 此刻能不能谈、差哪一条
            relationsJealousyBellHtml(npc) +   // J2：名册上的女主角行内挂铃铛；锁着也画，附原因（整行绝不隐藏）
        '</div>';
    }

    // 分页控件
    if (totalPages > 1) {
        var prevDisabled = RELATIONS_CURRENT_PAGE <= 1 ? 'opacity-50 pointer-events-none' : '';
        var nextDisabled = RELATIONS_CURRENT_PAGE >= totalPages ? 'opacity-50 pointer-events-none' : '';
        html += '<div class="flex justify-center items-center gap-4 pt-3">' +
            '<button class="text-sm bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded ' + prevDisabled + '" onclick="changeRelationsPage(' + (RELATIONS_CURRENT_PAGE - 1) + ')">上一页</button>' +
            '<span class="text-xs text-gray-400">' + RELATIONS_CURRENT_PAGE + ' / ' + totalPages + '</span>' +
            '<button class="text-sm bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded ' + nextDisabled + '" onclick="changeRelationsPage(' + (RELATIONS_CURRENT_PAGE + 1) + ')">下一页</button>' +
        '</div>';
    }

    container.innerHTML = html;
}

// 获取NPC所属门派
function getNPCSect(npc) {
    if (!npc) return '散修';
    var id = npc.id || '';
    var knownSects = ['少林', '武当', '峨眉', '华山', '昆仑', '崆峒', '天山', '逍遥', '唐门', '丐帮', '点苍', '衡山', '泰山', '嵩山', '恒山', '全真', '古墓', '明教', '星宿', '日月', '桃花', '绝情', '灵鹫', '铁掌', '少林寺', '青云门', '修罗宫', '百花谷', '星辰阁', '天机阁', '大隐阁', '天书阁', '万宝阁', '剑阁'];
    for (var i = 0; i < knownSects.length; i++) {
        if (id.indexOf(knownSects[i]) >= 0) {
            return knownSects[i];
        }
    }
    if (npc.background && npc.background.origin) {
        var origin = npc.background.origin;
        for (var j = 0; j < knownSects.length; j++) {
            if (origin.indexOf(knownSects[j]) >= 0) {
                return knownSects[j];
            }
        }
    }
    if (npc.location) {
        var loc = npc.location;
        for (var k = 0; k < knownSects.length; k++) {
            if (loc.indexOf(knownSects[k]) >= 0) {
                return knownSects[k];
            }
        }
    }
    return '散修';
}

// 翻页
function changeRelationsPage(page) {
    var totalPages = Math.max(1, Math.ceil(RELATIONS_FILTERED_COUNT / RELATIONS_PAGE_SIZE));
    if (page < 1 || page > totalPages) return;
    RELATIONS_CURRENT_PAGE = page;
    renderRelationsPanel();
}

// 搜索输入
function onRelationsSearch(query) {
    RELATIONS_SEARCH_QUERY = query || '';
    RELATIONS_CURRENT_PAGE = 1;
    renderRelationsPanel();
}

// 切换筛选标签
function toggleRelationsFilter(filterKey) {
    if (RELATIONS_ACTIVE_FILTERS[filterKey]) {
        delete RELATIONS_ACTIVE_FILTERS[filterKey];
    } else {
        RELATIONS_ACTIVE_FILTERS[filterKey] = true;
    }
    RELATIONS_CURRENT_PAGE = 1;
    renderRelationsPanel();
    // 更新按钮状态
    updateFilterButtons();
}

function updateFilterButtons() {
    document.querySelectorAll('.relations-filter-btn').forEach(function(btn) {
        var key = btn.dataset.filterKey;
        if (key && RELATIONS_ACTIVE_FILTERS[key]) {
            btn.classList.add('bg-blue-700', 'border-blue-500', 'text-white');
            btn.classList.remove('bg-gray-700', 'border-gray-600', 'text-gray-300');
        } else {
            btn.classList.remove('bg-blue-700', 'border-blue-500', 'text-white');
            btn.classList.add('bg-gray-700', 'border-gray-600', 'text-gray-300');
        }
    });
}

// 导出
if (typeof window !== 'undefined') {
    window.renderRelationsPanel = renderRelationsPanel;
    window.setRelationsFilterMode = setRelationsFilterMode;
    window.getPanelRelationTier = getPanelRelationTier;
    window.changeRelationsPage = changeRelationsPage;
    window.onRelationsSearch = onRelationsSearch;
    window.toggleRelationsFilter = toggleRelationsFilter;
    window.getNPCSect = getNPCSect;
    // v20.85 吃醋铃铛
    window.ringJealousyBell = ringJealousyBell;
    window.relationsJealousyBell = relationsJealousyBell;
    window.relationsJealousyBellHtml = relationsJealousyBellHtml;
    window.relationsJealousyBellFooterHtml = relationsJealousyFooterHtml;
    // 已开的路 / 私人线（常驻可见段）
    window.relationsOpenRoutes = relationsOpenRoutes;
    window.relationsOpenRoutesHtml = relationsOpenRoutesHtml;
    window.relationsPrivateLine = relationsPrivateLine;
    window.relationsPrivateLineHtml = relationsPrivateLineHtml;
}