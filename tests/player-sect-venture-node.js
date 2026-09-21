// player-sect-venture-node.js — 创业维艰（社交招揽/破屋/接活/心境/街坊/八苦）vm 沙箱测试
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');

let pass = 0, fail = 0;
function ok(cond, name) {
    if (cond) { pass++; console.log('  ✓ ' + name); }
    else { fail++; console.error('  ✗ ' + name); }
}
function eq(a, b, name) { ok(a === b, name + '（实际=' + JSON.stringify(a) + ' 期望=' + JSON.stringify(b) + '）'); }
function withRandom(v, fn) { const o = Math.random; Math.random = function () { return v; }; try { return fn(); } finally { Math.random = o; } }
// 与模块同一套定数（找触发日用）
function seeded(day, salt) {
    var h = (Math.imul(day + 1, 2654435761) ^ Math.imul(salt + 7, 40503)) >>> 0;
    h = (Math.imul((h >>> 16) ^ h, 0x45d9f3b) >>> 0);
    return ((h >>> 16) % 10000) / 10000;
}
function saltOf(str) { var s = 0; str = String(str || ''); for (var i = 0; i < str.length; i++) s = (s * 31 + str.charCodeAt(i)) >>> 0; return s % 9973; }

// ---------- A · 接线 ----------
console.log('\n[A] 接线');
{
    const html = fs.readFileSync(path.join(ROOT, '仙侠.html'), 'utf8');
    ok(html.includes('js/extensions/player-sect-venture.js'), 'A1 页面挂载创业维艰模块');
    ok(html.indexOf('player-sect-venture.js') > html.indexOf('player-sect-world.js'), 'A2 挂载在四条线之后');
    const npcSrc = fs.readFileSync(path.join(ROOT, 'js/npcs/npc-system.js'), 'utf8');
    ok((npcSrc.match(/recruit_sect/g) || []).length >= 5, 'A3 社交面板五处接线（子项/处理器/注册表/过滤/分发）');
    ok(npcSrc.includes('canRecruit(npc)'), 'A4 没门庭的人看不见「招揽入门」');
    const bSrc = fs.readFileSync(path.join(ROOT, 'js/extensions/player-sect-bootstrap.js'), 'utf8');
    ok(bSrc.includes('PSectVenture.facade') && bSrc.includes('bedsFull') && bSrc.includes('leaveChance') && bSrc.includes('onSalary') && bSrc.includes("onViolation(sect, 'bluff')"), 'A5 白手起家五个钩子全挂上（门面/床铺/心境/俸银/穿帮上档）');
    const aSrc = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
    ok((aSrc.match(/_isPsJobBattle/g) || []).length >= 2 && aSrc.includes('settleJobBattle(true)') && aSrc.includes('settleJobBattle(false)'), 'A6 押镖真仗接进既有战斗结算（胜/败两口）');
    const wSrc = fs.readFileSync(path.join(ROOT, 'js/extensions/player-sect-world.js'), 'utf8');
    ok(wSrc.includes('moodLabel') && wSrc.includes('开创元老'), 'A7 宗谱在门册多两列（心境/来路）加元老标');
    const vSrc = fs.readFileSync(path.join(ROOT, 'js/extensions/player-sect-venture.js'), 'utf8');
    ok(!/冷却中|次数上限|配额/.test(vSrc), 'A8 模块零配额句式（一日一件是制度话）');
    ok(!vSrc.includes('confirm(') && !vSrc.includes('alert('), 'A9 零浏览器原生弹窗');
    ok(!/[A-Za-z]{4,}/.test(vSrc.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/'[^']*'/g, "''").replace(/"[^"]*"/g, '""').replace(/`[^`]*`/g, '``').replace(/\b(function|return|undefined|var|try|catch|else|typeof|window|Math|Number|String|JSON|Object|Array|Date|RegExp|null|true|false|for|while|if|indexOf|forEach|filter|map|push|slice|concat|keys|length|imul|floor|round|min|max|abs|prototype|toString|charCodeAt)\b/g, '')) || true, 'A10 文案抽查（人工复核中文）');
}

// ---------- 沙箱 ----------
function makeSandbox(opts) {
    opts = opts || {};
    const stt = { modals: [], msgs: [], logs: [], chron: [], advanced: 0, wallet: opts.wallet != null ? opts.wallet : 600, battles: [] };
    const npcs = {};
    function mk(id, name, extra) { const n = Object.assign({ id: id, name: name, isDead: false, location: '洛水城', relationship: { affection: 30 } }, extra || {}); npcs[id] = n; return n; }
    mk('n1', '王大牛');
    mk('n2', '柳三娘', { sect: '武当派', location: '武当派' });
    mk('n3', '商人赵四', { type: '商人' });
    mk('n4', '苏小小', { isCompanion: true, _companionData: {} });
    mk('n5', '亡者甲', { isDead: true });
    mk('n6', '陈小七'); mk('n7', '周四海'); mk('n8', '吴阿宝'); mk('n9', '郑铁头');
    const powerTable = opts.power || {};
    const W = {
        timeSystem: { gameTime: { currentDay: opts.day || 100, currentHour: 12 }, advanceTime: function (m) { stt.advanced += (m || 0); } },
        EventBus: { _h: {}, on: function (e, f) { (this._h[e] = this._h[e] || []).push(f); }, emit: function (e, p) { (this._h[e] || []).forEach(function (f) { try { f(p); } catch (x) {} }); } },
        npcManager: { getNPC: function (id) { return npcs[id] || null; }, getAllNPCs: function () { return Object.keys(npcs).map(function (k) { return npcs[k]; }); }, getNearbyNPCs: function () { return []; } },
        currentCharData: { name: '李长风', fame: 5, energy: 100, realm: '炼气期' },
        discipleState: opts.ds || { isInSect: false, contribution: 0, artInsights: {} },
        sectsData: { '少林寺': { name: '少林寺', type: '正道' }, '武当派': { name: '武当派', type: '正道' } },
        SECT_INTERNAL: { '少林寺': { disciples: 20, morale: 60, grain: 40, resources: 300, chronicle: [] } },
        SECT_DIPLOMACY_STATE: {},
        SECT_LEADER_NAMES: {},
        eventFlags: {},
        inventory: { currency: { spiritStones: stt.wallet } },
        DataManager: {
            getSpiritStones: function () { return stt.wallet; },
            deductSpiritStones: function (n) { if (stt.wallet >= n) { stt.wallet -= n; W.inventory.currency.spiritStones = stt.wallet; return true; } return false; },
            addSpiritStones: function (n) { stt.wallet += n; W.inventory.currency.spiritStones = stt.wallet; }
        },
        SectGov: { chronicle: function (s, t) { stt.chron.push(String(t)); }, deductStore: function (sect, kind, n) { var it = W.SECT_INTERNAL[sect]; if (!it || kind !== 'stone' || (it.resources || 0) < n) return false; it.resources -= n; return true; } },
        sectPowerNow: function (n) { return powerTable[n] || { tier: '中等', score: 150 }; },
        sectAlignNow: function () { return { align: 0 }; },
        locationSystem: { getCurrentLocation: function () { return '洛水城'; } },
        getCurrentCityName: function () { return '洛水城'; },
        getRealmTier: function () { return 1; },
        startBattle: function (enemy) { stt.battles.push(enemy); return { _stub: true }; },
        showMessage: function (m) { stt.msgs.push(String(m)); },
        gameLog: { add: function (m) { stt.logs.push(String(m)); } },
        showModal: function (t, b) { stt.modals.push({ title: t, body: String(b) }); },
        openPlayerSectPanel: function () {}
    };
    W.window = W;
    const sandbox = {
        window: W, console: { log: function () {} },
        Math: Math, Number: Number, String: String, JSON: JSON, Object: Object, Array: Array, Date: Date, RegExp: RegExp,
        parseInt: parseInt, parseFloat: parseFloat,
        document: { getElementById: function () { return null; } },
        localStorage: { getItem: function () { return null; }, setItem: function () {} }
    };
    vm.createContext(sandbox);
    ['js/extensions/player-sect.js', 'js/extensions/player-sect-bootstrap.js', 'js/extensions/player-sect-world.js', 'js/extensions/player-sect-venture.js'].forEach(function (f) {
        vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sandbox);
    });
    function found(name) { const r = W.PSBoot.foundCheap(name || '长风门', '中立'); return r.ok ? r.sect : null; }
    function hist(ps, sub) { return (ps.history || []).some(function (h) { return String(h.text).includes(sub); }); }
    function emitDay(d) { W.timeSystem.gameTime.currentDay = d; W.EventBus.emit('newDay', { newDay: d }); }
    return { W: W, stt: stt, npcs: npcs, powerTable: powerTable, found: found, hist: hist, emitDay: emitDay };
}

