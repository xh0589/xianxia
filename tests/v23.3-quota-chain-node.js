// ==================== v23.3 配额清账验收（后果链替代计数器） ====================
// 设计宪法：禁止无叙事依据的人为计数器与隐形配额（如「每日限用3次」）；
// 对不合理反复行为用现实式后果链回应，而非弹「次数已用完」。
// 本批清了九处：深谈三席硬闸、飞鸽隐形三封顶、冰塔终身3次、渡劫台封顶30、
// 五景点兜底文案、宝箱/竞技场/社交动作/门派设施四处旧残留。
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

let passed = 0; const failures = [];
function ok(cond, msg) { if (cond) { passed++; } else { failures.push(msg); console.log('  ✗ ' + msg); } }
function read(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// ============ A 深谈：茶凉话淡，不数席数 ============
{
    const ns = read('js/npcs/npc-system.js');
    ok(/_dtGain = insufficientAff \? penalty : \(_dtFatigue >= 4 \? -1 : \(_dtFatigue === 3 \? 0 : 1\)\)/.test(ns),
        'A1 好感随倦意递减：头两席投机、三席话淡、再缠人恼（递进后果）');
    ok(ns.indexOf('_dtRec.n >= 3') < 0 && ns.indexOf('至多三席') < 0,
        'A2 硬闸与配额文案已拆（不再弹「今日话已说尽」拦门）');
    ok(ns.indexOf('话头明显淡了下来') >= 0 && ns.indexOf('掩口打了个哈欠') >= 0,
        'A3 倦意写在对方脸上，不写在系统提示里');
    ok(ns.indexOf('把人缠乏了，好感 -1') >= 0, 'A4 面板底注如实报后果');
    ok(/_dtFatigue === 3 \? 0 : 1[\s\S]{0,80}clamp\(aff \+ _dtGain/.test(ns), 'A5 递减真接进好感结算');
}

// ============ B 飞鸽：信勤了回信自然转短 ============
{
    const ms = read('js/mail-system.js');
    ok(/_mRec\.n <= 2\) _rpNpc\.changeAffection\(1\)/.test(ms) && ms.indexOf('_mailCool') >= 0,
        'B1 头两封暖情分，此后回信转冷（人情冷却替代隐形配额）');
    ok(ms.indexOf('信纸比往常短了些') >= 0 && ms.indexOf('今日信来得勤') >= 0,
        'B2 冷却在信纸上显形——玩家看得见缘由');
    ok(ms.indexOf('每日至多三封') < 0 && ms.indexOf('n < 3') < 0, 'B3 旧隐形封顶已拆');
}

// ============ C 冰塔：寒毒积骨 ============
{
    const ls = read('js/location-system.js');
    ok(ls.indexOf('0.12 / (1 + scarred)') >= 0, 'C1 淬体成功率随寒毒递减');
    ok(ls.indexOf('scarred * 8') >= 0, 'C2 蚀体随寒毒递重（代价递增）');
    ok(ls.indexOf('3/3') < 0 && ls.indexOf('/3 次') < 0 && ls.indexOf('此生第') < 0,
        'C3 终身计数器文案清零（不报数）');
    ok(ls.indexOf('寒毒已深，再淬下去只剩蚀骨之痛') >= 0, 'C4 深寒毒有世界口吻的下文');
}

// ============ D 渡劫台：渐悟渐淡 ============
{
    const ls = read('js/location-system.js');
    ok(ls.indexOf('1 - Math.min(0.85, fb / 40)') >= 0 && ls.indexOf('cap = 30') < 0,
        'D1 感悟递减退益替代硬封顶30');
    ok(ls.indexOf('观摩之悟已至尽头') >= 0 && ls.indexOf('30/30') < 0, 'D2 瓶颈文案讲道理不报数');
}

// ============ E 五景点：制度有名有据 ============
{
    const ls = read('js/location-system.js');
    ok(ls.indexOf('席面已订满') >= 0, 'E1 画舫：鸨母翻花名册（席面订满）');
    ok(ls.indexOf('诗会已散了') >= 0, 'E2 诗会：书童收诗笺（墨干席散）');
    ok(ls.indexOf('星轨一夜只读一回') >= 0, 'E3 观星台：星官封台（台规说破缘由）');
    ok(ls.indexOf('碑灵乏了') >= 0, 'E4 悟道碑：守碑老人点破（碑灵需歇）');
    ok(ls.indexOf('火气未泄') >= 0, 'E5 火山洞：火潮未退（凶险说在当面）');
    ok(!/_gate\('[a-z_]+', 1\)/.test(ls), 'E6 不再有落回兜底文案的闸口');
}

// ============ F 旧残留一并清 ============
{
    const app = read('js/app.js');
    ok(app.indexOf('搜刮次数已尽') < 0 && app.indexOf('值钱的早叫前人拾了去') >= 0,
        'F1 搜箱：旧箱叫前人拾尽了（世界逻辑，不报次数）');
    const ar = read('js/gameplay/arena-system.js');
    ok(ar.indexOf('竞技次数已达上限') < 0 && ar.indexOf('比试牌已经发完') >= 0,
        'F2 竞技场：比试牌发完的台规');
    const ne = read('js/npcs/npc-emotions.js');
    ok(ne.indexOf('每日次数已达上限') < 0 && ne.indexOf('没了脾气') >= 0,
        'F3 社交动作：缠人太甚对方没了脾气');
    const sf = read('js/sects/sect-facilities.js');
    ok(sf.indexOf('次/日') < 0 && sf.indexOf('份例今日已尽') >= 0,
        'F4 门派设施：兜底也讲份例制度');
}

// ============ G 全库扫尾 ============
{
    const files = ['js/app.js', 'js/location-system.js', 'js/npcs/npc-system.js', 'js/mail-system.js',
        'js/gameplay/arena-system.js', 'js/npcs/npc-emotions.js', 'js/sects/sect-facilities.js'];
    let bare = [];
    files.forEach(function (rel) {
        const s = read(rel);
        s.split('\n').forEach(function (line, i) {
            if (!/showMessage|notify|reason:|msg:/.test(line)) return;
            if (/次数已[用尽完达]|（\d+次）|\(\d+次\)|每日次数|至多三|已达上限/.test(line)) bare.push(rel + ':' + (i + 1));
        });
    });
    ok(bare.length === 0, 'G1 七处高频文件零裸配额句式' + (bare.length ? '：' + bare.join(',') : ''));
}

console.log('v23.3 quota-chain: ' + passed + ' passed, ' + failures.length + ' failed');
if (failures.length) { failures.forEach(f => console.log('  FAIL: ' + f)); process.exit(1); }
