// ==================== breakthrough-ritual.js - 突破仪式系统 ====================
// 突破前准备→突破过程动画→突破后异象→失败副作用
// 让境界突破从"点按钮"变成"完整仪式体验"
// 依赖：app.js (performBreakthrough, breakthroughRealm, currentCharData)
// 加载顺序：在 app.js 之后加载

// ============ 突破阶段定义 ============
const BREAKTHROUGH_PHASES = {
    preparation: {
        name: '准备阶段',
        icon: '⚡',
        desc: '调整气息，凝聚真气'
    },
    qi_gathering: {
        name: '灵气汇聚',
        icon: '🌊',
        desc: '天地灵气向你汇聚而来'
    },
    meridian_charge: {
        name: '冲击经脉',
        icon: '⚡',
        desc: '真气如江河奔涌，冲击经脉壁垒'
    },
    dantian_condensation: {
        name: '丹田凝结',
        icon: '🌀',
        desc: '灵气在丹田凝结，形成漩涡'
    },
    breakthrough: {
        name: '破茧成蝶',
        icon: '💥',
        desc: '经脉重塑，气息爆发'
    },
    aftermath: {
        name: '异象降临',
        icon: '✨',
        desc: '突破完成，天地异象'
    }
};

// 突破过程阶段文本
const BREAKTHROUGH_STAGES = {
    '炼气': [
        { text: '你盘膝而坐，运转体内微弱的真气……', duration: 3 },
        { text: '天地间的灵气开始缓缓流入你的经脉。', duration: 3 },
        { text: '真气在经脉中流转，打通一个个穴位。', duration: 4 },
        { text: '丹田处传来温热的感觉，真气开始凝聚。', duration: 3 },
        { text: '一股清气直冲天灵，你感觉到前所未有的清明！', duration: 3 }
    ],
    '筑基': [
        { text: '你服下筑基丹，药力在体内化开，如烈火灼烧经脉。', duration: 3 },
        { text: '真气在体内翻涌，你引导它们冲击经脉壁垒。', duration: 4 },
        { text: '经脉寸寸碎裂，又在灵气中重塑——脱胎换骨！', duration: 4 },
        { text: '丹田中真气凝聚成液态，筑基成功的关键时刻！', duration: 3 },
        { text: '你的身体散发出淡淡的金光，筑基已成！', duration: 3 }
    ],
    '金丹': [
        { text: '你将全身真气压缩至丹田，形成高速旋转的漩涡。', duration: 4 },
        { text: '漩涡中心开始凝聚，一粒金色的种子缓缓成形。', duration: 4 },
        { text: '天地灵气疯狂涌入你的身体，方圆百里的灵气都被引动！', duration: 4 },
        { text: '金丹在丹田中滴溜溜旋转，散发出强大的气息。', duration: 3 },
        { text: '你体内爆发出一股强大的气势，金丹已成！', duration: 3 }
    ],
    '元婴': [
        { text: '你闭目内视，丹田中的金丹开始出现裂痕。', duration: 4 },
        { text: '裂痕中透出耀眼的光芒，一个小小的身影正在成形。', duration: 4 },
        { text: '元婴破丹而出，在你的丹田中盘膝而坐。', duration: 4 },
        { text: '元婴与你心意相通，你能感受到它的每一次呼吸。', duration: 3 },
        { text: '天地为之震动，你的神识扩展了十倍！', duration: 3 }
    ],
    'default': [
        { text: '你运转全身真气，准备迎接天地的考验……', duration: 3 },
        { text: '灵气在体内翻涌，每一寸经脉都在震颤。', duration: 4 },
        { text: '你感受到境界的壁垒正在松动。', duration: 4 },
        { text: '集中所有意念，冲击那层无形的屏障！', duration: 4 },
        { text: '屏障破碎，新的境界在你面前展开！', duration: 3 }
    ]
};

// 突破后异象
const BREAKTHROUGH_PHENOMENA = {
    '炼气': ['你体内的真气更加凝实，五感变得更加敏锐。'],
    '筑基': ['天空祥云汇聚，一道金光从天而降，笼罩你的身体。', '你感觉到经脉比之前宽阔了数倍，真气运转更加流畅。'],
    '金丹': ['天空中出现异象，七彩霞光笼罩方圆百里。', '你的金丹在丹田中缓缓旋转，散发出柔和的光芒。'],
    '元婴': ['一个与你一模一样的小人出现在你头顶，好奇地打量着这个世界。', '你的神识扩展到了方圆数十里，一切都尽收眼底。'],
    'default': ['天地灵气震荡，你的气息变得比之前强大数倍。', '一道无形的波纹从你体内扩散开来，惊动了方圆百里的生灵。']
};

// 失败副作用
const BREAKTHROUGH_SIDE_EFFECTS = [
    { name: '经脉受损', desc: '经脉受到冲击，修炼速度-30%，持续3天', effect: { cultivationSpeed: -30, duration: 3 } },
    { name: '真气反噬', desc: '真气失控，攻击力-20%，持续2天', effect: { attack: -20, duration: 2 } },
    { name: '心神消耗', desc: '心神损耗过大，最大精力-20%，持续5天', effect: { maxEnergy: -20, duration: 5 } },
    { name: '修为倒退', desc: '突破失败导致修为倒退，当前层-1', effect: { layerLoss: 1, duration: 0 } }
];

