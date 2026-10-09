'use strict';
/**
 * legacy-save-and-realm-node.js —— 两条「会伤到玩家本体」的真 BUG 的断言门禁
 *
 * A 段·读档不许抹掉玩家存档（xianxia_save）
 *   病灶：applyFullGameState 开头 clearCharacterStorage()（先清后灌），而 xianxia_save 就在
 *   CHARACTER_STORAGE_KEYS 里——它是被读的那份档的**本体**，不是角色的附属账。末尾那句
 *   writeKey('xianxia_save', saveData) 只是「没抛错时」的补救；中段十几处回灌没有 try 包裹，
 *   任何一处抛错就当场自毁。实测抛错点真实存在：档里存着已下架的物品模板时，
 *   `new ItemInstance(...)` 直接抛（js/core/game-state.js 的背包回灌段）。
 *   修法：clearCharacterStorage 加 protectKeys 口，读档这条路把 xianxia_save 挂进去。
 *   A6 是「改前复现」：内存里把那处 protectKeys 摘掉再跑一遍，判据必须从「键在」翻成「键没了」。
 *
 * B 段·飞升/金仙的战斗加成不许归零
 *   病灶：境界名单有三套口径，真源 window.REALM_ORDER（js/global-utils.js）十二境，
 *   而 js/combat-stats.js 曾自抄两份都断在渡劫 ⇒ 飞升/金仙 玩家攻防速韧整项吃不到境界加成
 *   （实测与「凡人」逐字相同：渡劫一层 atk43/def31，飞升一层 atk10/def6）。
 *   修法：两处同读 window.REALM_ORDER，序号基准减掉「凡人」那一档以保前十档零漂移。
 *   B6 是「改前复现」：内存里把读尺改回自抄九档表，判据必须翻成「加成归零」。
 *
 * 运行：node tests/legacy-save-and-realm-node.js
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

let 通 = 0; const 红 = [];
function ok(c, m) { if (c) { 通++; console.log('  ✓ ' + m); } else { 红.push(m); console.log('  [FAIL] ' + m); } }
function eq(a, b, m) { ok(a === b, m + '（实际=' + JSON.stringify(a) + ' 期望=' + JSON.stringify(b) + '）'); }
function 读(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8').replace(/\r\n/g, '\n'); }
function 跑(沙, rel, 码) { vm.runInContext(码 !== undefined ? 码 : 读(rel), 沙, { filename: rel }); }

// ==================== 沙箱工厂 ====================
function 造存档沙箱() {
    const store = Object.create(null);
    const 告警 = [];
    const S = {
        console: { log() { }, warn() { 告警.push([].slice.call(arguments).join(' ')); }, error() { } },
        JSON, Object, Array, String, Number, Boolean, Math, isFinite, Date, RegExp, parseInt, parseFloat,
        setTimeout(fn) { try { fn(); } catch (e) { 告警.push('setTimeout 回调抛错：' + (e && e.message)); } return 0; },
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
    S.盘 = k => S.localStorage.getItem(k);
    return S;
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

// 一份够读档的档（不依赖任何真模块）
function 造档(名, 覆写) {
    const d = {
        charName: 名, gender: 'male', realm: '炼气', layer: 1, version: '3.0', timestamp: 1700000000000,
        mainAttributes: { 悟性: 12 }, combatSkills: {},
        inventory: { slots: [], maxSlots: 30, currency: { copper: 583, spiritStones: 10 } },
        reputation: { '金城': { value: 42 } }, landmarks: { '剑冢': true }, dailyEvents: { 'd1': ['兽潮'] }
    };
    return Object.assign(d, 覆写 || {});
}

// ==================== A 段：读档不许自毁 ====================
console.log('\n========== A · 读档不许抹掉玩家存档 ==========');
(function A段() {
    const S = 造存档沙箱();
    vm.createContext(S);
    跑(S, 'js/core/game-state.js');
    ok(!!S.GameState, 'A0 GameState 已导出');

    // A1 protectKeys 这个口本身：不传就照旧全清，传了就只跳过点名的那几个
    S.localStorage.setItem('xianxia_save', 'SAVE');
    S.localStorage.setItem('xianxia_inventory', 'INV');
    S.GameState.clearCharacterStorage({ alsoAccount: false, protectKeys: ['xianxia_save'] });
    eq(S.盘('xianxia_save'), 'SAVE', 'A1a 保护键在 clearCharacterStorage 里没被删');
    eq(S.盘('xianxia_inventory'), null, 'A1b 其余角色级键照旧清掉（保护键不是「全不清」）');
    S.localStorage.setItem('xianxia_save', 'SAVE');
    S.GameState.clearCharacterStorage({ alsoAccount: false });
    eq(S.盘('xianxia_save'), null, 'A1c 不传 protectKeys 时 xianxia_save 照旧被清（新开局/删档那条路不受影响）');

    // A2 读档这条路真的把 xianxia_save 挂进了保护名单（源码形状钉住）
    const gsSrc = 读('js/core/game-state.js');
    ok(/clearCharacterStorage\(\{\s*alsoAccount:\s*false,\s*protectKeys:\s*\['xianxia_save'\]\s*\}\)/.test(gsSrc),
        'A2 applyFullGameState 的清理调用带着 protectKeys:[\'xianxia_save\']');

    // A3 正常读档：造档 → 应用 → 该档还在盘上，且内容就是刚应用的那一份
    S.localStorage.clear();
    const 档 = 造档('甲号');
    S.localStorage.setItem('xianxia_save', JSON.stringify(档));
    eq(S.GameState.applyFullGameState(档), true, 'A3a applyFullGameState 收下这一份');
    const 盘上 = S.盘('xianxia_save');
    ok(!!盘上, 'A3b 读档后 xianxia_save 仍在（读档不许删掉它所读的那一份）');
    eq(JSON.parse(盘上).charName, '甲号', 'A3c 盘上这份就是刚应用的档');

    // A4 ★核心：读档途中抛错（档里存着已下架的物品模板 → new ItemInstance 直接抛）
    S.localStorage.clear();
    const 坏档 = 造档('乙号', {
        inventory: { slots: [{ templateId: '已下架的模板', count: 1, uid: 'u1' }], maxSlots: 30, currency: { copper: 1, spiritStones: 0 } }
    });
    S.localStorage.setItem('xianxia_save', JSON.stringify(坏档));
    S.inventory = { maxSlots: 30, slots: [], currency: { copper: 0, spiritStones: 0 } };
    S.ItemInstance = function ItemInstance(模板) {
        if (模板 === '已下架的模板') throw new Error('未知物品模板：' + 模板);   // 生产码同款抛点
        this.templateId = 模板; this.count = 1; this.uid = 'u'; this.customProps = {};
    };
    let 抛 = null;
    try { S.GameState.applyFullGameState(坏档); } catch (e) { 抛 = (e && e.message) || String(e); }
    ok(!!抛, 'A4a 控制组：这一档确实会在读档途中抛错（抛=' + JSON.stringify(抛) + '）');
    ok(!!S.盘('xianxia_save'), 'A4b ★读档抛错之后 xianxia_save 仍在盘上——玩家刷新后仍能续档');
    const 留下 = S.盘('xianxia_save');
    // 判据写成不崩的形状：改前这一格是 null，直接 JSON.parse 会把整套件带崩，
    // 崩掉的话后面 B 段根本没机会跑（改前复现就只看到两条红，等于少验一半）。
    eq(留下 ? (JSON.parse(留下).charName || '') : '', 留下 ? '乙号' : '', 'A4c 留下的是一份完整可读的档，不是空壳');

    // A5 这次改动没把别的白名单键带坏
    const 键表 = S.GameState.CHARACTER_STORAGE_KEYS;
    eq(键表.length, 37, 'A5a 白名单仍是 37 项（本次一个键都没删：xianxia_save 仍在表内，只是读档那一步不再删它）');
    ['xianxia_save', 'xianxia_merged_skills', 'xianxia_asm_ledger', 'xianxia_collective_ledger',
        'xianxia_rival_chain_cd', 'xianxia_inventory', 'borrowRecords'].forEach(k => {
            ok(键表.indexOf(k) >= 0, 'A5a 白名单仍含 ' + k);
        });
    const 旁账 = S.GameState.SIDE_LEDGER_KEYS;
    // ⚠️ 这条断言原本写死 `eq(旁账.length, 4, …)`。后续批次往单上补了 5 本**乙类**键
    // （有 StateRegistry 模块、collect 也收，但那个模块的 import 只改内存、**不回写 localStorage**
    //   的那族：xianxia_sect_diplomacy / xianxia_tracked_quests / xianxia_storyline_choices /
    //   xianxia_mail_system / xianxia_quick_moves），字面的 4 已经不成立。
    // **原意是「上批那四本一本没少」**（防上一批把谁的键弄丢），不是「这张单永远不许长大」——
    // 所以改成钉住那四个名字 + 断言只增不减，字面 4 的那层保护一点没丢。
    ok(旁账.length >= 4, 'A5b 旁账往返名单没缩水（现读 ' + 旁账.length + ' 本；至少要有上批那四本）');
    ['xianxia_merged_skills', 'xianxia_asm_ledger', 'xianxia_collective_ledger', 'xianxia_rival_chain_cd']
        .forEach(k => ok(旁账.indexOf(k) >= 0, 'A5b 旁账含 ' + k));

    // A5c 旁账原文往返：collect 收 → apply 灌回来（这一族是「读一次抹一次」的高危区）
    S.localStorage.clear();
    S.ItemInstance = function (t) { this.templateId = t; this.count = 1; this.uid = 'u'; this.customProps = {}; };
    S.inventory = { maxSlots: 30, slots: [], currency: { copper: 0, spiritStones: 0 } };
    S.localStorage.setItem('xianxia_merged_skills', JSON.stringify({ merged_x: { id: 'merged_x', name: '自创功法' } }));
    S.localStorage.setItem('xianxia_asm_ledger', JSON.stringify({ '1|2': { day: 3 } }));
    const 槽 = S.GameState.collectFullGameState({ charData: { name: '丙号' } });
    ok(槽.sideLedgers && !!槽.sideLedgers.xianxia_merged_skills, 'A5c1 collect 把旁账原文收进槽里');
    eq(S.GameState.applyFullGameState(槽), true, 'A5c2 apply 收下这一槽');
    eq(S.盘('xianxia_merged_skills'), JSON.stringify({ merged_x: { id: 'merged_x', name: '自创功法' } }), 'A5c3 融合功法注册表原文往返（没被套第二层 JSON）');
    eq(S.盘('xianxia_asm_ledger'), JSON.stringify({ '1|2': { day: 3 } }), 'A5c4 嫉妒余波账原文往返');

    // A5d 兼容键回写没坏（拿一份带声望/地标/每日事件的档走一遍）
    S.localStorage.clear();
    S.GameState.applyFullGameState(造档('庚号', { reputation: { '金城': { value: 42 } }, landmarks: { '剑冢': true }, dailyEvents: { 'd1': ['兽潮'] } }));
    eq(S.盘('xianxia_reputation'), JSON.stringify({ '金城': { value: 42 } }), 'A5d1 声望兼容键回写照旧');
    eq(S.盘('xianxia_landmarks'), JSON.stringify({ '剑冢': true }), 'A5d1b 地标兼容键回写照旧');
    ok(!!S.盘('xianxia_inventory'), 'A5d2 背包兼容键回写照旧');

    // A5e 新开局仍要清掉上一局的快照（保护键只作用于「读档」这一条路）
    S.localStorage.clear();
    S.localStorage.setItem('xianxia_save', JSON.stringify(造档('丁号')));
    S.localStorage.setItem('xianxia_inventory', 'INV');
    S.GameState.resetWorldForNewGame();
    eq(S.盘('xianxia_save'), null, 'A5e1 新开局清掉上一局的续档快照（新角色不继承上一局）');
    eq(S.盘('xianxia_inventory'), null, 'A5e2 新开局清掉上一局的角色级键');

    // A5f 删档路径（app.js 的用法：不传 protectKeys）仍连 xianxia_save 一起清
    S.localStorage.clear();
    S.localStorage.setItem('xianxia_save', 'SAVE');
    S.localStorage.setItem('xianxia_settings', '{"a":1}');
    S.GameState.clearCharacterStorage({ alsoAccount: true });
    eq(S.盘('xianxia_save'), null, 'A5f1 删档：xianxia_save 被清');
    eq(S.盘('xianxia_settings'), null, 'A5f2 删档（含账号级）：设置键也被清');

    // A6 改前复现：把 protectKeys 摘掉（**只在内存里改字符串**，工作树一个字节都不碰）
    const 旧码 = gsSrc.replace(
        "clearCharacterStorage({ alsoAccount: false, protectKeys: ['xianxia_save'] });",
        'clearCharacterStorage({ alsoAccount: false });');
    ok(旧码 !== gsSrc, 'A6a 改前写法能在内存里还原出来（protectKeys 那行被摘掉）');
    if (旧码 !== gsSrc) {
        const T = 造存档沙箱();
        vm.createContext(T);
        跑(T, 'js/core/game-state.js', 旧码);
        T.localStorage.setItem('xianxia_save', JSON.stringify(坏档));
        T.inventory = { maxSlots: 30, slots: [], currency: { copper: 0, spiritStones: 0 } };
        T.ItemInstance = function (t) {
            if (t === '已下架的模板') throw new Error('未知物品模板：' + t);
            this.templateId = t; this.count = 1; this.uid = 'u'; this.customProps = {};
        };
        try { T.GameState.applyFullGameState(坏档); } catch (e) { /* 改前这一路就是会抛：故意 */ }
        eq(T.盘('xianxia_save'), null, 'A6b ★改前复现：没有 protectKeys 时，读档抛错就把玩家的档抹成「键不存在」');
        // 对照组：旧写法在「读档不抛错」那条路上本来是过的（末尾那句回填）——
        // 所以本套 A4b 钉的不是「读档一定毁档」，而是「读档一旦抛错就毁档」，差别正落在这一条上。
        const 好档 = 造档('戊号');
        T.localStorage.clear();
        T.localStorage.setItem('xianxia_save', JSON.stringify(好档));
        eq(T.GameState.applyFullGameState(好档), true, 'A6c 对照：旧写法在读档不抛错时也过得去（末尾回填兜住了）');
        ok(!!T.盘('xianxia_save'), 'A6c 对照：旧写法不抛错时键也在（说明毁档只发生在抛错那条路）');
    }
    ok(读('js/core/game-state.js') === gsSrc, 'A6d 真实工作树 byte-exact 未被污染');
})();

