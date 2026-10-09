/**
 * v26.1 五路进城批（第一百五十二批）——用户点单五件，一次立项。
 *
 * 五件：
 *   A 城门账（city-gate.js + location-system.js 改装）：enterCity 落位置之前的一道守卫钩子——
 *     入城钱 2 铜（穷则白眼放行，不硬卡）；通缉两档在城门兑现（用户铁律）：特质档 5% 底子难认、
 *     画像档 35% 起步一眼就中；恶名放大 ×(1+noto/120)；易容特质档 ×0.1 近乎白走、画像档 ×0.45 只减半不到；
 *     被认出→挡在城外（进不去；主步行路径在 enterCity 返回后才结脚程账，挡下不白扣——DES-10 同口径）：买通（30 灵石，率=clamp(0.9−赏金/300)，钱收了没办成不退）、
 *     翻墙（失手火把照脸 faceSeen:true 进画影册+摔伤一成半气血）、掉头；过关条当日当城只此一张；
 *   B 卦摊账（fortune-stall.js）：街口看相，准头=30%+学识/300+境界×5% 封顶 88% 全明账；
 *     每日三卦、一卦二十分钟；熟人三成半坐上摊（算准 changeAffection+3 结善缘）；砸卦掀摊当日收摊；
 *     6% 卜出机缘线索——线索只指游戏里真有的去处；
 *   C 说书账（tea-storyteller.js）：茶馆登台说自己的书（传记账 compile 守卫读取，缺账说通稿）；
 *     真本薄利（打赏 15+名望/8、声望+1、传闻池灌真事）；假本打赏×1.8 名望+2，
 *     拆台率=12%+恶名/250+（名望≥60 再 10%）明账——被拆台声望−3 心境−3 名望−1、本城茶馆拉黑 7 日；
 *   D 斗蛐蛐账（cricket-fight.js）：出城捉虫两个时辰，五档品相概率和恰为 1（账面可复算）；
 *     罐五只、喂养每只至多五口（钱堆不出无限斗性）；三档注 10/50/200、赢 1.8 倍（巷口抽一成明账）、
 *     对手按注档生成；败后虫 35% 伤（斗性减半三日）、死险按注档 4/8/16%——虫是活物不是筹码；
 *     每日五场、连胜五场「蛐王」进传闻池；
 *   E 私塾账（private-school.js）：租屋开塾一城一次 120 铜、学识 30 门槛；每日一堂课两个时辰，
 *     束脩=12+学识/10 安稳钱；蒙童名册随声望入学、至多 30 人，10/25 人里程碑各一次明账进项；
 *     名册过 10 每日 10% 老学生回来看先生（带礼 20-60 铜、城里哪一行随他说）；
 *     每教满 5 日洗 1 点恶名——只洗恶名，不动官府案底的热度（明账，不是洗白后门）。
 *
 * 钉法：五本新账 + 黑道账 + 易容账整文件沙箱真跑 + 全量源码钉位 + manifest/HTML 对账。
 * 清单口径：341 script / 25 层注释（v26.0 六路营生批后 336，本批再添五本）。
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

console.log('\n========== v26.1 五路进城批 ==========');

const REALM_TIER = { '凡人': 0, '炼气': 1, '筑基': 2, '金丹': 3, '元婴': 4, '化神': 5 };

const NEW_FILES = [
    'js/city-facilities/city-gate.js',
    'js/city-facilities/fortune-stall.js',
    'js/city-facilities/tea-storyteller.js',
    'js/city-facilities/cricket-fight.js',
    'js/city-facilities/private-school.js'
];
const LOAD_ORDER = ['js/npcs/npc-crime.js', 'js/npcs/disguise-system.js'].concat(NEW_FILES);

function makeWorld(rand) {
    const W = {
        console: { log: () => {}, warn: () => {}, error: () => {} },
        setTimeout: (fn) => { fn(); return 0; },
        Math: Object.create(Math)
    };
    W.Math.random = Array.isArray(rand)
        ? (() => { let i = 0; return () => (i < rand.length ? rand[i++] : rand[rand.length - 1]); })()
        : (typeof rand === 'function' ? rand : () => rand);
    W.window = W;
    vm.createContext(W);
    return W;
}

function mockNpc(W, id, o) {
    o = o || {};
    const rel = Object.assign({ affection: 0, hatred: 0, respect: 0, love: 0, fear: 0, trust: 0, flags: new Set() }, o.relationship || {});
    const npc = {
        id, name: o.name || ('测试人·' + id), gender: o.gender || 'male', age: o.age || 40,
        occupation: o.occupation || '', location: o.location || '洛水城', isDead: !!o.isDead, isFollowing: false,
        relationship: rel,
        combat: Object.assign({ level: 20, realm: '炼气', attack: 30, defense: 15, speed: 20 }, o.combat || {}),
        _actions: [],
        changeAffection(n) { rel.affection = Math.max(-100, Math.min(100, rel.affection + n)); },
        changeFear(n) { rel.fear = Math.max(0, Math.min(100, rel.fear + n)); },
        changeHatred(n) { rel.hatred = Math.max(0, Math.min(100, rel.hatred + n)); },
        changeRespect(n) { rel.respect = Math.max(0, Math.min(100, rel.respect + n)); },
        recordPlayerAction(a, tone) { npc._actions.push({ a, tone }); },
        hasFlag(f) { return rel.flags.has(f); }
    };
    W.__npcs[id] = npc;
    return npc;
}

function buildEnv(rand, opts) {
    opts = opts || {};
    const W = makeWorld(rand);
    W.document = { querySelector: () => null };
    W.__day = opts.day || 100;
    W.WorldCalendar = { day: W.__day };
    W.__wallet = { stones: opts.stones != null ? opts.stones : 500 };
    W.__time = 0; W.__timeLog = [];
    W.__newDayCbs = [];
    W.__msgs = []; W.__logs = []; W.__deeds = []; W.__rewards = []; W.__growLog = [];
    W.__registry = {}; W.__entered = [];
    W.__npcs = {}; W.__nearby = [];
    W.__skills = Object.assign({ 口才: 10, 学识: 0, 烹饪: 0 }, opts.skills || {});
    W.__rewardFail = false;
    W.__aliasN = 0;
    W.dialog = null;

    W.timeSystem = {
        advanceTime(min, why) { W.__time += min; W.__timeLog.push({ min, why }); },
        getAbsoluteDay() { return W.__day; },
        onNewDaySubscribe(cb) { W.__newDayCbs.push(cb); }
    };
    W.RewardService = {
        apply(spec, ctx) {
            W.__rewards.push({ spec: JSON.parse(JSON.stringify(spec || {})), ctx });
            if (W.__rewardFail) return { success: false, reason: 'test_fail', messages: [] };
            return { success: true, messages: ['ok'] };
        }
    };
    W.DataManager = {
        getSpiritStones() { return W.__wallet.stones; },
        addSpiritStones(n) { W.__wallet.stones += n; },
        deductSpiritStones(n) { if (W.__wallet.stones >= n) { W.__wallet.stones -= n; return true; } return false; }
    };
    W.showMessage = (m, t) => { W.__msgs.push({ m, t }); };
    W.gameLog = { add: (m, t) => { W.__logs.push({ m, t }); } };
    W.showBuildingEffectDialog = (title, html) => { W.dialog = { title, html }; };
    W.updateCharacterStatus = () => {};
    W.updateCurrencyUI = () => {};
    W.getLifeSkill = (n) => W.__skills[n] || 0;
    W.growLifeSkill = (n, k, o) => { W.__skills[n] = (W.__skills[n] || 0) + (Number(k) || 0); W.__growLog.push({ n, k: Number(k) || 0 }); };
    W.getRealmTier = (r) => REALM_TIER[r] || 0;
    W.bountyRealmMul = () => 1;
    W.playerPushDeed = (m, s) => { W.__deeds.push({ m, s }); };
    W.__cities = {
        '洛水城': { buildings: ['shop', 'market', 'bank', 'eatery'] },
        '青云镇': { buildings: ['shop'] },
        '荒村': { buildings: [] }
    };
    W.locationSystem = {
        getCityData: (ct) => W.__cities[ct] || null,
        enterCity: (ct) => { W.__entered.push(ct); return true; }
    };
    W.npcManager = { getNPC: (id) => W.__npcs[id] || null, getNearbyNPCs: () => W.__nearby };
    W.currentCharData = {
        name: '测试侠', location: opts.loc || '洛水城', realm: opts.realm || '筑基',
        spiritStones: 0, karma: 0, notoriety: 0, fame: opts.fame || 0,
        qi: 100, energy: 100, health: 100, maxHealth: 100, maxQi: 100
    };
    W.Biography = { compile: () => ({ chapters: [{ title: '卷一' }, { title: '卷二' }], verdict: '路还长，书还没写到一半。', unlocked: [] }) };
    W.nameGenerator = { generateName: () => { W.__aliasN += 1; return { full: '过路客' + W.__aliasN }; } };
    W.StateRegistry = { register: (k, o) => { W.__registry[k] = o; } };
    W.itemById = {}; W.allItems = [];

    LOAD_ORDER.forEach((f) => vm.runInContext(load(f), W));
    W.advanceDay = (n) => { W.__day += (n || 1); W.WorldCalendar.day = W.__day; };
    W.fireNewDay = () => { W.__newDayCbs.forEach((cb) => cb()); };
    W.lastMsg = () => (W.__msgs.length ? W.__msgs[W.__msgs.length - 1].m : '');
    W.lastLog = () => (W.__logs.length ? W.__logs[W.__logs.length - 1].m : '');
    W.hasReward = (key, val) => W.__rewards.some((r) => r.spec[key] === val);
    return W;
}

function crimeImport(W, d) { W.__registry.crimeLedger.import(d); }
function crimeState(W) { return W.__registry.crimeLedger.export(); }
function maskOn(W, grade) { W.__registry.disguise.import({ on: true, alias: '假面客', grade: grade || 2, untilDay: W.__day + 5, appliedDay: W.__day, rerolls: 0, lastBuyDay: -1, ruined: 0 }); }

// ============ A. 城门账（两档铁律在城门兑现） ============
{
    const W = buildEnv(0.99);
    ok(typeof W.CityGate.gateCheck === 'function' && typeof W.CityGate.spotP === 'function' && typeof W.CityGate.bribeP === 'function', 'A1 gateCheck/spotP/bribeP 三把读数出口在位');
    ok(W.CityGate.gateCheck('洛水城') === true, 'A2 没案底 → 城门直接放行');
    ok(W.__rewards.some((r) => r.spec.copper === -2), 'A3 放行也真收了 2 铜入城钱（RewardService 负账正门）');
    ok(W.CityGate.state().taxPaid === 1, 'A4 入城钱计数落账');
    // 特质档：5% 底子
    crimeImport(W, { heat: 35, bounty: 50, face: 0 });
    ok(W.NpcCrime.wantedTier() === 'trait', 'A5 干净罪行到线 → 特质档');
    ok(Math.abs(W.CityGate.spotP('trait', false) - 0.05) < 1e-9, 'A6 特质档素脸认出率 = 5% 底子（明账常数）');
    ok(W.CityGate.gateCheck('洛水城', () => 0.06) === true, 'A7 特质档 0.06 的骰认不出——守卒只有体态口音，极难');
    ok(W.CityGate.gateCheck('洛水城', () => 0.04) === false, 'A8 特质档 0.04 的骰被认出 → 挡在城门外');
    ok(W.dialog && W.dialog.title.indexOf('被拒入城') >= 0, 'A9 拒入对话框真弹（买通/翻墙/掉头三条路）');
    ok(W.dialog.html.indexOf('塞钱买通') >= 0 && W.dialog.html.indexOf('翻墙') >= 0 && W.dialog.html.indexOf('掉头') >= 0, 'A10 三条路都在牌面上，买通率与失手率写成百分数');
    ok(crimeState(W).heat === 37, 'A11 被认出热度+2（35→37）');
    ok(crimeState(W).face === 0, 'A12 特质档被体态认出——脸没露过，不记 faceSeen（v26.0 铁律：只在脸真被看到处落账）');
    W.CityGate.leave();
    ok(W.CityGate.refusedCity() === '' && W.CityGate.bribe(() => 0.1) === false, 'A13 掉头走人后城门口没人了——买通按钮摸不着门');
    // 画像档：35% 起步
    const W2 = buildEnv(0.99);
    crimeImport(W2, { heat: 35, bounty: 50, face: 1 });
    ok(Math.abs(W2.CityGate.spotP('portrait', false) - 0.35) < 1e-9, 'A14 画像档素脸认出率 = 35% 起步——脸被看到过就很麻烦');
    ok(W2.CityGate.gateCheck('洛水城', () => 0.34) === false, 'A15 画像档 0.34 的骰就中——画影图形贴在城门洞');
    ok(crimeState(W2).face === 1, 'A16 画像档拒入照旧记 faceSeen（脸早在册上）');
    // 易容折扣：画像 ×0.45、特质 ×0.1
    const W3 = buildEnv(0.99);
    crimeImport(W3, { heat: 35, bounty: 50, face: 1 });
    maskOn(W3, 2);
    ok(Math.abs(W3.CityGate.spotP('portrait', true) - 0.35 * 0.45) < 1e-9, 'A17 画像档戴面具认出率 ×0.45——减半不到，面具不是隐身符');
    ok(W3.CityGate.gateCheck('洛水城', () => 0.16) === true, 'A18 画像档戴面具 0.16 的骰混得进（p=0.1575）');
    crimeImport(W3, { heat: 35, bounty: 50, face: 0 });
    ok(Math.abs(W3.CityGate.spotP('trait', true) - 0.05 * 0.1) < 1e-9, 'A19 特质档戴面具 ×0.1 = 0.5%——近乎白走');
    // 恶名放大
    const W4 = buildEnv(0.99);
    crimeImport(W4, { heat: 35, bounty: 50, face: 0 });
    W4.currentCharData.notoriety = 60;
    ok(Math.abs(W4.CityGate.spotP('trait', false) - 0.05 * 1.5) < 1e-9, 'A20 恶名 60 → 认出率 ×1.5（1+60/120，Disguise 同款放大）');
    ok(W4.CityGate.spotP('none', false) === 0, 'A21 没案底认出率恒为 0');
    // 买通
    const W5 = buildEnv(0.99, { stones: 500 });
    crimeImport(W5, { heat: 35, bounty: 60, face: 1 });
    W5.CityGate.gateCheck('洛水城', () => 0.1);
    ok(W5.CityGate.refusedCity() === '洛水城', 'A22 被挡下：城名记在运行时（对话框三路要用）');
    const bty = W5.NpcCrime.bounty();
    ok(bty >= 60 && Math.abs(W5.CityGate.bribeP() - Math.max(0.35, Math.min(0.95, 0.9 - bty / 300))) < 1e-9, 'A23 买通率 = clamp(0.9 − 赏金/300)（赏金越高越难买——城门认出那笔热度也给赏金加了码，按真账现算）');
    ok(W5.CityGate.bribe(() => 0.5) === true, 'A24 0.5 的骰买通了');
    ok(W5.__rewards.some((r) => r.spec.spiritStones === -30), 'A25 买通的 30 灵石真记了负账（RewardService 正门）');
    ok(W5.__entered.indexOf('洛水城') >= 0, 'A26 买通成了真重新递到城门口（enterCity 再走一遍）');
    ok(W5.CityGate.gateCheck('洛水城', () => 0.0) === true, 'A27 过关条兑现：当日当城重新进城不再拦');
    ok(W5.CityGate.gateCheck('洛水城', () => 0.0) === false, 'A28 过关条只此一张——用掉即销，守卒换了班照查');
    W5.CityGate.leave();
    // 买通失败
    const W6 = buildEnv(0.99, { stones: 500 });
    crimeImport(W6, { heat: 35, bounty: 60, face: 1 });
    W6.CityGate.gateCheck('洛水城', () => 0.1);
    const heatBefore = crimeState(W6).heat;
    ok(W6.CityGate.bribe(() => 0.99) === false, 'A29 0.99 的骰买不通');
    ok(W6.__rewards.filter((r) => r.spec.spiritStones === -30).length === 1, 'A30 买不通钱也不退——30 灵石的负账已经落了（钱喂了狗是明账）');
    ok(crimeState(W6).heat === heatBefore + 1 && W6.CityGate.refusedCity() === '洛水城', 'A31 买不通热度+1、人还堵在城门口（对话框重开）');
    W6.CityGate.leave();
    // 买通付不起
    W6.__rewardFail = true;
    W6.CityGate.gateCheck('洛水城', () => 0.1);
    ok(W6.CityGate.bribe(() => 0.1) === false && W6.lastMsg().indexOf('摸不出') >= 0, 'A32 灵石付不出去 → 如实说摸不出，不空转');
    W6.__rewardFail = false; W6.CityGate.leave();
    // 翻墙
    const W7 = buildEnv(0.99);
    crimeImport(W7, { heat: 35, bounty: 50, face: 0 });
    W7.CityGate.gateCheck('洛水城', () => 0.34);   // 特质档 5% 认不出——改用直接 refuse 摆场景
    W7.CityGate.refuse('洛水城', 'trait');
    ok(W7.CityGate.wall(() => 0.5) === true, 'A33 0.5 的骰翻墙成了（失手率 30%）');
    ok(crimeState(W7).face === 0, 'A34 翻成了没人看清脸——不记 faceSeen（铁律：只在脸真被看到处落账）');
    ok(W7.__timeLog.some((t) => t.min === 60), 'A35 翻墙真耗一个时辰');
    ok(W7.__entered.indexOf('洛水城') >= 0, 'A36 翻成进了城（enterCity 重走 + 过关条）');
    // 翻墙失手
    const W8 = buildEnv(0.99);
    crimeImport(W8, { heat: 35, bounty: 50, face: 0 });
    W8.CityGate.refuse('洛水城', 'trait');
    ok(W8.CityGate.wall(() => 0.1) === false, 'A37 0.1 的骰翻墙失手');
    ok(W8.currentCharData.health === 85, 'A38 失手摔伤：气血 100→85（上限一成半，最低留 1）');
    ok(crimeState(W8).face === 1, 'A39 火把照了个正脸——脸进画影册（faceSeen:true，特质档也转画像档）');
    ok(crimeState(W8).heat === 35 + 2 + 2, 'A40 拒入+2 再失手+2 = 39（两笔都落官府账）');
    ok(W8.__deeds.some((d) => d.m === 'bad'), 'A41 翻墙失手进传闻池（bad 风声）');
    // 入城钱付不起：白眼放行不硬卡
    const W9 = buildEnv(0.99);
    W9.__rewardFail = true;
    ok(W9.CityGate.gateCheck('洛水城') === true && W9.lastLog().indexOf('白了你一眼') >= 0, 'A42 穷得付不起入城钱——门卒白眼放行，日志如实记账不装看不见');
    // 过关条不落档
    const W10 = buildEnv(0.99);
    crimeImport(W10, { heat: 35, bounty: 50, face: 1 });
    W10.CityGate.gateCheck('洛水城', () => 0.1);
    W10.CityGate.wall(() => 0.9);
    const dumped = JSON.stringify(W10.__registry.cityGate.export());
    ok(dumped.indexOf('city') < 0 || W10.__registry.cityGate.export().walled === 1, 'A43 存档里只有计数账，没有「今日免检」这种运行时票（读档不能带免检金牌）');
    ok(W10.__registry.cityGate.export().refused >= 1, 'A44 拒入计数落档');
    // 读档消毒
    W10.__registry.cityGate.import({ refused: -5, bribed: 'x', taxPaid: 1e12, walled: 2.7 });
    const st10 = W10.__registry.cityGate.export();
    ok(st10.refused === 0 && st10.bribed === 0 && st10.walled === 2, 'A45 读档消毒：负数归零、非数归零、小数取整');
    ok(st10.taxPaid > 0 && st10.taxPaid <= 1e12, 'A46 大额计数如实收下（不做假上限）');
    W10.__registry.cityGate.import(null);
    ok(W10.__registry.cityGate.export().refused === 0, 'A47 空档读入 → 全新账');
}

// ============ B. 街口卦摊 ============
{
    const W = buildEnv(0.99, { skills: { 学识: 100 } });
    ok(typeof W.FortuneStall.read === 'function' && W.FortuneStall.stallOk('洛水城') === true && W.FortuneStall.stallOk('荒村') === false, 'B1 卦摊出口在位：市集城支得起、荒村支不起');
    ok(Math.abs(W.FortuneStall.hitP() - Math.min(0.88, 0.30 + 100 / 300 + 2 * 0.05)) < 1e-9, 'B2 准头明账：30% + 学识/300 + 筑基 2 档×5% = 73.3%');
    const t0 = W.__time;
    ok(W.FortuneStall.read === W.FortuneStall.read, 'B3 出口稳定');
    W.currentCharData.location = '荒村';
    ok(W.FortuneStall.read() === false && W.__time === t0, 'B4 荒村开不了卦——时辰一分不扣（先查地界再扣账）');
    W.currentCharData.location = '洛水城';
    // 算准过路客：__nearby 空 → 不掷熟人骰；队列 [命中骰, 线索骰]
    ok(W.FortuneStall.read(() => 0.9) === true, 'B5 0.9 ≥ 准头 0.733 → 算岔了，客人掀摊（砸卦也是开过卦，返回 true）');
    ok(W.__rewards.some((r) => r.spec.mood === -2 && r.spec.copper === -5), 'B6 砸卦真赔账：心境−2、摊钱 5 铜（RewardService 负账正门）');
    ok(W.FortuneStall.read(() => 0.1) === false && W.lastMsg().indexOf('明日再支') >= 0, 'B7 当日摊被掀过就收摊——砸过卦不再开（摊主也怕）');
    W.advanceDay(1);
    const before = W.__rewards.length;
    ok(W.FortuneStall.read(() => 0.5) === true, 'B8 隔日重开摊：0.5 < 0.733 算准了');
    ok(W.__rewards.slice(before).some((r) => r.spec.copper === 8 + Math.floor(100 / 40)), 'B9 打赏明账：8 底 + 学识/40 = 10 铜真落袋');
    ok(W.__growLog.some((g) => g.n === '学识'), 'B10 每卦都长学识（摊上阅人）');
    ok(W.FortuneStall.state().reads === 1 && W.FortuneStall.state().earned === 10, 'B11 日计数与累计打赏落账');
    // 每日三卦封顶
    W.FortuneStall.read(() => 0.5); W.FortuneStall.read(() => 0.5);
    ok(W.FortuneStall.read(() => 0.5) === false && W.lastMsg().indexOf('三卦已满') >= 0, 'B12 第四卦被拦：卦不敢多算，泄天机');
    W.advanceDay(1);
    // 熟人坐上卦摊：队列 [熟人骰 0.1<0.35, 选人中 0.1→0 号, 命中骰 0.1]
    const npc = mockNpc(W, 'n1', { name: '王员外' });
    W.__nearby = [npc];
    ok(W.FortuneStall.read((() => { const q = [0.1, 0.1, 0.1]; let i = 0; return () => q[Math.min(i++, 2)]; })()) === true, 'B13 熟人卦开成');
    ok(npc.relationship.affection === 3, 'B14 算准熟人隐疾 → 好感+3 真落账（changeAffection 正门，结善缘）');
    ok(npc._actions.some((a) => a.a === 'fortune_read' && a.tone === 'positive'), 'B15 这一卦记进了 TA 的记忆（recordPlayerAction）');
    ok(W.FortuneStall.state().npcsRead === 1, 'B16 熟人卦计数落账');
    // 机缘线索：队列 [熟人骰 0.9 不中, 命中骰 0.1, 线索骰 0.05<0.06, 线索选中]
    W.advanceDay(1);
    W.__nearby = [];
    ok(W.FortuneStall.read((() => { const q = [0.1, 0.05, 0.5]; let i = 0; return () => q[Math.min(i++, 2)]; })()) === true, 'B17 带线索的一卦开成（无熟人 → 队列即 [命中骰, 线索骰, 线索选中]）');
    ok(W.FortuneStall.state().clues === 1 && W.__deeds.length >= 1, 'B18 线索落账 + 风声进传闻池');
    ok(W.FortuneStall.CLUES.every((s) => s.indexOf('（') >= 0 && s.indexOf('线）') >= 0), 'B19 每条线索都注明指向哪条真账（赌石/书肆/城外/街坊/贵人）——不画空头饼');
    // 砸卦不掷线索
    W.advanceDay(1);
    const cluesBefore = W.FortuneStall.state().clues;
    W.FortuneStall.read(() => 0.95);
    ok(W.FortuneStall.state().clues === cluesBefore, 'B20 砸了的卦卜不出线索（线索只随算准来）');
    // 准头封顶
    const W2 = buildEnv(0.99, { skills: { 学识: 300 }, realm: '化神' });
    ok(W2.FortuneStall.hitP() === 0.88, 'B21 学识 300+化神也封顶 88%——神仙也不敢说满');
    // 过路客没名：nameGenerator 缺位守卫
    const W3 = buildEnv(0.99, { skills: { 学识: 50 } });
    W3.nameGenerator = null;
    W3.advanceDay(1);
    ok(W3.FortuneStall.read(() => 0.5) === true && W3.lastLog().indexOf('行客') >= 0, 'B22 取名账缺位 → 按「过路的行客」说，不崩');
    // 读档消毒
    W3.__registry.fortuneStall.import({ day: 'x', reads: -3, flipped: 1, clues: 2.9, earned: -100, npcsRead: 4 });
    const s3 = W3.__registry.fortuneStall.export();
    ok(s3.reads === 0 && s3.clues === 2 && s3.earned === 0 && s3.flipped === true, 'B23 读档消毒：负数归零、小数取整、flag 转真');
}

// ============ C. 茶馆说自己的书 ============
{
    const W = buildEnv(0.99);
    ok(typeof W.TeaTale.perform === 'function' && typeof W.TeaTale.bustP === 'function', 'C1 登台/拆台率出口在位');
    ok(Math.abs(W.TeaTale.bustP() - 0.12) < 1e-9, 'C2 白身拆台率 = 12% 底子（明账）');
    ok(W.TeaTale.perform(false, () => 0.9) === true, 'C3 真本说成（0.9 ≥ 25% 名望骰——没加名望）');
    ok(W.__rewards.some((r) => r.spec.copper === 15 && r.spec.cityReputation === 1 && r.spec.mood === 2), 'C4 真本明账：打赏 15 铜（名望 0）、声望+1、心境+2 一笔落');
    ok(W.__deeds.some((d) => d.s.indexOf('真事') >= 0), 'C5 真本灌进传闻池的是自己的真事（判词随账走）');
    ok(W.__timeLog.some((t) => t.min === 90), 'C6 一场书九十分钟真扣');
    ok(W.TeaTale.perform(false, () => 0.5) === false && W.lastMsg().indexOf('嗓子冒烟') >= 0, 'C7 每日一场——第二场嗓子冒烟');
    W.advanceDay(1);
    ok(W.TeaTale.perform(false, () => 0.1) === true && W.__rewards.some((r) => r.spec.fame === 1), 'C8 0.1 < 25% → 真本说得精彩，名望+1');
    // 假本没被拆台
    const W2 = buildEnv(0.99, { fame: 16 });
    ok(Math.abs(W2.TeaTale.tipOf(true) - Math.round((15 + 2) * 1.8)) === 0, 'C9 假本打赏 = (15+名望16/8)×1.8 = 31（明账算式）');
    ok(W2.TeaTale.perform(true, () => 0.5) === true, 'C10 0.5 ≥ 0.12 假本蒙混过关');
    ok(W2.__rewards.some((r) => r.spec.copper === 31 && r.spec.fame === 2), 'C11 假本真进项：打赏 31 铜、名望+2');
    ok(W2.lastLog().indexOf('江湖迟早对账') >= 0, 'C12 日志明说吹出去的牛迟早对账（不装没事）');
    // 假本被拆台
    const W3 = buildEnv(0.99);
    W3.currentCharData.notoriety = 50;
    ok(Math.abs(W3.TeaTale.bustP() - (0.12 + 50 / 250)) < 1e-9, 'C13 恶名 50 → 拆台率 32%（恶名/250 放大）');
    ok(W3.TeaTale.perform(true, () => 0.1) === true, 'C14 0.1 < 0.32 被知情人当场拆台');
    ok(W3.__rewards.some((r) => r.spec.cityReputation === -3 && r.spec.mood === -3 && r.spec.fame === -1), 'C15 拆台真赔账：声望−3、心境−3、名望−1');
    ok(W3.TeaTale.banDaysLeft('洛水城') === 7, 'C16 本城茶馆拉黑 7 日');
    ok(W3.TeaTale.perform(false, () => 0.9) === false && W3.lastMsg().indexOf('拉黑') >= 0, 'C17 拉黑期内真本也不让上台（跑堂的就拦）');
    W3.advanceDay(7);
    ok(W3.TeaTale.banDaysLeft('洛水城') === 0 && W3.TeaTale.perform(false, () => 0.9) === true, 'C18 七日满拉黑自解——照说');
    // 拉黑按城记
    const W4 = buildEnv(0.99);
    W4.__registry.teaTale.import({ banned: { '洛水城': W4.__day + 7 } });
    W4.currentCharData.location = '青云镇';
    ok(W4.TeaTale.banDaysLeft('青云镇') === 0 && W4.TeaTale.perform(true, () => 0.9) === true, 'C19 这城拆台换座城照说——拉黑按城记（江湖就是这么现实）');
    // 名望≥60 加项
    const W5 = buildEnv(0.99, { fame: 60 });
    ok(Math.abs(W5.TeaTale.bustP() - 0.22) < 1e-9, 'C20 名望 60 → 拆台率再+10%（名气越大台下越可能坐知情人）');
    // 传记账缺位/抛错 → 说通稿
    const W6 = buildEnv(0.99);
    W6.Biography = null;
    ok(W6.TeaTale.perform(false, () => 0.9) === true && W6.lastLog().indexOf('通稿') >= 0, 'C21 传记账不在位 → 说通稿，不崩');
    const W7 = buildEnv(0.99);
    W7.Biography = { compile: () => { throw new Error('测试炸账'); } };
    ok(W7.TeaTale.perform(false, () => 0.9) === true, 'C22 传记账抛错 → 守卫接住照说');
    // 不在城里
    const W8 = buildEnv(0.99, { loc: '洛水城' });
    W8.currentCharData.location = '';
    ok(W8.TeaTale.perform(false, () => 0.9) === false, 'C23 荒郊野外没有台子');
    // 读档消毒
    const W9 = buildEnv(0.99);
    W9.__registry.teaTale.import({ day: 5, told: 9, trues: -2, lies: 'x', busted: 3.7, earned: 50, banned: { '洛水城': 108, 12: 'y' } });
    const s9 = W9.__registry.teaTale.export();
    ok(s9.told === 1 && s9.trues === 0 && s9.busted === 3 && s9.banned['洛水城'] === 108, 'C24 读档消毒：场数夹回 1、负数非数归零、拉黑账如实收');
}

// ============ D. 巷口斗蛐蛐 ============
{
    const W = buildEnv(0.99);
    ok(typeof W.Cricket.catchCricket === 'function' && W.Cricket.denOk('洛水城') && !W.Cricket.denOk('荒村'), 'D1 捉虫/斗局出口在位，巷口跟着市集走');
    // 品相概率和恰为 1（v26.0 D21 的教训：概率表必须复算）
    const sum = W.Cricket.GRADES.reduce((a, g) => a + g.p, 0);
    ok(Math.abs(sum - 1.0) < 1e-9, 'D2 五档品相概率和恰为 1（复算 = ' + sum + '）——账面可复算');
    ok(W.Cricket.GRADES[4].p === 0.01 && W.Cricket.GRADES[0].p === 0.45, 'D3 蛐王 1%、草壳 45%——明账常数钉死');
    // 捉虫：队列 [品相骰, 斗性骰, 名字骰]
    ok(W.Cricket.catchCricket((() => { const q = [0.995, 0.5, 0.5]; let i = 0; return () => q[Math.min(i++, 2)]; })()) === true, 'D4 0.995 → 捉到蛐王（最后一档）');
    const k0 = W.Cricket.state().jars[0];
    ok(k0.grade === 5 && k0.power >= 45 && k0.power <= 60, 'D5 蛐王斗性 45-60 区间内（' + k0.power + '）');
    ok(k0.name.indexOf('蛐王') >= 0, 'D6 虫名带品相（名字池×品相后缀）');
    ok(W.__timeLog.some((t) => t.min === 120), 'D7 出城捉虫两个时辰真扣');
    ok(W.__deeds.some((d) => d.s.indexOf('蛐王') >= 0), 'D8 捉到蛐王进传闻池');
    // 边界：0.45 → 铜将军（第一档 acc=0.45，0.45 不小于它）
    const W2 = buildEnv(0.99);
    W2.Cricket.catchCricket((() => { const q = [0.45, 0, 0]; let i = 0; return () => q[Math.min(i++, 2)]; })());
    ok(W2.Cricket.state().jars[0].grade === 2, 'D9 品相边界：0.45 恰好落进第二档铜将军（acc 累加口径）');
    // 罐满
    for (let i = 0; i < 4; i++) W2.Cricket.catchCricket(() => 0.1);
    ok(W2.Cricket.state().jars.length === 5 && W2.Cricket.catchCricket(() => 0.1) === false, 'D10 蛐蛐罐至多五只——满罐再捉被拦');
    // 喂养
    const W3 = buildEnv(0.99);
    W3.Cricket.catchCricket((() => { const q = [0.1, 0.5, 0.5]; let i = 0; return () => q[Math.min(i++, 2)]; })());
    const p0 = W3.Cricket.state().jars[0].power;
    ok(W3.Cricket.feed(0) === true && W3.Cricket.state().jars[0].power === p0 + 2, 'D11 喂一口 4 铜斗性+2（真落账）');
    ok(W3.__rewards.some((r) => r.spec.copper === -4), 'D12 虫食钱走 RewardService 负账正门');
    W3.Cricket.feed(0); W3.Cricket.feed(0); W3.Cricket.feed(0); W3.Cricket.feed(0);
    ok(W3.Cricket.feed(0) === false && W3.lastMsg().indexOf('养到头') >= 0, 'D13 每只至多五口——钱堆不出无限斗性');
    const W3b = buildEnv(0.99); W3b.__rewardFail = true;
    W3b.Cricket.catchCricket(() => 0.1);
    const fedBefore = W3b.Cricket.state().jars[0].fed;
    ok(W3b.Cricket.feed(0) === false && W3b.Cricket.state().jars[0].fed === fedBefore, 'D14 虫食钱付不出 → 喂不成，账不动');
    // 开斗：队列 [对手斗性, 对手名, 我方掷, 对方掷]（败局再+1 死伤骰）
    const W4 = buildEnv(0.99);
    W4.Cricket.catchCricket((() => { const q = [0.995, 0.99, 0]; let i = 0; return () => q[Math.min(i++, 2)]; })());   // 蛐王满斗性
    const kp = W4.Cricket.effPower(W4.Cricket.state().jars[0]);
    ok(W4.Cricket.fight(0, 0, (() => { const q = [0, 0, 0.999, 0]; let i = 0; return () => q[Math.min(i++, 3)]; })()) === true, 'D15 我方×1.25 对方×0.75 → 赢');
    ok(W4.__rewards.some((r) => r.spec.copper === -10) && W4.__rewards.some((r) => r.spec.copper === 18), 'D16 注 10 先扣、彩头 18（1.8 倍——巷口抽一成是明账）后落');
    ok(W4.Cricket.state().wins === 1 && W4.Cricket.state().streak === 1, 'D17 胜负连胜落账');
    // 每日五场
    for (let i = 0; i < 4; i++) W4.Cricket.fight(0, 0, () => 0.999);
    ok(W4.Cricket.fight(0, 0, () => 0.999) === false && W4.lastMsg().indexOf('五场已满') >= 0, 'D18 第六场被拦：虫乏了，再斗就伤本');
    // 连胜五场蛐王
    const W5 = buildEnv(0.99);
    W5.Cricket.catchCricket((() => { const q = [0.995, 0.99, 0]; let i = 0; return () => q[Math.min(i++, 2)]; })());
    for (let i = 0; i < 5; i++) W5.Cricket.fight(0, 0, (() => { const q = [0, 0, 0.999, 0]; let i = 0; return () => q[Math.min(i++, 3)]; })());
    ok(W5.Cricket.state().streak === 5 && W5.Cricket.state().kingCries === 1, 'D19 连胜五场「蛐王」名号真灌进传闻池');
    ok(W5.__deeds.some((d) => d.s.indexOf('蛐王') >= 0 && d.m === 'good'), 'D20 蛐王风声是 good 档');
    // 败局三尾：力竭 / 受伤 / 斗死
    const W6 = buildEnv(0.99);
    W6.Cricket.catchCricket(() => 0.1);
    W6.Cricket.fight(0, 0, (() => { const q = [0.99, 0, 0, 0.999, 0.5]; let i = 0; return () => q[Math.min(i++, 4)]; })());   // 我方×0.75 对方×1.25 → 败；尾骰 0.5 → 力竭
    ok(W6.Cricket.state().losses === 1 && W6.Cricket.state().jars.length === 1 && W6.Cricket.state().jars[0].hurtUntil === 0, 'D21 尾骰 0.5 ≥ 0.04+0.35 → 只是力竭：虫没伤没死');
    W6.advanceDay(1);
    W6.Cricket.fight(0, 0, (() => { const q = [0.99, 0, 0, 0.999, 0.1]; let i = 0; return () => q[Math.min(i++, 4)]; })());   // 尾骰 0.1 ∈ [0.04,0.39) → 受伤
    ok(W6.Cricket.state().jars[0].hurtUntil === W6.__day + 3, 'D22 尾骰 0.1 → 虫受伤：养 3 日');
    ok(W6.Cricket.effPower(W6.Cricket.state().jars[0]) === Math.max(1, Math.round(W6.Cricket.state().jars[0].power * 0.5)), 'D23 带伤斗性减半（effPower 明账）');
    ok(W6.Cricket.fight(0, 0, () => 0.5) === false && W6.lastMsg().indexOf('带着伤') >= 0, 'D24 带伤的虫不许上阵——巷口讲规矩');
    W6.advanceDay(3);
    ok(W6.Cricket.effPower(W6.Cricket.state().jars[0]) === W6.Cricket.state().jars[0].power, 'D25 三日养好，斗性回满');
    W6.advanceDay(1);
    W6.Cricket.fight(0, 0, (() => { const q = [0.99, 0, 0, 0.999, 0.02]; let i = 0; return () => q[Math.min(i++, 4)]; })());   // 尾骰 0.02 < 0.04 → 斗死
    ok(W6.Cricket.state().jars.length === 0 && W6.lastLog().indexOf('埋') >= 0, 'D26 尾骰 0.02 → 虫斗死在盆里（罐里没了，日志埋在草窠——虫是活物不是筹码）');
    // 注档死险与对手强度
    ok(W6.Cricket.CFG.DIE_MUL[2] === 0.16, 'D27 200 铜的注死险 16%——注越狠死险越高（明账）');
    const W7 = buildEnv(0.99);
    W7.Cricket.catchCricket(() => 0.1);
    W7.__rewardFail = true;
    ok(W7.Cricket.fight(2, 0, () => 0.5) === false && W7.lastMsg().indexOf('摸不出') >= 0, 'D28 注钱付不出 → 开不了斗，巷口不赊账');
    W7.__rewardFail = false;
    ok(W7.Cricket.fight(0, 9, () => 0.5) === false, 'D29 罐里没这只虫 → 先挑虫');
    // 放归
    W7.Cricket.catchCricket(() => 0.1);
    const n7 = W7.Cricket.state().jars.length;
    ok(W7.Cricket.release(0) === true && W7.Cricket.state().jars.length === n7 - 1, 'D30 放归草窠，罐位腾出');
    // 读档消毒
    const W8 = buildEnv(0.99);
    W8.__registry.cricket.import({
        jars: [{ name: 'a'.repeat(40), grade: 99, power: -5, fed: 77, hurtUntil: -2, caughtDay: 3, city: 'x'.repeat(40) }, null, { name: 123 }],
        streak: -3, best: 2, day: 9, fights: 99, wins: 4, losses: 5, kingCries: 1
    });
    const s8 = W8.__registry.cricket.export();
    ok(s8.jars.length === 1 && s8.jars[0].name.length === 24 && s8.jars[0].grade === 5 && s8.jars[0].power === 1 && s8.jars[0].fed === 5, 'D31 读档消毒：名字截 24、品相夹 1-5、斗性夹正、喂养夹五口');
    ok(s8.streak === 0 && s8.fights === 5 && s8.jars[0].city.length === 30, 'D32 负连胜归零、日场数夹回上限、城名截 30');
}

// ============ E. 启蒙私塾 ============
{
    const W = buildEnv(0.99, { skills: { 学识: 50 } });
    ok(typeof W.PrivateSchool.found === 'function' && W.PrivateSchool.schoolOk('洛水城') && !W.PrivateSchool.schoolOk('荒村'), 'E1 开塾出口在位，私塾跟着街巷走');
    W.__skills.学识 = 20;
    ok(W.PrivateSchool.found() === false && W.lastMsg().indexOf('误人子弟') >= 0, 'E2 学识不到 30 不收蒙童——误人子弟的事不干');
    W.__skills.学识 = 50;
    ok(W.PrivateSchool.found() === true, 'E3 学识 50 → 开塾成');
    ok(W.__rewards.some((r) => r.spec.copper === -120), 'E4 租屋钱 120 铜真划走（RewardService 负账正门）');
    ok(W.PrivateSchool.schoolOf('洛水城').students === 0, 'E5 名册从空白起');
    ok(W.PrivateSchool.found() === false && W.lastMsg().indexOf('一城一塾') >= 0, 'E6 一城一塾——第二间不开');
    // 授课
    const rw0 = W.__rewards.length;
    ok(W.PrivateSchool.teach(() => 0.9) === true, 'E7 第一堂课授成');
    ok(W.__rewards.slice(rw0).some((r) => r.spec.copper === 12 + 5), 'E8 束脩明账：12 + 学识 50/10 = 17 铜');
    ok(W.__timeLog.some((t) => t.min === 120), 'E9 一堂课两个时辰真扣');
    ok(W.__skills.学识 === 51, 'E10 教学相长：学识+1');
    ok(W.PrivateSchool.teach(() => 0.9) === false && W.lastMsg().indexOf('散学') >= 0, 'E11 每日至多一堂——蒙童散学了');
    ok(W.PrivateSchool.state().taughtDays === 1, 'E12 累计堂数落账');
    // 蒙童入学
    W.advanceDay(1);
    W.PrivateSchool.teach(() => 0.1);
    ok(W.PrivateSchool.schoolOf('洛水城').students === 1, 'E13 0.1 < 0.5+声望/200 → 新蒙童入学');
    W.advanceDay(1);
    W.PrivateSchool.teach(() => 0.99);
    ok(W.PrivateSchool.schoolOf('洛水城').students === 1, 'E14 0.99 没掷中——今天没新蒙童（概率是实话）');
    // 里程碑
    const W2 = buildEnv(0.99, { skills: { 学识: 40 } });
    W2.PrivateSchool.found();
    W2.__registry.privateSchool.import({ schools: { '洛水城': { foundedDay: 90, students: 9, teachDays: 0, m10: false, m25: false, lastTeachDay: -1 } } });
    W2.PrivateSchool.teach(() => 0.1);
    ok(W2.PrivateSchool.schoolOf('洛水城').students === 10 && W2.PrivateSchool.schoolOf('洛水城').m10 === true, 'E15 名册满 10 → 桃李初成真落旗');
    ok(W2.__rewards.some((r) => r.spec.cityReputation === 2), 'E16 桃李初成：声望+2 一次性进项');
    ok(W2.__deeds.some((d) => d.s.indexOf('开蒙诗') >= 0), 'E17 桃李初成进传闻池');
    W2.advanceDay(1);
    W2.__registry.privateSchool.import({ schools: { '洛水城': { foundedDay: 90, students: 24, teachDays: 1, m10: true, m25: false, lastTeachDay: -1 } } });
    W2.PrivateSchool.teach(() => 0.1);
    ok(W2.PrivateSchool.schoolOf('洛水城').m25 === true && W2.__rewards.some((r) => r.spec.fame === 2), 'E18 名册满 25 → 一城之师：名望+2');
    W2.advanceDay(1);
    W2.__registry.privateSchool.import({ schools: { '洛水城': { foundedDay: 90, students: 25, teachDays: 9, m10: true, m25: true, lastTeachDay: -1 } } });
    const repBefore = W2.__rewards.length;
    W2.PrivateSchool.teach(() => 0.99);
    ok(W2.__rewards.slice(repBefore).some((r) => r.spec.cityReputation === 1), 'E19 教满第 10 堂（teachDays 9→10）→ 声望+1（教化一方细水长流）');
    // 教化洗恶名：只洗恶名，不动热度
    const W3 = buildEnv(0.99, { skills: { 学识: 40 } });
    W3.currentCharData.notoriety = 5;
    crimeImport(W3, { heat: 35, bounty: 50, face: 1 });
    W3.PrivateSchool.found();
    W3.__registry.privateSchool.import({ schools: { '洛水城': { foundedDay: 90, students: 3, teachDays: 4, m10: false, m25: false, lastTeachDay: -1 } } });
    W3.PrivateSchool.teach(() => 0.99);
    ok(W3.currentCharData.notoriety === 4, 'E20 教满 5 堂 → 恶名洗去 1 点（5→4）');
    ok(crimeState(W3).heat === 35 && crimeState(W3).face === 1, 'E21 官府案底的热度与画影册分毫不动——读书人化的是街面名声，化不掉案底（不是洗白后门）');
    ok(W3.lastLog().indexOf('热度是另一本账') >= 0, 'E22 日志把「洗不动案底」当面说清');
    W3.advanceDay(1);
    W3.currentCharData.notoriety = 0;
    W3.__registry.privateSchool.import({ schools: { '洛水城': { foundedDay: 90, students: 3, teachDays: 9, m10: false, m25: false, lastTeachDay: -1 } }, taughtDays: 5, visits: 0, notoWashed: 1 });
    W3.PrivateSchool.teach(() => 0.99);
    ok(W3.currentCharData.notoriety === 0 && W3.PrivateSchool.state().notoWashed === 1, 'E23 恶名已是 0 → 不洗成负数，计数不虚涨');
    // 老学生回访（每日账）
    const W4 = buildEnv(0.99);
    W4.__registry.privateSchool.import({ schools: { '洛水城': { foundedDay: 90, students: 12, teachDays: 40, m10: true, m25: false, lastTeachDay: -1 } } });
    ok(W4.PrivateSchool.dailyCheck(() => 0.5) === false, 'E24 0.5 ≥ 10% → 今天没有老学生来');
    ok(W4.PrivateSchool.dailyCheck((() => { const q = [0.05, 0, 0, 0]; let i = 0; return () => q[Math.min(i++, 3)]; })()) === true, 'E25 0.05 < 10% → 老学生回来看先生');
    const gift = W4.__rewards.filter((r) => r.spec.copper > 0).map((r) => r.spec.copper);
    ok(gift.length === 1 && gift[0] >= 20 && gift[0] <= 60, 'E26 带的礼 20-60 铜真落袋（' + gift[0] + '）');
    ok(W4.lastLog().indexOf('先生') >= 0 && W4.PrivateSchool.state().visits === 1, 'E27 回访计数落账，话里认先生');
    const W5 = buildEnv(0.99);
    W5.__registry.privateSchool.import({ schools: { '洛水城': { foundedDay: 90, students: 5, teachDays: 10, m10: false, m25: false, lastTeachDay: -1 } } });
    ok(W5.PrivateSchool.dailyCheck(() => 0.0) === false, 'E28 名册没过 10 人 → 还没有出师的老学生（暗线要年头）');
    ok(W5.__newDayCbs.length >= 1, 'E29 回访账挂上了每日钟（onNewDaySubscribe 真订阅）');
    // 开塾付不起
    const W6 = buildEnv(0.99, { skills: { 学识: 40 } });
    W6.__rewardFail = true;
    ok(W6.PrivateSchool.found() === false && !W6.PrivateSchool.schoolOf('洛水城'), 'E30 租钱付不出 → 塾开不成，账不落');
    // 没塾授课 / 荒村
    const W7 = buildEnv(0.99, { skills: { 学识: 40 } });
    ok(W7.PrivateSchool.teach(() => 0.5) === false && W7.lastMsg().indexOf('还没有私塾') >= 0, 'E31 没开塾就授课 → 先租屋');
    W7.currentCharData.location = '荒村';
    ok(W7.PrivateSchool.found() === false && W7.PrivateSchool.open() === false, 'E32 荒村开不了塾也开不了牌面');
    // 读档消毒
    const W8 = buildEnv(0.99);
    W8.__registry.privateSchool.import({ schools: { '洛水城': { foundedDay: -9, students: 999, teachDays: 'x', m10: 1, m25: null, lastTeachDay: 5 } }, day: 2, taughtDays: -4, visits: 2.9, notoWashed: 1 });
    const s8 = W8.__registry.privateSchool.export().schools['洛水城'];
    ok(s8.students === 30 && s8.teachDays === 0 && s8.foundedDay === 0 && s8.m10 === true && s8.m25 === false, 'E33 读档消毒：名册夹 30、非数归零、负日归零、旗转真假');
    ok(W8.__registry.privateSchool.export().taughtDays === 0 && W8.__registry.privateSchool.export().visits === 2, 'E34 计数消毒：负归零、小数取整');
}

// ============ F. 静态钉位（接线 / 清单 / 纪律） ============
{
    const SRC = {};
    SRC.gate = load('js/city-facilities/city-gate.js');
    SRC.fortune = load('js/city-facilities/fortune-stall.js');
    SRC.tale = load('js/city-facilities/tea-storyteller.js');
    SRC.cricket = load('js/city-facilities/cricket-fight.js');
    SRC.school = load('js/city-facilities/private-school.js');
    SRC.loc = load('js/location-system.js');
    SRC.street = load('js/city-facilities/street-life.js');
    SRC.tea = load('js/city-facilities/teahouse-leisure.js');
    SRC.manifest = load('scripts.manifest.json');
    SRC.html = load('仙侠.html');

    // 进城钩子
    ok(SRC.loc.indexOf('window.CityGate.gateCheck') >= 0 && SRC.loc.indexOf('gateCheck(cityName) === false') >= 0, 'F1 enterCity 落位置之前真挂了城门闸（false = 人还在城外）');
    ok(SRC.loc.indexOf('宁松勿卡死进城路') >= 0, 'F2 城门闸抛错按放行——宁松勿卡死进城路（守卫口径写在 catch 里）');
    ok((SRC.gate.match(/faceSeen/g) || []).length === 5, 'F3 城门账 faceSeen 恰五处：头注释铁律 + 翻墙成功注释（没人看清脸不记）各一处 + 代码三处（画像档拒入 / 翻墙失手火把照脸 / 买通不成照旧册）——落账处全是「脸真被看到」的场面');
    ok(SRC.gate.indexOf('faceSeen: true') >= 0 && SRC.gate.indexOf('faceSeen: tier === \'portrait\'') >= 0, 'F4 特质档被体态认出不记脸、翻墙失手必记脸（v26.0 用户铁律在城门兑现）');
    // 菜单接线
    ok(SRC.street.indexOf('window.FortuneStall') >= 0 && SRC.street.indexOf('window.Cricket') >= 0 && SRC.street.indexOf('window.PrivateSchool') >= 0, 'F5 市井总门三路新挂载全在（各自账在位、城里有那扇门才亮）');
    ok(SRC.tea.indexOf('window.TeaTale.open()') >= 0, 'F6 茶馆菜单挂了「登台说自己的书」（守卫接线，与听说书并排）');
    // 清单对账
    const man = JSON.parse(SRC.manifest);
    // ★2026-10-04 scripts 341 → 351★（B 类·判据过时）。今日实测：清单 351 条 src / HTML 351 枚（tailwind 之外），
//   集合与顺序都相同；tools/refactor/manifest-scripts.py check 当日独立判过「HTML == manifest」。
//   scripts.manifest.json 在禁改清单里 ⇒ 只把硬写的计数归到今读真数，逐字全等照旧。
ok(man.stats.scripts === 351 && man.stats.layerComments === 25, 'F7 清单 351 script / 25 层注释（2026-10-04 由 341 归正到实测 351；层注释仍 25；tools/manifest-scripts.py check 同日判过 HTML == manifest）');
    const srcs = man.entries.filter((e) => e.kind === 'script').map((e) => e.src);
    ok(NEW_FILES.every((f) => srcs.indexOf(f) >= 0), 'F8 五本新账全入清单（不进清单=没测过，v25.5 的教训）');
    const ix = (s) => srcs.indexOf(s);
    ok(ix('js/city-facilities/player-shop.js') < ix('js/city-facilities/city-gate.js') && ix('js/city-facilities/city-gate.js') < ix('js/city-facilities/fortune-stall.js') && ix('js/city-facilities/fortune-stall.js') < ix('js/city-facilities/tea-storyteller.js') && ix('js/city-facilities/tea-storyteller.js') < ix('js/city-facilities/cricket-fight.js') && ix('js/city-facilities/cricket-fight.js') < ix('js/city-facilities/private-school.js'), 'F9 五本新账排在 v26.0 掌柜账之后、按批内顺序站好');
    ok(ix('js/npcs/npc-crime.js') < ix('js/city-facilities/city-gate.js') && ix('js/npcs/disguise-system.js') < ix('js/city-facilities/city-gate.js'), 'F10 城门账排在黑道账与易容账之后（守卫读取的依赖顺序）');
    ok(ix('js/location-system.js') < ix('js/city-facilities/city-gate.js'), 'F11 城门账排在进城账之后（钩子调用方向：进城账守卫读城门账）');
    const htmlScripts = (SRC.html.match(/<script defer src="js\//g) || []).length;
    ok(htmlScripts === 352, 'F12 HTML 352 个 js 脚本标签 = 清单 351 + vendor/tailwind.js（2026-10-04 由 342/341 归正到实测 352/351）');
    ok(NEW_FILES.every((f) => SRC.html.indexOf(f) >= 0), 'F13 HTML 里五本新账的标签真在');
    // 纪律棘轮
    const five = [SRC.gate, SRC.fortune, SRC.tale, SRC.cricket, SRC.school];
    const emptyCatch = /catch\s*\([^)]*\)\s*\{\s*\}/;
    ok(five.every((s) => !emptyCatch.test(s)), 'F14 五本新账零空 catch（每个 catch 都有话交代）');
    ok(five.every((s) => s.indexOf('localStorage') < 0), 'F15 五本新账零裸 localStorage（存档全走 StateRegistry 正门，v25.3 A1 口径）');
    const des22 = /60[^0-9][^\n]{0,12}时辰|时辰[^\n]{0,12}60[^0-9]/;
    ok(five.every((s) => !des22.test(s)), 'F16 DES-22：新账无手写时辰换算');
    ok(five.every((s) => s.indexOf("'use strict'") >= 0 && s.indexOf("typeof window === 'undefined'") >= 0), 'F17 五本新账全是 use strict + window 守卫的 IIFE');
    const globals = ['window.CityGate =', 'window.FortuneStall =', 'window.TeaTale =', 'window.Cricket =', 'window.PrivateSchool =',
        'window.openCityGateLedger =', 'window.openFortuneStall =', 'window.openTeaTaleStage =', 'window.openCricketDen =', 'window.openPrivateSchool ='];
    const allNew = five.join('\n');
    let dupes = 0;
    globals.forEach((g) => { const n = allNew.split(g).length - 1; if (n !== 1) dupes++; });
    ok(dupes === 0, 'F18 十个新全局名各只有一处定义（静态门禁不撞车）');
    const keys = [["register('cityGate'", SRC.gate], ["register('fortuneStall'", SRC.fortune], ["register('teaTale'", SRC.tale], ["register('cricket'", SRC.cricket], ["register('privateSchool'", SRC.school]];
    ok(keys.every(([k, s]) => s.indexOf(k) >= 0), 'F19 五把新 StateRegistry 键各自在位：cityGate/fortuneStall/teaTale/cricket/privateSchool');
    // 明账文化钉
    ok(SRC.gate.indexOf('穷得叮当响门卒白眼放行') >= 0 && SRC.gate.indexOf('挡下不白扣钱') >= 0, 'F20 城门账把「穷不硬卡、挡下不白扣脚程钱（DES-10 同口径）」两句实话写进头注释');
    ok(SRC.fortune.indexOf('不画空头饼') >= 0 && SRC.fortune.indexOf('赌石摊的彩头线') >= 0, 'F21 卦摊线索只指真去处（头注释+线索文案双钉）');
    ok(SRC.tale.indexOf('真本薄利，假本厚利带刺') >= 0, 'F22 说书账把真本假本的取舍写在牌面注释里');
    ok(SRC.cricket.indexOf('概率和恰为 1') >= 0 && SRC.cricket.indexOf('虫是活物，不是筹码') >= 0, 'F23 斗蛐蛐账：概率表可复算 + 死伤是活物账（两句都是明账文化钉）');
    ok(SRC.school.indexOf('不是洗白后门') >= 0 && SRC.school.indexOf('只洗恶名') >= 0, 'F24 私塾账写明教化只洗街面恶名、不动官府热度（防止被读成洗白后门）');
    ok(SRC.cricket.indexOf('WIN_MUL: 1.8') >= 0 && SRC.cricket.indexOf('巷口抽一成') >= 0, 'F25 彩头 1.8 倍的庄家抽水写在常数旁边');
    ok(SRC.tale.indexOf('BUST_REP: -3') >= 0 && SRC.tale.indexOf('BAN_DAYS: 7') >= 0, 'F26 拆台的赔率与拉黑天数是明账常数');
    // 旧账出口没被撞坏
    ok(SRC.loc.indexOf('function enterCity(cityName, opts)') >= 0 && SRC.loc.indexOf('visitedCities.add(cityName)') >= 0, 'F27 enterCity 老骨架没动，只添了可选 opts 第二参（钩子插在门槛与落位置之间）');
    ok(SRC.street.indexOf('window.PlayerShop') >= 0 && SRC.street.indexOf('window.Kidnap') >= 0, 'F28 v26.0 五路挂载照旧在位（新批不拆旧批）');
    // skipGate 免闸接线：传送/渡界/原地重开面板三种非徒步走法不过城门（防「白扣脚程钱」回归，DES-10 同源）
    const SRC2 = {};
    SRC2.app = load('js/app.js');
    SRC2.plane = load('js/map/high-planes.js');
    SRC2.travel = load('js/travel-system.js');
    ok(SRC2.app.indexOf('enterCity(cityName, { skipGate: true })') >= 0 && SRC2.app.indexOf('enterCity(currentCity, { skipGate: true })') >= 0, 'F29 app.js 传送阵抵达与「人在城里重开面板」两处都免闸（传送付了灵石只在抛异常退款，被城门挡回=白扣，必须免）');
    ok((SRC2.plane.match(/skipGate: true/g) || []).length === 3, 'F30 位面渡界三处（跨界/渡回/位面内跋涉）全免闸——不经人间城门');
    ok(SRC2.travel.indexOf("enterCity(toCity, { skipGate: travelState.method === 'teleport' })") >= 0, 'F31 travel-system 走路抵达过闸、传送抵达免闸（按 method 分流，一条 completeTravel 两用法）');
    ok(SRC.loc.indexOf('!(opts && opts.skipGate)') >= 0, 'F32 城门钩子只在 opts.skipGate 非真时触发——默认（徒步）过闸，显式免闸才跳过');
}

console.log('\n========== v26.1 结果：' + passed + ' 过 / ' + failed + ' 失败 ==========');
if (failed > 0) process.exit(1);
