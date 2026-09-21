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
    wonBattles: 0,         // 获胜战斗数
    fallen: []             // v20.64 阵亡名录（战死的队员除名后记在这里）
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
            partyData.fallen = Array.isArray(parsed.fallen) ? parsed.fallen : [];   // v20.64 阵亡名录随档走
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

// ============ 第一百一十波 · NEW-98：存档桥的真接口（就地灌，不重绑） ============
// 此前读档走 `global.partyData = saveData.partyData`——重绑的是 window 那颗按值镜像，
// 模块正主与 partySystem.partyData 还停在启动对象上：读档不灌内存，且此后本机队伍的任何改动
// 永远进不了档（collect 读的是那颗孤儿）。修法照 bodyDurability 的正确样板：就地清键再灌。
function exportPartyState() {
    try { return JSON.parse(JSON.stringify(partyData)); } catch (e) { return { members: [], formation: partyData.formation || 'default' }; }
}

function importPartyState(data) {
    if (!data || typeof data !== 'object') return;
    partyData.members = (Array.isArray(data.members) ? data.members : []).map(function (m) {
        return (m instanceof PartyMember) ? m : new PartyMember(m || {});
    });
    partyData.maxMembers = data.maxMembers || 4;
    partyData.leaderId = data.leaderId || (partyData.members[0] && partyData.members[0].id) || null;
    partyData.formation = data.formation || 'default';
    partyData.battleLog = Array.isArray(data.battleLog) ? data.battleLog : [];
    partyData.fallen = Array.isArray(data.fallen) ? data.fallen : [];
    partyData.totalBattles = Number(data.totalBattles) || 0;
    partyData.wonBattles = Number(data.wonBattles) || 0;
    savePartyData();
    try { updatePartyUI(); } catch (eUI) {}
}
window.exportPartyState = exportPartyState;
window.importPartyState = importPartyState;

