'use strict';
/**
 * saveload-cultivation-node.js —— 「读档抹掉功法账」+ 止血丹同族病 的断言门禁
 *
 * 病灶一（js/core/game-state.js · applyFullGameState 知识层）：
 *   读档第一支判据是裸 truthy `if (saveData.techniqueKnowledge)`，而 {} 在 JS 里是真值
 *   ⇒ 只要档里落的是空对象（写档侧 collectFullGameState:368 / app.js:3026 在知识册缺席
 *     或还空时就写 {}），就永远走 importData({})，旧档迁移那条腿永远走不到；
 *   紧跟着那句无条件 `global.learnedSecrets = syncLearnedSecretsList()` 把玩家真账覆盖成空。
 *   秘籍早已被 inventory.js:468 消耗掉 ⇒ 账一空就是不可恢复的损失（真机实测 49 门 → 0）。
 *
 * 病灶二（js/app.js · battleUseMedicalItem 的 pill_hemostatic）：
 *   止血丹的 +10 上限写死 Math.min(100, …)，而气血量程随境界放大（实测金仙九层 928），
 *   于是吃一颗止血丹不是回血而是削血。与 battle.js:4624/:4661（吸血/采补）同族，已改走
 *   同场 Battle 的 _procBloodCap。
 *
 * 本套钉六件事：
 *   A1 ★空对象不吞迁移★  techniqueKnowledge:{} + learnedSecrets 有值 → 读档后一门不少
 *   A2 真账不被清       正账非空的档，读档后原有功法一条不少、状态不降级
 *   A3 幂等             同一份存档读 1 次 vs 读 3 次，逐条相同
 *   A4 老档兼容         没有 techniqueKnowledge 键的老档能正常读
 *   B  止血丹           金仙级（量程 928）吃止血丹不回落 100；凡人级（量程 100）行为零漂移
 *   C  不伤他人         app.js:130/161/292/426/438 那五处 combatSkills 百分比逐字未变
 *   D  反向探针         三层防线（第一支判据 / 旧账并集 / 非空→空禁令）逐层单独拆掉都必须翻红
 *
 * 运行：node tests/saveload-cultivation-node.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');

let 通 = 0; const 红 = [];
function ok(c, m) { if (c) { 通++; console.log('  ✓ ' + m); } else { 红.push(m); console.log('  [FAIL] ' + m); } }
function eq(a, b, m) { ok(a === b, m + '（实际=' + JSON.stringify(a) + ' 期望=' + JSON.stringify(b) + '）'); }
function 读(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8').replace(/\r\n/g, '\n'); }
function 跑(沙, rel, 码) { vm.runInContext(码 !== undefined ? 码 : 读(rel), 沙, { filename: rel }); }

// ============ 通用：从源码里切出一个函数/方法（跳过字符串与注释里的花括号） ============
function 切出(码, 起始正则) {
    const m = 码.match(起始正则);
    if (!m) return null;
    let depth = 0, inS = null, inLine = false, inBlock = false;
    for (let j = m.index + m[0].length - 1; j < 码.length; j++) {
        const c = 码[j], nx = 码[j + 1];
        if (inLine) { if (c === '\n') inLine = false; continue; }
        if (inBlock) { if (c === '*' && nx === '/') { inBlock = false; j++; } continue; }
        if (inS) { if (c === '\\') { j++; continue; } if (c === inS) inS = null; continue; }
        if (c === '/' && nx === '/') { inLine = true; j++; continue; }
        if (c === '/' && nx === '*') { inBlock = true; j++; continue; }
        if (c === "'" || c === '"' || c === '`') { inS = c; continue; }
        if (c === '{') depth++;
        else if (c === '}') { depth--; if (depth === 0) return 码.slice(m.index, j + 1); }
    }
    return null;
}

function 造节点() {
    const n = {
        children: [], style: {}, className: '', id: '', textContent: '',
        classList: { add() { }, remove() { }, toggle() { }, contains: () => false },
        appendChild(c) { return c; }, remove() { }, addEventListener() { }, removeEventListener() { },
        setAttribute() { }, getAttribute: () => null, querySelector: () => null, querySelectorAll: () => [], closest: () => null
    };
    Object.defineProperty(n, 'innerHTML', { get() { return n._h || ''; }, set(v) { n._h = String(v); }, configurable: true });
    return n;
}

// ============ 读档沙箱（与 legacy-save-and-realm-node.js 同款夹具） ============
function 造读档沙箱() {
    const store = Object.create(null);
    const 告警 = [];
    const S = {
        console: { log() { }, warn() { 告警.push([].slice.call(arguments).join(' ')); }, error() { } },
        JSON, Object, Array, String, Number, Boolean, Math, isFinite, Date, RegExp, parseInt, parseFloat,
        setTimeout(fn) { try { fn(); } catch (e) { } return 0; },
        clearTimeout() { }, setInterval() { return 0; }, clearInterval() { }
    };
    S.window = S;
    S.document = {
        readyState: 'complete', createElement: () => 造节点(), createElementNS: () => 造节点(),
        getElementById: () => 造节点(), querySelector: () => null, querySelectorAll: () => [],
        addEventListener() { }, removeEventListener() { },
        body: { appendChild() { }, insertAdjacentHTML() { }, contains: () => true }
    };
    S.localStorage = {
        getItem: k => (store[k] !== undefined ? store[k] : null),
        setItem: (k, v) => { store[k] = String(v); },
        removeItem: k => { delete store[k]; },
        clear: () => { Object.keys(store).forEach(k => { delete store[k]; }); },
        key: i => Object.keys(store)[i] || null,
        get length() { return Object.keys(store).length; }
    };
    S.saveToStorage = function (k, v) { try { S.localStorage.setItem(k, v); return true; } catch (e) { return false; } };
    S.showMessage = () => { };
    S.告警 = 告警;
    return S;
}

// 一份够读档的档（与 legacy-save-and-realm-node.js 同款底子，另加功法账两本）
function 造档(名, 覆写) {
    const d = {
        charName: 名, gender: 'male', realm: '炼气', layer: 1, version: '3.0', timestamp: 1700000000000,
        mainAttributes: { 悟性: 12 }, combatSkills: {},
        inventory: { slots: [], maxSlots: 30, currency: { copper: 583, spiritStones: 10 } }
    };
    return Object.assign(d, 覆写 || {});
}

// 装上真尺：KnowledgeSystem + GameState，并在四个公开口上挂计数（applyFullGameState 全部经对象调它们）
function 装读档世界(gsCode) {
    const S = 造读档沙箱();
    vm.createContext(S);
    跑(S, 'js/core/knowledge-system.js');
    跑(S, 'js/core/game-state.js', gsCode);
    const KS = S.KnowledgeSystem;
    const 计数 = { import: 0, migrate: 0, starter: 0, sync: 0 };
    const 入参 = { import: [] };
    ['importData', 'migrateFromLearnedSecrets', 'initStarterKnowledge', 'syncLearnedSecretsList'].forEach(k => {
        const orig = KS[k];
        KS[k] = function () {
            计数[k.replace('importData', 'import').replace('migrateFromLearnedSecrets', 'migrate')
                .replace('initStarterKnowledge', 'starter').replace('syncLearnedSecretsList', 'sync')]++;
            if (k === 'importData') 入参.import.push(Object.keys(arguments[0] || {}).length);
            return orig.apply(this, arguments);
        };
    });
    S.计数 = 计数;
    S.入参 = 入参;
    return S;
}

// 读一次档，返回「玩家真正看得见的功法账」快照（id + 认知状态；不含 learnedAt ——
// knowledge-system.js 全仓只写不读它，逐次读档会刷新一次，逐条比对时间戳量的是时钟不是账）
function 读档并取账(S, 档) {
    const 收 = S.GameState.applyFullGameState(档);
    const 无册 = !S.KnowledgeSystem;   // KnowledgeSystem 缺席的降级路径（没有正账可取）
    const 正账 = 无册 ? {} : S.KnowledgeSystem.exportData();
    const 状态表 = {};
    Object.keys(正账).sort().forEach(k => { 状态表[k] = 正账[k].state; });
    return {
        收下: 收,
        旧账: (S.learnedSecrets || []).slice().sort(),
        正账键: Object.keys(正账).sort(),
        状态表,
        正账: 正账
    };
}

console.log('\n========== A · 读档不许抹掉功法账 ==========');

// ---------- A1 ★空对象不吞迁移★ ----------
(function A1() {
    console.log('\n[A1] techniqueKnowledge:{} 的档，空对象不再吞掉旧账迁移');
    const 档 = 造档('空对象档', {
        techniqueKnowledge: {},
        learnedSecrets: ['skill_05', 'art_fire_sword', 'merged_xyz']
    });
    const S = 装读档世界();
    const r = 读档并取账(S, 档);
    ok(r.收下 === true, 'A1a 这一档读得进来');
    ok(r.旧账.length > 0, 'A1b ★★读档后 learnedSecrets 不是空（实际 ' + r.旧账.length + ' 条：' + r.旧账.join(',') + '）');
    ['skill_05', 'art_fire_sword', 'merged_xyz'].forEach(id => {
        ok(r.旧账.indexOf(id) >= 0, 'A1c 旧账里原有的一门没丢：' + id);
    });
    ok(r.正账键.length > 0, 'A1d 正账 techniqueKnowledge 也被填上了（' + r.正账键.join(',') + '）——不再 importData({}) 抹平');
    eq(S.计数.import, 0, 'A1e ★第一支判据没走 importData（空对象不再是真值陷阱）');
    ok(S.计数.migrate >= 1, 'A1f ★旧档迁移那条腿真的走到了（migrateFromLearnedSecrets 被调 ' + S.计数.migrate + ' 次）');

    // 真机症状对得上吗：真账清空后 art-effects 的战斗加成会整项归零，这里量的是同一件事
    const 空了 = 装读档世界();
    空了.KnowledgeSystem.importData({});           // 改前的行为：空对象整体替换
    eq((空了.learnedSecrets || []).length, 0, 'A1g 对照组：importData({}) 之后 learnedSecrets 归零（这正是实测的 49 → 0）');
})();

// ---------- A2 真账不被清 ----------
(function A2() {
    console.log('\n[A2] 正账非空的档，读档后原有功法一条不少、状态不降级');
    const 档 = 造档('真账档', {
        techniqueKnowledge: {
            skill_05: { state: 'learned', source: 'manual', completeness: 100, manualId: 'art_sword_basic' },
            skill_18: { state: 'mastered', source: 'manual', completeness: 100, proficiency: 70, manualId: 'art_wan_sword' },
            skill_25: { state: 'studying', source: 'world', completeness: 40 }
        },
        // 旧账除了正账里的两门，还多一条只有它知道的门（自创/融合功法走 inventory.js:772 /
        // grand-legacy.js:473 / cultivation.js:1146 三条回退腿直接 push，正账里查无此门）
        learnedSecrets: ['skill_05', 'art_sword_basic', 'skill_18', 'art_wan_sword', 'merged_only_here']
    });
    const S = 装读档世界();
    const r = 读档并取账(S, 档);
    eq(r.正账键.join(','), 'merged_only_here,skill_05,skill_18,skill_25', 'A2a 正账四条齐全（原三条 + 只在旧账里的那条并进来）');
    eq(r.状态表.skill_05, 'learned', 'A2b skill_05 仍是 learned');
    eq(r.状态表.skill_18, 'mastered', 'A2c ★skill_18 没被旧账迁移降级回 learned（unlock 不允许降级）');
    eq(r.状态表.skill_25, 'studying', 'A2d skill_25 的研读中没被抹掉');
    eq(r.状态表.merged_only_here, 'learned', 'A2e ★只在旧账里的门也升进正账（并集方向：只增不减）');
    ['skill_05', 'art_sword_basic', 'skill_18', 'art_wan_sword', 'merged_only_here'].forEach(id => {
        ok(r.旧账.indexOf(id) >= 0, 'A2f 旧账一条不少：' + id);
    });
    eq(S.计数.import, 1, 'A2g 正账非空时第一支就是 importData（本批没改这条老路的行为）');
    // 正账真的没被就地改坏：importData 内部是深拷贝，档对象本身不该被读档过程改写
    eq(Object.keys(档.techniqueKnowledge).length, 3, 'A2h 档对象本身没被读档过程加键（importData 是深拷贝，可反复喂同一份档）');
    eq(Object.keys(档.techniqueKnowledge).join(','), 'skill_05,skill_18,skill_25', 'A2i 档里的正账逐键未变');
})();

// ---------- A3 幂等 ----------
(function A3() {
    console.log('\n[A3] 同一份存档读 1 次 vs 读 3 次，逐条相同');
    [
        ['正账非空', 造档('幂等甲', {
            techniqueKnowledge: {
                skill_05: { state: 'learned', source: 'manual', completeness: 100, manualId: 'art_sword_basic' },
                skill_18: { state: 'mastered', source: 'manual', completeness: 100 }
            },
            learnedSecrets: ['skill_05', 'art_sword_basic', 'skill_18', 'merged_only_here']
        })],
        ['空对象', 造档('幂等乙', { techniqueKnowledge: {}, learnedSecrets: ['skill_05', 'art_fire_sword', 'merged_xyz'] })],
        ['缺键老档', 造档('幂等丙', { learnedSecrets: ['skill_18', 'merged_q'] })]
    ].forEach(([名, 档]) => {
        const S = 装读档世界();
        const 一次 = 读档并取账(S, JSON.parse(JSON.stringify(档)));
        const 计数一次 = S.计数.migrate;
        读档并取账(S, JSON.parse(JSON.stringify(档)));
        读档并取账(S, JSON.parse(JSON.stringify(档)));
        const 三次 = 读档并取账(S, JSON.parse(JSON.stringify(档)));
        eq(三次.旧账.join(','), 一次.旧账.join(','), 'A3a[' + 名 + '] 旧账读 3 次与读 1 次逐条相同（' + 一次.旧账.join(',') + '）');
        eq(三次.正账键.join(','), 一次.正账键.join(','), 'A3b[' + 名 + '] 正账键集读 3 次与读 1 次相同');
        eq(JSON.stringify(三次.状态表), JSON.stringify(一次.状态表), 'A3c[' + 名 + '] 每条认知状态读 3 次与读 1 次相同');
        eq(三次.旧账.length > 0, true, 'A3d[' + 名 + '] 三次之后账仍非空（' + 一次.旧账.length + ' 门）');
        ok(计数一次 >= 1, 'A3e[' + 名 + '] 第一次读档确实做过迁移（否则下面这条恒等没意义）');
    });
    // 并集必须「只补不盖」：档里已经带上并集结果（即本批修完后的存档形态）时，再读一次
    // 一次 unlock 都不该再跑——unlock 内部会走 Codex.discover，对已有条目那是 count++，
    // 每读一次档抬一次「见过次数」是凭空长出来的账。
    // ⚠️ 口径要说清：档文件**还没**带上并集结果时（merged_only_here 只在旧账数组里），
    //   每次读档都必须重跑那一次迁移——因为 importData 是拿档文件整体替换正账，
    //   内存里并进来的条目不在档文件里。这不是缺陷，正是 self-heal 前的应有形状：
    //   读档后正账已含该门 ⇒ 下一次存档就会写成有键形态 ⇒ 之后每次读档都是 0 次迁移。
    const 未愈档 = 造档('并集档', {
        techniqueKnowledge: { skill_05: { state: 'learned', source: 'manual', completeness: 100 } },
        learnedSecrets: ['skill_05', 'merged_only_here']
    });
    const S = 装读档世界();
    const 首读 = 读档并取账(S, JSON.parse(JSON.stringify(未愈档)));
    ok(首读.正账键.indexOf('merged_only_here') >= 0, 'A3f 未愈档：并集把只知旧账的门补进正账（self-heal 完成）');
    // 存档侧会写的就是这份正账（collectFullGameState:368 走 exportData）
    const 愈档 = 造档('愈后档', {
        techniqueKnowledge: 首读.正账,
        learnedSecrets: 首读.旧账.slice()
    });
    const T = 装读档世界();
    const 三读 = 读档并取账(T, JSON.parse(JSON.stringify(愈档)));
    读档并取账(T, JSON.parse(JSON.stringify(愈档)));
    读档并取账(T, JSON.parse(JSON.stringify(愈档)));
    eq(T.计数.migrate, 0, 'A3g ★档已带上并集结果后：连读三次一次 unlock 都不再跑（迁移次数 ' + T.计数.migrate + '）——只补不盖，没有凭空长账');
    eq(三读.旧账.join(','), 首读.旧账.join(','), 'A3h 愈后档读三次的旧账与首读逐条相同（' + 三读.旧账.join(',') + '）');
    eq(三读.正账键.join(','), 首读.正账键.join(','), 'A3i 愈后档读三次的正账键集与首读相同');
})();

// ---------- A4 老档兼容 ----------
(function A4() {
    console.log('\n[A4] 没有 techniqueKnowledge 键的老档');
    const 老档 = 造档('老档', { learnedSecrets: ['skill_18', 'skill_25', 'merged_q'] });
    ok(!('techniqueKnowledge' in 老档), 'A4a 控制组：这份档真的没有 techniqueKnowledge 键');
    const S = 装读档世界();
    const r = 读档并取账(S, 老档);
    ok(r.收下 === true, 'A4b 老档读得进来');
    ok(r.旧账.length >= 3, 'A4c ★老档里的三门一门不少（' + r.旧账.join(',') + '）');
    ['skill_18', 'skill_25', 'merged_q'].forEach(id => ok(r.旧账.indexOf(id) >= 0, 'A4d 老档原有：' + id));
    eq(r.正账键.length >= 3, true, 'A4e 老档的账被迁进正账（' + r.正账键.join(',') + '）——下次存档起就是有键的形态');

    // 两本都空 = 新号底色（这一支的老行为不能被改坏）
    const S2 = 装读档世界();
    const r2 = 读档并取账(S2, 造档('新号', { learnedSecrets: [] }));
    eq(r2.收下, true, 'A4f 两本都空的档读得进来');
    eq(S2.计数.starter, 1, 'A4g 两本都空 ⇒ 走 initStarterKnowledge 新号底色');
    eq(r2.正账键.join(','), 'skill_01', 'A4h 新号底色仍只是「听闻」吐纳术（零漂移基准）');
    eq(r2.旧账.length, 0, 'A4i 新号没学会任何门（旧账空）');

    // KnowledgeSystem 缺席的降级路径（这一支老代码没动，钉住别被顺手改坏）
    const S3 = 装读档世界();
    delete S3.KnowledgeSystem;
    const r3 = 读档并取账(S3, 造档('无册', { learnedSecrets: ['skill_01'] }));
    eq(r3.旧账.join(','), 'skill_01', 'A4j KnowledgeSystem 缺席时旧账原样回灌（降级路径零漂移）');
})();

console.log('\n========== B · 止血丹不削血 ==========');

// ---------- B 止血丹 ----------
(function B() {
    const appSrc = 读('js/app.js');
    const battleSrc = 读('js/battle.js');
    const 血丹函数 = 切出(appSrc, /function\s+battleUseMedicalItem\s*\(\s*itemId\s*\)\s*\{/);
    const 量程尺 = 切出(battleSrc, /_procBloodCap\s*\(\s*entity\s*\)\s*\{/);
    const 止血药 = 切出(battleSrc, /function\s+hemostaticTreatment\s*\(\s*entity\s*\)\s*\{/);
    ok(!!血丹函数, 'B0 能从 js/app.js 原文切出 battleUseMedicalItem（真码，不抄第二份）');
    ok(!!量程尺, 'B0b 能从 js/battle.js 原文切出 _procBloodCap（真尺，不抄第二份）');
    ok(!!止血药, 'B0c 能从 js/battle.js 原文切出 hemostaticTreatment');
    if (!血丹函数 || !量程尺 || !止血药) return;
    // 类方法简写（`_procBloodCap(entity) {…}`）不是表达式，包不成函数值——补上 function 头
    const 量程尺Fn = vm.runInNewContext('(function ' + 量程尺.slice(量程尺.indexOf('(')) + ')');
    ok(typeof 量程尺Fn === 'function', 'B0d _procBloodCap 的类方法简写已转成函数值（尺本身逐字来自 battle.js）');

    function 开一场(血量, 量程, appCode) {
        const S = 造读档沙箱();
        vm.createContext(S);
        S.hemostaticTreatment = vm.runInContext('(' + 止血药 + ')', S, { filename: 'hemostatic' });
        S.clearCriticalState = () => { };
        S.bandageWound = () => true;
        S.updateBattleUI = () => { };
        S.refreshBattleMedicalItems = () => { };
        S.updateInventoryUI = () => { };
        const phys = {
            bloodVolume: 血量, health: 血量, maxBloodVolume: 量程,
            circulation: 90, criticalTimer: -1, painLoad: 0,
            wounds: [{ id: 'w1', bleeding: true, externalBleedRate: 4, internalBleedRate: 2, stabilization: 0 }]
        };
        const player = {
            name: '探针', physiology: phys,
            getPhysiologySummary() { return { bloodVolume: phys.bloodVolume, maxBloodVolume: phys.maxBloodVolume }; }
        };
        const item = { templateId: 'pill_hemostatic', count: 1, removed: 0, removeCount(n) { this.removed += n; this.count -= n; } };
        S.currentBattle = {
            player, isPlayerTurn: true, log: [],
            _procBloodCap: 量程尺Fn,
            spendActionCost() { }, _checkEnd() { return false; }, _advanceTimeline() { }
        };
        S.inventory = { slots: [item], maxSlots: 30, currency: { copper: 0, spiritStones: 0 } };
        const 用血丹 = vm.runInContext('(' + (appCode || 血丹函数) + ')', S, { filename: 'battleUseMedicalItem' });
        用血丹('pill_hemostatic');
        return { phys, item, 场: S.currentBattle };
    }

    // B1 ★核心：金仙九层量程 928（battle.js:4618-4621 记的实测数）
    const 金仙 = 开一场(900, 928);
    eq(金仙.phys.bloodVolume, 910, 'B1a ★★金仙级（量程 928）吃止血丹是 +10 回血，不是回落到 100');
    eq(金仙.phys.health, 910, 'B1b health 与 bloodVolume 同步');
    eq(金仙.item.removed, 1, 'B1c 丹照扣一颗（药力生效了，不是没吃药）');

    // B2 满血不该溢出
    const 满 = 开一场(928, 928);
    eq(满.phys.bloodVolume, 928, 'B2a 满血吃止血丹不溢出量程');

    // B3 ★零漂移：凡人量程 100 的场次，行为与改前逐字相同（+10 → 封顶 100）
    const 凡人 = 开一场(90, 100);
    eq(凡人.phys.bloodVolume, 100, 'B3a ★凡人量程（100）行为零漂移：90 + 10 封顶 100，与改前一致');
    const 凡人满 = 开一场(100, 100);
    eq(凡人满.phys.bloodVolume, 100, 'B3b 凡人满血吃止血丹不动（改前也是 100）');

    // B4 血量量程没写在 physiology 上时，尺走既有回退链（getPhysiologySummary → 配置表 → 100）
    const S = 造读档沙箱();
    vm.createContext(S);
    S.hemostaticTreatment = vm.runInContext('(' + 止血药 + ')', S, { filename: 'hemostatic' });
    S.clearCriticalState = () => { };
    S.updateBattleUI = () => { }; S.refreshBattleMedicalItems = () => { }; S.updateInventoryUI = () => { };
    const phys2 = { bloodVolume: 500, health: 500, circulation: 90, criticalTimer: -1, wounds: [{ id: 'w', bleeding: true, externalBleedRate: 2, internalBleedRate: 0 }] };
    S.currentBattle = {
        player: { name: '无尺', physiology: phys2, getPhysiologySummary() { return { maxBloodVolume: 700 }; } },
        isPlayerTurn: true, log: [], spendActionCost() { }, _checkEnd() { return false; }, _advanceTimeline() { },
        _procBloodCap: 量程尺Fn
    };
    const item2 = { templateId: 'pill_hemostatic', count: 1, removed: 0, removeCount(n) { this.removed += n; } };
    S.inventory = { slots: [item2], maxSlots: 30, currency: {} };
    vm.runInContext('(' + 血丹函数 + ')', S, { filename: 'battleUseMedicalItem' })('pill_hemostatic');
    eq(phys2.bloodVolume, 510, 'B4a physiology 上没写量程时，尺走 getPhysiologySummary 的回退链（700）而不是写死 100');

    // B5 反向探针：内存里把上限改回写死 100，B1 必须翻红（工作树一个字节都不碰）
    const 改回 = appSrc.replace('Math.min(_hemCap, (phys.bloodVolume || 0) + 10)', 'Math.min(100, (phys.bloodVolume || 0) + 10)');
    ok(改回 !== appSrc, 'B5a 改前写法（写死 100）能在内存里还原出来');
    const 改回血丹函数 = 切出(改回, /function\s+battleUseMedicalItem\s*\(\s*itemId\s*\)\s*\{/);
    ok(!!改回血丹函数, 'B5a2 改前的 battleUseMedicalItem 能从改后源码里原样切出来（真码，不是手抄）');
    if (改回血丹函数) {
        const 旧 = 开一场(900, 928, 改回血丹函数);
        eq(旧.phys.bloodVolume, 100, 'B5b ★改前复现：金仙级吃止血丹被削到 100（净掉 800 点）');
        const 旧凡人 = 开一场(90, 100, 改回血丹函数);
        eq(旧凡人.phys.bloodVolume, 100, 'B5c 对照：凡人量程下改前改后同值（证明 B1 的差别只来自量程，不是别的）');
    }
    ok(读('js/app.js') === appSrc, 'B5d 真实工作树 byte-exact 未被污染（js/app.js）');
})();

console.log('\n========== C · 不伤他人：五处 combatSkills 百分比 ==========');
(function C() {
    const appSrc = 读('js/app.js');
    const lines = appSrc.split('\n');
    // 这五处是 combatSkills / lifeSkills 的百分比刻度，与「气血量程」不是同族（用户点名不许动）
    const 保护 = [
        [130, 'percentage = Math.max(0, Math.min(100, percentage));'],
        [161, 'const next = Math.max(0, Math.min(100, cur + delta));'],
        [292, 'v = Math.max(0, Math.min(100, v));'],
        [426, 'val = Math.max(0, Math.min(100, val));'],
        [438, 'data.combatSkills[input.dataset.attr] = Math.max(0, Math.min(100, parseInt(input.value, 10) || 0));']
    ];
    保护.forEach(([行号, 原文]) => {
        eq(lines[行号 - 1].trim(), 原文, 'C1 app.js:' + 行号 + ' 逐字未变');
    });
    ok(/data\.combatSkills\[input\.dataset\.attr\] = Math\.max\(0, Math\.min\(100, parseInt\(input\.value, 10\) \|\| 0\)\);/.test(appSrc),
        'C2 combatSkills 的输入刻度仍是 0~100 夹取（本次没借机改任何倍率）');
    // 止血丹那一格自己：代码行里不许再出现写死的 100 上限（注释里点名说明不算账）
    const 块 = 切出(appSrc, /case\s+'pill_hemostatic'\s*:/);
    ok(!!块, 'C3 能切出 pill_hemostatic 那一格');
    if (块) {
        const 代码行 = 块.split('\n').filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l));
        ok(!/Math\.min\(100\b/.test(代码行.join('\n')), 'C4 ★止血丹那一格的代码里已无写死的 100 上限');
        ok(/currentBattle\._procBloodCap\(player\)/.test(块), 'C5 ★止血丹那一格改走同场 Battle 的 _procBloodCap（读真量程）');
        ok(/var _hemCap = \(currentBattle && typeof currentBattle\._procBloodCap === 'function'\)/.test(块), 'C6 尺读不到时回落 100（给无尺场次不引入新行为）');
    }
    // 本次在 app.js 里只动过那一格：全文件**代码行**里写死 100 上限的 `Math.min(100,` / `Math.min(100)`
    // 恰好 29 处（改前 30，止血丹那一处已换成读量程）——本次没顺手改任何别的倍率。
    // 判据用精确正则而不是子串：app.js:8952/:8953 那两处是 Math.min(10000，) 属另一族，不该算进来。
    const 代码MathMin = appSrc.split('\n')
        .filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l) && /Math\.min\(100\s*[,)]/.test(l));
    eq(代码MathMin.length, 29, 'C7 app.js 里代码行的写死 100 上限恰好 29 处（改前 30，止血丹那一处已换成读量程；本次没顺手改别的倍率）');
    const 误算 = appSrc.split('\n')
        .filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l) && /Math\.min\(10000/.test(l));
    eq(误算.length, 2, 'C7b Math.min(10000 那两处（app.js:8952/:8953）没被本判据误算成写死 100（实算 ' + 误算.length + ' 处，是另一族）');
    eq(读('js/battle.js').indexOf('_procBloodCap') > 0, true, 'C8 js/battle.js 未被本次改动触碰（尺仍只有它那一份，没另造）');
})();

console.log('\n========== D · 反向探针：三层防线逐层拆掉都必须翻红 ==========');
(function D() {
    const gsSrc = 读('js/core/game-state.js');

    // 改前那一整段（逐字取自修前的 js/core/game-state.js 知识层，13 行）
    const 改前整段 = [
        '        // 知识层',
        '        if (global.KnowledgeSystem) {',
        '            if (saveData.techniqueKnowledge) {',
        '                global.KnowledgeSystem.importData(saveData.techniqueKnowledge);',
        '            } else if (saveData.learnedSecrets && saveData.learnedSecrets.length) {',
        '                global.KnowledgeSystem.migrateFromLearnedSecrets(saveData.learnedSecrets);',
        '            } else {',
        '                global.KnowledgeSystem.initStarterKnowledge();',
        '            }',
        '            global.learnedSecrets = global.KnowledgeSystem.syncLearnedSecretsList();'
    ].join('\n');
    const 起 = '        // 知识层（功法账';
    const 止 = '        } else if (saveData.learnedSecrets) {';
    const i = gsSrc.indexOf(起), j = gsSrc.indexOf(止, i);
    ok(i > 0 && j > i, 'D0 能定位本批改的那一段');
    if (!(i > 0 && j > i)) return;
    const 旧码 = gsSrc.slice(0, i) + 改前整段 + gsSrc.slice(j);

    // D1 ★整体改前复现：空对象那份档，读档后 learnedSecrets 归零（真机实测 49 → 0 的成因）
    const 档 = 造档('改前复现', { techniqueKnowledge: {}, learnedSecrets: ['skill_05', 'art_fire_sword', 'merged_xyz'] });
    const S = 装读档世界(旧码);
    const r = 读档并取账(S, JSON.parse(JSON.stringify(档)));
    eq(r.旧账.length, 0, 'D1a ★改前复现：techniqueKnowledge:{} 的档读完 learnedSecrets 归零（真机 49 → 0 的同一形状）');
    eq(r.正账键.length, 0, 'D1b 改前复现：正账也被 importData({}) 抹平');
    // 对照组：改后同一份档必须留住
    const S2 = 装读档世界();
    const r2 = 读档并取账(S2, JSON.parse(JSON.stringify(档)));
    ok(r2.旧账.length >= 3, 'D1c 对照：改后同一份档三门全在（' + r2.旧账.join(',') + '）');

    // D2 只拆第一支判据（Object.keys 判据改回裸 truthy）
    // 口径要说清：这一层是**纵深防御**里的一层。裸 truthy 时 importData({}) 照样执行（正账被抹平
    // 那一步真的发生了），账最终是被「旧账并集」那一层救回来的 —— 所以这里量的判据是
    // 「importData 被喂了几个键」，不是最终账面（最终账面见 D1：两层全拆才会归零）。
    const 裸 = gsSrc.replace(
        "var tkHasEntries = !!(tk && typeof tk === 'object' && !Array.isArray(tk) && Object.keys(tk).length > 0);",
        'var tkHasEntries = !!tk;');
    ok(裸 !== gsSrc, 'D2a 「有键且非空」这条判据能在内存里改回裸 truthy');
    if (裸 !== gsSrc) {
        const T = 装读档世界(裸);
        读档并取账(T, JSON.parse(JSON.stringify(档)));
        eq(T.计数.import, 1, 'D2b ★只拆第一支：空对象又走回 importData（importData 被调 ' + T.计数.import + ' 次）');
        eq(T.入参.import.join(','), '0', 'D2c ★只拆第一支：importData 被喂的正账键数 = 0——「整体替换成空」这一步真的又发生了');
        const U = 装读档世界();
        读档并取账(U, JSON.parse(JSON.stringify(档)));
        eq(U.计数.import, 0, 'D2c2 对照：改后同一份档一次 importData 都不调（空对象不再是真值陷阱）');
    }

    // D3 只拆并集（那一格只在旧账里的门就升不进正账）
    const 无并集 = gsSrc.replace('if (missing.length) ks.migrateFromLearnedSecrets(missing);', '/* probe: 并集拆掉 */');
    ok(无并集 !== gsSrc, 'D3a 旧账并集那一步能在内存里拆掉');
    if (无并集 !== gsSrc) {
        const 并档 = 造档('并集档', {
            techniqueKnowledge: { skill_05: { state: 'learned', source: 'manual', completeness: 100 } },
            learnedSecrets: ['skill_05', 'merged_only_here']
        });
        const T = 装读档世界(无并集);
        const t = 读档并取账(T, JSON.parse(JSON.stringify(并档)));
        ok(t.正账键.indexOf('merged_only_here') < 0, 'D3b ★只拆并集：只在旧账里的门升不进正账（正账键=' + t.正账键.join(',') + '）');
        const U = 装读档世界();
        const u = 读档并取账(U, JSON.parse(JSON.stringify(并档)));
        ok(u.正账键.indexOf('merged_only_here') >= 0, 'D3c 对照：并集在时这一门进得了正账');
    }

    // D4 只拆「非空→空禁令」（正账里全是 heard/studying + 旧账有值 ⇒ sync 算出空）
    const heard档 = 造档('heard档', {
        techniqueKnowledge: { skill_01: { state: 'heard', source: 'world', completeness: 0 } },
        learnedSecrets: ['skill_05']
    });
    const 无并集又无禁令 = 无并集
        .replace('if ((!synced || !synced.length) && lsSaved && lsSaved.length) {',
            'if (false) {');
    ok(无并集又无禁令 !== 无并集, 'D4a 「非空→空」禁令能在内存里拆掉');
    if (无并集又无禁令 !== 无并集) {
        const T = 装读档世界(无并集又无禁令);
        const t = 读档并取账(T, JSON.parse(JSON.stringify(heard档)));
        eq(t.旧账.length, 0, 'D4b ★只拆禁令：正账里只有「听闻」时，那句覆盖赋值把旧账抹成 0（sync 算出空 → 覆盖）');
        const U = 装读档世界();
        const u = 读档并取账(U, JSON.parse(JSON.stringify(heard档)));
        eq(u.旧账.join(','), 'skill_05', 'D4c 对照：禁令在时同一份档的旧账原样留着（' + u.旧账.join(',') + '）');
    }
    ok(读('js/core/game-state.js') === gsSrc, 'D5 真实工作树 byte-exact 未被污染（js/core/game-state.js）');
})();

console.log('\n通过：' + 通 + '　失败：' + 红.length);
if (红.length) { console.log('红：\n  - ' + 红.join('\n  - ')); }
process.exitCode = 红.length ? 1 : 0;