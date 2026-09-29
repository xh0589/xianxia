/**
 * ==================== v24.4 存档账本续查验收 ====================
 * 病族（DES-75 同病）：game-state.js 是手写白名单——collect 侧逐字段列、apply 侧逐字段列，
 * 两头都没写名的字段读档即蒸发。DES-75（第一百二十三批）点名过 26 项；本批用全仓字段扫描
 * （102 个运行时写入的角色字段 × 白名单比对）再抓出一批「写方活、读方活、两头零命中」的真进度账：
 *   丹毒 pillPoison（读档免费清毒）／心魔 _heartDemon＋_heartDemonBonus（战胜过的心魔复活、加成白攒）／
 *   行脚三本账 _travel（travel-journal.js 头注白纸黑字承诺「随存档走」，承诺落空）／
 *   冰塔淬体 _iceTowerPerm（寒毒白淬）／本命法宝 _bondedArtifact（「不可易主」形同虚设，法宝丢）／
 *   灵脉 _spiritVein（日产进账丢、可再占）／飞升三件套 _unlockedTianjie·_ascensionDay·_tianjieFrom
 *   （天门读档重新锁上；_mortalOrigin 早在 v20.53 入档，这三兄弟一直漏着）／
 *   死因 lastDeathReason（转世积分按死因计分，证道而死被洗成自然死）／
 *   主线025 双闸 _main025_asked·_main025_stood（戏重演、闸失忆）／
 *   至交书信日账 _mailAffDay（读档绕过「来得太勤」冷却）／自创丹 buff _customPillBuff（凭空消失）。
 * 连带修（死字段）：炼丹炸炉「毒扣血」写的是 cd.hp/cd.maxHp——全仓无人读这两个顶层字段
 *   （真身 health/maxHealth），扣血记在幽灵账上实际纹丝不动。改写 health/maxHealth。
 * 刻意不动（判决记录）：
 *   - 纯写死账（零读方，存了也没人认）：_demonicPower、_debuffs、_heartDemonResolved、_gossipCount——挂账待清；
 *   - 刻意临时态：_confused/_negativeEmotion/_formationBuff/_chillUntil/_fedUntil/_wetUntil（限时）、
 *     _ppWarn50/80、_spentNoticed/_wearyNoticed（一次性提示旗）、_medFlavor、_retreatMarket；
 *   - 另有持久化通道：statusEffects（StateRegistry）、location（locationSystem 独立档）、
 *     difficulty（xianxia_difficulty 独立键）、dungeonFloor（进行态，永久账在 dungeonProgress）；
 *   - 顶层六维 constitution/willpower（冰塔体质+1、斩魔意志+3 落点）属数值落点裁决，另案不顺手改。
 * 运行：node tests/v24.4-save-fields-node.js
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
function eq(a, b, msg) { assert(a === b, msg + '（实际=' + JSON.stringify(a) + ' 期望=' + JSON.stringify(b) + '）'); }
function src(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// ============ [A] 源码接线 ============
console.log('--- [A] 源码接线 ---');
(function () {
    var gs = src('js/core/game-state.js');
    var collect侧 = ['pillPoison: charData.pillPoison', '_heartDemon: charData._heartDemon',
        '_heartDemonBonus: charData._heartDemonBonus', '_travel: charData._travel',
        '_iceTowerPerm: charData._iceTowerPerm', '_bondedArtifact: charData._bondedArtifact',
        '_spiritVein: charData._spiritVein', '_unlockedTianjie: !!charData._unlockedTianjie',
        '_ascensionDay: charData._ascensionDay', '_tianjieFrom: charData._tianjieFrom',
        'lastDeathReason: charData.lastDeathReason', '_main025_asked: !!charData._main025_asked',
        '_main025_stood: !!charData._main025_stood', '_mailAffDay: charData._mailAffDay',
        '_customPillBuff: charData._customPillBuff'];
    var apply侧 = ['pillPoison: n(saveData.pillPoison, 0)', '_heartDemon: (saveData._heartDemon',
        '_heartDemonBonus: n(saveData._heartDemonBonus, 0)', '_travel: (saveData._travel',
        '_iceTowerPerm: n(saveData._iceTowerPerm, 0)', '_bondedArtifact: (saveData._bondedArtifact',
        '_spiritVein: (saveData._spiritVein', '_unlockedTianjie: !!saveData._unlockedTianjie',
        '_ascensionDay: n(saveData._ascensionDay, null)', "_tianjieFrom: saveData._tianjieFrom || ''",
        'lastDeathReason: saveData.lastDeathReason || null', '_main025_asked: !!saveData._main025_asked',
        '_main025_stood: !!saveData._main025_stood', '_mailAffDay: (saveData._mailAffDay',
        '_customPillBuff: (saveData._customPillBuff'];
    var 缺C = collect侧.filter(function (s) { return gs.indexOf(s) < 0; });
    var 缺A = apply侧.filter(function (s) { return gs.indexOf(s) < 0; });
    eq(缺C.length, 0, 'A1 collect 侧 15 字段全点名' + (缺C.length ? '（缺：' + 缺C.join('、') + '）' : ''));
    eq(缺A.length, 0, 'A2 apply 侧 15 字段全点名（两头缺一即蒸发，DES-75 的教训）' + (缺A.length ? '（缺：' + 缺A.join('、') + '）' : ''));

    var ac = src('js/crafting/alchemy-compound.js');
    // 剥注释再扫：修复说明里引述旧字段名（cd.hp/cd.maxHp）是立墓碑，不算残迹
    var acCode = ac.split(/\r?\n/).filter(function (l) { return l.trim().indexOf('//') !== 0; }).join('\n');
    assert(acCode.indexOf('cd.health = Math.max(1,') >= 0 && acCode.indexOf('cd.hp =') < 0 && acCode.indexOf('cd.maxHp') < 0,
        'A3 炼丹炸炉扣血改写 health/maxHealth 真身（cd.hp/cd.maxHp 幽灵账铲除）');
    // 全仓棘轮：角色顶层 .hp 死写不许回来（妖兽/敌人的 b.hp/e.hp 不在此列）
    var 死写 = [];
    (function walk(d) {
        fs.readdirSync(path.join(ROOT, d), { withFileTypes: true }).forEach(function (e) {
            var p = path.join(d, e.name);
            if (e.isDirectory()) walk(p);
            else if (/\.js$/.test(e.name)) {
                var s = src(p);
                var rx = /(?:\bcd|charData|currentCharData|_cd|_car|player)\s*\.\s*hp\s*=[^=]/g;
                if (rx.test(s)) 死写.push(p);
            }
        });
    })('js');
    eq(死写.length, 0, 'A4 全仓棘轮：角色顶层 .hp 死写归零' + (死写.length ? '（' + 死写.join('、') + '）' : ''));
    assert(gs.indexOf('_travel') >= 0, 'A5 travel-journal「随存档走」的头注承诺兑现（此前是句空话）');
})();

// ============ [B] 行为面：真 game-state.js 进沙箱往返 ============
console.log('--- [B] 存档往返行为 ---');
var mockWindow = {
    console: { log: function () {}, warn: function () {}, error: function () {} },
    gameLog: { entries: [], add: function () {} },
    showMessage: function () {},
    currentCharData: null, discipleState: null, currentSkills: {},
    timeSystem: { gameTime: { currentDay: 5, totalMinutes: 7200 }, advanceTime: function () {}, onNewDaySubscribe: function () {} },
    localStorage: {
        _m: {},
        getItem: function (k) { return this._m[k] !== undefined ? this._m[k] : null; },
        setItem: function (k, v) { this._m[k] = String(v); },
        removeItem: function (k) { delete this._m[k]; }
    },
    document: { querySelector: function () { return null; }, querySelectorAll: function () { return []; }, getElementById: function () { return null; } }
};
mockWindow.window = mockWindow;
mockWindow.global = mockWindow;
var ctx = vm.createContext(mockWindow);
function load(rel) { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel }); }
load('js/core/event-bus.js');
load('js/core/state-registry.js');
load('js/core/game-state.js');
assert(mockWindow.GameState && typeof mockWindow.GameState.collectFullGameState === 'function', 'B0 存档系统就绪');

var 原件 = {
    name: '试四', realm: '金丹', layer: 3, health: 88, qi: 77, energy: 66,
    pillPoison: 37,
    _heartDemon: { current: 'demon_greed', stage: 2 },
    _heartDemonBonus: 0.15,
    _travel: { jianghu: { met: true, day: 12 }, market: { haggled: 3 }, escort: { done: true } },
    _iceTowerPerm: 3,
    _bondedArtifact: { name: '镇魂钟', id: 'art_zhenhun', level: 2 },
    _spiritVein: { tier: 2, dailyOutput: 40, claimedDay: 9 },
    _unlockedTianjie: true,
    _ascensionDay: 120,
    _tianjieFrom: '东荒',
    lastDeathReason: 'ascend',
    _main025_asked: true,
    _main025_stood: true,
    _mailAffDay: { npc_a: { day: 5, n: 2 } },
    _customPillBuff: { allAttr: 10, days: 1 },
    _v244对照: '我应当蒸发'
};
mockWindow.currentCharData = JSON.parse(JSON.stringify(原件));

var save = mockWindow.GameState.collectFullGameState();
assert(save && save.pillPoison === 37 && save._bondedArtifact && save._bondedArtifact.name === '镇魂钟',
    'B1 collect 侧：15 字段真进了存档快照');
// 深拷独立性：collect 之后改原件，快照不许跟着变（防引用共账）
mockWindow.currentCharData._travel.jianghu.met = '改了';
mockWindow.currentCharData._bondedArtifact.level = 99;
eq(save._travel.jianghu.met, true, 'B2 快照是深拷：改原件不渗进存档（_travel）');
eq(save._bondedArtifact.level, 2, 'B2b 快照是深拷：改原件不渗进存档（_bondedArtifact）');

// 模拟落盘再读回
var save2 = JSON.parse(JSON.stringify(save));
mockWindow.currentCharData = null;
mockWindow.GameState.applyFullGameState(save2, {});
var 回灌 = mockWindow.currentCharData;
assert(!!回灌, 'B3 apply 侧：角色档重建成功');
eq(回灌.pillPoison, 37, 'B4 丹毒 37 原样回来（读档不再免费清毒）');
eq(回灌._heartDemon && 回灌._heartDemon.current, 'demon_greed', 'B5 心魔进度回来（战胜过的不复活）');
eq(回灌._heartDemonBonus, 0.15, 'B5b 心魔突破加成回来（不白攒）');
eq(回灌._travel && 回灌._travel.jianghu && 回灌._travel.jianghu.met, true, 'B6 行脚账回来（「办过」不丢，一次性事件不可重刷）');
eq(回灌._iceTowerPerm, 3, 'B7 冰塔淬体三层回来（寒毒不白淬）');
eq(回灌._bondedArtifact && 回灌._bondedArtifact.name, '镇魂钟', 'B8 本命法宝回来（「不可易主」兑现）');
eq(回灌._spiritVein && 回灌._spiritVein.tier, 2, 'B9 灵脉回来（日产进账不断、不可再占）');
eq(回灌._unlockedTianjie, true, 'B10 天门保持解锁（读档不重新锁上）');
eq(回灌._ascensionDay, 120, 'B10b 证道日回来');
eq(回灌._tianjieFrom, '东荒', 'B10c 渡界来处回来');
eq(回灌.lastDeathReason, 'ascend', 'B11 死因记名回来（转世积分 ascend +50 不被洗成自然死）');
eq(回灌._main025_stood, true, 'B12 主线025 剧情闸回来（戏不重演）');
eq(回灌._mailAffDay && 回灌._mailAffDay.npc_a.n, 2, 'B13 至交书信日账回来（冷却绕不过）');
eq(回灌._customPillBuff && 回灌._customPillBuff.days, 1, 'B14 自创丹 buff 回来（按天到期照判）');
eq(回灌._v244对照, undefined, 'B15 对照组蒸发：没进白名单的键照样丢——证明 B4~B14 是白名单的功劳，不是探针说谎（DES-75 C2 同款）');

// 旧档底色：没有新字段的档读进来，按底色处理、不凭空发
var 旧档 = mockWindow.GameState.collectFullGameState({ charData: { name: '旧人' } });
['_heartDemon', '_bondedArtifact', '_spiritVein', '_travel', '_mailAffDay', '_customPillBuff'].forEach(function (k) { delete 旧档[k]; });
delete 旧档.pillPoison; delete 旧档._unlockedTianjie; delete 旧档.lastDeathReason; delete 旧档._iceTowerPerm;
mockWindow.GameState.applyFullGameState(旧档, {});
var 旧 = mockWindow.currentCharData;
eq(旧.pillPoison, 0, 'B16 旧档底色：丹毒 0（不凭空发毒）');
eq(旧._bondedArtifact, null, 'B17 旧档底色：无本命法宝（不凭空发）');
eq(旧._unlockedTianjie, false, 'B18 旧档底色：天门锁着（不凭空开）');
eq(旧.lastDeathReason, null, 'B19 旧档底色：死因无名');
eq(旧._iceTowerPerm, 0, 'B20 旧档底色：淬体零层');

console.log('\nv24.4-save-fields：' + passed + ' 通过 / ' + failed + ' 失败');
process.exit(failed ? 1 : 0);
