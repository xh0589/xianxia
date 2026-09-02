// ==================== breakthrough-system.js - 境界突破系统（v9.7） ====================
// 真气/真元分离：真气用于战斗，真元是突破修为
// 历练值：只增不减，代表阅历与战斗经验
// 依赖：REALM_CONFIG（data.js）

// ============ 获取函数 ============

// 获取当前境界索引
function getRealmIndex(realmName) {
    if (!window.REALM_CONFIG) return 0;
    return window.REALM_CONFIG.realms.findIndex(r => r.name === realmName);
}

// 获取当前层突破所需真元
function getEssenceRequired(realmIndex, layer) {
    if (!window.REALM_CONFIG) return 30;
    const realm = window.REALM_CONFIG.realms[realmIndex];
    if (!realm) return 30;
    const multiplier = window.REALM_CONFIG.layerMultipliers[layer - 1] || 1.0;
    return Math.round(realm.essenceBase * multiplier);
}

// 获取当前层突破所需历练
function getTemperingRequired(realmIndex, layer) {
    if (!window.REALM_CONFIG) return 5;
    const realm = window.REALM_CONFIG.realms[realmIndex];
    if (!realm) return 5;
    const multiplier = window.REALM_CONFIG.layerMultipliers[layer - 1] || 1.0;
    return Math.round(realm.temperingBase * multiplier);
}

// 获取当前层真气上限
function getQiMax(realmIndex, layer) {
    if (!window.REALM_CONFIG) return 50;
    const realm = window.REALM_CONFIG.realms[realmIndex];
    if (!realm) return 50;
    const multiplier = 1 + (layer - 1) * 0.1;
    return Math.round(realm.qiBase * multiplier);
}

// 获取各境界真元基础获取量（用于打坐修炼）
function getEssenceGainByRealm(realmIndex) {
    const gains = [5, 8, 15, 30, 60, 120, 250, 500, 1000];
    return gains[realmIndex] || 5;
}

// 获取真气恢复量（由内功属性决定）
function getQiRecoveryAmount() {
    if (!window.currentCharData) return 5;
    const internalSkill = window.currentCharData.combatSkills?.['内功'] || 0;
    return 5 + Math.floor(internalSkill / 10);
}

// 获取灵根修炼加成（用于真元获取）
function getRootCultivationBonus() {
    if (!window.currentCharData) return 1.0;
    const roots = window.currentCharData.spiritualRoots;
    if (!roots) return 1.0;
    const vals = [roots.metal || 0, roots.wood || 0, roots.water || 0, roots.fire || 0, roots.earth || 0];
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    return 0.5 + avg / 100;
}

// ============ 历练值系统 ============

// 获取历练值
function getTempering() {
    return window.currentCharData?.tempering || 0;
}

// 增加历练值（只增不减）
function addTempering(amount) {
    if (!window.currentCharData) return;
    window.currentCharData.tempering = (window.currentCharData.tempering || 0) + amount;
    if (window.updateCharacterStatus) window.updateCharacterStatus();
}

// ============ 真元系统 ============

// 增加真元
function addEssence(amount) {
    if (!window.currentCharData) return;
    window.currentCharData.essence = (window.currentCharData.essence || 0) + amount;
    if (window.updateCharacterStatus) window.updateCharacterStatus();
}

// ============ 突破成功率计算 ============

// 计算基础成功率（由历练决定）
function getBaseSuccessRate(tempering, requiredTempering) {
    if (requiredTempering <= 0) return 0.6;
    const ratio = Math.min(1, tempering / requiredTempering);
    if (ratio < 0.3) return 0.20;
    if (ratio < 0.5) return 0.30;
    if (ratio < 0.7) return 0.40;
    if (ratio < 0.9) return 0.50;
    return 0.60;
}

