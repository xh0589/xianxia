// player-sect-bootstrap-node.js — 白手起家（插旗草创 + 游说招徒 + 虚名债 + 门客 + 户部账）vm 沙箱测试
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

// ---------- A · 接线 ----------
console.log('\n[A] 接线');
const html = fs.readFileSync(path.join(ROOT, '仙侠.html'), 'utf8');
ok(html.includes('js/extensions/player-sect-bootstrap.js'), 'A1 html 挂载白手起家模块');
ok(html.indexOf('player-sect-bootstrap.js') > html.indexOf('player-sect-ui.js'), 'A2 挂载顺序在宗门界面之后（包装钩子才接得上）');
const bootSrc = fs.readFileSync(path.join(ROOT, 'js/extensions/player-sect-bootstrap.js'), 'utf8');
ok(!/冷却|次数上限|配额/.test(bootSrc), 'A3 模块零配额句式');
const uiSrc = fs.readFileSync(path.join(ROOT, 'js/extensions/player-sect-ui.js'), 'utf8');
ok(uiSrc.includes('_psDoFoundCheap') && uiSrc.includes('插旗草创'), 'A4 立宗面板挂草创入口');
ok(!uiSrc.includes('开山立宗要元婴修为'), 'A5 元婴不再是立宗硬门槛');
ok(uiSrc.includes('fame >= 60 ? 100'), 'A6 开山贺礼按名望定（不再白拿）');
const cultSrc = fs.readFileSync(path.join(ROOT, 'js/cultivation/cultivation.js'), 'utf8');
ok(cultSrc.includes('竖旗立宗'), 'A7 修炼面板入口对所有境界开放（低境界显示竖旗立宗）');
ok(!cultSrc.includes("if (_tier >= 4 && _cd.realm !== '飞升'"), 'A8 旧的元婴硬门删净');

// ---------- 沙箱 ----------
const REALM_TIER = { '练气': 1, '筑基': 2, '金丹': 3, '元婴': 4, '化神': 5 };
function makeSandbox(opts) {
    opts = opts || {};
    const npcs = {};
    function mkNpc(id, name, realm, aff, loc, extra) {
        const n = Object.assign({
            id: id, name: name, realm: realm, location: loc, isDead: false,
            combat: { realm: realm },
            relationship: { affection: aff },
            state: { location: loc }
        }, extra || {});
        npcs[id] = n;
        return n;
    }
    mkNpc('n1', '王铁牛', '练气', 30, '洛水城');
    mkNpc('n2', '柳如烟', '练气', 30, '洛水城');
    mkNpc('n3', '赵老客', '筑基', 30, '洛水城');
    mkNpc('n4', '钱眼开', '练气', 0, '洛水城');
    mkNpc('n5', '孙小二', '练气', 10, '洛水城');
    mkNpc('n6', '周游子', '练气', 5, '洛水城');
    mkNpc('n7', '吴七', '练气', 0, '青木城');
    mkNpc('n8', '郑死人', '练气', 50, '洛水城', { isDead: true });
    mkNpc('n9', '冯道侣', '练气', 80, '洛水城', { _companionData: { name: '冯道侣' } });

    const stt = {
        playerStones: opts.playerStones != null ? opts.playerStones : 100,
        modals: [], msgs: [], advanced: 0, logs: []
    };
    const W = {
        WorldCalendar: { day: opts.day || 100 },
        timeSystem: { totalDays: opts.day || 100 },
        currentCharData: { name: '李长风', realm: opts.realm || '练气', fame: opts.fame != null ? opts.fame : 0, spiritStones: 0 },
        discipleState: { isInSect: !!opts.inOtherSect, sectName: opts.inOtherSect ? '少林寺' : null },
        getRealmTier: function (r) { return REALM_TIER[r] || 1; },
        locationSystem: { getCurrentLocation: function () { return opts.city || '洛水城'; } },
        npcManager: {
            getNPC: function (id) { return npcs[id] || null; },
            getAllNPCs: function () { return Object.keys(npcs).map(function (k) { return npcs[k]; }); },
            getNearbyNPCs: function (loc) { return W.npcManager.getAllNPCs().filter(function (n) { return (n.state && n.state.location === loc) || n.location === loc; }); }
        },
        DataManager: {
            getSpiritStones: function () { return stt.playerStones; },
            deductSpiritStones: function (n) { if (stt.playerStones >= n) { stt.playerStones -= n; return true; } return false; },
            addSpiritStones: function (n) { stt.playerStones += n; }
        },
        sectsData: { '少林寺': { name: '少林寺', type: '正道', power: '巨擘', location: '中州' } },
        SECT_INTERNAL: {
            '少林寺': { disciples: 40, resources: 500, influence: 60, weapons: 10, defense: 10, morale: 60, grain: 50, chronicle: [] }
        },
        eventFlags: {},
        gameLog: { add: function (m) { stt.logs.push(String(m)); } },
        showMessage: function (m) { stt.msgs.push(String(m)); },
        showModal: function (t, b) { stt.modals.push({ title: t, body: b }); },
        advanceTime: function (mins) { stt.advanced += (mins || 0); },
        StateRegistry: { register: function () {} },
        EventBus: {
            _h: {},
            on: function (ev, fn) { (this._h[ev] = this._h[ev] || []).push(fn); },
            emit: function (ev, p) { (this._h[ev] || []).forEach(function (f) { try { f(p); } catch (e) {} }); }
        }
    };
    W.window = W;
    const sandbox = { window: W, console: { log: function () {} }, Math: Math, Number: Number, String: String, JSON: JSON, Object: Object, Array: Array, Date: Date, document: { getElementById: function () { return null; } } };
    vm.createContext(sandbox);
    function load(f) { vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sandbox); }
    load('js/extensions/player-sect.js');
    load('js/extensions/player-sect-bootstrap.js');
    if (opts.standing) load('js/sects/sect-standing.js');
    // tick(day)：把日历拨到该日并过一天账（day 为三十的倍数时触发月结）
    function tick(day) { W.WorldCalendar.day = day; W.timeSystem.totalDays = day; return W.PlayerSect.tickDay(); }
    return { W: W, stt: stt, npcs: npcs, tick: tick };
}
function withRandom(v, fn) { const o = Math.random; Math.random = function () { return typeof v === 'function' ? v() : v; }; try { return fn(); } finally { Math.random = o; } }

