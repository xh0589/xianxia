// ==================== event-system.js - 奇遇事件系统 ====================
// 借鉴《太吾绘卷》、《觅长生》的奇遇设计

// ============ 奇遇类型 ============
const EVENT_TYPES = {
    TREASURE: 'treasure',          // 发现宝箱
    MASTER: 'master',              // 偶遇高人
    DUNGEON: 'dungeon',            // 秘境入口
    BATTLE: 'battle',              // 遭遇战斗
    HERB: 'herb',                  // 发现灵药
    TRAP: 'trap',                  // 陷阱
    SPIRIT: 'spirit',              // 精怪
    ARTIFACT: 'artifact',          // 获得法宝
    TEACHING: 'teaching',          // 顿悟传授
    CURSE: 'curse',                // 诅咒
    BOSS: 'boss',                  // Boss战
    NATURE: 'nature'               // 自然奇遇
};

// ============ 奇遇稀有度 ============
const EVENT_RARITY = {
    COMMON: { id: 'common', name: '普通', chance: 0.5, color: 'text-gray-400' },
    UNCOMMON: { id: 'uncommon', name: '罕见', chance: 0.3, color: 'text-green-400' },
    RARE: { id: 'rare', name: '稀有', chance: 0.15, color: 'text-blue-400' },
    EPIC: { id: 'epic', name: '史诗', chance: 0.04, color: 'text-purple-400' },
    LEGENDARY: { id: 'legendary', name: '传说', chance: 0.01, color: 'text-yellow-400' }
};