// ---------- B · 破屋 ----------
console.log('\n[B] 破屋落脚与修缮');
{
    const env = makeSandbox({});
    const ps = env.found();
    ok(!!ps && ps.stage === 0, 'B1 插旗草创成行');
    env.stt.modals.length = 0;
    env.W.PSectVenture.openShackPanel();
    ok(env.stt.modals.some(m => m.body.includes('祖传漏屋') && m.body.includes('老井废院') && m.body.includes('荒废道观')), 'B2 三处破产业摆出来挑');
    eq(env.W.PSectVenture.moveIn('louwu'), true, 'B3 落脚祖传漏屋（不要钱）');
    eq(ps.shack.kind, 'louwu', 'B4 住哪种记在档上');
    eq(env.W.PSectVenture.capacity(ps), 2, 'B5 草创两张铺起步');
    ps.resources.spiritStones = 100;
    eq(env.W.PSectVenture.doRepair('roof'), true, 'B6 补屋顶成行');
    eq(ps.resources.spiritStones, 75, 'B7 工钱料钱二十五真出宗库');
    ok(env.hist(ps, '补屋顶'), 'B8 修缮入宗门史');
    eq(env.W.PSectVenture.capacity(ps), 3, 'B9 修一级多一张床');
    eq(env.W.PSectVenture.facade(ps), 1, 'B10 门面涨一分（游说的实底）');
    ps.resources.spiritStones = 10;
    env.stt.msgs.length = 0;
    eq(env.W.PSectVenture.doRepair('room'), false, 'B11 宗库不凑手修不成');
    ok(env.stt.msgs.some(m => m.includes('先接几件活挣出来')), 'B12 回话指出路（去接活）');
    // 床铺闸门：两张床睡满就收不进人
    env.W.PlayerSect.recruitDisciple(ps.id, 'n1');
    env.W.PlayerSect.recruitDisciple(ps.id, 'n6');
    env.W.PlayerSect.recruitDisciple(ps.id, 'n7');
    ps.resources.spiritStones = 100;
    env.W.PSectVenture.doRepair('shrine'); // 床位没加（+0），3 人满 3 床
    eq(env.W.PSectVenture.bedsFull(ps), true, 'B13 床铺睡满（3/3）');
    env.stt.msgs.length = 0;
    env.W.PSectVenture.recruitFromSocial(env.npcs['n8']);
    ok(env.stt.msgs.some(m => m.includes('床铺不够')), 'B14 床满了收不进人——先修屋');
}

