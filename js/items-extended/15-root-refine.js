// ==================== 扩展物品 - 重塑灵根丹（v20.16） ====================
// 后天改命线：服用后本系主根占比 +6（其余五行按比例摊薄，饼总和恒 100 由族谱同一把尺配平）。
// 获取唯一路径=炼丹新丹方（五行灵髓主药，js/crafting/alchemy-compound.js recipe_root_refine）。
// 使用处理见 inventory.js useItem → root_refine 分支 → window.refineRootByPill。
// v27.13：主档①新增-3「塑灵根丹：改命的人，身体记得」——B 案独立暗线嵌在本文件尾部
//（换根口包装 + 七日阵发 + 阴雨天「发紧」+ 身体记忆入档），不动任何别的文件。
(function () {
    'use strict';

    window.rootRefineItems = [
        {
            id: 'pill_root_refine',
            name: '重塑灵根丹',
            type: 'consumable',
            subtype: 'pill',            // 走消耗品白名单：服丹自动累丹毒（药性猛烈，名副其实）
            category: 'consumable',
            quality: 'PIN3',
            level: 6,
            price: 1200,
            effect: { root_refine: 6 }, // 主根占比 +6（摊薄其余，配平回 100）
            stackable: true,
            maxStack: 5,
            desc: '以五行灵髓为主药炼成。服用后本命灵根更纯（主根占比+6，余者摊薄），主根至多六成，药力递减',
            icon: '🌈'
        }
    ];

    // 自注册进物品库（与 13/14 号扩展同策略，幂等防重复入库）
    if (window.itemById && window.allItems) {
        var known = Object.create(null);
        window.allItems.forEach(function (it) { if (it && it.id) known[it.id] = true; });
        window.rootRefineItems.forEach(function (item) {
            if (!item || !item.id || known[item.id]) return;
            if (window.itemById[item.id]) return;
            window.itemById[item.id] = item;
            window.allItems.push(item);
            known[item.id] = true;
        });
    }
    if (window.consumables && Array.isArray(window.consumables)) {
        window.rootRefineItems.forEach(function (m) {
            if (window.consumables.indexOf(m) < 0) window.consumables.push(m);
        });
    }
})();

