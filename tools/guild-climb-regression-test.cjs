// ==================== v27.1 营生扩展批 · 商会夺权线回归测试 ====================
// 覆盖：入会（会费/同月不重复缴）→ 代售攒贡献 → 月会日过档（执事/话事人，条件不足不抬）→
//       会钱自动支/欠两月除名折半 → 另立商会（城望/本钱门槛、招牌、城望+2、传闻）→
//       会首月初分红/佣金五档表/贡献冻结 → 读档归一化 → 牌面明账。
// 运行：node tools/guild-climb-regression-test.cjs
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
let pass = 0, fail = 0;
function ok(name, cond, extra) {
    if (cond) { pass++; console.log('  ✅ ' + name); }
    else { fail++; console.log('  ❌ ' + name + (extra ? ' · ' + extra : '')); }
}

// ---------- 宽容桩 ----------
let DAY = 100;            // monthIdx = floor(DAY/30) = 3
let STONES = 5000;
let REP = 0;
const messages = [];
const deedLog = [];
const repLog = [];
const reg = {};
const newDaySubs = [];
let PROMPT_ANSWER = '山字招牌';

const sandbox = {
    console: { log() {}, warn() {}, error() {} },
    Math, Date, JSON, Object, Array, String, Number, Boolean, Set, Map, isFinite, parseInt, parseFloat
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
sandbox.document = { readyState: 'complete', getElementById: () => null, createElement: () => ({ style: {}, classList: { add() {}, remove() {} } }), documentElement: { style: {} }, addEventListener: () => {}, body: { appendChild() {} } };
sandbox.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
sandbox.prompt = () => PROMPT_ANSWER;
sandbox.showMessage = (m, t) => messages.push({ m: String(m), t });
sandbox.gameLog = { add() {} };
sandbox.updateCurrencyUI = () => {};
sandbox.getAbsoluteDay = () => DAY;
sandbox.currentCharData = { location: '甲城', spiritStones: 5000, realm: '炼气', notoriety: 0 };
sandbox.getCurrentCityName = () => '甲城';
sandbox.getReputationValue = () => REP;
sandbox.addReputation = (ct, n) => repLog.push({ ct, n });
sandbox.playerPushDeed = (kind, text) => deedLog.push({ kind, text: String(text) });
sandbox.XianXia = { DataManager: {
    getSpiritStones: () => STONES,
    addSpiritStones: n => { STONES += n; },
    deductSpiritStones: n => { if (STONES < n) return false; STONES -= n; return true; },
    getCopper: () => 500, addCopper() {}, deductCopper: () => true, setCopper() {}
} };
sandbox.DataManager = sandbox.XianXia.DataManager;
sandbox.StateRegistry = { register: (name, mod) => { reg[name] = mod; } };
sandbox.timeSystem = { onNewDaySubscribe: fn => newDaySubs.push(fn), advanceTime: () => {}, getAbsoluteDay: () => DAY };

const context = vm.createContext(sandbox);
function run(rel) { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), context, { filename: rel }); }

console.log('== v27.1 商会夺权线回归 ==');
run('js/city-facilities/guild-climb.js');
const GC = sandbox.GuildClimb;
ok('StateRegistry 正门挂上（guildClimb）', !!reg['guildClimb']);
ok('月会日订阅挂上', newDaySubs.length === 1);

// ---------- 1. 白身与入会 ----------
ok('白身佣金一成半（rate 0.85）', GC.sellRate() === 0.85 && GC.commissionPct() === 15);
ok('白身攒不了贡献', GC.noteSale(500) === 0);
const stonesBak = STONES; STONES = 30;
ok('会费不足入不了会', GC.join() === false && STONES === 30);
STONES = stonesBak;
const stonesPreJoin = STONES;
ok('入会成功：会费50一次付清', GC.join() === true && STONES === stonesPreJoin - 50);
const s = GC.state();
ok('会员账带入门戳（joinDay/月戳当月，同月不重复缴会钱）', s.stage === 'member' && s.joinDay === 100 && s.monthSettled === 3 && s.contribution === 0);
ok('会员佣金一成二（rate 0.88）', GC.sellRate() === 0.88 && GC.commissionPct() === 12);
ok('已入会再入被拦', GC.join() === false);

// ---------- 2. 代售攒贡献 ----------
ok('代售落袋255灵石→贡献+25（每10灵石1点）', GC.noteSale(255) === 25 && s.contribution === 25);
ok('小单不足10灵石不记点', GC.noteSale(9) === 0 && s.contribution === 25);