// ---------- B · 插旗草创（开局就能立派） ----------
console.log('\n[B] 插旗草创');
{
    const env = makeSandbox({ playerStones: 100, realm: '练气', fame: 0, standing: true });
    const r = env.W.PSBoot.foundCheap('青旗门', '中立');
    ok(r.ok, 'B1 练气期白手起家——插旗即立宗（无境界门槛）');
    eq(env.stt.playerStones, 70, 'B2 幡布香烛登记费三十灵石真扣（玩家腰包）');
    const sect = r.sect;
    eq(env.W.PSBoot.stageOf(sect), 0, 'B3 草创档：无片瓦');
    eq(sect.resources.spiritStones, 0, 'B4 库房是空的（不再白送一百）');
    eq(sect.resources.reputation, 0, 'B5 名声也是空的');
    ok(env.W.sectsData['青旗门'] && env.W.SECT_INTERNAL['青旗门'], 'B6 立宗即入户部账（座次与立场都认它了）');
    eq(env.W.sectPowerNow('青旗门').tier, '名存实亡', 'B7 一人一幡，江湖座次从最底下爬起');
    eq(env.W.sectAlignNow('青旗门').tier, '亦正亦邪', 'B8 立场按出身定底色（中立）');
    env.W.PSBoot.cheapFoundingDay(sect);
    eq(sect.resources.spiritStones, 0, 'B9 无名之辈立幡：没人送礼（凭空来钱已废）');
    ok((env.W.eventFlags['qi_street'] || []).some(t => t.text.includes('新幡')), 'B10 街谈只当看了个热闹');
    ok(env.stt.modals.some(m => m.title.includes('立幡当日')), 'B11 立幡当日有一场戏');
    // 拒绝口径
    eq(env.W.PSBoot.foundCheap('再来一个', '中立').reason, 'has-sect', 'B12 一人只竖一面幡');
    const env2 = makeSandbox({ inOtherSect: true });
    eq(env2.W.PSBoot.foundCheap('二心门', '中立').reason, 'in-other-sect', 'B13 身在别家门下，先出师再说');
    const env3 = makeSandbox({ playerStones: 10 });
    eq(env3.W.PSBoot.foundCheap('穷门', '中立').reason, 'no-stones', 'B14 三十灵石都凑不齐，立不了幡');
    const env4 = makeSandbox({});
    eq(env4.W.PSBoot.foundCheap('少林寺', '正道').reason, 'name-taken', 'B15 名号撞了现有山门，不给立');
    // 高名望立幡：旧识薄礼
    const env5 = makeSandbox({ fame: 70 });
    const r5 = env5.W.PSBoot.foundCheap('名士门', '中立');
    env5.W.PSBoot.cheapFoundingDay(r5.sect);
    eq(r5.sect.resources.spiritStones, 10, 'B16 名望高，立幡当日有旧识送薄礼（+10，随脸面来）');
    // 草创零产出（凭空生产已废）
    const env6 = makeSandbox({});
    const s6 = env6.W.PSBoot.foundCheap('苦修门', '中立').sect;
    env6.tick(101);
    eq(s6.resources.spiritStones, 0, 'B17 草创分文不产');
    eq(s6.resources.elixir, 0, 'B18 没工坊没丹药');
    eq(s6.resources.weapon, 0, 'B19 没匠人没兵器');
    eq(s6.resources.reputation, 0, 'B20 名声也不会自己长');
}

