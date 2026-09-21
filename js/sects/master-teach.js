// ==================== master-teach.js - v20.1 弟子培养体系（阶段 → 出师 → 反哺） ====================
// 对标鬼谷八荒：弟子有培养阶段（入门→小成→大成→出师），传功推进，大成+好感+玩家境界达标可出师
// 第二十一波 · 弟子真成长：培养进度改记自己的账（_teachProgress，不再与江湖演化共字段互相吃账）；
//   每攒满二十点感悟就是一次真突破（层级+1，九层满了晋大境界）；出师礼当空一记大境界；
//   出师弟子不再每日凭空反哺——改为云游行商，按月把挣下的真钱寄回（钱先在弟子自己荷包里过一道手）。
// 复用 PlayerSect.disciples、NPC 演化字段/affection、npcManager.serialize 持久化、onNewDaySubscribe

(function () {

// 培养阶段阈值（按 _teachProgress 划分——第二十一波起培养进度记自己的账，不与江湖演化共字段）
var STAGES = [
    { name: '入门', threshold: 0 },
    { name: '小成', threshold: 20 },
    { name: '大成', threshold: 40 },
    { name: '圆满意（可出师）', threshold: 60 }
];
var GRAD_AFFECTION = 60;   // 出师需好感
var GRAD_PLAYER_TIER = 3;  // 出师需玩家金丹期+
var TEACH_COST = 30;       // 传功灵石成本
// （旧账备查）每日反哺已退役——第二十一波改为按月从弟子荷包里寄回真钱

// 第二十一波 · 弟子真成长：境界阶梯与江湖演化同一把尺（凡人→渡劫）
var REALM_ORDERS = ['凡人', '炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'];
function combatOf(npc) {
    if (!npc.combat || typeof npc.combat !== 'object') npc.combat = {};
    if (!npc.combat.realm) npc.combat.realm = '凡人';
    npc.combat.layer = Math.max(1, Math.min(9, Number(npc.combat.layer) || 1));
    return npc.combat;
}
function realmWord(npc) {
    var c = combatOf(npc);
    if (c.realm === '凡人') return '凡人';
    return c.realm + '·' + c.layer + '层';
}
function _realmTierOf(npc) {
    try { if (typeof window.getRealmTier === 'function') { var t = Number(window.getRealmTier(combatOf(npc).realm)); if (isFinite(t)) return Math.max(0, t); } } catch (e) {}
    return Math.max(0, REALM_ORDERS.indexOf(combatOf(npc).realm));
}
// 一次真突破：层级+1；九层圆满则晋一个大境界（与江湖 NPC 演化同一条阶梯）
function discipleBreakthrough(npc) {
    var c = combatOf(npc);
    var idx = REALM_ORDERS.indexOf(c.realm);
    if (idx < 0) idx = 1;
    if (c.layer >= 9) {
        if (idx >= REALM_ORDERS.length - 1) return null; // 渡劫圆满——上面没人了
        c.realm = REALM_ORDERS[idx + 1];
        c.layer = 1;
        return { big: true, text: '破境而出，晋入「' + c.realm + '」！' };
    }
    c.layer += 1;
    return { big: false, text: '修为精进，' + c.realm + '第' + c.layer + '层。' };
}
window.discipleBreakthrough = discipleBreakthrough;
window.discipleRealmWord = realmWord;
// 培养进度记自己的账（_teachProgress）——不再与江湖演化共一个字段互相吃账；
// 老档迁移：头一回读时把旧字段里的进度接过来，一笔不丢。
function teachProg(npc) {
    if (npc._teachProgress == null) npc._teachProgress = Number(npc._cultivationProgress) || 0;
    return Number(npc._teachProgress) || 0;
}
// 感悟进账（传功/历练共用）：每攒满二十点感悟，触发一次真突破
function _addInsight(npc, n) {
    if (!npc || npc._graduated) return null;
    var oldM = Math.floor(teachProg(npc) / 20);
    npc._teachProgress = teachProg(npc) + (Number(n) || 0);
    var newM = Math.floor(teachProg(npc) / 20);
    var br = null;
    for (var i = oldM; i < newM; i++) {
        var r = discipleBreakthrough(npc);
        if (r) br = r; // 连破数关，报最后也最大的一记
    }
    return br;
}
window.discipleAddInsight = _addInsight;
// 镇派秘艺加成（player-sect-life 出口）：有艺之门，传功进境更疾
function artTeachMul() {
    try {
        if (typeof window.psArtTeachMul === 'function') {
            var m = Number(window.psArtTeachMul());
            if (isFinite(m) && m >= 1) return m;
        }
    } catch (e) {}
    return 1;
}

// 统一时钟链（第九波口径）——报行踪、按月寄钱都要看真钟
function _absDay() {
    try {
        if (typeof window.getAbsoluteDay === 'function') { var g = window.getAbsoluteDay(); if (g) return Math.floor(g); }
        var t = window.timeSystem;
        if (t) {
            if (typeof t.getAbsoluteDay === 'function') { var g2 = t.getAbsoluteDay(); if (g2) return Math.floor(g2); }
            if (t.gameTime && t.gameTime.currentDay) return Math.floor(t.gameTime.currentDay);
            if (t.totalDays) return Math.floor(t.totalDays);
        }
        if (window.WorldCalendar && window.WorldCalendar.day) return Math.floor(window.WorldCalendar.day);
    } catch (e) {}
    return 0;
}
// 街谈巷议（既有管线）
function _street(text) {
    try {
        var f = (window.eventFlags = window.eventFlags || {});
        if (!f['qi_street'] || !f['qi_street'].push) f['qi_street'] = [];
        f['qi_street'].push({ day: _absDay(), text: String(text) });
        if (f['qi_street'].length > 60) f['qi_street'].splice(0, f['qi_street'].length - 60);
    } catch (e) {}
}
// 宗门史记一笔（自建宗门才有得记）
function _psNote(text) {
    try {
        if (window.PSectWorld && typeof window.PSectWorld.homeName === 'function') {
            var n = window.PSectWorld.homeName();
            if (n) window.PSectWorld.note(n, text);
        }
    } catch (e) {}
}
// 出师弟子的云游荷包：钱先挣进他自己荷包，再按月寄回——每一笔都有来路
function _purseOf(npc) { npc._purse = Number(npc._purse) || 0; return npc._purse; }
var WORK_HOUSES = ['震威镖局', '赵记车马行', '回春堂', '集文书坊', '黑水商队'];

function _getDiscipleIds() {
    var ids = [];
    // 自建宗门（PlayerSect）的弟子
    try {
        if (window.PlayerSect && typeof window.PlayerSect.listMySects === 'function') {
            var mine = window.PlayerSect.listMySects() || [];
            if (mine.length && mine[0].disciples) {
                mine[0].disciples.forEach(function (d) { if (d && d.npcId) ids.push(d.npcId); });
            }
        }
    } catch (e) {}
    // 批四：在本派收的真名弟子（sect-kin）也进同一条培养线——传功/出师/反哺一视同仁
    try {
        if (typeof window.getMyNamedDisciples === 'function') {
            window.getMyNamedDisciples().forEach(function (nid) { if (nid && ids.indexOf(nid) < 0) ids.push(nid); });
        }
    } catch (e2) {}
    return ids;
}

function _stageIndex(npc) {
    var p = teachProg(npc);
    var idx = 0;
    for (var i = STAGES.length - 1; i >= 0; i--) {
        if (p >= STAGES[i].threshold) { idx = i; break; }
    }
    return idx;
}

function _stageName(npc) { return STAGES[_stageIndex(npc)].name; }

function _playerTier() {
    try {
        var cd = window.currentCharData;
        if (!cd) return 0;
        return (typeof window.getRealmTier === 'function') ? window.getRealmTier(cd.realm) : 0;
    } catch (e) { return 0; }
}

function _canGraduate(npc) {
    if (!npc || npc._graduated) return false;
    if (_stageIndex(npc) < 2) return false; // 需大成（idx>=2）
    // v20.24 修字段误读：好感真源在 npc.relationship.affection（此前读裸字段恒 0，出师永远不可达成）
    if (_npcAffection(npc) < GRAD_AFFECTION) return false;
    if (_playerTier() < GRAD_PLAYER_TIER) return false;
    return true;
}

function _npcAffection(npc) {
    if (!npc) return 0;
    if (npc.relationship && isFinite(Number(npc.relationship.affection))) return Number(npc.relationship.affection) || 0;
    if (isFinite(Number(npc.affection))) return Number(npc.affection) || 0;
    return 0;
}

// v20.14 灵根生效第二批：弟子受性看灵根——传功进境 = 基准 5 × 灵根倍率。
// 倍率与江湖传闻同一把尺（NPCLife.npcRootGrowthMul）：天才一点就透，庸才需反复提点。
// 成本一分不变（灵石/好感/时辰/声望照旧），只有"吸收了多少"随资质浮动；
// 灵根数据或换算缺位时按常速 1.0——不拿猜测当事实。
function _teachMul(npc) {
    try {
        if (window.NPCLife && typeof window.NPCLife.npcRootGrowthMul === 'function') {
            var m = Number(window.NPCLife.npcRootGrowthMul(npc));
            if (isFinite(m) && m > 0) return m;
        }
    } catch (e) {}
    return 1.0;
}

// 资质档位（面板展示用，纯由倍率换算，不另存字段）
function _rootTierLabel(mul) {
    if (mul >= 2) return '天灵根';
    if (mul >= 1.2) return '上品灵根';
    if (mul >= 0.8) return '中庸之资';
    if (mul >= 0.5) return '下品灵根';
    return '杂灵根';
}

// 第二十一波：人在山下（派遣未归）就传不了功——查自建宗门名册上的行踪
function _awayOf(npcId) {
    try {
        if (window.PlayerSect && typeof window.PlayerSect.listMySects === 'function') {
            var mine = window.PlayerSect.listMySects() || [];
            if (mine.length) {
                var all = (mine[0].disciples || []).concat(mine[0].guests || []);
                for (var i = 0; i < all.length; i++) { if (all[i] && all[i].npcId === npcId && all[i].away) return all[i].away; }
            }
        }
    } catch (e) {}
    return null;
}

// 传功：推进弟子修炼进度 + 好感 + 玩家声望 + 阶段突破提示
// v20.52：usePill 为真且自家宗门库中有丹药时，用宗门丹药布置（不花灵石）——丹药从库房来，总得有用处
// 第二十一波：进境记 _teachProgress（自有账），有镇派秘艺进境更疾；阶段突破即真境界破关
function teachDisciple(npcId, usePill) {
    var cd = window.currentCharData;
    if (!cd) { if (window.showMessage) window.showMessage('请先创建角色', 'warning'); return false; }
    var npc = window.npcManager && window.npcManager.getNPC(npcId);
    if (!npc) { if (window.showMessage) window.showMessage('查无此弟子。', 'warning'); return false; }
    if (npc._graduated) { if (window.showMessage) window.showMessage(npc.name + '已出师，无需再传功。', 'info'); return false; }
    var away = _awayOf(npcId);
    if (away) { if (window.showMessage) window.showMessage(npc.name + '下山' + (away.name || '办事') + '去了，还有' + Math.max(1, (Number(away.back) || 0) - _absDay()) + '日回山——人不在，功传不了。', 'info'); return false; }
    // 布置费：宗门丹药优先，库空则照旧花灵石
    var _ps = (window.PlayerSect && typeof window.PlayerSect.listMySects === 'function') ? (window.PlayerSect.listMySects() || [])[0] : null;
    var pillUsed = false;
    if (usePill && _ps && (Number(_ps.resources && _ps.resources.elixir) || 0) >= 1) {
        var pr = window.PlayerSect.consumeResource(_ps.id, 'elixir', 1);
        if (pr && pr.ok) pillUsed = true;
    }
    if (!pillUsed) {
        if (window.DataManager && window.DataManager.deductSpiritStones && !window.DataManager.deductSpiritStones(TEACH_COST)) {
            if (window.showMessage) window.showMessage('传功需 ' + TEACH_COST + ' 灵石布置' +
                (usePill ? '（宗门库里没丹药了，只好花灵石）' : '') + '。', 'warning');
            return false;
        }
    }
    var oldStage = _stageIndex(npc);
    var mul = _teachMul(npc) * artTeachMul(); // 第二十一波：镇派秘艺在手，同一堂课听得更透
    var gain = Math.round(5 * mul * 10) / 10; // v20.14 受性看灵根：基准 5 浮动，成本不变
    var br = _addInsight(npc, gain); // 进境记自有账；攒满二十点感悟即真突破
    if (typeof npc.changeAffection === 'function') npc.changeAffection(5);
    cd.fame = Math.min((window.FAME_CAP || 99999), (cd.fame || 0) + 3);
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(60, '传功弟子');
    }
    var newStage = _stageIndex(npc);
    var flavor = mul >= 1.5 ? '（一点就透，好资质！）' : (mul <= 0.6 ? '（资质愚钝，需多讲几遍）' : '');
    var msg = '📖 你为' + npc.name + '传功讲道' + (pillUsed ? '（以宗门丹药布置，未花灵石）' : '') + '，感悟+' + gain + '，好感+5，你声望+3。' + flavor;
    if (newStage > oldStage) {
        msg += '\n✨ ' + npc.name + ' 培养突破至「' + STAGES[newStage].name + '」！';
    }
    if (br) {
        // 真境界破关——不是面板数字，是拳头上看得见的长进
        msg += '\n⚡ ' + npc.name + ' ' + br.text + '（如今' + realmWord(npc) + '）';
        if (window.gameLog && window.gameLog.add) window.gameLog.add('⚡ ' + npc.name + ' ' + br.text, 'success');
        if (br.big) {
            _street('「' + npc.name + '」破境而出，晋入' + combatOf(npc).realm + '——师门里传出来的消息，茶棚里说了半天。');
            _psNote('门下「' + npc.name + '」破境晋入' + combatOf(npc).realm + '——名师出高徒，山门有光。');
        }
    }
    if (_canGraduate(npc)) {
        msg += '\n🌟 ' + npc.name + ' 已可出师（大成+好感足+你金丹+），可为其举行出师礼。';
    }
    if (window.showMessage) window.showMessage(msg, 'success');
    if (window.gameLog && window.gameLog.add) window.gameLog.add('📖 传功' + npc.name + '，阶段：' + _stageName(npc), 'info');
    if (window.updateCharacterStatus) window.updateCharacterStatus();
    return true;
}

function teachFirstDisciple() {
    var ids = _getDiscipleIds();
    if (!ids.length) { if (window.showMessage) window.showMessage('你尚无弟子可传功。先招募弟子或建宗收徒。', 'warning'); return false; }
    return teachDisciple(ids[0]);
}

// 出师礼：一次性反哺师门 + 标记 _graduated
function tryGraduateDisciple(npcId) {
    var cd = window.currentCharData;
    if (!cd) { if (window.showMessage) window.showMessage('请先创建角色', 'warning'); return false; }
    var npc = window.npcManager && window.npcManager.getNPC(npcId);
    if (!npc) { if (window.showMessage) window.showMessage('查无此弟子。', 'warning'); return false; }
    if (npc._graduated) { if (window.showMessage) window.showMessage(npc.name + '已出师。', 'info'); return false; }
    if (!_canGraduate(npc)) {
        var need = [];
        if (_stageIndex(npc) < 2) need.push('培养至大成');
        if (_npcAffection(npc) < GRAD_AFFECTION) need.push('好感≥' + GRAD_AFFECTION);
        if (_playerTier() < GRAD_PLAYER_TIER) need.push('你达金丹期');
        if (window.showMessage) window.showMessage('出师条件未满：' + need.join('、') + '。', 'warning');
        return false;
    }
    npc._graduated = true;
    // 第二十一波 · 出师当日当空一记大境界：十年感悟，就在这一朝兑现
    var gradBr = null;
    var gc = combatOf(npc);
    var gi = REALM_ORDERS.indexOf(gc.realm);
    if (gi >= 0 && gi < REALM_ORDERS.length - 1) { gc.realm = REALM_ORDERS[gi + 1]; gc.layer = 1; gradBr = gc.realm; }
    else { gc.layer = 9; }
    // 出师的孝敬不再凭空而来：修行这些年他自己攒下了体己——感悟越深、境界越高，攒得越厚；
    // 钱先落他的荷包，再从荷包里双手奉上（两讫，有来路）
    var saving = Math.min(200, 50 + Math.floor(teachProg(npc)) + _realmTierOf(npc) * 20);
    npc._purse = Math.max(_purseOf(npc), saving);
    var stone = Math.min(npc._purse, saving);
    npc._purse -= stone;
    var fame = 10, ess = 50;
    if (window.DataManager && typeof window.DataManager.addSpiritStones === 'function') window.DataManager.addSpiritStones(stone);
    else cd.spiritStones = (cd.spiritStones || 0) + stone;
    cd.fame = Math.min((window.FAME_CAP || 99999), (cd.fame || 0) + fame);
    cd.essence = (cd.essence || 0) + ess;
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(120, '出师礼');
    }
    if (window.gameLog && window.gameLog.add) {
        window.gameLog.add('🎓 ' + npc.name + ' 学成出师！' + (gradBr ? '当空一记破境，晋入「' + gradBr + '」——' : '') + '奉上修行年间的积蓄：灵石+' + stone + ' 声望+' + fame + ' 真元+' + ess + '。此后云游行商，按月寄回真钱。', 'success');
    }
    if (window.showMessage) window.showMessage('🎓 ' + npc.name + ' 学成出师' + (gradBr ? '，晋入「' + gradBr + '」' : '') + '！奉上积蓄灵石' + stone + '。此后他云游在外行商谋生，按月把钱寄回给你。', 'success');
    if (gradBr) {
        _street('「' + npc.name + '」出师了——出师礼上当空破境，晋入' + gradBr + '。观礼的人都说：这一门教得实。');
        _psNote('「' + npc.name + '」学成出师，当空破境晋入' + gradBr + '——山门教化，江湖看得见。');
    }
    // v21.9 衣钵线·出师即任事：此前弟子出师即封顶（只有资源反哺，没有位分）——
    // 现在若你有自己的宗门，出师弟子直接被延请入宗，长老位有空缺便当场受任。
    try {
        if (window.PlayerSect && typeof window.PlayerSect.listMySects === 'function') {
            var _sects = window.PlayerSect.listMySects() || [];
            var _sect = _sects[0];
            if (_sect) {
                var _already = (typeof window.PlayerSect.getDisciple === 'function') ? window.PlayerSect.getDisciple(_sect.id, npc.id) : null;
                if (!_already && typeof window.PlayerSect.recruitDisciple === 'function') {
                    window.PlayerSect.recruitDisciple(_sect.id, npc.id);
                }
                var _ap = (typeof window.PlayerSect.assignPosition === 'function') ? window.PlayerSect.assignPosition(_sect.id, npc.id, '长老') : null;
                if (_ap && _ap.ok) {
                    if (window.gameLog && window.gameLog.add) window.gameLog.add('🏯 ' + npc.name + ' 出师即任事——入你自立的宗门「' + _sect.name + '」，受任长老之位！衣钵有人接了。', 'success');
                    if (window.showMessage) window.showMessage('🏯 ' + npc.name + ' 受任你宗门「' + _sect.name + '」长老——弟子出息，宗门壮实。', 'success');
                }
            }
        }
    } catch (e) {}
    if (window.updateCharacterStatus) window.updateCharacterStatus();
    return true;
}

