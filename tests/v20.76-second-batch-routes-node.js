#!/usr/bin/env node
/**
 * v20.76 第二批扩线门禁（恒山·祁清禅 heng / 嵩山·逵佩南 song / 泰山·岳清晓 tai /
 *                        青城·幽翠微 qing / 衡山·奚湘筠 xiang / 丐帮·桑拾玖 gai）
 * ① 六条新线达到与既有十四线同构的深度：12 主线事件（001~011+013）+ 6 结局 + 好感阶梯严格递增
 * ② 终章 5 岔路 + 伤透门槛落独立辜负结局；负选项 ≥3；精力价签走 _payCost 真源
 * ③ 接线齐全：固定人设表 / bond_dao 通用阶梯拦截 / 好感衰减名册 / HTML 加载序（两条男主线在男主人册创建之后）
 * ④ 吃醋全套同批接入：女主人册（四位）/ 男主人册 push（两位）/ 对峙·和好·论交·回访 / 扩容包二十人
 * 运行：node tests/v20.76-second-batch-routes-node.js
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
    { file: 'js/npcs/hengshan-beiyue-events.js', prefix: 'HENG', name: '祁清禅', pfx: 'heng', sect: '恒山派',
      stayEnd: '话经', badEnd: '灯灭', friendEnd: '香伴', noneEnd: '经尾', daoEnds: ['同渡', '守灯'] },
    { file: 'js/npcs/songshan-events.js', prefix: 'SONG', name: '逵佩南', pfx: 'song', sect: '嵩山派',
      stayEnd: '同寮', badEnd: '废例', friendEnd: '磨勘', noneEnd: '空衙', daoEnds: ['携令', '例外'] },
    { file: 'js/npcs/taishan-events.js', prefix: 'TAI', name: '岳清晓', pfx: 'tai', sect: '泰山派',
      stayEnd: '纸晖', badEnd: '烬晓', friendEnd: '岁晴', noneEnd: '独晖', daoEnds: ['同晖', '守晨'] },
    { file: 'js/npcs/qingcheng-events.js', prefix: 'QING', name: '幽翠微', pfx: 'qing', sect: '青城派',
      stayEnd: '留青', badEnd: '覆茶', friendEnd: '茶信', noneEnd: '空翠', daoEnds: ['煎雪', '焙春'] },
    { file: 'js/npcs/hengshan-nanyue-events.js', prefix: 'XIANG', name: '奚湘筠', pfx: 'xiang', sect: '衡山派',
      stayEnd: '雁信', badEnd: '雨尽', friendEnd: '雨行', noneEnd: '过雁', daoEnds: ['烟雨', '守雁'] },
    { file: 'js/npcs/gaibang-events.js', prefix: 'GAI', name: '桑拾玖', pfx: 'gai', sect: '丐帮',
      stayEnd: '同碗', badEnd: '缄口', friendEnd: '听客', noneEnd: '空碗', daoEnds: ['同衲', '归灯'] },
];

for (const R of ROUTES) {
    const src = load(R.file);
    const sb = run(R.file);
    const events = sb.window[R.prefix + '_MAIN_EVENTS'];
    const endings = sb.window[R.prefix + '_ENDINGS'];
    const npcId = sb[R.prefix + '_NPC_ID'] || sb.window[R.prefix + '_NPC_ID'];
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

// ---- 男主线名册 push（嵩山 / 丐帮） ----
for (const [file, P, pfx] of [['js/npcs/songshan-events.js', 'SONG', 'song'], ['js/npcs/gaibang-events.js', 'GAI', 'gai']]) {
    const src = load(file);
    ok(new RegExp(`MALE_LEAD_ROSTER[\\s\\S]{0,200}${P}_NPC_ID[\\s\\S]{0,300}${pfx}_event_rival`).test(src), `${file} 末尾应守卫式 push 男主人册`);
    for (const f of ['eventId', 'reconcileId', 'femctxId', 'mctxId']) {
        ok(new RegExp(f + ": '" + pfx + "_event_").test(src), `${pfx} 名册 push 应含 ${f}`);
    }
}

// ---- 接线检查 ----
const sp = load('js/npcs/special-npcs.js');
for (const [sect, name] of [['恒山派', '祁清禅'], ['嵩山派', '逵佩南'], ['泰山派', '岳清晓'], ['青城派', '幽翠微'], ['衡山派', '奚湘筠'], ['丐帮', '桑拾玖']]) {
    ok(sp.includes(`'sect_leader_${sect}'`) && sp.includes(name), `固定人设表：${name}在案`);
}
for (const [sect, g] of [['恒山派', 'female'], ['嵩山派', 'male'], ['泰山派', 'female'], ['青城派', 'female'], ['衡山派', 'female'], ['丐帮', 'male']]) {
    ok(new RegExp(`'sect_leader_${sect}'[\\s\\S]*gender: '${g}'`).test(sp), `${sect}人设性别 ${g}`);
}

const ns = load('js/npcs/npc-system.js');
for (const [sect, sentinel] of [['恒山派', '还没落回向'], ['嵩山派', '第一百零八条还空着'], ['泰山派', '第一缕出来'], ['青城派', '茶还没到火候'], ['衡山派', '下半阙还没长出来'], ['丐帮', '不入册']]) {
    ok(ns.includes(`npcId === 'sect_leader_${sect}'`) && ns.includes(sentinel), `npc-system bond_dao 拦截：${sect}在案（${sentinel}）`);
}

const pe = load('js/npcs/npc-personal-events.js');
ok(/coreIds = \[[\s\S]*?'sect_leader_恒山派'[\s\S]*?'sect_leader_丐帮'[\s\S]*?\]/.test(pe), '好感衰减名册已含六位新主角');

const html = load('仙侠.html');
const iPersonal = html.indexOf('npc-personal-events.js');
const iZhujian = html.indexOf('js/npcs/zhujian-events.js');
const iSpecial = html.indexOf('js/npcs/special-npcs.js');
const NEW_FILES = ['hengshan-beiyue-events.js', 'songshan-events.js', 'taishan-events.js', 'qingcheng-events.js', 'hengshan-nanyue-events.js', 'gaibang-events.js'];
for (const f of NEW_FILES) {
    const i = html.indexOf('js/npcs/' + f);
    ok(i > iPersonal, `HTML：${f} 在 npc-personal-events.js 之后加载`);
    ok(i > iSpecial, `HTML：${f} 在固定人设表之后加载`);
}
ok(html.indexOf('js/npcs/songshan-events.js') > iZhujian, 'HTML：嵩山线在男主人册创建（zhujian-events.js）之后加载');
ok(html.indexOf('js/npcs/gaibang-events.js') > iZhujian, 'HTML：丐帮线在男主人册创建（zhujian-events.js）之后加载');

// ---- 吃醋全套（女主侧·四位） ----
const hr = run('js/npcs/heroine-rivalry.js');
const HEROES = [['sect_leader_恒山派', '祁清禅', '恒山派', 'heng'], ['sect_leader_泰山派', '岳清晓', '泰山派', 'tai'],
                ['sect_leader_青城派', '幽翠微', '青城派', 'qing'], ['sect_leader_衡山派', '奚湘筠', '衡山派', 'xiang']];
for (const [id, name, sect, pfx] of HEROES) {
    const h = hr.HEROINE_ROSTER.find(x => x.id === id);
    ok(!!h && h.name === name && h.sect === sect, `女主人册：${name}条目`);
    ok(h && h.eventId === pfx + '_event_rival' && h.reconcileId === pfx + '_event_reconcile'
       && h.amId === pfx + '_event_aftermath' && h.finaleId === pfx + '_event_013', `女主人册：${sect}条目四 id 齐`);
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
for (const [sect, pfx] of [['恒山派', 'heng'], ['泰山派', 'tai'], ['青城派', 'qing'], ['衡山派', 'xiang']]) {
    ok(!!hb.HEROINE_BRIDGE_EVENTS[pfx + '_event_bridge'], `${pfx}_event_bridge 在案`);
    ok(!!(hb._BRIDGE_TIER_MSGS && hb._BRIDGE_TIER_MSGS['sect_leader_' + sect]), `_BRIDGE_TIER_MSGS 应有${sect}档`);
    ok(new RegExp(`'sect_leader_${sect}'\\s*\\?\\s*'${pfx}_event_bridge'`).test(hbSrc), `论交钩子链应含${sect}分支`);
}
const ha = run('js/npcs/heroine-aftermath.js');
const haSrc = load('js/npcs/heroine-aftermath.js');
for (const [sect, pfx] of [['恒山派', 'heng'], ['泰山派', 'tai'], ['青城派', 'qing'], ['衡山派', 'xiang']]) {
    const am = ha.AFTERMATH_EVENTS[pfx + '_event_aftermath'];
    ok(!!am && am.requireDaoCompanion === true && am.requireEventDone === pfx + '_event_013', `${pfx}_event_aftermath 门禁：道侣 + 终章`);
    ok(haSrc.includes(`amId: '${pfx}_event_aftermath'`), `回访兜底名册应含${sect}`);
}

// ---- 吃醋全套（男主侧·两位） ----
for (const [sect, pfx] of [['嵩山派', 'song'], ['丐帮', 'gai']]) {
    for (const [file, evId] of [
        ['js/npcs/male-lead-rivalry.js', pfx + '_event_rival'],
        ['js/npcs/male-lead-reconcile.js', pfx + '_event_reconcile'],
        ['js/npcs/male-lead-bridge.js', pfx + '_event_bridge'],
        ['js/npcs/male-lead-aftermath.js', pfx + '_event_aftermath']]) {
        const src = load(file);
        ok(src.includes(evId), `${file}: ${evId} 在案`);
        ok(src.includes(`'sect_leader_${sect}'`), `${file}: 钩子链应含${sect}分支`);
    }
    ok(new RegExp(`ML_BRIDGE_TIER_MSGS[\\s\\S]*'sect_leader_${sect}'`).test(load('js/npcs/male-lead-bridge.js')), `ML_BRIDGE_TIER_MSGS 应有${sect}档`);
    ok(load('js/npcs/male-lead-aftermath.js').includes(`'${pfx}_event_013'`), `${pfx}_event_aftermath 串联终章 ${pfx}_event_013`);
}

// ---- 吃醋扩容包（二十人） ----
const jd = run('js/npcs/jealousy-deep.js');
for (const [sect, pfx] of [['恒山派', 'heng'], ['嵩山派', 'song'], ['泰山派', 'tai'], ['青城派', 'qing'], ['衡山派', 'xiang'], ['丐帮', 'gai']]) {
    ok(jd.JEALOUSY_SEC_PREFIX[sect] === pfx, `扩容包前缀表应含 ${sect}:${pfx}`);
}
for (const mapName of ['JEALOUSY_PROBE_EVENTS', 'JEALOUSY_COLD_EVENTS', 'JEALOUSY_SULK_EVENTS', 'JEALOUSY_AFTERMATH_EVENTS', 'JEALOUSY_NEGLECT_EVENTS']) {
    ok(Object.keys(jd[mapName]).length >= 20, `${mapName} 应至少二十桩，实到 ${Object.keys(jd[mapName]).length}`);
    for (const p of ['heng', 'song', 'tai', 'qing', 'xiang', 'gai']) {
        const key = p + (mapName === 'JEALOUSY_AFTERMATH_EVENTS' ? '_event_after' : mapName === 'JEALOUSY_PROBE_EVENTS' ? '_event_probe'
            : mapName === 'JEALOUSY_COLD_EVENTS' ? '_event_cold' : mapName === 'JEALOUSY_SULK_EVENTS' ? '_event_sulk' : '_event_neglect');
        ok(!!jd[mapName][key], `${mapName}.${key} 在案`);
    }
}
const FESTS = ['shangyuan', 'qixi', 'zhongqiu', 'chuxi'];
for (const sect of ['恒山派', '嵩山派', '泰山派', '青城派', '衡山派', '丐帮']) {
    const sid = 'sect_leader_' + sect;
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

console.log(`\n========== v20.76 第二批扩线（五岳+丐帮）：${passed} 通过 / ${failed} 失败 ==========`);
process.exit(failed ? 1 : 0);