// ---------- C · 建筑成长（赁屋 → 山门） ----------
console.log('\n[C] 建筑成长');
{
    const env = makeSandbox({ playerStones: 500 });
    const sect = env.W.PSBoot.foundCheap('起家门', '中立').sect;
    const up = env.W.PSBoot.upgradeHouse();
    ok(up.ok, 'C1 赁屋立门脸');
    eq(env.stt.playerStones, 500 - 30 - 200, 'C2 赁屋二百灵石自掏');
    eq(env.W.PSBoot.stageOf(sect), 1, 'C3 升到赁屋档');
    ok(sect.location.includes('赁屋'), 'C4 赁屋挂在城名下（门脸有地址）');
    env.tick(101);
    eq(sect.resources.spiritStones, 1, 'C5 赁屋打零工：每日灵石一（有来路的进项）');
    env.tick(102);
    eq(sect.resources.spiritStones, 2, 'C6 逐日累计');
    eq(sect.resources.elixir, 0, 'C7 赁屋也没丹药工坊');
    // 赁屋门槛：草创才可赁，已赁不重复收钱
    eq(env.W.PSBoot.upgradeHouse().reason, 'not-cheap', 'C8 已经赁了屋，不重复收钱');
    // 择山门即升格（包装 chooseSite，旧流程照走）
    const site = env.W.PlayerSect.FOUND_SITES[0];
    const cr = env.W.PlayerSect.chooseSite(sect.id, site.id);
    ok(cr.ok, 'C9 挣下家底可补择山门');
    eq(env.W.PSBoot.stageOf(sect), 2, 'C10 择山门即升到山门档');
    eq(sect.location, site.name, 'C11 山门地址入账');
    // 山门档：有人做工才有丹药兵器（能量守恒）
    sect.resources.spiritStones = 0; sect.resources.elixir = 0; sect.resources.weapon = 0;
    env.tick(103);
    eq(sect.resources.elixir, 0, 'C12 山门没人做工：丹药不出（守恒）');
    eq(sect.resources.weapon, 0, 'C13 兵器同理');
    withRandom(0.01, function () { env.W.PSBoot.doRecruit('n1', 'ideal'); });
    eq(sect.disciples.length, 1, 'C14 山门有了第一个做工的人');
    sect.resources.elixir = 0; sect.resources.weapon = 0;
    env.tick(104);
    eq(sect.resources.elixir, 1.3, 'C15 有人则丹药照原口径出（内政加成后一点三）');
    eq(sect.resources.weapon, 1, 'C16 兵器同理');
    // 旧档兼容
    eq(env.W.PSBoot.stageOf({ terrain: '山' }), 2, 'C17 旧档有山门按山门算');
    eq(env.W.PSBoot.stageOf({}), 1, 'C18 旧档没择址按赁屋宽待');
}

// ---------- D · 游说招徒（四种话术） ----------
console.log('\n[D] 游说招徒');
{
    const env = makeSandbox({ playerStones: 200, fame: 0 });
    const sect = env.W.PSBoot.foundCheap('游说门', '中立').sect;
    const cands = env.W.PSBoot.recruitCandidates();
    ok(cands.length > 0 && cands.length <= 8, 'D1 候选名单有人（至多八位）');
    ok(!cands.some(c => c.id === 'n8'), 'D2 死人不列');
    ok(!cands.some(c => c.id === 'n9'), 'D3 道侣不拿来当门徒');
    ok(!cands.some(c => c.id === 'n7'), 'D4 外城的人不列（上门游说要走得到）');
    ok(cands.some(c => c.id === 'n4'), 'D5 素不相识的人也能游说（旧「好感门槛」死路已拆）');
    const willWang = cands.filter(c => c.id === 'n1')[0].will;
    const willZhao = cands.filter(c => c.id === 'n3')[0].will;
    ok(willZhao < willWang - 20, 'D6 筑基客看练气掌门：自认高你一等（意愿大减）');
    eq(env.W.PSBoot.willWord(willZhao), '自认高你一等', 'D7 意愿档位有话可显示');
    // 吹牛：成功率最高，但记虚名债
    const rb = withRandom(0.1, function () { return env.W.PSBoot.doRecruit('n4', 'bluff'); });
    ok(rb.ok, 'D8 吹牛最容易说动（草创班子加四成五）');
    eq(sect.disciples[0].source, 'bluff', 'D9 名册记下他是被吹来的');
    const lie = env.W.PSBoot.lieStatus(sect);
    ok(lie && lie.tier === 2 && lie.text.includes('三千'), 'D10 草创吹的是大话（弟子三千山门百里）');
    ok(sect.history.some(h => h.text.includes('说大了')), 'D11 吹出去的牛记入宗门史（债有据可查）');
    ok(env.stt.advanced >= 60, 'D12 登门游说真耗时辰');
    eq(env.npcs['n4'].relationship.affection, 5, 'D13 肯跟你走，总有了几分情分（好感+5）');
    // 许好处：见面礼真扣
    const before = env.stt.playerStones;
    const rp = withRandom(0.1, function () { return env.W.PSBoot.doRecruit('n5', 'pay'); });
    ok(rp.ok, 'D14 许好处（三十灵石见面礼）说动');
    eq(before - env.stt.playerStones, 30, 'D15 见面礼真从腰包出');
    // 钱不够不许空口许好处，也不占当日工夫
    const env2 = makeSandbox({ playerStones: 30 });
    const s2 = env2.W.PSBoot.foundCheap('缺钱门', '中立').sect;
    const rp2 = env2.W.PSBoot.doRecruit('n1', 'pay');
    eq(rp2.reason, 'no-stones', 'D16 掏不出见面礼，许不了好处');
    eq((s2._drive && s2._drive.n) || 0, 0, 'D17 没成的游说不占当日工夫');
    // 亮实底：草创班子家底寒碜，加成是负的
    const rs = withRandom(0.55, function () { return env.W.PSBoot.doRecruit('n6', 'show'); });
    eq(rs.reason, 'refused', 'D18 草创时亮实底等于自曝其短（意愿被压到谷底，被婉拒）');
    // 失败的三档嘴脸
    const env3 = makeSandbox({ playerStones: 200, fame: 0 });
    const s3 = env3.W.PSBoot.foundCheap('碰壁门', '中立').sect;
    s3.resources.reputation = 10;
    const rf = withRandom(0.995, function () { return env3.W.PSBoot.doRecruit('n1', 'ideal'); });
    eq(rf.reason, 'rumor', 'D19 没名望又被拒：当街传笑柄');
    eq(s3.resources.reputation, 8, 'D20 笑柄折声望（-2）');
    ok((env3.W.eventFlags['qi_street'] || []).some(t => t.text.includes('啐')), 'D21 街坊真传开了');
    const env4 = makeSandbox({ playerStones: 200, fame: 30 });
    env4.W.PSBoot.foundCheap('体面门', '中立');
    const rf2 = withRandom(0.995, function () { return env4.W.PSBoot.doRecruit('n1', 'ideal'); });
    eq(rf2.reason, 'refused', 'D22 有名望的人被拒，也就是被婉拒（不传笑柄）');
    // 每日游说有尽头（次日再来，不用计数器字眼）
    const env5 = makeSandbox({ playerStones: 500, fame: 30 });
    env5.W.PSBoot.foundCheap('磨破门', '中立');
    let cap = null;
    withRandom(0.995, function () {
        ['n1', 'n2', 'n3', 'n4', 'n5', 'n6'].forEach(function (id) {
            const r = env5.W.PSBoot.doRecruit(id, 'ideal');
            if (r.reason === 'day-cap') cap = r;
        });
    });
    ok(cap && cap.text.includes('明日再来'), 'D23 一天说破嘴也就五六家，明日再来');
}

