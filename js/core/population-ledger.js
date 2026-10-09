// ==================== population-ledger.js — 人口户账（轻账A案·v27.13） ====================
// 职责：过堂⑤「人口死账」的最小补法——每城一个人口数，月结一次：
//       丰年添口、灾年/瘟疫/兵灾减丁；人口显著变动后的下一次月结，
//       从游戏日志（gameLog 正门）冒一两条市井烟火消息。只记账与出声，不建新 UI。
// 口径（为什么这么做）：
//   · 驱动源——全库读得到的现成信号只有「季节」与「城市悬赏基金水位」（world-ledger.fund/
//     bountyMul，商税抽成注入，市面丰瘠的影子）。玩家名气/恶名是玩家的账，不当城市景气用；
//     case-system 无可读的公开查口——读不到的就不用，只用季节+市面+随机（过堂原话：读得到
//     什么用什么，读不到就只用季节+随机）。哪天这些系统开了查口，在 _prosperityRate() 里加一行即可。
//   · 基准值——全库没有城市人口/等阶配置（mapData 的 cities 是纯名字串），故基准由本文件
//     一张小表（名城手定）+ 城名确定性散列（无名新城 1.5~6 万）推出，写死在代码里不进存档。
//   · 夹逼——人口永远被夹在基准值 ±20%（POP_BAND）内，轻账不许漂成另一个世界。
//   · 月结日——对齐全库 day%30==0 口径（与 world-ledger 的 _dayOfMonth/铸币阀同一 cadence）。
//   · 纪律——人口账只加观察者不锁既有系统：任何现有系统不因本账缺席而坏；本账读不到
//     WorldLedger/timeSystem 时一律中性兜底继续跑。noteCalamity 是给未来系统的可选上报口，
//     无人调用也不影响任何账（缺省驱动=季节+市面+随机）。
// 依赖：StateRegistry（存档）、timeSystem.onNewDaySubscribe（日结挂月结）、window.mapData（城表）、
//       window.WorldLedger.fund/bountyMul（可选景气信号）、window.gameLog（消息正门）——全部可选。
// 存档：StateRegistry 'populationLedger'（version 1；老档缺键自动补空）