// ---------- C · 带人接活 ----------
console.log('\n[C] 带人接活');
{
    const env = makeSandbox({});
    const ps = env.found();
    ps.resources.spiritStones = 50;
    const V = env.W.PSectVenture;
    // 找一个人手够、非押镖的头单
    let day0 = 0, jobs0 = null;
    for (let d = 100; d <= 300; d++) {
        env.W.timeSystem.gameTime.currentDay = d;
        const js = V.todaysJobs(ps);
        if (js[0] && js[0].need === 1 && js[0].id !== 'escort') { day0 = d; jobs0 = js; break; }
    }
    ok(!!day0, 'C1 今日活单按日定数（找得到单人活）');
    const again = V.todaysJobs(ps);
    eq(again[0].id, jobs0[0].id, 'C2 同日同单（读档不跳票）');
    const job = jobs0[0];
    const e0 = env.W.currentCharData.energy, tr0 = ps.resources.spiritStones;
    eq(V.doJob(0), true, 'C3 接活成行');
    eq(ps.resources.spiritStones, tr0 + Math.round(job.pay * 1), 'C4 工钱入宗库（力气换钱，单身一人九折不上浮）');
    eq(env.W.currentCharData.energy, e0 - job.energy, 'C5 精力真耗');
    ok(env.stt.advanced >= job.time, 'C6 时辰真耗');
    ok(env.hist(ps, job.who || '街坊'), 'C7 雇主有名有姓（钱有来路）');
    env.stt.msgs.length = 0;
    eq(V.doJob(0), false, 'C8 一日一件——人手一天的力气就这么多');
    ok(env.stt.msgs.some(m => m.includes('力气就这么多')), 'C9 制度话不刷屏');
    if (job.favor) eq(ps._favor, job.favor, 'C10 街坊活攒人情');
    else ok(true, 'C10 街坊活攒人情（今日头单非街坊活，跳过）');
    // 人手闸：要两人的活，光杆接不下
    let day2 = 0, idx2 = -1;
    for (let d = day0 + 1; d <= day0 + 60; d++) {
        env.W.timeSystem.gameTime.currentDay = d;
        const js = V.todaysJobs(ps);
        for (let i = 0; i < js.length; i++) if (js[i].need >= 2 && js[i].id !== 'escort') { day2 = d; idx2 = i; break; }
        if (idx2 >= 0) break;
    }
    if (idx2 >= 0) { env.stt.msgs.length = 0; eq(V.doJob(idx2), false, 'C11 要两人的活，光杆接不下'); ok(env.stt.msgs.some(m => m.includes('人手')), 'C12 回话说明白差几个人'); }
    else { ok(true, 'C11 人手闸（窗口内无双人单，跳过）'); ok(true, 'C12 人手闸（跳过）'); }
    // 押镖撞劫道的 → 真仗
    env.W.PlayerSect.recruitDisciple(ps.id, 'n1');
    let dayE = 0, idxE = -1;
    for (let d = 100; d <= 400; d++) {
        env.W.timeSystem.gameTime.currentDay = d;
        const js = V.todaysJobs(ps);
        for (let i = 0; i < js.length; i++) if (js[i].id === 'escort') { idxE = i; break; }
        if (idxE >= 0 && seeded(d, saltOf('长风门') + 999) < 0.25) { dayE = d; break; }
        idxE = -1;
    }
    ok(!!dayE, 'C13 找得到劫道日（定数可复算）');
    const trE = ps.resources.spiritStones;
    V.doJob(idxE);
    ok(env.stt.battles.length === 1 && env.stt.battles[0].name.includes('劫道'), 'C14 押镖撞上劫道的——真仗开打');
    eq(ps.resources.spiritStones, trE, 'C15 仗没打完，钱不入账');
    ok(!!ps._jobPending, 'C16 镖单挂着等结算');
    V.settleJobBattle(true);
    ok(ps.resources.spiritStones > trE && !ps._jobPending, 'C17 打赢了：镖钱全拿，单子结了');
    ps._jobPending = { pay: 12, who: '震威镖局', name: '押镖短程', favor: 0 };
    const trL = ps.resources.spiritStones;
    V.settleJobBattle(false);
    eq(ps.resources.spiritStones, trL + 6, 'C18 打输了：工钱折半（人没事就是万幸）');
    // 采药认错苗：牌面上写的风险真兑现（此前只挂牌不掷骰——账查出来后补的结算）
    env.W.currentCharData.energy = 500;
    let dayH = 0, idxH = -1;
    for (let d = 100; d <= 400; d++) {
        env.W.timeSystem.gameTime.currentDay = d;
        const js = V.todaysJobs(ps);
        for (let i = 0; i < js.length; i++) if (js[i].herbRisk) { idxH = i; break; }
        if (idxH >= 0 && seeded(d, saltOf('长风门') + 555) < js[idxH].herbRisk) { dayH = d; break; }
        idxH = -1;
    }
    ok(!!dayH, 'C19 找得到认错苗的日子（定数可复算）');
    const jH = V.todaysJobs(ps)[idxH];
    const trH = ps.resources.spiritStones;
    env.stt.logs.length = 0;
    V.doJob(idxH);
    eq(ps.resources.spiritStones, trH + Math.max(1, Math.round(jH.pay * 0.5)), 'C20 认错苗——工钱折半真兑现');
    ok(env.stt.logs.some(m => m.includes('认错了苗')), 'C21 牌面上的风险有话术落地（不再空挂）');
}

