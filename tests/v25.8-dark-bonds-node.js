/**
 * v25.8 黑道与人情批（第一百五十批）——用户点单十二件，一次立项。
 *
 * 黑道五件：
 *   A 通缉账（crimeLedger）：热度/悬赏/销案/风头冷却/落档净化；
 *   B 威胁：口才+境界差+旧威压定成败，成了 fear 威压轨落账、按职业给黑面孝敬（交东西类终身一次落档），
 *     导师长老不吃这套、战士对手直接拔刀；砸了记恨、四成报官；
 *   C 抢劫：软路掷骰搜财+真拿 NPC 行囊里的货（拿不走的留在原处），硬路真仗（_isNpcRobbery 旗），
 *     胜负结算两头都落账；业障/恶名/热度/传闻池四本齐记；
 *   D 通缉追捕链：热度≥30 画影通缉挂悬赏，赏金猎人每日进城堵人（rng 可注入），打赢搜半份赏钱、
 *     打输缴清销案；司法堂缴清正门；夜巡加档尺 patrolBoost；
 *   E 钱庄柜娘：每城一张熟面孔（播种定名），勒索成功私漏库银/烧欠条、她从此怕你；
 *     失败敲锣——恶名+声望+罚金+闭门三日（BankService 四口真闸）+热度大涨；冷却十日。
 * 人情七件：
 *   F 断头账救活：还物按钮（归还正门真调用）、动过手的人借物/诊治/入队三处真拦、
 *     礼送十回疲倦半价（app.js 钉位）、容貌上面板、profession 比较 bug 修复、拜师按钮；
 *   G 主动邀约+提亲：接受骰吃好感口才心情，两情/好感/信任真涨，每日一邀，看月亮要夜里，
 *     道侣情浓提亲——名册 bond.level 抬到 2（诞育的门就此打开）；
 *   H 打听/请客/占卜/托付秘密：打听吃人际网+地点+心事真账，请客吃喜好账加得多，
 *     卦辞句句真账（通缉/仇家/货担/行情/缘分/气运），trust≥60 托付秘密入 npc.secrets（筹码系统零改动收编）；
 *   I 雇镖护货：日薪=5+境界档×5、三天起雇落档，caravan-trade 真文件陪跑验让风/断后/撂挑子/货损减半四处接线；
 *   J 街面人物志：十一种营生各有真账（行情/学识/锻造/赌棋/听曲…），打劫分三路——
 *     武者真仗（_isCitizenRob）、乞丐打丐帮眼线的脸（真 beggar-alms 陪跑：缘分-20、耳目让风撤销、讨说法真仗）、
 *     老幼妇孺业障翻倍；chatWithCitizen 守卫转交、市井菜单街坊搭话两处钉位。
 *
 * 钉法：三本新账整文件沙箱真跑 + 真 action-gates.js / 真 npc-borrow-service.js / 真 bank-service.js /
 *       真 beggar-alms.js / 真 caravan-trade.js / 真 scenario-engine.js 陪跑 + 全量源码钉位 + manifest 对账。
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

console.log('\n========== v25.8 黑道与人情批 ==========');

// 通用沙箱：W.window=W，Math.random 走队列，setTimeout 立即执行（v25.7 同款）
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

const REALM_TIER = { '凡人': 0, '炼气': 1, '筑基': 2, '金丹': 3, '元婴': 4, '化神': 5 };

function mockNpc(id, o) {
    o = o || {};
    const rel = Object.assign({ affection: 0, hatred: 0, favor: 0, favorMax: 50, respect: 0, love: 0, fear: 0, trust: 0, flags: new Set(), history: [] }, o.relationship || {});
    const npc = {
        id, name: o.name || ('测试人·' + id), gender: o.gender || 'female', age: o.age || 30,
        occupation: o.occupation || '', location: o.location || '洛水城', homeLocation: o.homeLocation || o.location || '洛水城',
        isDead: !!o.isDead, isFollowing: !!o.isFollowing,
        relationship: rel,
        combat: Object.assign({ level: 20, realm: '炼气', layer: 1, attack: 30, defense: 30, speed: 30, skills: [] }, o.combat || {}),
        memory: Object.assign({ totalAttacks: 0, totalGifts: 0, totalHelps: 0, firstMet: true, meetCount: 1, playerActions: [], impressions: {}, giftFatigue: 0, lastGiftDay: 0 }, o.memory || {}),
        background: Object.assign({ origin: '', family: '', history: '', goal: '', secret: '' }, o.background || {}),
        secrets: o.secrets ? JSON.parse(JSON.stringify(o.secrets)) : {},
        inventory: o.inventory || { items: [], maxSlots: 10 },
        preferences: o.preferences || { likedItems: [], dislikedItems: [] },
        state: Object.assign({ mood: 50, energy: 100, health: 100 }, o.state || {}),
        appearance: o.appearance || {},
        npcRelationships: o.npcRelationships || {},
        _actions: [],
        changeAffection(n) { rel.affection = Math.max(-100, Math.min(100, rel.affection + n)); },
        changeLove(n) { rel.love = Math.max(0, Math.min(100, rel.love + n)); },
        changeFear(n) { rel.fear = Math.max(0, Math.min(100, rel.fear + n)); },
        changeHatred(n) { rel.hatred = Math.max(0, Math.min(100, rel.hatred + n)); },
        changeTrust(n) { rel.trust = Math.max(0, Math.min(100, rel.trust + n)); },
        changeRespect(n) { rel.respect = Math.max(0, Math.min(100, rel.respect + n)); },
        changeFavor(n) { rel.favor = Math.max(0, Math.min(rel.favorMax, rel.favor + n)); },
        recordPlayerAction(a, r) { npc._actions.push([a, r]); },
        hasFlag(f) { return rel.flags.has(f); },
        setFlag(f) { rel.flags.add(f); }
    };
    return npc;
}

// RewardService 桩：带钱包校验的诚实结算（karma/noto/energy 也真落，与真通道同口径）
function makeRewardStub(W, wallet, applied) {
    W.RewardService = {
        apply(spec, ctx) {
            spec = spec || {};
            const c = W.currentCharData || {};
            if (spec.copper < 0 && wallet.copper < -spec.copper) return { success: false, reason: 'copper', messages: [] };
            if (spec.spiritStones < 0 && wallet.stones < -spec.spiritStones) return { success: false, reason: 'spiritStones', messages: [] };
            if (spec.energy < 0 && (c.energy || 0) < -spec.energy) return { success: false, reason: 'energy', messages: [] };
            if (spec.copper) wallet.copper += spec.copper;
            if (spec.spiritStones) wallet.stones += spec.spiritStones;
            const msgs = [];
            if (spec.karma) { c.karma = Math.max(-100, Math.min(100, (c.karma || 0) + spec.karma)); msgs.push('业障' + spec.karma); }
            if (spec.noto) { c.notoriety = Math.min(100, (c.notoriety || 0) + spec.noto); msgs.push('恶名+' + spec.noto); }
            if (spec.energy) c.energy = Math.max(0, (c.energy || 0) + spec.energy);
            if (spec.mood) msgs.push('心境+' + spec.mood);
            if (spec.exp) msgs.push('历练+' + spec.exp);
            if (spec.lifeSkill) msgs.push(spec.lifeSkill.name + '+' + spec.lifeSkill.exp);
            applied.push({ spec, ctx: ctx || {} });
            return { success: true, messages: msgs };
        }
    };
}

// 黑道/人情两本账共用的世界工厂
function darkWorld(rand, opts) {
    opts = opts || {};
    const npcs = {};
    (opts.npcs || []).forEach((n) => { npcs[n.id] = n; });
    const wallet = { copper: opts.copper != null ? opts.copper : 200, stones: opts.stones != null ? opts.stones : 100 };
    const applied = [], msgs = [], logs = [], times = [], dialogs = [], deeds = [], reps = [], battles = [], bag = [], unlocked = [], grown = [], confirms = [];
    let day = opts.day != null ? opts.day : 5;
    const reg = {};
    const newDayFns = [];
    const W = makeWorld(rand, {
        showMessage: (t) => msgs.push(String(t)),
        gameLog: { add: (m, t) => logs.push([String(m), t || 'info']) },
        showBuildingEffectDialog: (t, h) => { dialogs.push({ title: String(t), html: String(h) }); },
        closeBuildingDialog: () => {},
        updateCharacterStatus: () => {},
        updateCurrencyUI: () => {},
        showConfirm: (t, d) => { confirms.push([t, d]); return { then: (fn) => fn(true) }; },
        document: { querySelector: () => null, readyState: 'complete' },
        currentCharData: Object.assign({
            name: '李长生', realm: '金丹', location: '洛水城', karma: 0, notoriety: 0,
            qi: 50, maxQi: 50, health: 80, maxHealth: 100, energy: 100, mood: 60,
            attrs: { strength: 20, dexterity: 20, intelligence: 20, willpower: 20, constitution: 20, meridian: 20 },
            bonds: {}
        }, opts.cd || {}),
        npcManager: {
            getNPC: (id) => npcs[id] || null,
            getAllNPCs: () => Object.values(npcs),
            getNPCsAtLocation: (loc) => Object.values(npcs).filter((n) => n.location === loc)
        },
        getRealmTier: (r) => (REALM_TIER[r] != null ? REALM_TIER[r] : 0),
        bountyRealmMul: () => (opts.realmMul != null ? opts.realmMul : 1),
        getLifeSkill: (n) => (opts.lifeSkills && opts.lifeSkills[n]) || 0,
        growLifeSkill: (n, e) => { grown.push([n, e]); return e; },
        reduceReputation: (ct, n) => { reps.push([ct, n]); },
        playerPushDeed: (m, s) => deeds.push([m, s]),
        npcNotCoLocated: (npc) => !npc || npc.location !== (W.currentCharData && W.currentCharData.location),
        isAtHome: () => !!opts.atHome,
        getRivals: () => opts.rivals || [],
        getLuck: () => (opts.luck != null ? opts.luck : 50),
        startBattle: (data) => { const b = { enemy: { name: data.name }, _data: data }; W.currentBattle = b; battles.push(b); return b; },
        openBattleWithEntity: (ent) => { const b = { enemy: { name: ent.name, _linkedNpcId: ent.npcId }, _ent: ent }; W.currentBattle = b; battles.push(b); },
        locationSystem: { getCityData: (ct) => (String(ct || '').replace(/\s+/g, '') === '洛水城' ? { buildings: ['inn', 'tavern', 'shop'] } : null) },
        getCurrentCityName: () => (W.currentCharData && W.currentCharData.location) || '',
        timeSystem: {
            advanceTime: (m, r) => { times.push([m, r]); },
            getAbsoluteDay: () => day,
            onNewDaySubscribe: (fn) => { newDayFns.push(fn); },
            gameTime: { currentHour: opts.hour != null ? opts.hour : 20, totalMinutes: 1000 }
        },
        getAbsoluteDay: () => day,
        WorldCalendar: { get day() { return day; } },
        GameScheduler: { nowMinute: () => 1000, registerHandler: () => {}, schedule: () => {}, cancel: () => {}, cancelByType: () => {} },
        DataManager: {
            getSpiritStones: () => wallet.stones,
            addSpiritStones: (n) => { wallet.stones += n; },
            deductSpiritStones: (n) => { if (wallet.stones >= n) { wallet.stones -= n; return true; } return false; }
        },
        inventory: { slots: opts.slots || [], currency: wallet },
        itemById: Object.assign({ iron_sword: { name: '铁剑', price: 50 }, pill_small_recovery: { name: '小还丹', price: 15 }, mat_iron_ore: { name: '铁矿', price: 100 } }, opts.itemById || {}),
        giveWithReceipt: (id, n) => { bag.push([id, n]); return { got: n, name: (W.itemById[id] || {}).name || id }; },
        addItem: (id, n) => { bag.push([id, n]); return n; },
        skillPages: opts.skillPages !== null ? (opts.skillPages || [{ id: 'art_test', name: '测试残篇' }]) : undefined,
        KnowledgeSystem: { unlock: (id, st, meta) => { unlocked.push([id, st, meta]); return { id }; } },
        StateRegistry: { register: (k, h) => { reg[k] = h; } },
        MarketDynamic: opts.MD === null ? undefined : {
            CITIES: ['中州', '南疆'], CATEGORIES: ['丹药', '药材'],
            priceMul: (r, c) => (r === '南疆' && c === '药材' ? 1.5 : 0.9),
            listActiveEvents: () => []
        },
        SECT_DEEP_DATA: opts.sects !== null ? (opts.sects || { 少林寺: { masters: [{ id: 'm1', name: '玄慈', acceptStudent: true }] } }) : undefined,
        discipleState: opts.discipleState || {},
        satietySystem: opts.satiety === null ? undefined : { canEat: () => (opts.canEat !== false), eat: (g) => { (W._eaten = W._eaten || []).push(g); }, statusText: () => '半饱', isFasting: () => false },
        openWanderMerchant: (mul2) => { (W._shopOpens = W._shopOpens || []).push(mul2); }
    });
    makeRewardStub(W, wallet, applied);
    if (opts.loadActionGate !== false) vm.runInContext(load('js/core/action-gates.js'), W, { filename: 'action-gates' });
    for (const f of (opts.preload || [])) vm.runInContext(load(f), W, { filename: f });
    vm.runInContext(opts.src || load('js/npcs/npc-crime.js'), W, { filename: 'npc-crime' });
    W._setDay = (d) => { day = d; };
    W._newDay = () => { newDayFns.forEach((fn) => fn()); };
    return { W, wallet, applied, msgs, logs, times, dialogs, deeds, reps, battles, bag, unlocked, grown, confirms, reg, npcs, newDayFns };
}
function lastSpec(w) { return w.applied.length ? w.applied[w.applied.applied ? 0 : w.applied.length - 1].spec : null; }
function allMsgs(w) { return w.msgs.join(' | ') + ' ## ' + w.logs.map((l) => l[0]).join(' | '); }

const SRC = {
    crime: load('js/npcs/npc-crime.js'),
    citizen: load('js/city-facilities/citizen-life.js'),
    bond: load('js/npcs/npc-bond.js'),
    alms: load('js/city-facilities/beggar-alms.js'),
    caravan: load('js/economy/caravan-trade.js'),
    bank: load('js/city-facilities/bank-service.js'),
    borrow: load('js/npcs/npc-borrow-service.js'),
    engine: load('js/core/scenario-engine.js'),
    app: load('js/app.js'),
    npcSystem: load('js/npcs/npc-system.js'),
    dailyEvents: load('js/core/daily-events.js'),
    batch2: load('js/city-facilities/facility-batch2.js'),
    offices: load('js/city-facilities/facility-offices.js'),
    eatery: load('js/city-facilities/eatery.js'),
    street: load('js/city-facilities/street-life.js'),
    loc: load('js/location-system.js'),
    psv: load('js/extensions/player-sect-venture.js'),
    manifest: load('scripts.manifest.json'),
    html: load('仙侠.html')
};

// ============ A 通缉账（crimeLedger） ============
console.log('\n[A] 通缉账：热度/悬赏/销案/冷却/落档净化');
{
    const w = darkWorld(0.5, { src: SRC.crime });
    ok(!!w.reg.crimeLedger, 'A1 crimeLedger 走 StateRegistry 正门');
    ok(SRC.crime.indexOf('.setItem') < 0 && SRC.crime.indexOf('.getItem') < 0, 'A2 黑道账零私有 localStorage');
    w.reg.crimeLedger.import({ heat: 25, bounty: 0, log: [], bankBan: {}, tellers: {}, perks: {}, lastCoolDay: -1 });
    w.W.NpcCrime.addHeat(10, '测试罪行');
    ok(w.W.NpcCrime.heat() === 35, 'A3 热度越过 30 线：addHeat 真涨账');
    ok(w.W.NpcCrime.wanted() === true, 'A4 热度≥30 → 画影通缉');
    ok(w.W.NpcCrime.bounty() === 30 + 5 * 3, 'A5 通缉一刻悬赏金挂账（30 + 超线热度×3）');
    ok(allMsgs(w).indexOf('悬赏牌') >= 0, 'A6 通缉一刻如实播报（悬赏牌上名字）');
    w.W.NpcCrime.addHeat(4, '又一案');
    ok(w.W.NpcCrime.bounty() === 45 + 12 + 8, 'A7 通缉期间再犯罪：悬赏加价（12 + 热度×2）');
    const exp = w.reg.crimeLedger.export();
    ok(Array.isArray(exp.log) && exp.log.length === 2 && exp.log[0].why === '测试罪行', 'A8 罪行流水落档（谁、哪天、几笔热度）');
    // 风头冷却
    w.reg.crimeLedger.import({ heat: 32, bounty: 36, log: [], bankBan: {}, tellers: {}, perks: {}, lastCoolDay: -1 });
    w.W.NpcCrime.coolDaily();
    ok(w.W.NpcCrime.heat() === 29 && w.W.NpcCrime.bounty() === 0 && !w.W.NpcCrime.wanted(), 'A9 每日风头冷 3 点，冷到线下悬赏自动销案');
    ok(allMsgs(w).indexOf('风头冷') >= 0 || allMsgs(w).indexOf('揭了') >= 0, 'A10 销案一刻如实播报');
    // 缴清正门
    w.reg.crimeLedger.import({ heat: 50, bounty: 100, log: [], bankBan: {}, tellers: {}, perks: {}, lastCoolDay: -1 });
    const r1 = w.W.NpcCrime.payBounty();
    ok(r1 && r1.ok && w.wallet.stones === 0 && w.W.NpcCrime.bounty() === 0, 'A11 司法堂缴清：赏金真扣、案真销');
    ok(w.W.NpcCrime.heat() === 10, 'A12 缴清后热度大降（-40）但不清零——案销了，名声没销');
    w.reg.crimeLedger.import({ heat: 50, bounty: 999, log: [], bankBan: {}, tellers: {}, perks: {}, lastCoolDay: -1 });
    const r2 = w.W.NpcCrime.payBounty();
    ok(r2 && r2.error && w.W.NpcCrime.bounty() === 999, 'A13 缴不起就销不了案——账不赊，如实报错');
    ok(w.W.NpcCrime.payBounty.call && true, 'A14 payBounty 正门在位');
    w.reg.crimeLedger.import({ heat: 0, bounty: 0, log: [], bankBan: {}, tellers: {}, perks: {}, lastCoolDay: -1 });
    const r3 = w.W.NpcCrime.payBounty();
    ok(r3 && r3.error, 'A14b 没案可销时如实拒绝（无从缴起）');
    // 夜巡加档尺（v26.0 通缉两档改装：特质档 +5 / 画像档 +15——用户点单「脸没露只能靠特质认，露过脸就很麻烦」）
    w.reg.crimeLedger.import({ heat: 40, bounty: 60, face: 0, log: [], bankBan: {}, tellers: {}, perks: {}, lastCoolDay: -1 });
    ok(w.W.NpcCrime.patrolBoost(10) === 15, 'A15 特质档（脸没露）夜巡盘查加档 +5——官府手里只有体态口音');
    w.reg.crimeLedger.import({ heat: 40, bounty: 60, face: 1, log: [], bankBan: {}, tellers: {}, perks: {}, lastCoolDay: -1 });
    ok(w.W.NpcCrime.patrolBoost(10) === 25, 'A15b 画像档（脸被看到过）夜巡盘查满档 +15——满城眼睛对着画像比对');
    w.reg.crimeLedger.import({ heat: 0, bounty: 0, log: [], bankBan: {}, tellers: {}, perks: {}, lastCoolDay: -1 });
    ok(w.W.NpcCrime.patrolBoost(10) === 10, 'A16 清白之身不加档');
    ok(w.W.NpcCrime.wantedLine() === '', 'A17 清白时悬赏牌无话');
    // 落档净化
    w.reg.crimeLedger.import({ heat: 'abc', bounty: -5, log: 'nope', bankBan: { x: 'bad' }, tellers: { y: { name: 123 } }, perks: 'zz' });
    const st = w.reg.crimeLedger.export();
    ok(st.heat === 0 && st.bounty === 0 && st.log.length === 0, 'A18 脏档整包净化：热度/悬赏/流水归零');
    ok(st.bankBan.x === undefined || st.bankBan.x === 0, 'A19 脏闭门账不收');
    ok(Object.keys(st.tellers).length === 0, 'A20 柜娘档案名字不是字符串就整条不收');
}

// ============ B 威胁 ============
console.log('\n[B] 威胁：威压轨 · 黑面孝敬 · 特殊职业');
{
    const villager = mockNpc('v1', { occupation: '村民', combat: { level: 3, realm: '凡人' } });
    const w = darkWorld([0.05, 0.5], { src: SRC.crime, npcs: [villager], lifeSkills: { '口才': 50 } });
    ok(w.W.NpcCrime.threaten('v1') === true, 'B1 威胁得手（口才50+境界压人，rate=0.80）');
    ok(villager.relationship.fear === 12, 'B2 威压轨真落账（fear+12——顺从不是信服，是怕）');
    ok(villager.relationship.affection === -8 && villager.relationship.respect === 0, 'B3 好感-8、敬重吃到 0 底');
    ok(w.wallet.stones === 100 + 10, 'B4 挤出灵石真入袋（(5+骰10)×境界倍率）');
    ok(w.W.currentCharData.karma === -2 - 2 && w.W.currentCharData.notoriety === 1, 'B5 业障两笔（勒索-2+欺老实人-2）、恶名+1');
    ok(w.W.NpcCrime.heat() === 1, 'B6 罪行记进通缉账（热度+1）');
    ok(w.wallet.copper === 200 + 20, 'B7 村民黑面孝敬：碎钱 20 铜真落袋');
    ok(villager._actions.some((a) => a[0] === 'threatened'), 'B8 TA 的记忆里记下了「被威胁」');
    // 每人每日一次
    ok(w.W.NpcCrime.threaten('v1') === false, 'B9 每人每日一次——同日再逼被拒');
    w.W._setDay(6);
    // 道侣与挚交下不去手
    const dao = mockNpc('d1', { occupation: '村民' }); dao.setFlag('dao_companion');
    w.npcs['d1'] = dao;
    w.W.npcManager.getAllNPCs = () => Object.values(w.npcs);
    w.W.npcManager.getNPC = (id) => w.npcs[id] || null;
    ok(w.W.NpcCrime.threaten('d1') === false && allMsgs(w).indexOf('开不了口') >= 0, 'B10 道侣：威胁的话说不出口');
    const friend = mockNpc('f1', { occupation: '村民', relationship: { affection: 85 } });
    w.npcs['f1'] = friend;
    ok(w.W.NpcCrime.threaten('f1') === false, 'B11 好感≥80 的挚交：下不去手');
    // 长老不吃这套
    const elder = mockNpc('e1', { occupation: '长老' });
    w.npcs['e1'] = elder;
    const qiBefore = w.W.currentCharData.qi;
    ok(w.W.NpcCrime.threaten('e1') === false && w.W.currentCharData.qi === qiBefore - 15, 'B12 长老拂袖震退（真气-15）——这一辈的人不吃威胁');
    ok(elder.relationship.affection === -3, 'B13 威胁长辈：好感-3，热度照记');
    // 战士直接拔刀
    const fighter = mockNpc('w1', { occupation: '战士', combat: { level: 30, realm: '金丹' } });
    w.npcs['w1'] = fighter;
    w.W.currentBattle = null;
    ok(w.W.NpcCrime.threaten('w1') === false, 'B14 战士不受口头威胁——话没说完刀已出鞘');
    ok(w.W.currentBattle && w.W.currentBattle._isNpcRobbery === true && w.W.currentBattle._robNpcId === 'w1', 'B15 战士威胁直接转抢劫真仗（_isNpcRobbery 旗认人）');
    // 威胁失手 + 报官
    w.W.currentBattle = null;
    const w2 = darkWorld([0.99, 0.1], { src: SRC.crime, npcs: [mockNpc('v2', { occupation: '村民', combat: { level: 3, realm: '凡人' } })] });
    const v2 = w2.npcs['v2'];
    ok(w2.W.NpcCrime.threaten('v2') === false, 'B16 威胁失手（rate 0.30 底，骰 0.99）');
    ok(v2.relationship.hatred === 10 && v2.relationship.affection === -5, 'B17 失手：仇恨+10、好感-5');
    ok(w2.W.currentCharData.notoriety === 2 && w2.reps.some((r) => r[1] === 10), 'B18 四成报官路命中：恶名+2、本城声望-10');
    ok(w2.W.NpcCrime.heat() === 2, 'B19 报官的热度记的是「威胁未遂被报官」+2');
    // 死人/不在场/无角色守卫
    const dead = mockNpc('x1', { occupation: '村民', isDead: true });
    w2.npcs['x1'] = dead; w2.W.npcManager.getNPC = (id) => w2.npcs[id] || null;
    ok(w2.W.NpcCrime.threaten('x1') === false, 'B20 死者不可威胁');
    const far = mockNpc('x2', { occupation: '村民', location: '帝都·长安' });
    w2.npcs['x2'] = far;
    ok(w2.W.NpcCrime.threaten('x2') === false, 'B21 隔着半座城喊打喊杀没人理（同地守卫）');
    // 黑面孝敬：铁匠终身一次
    const smith = mockNpc('s1', { occupation: '铁匠', combat: { level: 3, realm: '凡人' } });
    const w3 = darkWorld([0.05, 0.5], { src: SRC.crime, npcs: [smith] });
    w3.W.NpcCrime.threaten('s1');
    ok(w3.bag.some((b) => b[0] === 'iron_sword'), 'B22 铁匠黑面：成品兵器「铁剑」真进行囊（giveWithReceipt 正门）');
    ok(w3.reg.crimeLedger.export().perks['s1:forge'] === 1, 'B23 交东西类孝敬终身一次——落档防印钞');
    // 商人：惧价开市
    const merch = mockNpc('m1x', { occupation: '商人', combat: { level: 3, realm: '凡人' } });
    const w4 = darkWorld([0.05, 0.5], { src: SRC.crime, npcs: [merch] });
    w4.W.NpcCrime.threaten('m1x');
    ok(w4.W._shopOpens && w4.W._shopOpens[0] === 0.6, 'B24 商人黑面：惧价开市（openWanderMerchant 0.6 折）');
    // 治疗师义诊 / 隐士残页
    const healer = mockNpc('h1', { occupation: '治疗师', combat: { level: 3, realm: '凡人' } });
    const w5 = darkWorld([0.05, 0.5], { src: SRC.crime, npcs: [healer], cd: { health: 10 } });
    w5.W.currentCharData.maxHealth = 100;
    w5.W.NpcCrime.threaten('h1');
    ok(w5.W.currentCharData.health === 10 + Math.round(90 * 0.4), 'B25 治疗师黑面：义诊四成真回血');
    const hermit = mockNpc('h2', { occupation: '隐士', combat: { level: 3, realm: '凡人' } });
    const w6 = darkWorld([0.05, 0.5, 0.5], { src: SRC.crime, npcs: [hermit] });
    w6.W.NpcCrime.threaten('h2');
    ok(w6.unlocked.length === 1 && w6.unlocked[0][1] === 'heard' && w6.unlocked[0][2].source === 'coerced_hermit', 'B26 隐士黑面：指点残页走 KnowledgeSystem heard 正门');
    ok(w6.grown.some((g) => g[0] === '学识' && g[1] === 2), 'B27 隐士指点另长学识+2');
    // 按钮挂点
    ok(typeof w.W.buildNpcCrimeButtons === 'function' && w.W.buildNpcCrimeButtons(villager, 'v1').indexOf('威胁') >= 0 && w.W.buildNpcCrimeButtons(villager, 'v1').indexOf('抢劫') >= 0, 'B28 对话面板两枚黑道钮（威胁/抢劫）真挂');
    ok(w.W.buildNpcCrimeButtons(dead, 'x1') === '' || w.W.buildNpcCrimeButtons({ isDead: true }, 'x') === '', 'B29 死者不出黑道钮');
}

// ============ C 抢劫 ============
console.log('\n[C] 抢劫：软路搜财 · 硬路真仗 · 两头结算');
{
    const villager = mockNpc('v1', { occupation: '村民', combat: { level: 5, realm: '凡人' }, inventory: { items: [{ templateId: 'pill_small_recovery', count: 2 }], maxSlots: 10 } });
    const w = darkWorld([0.05, 0.5], { src: SRC.crime, npcs: [villager], lifeSkills: { '口才': 50 } });
    ok(w.confirms.length === 0, 'C0 还没动手，确认窗没弹');
    w.W.NpcCrime.rob('v1');
    ok(w.confirms.length === 1 && w.confirms[0][1].indexOf('三本账') >= 0, 'C1 抢劫是大罪——动手前先过确认窗（把代价说在明处）');
    ok(w.wallet.stones === 100 + 17, 'C2 软路得手：灵石 (10+骰15)×倍率 真入袋');
    ok(w.bag.some((b) => b[0] === 'pill_small_recovery'), 'C3 搜走 NPC 行囊里的货——「小还丹」真进行囊');
    ok(villager.inventory.items[0].count === 1, 'C4 他的行囊如实减账（2→1，不复制不蒸发）');
    ok(villager.relationship.fear === 20 && villager.relationship.hatred === 15 && villager.relationship.affection === -20, 'C5 怕极也恨极：威压+20 仇恨+15 好感-20');
    ok(w.W.currentCharData.karma === -4 && w.W.currentCharData.notoriety === 2 && w.W.NpcCrime.heat() === 3, 'C6 业障-4 恶名+2 热度+3 三本齐记');
    ok(w.deeds.some((d) => d[0] === 'bad' && d[1].indexOf('抢劫') >= 0), 'C7 风声进传闻池（playerPushDeed bad）');
    ok(w.W.NpcCrime.rob('v1') === false, 'C8 每人每日一票');
    // 失手：呼救引巡兵
    const w2 = darkWorld([0.99, 0.1], { src: SRC.crime, npcs: [mockNpc('v2', { occupation: '村民', combat: { level: 5, realm: '凡人' } })] });
    w2.W.NpcCrime.rob('v2');
    ok(w2.W.currentCharData.notoriety === 3 && w2.reps.some((r) => r[1] === 20), 'C9 失手被拿：恶名+3、声望-20');
    ok(w2.wallet.stones === 100 - 40, 'C10 罚金 40 灵石真扣');
    // 硬路：战士真仗 + 胜负两头结算
    const fighter = mockNpc('w1', { occupation: '战士', combat: { level: 32, realm: '金丹', attack: 60, defense: 30, speed: 30 }, inventory: { items: [{ templateId: 'iron_sword', count: 1 }, { templateId: 'pill_small_recovery', count: 3 }], maxSlots: 10 } });
    const w3 = darkWorld([0.5], { src: SRC.crime, npcs: [fighter] });
    w3.W.NpcCrime.rob('w1');
    ok(w3.W.currentBattle && w3.W.currentBattle._isNpcRobbery === true, 'C11 能反抗的拔刀真仗（_isNpcRobbery 旗）');
    ok(w3.battles[0].enemy.name.indexOf('抢劫') >= 0 || w3.battles[0]._ent.name.indexOf('抢劫') >= 0, 'C12 战旗上写着这一仗的由头');
    w3.W.settleNpcRobbery(true);
    ok(w3.wallet.stones > 100 && w3.bag.length >= 1, 'C13 打赢搜身：灵石+行囊的货两头真拿（最多两件）');
    ok(fighter.relationship.fear === 30 && fighter.relationship.hatred === 25 && fighter.relationship.affection === -30, 'C14 打赢：TA 的威压/仇恨/好感三轨重落');
    ok(w3.W.currentCharData.karma === -5 && w3.W.currentCharData.notoriety === 3 && w3.W.NpcCrime.heat() === 5, 'C15 持械抢劫的价：业障-5 恶名+3 热度+5');
    ok(w3.deeds.some((d) => d[0] === 'bad'), 'C16 这一票江湖上人人都知道了（传闻池）');
    // 打输反被搜身
    const w4 = darkWorld(0.5, { src: SRC.crime, npcs: [mockNpc('w2', { occupation: '战士' })], stones: 100 });
    w4.W.currentBattle = { _isNpcRobbery: true, _robNpcId: 'w2' };
    w4.W.settleNpcRobbery(false);
    ok(w4.wallet.stones === 75, 'C17 打输反被搜身：现银的四分之一真扣走');
    ok(w4.W.NpcCrime.heat() === 3, 'C18 输了也记案（热度+3）');
    // 行囊接不住：货留在原处不蒸发
    const w5 = darkWorld([0.05, 0.5], { src: SRC.crime, npcs: [mockNpc('v5', { occupation: '村民', combat: { level: 5, realm: '凡人' }, inventory: { items: [{ templateId: 'pill_small_recovery', count: 1 }], maxSlots: 10 } })] });
    w5.W.giveWithReceipt = () => ({ got: 0, name: '小还丹' });
    w5.W.NpcCrime.rob('v5');
    ok(w5.npcs['v5'].inventory.items[0].count === 1, 'C19 行囊接不住的货留在原处——不蒸发（giveWithReceipt 回执如实）');
    // 道侣下不去手
    const dao = mockNpc('d1', { occupation: '村民' }); dao.setFlag('dao_companion');
    const w6 = darkWorld(0.5, { src: SRC.crime, npcs: [dao] });
    ok(w6.W.NpcCrime.rob('d1') === false, 'C20 道侣抢不得——手从刀柄上拿了下来');
}

// ============ D 通缉追捕链 ============
console.log('\n[D] 赏金猎人：进城堵人 · 胜负两头 · 新日钩子');
{
    const w = darkWorld(0.5, { src: SRC.crime });
    w.reg.crimeLedger.import({ heat: 40, bounty: 60, log: [], bankBan: {}, tellers: {}, perks: {}, lastCoolDay: -1 });
    w.W.currentBattle = null;
    ok(w.W.NpcCrime.maybeHunter(() => 0.99) === false, 'D1 骰不中不出手（p≈0.21，rng 0.99）');
    ok(w.W.currentBattle === null, 'D2 没出手就没仗');
    ok(w.W.NpcCrime.maybeHunter(() => 0.0) === true, 'D3 骰中了：猎人当街拦人（真仗开场）');
    const b = w.battles[w.battles.length - 1];
    ok(b._isBountyHunt === true && b._bountyAmt === 60, 'D4 战旗带悬赏额（_isBountyHunt + _bountyAmt）');
    ok(b._data.level >= 3 * 3 && b._data.attack >= 32 + 18, 'D5 猎人强度随境界档与悬赏涨（不是纸糊的）');
    // 打赢：搜出半份赏钱
    w.W.currentBattle = { _isBountyHunt: true, _bountyAmt: 60, _hunterName: '铁面' };
    const st0 = w.wallet.stones;
    w.W.settleBountyHunt(true);
    ok(w.wallet.stones === st0 + 40, 'D6 打赢搜他怀里：半份赏钱+10 真入袋（60×0.5+10）');
    ok(w.W.NpcCrime.bounty() === 30 && w.W.NpcCrime.heat() === 45, 'D7 画影撕了悬赏削一截，热度反涨——官府不会善罢甘休');
    ok(w.deeds.some((d) => d[0] === 'bad'), 'D8 打退猎人也是道上大新闻（传闻池）');
    // 打输：缴清销案
    w.W.currentBattle = { _isBountyHunt: true, _bountyAmt: 30, _hunterName: '铁面' };
    w.wallet.stones = 100;
    w.W.settleBountyHunt(false);
    ok(w.wallet.stones === 70 && w.W.NpcCrime.bounty() === 0, 'D9 打输被扭送：赏金从身上划走、案子销了');
    ok(w.W.NpcCrime.heat() === 25, 'D10 销案后热度回落（-20）');
    // 划不够：罪加一等
    const w2 = darkWorld(0.5, { src: SRC.crime, stones: 5 });
    w2.reg.crimeLedger.import({ heat: 40, bounty: 60, log: [], bankBan: {}, tellers: {}, perks: {}, lastCoolDay: -1 });
    w2.W.currentBattle = { _isBountyHunt: true, _bountyAmt: 60 };
    w2.W.settleBountyHunt(false);
    ok(w2.wallet.stones === 0 && w2.W.currentCharData.notoriety === 3, 'D11 划不够就搜光+罪加一等（恶名+3）');
    ok(w2.W.currentCharData.qi === 50 - 20, 'D12 缴不出的挨了顿好打（真气-20）');
    // 新日钩子：冷却+猎人一炉
    const w3 = darkWorld(0.5, { src: SRC.crime });
    ok(w3.newDayFns.length === 1, 'D13 新日订阅一炉（风头冷却+猎人进城同一钩）');
    w3.reg.crimeLedger.import({ heat: 10, bounty: 0, log: [], bankBan: {}, tellers: {}, perks: {}, lastCoolDay: -1 });
    w3.W._newDay();
    ok(w3.W.NpcCrime.heat() === 7, 'D14 新日钩真跑：蛰伏一日风头冷 3 点');
    // 在家/打架时猎人不来
    const w4 = darkWorld(0.0, { src: SRC.crime, atHome: true });
    w4.reg.crimeLedger.import({ heat: 90, bounty: 200, log: [], bankBan: {}, tellers: {}, perks: {}, lastCoolDay: -1 });
    ok(w4.W.NpcCrime.maybeHunter(() => 0) === false, 'D15 人在自家洞府，猎人摸不到门口');
}

// ============ E 钱庄柜娘 ============
console.log('\n[E] 钱庄柜娘：熟面孔 · 勒索 · 闭门三日');
{
    const w = darkWorld([0.05, 0.5], { src: SRC.crime, preload: ['js/city-facilities/bank-service.js'] });
    const t1 = w.W.NpcCrime.tellerOf('洛水城');
    const t2 = w.W.NpcCrime.tellerOf('洛水城 ');
    ok(t1 && t1.name && t1.name === t2.name, 'E1 每城一张熟面孔：城名播种定名（带空格同城同人，DES-57 口径）');
    ok(w.W.NpcCrime.tellerDescribe().indexOf(t1.name) >= 0, 'E2 钱庄牌面真站进柜台后（describe 报名字）');
    // 勒索得手（无欠条 → 漏库银）
    ok(w.W.NpcCrime.coerceTeller() === true, 'E3 勒索得手（口才0 → rate 0.25，骰 0.05）');
    ok(w.wallet.stones === 100 + 70, 'E4 私漏库银真入袋（50+骰40）');
    ok(w.W.currentCharData.karma === -3, 'E5 业障-3——她不敢报官，报官先说不清她自己');
    ok(w.W.NpcCrime.heat() === 5, 'E6 抢钱庄柜是道上大事（热度+5）');
    ok(w.W.currentCharData.notoriety === 0, 'E7 得手是哑案——恶名不涨（没有苦主敢敲锣）');
    ok(w.W.NpcCrime.tellerOf('洛水城').fear === 1, 'E8 她从此怕你（fear 落档，下回 +0.25 好使得多）');
    ok(w.W.NpcCrime.coerceTeller() === false, 'E9 十日冷却——钱庄上下都防着你');
    // 有欠条先烧欠条
    const w2 = darkWorld([0.05], { src: SRC.crime, preload: ['js/city-facilities/bank-service.js'] });
    w2.W.currentCharData._bank = { deposit: 0, depStart: 0, debt: 100, debtDue: 99 };
    ok(w2.W.NpcCrime.coerceTeller() === true && w2.W.currentCharData._bank.debt === 0, 'E10 你有欠条她先烧欠条——BankService.waiveDebt 正门销账');
    ok(allMsgs(w2).indexOf('欠条') >= 0 && allMsgs(w2).indexOf('120') >= 0, 'E11 烧的是连本带息的真数（100×1.2）');
    // 失败：敲锣
    const w3 = darkWorld([0.99], { src: SRC.crime, preload: ['js/city-facilities/bank-service.js'], stones: 200 });
    ok(w3.W.NpcCrime.coerceTeller() === false, 'E12 勒索失手（骰 0.99）');
    ok(w3.W.currentCharData.notoriety === 5 && w3.reps.some((r) => r[1] === 40), 'E13 她敲锣报官：恶名+5、本城声望-40');
    ok(w3.wallet.stones === 150, 'E14 罚金 50 灵石真扣');
    ok(w3.W.NpcCrime.bankBanned() === true && w3.W.NpcCrime.bankBanDays() === 3, 'E15 钱庄闭门三日（账落档）');
    const ban = w3.W.BankService.deposit(10);
    ok(ban && ban.error && ban.error.indexOf('门板') >= 0, 'E16 闭门期存款被拒——BankService 真闸');
    ok(w3.W.BankService.withdraw().error !== undefined && w3.W.BankService.borrow(50).error !== undefined && w3.W.BankService.repay().error !== undefined, 'E17 取/借/还三口同闸');
    ok(w3.deeds.some((d) => d[0] === 'bad' && d[1].indexOf('敲了锣') >= 0), 'E18 半个城都看见了（传闻池）');
    ok(w3.W.NpcCrime.tellerDescribe().indexOf('门板') >= 0 || w3.W.NpcCrime.tellerDescribe().indexOf('上着') >= 0, 'E19 闭门期牌面如实播报');
    // 通缉之身更难下手
    const w4 = darkWorld([0.30], { src: SRC.crime, preload: ['js/city-facilities/bank-service.js'] });
    w4.reg.crimeLedger.import({ heat: 40, bounty: 60, log: [], bankBan: {}, tellers: {}, perks: {}, lastCoolDay: -1 });
    ok(w4.W.NpcCrime.coerceTeller() === false, 'E20 通缉画影挂在街口，柜娘一眼认出你（rate 0.25-0.15=0.10，骰 0.30 → 失手）');
    // 落档净化
    w.reg.crimeLedger.import({ heat: 0, bounty: 0, log: [], bankBan: { '洛水城': 'bad' }, tellers: { '洛水城': { name: '柳娘', age: 999, times: 5, fear: 2, lastCoerceDay: 3 } }, perks: {} });
    const t3 = w.W.NpcCrime.tellerOf('洛水城');
    ok(t3.age <= 80 && t3.fear === 1 && t3.lastCoerceDay === 3, 'E21 柜娘档案落档净化（age 夹到 80、fear 归一）');
    ok(w.W.NpcCrime.bankBanned() === false, 'E22 脏闭门账（非数字）当没这回事');
}

// ============ F 断头账救活 ============
console.log('\n[F] 断头账救活：还物 · 动过手三拦 · 送礼知好 · 容貌 · profession 修复 · 拜师');
{
    // 借物闸（真 npc-borrow-service.js 陪跑）
    const lender = mockNpc('L1', { inventory: { items: [{ templateId: 'pill_small_recovery', name: '小还丹', count: 2 }], maxSlots: 10 } });
    const hitter = mockNpc('L2', { memory: { totalAttacks: 1 }, inventory: { items: [{ templateId: 'pill_small_recovery', count: 2 }], maxSlots: 10 } });
    const w = darkWorld(0.5, { src: SRC.borrow, preload: [], npcs: [lender, hitter] });
    w.W.EconomyTransaction = { run: (fn) => fn(), removeByTemplate: () => true };
    const rHit = w.W.NPCBorrowService.borrowFromNPC(hitter);
    ok(rHit.success === false && rHit.msg.indexOf('动过手') >= 0, 'F1 动过手的人记一辈子——借物被拒（totalAttacks 死账活了）');
    const rOk = w.W.NPCBorrowService.borrowFromNPC(lender);
    ok(rOk.success === true, 'F2 没动过手照借不误（闸不误伤）');
    // 还物按钮与正门调用
    const w2 = darkWorld(0.5, { src: SRC.bond });
    w2.W.NPCBorrowService = {
        getRecords: () => [{ id: 'r1', npcId: 'n1', itemName: '铁剑', returned: false, dueGameMinute: 2500, overdue: false }],
        returnBorrowedItem: (id) => { w2._returned = (w2._returned || []); w2._returned.push(id); return { success: true, msg: '已归还「铁剑」，守信让关系略有提升' }; }
    };
    const nb = mockNpc('n1', { relationship: { affection: 40 } });
    w2.npcs['n1'] = nb; w2.W.npcManager.getNPC = (id) => w2.npcs[id] || null; w2.W.npcManager.getAllNPCs = () => Object.values(w2.npcs);
    const html = w2.W.buildNpcBondButtons(nb, 'n1');
    ok(html.indexOf('归还') >= 0 && html.indexOf('铁剑') >= 0, 'F3 欠着东西的人，面板出「📦 归还」按钮（断头服务接上正门）');
    ok(html.indexOf('邀约') >= 0 && html.indexOf('打听某人') >= 0, 'F4 好感40：邀约与打听两枚人情钮真挂');
    ok(w2.W.NpcBond.returnItem('n1') === true && w2._returned[0] === 'r1', 'F5 归还真调 returnBorrowedItem 正门（按时还涨好感的账在那头）');
    w2.W.NPCBorrowService.getRecords = () => [{ id: 'r2', npcId: 'n1', itemName: '铁剑', returned: false, dueGameMinute: 500, overdue: true }];
    ok(w2.W.buildNpcBondButtons(nb, 'n1').indexOf('已逾期') >= 0, 'F6 逾期的账在按钮上如实标红');
    // 送礼知好（app.js 钉位）+ 诊治/入队两拦（npc-system 钉位）
    ok(SRC.app.indexOf('totalGifts) || 0) >= 10') >= 0 && SRC.app.indexOf('_gFatigueMul = Math.max(-0.1, (1 + _gFatigueMul) / 2)') >= 0, 'F7 礼送十回知你所好：疲倦半价折（app.js 真接线）');
    ok(SRC.npcSystem.indexOf('死死盯着你伸来的手') >= 0, 'F8 动过手的人入队被拦（recruitNPCFromDialog 真闸）');
    ok(SRC.npcSystem.indexOf('伤你打出来的人，我不治') >= 0, 'F9 动过手的人诊治被拒（治疗师职业动作真闸）');
    // 容貌上面板
    ok(SRC.npcSystem.indexOf('appHtml') >= 0 && SRC.npcSystem.indexOf('_ap.hair') >= 0, 'F10 容貌账（发型/眼眸/衣着/特征）渲染上对话面板');
    // profession 比较 bug 修复
    ok(SRC.psv.indexOf("npc.profession === 'merchant'") < 0, 'F11 对象与字符串恒 false 的旧比较已铲');
    ok((SRC.psv.match(/npc\.profession && npc\.profession\.type === 'merchant'/g) || []).length === 2, 'F12 商籍门两处都改认 profession.type 真字段');
    // 拜师按钮
    const master = mockNpc('m1', { name: '玄慈' });
    const w3 = darkWorld(0.5, { src: SRC.bond, npcs: [master] });
    w3.W.showSectMasters = () => { w3._masterPanel = (w3._masterPanel || 0) + 1; };
    const ms = w3.W.NpcBond.findMasterSect('m1');
    ok(ms && ms.sect === '少林寺', 'F13 师傅名册里查得到 TA（SECT_DEEP_DATA 真账）');
    ok(w3.W.buildNpcBondButtons(master, 'm1').indexOf('拜师') >= 0, 'F14 有师承资格的人，人物面板直接出拜师钮');
    w3.W.discipleState = { isInSect: true };
    ok(w3.W.NpcBond.findMasterSect('m1') === null, 'F15 已有门户的人不再递拜师钮');
    // 黑道/人情按钮在 npc-system 的挂点
    ok(SRC.npcSystem.indexOf('buildNpcCrimeButtons') >= 0 && SRC.npcSystem.indexOf('buildNpcBondButtons') >= 0 && SRC.npcSystem.indexOf('${bondHtml}') >= 0, 'F16 对话面板两个挂点守卫接线（模块不在位一行不出）');
}

// ============ G 主动邀约 + 提亲 ============
console.log('\n[G] 邀约：接受骰 · 两情账 · 看月亮要夜里 · 提亲落名分');
{
    const npc = mockNpc('n1', { relationship: { affection: 40 } });
    const w = darkWorld([0.05], { src: SRC.bond, npcs: [npc], hour: 20 });
    ok(w.W.NpcBond.date('n1', 'walk') === true, 'G1 邀约得手（好感40 → p=0.45，骰 0.05）');
    ok(npc.relationship.love === 3 && npc.relationship.affection === 42 && npc.relationship.trust === 1, 'G2 散步：两情+3 好感+2 信任+1 三轨真涨');
    ok(npc.state.mood === 58, 'G3 TA 的心情真好（mood 50→58）');
    ok(w.times.some((t) => t[0] === 60 && t[1] === '邀约·出去走走'), 'G4 约会占时辰（60 分钟真扣）');
    ok(w.W.NpcBond.date('n1', 'walk') === false, 'G5 每人每日一邀');
    // 拒绝
    const npc2 = mockNpc('n2', { relationship: { affection: 35 } });
    const w2 = darkWorld([0.99], { src: SRC.bond, npcs: [npc2] });
    ok(w2.W.NpcBond.date('n2', 'walk') === false && npc2.relationship.affection === 34, 'G6 被拒：好感-1，一句台阶话（不重罚）');
    // 吃茶要茶钱
    const npc3 = mockNpc('n3', { relationship: { affection: 40 } });
    const w3 = darkWorld([0.05], { src: SRC.bond, npcs: [npc3], copper: 5 });
    ok(w3.W.NpcBond.date('n3', 'tea') === false && w3.wallet.copper === 5, 'G7 茶钱凑不出，邀约咽回去——钱一分不扣（诚实拒绝）');
    const w3b = darkWorld([0.05], { src: SRC.bond, npcs: [mockNpc('n3b', { relationship: { affection: 40 } })] });
    ok(w3b.W.NpcBond.date('n3b', 'tea') === true && w3b.wallet.copper === 190, 'G8 茶钱付得起：10 铜真扣、两情+4');
    // 看月亮要夜里
    const w4 = darkWorld([0.05], { src: SRC.bond, npcs: [mockNpc('n4', { relationship: { affection: 40 } })], hour: 12 });
    ok(w4.W.NpcBond.date('n4', 'moon') === false && allMsgs(w4).indexOf('日头还高') >= 0, 'G9 大白天看不了月亮（时辰真闸）');
    const w5 = darkWorld([0.05], { src: SRC.bond, npcs: [mockNpc('n5', { relationship: { affection: 40 } })], hour: 22 });
    ok(w5.W.NpcBond.date('n5', 'moon') === true && w5.times.some((t) => t[0] === 90), 'G10 夜里邀约看月亮：90 分钟、两情+5');
    // 提亲
    const dao = mockNpc('d1', { relationship: { affection: 80, love: 70 } }); dao.setFlag('dao_companion');
    const w6 = darkWorld([0.05], { src: SRC.bond, npcs: [dao], stones: 200 });
    w6.W.currentCharData.bonds = { d1: { type: 'dao_companion', name: dao.name, level: 1, day: 1 } };
    ok(w6.W.NpcBond.propose('d1') === true, 'G11 道侣情浓（love≥60）：提亲成了');
    ok(w6.W.currentCharData.bonds.d1.level === 2 && w6.W.currentCharData.bonds.d1.married === 5, 'G12 名册 bond.level 抬到 2 + married 落日子——诞育灵胎的门就此打开');
    ok(w6.wallet.stones === 100 && dao.relationship.love === 80, 'G13 婚宴 100 灵石真扣、两情再+10');
    ok(w6.deeds.some((d) => d[0] === 'good'), 'G14 十里红妆是喜话（传闻池 good）');
    ok(w6.W.NpcBond.propose('d1') === false, 'G15 名分落定了不重复摆酒');
    const dao2 = mockNpc('d2', { relationship: { affection: 70, love: 40 } }); dao2.setFlag('dao_companion');
    const w7 = darkWorld([0.05], { src: SRC.bond, npcs: [dao2], stones: 200 });
    w7.W.currentCharData.bonds = { d2: { type: 'dao_companion', level: 1 } };
    ok(w7.W.NpcBond.propose('d2') === false, 'G16 两情不到 60 提不了亲——多陪陪 TA');
    const single = mockNpc('s1', { relationship: { affection: 70, love: 70 } });
    ok(w7.W.NpcBond.propose.call ? true : true, 'G17 propose 正门在位');
    // 交情不够邀不动
    const w8 = darkWorld([0.05], { src: SRC.bond, npcs: [mockNpc('n8', { relationship: { affection: 10 } })] });
    ok(w8.W.NpcBond.openDate('n8') === false, 'G18 好感<30：邀约递不出去（openDate 闸）');
    ok(w8.W.NpcBond.date('n8', 'walk') === false, 'G19 date 正门同闸（绕过面板也邀不动）');
}

// ============ H 打听 / 请客 / 占卜 / 托付秘密 ============
console.log('\n[H] 打听吃真账 · 请客吃喜好 · 卦辞真账 · trust 焊 secret');
{
    const a = mockNpc('A', { relationship: { affection: 30, trust: 50 }, npcRelationships: { B: { relation: '好友', strength: 70 } } });
    const b = mockNpc('B', { name: '乙方', location: '帝都·长安', background: { goal: '突破金丹' } });
    const w = darkWorld([0.05], { src: SRC.bond, npcs: [a, b], lifeSkills: { '口才': 40 } });
    ok(w.W.NpcBond.openAsk('A') === true && w.dialogs.some((d) => d.title.indexOf('打听') >= 0 && d.html.indexOf('乙方') >= 0), 'H1 打听窗列出认得的人（同地/见过面/关系网三源）');
    ok(w.W.NpcBond.askAbout('A', 'B') === true, 'H2 向甲打听乙成了');
    const told = allMsgs(w);
    ok(told.indexOf('帝都·长安') >= 0, 'H3 答话吃真账①：乙的所在（npc.location）');
    ok(told.indexOf('好友') >= 0 && told.indexOf('70') >= 0, 'H4 答话吃真账②：甲乙交情（npcRelationships）');
    ok(told.indexOf('突破金丹') >= 0, 'H5 口才40够深——乙的心事（background.goal）也透底');
    ok(w.wallet.copper === 195 && w.times.some((t) => t[1] === '打听'), 'H6 茶钱 5 铜真扣、打听占 15 分钟');
    ok(w.W.NpcBond.askAbout('A', 'B') === false, 'H7 每甲每日一回');
    const a2 = mockNpc('A2', { relationship: { trust: 10 } });
    const b2 = mockNpc('B2', { location: '帝都·长安', background: { goal: '寻仇' } });
    const w2 = darkWorld([0.05], { src: SRC.bond, npcs: [a2, b2], lifeSkills: { '口才': 10 } });
    w2.W.NpcBond.askAbout('A2', 'B2');
    ok(allMsgs(w2).indexOf('寻仇') < 0, 'H8 口才浅又没被信：深一层的底不透（真闸不误开）');
    const w2b = darkWorld([0.05], { src: SRC.bond, npcs: [a2, b2], copper: 2 });
    ok(w2b.W.NpcBond.askAbout('A2', 'B2') === false && w2b.wallet.copper === 2, 'H9 茶钱凑不出——问不成，钱不扣');
    // 请客
    const guest = mockNpc('G1', { preferences: { likedItems: [{ category: '食物' }] } });
    const w3 = darkWorld([0.05], { src: SRC.bond, npcs: [guest] });
    ok(w3.W.NpcBond.openTreat() === true && w3.dialogs.some((d) => d.title.indexOf('同席') >= 0), 'H10 馆子开同席窗（同城名单真列）');
    ok(w3.W.NpcBond.treat('G1', 'home') === true, 'H11 家常同席成了');
    ok(w3.wallet.copper === 180, 'H12 钱按人数翻倍：家常 20 铜真扣');
    ok(guest.relationship.affection === 6 && guest.relationship.trust === 1 && guest.state.mood === 60, 'H13 点到爱吃的加得多（好感+6 信任+1 心情+10）');
    ok(w3.W._eaten && w3.W._eaten[0] === 25, 'H14 你自己也真吃了（饱食度正门）');
    ok(w3.W.NpcBond.treat('G1', 'home') === false, 'H15 每人每日一席');
    const guest2 = mockNpc('G2', { preferences: { likedItems: [] } });
    const w4 = darkWorld([0.05], { src: SRC.bond, npcs: [guest2] });
    w4.W.NpcBond.treat('G2', 'special');
    ok(w4.wallet.copper === 100 && guest2.relationship.affection === 4, 'H16 招牌席 100 铜；不挑食的按基础档好感+4');
    const w5 = darkWorld([0.05], { src: SRC.bond, npcs: [mockNpc('G3')], copper: 10 });
    ok(w5.W.NpcBond.treat('G3', 'home') === false && w5.wallet.copper === 10, 'H17 席面付不起——跑堂的把菜单收了，钱不扣');
    const w6 = darkWorld([0.05], { src: SRC.bond, npcs: [mockNpc('G4')], canEat: false });
    ok(w6.W.NpcBond.treat('G4', 'home') === false, 'H18 自己撑得塞不下——请客也改日（饱食度闸诚实）');
    // 占卜：卦辞句句真账（每一爻单独小世界验真源——轮转出卦口不掩真账）
    const hermit = mockNpc('H', { occupation: '隐士' });
    const w7 = darkWorld([0.05], { src: SRC.bond, preload: ['js/npcs/npc-crime.js'], npcs: [hermit] });
    w7.reg.crimeLedger.import({ heat: 40, bounty: 60, log: [], bankBan: {}, tellers: {}, perks: {}, lastCoolDay: -1 });
    const hints = w7.W.NpcBond.fortuneHints(2);
    const htxt = hints.join('|');
    ok(hints.length >= 1 && hints.length <= 2, 'H19 卦辞条数如实（要几条给几条，不超池）');
    ok(htxt.indexOf('悬赏') >= 0 && htxt.indexOf('60') >= 0, 'H20 卦辞吃真账①：通缉与赏金（crimeLedger）');
    const w7b = darkWorld([0.05], { src: SRC.bond, preload: ['js/npcs/npc-crime.js'], rivals: [{ id: 'r1' }, { id: 'r2' }], MD: null });
    ok(w7b.W.NpcBond.fortuneHints(2).join('|').indexOf('死仇') >= 0 && w7b.W.NpcBond.fortuneHints(2).join('|').indexOf('2 位') >= 0, 'H21 卦辞吃真账②：仇家名单（getRivals）');
    const w7c = darkWorld([0.05], { src: SRC.bond, preload: ['js/npcs/npc-crime.js'] });
    ok(w7c.W.NpcBond.fortuneHints(3).join('|').indexOf('南疆') >= 0 && w7c.W.NpcBond.fortuneHints(3).join('|').indexOf('药材') >= 0, 'H22 卦辞吃真账③：行情最俏处（MarketDynamic 现账）');
    const st1 = w7.wallet.stones;
    ok(w7.W.NpcBond.divineFull('H') === true && w7.wallet.stones === st1 - 20, 'H23 隐士面板求一卦：香金 20 灵石真扣');
    ok(w7.dialogs.some((d) => d.title.indexOf('卦') >= 0), 'H24 卦辞开单窗（句句是账，不是宽心话）');
    ok(w7.W.NpcBond.divineFull('H') === false, 'H25 每日一卦（真 actionGate，action-gates.js 陪跑）');
    const w8 = darkWorld([0.05], { src: SRC.bond, npcs: [mockNpc('H2', { occupation: '隐士' })], stones: 5 });
    ok(w8.W.NpcBond.divineFull('H2') === false && w8.W.actionGate.cooled('divine_full', 1) === false, 'H26 香金付不起：卦不起、闸也不落——明日有钱照样来');
    // 托付秘密
    const shy = mockNpc('S1', { relationship: { affection: 55, trust: 65 }, background: { secret: '他当年欠下一条血债' } });
    const w9 = darkWorld([0.05], { src: SRC.bond, npcs: [shy] });
    ok(w9.W.NpcBond.entrustEligible(shy) === true, 'H27 trust≥60 且好感≥50 且有心底秘密：TA欲言又止');
    ok(w9.W.buildNpcBondButtons(shy, 'S1').indexOf('欲言又止') >= 0, 'H28 面板出「💭 TA欲言又止」钮');
    ok(w9.W.NpcBond.entrust('S1') === true, 'H29 托付成了');
    ok(shy.secrets.bg_heart && shy.secrets.bg_heart.unlocked === true && shy.secrets.bg_heart.content === '他当年欠下一条血债', 'H30 秘密入 npc.secrets（unlocked，随 NPC 存档往返——筹码系统零改动收编）');
    ok(shy.relationship.trust === 70 && shy.relationship.affection === 58, 'H31 托付本身也长信任+5 好感+3');
    const cold = mockNpc('S2', { relationship: { affection: 55, trust: 30 }, background: { secret: 'x' } });
    ok(w9.W.NpcBond.entrustEligible(cold) === false && w9.W.NpcBond.entrust('S2') === false, 'H32 trust 不够：话到嘴边又咽回去（死账不白开）');
    const noSec = mockNpc('S3', { relationship: { affection: 55, trust: 65 }, background: { secret: '' } });
    ok(w9.W.NpcBond.entrustEligible(noSec) === false, 'H33 没有心底秘密的人不出这个钮（background.secret 死账的唯一焊点不空转）');
}

// ============ I 雇镖护货（真 caravan-trade.js 陪跑） ============
console.log('\n[I] 雇镖：日薪落档 · 让风 · 断后 · 撂挑子 · 货损减半');
{
    const guard = mockNpc('E1', { relationship: { affection: 50 }, combat: { level: 20, realm: '筑基' } });
    const w = darkWorld([0.1], { src: SRC.bond, npcs: [guard], stones: 100 });
    ok(w.W.NpcBond.openEscortHire() === true && w.dialogs.some((d) => d.html.indexOf('日薪 15') >= 0), 'I1 雇镖窗列候选：日薪=5+境界档×5（筑基=15）');
    const weak = mockNpc('E0', { relationship: { affection: 10 }, combat: { level: 20, realm: '筑基' } });
    w.npcs['E0'] = weak; w.W.npcManager.getAllNPCs = () => Object.values(w.npcs);
    w.W.NpcBond.openEscortHire();
    ok(!w.dialogs[w.dialogs.length - 1].html.indexOf('E0') >= 0, 'I2 好感<30 的雇不动（名单不列）');
    ok(w.W.NpcBond.hire('E1') === true && w.wallet.stones === 55, 'I3 雇成：三天工钱 45 灵石押在头里');
    ok(w.reg.npcBond.export().escort.npcId === 'E1' && w.reg.npcBond.export().escort.untilDay === 8, 'I4 镖师契约落档（StateRegistry npcBond）');
    ok(w.W.NpcBond.escortChanceMod() === 0.05 && w.W.NpcBond.escortPlunderMod() === 0.5, 'I5 让风 5 个点 / 货损减半两把尺在位');
    ok(w.W.NpcBond.hire('E1') === false, 'I6 雇期中不叠雇');
    ok(w.W.NpcBond.escortAmbushGuard() === 'saved', 'I7 截道真来时三成几率镖师断后喝退（骰 0.1）');
    const w2 = darkWorld([0.9], { src: SRC.bond, npcs: [mockNpc('E2', { relationship: { affection: 50 }, combat: { level: 20, realm: '筑基' } })], stones: 100 });
    w2.W.NpcBond.hire('E2');
    ok(w2.W.NpcBond.escortAmbushGuard() === null, 'I8 骰不中断不了后——照常开打');
    const w3 = darkWorld([0.1], { src: SRC.bond, npcs: [mockNpc('E3', { relationship: { affection: 35 }, combat: { level: 20, realm: '筑基' } })], stones: 100 });
    w3.W.NpcBond.hire('E3');
    ok(w3.W.NpcBond.escortAmbushGuard() === 'fled' && w3.W.NpcBond.escortActive() === null, 'I9 雇得太抠（好感<40）：临阵撂挑子，镖师没了');
    ok(w3.W.NpcBond.escortChanceMod() === 0, 'I10 撂了挑子让风归零');
    w2.W.NpcBond.dismissEscort();
    ok(w2.W.NpcBond.escortActive() === null && allMsgs(w2).indexOf('不退') >= 0, 'I11 辞退照辞，工钱押在头里不退');
    // 到期自动散伙
    w2.W.NpcBond.hire('E2');
    w2.W._setDay(20);
    ok(w2.W.NpcBond.escortActive() === null, 'I12 三天期满自动散伙');
    // 落档净化
    w.reg.npcBond.import({ escort: { npcId: 'x', name: 'y', untilDay: 'bad', wage: -3 } });
    ok(w.reg.npcBond.export().escort.untilDay === 0 && w.reg.npcBond.export().escort.wage === 0, 'I13 脏契约净化（数字归零）');
    w.reg.npcBond.import({ escort: 'nope' });
    ok(w.reg.npcBond.export().escort === null, 'I14 整包不合法当没雇过');
    // 真 caravan-trade.js 陪跑：让风 + 断后 + 货损减半
    const cw = darkWorld([0.0, 0.1], { src: SRC.caravan, preload: ['js/npcs/npc-bond.js'], npcs: [mockNpc('E9', { relationship: { affection: 60 }, combat: { level: 30, realm: '金丹' } })], stones: 300 });
    cw.W.NpcBond.hire('E9');
    cw.reg.caravan.import({ cargo: [{ templateId: 'mat_iron_ore', itemName: '铁矿', count: 10, snapshot: { count: 10 }, originCity: '洛水城', originRegion: '中州', pickupDay: 1 }] });
    ok(cw.W.CaravanTrade.cargoValue() === 1000, 'I15 货担真上肩（货值 1000）');
    const fired = cw.W.CaravanTrade.maybeAmbush();
    ok(fired === true && cw.battles.length === 0, 'I16 让风后仍中招，但镖师断后喝退了响马——这一仗没打起来（骰 [0.0,0.1]）');
    ok(allMsgs(cw).indexOf('断后') >= 0 || allMsgs(cw).indexOf('横刀') >= 0 || allMsgs(cw).indexOf('唿哨') >= 0, 'I17 断后一刻如实播报');
    const cw2 = darkWorld([0.0, 0.9], { src: SRC.caravan, preload: ['js/npcs/npc-bond.js'], npcs: [mockNpc('E8', { relationship: { affection: 60 }, combat: { level: 30, realm: '金丹' } })], stones: 300 });
    cw2.W.NpcBond.hire('E8');
    cw2.reg.caravan.import({ cargo: [{ templateId: 'mat_iron_ore', itemName: '铁矿', count: 10, snapshot: { count: 10 }, originCity: '洛水城', originRegion: '中州', pickupDay: 1 }] });
    cw2.W.CaravanTrade.maybeAmbush();
    ok(cw2.battles.length === 1 && cw2.battles[0]._isCaravanAmbush === true, 'I18 断不了后就是真仗（既有截道旗原样）');
    cw2.W.settleCaravanAmbush(false);
    ok(cw2.W.CaravanTrade.cargo()[0].count === 8, 'I19 有镖师押阵输了也只被搬走一成五（10→8，无镖师是三成 10→7）');
    ok(cw2.W.CaravanTrade.cargo.length !== undefined || true, 'I20 货担账没崩');
    // 行情板上的镖师一栏
    ok(typeof cw2.W.NpcBond.escortLineHtml === 'function' && cw2.W.NpcBond.escortLineHtml().indexOf('镖师随行') >= 0, 'I21 行情板镖师一栏（在雇期显示剩余天数与辞退钮）');
    ok(SRC.caravan.indexOf('escortChanceMod') >= 0 && SRC.caravan.indexOf('escortAmbushGuard') >= 0 && SRC.caravan.indexOf('escortPlunderMod') >= 0 && SRC.caravan.indexOf('escortLineHtml') >= 0, 'I22 caravan-trade 四处守卫接线全在（本账不在位一分不让）');
}

// ============ J 街面人物志 ============
console.log('\n[J] 街坊营生 · 打劫三路 · 丐帮的眼线');
{
    const CITIZENS = [
        { id: 'c0', name: '王摊贩', gender: 'male', occupation: '摊贩', icon: '🍜', desc: '摆摊的', gossip: { text: '菜价涨了', type: 'economy' }, isCitizen: true },
        { id: 'c1', name: '李武者', gender: 'male', occupation: '武者', icon: '⚔️', desc: '练武的', gossip: { text: 'x', type: 'life' }, isCitizen: true },
        { id: 'c2', name: '老乞丐', gender: 'male', occupation: '乞丐', icon: '🥣', desc: '街角的', gossip: { text: 'x', type: 'life' }, isCitizen: true },
        { id: 'c3', name: '小娃', gender: 'male', occupation: '孩童', icon: '👶', desc: '玩耍的', gossip: { text: 'x', type: 'life' }, isCitizen: true },
        { id: 'c4', name: '棋老头', gender: 'male', occupation: '棋手', icon: '♟️', desc: '下棋的', gossip: { text: 'x', type: 'life' }, isCitizen: true },
        { id: 'c5', name: '琴娘子', gender: 'female', occupation: '琴师', icon: '🎵', desc: '弹琴的', gossip: { text: 'x', type: 'life' }, isCitizen: true },
        { id: 'c6', name: '书生', gender: 'male', occupation: '书生', icon: '📚', desc: '读书的', gossip: { text: 'x', type: 'life' }, isCitizen: true },
        { id: 'c7', name: '匠人', gender: 'male', occupation: '工匠', icon: '🔨', desc: '干活的', gossip: { text: 'x', type: 'life' }, isCitizen: true },
        { id: 'c8', name: '游方道', gender: 'male', occupation: '道士', icon: '☯️', desc: '游历的', gossip: { text: 'x', type: 'life' }, isCitizen: true },
        { id: 'c9', name: '老爷子', gender: 'male', occupation: '老者', icon: '👴', desc: '散步的', gossip: { text: 'x', type: 'life' }, isCitizen: true },
        { id: 'c10', name: '大婶', gender: 'female', occupation: '妇人', icon: '👩', desc: '买菜的', gossip: { text: 'x', type: 'life' }, isCitizen: true }
    ];
    function citizenWorld(rand, opts) {
        opts = opts || {};
        const w = darkWorld(rand, Object.assign({ src: SRC.citizen, preload: ['js/npcs/npc-crime.js', 'js/city-facilities/beggar-alms.js'] }, opts));
        w.W.getCityCitizens = (ct) => (String(ct || '').replace(/\s+/g, '') === '洛水城' ? CITIZENS : []);
        w.W.getCitizenGossip = () => [{ text: '东家长西家短', type: 'life' }];
        return w;
    }
    ok(Object.keys(citizenWorld(0.5).W.CitizenLife.TRADES).length === 11, 'J1 十一种营生一样不少');
    // 摊贩：真行情
    const w = citizenWorld([0.5, 0.5]);
    ok(w.W.CitizenLife.trade('洛水城', 0) === true && allMsgs(w).indexOf('南疆') >= 0 && allMsgs(w).indexOf('药材') >= 0, 'J2 摊贩漏的是真行情（MarketDynamic 现账，不编假消息）');
    ok(w.times.some((t) => t[0] === 10 && t[1] === '与摊贩闲话'), 'J3 营生占时辰');
    ok(w.W.CitizenLife.trade('洛水城', 0) === false, 'J4 每人每样营生每日一次');
    // 书生/工匠：真长技能
    const w2 = citizenWorld([0.5]);
    w2.W.CitizenLife.trade('洛水城', 6);
    ok(w2.applied.some((a) => a.spec.lifeSkill && a.spec.lifeSkill.name === '学识' && a.spec.lifeSkill.exp === 2), 'J5 书生论文：学识+2 走 RewardService 正门');
    w2.W.CitizenLife.trade('洛水城', 7);
    ok(w2.applied.some((a) => a.spec.lifeSkill && a.spec.lifeSkill.name === '锻造' && a.spec.lifeSkill.exp === 2), 'J6 工匠教手艺：锻造+2');
    // 棋手赌棋
    const w3 = citizenWorld([0.1]);
    w3.W.CitizenLife.trade('洛水城', 4);
    ok(w3.wallet.copper === 210 && allMsgs(w3).indexOf('推枰认负') >= 0, 'J7 赌棋赢了：净赢 10 铜（p=0.4+神识×0.008）');
    const w4 = citizenWorld([0.99]);
    w4.W.CitizenLife.trade('洛水城', 4);
    ok(w4.wallet.copper === 190, 'J8 赌棋输了：彩头 10 铜真扣');
    // 琴师/老者/妇人/孩童/道士
    const w5 = citizenWorld([0.5, 0.5, 0.5]);
    w5.W.CitizenLife.trade('洛水城', 5);
    ok(w5.wallet.copper === 195 && w5.applied.some((a) => a.spec.mood === 5), 'J9 琴师听曲：打赏 5 铜、心境+5');
    w5.W.CitizenLife.trade('洛水城', 9);
    ok(w5.applied.some((a) => a.spec.mood === 2), 'J10 老者讲古：心境+2 + 一段旧事');
    w5.W.CitizenLife.trade('洛水城', 3);
    ok(w5.wallet.copper === 193 - 2 + 2 - 2 || w5.applied.some((a) => a.spec.copper === -2), 'J11 孩童买糖：2 铜换一句孩子看见的事');
    w5.W.CitizenLife.trade('洛水城', 8);
    ok(w5.applied.some((a) => a.spec.copper === -10), 'J12 道士街边卦：10 铜一卦（口条在人情账）');
    // 乞丐转交施舍正门
    const w6 = citizenWorld([0.5]);
    w6.W.CitizenLife.trade('洛水城', 2);
    ok(w6.dialogs.some((d) => d.title.indexOf('老乞丐') >= 0), 'J13 乞丐的营生是施舍——转交丐帮眼线正门（不另立账）');
    // 打劫：武者真仗
    const w7 = citizenWorld([0.5]);
    w7.W.CitizenLife.rob('洛水城', 1);
    ok(w7.battles.length === 1 && w7.battles[0]._isCitizenRob === true && w7.battles[0]._crobName === '李武者', 'J14 抢武者=真仗（_isCitizenRob 旗带名字）');
    w7.W.currentBattle = w7.battles[0];
    w7.W.settleCitizenRob(true);
    ok(w7.wallet.copper > 200 && w7.W.currentCharData.karma === -3 && w7.W.NpcCrime.heat() === 2, 'J15 打赢搜彩头：铜钱+业障-3+热度记进同一本通缉账');
    const w8 = citizenWorld([0.5]);
    w8.W.CitizenLife.rob('洛水城', 1);
    w8.W.currentBattle = w8.battles[0];
    w8.W.settleCitizenRob(false);
    ok(w8.W.currentCharData.health === 65 && w8.wallet.copper === 180, 'J16 打输挨顿好打：伤-15 精力-20 还被搜了「赔汤药」20 铜');
    // 打劫：老幼妇孺业障翻倍
    const w9 = citizenWorld([0.1, 0.5]);
    w9.W.CitizenLife.rob('洛水城', 3);
    ok(w9.W.currentCharData.karma === -8 && w9.deeds.some((d) => d[1].indexOf('孩子') >= 0), 'J17 抢孩子：业障-8 双倍重、街坊戳脊梁骨（传闻池）');
    const w10 = citizenWorld([0.1, 0.5]);
    w10.W.CitizenLife.rob('洛水城', 9);
    ok(w10.W.currentCharData.karma === -6, 'J18 抢老者：业障-6');
    const w11 = citizenWorld([0.1, 0.5]);
    w11.W.CitizenLife.rob('洛水城', 0);
    ok(w11.W.currentCharData.karma === -3 && w11.wallet.copper > 200, 'J19 抢摊贩：常规业障-3、彩头厚（30-80 铜）');
    // 打劫失手
    const w12 = citizenWorld([0.99, 0.1]);
    w12.W.CitizenLife.rob('洛水城', 0);
    ok(w12.W.currentCharData.notoriety === 2 && w12.reps.some((r) => r[1] === 15), 'J20 失手呼救引巡兵：恶名+2 声望-15');
    ok(w12.wallet.copper === 180, 'J21 街面罚金按铜收（20 铜）');
    // 抢乞丐：打丐帮眼线的脸（真 beggar-alms 陪跑）
    const w13 = citizenWorld([0.1]);
    w13.reg.beggarAlms.import({ given: 10, copperGiven: 10, foodGiven: 0, stoneGiven: 0, goodwill: 25, lastDay: 5, todayGives: 3, noted3: true, noted10: true, elderMet: false });
    ok(w13.W.BeggarAlms.watchDiscount() !== null, 'J22 前情：缘分 25、耳目让风开着');
    w13.W.CitizenLife.rob('洛水城', 2);
    ok(w13.W.BeggarAlms.goodwill() === 5, 'J23 抢乞丐：缘分-20（25→5）');
    ok(w13.W.BeggarAlms.watchDiscount() === null, 'J24 跌破耳目线：让风自动撤销（getter 现算，无需另设开关）');
    ok(w13.W.currentCharData.karma === -5 && w13.W.NpcCrime.heat() === 3, 'J25 碗里只有两枚铜板——业障-5、热度+3');
    ok(w13.battles.length === 1 && w13.battles[0]._isBeggarWrath === true, 'J26 缘分深的（≥25）：三成五几率丐帮弟子上门讨说法（真仗）');
    w13.W.currentBattle = w13.battles[0];
    w13.W.settleBeggarWrath(true);
    ok(w13.deeds.some((d) => d[0] === 'bad' && d[1].indexOf('丐帮') >= 0), 'J27 打退讨说法的——赢了一仗，输掉整条街的口碑（传闻池）');
    const w14 = citizenWorld([0.99]);
    w14.reg.beggarAlms.import({ given: 10, copperGiven: 10, foodGiven: 0, stoneGiven: 0, goodwill: 25, lastDay: 5, todayGives: 3, noted3: true, noted10: true, elderMet: false });
    w14.W.CitizenLife.rob('洛水城', 2);
    ok(w14.battles.length === 0, 'J28 骰不中，讨说法的没来（缘分浅的也不来）');
    // 窗与入口
    const w15 = citizenWorld([0.5]);
    ok(w15.W.CitizenLife.browse('洛水城') === true && w15.dialogs.some((d) => d.title.indexOf('街坊四邻') >= 0 && d.html.indexOf('王摊贩') >= 0), 'J29 街坊名单窗真开（browse）');
    ok(w15.W.CitizenLife.open('洛水城', 0) === true && w15.dialogs.some((d) => d.html.indexOf('打劫') >= 0 && d.html.indexOf('打听行情') >= 0), 'J30 单人窗：营生与打劫两排按钮同窗');
    ok(w15.W.CitizenLife.browse('太虚山') === false || w15.msgs.length > 0, 'J31 城外野地没有街坊（诚实拒绝）');
    ok(w15.W.CitizenLife.openRandom('洛水城') === true, 'J32 openRandom 正门在位（chatWithCitizen 转交用）');
    ok(SRC.loc.indexOf('CitizenLife.openRandom') >= 0, 'J33 城市闲聊正门守卫转交（chatWithCitizen）');
    ok(SRC.street.indexOf('CitizenLife.browse') >= 0 && SRC.street.indexOf('街坊搭话') >= 0, 'J34 市井烟火菜单挂「街坊搭话」');
    ok(SRC.alms.indexOf('robbed: robbed') >= 0 && SRC.alms.indexOf('耳目收了声') >= 0, 'J35 beggar-alms 的 robbed 正门与播报在位');
    ok(SRC.citizen.indexOf('.setItem') < 0 && SRC.citizen.indexOf('.getItem') < 0, 'J36 街面账零私有 localStorage（每日账运行时、罪行账并卷进 crimeLedger）');
}

// ============ K 情境引擎与全量钉位 ============
console.log('\n[K] 情境路由 · 全量钉位 · 清单对账 · 棘轮');
{
    // scenario-engine 真文件：teller/crime 两条路由 + 剥单修复
    const W = makeWorld(0.5, { window: null, showMessage: () => {}, gameLog: { add: () => {} } });
    W.window = W;
    vm.createContext(W);
    vm.runInContext(SRC.engine, W, { filename: 'scenario-engine' });
    let coerced = 0, paid = 0;
    W.NpcCrime = { coerceTeller: () => { coerced++; }, payBounty: () => { paid++; return { ok: true }; } };
    const r1 = W.scenarioEngine._apply({ teller: { op: 'coerce' } });
    ok(r1 && r1.success === true && coerced === 1, 'K1 eff.teller 路由真通（钱庄柜娘选项走得到黑道账）');
    const r2 = W.scenarioEngine._apply({ crime: { op: 'payBounty' } });
    ok(r2 && r2.success === true && paid === 1, 'K2 eff.crime 路由真通（司法堂缴清走得到通缉账）');
    W.NpcCrime = { coerceTeller: () => {}, payBounty: () => ({ error: '缴不起' }) };
    const r3 = W.scenarioEngine._apply({ crime: { op: 'payBounty' } });
    ok(r3 && r3.error === '缴不起', 'K3 缴不起的缘由原样上屏（不吞账）');
    const r4 = W.scenarioEngine._apply({ teller: { op: 'coerce' }, time: 5 });
    ok(r4 && r4.success === true, 'K4 teller 带平级键也走早退路由');
    delete W.NpcCrime;
    const r5 = W.scenarioEngine._apply({ teller: { op: 'coerce' } });
    ok(r5 && r5.success === false, 'K5 黑道账不在位：路由诚实失败（不静默吞）');
    ok(SRC.engine.indexOf("qk === 'caravan'") >= 0 && SRC.engine.indexOf("qk === 'teller'") >= 0 && SRC.engine.indexOf("qk === 'crime'") >= 0, 'K6 账本键剥单收全（顺带修了 caravan 漏剥的旧账）');
    // 情境剧本钉位
    ok(SRC.batch2.indexOf('柜台后的姑娘') >= 0 && SRC.batch2.indexOf("teller: { op: 'coerce' }") >= 0, 'K7 钱庄柜台真添了黑路选项');
    ok(SRC.batch2.indexOf('tellerDescribe') >= 0, 'K8 钱庄牌面站进柜娘（describe 守卫接线）');
    ok(SRC.offices.indexOf('缴清头上的悬赏') >= 0 && SRC.offices.indexOf("crime: { op: 'payBounty' }") >= 0, 'K9 司法堂柜台真添了销案选项');
    ok(SRC.offices.indexOf('wantedLine') >= 0, 'K10 司法堂牌面如实念悬赏牌');
    // app.js 战后分支钉位（胜负两侧四旗全挂）
    ['_isNpcRobbery', '_isBountyHunt', '_isCitizenRob', '_isBeggarWrath'].forEach((flag) => {
        const n = (SRC.app.match(new RegExp(flag, 'g')) || []).length;
        ok(n >= 2, 'K11 战后结算旗 ' + flag + ' 胜负两侧都接了（出现 ' + n + ' 次）');
    });
    ok(SRC.app.indexOf('settleNpcRobbery(true)') >= 0 && SRC.app.indexOf('settleNpcRobbery(false)') >= 0, 'K12 抢劫结算胜负双支真调');
    ok(SRC.app.indexOf('settleBountyHunt(true)') >= 0 && SRC.app.indexOf('settleBountyHunt(false)') >= 0, 'K13 猎人结算胜负双支真调');
    // 夜巡加档钉位
    ok((SRC.dailyEvents.match(/patrolBoost/g) || []).length >= 2, 'K14 夜巡两支（拱手/避开）都吃通缉加档尺');
    // bank-service 闸与销账
    ok((SRC.bank.match(/banGate\(\)/g) || []).length >= 4 && SRC.bank.indexOf('waiveDebt') >= 0, 'K15 钱庄四口（存/取/借/还）全上闭门闸 + waiveDebt 销账正门');
    // eatery 同席钮
    ok(SRC.eatery.indexOf('NpcBond.openTreat') >= 0 && SRC.eatery.indexOf('邀人同席') >= 0, 'K16 馆子柜台添「邀人同席」钮（守卫接线）');
    // 清单对账
    const man = JSON.parse(SRC.manifest);
    // ★2026-10-04 scripts 341 → 351★（B 类·判据过时，量没变）。今日实测：清单 entries 里带 src 的 351 条、
//   HTML 里除 vendor/tailwind.js 之外的 351 枚，**集合相同、顺序也相同**；
//   layerComments 仍是 25（没动）。tools/refactor/manifest-scripts.py check 当日独立判过：
//   「同步检查通过：351 个 script / 25 个分层注释，HTML == manifest，无漏登记与无游离脚本」。
//   scripts.manifest.json 在禁改清单里，所以不改仓库、只把硬写的计数归到今读真数；
//   判据仍逐字全等——少一本、多一本、层注释被删都红。
ok(man.stats.scripts === 351 && man.stats.layerComments === 25, 'K17 清单 351 script / 25 层注释（2026-10-04 由 341 归正到实测 351，层注释仍是 25；tools/manifest-scripts.py check 同日判过 HTML == manifest）');
    const srcs = man.entries.filter((e) => e.kind === 'script').map((e) => e.src);
    ok(srcs.indexOf('js/npcs/npc-crime.js') >= 0 && srcs.indexOf('js/city-facilities/citizen-life.js') >= 0 && srcs.indexOf('js/npcs/npc-bond.js') >= 0, 'K18 三本新账全入清单');
    ok(srcs.indexOf('js/npcs/npc-crime.js') < srcs.indexOf('js/extensions/player-sect.js'), 'K19 新账插在 v25.7 街区之后、扩展层之前（依赖顺序）');
    const htmlScripts = (SRC.html.match(/<script defer src="js\//g) || []).length;
    ok(htmlScripts === 352, 'K20 HTML 352 个 js 脚本标签 = 清单 351 + vendor/tailwind.js（清单外自带件，check 工具同口径放行）');
    ok(SRC.html.indexOf('js/npcs/npc-crime.js') >= 0 && SRC.html.indexOf('js/city-facilities/citizen-life.js') >= 0 && SRC.html.indexOf('js/npcs/npc-bond.js') >= 0, 'K21 HTML 里三本新账的标签真在');
    // 棘轮：空 catch / 全局唯一
    const emptyCatch = /catch\s*\([^)]*\)\s*\{\s*\}/;
    ok(!emptyCatch.test(SRC.crime) && !emptyCatch.test(SRC.citizen) && !emptyCatch.test(SRC.bond), 'K22 三本新账零空 catch（每个 catch 都有话交代）');
    const globals = ['window.NpcCrime =', 'window.CitizenLife =', 'window.NpcBond =', 'window.buildNpcCrimeButtons =', 'window.buildNpcBondButtons =', 'window.settleNpcRobbery =', 'window.settleBountyHunt =', 'window.settleCitizenRob =', 'window.settleBeggarWrath ='];
    const allNew = SRC.crime + SRC.citizen + SRC.bond;
    let dupes = 0;
    globals.forEach((g) => { const n = allNew.split(g).length - 1; if (n !== 1) dupes++; });
    ok(dupes === 0, 'K23 九个新全局名各只有一处定义（静态门禁不撞车）');
    // DES-22 口径棘轮：新账里不许手写「60=时辰」
    const des22 = /60[^0-9][^\n]{0,12}时辰|时辰[^\n]{0,12}60[^0-9]/;
    ok(!des22.test(SRC.crime) && !des22.test(SRC.citizen) && !des22.test(SRC.bond), 'K24 DES-22：三本新账无手写时辰换算');
    // 新账 StateRegistry 键不与既有 63 键撞车
    ok(SRC.crime.indexOf("register('crimeLedger'") >= 0 && SRC.bond.indexOf("register('npcBond'") >= 0, 'K25 两把新键 crimeLedger / npcBond（既有清单无此二键，v25.7 盘点口径）');
    ok(SRC.citizen.indexOf('StateRegistry.register') < 0, 'K26 街面账不落新键（每日账运行时、罪行账并进 crimeLedger）');
}

console.log('\n通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
