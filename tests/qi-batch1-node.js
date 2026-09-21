// ==================== v25.0《灵气之尽》批一验收：世界层+序幕+选路 ====================
// 对齐：详稿·第一批·世界层与序幕.md（B6 断言清单）+ 大纲十二条纪律
// 覆盖：A 接线 / B 序幕四场戏全流程 / C 世界层（总闸·枯脉·城景·倒计时·时间副推进） / D 账本与面板 / E 文案纪律
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
    ok(html.indexOf('js/quest/qi-world.js') >= 0 && html.indexOf('js/quest/qi-arc1.js') >= 0, 'A1 新模块已挂脚本位');
    ok(html.indexOf('endgame-arc.js') < 0 && html.indexOf('endgame-routes.js') < 0 && html.indexOf('endgame-echoes.js') < 0, 'A2 旧终局五模块已下线');
    ok(!fs.existsSync(path.join(ROOT, 'js/quest/endgame-arc.js')) && !fs.existsSync(path.join(ROOT, 'js/quest/endgame-routes.js')), 'A3 旧终局文件已删除');
    const app = read('js/app.js');
    ok((app.split('_isQiStory').length - 1) >= 3 && app.indexOf('settleQiBattle(true, currentBattle._qiBeat)') >= 0 && app.indexOf('settleQiBattle(false, currentBattle._qiBeat)') >= 0, 'A4 战斗三路接线（胜/败/残魂豁免）');
    const cm = read('js/quest/choice-memory.js');
    ok(['qi_route_oppose', 'qi_route_ignore', 'qi_route_follow', 'qi_chen_sit', 'qi_liu_buy', 'qi_yu_guard', 'qi_zhou_redeem', 'qi_zhou_name', 'qi_tablet_bow', 'qi_motive_unclear'].every(id => cm.indexOf("'" + id + "'") >= 0), 'A5 选择记忆登记批一+批二条目');
    ok(read('js/location-system.js').indexOf('qiCityOverlay') >= 0, 'A6 进城文本挂城景叠加钩子');
    ok(read('js/quest/main-storyline-arc.js').indexOf('openQiEndgamePanel') >= 0 && read('js/quest/main-storyline-arc.js').indexOf('灵气之尽') >= 0, 'A7 主线面板终局入口已换新');
}

// ============ 运行时沙箱 ============
function makeWorld(opts) {
    opts = opts || {};
    var logs = [], modals = [], overlays = [], choices = [], day = opts.day || 500;
    var realmOrder = ['凡人', '炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'];
    var W = {
        console: { log: function () {} },
        Math: Math, JSON: JSON, Object: Object, Array: Array, String: String, Number: Number, isFinite: isFinite,
        eventFlags: {},
        currentCharData: { realm: opts.realm || '化神', gender: opts.gender || 'male', name: '测试' },
        inventory: { currency: { spiritStones: opts.stones != null ? opts.stones : 1000 } },
        updateCurrencyUI: function () {},
        gameLog: { add: function (m) { logs.push(String(m)); } },
        showMessage: function (m) { logs.push(String(m)); },
        showModal: function (title, body) { modals.push({ title: String(title), body: String(body) }); },
        recordChoice: function (id) { choices.push(id); },
        getRealmTier: function (r) { var i = realmOrder.indexOf(r); return i < 0 ? 6 : i; },
        timeSystem: { getAbsoluteDay: function () { return day; }, onNewDaySubscribe: function (fn) { W._newDay = fn; } },
        startBattle: function (e) { W._lastEnemy = e; return { _stub: true }; },
        acceptQuest: function (id) { W._accepted = (W._accepted || []).concat(id); },
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
        _setDay: function (d) { day = d; }, _bumpDay: function (n) { day += n; if (W._newDay) W._newDay(); }
    };
    W.window = W;
    var ctx = vm.createContext(W);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/quest/qi-world.js'), 'utf8'), ctx, { filename: 'qi-world' });
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/quest/qi-arc1.js'), 'utf8'), ctx, { filename: 'qi-arc1' });
    return W;
}
function allText(W) {
    return W._logs.join('|') + '|' + W._modals.map(m => m.title + m.body).join('|') + '|' + W._overlays.join('|');
}