// ============ 奇遇数据库 ============
const randomEvents = [
    // 发现宝箱类
    {
        id: 'event_old_chest',
        name: '古朴宝箱',
        type: EVENT_TYPES.TREASURE,
        rarity: EVENT_RARITY.UNCOMMON,
        description: '你在草丛中发现了一个布满灰尘的古朴宝箱。',
        choices: [
            { 
                id: 'open', 
                text: '打开宝箱', 
                effect: function() {
                    const loot = generateTreasureLoot();
                    showMessage(`你打开了宝箱，获得了：${lootLedgerText(loot) || '什么都没有'}`, 'success');
                    applyTreasureRewards(loot);
                }
            },
            { 
                id: 'ignore', 
                text: '小心离开', 
                effect: function() {
                    showMessage('你选择小心离开，避免潜在危险。', 'info');
                }
            }
        ],
        minRealm: '炼气',
        minLayer: 1
    },
    {
        id: 'cave_discovery',
        name: '山洞秘宝',
        type: EVENT_TYPES.TREASURE,
        rarity: EVENT_RARITY.RARE,
        description: '你发现了一个隐蔽的山洞，洞中似乎有宝物。',
        choices: [
            { 
                id: 'explore', 
                text: '进入山洞探索', 
                effect: function() {
                    const loot = generateCaveLoot();
                    showMessage(`你在山洞中找到了：${lootLedgerText(loot) || '一无所获'}`, 'success');
                    applyTreasureRewards(loot);
                }
            },
            { 
                id: 'leave', 
                text: '不冒险，离开', 
                effect: function() {
                    showMessage('你决定不冒险，继续前行。', 'info');
                }
            }
        ],
        minRealm: '炼气',
        minLayer: 3
    },
    
    // 偶遇高人类
    {
        id: 'event_mysterious_old_man',
        name: '神秘老人',
        type: EVENT_TYPES.MASTER,
        rarity: EVENT_RARITY.RARE,
        description: '路边遇到一位白发苍苍的老人，他似乎注意到了你。',
        choices: [
            { 
                id: 'approach', 
                text: '上前搭话', 
                effect: function() {
                    triggerMasterEncounter('old_man');
                }
            },
            { 
                id: 'ignore', 
                text: '假装没看见', 
                effect: function() {
                    showMessage('你假装没看见，继续赶路。', 'info');
                }
            }
        ],
        minRealm: '炼气',
        minLayer: 1
    },
    {
        id: 'event_immortal_sage',
        name: '仙风道士',
        type: EVENT_TYPES.MASTER,
        rarity: EVENT_RARITY.EPIC,
        description: '在山巅你遇到了一位仙风道骨的老者，他正在打坐修炼。',
        choices: [
            { 
                id: 'request_teaching', 
                text: '请求传授功法', 
                effect: function() {
                    triggerMasterEncounter('immortal_sage');
                }
            },
            { 
                id: 'observe', 
                text: '在一旁观摩', 
                effect: function() {
                    triggerMasterEncounter('observe');
                }
            },
            { 
                id: 'leave', 
                text: '不打扰', 
                effect: function() {
                    showMessage('你选择不打扰老者修炼。', 'info');
                }
            }
        ],
        minRealm: '筑基',
        minLayer: 1
    },
    
    // 秘境入口
    {
        id: 'event_secret_realm',
        name: '秘境之门',
        type: EVENT_TYPES.DUNGEON,
        rarity: EVENT_RARITY.EPIC,
        description: '你发现了一处空间裂缝，里面散发着神秘的灵气。',
        choices: [
            { 
                id: 'enter', 
                text: '进入秘境', 
                effect: function() {
                    enterSecretRealm();
                }
            },
            { 
                id: 'mark', 
                text: '记住位置，日后探索', 
                effect: function() {
                    setFlag('secret_realm_marked');
                    showMessage('你记住了秘境的位置。', 'info');
                }
            },
            { 
                id: 'leave', 
                text: '危险，离开', 
                effect: function() {
                    showMessage('你选择远离未知的危险。', 'info');
                }
            }
        ],
        minRealm: '筑基',
        minLayer: 3
    },
    
    // 发现灵药
    {
        id: 'event_spirit_herb',
        name: '千年灵芝',
        type: EVENT_TYPES.HERB,
        rarity: EVENT_RARITY.RARE,
        description: '你发现了一株散发着浓郁灵气的千年灵芝！',
        choices: [
            { 
                id: 'collect', 
                text: '采集灵芝', 
                effect: function() {
                    // DES-72（第一百三十批）：旧写法丢了返回值，还把「千年人参」念成灵芝——百宝册上这号就叫千年人参
                    var 收 = typeof window.giveWithReceipt === 'function'
                        ? window.giveWithReceipt('ginseng', 1, { quiet: true })
                        : { got: Number(addItemToInventory('ginseng', 1)) || 0, count: 1, name: (window.itemById && window.itemById['ginseng'] && window.itemById['ginseng'].name) || '千年人参' };
                    if (收.got > 0) showMessage('你成功采集了 ' + 收.name + '×' + 收.got + '！', 'success');
                    else showMessage('你采下了 ' + 收.name + '，这一株却没能带进囊：'
                        + ((typeof window.addItemFailText === 'function' && window.addItemFailText(收.name)) || '这一件先还留在原处。'), 'warning'); // DES-90（第一百三十九批）：采撷点可再来，问不到账时不许站点断言满包，改用①形
                }
            },
            { 
                id: 'meditate_here', 
                text: '在此修炼吸收灵气', 
                effect: function() {
                    gainCultivationBonus(50);
                    showMessage('你吸收了周围的灵气，修为有所提升！', 'success');
                }
            },
            { 
                id: 'leave', 
                text: '不贪心，离开', 
                effect: function() {
                    showMessage('你选择见好就收。', 'info');
                }
            }
        ],
        minRealm: '炼气',
        minLayer: 2
    },
    
    // 陷阱类
    {
        id: 'event_trap_illusion',
        name: '幻术陷阱',
        type: EVENT_TYPES.TRAP,
        rarity: EVENT_RARITY.UNCOMMON,
        description: '你不小心触发了一个隐藏的幻术陷阱！',
        choices: [
            { 
                id: 'break_illusion', 
                text: '运功破除幻术', 
                effect: function() {
                    if (checkAttribute('willpower', 30)) {
                        showMessage('你成功破除了幻术！', 'success');
                        gainExp(20);
                    } else {
                        showMessage('你无法破除幻术，受到了伤害。', 'error');
                        takeDamage(30);
                    }
                }
            },
            { 
                id: 'endure', 
                text: '忍耐承受', 
                effect: function() {
                    takeDamage(50);
                    showMessage('你承受了幻术的攻击，生命值下降。', 'warning');
                }
            }
        ],
        minRealm: '炼气',
        minLayer: 1
    },
    
    // 精怪类
    {
        id: 'event_spirit_fox',
        name: '九尾灵狐',
        type: EVENT_TYPES.SPIRIT,
        rarity: EVENT_RARITY.EPIC,
        description: '一只美丽的九尾灵狐出现在你面前，它似乎有话要说。',
        choices: [
            { 
                id: 'talk', 
                text: '与灵狐交谈', 
                effect: function() {
                    triggerFoxEncounter();
                }
            },
            { 
                id: 'attack', 
                text: '攻击灵狐', 
                effect: function() {
                    startSpiritFoxBattle();
                }
            },
            { 
                id: 'leave', 
                text: '保持距离', 
                effect: function() {
                    showMessage('你选择保持安全距离。', 'info');
                }
            }
        ],
        minRealm: '筑基',
        minLayer: 1
    },
    
    // 顿悟传授
    {
        id: 'event_enlightenment',
        name: '天道顿悟',
        type: EVENT_TYPES.TEACHING,
        rarity: EVENT_RARITY.LEGENDARY,
        description: '你感受到天地间的道韵在涌动，似乎有机会顿悟！',
        choices: [
            { 
                id: 'meditate_enlighten', 
                text: '立即打坐顿悟', 
                effect: function() {
                    triggerEnlightenment();
                }
            },
            { 
                id: 'prepare', 
                text: '先准备再尝试', 
                effect: function() {
                    if (consumeItem('qi_recovery_pill', 1)) {
                        triggerEnlightenment();
                    } else {
                        showMessage('你没有足够的恢复丹药。', 'error');
                    }
                }
            }
        ],
        minRealm: '筑基',
        minLayer: 3
    },
    
    // Boss战
    {
        id: 'event_boss_demon_king',
        name: '妖王现身',
        type: EVENT_TYPES.BOSS,
        rarity: EVENT_RARITY.EPIC,
        description: '一只强大的妖王挡住了你的去路！',
        choices: [
            { 
                id: 'fight', 
                text: '迎战妖王', 
                effect: function() {
                    startBossBattle('demon_king');
                }
            },
            { 
                id: 'flee', 
                text: '逃跑', 
                effect: function() {
                    if (Math.random() < 0.5) {
                        showMessage('你成功逃跑了！', 'info');
                    } else {
                        showMessage('逃跑失败，妖王追了上来！', 'error');
                        startBossBattle('demon_king');
                    }
                }
            }
        ],
        minRealm: '筑基',
        minLayer: 5
    },
    
    // 自然类
    {
        id: 'event_spirit_source',
        name: '灵泉发现',
        type: EVENT_TYPES.NATURE,
        rarity: EVENT_RARITY.RARE,
        description: '你发现了一处隐秘的灵泉，泉水散发着浓郁的灵气。',
        choices: [
            { 
                id: 'drink', 
                text: '饮用灵泉', 
                effect: function() {
                    restoreAll(50);
                    showMessage('你饮用了灵泉，恢复了50点生命和真气！', 'success');
                }
            },
            { 
                id: 'bathe', 
                text: '沐浴灵泉', 
                effect: function() {
                    restoreAll(100);
                    gainCultivationBonus(100);
                    showMessage('你沐浴了灵泉，全面恢复了状态并获得了修炼灵感！', 'success');
                }
            },
            { 
                id: 'store', 
                text: '收集一些带走', 
                effect: function() {
                    // DES-72（第一百三十批）：旧写法丢了返回值——「收集了一瓶灵泉」照念，囊里进没进不管
                    var 收 = typeof window.giveWithReceipt === 'function'
                        ? window.giveWithReceipt('spec_spring_water', 1, { quiet: true })
                        : { got: Number(addItemToInventory('spec_spring_water', 1)) || 0, count: 1, name: (window.itemById && window.itemById['spec_spring_water'] && window.itemById['spec_spring_water'].name) || '灵泉水' };
                    if (收.got > 0) showMessage('你收集了 ' + 收.name + '×' + 收.got + '。', 'success');
                    else showMessage('你舀起一瓶 ' + 收.name + '，这一瓶却没能带进囊：'
                        + ((typeof window.addItemFailText === 'function' && window.addItemFailText(收.name)) || '这一件先还留在原处。'), 'warning'); // DES-90（第一百三十九批）：灵泉可再来，①形
                }
            }
        ],
        minRealm: '炼气',
        minLayer: 1
    }
];