// 按月寄回（第二十一波 · 反哺真账）：出师弟子在江湖上行商谋生——
// 每月先把挣下的钱装进自己荷包（雇主有名有姓），再从荷包里寄一份回来；
// 荷包里没有钱就不寄——不再每日凭空变出灵石。旧日「每日反哺」就此退役。
function dailyGraduatedFeedback() {
    try {
        var cd = window.currentCharData;
        if (!cd) return;
        var day = _absDay();
        if (!day || day % 30 !== 0) return; // 一月一回，三十日寄到
        var ids = _getDiscipleIds();
        if (!ids.length) return;
        var total = 0, fame = 0, lines = [];
        ids.forEach(function (nid) {
            var npc = window.npcManager && window.npcManager.getNPC(nid);
            if (!npc || !npc._graduated || npc.isDead) return;
            var tier = Math.max(1, _realmTierOf(npc));
            var house = WORK_HOUSES[Math.floor(day / 30 + tier) % WORK_HOUSES.length];
            var earn = 12 + tier * 8 + Math.floor(Math.random() * 9); // 行商进项：境界越高，接的活越大
            npc._purse = _purseOf(npc) + earn;
            var send = Math.min(npc._purse, 15 + tier * 5); // 这个月挣多少寄多少，至多寄到这个数
            npc._purse -= send;
            total += send;
            fame += 0.5;
            lines.push(npc.name + '（' + house + '的活计）');
        });
        if (total <= 0) return;
        if (window.DataManager && typeof window.DataManager.addSpiritStones === 'function') window.DataManager.addSpiritStones(total);
        else cd.spiritStones = (cd.spiritStones || 0) + total;
        cd.fame = Math.min((window.FAME_CAP || 99999), (cd.fame || 0) + fame);
        if (window.gameLog && window.gameLog.add) {
            window.gameLog.add('🎓 出师弟子行商寄回灵石' + total + '：' + lines.join('、') + '。钱是有来路的钱。', 'info');
        }
    } catch (e) {}
}