// ============ B 序幕四场戏全流程（男玩家盘） ============
{
    var W = makeWorld({ gender: 'male', stones: 1000 });
    ok(W.mainQuestChain.some(q => q.id === 'main_010' && q.title === '灵脉干了'), 'B1 main_010 新章节入册（灵脉干了）');
    W.openQiEndgamePanel();
    ok(allText(W).indexOf('去官道走一趟') >= 0, 'B2 枢纽面板初始态有序幕入口');

    W.qiStartPrologue();
    ok(W._overlays.join('').indexOf('圈里写着一个字：「卡」') >= 0, 'B3 第一场陈五久弹窗（卡字圈）');
    W.qiSceneChoice('chen', 'sit');
    var L = W.qiLedgerProbe();
    ok(L.graces.length === 1 && L.graces[0].text.indexOf('陈五久') >= 0, 'B4 陪坐入恩列（人名在账）');
    ok(W._choices.indexOf('qi_chen_sit') >= 0, 'B5 选择记忆入账');
    ok(W._overlays.join('').indexOf('柳家药庐') >= 0, 'B6 第二场柳四娘弹窗接续');
    W.qiSceneChoice('liu', 'buy');
    ok(W.inventory.currency.spiritStones === 970 && L.graces.length === 2, 'B7 买枯药扣灵石三十、恩列第二笔');
    W.qiSceneChoice('yu', 'guard');
    ok(W._lastEnemy && W._lastEnemy.name === '脉贼头目·疤面' && W._lastEnemy._isQiStory === true && W._lastEnemy._qiBeat === 'yu', 'B8 守阵眼真仗接线（剧情战旗）');
    W.settleQiBattle(false, 'yu');
    ok(L.graces.length === 2 && W.eventFlags['qi_scene'] === 'yu', 'B9 败=可再战不入账');
    W.qiSceneChoice('yu', 'guard');
    W.settleQiBattle(true, 'yu');
    ok(L.graces.length === 3 && L.graces[2].text.indexOf('虞松子') >= 0, 'B10 胜=虞松子入恩列');
    ok(W._overlays.join('').indexOf('谢仙师留我们全家活命') >= 0, 'B11 第四场田埂小镇（她在谢——无人当场死）');
    W.qiSceneChoice('zhou', 'name');
    ok(L.stranded.length === 1 && L.stranded[0].text.indexOf('周小满') >= 0, 'B12 记名字入搁浅列（周小满连着矿场）');
    ok(W._overlays.join('').indexOf('又是你') >= 0 && W._overlays.join('').indexOf('头一个都不图的') >= 0, 'B13 初见：认脸（三战正典）+男版分流');
    W.qiToRoute();
    ok(W._overlays.join('').indexOf('qiRouteChoice(\'oppose\')') >= 0 || W._overlays.join('').indexOf('oppose') >= 0, 'B14 选路三按钮出现');
    W.qiRouteChoice('oppose');
    ok(W.eventFlags['qi_route'] === 'oppose' && W.eventFlags['qi_prologue_done'] === true, 'B15 选路入档');
    ok(W.globalQiLevel === 80 && W.eventFlags['qi_stage'] === 1, 'B16 总闸降档 100→80');
    var noticeCount = W._logs.filter(s => s.indexOf('像住进了一间正在慢慢漏气的屋子') >= 0).length;
    ok(noticeCount === 1, 'B17 降档播报只响一次');
    ok(W.qiSetStage(1) === false, 'B18 重复降档被拒（不重播）');
    var q = W.QuestRegistry.get('main_010');
    ok(q && q.completed === true, 'B19 序幕章节闭环');
    W.openQiEndgamePanel();
    ok(W._modals.map(m => m.body).join('').indexOf('九州枯萎图') >= 0, 'B20 枢纽完成态：枯萎图+账本入口（无死按钮）');
}

