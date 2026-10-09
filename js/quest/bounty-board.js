// ==================== bounty-board.js - v20.1 江湖悬赏榜 ====================
// 对标鬼谷八荒悬赏榜/觅长生任务榜：随机刷新的高难度讨伐悬赏，奖励丰厚
// 与日常任务区分：日常固定低难度，悬赏随机刷新高难度高奖励
// 自管击杀进度（监听 enemy:defeated，杀任意敌人推进），不依赖 quest 匹配规则，低风险
// 每日刷新未接取的悬赏，保留已接取的；不存档（每日刷新合理）
// v27.13 张榜半日流程（模块⑧改良）：新增「人犯单」——case-system.js 报官簿（报官→核验半日→张榜）
//   到点才经 postPersonBounty 正门上榜，核验期榜上查无此人；赏格开榜时按城基金水位定档（bountyMul）、
//   领赏照走 claimBounty 的 payBounty 城基金正门——来源与结算链不动。人犯单不占模板三张的位，
//   对手抢单照旧（dailyBountyRefresh 同一循环），被截走回调报官簿销账。榜单本体照旧不存档，
//   posted 人犯单由报官簿（caseSystem 存档键）读档后 syncPosts 重建。
// v27.13 悬赏的后续人生（模块⑧）：人犯单也是活人——
//   ①跑路：case-system 到点经 updatePersonBounty 正门改榜文（「闻已遁往别处」走样话+新窝点；
//     遁远则石沉大海，接取作废、缉捕封死，只等同行截单销案——赏格分毫不动，赏随案走）；
//   ②护法：接了单（揭榜）的缉凶战按案犯凶悍档掷概率多一个护法敌（GUARD_P_BY_TIER；敌型走缉凶同款
//     人形 elite，不造新表）——第二仗由 case-system 收场账排（_settleCaseHunt 护法拦路），本文件只掷骰挂旗；
//   ③反咬/入册：全在 case-system 报官簿账内（两度脱身/接单不交 → 报复 + 入宿敌册），榜单只管传话。

