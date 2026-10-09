/**
 * tests/legacy-clear-storage-whitelist-node.js
 * 遗留缺陷批 · BUG-3：clearCharacterStorage 白名单漏 5 个角色级键
 *
 * 事实（修前）：js/core/game-state.js 的 CHARACTER_STORAGE_KEYS 是白名单制（33 键，设计正确）。
 *   审计点名 5 个漏键、且逐个读过写入方语义：
 *     xianxia_merged_skills     cultivation.js:1121 / grand-legacy.js:479 —— 融合功法**完整 def**
 *                               （页面加载 rehydrateMergedSkills 把它塞回 skillPages 并 unlock 'learned'）
 *     xianxia_asm_ledger        jealousy-assembly.js:293 —— 嫉妒双人余波账（按日，3~10 日后待发）
 *     xianxia_collective_ledger jealousy-collective.js:66 —— 集体戏账（灯节场次/冷却/大典一次性/风评队列）
 *     xianxia_rival_chain_cd    rivalry-chain.js:72 —— 宿敌寻仇冷却（按绝对日键控）
 *     xianxia_map_overlay       world-map.js:293 —— ⚠️ 审计写的是「已探索地图残留」，**与代码实况不符**：
 *                               这个键只存 '1'/'0'，是「路线标记图层显隐」的显示偏好（与 xianxia_settings 同族），
 *                               属账号级，**不该清**。本批据此不列它，C5 段专门钉住这个判断。
 *
 * 白名单还有一个坑，本批一并处理：applyFullGameState 开头会 clearCharacterStorage()（先清后灌）。
 * 白名单键只有被 collect 收进槽里才读得回来——这 4 本没有 StateRegistry 模块，naively 只加白名单
 * 等于「每次读档抹一次」，融合功法 def 抹掉就再也回不来。所以补白名单必须同时补随槽往返（sideLedgers）。
 * [C] 段钉的就是这一条：**读档后这四本的值必须一字不差**。
 *
 * 手法：真 js/core/game-state.js 装进 vm 沙箱，配一个 Map 版 localStorage（真删真写），
 *      collect / apply / clear / reset 四条路都真调。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');

let passed = 0, failed = 0;
function ok(c, m) { if (c) { passed++; console.log('  ✓ ' + m); } else { failed++; console.log('  [FAIL] ' + m); } }
const SRC = fs.readFileSync(path.join(ROOT, 'js/core/game-state.js'), 'utf8');

const 角色级四本 = ['xianxia_merged_skills', 'xianxia_asm_ledger', 'xianxia_collective_ledger', 'xianxia_rival_chain_cd'];

function 建沙箱(源码, 初值) {
    const 存 = new Map(Object.entries(初值 || {}));
    const 沙 = {
        console: { log() {}, warn() {}, error() {} },
        localStorage: {
            getItem: k => (存.has(k) ? 存.get(k) : null),
            setItem: (k, v) => { 存.set(k, String(v)); },
            removeItem: k => { 存.delete(k); },
            key: i => Array.from(存.keys())[i],
            get length() { return 存.size; },
        },
        saveToStorage(k, v) { 存.set(k, String(v)); return true; },
        _rehydrate: [],
    };
    沙.window = 沙;
    沙.rehydrateMergedSkills = function () { 沙._rehydrate.push('merged'); return 0; };
    沙._asmLedgerReload = function () { 沙._rehydrate.push('asm'); return []; };
    沙._collectiveLedgerReload = function () { 沙._rehydrate.push('collective'); return {}; };
    vm.createContext(沙);
    vm.runInContext(源码 || SRC, 沙, { filename: 'js/core/game-state.js' });
    return { 沙, 存, GS: 沙.GameState };
}

function 满仓() {
    return {
        xianxia_merged_skills: JSON.stringify([{ id: 'merged_art_01_art_02', name: '两仪合参诀' }]),
        xianxia_asm_ledger: JSON.stringify([{ h: 'a', g: 'b', day: 12 }]),
        xianxia_collective_ledger: JSON.stringify({ lanterns: { x: 1 }, weddingDone: true }),
        xianxia_rival_chain_cd: JSON.stringify({ n1: 40 }),
        xianxia_map_overlay: '1',
        xianxia_settings: '{"lang":"zh"}',
        xianxia_ngplus: '3',
        xianxia_endings: '["飞升"]',
        xianxia_party_data: '{"members":[]}',
    };
}

console.log('\n========== 遗留批 · BUG-3 clearCharacterStorage 白名单 ==========');

// ============ [A] 名单归属 ============
console.log('\n[A] 名单归属：4 本进角色级、地图图层偏好留在账号级');
{
    const A = 建沙箱();
    const 白 = A.GS.CHARACTER_STORAGE_KEYS, 账号 = A.GS.ACCOUNT_KEYS;
    const 漏 = 角色级四本.filter(k => 白.indexOf(k) < 0);
    ok(漏.length === 0, 'A1 四个角色级键都在 CHARACTER_STORAGE_KEYS 里（现读 ' + 白.length + ' 键）'
        + (漏.length ? '（漏: ' + 漏.join('、') + '）' : ''));
    const 串级 = 角色级四本.filter(k => 账号.indexOf(k) >= 0);
    ok(串级.length === 0, 'A2 四个角色级键**没有**被错加进 ACCOUNT_KEYS（账号级只有 settings/ngplus/endings）'
        + (串级.length ? '（串了: ' + 串级.join('、') + '）' : ''));
    const 图层两侧 = 白.indexOf('xianxia_map_overlay') >= 0 || 账号.indexOf('xianxia_map_overlay') >= 0;
    ok(!图层两侧, 'A3 xianxia_map_overlay 两张单都不在——它是「路线标记图层显隐」显示偏好（值只有 \'1\'/\'0\'，'
        + 'world-map.js:293-320），与 xianxia_settings 同族，属账号级；列进角色级等于每开一局就替玩家关一次图面标注');
    ok(A.GS.SIDE_LEDGER_KEYS && 角色级四本.every(k => A.GS.SIDE_LEDGER_KEYS.indexOf(k) >= 0),
        'A4 SIDE_LEDGER_KEYS 导出且含这四本（白名单键要随槽往返，理由见 C 段）');
}

// ============ [B] 删得掉、留得对 ============
console.log('\n[B] clearCharacterStorage 真删真留');
{
    const B = 建沙箱(SRC, 满仓());
    B.GS.clearCharacterStorage();
    const 还在 = 角色级四本.filter(k => B.存.has(k));
    ok(还在.length === 0, 'B1 clearCharacterStorage()（新游戏/删角色）把这四本删了'
        + (还在.length ? '（还在: ' + 还在.join('、') + '）' : ''));
    ok(B.存.get('xianxia_settings') === '{"lang":"zh"}', 'B2 账号级 xianxia_settings 留着（不随角色走）');
    ok(B.存.get('xianxia_map_overlay') === '1', 'B3 地图图层偏好留着（账号级显示偏好）');
    ok(!B.存.has('xianxia_party_data'), 'B4 白名单里原有的键照旧被删（本批没动既有语义）');
    const B2 = 建沙箱(SRC, 满仓());
    B2.GS.clearCharacterStorage({ alsoAccount: true });
    ok(!B2.存.has('xianxia_settings') && !B2.存.has('xianxia_endings'),
        'B5 clearCharacterStorage({alsoAccount:true}) 连账号级一起删（既有行为未受影响）');
}

// ============ [C] 读档往返：补白名单不等于「读档即抹账」============
console.log('\n[C] collect → apply 一圈之后，这四本必须一字不差');
{
    const C = 建沙箱(SRC, 满仓());
    C.沙.currentCharData = {
        name: '无名', gender: '男', mainAttributes: {}, combatSkills: {},
        lifeSkills: {}, spiritualRoots: {}, attrs: {}, realm: '炼气', layer: 1,
    };
    let 档 = null;
    try { 档 = C.GS.collectFullGameState(); } catch (e) { 档 = null; }
    ok(!!档, 'C1 collectFullGameState() 在沙箱里跑通（读档链的前半段）');
    if (档) {
        ok(档.sideLedgers && 角色级四本.every(k => 档.sideLedgers[k] != null),
            'C2 档里带着这四本的原文（sideLedgers 四格齐全）——'
            + '这就是「白名单键必须被 collect 收进槽」那条规矩的兑现');
        ok(档.sideLedgers.xianxia_merged_skills === 满仓().xianxia_merged_skills,
            'C3 融合功法注册表存的是**原文**不是二次序列化的结果（再套一层 JSON.stringify 会写出 "[[...]]"，读方当场解析失败）');
        // 换角色：把浏览器里现役角色的账全换成别人的，再读这份档
        角色级四本.forEach(k => C.存.set(k, '["别人的账"]'));
        C.存.set('xianxia_map_overlay', '1');
        let 回 = false;
        try { 回 = C.GS.applyFullGameState(档); } catch (e) { 回 = false; }
        ok(回 === true, 'C4 applyFullGameState() 跑通并返回 true');
        const 错 = 角色级四本.filter(k => C.存.get(k) !== 满仓()[k]);
        ok(错.length === 0, 'C5 读档后四本值与档里一致（开头的 clearCharacterStorage 抹过，靠 sideLedgers 灌回来）'
            + (错.length ? '（不一致: ' + 错.join('、') + '）' : ''));
        ok(C.沙._rehydrate.indexOf('merged') >= 0 && C.沙._rehydrate.indexOf('asm') >= 0
            && C.沙._rehydrate.indexOf('collective') >= 0,
            'C6 灌完顺手拉了三处内存态（rehydrateMergedSkills / _asmLedgerReload / _collectiveLedgerReload），'
            + '否则闭包缓存会把灌进去的值当没灌');
        ok(C.存.get('xianxia_map_overlay') === '1', 'C7 读档不动地图图层偏好（账号级）');
        // 档是浏览器本地数据，但回灌口不该有往任意键上写的能力
        const 坏档 = JSON.parse(JSON.stringify(档));
        坏档.sideLedgers.xianxia_settings = '{"lang":"EN"}';
        C.沙.currentCharData = { name: '无名', mainAttributes: {}, attrs: {} };
        let 回2 = false;
        try { 回2 = C.GS.applyFullGameState(坏档); } catch (e) { 回2 = false; }
        ok(回2 === true && C.存.get('xianxia_settings') === '{"lang":"zh"}',
            'C8 档里塞一个不在旁账单上的键（xianxia_settings）也写不进去——'
            + '回灌只认 SIDE_LEDGER_KEYS（现读 settings=' + C.存.get('xianxia_settings') + '）');
    }
}

// ============ [D] 新开局：键与内存态一起清 ============
console.log('\n[D] resetWorldForNewGame（开新角色）');
{
    const D = 建沙箱(SRC, 满仓());
    D.沙.currentCharData = { name: '新角色', mainAttributes: {}, attrs: {} };
    // 页面加载那一步：rehydrateMergedSkills 已把上一局的 def 塞进 skillPages
    D.沙.skillPages = [
        [{ id: 'art_01', name: '吐纳术' }, { id: 'merged_art_03_art_04', name: '上一局自创的功法' }],
        [{ id: 'merged_art_05_art_06', name: '上一局自创的另一门' }],
    ];
    D.GS.resetWorldForNewGame();
    const 残留 = [];
    D.沙.skillPages.forEach(pg => pg.forEach(s => { if (String(s.id).indexOf('merged_') === 0) 残留.push(s.name); }));
    ok(残留.length === 0, 'D1 上一局自创的功法 def 从 skillPages 里清掉了（残留 ' + 残留.length + ' 条）'
        + '——只删键不够：页面加载已经把它们塞进内存，而秘境「残破功法」事件正是从 skillPages 随机抽一门记「听闻」');
    ok(D.沙.skillPages[0].some(s => s.id === 'art_01'), 'D2 原版功法没被误删（清的是 merged_ 前缀那族）');
    const 还在 = 角色级四本.filter(k => D.存.has(k));
    ok(还在.length === 0, 'D3 四本键都被清了' + (还在.length ? '（还在: ' + 还在.join('、') + '）' : ''));
    ok(D.沙._rehydrate.indexOf('asm') >= 0 && D.沙._rehydrate.indexOf('collective') >= 0,
        'D4 嫉妒两本账的闭包缓存被丢弃重读（不清缓存的话下一次写入就把旧条目原样写回键里）');
}

// ============ [E] 改前复现：把这四本从白名单里抹掉，这把尺必须报红 ============
console.log('\n[E] 改前复现（白名单退回 33 键 ⇒ A1/B1/C2/D3 全塌）');
{
    const 退回 = SRC.replace(/^\s*'xianxia_(asm_ledger|collective_ledger|merged_skills|rival_chain_cd)',?\n/gm, '');
    ok(退回 !== SRC, 'E1 注入成功（从同一份源码里抹掉四个键的登记行，长度 ' + SRC.length + ' → ' + 退回.length + '）');
    const E = 建沙箱(退回, 满仓());
    const 漏 = 角色级四本.filter(k => E.GS.CHARACTER_STORAGE_KEYS.indexOf(k) < 0);
    ok(漏.length === 4, 'E2 白名单退回 33 键（四本全漏，正是修前的账）');
    E.GS.clearCharacterStorage();
    const 还在 = 角色级四本.filter(k => E.存.has(k));
    ok(还在.length === 4, 'E3 清完新角色，这四本仍留在浏览器里——修前的真实症状：开新角色看见上一局的账');
    // 工作树必须 byte-exact 未被污染（上面全在内存里做）
    ok(fs.readFileSync(path.join(ROOT, 'js/core/game-state.js'), 'utf8') === SRC,
        'E4 真实工作树 byte-exact 未被污染（本套全程只在内存里改字符串）');
}

console.log('\n通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);
