// ==================== sect-internal.js - 宗门内部生态（v7.3 全门派扩展） ====================
// 弟子群体、竞争合作、门派会议、决策影响
// 依赖：sects-system.js

// ============ 全门派内部数据 ============
var SECT_INTERNAL = {};

// 自动生成所有门派的内部数据
function initAllSectInternal() {
    var sects = window.sectsData || {};
    for (var name in sects) {
        if (!SECT_INTERNAL[name]) {
            var sect = sects[name];
            var powerMap = { '巨擘': 1.5, '大派': 1.3, '中等偏上': 1.15, '中等': 1.0, '小': 0.7, '极小': 0.5, '未知': 0.8 };
            var mul = powerMap[sect.power] || 1.0;
            SECT_INTERNAL[name] = {
                disciples: Math.floor(15 + Math.random() * 20 * mul), // 弟子数受实力影响
                morale: 50 + Math.floor(Math.random() * 30),
                meetings: [],
                decisions: [],
                influence: Math.floor(50 * mul),   // 门派影响力
                resources: Math.floor(100 * mul),   // 门派资源储备
                founded: Math.floor(100 + Math.random() * 900) + '年' // 立派时间
            };
        }
    }
}

// sects-system.js/sectsData 在本文件之前加载，直接初始化，避免时间竞态。
if (typeof window !== 'undefined') initAllSectInternal();

// ============ v18.8 宗门资源日结 ============
// v27.13：快照升级为「宗门月账」收入端的总口径——产业+弟子孝敬+香火供奉三源齐入，
// net=三源之和−维护（用度）。此前库房只有产业 gross 一路进项，孝敬与香火没有回灌通道，
// resources 只出不进（发俸/议案/治理各处花销远超产业），迟早见底成"永远缺钱的门派"。
// 日结 processAllSectDailyEconomy 按 net 回灌 resources，三源与维护同账同拍。
// v27.13 续批（过堂⑥新增·宗门产业经营）：产业源不再是死的静态基值——药园/矿洞/坊市摊位等产业格
// 指派弟子打理后，产出按人数加成（tend）并进 gross 同账入公库；口径见 SECT_TEND_TUNE，指派名册见 setSectResourceTend。
// v27.13 续批收口（本轮）：①坊市摊位补位——灵石流产业此前只有 5 派各一条 trade 类，injectMarketStalls 给其余
// 各派补一格「坊市摊位」恒产；②打理佣金——打理增量抽两成半发「私账已在册」的弟子，余下随产业源入公库；
// ③月账三源→四源——账本加 sources（产业/坊市/孝敬/香火）小计，月报在宗门管理面板与月例消息条上念数。
// v27.13：产业打理调参——per=每人产出加成比例（+15% 基值）；perCap=单格指派上限（3 人，≈+45%）；
// mulCap=单格加成硬顶（占基值 50%，人数公式再多也夹在这）；poolDiv=可指派总人数=弟子数/poolDiv
// （打理是兼职，不许把人全派去种田——也和 upkeep 按全弟子数计的口粮账不冲突）。
// v27.13 续批（过堂⑥·宗门产业经营）：commission=佣金分成——打理增量抽两成半作零头，发给「私账已在册」的
// 具名弟子；账不在册（普通弟子本就不在 purse 体系）那一分原地留公库，绝不凭空造弟子账。floor 取整，零头化。
var SECT_TEND_TUNE = { per: 0.15, perCap: 3, mulCap: 0.5, poolDiv: 3, commission: 0.25 };

// ============ v27.13 续批（过堂⑥·宗门产业经营）：坊市摊位补位 ============
// 盘点（sects-deep-data 全 36 派）：药园类（type herb）6 处、矿洞类（type mine）1 处、
// 字面意义的「坊市摊位」0 处——灵石流产业只有 5 派各一条 trade 类（商路/镖营/索债/抽成/路引，output 7~9）。
// 恒产不该是这 5 派的专利：这里给其余 31 派在山门前补一格「坊市摊位」（type market——resource-actions
// 无此类型 → 不接玩家动作钮，摊位收租是门派的账不是玩家的差事）。
// 定档理由（盘点既有量级再定）：既有 trade 类 7~9 是门派亲自下场的营生；摊位只是把长街租出去抽成，
// 压一档取 base+influence/25（夹 1~5，实落 3~5：巨擘 5／大派 4／中等 4／小 3／极小 3）——
// 对基产最低的几派（5~8/日）占比虽大，绝对量仍是零头，且打理加成另受 perCap/mulCap/总池三重夹逼。
// 已有 trade 类的门派不补——恒产不叠罗汉，防同派灵石流双份。
// 注入是运行时加键：SECT_DEEP_DATA 是静态数据不进存档，读档/新档均生效、无需迁移；幂等可重入（hasStall 判重）。
var SECT_STALL_TUNE = { base: 2, inflDiv: 25, cap: 5 };
(function injectMarketStalls() {
    try {
        var deeps = window.SECT_DEEP_DATA;
        if (!deeps) return; // 深度数据缺席（异常加载序）：一行不炸，产业格维持原样
        for (var name in deeps) {
            var deep = deeps[name];
            if (!deep || !Array.isArray(deep.specialResources)) continue; // 无产业列的门派：连建筑卡都没有，跳过
            var hasTrade = false, hasStall = false;
            for (var i = 0; i < deep.specialResources.length; i++) {
                var r = deep.specialResources[i];
                if (!r) continue;
                if (r.type === 'trade') hasTrade = true;
                if (r._stall) hasStall = true;
            }
            if (hasStall || hasTrade) continue;
            var it = SECT_INTERNAL[name]; // 本文件先前已 initAllSectInternal，influence 现成
            var infl = (it && Number(it.influence)) || 50;
            var output = Math.max(1, Math.min(SECT_STALL_TUNE.cap, SECT_STALL_TUNE.base + Math.floor(infl / SECT_STALL_TUNE.inflDiv)));
            deep.specialResources.push({
                id: 'stall_fangshi_' + name,
                name: '坊市摊位',
                type: 'market',
                icon: '🏪',
                output: output,
                _stall: true, // 月账拆「坊市」一源用的暗记（getSectEconomySnapshot 按它分流）
                desc: '山门前长街租给行商的摊位，日日有点抽成进账，派个弟子照看流水更顺。'
            });
        }
    } catch (e) {
        console.warn('[静默失败] js/sects/sect-internal.js · injectMarketStalls：坊市摊位补位没成，产业格维持原样', e && e.message);
    }
})();

// ============ v27.13 续批（过堂⑥·宗门产业经营）：打理佣金（规划/发放两段） ============
// 规划器（只读）——各格打理增量按 SECT_TEND_TUNE.commission 抽零头，轮着发给名册上「私账已在册」的具名弟子
// （NPCLife purse；只认 NPC_LIFE_STORE 里的旧账，绝不调 ensure 开新账——不凭空造弟子账）。
// 账不在册/私账顶满 → 那一份留公库（体现在快照 gross 里，不另立支出线）。快照会被面板反复调，
// 必须纯读无副作用；真正入私账只在日结那一拍（paySectTendCommission），规划与发放同拍先后脚，不漂账。
function planSectTendCommission(sectName, special, assign) {
    var plan = { landed: 0, landedIndustry: 0, landedMarket: 0, items: [] };
    try {
        var NPCLife = window.NPCLife;
        var store = (NPCLife && typeof NPCLife._store === 'function') ? NPCLife._store() : null;
        if (!store || typeof window.getSectNPCs !== 'function') return plan; // 私账体系/名册缺席：无账可记，全额留公库
        var roster = (window.getSectNPCs(sectName) || []).filter(function(n) {
            return n && n.id && String(n.id).indexOf('sect_disciple_') === 0 && !n.isDead && !n.isMissing && !n._isGone;
        });
        if (!roster.length) return plan;
        var payers = [];
        roster.forEach(function(n) {
            var st = store[n.id];
            var led = st && st.ledger; // 只认在册旧账
            if (led && (Number(led.cap) || 0) > (Number(led.purse) || 0)) payers.push({ id: n.id, led: led });
        });
        if (!payers.length) return plan;
        var items = {}; // 按人归并：plan.items 每人一条
        var cursor = 0; // 轮转取人：格与格、枚与枚接着往后发，不总是头几个
        special.forEach(function(r) {
            if (!r) return;
            var _o = Math.max(0, Number(r.output) || 0);
            if (_o <= 0) return; // 产出为 0 的格无从抽佣（与 tend 同一口径：白派人的格不进账）
            var _n = Math.max(0, Math.min(SECT_TEND_TUNE.perCap, Math.floor(Number(assign[r.id]) || 0)));
            if (_n <= 0) return;
            var cellTend = Math.min(Math.round(_o * SECT_TEND_TUNE.mulCap), Math.round(_o * SECT_TEND_TUNE.per * _n));
            var budget = Math.floor(cellTend * SECT_TEND_TUNE.commission);
            while (budget > 0 && payers.length) { // 一枚一枚发：每轮要么发出一枚、要么清掉一个顶满的口袋，必有终局
                var idx = cursor % payers.length;
                cursor++;
                var p = payers[idx];
                var headroom = Math.max(0, (Number(p.led.cap) || 0) - (Number(p.led.purse) || 0));
                if (headroom <= 0) { payers.splice(idx, 1); continue; }
                items[p.id] = (Number(items[p.id]) || 0) + 1;
                plan.landed += 1;
                if (r._stall) plan.landedMarket += 1; else plan.landedIndustry += 1;
                budget -= 1;
            }
        });
        for (var pid in items) plan.items.push({ id: pid, amt: items[pid] });
    } catch (e) {
        console.warn('[静默失败] js/sects/sect-internal.js · planSectTendCommission：佣金规划没成，本期零头全留公库', e && e.message);
        return { landed: 0, landedIndustry: 0, landedMarket: 0, items: [] };
    }
    return plan;
}

