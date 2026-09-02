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
let insightPoints = 0; // 领悟点数

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
    localStorage.setItem('xianxia_proficiency', JSON.stringify(proficiencyData));
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
    checkProficiencyUpgrade(skillId);
    
    saveProficiencyData();
    return info;
}

// ============ 检查功法升级 ============
function checkProficiencyUpgrade(skillId) {
    const info = proficiencyData[skillId];
    if (!info) return false;
    
    const currentLevel = PROFICIENCY_LEVELS[info.level];
    const nextLevel = PROFICIENCY_LEVELS[info.level + 1];
    
    if (!nextLevel) {
        return false; // 已达最高等级
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

// ============ 突破功法 ============
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
        
        // 获得领悟点数
        insightPoints += 2;
        
        alert(`突破成功！\n功法提升至 ${nextLevel.name}！\n获得领悟点数 +2`);
        
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
    if (insightPoints <= 0) {
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
            insightPoints--;
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
        if (discipleState.rankName === '亲传弟子' || discipleState.rankName === '内门弟子') efficiency += 0.3;
        else if (discipleState.rankName === '外门弟子') efficiency += 0.1;
    }
    const exp = Math.floor(amount * efficiency);
    const result = addProficiencyExp(skillId, exp);
    if (Math.random() < 0.05) {
        insightPoints += 1;
        alert('修炼有所感悟，获得1点领悟点数！');
    }
    if (result.upgraded) alert(`功法升级！\n当前等级：${PROFICIENCY_LEVELS[result.level].name}\n效果加成：x${result.multiplier}`);

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
                    <span class="text-xs text-gray-400">效果：x${currentLevel.multiplier}</span>
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
                
                <div class="flex gap-2">
                    <button onclick="cultivateSkill('${skill.id}')" class="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded text-xs">修炼</button>
                    ${nextLevel ? `<button onclick="breakthroughProficiency('${skill.id}')" class="bg-yellow-600 hover:bg-yellow-500 text-gray-900 px-3 py-1 rounded text-xs">突破</button>` : '<span class="text-xs text-yellow-400">已达最高等级</span>'}
                </div>
            </div>
        `;
    });
    
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
                '<button onclick="window.tianjieSpar()" class="bg-blue-700 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs">天界切磋</button>' +
                (_cd.realm === '飞升' ? '<button onclick="window.trySecondAscension()" class="bg-yellow-600 hover:bg-yellow-500 text-gray-900 px-3 py-1 rounded text-xs">二段飞升</button>' : '') +
                '</div></div>';
        }
        // 1.6 玩家建宗入口：元婴+可开山立宗（既有 PlayerSect 系统，此前无 UI 入口）
        var _tier = (typeof window.getRealmTier === 'function') ? window.getRealmTier(_cd.realm) : 0;
        var _psMine = (window.PlayerSect && typeof window.PlayerSect.listMySects === 'function') ? (window.PlayerSect.listMySects() || []) : [];
        if (_tier >= 4 && _cd.realm !== '飞升' && _cd.realm !== '金仙') {
            if (_psMine.length === 0) {
                html += '<div class="bg-indigo-900/30 p-3 rounded border border-indigo-600/50 flex items-center justify-between">' +
                    '<div><span class="text-lg">🏯</span><span class="font-bold text-indigo-400 ml-2">开山立宗</span>' +
                    '<span class="text-xs text-indigo-300 ml-2">元婴可分神操持，自立宗门</span></div>' +
                    '<button onclick="window._quickFoundSect()" class="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded text-xs">开山立宗</button>' +
                    '</div>';
            } else {
                var _ps = _psMine[0];
                var _dCount = (_ps.disciples && _ps.disciples.length) || 0;
                html += '<div class="bg-indigo-900/30 p-3 rounded border border-indigo-600/50 flex items-center justify-between">' +
                    '<div><span class="text-lg">🏯</span><span class="font-bold text-indigo-400 ml-2">' + (_ps.name || '本宗') + '</span>' +
                    '<span class="text-xs text-indigo-300 ml-2">弟子 ' + _dCount + ' 人 · 声望 ' + (_ps.reputation || 0) + '</span></div>' +
                    '<button onclick="window._defendSectRaid()" class="bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded text-xs">护宗战</button>' +
                    '</div>';
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
                html += '<div class="bg-yellow-900/30 p-3 rounded border border-yellow-600/50 flex items-center justify-between">' +
                    '<div><span class="text-lg">🔱</span><span class="font-bold text-yellow-400 ml-2">' + _ba.name + '</span>' +
                    '<span class="text-xs text-yellow-300 ml-2">' + _ba.level + '阶 · 经验' + (_ba.exp||0) + '/' + (_ba.expMax||50) + ' · 攻防+' + ((_ba.level-1)*5) + '%</span></div>' +
                    '<button onclick="window.feedArtifact()" class="bg-yellow-700 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs">喂材料</button>' +
                    '</div>';
            }
        }
        // 1.10 高位面入口：元婴+入灵界、化神+入魔界（御剑飞行暴露供旅行系统接）
        if (_tier >= 4 && typeof window.enterPlane === 'function') {
            html += '<div class="bg-teal-900/30 p-3 rounded border border-teal-600/50 flex items-center justify-between">' +
                '<div><span class="text-lg">🌀</span><span class="font-bold text-teal-400 ml-2">位面穿梭</span>' +
                '<span class="text-xs text-teal-300 ml-2">' + (_tier >= 5 ? '灵界/魔界可达' : '灵界可达') + '</span></div>' +
                '<div class="flex gap-2">' +
                '<button onclick="window.enterPlane(\'灵界\')" class="bg-teal-600 hover:bg-teal-500 text-white px-3 py-1 rounded text-xs">前往灵界</button>' +
                (_tier >= 5 ? '<button onclick="window.enterPlane(\'魔界\')" class="bg-purple-700 hover:bg-purple-600 text-white px-3 py-1 rounded text-xs">前往魔界</button>' : '') +
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
                var _can = !_isDone && _ip >= _nd.cost;
                _enlHtml += '<button ' + (_can ? 'onclick="window.enlightenNode(\'' + _nd.id + '\')"' : 'disabled') + ' title="' + _nd.desc + '" class="text-xs px-2 py-1 rounded ' + (_isDone ? 'bg-cyan-900 text-cyan-600 cursor-not-allowed' : _can ? 'bg-cyan-700 hover:bg-cyan-600 text-white' : 'bg-gray-800 text-gray-500 cursor-not-allowed') + '">' + (_nd.icon || '🌳') + _nd.name + (_isDone ? '✓' : '(' + _nd.cost + '点)') + '</button>';
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
                html += '<div class="bg-emerald-900/30 p-3 rounded border border-emerald-600/50 flex items-center justify-between">' +
                    '<div><span class="text-lg">💎</span><span class="font-bold text-emerald-400 ml-2">灵脉·' + _sv.tier + '阶</span>' +
                    '<span class="text-xs text-emerald-300 ml-2">日产 ' + (_sv.dailyOutput||20) + ' 灵石</span></div>' +
                    (_sv.tier < 5 ? '<button onclick="window.upgradeVein()" class="bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1 rounded text-xs">升级</button>' : '<span class="text-xs text-emerald-500">已臻极盛</span>') +
                    '</div>';
            }
        }
        // 2.8 婚姻后代：道侣 bond>=2 可诞育后代（继承玩家主功法）
        if (typeof window.getDaoCompanionBond === 'function' && typeof window.haveChild === 'function') {
            var _dc = window.getDaoCompanionBond();
            if (_dc && (_dc.bond.level || 1) >= 2) {
                var _kids = (window.currentCharData._children || []).length;
                html += '<div class="bg-pink-900/30 p-3 rounded border border-pink-600/50 flex items-center justify-between">' +
                    '<div><span class="text-lg">👶</span><span class="font-bold text-pink-400 ml-2">道侣子嗣</span>' +
                    '<span class="text-xs text-pink-300 ml-2">已有 ' + _kids + ' 子嗣（上限3）</span></div>' +
                    (_kids < 3 ? '<button onclick="window.haveChild()" class="bg-pink-600 hover:bg-pink-500 text-white px-3 py-1 rounded text-xs">诞育后代</button>' : '<span class="text-xs text-pink-500">子嗣已满</span>') +
                    '</div>';
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
        // 2.19 天机占卜：元婴+占卜气运/机缘
        if (_tier >= 4 && typeof window.divineFortune === 'function') {
            html += '<div class="bg-violet-900/30 p-3 rounded border border-violet-600/50 flex items-center justify-between">' +
                '<div><span class="text-lg">🔮</span><span class="font-bold text-violet-400 ml-2">天机占卜</span>' +
                '<span class="text-xs text-violet-300 ml-2">气运 ' + (window.currentCharData.luck != null ? window.currentCharData.luck : 50) + '</span></div>' +
                '<button onclick="window.divineFortune()" class="bg-violet-600 hover:bg-violet-500 text-white px-3 py-1 rounded text-xs">占卜</button>' +
                '</div>';
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
        insightText.textContent = insightPoints;
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
                    <span class="text-xl font-bold text-purple-400" id="insight-points">${insightPoints}</span>
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

// 获取境界质变描述
function getRealmEffectDescription(realmName) {
    var effect = REALM_UNIQUE_EFFECTS[realmName];
    return effect ? effect.icon + ' ' + effect.name + '：' + effect.desc : '无特殊效果';
}

// ==================== v6.2 功法组合系统 ====================

// 五行相性定义
var ELEMENT_INTERACTIONS = {
    // 相生：金生水、水生木、木生火、火生土、土生金
    mutual_generation: {
        '金': '水', '水': '木', '木': '火', '火': '土', '土': '金'
    },
    // 相克：金克木、木克土、土克水、水克火、火克金
    mutual_restriction: {
        '金': '木', '木': '土', '土': '水', '水': '火', '火': '金'
    }
};

// 功法元素标签映射
var SKILL_ELEMENT_MAP = {
    '九阳神功': '火', '九阴真经': '水', '混元功': '土',
    '玄冰诀': '水', '离火诀': '火', '青木诀': '木', '厚土诀': '土', '金锋诀': '金',
    '水月诀': '水', '太极玄功': '土', '混沌诀': '无',
    '烈火剑法': '火', '冰霜剑法': '水', '太乙剑法': '木', '太极剑法': '土',
    '清风剑法': '木', '诛仙剑诀': '金',
    '破风刀法': '风', '断水刀法': '水', '血饮刀法': '火', '屠龙刀法': '金',
    '金刚掌': '金', '降龙掌': '土', '太虚拳': '无'
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
        bonus: { fire_damage: 40, wind_damage: 40 },
        icon: '🔥'
    },
    {
        id: 'ice_freeze',
        name: '冰封万里',
        desc: '玄冰诀+冰霜剑法，极寒之力，冰冻概率+30%',
        skills: ['玄冰诀', '冰霜剑法'],
        bonus: { freeze_chance: 30, water_damage: 35 },
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

// 检查五行相性（两个功法之间）
function getElementInteraction(skill1Name, skill2Name) {
    var elem1 = SKILL_ELEMENT_MAP[skill1Name];
    var elem2 = SKILL_ELEMENT_MAP[skill2Name];
    if (!elem1 || !elem2 || elem1 === '无' || elem2 === '无') return null;
    
    // 检查相生
    var gen = ELEMENT_INTERACTIONS.mutual_generation;
    if (gen[elem1] === elem2) return { type: 'generation', name: '相生', bonus: 1.15 };
    if (gen[elem2] === elem1) return { type: 'generation', name: '相生', bonus: 1.15 };
    
    // 检查相克
    var res = ELEMENT_INTERACTIONS.mutual_restriction;
    if (res[elem1] === elem2) return { type: 'restriction', name: '相克', bonus: 1.10 };
    if (res[elem2] === elem1) return { type: 'restriction', name: '相克', bonus: 1.10 };
    
    return null;
}

// 功法融合（两种功法→新功法）
function mergeSkills(skill1Id, skill2Id, mergeMaterial) {
    // 检查是否有融合材料
    if (!window.inventory) {
        showMessage('背包系统未就绪', 'error');
        return false;
    }
    
    var hasMaterial = false;
    if (mergeMaterial) {
        for (var i = 0; i < window.inventory.slots.length; i++) {
            var slot = window.inventory.slots[i];
            if (slot && slot.templateId === mergeMaterial && slot.count >= 1) {
                hasMaterial = true;
                slot.count -= 1;
                if (slot.count <= 0) window.inventory.slots[i] = null;
                break;
            }
        }
        if (!hasMaterial) {
            showMessage('缺少融合材料！', 'error');
            return false;
        }
    }
    
    // 获取两个功法
    var skill1 = findSkillById(skill1Id);
    var skill2 = findSkillById(skill2Id);
    if (!skill1 || !skill2) {
        showMessage('功法不存在', 'error');
        return false;
    }
    
    // 融合成功率（受熟练度影响）
    var prof1 = getProficiencyInfo(skill1Id);
    var prof2 = getProficiencyInfo(skill2Id);
    var baseRate = 0.5 + (prof1.level + prof2.level) * 0.03;
    var success = Math.random() < baseRate;
    
    if (success) {
        // 融合成功：生成新功法
        var newSkillName = skill1.name + '·' + skill2.name + '融合';
        var newSkill = {
            id: 'merged_' + skill1Id + '_' + skill2Id,
            name: newSkillName,
            icon: '☯️',
            type: '融合功法',
            grade: Math.max(skill1.grade || 1, skill2.grade || 1) + 1,
            desc: skill1.desc + ' + ' + skill2.desc + ' 融合而成',
            effect: '融合之力',
            qiCost: (skill1.qiCost || 0) + (skill2.qiCost || 0)
        };
        
        // 注册到功法系统
        if (window.skillPages) {
            // 找到最后一页添加
            var lastPage = window.skillPages[window.skillPages.length - 1];
            if (lastPage && lastPage.length < 5) {
                lastPage.push(newSkill);
            } else {
                window.skillPages.push([newSkill]);
            }
        }
        
        showMessage('融合成功！获得新功法：' + newSkillName, 'success');
        return newSkill;
    } else {
        // 融合失败：损失材料
        showMessage('融合失败！材料已消耗。', 'error');
        return false;
    }
}

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
    
    var killCount = charData.killCount || 0;
    var spiritStones = window.inventory ? window.inventory.currency.spiritStones : 0;
    var bonds = Object.keys(charData.bonds || {}).length;
    var realmLevel = charData.realmLevel || 0;
    var failedBreakthroughs = charData.failedBreakthroughs || 0;
    
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
    var demonEnemy = {
        name: demon.icon + ' ' + demon.name,
        level: (charData.level || 10) + 5,
        attack: Math.floor((charData.strength || 10) * demon.battle.attack),
        defense: Math.floor((charData.constitution || 10) * demon.battle.defense),
        speed: (charData.dexterity || 10),
        health: 100 + (charData.level || 10) * 5,
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
        exp: 500 + (charData.level || 10) * 20,
        spiritStones: 200
    };
    
    charData.willpower = (charData.willpower || 0) + bonus.willpower;
    if (window.addItem) {
        window.addItem('pill_clarity', 1);
    }
    
    // 清除心魔标记
    if (charData._heartDemon) {
        delete charData._heartDemon.current;
    }
    
    // 获得「道心坚定」状态
    charData._heartDemonResolved = (charData._heartDemonResolved || 0) + 1;
    
    if (typeof window.showMessage === 'function') {
        window.showMessage('✨ 你战胜了【' + demon.name + '】！道心更加坚定！\n意志+' + bonus.willpower + '，经验+' + bonus.exp, 'success');
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
    charData.killCount = (charData.killCount || 0) + 10;
    charData.energy = Math.max(0, (charData.energy || 100) - 30);
    charData.mood = Math.max(0, (charData.mood || 50) - 20);
    
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
        const mainSkill = window.currentSkills && (window.currentSkills.main || window.currentSkills.neigong || window.currentSkills.inner);
        if (!mainSkill) return 'neutral';
        
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
            
            // 最后回退到 SKILL_ELEMENT_MAP
            if (typeof SKILL_ELEMENT_MAP !== 'undefined' && SKILL_ELEMENT_MAP[sid]) {
                return SKILL_ELEMENT_MAP[sid];
            }
        }
        
        return 'neutral';
    } catch (e) {
        console.error('获取功法元素失败:', e);
        return 'neutral';
    }
}

// 灵根修炼速度倍率：灵根值/100，无属性功法直接返回基准值
function getRootSpeedMultiplier(roots, element) {
    if (!roots) return 1.0;
    element = element || 'neutral';
    // v9.8: 0.8 + root/200 (~0.8~1.3); heaven root >80 *1.1
    if (element === 'neutral' || !element) {
        return 1.0;
    }
    const value = roots[element] || 0;
    var mul = 0.8 + value / 200;
    if (value > 80) mul *= 1.1;
    return mul;
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
// 领悟点是可变标量，使用访问器保持模块内变量与外部系统单一真源。
try {
    Object.defineProperty(window, 'insightPoints', {
        configurable: true,
        enumerable: true,
        get: function() { return insightPoints; },
        set: function(v) { insightPoints = Math.max(0, Math.floor(Number(v) || 0)); }
    });
} catch (e) { window.insightPoints = insightPoints; }
window.INSIGHT_TYPES = INSIGHT_TYPES;
window.insightEffects = insightEffects;
window.initProficiencyData = initProficiencyData;
window.saveProficiencyData = saveProficiencyData;
window.getProficiencyInfo = getProficiencyInfo;
window.addProficiencyExp = addProficiencyExp;
window.checkProficiencyUpgrade = checkProficiencyUpgrade;
window.getNextLevelRequiredExp = getNextLevelRequiredExp;
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
window.getRealmEffectDescription = getRealmEffectDescription;
window.SKILL_COMBINATIONS = SKILL_COMBINATIONS;
window.checkSkillCombinations = checkSkillCombinations;
window.getSkillCombinationBonuses = getSkillCombinationBonuses;
window.getElementalDamageMul = getElementalDamageMul;
window._getMainTechniqueElement = _getMainTechniqueElement;
window.getElementInteraction = getElementInteraction;
window.mergeSkills = mergeSkills;
window.HEART_DEMON_TYPES = HEART_DEMON_TYPES;
window.checkHeartDemonTrigger = checkHeartDemonTrigger;
window.triggerHeartDemon = triggerHeartDemon;
window.startHeartDemonBattle = startHeartDemonBattle;
window.resolveHeartDemonSuccess = resolveHeartDemonSuccess;
window.resolveHeartDemonWithInsight = resolveHeartDemonWithInsight;
window.surrenderToHeartDemon = surrenderToHeartDemon;
window.breakthroughWithHeartDemon = breakthroughWithHeartDemon;
window.SKILL_ELEMENT_MAP = SKILL_ELEMENT_MAP;
window.ELEMENT_INTERACTIONS = ELEMENT_INTERACTIONS;
// v9.6.2 灵根系统（简化版）
window.getRootSpeedMultiplier = getRootSpeedMultiplier;
window.getRootEffectMultiplier = getRootEffectMultiplier;
window.calculateCultivationExpFromRoots = calculateCultivationExpFromRoots;
window.canUseTechniqueByRoots = canUseTechniqueByRoots;
