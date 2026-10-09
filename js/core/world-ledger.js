// ==================== world-ledger.js — 世界账簿（真实小世界·账本层） ====================
// 职责：城市级共享账本——市场流水 / 悬赏基金 / 掌柜收购额度 / 区域药藏 / 区域矿藏（v27.13）/
//       名气扩散 / 恶名扩散 / 行情时滞 / 传闻传播（v27.13）/ 世界年表（v27.13：模块⑬新增）/ 店铺时辰 / 钱票 /
//       国库↔城基金两条通道（v27.13：岁贡·恩赏，模块⑨改良——朝堂决策落到城里）。
//       只记账与提供查口，不认识具体玩法。
//       玩法接线（悬赏扣款、掌柜限收、名气显示、行情牌读旧价等）在各系统文件里。
// 依赖：StateRegistry（存档）、timeSystem.onNewDaySubscribe（日结）、
//       城市真源链 getCurrentCityName → locationSystem.getCurrentLocation → currentCharData.location
//       （v27.13：与 reward-service.resolveCity 同一把尺，全缺时退 '野'——见 _city() 内注）、
//       EventBus + MarketDynamic（行情时滞读口接线，
//       两者都比本文件晚挂载——用 _lateAttach 晚接，缺席则时滞静默不生效，账照记）
// 纪律：成本走世界账，不设人为日限配额——一切闸门都是经济/生态后果的影子；
//       账唯一所有者=本文件；文案数字全部出自本账，不编造。
// 存档：StateRegistry 'worldLedger'（version 2；v27.13 增 priceHist/rumorSeen/rumorPend，旧档缺键自动空；
//       v27.13 又增 fundFlows 岁贡/恩赏流水，旧档缺键自动空——仍沿用 version 2 与前例同律；
//       v27.13 再增 annals 世界年表（模块⑬），旧档缺键自动空——同一律，加键不升版）