// v27.13 续批：佣金真发——日结那一拍照规划落账（只写已有账本；规划时已按 cap 夹好，这里照单付）。
// 发放与快照同拍（日结内先后脚）：gross 里扣掉的零头 = 这里真进私账的零头，公库与私账两边对得上。
function paySectTendCommission(plan) {
    if (!plan || !Array.isArray(plan.items) || !plan.items.length) return 0;
    var paid = 0;
    try {
        var NPCLife = window.NPCLife;
        var store = (NPCLife && typeof NPCLife._store === 'function') ? NPCLife._store() : null;
        if (!store) return 0;
        plan.items.forEach(function(it) {
            var led = store[it.id] && store[it.id].ledger;
            if (!led) return; // 规划到发放之间账被销（极小概率）：宁可少发不虚记
            led.purse = Math.min((Number(led.purse) || 0) + (Number(it.amt) || 0), Math.max(Number(led.cap) || 0, Number(led.purse) || 0));
            paid += Number(it.amt) || 0;
        });
    } catch (e) {
        console.warn('[静默失败] js/sects/sect-internal.js · paySectTendCommission：佣金发放没成，弟子私账维持原样', e && e.message);
        return 0;
    }
    return paid;
}

function getSectEconomySnapshot(sectName) {
    var internal = SECT_INTERNAL[sectName];
    if (!internal) return null;
    var deep = window.SECT_DEEP_DATA && window.SECT_DEEP_DATA[sectName];
    var special = deep && Array.isArray(deep.specialResources) ? deep.specialResources : [];
    // v27.13 续批（过堂⑥·宗门产业经营）：产业格分两路——药园/矿洞/丹房等照旧算「产业」，坊市摊位
    // （injectMarketStalls 注入的 _stall 格）单独算「坊市」，月报四源（产业/坊市/孝敬/香火）由此拆名。
    // 两路同一套指派/打理账（同一把尺），钱仍走 resources 单一真源，月报上只是分名字念。
    var _assign = (internal.assign && typeof internal.assign === 'object') ? internal.assign : {};
    var baseIndustry = 0, baseMarket = 0, tendIndustry = 0, tendMarket = 0;
    special.forEach(function(r) {
        if (!r) return;
        var _o = Math.max(0, Number(r.output) || 0);
        var _n = Math.max(0, Math.min(SECT_TEND_TUNE.perCap, Math.floor(Number(_assign[r.id]) || 0)));
        var _t = (_o > 0 && _n > 0) ? Math.min(Math.round(_o * SECT_TEND_TUNE.mulCap), Math.round(_o * SECT_TEND_TUNE.per * _n)) : 0;
        if (r._stall) { baseMarket += _o; tendMarket += _t; }
        else { baseIndustry += _o; tendIndustry += _t; }
    });
    var tend = tendIndustry + tendMarket;
    // v27.13 续批：佣金零头——打理增量抽两成半，发给名册上「私账已在册」的具名弟子；账不在册 → 留公库。
    var _plan = planSectTendCommission(sectName, special, _assign);
    var commission = _plan.landed;
    var industry = baseIndustry + tendIndustry - _plan.landedIndustry;
    var market = baseMarket + tendMarket - _plan.landedMarket;
    var gross = industry + market;
    // 没有专属资源配置的门派仍有香火、杂役与基础产业，但产能明显更低。
    // （坊市摊位注入后，凡有 deep 数据的派 gross 恒 >0；这兜底只剩「连 deep 数据都没有」的派会走到。）
    if (gross <= 0) {
        gross = Math.max(5, Math.floor((Number(internal.influence) || 50) / 10));
        industry = gross; market = 0;
    }
    var upkeep = Math.max(1, Math.ceil((Number(internal.disciples) || 1) / 4));
    // v27.13 孝敬：弟子在外各有营生（市井做工、护镖、炼丹卖药——营生账在世界侧），按门规抽一分孝敬回山。
    // 弟子私账本模块读不到，取保守常数 0.2 枚/人/日、随士气 0.5~1.5 倍浮动——士气高的门派弟子挣得多也肯交，士气崩了孝敬先断。
    // 夹逼：0.2/人 永远压在口粮 0.25/人（upkeep=弟子/4）之下——收徒是养人不是印钱，人数与士气天然封顶。
    var _disc = Math.max(0, Number(internal.disciples) || 0);
    var _m = Number(internal.morale); if (!(_m >= 0)) _m = 50; // 士气 0 是真崩了要认（不能用 ||50 把 0 吞了）
    var _morale = Math.min(100, _m);
    var filial = _disc > 0 ? Math.round(_disc * 0.2 * (0.5 + _morale / 100)) : 0;
    // v27.13 孝敬对齐：断粮的门派弟子交得心不甘——孝敬减半（与俸禄减半同源，读 SectGov 真账）
    try {
        if (filial > 0 && window.SectGov && typeof window.SectGov.famine === 'function' && window.SectGov.famine(sectName)) filial = Math.ceil(filial / 2);
    } catch (eFam) { console.warn('[静默失败] js/sects/sect-internal.js · getSectEconomySnapshot：断粮查问没接住，孝敬按全额计', eFam && eFam.message); }
    // v27.13 香火：命门档案（sect-profiles）里写着靠香火/道场/法事吃饭的门派，山下庙宇随喜是常项进项；
    // 其余门派不产香火——他们的营生名目已折在产业 gross 的兜底里，不重复发钱。
    // 数值走影响力/25、夹在 2~8：香客多少随名声走，封顶防巨擘派靠香火无限吸血。
    // （属城护持的月供奉是另一路，sect-cities taxMonthly 已直接入库，此处不重复计。）
    var incense = 0;
    try {
        var _prof = (typeof window.getSectProfile === 'function') ? window.getSectProfile(sectName) : null;
        var _liv = (_prof && Array.isArray(_prof.livelihood)) ? _prof.livelihood.join('|') : '';
        if (/香火|道场|法事/.test(_liv)) {
            incense = Math.max(2, Math.min(8, Math.round((Number(internal.influence) || 40) / 25)));
        }
    } catch (ePro) { console.warn('[静默失败] js/sects/sect-internal.js · getSectEconomySnapshot：命门档案没读到，香火按无计', ePro && ePro.message); }
    return {
        stock: Math.max(0, Math.floor(Number(internal.resources) || 0)),
        gross: gross,
        industry: industry,      // v27.13 续批：月账收入一源·产业（打理增量已扣佣金零头）
        market: market,          // v27.13 续批：月账收入二源·坊市（摊位基产＋打理增量−佣金零头）
        tend: tend - commission, // 打理增量入公库的那份（面板脚注「已并进产业」的诚实口径）；零头另见 commission
        commission: commission,  // 已拨弟子私账的佣金零头（无私账可记时为 0——那一分照旧在 gross 里）
        filial: filial,      // v27.13：月账收入三源（弟子孝敬）
        incense: incense,    // v27.13：月账收入四源（香火供奉）
        upkeep: upkeep,
        net: gross + filial + incense - upkeep,
        _commissionPlan: _plan, // v27.13 续批：日结发放用——快照只规划不动账，面板反复刷新不会重复发钱
        disciples: Number(internal.disciples) || 0,
        morale: Number(internal.morale) || 0
    };
}

// v27.13：月账账本口径——{month, income, out} 三字账；跨月自动把旧账封存进 lastMonthBook（月末结余=income−out）。
// 账本挂在 SECT_INTERNAL 各派对象上随既有 StateRegistry 整体存取；旧档没有这些字段时读端一律 Number(x)||0、
// 首笔落账时按新账开，不必迁移。
// v27.13 续批（过堂⑥·宗门产业经营）：账本加 sources 键（四源小计：产业/坊市/孝敬/香火）——加键不升版，
// 旧档缺 sources 就地补零、从补上的那天起照四源记（不回填历史）；封存的 lastMonthBook 带不上 sources 就记 null，
// 月报读端按「只有合计」念。收入总管仍只有 income 一根（industry+market=gross），四源只是拆名不拆账。
function ensureMonthBook(it, day) {
    // 月号用 ceil 对齐全世界的月末口径（sect-cities 月税等都认 day%30==0）：1~30 日为第 1 月，30 日当晚封账。
    var mi = Math.ceil((Number(day) || 0) / 30);
    var book = it.monthBook;
    if (!book || Number(book.month) !== mi) {
        if (book && typeof book.month === 'number') {
            var _s = (book.sources && typeof book.sources === 'object') ? book.sources : null;
            it.lastMonthBook = {
                month: Number(book.month) || 0,
                income: Number(book.income) || 0,
                out: Number(book.out) || 0,
                balance: (Number(book.income) || 0) - (Number(book.out) || 0),
                sources: _s ? {
                    industry: Number(_s.industry) || 0,
                    market: Number(_s.market) || 0,
                    filial: Number(_s.filial) || 0,
                    incense: Number(_s.incense) || 0
                } : null // 旧账缺 sources：封存时不伪造四源，月报按「只有合计」念
            };
        }
        book = it.monthBook = { month: mi, income: 0, out: 0, sources: { industry: 0, market: 0, filial: 0, incense: 0 } };
    }
    // 旧档缺 sources（加键不升版）→ 就地补零，从此照四源记
    if (!book.sources || typeof book.sources !== 'object') book.sources = { industry: 0, market: 0, filial: 0, incense: 0 };
    return book;
}

