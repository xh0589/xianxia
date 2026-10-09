// ==================== v27.0 坐骑批（第一百五十三批 · 用户点单：坐骑并入灵兽）· 马市账 ====================
// 马太低级，就配凡人与炼气赶路——灵兽坊卖灵兽（灵石、血脉钱），马市卖牲口（铜钱、草料账）：
//   ① 相口齿：花一刻钟看牲口成色（好/中平/次——骑乘速度系数随之加减）；不相就是盲买；
//   ② 砍价：每牲口每日一轮，口才利打九折，砍崩了掌柜当日不再搭理这一桩；
//   ③ 当场取名：买定牵兽即开小名弹窗（复用灵兽小名账，物种账不动）；
//   ④ 谜之兽蛋：低概率上架（城+日播种——同日回访货色不变），20 灵石盲盒，随身焐三日破壳，
//      出什么幼兽看天意；兽栏魂印满了就缓孵（蛋不会坏，腾出栏来自然破壳）；
//   ⑤ 卖回马市：牵出去的牲口半价卖回（确认弹窗与落账在 beast-taming 的 openSellMundaneModal）；
//   ⑥ 车马行柜台：闲厩的牲口挂出去替人拉车——日结租钱（速度×8铜，净小赚不是印钞路），
//      代价是它不在你缰绳底下（骑乘口落空），每日 8% 拉车劳损掉膘（明账）；
//   ⑦ 郊外赛马：河滩跑马场每城每日一场（cd()._hmRace 单字段日戳，押镖/工账同款先例），
//      凡兽会/灵兽会两条道——报名带自家坐骑（头名彩金+亲密+驭兽阅历），看客押注三档 10/50/100 铜，
//      赔率明账（脚力反比、庄家抽一成写在赔率里，斗蛐蛐同款家法）；跑法=脚力×(0.85+骰0.30)。
// 纪律：牲口进出账只走 beast-taming 的 buyMundaneBeast / openSellMundaneModal——本文件只管柜台；
//       草料日结挂在 beast-taming 的翻日口上（无日常按钮）；钱全走 DataManager（铜钱/灵石双写口径），
//       背包满退钱原路——不吞客人的钱。
(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    // ============ 小工具 ============
    function say(m, t) { try { if (window.showMessage) window.showMessage(m, t || 'info'); } catch (e) {} }
    function log(m, t) { try { if (window.gameLog && window.gameLog.add) window.gameLog.add(m, t || 'info'); } catch (e) {} }
    function dm() { return window.XianXia && window.XianXia.DataManager; }
    function cd() { return window.currentCharData || null; }
    function pkCity(s) { return String(s == null ? '' : s).replace(/\s+/g, ''); }
    function city() {
        return (cd() && cd().location) ||
            (typeof window.getCurrentCityName === 'function' && window.getCurrentCityName()) || '';
    }
    function day() { return (typeof window.getAbsoluteDay === 'function') ? window.getAbsoluteDay() : 1; }
    // 城+日播种的伪随机（同日回访货色/成色不变——柜台不能每开一次模态就换一副面孔）
    function seededRand(str) {
        var h = 2166136261;
        for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
        return function () {
            h = Math.imul(h ^ (h >>> 15), 2246822507);
            h = Math.imul(h ^ (h >>> 13), 3266489909);
            return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
        };
    }

    // ============ 柜台配置 ============
    var HM_STOCK = ['mule_common', 'horse_common', 'horse_fine'];   // 价目随模板 basePrice 走
    var EGG_ID = 'beast_egg';
    var EGG_PRICE = 20;            // 灵石
    var EGG_HATCH_DAYS = 3;        // 随身焐三日破壳
    var EGG_STOCK_P = 0.35;        // 每城每日三成五的概率有蛋上架
    var HAGGLE_DISCOUNT = 0.9;
    var INSPECT_MINUTES = 15;
    // 破壳池：低阶幼兽六选一天意（灵兽坊货架的前四只 + 仙鹤/黑熊两只野外常见种）
    var EGG_POOL = ['wind_wolf', 'spirit_fox', 'flame_tiger', 'ice_serpent', 'crane', 'black_bear'];

    // ---- 车马行（第22件·柜台侧）：闲厩出租，日结租钱；挂出去的牲口不在你缰绳底下 ----
    var LIVERY_RENT_MUL = 8;       // 日租 = 速度系数 × 8 铜（凡马≈10铜/日，草料才2铜——净小赚，不是印钞）
    var LIVERY_WEAR_P = 0.08;      // 拉车劳损：每日 8% 掉膘（掉膘租钱打八折，喂回来才好）

    // ---- 赛马（第3件·郊外跑马场）：明账赌局，庄家抽一成（斗蛐蛐同款家法）----
    var RACE_BETS = [10, 50, 100]; // 三档注（铜钱）
    var RAKE = 0.9;                // 赔率里抽一成——明账
    var ODDS_MIN = 1.3, ODDS_MAX = 6.0;
    var RACE_MINUTES = 60;         // 一场 races 一个时辰
    var PURSE_MUNDANE = 120;       // 凡兽会头名彩金（铜钱）
    var PURSE_SPIRIT = 15;         // 灵兽会头名彩金（灵石）
    var RACE_DIVS = {
        mundane: { key: 'mundane', name: '凡兽会', spRange: [1.1, 1.5], npcs: ['枣毛', '铁蹄', '栓子', '瘸花', '黑旋风', '草上飞'] },
        spirit:  { key: 'spirit',  name: '灵兽会', spRange: [1.5, 2.8], npcs: ['青鳞公子', '雪影', '赤霄', '幽风客', '踏云娘', '金睛郎'] }
    };

    // 运行时小账（不随档）：相过的口齿 / 砍过的价——按城+日翻篇
    var _rt = { city: '', day: 0, inspected: {}, haggled: {}, haggleOk: {} };
    function _rtSync() {
        var c = pkCity(city()), d = day();
        if (_rt.city !== c || _rt.day !== d) {
            _rt = { city: c, day: d, inspected: {}, haggled: {}, haggleOk: {} };
        }
        return _rt;
    }

    // 成色（城+日+牲口播种）：好 +0.1 / 中平 0 / 次 -0.1——落在 qualityAdj，骑乘倍率真吃这笔账
    function qualityOf(templateId) {
        var r = seededRand('hm|q|' + pkCity(city()) + '|' + day() + '|' + templateId)();
        if (r < 0.25) return { name: '上好', adj: 0.1 };
        if (r < 0.75) return { name: '中平', adj: 0 };
        return { name: '次', adj: -0.1 };
    }
    function eggInStock() {
        return seededRand('hm|egg|' + pkCity(city()) + '|' + day())() < EGG_STOCK_P;
    }
    function priceOf(templateId) {
        var t = window.BEAST_TEMPLATES && window.BEAST_TEMPLATES[templateId];
        var base = (t && t.basePrice) || 700;
        var st = _rtSync();
        if (st.haggleOk[templateId]) base = Math.round(base * HAGGLE_DISCOUNT);
        return base;
    }

    // ============ 兽蛋物品注册（进 itemById/allItems——与 13-missing-ids 同款口径） ============
    var EGG_ITEM = {
        id: EGG_ID, name: '谜之兽蛋', type: 'special', subtype: 'misc', category: 'special',
        quality: 'PIN5', level: 1, price: EGG_PRICE, stackable: true, maxStack: 1, icon: '🥚',
        desc: '马市上不知来路的蛋。随身焐着，三日后破壳——出什么，天知道。'
    };
    function registerEggItem() {
        try {
            if (!window.itemById) window.itemById = {};
            if (!window.itemById[EGG_ID]) {
                window.itemById[EGG_ID] = EGG_ITEM;
                if (Array.isArray(window.allItems)) window.allItems.push(EGG_ITEM);
                if (Array.isArray(window.extendedSpecial) && !window.extendedSpecial.some(function (x) { return x && x.id === EGG_ID; })) {
                    window.extendedSpecial.push(EGG_ITEM);
                }
            }
        } catch (e) { console.warn('[静默失败] js/city-facilities/horse-market.js · registerEggItem：谜之兽蛋没进物品账——马市收得出灵石，addItem 认不得货', e && e.message); }
    }
    registerEggItem();

    // ============ 相口齿 ============
    window.hmInspect = function (templateId) {
        var st = _rtSync();
        if (st.inspected[templateId]) { window.openHorseMarket(); return; }
        if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
            window.timeSystem.advanceTime(INSPECT_MINUTES, '马市相口齿');
        }
        st.inspected[templateId] = qualityOf(templateId);
        var q = st.inspected[templateId];
        var t = (window.BEAST_TEMPLATES || {})[templateId] || {};
        say('🐴 你掰开' + (t.name || '牲口') + '的嘴看了看口齿，又捏了捏蹄腕——成色' + q.name + '。（骑乘速度×' + (((t.mount && t.mount.speed) || 1) + q.adj).toFixed(1) + '）', q.adj > 0 ? 'success' : (q.adj < 0 ? 'warning' : 'info'));
        window.openHorseMarket();
    };

    // ============ 砍价 ============
    window.hmHaggle = function (templateId) {
        var st = _rtSync();
        if (st.haggled[templateId]) { say('这一桩今儿已经砍过价了——掌柜的把脸扭向一边。', 'info'); window.openHorseMarket(); return; }
        st.haggled[templateId] = true;
        var elo = 0;
        try { elo = (typeof window.getLifeSkill === 'function' ? (window.getLifeSkill('口才') || 0) : 0); } catch (e) {}
        var p = Math.min(0.7, 0.4 + elo * 0.004);
        var t = (window.BEAST_TEMPLATES || {})[templateId] || {};
        if (Math.random() < p) {
            st.haggleOk[templateId] = true;
            say('🐴 你围着' + (t.name || '牲口') + '挑了三处毛病，掌柜的啧了一声：「得得得，九折牵走，别再磨了。」', 'success');
        } else {
            say('🐴 掌柜的把缰绳往怀里一收：「价钱是行情价——你当这是你家骡圈？」这一桩今日不让了。', 'warning');
        }
        window.openHorseMarket();
    };

    // ============ 买牲口 ============
    window.hmBuyBeast = function (templateId) {
        if (HM_STOCK.indexOf(templateId) < 0) return false;
        if (typeof window.buyMundaneBeast !== 'function') { say('牲口账没准备好（灵兽系统未加载）。', 'error'); return false; }
        var t = (window.BEAST_TEMPLATES || {})[templateId] || {};
        if ((window.mundaneBeastCount ? window.mundaneBeastCount() : 0) >= (window.MUNDANE_PEN_CAP || 3)) {
            say('厩里已经拴满三头了——再买，草料都拌不开。', 'warning');
            return false;
        }
        var price = priceOf(templateId);
        var paid = false;
        if (dm() && typeof dm().deductCopper === 'function') paid = !!dm().deductCopper(price);
        else if (cd() && (cd().copper || 0) >= price) { cd().copper -= price; paid = true; }
        if (!paid) { say('铜钱不够——「' + t.name + '」要 ' + price + ' 铜钱，贩子把缰绳攥得更紧了。', 'warning'); return false; }
        if (typeof window.updateCurrencyUI === 'function') window.updateCurrencyUI();
        if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
            window.timeSystem.advanceTime(INSPECT_MINUTES, '马市交易');
        }
        // 成色：相过口齿吃相出的账，没相就是盲买（同一颗种子——买定才发现成色，赖不着柜台）
        var q = qualityOf(templateId);
        var ok = window.buyMundaneBeast(templateId, { qualityAdj: q.adj, qualityName: q.name });
        if (!ok) {
            // 买不进去（满厩在上一道闸拦过，这里是兜底）——钱原路退回
            if (dm() && typeof dm().addCopper === 'function') dm().addCopper(price);
            else if (cd()) cd().copper = (cd().copper || 0) + price;
            if (typeof window.updateCurrencyUI === 'function') window.updateCurrencyUI();
            say('这单没做成——' + price + ' 铜钱原数退回。', 'error');
            return false;
        }
        log('🐴 马市上牵回一头' + t.name + '（' + price + ' 铜钱，成色' + q.name + '）——缰绳到手，它打着响鼻认了你。往后每日草料 ' + ((t.feedCopper) || 2) + ' 铜从账上自动走。', 'success');
        say('🐴 「' + t.name + '」买定了（成色' + q.name + '）——给它起个名吧。', 'success');
        // 当场取名：复用灵兽小名账（弹窗顶掉马市模态是 Modal 栈的同 id 单实例语义，取名后重进马市即可）
        var idx = (window.tamedBeasts || []).length - 1;
        if (idx >= 0 && typeof window.openRenameBeastModal === 'function') window.openRenameBeastModal(idx);
        return true;
    };

    // ============ 谜之兽蛋 ============
    window.hmBuyEgg = function () {
        if (!eggInStock()) { say('今儿摊上没有那颗蛋。', 'info'); window.openHorseMarket(); return false; }
        registerEggItem();
        var paid = false;
        if (dm() && typeof dm().deductSpiritStones === 'function') paid = !!dm().deductSpiritStones(EGG_PRICE);
        else if (cd() && (cd().spiritStones || 0) >= EGG_PRICE) { cd().spiritStones -= EGG_PRICE; paid = true; }
        if (!paid) { say('谜之兽蛋要 ' + EGG_PRICE + ' 灵石——贩子看你钱袋的眼神都淡了。', 'warning'); return false; }
        if (typeof window.updateCurrencyUI === 'function') window.updateCurrencyUI();
        var got = 0;
        try { got = (typeof window.addItem === 'function') ? (window.addItem(EGG_ID, 1) ? 1 : 0) : 0; } catch (e) {}
        if (!got) {
            // 钱已扣就得给货——收不进账就原路退钱，不吞客人的灵石。
            if (dm() && typeof dm().addSpiritStones === 'function') dm().addSpiritStones(EGG_PRICE);
            else if (cd()) cd().spiritStones = (cd().spiritStones || 0) + EGG_PRICE;
            // 缘由问账上那支说话手：是「行囊已满」还是「百宝册查无此号」，
            // 由 addItem 落进 addItemFailReason 的那笔账说了算，柜上不自己替它猜。
            // ⚠️ 缘由后面还接「——NNN 灵石原样退回」，所以吃**从句支** addItemFailPhrase，
            //   不吃句尾支 addItemFailText：句尾支带句号，拼进去就是「再来。——250 灵石…」（DES-97）。
            if (typeof window.updateCurrencyUI === 'function') window.updateCurrencyUI();
            say('可惜' + ((typeof window.addItemFailPhrase === 'function' && window.addItemFailPhrase('这颗蛋')) || '这颗蛋没处搁')
                + '——' + EGG_PRICE + ' 灵石原样退回。', 'error');
            return false;
        }
        // 焐蛋的日子记在槽上（读档掉字段也不怕——翻日账见没日戳的蛋会补记）
        try {
            var slots = (window.inventory && window.inventory.slots) || [];
            for (var i = 0; i < slots.length; i++) {
                var s = slots[i];
                if (s && s.templateId === EGG_ID && s._hatchDay == null) { s._hatchDay = day() + EGG_HATCH_DAYS; break; }
            }
        } catch (eStamp) {}
        log('🥚 你花 ' + EGG_PRICE + ' 灵石从马市贩子手里接过来一颗温热的蛋——「贴身焐三日，出什么算什么，概不退换。」', 'success');
        say('🥚 谜之兽蛋入手——贴身焐着，三日后破壳。', 'success');
        window.openHorseMarket();
        return true;
    };

    // ============ 车马行：挂出/牵回（柜台侧包一层，进出账在 beast-taming） ============
    window.hmHireOut = function (index) {
        if (typeof window.hireOutBeast === 'function') window.hireOutBeast(index);
        window.openHorseMarket();
    };
    window.hmBringBack = function (index) {
        if (typeof window.bringBackBeast === 'function') window.bringBackBeast(index);
        window.openHorseMarket();
    };
    function liveryRentOf(b) {
        var sp = ((b.mount && b.mount.speed) || 1) + (b.qualityAdj || 0);
        if (b.thin) sp = sp * 0.8;
        return Math.max(1, Math.round(sp * LIVERY_RENT_MUL));
    }
    // 翻日账：挂车马行的牲口逐头结租钱；劳损 8% 掉膘（明账）
    function liveryTick() {
        try {
            var tb = window.tamedBeasts || [];
            var rent = 0, n = 0, worn = [];
            for (var i = 0; i < tb.length; i++) {
                var b = tb[i];
                if (!b || !b.outToLivery) continue;
                n++;
                rent += liveryRentOf(b);
                if (!b.thin && Math.random() < LIVERY_WEAR_P) { b.thin = true; worn.push(b); }
            }
            if (!n) return;
            if (rent > 0) {
                if (dm() && typeof dm().addCopper === 'function') dm().addCopper(rent);
                else if (cd()) cd().copper = (cd().copper || 0) + rent;
                if (typeof window.updateCurrencyUI === 'function') window.updateCurrencyUI();
            }
            if (worn.length && typeof window.saveBeastData === 'function') window.saveBeastData();
            var nm = function (b) { return (typeof window.beastDisplayName === 'function') ? window.beastDisplayName(b) : b.name; };
            log('🐴 车马行日结：' + n + ' 头牲口在外拉车，共挣 ' + rent + ' 铜钱。' + (worn.length ? '「' + worn.map(nm).join('、') + '」拉车拉瘦了——掉了膘（草料补齐或亲手喂草料才回得来）。' : ''), 'info');
            if (worn.length) say('🐴 车马行的伙计来结账（' + rent + ' 铜）：「' + worn.map(nm).join('、') + '」这几日车拉得狠，瘦了——心疼就牵回来喂喂。', 'warning');
        } catch (e) { console.warn('[静默失败] js/city-facilities/horse-market.js · liveryTick：车马行没结租钱——牲口白拉了一天车，玩家的进项悄悄少一笔', e && e.message); }
    }

    // ============ 郊外赛马：明账赌局 ============
    // 每城每日一场（cd()._hmRace 单字段，押镖/工账同款先例）；庄家抽一成写在赔率里；
    // 报名带自己的坐骑（凡兽会限凡兽、灵兽会限灵兽，挂出去拉车的不算），押注三档 10/50/100 铜。
    var _race = null;   // 运行时一场账：{ city, day, div, field, entered, bet, settled, resultText }
    function raceOf(divKey) {
        var c = pkCity(city()), d = day();
        if (!_race || _race.city !== c || _race.day !== d || _race.div !== divKey || _race.settled) {
            var div = RACE_DIVS[divKey] || RACE_DIVS.mundane;
            var rnd = seededRand('hm|race|' + c + '|' + d + '|' + div.key);
            var names = div.npcs.slice();
            var field = [];
            for (var i = 0; i < 3; i++) {
                var sp = div.spRange[0] + rnd() * (div.spRange[1] - div.spRange[0]);
                field.push({ name: names[Math.floor(rnd() * names.length)] + '·' + (i + 1) + '号棚', speed: Math.round(sp * 100) / 100, mine: false });
            }
            _race = { city: c, day: d, div: div.key, field: field, entered: false, bet: null, settled: false, resultText: '' };
            var gate = (cd() && cd()._hmRace) || null;
            if (gate && gate.city === c && gate.day === d && gate.div === div.key) {
                _race.settled = true;
                _race.resultText = gate.resultText || '今日的场次已经跑完了。';
            }
        }
        return _race;
    }
    function myRaceMount(divKey) {
        // 报名资格：本会对应的最快一头可骑坐骑（挂车马行的不算；灵兽会不认凡兽，凡兽会不劳灵兽大驾）
        var tb = window.tamedBeasts || [];
        var best = null, bestSp = 0;
        for (var i = 0; i < tb.length; i++) {
            var b = tb[i];
            if (!b || !b.mount || b.outToLivery) continue;
            var isMund = !!(window.isMundaneBeast && window.isMundaneBeast(b));
            if (divKey === 'mundane' ? !isMund : isMund) continue;
            var sp = (b.mount.speed || 1) + (b.qualityAdj || 0);
            if (b.thin) sp *= 0.8;
            if (sp > bestSp) { bestSp = sp; best = { index: i, beast: b, speed: Math.round(sp * 100) / 100 }; }
        }
        return best;
    }
    function oddsOf(field, idx) {
        var total = 0;
        field.forEach(function (r) { total += r.speed; });
        var o = Math.round((RAKE * total / field[idx].speed) * 10) / 10;
        return Math.max(ODDS_MIN, Math.min(ODDS_MAX, o));
    }
    window.openHorseRace = function (divKey) {
        divKey = (divKey === 'spirit') ? 'spirit' : 'mundane';
        var div = RACE_DIVS[divKey];
        var r = raceOf(divKey);
        var my = myRaceMount(divKey);
        // 报名（跑马入册）：把自家坐骑填进第四道
        if (r.entered && r.field.length === 3 && my) {
            r.field.push({ name: (typeof window.beastDisplayName === 'function' ? window.beastDisplayName(my.beast) : my.beast.name) + '（你的）', speed: my.speed, mine: true });
        }
        var html = '';
        if (r.settled) {
            html += '<p class="text-sm text-gray-300 mb-2">' + r.resultText + '</p>'
                + '<p class="text-xs text-gray-500">明日赶早，跑马场重新开盘。</p>';
            if (typeof window.showModal === 'function') window.showModal('🏇 郊外跑马场 · ' + div.name, html);
            return;
        }
        html += '<p class="text-xs text-gray-400 mb-2">跑马场就圈在马市后头的河滩上，一圈黄土一圈看客。庄家明账：<b>赔率里抽一成</b>——押注三档 10/50/100 铜。</p>';
        r.field.forEach(function (run, i) {
            html += '<div class="bg-gray-900 rounded p-2 mb-1 flex justify-between items-center">'
                + '<div><span class="text-sm ' + (run.mine ? 'text-emerald-300 font-bold' : 'text-white') + '">🏇 ' + run.name + '</span>'
                + '<span class="text-xs text-gray-500 ml-2">脚力 ' + run.speed.toFixed(2) + ' · 赔率 ×' + oddsOf(r.field, i).toFixed(1) + '</span></div>'
                + '<span class="flex gap-1">'
                + (r.bet && r.bet.idx === i ? '<span class="text-xs text-yellow-300">已押' + r.bet.amount + '铜</span>' : RACE_BETS.map(function (amt) {
                    return '<button onclick="hmRaceBet(\'' + divKey + '\',' + i + ',' + amt + ')" class="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded"' + (r.bet ? ' disabled' : '') + '>押' + amt + '</button>';
                }).join(''))
                + '</span></div>';
        });
        if (!r.entered) {
            if (my) {
                html += '<button onclick="hmRaceEnter(\'' + divKey + '\')" class="w-full bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-2 rounded text-sm mb-1 mt-1">🐴 报名下场：' + (typeof window.beastDisplayName === 'function' ? window.beastDisplayName(my.beast) : my.beast.name) + '（脚力 ' + my.speed.toFixed(2) + '，报名免费，头名彩金 ' + (divKey === 'mundane' ? PURSE_MUNDANE + ' 铜钱' : PURSE_SPIRIT + ' 灵石') + '）</button>';
            } else {
                html += '<p class="text-xs text-gray-500 mb-1">你没有能下这条道的坐骑（' + (divKey === 'mundane' ? '凡兽会限凡兽——马市有售；挂车马行拉车的不算' : '灵兽会限灵兽坐骑') + '）——看客押注也是一样的热闹。</p>';
            }
        }
        html += '<button onclick="hmRaceRun(\'' + divKey + '\')" class="w-full bg-amber-700 hover:bg-amber-600 text-white px-3 py-2 rounded text-sm mt-1">🥁 开锣！（一个时辰，跑完这场今日就散）</button>';
        if (typeof window.showModal === 'function') window.showModal('🏇 郊外跑马场 · ' + div.name, html);
    };
    window.hmRaceEnter = function (divKey) {
        var r = raceOf(divKey);
        if (r.settled || r.entered) return;
        if (!myRaceMount(divKey)) { say('你没有能下这条道的坐骑。', 'warning'); return; }
        r.entered = true;
        window.openHorseRace(divKey);
    };
    window.hmRaceBet = function (divKey, idx, amount) {
        var r = raceOf(divKey);
        if (r.settled) return;
        if (r.bet) { say('一场只能押一注——贪多的手，庄家最喜欢。', 'info'); return; }
        if (RACE_BETS.indexOf(amount) < 0) return;
        if (idx < 0 || idx >= r.field.length) return;
        var paid = false;
        if (dm() && typeof dm().deductCopper === 'function') paid = !!dm().deductCopper(amount);
        else if (cd() && (cd().copper || 0) >= amount) { cd().copper -= amount; paid = true; }
        if (!paid) { say('铜钱不够押这一注。', 'warning'); return; }
        if (typeof window.updateCurrencyUI === 'function') window.updateCurrencyUI();
        r.bet = { idx: idx, amount: amount, odds: oddsOf(r.field, idx) };
        say('🎫 押了 ' + amount + ' 铜在「' + r.field[idx].name + '」身上（赔率 ×' + r.bet.odds.toFixed(1) + '）。', 'info');
        window.openHorseRace(divKey);
    };
    window.hmRaceRun = function (divKey) {
        var r = raceOf(divKey);
        if (r.settled) { say('今日的场次已经跑完了。', 'info'); return; }
        var div = RACE_DIVS[divKey] || RACE_DIVS.mundane;
        if (!r.entered && !r.bet) { say('既没报名也没押注——白开一趟锣做什么？先下个注或牵你的坐骑下场。', 'info'); return; }
        if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
            window.timeSystem.advanceTime(RACE_MINUTES, '郊外赛马');
        }
        // 跑：脚力 × (0.85 + 骰 0.30)——脚力是明账，骰子是当日状态
        var scores = r.field.map(function (run) { return { run: run, score: run.speed * (0.85 + Math.random() * 0.30) }; });
        scores.sort(function (a, b) { return b.score - a.score; });
        var winIdx = r.field.indexOf(scores[0].run);
        var winName = scores[0].run.name;
        var out = [];
        scores.forEach(function (s, i) { out.push((i + 1) + '.「' + s.run.name + '」'); });
        // 押注结算
        var betLine = '';
        if (r.bet) {
            if (r.bet.idx === winIdx) {
                var win = Math.round(r.bet.amount * r.bet.odds);
                if (dm() && typeof dm().addCopper === 'function') dm().addCopper(win);
                else if (cd()) cd().copper = (cd().copper || 0) + win;
                betLine = '你押的「' + r.field[r.bet.idx].name + '」赢了——庄家数出 ' + win + ' 铜钱（' + r.bet.amount + '×' + r.bet.odds.toFixed(1) + '，抽头已在赔率里）。';
            } else {
                betLine = '你押的「' + r.field[r.bet.idx].name + '」没能跑进来——' + r.bet.amount + ' 铜钱归了庄家。';
            }
            if (typeof window.updateCurrencyUI === 'function') window.updateCurrencyUI();
        }
        // 自家坐骑结算
        var myLine = '', myIdx = -1;
        for (var i = 0; i < r.field.length; i++) if (r.field[i].mine) myIdx = i;
        if (r.entered && myIdx >= 0) {
            var myBeast = r.field[myIdx].mine && myRaceMount(divKey);
            var bObj = myBeast && myBeast.beast;
            if (myIdx === winIdx) {
                if (divKey === 'mundane') {
                    if (dm() && typeof dm().addCopper === 'function') dm().addCopper(PURSE_MUNDANE);
                    else if (cd()) cd().copper = (cd().copper || 0) + PURSE_MUNDANE;
                    myLine = '你的坐骑头名冲线——彩金 ' + PURSE_MUNDANE + ' 铜钱！看台上有人喊你的马名。';
                } else {
                    if (dm() && typeof dm().addSpiritStones === 'function') dm().addSpiritStones(PURSE_SPIRIT);
                    else if (cd()) cd().spiritStones = (cd().spiritStones || 0) + PURSE_SPIRIT;
                    myLine = '你的灵兽头名冲线——彩金 ' + PURSE_SPIRIT + ' 灵石！满场修士都在打听这是谁家的兽。';
                }
                if (typeof window.updateCurrencyUI === 'function') window.updateCurrencyUI();
                if (bObj) bObj.affection = Math.min(100, (bObj.affection || 0) + 3);
                if (typeof window.growLifeSkill === 'function') window.growLifeSkill('驭兽', 2, { reason: '赛马头名' });
            } else {
                myLine = '你的坐骑跑在第 ' + (scores.findIndex(function (s) { return s.run.mine; }) + 1) + ' 位——它尽力了，回来蹭了蹭你的手。';
                if (bObj) bObj.affection = Math.min(100, (bObj.affection || 0) + 1);
            }
            if (bObj && typeof window.saveBeastData === 'function') window.saveBeastData();
        }
        r.settled = true;
        r.resultText = '头名：「' + winName + '」。' + out.join('　') + (betLine ? ' ' + betLine : '') + (myLine ? ' ' + myLine : '');
        // 日戳落账：cd()._hmRace 单字段（押镖/工账同款先例）——每城每日一场
        try { if (cd()) cd()._hmRace = { city: r.city, day: r.day, div: divKey, resultText: r.resultText }; } catch (eGate) {}
        log('🏇 郊外跑马场（' + div.name + '）开锣：' + r.resultText, 'info');
        if (typeof window.showModal === 'function') window.showModal('🏇 ' + div.name + ' · 开跑', '<p class="text-sm text-gray-200 mb-2">' + r.resultText + '</p><p class="text-xs text-gray-500">黄土落了，看客散了——明日赶早。</p>');
        else say('🏇 ' + r.resultText, 'info');
    };

    // 翻日账：焐满三日的蛋破壳——魂印满了就缓孵（蛋不会坏）
    function eggHatchTick() {
        try {
            var slots = (window.inventory && window.inventory.slots) || [];
            var today = day();
            for (var i = 0; i < slots.length; i++) {
                var s = slots[i];
                if (!s || s.templateId !== EGG_ID) continue;
                if (s._hatchDay == null) { s._hatchDay = today + EGG_HATCH_DAYS; continue; }   // 旧档/旁路得的蛋：见蛋补记
                if (today < s._hatchDay) continue;
                // 兽栏魂印满了：缓孵——蛋在行囊里再焐着，腾出栏来自然破壳
                if (typeof window.spiritBeastCount === 'function' && typeof window.getBeastPenCap === 'function' &&
                    window.spiritBeastCount() >= window.getBeastPenCap()) {
                    say('🥚 行囊里的兽蛋顶了顶壳——可你的兽栏魂印满了（' + window.spiritBeastCount() + '/' + window.getBeastPenCap() + '），没窝安置。先放生或腾栏，它才肯出来。', 'warning');
                    continue;
                }
                var tid = EGG_POOL[Math.floor(Math.random() * EGG_POOL.length)];
                var tpl = (window.BEAST_TEMPLATES || {})[tid];
                if (!tpl) continue;
                slots[i] = null;
                var tb = window.tamedBeasts;
                if (!Array.isArray(tb)) continue;
                var trait = null;
                try {
                    var traits = window.BEAST_TRAITS || [];
                    if (traits.length) trait = traits[Math.floor(Math.random() * traits.length)].id;
                } catch (eTr) {}
                tb.push({
                    templateId: tid, name: tpl.name, level: 1, exp: 0, affection: 50,
                    skills: (tpl.skills || []).slice(), combatAbilities: [],
                    trait: trait,
                    mount: tpl.mount ? Object.assign({}, tpl.mount) : null
                });
                if (typeof window.saveBeastData === 'function') window.saveBeastData();
                if (typeof window.tryRegisterTamedBeast === 'function') window.tryRegisterTamedBeast(tb.length - 1);
                if (typeof window.updateInventoryUI === 'function') window.updateInventoryUI();
                if (typeof window.renderBeastList === 'function') window.renderBeastList();
                log('🥚 兽蛋破壳——一只「' + tpl.name + '」幼兽湿漉漉地滚进你掌心，睁眼头一个认的就是你。（' + tpl.realm + '血脉）', 'success');
                say('🐣 破壳了！是「' + tpl.name + '」——' + (tpl.realm || '') + '血脉的幼兽，从此进了你的兽栏。', 'success');
            }
        } catch (e) { console.warn('[静默失败] js/city-facilities/horse-market.js · eggHatchTick：焐满的兽蛋没破壳——钱花了蛋坏了，玩家的盲盒打水漂', e && e.message); }
    }
    function subscribeHatch() {
        if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') {
            window.timeSystem.onNewDaySubscribe(eggHatchTick);
            window.timeSystem.onNewDaySubscribe(liveryTick);
        }
    }
    if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') subscribeHatch();
    else if (typeof window.addEventListener === 'function') window.addEventListener('load', subscribeHatch);

    // ============ 柜台模态 ============
    window.openHorseMarket = function () {
        if (typeof window.showModal !== 'function') { say('马市今日歇市。', 'info'); return; }
        var st = _rtSync();
        var mundN = (typeof window.mundaneBeastCount === 'function') ? window.mundaneBeastCount() : 0;
        var capN = window.MUNDANE_PEN_CAP || 3;
        var copper = 0;
        try { copper = (dm() && typeof dm().getCopper === 'function') ? dm().getCopper() : ((cd() && cd().copper) || 0); } catch (e) {}
        var html = '<p class="text-xs text-gray-400 mb-2">牲口贩子的圈子，草料味混着马粪味。铜钱交易，概不赊账——'
            + '（厩里凡兽 ' + mundN + '/' + capN + ' 头 · 你身上 ' + copper + ' 铜钱）</p>';
        if (mundN >= capN) html += '<p class="text-xs text-amber-400 mb-2">厩满了——再想牵新的，先卖回一头。</p>';
        HM_STOCK.forEach(function (id) {
            var t = (window.BEAST_TEMPLATES || {})[id] || {};
            var q = st.inspected[id];
            var price = priceOf(id);
            var qLine = q
                ? '成色<b class="' + (q.adj > 0 ? 'text-green-400' : q.adj < 0 ? 'text-red-400' : 'text-gray-300') + '">' + q.name + '</b>（骑乘×' + (((t.mount && t.mount.speed) || 1) + q.adj).toFixed(1) + '）'
                : '成色未知——<span class="text-gray-500">相口齿一刻钟便知</span>（骑乘×' + ((t.mount && t.mount.speed) || 1) + ' 起底）';
            html += '<div class="bg-gray-900 rounded p-2 mb-1">'
                + '<div class="flex justify-between items-center">'
                + '<div><span class="text-sm text-white font-bold">🐴 ' + (t.name || id) + '</span>'
                + '<span class="text-xs text-gray-500 ml-2">' + qLine + ' · 每日草料 ' + (t.feedCopper || 2) + ' 铜</span></div>'
                + '<span class="text-xs text-yellow-300 font-bold">' + price + ' 铜钱' + (st.haggleOk[id] ? '（已砍下九折）' : '') + '</span>'
                + '</div>'
                + '<div class="flex gap-1 mt-1">'
                + (q ? '' : '<button onclick="hmInspect(\'' + id + '\')" class="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded">相口齿（15分钟）</button>')
                + (st.haggled[id] ? '' : '<button onclick="hmHaggle(\'' + id + '\')" class="text-xs bg-amber-800 hover:bg-amber-700 text-white px-2 py-1 rounded">砍价</button>')
                + '<button onclick="hmBuyBeast(\'' + id + '\')" class="text-xs bg-emerald-700 hover:bg-emerald-600 text-white px-2 py-1 rounded"' + (mundN >= capN ? ' disabled' : '') + '>买定牵走</button>'
                + '</div></div>';
        });
        // 谜之兽蛋（城+日播种——同日回访货色不变）
        if (eggInStock()) {
            html += '<div class="bg-gray-900 rounded p-2 mb-1 border border-purple-800/50">'
                + '<div class="flex justify-between items-center">'
                + '<div><span class="text-sm text-white font-bold">🥚 谜之兽蛋</span>'
                + '<span class="text-xs text-gray-500 ml-2">贩子压低了嗓门：「来路别问。贴身焐三日，出什么算什么——概不退换。」</span></div>'
                + '<button onclick="hmBuyEgg()" class="text-xs bg-purple-700 hover:bg-purple-600 text-white px-2 py-1 rounded">' + EGG_PRICE + ' 灵石</button>'
                + '</div></div>';
        }
        // 卖回柜台：厩里的凡兽 + 车马行挂出/牵回 + 郊外赛马入口
        var tb = window.tamedBeasts || [];
        var sells = '';
        for (var i = 0; i < tb.length; i++) {
            if (typeof window.isMundaneBeast === 'function' && window.isMundaneBeast(tb[i])) {
                var b = tb[i];
                var nm = (typeof window.beastDisplayName === 'function') ? window.beastDisplayName(b) : b.name;
                if (b.outToLivery) {
                    sells += '<div class="flex justify-between items-center bg-gray-800 rounded px-3 py-2 mb-1">'
                        + '<span class="text-sm text-gray-200">🛞 「' + nm + '」<span class="text-xs text-emerald-400 ml-1">挂车马行中 · 日挣约 ' + Math.max(1, Math.round((((b.mount && b.mount.speed) || 1) + (b.qualityAdj || 0)) * (b.thin ? 0.8 : 1) * 8)) + ' 铜</span>' + (b.thin ? '<span class="text-xs text-red-400 ml-1">拉车拉瘦了</span>' : '') + '</span>'
                        + '<button onclick="hmBringBack(' + i + ')" class="text-xs bg-cyan-800 hover:bg-cyan-700 text-white px-2 py-1 rounded">牵回来</button></div>';
                } else {
                    sells += '<div class="flex justify-between items-center bg-gray-800 rounded px-3 py-2 mb-1">'
                        + '<span class="text-sm text-gray-200">🐴 「' + nm + '」<span class="text-xs text-gray-500 ml-1">成色' + (b.qualityName || '中平') + (b.thin ? ' · 掉膘（车马行不收）' : '') + '</span></span>'
                        + '<span class="flex gap-1">'
                        + (b.thin ? '' : '<button onclick="hmHireOut(' + i + ')" class="text-xs bg-emerald-800 hover:bg-emerald-700 text-white px-2 py-1 rounded" title="挂车马行：每日结租钱，代价是它不在你缰绳底下，还有几率拉车拉瘦">挂车马行</button>')
                        + '<button onclick="openSellMundaneModal(' + i + ')" class="text-xs bg-amber-800 hover:bg-amber-700 text-white px-2 py-1 rounded">卖回</button>'
                        + '</span></div>';
                }
            }
        }
        if (sells) html += '<p class="text-xs text-gray-500 mt-3 mb-1">厩里的牲口（挂车马行挣租钱 / 半价卖回）：</p>' + sells;
        // 郊外赛马入口（河滩跑马场，每城每日一场）
        html += '<div class="flex gap-1 mt-3">'
            + '<button onclick="openHorseRace(\'mundane\')" class="flex-1 bg-orange-800 hover:bg-orange-700 text-white px-2 py-2 rounded text-sm">🏇 郊外赛马 · 凡兽会</button>'
            + '<button onclick="openHorseRace(\'spirit\')" class="flex-1 bg-purple-800 hover:bg-purple-700 text-white px-2 py-2 rounded text-sm">🏇 郊外赛马 · 灵兽会</button>'
            + '</div>';
        window.showModal('🐴 马市 · 凡俗牲口', html);
    };

    window.HorseMarket = {
        open: window.openHorseMarket,
        qualityOf: qualityOf,
        eggInStock: eggInStock,
        EGG_ID: EGG_ID,
        eggHatchTick: eggHatchTick,
        liveryTick: liveryTick,
        liveryRentOf: liveryRentOf,
        raceOf: raceOf,
        myRaceMount: myRaceMount,
        oddsOf: oddsOf
    };
})();
