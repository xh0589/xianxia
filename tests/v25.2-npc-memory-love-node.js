/**
 * v25.2-npc-memory-love-node.js — 试玩问题清单·二 P27/P28/P29 回归防护
 *
 * 三条主线死账（清单·二实测坐实）：
 *   [1] P27 recordPlayerAction 键名失配：深谈记 deep_talk_*、硬聊记 forced_talk，
 *       而 meetCount/firstMet 旧版只认 talk/greet 两键 ⇒ 全仓 7 处读
 *       firstMet/meetCount 的恋爱门禁（吃醋/个人事件/旧事重提/掌门出游/社交流量）
 *       对「只深谈过」的人全部卡死。修法：任何当面互动键都算「认识」；
 *       talkToNPC 补记 'talk'（noAffection 防好感双计，F-18 gift 同判例）。
 *   [2] P28 getDialogue 分档死代码：if (tree[category]) 先行短路，默认 'greeting'
 *       永远命中 ⇒ affectionLow/Mid/High 三档池子写了等于没写，好感涨两档台词不换。
 *   [3] P29 bond_dao 终章女主死路：26+ 条婉拒分支可无限重演、UI 不标注、不点破出路。
 *       修法：BOND_DAO_FINAL_CHAPTER 名册 + 婉拒只演一次（此后直说由何终章定局）
 *       + 爱情分类 UI 亮明出路 + _bondDaoAsked 随档（记忆白名单制，漏键即读档清零）。
 *
 * 手法：真 js/npcs/npc-system.js 装进 vm 沙箱真跑（照 npc-memory-roundtrip 同款姿势）；
 *       app.js 侧（talkToNPC 不单独起 vm）走源码扫描棘轮。
 */
'use strict';

var path = require('path');
var fs = require('fs');
var vm = require('vm');
var ROOT = path.resolve(__dirname, '..');

var passed = 0, failed = 0;
function ok(c, m) { if (c) { passed++; console.log('  ✓ ' + m); } else { failed++; console.log('  [FAIL] ' + m); } }
var load = function (rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); };

function 建沙箱() {
    var noop = function () {};
    var 消息们 = [];
    var 沙 = {
        console: { log: noop, warn: noop, error: noop },
        JSON: JSON, Object: Object, Array: Array, Math: Math, Number: Number,
        String: String, Boolean: Boolean, Set: Set, Map: Map, Date: Date,
        parseInt: parseInt, parseFloat: parseFloat, isNaN: isNaN, isFinite: isFinite,
        setTimeout: noop, clearTimeout: noop, setInterval: noop, clearInterval: noop,
        document: { addEventListener: noop, removeEventListener: noop,
            querySelector: function () { return null; }, getElementById: function () { return null; },
            createElement: function () { return null; }, body: { appendChild: noop } },
        showMessage: function (msg, type) { 消息们.push({ msg: String(msg), type: type }); },
        currentCharData: { name: '测试道人', location: '帝都·长安' },
        playerName: '测试道人',   // getDialogue 台词替换读的是这个全局
    };
    沙.window = 沙; 沙.global = 沙; 沙.globalThis = 沙;
    var ctx = vm.createContext(沙);
    vm.runInContext(load('js/npcs/npc-system.js'), ctx, { filename: 'npc-system.js' });
    return { 沙: 沙, ctx: ctx, 消息们: 消息们 };
}

console.log('\n========== v25.2 · P27/P28/P29 NPC记忆与恋爱线回归 ==========');

// ============ [1] P27 键名失配根治 ============
console.log('\n[1] P27 recordPlayerAction：任何当面互动都算「认识」');
{
    var h = 建沙箱();
    var NPC = vm.runInContext('NPC', h.ctx);
    var n = new NPC('sect_leader_百花谷', '温蘅', { gender: 'female' });
    ok(n.memory.meetCount === 0 && n.memory.firstMet === false, '1a 初始：素未谋面');
    n.recordPlayerAction('deep_talk_confess', 'positive');
    ok(n.memory.meetCount === 1 && n.memory.firstMet === true, '1b 深谈一席 → meetCount=1、firstMet=true（旧行为：全是 0，7 处恋爱门禁卡死）');
    ok(n.memory.impressions['deep_talk_confess'] === 1, '1c impressions 照记');
    n.recordPlayerAction('forced_talk', 'negative');
    ok(n.memory.meetCount === 2, '1d 好感不足硬聊（forced_talk）也算见过面');
    n.recordPlayerAction('deep_talk_branch_node_a', 'positive');
    ok(n.memory.meetCount === 3, '1e 深谈分支（deep_talk_branch_*）同算');
    n.recordPlayerAction('gift', 'positive');
    ok(n.memory.meetCount === 3 && n.memory.totalGifts === 1, '1f 反例：送礼走礼物账，不虚增谋面次数');
    n.recordPlayerAction('attack', 'negative');
    ok(n.memory.meetCount === 3 && n.memory.totalAttacks === 1, '1g 反例：动手走仇怨账，不虚增谋面次数');
}

