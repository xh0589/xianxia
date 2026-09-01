// ==================== party-system.js - 队伍系统 ====================
// 借鉴《觅长生》、《仙剑奇侠传》的队伍设计

// ============ 队伍成员状态 ============
class PartyMember {
    constructor(npcData) {
        this.id = npcData.id || `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.name = npcData.name || '未知修士';
        this.gender = npcData.gender || 'male';
        this.level = npcData.level || 1;
        this.realm = npcData.realm || '炼气';
        this.layer = npcData.layer || 1;
        this.health = npcData.health || 100;
        this.maxHealth = npcData.maxHealth || 100;
        this.qi = npcData.qi || 50;
        this.maxQi = npcData.maxQi || 50;
        this.energy = npcData.energy || 100;
        this.maxEnergy = npcData.maxEnergy || 100;
        
        // 属性
        this.attributes = npcData.attributes || {
            strength: 10,
            dexterity: 10,
            intelligence: 10,
            constitution: 10,
            willpower: 10
        };
        
        // 装备
        this.equipment = npcData.equipment || {};
        
        // 战斗技能（内功/轻功/绝技等9项）— v12.3.1 修复：recruitNPC 传入但构造函数此前丢弃，
        // 导致读档重建实例后 battle.js 读不到 member.combatSkills
        this.combatSkills = npcData.combatSkills || {};

        // v15.2 绝技（battle.js COMBAT_ABILITIES 注册表 id 数组）——队友学绝技权威值，
        // 经「玩家已掌握绝技直接传授」获得，随队伍整包持久化；旧档缺键默认空
        this.combatAbilities = Array.isArray(npcData.combatAbilities) ? npcData.combatAbilities.slice() : [];
        
        // 功法
        this.skills = npcData.skills || [];
        
        // 与玩家关系
        this.relationship = {
            affection: npcData.affection || 0,
            trust: npcData.trust || 0,
            loyalty: npcData.loyalty || 50
        };
        
        // 战斗状态
        this.battleState = {
            active: true,
            autoBattle: false,
            targetPriority: 'enemy_strongest' // enemy_strongest, enemy_weakest, random
        };
        
        // 加入时间
        this.joinTime = Date.now();
    }
    
    // 检查是否存活
    isAlive() {
        return this.health > 0;
    }
    
    // 获得经验
    gainExp(amount) {
        this.exp = this.exp || 0;
        this.expMax = this.expMax || this.level * 100;
        this.exp += amount;
        
        if (this.exp >= this.expMax) {
            this.levelUp();
        }
    }
    
    // 升级
    levelUp() {
        this.level++;
        this.exp = this.exp - this.expMax;
        this.expMax = Math.floor(this.expMax * 1.2);
        
        // 属性提升
        this.maxHealth += 10;
        this.health = this.maxHealth;
        this.maxQi += 5;
        this.qi = this.maxQi;
        
        this.attributes.strength += 1;
        this.attributes.dexterity += 1;
        this.attributes.intelligence += 1;
        this.attributes.constitution += 1;
        this.attributes.willpower += 1;
    }
    
    // 恢复状态
    restore(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
        this.qi = Math.min(this.maxQi, this.qi + amount);
        this.energy = Math.min(this.maxEnergy, this.energy + amount);
    }
    
    // 受到伤害
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
        }
    }
}

// ============ 队伍数据 ============
let partyData = {
    members: [],           // 队伍成员列表
    maxMembers: 4,         // 最大队伍人数
    leaderId: null,        // 队长ID
    formation: 'default',  // 阵型
    battleLog: [],         // 战斗日志
    totalBattles: 0,       // 总战斗数
    wonBattles: 0          // 获胜战斗数
};

// ============ 阵型定义 ============
const FORMATIONS = {
    default: {
        id: 'default',
        name: '标准阵',
        description: '均衡的阵型',
        bonuses: {
            attack: 1.0,
            defense: 1.0,
            speed: 1.0
        }
    },
    attack: {
        id: 'attack',
        name: '攻击阵',
        description: '提升攻击力，降低防御力',
        bonuses: {
            attack: 1.2,
            defense: 0.9,
            speed: 1.1
        }
    },
    defense: {
        id: 'defense',
        name: '防御阵',
        description: '提升防御力，降低攻击力',
        bonuses: {
            attack: 0.9,
            defense: 1.2,
            speed: 0.9
        }
    },
    speed: {
        id: 'speed',
        name: '速度阵',
        description: '提升速度，优先出手',
        bonuses: {
            attack: 1.05,
            defense: 1.0,
            speed: 1.3
        }
    },
    healing: {
        id: 'healing',
        name: '治疗阵',
        description: '提升治疗效果',
        bonuses: {
            attack: 0.9,
            defense: 1.05,
            healing: 1.3
        }
    },
    sacrifice: {
        id: 'sacrifice',
        name: '牺牲阵',
        description: '队员死亡后属性转移给存活队员',
        bonuses: {
            attack: 1.1,
            defense: 1.1,
            sacrifice: true
        }
    }
};

// ============ NPC招募对话树 ============
const recruitmentDialogues = {
    lowAffection: [
        '我为什么要跟你走？',
        '你凭什么让我跟随你？',
        '先证明你的实力再说。'
    ],
    midAffection: [
        '或许我们可以一起行动...',
        '我需要时间考虑一下。',
        '你有什么好处给我？'
    ],
    highAffection: [
        '好，我跟你走！',
        '我一直想和你一起冒险。',
        '没问题，随时为你效力。'
    ]
};

// ============ 初始化队伍系统 ============
function initPartySystem() {
    const saved = localStorage.getItem('xianxia_party_data');
    if (saved) {
        try {
            var parsed = JSON.parse(saved);
            partyData.members = parsed.members || [];
            partyData.maxMembers = parsed.maxMembers || 4;
            partyData.leaderId = parsed.leaderId || null;
            partyData.formation = parsed.formation || 'default';
            partyData.battleLog = parsed.battleLog || [];
            partyData.totalBattles = parsed.totalBattles || 0;
            partyData.wonBattles = parsed.wonBattles || 0;
            // 确保所有成员都是PartyMember实例
            partyData.members = partyData.members.map(function(memberData) {
                if (memberData instanceof PartyMember) {
                    return memberData;
                }
                return new PartyMember(memberData);
            });
        } catch (e) {
            console.error('加载队伍数据失败:', e);
            partyData.members = [];
            partyData.leaderId = null;
            partyData.formation = 'default';
        }
    }
}

// ============ 保存队伍数据 ============
function savePartyData() {
    localStorage.setItem('xianxia_party_data', JSON.stringify(partyData));
}

// ============ 招募NPC加入队伍 ============
function recruitNPC(npcId) {
    const npc = window.npcManager?.getNPC(npcId);
    if (!npc) {
        showMessage('找不到该NPC', 'error');
        return false;
    }
    
    // 检查是否已在队伍中
    if (partyData.members.some(function(m) { return m.id === npcId; })) {
        showMessage(npc.name + ' 已经在队伍中了', 'warning');
        return false;
    }
    
    // 检查队伍是否已满
    if (partyData.members.length >= partyData.maxMembers) {
        showMessage('队伍已满，无法招募更多成员', 'error');
        return false;
    }
    
    // 检查好感度是否足够
    if (npc.relationship.affection < 50) {
        showMessage('好感度不足，无法招募', 'warning');
        return false;
    }
    
    // 创建队伍成员（从NPC的combat/主属性/战斗技能读取）
    // 血量：从npc.state.health读取当前生命，maxHealth根据境界推导
    var npcHealth = npc.state?.health || 100;
    var realmHpMap = { '凡人': 80, '炼气': 100, '筑基': 150, '金丹': 250, '元婴': 400, '化神': 600 };
    var realmName = npc.combat?.realm || '炼气';
    var baseHp = realmHpMap[realmName] || 100;
    var npcMaxHealth = baseHp + (npc.combat?.layer || 1) * 10;
    var npcQi = Math.min(npc.state?.qi || 50, npcMaxHealth);
    var npcMaxQi = npcMaxHealth;
    const member = new PartyMember({
        id: npcId,
        name: npc.name,
        gender: npc.gender,
        level: npc.combat?.level || 1,
        realm: npc.combat?.realm || '炼气',
        layer: npc.combat?.layer || 1,
        health: Math.min(npcHealth, npcMaxHealth),
        maxHealth: npcMaxHealth,
        qi: Math.min(npcQi, npcMaxQi),
        maxQi: npcMaxQi,
        // 主属性（力量/灵巧/神识/意志/体质/经脉）— 决定攻击/防御/速度
        attributes: npc.mainAttributes || npc.attributes || {},
        // 战斗技能（内功/轻功/绝技/拳掌/剑法/刀法/长兵/奇门/射术）— 影响攻击/速度加成
        combatSkills: npc.combatSkills || {},
        // 掌握的具体功法（战斗中可使用的招式）
        skills: npc.skills || [],
        affection: npc.relationship?.affection || 0
    });
    
    // 添加到队伍
    partyData.members.push(member);
    
    // ===== 新增：同步位置+开启跟随 =====
    var playerLoc = window.currentCharData?.location || '未知';
    npc.location = playerLoc;
    npc.state.location = playerLoc;
    npc.isFollowing = true;
    
    // 设置队长（如果是第一个成员）
    if (!partyData.leaderId) {
        partyData.leaderId = member.id;
    }
    
    // 更新NPC状态
    if (window.updateNPCStatus) {
        window.updateNPCStatus(npcId, 'in_party');
    }
    
    savePartyData();
    showMessage(`${npc.name} 加入了队伍！`, 'success');
    updatePartyUI();
    return true;
}

// ============ 移除队伍成员 ============
function removeMember(memberId) {
    const index = partyData.members.findIndex(m => m.id === memberId);
    if (index === -1) {
        showMessage('找不到该队员', 'error');
        return false;
    }
    
    const member = partyData.members[index];
    
    // 如果是队长，需要重新指定
    if (partyData.leaderId === memberId) {
        if (partyData.members.length > 1) {
            // 选择新的队长
            const newIndex = index > 0 ? index - 1 : 0;
            partyData.leaderId = partyData.members[newIndex].id;
        } else {
            partyData.leaderId = null;
        }
    }
    
    // 从队伍中移除
    const removed = partyData.members.splice(index, 1)[0];
    
    // 更新NPC状态
    if (window.updateNPCStatus) {
        window.updateNPCStatus(memberId, 'free');
    }
    
    // P0-5: 离队后重置跟随状态，NPC恢复自主生活
    var npc = window.npcManager?.getNPC(memberId);
    if (npc) {
        npc.isFollowing = false;
        npc.followTarget = null;
    }
    
    savePartyData();
    showMessage(`${removed.name} 离开了队伍`, 'info');
    updatePartyUI();
    return true;
}

// ============ 设置队长 ============
function setLeader(memberId) {
    const member = partyData.members.find(m => m.id === memberId);
    if (!member) {
        showMessage('找不到该队员', 'error');
        return false;
    }
    
    partyData.leaderId = memberId;
    savePartyData();
    showMessage(`${member.name} 成为了新的队长`, 'info');
    updatePartyUI();
    return true;
}

// ============ 切换阵型 ============
function changeFormation(formationId) {
    const formation = FORMATIONS[formationId];
    if (!formation) {
        showMessage('找不到该阵型', 'error');
        return false;
    }
    
    partyData.formation = formationId;
    savePartyData();
    showMessage(`切换到阵型：${formation.name}`, 'info');
    updatePartyUI();
    return true;
}

// ============ 获取当前阵型加成 ============
function getFormationBonuses() {
    const formation = FORMATIONS[partyData.formation];
    return formation ? formation.bonuses : FORMATIONS.default.bonuses;
}

// ============ 战斗中使用队伍（已废弃，Battle类自动处理）============
function usePartyInBattle(battle) {}

// ============ 执行队员操作（已废弃）============
function executeMemberAction(member, battle) {}

// ============ 添加战斗日志 ============
function addBattleLog(message, type = 'info') {
    partyData.battleLog.push({
        message,
        type,
        timestamp: Date.now()
    });
    
    // 限制日志数量
    if (partyData.battleLog.length > 100) {
        partyData.battleLog = partyData.battleLog.slice(-50);
    }
}

// ============ 分配装备给队员 ============
function equipMember(memberId, slot, item) {
    const member = partyData.members.find(m => m.id === memberId);
    if (!member) return false;
    
    member.equipment[slot] = item;
    savePartyData();
    showMessage(`为 ${member.name} 装备了 ${item.name}`, 'info');
    updatePartyUI();
    return true;
}

// ============ 教授功法给队员 ============
function teachSkillToMember(memberId, skillId) {
    const member = partyData.members.find(m => m.id === memberId);
    if (!member) return false;
    
    // 检查队员是否已学会该功法
    if (member.skills.find(s => s.id === skillId)) {
        showMessage('队员已经学会该功法', 'warning');
        return false;
    }
    
    // 查找功法
    const skill = window.findSkillById(skillId);
    if (!skill) {
        showMessage('找不到该功法', 'error');
        return false;
    }
    
    // 学会功法
    member.skills.push({...skill});
    savePartyData();
    showMessage(`教会了 ${member.name} ${skill.name}`, 'success');
    updatePartyUI();
    return true;
}

// ============ 队员休息 ============
function restMember(memberId) {
    const member = partyData.members.find(m => m.id === memberId);
    if (!member) return false;
    
    member.restore(30);
    advanceTimeByMemberRest(memberId);
    savePartyData();
    showMessage(`${member.name} 休息了一会儿，恢复了状态`, 'info');
    updatePartyUI();
    return true;
}

// ============ 根据队员休息推进时间 ============
function advanceTimeByMemberRest(memberId) {
    if (window.timeSystem && window.timeSystem.advanceTime) {
        window.timeSystem.advanceTime(60); // 休息1小时
    }
}

// ============ 获取队伍总战力 ============
function getPartyTotalPower() {
    let totalPower = 0;
    
    partyData.members.forEach(member => {
        if (member.isAlive()) {
            totalPower += member.level * 10;
            totalPower += (member.attributes.strength + member.attributes.intelligence) * 2;
            
            // 装备加成
            Object.values(member.equipment).forEach(item => {
                if (item && item.combatBonus) {
                    totalPower += item.combatBonus.attack || 0;
                }
            });
        }
    });
    
    // 阵型加成
    const bonuses = getFormationBonuses();
    totalPower *= bonuses.attack;
    
    return Math.floor(totalPower);
}

// ============ 获取存活队员数 ============
function getAliveMemberCount() {
    return partyData.members.filter(m => m.isAlive()).length;
}

// ============ 初始化阵型选择选项 ============
function initFormationOptions() {
    const formationSelect = document.getElementById('formation-select');
    if (!formationSelect || formationSelect.options.length > 0) return;
    
    formationSelect.innerHTML = Object.values(FORMATIONS).map(f => `
        <option value="${f.id}" ${f.id === partyData.formation ? 'selected' : ''}>
            ${f.name} - ${f.description}
        </option>
    `).join('');
}

// ============ 更新队伍UI ============
function updatePartyUI() {
    // 初始化阵型选项（如果尚未初始化）
    initFormationOptions();
    
    // 更新panel-party中的内容
    const membersList = document.getElementById('party-members-list');
    if (membersList) {
        membersList.innerHTML = '';
        
        if (partyData.members.length === 0) {
            membersList.innerHTML = '<p class="text-gray-500 text-sm">暂无队员</p>';
        } else {
            partyData.members.forEach(member => {
                const memberElement = createMemberElement(member);
                membersList.appendChild(memberElement);
            });
        }
    }
    
    // 更新阵型选择
    const formationSelect = document.getElementById('formation-select');
    if (formationSelect) {
        formationSelect.value = partyData.formation;
    }
    // v12.3.1：阵型加成数值展示
    updateFormationBonusDisplay();
    
    // 更新战力显示
    const powerDisplay = document.getElementById('party-power-display');
    if (powerDisplay) {
        powerDisplay.textContent = `总战力: ${getPartyTotalPower()}`;
    }
    
    // 更新队员数量显示
    const countDisplay = document.getElementById('party-member-count-display');
    if (countDisplay) {
        countDisplay.textContent = partyData.members.length;
    }
    const maxDisplay = document.getElementById('party-max-members-display');
    if (maxDisplay) {
        maxDisplay.textContent = partyData.maxMembers;
    }
    
    // 更新战斗日志
    const battleLog = document.getElementById('party-battle-log');
    if (battleLog) {
        battleLog.innerHTML = partyData.battleLog.slice(-10).map(log =>
            `<p>[${new Date(log.timestamp).toLocaleTimeString()}] ${log.message}</p>`
        ).join('');
    }
}

// ============ 创建队员元素 ============
// ==================== v12.3.1 队伍面板UI增强 ====================
// 战斗策略标签
const MEMBER_STRATEGY_LABELS = {
    enemy_strongest: '⚔️ 攻强',
    enemy_weakest: '🎯 攻弱',
    random: '🎲 随机'
};

// 职业标签：优先取NPC原始职业，否则按最高战斗技能推断定位
function getMemberRoleLabel(member) {
    try {
        var npc = window.npcManager && window.npcManager.getNPC ? window.npcManager.getNPC(member.id) : null;
        if (npc && npc.occupation) return String(npc.occupation);
    } catch (e) {}
    var cs = member.combatSkills || {};
    var best = '', bestVal = -1;
    for (var k in cs) {
        if (cs.hasOwnProperty(k) && typeof cs[k] === 'number' && cs[k] > bestVal) { best = k; bestVal = cs[k]; }
    }
    if (!best) return '修士';
    if (best === '内功') return '护法';
    if (best === '轻功') return '游侠';
    if (best === '医术') return '医师';
    return '武者';
}

function createMemberElement(member) {
    const div = document.createElement('div');
    div.className = 'p-3 bg-gray-800 rounded mb-2';

    const isLeader = partyData.leaderId === member.id;
    const healthPercent = Math.floor((member.health / member.maxHealth) * 100);
    const qiPercent = Math.floor((member.qi / member.maxQi) * 100);

    // v12.3.1：职业标签 / 忠诚度条 / 战斗策略
    const roleLabel = getMemberRoleLabel(member);
    const loyalty = (member.relationship && member.relationship.loyalty != null) ? member.relationship.loyalty : 50;
    const loyaltyColor = loyalty >= 80 ? 'bg-green-500' : (loyalty >= 50 ? 'bg-yellow-500' : (loyalty >= 30 ? 'bg-orange-500' : 'bg-red-500'));
    const strategy = (member.battleState && member.battleState.targetPriority) || 'enemy_strongest';
    const strategyLabel = MEMBER_STRATEGY_LABELS[strategy] || strategy;

    div.innerHTML = `
        <div class="flex justify-between items-start">
            <div class="flex-1">
                <p class="font-bold ${isLeader ? 'text-yellow-400' : 'text-white'}">
                    ${isLeader ? '[队长] ' : ''}${member.name}
                    <span class="text-xs px-1.5 py-0.5 rounded bg-purple-900 text-purple-300 ml-1">${roleLabel}</span>
                    <span class="text-xs text-gray-400 ml-1">Lv.${member.level}</span>
                </p>
                <p class="text-xs text-gray-400">${member.realm} ${getPartyLayerName(member.layer)}期</p>

                <!-- 状态条 -->
                <div class="mt-1">
                    <div class="flex items-center mb-1">
                        <span class="text-xs text-red-400 w-6">HP</span>
                        <div class="flex-1 bg-gray-700 h-2 rounded">
                            <div class="bg-red-500 h-2 rounded" style="width: ${healthPercent}%"></div>
                        </div>
                        <span class="text-xs text-gray-400 ml-1">${member.health}/${member.maxHealth}</span>
                    </div>
                    <div class="flex items-center">
                        <span class="text-xs text-blue-400 w-6">Qi</span>
                        <div class="flex-1 bg-gray-700 h-2 rounded">
                            <div class="bg-blue-500 h-2 rounded" style="width: ${qiPercent}%"></div>
                        </div>
                        <span class="text-xs text-gray-400 ml-1">${member.qi}/${member.maxQi}</span>
                    </div>
                    <!-- v12.3.1 忠诚度条 -->
                    <div class="flex items-center mt-1">
                        <span class="text-xs text-pink-400 w-6">❤️</span>
                        <div class="flex-1 bg-gray-700 h-2 rounded">
                            <div class="${loyaltyColor} h-2 rounded" style="width: ${loyalty}%"></div>
                        </div>
                        <span class="text-xs text-gray-400 ml-1">忠诚 ${loyalty}</span>
                    </div>
                </div>

                <!-- 操作按钮 -->
                <div class="mt-2 flex flex-wrap gap-1">
                    <button onclick="cycleMemberStrategy('${member.id}')" class="text-xs bg-indigo-700 hover:bg-indigo-600 px-2 py-1 rounded" title="切换战斗目标策略">
                        策略:${strategyLabel}
                    </button>
                    <button onclick="showMemberEquipModal('${member.id}')" class="text-xs bg-amber-700 hover:bg-amber-600 px-2 py-1 rounded">
                        装备
                    </button>
                    <button onclick="showMemberSkillModal('${member.id}')" class="text-xs bg-cyan-700 hover:bg-cyan-600 px-2 py-1 rounded">
                        技能
                    </button>
                    <button onclick="showMemberAbilityModal('${member.id}')" class="text-xs bg-orange-700 hover:bg-orange-600 px-2 py-1 rounded" title="绝技（COMBAT_ABILITIES）查看与传授">
                        绝技
                    </button>
                    <button onclick="showMemberDetailModal('${member.id}')" class="text-xs bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded">
                        详情
                    </button>
                    ${!isLeader ? `
                        <button onclick="setLeader('${member.id}')" class="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded">
                            设队长
                        </button>
                    ` : ''}
                    <button onclick="restMember('${member.id}')" class="text-xs bg-green-600 hover:bg-green-700 px-2 py-1 rounded">
                        休息
                    </button>
                    <button onclick="removeMember('${member.id}')" class="text-xs bg-red-600 hover:bg-red-700 px-2 py-1 rounded">
                        离队
                    </button>
                </div>
            </div>
        </div>
    `;

    return div;
}

// ============ 切换队员战斗目标策略 ============
const MEMBER_STRATEGY_ORDER = ['enemy_strongest', 'enemy_weakest', 'random'];
function cycleMemberStrategy(memberId) {
    const member = partyData.members.find(m => m.id === memberId);
    if (!member) { showMessage('找不到该队员', 'error'); return false; }
    if (!member.battleState) member.battleState = { active: true, autoBattle: false, targetPriority: 'enemy_strongest' };
    const cur = MEMBER_STRATEGY_ORDER.indexOf(member.battleState.targetPriority || 'enemy_strongest');
    member.battleState.targetPriority = MEMBER_STRATEGY_ORDER[(cur + 1) % MEMBER_STRATEGY_ORDER.length];
    savePartyData();
    showMessage(`${member.name} 的目标策略：${MEMBER_STRATEGY_LABELS[member.battleState.targetPriority]}`, 'info');
    updatePartyUI();
    return true;
}

// ============ 获取境界层名称 ============
function getPartyLayerName(layer) {
    return ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'][layer] || layer;
}

// ==================== v12.3.1 队员弹窗系统（详情/装备/技能） ====================
function _ensurePartyModalOverlay() {
    var overlay = document.getElementById('party-member-modal-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'party-member-modal-overlay';
        overlay.className = 'fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50';
        overlay.style.display = 'none';
        overlay.addEventListener('click', function(e) { if (e.target === overlay) closePartyMemberModal(); });
        document.body.appendChild(overlay);
    }
    return overlay;
}

function openPartyMemberModal(title, bodyHtml) {
    var overlay = _ensurePartyModalOverlay();
    overlay.innerHTML = '<div class="bg-gray-800 border-2 border-amber-700 rounded-xl p-5 max-w-lg w-full mx-4 max-h-[85vh] overflow-y-auto">'
        + '<div class="flex justify-between items-center mb-3">'
        + '<h3 class="text-lg font-bold text-amber-400">' + title + '</h3>'
        + '<button onclick="closePartyMemberModal()" class="text-gray-400 hover:text-white text-xl leading-none">&times;</button>'
        + '</div><div>' + bodyHtml + '</div></div>';
    overlay.style.display = 'flex';
}

function closePartyMemberModal() {
    var overlay = document.getElementById('party-member-modal-overlay');
    if (overlay) { overlay.style.display = 'none'; overlay.innerHTML = ''; }
}
window.closePartyMemberModal = closePartyMemberModal;

// ============ 队员详情面板 ============
function showMemberDetailModal(memberId) {
    const member = partyData.members.find(m => m.id === memberId);
    if (!member) { showMessage('找不到该队员', 'error'); return; }
    var attrNames = { strength: '力量', dexterity: '灵巧', intelligence: '神识', willpower: '意志', constitution: '体质', meridian: '经脉' };
    var attrsHtml = '';
    for (var k in attrNames) {
        if (attrNames.hasOwnProperty(k) && member.attributes && member.attributes[k] != null) {
            attrsHtml += '<div class="flex justify-between"><span class="text-gray-400">' + attrNames[k] + '</span><span>' + member.attributes[k] + '</span></div>';
        }
    }
    var csHtml = '';
    var cs = member.combatSkills || {};
    for (var sk in cs) {
        if (cs.hasOwnProperty(sk)) csHtml += '<span class="inline-block bg-gray-700 rounded px-1.5 py-0.5 mr-1 mb-1 text-xs">' + sk + ' ' + cs[sk] + '</span>';
    }
    var slotNames = { mainHand: '主手', offHand: '副手', head: '头部', body: '身体', accessory: '饰品' };
    var eqHtml = '';
    for (var slot in slotNames) {
        if (!slotNames.hasOwnProperty(slot)) continue;
        var it = member.equipment ? member.equipment[slot] : null;
        eqHtml += '<div class="flex justify-between"><span class="text-gray-400">' + slotNames[slot] + '</span><span class="' + (it ? 'text-green-400' : 'text-gray-600') + '">' + (it ? it.name : '未装备') + '</span></div>';
    }
    var rel = member.relationship || {};
    var joinDate = member.joinTime ? new Date(member.joinTime).toLocaleDateString() : '未知';
    var html = ''
        + '<p class="text-xs text-gray-400 mb-1">主属性：</p>'
        + '<div class="grid grid-cols-2 gap-x-4 text-sm mb-3">' + (attrsHtml || '<span class="text-gray-600 text-xs">无数据</span>') + '</div>'
        + '<p class="text-xs text-gray-400 mb-1">战斗技能：</p><div class="mb-3">' + (csHtml || '<span class="text-gray-600 text-xs">无</span>') + '</div>'
        + '<p class="text-xs text-gray-400 mb-1">装备总览：</p><div class="text-sm space-y-0.5 mb-3">' + eqHtml + '</div>'
        + '<div class="text-sm space-y-0.5 border-t border-gray-700 pt-2">'
        + '<div class="flex justify-between"><span class="text-gray-400">好感 / 信任 / 忠诚</span><span>' + (rel.affection || 0) + ' / ' + (rel.trust || 0) + ' / ' + (rel.loyalty != null ? rel.loyalty : 50) + '</span></div>'
        + '<div class="flex justify-between"><span class="text-gray-400">加入时间</span><span>' + joinDate + '</span></div>'
        + '<div class="flex justify-between"><span class="text-gray-400">队伍战绩</span><span>' + (partyData.wonBattles || 0) + ' 胜 / ' + (partyData.totalBattles || 0) + ' 战</span></div>'
        + '</div>';
    openPartyMemberModal(member.name + ' · 详情', html);
}

// ============ 装备管理面板 ============
function showMemberEquipModal(memberId) {
    const member = partyData.members.find(m => m.id === memberId);
    if (!member) { showMessage('找不到该队员', 'error'); return; }
    var slots = [{ id: 'mainHand', name: '主手武器' }, { id: 'body', name: '身体防具' }, { id: 'accessory', name: '饰品' }];
    var html = '';
    slots.forEach(function(s) {
        var it = member.equipment ? member.equipment[s.id] : null;
        html += '<div class="flex justify-between items-center bg-gray-900 rounded p-2 mb-2">'
            + '<div><span class="text-xs text-gray-400 mr-2">' + s.name + '</span>'
            + '<span class="' + (it ? 'text-green-400 text-sm' : 'text-gray-600 text-sm') + '">' + (it ? it.name : '未装备') + '</span></div>';
        if (it) {
            html += '<button onclick="unequipMemberSlot(\'' + memberId + '\',\'' + s.id + '\')" class="text-xs bg-red-700 hover:bg-red-600 px-2 py-1 rounded">卸下</button>';
        } else {
            html += '<button onclick="showMemberBagPickModal(\'' + memberId + '\',\'' + s.id + '\')" class="text-xs bg-blue-700 hover:bg-blue-600 px-2 py-1 rounded">从背包选择</button>';
        }
        html += '</div>';
    });
    html += '<p class="text-xs text-gray-500 mt-1">卸下的装备会放回你的背包。</p>';
    openPartyMemberModal('装备管理 · ' + member.name, html);
}

function unequipMemberSlot(memberId, slot) {
    const member = partyData.members.find(m => m.id === memberId);
    if (!member || !member.equipment || !member.equipment[slot]) return;
    var it = member.equipment[slot];
    if (it.templateId && typeof window.addItem === 'function') {
        window.addItem(it.templateId, 1);
    }
    delete member.equipment[slot];
    savePartyData();
    showMessage(it.name + ' 已卸下放回背包', 'info');
    showMemberEquipModal(memberId);
}

// ============ 从背包选择装备 ============
function showMemberBagPickModal(memberId, slot) {
    const member = partyData.members.find(m => m.id === memberId);
    if (!member) { showMessage('找不到该队员', 'error'); return; }
    var inv = window.inventory;
    var candidates = [];
    if (inv && inv.slots) {
        inv.slots.forEach(function(inst) {
            if (!inst) return;
            var t = inst.getTemplate ? inst.getTemplate() : (window.itemById ? window.itemById[inst.templateId] : null);
            if (!t) return;
            var equippable = t.combatBonus || t.damage != null || t.defense != null || t.attrs || t.slot || t.category === 'EQUIPMENT';
            if (equippable) candidates.push({ uid: inst.uid, name: t.name, count: inst.count || 1 });
        });
    }
    if (candidates.length === 0) { showMessage('背包中没有可装备的物品', 'warning'); return; }
    var html = candidates.map(function(c) {
        return '<button onclick="assignBagItemToMember(\'' + memberId + '\',\'' + slot + '\',\'' + c.uid + '\')" class="w-full text-left bg-gray-900 hover:bg-gray-700 rounded p-2 mb-1 text-sm flex justify-between"><span>' + c.name + (c.count > 1 ? ' ×' + c.count : '') + '</span><span class="text-green-400">装备 →</span></button>';
    }).join('');
    openPartyMemberModal('选择装备给 ' + member.name, html);
}

function assignBagItemToMember(memberId, slot, uid) {
    const member = partyData.members.find(m => m.id === memberId);
    var inv = window.inventory;
    if (!member || !inv || !inv.slots) return;
    var inst = null;
    for (var i = 0; i < inv.slots.length; i++) {
        if (inv.slots[i] && inv.slots[i].uid === uid) { inst = inv.slots[i]; break; }
    }
    if (!inst) { showMessage('物品不存在', 'error'); return; }
    var t = inst.getTemplate ? inst.getTemplate() : (window.itemById ? window.itemById[inst.templateId] : null);
    // 该槽已有装备则先放回背包
    if (member.equipment && member.equipment[slot] && member.equipment[slot].templateId && typeof window.addItem === 'function') {
        window.addItem(member.equipment[slot].templateId, 1);
    }
    // 从背包移除（按UID）
    try {
        if (inv.removeItem) inv.removeItem(uid, 1);
        else if (typeof window.removeItem === 'function') window.removeItem(uid, 1);
    } catch (e) {}
    equipMember(memberId, slot, { templateId: inst.templateId, name: t ? t.name : String(inst.templateId) });
    showMemberEquipModal(memberId);
}

// ============ 技能查看/传授面板 ============
function showMemberSkillModal(memberId) {
    const member = partyData.members.find(m => m.id === memberId);
    if (!member) { showMessage('找不到该队员', 'error'); return; }
    var knownHtml;
    if (member.skills && member.skills.length) {
        knownHtml = member.skills.map(function(s) {
            return '<div class="bg-gray-900 rounded p-2 mb-1 text-sm"><span class="text-cyan-300 font-bold">' + (s.name || s.id) + '</span>'
                + (s.grade ? ' <span class="text-xs text-yellow-500">' + s.grade + '</span>' : '')
                + (s.desc ? '<p class="text-xs text-gray-400 mt-0.5">' + s.desc + '</p>' : '')
                + '</div>';
        }).join('');
    } else {
        knownHtml = '<p class="text-gray-600 text-sm">尚未学会任何功法</p>';
    }
    // 可传授：玩家已学且队员未掌握的功法
    var teachButtons = '';
    var learnedIds = [];
    try {
        if (window.KnowledgeSystem && typeof window.KnowledgeSystem.getLearnedSkillIds === 'function') {
            learnedIds = window.KnowledgeSystem.getLearnedSkillIds() || [];
        }
    } catch (e) {}
    if (learnedIds.length && typeof window.findSkillById === 'function') {
        learnedIds.forEach(function(sid) {
            var already = member.skills && member.skills.some(function(s) { return s.id === sid; });
            if (already) return;
            var sk = window.findSkillById(sid);
            if (!sk) return;
            teachButtons += '<button onclick="doTeachSkillToMember(\'' + memberId + '\',\'' + sid + '\')" class="w-full text-left bg-gray-900 hover:bg-gray-700 rounded p-2 mb-1 text-sm flex justify-between"><span>' + sk.name + '</span><span class="text-green-400">传授 →</span></button>';
        });
    }
    if (!teachButtons) teachButtons = '<p class="text-gray-600 text-xs">没有可传授的新功法（需你已学会且队员未掌握）</p>';
    var html = '<p class="text-xs text-gray-400 mb-1">已掌握功法：</p>' + knownHtml
        + '<div class="border-t border-gray-700 mt-3 pt-2"><p class="text-xs text-gray-400 mb-1">可传授（来自你的已学功法）：</p>' + teachButtons + '</div>';
    openPartyMemberModal('功法 · ' + member.name, html);
}

function doTeachSkillToMember(memberId, skillId) {
    if (teachSkillToMember(memberId, skillId)) showMemberSkillModal(memberId);
}

// ============ v15.2 绝技传授（源：玩家已掌握的 COMBAT_ABILITIES，直接传授不耗物品） ============
// 遁术(escape)是玩家指令级机制（battleFlee 基础率），队友习得无意义——不入传授池（不卖假货）
var MEMBER_UNTEACHABLE_ABILITIES = { escape: 1 };

function getTeachableAbilities(memberId) {
    const member = partyData.members.find(m => m.id === memberId);
    if (!member) return [];
    var mine = (window.currentCharData && Array.isArray(window.currentCharData.combatAbilities)) ? window.currentCharData.combatAbilities : [];
    return mine.filter(function(id) {
        if (!id || MEMBER_UNTEACHABLE_ABILITIES[id]) return false;
        if (window.COMBAT_ABILITIES && !window.COMBAT_ABILITIES[id]) return false; // 只认注册表在册绝技
        if ((member.combatAbilities || []).indexOf(id) >= 0) return false;         // 队员已会
        return true;
    });
}

function teachAbilityToMember(memberId, abilityId) {
    const member = partyData.members.find(m => m.id === memberId);
    if (!member) { showMessage('找不到该队员', 'error'); return false; }
    var meta = window.COMBAT_ABILITIES ? window.COMBAT_ABILITIES[abilityId] : null;
    if (!meta) { showMessage('未知绝技', 'error'); return false; }
    if (MEMBER_UNTEACHABLE_ABILITIES[abilityId]) { showMessage('「' + meta.name + '」无法传授给队员', 'warning'); return false; }
    var mine = (window.currentCharData && Array.isArray(window.currentCharData.combatAbilities)) ? window.currentCharData.combatAbilities : [];
    if (mine.indexOf(abilityId) < 0) { showMessage('你自己尚未掌握「' + meta.name + '」，无从教起', 'warning'); return false; }
    if (!Array.isArray(member.combatAbilities)) member.combatAbilities = [];
    if (member.combatAbilities.indexOf(abilityId) >= 0) { showMessage(member.name + ' 已掌握「' + meta.name + '」', 'warning'); return false; }
    member.combatAbilities.push(abilityId);
    savePartyData();
    showMessage('已将「' + meta.name + '」倾囊相授给 ' + member.name, 'success');
    updatePartyUI();
    return true;
}

function doTeachAbilityToMember(memberId, abilityId) {
    if (teachAbilityToMember(memberId, abilityId)) showMemberAbilityModal(memberId);
}

// 队员绝技面板：已掌握 + 可传授（来自玩家自身，与功法面板同构）
function showMemberAbilityModal(memberId) {
    const member = partyData.members.find(m => m.id === memberId);
    if (!member) { showMessage('找不到该队员', 'error'); return; }
    var known = member.combatAbilities || [];
    var knownHtml;
    if (known.length) {
        knownHtml = known.map(function(id) {
            var meta = (window.COMBAT_ABILITIES || {})[id] || {};
            return '<div class="bg-gray-900 rounded p-2 mb-1 text-sm"><span class="text-amber-300 font-bold">⚔️ ' + (meta.name || id) + '</span>'
                + (meta.desc ? '<p class="text-xs text-gray-400 mt-0.5">' + meta.desc + '</p>' : '') + '</div>';
        }).join('');
    } else {
        knownHtml = '<p class="text-gray-600 text-sm">尚未学会任何绝技</p>';
    }
    var teachButtons = '';
    getTeachableAbilities(memberId).forEach(function(id) {
        var meta = (window.COMBAT_ABILITIES || {})[id] || {};
        teachButtons += '<button onclick="doTeachAbilityToMember(\'' + memberId + '\',\'' + id + '\')" class="w-full text-left bg-gray-900 hover:bg-gray-700 rounded p-2 mb-1 text-sm flex justify-between"><span>' + (meta.name || id) + '</span><span class="text-green-400">传授 →</span></button>';
    });
    if (!teachButtons) teachButtons = '<p class="text-gray-600 text-xs">没有可传授的新绝技（需你已掌握且队员未会）</p>';
    var html = '<p class="text-xs text-gray-400 mb-1">已掌握绝技：</p>' + knownHtml
        + '<div class="border-t border-gray-700 mt-3 pt-2"><p class="text-xs text-gray-400 mb-1">可传授（来自你的已掌握绝技）：</p>' + teachButtons + '</div>'
        + '<p class="text-[11px] text-gray-500 mt-2">遁术为玩家身法，不列传授。</p>';
    openPartyMemberModal('绝技 · ' + member.name, html);
}

// ============ 阵型加成数值展示 ============
function updateFormationBonusDisplay() {
    var select = document.getElementById('formation-select');
    if (!select) return;
    var display = document.getElementById('formation-bonus-display');
    if (!display) {
        display = document.createElement('div');
        display.id = 'formation-bonus-display';
        display.className = 'text-xs text-gray-400 mt-1 mb-2';
        if (select.parentNode) select.parentNode.insertBefore(display, select.nextSibling);
        else return;
    }
    var f = FORMATIONS[partyData.formation] || FORMATIONS.default;
    var b = f.bonuses || {};
    var parts = [];
    if (b.attack != null) parts.push('⚔️ 攻击 ×' + b.attack);
    if (b.defense != null) parts.push('🛡️ 防御 ×' + b.defense);
    if (b.speed != null) parts.push('💨 速度 ×' + b.speed);
    if (b.healing != null) parts.push('💚 治疗 ×' + b.healing);
    if (b.sacrifice) parts.push('💀 牺牲传承');
    display.innerHTML = '<span class="text-gray-300 font-bold">' + f.name + '</span>（' + f.description + '）：' + parts.join('　');
}

// ============ 显示队伍面板 ============
function showPartyPanel() {
    // 更新UI内容
    updatePartyUI();
    
    // 切换到队伍面板（通过switchPanel显示）
    switchPanel('party');
}

// ============ 邀请NPC对话 ============
function inviteNPCToParty(npcId) {
    const npc = window.npcManager?.getNPC(npcId);
    if (!npc) {
        showMessage('找不到该NPC', 'error');
        return;
    }
    
    // 根据好感度选择对话
    let dialogue;
    if (npc.relationship.affection < 30) {
        dialogue = partyRandomChoice(recruitmentDialogues.lowAffection);
    } else if (npc.relationship.affection < 70) {
        dialogue = partyRandomChoice(recruitmentDialogues.midAffection);
    } else {
        dialogue = partyRandomChoice(recruitmentDialogues.highAffection);
    }
    
    showMessage(`${npc.name}: "${dialogue}"`, 'info');
    
    if (npc.relationship.affection >= 50) {
        // 尝试招募
        recruitNPC(npcId);
    }
}

// ============ 随机选择 ============
function partyRandomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// ============ 显示消息 ============
// 已由 global-utils.js 在第0层设置 window.showMessage，此处不再重复声明
// 所有调用直接使用 window.showMessage()

// ==================== P2：战后关系记忆系统 ====================
// 根据玩家在战斗中的行为（保护、抛弃、救助）更新与队员的关系记忆

function processPostBattleRelationships(battle) {
    if (!battle || !partyData.members.length) return;
    
    // 检查是否有队员在战斗中受伤或死亡
    partyData.members.forEach(member => {
        if (member.battleLastTakenDamage > 0) {
            // 队员受伤了，玩家应该给予关注
            const damageTaken = member.battleLastTakenDamage;
            const healthAfter = member.health;
            
            // 如果玩家没有主动治疗，关系会下降
            if (healthAfter < member.maxHealth * 0.5 && damageTaken > 50) {
                // 严重受伤且未治疗 - 关系下降
                member.relationship.affection = Math.max(-100, member.relationship.affection - 10);
                
                member.recordPlayerAction('abandoned_in_battle', 'negative');
                addBattleLog(`${member.name} 在战斗中受伤严重，感到被抛弃`, 'warning');
            } else if (damageTaken > 30) {
                // 受了伤但还活着 - 关系轻微下降
                member.relationship.affection = Math.max(-100, member.relationship.affection - 5);
                member.recordPlayerAction('hurt_in_battle', 'neutral');
            }
            
            // 重置伤害标记
            member.battleLastTakenDamage = 0;
        }
        
        // 检查队员是否在战斗中死亡（已移除队伍）
        if (!member.isAlive && partyData.members.includes(member)) {
            // 队员死亡 - 关系大幅下降
            member.relationship.affection = Math.max(-100, member.relationship.affection - 20);
            
            member.recordPlayerAction('member_died_in_battle', 'negative');
            addBattleLog(`${member.name} 在战斗中倒下，你感到非常内疚`, 'error');
        }
    });
    
    // 保存更新后的数据
    savePartyData();
}

// ==================== 增强 PartyMember 类以支持战斗伤害追踪 ====================
// 修复 F-4：之前用对象展开 {...PartyMember.prototype} 重写原型，
// class 定义的方法是 non-enumerable，展开不复制，导致 isAlive/gainExp/levelUp/restore 全丢；
// 新 takeDamage 又依赖从未赋值的 this.originalTakeDamage，队友实际无敌。
// 修复：保留原 takeDamage 引用，只在原型上覆写一个方法，不再替换整个 prototype 对象。
if (!PartyMember.prototype.__patchedBattleTracking) {
    const __origTakeDamage = PartyMember.prototype.takeDamage;
    PartyMember.prototype.takeDamage = function(amount) {
        // 记录本次伤害，用于战后关系计算
        this.battleCurrentAmount = (this.battleCurrentAmount || 0) + amount;
        // 调用原始 takeDamage
        if (typeof __origTakeDamage === 'function') {
            __origTakeDamage.call(this, amount);
        }
    };
    PartyMember.prototype.__patchedBattleTracking = true;
}

// ==================== 导出到全局 ====================
window.partySystem = {
    initPartySystem,
    savePartyData,
    recruitNPC,
    removeMember,
    setLeader,
    changeFormation,
    getFormationBonuses,
    usePartyInBattle,
    equipMember,
    teachSkillToMember,
    restMember,
    getPartyTotalPower,
    getAliveMemberCount,
    showPartyPanel,
    inviteNPCToParty,
    // ===== v12.3.1 队伍面板UI增强 =====
    cycleMemberStrategy,
    showMemberDetailModal,
    showMemberEquipModal,
    unequipMemberSlot,
    showMemberBagPickModal,
    assignBagItemToMember,
    showMemberSkillModal,
    doTeachSkillToMember,
    // ===== v15.2 队友学绝技 =====
    getTeachableAbilities,
    teachAbilityToMember,
    doTeachAbilityToMember,
    showMemberAbilityModal,
    updateFormationBonusDisplay,
    PartyMember,
    FORMATIONS,
    partyData,
    processPostBattleRelationships: processPostBattleRelationships,
    // ===== Step 3：位置同步函数 =====
    syncPartyLocationToPlayer: function(newLocation) {
        if (!window.npcManager || !partyData) return;
        var members = partyData.members || [];
        members.forEach(function(member) {
            var npc = window.npcManager.getNPC(member.id);
            if (npc) {
                npc.location = newLocation;
                npc.state.location = newLocation;
                npc.isFollowing = true;
            }
        });
    }
};

// 兼容旧代码：直接暴露 partyData 到 window
window.partyData = partyData;

// 自动初始化
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        initPartySystem();
    });
}