// ============ 招募NPC加入队伍 ============
// ============ 第一百零八波 · 解除人数上限（设置页「难度设置」里的实验性开关） ============
// 默认仍是 4 人；解开后招募不再受四人限，但留一道 99 的硬顶——
// 战斗回合、状态栏、战后结算、起居日结全随人数线性涨，不设底会拖垮低端机，也不叫「队伍」了。
var PARTY_UNLIMITED_CAP = 99;
function isPartyUnlimited() {
    try { return !!(window._settings && window._settings.partyUnlimited === true); } catch (e) { return false; }
}
function getEffectiveMaxMembers() {
    return isPartyUnlimited() ? PARTY_UNLIMITED_CAP : (partyData.maxMembers || 4);
}

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

    // 第一百零七波 · 逝者已矣：阵亡名录上的人，好感再满也招不回来——
    // 此前名录只记在队伍一侧，NPC 本人活蹦乱跳，战死的队友转头就能满血再入队，名录和人头对不上。
    var _fid = String(npcId);
    var _inFallen = (partyData.fallen || []).some(function (f) {
        return f && (f.id === _fid || (f.name && f.name === npc.name));
    });
    if (_inFallen) {
        showMessage('⚰️ 逝者已矣——' + npc.name + ' 的名字在阵亡名录上，再也回不来了。', 'error');
        return false;
    }
    
    // 检查队伍是否已满（第一百零八波：满员线看解限开关的脸色）
    if (partyData.members.length >= getEffectiveMaxMembers()) {
        showMessage(isPartyUnlimited()
            ? '解了限也有个数——一支队伍最多 ' + PARTY_UNLIMITED_CAP + ' 人，再多连洞府都住不下了。'
            : '队伍已满，无法招募更多成员', 'error');
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

// ============ 第一百零七波 · 队员战斗改算（阵型+装备的统一出口） ============
// 此前六阵型的攻/防/速/疗加成与队友身上的兵刃防具全是死账——battle.js 建队员实体只读
// 属性/武艺/绝技。这里把两本账并成一份改算单，战斗侧只认这一个口子：
//   atkMul/defMul/spdMul = 阵型乘区；atkFlat/defFlat = 兵刃防具的加值；attrAdd = 装备的属性点
function getMemberBattleMods(member) {
    var mods = { atkMul: 1, defMul: 1, spdMul: 1, atkFlat: 0, defFlat: 0, attrAdd: {} };
    var fb = getFormationBonuses() || {};
    mods.atkMul = Number(fb.attack) || 1;
    mods.defMul = Number(fb.defense) || 1;
    mods.spdMul = Number(fb.speed) || 1;
    var eq = (member && member.equipment) || {};
    for (var slot in eq) {
        var it = eq[slot];
        var tid = it && (it.templateId || it.id);
        var tpl = (tid && window.itemById && window.itemById[tid]) || null;
        if (!tpl) continue;
        var cb = tpl.combatBonus || {};
        mods.atkFlat += Number(cb.attack) || 0;
        mods.defFlat += Number(tpl.defense != null ? tpl.defense : cb.defense) || 0;
        var at = tpl.attrs || {};
        for (var k in at) mods.attrAdd[k] = (mods.attrAdd[k] || 0) + (Number(at[k]) || 0);
    }
    return mods;
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

    // 第一百零七波：治疗阵的账真兑现——结着治疗阵休息，恢复 +30%（此前 healing 加成全库无人读）
    var _healMul = Number((getFormationBonuses() || {}).healing) || 1;
    member.restore(Math.round(30 * _healMul));
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
    // v20.64 阵亡名录：战死的人该有个去处，不该像从没存在过
    const fallenList = document.getElementById('party-fallen-list');
    if (fallenList) {
        const fallen = partyData.fallen || [];
        if (!fallen.length) {
            fallenList.innerHTML = '';
        } else {
            fallenList.innerHTML = '<p class="text-[10px] text-gray-500 mt-2 mb-1">⚰️ 阵亡名录</p>' + fallen.slice(-8).map(f =>
                `<p class="text-xs text-gray-400">• ${f.name}（${f.level} 级 · ${f.cause || '战死'}）</p>`
            ).join('');
        }
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
        // 第一百零八波：解限开关开着就如实报硬顶，别再挂那个写死的 4
        maxDisplay.textContent = String(getEffectiveMaxMembers());
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
                + (s.grade ? ' <span class="text-xs text-yellow-500">' + ((typeof window.normalizeGrade === 'function' ? window.normalizeGrade(s.grade) : s.grade)) + '</span>' : '')
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
// v20.64：battleLastTakenDamage 现在真有人写了（battle.js _notePartyDamage）；
// 阵亡判定改用 _diedThisBattle（旧写法 !member.isAlive 比的是函数对象，永远不触发）；
// 由 finalizeBattleOutcome 统一调用——打赢、打输、逃走都要结算，不再只认胜利。

function processPostBattleRelationships(battle) {
    if (!battle) return;

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
                _loyaltyChange(member, -5);   // 第一百零七波：忠诚真跌——重伤没人管，心会凉

                _memberRecordAction(member, 'abandoned_in_battle', 'negative');
                addBattleLog(`${member.name} 在战斗中受伤严重，感到被抛弃`, 'warning');
            } else if (damageTaken > 30) {
                // 受了伤但还活着 - 关系轻微下降
                member.relationship.affection = Math.max(-100, member.relationship.affection - 5);
                _loyaltyChange(member, -2);   // 第一百零七波：带伤打完这一场，也记一笔
                _memberRecordAction(member, 'hurt_in_battle', 'neutral');
            }

            // 重置伤害标记
            member.battleLastTakenDamage = 0;
        }
    });

    // 队员战死：关系大幅下降（看的是本场是否真倒了，不是函数对象）
    const fallen = partyData.members.filter(m => m._diedThisBattle);
    fallen.forEach(member => {
        member.relationship.affection = Math.max(-100, member.relationship.affection - 20);
        _memberRecordAction(member, 'member_died_in_battle', 'negative');
        addBattleLog(`${member.name} 在战斗中倒下，你感到非常内疚`, 'error');
    });
    // 第一百零七波：有人倒在身边，活下来的人心里都会记一笔；同生共死打赢一场，人心会热一点
    if (fallen.length) {
        partyData.members.forEach(m => { if (!m._diedThisBattle) _loyaltyChange(m, -3); });
    }
    if (battle.winner === 'player' && !battle.noSpoils) {
        partyData.members.forEach(m => { if (!m._diedThisBattle) _loyaltyChange(m, +1); });
    }

    savePartyData();
    return fallen;
}

