// ==================== v25.0《灵气之尽》批三+批四验收：无视线 + 追随线 ====================
// 对齐：主线大纲·灵气之尽.md 无视线/追随线节 + 8.3 盘点表 + 11.2 交心账 + 11.4⑥⑧ 拟稿 + 十二条纪律
// 覆盖：A 接线 / N 无视线全流程（男·渡劫「去」/ 女·大乘「不去」锁而不断 / 关窗变体） /
//       S 追随线全流程（道侣段 / 差事三办 / 点兵两落 / 夜话债册 / 危机两版 / 讨伐+真相 / 交心里程碑 / 日常池） / E 文案纪律
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
    ok(html.indexOf('js/quest/qi-arc3.js') >= 0 && html.indexOf('js/quest/qi-arc4.js') >= 0, 'A1 批三批四已挂脚本位');
    const cm = read('js/quest/choice-memory.js');
    ok(['qi_kin_took', 'qi_kin_turned', 'qi_knock1_went', 'qi_knock2_escort', 'qi_knock3_wine', 'qi_knock3_window', 'qi_ignore_go', 'qi_ignore_stay', 'qi_task_lenient', 'qi_task_strict', 'qi_task_refuse', 'qi_muster_divert', 'qi_muster_vanguard', 'qi_talk_earnest', 'qi_talk_tease', 'qi_debt_write', 'qi_debt_skip', 'qi_crisis_detour', 'qi_crisis_silent'].every(id => cm.indexOf("'" + id + "'") >= 0), 'A2 批三批四抉择全部入选择记忆');
    const s3 = read('js/quest/qi-arc3.js'), s4 = read('js/quest/qi-arc4.js');
    ok(s3.indexOf('endgame_') < 0 && s4.indexOf('endgame_') < 0, 'A3 新模块零旧旗标');
    ok(read('js/quest/qi-arc1.js').indexOf('qiIgnoreButtons') >= 0 && read('js/quest/qi-arc1.js').indexOf('qiFollowButtons') >= 0 && read('js/quest/qi-arc1.js').indexOf('addQiHeartBond') >= 0, 'A4 枢纽接入两线按钮位+交心账');
    ok(read('tests/run-all.sh').indexOf('qi-batch34-node.js') >= 0, 'A5 本套件已入回归清单');
}