// 计算最终成功率
function calculateBreakthroughRate(charData, pills) {
    const realmIndex = getRealmIndex(charData.realm);
    const layer = charData.layer || 1;
    const tempering = charData.tempering || 0;
    const requiredTempering = getTemperingRequired(realmIndex, layer);
    const failures = charData._failedBreakthroughs || 0;

    // 1. 基础成功率
    let rate = getBaseSuccessRate(tempering, requiredTempering);

    // 2. 丹药加成
    const pillBonuses = {
        'peiyuan_dan': 0.10,
        'zhuji_dan': 0.12,
        'ningyuan_dan': 0.15,
        'jieying_dan': 0.18,
        'huashen_dan': 0.20,
        'pojing_dan': 0.10,
        'wudao_dan': 0.05 + Math.random() * 0.10  // 5~15%随机
    };
    if (pills) {
        for (const pill of pills) {
            rate += (pillBonuses[pill] || 0);
        }
    }

    // 3. 心魔修正
    rate += (charData._heartDemonBonus || 0);

    // 4. 失败补偿（每次失败+5%，最多+15%）
    rate += Math.min(0.15, failures * 0.05);

    // 5. 境界惩罚（高境界突破更难）
    const realmPenalty = 1 - (realmIndex * 0.03);
    rate *= realmPenalty;

    // 封顶
    return Math.min(0.95, Math.max(0.05, rate));
}

// ============ 执行突破 ============

function performBreakthrough() {
    if (!window.currentCharData) {
        if (window.showMessage) window.showMessage('请先创建角色', 'warning');
        return false;
    }

    const charData = window.currentCharData;
    const realmIndex = getRealmIndex(charData.realm);
    const layer = charData.layer || 1;
    const oldRealm = charData.realm;
    const oldLayer = layer;
    const essence = charData.essence || 0;
    const tempering = charData.tempering || 0;
    const qi = charData.qi || 0;

    // 检查是否已达最高境界
    if (realmIndex >= window.REALM_CONFIG.realms.length - 1 && layer >= 9) {
        if (window.showMessage) window.showMessage('已达最高境界，无法继续突破', 'warning');
        return false;
    }

    // 获取需求值
    const essenceRequired = getEssenceRequired(realmIndex, layer);
    const temperingRequired = getTemperingRequired(realmIndex, layer);
    const qiRequired = getQiMax(realmIndex, layer) * 0.8;

    // 条件检查
    if (essence < essenceRequired) {
        if (window.showMessage) window.showMessage('真元不足！需要 ' + essenceRequired + '，当前 ' + essence, 'warning');
        return false;
    }
    if (tempering < temperingRequired) {
        if (window.showMessage) window.showMessage('历练不足！需要 ' + temperingRequired + '，当前 ' + tempering, 'warning');
        return false;
    }
    if (qi < qiRequired) {
        if (window.showMessage) window.showMessage('真气不足！需要至少 ' + Math.round(qiRequired) + '（当前 ' + Math.round(qi) + '）', 'warning');
        return false;
    }

    // 计算成功率
    const rate = calculateBreakthroughRate(charData, []);
    const ratePercent = Math.round(rate * 100);

    // 显示突破确认
    if (!confirm('突破 ' + charData.realm + ' 第 ' + layer + ' 层？\n成功率：' + ratePercent + '%\n失败惩罚：真元损失 ' + Math.round((1 - rate) * 100) + '%，真气溃散')) {
        return false;
    }

    // 执行突破判定
    const roll = Math.random();
    const success = roll < rate;

    if (success) {
        // === 突破成功 ===
        charData._failedBreakthroughs = 0;
        charData._heartDemonBonus = 0;

        // 真元清空
        charData.essence = 0;

        // 层数+1
        const newLayer = layer + 1;
        const maxLayers = window.REALM_CONFIG.realms[realmIndex]?.layers || 9;
        if (newLayer > maxLayers) {
            // 境界提升
            const nextRealm = window.REALM_CONFIG.realms[realmIndex + 1];
            if (!nextRealm) {
                if (window.showMessage) window.showMessage('已达最高境界！', 'warning');
                return false;
            }
            charData.realm = nextRealm.name;
            charData.layer = 1;
            const newMaxQi = getQiMax(realmIndex + 1, 1);
            charData.maxQi = newMaxQi;
            charData.qi = Math.min(charData.qi || 0, newMaxQi);
            if (window.showMessage) window.showMessage('🎉 突破成功！晋升至 ' + nextRealm.name + ' 一层！', 'success');
        } else {
            charData.layer = newLayer;
            const newMaxQi = getQiMax(realmIndex, newLayer);
            charData.maxQi = newMaxQi;
            charData.qi = Math.min(charData.qi || 0, newMaxQi);
            const layerNames = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
            if (window.showMessage) window.showMessage('🎉 突破成功！' + charData.realm + ' ' + layerNames[newLayer] + '层', 'success');
        }

        // 真气不变，真元已清空，历练不变
        if (window.updateCharacterStatus) window.updateCharacterStatus();
        if (window.EventBus && typeof window.EventBus.emit === 'function') {
            window.EventBus.emit('cultivation:breakthrough', {
                fromRealm: oldRealm, toRealm: charData.realm,
                fromLayer: oldLayer, toLayer: charData.layer,
                realmChanged: oldRealm !== charData.realm
            });
        }
        return true;
    } else {
        // === 突破失败 ===
        charData._failedBreakthroughs = (charData._failedBreakthroughs || 0) + 1;

        // 真元损失 = 当前真元 × (1 - 成功率)
        const lossRatio = Math.min(0.95, Math.max(0.05, 1 - rate));
        const lostEssence = Math.floor((charData.essence || 0) * lossRatio);
        charData.essence = Math.max(0, (charData.essence || 0) - lostEssence);

        // 真气溃散 = 损失 50%
        const qiLoss = Math.floor((charData.qi || 0) * 0.5);
        charData.qi = Math.max(0, (charData.qi || 0) - qiLoss);

        // 历练+3（不放弃的奖励）
        charData.tempering = (charData.tempering || 0) + 3;

        if (window.showMessage) window.showMessage('😰 突破失败！真元损失 ' + Math.round(lossRatio * 100) + '%（' + lostEssence + '），真气溃散 ' + qiLoss + '，历练+3', 'error');

        // 心魔触发概率（历练不足50%时触发）
        if (charData.tempering < temperingRequired * 0.5) {
            if (Math.random() < 0.3) {
                if (typeof triggerHeartDemon === 'function') {
                    triggerHeartDemon();
                }
            }
        }

        if (window.updateCharacterStatus) window.updateCharacterStatus();
        return false;
    }
}

