// ==================== cultivation.js - 功法修炼系统（v6.2 修仙深度扩展） ====================
// 功法熟练度、突破、领悟、境界质变、功法组合、心魔系统

// ============ 功法熟练度等级 ============
const PROFICIENCY_LEVELS = [
    { id: 0, name: '初窥门径', multiplier: 1.0, qiCost: 0 },
    { id: 1, name: '略有小成', multiplier: 1.2, qiCost: 5 },
    { id: 2, name: '炉火纯青', multiplier: 1.5, qiCost: 10 },
    { id: 3, name: '登堂入室', multiplier: 1.8, qiCost: 20 },
    { id: 4, name: '出神入化', multiplier: 2.2, qiCost: 30 },
    { id: 5, name: '炉火纯青', multiplier: 2.5, qiCost: 50 },
    { id: 6, name: '融会贯通', multiplier: 3.0, qiCost: 80 },
    { id: 7, name: '登峰造极', multiplier: 3.5, qiCost: 120 },
    { id: 8, name: '出神入化', multiplier: 4.0, qiCost: 180 },
    { id: 9, name: '返璞归真', multiplier: 5.0, qiCost: 300 }
];

// ============ 功法熟练度5大阶段 ============
const PROFICIENCY_MASTERIES = [
    { id: 1, name: '入门', icon: '🌱', color: 'text-gray-400', levels: [0, 1], unlockEffect: '基础效果激活，修炼效率+10%' },
    { id: 2, name: '熟练', icon: '🌿', color: 'text-green-400', levels: [2, 3], unlockEffect: '新增连击效果，攻击+15%' },
    { id: 3, name: '精通', icon: '🔥', color: 'text-blue-400', levels: [4, 5], unlockEffect: '新增附加效果' },
    { id: 4, name: '大成', icon: '⭐', color: 'text-purple-400', levels: [6, 7], unlockEffect: '范围效果扩大，属性+25%' },
    { id: 5, name: '化境', icon: '👑', color: 'text-red-400', levels: [8, 9], unlockEffect: '终极奥义解锁，全属性+50%' }
];
function getProficiencyMastery(skillId) {
    var info = proficiencyData[skillId];
    if (!info) return PROFICIENCY_MASTERIES[0];
    var level = info.level || 0;
    for (var i = PROFICIENCY_MASTERIES.length - 1; i >= 0; i--) {
        if (level >= PROFICIENCY_MASTERIES[i].levels[0]) return PROFICIENCY_MASTERIES[i];
    }
    return PROFICIENCY_MASTERIES[0];
}
function getMasteryProgress(skillId) {
    var info = getProficiencyInfo(skillId);
    var level = info.level || 0;
    var mastery = getProficiencyMastery(skillId);
    var stageStart = mastery.levels[0];
    var stageEnd = mastery.levels[1] || mastery.levels[0];
    var stageRange = stageEnd - stageStart + 1;
    var posInStage = level - stageStart;
    return Math.min(100, Math.floor((posInStage + 1) / stageRange * 100));
}
function triggerTrainingInsight(skillId) {
    if (Math.random() < 0.05) {
        var texts = ['你突然领悟了这门功法的精髓所在！', '天地灵气与你共鸣，你感到功法境界有所提升。', '你回忆起师父的教诲，对功法有了新的理解。'];
        var text = texts[Math.floor(Math.random() * texts.length)];
        if (window.showMessage) window.showMessage('💡 ' + text, 'success');
        if (!window._trainingInsightBonus) window._trainingInsightBonus = {};
        window._trainingInsightBonus[skillId] = { bonus: 1.5, day: window.gameTime ? window.gameTime.currentDay : 1 };
        return true;
    }
    return false;
}

// ============ 功法熟练度数据 ============
let proficiencyData = {}; // { skillId: { level: 0, exp: 0, breakthroughAttempts: 0 } }

// ============ 功法领悟系统 ============
let insights = []; // 已获得的领悟
let insightPoints = 0; // 领悟点数（v36 起仅作无角色时的兜底，真源在角色数据 insightPoints 字段）

// ============ 领悟类型 ============
const INSIGHT_TYPES = {
    ATTACK: 'attack',        // 攻击领悟
    DEFENSE: 'defense',      // 防御领悟
    SPEED: 'speed',          // 速度领悟
    CRIT: 'crit',            // 暴击领悟
    DODGE: 'dodge',          // 闪避领悟
    RECOVERY: 'recovery',    // 恢复领悟
    SPECIAL: 'special'       // 特殊领悟
};

// ============ 领悟效果 ============
const insightEffects = {
    ATTACK: [
        { name: '剑意', desc: '剑法伤害+5%', effect: { sword_attack: 5 } },
        { name: '刀气', desc: '刀法伤害+8%', effect: { dao_attack: 8 } },
        { name: '拳劲', desc: '拳掌伤害+10%', effect: { fist_attack: 10 } }
    ],
    DEFENSE: [
        { name: '金钟', desc: '防御+5%', effect: { defense: 5 } },
        { name: '铁布', desc: '防御+8%', effect: { defense: 8 } }
    ],
    SPEED: [
        { name: '如风', desc: '速度+10%', effect: { speed: 10 } },
        { name: '似电', desc: '速度+15%', effect: { speed: 15 } }
    ],
    CRIT: [
        { name: '致命', desc: '暴击率+3%', effect: { crit_rate: 3 } },
        { name: '狂暴', desc: '暴击伤害+20%', effect: { crit_damage: 20 } }
    ],
    DODGE: [
        { name: '幻影', desc: '闪避率+5%', effect: { dodge: 5 } },
        { name: '无形', desc: '闪避率+8%', effect: { dodge: 8 } }
    ],
    RECOVERY: [
        { name: '生生不息', desc: '真气恢复+10%', effect: { qi_regen: 10 } },
        { name: '枯木逢春', desc: '生命恢复+15%', effect: { health_regen: 15 } }
    ],
    SPECIAL: [
        { name: '悟道', desc: '修炼速度+20%', effect: { cultivation_speed: 20 } },
        { name: '明心', desc: '突破成功率+10%', effect: { breakthrough_bonus: 10 } }
    ]
};

// ============ 初始化熟练度数据 ============
function initProficiencyData() {
    const saved = localStorage.getItem('xianxia_proficiency');
    if (saved) {
        try {
            proficiencyData = JSON.parse(saved);
        } catch (e) {
            proficiencyData = {};
        }
    }
}

// ============ 保存熟练度数据 ============
function saveProficiencyData() {
    window.saveToStorage('xianxia_proficiency', JSON.stringify(proficiencyData));
}

// ============ 获取功法熟练度信息 ============
function getProficiencyInfo(skillId) {
    if (!proficiencyData[skillId]) {
        proficiencyData[skillId] = { level: 0, exp: 0, breakthroughAttempts: 0 };
    }
    return proficiencyData[skillId];
}

// ============ 增加功法经验 ============
function addProficiencyExp(skillId, expAmount) {
    // v9.8：学识提升熟练度获取 1 + 学识/500
    try {
        var knowledge = (typeof window.getLifeSkill === 'function') ? window.getLifeSkill('学识') : 0;
        if (knowledge > 0) expAmount = Math.floor(expAmount * (1 + knowledge / 500));
    } catch (e) {}
    const info = getProficiencyInfo(skillId);
    info.exp += expAmount;

    // 检查是否可以升级
    // v25.1·试-13：把升级结果真正返回出去——旧版返回 info，cultivateSkill 读 result.upgraded
    // 恒 undefined，「功法升级」提示是死枝。全仓只有 cultivateSkill 消费返回值，改型安全。
    const upResult = checkProficiencyUpgrade(skillId);

    saveProficiencyData();
    return upResult;
}

// ============ 检查功法升级 ============
function checkProficiencyUpgrade(skillId) {
    const info = proficiencyData[skillId];
    if (!info) return { upgraded: false };

    const currentLevel = PROFICIENCY_LEVELS[info.level];
    const nextLevel = PROFICIENCY_LEVELS[info.level + 1];

    if (!nextLevel) {
        // v25.1·试-13：满级也回对象不回裸 false——调用方统一读 .upgraded 不炸
        return { upgraded: false, maxLevel: true }; // 已达最高等级
    }

    // 计算升级所需经验
    const requiredExp = getNextLevelRequiredExp(info.level);

    if (info.exp >= requiredExp) {
        // 自动升级
        info.exp -= requiredExp;
        info.level++;

        return {
            upgraded: true,
            newLevel: info.level,
            level: info.level,
            levelName: PROFICIENCY_LEVELS[info.level].name,
            multiplier: PROFICIENCY_LEVELS[info.level].multiplier
        };
    }

    return { upgraded: false };
}

// ============ 获取下一级所需经验 ============
function getNextLevelRequiredExp(currentLevel) {
    return Math.floor(100 * Math.pow(1.5, currentLevel));
}

// ============ v25.1·试-13：熟练度乘数消费口 ============
// PROFICIENCY_LEVELS 的 multiplier 此前全仓只有修炼面板展示（×N）在读，没有任何数值管线消费——
// 「练到返璞归真 ×5.0」是空头条。这里提供只读 helper，按当前熟练度等级返回乘数，供打坐真元产出接入。
// 无功法 / 查不到 / 数据异常一律返回 1（不改变既有产出，只做加法接口，主控按需接线）。
function getProficiencyEffectMultiplier(skillId) {
    // 槽里可能是对象也可能是字符串 id（NEW-22 口径），双兼容取 id
    var id = skillId ? (typeof skillId === 'object' ? (skillId.id || null) : skillId) : null;
    if (!id) return 1;
    var info = proficiencyData[id];
    if (!info) return 1;
    var lv = PROFICIENCY_LEVELS[info.level] || PROFICIENCY_LEVELS[0];
    var m = lv && Number(lv.multiplier);
    return (m && m > 0) ? m : 1;
}

// ============ 突破功法 ============
// v25.1·试-13：手动突破路径已停用——熟练度改由 addProficiencyExp 内的 checkProficiencyUpgrade 攒满即自动升级，
// info.exp 永达不到本级门槛，此函数的「经验不足」闸恒真、按钮已从面板撤下。保留函数体仅作向后兼容（不再挂 UI）。
function breakthroughProficiency(skillId) {
    const info = getProficiencyInfo(skillId);
    const currentLevel = PROFICIENCY_LEVELS[info.level];
    const nextLevel = PROFICIENCY_LEVELS[info.level + 1];
    
    if (!nextLevel) {
        alert('此功法已达到最高等级！');
        return false;
    }
    
    // 检查突破条件
    if (info.exp < getNextLevelRequiredExp(info.level)) {
        alert('经验不足，无法突破！');
        return false;
    }
    
    // 计算突破成功率
    let successRate = 0.7; // 基础70%
    successRate -= info.breakthroughAttempts * 0.1; // 每次失败降低10%
    successRate = Math.max(0.1, successRate); // 最低10%
    
    // 获取领悟加成
    const masteryInsight = insights.find(i => i.type === 'SPECIAL' && i.name === '悟道');
    if (masteryInsight) {
        successRate += 0.2;
    }
    // v20.42 悟道树·悟破境关：道心固者，叩关更稳（+5%）
    if (typeof window.getEnlightenmentFlag === 'function' && window.getEnlightenmentFlag('breakthrough')) {
        successRate += 0.05;
    }
    
    if (!confirm(`确定要突破到 ${nextLevel.name} 吗？\n成功率：${Math.round(successRate * 100)}%`)) {
        return false;
    }
    
    // 执行突破
    const isSuccess = Math.random() < successRate;
    
    if (isSuccess) {
        // 突破成功
        info.level++;
        info.exp = 0;
        info.breakthroughAttempts = 0;
        
        // 获得领悟点数（v20.42 悟道树·静功生慧：悟过此节点者多得一）
        var _insightGain = 2 + (typeof window.getInsightGainBonus === 'function' ? window.getInsightGainBonus() : 0);
        window.insightPoints = (window.insightPoints || 0) + _insightGain;

        alert(`突破成功！\n功法提升至 ${nextLevel.name}！\n获得领悟点数 +${_insightGain}`);
        
        // 触发特殊效果
        triggerBreakthroughEffect(skillId, info.level);
    } else {
        // 突破失败
        info.breakthroughAttempts++;
        info.exp = Math.floor(info.exp * 0.8); // 损失20%经验
        
        alert(`突破失败！\n经验损失20%，下次突破难度增加。`);
    }
    
    saveProficiencyData();
    return true;
}

// ============ 触发突破效果 ============
function triggerBreakthroughEffect(skillId, level) {
    const skill = findSkillById(skillId);
    if (!skill) return;
    
    // 根据功法类型给予不同效果
    switch (skill.type) {
        case '剑法':
            if (level >= 3) {
                addInsight('ATTACK', '剑意');
            }
            break;
        case '防御':
            if (level >= 3) {
                addInsight('DEFENSE', '金钟');
            }
            break;
        case '轻功':
            if (level >= 3) {
                addInsight('SPEED', '如风');
            }
            break;
    }
}

// ============ 添加领悟 ============
function addInsight(type, name) {
    const effects = insightEffects[type];
    if (!effects) return false;
    
    const effect = effects.find(e => e.name === name);
    if (!effect) return false;
    
    // 检查是否已获得
    if (insights.find(i => i.name === name)) {
        return false;
    }
    
    insights.push({
        type: type,
        name: name,
        desc: effect.desc,
        effect: effect.effect,
        obtainedTime: Date.now()
    });
    
    return true;
}