// 弟子花名册（供 UI）
function getDiscipleRoster() {
    var ids = _getDiscipleIds();
    return ids.map(function (nid) {
        var npc = window.npcManager && window.npcManager.getNPC(nid);
        if (!npc) return null;
        return {
            npcId: nid,
            name: npc.name,
            stage: _stageName(npc),
            stageIdx: _stageIndex(npc),
            progress: Math.round(teachProg(npc) * 10) / 10,
            realm: realmWord(npc),          // 第二十一波：真境界上花名册——弟子不是数字，是修行的人
            purse: Math.floor(_purseOf(npc)),
            away: _awayOf(nid),
            affection: Number((npc.relationship && npc.relationship.affection != null) ? npc.relationship.affection : npc.affection) || 0, // 第九波修：出师判定读 relationship.affection，面板却读裸字段——同一个人两本好感账
            graduated: !!npc._graduated,
            canGraduate: _canGraduate(npc),
            rootTier: _rootTierLabel(_teachMul(npc)) // v20.14 资质档位（由灵根倍率即时换算，不另存）
        };
    }).filter(Boolean);
}

// 弟子培养面板
function openDisciplePanel() {
    var cd = window.currentCharData;
    if (!cd) { if (window.showMessage) window.showMessage('请先创建角色进入游戏。', 'info'); return; }
    var roster = getDiscipleRoster();
    var old = document.getElementById('disciple-panel-modal');
    if (old) old.remove();
    var listHtml;
    if (!roster.length) {
        listHtml = '<p class="text-gray-500 text-sm text-center py-4">你尚无弟子。可在本派收真名弟子（亲传及以上），或建立宗门招徒。</p>';
    } else {
        listHtml = roster.map(function (d) {
            var btns = '';
            if (d.away) {
                btns = '<span class="text-sky-300 text-xs">🚶 下山' + (d.away.name || '办事') + '去了——还有' + Math.max(1, (Number(d.away.back) || 0) - _absDay()) + '日回山</span>';
            } else if (d.graduated) {
                btns = '<span class="text-green-400 text-xs">✅ 已出师·云游行商（荷包' + d.purse + '石，按月寄回）</span>';
            } else {
                // v20.52：自家宗门有丹药时，布置费可用丹药抵（不花灵石）
                var _psElixir = 0;
                try {
                    var _ps0 = (window.PlayerSect && typeof window.PlayerSect.listMySects === 'function') ? (window.PlayerSect.listMySects() || [])[0] : null;
                    _psElixir = (_ps0 && Number(_ps0.resources && _ps0.resources.elixir)) || 0;
                } catch (e) {}
                var costLabel = _psElixir >= 1 ? '传功(丹药布置)' : '传功(30灵石)';
                btns = '<button onclick="teachDisciple(\'' + d.npcId + '\', true); window.openDisciplePanel();" class="bg-yellow-600 hover:bg-yellow-500 text-gray-900 text-xs font-bold px-3 py-1 rounded mr-2">📖 ' + costLabel + '</button>';
                if (d.canGraduate) {
                    btns += '<button onclick="tryGraduateDisciple(\'' + d.npcId + '\'); window.openDisciplePanel();" class="bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-3 py-1 rounded">🎓 出师</button>';
                }
            }
            return '<div class="bg-gray-900/50 p-3 rounded border border-gray-700 mb-2">'
                + '<div class="flex justify-between items-center">'
                + '<div><span class="text-gray-200 font-bold">' + d.name + '</span> <span class="text-xs text-blue-300">[' + (d.realm || '') + ']</span> <span class="text-xs text-yellow-400">[' + d.stage + ']</span> <span class="text-xs text-cyan-400">' + (d.rootTier || '') + '</span></div>'
                + '<div class="text-xs text-gray-400">感悟' + d.progress + ' | 好感' + d.affection + '</div>'
                + '</div>'
                + '<div class="mt-2">' + btns + '</div>'
                + '</div>';
        }).join('');
    }
    var html = '<div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" id="disciple-panel-modal">'
        + '<div class="bg-gray-800 border-2 border-yellow-500 rounded-xl p-6 max-w-md w-full"'
        + ' style="box-shadow:0 0 60px rgba(234,179,8,0.2)">'
        + '<h2 class="text-2xl font-bold text-yellow-500 mb-4">🧑‍🎓 弟子培养</h2>'
        + '<p class="text-xs text-gray-400 mb-3">传功推进阶段（入门→小成→大成→圆满）——每攒满二十点感悟，弟子真境界破关一层。大成+好感≥60+你金丹期 可出师；出师当日当空破一境，此后云游行商、按月寄回真钱。</p>'
        + listHtml
        + ((window.discipleState && window.discipleState.isInSect && (window.discipleState.rank == null ? 7 : window.discipleState.rank) <= 3 && typeof window.openTakeDisciplePanel === 'function')
            ? '<button onclick="document.getElementById(\'disciple-panel-modal\').remove(); window.openTakeDisciplePanel();" class="mt-2 w-full bg-amber-700 hover:bg-amber-600 text-white text-sm py-2 rounded">🧑‍🎓 在本派收真名弟子（亲传及以上）</button>' : '')
        + '<button onclick="document.getElementById(\'disciple-panel-modal\').remove()" class="mt-3 w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 rounded">关闭</button>'
        + '</div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
}

if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') {
    window.timeSystem.onNewDaySubscribe(dailyGraduatedFeedback);
}

window.teachDisciple = teachDisciple;
window.teachFirstDisciple = teachFirstDisciple;
window.tryGraduateDisciple = tryGraduateDisciple;
window.getDiscipleRoster = getDiscipleRoster;
window.openDisciplePanel = openDisciplePanel;

})();