// ---------- E · 虚名债（吹出去的牛，月月等着兑现） ----------
console.log('\n[E] 虚名债');
{
    const env = makeSandbox({ playerStones: 300, fame: 0 });
    const sect = env.W.PSBoot.foundCheap('大话门', '中立').sect;
    withRandom(0.01, function () { env.W.PSBoot.doRecruit('n1', 'bluff'); });
    let lie = env.W.PSBoot.lieStatus(sect);
    ok(lie && !lie.made, 'E1 虚名债在账（规模没兑上）');
    withRandom(0.9, function () { env.W.PSBoot.bluffMonthCheck(sect); });
    ok(env.W.PSBoot.lieStatus(sect), 'E2 多数月份没穿帮，债还背着');
    const repBefore = sect.resources.reputation;
    withRandom(0.1, function () { env.W.PSBoot.bluffMonthCheck(sect); });
    ok(!env.W.PSBoot.lieStatus(sect), 'E3 穿帮后这笔债清了（变成笑柄）');
    eq(sect.resources.reputation, Math.max(0, repBefore - 8), 'E4 声望扫地（-8）');
    ok((env.W.eventFlags['qi_street'] || []).some(t => t.text.includes('笑柄')), 'E5 茶棚传笑柄');
    ok(sect._bluffExposed, 'E6 穿帮记档：往后再吹更易被戳穿');
    eq(sect.disciples.filter(d => d.source === 'bluff').length, 0, 'E7 被哄来的弟子连夜走了（四成去意，随机全走）');
    ok(sect.history.some(h => h.text.includes('连夜收拾包袱')), 'E8 走人的事记入宗门史');
    ok((env.W.SECT_INTERNAL['大话门'].chronicle || []).some(c => c.text.includes('穿帮')), 'E9 穿帮也进户部编年（江湖记得住）');
    withRandom(0.01, function () { env.W.PSBoot.doRecruit('n5', 'bluff'); });
    ok(env.W.PSBoot.lieStatus(sect), 'E10 伤疤未愈还能再吹（债重新记上）');
    withRandom(0.35, function () { env.W.PSBoot.bluffMonthCheck(sect); });
    ok(!env.W.PSBoot.lieStatus(sect), 'E11 被戳穿过的人再吹，四成概率穿帮（0.35 中）');
    // 虚名做实
    const env2 = makeSandbox({ playerStones: 300 });
    const s2 = env2.W.PSBoot.foundCheap('圆梦门', '中立').sect;
    s2.lieDebt = { tier: 1, day: 100 };
    for (let i = 0; i < 10; i++) s2.disciples.push({ npcId: 'fake' + i, joinedDay: 100, position: '弟子', source: 'bluff' });
    const rep2 = s2.resources.reputation;
    env2.W.PSBoot.bluffMonthCheck(s2);
    ok(!env2.W.PSBoot.lieStatus(s2), 'E12 规模追上，债清');
    eq(s2.resources.reputation, rep2 + 5, 'E13 虚名做实反涨声望（+5）');
    ok((env2.W.eventFlags['qi_street'] || []).some(t => t.text.includes('做到了')), 'E14 街谈反传佳话：说到做到');
    ok(s2.disciples.length === 10, 'E15 做实不赶人（被吹来的也留下了）');
}

