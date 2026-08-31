// ==================== battle-injuries.js (v4.2 - 关键伤标签系统 + 仙侠修为接入) ====================
// 基于 GPT机体建议.txt 实施的3项改进：
// 1. 关键伤标签系统（CRITICAL_INJURIES 配置表 + 多因素概率）
// 2. 不同危急时间（不同关键伤有不同救治窗口）
// 3. 仙侠修为接入（境界影响生理参数）
// 依赖：physiology-config.js (CRITICAL_INJURIES, CRITICAL_EFFECTS)

// ============================================================
//  关键伤判定：是否检查关键伤
// ============================================================

/**
 * 判断是否需要检查关键伤
 * 只在重伤情况下触发，避免每一次轻伤都概率判定
 * 触发条件：深度>=3 / 单次破坏>=25%完整度 / 结构损伤>=30
 */
function shouldCheckCriticalInjury(entity, wound, damageAmount, partMod) {
    const part = entity.physiology.parts[wound.partId];
    if (!part) return false;

    const maxDur = entity.maxDurabilities[wound.partId] || 100;
    const integrityLossPercent = (damageAmount / maxDur) * 100;

    return (
        wound.depth >= 3 ||
        integrityLossPercent >= 25 ||
        (wound.structuralDamage || 0) >= 30
    );
}

/**
 * 获取关键伤概率（多因素决定）
 * 限制最高70%，防止单次随机无条件死亡
 */
function getCriticalChance(entity, wound, damageAmount) {
    const part = entity.physiology.parts[wound.partId];
    if (!part) return 0;

    const maxDur = entity.maxDurabilities[wound.partId] || 100;
    const integrityLoss = damageAmount / maxDur;

    let chance = 0;
    chance += Math.max(0, (wound.depth || 0) - 2) * 0.12;    // depth>=3才贡献
    chance += integrityLoss * 0.45;                            // 完整度损失
    chance += (wound.structuralDamage || 0) / 100 * 0.2;      // 结构损伤
    chance += (wound.nerveDamage || 0) / 100 * 0.15;           // 神经冲击

    // 部位特殊加成
    if (wound.partId === 'brain') chance += 0.1;
    if (wound.partId === 'neck') chance += 0.08;
    if (wound.partId === 'chest') chance += 0.05;

    return Math.min(0.7, Math.max(0, chance));
}

/**
 * 判断是否可以立即致命
 * 只有深度>=4 + 极高结构损伤 + 关键部位才可能
 */
function canCauseImmediateDeath(wound, damageAmount) {
    const maxDur = 100;
    const integrityLoss = damageAmount / maxDur;
    return (
        wound.depth >= 4 &&
        (wound.structuralDamage || 0) >= 40 &&
        integrityLoss >= 0.3 &&
        (wound.partId === 'brain' || wound.partId === 'neck')
    );
}

// ============================================================
//  关键伤解决函数
// ============================================================

/**
 * 解决关键伤：根据部位+伤害类型，查找关键伤配置表
 * 概率触发，产生对应的关键伤效果
 */