// 忠诚的统一写点（第一百零七波）：夹在 0~100，凉透了记进队伍日志
function _loyaltyChange(member, delta) {
    if (!member || !member.relationship || !delta) return;
    var old = member.relationship.loyalty != null ? member.relationship.loyalty : 50;
    member.relationship.loyalty = Math.max(0, Math.min(100, old + delta));
    if (delta < 0 && member.relationship.loyalty <= 0) {
        addBattleLog(`${member.name} 的心已经凉透了`, 'error');
    }
    return member.relationship.loyalty;
}

// 第一百零七波 · 队员的行为记忆写点：此前调的是 PartyMember 上根本不存在的
// recordPlayerAction——TypeError 被外层 try/catch 吞掉，战后关系记忆整段静默空转。
// 记忆的真源在 NPC 档案上，改写到 NPC 那一侧。
function _memberRecordAction(member, action, tone) {
    try {
        var npc = (window.npcManager && typeof window.npcManager.getNPC === 'function') ? window.npcManager.getNPC(member && member.id) : null;
        if (npc && typeof npc.recordPlayerAction === 'function') npc.recordPlayerAction(action, tone);
    } catch (e) {}
}

// ============ 第一百零七波 · 队友成长：打赢吃足历练，打输也长记性 ============
// 此前 gainExp/levelUp 定义了却全库零调用——队友的等级境界冻结在入队那一刻。现在战后真分历练。
function grantBattleExp(battle) {
    if (!battle) return [];
    var won = battle.winner === 'player' && !battle.noSpoils;
    var enemyLv = Number(battle.enemy && battle.enemy.level) || 1;
    var share = Math.max(5, enemyLv * (won ? 6 : 2));
    var leveled = [];
    (partyData.members || []).forEach(function (m) {
        if (m._diedThisBattle) return;
        var before = m.level || 1;
        try { m.gainExp(share); } catch (e) {}
        if ((m.level || 1) > before) leveled.push(m.name + ' 升到 ' + m.level + ' 级');
    });
    return leveled;
}

// ============ 第一百零七波 · 队伍随世界走：NPC 本体在日结里变强，队伍分身不能掉队 ============
function syncWithWorld() {
    var grew = [];
    (partyData.members || []).forEach(function (m) {
        try {
            var npc = (window.npcManager && typeof window.npcManager.getNPC === 'function') ? window.npcManager.getNPC(m.id) : null;
            if (!npc || !npc.combat) return;
            var nlv = Number(npc.combat.level) || 0;
            if (nlv > (m.level || 1)) {
                while ((m.level || 1) < nlv && typeof m.levelUp === 'function') m.levelUp();
                if (npc.combat.realm) m.realm = npc.combat.realm;
                if (npc.combat.layer) m.layer = npc.combat.layer;
                grew.push(m.name + '（' + (m.realm || '') + ' ' + (m.level || 1) + ' 级）');
            }
        } catch (e) {}
    });
    if (grew.length) {
        savePartyData();
        try { showMessage('🌱 同行的日子没有白费：' + grew.join('、') + ' 的修为更进了一步。', 'info'); } catch (e2) {}
    }
    return grew;
}

// ============ 第一百零七波 · 忠诚见底，人是要走的 ============
// 心凉透（忠诚 0）当夜就走；凉到 30 以下，每天有两成五的概率收拾行囊——约束来自人心，不是配额。
function checkLoyaltyDaily() {
    var left = [];
    (partyData.members || []).slice().forEach(function (m) {
        var loy = (m.relationship && m.relationship.loyalty != null) ? m.relationship.loyalty : 50;
        if (loy >= 30) return;
        if (loy > 0 && partyRandomChoice([0, 0, 0, 1]) !== 1) return;
        var name = m.name;
        removeMember(m.id);
        left.push(name);
        try { showMessage('💔 ' + name + ' 离心离德——同行是情分，强留不来。他连夜收拾行囊走了。', 'warning'); } catch (e) {}
        try {
            var npc = (window.npcManager && typeof window.npcManager.getNPC === 'function') ? window.npcManager.getNPC(m.id) : null;
            if (npc && typeof npc.recordPlayerAction === 'function') npc.recordPlayerAction('left_party_loyalty', 'negative');
        } catch (e2) {}
    });
    if (left.length) savePartyData();
    return left;
}