// ============ 奇遇历史记录 ============
let eventHistory = [];
let eventFlags = {}; // 存储奇遇相关的标志

// ============ 初始化奇遇系统 ============
function initEventSystem() {
    const saved = localStorage.getItem('xianxia_event_flags');
    if (saved) {
        try {
            eventFlags = JSON.parse(saved);
        } catch (e) {
            console.error('加载奇遇标志失败:', e);
            eventFlags = {};
        }
    }
}

// ============ 保存奇遇标志 ============
function saveEventFlags() {
    localStorage.setItem('xianxia_event_flags', JSON.stringify(eventFlags));
}

// ============ 设置奇遇标志 ============
function setFlag(flagName) {
    eventFlags[flagName] = true;
    saveEventFlags();
}

// ============ 检查奇遇标志 ============
function hasFlag(flagName) {
    return !!eventFlags[flagName];
}

// ============ 移除奇遇标志 ============
function removeFlag(flagName) {
    delete eventFlags[flagName];
    saveEventFlags();
}

// ============ 触发随机事件 ============
function triggerRandomEvent(forceChance) {
    // 基础 5%，天气/世界事件修正；forceChance 可覆盖
    let chance = forceChance != null ? forceChance : 0.05;
    if (forceChance == null) {
        try {
            if (typeof window.getWeatherEventRateBonus === 'function') {
                chance *= (window.getWeatherEventRateBonus() || 1);
            }
            if (typeof window.getActiveWorldEventModifiers === 'function') {
                const wm = window.getActiveWorldEventModifiers();
                if (wm && wm.exploreLoot) chance *= Math.min(1.5, wm.exploreLoot);
                if (wm && wm.chestChance) chance = Math.max(chance, wm.chestChance * 0.3);
            }
        } catch (e) {}
    }
    if (Math.random() > Math.min(0.35, chance)) {
        return false;
    }
    
    const playerRealm = window.currentCharData?.realm || '炼气';
    const playerLayer = window.currentCharData?.layer || 1;
    
    let availableEvents = randomEvents.filter(event => {
        if (event.minRealm === '炼气' && (event.minLayer || 1) <= playerLayer) return true;
        if (event.minRealm === '筑基' && isRealmAtLeast(playerRealm, '筑基')) return true;
        if (event.minRealm === '金丹' && isRealmAtLeast(playerRealm, '金丹')) return true;
        if (event.minRealm && isRealmAtLeast(playerRealm, event.minRealm)) return true;
        return false;
    });
    // 连锁：若有 secret_realm_marked 提高 dungeon 权重——用复制加权抽选
    if (availableEvents.length === 0) return false;
    
    const pool = [];
    availableEvents.forEach(ev => {
        pool.push(ev);
        if (hasFlag('secret_realm_marked') && (ev.type === 'dungeon' || (ev.id && ev.id.indexOf('dungeon') >= 0))) {
            pool.push(ev); pool.push(ev);
        }
        if (hasFlag('bandit_ambushed') && (ev.id && ev.id.indexOf('bandit') >= 0)) {
            pool.push(ev); pool.push(ev);
        }
        if (hasFlag('fox_warning') && (ev.type === 'trap' || ev.type === 'battle')) {
            pool.push(ev);
        }
        if (hasFlag('recent_combat_victory') && ev.type === 'master') {
            pool.push(ev);
        }
    });
    
    const event = pool[Math.floor(Math.random() * pool.length)];
    
    eventHistory.push({
        eventId: event.id,
        timestamp: Date.now(),
        realm: playerRealm,
        layer: playerLayer
    });
    
    showEventDialog(event);
    return true;
}

