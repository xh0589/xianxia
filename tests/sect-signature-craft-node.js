// sect-signature-craft-node.js — 开山秘艺（特色→高级功法）+ 门中炉火（炼丹房/锻造坊）测试
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
{
    const html = fs.readFileSync(path.join(ROOT, '仙侠.html'), 'utf8');
    ok(html.includes('js/sects/sect-signature-arts.js'), 'A1 页面挂载开山秘艺模块');
    ok(html.indexOf('sect-signature-arts.js') > html.indexOf('sect-identity.js'), 'A2 挂载在特色身份层之后（读到的是改造后的特色表）');
    ok(fs.readFileSync(path.join(ROOT, 'js/sects/sect-visit.js'), 'utf8').includes('开山秘艺'), 'A3 门派详情页挂开山秘艺卡');
    const facSrc = fs.readFileSync(path.join(ROOT, 'js/sects/sect-facilities.js'), 'utf8');
    ok(facSrc.includes('炼丹房') && facSrc.includes('锻造坊'), 'A4 门派建筑补上炼丹房与锻造坊（此前门里没有一座炉子）');
    ok(facSrc.includes('openCrafting: true') && facSrc.includes("case 'openCrafting'"), 'A5 开炉动作进了动作白名单与分发');
    ok(facSrc.includes('_sectCraftBuff'), 'A6 开炉挂场地加成时间窗');
    ok(facSrc.includes('丹炉今日的火已经封了') && facSrc.includes('铁砧也要歇'), 'A7 份例用尽有制度话（不说「次数用完」）');
    const craftSrc = fs.readFileSync(path.join(ROOT, 'js/crafting.js'), 'utf8');
    ok(craftSrc.includes('_sectCraftBuff') && craftSrc.includes('0.08'), 'A8 炼制成功率真吃门中炉火加成');
    const sigSrc = fs.readFileSync(path.join(ROOT, 'js/sects/sect-signature-arts.js'), 'utf8');
    eq((sigSrc.match(/\{ sect: '/g) || []).length, 36, 'A9 三十六派逐一入表');
    ok(!/冷却中|次数上限|配额/.test(sigSrc), 'A10 模块零配额句式');
}

// ---------- 沙箱 ----------
function makeSandbox(opts) {
    opts = opts || {};
    const W = {
        SECT_SPECIALTIES: opts.noSpecs ? undefined : {
            '少林寺': { name: '达摩洞悟道', desc: '在达摩洞中参悟佛法，可临时提升心境与防御', type: 'buff' },
            '武当派': { name: '太极演武', desc: '领悟太极拳剑真意，提升化解与反击能力', type: 'buff' },
            '丐帮': { name: '丐帮消息网', desc: '叫花子遍布天下，消息灵通', type: 'quest' },
            '药王谷': { name: '丹方研究', desc: '研究丹方，提升炼丹造诣', type: 'recipe' },
            '铸剑山庄': { name: '名剑铸造', desc: '铸造名剑，提升锻造技艺', type: 'craft' },
            '茅山派': { name: '符箓绘制', desc: '绘制独门符箓，可驱鬼除妖', type: 'items' }
        },
        SECT_SPECIFIC_ARTS: {
            '少林寺': [{ id: 'art_yi_jin_jing', name: '易筋经', type: '内功', grade: '三品', tier: 4 }],
            '武当派': [{ id: 'art_wd_taiji_jian', name: '太极剑意', type: '剑法', grade: '三品', tier: 4, transmit: 'direct' }],
            '丐帮': [{ id: 'art_gaibang_staff', name: '打狗棒法', type: '长兵', grade: '三品', tier: 4, transmit: 'leader' }],
            '药王谷': [],
            '铸剑山庄': [{ id: 'art_zj_wanjian', name: '万剑归宗诀', type: '剑法', grade: '三品', tier: 4, transmit: 'direct' }],
            '茅山派': [{ id: 'art_ms_jingshen', name: '净身咒', type: '符箓', grade: '八品', tier: 1 }]
        },
        discipleState: opts.ds || { isInSect: true, sectName: '少林寺', rank: 2, artInsights: opts.insights || {} },
        showMessage: function () {}, gameLog: { add: function () {} }
    };
    W.window = W;
    const sandbox = { window: W, console: { log: function () {} }, Math: Math, Number: Number, String: String, JSON: JSON, Object: Object, Array: Array, Date: Date };
    vm.createContext(sandbox);
    function load() { vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/sects/sect-signature-arts.js'), 'utf8'), sandbox); }
    load();
    return { W: W, load: load };
}

// ---------- B · 特色升华为功法 ----------
console.log('\n[B] 开山秘艺');
{
    const env = makeSandbox({});
    const sl = env.W.SECT_SPECIFIC_ARTS['少林寺'];
    const sig = sl.filter(a => String(a.id).indexOf('art_sig_') === 0)[0];
    ok(!!sig, 'B1 少林特色挂上了开山秘艺');
    eq(sig.name, '达摩心印', 'B2 秘艺名从看家本事入武道（达摩洞悟道 → 达摩心印）');
    eq(sig.tier, 4, 'B3 藏经阁四层之格（与镇派绝学同层）');
    eq(sig.transmit, 'direct', 'B4 掌门亲传方可参悟（不是路边摊）');
    eq(sig.grade, '三品', 'B5 三品绝学');
    ok(sig.desc.includes('少林寺') && sig.desc.includes('参悟佛法'), 'B6 来历写在书里（立派本事+原特色说明）');
    eq(sig.type, '炼体', 'B7 少林秘艺走炼体——类型跟原效果（防御心境）走，不跟「心印」二字走');
    eq(sig.bonus.constitution, 14, 'B8 炼体型六维走向对（体魄）');
    eq(sig.bonus.strength, 9, 'B8b 炼体型六维走向对（根骨）');
    const gb = env.W.SECT_SPECIFIC_ARTS['丐帮'].filter(a => String(a.id).indexOf('art_sig_') === 0)[0];
    eq(gb.name, '千耳百目功', 'B9 丐帮消息网 → 千耳百目功（消息灵通练成耳目之学）');
    eq(gb.bonus.intelligence, 13, 'B10 奇门型走悟性');
    const yw = env.W.SECT_SPECIFIC_ARTS['药王谷'].filter(a => String(a.id).indexOf('art_sig_') === 0)[0];
    eq(yw.name, '药王丹经', 'B11 药王谷丹方研究 → 药王丹经');
    eq(yw.type, '医术', 'B12 医道门派走医术');
    // 幂等：重复加载不重复挂
    const before = env.W.SECT_SPECIFIC_ARTS['少林寺'].length;
    env.load();
    eq(env.W.SECT_SPECIFIC_ARTS['少林寺'].length, before, 'B13 重复加载不重复挂（幂等）');
    // 缺表不炸
    const env2 = makeSandbox({ noSpecs: true });
    ok(env2.W.sectSignatureProbe('少林寺') && env2.W.sectSignatureProbe('少林寺').name === '达摩心印', 'B14 特色表缺失也不炸（秘艺照样挂得上）');
}

// ---------- C · 详情页卡片 ----------
console.log('\n[C] 秘艺卡');
{
    const env = makeSandbox({ ds: { isInSect: false } });
    ok(env.W.sectSignatureCard('少林寺').includes('长老以上可阅'), 'C1 外人/低职看到的是获取路径（不留死路感）');
    const e2 = makeSandbox({ ds: { isInSect: true, sectName: '少林寺', rank: 2, artInsights: {} } });
    ok(e2.W.sectSignatureCard('少林寺').includes('藏经阁四层'), 'C2 长老看到的是下一步（去阁中翻阅+请掌门亲传）');
    const e3 = makeSandbox({ ds: { isInSect: true, sectName: '少林寺', rank: 1, artInsights: { art_sig_00: { heard: true, m: 50 } } } });
    ok(e3.W.sectSignatureCard('少林寺').includes('掌握 50%'), 'C3 参悟中显示掌握度');
    const e4 = makeSandbox({ ds: { isInSect: true, sectName: '少林寺', rank: 0, artInsights: { art_sig_00: { heard: true, m: 100 } } } });
    ok(e4.W.sectSignatureCard('少林寺').includes('已大成'), 'C4 掌握满百显示大成');
    const e5 = makeSandbox({});
    const card = e5.W.sectSignatureCard('少林寺');
    ok(card.includes('体魄 +14') && card.includes('掌门亲传'), 'C5 卡片把功效与门槛摆在明面');
    eq(e5.W.sectSignatureCard('不存在派'), '', 'C6 没这派秘艺不硬编卡片');
}

// ---------- D · 域入真判定（类型不是装饰） ----------
console.log('\n[D] 域入真判定');
{
    // 丹道域：药王谷弟子炼丹真更稳
    const env = makeSandbox({ ds: { isInSect: true, sectName: '药王谷', rank: 3, artInsights: { art_sig_12: { heard: true, m: 100 } } } });
    eq(env.W.sectSignatureCraftBonus('pilfer'), 0.04, 'D1 药王丹经大成：炼丹成功率 +4%（本事加成）');
    eq(env.W.sectSignatureCraftBonus('forging'), 0, 'D2 丹道不助铁砧（域不串）');
    // 掌握一半，本事一半
    const e2 = makeSandbox({ ds: { isInSect: true, sectName: '药王谷', rank: 3, artInsights: { art_sig_12: { heard: true, m: 50 } } } });
    eq(e2.W.sectSignatureCraftBonus('pilfer'), 0.02, 'D3 掌握五成，加成折半（按掌握度发挥）');
    // 书没翻开，本事不上身
    const e3 = makeSandbox({ ds: { isInSect: true, sectName: '药王谷', rank: 3, artInsights: {} } });
    eq(e3.W.sectSignatureCraftBonus('pilfer'), 0, 'D4 未参悟不加成（书没翻开，本事不会自己上身）');
    const e3b = makeSandbox({ ds: { isInSect: false } });
    eq(e3b.W.sectSignatureCraftBonus('pilfer'), 0, 'D5 不在门中不沾光');
    // 情报域：丐帮弟子听消息真灵
    const e4 = makeSandbox({ ds: { isInSect: true, sectName: '丐帮', rank: 3, artInsights: { art_sig_09: { heard: true, m: 100 } } } });
    eq(e4.W.sectSignatureIntelBonus(), 0.15, 'D6 千耳百目功大成：情报机缘 +15%');
    eq(e4.W.sectSignatureCraftBonus('pilfer'), 0, 'D7 情报域不助丹炉');
    // 养气域：武当弟子吐纳绵长
    const e5 = makeSandbox({ ds: { isInSect: true, sectName: '武当派', rank: 3, artInsights: { art_sig_01: { heard: true, m: 100 } } } });
    eq(e5.W.sectSignatureQiRegenPct(), 3, 'D8 太极真意大成：真气恢复 +3%（走既有恢复结算）');
    eq(e5.W.sectSignatureStudyMul(), 1, 'D9 养气域不冒充典籍域');
    // 符造域：茅山弟子制符真更稳（第十六波接通——制符走 crafting.js 同一条成功率线）
    const e5b = makeSandbox({ ds: { isInSect: true, sectName: '茅山派', rank: 3, artInsights: { art_sig_15: { heard: true, m: 100 } } } });
    eq(e5b.W.sectSignatureCraftBonus('talismans'), 0.04, 'D8b 符笔春秋大成：制符成功率 +4%（本事加成）');
    eq(e5b.W.sectSignatureCraftBonus('pilfer'), 0, 'D8c 符造不助丹炉（域不串）');
    // 四个消费端都接了线
    ok(fs.readFileSync(path.join(ROOT, 'js/crafting.js'), 'utf8').includes('sectSignatureCraftBonus'), 'D10 炼制成功率真消费丹道/锻冶/符造域');
    const facSrc2 = fs.readFileSync(path.join(ROOT, 'js/sects/sect-facilities.js'), 'utf8');
    ok(facSrc2.includes('sectSignatureStudyMul') && facSrc2.includes('sectSignatureIntelBonus'), 'D11 参悟效率与情报机缘真消费典籍/情报域');
    ok(fs.readFileSync(path.join(ROOT, 'js/time-system.js'), 'utf8').includes('sectSignatureQiRegenPct'), 'D12 吐纳恢复真消费养气域');
    // 卡片把域与互补成对摆上明面
    const e6 = makeSandbox({ ds: { isInSect: true, sectName: '药王谷', rank: 3, artInsights: { art_sig_12: { heard: true, m: 40 } } } });
    const card = e6.W.sectSignatureCard('药王谷');
    ok(card.includes('丹道') && card.includes('1.6%'), 'D13 卡片写明艺之域与当下得力几何');
    const e7 = makeSandbox({});
    ok(e7.W.sectSignatureCard('少林寺').includes('互补成对') && e7.W.sectSignatureCard('少林寺').includes('易筋经'), 'D14 卡片点明与镇派绝学互补成对');
}

// ---------- E · 百工的第二面（上场） ----------
console.log('\n[E] 百工的第二面');
{
    // 情报域·战斗面：听风辨位
    const env = makeSandbox({ ds: { isInSect: true, sectName: '丐帮', rank: 3, artInsights: { art_sig_09: { heard: true, m: 100 } } } });
    const cb = env.W.sectSignatureCombatBonus();
    eq(cb.hit, 2, 'E1 千耳百目功大成：战斗命中 +2（耳目练上了场）');
    eq(cb.dodge, 2, 'E2 闪避同涨（听风辨位）');
    const e2 = makeSandbox({ ds: { isInSect: true, sectName: '药王谷', rank: 3, artInsights: { art_sig_12: { heard: true, m: 100 } } } });
    eq(Object.keys(e2.W.sectSignatureCombatBonus()).length, 0, 'E3 丹道不冒充耳目（域不串）');
    // 丹道域·第二面：知药者丹毒轻
    eq(e2.W.sectSignaturePoisonEase(), 0.3, 'E4 药王丹经大成：丹毒积累减三成');
    const e3 = makeSandbox({ ds: { isInSect: true, sectName: '药王谷', rank: 3, artInsights: { art_sig_12: { heard: true, m: 50 } } } });
    eq(e3.W.sectSignaturePoisonEase(), 0.15, 'E5 掌握五成，减免折半');
    eq(env.W.sectSignaturePoisonEase(), 0, 'E6 情报域不减免丹毒');
    // 锻冶域·第二面：炉工熟络
    const e4 = makeSandbox({ ds: { isInSect: true, sectName: '铸剑山庄', rank: 3, artInsights: { art_sig_14: { heard: true, m: 100 } } } });
    eq(e4.W.sectSignatureForgeDiscount(), 0.15, 'E7 百炼铸剑录大成：制作强化费用再折一成半');
    eq(e4.W.sectSignatureCraftBonus('forging'), 0.04, 'E8 锻冶域本事面照旧（成功率 +4%）');
    // 三个消费端都接了线
    ok(fs.readFileSync(path.join(ROOT, 'js/inventory.js'), 'utf8').includes('sectSignatureCombatBonus'), 'E9 战斗加值汇总真消费听风辨位');
    ok(fs.readFileSync(path.join(ROOT, 'js/crafting/pill-poison.js'), 'utf8').includes('sectSignaturePoisonEase'), 'E10 丹毒账真消费知药者丹毒轻');
    const craftSrc2 = fs.readFileSync(path.join(ROOT, 'js/crafting.js'), 'utf8');
    ok(craftSrc2.includes('sectSignatureForgeDiscount') && craftSrc2.includes('0.45'), 'E11 费用折扣真消费炉工熟络（四半封底）');
    // 卡片把两面都摆上明面
    const card = e2.W.sectSignatureCard('药王谷');
    ok(card.includes('丹毒'), 'E12 卡片写明第二面（知药者丹毒轻）');
    ok(env.W.sectSignatureCard('丐帮').includes('听风辨位'), 'E13 丐帮卡片写明战斗面');
    // 符造域·第二面：符笔随心（第十六波接通）
    const e5 = makeSandbox({ ds: { isInSect: true, sectName: '茅山派', rank: 3, artInsights: { art_sig_15: { heard: true, m: 100 } } } });
    eq(e5.W.sectSignatureTalismanQiSave(), 0.3, 'E14 符笔春秋大成：制符真气消耗省三成');
    const e6 = makeSandbox({ ds: { isInSect: true, sectName: '茅山派', rank: 3, artInsights: { art_sig_15: { heard: true, m: 50 } } } });
    eq(e6.W.sectSignatureTalismanQiSave(), 0.15, 'E15 掌握五成，省一半的一半（按掌握度发挥）');
    eq(env.W.sectSignatureTalismanQiSave(), 0, 'E16 情报域不省符墨（域不串）');
    ok(fs.readFileSync(path.join(ROOT, 'js/crafting.js'), 'utf8').includes('sectSignatureTalismanQiSave'), 'E17 制符真气结算真消费符笔随心');
    ok(e5.W.sectSignatureCard('茅山派').includes('符笔随心'), 'E18 茅山卡片写明第二面（不再「来日方长」）');
}

// ---------- F · 力度总表与同级跨派对照 ----------
console.log('\n[F] 力度总表与对照');
{
    const env = makeSandbox({ ds: { isInSect: true, sectName: '药王谷', rank: 3, artInsights: { art_sig_12: { heard: true, m: 100 } } } });
    const T = env.W.SECT_SIG_TUNING;
    ok(!!T, 'F1 力度总表在册（改平衡只动这一张表）');
    ok(T.craftRate === 0.04 && T.poisonEase === 0.3 && T.intelChance === 0.15 && T.intelCombat === 2
        && T.tomesStudy === 0.3 && T.qiRegen === 3 && T.forgeDiscount === 0.15 && T.forgeFloor === 0.45
        && T.talismanQiSave === 0.3
        && T.sixBudget[0] === 22 && T.sixBudget[1] === 24, 'F2 表值即产线值（旋钮与行为一致）');
    // 旋钮是真旋钮：拧表即变行为
    T.craftRate = 0.08;
    eq(env.W.sectSignatureCraftBonus('pilfer'), 0.08, 'F3 拧总表即改行为（旋钮不是摆设）');
    T.craftRate = 0.04;
    eq(env.W.sectSignatureCraftBonus('pilfer'), 0.04, 'F4 拧回来行为复原');
    // 三十六门预算审计
    const rows = env.W.sectSignatureAudit();
    eq(rows.length, 36, 'F5 三十六门逐一入账');
    ok(rows.every(r => r.within), 'F6 六维合计全在预算带（22~24）——两族底子等值');
    ok(rows.every(r => r.hooks <= 1), 'F7 每门至多一个域钩子（防双吃）');
    const crafts = rows.filter(r => ['奇门', '医术', '符箓'].indexOf(r.type) >= 0);
    ok(crafts.length === 12 && crafts.every(r => r.domain), 'F8 百工十二门（奇门八/医术三/符箓一），门门有域');
    // 流派不碰字（build-school 真模块加载验证）
    const bsBox = { window: null, console: { log: function () {} }, Math: Math, Number: Number, String: String, RegExp: RegExp, Array: Array, Object: Object };
    bsBox.window = bsBox;
    const bsCtx = vm.createContext(bsBox);
    bsBox.discipleState = { artInsights: {} };
    bsBox.SECT_SPECIFIC_ARTS = env.W.SECT_SPECIFIC_ARTS;
    bsBox.currentSkills = {};
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/combat/build-school.js'), 'utf8'), bsCtx);
    bsBox.discipleState.artInsights = { art_sig_14: { m: 100 } }; // 百炼铸剑录（奇门·锻冶）
    eq(bsBox.getBuildSchool(), 'none', 'F9 铸剑录不再碰「剑」字白嫖剑修（非武之书不驱动流派）');
    bsBox.discipleState.artInsights = { art_sig_00: { m: 100 } }; // 达摩心印（炼体）
    eq(bsBox.getBuildSchool(), 'body', 'F10 达摩心印按类型入体修（不再碰「印」字误判法修）');
    bsBox.discipleState.artInsights = { art_sig_01: { m: 100 } }; // 太极真意（内功）
    eq(bsBox.getBuildSchool(), 'caster', 'F11 内功按类型入法修');
    bsBox.discipleState.artInsights = { art_gaibang_staff: { m: 100 } }; // 打狗棒法（长兵）
    eq(bsBox.getBuildSchool(), 'body', 'F12 打狗棒法按类型入体修（旧口径碰「法」字误判法修）');
    bsBox.discipleState.artInsights = { art_sig_14: { m: 100 }, art_wd_taiji_jian: { m: 80 } };
    eq(bsBox.getBuildSchool(), 'sword', 'F13 最高掌握是非武之书时，顺位看下一本武功（太极剑意→剑修）');
    // 同级跨派对照（结构不变量 + 声明常数的期望值折算）
    const schoolVals = [];
    bsBox.discipleState.artInsights = { art_wd_taiji_jian: { m: 100 } }; // 太极剑意（剑法·剑修）
    let sb = bsBox.getSchoolBonus(); schoolVals.push(sb.crit, sb.counter);
    bsBox.discipleState.artInsights = { art_sig_00: { m: 100 } };
    sb = bsBox.getSchoolBonus(); schoolVals.push(Math.round(sb.defenseMul * 100), sb.counter);
    bsBox.discipleState.artInsights = { art_sig_01: { m: 100 } };
    sb = bsBox.getSchoolBonus(); schoolVals.push(Math.round(sb.attackMul * 100));
    ok(schoolVals.every(v => v >= 5 && v <= 20), 'F14 击族独有项（流派被动）全在 5~20 点带内');
    // 百工独有项按声明常数折算月度灵石当量，天花板 800 石（约一套中档丹药钱）
    const A = { matPerCraft: 50, craftsPerHour: 2, hoursPerDay: 2, daysPerMonth: 30, enhCost: 60, enhPerHour: 1, ceiling: 800 };
    const forgeMonth = (T.craftRate * A.matPerCraft * A.craftsPerHour + T.forgeDiscount * A.enhCost * A.enhPerHour) * A.hoursPerDay * A.daysPerMonth;
    const alchMonth = (T.craftRate * A.matPerCraft * A.craftsPerHour) * A.hoursPerDay * A.daysPerMonth;
    ok(forgeMonth <= A.ceiling, 'F15 锻冶包经济独有项月当量 ' + Math.round(forgeMonth) + ' 石 ≤ 天花板 ' + A.ceiling);
    ok(alchMonth <= A.ceiling, 'F16 丹道包经济独有项月当量 ' + Math.round(alchMonth) + ' 石 ≤ 天花板');
    ok(T.intelCombat <= Math.min.apply(null, schoolVals) * 0.25, 'F17 情报战斗面（斥候）≤ 流派正面独有项的四分之一');
    const martialRows = rows.filter(r => r.martial), craftRows = rows.filter(r => !r.martial);
    const avg = arr => arr.reduce((s, r) => s + r.sixSum, 0) / arr.length;
    ok(Math.abs(avg(martialRows) - avg(craftRows)) <= 2, 'F18 武功书与百工书六维均值差 ≤2（底子等值，独有项分币支付）');
    // 消费端封底读表
    ok(fs.readFileSync(path.join(ROOT, 'js/crafting.js'), 'utf8').includes('SECT_SIG_TUNING'), 'F19 费用封底也读总表（旋钮收齐）');
}

console.log('\n========== sect-signature-craft: ' + pass + ' 通过, ' + fail + ' 失败 ==========');
process.exit(fail ? 1 : 0);
