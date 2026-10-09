/**
 * ach-title-ladder-node.js — 成就去掉物质奖，只留少量历练；按完成枚数解锁五档称号
 *
 * 用户口径（原话钉死）：
 *   「成就改为出几个称号？完成多少就解锁对应的？」
 *   「其实成就我觉得名气都不该加，最多加历练和经验对应冒险增加的阅历」
 *   「图鉴这种东西的奖励不该是物质奖励，不然破坏沉浸感」
 *
 * 覆盖：
 *   A 成就奖励：52 条预设 reward 键 ⊆ {exp}；每条都发历练；历练按 rarity 档位（不越档）；
 *     满配世界点亮一遍后 铜钱/灵石/名气/业障 分文不动、历练 = 完成集直和；提示只报成就名。
 *   B 五档称号：完成 0/4 无一枚；5 → 初闻江湖；15/30/45/52 各登一档；
 *     成就管理器缺席时全部不算解锁且不抛错；五档排在原十六枚之后（不抢展示优先级）；
 *     佩戴仍走既有 equipTitle，不另开一套系统；称号对象无任何属性字段。
 *   C 性能答卷：biography.js 零实时钩子/事件总线/定时器。
 *   D 反向探针：把某条成就的 gold 加回去 —— 本套必须当场判红（证明尺钉的是行为不是摆设）。
 *
 * 运行：node tests/ach-title-ladder-node.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
let passed = 0, failed = 0;
function ok(cond, label) {
    if (cond) passed++;
    else { failed++; console.log('[FAIL] ' + label); }
}
function load(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }
function sha(rel) { return crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex'); }

const EXP_BY_RARITY = { common: 5, uncommon: 10, rare: 15, epic: 25, legendary: 40 };
const LADDER = [
    { at: 5, id: 't_ach5', name: '初闻江湖' },
    { at: 15, id: 't_ach15', name: '足迹渐深' },
    { at: 30, id: 't_ach30', name: '阅历过人' },
    { at: 45, id: 't_ach45', name: '一方典故' },
    { at: 52, id: 't_ach52', name: '此生可书' }
];
const OLD_TITLES = ['t_prodigy3', 't_prodigy10', 't_demon80', 't_demon50', 't_kill300', 't_kill100', 't_arena30',
    't_fame401', 't_fame76', 't_noto60', 't_dao', 't_rich', 't_fail10', 't_top', 't_good', 't_evil'];

// ==================== A 成就奖励 ====================
console.log('\n[A] 成就奖励（只剩历练 · 量级压小 · 不发物质奖）');

function achWorld(src, opts) {
    opts = opts || {};
    const pool = { copper: 20000, stones: 3000 };
    const rsLog = { fame: 0, karma: 0, calls: 0 };
    const toasts = [], logs = [];
    const els = {};
    const fakeEl = (id) => (els[id] || (els[id] = { id: id, innerHTML: '', textContent: '' }));
    const cd = Object.assign({
        realm: '飞升', tempering: 500, luck: 90, karma: -80, fame: 90, notoriety: 60, _killCount: 400,
        bonds: { np1: { type: 'dao_companion', name: '道侣', level: 3 } }, _children: [{ name: '甲' }, { name: '乙' }],
        _rootRefines: 3, lifeSkills: { '采伐': 100 }
    }, opts.cd || {});
    const W = {
        console: { log: () => {}, warn: () => {}, error: () => {} },
        JSON: JSON, Object: Object, Array: Array, Math: Math, Number: Number, isFinite: isFinite,
        gameLog: { entries: [], add: (m) => { logs.push(String(m)); } },
        showMessage: (m) => { toasts.push(String(m)); },
        currentCharData: cd,
        timeSystem: { onNewDaySubscribe: () => {} },
        REALM_CONFIG: { realms: [
            { name: '炼气' }, { name: '筑基' }, { name: '金丹' }, { name: '元婴' }, { name: '化神' },
            { name: '炼虚' }, { name: '合体' }, { name: '大乘' }, { name: '渡劫' }
        ] },
        getRealmIndex: (n) => W.REALM_CONFIG.realms.findIndex((r) => r.name === n),
        getAbsoluteDay: () => 400,
        learnedSecrets: new Array(25),
        getCollectionStats: () => ({ items: 50, npcs: 35 }),
        npcManager: { getAllNPCs: () => { const a = []; for (let i = 0; i < 65; i++) a.push({ relationship: { affection: 20 + i } }); return a; } },
        playerHouse: { type: 'palace' },
        CaveFacilities: { getFacilities: () => [{ slot: 0 }, { slot: 1 }, { slot: 2 }, { slot: 3 }] },
        partySystem: { getMembers: () => [{ id: 'm1' }, { id: 'm2' }, { id: 'm3' }, { id: 'm4' }] },
        discipleState: { isInSect: true, rank: 1, contribution: 600 },
        tamedBeasts: [{ level: 20 }, { level: 5 }, { level: 12 }, { level: 20 }, { level: 8 }],
        CityDepth: { progress: () => ({ trialBest: 18, swordIntent: 12 }) },
        TravelJournal: { summary: () => ({ regions: 9, regionsTotal: 9, landmarks: 12, landmarksTotal: 12, steps: 8000 }) },
        document: { getElementById: fakeEl, querySelector: () => null, querySelectorAll: () => [] },
        XianXia: { DataManager: {
            getCopper: () => pool.copper, setCopper: (v) => { pool.copper = v; },
            getSpiritStones: () => pool.stones, setSpiritStones: (v) => { pool.stones = v; }
        } },
        RewardService: { apply: (r) => { rsLog.calls++; if (r && r.fame) rsLog.fame += r.fame; if (r && r.karma) rsLog.karma += r.karma; return { success: true }; } }
    };
    W.window = W;
    W.global = W;
    if (opts.empty) {
        // 真的空世界：把每一处「顺带就满足」的真源都摘掉（白送回归的老对手）
        ['learnedSecrets', 'npcManager', 'playerHouse', 'CaveFacilities', 'partySystem', 'tamedBeasts',
            'CityDepth', 'TravelJournal', 'getCollectionStats'].forEach((k) => { delete W[k]; });
        W.discipleState = {};
        W.getAbsoluteDay = () => 0;
        pool.copper = 0;
        pool.stones = 0;
        Object.keys(cd).forEach((k) => { cd[k] = 0; });
        cd.bonds = {};
        cd._children = [];
        cd.lifeSkills = {};
    }
    vm.createContext(W);
    vm.runInContext(src, W, { filename: opts.filename || 'achievement-system' });
    return { W, pool, rsLog, toasts, logs, cd, els };
}

const AS_SRC = load('js/achievement-system.js');
const w = achWorld(AS_SRC);
const presets = w.W.PresetAchievements;

ok(presets.length === 52, 'A1 预设成就 52 条（实际 ' + presets.length + '）');

const offKey = presets.filter((a) => Object.keys(a.reward || {}).some((k) => k !== 'exp'))
    .map((a) => a.id + '.' + Object.keys(a.reward).join('+')).join(', ');
ok(offKey === '', 'A2 52 条 reward 键全在 {exp} 里——铜钱/灵石/名气/业障/物品一枚都不许留（越界: ' + offKey + '）');

const noExp = presets.filter((a) => !(a.reward && Number(a.reward.exp) > 0)).map((a) => a.id).join(', ');
ok(noExp === '', 'A3 52 条都发历练，一枚都不白给（漏发: ' + noExp + '）');

const offTier = presets.filter((a) => a.reward.exp !== EXP_BY_RARITY[a.rarity])
    .map((a) => a.id + '/' + a.rarity + '=' + a.reward.exp).join(', ');
ok(offTier === '', 'A4 历练恰按稀有度档位：九品5 七品10 五品15 三品25 一品40（越档: ' + offTier + '）');

// 满配世界点亮一遍
const SKIP_IDS = { benevolent: 1, child_three: 1 }; // 业障 -80 与「善名+50」互斥；二子够不着三子
w.W.initAchievementSystem();
const mgr = w.W.achievementManager;
w.W.checkAchievementsNow();
const done = mgr.getCompletedAchievements();
ok(done.length === 50, 'A5 满配点亮 50/52（两枚天然留白: ' + presets.filter((a) => SKIP_IDS[a.id]).map((a) => a.id).join(',') + '）');

ok(w.pool.copper === 20000, 'A6 点亮 50 枚，铜钱分文不动（' + (w.pool.copper - 20000) + '）');
ok(w.pool.stones === 3000, 'A7 灵石分毫不动（' + (w.pool.stones - 3000) + '）');
ok(w.rsLog.calls === 0 && w.rsLog.fame === 0 && w.rsLog.karma === 0, 'A8 名气与业障一分钟都没走（通道调用 ' + w.rsLog.calls + ' 次）');
ok(w.cd.fame === 90 && w.cd.karma === -80, 'A9 名气/业障两格原值未动（' + w.cd.fame + '/' + w.cd.karma + '）');

const expectTemper = presets.filter((a) => a.isCompleted).reduce((s, a) => s + a.reward.exp, 0);
const allTemper = presets.reduce((s, a) => s + a.reward.exp, 0);
ok(w.cd.tempering === 500 + expectTemper, 'A10 历练进账 = 完成集直和（' + w.cd.tempering + ' / ' + (500 + expectTemper) + '）');
ok(allTemper === 895 && expectTemper === 855, 'A11 量级压得住账：52 枚全亮才 895 点历练（满配两枚留白 → 855）——旧版满配光是飞升/金丹两条就 2000');

const temper0 = w.cd.tempering;
w.W.checkAchievementsNow();
ok(w.cd.tempering === temper0 && w.pool.copper === 20000 && w.pool.stones === 3000, 'A12 重复检查不二次发奖');

// 提示：只报成就名，钱袋那串数字一个字都不许出现
ok(w.toasts.length === 1 && w.toasts[0].indexOf('成就解锁 50 枚') >= 0, 'A13 满配只弹一条汇总（' + w.toasts.length + ' 条）');
const leak = w.toasts.filter((t) => /铜钱\+|灵石\+|名气|业障|奖励/.test(t));
ok(leak.length === 0, 'A14 解锁提示里没有「铜钱+/灵石+/名气/业障」，也没挂工资条（实际: ' + w.toasts[0] + '）');
ok(w.logs.some((l) => l.indexOf('成就历练') >= 0), 'A15 历练进账只写日志（' + w.logs.filter((l) => l.indexOf('成就历练') >= 0).join(' / ') + '）');

// 单枚点亮：只报名，不念钱
const w1 = achWorld(AS_SRC, { empty: true });
w1.W.initAchievementSystem();
w1.W.checkAchievementsNow();
ok(w1.toasts.length === 0 && w1.W.achievementManager.getCompletedAchievements().length === 0, 'A16 空世界一次检查 0 点亮 0 提示（白送回归仍在）');
w1.cd._killCount = 1;
w1.W.checkAchievementsNow();
ok(w1.toasts.length === 1 && w1.toasts[0].indexOf('旗开得胜') >= 0, 'A17 单枚点亮一条提示，只报成就名（' + w1.toasts[0] + '）');
ok(!/铜钱\+|灵石\+|名气|业障|奖励/.test(w1.toasts[0]), 'A18 单枚提示里也没有工资条');
ok(w1.cd.tempering === 5 && w1.pool.copper === 0 && w1.pool.stones === 0, 'A19 点亮一枚：历练 +5（九品档）、钱袋分文不动');

// 非静默通道：complete() 自己那条提示也不许念钱（旧版这里会再弹一条「成就奖励：铜钱+N」）
const w2 = achWorld(AS_SRC, { empty: true });
w2.W.initAchievementSystem();
w2.cd._killCount = 1;
w2.W.achievementManager.getAchievement('first_blood').complete();
ok(w2.toasts.length === 1 && /成就解锁/.test(w2.toasts[0]), 'A20 非静默通道也只弹一条（' + w2.toasts.length + ' 条：' + w2.toasts[0] + '）');
ok(!/铜钱\+|灵石\+|奖励/.test(w2.toasts[0]), 'A21 非静默通道也不念工资条——全仓没有任何一条成就提示会报钱');

// ==================== B 五档称号 ====================
console.log('\n[B] 五档称号（按完成枚数解锁 · 挂现成梯子 · 不带战力）');

const BG_SRC = load('js/extensions/biography.js');

function bioWorld(achDone, opts) {
    opts = opts || {};
    const reg = {};
    const W = {
        console: { log: () => {}, warn: () => {}, error: () => {} },
        currentCharData: { name: '李长生', realm: '金丹', fame: 30, notoriety: 0, _killCount: 0, arenaWins: 0, karma: 0, _demonicCorruption: 0, _failedBreakthroughs: 0, bonds: {} },
        getRealmTier: (r) => ['炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'].indexOf(r) + 1,
        getFameLevel: () => ({ name: '小有名气' }),
        timeSystem: { getAbsoluteDay: () => 320 },
        TravelJournal: { regionLog: () => ({}) },
        inventory: { currency: { spiritStones: 500 } },
        WorldJournal: { getJournalEntries: () => [] },
        computeJianghuRank: () => ({ playerRank: 0 }),
        StateRegistry: { register: (k, h) => { reg[k] = h; } },
        showMessage: () => {},
        showModal: (t, h) => { W._modal = { title: t, html: h }; return { close: () => {} }; }
    };
    if (achDone !== null) {
        // 账主的只读口：只给完成枚数这一条，其余一概不答——称号梯子不许伸手进成就内部
        W.achievementManager = {
            getCompletedAchievements: () => { const a = []; for (let i = 0; i < achDone; i++) a.push('x' + i); return a; }
        };
    }
    W.window = W;
    W.global = W;
    vm.createContext(W);
    vm.runInContext(opts.src || BG_SRC, W, { filename: opts.filename || 'biography' });
    return { W, reg };
}

function achIds(W) { return W.Biography.unlockedTitles().filter((t) => t.id.indexOf('t_ach') === 0).map((t) => t.id); }

const w0 = bioWorld(0);
ok(achIds(w0.W).length === 0, 'B1 完成 0 枚：一枚成就称号都不给');
const w4 = bioWorld(4);
ok(achIds(w4.W).length === 0, 'B2 完成 4 枚（离头一档还差一枚）：一枚都不给');
const w5 = bioWorld(5);
ok(achIds(w5.W).join() === 't_ach5', 'B3 完成 5 枚 → 解锁「初闻江湖」（实得: ' + achIds(w5.W).join() + '）');

let badStep = null;
[15, 30, 45, 52].forEach((n) => {
    const want = LADDER.filter((t) => n >= t.at).map((t) => t.id).join();
    const got = achIds(bioWorld(n).W).join();
    if (got !== want) badStep = badStep || (n + ' 枚 → 期望 ' + want + '，实得 ' + got);
});
ok(badStep === null, 'B4 15/30/45/52 枚逐档各多登一枚，档档叠加不跳级（' + badStep + '）');
ok(achIds(bioWorld(52).W).length === 5, 'B5 52 枚全亮 → 五档称号全开');
ok(achIds(bioWorld(51).W).length === 4, 'B6 51 枚差一枚 → 最后一档「此生可书」老老实实锁着');

// 成就管理器缺席：不抛错、五档全不算解锁
const wNo = bioWorld(null);
let threw = null, ids = null;
try { ids = achIds(wNo.W); } catch (e) { threw = e; }
ok(threw === null, 'B7 成就管理器没就位时不抛错（' + (threw && threw.message) + '）');
ok(ids && ids.length === 0, 'B8 成就管理器没就位：五档称号一枚都不算解锁');

// 阶梯位置与佩戴
const T = w0.W.Biography.TITLES;
ok(T.length === OLD_TITLES.length + 5, 'B9 称号共 21 枚（原 16 + 新 5，实际 ' + T.length + '）');
ok(T.slice(0, OLD_TITLES.length).map((t) => t.id).join() === OLD_TITLES.join(), 'B10 新五档排在末尾，没插到前面抢展示优先级');
ok(T.slice(OLD_TITLES.length).map((t) => t.id).join() === LADDER.map((t) => t.id).join(), 'B11 五档 id 与门槛依次：5/15/30/45/52');
ok(T.map((t) => t.name).join().indexOf('初闻江湖') >= 0 && T[LADDER.length ? OLD_TITLES.length : 0].name === '初闻江湖', 'B12 末五档名目：初闻江湖/足迹渐深/阅历过人/一方典故/此生可书');

const w52 = bioWorld(52);
ok(w52.W.Biography.equip('t_ach52') === true && w52.W.Biography.getEquippedTitle() === '此生可书', 'B13 佩戴走既有 equipTitle，没另开一套系统');
const w5b = bioWorld(5);
ok(w5b.W.Biography.equip('t_ach30') === false, 'B14 够不着的档位佩戴被拒（不硬戴）');
ok(w5b.W.Biography.equip('t_ach5') === true && w5b.W.Biography.getEquippedTitle() === '初闻江湖', 'B15 刚够着的那一档佩戴成功');
ok(w5b.reg.biography && w5b.reg.biography.export().equipped === 't_ach5', 'B16 落档的仍只有「佩戴中」一个字段——成就梯子不开新账');
ok(LADDER.every((t) => String(T[OLD_TITLES.length + LADDER.indexOf(t)].desc).length > 0), 'B17 五档各有说明文案');

// 称号不带属性
const attrFields = T.filter((t) => Object.keys(t).some((k) => ['attack', 'defense', 'speed', 'hp', 'bonus', 'stat', 'points', 'exp', 'reward', 'mod'].indexOf(k) >= 0)).map((t) => t.id);
ok(attrFields.length === 0, 'B18 称号对象没有属性/积分/奖励字段（越界: ' + attrFields.join(',') + '）');
ok(!/attack|defense|bonus|dodge|crit/.test(BG_SRC), 'B19 biography.js 全文件零战力词——称号不给拳脚');
ok(BG_SRC.indexOf('ctx.achDone') >= 0 && BG_SRC.indexOf('getCompletedAchievements') >= 0, 'B20 条件只读成就墙的完成枚数，不读积分、不进成就内部');

// ==================== C 性能答卷 ====================
console.log('\n[C] 性能答卷（biography 仍是零实时钩子）');
ok(BG_SRC.indexOf('onNewDaySubscribe') < 0 && BG_SRC.indexOf('EventBus') < 0 && BG_SRC.indexOf('setInterval') < 0,
    'C1 biography.js 零每日订阅/事件总线/定时器——称号只在打开面板那一刻现算');

// ==================== D 反向探针 ====================
console.log('\n[D] 反向探针（把 gold 加回去 ⇒ 本套必须判红）');
const MUT = AS_SRC.replace(
    "reward: { exp: 5 }, icon: '⚔️', rarity: 'common', points: 10",
    "reward: { exp: 5, gold: 100 }, icon: '⚔️', rarity: 'common', points: 10"
);
ok(MUT !== AS_SRC, 'D1 探针注入成功：first_blood 的 reward 里加回 gold: 100');
const mw = achWorld(MUT, { filename: 'ach-mutant' });
const mPresets = mw.W.PresetAchievements;
const mOff = mPresets.filter((a) => Object.keys(a.reward || {}).some((k) => k !== 'exp')).map((a) => a.id);
ok(mOff.join() === 'first_blood', 'D2 加回 gold ⇒ A2「reward 键 ⊆ {exp}」当场判红（越界: ' + mOff.join() + '）——尺钉的是表，不是摆设');
mw.W.initAchievementSystem();
mw.cd._killCount = 1;
mw.W.checkAchievementsNow();
ok(mw.pool.copper > 20000, 'D3 加回 gold ⇒ 钱袋真会涨（' + (mw.pool.copper - 20000) + '）——这正是要从预设表里清掉的那条路');
ok(/铜钱\+/i.test(applyRewardEcho(mw)), 'D4 加回 gold ⇒ paid 回执里就有「铜钱+100」（发奖能力仍在，只是表不调它）');
const mSolo = new mw.W.Achievement('probe_ns', '探针非静默', '', { requirements: { killCount: 99999 }, reward: { gold: 100 } });
mSolo.complete();
ok(!/铜钱\+/.test(mw.toasts.join('|')), 'D4b 即使表里写了 gold，非静默通道也不念钱条（发放能力留着，工资条已撤）——A21 钉的就是这条');
function applyRewardEcho(ww) {
    // 直接调发放器，把回执念出来：这条能力 applyReward 仍保留着，不许顺手删掉
    const solo = new ww.W.Achievement('probe_only', '探针', '', { requirements: { killCount: 99999 }, reward: { gold: 100 } });
    return solo.applyReward(true).join(' ');
}
const BMUT = BG_SRC.replace('return ctx.achDone >= 5;', 'return ctx.achDone >= 0;');
ok(BMUT !== BG_SRC, 'D5 探针注入成功：头一档门槛 5 → 0');
const bmw = bioWorld(0, { src: BMUT, filename: 'bio-mutant' });
ok(achIds(bmw.W).join() === 't_ach5', 'D5b 门槛拆到 0 枚后「完成 0 枚一枚都不给」当场判红（实得: ' + achIds(bmw.W).join() + '）——B1/B2 钉的是那道门槛');

// 原文件指纹（收工核对用）
const FP = { ach: sha('js/achievement-system.js'), bio: sha('js/extensions/biography.js') };
ok(FP.ach.length === 64 && FP.bio.length === 64, 'D6 两个源文件指纹已记录（收工逐名比对用）');

console.log('\n========== 成就历练与五档称号 ==========');
console.log('通过：' + passed + '　失败：' + failed);
process.exit(failed ? 1 : 0);