(function () {

// 悬赏模板池（讨伐 N 只任意敌人，奖励递增）
var BOUNTY_TEMPLATES = [
    { id: 'bty_1', title: '清剿妖物', desc: '近期妖物作乱，清剿 5 只任意妖物。', count: 5, stones: 200, items: [{ itemId: 'mat_demon_beast_core', count: 2 }] },
    { id: 'bty_2', title: '荡除魔修', desc: '魔修横行，讨伐 8 只任意敌人。', count: 8, stones: 350, items: [{ itemId: 'mat_demon_beast_core', count: 3 }] },
    { id: 'bty_3', title: '扫荡妖巢', desc: '捣毁妖巢，斩杀 12 只任意敌人。', count: 12, stones: 550, items: [{ itemId: 'mat_demon_beast_core', count: 5 }] },
    { id: 'bty_4', title: '镇魔卫道', desc: '镇魔大任，斩杀 16 只任意敌人。', count: 16, stones: 800, items: [{ itemId: 'mat_chaos_stone', count: 1 }] },
    { id: 'bty_5', title: '荡平魔窟', desc: '深入魔窟，斩杀 20 只任意敌人。', count: 20, stones: 1200, items: [{ itemId: 'mat_chaos_stone', count: 2 }] }
];

var _board = null; // [{id,title,desc,count,stones,items,progress,accepted,completed,claimed,rival,rivalProgress,snatched}]

// v25.5 抢单竞争（第一百四十七批 · 玩法立项批）：旧榜每日整版重刷、悬赏永远等着你——
// 「手慢无」只是说说。现在未接取的榜上有真对手：每日按各自脚程推进猎杀，猎完就把单子抢走；
// 已接取的照旧归你（先来后到，接了对手就撤）。被抢/已领的空位随每日刷新补新单。
var RIVAL_NAMES = ['铁面客', '独臂刀娘', '赏金猎户', '青衣剑奴', '夜枭', '独行客'];
var _uidSeq = 0;
// v27.13 护法概率表（按下标=案犯凶悍档 tier 1~3 读，超出取顶）：凶悍的案犯早买好了人手，
//   等闲毛贼雇不起保镖。掷骰在 huntPerson（本文件），第二仗的排场与收场账归 case-system。
var GUARD_P_BY_TIER = [0, 0.15, 0.35, 0.55];

function _today() {
    try {
        if (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') {
            return window.timeSystem.getAbsoluteDay();
        }
    } catch (e) {}
    return 0;
}

// v21.9 悬赏奖励随境界走：此前写死 200-1200 灵石——渡劫修士杀 20 只敌人换 1200 灵石是打发叫花子。
// 倍率表与真元收益同口径（炼气×1 → 渡劫×256），按开榜时的境界定档，接取后不随突破变。
var _BOUNTY_REALM_MUL = [1, 1, 2, 4, 8, 16, 32, 64, 128, 256];
function bountyRealmMul() {
    try {
        if (typeof window.getRealmTier === 'function' && window.currentCharData) {
            var tier = window.getRealmTier(window.currentCharData.realm);
            if (typeof tier === 'number' && tier >= 0) return _BOUNTY_REALM_MUL[Math.min(9, tier)] || 1;
        }
    } catch (e) {}
    return 1;
}
window.bountyRealmMul = bountyRealmMul;

// 随机抽 3 个不同模板生成悬赏榜
function _generateOne(excludeBaseIds) {
    var mul = bountyRealmMul();
    var pool = BOUNTY_TEMPLATES.filter(function (t) { return !excludeBaseIds || excludeBaseIds.indexOf(t.id) < 0; });
    if (!pool.length) pool = BOUNTY_TEMPLATES.slice();
    var t = pool[Math.floor(Math.random() * pool.length)];
    _uidSeq += 1;
    // 真实小世界·悬赏基金（world-ledger）：赏格从城中基金出——基金水位决定折扣，
    // 见底则官府无力悬赏。赏金不再是天上掉的，是商税充的。
    var fundMul = 1, fundNote = '';
    try {
        if (window.WorldLedger && typeof window.WorldLedger.bountyMul === 'function') {
            var bm = window.WorldLedger.bountyMul();
            fundMul = bm.mul; fundNote = bm.note || '';
        }
    } catch (e) {}
    return {
        id: t.id + '_' + _today() + '_' + _uidSeq, // 每日唯一（补位单同模板同日也不撞号）
        tplId: t.id,
        title: t.title,
        desc: t.desc + (mul > 1 ? '（高阶悬赏，赏金随境界上浮）' : '') + fundNote,
        count: t.count,
        stones: Math.floor(t.stones * mul * fundMul),
        items: fundMul > 0 ? t.items : null, // 基金见底连材料补贴也停——官府是真没钱
        progress: 0,
        accepted: false,
        completed: false,
        claimed: false,
        // 竞争对手：脚程 25%~70%/日——快刀客两三日内就能把单抢走
        rival: { name: RIVAL_NAMES[Math.floor(Math.random() * RIVAL_NAMES.length)], rate: 0.25 + Math.random() * 0.45 },
        rivalProgress: 0,
        snatched: false
    };
}

function generateBountyBoard() {
    var picked = [];
    var used = [];
    for (var i = 0; i < 3; i++) {
        var b = _generateOne(used);
        used.push(b.tplId);
        picked.push(b);
    }
    _board = picked;
    return _board;
}

// v27.13：开榜前先问报官簿——到点的单子此刻才上榜（核验期查无此人）、读档后重挂丢失的人犯单
function _btyTick() {
    try {
        if (window.CaseSystem && typeof window.CaseSystem.reportTick === 'function') window.CaseSystem.reportTick();
        if (window.CaseSystem && typeof window.CaseSystem.syncPosts === 'function') window.CaseSystem.syncPosts();
    } catch (e) { console.warn('[静默失败] js/quest/bounty-board.js · _btyTick：报官簿到点账没结——榜面照旧', e && e.message); }
}

function getBountyBoard() {
    _btyTick();
    if (!_board) generateBountyBoard();
    return _board;
}

function acceptBounty(idx) {
    var b = getBountyBoard()[idx];
    if (!b || b.accepted) {
        if (window.showMessage) window.showMessage('该悬赏已接取或不存在。', 'info');
        return false;
    }
    // v25.5 抢单：对手已经猎完的单，接不了——手慢无
    if (b.snatched) {
        if (window.showMessage) window.showMessage('手慢无——「' + ((b.rival && b.rival.name) || '同行') + '」已把「' + b.title + '」抢了先。', 'warning');
        return false;
    }
    b.accepted = true;
    if (b.person) {
        // v27.13：人犯单揭榜——回写报官簿 btyAccepted（读档重建时接取态不丢）
        try {
            if (window.CaseSystem && typeof window.CaseSystem.onPersonAccepted === 'function') window.CaseSystem.onPersonAccepted(b.id);
        } catch (ePA) { console.warn('[静默失败] js/quest/bounty-board.js · acceptBounty：揭榜没回写报官簿', ePA && ePA.message); }
    }
    if (window.gameLog && window.gameLog.add) window.gameLog.add('📜 接取悬赏「' + b.title + '」：' + b.desc + '（已接的单对手即撤——先来后到）', 'info');
    if (window.showMessage) window.showMessage('已接取悬赏「' + b.title + '」。', 'success');
    // 第九十五波·NEW-05：接取成功即重绘榜单——旧版不重绘，按钮仍显示「接取」、
    // 已接的两条也不见「进度 0/N」，玩家只能关掉重开悬赏榜才看得清
    try { refreshBountyBoard(); } catch (e) {}
    return true;
}

function claimBounty(idx) {
    var b = getBountyBoard()[idx];
    if (!b || !b.completed || b.claimed) {
        if (window.showMessage) window.showMessage('该悬赏未完成或已领取。', 'info');
        return false;
    }
    var cd = window.currentCharData;
    var gotItems = [];
    var missed = 0;
    if (cd) {
        // 真实小世界·悬赏基金：发赏即从城中基金扣——钱有来处（商税充基金）。
        // 基金临时见底（同日他单先领）则按实有折付，官府言明不赊账。
        var paidStones = b.stones;
        try {
            if (window.WorldLedger && typeof window.WorldLedger.payBounty === 'function') {
                // v27.13：人犯单的赏银记案发城的基金——模板单照旧记脚下的城（结算链语义不动）
                var _bCity = b.person ? (b.city || null) : ((window.locationSystem && window.locationSystem.getCurrentLocation && window.locationSystem.getCurrentLocation()) || null);
                var pay = window.WorldLedger.payBounty(_bCity, b.stones);
                paidStones = pay.paid; // 全额=库足；不足=折付
                if (pay.paid < b.stones) {
                    if (window.gameLog && window.gameLog.add) window.gameLog.add('⚖️ 城中赏金吃紧——「' + b.title + '」按库中实有折付 ' + pay.paid + ' 灵石（官府不赊账）。', 'warning');
                }
            }
        } catch (e) {}
        if (paidStones > 0) {
            if (window.DataManager && typeof window.DataManager.addSpiritStones === 'function') window.DataManager.addSpiritStones(paidStones);
            else cd.spiritStones = (cd.spiritStones || 0) + paidStones;
        }
        var fameGain = b.person ? 2 : Math.floor(b.count / 2);   // v27.13：人犯单拿人记名气+2（模板单照旧按斩数记）
        cd.fame = Math.min((window.FAME_CAP || 99999), (cd.fame || 0) + fameGain);
        // 真实小世界·名气扩散：完成悬赏的英名从本城起随商旅外传（同步 RewardService 口径）
        try {
            if (window.WorldLedger && typeof window.WorldLedger.noteFameChange === 'function') {
                window.WorldLedger.noteFameChange(fameGain);
            }
        } catch (eWL) {}
        if (b.items && typeof window.addResultItem === 'function') {
            b.items.forEach(function (it) {
                try {
                    // DES-72 同族：addResultItem 报的是实收件数，旧写法整个丢在地上
                    var got = Number(window.addResultItem(it.itemId, it.count)) || 0;
                    if (got > 0) {
                        // v27.13：产出登记——悬赏领赏盖「reward」章（记实收件数；bounty 不走 RewardService 总闸，
                        // 故在此单独补章，章只管登记、不动领赏账）。登记失败不拦获得。
                        try {
                            if (window.ItemProvenance && typeof window.ItemProvenance.note === 'function') {
                                window.ItemProvenance.note('reward', it.itemId, got);
                            }
                        } catch (ePrv) { console.warn('[静默失败] js/quest/bounty-board.js · claimBounty：产出登记未入簿（赏物照常到手）', ePrv && ePrv.message); }
                        var nm = (window.itemById && window.itemById[it.itemId] && window.itemById[it.itemId].name) || it.itemId;
                        gotItems.push(nm + '×' + got);
                    }
                    if (got < it.count) missed += (it.count - got);
                } catch (e) {}
            });
        }
    }
    // DES-90（第一百三十九批）：账上没落笔时不许由站点断言满包（悬赏材料属机构交付，用③形，括号内不带句号）
    var itemTxt = (gotItems.length ? '，材料 ' + gotItems.join('、') : '') + (missed > 0 ? '（另 ' + missed + ' 件：' + ((typeof window.addItemReasonPhrase === 'function' && window.addItemReasonPhrase('悬赏的材料')) || '这一件没能交到你手上') + '）' : '');
    b.claimed = true;
    if (b.person) {
        // v27.13：人犯单领赏——报官簿销账（领赏即结案）
        try {
            if (window.CaseSystem && typeof window.CaseSystem.onPersonSettled === 'function') window.CaseSystem.onPersonSettled(b.id, 'claimed');
        } catch (ePS) { console.warn('[静默失败] js/quest/bounty-board.js · claimBounty：领赏没勾报官簿', ePS && ePS.message); }
    }
    if (window.gameLog && window.gameLog.add) window.gameLog.add('🏆 悬赏「' + b.title + '」完成！获得灵石+' + b.stones + itemTxt, 'success');
    if (window.showMessage) window.showMessage('悬赏「' + b.title + '」完成，领得灵石+' + b.stones + '！' + itemTxt, 'success');
    if (window.updateCharacterStatus) window.updateCharacterStatus();
    return true;
}

// 监听 enemy:defeated：推进已接取未完成的悬赏
function _onEnemyDefeated() {
    try {
        if (!_board) return;
        var changed = false;
        _board.forEach(function (b) {
            if (b.accepted && !b.completed && !b.person) {   // v27.13：人犯单不吃杀敌进度——缉凶只认缉捕战（huntPerson）
                b.progress++;
                if (b.progress >= b.count) {
                    b.completed = true;
                    if (window.gameLog && window.gameLog.add) window.gameLog.add('🌟 悬赏「' + b.title + '」已完成，可去悬赏榜领奖！', 'success');
                }
                changed = true;
            }
        });
        if (changed && window.refreshBountyBoard) window.refreshBountyBoard();
    } catch (e) {}
}

// 每日刷新（v25.5 改版）：对手先推进——未接取的悬赏每日被竞争者按脚程猎杀，猎完即被抢走；
// 已领取/被抢的摘榜，空位补新单；已接取的照旧保留（接了对手就撤，无时限）
// v27.13：人犯单同循环竞速（count=3——同行一日摸一分线索，1~3 日内会截走）；被截走回调报官簿销账；
//   补位只补模板单——人犯单不占模板三张的位。
function dailyBountyRefresh() {
    try {
        if (!_board) { generateBountyBoard(); return; }
        _board.forEach(function (b) {
            if (b.accepted || b.claimed || b.snatched || !b.rival) return;
            b.rivalProgress = (b.rivalProgress || 0) + Math.max(1, Math.ceil(b.rival.rate * b.count));
            if (b.rivalProgress >= b.count) {
                b.snatched = true;
                if (window.gameLog && window.gameLog.add) window.gameLog.add('⚡ ' + (b.person ? '要犯「' + b.name + '」被「' + b.rival.name + '」抢先拿住，赏格让同行领了' : '悬赏「' + b.title + '」被「' + b.rival.name + '」抢先猎完') + '——手慢无。', 'warning');
            }
        });
        // v27.13：人犯单被同行截走——回调报官簿勾账（案犯被同行拿了，这案就销了）
        _board.forEach(function (b) {
            if (b.person && b.snatched && !b._snatchNoted) {
                b._snatchNoted = true;
                try {
                    if (window.CaseSystem && typeof window.CaseSystem.onPersonSettled === 'function') window.CaseSystem.onPersonSettled(b.id, 'snatched');
                } catch (eSn) { console.warn('[静默失败] js/quest/bounty-board.js · dailyBountyRefresh：截单没勾报官簿', eSn && eSn.message); }
            }
        });
        _board = _board.filter(function (b) { return !b.claimed && !b.snatched; });
        var used = _board.map(function (b) { return b.tplId; }).filter(Boolean);
        var tplCount = _board.filter(function (b) { return !b.person; }).length;   // v27.13：模板位与人犯单分开数
        while (tplCount < 3) {
            var nb = _generateOne(used);
            used.push(nb.tplId);
            _board.push(nb);
            tplCount++;
        }
        if (window.gameLog && window.gameLog.add) window.gameLog.add('📜 悬赏榜已刷新——榜上的单不止你盯着，脚程慢的会被抢。', 'info');
        if (window.refreshBountyBoard) window.refreshBountyBoard();
    } catch (e) {}
}

// ============ v27.13 人犯单（张榜半日流程的产物：case-system 核验到点经此正门上榜） ============
// 榜上只见已张榜的——这是人犯单唯一的进榜路；核验期（case-system 报官簿）里查无此人。
function postPersonBounty(payload) {
    try {
        if (!payload || !payload.id) return false;
        if (!_board) generateBountyBoard();
        for (var i = 0; i < _board.length; i++) { if (_board[i].id === payload.id) return true; }   // 已在榜：幂等
        _uidSeq += 1;
        _board.push({
            id: payload.id, person: true, caseId: payload.caseId || '', city: payload.city || '',
            tplId: null,
            title: '要犯·' + (payload.name || '无名氏'),
            desc: (payload.brief ? payload.brief : '') + '目击线报：' + (payload.look || '容貌不详') + '，多半窝在' + (payload.lair || '外乡') + '。'
                + (payload.flavor ? ' ' + payload.flavor : ''),   // v27.13：跑路/石沉大海的走样话随重建一起上榜
            count: 3, stones: Math.max(0, Math.floor(Number(payload.stones) || 0)), items: null,   // v27.13：缉凶三步（踩点→围堵→拿人）——同行一日摸一步，竞速窗口 1~3 日；缉凶只认 huntPerson 真仗
            progress: 0, accepted: !!payload.accepted, completed: !!payload.completed, claimed: false,
            rival: { name: RIVAL_NAMES[Math.floor(Math.random() * RIVAL_NAMES.length)], rate: 0.25 + Math.random() * 0.45 },
            rivalProgress: 0, snatched: false,
            name: payload.name || '无名氏', look: payload.look || '', lair: payload.lair || '', tier: Math.max(1, Math.floor(Number(payload.tier) || 1)),
            sank: !!payload.sank, _flavor: payload.flavor ? String(payload.flavor).slice(0, 80) : ''   // v27.13：石沉大海标与走样话（跑路账由 case-system 经 updatePersonBounty 回写）
        });
        return true;
    } catch (e) { console.warn('[静默失败] js/quest/bounty-board.js · postPersonBounty：人犯没挂上榜', e && e.message); return false; }
}
// v27.13：人犯单改榜文正门——案犯跑了窝（lair）、留下走样话（flavor）、遁远石沉大海（sank，接取作废）
//   都走这里回写；赏格分毫不动（赏随案走）。榜上查无此单返回 false（读档后由 syncPosts 重建兜底）。
function updatePersonBounty(id, patch) {
    try {
        if (!_board || !id || !patch || typeof patch !== 'object') return false;
        for (var i = 0; i < _board.length; i++) {
            var b = _board[i];
            if (b.id !== id || !b.person) continue;
            if (patch.lair != null) {
                b.lair = String(patch.lair).slice(0, 60);
                b.desc = String(b.desc).replace(/，多半窝在[^。]+。/, '，多半窝在' + b.lair + '。');
            }
            if (patch.flavor) b._flavor = String(patch.flavor).slice(0, 80);
            if (patch.sank) { b.sank = true; b.accepted = false; }   // 石沉大海：接取作废——同行竞速照旧，截单即销案
            try { refreshBountyBoard(); } catch (eR) {}
            return true;
        }
    } catch (e) { console.warn('[静默失败] js/quest/bounty-board.js · updatePersonBounty：榜文没改成人', e && e.message); }
    return false;
}
function completePersonBounty(id) {
    try {
        if (!_board) return false;
        for (var i = 0; i < _board.length; i++) {
            if (_board[i].id === id) {
                _board[i].completed = true;
                _board[i].progress = _board[i].count;
                try { refreshBountyBoard(); } catch (eR) {}
                return true;
            }
        }
    } catch (e) { console.warn('[静默失败] js/quest/bounty-board.js · completePersonBounty：榜单没勾成', e && e.message); }
    return false;
}
function personBountyAlive(id) {
    if (!_board) return false;
    for (var i = 0; i < _board.length; i++) { if (_board[i].id === id) return true; }
    return false;
}
function playerTierNow() {
    try { var c = window.currentCharData; if (c && c.realm && typeof window.getRealmTier === 'function') return Number(window.getRealmTier(c.realm)) || 0; } catch (e) {}
    return 0;
}
// 人犯单缉凶：接了榜去堵老巢——真仗（复用 _isFugitiveHunt 收场钩子，结算走报官簿 _settleCaseHunt）
function huntPerson(idx) {
    var b = getBountyBoard()[Math.floor(Number(idx))];
    if (!b || !b.person) { if (window.showMessage) window.showMessage('榜上没有这一号人犯。', 'info'); return false; }
    if (b.snatched) { if (window.showMessage) window.showMessage('手慢无——这单被同行截了。', 'warning'); return false; }
    if (b.sank) { if (window.showMessage) window.showMessage('「' + b.name + '」已遁出千里——这单石沉大海，只等同行销案。', 'info'); return false; }   // v27.13：遁远的缉捕文书追不出去
    if (!b.accepted) { if (window.showMessage) window.showMessage('先揭榜（接取），再去堵人。', 'info'); return false; }
    if (b.completed) { if (window.showMessage) window.showMessage('人已到案——回榜领赏。', 'info'); return false; }
    if (window.currentBattle) { if (window.showMessage) window.showMessage('打着架呢——先了结手头这场。', 'warning'); return false; }
    try {
        if (window.CaseSystem && typeof window.CaseSystem.personHuntOk === 'function' && !window.CaseSystem.personHuntOk(b.caseId)) {
            if (window.showMessage) window.showMessage('那厮惊了窝——五日内堵他不着，等风头过。', 'warning');
            return false;
        }
    } catch (eOk) { console.warn('[静默失败] js/quest/bounty-board.js · huntPerson：冷却读口没通——照常开仗', eOk && eOk.message); }
    var tier = (b.tier || 1) + Math.max(1, playerTierNow());
    var enemy = {
        name: '案犯·' + b.name, type: 'elite', physiologyType: 'humanoid',
        level: tier * 3 + 2, attack: 28 + tier * 7, defense: 15 + tier * 4, speed: 20,
        maxDurability: 100 + tier * 20, durabilities: { chest: 100 + tier * 20 }, combatAbilities: []
    };
    // v27.13 雇保镖：接单缉凶的围堵/拿人这一步，按案犯凶悍档掷护法——掷中挂 _btyGuardPend 旗，
    //   第二仗（护法拦路）由 case-system 收场账排（赢了护法才拿得住人；护法被杀不影响赏银口径）
    var guardPend = false;
    try {
        var gp = GUARD_P_BY_TIER[Math.min(GUARD_P_BY_TIER.length - 1, Math.max(1, b.tier || 1))] || 0;
        guardPend = Math.random() < gp;
    } catch (eGP) { console.warn('[静默失败] js/quest/bounty-board.js · huntPerson：护法骰没掷成——按无护法走', eGP && eGP.message); guardPend = false; }
    var started = false;
    try {
        if (window.NpcCrime && typeof window.NpcCrime.startFlaggedBattle === 'function') {
            started = window.NpcCrime.startFlaggedBattle(enemy, { _isFugitiveHunt: true, _btyCaseId: b.caseId, _btyMode: 'bounty', _btyPostedId: b.id, _btyGuardPend: guardPend },
                '🪧 你揭了榜——「' + b.name + '」的老巢就在' + b.lair + '。那厮见了画影图形，拔脚就跑：「想拿爷换赏钱？来！」');
        } else { if (window.showMessage) window.showMessage('缉捕的场面拉不起来——兵刃的账没接上。', 'warning'); }
    } catch (eH) { console.warn('[静默失败] js/quest/bounty-board.js · huntPerson：这一仗没拉起来', eH && eH.message); }
    return started;
}

function refreshBountyBoard() {
    var container = document.getElementById('bounty-board-list');
    if (!container) return;
    var board = getBountyBoard();
    container.innerHTML = board.map(function (b, idx) {
        // v27.13：人犯单牌面——赏格出自城基金，揭榜后循线报堵老巢（缉凶真仗），完成后回榜领赏
        if (b.person) {
            var pState;
            if (b.claimed) pState = '<span class="text-gray-500 text-xs">已领取</span>';
            else if (b.snatched) pState = '<span class="text-red-400 text-xs">被「' + ((b.rival && b.rival.name) || '同行') + '」截了</span>';
            else if (b.sank) pState = '<span class="text-gray-500 text-xs">石沉大海——只等同行销案</span>';   // v27.13：遁远封死缉捕与揭榜，同行竞速照旧
            else if (b.completed) pState = '<button onclick="claimBounty(' + idx + ')" class="bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-3 py-1 rounded">🏆 领赏</button>';
            else if (b.accepted) pState = '<button onclick="huntPerson(' + idx + ')" class="bg-red-700 hover:bg-red-600 text-white text-xs font-bold px-3 py-1 rounded">🗡️ 缉凶（堵老巢·真仗）</button>';
            else pState = '<button onclick="acceptBounty(' + idx + ')" class="bg-yellow-600 hover:bg-yellow-500 text-gray-900 text-xs font-bold px-3 py-1 rounded">揭榜</button>';
            var pRival = (!b.accepted && !b.claimed && !b.snatched && b.rival)
                ? '<div class="text-xs text-red-300/80 mt-1">⚔️ 「' + b.rival.name + '」也在查这单，已摸到 ' + Math.min(b.count - 1, b.rivalProgress || 0) + '/' + b.count + ' 分线索——手慢无</div>'
                : '';
            return '<div class="bg-gray-900/50 p-3 rounded border border-red-800 mb-2">'
                + '<div class="flex justify-between items-center">'
                + '<div><span class="text-red-300 font-bold text-sm">🪧 ' + b.title + '</span> <span class="text-xs text-gray-400">· 缉拿归案</span></div>'
                + '<div>' + pState + '</div>'
                + '</div>'
                + '<div class="text-xs text-gray-400 mt-1">' + b.desc + '</div>'
                + (b._flavor ? '<div class="text-xs text-orange-300/80 mt-1">🪧 ' + b._flavor + '</div>' : '')   // v27.13：跑路走样话/石沉大海另起一行
                + '<div class="text-xs text-yellow-500 mt-1">赏格：灵石+' + b.stones + '（赏银出自城中基金） 名气+2</div>'
                + pRival
                + '</div>';
        }
        var state;
        if (b.claimed) state = '<span class="text-gray-500 text-xs">已领取</span>';
        else if (b.snatched) state = '<span class="text-red-400 text-xs">被「' + ((b.rival && b.rival.name) || '同行') + '」抢了</span>';
        else if (b.completed) state = '<button onclick="claimBounty(' + idx + ')" class="bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-3 py-1 rounded">🏆 领奖</button>';
        else if (b.accepted) state = '<span class="text-yellow-400 text-xs">进度 ' + b.progress + '/' + b.count + '</span>';
        else state = '<button onclick="acceptBounty(' + idx + ')" class="bg-yellow-600 hover:bg-yellow-500 text-gray-900 text-xs font-bold px-3 py-1 rounded">接取</button>';
        // v25.5 抢单竞争：未接取的单亮出对手脚程——看着它一天天逼近，接不接自己掂量
        var rivalTxt = (!b.accepted && !b.claimed && !b.snatched && b.rival)
            ? '<div class="text-xs text-red-300/80 mt-1">⚔️ 「' + b.rival.name + '」也在猎这单，已斩 ' + Math.min(b.count - 1, b.rivalProgress || 0) + '/' + b.count + '——手慢无</div>'
            : '';
        return '<div class="bg-gray-900/50 p-3 rounded border border-gray-700 mb-2">'
            + '<div class="flex justify-between items-center">'
            + '<div><span class="text-gray-200 font-bold text-sm">' + b.title + '</span> <span class="text-xs text-gray-400">· 斩' + b.count + '只</span></div>'
            + '<div>' + state + '</div>'
            + '</div>'
            + '<div class="text-xs text-gray-400 mt-1">' + b.desc + '</div>'
            + '<div class="text-xs text-yellow-500 mt-1">奖励：灵石+' + b.stones + (b.items && b.items.length ? ' +材料' : '') + ' 声望+' + Math.floor(b.count / 2) + '</div>'
            + rivalTxt
            + '</div>';
    }).join('');
}

function openBountyBoard() {
    var cd = window.currentCharData;
    if (!cd) { if (window.showMessage) window.showMessage('请先创建角色进入游戏。', 'info'); return; }
    var old = document.getElementById('bounty-board-modal'); if (old) old.remove();
    var html = '<div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" id="bounty-board-modal">'
        + '<div class="bg-gray-800 border-2 border-yellow-500 rounded-xl p-6 max-w-md w-full" style="box-shadow:0 0 60px rgba(234,179,8,0.2)">'
        + '<h2 class="text-2xl font-bold text-yellow-500 mb-3">📜 江湖悬赏榜</h2>'
        + '<p class="text-xs text-gray-400 mb-3">讨伐悬赏，奖励灵石+材料+声望。已接取的悬赏杀敌自动累计进度。榜上的单不止你盯着——对手每日都在猎，猎完就被抢走；接了的单对手即撤。</p>'
        + '<div id="bounty-board-list" class="space-y-2"></div>'
        + '<button onclick="document.getElementById(\'bounty-board-modal\').remove()" class="mt-3 w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 rounded">关闭</button>'
        + '</div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
    refreshBountyBoard();
}

// EventBus 监听击杀推进
if (window.EventBus && typeof window.EventBus.on === 'function') {
    try { window.EventBus.on('enemy:defeated', _onEnemyDefeated); } catch (e) {}
}
// 每日刷新
if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') {
    window.timeSystem.onNewDaySubscribe(dailyBountyRefresh);
}

window.getBountyBoard = getBountyBoard;
window.acceptBounty = acceptBounty;
window.claimBounty = claimBounty;
window.openBountyBoard = openBountyBoard;
window.refreshBountyBoard = refreshBountyBoard;
window.huntPerson = huntPerson;   // v27.13：人犯单缉凶（牌面 onclick 直呼）
// v27.13：张榜正门——case-system 核验到点经此上榜/重建/勾账（postPersonBounty 是人犯单唯一进榜路）
// v27.13 后续人生：updatePersonBounty——跑路改窝点/走样话、遁远石沉大海（case-system 跑路账的回写口）
window.BountyBoardAPI = {
    postPersonBounty: postPersonBounty,
    completePersonBounty: completePersonBounty,
    personBountyAlive: personBountyAlive,
    updatePersonBounty: updatePersonBounty
};

})();