// 突破所需材料
// ★这张表为什么必须写满九道门★
// 此前只写到 元婴→化神，化神以上四关全部落进 default { items: [], minEnergy: 50, minQi: 40 }：
// 越往高境界越便宜——合体→大乘 材料一件不用、只要 50 精力 40 真气，
// 比筑基→金丹（凝金丹 ×1 + 70 精力 60 真气）还松。这既不合逻辑（合体期哪来那么多闲真气冲关），
// 也让"越修越难"这条坡在最后四关整个塌掉：真正难的关卡反而最省。
// 四条高境材料全部取自材料表里已有的物品（天外玄铁/星辰铁/龙晶，天外陨铁、星辰矿、
// 古神葬地、裂隙巢底都掉），不新造物品、不新开一条获得路径。
const BREAKTHROUGH_MATERIALS = {
    '炼气→筑基': { items: [{ id: 'pill_foundation', name: '筑基丹', count: 1 }], minEnergy: 60, minQi: 50 },
    '筑基→金丹': { items: [{ id: 'pill_golden_core', name: '凝金丹', count: 1 }], minEnergy: 70, minQi: 60 },
    '金丹→元婴': { items: [{ id: 'pill_primordial', name: '元婴丹', count: 1 }], minEnergy: 80, minQi: 70 },
    '元婴→化神': { items: [{ id: 'pill_divine', name: '化神丹', count: 1 }], minEnergy: 85, minQi: 80 },
    '化神→炼虚': { items: [{ id: 'mat_sky_iron', name: '天外玄铁', count: 1 }], minEnergy: 88, minQi: 82 },
    '炼虚→合体': { items: [{ id: 'mat_star_iron', name: '星辰铁', count: 1 }], minEnergy: 90, minQi: 85 },
    '合体→大乘': { items: [{ id: 'mat_dragon_crystal', name: '龙晶', count: 1 }], minEnergy: 92, minQi: 88 },
    '大乘→渡劫': { items: [{ id: 'mat_dragon_crystal', name: '龙晶', count: 1 }, { id: 'mat_star_iron', name: '星辰铁', count: 1 }], minEnergy: 95, minQi: 90 },
    'default': { items: [], minEnergy: 50, minQi: 40 }
};

// ============ 突破丹·按境界索引 ============
// 此前 10 张突破丹都写了 breakthroughRealm 字段，全仓**零消费者**——纯死字段。
// 死字段的代价不是"多占一行"：化神丹这类"已定义、desc 写着 +20%、却没人掉"的丹，
// 没有任何一处校验会发现它拿不到。这里给该字段第一个读取方。
//
// ★为什么只有 9 境而不是 12★
// REALM_ORDER（global-utils.js:899）是 12 项，多出 凡人/飞升/金仙；
// 但突破门只认 REALM_CONFIG.realms（data.js:171-179）的 9 境：
// 飞升走 heavenly-tribulation.js 的天劫链、金仙走 ascension-epilogue.js 的二段飞升，
// 两条链都不经突破门、不吃突破丹。渡劫是突破门末位（下方 realmList 末位即拦下），
// 渡劫往上没有"突破"可买，所以渡劫不配专属丹。
const BREAKTHROUGH_REALM_ORDER = ['炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'];

// 突破仪式的基准成功率（:195 那行 0.8 - 境界序×0.05）。抽成函数是为了让
// 「这一境吃哪张丹、服药后落到多少成功率」可被面板与断言共用同一份口径。
function getBreakthroughRitualBaseRate(realm) {
    const idx = BREAKTHROUGH_REALM_ORDER.indexOf(realm);
    if (idx < 0) return null;
    return 0.8 - (idx * 0.05);
}

// 列出某一境（= 当前所在、即将突破的那一境）真正吃得上的突破丹。
// 判据与 inventory.js 的吞丹口对齐：subtype==='breakthrough' 且 effect.breakthrough_bonus
// 是数值或字符串（字符串一律按 5~15% 随机roll）；implemented/deprecated 一律排除。
function getBreakthroughPillsForRealm(realm) {
    const out = [];
    const seen = new Set();
    const pools = [];
    if (Array.isArray(window.extendedBreakthroughPills)) pools.push(...window.extendedBreakthroughPills);
    for (const p of pools) {
        if (!p || !p.id || seen.has(p.id)) continue;
        if (p.subtype !== 'breakthrough') continue;
        if (p.implemented === false || p.deprecated === true) continue;
        const bb = p.effect && p.effect.breakthrough_bonus;
        if (typeof bb !== 'number' && typeof bb !== 'string') continue;
        if (p.breakthroughRealm !== realm && p.breakthroughRealm !== '通用') continue;
        seen.add(p.id);
        out.push({
            id: p.id, name: p.name, realm: p.breakthroughRealm, bonus: bb,
            quality: p.quality, level: p.level,
            random: typeof bb === 'string'
        });
    }
    out.sort((a, b) => (a.level || 0) - (b.level || 0) || String(a.id).localeCompare(String(b.id)));
    return out;
}


// ============ 玩家突破状态 ============
let breakthroughState = {
    inProgress: false,
    currentRealm: '',
    targetRealm: '',
    stage: 0,
    successRate: 0,
    isSuccess: false
};