function processAllSectDailyEconomy(day) {
    day = Number(day) || ((window.timeSystem && window.timeSystem.gameTime && window.timeSystem.gameTime.currentDay) || 1);
    var results = {};
    Object.keys(SECT_INTERNAL).forEach(function(sectName) {
        var internal = SECT_INTERNAL[sectName];
        if (!internal || internal.lastEconomyDay === day) return;
        try { if (window.PSBoot && window.PSBoot.isPlayerSect && window.PSBoot.isPlayerSect(sectName)) return; } catch (e) {} // 第九波：玩家自建宗门的户部镜像由白手起家月结专管——日结不再凭空代发"香火产业"
        var snap = getSectEconomySnapshot(sectName);
        if (!snap) return;
        internal.resources = Math.max(0, snap.stock + snap.net);
        if (snap.net < 0) internal.morale = Math.max(0, (Number(internal.morale) || 50) - 2);
        else if (internal.resources >= 500 && snap.net >= 10) internal.morale = Math.min(100, (Number(internal.morale) || 50) + 1);
        internal.lastEconomyDay = day;
        // v27.13：月账落笔——收入三源（产业+孝敬+香火）与维护（用度）同在日结这一拍入账，日清月结；
        // 外部支出（月例/赏格）经 noteSectExpense 在各自扣库处补记，月末结余=income−out。
        var _book = ensureMonthBook(internal, day);
        _book.income = (Number(_book.income) || 0) + snap.gross + snap.filial + snap.incense;
        _book.out = (Number(_book.out) || 0) + snap.upkeep;
        // v27.13 续批（过堂⑥·宗门产业经营）：月账四源小计——产业/坊市/孝敬/香火各自累计，月报（宗门管理面板）按这里念数；
        // 收入总管仍只有 income 一根（industry+market=gross），四源只是拆名不拆账。
        var _src = _book.sources;
        _src.industry = (Number(_src.industry) || 0) + (Number(snap.industry) || 0);
        _src.market = (Number(_src.market) || 0) + (Number(snap.market) || 0);
        _src.filial = (Number(_src.filial) || 0) + (Number(snap.filial) || 0);
        _src.incense = (Number(_src.incense) || 0) + (Number(snap.incense) || 0);
        // v27.13 续批：打理佣金此刻真落弟子私账（快照只规划不动账；账不在册的份额已在 gross 里留在公库）
        try { paySectTendCommission(snap._commissionPlan); } catch (ePay) { console.warn('[静默失败] js/sects/sect-internal.js · processAllSectDailyEconomy：佣金发放没接住，弟子私账少一笔零头', ePay && ePay.message); }
        // v19.2 收尾：清理过期 policyBuffs
        if (Array.isArray(internal.policyBuffs)) {
            internal.policyBuffs = internal.policyBuffs.filter(function (b) {
                if (!b || typeof b.appliedAtDay !== 'number' || typeof b.durationDays !== 'number') return true;
                return (day - b.appliedAtDay) < b.durationDays;
            });
        }
        results[sectName] = { gross: snap.gross, industry: snap.industry, market: snap.market, commission: snap.commission, filial: snap.filial, incense: snap.incense, upkeep: snap.upkeep, net: snap.net, stock: internal.resources };
    });
    // v19.0 P0-3 批次 C2：年度宗门目标日结推进 + 跨年检测
    if (window.SectYearGoal && typeof window.SectYearGoal.tickDay === 'function') {
        Object.keys(SECT_INTERNAL).forEach(function (sectName) {
            try { window.SectYearGoal.tickDay(sectName, day); } catch (e) { /* 不阻塞经济日结 */ }
        });
    }
    // v19.0 P0-3 批次 D4：每周（day%7==0）自动开 1 个普通投票
    if (window.tryAutoOpenWeeklyVote && day % 7 === 0) {
        Object.keys(SECT_INTERNAL).forEach(function (sectName) {
            try { window.tryAutoOpenWeeklyVote(sectName, day); } catch (e) { /* 不阻塞经济日结 */ }
        });
    }
    // v19.1 P0-4：每季小比 / 每年大比周期调度
    // 批五：改为每日过一遍——开比节令仍由 tickDay 内部 day%90/%360 管，
    // 但「截止即开打」必须天天检查（旧版每90日才跑一次，7日报名期的赛事要拖83天才结算）。
    if (window.Tournament && typeof window.Tournament.tickDay === 'function') {
        Object.keys(SECT_INTERNAL).forEach(function (sectName) {
            try { window.Tournament.tickDay(sectName, day); } catch (e) { /* 不阻塞 */ }
        });
    }
    // v19.2 P0-5：每日 NPC 自主人生（5~20 NPC 抽样行动）
    if (window.NPCLife && typeof window.NPCLife.tickDay === 'function') {
        try { window.NPCLife.tickDay(day); } catch (e) { /* 不阻塞经济日结 */ }
    }
    // v19.3 P0-6：NPC 婚姻/后代/衣钵（道侣按年概率 haveChild）
    if (window.NpcLineage && typeof window.NpcLineage.tickDay === 'function') {
        try { window.NpcLineage.tickDay(day); } catch (e) { /* 不阻塞 */ }
    }
    return results;
}

// v27.13：外部支出入月账的唯一口——发俸（sects-system collectSectResources）、赏格（sect-governance 大比加码）
// 在各自扣库处补记一笔，月账的支出侧（月例+维护+赏格）才与收入侧对得上。
// 只入账不动库：扣库仍由各处自己的 SectGov.deductStore 做（resources 单一真源不动），这里纯记账。
function noteSectExpense(sectName, stones) {
    try {
        var it = SECT_INTERNAL[sectName];
        if (!it) return false;
        stones = Math.max(0, Math.floor(Number(stones) || 0));
        if (!stones) return false;
        var day = (window.timeSystem && window.timeSystem.gameTime && window.timeSystem.gameTime.currentDay) || 1;
        var book = ensureMonthBook(it, day); // 与日结同一套月切口径，跨月先封旧账
        book.out = (Number(book.out) || 0) + stones;
        return true;
    } catch (e) { console.warn('[静默失败] js/sects/sect-internal.js · noteSectExpense：月账支出入册没接住，本月支出侧会少记', e && e.message); return false; }
}

// ============ v27.13 续批（过堂⑥新增·宗门产业经营）：弟子指派名册（模型侧） ============
// 产业格（SECT_DEEP_DATA.specialResources：药园/矿洞/坊市摊位等）可指派弟子打理：
//   名册记 internal.assign[resourceId]（人数），随 SECT_INTERNAL 既有 StateRegistry 整体出档入档，
//   旧档缺字段按「无指派」办（getSectEconomySnapshot 端已兜底），不必迁移。
//   产出加成只算一份账：并入产业 gross 随月账入公库（见 getSectEconomySnapshot），这里只管名册不动钱。
//   约束不是配额是世界：单格至多 perCap 人（扎堆无用）、全派至多 floor(弟子/poolDiv) 人（修行是本行）。
function setSectResourceTend(sectName, resourceId, delta) {
    try {
        var it = SECT_INTERNAL[sectName];
        var deep = window.SECT_DEEP_DATA && window.SECT_DEEP_DATA[sectName];
        var res = null;
        var valid = {};
        if (deep && Array.isArray(deep.specialResources)) {
            deep.specialResources.forEach(function(r) { if (r && r.id) valid[r.id] = true; });
            for (var i = 0; i < deep.specialResources.length; i++) {
                if (deep.specialResources[i] && deep.specialResources[i].id === resourceId) { res = deep.specialResources[i]; break; }
            }
        }
        if (!it || !res) return { ok: false, reason: '查不到这处产业，指派无从谈起。' };
        var assign = it.assign = (it.assign && typeof it.assign === 'object') ? it.assign : {};
        var pool = Math.max(0, Math.floor((Number(it.disciples) || 0) / SECT_TEND_TUNE.poolDiv));
        var used = 0;
        for (var k in assign) if (valid[k]) used += Math.max(0, Math.min(SECT_TEND_TUNE.perCap, Math.floor(Number(assign[k]) || 0)));
        var cur = Math.max(0, Math.min(SECT_TEND_TUNE.perCap, Math.floor(Number(assign[resourceId]) || 0)));
        var next = cur + (Number(delta) >= 0 ? 1 : -1);
        if (next === cur) return { ok: false, reason: '名册没有变动。' };
        if (next < 0) return { ok: false, reason: '【' + (res.name || resourceId) + '】本就没有弟子在打理。' };
        if (next > SECT_TEND_TUNE.perCap) return { ok: false, reason: '【' + (res.name || resourceId) + '】至多派' + SECT_TEND_TUNE.perCap + '名弟子，人再多也是扎堆。' };
        if (next > cur && used >= pool) return { ok: false, reason: '抽不出更多弟子了——门中可派去打理产业的至多' + pool + '人，其余要留着修行与值戒。' };
        assign[resourceId] = next;
        return { ok: true, count: next, name: res.name || resourceId };
    } catch (e) {
        console.warn('[静默失败] js/sects/sect-internal.js · setSectResourceTend：指派名册没记上', e && e.message);
        return { ok: false, reason: null };
    }
}

// v27.13 续批：给 UI 一次取全——各产业格当前指派数与对应日产加成（bonusOf[id] 与月账产业源同一把尺算出）。
// v27.13 续批收口：bonusOf 是每格打理增量的「未抽佣」全值（建筑卡上念的是活儿干出来的量）；
// 月账侧扣掉的两成半佣金零头另见快照 commission 字段，两处口径差即佣金，账能对上。
// 营生/产业数据缺席全兜底：无档案/无产业格 → 空名册、pool 0，UI 按只读零值显示，一行不炸。
function getSectTendInfo(sectName) {
    try {
        var it = SECT_INTERNAL[sectName];
        if (!it) return null;
        var deep = window.SECT_DEEP_DATA && window.SECT_DEEP_DATA[sectName];
        var special = deep && Array.isArray(deep.specialResources) ? deep.specialResources : [];
        var assign = (it.assign && typeof it.assign === 'object') ? it.assign : {};
        var pool = Math.max(0, Math.floor((Number(it.disciples) || 0) / SECT_TEND_TUNE.poolDiv));
        var used = 0;
        var bonusOf = {};
        special.forEach(function(r) {
            var _o = Math.max(0, Number(r.output) || 0);
            var _n = Math.max(0, Math.min(SECT_TEND_TUNE.perCap, Math.floor(Number(assign[r.id]) || 0)));
            used += _n;
            bonusOf[r.id] = (_o > 0 && _n > 0) ? Math.min(Math.round(_o * SECT_TEND_TUNE.mulCap), Math.round(_o * SECT_TEND_TUNE.per * _n)) : 0;
        });
        return { assign: assign, pool: pool, used: used, bonusOf: bonusOf };
    } catch (e) {
        console.warn('[静默失败] js/sects/sect-internal.js · getSectTendInfo：产业指派信息没读到', e && e.message);
        return null;
    }
}

// 宗门内部状态此前只活在内存里，事件造成的资源/士气变化读档即丢。
// v18.8 起纳入 StateRegistry，旧档没有该段时按原规则初始化即可，无需迁移。
if (typeof window !== 'undefined' && window.StateRegistry && typeof window.StateRegistry.register === 'function') {
    window.StateRegistry.register('sectInternal', {
        version: 1,
        export: function() { return SECT_INTERNAL; },
        import: function(data) {
            Object.keys(SECT_INTERNAL).forEach(function(k) { delete SECT_INTERNAL[k]; });
            if (data && typeof data === 'object') {
                Object.keys(data).forEach(function(k) { SECT_INTERNAL[k] = data[k]; });
            }
            initAllSectInternal();
        },
        reset: function() {
            Object.keys(SECT_INTERNAL).forEach(function(k) { delete SECT_INTERNAL[k]; });
            initAllSectInternal();
        }
    });
}

