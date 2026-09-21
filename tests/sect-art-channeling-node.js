// sect-art-channeling-node.js — 秘艺运功（门派功法接入运功三槽）vm 沙箱测试
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
    ok(html.includes('js/sects/sect-art-channeling.js'), 'A1 页面挂载秘艺运功桥');
    ok(html.indexOf('sect-art-channeling.js') > html.indexOf('sect-signature-arts.js'), 'A2 挂载在开山秘艺之后（表齐了才注册招式）');
    const eqSrc = fs.readFileSync(path.join(ROOT, 'js/equipment.js'), 'utf8');
    ok(eqSrc.includes('sectArtChannelable') && eqSrc.includes('sectArtAsSkill'), 'A3 装备入口与查表兜底都接了桥');
    ok(eqSrc.includes('门派功法是例外') && eqSrc.includes('sectArtChannelList'), 'A4 读档迁移放行门派功法、常用栏列入门派招式');
    const gsSrc = fs.readFileSync(path.join(ROOT, 'js/core/game-state.js'), 'utf8');
    ok(gsSrc.includes('sectArtAsSkill') && gsSrc.includes('第十五波'), 'A5 读档校验放行门派功法（掌握度账在后头才恢复）');
    const appSrc = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
    ok(appSrc.includes('sectArtChannelList'), 'A6 运功栏候选列表并入参悟过的门派功法');
    ok(appSrc.includes("typeof mainSkill === 'object' && mainSkill.id") && !appSrc.includes('findSkillById(mainSkillId)'), 'A7 主修吸纳+10%修复（旧代码拿对象当 id 查表，永远查空）');
    const sigSrc = fs.readFileSync(path.join(ROOT, 'js/sects/sect-signature-arts.js'), 'utf8');
    ok(sigSrc.includes('已可运功'), 'A8 秘艺卡指路运功栏');
    const src = fs.readFileSync(path.join(ROOT, 'js/sects/sect-art-channeling.js'), 'utf8');
    ok(!/冷却中|次数上限|配额/.test(src), 'A9 模块零配额句式');
    ok(!src.includes('confirm(') && !src.includes('alert('), 'A10 零浏览器原生弹窗');
}

// ---------- 沙箱：equipment.js + sect-art-channeling.js 全链 ----------
function makeSandbox() {
    const stt = { msgs: [] };
    const W = {
        SECT_SPECIFIC_ARTS: {
            '少林寺': [
                { id: 'art_shaolin_quan', name: '少林长拳', type: '拳掌', grade: '八品', tier: 1, bonus: { strength: 5 }, copyPrice: 300, desc: '少林入门拳法，刚猛朴实' },
                { id: 'art_yi_jin_jing', name: '易筋经', type: '内功', grade: '三品', tier: 4, wuxingReq: 28, bonus: { constitution: 15, willpower: 8 }, copyPrice: 3000, desc: '少林无上内功，脱胎换骨' }
            ],
            '武当派': [
                { id: 'art_wd_taiji_jian', name: '太极剑意', type: '剑法', grade: '三品', tier: 4, transmit: 'direct', wuxingReq: 26, bonus: { dexterity: 14, intelligence: 8 }, copyPrice: 3000, desc: '以意驭剑，绵绵不绝' }
            ],
            '药王谷': [
                { id: 'art_yw_dan', name: '药王丹经', type: '医术', grade: '三品', tier: 4, bonus: { intelligence: 11, constitution: 11 }, copyPrice: 3000, desc: '丹道医理合一的谷中绝学' }
            ]
        },
        discipleState: { isInSect: true, sectName: '少林寺', sectId: '少林寺', rank: 2, artInsights: {} },
        KnowledgeSystem: { canEquip: function () { return false; } },
        showMessage: function (m) { stt.msgs.push(String(m)); }
    };
    W.window = W;
    const sandbox = {
        window: W,
        console: { log: function () {} },
        Math: Math, Number: Number, String: String, JSON: JSON, Object: Object, Array: Array, Date: Date,
        localStorage: { getItem: function () { return null; }, setItem: function () {} }
    };
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/equipment.js'), 'utf8'), sandbox);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/sects/sect-art-channeling.js'), 'utf8'), sandbox);
    return { W: W, stt: stt };
}

