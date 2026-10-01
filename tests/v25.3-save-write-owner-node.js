/**
 * v25.3 存档写失败可见批（第一百四十五批）——把「18 个存档键写失败玩家听不到」的账彻底关死。
 *
 * 背景（FIX_NOTES 第一百四十三批 ①）：v20.87 只修了主档/自动档两个样本；第一百四十四批立了
 * 单一 owner window.saveToStorage（js/global-utils.js：自己吞异常、返回布尔、去重弹窗一次），
 * 并把主档/槽位表/背包等接了进去——但全仓仍剩 30 处写点没跟上：
 *   · 5 处**裸 setItem**（travel/location/party/event/ngplus）：配额一满直接抛给调用方，
 *     调用方遍布旅行、进解锁、转世链——玩家看到的是莫名其妙卡半截，且一句提示没有；
 *   · 9 处 console.warn『静默失败』：话说给了控制台，玩家永远听不到；
 *   · 16 处静默空 catch / 设置键：丢了就丢了。
 * 本批全部接进单一 owner；node 夹具没有 owner，每处保留 else 原样 setItem 回退分支
 * （既有用例行为零变化——v20.87 E 段 toggleAutoSave 真跑照常绿即为证）。
 *
 * 本套钉三件事：
 *   A 全仓扫描：js/ 里不许再有绕开 owner 的 localStorage.setItem（白名单只有 owner 本体
 *     与 auto-save._saveSlots——后者 v20.87 自带玩家可见告警，是立过案的旧账不是漏网）；
 *   B 键名登记表：每个存档键都在它该在的文件里接上了 owner（防「扫描尺被注释糊弄」）；
 *   C owner 真跑：成功写、失败返回假 + 弹一次玩家话术、去重不刷屏、_resetStorageWarn 可复位；
 *   D NG+ 回执诚实：写失败不再弹「前尘记忆已凝成玉」的成功谎话；
 *   E 反向探针：把一处改回裸写，扫描尺必须当场报出来（证明 A 是量出来的不是摆设）；
 *   F 夹具回退真跑：无 owner 的世界里 toggleAutoSave 照旧落盘（既有 40+ 套野图/队伍用例的命根）。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
let passed = 0, failed = 0;
function ok(cond, label) {
    if (cond) passed++;
    else { failed++; console.log('[FAIL] ' + label); }
}
function load(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

function walk(dir, out) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, ent.name);
        if (ent.isDirectory()) walk(p, out);
        else if (ent.name.endsWith('.js')) out.push(p);
    }
    return out;
}
const files = walk(path.join(ROOT, 'js'), []);

// ============ A 全仓扫描：裸写点清零 ============
console.log('\n========== v25.3 存档写失败可见批 ==========');
console.log('\n[A] 全仓 localStorage.setItem 扫描（绕开单一 owner 即违例）');

const WHITELIST_FILES = new Set([
    'js/global-utils.js',   // owner 本体（window.saveToStorage 自己那一次 setItem）
    'js/core/auto-save.js'  // _saveSlots：v20.87 旧账，自带玩家可见去重告警（立案在 FIX_NOTES 第一百四十三批「主档与自动档早已修过」）
]);

function scan(srcText, rel) {
    const lines = srcText.split('\n');
    const bad = [];
    lines.forEach((l, i) => {
        if (!/localStorage\.setItem/.test(l)) return;
        const t = l.trim();
        if (t.startsWith('//') || t.startsWith('*')) return;   // 整行注释不算账
        if (WHITELIST_FILES.has(rel)) return;
        // 守卫判据：本行或上下各一行里出现 saveToStorage（迁移惯用式把守卫写在同一行；
        // app.js NG+ 的回退分支守卫在上一行的三元里）
        const win = [lines[i - 1] || '', l, lines[i + 1] || ''].join('\n');
        if (!/saveToStorage/.test(win)) bad.push(rel + ':' + (i + 1) + ' ' + t.slice(0, 80));
    });
    return bad;
}

let violations = [];
let guardedSites = 0;
for (const f of files) {
    const rel = path.relative(ROOT, f).replace(/\\/g, '/');
    const src = load(rel);
    violations = violations.concat(scan(src, rel));
    if (!WHITELIST_FILES.has(rel)) {
        src.split('\n').forEach(l => {
            if (/localStorage\.setItem/.test(l) && !l.trim().startsWith('//') && /saveToStorage/.test(l)) guardedSites++;
        });
    }
}
ok(violations.length === 0, 'A1 js/ 全仓零裸写点（违例 ' + violations.length + ' 处' + (violations.length ? '：\n      ' + violations.join('\n      ') : '') + '）');
ok(guardedSites >= 25, 'A2 带 owner 守卫的写点现读 ' + guardedSites + ' 处（门槛 ≥25，本批迁入 30 处 + 前批存量；暴跌=尺坏了或被人批量回退）');

// ============ B 键名登记表：每个键都在对应文件里接上了 owner ============
console.log('\n[B] 键名登记表（防扫描尺被糊弄：逐键点名）');
const REGISTRY = [
    ['js/travel-system.js', "saveToStorage('xianxia_travel_data'"],
    ['js/location-system.js', "saveToStorage('xianxia_location_data'"],
    ['js/party-system.js', "saveToStorage('xianxia_party_data'"],
    ['js/event-system.js', "saveToStorage('xianxia_event_flags'"],
    ['js/reputation-system.js', "saveToStorage('xianxia_reputation'"],
    ['js/mail-system.js', "saveToStorage('xianxia_mail_system'"],
    ['js/house-system.js', "saveToStorage('xianxia_house'"],
    ['js/world-events.js', "saveToStorage('xianxia_world_events'"],
    ['js/world-events.js', "saveToStorage('xianxia_city_temp'"],
    ['js/enhancement.js', "saveToStorage('xianxia_enhancement_pity'"],
    ['js/lifespan-system.js', "saveToStorage('xianxia_lifespan'"],
    ['js/npcs/npc-personal-events.js', "saveToStorage('xianxia_personal_event_flags'"],
    ['js/core/game-state.js', "saveToStorage('xianxia_personal_event_flags'"],
    ['js/sects/sect-visit.js', "saveToStorage('xianxia_sect_diplomacy'"],
    ['js/sects/sect-crisis-events.js', "saveToStorage('xianxia_sect_diplomacy'"],
    ['js/app.js', "saveToStorage('xianxia_ngplus'"],
    ['js/app.js', "saveToStorage('xianxia_settings'"],
    ['js/core/keyboard-shortcuts.js', "saveToStorage('xianxia_settings'"],
    // 变量键名的点位：只点名 owner 已接进该文件
    ['js/npcs/rivalry-chain.js', 'saveToStorage(CD_KEY'],
    ['js/npcs/jealousy-assembly.js', 'saveToStorage(LEDGER_KEY'],
    ['js/npcs/jealousy-collective.js', 'saveToStorage(CL_KEY'],
    ['js/npcs/storylines-v2/batch1.js', 'saveToStorage(LS_KEY'],
    ['js/npcs/storylines-v2/batch2.js', 'saveToStorage(LS_KEY'],
    ['js/npcs/storylines-v2/batch3.js', 'saveToStorage(LS_KEY'],
    ['js/map/randomMap.js', 'saveToStorage(MAP_SEED_KEY'],
    ['js/core/auto-save.js', 'saveToStorage(OFF_KEY'],
    ['js/core/difficulty-config.js', 'saveToStorage(LS_KEY'],
    ['js/map/world-map.js', 'saveToStorage(OVERLAY_KEY'],
    ['js/core/game-state.js', 'saveToStorage(key']
];
let regMiss = [];
for (const [f, needle] of REGISTRY) {
    if (load(f).indexOf(needle) < 0) regMiss.push(f + ' 缺 ' + needle);
}
ok(regMiss.length === 0, 'B1 登记表 ' + REGISTRY.length + ' 条全中（缺 ' + regMiss.length + (regMiss.length ? '：' + regMiss.join('；') : '') + '）');

// house-system 有两个写点（导入口 + 常规口），两处都得接
{
    const hs = load('js/house-system.js');
    const n = (hs.match(/saveToStorage\('xianxia_house'/g) || []).length;
    ok(n === 2, 'B2 js/house-system.js 两个 xianxia_house 写点都接了 owner（现读 ' + n + '，期望 2）');
}

// ============ C owner 真跑 ============
console.log('\n[C] 单一 owner 真跑（成功写 / 失败可见 / 去重 / 复位）');
{
    // 从 global-utils.js 里切出 owner 那个 IIFE 单独跑（整个文件要的重桩太多，owner 本身零依赖）
    const gu = load('js/global-utils.js');
    const start = gu.indexOf('var _盘满已警');
    ok(start > 0, 'C0 global-utils.js 里找得到 owner（_盘满已警）');
    const iife = gu.lastIndexOf('(function () {', start);
    const end = gu.indexOf('\n})();', start);
    const ownerSrc = gu.slice(iife, end + '\n})();'.length);

    let failNext = false;
    const store = {};
    const toasts = [];
    const errs = [];
    const W = {
        console: { log: () => {}, warn: () => {}, error: (m) => errs.push(String(m)) },
        showMessage: (t) => toasts.push(String(t)),
        localStorage: {
            getItem: (k) => (k in store ? store[k] : null),
            setItem: (k, v) => {
                if (failNext) { const e = new Error('QuotaExceededError'); throw e; }
                store[k] = String(v);
            }
        }
    };
    W.window = W;
    vm.createContext(W);
    vm.runInContext(ownerSrc, W, { filename: 'owner-slice' });

    ok(typeof W.saveToStorage === 'function', 'C1 owner 挂上 window.saveToStorage');
    ok(W.saveToStorage('k1', 'v1') === true && store.k1 === 'v1', 'C2 成功路径：返回真且真写了');
    failNext = true;
    ok(W.saveToStorage('k2', 'v2') === false, 'C3 失败路径：返回假、不上抛（调用方函数不再被炸断）');
    ok(toasts.length === 1 && /存储空间可能已满/.test(toasts[0]) && /没有存上/.test(toasts[0]), 'C4 失败玩家听得到：弹一次「存盘失败…没有存上」（实测 ' + toasts.length + ' 条）');
    ok(errs.length === 1 && /k2/.test(errs[0]), 'C5 控制台留有含键名的错误账');
    W.saveToStorage('k3', 'v3'); W.saveToStorage('k4', 'v4');
    ok(toasts.length === 1, 'C6 配额满连炸多处只弹一次（去重不刷屏；实测 ' + toasts.length + ' 条）');
    W._resetStorageWarn();
    W.saveToStorage('k5', 'v5');
    ok(toasts.length === 2, 'C7 _resetStorageWarn 后能再弹（测试/复位口子是活的）');
}

// ============ D NG+ 回执诚实 ============
console.log('\n[D] 转世（NG+）回执按真结果说话');
{
    const appSrc = load('js/app.js');
    ok(/_ngOk = window\.saveToStorage \? window\.saveToStorage\('xianxia_ngplus'/.test(appSrc), 'D1 NG+ 写盘走 owner 且读返回值');
    ok(/if \(_ngOk\) showMessage\('🌟 前尘记忆已凝成玉/.test(appSrc), 'D2 「凝成玉」成功回执只在真写成了才弹');
    ok(/else showMessage\('⚠️ 前尘记忆没能刻进玉里/.test(appSrc), 'D3 写失败有如实的失败回执（含后果与出路）');
    ok(appSrc.indexOf("localStorage.setItem('xianxia_ngplus', JSON.stringify(saveData));\n    showMessage('🌟") < 0, 'D4 旧式「裸写完必弹成功」已不在');
}

// ============ E 反向探针：扫描尺必须报得出回退 ============
console.log('\n[E] 反向探针（把一处改回裸写，A 尺必须当场红）');
{
    const rel = 'js/party-system.js';
    const real = load(rel);
    const lines = real.split('\n');
    const li = lines.findIndex(l => l.indexOf("saveToStorage('xianxia_party_data'") >= 0 && l.indexOf('else localStorage.setItem') >= 0);
    ok(li >= 0, 'E0 找到 party-system 的守卫行（单行惯用式）');
    const mutatedLines = lines.slice();
    mutatedLines[li] = "    localStorage.setItem('xianxia_party_data', JSON.stringify(partyData));";
    const mutated = mutatedLines.join('\n');
    ok(scan(mutated, rel).length === 1, 'E1 探针：把守卫行改回裸写后 A 尺恰好报 1 处（实测 ' + scan(mutated, rel).length + '）');
    ok(load(rel) === real, 'E2 真实工作树 byte-exact 未被污染（' + rel + '）');
}

// ============ F 夹具回退真跑：无 owner 的世界照旧落盘 ============
console.log('\n[F] 夹具回退分支真跑（既有 node 用例的命根）');
{
    const autoSrc = load('js/core/auto-save.js');
    const store = {};
    let newDayCb = null;
    const W = {
        console: { log: () => {}, warn: () => {}, error: () => {} },
        localStorage: {
            getItem: (k) => (k in store ? store[k] : null),
            setItem: (k, v) => { store[k] = String(v); },
            removeItem: (k) => { delete store[k]; }
        },
        document: { getElementById: (id) => (id === 'auto-save' ? { checked: null, addEventListener: () => {} } : null) },
        timeSystem: { onNewDaySubscribe: (cb) => { newDayCb = cb; }, getAbsoluteDay: () => 0 },
        saveGame: () => null,
        currentCharData: null,
        showMessage: () => {}
    };
    W.window = W;
    vm.createContext(W);
    vm.runInContext(autoSrc, W, { filename: 'auto-save.js' });
    ok(typeof W.toggleAutoSave === 'function', 'F0 auto-save 在裸夹具里加载成功（无 owner、无 document 细桩）');
    W.toggleAutoSave(false);
    ok(store['xianxia_autosave_off'] === '1', 'F1 无 owner 世界：OFF_KEY 走 else 回退分支照旧落盘（既有 40+ 套野图/队伍用例同款依赖）');
    W.toggleAutoSave(true);
    ok(store['xianxia_autosave_off'] === '0', 'F2 再开回来也照旧落盘');
}

console.log('\n通过：' + passed + '　失败：' + failed);
process.exitCode = failed ? 1 : 0;