(function () {
    'use strict';

    var _v = 2;
    // 世界市面池：无具体出资方的奖励（民间酬谢/事件报偿）从这里出——
    // 池被挣薄则民间酬谢见折，月度铸币 2% 缓补（央行小通胀，游戏不断粮）。
    var WORLD_POOL_BASE = 200000;
    var MINT_MONTHLY = 0.02;
    var _ledger = {
        marketFlow: {},   // 城 -> { day, sold, bought }  当日成交流水（卖出=玩家卖给商家，铜钱灵石折算记灵石口径）
        shopQuota: {},    // 店 -> { day, left }          掌柜当日还能收多少（=昨日该店收货总额×0.6，周转）
        bountyFund: {},   // 城 -> 灵石                   城市悬赏基金（商税抽成注入，挂赏/发赏流出）
        herbStock: {},    // 区域key -> { stock, cap }    区域药藏（采集扣、按旬恢复）
        oreStock: {},     // 区域key -> { stock, cap }    v27.13：区域矿藏（凿矿扣、按旬恢复）——矿丹守恒，与药藏同一本账同一套方子
        fameSeen: {},     // 城 -> { fame, day }          该城"已知名气"（扩散到达才更新）
        famePend: {},     // 城 -> [{ fame, arriveDay }]  在途名气（靠商旅带话）
        notoSeen: {},     // 城 -> { noto, day }          v27.13 该城"已知恶名"（恶名分城：此城犯案彼城起初不知）
        notoPend: {},     // 城 -> [{ noto, arriveDay }]  v27.13 在途恶名（通缉文书与江湖流言走得比人慢）
        heardOf: {},      // v27.15 城 -> { from, untilDay } 江湖耳语暗账：这城有人认得你的脸（从案底城来的跑镖人，一年有效——结仇结缘/新案热度可读）
        priceHist: {},    // 大区 -> 品类 -> [{day, mul}] v27.13 行情价史（每天各大区各行记一价，环形 12 笔封顶）——行情时滞的底账
        rumorSeen: {},    // 城 -> [{text, kind, fromCity, day}] v27.13 本城听说的传闻（新的在前，留 6 条——茶馆只有新鲜事的市场）
        rumorPend: {},    // 城 -> [{text, kind, fromCity, day, arriveDay}] v27.13 在途传闻（商旅带话，与名气同一把尺）
        annals: [],       // v27.13 世界年表（模块⑬）：[{year, kind, text, city?, day}] 天下大事的史册，封顶 200 条旧的滚出
        tickets: { seq: 1, list: [] }, // 钱票 [{id, amount, issueCity, issuedDay}]
        worldFloat: WORLD_POOL_BASE, // 世界市面池：社会散钱总账（全城基金/国库/宗门库之外）
        minted: 0,        // 累计铸币（月度通胀阀放出的新钱，审计用）
        fundingLedger: [], // 货币总闸流水：[{day, from, asked, paid}]（每笔凭空笔的可追溯账）
        fundFlows: []     // v27.13 岁贡/恩赏流水：[{day, kind, city, amount}]（kind 'tribute'=解贡出城/'grant'=恩赏入城）
    };

    // v27.13：季节真源收口。旧 _month() 调 timeSystem.getMonth()——time-system 根本没这号函数
    // （它只暴露 getAbsoluteDay，月序是内部推导：monthsPassed=floor((绝对日-1)/30)%12，0~11），
    // try/catch 永远落回 1 → 季节恒判为春：药藏「冬季停长」、矿藏「冬季停恢复」两道季节闸从没关过。
    // 现照 time-system.js B3 同一条轴自推（30 天一月、12 月一年）：月序0起，春0夏1秋2冬3=月序除3取整
    // （仙历一月为春首，十~十二月冬）——本文件所有季节分支（药藏/矿藏）只认这一把尺；
    // 行情/传闻账无季节语义，不掺和。
    function _monthIndex0() {
        var d = _absDay();
        if (!(d >= 1)) d = 1; // 时间系统缺席按第 1 天起账（春首），不产生负月序
        return Math.floor((d - 1) / 30) % 12;
    }
    function _seasonIdx() {
        return Math.floor(_monthIndex0() / 3); // 0春1夏2秋3冬
    }
    // 药藏：区域上限表（无账区域按默认 60 株）——每旬（10 天）恢复 cap×20%，物候：冬季停长
    var HERB_DEFAULT_CAP = 60;
    // v27.13：矿藏同一把尺（无账区域默认 60 藏）——审计③/⑩口径「照药藏方子给矿脉做 regen」，
    // 故 cap、旬恢复率全同药藏，不另立一档数；真嫌松紧不对，单独拧 ORE_DEFAULT_CAP 这一枚旋钮即可。
    var ORE_DEFAULT_CAP = 60;

    // v27.13：城市真源收口——与 js/core/reward-service.js 的 resolveCity 必须同一条链
    //（getCurrentCityName → locationSystem.getCurrentLocation → currentCharData.location → '野' 兜底），
    // 两处今后要改一起改，不许单边分叉（城市真源单一，分叉即假账）。
    // 旧病核实：旧 _city 问 window.getCurrentLocation 后按对象形状取 .cityName/.name——
    // 该 getter（location-system 顶层函数，虽真在 window 上）返回的是字符串城名，形状恒错配，
    // 两道检查恒假 → 本函数恒落'野'：名气/恶名/传闻/悬赏/设施回流等一切不显式传城的记账，
    // 源头城全被记成'野'，"同城立知、外地到站"的分城账整体失真。现照 resolveCity 同链解析，每环 try/catch。
    function _city() {
        try {
            if (typeof window.getCurrentCityName === 'function') {
                var c1 = window.getCurrentCityName();
                if (c1) return c1;
            }
        } catch (e0) {}
        try {
            if (window.locationSystem && typeof window.locationSystem.getCurrentLocation === 'function') {
                var c2 = window.locationSystem.getCurrentLocation();
                if (c2) return c2;
            }
        } catch (e1) {}
        try {
            var c3 = window.currentCharData && window.currentCharData.location;
            if (c3) return c3;
        } catch (e2) {}
        return '野';
    }

    function _absDay() {
        try {
            if (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') return window.timeSystem.getAbsoluteDay();
        } catch (e) {}
        return 0;
    }

    // 每月第几日（铸币阀用；绝对日对 30 取模+1，月长 30 天与 time-system 的 B3 月轴同口径）
    function _dayOfMonth() {
        var d = _absDay();
        return (d % 30) + 1;
    }

    function _flow(cityName) {
        var c = cityName || _city();
        var f = _ledger.marketFlow[c];
        var today = _absDay();
        if (!f || f.day !== today) { f = _ledger.marketFlow[c] = { day: today, sold: 0, bought: 0 }; }
        return f;
    }

    // ── 市场流水 + 掌柜额度 ─────────────────────────────
    // 卖出闸口：掌柜额度=昨日该店收货总额×60%（资金周转）。额度尽则今日拒收，
    // 文案说人话（本钱压在货上），不出现"系统限制"字样。
    function canShopBuy(shopId, amount) {
        var q = _ledger.shopQuota[shopId];
        if (!q || q.day !== _absDay()) {
            // 今日首次问价：昨日账由日结滚动；若日结未跑到（新开档），给开办周转 300
            q = _ledger.shopQuota[shopId] = { day: _absDay(), left: (q && typeof q.lastSold === 'number') ? Math.floor(q.lastSold * 0.6) : 300 };
        }
        // 本笔比余额还大——连这单都收不下（最后一笔超额防漏）
        if (typeof amount === 'number' && amount > q.left) {
            return { ok: false, left: q.left, msg: '掌柜翻了翻钱柜：「今日收货的本钱使完了，客官明日再来罢。」' };
        }
        return { ok: q.left > 0, left: q.left };
    }

    function noteSale(shopId, amount, cityName) {
        var f = _flow(cityName);
        f.sold += amount;
        var q = _ledger.shopQuota[shopId];
        if (!q || q.day !== _absDay()) q = _ledger.shopQuota[shopId] = { day: _absDay(), left: (q && typeof q.lastSold === 'number') ? Math.floor(q.lastSold * 0.6) : 300, lastSold: 0 };
        if (typeof q.lastSold !== 'number') q.lastSold = 0;
        q.lastSold += amount;
        q.left = Math.max(0, q.left - amount);
        return q.left;
    }

    function noteBuy(amount, cityName) {
        _flow(cityName).bought += amount;
    }

    // ── 拍卖流水（v27.13：④改良——百万级交易不能无声无息） ──
    // 拍卖成交（锤音那一刻）把成交额记进该城当日市面流水：
    //   · 玩家寄卖拍出（钱从买主流向玩家）→ 本正门，入 marketFlow.sold 同一本账，
    //     日结商税 3% 照抽（与掌柜收货同口径）——城市基金从此看得见大交易；
    //   · 玩家竞得/买断（钱从玩家流向市面）→ 不走这里，走 noteBuy（既有正门，纯流水）。
    // 为何不直接用 noteSale：noteSale 兼管掌柜额度（shopQuota——昨日收货×60% 的周转账），
    // 拍卖行不是收货掌柜，记过去会凭空多出一本永不安分的掌柜额度账，语义不合，故单开一等正门。
    // 存档：只写 marketFlow（StateRegistry 'worldLedger' 既有键）——无新键，import/reset 原样兜底，不用扩。
    // 大成交顺手成谣：成交额≥ AUCTION_RUMOR_MIN 灵石的落槌进传闻账（茶馆里该有它的动静），
    // 阈值是一枚可拧的旋钮，不是经济闸。
    var AUCTION_RUMOR_MIN = 10000;
    function noteAuctionSale(amount, cityName) {
        amount = Math.floor(Number(amount) || 0);
        if (!(amount > 0)) return { flow: 0 };
        var c = cityName || _city();
        var f = _flow(c);
        f.sold += amount;
        if (amount >= AUCTION_RUMOR_MIN) {
            try {
                noteRumor('「' + c + '」的拍卖行里落了一记重槌——一件大货拍出了 ' + amount + ' 灵石，满城议论了半日。', 'world', c);
            } catch (eRum) { console.warn('[静默失败] js/core/world-ledger.js · noteAuctionSale：大成交没进传闻账', eRum && eRum.message); }
        }
        return { flow: f.sold };
    }

    // ── 悬赏基金 ────────────────────────────────────────
    // 日结注入：昨日市场成交额×3%（商税一成、税中三成充赏——数字可调，先立账跑月看水位）
    // 城首见给开办银 500（官府开办赏格）。
    function fund(cityName) {
        var c = cityName || _city();
        if (typeof _ledger.bountyFund[c] !== 'number') _ledger.bountyFund[c] = 500;
        return _ledger.bountyFund[c];
    }

    // 开榜定档：足额原价；不足五成六折；不足两成三折；见底停挂。返回 {mul, note}
    function bountyMul(cityName) {
        var f = fund(cityName);
        if (f <= 0) return { mul: 0, note: '（城中赏金吃紧，官府无力悬赏）' };
        if (f < 100) return { mul: 0.3, note: '（赏金吃紧，赏格从薄）' };
        if (f < 300) return { mul: 0.6, note: '（近来花销大，赏格打了折）' };
        return { mul: 1, note: '' };
    }

    function payBounty(cityName, amount) {
        var c = cityName || _city();
        var f = fund(c);
        var paid = Math.min(f, amount); // 库足全额；见底按实有折付（官府不赊账）
        _ledger.bountyFund[c] = f - paid;
        return { ok: paid > 0, paid: paid };
    }

    // ── 国库↔城基金两条通道（v27.13：模块⑨改良——朝堂决策落到城里） ──
    // 岁贡：属城基金月解国库一成（dynasty-court 月结时调 levyTribute）；恩赏：国库拨属城修桥铺路
    //（dynasty-court 调 grantCityFund）。真转账不凭空生钱：城侧扣/进多少，流水记多少，
    // 国库侧那一半账由朝堂自己的国库账记（两本账各记各的半边，两边相抵才是全账）。
    // 无账城市不解贡（没有基金结余就没有可解的成数——不为抽成凭空开账户；fund() 的 500 开办银
    // 是悬赏语境的出生路，岁贡不借它）；恩赏落账允许经 fund() 开户（与设施回流 noteFacilitySpend 同一条出生路）。
    // fundPeek：只读查口，无账/负账都报 0，绝不开户——月结算「一成」的基数用 peek，不用 fund。
    function fundPeek(cityName) {
        var c = cityName;
        if (!c) return 0;
        var f = _ledger.bountyFund[c];
        return (typeof f === 'number' && f > 0) ? Math.floor(f) : 0;
    }
    function levyTribute(cityName, amount) {
        var c = cityName;
        amount = Math.floor(Number(amount) || 0);
        if (!c || !(amount > 0)) return { ok: false, paid: 0 };
        var f = _ledger.bountyFund[c];
        if (typeof f !== 'number') return { ok: false, paid: 0 };  // 无基金账：不解（不凭空生钱）
        var paid = Math.max(0, Math.min(Math.floor(f), amount));   // 见底按实有折解——官府不赊账
        if (paid > 0) _ledger.bountyFund[c] = f - paid;
        _ledger.fundFlows.push({ day: _absDay(), kind: 'tribute', city: c, amount: paid });
        if (_ledger.fundFlows.length > 120) _ledger.fundFlows.shift(); // 流水封顶（与 fundingLedger 同律，防存档膨胀）
        return { ok: paid > 0, paid: paid, short: amount - paid };
    }
    function grantCityFund(cityName, amount) {
        var c = cityName;
        amount = Math.floor(Number(amount) || 0);
        if (!c || !(amount > 0)) return { ok: false, granted: 0 };
        var had = (typeof _ledger.bountyFund[c] === 'number');
        _ledger.bountyFund[c] = fund(c) + amount;   // 无账城市经 fund() 开户（500 开办银与设施回流同一条出生路）
        _ledger.fundFlows.push({ day: _absDay(), kind: 'grant', city: c, amount: amount });
        if (_ledger.fundFlows.length > 120) _ledger.fundFlows.shift();
        return { ok: true, granted: amount, city: c, hadAccount: had };
    }


    // ── 名气扩散（B案：扩散天数表） ─────────────────────
    // 名气从发生地随商旅外传：同城当日知 / 邻城（同地区）2 天 / 边陲 7 天。
    // 各城"已知名气"独立推进；查名望显示用 knownFame(city)。
    // 传播半径简化：不建商路图，按 index 相邻城=邻城（regions 城表序），边陲=序首序尾。
    function noteFameChange(amount) {
        if (!amount) return;
        var from = _city();
        var today = _absDay();
        // 同城立知（先记——城市表缺失时也必须有这一笔）
        var s0 = _ledger.fameSeen[from] || (_ledger.fameSeen[from] = { fame: 0, day: today });
        s0.fame += amount; s0.day = today;
        // 外城随商旅：传播半径简化——不建商路图，按 mapData 城表序，相邻=邻城
        var cities = _cityList();
        cities.forEach(function (c) {
            if (c === from) return;
            var delay = _spreadDelay(from, c, cities);
            var p = _ledger.famePend[c] || (_ledger.famePend[c] = []);
            p.push({ fame: amount, arriveDay: today + delay });
        });
// v27.13：大名声自己长腿进传闻账（扬名立万/名声扫地都是茶馆的生意）——|Δ|≥8 才值得传
          try {
              if (Math.abs(amount) >= 8) {
                  noteRumor(amount > 0
                      ? '「' + from + '」来了位了不得的人物，茶楼酒肆都在传他的名号。'
                      : '「' + from + '」有位人物的名声栽了大跟头，近来没人再提他。',
                      'fame', from);
                  // v27.24：成名大事同笔进史册——传闻是茶馆的生意，史册是世界的记忆（同一正门双写）
                  try {
                      recordAnnal('fame', amount > 0
                          ? '「' + from + '」出了一位名动一方的人物。'
                          : '「' + from + '」有位曾名动一方的人物声名俱坠。', from);
                  } catch (eAnnalFame) {}
              }
        } catch (eRum2) { console.warn('[静默失败] js/core/world-ledger.js · noteFameChange：大名没进传闻账', eRum2 && eRum2.message); }
    }

    function _cityList() {
        // v27.13 核实修正：真源 regions.js 的 window.mapData 是「区域名 → { cities: [...] }」的字典，
        // 旧代码守卫 window.mapData.forEach——字典没有 forEach，守卫恒假 → 本函数恒返 []：
        // 名气/恶名扩散的「外城在途」半边从没发过车（同城立知活着、跨城到站死账），传闻账若沿用也会同病。
        // 现两种形态都认：字典（真源现形）为主，数组形态留防御位；cities 传来的若是个字典
        //（城名在键上）也兼容——这是防并行改表/改档把 cities 换形态的兜底，不是对现状的臆测。
        try {
            var md = window.mapData;
            if (!md) return [];
            var out = [];
            var push = function (c) { out.push(c && c.name ? c.name : c); };
            var addCities = function (cs) {
                if (Array.isArray(cs)) { cs.forEach(push); return; }
                if (cs && typeof cs === 'object') { Object.keys(cs).forEach(push); return; } // 字典形态 cities：城名在键上
            };
            if (Array.isArray(md)) {
                // 防御位：区域数组形态（每区域带 cities）——现库没有这种形，留着不掉链子
                md.forEach(function (r) { addCities(r && r.cities); });
            } else {
                for (var r in md) {
                    if (!Object.prototype.hasOwnProperty.call(md, r)) continue;
                    addCities(md[r] && md[r].cities);
                }
            }
            if (out.length) return out;
        } catch (e) {
            console.warn('[静默失败] js/core/world-ledger.js · _cityList：城表没读出来——名气/恶名/传闻的跨城扩散暂停一趟', e && e.message);
        }
        return [];
    }

    function _spreadDelay(from, to, cities) {
        var i = cities.indexOf(from), j = cities.indexOf(to);
        if (i < 0 || j < 0) return 4; // 查不到城表：中庸 4 天
        var edge = (i === 0 || i === cities.length - 1 || j === 0 || j === cities.length - 1);
        var d = Math.abs(i - j);
        return d <= 1 ? 2 : (edge ? 7 : Math.min(7, 2 + d));
    }

    function knownFame(cityName) {
        var c = cityName || _city();
        var s = _ledger.fameSeen[c];
        return s ? s.fame : 0; // 没传到的地方不认识你
    }

    // ── 恶名分城（v27.13：照名气扩散同一套方子，一刀活） ──
    // 旧病：notoriety 是全局单值——此城犯案彼城立知，流窜玩法立不起来。
    // 现恶名记进同一本城市字典：作案地当日立知，外城走通缉文书/江湖流言的延迟，
    // 换城谋生背上的是"本地未知"——直到你的案底跟着商旅传到。
    // 写入端：RewardService 正门（r.notoriety）+ 各直写点接线（见各文件 v27.13 注）。
    function noteNotorietyChange(amount) {
        if (!amount) return;
        var from = _city();
        var today = _absDay();
        var s0 = _ledger.notoSeen[from] || (_ledger.notoSeen[from] = { noto: 0, day: today });
        s0.noto += amount; s0.noto = Math.max(0, s0.noto); s0.day = today;
        var cities = _cityList();
        cities.forEach(function (c) {
            if (c === from) return;
            var delay = _spreadDelay(from, c, cities);
            var p = _ledger.notoPend[c] || (_ledger.notoPend[c] = []);
            p.push({ noto: amount, arriveDay: today + delay });
        });
        // v27.13：大案顺手成谣（同一正门两刀面——数字进恶名账，故事进传闻账）。
        // 只挑 |Δ|≥10 的大动静（小偷小摸进不了茶馆），文书走得和流言一样慢，账面才对得上。
try {
              if (Math.abs(amount) >= 10) {
                  noteRumor(amount > 0
                      ? '「' + from + '」城里出了桩大案，官府的海捕文书都发到邻县了。'
                      : '「' + from + '」那桩闹得沸沸扬扬的案子有了了结，官府收了海捕文书。',
                      'case', from);
                  // v27.24：大案同笔进史册——海捕文书发到哪，史册记到哪（同一正门双写）
                  try {
                      recordAnnal('noto', amount > 0
                          ? '「' + from + '」出了一桩震动一方的大案，海捕文书都发到邻县了。'
                          : '「' + from + '」震动一方的大案告结，海捕文书收了回去。', from);
                  } catch (eAnnalNoto) {}
              }
        } catch (eRum) { console.warn('[静默失败] js/core/world-ledger.js · noteNotorietyChange：大案没进传闻账', eRum && eRum.message); }
    }

    function knownNotoriety(cityName) {
        var c = cityName || _city();
        var s = _ledger.notoSeen[c];
        return s ? Math.max(0, s.noto) : 0; // 没传到的地方不知道你干过什么
    }

    // ── 江湖耳语暗账（v27.15 ⑦新增-1）——消息跟着人的脚走，不跟着城走 ──
    // 与 notoSeen（官面海捕文书）的分工：这是活人脑子里的记性——从案底城跑镖来的人认了你的脸，
    // 不起哄不报官，只是记着。一年有效（记性会淡）；将来结仇结缘/新案热度从这里加码。
    function noteHeardOf(cityName, fromCity, days) {
        var c = cityName || _city();
        if (!c) return;
        var d = Math.max(1, Number(days) || 365);
        _ledger.heardOf[c] = { from: String(fromCity || ''), untilDay: _absDay() + d };
    }
    function heardOfIn(cityName) {
        var c = cityName || _city();
        var h = _ledger.heardOf[c];
        if (!h) return null;
        if (_absDay() >= h.untilDay) { delete _ledger.heardOf[c]; return null; }  // 记性淡了——茶凉了
        return h;   // {from, untilDay}
    }

    // ── 行情时滞（v27.13：计划书条6——名气分城了，行情也得分城） ──
    // 旧病：行情真源（MarketDynamic 六大区×六品类）是全天下一张嘴——南疆刚涨的价，长安当下就知，
    // 跨城倒卖零信息差，跑商=纯腿钱。现账本存「价史」：每天各大区各行的价记一笔（正门两处：
    // 日结全量快照 + 行情变动事件），谁城读到几号的价，按商路节奏（同区当日/邻区隔2日/边区隔7日，
    // 照名气扩散同一把尺）往回翻史册——你在这城看到的价，是商旅上趟带来的旧价。
    // 为何不照名气搞 per-city pend：行情是连续量（36 格×每日一价），pend 会往存档塞几千条在途消息；
    // 价史环 36 格×12 笔封顶，读口按城折算到站日即可——同一条消息账，体积省五十倍。
    // 读口统一接在 MarketDynamic.priceMul 上（_attachMarketRead）：脚下大区眼见为实，外区读旧价——
    // 商队行情板/街坊口条/丐帮眼线/跑商指路全是现成报价面，零改动自动吃到时滞；
    // 买卖结算全发生在脚下大区（人就在柜台前），照旧读现价，时滞不碰钱包。
    var PRICE_HIST_CAP = 12; // 每格价史保留笔数（约两旬——再旧的消息没人信）

    function _catOf(catOrItem) {
        var MD = window.MarketDynamic;
        if (!MD) return null;
        try {
            if (MD.CATEGORIES && MD.CATEGORIES.indexOf(catOrItem) >= 0) return catOrItem;
            if (typeof MD.getItemCategory === 'function') return MD.getItemCategory(catOrItem) || null;
        } catch (e) {}
        return null;
    }

    // 城池/地名 → 行情大区（MarketDynamic 自带折算，别名与户口册两套写法它都认）
    function _marketRegionFor(loc) {
        try {
            loc = loc || _city();
            if (window.MarketDynamic && typeof window.MarketDynamic.regionFor === 'function') {
                return window.MarketDynamic.regionFor(loc) || null;
            }
        } catch (e) {}
        return null;
    }

    // 现价（只认未接线的原装 priceMul——快照/读口绝不能经自己的接线，不然旧价回环自我抄袭）
    function _liveMul(region, cat) {
        var f = _origPriceMul || (window.MarketDynamic && typeof window.MarketDynamic.priceMul === 'function' ? window.MarketDynamic.priceMul : null);
        if (typeof f !== 'function') return null;
        try {
            var m = Number(f(region, cat));
            return (isFinite(m) && m > 0) ? m : null;
        } catch (e) {}
        return null;
    }

    // 行情大区间的商路天数（照 _spreadDelay 同一把尺：同区0/邻区2/边区7；折不进按中庸4天）
    function _regionDelay(fromRegion, hereCityOrRegion) {
        var MD = window.MarketDynamic;
        var here = _marketRegionFor(hereCityOrRegion);
        if (!fromRegion || !here || !MD || !MD.CITIES) return 4;
        var i = MD.CITIES.indexOf(fromRegion), j = MD.CITIES.indexOf(here);
        if (i < 0 || j < 0) return 4;
        if (i === j) return 0; // 脚下大区，眼见为实
        var edge = (i === 0 || i === MD.CITIES.length - 1 || j === 0 || j === MD.CITIES.length - 1);
        var d = Math.abs(i - j);
        return d <= 1 ? 2 : (edge ? 7 : Math.min(7, 2 + d));
    }

    // 价史记一笔（正门）：同日覆写（史册一日一价），环形封顶
    function _notePrice(region, cat, mul, day) {
        if (!region || !cat || !(mul > 0)) return;
        day = (typeof day === 'number') ? day : _absDay();
        var byCat = _ledger.priceHist[region] || (_ledger.priceHist[region] = {});
        var arr = byCat[cat] || (byCat[cat] = []);
        var last = arr[arr.length - 1];
        if (last && last.day === day) { last.mul = mul; return; }
        arr.push({ day: day, mul: mul });
        if (arr.length > PRICE_HIST_CAP) arr.shift();
    }

    // 日结全量快照：各大区各行的当日价入史（商旅每天照本宣科，这就是"上趟"的趟）
    function _snapshotPrices() {
        var MD = window.MarketDynamic;
        if (!MD || !MD.CITIES || !MD.CATEGORIES) return;
        var today = _absDay();
        for (var i = 0; i < MD.CITIES.length; i++) {
            for (var j = 0; j < MD.CATEGORIES.length; j++) {
                var m = _liveMul(MD.CITIES[i], MD.CATEGORIES[j]);
                if (m != null) _notePrice(MD.CITIES[i], MD.CATEGORIES[j], m, today);
            }
        }
    }

    // 读口：here 城对 region 大区 cat 行的「已知价」——商旅上趟带来的旧价；
    // 从未听闻时退静态地理行情（南疆药材贱、西荒矿材贱——天下共知，不用商旅教）
    function knownPriceMul(hereCityOrRegion, region, catOrItem) {
        var MD = window.MarketDynamic;
        var cat = _catOf(catOrItem);
        if (!cat || !region || !MD) {
            // 折不出品类/大区：退回现价口径（不挡买卖——原装 priceMul 对这些入参本来就给 1.0）
            var f0 = _liveMul(region, catOrItem);
            return f0 != null ? f0 : 1.0;
        }
        var delay = _regionDelay(region, hereCityOrRegion);
        if (delay <= 0) { var _lv = _liveMul(region, cat); return _lv != null ? _lv : 1.0; }
        var newsDay = _absDay() - delay;
        var byCat = _ledger.priceHist[region];
        var arr = byCat && byCat[cat];
        var best = null;
        if (arr && arr.length) {
            for (var i = 0; i < arr.length; i++) {
                if (arr[i].day <= newsDay && (!best || arr[i].day > best.day)) best = arr[i];
            }
        }
        if (best) return best.mul;
        var bias = MD.CITY_BASE_BIAS && MD.CITY_BASE_BIAS[region];
        return (bias && typeof bias[cat] === 'number') ? bias[cat] : 1.0;
    }

    // 账龄读口（给行情牌配「几天前的消息」的话头）：0=脚下现价；null=从未听闻
    function knownPriceAge(hereCityOrRegion, region, catOrItem) {
        var cat = _catOf(catOrItem);
        if (!cat || !region) return null;
        var delay = _regionDelay(region, hereCityOrRegion);
        if (delay <= 0) return 0;
        var newsDay = _absDay() - delay;
        var byCat = _ledger.priceHist[region];
        var arr = byCat && byCat[cat];
        var best = null;
        if (arr && arr.length) {
            for (var i = 0; i < arr.length; i++) {
                if (arr[i].day <= newsDay && (!best || arr[i].day > best.day)) best = arr[i];
            }
        }
        return best ? Math.max(0, _absDay() - best.day) : null;
    }

    // 读口接线：把 MarketDynamic.priceMul 的跨区报价改读「本城已知价」。
    // 只拦脚下大区以外的读法——买卖结算、本城时价签全在脚下大区，照旧现价。
    // market-dynamic.js 比本文件晚挂载，故由 _lateAttach 晚接（load/日结时补挂）。
    var _origPriceMul = null;
    function _hereRegion() {
        var loc = '';
        try { loc = (typeof window.getCurrentCityName === 'function' && window.getCurrentCityName()) || ''; } catch (e0) {}
        if (!loc) loc = (window.currentCharData && window.currentCharData.location) || '';
        if (!loc && window.locationSystem && typeof window.locationSystem.getCurrentLocation === 'function') {
            loc = window.locationSystem.getCurrentLocation() || '';
        }
        // 折算口径与结算同源（WorldLoop.mapMarketCity 是报价处自己传参用的那把尺，永不落空）
        try {
            if (window.WorldLoop && typeof window.WorldLoop.mapMarketCity === 'function') {
                return window.WorldLoop.mapMarketCity(loc) || null;
            }
        } catch (e1) {}
        return _marketRegionFor(loc);
    }
    function _attachMarketRead() {
        if (_origPriceMul) return;
        var MD = window.MarketDynamic;
        if (!MD || typeof MD.priceMul !== 'function') return;
        _origPriceMul = MD.priceMul;
        MD.priceMul = function (region, catOrItem) {
            try {
                var here = _hereRegion();
                if (region === here) return _origPriceMul(region, catOrItem); // 脚下大区，眼见为实
                return knownPriceMul(here, region, catOrItem);                // 外区=商旅旧价（行情时滞）
            } catch (e) {
                return _origPriceMul(region, catOrItem);
            }
        };
    }

    // 晚接总口：EventBus 与 MarketDynamic 都比本文件晚挂载（仙侠.html 脚本序），IIFE 里接不上。
    // 三个时机兜底：window load（defer 脚本全部就位后）、每次日结（load 若被吞）、外部首查（knownPriceMul 引）。
    // 接不上也不炸：行情照记现价快照之外的部分静默缺位，时滞暂不生效，账本结构不受影响。
    var _busAttached = false;
    function _lateAttach() {
        _attachMarketRead();
        if (_busAttached) return;
        var bus = window.EventBus;
        if (!bus || typeof bus.on !== 'function') return;
        _busAttached = true;
        // 正门①玩家/商队买卖动行情（adjustFromTrade 收口后广播）——把新一日的价覆写进史册
        bus.on('market:priceChange', function (p) {
            try {
                if (!p || !p.cityId || !p.category) return;
                var m = Number(p.newMul);
                if (!(isFinite(m) && m > 0)) m = _liveMul(p.cityId, p.category);
                if (m != null) _notePrice(p.cityId, p.category, m, _absDay());
            } catch (e) { console.warn('[静默失败] js/core/world-ledger.js · market:priceChange：行情没入史', e && e.message); }
        });
        // 正门②世界事件改供需（瘟疫/丰收/宗战…受影响大区×品类的最新价入史）
        bus.on('market:event:applied', function (p) {
            try {
                if (!p || !p.cities || !p.mods) return;
                var today = _absDay();
                p.cities.forEach(function (ct) {
                    for (var cat in p.mods) {
                        var m = _liveMul(ct, cat);
                        if (m != null) _notePrice(ct, cat, m, today);
                    }
                });
            } catch (e) { console.warn('[静默失败] js/core/world-ledger.js · market:event:applied：行情没入史', e && e.message); }
        });
        // 正门③坊市急求（NPC 需求抬价）——单区单品类入史
        bus.on('market:npcNeed', function (p) {
            try {
                var n = p && p.need;
                if (!n || !n.city || !n.category) return;
                var m = _liveMul(n.city, n.category);
                if (m != null) _notePrice(n.city, n.category, m, _absDay());
            } catch (e) { console.warn('[静默失败] js/core/world-ledger.js · market:npcNeed：行情没入史', e && e.message); }
        });
    }

    // ── 传闻传播（v27.13：同一套消息账的第二刀面——名气/恶名传的是数字，传闻传的是故事） ──
    // 到站机制照名气扩散原样抄：事发地当日立知，外城随商旅按 _spreadDelay 到站，日结入城。
    // 正门三处：noteRumor（外部接线口）+ 恶名/名气大动静自动成谣（大案要闻，小打小闹不进茶馆）
    // + 世界大事（world-events.js activateWorldEvent 一处接线）。读口给客栈夜话等消费面。
    var RUMOR_KEEP = 6;   // 每城在手传闻条数上限——茶馆只有新鲜事的市场
    var RUMOR_PEND_CAP = 40; // 在途传闻每城上限（防异常刷写把存档撑肥，最旧的先被挤掉）

function noteRumor(text, kind, fromCity, carrier) {
          text = String(text || '').trim();
          if (!text) return null;
          var from = fromCity || _city();
          var today = _absDay();
          // v27.25：消息统一总闸——carrier=这条消息靠什么腿走（商旅/海捕文书/告示/人腿），缺省商旅
          // （传闻/名气自古商旅带话；人犯单走海捕文书，行情异动走商旅——四路同闸，消费面按 carrier 分层）
          var car = String(carrier || '商旅');
          var entry = { text: text, kind: kind || 'world', fromCity: from, day: today, carrier: car };
          var seen = _ledger.rumorSeen[from] || (_ledger.rumorSeen[from] = []);
          seen.unshift({ text: entry.text, kind: entry.kind, fromCity: entry.fromCity, day: today, carrier: entry.carrier }); // 本地立知：当事人在场
          if (seen.length > RUMOR_KEEP) seen.length = RUMOR_KEEP;
          var cities = _cityList();
          cities.forEach(function (c) {
              if (c === from) return;
              var delay = _spreadDelay(from, c, cities);
              var p = _ledger.rumorPend[c] || (_ledger.rumorPend[c] = []);
              p.push({ text: entry.text, kind: entry.kind, fromCity: entry.fromCity, day: today, arriveDay: today + delay, carrier: entry.carrier });
              if (p.length > RUMOR_PEND_CAP) p.shift();
          });
          return entry;
      }

    // 读口：本城在手传闻（副本，按新到在前）——传闻账不动，消费面自己挑话头
    function knownRumors(cityName) {
        var c = cityName || _city();
        var s = _ledger.rumorSeen[c];
        if (!s || !s.length) return [];
return s.map(function (r) {
              return { text: r.text, kind: r.kind, fromCity: r.fromCity, day: r.day, carrier: r.carrier || '商旅', age: Math.max(0, _absDay() - r.day) };
          });
    }

    // 读口：本城最新一条传闻（客栈夜话用——老黄历没人翻，只说最新鲜的）
    function latestRumor(cityName) {
        var list = knownRumors(cityName);
        return list.length ? list[0] : null;
    }

    // ── 世界年表（v27.13：模块⑬新增——世界自己的史书） ──
    // 与传闻账的分工（同一套消息账的两张皮，互不顶替）：传闻是街头消息——带账龄、6 条滚旧、
    // 只在「新鲜事」市场流通，商旅当天带话才到站；年表是盖棺定论的史册——天下大事才入册
    //（谁登基/哪城灾/谁飞升，producer 各只挂最正统的一个结算点），传不传得到外城都与史册无关
    //（史官记的是天下事，不是某城的见闻）。同一件大事可以两头都落：传闻管当日的热度，年表管百年后
    // 还有人翻——茶馆说书人的「说史」讲的就是这本（consumer 见 city-facilities/tea-storyteller.js）。
    // 年号换算：全库世界历 360 日为一年（lifespan-system「世界历 360 日一年」同一条尺，节日账同口径），
    // 年 = floor(绝对日 / 360) + 1——绝对日 1~360 为修仙历 1 年，361 起为 2 年。
    // 节流：同 kind+city 短期（ANNAL_THROTTLE_DAYS 日）内不重记——同一场疫不必月月入册；
    // 节流水不单独入档，直接回翻 annals 本账核对，存读档之后照样认账（零迁移）。
    var ANNALS_CAP = 200;          // 史册封顶 200 条——旧的滚出（史册也要留纸，防存档膨胀）
    var ANNAL_THROTTLE_DAYS = 60;  // 同 kind+city 节流期：两个月内不重记同类大事

    function _annalYear() {
        var d = _absDay();
        if (!(d >= 1)) d = 1; // 时间系统缺席按第 1 天起账（修仙历 1 年），不产生 0 年/负年
        return Math.floor(d / 360) + 1;
    }

    // 正门：记一条天下大事。text 传史书体正文（不含年号——本门统一加「修仙历N年，」开头），
    // city 可缺（天下事没落在哪座城就传 undefined）。节流期内返回 null（不重记）。
    function recordAnnal(kind, text, city) {
        kind = String(kind || '').trim();
        text = String(text || '').trim();
        if (!kind || !text) return null;
        var today = _absDay();
        var ck = String(city || '');
        var a = _ledger.annals;
        for (var i = a.length - 1; i >= 0; i--) { // 从最新往回翻：同 kind+city 的最近一条
            if (a[i].kind === kind && String(a[i].city || '') === ck) {
                if (today - (Number(a[i].day) || 0) < ANNAL_THROTTLE_DAYS) return null; // 节流期内：不重记
                break; // 有旧账但已出节流期：史事再来一遍，照记
            }
        }
        var year = _annalYear();
        var entry = { year: year, kind: kind, text: '修仙历' + year + '年，' + text, day: today };
        if (ck) entry.city = ck;
        a.push(entry);
        while (a.length > ANNALS_CAP) a.shift(); // 封顶滚出：最旧的史事先让纸
        return entry;
    }

    // 读口：最近 n 条史册（副本，旧在前——史书从头翻；n 缺省 10，封顶不超 ANNALS_CAP）
    function annals(n) {
        var a = _ledger.annals;
        var cnt = Math.max(1, Math.min(ANNALS_CAP, Math.floor(Number(n) || 10)));
        return a.slice(Math.max(0, a.length - cnt)).map(function (e) {
            var o = { year: e.year, kind: e.kind, text: e.text, day: e.day };
            if (e.city) o.city = e.city;
            return o;
        });
    }

    // ── 设施消费回流（v27.13：计划书条2——市井的钱不能付完即蒸发） ──
    // 玩家在城里的设施净支出（澡堂/赌坊/酒楼/房钱/卦金/入城税…），旧账付完即消失：
    // 城基金不见涨、市面池不见厚。现六成入该城悬赏基金（官府抽头与商税同源），
    // 四成回世界市面池（店家掌柜的进项转手又花回市面）。
    // 只接设施语境：city-facilities 各 settle 封装传 facilitySpend 标记（v27.13 已注入 21 处）；
    // 钱庄存取（钱在账上没消失）、宗门捐献（钱进宗门库）、朝堂军资（钱出国库）不走此门。
    function noteFacilitySpend(amount, cityName) {
        amount = Math.floor(Number(amount) || 0);
        if (amount <= 0) return { cityFund: 0, toFloat: 0 };
        var c = cityName || _city();
        var toCity = Math.floor(amount * 0.6);
        var toFloat = amount - toCity;
        if (toCity > 0) _ledger.bountyFund[c] = fund(c) + toCity;
        if (toFloat > 0) _ledger.worldFloat += toFloat;
        return { cityFund: toCity, toFloat: toFloat };
    }

    // ── 区域药藏（守恒律：兽有繁殖季，草木也有生长季） ──
    // harvestHerb(n>0) 扣存量；存量尽则"此地灵药被采光了"；每旬恢复 cap×20%，冬季停长。
    // 季节自洽口径：与日结同源（仙历月序→季，一月春首；冬=仙历十月~十二月）
    function _seasonOff() {
        return _seasonIdx() === 3; // v27.13：季节真源收口后，冬季闸第一次真正能关上
    }
    function herbStock(regionKey) {
        var k = regionKey || _city();
        var s = _ledger.herbStock[k];
        if (!s) s = _ledger.herbStock[k] = { stock: HERB_DEFAULT_CAP, cap: HERB_DEFAULT_CAP };
        s.seasonOff = _seasonOff(); // 查询时同步季节标记（冬季草木凋零，采不动）
        return s;
    }

    function harvestHerb(regionKey, want) {
        var s = herbStock(regionKey);
        if (s.seasonOff) return { ok: false, got: 0, bare: s.stock <= 0, seasonOff: true };
        var got = Math.max(0, Math.min(want, s.stock));
        s.stock -= got;
        return { ok: got > 0, got: got, bare: s.stock <= 0 };
    }

    // ── 区域矿藏（v27.13：矿丹守恒，审计③/⑩「同片荒野两套物理」的收口刀） ──
    // 旧病：gatherHerbs 有药藏账，mineOre 纯掷骰无守恒——矿挖不绝，同片荒野药有藏量矿无限。
    // 现照药藏同一套方子：harvestOre(n>0) 扣存量；存量尽则"此地矿脉被采光"；每旬恢复 cap×20%。
    // 季节抑制只停恢复、不封镐：矿不比草木，隆冬矿脉仍在原地，只是石胎不回气
    //（与兽账同款精神——冬季缓生，不一刀禁采；药藏封镐是因草木冬天真凋零，矿石不会）。
    function oreStock(regionKey) {
        var k = regionKey || _city();
        var s = _ledger.oreStock[k];
        if (!s) s = _ledger.oreStock[k] = { stock: ORE_DEFAULT_CAP, cap: ORE_DEFAULT_CAP };
        return s;
    }

    function harvestOre(regionKey, want) {
        var s = oreStock(regionKey);
        var got = Math.max(0, Math.min(want, s.stock));
        s.stock -= got;
        return { ok: got > 0, got: got, bare: s.stock <= 0 };
    }

    // ── 店铺时辰（一致律：夜有夜的样子） ────────────────
    // 软案：戌(19)~卯(5) 大多数铺面打烊；夜市/赌坊/客栈/酒肆/钱庄夜柜豁免。
    function isShopOpen(shopId, hour) {
        var h = (typeof hour === 'number') ? hour : _hour();
        if (h >= 19 || h < 5) {
            var night = /夜市|赌|坊|客栈|酒|钱庄|当铺/.test(shopId || '');
            return night;
        }
        return true;
    }

    function _hour() {
        try {
            if (window.timeSystem && window.timeSystem.gameTime && typeof window.timeSystem.gameTime.currentHour === 'number') return window.timeSystem.gameTime.currentHour;
        } catch (e) {}
        return 12;
    }

    // ── 货币总闸（RewardService 后盾）：正向灵石必须有出资方 ──
    // ctx.funding 优先：'city'=当前城悬赏基金；'pool'/缺省=世界市面池（民间酬谢）。
    // 出资方扣不动则按实有折付——官府不赊账，民间也一样。每笔入流水账可追溯。
    function fundReward(amount, funding) {
        amount = Math.floor(Number(amount) || 0);
        if (amount <= 0) return { ok: true, paid: amount, from: 'none' };
        var today = _absDay();
        var source, from;
        if (funding === 'city') {
            source = 'bountyFund'; from = _city();
            var f = fund(from);
            var paid = Math.min(f, amount);
            _ledger.bountyFund[from] = f - paid;
        } else {
            // 世界市面池（民间酬谢的兜底盘子）
            source = 'worldFloat'; from = '民间';
            var poolPaid = Math.min(_ledger.worldFloat, amount);
            _ledger.worldFloat -= poolPaid;
            var paid = poolPaid;
        }
        _ledger.fundingLedger.push({ day: today, from: from, source: source, asked: amount, paid: paid });
        if (_ledger.fundingLedger.length > 500) _ledger.fundingLedger.shift(); // 流水上限（防存档膨胀）
        return { ok: paid > 0, paid: paid, from: from, source: source, short: amount - paid };
    }

    function worldFloat() { return Math.floor(_ledger.worldFloat); }

    // ── 钱票（钱庄白银票：大额免重，异地兑现 2% 水费） ──
    function issueTicket(amount, cityName) {
        if (!(amount > 0)) return null;
        var t = { id: 'wt_' + (_ledger.tickets.seq++), amount: amount, issueCity: cityName || _city(), issuedDay: _absDay() };
        _ledger.tickets.list.push(t);
        return t;
    }

    function redeemTicket(ticketId) {
        for (var i = 0; i < _ledger.tickets.list.length; i++) {
            if (_ledger.tickets.list[i].id === ticketId) {
                var t = _ledger.tickets.list[i];
                _ledger.tickets.list.splice(i, 1);
                var fee = Math.ceil(t.amount * 0.02);
                return { ok: true, amount: t.amount - fee, fee: fee, ticket: t };
            }
        }
        return { ok: false };
    }

    // ── 日结（世界账簿的一天） ──────────────────────────
    function onNewDay() {
        var today = _absDay();
        // v27.13：晚挂接线（EventBus/MarketDynamic 都比本文件晚加载——日结是最好的补挂时机，顺带行情读口）
        try { _lateAttach(); } catch (eL) { console.warn('[静默失败] js/core/world-ledger.js · onNewDay：晚挂接线失败', eL && eL.message); }
        // 0) 月度铸币阀（货币总闸的通胀口）：每月第一天市面池回血 2%——
        //    世界钱被玩家挣薄后，官府开炉铸新钱缓补；minted 记累计发行量（审计口径）
        if (today > 0 && _dayOfMonth() === 1) {
            var mint = Math.floor(_ledger.worldFloat * MINT_MONTHLY);
            if (mint > 0) {
                _ledger.worldFloat += mint;
                _ledger.minted += mint;
            }
        }
        // 1) 商税充赏：昨日成交×3% 入该城基金
        Object.keys(_ledger.marketFlow).forEach(function (c) {
            var f = _ledger.marketFlow[c];
            if (f.day === today - 1 && f.sold > 0) {
                _ledger.bountyFund[c] = fund(c) + Math.floor(f.sold * 0.03);
            }
            if (f.day !== today) delete _ledger.marketFlow[c];
        });
        // 2) 掌柜周转：昨日收货×60% 成为今日额度；歇业日（无收货）给保底 100（小本生意）
        Object.keys(_ledger.shopQuota).forEach(function (sid) {
            var q = _ledger.shopQuota[sid];
            if (q.day !== today) {
                var base = (typeof q.lastSold === 'number' && q.lastSold > 0) ? Math.floor(q.lastSold * 0.6) : 100;
                _ledger.shopQuota[sid] = { day: today, left: base, lastSold: 0 };
            }
        });
        // 3) 药藏/矿藏恢复：每旬（绝对日%10===0）恢复 20% 上限差；冬季草木不长、石胎不回气
        //    （v27.13：矿藏与药藏同账同律同一句里回血——季节抑制一停两停，不出现药停矿长的错季；
        //      v27.13 核实修正：季节真源改自推轴 _seasonIdx——旧尺恒判春，这道冬季闸从未生效过）
        if (today % 10 === 0 && _seasonIdx() !== 3) {
            Object.keys(_ledger.herbStock).forEach(function (k) {
                var s = _ledger.herbStock[k];
                s.stock = Math.min(s.cap, s.stock + Math.ceil((s.cap - s.stock) * 0.2));
            });
            Object.keys(_ledger.oreStock).forEach(function (k) {   // v27.13：矿藏同一把尺
                var s = _ledger.oreStock[k];
                s.stock = Math.min(s.cap, s.stock + Math.ceil((s.cap - s.stock) * 0.2));
            });
        }
        // 4) 名气到站：在途名气按到达日入城
        Object.keys(_ledger.famePend).forEach(function (c) {
            var pend = _ledger.famePend[c];
            var arrived = [];
            for (var i = pend.length - 1; i >= 0; i--) {
                if (pend[i].arriveDay <= today) {
                    arrived.push(pend[i].fame);
                    pend.splice(i, 1);
                }
            }
            if (arrived.length) {
                var s = _ledger.fameSeen[c] || (_ledger.fameSeen[c] = { fame: 0, day: today });
                arrived.forEach(function (a) { s.fame += a; });
                s.day = today;
                // 名声是走路的：商旅带话到站，日志说一句人话
                try {
                    if (window.gameLog && window.gameLog.add && (window.currentCharData && (window.currentCharData.fame || 0) > 0)) {
                        window.gameLog.add('🗣️ 商旅带来你的消息——「' + c + '」的江湖上开始有人说起你的名号了。', 'info');
                    }
                } catch (eLog) {}
            }
        });
        // 4b) 恶名到站（v27.13 分城恶名与名气同一套商旅扩散）：通缉文书与流言按到达日入城
        Object.keys(_ledger.notoPend).forEach(function (c) {
            var pend = _ledger.notoPend[c];
            var arrived = [];
            for (var i = pend.length - 1; i >= 0; i--) {
                if (pend[i].arriveDay <= today) {
                    arrived.push(pend[i].noto);
                    pend.splice(i, 1);
                }
            }
            if (arrived.length) {
                var sn = _ledger.notoSeen[c] || (_ledger.notoSeen[c] = { noto: 0, day: today });
                arrived.forEach(function (a) { sn.noto = Math.max(0, sn.noto + a); });
                sn.day = today;
                try {
                    var cdNow = window.currentCharData;
                    if (window.gameLog && window.gameLog.add && cdNow && (Number(cdNow.notoriety) || 0) >= 30) {
                        window.gameLog.add('🗄️ 有人认出了你——「' + c + '」的捕快房里开始流传你在外头干过的事。', 'warning');
                    }
                } catch (eLog2) {}
            }
        });
        // 5) 行情入史（v27.13：行情时滞的底账——今日各大区各行的价记一笔，外城读旧价全靠这本史册）
        try { _snapshotPrices(); } catch (eP) { console.warn('[静默失败] js/core/world-ledger.js · onNewDay：行情快照没入史', eP && eP.message); }
        // 6) 传闻到站（v27.13：商旅把外城的事带进本地茶馆——与名气/恶名同一套到站结算）
        Object.keys(_ledger.rumorPend).forEach(function (c) {
            var pend = _ledger.rumorPend[c];
            var arrived = [];
            for (var i = pend.length - 1; i >= 0; i--) {
                if (pend[i].arriveDay <= today) {
                    arrived.push(pend[i]);
                    pend.splice(i, 1);
                }
            }
            if (arrived.length) {
                var seen = _ledger.rumorSeen[c] || (_ledger.rumorSeen[c] = []);
                arrived.sort(function (a, b) { return b.day - a.day; }); // 新事在前
arrived.forEach(function (r) {
                      seen.unshift({ text: r.text, kind: r.kind, fromCity: r.fromCity, day: r.day, carrier: r.carrier || '商旅' }); // day=事发的日子——账龄说的是消息本身的年头
                  });
                if (seen.length > RUMOR_KEEP) seen.length = RUMOR_KEEP;
                // 只对最响的世界要闻说一句人话（市井小事/关于玩家自己的风声静默入账，免得刷屏）
                var top = null;
                arrived.forEach(function (r) { if (r.kind === 'world' && (!top || r.day > top.day)) top = r; });
                try {
                    if (top && window.gameLog && window.gameLog.add) {
                        window.gameLog.add('🗣️ 商旅从「' + top.fromCity + '」带来了消息——' + top.text, 'info');
                    }
                } catch (eLog3) {}
            }
        });
    }

    // ── 存档（StateRegistry，唯一所有者=本文件） ────────
    try {
        if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
            window.StateRegistry.register('worldLedger', {
                version: _v,
                export: function () { return _ledger; },
                import: function (data) {
                    if (!data || typeof data !== 'object') return;
                    _ledger.marketFlow = data.marketFlow || {};
                    _ledger.shopQuota = data.shopQuota || {};
                    _ledger.bountyFund = data.bountyFund || {};
                    _ledger.herbStock = data.herbStock || {};
                    _ledger.oreStock = data.oreStock || {};   // v27.13：矿藏账（老档缺键自动补空——区域首采时按满藏 60 起账，零迁移）
                    _ledger.fameSeen = data.fameSeen || {};
                    _ledger.famePend = data.famePend || {};
                    _ledger.notoSeen = data.notoSeen || {};   // v27.13 恶名分城（老档缺键自动补空）
                    _ledger.notoPend = data.notoPend || {};
                    _ledger.heardOf = data.heardOf || {};   // v27.15 耳语暗账（老档缺键自动空——没人记过你的脸）
                    _ledger.priceHist = data.priceHist || {};  // v27.13 行情价史（老档缺键自动空——头几日外城读静态地理行情，商路跑开即有真史）
                    _ledger.rumorSeen = data.rumorSeen || {};  // v27.13 传闻账（老档缺键自动空）
                    _ledger.rumorPend = data.rumorPend || {};
                    _ledger.fundFlows = data.fundFlows || [];  // v27.13 岁贡/恩赏流水（老档缺键自动空）
                    _ledger.annals = data.annals || [];        // v27.13 世界年表（老档缺键自动空——export 回的是整本 _ledger，import 必须对称接回，否则读档丢史册）
                    _ledger.tickets = data.tickets || { seq: 1, list: [] };
                },
                reset: function () {
                    _ledger.marketFlow = {}; _ledger.shopQuota = {}; _ledger.bountyFund = {};
                    _ledger.herbStock = {}; _ledger.oreStock = {}; _ledger.fameSeen = {}; _ledger.famePend = {};
                    _ledger.notoSeen = {}; _ledger.notoPend = {};
                    _ledger.priceHist = {}; _ledger.rumorSeen = {}; _ledger.rumorPend = {};
                    _ledger.fundFlows = [];
                    _ledger.annals = [];                       // v27.13 年表随档清空——新开一局天下无事，史官从头记
                    _ledger.tickets = { seq: 1, list: [] };
                }
            });
        } else {
            console.warn('[WorldLedger] StateRegistry 不可用——世界账簿不入档（旧档兼容期）');
        }
    } catch (e) {
        console.warn('[WorldLedger] 注册存档失败:', e);
    }

    // ── 日结订阅 ────────────────────────────────────────
    try {
        if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') {
            window.timeSystem.onNewDaySubscribe(function () { try { onNewDay(); } catch (e) { console.warn('[WorldLedger] 日结失败:', e); } });
        }
    } catch (e) {}

    // ── 晚挂接线（v27.13：行情时滞的读口与三事件订阅，都依赖比本文件晚加载的模块） ──
    try { _lateAttach(); } catch (eL0) {}                                    // 万一脚本序变了当场就接上
    try {
        if (typeof window.addEventListener === 'function') {
            window.addEventListener('load', function () { try { _lateAttach(); } catch (eL1) { console.warn('[静默失败] js/core/world-ledger.js · load 晚挂：', eL1 && eL1.message); } });
        }
    } catch (eL2) {}

    window.WorldLedger = {
        canShopBuy: canShopBuy,
        noteSale: noteSale,
        noteBuy: noteBuy,
        noteAuctionSale: noteAuctionSale,           // v27.13 拍卖流水正门：玩家寄卖拍出入 marketFlow.sold（日结商税照抽，大槌成谣）
        fund: fund,
        fundPeek: fundPeek,         // v27.13 只读查口：该城基金结余（无账/负账报 0，绝不开户——岁贡算基数用）
        bountyMul: bountyMul,
        payBounty: payBounty,
        levyTribute: levyTribute,   // v27.13 岁贡正门：城基金解出（见底折解、无账不解）——国库侧入账由朝堂记
        grantCityFund: grantCityFund, // v27.13 恩赏正门：国库拨银入城基金——国库侧出账由朝堂记
        noteFameChange: noteFameChange,
        knownFame: knownFame,
        noteNotorietyChange: noteNotorietyChange,   // v27.13 恶名分城
        knownNotoriety: knownNotoriety,
        noteHeardOf: noteHeardOf,                   // v27.15 江湖耳语暗账正门：这城有人记住了你的脸（跑镖人捎的记性，一年有效）
        heardOfIn: heardOfIn,                       // v27.15 耳语读口：这城有没有人认得你（过期自动忘——记性会淡）
        noteFacilitySpend: noteFacilitySpend,       // v27.13 设施消费回流（六成城基金四成民间池）
        knownPriceMul: knownPriceMul,               // v27.13 行情时滞读口：here 城对某大区某行的「已知价」（商旅上趟带来的旧价）
        knownPriceAge: knownPriceAge,               // v27.13 行情账龄（0=脚下现价；null=从未听闻）——给行情牌配「几天前的消息」
        noteRumor: noteRumor,                       // v27.13 传闻正门：事发地立知，外城随商旅隔日到站
        knownRumors: knownRumors,                   // v27.13 传闻读口：本城在手传闻（副本，新到在前）
        latestRumor: latestRumor,                   // v27.13 本城最新一条传闻（客栈夜话等消费面用）
        recordAnnal: recordAnnal,                   // v27.13 年表正门（模块⑬）：天下大事入史册——飞升/登基/灾变三 producer 各挂最正统一个结算点
        annals: annals,                             // v27.13 年表读口：最近 n 条史册（副本，旧在前）——茶馆说书人「说史」翻的就是这本
        herbStock: herbStock,
        harvestHerb: harvestHerb,
        oreStock: oreStock,         // v27.13：区域矿藏（矿丹守恒，与药藏同一本账）
        harvestOre: harvestOre,
        isShopOpen: isShopOpen,
        issueTicket: issueTicket,
        redeemTicket: redeemTicket,
        fundReward: fundReward,
        worldFloat: worldFloat,
        _onNewDay: onNewDay // 测试钩子
    };
})();