// ============ 生成门派弟子（v8.6 使用随机命名系统） ============
function generateSectDisciples(sectName) {
    var data = SECT_INTERNAL[sectName];
    if (!data) return [];
    var count = 3 + Math.floor(Math.random() * 5);
    var disciples = [];
    var positions = ['外门弟子', '内门弟子', '亲传弟子', '长老', '掌门'];
    var realms = ['炼气', '筑基', '金丹', '元婴'];
    var usedNames = [];
    
    // 使用名字生成器（回退到编号）
    function getRandomName() {
        if (typeof window.nameGenerator?.generateName === 'function') {
            for (var attempt = 0; attempt < 20; attempt++) {
                var nameObj = window.nameGenerator.generateName();
                var fullName = nameObj.full || nameObj;
                // 避免同名
                if (usedNames.indexOf(fullName) < 0) {
                    usedNames.push(fullName);
                    return fullName;
                }
            }
        }
        return '弟子' + (disciples.length + 1);
    }
    
    for (var i = 0; i < count; i++) {
        var realmIdx = Math.min(i < 2 ? 0 : (i < 4 ? 1 : (i < 6 ? 2 : 3)), realms.length - 1);
        disciples.push({
            id: 'disciple_' + sectName + '_' + i,
            name: getRandomName(),
            realm: realms[realmIdx],
            layer: 1 + Math.floor(Math.random() * 7),
            position: positions[Math.min(i, positions.length - 1)],
            morale: 50 + Math.floor(Math.random() * 30)
        });
    }
    return disciples;
}

// ============ 获取门派描述摘要 ============
function getSectSummary(sectName) {
    var data = SECT_INTERNAL[sectName];
    var sect = window.sectsData?.[sectName];
    if (!data || !sect) return '暂无数据';
    
    return '立派' + data.founded + '，弟子' + data.disciples + '人，' +
        '士气' + (data.morale >= 70 ? '高昂' : data.morale >= 50 ? '平稳' : '低落') +
        '，影响力' + data.influence;
}

// ============ 召开门派会议 ============
function holdSectMeeting(sectName) {
    var data = SECT_INTERNAL[sectName];
    if (!data) return false;
    // v20.8：开会不再免费——你张罗这场会要出20贡献（茶水、封场、执事应酬都是公中出的）。
    // 议事频率的约束是世界性的：一桩事务一天只够议一次（机构节奏，非玩家次数配额）。
    var ds = window.discipleState || {};
    var contrib = Number(ds.contribution) || 0;
    if (contrib < 20) {
        if (typeof window.showMessage === 'function') window.showMessage('张罗一场门派议事要应承20贡献的开销，你的贡献还不够。', 'warning');
        return false;
    }
    var today = (window.timeSystem && window.timeSystem.gameTime && window.timeSystem.gameTime.currentDay) || 1;
    if (data._lastMeetingDay === today) {
        if (typeof window.showMessage === 'function') window.showMessage('今日该议的事已经议过了——执事们抱着茶碗摆手：明日请早。', 'info');
        return false;
    }
    if (ds.contribution != null) ds.contribution = contrib - 20;
    data._lastMeetingDay = today;
    if (typeof window.showMessage === 'function') {
        window.showMessage('🏛️ 你出贡献20张罗了' + sectName + '的门派议事，众人齐心，士气+5。', 'info');
    }
    data.morale = Math.min(100, data.morale + 5);
    data.meetings.push({ time: Date.now(), topic: '宗门事务' });
    if (data.meetings.length > 20) data.meetings.shift();
    return true;
}

// ============ 获取门派弟子士气 ============
function getSectMorale(sectName) {
    var data = SECT_INTERNAL[sectName];
    return data ? data.morale : 50;
}

// ============ 门派专属NPC注册（P2） ============
// 为每个门派生成掌门/长老/弟子NPC，可对话、互动

var SECT_NPC_TEMPLATES = {
    '正道': { leaderTitle: '掌门', elderTitle: '长老', leaderTraits: ['威严', '慈祥', '睿智'], elderTraits: ['严肃', '温和', '博学'] },
    '邪派': { leaderTitle: '教主', elderTitle: '护法', leaderTraits: ['阴鸷', '狂傲', '深沉'], elderTraits: ['冷酷', '狡诈', '残忍'] },
    '中立': { leaderTitle: '谷主', elderTitle: '执事', leaderTraits: ['随和', '神秘', '精明'], elderTraits: ['中立', '务实', '圆滑'] }
};

var SECT_LEADER_NAMES = {
    '少林寺':'释玄慈','武当派':'张三丰','全真教':'王重阳','华山派':'岳不群',
    '嵩山派':'左冷禅','恒山派':'定逸师太','衡山派':'莫大先生','泰山派':'天门道人',
    '峨眉派':'灭绝师太','丐帮':'洪七公','大旗门':'铁中棠','侠隐阁':'燕南天',
    '药王谷':'药老人','天山派':'天山童姥','铸剑山庄':'欧冶子','茅山派':'林九叔',
    '大隐阁':'观虚子','天书阁':'归藏子','天涯海阁':'花无缺','神机门':'鲁妙子',
    '霹雳堂':'雷震天','昆仑派':'何足道','金刚宗':'鸠摩智','青城派':'余沧海',
    '蓬莱派':'白眉真人','五仙教':'蓝凤凰','逍遥派':'无崖子','唐门':'唐老太太',
    '百花谷':'温蘅','铁掌帮':'裘千仞','修罗宫':'修罗女','阎罗殿':'阎罗王',
    '血手门':'血手人屠','飞蝎坞':'蝎母','烈日教':'烈日法王','天龙教':'天龙王'
};

var SECT_ELDER_SURNAMES = ['赵','钱','孙','李','周','吴','郑','王','冯','陈','褚','卫','蒋','沈','韩','杨','朱','秦','尤','许'];

function registerSectNPCs(sectName) {
    if (typeof window.NPC !== 'function' || typeof window.npcManager?.addNPC !== 'function') return;
    var sect = window.sectsData?.[sectName];
    if (!sect) return;
    var templates = SECT_NPC_TEMPLATES[sect.type] || SECT_NPC_TEMPLATES['中立'];
    var leaderName = SECT_LEADER_NAMES[sectName] || (sectName + '掌门');
    var leaderTitle = templates.leaderTitle;
    var elderTitle = templates.elderTitle;
    var leaderId = 'sect_leader_' + sectName;
    if (window.npcManager.getNPC(leaderId)) return;

    // === P0-4: 优先读取 SPECIAL_NPC_DEFINITIONS 中的固定定义 ===
    var fixedDef = window.SPECIAL_NPC_DEFINITIONS && window.SPECIAL_NPC_DEFINITIONS[leaderId];
    if (fixedDef) {
        var leaderNPC = new window.NPC(leaderId, fixedDef.name, {
            gender: fixedDef.gender || 'male',
            age: fixedDef.age || 40,
            occupation: fixedDef.occupation || leaderTitle,
            location: fixedDef.location || sectName,
            icon: fixedDef.icon || '👤',
            appearance: fixedDef.appearance || {},
            background: fixedDef.background || { origin: sectName, family: '门派传承', history: leaderName + '是' + sectName + '的现任' + leaderTitle, goal: '统领门派', secret: '…' },
            personalityBig5: fixedDef.personalityBig5 || { openness: 60, conscientiousness: 70, extraversion: 50, agreeableness: 40, neuroticism: 30 },
            combat: fixedDef.combat || { level: 50, realm: '金丹', layer: 5, attack: 60, defense: 60, speed: 50, skills: ['内功', '剑法'] },
            state: fixedDef.state || { mood: 50, stress: 30 }
        });
        leaderNPC.relationship.affection = (fixedDef.relationship && fixedDef.relationship.affection != null) ? fixedDef.relationship.affection : 20;
        leaderNPC.relationship.trust = (fixedDef.relationship && fixedDef.relationship.trust != null) ? fixedDef.relationship.trust : 15;
        leaderNPC.relationship.respect = (fixedDef.relationship && fixedDef.relationship.respect != null) ? fixedDef.relationship.respect : 0;
        leaderNPC.relationship.favor = (fixedDef.relationship && fixedDef.relationship.favor != null) ? fixedDef.relationship.favor : 0;
        leaderNPC._isFixedDefinition = true;
        // v20.88 固定人设顶层 skills 此前被整个丢弃——现在并入门派功法持有网（请教功法才教得出真东西）
        if (Array.isArray(fixedDef.skills) && fixedDef.skills.length) {
            leaderNPC.combat.skills = (leaderNPC.combat.skills || []).concat(fixedDef.skills);
        }
        window.npcManager.addNPC(leaderNPC);
        console.log('[固定NPC] 已注册固定定义:', leaderId, fixedDef.name);
    } else {
        // 旧随机生成逻辑（非核心NPC）
        var leaderRealm = '金丹';
        if (sect.power === '巨擘') leaderRealm = '元婴';
        else if (sect.power === '大派') leaderRealm = '金丹';
        
        var leaderNPC = new window.NPC(leaderId, leaderName, {
            gender: Math.random() > 0.5 ? 'male' : 'female',
            age: 40 + Math.floor(Math.random() * 40),
            occupation: leaderTitle,
            location: sectName,
            combat: { level: 50 + Math.floor(Math.random() * 30), realm: leaderRealm, layer: 3 + Math.floor(Math.random() * 5), attack: 60, defense: 60, speed: 50, skills: ['内功', '剑法', '拳掌'] },
            personalityBig5: { openness: 60, conscientiousness: 70, extraversion: 50, agreeableness: 40, neuroticism: 30 },
            background: { origin: sectName, family: '门派传承', history: leaderName + '是' + sectName + '的现任' + leaderTitle + '，统领全派上下。', goal: '带领门派走向繁荣', secret: '…' }
        });
        leaderNPC.relationship.affection = 20;
        window.npcManager.addNPC(leaderNPC);
    }
    
    var elderCount = 1 + Math.floor(Math.random() * 2);
    for (var i = 0; i < elderCount; i++) {
        var elderId = 'sect_elder_' + sectName + '_' + i;
        var elderSurname = SECT_ELDER_SURNAMES[Math.floor(Math.random() * SECT_ELDER_SURNAMES.length)];
        var elderNPC = new window.NPC(elderId, elderSurname + '长老', {
            gender: 'male', age: 35 + Math.floor(Math.random() * 30), occupation: elderTitle, location: sectName,
            combat: { level: 30 + Math.floor(Math.random() * 20), realm: '筑基', layer: 5 + Math.floor(Math.random() * 5), attack: 40, defense: 40, speed: 35, skills: ['内功', '剑法'] },
            personalityBig5: { openness: 50, conscientiousness: 60, extraversion: 40, agreeableness: 50, neuroticism: 40 },
            background: { origin: sectName, family: '', history: '辅佐掌门处理门派事务。', goal: '培养优秀弟子', secret: '…' }
        });
        window.npcManager.addNPC(elderNPC);
    }
    
    var discipleCount = 5 + Math.floor(Math.random() * 4); // 批四·弟子有脸：每派5-8名具名同门（切磋陪练/收徒候选/事件真名都从这批真档案里出）
    var usedNames = [];
    function getDiscipleName() {
        if (typeof window.nameGenerator?.generateName === 'function') {
            for (var attempt = 0; attempt < 20; attempt++) {
                var nameObj = window.nameGenerator.generateName();
                var fullName = nameObj.full || nameObj;
                if (usedNames.indexOf(fullName) < 0) {
                    usedNames.push(fullName);
                    return fullName;
                }
            }
        }
        return '弟子' + (usedNames.length + 1);
    }
    for (var j = 0; j < discipleCount; j++) {
        var discipleNPC = new window.NPC('sect_disciple_' + sectName + '_' + j, getDiscipleName(), {
            gender: Math.random() > 0.5 ? 'male' : 'female', age: 16 + Math.floor(Math.random() * 14), occupation: '弟子', location: sectName,
            combat: { level: 10 + Math.floor(Math.random() * 20), realm: j < 2 ? '炼气' : '筑基', layer: 1 + Math.floor(Math.random() * 7), attack: 20, defense: 20, speed: 20, skills: ['基础修炼诀'] },
            personalityBig5: { openness: 60, conscientiousness: 50, extraversion: 60, agreeableness: 60, neuroticism: 50 }
        });
        window.npcManager.addNPC(discipleNPC);
    }
}