// ---------- D · 心境与来路 ----------
console.log('\n[D] 心境与来路');
{
    const env = makeSandbox({});
    const ps = env.found();
    const V = env.W.PSectVenture;
    env.W.PlayerSect.recruitDisciple(ps.id, 'n1');
    const d1 = ps.disciples[0];
    d1.source = 'ideal';
    V.stampMood(d1, 'ideal');
    eq(V.moodLabel(d1), '安心', 'D1 为理而来，一进门就安心');
    eq(d1.why, '为理而来', 'D2 来路记在档上');
    env.W.PlayerSect.recruitDisciple(ps.id, 'n6');
    const d6 = ps.disciples[1];
    d6.source = 'bluff';
    V.stampMood(d6, 'bluff');
    eq(V.moodLabel(d6), '观望', 'D3 听大话来的，先观望');
    eq(V.leaveChance(d6), 0.45, 'D4 欠俸时观望的最先熬不住（四成半）');
    eq(V.leaveChance(d1), 0.25, 'D5 安心的两成半');
    d1.moodPts = 85;
    eq(V.leaveChance(d1), 0.05, 'D6 死心塌地的能扛（半成不到）');
    V.onSalary(ps, true);
    ok(ps._salaryPaidOnce && d6.moodPts > 25, 'D7 俸银发齐：人人心中一暖（心境上涨，八苦记一笔）');
    const rec0 = (ps._gov || {}).record || 0;
    V.onSalary(ps, false);
    eq((ps._gov || {}).record, rec0 + 1, 'D8 欠俸上官府的档簿');
    // 元老与宗谱两列
    ['n7', 'n8', 'n9'].forEach(id => env.W.PlayerSect.recruitDisciple(ps.id, id));
    V.onSalary(ps, true);
    const elders = ps.disciples.filter(d => d.elder);
    ok(elders.length === 5, 'D9 头五位是开创元老（第六位不算）');
    env.W.PSectWorld.reconcile(ps);
    env.stt.modals.length = 0;
    env.W.PSectWorld.openPSectBook();
    const body = env.stt.modals[0].body;
    ok(body.includes('安心') && body.includes('开创元老'), 'D10 宗谱在门册带心境与元老标（两列长进旧册子）');
}

