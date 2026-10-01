/**
 * v25.4 玩家乐趣闭环批（第一百四十六批）——把「有趣但断头」的玩法焊通。
 *
 * 玩家视角盘仓后立案的五处断头（全在 FIX_NOTES 追记销账）：
 *   A 五处门派 trade 地标（昆仑护金/大旗镖营/血手索债/飞蝎抽成/海阁路引）——v20.8 补交互时
 *     唯一漏掉的类型，专属建筑永久灰置「暂无可执行动作」→ 本批 _runTradeRoute 接线；
 *   B 七个无派系数据的门派照画「🏛️ 派系」按钮，点了只弹一句敷衍 → 无数据不再画按钮；
 *   C 黑市代销失败台词漏出未替换占位符「姓×」＋ 园林别苑两套名字（别业🎋/别苑🌺）→ 文案收源；
 *   D 地图残片 spec_map_fragment 两处可获取、全仓零消费——攒了是死物品 → 三片拼藏宝图按图寻宝；
 *   E mergeSkills 功法融合写完整挂 window 却零调用零 UI（wave81 F8 自己都留言「另一批的活」）
 *     → 补掌握门槛/代价前置/效果=双亲逐键取高抬五成/入知识账/持久化注册表/防连锁防重复 + 面板入口。
 *
 * 钉法：A/D/E 功能真跑（沙箱加载真源码切片），B/C 源码钉位，A 段带反向探针。
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

console.log('\n========== v25.4 玩家乐趣闭环批 ==========');

// ============ A 门派商路地标：五处 trade 建筑真接线 ============
console.log('\n[A] 门派 trade 地标（此前永久灰置的五处专属建筑）');
{
    const src = load('js/sects/sect-resource-actions.js');
    ok(src.indexOf("trade: '🪙 随商路走一趟'") >= 0, 'A1 标签表补上 trade（不再空串灰置）');
    ok(src.indexOf("case 'trade':") >= 0 && src.indexOf('function _runTradeRoute(res)') >= 0, 'A2 switch 有 trade 分支且处理器在位');

    // 数据面：36 派里恰好 5 处 trade 地标，每处都能被 switch 接住
    const W0 = { console: { log: () => {}, warn: () => {}, error: () => {} } };
    W0.window = W0;
    vm.createContext(W0);
    vm.runInContext(load('js/sects/sects-deep-data.js'), W0, { filename: 'sects-deep-data.js' });
    const data = W0.SECT_DEEP_DATA;
    const trades = [];
    Object.keys(data).forEach(k => (data[k].specialResources || []).forEach(r => { if (r.type === 'trade') trades.push({ sect: k, r }); }));
    ok(trades.length === 5, 'A3 全仓 trade 地标恰 5 处（实测 ' + trades.length + '）');

    // 功能真跑：沙箱里开一家测试门派，走 useSectResource 正门
    function runTradeWorld(mutate) {
        const msgs = [], times = [];
        let stones = 0;
        const W = {
            console: { log: () => {}, warn: () => {}, error: () => {} },
            showMessage: (t) => msgs.push(String(t)),
            currentCharData: { energy: 100, qi: 50, spiritStones: 0, tempering: 0 },
            timeSystem: { advanceTime: (m, label) => times.push([m, label]) },
            discipleState: { isInSect: true, sectId: '测试派', contribution: 0 },
            SECT_DEEP_DATA: { '测试派': { specialResources: [{ id: 't1', type: 'trade', output: 8, name: '测试商路' }] } },
            inventory: { currency: { spiritStones: 0 }, slots: [] },
            updateCharacterStatus: () => {},
            Math: Object.create(Math)
        };
        W.window = W;
        W.inventory.currency = { get spiritStones() { return stones; }, set spiritStones(v) { stones = v; } };
        vm.createContext(W);
        let s = mutate ? mutate(src) : src;
        vm.runInContext(s, W, { filename: 'sect-resource-actions.js' });
        return { W, msgs, times, stones: () => stones };
    }
    const w = runTradeWorld(null);
    const ret = w.W.useSectResource('测试派', 't1');
    ok(ret === true, 'A4 useSectResource(trade) 走正门返回真（旧版落 default 灰置返回假）');
    ok(w.W.currentCharData.energy === 85, 'A5 精力真扣 15（实测 ' + w.W.currentCharData.energy + '）');
    ok(w.times.length === 1 && w.times[0][0] === 120 && w.times[0][1] === '跑商路', 'A6 时辰真推进（120 分钟 · 跑商路）');
    const gain = w.stones();
    ok(gain >= 26 && gain <= 35, 'A7 灵石落账在 output=8 的口径带内 26~35（实测 ' + gain + '）');
    ok(w.W.discipleState.contribution === 5, 'A8 宗门贡献 +5 记进弟子账');
    ok(w.msgs.some(m => m.indexOf('测试商路') >= 0 && m.indexOf('灵石+' + gain) >= 0), 'A9 回执念的是真账（建筑名+实收灵石数）');

    // 反向探针：把 trade 分支拆掉，A4 必须当场翻假（证明闸是量出来的）
    const wp = runTradeWorld(s => s.replace("        case 'trade':\n            return _runTradeRoute(res);\n", ''));
    ok(wp.W.useSectResource('测试派', 't1') === false, 'A10 反向探针：拆掉 trade 分支后同一调用落回 default 返回假');
}

// ============ B 派系按钮：无数据的七派不再画死按钮 ============
console.log('\n[B] 派系按钮（七派死按钮收编）');
{
    const ui = load('js/sects/sects-deep-ui.js');
    ok(ui.indexOf("(data.factions && data.factions.length) || sectName === '丐帮'") >= 0, 'B1 派系按钮加了数据守卫（丐帮两脉入口特判保住）');
    const iGuard = ui.indexOf("(data.factions && data.factions.length)");
    const iBtn = ui.indexOf('showSectFactions(\\\'');
    ok(iGuard > 0 && iBtn > iGuard && iBtn - iGuard < 400, 'B2 守卫就压在按钮渲染行前（不是别处的同名串）');
    // 数据面对账：确是 7 派无 factions
    const W0 = { console: { log: () => {}, warn: () => {}, error: () => {} } };
    W0.window = W0;
    vm.createContext(W0);
    vm.runInContext(load('js/sects/sects-deep-data.js'), W0, { filename: 'sects-deep-data.js' });
    const noFac = Object.keys(W0.SECT_DEEP_DATA).filter(k => {
        const f = W0.SECT_DEEP_DATA[k].factions;
        return !f || !f.length;
    });
    ok(noFac.length === 7, 'B3 无派系数据的门派现读 7 个（' + noFac.join('、') + '）');
}

// ============ C 文案收源：占位符与双名字 ============
console.log('\n[C] 文案收源（黑市占位符 + 园林别苑双名）');
{
    ok(load('js/city-facilities/facility-batch3.js').indexOf('姓×') < 0, 'C1 黑市代销失败台词不再有裸占位符「姓×」');
    let badFiles = [];
    (function walk(dir) {
        for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
            const p = path.join(dir, ent.name);
            if (ent.isDirectory()) walk(p);
            else if (ent.name.endsWith('.js') && fs.readFileSync(p, 'utf8').indexOf('园林别业') >= 0) badFiles.push(path.relative(ROOT, p));
        }
    })(path.join(ROOT, 'js'));
    ok(badFiles.length === 0, 'C2 全仓 js/ 零「园林别业」残留（' + badFiles.join(',') + '）');
    const loc = load('js/location-system.js');
    ok(loc.indexOf("name: '园林别苑', icon: '🌺'") >= 0, 'C3 地图建筑卡与设施表/弹窗卡收成同名同图标（园林别苑🌺）');
}

// ============ D 地图残片：死物品有了正路 ============
console.log('\n[D] 地图残片拼藏宝图（两处获取零消费的死物品闭环）');
{
    const inv = load('js/inventory.js');
    ok(inv.indexOf('function assembleTreasureMap()') >= 0 && inv.indexOf('window.assembleTreasureMap = assembleTreasureMap') >= 0, 'D1 拼宝图函数在位且导出');
    ok(inv.indexOf("case 'quest':") >= 0 && inv.indexOf("if (template.subtype === 'map') return assembleTreasureMap();") >= 0, 'D2 useItem 的任务物分支接上残片');
    ok(inv.indexOf('🗺️ 拼藏宝图') >= 0 && inv.indexOf("template.id === 'spec_map_fragment'") >= 0, 'D3 物品详情给残片专属按钮');
    ok(load('js/items-extended/08-special.js').indexOf('集齐三片可在行囊中拼成完整藏宝图') >= 0, 'D4 物品描述如实告诉玩家出路');

    // 功能真跑：切出函数段在沙箱里跑三种结局
    const start = inv.indexOf('var TREASURE_MAP_FRAGMENT_NEED');
    const end = inv.indexOf('window.assembleTreasureMap = assembleTreasureMap;');
    ok(start > 0 && end > start, 'D5 函数段切得出来');
    const slice = inv.slice(start, end + 'window.assembleTreasureMap = assembleTreasureMap;'.length);

    function runMapWorld(rand, fragCount) {
        const msgs = [], times = [];
        const W = {
            console: { log: () => {}, warn: () => {}, error: () => {} },
            showMessage: (t, ty) => msgs.push([String(t), ty]),
            timeSystem: { advanceTime: (m, label) => times.push([m, label]) },
            currentCharData: { qi: 50, tempering: 0, spiritStones: 0 },
            addItem: (id, n) => { W._added = (W._added || []); W._added.push([id, n]); return n; },
            updateCurrencyUI: () => {},
            updateCharacterStatus: () => {},
            Math: Object.create(Math)
        };
        W.Math.random = () => rand;
        W.window = W;
        W.inventory = { currency: { spiritStones: 0 }, slots: [{ templateId: 'spec_map_fragment', count: fragCount }] };
        W._slotRemoveCount = (slot, n) => { slot.count = Math.max(0, (slot.count || 0) - n); return slot.count <= 0; };
        vm.createContext(W);
        vm.runInContext(slice, W, { filename: 'assemble-slice' });
        return { W, msgs, times };
    }

    const wShort = runMapWorld(0.3, 2);
    ok(wShort.W.assembleTreasureMap() === false, 'D6 残片不足三片：不拼、不吃片，如实告知还差几片');
    ok(wShort.msgs[0][0].indexOf('只有 2 片') >= 0 && wShort.W.inventory.slots[0].count === 2, 'D7 拒绝路径残片分毫未动');

    const wBig = runMapWorld(0.3, 3);
    ok(wBig.W.assembleTreasureMap() === true, 'D8 三片齐：拼宝图成行');
    ok(wBig.W.inventory.slots[0] === null, 'D9 三片残图真被吃掉');
    ok(wBig.times.length === 1 && wBig.times[0][0] === 240 && wBig.times[0][1] === '按图寻宝', 'D10 寻宝真推时辰（半日 · 按图寻宝）');
    ok(wBig.W.inventory.currency.spiritStones === 195 && wBig.W.currentCharData.spiritStones === 195, 'D11 大藏口径：rand=0.3 → 灵石 150+45=195，行囊与角色账镜像一致');
    ok(wBig.W._added && wBig.W._added[0][0] === 'mat_five_element_essence', 'D12 大藏附带五行精华（与地宫藏宝图同款实物，非空话）');

    const wSmall = runMapWorld(0.7, 4);
    wSmall.W.assembleTreasureMap();
    ok(wSmall.W.inventory.currency.spiritStones === 82 && wSmall.W.inventory.slots[0].count === 1, 'D13 小藏口径：灵石 40+floor(0.7×60)=82，四片只吃三片剩一片');

    const wEmpty = runMapWorld(0.95, 3);
    wEmpty.W.assembleTreasureMap();
    ok(wEmpty.W.currentCharData.qi === 35 && wEmpty.W.currentCharData.tempering === 8, 'D14 空坑口径：真气-15、历练+8（挖空不白挖，也不撒钱）');
}

// ============ E 功法融合：死代码接线成完整闭环 ============
console.log('\n[E] 功法融合（mergeSkills 死代码接线）');
{
    const cul = load('js/cultivation/cultivation.js');
    ok(load('js/cultivation/art-effects.js').indexOf('parseSkillEffect: _parseSkillEffect') >= 0, 'E1 效果解析器露出单一真源（融合不许另起第二把尺）');
    ok(cul.indexOf('window.openSkillMergeUI = openSkillMergeUI') >= 0 && cul.indexOf('window.doSkillMerge = doSkillMerge') >= 0, 'E2 融合面板与开炉口子导出在位');
    ok(cul.indexOf('☯️ 功法融合') >= 0 && cul.indexOf("onclick=\"window.openSkillMergeUI()\"") >= 0, 'E3 修炼面板有了融合入口（死代码自此有人叫得动）');
    ok(cul.indexOf("MERGED_SAVE_KEY = 'xianxia_merged_skills'") >= 0, 'E4 融合结果有持久化注册表（读档不再凭空消失）');

    // 功能真跑：切出融合整段 + 加载真 art-effects（解析器用真的，回路才对得真）
    const start = cul.indexOf('var MERGE_COST_STONES');
    const endMark = 'window.rehydrateMergedSkills = rehydrateMergedSkills;';
    const end = cul.indexOf(endMark);
    ok(start > 0 && end > start, 'E5 融合段切得出来');
    const slice = cul.slice(start, end + endMark.length);

    function runMergeWorld(rand, opts) {
        opts = opts || {};
        const msgs = [], times = [];
        let stones = opts.stones != null ? opts.stones : 500;
        const store = opts.store || {};
        const W = {
            console: { log: () => {}, warn: () => {}, error: () => {} },
            showMessage: (t) => msgs.push(String(t)),
            currentCharData: { name: '测试修士' },
            skillPages: [[
                { id: 'skill_05', name: '清风剑法', icon: '🗡️', type: '剑法', grade: '九品', effect: '剑法伤害+12%', qiCost: 8 },
                { id: 'skill_03', name: '疾风步', icon: '💨', type: '轻功', grade: '九品', effect: '闪避+8%', qiCost: 5 },
                { id: 'skill_99', name: '没学过的功', icon: '📘', type: '内功', grade: '一品', effect: '攻击+50%', qiCost: 1 }
            ]],
            learnedSecrets: ['skill_05', 'skill_03'],
            KnowledgeSystem: {
                canEquip: (id) => W.learnedSecrets.indexOf(id) >= 0,
                unlock: (id) => { if (W.learnedSecrets.indexOf(id) < 0) W.learnedSecrets.push(id); }
            },
            timeSystem: { advanceTime: (m, label) => times.push([m, label]) },
            DataManager: { deductSpiritStones: (n) => { if (stones < n) return false; stones -= n; return true; } },
            localStorage: {
                getItem: (k) => (k in store ? store[k] : null),
                setItem: (k, v) => { store[k] = String(v); }
            },
            addEventListener: () => {},
            Math: Object.create(Math)
        };
        W.Math.random = () => rand;
        W.window = W;
        W.findSkillById = function (id) {
            for (const page of W.skillPages) for (const sk of (page || [])) if (sk && sk.id === id) return sk;
            return null;
        };
        W.getProficiencyInfo = () => ({ level: 2 });   // 成功率 = 0.5 + 4*0.03 = 0.62
        vm.createContext(W);
        vm.runInContext(load('js/cultivation/art-effects.js'), W, { filename: 'art-effects.js' });
        vm.runInContext(slice, W, { filename: 'merge-slice' });
        return { W, msgs, times, stones: () => stones, store };
    }

    const wGuard = runMergeWorld(0.1);
    ok(wGuard.W.mergeSkills('skill_05', 'skill_99') === false, 'E6 未掌握的功法进不了炉（旧版无门槛，理论上能融没读过的书）');
    ok(wGuard.stones() === 500, 'E7 门槛拦截分文不扣');

    const wFail = runMergeWorld(0.99);
    ok(wFail.W.mergeSkills('skill_05', 'skill_03') === false && wFail.stones() === 200, 'E8 失败路径：骰不过 0.62 → 灵石烧掉 300、两门功法无损');
    ok(wFail.msgs.some(m => m.indexOf('融合失败') >= 0 && m.indexOf('功法无损') >= 0), 'E9 失败回执如实（不谎报成功——NG+ 同款诚实口径）');

    const w = runMergeWorld(0.1);
    const def = w.W.mergeSkills('skill_05', 'skill_03');
    ok(!!def && def.id === 'merged_skill_03_skill_05', 'E10 成功路径：id 按字典序归一（甲乙/乙甲同一炉，堵重复融）');
    ok(def.name === '清风剑法·疾风步' && def.grade === '九品', 'E11 名号与品级不再出 NaN（旧版 Math.max(「九品」,1)+1）');
    const parsed = w.W.ArtEffects.parseSkillEffect(def.effect);
    ok(parsed.sword === 18 && parsed.dodgePct === 12, 'E12 效果=双亲逐键取高再抬五成（剑12→18、闪8→12），且真解析器读得回');
    ok(w.W.learnedSecrets.indexOf('merged_skill_03_skill_05') >= 0, 'E13 融合功法入知识账（运功/被动都认——旧版塞表不入账，融了白融）');
    ok(w.W.skillPages.some(p => (p || []).some(s => s && s.id === 'merged_skill_03_skill_05')), 'E14 功法表里查得到（findSkillById/浏览页同源）');
    ok(w.stones() === 200 && w.times.length === 1 && w.times[0][0] === 120, 'E15 代价前置真扣：灵石 300 + 一个时辰静悟');
    ok(typeof w.store['xianxia_merged_skills'] === 'string' && w.store['xianxia_merged_skills'].indexOf('merged_skill_03_skill_05') >= 0, 'E16 注册表落进本地存储（无 owner 的夹具世界走 else 回退分支——v25.3 铁律）');
    ok(w.W.mergeSkills('skill_05', 'skill_03') === false, 'E17 同一对再融被拦（已经融过一体）');
    ok(w.W.mergeSkills('merged_skill_03_skill_05', 'skill_99') === false, 'E18 融合功法不可再当炉底（堵连锁滚雪球）');

    // 重载回册：拿 E16 落下的注册表开一个新世界，融合功法必须自己长回来
    const w2 = runMergeWorld(0.1, { store: JSON.parse(JSON.stringify(w.store)) });
    ok(w2.W.skillPages.some(p => (p || []).some(s => s && s.id === 'merged_skill_03_skill_05')), 'E19 重载回册：新世界加载即重建融合功法（读档不凭空消失）');
    ok(w2.W.learnedSecrets.indexOf('merged_skill_03_skill_05') >= 0, 'E20 回册同时补知识账');
}

console.log('\n通过：' + passed + '　失败：' + failed);
process.exitCode = failed ? 1 : 0;