function registerAllSectNPCs() {
    var sects = window.sectsData || {};
    for (var name in sects) registerSectNPCs(name);
    var total = Object.keys(sects).length;
    // v20.88 注册完毕即铺功法持有网（幂等；打开请教/传授面板时还会懒补一次，覆盖读档世界）
    try { if (window.SkillTransmission && typeof window.SkillTransmission.ensureHolders === 'function') window.SkillTransmission.ensureHolders(); } catch (e) { console.warn('[传功] 持有网铺设失败:', e); }
    // 静默注册，不打扰玩家
    console.log('🏛️ 已为' + total + '个门派注册NPC');
}

// NEW-43④：名册归属改按「id 前缀 / 家锚点」判定，不再按 location 精确等值——
// 旧口径是「谁站在这儿谁是我门的人」：串门的外派混进名册、自家弟子出门就除名，
// 下游十一处读端（比武选人/护法差事/门内治理/弟子籍册…）一起歪。
function getSectOfNpcId(id) {
    if (typeof id !== 'string') return null;
    // sect_leader_华山派 / sect_elder_华山派_1 / sect_disciple_华山派_3 ……门派名写死在 id 里
    var m = /^sect_[A-Za-z]+_(.+?)(?:_\d+)?$/.exec(id);
    return m ? m[1] : null;
}

function getSectNPCs(sectName) {
    if (!window.npcManager) return [];
    return window.npcManager.getAllNPCs().filter(function(n) {
        if (!n) return false;
        if (getSectOfNpcId(n.id) === sectName) return true;
        // 家锚点兜底：不循 sect_* 命名的驻派人物（如特殊定义的破戒僧）以注册地为归属
        return !!n.homeLocation && n.homeLocation === sectName;
    });
}

// ============ 门派专属装备与功法（P3） ============
var SECT_SPECIFIC_EQUIPMENT = {
    '少林寺': { weapon: { id: 'wpn_shaolin_staff', name: '少林棍', quality: 'PIN7', level: 10, attrs: { strength: 8, constitution: 5 }, combatBonus: { attack: 25, block: 10 }, icon: '⚔️' }, armor: { id: 'arm_shaolin_robe', name: '少林袈裟', quality: 'PIN7', level: 10, defense: 20, attrs: { constitution: 6, willpower: 4 }, icon: '👘' } },
    '武当派': { weapon: { id: 'wpn_wudang_sword', name: '真武剑', quality: 'PIN7', level: 10, attrs: { strength: 6, dexterity: 8, intelligence: 4 }, combatBonus: { attack: 28, hit: 5 }, icon: '⚔️' } },
    '峨眉派': { weapon: { id: 'wpn_emei_sword', name: '倚天剑', quality: 'PIN5', level: 18, attrs: { strength: 12, dexterity: 10, intelligence: 8 }, combatBonus: { attack: 45, crit: 8, hit: 5 }, icon: '⚔️' } },
    '丐帮': { weapon: { id: 'wpn_gaibang_staff', name: '打狗棒', quality: 'PIN7', level: 12, attrs: { strength: 9, dexterity: 7 }, combatBonus: { attack: 30, crit: 5, block: 5 }, icon: '🔱' } },
    '铸剑山庄': { weapon: { id: 'wpn_zhujian_sword', name: '铸剑', quality: 'PIN5', level: 16, attrs: { strength: 15, dexterity: 8 }, combatBonus: { attack: 40, crit: 10 }, icon: '⚔️' } },
    '唐门': { weapon: { id: 'wpn_tangmen_dart', name: '唐门暗器', quality: 'PIN7', level: 10, attrs: { dexterity: 12 }, combatBonus: { attack: 28, hit: 8, crit: 5 }, icon: '🗡️' } },
    '茅山派': { weapon: { id: 'wpn_maoshan_sword', name: '桃木剑', quality: 'PIN8', level: 6, attrs: { intelligence: 8, willpower: 4 }, combatBonus: { attack: 18, hit: 3 }, icon: '⚔️' } }
};

