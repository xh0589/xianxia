#!/usr/bin/env node
/**
 * v20.73 新主角吃醋/和好全套接入门禁（峨眉·夙孤鸿 em / 华山·竺听雨 hs）
 * ① 女主侧：HEROINE_ROSTER 五人齐 + 名册补 amId/finaleId（道侣回访死路修通）
 *    em_event_rival / em_event_reconcile / em_event_bridge / em_event_aftermath 结构与效果真源
 *    _BRIDGE_TIER_MSGS 峨眉六档 + 钩子三元链含峨眉
 * ② 男主侧：huashan-events.js 守卫式 push MALE_LEAD_ROSTER（7 字段）
 *    hs_event_rival / hs_event_reconcile / hs_event_bridge / hs_event_aftermath 在案 + 各钩子链含华山
 *    ML_BRIDGE_TIER_MSGS 华山五档
 * ③ 扩容包：JEALOUSY_SEC_PREFIX 含 em/hs；probe/cold/after/sulk/neglect 十桩齐；
 *    JEAL_AFTER_NARR/STATUS/SPENT/CHOICES、JEAL_NEGLECT、JEAL_LETTER/LETTER_SPENT 两位新主角文案全
 *    每类事件 effects 全分支返回 {affection:number, msg:非空 string}
 * 运行：node tests/v20.73-jealousy-expansion-node.js
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
        showMessage: function () {}, console: { log() {}, warn() {}, error() {} }
    }, extraWindow || {});
    const sandbox = {
        window: w, console: { log() {}, warn() {}, error() {} },
        document: { querySelector: function () { return null; } },
        setTimeout: function () {}, NPC_PERSONAL_EVENTS: {}
    };
    vm.createContext(sandbox);
    vm.runInContext(load(rel), sandbox, { filename: rel });
    return sandbox;
}

const EM = 'sect_leader_峨眉派', HS = 'sect_leader_华山派';
const FESTS = ['shangyuan', 'qixi', 'zhongqiu', 'chuxi'];

// ---- ① 女主侧 ----
const hr = run('js/npcs/heroine-rivalry.js');
const roster = hr.HEROINE_ROSTER;
ok(Array.isArray(roster) && roster.length >= 5, 'HEROINE_ROSTER 应至少五人，实到 ' + (roster ? roster.length : 0));
const emR = roster.find(h => h.id === EM);
ok(!!emR && emR.name === '夙孤鸿' && emR.sect === '峨眉派', '名册：夙孤鸿条目（sect 须严格等于地点串「峨眉派」）');
for (const h of roster) {
    ok(!!h.amId && !!h.finaleId, `名册 ${h.id} 应带 amId/finaleId（道侣回访钩子真源）`);
}
ok(emR && emR.eventId === 'em_event_rival' && emR.reconcileId === 'em_event_reconcile', '名册：夙孤鸿 eventId/reconcileId 指向正确');

const rival = hr.HEROINE_RIVALRY_EVENTS['em_event_rival'];
ok(!!rival, 'em_event_rival 在案');
if (rival) {
    ok(rival.npcId === EM && rival.minAffection === 45 && rival.flag === 'em_e_rival_done', 'em_event_rival 基本字段');
    ok(rival.requireRivalRomance === true, 'em_event_rival 须有情敌门禁');
    const sel = rival.scenes.filter(s => s.speaker === 'player_select')[0];
    ok(sel && sel.options.length === 3, 'em_event_rival 应 3 选项');
    for (const daoFlag of [false, true]) {
        const sb = run('js/npcs/heroine-rivalry.js', {
            detectRivalRomance: function () { return { id: 'x', name: '某人', sect: '百花谷', isDaoCompanion: daoFlag }; }
        });
        const ev = sb.HEROINE_RIVALRY_EVENTS['em_event_rival'];
        for (const opt of sel.options) {
            const npc = { id: EM, relationship: { trust: 0 } };
            const r = ev.effects(npc, opt.effect);
            ok(r && typeof r.affection === 'number' && typeof r.msg === 'string' && r.msg.length > 10,
                `em_event_rival/${opt.effect} (dao=${daoFlag}) effects 应返回非空 {affection,msg}`);
        }
    }
}
const recon = hr.HEROINE_RECONCILE_EVENTS['em_event_reconcile'];
ok(!!recon, 'em_event_reconcile 在案');
if (recon) {
    ok(recon.minAffection === 55 && recon.requireEventDone === 'em_event_rival' && recon.flag === 'em_e_reconcile_done', 'em_event_reconcile 门槛串联对峙');
    const sel = recon.scenes.filter(s => s.speaker === 'player_select')[0];
    ok(sel && sel.options.length === 3, 'em_event_reconcile 应 3 选项');
    for (const opt of sel.options) {
        const npc = { id: EM, relationship: { trust: 0 } };
        const r = recon.effects(npc, opt.effect);
        ok(r && typeof r.affection === 'number' && typeof r.msg === 'string' && r.msg.length > 10,
            `em_event_reconcile/${opt.effect} effects 应返回非空 {affection,msg}`);
    }
}

const hb = run('js/npcs/heroine-rivalry-bridge.js', {
    npcManager: { getNPC: function () { return null; } }
});
const bridge = hb.HEROINE_BRIDGE_EVENTS['em_event_bridge'];
ok(!!bridge, 'em_event_bridge 在案');
if (bridge) {
    ok(bridge.minAffection === 50 && bridge.requireEventDone === 'em_event_rival' && bridge.flag === 'em_e_bridge_cd', 'em_event_bridge 基本字段');
    ok(bridge.cooldown === hb.BRIDGE_COOLDOWN_DAYS, 'em_event_bridge 冷却应走 BRIDGE_COOLDOWN_DAYS');
    const sel = bridge.scenes.filter(s => s.speaker === 'player_select')[0];
    ok(sel && sel.options.map(o => o.effect).join(',') === 'mediate,convey,leave', 'em_event_bridge 选项 effect 应为 mediate/convey/leave');
}
const tiers = hb._BRIDGE_TIER_MSGS && hb._BRIDGE_TIER_MSGS[EM];
ok(!!tiers, '_BRIDGE_TIER_MSGS 应有峨眉档');
if (tiers) {
    for (const t of ['enemy_ease', 'enemy_leave', 'neutral_warm', 'friend_form', 'friend_deepen', 'intimate']) {
        ok(typeof tiers[t] === 'function' && tiers[t]('某某').length > 10, `峨眉论交档 ${t} 文案应非空`);
    }
}
const hbSrc = load('js/npcs/heroine-rivalry-bridge.js');
ok(/'sect_leader_峨眉派' \? 'em_event_bridge'/.test(hbSrc), '论交每日钩子三元链应含峨眉分支');

const ha = run('js/npcs/heroine-aftermath.js');
const am = ha.AFTERMATH_EVENTS['em_event_aftermath'];
ok(!!am, 'em_event_aftermath 在案');
if (am) {
    ok(am.minAffection === 80 && am.requireDaoCompanion === true && am.requireEventDone === 'em_event_013', 'em_event_aftermath 门禁：道侣 + 终章已发生');
    const sel = am.scenes.filter(s => s.speaker === 'player_select')[0];
    ok(sel && sel.options.length === 3, 'em_event_aftermath 应 3 选项');
    for (const opt of sel.options) {
        const npc = { id: EM, relationship: { trust: 0 } };
        const r = am.effects(npc, opt.effect);
        ok(r && typeof r.affection === 'number' && r.msg.length > 10 && npc.relationship.trust === 5,
            `em_event_aftermath/${opt.effect} effects 应回非空且 trust+5`);
    }
}
const haSrc = load('js/npcs/heroine-aftermath.js');
ok(haSrc.includes("amId: 'em_event_aftermath', finaleId: 'em_event_013'"), '回访兜底名册应含峨眉');

// ---- ② 男主侧 ----
const hsSrc = load('js/npcs/huashan-events.js');
ok(/MALE_LEAD_ROSTER\s*&&[\s\S]{0,80}\.push\(\{[\s\S]{0,40}HS_NPC_ID/.test(hsSrc.replace(/\n/g, ' ').replace(/\s+/g, ' ')) ||
   /MALE_LEAD_ROSTER[\s\S]{0,200}HS_NPC_ID[\s\S]{0,300}hs_event_rival/.test(hsSrc), 'huashan-events.js 末尾应守卫式 push 名册');
for (const f of ['eventId', 'reconcileId', 'femctxId', 'mctxId']) {
    ok(new RegExp(f + ": 'hs_event_").test(hsSrc), `名册 push 应含 ${f}`);
}
const ml = [
    ['js/npcs/male-lead-rivalry.js', 'hs_event_rival'],
    ['js/npcs/male-lead-reconcile.js', 'hs_event_reconcile'],
    ['js/npcs/male-lead-bridge.js', 'hs_event_bridge'],
    ['js/npcs/male-lead-aftermath.js', 'hs_event_aftermath']
];
for (const [file, evId] of ml) {
    const src = load(file);
    ok(src.includes(evId), `${file}: ${evId} 在案`);
    ok(src.includes("'sect_leader_华山派'"), `${file}: 钩子链应含华山分支`);
}
const mlbSrc = load('js/npcs/male-lead-bridge.js');
ok(/ML_BRIDGE_TIER_MSGS[\s\S]*'sect_leader_华山派'/.test(mlbSrc), 'ML_BRIDGE_TIER_MSGS 应有华山档');
for (const t of ['enemy_ease', 'neutral_warm', 'friend_form', 'friend_deepen', 'intimate']) {
    ok(mlbSrc.includes(t + ':'), `华山论交档 ${t} 在案（文件级）`);
}
const mlaSrc = load('js/npcs/male-lead-aftermath.js');
ok(mlaSrc.includes("'hs_event_013'"), 'hs_event_aftermath 串联终章 hs_event_013');

// ---- ③ 扩容包 ----
const jd = run('js/npcs/jealousy-deep.js');
ok(jd.JEALOUSY_SEC_PREFIX['峨眉派'] === 'em' && jd.JEALOUSY_SEC_PREFIX['华山派'] === 'hs', '前缀表应含 峨眉派:em / 华山派:hs');
const CATS = [
    ['JEALOUSY_PROBE_EVENTS', ['em_event_probe', 'hs_event_probe'], ['tell', 'reassure', 'deflect']],
    ['JEALOUSY_COLD_EVENTS', ['em_event_cold', 'hs_event_cold'], ['vow', 'accept', 'argue']],
    ['JEALOUSY_SULK_EVENTS', ['em_event_sulk', 'hs_event_sulk'], null]
];
for (const [mapName, ids, effectsList] of CATS) {
    const map = jd[mapName];
    ok(map && Object.keys(map).length >= 10, `${mapName} 应至少十桩，实到 ${map ? Object.keys(map).length : 0}`);
    for (const id of ids) {
        const ev = map && map[id];
        ok(!!ev, `${mapName}.${id} 在案`);
        if (!ev) continue;
        ok(ev.requireRivalRomance === true, `${id} 须有情敌门禁`);
        if (id.endsWith('_cold')) ok(ev.requireEventDone === id.replace('_cold', '_probe'), `${id} 应串联试探`);
        const sel = ev.scenes.filter(s => s.speaker === 'player_select')[0];
        const opts = sel ? sel.options : [];
        ok(opts.length >= 2, `${id} 应 ≥2 选项`);
        for (const opt of opts) {
            if (effectsList) ok(effectsList.includes(opt.effect), `${id} 选项 effect ${opt.effect} 应在固定集内`);
            const npc = { id: ev.npcId, relationship: { trust: 0 }, memory: {} };
            const r = ev.effects(npc, opt.effect);
            ok(r && typeof r.affection === 'number' && typeof r.msg === 'string' && r.msg.length > 10,
                `${id}/${opt.effect} effects 应返回非空 {affection,msg}`);
        }
    }
}
for (const id of ['em_event_after', 'hs_event_after']) {
    const ev = jd.JEALOUSY_AFTERMATH_EVENTS[id];
    ok(!!ev && ev.requireFestivalWound === true && ev.ambient === true && ev.repeatEvery === 60, `${id} 余波桩结构（festivalWound/ambient/60）`);
}
ok(Object.keys(jd.JEALOUSY_AFTERMATH_EVENTS).length >= 10, '余波注册表应至少十桩');
for (const id of ['em_event_neglect', 'hs_event_neglect']) {
    const ev = jd.JEALOUSY_NEGLECT_EVENTS[id];
    ok(!!ev && ev.requireDaoCompanion === true && ev.repeatEvery === jd.JEAL_NEGLECT_DAYS, `${id} 被晾桩结构`);
}
ok(Object.keys(jd.JEALOUSY_NEGLECT_EVENTS).length >= 10, '被晾注册表应至少十桩');

for (const sid of [EM, HS]) {
    const narr = jd.JEAL_AFTER_NARR[sid];
    ok(!!narr && FESTS.every(f => typeof narr[f] === 'string' && narr[f].length > 10), `${sid} 余波四节文案全`);
    const st = jd.JEAL_AFTER_STATUS[sid];
    ok(!!st && st.declined && st.declined.length > 10 && st.stood && st.stood.length > 10, `${sid} 余波 declined/stood 开口白全`);
    ok(typeof jd.JEAL_AFTER_SPENT[sid] === 'string' && jd.JEAL_AFTER_SPENT[sid].includes('{rival}'), `${sid} 余波 spent 句含 {rival}`);
    const ch = jd.JEAL_AFTER_CHOICES[sid];
    ok(!!ch && ch.options.length === 3 && ch.options.map(o => o.effect).join(',') === 'vow,present,argue', `${sid} 余波选项 vow/present/argue`);
    if (ch) {
        for (const spent of [null, '某人']) {
            for (const opt of ch.options) {
                const npc = { id: sid, relationship: { trust: 0 }, memory: { _jealAfterCtx: { fkey: 'qixi_x', status: 'stood', spentName: spent } } };
                const r = ch.effects(npc, opt.effect, npc.memory._jealAfterCtx);
                ok(r && typeof r.affection === 'number' && r.msg.length > 10, `${sid} 余波 ${opt.effect}(spent=${spent}) effects 非空`);
            }
        }
    }
    const ng = jd.JEAL_NEGLECT[sid];
    ok(!!ng && ['narr', 'speak', 'vow', 'deflect'].every(k => typeof ng[k] === 'string' && ng[k].length > 10), `${sid} 被晾四键文案全`);
    const lt = jd.JEAL_LETTER[sid];
    ok(!!lt && lt.declined && lt.declined.length > 10 && lt.stood && lt.stood.length > 10, `${sid} 飞鸽信 declined/stood 全`);
    ok(typeof jd.JEAL_LETTER_SPENT[sid] === 'string' && jd.JEAL_LETTER_SPENT[sid].includes('{rival}'), `${sid} 飞鸽信 spent 追记含 {rival}`);
}

console.log(`\n========== v20.73 新主角吃醋/和好接线：${passed} 通过 / ${failed} 失败 ==========`);
process.exit(failed ? 1 : 0);