console.log('\n[1h] P27 noAffection：好感已由调用方结算时不双计（试玩清单·二建议3）');
{
    var h = 建沙箱();
    var NPC = vm.runInContext('NPC', h.ctx);
    var a = new NPC('t_a', '甲', {}); var b = new NPC('t_b', '乙', {});
    a.relationship.affection = 0; b.relationship.affection = 0;
    a.recordPlayerAction('talk', 'positive');                       // 不带 opts：账房照旧 +1（openNpcDeepTalk 全靠这笔）
    b.recordPlayerAction('talk', 'positive', { noAffection: true }); // 带 opts：只记账不动好感
    ok(a.relationship.affection === 1, '1h 无 opts → talk 照常 +1（旧调用方不回退）');
    ok(b.relationship.affection === 0 && b.memory.meetCount === 1, '1i noAffection → 好感不动、记忆照记（talkToNPC 的骰子是好感唯一账房）');
}

console.log('\n[1j] P27 talkToNPC 接线（app.js 源码棘轮：同地守卫 + 补记 talk + noAffection）');
{
    var app = load('js/app.js');
    var i = app.indexOf('function talkToNPC(');
    ok(i >= 0, '1j talkToNPC 仍在 app.js');
    var seg = app.slice(i, i + 3000);
    ok(/npcNotCoLocated/.test(seg) && /隔空喊话是听不见的/.test(seg), '1k 同地守卫在好感/时辰结算之前——远程白赚好感+15分钟的漏洞已堵');
    ok(/recordPlayerAction\('talk', affectionChange >= 0 \? 'positive' : 'negative', \{ noAffection: true \}\)/.test(seg),
        '1l 闲聊补记 talk 且 noAffection（骰子之外不再 +1）');
    ok(seg.indexOf('npcNotCoLocated') < seg.indexOf('advanceTime'), '1m 守卫先于推进时辰（被拒不扣时间）');
    ok(seg.indexOf('npcNotCoLocated') < seg.indexOf('recordPlayerAction'), '1n 守卫先于记账（远程不落「见过面」假账）');
}

// ============ [2] P28 getDialogue 分档 ============
console.log('\n[2] P28 getDialogue：greeting 按好感分档，三档池子不再是死代码');
{
    var h = 建沙箱();
    var NPC = vm.runInContext('NPC', h.ctx);
    var n = new NPC('t_c', '丙', {});   // 默认树：四档池子齐全且互不重叠
    var HIGH = ['看到你真好！', '我一直在等你。', '和你在一起很开心。'];
    var MID = ['最近怎么样？', '有什么新鲜事吗？', '你想聊聊吗？'];
    var LOW = ['我不太想和你说话。', '请离开。', '我很忙。'];
    var GREET = ['你好，{playerName}。', '很高兴见到你。', '有什么事吗？'];
    n.relationship.affection = 60;
    ok(HIGH.indexOf(n.getDialogue()) >= 0, '2a 好感60（知己档）→ 说体己话（旧行为：永远是 greeting 三句）');
    n.relationship.affection = 20;
    ok(MID.indexOf(n.getDialogue()) >= 0, '2b 好感20（熟人档）→ 寒暄热络');
    n.relationship.affection = -60;
    ok(LOW.indexOf(n.getDialogue()) >= 0, '2c 好感-60（仇人档）→ 冷脸');
    n.relationship.affection = -10;
    ok(GREET.indexOf(n.getDialogue().replace(/测试道人|朋友/g, '{playerName}')) >= 0, '2d 好感-10（微负）→ 仍走 greeting 档');
    // 数据 NPC 定制树没备分档池 → 逐级退回自家 greeting，不劣化
    var m = new NPC('t_d', '丁', { dialogueTree: { greeting: ['客官里边请。', '要打尖还是住店？'] } });
    m.relationship.affection = 90;
    ok(['客官里边请。', '要打尖还是住店？'].indexOf(m.getDialogue()) >= 0, '2e 反例：定制树无分档池 → 回落自家 greeting，不借默认池串味');
    // 显式类别不受影响
    ok(typeof n.getDialogue('greeting') === 'string', '2f 显式 greeting 类别照常可用');
}