// v15.4 藏经阁分层阅览体系：tier=楼层准入（1外门阁rank≤7 / 2内门阁rank≤5 / 3核心阁rank≤4 / 4镇派阁rank≤3）
// bonus=满掌握时的属性加成（实战按掌握度百分比缩放）；wuxingReq=镇派参悟神识门槛（不足进度减半）；copyPrice=请抄本贡献价
// 批次一16派；其余20派待批次二补全
var SECT_SPECIFIC_ARTS = {
    '少林寺': [
        { id: 'art_shaolin_quan', name: '少林长拳', type: '拳掌', grade: '八品', tier: 1, bonus: { strength: 5 }, copyPrice: 300, desc: '少林入门拳法，刚猛朴实' },
        { id: 'art_sl_luohan', name: '罗汉伏魔功', type: '内功', grade: '七品', tier: 2, bonus: { constitution: 8, willpower: 3 }, copyPrice: 800, desc: '十八罗汉桩合炼的内壮功法' },
        { id: 'art_yi_jin_jing', name: '易筋经', type: '内功', grade: '三品', tier: 4, wuxingReq: 28, bonus: { constitution: 15, willpower: 8 }, copyPrice: 3000, desc: '少林无上内功，脱胎换骨' }
    ],
    '武当派': [
        { id: 'art_taiji_quan', name: '太极拳', type: '拳掌', grade: '八品', tier: 1, bonus: { willpower: 5 }, copyPrice: 300, desc: '以柔克刚的入门拳法' },
        { id: 'art_wd_chunyang', name: '纯阳无极功', type: '内功', grade: '七品', tier: 2, bonus: { meridian: 9 }, copyPrice: 800, desc: '武当内丹正宗' },
        { id: 'art_wd_taiji_jian', name: '太极剑意', type: '剑法', grade: '三品', tier: 4, transmit: 'direct', wuxingReq: 26, bonus: { dexterity: 14, intelligence: 8 }, copyPrice: 3000, desc: '以意驭剑，绵绵不绝' }
    ],
    '峨眉派': [
        { id: 'art_em_jiuyang', name: '峨眉九阳功', type: '内功', grade: '八品', tier: 1, bonus: { constitution: 5 }, copyPrice: 300, desc: '脱胎于九阳神文的入门内功' },
        { id: 'art_em_piaoxue', name: '飘雪穿云掌', type: '拳掌', grade: '七品', tier: 2, bonus: { dexterity: 9 }, copyPrice: 800, desc: '掌如飞雪，绵里藏针' },
        { id: 'art_em_yitian', name: '倚天屠龙功', type: '剑法', grade: '三品', tier: 4, transmit: 'direct', wuxingReq: 28, bonus: { strength: 13, dexterity: 10 }, copyPrice: 3000, desc: '峨眉立派的至高剑学' }
    ],
    '丐帮': [
        { id: 'art_gb_tongbei', name: '丐帮通背拳', type: '拳掌', grade: '八品', tier: 1, bonus: { strength: 5 }, copyPrice: 300, desc: '叫花子们赖以防身的粗浅拳脚' },
        { id: 'art_gb_huntian', name: '混天功', type: '内功', grade: '七品', tier: 2, bonus: { constitution: 8, strength: 4 }, copyPrice: 800, desc: '丐帮内壮根基功，熬得住风霜才练得出' },
        { id: 'art_gaibang_staff', name: '打狗棒法', type: '长兵', grade: '三品', tier: 4, transmit: 'leader', wuxingReq: 25, bonus: { strength: 17, dexterity: 10 }, copyPrice: 3000, desc: '丐帮镇帮神技——棒在人在，历代只传帮主一人，阁中无册' },
        { id: 'art_gb_xianglong', name: '降龙十八掌·残篇', type: '拳掌', grade: '三品', tier: 4, transmit: 'direct', wuxingReq: 25, bonus: { strength: 18, constitution: 6 }, copyPrice: 3000, desc: '天下第一刚猛掌力（仅存十五式）' }
    ],
    '唐门': [
        { id: 'art_tm_cuidu', name: '淬毒手法', type: '奇门', grade: '八品', tier: 1, bonus: { dexterity: 5 }, copyPrice: 300, desc: '蜀中暗器手的必修基本功' },
        { id: 'art_tangmen_hidden', name: '唐门暗器术', type: '奇门', grade: '七品', tier: 2, bonus: { dexterity: 10 }, copyPrice: 800, desc: '唐门不传之秘' },
        { id: 'art_tm_wangu', name: '万蛊噬心术', type: '奇门', grade: '三品', tier: 4, transmit: 'direct', wuxingReq: 27, bonus: { intelligence: 12, dexterity: 10 }, copyPrice: 3000, desc: '蛊毒暗器合一的禁术' }
    ],
    '逍遥派': [
        { id: 'art_xy_yufeng', name: '逍遥御风诀', type: '轻功', grade: '八品', tier: 1, bonus: { meridian: 5 }, copyPrice: 300, desc: '缥缈峰入门身法' },
        { id: 'art_xiaoyao_zhang', name: '逍遥掌法', type: '拳掌', grade: '七品', tier: 2, bonus: { intelligence: 6, dexterity: 6 }, copyPrice: 800, desc: '潇洒写意的掌中雅趣' },
        { id: 'art_xy_xiaowuxiang', name: '小无相功', type: '内功', grade: '三品', tier: 4, transmit: 'direct', wuxingReq: 30, bonus: { intelligence: 15, meridian: 8 }, copyPrice: 3000, desc: '道家清静无为的至高内功' }
    ],
    '修罗宫': [
        { id: 'art_xlg_xuesha', name: '修罗血煞劲', type: '内功', grade: '八品', tier: 1, bonus: { constitution: 5 }, copyPrice: 300, desc: '以痛楚淬炼体魄的入门功' },
        { id: 'art_xiuluo_dao', name: '修罗刀法', type: '刀法', grade: '七品', tier: 2, bonus: { strength: 11 }, copyPrice: 800, desc: '修罗宫杀戮刀法' },
        { id: 'art_xlg_tianmo', name: '天魔解体大法', type: '内功', grade: '三品', tier: 4, transmit: 'direct', wuxingReq: 25, bonus: { strength: 16, willpower: 8 }, copyPrice: 3000, desc: '燃血催力的搏命绝学' }
    ],
    '铸剑山庄': [
        { id: 'art_zj_duanti', name: '锻体锤法', type: '拳掌', grade: '八品', tier: 1, bonus: { strength: 5, constitution: 3 }, copyPrice: 300, desc: '打铁先打身的庄内基本功' },
        { id: 'art_zj_xinfa', name: '铸剑心法', type: '内功', grade: '七品', tier: 2, bonus: { willpower: 9 }, copyPrice: 800, desc: '观炉火三千日方得的心法' },
        { id: 'art_zj_wanjian', name: '万剑归宗诀', type: '剑法', grade: '三品', tier: 4, transmit: 'direct', wuxingReq: 27, bonus: { strength: 12, dexterity: 12 }, copyPrice: 3000, desc: '剑冢千柄同鸣的传说剑诀' }
    ],
    '茅山派': [
        { id: 'art_ms_jingshen', name: '净身咒', type: '符箓', grade: '八品', tier: 1, bonus: { willpower: 5 }, copyPrice: 300, desc: '茅山弟子的第一道符课' },
        { id: 'art_ms_wulei', name: '五雷符法', type: '符箓', grade: '七品', tier: 2, bonus: { intelligence: 9 }, copyPrice: 800, desc: '召雷敕鬼的正统符术' },
        { id: 'art_ms_tianshi', name: '天师正印', type: '符箓', grade: '三品', tier: 4, transmit: 'direct', wuxingReq: 26, bonus: { intelligence: 14, willpower: 10 }, copyPrice: 3000, desc: '茅山历代天师印信之学' }
    ],
    '全真教': [
        { id: 'art_qz_tuna', name: '全真吐纳术', type: '内功', grade: '八品', tier: 1, bonus: { meridian: 5 }, copyPrice: 300, desc: '终南山入门调息之法' },
        { id: 'art_qz_xiantian', name: '先天功', type: '内功', grade: '七品', tier: 2, bonus: { intelligence: 10 }, copyPrice: 800, desc: '返本归元的道门玄功' },
        { id: 'art_qz_yiqi', name: '一气化三清', type: '内功', grade: '三品', tier: 4, wuxingReq: 29, bonus: { meridian: 14, intelligence: 9 }, copyPrice: 3000, desc: '全真玄门最高绝学' }
    ],
    '天山派': [
        { id: 'art_ts_zhemei', name: '天山折梅手·基础', type: '拳掌', grade: '八品', tier: 1, bonus: { dexterity: 5 }, copyPrice: 300, desc: '三路折梅手的基础三十六式' },
        { id: 'art_ts_shengsi', name: '生死符秘要', type: '奇门', grade: '七品', tier: 2, bonus: { intelligence: 9 }, copyPrice: 800, desc: '寒冰薄片的制御之要' },
        { id: 'art_ts_liuyang', name: '天山六阳掌', type: '拳掌', grade: '三品', tier: 4, transmit: 'direct', wuxingReq: 27, bonus: { dexterity: 13, intelligence: 10 }, copyPrice: 3000, desc: '阳春白雪与雷霆并蓄' }
    ],
    '金刚宗': [
        { id: 'art_jgz_zhuang', name: '金刚桩功', type: '炼体', grade: '八品', tier: 1, bonus: { constitution: 6 }, copyPrice: 300, desc: '密宗苦行的第一桩' },
        { id: 'art_jgz_longxiang_c', name: '龙象般若功·初卷', type: '炼体', grade: '七品', tier: 2, bonus: { strength: 10 }, copyPrice: 800, desc: '十三层龙象的前七层' },
        { id: 'art_jgz_longxiang', name: '龙象般若功·圆满', type: '炼体', grade: '三品', tier: 4, transmit: 'direct', wuxingReq: 24, bonus: { strength: 17, constitution: 10 }, copyPrice: 3000, desc: '十龙十象之力，密宗炼体极诣' }
    ],
    '蓬莱派': [
        { id: 'art_pl_guanlan', name: '观澜心法', type: '内功', grade: '八品', tier: 1, bonus: { meridian: 5 }, copyPrice: 300, desc: '观海听涛而悟的入门心法' },
        { id: 'art_pl_canglang', name: '沧浪水诀', type: '法术', grade: '七品', tier: 2, bonus: { intelligence: 9, meridian: 4 }, copyPrice: 800, desc: '驭水行舟的岛居秘传' },
        { id: 'art_pl_haishi', name: '海市蜃楼幻术', type: '法术', grade: '三品', tier: 4, transmit: 'direct', wuxingReq: 28, bonus: { intelligence: 13, willpower: 9 }, copyPrice: 3000, desc: '虚实颠倒的海上大幻' }
    ],
    '药王谷': [
        { id: 'art_yw_baicao', name: '百草辨识', type: '医道', grade: '八品', tier: 1, bonus: { constitution: 5 }, copyPrice: 300, desc: '尝百草识药性的谷中童子功课' },
        { id: 'art_yw_qihuang', name: '岐黄之术', type: '医道', grade: '七品', tier: 2, bonus: { intelligence: 10 }, copyPrice: 800, desc: '医武同源的谷主亲传' },
        { id: 'art_yw_taisu', name: '太素神针', type: '医道', grade: '三品', tier: 4, transmit: 'direct', wuxingReq: 26, bonus: { intelligence: 12, constitution: 11 }, copyPrice: 3000, desc: '一针定生死的谷中圣手之学' }
    ],
    '华山派': [
        { id: 'art_hs_jianchu', name: '华山剑法·基础', type: '剑法', grade: '八品', tier: 1, bonus: { dexterity: 5 }, copyPrice: 300, desc: '五岳剑派的正统入门剑' },
        { id: 'art_hs_zixia', name: '紫霞神功', type: '内功', grade: '七品', tier: 2, bonus: { willpower: 10 }, copyPrice: 800, desc: '华山气宗立派之本' },
        { id: 'art_hs_dugu', name: '独孤九剑·总诀式', type: '剑法', grade: '三品', tier: 4, transmit: 'direct', wuxingReq: 30, bonus: { dexterity: 16, intelligence: 8 }, copyPrice: 3000, desc: '无招胜有招的剑道至理' }
    ],
    '昆仑派': [
        { id: 'art_kl_liangyi_c', name: '昆仑两仪剑·基础', type: '剑法', grade: '八品', tier: 1, bonus: { dexterity: 5 }, copyPrice: 300, desc: '西域玄门的阴阳初剑' },
        { id: 'art_kl_xiangji', name: '两仪相济诀', type: '内功', grade: '七品', tier: 2, bonus: { willpower: 9, dexterity: 4 }, copyPrice: 800, desc: '阴阳互济的调和之道' },
        { id: 'art_kl_tianqing', name: '天清诀', type: '内功', grade: '三品', tier: 4, transmit: 'direct', wuxingReq: 28, bonus: { meridian: 13, intelligence: 10 }, copyPrice: 3000, desc: '昆仑镇山的清微玄功' }
    ],
    '嵩山派': [
        { id: 'art_ss_jianchu', name: '嵩山剑法·基础', type: '剑法', grade: '八品', tier: 1, bonus: { dexterity: 5 }, copyPrice: 300, desc: '十七路嵩山剑，长枪大戟般堂皇' },
        { id: 'art_ss_dasongyang', name: '大嵩阳神掌', type: '拳掌', grade: '七品', tier: 2, bonus: { strength: 9, willpower: 4 }, copyPrice: 800, desc: '五岳盟主威震群雄的掌力' },
        { id: 'art_ss_hanbing', name: '寒冰真气', type: '内功', grade: '三品', tier: 4, transmit: 'direct', wuxingReq: 27, bonus: { intelligence: 13, willpower: 10 }, copyPrice: 3000, desc: '真气所至，寒霜凝结的左氏秘传' }
    ],
    '泰山派': [
        { id: 'art_ta_jianchu', name: '泰山剑法·基础', type: '剑法', grade: '八品', tier: 1, bonus: { dexterity: 5 }, copyPrice: 300, desc: '五岳剑派的厚重入门剑' },
        { id: 'art_ta_shibapan', name: '泰山十八盘', type: '剑法', grade: '七品', tier: 2, bonus: { dexterity: 8, strength: 4 }, copyPrice: 800, desc: '越盘越高，越行越险' },
        { id: 'art_ta_daizong', name: '岱宗如何', type: '剑法', grade: '三品', tier: 4, transmit: 'direct', wuxingReq: 30, bonus: { intelligence: 14, dexterity: 11 }, copyPrice: 3000, desc: '算尽敌我方位方能出手——难学无比' }
    ],
    '恒山派': [
        { id: 'art_heng_jianchu', name: '恒山剑法·基础', type: '剑法', grade: '八品', tier: 1, bonus: { dexterity: 5 }, copyPrice: 300, desc: '绵密严谨，以守代攻' },
        { id: 'art_heng_mianlizhen', name: '绵里藏针', type: '剑法', grade: '七品', tier: 2, bonus: { dexterity: 7, willpower: 4 }, copyPrice: 800, desc: '棉里裹针，后发制人' },
        { id: 'art_heng_wanhua', name: '万花剑法', type: '剑法', grade: '三品', tier: 4, transmit: 'direct', wuxingReq: 26, bonus: { dexterity: 12, willpower: 10 }, copyPrice: 3000, desc: '恒山诸尼镇寺之宝' }
    ],
    '衡山派': [
        { id: 'art_hy_jianchu', name: '衡山剑法·基础', type: '剑法', grade: '八品', tier: 1, bonus: { dexterity: 5 }, copyPrice: 300, desc: '潇湘夜雨的前三十六路' },
        { id: 'art_hy_huifeng', name: '回风落雁剑', type: '剑法', grade: '七品', tier: 2, bonus: { dexterity: 9, intelligence: 4 }, copyPrice: 800, desc: '一剑落九雁' },
        { id: 'art_hy_wushen', name: '衡山五神剑', type: '剑法', grade: '三品', tier: 4, transmit: 'direct', wuxingReq: 29, bonus: { dexterity: 13, intelligence: 10 }, copyPrice: 3000, desc: '天柱紫盖芙蓉石廪祝融，五剑相辅，森罗万象' }
    ],
    '大旗门': [
        { id: 'art_dq_changquan', name: '大旗门长拳', type: '拳掌', grade: '八品', tier: 1, bonus: { strength: 5, constitution: 3 }, copyPrice: 300, desc: '旗门子弟白日扛旗、夜里练拳' },
        { id: 'art_dq_tiexue', name: '铁血旗功', type: '内功', grade: '七品', tier: 2, bonus: { strength: 10 }, copyPrice: 800, desc: '霸烈刚猛的旗门内功' },
        { id: 'art_dq_fengyun', name: '大旗风云掌', type: '拳掌', grade: '三品', tier: 4, transmit: 'direct', wuxingReq: 25, bonus: { strength: 16, constitution: 8 }, copyPrice: 3000, desc: '掌出如旗卷风雷' }
    ],
    '侠隐阁': [
        { id: 'art_xia_zhengqi', name: '侠隐正气功', type: '内功', grade: '八品', tier: 1, bonus: { willpower: 5 }, copyPrice: 300, desc: '书院弟子晨课必修' },
        { id: 'art_xia_jianfa', name: '侠隐剑法', type: '剑法', grade: '七品', tier: 2, bonus: { dexterity: 8, willpower: 3 }, copyPrice: 800, desc: '阁中所授的江湖实用剑技' },
        { id: 'art_xia_zhida', name: '侠之大者诀', type: '内功', grade: '三品', tier: 4, wuxingReq: 28, bonus: { willpower: 14, constitution: 9 }, copyPrice: 3000, desc: '侠之大者，为国为民' }
    ],
    '天涯海阁': [
        { id: 'art_ty_xianyin', name: '弦音入定', type: '音律', grade: '八品', tier: 1, bonus: { intelligence: 5 }, copyPrice: 300, desc: '以琴音凝神的雅乐入门' },
        { id: 'art_ty_luoxia', name: '落霞笔法', type: '奇门', grade: '七品', tier: 2, bonus: { dexterity: 9 }, copyPrice: 800, desc: '笔走龙蛇，点石成锋' },
        { id: 'art_ty_gaoshan', name: '高山流水曲', type: '音律', grade: '三品', tier: 4, transmit: 'direct', wuxingReq: 28, bonus: { intelligence: 13, meridian: 9 }, copyPrice: 3000, desc: '一曲既罢，敌胆自寒' }
    ],
    '神机门': [
        { id: 'art_sj_qianji', name: '千机匣·初制', type: '奇门', grade: '八品', tier: 1, bonus: { dexterity: 5 }, copyPrice: 300, desc: '机关弟子的第一具暗匣' },
        { id: 'art_sj_kuilei', name: '傀儡线操控术', type: '奇门', grade: '七品', tier: 2, bonus: { intelligence: 9, dexterity: 4 }, copyPrice: 800, desc: '十指悬丝，傀儡如生' },
        { id: 'art_sj_wanji', name: '万机归一术', type: '奇门', grade: '三品', tier: 4, transmit: 'direct', wuxingReq: 28, bonus: { intelligence: 15, dexterity: 9 }, copyPrice: 3000, desc: '百械同鸣的机关至境' }
    ],
    '霹雳堂': [
        { id: 'art_pili_tiaoyao', name: '调药引火术', type: '奇门', grade: '八品', tier: 1, bonus: { intelligence: 5 }, copyPrice: 300, desc: '硝硫配比的看家本事' },
        { id: 'art_pili_leihuo', name: '雷火掌', type: '拳掌', grade: '七品', tier: 2, bonus: { strength: 9 }, copyPrice: 800, desc: '掌中蕴火，触之即燃' },
        { id: 'art_pili_jiuxiao', name: '九霄霹雳诀', type: '奇门', grade: '三品', tier: 4, transmit: 'direct', wuxingReq: 26, bonus: { intelligence: 12, strength: 10 }, copyPrice: 3000, desc: '雷火倾天的堂中至宝' }
    ],
    '大隐阁': [
        { id: 'art_dy_cangfeng', name: '藏锋养气功', type: '内功', grade: '八品', tier: 1, bonus: { willpower: 5 }, copyPrice: 300, desc: '大隐隐于市的养气之道' },
        { id: 'art_dy_wuhen', name: '无痕剑意', type: '剑法', grade: '七品', tier: 2, bonus: { dexterity: 9 }, copyPrice: 800, desc: '出剑无痕，收剑无迹' },
        { id: 'art_dy_chaoshi', name: '大隐朝市诀', type: '内功', grade: '三品', tier: 4, wuxingReq: 29, bonus: { intelligence: 13, willpower: 10 }, copyPrice: 3000, desc: '隐于朝市而天下知' }
    ],
    '天书阁': [
        { id: 'art_tsg_qimeng', name: '天书启蒙录', type: '文道', grade: '八品', tier: 1, bonus: { intelligence: 5 }, copyPrice: 300, desc: '万卷楼童子的开蒙课本' },
        { id: 'art_tsg_baijia', name: '百家杂学', type: '文道', grade: '七品', tier: 2, bonus: { intelligence: 10 }, copyPrice: 800, desc: '医卜星相，无一不窥' },
        { id: 'art_tsg_canjuan', name: '天书残卷·总纲', type: '文道', grade: '三品', tier: 4, wuxingReq: 30, bonus: { intelligence: 16, willpower: 8 }, copyPrice: 3000, desc: '传说中失落的天书总纲' }
    ],
    '铁掌帮': [
        { id: 'art_tz_tiesha_c', name: '铁砂掌·粗功', type: '拳掌', grade: '八品', tier: 1, bonus: { strength: 6 }, copyPrice: 300, desc: '插沙三百日的帮众底子' },
        { id: 'art_tz_tiezhang', name: '铁掌功', type: '拳掌', grade: '七品', tier: 2, bonus: { strength: 10 }, copyPrice: 800, desc: '裘氏一门立帮之技' },
        { id: 'art_tz_heisha', name: '黑煞掌', type: '拳掌', grade: '三品', tier: 4, transmit: 'direct', wuxingReq: 25, bonus: { strength: 17, constitution: 7 }, copyPrice: 3000, desc: '掌风过处，金石俱裂' }
    ],
    '百花谷': [
        { id: 'art_bh_tuna', name: '花间吐纳', type: '内功', grade: '八品', tier: 1, bonus: { constitution: 5 }, copyPrice: 300, desc: '伴花而息的谷中功课' },
        { id: 'art_bh_chunni', name: '春泥护元术', type: '医道', grade: '七品', tier: 2, bonus: { intelligence: 9, constitution: 4 }, copyPrice: 800, desc: '落红化春泥的疗愈之学' },
        { id: 'art_bh_wenhua', name: '百花缭乱剑', type: '剑法', grade: '三品', tier: 4, transmit: 'direct', wuxingReq: 27, bonus: { dexterity: 13, intelligence: 10 }, copyPrice: 3000, desc: '万花丛中过，片叶不沾身' }
    ],
    '五仙教': [
        { id: 'art_wxj_yuchong', name: '驭虫小术', type: '奇门', grade: '八品', tier: 1, bonus: { intelligence: 5 }, copyPrice: 300, desc: '苗疆孩童也会的两手驱虫咒' },
        { id: 'art_wxj_gujing', name: '五仙蛊经', type: '奇门', grade: '七品', tier: 2, bonus: { intelligence: 10 }, copyPrice: 800, desc: '南疆巫蛊正统的蛊经' },
        { id: 'art_wxj_wanshi', name: '千蛊万噬天', type: '奇门', grade: '三品', tier: 4, transmit: 'direct', wuxingReq: 27, bonus: { intelligence: 14, willpower: 9 }, copyPrice: 3000, desc: '放蛊成云，遮天蔽日' }
    ],
    '阎罗殿': [
        { id: 'art_yl_kaishan', name: '开山路刀法', type: '刀法', grade: '八品', tier: 1, bonus: { strength: 5 }, copyPrice: 300, desc: '殿前开路弟子的劈山刀' },
        { id: 'art_yl_shengsi', name: '生死判', type: '刀法', grade: '七品', tier: 2, bonus: { strength: 11 }, copyPrice: 800, desc: '一笔判生死的大殿刑刀' },
        { id: 'art_yl_shidian', name: '十殿阎罗刀', type: '刀法', grade: '三品', tier: 4, transmit: 'direct', wuxingReq: 24, bonus: { strength: 18, willpower: 7 }, copyPrice: 3000, desc: '十殿齐开，恶鬼让路' }
    ],
    '天龙教': [
        { id: 'art_tl_mizhou', name: '天龙密咒', type: '内功', grade: '八品', tier: 1, bonus: { willpower: 5 }, copyPrice: 300, desc: '西域魔教的持咒功夫' },
        { id: 'art_tl_dashouyin', name: '天龙大手印', type: '拳掌', grade: '七品', tier: 2, bonus: { strength: 10, willpower: 4 }, copyPrice: 800, desc: '一印压一城' },
        { id: 'art_tl_huaxue', name: '化血魔功', type: '内功', grade: '三品', tier: 4, transmit: 'direct', wuxingReq: 26, bonus: { strength: 14, constitution: 9 }, copyPrice: 3000, desc: '饮血催功的魔教禁术' }
    ],
    '烈日教': [
        { id: 'art_lj_puri', name: '曝日桩', type: '炼体', grade: '八品', tier: 1, bonus: { constitution: 6 }, copyPrice: 300, desc: '烈日下站桩的教中苦行' },
        { id: 'art_lj_zhenyan', name: '烈日真焰', type: '法术', grade: '七品', tier: 2, bonus: { intelligence: 9, strength: 4 }, copyPrice: 800, desc: '掌心凝出一簇不灭日光' },
        { id: 'art_lj_fentian', name: '大日焚天功', type: '内功', grade: '三品', tier: 4, transmit: 'direct', wuxingReq: 25, bonus: { intelligence: 13, strength: 12 }, copyPrice: 3000, desc: '焚天之焰，教主亲传' }
    ],
    '血手门': [
        { id: 'art_xsm_fugu_c', name: '腐骨掌·粗功', type: '拳掌', grade: '八品', tier: 1, bonus: { strength: 5 }, copyPrice: 300, desc: '浸药水泡出的第一层阴劲' },
        { id: 'art_xsm_xuesha', name: '血煞爪', type: '拳掌', grade: '七品', tier: 2, bonus: { strength: 9, dexterity: 4 }, copyPrice: 800, desc: '五指见血，创口难愈' },
        { id: 'art_xsm_xuehai', name: '万劫血海功', type: '内功', grade: '三品', tier: 4, transmit: 'direct', wuxingReq: 24, bonus: { strength: 15, constitution: 9 }, copyPrice: 3000, desc: '血海翻涌，生生不息的邪功' }
    ],
    '青城派': [
        { id: 'art_qc_jianchu', name: '青城剑法·基础', type: '剑法', grade: '八品', tier: 1, bonus: { dexterity: 5 }, copyPrice: 300, desc: '蜀中剑派的看门剑' },
        { id: 'art_qc_songfeng', name: '松风剑法', type: '剑法', grade: '七品', tier: 2, bonus: { dexterity: 9, willpower: 4 }, copyPrice: 800, desc: '如松之劲，如风之迅' },
        { id: 'art_qc_cuixin', name: '摧心掌', type: '拳掌', grade: '三品', tier: 4, transmit: 'direct', wuxingReq: 26, bonus: { strength: 13, intelligence: 10 }, copyPrice: 3000, desc: '震碎人心，不露痕迹' }
    ],
    '飞蝎坞': [
        { id: 'art_fx_fushui', name: '水乡凫水诀', type: '轻功', grade: '八品', tier: 1, bonus: { dexterity: 5 }, copyPrice: 300, desc: '江南水网里的保命泳技' },
        { id: 'art_fx_xiewei', name: '蝎尾针法', type: '奇门', grade: '七品', tier: 2, bonus: { dexterity: 10 }, copyPrice: 800, desc: '针出如蝎尾摆尾，专挑筋缝' },
        { id: 'art_fx_xiewang', name: '蝎王噬心刺', type: '奇门', grade: '三品', tier: 4, transmit: 'direct', wuxingReq: 27, bonus: { dexterity: 13, intelligence: 10 }, copyPrice: 3000, desc: '坞主亲传的一刺封喉' }
    ]
};

