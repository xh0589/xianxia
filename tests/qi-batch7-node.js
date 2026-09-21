// ==================== v25.0《灵气之尽》批七验收：收尾清理 ====================
// 对齐：大纲第十节批七（验收重写+旧死分支清理）+ 九·旧资产处置清单（删除项逐一核销）
// 覆盖：A 旧终局残留清零（静态） / B 死文件核销 / C 跑堂闲话运行时 / D 选择记忆清账
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');

let passed = 0; const failures = [];
function ok(cond, msg) { if (cond) { passed++; } else { failures.push(msg); console.log('  ✗ ' + msg); } }
function read(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// ============ A 旧终局残留清零 ============
{
    const app = read('js/app.js');
    ok(!/Endgame/.test(app) && app.indexOf('endgame') < 0, 'A1 app.js 旧终局引用归零');
    ok(app.indexOf('_isQiStoryBattle') >= 0 && (app.split('_isQiStory').length - 1) >= 4, 'A2 战败豁免位收敛为唯一剧情战旗（胜/败/豁免三路仍在）');
    const be = read('js/building-effects.js');
    ok(be.indexOf('endgameEchoes') < 0 && be.indexOf('qiStreetTavernLine') >= 0, 'A3 酒馆跑堂钩子换血（旧回响清零）');
    const ht = read('js/cultivation/heavenly-tribulation.js');
    ok(ht.indexOf('endgame_') < 0 && ht.indexOf('qi_truth_told') >= 0 && ht.indexOf('qi_fin_fought') >= 0, 'A4 天劫文案改接新正典（真相旗/终战旗）');
    const ae = read('js/endgame/ascension-epilogue.js');
    ok(ae.indexOf('endgame_gate_cleared') < 0 && ae.indexOf('qi_fin_fought') >= 0, 'A5 飞升尾声改接新正典');
    const msa = read('js/quest/main-storyline-arc.js');
    ok(msa.indexOf('openQiEndgamePanel') >= 0 && msa.indexOf('main_xuanming_defeated') >= 0, 'A6 终局入口沿用存活正典门槛（main_006~009）');
    const allJs = [];
    (function walk(d) {
        fs.readdirSync(d).forEach(f => {
            const fp = path.join(d, f);
            if (fs.statSync(fp).isDirectory()) { if (f !== 'node_modules') walk(fp); }
            else if (f.endsWith('.js')) allJs.push(fp);
        });
    })(path.join(ROOT, 'js'));
    const leaks = allJs.filter(fp => {
        const s = fs.readFileSync(fp, 'utf8');
        return /endgameEchoes|settleEndgame|getEndgameArcState|openEndgamePanel|endgame_gate_cleared|endgame_act3_done|endgame_final_cut|_isEndgameRoute/.test(s);
    });
    ok(leaks.length === 0, 'A7 全 js 目录旧终局接口零残留' + (leaks.length ? '：' + leaks.join(',') : ''));
}

// ============ B 死文件核销 ============
{
    const dead = ['v20.97-endgame-arc-node.js', 'v20.98-endgame-act2-node.js', 'v20.99-endgame-act3-node.js', 'v21.0-endgame-debt-node.js', 'v21.7-endgame-mech-node.js', 'v21.9-debt-payoff-node.js', 'v23.3-story-echoes-node.js', 'v24.0-routes-node.js'];
    ok(dead.every(f => !fs.existsSync(path.join(ROOT, 'tests', f))), 'B1 八套作废旧验收文件已删除');
    const sh = read('tests/run-all.sh');
    ok(dead.every(f => sh.indexOf(f) < 0), 'B2 回归清单零死引用');
    ['qi-batch1', 'qi-batch2', 'qi-batch34', 'qi-batch5', 'qi-batch6', 'qi-batch7'].forEach(function (b) { ok(sh.indexOf(b + '-node.js') >= 0, 'B3 新验收套件在回归清单（' + b + '）'); });
    // B4 主线编号唯一性：新终局章节与存活旧链（main_001~005/021~035）不得撞号——撞号会劫持旧章节的接取
    const qiIds = new Set();
    ['qi-arc1', 'qi-arc2', 'qi-arc3', 'qi-arc4', 'qi-finale'].forEach(function (m) {
        (read('js/quest/' + m + '.js').match(/q\('(main_\d+)'|id: '(main_\d+)', title/g) || []).forEach(function (t) {
            var id = (t.match(/main_\d+/) || [])[0];
            if (id) qiIds.add(id);
        });
    });
    const oldIds = new Set();
    (read('js/items-extended/12-quest-extensions.js').match(/id: '(main_\d+)'/g) || []).forEach(t => oldIds.add(t.match(/main_\d+/)[0]));
    (read('js/quest/quest-system.js').match(/id: '(main_\d+)'/g) || []).forEach(t => oldIds.add(t.match(/main_\d+/)[0]));
    const clash = [...qiIds].filter(id => oldIds.has(id));
    ok(qiIds.size >= 24 && clash.length === 0, 'B4 新旧主线编号零撞车（新终局 ' + qiIds.size + ' 章；撞号：' + (clash.join(',') || '无') + '）');
}

// ============ C 跑堂闲话运行时 ============
function makeWorld(opts) {
    opts = opts || {};
    var logs = [], modals = [], overlays = [], day = opts.day || 900;
    var W = {
        console: { log: function () {} },
        Math: Math, JSON: JSON, Object: Object, Array: Array, String: String, Number: Number, isFinite: isFinite, RegExp: RegExp,
        eventFlags: {},
        currentCharData: { realm: '化神', gender: 'male', name: '测试' },
        inventory: { currency: { spiritStones: 1000 } },
        gameLog: { add: function (m) { logs.push(String(m)); } },
        showMessage: function (m) { logs.push(String(m)); },
        showModal: function (t, b) { modals.push({ title: t, body: b }); },
        recordChoice: function () {},
        getRealmTier: function () { return 5; },
        timeSystem: { getAbsoluteDay: function () { return day; }, onNewDaySubscribe: function () {} },
        QuestRegistry: { registerMany: function () {}, get: function () { return null; } },
        mainQuestChain: [], StateRegistry: { register: function () {} },
        QI_CONCENTRATION: { '大漠孤城': { base: 0.8, desc: '沙漠之地' }, '洛水城': { base: 1.1, desc: '水畔' } },
        globalQiLevel: 100, depleteQi: function () {}, restoreWorldQi: function () {},
        document: { getElementById: function () { return null; }, body: { insertAdjacentHTML: function (p, h) { overlays.push(String(h)); } } },
        _logs: logs, _modals: modals, _overlays: overlays,
        _setDay: function (d) { day = d; }
    };
    W.window = W;
    var ctx = vm.createContext(W);
    ['js/quest/qi-world.js', 'js/quest/qi-arc1.js', 'js/quest/qi-street.js'].forEach(function (rel) {
        vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel });
    });
    return W;
}
{
    var W = makeWorld();
    ok(W.qiStreetTavernLine('洛水城') === '', 'C1 账没翻开跑堂静默（不硬塞）');
    W.eventFlags['qi_route'] = 'oppose';
    W.eventFlags['qi_withered_大漠孤城'] = 880; // 批D后分城腔按枯龄轮换：枯龄20日说头一句
    ok(W.qiStreetTavernLine('大漠孤城').indexOf('驼队改运粮') >= 0, 'C2 枯城跑堂说分城腔（初枯头一句）');
    ok(W.qiStreetTavernLine('大漠孤城') !== '' && W.qiStreetTavernLine('大漠孤城').indexOf('驼队') < 0, 'C3 三十日节流生效（同日落回舆论弧线，不重话）');
    ok(W.qiStreetTavernLine('洛水城') !== '', 'C4 未枯城落舆论弧线（有话说）');
    var t = W._logs.join('|') + '|' + W._modals.map(m => m.body).join('|') + '|' + W._overlays.join('|') + '|' + W.qiStreetTavernLine('大漠孤城');
    ok(!/[A-Za-z]/.test(t.replace(/<[^>]+>/g, '')), 'C5 跑堂文本零外文字母');
}

// ============ D 选择记忆清账 ============
{
    const cm = read('js/quest/choice-memory.js');
    const dead = ['main_010_spare', 'main_010_kill', 'main_014_kill', 'main_016_tear', 'main_019_condemn', 'main_020_slay', 'main_020_love', 'main_021_cut', 'main_021_taken', 'main_015_help'];
    ok(dead.every(id => cm.indexOf("'" + id + "'") < 0), 'D1 旧终局死条目清零');
    ok(cm.indexOf("'main_025_protect'") >= 0 && cm.indexOf("'main_025_flee'") >= 0, 'D2 存活条目保留（宗门守卫战）');
    ok((cm.match(/'qi_[a-z0-9_]+':/g) || []).length >= 55, 'D3 新终局抉择登记齐整（批一~批五全量在册）');
}

console.log('qi-batch7: ' + passed + ' passed, ' + failures.length + ' failed');
if (failures.length) { failures.forEach(f => console.log('  FAIL: ' + f)); process.exit(1); }
