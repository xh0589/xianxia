// ==================== qi-street.js - 《灵气之尽》批六：街谈库 · 平民舆论弧线 · 分城腔 ====================
// v25.0 推倒重写 · 批六：回响收口——街谈库重写（骂她→困惑→长生牌→点灯→新时代，按年推进读枯萎旗与主线进度）
// 对齐：主线大纲·灵气之尽.md 第五节（她的长生牌与修士的护城灯同时存在——不裁决）+ 批二 C9「城市状态（批六街谈分城腔）」
// 接线：终局面板「街谈」页签 / 茶馆传闻堂插块（app.js 钩子）/ 进城分城腔（qi-world 城景叠加钩子）/
//       大事记（WorldJournal）与图鉴（Codex·codex_world）由本模块出工具函数、各批调用点guarded接入。
// 纪律：全部读真账（qi_street 缓冲/枯萎旗/结局旗）；账没翻开就静默；零外文字母零配额句式；不裁决哪种感激是对的。
(function () {
    'use strict';
    var W = window;

    function flags() { return (W.eventFlags = W.eventFlags || {}); }
    function absDay() {
        try { return W.timeSystem && W.timeSystem.getAbsoluteDay ? W.timeSystem.getAbsoluteDay() : 0; } catch (e) { return 0; }
    }
    function witheredCount() {
        try { return typeof W.qiWorldProbe === 'function' ? W.qiWorldProbe().withered.length : 0; } catch (e) { return 0; }
    }
    function isWithered(city) { return !!flags()['qi_withered_' + city]; }

    // ---- 大事记与图鉴：统一工具（各批调用点都走这里，guarded）----
    W.qiJournalNote = function (title, text) {
        try { if (W.WorldJournal && typeof W.WorldJournal.record === 'function') W.WorldJournal.record({ type: 'qi_world', title: title, text: text }); } catch (e) {}
    };
    W.qiCodexNote = function (itemId, name, desc) {
        try { if (W.Codex && typeof W.Codex.discover === 'function') W.Codex.discover('codex_world', itemId, { name: name, desc: desc }); } catch (e) {}
    };

    // ---- 平民舆论弧线五段（按年推进——读枯萎旗与主线进度，不读计数器）----
    var PHASES = {
        curse: {
            name: '骂她',
            lines: [
                '茶馆里有人骂她：仙人没了，谁护城？兽潮来了，谁站墙头？骂声一浪高过一浪——骂的人家里，今年也少交了一笔「供奉」。',
                '「梯子是碍事，可梯子上头的人护着我们啊！」有人把碗顿在桌上，没人接话——接话的人也想不明白自己到底要哪头。',
                '说书人开了新段子，反派是个红衣女人。段子里她没有脸，也没有名字——听客只记得她坏。'
            ]
        },
        puzzle: {
            name: '困惑',
            lines: [
                '「怪了。仙师不来收孩子了，粮价也没涨。」茶客们说不清这是好事坏事，只能一个劲儿地说「怪了」。',
                '城西有家人把供了三代的宗门牌位摘了，过两天又挂回去——他说摘了心里空落落的，挂回去也没人显灵。',
                '有人骂她，有人谢她，更多人不提——粮价比她要紧。可粮价平稳得反常，平稳得让人心里发毛。'
            ]
        },
        tablets: {
            name: '长生牌',
            lines: [
                '南边有村子立了长生牌——不说是给谁立的。兽潮前夜，牌位前的香火最旺：求它灵，又怕它太灵。',
                '「谁让仙师们来不了，我就谢谁。」老婆婆这句话，如今成了俗语。说的人未必信，信的人未必说。',
                '说书人的段子改了：红衣女人还是没有脸，但新段子里多了一句——她从前也是人。听客吵了起来，吵完各回各家。'
            ]
        },
        lamps: {
            name: '点灯',
            lines: [
                '兽潮来了。城里的人自己上了墙，给修士点灯——灯照不护城，但照得清路。那一夜，灯比星星多。',
                '她的长生牌和修士的护城灯立在同一个村口。谁也没拆谁的——一个求梯子塌，一个求墙头有人，两样香火一起烧。',
                '逃荒的修士路过村子，夜里有人在他歇的破庙门口挂了盏灯。他对着灯坐了半宿，天亮接着赶路——没人知道他是修士，灯也不是给他点的，他领了。'
            ]
        },
        newera: {
            name: '新时代',
            lines: [
                '牌位多了，灯也还点着——两种感激并存。没人裁决哪种是对的，日子把这个问题泡淡了。',
                '说书人把十八个版本说全了。最后一个版本最短：一个人做成了一件事，另一个人去买了菜。说完他就收摊——这段子没法再往下编了。',
                '孩子们问：仙人是什么？大人想了半天，指指天上，又指指田里，最后说：从前有梯子的时候，爬上去的那些人。'
            ]
        }
    };
    var NEWERA_BY_ENDING = {
        slay: '有人说她死在了漩涡底下，有人说她没死——段子里她活了十几种活法。哪一种都有人信，哪一种都没人见过。',
        ferry: '听说七霞派的祖师堂里囚着一个人，隔三差五有人去送饭。送饭的不说是囚，看的不说是看——村里人把两样都叫「惦记」。',
        release: '没人知道栏外头有什么。孩子们问，大人说：走了。孩子们又问走去哪了，大人答不上来——答不上来的事，如今越来越多，日子倒越来越平稳。',
        stay: '有个关着门过日子的人，每天清早去买菜。卖菜的认识他，从来没问过他是谁——新时代的人，懂得不多问。'
    };
    W.qiStreetPhase = function () {
        var f = flags();
        if (!f['qi_route']) return '';
        if (f['qi_ending']) return 'newera';
        var n = witheredCount();
        if (n >= 7) return 'lamps';
        if (n >= 4 || f['qi_opinion_turned']) return 'tablets'; // 公示《天锁论》：舆论线提前转向
        if (n >= 2) return 'puzzle';
        return 'curse';
    };
    W.qiStreetPhaseName = function () {
        var p = W.qiStreetPhase();
        return p ? PHASES[p].name : '';
    };
    function phaseLines() {
        var p = W.qiStreetPhase();
        if (!p) return [];
        var base = PHASES[p].lines.slice();
        // 按日轮转起始位——同一天听到的是同几条，日子往前走，话也在换
        var d = Math.floor(absDay() / 3);
        if (base.length > 3) { var h = d % base.length; base = base.slice(h).concat(base.slice(0, h)); }
        var out = base.slice(0, 3);
        // 新时代的结局专属一条永远在——四种结局的民间余韵各自不同，不参与轮转
        if (p === 'newera' && NEWERA_BY_ENDING[flags()['qi_ending']]) out.push(NEWERA_BY_ENDING[flags()['qi_ending']]);
        return out;
    }

    // ---- 分城腔（批D加厚：八城各三句，进城叠加，三十日一次不刷屏；
    //      句子随「枯了多少日子」轮换——城也在过日子，第一句是初枯，往后是枯出来的日常）----
    var CITY_LINES = {
        '大漠孤城': [
            '城门口的驼队改运粮了。赶驼的说：灵砂不值钱了，粮才值钱——这话搁三年前说，要挨打的。',
            '搬去南边的井户托人捎回一句话：南边也有南边的难处。捎话的人在城门口站了一会儿，又走了——他出生那口井，如今只剩驼铃陪着。',
            '有人开始拆长街的客栈了。拆到「灵气充盈」那块招牌时动了动脑筋，没劈——扛回家了。烧火用得上什么，没人问。'
        ],
        '冰原城': [
            '湖边卖清水的摊子生意很好。冰原城的人从前笑话南边人买水喝——如今自己排上了队。',
            '水摊上添了新幌子：「冰原城的水，最后一口甜」。路过的读书人直摇头——水确实甜，幌子丢了魂。',
            '孩子们把死掉的冰灯玩成了新游戏：点了又吹灭，比谁憋得住气。大人看了也不骂——这城的灯，早就习惯了亮了又灭。'
        ],
        '万毒谷': [
            '药商把摊子挪到了谷口，招牌改成了「凉水干粮」。毒药行的旧匾他留着没扔——他说留着，早晚值钱。',
            '药商卖完了最后一架灵药，改行卖粗盐，生意反倒好了。他说：毒都养不活的年头，人要的不是药，是咸淡。',
            '万毒的牌位没人上香了，可也没人撤。谷里老人说：留着吧——毒从前能毒死人，说明谷还活着。'
        ],
        '青木城': [
            '树桩上那圈矮房住满了人。孩子们在那行「此处曾有树」上爬来爬去——字被磨得发亮，树的事没人再讲。',
            '树桩上的矮房有了名字，叫「树记巷」。房租竟涨了——都想住进有过树的地方。',
            '樵夫把当年揣进怀里的那片香叶刻成了小牌，挂在孩子脖子上。孩子问这是什么，他说：树的味道。树的味道是什么，孩子没闻过。'
        ],
        '剑阁': [
            '剑修们的锄头开出来的田，头一茬收成下来，满山喝了一夜——比当年开山立派那天还热闹。',
            '剑冢那柄没人拔的剑，有个新来的流民想拔，被老剑仆拦下了：「留着。剑都走完了，它就是剑阁。」',
            '用锄头开出来的田酿了酒。剑修们喝酒的架势还是端剑的架势——改不掉了，有些东西长在骨头上。'
        ],
        '炎城': [
            '铁匠把炎城的头一场雪收进匣子里，写了个「火」字贴在匣盖上。他说等孙子大了给他看：你爷爷的城，从前是烧着的。',
            '关张的铁匠铺有一半又开了张，招牌改成「修铁器·打农具」。老炉头说：火脉死那天他哭了半天，后半天抡起锤子打锄头。',
            '装「头一场雪」的匣子，如今供在旧粮仓里，隔三差五有人来看——看的是匣子，雪看不得，雪看了就没了。'
        ],
        '洛水城': [
            '画舫的曲子没了，捣衣声起来了。河边的妇人说：这条河，总算归我们了——说完自己愣了一下，像没说料到自己会说这个。',
            '画舫拖上了岸，改成茶棚。跑堂的还会哼两句旧曲——哼到一半自己停了，茶客说：接着哼，我们听着像从前。',
            '浣衣的妇人立了规矩：每月初一十五不下河捶衣，让河也歇两天。没人记得规矩怎么来的，但都守。'
        ],
        '帝都·长安': [
            '长安的市声如旧。有孩子指着暗掉的九龙灵柱问那是什么，大人想了想说：旧东西。孩子又问旧东西为什么在宫里，大人没答上来。',
            '宫墙根下多了个讲古的摊子，专讲「九龙旧事」。讲到灵柱，讲古的摆手：后头是仙家的事——仙家的事，如今没人信喽。',
            '长安的米价稳住了。粮铺掌柜在门口贴了八个字：「天地安分，吃米慢慢」。路过的读书人看了半天，没动笔。'
        ]
    };
    function cityLineNow(city) {
        var arr = CITY_LINES[city];
        if (!arr || !arr.length) return '';
        var wDay = Number(flags()['qi_withered_' + city] || 0);
        var idx = Math.floor(Math.max(0, absDay() - wDay) / 60) % arr.length;
        return arr[idx];
    }
    W.qiStreetCityLine = function (city) {
        var f = flags();
        if (!f['qi_route'] || !isWithered(city) || !CITY_LINES[city]) return '';
        var key = 'qi_street_city_' + city;
        var last = Number(f[key] || 0);
        var d = absDay();
        if (d && last && d - last < 30) return ''; // 街谈不刷屏——一座城三十日一回
        f[key] = d || 1;
        return '🍵 ' + cityLineNow(city);
    };

    // ---- 街谈库面板（终局面板页签）----
    function _close() { if (typeof W.qiCloseModal === 'function') W.qiCloseModal(); }
    function modal(title, body) {
        _close();
        var wrap = '<div class="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4" id="qi-modal-overlay">'
            + '<div class="bg-gray-900 border-2 border-emerald-800 rounded-xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto">'
            + '<h2 class="text-xl font-bold text-emerald-300 mb-3 text-center">' + title + '</h2>' + body + '</div></div>';
        if (document.body && document.body.insertAdjacentHTML) document.body.insertAdjacentHTML('beforeend', wrap);
    }
    function para(t) { return '<p class="text-sm text-gray-300 leading-relaxed mb-2">' + t + '</p>'; }
    function btn(label, onclick, cls) {
        return '<button onclick="' + onclick + '" class="' + (cls || 'bg-emerald-800 hover:bg-emerald-700') + ' text-xs px-3 py-2 rounded text-left">' + label + '</button>';
    }
    function btns(arr) { return '<div style="display:flex;flex-direction:column;gap:8px;margin-top:12px">' + arr.join('') + '</div>'; }
    W.qiOpenStreetTalk = function () {
        var phase = W.qiStreetPhase();
        if (!phase) { say0('街谈巷议还没你的事——灵气之尽的账还没翻开。'); return; }
        var body = para('<span class="text-gray-400">如今天下人说起来，这一段的日子叫「</span><b class="text-emerald-200">' + PHASES[phase].name + '</b><span class="text-gray-400">」。街谈按年走，不等人——</span>')
            + phaseLines().map(function (l) { return para('🍵 ' + l); }).join('');
        // 批D · 年份层：历书翻红到第几年，面板说给你听——日子在走，不是原地打转
        var anchorD = Number(flags()['qi_anchor_day'] || 0);
        if (anchorD) {
            var yrs = Math.floor(Math.max(0, absDay() - anchorD) / 360) + 1;
            var yearLine = yrs >= 3
                ? '这是历书翻红的第三年往上了。孩子们记不得飞舟长什么样，大人也不纠正——忘，比习惯快。'
                : (yrs === 2
                    ? '这是第二年了。街上的人习惯了谈粮价；谈完粮价谈南边——南边还有气，人人都信，就像从前人人都信仙人。'
                    : '这是红线爬上图的头一年。旧历书还能用，只是没人肯誊新的了——誊出来，怕比旧的去得更快。');
            body += para('📅 <span class="text-gray-500 text-xs">' + yearLine + '</span>');
        }
        var buf = [];
        try { buf = typeof W.qiStreetProbe === 'function' ? W.qiStreetProbe() : []; } catch (e) {}
        if (buf.length) {
            body += '<div class="text-sm font-bold text-amber-200 mb-1 mt-3">📜 你的账，在街上</div>'
                + buf.slice(-8).map(function (s) {
                    return '<div class="text-xs text-gray-300 py-1 border-b border-gray-700/50">· ' + s.text + '<span class="text-gray-500">（第' + s.day + '日入街）</span></div>';
                }).join('');
        } else {
            body += para('<span class="text-gray-500">（你的账还没写到街上——你做过的每件事，街谈都会自己长出来。）</span>');
        }
        body += para('<span class="text-gray-500 text-xs">她的长生牌与修士的护城灯同时存在——这就是「差距」这件事在民间的真实形状。街谈不裁决哪种感激是对的。</span>')
            + btns([btn('放下茶碗', 'window.qiCloseModal()', 'bg-gray-600 hover:bg-gray-500')]);
        modal('🍵 街谈', body);
    };
    function say0(m) { if (W.showMessage) W.showMessage(m, 'info'); }

    // ---- 茶馆传闻堂插块（app.js 钩子；账没翻开就静默）----
    W.qiStreetTeaBlock = function (city) {
        var phase = W.qiStreetPhase();
        if (!phase) return '';
        var lines = phaseLines();
        var html = '<div class="text-xs text-gray-400 border-b border-gray-700/50 pb-2 mb-2">'
            + '<span class="text-emerald-300">【灵气之尽 · ' + PHASES[phase].name + '】</span>说书人抚尺一转，说的全是这几年的事——<br>'
            + lines.slice(0, 2).map(function (l) { return '<span class="text-gray-300">· ' + l + '</span><br>'; }).join('');
        if (city && isWithered(city) && CITY_LINES[city]) html += '<span class="text-gray-300">· ' + cityLineNow(city) + '</span><br>';
        html += '</div>';
        return html;
    };

    // ---- 酒馆/客栈跑堂闲话（building-effects 钩子；返回单条纯文本，账没翻开就静默）----
    W.qiStreetTavernLine = function (city) {
        var phase = W.qiStreetPhase();
        if (!phase) return '';
        // 分城腔优先（吃三十日节流），没有就落舆论弧线
        var cl = W.qiStreetCityLine(city);
        if (cl) return cl.replace('🍵 ', '');
        var lines = phaseLines();
        if (!lines.length) return '';
        var d = Math.floor(absDay() / 3);
        return lines[d % lines.length];
    };

    console.log('[qi-street] v25.0《灵气之尽》批六已注册：街谈库五段舆论弧线+分城腔八句+茶馆插块+大事记/图鉴工具');
})();
