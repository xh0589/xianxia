// ==================== cultivation-bottleneck.js - 修炼瓶颈期系统 ====================
// 每个境界中期出现瓶颈，经验无法增长，需要特殊方式突破
// 依赖：cultivation.js (proficiencyData, checkProficiencyUpgrade)
// 加载顺序：在 cultivation.js 之后，app.js 之前

// ============ 瓶颈定义 ============
const BOTTLENECK_CONFIG = {
    '炼气': { layer: 5, name: '炼气瓶颈', desc: '真气运转不畅，修为停滞不前' },
    '筑基': { layer: 4, name: '筑基瓶颈', desc: '筑基根基不稳，难有寸进' },
    '金丹': { layer: 5, name: '金丹瓶颈', desc: '金丹凝滞，难以突破' },
    '元婴': { layer: 4, name: '元婴瓶颈', desc: '元婴沉寂，无法成长' },
    '化神': { layer: 6, name: '化神瓶颈', desc: '神识受阻，难窥天道' },
    '炼虚': { layer: 5, name: '炼虚瓶颈', desc: '虚空难渡，修为停滞' },
    '合体': { layer: 4, name: '合体瓶颈', desc: '身心不合，难融一体' },
    '大乘': { layer: 7, name: '大乘瓶颈', desc: '大道难成，天堑在前' }
};

// 瓶颈突破方式
const BOTTLENECK_SOLUTIONS = [
    {
        id: 'adventure',
        name: '外出历练',
        icon: '⚔️',
        desc: '通过战斗和探索寻找突破契机',
        successRate: 0.3,
        requires: { energy: 30 },
        execute: function() {
            if (window.showMessage) window.showMessage('你外出历练，在生死搏杀中寻找突破的契机……', 'info');
            if (window.timeSystem) window.timeSystem.advanceTime(120, '外出历练');
            return Math.random() < 0.3;
        }
    },
    {
        id: 'pill',
        name: '服用丹药',
        icon: '💊',
        desc: '借助丹药之力冲击瓶颈',
        successRate: 0.5,
        requires: { item: 'pill_breakthrough', count: 1 },
        execute: function() {
            if (hasItem('pill_breakthrough', 1)) {
                consumeBottleneckItem('pill_breakthrough', 1);
                if (window.showMessage) window.showMessage('你服下突破丹，药力在体内化开，冲击瓶颈……', 'info');
                if (window.timeSystem) window.timeSystem.advanceTime(60, '服用丹药');
                return Math.random() < 0.5;
            } else {
                if (window.showMessage) window.showMessage('你没有突破丹，可以去坊市购买或自己炼制。', 'warning');
                return false;
            }
        }
    },
    {
        id: 'mentor',
        name: '高人指点',
        icon: '🧘',
        desc: '寻求修为高深者的指点',
        successRate: 0.6,
        requires: { npcAffection: 60 },
        execute: function() {
            // 找好感度最高的NPC指点
            var npc = findHighestAffectionNPC();
            if (npc && (npc.relationship?.affection || 0) >= 60) {
                if (window.showMessage) window.showMessage(npc.name + '为你指点迷津，你感到茅塞顿开！', 'success');
                npc.changeFavor(-5);
                if (window.timeSystem) window.timeSystem.advanceTime(60, '高人指点');
                return Math.random() < 0.6;
            } else {
                if (window.showMessage) window.showMessage('你没有足够亲密的高人朋友可以指点你。', 'warning');
                return false;
            }
        }
    },
    {
        id: 'enlightenment',
        name: '静坐顿悟',
        icon: '💡',
        desc: '消耗领悟点数，尝试顿悟突破',
        successRate: 0.7,
        requires: { insightPoints: 2 },
        execute: function() {
            if (typeof window.insightPoints !== 'undefined' && window.insightPoints >= 2) {
                window.insightPoints -= 2;
                if (window.showMessage) window.showMessage('你消耗2点领悟点数，进入顿悟状态……', 'info');
                if (window.timeSystem) window.timeSystem.advanceTime(240, '静坐顿悟');
                return Math.random() < 0.7;
            } else {
                if (window.showMessage) window.showMessage('领悟点数不足（需要2点），继续修炼积累领悟。', 'warning');
                return false;
            }
        }
    },
    {
        id: 'breakthrough',
        name: '强行突破',
        icon: '💥',
        desc: '不顾一切强行冲击瓶颈（成功率低，失败有风险）',
        successRate: 0.2,
        requires: { energy: 50, qi: 50 },
        execute: function() {
            if (window.showMessage) window.showMessage('你强行运转真气，不顾一切地冲击瓶颈！', 'warning');
            var charData = window.currentCharData;
            if (charData) {
                charData.energy = Math.max(0, (charData.energy || 100) - 20);
                charData.qi = Math.max(0, (charData.qi || 100) - 20);
            }
            if (window.timeSystem) window.timeSystem.advanceTime(120, '强行突破');
            var success = Math.random() < 0.2;
            if (!success && window.showMessage) {
                window.showMessage('强行突破失败，经脉受损！修炼速度-20%持续2天', 'error');
                if (charData) {
                    if (!charData._debuffs) charData._debuffs = [];
                    charData._debuffs.push({ name: '经脉受损', effect: { cultivationSpeed: -20 }, remainingDays: 2, appliedDay: window.gameTime ? window.gameTime.currentDay : 1 });
                }
            }
            return success;
        }
    }
];