// ============ 检查境界是否达到要求 ============
function isRealmAtLeast(currentRealm, targetRealm) {
    // DES-92（第一百三十二批）：「谁比谁高」只问全局那把尺（js/global-utils.js 的 window.realmIndex）。
    //   本文件这张表排在「渡劫」就断，于是飞升／金仙在 minRealm 那道门上一律判不够格——
    //   修到顶端的人反倒一桩高阶奇遇也刷不出来。门牌认不出 ⇒ 放行；玩家境界认不出 ⇒ 不够格。
    if (typeof window.realmIndex === 'function') {
        var t = window.realmIndex(targetRealm);
        if (t < 0) return true;
        return window.realmIndex(currentRealm) >= t;
    }
    // 真源没就绪时才吃这张本地表（第一百三十批起的棘轮基线里已计入，是特意留的回落，别当漏网再抄一张）
    const realmOrder = ['炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'];
    const currentIndex = realmOrder.indexOf(currentRealm);
    const targetIndex = realmOrder.indexOf(targetRealm);
    return currentIndex >= targetIndex;
}

// ============ 显示事件对话框 ============
function showEventDialog(event) {
    // F-38：先清掉旧的同 id modal（防重复堆叠），再加 overlay 点遮罩关闭 + ✕ 按钮 + 无 choices 时给关闭按钮
    const old = document.getElementById('event-modal');
    if (old) old.remove();
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50';
    modal.id = 'event-modal';
    modal.onclick = (e) => { if (e.target === modal) closeEventModal(); };

    const rarityColor = event.rarity?.color || 'text-gray-400';
    const rarityName = event.rarity?.name || '普通';

    let choicesHtml = '';
    if (event.choices && event.choices.length) {
        event.choices.forEach(choice => {
            choicesHtml += `
                <button onclick="handleEventChoice('${event.id}', '${choice.id}')"
                        class="w-full bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded mb-2 transition">
                    ${choice.text}
                </button>
            `;
        });
    } else {
        choicesHtml = `<button onclick="closeEventModal()" class="w-full bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded mb-2 transition">关闭</button>`;
    }

    modal.innerHTML = `
        <div class="bg-gray-900 border border-yellow-600 rounded-lg p-6 max-w-md w-full mx-4 relative">
            <button onclick="closeEventModal()" class="absolute top-2 right-3 text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
            <div class="flex items-center mb-4">
                <span class="text-3xl mr-3">${getEventIcon(event.type)}</span>
                <div>
                    <h3 class="text-xl font-bold text-yellow-400">${event.name}</h3>
                    <p class="text-xs ${rarityColor}">[${rarityName}]</p>
                </div>
            </div>
            <p class="text-gray-300 mb-4">${event.description}</p>
            <div class="choices-container">
                ${choicesHtml}
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// F-38：事件 modal 关闭入口（幂等——只移除当前存在的 event-modal）
function closeEventModal() {
    const m = document.getElementById('event-modal');
    if (m) m.remove();
}
window.closeEventModal = closeEventModal;

// ============ 处理事件选择 ============
function handleEventChoice(eventId, choiceId) {
    const event = findEventById(eventId);
    if (!event || !event.choices) return;
    
    const choice = event.choices.find(c => c.id === choiceId);
    if (!choice) return;
    
    // 执行效果
    if (typeof choice.effect === 'function') {
        choice.effect();
    }
    
    // v7.1 P2: 选择写入 flags，驱动事件连锁
    setFlag('event_done_' + eventId);
    setFlag('event_choice_' + eventId + '_' + choiceId);
    eventFlags['last_event_id'] = eventId;
    eventFlags['last_choice_id'] = choiceId;
    eventFlags['event_count'] = (eventFlags['event_count'] || 0) + 1;
    // 战斗类选择提高山贼/兽潮关联
    if (event.type === 'battle' || (event.id && event.id.indexOf('bandit') >= 0)) {
        setFlag('bandit_ambushed');
        // 第一百一十一波：此处原有 unlockBanditDenQuest()——打一架就「解锁巢穴」，而那两枚旗全仓无人读。
        // 得知一处地方改走特殊地点册（探监／官道脚印／酒肆传闻），挨过劫只是认得脚印的前提。
    }
    if (choiceId === 'fight' || choiceId === 'challenge') {
        setFlag('recent_combat_victory');
    }
    saveEventFlags();
    // 通知 choice-memory 若存在
    if (typeof window.recordStoryChoice === 'function') {
        try { window.recordStoryChoice(eventId, choiceId, choice.text || choiceId); } catch (e) {}
    }
    
    // 关闭模态框
    closeModal();
}

// ============ 获取事件图标 ============
function getEventIcon(type) {
    const icons = {
        [EVENT_TYPES.TREASURE]: '📦',
        [EVENT_TYPES.MASTER]: '🧙',
        [EVENT_TYPES.DUNGEON]: '🚪',
        [EVENT_TYPES.BATTLE]: '⚔️',
        [EVENT_TYPES.HERB]: '🌿',
        [EVENT_TYPES.TRAP]: '⚠️',
        [EVENT_TYPES.SPIRIT]: '🦊',
        [EVENT_TYPES.ARTIFACT]: '💎',
        [EVENT_TYPES.TEACHING]: '📖',
        [EVENT_TYPES.CURSE]: '💀',
        [EVENT_TYPES.BOSS]: '👹',
        [EVENT_TYPES.NATURE]: '⛲'
    };
    return icons[type] || '❓';
}

// ============ 查找事件 ============
function findEventById(eventId) {
    return randomEvents.find(e => e.id === eventId);
}

// ============ 生成宝藏掉落 ============
// 掉落是 { id | currency, count } 记录，不是中文串：旧版先拼「疗伤丹 x3」再按名字正则反解回奖励，
// 正是强制规则第 5 条禁止的方向，且已经因此静默失灵三处（玄铁剑／御剑只出声不入库、
// 妖兽内丹喂的是查无此物的 beast_core、灵石数额要从文案里抠数字）。
function generateTreasureLoot() {
    const loot = [];

    // 随机获得物品
    if (Math.random() < 0.5) {
        loot.push({ id: 'vitality_pill', count: 3 });
    }
    if (Math.random() < 0.3) {
        loot.push({ currency: 'spiritStones', count: 50 });
    }
    if (Math.random() < 0.1) {
        loot.push({ id: 'iron_sword', count: 1 });
    }

    return loot;
}

// ============ 生成山洞掉落 ============
function generateCaveLoot() {
    const loot = [];

    if (Math.random() < 0.4) {
        loot.push({ currency: 'spiritStones', count: 100 });
    }
    if (Math.random() < 0.3) {
        loot.push({ id: 'foundation_pill', count: 1 });
    }
    if (Math.random() < 0.2) {
        loot.push({ id: 'mat_demon_beast_core', count: 3 });
    }
    if (Math.random() < 0.1) {
        loot.push({ id: 'flying_sword', count: 1 });
    }

    return loot;
}

// 掉落账念给人看的那一行：名字现取物品表，不再另存一份手抄名
function lootLedgerText(loot) {
    return (loot || []).map(r => lootNameOf(r) + ' x' + r.count).join(', ');
}

function lootNameOf(r) {
    if (r.currency === 'spiritStones') return '灵石';
    return (window.itemById && window.itemById[r.id]) ? window.itemById[r.id].name : r.id;
}

// ============ 应用宝藏奖励 ============
function applyTreasureRewards(loot) {
    (loot || []).forEach(r => {
        if (r.currency === 'spiritStones') {
            if (typeof addSpiritStones === 'function') addSpiritStones(r.count);
            return;
        }
        const added = typeof addItemToInventory === 'function' ? addItemToInventory(r.id, r.count) : 0;
        if (!added) showMessage(lootNameOf(r) + ' 只能留在原地。' + ((typeof window.addItemFailText === 'function' && window.addItemFailText(lootNameOf(r))) || '这一件先还留在原处。'), 'warning');
    });
}

// ============ 触发高人 encounter ============
function triggerMasterEncounter(masterType) {
    switch(masterType) {
        case 'old_man':
            if (Math.random() < 0.5) {
                showMessage('老人传授了你一些修炼心得，你获得了经验！', 'success');
                gainExp(100);
            } else {
                showMessage('老人看了你一眼，说："你缘法未到。"', 'info');
            }
            break;
        case 'immortal_sage':
            if (Math.random() < 0.3) {
                showMessage('老者被你诚意打动，传授你一门功法！', 'success');
                learnRandomSkill();
            } else {
                // DES-72＋DES-89（第一百三十批）：旧写法先念「赠你丹药」再裸发奖且丢了返回值——报喜先于发货
                var 收 = typeof window.giveWithReceipt === 'function'
                    ? window.giveWithReceipt('qi_recovery_pill', 3, { quiet: true })
                    : { got: Number(addItemToInventory('qi_recovery_pill', 3)) || 0, count: 3, name: (window.itemById && window.itemById['qi_recovery_pill'] && window.itemById['qi_recovery_pill'].name) || '聚气丹', reason: window.addItemFailReason || null };
                showMessage('老者赠你丹药后飘然而去。' + (收.got > 0
                    ? '入手 ' + 收.name + '×' + 收.got + (收.got < 收.count ? '（另 ' + (收.count - 收.got) + ' 枚留在了石上：' + ((typeof window.addItemReasonPhraseFor === 'function' && window.addItemReasonPhraseFor(收.reason, 收.name)) || '没能落进你的行囊') + '）' : '')
                    : '那 ' + 收.count + ' 枚 ' + 收.name + ' 一件也没能带走：'
                      + ((typeof window.addItemFailText === 'function' && window.addItemFailText(收.name)) || '这一件先还留在原处。')), 'success'); // DES-90（第一百三十九批）：高人赠药可再来，①形
            }
            break;
        case 'observe':
            showMessage('你在一旁观摩，领悟了一些修炼窍门。', 'success');
            gainCultivationBonus(50);
            break;
    }
}

// ============ 进入秘境 ============
function enterSecretRealm() {
    // 优先走完整副本系统
    if (typeof window.openDungeonEntrance === 'function') {
        window.openDungeonEntrance('ruin');
        return;
    }
    showMessage('你进入了秘境，周围景色变幻...', 'info');
    
    setTimeout(() => {
        const events = [
            { msg: '你发现了一本上古功法！', action: () => learnRandomSkill() },
            { msg: '你遇到了一只守护兽，展开战斗！', action: () => startSecretRealmBattle() },
            { msg: '你找到了一处灵泉，恢复了状态！', action: () => restoreAll(100) },
            { msg: '你在秘境深处发现了宝藏！', action: () => applyTreasureRewards([{ currency: 'spiritStones', count: 200 }, { id: 'foundation_pill', count: 1 }]) }
        ];
        
        const event = events[Math.floor(Math.random() * events.length)];
        showMessage(event.msg, 'info');
        event.action();
    }, 1000);
}

// ============ 触发灵狐 encounter ============
function triggerFoxEncounter() {
    const responses = [
        { text: '灵狐说："前方有危险，请小心。"', effect: () => setFlag('fox_warning') },
        { text: '灵狐张口吐出一颗丹药，随后消失了。', effect: () => {
            // DES-72＋DES-89（第一百三十批）：旧写法先念「赠你丹药」再裸发奖、丢了返回值——报喜先于发货
            var 收 = typeof window.giveWithReceipt === 'function'
                ? window.giveWithReceipt('vitality_pill', 1, { quiet: true })
                : { got: Number(addItemToInventory('vitality_pill', 1)) || 0, count: 1, name: (window.itemById && window.itemById['vitality_pill'] && window.itemById['vitality_pill'].name) || '回春丹' };
            showMessage(收.got > 0
                ? '你拾起它：' + 收.name + '×' + 收.got + '。'
                : '那颗 ' + 收.name + ' 只好看着它留在草间：'
                  + ((typeof window.addItemFailText === 'function' && window.addItemFailText(收.name)) || '它没有跟你走。'), // DES-90（第一百三十九批）：灵狐赠药是一次性剧情，②形
                收.got > 0 ? 'success' : 'warning');
        } },
        { text: '灵狐与你嬉戏片刻后离去。', effect: () => gainExp(50) }
    ];
    
    const response = responses[Math.floor(Math.random() * responses.length)];
    showMessage(response.text, 'success');
    response.effect();
}

// ============ 开始灵狐战斗 ============
function startSpiritFoxBattle() {
    showMessage('九尾灵狐向你发起了攻击！', 'warning');
    // 这里应该调用战斗系统的函数
    if (window.startBattle) {
        window.startBattle('spirit_fox');
    }
}

// ============ 触发顿悟 ============
function triggerEnlightenment() {
    const success = Math.random() < 0.3;
    
    if (success) {
        showMessage('你顿悟了！对修炼有了更深的理解。', 'success');
        gainCultivationBonus(200);
        window.insightPoints = (window.insightPoints || 0) + 1; // v36 走合账后的悟道点账口（真源在角色数据上）
    } else {
        showMessage('你试图顿悟，但未能进入状态。', 'info');
    }
}

// ============ 开始Boss战 ============
function startBossBattle(bossType) {
    showMessage('Boss战开始！', 'warning');
    if (window.startBattle) {
        window.startBattle(bossType);
    }
}

// ============ 开始秘境战斗 ============
function startSecretRealmBattle() {
    showMessage('守护兽出现了！', 'warning');
    if (window.startBattle) {
        window.startBattle('secret_realm_guardian');
    }
}

// ============ 获得修炼加成 ============
function gainCultivationBonus(amount) {
    if (!window.currentCharData) return;
    let mul = 1;
    if (typeof window.getHouseBonus === 'function') {
        try { mul *= (window.getHouseBonus('cultivation') || 1); } catch(e) {}
    }
    if (typeof window.getActiveWorldEventModifiers === 'function') {
        try {
            var wm = window.getActiveWorldEventModifiers();
            if (wm && wm.cultivation) mul *= wm.cultivation;
        } catch(e) {}
    }
    const finalAmt = Math.floor(amount * mul);
    currentCharData.essence = (currentCharData.essence || 0) + finalAmt;
    showMessage(`获得 ${finalAmt} 点真元`, 'info');
}

// ============ 获得历练 ============
function gainExp(amount) {
    if (!window.currentCharData) return;
    currentCharData.tempering = (currentCharData.tempering || 0) + amount;
    showMessage(`获得 ${amount} 点经验`, 'info');
}

// ============ 扣除生命值 ============
function takeDamage(amount) {
    if (!window.currentCharData) return;
    currentCharData.health = Math.max(0, (currentCharData.health ?? 100) - amount);
    showMessage(`受到 ${amount} 点伤害`, 'error');
    updateStatusPanel();
}

// ============ 全面恢复 ============
function restoreAll(amount) {
    if (!window.currentCharData) return;
    currentCharData.health = Math.min(currentCharData.maxHealth || 100, (currentCharData.health || 0) + amount);
    currentCharData.qi = Math.min(currentCharData.maxQi || 100, (currentCharData.qi || 0) + amount);
    showMessage(`恢复了 ${amount} 点生命和真气`, 'success');
    updateStatusPanel();
}

// ============ 检查属性 ============
function checkAttribute(attrName, value) {
    if (!window.currentCharData) return false;
    const attrValue = currentCharData[attrName] || 0;
    return attrValue >= value;
}

// ============ 消耗物品 ============
function consumeItem(itemId, count) {
    if (!window.inventory || !window.inventory.slots) return false;
    
    let remaining = count;
    for (let i = 0; i < window.inventory.slots.length && remaining > 0; i++) {
        const slot = window.inventory.slots[i];
        if (slot && slot.templateId === itemId) {
            const consume = Math.min(slot.count, remaining);
            slot.count -= consume;
            remaining -= consume;
            
            if (slot.count <= 0) {
                window.inventory.slots[i] = null;
            }
        }
    }
    
    return remaining <= 0;
}

// ============ 学习随机功法 ============
function learnRandomSkill() {
    // v9.2：写入知识系统，优先从 skillPages 随机一门未学会的
    var pool = [];
    if (window.skillPages) {
        window.skillPages.forEach(function (page) {
            page.forEach(function (s) { pool.push(s); });
        });
    } else if (window.allSkills && window.allSkills.length) {
        pool = window.allSkills.slice();
    }
    if (!pool.length) {
        showMessage('没有可学的功法定义', 'warning');
        return;
    }
    if (window.KnowledgeSystem) {
        pool = pool.filter(function (s) {
            return !window.KnowledgeSystem.canEquip(s.id);
        });
        if (!pool.length) {
            showMessage('你已学会当前可见的全部功法', 'info');
            return;
        }
    }
    var skill = pool[Math.floor(Math.random() * pool.length)];
    if (window.KnowledgeSystem && window.KnowledgeSystem.unlock) {
        window.KnowledgeSystem.unlock(skill.id, 'learned', { source: 'event', completeness: 100 });
        showMessage('你学会了功法：' + skill.name + '！', 'success');
        if (typeof renderEquipmentPanel === 'function') renderEquipmentPanel();
        if (typeof renderSkillBrowse === 'function') renderSkillBrowse();
    } else {
        showMessage('你学会了功法：' + skill.name, 'success');
    }
}

// ============ 关闭模态框 ============
function closeModal() {
    const modal = document.getElementById('event-modal');
    if (modal) {
        modal.remove();
    }
}

// ============ 获取奇遇历史 ============
function getEventHistory(limit = 10) {
    return eventHistory.slice(-limit);
}

// ============ 清空奇遇历史 ============
function clearEventHistory() {
    eventHistory = [];
}

// ============ 导出到全局 ============
window.eventFlags = eventFlags;
window.setFlag = setFlag;
window.hasFlag = hasFlag;
window.removeFlag = removeFlag;
window.handleEventChoice = handleEventChoice;
window.eventSystem = {
    initEventSystem,
    triggerRandomEvent,
    showEventDialog,
    handleEventChoice,
    getEventHistory,
    clearEventHistory,
    setFlag,
    hasFlag,
    removeFlag,
    EVENT_TYPES,
    EVENT_RARITY,
    randomEvents,
    eventFlags,
    getEventFlags: function() { return eventFlags; }
};

// 自动初始化
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        initEventSystem();
    });
}
