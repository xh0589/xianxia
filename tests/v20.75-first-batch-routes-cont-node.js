#!/usr/bin/env node
/**
 * v20.75 第一批扩线（续）门禁（蓬莱·瀛晚照 pl / 逍遥·闻人酌 xy）
 * ① 两条新线达到与既有十二线同构的深度：12 主线事件（001~011+013）+ 6 结局 + 好感阶梯严格递增
 * ② 终章 5 岔路 + 伤透门槛落独立辜负结局；负选项 ≥3；精力价签走 _payCost 真源
 * ③ 接线齐全：固定人设表 / bond_dao 通用阶梯拦截 / 好感衰减名册 / HTML 加载序（逍遥线在男主人册创建之后）
 * ④ 吃醋全套同批接入：女主人册（蓬莱）/ 男主人册 push（逍遥）/ 对峙·和好·论交·回访 / 扩容包十四人
 * 运行：node tests/v20.75-first-batch-routes-cont-node.js
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
function run(rel, extraWindow) {
    const w = Object.assign({
        showMessage: function () {}, _negativeChoiceCount: {},
        _payCost: function () { return { ok: true }; }
    }, extraWindow || {});
    const sandbox = {
        window: w, console: { log() {}, warn() {}, error() {} },
        document: { querySelector: function () { return null; } },
        setTimeout: function () {}, NPC_PERSONAL_EVENTS: {},
        registerEndingSet: function (npcId, endings) { sandbox.__endingSet = { npcId, endings }; },
        registerEndingCallback: function (npcId, cb) { sandbox.__callback = { npcId, cb }; },
    };
    vm.createContext(sandbox);
    vm.runInContext(load(rel), sandbox, { filename: rel });
    return sandbox;
}

const ROUTES = [
    { file: 'js/npcs/penglai-events.js', prefix: 'PL', name: '瀛晚照', pfx: 'pl', sect: '蓬莱派',
      stayEnd: '话潮', badEnd: '沉璧', friendEnd: '泛舟', noneEnd: '空潮', daoEnds: ['同潮', '守岭'] },
    { file: 'js/npcs/xiaoyao-events.js', prefix: 'XY', name: '闻人酌', pfx: 'xy', sect: '逍遥派',
      stayEnd: '酒客', badEnd: '断弦', friendEnd: '对弈', noneEnd: '散席', daoEnds: ['携酒', '藏归'] },
];

for (const R of ROUTES) {
    const src = load(R.file);
    const sb = run(R.file);
    const events = sb.window[R.prefix + '_MAIN_EVENTS'];
    const endings = sb.window[R.prefix + '_ENDINGS'];
    const npcId = sb[R.prefix + '_NPC_ID'];
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
            const r = ev.effects({ relationship: { trust: 0 } }, opt.effect);
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
    sb.window._negativeChoiceCount = {};
    ok(fin.effects({}, 'friend_stay').ending === R.stayEnd, `${tag}: friend_stay 应落「${R.stayEnd}」`);
    ok(fin.effects({}, 'friend').ending === R.friendEnd, `${tag}: friend 应落「${R.friendEnd}」`);
    ok(fin.effects({}, 'none').ending === R.noneEnd, `${tag}: none 应落「${R.noneEnd}」（错过线）`);
    sb.window._negativeChoiceCount = {}; sb.window._negativeChoiceCount[npcId] = 3;
    ok(fin.effects({}, 'lover_travel').ending === R.badEnd, `${tag}: 伤透门槛应落独立辜负「${R.badEnd}」`);
    sb.window._negativeChoiceCount = {}; sb.window._negativeChoiceCount[npcId] = 2;
    ok(fin.effects({}, 'lover_travel').ending !== R.badEnd, `${tag}: 只伤两次仍够得着定情`);

    // 负选项 ≥3 + 精力价签走 _payCost 真源
    const negCount = (src.match(/aff(?:ection)? = -\d|affection: -\d/g) || []).length;
    ok(negCount >= 3, `${tag}: 真负选项应 ≥3 处（门槛可达），实到 ${negCount}`);
    const payCount = (src.match(/_payCost\('energy'/g) || []).length;
    ok(payCount >= 5, `${tag}: 精力价签应 ≥5 处，实到 ${payCount}`);
    ok(src.indexOf('.energy -=') < 0 && src.indexOf('cd.stones') < 0, `${tag}: 无精力/灵石旁路写入`);

    // 结局回调分账
    const cb = sb.__callback && sb.__callback.cb;
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

// ---- 逍遥线名册 push（男主侧） ----
const xySrc = load('js/npcs/xiaoyao-events.js');
ok(/MALE_LEAD_ROSTER[\s\S]{0,200}XY_NPC_ID[\s\S]{0,300}xy_event_rival/.test(xySrc), 'xiaoyao-events.js 末尾应守卫式 push 男主人册');
for (const f of ['eventId', 'reconcileId', 'femctxId', 'mctxId']) {
    ok(new RegExp(f + ": 'xy_event_").test(xySrc), `逍遥名册 push 应含 ${f}`);
}

// ---- 接线检查 ----
const sp = load('js/npcs/special-npcs.js');
ok(sp.includes("'sect_leader_蓬莱派'") && sp.includes('瀛晚照'), '固定人设表：瀛晚照在案');
ok(sp.includes("'sect_leader_逍遥派'") && sp.includes('闻人酌'), '固定人设表：闻人酌在案');
ok(/'sect_leader_蓬莱派'[\s\S]*gender: 'female'/.test(sp), '蓬莱人设性别 female');
ok(/'sect_leader_逍遥派'[\s\S]*gender: 'male'/.test(sp), '逍遥人设性别 male');

const ns = load('js/npcs/npc-system.js');
ok(ns.includes("npcId === 'sect_leader_蓬莱派'") && ns.includes('今晚的潮还没上来'), 'npc-system bond_dao 拦截：蓬莱在案');
ok(ns.includes("npcId === 'sect_leader_逍遥派'") && ns.includes('不执'), 'npc-system bond_dao 拦截：逍遥在案');

const pe = load('js/npcs/npc-personal-events.js');
ok(/coreIds = \[[\s\S]*?'sect_leader_蓬莱派'[\s\S]*?'sect_leader_逍遥派'[\s\S]*?\]/.test(pe), '好感衰减名册已含两位新主角');

const html = load('仙侠.html');
const iPersonal = html.indexOf('npc-personal-events.js');
const iPl = html.indexOf('js/npcs/penglai-events.js');
const iXy = html.indexOf('js/npcs/xiaoyao-events.js');
const iZhujian = html.indexOf('js/npcs/zhujian-events.js');
ok(iPl > iPersonal && iXy > iPersonal, 'HTML：两条新线在 npc-personal-events.js 之后加载');
ok(iXy > iZhujian, 'HTML：逍遥线在男主人册创建（zhujian-events.js）之后加载');
ok(html.indexOf('js/npcs/special-npcs.js') < iPl, 'HTML：固定人设表先于新线加载');

// ---- 吃醋全套（女主侧·蓬莱） ----
const hr = run('js/npcs/heroine-rivalry.js');
const plR = hr.HEROINE_ROSTER.find(h => h.id === 'sect_leader_蓬莱派');
ok(!!plR && plR.name === '瀛晚照' && plR.sect === '蓬莱派', '女主人册：瀛晚照条目');
ok(plR && plR.eventId === 'pl_event_rival' && plR.reconcileId === 'pl_event_reconcile'
   && plR.amId === 'pl_event_aftermath' && plR.finaleId === 'pl_event_013', '女主人册：蓬莱条目四 id 齐');
for (const [mapName, evId] of [['HEROINE_RIVALRY_EVENTS', 'pl_event_rival'], ['HEROINE_RECONCILE_EVENTS', 'pl_event_reconcile']]) {
    const ev = hr[mapName][evId];
    ok(!!ev, `${evId} 在案`);
    if (!ev) continue;
    const sel = ev.scenes.filter(s => s.speaker === 'player_select')[0];
    ok(sel && sel.options.length >= 3, `${evId} 应 ≥3 选项`);
    for (const opt of sel.options) {
        const npc = { id: 'sect_leader_蓬莱派', relationship: { trust: 0 } };
        const r = ev.effects(npc, opt.effect);
        ok(r && typeof r.affection === 'number' && r.msg.length > 10, `${evId}/${opt.effect} effects 非空`);
    }
}
const hb = run('js/npcs/heroine-rivalry-bridge.js', { npcManager: { getNPC: function () { return null; } } });
ok(!!hb.HEROINE_BRIDGE_EVENTS['pl_event_bridge'], 'pl_event_bridge 在案');
ok(!!(hb._BRIDGE_TIER_MSGS && hb._BRIDGE_TIER_MSGS['sect_leader_蓬莱派']), '_BRIDGE_TIER_MSGS 应有蓬莱档');
ok(/'sect_leader_蓬莱派' \? 'pl_event_bridge'/.test(load('js/npcs/heroine-rivalry-bridge.js')), '论交钩子链应含蓬莱分支');
const ha = run('js/npcs/heroine-aftermath.js');
const plAm = ha.AFTERMATH_EVENTS['pl_event_aftermath'];
ok(!!plAm && plAm.requireDaoCompanion === true && plAm.requireEventDone === 'pl_event_013', 'pl_event_aftermath 门禁：道侣 + 终章');
ok(load('js/npcs/heroine-aftermath.js').includes("amId: 'pl_event_aftermath'"), '回访兜底名册应含蓬莱');

// ---- 吃醋全套（男主侧·逍遥） ----
for (const [file, evId] of [
    ['js/npcs/male-lead-rivalry.js', 'xy_event_rival'],
    ['js/npcs/male-lead-reconcile.js', 'xy_event_reconcile'],
    ['js/npcs/male-lead-bridge.js', 'xy_event_bridge'],
    ['js/npcs/male-lead-aftermath.js', 'xy_event_aftermath']]) {
    const src = load(file);
    ok(src.includes(evId), `${file}: ${evId} 在案`);
    ok(src.includes("'sect_leader_逍遥派'"), `${file}: 钩子链应含逍遥分支`);
}
ok(/ML_BRIDGE_TIER_MSGS[\s\S]*'sect_leader_逍遥派'/.test(load('js/npcs/male-lead-bridge.js')), 'ML_BRIDGE_TIER_MSGS 应有逍遥档');
ok(load('js/npcs/male-lead-aftermath.js').includes("'xy_event_013'"), 'xy_event_aftermath 串联终章 xy_event_013');

// ---- 吃醋扩容包（十四人） ----
const jd = run('js/npcs/jealousy-deep.js');
ok(jd.JEALOUSY_SEC_PREFIX['蓬莱派'] === 'pl' && jd.JEALOUSY_SEC_PREFIX['逍遥派'] === 'xy', '扩容包前缀表应含 蓬莱派:pl / 逍遥派:xy');
for (const mapName of ['JEALOUSY_PROBE_EVENTS', 'JEALOUSY_COLD_EVENTS', 'JEALOUSY_SULK_EVENTS', 'JEALOUSY_AFTERMATH_EVENTS', 'JEALOUSY_NEGLECT_EVENTS']) {
    ok(Object.keys(jd[mapName]).length >= 14, `${mapName} 应至少十四桩，实到 ${Object.keys(jd[mapName]).length}`);
    for (const p of ['pl', 'xy']) {
        const key = p + (mapName === 'JEALOUSY_AFTERMATH_EVENTS' ? '_event_after' : mapName === 'JEALOUSY_PROBE_EVENTS' ? '_event_probe'
            : mapName === 'JEALOUSY_COLD_EVENTS' ? '_event_cold' : mapName === 'JEALOUSY_SULK_EVENTS' ? '_event_sulk' : '_event_neglect');
        ok(!!jd[mapName][key], `${mapName}.${key} 在案`);
    }
}
const FESTS = ['shangyuan', 'qixi', 'zhongqiu', 'chuxi'];
for (const sid of ['sect_leader_蓬莱派', 'sect_leader_逍遥派']) {
    ok(FESTS.every(f => (jd.JEAL_AFTER_NARR[sid] || {})[f]), `${sid} 余波四节文案全`);
    ok(jd.JEAL_AFTER_STATUS[sid] && jd.JEAL_AFTER_STATUS[sid].declined && jd.JEAL_AFTER_STATUS[sid].stood, `${sid} 余波 declined/stood 全`);
    ok((jd.JEAL_AFTER_SPENT[sid] || '').includes('{rival}'), `${sid} 余波 spent 句含 {rival}`);
    const ch = jd.JEAL_AFTER_CHOICES[sid];
    ok(!!ch && ch.options.length === 3, `${sid} 余波 3 选项`);
    if (ch) for (const opt of ch.options) {
        const npc = { id: sid, relationship: { trust: 0 }, memory: { _jealAfterCtx: { fkey: 'qixi_x', status: 'stood', spentName: null } } };
        const r = ch.effects(npc, opt.effect, npc.memory._jealAfterCtx);
        ok(r && typeof r.affection === 'number' && r.msg.length > 10, `${sid} 余波 ${opt.effect} effects 非空`);
    }
    ok(['narr', 'speak', 'vow', 'deflect'].every(k => (jd.JEAL_NEGLECT[sid] || {})[k]), `${sid} 被晾四键全`);
    ok(jd.JEAL_LETTER[sid] && jd.JEAL_LETTER[sid].declined && jd.JEAL_LETTER[sid].stood, `${sid} 飞鸽信 declined/stood 全`);
    ok((jd.JEAL_LETTER_SPENT[sid] || '').includes('{rival}'), `${sid} 飞鸽信 spent 追记含 {rival}`);
}

console.log(`\n========== v20.75 第一批扩线（续）（蓬莱/逍遥）：${passed} 通过 / ${failed} 失败 ==========`);
process.exit(failed ? 1 : 0);