// ============ 玩家瓶颈状态 ============
var playerBottleneck = {
    isInBottleneck: false,
    bottleneckRealm: '',
    bottleneckLayer: 0,
    heartDemonChance: 0,  // 瓶颈中心魔滋生概率
    attempts: 0            // 尝试突破次数
};

// ============ 检查是否处于瓶颈期 ============
function checkBottleneck(realm, layer) {
    var config = BOTTLENECK_CONFIG[realm];
    return config && layer >= config.layer;
}

// ============ 应用瓶颈效果 ============
function applyBottleneckEffect() {
    var charData = window.currentCharData;
    if (!charData) return;

    var realm = charData.realm || '炼气';
    var layer = charData.layer || 1;

    if (checkBottleneck(realm, layer)) {
        if (!playerBottleneck.isInBottleneck) {
            playerBottleneck.isInBottleneck = true;
            playerBottleneck.bottleneckRealm = realm;
            playerBottleneck.bottleneckLayer = layer;
            playerBottleneck.heartDemonChance = 0.05;
            playerBottleneck.attempts = 0;
            var config = BOTTLENECK_CONFIG[realm];
            if (window.showMessage) {
                window.showMessage('⚠️ 你遇到了【' + config.name + '】！修为无法继续提升，需要寻找突破之法。', 'warning');
            }
        }
        // 瓶颈期修炼经验减半
        playerBottleneck.heartDemonChance = Math.min(0.3, playerBottleneck.heartDemonChance + 0.01);
        return true;
    } else {
        if (playerBottleneck.isInBottleneck) {
            playerBottleneck.isInBottleneck = false;
            playerBottleneck.heartDemonChance = 0;
            if (window.showMessage) window.showMessage('✅ 瓶颈已突破，修为继续提升！', 'success');
        }
        return false;
    }
}

// ============ 尝试突破瓶颈 ============
function attemptBreakBottleneck() {
    if (!playerBottleneck.isInBottleneck) {
        if (window.showMessage) window.showMessage('你当前没有遇到瓶颈。', 'info');
        return;
    }

    var charData = window.currentCharData;
    if (!charData) return;

    var config = BOTTLENECK_CONFIG[playerBottleneck.bottleneckRealm];
    if (!config) return;

    // 构建瓶颈突破UI
    var modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50';
    modal.style.backdropFilter = 'blur(4px)';
    modal.onclick = function(e) { if (e.target === modal) modal.remove(); };

    var solutionsHtml = '';
    for (var i = 0; i < BOTTLENECK_SOLUTIONS.length; i++) {
        var sol = BOTTLENECK_SOLUTIONS[i];
        solutionsHtml += '<button onclick="executeBottleneckSolution(' + i + ')" class="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-white transition border border-gray-600 hover:border-yellow-500/50">' +
            '<div class="flex items-center gap-2"><span class="text-lg">' + sol.icon + '</span><span class="font-bold">' + sol.name + '</span><span class="text-xs text-gray-400 ml-auto">成功率' + Math.round(sol.successRate * 100) + '%</span></div>' +
            '<p class="text-xs text-gray-400 mt-1">' + sol.desc + '</p></button>';
    }

    modal.innerHTML = '<div class="bg-gray-800 border-2 border-purple-600/50 rounded-xl p-6 max-w-lg w-full mx-4" style="box-shadow: 0 0 40px rgba(147,51,234,0.1);">' +
        '<div class="text-center mb-4"><div class="text-5xl mb-2">🔒</div><h3 class="text-xl font-bold text-purple-500">' + config.name + '</h3><p class="text-sm text-gray-400 mt-1">' + config.desc + '</p></div>' +
        '<div class="bg-purple-900/30 rounded-lg p-3 mb-4 border border-purple-600/30"><p class="text-sm text-purple-300">当前境界：' + playerBottleneck.bottleneckRealm + ' ' + playerBottleneck.bottleneckLayer + '层<br>心魔滋生概率：' + Math.round(playerBottleneck.heartDemonChance * 100) + '%<br>尝试次数：' + playerBottleneck.attempts + '次</p></div>' +
        '<div class="space-y-2 mb-4">' + solutionsHtml + '</div>' +
        '<div class="flex justify-center"><button onclick="this.closest(\'.fixed\').remove()" class="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded-lg transition">暂时不管</button></div>' +
    '</div>';

    document.body.appendChild(modal);
}

