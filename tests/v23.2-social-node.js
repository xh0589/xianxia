// ==================== v23.2 人情线验收（四批全修·第四批） ====================
// 审计：账房线（钱庄/当铺/盐路/镖局）做熟了，人情线塌了一半——深谈可连点刷好感、求助配置了情分
// 却不扣、NPC主动请求是无法应答的死布景、飞鸽价目表写着收费实则免费+回信罐头、市场供需模型
// 写好没接线（玩家买卖不动行情）、拍卖行是三段写死的假竞价、外交百分百成功、门派任务 alert 系统腔。
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');

let passed = 0; const failures = [];
function ok(cond, msg) { if (cond) { passed++; } else { failures.push(msg); console.log('  ✗ ' + msg); } }
function eq(a, b, msg) { ok(a === b, msg + '（实得 ' + a + '，期望 ' + b + '）'); }
function read(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// ============ A 源码接线 ============
{
    const ns = read('js/npcs/npc-system.js');
    ok(/_dtFatigue >= 4 \? -1 : \(_dtFatigue === 3 \? 0 : 1\)/.test(ns) && ns.indexOf('至多三席') < 0,
        'A1 深谈茶凉话淡：三席话淡、再缠人恼（v23.3：递进后果替代每日三席硬闸）');
    ok(/executeDeepTalkSubOption[\s\S]{0,1400}advanceTime\(10, '与'/.test(ns), 'A2 深谈一席费时辰');
    ok(/FAVOR_COST = \{ request_heal: 10[\s\S]{0,400}Math\.max\(0, \(npc\.relationship\.favor \|\| 0\) - _favCost\)/.test(ns),
        'A3 求助真扣情分（旧版 minFavor 只是门票，进门分文不扣）');
    ok(ns.indexOf('function buildNpcRequestHtml(') >= 0 && ns.indexOf('function respondNpcRequest(') >= 0, 'A4 NPC主动请求有了应答入口');
    ok(ns.indexOf('window.respondNpcRequest = respondNpcRequest;') >= 0, 'A5 应答函数导出（onclick 可达）');
    ok(/npc\._pendingRequests\.push\(\{ type: 'auto', msg: req\.msg, item: req\.item \|\| null, action: req\.action \|\| null, rewardAff/.test(ns),
        'A6 请求入账带全字段（旧版只存msg，item/action全丢——想应答也无从应起）');
    ok(/buildNpcRequestHtml\(npc, npcId\)/.test(ns) && ns.indexOf('${(typeof buildNpcRequestHtml') >= 0, 'A7 请求区块挂进对话面板模板');
    ok(/respondNpcRequest[\s\S]{0,2500}npcNotCoLocated\(npc\)/.test(ns), 'A8 应答须当面（远程不应承）');
    ok(/respondNpcRequest[\s\S]{0,3000}removeCount/.test(ns), 'A9 交物类请求真扣物品');

    const ms = read('js/mail-system.js');
    ok(/playerSendMail[\s\S]{0,1200}_car\.cost > 0[\s\S]{0,500}deductSpiritStones/.test(ms), 'A10 灵镜/玉简资费真扣（价目表不再是装饰）');
    ok(/playerSendMail[\s\S]{0,1600}advanceTime\(10, '修书一封'\)/.test(ms), 'A11 写信花时间');
    ok(/playerSendMail[\s\S]{0,3000}replyProb[\s\S]{0,800}GameScheduler\.schedule\('mail:auto_reply'/.test(ms), 'A12 写出去的信会有回音（旧版单向黑洞）');
    ok(/sendAutoReplyFromNPC[\s\S]{0,900}_rpAff >= 60\) replyArr = replyBank\.high/.test(ms), 'A13 回信看交情分档（不再是人人「知道了/嗯/行」）');
    ok(/_mailAffDay[\s\S]{0,500}_mRec\.n <= 2/.test(ms) && ms.indexOf('_mailCool') >= 0 && ms.indexOf('每日至多三封') < 0,
        'A14 至交书信暖情分；来得太勤回信自然转短（v23.3：人情冷却替代隐形三封配额）');

    const md = read('js/extensions/market-dynamic.js');
    ok(md.indexOf('function notePlayerTrade(') >= 0 && md.indexOf('notePlayerTrade: notePlayerTrade') >= 0, 'A15 供需记账统一入口就位');
    const inv = read('js/inventory.js');
    ok(/confirmBuyQuantity[\s\S]{0,1200}notePlayerTrade\(itemId, qty, true\)/.test(inv), 'A16 市场买入推动行情');
    ok(/function confirmBuyQuantity[\s\S]{0,600}showMessage/.test(inv) && !/function confirmBuyQuantity[\s\S]{0,600}alert\(/.test(inv), 'A17 买入弹窗的系统腔 alert 清除');
    const es = read('js/enhanced-shop.js');
    ok(/buyFromEnhancedShop[\s\S]{0,700}notePlayerTrade\(itemId, 1, true\)/.test(es), 'A18 商店买入推动行情');
    ok(/executeSell[\s\S]{0,3000}notePlayerTrade\(template\.id \|\| quote\.itemId, quote\.quantity, false\)/.test(es), 'A19 卖出同样动行情（一城抛货该行当就该松）');

    const b2 = read('js/city-facilities/facility-batch2.js');
    ok(b2.indexOf('au_bid2') < 0, 'A20 拍卖行三段写死剧本拆除');
    ok(/au_bid[\s\S]{0,1800}roll: \{[\s\S]{0,200}prob: 0\.55[\s\S]{0,900}lose: \{/.test(b2), 'A21 竞价来真的：跟价有成败、落槌价浮动、会被截胡');
    ok(/按兵不动[\s\S]{0,600}prob: 0\.3/.test(b2), 'A22 捡漏是低概率博弈不是白送');

    const sv = read('js/sects/sect-visit.js');
    ok(/initiateSectConflict[\s\S]{0,1200}contribution \|\| 0\) < 200/.test(sv), 'A23 征讨要贡献开拔（200）');
    ok(/initiateSectConflict[\s\S]{0,2000}_cWin = Math\.random\(\) < 0\.55/.test(sv), 'A24 征讨有胜负：赢缴获记功、输带伤仇深');
    ok(/proposeSectAlliance[\s\S]{0,1400}_aChance = Math\.min\(0\.9, Math\.max\(0\.15, 0\.5 \+ _rel \/ 200\)\)/.test(sv), 'A25 结盟看平日交情定成功率（旧版提议必成）');
    ok(/showSectBulletinDialog[\s\S]{0,1400}isLeaderAway\(sectName\)/.test(sv), 'A26 公告栏照进世界：掌门行止上墙');
    ok(/showSectBulletinDialog[\s\S]{0,1800}rankName/.test(sv), 'A27 公告栏照进自己：职分贡献上墙');

    const ss = read('js/sects/sects-system.js');
    const subFn = ss.slice(ss.indexOf('function submitDailyTask'), ss.indexOf('// ============ 重置每日任务'));
    ok(subFn.indexOf('alert(') < 0, 'A28 日常任务全程无原生 alert');
    ok(subFn.indexOf('_tMul') >= 0, 'A29 任务奖励随办得好坏浮动±（不再是死数）');

    const sdu = read('js/sects/sects-deep-ui.js');
    ok(/sectCompleteTask[\s\S]{0,1500}Math\.random\(\) < 0\.1[\s\S]{0,300}出了岔子/.test(sdu), 'A30 差事一成概率办砸（可再办）');
    ok(/sectPromote[\s\S]{0,2000}advanceTime\(60, '晋升答礼'\)/.test(sdu), 'A31 晋升有仪程（执事唱名、堂上见礼）');
    ok(/sectBecomeStudent[\s\S]{0,2500}advanceTime\(90, '行拜师礼'\)/.test(sdu), 'A32 拜师有礼（敬茶聆训）');

    const app = read('js/app.js');
    ok(app.indexOf('function haggleWanderItem(') >= 0 && app.indexOf('window.haggleWanderItem = haggleWanderItem;') >= 0, 'A33 游商讨价还价入口就位');
    ok(/haggleWanderItem[\s\S]{0,1200}item\._haggleMul = 0\.8/.test(app), 'A34 谈成八折（口才抬成功率）');
    ok(/haggleWanderItem[\s\S]{0,1400}item\._haggleMul = 1\.1/.test(app), 'A35 谈崩贵一成（游商记仇）');
    ok(/buyWanderItem[\s\S]{0,600}priceMul \* \(item\._haggleMul \|\| 1\)/.test(app), 'A36 谈过的价才是成交价');
}

// ============ B 市场供需运行时 ============
{
    const sb = { console: { log() {}, warn() {}, error() {} }, Math, JSON, Date, Object, Array, String, Number, Boolean };
    sb.window = sb; sb.globalThis = sb;
    sb.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
    sb.EventBus = { on() {}, emit() {}, off() {} };
    sb.WorldCalendar = { day: 1 };
    sb.getCurrentCityName = () => '洛水城';
    sb.currentCharData = { location: '洛水城' };
    // 行情模型的「城」是大区（中州/南疆/东海…），玩家在具体城池——城池→大区的折算必须在账
    sb.mapData = { '中州': { cities: ['帝都 · 长安', '洛水城', '太虚山'] } };
    vm.createContext(sb);
    vm.runInContext(read('js/extensions/market-dynamic.js'), sb, { filename: 'market-dynamic.js' });
    const MD = sb.MarketDynamic;
    ok(!!MD && typeof MD.notePlayerTrade === 'function', 'B1 供需入口可达');

    const before = MD.getIndex('中州', '丹药');
    ok(!!before, 'B2 中州丹药行情在账');
    const beforeSnap = { supply: before.supply, demand: before.demand };
    const mul0 = MD.priceMul('中州', '丹药');
    // 人在洛水城扫货十枚 → 折到中州大区：供应降、需求升 → 价格该动
    MD.notePlayerTrade('pill_small_recovery', 10, true);
    const after = MD.getIndex('中州', '丹药');
    ok(after.supply < beforeSnap.supply && after.demand > beforeSnap.demand, 'B3 玩家扫货真动供需（旧版 adjustFromTrade 全库零调用）');
    const mul1 = MD.priceMul('中州', '丹药');
    ok(mul1 > mul0, 'B4 买多了就该涨价（' + mul0.toFixed(3) + '→' + mul1.toFixed(3) + '）');
    // 反手抛售 → 价格回落
    MD.notePlayerTrade('pill_small_recovery', 30, false);
    const mul2 = MD.priceMul('中州', '丹药');
    ok(mul2 < mul1, 'B5 抛售压价（' + mul1.toFixed(3) + '→' + mul2.toFixed(3) + '）');
    // 无品类物品不入账
    const snap = JSON.stringify(MD.getIndex('中州', '丹药'));
    MD.notePlayerTrade('spec_key', 5, true);
    eq(JSON.stringify(MD.getIndex('中州', '丹药')), snap, 'B6 不入行的物件不乱动行情');
}

// ============ 汇总 ============
console.log('v23.2-social: ' + passed + ' passed, ' + failures.length + ' failed');
if (failures.length > 0) process.exit(1);
console.log('v23.2-social: all green');