// ---------- F · 门客与俸银 ----------
console.log('\n[F] 门客与俸银');
{
    const env = makeSandbox({ playerStones: 300 });
    const sect = env.W.PSBoot.foundCheap('雇工门', '中立').sect;
    const r = withRandom(0.01, function () { return env.W.PSBoot.hireRetainer('n4'); });
    ok(r.ok, 'F1 聘门客（不入族谱名分）');
    eq(sect.guests.length, 1, 'F2 门客入账');
    eq(sect.guests[0].salary, 5, 'F3 月俸五灵石');
    eq(env.W.PSBoot.hireRetainer('n4').reason, 'already', 'F4 一人不雇两回');
    env.W.PSBoot.upgradeHouse();
    sect.resources.spiritStones = 0;
    env.tick(101);
    eq(sect.resources.spiritStones, 1.5, 'F5 赁屋进项一 + 门客帮工半枚（有来路）');
    // 月俸真扣宗库
    sect.resources.spiritStones = 100;
    env.W.PlayerSect.recruitDisciple(sect.id, 'n1');
    env.W.PlayerSect.recruitDisciple(sect.id, 'n2');
    env.tick(150); // 月结日：日进一点五，月俸 = 弟子二×二 + 门客五 = 九
    eq(sect.resources.spiritStones, 92.5, 'F6 月俸真扣宗库（弟子二、门客五）');
    ok(sect.history.some(h => h.text.includes('月俸')), 'F7 发俸记入宗门史');
    // 欠俸：门客当场散，弟子看情况走
    sect.resources.spiritStones = 0;
    withRandom(0.99, function () { env.tick(180); });
    eq(sect.guests.length, 0, 'F8 俸银发不出，门客当场散');
    eq(sect.disciples.length, 2, 'F9 情分深的弟子还能熬一熬（去意两成五，没中）');
    ok((env.W.eventFlags['qi_street'] || []).some(t => t.text.includes('俸银')), 'F10 欠俸传上街');
    // 去意中了：人真走
    const env2 = makeSandbox({ playerStones: 300 });
    const s2 = env2.W.PSBoot.foundCheap('散伙门', '中立').sect;
    withRandom(0.01, function () { env2.W.PSBoot.hireRetainer('n4'); });
    env2.W.PlayerSect.recruitDisciple(s2.id, 'n1');
    s2.resources.spiritStones = 0;
    withRandom(0.1, function () { env2.tick(150); });
    eq(s2.disciples.length, 0, 'F11 欠俸又熬不住的，夜里就走了');
    eq(s2.guests.length, 0, 'F12 门客散尽');
    // 辞门客
    const env3 = makeSandbox({ playerStones: 300 });
    const s3 = env3.W.PSBoot.foundCheap('辞客门', '中立').sect;
    withRandom(0.01, function () { env3.W.PSBoot.hireRetainer('n4'); });
    ok(env3.W.PSBoot.fireRetainer('n4'), 'F13 辞门客结清俸银');
    eq(s3.guests.length, 0, 'F14 人走账清');
    ok(s3.history.some(h => h.text.includes('好聚好散')), 'F15 辞聘记入宗门史');
}

// ---------- G · 名望投奔与户部对账 ----------
console.log('\n[G] 投奔与对账');
{
    const env = makeSandbox({ playerStones: 400, fame: 20 });
    const sect = env.W.PSBoot.foundCheap('聚人门', '中立').sect;
    env.W.PSBoot.upgradeHouse();
    sect.resources.reputation = 20; // 名声 = 20×2 + 20×0.5 + 赁屋10 = 60
    ok(env.W.PSBoot.sectFame(sect) >= 40, 'G1 门面名声过线');
    withRandom(0.01, function () { env.tick(150); });
    ok(sect.disciples.some(d => d.source === 'fame'), 'G2 有人慕名上门投奔（名望换来的人）');
    ok(sect.history.some(h => h.text.includes('慕名')), 'G3 投奔记入宗门史');
    eq(env.W.SECT_INTERNAL['聚人门'].disciples, sect.disciples.length, 'G4 户部人数=真实名册');
    eq(env.W.SECT_INTERNAL['聚人门'].resources, Math.round(sect.resources.spiritStones), 'G5 户部库房=宗库真银');
    // 草创没人主动来（没门脸，名望再高也白搭）
    const env2 = makeSandbox({ playerStones: 400, fame: 90 });
    const s2 = env2.W.PSBoot.foundCheap('冷落门', '中立').sect;
    s2.resources.reputation = 50;
    withRandom(0.01, function () { env2.tick(150); });
    eq(s2.disciples.length, 0, 'G6 没门脸，没人主动投（现实逻辑）');
    // 外界劫掠真转嫁回宗库（守恒）
    sect.resources.spiritStones = 100;
    withRandom(0.99, function () { env.tick(210); }); // 日进一，月俸扣二，户部对账后库房九十九
    eq(env.W.SECT_INTERNAL['聚人门'].resources, 99, 'G7 月结对账：户部账与宗库对齐');
    env.W.SECT_INTERNAL['聚人门'].resources = 59; // 模拟 AI 战争劫掠了户部账四十
    withRandom(0.99, function () { env.tick(240); });
    eq(sect.resources.spiritStones, 58, 'G8 劫掠亏空转嫁回宗库（99+1日进-2月俸-40亏空）');
    ok(sect.history.some(h => h.text.includes('劫掠')), 'G9 遭劫记入宗门史');
    // 进项（香火护持之类）也真入账
    env.W.SECT_INTERNAL['聚人门'].resources = 83; // 外界给户部账添了二十五
    withRandom(0.99, function () { env.tick(270); });
    eq(sect.resources.spiritStones, 82, 'G10 外界进项真入宗库（58+1-2+25）');
    ok(sect.history.some(h => h.text.includes('进项')), 'G11 进项有名目');
}