// ============ 运行时沙箱 ============
function makeWorld(opts) {
    opts = opts || {};
    var logs = [], modals = [], overlays = [], choices = [], day = opts.day || 500;
    var realmOrder = ['凡人', '炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'];
    var W = {
        console: { log: function () {} },
        Math: Math, JSON: JSON, Object: Object, Array: Array, String: String, Number: Number, isFinite: isFinite, RegExp: RegExp,
        eventFlags: {},
        currentCharData: { realm: opts.realm || '化神', gender: opts.gender || 'male', name: '测试', fame: 0, essence: 0, sect: opts.sect || '散修', bonds: opts.bonds || {} },
        npcManager: { getNPC: function () { return { name: opts.companionName || '阿蘅' }; } },
        inventory: { currency: { spiritStones: 5000 } },
        updateCurrencyUI: function () {},
        gameLog: { add: function (m) { logs.push(String(m)); } },
        showMessage: function (m) { logs.push(String(m)); },
        showModal: function (title, body) { modals.push({ title: String(title), body: String(body) }); },
        recordChoice: function (id) { choices.push(id); },
        getRealmTier: function (r) { var i = realmOrder.indexOf(r); return i < 0 ? 6 : i; },
        addFame: function (n) { W._fame = (W._fame || 0) + (n || 0); },
        gainCultivationBonus: function (n) { W._essence = (W._essence || 0) + (n || 0); },
        addItem: function (id) { (W._items = W._items || []).push(id); return true; },
        itemById: {}, allItems: [], materials: [],
        timeSystem: { getAbsoluteDay: function () { return day; }, onNewDaySubscribe: function (fn) { (W._dayHooks = W._dayHooks || []).push(fn); } },
        startBattle: function (e) { W._lastEnemy = e; return { _stub: true }; },
        acceptQuest: function () {},
        updateQuestUI: function () {},
        QuestRegistry: (function () { var m = {}; return { registerMany: function (arr) { arr.forEach(function (q) { m[q.id] = q; }); }, get: function (id) { return m[id] || null; } }; })(),
        mainQuestChain: [],
        StateRegistry: { register: function () {} },
        QI_CONCENTRATION: {
            '大漠孤城': { base: 0.8, desc: '沙漠之地' }, '冰原城': { base: 1.3, desc: '冰雪' }, '万毒谷': { base: 1.2, desc: '毒瘴' },
            '青木城': { base: 1.5, desc: '木灵' }, '剑阁': { base: 1.5, desc: '剑气' }, '炎城': { base: 1.4, desc: '火灵' },
            '洛水城': { base: 1.1, desc: '水畔' }, '帝都·长安': { base: 1.0, desc: '帝都' }
        },
        globalQiLevel: 100,
        depleteQi: function (a) { W.globalQiLevel = Math.max(0, W.globalQiLevel - (a || 1)); },
        restoreWorldQi: function (a) { W.globalQiLevel = Math.min(100, W.globalQiLevel + (a || 5)); },
        document: { getElementById: function () { return null; }, body: { insertAdjacentHTML: function (pos, h) { overlays.push(String(h)); } } },
        _logs: logs, _modals: modals, _overlays: overlays, _choices: choices,
        _setDay: function (d) { day = d; }, _bumpDay: function (n) { day += n; (W._dayHooks || []).forEach(function (fn) { fn(); }); }
    };
    W.window = W;
    var ctx = vm.createContext(W);
    ['js/quest/qi-world.js', 'js/quest/qi-arc1.js', 'js/quest/qi-arc2.js', 'js/quest/qi-arc3.js', 'js/quest/qi-arc4.js'].forEach(function (rel) {
        vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel });
    });
    return W;
}
function allText(W) {
    return W._logs.join('|') + '|' + W._modals.map(m => m.title + m.body).join('|') + '|' + W._overlays.join('|');
}
function fastPrologue(W, picks, route) {
    W.qiStartPrologue();
    W.qiSceneChoice('chen', picks.chen);
    W.qiSceneChoice('liu', picks.liu);
    W.qiSceneChoice('yu', picks.yu);
    if (picks.yu === 'guard') W.settleQiBattle(true, 'yu');
    W.qiSceneChoice('zhou', picks.zhou);
    W.qiToRoute();
    W.qiRouteChoice(route);
}

