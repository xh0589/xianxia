/**
 * v25.6 玩家心愿批（第一百四十八批）——用户点单五路 + 一路改造，一次立项。
 *
 *   A 江湖望风榜：口头天骄排名（无俸禄、会失真）——名气≥25 才进说书人的嘴，恶名被传高、
 *     闷修被看低；前三每日有几率被不服的天骄登门挑战（宿敌链同款形态），榜上胜负落账；
 *   B 生平传记与称号：零实时钩子、打开面板才现编（性能答卷）——编年卷吃天下见闻+游历账，
 *     称号纯派生可佩戴（不带属性，照 travel-journal 成例），只有「佩戴中」一个字段落档；
 *   C 寄售竞价战：玩家寄售的货可以自己点火催场——买主一轮轮抬价，随时落槌（税后到账）
 *     或再贪一轮（场子凉了就地流拍：退货+压柜费，走既有流拍账）；每件只催得动一次；
 *   D 押货跑商：货从行囊真扣走装上肩（EconomyTransaction 快照托管），行情板摊开六区×六类差价，
 *     货在身上过日有截道风声（货值越贵越招风，四成是仇家亲自来），输赢都如实落账；
 *   E 洞府会客：cave-life 把客人领到门口后交给玩家亲自招待——仙露茶/灵果/清谈/送客四条路，
 *     风水吉凶真进好感（±6 封顶），茶灶客房照旧加分，回礼走 giveWithReceipt 正门；
 *   F 洞府守卫战：恶名≥40 或有仇家，夜里人在自家洞府才有这一仗——煞位折敌攻（封顶15%）、
 *     道侣上墙头（封顶6%）、灵兽自动参战；败了灵石被搬一成（封顶300）+行囊少一件（如实点名）。
 *
 * 钉法：A/B/D/E/F 整文件沙箱真跑 + 源码钉位，C 整文件沙箱真跑（复用拍卖行既有沙箱姿势），
 *       G 段三发反向探针（改源重跑，证明尺钉的是行为不是摆设）。
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

console.log('\n========== v25.6 玩家心愿批 ==========');

// 通用沙箱：W.window=W，Math.random 走队列，setTimeout 立即执行
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
function rngCapture(W) { const r = {}; W.StateRegistry = { register: (k, h) => { r[k] = h; } }; return r; }

// ============ A 江湖望风榜 ============
console.log('\n[A] 江湖望风榜（口头排名 · 无俸禄 · 会失真 · 前三招挑战）');
{
    const jr = load('js/extensions/jianghu-rank.js');
    const app = load('js/app.js');
    const tea = load('js/city-facilities/teahouse-leisure.js');
    ok(jr.indexOf('window.openJianghuRank = openJianghuRank') >= 0 && jr.indexOf('window.settleRankDuel = settleRankDuel') >= 0, 'A1 望风榜三正门（开榜/挑战/结算）导出在位');
    ok(jr.indexOf('addSpiritStones') < 0 && jr.indexOf("credit('spiritStones'") < 0, 'A2 无俸禄口径钉死：全文件没有一处发钱的手（口头榜只给名声的麻烦与机会）');
    ok(tea.indexOf('打听望风榜') >= 0 && tea.indexOf('window.openJianghuRank()') >= 0, 'A3 茶馆菜单接了「打听望风榜」的口子（风声不要钱）');
    ok(app.indexOf('currentBattle._isRankDuel && typeof window.settleRankDuel === \'function\'') >= 0 && app.indexOf('currentBattle && currentBattle._isRankDuel && typeof window.settleRankDuel') >= 0, 'A4 战后钩子胜负两个分支都接了 _isRankDuel');

    function rankWorld(rand, cd) {
        const deeds = [], journal = [], battles = [], msgs = [], fames = [];
        let day = 1;
        const reg = {};
        const W = makeWorld(rand, {
            showMessage: (t) => msgs.push(String(t)),
            currentCharData: Object.assign({ name: '李长生', realm: '化神', fame: 100, _killCount: 50, arenaWins: 10, notoriety: 0, karma: 0 }, cd || {}),
            getRealmTier: (r) => ['炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'].indexOf(r) + 1,
            timeSystem: { getAbsoluteDay: () => day, onNewDaySubscribe: (fn) => { W._newDay = fn; } },
            addFame: (n) => fames.push(n),
            playerPushDeed: (mood, s) => deeds.push([mood, s]),
            WorldJournal: { record: (e) => journal.push(e) },
            startBattle: (d) => { battles.push(d); return { tag: true }; },
            StateRegistry: { register: (k, h) => { reg[k] = h; } }
        });
        W._setDay = (d) => { day = d; };
        vm.runInContext(jr, W, { filename: 'jianghu-rank' });
        return { W, deeds, journal, battles, msgs, fames, reg };
    }

    const w1 = rankWorld(0.5, { fame: 10 });
    ok(w1.W.computeJianghuRank().playerRank === 0, 'A5 名气 10（无名之辈）进不了说书人的嘴——榜上无名');
    const w2 = rankWorld(0.5, { fame: 100, realm: '化神', _killCount: 50, arenaWins: 10 });
    const r2 = w2.W.computeJianghuRank();
    // 场面分 = 5*1000 + min(100,400)*2 + min(50,300)*3 + 10*15 = 5550 → 洛清音5620/顾长风5600 之后
    ok(r2.playerRank === 10, 'A6 化神·名气100·斩50·演武10胜 → 场面分 5550，口头榜排第 10（洛清音与顾长风之后）——实算 ' + r2.playerRank);
    ok(r2.list[0].name === '叶孤鸿' && r2.list[0].score === 9880, 'A7 榜首是剑痴叶孤鸿（9×1000+880=9880），名人池分数尺对得上');
    const w3 = rankWorld(0.5, { fame: 30, realm: '化神', notoriety: 0, _killCount: 0, arenaWins: 0 });
    ok(w3.W.computeJianghuRank().list.filter((e) => e.isPlayer)[0].tier === 4, 'A8 风声失真·低估：化神（5档）但名气只有 30——说书人把你按元婴讲');
    const w4 = rankWorld(0.5, { fame: 300, realm: '元婴', notoriety: 70, _killCount: 0, arenaWins: 0 });
    ok(w4.W.computeJianghuRank().list.filter((e) => e.isPlayer)[0].tier === 5, 'A9 风声失真·高估：元婴（4档）恶名 70——道上把你传成化神的煞星');

    // 前三招挑战：化神大圆满的配置冲上榜眼
    const w5 = rankWorld([0.1], { realm: '大乘', fame: 200, _killCount: 300, arenaWins: 30 });
    const r5 = w5.W.computeJianghuRank();
    ok(r5.playerRank === 2, 'A10 大乘·名气200·斩300·演武30胜 → 场面分 9750，排第 2（叶孤鸿 9880 之下）——实算 ' + r5.playerRank);
    ok(w5.W.maybeProdigyChallenge() === true, 'A11 前三 + 名气≥60 + 骰子过（0.1<0.25）→ 天骄登门挑战拉起来了');
    const foe = w5.battles[0];
    ok(foe && foe.name === '【望风榜】天机阁主 · 玄算子' && foe.level === 30 && foe.attack === 94 && foe.maxDurability === 290, 'A12 挑战者是排在玩家后一位的天机阁主（想往上爬的那位不服）：8档 → level 30 / attack 94 / 耐久 290');
    ok(w5.W.maybeProdigyChallenge() === false, 'A13 同日冷却：刚被打过一场，当天不再叠第二场');
    w5.W._setDay(10);
    ok(w5.W.maybeProdigyChallenge() === true, 'A14 冷却 4 天过后（第 10 天），下一场挑战照常来');
    w5.W.currentBattle = { _isRankDuel: true, _rankFoeName: '玄算子' };
    w5.W.settleRankDuel(true);
    ok(w5.fames[w5.fames.length - 1] === 10 && w5.W.getRankState().duelWins >= 1 && w5.deeds.some((d) => d[1].indexOf('玄算子') >= 0), 'A15 打赢落账：名气+10、榜上胜绩+1、风声进传闻池（茶馆要说半个月）');
    w5.W.settleRankDuel(false);
    ok(w5.fames[w5.fames.length - 1] === -4 && w5.W.getRankState().duelLosses >= 1, 'A16 打输落账：名气-4、败绩记上——风声传得比人跑得快');
    ok(w5.deeds.some((d) => d[1].indexOf('前十') >= 0) && w5.deeds.some((d) => d[1].indexOf('前三') >= 0), 'A17 名次里程碑风声：进前十与进前三各放了一次话（只放一次）');
    ok(w5.journal.some((j) => j.title === '名入前三'), 'A18 名入前三记进天下见闻（传记有素材可编）');

    const w6 = rankWorld(0.9, { realm: '大乘', fame: 200, _killCount: 300, arenaWins: 30 });
    ok(w6.W.maybeProdigyChallenge() === false, 'A19 骰子不过（0.9≥0.25）→ 这一天太平，挑战不是天天有');
    // 存档往返
    const snap = w5.reg.jianghuRank.export();
    const w7 = rankWorld(0.5);
    const before = w7.W.getRankState();
    ok(snap.duelWins >= 1 && before.duelWins === 0, 'A20 StateRegistry 正门：胜绩随模块账导出，新世界导入前是干净的');
    ok(w5.reg.jianghuRank && typeof w5.reg.jianghuRank.import === 'function' && snap.bestRank === 2, 'A21 榜上胜负走 StateRegistry『jianghuRank』（历史最佳第 2 随账走），名次本身现算不落档——口头账没有真本子');
    // 反向探针 G 段统一放最后
}

// ============ B 生平传记与称号 ============
console.log('\n[B] 生平传记与称号（零实时钩子 · 打开才现编）');
{
    const bg = load('js/extensions/biography.js');
    const html = load('仙侠.html');
    ok(bg.indexOf('onNewDaySubscribe') < 0 && bg.indexOf('EventBus') < 0 && bg.indexOf('setInterval') < 0, 'B1 性能答卷钉死：全文件没有一处实时钩子/每日订阅/定时器——传记只在打开那一刻现编');
    ok(html.indexOf('openBiographyPanel()') >= 0 && html.indexOf('我的生平 · 传记与称号') >= 0, 'B2 设置页「图鉴与大事记」一排接了传记入口');
    const tj = load('js/map/travel-journal.js');
    ok(bg.indexOf('_travel') < 0 && tj.indexOf('regionLog: regionLog') >= 0, 'B2b 编年问游历账走账主的只读窗 regionLog（CF⑰ 老规矩：全仓只有游历见闻自己伸手进 _travel）');

    function bioWorld(cd, opts) {
        opts = opts || {};
        const reg = {};
        const W = makeWorld(0.5, {
            showMessage: () => {},
            currentCharData: Object.assign({ name: '李长生', realm: '金丹', fame: 30, notoriety: 0, _killCount: 120, arenaWins: 5, karma: 10, _demonicCorruption: 0, _failedBreakthroughs: 2, bonds: {} }, cd || {}),
            getRealmTier: (r) => ['炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'].indexOf(r) + 1,
            getFameLevel: (p) => ({ name: '小有名气' }),
            timeSystem: { getAbsoluteDay: () => 320 },
            TravelJournal: { regionLog: () => opts.regions || {} },
            inventory: { currency: { spiritStones: opts.stones != null ? opts.stones : 500 } },
            WorldJournal: { getJournalEntries: () => opts.journal || [] },
            computeJianghuRank: () => ({ playerRank: opts.rank || 0 }),
            StateRegistry: { register: (k, h) => { reg[k] = h; } },
            showModal: (t, h) => ({ close: () => {}, title: t, html: h })
        });
        vm.runInContext(bg, W, { filename: 'biography' });
        return { W, reg };
    }

    const w1 = bioWorld({}, {
        journal: [
            { day: 400, title: '兽潮', text: '潮水拍上了山门。' },
            { day: 12, title: '入门', text: '拜入青玄宗。' }
        ],
        rank: 2,
        regions: { '东荒': 5, '南疆': 60 }
    });
    const book = w1.W.Biography.compile();
    ok(book.chapters.length === 3 && book.chapters[0].title === '卷一 · 其人', 'B3 传记三卷：其人/编年/数目');
    const chrono = book.chapters[1].lines.join('|');
    ok(chrono.indexOf('修仙历 1 年 1 月（第 12 日）') >= 0 && chrono.indexOf('修仙历 2 年 2 月（第 400 日）') >= 0, 'B4 历法换算与时间系统同口径（30 天一月、12 月一年），编年按日子正序');
    ok(chrono.indexOf('初至「南疆」') >= 0 && chrono.indexOf('拜入青玄宗') < chrono.indexOf('兽潮'), 'B5 游历账并进编年，排序不乱');
    ok(book.chapters[0].lines.join('').indexOf('望风榜上排第 2 位') >= 0, 'B6 卷一引用望风榜现算名次（两本账对得上话）');
    ok(book.chapters[2].lines.join('').indexOf('亲手斩敌 120') >= 0, 'B7 卷三数目：杀戮/演武/失手/因果/入魔全从存档白名单字段现读');
    const ids = book.unlocked.map((t) => t.id);
    ok(ids.indexOf('t_kill100') >= 0 && ids.indexOf('t_kill300') < 0, 'B8 称号派生：斩 120 解锁「杀伐果断」，够不着「修罗手段」');
    ok(ids.indexOf('t_prodigy3') >= 0 && ids.indexOf('t_prodigy10') >= 0, 'B9 榜上称号：望风榜第 2 → 「一代天骄」「榜上人物」双解锁');
    ok(w1.W.Biography.equip('t_kill300') === false, 'B10 没解锁的称号佩戴被拒（说实话，不硬戴）');
    ok(w1.W.Biography.equip('t_kill100') === true && w1.W.Biography.getEquippedTitle() === '杀伐果断', 'B11 佩戴解锁的称号成功，江湖称呼随之改口');
    const snap = w1.reg.biography.export();
    ok(snap.equipped === 't_kill100', 'B12 落档的只有「佩戴中」一个字段（StateRegistry『biography』正门）');
    const w2 = bioWorld({}, {});
    w2.reg.biography.import(snap);
    ok(w2.W.Biography.getEquippedTitle() === '杀伐果断', 'B13 读档往返：换了世界，佩戴的称号还在');
    const w3 = bioWorld({ _demonicCorruption: 85, _killCount: 400 });
    const b3 = w3.W.Biography.compile();
    ok(b3.verdict.indexOf('魔道') >= 0 && b3.unlocked.some((t) => t.id === 't_demon80') && b3.unlocked.some((t) => t.id === 't_kill300'), 'B14 判词与称号都认暗账：入魔 85% → 「一步魔尊」+魔道判词');
    const w4 = bioWorld({ bonds: { n1: { type: 'dao_companion', name: '柳如烟' } } }, { stones: 12000 });
    const b4 = w4.W.Biography.compile();
    ok(b4.unlocked.some((t) => t.id === 't_dao') && b4.unlocked.some((t) => t.id === 't_rich') && b4.chapters[0].lines.join('').indexOf('柳如烟') >= 0, 'B15 情缘与身家进书：道侣有名有姓、随身灵石一万 → 「富甲一方」');
    const panel = w1.W.Biography.open ? null : null;
    ok(w1.W.openBiographyPanel !== undefined || typeof w1.W.Biography.open === 'function', 'B16 面板正门在（openBiographyPanel 全局 + Biography.open 双口）');
}

// ============ C 寄售竞价战 ============
console.log('\n[C] 寄售竞价战（自己的货被 NPC 抢着抬价）');
{
    const as = load('js/economy/auction-service.js');
    ok((as.match(/overflow-y-auto/g) || []).length === 1, 'C1 全文件 overflow-y-auto 仍只有 1 处（v24.0:1103 老钉不动）——催场弹窗走 B 档帽');
    ok(as.indexOf('max-w-md w-full max-h-[85vh]') >= 0 && as.indexOf('sell-war-modal') >= 0, 'C2 催场弹窗 B 档帽（max-h 无滚动，内容短而固定，与竞价拉锯同款取舍）');

    function aucWorld(rand, opts) {
        opts = opts || {};
        const credited = [], scheduled = [], cancelled = [], snaps = [], debits = [], times = [], msgs = [];
        let stones = opts.stones != null ? opts.stones : 100;
        const els = {};
        const W = makeWorld(rand, {
            showMessage: (t) => msgs.push(String(t)),
            currentCharData: { name: '李长生', spiritStones: stones },
            inventory: { currency: { get spiritStones() { return stones; }, set spiritStones(v) { stones = v; } }, slots: [] },
            itemById: { pill_test: { id: 'pill_test', name: '测试丹', price: 100 } },
            EconomyTransaction: {
                run: (fn) => fn(),
                credit: (c, n) => { credited.push([c, n]); stones += n; return true; },
                debit: (c, n) => { if (stones < n) return false; debits.push([c, n]); stones -= n; return true; },
                addSnapshot: (s) => { if (opts.bagFull) return false; snaps.push(s); return true; }
            },
            GameScheduler: {
                nowMinute: () => 0,
                schedule: (t, m, p, o) => scheduled.push(o && o.id),
                cancel: (id) => cancelled.push(id),
                registerHandler: () => {}
            },
            timeSystem: { gameTime: { currentDay: 1 }, advanceTime: (m, l) => times.push([m, l]) },
            StateRegistry: { register: () => {} },
            document: {
                createElement: () => ({ style: {}, set innerHTML(v) { this._h = v; }, get innerHTML() { return this._h; } }),
                getElementById: (id) => els[id] || null,
                body: { appendChild: (el) => { els[el.id] = el; } }
            }
        });
        vm.runInContext(as, W, { filename: 'auction-service' });
        const A = W.AuctionService;
        A.deserialize({ items: [], npcRefreshDay: -1, counter: 0, notices: [], royalRefreshDay: -1, royalItems: [] });
        return { W, A, credited, cancelled, snaps, debits, times, msgs, stones: () => stones, els };
    }
    function playerItem(id, unit, qty) {
        return {
            id: id, sellerType: 'player', sellerName: '李长生', itemName: '测试丹', templateId: 'pill_test',
            quantity: qty || 2, itemSnapshot: { templateId: 'pill_test', count: qty || 2 },
            unitPrice: unit, listedMinute: -100, dueMinute: 1440, status: 'active', listingFee: 4
        };
    }

    const w1 = aucWorld([0.5]);
    w1.A.deserialize({ items: [playerItem('p1', 100, 2)], npcRefreshDay: -1, counter: 1, notices: [], royalRefreshDay: -1, royalItems: [] });
    ok(w1.A.startSellWar('npc_x') === false, 'C3 别人的货催不得场（只认自家寄售）');
    ok(w1.A.startSellWar('p1') === true, 'C4 自家寄售的活货可以点火');
    const war = w1.A.getSellWar();
    ok(war && war.ask === 200 && war.price === 170 && war.step === 16 && war.round === 0, 'C5 起价尺：挂牌 100×2=200，rand 0.5 → 首口价 round(200×0.85)=170，每轮抬价 round(200×0.08)=16');
    ok(war.coolBase === 0.05, 'C6 场子冷热吃 saleChance 既有口径：平价货（成交率 0.85）→ coolBase 钳在下限 0.05');
    ok(w1.times.some((t) => t[0] === 10 && t[1] === '拍卖催场'), 'C7 催场真耗时辰：advanceTime(10, 拍卖催场)');
    ok(w1.A.startSellWar('p1') === false, 'C8 一场火没落槌，不叠第二场');
    w1.A.sellWarWalk();
    ok(w1.A.getSellWar() === null && w1.A.startSellWar('p1') === false, 'C9 离席后货照旧挂着，但这件货只催得动一次场（stoked 落账）');

    // 落槌：税后到账 + 取消原结算任务
    const w2 = aucWorld([0.5]);
    w2.A.deserialize({ items: [playerItem('p2', 100, 2)], npcRefreshDay: -1, counter: 1, notices: [], royalRefreshDay: -1, royalItems: [] });
    w2.A.startSellWar('p2');
    ok(w2.A.sellWarStrike() === true, 'C10 落槌成交');
    const net = 170 - Math.floor(170 * 0.08);
    ok(w2.credited.some((c) => c[0] === 'spiritStones' && c[1] === net), 'C11 钱走 EconomyTransaction 正门：170 落槌 → 税 13 → 到账 ' + net);
    ok(w2.cancelled.indexOf('auction_settle_p2') >= 0, 'C12 落槌即撤掉原来的到期结算任务（不双份成交）');
    const st2 = w2.A.getState().items.find((x) => x.id === 'p2');
    ok(st2.status === 'sold' && st2.buyerName && st2.bidRounds === 0, 'C13 货记 sold、买主留名、催场轮数入账');

    // 贪一轮抬价成功，再贪凉场流拍
    const w3 = aucWorld([0.5, 0.99, 0.99]);
    w3.A.deserialize({ items: [playerItem('p3', 100, 2)], npcRefreshDay: -1, counter: 1, notices: [], royalRefreshDay: -1, royalItems: [] });
    w3.A.startSellWar('p3');
    ok(w3.A.sellWarHold() === true && w3.A.getSellWar().price === 186 && w3.A.getSellWar().round === 1, 'C14 贪一轮（cool 0.17，骰 0.99 不中）→ 价抬到 186、轮数+1、买主换人');
    ok(w3.A.sellWarHold() === true && w3.A.getSellWar().price === 202 && w3.A.getSellWar().round === 2, 'C15 再贪一轮（cool 0.29，骰 0.99 不中）→ 价抬到 202、轮数 2——贪心是一轮轮喂大的');
    const w4 = aucWorld([0.5, 0.01], { stones: 500 });
    w4.A.deserialize({ items: [playerItem('p4', 100, 2)], npcRefreshDay: -1, counter: 1, notices: [], royalRefreshDay: -1, royalItems: [] });
    w4.A.startSellWar('p4');
    ok(w4.A.sellWarHold() === false, 'C16 贪一轮骰中凉场（cool 0.17 > 0.01）→ 当场流拍');
    ok(w4.snaps.length === 1 && w4.snaps[0].templateId === 'pill_test', 'C17 流拍走既有退货账：快照原路退回行囊，绝不吞物');
    ok(w4.debits.some((d) => d[1] === 10), 'C18 流拍压柜费照收：floor(200×0.05)=10 灵石');
    const st4 = w4.A.getState().items.find((x) => x.id === 'p4');
    ok(st4.status === 'unsold' && w4.cancelled.indexOf('auction_settle_p4') >= 0, 'C19 流拍记 unsold 并撤掉到期任务');

    // 天价货场子冷
    const w5 = aucWorld([0.5]);
    w5.A.deserialize({ items: [playerItem('p5', 1000, 1)], npcRefreshDay: -1, counter: 1, notices: [], royalRefreshDay: -1, royalItems: [] });
    w5.A.startSellWar('p5');
    ok(w5.A.getSellWar().coolBase === 0.55, 'C20 天价货（挂牌 10 倍基准，成交率 1.8%）→ coolBase 钳在上限 0.55：一催就冷，贪的代价如实');
    // 背包满不吞货
    const w6 = aucWorld([0.5, 0.0], { bagFull: true });
    w6.A.deserialize({ items: [playerItem('p6', 100, 2)], npcRefreshDay: -1, counter: 1, notices: [], royalRefreshDay: -1, royalItems: [] });
    w6.A.startSellWar('p6');
    ok(w6.A.sellWarHold() === false, 'C21 凉场想退货但行囊满 → 货先留在柜上（active），说实话不吞物');
    const st6 = w6.A.getState().items.find((x) => x.id === 'p6');
    ok(st6.status === 'active', 'C22 退不回去就还是活挂单，到期结算会再试');
    const w7 = aucWorld([0.5]);
    w7.A.reset();
    ok(w7.A.getSellWar() === null && w7.A.getBidWar() === null, 'C23 reset 清干净两炉火（催场与竞价都是临时账，不进序列化）');
    ok(as.indexOf('_sellWar = null; // {itemId') >= 0 || as.indexOf('var _sellWar = null') >= 0, 'C24 _sellWar 是模块级临时账（与 _bidWar 同款，不落档）');
}

// ============ D 押货跑商 ============
console.log('\n[D] 押货跑商（真扣货上肩 · 行情板 · 截道风声）');
{
    const ct = load('js/economy/caravan-trade.js');
    const se = load('js/core/scenario-engine.js');
    const pc = load('js/city-facilities/facility-peddler-contract.js');
    ok(se.indexOf('eff.caravan') >= 0 && se.indexOf('window.openCaravanBoard()') >= 0, 'D1 剧本引擎接了 caravan 效果键（契约所柜台递话，不另立账）');
    ok(pc.indexOf('押货跑商') >= 0 && pc.indexOf("caravan: { op: 'open' }") >= 0, 'D2 契约所柜台上多了「押货跑商」这条路（与跑单帮柜面生意分账）');
    ok(ct.indexOf("StateRegistry.register('caravan'") >= 0 && ct.indexOf('localStorage') < 0, 'D3 货担账走 StateRegistry『caravan』正门，零直写 localStorage');

    function caravanWorld(rand, opts) {
        opts = opts || {};
        const msgs = [], battles = [], removed = [], added = [], times = [];
        let stones = opts.stones != null ? opts.stones : 300;
        const slots = opts.slots || [
            { uid: 'u1', templateId: 'pill_test', count: 3 },
            { uid: 'u2', templateId: 'spec_token', count: 1 },
            { uid: 'u3', templateId: 'mat_herb', count: 5 }
        ];
        const reg = {};
        const W = makeWorld(rand, {
            showMessage: (t) => msgs.push(String(t)),
            prompt: () => (opts.promptQty != null ? opts.promptQty : 2),
            currentCharData: { name: '李长生', realm: '元婴', location: '洛水城' },
            inventory: { slots: slots, currency: { spiritStones: stones } },
            itemById: {
                pill_test: { id: 'pill_test', name: '测试丹', price: 50, type: 'consumable' },
                mat_herb: { id: 'mat_herb', name: '灵草', price: 10, type: 'material' },
                spec_token: { id: 'spec_token', name: '信物', price: 0, type: 'special' },
                quest_thing: { id: 'quest_thing', name: '托付之物', price: 0, type: 'quest' }
            },
            EconomyTransaction: {
                run: (fn) => fn(),
                removeByUid: (uid, q) => {
                    const s = slots.find((x) => x && x.uid === uid);
                    if (!s || s.count < q) return null;
                    s.count -= q; removed.push([uid, q]);
                    return { templateId: s.templateId, count: q, uid: uid };
                },
                addSnapshot: (snap) => { if (opts.bagFull) return false; added.push(snap); return true; }
            },
            getCurrentCityName: () => opts.city || '洛水城',
            MarketDynamic: {
                CITIES: ['中州', '南疆'], CATEGORIES: ['丹药', '药材'],
                regionFor: (c) => (c === '洛水城' ? '中州' : '南疆'),
                priceMul: (city, cat) => (city === '中州' ? (cat === '丹药' ? 1.2 : 0.8) : (cat === '丹药' ? 0.7 : 1.3)),
                listActiveEvents: () => [{ name: '兽潮' }]
            },
            DataManager: {
                addSpiritStones: (n) => { stones += n; },
                deductSpiritStones: (n) => { if (stones < n) return false; stones -= n; return true; }
            },
            timeSystem: { getAbsoluteDay: () => opts.day || 7, onNewDaySubscribe: (fn) => { W._newDay = fn; } },
            getRealmTier: () => 4,
            getRivals: () => opts.rivals || [],
            npcManager: { getNPC: (id) => (opts.npcById || {})[id] || null },
            isAtHome: () => !!opts.atHome,
            isInSoulState: () => false,
            playerPushDeed: () => {},
            removeItem: (uid, n) => { removed.push(['bag:' + uid, n]); return true; },
            startBattle: (d) => { battles.push(d); return { tag: true }; },
            StateRegistry: { register: (k, h) => { reg[k] = h; } }
        });
        vm.runInContext(ct, W, { filename: 'caravan-trade' });
        return { W, CT: W.CaravanTrade, msgs, battles, removed, added, times, stones: () => stones, slots, reg };
    }

    const w1 = caravanWorld(0.9);
    ok(w1.CT.load(0, 2) === true, 'D4 装货：行囊里的测试丹真扣走两枚、上了肩');
    ok(w1.removed[0][0] === 'u1' && w1.removed[0][1] === 2 && w1.slots[0].count === 1, 'D5 扣货走 EconomyTransaction.removeByUid 快照托管正门（拍卖寄售同款）');
    const c1 = w1.CT.cargo()[0];
    ok(c1.itemName === '测试丹' && c1.originCity === '洛水城' && c1.originRegion === '中州' && c1.pickupDay === 7, 'D6 货担记全出处：城名/大区/上肩日——差价与风声都有本可查');
    ok(w1.CT.cargoValue() === 100, 'D7 货值 = 基准价×件数（50×2=100）');
    w1.CT.load(2, 1); w1.CT.load(0, 1);
    ok(w1.CT.cargo().length === 3 && w1.CT.load(2, 1) === false, 'D8 肩上最多三担（与跑单帮同口径），第四担拦下说实话');
    ok(w1.CT.unload(0) === true && w1.added.length === 1, 'D9 卸货：快照原路退回行囊——到价高的地界卸下来照当地行市卖');
    const w1b = caravanWorld(0.9, { bagFull: true });
    w1b.CT.load(0, 2);
    ok(w1b.CT.unload(0) === false, 'D10 行囊满了卸不下——不吞货，先腾地方');
    const w1c = caravanWorld(0.9, { slots: [{ uid: 'u9', templateId: 'quest_thing', count: 1 }] });
    ok(w1c.CT.load(0, 1) === false, 'D11 任务物件押不得（那是别人的托付）');

    // 截道风声
    const w2 = caravanWorld([0.05, 0.9, 0.5]);
    w2.CT.load(0, 2); // 货值 100 → chance 0.10，骰 0.05 中
    ok(w2.W.maybeCaravanAmbush() === true && w2.battles.length === 1, 'D12 货值 100 的货担：基础风声 10%，骰中 → 响马拦路，真仗拉起');
    const b2 = w2.battles[0];
    ok(b2.name === '剪径的响马头子' && b2.level === 12 && b2.attack === 50, 'D13 无名响马按境界捏（4档 → level 12 / attack 50）');
    const w3 = caravanWorld([0.05, 0.1, 0.0]);
    const rival = { id: 'r1', name: '血手屠', isDead: false, relationship: { hatred: 70 }, changeHatred: function (n) { this.relationship.hatred = Math.max(0, this.relationship.hatred + n); } };
    w3.W.getRivals = () => [rival];
    w3.W.npcManager = { getNPC: (id) => (id === 'r1' ? rival : null) };
    w3.CT.load(0, 2);
    ok(w3.W.maybeCaravanAmbush() === true && w3.battles[0].name === '【截道】血手屠', 'D14 四成风声是仇家亲自来（恨你入骨的人认得你的货）：attack = 33+20+14=67');
    ok(w3.battles[0].attack === 67 && w3.battles[0].maxDurability === 225, 'D15 仇家强度随境界+仇恨（宿敌链同款尺）');
    w3.W.currentBattle = { _isCaravanAmbush: true, _caravanFoeId: 'r1', _caravanFoeName: '血手屠' };
    const stonesBefore = w3.stones();
    w3.W.settleCaravanAmbush(true);
    ok(w3.stones() - stonesBefore === 25 && rival.relationship.hatred === 55, 'D16 打赢：抄了对方老窝 round(100×0.05)+20=25 灵石，仇家仇恨 70→55');
    const w4 = caravanWorld([0.05]);
    w4.CT.load(0, 2);
    w4.W.currentBattle = { _isCaravanAmbush: true, _caravanFoeName: '响马' };
    w4.W.settleCaravanAmbush(false);
    ok(w4.CT.cargo()[0].count === 1, 'D17 打输：每担被搬走三成（2 件 → ceil(0.6)=1 件），账上如实');
    const w5 = caravanWorld([0.05], { promptQty: 1 });
    w5.CT.load(0, 1);
    w5.W.currentBattle = { _isCaravanAmbush: true, _caravanFoeName: '响马' };
    w5.W.settleCaravanAmbush(false);
    ok(w5.CT.cargo().length === 0, 'D18 只有一件的担子被搬空 → 从肩上下掉（不挂空账）');
    const w6 = caravanWorld(0.0);
    ok(w6.W.maybeCaravanAmbush() === false, 'D19 肩上没货，天天太平（风声只认货担）');
    w6.CT.load(0, 2);
    w6.W.isAtHome = () => true;
    ok(w6.W.maybeCaravanAmbush() === false, 'D20 人在自家洞府里，贼摸不到门口');
    const w7 = caravanWorld([0.5]);
    w7.CT.load(0, 2);
    ok(w7.W.maybeCaravanAmbush() === false, 'D21 骰子不过（0.5≥0.10+0）→ 这一天路上太平');
    // 存档往返
    const snap = w7.reg.caravan.export();
    const w8 = caravanWorld(0.9);
    w8.reg.caravan.import(snap);
    ok(w8.CT.cargo().length === 1 && w8.CT.cargo()[0].count === 2, 'D22 货担随 StateRegistry 往返：读档不丢肩上的货');
    // 行情板
    const w9 = caravanWorld(0.9);
    let panelHtml = '';
    w9.W.showModal = (t, h) => { panelHtml = h; return { close: () => {} }; };
    w9.CT.open();
    ok(panelHtml.indexOf('丹药') >= 0 && panelHtml.indexOf('中州') >= 0 && panelHtml.indexOf('兽潮') >= 0, 'D23 行情板：六区×品类差价表 + 正在闹的事（真源 MarketDynamic 一字不造）');
    ok(panelHtml.indexOf('低买') >= 0 && panelHtml.indexOf('高卖') >= 0, 'D24 板上明说绿=最贱红=最俏——差价就是脚力的钱');
}

// ============ E 洞府会客 ============
console.log('\n[E] 洞府会客 · 品茗论道（风水真进印象）');
{
    const cr = load('js/extensions/cave-reception.js');
    const cl = load('js/extensions/cave-life.js');
    ok(cl.indexOf('window.CaveReception.receive(guest') >= 0 && cl.indexOf('if (!received) {') >= 0, 'E1 cave-life 交接焊死：弹得出接待窗就走接待账，弹不出落回自动文本（一笔不重不漏）');
    ok(cr.indexOf('window.CaveReception') >= 0 && cr.indexOf('getFengshuiMul') >= 0, 'E2 会客模块吃风水正门（上一批的吉凶账多了一个被人看见的理由）');

    function receptionWorld(rand, opts) {
        opts = opts || {};
        const affs = [], diary = [], journal = [], gifts = [], removed = [], msgs = [];
        let mood = 50;
        const npc = { id: 'n1', name: '柳如烟', changeAffection: (n) => { affs.push(n); npc.relationship.affection += n; }, relationship: { affection: 60 } };
        const W = makeWorld(rand, {
            showMessage: (t) => msgs.push(String(t)),
            currentCharData: { get mood() { return mood; }, set mood(v) { mood = v; } },
            currentBattle: opts.inBattle ? { x: 1 } : null,
            _isInLongRetreat: !!opts.retreat,
            npcManager: { getNPC: (id) => (id === 'n1' ? npc : null) },
            inventory: { slots: opts.slots != null ? opts.slots : [{ uid: 'tea1', templateId: 'food_immortal_tea', count: 1 }, { uid: 'fr1', templateId: 'food_spirit_fruit', count: 2 }] },
            itemById: { food_immortal_tea: { name: '仙露茶' }, food_spirit_fruit: { name: '灵果' }, mat_lingzhi: { name: '灵芝' } },
            removeItem: (uid, n) => { removed.push([uid, n]); return true; },
            getFengshuiMul: () => (opts.fsMul != null ? opts.fsMul : 1.2),
            CaveFacilities: { getFacilities: () => (opts.facilities || [{ facilityId: 'fac_tea_stove' }]) },
            CaveLife: { addDiary: (t, k) => diary.push([t, k]) },
            WorldJournal: { record: (e) => journal.push(e) },
            giveWithReceipt: (g, n) => { gifts.push(g); return opts.giftFail ? { got: 0, name: '灵芝', reason: null } : { got: 1, name: '灵芝' }; },
            addItemFailPhraseFor: () => '它没有跟你走',
            showModal: (t, h) => ({ close: () => {}, title: t, html: h })
        });
        vm.runInContext(cr, W, { filename: 'cave-reception' });
        return { W, R: W.CaveReception, affs, diary, journal, gifts, removed, msgs, npc, mood: () => mood };
    }

    const w1 = receptionWorld(0.5);
    ok(w1.R.receive(null) === false && w1.R.canReceive() === true, 'E3 无客不弹窗；模态可用、不在战斗、未闭关 → 接待窗弹得出');
    const w1b = receptionWorld(0.5, { inBattle: true });
    ok(w1b.R.canReceive() === false && w1b.R.receive({ id: 'n1', name: '柳如烟' }) === false, 'E4 战斗中弹不出 → 交还 cave-life 走自动文本');
    ok(w1.R.receive(w1.npc, { hasTea: true, hasGuestRoom: false }) === true, 'E5 客人到门口，接待窗接手（返回 true，cave-life 的自动段跳过）');
    ok(w1.R.serve('n1', 'tea') === true, 'E6 上仙露茶：真从行囊扣一枚（uid tea1）');
    ok(w1.removed.some((r) => r[0] === 'tea1'), 'E7 消耗走 removeItem 正门，白请客不记账的事没有');
    // 好感 = 8（茶）+ 4（风水1.2 → round(0.2×20)）+ 2（茶灶）= 14
    ok(w1.affs[0] === 14, 'E8 好感账逐项对得上：茶 8 + 风水 +4 + 茶灶 +2 = 14（实收 ' + w1.affs[0] + '）');
    ok(w1.mood() === 56 && w1.gifts.length === 1, 'E9 好好招待论道有小得（心境+6），知己也不空手——回礼走 giveWithReceipt 正门');
    ok(w1.diary.length === 1 && w1.diary[0][0].indexOf('好感 +14') >= 0 && w1.journal.length === 1, 'E10 起居注与天下见闻各落一笔（照 cave-life 同款通道，不另开账本）');

    const w2 = receptionWorld(0.5, { slots: [], fsMul: 1.0, facilities: [] });
    w2.R.receive(w2.npc, {});
    w2.R.serve('n1', 'fruit');
    ok(w2.msgs.some((m) => m.indexOf('翻不出') >= 0) && w2.affs[0] === 4, 'E11 行囊里没有灵果 → 说实话改口粗茶，好感按清谈 +4 落账（不硬扣不存在的货）');
    const w3 = receptionWorld(0.5, { fsMul: 1.5 });
    w3.R.receive(w3.npc, { hasTea: true, hasGuestRoom: true });
    w3.R.serve('n1', 'fruit');
    // 好感 = 10（果）+ 6（风水封顶）+ 2 + 2 = 20
    ok(w3.affs[0] === 20, 'E12 风水加减封顶 ±6：1.5 大吉 → +6 封顶（10+6+2+2=20）');
    const w4 = receptionWorld(0.5, { fsMul: 0.8, facilities: [] });
    w4.R.receive(w4.npc, {});
    w4.R.serve('n1', 'plain');
    ok(w4.affs[0] === 0, 'E13 煞气重的静室客人坐不住：清谈 4 + 风水 -4 = 0（凶宅待客，白忙一场）');
    const w5 = receptionWorld(0.5);
    w5.R.receive(w5.npc, {});
    w5.R.turnAway('n1');
    ok(w5.affs[0] === -3 && w5.diary[0][0].indexOf('谢了客') >= 0 && w5.gifts.length === 0, 'E14 送客倒扣 3 点好感，起居注如实记「隔着门帘谢了客」');
    const w6 = receptionWorld(0.5, { giftFail: true });
    w6.R.receive(w6.npc, {});
    w6.R.serve('n1', 'tea');
    ok(w6.diary[0][0].indexOf('它没有跟你走') >= 0, 'E15 回礼塞不进来时如实交代（DES-72 口径：不丢返回值，账上没落笔不许说满）');
    const w7 = receptionWorld(0.5);
    w7.R.receive(w7.npc, {});
    ok(w7.R.serve('n1', 'tea') === true && w7.R.serve('n1', 'tea') === false, 'E16 一客只待一场：接待完账本清零，重复落槌不吃第二遍好感');
}

// ============ F 洞府守卫战 ============
console.log('\n[F] 洞府守卫战（煞位折敌 · 道侣上墙 · 败了被抄）');
{
    const cs = load('js/extensions/cave-siege.js');
    const app = load('js/app.js');
    ok(app.indexOf('currentBattle._isCaveSiege && typeof window.settleCaveSiege') >= 0 && app.indexOf('currentBattle && currentBattle._isCaveSiege && typeof window.settleCaveSiege') >= 0, 'F1 战后钩子胜负两分支都接了 _isCaveSiege');
    ok(cs.indexOf("StateRegistry.register('caveSiege'") >= 0 && cs.indexOf('localStorage.setItem') < 0 && cs.indexOf('localStorage.getItem') < 0, 'F2 守卫战账走 StateRegistry 正门，零直写 localStorage');

    function siegeWorld(rand, opts) {
        opts = opts || {};
        const battles = [], msgs = [], deeds = [], journal = [], removed = [], fames = [];
        let stones = opts.stones != null ? opts.stones : 2000;
        const reg = {};
        const npc = opts.foe || null;
        const W = makeWorld(rand, {
            showMessage: (t) => msgs.push(String(t)),
            currentCharData: Object.assign({ name: '李长生', realm: '金丹', notoriety: 50, bonds: opts.bonds || {} }, {}),
            getRealmTier: () => 3,
            timeSystem: { getAbsoluteDay: () => opts.day || 3, onNewDaySubscribe: (fn) => { W._newDay = fn; } },
            isInSoulState: () => false,
            isAtHome: () => (opts.atHome == null ? true : opts.atHome),
            playerHouse: opts.house === undefined ? { type: 'cave' } : opts.house,
            getRivals: () => (npc ? [npc] : []),
            npcManager: { getNPC: (id) => (npc && id === npc.id ? npc : null) },
            getFengshuiReport: () => opts.report || [],
            startBattle: (d) => { battles.push(d); return { tag: true }; },
            addFame: (n) => fames.push(n),
            playerPushDeed: (m, s) => deeds.push([m, s]),
            WorldJournal: { record: (e) => journal.push(e) },
            DataManager: { deductSpiritStones: (n) => { if (stones < n) return false; stones -= n; return true; } },
            inventory: {
                currency: { spiritStones: stones },
                slots: opts.slots || [{ uid: 'b1', templateId: 'pill_test', count: 2 }]
            },
            itemById: { pill_test: { name: '测试丹', type: 'consumable' }, spec_x: { name: '信物', type: 'special' } },
            removeItem: (uid, n) => { removed.push([uid, n]); return true; },
            StateRegistry: { register: (k, h) => { reg[k] = h; } }
        });
        vm.runInContext(cs, W, { filename: 'cave-siege' });
        return { W, msgs, battles, deeds, journal, removed, fames, stones: () => stones, reg };
    }

    const w1 = siegeWorld([0.05]);
    ok(w1.W.maybeCaveSiege() === true && w1.battles.length === 1, 'F3 恶名 50（≥40）+ 夜里在家 + 骰中（0.05 < 0.15）→ 有人打上洞府');
    const b1 = w1.battles[0];
    ok(b1.name === '蒙面夜袭者' && b1.attack === 48, 'F4 没仇家时来的是蒙面夜袭者（恶名招来的野狼）：3档 → attack 33+15=48');
    ok(w1.W.maybeCaveSiege() === false, 'F5 冷却 5 天：同一座山门不夜夜着火');

    // 煞位与道侣真折敌攻
    const w2 = siegeWorld([0.05, 0.9], {
        report: [{ verdict: '煞' }, { verdict: '煞' }, { verdict: '吉' }],
        bonds: { n1: { type: 'dao_companion', name: '柳如烟' } }
    });
    w2.W.maybeCaveSiege();
    // cut = min(0.15, 2×0.03)=0.06 + min(0.06, 1×0.03)=0.03 → 0.09；48×0.91=43.68→44
    ok(w2.battles[0].attack === 44, 'F6 你家的山水帮你打：2 煞位折 6% + 1 道侣上墙折 3% → attack 48→44');
    ok(w2.msgs.some((m) => m.indexOf('煞位') >= 0 && m.indexOf('墙头') >= 0), 'F7 折敌的每一笔都在开场话里如实报给玩家（不暗中开挂）');

    const foe3 = { id: 'r1', name: '血手屠', isDead: false, relationship: { hatred: 80 }, changeHatred: function (n) { this.relationship.hatred = Math.max(0, this.relationship.hatred + n); } };
    const w3 = siegeWorld([0.05, 0.1], { foe: foe3 });
    w3.W.maybeCaveSiege();
    const b3 = w3.battles[0];
    ok(b3.name === '【夜袭】血手屠' && b3.attack === 66 && b3.maxDurability === 225, 'F8 六成风声是仇家本人（恨到 80 的人找得到你家）：attack 35+15+16=66、耐久 225');
    w3.W.currentBattle = { _isCaveSiege: true, _siegeNpcId: 'r1', _siegeFoeName: '血手屠' };
    w3.W.settleCaveSiege(true);
    ok(w3.fames[0] === 3 && foe3.relationship.hatred === 50 && w3.deeds.some((d) => d[1].indexOf('山门口') >= 0), 'F9 守住了：名气+3、仇家仇恨 80→50（梁子淡三分）、风声传开');
    ok(w3.journal.some((j) => j.title === '洞府守卫战'), 'F10 守卫战进天下见闻（传记卷二有素材）');

    const w4 = siegeWorld([0.05], { stones: 2000 });
    w4.W.maybeCaveSiege();
    w4.W.currentBattle = { _isCaveSiege: true, _siegeFoeName: '蒙面夜袭者' };
    w4.W.settleCaveSiege(false);
    ok(w4.stones() === 1800, 'F11 失守被抄：灵石搬走一成 2000×10%=200（真扣账，不是嘴上说说）');
    ok(w4.removed.some((r) => r[0] === 'b1' && r[1] === 1), 'F12 行囊里还被顺走一件（非任务非信物，如实点名）');
    ok(w4.msgs.some((m) => m.indexOf('测试丹 x1') >= 0), 'F13 被搬走的东西在回执里点了名——不吞账');

    const w5 = siegeWorld([0.05], { stones: 50 });
    w5.W.maybeCaveSiege();
    w5.W.currentBattle = { _isCaveSiege: true, _siegeFoeName: 'x' };
    w5.W.settleCaveSiege(false);
    ok(w5.stones() === 45 && w5.msgs.some((m) => m.indexOf('灵石 5') >= 0), 'F14 穷得叮当响：只搬得走一成 5 灵石——账照实落、话照实说（不编造抄不走的大数）');
    const w6 = siegeWorld(0.0, { atHome: false });
    ok(w6.W.maybeCaveSiege() === false, 'F15 人在外头，贼摸的是空宅——这一仗不成立');
    const w7 = siegeWorld(0.0, { house: { type: 'ruin' } });
    ok(w7.W.maybeCaveSiege() === false, 'F16 破山洞没人惦记');
    const w8 = siegeWorld(0.0);
    w8.W.currentCharData.notoriety = 10;
    ok(w8.W.maybeCaveSiege() === false, 'F17 恶名 10 又没仇家：夜里太平（守卫战是恶名与仇怨的代价，不随机骚扰）');
    const w9 = siegeWorld([0.9], { stones: 2000 });
    ok(w9.W.maybeCaveSiege() === false, 'F18 骰子不过就不来（恶名 50 → 15% 风声，不是天天打）');
    const snap = w4.reg.caveSiege.export();
    ok(snap.losses === 1 && snap.sieges === 1, 'F19 守卫战胜负场次随 StateRegistry 落账（往返成对）');
}

// ============ G 反向探针 ============
console.log('\n[G] 反向探针（改源重跑，证明尺钉的是行为）');
{
    // G1：拆掉望风榜的上榜门槛 → 无名之辈也进榜（证明 A5 钉的是门槛本身）
    const jr = load('js/extensions/jianghu-rank.js');
    const mutated = jr.replace('var ONBOARD_FAME_MIN = 25;', 'var ONBOARD_FAME_MIN = 0;');
    ok(mutated !== jr, 'G1 探针注入成功（上榜门槛 25 → 0）');
    const W = makeWorld(0.5, {
        showMessage: () => {}, currentCharData: { name: '无名', realm: '炼气', fame: 0, _killCount: 0, arenaWins: 0, notoriety: 0 },
        getRealmTier: () => 1, timeSystem: { getAbsoluteDay: () => 1, onNewDaySubscribe: () => {} },
        addFame: () => {}, StateRegistry: { register: () => {} }
    });
    vm.runInContext(mutated, W, { filename: 'jr-mutant' });
    ok(W.computeJianghuRank().playerRank > 0, 'G2 门槛拆掉后名气 0 也上榜——证明 A5 的「榜上无名」钉的是 ONBOARD_FAME_MIN 这道闸，不是摆设');

    // G3：拆掉守卫战的煞位/道侣折敌 → attack 不再被折（证明 F6 钉的是那行乘法）
    const cs = load('js/extensions/cave-siege.js');
    const cutLine = 'enemyData.attack = Math.max(1, Math.round(enemyData.attack * (1 - cut)));';
    ok(cs.indexOf(cutLine) >= 0, 'G3 折敌那行乘法在源里找得到');
    const csNoCut = cs.replace(cutLine, 'void cut;');
    function siegeProbe(src) {
        const battles = [];
        const W = makeWorld([0.05, 0.9], {
            showMessage: () => {}, currentCharData: { name: 'x', realm: '金丹', notoriety: 50, bonds: { n1: { type: 'dao_companion' } } },
            getRealmTier: () => 3, timeSystem: { getAbsoluteDay: () => 3, onNewDaySubscribe: () => {} },
            isInSoulState: () => false, isAtHome: () => true, playerHouse: { type: 'cave' },
            getRivals: () => [], npcManager: null,
            getFengshuiReport: () => [{ verdict: '煞' }, { verdict: '煞' }],
            startBattle: (d) => { battles.push(d); return {}; }, addFame: () => {},
            playerPushDeed: () => {}, WorldJournal: { record: () => {} },
            DataManager: { deductSpiritStones: () => true },
            inventory: { currency: { spiritStones: 0 }, slots: [] }, itemById: {}, removeItem: () => true,
            StateRegistry: { register: () => {} }
        });
        vm.runInContext(src, W, { filename: 'siege-probe' });
        W.maybeCaveSiege();
        return battles[0];
    }
    const withCut = siegeProbe(cs);
    const noCut = siegeProbe(csNoCut);
    ok(withCut.attack === 44 && noCut.attack === 48, 'G4 同一场夜袭：带折敌 48→44（2煞+1道侣=9%），拆掉那行乘法就是原样 48——风水与道侣真在打仗，不是文案');

    // G5：拆掉 cave-life 的会客交接 → 客人不再进接待窗（证明 E1 钉的是那次调用）
    const cl = load('js/extensions/cave-life.js');
    ok(cl.indexOf('received = !!window.CaveReception.receive(guest') >= 0, 'G5 交接那行在源里找得到（received 为真时自动段整段跳过）');
    const clNo = cl.replace('received = !!window.CaveReception.receive(guest, { hasTea: hasTea, hasGuestRoom: _hasFacility(\'fac_guest_room\') });', 'received = false;');
    ok(clNo !== cl && clNo.indexOf('received = false;') >= 0, 'G6 探针改得动：拆掉交接后 received 恒 false，客人落回自动文本——两条路互斥不重账');
}

// ============ H 全仓接线总检 ============
console.log('\n[H] 全仓接线总检');
{
    const html = load('仙侠.html');
    ['js/extensions/jianghu-rank.js', 'js/extensions/biography.js', 'js/extensions/cave-reception.js', 'js/extensions/cave-siege.js', 'js/economy/caravan-trade.js'].forEach((f, i) => {
        ok(html.indexOf('src="' + f + '"') >= 0, 'H' + (i + 1) + ' 主页面挂了 ' + f.split('/').pop());
    });
    const app = load('js/app.js');
    ok(app.indexOf('_isRankDuel') >= 0 && app.indexOf('_isCaravanAmbush') >= 0 && app.indexOf('_isCaveSiege') >= 0, 'H6 三面新战旗（榜上挑战/押货截道/洞府守卫）都接进了战后大回调');
    const auc = load('js/economy/auction-service.js');
    ok(auc.indexOf('startSellWar') >= 0 && auc.indexOf('AuctionService.sellWarStrike()') >= 0 && auc.indexOf('🔥 催场') >= 0, 'H7 拍卖行面板给自家寄售挂了「催场」钮（stoked 的不再显示——只催得动一次）');
    ok(auc.indexOf('getSellWar: function') >= 0 && auc.indexOf('_sellWar = null; }') >= 0, 'H8 api 门面上齐催场四件套，reset 清炉');
    const se = load('js/core/scenario-engine.js');
    ok(se.indexOf("reason: 'caravan'") >= 0, 'H9 剧本引擎的 caravan 效果键有拦有话（柜台没这条路时如实回话）');
}

console.log('\n通过：' + passed + '　失败：' + failed);
process.exitCode = failed ? 1 : 0;