// ---------- H · 面板与探针 ----------
console.log('\n[H] 面板与探针');
{
    const env = makeSandbox({ playerStones: 300, standing: true });
    const sect = env.W.PSBoot.foundCheap('面板门', '邪派').sect;
    const block = env.W.PSBoot.panelBlock(sect);
    ok(block.includes('白手起家') && block.includes('赁屋立门脸'), 'H1 总册插块：草创时给赁屋入口');
    ok(block.includes('游说招徒') && block.includes('门客'), 'H2 插块挂游说与门客入口');
    ok(!block.includes('说过大话'), 'H3 没吹过牛，不显示警示');
    withRandom(0.01, function () { env.W.PSBoot.doRecruit('n1', 'bluff'); });
    ok(env.W.PSBoot.panelBlock(sect).includes('说过大话'), 'H4 背着虚名债，面板月月提醒');
    const pr = env.W.sectBootstrapProbe();
    ok(pr && pr.name === '面板门' && pr.stage === 0 && pr.registered && pr.internal, 'H5 探针可查（阶段/户部注册）');
    ok(pr.lieDebt && pr.lieDebt.tier === 2, 'H6 探针读得到虚名债');
    eq(env.W.sectAlignNow('面板门').align, -60, 'H7 邪派出身立场底色（动态立场接管）');
}