// v20.8：核心阁（tier3，亲传弟子准入，见 canAccessScriptureTier）此前全派空置——
// 每派补一部"承脉要诀"，属性加成取本派二/四层功法的中段，填补 良→珍→仙 的成长台阶。
(function fillTier3Arts() {
    var seq = 0;
    for (var sectName in SECT_SPECIFIC_ARTS) {
        var arts = SECT_SPECIFIC_ARTS[sectName];
        if (!Array.isArray(arts) || !arts.length) continue;
        var has3 = false, t2 = null, t4 = null;
        for (var i = 0; i < arts.length; i++) {
            if (arts[i].tier === 3) has3 = true;
            if (arts[i].tier === 2) t2 = arts[i];
            if (arts[i].tier === 4) t4 = arts[i];
        }
        if (has3) continue;
        var bonus = {};
        var src = [t2, t4];
        for (var s = 0; s < src.length; s++) {
            var b = src[s] && src[s].bonus;
            if (!b) continue;
            for (var k in b) bonus[k] = Math.max(bonus[k] || 0, Math.round(b[k] * (s === 0 ? 1.3 : 0.6)));
        }
        seq++;
        arts.push({
            id: 'art_core_' + seq,
            name: sectName + '·承脉要诀',
            type: (t4 && t4.type) || (t2 && t2.type) || '内功',
            grade: '七品',
            tier: 3,
            bonus: bonus,
            copyPrice: 1500,
            desc: '历代执堂长老接续补注的本派要诀，接了本派的脉才读得懂。'
        });
    }
})();