// ============ 使用领悟点数获得领悟 ============
function spendInsightPoint() {
    if ((window.insightPoints || 0) <= 0) {
        alert('没有领悟点数！');
        return false;
    }
    
    // 随机获得一个领悟
    const types = Object.keys(insightEffects);
    const randomType = types[Math.floor(Math.random() * types.length)];
    const effects = insightEffects[randomType];
    const availableEffects = effects.filter(e => !insights.find(i => i.name === e.name));
    
    if (availableEffects.length === 0) {
        alert('当前类型没有可用的领悟！');
        return false;
    }
    
    const randomEffect = availableEffects[Math.floor(Math.random() * availableEffects.length)];
    
    if (confirm(`消耗1点领悟点数，尝试获得领悟：${randomEffect.name}\n${randomEffect.desc}`)) {
        if (addInsight(randomType, randomEffect.name)) {
            window.insightPoints = Math.max(0, (window.insightPoints || 0) - 1);
            alert(`获得领悟：${randomEffect.name}！\n${randomEffect.desc}`);
            updateInsightUI();
            return true;
        } else {
            alert('该领悟已拥有，消耗失败！');
            return false;
        }
    }
    
    return false;
}

// ============ 修炼功法 ============
function cultivateSkill(skillId, amount = 10) {
    if (!discipleState.isInSect) amount = Math.floor(amount * 0.5);
    if (typeof window.applyCultivationBottleneckPenalty === 'function') {
        amount = window.applyCultivationBottleneckPenalty(amount);
    }

    var cfg = (window.BALANCE_CONFIG && window.BALANCE_CONFIG.cultivation) || {};
    var qiCost = Math.max(1, Number(cfg.skillPracticeQiCost) || 5);
    var timeCost = Math.max(1, Number(cfg.skillPracticeMinutes) || 30);
    var cd = (typeof window.getCurrentCharData === 'function') ? window.getCurrentCharData() : window.currentCharData;
    if (!cd) { alert('角色数据未就绪！'); return false; }
    var currentQi = Number(cd.qi) || 0;
    if (currentQi < qiCost) { alert('真气不足，无法修炼！'); return false; }
    cd.qi = currentQi - qiCost;

    let efficiency = 1.0;
    if (discipleState.isInSect) {
        // v20.53 按职级 id 结账，不再认 rankName 字符串：晋升只改 rank 数字时这里就断了档，
        // 长老/副掌门拿不到任何加成，入门是外门的话晋升到掌门也还是外门加成。
        var _rk = Number(discipleState.rank);
        if (_rk === 3 || _rk === 4) efficiency += 0.3;      // 亲传/内门：有师门功课照看
        else if (_rk === 2) efficiency += 0.4;              // 长老：可入长老院静室
        else if (_rk === 1 || _rk === 0) efficiency += 0.5; // 副掌门/掌门：宗门气运加身
        else if (_rk === 5) efficiency += 0.1;              // 外门
    }
    // v25.1·试-13：「悟道：修炼速度+20%」接通真实消费——此前 insightEffects.SPECIAL.悟道 唯一读者是
    // 永死的手动突破成功率加成，玩家抽到它从不生效。现按 effect.cultivation_speed 百分比加进修炼效率。
    try {
        var _wd = insights.find(function (i) { return i && i.type === 'SPECIAL' && i.name === '悟道' && i.effect && i.effect.cultivation_speed; });
        if (_wd) efficiency += (Number(_wd.effect.cultivation_speed) || 0) / 100;
    } catch (eWd) {}
    const exp = Math.floor(amount * efficiency);
    const result = addProficiencyExp(skillId, exp);
    if (Math.random() < 0.05) {
        window.insightPoints = (window.insightPoints || 0) + 1;
        alert('修炼有所感悟，获得1点领悟点数！');
    }
    // v25.1·试-13：result 现为 checkProficiencyUpgrade 的真实返回（{upgraded,newLevel,levelName,multiplier}），
    // 自动升级时这条提示不再是死枝。
    if (result && result.upgraded) alert(`功法升级！\n当前等级：${result.levelName}\n效果加成：×${result.multiplier}`);

    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') window.timeSystem.advanceTime(timeCost, '修炼功法');
    else if (typeof window.advanceTime === 'function') window.advanceTime(timeCost, '修炼功法');
    if (window.EventBus) window.EventBus.emit('cultivation:completed', { skillId: skillId, count: 1, minutes: timeCost, proficiencyExp: exp });
    if (typeof window.updateCharacterStatus === 'function') window.updateCharacterStatus();
    updateCultivationUI();
    return true;
}