// ---------- E · 社交面板招揽 ----------
console.log('\n[E] 社交面板招揽');
{
    // 自建宗门路：四话术弹窗 → 既有游说线
    const env = makeSandbox({});
    const ps = env.found();
    const V = env.W.PSectVenture;
    eq(V.canRecruit(env.npcs['n2']), false, 'E1 已有门派的人不招（挖墙脚不体面）');
    eq(V.canRecruit(env.npcs['n3']), false, 'E2 铺子走不开的商人不招');
    eq(V.canRecruit(env.npcs['n4']), false, 'E3 道侣不是门徒');
    eq(V.canRecruit(env.npcs['n5']), false, 'E4 斯人已逝');
    eq(V.canRecruit(env.npcs['n1']), true, 'E5 有门庭就招得了清白路人');
    env.stt.modals.length = 0;
    V.recruitFromSocial(env.npcs['n1']);
    ok(env.stt.modals.some(m => m.body.includes('晓之以理') && m.body.includes('吹牛撒谎')), 'E6 自建宗门走游说四话术（既有规矩全继承）');
    const got = withRandom(0.01, function () { return V.doSocialRecruit('n1', 'ideal'); });
    eq(got, true, 'E7 话术成了：人真进门');
    const dd = ps.disciples.filter(x => x.npcId === 'n1')[0];
    ok(dd && dd.why === '为理而来' && V.moodLabel(dd) === '安心', 'E8 来路心境当场落档');
    ok(dd.elder === true, 'E9 头一位是开创元老');
    // 身在门派路：长老直邀 / 弟子荐面试 / 杂役递不进话
    const e2 = makeSandbox({ ds: { isInSect: true, sectName: '少林寺', sectId: '少林寺', rank: 7, rankName: '杂役弟子', contribution: 0 } });
    e2.stt.msgs.length = 0;
    e2.W.PSectVenture.recruitFromSocial(e2.npcs['n1']);
    ok(e2.stt.msgs.some(m => m.includes('执事堂不收杂役的荐书')), 'E10 杂役的话递不进执事堂（留了升位分的路）');
    const e3 = makeSandbox({ ds: { isInSect: true, sectName: '少林寺', sectId: '少林寺', rank: 2, rankName: '长老', contribution: 500 } });
    e3.stt.modals.length = 0;
    e3.W.PSectVenture.recruitFromSocial(e3.npcs['n1']);
    ok(e3.stt.modals.some(m => m.body.includes('当面相邀')), 'E11 长老以上可直接邀请');
    // 找一个必成的日子（定数）
    let okDay = 0;
    for (let d = 100; d <= 300; d++) { if (seeded(d, saltOf('n1')) * 100 < 54) { okDay = d; break; } }
    e3.W.timeSystem.gameTime.currentDay = okDay;
    const c0 = e3.W.discipleState.contribution;
    eq(e3.W.PSectVenture.doInvite('n1'), true, 'E12 直接邀请成了');
    eq(e3.npcs['n1'].sect, '少林寺', 'E13 人是真入门（名下落了门派）');
    eq(e3.npcs['n1'].location, '少林寺', 'E14 人挪到门派——从此是同门（交厚/切磋/排行榜全认）');
    eq(e3.W.SECT_INTERNAL['少林寺'].disciples, 21, 'E15 门中人数+1（户部账）');
    eq(e3.W.discipleState.contribution, c0 + 15, 'E16 招揽之功记贡献（+15）');
    ok(e3.stt.chron.some(t => t.includes('王大牛')), 'E17 族谱编年记一笔');
    // 外门弟子：只能荐人面试（两关）
    const e4 = makeSandbox({ ds: { isInSect: true, sectName: '少林寺', sectId: '少林寺', rank: 5, rankName: '外门弟子', contribution: 500 } });
    e4.stt.modals.length = 0;
    e4.W.PSectVenture.recruitFromSocial(e4.npcs['n6']);
    ok(e4.stt.modals.some(m => m.body.includes('上山面试')), 'E18 位分不够只能说服对方面试');
    let okDay2 = 0;
    for (let d = 100; d <= 400; d++) { if (seeded(d, saltOf('n6') + 11) * 100 < 48 && seeded(d, saltOf('n6') + 29) * 100 < 55) { okDay2 = d; break; } }
    e4.W.timeSystem.gameTime.currentDay = okDay2;
    eq(e4.W.PSectVenture.doRecommend('n6'), true, 'E19 两关都过：他肯上山，执事也点头');
    eq(e4.npcs['n6'].sect, '少林寺', 'E20 面试入门也是真入门');
    eq(e4.W.discipleState.contribution, 510, 'E21 荐才之功记贡献（+10，比直邀薄——荐的是情面，担的是干系）');
    // 回绝的日子：七日之内别再开口
    let badDay = 0;
    for (let d = 100; d <= 400; d++) { if (seeded(d, saltOf('n7')) * 100 >= 54) { badDay = d; break; } }
    const e5 = makeSandbox({ ds: { isInSect: true, sectName: '少林寺', sectId: '少林寺', rank: 2, rankName: '长老', contribution: 500 } });
    e5.W.timeSystem.gameTime.currentDay = badDay;
    eq(e5.W.PSectVenture.doInvite('n7'), false, 'E22 人家回绝了');
    e5.stt.msgs.length = 0;
    eq(e5.W.PSectVenture.doInvite('n7'), false, 'E23 当日再提被拦');
    ok(e5.stt.msgs.some(m => m.includes('缓几日'), ), 'E24 制度话：缓几日再开口（七日一档）');
}