// ---------- I · 第九波 · 总账检修 ----------
console.log('\n[I] 第九波 · 总账检修');
{
    // 时钟根治：六模块 + 自建宗门两件的钟全部优先真钟（生产里 totalDays / WorldCalendar.day 根本不存在）
    const srcOf = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
    ['js/sects/sect-doom.js', 'js/sects/sect-cities.js', 'js/sects/sect-diplomacy-world.js',
     'js/sects/sect-standing.js', 'js/sects/sect-roster.js', 'js/sects/sect-gala.js',
     'js/extensions/player-sect.js', 'js/extensions/player-sect-bootstrap.js'].forEach(function (f) {
        ok(srcOf(f).includes('getAbsoluteDay'), 'I1 时钟优先真钟：' + path.basename(f));
    });
    // 玩家宗门保护罩：AI 不代管、不代办、不代打
    ok(srcOf('js/sects/sect-diplomacy-world.js').includes('!isPSect(s)'), 'I2 AI 配对池绕开玩家自建宗门');
    ok(srcOf('js/sects/sect-gala.js').includes('isPSect(sect)'), 'I3 AI 不代玩家宗门办盛会花库银');
    ok(srcOf('js/sects/sect-doom.js').includes('isPSect(sect)'), 'I4 灭门扫描先跳过玩家自建宗门（复兴线未接，不留永死局）');
    ok(srcOf('js/sects/sect-cities.js').includes('isPSect(sec)'), 'I5 AI 争城不拉玩家自建宗门当打手');
    ok(srcOf('js/sects/sect-governance.js').includes('PSBoot.isPlayerSect') && srcOf('js/sects/sect-internal.js').includes('PSBoot.isPlayerSect'), 'I6 治理日结与经济日结都不再动玩家宗门的户部镜像');
    // 战争线三修
    const warSrc = srcOf('js/sects/sect-war.js');
    ok(warSrc.includes('other === sect.name'), 'I7 外交落座不再跟自己开一行');
    ok(warSrc.includes('sectIsRuined(other)'), 'I8 灭了的门派不再来袭山');
    ok(warSrc.includes('itSpoil.resources'), 'I9 攻山战利品真从对方库房搬（守恒）');
    // 征讨假账根治
    const sysSrc = srcOf('js/sects/sects-system.js');
    ok(sysSrc.includes('_myIt') && sysSrc.includes('_tIt.resources = _avail - spoils'), 'I10 征讨战力读真账、缴获扣对方真库');
    // 养老双重计数根治
    ok(!srcOf('js/sects/sect-roster.js').includes('Math.floor(absDay() / 360)'), 'I11 年龄不再双重计数（弟子三十岁就"花甲养老"已修）');
    // 文案清扫
    ok(!srcOf('js/sects/sect-specialties.js').includes('功能冷却中'), 'I12 冷却口吻清零');
    ok(!sysSrc.includes('NPC不存在') && !sysSrc.includes('需 modal 支持') && !sysSrc.includes('今日可接任务已满'), 'I13 外文字母与配额句式清零（宗门总管）');
    ok(!srcOf('js/sects/sects-deep-ui.js').includes('今日可完成：'), 'I14 差事页配额句式清零');
    ok(sysSrc.includes('招收门徒'), 'I15 投票落地播报改说人话');
    // 势力显示两屏统一
    ok(srcOf('js/app.js').includes('sectPowerNow') && srcOf('js/location-system.js').includes('sectPowerNow'), 'I16 势力显示优先江湖座次（不再静态动态两本账）');

    // 行为：真钟优先 + 游说日限跨日重置（旧钟恒零时，招满五人即永久锁死——生产最致命的活扣）
    const env = makeSandbox({ playerStones: 300, fame: 30 });
    env.W.PSBoot.foundCheap('检修门', '中立');
    env.W.getAbsoluteDay = function () { return 45; };
    let last = null;
    withRandom(0.995, function () {
        for (let i = 0; i < 6; i++) last = env.W.PSBoot.doRecruit('n1', 'ideal');
    });
    eq(last.reason, 'day-cap', 'I17 一日说破嘴，第六家吃闭门羹');
    env.W.getAbsoluteDay = function () { return 46; };
    let next = null;
    withRandom(0.995, function () { next = env.W.PSBoot.doRecruit('n1', 'ideal'); });
    eq(next.reason, 'refused', 'I18 换了日子重新开口（日限随真钟重置，不再永久锁死）');
    delete env.W.getAbsoluteDay;

    // 行为：立宗即记对账基线——首月户部账累积不再被整月清空
    const env2 = makeSandbox({ playerStones: 300 });
    const s2 = env2.W.PSBoot.foundCheap('基线门', '中立').sect;
    eq(s2._lastMirror, 0, 'I19 对账基线立宗当日就记下');
    env2.W.SECT_INTERNAL['基线门'].resources = 25; // 立宗首月外界给户部账添了二十五
    withRandom(0.99, function () { env2.tick(150); });
    eq(s2.resources.spiritStones, 25, 'I20 首月进项真入宗库（旧码首月直接清零）');
    ok(s2.history.some(h => h.text.includes('进项')), 'I21 首月进项也有名目');

    // 行为：殁录清册——死人不再挂名册领俸
    const env3 = makeSandbox({ playerStones: 300 });
    const s3 = env3.W.PSBoot.foundCheap('清册门', '中立').sect;
    withRandom(0.01, function () { env3.W.PSBoot.doRecruit('n1', 'ideal'); });
    withRandom(0.01, function () { env3.W.PSBoot.doRecruit('n2', 'ideal'); });
    withRandom(0.01, function () { env3.W.PSBoot.hireRetainer('n4'); });
    eq(s3.disciples[0].name, '王铁牛', 'I22 名册刻名（身故后殁录不至于只剩「一名修士」）');
    eq(s3.guests[0].name, '钱眼开', 'I23 客册同样刻名');
    s3.resources.spiritStones = 100;
    env3.W.discipleState._myDisciples = ['n1', 'ghost-x'];
    env3.npcs['n1'].isDead = true;       // 王铁牛身故
    delete env3.npcs['n2'];              // 柳如烟从世上除名（查无此人）
    env3.npcs['n4'].isDead = true;       // 门客钱眼开也身故
    withRandom(0.99, function () { env3.tick(150); });
    eq(s3.disciples.length, 0, 'I24 死人与查无此人者当月除名（不再领俸）');
    eq(s3.guests.length, 0, 'I25 幽灵门客同样清册');
    eq(s3.resources.spiritStones, 100, 'I26 除名当月，俸银分文不发（人都不在了）');
    ok(s3.history.some(h => h.text.includes('王铁牛') && h.text.includes('故去')), 'I27 弟子身故记入宗门史（具名致哀）');
    ok(s3.history.some(h => h.text.includes('钱眼开') && h.text.includes('客卿')), 'I28 门客身故记入客册除名');
    ok(env3.W.discipleState._myDisciples.indexOf('ghost-x') < 0, 'I29 亲传名分里的幽灵也清了');
    eq(s3.resources.disciples, 0, 'I30 人数账随名册对齐');

    // 行为：认得出「这是玩家自建宗门」
    ok(env3.W.PSBoot.isPlayerSect('清册门'), 'I31 自家宗门认得');
    ok(!env3.W.PSBoot.isPlayerSect('少林寺'), 'I32 别家山门不误认');
}