// ============ 渲染修炼UI ============
function updateCultivationUI() {
    const container = document.getElementById('cultivation-panel');
    if (!container) return;
    
    // 获取已装备的功法
    const equippedSkills = window.currentSkills || {};
    
    let html = '<div class="space-y-3">';
    
    Object.entries(equippedSkills).forEach(([slotId, skill]) => {
        if (!skill) return;
        
        const info = getProficiencyInfo(skill.id);
        const currentLevel = PROFICIENCY_LEVELS[info.level];
        const nextLevel = PROFICIENCY_LEVELS[info.level + 1];
        const requiredExp = getNextLevelRequiredExp(info.level);
        const expProgress = nextLevel ? `${info.exp}/${requiredExp}` : 'MAX';
        
        html += `
            <div class="bg-gray-700/30 p-3 rounded border border-gray-600">
                <div class="flex justify-between items-center mb-2">
                    <div>
                        <span class="text-lg">${skill.icon}</span>
                        <span class="font-bold text-white ml-2">${skill.name}</span>
                        <span class="text-xs text-purple-400 ml-2">${currentLevel.name}</span>
                    </div>
                    <span class="text-xs text-gray-400">效果：×${currentLevel.multiplier}</span>
                </div>
                
                <div class="mb-2">
                    <div class="flex justify-between text-xs text-gray-400 mb-1">
                        <span>熟练度</span>
                        <span>${expProgress}</span>
                    </div>
                    <div class="w-full h-2 bg-gray-600 rounded overflow-hidden">
                        <div class="h-full bg-purple-500 rounded transition-all" style="width: ${nextLevel ? (info.exp / requiredExp * 100) : 100}%"></div>
                    </div>
                </div>
                
                <div class="flex gap-2 items-center">
                    <button onclick="cultivateSkill('${skill.id}')" class="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded text-xs">修炼</button>
                    ${nextLevel ? '<span class="text-xs text-gray-400">熟练度随修炼自动精进</span>' : '<span class="text-xs text-yellow-400">已达最高等级</span>'}
                </div>
            </div>
        `;
    });
    // v25.1·试-13：手动「突破」按钮撤下——熟练度攒满即自动升级（checkProficiencyUpgrade），
    // 旧按钮门槛 exp>=下级所需 在自动升级下永不满足，点了必弹「经验不足」，是个恒死的假承诺。
    
    if (html === '<div class="space-y-3">') {
        html += '<p class="text-gray-500 text-sm text-center">没有装备功法</p>';
    }

    // 0.2.3 瓶颈常驻入口：处瓶颈中时显示"突破瓶颈"按钮，否则玩家关掉首次弹窗后再无入口
    try {
        if (window.playerBottleneck && window.playerBottleneck.isInBottleneck &&
            typeof window.attemptBreakBottleneck === 'function') {
            var _bk = window.playerBottleneck;
            html += '<div class="bg-red-900/30 p-3 rounded border border-red-600/50 flex items-center justify-between">' +
                '<div><span class="text-lg">🔒</span><span class="font-bold text-red-400 ml-2">境界瓶颈</span>' +
                '<span class="text-xs text-red-300 ml-2">' + _bk.bottleneckRealm + ' ' + _bk.bottleneckLayer + '层 · 修炼效率仅30%</span></div>' +
                '<button onclick="window.attemptBreakBottleneck()" class="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-xs">突破瓶颈</button>' +
                '</div>';
        }
        // 1.7 残魂态转世入口：肉身已毁（残魂态）可转世重修，带前世记忆
        if (typeof window._inSoulState === 'function' && window._inSoulState() && typeof window.reincarnate === 'function') {
            var _inc2 = (window.currentCharData && window.currentCharData._pastLifeMemory && window.currentCharData._pastLifeMemory.incarnations) || 0;
            html += '<div class="bg-gray-900/40 p-3 rounded border border-gray-600 flex items-center justify-between">' +
                '<div><span class="text-lg">👻</span><span class="font-bold text-gray-400 ml-2">残魂态</span>' +
                '<span class="text-xs text-gray-500 ml-2">' + (_inc2 > 0 ? '已历 ' + _inc2 + ' 世轮回' : '神魂离体，肉身已毁') + '</span></div>' +
                '<button onclick="window.reincarnate()" class="bg-purple-700 hover:bg-purple-600 text-white px-3 py-1 rounded text-xs">转世重修</button>' +
                '</div>';
        }
    } catch (e) {}

    // 1.3 飞升后入口：飞升/金仙期显示二段飞升 + 天界切磋 + 香火信息
    try {
        var _cd = window.currentCharData || {};
        if (_cd.realm === '飞升' || _cd.realm === '金仙') {
            var _inc = _cd.incense || 0;
            html += '<div class="bg-amber-900/30 p-3 rounded border border-amber-600/50 flex items-center justify-between">' +
                '<div><span class="text-lg">🌅</span><span class="font-bold text-amber-400 ml-2">' + _cd.realm + '</span>' +
                '<span class="text-xs text-amber-300 ml-2">香火·信徒 ' + _inc + ' 人 · 每日回馈真元</span></div>' +
                '<div class="flex gap-2">' +
                '<button onclick="window.enterTianjie()" class="bg-amber-700 hover:bg-amber-600 text-white px-3 py-1 rounded text-xs" title="登上天界野外——灵气如潮，玉液成池，罡风扫野；回尘世在天界侧栏">🌅 登上天界</button>' +
                '<button onclick="window.tianjieSpar()" class="bg-blue-700 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs">天界切磋</button>' +
                (_cd.realm === '飞升' ? '<button onclick="window.trySecondAscension()" class="bg-yellow-600 hover:bg-yellow-500 text-gray-900 px-3 py-1 rounded text-xs">二段飞升</button>' : '') +
                '<button onclick="window.ascendedDescension()" class="bg-purple-700 hover:bg-purple-600 text-white px-3 py-1 rounded text-xs" title="散去仙躯入轮回——飞升者的转世，积分按「超脱」计">🔄 回入尘世</button>' +
                '</div></div>';
        }
        // 1.6 玩家建宗入口：白手起家改造——任何境界可插旗草创，元婴+置地才是开山立宗
        var _tier = (typeof window.getRealmTier === 'function') ? window.getRealmTier(_cd.realm) : 0;
        var _psMine = (window.PlayerSect && typeof window.PlayerSect.listMySects === 'function') ? (window.PlayerSect.listMySects() || []) : [];
        if (_cd.realm !== '飞升' && _cd.realm !== '金仙') {
            if (_psMine.length === 0) {
                html += '<div class="bg-indigo-900/30 p-3 rounded border border-indigo-600/50 flex items-center justify-between">' +
                    '<div><span class="text-lg">🏯</span><span class="font-bold text-indigo-400 ml-2">自立宗门</span>' +
                    '<span class="text-xs text-indigo-300 ml-2">' + (_tier >= 4
                        ? '元婴可分神操持，自立宗门——起名、定出身、择山门'
                        : '白手也能起家：插旗草创，招人、赁屋、挣家底——有没有人投，另说') + '</span></div>' +
                    '<button onclick="window.openFoundSectPanel()" class="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded text-xs">' + (_tier >= 4 ? '开山立宗' : '竖旗立宗') + '</button>' +
                    '</div>';
            } else {
                var _ps = _psMine[0];
                var _dCount = (_ps.disciples && _ps.disciples.length) || 0;
                html += '<div class="bg-indigo-900/30 p-3 rounded border border-indigo-600/50 flex items-center justify-between">' +
                    '<div><span class="text-lg">🏯</span><span class="font-bold text-indigo-400 ml-2">' + (_ps.name || '本宗') + '</span>' +
                    '<span class="text-xs text-indigo-300 ml-2">弟子 ' + _dCount + ' 人 · 声望 ' + Math.round(((_ps.resources && _ps.resources.reputation) || 0) * 10) / 10 + ' · ' + (_ps.location || '山门未定') + '</span></div>' +
                    '<div class="flex gap-2">' +
                    '<button onclick="window.openPlayerSectPanel()" class="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded text-xs">宗门总册</button>' +
                    '<button onclick="window._defendSectRaid()" class="bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded text-xs">护宗战</button>' +
                    '</div></div>';
            }
        }
        // 1.8 本命法宝：金丹+可炼制，喂材料升级，战斗加成随等级
        if (_tier >= 3) {
            var _ba = window.currentCharData && window.currentCharData._bondedArtifact;
            if (!_ba) {
                html += '<div class="bg-yellow-900/30 p-3 rounded border border-yellow-600/50 flex items-center justify-between">' +
                    '<div><span class="text-lg">🔱</span><span class="font-bold text-yellow-400 ml-2">本命法宝</span>' +
                    '<span class="text-xs text-yellow-300 ml-2">金丹可凝聚，与性命相连</span></div>' +
                    '<button onclick="window.forgeBondedArtifact()" class="bg-yellow-600 hover:bg-yellow-500 text-gray-900 px-3 py-1 rounded text-xs">凝聚炼制</button>' +
                    '</div>';
            } else {
                // v25.5 器灵养成：3 阶可唤醒，唤醒后能交感——器灵等级进同一战斗乘区（+2%/级）
                var _sp = _ba.spirit;
                var _spTxt = (_sp && _sp.awakened)
                    ? ' · 器灵「' + _sp.name + '」' + _sp.level + '级（' + (_sp.exp||0) + '/' + (_sp.expMax||50) + '）'
                    : ((_ba.level >= 3) ? ' · 灵性已足，器灵可唤醒' : '');
                var _spBtn = (_sp && _sp.awakened)
                    ? '<button onclick="window.communeWithSpirit()" class="bg-yellow-800 hover:bg-yellow-700 text-white px-3 py-1 rounded text-xs">器灵交感</button>'
                    : ((_ba.level >= 3) ? '<button onclick="window.awakenArtifactSpirit()" class="bg-amber-600 hover:bg-amber-500 text-white px-3 py-1 rounded text-xs">唤醒器灵</button>' : '');
                html += '<div class="bg-yellow-900/30 p-3 rounded border border-yellow-600/50 flex items-center justify-between">' +
                    '<div><span class="text-lg">🔱</span><span class="font-bold text-yellow-400 ml-2">' + _ba.name + '</span>' +
                    '<span class="text-xs text-yellow-300 ml-2">' + _ba.level + '阶 · 经验' + (_ba.exp||0) + '/' + (_ba.expMax||50) + ' · 攻防+' + ((_ba.level-1)*5) + '%' + _spTxt + '</span></div>' +
                    '<div class="flex gap-2">' + _spBtn +
                    '<button onclick="window.feedArtifact()" class="bg-yellow-700 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs">喂材料</button>' +
                    '</div></div>';
            }
        }
        // 1.10 高位面入口：元婴+入灵界、化神+入魔界（御剑飞行暴露供旅行系统接）
        if (_tier >= 4 && typeof window.enterPlane === 'function') {
            var _inPlane = (typeof window.getPlaneOf === 'function') ? window.getPlaneOf(window.currentCharData && window.currentCharData.location) : null;
            html += '<div class="bg-teal-900/30 p-3 rounded border border-teal-600/50 flex items-center justify-between">' +
                '<div><span class="text-lg">🌀</span><span class="font-bold text-teal-400 ml-2">位面穿梭</span>' +
                '<span class="text-xs text-teal-300 ml-2">' + (_inPlane ? ('现居 ' + (window.currentCharData.location)) : (_tier >= 5 ? '灵界/魔界可达' : '灵界可达')) + '</span></div>' +
                '<div class="flex gap-2">' +
                (_inPlane
                    ? '<button onclick="window.openPlanePanel && window.openPlanePanel()" class="bg-cyan-700 hover:bg-cyan-600 text-white px-3 py-1 rounded text-xs">位面之门</button>'
                    : '<button onclick="window.openPlanePanel && window.openPlanePanel()" class="bg-teal-600 hover:bg-teal-500 text-white px-3 py-1 rounded text-xs">位面之门</button>') +
                '</div></div>';
        }
        // 2.3 悟道树：消耗悟道点解锁永久属性节点
        if (typeof window.ENLIGHTEN_NODES !== 'undefined' && typeof window.enlightenNode === 'function') {
            var _enl = window.ENLIGHTEN_NODES || [];
            var _done = (typeof window.getEnlightenedNodes === 'function') ? (window.getEnlightenedNodes() || []) : [];
            var _ip = window.insightPoints || 0;
            var _enlHtml = '<div class="bg-cyan-900/20 p-3 rounded border border-cyan-700/50"><div class="flex items-center gap-2 mb-2"><span class="text-lg">🌳</span><span class="font-bold text-cyan-400">悟道树</span><span class="text-xs text-cyan-300 ml-auto">悟道点 ' + _ip + '</span></div><div class="flex flex-wrap gap-1">';
            for (var _ei = 0; _ei < _enl.length; _ei++) {
                var _nd = _enl[_ei];
                var _isDone = _done.indexOf(_nd.id) >= 0;
                // v20.42 前置门槛上脸：锁着的节点挂锁与缘由（树的枝干，得从根上长）
                var _lockWhy = (!_isDone && typeof window.getEnlightenmentLockReason === 'function') ? window.getEnlightenmentLockReason(_nd.id) : null;
                var _can = !_isDone && !_lockWhy && _ip >= _nd.cost;
                var _title = _nd.desc + (_lockWhy ? '｜' + _lockWhy : '');
                _enlHtml += '<button ' + (_can ? 'onclick="window.enlightenNode(\'' + _nd.id + '\')"' : 'disabled') + ' title="' + _title + '" class="text-xs px-2 py-1 rounded ' + (_isDone ? 'bg-cyan-900 text-cyan-600 cursor-not-allowed' : _can ? 'bg-cyan-700 hover:bg-cyan-600 text-white' : 'bg-gray-800 text-gray-500 cursor-not-allowed') + '">' + (_nd.icon || '🌳') + _nd.name + (_isDone ? '✓' : _lockWhy ? '🔒' : '(' + _nd.cost + '点)') + '</button>';
            }
            _enlHtml += '</div></div>';
            html += _enlHtml;
        }
        // 2.15 图鉴收集：派生统计 + 里程碑领取（气运奖励）
        if (typeof window.getCollectionStats === 'function' && typeof window.COLLECTION_MILESTONES !== 'undefined') {
            var _cs = window.getCollectionStats();
            var _claimed = (typeof window.getCollectionClaimed === 'function') ? window.getCollectionClaimed() : {};
            var _ms = window.COLLECTION_MILESTONES || [];
            var _csHtml = '<div class="bg-emerald-900/20 p-3 rounded border border-emerald-700/50"><div class="flex items-center gap-2 mb-2"><span class="text-lg">📖</span><span class="font-bold text-emerald-400">图鉴</span><span class="text-xs text-emerald-300 ml-auto">功法' + _cs.skills + '/物' + _cs.items + '/识' + _cs.npcs + '/杀' + _cs.kills + '</span></div><div class="flex flex-wrap gap-1">';
            for (var _mi = 0; _mi < _ms.length; _mi++) {
                var _m = _ms[_mi];
                var _done = _claimed[_m.id];
                var _reach = (_cs[_m.stat] || 0) >= _m.target;
                var _can = !_done && _reach;
                _csHtml += '<button ' + (_can ? 'onclick="window.claimCollectionMilestone(\'' + _m.id + '\')"' : 'disabled') + ' class="text-xs px-2 py-1 rounded ' + (_done ? 'bg-emerald-900 text-emerald-600 cursor-not-allowed' : _can ? 'bg-emerald-700 hover:bg-emerald-600 text-white' : 'bg-gray-800 text-gray-500 cursor-not-allowed') + '">' + _m.label + (_done ? '✓' : '(气运+' + _m.reward + ')') + '</button>';
            }
            _csHtml += '</div></div>';
            html += _csHtml;
        }
        // 2.13 灵脉经营：金丹+可占据灵脉，每日被动产灵石
        if (_tier >= 3 && typeof window.claimSpiritVein === 'function') {
            var _sv = window.currentCharData && window.currentCharData._spiritVein;
            if (!_sv) {
                html += '<div class="bg-emerald-900/30 p-3 rounded border border-emerald-600/50 flex items-center justify-between">' +
                    '<div><span class="text-lg">💎</span><span class="font-bold text-emerald-400 ml-2">灵脉</span>' +
                    '<span class="text-xs text-emerald-300 ml-2">金丹可布阵占据，日产灵石</span></div>' +
                    '<button onclick="window.claimSpiritVein()" class="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded text-xs">占据灵脉</button>' +
                    '</div>';
            } else {
                // v35 灵脉有了地点：地图脉眼上布的大阵，标出脉在哪、一键去看
                var _locTxt = (typeof window.veinLocationText === 'function') ? window.veinLocationText(_sv) : '';
                html += '<div class="bg-emerald-900/30 p-3 rounded border border-emerald-600/50 flex items-center justify-between">' +
                    '<div><span class="text-lg">💎</span><span class="font-bold text-emerald-400 ml-2">灵脉·' + _sv.tier + '阶</span>' +
                    '<span class="text-xs text-emerald-300 ml-2">日产 ' + (_sv.dailyOutput||20) + ' 灵石</span>' +
                    (_locTxt ? '<div class="text-xs text-emerald-500/80 mt-1 ml-7">' + _locTxt + '</div>' : '') + '</div>' +
                    '<div class="flex gap-2 items-center">' +
                    (_sv.location && typeof window.openWildernessMap === 'function' ? '<button onclick="window.openWildernessMap(\'' + _sv.location.region + '\')" class="bg-emerald-800 hover:bg-emerald-700 text-emerald-100 px-2 py-1 rounded text-xs">看脉</button>' : '') +
                    (_sv.tier < 5 ? '<button onclick="window.upgradeVein()" class="bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1 rounded text-xs">升级</button>' : '<span class="text-xs text-emerald-500">已臻极盛</span>') +
                    '</div>' +
                    '</div>';
            }
        }
        // 2.8 婚姻后代：道侣 bond>=2 可诞育后代（继承玩家主功法）
        if (typeof window.getDaoCompanionBond === 'function' && typeof window.haveChild === 'function') {
            var _dc = window.getDaoCompanionBond();
            if (_dc && (_dc.bond.level || 1) >= 2) {
                var _kids = (window.currentCharData._children || []).length;
                // v21.9 子嗣长线：长成的孩子可以会见——传功/历练/留在身边
                var _grownKids = (window.currentCharData._children || []).filter(function (c) { return c.grown; }).length;
                html += '<div class="bg-pink-900/30 p-3 rounded border border-pink-600/50 flex items-center justify-between">' +
                    '<div><span class="text-lg">👶</span><span class="font-bold text-pink-400 ml-2">道侣子嗣</span>' +
                    '<span class="text-xs text-pink-300 ml-2">已有 ' + _kids + ' 子嗣（上限3）' + (_grownKids ? ' · ' + _grownKids + ' 已长成' : '') + '</span></div>' +
                    '<div class="flex gap-2">' +
                    (_grownKids ? '<button onclick="window.openChildPanel()" class="bg-pink-700 hover:bg-pink-600 text-white px-3 py-1 rounded text-xs">会见子嗣</button>' : '') +
                    (_kids < 3 ? '<button onclick="window.haveChild()" class="bg-pink-600 hover:bg-pink-500 text-white px-3 py-1 rounded text-xs">诞育后代</button>' : '<span class="text-xs text-pink-500">子嗣已满</span>') +
                    '</div></div>';
            }
        }
        // 2.12 自创丹方：消耗材料+灵石炼制，按材料映射效果
        if (typeof window.craftCustomPill === 'function') {
            var _cpills = (window.currentCharData._customPills || []).length;
            html += '<div class="bg-orange-900/30 p-3 rounded border border-orange-600/50 flex items-center justify-between">' +
                '<div><span class="text-lg">⚗️</span><span class="font-bold text-orange-400 ml-2">自创丹方</span>' +
                '<span class="text-xs text-orange-300 ml-2">已创 ' + _cpills + ' 方</span></div>' +
                '<button onclick="window.craftCustomPill()" class="bg-orange-600 hover:bg-orange-500 text-white px-3 py-1 rounded text-xs">炼制丹方</button>' +
                '</div>';
        }
        // 2.12b 功法融合（v25.4 玩家乐趣闭环批）：两门已掌握功法可融成更胜一筹的一门——
        // mergeSkills 死代码自此有了入口；炉底不足两门时整块不画（不摆点不动的空头按钮）
        if (typeof _mergeableSkillList === 'function') {
            var _mergeable = _mergeableSkillList();
            if (_mergeable.length >= 2) {
                html += '<div class="bg-sky-900/30 p-3 rounded border border-sky-600/50 flex items-center justify-between">' +
                    '<div><span class="text-lg">☯️</span><span class="font-bold text-sky-400 ml-2">功法融合</span>' +
                    '<span class="text-xs text-sky-300 ml-2">已掌握 ' + _mergeable.length + ' 门可作炉底</span></div>' +
                    '<button onclick="window.openSkillMergeUI()" class="bg-sky-600 hover:bg-sky-500 text-white px-3 py-1 rounded text-xs">融汇功法</button>' +
                    '</div>';
            }
        }
        // 2.19 天机占卜：元婴+占卜气运/机缘（v20.39：一卦 → 四问卦阵）
        if (_tier >= 4 && typeof window.openDivination === 'function') {
            html += '<div class="bg-violet-900/30 p-3 rounded border border-violet-600/50 flex items-center justify-between">' +
                '<div><span class="text-lg">🔮</span><span class="font-bold text-violet-400 ml-2">天机卦阵</span>' +
                '<span class="text-xs text-violet-300 ml-2">气运 ' + (window.currentCharData.luck != null ? window.currentCharData.luck : 50) + '</span></div>' +
                '<button onclick="window.openDivination()" class="bg-violet-600 hover:bg-violet-500 text-white px-3 py-1 rounded text-xs">起卦（命/事/灾/人）</button>' +
                '</div>';
        }
        // v20.39 走火入魔：气机紊乱只进不出是假伤——化解三途挂上修炼面板
        if (typeof window.getQiDeviation === 'function' && typeof window.calmQiChoice === 'function') {
            var _qd = window.getQiDeviation();
            if (_qd > 0) {
                var _qdColor = _qd >= 95 ? 'text-red-400' : (_qd >= 80 ? 'text-red-300' : (_qd >= 60 ? 'text-orange-300' : 'text-yellow-300'));
                var _qdNote = _qd >= 95 ? '紊乱已极·突破锁死' : (_qd >= 80 ? '走火入魔·属性大损' : (_qd >= 60 ? '气机紊乱·诸事宜慎' : '气机微乱'));
                html += '<div class="bg-red-900/30 p-3 rounded border border-red-600/50 flex items-center justify-between">' +
                    '<div><span class="text-lg">🌀</span><span class="font-bold text-red-400 ml-2">气机紊乱</span>' +
                    '<span class="text-xs ' + _qdColor + ' ml-2">紊乱 ' + Math.round(_qd) + ' · ' + _qdNote + '</span></div>' +
                    '<button onclick="window.calmQiChoice()" class="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-xs">化解</button>' +
                    '</div>';
            }
        }
        // v25.5 魔道：入魔程度不再是只进不出的暗账——面板露出，能燃魔焰借力，也能压回去
        if (typeof window.getDemonicTierInfo === 'function') {
            var _dc = window.getDemonicCorruption();
            if (_dc >= 20) {
                var _dt = window.getDemonicTierInfo(_dc);
                var _flameOn = !!(window.activeBuffs && window.activeBuffs.demonic_flame);
                html += '<div class="bg-purple-900/30 p-3 rounded border border-purple-600/50 flex items-center justify-between">' +
                    '<div><span class="text-lg">😈</span><span class="font-bold text-purple-400 ml-2">魔道</span>' +
                    '<span class="text-xs text-purple-300 ml-2">入魔 ' + Math.round(_dc) + '% · ' + _dt.name + (_flameOn ? ' · 魔焰正燃' : '') + '</span></div>' +
                    '<div class="flex gap-2">' +
                    (_flameOn ? '' : '<button onclick="window.embraceDemonicFlame()" class="bg-purple-700 hover:bg-purple-600 text-white px-3 py-1 rounded text-xs" title="烧 10% 入魔程度换三日战力大涨，气机与业障付出代价">燃动魔焰</button>') +
                    '<button onclick="window.suppressDemonicHeart()" class="bg-indigo-700 hover:bg-indigo-600 text-white px-3 py-1 rounded text-xs" title="灵石 100 + 一个时辰，入魔程度压回 10%">压制魔心</button>' +
                    '</div></div>';
            }
        }
        // v20.41 丹毒：丹药的甜里带毒——面板露出 + 解毒三途入口
        if (typeof window.getPillPoison === 'function' && typeof window.detoxChoice === 'function') {
            var _pp = window.getPillPoison();
            if (_pp > 0) {
                var _ppColor = _pp >= 80 ? 'text-red-400' : (_pp >= 50 ? 'text-orange-300' : 'text-lime-300');
                var _ppNote = _pp >= 80 ? '毒入经脉·修炼大涩' : (_pp >= 50 ? '毒滞体内·修炼发涩' : '毒在腠理');
                html += '<div class="bg-lime-900/30 p-3 rounded border border-lime-600/50 flex items-center justify-between">' +
                    '<div><span class="text-lg">🍵</span><span class="font-bold text-lime-400 ml-2">丹毒</span>' +
                    '<span class="text-xs ' + _ppColor + ' ml-2">' + Math.round(_pp) + ' · ' + _ppNote + '</span></div>' +
                    '<button onclick="window.detoxChoice()" class="bg-lime-600 hover:bg-lime-500 text-white px-3 py-1 rounded text-xs">解毒</button>' +
                    '</div>';
            }
        }
        // 2.21 师徒传功：有宗门弟子可传功加速其突破
        if (typeof window.teachFirstDisciple === 'function' && typeof window.PlayerSect === 'object') {
            try {
                var _mine = (window.PlayerSect.listMySects && window.PlayerSect.listMySects()) || [];
                var _dCount = (_mine.length && _mine[0].disciples) ? _mine[0].disciples.length : 0;
                if (_dCount > 0) {
                    html += '<div class="bg-cyan-900/30 p-3 rounded border border-cyan-600/50 flex items-center justify-between">' +
                        '<div><span class="text-lg">📖</span><span class="font-bold text-cyan-400 ml-2">师徒传功</span>' +
                        '<span class="text-xs text-cyan-300 ml-2">弟子 ' + _dCount + ' 人</span></div>' +
                        '<button onclick="window.teachFirstDisciple()" class="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1 rounded text-xs">传功讲道</button>' +
                        '</div>';
                }
            } catch (e) {}
        }
    } catch (e) {}

    html += '</div>';
    
    container.innerHTML = html;
}