function getSectEquipment(sectName) { return SECT_SPECIFIC_EQUIPMENT[sectName] || null; }
function getSectArts(sectName) { return SECT_SPECIFIC_ARTS[sectName] || []; }

// v19.0 P0-3 批次 B1：按玩家职位过滤可阅览的本派功法（藏经阁分层阅览体系）
// 长老（id<=2）= tier 4 镇派；亲传=3；内门=2；外门/记名/杂役=1
// 未入宗或侍妾/同参 → 空数组（不开放）
function getReadableSectArts(sectName) {
    var arts = getSectArts(sectName);
    if (!Array.isArray(arts) || !arts.length) return [];
    var can = window.canAccessScriptureTier;
    if (typeof can !== 'function') return arts; // 守卫：v19.0 工具函数未加载时退化为全部可见
    // v20.93 镇派亲传：楼层门之外再过一道传人门——未受亲传的镇派神功不算「可阅览」
    var tok = window.sectArtTransmitOK;
    return arts.filter(function (art) { return can(Number(art.tier) || 1) && (typeof tok !== 'function' || tok(art)); });
}

function registerSectSpecificItems(sectName) {
    var equip = getSectEquipment(sectName);
    var arts = getSectArts(sectName);
    if (equip) {
        [equip.weapon, equip.armor].forEach(function(item) {
            if (item && !window.itemById[item.id]) {
                window.allItems.push(Object.assign({}, { type: 'equipment', slot: item.slot || 'mainHand', category: 'equipment', stackable: false }, item));
                window.itemById[item.id] = item;
            }
        });
    }
    arts.forEach(function(art) {
        if (!window.itemById[art.id]) {
            var artItem = { id: art.id, name: art.name, type: 'secret_art', subtype: 'sect_art', category: 'secret_art', quality: art.grade === '三品' ? 'PIN3' : 'PIN7', level: art.tier || 1, price: art.copyPrice || 300, effect: {}, desc: art.desc, icon: '📖' };
            window.allItems.push(artItem);
            window.itemById[art.id] = artItem;
        }
    });
}

function registerAllSectSpecificItems() {
    for (var name in SECT_SPECIFIC_EQUIPMENT) registerSectSpecificItems(name);
    for (var name in SECT_SPECIFIC_ARTS) registerSectSpecificItems(name);
}

// ============ 导出 ============
if (typeof window !== 'undefined') {
    window.SECT_INTERNAL = SECT_INTERNAL;
    window.getSectEconomySnapshot = getSectEconomySnapshot;
    window.processAllSectDailyEconomy = processAllSectDailyEconomy;
    window.noteSectExpense = noteSectExpense; // v27.13：外部支出入宗门月账（发俸/赏格在各自扣库处调用）
    window.setSectResourceTend = setSectResourceTend; // v27.13 续批：产业格弟子指派（名册侧）
    window.getSectTendInfo = getSectTendInfo;         // v27.13 续批：产业格指派名册+日产加成（UI 一次取全）
    window.SECT_TEND_TUNE = SECT_TEND_TUNE;
    window.generateSectDisciples = generateSectDisciples;
    window.holdSectMeeting = holdSectMeeting;
    window.getSectSummary = getSectSummary;
    window.getSectMorale = getSectMorale;
    window.initAllSectInternal = initAllSectInternal;
    window.registerSectNPCs = registerSectNPCs;
    window.registerAllSectNPCs = registerAllSectNPCs;
    window.getSectNPCs = getSectNPCs;
    window.SECT_LEADER_NAMES = SECT_LEADER_NAMES;
    window.SECT_SPECIFIC_EQUIPMENT = SECT_SPECIFIC_EQUIPMENT;
    window.SECT_SPECIFIC_ARTS = SECT_SPECIFIC_ARTS;
    window.getSectEquipment = getSectEquipment;
    window.getSectArts = getSectArts;
    window.getReadableSectArts = getReadableSectArts;
    window.registerSectSpecificItems = registerSectSpecificItems;
    window.registerAllSectSpecificItems = registerAllSectSpecificItems;
}

// v18.9 路线图 P0-2：宗门资源真实日结由 newDay 事件统一驱动，
// 与门派日结、寿元、世界日历共享 newDay chokepoint，避免多模块互相包装。
// processAllSectDailyEconomy 内部已用 lastEconomyDay 幂等，重放安全。
if (typeof window !== 'undefined' && window.EventBus && typeof window.EventBus.on === 'function' && typeof window.processAllSectDailyEconomy === 'function') {
    window.EventBus.on('newDay', function (payload) {
        try {
            var day = payload && typeof payload.newDay === 'number' ? payload.newDay : ((window.timeSystem && window.timeSystem.gameTime) ? window.timeSystem.gameTime.currentDay : null);
            if (day == null) return;
            window.processAllSectDailyEconomy(day);
        } catch (e) { /* 静默：资源日结失败不应阻塞世界推进 */ }
    });
}