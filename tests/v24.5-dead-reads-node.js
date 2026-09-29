/**
 * ==================== v24.5 死读修复验收 ====================
 * 病族（window.battle／SectCrisisEngine 同族）：读一个「全仓零挂载」的 window 名字——
 * 顶层 const/class 不挂 window（词法全局），或真身干脆叫别的名字。守卫式读法不炸不报错，
 * 功能静默关死。本批全仓机扫 2185 个 window.X 读点 × 挂载写方比对，抓出并修复 8 处：
 *   ① quest-system getAff 读 window.npcSystem（零挂载）→ 故人托付的好感闸恒 0，带门槛的委托永不可见；改问 npcManager。
 *   ② sect-visit 山门页读 window.SectCrisisEngine.listForSect（引擎真身 window.SectCrisis，方法根本没有）
 *      → 门中真出危机山门页也一字不提；改按真 API（mem().active + SECT_CRISIS_EVENTS 报名）。
 *   ③ daily-events 碑文参悟读裸 window.unlock（真身 KnowledgeSystem.unlock）→ 悟 fragment 静默丢失。
 *   ④ npc-system executeNPCRequest 读 window.requestSystem（真身 window.npcRequestSystem 实例）→ 导出函数整体空转。
 *   ⑤ enhanced-shop 死块拆除：window.playerReputation 零写方（wave113 已立案「按不存在计」），
 *      真声望折扣在 :120 getReputationDiscount(city)——留着死块，将来谁写了这个名就双重折扣。
 *   ⑥ enhanced-shop checkUnlockCondition 读 window.gameState（零挂载）→ 改读 currentCharData
 *      （现行货架 unlockCondition 用量为 0，今日行为零变化，为将来条件货架不踩空）。
 *   ⑦ location-system 兜底支读 window.CITY_FACILITIES（app.js 顶层 const，不挂 window）→ typeof 词法回退。
 *   ⑧ equipment.js 补挂 window.skillPages——event-system learnRandomSkill 读它（零挂载），
 *      兜底 window.allSkills 又全仓不存在 ⇒「你发现了一本上古功法！」奖励多年只弹「没有可学的功法定义」。
 * 判决不动（记录在案）：showGiftUI/cultivationSystem/weatherSystem/updateCharacterUI 等守卫链有活 else，
 *   死枝不咬人；recordStoryChoice 是「若存在」预留钩子；updateBuffUI 一百四十二批已立案刻意留；
 *   __*Rng 是测试注入口；currentLocation 是 DES-58 立案另案；getWeatherTravelTimeMultiplier 全仓无定义
 *   （天气影响脚程属未写功能，数值裁决另案）。
 * 运行：node tests/v24.5-dead-reads-node.js
 */
'use strict';

var fs = require('fs');
var vm = require('vm');
var path = require('path');
var ROOT = path.resolve(__dirname, '..');

var passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) { passed++; console.log('  ✓ ' + msg); }
    else { failed++; console.error('  ✗ ' + msg); }
}
function src(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }
function 剥注释(s) {
    return s.split(/\r?\n/).filter(function (l) { return l.trim().indexOf('//') !== 0; }).join('\n');
}
function sliceFn(source, sig) {
    var at = source.indexOf(sig);
    if (at < 0) return null;
    var i = source.indexOf('{', at), depth = 0, end = -1;
    for (; i < source.length; i++) {
        var c = source[i];
        if (c === '{') depth++;
        else if (c === '}') { depth--; if (!depth) { end = i; break; } }
    }
    return end < 0 ? null : source.slice(source.indexOf('{', at) + 1, end);
}