// ============ 渲染领悟UI ============
function updateInsightUI() {
    const insightText = document.getElementById('insight-points');
    if (insightText) {
        insightText.textContent = window.insightPoints || 0;
    }
    
    const container = document.getElementById('insights-list');
    if (!container) return;
    
    if (insights.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm text-center">暂无领悟</p>';
        return;
    }
    
    container.innerHTML = insights.map(insight => {
        const typeColors = {
            'ATTACK': 'text-red-400',
            'DEFENSE': 'text-blue-400',
            'SPEED': 'text-green-400',
            'CRIT': 'text-yellow-400',
            'DODGE': 'text-purple-400',
            'RECOVERY': 'text-cyan-400',
            'SPECIAL': 'text-pink-400'
        };
        
        return `
            <div class="bg-gray-700/30 p-2 rounded text-xs">
                <div class="flex justify-between items-center">
                    <span class="font-bold text-white">${insight.name}</span>
                    <span class="${typeColors[insight.type] || 'text-gray-400'}">${insight.type}</span>
                </div>
                <p class="text-gray-400 mt-1">${insight.desc}</p>
            </div>
        `;
    }).join('');
}

// ============ 打开修炼界面 ============
function openCultivationUI() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    
    modal.innerHTML = `
        <div class="bg-gray-800 border-2 border-yellow-500 rounded-xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto mx-4">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-yellow-500">🧘 功法修炼</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            
            <div class="mb-4 p-3 bg-gray-700/50 rounded flex justify-between items-center">
                <span class="text-sm text-gray-400">领悟点数：</span>
                <div class="flex items-center gap-2">
                    <span class="text-xl font-bold text-purple-400" id="insight-points">${window.insightPoints || 0}</span>
                    <button onclick="spendInsightPoint()" class="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded text-xs">使用1点</button>
                </div>
            </div>
            
            <div id="cultivation-panel" class="mb-4">
                <!-- 动态生成 -->
            </div>
            
            <div>
                <h4 class="text-lg font-bold text-green-400 mb-2">已获得领悟</h4>
                <div id="insights-list" class="grid grid-cols-2 gap-2">
                    <!-- 动态生成 -->
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 更新UI
    updateCultivationUI();
    updateInsightUI();
}

// ==================== v6.2 境界质变系统 ====================
// 每个境界有独特机制，不只是数值增长

// 境界质变效果定义
// 9境界质变效果（炼气→筑基→金丹→元婴→化神→炼虚→合体→大乘→渡劫）
var REALM_UNIQUE_EFFECTS = {
    '炼气': {
        name: '灵气感应',
        desc: '能感知天地灵气流动，采集效率+20%',
        icon: '👁️',
        bonuses: { gathering: 1.2, herb: 1.2 }
    },
    '筑基': {
        name: '御物术',
        desc: '以气御物，隔空取物，远程攻击+15%',
        icon: '🌀',
        bonuses: { remote_attack: 1.15, speed: 1.1 }
    },
    '金丹': {
        name: '金丹护体',
        desc: '金丹自动护主，受伤时15%概率完全格挡',
        icon: '🛡️',
        bonuses: { block: 15, defense: 1.15 }
    },
    '元婴': {
        name: '元婴出窍',
        desc: '元婴可离体探索，获得额外视野和感知能力，神识范围100～300丈',
        icon: '🌟',
        bonuses: { exploration: 1.3, dodge: 1.1 }
    },
    '化神': {
        name: '领域展开',
        desc: '战斗时展开领域，压制敌人全属性10%，神识范围300～1000丈',
        icon: '⚡',
        bonuses: { attack: 1.2, penetrate: 15 }
    },
    '炼虚': {
        name: '虚空融合',
        desc: '灵力与虚空融合，空间感知+法则碎片，神识范围1000～3000丈',
        icon: '🌀',
        bonuses: { teleport_cost: 0.5, speed: 1.2, space_damage: 1.25 }
    },
    '合体': {
        name: '法天象地',
        desc: '法身与元神一体，领域展开·言出法随，神识范围3000～10000丈',
        icon: '🗿',
        bonuses: { attack: 1.3, defense: 1.3, health: 1.3 }
    },
    '大乘': {
        name: '天人感应',
        desc: '天机推演+法则掌控，预知危险，闪避率+20%，暴击率+15%',
        icon: '🔮',
        bonuses: { dodge: 20, crit: 15, cultivation: 1.2 }
    },
    '渡劫': {
        name: '渡劫飞升',
        desc: '天劫对抗，飞升之门开启，千里感知，全属性大幅提升',
        icon: '⚡',
        bonuses: { attack: 1.5, defense: 1.5, block: 25, penetrate: 25 }
    },
    // F-43 v20.0 1.3 飞升后世界：飞升态获得仙灵加成
    '飞升': {
        name: '飞升仙界',
        desc: '飞升仙界，灵力转化为仙元，全属性再大幅提升',
        icon: '🌟',
        bonuses: { attack: 2.0, defense: 2.0, health: 1.5, qi: 2.0, dodge: 30, crit: 25 }
    },
    // F-43 v20.0 1.3 飞升后世界：金仙为飞升后最高境界
    '金仙': {
        name: '金仙不朽',
        desc: '金仙之境，万劫不磨，全属性达到极诣',
        icon: '✨',
        bonuses: { attack: 3.0, defense: 3.0, health: 2.0, qi: 3.0, dodge: 40, crit: 35, cultivate: 1.5 }
    }
};

// 获取当前境界的质变效果
function getRealmUniqueEffect(realmName) {
    return REALM_UNIQUE_EFFECTS[realmName] || null;
}

// 获取境界质变加成(用于战斗/采集/修炼等)
function getRealmBonus(realmName, bonusType) {
    var effect = REALM_UNIQUE_EFFECTS[realmName];
    if (!effect || !effect.bonuses) return 1.0;
    return effect.bonuses[bonusType] || 1.0;
}

// v20.48 境界质变补电：百分点口径读取。
// REALM_UNIQUE_EFFECTS 表里乘数（<=3，如 dodge 1.1 = +10%）与百分点（>3，如 dodge 20 = +20%）
// 混存在同一键位，本函数统一折成百分点：乘数 → (v-1)×100，百分点 → 原值。
function getRealmBonusPct(realmName, bonusType) {
    var effect = REALM_UNIQUE_EFFECTS[realmName];
    if (!effect || !effect.bonuses) return 0;
    var v = effect.bonuses[bonusType];
    if (typeof v !== 'number' || !isFinite(v)) return 0;
    return v <= 3 ? Math.round((v - 1) * 100) : v;
}

// 获取境界质变描述
function getRealmEffectDescription(realmName) {
    var effect = REALM_UNIQUE_EFFECTS[realmName];
    return effect ? effect.icon + ' ' + effect.name + '：' + effect.desc : '无特殊效果';
}

// ==================== v6.2 功法组合系统 ====================

// 五行相性定义
// 第八十一波·死账清理：相生表连同功法间相性查询（getElementInteraction）一并删除——
// 用户铁律「不准五行相克」（功法之间），且那本查询零调用躺了多年；
// 克制表保留的唯一消费方是对敌战术账 getElementalDamageMul（battle.js 敌人冰/火元素克制，0.2.2 #2 老账）。
var ELEMENT_INTERACTIONS = {
    // 相克：金克木、木克土、土克水、水克火、火克金（仅用于对敌战术账）
    mutual_restriction: {
        '金': '木', '木': '土', '土': '水', '水': '火', '火': '金'
    }
};

// 功法组合技定义
var SKILL_COMBINATIONS = [
    {
        id: 'yin_yang_merge',
        name: '阴阳融合',
        desc: '九阳神功+九阴真经同时运转，阴阳调和，全属性+30%',
        skills: ['九阳神功', '九阴真经'],
        bonus: { all_attr: 30 },
        icon: '☯️'
    },
    {
        id: 'taiji_domain',
        name: '太极领域',
        desc: '太极剑法+太极玄功，以柔克刚，减伤20%+反击率+15%',
        skills: ['太极剑法', '太极玄功'],
        bonus: { damage_reduce: 20, counter: 15 },
        icon: '🌀'
    },
    {
        id: 'sword_rain',
        name: '万剑归宗',
        desc: '独孤九剑+万剑归宗，剑气纵横，攻击+50%',
        skills: ['独孤九剑', '万剑归宗'],
        bonus: { attack: 50 },
        icon: '⚔️'
    },
    {
        id: 'wind_fire',
        name: '风火连天',
        desc: '破风刀法+烈火剑法，风助火势，伤害+40%',
        skills: ['破风刀法', '烈火剑法'],
        // 第七十八波兑现账：风与火是一件事（牌面「伤害+40%」），此前记两笔四零没人读——并成一笔攻击乘数
        bonus: { attack: 40 },
        icon: '🔥'
    },
    {
        id: 'ice_freeze',
        name: '冰封万里',
        desc: '玄冰诀+冰霜剑法，极寒之力，敌锋先钝——命中+20、格挡+10',
        skills: ['玄冰诀', '冰霜剑法'],
        // 第七十八波改账：战斗谱里从来没有「冰冻」这个机制——与其挂一张兑不出来的牌，
        // 不如把话说实：寒气冻的是对面的刀锋（命中/格挡走战斗派生表真管线）
        bonus: { hit: 20, block: 10 },
        icon: '❄️'
    },
    {
        id: 'earth_defense',
        name: '不动如山',
        desc: '厚土诀+金刚掌，大地之力，防御+40%',
        skills: ['厚土诀', '金刚掌'],
        bonus: { defense: 40, block: 20 },
        icon: '⛰️'
    },
    {
        id: 'wood_recovery',
        name: '生生不息',
        desc: '青木诀+清风剑法，生命之力，生命恢复+50%',
        skills: ['青木诀', '清风剑法'],
        bonus: { health_regen: 50, qi_regen: 30 },
        icon: '🌿'
    },
    {
        id: 'gold_attack',
        name: '金锋锐气',
        desc: '金锋诀+诛仙剑诀，锐不可当，破击+30%',
        skills: ['金锋诀', '诛仙剑诀'],
        bonus: { penetrate: 30, crit: 20 },
        icon: '🗡️'
    }
];

// 检查已装备功法是否触发组合技
function checkSkillCombinations(equippedSkills) {
    if (!equippedSkills) return [];
    var skillNames = Object.values(equippedSkills).filter(Boolean).map(function(s) { return s.name; });
    var activeCombos = [];
    
    for (var i = 0; i < SKILL_COMBINATIONS.length; i++) {
        var combo = SKILL_COMBINATIONS[i];
        var allPresent = combo.skills.every(function(skillName) {
            return skillNames.indexOf(skillName) >= 0;
        });
        if (allPresent) {
            activeCombos.push(combo);
        }
    }
    return activeCombos;
}

// 获取功法组合加成
function getSkillCombinationBonuses(equippedSkills) {
    var combos = checkSkillCombinations(equippedSkills);
    var totalBonus = {};
    for (var i = 0; i < combos.length; i++) {
        var bonus = combos[i].bonus;
        for (var key in bonus) {
            totalBonus[key] = (totalBonus[key] || 0) + bonus[key];
        }
    }
    return totalBonus;
}

// ============ 第七十八波 · 组合技全链通电 ============
// 此前两处断账：①检测源头读错（战斗实体那边读的是角色身上的空口袋，真运功账在 window.currentSkills）；
// ②同型死局——「九阳+九阴」都是内功，三槽各容一门，头牌组合物理上凑不齐。
// 修法：组合检测认真源（运功三槽），并放宽为「身上运着一门 + 功法册里参悟过另一门」也算——
// 阴阳互济，功法不在身上运，理也在身上。五套空头承诺（减伤/反击/回复/破暴/格挡）逐条接进真管线。
function comboActiveNames() {
    var names = [];
    try {
        var cs = window.currentSkills || {};
        for (var k in cs) {
            var s = cs[k];
            if (s && s.name) names.push(s.name);
        }
    } catch (e1) {}
    try {
        var ls = window.learnedSecrets || [];
        for (var i = 0; i < ls.length; i++) {
            var id = (typeof ls[i] === 'string') ? ls[i] : (ls[i] && ls[i].id);
            var t = id && window.itemById && window.itemById[id];
            if (t && t.name) names.push(t.name);
        }
    } catch (e2) {}
    return names;
}
// 当前点亮的组合（含图标与说法，运功页户口行直接用）
// 规矩：两门都得在身上（运着或参悟过），且**至少一门正在运转**——道理全在书里、一门没运，不算配合
function getActiveSkillCombos() {
    var names = comboActiveNames();
    var equipped = [];
    try {
        var cs = window.currentSkills || {};
        for (var k in cs) { if (cs[k] && cs[k].name) equipped.push(cs[k].name); }
    } catch (e) {}
    return SKILL_COMBINATIONS.filter(function (combo) {
        var allKnown = combo.skills.every(function (n) { return names.indexOf(n) >= 0; });
        var oneWorn = combo.skills.some(function (n) { return equipped.indexOf(n) >= 0; });
        return allKnown && oneWorn;
    });
}
// 组合总账（八套的原样键——百分数键走战斗实体，点数键走汇总河，回复键走自然恢复）
function getSkillComboTotals() {
    var total = {};
    getActiveSkillCombos().forEach(function (combo) {
        for (var key in combo.bonus) {
            if (Object.prototype.hasOwnProperty.call(combo.bonus, key)) total[key] = (total[key] || 0) + combo.bonus[key];
        }
    });
    return total;
}
// 点数键（进战斗加成汇总河——暴击/破防/格挡/闪避/命中都是现成消费口）
function getSkillComboFlatBonus() {
    var t = getSkillComboTotals();
    var out = {};
    ['crit', 'penetrate', 'block', 'dodge', 'hit'].forEach(function (k) { if (t[k]) out[k] = t[k]; });
    return out;
}
// 回复百分数（进每日自然恢复——与功法掌握/开山秘艺同一口加法）
function getSkillComboRegenPct() {
    var t = getSkillComboTotals();
    return { hp: Number(t.health_regen) || 0, qi: Number(t.qi_regen) || 0 };
}

// 0.2.2 #2 五行相克伤害倍率：攻方元素克守方→1.15，被克→0.85，其余1.0
// 中性/无属性/同元素不参与；为后续敌人五行扩展留统一入口
function getElementalDamageMul(atkElement, defElement) {
    if (!atkElement || !defElement) return 1.0;
    if (atkElement === 'neutral' || defElement === 'neutral' || atkElement === '无' || defElement === '无') return 1.0;
    if (atkElement === defElement) return 1.0;
    var restrict = ELEMENT_INTERACTIONS.mutual_restriction;
    if (restrict[atkElement] === defElement) return 1.15;
    if (restrict[defElement] === atkElement) return 0.85;
    return 1.0;
}

// 第八十一波·死账清理：功法间五行相性查询（getElementInteraction）删除——
// 零调用死函数，且用户铁律「不准五行相克」（功法之间的相克/相生都不做，系统特意更自由）

// 功法融合（两种已掌握功法 → 更胜一筹的新功法）
// v25.4 玩家乐趣闭环批接线：此函数早年写完整、挂了 window，却全仓零调用零 UI——
// 「系统写完没接线」的经典死路（道侣名册 v20.24、悬赏榜 v20.21 同款病史）。
// 旧版还自带三处硬伤：①融合功法只塞功法表、不进知识账，运不了功也吃不到被动；
// ②effect 是句空话「融合之力」，art-effects 解析器读不出任何数值——融了白融；
// ③grade 用 Math.max 算「九品」这种字符串，得出 NaN；④不落盘，读档后融合功法凭空消失。
// 本批全部补齐：掌握门槛、代价前置（灵石+时辰）、效果=双亲逐键取高再抬五成后
// 重生成标准效果串（解析器保证读得回）、入知识账、注册表持久化（经单一存盘 owner）、
// 融合功法不可再融（堵连锁滚雪球）、同一对不可重复融。
var MERGE_COST_STONES = 300;
var MERGE_COST_MINUTES = 120;
var MERGED_SAVE_KEY = 'xianxia_merged_skills';
// 解析键 → 标准效果句（与 art-effects._parseSkillEffect 的口径一一对应，改那边必改这边）
var _MERGE_EFFECT_TEXT = {
    sword: '剑法伤害', dao: '刀法伤害', fist: '拳掌伤害', spear: '枪法伤害', odd: '奇门伤害',
    attack: '攻击', defensePct: '防御', dodgePct: '闪避', critPct: '暴击',
    qiRegen: '真气恢复', hpRegen: '生命恢复', maxQiPct: '真气上限'
};
var _MERGE_ELEM_TEXT = { fire: '火系', ice: '冰系', water: '水系', metal: '金系', wood: '木系', earth: '土系', thunder: '雷系', wind: '风系', void: '暗系' };

function _skillIsMastered(id) {
    if (window.KnowledgeSystem && typeof window.KnowledgeSystem.canEquip === 'function') {
        try { if (window.KnowledgeSystem.canEquip(id)) return true; } catch (eKs) { console.warn('[静默失败] js/cultivation/cultivation.js · 功法掌握查询：知识册没答上来，回落旧账', eKs && eKs.message); }
    }
    return !!(window.learnedSecrets && window.learnedSecrets.indexOf(id) >= 0);
}

function _markSkillLearned(id) {
    if (window.KnowledgeSystem && typeof window.KnowledgeSystem.unlock === 'function') {
        try { window.KnowledgeSystem.unlock(id, 'learned', { source: 'merge', completeness: 1 }); return; } catch (eKu) { console.warn('[静默失败] js/cultivation/cultivation.js · 融合功法入知识册：回落旧账 learnedSecrets', eKu && eKu.message); }
    }
    if (!window.learnedSecrets) window.learnedSecrets = [];
    if (window.learnedSecrets.indexOf(id) < 0) window.learnedSecrets.push(id);
}

// 可当炉底的已掌握原版功法（融合出来的不算——再融会滚雪球）
function _mergeableSkillList() {
    var out = [];
    var pages = window.skillPages || [];
    for (var p = 0; p < pages.length; p++) {
        var page = pages[p] || [];
        for (var i = 0; i < page.length; i++) {
            var sk = page[i];
            if (!sk || !sk.id || String(sk.id).indexOf('merged_') === 0) continue;
            if (_skillIsMastered(sk.id)) out.push(sk);
        }
    }
    return out;
}

// 双亲效果合一炉：逐键取高再抬五成，重生成解析器读得回的标准效果串
function _composeMergedEffect(s1, s2) {
    var parse = (window.ArtEffects && typeof window.ArtEffects.parseSkillEffect === 'function')
        ? window.ArtEffects.parseSkillEffect : null;
    if (!parse) return [s1.effect, s2.effect].filter(Boolean).join('，') || '融合之力';
    var a = parse(s1.effect) || {}, b = parse(s2.effect) || {};
    var merged = {}, has = false;
    Object.keys(a).concat(Object.keys(b)).forEach(function (k) {
        var v = Math.max(Number(a[k]) || 0, Number(b[k]) || 0);
        if (v > 0) { merged[k] = Math.ceil(v * 1.5); has = true; }
    });
    if (!has) return '攻击+8%';   // 双亲效果都解析不出数值：给条保底，不写空话
    var parts = [];
    for (var k in merged) {
        if (_MERGE_EFFECT_TEXT[k]) parts.push(_MERGE_EFFECT_TEXT[k] + '+' + merged[k] + '%');
        else if (k.indexOf('elem_') === 0 && _MERGE_ELEM_TEXT[k.slice(5)]) parts.push(_MERGE_ELEM_TEXT[k.slice(5)] + '伤害+' + merged[k] + '%');
    }
    return parts.length ? parts.join('，') : '攻击+8%';
}

// 注册表持久化：融合功法读档后不凭空消失（走 v25.3 单一存盘 owner，夹具世界回落裸写）
function _loadMergedRegistry() {
    try {
        var raw = localStorage.getItem(MERGED_SAVE_KEY);
        var list = raw ? JSON.parse(raw) : [];
        return Array.isArray(list) ? list : [];
    } catch (e) { return []; }
}
function _saveMergedRegistry(list) {
    var raw = JSON.stringify(list || []);
    if (window.saveToStorage) { if (!window.saveToStorage(MERGED_SAVE_KEY, raw)) throw new Error(MERGED_SAVE_KEY + ' 未落盘'); } else localStorage.setItem(MERGED_SAVE_KEY, raw);
}

function _registerMergedSkill(def) {
    // def 进功法表（findSkillById 查得到、浏览页看得见）+ 知识账（运功/被动都认）
    if (window.skillPages) {
        var found = false;
        for (var p = 0; p < window.skillPages.length && !found; p++) {
            var page = window.skillPages[p] || [];
            for (var i = 0; i < page.length; i++) if (page[i] && page[i].id === def.id) { found = true; break; }
        }
        if (!found) {
            var lastPage = window.skillPages[window.skillPages.length - 1];
            if (lastPage && lastPage.length < 5) lastPage.push(def);
            else window.skillPages.push([def]);
        }
    }
    _markSkillLearned(def.id);
}

// 重载回册：注册表存的是完整 def，刷新后重建进功法表与知识账（与存档里的 learnedSecrets 双保险）
function rehydrateMergedSkills() {
    var list = _loadMergedRegistry();
    if (!list.length) return 0;
    if (!window.skillPages) return -1;   // 功法表还没加载（脚本顺序），由 load 事件重试
    for (var i = 0; i < list.length; i++) {
        var d = list[i];
        if (d && d.id && d.name) _registerMergedSkill(d);
    }
    return list.length;
}
if (rehydrateMergedSkills() === -1 && typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('load', function () {
        try { rehydrateMergedSkills(); } catch (eRh) { console.warn('[静默失败] js/cultivation/cultivation.js · 融合功法重载回册：旧融合功法没能重建进功法表', eRh && eRh.message); }
    });
}

function mergeSkills(skill1Id, skill2Id, mergeMaterial) {
    if (!window.currentCharData) { showMessage('请先创建角色', 'error'); return false; }
    if (!skill1Id || !skill2Id || skill1Id === skill2Id) { showMessage('融合要挑两门不同的功法。', 'warning'); return false; }
    if (String(skill1Id).indexOf('merged_') === 0 || String(skill2Id).indexOf('merged_') === 0) {
        showMessage('融合功法气机已杂，不能再当炉底二次融合。', 'warning'); return false;
    }
    var skill1 = (typeof findSkillById === 'function') ? findSkillById(skill1Id) : null;
    var skill2 = (typeof findSkillById === 'function') ? findSkillById(skill2Id) : null;
    if (!skill1 || !skill2) { showMessage('功法不存在', 'error'); return false; }
    if (!_skillIsMastered(skill1Id) || !_skillIsMastered(skill2Id)) {
        var _notMine = !_skillIsMastered(skill1Id) ? skill1.name : skill2.name;
        showMessage('「' + _notMine + '」你尚未掌握——没吃透的功法强融，只会两败俱伤。', 'warning'); return false;
    }
    var mergedId = 'merged_' + [String(skill1Id), String(skill2Id)].sort().join('_');
    if (_skillIsMastered(mergedId)) { showMessage('这两门功法已经融过一体，再融不出新东西了。', 'info'); return false; }

    // 代价前置：安神灵香（灵石）——失败也烧掉，成功多得一门
    if (window.DataManager && typeof window.DataManager.deductSpiritStones === 'function') {
        if (!window.DataManager.deductSpiritStones(MERGE_COST_STONES)) {
            showMessage('融合一炉需 ' + MERGE_COST_STONES + ' 灵石买安神灵香——你凑不出这个数。', 'warning'); return false;
        }
    }
    // 兼容旧签名：显式传入的融合材料（传了就必须有，先吃掉）
    if (mergeMaterial) {
        var hasMaterial = false;
        if (window.inventory) {
            for (var mi = 0; mi < window.inventory.slots.length; mi++) {
                var mslot = window.inventory.slots[mi];
                if (mslot && mslot.templateId === mergeMaterial && mslot.count >= 1) {
                    hasMaterial = true;
                    mslot.count -= 1;
                    if (mslot.count <= 0) window.inventory.slots[mi] = null;
                    break;
                }
            }
        }
        if (!hasMaterial) { showMessage('缺少融合材料！', 'error'); return false; }
    }
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') window.timeSystem.advanceTime(MERGE_COST_MINUTES, '融合功法');

    // 成功率：五成打底，双方熟练度每级 +3%，封顶八成五
    var prof1 = getProficiencyInfo(skill1Id);
    var prof2 = getProficiencyInfo(skill2Id);
    var rate = Math.min(0.85, 0.5 + ((prof1.level || 0) + (prof2.level || 0)) * 0.03);
    if (Math.random() >= rate) {
        showMessage('💥 融合失败！两道气机互冲而散，' + MERGE_COST_STONES + ' 灵石的香钱打了水漂。（两门功法无损；熟练度越高越稳）', 'error');
        return false;
    }
    var newSkill = {
        id: mergedId,
        name: skill1.name + '·' + skill2.name,
        icon: '☯️',
        type: '融合功法',
        grade: skill1.grade || skill2.grade || '无品',
        desc: '「' + skill1.name + '」与「' + skill2.name + '」融为一炉——气机互补，更胜单独任何一门。',
        effect: _composeMergedEffect(skill1, skill2),
        element: 'neutral',
        qiCost: (skill1.qiCost || 0) + (skill2.qiCost || 0)
    };
    _registerMergedSkill(newSkill);
    try {
        var reg = _loadMergedRegistry();
        reg.push(newSkill);
        _saveMergedRegistry(reg);
    } catch (eSv) { console.warn('[静默失败] js/cultivation/cultivation.js · 融合功法注册表：这一炉没写进本地存储，刷新后功法仍在但重载会丢', eSv && eSv.message); }
    showMessage('☯️ 融合成功！得新功法「' + newSkill.name + '」——' + newSkill.effect + '。已自动入知识账，可运功、可吃被动。', 'success');
    try { if (typeof updateCultivationUI === 'function') updateCultivationUI(); } catch (eUI) { console.warn('[静默失败] js/cultivation/cultivation.js · 融合成功后面板刷新：面板没刷出来，数值下次打开即在', eUI && eUI.message); }
    return newSkill;
}

// 融合面板：挑两门已掌握的功法，一炉融了
function openSkillMergeUI() {
    var list = _mergeableSkillList();
    if (list.length < 2) { showMessage('可当炉底的已掌握功法不足两门——先去多参悟几门吧。', 'warning'); return false; }
    if (typeof window.showModal !== 'function') { showMessage('功法融合要在浏览器里才能开炉。', 'info'); return false; }
    function opts(selId) {
        return list.map(function (sk) {
            var info = getProficiencyInfo(sk.id);
            return '<option value="' + sk.id + '"' + (sk.id === selId ? ' selected' : '') + '>' + (sk.icon || '📘') + ' ' + sk.name + '（熟练 ' + (info.level || 0) + ' · ' + (sk.effect || '无效果') + '）</option>';
        }).join('');
    }
    var body = '<p class="text-xs text-gray-400 mb-3">耗 ' + MERGE_COST_STONES + ' 灵石 + ' + MERGE_COST_MINUTES + ' 分钟静悟。成功率=五成+双方熟练度每级3%（至多八成五）；失败烧灵石、功法无损。成功则双亲效果逐条取高再抬五成，合为一门自动掌握。</p>'
        + '<label class="text-xs text-gray-300">功法甲</label><select id="merge-skill-a" class="w-full bg-gray-700 text-gray-100 text-xs rounded p-2 mb-2">' + opts(list[0].id) + '</select>'
        + '<label class="text-xs text-gray-300">功法乙</label><select id="merge-skill-b" class="w-full bg-gray-700 text-gray-100 text-xs rounded p-2 mb-3">' + opts(list[1].id) + '</select>'
        + '<button onclick="window.doSkillMerge()" class="w-full bg-sky-700 hover:bg-sky-600 text-white text-sm px-3 py-2 rounded">☯️ 融为一炉</button>';
    window.showModal('☯️ 功法融合', body);
    return true;
}
function doSkillMerge() {
    var a = document.getElementById('merge-skill-a');
    var b = document.getElementById('merge-skill-b');
    var aid = a && a.value, bid = b && b.value;
    if (!aid || !bid || aid === bid) { showMessage('要挑两门不同的功法。', 'warning'); return false; }
    var ov = document.getElementById('xianxia-modal-overlay');
    if (ov && ov.remove) ov.remove();
    return mergeSkills(aid, bid);
}
window.openSkillMergeUI = openSkillMergeUI;
window.doSkillMerge = doSkillMerge;
window.rehydrateMergedSkills = rehydrateMergedSkills;

// ==================== v6.2 心魔系统 ====================

// 心魔类型定义
var HEART_DEMON_TYPES = {
    slaughter: {
        id: 'slaughter',
        name: '杀戮心魔',
        icon: '💀',
        desc: '因杀戮过多而生，吞噬你的理智',
        triggerCondition: { killCount: 50 },
        battle: { attack: 1.2, defense: 0.8, skills: ['嗜血狂击', '杀戮之影'] }
    },
    greed: {
        id: 'greed',
        name: '贪婪心魔',
        icon: '👁️',
        desc: '因贪欲过重而生，诱惑你放弃道心',
        triggerCondition: { spiritStones: 10000 },
        battle: { attack: 1.0, defense: 1.1, skills: ['金钱诱惑', '欲望之眼'] }
    },
    emotion: {
        id: 'emotion',
        name: '情欲心魔',
        icon: '💕',
        desc: '因情债过多而生，纠缠你的神魂',
        triggerCondition: { bonds: 3 },
        battle: { attack: 0.9, defense: 1.2, skills: ['情丝缠绕', '执念之锁'] }
    },
    pride: {
        id: 'pride',
        name: '傲慢心魔',
        icon: '👑',
        desc: '因过于自负而生，挑战你的道心',
        triggerCondition: { realmLevel: 5 },
        battle: { attack: 1.3, defense: 0.9, skills: ['傲慢之壁', '蔑视之眼'] }
    },
    fear: {
        id: 'fear',
        name: '恐惧心魔',
        icon: '👻',
        desc: '因内心恐惧而生，放大你的不安',
        triggerCondition: { failedBreakthroughs: 3 },
        battle: { attack: 0.8, defense: 1.3, skills: ['恐惧之影', '绝望之握'] }
    }
};

// 检测玩家触发了哪种心魔
function checkHeartDemonTrigger() {
    var charData = window.currentCharData;
    if (!charData) return null;
    
    // 第一百二十三批 DES-76：杀戮只认 _killCount 这一本（随档持久、收藏与成就同尺）。
    // 此前入魔 +10 写的是 charData.killCount，读档后那本清零 ⇒ 心魔「杀孽」那条永远差一截。
    var killCount = charData._killCount || 0;
    var spiritStones = window.inventory ? window.inventory.currency.spiritStones : 0;
    var bonds = Object.keys(charData.bonds || {}).length;
    // v24.7：charData.realmLevel 全仓零写方（角色账上只有 realm 字符串 + layer）——
    // 「傲慢心魔」的触发条 realmLevel>=5 恒假，五种心魔里这一只从上线起没现身过。
    // 改用全仓统一的境界刻度 window.realmIndex（global-utils.js:870，凡人0…化神5…渡劫9）。
    var realmLevel = (typeof window.realmIndex === 'function' && charData.realm)
        ? window.realmIndex(charData.realm) : (charData.realmLevel || 0);
    var failedBreakthroughs = charData._failedBreakthroughs || 0;
    
    // 按优先级检查
    if (killCount >= 50 && Math.random() < 0.3) return HEART_DEMON_TYPES.slaughter;
    if (spiritStones >= 10000 && Math.random() < 0.25) return HEART_DEMON_TYPES.greed;
    if (bonds >= 3 && Math.random() < 0.2) return HEART_DEMON_TYPES.emotion;
    if (realmLevel >= 5 && Math.random() < 0.2) return HEART_DEMON_TYPES.pride;
    if (failedBreakthroughs >= 3 && Math.random() < 0.3) return HEART_DEMON_TYPES.fear;
    
    return null;
}

// 触发心魔劫（突破时调用）
function triggerHeartDemon() {
    var demon = checkHeartDemonTrigger();
    if (!demon) return null;
    
    // 记录心魔标记
    if (!window.currentCharData._heartDemon) {
        window.currentCharData._heartDemon = {};
    }
    window.currentCharData._heartDemon.current = demon.id;
    
    // 显示心魔降临剧情
    if (typeof window.showStoryDialogue === 'function') {
        window.showStoryDialogue({
            accept: '⚡ 突破之际，天地变色！\n\n' + demon.icon + ' 【' + demon.name + '】降临！\n\n' + demon.desc + '\n\n你必须战胜它才能继续突破！',
            progress: '战胜心魔，或屈服于它……',
            choices: [
                { text: '⚔️ 战胜心魔（进入战斗）', action: 'startHeartDemonBattle(\'' + demon.id + '\')' },
                { text: '🧘 以道心化解（消耗领悟点数）', action: 'resolveHeartDemonWithInsight(\'' + demon.id + '\')' },
                { text: '😈 屈服于心魔（入魔路线）', action: 'surrenderToHeartDemon(\'' + demon.id + '\')' }
            ]
        }, demon.name);
    } else {
        // 降级处理
        var choice = confirm(demon.icon + ' 【' + demon.name + '】降临！\n\n' + demon.desc + '\n\n点击确定战胜心魔，取消屈服于它。');
        if (choice) {
            return 'fight';
        } else {
            surrenderToHeartDemon(demon.id);
            return 'surrender';
        }
    }
    
    return demon;
}

// 心魔战斗开始
function startHeartDemonBattle(demonId) {
    var demon = HEART_DEMON_TYPES[demonId];
    if (!demon) return;
    
    // 创建一个心魔敌人
    var charData = window.currentCharData;
    // v21.6：心魔等级接回境界刻度；attack/defense/speed 由 openBattleWithEntity 的
    // synthesizeEnemyAttrs 兜底合成六维（此前手写字段全是死数据，心魔六维=10 进场）
    var _hdBase = (typeof window.realmScaledEnemyLevel === 'function')
        ? window.realmScaledEnemyLevel(charData) : (Number(charData.level) || 10);
    var demonEnemy = {
        name: demon.icon + ' ' + demon.name,
        level: _hdBase + 5,
        attack: Math.floor((charData.strength || 10) * demon.battle.attack),
        defense: Math.floor((charData.constitution || 10) * demon.battle.defense),
        speed: (charData.dexterity || 10),
        health: 100 + _hdBase * 5,
        skills: demon.battle.skills,
        type: 'demon',
        isBoss: true
    };
    
    // 打开战斗
    if (typeof window.openBattleWithEntity === 'function') {
        window.currentInteractionEntity = demonEnemy;
        window._heartDemonBattle = true;
        window._heartDemonId = demonId;
        window.openBattleWithEntity(demonEnemy);
    } else {
        // 简化战斗
        var win = Math.random() < 0.5;
        if (win) {
            resolveHeartDemonSuccess(demonId);
        } else {
            surrenderToHeartDemon(demonId);
        }
    }
}

// 心魔战胜成功
function resolveHeartDemonSuccess(demonId) {
    var demon = HEART_DEMON_TYPES[demonId];
    if (!demon) return;
    
    var charData = window.currentCharData;
    if (!charData) return;
    
    // 奖励
    var bonus = {
        willpower: 5,
        exp: 500 + (typeof window.realmScaledEnemyLevel === 'function'
            ? window.realmScaledEnemyLevel(charData) : (Number(charData.level) || 10)) * 20,
        spiritStones: 200
    };
    
    charData.willpower = (charData.willpower || 0) + bonus.willpower;
    // DES-72（第一百三十批）：这枚清明丹旧写法发得无声无息——囊里到底有没有它，屏上从不提
    var 丹 = (typeof window.giveWithReceipt === 'function')
        ? window.giveWithReceipt('pill_clarity', 1, { quiet: true }) : null;
    
    // 清除心魔标记
    if (charData._heartDemon) {
        delete charData._heartDemon.current;
    }
    
    // 获得「道心坚定」状态
    charData._heartDemonResolved = (charData._heartDemonResolved || 0) + 1;
    
    if (typeof window.showMessage === 'function') {
        window.showMessage('✨ 你战胜了【' + demon.name + '】！道心更加坚定！\n意志+' + bonus.willpower + '，经验+' + bonus.exp
            + (丹 && 丹.got > 0 ? '，' + 丹.name + '×' + 丹.got + ' 入囊' : '')
            + (丹 && 丹.got === 0
                ? '\n——可那一枚' + 丹.name + '没能带走：'
                  // DES-90（第一百三十九批）：心魔战胜的清明丹可反复获得，问不到账时不许站点断言满包，改用①形·句尾位带句号
                  + ((typeof window.addItemFailText === 'function' && window.addItemFailText(丹.name)) || '这一件先还留在原处。')
                : ''), 'success');
    }
    
    // 触发突破成功
    if (typeof window.performBreakthrough === 'function') {
        // 0.2.3 心魔战胜加成写 charData._heartDemonBonus（统一 standard+ritual 两路径，此前写 window 全局只有 ritual 读、standard 已读 charData 致不一致）
        if (window.currentCharData) window.currentCharData._heartDemonBonus = 0.3;
    }
}

// 以道心化解（消耗领悟点数）
function resolveHeartDemonWithInsight(demonId) {
    var insightPoints = window.insightPoints || 0;
    if (insightPoints < 2) {
        if (typeof window.showMessage === 'function') {
            window.showMessage('领悟点数不足（需要2点），无法以道心化解！', 'warning');
        }
        // 降级到战斗
        startHeartDemonBattle(demonId);
        return;
    }
    
    window.insightPoints = (window.insightPoints || 0) - 2;
    if (typeof window.updateInsightUI === 'function') {
        window.updateInsightUI();
    }
    
    var demon = HEART_DEMON_TYPES[demonId];
    if (typeof window.showMessage === 'function') {
        window.showMessage('🧘 以道心化解【' + demon.name + '】！消耗2点领悟点数。', 'success');
    }
    
    // 给予温和奖励
    var charData = window.currentCharData;
    if (charData) {
        charData.willpower = (charData.willpower || 0) + 3;
        charData._heartDemonResolved = (charData._heartDemonResolved || 0) + 1;
    }
}

// 屈服于心魔（入魔路线）
function surrenderToHeartDemon(demonId) {
    var demon = HEART_DEMON_TYPES[demonId];
    if (!demon) return;
    
    var charData = window.currentCharData;
    if (!charData) return;
    
    // 入魔效果
    charData._killCount = (charData._killCount || 0) + 10;
    charData.energy = Math.max(0, (charData.energy ?? 100) - 30);
    charData.mood = Math.max(0, (charData.mood ?? 50) - 20);
    
    // 短期力量提升但长期代价
    var tempPower = Math.floor((charData.level || 10) * 0.5);
    charData._demonicPower = (charData._demonicPower || 0) + tempPower;
    charData._demonicCorruption = (charData._demonicCorruption || 0) + 10;
    
    // 心魔标记
    if (!charData._heartDemon) charData._heartDemon = {};
    charData._heartDemon.surrendered = (charData._heartDemon.surrendered || 0) + 1;
    delete charData._heartDemon.current;
    
    if (typeof window.showMessage === 'function') {
        window.showMessage('😈 你屈服于【' + demon.name + '】……入魔之力涌入体内！\n杀戮值+10，入魔程度+10%，获得临时力量+' + tempPower, 'warning');
    }
}

// 在突破时检查并触发心魔
function breakthroughWithHeartDemon() {
    var demon = triggerHeartDemon();
    return demon !== null;
}

// ==================== v25.5 魔道：入魔转变线（第一百四十七批 · 玩法立项批） ====================
// 心魔「屈服」此前只把 _demonicCorruption 记进暗账（battle.js 认它、game-state.js 存它），
// 玩家看不见、也没有任何后续——堕落是一条只有入口没有路的断头线。这批把路修通：
// ① 修炼面板露出「魔道」块（入魔 ≥20%）；② 燃动魔焰：烧 10% 入魔换三日战力大涨
//    （window.activeBuffs 与门派设施同一管道，六维全额生效、到期自动清、随档持久）；
// ③ 压制魔心：灵石 + 时辰把入魔压回去，业障回善；④ 入魔 ≥50% 每日失控判定（气机紊乱/
//    暴走折损/盛怒毁物三选一），且魔性日涨——≥50% 后不压制只会越陷越深；⑤ 复活死字段
//    _demonicPower（此前零读者零存档）：屈服与燃焰都会攒它，魔焰的力道由它决定。
var DEMONIC_FLAME_HOURS = 72;        // 魔焰持续（游戏时辰 3 日）
var DEMONIC_FLAME_COST_CORRUPTION = 10;
var DEMONIC_FLAME_MIN_CORRUPTION = 20;
var DEMONIC_SUPPRESS_STONES = 100;
var DEMONIC_SUPPRESS_MINUTES = 120;  // 回执的时长由它生成
var DEMONIC_PANEL_MIN = 20;          // 面板露出门槛
var DEMONIC_RAMPAGE_MIN = 50;        // 每日失控判定门槛

function getDemonicCorruption() {
    var cd = window.currentCharData;
    return cd ? (Number(cd._demonicCorruption) || 0) : 0;
}

// 分档（面板文案与魔焰力道共用一把尺）：0 无 / 1 魔气入体 / 2 半魔之躯 / 3 一步入魔
function getDemonicTierInfo(c) {
    c = (c == null) ? getDemonicCorruption() : Number(c) || 0;
    if (c >= 80) return { tier: 3, name: '一步入魔' };
    if (c >= 50) return { tier: 2, name: '半魔之躯' };
    if (c >= 20) return { tier: 1, name: '魔气入体' };
    return { tier: 0, name: '魔气未显' };
}

function _demonicNowMinute() {
    if (window.GameScheduler && typeof window.GameScheduler.nowMinute === 'function') return window.GameScheduler.nowMinute();
    return (window.timeSystem && window.timeSystem.gameTime) ? (Number(window.timeSystem.gameTime.totalMinutes) || 0) : 0;
}

function isDemonicFlameActive() {
    var b = window.activeBuffs && window.activeBuffs.demonic_flame;
    return !!(b && b.effects && (b.expiryGameMinute || 0) > _demonicNowMinute());
}

function _clampKarma(cd, delta) {
    cd.karma = Math.max(-100, Math.min(100, (Number(cd.karma) || 0) + delta));
}

// 燃动魔焰：烧 10% 入魔换三日六维大涨（力道随分档与 _demonicPower），代价：业障/气机/精力
function embraceDemonicFlame() {
    var cd = window.currentCharData;
    if (!cd) { if (window.showMessage) window.showMessage('请先创建角色。', 'warning'); return false; }
    var c = getDemonicCorruption();
    if (c < DEMONIC_FLAME_MIN_CORRUPTION) {
        if (window.showMessage) window.showMessage('入魔程度不足 ' + DEMONIC_FLAME_MIN_CORRUPTION + '%（现 ' + Math.round(c) + '%），魔焰点不着。', 'warning');
        return false;
    }
    if (isDemonicFlameActive()) {
        if (window.showMessage) window.showMessage('魔焰正燃着——等它烧完再说。', 'info');
        return false;
    }
    var tier = getDemonicTierInfo(c).tier;
    cd._demonicCorruption = c - DEMONIC_FLAME_COST_CORRUPTION;
    // 死字段复活：每次燃焰都往 _demonicPower 里存一笔，力道账越滚越沉（随档走，见 game-state 白名单）
    var powerGain = Math.max(1, Math.floor((Number(cd.level) || 10) * 0.5));
    cd._demonicPower = (Number(cd._demonicPower) || 0) + powerGain;
    var effects = {
        strength: 5 + tier * 5 + Math.floor((cd._demonicPower || 0) / 4),
        constitution: 3 + tier * 3,
        dexterity: 2 + tier * 2
    };
    if (typeof window.applyBuff === 'function') {
        window.applyBuff('demonic_flame', effects, DEMONIC_FLAME_HOURS);
    } else {
        if (!window.activeBuffs) window.activeBuffs = {};
        window.activeBuffs.demonic_flame = { effects: effects, expiryGameMinute: _demonicNowMinute() + DEMONIC_FLAME_HOURS * 60, duration: DEMONIC_FLAME_HOURS };
    }
    _clampKarma(cd, -5);
    try { if (typeof window.addQiDeviation === 'function') window.addQiDeviation(8); } catch (eQd) { console.warn('[静默失败] js/cultivation/cultivation.js · 魔焰的气机紊乱：这一笔没接住，代价没落账', eQd && eQd.message); }
    cd.energy = Math.max(0, (cd.energy ?? 100) - 20);
    cd.mood = Math.max(0, (cd.mood ?? 50) - 10);
    if (window.showMessage) {
        window.showMessage('😈 你放开识海最后一道闸——黑焰自心口烧遍四肢百骸！\n魔焰燃起（三日）：力道+' + effects.strength + ' 体魄+' + effects.constitution + ' 身法+' + effects.dexterity
            + '\n代价：入魔程度烧去 ' + DEMONIC_FLAME_COST_CORRUPTION + '%（余 ' + Math.round(cd._demonicCorruption) + '%），业障+5（向恶），气机紊乱+8，精力-20。', 'warning');
    }
    if (window.updateCharacterStatus) window.updateCharacterStatus();
    try { updateCultivationUI(); } catch (eUI) { console.warn('[静默失败] js/cultivation/cultivation.js · 魔道面板重绘：这一笔没接住，面板还是旧账', eUI && eUI.message); }
    return true;
}

// 压制魔心：灵石 100 + 一个时辰静坐，入魔程度压回 10%，业障回善
function suppressDemonicHeart() {
    var cd = window.currentCharData;
    if (!cd) { if (window.showMessage) window.showMessage('请先创建角色。', 'warning'); return false; }
    var c = getDemonicCorruption();
    if (c <= 0) { if (window.showMessage) window.showMessage('你身上没有魔气可压。', 'info'); return false; }
    if (window.DataManager && window.DataManager.deductSpiritStones && !window.DataManager.deductSpiritStones(DEMONIC_SUPPRESS_STONES)) {
        if (window.showMessage) window.showMessage('请高人护法、焚香静心要 ' + DEMONIC_SUPPRESS_STONES + ' 灵石，钱袋不够。', 'warning');
        return false;
    }
    var mins = DEMONIC_SUPPRESS_MINUTES;   // 回执的时长由它生成
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') window.timeSystem.advanceTime(mins, '压制魔心');
    cd._demonicCorruption = Math.max(0, c - 10);
    _clampKarma(cd, 3);
    cd.willpower = (Number(cd.willpower) || 0) + 1;
    if (window.showMessage) {
        window.showMessage('🧘 你焚香静坐，一寸寸把黑焰压回识海深处——入魔程度 ' + Math.round(c) + '% → ' + Math.round(cd._demonicCorruption) + '%，业障-3（回善），意志+1。', 'success');
    }
    if (window.updateCharacterStatus) window.updateCharacterStatus();
    try { updateCultivationUI(); } catch (eUI2) { console.warn('[静默失败] js/cultivation/cultivation.js · 魔道面板重绘（压制口）：这一笔没接住，面板还是旧账', eUI2 && eUI2.message); }
    return true;
}

// 每日判定：≥50% 有几率失控（气机紊乱/暴走折损/盛怒毁物三选一），且魔性日涨；
// 20~49% 魔气自散（日 -1）——压制与等待的取舍：危险的深度等不来好转，只会更深
function demonicDailyTick() {
    try {
        var cd = window.currentCharData;
        if (!cd) return;
        var c = getDemonicCorruption();
        if (c <= 0) return;
        if (c >= DEMONIC_RAMPAGE_MIN) {
            cd._demonicCorruption = c + 1;   // 魔性日涨
            if (Math.random() < 0.25) {
                var roll = Math.random();
                if (roll < 0.4) {
                    if (typeof window.addQiDeviation === 'function') window.addQiDeviation(6);
                    if (window.showMessage) window.showMessage('😈 半夜魔焰焚心，你几乎压不住杀意——气机紊乱 +6。（入魔 ' + Math.round(cd._demonicCorruption) + '%，压制魔心可压回去）', 'warning');
                } else if (roll < 0.75) {
                    cd.energy = Math.max(0, (cd.energy ?? 100) - 15);
                    cd.mood = Math.max(0, (cd.mood ?? 50) - 15);
                    if (window.showMessage) window.showMessage('😈 你半夜暴走，一掌劈碎了静室的石案才清醒过来——精力-15，心境-15。（入魔 ' + Math.round(cd._demonicCorruption) + '%）', 'warning');
                } else {
                    var lost = 0;
                    if (window.DataManager && typeof window.DataManager.getSpiritStones === 'function' && typeof window.DataManager.deductSpiritStones === 'function') {
                        lost = Math.max(1, Math.min(50, Math.floor(window.DataManager.getSpiritStones() * 0.05)));
                        if (!window.DataManager.deductSpiritStones(lost)) lost = 0;
                    }
                    if (window.showMessage) window.showMessage('😈 你盛怒之下毁了不少物件，醒来满地狼藉——' + (lost > 0 ? ('赔修灵石 -' + lost) : '好在没伤着人') + '。（入魔 ' + Math.round(cd._demonicCorruption) + '%）', 'warning');
                }
                if (window.updateCharacterStatus) window.updateCharacterStatus();
            }
        } else {
            cd._demonicCorruption = Math.max(0, c - 1);   // 浅层魔气自散（日 -1）——危险的深度等不来好转
        }
    } catch (e) { console.warn('[静默失败] js/cultivation/cultivation.js · 魔道每日判定：这一笔没接住，今日的涨落与失控未落账', e && e.message); }
}
if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') {
    try { window.timeSystem.onNewDaySubscribe(demonicDailyTick); } catch (e) {}
}

window.getDemonicCorruption = getDemonicCorruption;
window.getDemonicTierInfo = getDemonicTierInfo;
window.isDemonicFlameActive = isDemonicFlameActive;
window.embraceDemonicFlame = embraceDemonicFlame;
window.suppressDemonicHeart = suppressDemonicHeart;
window.demonicDailyTick = demonicDailyTick;

// ==================== 灵根系统（v9.6.2 简化版） ====================
// 灵根结构：{ metal: 0-100, wood: 0-100, water: 0-100, fire: 0-100, earth: 0-100 }
// 规则：灵根值% = 对应功法修炼速度% = 功法发挥%
// 无属性功法：直接返回基准值

// 获取功法对应灵根元素（从 currentSkills + v15.4 藏经阁 artInsights 读取）
function _getMainTechniqueElement() {
    try {
        // F-57 v15.4 藏经阁接线：从 artInsights 找掌握度最高的 art_xx 查 SECT_SPECIFIC_ARTS 元素
        // v15.4 art_xx 没 elements/element 字段，按功法名"拳/剑/刀"等推断
        var ds = window.discipleState;
        if (ds && ds.artInsights) {
            var best = null;
            for (var aid in ds.artInsights) {
                var rec = ds.artInsights[aid];
                if (!rec || !(rec.m > 0)) continue;
                if (!best || rec.m > best.m) best = { id: aid, m: rec.m };
            }
            if (best) {
                var allArts = window.SECT_SPECIFIC_ARTS;
                if (allArts) {
                    for (var sn in allArts) {
                        var arr = allArts[sn];
                        if (!Array.isArray(arr)) continue;
                        for (var i = 0; i < arr.length; i++) {
                            if (arr[i].id === best.id) {
                                // 按 type 推断：内功→金（按武林默认主修内功为金系）
                                // 法术/符箓→火；医道/文道→木；炼体→土；剑/刀/奇门→金
                                var atype = arr[i].type;
                                if (/内功/.test(atype)) return 'metal';
                                if (/法术|符箓/.test(atype)) return 'fire';
                                if (/医道|文道/.test(atype)) return 'wood';
                                if (/炼体/.test(atype)) return 'earth';
                                if (/剑法|刀法|奇门|长兵|射术/.test(atype)) return 'metal';
                                if (/拳掌|轻功/.test(atype)) return 'earth';
                                return 'neutral';
                            }
                        }
                    }
                }
            }
        }
        // 第七十九波·读键修正：真运功账的槽位键是 skill_main——旧读法 main/neigong/inner 三个键从来不存在，
        // 主修元素恒报「无属性」，0.2.2 的单元素根倍率（0.8~1.43）对绝大多数玩家空转了两年
        const mainSkill = window.currentSkills && (window.currentSkills.skill_main || window.currentSkills.main || window.currentSkills.neigong || window.currentSkills.inner);
        if (!mainSkill) return 'none';   // 没运功法 ≠ 无属性功法——混元是功法的性质，不白送（基准速度照旧）
        
        // 优先读取功法本身的 elements 字段
        if (mainSkill.elements) {
            const elements = mainSkill.elements;
            for (const [element, weight] of Object.entries(elements)) {
                if (weight > 0.5) return element;
            }
            // 如果没有单一主导元素，返回第一个
            return Object.keys(elements)[0] || 'neutral';
        }
        
        // 回退到 element/elementType 字段
        let el = mainSkill.element || mainSkill.elementType || 'neutral';
        if (el !== 'neutral' && el) {
            return el;
        }
        
        // 通过技能ID查找完整技能数据
        const sid = mainSkill.id || mainSkill.skillId;
        if (sid) {
            // 尝试从 extendedArts 中查找
            const fullSkill = window.extendedArts?.find(s => s.id === sid);
            if (fullSkill && fullSkill.elements) {
                const elements = fullSkill.elements;
                for (const [element, weight] of Object.entries(elements)) {
                    if (weight > 0.5) return element;
                }
                return Object.keys(elements)[0] || 'neutral';
            }

            // 第八十一波·专精桥：真实装备流里槽中放的是运功页（skill_XX，页上没有元素标记），
            // 此前一路查空恒报无属——专精账在真实玩法里从没生效过。现回知识账查「凭哪本秘籍学来的这页」：
            // 先认知识条目上记的秘籍（manualId，最近一次研读的书），没有再反查映射谱里已学会的同页秘籍
            //（多本命中按谱序取第一本，确定论）；查到秘籍的 elements 取主导元素。
            try {
                var _ksB = window.KnowledgeSystem;
                if (_ksB) {
                    var _dominant = function (tpl) {
                        if (!tpl || !tpl.elements) return null;
                        var _els = tpl.elements;
                        for (var _ek in _els) { if (_els[_ek] > 0.5) return _ek; }
                        var _ks2 = Object.keys(_els);
                        return _ks2.length ? _ks2[0] : null;
                    };
                    var _artTpl = function (aid) {
                        if (!aid) return null;
                        if (window.itemById && window.itemById[aid]) return window.itemById[aid];
                        return (window.extendedArts || []).find(function (a) { return a && a.id === aid; }) || null;
                    };
                    var _ent = (typeof _ksB.getEntry === 'function') ? _ksB.getEntry(sid) : null;
                    var _el = _dominant(_artTpl(_ent && _ent.manualId));
                    if (_el) return _el;
                    var _m2s = _ksB.MANUAL_TO_SKILL || {};
                    var _learnedList = window.learnedSecrets || [];
                    for (var _mid in _m2s) {
                        if (_m2s[_mid] !== sid) continue;
                        var _entM = (typeof _ksB.getEntry === 'function') ? _ksB.getEntry(_mid) : null;
                        var _learnedM = (_entM && (_entM.state === 'learned' || _entM.state === 'mastered'))
                            || _learnedList.indexOf(_mid) >= 0;
                        if (!_learnedM) continue;
                        _el = _dominant(_artTpl(_mid));
                        if (_el) return _el;
                    }
                }
            } catch (eBridge) { /* 桥断不炸账——落到无属基准 */ }
        }

        return 'neutral';
    } catch (e) {
        console.error('获取功法元素失败:', e);
        return 'neutral';
    }
}

// 第七十九波·混元账（定稿口径来自用户设计文档《混元计算.md》）：
// 混元取代所有无属性功法，加成走**几何平均**——五行相乘，缺一不可：
//   几何结果 = (5/S)^5 × (金×木×水×火×土)   （S=五根之和，灵根以小数代入，20% 即 0.2）
//   五灵根各 20% → 1（100%）；金 100% 其余 0 → 0；金 40% 其余各 15% → ≈63.3%
// 最终倍率 = 保底 10% + 几何结果 × 90%（**保底为 10% 是用户最终决定**）：
//   完美均衡 ×1.0——混元效率的顶就是基准，混元功法的价值在其自身效果（真气上限/全属性），
//   饼不圆则效率重罚；四行为零 → ×0.1，练是练得成，一成效率，逼你去补短板（惩罚严厉是设计本意）。
// 没有灵根账（老档/异常）按基准 1.0 宽待——缺数据不当罪证。
function hunyuanGeo(roots) {
    if (!roots) return 1.0;
    var vals = ['metal', 'wood', 'water', 'fire', 'earth'].map(function (k) {
        return Math.max(0, Number(roots[k]) || 0) / 100;
    });
    var s = vals.reduce(function (a, b) { return a + b; }, 0);
    if (s <= 0) return 0;
    var prod = vals.reduce(function (a, b) { return a * b; }, 1);
    if (prod <= 0) return 0;
    var geo = Math.pow(5 / s, 5) * prod;
    return Math.max(0, Math.min(1, geo));
}
function getRootBalanceMultiplier(roots) {
    if (!roots) return 1.0;
    return 0.1 + 0.9 * hunyuanGeo(roots);
}
// 混元效率百分数（面板口径用）：100=五行各两成全圆，0=有一行为零
function getRootBalancePct(roots) {
    if (!roots) return 100;
    return Math.round(hunyuanGeo(roots) * 100);
}

// 灵根修炼速度倍率：元素功法吃单元素根（第八十波·按用户定稿拉直：单灵根 80% 就按 +80% 加成，
// 乘数 = 1 + 灵根/100，不再有 0.8 起步折损，也删掉了老版 >80 暗乘 1.1 的无逻辑设定——按用户指示移除），
// 混元类（无属性）功法吃五行几何平均（第七十九波·混元计算.md 定稿），
// 没运功法（'none'）走基准——均衡账是混元功法的性质，不白送
function getRootSpeedMultiplier(roots, element) {
    if (!roots) return 1.0;
    if (!element || element === 'none') return 1.0;
    if (element === 'neutral') {
        return getRootBalanceMultiplier(roots);
    }
    const value = Math.max(0, Number(roots[element]) || 0);
    return 1 + value / 100;
}

// effect mult (v9.8 separate from speed): 0.95 + root/500
function getRootEffectMultiplier(roots, element) {
    if (!roots) return 1.0;
    element = element || 'neutral';
    if (element === 'neutral' || !element) return 1.0;
    const value = roots[element] || 0;
    return 0.95 + value / 500;
}

// 判断是否能使用某属性功法：对应灵根必须 > 0
// 无属性功法：只要有任意灵根即可
function canUseTechniqueByRoots(roots, element) {
    if (!roots) return false;
    element = element || 'neutral';
    if (element === 'neutral') {
        // 无属性功法：至少有一个灵根 > 0
        return (roots.metal || 0) > 0 || (roots.wood || 0) > 0 || (roots.water || 0) > 0
            || (roots.fire || 0) > 0 || (roots.earth || 0) > 0;
    }
    return (roots[element] || 0) > 0;
}

// 计算修炼经验：baseExp × 灵根速度倍率
function calculateCultivationExpFromRoots(charData, baseExp) {
    baseExp = baseExp != null ? baseExp : 30;
    if (!charData) return baseExp;
    const roots = charData.spiritualRoots;
    const element = _getMainTechniqueElement();
    const speed = getRootSpeedMultiplier(roots, element);
    return Math.floor(baseExp * speed);
}

// ============ 导出 ============
window.PROFICIENCY_LEVELS = PROFICIENCY_LEVELS;
window.proficiencyData = proficiencyData;
window.insights = insights;
// v36 悟道账合一：真源在角色数据上（随存档走、换人不串账）；模块内变量只当无角色时的兜底。
// 此前访问器只读写模块变量——刷新页面悟道点就没了；而藏经阁等处写进角色数据的点又无人读。
function _ipChar() {
    return (typeof window.getCurrentCharData === 'function' ? window.getCurrentCharData() : null) || window.currentCharData || null;
}
try {
    Object.defineProperty(window, 'insightPoints', {
        configurable: true,
        enumerable: true,
        get: function() {
            const cd = _ipChar();
            return cd ? Math.max(0, Math.floor(Number(cd.insightPoints) || 0)) : insightPoints;
        },
        set: function(v) {
            const n = Math.max(0, Math.floor(Number(v) || 0));
            const cd = _ipChar();
            if (cd) cd.insightPoints = n; else insightPoints = n;
        }
    });
} catch (e) { window.insightPoints = insightPoints; }
window.INSIGHT_TYPES = INSIGHT_TYPES;
window.insightEffects = insightEffects;
window.initProficiencyData = initProficiencyData;
window.saveProficiencyData = saveProficiencyData;
// ===== v25.2·修复（案底：FIX_NOTES「换角色串熟练度」实弹坐实）=====
// 病链三层：① game-state.js 换档守卫调 resetProficiencyData（此前全库零定义，永远走
// else 挂 window.proficiencyData 空对象——死键，闭包与 LS 全没清）；② 存档收集口读
// window.proficiencyData（恒 null）→ 熟练度从不进档；③ 唯一持久化是全局 LS 键
// xianxia_proficiency（跨档跨角色共享）→ 新角色继承上局熟练度。
// 修法：真函数补齐（reset 清闭包+清 LS；snapshot 供存档收集读闭包真身）。
function resetProficiencyData() {
    proficiencyData = {};
    try { localStorage.removeItem('xianxia_proficiency'); } catch (e) {}
    if (typeof window.saveToStorage === 'function') { try { window.saveToStorage('xianxia_proficiency', '{}'); } catch (e) {} }
}
function getProficiencyDataSnapshot() {
    // 深拷贝防档收集后闭包继续被修炼改动污染快照
    return JSON.parse(JSON.stringify(proficiencyData || {}));
}
window.resetProficiencyData = resetProficiencyData;
window.getProficiencyDataSnapshot = getProficiencyDataSnapshot;
window.getProficiencyInfo = getProficiencyInfo;
window.addProficiencyExp = addProficiencyExp;
window.checkProficiencyUpgrade = checkProficiencyUpgrade;
window.getNextLevelRequiredExp = getNextLevelRequiredExp;
window.getProficiencyEffectMultiplier = getProficiencyEffectMultiplier; // v25.1·试-13：熟练度乘数消费口（供打坐真元产出接线）
window.breakthroughProficiency = breakthroughProficiency;
window.triggerBreakthroughEffect = triggerBreakthroughEffect;
window.addInsight = addInsight;
window.spendInsightPoint = spendInsightPoint;
window.cultivateSkill = cultivateSkill;
window.updateCultivationUI = updateCultivationUI;
window.updateInsightUI = updateInsightUI;
window.openCultivationUI = openCultivationUI;
window._openCultivationUIImpl = openCultivationUI;
if (window.XianXia) window.XianXia.openCultivationUI = openCultivationUI;;
// v6.2 修仙深度扩展导出
window.REALM_UNIQUE_EFFECTS = REALM_UNIQUE_EFFECTS;
window.getRealmUniqueEffect = getRealmUniqueEffect;
window.getRealmBonus = getRealmBonus;
window.getRealmBonusPct = getRealmBonusPct;
window.getRealmEffectDescription = getRealmEffectDescription;
window.SKILL_COMBINATIONS = SKILL_COMBINATIONS;
window.checkSkillCombinations = checkSkillCombinations;
window.getSkillCombinationBonuses = getSkillCombinationBonuses;
// 第七十八波·组合技全链通电：认真源的检测与三口分账（实体百分数/汇总河点数/自然恢复）
window.comboActiveNames = comboActiveNames;
window.getActiveSkillCombos = getActiveSkillCombos;
window.getSkillComboTotals = getSkillComboTotals;
window.getSkillComboFlatBonus = getSkillComboFlatBonus;
window.getSkillComboRegenPct = getSkillComboRegenPct;
window.getElementalDamageMul = getElementalDamageMul;
window._getMainTechniqueElement = _getMainTechniqueElement;
window.mergeSkills = mergeSkills;
window.HEART_DEMON_TYPES = HEART_DEMON_TYPES;
window.checkHeartDemonTrigger = checkHeartDemonTrigger;
window.triggerHeartDemon = triggerHeartDemon;
window.startHeartDemonBattle = startHeartDemonBattle;
window.resolveHeartDemonSuccess = resolveHeartDemonSuccess;
window.resolveHeartDemonWithInsight = resolveHeartDemonWithInsight;
window.surrenderToHeartDemon = surrenderToHeartDemon;
window.breakthroughWithHeartDemon = breakthroughWithHeartDemon;
window.ELEMENT_INTERACTIONS = ELEMENT_INTERACTIONS;
// v9.6.2 灵根系统（简化版）
window.getRootSpeedMultiplier = getRootSpeedMultiplier;
window.getRootEffectMultiplier = getRootEffectMultiplier;
// 第七十九波·混元均衡账：均衡倍率与均衡度百分数（纯派生读数口）
window.getRootBalanceMultiplier = getRootBalanceMultiplier;
window.getRootBalancePct = getRootBalancePct;
window.calculateCultivationExpFromRoots = calculateCultivationExpFromRoots;
window.canUseTechniqueByRoots = canUseTechniqueByRoots;
