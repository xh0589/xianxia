/**
 * v26.0 六路营生批（第一百五十一批）——用户点单六件，一次立项。
 *
 * 六件：
 *   A 通缉两档（npc-crime.js 改装）：face 字段分「特质档 / 画像档」——当场被拿/敲锣/扭送才画影；
 *     盘查加档 5/15 两级、猎人盯梢率 ×0.3、销案/风头冷透画像揭下；addBountyOnReport 追加悬赏正门；
 *   B 易容改名（disguise-system.js）：黑市后巷三档手艺（80/260/650+妖兽精血），戴脸不重易、每日一回、
 *     风头≥60 没人接活；假名走 nameGenerator 真名字池可重摇一次；画像档每日撞破掷骰（rng 可注入），
 *     撞破→面具作废+热度+恶名+传闻；守卫接线 patrolBoost（特质档归零/画像档减半）与猎人率；
 *   C 绑架勒索（kidnap-system.js）：只绑赎得起的（富商/筑基+/等级线），道侣挚交下不去手、导师长老碰不得；
 *     软路掷骰硬路真仗（_isKidnapFight）；押票挪 NPC 位置、三本账齐记；赎金信三档开口，
 *     到期四路反应（交赎/埋伏 _isKidnapAmbush/报官 faceSeen/石沉大海）；关押超三日官府循线风险；
 *     撕票真死（isDead）+业障-15+脸进册子；放人怕恨两落；
 *   D 赌石（stone-gamble.js）：三档原石出货表全明账（EV≈0.85~0.99×石价，摊主抽水写进牌面），
 *     探石只给信息不改赔率（境界+学识定看真率），每日 12 刀/净赢封顶 400 防刷，材料走 giveWithReceipt
 *     真入袋、接不住如实折价；
 *   E 掌柜铺子（player-shop.js）：盘铺面（至多两城，价=底价+城望+地段播种）、自定价（销率明账：
 *     ≤公道×1.3 抢手、×2.2 以上白摆）、雇伙计（安家钱+日薪从柜上支、欠薪三日辞工）、
 *     每日开市逐样掷销、税吏抽分（画像档通缉之身多收酒钱+热度）、贼/老主顾街面事、收柜落袋；
 *   F 著书立说（authoring.js）：四类选题吃真账（境界/主修功法/行脚本料），品质=学识×2+境界×10+本料+掷笔，
 *     卖稿四档稿费、神品进传闻池；赠书好感敬重真涨、亲传弟子加成；伪经后果链明账
 *     （掌眼识破→烧稿拉黑30日 / 蒙混→三到七日 55% 走火事故→30% 追到头上永久拉黑）；
 *   G 酿灵酒（brewing.js）：三酒方×四档年份=十二件 consumable 注册进 itemById/allItems 正门（重复加载不重不漏），
 *     三口坛、坛租现付（RewardService 负账）、材料行囊真扣、年份按绝对日算（读档后照样长），
 *     启坛按天数落档给酒、行囊满如实折价六成。
 *
 * 钉法：七本账（六新+黑道账改装）整文件沙箱真跑 + 全量源码钉位 + manifest/HTML 对账。
 * 清单口径：341 script / 25 层注释（v26.1 五路进城批再添五本，336→341）——layerComments 由 26 改 25 不是删了层，是仓库侧 stats 字段
 *   与实际条目早已不符（对仓库 zip 复核：entries 里含「层：」的注释一直就是 25 条），本批按工具真数归正。
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

console.log('\n========== v26.0 六路营生批 ==========');

const REALM_TIER = { '凡人': 0, '炼气': 1, '筑基': 2, '金丹': 3, '元婴': 4, '化神': 5 };

const NEW_FILES = [
    'js/npcs/disguise-system.js',
    'js/npcs/kidnap-system.js',
    'js/city-facilities/stone-gamble.js',
    'js/city-facilities/player-shop.js',
    'js/extensions/authoring.js',
    'js/crafting/brewing.js'
];
const LOAD_ORDER = ['js/npcs/npc-crime.js'].concat(NEW_FILES);

const MATS = {
    mat_gold_sand: 20, mat_pearl: 50, mat_coral: 40, mat_fire_essence: 150,
    mat_dragon_grass: 120, mat_ice_herb: 45, mat_spirit_grass: 15, mat_spirit_spring: 100,
    mat_spirit_flower: 150, mat_lingzhi: 30, mat_demon_beast_blood: 60,
    pill_small_recovery: 10, art_01: 0
};

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

function putSlot(W, templateId, count) {
    W.__uidN = (W.__uidN || 0) + 1;
    const s = { uid: 'u' + W.__uidN, templateId, count };
    W.inventory.slots.push(s);
    return s;
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
    W.__registry = {}; W.__confirms = []; W.__confirmAnswer = true;
    W.__repUps = []; W.__repDowns = []; W.__aliasN = 0;
    W.__npcs = {}; W.__nearby = [];
    W.__skills = Object.assign({ 口才: 10, 学识: 0, 烹饪: 0 }, opts.skills || {});
    W.__rewardFail = false; W.__addFail = false;
    W.__giveLog = [];
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
    W.showConfirm = (title, detail) => { W.__confirms.push({ title, detail }); return { then(fn) { fn(W.__confirmAnswer === true); } }; };
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
    W.locationSystem = { getCityData: (ct) => W.__cities[ct] || null };
    W.npcManager = { getNPC: (id) => W.__npcs[id] || null, getNearbyNPCs: () => W.__nearby };
    W.currentCharData = {
        name: '测试侠', location: opts.loc || '洛水城', realm: opts.realm || '筑基',
        spiritStones: 0, karma: 0, notoriety: 0, qi: 100, energy: 100, health: 100, maxHealth: 100, maxQi: 100
    };
    W.inventory = { slots: [] };
    W.removeItem = (uid, count) => {
        const i = W.inventory.slots.findIndex((s) => s && s.uid === uid);
        if (i === -1) return false;
        W.inventory.slots[i].count -= (count || 1);
        if (W.inventory.slots[i].count <= 0) W.inventory.slots[i] = null;
        return true;
    };
    W.addItem = (id, n) => {
        if (W.__addFail || !W.itemById[id]) return 0;
        let left = n;
        for (const s of W.inventory.slots) {
            if (s && s.templateId === id && s.count < 99) { const put = Math.min(left, 99 - s.count); s.count += put; left -= put; }
        }
        while (left > 0) { putSlot(W, id, Math.min(left, 99)); left -= Math.min(left, 99); }
        return n;
    };
    W.giveWithReceipt = (id, n) => {
        const got = W.__addFail ? 0 : W.addItem(id, n);
        W.__giveLog.push({ id, n, got });
        return { got, name: (W.itemById[id] || {}).name || id };
    };
    W.itemById = {}; W.allItems = [];
    Object.keys(MATS).forEach((id) => {
        W.itemById[id] = { id, name: id === 'art_01' ? '青松诀' : '物料·' + id, price: MATS[id], category: id === 'pill_small_recovery' ? 'consumable' : 'material' };
    });
    W.currentSkills = { skill_main: { id: 'art_01' } };
    W.skillPages = [{ id: 'art_01', name: '青松诀' }];
    W.cityReputation = { '洛水城': { value: 12, flags: ['visited'] } };
    W.getReputationValue = (ct) => ((W.cityReputation[ct] || {}).value) || 0;
    W.addReputation = (ct, n) => { W.__repUps.push({ ct, n }); };
    W.reduceReputation = (ct, n) => { W.__repDowns.push({ ct, n }); };
    W.nameGenerator = { generateName: () => { W.__aliasN += 1; return { full: '假名' + W.__aliasN }; } };
    W.startBattle = (enemy) => { W.currentBattle = { enemy }; return W.currentBattle; };
    W.isAtHome = () => false;
    W.closeBuildingDialog = () => {};
    W.StateRegistry = { register: (k, o) => { W.__registry[k] = o; } };
    W.discipleState = { _myDisciples: [] };

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

// ============ A. 通缉两档（npc-crime 改装） ============
{
    const W = buildEnv(0.99);
    ok(typeof W.NpcCrime.faceKnown === 'function' && typeof W.NpcCrime.wantedTier === 'function', 'A1 faceKnown/wantedTier 两把新读数出口在位');
    ok(W.NpcCrime.wantedTier() === 'none', 'A2 没案底 → wantedTier none');
    W.NpcCrime.addHeat(35, '测试罪行');
    ok(W.NpcCrime.wanted() && !W.NpcCrime.faceKnown() && W.NpcCrime.wantedTier() === 'trait', 'A3 干净罪行到线 → 特质档（脸没露，官府只有体态口音）');
    ok(W.NpcCrime.patrolBoost(10) === 15, 'A4 特质档盘查加档 = +5（10→15），不是画像档的 +15');
    W.NpcCrime.addHeat(1, '当场被拿', { faceSeen: true });
    ok(W.NpcCrime.faceKnown() && W.NpcCrime.wantedTier() === 'portrait', 'A5 faceSeen 落账 → 画像档（画影图形）');
    ok(W.NpcCrime.patrolBoost(10) === 25, 'A6 画像档盘查加档 = +15（10→25）');
    ok(W.__logs.some((l) => l.m.indexOf('画影图形') >= 0), 'A7 转档当口日志明说「画影图形贴上了悬赏牌」');
    const b1 = crimeState(W).bounty;
    ok(W.NpcCrime.addBountyOnReport(25) && crimeState(W).bounty === b1 + 25, 'A8 addBountyOnReport：通缉档上追加悬赏真涨');
}
{
    const W = buildEnv(0.99, { stones: 500 });
    crimeImport(W, { heat: 35, bounty: 50, face: 1 });
    W.currentCharData.spiritStones = 0;
    W.currentBattle = { _bountyAmt: 50, _hunterName: '铁面' };
    W.settleBountyHunt(false);
    ok(W.__wallet.stones === 450, 'A9 猎人拿下：赏金 50 从钱袋真划走');
    ok(crimeState(W).face === 1 && crimeState(W).bounty === 0, 'A10 被扭送 → 案销但脸进册子（face=1 留着）');
    W.currentBattle = null;
    // 猎人盯梢率两档：特质 p=(0.08+35/300)×0.3≈0.059，画像 p≈0.197
    crimeImport(W, { heat: 35, bounty: 50, face: 0 });
    ok(W.NpcCrime.maybeHunter(() => 0.1) === false, 'A11 特质档：0.1 的骰盯不上（p≈0.059）——猎人难靠描述认人');
    ok(W.NpcCrime.maybeHunter(() => 0.05) === true && W.currentBattle && W.currentBattle._isBountyHunt, 'A12 特质档 0.05 的骰才盯得上（真仗拉起 _isBountyHunt 旗）');
    W.currentBattle = null;
    crimeImport(W, { heat: 35, bounty: 50, face: 1 });
    ok(W.NpcCrime.maybeHunter(() => 0.19) === true, 'A13 画像档：0.19 的骰就盯得上（p≈0.197）——脸被看到过就很麻烦');
    W.currentBattle = null;
    // 易容守卫接线：画像档戴面具 ×0.45 ≈ 0.0885
    W.__registry.disguise.import({ on: true, alias: '假面客', grade: 2, untilDay: W.__day + 5, appliedDay: W.__day, rerolls: 0, lastBuyDay: -1, ruined: 0 });
    ok(W.Disguise.active() && W.NpcCrime.maybeHunter(() => 0.09) === false, 'A14 画像档戴面具：0.09 的骰盯不上（p≈0.0885）');
    W.currentBattle = null;
    ok(W.NpcCrime.maybeHunter(() => 0.08) === true, 'A15 画像档戴面具 0.08 仍可能被步态认出（面具不是隐身符）');
    W.currentBattle = null;
    ok(W.NpcCrime.patrolBoost(10) === 18, 'A16 画像档戴面具盘查加档减半（10+8）');
    crimeImport(W, { heat: 35, bounty: 50, face: 0 });
    ok(W.NpcCrime.patrolBoost(10) === 10, 'A17 特质档戴面具盘查加档归零（体态步法都改了）');
    // 风头冷却：特质档戴面具多冷 2 点
    crimeImport(W, { heat: 35, bounty: 50, face: 0, lastCoolDay: -1 });
    W.NpcCrime.coolDaily();
    ok(crimeState(W).heat === 30, 'A18 特质档戴面具蛰伏：风头一日冷 5 点（3+2 守卫加成）');
    // 冷透销案 → 画像揭下
    crimeImport(W, { heat: 32, bounty: 50, face: 1, lastCoolDay: -1 });
    W.__registry.disguise.reset();
    W.NpcCrime.coolDaily();
    ok(crimeState(W).face === 0 && crimeState(W).bounty === 0 && !W.NpcCrime.wanted(), 'A19 风头冷透销案 → 画像揭下、face 归零、赏金清账');
    // 缴清销案同样揭画像
    crimeImport(W, { heat: 35, bounty: 50, face: 1, lastCoolDay: -1 });
    ok(W.NpcCrime.payBounty().ok === true && crimeState(W).face === 0, 'A20 司法堂缴清 → 当堂销案、画影勾销（face=0）');
    ok(W.NpcCrime.addBountyOnReport(25) === false, 'A21 没通缉时 addBountyOnReport 不凭空造案');
    // 落档净化
    crimeImport(W, { heat: 200, face: 2, bounty: -5, log: 'junk' });
    const cs = crimeState(W);
    ok(cs.heat === 100 && cs.face === 1 && cs.bounty === 0 && Array.isArray(cs.log), 'A22 crimeLedger 落档净化：热度夹板/face 归一/赏金非负/日志成列');
    // wantedLine 两档文案
    crimeImport(W, { heat: 35, bounty: 50, face: 0 });
    ok(W.NpcCrime.wantedLine().indexOf('画影付阙如') >= 0, 'A23 特质档 wantedLine 如实说「画影付阙如，只有体态口音」');
    crimeImport(W, { heat: 35, bounty: 50, face: 1 });
    ok(W.NpcCrime.wantedLine().indexOf('画像') >= 0, 'A24 画像档 wantedLine 报「画像满城比对」');
}

// ============ B. 易容改名（disguise-system） ============
{
    const W = buildEnv(0.99, { stones: 2000 });
    ok(W.Disguise.marketOk('洛水城') === true && W.Disguise.marketOk('青云镇') === false && W.Disguise.marketOk('荒村') === false, 'B1 师傅只在有黑市的城（market 楼宇账真读）');
    // 风头太劲没人接活
    crimeImport(W, { heat: 60, bounty: 0 });
    ok(W.Disguise.buy(0) === false && W.lastMsg().indexOf('风头') >= 0, 'B2 民愤热度 ≥60 师傅不接活——先消停再来（很困难之一）');
    crimeImport(W, { heat: 0, bounty: 0 });
    // 钱不够
    W.__wallet.stones = 50;
    ok(W.Disguise.buy(0) === false && W.__wallet.stones === 50, 'B3 灵石不足买不成，一个子儿不少');
    W.__wallet.stones = 2000;
    // 神工要稀材
    ok(W.Disguise.buy(2) === false && W.__wallet.stones === 2000, 'B4 鬼斧神工要妖兽精血——没料不动刀、不扣钱');
    putSlot(W, 'mat_demon_beast_blood', 1);
    // 正常上手
    ok(W.Disguise.buy(0) === true, 'B5 人皮面具 80 灵石上手成功');
    ok(W.__wallet.stones === 1920 && W.Disguise.active() && W.Disguise.alias() === '假名1', 'B6 钱真扣、假名走 nameGenerator 真名字池');
    ok(W.Disguise.daysLeft() === 3 && W.__time === 30, 'B7 面具撑 3 日、上脸耗 30 分钟（时辰真扣）');
    ok(W.Disguise.buy(1) === false && W.lastMsg().indexOf('先撕') >= 0, 'B8 戴脸不重易——先撕旧脸（很困难之二）');
    ok(W.Disguise.rollAlias() === true && W.Disguise.alias() === '假名2', 'B9 假名可重摇一次');
    ok(W.Disguise.rollAlias() === false, 'B10 第二次重摇不给——「官府的册子都要替你翻烂了」');
    // 到期脱胶
    const st = JSON.parse(JSON.stringify(W.Disguise.state()));
    st.untilDay = W.__day - 1;
    W.__registry.disguise.import(st);
    ok(W.Disguise.active() === false, 'B11 面具到期自动脱胶（active 读数自己会验期）');
    W.__registry.disguise.reset();
    // 神工档：料扣、钱扣、撑 15 日（每日一回——先翻页）
    W.advanceDay(1);
    ok(W.Disguise.buy(2) === true && W.__wallet.stones === 1270 && W.Disguise.daysLeft() === 15, 'B12 鬼斧神工 650 灵石＋妖兽精血入账：撑 15 日');
    ok(W.inventory.slots.every((s) => !s || s.templateId !== 'mat_demon_beast_blood'), 'B13 妖兽精血从行囊真扣走');
    // 每日撞破：画像档 p=0.30×1.6=0.48（人皮面具 grade1）
    W.__registry.disguise.import({ on: true, alias: '假面', grade: 1, untilDay: W.__day + 2, appliedDay: W.__day, rerolls: 0, lastBuyDay: -1, ruined: 0 });
    crimeImport(W, { heat: 35, bounty: 50, face: 1 });
    W.Disguise.dailyCheck(() => 0.9);
    ok(W.Disguise.active() === true, 'B14 画像档 0.9 的骰没被撞破——面具还戴着');
    W.Disguise.dailyCheck(() => 0.4);
    ok(W.Disguise.active() === false && crimeState(W).heat === 38, 'B15 画像档 0.4 的骰被熟人撞破：面具作废、热度+3（很困难之三：戴着也有险）');
    ok(W.currentCharData.notoriety === 1 && W.__deeds.some((d) => d.m === 'bad' && d.s.indexOf('易容') >= 0), 'B16 撞破：恶名+1、风声进传闻池');
    // 特质档撞破率减半：p=0.30×0.5=0.15
    W.__registry.disguise.import({ on: true, alias: '假面', grade: 1, untilDay: W.__day + 2, appliedDay: W.__day, rerolls: 0, lastBuyDay: -1, ruined: 0 });
    crimeImport(W, { heat: 35, bounty: 50, face: 0 });
    W.Disguise.dailyCheck(() => 0.2);
    ok(W.Disguise.active() === true, 'B17 特质档 0.2 的骰撞不破（p=0.15）——脸没露＋易容＝近乎白走');
    // 没通缉不掷骰
    crimeImport(W, { heat: 0, bounty: 0 });
    W.Disguise.dailyCheck(() => 0.0);
    ok(W.Disguise.active() === true, 'B18 没通缉没人找你——0.0 的骰也不撞（面具只是费钱）');
    // 撕脸
    ok(W.Disguise.removeMask() === true && W.Disguise.active() === false, 'B19 撕面具做回自己');
    ok(W.Disguise.removeMask() === false, 'B20 没戴面具撕不了');
    // 落档净化
    W.__registry.disguise.import({ on: true, alias: 'x'.repeat(50), grade: 9, untilDay: 999 });
    const ds = W.Disguise.state();
    ok(ds.on === false && ds.alias.length <= 12, 'B21 disguise 落档净化：野档位打回没戴、假名截 12 字');
    // 新日订阅挂上
    ok(W.__newDayCbs.length >= 2, 'B22 易容与黑道两本账都挂了新日正门（onNewDaySubscribe）');
}

// ============ C. 绑架勒索（kidnap-system） ============
{
    const W = buildEnv(0.1);
    const rich = mockNpc(W, 'n_rich', { name: '钱富贵', occupation: '商人' });
    const monk = mockNpc(W, 'n_poor', { name: '穷老汉', occupation: '村民' });
    const elder = mockNpc(W, 'n_elder', { name: '清虚长老', occupation: '长老', combat: { realm: '金丹', level: 60 } });
    const dao = mockNpc(W, 'n_dao', { name: '道侣', occupation: '商人', relationship: { affection: 90, flags: new Set(['dao_companion']) } });
    ok(W.Kidnap.buildButton(rich, 'n_rich').indexOf('绑架') >= 0, 'C1 富商头上有「绑架」钮');
    ok(W.Kidnap.buildButton(monk, 'n_poor') === '', 'C2 家无余财的村民没这钮——赎金信都写不出数目');
    ok(W.Kidnap.buildButton({ isDead: true }, 'x') === '', 'C3 死人不挂钮');
    ok(W.Kidnap.kidnap('n_poor') === false, 'C4 绑穷人直接回绝（worthOf 门槛真拦）');
    ok(W.Kidnap.kidnap('n_elder') === false && W.lastMsg().indexOf('碰不得') >= 0, 'C5 长老碰不得——明桩暗哨不知多少');
    ok(W.Kidnap.kidnap('n_dao') === false && W.lastMsg().indexOf('下不去手') >= 0, 'C6 道侣/挚交下不去手（与威胁抢劫同一道门槛）');
    // 软路得手（rng 0.1 < rate≈0.53）
    ok(W.Kidnap.kidnap('n_rich') === true, 'C7 富商软路绑架得手（确认后真动手）');
    ok(W.__confirms.length === 1 && W.__confirms[0].title.indexOf('绑架') >= 0 && W.__confirms[0].detail.indexOf('业障') >= 0, 'C8 动手前先过确认窗（把后果链写在脸上）');
    const h = W.Kidnap.holding();
    ok(h && h.npcId === 'n_rich' && rich.location === '被囚', 'C9 人质真锁进地窖（NPC 位置账挪走——不是文案）');
    ok(rich.relationship.fear === 30 && rich.relationship.hatred === 25 && rich.relationship.affection === -50, 'C10 威压+30 仇恨+25 好感-50 三笔真落');
    ok(W.currentCharData.karma === -6 && W.currentCharData.notoriety === 2 && crimeState(W).heat === 5, 'C11 业障-6 恶名+2 热度+5——三本账一起记');
    ok(W.__deeds.some((d) => d.s.indexOf('绑') >= 0), 'C12 风声进传闻池');
    ok(rich._actions.some((a) => a.a === 'kidnapped' && a.tone === 'negative'), 'C13 这一笔记进 NPC 记忆（P27 同款真账口径）');
    ok(W.Kidnap.kidnap('n_rich') === false && W.lastMsg().indexOf('一票未了') >= 0, 'C14 同一时刻只押得起一票');
    // 赎金信三档
    ok(W.Kidnap.ransomBase() === 120, 'C15 富商身家基数 120（境界尺 mul 真读）');
    ok(W.Kidnap.sendLetter(2) === true && W.Kidnap.holding().ransom === 240, 'C16 狠勒档开口 = 基数×2 = 240');
    ok(W.Kidnap.holding().stage === 'letter' && W.Kidnap.holding().dueDay === W.__day + 1, 'C17 信送出：stage=letter、回音 1~2 日（rng 0.1 → +1 日）');
    ok(W.Kidnap.sendLetter(0) === false, 'C18 信已送出不能改口');
    // 四路反应：交赎（轻赎档 rPay=0.55-0+0.10=0.65，rng 0.2 → pay）
    const st = W.Kidnap.state();
    st.hostage.tierIdx = 0; st.hostage.ransom = 72;
    W.__registry.kidnap.import(st);
    const before = W.__wallet.stones;
    W.advanceDay(1);
    W.Kidnap.dailyCheck(() => 0.2);
    ok(W.__wallet.stones === before + 72 && W.Kidnap.holding() === null, 'C19 交赎：赎金 72 真落袋、票真放');
    ok(rich.location === '洛水城' && crimeState(W).face === 0, 'C20 交赎是夜里交割——人送回原处、脸不进册子');
    ok(crimeState(W).heat === 11, 'C21 交赎热度+6（案底还在册，风头不会自己消）');
}
{
    // 埋伏路
    const W = buildEnv(0.1);
    const rich = mockNpc(W, 'n_rich', { name: '钱富贵', occupation: '商人' });
    W.Kidnap.kidnap('n_rich');
    W.Kidnap.sendLetter(1);   // 照身家 120：rPay≈0.4933，rng 0.6 → 埋伏带
    W.advanceDay(1);
    W.Kidnap.dailyCheck(() => 0.6);
    ok(W.currentBattle && W.currentBattle._isKidnapAmbush === true && W.currentBattle._ambushRansom === 120, 'C22 苦主家埋伏：真仗拉起 _isKidnapAmbush 旗、赎金数押在旗上');
    const before = W.__wallet.stones;
    W.Kidnap.settleKidnapAmbush(true);
    ok(W.__wallet.stones === before + 120 && W.Kidnap.holding() === null, 'C23 打赢埋伏：赎金照拿、票照放');
    ok(crimeState(W).heat === 13 && W.currentCharData.karma === -9, 'C24 打赢也记账：热度+8、业障再-3（打了苦主家的人）');
}
{
    // 报官路
    const W = buildEnv(0.1);
    const rich = mockNpc(W, 'n_rich', { name: '钱富贵', occupation: '商人' });
    W.Kidnap.kidnap('n_rich');
    W.Kidnap.sendLetter(0);   // 轻赎：rPay≈0.6433，rAmb 0.10 → 报官带 [0.7433, 0.8933)
    W.advanceDay(1);
    W.Kidnap.dailyCheck(() => 0.8);
    ok(W.Kidnap.holding() === null && rich.location === '洛水城', 'C25 报官：官差循线把人救回原处');
    ok(crimeState(W).face === 1 && crimeState(W).heat === 17, 'C26 报官＝案发——脸进画影册（faceSeen）、热度+12');
    ok(rich.relationship.hatred === 65, 'C27 苦主家记你一辈子：仇恨 25+40 两笔都在');
}
{
    // 石沉大海 → 只剩放与撕
    const W = buildEnv(0.1);
    const rich = mockNpc(W, 'n_rich', { name: '钱富贵', occupation: '商人' });
    W.Kidnap.kidnap('n_rich');
    W.Kidnap.sendLetter(0);
    W.advanceDay(1);
    W.Kidnap.dailyCheck(() => 0.99);
    ok(W.Kidnap.holding() && W.Kidnap.holding().stage === 'ignored', 'C28 石沉大海：stage=ignored——只剩放人/撕票两条路');
    // 撕票
    W.Kidnap.slayHostage();
    ok(rich.isDead === true, 'C29 撕票真死——生死簿（isDead）落账，不是文案');
    ok(W.currentCharData.karma === -21 && W.currentCharData.notoriety === 10, 'C30 业障-15（连本票-6 共-21）、恶名+8（连本票共 10）');
    ok(crimeState(W).face === 1 && crimeState(W).heat === 20, 'C31 撕票脸进册子、热度+15——杀孽的果报走 karma 真账');
    ok(W.Kidnap.holding() === null && W.__deeds.some((d) => d.s.indexOf('撕了票') >= 0), 'C32 地窖空了、风声传开（道上都嫌做得绝）');
}
{
    // 硬路真仗 + 关押超时 + 放人 + 净化
    const W = buildEnv(0.1);
    const warrior = mockNpc(W, 'n_war', { name: '刀客', occupation: '竞争对手', combat: { realm: '筑基', level: 40 } });
    W.currentBattle = null;
    W.Kidnap.kidnap('n_war');
    ok(W.currentBattle && W.currentBattle._isKidnapFight === true && W.currentBattle._kidnapNpcId === 'n_war', 'C33 能反抗的拔刀真仗（_isKidnapFight 旗 + npcId 押旗）');
    W.Kidnap.settleKidnapFight(true);
    ok(W.Kidnap.holding() && W.Kidnap.holding().npcId === 'n_war' && warrior.location === '被囚', 'C34 打赢 → 人押进地窖（settleKidnapFight(true) 走 seize）');
    W.currentBattle = { _kidnapNpcId: 'n_x' };
    W.Kidnap.settleKidnapFight(false);
    ok(crimeState(W).face === 1 && W.__wallet.stones === 400, 'C35 打输 → 被搜走两成现银（500→400）、脸进册子');
    // 关押超时：官府循线
    const W2 = buildEnv(0.05);
    const rich2 = mockNpc(W2, 'n_rich2', { name: '李百万', occupation: '商人' });
    W2.Kidnap.kidnap('n_rich2');
    W2.Kidnap.holding().sinceDay = W2.__day - 4;   // 已关 4 日（超 3 日宽限）
    W2.Kidnap.dailyCheck(() => 0.05);
    ok(W2.Kidnap.holding() === null && rich2.location === '洛水城' && crimeState(W2).face === 1, 'C36 关押超三日官府循线端了地窖：人救回、脸进册子（风险 0.11 > 0.05）');
    // 放人
    const W3 = buildEnv(0.1);
    const rich3 = mockNpc(W3, 'n_rich3', { name: '赵员外', occupation: '商人' });
    W3.Kidnap.kidnap('n_rich3');
    W3.Kidnap.releaseBtn();
    ok(W3.Kidnap.holding() === null && rich3.location === '洛水城', 'C37 放人：送回原处');
    ok(rich3.relationship.fear === 50 && crimeState(W3).heat === 7, 'C38 放人也留账：威压再+20（共50）、热度+2——案子已经在册');
    // 每人每七日一回
    ok(W3.Kidnap.kidnap('n_rich3') === false && W3.lastMsg().indexOf('风头还没过') >= 0, 'C39 同一人七日冷却——上回被你动过手，TA出门都带着人');
    // 落档净化
    W3.__registry.kidnap.import({ hostage: { npcId: 'x'.repeat(100), name: 'y', oldLoc: 'z', sinceDay: 'NaN', ransom: -5, tierIdx: 9, stage: 'junk', dueDay: null } });
    const ks = W3.Kidnap.state();
    ok(ks.hostage.npcId.length === 60 && ks.hostage.stage === 'held' && ks.hostage.sinceDay === 0 && ks.hostage.ransom === 0 && ks.hostage.tierIdx === -1, 'C40 kidnap 落档净化：id 截 60、野 stage 打回 held、NaN 归零、负赎金归零');
    W3.__registry.kidnap.import({ hostage: 'junk' });
    ok(W3.Kidnap.holding() === null, 'C41 畸形档直接清空——不带病开局');
}
{
    // 对话面板三枚按钮并排（npc-crime 守卫接线）
    const W = buildEnv(0.99);
    const rich = mockNpc(W, 'n_rich', { name: '钱富贵', occupation: '商人' });
    const html = W.buildNpcCrimeButtons(rich, 'n_rich');
    ok(html.indexOf('威胁') >= 0 && html.indexOf('抢劫') >= 0 && html.indexOf('绑架') >= 0, 'C42 对话面板黑道三枚按钮并排（威胁/抢劫/绑架）');
    const monk = mockNpc(W, 'n_poor', { name: '穷老汉', occupation: '村民' });
    ok(W.buildNpcCrimeButtons(monk, 'n_poor').indexOf('绑架') < 0, 'C43 赎不起的人头上不挂绑架钮（buildButton 空串守卫）');
}

// ============ D. 赌石（stone-gamble） ============
{
    const W = buildEnv([0.99, 0.1], { stones: 1000 });
    ok(W.StoneGamble.stallOk('洛水城') === true && W.StoneGamble.stallOk('荒村') === false, 'D1 古玩摊跟着市集走（楼宇账真读）');
    W.__wallet.stones = 5;
    ok(W.StoneGamble.buy(0) === false && W.__wallet.stones === 5, 'D2 钱不够买不了石');
    W.__wallet.stones = 1000;
    ok(W.StoneGamble.buy(0) === true && W.__wallet.stones === 990, 'D3 泥皮石 10 灵石入手（rng 0.99 →  rolled 高货档）');
    ok(W.StoneGamble.state().stone && W.StoneGamble.state().stone.tier === 0, 'D4 石头在手：一刀没切前不能买第二块');
    ok(W.StoneGamble.buy(1) === false && W.lastMsg().indexOf('先把它切了') >= 0, 'D5 手里攥着石头不赊第二块');
    // 探石：真气门槛 + 看真
    W.currentCharData.qi = 3;
    ok(W.StoneGamble.peek() === false && W.currentCharData.qi === 3, 'D6 真气不继探不了石');
    W.currentCharData.qi = 100;
    ok(W.StoneGamble.peek() === true && W.currentCharData.qi === 95 && W.__time >= 15, 'D7 探石耗 5 真气 10 分钟（时辰真扣）');
    ok(W.StoneGamble.state().stone.peeked === 3, 'D8 筑基＋rng 0.1 → 看真：这块是「高货」的相（revealP=0.59）');
    ok(W.StoneGamble.peek() === false, 'D9 探过不能再探——「再探也是白搭真气」');
    // 切石：高货 130 灵石 + mat_coral 入袋
    const before = W.__wallet.stones;
    ok(W.StoneGamble.cut() === true, 'D10 一刀切下');
    ok(W.__wallet.stones === before + 130, 'D11 高货出货 130 灵石真落袋');
    ok(W.__giveLog.some((g) => g.id === 'mat_coral' && g.got === 1), 'D12 彩头材料走 giveWithReceipt 真入袋');
    ok(W.__deeds.some((d) => d.m === 'good' && d.s.indexOf('高货') >= 0), 'D13 切出高货以上 → 风声进传闻池');
    ok(W.__skills['学识'] === 1 && W.StoneGamble.state().cuts === 1, 'D14 每刀练一分眼力（学识+1）、日账记刀数');
    ok(W.StoneGamble.state().net === 120, 'D15 日净账如实：-10 石价 +130 出货 = +120');
    // 净赢封顶
    const st = W.StoneGamble.state();
    st.net = 395;
    st.stone = { tier: 2, rolled: 3, peeked: null };   // 满绿石 · 极品档 900
    W.__registry.stoneGamble.import(st);
    W.StoneGamble.cut();
    ok(W.StoneGamble.state().net === 400, 'D16 净赢封顶 400：只付到线（395→400），不吞账也不印钞');
    ok(W.lastMsg().indexOf('银箱见底') >= 0, 'D17 封顶的实话写在脸上——「摊主的银箱见底」');
    // 每日刀数
    const st2 = W.StoneGamble.state();
    st2.cuts = 12; st2.net = 0; st2.stone = null;
    W.__registry.stoneGamble.import(st2);
    ok(W.StoneGamble.buy(0) === false && W.lastMsg().indexOf('明日请早') >= 0, 'D18 每日 12 刀封顶——摊主收刀');
    // 行囊满折价
    const W2 = buildEnv([0.5], { stones: 1000 });
    const st3 = { day: W2.__day, cuts: 0, net: -50, stone: { tier: 1, rolled: 3, peeked: null }, last: null };   // 蜡皮 · 高货 200 + mat_fire_essence
    W2.__registry.stoneGamble.import(st3);
    W2.__addFail = true;
    const w2before = W2.__wallet.stones;
    W2.StoneGamble.cut();
    ok(W2.__wallet.stones === w2before + 200 + 75, 'D19 行囊满：材料如实折半价灵石（fire_essence 150→75），货不蒸发');
    // 出货表 EV 明账（三档期望回款都低于石价——抽水写进注释也写进牌面）
    const TIERS = W.StoneGamble.TIERS;
    const evs = TIERS.map((t) => t.outcomes.reduce((s, o) => s + o.p * o.stones, 0));
    ok(evs[0] < 10 && evs[1] < 50 && evs[2] < 200, 'D20 三档原石期望回款（灵石部分 ' + evs.map((e) => e.toFixed(1)).join('/') + '）全低于石价——摊主抽水是明账');
    const psum = TIERS.map((t) => t.outcomes.reduce((s, o) => s + o.p, 0));
    ok(psum.every((p) => Math.abs(p - 1) < 1e-9), 'D21 三张出货表概率各自归一（没有藏在表外的第六行）');
    // 落档净化
    W2.__registry.stoneGamble.import({ day: 'x', cuts: 99, net: 99999, stone: { tier: 7, rolled: 2 }, last: 'junk' });
    const gs = W2.StoneGamble.state();
    ok(gs.cuts === 12 && gs.net === 400 && gs.stone === null && gs.last === null, 'D22 stoneGamble 落档净化：刀数/净账夹板、野 tier 清空、junk 归无');
}

// ============ E. 掌柜铺子（player-shop） ============
{
    const W = buildEnv(0.99, { stones: 3000 });
    ok(W.PlayerShop.shopOkCity('洛水城') && !W.PlayerShop.shopOkCity('荒村'), 'E1 有铺面的城才有的盘（楼宇账真读）');
    const price = W.PlayerShop.shopPrice('洛水城');
    ok(price >= 500 + 12 * 2 && price <= 500 + 12 * 2 + 200, 'E2 铺价 = 底价 500 + 城望 12×2 + 地段播种 0~200（' + price + '）');
    ok(W.PlayerShop.shopPrice('洛水城') === price, 'E3 地段播种稳定：两次问价一个数');
    ok(W.PlayerShop.buyShop() === true && W.__wallet.stones === 3000 - price, 'E4 盘铺面：中人画押、钱真划走');
    ok(W.PlayerShop.shopHere() && W.PlayerShop.shopHere().city === '洛水城', 'E5 铺子落账（city 键归一）');
    ok(W.__deeds.some((d) => d.m === 'good' && d.s.indexOf('掌柜') >= 0), 'E6 当掌柜是体面事——风声进传闻池');
    ok(W.PlayerShop.buyShop() === false, 'E7 一城一间——同一条街上不跟自己抢生意');
    // 招牌净化
    W.PlayerShop.rename('<script>alert(1)</script>黑店"号');
    const nm = W.PlayerShop.shopHere().name;
    ok(nm.indexOf('<') < 0 && nm.indexOf('"') < 0 && nm.length <= 12, 'E8 招牌净化：尖括号/引号剥掉、十二字截断');
    // 上架：行囊真扣、默认价=公道×1.3
    putSlot(W, 'pill_small_recovery', 5);
    ok(W.PlayerShop.stock('pill_small_recovery', 3) === true, 'E9 从行囊上架');
    const shelf = W.PlayerShop.shopHere().shelves[0];
    ok(shelf.count === 3 && shelf.price === 13 && shelf.fair === 10, 'E10 上 3 件、默认价 13 = 公道价 10 上浮三成');
    const slotLeft = W.inventory.slots.find((s) => s && s.templateId === 'pill_small_recovery');
    ok(slotLeft.count === 2, 'E11 行囊真扣 3 件（uid 槽位账，剩 2）');
    ok(W.PlayerShop.stock('no_such_item', 1) === false, 'E12 行囊里没有的货上不了架');
    for (let i = 0; i < 7; i++) { putSlot(W, 'mat_pearl', 1); W.PlayerShop.stock('mat_pearl', 1); }
    putSlot(W, 'mat_coral', 1);
    ok(W.PlayerShop.stock('mat_coral', 1) === false && W.lastMsg().indexOf('满八样') >= 0, 'E13 货架八样封顶');
    // 调价夹板
    const idx0 = 0;
    for (let i = 0; i < 20; i++) W.PlayerShop.priceStep(idx0, 1);
    ok(W.PlayerShop.shopHere().shelves[idx0].price === 40, 'E14 调价封顶 = 公道价×4（40）——再高就没人买的价不让挂');
    for (let i = 0; i < 20; i++) W.PlayerShop.priceStep(idx0, -1);
    ok(W.PlayerShop.shopHere().shelves[idx0].price === 5, 'E15 调价保底 = 公道价×0.5（5）——亏穿底的价也不让挂');
    // 伙计
    const c1 = W.PlayerShop.clerkCandidates();
    const c2 = W.PlayerShop.clerkCandidates();
    ok(c1.length === 3 && JSON.stringify(c1) === JSON.stringify(c2), 'E16 每日三名候选（城+日播种）：同日两问是同一批人');
    ok(c1.every((c) => c.skill >= 1 && c.skill <= 5 && c.hire === 30 + c.skill * 20 && c.wage === c.skill), 'E17 候选账目齐整：手艺 1~5、安家 30+技×20、日薪=技');
    const walletBeforeHire = W.__wallet.stones;
    ok(W.PlayerShop.hireClerk(0) === true && W.__wallet.stones === walletBeforeHire - c1[0].hire, 'E18 雇伙计：安家钱真划走');
    ok(W.PlayerShop.hireClerk(1) === false && W.lastMsg().indexOf('还在柜上') >= 0, 'E19 柜上有人不能再雇——先辞');
    // 每日开市：clerk skill、销率、税、工钱全链
    const s = W.PlayerShop.shopHere();
    s.shelves = [{ itemId: 'pill_small_recovery', name: '小回丹', icon: '💊', price: 10, count: 2, fair: 10 }];
    s.till = 0;
    const skill = s.clerk.skill;
    const rate = W.PlayerShop.saleRate(s.shelves[0], s, false);
    const expectRate = 0.18 * 1.5 * (0.6 + skill * 0.15) * (1 + 12 / 400);
    ok(Math.abs(rate - expectRate) < 1e-9, 'E20 销率明账可复算：0.18×定价系数×伙计系数×城望系数（公道价 → 1.5 倍抢手）');
    W.PlayerShop.dailySettle(() => 0.01);
    ok(s.shelves.length === 0 && s.soldTotal === 2, 'E21 0.01 的骰两件全走——卖空的货从架上真撤');
    const tillExpect = 20 - Math.floor(20 * 0.05) - skill;
    ok(s.till === tillExpect, 'E22 柜上账 = 销款 20 - 税 5%(' + Math.floor(20 * 0.05) + ') - 工钱(' + skill + ') = ' + tillExpect + '（一文不差）');
    ok(W.__logs.some((l) => l.m.indexOf('开市') >= 0 && l.m.indexOf('小回丹') >= 0), 'E23 开市日志点名卖了什么、进了多少');
    // 没伙计 + 人不在城 → 歇业
    s.clerk = null; s.shelves = [{ itemId: 'mat_pearl', name: '珍珠', icon: '🤍', price: 50, count: 1, fair: 50 }];
    W.currentCharData.location = '青云镇';
    const tillBefore = s.till;
    W.PlayerShop.dailySettle(() => 0.0);
    ok(s.till === tillBefore && s.shelves[0].count === 1, 'E24 没伙计、人又不在城里 → 铺子歇业（0.0 的骰也不卖）');
    W.currentCharData.location = '洛水城';
    // 欠薪辞工
    s.till = 0; s.clerk = { name: '顺子', skill: 3, wage: 3 }; s.arrears = 0;
    s.shelves = [];
    W.PlayerShop.dailySettle(() => 0.99);
    W.PlayerShop.dailySettle(() => 0.99);
    ok(s.clerk && s.arrears === 2, 'E25 柜上没钱：工钱欠着（欠 2 日还在）');
    W.PlayerShop.dailySettle(() => 0.99);
    ok(s.clerk === null, 'E26 欠满三日伙计辞工——东家抠门的代价如实落账');
    // 画像档通缉：税吏认出招牌
    crimeImport(W, { heat: 35, bounty: 50, face: 1 });
    s.shelves = [{ itemId: 'mat_pearl', name: '珍珠', icon: '🤍', price: 100, count: 1, fair: 100 }];
    s.till = 0;
    const heatBefore = crimeState(W).heat;
    let ti = 0;
    const tq = [0.01, 0.99];   // 销款命中一件，街面事不触发
    W.PlayerShop.dailySettle(() => tq[ti++]);
    ok(crimeState(W).heat === heatBefore + 1 && W.__logs.some((l) => l.m.indexOf('税吏') >= 0 && l.m.indexOf('画影') >= 0), 'E27 画像档通缉之身：税吏对着画影认招牌——多收酒钱、热度+1（铺子替你亮脸）');
    // 街面事：拿住贼 → 城望+1（rng 队列：无货销、事件 0.05 命中、ev 0.1 贼、0.6 拿住）
    crimeImport(W, { heat: 0, bounty: 0, face: 0 });
    s.shelves = [{ itemId: 'mat_pearl', name: '珍珠', icon: '🤍', price: 50, count: 2, fair: 50 }];
    W.__repUps.length = 0;
    let qi = 0;
    const queued = [0.99, 0.99, 0.05, 0.1, 0.6];
    W.PlayerShop.dailySettle(() => queued[qi++]);
    ok(W.__repUps.some((r) => r.ct === '洛水城' && r.n === 1), 'E28 当场拿住顺手牵羊的贼 → 本城声望+1（街坊都夸利落）');
    // 收柜
    s.till = 88;
    const wb = W.__wallet.stones;
    ok(W.PlayerShop.collectHere() === true && W.__wallet.stones === wb + 88 && s.till === 0, 'E29 收柜：柜上 88 灵石真进钱袋、柜清空');
    // 两城封顶
    W.currentCharData.location = '青云镇';
    ok(W.PlayerShop.buyShop() === true, 'E30 第二城可以盘');
    W.currentCharData.location = '荒村';
    ok(W.PlayerShop.buyShop() === false, 'E31 荒村没铺面盘不了');
    W.currentCharData.location = '洛水城';
    ok(W.PlayerShop.shopCount() === 2, 'E32 两城铺子在账');
    // 落档净化
    W.__registry.playerShop.import({ shops: { a: { city: '甲', shelves: 'junk', till: -9, clerk: { name: 'x'.repeat(30), skill: 99, wage: -3 } }, b: { city: '乙' }, c: { city: '丙' } } });
    const ps = W.PlayerShop.state();
    // ★2026-10-04 由「至多两城」改为「按分号口径落档」（B 类·判据过时）★
// 原判据：`Object.keys(ps.shops).length === 2` —— 落档硬顶两城。
// 现判据：落档硬顶 **CFG.BRANCH_SHOPS（4）**，而**在营上限是条件式的**：没带大掌柜时
//   `shopCap()`＝CFG.MAX_SHOPS＝2；把伙计熬成大掌柜（手艺四成、柜上满三十日）后
//   `shopCap()`＝4，开得起分号。这不是把上限放宽了，是新设计把「两城」变成「两城／带分号四城」。
// 为什么该改——先查清「为什么变」：player-shop.js:53 `BRANCH_SHOPS: 4 // 手底下有大掌柜，
//   才照应得开分号（至多掌四城）`、:271 `shopCap() = anyHeadClerk() ? BRANCH_SHOPS : MAX_SHOPS`、
//   :705/:706 升任大掌柜那两句回执都写着「从此开得分号（至多掌 4 城）」——玩家在屏上读得到这条规矩。
//   落档那侧（:863）随之硬顶四间，注释自陈「旧档超额既往不咎也只收前四」。
//   原判据量的是一个**已经不存在的上限**，所以每加一间铺它就假红。
// 收紧处：不止改数字——另立两条把新规矩钉住（无大掌柜时上限仍是 2、有大掌柜时是 4），
//   并保留「落档只收前 N、超额的直接不进账」这层净化语义（下面 E33b 用第五间验它）。
ok(Object.keys(ps.shops).length === 3, 'E33 落档硬顶四间（含分号）：三间进账，第四间上限之外的不进');
ok(W.PlayerShop.shopCap() === 2 && W.PlayerShop.anyHeadClerk() === false,
    'E33a 在营上限仍认「没大掌柜＝至多掌两城」（分号那一条是另开的门，不是把两城那道门拆了）');
const 五间 = { a: { city: '甲' }, b: { city: '乙' }, c: { city: '丙' }, d: { city: '丁' }, e: { city: '戊' } };
W.__registry.playerShop.import({ shops: 五间 });
ok(Object.keys(W.PlayerShop.state().shops).length === 4,
    'E33b 净化语义没丢：第五间直接不进账（旧档超额既往不咎，也只收前四）——上限抬到四不是「不设防」');
    const sa = ps.shops.a;
    ok(sa && sa.till === 0 && Array.isArray(sa.shelves) && sa.clerk.skill === 5 && sa.clerk.name.length <= 12, 'E34 playerShop 落档净化：负柜金归零、junk 货架清空、伙计手艺夹 1~5、名字截 12');
}

// ============ F. 著书立说（authoring） ============
{
    const W = buildEnv([0.5], { skills: { 学识: 30 } });
    ok(typeof W.Authoring.travelFuel === 'function', 'F1 travelFuel 出口在位');
    ok(W.Authoring.travelFuel() === 2, 'F2 行记本料吃真账：到过 1 城（城望账有数）×2 = 2');
    crimeImport(W, { heat: 5, bounty: 0, log: [{ day: 1, why: '测试', n: 5 }] });
    ok(W.Authoring.travelFuel() === 4, 'F3 案底也进本料：城 2 + 案 1 笔 = 4（通缉账 log 真读）');
    ok(W.Authoring.mainArtName() === '青松诀', 'F4 主修功法名真读（currentSkills.skill_main → itemById）');
    // 门槛
    const W0 = buildEnv(0.5, { realm: '凡人', skills: { 学识: 30 } });
    ok(W0.Authoring.write(0) === false && W0.lastMsg().indexOf('修行门') >= 0, 'F5 凡人写不了修行心得——「写出来是自己哄自己」');
    W0.currentSkills = {};
    ok(W0.Authoring.write(1) === false && W0.lastMsg().indexOf('功法') >= 0, 'F6 没学主修功法注不了解');
    // 写书正路：筑基＋学识30＋行记本料2＋rng0.5 → score=60+20+2+15=97 佳作
    crimeImport(W, { heat: 0, bounty: 0, log: [] });
    ok(W.Authoring.write(2) === true, 'F7 江湖行记落笔成稿');
    const bk = W.Authoring.state().books[0];
    ok(bk.score === 97 && bk.grade === 2 && bk.title.indexOf('《') === 0, 'F8 品质=学识×2+境界×10+本料+掷笔 = 97 → 佳作（分数线 40/70/100 明账）');
    ok(W.currentCharData.qi === 75 && W.__time === 180 && W.hasReward('copper', -20), 'F9 写书代价：真气-25、180 分钟、纸墨 20 铜（RewardService 负账正门）');
    ok(W.Authoring.write(2) === false && W.lastMsg().indexOf('一日只借你一回') >= 0, 'F10 书肆案头每日一回——写书是慢功夫');
    W.advanceDay(1);
    ok(W.Authoring.write(0) === true && W.Authoring.state().books.length === 2, 'F11 翌日可再写（修行心得这次成了——筑基撑腰）');
    // 卖稿：佳作 300 铜
    const soldOk = W.Authoring.sell(0);
    ok(soldOk === true && W.hasReward('copper', 300), 'F12 佳作卖稿 300 铜真落账');
    ok(W.__skills['学识'] === 33 && W.Authoring.state().books[0].state === 'sold', 'F13 卖稿学识+3、稿子落 sold 状态');
    // 神品：60 灵石 + 城望 + 传闻
    W.__registry.authoring.import({ books: [{ id: 'bk_g', title: '《神品测试》', kind: 'notes', kindName: '修行心得', icon: '📔', score: 150, grade: 3, forgery: false, state: 'held', soldDay: -1, traceDay: -1, city: '洛水城' }], blacklistUntil: -1, blackPermanent: false });
    W.Authoring.sell(0);
    ok(W.hasReward('spiritStones', 60) && W.__deeds.some((d) => d.m === 'good' && d.s.indexOf('神品测试') >= 0), 'F14 神品稿费 60 灵石＋书名进传闻池（茶楼传抄——立传吃不到的活名声）');
    // 伪经：识破路（rng 0.0 < spotP）
    const Wf = buildEnv([0.0], { skills: { 学识: 30 } });
    Wf.__registry.authoring.import({ books: [{ id: 'bk_f', title: '《伪经测试》', kind: 'fake', kindName: '伪经', icon: '📓', score: 80, grade: 2, forgery: true, state: 'held', soldDay: -1, traceDay: -1, city: '洛水城' }], blacklistUntil: -1, blackPermanent: false });
    ok(Wf.Authoring.sell(0) === false, 'F15 伪经被掌眼识破——卖稿失败');
    ok(Wf.hasReward('cityReputation', -15) && Wf.hasReward('karma', -4), 'F16 识破的代价：城望-15、业障-4（真账）');
    ok(Wf.Authoring.state().blacklistUntil === Wf.__day + 30 && Wf.Authoring.state().books[0].state === 'burned', 'F17 稿子当场烧掉、书肆拉黑 30 日');
    Wf.__registry.authoring.import({ books: [{ id: 'bk_f1b', title: '《伪经一部半》', kind: 'fake', kindName: '伪经', icon: '📓', score: 80, grade: 2, forgery: true, state: 'held', soldDay: -1, traceDay: -1, city: '洛水城' }], blacklistUntil: Wf.__day + 30, blackPermanent: false });
    ok(Wf.Authoring.sell(0) === false && Wf.lastMsg().indexOf('黑名单') >= 0, 'F18 拉黑期内换一部伪经再卖也被拒');
    // 伪经：蒙混路（rng 0.99 → 过关；0.5 → traceDay=+5）
    const Wg = buildEnv([0.99, 0.5], { skills: { 学识: 30 } });
    Wg.__registry.authoring.import({ books: [{ id: 'bk_f2', title: '《伪经二号》', kind: 'fake', kindName: '伪经', icon: '📓', score: 80, grade: 2, forgery: true, state: 'held', soldDay: -1, traceDay: -1, city: '洛水城' }], blacklistUntil: -1, blackPermanent: false });
    ok(Wg.Authoring.sell(0) === true && Wg.hasReward('copper', 300), 'F19 伪经蒙混过关：钱照拿（雷埋下了）');
    ok(Wg.Authoring.state().books[0].traceDay === Wg.__day + 5, 'F20 雷的日子：3~7 日之间（rng 0.5 → +5）');
    // 后果链：走火 + 追到头上
    Wg.advanceDay(5);
    Wg.Authoring.dailyTrace(() => 0.1);   // 0.1 < 0.55 走火；0.1 < 0.30 追责
    ok(Wg.currentCharData.karma === -6 && Wg.currentCharData.notoriety === 3, 'F21 有人照伪经练出岔子：业障-6、恶名+3');
    ok(Wg.Authoring.state().blackPermanent === true, 'F22 苦主顺着稿账追到头上 → 行会永久拉黑');
    ok(Wg.__deeds.some((d) => d.m === 'bad' && d.s.indexOf('走火') >= 0), 'F23 走火的消息传开（传闻池 bad）');
    Wg.__registry.authoring.import({ books: [{ id: 'bk_f3', title: '《伪经三号》', kind: 'fake', kindName: '伪经', icon: '📓', score: 80, grade: 2, forgery: true, state: 'held', soldDay: -1, traceDay: -1, city: '洛水城' }], blacklistUntil: -1, blackPermanent: true });
    ok(Wg.Authoring.sell(0) === false && Wg.lastMsg().indexOf('永久拉黑') >= 0, 'F24 永久拉黑后一本也卖不动——伪经的黑钱不好拿');
    // 没出事的路：0.9 ≥ 0.55 → 风声过去
    const Wh = buildEnv(0.9, { skills: { 学识: 30 } });
    Wh.__registry.authoring.import({ books: [{ id: 'bk_f4', title: '《伪经四号》', kind: 'fake', kindName: '伪经', icon: '📓', score: 80, grade: 2, forgery: true, state: 'sold', soldDay: 99, traceDay: 100, city: '洛水城' }], blacklistUntil: -1, blackPermanent: false });
    Wh.Authoring.dailyTrace(() => 0.9);
    ok(Wh.currentCharData.karma === 0 && Wh.Authoring.state().books[0].traceDay === -1, 'F25 雷响的日子没人出事 → 风声过去（雷只响一回，账不重滚）');
    // 赠书：好感/敬重真涨，弟子加成
    const Wi = buildEnv(0.5, { skills: { 学识: 30 } });
    const npc1 = mockNpc(Wi, 'n_friend', { name: '好友甲' });
    Wi.__nearby = [npc1];
    Wi.__registry.authoring.import({ books: [{ id: 'bk_g2', title: '《赠书测试》', kind: 'notes', kindName: '修行心得', icon: '📔', score: 150, grade: 3, forgery: false, state: 'held', soldDay: -1, traceDay: -1, city: '洛水城' }], blacklistUntil: -1, blackPermanent: false });
    ok(Wi.Authoring.giftPanel(0) === true && Wi.dialog.html.indexOf('好友甲') >= 0, 'F26 赠书面板列出近处的熟人（getNearbyNPCs 真读）');
    ok(Wi.Authoring.gift(0, 'n_friend') === true && npc1.relationship.affection === 12 && npc1.relationship.respect === 6, 'F27 神品赠好友：好感+12、敬重+6（按品质档给）');
    ok(npc1._actions.some((a) => a.a === 'gifted_book' && a.tone === 'positive'), 'F28 赠书记进 NPC 记忆（positive）');
    const Wi2 = buildEnv(0.5);
    const npc2 = mockNpc(Wi2, 'n_disc', { name: '亲传乙' });
    Wi2.discipleState._myDisciples = ['n_disc'];
    Wi2.__registry.authoring.import({ books: [{ id: 'bk_g3', title: '《传徒测试》', kind: 'art', kindName: '功法注解', icon: '📕', score: 150, grade: 3, forgery: false, state: 'held', soldDay: -1, traceDay: -1, city: '洛水城' }], blacklistUntil: -1, blackPermanent: false });
    Wi2.Authoring.gift(0, 'n_disc');
    ok(npc2.relationship.affection === 15, 'F29 亲传弟子得书另有加成（12+3=15，sect-kin 真名单守卫读取）');
    // 案头八封 + 落档净化
    const books8 = [];
    for (let i = 0; i < 8; i++) books8.push({ id: 'bk' + i, title: '《' + i + '》', kind: 'notes', kindName: 'x', icon: '📔', score: 50, grade: 1, forgery: false, state: 'held', soldDay: -1, traceDay: -1, city: '洛水城' });
    const Wj = buildEnv(0.5, { skills: { 学识: 30 } });
    Wj.__registry.authoring.import({ books: books8, blacklistUntil: -1, blackPermanent: false });
    ok(Wj.Authoring.write(2) === false && Wj.lastMsg().indexOf('案头堆了') >= 0, 'F30 案头八部封顶——先出手再写');
    Wj.__registry.authoring.import({ books: [{ id: 'x'.repeat(80), title: 'y'.repeat(80), kind: 'junk', grade: 9, state: 'junk', score: -5 }, 'junk', null], blacklistUntil: 'NaN', blackPermanent: 1 });
    const as = Wj.Authoring.state();
    ok(as.books.length === 1 && as.books[0].id.length === 40 && as.books[0].kind === 'notes' && as.books[0].grade === 3 && as.books[0].state === 'held', 'F31 authoring 落档净化：id 截 40、野 kind 打回 notes、野 grade 夹 0~3、junk 条目滤掉');
    ok(as.blackPermanent === true, 'F32 永久拉黑旗落档如实');
}

// ============ G. 酿灵酒（brewing） ============
{
    const W = buildEnv(0.5, { skills: { 烹饪: 15 } });
    const ids = [];
    W.Brewing.RECIPES.forEach((r) => r.stages.forEach((st) => ids.push(st.id)));
    ok(ids.length === 12 && ids.every((id) => W.itemById[id] && W.itemById[id].type === 'consumable'), 'G1 三酒方×四年份 = 十二件酒物全部注册进 itemById（consumable 正门）');
    ok(ids.every((id) => W.allItems.some((x) => x.id === id)), 'G2 allItems 也进了（商店/图鉴口径可见）');
    const runBefore = W.allItems.filter((x) => x.id.indexOf('brew_') === 0).length;
    vm.runInContext(load('js/crafting/brewing.js'), W);
    ok(W.allItems.filter((x) => x.id.indexOf('brew_') === 0).length === runBefore, 'G3 重复加载不重复注册（已有定义不覆盖）');
    ok(W.itemById.brew_dragon_divine.effect.full_recovery === true && W.itemById.brew_dragon_divine.price === 900, 'G4 神工档「龙工玉液」：整幅回满、值 900 灵石（与琼浆玉液同档口径）');
    ok(W.itemById.brew_rice_young.price === 15 && W.itemById.brew_rice_vintage.price === 90, 'G5 年份越久越值钱：新青米 15 → 世纪藏 90（明账）');
    ok(W.Brewing.cellarOk('洛水城') && !W.Brewing.cellarOk('荒村'), 'G6 酒家窖坛跟着食肆铺面走');
    // 门槛
    const W0 = buildEnv(0.5, { skills: { 烹饪: 5 } });
    ok(W0.Brewing.brew(0) === false && W0.lastMsg().indexOf('手艺') >= 0, 'G7 烹饪 5 酿不了青米酒（要 10）——糟蹋料的话不说空话');
    const W1 = buildEnv(0.5, { skills: { 烹饪: 15 } });
    ok(W1.Brewing.brew(0) === false && W1.lastMsg().indexOf('缺料') >= 0, 'G8 没材料开不了坛（缺什么报什么）');
    // 坛租付不出 → 料不动
    putSlot(W1, 'mat_spirit_grass', 5); putSlot(W1, 'mat_spirit_spring', 1);
    W1.__rewardFail = true;
    ok(W1.Brewing.brew(0) === false && W1.Brewing.state().jars.length === 0, 'G9 坛租付不出 → 开坛作废');
    ok(W1.inventory.slots.filter((s) => s && s.templateId === 'mat_spirit_grass')[0].count === 5, 'G10 开坛作废材料分毫未动（不吞料）');
    W1.__rewardFail = false;
    // 正路入坛
    ok(W1.Brewing.brew(0) === true, 'G11 青米酒入坛成功');
    ok(W1.hasReward('copper', -30), 'G12 坛租 30 铜走 RewardService 负账正门');
    ok(W1.inventory.slots.every((s) => !s || s.templateId !== 'mat_spirit_grass' || s.count === 0), 'G13 灵草×5 从行囊真扣（uid 槽位账）');
    const jar = W1.Brewing.state().jars[0];
    ok(jar.rid === 'rice' && jar.brewDay === W1.__day && W1.__skills['烹饪'] === 16 && W1.__time === 60, 'G14 坛中账：酒方/入坛日落档、烹饪+1、入坛耗 60 分钟');
    // 三口坛封顶
    W1.__registry.brewing.import({ jars: [{ rid: 'rice', brewDay: 1, city: '洛水城' }, { rid: 'flower', brewDay: 1, city: '洛水城' }, { rid: 'dragon', brewDay: 1, city: '洛水城' }] });
    ok(W1.Brewing.brew(0) === false && W1.lastMsg().indexOf('三口坛全占着') >= 0, 'G15 坛就三口——占着不启就是年份在长（机会成本是实话）');
    // 年份线
    ok(W.Brewing.stageOf(29) === 0 && W.Brewing.stageOf(30) === 1 && W.Brewing.stageOf(89) === 1 && W.Brewing.stageOf(90) === 2 && W.Brewing.stageOf(364) === 2 && W.Brewing.stageOf(365) === 3, 'G16 年份线 30/90/365 逐日验档（边界日归上一档）');
    // 启坛：400 日 → 神工（把日历翻到 500 日，让入坛日 100 落在非负净化线内）
    W.advanceDay(400);
    W.__registry.brewing.import({ jars: [{ rid: 'rice', brewDay: W.__day - 400, city: '洛水城' }] });
    ok(W.Brewing.openJar(0) === true, 'G17 启坛成功');
    ok(W.__giveLog.some((g) => g.id === 'brew_rice_divine' && g.got === 1), 'G18 窖藏 400 日 → 出的是「青米玉液」（神工档），giveWithReceipt 真入袋');
    ok(W.__skills['烹饪'] === 19 && W.Brewing.state().jars.length === 0, 'G19 启坛烹饪+4（按年份档给长进）、坛位腾出');
    // 行囊满 → 折价六成
    const W2 = buildEnv(0.5, { skills: { 烹饪: 15 } });
    W2.__registry.brewing.import({ jars: [{ rid: 'rice', brewDay: W2.__day - 10, city: '洛水城' }] });
    W2.__addFail = true;
    W2.Brewing.openJar(0);
    ok(W2.hasReward('spiritStones', 9) && W2.Brewing.state().jars.length === 0, 'G20 行囊满带不走 → 酒家折价六成（新酒 15×0.6=9 灵石），坛位照样腾出');
    // 龙骨酒坛租走灵石
    const W3 = buildEnv(0.5, { skills: { 烹饪: 50 } });
    putSlot(W3, 'mat_demon_beast_blood', 1); putSlot(W3, 'mat_dragon_grass', 1); putSlot(W3, 'mat_spirit_spring', 2);
    ok(W3.Brewing.brew(2) === true && W3.hasReward('spiritStones', -5), 'G21 龙骨酒坛租 5 灵石（贵酒方的坛也贵）');
    // 落档净化
    W3.__registry.brewing.import({ jars: [{ rid: 'junk' }, { rid: 'rice', brewDay: 'NaN' }, { rid: 'flower', brewDay: 5 }, { rid: 'dragon', brewDay: 6 }, { rid: 'rice', brewDay: 7 }] });
    const bs = W3.Brewing.state();
    ok(bs.jars.length === 3 && bs.jars.every((j) => ['rice', 'flower', 'dragon'].indexOf(j.rid) >= 0), 'G22 brewing 落档净化：野酒方滤掉、三口封顶截断');
    ok(bs.jars[0].brewDay === W3.__day, 'G23 NaN 入坛日按今日归正——不带病算年份');
}

// ============ H. 接线与静态门禁 ============
{
    const SRC = {};
    SRC.crime = load('js/npcs/npc-crime.js');
    SRC.disguise = load('js/npcs/disguise-system.js');
    SRC.kidnap = load('js/npcs/kidnap-system.js');
    SRC.stone = load('js/city-facilities/stone-gamble.js');
    SRC.shop = load('js/city-facilities/player-shop.js');
    SRC.author = load('js/extensions/authoring.js');
    SRC.brew = load('js/crafting/brewing.js');
    SRC.street = load('js/city-facilities/street-life.js');
    SRC.bookshop = load('js/city-facilities/bookshop.js');
    SRC.citizen = load('js/city-facilities/citizen-life.js');
    SRC.app = load('js/app.js');
    SRC.manifest = load('scripts.manifest.json');
    SRC.html = load('仙侠.html');

    // citizen-life faceSeen 接线
    ok(SRC.citizen.indexOf('function addHeat(n, why, opts)') >= 0 && SRC.citizen.indexOf('NpcCrime.addHeat(n, why, opts)') >= 0, 'H1 citizen-life 的 addHeat 包裹透传 opts（旧调用两参不破）');
    ok((SRC.citizen.match(/faceSeen: true/g) || []).length === 2, 'H2 街面两处「脸被看到」的场景都上了 faceSeen（武者未遂街坊看见 / 当街行抢被拿）');
    ok((SRC.crime.match(/faceSeen: true/g) || []).length === 2, 'H3 黑道账两处当场被拿上了 faceSeen（抢劫被拿 / 钱庄敲锣）');

    // app.js 战后分支
    ok(SRC.app.indexOf('currentBattle._isKidnapFight && typeof window.settleKidnapFight') >= 0 && SRC.app.indexOf('window.settleKidnapFight(true)') >= 0 && SRC.app.indexOf('window.settleKidnapFight(false)') >= 0, 'H4 绑架战胜利/战败两路都接进 app.js 战后分支');
    ok(SRC.app.indexOf('currentBattle._isKidnapAmbush && typeof window.settleKidnapAmbush') >= 0 && SRC.app.indexOf('window.settleKidnapAmbush(true)') >= 0 && SRC.app.indexOf('window.settleKidnapAmbush(false)') >= 0, 'H5 赎金局胜利/战败两路都接进 app.js 战后分支');

    // 街面挂载
    ok(SRC.street.indexOf('window.PlayerShop') >= 0 && SRC.street.indexOf('window.StoneGamble') >= 0 && SRC.street.indexOf('window.Brewing') >= 0 && SRC.street.indexOf('window.Disguise') >= 0 && SRC.street.indexOf('window.Kidnap') >= 0, 'H6 市井总门五路新挂载全在（各自账在位才亮）');
    ok(SRC.bookshop.indexOf('window.Authoring.open()') >= 0, 'H7 书肆柜上挂了「借案写书」（守卫接线）');
    ok(SRC.crime.indexOf('window.Kidnap.buildButton') >= 0, 'H8 黑道按钮排里给绑架留了守卫位');

    // 清单对账
    const man = JSON.parse(SRC.manifest);
    // ★2026-10-04 scripts 341 → 351★（B 类·判据过时）。今日实测：清单 351 条 src / HTML 351 枚（tailwind 之外），
//   集合与顺序都相同；tools/refactor/manifest-scripts.py check 当日独立判过「HTML == manifest」。
//   scripts.manifest.json 在禁改清单里 ⇒ 只把硬写的计数归到今读真数，逐字全等照旧。
ok(man.stats.scripts === 351 && man.stats.layerComments === 25, 'H9 清单 351 script / 25 层注释（2026-10-04 由 341 归正到实测 351；层注释仍 25；tools/manifest-scripts.py check 同日判过 HTML == manifest）');
    const srcs = man.entries.filter((e) => e.kind === 'script').map((e) => e.src);
    ok(NEW_FILES.every((f) => srcs.indexOf(f) >= 0), 'H10 六本新账全入清单（不进清单=没测过，v25.5 的教训）');
    const ix = (s) => srcs.indexOf(s);
    ok(ix('js/npcs/npc-crime.js') < ix('js/npcs/disguise-system.js') && ix('js/npcs/disguise-system.js') < ix('js/npcs/kidnap-system.js'), 'H11 易容/绑架两账排在黑道账之后（守卫读取的依赖顺序）');
    ok(ix('js/city-facilities/citizen-life.js') < ix('js/city-facilities/stone-gamble.js') && ix('js/city-facilities/stone-gamble.js') < ix('js/city-facilities/player-shop.js'), 'H12 赌石/掌柜两账排在市井批之后');
    ok(ix('js/crafting/pill-poison.js') < ix('js/crafting/brewing.js'), 'H13 酿酒账排在炼丹批之后（材料账已就位）');
    ok(ix('js/extensions/biography.js') < ix('js/extensions/authoring.js'), 'H14 著书账排在生平账之后（行记本料读得到）');
    ok(ix('js/npcs/npc-crime.js') < ix('js/extensions/player-sect.js'), 'H15 v25.8 K19 的顺序钉照旧（黑道账在扩展层之前）');
    const htmlScripts = (SRC.html.match(/<script defer src="js\//g) || []).length;
    ok(htmlScripts === 352, 'H16 HTML 352 个 js 脚本标签 = 清单 351 + vendor/tailwind.js（2026-10-04 由 342/341 归正到实测 352/351）');
    ok(NEW_FILES.every((f) => SRC.html.indexOf(f) >= 0), 'H17 HTML 里六本新账的标签真在');

    // 棘轮：空 catch / 裸 localStorage / 手写时辰 / 全局唯一 / use strict
    const six = [SRC.disguise, SRC.kidnap, SRC.stone, SRC.shop, SRC.author, SRC.brew];
    const emptyCatch = /catch\s*\([^)]*\)\s*\{\s*\}/;
    ok(six.every((s) => !emptyCatch.test(s)), 'H18 六本新账零空 catch（每个 catch 都有话交代）');
    ok(six.every((s) => s.indexOf('localStorage') < 0), 'H19 六本新账零裸 localStorage（存档全走 StateRegistry 正门，v25.3 A1 口径）');
    const des22 = /60[^0-9][^\n]{0,12}时辰|时辰[^\n]{0,12}60[^0-9]/;
    ok(six.every((s) => !des22.test(s)) && !des22.test(SRC.crime), 'H20 DES-22：新账与改装账无手写时辰换算');
    ok(six.every((s) => s.indexOf("'use strict'") >= 0 && s.indexOf("typeof window === 'undefined'") >= 0), 'H21 六本新账全是 use strict + window 守卫的 IIFE');
    const globals = ['window.Disguise =', 'window.Kidnap =', 'window.StoneGamble =', 'window.PlayerShop =', 'window.Authoring =', 'window.Brewing =',
        'window.settleKidnapFight =', 'window.settleKidnapAmbush =', 'window.openDisguiseAlley =', 'window.executeKidnapNPC =',
        'window.openStoneGamble =', 'window.openPlayerShop =', 'window.openAuthoringDesk =', 'window.openBrewingCellar ='];
    const allNew = six.join('\n');
    let dupes = 0;
    globals.forEach((g) => { const n = allNew.split(g).length - 1; if (n !== 1) dupes++; });
    ok(dupes === 0, 'H22 十四个新全局名各只有一处定义（静态门禁不撞车）');
    const keys = [["register('disguise'", SRC.disguise], ["register('kidnap'", SRC.kidnap], ["register('stoneGamble'", SRC.stone], ["register('playerShop'", SRC.shop], ["register('authoring'", SRC.author], ["register('brewing'", SRC.brew]];
    ok(keys.every(([k, s]) => s.indexOf(k) >= 0), 'H23 六把新 StateRegistry 键各自在位：disguise/kidnap/stoneGamble/playerShop/authoring/brewing');
    ok(SRC.crime.indexOf("register('crimeLedger'") >= 0 && SRC.crime.indexOf('face: 0') >= 0, 'H24 黑道账还是那把 crimeLedger 键——face 档并进旧账不开新键');
    // npc-crime 出口钉
    ok(SRC.crime.indexOf('faceKnown: faceKnown') >= 0 && SRC.crime.indexOf('wantedTier: wantedTier') >= 0 && SRC.crime.indexOf('addBountyOnReport: addBountyOnReport') >= 0, 'H25 NpcCrime 出口新增 faceKnown/wantedTier/addBountyOnReport 三读');
    ok(SRC.crime.indexOf('PATROL_BOOST_BLIND: 5') >= 0 && SRC.crime.indexOf('HUNTER_BLIND_MUL: 0.3') >= 0, 'H26 两档常数明账：特质档盘查+5、猎人率×0.3（不是拍脑袋的暗数）');
    // 赌石 EV 注释钉（明账文化）
    ok(SRC.stone.indexOf('摊主抽水') >= 0 && SRC.stone.indexOf('十石九空') >= 0, 'H27 赌石的庄家优势写在注释与牌面上（赌坊「久赌必输是明账」同款口径）');
    ok(SRC.shop.indexOf('playerShops') >= 0 && SRC.shop.indexOf('空壳') >= 0, 'H28 掌柜账头注释如实交代 enhanced-shop.playerShops 是空壳（旧账不动、新账开门）');
    ok(SRC.author.indexOf('书是账不是物') >= 0, 'H29 著书账口径写明：稿本走账不走物品注册表（不污染 itemById）');
    ok(SRC.brew.indexOf('不覆盖已有') >= 0, 'H30 酿酒账注明物品注册不覆盖已有定义（13-missing-ids 同款纪律）');
}

console.log('\n通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