// ============ 核心函数：开始突破仪式 ============
function startBreakthroughRitual() {
    const charData = window.currentCharData;
    if (!charData) { showMessage('请先创建角色', 'warning'); return; }
    if (breakthroughState.inProgress) { showMessage('突破正在进行中……', 'warning'); return; }

    const realmList = ['炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'];
    const currentRealm = charData.realm || '炼气';
    const currentLayer = charData.layer || 1;
    const currentIndex = realmList.indexOf(currentRealm);
    const maxLayers = (window.REALM_CONFIG && window.REALM_CONFIG.realms && window.REALM_CONFIG.realms[currentIndex] && window.REALM_CONFIG.realms[currentIndex].layers) || 9;

    // v12.1：仪式只负责“大境界跃迁”；小境界必须走标准突破，禁止一键跨境。
    if (currentLayer < maxLayers) {
        if (typeof window._performBreakthroughNew === 'function') return window._performBreakthroughNew();
        showMessage(`需先修至${currentRealm}${maxLayers}层圆满`, 'warning');
        return;
    }

    if (currentIndex < 0 || currentIndex >= realmList.length - 1) {
        showMessage('已达最高境界，无法突破', 'warning');
        return;
    }

    const nextRealm = realmList[currentIndex + 1];

    // 与标准突破系统共用核心成长门槛；仪式材料是额外准备，不替代真元/历练。
    if (typeof window.getEssenceRequired === 'function' && typeof window.getTemperingRequired === 'function') {
        const essenceRequired = window.getEssenceRequired(currentIndex, currentLayer);
        const temperingRequired = window.getTemperingRequired(currentIndex, currentLayer);
        const qiRequired = typeof window.getQiMax === 'function' ? window.getQiMax(currentIndex, currentLayer) * 0.8 : 0;
        if ((charData.essence || 0) < essenceRequired) { showMessage(`真元不足（需要${essenceRequired}）`, 'warning'); return; }
        if ((charData.tempering || 0) < temperingRequired) { showMessage(`历练不足（需要${temperingRequired}）`, 'warning'); return; }
        if ((charData.qi || 0) < qiRequired) { showMessage(`真气不足（至少${Math.ceil(qiRequired)}）`, 'warning'); return; }
    }

    // 检查材料
    const materialKey = currentRealm + '→' + nextRealm;
    const req = BREAKTHROUGH_MATERIALS[materialKey] || BREAKTHROUGH_MATERIALS['default'];

    // 检查精力
    if ((charData.energy ?? 100) < req.minEnergy) {
        showMessage(`精力不足（需要≥${req.minEnergy}），请先休息恢复`, 'warning');
        return;
    }

    // 检查真气
    if ((charData.qi ?? 100) < req.minQi) {
        showMessage(`真气不足（需要≥${req.minQi}），请先修炼恢复`, 'warning');
        return;
    }

    // 检查灵石
    const breakthroughCost = 100 * (currentIndex + 1);
    const stoneBalance = window.EconomyTransaction && typeof window.EconomyTransaction.getBalance === 'function'
        ? window.EconomyTransaction.getBalance('spiritStones')
        : (charData.spiritStones || 0);
    if (stoneBalance < breakthroughCost) {
        showMessage(`需要${breakthroughCost}灵石进行突破`, 'error');
        return;
    }

    // 检查材料物品
    if (req.items.length > 0) {
        for (const item of req.items) {
            if (!hasItemInInventory(item.id, item.count)) {
                showMessage(`缺少突破材料：${item.name} ×${item.count}`, 'error');
                return;
            }
        }
    }

    // 设置突破状态
    breakthroughState.inProgress = true;
    breakthroughState.currentRealm = currentRealm;
    breakthroughState.targetRealm = nextRealm;
    breakthroughState.stage = 0;

    // 计算成功率
    let baseRate = 0.8 - (currentIndex * 0.05);
    // 心魔战胜加成（0.2.3 统一读 charData._heartDemonBonus，与 standard 路径一致）
    var _hdCd = window.currentCharData || charData;
    if (_hdCd && _hdCd._heartDemonBonus) {
        baseRate += _hdCd._heartDemonBonus;
        _hdCd._heartDemonBonus = 0;
    }
    // 瓶颈期加成
    if (window._bottleneckBonus) {
        baseRate += window._bottleneckBonus;
        window._bottleneckBonus = 0;
    }
    // F-14：突破丹加成（服用时累加，此处读取并消耗——一次性，成败皆耗）
    // ★第二刀·丹加成封顶：这一关的丹最多把基础率抬高一倍的一半★
    // 基础斜线是 0.8 − 境界序×0.05：越往后越低（渡劫前的大乘只剩 45%），
    // 而各丹是 +10% ~ +27% 的**固定**百分点——两者相加等于"境界越高，丹的相对分量越重"，
    // 大乘 45% + 大乘丹 27% = 72%。丹是外物，不该主导一场跨境生死。
    // 封顶取「加丹前的基础率 × 0.5」：越往后基础率越低，同样的丹能抬的绝对值就越小
    // （大乘最多再加 22.5% → 67.5%，化神 60% + 化神丹 20% 不触顶仍照旧 80%）。
    // 各丹自己的数字一个都没改，只加这一层「这一关丹能抬多少」。
    const _baseBeforePill = baseRate;
    var _cd14 = window.currentCharData || charData;
    if (_cd14) {
        if (_cd14._breakthroughPillBonus) { baseRate += _cd14._breakthroughPillBonus; _cd14._breakthroughPillBonus = 0; }
        // perm_pill 类突破丹（foundation/core/primordial/divine_bonus）按目标境界匹配读取（值 30/20/15/10 为百分点→/100）
        var _realmBonusKey = { '筑基': '_foundationBonus', '金丹': '_coreBonus', '元婴': '_primordialBonus', '化神': '_divineBonus' }[nextRealm];
        if (_realmBonusKey && _cd14[_realmBonusKey]) { baseRate += _cd14[_realmBonusKey] / 100; _cd14[_realmBonusKey] = 0; }
    }
    const _pillGain = baseRate - _baseBeforePill;
    const _pillCap = Math.max(0, _baseBeforePill) * 0.5;
    breakthroughState._baseRateBeforePill = _baseBeforePill;
    breakthroughState._pillCap = _pillCap;
    if (_pillGain > 0) {
        if (_pillGain > _pillCap) {
            baseRate = _baseBeforePill + _pillCap;
            if (window.showMessage) {
                // 22.5% 不许印成 23%——封顶数字是玩家判断"这丹值不值"的唯一依据
                var _capPct = Math.round(_pillCap * 1000) / 10;
                window.showMessage('🧪 丹力再厚也只能推你一半的路——这一关的丹药加成封顶 +' + _capPct + '%。', 'warning');
            }
        }
    }
    // 第二十四波：洞府「闭关室」的 breakthroughBoost 此前是死账——设施建了、加成没人读。接进成功率。
    try {
        if (window.CaveFacilities && typeof window.CaveFacilities.getBuff === 'function') {
            var _medBoost = Number(window.CaveFacilities.getBuff('player', 'breakthroughBoost')) || 0;
            if (_medBoost > 0) baseRate += _medBoost;
        }
    } catch (eMed) {}
    // 第七十三波·境由心转：神思不倦的关冲得稳、心灰意冷的关更凶险
    //（加减百分点放在封顶之前——[0.1, 0.95] 的老闸不破，与标准突破路径同一本梯度账）
    try {
        if (window.MoodSystem && typeof window.MoodSystem.breakthroughBonus === 'function') {
            baseRate += window.MoodSystem.breakthroughBonus();
        }
    } catch (eMoodBT) {}
    breakthroughState.successRate = Math.min(0.95, Math.max(0.1, baseRate));

    // v21.9 燃机缘：fortune（奇遇得手攒下的机缘值）≥30 可烧掉。
    // ★第一刀·必成 → 抵一次失败★：此前烧掉是把 successRate 顶成 1，成功率封顶闸 [0.1, 0.95]
    // 从此为死码——大乘 45% + 大乘丹 27% = 72%，再烧 30 点机缘就成 100%，
    // 也就是跨境突破最险的一关反倒有"必成"按钮。机缘不该买命，该买一次跌境的余地：
    // 现在烧掉只抵"跌境"——失败不扣层，也不再抽到「修为倒退」那条副作用；
    // 经脉受损 / 真气反噬 / 心神消耗照旧会来（烧掉的是命，不是伤）。
    breakthroughState._fortuneBurnAvailable = false;
    breakthroughState._fortuneBurned = false;
    breakthroughState._fortuneShield = false;
    try {
        var _cdFb = window.currentCharData;
        if (_cdFb && (Number(_cdFb.fortune) || 0) >= 30 && !breakthroughState._fortuneBurned) {
            breakthroughState._fortuneBurnAvailable = true;
        }
    } catch (e) {}

    // 创建突破仪式UI
    showBreakthroughUI(charData, currentRealm, nextRealm, breakthroughCost, req);
}

