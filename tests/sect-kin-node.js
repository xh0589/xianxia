// ==================== 门派补厚批四验收：弟子有脸、需求做实 ====================
// 覆盖：A 接线 / B 道侣需求（三互动消化需求+心情推导+双修/合击真乘子+日增） /
//       C 亲传收真名弟子（门槛/拜师礼走账/封顶/进培养线） / D 日常事件真名注入 / E 文案纪律
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');

let passed = 0; const failures = [];
function ok(cond, msg) { if (cond) { passed++; } else { failures.push(msg); console.log('  ✗ ' + msg); } }
function read(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// ============ A 接线 ============
{
    const html = read('仙侠.html');
    ok(html.indexOf('js/sects/sect-kin.js') >= 0 && html.indexOf('dao-companion-deep.js') < html.indexOf('sect-kin.js'), 'A1 批四模块已挂脚本位（道侣桥之后，包装生效）');
    const npc = read('js/npcs/npc-system.js');
    ok(npc.indexOf('_companionData: this._companionData') >= 0 && npc.indexOf('data._companionData') >= 0, 'A2 道侣心情/需求随NPC存档持久化（不再是写后即丢的假账）');
    const sys = read('js/sects/sects-system.js');
    ok(sys.indexOf('getDaoMoodMul') >= 0, 'A3 双修收益真读心情乘子');
    ok(sys.indexOf('getDaoMoodCombatMul') >= 0 && sys.indexOf("desc: '双人合击，伤害+' + scaled(20)") >= 0, 'A4 合击真读心情乘子且描述跟实值走（UI是真理）');
    ok(sys.indexOf('_myDisciples') >= 0, 'A5 真名弟子名单随 discipleState 存读档');
    const mt = read('js/sects/master-teach.js');
    ok(mt.indexOf('getMyNamedDisciples') >= 0, 'A6 传功培养线吃进真名弟子（不再只认自建宗门）');
    ok(mt.indexOf('openTakeDisciplePanel') >= 0, 'A7 弟子面板挂收徒入口（亲传及以上）');
    const ui = read('js/sects/sects-deep-ui.js');
    ok(ui.indexOf('sectKinify') >= 0 && ui.indexOf('sectKinPick') >= 0 && ui.indexOf('kin:') >= 0, 'A8 日常事件真名注入（抽事件即定人，卡片与回复同一人）');
    const dcd = read('js/sects/dao-companion-deep.js');
    ok(dcd.indexOf('daoCompanionTalk') >= 0 && dcd.indexOf('daoCompanionGift') >= 0 && dcd.indexOf('daoMoodWord') >= 0, 'A9 道侣面板：交心/赠礼按钮+心情行');
    ok(dcd.indexOf('needs: { talk: 30, accompany: 30, gift: 30 }') >= 0, 'A10 需求初值与心情推导口径一致（初值30→心情70）');
    ok(read('js/sects/sect-internal.js').indexOf('5 + Math.floor(Math.random() * 4)') >= 0, 'A11 每派具名同门扩到5-8名');
    ok(read('tests/run-all.sh').indexOf('sect-kin-node.js') >= 0, 'A12 本套件已入回归清单');
}

// ============ 运行时沙箱 ============
function makeNpc(id, name, aff) {
    return {
        id: id, name: name,
        relationship: { affection: aff || 0, love: 0, trust: 0 },
        combat: { realm: '筑基' },
        changeAffection: function (n) { this.relationship.affection = Math.max(0, Math.min(100, (this.relationship.affection || 0) + n)); }
    };
}
function makeWorld(opts) {
    opts = opts || {};
    var logs = [], msgs = [], modals = [], day = opts.day || 100, advanced = [], rand = opts.rand != null ? opts.rand : 0.1;
    var MyMath = { round: Math.round, min: Math.min, max: Math.max, floor: Math.floor, abs: Math.abs, random: function () { return rand; } };
    var npcs = {};
    (opts.npcs || []).concat(opts.sectNpcs || []).forEach(function (n) { npcs[n.id] = n; });
    var W = {
        console: { log: function () {}, warn: function () {} },
        Math: MyMath, JSON: JSON, Object: Object, Array: Array, String: String, Number: Number, isFinite: isFinite,
        currentCharData: opts.cd || { name: '测试', bonds: opts.bonds || {} },
        discipleState: opts.ds || { isInSect: true, sectId: '少林寺', sectName: '少林寺', rank: 3, contribution: 500 },
        inventory: { currency: { spiritStones: opts.stones != null ? opts.stones : 300 } },
        npcManager: { getNPC: function (id) { return npcs[id] || null; } },
        showMessage: function (m) { msgs.push(String(m)); },
        showModal: function (t, b) { modals.push({ title: String(t), body: String(b) }); },
        gameLog: { add: function (m) { logs.push(String(m)); } },
        timeSystem: {
            getAbsoluteDay: function () { return day; },
            advanceTime: function (m, why) { advanced.push({ m: m, why: why }); },
            onNewDaySubscribe: function (fn) { (W._dayHooks = W._dayHooks || []).push(fn); }
        },
        getSectNPCs: function () { return opts.sectNpcs || []; },
        sectSpendContribution: function (n, r) {
            var d = W.discipleState; if (!d || (Number(d.contribution) || 0) < n) return false;
            d.contribution -= n; (W._notes = W._notes || []).push({ n: -n, r: r }); return true;
        },
        daoDateAccept: function (p) { W._dated = (W._dated || 0) + 1; return true; }, // 原桥mock：包装层应调它再消需求
        openDisciplePanel: function () { W._panelOpened = true; },
        _logs: logs, _msgs: msgs, _modals: modals, _advanced: advanced,
        _setDay: function (d) { day = d; },
        _bumpDay: function (n) { day += (n || 1); (W._dayHooks || []).forEach(function (fn) { fn(); }); },
        _lastMsg: function () { return msgs[msgs.length - 1] || ''; },
        _npcs: npcs
    };
    W.window = W;
    var ctx = vm.createContext(W);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/sects/sect-kin.js'), 'utf8'), ctx, { filename: 'sect-kin' });
    return W;
}

// ============ B 道侣需求做实 ============
{
    var ling = makeNpc('npc_ling', '凌霜', 60);
    var W = makeWorld({ bonds: { npc_ling: { type: 'dao_companion', level: 2, day: 90 } }, npcs: [ling] });
    // 初始：needs 30/30/30 → 心情70 安稳
    ok(W.daoMoodWord('npc_ling') === '安稳' && W.getDaoMoodMul('npc_ling') === 1, 'B1 初始心情「安稳」：双修不加不减');
    // 交心
    ling._companionData = { lastInteraction: 0, mood: 70, needs: { talk: 80, accompany: 30, gift: 30 } };
    ok(W.daoCompanionTalk('npc_ling') === true && ling._companionData.needs.talk === 30, 'B2 交心消化「想说话」需求（-50）');
    ok(W._advanced.some(function (a) { return a.why === '与道侣交心'; }), 'B3 交心占时辰（自然代价，非配额）');
    ok(ling.relationship.affection === 62 && W._lastMsg().indexOf('憋着话') >= 0, 'B4 需求高时交心，TA把话匣子打开（好感+2，文本分流）');
    // 赠礼
    var s0 = W.inventory.currency.spiritStones;
    ling._companionData.needs.gift = 70;
    ok(W.daoCompanionGift('npc_ling') === true && W.inventory.currency.spiritStones === s0 - 50 && ling._companionData.needs.gift === 10, 'B5 赠礼：灵石50真扣、礼物需求消化（-60）');
    ok(ling.relationship.love === 1, 'B6 赠礼深情+1（礼物在「记得」）');
    var Wp = makeWorld({ stones: 10, bonds: { npc_ling: { type: 'dao_companion' } }, npcs: [ling] });
    ok(Wp.daoCompanionGift('npc_ling') === false && Wp._lastMsg().indexOf('凑不出') >= 0, 'B7 灵石不够：赠礼打回');
    // 相伴（包装既有赴约桥）
    ling._companionData.needs.accompany = 90;
    W.daoDateAccept({ npcId: 'npc_ling' });
    ok(W._dated === 1 && ling._companionData.needs.accompany === 30, 'B8 相伴半日走既有赴约桥+消化「想出门」需求');
    // 心情推导与乘子分档
    ling._companionData.needs = { talk: 0, accompany: 0, gift: 0 };
    ok(W.daoMoodWord('npc_ling') === '眉眼带笑' && W.getDaoMoodMul('npc_ling') === 1.2 && W.getDaoMoodCombatMul('npc_ling') === 1.25, 'B9 心情极好：双修×1.2、合击×1.25');
    ling._companionData.needs = { talk: 100, accompany: 100, gift: 100 };
    ok(W.daoMoodWord('npc_ling') === '心有委屈' && W.getDaoMoodMul('npc_ling') === 0.7 && W.getDaoMoodCombatMul('npc_ling') === 0.6, 'B10 长期冷落：双修×0.7、合击×0.6（ neglect 有真代价）');
    ok(W.daoNeedHints('npc_ling').indexOf('想和你说说话') >= 0, 'B11 面板需求提示：TA现在想要什么，写得明白');
    // 日增
    ling._companionData.needs = { talk: 10, accompany: 10, gift: 10 };
    W._bumpDay(1);
    ok(ling._companionData.needs.talk === 18 && ling._companionData.needs.gift === 15, 'B12 需求随日子上涨（talk/accompany+8，gift+5）');
    for (var i = 0; i < 12; i++) W._bumpDay(1);
    ok(ling._companionData.needs.talk === 100 && W.daoMoodWord('npc_ling') === '心有委屈', 'B13 冷落到底：需求封顶、心情落地');
    ok(W._logs.join('').indexOf('话少了') >= 0, 'B14 委屈深了会出声（不是哑巴账）');
}

// ============ C 亲传收真名弟子 ============
{
    var d1 = makeNpc('sect_disciple_少林寺_0', '沈铁衣', 40);
    var d2 = makeNpc('sect_disciple_少林寺_1', '裴小满', 10);
    var elder = makeNpc('sect_elder_少林寺_0', '赵长老', 80);
    var W = makeWorld({ sectNpcs: [d1, d2, elder], ds: { isInSect: true, sectId: '少林寺', sectName: '少林寺', rank: 3, contribution: 500 } });
    W.openTakeDisciplePanel();
    var body = W._modals[0].body;
    ok(body.indexOf('沈铁衣') >= 0 && body.indexOf('收为亲传') >= 0, 'C1 收徒面板列具名同门，熟人可收');
    ok(body.indexOf('裴小满') >= 0 && body.indexOf('不熟——先结识再说') >= 0, 'C2 好感不够的不给收（先认识，再拜山门）');
    ok(body.indexOf('赵长老') < 0, 'C3 长老不进候选（收的是年轻同门）');
    ok(W.doTakeDisciple('sect_disciple_少林寺_1') === false, 'C4 硬收不熟的：打回');
    var W2 = makeWorld({ sectNpcs: [d1], ds: { isInSect: true, sectId: '少林寺', sectName: '少林寺', rank: 5, contribution: 500 } });
    W2.openTakeDisciplePanel();
    ok(W2._msgs.join('').indexOf('亲传弟子及以上') >= 0, 'C5 内门以下没资格收徒');
    var W3 = makeWorld({ sectNpcs: [d1], ds: { isInSect: true, sectId: '少林寺', sectName: '少林寺', rank: 3, contribution: 50 } });
    ok(W3.doTakeDisciple('sect_disciple_少林寺_0') === false && W3.discipleState.contribution === 50, 'C6 拜山门礼不够：打回不扣');
    ok(W.doTakeDisciple('sect_disciple_少林寺_0') === true, 'C7 收徒成功');
    ok(W.discipleState._myDisciples.indexOf('sect_disciple_少林寺_0') >= 0 && W.discipleState.contribution === 400, 'C8 名单入档、拜山门礼贡献-100');
    ok((W._notes || []).some(function (n) { return n.r === '收徒·拜山门礼'; }), 'C9 拜师礼走批一账本记账口');
    ok(d1._masterIsPlayer === true && d1.relationship.affection === 45, 'C10 弟子档案打上师承标记、好感+5');
    ok(W.doTakeDisciple('sect_disciple_少林寺_0') === false, 'C11 同一人不重复收');
    // 封顶三个
    var dx = [makeNpc('sect_disciple_少林寺_2', '甲', 50), makeNpc('sect_disciple_少林寺_3', '乙', 50), makeNpc('sect_disciple_少林寺_4', '丙', 50), makeNpc('sect_disciple_少林寺_5', '丁', 50)];
    var W4 = makeWorld({ sectNpcs: dx, ds: { isInSect: true, sectId: '少林寺', sectName: '少林寺', rank: 3, contribution: 900 } });
    W4.doTakeDisciple('sect_disciple_少林寺_2'); W4.doTakeDisciple('sect_disciple_少林寺_3');
    ok(W4.discipleState._myDisciples.length === 2, 'C12 连收两人成功');
    W4.doTakeDisciple('sect_disciple_少林寺_4');
    ok(W4.discipleState._myDisciples.length === 3, 'C13 第三人照收（上限是三个，不是两个）');
    W4.doTakeDisciple('sect_disciple_少林寺_5');
    ok(W4.discipleState._myDisciples.length === 3 && W4._lastMsg().indexOf('至多三个') >= 0, 'C14 第四人被封顶拦下（精力就这么多）');
}

// ============ D 日常事件真名注入 ============
{
    var d1 = makeNpc('sect_disciple_少林寺_0', '沈铁衣', 40);
    var d2 = makeNpc('sect_disciple_少林寺_1', '裴小满', 40);
    var W = makeWorld({ sectNpcs: [d1, d2] });
    var t = W.sectKinify('少林寺有弟子成功突破境界，全派士气大振。', '少林寺');
    ok(/弟子「(沈铁衣|裴小满)」/.test(t), 'D1 泛称「弟子」换成真名（事件里的人是真档案）');
    ok(W.sectKinify('夜雨漏湿了阁顶，一册抄本岌岌可危。', '少林寺') === '夜雨漏湿了阁顶，一册抄本岌岌可危。', 'D2 没有泛称的文本不硬塞名字');
    ok(W.sectKinify('两名师姐争执', '少林寺', '凌霜') === '两名师姐「凌霜」争执', 'D3 指名注入（卡片与回复同一人的钥匙）');
    ok(W.sectKinPick('少林寺', '100:se_x') === W.sectKinPick('少林寺', '100:se_x'), 'D4 同种子同人（同一天同一事件不换脸）');
    var W2 = makeWorld({ sectNpcs: [] });
    ok(W2.sectKinify('有弟子突破', '空派') === '有弟子突破', 'D5 派里没档案就静默（不硬造人）');
}

// ============ E 文案纪律 ============
{
    var W = makeWorld({
        bonds: { npc_ling: { type: 'dao_companion' } },
        npcs: [makeNpc('npc_ling', '凌霜', 60)],
        sectNpcs: [makeNpc('sect_disciple_少林寺_0', '沈铁衣', 40)]
    });
    W.daoCompanionTalk('npc_ling');
    W.daoCompanionGift('npc_ling');
    W.doTakeDisciple('sect_disciple_少林寺_0');
    W.openTakeDisciplePanel();
    var all = W._modals.map(function (m) { return m.title + m.body; }).join('|') + '|' + W._msgs.join('|') + '|' + W._logs.join('|');
    var visible = all.replace(/<[^>]*>/g, '');
    ok(!/[A-Za-z]/.test(visible.replace(/TA/g, '')), 'E1 运行期玩家可见正文零外文字母（TA为中文惯用代词，豁免）');
    ok(visible.indexOf('次数') < 0 && visible.indexOf('配额') < 0, 'E2 零配额句式');
    ok(visible.indexOf('妹妹') < 0 && visible.indexOf('姐姐') < 0, 'E3 年龄铁设定不破');
}

console.log('sect-kin: ' + passed + ' passed, ' + failures.length + ' failed');
if (failures.length) { failures.forEach(f => console.log('  FAIL: ' + f)); process.exit(1); }