// ============ N 无视线 · 主盘（男 · 渡劫 · 收留/看名册/护送/接酒/去） ============
var W1 = makeWorld({ realm: '渡劫', gender: 'male' });
{
    fastPrologue(W1, { chen: 'pass', liu: 'pass', yu: 'pass', zhou: 'pass' }, 'ignore');
    W1.openQiEndgamePanel();
    ok(W1._modals.map(m => m.body).join('').indexOf('过你的日子') >= 0, 'N1 无视线面板按钮（世界从你门前路过）');
    W1.qiStartH01();
    ok(W1._overlays.join('').indexOf('世界大事从你门前路过') >= 0 && W1._overlays.join('').indexOf('大漠孤城的脉死透了') >= 0, 'N2 衰减的日子：真实数值生效+大事路过');
    W1.qiH01Done();
    ok(W1.eventFlags['qi_h01'] === true && W1.qiWorldProbe().withered.indexOf('大漠孤城') >= 0 && W1._logs.join('').indexOf('历书') >= 0, 'N3 忽-01毕：历书载体+大漠孤城枯（离屏）');
    W1.qiStartH02();
    var hearts0 = W1.qiLedgerProbe().hearts.length;
    W1.qiKinChoice('took');
    ok(W1.qiLedgerProbe().hearts.length === hearts0 && W1.qiStreetProbe().some(s => s.text.indexOf('还亮着修士的灯') >= 0), 'N4 收留=街谈一条、人心簿不记（收留不是账）');
    ok(W1.qiWorldProbe().withered.indexOf('冰原城') >= 0, 'N5 忽-02毕：冰原城枯');
    W1.qiStartH03();
    W1.qiKnock1Choice('went');
    ok(W1.eventFlags['qi_knock1'] === 'went' && W1.qiStreetProbe().some(s => s.text.indexOf('去看了一眼那份名册') >= 0), 'N6 叩门①看名册=旗+街谈');
    ok(W1._overlays.join('').indexOf('三年前你路过他的山门，他给你留过一盏灯') >= 0, 'N7 叩门②灯下（那顿饭还在你身上）');
    W1.qiKnock2Escort();
    ok(W1._lastEnemy && W1._lastEnemy.name === '噬骨佣军·伏兵头目' && W1._lastEnemy._qiBeat === 'hu_escort', 'N8 护送真仗接线');
    W1.settleQiBattle(false, 'hu_escort');
    ok(W1.eventFlags['qi_h_scene'] === 'k2_battle' && W1.eventFlags['qi_knock2'] == null, 'N9 护送败=可再战不入账');
    W1.qiResumeIgnore();
    W1.settleQiBattle(true, 'hu_escort');
    ok(W1.eventFlags['qi_knock2'] === 'escort' && W1.qiLedgerProbe().graces.some(e => e.text.indexOf('灯下三百口') >= 0), 'N10 护送胜=恩列长生牌一笔+终战还命预告');
    var roofText = W1._overlays.join('');
    ok(roofText.indexOf('小没良心的，陪本座去一趟') >= 0 && roofText.indexOf('本座要动最后一条脉了') >= 0, 'N11 叩门③屋顶邀酒换皮定稿（男版+新动机）');
    var hb0 = W1.qiHeartBondProbe();
    W1.qiKnock3Choice('wine');
    ok(W1.qiHeartBondProbe() - hb0 === 20 && W1._items.indexOf('qi_her_wine') >= 0, 'N12 接酒=交心账一笔+酒坛入行囊');
    ok(W1.qiWorldProbe().withered.indexOf('万毒谷') >= 0 && W1.globalQiLevel === 55, 'N13 忽-03毕：万毒谷青木枯+总闸55');
    W1.qiStartH04();
    ok(W1._overlays.join('').indexOf('收留的那个旧识在扫落叶') >= 0, 'N14 走到黑：收留旗在枯竭年代回响');
    W1.qiH04Done();
    W1.qiStartH05();
    ok(W1._overlays.join('').indexOf('粮价比她要紧') >= 0 || W1._logs.join('').indexOf('粮价') >= 0, 'N15 街谈改提粮价（她像天气）');
    W1.qiH05Done();
    ok(W1.globalQiLevel === 30 && W1.qiWorldProbe().withered.indexOf('洛水城') >= 0, 'N16 忽-05毕：总闸30+洛水枯');
    W1.qiStartH06();
    ok(W1.qiWorldProbe().withered.indexOf('帝都·长安') >= 0 && W1._overlays.join('').indexOf('去，或不去') >= 0, 'N17 终拍：长安枯、去/不去双门');
    W1.qiFinaleChoice('go');
    ok(W1.eventFlags['qi_finale_ignore'] === 'go' && W1._logs.join('').indexOf('怀里那坛酒还在') >= 0, 'N18 去=汇流三幕（接酒旗回响：有你的酒）');
}