// ---------- 3. 月会日：会钱 + 过档 ----------
DAY = 130;   // monthIdx 4；入会满30日、但贡献25<100
const stonesPreDues = STONES;
GC.monthly();
ok('翻月自动支会钱10灵石', STONES === stonesPreDues - 10 && s.duesArrears === 0);
ok('贡献不足不过档（照旧会员）', s.stage === 'member');
ok('同一月内不重复开月会', GC.monthly() === null && STONES === stonesPreDues - 10);
s.contribution = 100;
DAY = 160;   // monthIdx 5
let r = GC.monthly();
ok('满30日+贡献100→月会抬执事', s.stage === 'steward' && s.stageDay === 160 && r && r.promoted === 'steward');
ok('执事佣金一成（rate 0.90）', GC.sellRate() === 0.90 && GC.commissionPct() === 10);
s.contribution = 400;
DAY = 220;   // monthIdx 7；执事满60日（220-160）
r = GC.monthly();
ok('满60日+贡献400→月会抬话事人', s.stage === 'speaker' && r && r.promoted === 'speaker');
ok('话事人佣金八厘（rate 0.92）', GC.sellRate() === 0.92 && GC.commissionPct() === 8);

// ---------- 4. 会钱欠两月除名（贡献折半） ----------
s.stage = 'member'; s.duesArrears = 0; s.contribution = 80;
STONES = 5;
DAY = 250;   // monthIdx 8
GC.monthly();
ok('会钱支不上：记欠一月、人还在会里', s.stage === 'member' && s.duesArrears === 1);
DAY = 280;   // monthIdx 9
r = GC.monthly();
ok('欠满两月：除名打回白身、贡献折半', s.stage === 'none' && s.contribution === 40 && r && r.expelled === true && GC.sellRate() === 0.85);
STONES = 5000;

// ---------- 5. 另立自己的商会 ----------
GC.join();
s.stage = 'speaker'; s.contribution = 400;
REP = 10;
ok('城望不足30另立被拦', GC.found() === false && s.stage === 'speaker');
REP = 30;
const stonesPreFound = STONES; STONES = 500;
ok('开埠本钱不足另立被拦', GC.found() === false && s.stage === 'speaker');
STONES = stonesPreFound;
repLog.length = 0; deedLog.length = 0;
PROMPT_ANSWER = '  云帆商会  ';
ok('话事人+城望30+800灵石→另立成功', GC.found() === true && STONES === stonesPreFound - 800);
ok('招牌自己起（去空格、账上写死）', s.guildName === '云帆商会' && s.foundedDay === DAY);
ok('开埠那日城望+2、街面传为佳话', repLog.some(x => x.n === 2) && deedLog.some(d => d.kind === 'good'));
ok('会首佣金五厘（rate 0.95）', GC.sellRate() === 0.95 && GC.commissionPct() === 5);
ok('会首的货走自家柜台，老会贡献不再记', GC.noteSale(1000) === 0);
ok('到顶之后没有下一档', GC.nextGoal() === null);

// ---------- 6. 会首月初分红（明账：80×城望系数） ----------
DAY = 300;   // monthIdx 10
const stonesPreDiv = STONES;
const divExpect = Math.round(80 * (1 + REP / 400));
r = GC.monthly();
ok('月初分红 ' + divExpect + ' 灵石入袋、会钱一文不缴', r && r.dividend === divExpect && STONES === stonesPreDiv + divExpect);
REP = 430;
DAY = 330;   // monthIdx 11
const div2 = Math.round(80 * (1 + REP / 400));
r = GC.monthly();
ok('城望抬分红（' + div2 + ' 灵石，随城望水涨）', r && r.dividend === div2 && STONES === stonesPreDiv + divExpect + div2);

// ---------- 7. 读档归一化：坏账不进门 ----------
reg['guildClimb'].import({ stage: '瞎编的身份', contribution: -50, duesArrears: 99, guildName: '冒名的招牌', foundedDay: 'x', monthSettled: 'abc' });
let st = GC.state();
ok('坏身份归一为白身（贡献/欠费/招牌全清）', st.stage === 'none' && st.contribution === 0 && st.duesArrears === 0 && st.guildName === '' && st.foundedDay === 0 && st.monthSettled === 0);
reg['guildClimb'].import({ stage: 'founder', contribution: 99999999, guildName: 'x'.repeat(40), foundedDay: 12.7 });
st = GC.state();
ok('会首账归一（贡献夹板、招牌截十二字、日期取整）', st.stage === 'founder' && st.contribution === 99999 && st.guildName.length === 12 && st.foundedDay === 12);
ok('转世清账：打回白身', (reg['guildClimb'].reset(), GC.stage() === 'none'));

// ---------- 8. 牌面明账 ----------
GC.join();
let s8 = GC.state();   // reset 换了账本，重新拿引用
s8.contribution = 60;
let html = GC.sectionHtml();
ok('牌面写清身份/佣金/贡献/下一档', html.indexOf('会员') >= 0 && html.indexOf('12%') >= 0 && html.indexOf('贡献 60') >= 0 && html.indexOf('执事') >= 0);
s8.stage = 'none';
html = GC.sectionHtml();
ok('白身牌面给入会按钮（会费明账）', html.indexOf('uiJoin') >= 0 && html.indexOf('50') >= 0);
s8.stage = 'speaker';
html = GC.sectionHtml();
ok('话事人牌面给另立按钮（本钱/城望明账）', html.indexOf('uiFound') >= 0 && html.indexOf('800') >= 0 && html.indexOf('城望') >= 0);

console.log('\n== 结果：' + pass + ' 通过 / ' + fail + ' 失败 ==');
process.exit(fail ? 1 : 0);