// ---------- J · 第九波 · 明面翻新 ----------
console.log('\n[J] 第九波 · 明面翻新');
{
    const uiSrc2 = fs.readFileSync(path.join(ROOT, 'js/extensions/player-sect-ui.js'), 'utf8');
    ok(uiSrc2.includes('getAbsoluteDay'), 'J1 总册「立派第 N 天」改走真钟（此前永远第 1 天）');
    ok(!uiSrc2.includes('confirm('), 'J2 浏览器原生确认框退役');
    ok(uiSrc2.includes('_psDissolveAsk') && uiSrc2.includes('再想想'), 'J3 解散宗门改游戏内弹窗');
    ok(uiSrc2.includes('window._psOpenDrive(); return;'), 'J4 两个打架的招弟子入口合成一个');
    ok(uiSrc2.includes('grid-cols-3 sm:grid-cols-5'), 'J5 资源条窄屏自动换行');
    ok(uiSrc2.includes('进山演阵') && !uiSrc2.includes('护宗战'), 'J6 演武入口文案与按钮一致（不再「妖兽攻山时」干等）');
    ok(uiSrc2.includes('立派第') && uiSrc2.includes('_fmtN'), 'J7 宗门史与头部统一时间口径、数字不再表格长尾');
    ok(!uiSrc2.includes('📖') && !uiSrc2.includes('🎓') && !uiSrc2.includes('🏛') && !uiSrc2.includes('➕') && !uiSrc2.includes('✅') && !uiSrc2.includes('🌐') && !uiSrc2.includes('🎬') && !uiSrc2.includes('🎉') && !uiSrc2.includes('🧑'), 'J8 图标收敛（只留 🏯🚩⚔️ 三处关键）');
    ok(uiSrc2.includes('修到元婴') && !uiSrc2.includes('cursor-not-allowed'), 'J9 低境界立宗面板不再满屏灰卡');
    const psSrc = fs.readFileSync(path.join(ROOT, 'js/extensions/player-sect.js'), 'utf8');
    ok(!psSrc.includes('×1.5') && !psSrc.includes('+30%'), 'J10 政策卡表格话改人话');
    const bootSrc2 = fs.readFileSync(path.join(ROOT, 'js/extensions/player-sect-bootstrap.js'), 'utf8');
    ok(bootSrc2.includes('故人'), 'J11 游说名单给旧识标「故人」');
    ok(bootSrc2.includes('border-l-4') && bootSrc2.includes('ring-red-500'), 'J12 候选人按意愿分色带、吹牛红边示警');
    ok(!bootSrc2.includes('🏠') && !bootSrc2.includes('🗣') && !bootSrc2.includes('🤝') && !bootSrc2.includes('🧑'), 'J13 白手起家栏图标同收敛');
    // 行为：故人标记真进名单
    const env = makeSandbox({ playerStones: 300 });
    env.W.PSBoot.foundCheap('明面门', '中立');
    const cands = env.W.PSBoot.recruitCandidates();
    ok(cands.some(c => c.old === true) && cands.some(c => !c.old), 'J14 故人与生人名单上分得开（好感三十的算故人，寡淡的不算）');
}

// ---------- K · 第三十五波 · 立宗入桶入册（山门上图的地基） ----------
console.log('\n[K] 第三十五波 · 立宗入桶入册');
{
    const env = makeSandbox({ playerStones: 300 });
    env.W.sectsByRegion = { '中州': ['少林寺'], '东荒': [] };
    env.W.sectPositions = {};
    env.W.PSBoot.foundCheap('青旗门', '中立');   // 洛水城 → 中州
    ok(env.W.sectsByRegion['中州'].indexOf('青旗门') >= 0, 'K1 立宗进了分域宗门桶（旧账只写名录不入桶，各域清单看不见自家）');
    ok(env.W.sectsByRegion['东荒'].length === 0, 'K2 没落错域（洛水城在中州）');
    const pos = env.W.sectPositions['青旗门'];
    ok(pos && pos.x >= 60 && pos.x < 740 && pos.y >= 40 && pos.y < 480, 'K3 世界图坐标落在画幅内');
    // 幂等：再注册不双份、坐标不挪
    const x0 = pos.x, y0 = pos.y;
    env.W.PSBoot.registerInWorld({ name: '青旗门', location: '洛水城', resources: { spiritStones: 0 } });
    eq(env.W.sectsByRegion['中州'].filter(n => n === '青旗门').length, 1, 'K4 重复注册不双份');
    eq(env.W.sectPositions['青旗门'].x, x0, 'K5 重复注册坐标不挪（按名哈希）');
    // 同名永远同点：换个沙箱重算，坐标一致
    const env2 = makeSandbox({ playerStones: 300 });
    env2.W.sectsByRegion = { '中州': [] };
    env2.W.sectPositions = {};
    env2.W.PSBoot.foundCheap('青旗门', '中立');
    eq(env2.W.sectPositions['青旗门'].x, x0, 'K6 同名异档同点（读档不跳位置）');
    eq(env2.W.sectPositions['青旗门'].y, y0, 'K7 纵坐标同样稳定');
}

console.log('\n========== player-sect-bootstrap: ' + pass + ' 通过, ' + fail + ' 失败 ==========');
process.exit(fail ? 1 : 0);