// ============ N' 无视线 · 女盘（大乘锁「去」/ 婉拒 / 退回 / 关门 / 关窗 / 不去） ============
var W2 = makeWorld({ realm: '大乘', gender: 'female' });
{
    fastPrologue(W2, { chen: 'pass', liu: 'pass', yu: 'pass', zhou: 'pass' }, 'ignore');
    W2.qiStartH01(); W2.qiH01Done();
    W2.qiStartH02();
    var hearts0 = W2.qiLedgerProbe().hearts.length;
    W2.qiKinChoice('turned');
    ok(W2.qiLedgerProbe().hearts.length === hearts0 + 1 && W2._logs.join('').indexOf('世道就这样') >= 0, 'N19 婉拒=人心簿旁观一笔（不骂不罚）');
    W2.qiStartH03();
    W2.qiKnock1Choice('returned');
    ok(W2.qiLedgerProbe().hearts.length === hearts0 + 2, 'N20 退回盟帖=人心簿一笔');
    W2.qiKnock2Choice('closed');
    ok(W2._logs.join('').indexOf('灯下客') >= 0 && W2.qiStreetProbe().some(s => s.text.indexOf('灯下客') >= 0), 'N21 关门=《灯下客》说书段（街谈载体）');
    ok(W2._overlays.join('').indexOf('见了本座连窗都不关') >= 0 && W2._overlays.join('').indexOf('一路人，送本座一程') >= 0, 'N22 屋顶女版换皮定稿（年龄铁设定：无撒娇腔）');
    W2.qiKnock3Choice('window');
    ok(W2._items.indexOf('qi_window_wine') >= 0 && W2._logs.join('').indexOf('窗台上多了一坛酒') >= 0, 'N23 关窗=窗台留酒（不飞升变体伏件）');
    W2.qiStartH04(); W2.qiH04Done();
    W2.qiStartH05(); W2.qiH05Done();
    W2.qiStartH06();
    var b = W2._overlays.join('');
    ok(b.indexOf('需渡劫修为') >= 0 && b.indexOf('锁「去」，不锁「不去」') >= 0, 'N24 大乘档锁「去」（世界规则门槛，锁文逐字）');
    W2.qiFinaleChoice('go');
    ok(W2.eventFlags['qi_finale_ignore'] == null && W2.eventFlags['qi_h_scene'] === 'h06', 'N25 门槛下强选「去」被拒、弹窗还在（锁而不死）');
    W2.qiFinaleChoice('stay');
    ok(W2.eventFlags['qi_finale_ignore'] === 'stay' && W2.eventFlags['qi_h06'] === true && W2._logs.join('').indexOf('做最后一代仙人') >= 0, 'N26 不去=结局「不飞升·旁观」入档（锁去不锁不去）');
    W2.openQiEndgamePanel();
    ok(W2._modals.map(m => m.body).join('').indexOf('日子还在过') >= 0, 'N27 终拍后面板收口（无死按钮）');
}

