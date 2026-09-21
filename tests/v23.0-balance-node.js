// ==================== v23.0 平衡急救验收（四批全修·第一批） ====================
// 全库审计盘出约95处一键即结算，第一批先堵最伤的：无限印钞机（渡劫台/冰晶塔/灵泉/朝见/画舫…）、
// 吞丹BUG（止血丹）、假承诺（辟谷丹/异闻馆空头线索/古剑死文本）、远程白嫖（图鉴隔空探索）、
// 战外乾坤符、灵脉点击回本机。
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');

let passed = 0; const failures = [];
function ok(cond, msg) { if (cond) { passed++; } else { failures.push(msg); console.log('  ✗ ' + msg); } }
function eq(a, b, msg) { ok(a === b, msg + '（实得 ' + a + '，期望 ' + b + '）'); }
function read(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// ============ A 源码接线：印钞机全部上闸 ============
{
    const html = read('仙侠.html');
    ok(html.indexOf('js/core/action-gates.js') >= 0, 'A0 共用闸门模块已挂载');

    const ls = read('js/location-system.js');
    ok(ls.indexOf('function _gate(') >= 0 && ls.indexOf('function _gateMark(') >= 0, 'A1 景点闸门助手在位（先付后记，灵石不够不吃冷却）');
    const gated = ['palace_audience_', 'huafang', 'poetry_meet', 'star_platform', 'enlightenment_stele',
        'tribulation_platform', 'dragon_vault', 'volcano_cave', 'poison_cave', 'ruin_entrance', 'ice_tower', 'study_formation', 'daoist_temple',
        'prison_visit', 'prison_bribe'];
    const missing = gated.filter(k => ls.indexOf("'" + k) < 0);
    eq(missing.length, 0, 'A2 十五处景点全部上闸' + (missing.length ? '：缺 ' + missing.join(',') : ''));
    ok(ls.indexOf('_foundationBonus || 0) + 5;') < 0 && ls.indexOf('fb / 40') >= 0 && ls.indexOf('cap = 30') < 0,
        'A3 渡劫台感悟渐悟渐淡（v23.3：递减退益替代硬封顶30，文案不报数）');
    ok(ls.indexOf('0.12 / (1 + scarred)') >= 0 && ls.indexOf('scarred * 8') >= 0 && ls.indexOf('/3 次') < 0 && ls.indexOf('3/3') < 0,
        'A4 冰晶塔寒毒积骨：淬体越成蚀体越重、冰灵越难入体（v23.3：后果链替代终身3次计数）');
    ok(ls.indexOf("window.currentCharData.constitution = (window.currentCharData.constitution || 0) + (Math.random() < 0.1 ? 1 : 0);") < 0, 'A5 旧版无限刷体质语句已拆除');
    // v23.3 宪法清账扫尾：全库不留裸计数器——「次数已用完（N次）」句式连旧残留一并清掉
    {
        const appSrc = read('js/app.js');
        ok(appSrc.indexOf('搜刮次数已尽') < 0 && appSrc.indexOf('值钱的早叫前人拾了去') >= 0, 'A5b 搜箱配额改世界逻辑（无主旧箱叫前人拾尽了）');
        const ar = read('js/gameplay/arena-system.js');
        ok(ar.indexOf('竞技次数已达上限') < 0 && ar.indexOf('比试牌已经发完') >= 0, 'A5c 竞技场上限改「比试牌发完」的台规');
        const ne = read('js/npcs/npc-emotions.js');
        ok(ne.indexOf('每日次数已达上限') < 0 && ne.indexOf('没了脾气') >= 0, 'A5d 缠人太甚对方没了脾气（替系统腔配额提示）');
        const sf = read('js/sects/sect-facilities.js');
        ok(sf.indexOf('次/日') < 0 && sf.indexOf('份例今日已尽') >= 0, 'A5e 门派设施兜底文案讲份例制度缘由');
    }

    const app = read('js/app.js');
    ok(/useSpring[\s\S]{0,400}actionGate\.cooled\('spirit_spring', 1\)/.test(app), 'A6 灵泉沐浴一日一次（旧版零成本无限全恢复）');
    ok(/templePray[\s\S]{0,900}temple_pray[\s\S]{0,500}incense/.test(app), 'A7 祈福要香火钱且一日一次（旧版blessing无限涨）');
    ok(/templeMeditate[\s\S]{0,700}15 \+ Math\.floor\(Math\.random\(\) \* 16\)/.test(app), 'A8 静修所得随定境波动15~30（旧版恒20）');

    const ns = read('js/npcs/npc-system.js');
    ok(/'治疗师'[\s\S]{0,1400}fee = 20[\s\S]{0,900}rate = 0\.7 \+ Math\.random\(\) \* 0\.3/.test(ns), 'A9 诊治收诊金20灵石（好感60+免费）、疗效70~100%分档、耗时半时辰');
    ok(/'隐士'[\s\S]{0,900}cooled\('dao_discuss', 1\)[\s\S]{0,400}spend\('energy', 10/.test(ns), 'A10 论道一日一论、耗精力10（旧版零成本连点刷经验）');

    const ts = read('js/gameplay/talisman-system.js');
    ok(/eff\.twist_fate\) \{[\s\S]{0,300}if \(!inBattle\(\)\) \{[\s\S]{0,300}return false;/.test(ts), 'A11 乾坤符战外拒用且不消耗（旧版战外白嫖满状态）');

    const inv = read('js/inventory.js');
    ok(/template\.effect\.hemostatic[\s\S]{0,700}_hBleeding[\s\S]{0,300}return false;[\s\S]{0,600}hemostaticTreatment\(_hEnt\)/.test(inv),
        'A12 止血丹：无流血伤口不消耗；有伤才催药并传入真身（旧版subtype错判+不传实体=吞丹）');
    ok(inv.indexOf("template.subtype === 'pill' && template.effect && template.effect.hemostatic") < 0, 'A13 旧吞丹分支已拆除');

    ok(read('js/items-extended/01-pills.js').indexOf('可数日不食') < 0, 'A14 辟谷丹假承诺文案已改实（无进食系统不吹辟谷）');

    const lm = read('js/map/landmark-explore.js');
    ok(lm.indexOf('onclick="exploreLandmark') < 0 && lm.indexOf('图鉴只看不探') >= 0, 'A15 图鉴远程探索已封死（探索必须亲至）');
    ok(/exploreLandmark[\s\S]{0,900}energy \|\| 0\) < 15/.test(lm), 'A16 实地探索耗精力15（旧版零成本连点刷进度）');
    ok(lm.indexOf("action: 'pull_sword'") >= 0 && lm.indexOf('_landmarkPullSword') >= 0, 'A17 「古剑似乎可以拔出来」死文本兑现成真交互（成败凭力、一生一次）');
    ok(lm.indexOf('swordPulled:') >= 0, 'A18 拔剑与否随进度存档');

    const b2 = read('js/city-facilities/facility-batch2.js');
    ok(b2.indexOf('记下位置，改日去探索') < 0 && b2.indexOf('你获得了一条探索线索。') < 0 && b2.indexOf('你获得了一条秘境线索。') < 0 && b2.indexOf('你决定改日去查探此事。') < 0,
        'A19 异闻馆三张空头支票全部作废');
    ok(/od_war[\s\S]{0,1200}roll: \{ prob[\s\S]{0,900}od_tale[\s\S]{0,900}roll: \{ prob/.test(b2), 'A20 战场/怪谈改当场掷骰兑现（赢有实货，输有代价文案）');
    ok(b2.indexOf("items: [{ itemId: 'spec_map_fragment', count: 1 }]") >= 0, 'A21 抄图真给残片（RewardService items 键）');

    const sv = read('js/economy/spirit-vein.js');
    ok(/0\.8 \+ Math\.random\(\) \* 0\.4/.test(sv) && sv.indexOf('tier || 1) < 3 && Math.random() < 0.1') >= 0, 'A22 灵脉产出±20%波动+一成夜袭折半，三阶阵法可镇（升级有了防御意义）');
}

// ============ B 闸门模块运行时 ============
{
    const sb = { console: { log() {}, warn() {}, error() {} }, Math, JSON, Date, Object, Array, String, Number, Boolean };
    sb.window = sb; sb.globalThis = sb;
    sb.__day = 5;
    sb.timeSystem = { getAbsoluteDay: () => sb.__day, gameTime: { currentDay: sb.__day } };
    sb.currentCharData = { qi: 100, energy: 100, health: 100 };
    sb.__msgs = [];
    sb.showMessage = (t) => sb.__msgs.push(String(t));
    vm.createContext(sb);
    vm.runInContext(read('js/core/action-gates.js'), sb, { filename: 'action-gates.js' });
    const G = sb.actionGate;

    eq(G.day(), 5, 'B1 读绝对日');
    eq(G.cooled('k1', 1), false, 'B2 未用过的闸是开的');
    G.mark('k1');
    eq(G.cooled('k1', 1), true, 'B3 落闸后当日冷却中');
    sb.__day = 6; sb.timeSystem.gameTime.currentDay = 6;
    eq(G.cooled('k1', 1), false, 'B4 次日开闸（每日一次）');
    G.mark('k2');
    sb.__day = 10;
    eq(G.cooled('k2', 7), true, 'B5 七日闸第四日仍冷');
    eq(G.left('k2', 7), 3, 'B6 剩余冷却日数如实报');
    sb.__day = 13;
    eq(G.cooled('k2', 7), false, 'B7 七日期满开闸');
    // 新开档日数归零：旧「未来记录」视为过期，不卡死玩家
    G.mark('k3'); sb.__day = 2;
    eq(G.cooled('k3', 1), false, 'B8 存档日数回卷不误锁（新周目不被旧冷却卡死）');
    // once：冷却中弹话术返回 false
    sb.__day = 20;
    eq(G.once('k4', 1, '今日无缘。'), true, 'B9a once 首次放行');
    eq(G.once('k4', 1, '今日无缘。'), false, 'B9b once 同日再问拒绝');
    ok(sb.__msgs.some(m => m === '今日无缘。'), 'B9c 拒绝有定制话术');
    // spend
    eq(G.spend('qi', 30, '真气'), true, 'B10a 资源足：扣费成功');
    eq(sb.currentCharData.qi, 70, 'B10b 扣的是真源');
    sb.currentCharData.qi = 10;
    eq(G.spend('qi', 30, '真气'), false, 'B10c 资源不足：拒绝且不扣');
    ok(sb.__msgs.some(m => m.indexOf('真气不足') >= 0), 'B10d 不足有话术（需/当前如实报）');
    // roll 区间
    let inRange = true;
    for (let i = 0; i < 200; i++) { const r = G.roll(3, 7); if (r < 3 || r > 7 || r !== Math.floor(r)) inRange = false; }
    ok(inRange, 'B11 roll 恒在闭区间内取整');
}

// ============ C 灵脉运行时：波动与夜袭 ============
{
    const sb = { console: { log() {}, warn() {}, error() {} }, JSON, Object, Array, String, Number, Boolean, Math, Date };
    sb.window = sb; sb.globalThis = sb;
    sb.__random = 0.5;
    sb.Math = Object.assign(Object.create(Math), { random: () => sb.__random });
    sb.__hooks = [];
    sb.timeSystem = { onNewDaySubscribe: (cb) => sb.__hooks.push(cb) };
    sb.currentCharData = { realm: '金丹', _spiritVein: { tier: 1, dailyOutput: 20 } };
    sb.__stones = [];
    sb.DataManager = { addSpiritStones: (n) => sb.__stones.push(n) };
    sb.__msgs = [];
    sb.showMessage = (t) => sb.__msgs.push(String(t));
    sb.gameLog = { add() {} };
    vm.createContext(sb);
    vm.runInContext(read('js/economy/spirit-vein.js'), sb, { filename: 'spirit-vein.js' });

    eq(sb.__hooks.length, 1, 'C1 灵脉日结钩子在位');
    // random=0.5 → 波动系数1.0 → 基准20；夜袭判定 0.5>0.1 不中
    sb.__hooks[0]();
    eq(sb.__stones[0], 20, 'C2 无袭击日按灵潮系数产出（0.5→×1.0=20）');
    // random=0.05 → 波动系数 0.8+0.05*0.4=0.82 → round(20*0.82)=16；夜袭 0.05<0.1 命中 → 折半8
    sb.__random = 0.05; sb.__stones.length = 0; sb.__msgs.length = 0;
    sb.__hooks[0]();
    eq(sb.__stones[0], 8, 'C3 夜袭日产出折半（16→8）');
    ok(sb.__msgs.some(m => m.indexOf('偷采') >= 0), 'C3b 夜袭有警示话术且指路升级阵法');
    // 三阶阵法镇住宵小：同随机数不再折半
    sb.currentCharData._spiritVein.tier = 3;
    sb.__stones.length = 0;
    sb.__hooks[0]();
    eq(sb.__stones[0], 16, 'C4 三阶阵法：同随机数下夜袭被镇住，全额入账');
}

// ============ D 拔剑交互运行时 ============
{
    const sb = {
        console: { log() {}, warn() {}, error() {} }, JSON, Object, Array, String, Number, Boolean, Date,
        Math: Object.assign(Object.create(Math), {})
    };
    sb.window = sb; sb.globalThis = sb;
    sb.localStorage = { _s: {}, getItem(k) { return Object.prototype.hasOwnProperty.call(this._s, k) ? this._s[k] : null; }, setItem(k, v) { this._s[k] = String(v); }, removeItem(k) { delete this._s[k]; } };
    sb.__msgs = [];
    sb.showMessage = (t) => sb.__msgs.push(String(t));
    sb.currentCharData = { attrs: { strength: 30 }, health: 100 };
    sb.__items = [];
    sb.addItemToInventory = (id, n) => sb.__items.push(id + 'x' + n);
    sb.document = { readyState: 'complete', createElement: () => ({ className: '', innerHTML: '' }), body: { appendChild() {} }, getElementById: () => null, addEventListener() {} };
    vm.createContext(sb);
    vm.runInContext(read('js/map/landmark-explore.js'), sb, { filename: 'landmark-explore.js' });

    // 必胜局：random→0
    sb.Math.random = () => 0;
    sb._landmarkPullSword('古剑峰');
    ok(sb.__items.indexOf('wpn_dark_iron_swordx1') >= 0, 'D1 力大者拔剑得手（玄铁古剑入包）');
    eq(sb.LANDMARK_EXPLORE_DATA['古剑峰']._swordPulled, true, 'D2 拔过即记账');
    // 再拔无剑
    sb.__msgs.length = 0; sb.__items.length = 0;
    sb._landmarkPullSword('古剑峰');
    eq(sb.__items.length, 0, 'D3 一生一地标只有一次（二拔无剑）');
    ok(sb.__msgs.some(m => m.indexOf('无剑可拔') >= 0), 'D3b 二拔有话术不静默');
    // 必败局：虎口撕裂
    sb.LANDMARK_EXPLORE_DATA['龙脉']._swordPulled = false;
    sb.Math.random = () => 0.999;
    sb.currentCharData.health = 100;
    sb._landmarkPullSword('龙脉');
    eq(sb.currentCharData.health, 92, 'D4 拔剑失手：反震伤身（健康-8）');
    // 存档落键
    ok((sb.localStorage.getItem('xianxia_landmarks') || '').indexOf('swordPulled') >= 0, 'D5 拔剑记账随进度持久化');
}

// ============ 汇总 ============
console.log('v23.0-balance: ' + passed + ' passed, ' + failures.length + ' failed');
if (failures.length > 0) process.exit(1);
console.log('v23.0-balance: all green');