// ==================== v20.64 战后统一结算 ====================
// 胜利/失败/逃走都走这一道，把「队员死了」从一句 health=0 变成真的有后事：
//   · 阵亡者从队伍名单移除，进阵亡名录（fallen），不喂一口血就满状态归队
//   · 牺牲阵（sacrifice）兑现承诺：阵亡者的力气筋骨分给活下来的人
//   · 战后关系记忆一并结算（任何结局都算数）
function finalizeBattleOutcome(battle) {
    if (!battle) return { fallen: [], transfer: null };
    // 第一百零七波：战绩真记账、队友真成长——打赢打输逃走，这一场都算数
    partyData.totalBattles = (partyData.totalBattles || 0) + 1;
    if (battle.winner === 'player' && !battle.noSpoils) partyData.wonBattles = (partyData.wonBattles || 0) + 1;
    var leveled = [];
    try { leveled = grantBattleExp(battle); } catch (eG) {}
    if (leveled.length) { try { showMessage('🌱 ' + leveled.join('、'), 'success'); } catch (eM) {} }
    const fallenRefs = partyData.members.filter(m => m._diedThisBattle);
    if (!fallenRefs.length) {
        processPostBattleRelationships(battle);   // 没死人也要算受伤这笔账
        return { fallen: [], transfer: null };
    }

    // 牺牲阵：队员死亡后属性转移给存活队员（此前只是阵型描述里的一句空话）
    let transfer = null;
    if (partyData.formation === 'sacrifice') {
        const survivors = partyData.members.filter(m => !m._diedThisBattle);
        if (survivors.length) {
            const share = fallenRefs.length / survivors.length;
            survivors.forEach(s => {
                const carry = Math.max(1, Math.round((s.level || 1) * 0.3 * share));
                s.attributes.strength = Math.min(99, (s.attributes.strength || 10) + carry);
                s.attributes.constitution = Math.min(99, (s.attributes.constitution || 10) + carry);
            });
            transfer = { from: fallenRefs.map(m => m.name), to: survivors.length };
            addBattleLog(`💀 ${fallenRefs.map(m => m.name).join('、')}的遗志由余下的人担了起来`, 'warning');
        }
    }

    // 除名入名录
    if (!Array.isArray(partyData.fallen)) partyData.fallen = [];
    fallenRefs.forEach(m => {
        partyData.fallen.push({
            id: m.id,   // 第一百零七波：名录记 id——逝者已矣，招不回来
            name: m.name, level: m.level || 1,
            diedAt: Date.now(), cause: '战死'
        });
        // NPC 那一侧也画线：人是战死的，不该在世界日结里照常活蹦乱跳
        try {
            var npc = (window.npcManager && typeof window.npcManager.getNPC === 'function') ? window.npcManager.getNPC(m.id) : null;
            if (npc) { npc.isDead = true; npc.isFollowing = false; }
        } catch (eN) {}
    });
    partyData.members = partyData.members.filter(m => !m._diedThisBattle);

    processPostBattleRelationships(battle);
    savePartyData();
    updatePartyUI();
    return { fallen: fallenRefs.map(m => m.name), transfer: transfer };
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
    finalizeBattleOutcome: finalizeBattleOutcome,
    // ===== 第一百零七波：阵型/装备的战斗改算单、队友成长、随世界同步、忠诚日结 =====
    getMemberBattleMods: getMemberBattleMods,
    grantBattleExp: grantBattleExp,
    syncWithWorld: syncWithWorld,
    checkLoyaltyDaily: checkLoyaltyDaily,
    // ===== 第一百零八波：解除人数上限的实验性开关口径 =====
    isPartyUnlimited: isPartyUnlimited,
    getEffectiveMaxMembers: getEffectiveMaxMembers,
    PARTY_UNLIMITED_CAP: PARTY_UNLIMITED_CAP,
    // ===== v20.80 队伍成员只读快照：供吃醋关系网等外部系统读取「此刻谁跟着玩家」 =====
    getMembers: function() {
        return (partyData.members || []).map(function(m) { return { id: m.id, name: m.name }; });
    },
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

// 第一百零七波：接世界钟——队友修为随世界日结长进，忠诚见底的人连夜走
// （只挂 newDay 单一真源；EventBus 缺席才退 timeSystem 订阅，不双挂）
try {
    var _dailyPartyTick = function () {
        try { syncWithWorld(); } catch (e1) {}
        try { checkLoyaltyDaily(); } catch (e2) {}
    };
    if (window.EventBus && typeof window.EventBus.on === 'function') {
        window.EventBus.on('newDay', _dailyPartyTick);
    } else if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') {
        window.timeSystem.onNewDaySubscribe(_dailyPartyTick);
    }
} catch (eBind) {}
