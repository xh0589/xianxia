#!/usr/bin/env node
/**
 * v20.72 重点门派扩线门禁（峨眉·夙孤鸿 / 华山·竺听雨）
 * ① 两条新线达到与既有八线同构的深度：12 主线事件（001~011+013）+ 6 结局 + 好感阶梯严格递增
 * ② 终章 5 岔路：道侣·同行 / 道侣·归隐 / 挚友·同行 / 挚友·归隐(friend_stay) / 错过；伤透门槛落独立辜负结局
 * ③ 负选项 ≥3 处（无吃醋包也能攒满伤透门槛）；精力价签走 _payCost 真源
 * ④ 接线齐全：固定人设表 / bond_dao 通用阶梯拦截 / 好感衰减名册 / HTML 加载序
 * 运行：node tests/v20.72-new-lead-routes-node.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');

let passed = 0, failed = 0;
function ok(cond, msg) {
    if (cond) passed++;
    else { failed++; console.log('[FAIL] ' + msg); }
}
function load(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

const ROUTES = [
    { file: 'js/npcs/emei-events.js', prefix: 'EM', name: '夙孤鸿', pfx: 'em', sect: '峨眉派',
      stayEnd: '云客', badEnd: '封剑', friendEnd: '斗剑', noneEnd: '孤峰', daoEnds: ['飞鸿', '云庐'] },
    { file: 'js/npcs/huashan-events.js', prefix: 'HS', name: '竺听雨', pfx: 'hs', sect: '华山派',
      stayEnd: '崖客', badEnd: '断崖', friendEnd: '松风', noneEnd: '孤云', daoEnds: ['携剑', '守崖'] },
];

for (const R of ROUTES) {
    const src = load(R.file);
    const captured = { callback: null, endingSet: null };
    const w = { showMessage: function () {}, _negativeChoiceCount: {} };
    const sandbox = {
        window: w, console: { log() {}, warn() {}, error() {} },
        registerEndingSet: function (npcId, endings) { captured.endingSet = { npcId, endings }; },
        registerEndingCallback: function (npcId, cb) { captured.callback = { npcId, cb }; },
    };
    vm.createContext(sandbox);
    vm.runInContext(src, sandbox, { filename: R.file });
    const events = w[R.prefix + '_MAIN_EVENTS'];
    const endings = w[R.prefix + '_ENDINGS'];
    const npcId = sandbox[R.prefix + '_NPC_ID'];
    const tag = R.name;

    ok(npcId === 'sect_leader_' + R.sect, `${tag}: npcId 应为 sect_leader_${R.sect}`);
    ok(events && Object.keys(events).length === 12, `${tag}: 主线事件应 12 个，实到 ${events ? Object.keys(events).length : 0}`);
    ok(endings && Object.keys(endings).length === 6, `${tag}: 结局应 6 个，实到 ${endings ? Object.keys(endings).length : 0}`);

    // 好感阶梯严格递增 + 结构合法
    const order = ['001','002','003','004','005','006','007','008','009','010','011','013'];
    let prev = 0;
    for (const no of order) {
        const ev = events[`${R.pfx}_event_${no}`];
        ok(!!ev, `${tag}: 缺事件 ${R.pfx}_event_${no}`);
        if (!ev) continue;
        ok(ev.minAffection > prev, `${tag}: ${no} 好感门槛 ${ev.minAffection} 应高于前档 ${prev}`);
        prev = ev.minAffection;
        ok(ev.flag === `${R.pfx}_e${no}_done`, `${tag}: ${no} flag 命名应一致`);
        const sel = ev.scenes.filter(s => s.speaker === 'player_select');
        ok(sel.length === 1 && sel[0].options.length >= 3, `${tag}: ${no} 应有 ≥3 个选项`);
        for (const opt of sel[0].options) {
            const r = ev.effects({}, opt.effect);
            ok(r && typeof r.affection === 'number' && typeof r.msg === 'string' && r.msg.length > 0,
                `${tag}: ${no}/${opt.effect} effects 应返回非空 {affection,msg}`);
            if (opt.item) ok(typeof opt.item === 'string', `${tag}: ${no}/${opt.effect} item 字段应为字符串`);
        }
    }
    ok(events[`${R.pfx}_event_013`].minAffection === 85, `${tag}: 终章门槛应 85`);

    // 终章 5 岔路 + endingMap 全覆盖 + 辜负门槛
    const fin = events[`${R.pfx}_event_013`];
    ok(fin.endingMap && Object.keys(fin.endingMap).length === 6, `${tag}: endingMap 应 6 路线`);
    for (const [route, eid] of Object.entries(fin.endingMap)) {
        ok(!!endings[eid] && endings[eid].route === route, `${tag}: ${eid} 应与 endingMap 键一致`);
        ok(endings[eid] && endings[eid].scenes.length >= 3 && !!endings[eid].finalText, `${tag}: ${eid} 演出应 ≥3 幕 + finalText`);
    }
    const finSel = fin.scenes.filter(s => s.speaker === 'player_select')[0];
    ok(finSel.options.length === 5, `${tag}: 终章应 5 岔路，实到 ${finSel.options.length}`);
    w._negativeChoiceCount = {};
    ok(fin.effects({}, 'friend_stay').ending === R.stayEnd, `${tag}: friend_stay 应落「${R.stayEnd}」`);
    ok(fin.effects({}, 'friend').ending === R.friendEnd, `${tag}: friend 应落「${R.friendEnd}」`);
    ok(fin.effects({}, 'none').ending === R.noneEnd, `${tag}: none 应落「${R.noneEnd}」（错过线，命名从女主线惯例）`);
    w._negativeChoiceCount = {}; w._negativeChoiceCount[npcId] = 3;
    ok(fin.effects({}, 'lover_travel').ending === R.badEnd, `${tag}: 伤透门槛应落独立辜负「${R.badEnd}」`);
    w._negativeChoiceCount = {}; w._negativeChoiceCount[npcId] = 2;
    ok(fin.effects({}, 'lover_travel').ending !== R.badEnd, `${tag}: 只伤两次仍够得着定情`);

    // 负选项 ≥3（辜负门槛可达）+ 精力价签走 _payCost 真源
    const negCount = (src.match(/aff(?:ection)? = -\d|affection: -\d/g) || []).length;
    ok(negCount >= 3, `${tag}: 真负选项应 ≥3 处（门槛可达），实到 ${negCount}`);
    const payCount = (src.match(/_payCost\('energy'/g) || []).length;
    ok(payCount >= 5, `${tag}: 精力价签应 ≥5 处，实到 ${payCount}`);
    ok(src.indexOf('.energy -=') < 0 && src.indexOf('cd.stones') < 0, `${tag}: 无精力/灵石旁路写入`);

    // 结局回调分账
    const cb = captured.callback && captured.callback.cb;
    ok(typeof cb === 'function', `${tag}: 应注册结局回调`);
    if (cb) {
        const mk = () => ({ relationship: { trust: 0 }, setFlag(f) { this['_' + f] = true; }, hasFlag(f) { return !!this['_' + f]; } });
        for (const de of R.daoEnds) {
            const n = mk(); cb(de, n);
            ok(n.hasFlag('dao_companion'), `${tag}: ${de} 应落道侣旗`);
        }
        for (const fe of [R.friendEnd, R.stayEnd]) {
            const n = mk(); cb(fe, n);
            ok(n.relationship.trust === 30 && !n.hasFlag('dao_companion'), `${tag}: ${fe} 加信任不落道侣旗`);
        }
        const n = mk(); cb(R.badEnd, n);
        ok(!n.hasFlag('dao_companion') && n.relationship.trust === 0, `${tag}: ${R.badEnd} 无增益`);
    }

    // 性别语境事件成对
    ok(src.includes(`${R.pfx}_event_femctx`) && src.includes(`${R.pfx}_event_mctx`), `${tag}: femctx/mctx 成对`);
    ok(src.includes('requirePlayerFemale: true') && src.includes('requirePlayerMale: true'), `${tag}: 性别互斥门禁在案`);
}

// ④ 接线检查
const sp = load('js/npcs/special-npcs.js');
ok(sp.includes("'sect_leader_峨眉派'") && sp.includes('夙孤鸿'), '固定人设表：夙孤鸿在案');
ok(sp.includes("'sect_leader_华山派'") && sp.includes('竺听雨'), '固定人设表：竺听雨在案');
ok(sp.includes("gender: 'female'") && /'sect_leader_华山派'[\s\S]*gender: 'male'/.test(sp), '两条人设性别字段正确');

const ns = load('js/npcs/npc-system.js');
ok(ns.includes("npcId === 'sect_leader_峨眉派'") && ns.includes('第七条还没刻'), 'npc-system bond_dao 拦截：峨眉在案');
ok(ns.includes("npcId === 'sect_leader_华山派'") && ns.includes('石壁上还差最后一笔'), 'npc-system bond_dao 拦截：华山在案');

const pe = load('js/npcs/npc-personal-events.js');
ok(/coreIds = \[[\s\S]*?'sect_leader_峨眉派'[\s\S]*?'sect_leader_华山派'[\s\S]*?\]/.test(pe), '好感衰减名册已含两位新主角');

const html = load('仙侠.html');
const iPersonal = html.indexOf('npc-personal-events.js');
const iEmei = html.indexOf('js/npcs/emei-events.js');
const iHuashan = html.indexOf('js/npcs/huashan-events.js');
ok(iEmei > iPersonal && iHuashan > iPersonal, 'HTML：两条新线在 npc-personal-events.js 之后加载');
ok(html.indexOf('js/npcs/special-npcs.js') < iEmei, 'HTML：固定人设表先于新线加载');

console.log(`\n========== v20.72 重点门派扩线：${passed} 通过 / ${failed} 失败 ==========`);
process.exit(failed ? 1 : 0);
