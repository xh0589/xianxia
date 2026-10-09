/**
 * tests/legacy-merged-skill-rebind-node.js
 * 遗留缺陷批 · BUG-4：融合/自创功法 def 跨存档污染（上一批只做了一半）
 *
 * 上一批做了什么：把 xianxia_merged_skills 补进 CHARACTER_STORAGE_KEYS，并加了 SIDE_LEDGER_KEYS
 *   ＋ saveData.sideLedgers 随槽往返（因为 applyFullGameState:859 开头先 clearCharacterStorage()，
 *   只加白名单等于每次读档抹一次——融合早已发生、双方功法也已消耗，抹掉这门功法再也回不来）。
 *   另在 resetWorldForNewGame（game-state.js:683）清过一次 skillPages 里的旧 def。
 *
 * 上一批**没做**什么（就是本套要补的）：读档时只把本档的磁盘账灌了回去，**没有先把上一局留在
 *   skillPages 里的 def 摘掉**。
 *
 *   为什么摘不掉就出事：cultivation.js:1211 rehydrateMergedSkills 在**页面加载时**就跑过一次，
 *   把当时 localStorage 里的完整 def 塞回 window.skillPages 并 unlock(…,'learned')。
 *   而 skillPages 本身**不随存档往返**（equipment.js:221 的 const 表，:660 挂 window）——
 *   切档只换磁盘、换不掉这张内存表。于是换档后功法册里同时挂着两局的目录条目：
 *   装不上、练不了（canEquip 对新档查不到上一局的 def），不泄漏进度但看着乱。
 *
 * 命名规则（purge 的判据，不是拍脑袋）：xianxia_merged_skills 这一本注册表有**两个**写入方，
 *   两个前缀全是运行时合成的，全工程**零处**字面量定义——
 *     merged_     ← cultivation.js:1240  'merged_' + [skill1Id, skill2Id].sort().join('_')
 *     legacyart_  ← grand-legacy.js:438   'legacyart_' + absDay()
 *   grand-legacy.js:455 自己写着「注册走融合功法同一本账」，rehydrateMergedSkills 把两族一起
 *   灌进 skillPages ⇒ 跨档污染也是两族一起来，只清一族等于漏一半。
 *   equipment.js 里 148 个原版功法 id 的前缀只有 acc1/acc2/body/feet/hands/head/mainHand/
 *   move/neck/offHand/ring1/ring2/skill/waist，一个都不沾这两个前缀 ⇒ 按前缀清绝无可能误伤。
 *
 * 手法：真 js/cultivation/cultivation.js ＋ 真 js/core/game-state.js 装进同一个 vm 沙箱真跑，
 *      配 Map 版 localStorage（真删真写）。页面加载那一步走 cultivation.js 自己的自动调用，
 *      换档那一步走 GameState.applyFullGameState 本体——不是抄一份 purge 逻辑。
 * ⚠️ 本套 0 条真 Chrome 屏证：读的都是沙箱里的返回值与源码普查结果。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');

let passed = 0, failed = 0;
function ok(c, m) { if (c) { passed++; console.log('  ✓ ' + m); } else { failed++; console.log('  [FAIL] ' + m); } }
const load = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const 修炼SRC = load('js/cultivation/cultivation.js');
const 状态SRC = load('js/core/game-state.js');

// 真功法表（照抄 equipment.js 的形状：一页装 5 门，末页还能往里塞）
const 原版页 = [
    [{ id: 'skill_basic_qi', name: '引气诀' }, { id: 'art_01', name: '吐纳术' },
     { id: 'mainHand_sword_01', name: '青钢剑诀' }, { id: 'acc1_ring_01', name: '储物戒' }],
    [{ id: 'skill_poison_mist', name: '毒雾功' }],
];
const 新页 = () => 原版页.map(p => p.map(s => Object.assign({}, s)));

const A账 = JSON.stringify([
    { id: 'merged_art_01_art_02', name: '两仪合参诀', effect: '攻击+8%' },
    { id: 'legacyart_100', name: '星陨真解', effect: '攻击+9%' },
]);
const B账 = JSON.stringify([{ id: 'merged_art_07_art_08', name: 'B档新功法', effect: '攻击+7%' }]);

function 建沙箱(账原文, 状态源码) {
    const 存 = new Map();
    if (账原文 != null) 存.set('xianxia_merged_skills', 账原文);
    const 沙 = {
        console: { log() {}, warn() {}, error() {}, debug() {} },
        setTimeout, clearTimeout,
        localStorage: {
            getItem: k => (存.has(k) ? 存.get(k) : null),
            setItem: (k, v) => { 存.set(k, String(v)); },
            removeItem: k => { 存.delete(k); },
            key: i => Array.from(存.keys())[i],
            get length() { return 存.size; },
        },
        saveToStorage(k, v) { 存.set(k, String(v)); return true; },
    };
    沙.window = 沙; 沙.globalThis = 沙; 沙.global = 沙;
    // 功法表必须在 cultivation.js **之前**就位（真实加载顺序 equipment.js:660 早于本文件）：
    // 否则 rehydrateMergedSkills 在文件尾那次自动调用会拿到 undefined 而返回 -1（走 load 事件重试）。
    沙.skillPages = 新页();
    vm.createContext(沙);
    vm.runInContext(修炼SRC, 沙, { filename: 'js/cultivation/cultivation.js' });
    vm.runInContext(状态源码 || 状态SRC, 沙, { filename: 'js/core/game-state.js' });
    return { 沙, 存, GS: 沙.GameState };
}

// 把整本功法表摊平成一个 id 数组，找起来断言起来都省事。
// ⚠️ 摊平的对象要和「给谁看」分清：全表(沙) 读的是沙箱里的**活表**（含 rehydrate 灌进去的条目），
//    摊平(原版页) 读的是**出厂表**（equipment.js 那张 const 表的形状）。A2/C5 要问的是出厂表干不干净，
//    拿活表去问会把刚灌进去的两族 def 自己告出来（A2 就这么栽过一次），也会让 C5 变成恒真。
function 摊平(页数组) {
    const out = [];
    (页数组 || []).forEach(p => (p || []).forEach(s => { if (s && s.id) out.push(s.id); }));
    return out;
}
function 全表(沙) { return 摊平(沙.skillPages); }
// 真档：collectFullGameState 恒会写 learnedSecrets（game-state.js:347），所以读档输入也得有这一格。
// 不带的话 applyFullGameState:1058/1064 两个分支都不走，上一局的知识账会整个留下——那是另一种病，
// 不该由本套的断言掩盖过去，故一律按真档给。
function 真档(账, 学到的) {
    return {
        charName: '无名', realm: '炼气', layer: 1, health: 100, qi: 100, energy: 100, spiritStones: 0,
        mainAttributes: {}, combatSkills: {}, combatAbilities: [], lifeSkills: {},
        spiritualRoots: {}, attrs: {}, learnedSecrets: 学到的 || [],
        sideLedgers: { xianxia_merged_skills: 账 }, modules: {},
    };
}

console.log('\n========== 遗留批 · BUG-4 融合/自创功法 def 跨档污染 ==========');

// ============ [A] 命名规则与清户口径 ============
console.log('\n[A] 命名规则：purge 只认注册表那两个前缀');
{
    const A = 建沙箱(A账);
    ok(Array.isArray(A.沙.LEDGER_SKILL_ID_PREFIXES)
        && A.沙.LEDGER_SKILL_ID_PREFIXES.indexOf('merged_') >= 0
        && A.沙.LEDGER_SKILL_ID_PREFIXES.indexOf('legacyart_') >= 0,
        'A1 注册表前缀清单＝ merged_ ＋ legacyart_（现 '
        + JSON.stringify(A.沙.LEDGER_SKILL_ID_PREFIXES) + '）——'
        + '两个前缀是 xianxia_merged_skills 唯二的写入方：cultivation.js:1240 与 grand-legacy.js:438');

    // 出厂表里一个都不该沾这两个前缀（有的话 A2/A3 的 purge 就是拿玩家正当功法开刀）
    const 碰 = 摊平(原版页).filter(id => /^merged_|^legacyart_/.test(id));
    ok(碰.length === 0, 'A2 **出厂**功法表（原版 ' + 摊平(原版页).length + ' 门）里无这两个前缀的 id'
        + '（碰到的: ' + (碰.join('、') || '无') + '）——问的是出厂表，不是刚被 rehydrate 灌过的那张活表');
    const 源码 = 修炼SRC;
    ok(typeof A.沙._isLedgerSkillId === 'function'
        && A.沙._isLedgerSkillId('merged_a_b') === true
        && A.沙._isLedgerSkillId('legacyart_100') === true
        && A.沙._isLedgerSkillId('skill_basic_qi') === false
        && A.沙._isLedgerSkillId('art_01') === false
        && A.沙._isLedgerSkillId('') === false
        && A.沙._isLedgerSkillId(null) === false,
        'A3 _isLedgerSkillId 的判据是「前缀在串首」，不是 contains——'
        + 'skill_basic_qi / art_01 / 空串 / null 一律判否（原版 id 一个都不含这两串，但判据不能靠运气）');
    ok(源码.indexOf("'merged_' + [String(skill1Id), String(skill2Id)].sort().join('_')") >= 0,
        'A4 前缀确实来自本文件 :1240 的合成式（测试与源码对得上，不是测试自己编的一套口径）');
    // 全树零处字面量定义这两个前缀 —— 这是「按前缀清绝不误伤」的根据
    const 命中 = [];
    (function walk(dir) {
        fs.readdirSync(dir, { withFileTypes: true }).forEach(d => {
            const p = path.join(dir, d.name);
            if (d.isDirectory()) return walk(p);
            if (!d.name.endsWith('.js')) return;
            const t = fs.readFileSync(p, 'utf8');
            const re = /id:\s*['"](merged_[^'"]*|legacyart_[^'"]*)['"]/g;
            let m; while ((m = re.exec(t))) 命中.push(path.relative(ROOT, p));
        });
    })(path.join(ROOT, 'js'));
    ok(命中.length === 0,
        'A5 js/ 全树没有一处用字面量定义 merged_/legacyart_ 开头的 id（命中 ' + 命中.length + ' 处'
        + (命中.length ? ': ' + 命中.join('、') : '') + '）——两族全是运行时合成的，所以按前缀清碰不到任何人');
}

// ============ [B] 页面加载那一步：确认污染真的会产生（本套的前提）============
console.log('\n[B] 页面加载 → A 局的 def 进了 skillPages');
{
    const B = 建沙箱(A账);
    const 表 = 全表(B.沙);
    ok(表.indexOf('merged_art_01_art_02') >= 0 && 表.indexOf('legacyart_100') >= 0,
        'B1 cultivation.js:1211 那次自动调用把 A 局两族 def 都灌进了 skillPages（现 ' + 表.length + ' 门：'
        + 表.join('、') + '）');
    ok(B.沙.learnedSecrets && B.沙.learnedSecrets.indexOf('merged_art_01_art_02') >= 0,
        'B2 A 局的 def 也进了知识账（learnedSecrets）——本套只管功法表，知识账本来就随档往返（collect :347）');
}

// ============ [C] 换档：摘上一局 + 按本档重建 ============
console.log('\n[C] 切到 B 档：skillPages 里只剩 B 局的条目');
{
    const C = 建沙箱(A账);
    ok(全表(C.沙).indexOf('merged_art_01_art_02') >= 0, 'C0 换档前 A 局的 def 确实挂在表里（B 段已证，这里再钉一次作对照）');
    C.沙.currentCharData = { name: '无名', mainAttributes: {}, attrs: {} };
    const 回 = C.GS.applyFullGameState(真档(B账, ['merged_art_07_art_08']));
    ok(回 === true, 'C1 applyFullGameState() 跑通并返回 true');
    const 表 = 全表(C.沙);
    ok(表.indexOf('merged_art_01_art_02') < 0 && 表.indexOf('legacyart_100') < 0,
        'C2 A 局的两族 def 都从 skillPages 摘掉了（现 ' + 表.length + ' 门：' + 表.join('、') + '）'
        + '——**这正是上一批漏掉的那一步**，修了就不再两局同挂');
    ok(表.indexOf('merged_art_07_art_08') >= 0, 'C3 B 局的 def 按本档 xianxia_merged_skills 重建进来了');
    ok(C.存.get('xianxia_merged_skills') === B账, 'C4 磁盘账换成了 B 档的原文');
    // 正当功法一个不许少
    const 原版 = 摊平(原版页);
    const 少了 = 原版.filter(id => 表.indexOf(id) < 0);
    ok(少了.length === 0,
        'C5 **出厂** ' + 原版.length + ' 门原版功法一门没少' + (少了.length ? '（少了: ' + 少了.join('、') + '）' : '')
        + '——purge 按前缀切，不会扫到 skill_basic_qi / art_01 / acc1_ring_01 这些');
    ok(全表(C.沙).filter(id => /^merged_|^legacyart_/.test(id)).length === 1,
        'C6 表里带这两个前缀的只剩 B 局那 1 门——没有重复注入（rehydrateMergedSkills 自己查重，purge 不制造第二份）');
}

// ============ [D] 建新角色：这条路径也得干净 ============
console.log('\n[D] resetWorldForNewGame（开新角色）');
{
    const D = 建沙箱(A账);
    D.沙.currentCharData = { name: '新角色', mainAttributes: {}, attrs: {} };
    D.GS.resetWorldForNewGame();
    const 表 = 全表(D.沙);
    ok(!表.some(id => /^merged_|^legacyart_/.test(id)),
        'D1 新角色建起来后表里无任何注册表条目（现 ' + 表.length + ' 门：' + 表.join('、') + '）'
        + '——这条路径上批已经清过，本套确认它**连 legacyart_ 也清到了**（原先只清 merged_，自创功法会留着）');
    ok(表.indexOf('skill_basic_qi') >= 0 && 表.indexOf('mainHand_sword_01') >= 0,
        'D2 原版功法照样留着（清的还是那两个前缀）');
    ok(!D.存.has('xianxia_merged_skills'), 'D3 磁盘上的注册表键也清了（新局不该继承上一局的账）');
}

// ============ [E] 改前复现：把 purge 那一行抹掉，这把尺必须当场报红 ============
console.log('\n[E] 改前复现（读档不摘 ⇒ C2 塌）');
{
    // 只在内存里把 game-state.js 那一行 purge 调用删掉 —— 模拟「上一批那个只灌不摘的版本」，
    // 一个字都不写工作树（E4 复查工作树 byte-exact）。
    const 退回 = 状态SRC.replace(
        /\n\s*if \(typeof global\._purgeLedgerSkillDefsFromPages === 'function'\) global\._purgeLedgerSkillDefsFromPages\(\);\n\s*\} catch \(eMsPurge\) \{\n\s*console\.warn\('\[GameState\] 读档：功法表里的上一局条目摘不干净（可能有重名残留）', eMsPurge && eMsPurge\.message\);\n\s*\}/,
        '\n        } catch (eMsPurge) { }'
    );
    ok(退回 !== 状态SRC, 'E1 注入成功（抹掉读档路径上那一次 purge 调用，长度 ' + 状态SRC.length + ' → ' + 退回.length + '）');
    const E = 建沙箱(A账, 退回);
    E.沙.currentCharData = { name: '无名', mainAttributes: {}, attrs: {} };
    E.GS.applyFullGameState(真档(B账, ['merged_art_07_art_08']));
    const 表 = 全表(E.沙);
    ok(表.indexOf('merged_art_01_art_02') >= 0 && 表.indexOf('legacyart_100') >= 0,
        'E2 不摘的话，A 局的 def 原地不动地留在表里（现 ' + 表.length + ' 门：' + 表.join('、') + '）'
        + '——这就是修前的真实症状：C2 不是恒真');
    ok(表.indexOf('merged_art_07_art_08') >= 0,
        'E3 本档那门确实进来了（两局同挂＝看着乱、canEquip 过不去的那张表）');
    ok(load('js/core/game-state.js') === 状态SRC, 'E4 真实工作树 byte-exact 未被污染（本套全程只在内存里改字符串）');
}

console.log('\n通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);