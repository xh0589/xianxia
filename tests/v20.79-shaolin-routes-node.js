#!/usr/bin/env node
/**
 * v20.79 第五批少林收官门禁（少林寺·竺照禅 shao 常规线 / 破戒僧·无咎 wujiu 特殊紧凑线）
 * ① 竺照禅线达到与既有三十五线同构深度：12 主线事件（001~011+013）+ 6 结局 + 档位严格递增
 * ② 无咎特殊紧凑线：8 事件（001~008）+ 3 结局（还俗/守灶/空钵）+ 档位 12/20/30/40/50/62/74/85
 * ③ 两线终章岔路 + 辜负门槛（竺）/ 三岔路（无咎）；负选项；精力价签走 _payCost 真源
 * ④ 接线齐全：固定人设表（竺照禅后键覆盖释玄慈 + 无咎独立特殊NPC条目）/ bond_dao 双拦截 /
 *    好感衰减名册 37 条 / HTML 加载序
 * ⑤ 吃醋全套：女主人册第 20 条（竺照禅）/ 对峙·和好·论交·回访 / 扩容包三十六人 144 桩；
 *    无咎为特殊紧凑线，不入任何名册（断言两线文件零 MALE_LEAD_ROSTER/HEROINE_ROSTER）
 * 运行：node tests/v20.79-shaolin-routes-node.js
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

// ================= ① 竺照禅常规线（12/6，与既有三十五线同构） =================
{
    const R = { file: 'js/npcs/shaolin-events.js', prefix: 'SHAO', name: '竺照禅', pfx: 'shao', sect: '少林寺',
                stayEnd: '寄批', badEnd: '骂绝', friendEnd: '禅契', noneEnd: '空页', daoEnds: ['行脚', '同念'] };
    const src = load(R.file);
    const sb = run(R.file);
    const events = sb.window[R.prefix + '_MAIN_EVENTS'];
    const endings = sb.window[R.prefix + '_ENDINGS'];
    const npcId = sb[R.prefix + '_NPC_ID'] || sb.window[R.prefix + '_NPC_ID'];
    const tag = R.name;

    ok(npcId === 'sect_leader_少林寺', `${tag}: npcId 应为 sect_leader_少林寺`);
    ok(events && Object.keys(events).length === 12, `${tag}: 主线事件应 12 个，实到 ${events ? Object.keys(events).length : 0}`);
    ok(endings && Object.keys(endings).length === 6, `${tag}: 结局应 6 个`);

    const order = ['001','002','003','004','005','006','007','008','009','010','011','013'];
    const ladder = [12,18,25,32,40,45,55,62,68,72,78,85];
    let prev = 0;
    for (let idx = 0; idx < order.length; idx++) {
        const no = order[idx];
        const ev = events[`${R.pfx}_event_${no}`];
        ok(!!ev, `${tag}: 缺事件 ${R.pfx}_event_${no}`);
        if (!ev) continue;
        ok(ev.minAffection === ladder[idx] && ev.minAffection > prev, `${tag}: ${no} 门槛应 ${ladder[idx]}，实到 ${ev.minAffection}`);
        prev = ev.minAffection;
        ok(ev.flag === `${R.pfx}_e${no}_done`, `${tag}: ${no} flag 命名应一致`);
        const sel = ev.scenes.filter(s => s.speaker === 'player_select');
        ok(sel.length === 1 && sel[0].options.length >= 3, `${tag}: ${no} 应有 ≥3 个选项`);
        for (const opt of sel[0].options) {
            const r = ev.effects({ relationship: { trust: 0 } }, opt.effect);
            ok(r && typeof r.affection === 'number' && typeof r.msg === 'string' && r.msg.length > 0,
                `${tag}: ${no}/${opt.effect} effects 应返回非空 {affection,msg}`);
        }
    }

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
    ok(fin.effects({}, 'none').ending === R.noneEnd, `${tag}: none 应落「${R.noneEnd}」`);
    sb.window._negativeChoiceCount = {}; sb.window._negativeChoiceCount[npcId] = 3;
    ok(fin.effects({}, 'lover_travel').ending === R.badEnd, `${tag}: 伤透门槛应落独立辜负「${R.badEnd}」`);
    sb.window._negativeChoiceCount = {}; sb.window._negativeChoiceCount[npcId] = 2;
    ok(fin.effects({}, 'lover_travel').ending !== R.badEnd, `${tag}: 只伤两次仍够得着定情`);

    const negCount = (src.match(/aff(?:ection)? = -\d|affection: -\d/g) || []).length;
    ok(negCount >= 3, `${tag}: 真负选项应 ≥3 处，实到 ${negCount}`);
    const payCount = (src.match(/_payCost\('energy'/g) || []).length;
    ok(payCount >= 5, `${tag}: 精力价签应 ≥5 处，实到 ${payCount}`);
    ok(src.indexOf('.energy -=') < 0 && src.indexOf('cd.stones') < 0, `${tag}: 无精力/灵石旁路写入`);

    const cb = sb.__callback && sb.__callback.cb;
    ok(typeof cb === 'function', `${tag}: 应注册结局回调`);
    if (cb) {
        const mk = () => ({ relationship: { trust: 0 }, setFlag(f) { this['_' + f] = true; }, hasFlag(f) { return !!this['_' + f]; } });
        for (const de of R.daoEnds) { const n = mk(); cb(de, n); ok(n.hasFlag('dao_companion'), `${tag}: ${de} 应落道侣旗`); }
        for (const fe of [R.friendEnd, R.stayEnd]) {
            const n = mk(); cb(fe, n);
            ok(n.relationship.trust === 30 && !n.hasFlag('dao_companion'), `${tag}: ${fe} 加信任不落道侣旗`);
        }
        const n = mk(); cb(R.badEnd, n);
        ok(!n.hasFlag('dao_companion') && n.relationship.trust === 0, `${tag}: ${R.badEnd} 无增益`);
    }

    ok(src.includes(`${R.pfx}_event_femctx`) && src.includes(`${R.pfx}_event_mctx`), `${tag}: femctx/mctx 成对`);
    ok(src.includes('requirePlayerFemale: true') && src.includes('requirePlayerMale: true'), `${tag}: 性别互斥门禁在案`);
    ok(typeof sb.window.maybeAutoTriggerShaoEvent === 'function', `${tag}: 每日钩子在案`);
    ok(!/MALE_LEAD_ROSTER/.test(src), `${tag}: 女主线不得出现男主人册`);
    // motif 纪律：朱笔（阎罗殿专属）/木鱼/抄经纸（恒山专属）/百衲衣/青布（嵩山专属）零出现
    for (const banned of ['朱笔', '木鱼', '抄经纸', '百衲衣', '青布', '生死簿']) {
        ok(!src.includes(banned), `${tag}: 禁用 motif「${banned}」零出现`);
    }
}

// ================= ② 无咎特殊紧凑线（8/3） =================
{
    const src = load('js/npcs/shaolin-pojie-events.js');
    const sb = run('js/npcs/shaolin-pojie-events.js');
    const events = sb.window.WUJIU_MAIN_EVENTS;
    const endings = sb.window.WUJIU_ENDINGS;
    const npcId = sb.window.WUJIU_NPC_ID;
    const tag = '无咎';

    ok(npcId === 'shaolin_wujiu', `${tag}: npcId 应为 shaolin_wujiu（独立 NPC 非掌门位）`);
    ok(events && Object.keys(events).length === 8, `${tag}: 主线应 8 个（femctx/mctx 另表），实到 ${events ? Object.keys(events).length : 0}`);
    ok(endings && Object.keys(endings).length === 3, `${tag}: 结局应 3 个`);

    const ladder = [12,20,30,40,50,62,74,85];
    let prev = 0;
    for (let i = 1; i <= 8; i++) {
        const no = String(i).padStart(3, '0');
        const ev = events[`wujiu_event_${no}`];
        ok(!!ev, `${tag}: 缺事件 wujiu_event_${no}`);
        if (!ev) continue;
        ok(ev.minAffection === ladder[i - 1] && ev.minAffection > prev, `${tag}: ${no} 门槛应 ${ladder[i - 1]}，实到 ${ev.minAffection}`);
        prev = ev.minAffection;
        ok(ev.flag === `wujiu_e${no}_done`, `${tag}: ${no} flag 命名应一致`);
        const sel = ev.scenes.filter(s => s.speaker === 'player_select');
        ok(sel.length === 1 && sel[0].options.length >= 3, `${tag}: ${no} 应有 ≥3 个选项`);
        for (const opt of sel[0].options) {
            const r = ev.effects({ relationship: { trust: 0 } }, opt.effect);
            ok(r && typeof r.affection === 'number' && typeof r.msg === 'string' && r.msg.length > 0,
                `${tag}: ${no}/${opt.effect} effects 应返回非空 {affection,msg}`);
        }
    }

    const fin = events['wujiu_event_008'];
    ok(fin.endingMap && Object.keys(fin.endingMap).length === 3, `${tag}: endingMap 应 3 路线`);
    for (const [route, eid] of Object.entries(fin.endingMap)) {
        ok(!!endings[eid] && endings[eid].route === route, `${tag}: ${eid} 应与 endingMap 键一致`);
        ok(endings[eid] && endings[eid].scenes.length >= 3 && !!endings[eid].finalText, `${tag}: ${eid} 演出应 ≥3 幕 + finalText`);
    }
    const finSel = fin.scenes.filter(s => s.speaker === 'player_select')[0];
    ok(finSel.options.length === 3, `${tag}: 终章应 3 岔路，实到 ${finSel.options.length}`);
    sb.window._negativeChoiceCount = {};
    ok(fin.effects({}, 'lover').ending === '还俗', `${tag}: lover 应落「还俗」`);
    ok(fin.effects({}, 'friend').ending === '守灶', `${tag}: friend 应落「守灶」`);
    ok(fin.effects({}, 'none').ending === '空钵', `${tag}: none 应落「空钵」`);

    const negCount = (src.match(/aff(?:ection)? = -\d|affection: -\d/g) || []).length;
    ok(negCount >= 2, `${tag}: 真负选项应 ≥2 处，实到 ${negCount}`);
    const payCount = (src.match(/_payCost\('energy'/g) || []).length;
    ok(payCount >= 4, `${tag}: 精力价签应 ≥4 处，实到 ${payCount}`);
    ok(src.indexOf('.energy -=') < 0 && src.indexOf('cd.stones') < 0, `${tag}: 无精力/灵石旁路写入`);

    const cb = sb.__callback && sb.__callback.cb;
    ok(typeof cb === 'function', `${tag}: 应注册结局回调`);
    if (cb) {
        const mk = () => ({ relationship: { trust: 0 }, setFlag(f) { this['_' + f] = true; }, hasFlag(f) { return !!this['_' + f]; } });
        const n1 = mk(); cb('还俗', n1);
        ok(n1.hasFlag('dao_companion'), `${tag}: 还俗应落道侣旗`);
        const n2 = mk(); cb('守灶', n2);
        ok(n2.relationship.trust === 30 && !n2.hasFlag('dao_companion'), `${tag}: 守灶加信任不落道侣旗`);
        const n3 = mk(); cb('空钵', n3);
        ok(!n3.hasFlag('dao_companion') && n3.relationship.trust === 0, `${tag}: 空钵无增益`);
    }

    ok(src.includes('wujiu_event_femctx') && src.includes('wujiu_event_mctx'), `${tag}: femctx/mctx 成对`);
    ok(src.includes('requirePlayerFemale: true') && src.includes('requirePlayerMale: true'), `${tag}: 性别互斥门禁在案`);
    ok(typeof sb.window.maybeAutoTriggerWujiuEvent === 'function', `${tag}: 每日钩子在案`);
    ok(!/MALE_LEAD_ROSTER|HEROINE_ROSTER/.test(src), `${tag}: 特殊线不入任何名册`);
    for (const banned of ['酒葫芦', '酒坛', '酒盏', '顶针', '木鱼', '朱笔']) {
        ok(!src.includes(banned), `${tag}: 禁用 motif「${banned}」零出现`);
    }
}

// ================= ③ 接线检查 =================
const sp = load('js/npcs/special-npcs.js');
ok(sp.includes("'sect_leader_少林寺'") && sp.includes('竺照禅'), '固定人设表：竺照禅在案');
ok(sp.includes('shaolin_wujiu') && sp.includes('无咎'), '特殊NPC表：无咎独立条目在案');
ok(/v20\.79[\s\S]{0,400}竺照禅/.test(sp), '固定人设表：v20.79 并存注释在案');
{
    // 后键覆盖：竺照禅卡应在释玄慈卡之后（对象字面量后键生效）
    const iXuan = sp.indexOf("name: '释玄慈'");
    const iZhao = sp.indexOf("name: '竺照禅'");
    ok(iXuan > 0 && iZhao > iXuan, '竺照禅卡应位于释玄慈卡之后（后键覆盖，同武当先例）');
}

const ns = load('js/npcs/npc-system.js');
ok(ns.includes("npcId === 'sect_leader_少林寺'") && ns.includes('骂不出'), 'npc-system bond_dao 拦截：竺照禅在案（骂不出）');
ok(ns.includes("npcId === 'shaolin_wujiu'") && ns.includes('第五百零一条戒'), 'npc-system bond_dao 拦截：无咎在案（第五百零一条戒）');

const pe = load('js/npcs/npc-personal-events.js');
ok(/coreIds = \[[\s\S]*?'sect_leader_少林寺'[\s\S]*?'shaolin_wujiu'[\s\S]*?\]/.test(pe), '好感衰减名册已含竺照禅与无咎');

const html = load('仙侠.html');
const iPersonal = html.indexOf('npc-personal-events.js');
const iSpecial = html.indexOf('js/npcs/special-npcs.js');
const iQuanzhen = html.indexOf('js/npcs/quanzhen-events.js');
const iRivalry = html.indexOf('js/npcs/male-lead-rivalry.js');
for (const f of ['shaolin-events.js', 'shaolin-pojie-events.js']) {
    const i = html.indexOf('js/npcs/' + f);
    ok(i > 0, `HTML：${f} 已挂载`);
    ok(i > iPersonal && i > iSpecial, `HTML：${f} 在名册与人设表之后加载`);
    ok(i > iQuanzhen && i < iRivalry, `HTML：${f} 在第四批之后、男主吃醋文件之前加载`);
}

// ================= ④ 吃醋全套（竺照禅·女主侧第 20 位） =================
const hr = run('js/npcs/heroine-rivalry.js');
{
    const id = 'sect_leader_少林寺', pfx = 'shao';
    const h = hr.HEROINE_ROSTER.find(x => x.id === id);
    ok(!!h && h.name === '竺照禅' && h.sect === '少林寺', '女主人册：竺照禅条目');
    ok(hr.HEROINE_ROSTER.length === 20, `女主人册应 20 条，实到 ${hr.HEROINE_ROSTER.length}`);
    ok(h && h.eventId === pfx + '_event_rival' && h.reconcileId === pfx + '_event_reconcile'
       && h.amId === pfx + '_event_aftermath' && h.finaleId === pfx + '_event_013', '女主人册：少林寺条目四 id 齐');
    for (const [mapName, evId] of [['HEROINE_RIVALRY_EVENTS', pfx + '_event_rival'], ['HEROINE_RECONCILE_EVENTS', pfx + '_event_reconcile']]) {
        const ev = hr[mapName][evId];
        ok(!!ev, `${evId} 在案`);
        if (!ev) continue;
        const sel = ev.scenes.filter(s => s.speaker === 'player_select')[0];
        ok(sel && sel.options.length >= 3, `${evId} 应 ≥3 选项`);
        for (const opt of sel.options) {
            const npc = { id: id, relationship: { trust: 0 } };
            const r = ev.effects(npc, opt.effect);
            ok(r && typeof r.affection === 'number' && r.msg.length > 10, `${evId}/${opt.effect} effects 非空`);
        }
    }
}
const hb = run('js/npcs/heroine-rivalry-bridge.js', { npcManager: { getNPC: function () { return null; } } });
const hbSrc = load('js/npcs/heroine-rivalry-bridge.js');
ok(!!hb.HEROINE_BRIDGE_EVENTS['shao_event_bridge'], 'shao_event_bridge 在案');
ok(!!(hb._BRIDGE_TIER_MSGS && hb._BRIDGE_TIER_MSGS['sect_leader_少林寺']), '_BRIDGE_TIER_MSGS 应有少林寺档');
ok(/'sect_leader_少林寺'\s*\?\s*'shao_event_bridge'/.test(hbSrc), '论交钩子链应含少林寺分支');
const ha = run('js/npcs/heroine-aftermath.js');
const haSrc = load('js/npcs/heroine-aftermath.js');
{
    const am = ha.AFTERMATH_EVENTS['shao_event_aftermath'];
    ok(!!am && am.requireDaoCompanion === true && am.requireEventDone === 'shao_event_013', 'shao_event_aftermath 门禁：道侣 + 终章');
    ok(haSrc.includes("amId: 'shao_event_aftermath'"), '回访兜底名册应含少林寺');
}

// ================= ⑤ 吃醋扩容包（三十六人 144 桩） =================
const jd = run('js/npcs/jealousy-deep.js');
ok(jd.JEALOUSY_SEC_PREFIX['少林寺'] === 'shao', '扩容包前缀表应含 少林寺:shao');
ok(Object.keys(jd.JEALOUSY_SEC_PREFIX).length === 36, `扩容包前缀表应 36 键，实到 ${Object.keys(jd.JEALOUSY_SEC_PREFIX).length}`);
for (const mapName of ['JEALOUSY_PROBE_EVENTS', 'JEALOUSY_COLD_EVENTS', 'JEALOUSY_SULK_EVENTS', 'JEALOUSY_AFTERMATH_EVENTS', 'JEALOUSY_NEGLECT_EVENTS']) {
    ok(Object.keys(jd[mapName]).length >= 36, `${mapName} 应至少三十六桩，实到 ${Object.keys(jd[mapName]).length}`);
    const key = 'shao' + (mapName === 'JEALOUSY_AFTERMATH_EVENTS' ? '_event_after' : mapName === 'JEALOUSY_PROBE_EVENTS' ? '_event_probe'
        : mapName === 'JEALOUSY_COLD_EVENTS' ? '_event_cold' : mapName === 'JEALOUSY_SULK_EVENTS' ? '_event_sulk' : '_event_neglect');
    ok(!!jd[mapName][key], `${mapName}.${key} 在案`);
}
{
    const sid = 'sect_leader_少林寺';
    const FESTS = ['shangyuan', 'qixi', 'zhongqiu', 'chuxi'];
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

console.log(`\n========== v20.79 第五批少林收官（竺照禅常规线 + 无咎特殊线）：${passed} 通过 / ${failed} 失败 ==========`);
process.exit(failed ? 1 : 0);
