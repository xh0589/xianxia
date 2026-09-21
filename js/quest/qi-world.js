// ==================== qi-world.js - 《灵气之尽》世界层 ====================
// v25.0 推倒重写 · 批一：灵气枯竭实装——总闸降档 / 枯脉八城 / 城景三段式 / 枯萎图 / 倒计时 / 时间副推进
// 纪律：账本有倒计时（三年=1080日）；世界不等玩家（每180日主线未推进则额外枯一城）；
//       通知每档只报一次（不刷屏）；最后一条脉（灵脉尽头）永不随时间枯——她说「本座等你想明白」，最后一条脉她留给你；
//       全部状态走 eventFlags（零新增存档键），浓度改写在 QI_CONCENTRATION 活对象上、读档时重放。
// 详稿：详稿·第一批·世界层与序幕.md A 节（文本逐字对齐）
(function () {
    'use strict';
    var W = window;

    var CITY_ORDER = ['大漠孤城', '冰原城', '万毒谷', '青木城', '剑阁', '炎城', '洛水城', '帝都·长安'];

    // 总闸四档（序幕100→一幕80→二幕55→三幕30；结局分流批五接）
    var STAGE_QI = [100, 80, 55, 30];
    var STAGE_NOTICE = [
        '',
        '🌫️ 天地灵气薄了一分。你清晨行功，头一回觉得气机里有些「不够」——像住进了一间正在慢慢漏气的屋子。茶馆里有人说：大漠孤城那边，整条脉死透了。',
        '🌫️ 这一回不是错觉。灵田收成减半，丹炉凉得比往常快，飞舟在两城之间多走了半日。说书人开场加了新词：「天地灵气，如老人之息——出得多，进得少。」台下一片死寂，没人接话。',
        '🌫️ 城外大阵的灯，暗成了豆子色。你吸一口气，入体的气稀得像粥。九州的人都知道：再这么下去，人间要变成凡人的人间了。'
    ];

    // 城景三段式（初枯/中期废/后期空），逐字对齐详稿 A4
    var CITY_SCENES = {
        '大漠孤城': [
            '大漠孤城：沙漠里的井还是甜的，空气里的气却没了。驼队把最后一车灵砂运出城，没人收——收灵砂的人比灵砂先没了行情。',
            '大漠孤城：长街两旁的铺子关了一半。客栈招牌还写着「灵气充盈」四个字，叫风沙磨成了笑话。',
            '大漠孤城：城里只剩驼铃。最后一户井户搬去南边了——井还在，喝井水的人走了。'
        ],
        '冰原城': [
            '冰原城：常年不化的冰镜开始缩。采冰心的老人说：冰没了魂，只剩下冷。',
            '冰原城：满城冰灯一盏接一盏熄了。孩子们管这里叫「灯死掉的城」。',
            '冰原城：冰化成了湖，湖是死水。有人在湖边支摊子卖清水——冰原城的人，头一回花钱买水。'
        ],
        '万毒谷': [
            '万毒谷：毒雾薄了三成。药商在街口放了一挂鞭——放完才回过味来：雾里的灵药，跟着毒一起枯了。',
            '万毒谷：毒不毒、药不药了。谷里的人开始往外搬，万毒的牌位没人上香。',
            '万毒谷：如今名副其实地没了毒——连毒都活不下去的地方，只剩空谷，和风。'
        ],
        '青木城': [
            '青木城：城门口的千年樟树一夜掉了半树的叶。樵夫捡起一片揣进怀里——叶子死了，还有半点香气。',
            '青木城：木行改行了：木料没了灵，雕出来的舟不浮水。',
            '青木城：樟树倒了。树桩上盖起了一圈矮房，有人在桩子上刻了一行字：「此处曾有树，树会说话。」'
        ],
        '剑阁': [
            '剑阁：山上万剑齐鸣了一次。老剑仆听着听着跪下了：剑气散了——剑还在，剑魂自己找活路去了。',
            '剑阁：开山收留各方流民。剑修收了剑，拿起锄头——剑不能劈山了，锄头还能开田。',
            '剑阁：剑冢上立着最后一柄剑，没人拔。剑柄上刻了一行新字，不知是谁刻的：「剑埋我，我不埋剑。」'
        ],
        '炎城': [
            '炎城：火山口的火矮了三丈。铁匠们高兴省了炭——没人去想火为什么矮。',
            '炎城：火脉凉了，炉子里炼出来的铁发脆。一半铁匠铺关张，另一半改打农具。',
            '炎城：下了头一场雪。雪落在冷的炉口上，孩子们伸手去接——他们没见过自己城的火。'
        ],
        '洛水城': [
            '洛水城：洛水没瘦，气瘦了。渔家的网拉上来，鱼还是鱼，不值灵石了。',
            '洛水城：画舫停了曲。琴师们去了南边——据说南边还有气。',
            '洛水城：洛水成了凡间的河。浣衣的妇人在河边捶打衣裳，声音传得很远——这座城从没这么安静过，也从没这么热闹过。'
        ],
        '帝都·长安': [
            '帝都·长安：国师三日没上朝。宫门口的九龙灵柱暗了——宫里的人最先知道，最后承认。',
            '帝都·长安：城里灵石贵了，米也贵了。富人买石，穷人买米——两拨人在同一个柜台前排队，谁也不看谁。',
            '帝都·长安：长安还是长安，市声如旧，人声如旧。只是街上修士没了——这座城终于彻底成了凡人的城。百姓们说不清这是不是坏事。'
        ]
    };

    function flags() { return (W.eventFlags = W.eventFlags || {}); }
    function absDay() {
        try { return W.timeSystem && W.timeSystem.getAbsoluteDay ? W.timeSystem.getAbsoluteDay() : 0; } catch (e) { return 0; }
    }
    function log(m, t) {
        if (W.gameLog && W.gameLog.add) W.gameLog.add(m);
        else if (W.showMessage) W.showMessage(m, t || 'info');
    }
    function stage() { return Number(flags()['qi_stage'] || 0); }
    function anchorDay() { return Number(flags()['qi_anchor_day'] || 0); }
    function witheredList() {
        var out = [];
        for (var i = 0; i < CITY_ORDER.length; i++) { if (flags()['qi_withered_' + CITY_ORDER[i]]) out.push(CITY_ORDER[i]); }
        return out;
    }

    // ---- 浓度改写（读档重放）----
    function applyWitherConc(city) {
        try {
            var qc = W.QI_CONCENTRATION && W.QI_CONCENTRATION[city];
            if (qc && !qc._qiWithered) {
                qc._qiWithered = true;
                qc.base = Math.max(0.1, +(qc.base * 0.25).toFixed(2));
                qc.desc = '灵脉已枯——此地气机稀薄如粥';
            }
        } catch (e) {}
    }
    (function replay() {
        var list = witheredList();
        for (var i = 0; i < list.length; i++) applyWitherConc(list[i]);
    })();

    // ---- 总闸降档（每档只报一次）----
    W.qiSetStage = function (n) {
        n = Number(n) || 0;
        if (n <= stage() || n >= STAGE_QI.length) return false;
        flags()['qi_stage'] = n;
        var target = STAGE_QI[n];
        var cur = Number(W.globalQiLevel != null ? W.globalQiLevel : 100);
        if (cur > target && typeof W.depleteQi === 'function') { try { W.depleteQi(cur - target); } catch (e) {} }
        if (STAGE_NOTICE[n]) log(STAGE_NOTICE[n], 'info');
        try { if (typeof W.qiJournalNote === 'function') W.qiJournalNote('天地灵气', '天地灵气又薄了一档——出得多，进得少。'); } catch (e) {}
        return true;
    };

    // ---- 枯脉 ----
    W.qiWitherCity = function (city) {
        if (CITY_ORDER.indexOf(city) < 0) return false;
        if (flags()['qi_withered_' + city]) return false;
        flags()['qi_withered_' + city] = absDay() || 1;
        applyWitherConc(city);
        log('🥀 又一条灵脉枯了：' + city + '。枯萎图上的红线，又近了一格。', 'warning');
        try { if (typeof W.qiJournalNote === 'function') W.qiJournalNote('灵脉枯', city + '的灵脉枯了——枯萎图上的红线，又近了一格。'); } catch (e) {}
        return true;
    };

    // ---- 城景三段式（进城时叠加）+ 批六分城腔街谈 ----
    W.qiCityOverlay = function (city) {
        if (!flags()['qi_withered_' + city]) return '';
        var s = CITY_SCENES[city];
        if (!s) return '';
        var st = stage();
        var out = '🥀 ' + s[st >= 3 ? 2 : (st >= 2 ? 1 : 0)];
        if (typeof W.qiStreetCityLine === 'function') {
            try { var sl = W.qiStreetCityLine(city); if (sl) out += '\n' + sl; } catch (e) {}
        }
        if (typeof W.qiCityFateLine === 'function') {
            try { var fl = W.qiCityFateLine(city); if (fl) out += '\n' + fl; } catch (e) {}
        }
        return out;
    };

    // ---- 倒计时 ----
    W.qiCountdownText = function () {
        var a = anchorDay();
        if (!a) return '她还没有公示期限。';
        var left = 1080 - (absDay() - a);
        if (left <= 0) return '期限已至——最后一条脉在血海坝下。她在等你。';
        var y = Math.floor(left / 360), m = Math.floor((left % 360) / 30), d = left % 30;
        return (y ? y + ' 年 ' : '') + (m ? m + ' 个月零 ' : '') + d + ' 天';
    };

    // ---- 枯萎图面板 ----
    W.qiOpenWitherMap = function () {
        var rows = CITY_ORDER.map(function (c) {
            var dead = !!flags()['qi_withered_' + c];
            return '<div class="text-sm py-1 ' + (dead ? 'text-red-400' : 'text-green-300') + '">'
                + (dead ? '🥀 ' : '🟢 ') + c + (dead ? '（已枯）' : '（尚存）') + '</div>';
        }).join('');
        var body = '<div class="text-left text-sm text-gray-300 leading-relaxed mb-3">'
            + '<p class="mb-2">红线是她走过的路。已枯 <b class="text-red-400">' + witheredList().length + '</b> 脉，尚存 <b class="text-green-300">' + (CITY_ORDER.length - witheredList().length) + '</b> 脉。</p>'
            + '<p class="mb-2 text-gray-400">红线的尽头写着血海——她把整个九州的灵气，都往那里搬。</p>'
            + '<p class="mb-3 text-amber-200">她公示过期限：<b>三年后的今日，天下最后一缕灵气入海。</b>——还剩：' + W.qiCountdownText() + '</p>'
            + '</div>' + rows
            + '<p class="text-xs text-gray-500 mt-3">最后一条脉在血海坝下。她没有动它——她说，本座等你想明白。</p>';
        if (typeof W.showModal === 'function') W.showModal('🗺️ 九州枯萎图', body);
    };

    // ---- 时间副推进：每180日主线未推进一格，额外枯一城（世界不等你）----
    function dayTick() {
        var a = anchorDay();
        if (!a) return;
        var due = Math.floor((absDay() - a) / 180);
        var pushed = Number(flags()['qi_time_push'] || 0);
        if (due <= pushed) return;
        flags()['qi_time_push'] = due;
        var list = witheredList();
        if (list.length >= CITY_ORDER.length) return;
        var next = null;
        for (var i = 0; i < CITY_ORDER.length; i++) { if (list.indexOf(CITY_ORDER[i]) < 0) { next = CITY_ORDER[i]; break; } }
        if (next) {
            W.qiWitherCity(next);
            log('🌫️ 你不在场——这种事，如今不需要谁在场。', 'info');
        }
    }
    try {
        if (W.timeSystem && typeof W.timeSystem.onNewDaySubscribe === 'function') W.timeSystem.onNewDaySubscribe(function () { try { dayTick(); } catch (e) {} });
        else if (W.EventBus && W.EventBus.on) W.EventBus.on('newDay', function () { try { dayTick(); } catch (e) {} });
    } catch (e) {}

    // 对外只读探针（测试与后续批次用）
    W.qiWorldProbe = function () {
        return { cityOrder: CITY_ORDER.slice(), stage: stage(), anchor: anchorDay(), withered: witheredList(), stageQi: STAGE_QI.slice() };
    };

    console.log('[qi-world] v25.0《灵气之尽》世界层已注册：总闸四档/枯脉八城/城景三段式/枯萎图/倒计时/时间副推进');
})();