// ---------- B · 结构折形 ----------
console.log('\n[B] 结构折形');
{
    const env = makeSandbox();
    const def = env.W.sectArtAsSkill('art_yi_jin_jing');
    ok(def && def.name === '易筋经' && def.type === '内功' && def.grade === '三品' && def._sectArt === true, 'B1 在表功法折得出运功栏认得的形');
    ok(def.effect.includes('体魄 +15') && def.effect.includes('心志 +8'), 'B2 效果文案写六维正名');
    ok(!/真气上限\+\d|防御\+\d|闪避\+\d/.test(def.effect), 'B3 效果文案避开装备入账口径（不双吃）');
    eq(env.W.sectArtAsSkill('art_not_exist'), null, 'B4 不在表里折不成形');
    ok(env.W.sectArtAsSkill('art_yi_jin_jing').effect.includes('当前 0%'), 'B5 文案带当前掌握度');
    env.W.discipleState.artInsights['art_yi_jin_jing'] = { m: 42 };
    ok(env.W.sectArtAsSkill('art_yi_jin_jing').effect.includes('当前 42%'), 'B6 掌握度涨了文案跟着涨');
}

// ---------- C · 运功资格 ----------
console.log('\n[C] 运功资格');
{
    const env = makeSandbox();
    eq(env.W.sectArtChannelable('art_yi_jin_jing'), false, 'C1 书没翻开（无掌握度账）不能运功');
    env.W.discipleState.artInsights['art_yi_jin_jing'] = { m: 0 };
    eq(env.W.sectArtChannelable('art_yi_jin_jing'), false, 'C2 掌握度为零仍不能运功');
    env.W.discipleState.artInsights['art_yi_jin_jing'] = { m: 1 };
    eq(env.W.sectArtChannelable('art_yi_jin_jing'), true, 'C3 参悟过一分即可运功');
    eq(env.W.sectArtChannelable('art_not_exist'), false, 'C4 不在表里的 id 一律不行');
    env.W.discipleState.artInsights['art_wd_taiji_jian'] = { m: 50 };
    const list = env.W.sectArtChannelList();
    eq(list.length, 2, 'C5 候选清单只列参悟过的（两门）');
    ok(list.some(d => d.id === 'art_wd_taiji_jian'), 'C6 别派功法参悟过也在列（掌握度账随人走）');
}

// ---------- D · 装备全链（走 equipment.js 真入口） ----------
console.log('\n[D] 装备全链');
{
    const env = makeSandbox();
    eq(env.W.equipSkill('art_yi_jin_jing', 'skill_main'), false, 'D1 没参悟装不上（掌握度是唯一凭据）');
    env.W.discipleState.artInsights['art_yi_jin_jing'] = { m: 60 };
    eq(env.W.equipSkill('art_yi_jin_jing', 'skill_main'), true, 'D2 参悟过：内功秘艺入主修槽');
    eq(env.W.currentSkills.skill_main.name, '易筋经', 'D3 槽里躺的是这门功法');
    eq(env.W.equipSkill('art_yi_jin_jing', 'skill_sub2'), false, 'D4 内功进不了绝技槽（槽位类型硬校验）');
    env.W.discipleState.artInsights['art_wd_taiji_jian'] = { m: 80 };
    eq(env.W.equipSkill('art_wd_taiji_jian'), true, 'D5 不指槽位：剑法自动归绝技槽');
    eq(env.W.currentSkills.skill_sub2.id, 'art_wd_taiji_jian', 'D6 太极剑意已在绝技槽');
    // 战斗中真的出得了招
    const moves = env.W.getActiveAttackMoves();
    const m1 = moves.filter(m => m.skillId === 'art_wd_taiji_jian');
    eq(m1.length, 2, 'D7 装备的剑意给出两招');
    ok(m1[0].name === '太极剑意·起手剑' && m1[1].name === '太极剑意·真传一剑', 'D8 招式名跟着功法走');
    eq(m1[1].damageMult, 1.65, 'D9 三品真传一式力度 1.65（tier4 档）');
    eq(m1[1].damageType, 'pierce', 'D10 剑招走 piercing 口径');
    eq(m1[1].qiCost, 22, 'D11 真传消耗真气 22（不白送）');
    ok(moves.every(m => m.skillId !== 'art_yi_jin_jing'), 'D12 内功无招（主修槽的所得在修炼吸纳，不在拳头）');
    // 常用栏候选也认门派招式
    const learned = env.W.getAllLearnedMoves();
    ok(learned.some(m => m.moveId === 'art_wd_taiji_jian_m1'), 'D13 常用栏管理列得出门派招式');
    ok(!learned.some(m => m.skillId === 'art_shaolin_quan'), 'D14 没参悟的功法招式不冒头');
    // 卸下
    env.W.unequipSkill('skill_sub2');
    eq(env.W.currentSkills.skill_sub2, null, 'D15 卸下即空');
}

