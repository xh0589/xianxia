#!/usr/bin/env node
/**
 * v20.77 第三批反派阵营扩线门禁（阎罗殿·聂明泽 yan / 血手门·耿雪衣 xue / 飞蝎坞·拓银沙 xie /
 *                        烈日教·伏璃茵 lie / 天龙教·檀望舒 long）
 * ① 五条新线达到与既有二十线同构的深度：12 主线事件（001~011+013）+ 6 结局 + 好感阶梯严格递增
 * ② 终章 5 岔路 + 伤透门槛落独立辜负结局；负选项 ≥3；精力价签走 _payCost 真源
 * ③ 接线齐全：固定人设表 / bond_dao 通用阶梯拦截 / 好感衰减名册 / HTML 加载序（阎罗殿男主线在男主人册创建之后）
 * ④ 吃醋全套同批接入：女主人册（四位）/ 男主人册 push（一位）/ 对峙·和好·论交·回访 / 扩容包二十五人
 * 运行：node tests/v20.77-third-batch-routes-node.js
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
    { file: 'js/npcs/yanluo-events.js', prefix: 'YAN', name: '聂明泽', pfx: 'yan', sect: '阎罗殿',
      stayEnd: '同案', badEnd: '销档', friendEnd: '留页', noneEnd: '空格', daoEnds: ['携簿', '并档'] },
    { file: 'js/npcs/xueshou-events.js', prefix: 'XUE', name: '耿雪衣', pfx: 'xue', sect: '血手门',
      stayEnd: '药信', badEnd: '雪刃', friendEnd: '年集', noneEnd: '空庐', daoEnds: ['同晴', '留灯'] },
    { file: 'js/npcs/feixie-events.js', prefix: 'XIE', name: '拓银沙', pfx: 'xie', sect: '飞蝎坞',
      stayEnd: '同册', badEnd: '改蛰', friendEnd: '沙盟', noneEnd: '独牧', daoEnds: ['同蜕', '不蛰'] },
    { file: 'js/npcs/lieri-events.js', prefix: 'LIE', name: '伏璃茵', pfx: 'lie', sect: '烈日教',
      stayEnd: '留芯', badEnd: '独冠', friendEnd: '灯话', noneEnd: '未曦', daoEnds: ['同曦', '守焰'] },
    { file: 'js/npcs/tianlong-events.js', prefix: 'LONG', name: '檀望舒', pfx: 'long', sect: '天龙教',
      stayEnd: '寄声', badEnd: '封镜', friendEnd: '知音', noneEnd: '未应', daoEnds: ['同声', '初应'] },
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

// ---- 男主线名册 push（阎罗殿一位；eventId 是对峙事件不是终章） ----
{
    const src = load('js/npcs/yanluo-events.js');
    ok(/MALE_LEAD_ROSTER[\s\S]{0,200}YAN_NPC_ID[\s\S]{0,300}yan_event_rival/.test(src), 'yanluo-events.js 末尾应守卫式 push 男主人册');
    for (const f of ['eventId', 'reconcileId', 'femctxId', 'mctxId']) {
        ok(new RegExp(f + ": 'yan_event_").test(src), `yan 名册 push 应含 ${f}`);
    }
    ok(!/eventId: 'yan_event_013'/.test(src), 'yan 名册 push 的 eventId 不得误写终章 id');
}
// 四条女主线不得 push 男主人册
for (const f of ['js/npcs/xueshou-events.js', 'js/npcs/feixie-events.js', 'js/npcs/lieri-events.js', 'js/npcs/tianlong-events.js']) {
    ok(!/MALE_LEAD_ROSTER\.push|MALE_LEAD_ROSTER\s*&&[\s\S]{0,80}\.push/.test(load(f)), `${f}: 女主侧不得 push 男主人册`);
}

// ---- 接线检查 ----
const sp = load('js/npcs/special-npcs.js');
for (const [sect, name] of [['阎罗殿', '聂明泽'], ['血手门', '耿雪衣'], ['飞蝎坞', '拓银沙'], ['烈日教', '伏璃茵'], ['天龙教', '檀望舒']]) {
    ok(sp.includes(`'sect_leader_${sect}'`) && sp.includes(name), `固定人设表：${name}在案`);
}
for (const [sect, g] of [['阎罗殿', 'male'], ['血手门', 'female'], ['飞蝎坞', 'female'], ['烈日教', 'female'], ['天龙教', 'female']]) {
    ok(new RegExp(`'sect_leader_${sect}'[\\s\\S]*gender: '${g}'`).test(sp), `${sect}人设性别 ${g}`);
}

const ns = load('js/npcs/npc-system.js');
for (const [sect, sentinel] of [['阎罗殿', '尚在复核'], ['血手门', '年集还没赶'], ['飞蝎坞', '还没描完'], ['烈日教', '真日出还没看着'], ['天龙教', '今夜不传']]) {
    ok(ns.includes(`npcId === 'sect_leader_${sect}'`) && ns.includes(sentinel), `npc-system bond_dao 拦截：${sect}在案（${sentinel}）`);
}

const pe = load('js/npcs/npc-personal-events.js');
ok(/coreIds = \[[\s\S]*?'sect_leader_阎罗殿'[\s\S]*?'sect_leader_天龙教'[\s\S]*?\]/.test(pe), '好感衰减名册已含五位新主角');

const html = load('仙侠.html');
const iPersonal = html.indexOf('npc-personal-events.js');
const iZhujian = html.indexOf('js/npcs/zhujian-events.js');
const iSpecial = html.indexOf('js/npcs/special-npcs.js');
const NEW_FILES = ['yanluo-events.js', 'xueshou-events.js', 'feixie-events.js', 'lieri-events.js', 'tianlong-events.js'];
for (const f of NEW_FILES) {
    const i = html.indexOf('js/npcs/' + f);
    ok(i > iPersonal, `HTML：${f} 在 npc-personal-events.js 之后加载`);
    ok(i > iSpecial, `HTML：${f} 在固定人设表之后加载`);
}
ok(html.indexOf('js/npcs/yanluo-events.js') > iZhujian, 'HTML：阎罗殿线在男主人册创建（zhujian-events.js）之后加载');

// ---- 吃醋全套（女主侧·四位） ----
const hr = run('js/npcs/heroine-rivalry.js');
const HEROES = [['sect_leader_血手门', '耿雪衣', '血手门', 'xue'], ['sect_leader_飞蝎坞', '拓银沙', '飞蝎坞', 'xie'],
                ['sect_leader_烈日教', '伏璃茵', '烈日教', 'lie'], ['sect_leader_天龙教', '檀望舒', '天龙教', 'long']];
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
for (const [sect, pfx] of [['血手门', 'xue'], ['飞蝎坞', 'xie'], ['烈日教', 'lie'], ['天龙教', 'long']]) {
    ok(!!hb.HEROINE_BRIDGE_EVENTS[pfx + '_event_bridge'], `${pfx}_event_bridge 在案`);
    ok(!!(hb._BRIDGE_TIER_MSGS && hb._BRIDGE_TIER_MSGS['sect_leader_' + sect]), `_BRIDGE_TIER_MSGS 应有${sect}档`);
    ok(new RegExp(`'sect_leader_${sect}'\\s*\\?\\s*'${pfx}_event_bridge'`).test(hbSrc), `论交钩子链应含${sect}分支`);
}
const ha = run('js/npcs/heroine-aftermath.js');
const haSrc = load('js/npcs/heroine-aftermath.js');
for (const [sect, pfx] of [['血手门', 'xue'], ['飞蝎坞', 'xie'], ['烈日教', 'lie'], ['天龙教', 'long']]) {
    const am = ha.AFTERMATH_EVENTS[pfx + '_event_aftermath'];
    ok(!!am && am.requireDaoCompanion === true && am.requireEventDone === pfx + '_event_013', `${pfx}_event_aftermath 门禁：道侣 + 终章`);
    ok(haSrc.includes(`amId: '${pfx}_event_aftermath'`), `回访兜底名册应含${sect}`);
}

// ---- 吃醋全套（男主侧·一位） ----
for (const [sect, pfx] of [['阎罗殿', 'yan']]) {
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

// ---- 吃醋扩容包（二十五人） ----
const jd = run('js/npcs/jealousy-deep.js');
for (const [sect, pfx] of [['阎罗殿', 'yan'], ['血手门', 'xue'], ['飞蝎坞', 'xie'], ['烈日教', 'lie'], ['天龙教', 'long']]) {
    ok(jd.JEALOUSY_SEC_PREFIX[sect] === pfx, `扩容包前缀表应含 ${sect}:${pfx}`);
}
for (const mapName of ['JEALOUSY_PROBE_EVENTS', 'JEALOUSY_COLD_EVENTS', 'JEALOUSY_SULK_EVENTS', 'JEALOUSY_AFTERMATH_EVENTS', 'JEALOUSY_NEGLECT_EVENTS']) {
    ok(Object.keys(jd[mapName]).length >= 25, `${mapName} 应至少二十五桩，实到 ${Object.keys(jd[mapName]).length}`);
    for (const p of ['yan', 'xue', 'xie', 'lie', 'long']) {
        const key = p + (mapName === 'JEALOUSY_AFTERMATH_EVENTS' ? '_event_after' : mapName === 'JEALOUSY_PROBE_EVENTS' ? '_event_probe'
            : mapName === 'JEALOUSY_COLD_EVENTS' ? '_event_cold' : mapName === 'JEALOUSY_SULK_EVENTS' ? '_event_sulk' : '_event_neglect');
        ok(!!jd[mapName][key], `${mapName}.${key} 在案`);
    }
}
const FESTS = ['shangyuan', 'qixi', 'zhongqiu', 'chuxi'];
for (const sect of ['阎罗殿', '血手门', '飞蝎坞', '烈日教', '天龙教']) {
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

console.log(`\n========== v20.77 第三批反派阵营扩线（五门）：${passed} 通过 / ${failed} 失败 ==========`);
process.exit(failed ? 1 : 0);
