/**
 * v25.7 市井烟火批（第一百四十九批）——玩家点单六路市井小玩法 + 丐帮眼线 amendment，一次立项。
 *
 *   A 市井总门+街头闲逛：救活 exploreCity 孤儿码（面板终于有按钮按得到它），面熟账按天记趟
 *     （3 点头 / 6 掏心窝子递真行情 / 10 街面认下你），路上一成五几率撞见乞丐（转交 F 段正门）；
 *   B 澡堂洗尘：三档汤一笔结算（钱不够整单不成），压毒借野外睡卧导引正门，香汤一日一闸（真 actionGate）；
 *   C 下馆子：饱食度正门（辟谷/吃撑诚实拒绝、钱不扣），招牌菜吃 cityData.specialties 真源、
 *     带短时小加成（activeBuffs 通用账，到期自散），每城每日一桌；
 *   D 赌坊骰子：围骰庄家通吃（优势≈2.8% 明账），连赢三把开雅间、六把拉黑禁三日，
 *     每日止损/止赢封顶（落档防刷钱），钱一笔结清不欠账；
 *   E 书肆淘书：货架按城+日播种现算（零骰、同日同架），读书长生活技能，学识掷骰捡漏功法残页
 *     （KnowledgeSystem 'heard' 正门，与奇遇辨认残页同口径）；
 *   F 街角施舍（丐帮眼线）：三档施舍走 RewardService 一笔账，「丐帮缘分」三档台阶——
 *     3 认脸递真行情 / 10 耳目认情（watchDiscount：押货截道-4%、洞府夜袭-3%，两侧带守卫接线）/
 *     25 长老现身；丐帮弟子行善记门派贡献（污衣派多认一分）、每日一次为限。
 *
 * 钉法：六本新账整文件沙箱真跑（真 action-gates.js / 真 satiety.js 陪跑）+ 源码钉位，
 *       F15/F16 把 caravan-trade.js / cave-siege.js 整文件拉进沙箱验让风真生效，
 *       G 段四发反向探针（改源重跑，证明尺钉的是行为不是摆设）。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
let passed = 0, failed = 0;
function ok(cond, label) {
    if (cond) passed++;
    else { failed++; console.log('[FAIL] ' + label); }
}
function load(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

console.log('\n========== v25.7 市井烟火批 ==========');

// 通用沙箱：W.window=W，Math.random 走队列，setTimeout 立即执行（v25.6 同款）
function makeWorld(rand, stubs) {
    const W = Object.assign({
        console: { log: () => {}, warn: () => {}, error: () => {} },
        setTimeout: (fn) => { fn(); return 0; },
        Math: Object.create(Math)
    }, stubs || {});
    W.Math.random = Array.isArray(rand) ? (() => { let i = 0; return () => (i < rand.length ? rand[i++] : rand[rand.length - 1]); })() : (() => rand);
    W.window = W;
    vm.createContext(W);
    return W;
}

// 城况真源桩（楼/特产照 location-system 的格式）
const CITY_DB = {
    '洛水城': { buildings: ['inn', 'tavern', 'shop', 'market'], specialties: ['洛水锦鲤', '文房四宝', '字画'] },
    '帝都·长安': { buildings: ['shop', 'tavern'], specialties: ['皇家贡品', '御用丹药', '宫廷秘法'] },
    '太虚山': { buildings: ['temple'], specialties: [] }
};

// RewardService 桩：带钱包与行囊校验的诚实结算（钱/货不够整单不成——与真通道同口径）
function makeRewardStub(W, wallet, applied) {
    W.RewardService = {
        apply: function (spec, ctx) {
            spec = spec || {};
            const takes = spec.take || [];
            const slots = (W.inventory && W.inventory.slots) || [];
            for (const t of takes) {
                const s = slots.find((x) => x && (x.templateId || x.id) === t.itemId && Number(x.count) >= t.count);
                if (!s) return { success: false, reason: 'missing_item', messages: [] };
            }
            if (spec.copper < 0 && wallet.copper < -spec.copper) return { success: false, reason: 'copper', messages: [] };
            if (spec.spiritStones < 0 && wallet.stones < -spec.spiritStones) return { success: false, reason: 'spiritStones', messages: [] };
            for (const t of takes) {
                const s = slots.find((x) => x && (x.templateId || x.id) === t.itemId && Number(x.count) >= t.count);
                s.count -= t.count;
            }
            if (spec.copper) wallet.copper += spec.copper;
            if (spec.spiritStones) wallet.stones += spec.spiritStones;
            const msgs = [];
            ['mood', 'energy', 'health', 'karma', 'fame', 'rep'].forEach((k) => { if (spec[k]) msgs.push(k + (spec[k] > 0 ? '+' : '') + spec[k]); });
            if (spec.copper) msgs.push('铜钱' + spec.copper);
            if (spec.spiritStones) msgs.push('灵石' + spec.spiritStones);
            if (spec.lifeSkill) msgs.push(spec.lifeSkill.name + '+' + spec.lifeSkill.exp);
            applied.push({ spec: spec, ctx: ctx || {} });
            return { success: true, messages: msgs };
        }
    };
}

// 市井模块通用世界：六本新账共享一套桩
function streetMod(rand, file, opts) {
    opts = opts || {};
    const wallet = { copper: opts.copper != null ? opts.copper : 100, stones: opts.stones != null ? opts.stones : 10 };
    const applied = [], msgs = [], logs = [], times = [], dialogs = [], deeds = [], journal = [], grown = [], unlocked = [], contribs = [], reliefs = [], explored = [], encounters = [];
    let day = opts.day != null ? opts.day : 5;
    const reg = {};
    const W = makeWorld(rand, {
        showMessage: (t) => msgs.push(String(t)),
        gameLog: { add: (m) => logs.push(String(m)) },
        showBuildingEffectDialog: (t, h) => { dialogs.push({ title: String(t), html: String(h) }); },
        closeBuildingDialog: () => {},
        updateCharacterStatus: () => {},
        currentCharData: Object.assign({ name: '李长生', realm: '金丹', location: opts.loc || '洛水城', energy: 100, maxEnergy: 100, mood: 60, health: 80, maxHealth: 100, karma: 0, _satiety: 50 }, opts.cd || {}),
        locationSystem: { getCityData: (ct) => CITY_DB[String(ct == null ? '' : ct).replace(/\s+/g, '')] || null },
        timeSystem: { advanceTime: (m, r) => { times.push([m, r]); }, getAbsoluteDay: () => day, onNewDaySubscribe: (fn) => { W._newDay = fn; } },
        getAbsoluteDay: () => day,
        WorldCalendar: { get day() { return day; } },
        MarketDynamic: opts.MD === null ? undefined : {
            CITIES: ['中州', '南疆'], CATEGORIES: ['丹药', '药材'],
            priceMul: (r, c) => (r === '南疆' && c === '药材' ? 1.5 : 1.0),
            listActiveEvents: () => []
        },
        GameScheduler: { nowMinute: () => 1000 },
        inventory: { slots: opts.slots || [], currency: wallet },
        itemById: opts.itemById || {},
        StateRegistry: { register: (k, h) => { reg[k] = h; } },
        playerPushDeed: (m, s) => deeds.push([m, s]),
        WorldJournal: { record: (e) => journal.push(e) },
        getLifeSkill: (n) => (opts.lifeSkills && opts.lifeSkills[n]) || 0,
        growLifeSkill: (n, e) => { grown.push([n, e]); return e; },
        KnowledgeSystem: { unlock: (id, st, meta) => { unlocked.push([id, st, meta]); return { id: id }; } },
        sectAddContribution: (n, r) => { contribs.push([n, r]); return n; },
        wildMapApi: { relief: { sleep: (p, s, pa) => { reliefs.push([p, s, pa]); return p > 0 ? ['毒气压下去一截'] : null; } } },
        getCitizenGossip: opts.gossip === null ? undefined : (() => [{ text: '城东老王家的牛丢了', type: 'life' }])
    });
    if (opts.skillPages !== null) W.skillPages = opts.skillPages || [{ id: 'art_liuyun', name: '流云剑法' }];
    makeRewardStub(W, wallet, applied);
    if (opts.loadActionGate) vm.runInContext(load('js/core/action-gates.js'), W, { filename: 'action-gates' });
    if (opts.loadSatiety) vm.runInContext(load('js/core/satiety.js'), W, { filename: 'satiety' });
    vm.runInContext(opts.src || load(file), W, { filename: file });
    W._setDay = (d) => { day = d; };
    W._explored = explored;
    W._encounters = encounters;
    return { W, wallet, applied, msgs, logs, times, dialogs, reg, deeds, journal, grown, unlocked, contribs, reliefs, explored, encounters };
}
function lastSpec(w) { return w.applied.length ? w.applied[w.applied.length - 1].spec : null; }

const SRC = {
    street: load('js/city-facilities/street-life.js'),
    bath: load('js/city-facilities/bathhouse.js'),
    eat: load('js/city-facilities/eatery.js'),
    den: load('js/city-facilities/gamble-den.js'),
    book: load('js/city-facilities/bookshop.js'),
    alms: load('js/city-facilities/beggar-alms.js'),
    loc: load('js/location-system.js'),
    caravan: load('js/economy/caravan-trade.js'),
    siege: load('js/extensions/cave-siege.js')
};

// ============ A 市井总门 + 街头闲逛 ============
console.log('\n[A] 市井总门 + 街头闲逛（孤儿码救活 · 面熟账）');
{
    ok(SRC.loc.indexOf('window.StreetLife && typeof window.StreetLife.panelHtml') >= 0, 'A1 城市面板接了市井烟火口（照摆摊/赁屋/招工同款特征检测惯例）');
    ok(SRC.street.indexOf('.setItem') < 0 && SRC.street.indexOf('.getItem') < 0 && SRC.street.indexOf('StateRegistry.register') >= 0, 'A2 面熟账走 StateRegistry 正门——全文件零 localStorage 读写（头注里提一嘴那个词不算数）');
    ok(SRC.loc.indexOf("window.openCityShop('special')") >= 0 && SRC.loc.indexOf('window.openCityShop(cityName)') < 0, 'A14 隐藏小店修正口径：openCityShop 吃店铺类型串（此前误传城名），稀奇古怪的东西走 special 柜');
    ok(SRC.loc.indexOf('window.getCitizenGossip = function') >= 0, 'A15 市民闲话池开了只读窗（账主开窗，澡堂/闲逛/施舍借它说人话，不许自抄）');

    const w1 = streetMod(0.5, 'js/city-facilities/street-life.js');
    w1.W.exploreCity = (ct) => { w1.explored.push(ct); };
    ok(w1.W.StreetLife.wander() === true && w1.explored[0] === '洛水城', 'A3 上街走走 → exploreCity 孤儿码正门被按到（四出戏开演，本账不重写它）');
    ok(w1.W.currentCharData.energy === 95, 'A5a 闲逛耗精力 5（100→95）');
    ok(w1.times.length === 0, 'A5b 时辰由四出戏自己扣——本账不重复扣');
    const w2 = streetMod(0.5, 'js/city-facilities/street-life.js');
    w2.W.StreetLife.wander();
    ok(w2.times.some((t) => t[0] === 20 && t[1] === '街头闲逛'), 'A4 四出戏不在位 → 自家兜底扣 20 分钟，不白逛');

    // 面熟账：3/6/10 三档，每日最多记三回
    const w3 = streetMod(0.5, 'js/city-facilities/street-life.js');
    w3.W.exploreCity = () => {};
    for (let i = 0; i < 4; i++) w3.W.StreetLife.wander();
    ok(w3.W.StreetLife.familiarCount('洛水城') === 3, 'A5 每日最多记三回面熟——第四趟照逛，交情不涨（刷步数刷不出交情）');
    ok(w3.applied.some((a) => a.spec.mood === 1), 'A6 面熟 3：街坊点头（心境+1，一次性）');
    w3.W._setDay(6);
    for (let i = 0; i < 3; i++) w3.W.StreetLife.wander();
    ok(w3.W.StreetLife.familiarCount('洛水城') === 6, 'A7a 换日接着逛，面熟攒到 6');
    ok(w3.msgs.concat(w3.logs).some((m) => m.indexOf('南疆') >= 0 && m.indexOf('药材') >= 0), 'A7 面熟 6：老街坊掏心窝子递**真行情**（吃 MarketDynamic 现账——南疆药材 1.5 倍，不编假消息）');
    w3.W._setDay(7);
    for (let i = 0; i < 3; i++) w3.W.StreetLife.wander();
    w3.W._setDay(8);
    w3.W.StreetLife.wander();
    ok(w3.W.StreetLife.familiarCount('洛水城') === 10 && w3.applied.some((a) => a.spec.rep === 1), 'A8 面熟 10：街面认下你（本城声望+1，一次性）');
    ok(w3.applied.filter((a) => a.spec.mood === 1).length === 1 && w3.applied.filter((a) => a.spec.rep === 1).length === 1, 'A8b 三档里程碑各只放一次——再逛不刷');

    // 乞丐遭遇
    const w4 = streetMod(0.1, 'js/city-facilities/street-life.js');
    w4.W.exploreCity = () => {};
    w4.W.BeggarAlms = { encounter: (ct) => { w4.encounters.push(ct); } };
    w4.W.StreetLife.wander();
    ok(w4.encounters[0] === '洛水城', 'A9 闲逛骰中（0.1<0.15）→ 街角乞丐撞见了（转交施舍正门）');
    const w5 = streetMod(0.5, 'js/city-facilities/street-life.js');
    w5.W.exploreCity = () => {};
    w5.W.BeggarAlms = { encounter: (ct) => { w5.encounters.push(ct); } };
    w5.W.StreetLife.wander();
    ok(w5.encounters.length === 0, 'A9b 骰子不过（0.5≥0.15）→ 这趟街上太平');

    // 守卫与存档
    const w6 = streetMod(0.5, 'js/city-facilities/street-life.js', { cd: { location: '' } });
    ok(w6.W.StreetLife.wander() === false, 'A10a 人在城外野地，逛不了街');
    const w7 = streetMod(0.5, 'js/city-facilities/street-life.js', { cd: { energy: 3 } });
    w7.W.exploreCity = () => {};
    ok(w7.W.StreetLife.wander() === false, 'A10b 精力不济（3<5），腿抬不动');
    const snap = w3.reg.streetLife.export();
    ok(snap.familiar['洛水城'] && snap.familiar['洛水城'].n === 10 && snap.familiar['洛水城'].m10 === true, 'A11a 面熟账随 StateRegistry『streetLife』导出（含三档里程碑旗）');
    const w8 = streetMod(0.5, 'js/city-facilities/street-life.js');
    w8.reg.streetLife.import(snap);
    ok(w8.W.StreetLife.familiarCount('洛水城') === 10, 'A11 读档回来，面熟还是十分——街坊没失忆');

    // 菜单与面板口
    const w9 = streetMod(0.5, 'js/city-facilities/street-life.js');
    w9.W.CityBath = {}; w9.W.CityEatery = {}; w9.W.GambleDen = {}; w9.W.CityBookshop = {}; w9.W.BeggarAlms = {};
    w9.W.StreetLife.open();
    const menu = w9.dialogs[w9.dialogs.length - 1].html;
    ok(menu.indexOf('StreetLife.wander()') >= 0 && menu.indexOf('CityBath.open()') >= 0 && menu.indexOf('CityEatery.open()') >= 0 && menu.indexOf('GambleDen.open()') >= 0 && menu.indexOf('CityBookshop.open()') >= 0 && menu.indexOf('BeggarAlms.open()') >= 0, 'A12 市井烟火菜单：六路小玩法一扇门（各家有各家的账本，菜单只递话）');
    ok(w9.W.StreetLife.panelHtml('洛水城').indexOf('StreetLife.open()') >= 0 && w9.W.StreetLife.panelHtml('帝都·长安') === '', 'A13 面板口只挂在你脚下那座城（异地面板不冒按钮）');
}

// ============ B 澡堂洗尘 ============
console.log('\n[B] 澡堂洗尘（三档汤 · 压毒走睡卧导引正门 · 香汤一日一闸）');
{
    const w1 = streetMod(0.9, 'js/city-facilities/bathhouse.js');
    ok(w1.W.CityBath.TIERS.length === 3 && w1.W.CityBath.TIERS[0].copper === 5 && w1.W.CityBath.TIERS[2].stones === 2, 'B1 三档汤牌价：粗澡 5 铜 / 热汤 30 铜 / 灵泉香汤 2 灵石');
    ok(w1.W.CityBath.bathe('scrub') === true && w1.wallet.copper === 95, 'B2a 粗澡搓背：5 铜真扣');
    const sp = lastSpec(w1);
    ok(sp.energy === 10 && sp.mood === 3 && w1.times.some((t) => t[0] === 30 && t[1] === '澡堂泡汤'), 'B2 精力+10 心境+3 与汤钱同一笔结算，半个时辰真扣');
    const w2 = streetMod(0.9, 'js/city-facilities/bathhouse.js', { copper: 2 });
    ok(w2.W.CityBath.bathe('scrub') === false && w2.wallet.copper === 2 && w2.applied.length === 0, 'B3 汤钱凑不出整单不成——钱一分没动，不会出现扣了钱没泡上');
    const w3 = streetMod(0.9, 'js/city-facilities/bathhouse.js');
    w3.W.CityBath.bathe('soak');
    ok(w3.reliefs[0] && w3.reliefs[0][0] === 20 && w3.reliefs[0][1] === 10 && w3.reliefs[0][2] === 10, 'B4a 热汤压毒走 wildMapApi.relief.sleep 正门（20/10/10——比客栈床铺浅、比柴房深）');
    ok(w3.msgs.concat(w3.logs).some((m) => m.indexOf('热水拔毒') >= 0), 'B4 压掉多少如实报——不暗中开挂');
    const w4 = streetMod(0.9, 'js/city-facilities/bathhouse.js', { loadActionGate: true });
    ok(w4.W.CityBath.bathe('spirit') === true && w4.wallet.stones === 8, 'B5a 灵泉香汤：2 灵石真扣');
    ok(w4.W.CityBath.bathe('spirit') === false && w4.wallet.stones === 8, 'B5 香汤一日一闸（真 action-gates.js 陪跑）——同日第二回拦下，钱不再扣');
    w4.W._setDay(6);
    ok(w4.W.CityBath.bathe('spirit') === true && w4.wallet.stones === 6, 'B5b 换日汤池灵气缓过来了，照常泡');
    const w5 = streetMod(0.1, 'js/city-facilities/bathhouse.js');
    w5.W.CityBath.bathe('scrub');
    ok(w5.msgs.concat(w5.logs).some((m) => m.indexOf('城东老王家的牛丢了') >= 0), 'B6 泡汤听邻桶赤膊闲话（骰中 0.1<0.4；吃市民闲话池只读窗，不自抄）');
    const w6 = streetMod(0.9, 'js/city-facilities/bathhouse.js', { loc: '太虚山' });
    ok(w6.W.CityBath.bathe('scrub') === false && w6.msgs.some((m) => m.indexOf('没有澡堂') >= 0), 'B7 仙山佛窟没这营生——澡堂跟着人烟走');
    const w7 = streetMod(0.9, 'js/city-facilities/bathhouse.js', { loadActionGate: true });
    w7.W.CityBath.bathe('spirit');
    w7.W.CityBath.open();
    ok(w7.dialogs[w7.dialogs.length - 1].html.indexOf('今日已泡过') >= 0, 'B8 牌面诚实：香汤泡过了就写明「今日已泡过」');
    ok(w7.W.CityBath.panelHtml('洛水城') === '', 'B9 澡堂不单占面板一行——收进市井烟火总门');
    ok(SRC.bath.indexOf('localStorage') < 0, 'B10 一日闸挂 charData._actionCd 随角色档走——零新存档键');
}

// ============ C 下馆子 ============
console.log('\n[C] 下馆子（饱食度正门 · 特产真源入菜 · 短时小加成）');
{
    const w1 = streetMod(0.9, 'js/city-facilities/eatery.js', { loadSatiety: true, cd: { _satiety: 90 } });
    ok(w1.W.CityEatery.eat('home') === false && w1.wallet.copper === 100 && w1.msgs.some((m) => m.indexOf('撑') >= 0), 'C1 吃撑了塞不进——诚实拒绝，钱一分不扣（真 satiety.js 陪跑）');
    const w2 = streetMod(0.9, 'js/city-facilities/eatery.js', { loadSatiety: true, cd: { _fastUntilDay: 99 } });
    ok(w2.W.CityEatery.eat('home') === false && w2.msgs.some((m) => m.indexOf('辟谷') >= 0), 'C2 辟谷期中烟火食不入喉——掌柜见怪不怪收菜单');
    const w3 = streetMod(0.9, 'js/city-facilities/eatery.js', { loadSatiety: true });
    ok(w3.W.CityEatery.eat('home') === true && w3.wallet.copper === 90 && w3.W.satietySystem.get() === 78, 'C3 家常饭：10 铜、饱食 50→78（+28 与吃干粮同一口径）、精力+20 一笔结清');
    ok(w3.W.CityEatery.specialDish('洛水城').name === '洛水锦鲤' && w3.W.CityEatery.specialDish('帝都·长安').name === '老店招牌菜', 'C4 招牌菜吃 specialties 真源：洛水有锦鲤下锅、长安的贡品丹药秘法进不了锅（退回通用招牌）');
    const w4 = streetMod(0.9, 'js/city-facilities/eatery.js', { loadSatiety: true });
    ok(w4.W.CityEatery.eat('special') === true && w4.wallet.copper === 50, 'C5a 本帮招牌「洛水锦鲤」：50 铜真扣');
    const buf = w4.W.activeBuffs && w4.W.activeBuffs['eatery_special'];
    ok(buf && buf.effects.strength === 0.04 && buf.effects.constitution === 0.04 && buf.expiryGameMinute === 1000 + 240, 'C5 短时小加成走 activeBuffs 通用账：力量/体质各+4%、四个游戏小时到期自散（不开永久战力口子）');
    w4.W.currentCharData._satiety = 50;   // 肚子腾出来——不然 C6 拦下的是「吃撑」而不是「当日旗」，就钉错闸了
    ok(w4.W.CityEatery.eat('special') === false && w4.wallet.copper === 50, 'C6 每城每日一桌——同日第二桌拦下（拦的是当日旗不是肚子），钱不扣');
    w4.W.currentCharData.location = '帝都·长安';
    w4.W.currentCharData._satiety = 50;
    ok(w4.W.CityEatery.eat('special') === true && w4.wallet.copper === 0, 'C6b 换城另算一桌（长安的老店招牌照上）');
    w4.W._setDay(6);
    w4.W.currentCharData.location = '洛水城';
    w4.W.currentCharData._satiety = 50;
    w4.wallet.copper = 100;
    ok(w4.W.CityEatery.eat('special') === true, 'C6c 换日老地方再点一桌，照常');
    const w5 = streetMod(0.9, 'js/city-facilities/eatery.js', { loadSatiety: true, copper: 20 });
    ok(w5.W.CityEatery.eat('special') === false && w5.wallet.copper === 20 && w5.W.CityEatery.eat('home') === true && w5.wallet.copper === 10, 'C7 付不起席面付得起家常饭——各拒各的，账不糊');
    const w6 = streetMod(0.9, 'js/city-facilities/eatery.js', { loc: '太虚山' });
    ok(w6.W.CityEatery.eat('home') === false, 'C8 没有酒楼的地界下不了馆子');
    ok(SRC.eat.indexOf('localStorage') < 0, 'C9 招牌当日旗是运行时旗（庙会节令小吃同款口径）——零新存档键');
}

// ============ D 赌坊骰子 ============
console.log('\n[D] 赌坊骰子（围骰通吃 · 雅间 · 黑名单 · 每日封顶）');
{
    const bigWin = [0.9, 0.9, 0.5];    // 6,6,4 = 16 大，非围骰
    const smallDice = [0.1, 0.2, 0.1]; // 1,2,1 = 4 小，非围骰
    const triple = [0.5, 0.5, 0.5];    // 4,4,4 围骰
    const w1 = streetMod(triple, 'js/city-facilities/gamble-den.js');
    ok(w1.W.GambleDen.bet('copper', 'big', 0) === true && w1.wallet.copper === 90, 'D1a 围骰（4,4,4 总点 12）——押大也输：庄家通吃，10 铜落袋');
    ok(w1.msgs.some((m) => m.indexOf('围骰') >= 0) && w1.W.GambleDen.state().copperNet === -10, 'D1 围骰在话里点名、净账如实记 -10');
    const w2 = streetMod(bigWin, 'js/city-facilities/gamble-den.js');
    w2.W.GambleDen.bet('copper', 'big', 0);
    ok(w2.wallet.copper === 110 && w2.W.GambleDen.state().streak === 1, 'D2 6,6,4=16 押大 → 赢：赔一比一（净+10），连赢记 1');
    const w3 = streetMod(smallDice, 'js/city-facilities/gamble-den.js');
    w3.W.GambleDen.bet('copper', 'small', 0);
    ok(w3.wallet.copper === 110, 'D3 1,2,1=4 押小 → 赢');
    const w4 = streetMod(bigWin, 'js/city-facilities/gamble-den.js');
    w4.W.GambleDen.bet('copper', 'small', 0);
    ok(w4.wallet.copper === 90 && w4.W.GambleDen.state().streak === 0, 'D4 开大押小 → 输，连赢清零');
    const w5 = streetMod(bigWin, 'js/city-facilities/gamble-den.js');
    ok(w5.W.GambleDen.bet('stone', 'big', 0) === false && w5.msgs.some((m) => m.indexOf('雅间') >= 0), 'D5 雅间帘子放着——没连赢三把押不了灵石');
    const w6 = streetMod(Array.from({ length: 21 }, (_, i) => bigWin[i % 3]), 'js/city-facilities/gamble-den.js');
    for (let i = 0; i < 3; i++) w6.W.GambleDen.bet('copper', 'big', 0);
    ok(w6.W.GambleDen.state().vip === true, 'D6a 连赢三把，雅间开门（一次性解锁，落档）');
    w6.W.GambleDen.bet('stone', 'big', 0);
    ok(w6.wallet.stones === 11 && w6.W.GambleDen.state().stoneNet === 1, 'D6 雅间押 1 灵石赢一把——灵石桌真开张');
    const w7 = streetMod(Array.from({ length: 21 }, (_, i) => bigWin[i % 3]), 'js/city-facilities/gamble-den.js');
    for (let i = 0; i < 6; i++) w7.W.GambleDen.bet('copper', 'big', 0);
    const st7 = w7.W.GambleDen.state();
    ok(st7.bannedUntil === 8 && st7.streak === 0, 'D7a 连赢六把被列入黑名单：禁到第 8 日、连赢清零');
    ok(w7.deeds.some((d) => d[0] === 'good' && d[1].indexOf('连赢六把') >= 0), 'D7b 拉黑这段风流进传闻池（街面上要议论三天）');
    ok(w7.W.GambleDen.bet('copper', 'big', 0) === false && w7.msgs.some((m) => m.indexOf('黑名单') >= 0), 'D7 禁入期内门口的伙计认得你');
    w7.W._setDay(8);
    ok(w7.W.GambleDen.bet('copper', 'big', 0) === false, 'D7c 第 8 日还没销（禁满三日）');
    w7.W._setDay(9);
    ok(w7.W.GambleDen.bet('copper', 'big', 0) === true, 'D7d 第 9 日黑名单销了，照常开盘');
    const w8 = streetMod(bigWin, 'js/city-facilities/gamble-den.js');
    w8.reg.gambleDen.import({ day: 5, copperNet: -300, stoneNet: 0, streak: 0, bestStreak: 0, plays: 9, bannedUntil: -1, vip: false, lastRoll: null });
    ok(w8.W.GambleDen.bet('copper', 'big', 0) === false && w8.msgs.some((m) => m.indexOf('输到底') >= 0), 'D8 每日止损：铜桌净输满 300，庄家请你明日再来（防上头）');
    const w9 = streetMod(bigWin, 'js/city-facilities/gamble-den.js');
    w9.reg.gambleDen.import({ day: 5, copperNet: 500, stoneNet: 0, streak: 1, bestStreak: 2, plays: 20, bannedUntil: -1, vip: false, lastRoll: null });
    ok(w9.W.GambleDen.bet('copper', 'big', 0) === false && w9.msgs.some((m) => m.indexOf('赢得太多') >= 0), 'D9 每日止赢：净赢满 500，柜上现钱不凑手（也防刷钱）');
    const w10 = streetMod(bigWin, 'js/city-facilities/gamble-den.js');
    w10.reg.gambleDen.import({ day: 4, copperNet: 111, stoneNet: 0, streak: 2, bestStreak: 4, plays: 8, bannedUntil: -1, vip: true, lastRoll: null });
    w10.W._setDay(5);
    w10.W.GambleDen.bet('copper', 'big', 0);
    const st10 = w10.W.GambleDen.state();
    ok(st10.copperNet === 10 && st10.streak === 3 && st10.bestStreak === 4 && st10.vip === true, 'D10 换日净账翻页（111→+10），连赢/雅间跨天作数——赌坊记性长');
    const w11 = streetMod(smallDice, 'js/city-facilities/gamble-den.js', { copper: 5 });
    ok(w11.W.GambleDen.bet('copper', 'big', 0) === false && w11.wallet.copper === 5 && w11.msgs.some((m) => m.indexOf('本钱不够') >= 0), 'D11 押大开小要赔 10 铜、兜里只有 5——整单不成，本金一个子没动（不欠账）');
    const snap = w10.reg.gambleDen.export();
    const w12 = streetMod(0.9, 'js/city-facilities/gamble-den.js');
    w12.reg.gambleDen.import(snap);
    ok(w12.W.GambleDen.state().vip === true && w12.W.GambleDen.state().bestStreak === 4, 'D12 赌账随 StateRegistry『gambleDen』往返——读档不销黑名单不赖账');
    const w13 = streetMod(bigWin, 'js/city-facilities/gamble-den.js');
    w13.W.GambleDen.open();
    ok(w13.dialogs[w13.dialogs.length - 1].html.indexOf('2.8%') >= 0, 'D13 牌面明写庄家优势≈2.8%——久赌必输是明账，不藏');
    ok(SRC.den.indexOf('localStorage') < 0, 'D14 赌账走 StateRegistry——零新 localStorage 键');
}

// ============ E 书肆淘书 ============
console.log('\n[E] 书肆淘书（城+日播种货架 · 学识捡漏残页）');
{
    const w1 = streetMod(0.99, 'js/city-facilities/bookshop.js');
    const shelfA = w1.W.CityBookshop.todayShelf('洛水城').map((r) => r.book.id);
    const w1b = streetMod(0.1, 'js/city-facilities/bookshop.js');
    const shelfB = w1b.W.CityBookshop.todayShelf('洛水城').map((r) => r.book.id);
    ok(shelfA.length === 5 && new Set(shelfA).size === 5 && shelfA.join() === shelfB.join(), 'E1 货架按城+日播种现算：五本不重样、跨世界同日同城同一架（零骰——书肆不是转盘）');
    const book0 = w1.W.CityBookshop.todayShelf('洛水城')[0].book;
    ok(w1.W.CityBookshop.buy(w1.W.CityBookshop.todayShelf('洛水城')[0].slotIdx) === true && w1.wallet.copper === 100 - book0.price, 'E2a 买下「' + book0.name + '」：书资真扣');
    const sp = lastSpec(w1);
    ok(sp.lifeSkill && sp.lifeSkill.name === book0.skill && sp.lifeSkill.exp === book0.exp && w1.times.some((t) => t[0] === 30 && t[1] === '书肆翻读'), 'E2 当场翻读长对应的生活技能（RewardService 统一通道），半个时辰真扣');
    ok(w1.W.CityBookshop.buy(w1.W.CityBookshop.todayShelf('洛水城')[0].slotIdx) === false, 'E3 当日当城买过的书划掉——刷不了同一本');
    const w2 = streetMod([0.3, 0.5], 'js/city-facilities/bookshop.js', { lifeSkills: { '学识': 100 } });
    const slotIdx = w2.W.CityBookshop.todayShelf('洛水城')[0].slotIdx;
    w2.W.CityBookshop.buy(slotIdx);
    ok(w2.unlocked.length === 1 && w2.unlocked[0][0] === 'art_liuyun' && w2.unlocked[0][1] === 'heard' && w2.unlocked[0][2].source === 'bookshop', 'E4 学识 100 → 捡漏率 6%+40%=46%，骰中（0.3）：书里抖出「流云剑法」残页——KnowledgeSystem heard 正门（与奇遇辨认残页同口径）');
    ok(w2.grown.some((g) => g[0] === '学识' && g[1] === 2) && w2.msgs.concat(w2.logs).some((m) => m.indexOf('残页') >= 0), 'E4b 捡漏反哺学识+2，喜讯如实上屏');
    const w3 = streetMod([0.9], 'js/city-facilities/bookshop.js', { lifeSkills: { '学识': 100 } });
    w3.W.CityBookshop.buy(w3.W.CityBookshop.todayShelf('洛水城')[0].slotIdx);
    ok(w3.unlocked.length === 0, 'E5 骰子不过（0.9≥0.46）→ 这就是本普通旧书，不硬塞残页');
    const w4 = streetMod([0.0], 'js/city-facilities/bookshop.js', { skillPages: [] });
    ok(w4.W.CityBookshop.buy(w4.W.CityBookshop.todayShelf('洛水城')[0].slotIdx) === true && w4.unlocked.length === 0, 'E6 残页账（skillPages/KnowledgeSystem）不在位 → 捡漏静默失手，买书照常不成错账');
    const rares = w1.W.CityBookshop.BOOKS.filter((b) => b.rare);
    ok(rares.length >= 3 && rares.every((b) => b.price >= 20 && b.exp >= 4), 'E7 珍本档：价三倍长进三倍（书架上混着，眼力自己挑）');
    const w5 = streetMod(0.99, 'js/city-facilities/bookshop.js', { copper: 1 });
    const si5 = w5.W.CityBookshop.todayShelf('洛水城')[0].slotIdx;
    ok(w5.W.CityBookshop.buy(si5) === false && w5.wallet.copper === 1 && Object.keys(w5.W.CityBookshop.state().bought).length === 0, 'E8 书资凑不出 → 书轻轻放回架上，不买断不欠账');
    const snap = w1.reg.bookshop.export();
    ok(snap.lastCity === '洛水城' && Object.keys(snap.bought).length === 1, 'E9a 当日已读账随 StateRegistry『bookshop』导出');
    const w6 = streetMod(0.99, 'js/city-facilities/bookshop.js');
    w6.reg.bookshop.import(snap);
    w6.W._setDay(6);
    ok(w6.W.CityBookshop.buy(w6.W.CityBookshop.todayShelf('洛水城')[0].slotIdx) === true, 'E9 换日书架翻新、旧账翻页——昨日读过的不挡今日的新货');
    ok(SRC.book.indexOf('localStorage') < 0, 'E10 零新 localStorage 键');
}

// ============ F 街角施舍（丐帮眼线账） ============
console.log('\n[F] 街角施舍（丐帮眼线 · 缘分三档 · 弟子记功 · 耳目递话）');
{
    const foodSlots = () => [{ uid: 'f1', templateId: 'food_bun', count: 2 }];
    const foodDb = { food_bun: { id: 'food_bun', name: '馒头', subtype: 'food', type: 'consumable', price: 2 } };
    const w1 = streetMod(0.9, 'js/city-facilities/beggar-alms.js');
    ok(w1.W.BeggarAlms.give('copper') === true && w1.wallet.copper === 98 && w1.W.BeggarAlms.goodwill() === 2, 'F1 施舍铜板：2 铜真扣、缘分+2');
    const sp1 = lastSpec(w1);
    ok(sp1.karma === 1 && sp1.mood === 1, 'F1b 业障+1 心境+1 与铜板同一笔结算（善行有真账）');
    const w2 = streetMod(0.9, 'js/city-facilities/beggar-alms.js', { slots: foodSlots(), itemById: foodDb });
    ok(w2.W.BeggarAlms.give('food') === true && w2.W.inventory.slots[0].count === 1 && lastSpec(w2).karma === 2, 'F2 施舍干粮：行囊里真扣一件吃食（业障+2）');
    const w2b = streetMod(0.9, 'js/city-facilities/beggar-alms.js');
    ok(w2b.W.BeggarAlms.give('food') === false && w2b.msgs.some((m) => m.indexOf('吃食') >= 0), 'F2b 行囊里没有吃食——不能把空碗递给空碗（如实说，不硬扣）');
    const w3 = streetMod(0.9, 'js/city-facilities/beggar-alms.js');
    ok(w3.W.BeggarAlms.give('stone') === true && w3.wallet.stones === 9 && w3.W.BeggarAlms.goodwill() === 5 && lastSpec(w3).karma === 3, 'F3 施舍灵石：1 灵石、业障+3、缘分+5——「这不是施舍，是结善缘」');
    const w4 = streetMod(0.9, 'js/city-facilities/beggar-alms.js', { copper: 500 });
    w4.W.BeggarAlms.give('copper'); w4.W.BeggarAlms.give('copper'); w4.W.BeggarAlms.give('copper');
    ok(w4.W.BeggarAlms.give('copper') === false && w4.msgs.some((m) => m.indexOf('心到就够了') >= 0), 'F4 非弟子每日三回为限——善行贵在诚不在刷');
    ok(w4.deeds.some((d) => d[0] === 'good' && d[1].indexOf('施舍') >= 0), 'F7b 缘分到 3：善人的名声进了传闻池（只此一笔）');
    ok(w4.msgs.concat(w4.logs).some((m) => m.indexOf('南疆') >= 0 && m.indexOf('药材') >= 0), 'F7 缘分 3：乞丐认得你，递来一条**真行情**（MarketDynamic 现账）');
    const w5 = streetMod(0.9, 'js/city-facilities/beggar-alms.js');
    w5.W.discipleState = { isInSect: true, sectId: '丐帮', contribution: 0 };
    ok(w5.W.BeggarAlms.give('copper') === true && w5.contribs[0][0] === 2 && w5.contribs[0][1].indexOf('帮里的道') >= 0, 'F5 丐帮弟子行善是本分：帮里记功 贡献+2（sectAddContribution 正门带 ledger 缘由）');
    ok(w5.W.BeggarAlms.give('copper') === false && w5.msgs.some((m) => m.indexOf('善行贵在诚') >= 0), 'F5b 弟子每日一善为限——贡献是门派钱，不能刷');
    const w6 = streetMod(0.9, 'js/city-facilities/beggar-alms.js');
    w6.W.discipleState = { isInSect: true, sectId: '丐帮', _gbFaction: { side: 'dirty' }, contribution: 0 };
    w6.W.BeggarAlms.give('copper');
    ok(w6.contribs[0][0] === 3, 'F6 污衣派最认这碗饭：弟子+污衣 → 贡献+3');
    ok(w1.W.BeggarAlms.watchDiscount() === null, 'F8a 缘分不够，耳目不递话（两侧一分不让）');
    const w7 = streetMod(0.9, 'js/city-facilities/beggar-alms.js');
    w7.reg.beggarAlms.import({ goodwill: 9, noted3: true, lastDay: -1 });
    w7.W.BeggarAlms.give('copper');
    const wd = w7.W.BeggarAlms.watchDiscount();
    ok(wd && wd.caravan === 0.04 && wd.siege === 0.03, 'F8 缘分 10：丐帮耳目认情——watchDiscount 正门开出（截道-4%、夜袭-3%）');
    ok(w7.journal.some((j) => j.title === '丐帮耳目认情') && w7.msgs.some((m) => m.indexOf('提前给你递话') >= 0), 'F8b 这桩缘分进天下见闻、话如实说给玩家');
    const w8 = streetMod(0.9, 'js/city-facilities/beggar-alms.js');
    w8.reg.beggarAlms.import({ goodwill: 24, noted3: true, noted10: true, lastDay: -1 });
    w8.W.BeggarAlms.give('copper');
    ok(w8.grown.some((g) => g[0] === '学识' && g[1] === 10) && w8.applied.some((a) => a.spec.fame === 2) && w8.msgs.some((m) => m.indexOf('长老') >= 0), 'F9 缘分 25：老乞丐直起身子——丐帮长老传你街面生存的门道（学识+10、名气+2，一次性）');
    const w9 = streetMod(0.9, 'js/city-facilities/beggar-alms.js');
    w9.W.discipleState = { isInSect: true, sectId: '丐帮', contribution: 0 };
    w9.reg.beggarAlms.import({ goodwill: 24, noted3: true, noted10: true, lastDay: -1 });
    w9.W.BeggarAlms.give('stone');
    ok(w9.contribs.some((c) => c[0] === 15 && c[1] === '长老认下你的善行'), 'F10 弟子版长老现身：帮里记大功（贡献+15）');
    w9.W._setDay(6);
    w9.W.BeggarAlms.give('copper');
    ok(w9.grown.length === 0 && w9.contribs.filter((c) => c[0] === 15).length === 1, 'F11 长老只现身一次——再施舍不重演（里程碑一次性）');
    const snap = w7.reg.beggarAlms.export();
    const w10 = streetMod(0.9, 'js/city-facilities/beggar-alms.js');
    w10.reg.beggarAlms.import(snap);
    ok(w10.W.BeggarAlms.goodwill() === 11 && w10.W.BeggarAlms.watchDiscount() !== null, 'F12 缘分账随 StateRegistry『beggarAlms』往返——读档不忘旧情');
    ok(SRC.caravan.indexOf('BeggarAlms.watchDiscount') >= 0 && SRC.caravan.indexOf("wdC.caravan") >= 0, 'F13 押货跑商接了耳目递话（带守卫：本账不在位一分不让）');
    ok(SRC.siege.indexOf('BeggarAlms.watchDiscount') >= 0 && SRC.siege.indexOf("wdS.siege") >= 0, 'F14 洞府守卫战接了耳目递话（同款守卫）');
    ok(SRC.alms.indexOf('localStorage') < 0, 'F16 零新 localStorage 键');
}

// ============ F15/F16 让风真生效（整文件沙箱） ============
console.log('\n[F15/F16] 耳目递话行为验证（caravan-trade / cave-siege 整文件真跑）');
function caravanWorld(rand, opts) {
    opts = opts || {};
    const battles = [];
    let stones = 300;
    const slots = [{ uid: 'u1', templateId: 'pill_test', count: 3 }];
    const reg = {};
    const W = makeWorld(rand, {
        showMessage: () => {},
        prompt: () => 2,
        currentCharData: { name: '李长生', realm: '元婴', location: '洛水城' },
        inventory: { slots: slots, currency: { spiritStones: stones } },
        itemById: { pill_test: { id: 'pill_test', name: '测试丹', price: 50, type: 'consumable' } },
        EconomyTransaction: {
            run: (fn) => fn(),
            removeByUid: (uid, q) => {
                const s = slots.find((x) => x && x.uid === uid);
                if (!s || s.count < q) return null;
                s.count -= q;
                return { templateId: s.templateId, count: q, uid: uid };
            },
            addSnapshot: () => true
        },
        getCurrentCityName: () => '洛水城',
        MarketDynamic: {
            CITIES: ['中州'], CATEGORIES: ['丹药'],
            regionFor: () => '中州',
            priceMul: () => 1.0,
            listActiveEvents: () => []
        },
        DataManager: { addSpiritStones: (n) => { stones += n; }, deductSpiritStones: (n) => { if (stones < n) return false; stones -= n; return true; } },
        timeSystem: { getAbsoluteDay: () => 7, onNewDaySubscribe: () => {} },
        getRealmTier: () => 4,
        getRivals: () => [],
        npcManager: { getNPC: () => null },
        isAtHome: () => false,
        isInSoulState: () => false,
        playerPushDeed: () => {},
        removeItem: () => true,
        startBattle: (d) => { battles.push(d); return { tag: true }; },
        StateRegistry: { register: (k, h) => { reg[k] = h; } },
        BeggarAlms: opts.alms ? { watchDiscount: () => ({ caravan: 0.04, siege: 0.03 }) } : undefined
    });
    vm.runInContext(opts.src || SRC.caravan, W, { filename: 'caravan-trade' });
    return { W, battles };
}
{
    // 货值 100 → 基础风声 10%；耳目递话 → 6%。骰 0.07 卡在两档之间
    const cA = caravanWorld([0.07], { alms: true });
    cA.W.CaravanTrade.load(0, 2);
    ok(cA.W.maybeCaravanAmbush() === false && cA.battles.length === 0, 'F15a 缘分够深：截道风声 10%→6%，骰 0.07 擦过——道上提前递了话，这一趟太平');
    const cB = caravanWorld([0.07, 0.9, 0.5]);
    cB.W.CaravanTrade.load(0, 2);
    ok(cB.W.maybeCaravanAmbush() === true && cB.battles.length === 1, 'F15 没结这份善缘：同一颗骰 0.07<0.10，响马照旧拦路');

    function siegeWorld(rand, opts) {
        opts = opts || {};
        const battles = [];
        const reg = {};
        const W = makeWorld(rand, {
            showMessage: () => {},
            currentCharData: { name: '李长生', realm: '金丹', notoriety: 50, bonds: {} },
            getRealmTier: () => 3,
            timeSystem: { getAbsoluteDay: () => 3, onNewDaySubscribe: () => {} },
            isInSoulState: () => false,
            isAtHome: () => true,
            playerHouse: { type: 'cave' },
            getRivals: () => [],
            npcManager: { getNPC: () => null },
            getFengshuiReport: () => [],
            startBattle: (d) => { battles.push(d); return { tag: true }; },
            addFame: () => {},
            playerPushDeed: () => {},
            WorldJournal: { record: () => {} },
            DataManager: { deductSpiritStones: () => true },
            inventory: { currency: { spiritStones: 100 }, slots: [] },
            itemById: {},
            removeItem: () => true,
            StateRegistry: { register: (k, h) => { reg[k] = h; } },
            BeggarAlms: opts.alms ? { watchDiscount: () => ({ caravan: 0.04, siege: 0.03 }) } : undefined
        });
        vm.runInContext(opts.src || SRC.siege, W, { filename: 'cave-siege' });
        return { W, battles };
    }
    // 恶名 50 → 基础夜袭 15%；递话 → 12%。骰 0.13 卡在两档之间
    const sA = siegeWorld([0.13], { alms: true });
    ok(sA.W.maybeCaveSiege() === false && sA.battles.length === 0, 'F16a 耳目递话：夜袭风声 15%→12%，骰 0.13 擦过——这一夜太平');
    const sB = siegeWorld([0.13, 0.9]);
    ok(sB.W.maybeCaveSiege() === true && sB.battles.length === 1, 'F16 没结善缘：同一颗骰 0.13<0.15，蒙面夜袭者照旧翻墙');
}

// ============ G 反向探针（改源重跑——证明尺钉的是行为不是摆设） ============
console.log('\n[G] 反向探针');
{
    // G1：把每日面熟上限 3 改 99 —— 第四趟就该涨面熟（证明上限是真闸）
    const srcG1 = SRC.street.replace('DAILY_WANDER_CAP: 3', 'DAILY_WANDER_CAP: 99');
    ok(srcG1 !== SRC.street, 'G1a 探针改到了源（常量在位）');
    const g1 = streetMod(0.5, 'js/city-facilities/street-life.js', { src: srcG1 });
    g1.W.exploreCity = () => {};
    for (let i = 0; i < 4; i++) g1.W.StreetLife.wander();
    ok(g1.W.StreetLife.familiarCount('洛水城') === 4, 'G1 上限拆掉后同日第四趟面熟照涨——A5 钉的是真闸不是摆设');

    // G2：把跑商侧的让风那行拆掉 —— 同一颗骰就该被截（证明递话真减了风声）
    const srcG2 = SRC.caravan.replace('if (wdC && Number(wdC.caravan) > 0) chance = Math.max(0.02, chance - Number(wdC.caravan));', 'if (wdC) { chance = chance; }');
    ok(srcG2 !== SRC.caravan, 'G2a 探针改到了源（让风那行在位）');
    const g2 = caravanWorld([0.07, 0.9, 0.5], { alms: true, src: srcG2 });
    g2.W.CaravanTrade.load(0, 2);
    ok(g2.W.maybeCaravanAmbush() === true, 'G2 让风那行拆掉后，缘分再深照旧被截——F15a 钉的是真减');

    // G3：把招牌菜的加成那手拆掉 —— activeBuffs 就该是空的（证明加成真挂上了账）
    const srcG3 = SRC.eat.replace('var buffed = applyMealBuff();', 'var buffed = false;');
    ok(srcG3 !== SRC.eat, 'G3a 探针改到了源（挂 buff 那手在位）');
    const g3 = streetMod(0.9, 'js/city-facilities/eatery.js', { src: srcG3, loadSatiety: true });
    g3.W.CityEatery.eat('special');
    ok(!(g3.W.activeBuffs && g3.W.activeBuffs['eatery_special']), 'G3 拆掉那手后账上干干净净——C5 钉的是真加成不是嘴上说说');

    // G4：把捡漏底率 6% 改 99% —— 低学识骰 0.5 也该抖出残页（证明捡漏是真骰不是硬塞）
    const srcG4 = SRC.book.replace('FIND_BASE: 0.06', 'FIND_BASE: 0.99');
    ok(srcG4 !== SRC.book, 'G4a 探针改到了源（底率常量在位）');
    const g4 = streetMod([0.5, 0.5], 'js/city-facilities/bookshop.js', { src: srcG4 });
    g4.W.CityBookshop.buy(g4.W.CityBookshop.todayShelf('洛水城')[0].slotIdx);
    ok(g4.unlocked.length === 1, 'G4 底率抬到 99% 后骰 0.5 也中——E4/E5 钉的是真骰子');
}

// ============ H 静态与加载清单 ============
console.log('\n[H] 静态与加载清单');
{
    const mf = load('scripts.manifest.json');
    const html = load('仙侠.html');
    const files = ['street-life', 'bathhouse', 'eatery', 'gamble-den', 'bookshop', 'beggar-alms'];
    // ★2026-10-04 341 → 351★（B 类·判据过时，量没变）。查清「为什么变」：
//   scripts.manifest.json 的 stats.scripts 是仓库侧记账，写它那批时是 341；此后项目又添了十本账
//   （实测今读 351）。判据要守的不变式是「HTML 里除 vendor/tailwind.js 那一枚之外，每个脚本都在清单里、
//   且清单与 HTML 同序」——那条不变式今天仍然成立，且由 tools/refactor/manifest-scripts.py check 独立判过：
//   「同步检查通过：351 个 script / 25 个分层注释，HTML == manifest，无漏登记与无游离脚本」。
//   变的是那句硬写的计数（项目长大它就过时），不是它守的东西。scripts.manifest.json 本身在禁改清单里，
//   所以按原闸办：把计数归到今读真数，逐字全等照旧（少一本、多一本、顺序乱了照样红）。
ok(files.every((f) => mf.indexOf('"js/city-facilities/' + f + '.js"') >= 0) && mf.indexOf('"scripts": 351') >= 0, 'H1 加载清单收全六本新账（清单计数 2026-10-04 由 341 归正到实测 351；tools/manifest-scripts.py check 当日判过「HTML == manifest」）——play-harness 从清单取脚本，不进清单=没测过（v25.5 的教训）');
    ok(files.every((f) => html.indexOf('<script defer src="js/city-facilities/' + f + '.js"></script>') >= 0), 'H2 HTML 与清单同步（manifest gen 写回）');
    const newSrcs = files.map((f) => load('js/city-facilities/' + f + '.js'));
    ok(newSrcs.every((s) => s.indexOf('.setItem') < 0 && s.indexOf('.getItem') < 0), 'H3 六本新账零 localStorage 读写——持久化全走 StateRegistry/actionGate/运行时旗三条正门（头注里提一嘴那个词不算数）');
    ok(newSrcs.every((s) => !/catch\s*\([^)]*\)\s*\{\s*\}/.test(s)), 'H4 六本新账零空 catch（wave141 只减不增的规矩）');
    ok(newSrcs.every((s) => s.indexOf('炼气') < 0 && s.indexOf('筑基') < 0), 'H5 零自抄境界序（DES-92）——市井账压根不碰境界');
    ok(newSrcs.every((s) => s.indexOf('.killCount') < 0), 'H6 零裸 killCount（DES-76 老规矩）');
    const globals = ['window.StreetLife', 'window.CityBath', 'window.CityEatery', 'window.GambleDen', 'window.CityBookshop', 'window.BeggarAlms'];
    const allJs = fs.readdirSync(path.join(ROOT, 'js'), { recursive: true }).filter((f) => String(f).endsWith('.js'));
    let dupes = 0;
    for (const g of globals) {
        let n = 0;
        for (const f of allJs) {
            const s = fs.readFileSync(path.join(ROOT, 'js', String(f)), 'utf8');
            if (s.indexOf(g + ' =') >= 0) n++;
        }
        if (n !== 1) dupes++;
    }
    ok(dupes === 0, 'H7 六个新全局名各只有一处定义（静态门禁不撞车）');
}

console.log('\n通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