// ============ B' 女玩家盘（性别分流差别不省） ============
{
    var W = makeWorld({ gender: 'female', stones: 10 });
    W.qiStartPrologue();
    W.qiSceneChoice('chen', 'pass');
    ok(W.qiLedgerProbe().graces.length === 0 && W.eventFlags['_qi_chen'] === 'pass', 'B21 走开不入账（世界不打分）');
    W.qiSceneChoice('liu', 'buy');
    ok(W.inventory.currency.spiritStones === 10 && W._overlays.join('').indexOf('灵石不够') >= 0, 'B22 灵石不够：按钮置灰不扣钱');
    W.qiSceneChoice('liu', 'pass');
    W.qiSceneChoice('yu', 'pass');
    ok(W.eventFlags['_qi_yu'] === 'pass', 'B23 不帮七霞派：旗标正确');
    W.qiSceneChoice('zhou', 'pass');
    var t = W._overlays.join('');
    ok(t.indexOf('三万年了，头一个') >= 0 && t.indexOf('头一个都不图的') < 0, 'B24 初见女版分流（差别不省）');
    W.qiToRoute();
    W.qiRouteChoice('follow');
    ok(W.eventFlags['qi_route'] === 'follow' && W._logs.join('').indexOf('朝灵脉尽头走了回去') >= 0, 'B25 追随开场文本');
}

// ============ C 世界层 ============
{
    var W = makeWorld();
    W.eventFlags['qi_anchor_day'] = 500;
    ok(W.qiWitherCity('大漠孤城') === true && W.qiWitherCity('大漠孤城') === false, 'C1 枯脉一次性');
    ok(Math.abs(W.QI_CONCENTRATION['大漠孤城'].base - 0.2) < 0.001, 'C2 浓度砍半再砍半（0.8→0.2）');
    ok(W.qiCityOverlay('大漠孤城').indexOf('井还是甜的') >= 0, 'C3 城景初枯段');
    ok(W.qiCityOverlay('冰原城') === '', 'C4 未枯城静默');
    W.qiSetStage(2);
    ok(W.qiCityOverlay('大漠孤城').indexOf('灵气充盈') >= 0 && W.globalQiLevel === 55, 'C5 中期废段+总闸55');
    W.qiSetStage(3);
    ok(W.qiCityOverlay('大漠孤城').indexOf('只剩驼铃') >= 0 && W.globalQiLevel === 30, 'C6 后期空段+总闸30');
    // 倒计时
    W.eventFlags['qi_anchor_day'] = 500;
    W._setDay(600);
    ok(W.qiCountdownText().indexOf('年') >= 0, 'C7 倒计时报剩余');
    W._setDay(500 + 1080);
    ok(W.qiCountdownText().indexOf('期限已至') >= 0, 'C8 到期文案（最后一条脉在等你）');
    // 时间副推进
    var W2 = makeWorld();
    W2.qiStartPrologue();
    W2.qiSceneChoice('chen', 'pass'); W2.qiSceneChoice('liu', 'pass'); W2.qiSceneChoice('yu', 'pass'); W2.qiSceneChoice('zhou', 'pass');
    W2.qiToRoute(); W2.qiRouteChoice('ignore');
    var anchor = W2.eventFlags['qi_anchor_day'];
    W2.qiWitherCity('大漠孤城');
    W2._setDay(anchor + 180); W2._bumpDay(0);
    ok(W2.eventFlags['qi_withered_冰原城'] && W2._logs.join('').indexOf('你不在场') >= 0, 'C9 时间副推进：180日未推进额外枯一城+播报');
    W2._setDay(anchor + 360); W2._bumpDay(0);
    ok(W2.eventFlags['qi_withered_万毒谷'], 'C10 第二个180日再枯一城');
    ['青木城', '剑阁', '炎城', '洛水城', '帝都·长安'].forEach(c => W2.qiWitherCity(c));
    W2._setDay(anchor + 540); W2._bumpDay(0);
    ok(W2.qiWorldProbe().withered.length === 8, 'C11 八城封顶（最后一条脉永不随时间枯）');
    // 枯萎图面板
    W2.qiOpenWitherMap();
    var mapBody = W2._modals.map(m => m.body).join('');
    ok(mapBody.indexOf('已枯') >= 0 && mapBody.indexOf('最后一条脉在血海坝下') >= 0, 'C12 枯萎图：计数+最后一条脉注脚');
}