(function () {
    'use strict';

    var _v = 1;

    // ── 账本本体 ─────────────────────────────────────────
    var _ledger = {
        pop: {},          // 城（紧凑名，去空白）-> 人口数（口）。首见按基准值起账。
        lastSettledDay: 0,   // 上次月结的绝对日（0=从未）。同日防重入；断档不补结（轻账只滚当下）
        pendingNews: [],  // 下一月结要冒的市井消息 [{ city, text, warn }]——「上月变动、下月开口」
        calamities: {}    // 城 -> [{ kind, pct }]  外部系统可选上报的一次性灾祸（noteCalamity 口）
    };

    // v27.13：基准值小表——键一律紧凑名（去空白，与 location-system.getCityData 同一归一口）。
    // 数值是「口」不是「户」，文案里写「百户」按一户四~五口折算，别把两个单位写串。
    var POP_BASE = {
        '帝都·长安': 120000,   // 帝都，万仙汇聚
        '洛水城': 60000,       // 中州大城
        '青木城': 45000,       // 灵药商埠
        '炎城': 36000,         // 南疆火山之城
        '金城': 36000,         // 西漠矿市
        '冰原城': 26000,       // 北冥苦寒
        '灵界·蓬莱仙境': 20000, // 仙家会盟之地
        '魔界·九幽深渊': 15000, // 魔修立市交易
        '大漠孤城': 12000,     // 边陲孤垒
        '剑阁': 10000,         // 宗门山麓市集
        '青城山': 10000,
        '太虚山': 8000,
        '万剑宗': 8000,
        '鲛人镇': 9000,
        '蓬莱仙岛': 8000,
        '东海龙宫': 6000,
        '碧落仙宫': 6000,
        '凤凰巢': 6000,
        '万毒谷': 5000,
        '佛国遗址': 4000,
        '极寒之地': 3000,
        '灵界·九天罡风带': 800,  // 险地驿站
        '魔界·血海荒原': 500     // 魔物逐血，无市
    };
    var POP_FALLBACK_MIN = 15000; // 无名新城的散列基准下限
    var POP_FALLBACK_SPAN = 46000; // 散列跨度 1.5~6.1 万（含整取）
    var POP_BAND = 0.2;            // 夹逼带：基准值 ±20%

    // ── 小工具 ───────────────────────────────────────────
    function _ck(name) { // 城名归一：去全部空白（「帝都 · 长安」↔「帝都·长安」一个城）
        return String(name || '').replace(/\s+/g, '');
    }

    function _absDay() {
        try {
            if (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') return window.timeSystem.getAbsoluteDay();
            if (window.gameTime && typeof window.gameTime.currentDay === 'number') return window.gameTime.currentDay;
        } catch (e) {}
        return 1;
    }

    // v27.13：季节真源=timeSystem.gameTime.currentSeason（updateSeason 按月序刷新，仙历一月春首）；
    // timeSystem 未挂/getMonth 缺失（world-ledger._month() 同款处境）时按真季节轴自推：
    // 月序=floor((绝对日-1)/30)%12，每三月一季——与 time-system.js:158 同一条轴，不自创历法。
    function _season() {
        try {
            var gt = window.timeSystem && window.timeSystem.gameTime;
            if (gt && gt.currentSeason) return gt.currentSeason; // 'spring'|'summer'|'autumn'|'winter'
        } catch (e) {}
        try {
            var d = Math.max(1, _absDay());
            var mi = Math.floor((d - 1) / 30) % 12;
            return ['spring', 'summer', 'autumn', 'winter'][Math.floor(mi / 3)];
        } catch (e2) {}
        return 'spring'; // 什么都读不到：按春算（中性偏添口，最不伤人）
    }

    function _city() { // 当前城（紧凑名）；读不到回空串（没有"当前城"概念就不发城内消息）
        try {
            if (typeof window.getCurrentLocation === 'function') {
                var loc = window.getCurrentLocation();
                if (typeof loc === 'string' && loc) return _ck(loc);
                if (loc && typeof loc === 'object') {
                    if (loc.cityName) return _ck(loc.cityName);
                    if (loc.name) return _ck(loc.name);
                }
            }
            if (typeof window.currentLocation === 'string' && window.currentLocation) return _ck(window.currentLocation);
        } catch (e) {}
        return '';
    }

    // v27.13：城表枚举。注意 regions.js 的 mapData 是「地区名-> {cities:[名]}」的对象，
    // 不是数组——world-ledger._cityList() 对它 forEach 是落空的（本文件不替它改，只把自己写对）。
    // 两种形态都认：对象（现状）与数组（万一将来改回去）。
    function _cityList() {
        var out = [];
        try {
            var md = window.mapData;
            if (!md) return out;
            var pushCity = function (c) { var n = (typeof c === 'string') ? c : (c && c.name); if (n) out.push(_ck(n)); };
            if (typeof md.forEach === 'function') {
                md.forEach(function (r) { ((r && r.cities) || []).forEach(pushCity); });
            } else {
                Object.keys(md).forEach(function (rg) { (((md[rg] && md[rg].cities) || [])).forEach(pushCity); });
            }
        } catch (e) {
            console.warn('[静默失败] js/core/population-ledger.js · _cityList：城表读不出来，本月只结当前城', e && e.message);
        }
        return out;
    }

    // ── 基准值：小表没有的城用城名散列推一个（确定性：同名永远同数） ──
    function baseline(cityName) {
        var key = _ck(cityName);
        if (!key) return 0;
        if (POP_BASE[key] != null) return POP_BASE[key];
        var h = 0;
        for (var i = 0; i < key.length; i++) { h = (h * 31 + key.charCodeAt(i)) >>> 0; }
        return POP_FALLBACK_MIN + (h % (POP_FALLBACK_SPAN + 1));
    }

    function _clamp(cityName, n) {
        var base = baseline(cityName);
        var lo = Math.floor(base * (1 - POP_BAND));
        var hi = Math.ceil(base * (1 + POP_BAND));
        return Math.max(lo, Math.min(hi, n));
    }

    // ── 查口：首见按基准起账（老档/新城零迁移） ───────────
    function population(cityName) {
        var key = _ck(cityName);
        if (!key) return 0;
        if (typeof _ledger.pop[key] !== 'number') _ledger.pop[key] = baseline(key);
        return _ledger.pop[key];
    }

    // ── 景气信号（可选联动：WorldLedger 缺席=中性 0） ─────
    // v27.13：悬赏基金是商税抽成注入的——库见底（bountyMul 0 档「官府无力悬赏」）当市面凋敝，
    // 库丰（>=300，与 world-ledger 赏格足额线同一条线）当商旅辐辏。中间态不动。
    function _prosperityRate(cityName) {
        var rate = 0;
        try {
            if (window.WorldLedger && typeof window.WorldLedger.bountyMul === 'function') {
                var mul = window.WorldLedger.bountyMul(cityName);
                if (mul && mul.mul === 0) return -0.006;             // 基金见底：民生凋敝，月流千分之六
                if (mul && mul.mul >= 1 && typeof window.WorldLedger.fund === 'function') {
                    if (window.WorldLedger.fund(cityName) >= 300) rate += 0.003; // 库丰：添口
                }
            }
        } catch (e) {
            console.warn('[静默失败] js/core/population-ledger.js · _prosperityRate：景气信号读不到，本月按中性算', e && e.message);
        }
        return rate;
    }

    // ── 月结驱动率：季节为主轴，随机只出小灾小庆 ──────────
    // v27.13：全部按「月千分比」计——60 口小城一个月 ±30 口上下，肉眼看不出跳变，
    // 但一年四季下来城与城、冬与夏有了分别。灾变概率压得很低（每月每城 1.5%~3%），
    // 这是给世界加呼吸，不是给玩家加灾难片。
    function _monthRate(cityName) {
        var rate = 0;
        var hits = []; // 本月落在这个城头上的事（决定下月消息说什么）
        switch (_season()) {
            case 'spring': rate += 0.005; break;  // 春耕招垦，四乡佃户入城
            case 'summer': break;                 // 夏无常态
            case 'autumn': rate += 0.004; break;  // 秋收丰足
            case 'winter': rate -= 0.004; break;  // 严寒减丁，老弱难熬
        }
        if (_season() === 'summer' && Math.random() < 0.03) {   // 暑疫：3%/月/城
            var pl = 0.02 + Math.random() * 0.02;               // 减 2%~4%
            rate -= pl; hits.push({ kind: 'plague', pct: pl });
        }
        if (_season() === 'winter' && Math.random() < 0.02) {   // 雪灾：2%/月/城
            var sn = 0.01 + Math.random() * 0.01;               // 再减 1%~2%
            rate -= sn; hits.push({ kind: 'snow', pct: sn });
        }
        if (Math.random() < 0.015) {                            // 流寇过境/兵灾：1.5%/月/城，不挑季节
            var wr = 0.015 + Math.random() * 0.015;             // 减 1.5%~3%
            rate -= wr; hits.push({ kind: 'war', pct: wr });
        }
        if (Math.random() < 0.04) {                             // 风调雨顺：4%/月/城
            var bm = 0.01 + Math.random() * 0.01;               // 添 1%~2%
            rate += bm; hits.push({ kind: 'bumper', pct: bm });
        }
        var p = _prosperityRate(cityName);
        // v27.13：景气只是背景速率（静默修率），不入 hits——旧稿把「库丰」也当事件推，
        // 会让每个基金过线的城月月都排市井消息，冲掉「显著变动才开口」的门。背景归背景，事件归事件。
        rate += p;
        // 外部上报的一次性灾祸（noteCalamity 口；无人上报此段为空）
        var cal = _ledger.calamities[cityName];
        if (cal && cal.length) {
            for (var i = 0; i < cal.length; i++) {
                rate -= (cal[i].pct || 0.04);
                hits.push({ kind: cal[i].kind || 'calamity', pct: cal[i].pct || 0.04, big: true });
            }
            _ledger.calamities[cityName] = [];
        }
        return { rate: rate, hits: hits };
    }

    // ── 市井烟火文案（人口变动 -> 下一月结的日志消息） ────
    // v27.13：正门=gameLog（与名气到站/恶名到站同一张嘴），不建新 UI 不弹窗。
    var NEWS_TEXT = {
        boom: [
            '{c}城西新开了间染坊，正贴榜招染匠，一街人都去凑热闹。',
            '{c}东市又起了两排新铺面，木匠的斧头声从早响到晚。',
            '{c}南门的脚店连轴转——跑商的骡队一茬接一茬，店钱都涨了。'
        ],
        bumper: [
            '今岁风调雨顺，{c}四乡添了不少新丁，稳婆忙得脚不沾地。',
            '{c}秋粮满仓，乡下来城里投亲落户的比往年多。'
        ],
        plague: [
            '去年那场瘟疫亡了百户，{c}西市半条街还空着，入夜没人敢走。',
            '{c}时疫才过，几条巷子门上还钉着封条，走过只闻得见艾烟味。'
        ],
        war: [
            '流寇过了几拨，{c}城南几村十室三空，田垄都荒了。',
            '{c}城外兵灾才歇，城门口流民排着队等施粥。'
        ],
        snow: [
            '一冬严寒冻毙了些孤老，{c}义庄的薄棺都不够用。',
            '{c}大雪压塌了几户矮房，里正正张罗着募钱修屋。'
        ],
        flood: [
            '夏汛冲了{c}下游两处村圩，灾民在城外搭起窝棚。',
            '{c}河堤决了个口子，淹了两岸的秋田——粮价眼看着往上蹿。'
        ],
        bust: [
            '{c}南街三家铺子贴了「转让」的红纸——人都往大州府去了。',
            '{c}市面冷清，挑担的货郎说村里见不着什么年轻人了。'
        ]
    };
    var CALAMITY_TEXT = {
        plague: '疫气突至，{c}半月之间闭户百余家——郎中的药钱都收到了明年。',
        war: '兵灾骤降，{c}城外火烧连营，逃难的人进城像淌水一样。',
        flood: '洪水破圩，{c}沿河人家一夜成了泽国。',
        quake: '地动山摇，{c}城墙裂了三处，塌了半条街。',
        calamity: '{c}遭了大难，十室九闭，人口凋零。'
    };
    // v27.13：世界年表（模块⑬）「哪城灾」史书体文案——月结真落了灾才入史册（丰年/景气不入，
    // 年表记天下大事，不记寻常年景）。{c} 由月结处换成城名；年号「修仙历N年，」由 recordAnnal 统一加。
    var CALAMITY_ANNAL = {
        plague: '{c}大疫，闾里闭户，十室九病——史官记：死者甚众。',
        war: '流寇过{c}，兵灾连月，乡野十室三空，郡县征丁御之。',
        snow: '{c}大雪连旬，冻馁者众，官府开仓赈济，民始安。',
        flood: '{c}河决，洪水破圩，沿河人家一夜尽成泽国。',
        _d: '{c}遭大难，十室九闭，户口凋敝——官府赈济数月方息。'
    };

    function _pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    function _fmt(text, city) { return String(text).replace(/\{c\}/g, city); }

    // ── 可选上报口：外部系统砸下大灾时喊一声（纯观察者，没人调用也万事运转） ──
    // kind ∈ plague|war|flood|quake|calamity；pct 缺省 4%（减 4%±）。下一次月结落账。
    function noteCalamity(cityName, kind, pct) {
        try {
            var key = _ck(cityName);
            if (!key) return false;
            if (!_ledger.calamities[key]) _ledger.calamities[key] = [];
            _ledger.calamities[key].push({ kind: String(kind || 'calamity'), pct: Math.max(0.005, Math.min(0.2, Number(pct) || 0.04)) });
            return true;
        } catch (e) {
            console.warn('[静默失败] js/core/population-ledger.js · noteCalamity：灾祸没记上账', e && e.message);
            return false;
        }
    }

    // ── 月结 ─────────────────────────────────────────────
    // v27.13：挂日结钩子，绝对日 %30===0 时跑（day 30/60/90…，与 world-ledger 铸币阀同一天，
    // 月末一盘账）。断档（连跳多天/老档久存）只结当下一次，不补中间——轻账不追历史。
    function onNewDay() {
        var today = _absDay();
        if (today <= 0 || today % 30 !== 0) return;
        if (_ledger.lastSettledDay === today) return; // 同日防重入
        _ledger.lastSettledDay = today;
        monthlySettle();
    }

    function monthlySettle() {
        // 0) 先开口，后记账：pendingNews 是上个月欠的市井消息——「上月变动、下月开口」
        _flushNews();
        // 1) 逐城过账
        var cities = _cityList();
        var cur = _city();
        if (cur && cities.indexOf(cur) < 0) cities.push(cur); // 当前城不在表里（比如特殊地图）也结这一笔
        for (var i = 0; i < cities.length; i++) {
            var c = cities[i];
            if (!c) continue;
            var prev = population(c);
            var m = _monthRate(c);
            var next = _clamp(c, Math.round(prev * (1 + m.rate)));
            var delta = next - prev;
            _ledger.pop[c] = next;
            // v27.13：世界年表（模块⑬）——「哪城灾」钩子：本月真落了灾（疫/兵/雪，或外部上报灾 big）才入史册。
            // 语义澄清：noteCalamity 是**入账口**（外部系统把灾报进来，攒到下一次月结落人口账），
            // 不是出账上报口——所以史册直记在此（灾真落到哪城哪月，史官记哪笔），不走 noteCalamity（绕回自身）。
            // 一场月结至多记头一件灾（recordAnnal 对同 kind'calamity'+同城自带 60 日节流，第二件本也会被拦）；
            // 年表缺席/节流期内静默不记，零风险。
            try {
                var _dis = null;
                for (var h = 0; h < m.hits.length; h++) {
                    var hk = m.hits[h].kind;
                    if (hk === 'plague' || hk === 'war' || hk === 'snow' || hk === 'flood' || m.hits[h].big) { _dis = m.hits[h]; break; }
                }
                if (_dis && window.WorldLedger && typeof window.WorldLedger.recordAnnal === 'function') {
                    var _txt = CALAMITY_ANNAL[_dis.kind] || CALAMITY_ANNAL._d;
                    window.WorldLedger.recordAnnal('calamity', _fmt(_txt, c), c);
                }
            } catch (eAnnal) {}
            if (delta === 0 && !m.hits.length) continue;
            // 2) 显著变动才留话：净变 ≥1.5% 基准，或当月真出了事（疫/兵/雪/上报灾）
            var sig = Math.abs(delta) >= baseline(c) * 0.015;
            if (!sig && !m.hits.length) continue;
            var kind = _newsKind(m, delta);
            _queueNews(c, kind);
        }
    }

    // 选消息类别：真灾真庆优先（大事要开口），否则按净流向给 boom/bust
    // v27.13：hits 里只有疫/兵/雪/上报灾（big）与丰年（bumper）——景气是背景速率不进 hits，
    // boom/bust 只在「无事件但净变跨过 1.5% 显著线」时作兜底口径。
    function _newsKind(m, delta) {
        var big = null;
        for (var i = 0; i < m.hits.length; i++) {
            if (m.hits[i].big || m.hits[i].kind === 'plague' || m.hits[i].kind === 'war' ||
                m.hits[i].kind === 'snow' || m.hits[i].kind === 'flood') { big = m.hits[i]; break; }
            if (m.hits[i].kind === 'bumper' && !big) big = m.hits[i];
        }
        if (big) return big.kind;
        return delta >= 0 ? 'boom' : 'bust';
    }

    function _queueNews(city, kind) {
        var pool = NEWS_TEXT[kind] || NEWS_TEXT.bust;
        var item = { city: city, text: _fmt(_pick(pool), city), warn: (kind === 'plague' || kind === 'war' || kind === 'snow' || kind === 'flood' || kind === 'bust') };
        _ledger.pendingNews.push(item);
        // 消息队列封顶 12 条（防存档膨胀+防刷屏）：最老的先丢，市井话本来说新不说旧
        while (_ledger.pendingNews.length > 12) _ledger.pendingNews.shift();
    }

    // 出声：玩家所在城的话直接说（≤2 条），外城走「商旅来报」（≤1 条）——一月至多三条，不多嘴
    function _flushNews() {
        if (!_ledger.pendingNews.length) return;
        try {
            if (!(window.gameLog && typeof window.gameLog.add === 'function')) { _ledger.pendingNews = []; return; }
            var cur = _city();
            var local = [], afar = [];
            for (var i = 0; i < _ledger.pendingNews.length; i++) {
                var n = _ledger.pendingNews[i];
                if (cur && n.city === cur) local.push(n); else afar.push(n);
            }
            var said = 0;
            for (var l = 0; l < local.length && said < 2; l++, said++) {
                window.gameLog.add(local[l].text, local[l].warn ? 'warning' : 'info');
            }
            if (afar.length && said < 3) {
                var a = afar[Math.floor(Math.random() * afar.length)];
                window.gameLog.add('🧳 商旅来报：' + a.text, a.warn ? 'warning' : 'info');
            }
        } catch (e) {
            console.warn('[静默失败] js/core/population-ledger.js · _flushNews：市井消息没送到日志', e && e.message);
        } finally {
            _ledger.pendingNews = []; // 出没出声都清队——消息是话，不是账
        }
    }

    // ── 存档（StateRegistry，唯一所有者=本文件；照 world-ledger 的注册法） ──
    try {
        if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
            window.StateRegistry.register('populationLedger', {
                version: _v,
                // v27.13：export 出深拷贝（StateRegistry.exportAll 本会 clone，这里自担一份——
                // 防注册方不 clone 时 import 途中改到活账本：账本对象被抽换，快照跟着变形）
                export: function () { return JSON.parse(JSON.stringify(_ledger)); },
                import: function (data) {
                    if (!data || typeof data !== 'object') return;
                    // 老档缺键兜底：pop 补空（首见按基准起账）、news 补空、lastSettledDay 归 0（下个 %30 日重新开结）
                    var popIn = data.pop || {};
                    var popOut = {};
                    Object.keys(popIn).forEach(function (k) {
                        var n = Number(popIn[k]);
                        if (typeof n === 'number' && isFinite(n) && n > 0) popOut[_ck(k)] = Math.round(n);
                    });
                    _ledger.pop = popOut;
                    _ledger.pendingNews = Array.isArray(data.pendingNews) ? data.pendingNews.slice(0, 12) : [];
                    var lsd = Number(data.lastSettledDay);
                    _ledger.lastSettledDay = (typeof lsd === 'number' && isFinite(lsd) && lsd > 0) ? Math.round(lsd) : 0;
                    var calIn = data.calamities || {};
                    var calOut = {};
                    Object.keys(calIn).forEach(function (k) {
                        if (Array.isArray(calIn[k])) calOut[_ck(k)] = calIn[k].filter(function (x) { return x && typeof x === 'object'; });
                    });
                    _ledger.calamities = calOut;
                },
                reset: function () {
                    _ledger.pop = {};
                    _ledger.lastSettledDay = 0;
                    _ledger.pendingNews = [];
                    _ledger.calamities = {};
                }
            });
        } else {
            console.warn('[PopulationLedger] StateRegistry 不可用——人口户账不入档（旧档兼容期）');
        }
    } catch (e) {
        console.warn('[PopulationLedger] 注册存档失败:', e);
    }

    // ── 日结订阅（timeSystem 缺席时静默——轻账不许砸场子） ──
    try {
        if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') {
            window.timeSystem.onNewDaySubscribe(function () { try { onNewDay(); } catch (e) { console.warn('[PopulationLedger] 月结失败:', e); } });
        }
    } catch (e) {}

    window.PopulationLedger = {
        population: population,       // 查口：城人口数（首见自动起账）
        baseline: baseline,           // 查口：城基准值（夹逼中心）
        noteCalamity: noteCalamity,   // 可选上报口：外部灾祸（疫/兵/水/震）——无人调用也万事运转
        _onNewDay: onNewDay,          // 测试钩子
        _settleNow: monthlySettle,    // 测试钩子：强制月结（内部仍走 flush+过账）
        _cityList: _cityList          // 测试钩子：城表枚举
    };
})();
