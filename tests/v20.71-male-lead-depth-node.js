#!/usr/bin/env node
/**
 * v20.71 男主恋爱线加厚门禁
 * 四条男主线（冶砚/芩木/昴既明/赫渊）从 9 事件 4 结局加厚到女主线同构的 12 事件 6 结局：
 * ① 主线事件 = 001~011 + 013 共 12 个；新增 009(68)/010(72)/011(78) 好感阶梯无断档
 * ② 结局 = 6 个：道侣·同行 / 道侣·归隐 / 挚友·同行 / 挚友·归隐 / 辜负 / 错过，endingMap 全覆盖
 * ③ 终章新增 friend_stay 选项 → 挚友·归隐；伤透门槛(negCount>=3)落独立辜负结局而非错过
 * ④ 结局回调：挚友·归隐加信任；辜负不落道侣旗
 * 运行：node tests/v20.71-male-lead-depth-node.js
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

const ROUTES = [
    { file: 'js/npcs/zhujian-events.js', prefix: 'LU', name: '冶砚', pfx: 'lu', stayEnd: '炉客', badEnd: '冷炉', friendEnd: '剑友' },
    { file: 'js/npcs/yaowang-events.js', prefix: 'SU', name: '芩木', pfx: 'su', stayEnd: '茶客', badEnd: '焚方', friendEnd: '方友' },
    { file: 'js/npcs/maoshan-events.js', prefix: 'MS', name: '昴既明', pfx: 'ms', stayEnd: '灯客', badEnd: '符灰', friendEnd: '符友' },
    { file: 'js/npcs/jingang-events.js', prefix: 'JG', name: '赫渊', pfx: 'jg', stayEnd: '塔客', badEnd: '锁心', friendEnd: '禅友' },
];

function loadRoute(R) {
    const src = fs.readFileSync(path.join(ROOT, R.file), 'utf8');
    const captured = { endingSet: null, callback: null };
    const w = { showMessage: function () {}, _negativeChoiceCount: {} };
    const sandbox = {
        window: w, console: { log() {}, warn() {}, error() {} },
        registerEndingSet: function (npcId, endings) { captured.endingSet = { npcId, endings }; },
        registerEndingCallback: function (npcId, cb) { captured.callback = { npcId, cb }; },
    };
    sandbox.globalThis = sandbox;
    vm.createContext(sandbox);
    vm.runInContext(src, sandbox, { filename: R.file });
    return {
        sandbox, captured, src,
        events: w[R.prefix + '_MAIN_EVENTS'],
        endings: w[R.prefix + '_ENDINGS'],
        npcId: sandbox[R.prefix + '_NPC_ID'],
    };
}

for (const R of ROUTES) {
    const L = loadRoute(R);
    const tag = R.name;
    ok(L.events && Object.keys(L.events).length === 12, `${tag}: 主线事件应 12 个（001~011+013），实到 ${L.events ? Object.keys(L.events).length : 0}`);
    ok(L.endings && Object.keys(L.endings).length === 6, `${tag}: 结局应 6 个，实到 ${L.endings ? Object.keys(L.endings).length : 0}`);

    // ① 新事件阶梯：009(68) 010(72) 011(78)，结构与选项合法
    for (const [no, aff] of [['009', 68], ['010', 72], ['011', 78]]) {
        const ev = L.events[`${R.pfx}_event_${no}`];
        ok(!!ev, `${tag}: 缺新事件 ${R.pfx}_event_${no}`);
        if (!ev) continue;
        ok(ev.minAffection === aff, `${tag}: ${no} 好感门槛应 ${aff}，实到 ${ev.minAffection}`);
        ok(ev.npcId === L.npcId, `${tag}: ${no} npcId 应指向本线`);
        ok(ev.autoTrigger && ev.autoTrigger.location, `${tag}: ${no} 应有 autoTrigger.location`);
        const sel = ev.scenes.filter(s => s.speaker === 'player_select');
        ok(sel.length === 1 && sel[0].options.length >= 2, `${tag}: ${no} 应有 ≥2 个选项`);
        ok(ev.flag === `${R.pfx}_e${no}_done`, `${tag}: ${no} flag 命名应一致`);
        // 每个选项的 effects 都返回 {affection, msg}
        for (const opt of sel[0].options) {
            const r = ev.effects({}, opt.effect);
            ok(r && typeof r.affection === 'number' && typeof r.msg === 'string' && r.msg.length > 0,
                `${tag}: ${no}/${opt.effect} effects 应返回非空 {affection,msg}`);
        }
    }
    // 好感阶梯无断档：008(62) → 009(68) → 010(72) → 011(78) → 013(85)
    const ladder = ['008', '009', '010', '011', '013'].map(n => L.events[`${R.pfx}_event_${n}`].minAffection);
    ok(ladder.every((v, i) => i === 0 || v > ladder[i - 1]), `${tag}: 好感阶梯应严格递增 ${ladder}`);

    // ② 终章结构：endingMap 6 路线全覆盖、friend_stay 选项在
    const fin = L.events[`${R.pfx}_event_013`];
    ok(fin && fin.endingMap && Object.keys(fin.endingMap).length === 6, `${tag}: 终章 endingMap 应 6 路线`);
    for (const [route, eid] of Object.entries(fin.endingMap)) {
        ok(!!L.endings[eid], `${tag}: endingMap 路线「${route}」的结局 ${eid} 应存在`);
        ok(L.endings[eid] && L.endings[eid].route === route, `${tag}: ${eid}.route 应与 endingMap 键一致`);
        ok(L.endings[eid] && L.endings[eid].finalText && L.endings[eid].scenes.length >= 3, `${tag}: ${eid} 演出应 ≥3 幕 + finalText`);
    }
    const finSel = fin.scenes.filter(s => s.speaker === 'player_select')[0];
    ok(finSel.options.length === 5, `${tag}: 终章应 5 个选项，实到 ${finSel.options.length}`);
    ok(finSel.options.some(o => o.effect === 'friend_stay'), `${tag}: 终章应有 friend_stay 选项`);

    // ③ friend_stay → 挚友·归隐；negCount>=3 + 恋人选项 → 独立辜负结局
    const w = L.sandbox.window;
    w._negativeChoiceCount = {};
    const rStay = fin.effects({}, 'friend_stay');
    ok(rStay.ending === R.stayEnd, `${tag}: friend_stay 应落「${R.stayEnd}」，实到 ${rStay.ending}`);
    ok(rStay.affection === 18, `${tag}: friend_stay 好感应 18`);
    w._negativeChoiceCount = {}; w._negativeChoiceCount[L.npcId] = 3;
    const rBad = fin.effects({}, 'lover_travel');
    ok(rBad.ending === R.badEnd, `${tag}: 伤透门槛应落独立辜负「${R.badEnd}」，实到 ${rBad.ending}`);
    w._negativeChoiceCount = {}; w._negativeChoiceCount[L.npcId] = 2;
    const rOk2 = fin.effects({}, 'lover_travel');
    ok(rOk2.ending !== R.badEnd && !!rOk2.ending, `${tag}: 只伤两次仍够得着定情`);
    const rNone = fin.effects({}, 'none');
    ok(rNone.ending === '错过', `${tag}: none 仍落「错过」——辜负与错过分账`);

    // ④ 结局回调：挚友·归隐加信任、辜负不落道侣旗
    const cb = L.captured.callback && L.captured.callback.cb;
    ok(typeof cb === 'function', `${tag}: 应注册结局回调`);
    if (cb) {
        const mk = () => ({ relationship: { trust: 0 }, setFlag(f) { this['_' + f] = true; }, hasFlag(f) { return !!this['_' + f]; } });
        let n1 = mk(); cb(R.stayEnd, n1);
        ok(n1.relationship.trust === 30, `${tag}: ${R.stayEnd} 回调应加 30 信任`);
        ok(!n1.hasFlag('dao_companion'), `${tag}: ${R.stayEnd} 不落道侣旗`);
        let n2 = mk(); cb(R.badEnd, n2);
        ok(!n2.hasFlag('dao_companion') && n2.relationship.trust === 0, `${tag}: ${R.badEnd} 无增益`);
        let n3 = mk(); cb(R.friendEnd, n3);
        ok(n3.relationship.trust === 30, `${tag}: ${R.friendEnd} 回调保持加信任`);
    }
}

console.log(`\n========== v20.71 男主线加厚：${passed} 通过 / ${failed} 失败 ==========`);
process.exit(failed ? 1 : 0);