// ============ 执行瓶颈突破方式 ============
function executeBottleneckSolution(solutionIndex) {
    var sol = BOTTLENECK_SOLUTIONS[solutionIndex];
    if (!sol) return;

    // 检查需求
    if (sol.requires.energy) {
        var charData = window.currentCharData;
        if (charData && (charData.energy || 100) < sol.requires.energy) {
            if (window.showMessage) window.showMessage('精力不足（需要≥' + sol.requires.energy + '），请先休息恢复。', 'warning');
            return;
        }
    }

    // 执行
    var success = sol.execute();

    if (success) {
        // 突破成功！清除瓶颈
        playerBottleneck.isInBottleneck = false;
        playerBottleneck.heartDemonChance = 0;
        playerBottleneck.attempts = 0;

        // 增加大量经验
        if (typeof window.addProficiencyExp === 'function') {
            // 给所有装备功法增加经验
            var skills = window.currentSkills || {};
            for (var key in skills) {
                if (skills[key]) {
                    window.addProficiencyExp(skills[key].id, 200);
                }
            }
        }

        // 给突破加成
        if (typeof window._bottleneckBonus !== 'undefined') {
            window._bottleneckBonus = 0.2; // 下次突破+20%
        }

        if (window.showMessage) window.showMessage('🎉 瓶颈突破！修为继续提升！', 'success');

        // 关闭UI
        var modal = document.querySelector('.fixed.z-50');
        if (modal) modal.remove();
    } else {
        playerBottleneck.attempts++;

        // 失败时心魔滋生
        if (Math.random() < playerBottleneck.heartDemonChance) {
            if (typeof window.triggerHeartDemon === 'function') {
                if (window.showMessage) window.showMessage('💀 瓶颈未破，心魔滋生！', 'error');
                window.triggerHeartDemon();
            }
        }
    }
}

// ============ 辅助函数 ============
function hasItem(itemId, count) {
    if (!window.inventory || !window.inventory.slots) return false;
    var total = 0;
    for (var i = 0; i < window.inventory.slots.length; i++) {
        var slot = window.inventory.slots[i];
        if (slot && slot.templateId === itemId) {
            total += slot.count || 1;
        }
    }
    return total >= (count || 1);
}

function consumeBottleneckItem(itemId, count) {
    if (!window.inventory || !window.inventory.slots) return;
    for (var i = 0; i < window.inventory.slots.length; i++) {
        var slot = window.inventory.slots[i];
        if (slot && slot.templateId === itemId) {
            // F-14：inventory 对象无 removeItem 方法（全局 removeItem 才是），原调用 typeof 检查失败静默跳过→瓶颈服丹从不消耗
            if (typeof window.removeItem === 'function') {
                window.removeItem(slot.uid, count || 1);
            } else if (typeof slot.removeCount === 'function') {
                slot.removeCount(count || 1);
                if (slot.count <= 0) window.inventory.slots[i] = null;
            }
            return;
        }
    }
}

function findHighestAffectionNPC() {
    if (!window.npcManager) return null;
    var npcs = window.npcManager.getAllNPCs();
    var best = null, bestAff = 0;
    for (var i = 0; i < npcs.length; i++) {
        var aff = npcs[i].relationship?.affection || 0;
        if (aff > bestAff) { bestAff = aff; best = npcs[i]; }
    }
    return best;
}

// ============ 修炼系统钩子 ============
// 不再覆盖 window.cultivateSkill；由修炼系统主动查询瓶颈惩罚。
function applyCultivationBottleneckPenalty(amount) {
    amount = Number(amount) || 10;
    var charData = window.currentCharData;
    if (!charData) return amount;
    var realm = charData.realm || '炼气';
    var layer = charData.layer || 1;
    if (!checkBottleneck(realm, layer)) return amount;
    if (window.showMessage) window.showMessage('🔒 瓶颈阻碍，修炼效率仅30%', 'warning');
    if (Math.random() < playerBottleneck.heartDemonChance && typeof window.triggerHeartDemon === 'function') {
        window.triggerHeartDemon();
    }
    return Math.max(1, Math.floor(amount * 0.3));
}

// ============ 导出 ============
if (typeof window !== 'undefined') {
    window.BOTTLENECK_CONFIG = BOTTLENECK_CONFIG;
    window.checkBottleneck = checkBottleneck;
    window.applyBottleneckEffect = applyBottleneckEffect;
    window.attemptBreakBottleneck = attemptBreakBottleneck;
    window.executeBottleneckSolution = executeBottleneckSolution;
    window.playerBottleneck = playerBottleneck;
    window.BOTTLENECK_SOLUTIONS = BOTTLENECK_SOLUTIONS;
    window.applyCultivationBottleneckPenalty = applyCultivationBottleneckPenalty;
}