// ============ S 追随线 · 主盘（女 · 有道侣有师门 · 不办/改道/认真答/写名/劝改道） ============
var W3 = makeWorld({ realm: '炼虚', gender: 'female', sect: '七霞派', bonds: { npc_ah: { type: 'dao_companion' } }, companionName: '阿蘅' });
{
    fastPrologue(W3, { chen: 'sit', liu: 'pass', yu: 'guard', zhou: 'pass' }, 'follow');
    W3.openQiEndgamePanel();
    ok(W3._modals.map(m => m.body).join('').indexOf('朝灵脉尽头走过去') >= 0, 'S1 追随线面板按钮');
    W3.qiStartS01();
    var t = W3._overlays.join('');
    ok(t.indexOf('她以为你是来跪的') >= 0 && t.indexOf('缺跪的——缺站着的') >= 0, 'S2 投海：不是跪（她愣住那一瞬保留）');
    ok(t.indexOf('阿蘅') >= 0 && t.indexOf('人去哪儿，哪儿就是家') >= 0, 'S3 道侣段（不死不叛不被夺，人跟你走）');
    ok(t.indexOf('路是你选的，走完') >= 0 && t.indexOf('跟着本座的人，轮不到你们评') >= 0, 'S4 师门八字信+她挡下所有指点');
    W3.qiS01Done();
    W3.qiStartS02();
    ok(W3._overlays.join('').indexOf('因为我要') >= 0 && W3._overlays.join('').indexOf('拆坝和抽脉，在她的账上是同一件事') >= 0, 'S5 差事：第一答「因为我要」+拆坝即抽脉');
    W3.qiTaskChoice('refuse');
    ok(W3.qiHeartBondProbe() === 20 && W3._logs.join('').indexOf('有脾气。比听话值钱') >= 0, 'S6 不办=交心一笔+她帐前停半步');
    ok(W3.qiWorldProbe().withered.indexOf('大漠孤城') >= 0 && W3.qiWorldProbe().withered.indexOf('冰原城') >= 0, 'S7 随-02毕：北地两城枯（她顺手抽的）');
    W3.qiStartS03();
    ok(W3._overlays.join('').indexOf('这一刀，怎么落') >= 0, 'S8 点兵：名单上有你认识的门派');
    W3.qiMusterChoice('divert');
    ok(W3._lastEnemy && W3._lastEnemy.name === '占脉盟·死士' && W3._lastEnemy._qiBeat === 'sui_assassin', 'S9 改道=刺客一拍真仗（刀债记在引刀人头上）');
    W3.settleQiBattle(false, 'sui_assassin');
    ok(W3.eventFlags['qi_f_scene'] === 's03_assassin_battle' && W3.eventFlags['qi_s03'] == null, 'S10 刺客败=可再战');
    W3.qiResumeFollow();
    W3.settleQiBattle(true, 'sui_assassin');
    ok(W3.eventFlags['qi_s03'] === true && W3._logs.join('').indexOf('自己的债自己收') >= 0, 'S11 刺客胜=章毕+她一句认');
    ok(W3.qiStreetProbe().some(s => s.text.indexOf('刀是熟人引的') >= 0), 'S12 街谈碑文「刀是熟人引的」');
    ok(W3.globalQiLevel === 55 && W3.qiWorldProbe().withered.indexOf('剑阁') < 0, 'S13 随-03毕=一幕毕总闸55（剑阁留给随-04）');
    W3.qiStartS04();
    ok(W3._overlays.join('').indexOf('记的不是味道，是那勺汤') >= 0, 'S14 崖边夜话：热汤面（八岁掉进血海）');
    W3.qiTalkChoice('earnest');
    ok(W3.qiHeartBondProbe() === 40 && W3._logs.join('').indexOf('交心') >= 0, 'S15 认真答=交心账累计+里程碑「交心」称号文本（只报称号不报数）');
    ok(W3._overlays.join('').indexOf('第三万页') >= 0 && W3._overlays.join('').indexOf('你从开始修行那天，就在上面了') >= 0, 'S16 债册拍（11.4⑥逐字）');
    W3.qiDebtChoice('write');
    ok(W3.eventFlags['qi_debt_name'] === true && W3.qiHeartBondProbe() === 60, 'S17 写她的名字=渡结局专属变体件+交心累计');
    ok(W3._logs.join('').indexOf('知心') >= 0, 'S18 里程碑「知心」称号文本触发');
    ok(W3.qiWorldProbe().withered.indexOf('剑阁') >= 0, 'S19 随-04毕：剑阁枯（万剑齐鸣最后一次）');
    W3.qiStartS05();
    var anchorBefore = W3.eventFlags['qi_anchor_day'];
    var cdBefore = W3.qiCountdownText();
    W3.qiCrisisChoice('detour');
    ok(W3.eventFlags['qi_anchor_day'] === anchorBefore - 180 && W3.qiCountdownText() !== cdBefore, 'S20 劝改道成功=倒计时添半年（世界数值，枯萎图可见）');
    ok(W3.qiLedgerProbe().hearts.some(e => e.text.indexOf('他用人心算账') >= 0) && W3.qiHeartBondProbe() === 80, 'S21 人心簿「他用人心算账」+交心一笔');
    ok(W3.qiWorldProbe().withered.indexOf('炎城') < 0 && W3.globalQiLevel === 30, 'S22 改道=炎城暂缓（那城活下来了）+二幕毕总闸30');
    W3.qiStartS06();
    ok(W3._overlays.join('').indexOf('他们指名你。那你就打') >= 0, 'S23 讨伐战：她抱手城头看（这一仗你自己打）');
    W3.qiPurgeFight();
    ok(W3._lastEnemy && W3._lastEnemy.name === '讨伐军·先锋统领', 'S24 讨伐真仗接线');
    W3.settleQiBattle(true, 'sui_purge');
    ok(W3._logs.join('').indexOf('本座认下的人') >= 0 && W3._fame >= 30, 'S25 胜=当众认你+魔道侧名望立住');
    ok(W3._overlays.join('').indexOf('梯子不会自己倒') >= 0 && W3._overlays.join('').indexOf('已经忘了下面长什么样') >= 0, 'S26 真相拍：第二答（两个答案的落差=她逐渐打开）');
    W3.qiS06Done();
    ok(W3.eventFlags['qi_truth_told'] === true && W3.eventFlags['qi_s06'] === true, 'S27 真相旗（三幕对质能说中要害）+章毕');
    ok(W3.qiWorldProbe().withered.indexOf('洛水城') >= 0 && W3.qiWorldProbe().withered.indexOf('炎城') >= 0, 'S28 随-06毕：洛水枯+绕开的炎城这回也没绕过去（绕得了日子绕不了账）');
    // 同行日常池：交心≥知心档、七日一拍
    W3._setDay(700); W3._bumpDay(0);
    ok(W3._logs.join('').match(/同行日常/g).length >= 1, 'S29 同行期日常池触发（按交心档位解锁）');
    W3.openQiEndgamePanel();
    ok(W3._modals.map(m => m.body).join('').indexOf('需渡劫修为') >= 0, 'S30 追随线三幕门槛叙事化（她在身边半步）');
}

