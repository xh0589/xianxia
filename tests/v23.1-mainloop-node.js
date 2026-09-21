// ==================== v23.1 主循环改造验收（四批全修·第三批） ====================
// 审计结论：高频主循环全是「点击→公式→一行字」——丹药零耗时零波动、食物无饱食可狂吃、
// 秘籍一摸就会（completeness 硬编码100+原生alert）、打坐产出纯公式、采集无风险无品质、
// 客栈付费即满、强化零耗时、闭关90天瞬时结算零事件。本批逐项补「过程+波动+风险」。
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');

let passed = 0; const failures = [];
function ok(cond, msg) { if (cond) { passed++; } else { failures.push(msg); console.log('  ✗ ' + msg); } }
function eq(a, b, msg) { ok(a === b, msg + '（实得 ' + a + '，期望 ' + b + '）'); }
function read(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// ============ A 源码接线 ============
{
    ok(read('仙侠.html').indexOf('js/core/satiety.js') >= 0, 'A1 饱食度模块已挂载');

    const inv = read('js/inventory.js');
    ok(/satietySystem\.canEat\(\)[\s\S]{0,300}return false;/.test(inv), 'A2 吃撑拒食且不消耗');
    ok(inv.indexOf("template.id === 'pill_fasting'") >= 0 && inv.indexOf('startFasting(3)') >= 0, 'A3 辟谷丹兑现「可数日不食」（三日辟谷期）');
    ok(/advanceTime\(_brewMin, template\.subtype === 'food' \? '用饭' : '炼化药力'\)/.test(inv), 'A4 服用入口有耗时（丹15分/草药5分/饭10分）');
    ok(/_potency = 0\.85 \+ Math\.random\(\) \* 0\.3/.test(inv) && inv.indexOf('_useTemplate') >= 0, 'A5 药力吸收波动85%~115%（不再恒定直加）');
    ok(/function learnSecretArt[\s\S]{0,3000}_manualProgress/.test(inv), 'A6 秘籍渐进研读（进度随角色存档）');
    ok(/function learnSecretArt[\s\S]{0,3000}prog >= 100[\s\S]{0,3500}consumed: true/.test(inv), 'A7 读满一百才入门、入门才耗书');
    const learnFn = inv.slice(inv.indexOf('function learnSecretArt'), inv.indexOf('// ============ 获取背包物品数量'));
    ok(learnFn.indexOf('alert(') < 0, 'A8 研读全程无原生 alert（系统腔清除）');
    ok(learnFn.indexOf('_studyMin = 120') >= 0 && learnFn.indexOf('advanceTime(_studyMin') >= 0 && learnFn.indexOf('energy') >= 0, 'A9 每次研读耗时两个时辰+精力（第二十四波：藏书阁可省时，底价仍是两个时辰）');
    ok(learnFn.indexOf('头昏脑胀') >= 0, 'A10 精力见底硬啃有气机紊乱之险');

    const app = read('js/app.js');
    ok(/_medRoll < 0\.04[\s\S]{0,200}essenceGain \* 2/.test(app), 'A11 打坐：4% 灵光顿悟（真元翻倍）');
    ok(/_medRoll < 0\.07[\s\S]{0,200}addQiDeviation\(8\)/.test(app), 'A12 打坐：3% 心浮气躁（紊乱+8）');
    ok(app.indexOf('essenceGain * (0.9 + Math.random() * 0.2)') >= 0, 'A13 打坐：日常收成±10%浮动（不再是死公式）');
    ok(/_mineRisk < 0\.06[\s\S]{0,300}巷道塌方/.test(app), 'A14 采矿：塌方风险（健康-8）');
    ok(/_mineRisk < 0\.14[\s\S]{0,200}startBattle\('beast'\)/.test(app), 'A15 采矿：凿穿兽穴即开战');
    ok(app.indexOf('_veinRich = Math.random() < 0.12') >= 0, 'A16 采矿：12% 精矿脉收成翻倍');
    ok(/_chopRisk < 0\.05[\s\S]{0,300}蜂巢/.test(app), 'A17 伐木：蜂巢之扰');
    ok(/_chopRisk < 0\.12[\s\S]{0,200}startBattle/.test(app), 'A18 伐木：惊动树洞里的东西');
    ok(/_herbRisk < 0\.07[\s\S]{0,400}_poisoned = true/.test(app), 'A19 采药：毒雾中毒（佛门庇佑可挡）');
    ok(/_herbRisk < 0\.13[\s\S]{0,200}毒蛇/.test(app), 'A20 采药：毒蛇窜出');
    ok(app.indexOf('_herbRich = Math.random() < 0.12') >= 0, 'A21 采药：12% 精品药圃翻倍');
    ok(/_cast < 0\.08[\s\S]{0,300}线断了/.test(app), 'A22 钓鱼：断线跑鱼');
    ok(/_cast < 0\.16[\s\S]{0,200}startBattle/.test(app), 'A23 钓鱼：妖鱼反噬开战');
    ok(/_rare = _cast >= 0\.90/.test(app), 'A24 钓鱼：10% 罕见大货（收获翻倍）');
    ok(/goFishing[\s\S]{0,2500}QiyuEncounters\.maybeTrigger\('wild'\)/.test(app), 'A25 钓鱼补挂奇遇钩（旧版全域唯独它没有）');

    const rm = read('js/map/randomMap.js');
    ok(/_gRisk < 0\.10[\s\S]{0,400}openBattleWithEntity/.test(rm), 'A26 野外节点采集：惊动守食野兽');
    ok(rm.indexOf('_gRich = Math.random() < 0.12') >= 0, 'A27 野外节点：12% 上品产地翻倍');
    ok(/function gatherWildNode[\s\S]{0,2200}QiyuEncounters\.maybeTrigger\('wild'\)/.test(rm), 'A28 野外节点补挂奇遇钩');

    const be = read('js/building-effects.js');
    ok(/_sleepRoll < 0\.08 \? 0\.6 : \(_sleepRoll < 0\.28 \? 0\.8 : 1\)/.test(be), 'A29 客栈睡眠有质量（酣睡/浅眠/被吵醒三档）');

    const en = read('js/enhancement.js');
    ok(/advanceTime\(30, cfg\.name \|\| '锻造强化'\)/.test(en), 'A30 强化进炉耗时三刻（旧版点击即出结果）');

    const lr = read('js/cultivation/long-retreat.js');
    ok(/_rtRoll < 0\.04[\s\S]{0,120}_dayYield \*= 3/.test(lr), 'A31 闭关：4% 顿悟日（收成×3）');
    ok(/_rtRoll < 0\.10[\s\S]{0,200}addQiDeviation\(6\)/.test(lr), 'A32 闭关：6% 心魔滋扰（紊乱+6、当日折半）');
    ok(lr.indexOf('_rtNote') >= 0 && lr.indexOf('灵光顿悟×') >= 0, 'A33 出关总结如实报告顿悟与心魔');
}

// ============ B 饱食度运行时 ============
{
    const sb = { console: { log() {}, warn() {}, error() {} }, Math, JSON, Date, Object, Array, String, Number, Boolean };
    sb.window = sb; sb.globalThis = sb;
    sb.__day = 1;
    sb.__hooks = [];
    sb.timeSystem = { getAbsoluteDay: () => sb.__day, gameTime: { currentDay: 1 }, onNewDaySubscribe: (cb) => sb.__hooks.push(cb) };
    sb.currentCharData = { mood: 50 };
    sb.__msgs = [];
    sb.showMessage = (t) => sb.__msgs.push(String(t));
    vm.createContext(sb);
    vm.runInContext(read('js/core/satiety.js'), sb, { filename: 'satiety.js' });
    const S = sb.satietySystem;

    eq(S.get(), 70, 'B1 开局不饿不撑（70）');
    eq(S.canEat(), true, 'B2 七分饱：吃得下');
    S.eat(); S.eat(); // 70+28=98，再一顿封顶100
    eq(S.get(), 100, 'B3 两顿下肚直接封顶');
    eq(S.canEat(), false, 'B4 吃撑（>85）：塞不进了');
    sb.__msgs.length = 0;
    // 辟谷丹
    S.startFasting(3);
    eq(S.isFasting(), true, 'B5 辟谷丹：三日辟谷期开');
    eq(S.get(), 100, 'B5b 辟谷饱食置满');
    eq(S.canEat(), false, 'B6 辟谷期内不思凡食');
    // 辟谷期不衰减
    sb.__day = 2; S.dailyTick();
    eq(S.get(), 100, 'B7 辟谷期零消耗（承诺兑现）');
    // 辟谷期满恢复衰减
    sb.__day = 5; S.dailyTick();
    eq(S.get(), 60, 'B8 辟谷期满：每日自然消耗40');
    sb.__day = 6; S.dailyTick();
    eq(S.get(), 20, 'B9 连续两日未进食');
    sb.__day = 7; sb.currentCharData.mood = 50; sb.__msgs.length = 0; S.dailyTick();
    eq(S.get(), 0, 'B10 饿到见底');
    eq(sb.currentCharData.mood, 45, 'B11 饿肚子心情受损（-5）');
    ok(sb.__msgs.some(m => m.indexOf('咕咕叫') >= 0), 'B11b 饥饿有提示');
    // 进食回升
    S.eat(40);
    eq(S.get(), 40, 'B12 一顿饱饭救回来');
    eq(S.canEat(), true, 'B13 又能吃了');
}

// ============ 汇总 ============
console.log('v23.1-mainloop: ' + passed + ' passed, ' + failures.length + ' failed');
if (failures.length > 0) process.exit(1);
console.log('v23.1-mainloop: all green');