// ==================== B 段：飞升/金仙不许归零 ====================
console.log('\n========== B · 飞升/金仙的战斗加成 ==========');
function 造境界沙箱(码覆盖) {
    const S = 造存档沙箱();
    vm.createContext(S);
    // 装**真尺**：从 js/global-utils.js 原文切出来执行（不手抄第二张序）
    const gu = 读('js/global-utils.js');
    const 序 = gu.match(/var REALM_ORDER = \[[^\]]*\];/);
    const 查 = gu.match(/window\.realmIndex = function \(realm\) \{[\s\S]*?\n {4}\};/);
    if (!序 || !查) { ok(false, 'B0 真尺能从 js/global-utils.js 原文里切出来'); return null; }
    跑(S, 'js/global-utils.js', '(function(){' + 序[0] + 'window.REALM_ORDER = REALM_ORDER;' + 查[0] + '})()');
    // js/sects/sect-join-flow.js 的 getRealmTier 契约（认不出回落 1）
    S.getRealmTier = r => (r == null || r === '') ? 0 : (S.realmIndex(r) >= 0 ? S.realmIndex(r) : 1);
    跑(S, 'js/combat-stats.js', 码覆盖 && 码覆盖.combat);
    跑(S, 'js/data.js');
    return S;
}
(function B段() {
    const S = 造境界沙箱();
    if (!S) return;
    const 六维 = { strength: 10, dexterity: 10, intelligence: 10, willpower: 10, constitution: 10, meridian: 10 };
    function 面板(境界, 层) {
        S.getCurrentCharData = () => ({ realm: 境界, layer: 层, attrs: Object.assign({}, 六维), combatSkills: {}, name: '探针' });
        return S.getDerivedCombatStats(null);
    }

    // B1 三套口径一致
    const 序 = S.REALM_ORDER;
    eq(序.length, 12, 'B1a 真源十二境');
    eq(序.join('|'), '凡人|炼气|筑基|金丹|元婴|化神|炼虚|合体|大乘|渡劫|飞升|金仙', 'B1b 真源名单逐名（末两档是飞升/金仙）');
    eq(S.realmLevels.map(r => r.realm).join('|'), 序.filter(n => n !== '凡人').join('|'),
        'B1c data.js realmLevels 的名单＝真源去掉「凡人」那一档（含飞升/金仙）');
    const 阶 = S.REALM_CONFIG.realms.map(r => r.name);
    eq(阶.join('|'), '炼气|筑基|金丹|元婴|化神|炼虚|合体|大乘|渡劫', 'B1d data.js REALM_CONFIG.realms＝真源的「炼气…渡劫」段，逐名同序');
    ok(阶.indexOf('飞升') < 0 && 阶.indexOf('金仙') < 0,
        'B1e ★REALM_CONFIG 故意不含飞升/金仙：突破门（breakthrough-system.js:174-185 拦 realmIndex<0）靠的就是这一格，补两行等于给飞升者开后门');
    ok(S.realmLevels.every(r => r.baseQi > 0), 'B1f realmLevels 逐档都有真气底（飞升/金仙也定了值）');

    // B1g combat-stats 不再自抄境界序
    const cs = 读('js/combat-stats.js');
    eq((cs.match(/\[\s*'(?:凡人|炼气)'/g) || []).length, 0, 'B1g combat-stats.js 里自抄境界序数组 0 处（两份都借尺了）');
    ok(/window\.realmIndex/.test(cs), 'B1h combat-stats.js 确实在读 window.realmIndex');

    // B2 ★顶两档真的高于渡劫（固定六维 strength=10 的实测读数）
    const 渡1 = 面板('渡劫', 1), 飞1 = 面板('飞升', 1), 金1 = 面板('金仙', 1);
    const 渡9 = 面板('渡劫', 9), 飞9 = 面板('飞升', 9), 金9 = 面板('金仙', 9);
    const 四元 = s => [s.attack, s.defense, s.speed, s.toughness].join('/');
    eq(四元(渡1), '43/31/23/19', 'B2a 渡劫一层 43/31/23/19（改前读数，零漂移基准）');
    eq(四元(飞1), '47/34/25/21', 'B2b 飞升一层 47/34/25/21（不再是 10/6/7/3）');
    eq(四元(金1), '51/37/27/23', 'B2c 金仙一层 51/37/27/23');
    ok(飞1.attack > 渡1.attack && 飞1.defense > 渡1.defense, 'B2d ★飞升一层攻防高于渡劫一层');
    ok(金1.attack > 飞1.attack && 金1.defense > 飞1.defense, 'B2e ★金仙一层攻防高于飞升一层');
    ok(飞9.attack > 飞1.attack && 金9.attack > 飞1.attack, 'B2f 同境升层、跨境全程单调（飞升九层 55、金仙九层 59）');
    ok(面板('凡人', 1).attack === 10, 'B2g 凡人仍不吃境界加成（序号基准只减了「凡人」那一档，没有把凡人也算进去）');
    ok(面板('没这境界', 1).attack === 10, 'B2h 认不出的境界名不吃加成（不默默当成炼气）');
    // 前十档逐格零漂移：每进一境固定 +4攻/+3防/+2速/+2韧
    let 漂 = [];
    ['炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'].forEach((名, i) => {
        [1, 5, 9].forEach(层 => {
            const s = 面板(名, 层);
            if (s.attack !== 10 + i * 4 + 层 || s.defense !== 6 + i * 3 + Math.ceil(层 / 2) ||
                s.speed !== 7 + i * 2 + Math.floor(层 / 3) || s.toughness !== 3 + i * 2) {
                漂.push(名 + 层 + '层');
            }
        });
    });
    eq(漂.join(','), '', 'B2i ★炼气..渡劫 十档 × 层 1/5/9 共 27 个读数零漂移（旧公式逐格对上）');

    // B3 敌人等级刻度对顶两档给合理等级
    const L = (名, 层) => S.realmScaledEnemyLevel({ realm: 名, layer: 层 });
    eq(L('飞升', 1), 64, 'B3a 飞升一层→64 级怪（≈渡劫九层 65）');
    eq(L('飞升', 9), 72, 'B3b 飞升九层→72');
    eq(L('金仙', 1), 71, 'B3c 金仙一层→71');
    eq(L('金仙', 9), 79, 'B3d 金仙九层→79');
    ok(L('飞升', 9) > L('渡劫', 9) && L('飞升', 9) > L('凡人', 9) * 5, 'B3e ★飞升的敌人不再与凡人同档');
    let 单调 = true;
    // 从「炼气」起逐境比：凡人与炼气同落 1 档（tier<1 归一，设计如此，见 B3g）
    for (let i = 2; i < 序.length; i++) { if (L(序[i], 9) <= L(序[i - 1], 9)) 单调 = false; }
    ok(单调, 'B3f 炼气→金仙 逐境九层的敌人等级单调不减');
    eq(L('炼气', 1), 1, 'B3g 炼气一层仍是 1（新手节奏不动）');
    eq(L('渡劫', 9), 65, 'B3h 渡劫九层仍是 65（旧刻度一格未动）');

    // B4 战斗加成只作用于玩家
    const 敌前 = S.getDerivedCombatStats({ type: 'npc', attrs: Object.assign({}, 六维), skills: {}, toughness: null });
    S.getCurrentCharData = () => ({ realm: '金仙', layer: 9, attrs: Object.assign({}, 六维), combatSkills: {}, name: '探针' });
    const 敌后 = S.getDerivedCombatStats({ type: 'npc', attrs: Object.assign({}, 六维), skills: {}, toughness: null });
    eq(敌后.attack, 敌前.attack, 'B4 NPC 不吃玩家境界加成（这条不能被改坏）');

    // B5 改前复现：内存里把读尺改回自抄九档表（**工作树一个字节都不碰**）
    const 新码 = 读('js/combat-stats.js');
    const 旧码 = 新码
        .replace("if (typeof window.realmIndex === 'function') i = Number(window.realmIndex(realm));",
            "if (true) i = ['炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'].indexOf(String(realm));")
        .replace('var t = Number(window.realmIndex(realm));',
            "var t = ['凡人', '炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'].indexOf(String(realm));");
    ok(旧码 !== 新码, 'B5a 改前写法能在内存里还原出来（两份自抄表都回来了）');
    if (旧码 !== 新码) {
        const T = 造境界沙箱({ combat: 旧码 });
        if (T) {
            T.getCurrentCharData = () => ({ realm: '飞升', layer: 1, attrs: Object.assign({}, 六维), combatSkills: {}, name: '探针' });
            const 旧飞 = T.getDerivedCombatStats(null);
            eq([旧飞.attack, 旧飞.defense].join('/'), '10/6', 'B5b ★改前复现：飞升一层的境界加成整项归零（10/6，与凡人同档）');
            eq(T.realmScaledEnemyLevel({ realm: '飞升', layer: 9 }), 9, 'B5c ★改前复现：飞升九层的敌人等级＝9（与凡人同档）');
            ok(T.realmScaledEnemyLevel({ realm: '飞升', layer: 9 }) !== S.realmScaledEnemyLevel({ realm: '飞升', layer: 9 }),
                'B5d 两条判据确实只被这次改动撬动（改后是 72）');
        }
        ok(读('js/combat-stats.js') === 新码, 'B5e 真实工作树 byte-exact 未被污染');
    }
})();

console.log('\n通过：' + 通 + '　失败：' + 红.length);
if (红.length) { console.log('红：\n  - ' + 红.join('\n  - ')); }
process.exitCode = 红.length ? 1 : 0;