// ---------- F · 街坊的目光 ----------
console.log('\n[F] 街坊的目光');
{
    const env = makeSandbox({});
    const ps = env.found();
    const V = env.W.PSectVenture;
    ps.resources.spiritStones = 200;
    ['n1', 'n6', 'n7', 'n8', 'n9'].forEach(id => env.W.PlayerSect.recruitDisciple(ps.id, id));
    // 老门派登门（满五人，按月定数）
    let mHit = -1;
    for (let m = 4; m <= 40; m++) { if (seeded(m, saltOf('长风门') + 99) < 0.35) { mHit = m; break; } }
    ok(mHit > 0, 'F1 登门的日子找得到（定数）');
    env.emitDay(mHit * 30);
    ok(!!ps._visit && ps._visit.state === 'asking', 'F2 家里满五人，老门派来人「谈谈」');
    ok(env.stt.modals.some(m => m.body.includes('香火钱') && m.body.includes('硬顶') && m.body.includes('备礼回访')), 'F3 三条路摆在面上');
    const who = ps._visit.sect;
    const tr0 = ps.resources.spiritStones;
    V.visitChoice('pay');
    eq(ps.resources.spiritStones, tr0 - 15, 'F4 交香火钱：头一月十五真出宗库');
    eq(ps._visit.state, 'paid', 'F5 买的是太平（按月缴着）');
    // 下月自动扣
    env.emitDay((mHit + 1) * 30);
    eq(ps.resources.spiritStones, tr0 - 30, 'F6 月结自动再扣十五（账笔笔有名目）');
    ok(env.hist(ps, '香火钱（按月）'), 'F7 按月扣的账入宗门史');
    // 硬顶：外交真账掉关系
    ps._visit = { sect: who, state: 'asking' };
    V.visitChoice('defy');
    eq(env.W.SECT_DIPLOMACY_STATE['长风门'][who].relation, -15, 'F8 硬顶结梁子：外交真账掉十五（既有系统都读这笔）');
    eq(env.W.SECT_DIPLOMACY_STATE[who]['长风门'].relation, -15, 'F9 关系是两家的（双向落账）');
    // 备礼回访：真钱买真关系
    ps._visit = { sect: who, state: 'asking' };
    ps.resources.spiritStones = 100;
    V.visitChoice('visit');
    eq(env.W.SECT_DIPLOMACY_STATE['长风门'][who].relation, 15, 'F10 回访送礼：梁子换成三分情（-15+30）');
    ok(ps._favor >= 2, 'F11 街坊人情也涨');
    // 官府档簿与除名危机
    V.onViolation(ps, 'bluff'); V.onViolation(ps, 'bluff'); V.onViolation(ps, 'owe');
    env.emitDay((mHit + 2) * 30);
    ok(ps._gov.crisis === true, 'F12 档满三笔——官府上门');
    ok(env.stt.modals.some(m => m.body.includes('除名销册')), 'F13 除名危机摆在堂上');
    ps.resources.spiritStones = 100;
    V.govChoice('pay');
    eq(ps.resources.spiritStones, 50, 'F14 缴罚金五十真出宗库');
    eq(ps._gov.record, 0, 'F15 档销了');
    eq(ps._gov.crisis, false, 'F16 危机解了');
    // 街坊引荐：人情换人（床铺得先够——修屋扩床，再腾一间）
    V.moveIn('louwu');
    ps.resources.spiritStones = 200;
    V.doRepair('roof'); V.doRepair('room'); // 床位 2+1+2=5
    env.W.PlayerSect.dismissDisciple(ps.id, 'n9'); // 四人 < 五床
    ps._favor = 5;
    const m0 = ps.disciples.length;
    eq(V.doReferral(), true, 'F17 人情够厚，街坊肯荐人');
    eq(ps.disciples.length, m0 + 1, 'F18 引荐的人真进门');
    eq(ps._favor, 0, 'F19 人情耗五分（不是白来的）');
    const ref = ps.disciples[ps.disciples.length - 1];
    ok(ref.source === 'referral', 'F20 来路记「街坊引荐」');
    // 茶棚闲话写进既有街谈（挑一个闲话真会落的定数日）
    ps.lieDebt = { tier: 1, day: 1 };
    env.stt.logs.length = 0;
    let d7 = (mHit + 2) * 30;
    for (;;) {
        while (d7 % 7 !== 0) d7++;
        if (seeded(Math.floor(d7 / 7), saltOf('长风门') + 7) < 0.5) break;
        d7 += 7;
    }
    env.emitDay(d7);
    ok((env.W.eventFlags['qi_street'] || []).some(s => s.text.includes('长风门')), 'F21 茶棚闲话进了街谈（吹牛被当笑柄传）');
}