function resolveCriticalInjury(entity, wound, partId, damageType) {
    const phys = entity.physiology;
    if (!phys) return;

    const criticalInjuries = window.CRITICAL_INJURIES;
    const criticalEffects = window.CRITICAL_EFFECTS;
    if (!criticalInjuries || !criticalEffects) {
        // 回退到旧逻辑：depth>=4 概率进入危急
        if (wound.depth >= 4) {
            const chance = (wound.depth - 3) * 0.3;
            if (Math.random() < chance) {
                enterCriticalState(entity, partId + '_perforation');
            }
        }
        return;
    }

    // 查找该部位+伤害类型对应的关键伤列表
    const partInjuries = criticalInjuries[partId];
    if (!partInjuries) return;

    const injuryPool = partInjuries[damageType];
    if (!injuryPool || injuryPool.length === 0) return;

    // 概率判定
    const chance = getCriticalChance(entity, wound, wound.structuralDamage || 30);
    if (Math.random() >= chance) return;

    // 从候选池中加权选择（优先选择更严重的类型）
    const chosen = weightedPickCriticalInjury(injuryPool, criticalEffects);

    // 应用关键伤效果
    const effect = criticalEffects[chosen];
    if (!effect) return;

    // 记录关键伤标签（用于UI显示）
    if (!phys.criticalInjuries) {
        phys.criticalInjuries = {};
    }
    phys.criticalInjuries[chosen] = (phys.criticalInjuries[chosen] || 0) + 1;

    // 应用效果
    switch (effect.outcome) {
        case 'death': {
            // 即时致命（极少情况）
            entity.isAlive = false;
            if (window.gameLog && window.gameLog.add) {
                const labels = window.CRITICAL_CAUSE_LABELS || {};
                const label = labels[chosen] || chosen;
                window.gameLog.add('\u{1F480} 致命伤：' + label + '！', 'error');
            }
            return;
        }
        case 'critical': {
            // 进入危急，使用自定义回合数（v12.4 兜底按难度读取：宽松50/标准35/凶险20）
            const rounds = effect.criticalRounds
                || (typeof window.getDifficultyParam === 'function' ? window.getDifficultyParam('criticalTurns') : 0)
                || 50;
            // 受修为影响（延长危急时间）
            const cultMod = getCultivationModifiers(entity);
            const adjustedRounds = Math.round(rounds * (1 / (cultMod.criticalTimeMultiplier || 1)));
            const adjustedMinutes = (adjustedRounds * 6) / 60; // 每回合6秒 -> 分钟

            enterCriticalStateWithTimer(entity, chosen, adjustedMinutes);

            // 附加效果
            if (effect.breathingLoss) {
                phys.breathing = Math.max(0, (phys.breathing || 100) - effect.breathingLoss);
            }
            if (effect.circulationLoss) {
                phys.circulation = Math.max(0, (phys.circulation || 100) - effect.circulationLoss);
            }
            if (effect.internalBleed) {
                // 增加内出血
                if (phys.wounds && phys.wounds.length > 0) {
                    const lastWound = phys.wounds[phys.wounds.length - 1];
                    if (lastWound) {
                        lastWound.internalBleedRate = Math.min(100, (lastWound.internalBleedRate || 0) + effect.internalBleed);
                    }
                }
            }
            if (effect.consciousnessCap !== undefined) {
                phys.consciousness = Math.min(phys.consciousness || 100, effect.consciousnessCap);
            }
            return;
        }
        case 'function': {
            // 功能损伤（不危急，但降低效率）
            if (effect.breathingLoss) {
                phys.breathing = Math.max(0, (phys.breathing || 100) - effect.breathingLoss * 0.5);
            }
            if (effect.spinalEffect) {
                // 脊髓损伤：标记
                if (!phys.physiologyFlags) phys.physiologyFlags = {};
                phys.physiologyFlags.spinalDamage = true;
            }
            if (effect.internalBleed) {
                if (phys.wounds && phys.wounds.length > 0) {
                    const lastWound = phys.wounds[phys.wounds.length - 1];
                    if (lastWound) {
                        lastWound.internalBleedRate = Math.min(100, (lastWound.internalBleedRate || 0) + effect.internalBleed);
                    }
                }
            }
            // 日志提示
            if (window.gameLog && window.gameLog.add) {
                const labels = window.CRITICAL_CAUSE_LABELS || {};
                const label = labels[chosen] || chosen;
                window.gameLog.add('\u26A0\uFE0F 关键伤：' + label + '（功能受损）', 'warning');
            }
            return;
        }
    }
}

/**
 * 加权选择关键伤类型（优先选择更严重的）
 */
function weightedPickCriticalInjury(pool, effects) {
    if (!pool || pool.length === 0) return null;
    if (pool.length === 1) return pool[0];

    // 为每个选项分配权重：death > critical > function
    const weights = pool.map(function(injury) {
        const effect = effects[injury];
        if (!effect) return 1;
        switch (effect.outcome) {
            case 'death': return 5;
            case 'critical': return 3;
            case 'function': return 1;
            default: return 1;
        }
    });

    const totalWeight = weights.reduce(function(a, b) { return a + b; }, 0);
    let roll = Math.random() * totalWeight;
    for (let i = 0; i < pool.length; i++) {
        roll -= weights[i];
        if (roll <= 0) return pool[i];
    }
    return pool[pool.length - 1];
}

/**
 * 带自定义计时器的进入危急（不同原因不同救治窗口）
 */
