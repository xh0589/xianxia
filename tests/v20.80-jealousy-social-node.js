#!/usr/bin/env node
/**
 * v20.80 吃醋关系网 + 双人交锋一期门禁
 * ① 关系网引擎（jealousy-social.js）：三十七人大名单 / 心意探测 / 见面即结识（门派底色+预设旧识）/
 *    关系写回（交深/转冷/结疙瘩/化冻/低强度不误翻仇）/ 同行嫌疑 / 第二人名片 / 开帘播种与动态情敌合成
 * ② 事件系统手术（npc-personal-events.js）：三道新门禁的功能验证 + asNpc 双人气泡 / others/pair
 *    三方结算 / 开帘播种钩子 / 面板锁定原因（源码断言）；队伍成员快照（party-system.js）
 * ③ 无咎灶台九桩：结构 / 门槛 / 门禁 / 负选项 / 动态情敌合成 / 声口与禁 motif
 * ④ 双人对局八桩：guestId 门禁 / asNpc 用法 / others+pair 全分支 / 声口抽查
 *    （檀望舒全桩调子标注、伏璃茵不哭、大隐阁山楂不吃、天书阁四字批破例）
 * ⑤ 接线：HTML 加载序 / 事件池合并 / 导出
 * 运行：node tests/v20.80-jealousy-social-node.js
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

// ============ 通用沙盒 ============
function mkNpc(id, name, opts) {
    opts = opts || {};
    return {
        id, name, gender: opts.gender || 'female', location: opts.location || '',
        relationship: { affection: opts.affection || 0, trust: 0 },
        memory: opts.memory || {},
        npcRelationships: {},
        appearance: opts.appearance || {},
        _flags: opts.flags || {},
        hasFlag(f) { return !!this._flags[f]; },
        setFlag(f) { this._flags[f] = true; }
    };
}
// 与 npc-system.js 真源同语义的关系桩
function setPair(a, b, rel, strength) {
    const s = Math.max(0, Math.min(100, Math.round(strength || 0)));
    if (!a.npcRelationships) a.npcRelationships = {};
    if (!b.npcRelationships) b.npcRelationships = {};
    a.npcRelationships[b.id] = { relation: rel, strength: s };
    const inv = rel === 'master' ? 'student' : rel === 'student' ? 'master' : rel;
    b.npcRelationships[a.id] = { relation: inv, strength: s };
}
function adjustPair(a, b, delta, opts) {
    opts = opts || {};
    const cur = a.npcRelationships[b.id] || { relation: opts.defaultRelation || 'neutral', strength: 0 };
    let rel = cur.relation, ns;
    if (rel === 'enemy' && delta > 0) {
        ns = Math.max(0, (Number(cur.strength) || 0) - delta);
        if (ns <= 20) { rel = 'neutral'; ns = Math.max(0, 20 - ns); }
    } else {
        ns = Math.max(0, Math.min(100, (Number(cur.strength) || 0) + delta));
        if (rel === 'neutral' && ns >= 40) rel = 'friend';
    }
    setPair(a, b, rel, ns);
    return { relation: rel, strength: ns };
}
function runFile(rel, w, extraSandbox) {
    const sandbox = Object.assign({
        window: w,
        console: { log() {}, warn() {}, error() {} },
        document: { querySelector: () => null, readyState: 'loading', addEventListener() {} },
        setTimeout: () => {},
        NPC_PERSONAL_EVENTS: {},
        setNPCRelationshipPair: setPair,
        adjustNPCRelationshipPair: adjustPair
    }, extraSandbox || {});
    vm.createContext(sandbox);
    vm.runInContext(load(rel), sandbox, { filename: rel });
    return sandbox;
}

const HERO_STUB = [
    { id: 'sect_leader_百花谷', name: '温蘅', sect: '百花谷' },
    { id: 'sect_leader_修罗宫', name: '绯泪', sect: '修罗宫' },
    { id: 'sect_leader_恒山派', name: '祁清禅', sect: '恒山派' },
    { id: 'sect_leader_泰山派', name: '岳清晓', sect: '泰山派' },
    { id: 'sect_leader_武当派', name: '阙守拙', sect: '武当派' },
    { id: 'sect_leader_全真教', name: '翀玉衡', sect: '全真教' },
    { id: 'sect_leader_蓬莱派', name: '瀛晚照', sect: '蓬莱派' },
    { id: 'sect_leader_阎罗殿', name: '聂明泽', sect: '阎罗殿' },
    { id: 'sect_leader_血手门', name: '耿雪衣', sect: '血手门' },
    { id: 'sect_leader_飞蝎坞', name: '拓银沙', sect: '飞蝎坞' },
    { id: 'sect_leader_烈日教', name: '伏璃茵', sect: '烈日教' },
    { id: 'sect_leader_天龙教', name: '檀望舒', sect: '天龙教' },
    { id: 'sect_leader_铁掌帮', name: '裘霜莺', sect: '铁掌帮' },
    { id: 'sect_leader_少林寺', name: '竺照禅', sect: '少林寺' }
];
const MALE_STUB = [
    { id: 'sect_leader_丐帮', name: '桑拾玖', sect: '丐帮' },
    { id: 'sect_leader_大隐阁', name: '隗九爻', sect: '大隐阁' },
    { id: 'sect_leader_大旗门', name: '樊惊筹', sect: '大旗门' },
    { id: 'sect_leader_昆仑派X', name: '假条目', sect: '昆仑派' } // 仅测合并，非真 id
];
// 真实三十七人 id 表（guestId 合法性校验用）
const REAL_IDS = [
    'sect_leader_百花谷', 'sect_leader_修罗宫', 'sect_leader_天山派', 'sect_leader_五仙教',
    'sect_leader_铸剑山庄', 'sect_leader_药王谷', 'sect_leader_茅山派', 'sect_leader_金刚宗',
    'sect_leader_峨眉派', 'sect_leader_华山派', 'sect_leader_唐门', 'sect_leader_武当派',
    'sect_leader_蓬莱派', 'sect_leader_逍遥派',
    'sect_leader_恒山派', 'sect_leader_嵩山派', 'sect_leader_泰山派', 'sect_leader_青城派',
    'sect_leader_衡山派', 'sect_leader_丐帮',
    'sect_leader_阎罗殿', 'sect_leader_血手门', 'sect_leader_飞蝎坞', 'sect_leader_烈日教',
    'sect_leader_天龙教',
    'sect_leader_神机门', 'sect_leader_霹雳堂', 'sect_leader_天书阁', 'sect_leader_大隐阁',
    'sect_leader_侠隐阁', 'sect_leader_天涯海阁', 'sect_leader_大旗门', 'sect_leader_铁掌帮',
    'sect_leader_昆仑派', 'sect_leader_全真教', 'sect_leader_少林寺', 'shaolin_wujiu'
];

// ================= ① 关系网引擎 =================
let ENG;
{
    const npcs = {};
    function add(n) { npcs[n.id] = n; return n; }
    const wen = add(mkNpc('sect_leader_百花谷', '温蘅', { location: '百花谷', affection: 60 }));
    const fei = add(mkNpc('sect_leader_修罗宫', '绯泪', { location: '修罗宫', affection: 44, flags: { dao_companion: true } }));
    const nie = add(mkNpc('sect_leader_阎罗殿', '聂明泽', { location: '阎罗殿', affection: 20, memory: { _loveAccepted_confess: true } }));
    const wu = add(mkNpc('shaolin_wujiu', '无咎', { gender: 'male', location: '少林寺', affection: 50 }));
    const zhu = add(mkNpc('sect_leader_少林寺', '竺照禅', { location: '少林寺', affection: 10 }));
    const xie = add(mkNpc('sect_leader_飞蝎坞', '拓银沙', { location: '飞蝎坞' }));
    const lie = add(mkNpc('sect_leader_烈日教', '伏璃茵', { location: '烈日教' }));
    const tai = add(mkNpc('sect_leader_泰山派', '岳清晓', { location: '泰山派' }));
    const heng = add(mkNpc('sect_leader_恒山派', '祁清禅', { location: '恒山派' }));
    const wd = add(mkNpc('sect_leader_武当派', '阙守拙', { gender: 'male', location: '武当派' }));
    const qz = add(mkNpc('sect_leader_全真教', '翀玉衡', { location: '全真教' }));
    const sj = add(mkNpc('sect_leader_神机门', '戚巧机', { location: '神机门' }));
    const pi = add(mkNpc('sect_leader_霹雳堂', '雷惊蛰', { gender: 'male', location: '霹雳堂' }));
    const ty = add(mkNpc('sect_leader_天涯海阁', '狄长亭', { gender: 'male', location: '天涯海阁' }));
    const pl = add(mkNpc('sect_leader_蓬莱派', '瀛晚照', { location: '蓬莱派' }));
    const xue = add(mkNpc('sect_leader_血手门', '耿雪衣', { location: '血手门' }));
    const long = add(mkNpc('sect_leader_天龙教', '檀望舒', { location: '天龙教' }));
    const tm = add(mkNpc('sect_leader_唐门', '晏万解', { location: '唐门' }));

    const w = {
        npcManager: { getNPC: id => npcs[id] || null },
        HEROINE_ROSTER: HERO_STUB,
        MALE_LEAD_ROSTER: MALE_STUB
    };
    const beats = [];
    const sb = runFile('js/npcs/jealousy-social.js', w, {
        appendPEMessage: (type, text) => beats.push({ type, text }),
        SPECIAL_NPC_DATA: { shaolin_wujiu: { icon: '🍲' } },
        SPECIAL_NPC_DEFINITIONS: { 'sect_leader_天龙教': { icon: '🎐' } }
    });
    ENG = { sb, w, npcs, beats };

    // 大名单：女主桩 + 男主桩 + 无咎，去重
    const roster = w._jealRosterAll();
    ok(roster.length === HERO_STUB.length + MALE_STUB.length + 1, `大名单应为 ${HERO_STUB.length + MALE_STUB.length + 1} 人，实到 ${roster.length}`);
    ok(roster.some(r => r.id === 'shaolin_wujiu'), '大名单应含无咎（不入名册也补进来）');

    // 心意探测：好感 44 不算、45 算、道侣旗算、表白记忆算
    ok(w._jealHasFeelings('sect_leader_百花谷') === true, '好感 60 应算有心');
    ok(w._jealHasFeelings('sect_leader_修罗宫') === true, '道侣旗应算有心（好感 44 也过）');
    ok(w._jealHasFeelings('sect_leader_阎罗殿') === true, '表白记忆应算有心');
    ok(w._jealHasFeelings('sect_leader_少林寺') === false, '好感 10 且无实据不应算有心');
    ok(w._jealHasFeelings('不存在的人') === false, '查无此人不应算有心');
    fei.relationship.affection = 44; //  temporarily below line but dao flag still true
    ok(w._jealHasFeelings('sect_leader_修罗宫') === true, '道侣旗独立成立');

    // 世上有心的人：排除自己 + 按好感排序
    const rivals = w._jealAllRivals('sect_leader_百花谷');
    ok(rivals.every(r => r.id !== 'sect_leader_百花谷'), '大名单探测应排除自己');
    ok(rivals.length === 3, `排除百花谷后应剩三位有心人，实到 ${rivals.length}`);
    ok(rivals[0].affection >= rivals[1].affection && rivals[1].affection >= rivals[2].affection, '应按好感深浅排序');
    ok(rivals.some(r => r.id === 'shaolin_wujiu'), '无咎有心时应入列');

    // 门派底色
    const bias = w._jealFactionBias;
    ok(bias('恒山派', '泰山派').relation === 'friend' && bias('恒山派', '泰山派').strength === 35, '五岳连枝 friend 35');
    ok(bias('武当派', '全真教').relation === 'friend' && bias('武当派', '全真教').strength === 30, '道门同宗 friend 30');
    ok(bias('全真教', '武当派').relation === 'friend', '道门同宗（反序）');
    ok(bias('少林寺', '恒山派').relation === 'friend' && bias('少林寺', '恒山派').strength === 30, '佛门同戒 friend 30');
    ok(bias('神机门', '霹雳堂').relation === 'neutral' && bias('神机门', '霹雳堂').strength === 25, '机关火药 neutral 25');
    ok(bias('天涯海阁', '蓬莱派').relation === 'neutral' && bias('天涯海阁', '蓬莱派').strength === 15, '海路 neutral 15');
    ok(bias('阎罗殿', '血手门').relation === 'neutral' && bias('阎罗殿', '血手门').strength === 20, '反派互对 neutral 20');
    ok(bias('少林寺', '阎罗殿').relation === 'enemy' && bias('少林寺', '阎罗殿').strength === 15, '正邪初见 enemy 15');
    ok(bias('百花谷', '修罗宫').relation === 'neutral' && bias('百花谷', '修罗宫').strength === 10, '修罗宫独来独往 neutral 10');
    ok(bias('百花谷', '唐门').relation === 'neutral' && bias('百花谷', '唐门').strength === 5, '无旧谊默认一面之缘 neutral 5');

    // 见面即结识：初见种关系、再见不动、已识不种
    const b1 = w._jealEnsureAcquaintance('sect_leader_少林寺', 'shaolin_wujiu');
    ok(b1 && b1.relation === 'friend' && b1.strength === 40, '竺照禅×无咎应走预设旧识 friend 40');
    ok(!!zhu.npcRelationships['shaolin_wujiu'] && !!wu.npcRelationships['sect_leader_少林寺'], '初见后双方关系列表都应有对方');
    ok(w._jealEnsureAcquaintance('sect_leader_少林寺', 'shaolin_wujiu') === null, '已相识不应重复种');
    const b2 = w._jealEnsureAcquaintance('sect_leader_飞蝎坞', 'sect_leader_烈日教');
    ok(b2 && b2.relation === 'friend' && b2.strength === 45, '拓银沙×伏璃茵应走预设茶棚旧识 friend 45');
    const b3 = w._jealEnsureAcquaintance('sect_leader_百花谷', 'sect_leader_阎罗殿');
    ok(b3 && b3.relation === 'enemy' && b3.strength === 15, '温蘅×聂明泽应按正邪底色 enemy 15');
    ok(w._jealEnsureAcquaintance('sect_leader_百花谷', 'sect_leader_百花谷') === null, '自己对自己不种');
    ok(w._jealEnsureAcquaintance('sect_leader_百花谷', '查无此人') === null, '查无此人不种');
    const b4 = w._jealEnsureAcquaintance('sect_leader_泰山派', 'sect_leader_恒山派');
    ok(b4 && b4.relation === 'friend' && b4.strength === 35, '岳清晓×祁清禅应按五岳底色 friend 35');

    // 关系写回：交深 / 转冷 / 结疙瘩 / 化冻 / 低强度不误翻仇
    const r1 = w._jealWriteback('sect_leader_泰山派', 'sect_leader_恒山派', 10, {});
    ok(r1 && r1.relation === 'friend' && r1.strength === 45, 'friend 35 +10 应为 friend 45');
    ok(/交情深/.test(r1.text), '交深文案应含「交情深」');
    const r2 = w._jealWriteback('sect_leader_泰山派', 'sect_leader_恒山派', -40, {});
    ok(r2 && r2.relation === 'enemy' && r2.strength === 40, 'friend 冷到底应结成真疙瘩 enemy 40');
    ok(/真疙瘩/.test(r2.text), '结疙瘩文案在案');
    const r3 = w._jealWriteback('sect_leader_泰山派', 'sect_leader_恒山派', 30, {});
    ok(r3 && r3.relation === 'neutral', 'enemy 40 化冻 30 应转普通');
    ok(/放下|松了一分/.test(r3.text), '化冻文案在案');
    const r4 = w._jealWriteback('sect_leader_百花谷', 'sect_leader_阎罗殿', 8, {});
    ok(r4 && r4.relation === 'neutral', '浅怨 enemy 15 +8 应化开');
    const r5 = w._jealWriteback('sect_leader_百花谷', 'sect_leader_阎罗殿', -3, {});
    ok(r5 && r5.relation !== 'enemy', '低强度普通关系小幅转冷不应误翻成仇');
    const r6 = w._jealWriteback('sect_leader_神机门', 'sect_leader_霹雳堂', 0, {});
    ok(r6 === null, '零变动不写账');
    // 写回自动补种：没打过照面的两人直接写账，账要先有认识打底
    const r7 = w._jealWriteback('sect_leader_武当派', 'sect_leader_全真教', 5, {});
    ok(r7 && r7.relation === 'friend', '道门初见（friend 30）+5 应为 friend 35');
    ok(!!wd.npcRelationships['sect_leader_全真教'], '写回前应自动补种相识');

    // 同行嫌疑：队伍里的名册人物 + 在意线
    w.partySystem = { getMembers: () => [{ id: 'sect_leader_蓬莱派', name: '瀛晚照' }] };
    pl.relationship.affection = 50;
    let sus = w._jealPartySuspects('sect_leader_百花谷');
    ok(sus && sus.id === 'sect_leader_蓬莱派' && sus.hasFeelings === true, '有心队友应被认出');
    ok(w._jealPartySuspects('sect_leader_蓬莱派') === null, '主人自己不算嫌疑');
    pl.relationship.affection = 35;
    sus = w._jealPartySuspects('sect_leader_百花谷');
    ok(sus && sus.hasFeelings === false, '好感 35 过在意线也应被认出（无实据）');
    pl.relationship.affection = 20;
    ok(w._jealPartySuspects('sect_leader_百花谷') === null, '好感 20 无实据不应算嫌疑');
    w.partySystem = { getMembers: () => [{ id: '路人甲', name: '路人甲' }] };
    ok(w._jealPartySuspects('sect_leader_百花谷') === null, '队伍里的路人不算嫌疑');
    delete w.partySystem;
    ok(w._jealPartySuspects('sect_leader_百花谷') === null, '没有队伍系统时安静返回');

    // 第二人名片：实例图标 → 原卡兜底 → 默认
    let g = w._jealGuestInfo('shaolin_wujiu');
    ok(g && g.name === '无咎' && g.icon === '🍲', '无咎名片应走特殊NPC原卡图标兜底');
    g = w._jealGuestInfo('sect_leader_天龙教');
    ok(g && g.icon === '🎐', '檀望舒名片应走固定人设原卡兜底');
    long.appearance = { icon: '🪞' };
    g = w._jealGuestInfo('sect_leader_天龙教');
    ok(g && g.icon === '🪞', '实例外观图标优先');
    ok(w._jealGuestInfo('查无此人') === null, '查无此人无名片');

    // 初见旁白
    let beat = w._jealFirstMeetingBeat(zhu, '聂明泽', { relation: 'enemy', note: '门派旧怨，见面就带霜' });
    ok(/从未照面/.test(beat) && /旧怨/.test(beat), '仇敌初见旁白');
    beat = w._jealFirstMeetingBeat(tai, '祁清禅', { relation: 'friend', strength: 35, note: '五岳连枝，见面如旧邻' });
    ok(/头一回见面/.test(beat) && /旧谊/.test(beat), '友好初见旁白');
    beat = w._jealFirstMeetingBeat(sj, '狄长亭', { relation: 'neutral', strength: 5, note: '一面之缘' });
    ok(/多了一对相识/.test(beat), '一面之缘旁白不带注');

    // 开帘播种 + 动态情敌合成
    beats.length = 0;
    const evDef = {
        npcId: 'sect_leader_神机门', guestId: 'sect_leader_天涯海阁',
        scenes: [{ speaker: 'narrator', text: '两人对坐' }, { speaker: 'npc', asNpc: 'sect_leader_天涯海阁', text: '（公文腔）' }]
    };
    w._jealOnSceneShow(sj, evDef);
    ok(!!sj.npcRelationships['sect_leader_天涯海阁'] && !!ty.npcRelationships['sect_leader_神机门'], '开帘应种下主客关系');
    ok(beats.length === 1 && beats[0].type === 'narrator' && /头一回见面/.test(beats[0].text), '初见应补一拍旁白');
    beats.length = 0;
    w._jealOnSceneShow(sj, evDef);
    ok(beats.length === 0, '再见不应重复补拍');

    const compEv = {
        npcId: 'shaolin_wujiu', composeRival: true,
        desc: '{rival}来了',
        scenes: [
            { speaker: 'narrator', text: '{rival}上山寻你' },
            { speaker: 'npc', asNpc: '__RIVAL__', text: '（借声）' },
            { speaker: 'player_select', text: '选', options: [{ text: '看向{rival}', effect: 'a' }] }
        ]
    };
    w.detectRivalRomance = () => ({ id: 'sect_leader_修罗宫', name: '绯泪' });
    beats.length = 0;
    w._jealOnSceneShow(wu, compEv);
    ok(compEv.scenes[0].text === '绯泪上山寻你', '动态情敌：旁白换真名');
    ok(compEv.scenes[1].asNpc === 'sect_leader_修罗宫', '动态情敌：asNpc 换真人');
    ok(compEv.scenes[2].options[0].text === '看向绯泪', '动态情敌：选项换真名');
    ok(compEv.desc === '绯泪来了', '动态情敌：desc 换真名');
    ok(!!wu.npcRelationships['sect_leader_修罗宫'] || fei._flags.dao_companion, '动态情敌开帘也应种下主客关系');
    w.detectRivalRomance = () => ({ id: 'sect_leader_阎罗殿', name: '聂明泽' });
    w._jealOnSceneShow(wu, compEv);
    ok(compEv.scenes[0].text === '聂明泽上山寻你', '情敌换人后应从原稿重新合成（名随人换）');
}

// ================= ② 事件系统手术 ============
{
    const peSrc = load('js/npcs/npc-personal-events.js');
    // 渲染器：asNpc / npc2 气泡 / {as_name}
    ok(peSrc.includes('scene.asNpc') && peSrc.includes("'npc2'"), '渲染器应支持 asNpc 双人气泡（npc2）');
    ok(peSrc.includes('border-amber-500') && peSrc.includes('text-amber-300'), 'npc2 气泡应为琥珀色（与主人家的粉色区分）');
    ok(peSrc.includes('{as_name}'), '应支持 {as_name} 占位');
    // 开帘播种钩子
    ok(peSrc.includes('_jealOnSceneShow'), '开帘处应挂关系网播种钩子');
    // 三方结算
    ok(peSrc.includes('result.others') && peSrc.includes('result.pair') && peSrc.includes('_jealWriteback'), '结算处应支持 others/pair');
    // 三道新门禁（源码）
    for (const gate of ['requireGuestFeelings', 'requireSecondRomance', 'requirePartyCompanion']) {
        const n = (peSrc.match(new RegExp(gate, 'g')) || []).length;
        ok(n >= 3, `${gate} 门禁应落在资格/主链原因/日常原因三处，实到 ${n} 处`);
    }
    ok(peSrc.includes('需那位来客也把你放在心上') && peSrc.includes('需世上另有一人把你放在心上') && peSrc.includes('需队伍里另有一位故人同行'), '三道门禁的面板锁定原因在案');

    // 功能验证：三道新门禁真的拦人
    const npcs = {
        'shaolin_wujiu': mkNpc('shaolin_wujiu', '无咎', { gender: 'male', memory: { firstMet: true }, affection: 50 }),
        'sect_leader_修罗宫': mkNpc('sect_leader_修罗宫', '绯泪', { memory: { firstMet: true } })
    };
    let guestFeelings = false, secondRivals = [], partyComp = null;
    const w2 = {
        npcManager: { getNPC: id => npcs[id] || null },
        currentCharData: { location: '少林寺', gender: 'female' },
        detectRivalRomance: () => ({ id: 'sect_leader_修罗宫', name: '绯泪' }),
        _jealHasFeelings: () => guestFeelings,
        _jealAllRivals: () => secondRivals,
        _jealPartySuspects: () => partyComp
    };
    const sb2 = runFile('js/npcs/npc-personal-events.js', w2, { localStorage: { getItem: () => null, setItem() {}, removeItem() {} } });
    const access = sb2.canPlayerAccessPersonalEvent;
    const wujiu = npcs['shaolin_wujiu'];

    const evGuest = { npcId: 'shaolin_wujiu', requireGuestFeelings: true, guestId: 'sect_leader_天龙教' };
    ok(access(evGuest, wujiu) === false, '来客没心时应拦');
    guestFeelings = true;
    ok(access(evGuest, wujiu) === true, '来客有心时应放行');
    ok(access({ npcId: 'shaolin_wujiu', requireGuestFeelings: true }, wujiu) === false, '缺 guestId 应拦');

    ok(access({ npcId: 'shaolin_wujiu', requireSecondRomance: true }, wujiu) === false, '世上没有第二人有心时应拦');
    secondRivals = [{ id: 'x' }];
    ok(access({ npcId: 'shaolin_wujiu', requireSecondRomance: true }, wujiu) === true, '有第二人有心时应放行');

    ok(access({ npcId: 'shaolin_wujiu', requirePartyCompanion: true }, wujiu) === false, '队伍没有故人时应拦');
    partyComp = { id: 'sect_leader_修罗宫', name: '绯泪' };
    ok(access({ npcId: 'shaolin_wujiu', requirePartyCompanion: true }, wujiu) === true, '队伍带着故人时应放行');

    // 既有门禁不回归
    ok(access({ npcId: 'shaolin_wujiu', requireRivalRomance: true }, wujiu) === true, '旧 requireRivalRomance 门禁照常');
    ok(access({ npcId: 'sect_leader_修罗宫', requireRivalRomance: true }, npcs['sect_leader_修罗宫']) === false, '未结识者照常拦');

    // 队伍快照
    const psSrc = load('js/party-system.js');
    ok(psSrc.includes('getMembers'), 'party-system 应导出 getMembers 成员快照');
    ok(/getMembers:\s*function/.test(psSrc), 'getMembers 应为只读映射（id+name）');
}

// ================= ③ 无咎灶台九桩 =================
{
    const src = load('js/npcs/wujiu-jealousy.js');
    const w3 = {
        showMessage() {}, _negativeChoiceCount: {},
        detectRivalRomance: () => ({ id: 'sect_leader_修罗宫', name: '绯泪', isDaoCompanion: true }),
        _jealPartySuspects: () => ({ id: 'sect_leader_蓬莱派', name: '瀛晚照', hasFeelings: true }),
        timeSystem: { onNewDaySubscribe() {} }
    };
    const sb3 = runFile('js/npcs/wujiu-jealousy.js', w3);
    const events = sb3.window.WUJIU_JEAL_EVENTS || sb3.WUJIU_JEAL_EVENTS;
    ok(!!events && Object.keys(events).length === 9, `灶台套装应九桩，实到 ${events ? Object.keys(events).length : 0}`);

    const ladder = { j01: 40, j02: 45, j03: 45, j04: 50, j05: 55, j06: 45, j07: 60, j08: 50, j09: 65 };
    for (const [no, minAff] of Object.entries(ladder)) {
        const ev = events[`wujiu_event_${no}`];
        ok(!!ev, `缺桩 wujiu_event_${no}`);
        if (!ev) continue;
        ok(ev.npcId === 'shaolin_wujiu', `${no} 应挂在无咎名下`);
        ok(ev.minAffection === minAff, `${no} 门槛应 ${minAff}，实到 ${ev.minAffection}`);
        ok(ev.flag === `wujiu_e${no}_done`, `${no} flag 命名应一致`);
        const sel = ev.scenes.filter(s => s.speaker === 'player_select');
        ok(sel.length === 1 && sel[0].options.length >= 3, `${no} 应有且仅有一个 ≥3 选项的抉择`);
        for (const opt of sel[0].options) {
            const r = ev.effects({ id: 'shaolin_wujiu', relationship: { trust: 0 }, memory: {} }, opt.effect);
            ok(r && typeof r.affection === 'number' && typeof r.msg === 'string' && r.msg.length >= 60,
                `${no}/${opt.effect} effects 应返回 {affection, msg≥60字}，msg 实到 ${r && r.msg ? r.msg.length : 0}`);
        }
    }
    // 门禁分工
    ok(events.wujiu_event_j01.requireRivalRomance === true, '柴账应有情敌门禁');
    ok(events.wujiu_event_j02.requireEventDone === 'wujiu_event_j01', '手抖应接在柴账之后');
    ok(events.wujiu_event_j03.ambient === true && events.wujiu_event_j03.repeatEvery === 30, '成精的锅应为 30 日可重演日常');
    ok(events.wujiu_event_j04.requireEventDone === 'wujiu_event_j02', '凉了的饭应接在手抖之后');
    ok(events.wujiu_event_j05.composeRival === true, '端出灶房的那碗应为动态情敌合成桩');
    ok(events.wujiu_event_j06.requirePartyCompanion === true, '灶角的眼应为同行嫌疑门禁（队伍桩）');
    ok(events.wujiu_event_j07.requireDaoCompanion === true && events.wujiu_event_j07.requireRivalRomance === true, '两双筷子应道侣+情敌双门禁');
    ok(events.wujiu_event_j07.composeRival === true, '两双筷子的闲话里含情敌名，应为合成桩');
    ok(events.wujiu_event_j08.ambient === true && events.wujiu_event_j08.repeatEvery === 30, '灶王爷的名帖应为 30 日可重演日常');
    ok(events.wujiu_event_j09.composeRival === true, '压实的饭应为动态情敌合成桩');
    for (const no of ['j05', 'j07', 'j09']) {
        const raw = src.includes(`{rival}`) && events[`wujiu_event_${no}`].scenes.some(s => (s.text || '').includes('{rival}') || (s.options || []).some(o => o.text.includes('{rival}')));
        ok(raw, `${no} 场景应含 {rival} 占位`);
    }
    // 顶峰桩的三方结算：others + pair 全分支落在情敌身上
    for (const eff of ['wujiu', 'rival', 'both']) {
        const r = events.wujiu_event_j09.effects({ id: 'shaolin_wujiu', relationship: { trust: 0 }, memory: {} }, eff);
        ok(r.others && r.others[0] && r.others[0].id === 'sect_leader_修罗宫', `压实的饭/${eff} 应有情敌好感账`);
        ok(r.pair && r.pair.with === 'sect_leader_修罗宫' && typeof r.pair.delta === 'number', `压实的饭/${eff} 应有关系写回`);
    }
    const rAck = events.wujiu_event_j05.effects({ id: 'shaolin_wujiu', relationship: { trust: 0 }, memory: {} }, 'acknowledge');
    ok(rAck.pair && rAck.pair.delta > 0, '端出灶房的那碗/点破 应给主客关系升温');
    // 负选项 ≥5（柴账/那碗/灶角/筷子/名帖各一）
    const negCount = (src.match(/aff(?:ection)? = -\d|affection: -\d/g) || []).length;
    ok(negCount >= 5, `真负选项应 ≥5 处，实到 ${negCount}`);
    // 声口与 motif 纪律（只扫正文——文件头的禁律注释本身要点名别人的信物）
    ok(src.includes('佛看见，也会懂的'), '口头禅在案');
    ok(src.includes('压实的饭') || src.includes('压实'), '灶语「压实」在案');
    ok(!/MALE_LEAD_ROSTER|HEROINE_ROSTER/.test(src), '灶台套装不入任何名册');
    const body = src.slice(src.indexOf('var WUJIU_JEAL_EVENTS'));
    ok(body.length > 0, '正文切片应非空');
    for (const banned of ['批注经', '念珠', '木鱼', '抄经纸', '酒', '葫芦', '顶针', '糖葫芦', '山楂', '百衲衣', '青布']) {
        ok(!body.includes(banned), `正文禁用 motif「${banned}」零出现`);
    }
    // 钩子与导出
    ok(src.includes('onNewDaySubscribe') && src.includes('WUJIU_JEAL_ORDER'), '每日钩子与优先序在案');
    ok(sb3.window.WUJIU_JEAL_ORDER.length === 9, '优先序应覆盖九桩');
    ok(sb3.window.WUJIU_JEAL_ORDER[0] === 'wujiu_event_j09', '顶峰桩优先级最高');
    ok(sb3.NPC_PERSONAL_EVENTS['wujiu_event_j01'], '九桩应并入总事件池');
}

// ================= ④ 双人对局八桩 =================
{
    const DUELS = [
        { file: 'js/npcs/duel-showcases-1.js', key: 'DUEL_SHOWCASES_1', pfxHost: 'tz', host: 'sect_leader_铁掌帮', hostSect: '铁掌帮', guest: 'sect_leader_天龙教', id: 'tz_event_duel_long' },
        { file: 'js/npcs/duel-showcases-1.js', key: 'DUEL_SHOWCASES_1', pfxHost: 'yin', host: 'sect_leader_侠隐阁', hostSect: '侠隐阁', guest: 'sect_leader_阎罗殿', id: 'yin_event_duel_yan' },
        { file: 'js/npcs/duel-showcases-1.js', key: 'DUEL_SHOWCASES_1', pfxHost: 'qz', host: 'sect_leader_全真教', hostSect: '全真教', guest: 'sect_leader_蓬莱派', id: 'qz_event_duel_pl' },
        { file: 'js/npcs/duel-showcases-1.js', key: 'DUEL_SHOWCASES_1', pfxHost: 'heng', host: 'sect_leader_恒山派', hostSect: '恒山派', guest: 'sect_leader_武当派', id: 'heng_event_duel_wd' },
        { file: 'js/npcs/duel-showcases-2.js', key: 'DUEL_SHOWCASES_2', pfxHost: 'xie', host: 'sect_leader_飞蝎坞', hostSect: '飞蝎坞', guest: 'sect_leader_烈日教', id: 'xie_event_duel_lie' },
        { file: 'js/npcs/duel-showcases-2.js', key: 'DUEL_SHOWCASES_2', pfxHost: 'xie', host: 'sect_leader_飞蝎坞', hostSect: '飞蝎坞', guest: 'sect_leader_大旗门', id: 'xie_event_duel_dq' },
        { file: 'js/npcs/duel-showcases-2.js', key: 'DUEL_SHOWCASES_2', pfxHost: 'gai', host: 'sect_leader_丐帮', hostSect: '丐帮', guest: 'sect_leader_大隐阁', id: 'gai_event_duel_dy' },
        { file: 'js/npcs/duel-showcases-2.js', key: 'DUEL_SHOWCASES_2', pfxHost: 'kl', host: 'sect_leader_昆仑派', hostSect: '昆仑派', guest: 'sect_leader_天书阁', id: 'kl_event_duel_shu' }
    ];
    const cache = {};
    for (const D of DUELS) {
        if (!cache[D.file]) {
            const wD = { showMessage() {}, _negativeChoiceCount: {}, timeSystem: { onNewDaySubscribe() {} } };
            cache[D.file] = runFile(D.file, wD);
        }
        const pool = cache[D.file].window[D.key];
        ok(!!pool, `${D.file} 应导出 ${D.key}`);
        const ev = pool && pool[D.id];
        ok(!!ev, `缺对局 ${D.id}`);
        if (!ev) continue;
        ok(ev.npcId === D.host, `${D.id} 主人应为 ${D.host}`);
        ok(ev.guestId === D.guest, `${D.id} 来客应为 ${D.guest}`);
        ok(REAL_IDS.includes(ev.guestId), `${D.id} 来客 id 应在三十七人正表内`);
        ok(ev.requireGuestFeelings === true, `${D.id} 应挂来客有心门禁`);
        ok(ev.minAffection === 45, `${D.id} 门槛应 45`);
        ok(ev.flag === `${D.pfxHost}_e_duel_${D.id.split('_duel_')[1]}_done`, `${D.id} flag 命名应一致`);
        ok(ev.autoTrigger && ev.autoTrigger.location === D.hostSect, `${D.id} 自动触发应落在主人门中`);
        const sel = ev.scenes.filter(s => s.speaker === 'player_select');
        ok(sel.length === 1 && sel[0].options.length >= 3, `${D.id} 应有且仅有一个 ≥3 选项的抉择`);
        const asNpcScenes = ev.scenes.filter(s => s.asNpc);
        ok(asNpcScenes.length >= 2, `${D.id} 来客应至少开口两次（asNpc 气泡），实到 ${asNpcScenes.length}`);
        ok(asNpcScenes.every(s => s.asNpc === D.guest), `${D.id} 所有 asNpc 应指向来客本人`);
        let neg = 0;
        for (const opt of sel[0].options) {
            const r = ev.effects({ id: D.host, relationship: { trust: 0 }, memory: {} }, opt.effect);
            ok(r && typeof r.affection === 'number' && typeof r.msg === 'string' && r.msg.length >= 80,
                `${D.id}/${opt.effect} effects msg 应 ≥80 字，实到 ${r && r.msg ? r.msg.length : 0}`);
            ok(r.others && r.others.length === 1 && r.others[0].id === D.guest && typeof r.others[0].affection === 'number',
                `${D.id}/${opt.effect} 应记来客好感账`);
            ok(r.pair && r.pair.with === D.guest && typeof r.pair.delta === 'number',
                `${D.id}/${opt.effect} 应写回主客关系账`);
            if ((r.affection < 0) || (r.others && r.others[0].affection < 0)) neg++;
        }
        ok(neg >= 1, `${D.id} 应至少有一个付出代价的选项`);
    }
    // 声口抽查
    const p1 = cache['js/npcs/duel-showcases-1.js'].window.DUEL_SHOWCASES_1;
    const p2 = cache['js/npcs/duel-showcases-2.js'].window.DUEL_SHOWCASES_2;
    const longGuest = p1.tz_event_duel_long.scenes.filter(s => s.asNpc);
    ok(longGuest.every(s => s.text.includes('（用') && s.text.includes('调子）')), '檀望舒全桩台词必须带「（用XX的调子）」标注');
    ok(!longGuest.some(s => /哭|眼泪/.test(s.text)), '檀望舒桩不写哭');
    const lieGuest = p2.xie_event_duel_lie.scenes.filter(s => s.asNpc);
    ok(!lieGuest.some(s => /哭|眼泪/.test(s.text)), '伏璃茵全桩不许哭（仰头哭专属主线）');
    const dyGuest = p2.gai_event_duel_dy.scenes.filter(s => s.asNpc);
    ok(dyGuest.some(s => s.text.includes('山楂')) && dyGuest.some(s => s.text.includes('没吃')), '隗九爻的签头山楂在案且从不吃（吃了等于卦死）');
    ok(JSON.stringify(p2.gai_event_duel_dy.scenes).includes('莫尽'), '「莫尽」应在两卦皆凶正文');
    const shuGuest = p2.kl_event_duel_shu.scenes.filter(s => s.asNpc);
    ok(shuGuest.some(s => s.text.includes('存疑')), '宓书言「存疑不改」在案');
    ok(/破了四字之规/.test(p2.kl_event_duel_shu.effects({ id: 'kl', relationship: {} }, 'mock').msg), '宓书言的破例批注只在 mock 分支（批语从不超四字，破例只为你）');
    const d1src = load('js/npcs/duel-showcases-1.js');
    const qzSect = d1src.slice(d1src.indexOf("'qz_event_duel_pl'"), d1src.indexOf("'heng_event_duel_wd'"));
    ok(qzSect.length > 0 && !qzSect.includes('酒'), '翀玉衡桩零酒字（账房禁字）');
    ok(qzSect.includes('停珠'), '翀玉衡「停珠」在案');
    ok(qzSect.includes('全押'), '「全押」是翀玉衡的题眼');
    const wdGuest = p1.heng_event_duel_wd.scenes.filter(s => s.asNpc);
    ok(wdGuest.some(s => s.text.includes('白石')), '阙守拙的白石数目在案');
    ok(JSON.stringify(p1.heng_event_duel_wd.scenes).includes('木鱼'), '祁清禅的木鱼拍子在案（恒山自己的法器）');
    // 精力/灵石旁路
    for (const f of ['js/npcs/duel-showcases-1.js', 'js/npcs/duel-showcases-2.js', 'js/npcs/wujiu-jealousy.js', 'js/npcs/jealousy-social.js']) {
        const s = load(f);
        ok(s.indexOf('.energy -=') < 0 && s.indexOf('cd.stones') < 0, `${f} 无精力/灵石旁路写入`);
        ok(!/MALE_LEAD_ROSTER\.push|HEROINE_ROSTER\.push/.test(s), `${f} 不推名册（对局不是感情线）`);
    }
    // 卷一的每日兜底钩子扫两卷
    ok(d1src.includes('DUEL_SHOWCASES_2') && d1src.includes('onNewDaySubscribe'), '卷一每日兜底应两卷共用');
}

// ================= ⑤ 接线 =================
{
    const html = load('仙侠.html');
    const iAfter = html.indexOf('js/npcs/heroine-aftermath.js');
    const iSoc = html.indexOf('js/npcs/jealousy-social.js');
    const iWu = html.indexOf('js/npcs/wujiu-jealousy.js');
    const iD1 = html.indexOf('js/npcs/duel-showcases-1.js');
    const iD2 = html.indexOf('js/npcs/duel-showcases-2.js');
    const iPanel = html.indexOf('js/relations-panel.js');
    const iDeep = html.indexOf('js/npcs/jealousy-deep.js');
    for (const [name, i] of [['jealousy-social', iSoc], ['wujiu-jealousy', iWu], ['duel-1', iD1], ['duel-2', iD2]]) {
        ok(i > 0, `HTML：${name} 已挂载`);
    }
    ok(iSoc > iAfter && iSoc > iDeep, 'HTML：引擎在扩容包与回访文件之后加载');
    ok(iWu > iSoc && iD1 > iWu && iD2 > iD1, 'HTML：加载序为 引擎 → 灶台 → 卷一 → 卷二');
    ok(iD2 < iPanel, 'HTML：四个新文件都在关系面板之前');
    ok(/v20\.80/.test(html), 'HTML：v20.80 注释在案');
}

console.log(`\n========== v20.80 吃醋关系网 + 双人交锋一期：${passed} 通过 / ${failed} 失败 ==========`);
process.exit(failed ? 1 : 0);