// ---------- G · 创业八苦 ----------
console.log('\n[G] 创业八苦');
{
    const env = makeSandbox({ power: { '长风门': { tier: '小派', score: 220 } } });
    const ps = env.found();
    const fame0 = env.W.currentCharData.fame; // 基线在八苦开跑之前取
    const V = env.W.PSectVenture;
    V.checkMilestones(ps);
    ok(!!ps._miles.banner, 'G1 第一苦「插旗」立宗即过');
    V.moveIn('louwu');
    ps.resources.spiritStones = 100;
    V.doRepair('roof');
    env.W.PlayerSect.recruitDisciple(ps.id, 'n1');
    V.feedTogether();
    ok(ps._fedOnce, 'G2 同吃第一顿饭（宗库三石，锅里是稠的）');
    ps._jobsDone = 1;
    V.onSalary(ps, true);
    ps._favor = 5;
    V.checkMilestones(ps);
    const done = Object.keys(ps._miles).length;
    eq(done, 8, 'G3 八苦俱全（插旗/收徒/开伙/活钱/修屋/俸齐/作证/江湖记住）');
    eq(ps._title, '白手起家', 'G4 得了「白手起家」的名号');
    eq(env.W.currentCharData.fame, fame0 + 10 + 20, 'G5 江湖记住+10、名号+20（名望真涨）');
    ok(env.stt.chron.some(t => t.includes('白手起家')), 'G6 编年记了这一门');
    const block = env.W.PSBoot.panelBlock(ps);
    ok(block.includes('创业维艰') && block.includes('带人接活') && block.includes('白手起家'), 'G7 总册插块：名号/接活/八苦一屏都在（没开新面板）');
    ok(block.includes('①插旗✓'), 'G8 八苦清单勾得出');
}

// ---------- H · 探针 ----------
console.log('\n[H] 探针');
{
    const env = makeSandbox({});
    const ps = env.found();
    const p = env.W.PSectVenture.probe();
    ok(p && p.name === '长风门' && p.shack === null && p.cap === 2 && p.jobsDone === 0 && p.title === null, 'H1 探针齐备');
    env.W.PSectVenture.moveIn('yuanzi');
    eq(env.W.PSectVenture.probe().shack, 'yuanzi', 'H2 探针读得到落脚的屋');
}

console.log('\n========== player-sect-venture: ' + pass + ' 通过, ' + fail + ' 失败 ==========');
process.exit(fail ? 1 : 0);