function enterCriticalStateWithTimer(entity, cause, minutes) {
    if (!entity || !entity.physiology) return false;
    const phys = entity.physiology;
    if (phys.criticalTimer >= 0) {
        if (cause && !phys.criticalCause) phys.criticalCause = cause;
        return false;
    }
    phys.criticalTimer = 0;
    phys.criticalCause = cause || 'unknown';
    // 存储自定义危急时间（分钟）- 转换为分钟单位（v12.4 兜底按难度读取）
    var fallbackMinutes = (typeof window.getDifficultyParam === 'function')
        ? (window.getDifficultyParam('criticalTurns') || 50) * 0.1 : 5;
    phys.criticalRounds = Math.max(10, Math.round((minutes || fallbackMinutes) / 0.1));
    phys.consciousness = 0;
    phys.state = 'unconscious';
    phys.isUnconscious = true;
    if (window.gameLog && window.gameLog.add) {
        const labels = window.CRITICAL_CAUSE_LABELS || {};
        const label = labels[cause] || cause || '未知';
        const totalSecs = Math.round((minutes || 5) * 60);
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        window.gameLog.add('\u26A0\uFE0F 危急：' + label + '！剩余约 ' + mins + '分' + (secs < 10 ? '0' : '') + secs + '秒，需立即救治', 'error');
    }
    return true;
}

// ============================================================
//  仙侠修为接入系统（GPT建议实施）
// ============================================================

/**
 * 获取修为对生理系统的修正系数
 * 境界越高，肉身越强，危急时间越长，出血越慢
 * 炼体 -> 增加完整度 / 龟息功 -> 减缓缺氧 / 生机 -> 延长危急 / 封穴 -> 降出血
 */
function getCultivationModifiers(entity) {
    const modifiers = {
        integrityMultiplier: 1.0,      // 完整度倍率
        bleedRateMultiplier: 1.0,      // 出血速率倍率
        oxygenDebtMultiplier: 1.0,     // 缺氧累积倍率
        criticalTimeMultiplier: 1.0,   // 危急时间倍率（>1=更长）
        painResistance: 0,             // 疼痛抵抗
    };

    if (!entity) return modifiers;

    // 尝试从玩家角色数据获取境界
    let totalLevel = 0; // 0-81
    try {
        if (window.currentCharData && entity.type === 'player') {
            const realm = window.currentCharData.realm || '炼气';
            const layer = window.currentCharData.layer || 1;
            const realmOrder = ['炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'];
            const realmIndex = Math.max(0, realmOrder.indexOf(realm));
            totalLevel = realmIndex * 9 + (layer || 1);
        } else if (entity.attrs && entity.attrs.realmLevel !== undefined) {
            totalLevel = (entity.attrs.realmLevel || 0) * 9 + (entity.attrs.realmLayer || 1);
        }
    } catch (e) {
        // 默认值
    }

    // 炼体 -> 完整度倍率（每层+0.15%）
    modifiers.integrityMultiplier = 1 + totalLevel * 0.0015;

    // 修为 -> 出血速率降低（每层-0.08%，最低20%）
    modifiers.bleedRateMultiplier = Math.max(0.2, 1 - totalLevel * 0.008);

    // 龟息功 -> 缺氧累积减缓（每层-0.1%，最低15%）
    modifiers.oxygenDebtMultiplier = Math.max(0.15, 1 - totalLevel * 0.01);

    // 生机功法 -> 危急时间延长（每层+0.25%）
    modifiers.criticalTimeMultiplier = 1 + totalLevel * 0.0025;

    // 意志 -> 疼痛抵抗（每层+0.5）
    const willpower = (entity.attrs && entity.attrs.willpower) || 10;
    modifiers.painResistance = willpower * 0.5;

    return modifiers;
}

/**
 * 将修为修正应用到生理系统（在processPhysiology中调用）
 */
function applyCultivationToPhysiology(entity) {
    if (!entity || !entity.physiology) return;
    const phys = entity.physiology;
    const mod = getCultivationModifiers(entity);
    // 存储修正系数供其他函数使用
    phys._cultModifiers = mod;
}

// ============================================================
//  导出到 window
// ============================================================
window.shouldCheckCriticalInjury = shouldCheckCriticalInjury;
window.getCriticalChance = getCriticalChance;
window.canCauseImmediateDeath = canCauseImmediateDeath;
window.resolveCriticalInjury = resolveCriticalInjury;
window.weightedPickCriticalInjury = weightedPickCriticalInjury;
window.enterCriticalStateWithTimer = enterCriticalStateWithTimer;
window.getCultivationModifiers = getCultivationModifiers;
window.applyCultivationToPhysiology = applyCultivationToPhysiology;