// ============ [A] 源码接线与幽灵名棘轮 ============
console.log('--- [A] 源码接线 ---');
(function () {
    var qs = 剥注释(src('js/quest/quest-system.js'));
    assert(/getAff = function \(npcId\)[\s\S]{0,300}npcManager\.getNPC/.test(qs) && qs.indexOf('window.npcSystem') < 0,
        'A1 故人托付好感闸改问 npcManager（window.npcSystem 幽灵名清除）');
    var sv = 剥注释(src('js/sects/sect-visit.js'));
    assert(/window\.SectCrisis && typeof window\.SectCrisis\.mem === 'function'/.test(sv) && sv.indexOf('SectCrisisEngine') < 0,
        'A2 山门页危机一行接真引擎 SectCrisis.mem（SectCrisisEngine 幽灵名清除）');
    assert(/_cev\[_cm\.active\.stage\] \|\| _cev\.omen/.test(sv), 'A2b 危机名按当前 stage 从事件池取（omen/crisis/aftermath 三态都报得出名）');
    var de = 剥注释(src('js/core/daily-events.js'));
    assert(/window\.KnowledgeSystem && typeof window\.KnowledgeSystem\.unlock === 'function'/.test(de) && de.indexOf('typeof window.unlock') < 0,
        'A3 碑文参悟接 KnowledgeSystem.unlock 真身（裸 window.unlock 幽灵名清除）');
    var ns = 剥注释(src('js/npcs/npc-system.js'));
    assert(/_reqSys = window\.npcRequestSystem/.test(ns) && ns.indexOf('window.requestSystem') < 0,
        'A4 executeNPCRequest 接 npcRequestSystem 实例真身（window.requestSystem 幽灵名清除）');
    var es = 剥注释(src('js/enhanced-shop.js'));
    assert(es.indexOf('window.playerReputation') < 0,
        'A5 死声望折扣块已拆（真折扣 :120 getReputationDiscount 独此一家，双重折扣的雷排除）');
    assert(/getNestedValue\(window\.currentCharData \|\| window\.gameState \|\| \{\}, key\)/.test(es),
        'A6 货架解锁条件改读 currentCharData 真身（gameState 留作桩位回退）');
    var ls = 剥注释(src('js/location-system.js'));
    assert(/typeof CITY_FACILITIES !== 'undefined'/.test(ls),
        'A7 CITY_FACILITIES 改认词法全局（app.js 顶层 const 不挂 window，typeof 防沙箱）');
    var eq = 剥注释(src('js/equipment.js'));
    assert(/window\.skillPages = skillPages/.test(eq),
        'A8 equipment.js 补挂 window.skillPages（learnRandomSkill 的读方从此有着落）');
    // 全仓棘轮：四个幽灵名不许再被真代码读
    var 幽灵 = ['window.npcSystem', 'window.SectCrisisEngine', 'window.requestSystem', 'window.playerReputation'];
    var 残迹 = [];
    (function walk(d) {
        fs.readdirSync(path.join(ROOT, d), { withFileTypes: true }).forEach(function (e) {
            var p = path.join(d, e.name);
            if (e.isDirectory()) walk(p);
            else if (/\.js$/.test(e.name)) {
                var code = 剥注释(src(p));
                幽灵.forEach(function (g) { if (code.indexOf(g) >= 0) 残迹.push(p + ':' + g); });
            }
        });
    })('js');
    assert(残迹.length === 0, 'A9 全仓棘轮：四个幽灵名真代码归零' + (残迹.length ? '（' + 残迹.join('、') + '）' : ''));
})();

// ============ [B] 行为面：学功法奖励复活 ============
console.log('--- [B] learnRandomSkill 行为 ---');
(function () {
    var es = src('js/event-system.js');
    var body = sliceFn(es, 'function learnRandomSkill');
    assert(!!body, 'B0 切片成功');
    var fn = new Function('window', 'showMessage', 'renderEquipmentPanel', 'renderSkillBrowse',
        'return function learnRandomSkill() {' + body + '};');

    // 改前对照：skillPages 没挂 window、allSkills 不存在——奖励只弹一句空话
    var msgs0 = [];
    fn({ skillPages: undefined, allSkills: undefined }, function (m) { msgs0.push(m); })();
    assert(msgs0.some(function (m) { return m.indexOf('没有可学的功法定义') >= 0; }),
        'B1 改前对照：window.skillPages 零挂载时，「上古功法」奖励只弹「没有可学的功法定义」（病是真的）');

    // 改后：equipment.js 挂出 skillPages（真表形态：页→招），KnowledgeSystem 收账
    var 学了 = [];
    var msgs1 = [];
    var w1 = {
        skillPages: [[{ id: 'skill_01', name: '基础剑法' }, { id: 'skill_02', name: '拂云手' }]],
        KnowledgeSystem: {
            canEquip: function () { return false; },
            unlock: function (id, state, meta) { 学了.push({ id: id, state: state, meta: meta }); }
        }
    };
    var origRnd = Math.random; Math.random = function () { return 0; };
    fn(w1, function (m) { msgs1.push(m); }, null, null)();
    Math.random = origRnd;
    assert(学了.length === 1 && 学了[0].id === 'skill_01' && 学了[0].state === 'learned',
        'B2 改后：功法真进知识系统（unlock(learned, source=event)）');
    assert(msgs1.some(function (m) { return m.indexOf('你学会了功法：基础剑法') >= 0; }),
        'B3 屏上念的是真学到的那门（不再是空话）');

    // 已全学会的口子照旧诚实
    var msgs2 = [];
    fn({ skillPages: w1.skillPages, KnowledgeSystem: { canEquip: function () { return true; } } },
        function (m) { msgs2.push(m); })();
    assert(msgs2.some(function (m) { return m.indexOf('已学会') >= 0; }),
        'B4 全学会时照旧诚实报「已学会当前可见的全部功法」（不硬发）');

    // 真表自证：equipment.js 的 skillPages 确实有货（不是挂了个空表）
    var eq = src('js/equipment.js');
    var tAt = eq.indexOf('const skillPages = [');
    var tEnd = eq.indexOf('\n];', tAt);
    assert(tAt >= 0 && tEnd > tAt && (eq.slice(tAt, tEnd).match(/id:/g) || []).length >= 10,
        'B5 equipment.js 真表在账：skillPages 至少 10 招（实得 ' + ((eq.slice(tAt, tEnd).match(/id:/g) || []).length) + '）');
})();