// ============ D 账本与面板 ============
{
    var W = makeWorld();
    W.openQiLedger();
    var body = W._modals.map(m => m.body).join('');
    ok(['占脉名单', '恩列', '搁浅列', '人心簿'].every(s => body.indexOf(s) >= 0), 'D1 账本四列齐备');
    ok(body.indexOf('趁乱吃人的') >= 0, 'D2 空列有叙事占位（不是死面板）');
    W.addQiHeart('测试人心一笔');
    W.openQiLedger();
    ok(W._modals.map(m => m.body).join('').indexOf('测试人心一笔') >= 0, 'D3 人心簿写入可读');
    var W2 = makeWorld();
    W2.qiStartPrologue();
    W2.openQiEndgamePanel();
    ok(W2._modals.map(m => m.body).join('').indexOf('序幕进行中') >= 0, 'D4 面板中途态可续（断点续玩）');
    W2.eventFlags['qi_scene'] = 'yu_battle_pending';
    W2.qiResumePrologue();
    ok(W2._lastEnemy && W2._lastEnemy.name === '脉贼头目·疤面', 'D5 战斗断点续接');
}

// ============ E 文案纪律 ============
{
    var W = makeWorld({ gender: 'male', stones: 5000 });
    W.qiStartPrologue();
    W.qiSceneChoice('chen', 'sit'); W.qiSceneChoice('liu', 'buy');
    W.qiSceneChoice('yu', 'guard'); W.settleQiBattle(true, 'yu');
    W.qiSceneChoice('zhou', 'redeem');
    ok(W.inventory.currency.spiritStones === 4670 && W.qiLedgerProbe().stranded.length === 0, 'E1 赎人扣三百（30+300）、搁浅列不挂账（当场销）');
    W.qiToRoute(); W.qiRouteChoice('oppose');
    W.qiOpenWitherMap(); W.openQiLedger();
    var t = allText(W).replace(/<[^>]+>/g, '');
    ok(!/[A-Za-z]/.test(t), 'E2 全部玩家可见文本零外文字母');
    ok(t.indexOf('次数') < 0 && t.indexOf('上限') < 0, 'E3 零配额句式（宪法）');
    ok(t.indexOf('鼎炉') < 0 && t.indexOf('气运') < 0, 'E4 旧设定词清零（鼎炉/气运药引）');
    ok(t.indexOf('妹妹') < 0 && t.indexOf('姐姐') < 0, 'E5 年龄铁设定（她永不自称妹、不称玩家姐）');
    ok(t.indexOf('本座') >= 0, 'E6 自称只有「本座」');
    var src1 = read('js/quest/qi-arc1.js'), src2 = read('js/quest/qi-world.js');
    ok(src1.indexOf('endgame_') < 0 && src2.indexOf('endgame_') < 0, 'E7 新模块零旧旗标（endgame_* 不读不写）');
}

console.log('qi-batch1: ' + passed + ' passed, ' + failures.length + ' failed');
if (failures.length) { failures.forEach(f => console.log('  FAIL: ' + f)); process.exit(1); }