// ============ S' 追随线 · 男盘（无道侣无师门 / 严办 / 先锋 / 逗她 / 不写 / 沉默） ============
var W4 = makeWorld({ realm: '炼虚', gender: 'male' });
{
    fastPrologue(W4, { chen: 'pass', liu: 'pass', yu: 'pass', zhou: 'pass' }, 'follow');
    W4.qiStartS01();
    var t = W4._overlays.join('');
    ok(t.indexOf('不是不带，是不能带') >= 0 && t.indexOf('没有师门可来信') >= 0, 'S31 无道侣无师门版（差别不省，不硬造）');
    W4.qiS01Done();
    W4.qiStartS02();
    W4.qiTaskChoice('strict');
    ok(W4.qiLedgerProbe().hearts.some(e => e.text.indexOf('很标准') >= 0) && W4.qiHeartBondProbe() === 0, 'S32 严办=人心簿先例一笔、交心不加（补丁②危机拍引用的就是这笔）');
    W4.qiStartS03();
    W4.qiMusterChoice('vanguard');
    ok(W4._lastEnemy && W4._lastEnemy.name === '占脉盟·大阵主', 'S33 先锋真仗接线');
    W4.settleQiBattle(true, 'sui_vanguard');
    ok(W4._logs.join('').indexOf('剑是谁教的，本座记着') >= 0, 'S34 先锋胜=当众认你（两家都保）');
    W4.qiStartS04();
    W4.qiTalkChoice('tease');
    ok(W4.qiHeartBondProbe() === 20 && W4._logs.join('').indexOf('脑瓜崩') >= 0, 'S35 逗她=脑瓜崩+她把「汤面」收进袖子（交心照记）');
    W4.qiDebtChoice('skip');
    ok(W4.eventFlags['qi_debt_name'] === false && W4._logs.join('').indexOf('一直空着') >= 0, 'S36 不写=账单页一行伏笔（册子最后一页一直空着）');
    W4.qiStartS05();
    W4.qiCrisisChoice('silent');
    ok(W4.qiWorldProbe().withered.indexOf('炎城') >= 0 && W4.eventFlags['qi_crisis_fallen'] === true, 'S37 沉默=炎城当拍即枯（兽潮与拆脉前后脚）');
    ok(W4._logs.join('').indexOf('三千个名字') >= 0 && W4._logs.join('').indexOf('本座记着，你也记着') >= 0, 'S38 沉默=她把三千个名字当你的面写完（魅力不是洗白）');
    W4.qiStartS06(); W4.qiPurgeFight(); W4.settleQiBattle(true, 'sui_purge'); W4.qiS06Done();
    ok(W4.eventFlags['qi_s06'] === true && W4.qiWorldProbe().withered.indexOf('炎城') >= 0, 'S39 男盘全线走通（沉默版炎城不重复枯）');
}

// ============ E 文案纪律 ============
{
    var t = (allText(W1) + '|' + allText(W2) + '|' + allText(W3) + '|' + allText(W4)).replace(/<[^>]+>/g, '').replace(/第\d+日/g, '');
    ok(!/[A-Za-z]/.test(t), 'E1 批三批四玩家可见文本零外文字母');
    ok(t.indexOf('次数') < 0 && t.indexOf('上限') < 0, 'E2 零配额句式');
    ok(t.indexOf('妹妹') < 0 && t.indexOf('姐姐') < 0, 'E3 年龄铁设定不破');
    ok(t.indexOf('鼎炉') < 0 && t.indexOf('气运') < 0, 'E4 旧设定词清零');
    ok(t.indexOf('好姐姐') < 0 && t.indexOf('撒娇') < 0, 'E5 屋顶邀酒旧撒娇腔清零');
    ok(!/[0-9]/.test(t), 'E6 玩家文本零裸数值（交心/厚度/倒计时数额全内读或叙事化）');
    ok(t.indexOf('本座') >= 0, 'E7 她的自称只有「本座」');
}

console.log('qi-batch34: ' + passed + ' passed, ' + failures.length + ' failed');
if (failures.length) { failures.forEach(f => console.log('  FAIL: ' + f)); process.exit(1); }