// ============ [3] P29 bond_dao 终章定局 ============
console.log('\n[3] P29 bond_dao：婉拒只演一次 + 点破终章 + 随档');
{
    var h = 建沙箱();
    var NPC = vm.runInContext('NPC', h.ctx);
    var exe = vm.runInContext('executeEmotionInteraction', h.ctx);
    var n = new NPC('sect_leader_少林寺', '竺照禅', { gender: 'female' });
    n.location = '帝都·长安';   // 与沙箱 currentCharData 同地，过 npcNotCoLocated
    n.relationship.affection = 85;
    n.memory._loveAccepted_confess = true;   // 过告白前置门
    h.沙.npcManager = { getNPC: function (id) { return id === n.id ? n : null; } };
    h.消息们.length = 0;
    exe('sect_leader_少林寺', 'bond_dao');
    ok(h.消息们.length === 1 && /贫尼骂不出/.test(h.消息们[0].msg), '3a 首次问询：角色台词照旧演（v20.79 棘轮句不动）');
    ok(n.memory._bondDaoAsked === true, '3b 记账落 memory._bondDaoAsked');
    ok(!(n.relationship.flags && n.relationship.flags.has && n.relationship.flags.has('dao_companion')), '3c 反例：终章女主的道侣旗绝不从此路落（设计不变）');
    h.消息们.length = 0;
    exe('sect_leader_少林寺', 'bond_dao');
    ok(h.消息们.length === 1 && /答案没有变/.test(h.消息们[0].msg) && /终章「骂不出」/.test(h.消息们[0].msg),
        '3d 再问：不重演角色台词，直说答案没变 + 点破终章名（旧行为：无限重演同一句婉拒，不指出路）');
    // 随档往返（记忆白名单制，漏键即读档清零）
    var data = n.serialize();
    var json = JSON.parse(JSON.stringify(data));
    var r = NPC.deserialize(json);
    ok(r.memory._bondDaoAsked === true, '3e _bondDaoAsked 存读档往返不丢');
    // 名册外的普通 NPC：好感 80+ 通用路径照常可结（设计不变）
    var h2 = 建沙箱();
    var NPC2 = vm.runInContext('NPC', h2.ctx);
    var exe2 = vm.runInContext('executeEmotionInteraction', h2.ctx);
    var p = new NPC2('merchant_01', '赵掌柜', { gender: 'male' });
    p.location = '帝都·长安';
    p.relationship.affection = 85;
    p.memory._loveAccepted_confess = true;
    h2.沙.npcManager = { getNPC: function (id) { return id === p.id ? p : null; } };
    h2.消息们.length = 0;
    exe2('merchant_01', 'bond_dao');
    ok(/天地为证/.test(h2.消息们[0].msg) && p.relationship.flags.has('dao_companion'),
        '3f 反例护栏：名册外 NPC 好感80+ 通用结缘路径不受影响');
    ok(p.memory._bondDaoAsked !== true, '3g 名册外的人不落「已问过」账');
}

console.log('\n[3h] P29 名册与拦截链同步棘轮（链上新增女主漏进名册 → 本套红）');
{
    var ns = load('js/npcs/npc-system.js');
    var chainStart = ns.indexOf("case 'bond_dao':");
    var chainEnd = ns.indexOf('if (aff >= 80)', chainStart);
    ok(chainStart > 0 && chainEnd > chainStart, '3h bond_dao 拦截链区段可定位');
    var chain = ns.slice(chainStart, chainEnd);
    var 链上人 = {}; var mm; var re = /npcId === '([^']+)'/g;
    while ((mm = re.exec(chain)) !== null) 链上人[mm[1]] = true;
    var 册 = vm.runInContext('BOND_DAO_FINAL_CHAPTER', (() => { var h = 建沙箱(); return h.ctx; })());
    var 链缺册 = Object.keys(链上人).filter(function (k) { return !册[k]; });
    var 册缺链 = Object.keys(册).filter(function (k) { return !链上人[k]; });
    ok(链缺册.length === 0, '3i 拦截链上每个人都进了终章名册（缺：' + 链缺册.join(',') + '）');
    ok(册缺链.length === 0, '3j 名册里每个人都真有拦截分支（多：' + 册缺链.join(',') + '）——名册不许空头许诺');
    // UI 亮牌：爱情分类的名册内注记
    ok(/categoryId === 'love' && BOND_DAO_FINAL_CHAPTER\[npcId\]/.test(ns) && /只会换来一句婉拒/.test(ns),
        '3k showSubCategoryDialog 在爱情分类亮明「由XX定局」（旧行为：可点、不灰、不标注）');
}

console.log('\n========== 小结：通过 ' + passed + ' / 失败 ' + failed + ' ==========');
process.exit(failed > 0 ? 1 : 0);