// ============ 检查物品是否在背包中 ============
function hasItemInInventory(itemId, count) {
    if (!window.inventory || !window.inventory.slots) return false;
    let total = 0;
    for (const slot of window.inventory.slots) {
        if (slot && slot.templateId === itemId) {
            total += slot.count || 1;
        }
    }
    return total >= count;
}

// ============ 消耗物品 ============
function consumeRitualItems(items) {
    if (!items || items.length === 0) return true;
    for (const item of items) {
        if (window.EconomyTransaction && typeof window.EconomyTransaction.removeByTemplate === 'function') {
            if (!window.EconomyTransaction.removeByTemplate(item.id, item.count)) return false;
            continue;
        }
        // 兼容降级：按模板跨堆叠扣除，不能把 templateId 当 uid。
        let remaining = item.count || 1;
        for (let i = 0; window.inventory && i < window.inventory.slots.length && remaining > 0; i++) {
            const slot = window.inventory.slots[i];
            if (!slot || slot.templateId !== item.id) continue;
            const take = Math.min(slot.count || 1, remaining);
            slot.count = (slot.count || 1) - take;
            remaining -= take;
            if (slot.count <= 0) window.inventory.slots[i] = null;
        }
        if (remaining > 0) return false;
    }
    return true;
}

// ============ 显示突破仪式UI ============
// 突破丹这一行：把「本境吃哪张丹、身上有几颗、这一关吃了真能加多少」摊在面板上。
// 加成是真的（读 _breakthroughPillBonus 加进 baseRate 并清零），
// 这里只负责让玩家看见它——此前这个加成只有服丹时的一行 toast，突破面板上是查不出来的。
// ★封顶也必须印出来★：印 +27% 而实际只给 22.5%，屏上就是在说谎（面板是玩家唯一的手册）。
function realmPillRows(currentRealm) {
    let pills = [];
    try { pills = getBreakthroughPillsForRealm(currentRealm) || []; } catch (e) { return ''; }
    if (!pills.length) return '';
    const cap = typeof breakthroughState._pillCap === 'number' ? breakthroughState._pillCap : Infinity;
    const pct = function (v) { return Math.round(v * 1000) / 10; };
    const rows = pills.map(p => {
        const owned = hasItemInInventory(p.id, 1);
        let gain, capped = false;
        if (p.random) {
            const parts = p.bonus.replace(/[^0-9~%]/g, '').split('~').map(s => parseFloat(s) || 0);
            const lo = (parts[0] || 0) / 100, hi = (parts[1] || 0) / 100;
            const useHi = Math.min(hi, cap);
            capped = useHi < hi;
            gain = '+' + pct(lo) + '~' + pct(useHi) + '%';
        } else {
            const use = Math.min(p.bonus, cap);
            capped = use < p.bonus;
            gain = '+' + pct(use) + '%';
        }
        const mark = capped ? '<span class="text-yellow-500">（封顶）</span>' : '';
        return `<div class="flex justify-between">
                    <span class="text-gray-400">${p.name}</span>
                    <span class="${owned ? 'text-green-400' : 'text-gray-500'}">${owned ? '✅' : '·'} ${gain} ${mark}</span>
                </div>`;
    }).join('');
    return `<div class="mt-1 pt-1 border-t border-gray-700/60 text-[11px] text-gray-500">可用突破丹（先服丹再突破）</div>` + rows;
}

