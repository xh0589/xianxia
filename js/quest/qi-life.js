// ==================== qi-life.js - 《灵气之尽》日子层：城与人记得你 + 枯竭体感 ====================
// 补厚批 A+B（玩家反馈「很多地方内容很浅」后的第一批）：
//   A1 城景命运变体——斩/放的选择写进城景本身（进万毒谷能看见施药摊，进炎城能看见公炉）
//   A2 配角回访戏——柳四娘的苗/陈五久教字/旧识学厨/虞松子扫灯/南边面摊/小镇立碑：人不在你的路上蒸发
//   A3 两张期票兑现——「沟里的苗活成一小片」「终局后该镇立碑刻两行名字」
//   B  枯竭日子事件层——丹炉焦/飞舟晚点/大阵豆子色/疯兽下山/剑修卖剑/兽潮南迁：世界变薄要能「撞上」，不能只听播报
//      （注：修炼变慢/灵田减产/闭关衰减早已由浓度系统真实生效——globalQiLevel 乘进浓度表；本模块补的是体感叙事层）
// 纪律：回访与事件全部一次性旗标或日间隔节流（不刷屏）；结局落定后事件停拍（新时代归街谈库）；零外文字母零配额句式。
(function () {
    'use strict';
    var W = window;

    function flags() { return (W.eventFlags = W.eventFlags || {}); }
    function absDay() {
        try { return W.timeSystem && W.timeSystem.getAbsoluteDay ? W.timeSystem.getAbsoluteDay() : 0; } catch (e) { return 0; }
    }
    function log(m, t) {
        if (W.gameLog && W.gameLog.add) W.gameLog.add(m);
        else if (W.showMessage) W.showMessage(m, t || 'info');
    }
    function street(text) {
        var f = flags();
        if (!f['qi_street'] || !f['qi_street'].push) f['qi_street'] = [];
        f['qi_street'].push({ day: absDay(), text: text });
    }

    // ============ A1 城景命运变体（进城时叠在城景三段式之后）============
    var FATE_LINES = {
        '万毒谷': function (f) {
            if (f['qi_boss1_fate'] === 'spare') return '谷口多了个新摊子，招牌四个字「续脉丹施」——每月初一十五开仓，不收钱。排队的人比从前买丹的队伍还长，但站着排，不跪了。';
            if (f['qi_boss1_fate'] === 'slay') return '药庐的废墟上有人摆了个小牌位——不是给杜无忧立的，是给那些买不起丹、也没等到施药的人立的。牌位前总有人放一把枯药。';
            return '';
        },
        '炎城': function (f) {
            if (f['qi_boss2_fate'] === 'spare') return '第一座公炉还烧着。霍无霜管炉子不管账——炉边烤火的人说，如今的火不烫人了，暖人。';
            if (f['qi_boss2_fate'] === 'slay') return '火闸拆了，也没人管渠——那年冬天风从山上下来，带着锄头声：半城的人上山挖活路去了，如今山上比城里热闹。';
            return '';
        },
        '帝都·长安': function (f) {
            if (f['qi_boss4_fate'] === 'spare') return '联名库空了，库主在广场上支了个摊给人写家书——摊前排着队。他说这辈子写过的字，头一回觉得有用。';
            if (f['qi_boss4_fate'] === 'slay') return '库门破开那天跪过的人，后来不跪了——灵石按人头分的，有人骂分石头的人惹乱子，也有人在家给他立了长生牌。同一个人，两样都占了。';
            return '';
        }
    };
    W.qiCityFateLine = function (city) {
        var f = flags();
        if (!f['qi_route'] || !f['qi_withered_' + city]) return '';
        var fn = FATE_LINES[city];
        if (!fn) return '';
        var line = fn(f);
        return line ? '🏮 ' + line : '';
    };

    // ============ A2+A3 配角回访戏（一日最多一段，一次性）============
    var REVISITS = [
        {
            key: 'qi_rv_liu',
            when: function (f) { return f['_qi_liu'] === 'move' && f['qi_anchor_day'] && absDay() - Number(f['qi_anchor_day']) >= 60; },
            text: '🌱 你又路过那片枯掉的灵田——背阴的沟里，那十几株半活的苗，活成了一小片。柳四娘不在，她儿子在守田。他认得你：「娘说，活下来的都得让人看看。」',
            streetText: '枯田的背阴沟里活出了一小片苗。药农们去看热闹，看完回自家田里，也学着挖了沟。'
        },
        {
            key: 'qi_rv_chen',
            when: function (f) { return f['qi_route'] === 'oppose' && f['qi_c13'] && f['qi_anchor_day'] && absDay() - Number(f['qi_anchor_day']) >= 30; },
            text: '🍂 营地里，陈五久在教流民的孩子们认字——认的第一个字是「药」。卡了三百年的金丹，如今不卡了：娃娃的事，卡不得。他见你看，头也不抬：「看什么，认字比修行要紧——修行卡三百年，认字三天就会。」'
        },
        {
            key: 'qi_rv_kin',
            when: function (f) { return f['qi_route'] === 'ignore' && f['qi_kin'] === 'took' && f['qi_h02']; },
            text: '🏮 家里那位旧识学会了做饭——废掉修士的手，比厨子还稳。他说火候这东西跟行功一个理：气薄了，就用文火。你吃着那碗汤面，忽然觉得，日子薄了，味倒厚了。'
        },
        {
            key: 'qi_rv_mian',
            when: function (f) { return f['qi_route'] === 'follow' && f['qi_s04'] && f['qi_anchor_day'] && absDay() - Number(f['qi_anchor_day']) >= 90; },
            text: '🍜 南边的镇子上有个面摊——一碗面，两个铜板，摊主看娃娃会多舀一勺热汤。你要了两碗，都自己吃了。摊主以为你饿疯了。其实不是。第二碗，你替一个八岁掉进血海的孩子吃的。'
        },
        {
            key: 'qi_rv_yu',
            when: function (f) { return f['qi_ending'] === 'ferry' && f['_qi_yu'] === 'guard'; },
            text: '🏔️ 七霞派祖师堂的院子，每天都有人扫——虞松子扫的。他不进去，就在院里扫落叶，扫完给囚阵换一炷香。他说：阵记得她，他记得阵。七霞派就剩他了，如今算是又剩了一个。'
        },
        {
            key: 'qi_rv_zhou_name',
            when: function (f) { return !!f['qi_ending'] && f['_qi_zhou'] === 'name' && f['qi_c15']; },
            text: '🪨 田埂小镇后来立了块碑。碑不刻大事，刻了两行小字：周来福，周小满。父与子——一个断了腿，一个回了家。立碑的人说，得让路过的人知道，这镇上的人被记过。'
        },
        {
            key: 'qi_rv_zhou_redeem',
            when: function (f) { return !!f['qi_ending'] && f['_qi_zhou'] === 'redeem'; },
            text: '🏮 田埂小镇多了个规矩：年三十家家门前点一盏灯。没人说为什么——那年有个仙长追出三百灵石赎回了周家小子，当夜家家点了灯。后来灯就留下来了，给所有回家的人点。'
        }
    ];
    function tryRevisit() {
        var f = flags();
        if (!f['qi_route']) return false;
        for (var i = 0; i < REVISITS.length; i++) {
            var r = REVISITS[i];
            if (f[r.key]) continue;
            var hit = false;
            try { hit = r.when(f); } catch (e) { hit = false; }
            if (hit) {
                f[r.key] = absDay() || 1;
                log(r.text, 'info');
                if (r.streetText) street(r.streetText);
                return true;
            }
        }
        return false;
    }
    W.qiLifeProbe = function () {
        var f = flags(), out = [];
        for (var i = 0; i < REVISITS.length; i++) { if (f[REVISITS[i].key]) out.push(REVISITS[i].key); }
        return out;
    };

    // ============ B 枯竭日子事件层（撞上，不是听说）============
    // 批D · 文本池加厚：每档四件扩到八件——枯竭不是三张幻灯片，是过不完的日子
    var EVENTS = {
        1: [
            '🍂 你清晨行功，入体的气比昨日薄了一分。你多坐了一刻钟，把它补了回来——补得回来的是修为，补不回来的，是日子。',
            '🍂 丹炉凉得比往常快，这炉丹出得焦了。丹师骂天，骂完自己也沉默——不是天的错，可除了天，也不知道该怪谁。',
            '🍂 飞舟在两城之间多走了半日。船上没人抱怨：晚半日就晚半日，舟省下的灵石够一家人嚼用一个月——船夫说这叫扯平。',
            '🍂 药市的草药又贵了一成。药农说不涨价不行，田里出不来东西——百亩灵田，如今荒着三十亩，荒的那三十亩，没人舍得说「弃」字。',
            '🍂 邻家的灵田改种了凡稻。稻子矮，密，风一过不再泛灵光——可邻家婆娘说，矮有矮的踏实，割下来是真能吃饱的。',
            '🍂 渡口落了灰。跑船的改行赶骡车了——官道上的车辙比水道的浪多，他说赶车踏实，车不会半路没气。',
            '🍂 夜里行功，灯芯要多加一根才看得清经脉图。不是眼睛老了，是气薄了，连灯焰都显得怯。',
            '🍂 药铺柜台挂了新牌子：「灵药按株售」。掌柜的说论斤称不敢了——称出来的份量，一年比一年轻。'
        ],
        2: [
            '🥀 城外大阵的灯暗成了豆子色。守阵的人天天添灵石，添完亮三日，第四日又暗回去——像给一个吃不饱的人喂饭。',
            '🥀 夜里疯兽下山，伤了两口人，被巡夜的赶回去了。老猎户蹲在村口抽了一夜烟：气薄了，兽先疯——兽疯完，才轮到人枯。',
            '🥀 灵田的收成又减了一半。佃户没哭没闹，只是把灵稻改种成了凡麦。麦不吃气，能吃麦的人，总比吃气的人多。',
            '🥀 当铺门口，一个剑修在卖剑。剑是好剑，价按废铁算——剑气散了，好剑不如烂锅，烂锅还能烧水。剑修收了钱，没回头。',
            '🥀 城根下有人支摊卖「聚气符」。符是假的，买的人也知道是假的——买回去贴在门楣上，图个心安。摊主生意竟不差。',
            '🥀 兽栏空了。牧人把灵兽放归了山——喂不起，放生前还挨个摸了摸头。他说畜生通人性，山里有气，让它们自己去寻。',
            '🥀 蒙学里改了课：半天念书，半天学手艺。先生说，念书看命，手艺看手——两手都得有，命薄的时候手顶用。',
            '🥀 大阵的老阵师收了徒弟，头一课不教阵，教省灵石。「阵还是那个阵，」他说，「石头不是从前的石头了。」'
        ],
        3: [
            '🌫️ 兽潮的消息一城接一城：先疯，后弱——疯过的死完了，没疯的往南逃。南边的城关了门，门外堆着逃难人的行李，行李比人多——人挤不进去，行李先扔进去的。',
            '🌫️ 街上的修士又少了。有改行卖菜的，有回乡种田的，还有不肯改的——不肯改的坐在山门废墟里打坐，把最后一口气坐完为止。没人劝，劝不动。',
            '🌫️ 井水变甜了。老井户说，气走了，水就回了本味。你喝了一碗，确实甜——这甜味，没人来收税。',
            '🌫️ 城隍庙的香火旺了，道观的香火薄了。拜的人说不上来求什么——求雨？求太平？求孩子别被仙师抱走？都求。香炉里的灰，比从前的厚。',
            '🌫️ 城里最后一条飞舟泊在了河上，改做了水家酒楼。船夫如今掌勺，炒的菜比行的船好——他说行船要气，炒菜只要火。',
            '🌫️ 山门没去的人了，可山门每天有人扫。问是谁扫的，村里人说不准——反正石阶一直是干净的，干净得像还有人来。',
            '🌫️ 集市上有人论捆卖旧修士袍。没人问来历，也没人买来穿——买回去挂墙上。有个后生说：挂着，是记得有过那么个时候。',
            '🌫️ 井水甜惯了，人就忘了从前咸。有个外乡老汉来讨水，喝完咂咂嘴：这是失了气的水。全村人都没接话——第二天，日子照旧。'
        ]
    };
    function tryEvent() {
        var f = flags();
        if (!f['qi_route'] || f['qi_ending']) return false; // 结局落定后停拍——新时代的事归街谈库
        var st = Number(f['qi_stage'] || 0);
        if (st < 1) return false;
        var d = absDay();
        if (!d) return false;
        var last = Number(f['qi_life_last'] || 0);
        if (d - last < 9) return false; // 日子事件九日一遇——薄，但不缠人
        if (d % 9 !== 0) return false;
        f['qi_life_last'] = d;
        var pool = EVENTS[st] || EVENTS[1];
        var text = pool[Math.floor(d / 9) % pool.length];
        log(text, 'info');
        return true;
    }

    // ---- 日钩：回访优先，事件其后（一日至多一段，不刷屏）----
    function dayTick() {
        if (tryRevisit()) return;
        tryEvent();
    }
    try {
        if (W.timeSystem && typeof W.timeSystem.onNewDaySubscribe === 'function') W.timeSystem.onNewDaySubscribe(function () { try { dayTick(); } catch (e) {} });
        else if (W.EventBus && W.EventBus.on) W.EventBus.on('newDay', function () { try { dayTick(); } catch (e) {} });
    } catch (e) {}

    console.log('[qi-life] 日子层已注册：城景命运变体三城 + 配角回访七段（含两张期票） + 枯竭日子事件十二件（按档分流）');
})();
