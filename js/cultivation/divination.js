// ==================== divination.js - 天机推演/占卜 ====================
// v20.0 2.19 落地；v20.39 做深：一按钮单卦 → 四问卦阵（命/事/灾/人）。
// 卦道纪律：卦不欺人——灾问读日历真约、人问读道侣真所在、事问读行情真价，
// 凡占出来的都是账上有的；命问才涉气运增减。卦不编造，与节日余波同一宪法。
// 代价：灵石 100 + 耗时半日；天机浑浊，一日只占一卦。
// 依赖：1.5 气运、DataManager、WorldCalendar（灾）、npcManager（人）、locationSystem（事）

(function () {

var COST = 100;

function _today() {
    try {
        if (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') {
            return Number(window.timeSystem.getAbsoluteDay()) || 0;
        }
    } catch (e) {}
    return 0;
}

// 公共门槛：元婴+/灵石/一日一卦/时辰账。过了才许起卦。
function _gate() {
    var cd = window.currentCharData;
    if (!cd) { if (window.showMessage) window.showMessage('请先创建角色', 'warning'); return null; }
    var tier = (typeof window.getRealmTier === 'function') ? window.getRealmTier(cd.realm) : 0;
    if (tier < 4) { if (window.showMessage) window.showMessage('元婴方可感应天机。', 'warning'); return null; }
    if (window._lastDivinationDay === _today()) {
        if (window.showMessage) window.showMessage('天机浑浊——一日只占一卦，改日再来。', 'warning');
        return null;
    }
    if (window.DataManager && window.DataManager.deductSpiritStones && !window.DataManager.deductSpiritStones(COST)) {
        if (window.showMessage) window.showMessage('起卦需 ' + COST + ' 灵石布置卦阵。', 'warning');
        return null;
    }
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(30, '起卦问天机');
    }
    window._lastDivinationDay = _today();
    return cd;
}

// ============ 命问：气运卦（五档，各三变——同一结果不复读） ============
var FORTUNE_HEX = {
    top2: [
        '乾为天·飞龙在天——卦象六爻皆阳，天机清明如洗。',
        '火天大有·顺天休命——大有者，所有之大也。此卦照命，无往不利。',
        '地天泰·小往大来——天地交而万物通，上下交而其志同。'
    ],
    top: [
        '风雷益·损上益下——木道乃行，利有攸往。',
        '水风井·寒泉食人——井养不穷，所汲者深。',
        '雷水解·赦过宥罪——雷雨作而百果草木皆甲坼。'
    ],
    mid: [
        '艮为山·兼山艮——时止则止，时行则行。宜静修，不宜妄动。',
        '坤为地·厚德载物——地势坤，君子以厚德载物。守成为上。',
        '山水蒙·童蒙求我——匪我求童蒙，童蒙求我。宜问道，不宜问路。'
    ],
    low: [
        '坎为水·习坎重险——水洊至，习坎。行险而不失其信——慎之。',
        '泽水困·致命遂志——困而不失其所亨，唯君子能之。近日宜避祸。',
        '水山蹇·见险能止——蹇利西南，不利东北。往蹇来誉。'
    ],
    bottom: [
        '天地否·否之匪人——天地不交，万物不通。天机混沌，大凶之兆。',
        '山地剥·不利有攸往——山附于地，剥。顺势而止，强进必伤。',
        '泽风大过·栋桡之象——栋桡，利有攸往，亨——然非大勇不可当。'
    ]
};

function _hexOf(pool) {
    var arr = FORTUNE_HEX[pool] || FORTUNE_HEX.mid;
    return arr[Math.floor(Math.random() * arr.length)];
}

// 命问：卦象显气运（保留原五档效果，文案三变不复读）
function divineFortune() {
    var cd = _gate();
    if (!cd) return false;
    var luck = (cd.luck != null ? cd.luck : 50);
    var roll = Math.random() * 100;
    var score = luck + roll * 0.3;
    var msg = '🔮 卦象显现——';
    if (score >= 120) {
        cd.luck = Math.min(100, luck + 8);
        cd._customPillBuff = { attack: 8, days: 1 };
        msg += _hexOf('top2') + '\n上上卦！气运+8，战意大盛（攻击+8%一日）。';
    } else if (score >= 90) {
        cd.luck = Math.min(100, luck + 5);
        msg += _hexOf('top') + '\n上卦。机缘将至，气运+5。';
    } else if (score >= 60) {
        cd.luck = Math.min(100, luck + 2);
        msg += _hexOf('mid') + '\n中卦。气运+2，宜静修。';
    } else if (score >= 30) {
        msg += _hexOf('low') + '\n下卦。气运平平，慎防小人。';
    } else {
        cd.luck = Math.max(0, luck - 3);
        msg += _hexOf('bottom') + '\n下下卦！气运-3，近日宜避祸。';
    }
    if (window.showMessage) window.showMessage(msg, 'info');
    if (window.updateCharacterStatus) window.updateCharacterStatus();
    return true;
}

// ============ 事问：行情卦（读本城物价真账） ============
function divineMarket() {
    var cd = _gate();
    if (!cd) return false;
    var msg = '🔮 你焚香问商——';
    var city = '', sell = NaN, buy = NaN;
    try {
        if (typeof window.getCurrentCityName === 'function') city = window.getCurrentCityName() || '';
        var ls = window.locationSystem;
        if (ls && typeof ls.getCityPriceModifier === 'function') {
            sell = Number(ls.getCityPriceModifier(city, 'sell'));
            buy = Number(ls.getCityPriceModifier(city, 'buy'));
        }
    } catch (e) {}
    if (!city) {
        msg += '卦中城郭朦胧——你身在野外，占不得市价。';
    } else if (isFinite(sell) && sell > 1.05) {
        msg += '火雷噬嗑·日中为市。「' + city + '」此刻货值走高（行价×' + sell.toFixed(2) + '）——有货，宜售于此城。';
    } else if (isFinite(buy) && buy < 0.95) {
        msg += '风火家人·富家大吉。「' + city + '」此刻货价偏低（行价×' + buy.toFixed(2) + '）——欲购，宜趁此时。';
    } else {
        msg += '坤卦持世，平平之象。「' + city + '」物价无波，不贵不贱，买卖随心。';
    }
    if (window.showMessage) window.showMessage(msg, 'info');
    return true;
}

// ============ 灾问：日历真约（未来三日，卦不编造） ============
function divineDanger() {
    var cd = _gate();
    if (!cd) return false;
    var msg = '🔮 你焚香问灾——';
    var today = _today();
    var upcoming = [];
    try {
        if (window.WorldCalendar && typeof window.WorldCalendar.list === 'function') {
            upcoming = window.WorldCalendar.list({ fromDay: today, toDay: today + 3 }) || [];
        }
    } catch (e) {}
    if (!upcoming.length) {
        msg += '坎卦不见，风平浪静——三日之内，历上无劫。安心便是。';
    } else {
        var lines = [];
        for (var i = 0; i < upcoming.length && lines.length < 2; i++) {
            var ev = upcoming[i];
            var in_days = ev.dueAbsoluteDay - today;
            var when = in_days <= 0 ? '今日之内' : (in_days === 1 ? '明日' : '后日');
            lines.push(when + '：' + (ev.title || '一桩应期之事'));
        }
        msg += '卦得震为雷——有声自远方来。三日之内，卦上应着：\n' + lines.join('\n') +
            '\n（卦只指路，应不应、怎么应，在你自己。）';
    }
    if (window.showMessage) window.showMessage(msg, 'info');
    return true;
}

// ============ 人问：道侣所在（读名册真账） ============
function divinePerson() {
    var cd = _gate();
    if (!cd) return false;
    var msg = '🔮 你焚香问人——';
    var bonds = cd.bonds || {};
    var ids = [];
    for (var k in bonds) if (bonds[k] && bonds[k].type === 'dao_companion') ids.push(k);
    if (!ids.length) {
        msg += '卦中无人——你名册上尚无道侣，这一卦，无从问起。';
        if (window.showMessage) window.showMessage(msg, 'info');
        return true;
    }
    var lines = [];
    for (var i = 0; i < ids.length; i++) {
        var id = ids[i];
        var name = bonds[id].name || id;
        var loc = '';
        try {
            var npc = window.npcManager && window.npcManager.getNPC ? window.npcManager.getNPC(id) : null;
            loc = (npc && npc.location) ? npc.location : '';
        } catch (e) {}
        lines.push('「' + name + '」' + (loc ? '——卦象指处：' + loc + '。' : '——卦象朦胧，方位难辨。'));
    }
    msg += '风山渐·鸿渐于陆。你心中所念之人，卦上分明：\n' + lines.join('\n') +
        '\n（卦指所在，去不去、见不见，在你。）';
    if (window.showMessage) window.showMessage(msg, 'info');
    return true;
}

// ============ 卦阵入口：四问选一 ============
function openDivination() {
    var cd = window.currentCharData;
    if (!cd) { if (window.showMessage) window.showMessage('请先创建角色', 'warning'); return false; }
    var tier = (typeof window.getRealmTier === 'function') ? window.getRealmTier(cd.realm) : 0;
    if (tier < 4) { if (window.showMessage) window.showMessage('元婴方可感应天机。', 'warning'); return false; }
    if (typeof window.showModal !== 'function') return divineFortune(); // 无弹窗环境兜底直占命卦
    var btn = 'class="bg-violet-800 hover:bg-violet-700 text-violet-100 text-xs px-3 py-2 rounded text-left w-full"';
    window.showModal('🔮 天机卦阵',
        '<p class="text-xs text-gray-400 mb-3">起卦一卦：灵石 ' + COST + '，耗时半日，一日一卦。<br>卦道纪律——卦不欺人：灾问、人问、事问，占的都是账上真事。</p>'
        + '<div style="display:flex;flex-direction:column;gap:8px">'
        + '<button onclick="window.divineFortune && window.divineFortune(); this.closest(\'#xianxia-modal-overlay\').remove();" ' + btn + '>☰ 问命——气运卦（气运增减，上上卦带战意）</button>'
        + '<button onclick="window.divineMarket && window.divineMarket(); this.closest(\'#xianxia-modal-overlay\').remove();" ' + btn + '>☱ 问事——行情卦（本城物价高低，真账实价）</button>'
        + '<button onclick="window.divineDanger && window.divineDanger(); this.closest(\'#xianxia-modal-overlay\').remove();" ' + btn + '>☳ 问灾——应期卦（未来三日，历上真约）</button>'
        + '<button onclick="window.divinePerson && window.divinePerson(); this.closest(\'#xianxia-modal-overlay\').remove();" ' + btn + '>☴ 问人——方位卦（道侣所在，名册真账）</button>'
        + '</div>');
    return true;
}

window.divineFortune = divineFortune;
window.divineMarket = divineMarket;
window.divineDanger = divineDanger;
window.divinePerson = divinePerson;
window.openDivination = openDivination;

})();