// ============ 修炼真气与真元 ============

// 打坐修炼（获取真气+真元）
function cultivateQi() {
    if (!window.currentCharData) {
        if (window.showMessage) window.showMessage('请先创建角色', 'warning');
        return false;
    }

    const charData = window.currentCharData;
    const energy = charData.energy || 100;
    if (energy < 10) {
        if (window.showMessage) window.showMessage('精力不足！', 'error');
        return false;
    }
    charData.energy = energy - 10;

    // 真元获得
    const realmIndex = getRealmIndex(charData.realm);
    const baseGain = getEssenceGainByRealm(realmIndex);
    // 0.2.7：改用单元素根倍率（主修功法元素），与 cultivationMeditate 一致——
    // 此前用 getRootCultivationBonus()（平均根），金灵根用金系/水系功法产出一样，灵根选型失效
    var _roots = charData.spiritualRoots;
    var _mainEl = (typeof window._getMainTechniqueElement === 'function') ? window._getMainTechniqueElement() : 'neutral';
    var _rootMul = (typeof window.getRootSpeedMultiplier === 'function') ? window.getRootSpeedMultiplier(_roots, _mainEl) : 1.0;
    const essenceGain = Math.floor(baseGain * _rootMul);
    charData.essence = (charData.essence || 0) + essenceGain;

    // 真气恢复（内功决定）
    const qiRecovery = getQiRecoveryAmount();
    charData.qi = Math.min(charData.maxQi || 100, (charData.qi || 0) + qiRecovery);

    if (window.showMessage) window.showMessage('修炼获得真元 +' + essenceGain + '，真气 +' + qiRecovery, 'success');

    // 时间推进
    if (window.timeSystem?.advanceTime) {
        window.timeSystem.advanceTime(10, '修炼');
    }

    if (window.updateCharacterStatus) window.updateCharacterStatus();
    return true;
}

// ============ 导出 ============
window.getRealmIndex = getRealmIndex;
window.getEssenceRequired = getEssenceRequired;
window.getTemperingRequired = getTemperingRequired;
window.getQiMax = getQiMax;
window.getEssenceGainByRealm = getEssenceGainByRealm;
window.getQiRecoveryAmount = getQiRecoveryAmount;
window.getRootCultivationBonus = getRootCultivationBonus;
window.getTempering = getTempering;
window.addTempering = addTempering;
window.addEssence = addEssence;
window.getBaseSuccessRate = getBaseSuccessRate;
window.calculateBreakthroughRate = calculateBreakthroughRate;
// 使用不同名称导出，避免被 app.js 旧代码覆盖
window._performBreakthroughNew = performBreakthrough;
window.cultivateQi = cultivateQi;
// 公共 performBreakthrough 由 breakthrough-ritual.js 统一路由。