// ---------- E · 招式力度分档 ----------
console.log('\n[E] 招式力度分档');
{
    const env = makeSandbox();
    const mv = env.W.sectArtMoves('art_shaolin_quan');
    eq(mv.length, 2, 'E1 八品入门拳法两招');
    ok(mv[0].name === '少林长拳·开山拳' && mv[1].name === '少林长拳·崩山掌', 'E2 拳掌招式名对路');
    eq(mv[0].damageMult, 1.05, 'E3 tier1 起手 1.05');
    eq(mv[1].damageMult, 1.35, 'E4 tier1 真传 1.35（一品阶一档）');
    eq(mv[0].damageType, 'blunt', 'E5 拳掌走钝击口径');
    const heal = env.W.sectArtMoves('art_yw_dan');
    eq(heal.length, 1, 'E6 医术一招回春');
    eq(heal[0].damageType, 'heal', 'E7 医招走治疗口径');
    const nj = env.W.sectArtMoves('art_yi_jin_jing');
    eq(nj.length, 0, 'E8 内功无招');
    // 注册幂等：重跑不重复挂
    const before = Object.keys(env.W.SKILL_ATTACK_MOVES).length;
    env.W.EventBus = { on: function () {} };
    const sbx2 = { window: env.W, console: { log: function () {} }, Math: Math, Number: Number, String: String, JSON: JSON, Object: Object, Array: Array, Date: Date };
    vm.createContext(sbx2);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/sects/sect-art-channeling.js'), 'utf8'), sbx2);
    eq(Object.keys(env.W.SKILL_ATTACK_MOVES).length, before, 'E9 重复加载不重复注册（幂等）');
}

// ---------- F · 读档迁移与探针 ----------
console.log('\n[F] 读档迁移与探针');
{
    const env = makeSandbox();
    // 读档场景：知识册全拒（canEquip false），门派功法凭结构查表放行
    env.W.migrateSkillsToThreeSlots({
        skill_main: { id: 'art_yi_jin_jing', name: '易筋经', type: '内功' },
        skill_sub2: { id: 'skill_99_fake', name: '假功法', type: '剑法' }
    });
    eq(env.W.currentSkills.skill_main.id, 'art_yi_jin_jing', 'F1 读档后门派主修还在（掌握度账未恢复也不误杀）');
    eq(env.W.currentSkills.skill_sub2, null, 'F2 知识册查无此功法照旧被清（老规矩不放松）');
    // findSkillById 兜底
    ok(env.W.findSkillById('art_wd_taiji_jian') && env.W.findSkillById('art_wd_taiji_jian').name === '太极剑意', 'F3 查功法兜底到门派表');
    eq(env.W.findSkillById('skill_01').name, '吐纳术', 'F4 流通五十门查法不变');
    // 探针
    env.W.discipleState.artInsights['art_shaolin_quan'] = { m: 10 };
    const p = env.W.sectArtChannelProbe();
    eq(p.totalArts, 4, 'F5 探针数得全表（四门）');
    eq(p.artsWithMoves, 3, 'F6 有招式的三门（内功无招）');
    eq(p.channelable, 1, 'F7 当前可运功一门');
}

console.log('\n========== sect-art-channeling: ' + pass + ' 通过, ' + fail + ' 失败 ==========');
process.exit(fail ? 1 : 0);
