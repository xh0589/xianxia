// ==================== solar-terms.js - 二十四节气：一年三百六十日的刻度 ====================
// 依赖：timeSystem.onNewDaySubscribe / getAbsoluteDay、core/world-calendar.js（登记，不裁决不发奖）
// 纪律：日历是索引，不是发钱口。这里一件东西都不发给玩家——
//   改前 tickSolarTerm 每 15 日 `cd.luck += 1`：零玩家动作、零世界因，
//   而 cd.luck 真被 app.js 的打坐奇遇率读着（0.05×(0.5+luck/100)）——
//   那是「无叙事依据的人为计数器」（强制规则第 10 行）的教科书样本，已删。
// 现在节气做三件事，且三件都落在世界这一侧：
//   ① 玩家看得见：把当日与随后几个节气登记进世界日程表（日程面板 60 天窗口里真的画出来）
//      —— 纪律照抄 js/city-facilities/festival-calendar.js：只 register，不裁决，不发奖。
//   ② 坊市看得见：window.getCurrentSolarTerm() 是真消费口（js/enhanced-shop.js 当令货单按它换）
//   ③ 季节不打架：节气起点与真季节轴同源，见下面 originFromDay 的注释。
(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    // ★ 起点为什么是 day-1：真季节轴在 js/time-system.js:158 是
    //   monthsPassed = floor((currentDay - 1) / 30)，季界落在第 91/181/271/361 日；
    //   而本文件改前是 floor(day % 360 / 15)，节气界落在第 90/180/270/360 日。
    //   两者差一天 ⇒ 立夏/立秋/立冬/立春那一天读成上一个季节（一年四天自相矛盾）。
    //   改这里（而不是改 time-system.js）有两个理由：
    //     · currentMonth 被十来处消费（randomMap 的 ford/water、weather-effects、炼器季节轴、
    //       节庆、门派危机……），挪它的起点会波及全库季节判定；
    //     · 节气起点挪一天，24 个节气**全部**落进正确季节（每季 90 日 = 6 个节气，边界严丝合缝），
    //       而 currentMonth 一个字都不动。
    var TERM_DAYS = 15;      // 一节气十五日
    var YEAR_DAYS = 360;     // 一年二十四节气

    // 二十四节气：note 是这个节气里人在哪儿、干什么（不是「你的兜里多几块料」）；
    // stock 是坊市当令货单（真实物品 id，逐个现读物品账，缺货就不摆）
    var SOLAR_TERMS = [
        { name: '立春', note: '东风解冻，冻土开锄。备耕的种子与农具这半个月最好卖', stock: ['spirit_grass', 'iron_ore', 'qi_recovery_pill'] },
        { name: '雨水', note: '雨贵如油，挑种下田。挑得好的种子开春就活', stock: ['spirit_grass', 'linen_robe', 'iron_ore'] },
        { name: '惊蛰', note: '蛰虫始动，采药人上山。头一茬药材都是这半个月里的', stock: ['ginseng', 'lingzhi', 'spirit_grass'] },
        { name: '春分', note: '昼夜均分，分秧插田。这半个月田里离不开人', stock: ['spirit_grass', 'cloth_shoes', 'qi_recovery_pill'] },
        { name: '清明', note: '祭扫踏青。城里街上挤满了不上山的人，山里的药这半个月没人采', stock: ['vitality_pill', 'spirit_restoring_pill', 'cloth_hat'] },
        { name: '谷雨', note: '雨生百谷。采药的最好时候，也是最湿的时候', stock: ['lingzhi', 'ginseng', 'spirit_grass'] },
        { name: '立夏', note: '万物并秀，暑气将起。防暑的丹与遮头的帽子开始上货', stock: ['spirit_restoring_pill', 'vitality_pill', 'cloth_hat'] },
        { name: '小满', note: '麦粒渐满未熟。农具与夏衣在这半个月换一批', stock: ['iron_ore', 'linen_robe', 'spirit_restoring_pill'] },
        { name: '芒种', note: '有芒的麦子该收，有芒的稻子该种。抢收抢种的半个月，街上没人闲逛', stock: ['iron_ore', 'cloth_shoes', 'qi_recovery_pill'] },
        { name: '夏至', note: '白昼最长，午时最烈。采药得赶早晚，正午的草药烧手', stock: ['vitality_pill', 'spirit_restoring_pill', 'spirit_grass'] },
        { name: '小暑', note: '暑气渐盛。躲暑的丹药与凉水在这半个月最抢手', stock: ['spirit_restoring_pill', 'vitality_pill', 'cloth_hat'] },
        { name: '大暑', note: '一年最热。坊市午后歇市，出摊的多在日头偏西才回来', stock: ['spirit_restoring_pill', 'vitality_pill', 'linen_robe'] },
        { name: '立秋', note: '一叶知秋，秋收的镰与冬储的粮开始备', stock: ['iron_ore', 'spirit_grass', 'linen_robe'] },
        { name: '处暑', note: '暑气至此而止。贴秋膘的肉食与补气的丹上了架', stock: ['vitality_pill', 'spirit_restoring_pill', 'spirit_grass'] },
        { name: '白露', note: '露凝为白，进山的人多起来。带足干粮与伤药', stock: ['linen_robe', 'vitality_pill', 'iron_ore'] },
        { name: '秋分', note: '丰收之月，祭月开市。一年的余粮与灵材都在这两周里出坊', stock: ['spirit_stone', 'vitality_pill', 'cloth_hat'] },
        { name: '寒露', note: '寒露脚不露。寒衣与鞋帽这几天翻着卖', stock: ['linen_robe', 'cloth_shoes', 'cloth_hat'] },
        { name: '霜降', note: '霜降收仓，开炉炼器。炉料与家伙这半个月最紧', stock: ['iron_ore', 'dragon_bone', 'iron_sword'] },
        { name: '立冬', note: '藏冬储粮。进山的人少了，山货却在这半个月最齐', stock: ['vitality_pill', 'iron_ore', 'spirit_grass'] },
        { name: '小雪', note: '封洞腌菜。坊市上多的是过冬的东西，不是新鲜货', stock: ['linen_robe', 'spirit_restoring_pill', 'vitality_pill'] },
        { name: '大雪', note: '大雪封路。远行的商队停了，坊上出的都是囤下来的陈货', stock: ['vitality_pill', 'iron_ore', 'linen_robe'] },
        { name: '冬至', note: '冬至大如年。闭关冲关的人多，筑基与凝金的丹紧俏', stock: ['foundation_pill', 'golden_core_pill', 'vitality_pill'] },
        { name: '小寒', note: '数九寒天。能出门的人都在备年货', stock: ['vitality_pill', 'spirit_restoring_pill', 'cloth_shoes'] },
        { name: '大寒', note: '岁末封市。年前最后一批货，卖完就等来年', stock: ['iron_ore', 'iron_sword', 'foundation_pill'] }
    ];

    function _currentDay() {
        try {
            if (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') {
                return Number(window.timeSystem.getAbsoluteDay()) || 0;
            }
            if (window.timeSystem && window.timeSystem.gameTime) return Number(window.timeSystem.gameTime.currentDay) || 0;
        } catch (e) {}
        try {
            if (typeof window.getAbsoluteDay === 'function') return Number(window.getAbsoluteDay()) || 0;
        } catch (e2) {}
        return 0;
    }
    // 与真季节轴同源的起点：第 1 日＝立春当天（不是第 0 日）
    function originFromDay(day) {
        var d = Math.floor(Number(day) || 0) - 1;
        return d < 0 ? 0 : d;
    }
    function termIndexOfDay(day) {
        return Math.floor(originFromDay(day) / TERM_DAYS) % SOLAR_TERMS.length;
    }
    function termStartDay(day) {
        var o = originFromDay(day);
        return o - (o % TERM_DAYS) + 1;
    }
    function termYear(day) {
        return Math.floor(originFromDay(day) / YEAR_DAYS) + 1;
    }
    // 当日节气的完整一份（名字/日序/这一年第几天/起始日/在做什么/当令货单）
    function currentTermProfile(day) {
        var d = (day == null) ? _currentDay() : Number(day);
        if (!(d >= 1)) return null;
        var t = SOLAR_TERMS[termIndexOfDay(d)];
        if (!t) return null;
        return {
            name: t.name,
            index: termIndexOfDay(d),
            day: d,
            startDay: termStartDay(d),
            daysIn: TERM_DAYS,
            year: termYear(d),
            nextInDays: TERM_DAYS - (originFromDay(d) % TERM_DAYS),
            note: t.note,
            stock: (t.stock || []).slice()
        };
    }
    // 坊市当令货单：逐个现读物品账，读不到的不摆（不拿编的货名占摊）
    function termStock(day) {
        var p = currentTermProfile(day);
        var out = [];
        if (!p) return out;
        var lib = window.itemById || {};
        for (var i = 0; i < p.stock.length; i++) {
            var id = p.stock[i];
            var it = lib[id];
            if (!it) continue;              // 物品账不在册就不摆这货
            out.push({ id: id, name: it.name || id, type: it.type || 'material', price: Number(it.price) || 0, note: p.note });
        }
        return out;
    }

    // ---- ① 登记进世界日程表：只 register，不裁决、不发奖 ----
    // 照抄 festival-calendar.js 的纪律（日历是索引，事在城里、制度里、人身上）。
    // 登记失败（表不在册 / 同 id 已在 / 类目不在白名单）一律静默跳过：节气照旧只是刻度。
    var CAL_REGISTERED_AHEAD = 4;    // 当日往后预登记几个（日程面板 60 天窗口够看）
    function registerTermWindow(day) {
        try {
            var WC = window.WorldCalendar;
            if (!WC || typeof WC.register !== 'function') return 0;
            var d = (day == null) ? _currentDay() : Number(day);
            if (!(d >= 1)) return 0;
            var n = 0;
            for (var k = 0; k <= CAL_REGISTERED_AHEAD; k++) {
                var target = termStartDay(d) + k * TERM_DAYS;
                var idx = termIndexOfDay(target);
                var t = SOLAR_TERMS[idx];
                if (!t) continue;
                var r = WC.register({
                    id: 'solar_term_' + t.name + '_d' + target,
                    title: (k === 0 ? '节气·' + t.name + '（今日）' : '节气·' + t.name + '（第 ' + target + ' 日）')
                        + '：' + t.note,
                    category: 'other',
                    dueAbsoluteDay: target,
                    source: { system: 'solar-terms', refId: 'term_' + idx },
                    severity: 'info',
                    oneShot: true,
                    payload: null          // ★ 不带任何 payload：日历绝不往玩家兜里塞东西
                });
                if (r && r.ok) n++;
            }
            return n;
        } catch (eCal) { return 0; }
    }

    // 日结：只做两件事——把刻度念出来、把往后的节气登记上。
    // ★ 这里没有 cd.luck += 1：一个节气不给你发气运，它给你的是「今天世界在干什么」。
    function tickSolarTerm() {
        try {
            var p = currentTermProfile();
            if (!p) return null;
            registerTermWindow(p.day);
            if (window.gameLog && typeof window.gameLog.add === 'function') {
                window.gameLog.add('🌾 ' + p.name + '：' + p.note + '（今日节令，货也按这半个月的行情摆）', 'info');
            }
            return p;
        } catch (e) { return null; }
    }

    if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') {
        window.timeSystem.onNewDaySubscribe(tickSolarTerm);
    }
    // ★ 表被清空（开新局/读档 reset）后自己把刻度补回来：不然开新局那一刻玩家打开日程面板，
    //   二十四个节气一条都不在——「日历只是索引」不等于「索引可以不记」。
    //   补登记是幂等的（同一个 id 第二次 register 会被拒，拒了就当已登记）。
    if (window.EventBus && typeof window.EventBus.on === 'function') {
        window.EventBus.on('worldCalendar:reset', function () {
            try { registerTermWindow(); } catch (eReset) {}
        });
    }

    window.getCurrentSolarTerm = function () {
        var p = currentTermProfile();
        return p ? p.name : '';
    };

    var API = {
        TERM_DAYS: TERM_DAYS,
        YEAR_DAYS: YEAR_DAYS,
        table: SOLAR_TERMS,
        names: SOLAR_TERMS.map(function (t) { return t.name; }),
        currentTermProfile: currentTermProfile,
        termStock: termStock,
        termIndexOfDay: termIndexOfDay,
        termStartDay: termStartDay,
        registerTermWindow: registerTermWindow,
        tickSolarTerm: tickSolarTerm
    };
    window.SolarTerms = API;
    window.XianXia = window.XianXia || {};
    window.XianXia.SolarTerms = API;

    // 加载即把往后几个节气登记上（第 1 日也有刻度，不靠翻日才出现）
    try { registerTermWindow(); } catch (eBoot) {}

})();
