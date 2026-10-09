// ==================== bonded-artifact.js - v20.0 1.8 本命法宝/法宝成长 ====================
// 金丹+可炼制本命法宝（绑定不可易主），喂材料升级，战斗加成随等级
// 觉醒技能/化形留后续扩展。依赖：0.2.2 五行（法宝元素随主功法）

(function () {

function getBA() {
    var cd = window.currentCharData;
    if (!cd) return null;
    if (!cd._bondedArtifact) cd._bondedArtifact = null;
    return cd._bondedArtifact;
}

// 炼制本命法宝：金丹+，扣材料+灵石，绑定
function forgeBondedArtifact(name) {
    var cd = window.currentCharData;
    if (!cd) { if (window.showMessage) window.showMessage('请先创建角色', 'warning'); return false; }
    var tier = (typeof window.getRealmTier === 'function') ? window.getRealmTier(cd.realm) : 0;
    if (tier < 3) { if (window.showMessage) window.showMessage('需金丹以上方可凝聚本命法宝。', 'warning'); return false; }
    if (cd._bondedArtifact) { if (window.showMessage) window.showMessage('你已有本命法宝「' + cd._bondedArtifact.name + '」，性命相连不可易主。', 'warning'); return false; }
    // 扣灵石
    var cost = 300;
    if (window.DataManager && window.DataManager.deductSpiritStones && !window.DataManager.deductSpiritStones(cost)) {
        if (window.showMessage) window.showMessage('炼制需 ' + cost + ' 灵石。', 'warning');
        return false;
    }
    // 取主功法元素
    var element = 'neutral';
    try { if (typeof window._getMainTechniqueElement === 'function') element = window._getMainTechniqueElement(); } catch (e) {}
    cd._bondedArtifact = {
        name: name || '本命法宝',
        level: 1, exp: 0, expMax: 50,
        durability: 100, maxDurability: 100,
        element: element
    };
    if (window.showMessage) window.showMessage('🔱 你凝聚本命法宝「' + cd._bondedArtifact.name + '」，与其性命相连！', 'success');
    if (window.updateCharacterStatus) window.updateCharacterStatus();
    return true;
}

// 喂材料升级：消耗背包1个材料→exp+10，达阈值升级
function feedArtifact() {
    var cd = window.currentCharData;
    if (!cd || !cd._bondedArtifact) { if (window.showMessage) window.showMessage('你尚未炼制本命法宝。', 'warning'); return false; }
    var ba = cd._bondedArtifact;
    // 找背包第一个材料
    var matUid = null, slotIdx = -1, matTplId = null;
    try {
        if (window.inventory && window.inventory.slots) {
            for (var i = 0; i < window.inventory.slots.length; i++) {
                var sl = window.inventory.slots[i];
                if (sl && sl.templateId && window.itemById && window.itemById[sl.templateId] && window.itemById[sl.templateId].type === 'material') {
                    matUid = sl.uid; slotIdx = i; matTplId = sl.templateId; break;
                }
            }
        }
    } catch (e) {}
    if (!matUid) { if (window.showMessage) window.showMessage('背包无材料可喂。', 'warning'); return false; }
    // v25.6 扣材料**之前**先问器灵：多疑的会当场拒食（料不扣），贪食/性急顺带报一句鉴材与预告。
    // 判据必须在这道门里，挪到 removeItem 之后就晚了。
    var _gate = _flawFeedGate(ba, (window.itemById && matTplId && window.itemById[matTplId]) || null);
    if (_gate.refuse) {
        if (window.showMessage) window.showMessage('🫧 器灵「' + ((ba.spirit && ba.spirit.awakened) ? ba.spirit.name : '器灵') + '」把这一口推开了（多疑）：' + _gate.verdict, 'info');
        _flawBacklashNotice(_gate.rec);   // 拒食攒够三次就起疑——代价照样播，料是真没扣
        _refreshFlawCard();
        return false;   // 本次喂料未成立：材料没扣，账也没动（拒食那一笔已单独记在 rejectCount）
    }
    if (typeof window.removeItem === 'function') window.removeItem(matUid, 1);
    // 第六十二波：这口料是什么档，记进器身的材料账（ba.mats）——器灵的资格看的就是这本账。
    // 只留最高档那一件（「材有美」取其最精者），其余只累计喂过几回。纯数据，随 _bondedArtifact 整包往返。
    var _mg = _spiritMatGrade(matTplId);
    var _nm = _spiritNoteMat(ba, matTplId, (window.itemById && window.itemById[matTplId] && window.itemById[matTplId].name) || matTplId);
    ba.exp = (ba.exp || 0) + 10;
    var leveled = false;
    while (ba.exp >= ba.expMax && ba.level < 10) {
        ba.exp -= ba.expMax;
        ba.level += 1;
        ba.expMax = 50 + ba.level * 30;
        leveled = true;
    }
    if (leveled) {
        if (window.showMessage) window.showMessage('🔱 本命法宝「' + ba.name + '」升阶至 ' + ba.level + ' 阶！', 'success');
    } else {
        if (window.showMessage) window.showMessage('本命法宝吸纳材料，经验 +10（' + ba.exp + '/' + ba.expMax + '）', 'info');
    }
    // 第六十二波 · 材有美：喂进去的是几品料，屏上要看得见（也要看得见它够不够唤灵）
    if (window.showMessage) {
        var _why = (_nm.topGrade >= SPIRIT_AWAKEN_MIN_GRADE)
            ? '器身吃过的最高一档：' + (SPIRIT_GRADE_TEXT[_nm.topGrade] || '') + '·' + (_nm.topMatName || '') + '（共 ' + _nm.feeds + ' 回）——够格唤灵。'
            : '器身吃过的最高一档：' + (SPIRIT_GRADE_TEXT[_nm.topGrade] || '') + '·' + (_nm.topMatName || '') + '（共 ' + _nm.feeds + ' 回）'
              + '——离' + (SPIRIT_GRADE_TEXT[SPIRIT_AWAKEN_MIN_GRADE] || '上品级') + '还差一档，唤不醒器灵。';
        window.showMessage('🌱 这一口是' + (_gate.itemName || '这一口') + '，' + _mg.name + '（材级 ' + _mg.grade + '）。' + _why, 'info');
    }
    var _outKarma = false;
    // 第六十二波：主人德行若在逆道，器灵闭目不睁——喂料这条路径上如实播一句（不静默、不扣料）
    if (_outKarma) _spiritGoneNotice(ba);
    // v25.5 器灵同沾：法宝吃东西，器灵也跟着长见识
    var _rec = null, _gain = 0;
    if (ba.spirit && ba.spirit.awakened) {
        // v25.6 先算这一拍（好处 + 蓄势 + 反噬），再落经验——
        // 「相思入骨」要减的是这次的收益，必须在加之前算出 expMul；其余瑕疵的 expMul 恒为 1。
        _rec = spiritFlawBeat('feed', { itemName: _gate.itemName, qualityName: _gate.qualityName, feedsToNext: _gate.feedsToNext, verdict: _gate.verdict, line: _lovesickLine(ba.spirit.level || 1) });
        var _mul = (_rec && typeof _rec.expMul === 'number') ? _rec.expMul : 1;
        _gain = Math.floor(3 * _mul);
        ba.spirit.exp = (ba.spirit.exp || 0) + _gain;
        if (_spiritCheckLevelUp(ba)) _flawLevelUpRelief(ba);   // 器灵长了一岁见识 ⇒ 那本账当场清零
    }
    _flawReceipt(ba, _gate, _rec, _gain);
    if (window.updateCharacterStatus) window.updateCharacterStatus();
    _refreshFlawCard();
    return true;
}

// ==================== v25.5 器灵养成 ====================
// 文件头那句「觉醒技能/化形留后续扩展」的口子，这批接上：法宝攒到 3 阶可唤醒器灵，
// 唤醒后能交感（器灵随交感与喂料成长），器灵等级进战斗乘区（与法宝本体同一管道
// artifactCombatMul → battle.js _artifactMul），并解锁器灵声口。账挂 _bondedArtifact.spirit，
// 随本命法宝整体走 game-state.js 存档白名单（深拷贝往返），不新开键。
var SPIRIT_AWAKEN_COST = 200;      // 唤醒灵石
var SPIRIT_AWAKEN_MIN_LEVEL = 3;   // 法宝 3 阶起才可唤醒
var SPIRIT_MAX_LEVEL = 5;
var SPIRIT_NAMES = { neutral: '器灵', metal: '庚金之灵', wood: '青木之灵', water: '玄水之灵', fire: '离火之灵', earth: '后土之灵' };
// 声口按器灵等级递进：初醒只会哼，养深了能说整句
var SPIRIT_VOICES = [
    ['（器身微微震颤，一缕意念蹭过你的识海，还不成话。）', '「……嗡。」'],
    ['「主人。」器灵的声音清晰了些，「再来。」', '「我梦见了我还是一块矿石的时候。」'],
    ['「你的剑气比昨天稳。」器灵评点道，「不过收势还是急了半拍。」', '「等闲器物见了我，都要矮三分。」'],
    ['「我与性命相连，你伤则我伤。」器灵难得正经，「所以——别再拿我去挡刀了。」', '「什么时候带我去斩一条真龙？」'],
    ['「五百年后，或许我能化形。」器灵的声音里有笑意，「到时候，换我护你。」', '「天下器物千千万，我只认你一个主人。」']
];

function _spiritCheckLevelUp(ba) {
    if (!ba.spirit || !ba.spirit.awakened) return false;
    var leveled = false;
    while ((ba.spirit.exp || 0) >= (ba.spirit.expMax || 30) && ba.spirit.level < SPIRIT_MAX_LEVEL) {
        ba.spirit.exp -= ba.spirit.expMax;
        ba.spirit.level += 1;
        ba.spirit.expMax = 30 + ba.spirit.level * 20;
        leveled = true;
    }
    if (ba.spirit.level >= SPIRIT_MAX_LEVEL) ba.spirit.exp = Math.min(ba.spirit.exp || 0, (ba.spirit.expMax || 30) - 1);
    if (leveled && window.showMessage) {
        window.showMessage('✨ 器灵「' + ba.spirit.name + '」成长至 ' + ba.spirit.level + ' 级——法宝攻防加成又深一层（器灵 +' + (ba.spirit.level * 2) + '%）！', 'success');
    }
    return leveled;
}

// 唤醒器灵：法宝 3 阶起 + **器身吃进过上品级材料** + **主人不在逆道** + 灵石 200 + 一个时辰
// （第六十二波：后两道门是新加的资格线，详见上面「材料档位 + 主人德行」那段说明）
function awakenArtifactSpirit() {
    var cd = window.currentCharData;
    var ba = getBA();
    if (!cd || !ba) { if (window.showMessage) window.showMessage('你尚未炼制本命法宝。', 'warning'); return false; }
    if (ba.spirit && ba.spirit.awakened) { if (window.showMessage) window.showMessage('器灵「' + ba.spirit.name + '」早已醒着。', 'info'); return false; }
    // 三道门一次判完，第一道不过就报那一条——分文不扣、时辰不耗（既有断言钉着这条）
    var rdy = spiritAwakenReadiness();
    if (!rdy.ok) {
        if (window.showMessage) window.showMessage(rdy.why, 'warning');
        return false;
    }
    if (window.DataManager && window.DataManager.deductSpiritStones && !window.DataManager.deductSpiritStones(SPIRIT_AWAKEN_COST)) {
        if (window.showMessage) window.showMessage('唤醒器灵需 ' + SPIRIT_AWAKEN_COST + ' 灵石（引灵入器），钱袋不够。', 'warning');
        return false;
    }
    var mins = 60;   // 回执的时长由它生成
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') window.timeSystem.advanceTime(mins, '唤醒器灵');
    ba.spirit = {
        awakened: true,
        name: SPIRIT_NAMES[ba.element] || SPIRIT_NAMES.neutral,
        level: 1, exp: 0, expMax: 50
    };
    // 第六十二波：这具器的材料来路随器灵一并记下（《湛卢》「五金之英……寄气托灵」——
    //   灵醒在哪一档料上，日后器灵面板与存档里都能查到，不必玩家自己记）
    var m = _spiritMats(ba);
    ba.spirit.origin = m ? {
        topGrade: (Number(m.topGrade) || 0), gradeName: SPIRIT_GRADE_TEXT[(Number(m.topGrade) || 0)] || SPIRIT_GRADE_TEXT[0],
        topMat: m.topMat || null, topMatName: m.topMatName || '', feeds: (Number(m.feeds) || 0)
    } : { topGrade: -1, gradeName: '无料可考', topMat: null, topMatName: '', feeds: 0, legacy: true };
    // v25.6 醒来就带脾气：器灵不是一张空账，它睁眼那一刻已经有了自己的性子。
    // 按五行现派（零骰），落进 spirit.flaw，随 spirit 整体往返存档。
    ba.spirit.flaw = activeFlawKey(ba);
    flawLedger(ba);
    if (window.showMessage) {
        var _fd = SPIRIT_FLAWS[ba.spirit.flaw];
        window.showMessage('🔱 你以灵石为引、心血为媒——「' + ba.name + '」周身光华流转，一缕灵性睁开了眼！\n器灵「' + ba.spirit.name + '」苏醒（1 级）：法宝攻防 +' + (ba.spirit.level * 2) + '%，往后常与它交感，它会长大。\n'
            + (ba.spirit.origin.legacy
                ? '⚠️ ' + rdy.legacyNote + '\n'
                : '🌱 灵醒于' + ba.spirit.origin.gradeName + '之料「' + (ba.spirit.origin.topMatName || '—') + '」（共喂过 ' + ba.spirit.origin.feeds + ' 回）——凡铁不该有灵，这具器身吃得够格。\n')
            + '🫧 它的脾气是「' + _fd.name + '·' + _fd.epithet + '」：' + _fd.desc
            + '\n好处·' + _fd.boon.label + '：' + _fd.boon.text
            + '\n代价·' + _fd.backlash.label + '：' + _fd.backlash.text
            + '\n规避：' + _fd.avoid, 'success');
    }
    if (window.updateCharacterStatus) window.updateCharacterStatus();
    _refreshFlawCard();
    return true;
}

// 与器灵交感：耗时半个时辰，器灵长经验，附一句声口（按等级）
function communeWithSpirit() {
    var ba = getBA();
    if (!ba || !ba.spirit || !ba.spirit.awakened) { if (window.showMessage) window.showMessage('器灵未醒，交感无从谈起。', 'warning'); return false; }
    if (_spiritGone()) {
        _spiritGoneNotice(ba);
        if (window.showMessage) window.showMessage('🧘 你唤了它一声，没有回应——器灵闭目不睁，交感不成（经验与时辰一概未动）。', 'warning');
        return false;
    }
    var mins = 30;   // 回执的时长由它生成
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') window.timeSystem.advanceTime(mins, '与器灵交感');
    var gain = 10 + (ba.level || 1) * 2;
    // v25.6 这一拍先算：好处 + 蓄势 + 反噬。反噬若要减收益（相思入骨），
    // 必须在加经验之前拿到 expMul——放在之后就只剩「事后补救」一种写法，那会算错。
    var _rec = spiritFlawBeat('commune', { line: _lovesickLine(ba.spirit.level || 1) });
    if (_rec && typeof _rec.expMul === 'number') gain = Math.floor(gain * _rec.expMul);
    ba.spirit.exp = (ba.spirit.exp || 0) + gain;
    var leveled = _spiritCheckLevelUp(ba);
    if (leveled) _flawLevelUpRelief(ba);
    var pool = SPIRIT_VOICES[Math.min(SPIRIT_VOICES.length - 1, (ba.spirit.level || 1) - 1)];
    var voice = pool[Math.floor(Math.random() * pool.length)];
    if (window.showMessage && !leveled) {
        window.showMessage('🧘 你与器灵「' + ba.spirit.name + '」心意交感（经验 +' + gain + '，' + ba.spirit.exp + '/' + ba.spirit.expMax + '）。\n' + voice, 'info');
    }
    _flawAfter(ba, _rec);
    if (window.updateCharacterStatus) window.updateCharacterStatus();
    _refreshFlawCard();
    return true;
}

// 战斗加成倍率（供 buildPlayerBattleEntity 调用）：法宝每阶 +5% 攻防；v25.5 器灵每级再 +2%
// ⚠️ v25.6 器灵性格/瑕疵**绝不进这个函数**。它只认 level 与 spirit.level ——
// 性格若也乘进来，玩家就会把「挑一件好脾气的器灵」当成第二条升级线，
// 性格便从「这枚器灵是什么脾气」退化成「这个数更大」。
// 第六十二波：多一道 **主人德行** 的判据（_spiritGone，纯读口）。它同样不是性格、不是好感度，
// 而且只收走器灵那 +2%/级——器物与本体每阶 +5% 分毫未动（去无道以就有道，来得及就回来）。
function artifactCombatMul() {
    var ba = getBA();
    if (!ba) return 1.0;
    var mul = 1 + (ba.level - 1) * 0.05;
    if (_spiritGone()) return mul;
    if (ba.spirit && ba.spirit.awakened) mul += (ba.spirit.level || 0) * 0.02;
    return mul;
}

// ==================== v25.6 器灵瑕疵：性格 / 反噬 ====================
// v25.5 把器灵接上了养成，代价是它只有一条线：等级进 artifactCombatMul 的同一个乘区。
// 那个口径的意思是「器灵越大越强」——它没法表达「这枚器灵是暴戾的／护主的／狡黠的」。
// 本批补上**不带战力**的那一层：性格只改「表现」与「代价」。
//
// 三条纪律，改之前先读：
// ① 好处一律不进 mul，也不给器灵经验（经验→等级→+2%/级⇒绕一圈还是战力）。好处只落在
//    信息 / 资源 / 时间 / 选择 四域。
// ② 反噬零骰：全部是确定性条件判定（计数器 + 阈值），同条件必得同结果。
// ③ 存档不开新键：flaw 与它的账都塞进 _bondedArtifact.spirit，随 game-state.js:336 那条
//    JSON 整包深拷贝往返。不注册 StateRegistry、不往 game-state.js 加键名。
//
// 读口纪律：本批所有「只想读」的地方一律走 peekBA()，不碰 getBA()——
// getBA() 的第 10 行在字段缺失时会把 cd._bondedArtifact 写成 null（见 :7-12），
// 只想读却改了角色档，是本仓反复出现的那类脏。

var FLAW_ORDER = ['glutton', 'hasty', 'bloodthirst', 'lovesick', 'suspicious'];

// 五行派脾气：器灵名字本来就从 ba.element 取（SPIRIT_NAMES），玩家已经建立
// 「离火之灵＝火」这条因果，把脾气挂到同一条因上，玩家不用背表。
// 阈值全是设计值——一轮/一天内会出现一次，不会一分钟三连；无实测战斗数据支撑。
var SPIRIT_FLAWS = {
    glutton: {
        key: 'glutton', name: '贪食', epithet: '见料就吞',
        meter: 'heat', limit: 3,
        onFeed: 1, onCommune: -1, onKill: 0, onRefuse: 0,
        desc: '它把喂进来的每一口都当成自己的饭。炼化之前先尝一口，尝完才肯出力。',
        boon: { label: '鉴材', text: '喂料时它先报出这一口料的名字与品阶——你从此知道自己喂了什么。' },
        backlash: { label: '空腹夺食', text: '连着三顿没跟它说过话，它饿昏了头，一口把这次该长的见识吞干净（器灵经验不入账），器身也磕掉一块。' },
        avoid: '喂两次就与它交感一次——它吃饱了就不抢；或温养换一副脾气。'
    },
    hasty: {
        key: 'hasty', name: '性急', epithet: '不等你开口',
        meter: 'heat', limit: 2,
        onFeed: 1, onCommune: -1, onKill: 0, onRefuse: 0,
        needSpiritLevel: 3,
        desc: '它嫌你慢。你刚把料递过去，它已经在下一次的火候上了。',
        boon: { label: '预告', text: '喂料时它先替你算好「再喂几次能升一阶」——它只肯给你确定的数。' },
        backlash: { label: '躁起', text: '它等不及，先替你把下次的功夫做了。时辰白白流走十分，器身又磕掉一块。（器灵 3 级起才躁得动）' },
        avoid: '喂一次就交感一次把它的火压下去；或温养。'
    },
    bloodthirst: {
        key: 'bloodthirst', name: '嗜血', epithet: '见血则喜',
        meter: 'killStreak', limit: 3,
        onFeed: 0, onCommune: -1, onKill: 1, onRefuse: 0,
        desc: '你杀人，它饮血。一场仗打下来，它比你还清楚自己添了几笔。',
        boon: { label: '尝血', text: '每斩一人，它把连杀数报给你听——第几个，谁也没它记得清。' },
        backlash: { label: '杀红了眼', text: '连斩三人，它顺着血气反噬上来，从你自己身上啃下一口血。' },
        avoid: '连斩到两个就收手；或与它交感一次静心；或温养。'
    },
    lovesick: {
        key: 'lovesick', name: '痴情', epithet: '只念旧人',
        meter: 'heat', limit: 4,
        onFeed: 1, onCommune: 1, onKill: 0, onRefuse: 0,
        desc: '它记得自己还是一块料时的光景，也记得是谁把它从炉里叫醒的。你陪它越多，它越想从前。',
        boon: { label: '念旧', text: '每次喂料或交感，它都要念一句自己的来历——你慢慢听得出一枚器的前世。' },
        backlash: { label: '相思入骨', text: '缠得久了，它分了心——这次长出来的见识只进一半（向下取整），器身也磕掉一块。' },
        avoid: '注意它的「念旧」栏：连着四次互动就该停手歇歇；或温养。⚠️ 这一条交感**不减**它的账——陪得越多，它越难过，这是它本来的意思。'
    },
    suspicious: {
        key: 'suspicious', name: '多疑', epithet: '谁都像有鬼',
        meter: 'rejectCount', limit: 3,
        onFeed: 0, onCommune: 0, onKill: 0, onRefuse: 1,
        desc: '它不信你会一直用它。凡是配不上这具器身的料，它一口都不肯碰。',
        boon: { label: '把关', text: '低品阶的料它当场拒食——材料不扣回你袋里，你也不会白喂。' },
        backlash: { label: '起疑', text: '连拒三回，它认定你要另炼新器，索要一笔「看押」灵石，还要拿器身撒气。' },
        avoid: '喂对口味的料（不拒食就不记账）；或温养。'
    }
};

// 五行 → 瑕疵键。neutral 没有因，退到法宝名上（唯一真正不可变的字段：level 还会长，
// 用它派脾气会让玩家的「脾气」随升级漂移，那是 bug 不是特性）。
var FLAW_BY_ELEMENT = { wood: 'glutton', earth: 'hasty', fire: 'bloodthirst', water: 'lovesick', metal: 'suspicious' };

function _neutralFlawKey(name) {
    var s = String(name == null ? '本命法宝' : name), h = 0, i;
    for (i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 9973;
    return FLAW_ORDER[h % FLAW_ORDER.length];
}

// 纯读口：不调 getBA()，字段缺失只返回 undefined，绝不在只读路径上写角色档。
function peekBA() {
    var cd = window.currentCharData;
    if (!cd) return null;
    var ba = cd._bondedArtifact;
    if (!ba || typeof ba !== 'object') return null;
    return ba;
}

// 性格键：档里有就用档里的（温养改过 / 旧档已被某次写动作固化过）；
// 没有就按五行**现算**。现算不写盘 —— 只读路径永远不该留下写痕。
function activeFlawKey(ba) {
    if (ba && ba.spirit && typeof ba.spirit.flaw === 'string' && SPIRIT_FLAWS[ba.spirit.flaw]) return ba.spirit.flaw;
    if (!ba) return null;
    if (!ba.spirit || !ba.spirit.awakened) return null;
    var el = ba.element;
    if (FLAW_BY_ELEMENT[el]) return FLAW_BY_ELEMENT[el];
    return _neutralFlawKey(ba.name);
}

// 写口径：只有真的要改账时才建 ledger / 固化 flaw。
function flawLedger(ba) {
    var sp = ba.spirit;
    var st = sp._flawState;
    if (!st || typeof st !== 'object') st = sp._flawState = {};
    if (typeof st.heat !== 'number') st.heat = 0;
    if (typeof st.killStreak !== 'number') st.killStreak = 0;
    if (typeof st.rejectCount !== 'number') st.rejectCount = 0;
    if (typeof st.backlashCount !== 'number') st.backlashCount = 0;
    if (!SPIRIT_FLAWS[sp.flaw]) sp.flaw = activeFlawKey(ba);   // 旧档在这一刻才被固化，此前一直现算
    return st;
}

// 器灵升一级 = 它长了一岁见识，气量也大一点 ⇒ 该脾气的那本账当场清零。
// 这是「不花钱的规避口」：喂到它升级，账就干净了。
function _flawLevelUpRelief(ba) {
    var sp = ba && ba.spirit;
    if (!sp || !sp._flawState) return;
    var def = SPIRIT_FLAWS[activeFlawKey(ba)];
    if (!def) return;
    sp._flawState[def.meter] = 0;
}

var TEMPER_STONES = 120;   // 温养看押灵石（设计值）
var TEMPER_MINUTES = 60;   // 温养耗时一个时辰（设计值）

// 器灵脾气全貌（公开读口，纯读，不写盘）
function spiritFlawProfile() {
    var ba = peekBA();
    var out = {
        active: false, hasArtifact: false, awakened: false, key: null, name: '', epithet: '', desc: '',
        boon: null, backlash: null, avoid: '', meter: '', meterValue: 0, limit: 0,
        backlashCount: 0, durability: null, maxDurability: null, spiritLevel: 0,
        nextKey: null, nextName: '', temperCost: TEMPER_STONES, temperMinutes: TEMPER_MINUTES
    };
    if (!ba) return out;
    out.hasArtifact = true;
    out.durability = (typeof ba.durability === 'number') ? ba.durability : null;
    out.maxDurability = (typeof ba.maxDurability === 'number') ? ba.maxDurability : null;
    if (!ba.spirit || !ba.spirit.awakened) return out;
    var key = activeFlawKey(ba), def = SPIRIT_FLAWS[key];
    if (!def) return out;
    var st = ba.spirit._flawState || {};
    out.active = true;
    out.key = key; out.name = def.name; out.epithet = def.epithet; out.desc = def.desc;
    out.boon = def.boon; out.backlash = def.backlash; out.avoid = def.avoid;
    out.meter = def.meter; out.limit = def.limit;
    out.meterValue = (typeof st[def.meter] === 'number') ? st[def.meter] : 0;
    out.backlashCount = (typeof st.backlashCount === 'number') ? st.backlashCount : 0;
    out.spiritLevel = ba.spirit.level || 1;
    var ni = (FLAW_ORDER.indexOf(key) + 1) % FLAW_ORDER.length;
    out.nextKey = FLAW_ORDER[ni];
    out.nextName = SPIRIT_FLAWS[out.nextKey].name;
    return out;
}

// ==================== 反噬的三个代价口袋 ====================
// 三个都是本仓已有的账，不新开键，且都不走 mul：
//   器身耐久 ba.durability —— forgeBondedArtifact 就写了 100，此前全仓无人读它（死字段），本批把它接上；
//   自身气血 cd.health / cd.maxHealth —— app.js:11482 与 city-gate.js:99-101 用的就是这一对；
//   灵石 window.DataManager.deductSpiritStones —— 本文件 :23/:126 已在用同一个口。
// 气血一律留 1 点底：反噬不该在面板外把人打死（city-gate.js:101 同款守卫），扣了多少如实报多少。
function _spendDurability(ba, n) {
    if (!ba || !(n > 0)) return 0;
    var cap = (typeof ba.maxDurability === 'number' && ba.maxDurability > 0) ? ba.maxDurability : 100;
    var cur = (typeof ba.durability === 'number') ? ba.durability : cap;
    var real = Math.min(n, cur);
    ba.durability = Math.max(0, cur - real);
    return real;
}

function _spendHealth(frac, floor) {
    var cd = window.currentCharData;
    if (!cd) return 0;
    var max = Number(cd.maxHealth);
    var cur = Number(cd.health);
    if (!isFinite(max) || max <= 0 || !isFinite(cur)) return 0;
    var want = Math.max(floor || 3, Math.round(max * (frac || 0.05)));
    var real = Math.min(want, Math.max(0, cur - 1));   // 留 1 点底
    if (real <= 0) return 0;
    cd.health = cur - real;
    return real;
}

// ==================== 消费脊柱：spiritFlawBeat ====================
// 所有性格消费都从这里过。返回值是可编程的账，不是文案：
//   { flaw, name, beat, boon:{label,text}|null, backlash:{label,cost,text}|null }
// 无器灵 / 无脾气时返回 null（调用方自己判）。
// ⚠️ 零骰：全部计数器 + 阈值，同一串输入必得同一串输出。
function spiritFlawBeat(beat, payload) {
    var ba = peekBA();
    if (!ba || !ba.spirit || !ba.spirit.awakened) return null;
    var key = activeFlawKey(ba), def = SPIRIT_FLAWS[key];
    if (!def) return null;
    var st = flawLedger(ba);
    var data = payload || {};
    var rec = { flaw: key, name: def.name, beat: beat, boon: null, backlash: null, expMul: 1 };

    // ① 好处（表现层）：纯信息/资源，绝不给经验、绝不给战力
    if (def.boon) rec.boon = { label: def.boon.label, text: _flawBoonLine(def, beat, data) };

    // ② 蓄势：按 beat 增减该脾气的那本账
    var d = 0;
    if (beat === 'feed') d = def.onFeed || 0;
    else if (beat === 'commune') d = def.onCommune || 0;
    else if (beat === 'kill') d = def.onKill || 0;
    else if (beat === 'refuse') d = def.onRefuse || 0;
    if (d) {
        var v = (st[def.meter] || 0) + d;
        st[def.meter] = Math.max(0, Math.min(def.limit + 2, v));   // 上界留 2 格余量，免得计数器无限涨
        rec.meter = def.meter;
        rec.meterValue = st[def.meter];
    }

    // ③ 反噬（代价层）：确定性阈值判定，触发即清零本账
    if (st[def.meter] >= def.limit && (!def.needSpiritLevel || (ba.spirit.level || 1) >= def.needSpiritLevel)) {
        var cost = _flawBacklash(ba, def, st, data);
        st[def.meter] = 0;
        st.backlashCount = (st.backlashCount || 0) + 1;
        // expMul 是「本次器灵经验怎么算」的乘子，必须在加经验**之前**定下来：
        //   贪食 空腹夺食 → 0（一口吞干净，回执上写着「不入账」，代码就得真不入账）
        //   痴情 相思入骨 → 0.5（只进一半，floor 取整）
        if (def.key === 'lovesick') cost.expMul = 0.5;
        if (def.key === 'glutton') cost.expMul = 0;
        rec.expMul = (typeof cost.expMul === 'number') ? cost.expMul : 1;
        rec.backlash = { label: def.backlash.label, cost: cost, text: _flawBacklashText(def, cost, ba) };
    }
    return rec;
}

// 嗜血的反噬是唯一挂在战斗节拍上的：条件只有「连斩三人」一条，纯计数。
function _flawBacklash(ba, def, st, data) {
    if (def.key === 'bloodthirst') {
        var lost = _spendHealth(0.05, 3);
        var dur = _spendDurability(ba, 4);
        return { health: lost, durability: dur };
    }
    if (def.key === 'suspicious') {
        var took = 0;
        if (window.DataManager && typeof window.DataManager.deductSpiritStones === 'function') {
            took = window.DataManager.deductSpiritStones(TEMPER_STONES - 70) ? (TEMPER_STONES - 70) : 0;
            // 扣不动就如实记 0：反噬不许因为玩家没钱就变成免罚（那等于暗改规则）
        }
        var d2 = _spendDurability(ba, 2);
        return { stones: took, durability: d2 };
    }
    var d3 = _spendDurability(ba, def.key === 'glutton' ? 5 : (def.key === 'hasty' ? 3 : 2));
    if (def.key === 'hasty') {
        if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
            window.timeSystem.advanceTime(10, '器灵躁起');
        }
        return { minutes: 10, durability: d3 };
    }
    return { durability: d3 };
}

function _flawBacklashText(def, cost, ba) {
    var tail = [];
    if (cost && cost.health) tail.push('自身气血 −' + cost.health);
    if (cost && cost.durability) tail.push('器身耐久 −' + cost.durability + '（' + ba.durability + '/' + ba.maxDurability + '）');
    if (cost && cost.stones) tail.push('灵石 −' + cost.stones);
    if (cost && cost.minutes) tail.push('时辰 −' + cost.minutes + ' 分');
    if (cost && cost.expMul != null) tail.push('本次器灵经验 ×' + cost.expMul + '（' + ((ba.spirit && ba.spirit.level) ? ba.spirit.level : 1) + ' 级那一份'
        + (cost.expMul === 0 ? '一口吞干净，不入账' : '减半') + '）');
    if (!tail.length) tail.push('（这一回它没能真咬着你——账照记）');
    return '【' + def.backlash.label + '】' + def.backlash.text + '\n代价：' + tail.join('；') + '。';
}

// 好处那一行的具体文案：真正带着本次数据，不是一句摆在那儿的形容。
function _flawBoonLine(def, beat, data) {
    if (def.key === 'glutton' && beat === 'feed') {
        return '它先舔了一口：「' + (data.itemName || '这一口') + '」——' + (data.qualityName || '品阶看不出来');
    }
    if (def.key === 'hasty' && beat === 'feed') {
        var n = Number(data.feedsToNext);
        if (isFinite(n) && n > 0) return '它抢着报数：「再喂 ' + n + ' 次，我就能自己上一层。」';
        return '它抢着报数：「再喂下去我就能自己上一层了。」';
    }
    if (def.key === 'bloodthirst' && beat === 'kill') {
        var k = Number(data.streak);
        return '它把血舔干净了：「第 ' + (isFinite(k) ? k : '?') + ' 个。」';
    }
    if (def.key === 'lovesick') {
        return (data.line || def.boon.text);
    }
    if (def.key === 'suspicious' && beat === 'feed') {
        return (data.verdict || def.boon.text);
    }
    return def.boon.text;
}

// ---- 器灵品阶（鉴材 / 把关用）----
var FLAW_GRADE_TEXT = { 1: '九品', 2: '八品', 3: '七品', 4: '六品', 5: '五品', 6: '四品', 7: '三品', 8: '二品', 9: '一品' };
// 只认 items.js:755 挂出的那张九品表。查不到 order 就**不下判**——
// 拿别的字段（比如物品自己的 level）硬凑一个品阶，会把「把关」变成瞎猜。
function _flawGrade(tpl) {
    var out = { name: (tpl && tpl.name) ? String(tpl.name) : null, order: null, text: '' };
    if (!tpl || typeof tpl !== 'object') return out;
    var q = tpl.quality, tbl = window.ITEM_QUALITIES;
    if (q && tbl && tbl[q] && typeof tbl[q] === 'object') {
        if (typeof tbl[q].order === 'number') out.order = tbl[q].order;
        out.text = tbl[q].name || String(q);
    } else if (q) {
        out.text = String(q);
    }
    if (!out.text && out.order) out.text = FLAW_GRADE_TEXT[out.order] || ('第' + out.order + '品');
    return out;
}

// 痴情念旧：按器灵等级取句，五级五段（零骰——同等级必得同句）。
var LOVESICK_LINES = [
    '「我记不清是谁开的炉了。只记得那一下，火候差一分。」',
    '「主人，你手里这把，比我上一任主人凶。」',
    '「那年我被埋在土里三百年。有人把我挖出来的时候，天正下着雨。」',
    '「我从前也想过回去看看那座炉子。后来就忘了——忘了才跟得上你。」',
    '「我如今只认得你一个人的手。别人的，我不动。」'
];
function _lovesickLine(spLevel) {
    var i = Math.max(1, Math.min(LOVESICK_LINES.length, Math.floor(spLevel || 1))) - 1;
    return LOVESICK_LINES[i];
}

// ==================== 喂料闸门（扣材料**之前**问一句） ====================
// 多疑的瑕疵要在这门口生效：拒食时材料**不能扣**，所以判据必须早于 removeItem。
// 返回 { refuse, verdict, itemName, qualityName, feedsToNext, expMul }
// expMul 是给「相思入骨」用的（本次器灵经验只进一半），不是给好处用的。
function _flawFeedGate(ba, tpl, spiritExpGain) {
    var g = _flawGrade(tpl);
    var need = (ba.spirit && ba.spirit.expMax ? ba.spirit.expMax : 50) - (ba.spirit && typeof ba.spirit.exp === 'number' ? ba.spirit.exp : 0);
    var out = {
        refuse: false, verdict: '', itemName: g.name, qualityName: g.text,
        feedsToNext: (need > 0 && ba.level < 10) ? Math.ceil(need / 10) : -1,
        expMul: 1
    };
    var key = activeFlawKey(ba), def = SPIRIT_FLAWS[key];
    if (!def) return out;

    if (def.key === 'suspicious') {
        var lvl = ba.level || 1;
        if (g.order != null && g.order < lvl) {
            out.refuse = true;
            out.verdict = '它一口不碰：「' + (g.name || '这一口') + '」只有' + (g.text || ('第' + g.order + '品'))
                + '，配不上这具' + lvl + '阶的器身——料还你，我不吃。」';
            // 拒食要记账、要能攒到起疑：所以在这一步就走消费脊柱（扣料之前）。
            var _rc = spiritFlawBeat('refuse', { verdict: out.verdict });
            out.rec = _rc;
        } else if (g.order != null) {
            out.verdict = '它验过了：「' + (g.name || '这一口') + '」' + (g.text || '') + '，够格。」';
        } else {
            out.verdict = '它对着这口料嗅了嗅，认不出品阶，暂且按下不表。';
        }
    }
    return out;
}

// ==================== 温养：让性格不是一纸判决 ====================
// 反噬若不可改，玩家只有「忍着」一种选择——那不叫取舍叫惩罚。
// 温养把脾气顺移到 FLAW_ORDER 的下一键，账全清；不给任何数值好处（不送经验/等级/灵石），
// 换的只是玩家的处置权。
function temperSpiritFlaw() {
    var ba = peekBA();
    if (!ba || !ba.spirit || !ba.spirit.awakened) {
        if (window.showMessage) window.showMessage('器灵未醒，无从温养。', 'warning');
        return false;
    }
    var st = flawLedger(ba);
    var oldKey = ba.spirit.flaw, oldDef = SPIRIT_FLAWS[oldKey];
    var ni = (FLAW_ORDER.indexOf(oldKey) + 1) % FLAW_ORDER.length;
    var newKey = FLAW_ORDER[ni], newDef = SPIRIT_FLAWS[newKey];
    if (window.DataManager && typeof window.DataManager.deductSpiritStones === 'function'
        && !window.DataManager.deductSpiritStones(TEMPER_STONES)) {
        if (window.showMessage) window.showMessage('温养器灵需 ' + TEMPER_STONES + ' 灵石（以灵石温它，脾气才肯换），钱袋不够。', 'warning');
        return false;
    }
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(TEMPER_MINUTES, '温养器灵');
    }
    ba.spirit.flaw = newKey;
    st.heat = 0; st.killStreak = 0; st.rejectCount = 0;
    // backlashCount 不清：那是历史，抹掉就等于这枚器灵从没闹过脾气。
    if (window.showMessage) {
        window.showMessage('🕯 你以 ' + TEMPER_STONES + ' 灵石、一个时辰的工夫，把「' + ba.spirit.name + '」的脾气从头捂了一遍。\n'
            + '旧脾气「' + (oldDef ? oldDef.name : oldKey) + '」退去，新脾气是「' + newDef.name + '·' + newDef.epithet + '」——'
            + newDef.desc + '\n好处：' + newDef.boon.label + '（' + newDef.boon.text + '）\n'
            + '代价：' + newDef.backlash.label + '（' + newDef.backlash.text + '）\n规避：' + newDef.avoid,
            'success');
    }
    if (window.updateCharacterStatus) window.updateCharacterStatus();
    _refreshFlawCard();
    return true;
}

// ==================== 消费口①：真击杀（EventBus，不碰 battle.js） ====================
// battle.js:4720 emit('enemy:defeated', {...}) 是全仓唯一击杀真源；
// audio-synth / continue-save / bounty-board / sects-system 四家已在订它，本批是第五家。
// 不改 battle.js 一个字就拿到了真战斗节拍。
function _flawOnEnemyDefeated(data) {
    try {
        var cd = window.currentCharData;
        var sp = cd && cd._bondedArtifact && cd._bondedArtifact.spirit;
        if (!sp || !sp.awakened) return;
        var st = sp._flawState || {};
        var rec = spiritFlawBeat('kill', {
            name: (data && (data.enemyId || data.species)) || '那一个',
            streak: (st.killStreak || 0) + 1
        });
        if (!rec) return;
        if (rec.boon && window.showMessage) {
            window.showMessage('⚔️ ' + ((data && (data.enemyId || data.species)) || '敌人') + ' 倒下了。器灵「' + sp.name + '」'
                + rec.boon.label + '：' + rec.boon.text
                + '（连斩 ' + ((sp._flawState || {}).killStreak || 0) + '）', 'info');
        }
        _flawBacklashNotice(rec);
        _refreshFlawCard();
    } catch (e) {
        console.warn('[器灵瑕疵] 击杀消费口出错（战斗结算本身不受影响）· ' + (e && e.message ? e.message : e));
    }
}

// ==================== 消费口②：器灵脾气卡（挂在修炼面板上） ====================
// cultivation.js:2031 导出 updateCultivationUI，:408 往 #cultivation-panel 写整块 HTML。
// 本批**不改 cultivation.js 一个字**，只把它的函数包一层，渲染完再把脾气卡插到同一个容器最前。
// 脚本顺序保证包装时对方已挂好：仙侠.html:2069 cultivation.js → :2321 bonded-artifact.js。
// DOM 用 data-* 标记而不是 .id —— static-check.py:52 禁止动态 id 撞静态 id。
function _flawCardHtml(p) {
    var meterName = { heat: '憋着的劲', killStreak: '连斩', rejectCount: '拒食' }[p.meter] || '账';
    var meterTxt = p.limit
        ? meterName + ' ' + p.meterValue + ' / ' + p.limit + '（到 ' + p.limit + ' 就反噬）'
        : meterName + ' ' + p.meterValue;
    var durTxt = (p.durability == null) ? '' : ('　器身耐久 ' + p.durability + '/' + (p.maxDurability == null ? '?' : p.maxDurability));
    return ''
        + '<div class="flex items-center justify-between mb-1">'
        + '<span class="text-sm font-bold text-amber-300">🫧 器灵脾气 · ' + p.name + '「' + p.epithet + '」</span>'
        + '<span class="text-xs text-amber-200/80">' + meterTxt + '　累计反噬 ' + p.backlashCount + ' 次' + durTxt + '</span>'
        + '</div>'
        + '<p class="text-xs text-gray-300 leading-relaxed mb-1">' + p.desc + '</p>'
        + '<p class="text-xs text-emerald-300 leading-relaxed">好处·' + p.boon.label + '：' + p.boon.text + '</p>'
        + '<p class="text-xs text-rose-300 leading-relaxed">代价·' + p.backlash.label + '：' + p.backlash.text + '</p>'
        + '<p class="text-xs text-gray-400 leading-relaxed">规避：' + p.avoid + '</p>'
        + '<div class="flex gap-2 mt-2">'
        + '<button onclick="window.temperSpiritFlaw()" class="bg-amber-700 hover:bg-amber-600 text-white px-3 py-1 rounded text-xs">温养（'
        + p.temperCost + '灵石 / ' + (p.temperMinutes / 60) + '时辰 → 换成「' + p.nextName + '」）</button>'
        + '<span class="text-[10px] text-gray-500 self-center">温养只换脾气，不送经验、不送等级、不送战力。</span>'
        + '</div>';
}

function _refreshFlawCard() {
    if (typeof document === 'undefined') return false;
    var host = document.getElementById('cultivation-panel');
    if (!host) return false;   // 修炼面板没开（那个节点是 openCultivationUI 现场造的）
    var p = spiritFlawProfile();
    var old = host.querySelector('[data-spirit-flaw]');
    if (old && old.parentNode) old.parentNode.removeChild(old);
    if (!p.active) return false;
    var box = document.createElement('div');
    box.setAttribute('data-spirit-flaw', '1');
    box.className = 'bg-amber-900/30 p-3 rounded border border-amber-600/50 mb-2';
    box.innerHTML = _flawCardHtml(p);
    host.insertBefore(box, host.firstChild);
    return true;
}

function _mountFlawCard() {
    var orig = window.updateCultivationUI;
    if (typeof orig !== 'function' || orig.__spiritFlawWrapped) return false;
    var wrapped = function () {
        var out = orig.apply(this, arguments);
        try { _refreshFlawCard(); }
        catch (e) { console.warn('[器灵瑕疵] 脾气卡渲染失败（修炼面板其余部分照常）· ' + (e && e.message ? e.message : e)); }
        return out;
    };
    wrapped.__spiritFlawWrapped = true;
    window.updateCultivationUI = wrapped;
    return true;
}

// ==================== 回执拼装：好处与反噬都要玩家看见 ====================
// 规则：**一处好处只播一次；代价永远单独一条消息**。
// 反噬若藏在「顺便」两个字里，玩家只会觉得法宝变弱，不会觉得这是他自己的选择；
// 好处若与反噬同处一行，两件事就互相抵消了。
function _flawBoon(ba, rec) {
    if (!rec || !rec.boon || !window.showMessage) return false;
    window.showMessage('🫧 器灵「' + ((ba && ba.spirit && ba.spirit.name) || '器灵') + '」·' + rec.boon.label + '：' + rec.boon.text, 'info');
    return true;
}

function _flawBacklashNotice(rec) {
    if (!rec || !rec.backlash || !window.showMessage) return false;
    window.showMessage('⚠️ 反噬（' + rec.name + '）：' + rec.backlash.text, 'warning');
    if (window.updateCharacterStatus) window.updateCharacterStatus();
    return true;
}

function _flawAfter(ba, rec) {
    if (!rec) return false;
    var out = _flawBoon(ba, rec);
    return _flawBacklashNotice(rec) || out;
}

// 喂料那一条专用：把「鉴材/预告/把关/念旧」与「器灵同沾 +N」并进同一段回执。
// 好处只在 _flawAfter 里播一次（回执不再重复 verdict），反噬也在那里单独播。
function _flawReceipt(ba, gate, rec, gain) {
    var bits = [];
    // 多疑的「够格 / 验不过」判定就是它的好处文案，已由 _flawAfter 播过 → 这里不重复
    if (gate && gate.verdict && (!rec || rec.flaw !== 'suspicious')) bits.push(gate.verdict);
    if (ba.spirit && ba.spirit.awakened) {
        bits.push('器灵「' + ba.spirit.name + '」同沾，见识 +' + gain
            + '（' + (ba.spirit.exp || 0) + '/' + (ba.spirit.expMax || 50) + '）'
            + (rec && rec.expMul != null && rec.expMul !== 1 ? '　⚠️ 相思入骨，本次收益减半' : '') + '。');
    }
    if (bits.length && window.showMessage) window.showMessage('🫧 ' + bits.join('\n'), 'info');
    _flawAfter(ba, rec);
    return true;
}

// ==================== 第六十二波 · 器灵觉醒的前置：材料档位 + 主人德行 ====================
// 旧口径（v25.5）：法宝 3 阶 + 200 灵石。阶数是**消费进度**，不是资格——喂够次数就买得到一件「有灵」的器。
// 《吴越春秋·阖闾内传》把话说在另一头：
//   「一名湛卢，五金之英，太阳之精，★寄气托灵，出之有神，服之有威★
//     ……然人君有★逆理之谋，其剑即出★，故★去无道以就有道★。」
// ⇒ ① 觉醒的资格看**材料档位**：凡铁不该有灵（「材有美」是《考工记》四要素的头一条）。
//   ② 器灵认的是**主人德行**，不是好感度。德行字段本项目早就有：**currentCharData.karma**
//   （−100~100，app.js:3439 七档；app.js:7770 九档标签；core/karma-retribution.js 管它的报应），
//   本文件直接读它，不新造道德系统。
//   阈值沿用 app.js:2074 与 building-effects.js:561 同一条线（karma < −50），不另立标准。
//
// ⚠️ 材料档位的来路说明（本批最要紧的一条设计约束，写在这里免得后来人以为我在发明什么）：
//   forgeBondedArtifact() 只收 300 灵石，**根本不耗材料**（唯一调用点 cultivation.js:539 不带材料参数，
//   而 cultivation.js 不在本批可改范围内）。所以「炼出来的是什么材料」在项目里没有字段。
//   器身唯一能吃进材料的动作是 feedArtifact() —— 它每回从行囊里取一件料喂。
//   **那就是材料的来路**：喂进去的料决定这具器身的品性。
//   档位查 window.ForgingCompound.MATERIAL_GRADE（权威表在 forging-compound.js:223 一处，本文件只读）。
//   真实局内不会出现「阶数到了却一件料没喂过」：法宝阶数**只能**由 feedArtifact 的经验喂上去
//   （1 阶→3 阶至少 16 次喂料），而喂料第一笔就会写下 ba.mats。

var SPIRIT_AWAKEN_MIN_GRADE = 3;    // 材料档位门槛：品阶 3（秘银/雷晶/妖丹/龙骨/陨铁）及以上才养得出灵
var SPIRIT_AWAKEN_MIN_KARMA = -50;  // 主人德行门槛：与 app.js:2074 / building-effects.js:561 同一条线（逆理之谋）
var SPIRIT_GRADE_TEXT = ['粗铁级', '下品级', '中品级', '上品级', '珍品级', '五行级'];

// 材档查表（只读 ForgingCompound 的权威 MATERIAL_GRADE；查不到＝粗铁级，绝不往高了猜）
function _spiritMatGrade(matId) {
    var FC = window.ForgingCompound;
    var row = FC && FC.MATERIAL_GRADE ? FC.MATERIAL_GRADE[matId] : null;
    var g = row ? (Number(row.grade) || 0) : 0;
    return { matId: matId, grade: g, level: row ? (Number(row.level) || 0) : 0, name: SPIRIT_GRADE_TEXT[g] || SPIRIT_GRADE_TEXT[0] };
}
// 器身的材料账（纯读口）：ba.mats 为空＝这具器一件料也没吃过（＝旧档，从未喂过）。
function _spiritMats(ba) {
    if (!ba) return null;
    return (ba.mats && typeof ba.mats === 'object') ? ba.mats : null;
}
// 喂料时记一笔：只留最高档那件（「材有美」取其最精者），其余只累计次数。
function _spiritNoteMat(ba, matId, matName) {
    if (!ba) return null;
    var m = ba.mats;
    if (!m || typeof m !== 'object') m = ba.mats = { topGrade: -1, topMat: null, topMatName: '', feeds: 0 };
    if (typeof m.feeds !== 'number') m.feeds = 0;
    m.feeds++;
    var g = _spiritMatGrade(matId);
    if (g.grade > (Number(m.topGrade) || -1)) {
        m.topGrade = g.grade;
        m.topMat = matId;
        m.topMatName = matName || g.matId;
    }
    return m;
}

// 唤醒三道门的自述（纯读口，不写盘）：材料门 / 德行门 / 阶数门，各自带「为什么不行、怎么办」。
// ⚠️ 材料账为空（旧档／本批之前就养着的器）按旧例放行一次，**并在回执里说清为什么**——
//   这不是暗门：真实局内喂过料的器必然有 ba.mats（见上面那段来路说明），这一支只服务旧档。
function spiritAwakenReadiness() {
    var out = {
        ok: false, hasArtifact: false, level: 0, levelOk: false, levelNeed: SPIRIT_AWAKEN_MIN_LEVEL,
        mats: null, grade: -1, gradeOk: false, gradeNeed: SPIRIT_AWAKEN_MIN_GRADE, gradeName: '',
        legacyNoMats: false, legacyNote: '',
        karma: 0, karmaOk: false, karmaNeed: SPIRIT_AWAKEN_MIN_KARMA, karmaText: '中立',
        cost: SPIRIT_AWAKEN_COST, reason: '', why: ''
    };
    var ba = peekBA();
    if (!ba) { out.reason = 'no-artifact'; out.why = '你尚未炼制本命法宝。'; return out; }
    out.hasArtifact = true;
    out.level = ba.level || 1;
    out.levelOk = out.level >= SPIRIT_AWAKEN_MIN_LEVEL;
    var m = _spiritMats(ba);
    if (!m) {
        out.legacyNoMats = true;
        out.gradeOk = true;
        out.legacyNote = '此器无料可考（本批之前养的旧器／未曾喂料）——本回从旧例放行；'
            + '此后喂料即按材料论，凡铁级料喂不出灵。';
    } else {
        out.mats = m;
        out.grade = (Number(m.topGrade) || -1) < 0 ? 0 : Number(m.topGrade);
        out.gradeOk = out.grade >= SPIRIT_AWAKEN_MIN_GRADE;
        out.gradeName = m.topMatName || '';
    }
    var cd = window.currentCharData;
    var k = cd && typeof cd.karma === 'number' && isFinite(cd.karma) ? cd.karma : 0;
    out.karma = k;
    out.karmaOk = k >= SPIRIT_AWAKEN_MIN_KARMA;
    // 德行口播沿用游戏自己的说法（app.js:3439 那张表），不另编称谓
    out.karmaText = k <= -75 ? '大恶' : k < -50 ? '恶' : k < -25 ? '偏邪' : k < 0 ? '微邪'
        : k < 25 ? '中立' : k < 50 ? '微善' : k < 75 ? '善' : '大善';
    // 判定次序＝玩家在屏上会依次撞到的次序；第一道不过就停，后面不必挨个报（省得一次刷四条）
    if (!out.levelOk) {
        out.reason = 'level-low';
        out.why = '法宝才 ' + out.level + ' 阶，灵性未足——喂材料升到 ' + SPIRIT_AWAKEN_MIN_LEVEL + ' 阶，器灵才唤得醒。';
    } else if (!out.gradeOk) {
        out.reason = 'mat-low';
        out.why = '喂进去的料最高只到' + (SPIRIT_GRADE_TEXT[out.grade] || SPIRIT_GRADE_TEXT[0])
            + '（' + (out.gradeName || '记不清') + '）——凡铁不该有灵（《考工记》「材有美」是四要素头一条）。'
            + '要唤得醒，器身至少得吃进一件' + (SPIRIT_GRADE_TEXT[SPIRIT_AWAKEN_MIN_GRADE] || '上品级')
            + '以上的料（秘银、雷晶、妖丹、龙骨、陨铁一路）。';
    } else if (!out.karmaOk) {
        out.reason = 'karma-low';
        out.why = '因果 ' + k + '（' + out.karmaText + '）——主人有逆理之谋，其剑即出（《吴越春秋·阖闾内传》）。'
            + '去无道以就有道：因果回到 ' + SPIRIT_AWAKEN_MIN_KARMA + ' 以上再来唤醒。';
    } else {
        out.ok = true;
        out.reason = 'ok';
        out.why = '材料' + (out.legacyNoMats ? '（无料可考，从旧例放行）' : SPIRIT_GRADE_TEXT[out.grade] + '·' + out.gradeName)
            + '、因果 ' + k + '（' + out.karmaText + '）——两条都过，器灵唤得醒（' + SPIRIT_AWAKEN_COST + ' 灵石 + 一个时辰）。';
    }
    return out;
}

// 器灵出走（《吴越春秋》「然人君有逆理之谋，其剑即出」）：
//   主人因果跌进逆道，器灵就不肯再出那一份力——只收走器灵每级的 +2%，**器物与本体加成一律不动**。
//   纯读口；德行回来它就回来（不是永久损失）；本函数不含任何「好感度」概念。
function _spiritGone() {
    var ba = peekBA();
    if (!ba || !ba.spirit || !ba.spirit.awakened) return false;
    var cd = window.currentCharData;
    var k = cd && typeof cd.karma === 'number' && isFinite(cd.karma) ? cd.karma : 0;
    return k < SPIRIT_AWAKEN_MIN_KARMA;
}
function _spiritGoneNotice(ba) {
    if (!window.showMessage) return;
    var sp = (ba && ba.spirit) || {};
    var cd = window.currentCharData;
    var k = cd && typeof cd.karma === 'number' && isFinite(cd.karma) ? cd.karma : 0;
    window.showMessage('🫧 器灵「' + (sp.name || '器灵') + '」闭目不睁——主人因果 ' + k + '（魔道/邪道），'
        + '「人君有逆理之谋，其剑即出」（《吴越春秋·阖闾内传》）。它不再为你那份每级 +2% 的力出力，'
        + '器灵本身与法宝本体（每阶 +5%）分毫未损。去无道以就有道，因果一回来它就回来。', 'warning');
}

window.forgeBondedArtifact = forgeBondedArtifact;
window.feedArtifact = feedArtifact;
window.artifactCombatMul = artifactCombatMul;
window.getBA = getBA;
window.awakenArtifactSpirit = awakenArtifactSpirit;
window.communeWithSpirit = communeWithSpirit;
window.SPIRIT_AWAKEN_COST = SPIRIT_AWAKEN_COST;
window.SPIRIT_AWAKEN_MIN_LEVEL = SPIRIT_AWAKEN_MIN_LEVEL;
// 第六十二波：觉醒资格三门的对外读口（材料档位 / 主人德行 / 旧器宽限）
window.SPIRIT_AWAKEN_MIN_GRADE = SPIRIT_AWAKEN_MIN_GRADE;
window.SPIRIT_AWAKEN_MIN_KARMA = SPIRIT_AWAKEN_MIN_KARMA;
window.SPIRIT_GRADE_TEXT = SPIRIT_GRADE_TEXT;
window.spiritAwakenReadiness = spiritAwakenReadiness;
window.spiritGone = _spiritGone;

// v25.6 器灵瑕疵的对外口
window.SPIRIT_FLAWS = SPIRIT_FLAWS;
window.FLAW_ORDER = FLAW_ORDER;
window.spiritFlawProfile = spiritFlawProfile;
window.spiritFlawBeat = spiritFlawBeat;
window.temperSpiritFlaw = temperSpiritFlaw;
window.SPIRIT_TEMPER_STONES = TEMPER_STONES;

// 消费口①：真击杀。EventBus 在 html:2047 先于本文件（:2321）加载，订得上。
// 单次订阅守卫：与 _mountFlawCard 同理，这个文件理论上只会被 eval 一次，
// 但若哪天真被重复载入（热重载／将来有人插一行二次 import），双份 listener 会让连斩翻倍。
if (window.EventBus && typeof window.EventBus.on === 'function' && !window._spiritFlawKillHooked) {
    try {
        window.EventBus.on('enemy:defeated', _flawOnEnemyDefeated);
        window._spiritFlawKillHooked = true;
    } catch (e) { console.warn('[器灵瑕疵] enemy:defeated 订阅失败（嗜血一条暂时不消费，其余四条不受影响）· ' + (e && e.message ? e.message : e)); }
}
// 消费口②：器灵脾气卡（包一层修炼面板刷新，不改 cultivation.js）
_mountFlawCard();

})();