// ============ [C] 行为面：executeNPCRequest 接真身 ============
console.log('--- [C] executeNPCRequest 行为 ---');
(function () {
    // 直接装真 npc-system（wave95 同款桩），换掉 npcRequestSystem 为探桩
    global.window = global;
    var msgs = [];
    global.showMessage = function (m) { msgs.push(String(m)); };
    global.document = {
        readyState: 'complete',
        createElement: function () { return { style: {}, classList: { add: function () {}, remove: function () {}, contains: function () { return false; } }, appendChild: function () {}, remove: function () {}, addEventListener: function () {}, removeEventListener: function () {}, dispatchEvent: function () {}, setAttribute: function () {}, querySelector: function () { return null; }, querySelectorAll: function () { return []; }, closest: function () { return null; }, getBoundingClientRect: function () { return { left: 0, top: 0, width: 0, height: 0 }; }, scrollIntoView: function () {} }; },
        querySelector: function () { return null; },
        querySelectorAll: function () { return []; },
        getElementById: function () { return null; },
        addEventListener: function () {},
        body: { appendChild: function () {} }
    };
    var store = {};
    global.localStorage = { getItem: function (k) { return store[k] !== undefined ? store[k] : null; }, setItem: function (k, v) { store[k] = String(v); }, removeItem: function (k) { delete store[k]; } };
    global.gameLog = { entries: [], add: function () {} };
    global.timeSystem = { gameTime: { totalMinutes: 57140, currentDay: 40, currentHour: 12, currentMinute: 0 }, getAbsoluteDay: function () { return 40; }, advanceTime: function () {}, onNewDaySubscribe: function () {} };
    global.currentCharData = { name: '玩家', location: '金城' };
    global.discipleState = null;
    global.itemById = {};
    global.setTimeout = function () { return 0; };
    global.setInterval = function () { return 0; };
    global.clearTimeout = function () {};
    global.clearInterval = function () {};
    global.locationSystem = { cityData: { '金城': {} } };
    global.sectsData = {};
    vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'js/npcs/npc-system.js'), 'utf8'), { filename: 'npc-system.js' });

    var 调用 = [];
    global.npcRequestSystem = {
        executeRequest: function (npcId, type) { 调用.push({ npcId: npcId, type: type }); return { success: false, msg: '情分不够，人家摇头。' }; }
    };
    global.executeNPCRequest('mentor_01', 'borrow_item');
    assert(调用.length === 1 && 调用[0].npcId === 'mentor_01' && 调用[0].type === 'borrow_item',
        'C1 请求真落到 npcRequestSystem.executeRequest（旧守卫下这里整体空转、零调用）');
    assert(msgs.some(function (m) { return m.indexOf('情分不够') >= 0; }),
        'C2 回执真上屏（失败支走 error 口径）');
    // 无真身时不炸
    var 存 = global.npcRequestSystem; global.npcRequestSystem = null; msgs.length = 0;
    global.executeNPCRequest('x', 'y');
    global.npcRequestSystem = 存;
    assert(msgs.length === 0, 'C3 系统未就绪时安静早退（不炸不谎报）');
})();

console.log('\nv24.5-dead-reads：' + passed + ' 通过 / ' + failed + ' 失败');
process.exit(failed ? 1 : 0);
