// ==================== 门派补厚批一验收：贡献账本 + 死锁修复 + 死代码清理 ====================
// 覆盖：A 死锁修复（商店/每日收入/sectName 写入与老档兜底） / B 记账口全接线 / C 死代码核销 /
//       D 账本模块运行时（记满三十条截尾/支出守卫/晋升差额含丐帮净衣减免/面板内容） / E 文案纪律
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');

let passed = 0; const failures = [];
function ok(cond, msg) { if (cond) { passed++; } else { failures.push(msg); console.log('  ✗ ' + msg); } }
function read(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// ============ A 死锁修复 ============
{
    const app = read('js/app.js');
    ok(app.indexOf("(!window.discipleState.sectName && !window.discipleState.sectId)") >= 0, 'A1 贡献商店开关双读 sectId（老档新档都进得去）');
    ok(app.indexOf("(window.discipleState.sectName || window.discipleState.sectId)) {\n        spiritStoneIncome += 20") >= 0, 'A2 每日收入门派加成复活');
    const sys = read('js/sects/sects-system.js');
    ok(sys.indexOf('sectName: sectId,') >= 0, 'A3 joinSect 写入 sectName（病根修复）');
    ok(sys.indexOf("ds.sectName = data.sectName || data.sectId || null") >= 0 && sys.indexOf('_ledger: ds._ledger') >= 0 && sys.indexOf('ds._ledger = data._ledger') >= 0, 'A4 存读档：sectName 老档兜底 + 账本流水随档持久化');
}

// ============ B 记账口全接线（15+ 写入点） ============
{
    const sites = [
        ['js/sects/sects-system.js', 3], ['js/sects/sects-deep-ui.js', 4],
        ['js/sects/sect-visit.js', 1], ['js/sects/sect-resource-actions.js', 1],
        ['js/core/daily-events.js', 1], ['js/sects/sect-exclusive-events.js', 1],
        ['js/sects/sect-crisis-engine.js', 1], ['js/sects/sect-year-goal.js', 1],
        ['js/sects/sect-story-arc.js', 1], ['js/core/reward-service.js', 1], ['js/app.js', 2]
    ];
    let allWired = true, detail = [];
    sites.forEach(function ([f, n]) {
        const c = (read(f).match(/sectLedgerNote/g) || []).length;
        if (c < n) { allWired = false; detail.push(f + ':' + c + '/' + n); }
    });
    ok(allWired, 'B1 全部贡献写入/支出点接记账口' + (detail.length ? '（缺：' + detail.join(',') + '）' : ''));
    ok(read('js/sects/sects-deep-ui.js').indexOf("applySectEventEffects(c.effects, sectName, ev.name || ev.id)") >= 0, 'B2 事件记账带事件名（不是糊涂账）');
    ok(read('js/sects/sects-deep-ui.js').indexOf("'晋升答礼·' + rankDef.name") >= 0 && read('js/app.js').indexOf("'贡献商店·' + (item.name || itemId)") >= 0, 'B3 两大支出口记账带名目');
    const ui = read('js/sects/sects-deep-ui.js');
    ok(ui.indexOf('window.openSectLedger()') >= 0 && ui.indexOf('距 ') >= 0 && ui.indexOf('点开看账本') >= 0, 'B4 账本入口两处（详情页贡献格+晋升面板进度行）');
}

// ============ C 死代码核销 ============
{
    ok(!fs.existsSync(path.join(ROOT, 'js/sects/sect-wudang-deep.js')) && read('仙侠.html').indexOf('sect-wudang-deep') < 0, 'C1 武当死模块整层删除（336行零调用）');
    const jf = read('js/sects/sect-join-flow.js');
    ok(jf.indexOf('太虚剑宗') < 0 && jf.indexOf('taiXu') < 0, 'C2 架空门派考核死代码清零');
    ok(read('js/app.js').indexOf('_quickFoundSect') < 0, 'C3 遗留转发壳删除');
    ok(read('仙侠.html').indexOf('js/sects/sect-economy.js') >= 0, 'C4 账本模块已挂脚本位');
}

// ============ D 账本模块运行时 ============
function makeWorld() {
    var logs = [], modals = [], day = 500;
    var W = {
        console: { log: function () {} },
        Math: Math, JSON: JSON, Object: Object, Array: Array, String: String, Number: Number,
        discipleState: null,
        COMMON_RANKS: [
            { id: 0, name: '掌门', promoteCondition: null },
            { id: 1, name: '副掌门', promoteCondition: { contribution: 12000 } },
            { id: 6, name: '记名弟子', promoteCondition: { contribution: 100 } },
            { id: 7, name: '杂役弟子', promoteCondition: null }
        ],
        showMessage: function (m) { logs.push(String(m)); },
        showModal: function (t, b) { modals.push({ title: String(t), body: String(b) }); },
        timeSystem: { getAbsoluteDay: function () { return day; } },
        _logs: logs, _modals: modals,
        _setDay: function (d) { day = d; }
    };
    W.window = W;
    var ctx = vm.createContext(W);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/sects/sect-economy.js'), 'utf8'), ctx, { filename: 'sect-economy' });
    return W;
}
{
    var W = makeWorld();
    W.openSectLedger();
    ok(W._logs.join('').indexOf('还没入门') >= 0, 'D1 未入门点账本：一句话打发，不炸');
    W.discipleState = { isInSect: true, sectId: '少林寺', rank: 7, rankName: '杂役弟子', contribution: 40 };
    W.sectAddContribution(60, '门派差事·打扫庭院');
    ok(W.discipleState.contribution === 100 && W.sectLedgerEntries()[0].reason === '门派差事·打扫庭院', 'D2 收入记账：余额与名目');
    ok(W.sectSpendContribution(500, '晋升答礼·记名弟子') === false && W.discipleState.contribution === 100 && W.sectLedgerEntries().length === 1, 'D3 支出守卫：不够就不扣不记');
    ok(W.sectSpendContribution(100, '晋升答礼·记名弟子') === true && W.discipleState.contribution === 0 && W.sectLedgerEntries()[0].amt === -100, 'D4 支出记账：负数流水');
    for (var i = 0; i < 35; i++) W.sectAddContribution(1, '流水压力第' + i + '笔');
    ok(W.sectLedgerEntries().length === 30 && W.sectLedgerEntries()[0].reason.indexOf('第34笔') >= 0, 'D5 流水封顶三十条、最新在前');
    // 晋升差额与丐帮净衣减免
    var nx = W.sectNextRankInfo(W.discipleState);
    ok(nx.name === '记名弟子' && nx.need === 100 && nx.gap === 65, 'D6 晋升差额计算（当前35/需100）');
    W.discipleState.contribution = 35;
    W.discipleState.sectId = '丐帮'; W.discipleState._gbFaction = { side: 'clean' };
    ok(W.sectNextRankInfo(W.discipleState).need === 70, 'D7 丐帮净衣减免三成沿用既有规则');
    W.discipleState.rank = -1;
    ok(W.sectNextRankInfo(W.discipleState).special === true, 'D8 特殊身份（侍妾/同参）不硬造晋升线');
    W.discipleState.rank = 0;
    ok(W.sectNextRankInfo(W.discipleState).done === true, 'D9 掌门档：路没了上一档');
    // 面板内容
    W.discipleState = { isInSect: true, sectId: '少林寺', sectName: '少林寺', rank: 7, rankName: '杂役弟子', contribution: 250 };
    W.sectAddContribution(0, 'x');
    W.openSectLedger();
    var body = W._modals.map(m => m.title + m.body).join('');
    ok(body.indexOf('贡献账本 · 少林寺') >= 0 && body.indexOf('250') >= 0, 'D10 面板：门派名+余额');
    ok(body.indexOf('记名弟子') >= 0 && body.indexOf('可以去求晋升了') >= 0, 'D11 面板：晋升差额行（够了就写可晋升，不报公式）');
    ok(body.indexOf('晋升答礼') >= 0 && body.indexOf('贡献商店') >= 0 && body.indexOf('藏经阁') >= 0, 'D12 面板：钱的三个去处一键直达');
    ok(body.indexOf('流水压力') >= 0 || body.indexOf('近期流水') >= 0, 'D13 面板：近期流水区');
}

// ============ E 文案纪律 ============
{
    var W = makeWorld();
    W.discipleState = { isInSect: true, sectId: '少林寺', rank: 5, rankName: '外门弟子', contribution: 88 };
    W.sectAddContribution(12, '门派事件·藏经阁夜雨');
    W.sectSpendContribution(50, '贡献商店·回春丹');
    W.openSectLedger();
    var t = (W._logs.join('|') + W._modals.map(m => m.title + m.body).join('|')).replace(/<[^>]+>/g, '');
    ok(!/[A-Za-z]/.test(t.replace(/第\d+日/g, '')), 'E1 账本玩家可见文本零外文字母');
    ok(t.indexOf('次数') < 0 && t.indexOf('上限') < 0, 'E2 零配额句式');
}

console.log('sect-economy: ' + passed + ' passed, ' + failures.length + ' failed');
if (failures.length) { failures.forEach(f => console.log('  FAIL: ' + f)); process.exit(1); }