// ============ 显示突破仪式UI ============
function showBreakthroughUI(charData, currentRealm, nextRealm, cost, requirements) {
    // 移除旧UI
    const oldModal = document.querySelector('.breakthrough-ritual-modal');
    if (oldModal) oldModal.remove();

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/85 flex items-center justify-center z-[60] breakthrough-ritual-modal';
    modal.style.backdropFilter = 'blur(6px)';
    modal.onclick = (e) => { if (e.target === modal && !breakthroughState.inProgress) modal.remove(); };

    // 准备阶段UI
    modal.innerHTML = `
        <div class="bg-gray-800 border-2 border-yellow-600/50 rounded-xl p-8 max-w-lg w-full mx-4 text-center"
             style="box-shadow: 0 0 60px rgba(234,179,8,0.1);">
            <!-- 图标 -->
            <div class="text-6xl mb-4 animate-pulse">⬆️</div>

            <!-- 标题 -->
            <h2 class="text-2xl font-bold text-yellow-500 mb-2">突破仪式</h2>
            <p class="text-gray-400 mb-6">${currentRealm} → ${nextRealm}</p>

            <!-- 突破条件 -->
            <div class="bg-gray-900/50 rounded-lg p-4 mb-4 text-left">
                <h3 class="text-sm font-bold text-gray-300 mb-2">📋 突破条件</h3>
                <div class="space-y-1 text-xs">
                    <div class="flex justify-between">
                        <span class="text-gray-400">灵石消耗</span>
                        <span class="text-yellow-400">${cost}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-400">当前精力</span>
                        <span class="${charData.energy >= requirements.minEnergy ? 'text-green-400' : 'text-red-400'}">${charData.energy || 0}/${requirements.minEnergy}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-400">当前真气</span>
                        <span class="${charData.qi >= requirements.minQi ? 'text-green-400' : 'text-red-400'}">${charData.qi || 0}/${requirements.minQi}</span>
                    </div>
                    ${requirements.items.map(item => {
                        const has = hasItemInInventory(item.id, item.count);
                        return `<div class="flex justify-between">
                            <span class="text-gray-400">${item.name}</span>
                            <span class="${has ? 'text-green-400' : 'text-red-400'}">${has ? '✅' : '❌'} ×${item.count}</span>
                        </div>`;
                    }).join('')}
                    ${realmPillRows(currentRealm)}
                </div>
            </div>

            <!-- 成功率 -->
            <div class="mb-6">
                <div class="flex justify-between text-sm text-gray-400 mb-1">
                    <span>突破成功率</span>
                    <span class="text-yellow-400 font-bold" id="bt-rate-text">${Math.round(breakthroughState.successRate * 100)}%</span>
                </div>
                <div class="w-full bg-gray-700 rounded-full h-3">
                    <div class="h-3 rounded-full bg-gradient-to-r from-yellow-500 to-red-500 transition-all duration-500" id="bt-rate-bar"
                         style="width: ${breakthroughState.successRate * 100}%"></div>
                </div>
            </div>

            ${breakthroughState._fortuneBurnAvailable ? `
            <!-- v21.9 燃机缘：抵一次跌境，不抵命 -->
            <div class="mb-6 bg-purple-900/30 border border-purple-600/50 rounded-lg p-3" id="fortune-burn-box">
                <div class="flex items-center justify-between gap-2">
                    <div class="text-xs text-gray-300">🍀 机缘值 ${(window.currentCharData && Number(window.currentCharData.fortune)) || 0}——奇遇里得手攒下的机缘，可以烧掉垫住这一关的跌境</div>
                    <button onclick="burnFortuneForBreakthrough()" class="px-3 py-1 bg-purple-700 hover:bg-purple-600 text-white text-xs rounded font-bold whitespace-nowrap">🔥 燃 30 机缘 · 此关失败不跌境</button>
                </div>
            </div>` : ''}

            <!-- 按钮 -->
            <div class="flex gap-3 justify-center">
                <button onclick="closeBreakthroughRitual()" class="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition">取消</button>
                <button onclick="executeBreakthroughRitual()" class="px-6 py-2 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white font-bold rounded-lg transition-all transform hover:scale-105">
                    开始突破 ✨
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// v21.9 燃机缘：烧 30 点机缘值，换这次突破**失败不跌境**
// 成功率一个数都不动——机缘买的不是命，是一次重来的余地。
// 门槛（≥30）、一次只燃一回（_fortuneBurned）、不足不扣、照扣 30 点，都与改前同。
function burnFortuneForBreakthrough() {
    var cd = window.currentCharData;
    if (!cd || (Number(cd.fortune) || 0) < 30) {
        if (window.showMessage) window.showMessage('机缘不足 30 点——去人间奇遇里得手，就能攒下机缘。', 'warning');
        return false;
    }
    if (breakthroughState._fortuneBurned) return false;
    cd.fortune = (Number(cd.fortune) || 0) - 30;
    breakthroughState._fortuneBurned = true;
    breakthroughState._fortuneShield = true;
    breakthroughState._fortuneBurnAvailable = false;
    var box = document.getElementById('fortune-burn-box');
    if (box) box.innerHTML = '<p class="text-xs text-purple-300">🔥 机缘已燃——这一关若失败，不跌境、不倒修为（伤还得照受）。剩余机缘 ' + cd.fortune + '</p>';
    if (window.showMessage) window.showMessage('🔥 你烧掉了 30 点机缘——换来的不是必过，是万一失败时脚下那一层还站得住。', 'success');
    if (typeof window.updateCharacterStatus === 'function') { try { window.updateCharacterStatus(); } catch (e) {} }
    return true;
}
window.burnFortuneForBreakthrough = burnFortuneForBreakthrough;

// ============ 执行突破仪式过程 ============
function executeBreakthroughRitual() {
    const charData = window.currentCharData;
    if (!charData) return;

    const realmList = ['炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'];
    const currentIndex = realmList.indexOf(breakthroughState.currentRealm);
    const breakthroughCost = 100 * (currentIndex + 1);

    // 原子结算灵石 + 全部仪式材料；任一步失败都回滚。
    const materialKey = breakthroughState.currentRealm + '→' + breakthroughState.targetRealm;
    const req = BREAKTHROUGH_MATERIALS[materialKey] || BREAKTHROUGH_MATERIALS['default'];
    let paid = false;
    if (window.EconomyTransaction && typeof window.EconomyTransaction.run === 'function') {
        paid = window.EconomyTransaction.run(function() {
            if (!window.EconomyTransaction.debit('spiritStones', breakthroughCost)) return false;
            return consumeRitualItems(req.items);
        }) === true;
    } else {
        if ((charData.spiritStones || 0) >= breakthroughCost && consumeRitualItems(req.items)) {
            charData.spiritStones -= breakthroughCost;
            paid = true;
        }
    }
    if (!paid) {
        breakthroughState.inProgress = false;
        if (window.showMessage) window.showMessage('突破准备结算失败：灵石或材料不足，未消耗任何资源。', 'error');
        return false;
    }

    // 消耗精力/真气
    charData.energy = Math.max(0, (charData.energy ?? 100) - 30);
    charData.qi = Math.max(0, (charData.qi ?? 100) - 30);

    // 开始阶段演出
    breakthroughState.stage = 0;
    showBreakthroughStage(0);
}

// ============ 显示突破阶段 ============
function showBreakthroughStage(stageIndex) {
    const modal = document.querySelector('.breakthrough-ritual-modal');
    if (!modal) return;

    const stages = BREAKTHROUGH_STAGES[breakthroughState.currentRealm] || BREAKTHROUGH_STAGES['default'];
    if (stageIndex >= stages.length) {
        // 所有阶段结束，显示结果
        showBreakthroughResult();
        return;
    }

    const stage = stages[stageIndex];
    const totalStages = stages.length;

    // 阶段名称
    const phaseKeys = Object.keys(BREAKTHROUGH_PHASES);
    const phaseIndex = Math.min(stageIndex, phaseKeys.length - 1);
    const phase = BREAKTHROUGH_PHASES[phaseKeys[phaseIndex]];

    modal.innerHTML = `
        <div class="bg-gray-800 border-2 border-yellow-600/50 rounded-xl p-8 max-w-lg w-full mx-4 text-center"
             style="box-shadow: 0 0 60px rgba(234,179,8,0.1);">
            <!-- 阶段图标 -->
            <div class="text-5xl mb-4 animate-bounce" style="animation: float 2s ease-in-out infinite;">${phase.icon}</div>

            <!-- 阶段标题 -->
            <h3 class="text-xl font-bold text-yellow-500 mb-1">${phase.name}</h3>
            <p class="text-sm text-gray-400 mb-4">${phase.desc}</p>

            <!-- 进度条 -->
            <div class="mb-4">
                <div class="flex justify-between text-xs text-gray-500 mb-1">
                    <span>突破进度</span>
                    <span>${stageIndex + 1}/${totalStages}</span>
                </div>
                <div class="w-full bg-gray-700 rounded-full h-2">
                    <div class="h-2 rounded-full bg-gradient-to-r from-yellow-500 to-red-500 transition-all duration-1000"
                         style="width: ${((stageIndex + 1) / totalStages) * 100}%"></div>
                </div>
            </div>

            <!-- 阶段描述 -->
            <div class="bg-gray-900/50 rounded-lg p-4 mb-4">
                <p class="text-gray-200 leading-relaxed text-lg typewriter-text" id="ritual-text">
                    ${stage.text}
                </p>
            </div>

            <!-- 继续按钮 -->
            <button onclick="advanceBreakthroughStage(${stageIndex + 1})"
                class="px-6 py-2 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500
                       text-white font-bold rounded-lg transition-all transform hover:scale-105">
                ${stageIndex < totalStages - 1 ? '继续 ▶' : '突破！ 💥'}
            </button>
        </div>
    `;

    // 添加动画样式
    if (!document.getElementById('ritual-anim-style')) {
        const style = document.createElement('style');
        style.id = 'ritual-anim-style';
        style.textContent = `
            @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
            .typewriter-text { animation: ritFadeIn 0.8s ease; }
            @keyframes ritFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        `;
        document.head.appendChild(style);
    }
}

// ============ 推进突破阶段 ============
function advanceBreakthroughStage(nextIndex) {
    // 50%概率在冲击经脉阶段触发失败
    if (nextIndex === 3) {
        const isSuccess = Math.random() < breakthroughState.successRate;
        breakthroughState.isSuccess = isSuccess;
        if (!isSuccess) {
            // 失败：显示失败结果
            showBreakthroughFailure();
            return;
        }
    }

    showBreakthroughStage(nextIndex);
}

// ============ 显示突破结果 ============
function showBreakthroughResult() {
    const charData = window.currentCharData;
    if (!charData) return;

    const modal = document.querySelector('.breakthrough-ritual-modal');
    if (!modal) return;

    const nextRealm = breakthroughState.targetRealm;
    const realmList = ['炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'];
    const nextIndex = realmList.indexOf(nextRealm);

    // 应用突破成功：与标准突破数值口径一致。
    const oldRealm = breakthroughState.currentRealm;
    const oldLayer = charData.layer || 1;
    charData._failedBreakthroughs = 0;
    charData.essence = 0;
    charData.realm = nextRealm;
    charData.layer = 1;
    // 2.4 修仙延寿：突破大境界自动延寿（修仙本为延寿，此前突破与寿元脱钩）
    try {
        var _lifeByTier = [50, 100, 200, 500, 1000, 2000, 5000, 10000, 30000];
        var _lifeYears = _lifeByTier[nextIndex] || 50;
        if (_lifeYears > 0 && typeof window.extendLifespan === 'function') {
            window.extendLifespan(_lifeYears, '境界突破·' + nextRealm);
        }
    } catch (eLife) {}
    if (typeof window.getQiMax === 'function') {
        charData.maxQi = window.getQiMax(nextIndex, 1);
        charData.qi = Math.min(charData.qi || 0, charData.maxQi);
    }

    // 异象文本
    const phenomena = BREAKTHROUGH_PHENOMENA[nextRealm] || BREAKTHROUGH_PHENOMENA['default'];
    const phenomenon = phenomena[Math.floor(Math.random() * phenomena.length)];

    // v27.13：突破异象进世界账（①-新增-1 瞒不住的事，走样的传话）——本城名气即时涨 + 外地挂走样在途传闻 + 本地写实 log。
    // 唯一挂点：此处（仪式成功结算）。小境界升层是常事、不挂账，免得传闻账被层数刷成流水；大境界跨境一辈子的稀罕事，才有异象可传。
    noteBreakthroughPhenomenon(nextRealm, nextIndex, phenomenon);

    // 境界质变效果
    let realmEffectHtml = '';
    if (typeof window.getRealmEffectDescription === 'function') {
        realmEffectHtml = `<p class="text-purple-400 text-sm mt-2">${window.getRealmEffectDescription(nextRealm)}</p>`;
    }

    modal.innerHTML = `
        <div class="bg-gray-800 border-2 border-yellow-500 rounded-xl p-8 max-w-lg w-full mx-4 text-center"
             style="box-shadow: 0 0 80px rgba(234,179,8,0.2), 0 0 40px rgba(255,215,0,0.1);">
            <!-- 成功图标 -->
            <div class="text-6xl mb-4" style="animation: float 3s ease-in-out infinite;">✨</div>

            <!-- 标题 -->
            <h2 class="text-3xl font-bold text-yellow-500 mb-2" style="text-shadow: 0 0 20px rgba(234,179,8,0.5);">
                🎉 突破成功！
            </h2>
            <p class="text-xl text-white mb-4">${breakthroughState.currentRealm} → <span class="text-yellow-400 font-bold">${nextRealm}</span></p>

            <!-- 异象 -->
            <div class="bg-gray-900/50 rounded-lg p-4 mb-4 border border-yellow-600/30">
                <p class="text-gray-300 italic">「${phenomenon}」</p>
                ${realmEffectHtml}
            </div>

            <!-- 属性变化 -->
            <div class="grid grid-cols-2 gap-3 mb-6">
                <div class="bg-gray-900/50 rounded p-3">
                    <div class="text-xs text-gray-400">真气上限</div>
                    <div class="text-lg text-blue-400 font-bold">${Math.round(charData.maxQi || 0)}</div>
                </div>
                <div class="bg-gray-900/50 rounded p-3">
                    <div class="text-xs text-gray-400">新境界</div>
                    <div class="text-lg text-yellow-400 font-bold">${nextRealm}·一層</div>
                </div>
            </div>

            <!-- 完成按钮 -->
            <button onclick="closeBreakthroughRitual()"
                class="px-8 py-3 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500
                       text-white font-bold rounded-xl text-lg transition-all transform hover:scale-105">
                🙏 感受新境界的力量
            </button>
        </div>
    `;

    // 推进时间
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(120, '境界突破');
    }

    // 更新UI
    if (window.updateCharacterStatus) window.updateCharacterStatus();
    if (window.showMessage) window.showMessage(`🎉 突破成功！当前境界：${nextRealm}期`, 'success');
    if (window.doAutoSave) window.doAutoSave('breakthrough');
    // v7.1 P0-2: 突破特效
    if (typeof window.showEffect === 'function') {
        try { window.showEffect('breakthrough'); } catch (e) {}
    }
    if (window.EventBus && typeof window.EventBus.emit === 'function') {
        window.EventBus.emit('cultivation:breakthrough', {
            fromRealm: oldRealm, toRealm: nextRealm,
            fromLayer: oldLayer, toLayer: 1, realmChanged: true,
            source: 'ritual'
        });
    }

    breakthroughState.inProgress = false;
}

// ============ 显示突破失败 ============
function showBreakthroughFailure() {
    const charData = window.currentCharData;
    if (!charData) return;

    const modal = document.querySelector('.breakthrough-ritual-modal');
    if (!modal) return;

    // 随机副作用。燃过机缘的那一关不再抽「修为倒退」——烧掉的就是这条。
    // 经脉受损 / 真气反噬 / 心神消耗照旧会来：烧掉的是命，不是伤。
    let pool = BREAKTHROUGH_SIDE_EFFECTS;
    if (breakthroughState._fortuneShield) {
        const kept = pool.filter(function (e) { return !(e.effect && e.effect.layerLoss); });
        if (kept.length > 0) pool = kept;
    }
    const sideEffect = pool[Math.floor(Math.random() * pool.length)];
    let sideEffectHtml = `<p class="text-red-400 text-sm">副作用：${sideEffect.name} — ${sideEffect.desc}</p>`;
    if (breakthroughState._fortuneShield) {
        sideEffectHtml += '<p class="text-xs text-purple-300 mt-1">🔥 机缘垫住了脚下——修为未退、层数未跌。</p>';
    }

    // 应用副作用
    applySideEffect(charData, sideEffect);

    modal.innerHTML = `
        <div class="bg-gray-800 border-2 border-red-600/50 rounded-xl p-8 max-w-lg w-full mx-4 text-center"
             style="box-shadow: 0 0 60px rgba(220,38,38,0.1);">
            <!-- 失败图标 -->
            <div class="text-6xl mb-4">💔</div>

            <!-- 标题 -->
            <h2 class="text-3xl font-bold text-red-500 mb-2">突破失败</h2>
            <p class="text-gray-400 mb-4">${breakthroughState.currentRealm} → ${breakthroughState.targetRealm}</p>

            <!-- 失败描述 -->
            <div class="bg-gray-900/50 rounded-lg p-4 mb-4 border border-red-600/30">
                <p class="text-gray-300 leading-relaxed">
                    经脉中的真气突然失控，疯狂冲击你的经脉……
                    你感到一阵剧痛，突破失败了。
                </p>
            </div>

            <!-- 副作用 -->
            <div class="bg-red-900/30 rounded-lg p-3 mb-4 border border-red-600/30">
                <h4 class="text-sm font-bold text-red-400 mb-1">⚠️ 突破副作用</h4>
                ${sideEffectHtml}
            </div>

            <!-- 恢复建议 -->
            <div class="text-xs text-gray-500 mb-6">
                <p>💡 建议：继续修炼提升实力，准备好突破材料后再尝试</p>
                <p>💡 可服用疗伤丹药加速恢复</p>
            </div>

            <!-- 继续修炼按钮 -->
            <button onclick="closeBreakthroughRitual()"
                class="px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600
                       text-white font-bold rounded-xl text-lg transition-all">
                📖 继续修炼
            </button>
        </div>
    `;

    // 推进时间
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(60, '突破失败');
    }

    if (window.showMessage) window.showMessage('突破失败，经脉受损……', 'warning');

    breakthroughState.inProgress = false;
}

// ============ 应用副作用 ============
function applySideEffect(charData, sideEffect) {
    const effect = sideEffect.effect;
    if (!effect) return;

    // 修为倒退（燃过机缘的那一关不跌境：即使抽到这条也不落账）
    if (effect.layerLoss && !breakthroughState._fortuneShield) {
        const newLayer = (charData.layer || 1) - effect.layerLoss;
        charData.layer = Math.max(1, newLayer);
    }

    // 临时状态使用标记（后续可由cultivation系统读取）
    if (!charData._debuffs) charData._debuffs = [];
    charData._debuffs.push({
        name: sideEffect.name,
        effect: effect,
        remainingDays: effect.duration || 3,
        appliedDay: window.gameTime?.currentDay || 1
    });
}

// ============ 关闭突破仪式 ============
function closeBreakthroughRitual() {
    const modal = document.querySelector('.breakthrough-ritual-modal');
    if (modal) modal.remove();
    breakthroughState.inProgress = false;

    // 更新UI
    if (window.updateCharacterStatus) window.updateCharacterStatus();
}

// ============ 替换原有的突破逻辑 ============
// 拦截 app.js 中的 performBreakthrough 函数
// 如果此文件加载在 app.js 之后，则覆盖 performBreakthrough
if (typeof window !== 'undefined') {
    // 保存原始函数
    const originalPerformBreakthrough = window.performBreakthrough;

    // 唯一突破路由：小境界走标准系统，大境界圆满才进入仪式。
    window.performBreakthrough = function() {
        const cd = window.currentCharData;
        // P0-5：残魂态禁止突破
        if (window.checkSoulBlock && window.checkSoulBlock('突破境界')) return;
        // v20.39 紊乱已极锁突破：真气逆行欲裂，强进必遭大劫——先化解，再精进
        if (typeof window.getQiDeviationBlocked === 'function') {
            var _qdBlock = window.getQiDeviationBlocked();
            if (_qdBlock) { if (window.showMessage) window.showMessage(_qdBlock, 'error'); return false; }
        }
        if (!cd) return false;
        const idx = typeof window.getRealmIndex === 'function' ? window.getRealmIndex(cd.realm) : -1;
        const maxLayers = (window.REALM_CONFIG && window.REALM_CONFIG.realms && window.REALM_CONFIG.realms[idx] && window.REALM_CONFIG.realms[idx].layers) || 9;
        if ((cd.layer || 1) < maxLayers && typeof window._performBreakthroughNew === 'function') {
            return window._performBreakthroughNew();
        }
        return startBreakthroughRitual();
    };

    // 导出
    window.startBreakthroughRitual = startBreakthroughRitual;
    window.closeBreakthroughRitual = closeBreakthroughRitual;
    window.breakthroughState = breakthroughState;
    window.BREAKTHROUGH_PHASES = BREAKTHROUGH_PHASES;
    window.BREAKTHROUGH_STAGES = BREAKTHROUGH_STAGES;
    window.BREAKTHROUGH_PHENOMENA = BREAKTHROUGH_PHENOMENA;
    window.BREAKTHROUGH_REALM_ORDER = BREAKTHROUGH_REALM_ORDER;
    window.BREAKTHROUGH_MATERIALS = BREAKTHROUGH_MATERIALS;
    window.getBreakthroughPillsForRealm = getBreakthroughPillsForRealm;
    window.getBreakthroughRitualBaseRate = getBreakthroughRitualBaseRate;
}

// ============ v27.13：突破异象进世界账（①-新增-1 瞒不住的事，走样的传话） ============
// 只被 showBreakthroughResult 调用一次（唯一挂点，别处不重复记账）。
// 两笔账各走各的正门，互不代笔：
//   ① 名气走 noteFameChange——同城当日立知、外城随商旅按 2/7 天到站。
//      量级 = 8 + 目标境界序×5，夹逼 [12, 50]：一趟悬赏 fame 2~10（bounty-board count/2）、
//      说书 1~2 的尺度下，跨境突破是一辈子的动静——筑基 13 起、渡劫 48 顶，境界越高动静越大；
//      全程 ≥8，必过世界账簿「大名自动成谣」的线（名号一条、异象一条，各说各的，不算重复记账）。
//   ② 异象故事走 noteRumor——本地知真相（modal 异象 + 下方写实 log），外地听玄乎版（传闻越传越玄）。
//      fromCity 传当前城：让「同城立知」落在真城，本城茶馆「打听」才翻得到这一条。
// WorldLedger 缺席整段跳过：突破零影响（函数顶部 return，try/catch 兜底）。
function noteBreakthroughPhenomenon(nextRealm, nextIndex, phenomenon) {
    try {
        var WL = window.WorldLedger;
        if (!WL || typeof WL.noteFameChange !== 'function' || typeof WL.noteRumor !== 'function') return;
        // ① 本城名气即时涨（正门记账，只记账不动属性 fame——异象的名声走世界账簿）
        WL.noteFameChange(Math.max(12, Math.min(50, 8 + nextIndex * 5)));
        // ② 外地听玄乎版（同一笔 noteRumor 也让本地账立知——本城茶客说的已是走样版，当事人自己知道真相）
        var from = '';
        try {
            if (window.locationSystem && typeof window.locationSystem.getCurrentLocation === 'function') from = window.locationSystem.getCurrentLocation() || '';
        } catch (e0) {}
        if (!from) from = (window.currentCharData && window.currentCharData.location) || '';
        // 走样夸张版：本地是雷云压城/紫气东来的实底，出了城就成了雷滚三里、星斗三亮
        var TALL = {
            '筑基': '「{c}」昨夜雷声滚了三里地，半空金光炸开——茶客赌咒说是有人筑基成了仙，也有人说天狗过境。',
            '金丹': '「{c}」城外七彩霞光罩了半宿，老人们都说是金丹大成、霞光万里——小道消息，信不信由你。',
            '元婴': '「{c}」那晚有人瞧见天上坐着个小人影，一坐一宿——茶馆里吵翻了，都说是元婴出世的吉兆。',
            '化神': '「{c}」一夜之间满城的鸡都不叫——说是有位化神前辈神游过境，连畜生都噤了声。',
            '炼虚': '「{c}」有人瞧见一口活人凭空散作青烟、又原样聚了回来——炼虚合道，凡胎换仙骨，错不了！',
            '合体': '「{c}」那天地动了一震、井水倒流了半炷香——合体期大能的天地共鸣，老辈人说的，不会假。',
            '大乘': '「{c}」夜里满天星斗齐齐亮了三亮，紫气东来三百里——大乘老祖降世了！',
            '渡劫': '「{c}」九道天雷劈了一宿，劈完天上还落仙乐——有人渡劫飞升，就在「{c}」！',
            'default': '「{c}」那夜天光异动，雷声滚了三里地——有大人物破了境界。'
        };
        var line = String(TALL[nextRealm] || TALL['default']).replace('{c}', from || '此地');
        WL.noteRumor(line, 'breakthrough', from || undefined);
        // 本地写实：异象实底进日志——「本地知真相」的那一半
        if (phenomenon && window.gameLog && typeof window.gameLog.add === 'function') {
            window.gameLog.add('✨ ' + phenomenon + '——异象瞒不住：当夜满城皆见，明日准上茶桌。', 'info');
        }
    } catch (e) {
        console.warn('[静默失败] js/cultivation/breakthrough-ritual.js · noteBreakthroughPhenomenon：异象没进世界账——突破照旧', e && e.message);
    }
}