// ==================== v27.13：塑灵根丹暗线「身体记忆」（主档①新增-3·B案独立暗线） ====================
// 主档原文：换根七日，夜里听得见经脉里有水声。第七日吐出半口淤血，从此阴雨天经脉深处隐隐发紧
//           ——不是减属性的惩罚，是身体一辈子的记忆。
// 设计口径（B 案·独立暗线，不走丹毒紊乱旧账）：
//   1. 服下重塑灵根丹起七日阵发：第一~六日各一句「夜里的水声/松动」（借现有新日播报通道追述昨夜，
//      一日至多一句、七日止）；第七日吐出半口淤血（一次性事件 + 心境小波动走 RewardService 正门）。
//   2. 永久「身体记忆」：此后阴雨天（weather-effects.js 的 getCurrentWeather()，rainy/stormy 算雨天）
//      晨间偶发一句「经脉深处隐隐发紧」。频率克制：雨天 30% 掷、两次至少隔七日、每季至多两回。
//      不减任何属性、不设 debuff——是记忆不是惩罚。
//   3. 状态入档：StateRegistry 新键 'rootBodyMemory'（version 1，加键不升版先例——旧档快照没有这个键，
//      importAll 自然跳过 = 从未换根照旧，零迁移）。账里带服丹日戳（pillDay）与阶段标（lastDay/bled）。
//   4. 重复换根：现状允许多次服丹（root-refine.js 只在主根六成封顶时拒服），暗线跟服丹走——
//      每次成功的服丹都重开一轮七日阵发，但文案降档（「旧伤又应了一句」），雨天的发紧也添旧伤口吻；
//      永远只有这一条暗线事件流，不叠第二层（同一日绝不出两句）。
// 盘点结论（先盘点再接，2026-10 实测）：
//   - 换根口：window.refineRootByPill 真身在 js/extensions/root-refine.js（仙侠.html:2320，晚于本文件:2024
//     加载），唯一调用方 inventory.js useItem。故本文件只在初始化时**包装**该函数（不重定义逻辑），
//     成功（无 error）才记账，返回值原样透传——丹药主流程一行不动。
//   - 天气读口：js/weather-effects.js 的 window.getCurrentWeather()（返回 {id:'rainy'|'stormy',...}），
//     兜底 window.currentWeather.id。
//   - 播报通道：全库**没有**独立「晨报/夜话」子系统。既有的晨间播报=新日管线：time-system.js onNewDay
//     → EventBus('newDay')（event-bus.js:63 处 GameEvents===EventBus 同一条总线，全库唯一发射点
//     time-system.js:360）→ weather-effects 的「今日天象」showMessage。故本暗线挂 EventBus('newDay')，
//     播报走 window.showMessage——落点正好跟在天象一句之后，读起来就是晨报追述昨夜。
//     时序要点：weather-effects 在其脚本执行期就订了 'newDay'，本文件订在 load 之后 ⇒ 注册序在天气之后
//     ⇒ 回调跑在 updateWeather 之后，读到的必是**今天**的天气（time-system 的 onNewDaySubscribe 订阅者
//     反而早于天气更新，不能用来读雨）。若 EventBus 缺席才回退 timeSystem.onNewDaySubscribe（那路天气
//     必然也不更新，雨天句自然永不掷出，符合「通道缺席=静默跳过」）。
//   - 日戳/季：timeSystem.getAbsoluteDay()（=gameTime.currentDay 日界账）；季 window.gameTime.currentSeason
//     （spring/summer/autumn/winter，360 日/年）。
//   - 心境正门：RewardService.apply({mood:-2})——只动心境，不碰属性。
// 可缺席铁律：天气读口/播报/换根口/RewardService/StateRegistry 任一缺席，暗线对应环节静默跳过，
//             绝不炸服丹主流程；所有播报调用点 try/catch，warn 用「[静默失败] js/items-extended/15-root-refine.js · …」格式。
(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    var ARC_LEN = 7;               // 换根七日（服丹日=第0日，第1~6日夜句，第7日淤血）
    var RAIN_CHANCE = 0.30;        // 雨天晨间掷中率（主档口径：雨天 30% 掷）
    var TIGHT_MIN_SPACING = 7;     // 两次「发紧」至少隔七日（防连雨天刷屏的频率闸之一）
    var TIGHT_SEASON_CAP = 2;      // 每季至多两回（频率闸之二；主档「每雨季至多几回」落成 2）
    var MOOD_DIP = -2;             // 第七日淤血的心境小波动（走 RewardService 正门，只动心境）
    var WRAP_MAX_TRIES = 40;       // 等换根口的上限次数（500ms 一试，约 20 秒）——等不到就静默休眠

    // ---- 第一~六日夜句（首轮：水声/松动；一夜一句、六夜六句各不重样——
    //      主档「随机一句」落成：句池按药力进程排布（第一夜水声起、第六夜收尾），按阵发日固定映射防穿帮；
    //      「随机」的活儿交给雨天发紧的两版掷与复服换池） ----
    var ARC_NIGHTS = [
        '🌌 换根第一夜：静卧时你听见经脉深处有细细的水声，像春冰底下初活的溪流，一路淌过四肢百骸。',
        '🌌 夜半醒来，指尖发麻——旧根松动的位置痒了一阵，像伤口结痂前那样。',
        '🌌 你梦见自己站在河床中央，水从骨头缝里过。醒来时掌心微潮，天还没亮。',
        '🌌 今夜行功，气过旧根处总打一个旋才肯走——像河道里搬走了一块礁石，水还在学新的走法。',
        '🌌 后半夜你被一声极轻的「咔」弄醒，半晌才明白是自己的骨头在挪窝。再睡时，那点酸胀已经散了。',
        '🌌 今晚经脉里那道水声细了些，也深了些——药力沉下去，正替你把新根的须子往深处扎。'
    ];
    // ---- 第一~六日夜句（复服降档：旧伤又应了一句，身体认得这套流程；与首轮同序映射） ----
    var ARC_NIGHTS_OLD = [
        '🌌 旧伤又应了一句：夜静时经脉里那道水声又起——这一回你认得它了，翻个身接着睡。',
        '🌌 夜里指尖又麻了一阵。熟悉的松动，熟悉的痒，这具身体记得这套流程。',
        '🌌 你又梦见那条河。水位比上次低些，流得熟门熟路。',
        '🌌 行功时气在旧处照例打了个旋——老朋友了，你由它转完，气自己找的路比上次更顺。',
        '🌌 后半夜那声轻「咔」又来了一次。你没醒透，含糊地想：又挪一寸。',
        '🌌 水声今晚就收了尾。第二次换根，身体学得比第一次快。'
    ];
    // ---- 第七日淤血（一次性事件；句尾拼 RewardService 回执的心境小波动） ----
    var BLOOD_FRESH = '🩸 换根第七日，晨起时你吐出半口淤血——暗色的，带一点铁腥。吐完胸口忽然空了一块，随即松了：旧根最后一缕死血，算是离开了。这具身体把这场改命，记成了一辈子的账。';
    var BLOOD_OLD = '🩸 第七日，半口淤血照旧来赴约——你甚至没被它惊醒，是晨起的腥味提醒你的。旧伤重走一遍，血比上次顺从。';
    // ---- 阴雨天「发紧」（记忆不是惩罚；复服后换旧伤口吻） ----
    var TIGHT_FRESH = [
        '🌧️ 雨天。经脉深处隐隐发紧——不是病，是那场换根留下的印子，身体在阴雨天替你念一遍。',
        '🌧️ 檐水未停，行功时你觉出经脉深处一丝发紧，像旧伤在下雨天提醒你它还在。过一会儿，自己散了。'
    ];
    var TIGHT_OLD = '🌧️ 雨天，旧处又紧了一紧。老伤认得雨，你也认得它了——由它念完这一遍，各干各的去。';

    // ---- 一本暗线账（StateRegistry 'rootBodyMemory'，加键不升版） ----
    // pillDay=服丹绝对日戳（第0日）；refineCount=第几次换根（降档闸）；lastDay=最近一句落账日（一日至多一句总闸）；
    // bled=本轮第七日淤血是否已落账（一次性闸）；
    // lastTightDay/tightSeason/tightSeasonCount=雨天发紧的间隔与每季上限账。
    // （夜句按阵发日固定映射，无随机序号账。）
    function _blank() {
        return { pillDay: 0, refineCount: 0, lastDay: 0, bled: false, lastTightDay: 0, tightSeason: '', tightSeasonCount: 0 };
    }
    var _st = _blank();

    // ---- 只读读口（时间/季/天气），全部可缺席，缺席按「无」处理 ----
    function _absDay() {
        try {
            if (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') {
                return Math.max(0, Math.floor(Number(window.timeSystem.getAbsoluteDay()) || 0));
            }
        } catch (e) {}
        try { if (window.gameTime) return Math.max(0, Math.floor(Number(window.gameTime.currentDay) || 0)); } catch (e2) {}
        return 0;
    }
    function _season() {
        try { return String((window.gameTime && window.gameTime.currentSeason) || ''); } catch (e) { return ''; }
    }
    function _weatherId() {
        try {
            if (typeof window.getCurrentWeather === 'function') {
                var w = window.getCurrentWeather();
                if (w && w.id) return String(w.id);
            }
        } catch (e) {}
        try { if (window.currentWeather && window.currentWeather.id) return String(window.currentWeather.id); } catch (e2) {}
        return '';   // 天气通道缺席：空串，雨天句静默跳过
    }
    function _say(line) {
        try {
            if (typeof window.showMessage === 'function') { window.showMessage(line, 'info'); return true; }
        } catch (e) {
            console.warn('[静默失败] js/items-extended/15-root-refine.js · _say：身体记忆一句没说出口（账已落，下句照常）', e && e.message);
        }
        return false;   // 播报通道缺席：静默跳过
    }
    // 心境小波动走 RewardService 正门；缺席/失败只少一句回执，绝不另走野路子扣心境
    function _mood(dip) {
        try {
            if (window.RewardService && typeof window.RewardService.apply === 'function') {
                var r = window.RewardService.apply({ mood: dip }, { source: 'root_body_memory' });
                if (r && r.success && r.messages && r.messages.length) return '（' + r.messages.join('，') + '）';
            }
        } catch (e) {
            console.warn('[静默失败] js/items-extended/15-root-refine.js · _mood：心境小波动没走成 RewardService——只少一句回执，不动别的账', e && e.message);
        }
        return '';
    }

    // ---- 换根口包装：成功才记账，返回值原样透传，丹药主流程零牵连 ----
    function _noteRefine(dayBefore) {
        try {
            var d = Math.max(0, Math.floor(Number(dayBefore) || 0));
            if (d <= 0) return;                       // 无时间账：不记（暗线整轮缺席，静默）
            _st.refineCount = (Number(_st.refineCount) || 0) + 1;
            _st.pillDay = d;                          // 服丹那天=第0日（root-refine.js 内部推进的两时辰若跨日，也按服丹当日算）
            _st.bled = false;                         // 新一轮七日：淤血闸重开（跟服丹走，重走一轮）
        } catch (e) {
            console.warn('[静默失败] js/items-extended/15-root-refine.js · _noteRefine：服丹日戳没记上——丹照常生效，暗线这一轮缺席', e && e.message);
        }
    }
    function _wrapRefine() {
        try {
            if (typeof window.refineRootByPill !== 'function') return false;
            if (window.refineRootByPill._bodyMemoryWrapped) return true;
            var orig = window.refineRootByPill;
            var wrapped = function () {
                var dayBefore = _absDay();            // 先读日：真身内部会推进两时辰，可能跨日
                var r = orig.apply(this, arguments);
                try { if (r && !r.error) _noteRefine(dayBefore); } catch (e) {
                    console.warn('[静默失败] js/items-extended/15-root-refine.js · wrapped.refineRootByPill：暗线没跟服丹挂上——丹药主流程不受影响', e && e.message);
                }
                return r;
            };
            wrapped._bodyMemoryWrapped = true;
            window.refineRootByPill = wrapped;
            return true;
        } catch (e) {
            console.warn('[静默失败] js/items-extended/15-root-refine.js · _wrapRefine：换根口没包上——暗线休眠，服丹主流程不受影响', e && e.message);
            return false;
        }
    }

    // ---- 每日一句的总闸与三段事件流（顺序：夜句 → 淤血 → 雨天发紧） ----
    function _onNewDay() {
        try {
            _wrapRefine();   // 自愈点：换根口若比预期更晚就位，每天早晨补包一次（幂等）
            var d = _absDay();
            var pd = Number(_st.pillDay) || 0;
            if (d <= 0 || pd <= 0) return;            // 无时间账 / 从未换根：照旧，无事发生
            if (d === (Number(_st.lastDay) || 0)) return;   // 一日至多一句（总闸）
            var arcDay = d - pd;                      // 服丹日=0，次日=1
            if (arcDay >= 1 && arcDay <= ARC_LEN - 1) {
                // 第一~六日：夜间水声/松动——新日晨报追述昨夜，一夜一句、按阵发日映射（见句池注）
                _st.lastDay = d;
                var pool = (Number(_st.refineCount) || 0) > 1 ? ARC_NIGHTS_OLD : ARC_NIGHTS;
                _say(pool[arcDay - 1]);
                return;
            }
            if (arcDay >= ARC_LEN && !_st.bled) {
                // 第七日：吐出半口淤血——一次性事件 + 心境小波动（RewardService 正门）
                _st.lastDay = d;
                _st.bled = true;
                _say(((Number(_st.refineCount) || 0) > 1 ? BLOOD_OLD : BLOOD_FRESH) + _mood(MOOD_DIP));
                return;
            }
            if (arcDay > ARC_LEN && _st.bled) {
                // 此后：阴雨天偶发「发紧」——记忆不是惩罚，不减属性不设 debuff
                var wid = _weatherId();
                if (wid !== 'rainy' && wid !== 'stormy') return;   // 非雨日/天气通道缺席：不掷
                var sd = _season();
                if (sd && sd === _st.tightSeason && (Number(_st.tightSeasonCount) || 0) >= TIGHT_SEASON_CAP) return;   // 每季上限
                if (d - (Number(_st.lastTightDay) || 0) < TIGHT_MIN_SPACING) return;   // 间隔下限
                if (Math.random() >= RAIN_CHANCE) return;              // 雨天 30% 掷
                _st.lastDay = d;
                _st.lastTightDay = d;
                if (sd) {
                    if (sd !== _st.tightSeason) { _st.tightSeason = sd; _st.tightSeasonCount = 0; }
                    _st.tightSeasonCount = (Number(_st.tightSeasonCount) || 0) + 1;
                }
                if ((Number(_st.refineCount) || 0) > 1) _say(TIGHT_OLD);
                else _say(TIGHT_FRESH[Math.floor(Math.random() * TIGHT_FRESH.length)]);
            }
            // arcDay<=0（服丹当日再翻日？不可能）/ 其余：无事
        } catch (e) {
            console.warn('[静默失败] js/items-extended/15-root-refine.js · _onNewDay：身体记忆日检没跑完——当日静默跳过', e && e.message);
        }
    }

    // ---- 订阅新日：主路 EventBus('newDay')（与天气同一通道、注册序在其后=读得到今天的雨）；
    //      总线缺席才回退 timeSystem.onNewDaySubscribe（那路天气不更新，雨天句自然静默） ----
    function _subscribe() {
        try {
            if (window.EventBus && typeof window.EventBus.on === 'function') {
                window.EventBus.on('newDay', function () { _onNewDay(); });
                return;
            }
        } catch (e) {
            console.warn('[静默失败] js/items-extended/15-root-refine.js · _subscribe：EventBus 订阅没挂上，试回退路', e && e.message);
        }
        try {
            if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') {
                window.timeSystem.onNewDaySubscribe(function () { _onNewDay(); });
            }
        } catch (e2) {
            console.warn('[静默失败] js/items-extended/15-root-refine.js · _subscribe：新日订阅两条路都没挂上——暗线休眠', e2 && e2.message);
        }
    }

    // ---- 入档（StateRegistry 新键 'rootBodyMemory'，version 1，加键不升版：
    //      旧档快照无此键 → importAll 自然跳过 = 从未换根照旧；页内坏字段逐项归一，坏账不进门） ----
    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        try {
            window.StateRegistry.register('rootBodyMemory', {
                version: 1,
                export: function () { return JSON.parse(JSON.stringify(_st)); },
                import: function (d) {
                    var s = _blank();
                    if (d && typeof d === 'object') {
                        s.pillDay = Math.max(0, Math.floor(Number(d.pillDay) || 0));
                        s.refineCount = Math.max(0, Math.floor(Number(d.refineCount) || 0));
                        s.lastDay = Math.max(0, Math.floor(Number(d.lastDay) || 0));
                        s.bled = (d.bled === true);   // 布尔严收：垃圾值一律按「未完成」落（坏账不进门）
                        s.lastTightDay = Math.max(0, Math.floor(Number(d.lastTightDay) || 0));
                        var ts = String(d.tightSeason || '');
                        if (ts.length <= 10) s.tightSeason = ts;
                        s.tightSeasonCount = Math.max(0, Math.floor(Number(d.tightSeasonCount) || 0));
                    }
                    _st = s;
                },
                reset: function () { _st = _blank(); }
            });
        } catch (eReg) {
            console.warn('[静默失败] js/items-extended/15-root-refine.js · StateRegistry.register：身体记忆没入档——本局照常生效，读档后回到「从未换根」', eReg && eReg.message);
        }
    }

    // ---- 只读读口（冒烟/面板将来接用；不提供写口——账只跟服丹与新日走） ----
    window.RootBodyMemory = {
        info: function () { try { return JSON.parse(JSON.stringify(_st)); } catch (e) { return null; } },
        ARC_LEN: ARC_LEN
    };

    // ---- 初始化：换根口晚于本文件加载（root-refine.js:2320 > 本文件:2024），等它就位再包；
    //      订阅挂 load 之后，保证排在 weather-effects 的 'newDay' 监听之后（时序要点见头部盘点） ----
    var _wrapTries = 0;
    function _initWrap() {
        if (_wrapRefine()) return;
        if (typeof setTimeout !== 'function' || ++_wrapTries >= WRAP_MAX_TRIES) return;   // 等不到=暗线静默休眠
        setTimeout(_initWrap, 500);
    }
    try {
        if (typeof document !== 'undefined' && document.readyState === 'complete') {
            _initWrap();
            _subscribe();
        } else if (typeof window.addEventListener === 'function') {
            window.addEventListener('load', function () { _initWrap(); _subscribe(); });
        } else {
            _initWrap();
            _subscribe();
        }
    } catch (eInit) {
        console.warn('[静默失败] js/items-extended/15-root-refine.js · init：暗线初始化没走完——静默休眠，服丹主流程不受影响', eInit && eInit.message);
    }
})();
