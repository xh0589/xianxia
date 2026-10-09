// ==================== v26.0 六路营生批（第一百五十一批 · 用户点单）· 掌柜铺子账 ====================
// 用户点单：「我炼了一仓库丹、打了一堆装备，只能摆摊贱卖或塞拍卖行。想买间铺面自己定价、
//           雇伙计、挂招牌。」——enhanced-shop.js 里 this.playerShops = [] 从第一天起就是个
//           没接线的空壳（本账不去动那本旧账，新开正门，空壳留档为证）。本账把掌柜这条线接通：
//   ① 盘铺面：有铺面的城才有的卖；一城一间、至多掌两城（多了照应不过来——实话）；
//      铺价随本城声望水涨船高（声望越高的城，铺面越贵，也越旺）；
//   ② 挂招牌：铺名自己起（十二字内），货从行囊上架（至多八样），定价自己定
//      （默认公道价上浮三成；定高了没人买——街面不傻，销率明账写在牌面上）；
//   ③ 雇伙计：三名候选（城＋日播种，回访同日还是那三人），手艺 1~5 决定销率加成与工钱；
//      工钱每日从柜上支——柜上没钱，欠三日伙计就辞工（东家抠门的代价如实落账）；
//      没雇伙计：只有你人在城里的那天铺子才开门（销率还打对折——一个人看不过来）；
//   ④ 每日开市结算（新日正门）：逐样掷销（销率=底价×定价系数×伙计系数×城望系数×黑货溢价），
//      卖得的钱进柜（till），你来收或攒着；小概率遇街面事：顺手牵羊（丢最便宜的一样/当场拿住城望+1）、
//      税吏抽分（柜上抽 5%；通缉画像档之身，税吏认得你的招牌——热度+1 罚酒钱）、
//      老主顾批货（随机一样一次买三件、九折）；
//   ⑤ 下柜：货随时可以收回行囊（giveWithReceipt 正门，接不住就留在架上不蒸发）。
// 口径：灵石走 DataManager 单一真源；声望读 getReputationValue 正门；每日账落 StateRegistry
//   'playerShop' 正门；开店不是印钞机——定价高了没人买、伙计要工钱、税吏要抽分，全是明账。
//
// ---- v27.1 营生扩展批（第一百五十四批 · 用户点单「开工营生扩展批」）· 铺面类型表 + 分号大掌柜 ----
//   ⑥ 铺面类型表：盘铺面先选行当——杂货铺（货架老账不动）之外新开十一门营生：
//      酒楼/客栈/民信局/委托所/车马行/冰行/医馆/武馆/房东宅院/赌坊/销赃铺。
//      自动营生日进明账：基础 × 伙计(0.6+手艺×0.15) × 城望(1+rep/400) × 盈亏系数，税吏照抽 5%；
//      各有门槛（赌坊恶名20、销赃恶名30、医馆医术40、武馆筑基）与行当特色账：
//      冰行看季（夏20/春秋10/冬4）、车马行吃坐骑账（厩里每头凡兽+4）、医馆医术每20点+1、
//      委托所每日0~2单零活、房东初一收租120起（城望抬租）、销赃铺每日3%查抄（画像档6%，抄柜三成+热度+城望）。
//   ⑦ 每月一件专属事：月账日55%骰，牌面上出两选（放着五日不管按稳妥章程自动了结——绝不追着玩家）；
//      骰子选项临场掷（有引擎随机源走引擎），效果只有现银/城望/恶名/热度/盈亏系数五种，全走既有正门。
//   ⑧ 分号大掌柜：伙计柜上熬满三十日、手艺四成起，可提拔大掌柜（日薪+2）——手底下有大掌柜，
//      才照应得开第三、第四间铺子（MAX 2→4）。资历只在开门日累积，辞工清零。
(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    var CFG = {
        MAX_SHOPS: 2,           // 至多掌两城
        SHELF_MAX: 8,           // 货架八样
        PER_STACK_MAX: 9,       // 每样至多上九件
        BASE_PRICE: 500,        // 铺面底价
        REP_PRICE_MUL: 2,       // 城望每点抬价
        SEED_PRICE_MAX: 200,    // 地段浮动（城名播种，回访同价）
        DEFAULT_MARKUP: 1.3,    // 上架默认价=公道价×1.3
        PRICE_MIN_MUL: 0.5, PRICE_MAX_MUL: 4,   // 调价夹板
        CLERK_HIRE_BASE: 30, CLERK_HIRE_PER_SKILL: 20,
        CLERK_ARREARS_QUIT: 3,  // 欠薪几日辞工
        SALE_BASE: 0.18,        // 底价销率（每样每日）
        SALE_PER_ITEM_CAP: 2,   // 每样每日至多走两件
        SOLO_SHOP_MUL: 0.5,     // 没伙计、人又在城里：一个人看不过来
        TAX_FRAC: 0.05,
        EVENT_P: 0.08,
        BULK_N: 3, BULK_DISC: 0.9,
        // ---- v27.1 营生扩展批：铺面类型表 + 分号大掌柜 ----
        BRANCH_SHOPS: 4,        // 手底下有大掌柜，才照应得开分号（至多掌四城）
        HEAD_SKILL: 4,          // 大掌柜门槛：手艺四成起
        HEAD_DAYS: 30,          // 大掌柜门槛：柜上熬满三十日
        EVENT_MONTH_P: 0.55,    // 月账日：铺面专属事的概率
        EVENT_EXPIRE_DAYS: 5,   // 事放着不管五日即过——按稳妥那条自动了结，绝不追着玩家
        INCOME_MUL_MIN: 0.3, INCOME_MUL_MAX: 2.0
    };

    var CLERK_NAMES = ['顺子', '阿贵', '小满', '来福', '栓子', '巧儿', '德发', '春生', '二牛', '月牙'];

    // ============ v27.1 铺面类型表：一门营生一行配置 ============
    // 杂货铺是自带的货真价实（货架账照旧）；其余十一种是「铺面自己会营生」——
    // 日进按 base × 伙计系数 × 城望系数 × 盈亏系数，不用上货；各有门槛与每月一件专属事（放着不管五日自过）。
    var SHOP_TYPES = {
        general:  { key: 'general',  name: '杂货铺',   icon: '🏪', priceMul: 1.0, base: 0,  desc: '自己的货自己卖：行囊上架、定价随你（货架的正经账）。' },
        eatery:   { key: 'eatery',   name: '酒楼',     icon: '🍜', priceMul: 1.2, base: 12, desc: '请厨子定菜单——客自己上门，日进按行情走柜。' },
        inn:      { key: 'inn',      name: '客栈',     icon: '🏨', priceMul: 1.2, base: 10, desc: '接待南来北往——夜里听一屋子江湖事，房钱日结。' },
        gamble:   { key: 'gamble',   name: '赌坊',     icon: '🎲', priceMul: 1.5, base: 18, gate: { noto: 20 }, desc: '坐庄抽头，进账最厚（须恶名20——清白人家开不起赌字招牌）。' },
        broker:   { key: 'broker',   name: '委托所',   icon: '📋', priceMul: 1.0, base: 8,  desc: '跑腿寻人驱邪，什么委托都接——每日抽成之外还有零单进账。' },
        post:     { key: 'post',      name: '民信局',   icon: '✉️', priceMul: 1.0, base: 9,  desc: '代人送信送到天涯海角——信脚钱按日结柜。' },
        livery:   { key: 'livery',   name: '车马行',   icon: '🐴', priceMul: 1.1, base: 6,  desc: '租车租马给旅客——厩里每拴一头自家凡兽，多出一挂车马（每头日进+4）。' },
        ice:      { key: 'ice',      name: '冰行',     icon: '🧊', priceMul: 1.1, base: 0,  desc: '冬藏冰夏卖冰——夏日日进20、春秋10、冬日只剩4（看天吃饭的行当）。' },
        clinic:   { key: 'clinic',   name: '医馆',     icon: '🏥', priceMul: 1.2, base: 15, gate: { skill: ['医术', 40] }, desc: '坐堂问诊（须医术40）——医术越高，病家越信你的招牌。' },
        wuguan:   { key: 'wuguan',   name: '武馆',     icon: '🥋', priceMul: 1.2, base: 12, gate: { realm: 1 }, desc: '挂牌教拳收蒙徒（须筑基修为压得住场）——束脩按日结柜。' },
        fence:    { key: 'fence',    name: '销赃铺',   icon: '🌑', priceMul: 1.3, base: 16, gate: { noto: 30 }, desc: '低价收赃高价转手（须恶名30）——差役闻着味就来查抄。' },
        landlord: { key: 'landlord', name: '房东宅院', icon: '🏘️', priceMul: 1.4, base: 0, monthly: 120, desc: '买宅院出租——每月初一收租120灵石起（城望高租更旺），不用守柜。' }
    };

    // ============ v27.1 铺面专属事：每月账日一骰，至多一件；放着不管五日自过（按稳妥那条了结） ============
    // choices[0] 恒为稳妥项（过期自动走它）。effect：stones±现银 / rep±城望 / noto±恶名 / heat+热度 /
    // mul+days 盈亏系数增减与到期日；带 roll 的选项临场掷骰，win/lose 各走各的账。
    var TYPE_EVENTS = {
        eatery: [
            { id: 'eat_bawang', text: '🍜 一个大肚皮吃完了饭把桌子一拍：「记账！」——满堂客人都看着你。', choices: [
                { label: '请他出去', effect: { rep: 1 }, text: '你把吃白食的请出了门——食客们点头：这铺子有规矩。（城望+1）' },
                { label: '笑着免了', effect: { stones: -15, mul: 0.15, days: 10 }, text: '你拱手免了这一单——传出去铺子厚道，生意旺了一阵。（-15灵石，十日进账+15%）' } ] },
            { id: 'eat_laotao', text: '🍜 堂倌来报：靠窗那位客人把每道菜都只动了一筷，还一路摇头——像是吃遍四方的老饕。', choices: [
                { label: '照常待他', effect: {}, text: '老饕吃完抹抹嘴走了，什么也没说。（无事）' },
                { label: '亲自掌勺再上一席', roll: { p: 0.6, win: { mul: 0.3, days: 15, text: '老饕拍案叫绝，逢人便夸——「' + '' + '」的名声传开了。（十五日进账+30%）' }, lose: { stones: -30, text: '老饕尝了一口就搁了筷：「火候差半成。」白白搭了一席料钱。（-30灵石）' } }, text: '' } ] }
        ],
        inn: [
            { id: 'inn_taofan', text: '🏨 夜里伙计悄悄来报：西厢那位客人行李里有官府的通缉画影——画的是他自己。', choices: [
                { label: '悄悄报官', effect: { stones: 20, rep: 2 }, text: '差役天亮拿人，赏钱20灵石——街坊都说你深明大义。（城望+2）' },
                { label: '装作不知', roll: { p: 0.8, win: { text: '那人第二日一早就走了，床钱给得格外足。（无事）' }, lose: { heat: 1, text: '差役随后查到店里，把你好一顿盘问——铺子上了册。（热度+1）' } }, text: '' } ] }
        ],
        gamble: [
            { id: 'gam_laoqian', text: '🎲 庄脚来报：三号桌上那位的手法不对——袖口里有牌。', choices: [
                { label: '当场拿下', effect: { rep: 1, mul: 0.1, days: 10 }, text: '老千被剁了指头逐出门——各桌都知道这儿牌风干净。（城望+1，十日进账+10%）' },
                { label: '由他赢去', effect: { stones: -40 }, text: '你捏着鼻子认了这场输——老千赢了40灵石扬长而去。（-40灵石）' } ] }
        ],
        broker: [
            { id: 'bro_guqian', text: '📋 一个蒙面客放下只没字的木匣：「明日午时，送到城外十里亭。酬金翻倍。」', choices: [
                { label: '不接来历不明的单', effect: {}, text: '你把木匣原样请了回去——委托所的招牌，经不起糊涂账。（无事）' },
                { label: '接了', roll: { p: 0.7, win: { stones: 60, text: '木匣送到，酬金60灵石当场付清，蒙面客还多看了你一眼。（+60灵石）' }, lose: { heat: 2, text: '十里亭等来的是差役——匣里是赃证。你赔尽好话才脱身，铺子上了册。（热度+2）' } }, text: '' } ] }
        ],
        post: [
            { id: 'post_jixin', text: '✉️ 一封加急信要送边镇——路途要过两段匪患道，信脚钱给到三倍。', choices: [
                { label: '只走平安道', effect: {}, text: '急信让给了别家——平安道虽慢，人信都在。（无事）' },
                { label: '接这趟险单', roll: { p: 0.75, win: { stones: 40, text: '信脚换了两拨马，如期送到——三倍脚钱40灵石落袋。（+40灵石）' }, lose: { mul: -0.2, days: 10, text: '信脚在半道伤了腿，信也误了期——赔了不是，生意冷了一阵。（十日进账-20%）' } }, text: '' } ] }
        ],
        livery: [
            { id: 'liv_sunche', text: '🐴 还车的客人把车辕磕裂了一道口子，梗着脖子说：「取车时就有！」', choices: [
                { label: '照价索赔', effect: { stones: 25, rep: -1 }, text: '客人骂骂咧咧赔了25灵石——街面上有人说你家计较。（城望-1）' },
                { label: '认了修车', effect: { rep: 1 }, text: '你摆手放人，转头自掏钱修车——车夫们都说这家仁义，生意细水长流。（城望+1）' } ] }
        ],
        ice: [
            { id: 'ice_tajiao', text: '🧊 伙计慌慌张张来报：冰窖西角塌了一块，冷气直往外冒。', choices: [
                { label: '雇工修补', effect: { stones: -35 }, text: '三五个泥瓦匠半日补好——冰窖又严实了。（-35灵石）' },
                { label: '将就着用', effect: { mul: -0.3, days: 20 }, text: '塌角拿草席盖着——化冰比往常快了太多。（二十日进账-30%）' } ] }
        ],
        clinic: [
            { id: 'cli_wenyi', text: '🏥 城南起了时疫，街面上人心惶惶——好几家医馆都关了门。', choices: [
                { label: '关门避疫', effect: { rep: -2 }, text: '你落了门板——命要紧，可街面上都看着呢。（城望-2）' },
                { label: '支起药棚施诊', effect: { stones: -50, rep: 4, mul: 0.25, days: 15 }, text: '药材流水般出去，人一个个抬回来又走回去——疫平那日，满街的人朝你拱手。（-50灵石，城望+4，十五日进账+25%）' } ] }
        ],
        wuguan: [
            { id: 'wug_tiguan', text: '🥋 一条大汉踹开馆门，把「切磋」的拜帖拍在地上：「听闻贵馆教徒，先胜过我再说！」', choices: [
                { label: '婉言谢绝', effect: { mul: -0.1, days: 5 }, text: '大汉冷笑而去——徒弟们面上无光，走了一批。（五日进账-10%）' },
                { label: '应战', roll: { p: 0.55, win: { rep: 3, mul: 0.2, days: 15, text: '三十合后大汉抱拳认输：「好拳！」——慕名而来的徒弟排到了街口。（城望+3，十五日进账+20%）' }, lose: { rep: -1, mul: -0.15, days: 10, text: '你输了半招——大汉留了句「不过如此」扬长而去。（城望-1，十日进账-15%）' } }, text: '' } ] }
        ],
        fence: [
            { id: 'fen_anfang', text: '🌑 两个「布商」在铺子里转了三圈，眼睛却只往货底瞟——是差役暗访。', choices: [
                { label: '塞茶钱送神', effect: { stones: -40 }, text: '四十灵石「茶钱」递过去，两位「布商」空手出了门。（-40灵石）' },
                { label: '装糊涂', roll: { p: 0.5, win: { text: '你陪着绕了半天黑话，两位没寻着破绽，悻悻走了。（无事）' }, lose: { heat: 2, rep: -2, text: '柜底翻出一件赃证——铺子封了三日，你也上了册。（热度+2，城望-2）' } }, text: '' } ] }
        ],
        landlord: [
            { id: 'lan_tuoqian', text: '🏘️ 东厢的租客拖了两期房租，见面就作揖：「再宽限半月，必有厚报！」', choices: [
                { label: '请他挪窝', effect: { mul: -0.1, days: 10 }, text: '租客搬走了，新租客还没着落——宅院空了阵子。（十日进账-10%）' },
                { label: '上门催租', roll: { p: 0.7, win: { stones: 40, text: '你坐在堂上不走，租客到底凑出了40灵石——还多赔了两坛酒。（+40灵石）' }, lose: { mul: -0.2, days: 30, text: '租客连夜卷铺盖走了，屋里只剩一张欠条。（三十日进账-20%）' } }, text: '' } ] }
        ]
    };

    // 事件文案里的铺名占位补齐（老饕事件）
    try { TYPE_EVENTS.eatery[1].choices[1].roll.win.text = '老饕拍案叫绝，逢人便夸你家的席面——铺子的名声传开了。（十五日进账+30%）'; } catch (e) { console.warn('[静默失败] js/city-facilities/player-shop.js · 老饕事件文案补丁：铺子的席面夸赞那一句没写进去', e && e.message); }

    var _st = { shops: {} };    // { cityPk: {city, name, type, shelves, till, clerk, arrears, boughtDay, soldTotal, revenueTotal, incomeMul, incomeMulUntil, pendingEvent, monthSettled} }

    // ============ 小工具（黑道账同款口径） ============
    function cd() { return window.currentCharData || null; }
    function say(m, t) { try { if (window.showMessage) window.showMessage(m, t || 'info'); } catch (e) { return false; } return true; }
    function log(m, t) { try { if (window.gameLog && window.gameLog.add) window.gameLog.add(m, t || 'info'); } catch (e) { return false; } return true; }
    function city() {
        return (cd() && cd().location) ||
            (typeof window.getCurrentCityName === 'function' && window.getCurrentCityName()) || '';
    }
    function pkCity(s) { return String(s == null ? '' : s).replace(/\s+/g, ''); }
    function absDay() {
        try {
            if (window.WorldCalendar && typeof window.WorldCalendar.day === 'number' && window.WorldCalendar.day > 0) return Math.floor(window.WorldCalendar.day);
            if (typeof window.getAbsoluteDay === 'function') { var g = window.getAbsoluteDay(); if (g) return Math.floor(g); }
            if (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') { var t = window.timeSystem.getAbsoluteDay(); if (t) return Math.floor(t); }
        } catch (e) { return 0; }
        return 0;
    }
    function seedOf(s) { var h = 0; s = String(s || ''); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
    function stonesNow() {
        try {
            var DM = window.DataManager || (window.XianXia && window.XianXia.DataManager);
            if (DM && typeof DM.getSpiritStones === 'function') return Number(DM.getSpiritStones()) || 0;
        } catch (e) { console.warn('[静默失败] js/city-facilities/player-shop.js · stonesNow：现银没读到，按角色面上的数算', e && e.message); }
        var c = cd();
        return c ? (Number(c.spiritStones) || 0) : 0;
    }
    function addStones(n) {
        try {
            var DM = window.DataManager || (window.XianXia && window.XianXia.DataManager);
            if (DM && typeof DM.addSpiritStones === 'function') { DM.addSpiritStones(n); return; }
        } catch (e) { console.warn('[静默失败] js/city-facilities/player-shop.js · addStones：DataManager 正门没走通，落回角色字段', e && e.message); }
        var c = cd();
        if (c) c.spiritStones = (Number(c.spiritStones) || 0) + n;
    }
    function deductStones(n) {
        try {
            var DM = window.DataManager || (window.XianXia && window.XianXia.DataManager);
            if (DM && typeof DM.deductSpiritStones === 'function') return !!DM.deductSpiritStones(n);
        } catch (e) { console.warn('[静默失败] js/city-facilities/player-shop.js · deductStones：DataManager 正门没走通，落回角色字段', e && e.message); }
        var c = cd();
        if (c && (Number(c.spiritStones) || 0) >= n) { c.spiritStones -= n; return true; }
        return false;
    }
    function repValue(ct) {
        try { if (typeof window.getReputationValue === 'function') return Number(window.getReputationValue(ct)) || 0; } catch (e) { console.warn('[静默失败] js/city-facilities/player-shop.js · repValue：城望没读出来，按零点算', e && e.message); }
        return 0;
    }
    function repDown(n) {
        var ct = city();
        if (!ct || typeof window.reduceReputation !== 'function') return false;
        try { window.reduceReputation(ct, n); return true; } catch (e) { console.warn('[静默失败] js/city-facilities/player-shop.js · repDown：城望没扣成', e && e.message); return false; }
    }
    function repUp(ct, n) {
        try { if (typeof window.addReputation === 'function') { window.addReputation(ct, n); return true; } } catch (e) { console.warn('[静默失败] js/city-facilities/player-shop.js · repUp：城望没加上', e && e.message); }
        return false;
    }
    function deed(mood, s) {
        try { if (typeof window.playerPushDeed === 'function') window.playerPushDeed(mood, s); } catch (e) { console.warn('[静默失败] js/city-facilities/player-shop.js · deed：风声没递进传闻池', e && e.message); }
    }
    function advance(min, why) {
        try { if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') window.timeSystem.advanceTime(min, why); } catch (e) { console.warn('[静默失败] js/city-facilities/player-shop.js · advance：时辰没扣成', e && e.message); }
    }
    function refresh() {
        try { if (window.updateCharacterStatus) window.updateCharacterStatus(); } catch (e) { console.warn('[静默失败] js/city-facilities/player-shop.js · refresh：面板没刷新', e && e.message); }
        try { if (typeof window.updateCurrencyUI === 'function') window.updateCurrencyUI(); } catch (e2) { console.warn('[静默失败] js/city-facilities/player-shop.js · refresh：钱袋没刷新', e2 && e2.message); }
    }
    function addHeat(n, why, opts) {
        try { if (window.NpcCrime && typeof window.NpcCrime.addHeat === 'function') window.NpcCrime.addHeat(n, why, opts); } catch (e) { console.warn('[静默失败] js/city-facilities/player-shop.js · addHeat：热度没记进通缉账', e && e.message); }
    }
    function shopOkCity(ct) {
        try {
            var d = window.locationSystem && window.locationSystem.getCityData && window.locationSystem.getCityData(ct);
            if (!d || !d.buildings) return false;
            return d.buildings.indexOf('shop') >= 0;
        } catch (e) { console.warn('[静默失败] js/city-facilities/player-shop.js · shopOkCity：城里有没有铺面没问清，按没有算', e && e.message); return false; }
    }
    function notoNow() { var c = cd(); return c ? (Number(c.notoriety) || 0) : 0; }

    // ============ v27.1 类型表小工具 ============
    function dice() { return (typeof window.__scenarioRng === 'function') ? window.__scenarioRng() : Math.random(); }
    function realmIdxNow() {
        try {
            var r = cd() && cd().realm;
            if (r && typeof window.getRealmIndex === 'function') { var i = window.getRealmIndex(r); if (i > 0) return i; }
        } catch (e) { console.warn('[静默失败] js/city-facilities/player-shop.js · realmIdxNow：境界那本账没问成，按凡人算', e && e.message); }
        return 0;
    }
    function lifeSkillLv(n) {
        try { return (typeof window.getLifeSkill === 'function') ? (Number(window.getLifeSkill(n)) || 0) : 0; } catch (e) { return 0; }
    }
    function mundaneCount() {
        try { return (typeof window.mundaneBeastCount === 'function') ? (Number(window.mundaneBeastCount()) || 0) : 0; } catch (e) { return 0; }
    }
    function seasonNow() {
        try { return (window.timeSystem && window.timeSystem.gameTime && window.timeSystem.gameTime.currentSeason) || 'spring'; } catch (e) { return 'spring'; }
    }
    function faceKnownNow() {
        try { return !!(window.NpcCrime && window.NpcCrime.faceKnown && window.NpcCrime.faceKnown()); } catch (e) { return false; }
    }
    function monthIdx() { return Math.floor(absDay() / 30); }
    function typeOf(s) { return SHOP_TYPES[s && s.type] ? SHOP_TYPES[s.type] : SHOP_TYPES.general; }
    // 门槛：够不着的招牌如实说人话（明账）
    function typeGateFail(t) {
        if (!t || !t.gate) return null;
        if (t.gate.noto != null && notoNow() < t.gate.noto) return '恶名不足 ' + t.gate.noto + '（现 ' + notoNow() + '）——清白人家挂不起这块招牌。';
        if (t.gate.realm != null && realmIdxNow() < t.gate.realm) return '修为不到筑基——压不住这块招牌。';
        if (t.gate.skill) {
            var lv = lifeSkillLv(t.gate.skill[0]);
            if (lv < t.gate.skill[1]) return t.gate.skill[0] + '不足 ' + t.gate.skill[1] + '（现 ' + lv + '）——手艺骗不了人。';
        }
        return null;
    }
    // 大掌柜与分号：手底下有一位大掌柜（手艺四成、柜上熬满三十日），才照应得开第三、四间铺子
    function anyHeadClerk() {
        var keys = Object.keys(_st.shops);
        for (var i = 0; i < keys.length; i++) {
            var s = _st.shops[keys[i]];
            if (s && s.clerk && s.clerk.head) return true;
        }
        return false;
    }
    function shopCap() { return anyHeadClerk() ? CFG.BRANCH_SHOPS : CFG.MAX_SHOPS; }
    // 自动营生的日进账（杂货铺走货架老账，不进这里）
    function autoIncomeBase(s) {
        var t = typeOf(s);
        switch (t.key) {
            case 'ice': {
                var se = seasonNow();
                return se === 'summer' ? 20 : se === 'winter' ? 4 : 10;
            }
            case 'livery': return t.base + 4 * mundaneCount();
            case 'broker': return t.base + 5 * Math.floor(dice() * 3);   // 每日 0~2 单零活
            case 'clinic': return t.base + Math.floor(lifeSkillLv('医术') / 20);   // 医术每20点多一位病家信你
            case 'landlord': return 0;   // 房东收租走月账，不走日进
            default: return t.base;
        }
    }

    // 公道价（物品登记价）
    function fairPrice(itemId) {
        try {
            var t = window.itemById && window.itemById[itemId];
            if (t && Number(t.price) > 0) return Math.max(1, Math.round(Number(t.price)));
        } catch (e) { console.warn('[静默失败] js/city-facilities/player-shop.js · fairPrice：公道价没查着，按十灵石兜底', e && e.message); }
        return 10;
    }
    function itemName(itemId) {
        try { var t = window.itemById && window.itemById[itemId]; if (t && t.name) return String(t.name); } catch (e) { console.warn('[静默失败] js/city-facilities/player-shop.js · itemName：货名没查着', e && e.message); }
        return itemId;
    }
    function itemIcon(itemId) {
        try { var t = window.itemById && window.itemById[itemId]; if (t && t.icon) return String(t.icon); } catch (e) { console.warn('[静默失败] js/city-facilities/player-shop.js · itemIcon：货样没查着', e && e.message); }
        return '📦';
    }
    // 黑货（special 类）在恶名之身手里反而抢手——道上的人认得这块招牌
    function isContraband(itemId) {
        try { var t = window.itemById && window.itemById[itemId]; return !!(t && t.category === 'special'); } catch (e) { console.warn('[静默失败] js/city-facilities/player-shop.js · isContraband：货路没认出来，按正经货算', e && e.message); return false; }
    }

    function shopCount() { return Object.keys(_st.shops).length; }
    function shopHere() { return _st.shops[pkCity(city())] || null; }
    function shopAt(pk) { return _st.shops[pk] || null; }

    // ============ ① 盘铺面 ============
    function shopPrice(ct) {
        var seedPart = seedOf(pkCity(ct) + '_shop') % (CFG.SEED_PRICE_MAX + 1);
        return CFG.BASE_PRICE + Math.max(0, repValue(ct)) * CFG.REP_PRICE_MUL + seedPart;
    }

    function buyShop(typeKey) {
        var c = cd();
        if (!c) { say('请先创建角色。', 'warning'); return false; }
        var t = SHOP_TYPES[String(typeKey || 'general')] || SHOP_TYPES.general;
        var ct = city();
        if (!ct || !shopOkCity(ct)) { say('🏪 这地界没有挂牌的铺面可盘——荒山野外开不了张。', 'info'); return false; }
        var pk = pkCity(ct);
        if (_st.shops[pk]) { say('🏪 你在' + ct + '已经有一间铺子了。', 'info'); return false; }
        if (shopCount() >= shopCap()) {
            say(shopCap() >= CFG.BRANCH_SHOPS
                ? '🏪 四城的铺子已经照应到头了——再多盘一间，大掌柜都要跑空。'
                : '🏪 两城的铺子已经照应不过来了——想开分号，先把手底下哪位伙计熬成大掌柜（手艺四成、柜上满三十日）。', 'warning');
            return false;
        }
        var gateFail = typeGateFail(t);
        if (gateFail) { say('🏪 ' + t.icon + ' ' + t.name + '：' + gateFail, 'warning'); return false; }
        var price = Math.round(shopPrice(ct) * (t.priceMul || 1));
        if (stonesNow() < price) { say('🏪 这间' + t.name + '铺面要 ' + price + ' 灵石（底价×行当系数＋城望抬价＋地段），你手头不足。', 'warning'); return false; }
        if (!deductStones(price)) { say('🏪 灵石没能划出去——中人把契书又收了回去。', 'warning'); return false; }
        advance(60, '盘铺面');
        _st.shops[pk] = {
            city: ct, name: '', type: t.key, shelves: [], till: 0, clerk: null, arrears: 0,
            boughtDay: absDay(), soldTotal: 0, revenueTotal: 0,
            incomeMul: 1, incomeMulUntil: 0, pendingEvent: null, monthSettled: monthIdx()
        };
        deed('good', '你在' + ct + '盘下一间' + t.name + '当了掌柜——街面上都来道贺');
        log('🏪 中人画押、契书过户——' + ct + '临街的一间' + t.name + '铺面归了你（' + price + ' 灵石）。' + (t.key === 'general' ? '挂招牌、上架、雇伙计，都在「我的铺子」里。' : '这门营生日进有明账（基础 ' + t.base + ' 灵石×伙计×城望），挂招牌、雇伙计，都在「我的铺子」里。'), 'success');
        say('🏪 ' + t.icon + ' ' + t.name + '盘下了（' + price + ' 灵石）！先给它起个字号' + (t.key === 'general' ? '，再上架头一批货' : '，雇个伙计就能天天开门') + '。', 'success');
        refresh();
        open();
        return true;
    }

    function rename(name) {
        var s = shopHere();
        if (!s) { say('🏪 你在这座城没有铺子。', 'info'); return false; }
        var nm = String(name || '').replace(/[<>"'&]/g, '').trim().slice(0, 12);
        if (!nm) { say('🏪 招牌总得有个字号——空白的木牌挂出去，街面要笑话的。', 'warning'); return false; }
        s.name = nm;
        log('🏪 木牌重新描了金——「' + nm + '」的招牌挂上了' + s.city + '的街面。', 'success');
        say('🏪 「' + nm + '」——招牌挂上了。', 'success');
        open();
        return true;
    }

    // ============ ② 上架 / 调价 / 下柜 ============
    function stock(itemId, n) {
        var s = shopHere();
        if (!s) { say('🏪 你在这座城没有铺子。', 'info'); return false; }
        if (s.shelves.length >= CFG.SHELF_MAX) { say('🏪 货架满八样了——先下掉一样再上新的。', 'warning'); return false; }
        var id = String(itemId || '');
        var want = Math.max(1, Math.min(CFG.PER_STACK_MAX, Math.floor(Number(n) || 1)));
        if (!window.itemById || !window.itemById[id]) { say('🏪 行囊里没有这种货。', 'info'); return false; }
        // 行囊真扣（槽位 uid 制）：扣不动就不上架，不吞货
        var got = 0;
        try {
            if (typeof window.removeItem !== 'function') { say('🏪 行囊的账动不了——货上不了架。', 'warning'); return false; }
            var slots = (window.inventory && Array.isArray(window.inventory.slots)) ? window.inventory.slots : [];
            for (var i = 0; i < slots.length && got < want; i++) {
                var sl = slots[i];
                if (!sl || sl.templateId !== id) continue;
                var take = Math.min(want - got, Number(sl.count) || 0);
                if (take > 0) { window.removeItem(sl.uid, take); got += take; }
            }
        } catch (e) { console.warn('[静默失败] js/city-facilities/player-shop.js · stock：行囊没能扣动，这批货没上架', e && e.message); }
        if (got <= 0) { say('🏪 行囊里点不出「' + itemName(id) + '」——上不了架。', 'info'); return false; }
        var fair = fairPrice(id);
        s.shelves.push({ itemId: id, name: itemName(id), icon: itemIcon(id), price: Math.max(1, Math.round(fair * CFG.DEFAULT_MARKUP)), count: got, fair: fair });
        advance(10, '上架');
        log('🏪 「' + itemName(id) + '」×' + got + ' 上了货架（默认价 ' + Math.round(fair * CFG.DEFAULT_MARKUP) + ' 灵石＝公道价 ' + fair + ' 上浮三成——调价随意，定高了没人买）。', 'info');
        say('🏪 上架成功：「' + itemName(id) + '」×' + got + '。', 'success');
        refresh();
        open();
        return true;
    }

    function priceStep(idx, dir) {
        var s = shopHere();
        if (!s || !s.shelves[idx]) { say('🏪 架上没这样货。', 'info'); return false; }
        var row = s.shelves[idx];
        var next = dir > 0 ? Math.ceil(row.price * 1.15) : Math.floor(row.price / 1.15);
        next = Math.max(Math.round(row.fair * CFG.PRICE_MIN_MUL), Math.min(Math.round(row.fair * CFG.PRICE_MAX_MUL), next));
        if (next === row.price) { say('🏪 价到头了——再' + (dir > 0 ? '高就没人买' : '低就亏穿底') + '。', 'info'); return false; }
        row.price = next;
        open();
        return true;
    }

    function unstock(idx) {
        var s = shopHere();
        if (!s || !s.shelves[idx]) { say('🏪 架上没这样货。', 'info'); return false; }
        var row = s.shelves[idx];
        var back = null;
        try {
            if (typeof window.giveWithReceipt === 'function') back = window.giveWithReceipt(row.itemId, row.count, { quiet: true });
            else if (typeof window.addItem === 'function') back = { got: Number(window.addItem(row.itemId, row.count)) || 0 };
        } catch (e) { console.warn('[静默失败] js/city-facilities/player-shop.js · unstock：货没能收回行囊', e && e.message); }
        if (!back || !(Number(back.got) > 0)) {
            // DES-86/90 同口径：收不回去的原因吃回执实话（addItemFailPhraseFor 从句支），不许站点自己断言满包
            var 由头 = '';
            try { if (typeof window.addItemFailPhraseFor === 'function') 由头 = window.addItemFailPhraseFor(back && back.reason, row.name) || ''; } catch (ePh) { console.warn('[静默失败] js/city-facilities/player-shop.js · unstock：收不回去的回执没读出来，按中性话说', ePh && ePh.message); }
            say('🏪 「' + row.name + '」没能收回行囊' + (由头 ? '：' + 由头 : '') + '——先留在架上（货不蒸发）。', 'warning');
            return false;
        }
        var gotN = Number(back.got);
        row.count -= gotN;
        if (row.count <= 0) s.shelves.splice(idx, 1);
        say('🏪 「' + row.name + '」×' + gotN + ' 收回行囊。', 'success');
        open();
        return true;
    }

    // ============ ③ 雇伙计 ============
    function clerkCandidates() {
        var ct = city();
        var h = seedOf(pkCity(ct) + '_clerk_' + absDay());
        var out = [];
        for (var i = 0; i < 3; i++) {
            var sk = 1 + ((h >> (i * 3)) % 5);
            out.push({
                name: CLERK_NAMES[(h >> (i * 2 + 1)) % CLERK_NAMES.length],
                skill: sk,
                hire: CFG.CLERK_HIRE_BASE + sk * CFG.CLERK_HIRE_PER_SKILL,
                wage: sk
            });
        }
        return out;
    }

    function hireClerk(candIdx) {
        var s = shopHere();
        if (!s) { say('🏪 你在这座城没有铺子。', 'info'); return false; }
        if (s.clerk) { say('🏪 「' + s.clerk.name + '」还在柜上呢——要换人，先辞了 TA（辞工不退安家钱）。', 'warning'); return false; }
        var cands = clerkCandidates();
        var cand = cands[Math.floor(Number(candIdx))];
        if (!cand) { say('🏪 今日人市上没有这号人。', 'info'); return false; }
        if (stonesNow() < cand.hire) { say('🏪 「' + cand.name + '」的安家钱要 ' + cand.hire + ' 灵石，你手头不足。', 'warning'); return false; }
        if (!deductStones(cand.hire)) { say('🏪 安家钱没能划出去。', 'warning'); return false; }
        s.clerk = { name: cand.name, skill: cand.skill, wage: cand.wage };
        s.arrears = 0;
        log('🏪 「' + cand.name + '」收了安家钱（' + cand.hire + ' 灵石），在柜上系了围裙——手艺 ' + cand.skill + ' 成，工钱每日 ' + cand.wage + ' 灵石（从柜上支；柜上没钱欠着，欠满 ' + CFG.CLERK_ARREARS_QUIT + ' 日就辞工）。铺子从此天天开门。', 'success');
        say('🏪 伙计「' + cand.name + '」上工了——铺子天天开门，销率看 TA 的手艺。', 'success');
        refresh();
        open();
        return true;
    }

    function fireClerk() {
        var s = shopHere();
        if (!s || !s.clerk) { say('🏪 柜上没人可辞。', 'info'); return false; }
        var nm = s.clerk.name;
        s.clerk = null;
        s.arrears = 0;
        log('🏪 你结了「' + nm + '」的工钱，把围裙收了回来——铺子往后只有你在城里才开门。', 'info');
        say('🏪 「' + nm + '」走了。没伙计的日子，只有你人在城里铺子才开，销率还打对折。', 'info');
        open();
        return true;
    }

    // ============ ④ 每日开市结算（新日正门） ============
    function saleRate(shelf, s, playerHere) {
        var ratio = shelf.price / Math.max(1, shelf.fair);
        var priceMul = ratio <= 1.0 ? 1.5 : ratio <= 1.3 ? 1.15 : ratio <= 1.6 ? 0.7 : ratio <= 2.2 ? 0.3 : 0.08;
        var clerkMul = s.clerk ? (0.6 + s.clerk.skill * 0.15) : (playerHere ? CFG.SOLO_SHOP_MUL : 0);
        var repMul = 1 + Math.max(0, repValue(s.city)) / 400;
        var notoMul = 1;
        if (isContraband(shelf.itemId) && notoNow() >= 30) notoMul = 1.5;   // 黑货配恶名——道上的人认这块招牌
        return Math.max(0, Math.min(0.85, CFG.SALE_BASE * priceMul * clerkMul * repMul * notoMul));
    }

    function dailySettle(rng) {
        var keys = Object.keys(_st.shops);
        var rnd = (typeof rng === 'function') ? rng : Math.random;
        for (var k = 0; k < keys.length; k++) {
            var s = _st.shops[keys[k]];
            var t = typeOf(s);
            var playerHere = pkCity(city()) === keys[k];
            // v27.1 盈亏系数到期归一 + 铺面事过期自动了结（绝不追着玩家）
            if (s.incomeMulUntil && absDay() >= s.incomeMulUntil) { s.incomeMul = 1; s.incomeMulUntil = 0; }
            expireEvent(s);
            var openToday = !!s.clerk || playerHere;
            if (openToday) {
                var soldLines = [];
                var earned = 0;
                if (t.key === 'general') {
                    // ---- 杂货铺：货架老账，一字未动 ----
                    for (var i = s.shelves.length - 1; i >= 0; i--) {
                        var row = s.shelves[i];
                        var rate = saleRate(row, s, playerHere);
                        var sold = 0;
                        for (var tt = 0; tt < Math.min(row.count, CFG.SALE_PER_ITEM_CAP); tt++) {
                            if (rnd() < rate) sold++;
                        }
                        if (sold > 0) {
                            row.count -= sold;
                            var rev = sold * row.price;
                            earned += rev;
                            s.soldTotal = (Number(s.soldTotal) || 0) + sold;
                            s.revenueTotal = (Number(s.revenueTotal) || 0) + rev;
                            soldLines.push('「' + row.name + '」×' + sold + '（+' + rev + '）');
                            if (row.count <= 0) s.shelves.splice(i, 1);
                        }
                    }
                    // 街面小事（只对有货架的铺子）
                    if (s.shelves.length > 0 && rnd() < CFG.EVENT_P) {
                        var ev = rnd();
                        if (ev < 0.4) {
                            if (rnd() < 0.5) {
                                var cheap = 0;
                                for (var ci = 1; ci < s.shelves.length; ci++) if (s.shelves[ci].price < s.shelves[cheap].price) cheap = ci;
                                var lost = s.shelves[cheap];
                                log('🏪 打盹的功夫，柜上少了「' + lost.name + '」一件——街面上手快的贼。（丢了最便宜的一件，下回雇个伙计看着）', 'warning');
                                lost.count -= 1;
                                if (lost.count <= 0) s.shelves.splice(cheap, 1);
                            } else {
                                repUp(s.city, 1);
                                log('🏪 一个扒手刚摸上货架就被你（或伙计）当场按住，扭送街亭——街坊都夸「' + (s.name || '你的铺子') + '」利落。（' + s.city + '声望+1）', 'success');
                            }
                        } else if (ev < 0.7) {
                            var bi = Math.floor(rnd() * s.shelves.length);
                            var bulk = s.shelves[bi];
                            var bn = Math.min(CFG.BULK_N, bulk.count);
                            var brev = Math.round(bn * bulk.price * CFG.BULK_DISC);
                            bulk.count -= bn;
                            s.till += brev;
                            s.soldTotal = (Number(s.soldTotal) || 0) + bn;
                            s.revenueTotal = (Number(s.revenueTotal) || 0) + brev;
                            log('🏪 一位老主顾把「' + bulk.name + '」一次包圆了 ' + bn + ' 件（九折，+' + brev + ' 灵石）：「下回还来你这儿。」', 'success');
                            if (bulk.count <= 0) s.shelves.splice(bi, 1);
                        } else {
                            log('🏪 今日铺子里人来人往，没什么大事——柜上的算盘声听着就踏实。', 'info');
                        }
                    }
                } else {
                    // ---- v27.1 自动营生：铺面自己会挣钱（基础 × 伙计 × 城望 × 盈亏）----
                    var base = autoIncomeBase(s);
                    var clerkMul = s.clerk ? (0.6 + s.clerk.skill * 0.15) : (playerHere ? CFG.SOLO_SHOP_MUL : 0);
                    var repMul = 1 + Math.max(0, repValue(s.city)) / 400;
                    earned = Math.round(base * clerkMul * repMul * (Number(s.incomeMul) || 1));
                    if (earned > 0) {
                        s.soldTotal = (Number(s.soldTotal) || 0) + 1;
                        s.revenueTotal = (Number(s.revenueTotal) || 0) + earned;
                        soldLines.push(t.icon + t.name + '营生（+' + earned + '）');
                    }
                }
                // 税吏抽分（只抽当日销款——柜上存银不重复抽）；画像档通缉之身，税吏多看你招牌两眼
                var tax = 0;
                if (earned > 0) {
                    tax = Math.floor(earned * CFG.TAX_FRAC);
                    var faceFlag = faceKnownNow();
                    if (faceFlag) {
                        tax += 5;
                        addHeat(1, '税吏查铺认出了招牌');
                        log('🏪 税吏来抽分，盯着招牌看了半晌，又对照怀里的一张画影——多收了五灵石「酒钱」才走。（你的铺子替你把脸又亮了一回，热度+1）', 'warning');
                    }
                }
                s.till = Math.max(0, s.till + earned - tax);
                // v27.1 销赃铺的查抄账：差役闻着味就来（画像档之身来得更勤）——柜上抄走三成、热度+1、城望−3
                if (t.key === 'fence' && rnd() < (faceKnownNow() ? 0.06 : 0.03)) {
                    var seized = Math.floor(s.till * 0.3);
                    s.till -= seized;
                    addHeat(1, '销赃铺被差役查抄');
                    repDown(3);
                    log('🌑 差役封了半日门，柜上被抄走 ' + seized + ' 灵石——街坊看着封条指指点点。（热度+1，城望-3。这行当的风险，开张那日就写在契上了）', 'warning');
                }
                // 工钱：柜上支；欠三日辞工
                if (s.clerk) {
                    if (s.till >= s.clerk.wage) { s.till -= s.clerk.wage; s.arrears = 0; }
                    else {
                        s.arrears = (Number(s.arrears) || 0) + 1;
                        if (s.arrears >= CFG.CLERK_ARREARS_QUIT) {
                            log('🏪 柜上连「' + s.clerk.name + '」的工钱都支不出了——欠了 ' + s.arrears + ' 日，TA 把围裙往柜上一放：「东家，另请高明吧。」', 'warning');
                            s.clerk = null;
                            s.arrears = 0;
                        }
                    }
                    // v27.1 柜上资历：熬大掌柜的本钱（在一天工记一天）
                    if (s.clerk) s.clerk.days = (Number(s.clerk.days) || 0) + 1;
                }
                if (soldLines.length > 0) {
                    log('🏪 ' + (s.name ? '「' + s.name + '」' : s.city + '的' + t.name) + '今日开市：' + soldLines.join('、') + (tax > 0 ? '；税吏抽了 ' + tax + ' 灵石' : '') + '。柜上现有 ' + s.till + ' 灵石' + (s.clerk ? '（「' + s.clerk.name + '」工钱已支）' : '') + '。', 'success');
                }
            }
            // ---- v27.1 月账：房东收租 + 每月至多一件铺面专属事 ----
            if (monthIdx() > (Number(s.monthSettled) || 0)) {
                s.monthSettled = monthIdx();
                if (t.monthly) {
                    var rentMul = 1 + Math.max(0, repValue(s.city)) / 400;
                    var rent = Math.round(t.monthly * rentMul * (Number(s.incomeMul) || 1));
                    s.till += rent;
                    s.revenueTotal = (Number(s.revenueTotal) || 0) + rent;
                    log('🏘️ 初一收租日：' + (s.name ? '「' + s.name + '」' : '你的宅院') + '各家租户把租钱凑齐送来——' + rent + ' 灵石入柜（城望高，租也旺）。', 'success');
                }
                if (!s.pendingEvent && TYPE_EVENTS[t.key] && TYPE_EVENTS[t.key].length && rnd() < CFG.EVENT_MONTH_P) {
                    var pool = TYPE_EVENTS[t.key];
                    var pick = pool[Math.floor(rnd() * pool.length)];
                    s.pendingEvent = { id: pick.id, day: absDay() };
                    log('🏪 ' + (s.name ? '「' + s.name + '」' : t.name) + '里出了桩事——进「我的铺子」看看，五日不管就按稳妥章程了结了。', 'warning');
                }
            }
        }
    }

    // ============ v27.1 铺面专属事：了结 / 过期 / 玩家应选 ============
    function findEvent(s) {
        if (!s || !s.pendingEvent) return null;
        var pool = TYPE_EVENTS[typeOf(s).key] || [];
        for (var i = 0; i < pool.length; i++) if (pool[i].id === s.pendingEvent.id) return pool[i];
        return null;
    }
    // 一笔效果账落下去（stones±/rep±/noto±/heat/mul+days）
    function applyEffect(s, eff) {
        if (!eff) return;
        if (eff.stones > 0) addStones(eff.stones);
        if (eff.stones < 0) deductStones(-eff.stones);
        if (eff.rep > 0) repUp(s.city, eff.rep);
        if (eff.rep < 0) repDown(-eff.rep);
        if (eff.noto && cd()) {
            cd().notoriety = Math.max(0, (Number(cd().notoriety) || 0) + eff.noto);
            // v27.13 恶名分城：直写后同步记进世界账簿（铺面风波从所在城往外传）
            try { if (window.WorldLedger && typeof window.WorldLedger.noteNotorietyChange === 'function') window.WorldLedger.noteNotorietyChange(eff.noto); } catch (eWN5) {}
        }
        if (eff.heat > 0) addHeat(eff.heat, '铺面事件');
        if (eff.mul) {
            var m = (Number(s.incomeMul) || 1) + eff.mul;
            s.incomeMul = Math.max(CFG.INCOME_MUL_MIN, Math.min(CFG.INCOME_MUL_MAX, Math.round(m * 100) / 100));
            s.incomeMulUntil = Math.max(Number(s.incomeMulUntil) || 0, absDay() + (eff.days || 10));
        }
        refresh();
    }
    // 一条选项要花多少钱（含骰子两头）——钱不够不让选，事留着
    function choiceCost(ch) {
        var worst = 0;
        function look(e) { if (e && e.stones < 0) worst = Math.max(worst, -e.stones); }
        look(ch.effect);
        if (ch.roll) { look(ch.roll.win); look(ch.roll.lose); }
        return worst;
    }
    // 了结：ci=选项序；silent=过期自动了结（走稳妥的 choices[0]，只落账不弹窗）
    function resolveEvent(s, ci, silent) {
        var ev = findEvent(s);
        s.pendingEvent = null;
        if (!ev) return '';
        var ch = ev.choices[Math.max(0, Math.min(ev.choices.length - 1, Math.floor(Number(ci) || 0)))];
        var eff = ch.effect || {};
        var outText = ch.text || '';
        if (ch.roll) {
            var win = dice() < ch.roll.p;
            var br = win ? ch.roll.win : ch.roll.lose;
            applyEffect(s, br || {});
            outText = (br && br.text) || (win ? '事办了个漂亮。' : '事没办漂亮。');
        } else {
            applyEffect(s, eff);
        }
        var who = (s.name ? '「' + s.name + '」' : s.city + '的' + typeOf(s).name);
        if (silent) log('🏪 ' + who + '那桩事放着五日没人管——柜上按稳妥章程自己了结了：' + outText, 'info');
        else log('🏪 ' + who + '：' + outText, 'info');
        return outText;
    }
    function expireEvent(s) {
        if (!s || !s.pendingEvent) return;
        if (absDay() - (Number(s.pendingEvent.day) || 0) > CFG.EVENT_EXPIRE_DAYS) resolveEvent(s, 0, true);
    }
    // 玩家在牌面上应选（只应本城铺子的事）
    function eventChoice(ci) {
        var s = shopHere();
        if (!s || !s.pendingEvent) { say('🏪 铺子里眼下没有等着拿主意的事。', 'info'); return false; }
        var ev = findEvent(s);
        if (!ev) { s.pendingEvent = null; return false; }
        var ch = ev.choices[ci];
        if (!ch) return false;
        var cost = choiceCost(ch);
        if (cost > 0 && stonesNow() < cost) { say('🏪 这条章程要打点现银（最多 ' + cost + ' 灵石）——手头不够，事还留着，先去凑钱。', 'warning'); return false; }
        var out = resolveEvent(s, ci, false);
        say('🏪 ' + out, 'info');
        open();
        return true;
    }

    // ============ v27.1 大掌柜：伙计熬资历，手艺四成、柜上满三十日，东家亲自递围裙 ============
    function promoteHeadClerk() {
        var s = shopHere();
        if (!s || !s.clerk) { say('🏪 柜上没人可提拔。', 'info'); return false; }
        if (s.clerk.head) { say('🏪 「' + s.clerk.name + '」已是大掌柜了。', 'info'); return false; }
        if (s.clerk.skill < CFG.HEAD_SKILL) { say('🏪 「' + s.clerk.name + '」手艺才 ' + s.clerk.skill + ' 成——大掌柜得四成起（手艺是人市上带来的底子，提拔拔不出手艺）。', 'warning'); return false; }
        var days = Number(s.clerk.days) || 0;
        if (days < CFG.HEAD_DAYS) { say('🏪 「' + s.clerk.name + '」柜上才熬了 ' + days + ' 日——大掌柜得满 ' + CFG.HEAD_DAYS + ' 日，资历熬人。', 'warning'); return false; }
        s.clerk.head = true;
        s.clerk.wage = (Number(s.clerk.wage) || 1) + 2;
        deed('good', '你把「' + s.clerk.name + '」提拔成了大掌柜——街面上说你会用人');
        log('🏪 你亲手给「' + s.clerk.name + '」换上了大掌柜的长围裙（日薪+2）——从此你名下开得分号（至多掌 ' + CFG.BRANCH_SHOPS + ' 城）。TA 拱手：「东家放心，铺子交给我。」', 'success');
        say('🏪 「' + s.clerk.name + '」升任大掌柜——分号的路开了（至多掌 ' + CFG.BRANCH_SHOPS + ' 城）。', 'success');
        open();
        return true;
    }

    // ============ ⑤ 收柜 / 牌面 ============
    function collect(pk) {
        var s = _st.shops[pkCity(pk || city())];
        if (!s) { say('🏪 这座城你没有铺子。', 'info'); return false; }
        if (s.till <= 0) { say('🏪 柜上是空的——没什么可收的。', 'info'); return false; }
        var amt = s.till;
        s.till = 0;
        addStones(amt);
        log('🏪 你打开钱匣清点：' + amt + ' 灵石入了钱袋。（这间铺子开张以来累计走了 ' + s.soldTotal + ' 件货、进了 ' + s.revenueTotal + ' 灵石）', 'success');
        say('🏪 柜上 ' + amt + ' 灵石收进钱袋。', 'success');
        refresh();
        open();
        return true;
    }

    function open() {
        var c = cd();
        if (!c) { say('请先创建角色。', 'warning'); return false; }
        var ct = city();
        if (!ct) { say('🏪 你在荒郊野外——先进城再看铺子。', 'info'); return false; }
        var btn = 'class="w-full p-3 rounded mb-2 text-left text-sm text-white hover:opacity-90"';
        var html = '';
        var s = shopHere();
        if (!s) {
            // ---- v27.1 盘铺面先选行当：一门营生一行明账 ----
            var canBuy = shopOkCity(ct) && shopCount() < shopCap();
            html += '<p class="text-sm text-gray-400 mb-2">' + ct + (shopOkCity(ct) ? '临街有间铺面正在出盘——中人抱着契书在茶棚里等你：「客官想做哪一行？」' : '没有挂牌的铺面可盘（有商铺的城才有）。') + '</p>';
            if (canBuy) {
                html += '<p class="text-xs text-gray-500 mb-2">铺价＝底价 ' + CFG.BASE_PRICE + '×行当系数＋城望抬价＋地段 · 眼下至多掌 ' + shopCap() + ' 城' + (shopCap() < CFG.BRANCH_SHOPS ? '（把伙计熬成大掌柜，才开得分号）' : '') + '</p>';
                var TYPE_ORDER = ['general', 'eatery', 'inn', 'post', 'broker', 'livery', 'ice', 'clinic', 'wuguan', 'landlord', 'gamble', 'fence'];
                for (var ti = 0; ti < TYPE_ORDER.length; ti++) {
                    var t = SHOP_TYPES[TYPE_ORDER[ti]];
                    var tp = Math.round(shopPrice(ct) * (t.priceMul || 1));
                    var gf = typeGateFail(t);
                    var afford = stonesNow() >= tp;
                    html += '<button onclick="window.PlayerShop.buyShop(\'' + t.key + '\')" ' + btn.replace('p-3', (gf || !afford) ? 'bg-gray-800 p-3' : 'bg-amber-900 p-3') + '>'
                        + t.icon + ' <span class="font-bold">' + t.name + '</span> <span class="text-xs text-amber-300">' + tp + ' 灵石</span>'
                        + '<span class="block text-xs text-gray-400">' + t.desc + '</span>'
                        + (gf ? '<span class="block text-xs text-red-400">' + gf + '</span>' : (!afford ? '<span class="block text-xs text-gray-500">手头灵石不足</span>' : ''))
                        + '</button>';
                }
            } else if (shopCount() >= shopCap()) {
                html += '<p class="text-xs text-gray-500">' + (shopCap() >= CFG.BRANCH_SHOPS ? '四城的铺子已到顶——照应不过来了。' : '两城的铺子已到顶——想开分号，先把手底下哪位伙计熬成大掌柜（手艺四成、柜上满三十日）。') + '</p>';
            }
        } else {
            var st = typeOf(s);
            html += '<p class="text-sm text-gray-300 mb-2">' + st.icon + ' <span class="text-amber-300 font-bold">' + (s.name || '（没挂招牌）') + '</span> <span class="text-xs text-gray-500">' + st.name + '</span> · ' + s.city + ' —— 柜上存着 <span class="text-amber-300">' + s.till + '</span> 灵石，累计进账 ' + (Number(s.revenueTotal) || 0) + ' 灵石' + (st.key === 'general' ? '、走了 ' + s.soldTotal + ' 件货' : '') + '。' +
                (s.clerk ? (s.clerk.head ? '大掌柜' : '伙计') + '「' + s.clerk.name + '」（手艺 ' + s.clerk.skill + '，日薪 ' + s.clerk.wage + '）看着柜，天天开门。' : '<span class="text-gray-500">没雇伙计——只有你在城里才开门，营生还打对折。</span>') +
                ((Number(s.incomeMul) || 1) !== 1 ? ' <span class="text-xs ' + (s.incomeMul > 1 ? 'text-emerald-400' : 'text-red-400') + '">盈亏×' + Number(s.incomeMul).toFixed(2) + '（还剩 ' + Math.max(0, (Number(s.incomeMulUntil) || 0) - absDay()) + ' 日）</span>' : '') + '</p>';
            // ---- v27.1 铺面专属事：等着拿主意的牌面（五日不管自动按稳妥章程了结） ----
            var pev = findEvent(s);
            if (pev) {
                var left = Math.max(0, CFG.EVENT_EXPIRE_DAYS - (absDay() - (Number(s.pendingEvent.day) || 0)));
                html += '<div class="bg-amber-900/30 border border-amber-600 rounded p-3 mb-2">'
                    + '<p class="text-sm text-amber-100 mb-2">' + pev.text + '</p>'
                    + '<p class="text-xs text-gray-400 mb-2">放着不管还有 ' + left + ' 日——过了就按头一条稳妥章程自己了结。</p>';
                for (var cvi = 0; cvi < pev.choices.length; cvi++) {
                    var ch = pev.choices[cvi];
                    var costN = choiceCost(ch);
                    html += '<button onclick="window.PlayerShop.eventChoice(' + cvi + ')" class="w-full text-left bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm mb-1">' + ch.label + (costN ? ' <span class="text-xs text-amber-300">（最多要打点 ' + costN + ' 灵石）</span>' : '') + '</button>';
                }
                html += '</div>';
            }
            html += '<button onclick="window.PlayerShop.collectHere()" ' + btn.replace('p-3', 'bg-yellow-800 p-3') + '>💰 收柜（把柜上的 ' + s.till + ' 灵石收进钱袋）</button>';
            html += '<div class="mb-2"><input id="pshop-name" type="text" maxlength="12" placeholder="铺子字号（十二字内）" value="' + (s.name || '') + '" class="w-full p-2 rounded bg-gray-800 border border-gray-600 text-sm text-gray-200 mb-1"><button onclick="window.PlayerShop.renameFromInput()" ' + btn.replace('p-3', 'bg-gray-700 p-3') + '>🪧 挂招牌</button></div>';
            if (st.key === 'general') {
                // ---- 杂货铺：货架老账 ----
                html += '<p class="text-xs text-gray-400 mb-1">货架（' + s.shelves.length + '/' + CFG.SHELF_MAX + '）——销率明账：≤公道价×1.3 抢手，×1.6 起没人问，×2.2 以上白摆：</p>';
                if (s.shelves.length === 0) {
                    html += '<p class="text-xs text-gray-500 mb-2">架空着——从行囊上架（下方输货号与件数）。</p>';
                }
                for (var i = 0; i < s.shelves.length; i++) {
                    var row = s.shelves[i];
                    var ratio = (row.price / Math.max(1, row.fair)).toFixed(2);
                    html += '<div class="flex items-center justify-between p-2 bg-gray-800 rounded border border-gray-700 mb-1">' +
                        '<span class="text-sm text-gray-200">' + row.icon + ' ' + row.name + ' ×' + row.count + ' <span class="text-xs text-amber-300">' + row.price + ' 灵石</span> <span class="text-xs text-gray-500">（公道 ' + row.fair + ' · ' + ratio + ' 倍）</span></span>' +
                        '<span class="flex gap-1"><button onclick="window.PlayerShop.priceStep(' + i + ',-1)" class="px-2 py-1 rounded text-xs bg-gray-600 text-white">－</button>' +
                        '<button onclick="window.PlayerShop.priceStep(' + i + ',1)" class="px-2 py-1 rounded text-xs bg-gray-600 text-white">＋</button>' +
                        '<button onclick="window.PlayerShop.unstock(' + i + ')" class="px-2 py-1 rounded text-xs bg-teal-800 text-white">下柜</button></span></div>';
                }
                html += '<div class="flex gap-1 mb-2"><input id="pshop-item" type="text" placeholder="行囊里的货号（如 pill_small_recovery）" class="flex-1 p-2 rounded bg-gray-800 border border-gray-600 text-xs text-gray-200"><input id="pshop-n" type="number" min="1" max="9" value="1" class="w-16 p-2 rounded bg-gray-800 border border-gray-600 text-xs text-gray-200"><button onclick="window.PlayerShop.stockFromInput()" class="px-3 rounded text-xs bg-indigo-800 text-white">上架</button></div>';
            } else {
                // ---- v27.1 自动营生：铺面自己会挣钱，牌面写明日进明账 ----
                var estBase = (st.key === 'ice')
                    ? (({ summer: 20, winter: 4 })[seasonNow()] || 10)
                    : (st.key === 'livery') ? (st.base + 4 * mundaneCount())
                    : (st.key === 'clinic') ? (st.base + Math.floor(lifeSkillLv('医术') / 20))
                    : st.base;
                var estClerk = s.clerk ? (0.6 + s.clerk.skill * 0.15) : 0.5;
                var estRep = 1 + Math.max(0, repValue(s.city)) / 400;
                if (st.key === 'landlord') {
                    html += '<p class="text-xs text-gray-400 mb-2">🏘️ 收租明账：每月初一各租户凑租 ' + Math.round(st.monthly * estRep * (Number(s.incomeMul) || 1)) + ' 灵石入柜（城望高租更旺）——宅院不用守，人不在城里也照收。</p>';
                } else {
                    html += '<p class="text-xs text-gray-400 mb-2">' + st.icon + ' 日进明账：基础 ' + estBase + (st.key === 'broker' ? '（+每日零单 0~10）' : '') + ' × 伙计 ' + estClerk.toFixed(2) + ' × 城望 ' + estRep.toFixed(2) + ' × 盈亏 ' + (Number(s.incomeMul) || 1).toFixed(2) + '，税吏抽 5%——' + st.desc + '</p>';
                    if (st.key === 'fence') html += '<p class="text-xs text-red-400/80 mb-2">🌑 查抄账：每日 3%（画像档之身 6%）差役上门——柜上抄走三成、热度+1、城望−3。这行当的风险，开张那日就写在契上。</p>';
                    if (st.key === 'livery' && mundaneCount() > 0) html += '<p class="text-xs text-gray-500 mb-2">🐴 厩里 ' + mundaneCount() + ' 头自家凡兽都套上了车（每头日进+4）。</p>';
                }
            }
            if (!s.clerk) {
                var cands = clerkCandidates();
                html += '<p class="text-xs text-gray-400 mb-1">今日人市上的伙计（每日换人）：</p>';
                for (var ci2 = 0; ci2 < cands.length; ci2++) {
                    var cand = cands[ci2];
                    html += '<button onclick="window.PlayerShop.hireClerk(' + ci2 + ')" ' + btn.replace('p-3', 'bg-teal-900 p-3') + '>🧑‍🍳 雇「' + cand.name + '」 <span class="text-xs text-amber-300">安家 ' + cand.hire + ' · 日薪 ' + cand.wage + '</span><span class="block text-xs text-gray-400">手艺 ' + cand.skill + ' 成（营生 ×' + (0.6 + cand.skill * 0.15).toFixed(2) + '）· 欠薪 ' + CFG.CLERK_ARREARS_QUIT + ' 日辞工</span></button>';
                }
            } else {
                // v27.1 大掌柜的路：手艺四成＋柜上三十日，东家亲自递长围裙
                var days = Number(s.clerk.days) || 0;
                if (!s.clerk.head) {
                    var ready = s.clerk.skill >= CFG.HEAD_SKILL && days >= CFG.HEAD_DAYS;
                    html += '<p class="text-xs text-gray-500 mb-1">熬大掌柜：手艺 ' + s.clerk.skill + '/' + CFG.HEAD_SKILL + ' 成 · 柜上 ' + days + '/' + CFG.HEAD_DAYS + ' 日' + (ready ? '——火候到了。' : '。') + '</p>';
                    if (ready) html += '<button onclick="window.PlayerShop.promoteHeadClerk()" ' + btn.replace('p-3', 'bg-emerald-800 p-3') + '>🎖️ 提拔「' + s.clerk.name + '」当大掌柜（日薪+2 · 从此开得分号，至多掌 ' + CFG.BRANCH_SHOPS + ' 城）</button>';
                }
                html += '<button onclick="window.PlayerShop.fireClerk()" ' + btn.replace('p-3', 'bg-red-900 p-3') + '>👋 辞了「' + s.clerk.name + '」（结清工钱 · 不退安家钱' + (s.clerk.head ? ' · 大掌柜走了，分号照旧开着' : '') + '）</button>';
            }
        }
        // 别城的铺子（远观：只报柜上与收柜入口——人在哪城收哪城的柜）
        var others = Object.keys(_st.shops).filter(function (pk) { return pk !== pkCity(ct); });
        for (var oi = 0; oi < others.length; oi++) {
            var os = _st.shops[others[oi]];
            var ot = typeOf(os);
            html += '<p class="text-xs text-gray-500 mt-1">' + ot.icon + ' 你在' + os.city + '还有间「' + (os.name || '没挂招牌') + '」（' + ot.name + '）——柜上 ' + os.till + ' 灵石' + (os.clerk ? '，' + (os.clerk.head ? '大掌柜' : '伙计') + '「' + os.clerk.name + '」看着' : '，没伙计，你不在就歇业') + '。（人到那城才能收柜/理货）</p>';
        }
        if (typeof window.showBuildingEffectDialog === 'function') {
            window.showBuildingEffectDialog('🏪 我的铺子 · ' + ct, html);
            return true;
        }
        return false;
    }

    function renameFromInput() {
        try {
            var el = document.getElementById('pshop-name');
            rename(el ? el.value : '');
        } catch (e) { console.warn('[静默失败] js/city-facilities/player-shop.js · renameFromInput：招牌没能描金', e && e.message); }
    }
    function stockFromInput() {
        try {
            var idEl = document.getElementById('pshop-item');
            var nEl = document.getElementById('pshop-n');
            stock(idEl ? idEl.value.trim() : '', nEl ? Number(nEl.value) : 1);
        } catch (e) { console.warn('[静默失败] js/city-facilities/player-shop.js · stockFromInput：这批货没上成架', e && e.message); }
    }
    function collectHere() { return collect(city()); }

    // ============ 存读档（StateRegistry 正门） ============
    function _export() { return JSON.parse(JSON.stringify(_st)); }
    function _import(d) {
        var s = { shops: {} };
        if (d && typeof d === 'object' && d.shops && typeof d.shops === 'object') {
            var n = 0;
            for (var pk in d.shops) {
                if (n++ >= CFG.BRANCH_SHOPS) break;   // v27.1 硬顶四间（含分号）——旧档超额既往不咎也只收前四
                var v = d.shops[pk];
                if (!v || typeof v !== 'object') continue;
                var typeKey = SHOP_TYPES[v.type] ? String(v.type) : 'general';
                var shelves = [];
                if (Array.isArray(v.shelves)) {
                    for (var i = 0; i < v.shelves.length && shelves.length < CFG.SHELF_MAX; i++) {
                        var r = v.shelves[i];
                        if (!r || typeof r.itemId !== 'string' || !r.itemId) continue;
                        var fair = Math.max(1, Math.floor(Number(r.fair)) || fairPrice(r.itemId));
                        shelves.push({
                            itemId: r.itemId.slice(0, 60),
                            name: typeof r.name === 'string' ? r.name.slice(0, 24) : itemName(r.itemId),
                            icon: typeof r.icon === 'string' ? r.icon.slice(0, 8) : '📦',
                            price: Math.max(1, Math.min(Math.round(fair * CFG.PRICE_MAX_MUL), Math.floor(Number(r.price)) || fair)),
                            count: Math.max(1, Math.min(999, Math.floor(Number(r.count)) || 1)),
                            fair: fair
                        });
                    }
                }
                // v27.1 铺面事只认账上有的：id 对不上本行当事件池的，一律当没了（坏账不进门）
                var pend = null;
                if (v.pendingEvent && typeof v.pendingEvent === 'object' && typeof v.pendingEvent.id === 'string') {
                    var pool = TYPE_EVENTS[typeKey] || [];
                    for (var pi = 0; pi < pool.length; pi++) {
                        if (pool[pi].id === v.pendingEvent.id.slice(0, 30)) { pend = { id: pool[pi].id, day: Math.max(0, Math.floor(Number(v.pendingEvent.day) || 0)) }; break; }
                    }
                }
                s.shops[String(pk).slice(0, 30)] = {
                    city: typeof v.city === 'string' ? v.city.slice(0, 30) : String(pk),
                    name: typeof v.name === 'string' ? v.name.slice(0, 12) : '',
                    type: typeKey,
                    shelves: shelves,
                    till: Math.max(0, Math.floor(Number(v.till)) || 0),
                    clerk: (v.clerk && typeof v.clerk.name === 'string')
                        ? {
                            name: v.clerk.name.slice(0, 12),
                            skill: Math.max(1, Math.min(5, Math.floor(Number(v.clerk.skill)) || 1)),
                            wage: Math.max(1, Math.min(7, Math.floor(Number(v.clerk.wage)) || 1)),
                            days: Math.max(0, Math.min(9999, Math.floor(Number(v.clerk.days) || 0))),
                            head: !!v.clerk.head
                        }
                        : null,
                    arrears: Math.max(0, Math.min(CFG.CLERK_ARREARS_QUIT, Math.floor(Number(v.arrears)) || 0)),
                    boughtDay: Math.floor(Number(v.boughtDay)) || 0,
                    soldTotal: Math.max(0, Math.floor(Number(v.soldTotal)) || 0),
                    revenueTotal: Math.max(0, Math.floor(Number(v.revenueTotal)) || 0),
                    incomeMul: Math.max(CFG.INCOME_MUL_MIN, Math.min(CFG.INCOME_MUL_MAX, Number(v.incomeMul) || 1)),
                    incomeMulUntil: Math.max(0, Math.floor(Number(v.incomeMulUntil) || 0)),
                    pendingEvent: pend,
                    monthSettled: Math.max(0, Math.floor(Number(v.monthSettled) || 0))
                };
            }
        }
        _st = s;
    }
    function _reset() { _st = { shops: {} }; }
    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        window.StateRegistry.register('playerShop', { version: 1, export: _export, import: _import, reset: _reset });
    }

    if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') {
        window.timeSystem.onNewDaySubscribe(function () { dailySettle(); });
    }

    window.PlayerShop = {
        CFG: CFG,
        SHOP_TYPES: SHOP_TYPES, TYPE_EVENTS: TYPE_EVENTS,   // v27.1 铺面类型表与专属事（明账，测试与牌面同源）
        shopOkCity: shopOkCity, shopPrice: shopPrice, shopCount: shopCount, shopHere: shopHere,
        shopCap: shopCap, anyHeadClerk: anyHeadClerk, typeGateFail: typeGateFail, findEvent: findEvent,
        buyShop: buyShop, rename: rename, renameFromInput: renameFromInput,
        stock: stock, stockFromInput: stockFromInput, priceStep: priceStep, unstock: unstock,
        clerkCandidates: clerkCandidates, hireClerk: hireClerk, fireClerk: fireClerk,
        promoteHeadClerk: promoteHeadClerk, eventChoice: eventChoice,   // v27.1 大掌柜与铺面事
        dailySettle: dailySettle, saleRate: saleRate, collect: collect, collectHere: collectHere,
        open: open,
        state: _export
    };
    window.openPlayerShop = function () { return open(); };
})();
