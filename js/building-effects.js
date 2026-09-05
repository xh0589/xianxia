// ==================== building-effects.js - 建筑效果系统 ====================
// 定义每种建筑的具体效果，与现有系统集成

// ============ 建筑效果注册表 ============
const buildingEffectsRegistry = {};

// ============ 坊市/商店效果 ============
buildingEffectsRegistry['shop'] = {
    // 打开商店界面
    open: function() {
        if (window.inventory && window.inventory.openShop) {
            window.inventory.openShop('city_shop');
        } else if (window.showBuildingEffectDialog) {
            showBuildingEffectDialog('坊市', `
                <div class="space-y-3">
                    <h4 class="text-yellow-400 font-bold">购买物品</h4>
                    <button onclick="buyFromShop('healing_pill')" class="w-full bg-gray-700 hover:bg-gray-600 p-2 rounded text-left">
                        <span class="text-green-400">疗伤丹</span> - 50灵石<br>
                        <span class="text-xs text-gray-400">恢复100点生命值</span>
                    </button>
                    <button onclick="buyFromShop('qi_pill')" class="w-full bg-gray-700 hover:bg-gray-600 p-2 rounded text-left">
                        <span class="text-blue-400">聚气丹</span> - 80灵石<br>
                        <span class="text-xs text-gray-400">恢复30点真气</span>
                    </button>
                    <button onclick="buyFromShop('foundation_pill')" class="w-full bg-gray-700 hover:bg-gray-600 p-2 rounded text-left">
                        <span class="text-purple-400">筑基丹</span> - 500灵石<br>
                        <span class="text-xs text-gray-400">提升筑基成功率</span>
                    </button>
                    <hr class="border-gray-700">
                    <h4 class="text-orange-400 font-bold">出售物品</h4>
                    <p class="text-xs text-gray-400">打开背包选择出售物品...</p>
                </div>
            `);
        }
    },
    
    // 购买物品
    buy: function(itemId, price) {
        if (!window.inventory?.currency) {
            showMessage('背包货币未初始化', 'error');
            return false;
        }
        const stones = window.inventory.currency.spiritStones || 0;
        if (stones < price) {
            showMessage('灵石不足！', 'error');
            return false;
        }
        // id 映射
        const idMap = { healing_pill: 'vitality_pill', qi_pill: 'qi_recovery_pill' };
        const realId = idMap[itemId] || itemId;
        let added = false;
        if (typeof window.addItem === 'function') added = !!window.addItem(realId, 1);
        else if (window.addItemToInventory) { window.addItemToInventory(realId, 1); added = true; }
        if (!added) {
            showMessage('背包已满或物品无效', 'error');
            return false;
        }
        window.inventory.currency.spiritStones = stones - price;
        showMessage(`购买了 ${realId}，花费 ${price} 灵石`, 'success');
        if (window.updateCurrencyUI) window.updateCurrencyUI();
        if (window.updateInventoryUI) window.updateInventoryUI();
        if (window.updateStatusPanel) window.updateStatusPanel();
        if (window.updateCharacterStatus) window.updateCharacterStatus();
        return true;
    }
};

// ============ 炼丹房效果 ============
buildingEffectsRegistry['alchemy'] = {
    // 打开炼丹界面
    open: function() {
        if (window.openCraftingUI) {
            window.openCraftingUI('pilfer');
        } else if (window.showBuildingEffectDialog) {
            showBuildingEffectDialog('炼丹房', `
                <div class="space-y-3">
                    <p class="text-sm text-gray-400 mb-2">选择要炼制的丹药：</p>
                    <button onclick="openCraftingUI('pilfer')" class="w-full bg-green-700 hover:bg-green-600 p-3 rounded">
                        <span class="text-green-400 font-bold">🧪 开始炼丹</span>
                    </button>
                    <div class="text-xs text-gray-500 mt-2">
                        <p>需要材料：灵芝、灵草、五行精华等</p>
                        <p>炼丹成功率受医术技能影响</p>
                    </div>
                </div>
            `);
        }
    }
};

// ============ 铁匠铺效果 ============
buildingEffectsRegistry['forging'] = {
    // 打开锻造界面
    open: function() {
        if (window.openCraftingUI) {
            window.openCraftingUI('forging');
        } else if (window.showBuildingEffectDialog) {
            showBuildingEffectDialog('铁匠铺', `
                <div class="space-y-3">
                    <p class="text-sm text-gray-400 mb-2">选择要进行的操作：</p>
                    <button onclick="openCraftingUI('forging')" class="w-full bg-orange-700 hover:bg-orange-600 p-3 rounded">
                        <span class="text-orange-400 font-bold">⚒️ 锻造装备</span>
                    </button>
                    <button onclick="openEnhancementUI()" class="w-full bg-red-700 hover:bg-red-600 p-3 rounded">
                        <span class="text-red-400 font-bold">🔨 强化装备</span>
                    </button>
                    <div class="text-xs text-gray-500 mt-2">
                        <p>需要材料：铁矿、五行精华、灵石等</p>
                        <p>锻造成功率受锻造技能影响</p>
                    </div>
                </div>
            `);
        }
    }
};

// ============ 任务堂效果 ============
buildingEffectsRegistry['quest'] = {
    // 打开任务界面
    open: function() {
        if (window.questSystem && window.questSystem.showQuestPanel) {
            window.questSystem.showQuestPanel();
        } else if (window.showBuildingEffectDialog) {
            showBuildingEffectDialog('任务堂', `
                <div class="space-y-3">
                    <p class="text-sm text-gray-400 mb-2">可接取的任务：</p>
                    <button onclick="acceptQuest('daily_001')" class="w-full bg-blue-700 hover:bg-blue-600 p-2 rounded text-left">
                        <span class="text-blue-400 font-bold">晨练修行</span> <span class="text-xs text-gray-400">[日常]</span><br>
                        <span class="text-xs text-gray-400">完成每日晨练，获得历练奖励</span>
                    </button>
                    <button onclick="acceptQuest('daily_002')" class="w-full bg-blue-700 hover:bg-blue-600 p-2 rounded text-left">
                        <span class="text-blue-400 font-bold">采集灵药</span> <span class="text-xs text-gray-400">[日常]</span><br>
                        <span class="text-xs text-gray-400">采集10株灵草</span>
                    </button>
                    <button onclick="acceptQuest('combat_001')" class="w-full bg-red-700 hover:bg-red-600 p-2 rounded text-left">
                        <span class="text-red-400 font-bold">剿灭匪患</span> <span class="text-xs text-gray-400">[讨伐]</span><br>
                        <span class="text-xs text-gray-400">剿灭山贼10名</span>
                    </button>
                </div>
            `);
        }
    },
    
    // 接取任务
    acceptQuest: function(questId) {
        if (window.questSystem && window.questSystem.acceptQuest) {
            return window.questSystem.acceptQuest(questId);
        }
        return false;
    }
};

// ============ 客栈效果 ============
buildingEffectsRegistry['inn'] = {
    // 休息恢复
    rest: function() {
        if (!window.currentCharData) return false;
        
        const cost = 10;
        // 使用 DataManager 统一灵石访问
        const dm = window.XianXia?.DataManager;
        const hasStones = dm ? dm.getSpiritStones() >= cost : (currentCharData.spiritStones || 0) >= cost;
        if (!hasStones) {
            showMessage(`需要${cost}灵石`, 'error');
            return false;
        }
        
        if (dm) {
            dm.deductSpiritStones(cost);
        } else {
            currentCharData.spiritStones = (currentCharData.spiritStones || 0) - cost;
        }
        currentCharData.health = currentCharData.maxHealth || 100;
        currentCharData.qi = currentCharData.maxQi || 100;
        currentCharData.energy = currentCharData.maxEnergy || 100;
        
        if (window.timeSystem) {
            window.timeSystem.advanceTime(120);
        }
        
        showMessage('在客栈休息了一晚，状态完全恢复！', 'success');
        if (window.updateStatusPanel) window.updateStatusPanel();
        return true;
    },
    
    // v20.7 包间休息（原 room_upgrade 死按钮补活）：贵版休息——清负面状态与毒素
    'room_upgrade': function() {
        if (!window.currentCharData) return false;
        const cost = 50;
        const dm = window.XianXia?.DataManager;
        if (dm && typeof dm.deductSpiritStones === 'function') {
            if (!dm.deductSpiritStones(cost)) { showMessage(`包间需${cost}灵石`, 'error'); return false; }
        } else {
            if ((currentCharData.spiritStones || 0) < cost) { showMessage(`包间需${cost}灵石`, 'error'); return false; }
            currentCharData.spiritStones -= cost;
        }
        currentCharData.health = currentCharData.maxHealth || 100;
        currentCharData.qi = currentCharData.maxQi || 100;
        currentCharData.energy = currentCharData.maxEnergy || 100;
        if (Array.isArray(currentCharData.statusEffects)) currentCharData.statusEffects = [];
        if (currentCharData._poisoned) {
            currentCharData._poisoned = false;
            showMessage('包间熏香压住了毒气，体毒暂退（解毒丹才能根除）。', 'info');
        }
        if (window.timeSystem) window.timeSystem.advanceTime(240, '包间静养');
        showMessage('包间一觉到天光，诸般负面尽消！', 'success');
        if (window.updateStatusPanel) window.updateStatusPanel();
        return true;
    },

    // 显示选项
    open: function() {
        if (window.showBuildingEffectDialog) {
            showBuildingEffectDialog('客栈', `
                <div class="space-y-3">
                    <p class="text-sm text-gray-400 mb-2">选择要进行的操作：</p>
                    <button onclick="useBuildingEffect('inn', 'rest')" class="w-full bg-purple-700 hover:bg-purple-600 p-3 rounded">
                        <span class="text-purple-400 font-bold">🛏️ 休息一晚</span> <span class="text-xs text-gray-400">(10灵石)</span><br>
                        <span class="text-xs text-gray-400">完全恢复生命、真气和精力</span>
                    </button>
                    <button onclick="useBuildingEffect('inn', 'room_upgrade')" class="w-full bg-indigo-700 hover:bg-indigo-600 p-3 rounded">
                        <span class="text-indigo-400 font-bold">🏠 包间休息</span> <span class="text-xs text-gray-400">(50灵石)</span><br>
                        <span class="text-xs text-gray-400">获得修炼加成，恢复全部状态</span>
                    </button>
                </div>
            `);
        }
    }
};

// ============ 演武场效果 ============
buildingEffectsRegistry['training'] = {
    // 开始训练
    train: function() {
        if (!window.currentCharData) return false;
        
        if ((currentCharData.energy || 0) < 20) {
            showMessage('精力不足！', 'error');
            return false;
        }
        
        currentCharData.energy -= 20;
        
        const baseExp = 10;
        const strengthBonus = Math.floor((currentCharData.mainAttributes?.力量 || 10) / 10);
        const expGain = baseExp + strengthBonus;
        
        currentCharData.tempering = (currentCharData.tempering || 0) + expGain;
        
        // 可能触发战斗训练
        if (Math.random() < 0.3) {
            if (window.startBattle) {
                window.startBattle('training_dummy');
            }
        }
        
        if (window.timeSystem) {
            window.timeSystem.advanceTime(60);
        }
        
        showMessage(`在演武场训练获得 ${expGain} 点经验`, 'success');
        if (window.updateStatusPanel) window.updateStatusPanel();
        
        // F-24：切磋推进 daily_003（type:'sparring'）。此前误把 'sparring' 当 questId 传
        // updateQuestObjective，findQuestById 返回 null，daily_003 永不可完成
        if (window.advanceQuestObjectivesFromEvent) {
            window.advanceQuestObjectivesFromEvent('sparring', { amount: 1 });
        }
        
        return true;
    },
    
    // v20.7 静心修炼（原 meditate 死按钮补活）：以真气换少量真元
    meditate: function() {
        if (!window.currentCharData) return false;
        if ((currentCharData.qi || 0) < 30) {
            showMessage('真气不足 30，静不下来！', 'error');
            return false;
        }
        currentCharData.qi -= 30;
        currentCharData.essence = (currentCharData.essence || 0) + 10;
        if (window.timeSystem) window.timeSystem.advanceTime(60, '演武场静坐');
        showMessage('桩上静坐一个时辰，真元 +10——练武之地也能养气。', 'success');
        if (window.updateStatusPanel) window.updateStatusPanel();
        return true;
    },

    // 打开界面
    open: function() {
        if (window.showBuildingEffectDialog) {
            showBuildingEffectDialog('演武场', `
                <div class="space-y-3">
                    <p class="text-sm text-gray-400 mb-2">选择训练方式：</p>
                    <button onclick="useBuildingEffect('training', 'train')" class="w-full bg-red-700 hover:bg-red-600 p-3 rounded">
                        <span class="text-red-400 font-bold">⚔️ 实战训练</span> <span class="text-xs text-gray-400">(20精力)</span><br>
                        <span class="text-xs text-gray-400">获得历练，可能遭遇训练对手</span>
                    </button>
                    <button onclick="useBuildingEffect('training', 'meditate')" class="w-full bg-blue-700 hover:bg-blue-600 p-3 rounded">
                        <span class="text-blue-400 font-bold">🧘 静心修炼</span> <span class="text-xs text-gray-400">(30真气)</span><br>
                        <span class="text-xs text-gray-400">提升真元</span>
                    </button>
                </div>
            `);
        }
    }
};

// ============ 传送阵效果 ============
buildingEffectsRegistry['teleport'] = {
    // v20.7 修复：旧版按钮 action 名 teleport_to_X 与注册表协议不匹配，永远报"没有该功能"。
    // 现在按钮统一走 go(城市)，先由 travelSystem 校验（目的地未解锁会被拒、不扣费），成行才收 100 灵石。
    go: function(cityName) {
        if (!window.travelSystem || typeof window.travelSystem.startTravel !== 'function') {
            showMessage('传送阵尚未联通（旅行系统未就绪）', 'error');
            return false;
        }
        var ok = window.travelSystem.startTravel(cityName, 'teleport');
        if (ok === false) return false; // startTravel 自带缘由提示（未解锁/已在途中等）
        var dm = window.XianXia && window.XianXia.DataManager;
        if (dm && typeof dm.deductSpiritStones === 'function') {
            if (!dm.deductSpiritStones(100)) {
                showMessage('传送耗灵甚巨，100 灵石祭阵费不够。', 'error');
                return false;
            }
        } else if (window.currentCharData) {
            if ((window.currentCharData.spiritStones || 0) < 100) {
                showMessage('传送耗灵甚巨，100 灵石祭阵费不够。', 'error');
                return false;
            }
            window.currentCharData.spiritStones -= 100;
        }
        if (window.timeSystem) window.timeSystem.advanceTime(30, '传送阵蓄能');
        showMessage('阵光一闪，你已立于「' + cityName + '」城门外（祭阵费 100 灵石）。', 'success');
        return true;
    },

    // 打开界面（v20.7：去掉 showTravelMethodSelect 死门槛，只依赖 locationSystem）
    open: function() {
        if (window.locationSystem && window.locationSystem.cityData) {
            showBuildingEffectDialog('传送阵', `
                <div class="space-y-2">
                    <p class="text-sm text-gray-400 mb-2">选择目的地（100灵石/次，须已解锁传送阵）：</p>
                    ${Object.keys(window.locationSystem.cityData).filter(c => c !== window.locationSystem.getCurrentLocation()).map(city => `
                        <button onclick="useBuildingEffect('teleport', 'go', '${city}')"
                                class="w-full bg-cyan-700 hover:bg-cyan-600 p-2 rounded text-left">
                            <span class="text-cyan-400">${city}</span>
                            <span class="text-xs text-gray-400 ml-2">[${window.locationSystem.cityData[city].region}]</span>
                        </button>
                    `).join('')}
                </div>
            `);
        }
    }
};

// ============ 洞府效果 ============
buildingEffectsRegistry['cultivation'] = {
    // 开始修炼
    cultivate: function() {
        if (!window.currentCharData) return false;
        
        if ((currentCharData.qi || 0) < 20) {
            showMessage('真气不足！', 'error');
            return false;
        }
        // v20.7 堵免费刷：布阵燃香 5 灵石（世界成本，非次数配额）
        {
            const dmC = window.XianXia?.DataManager;
            if (dmC && typeof dmC.deductSpiritStones === 'function') {
                if (!dmC.deductSpiritStones(5)) { showMessage('布阵燃香需 5 灵石，请添香火再修。', 'warning'); return false; }
            } else if ((currentCharData.spiritStones || 0) >= 5) {
                currentCharData.spiritStones -= 5;
            }
        }

        currentCharData.qi -= 20;

        let cultivationBonus = 1.0;
        if (window.timeSystem) {
            cultivationBonus = window.timeSystem.getCultivationSpeedBonus();
        }
        
        let _cultMul = cultivationBonus;
        // v20.8：门派特色 buff 的 cultivationSpeed 在此真实结算（全真/大明/昆仑等，此前无读者）
        if (typeof window.getSectBuffCultivationMul === 'function') {
            try { _cultMul *= window.getSectBuffCultivationMul(); } catch (eSb) {}
        }
        if (typeof window.getHouseBonus === 'function') {
            try { _cultMul *= (window.getHouseBonus('cultivation') || 1); } catch(e) {}
        }
        if (typeof window.getCultivationSpeedBonusFromQi === 'function') {
            try { _cultMul *= (window.getCultivationSpeedBonusFromQi() || 1); } catch(e) {}
        }
        if (typeof window.getActiveWorldEventModifiers === 'function') {
            try {
                var _wm = window.getActiveWorldEventModifiers();
                if (_wm && _wm.cultivation) _cultMul *= _wm.cultivation;
            } catch(e) {}
        }
        // v20.7 灵泉余泽真实生效（springBlessing 此前只写不读）：×1.15，逐坐消耗
        let _zeYu = false;
        if ((currentCharData.springBlessing || 0) > 0) {
            _cultMul *= 1.15;
            currentCharData.springBlessing -= 1;
            _zeYu = true;
        }
        const expGain = Math.floor(30 * _cultMul);
        currentCharData.essence = (currentCharData.essence || 0) + expGain;
        
        if (window.timeSystem) {
            window.timeSystem.advanceTime(120);
        }
        
        showMessage(`修炼获得 ${expGain} 点真元` + (_zeYu ? '（灵泉余泽 +15%）' : ''), 'success');
        if (window.updateStatusPanel) window.updateStatusPanel();
        return true;
    },

    // 突破境界
    breakthrough: function() {
        if (window.cultivationSystem && window.cultivationSystem.showBreakthroughUI) {
            window.cultivationSystem.showBreakthroughUI();
        } else if (window.showBuildingEffectDialog) {
            showBuildingEffectDialog('突破', `
                <div class="space-y-3">
                    <p class="text-sm text-gray-400">当前境界：${currentCharData.realm || '炼气'} ${getLayerName(currentCharData.layer || 1)}期</p>
                    <p class="text-sm text-gray-400">真元：${currentCharData.essence || 0}</p>
                    <button onclick="performBreakthrough()" class="w-full bg-yellow-700 hover:bg-yellow-600 p-3 rounded">
                        <span class="text-yellow-400 font-bold">尝试突破</span>
                    </button>
                </div>
            `);
        }
    },
    
    // 打开界面
    open: function() {
        if (window.showBuildingEffectDialog) {
            showBuildingEffectDialog('洞府', `
                <div class="space-y-3">
                    <p class="text-sm text-gray-400 mb-2">选择要进行的操作：</p>
                    <button onclick="useBuildingEffect('cultivation', 'cultivate')" class="w-full bg-indigo-700 hover:bg-indigo-600 p-3 rounded">
                        <span class="text-indigo-400 font-bold">🧘 静心修炼</span> <span class="text-xs text-gray-400">(20真气/5灵石香火)</span><br>
                        <span class="text-xs text-gray-400">获得真元；若有灵泉余泽，事半功倍</span>
                    </button>
                    <button onclick="useBuildingEffect('cultivation', 'breakthrough')" class="w-full bg-yellow-700 hover:bg-yellow-600 p-3 rounded">
                        <span class="text-yellow-400 font-bold">⬆️ 尝试突破</span><br>
                        <span class="text-xs text-gray-400">消耗材料提升境界</span>
                    </button>
                </div>
            `);
        }
    }
};

// ============ 灵泉效果 ============
buildingEffectsRegistry['spring'] = {
    // 沐浴灵泉（v20.21 堵免费回满：引泉水冲刷经脉须真气护体，泉养身心、填不满道基——
    // 烧 20 真气换气血+30/精力+50 的部分恢复，回满仍归客栈安歇，名实相符）
    bathe: function() {
        if (!window.currentCharData) return false;
        if ((currentCharData.qi || 0) < 20) {
            showMessage('引泉水冲刷经脉须真气护体，真气不足 20，下去也是白泡。', 'error');
            return false;
        }
        currentCharData.qi -= 20;
        currentCharData.health = Math.min(currentCharData.maxHealth || 100, (currentCharData.health || 0) + 30);
        currentCharData.energy = Math.min(currentCharData.maxEnergy || 100, (currentCharData.energy || 0) + 50);

        // 可能获得特殊增益
        if (Math.random() < 0.2) {
            currentCharData.springBlessing = (currentCharData.springBlessing || 0) + 1;
            showMessage('沐浴灵泉，获得了灵气加持！', 'success');
        }

        if (window.timeSystem) {
            window.timeSystem.advanceTime(60);
        }

        showMessage('泉水冲开滞涩，气血+30、精力+50（真气 -20）。泉水养身，填不满道基——要回满，去客栈安歇。', 'success');
        if (window.updateStatusPanel) window.updateStatusPanel();
        return true;
    },
    
    // v20.7 收集灵泉（原 collect 死按钮补活）：灌一瓶灵气，修炼时享余泽（存 3 止）
    collect: function() {
        if (!window.currentCharData) return false;
        if ((currentCharData.energy || 0) < 10) {
            showMessage('精力不足，舀不动一捧灵泉。', 'error');
            return false;
        }
        if ((currentCharData.springBlessing || 0) >= 3) {
            showMessage('随身灵泉余泽已满（3），贪多则溢。', 'info');
            return false;
        }
        currentCharData.energy -= 10;
        currentCharData.springBlessing = (currentCharData.springBlessing || 0) + 1;
        if (window.timeSystem) window.timeSystem.advanceTime(30, '灵泉汲水');
        showMessage('🏺 灌下一瓶灵泉灵气，下次修炼事半功倍（余泽 ' + currentCharData.springBlessing + '/3）。', 'success');
        return true;
    },

    // 打开界面
    open: function() {
        if (window.showBuildingEffectDialog) {
            showBuildingEffectDialog('灵泉', `
                <div class="space-y-3">
                    <p class="text-sm text-gray-400 mb-2">灵泉散发着浓郁的灵气...</p>
                    <button onclick="useBuildingEffect('spring', 'bathe')" class="w-full bg-teal-700 hover:bg-teal-600 p-3 rounded">
                        <span class="text-teal-400 font-bold">⛲ 沐浴灵泉</span><br>
                        <span class="text-xs text-gray-400">耗 20 真气，气血+30、精力+50（回满请去客栈）</span>
                    </button>
                    <button onclick="useBuildingEffect('spring', 'collect')" class="w-full bg-cyan-700 hover:bg-cyan-600 p-3 rounded">
                        <span class="text-cyan-400 font-bold">🏺 收集灵泉</span><br>
                        <span class="text-xs text-gray-400">获得一瓶灵泉水</span>
                    </button>
                </div>
            `);
        }
    }
};

// ============ 寺庙效果 ============
buildingEffectsRegistry['temple'] = {
    // 祈福
    pray: function() {
        if (!window.currentCharData) return false;
        
        const karma = currentCharData.karma || 0;
        if (karma < -50) {
            showMessage('恶孽深重，神明不会回应你...', 'error');
            return false;
        }
        // v20.7 香火钱 20 灵石（原零成本白拿）；庇佑有真实牙齿——毒洞试毒可挡一次
        {
            const dmP = window.XianXia?.DataManager;
            if (dmP && typeof dmP.deductSpiritStones === 'function') {
                if (!dmP.deductSpiritStones(20)) { showMessage('香火钱需 20 灵石。', 'warning'); return false; }
            } else if ((currentCharData.spiritStones || 0) >= 20) {
                currentCharData.spiritStones -= 20;
            }
        }

        currentCharData.blessing = (currentCharData.blessing || 0) + 1;
        
        // 净化负面状态
        if (window.currentCharData.statusEffects) {
            currentCharData.statusEffects = [];
        }
        
        if (window.timeSystem) {
            window.timeSystem.advanceTime(30);
        }
        
        showMessage('在寺庙中祈福（香火 20 灵石），神明庇佑之身可挡一次毒瘴！', 'success');
        return true;
    },

    // v20.7 寺中静修（原 meditate 死按钮补活）
    meditate: function() {
        if (!window.currentCharData) return false;
        if ((currentCharData.qi || 0) < 20) {
            showMessage('真气不足 20。', 'error');
            return false;
        }
        currentCharData.qi -= 20;
        currentCharData.essence = (currentCharData.essence || 0) + 12;
        currentCharData.karma = (currentCharData.karma || 0) + 1;
        if (window.timeSystem) window.timeSystem.advanceTime(60, '寺中静修');
        showMessage('钟磬声中静修，真元 +12，佛缘 +1。', 'success');
        if (window.updateStatusPanel) window.updateStatusPanel();
        return true;
    },

    // 打开界面
    open: function() {
        if (window.showBuildingEffectDialog) {
            showBuildingEffectDialog('寺庙', `
                <div class="space-y-3">
                    <p class="text-sm text-gray-400 mb-2">选择要进行的操作：</p>
                    <button onclick="useBuildingEffect('temple', 'pray')" class="w-full bg-yellow-700 hover:bg-yellow-600 p-3 rounded">
                        <span class="text-yellow-400 font-bold">🙏 祈福祷告</span><br>
                        <span class="text-xs text-gray-400">净化负面状态，获得神明庇佑</span>
                    </button>
                    <button onclick="useBuildingEffect('temple', 'meditate')" class="w-full bg-orange-700 hover:bg-orange-600 p-3 rounded">
                        <span class="text-orange-400 font-bold">🧘 寺中静修</span><br>
                        <span class="text-xs text-gray-400">获得真元</span>
                    </button>
                </div>
            `);
        }
    }
};

// ============ 酒楼效果 ============
buildingEffectsRegistry['tavern'] = {
    // 喝酒听情报
    drink: function() {
        if (!window.currentCharData) return false;
        
        const cost = 20;
        if ((currentCharData.copper || 0) < cost) {
            showMessage(`需要${cost}铜钱`, 'error');
            return false;
        }
        
        // F-17：铜钱统一走 DataManager（此前 charData-only 写入，DataManager 读 inventory 致 in-play 数值错）
        if (window.XianXia && window.XianXia.DataManager && typeof window.XianXia.DataManager.deductCopper === 'function') {
            window.XianXia.DataManager.deductCopper(cost);
        } else {
            currentCharData.copper = Math.max(0, (currentCharData.copper || 0) - cost);
        }
        
        // 可能触发事件
        if (window.eventSystem && Math.random() < 0.3) {
            window.eventSystem.triggerRandomEvent();
        }
        
        // v20.7 情报来自真传闻池（RUMOR_LOG），此前是 8 条硬编码文案掷骰
        const intel = generateTavernIntel();
        if (intel) showMessage(`在酒楼听到了情报：${intel}`, 'info');

        if (window.timeSystem) {
            window.timeSystem.advanceTime(30);
        }

        if (window.updateStatusPanel) window.updateStatusPanel();
        return true;
    },

    // v20.7 结识NPC（原 meet_npc 死按钮补活）：做东 40 铜钱请同地修士入席
    'meet_npc': function() {
        if (!window.currentCharData) return false;
        const cost = 40;
        if (window.XianXia && window.XianXia.DataManager && typeof window.XianXia.DataManager.deductCopper === 'function') {
            if (!window.XianXia.DataManager.deductCopper(cost)) { showMessage(`做东需${cost}铜钱`, 'error'); return false; }
        } else if ((currentCharData.copper || 0) >= cost) {
            currentCharData.copper -= cost;
        } else {
            showMessage(`做东需${cost}铜钱`, 'error'); return false;
        }
        const myLoc = (window.currentCharData && window.currentCharData.location) || null;
        let pool = [];
        if (myLoc && window.npcManager && typeof window.npcManager.getAllNPCs === 'function') {
            const all = window.npcManager.getAllNPCs() || [];
            for (let i = 0; i < all.length; i++) {
                const n = all[i];
                if (n && !n.isDead && !n.isMissing && n.location === myLoc) pool.push(n);
            }
        }
        if (!pool.length) {
            showMessage('菜上齐了，邻座却始终空着——今日这地界没有可结识的修士，酒钱照付。', 'info');
            if (window.timeSystem) window.timeSystem.advanceTime(30, '酒楼做东');
            return true; // 请客成本已发生，世界不为空座退款
        }
        const npc = pool[Math.floor(Math.random() * pool.length)];
        if (typeof npc.changeAffection === 'function') npc.changeAffection(2);
        showMessage(`👥 你请「${npc.name}」吃了杯酒，对方落座攀谈起来（好感 +2）。`, 'success');
        if (window.timeSystem) window.timeSystem.advanceTime(30, '酒楼做东');
        // 与街面攀谈同款：关掉本弹窗后直接开对话
        if (typeof window.closeBuildingDialog === 'function') window.closeBuildingDialog();
        if (typeof window.showNPCDialog === 'function') {
            setTimeout(function () { window.showNPCDialog(npc.id); }, 100);
        }
        return true;
    },
    
    // 打开界面
    open: function() {
        if (window.showBuildingEffectDialog) {
            showBuildingEffectDialog('酒楼', `
                <div class="space-y-3">
                    <p class="text-sm text-gray-400 mb-2">选择要进行的操作：</p>
                    <button onclick="useBuildingEffect('tavern', 'drink')" class="w-full bg-amber-700 hover:bg-amber-600 p-3 rounded">
                        <span class="text-amber-400 font-bold">🍶 喝酒听情报</span> <span class="text-xs text-gray-400">(20铜钱)</span><br>
                        <span class="text-xs text-gray-400">可能触发随机事件</span>
                    </button>
                    <button onclick="useBuildingEffect('tavern', 'meet_npc')" class="w-full bg-red-700 hover:bg-red-600 p-3 rounded">
                        <span class="text-red-400 font-bold">👥 结识NPC</span><br>
                        <span class="text-xs text-gray-400">可能遇到其他修士</span>
                    </button>
                </div>
            `);
        }
    }
};

// ============ 黑市效果 ============
buildingEffectsRegistry['market'] = {
    // 打开黑市
    open: function() {
        if (window.showBuildingEffectDialog) {
            showBuildingEffectDialog('黑市', `
                <div class="space-y-3">
                    <p class="text-sm text-gray-400 mb-2">黑市交易风险与机遇并存...</p>
                    <button onclick="buyBlackMarketItem()" class="w-full bg-gray-700 hover:bg-gray-600 p-3 rounded">
                        <span class="text-gray-400 font-bold">购买稀有物品</span><br>
                        <span class="text-xs text-gray-500">价格优惠，但有被发现的 risk</span>
                    </button>
                    <button onclick="sellBlackMarketItem()" class="w-full bg-red-900 hover:bg-red-800 p-3 rounded">
                        <span class="text-red-400 font-bold">出售不明物品</span><br>
                        <span class="text-xs text-gray-500">高价回收，不问来源</span>
                    </button>
                </div>
            `);
        }
    }
};

// ============ 生成酒楼情报 ============
// v20.7：优先从真实传闻池（NPCLife.RUMOR_LOG）取材——听到的就是世界里真发生的事
// （含 NPC 走形传歪的 🌀 版本）；池空时才退回旧静态池兜底。
function generateTavernIntel() {
    if (window.NPCLife && typeof window.NPCLife.getRumorLog === 'function') {
        const log = window.NPCLife.getRumorLog(30) || [];
        if (log.length) {
            const r = log[Math.floor(Math.random() * Math.min(log.length, 12))];
            if (r && r.summary) return (r.distorted ? '🌀 ' : '') + r.summary;
        }
    }
    const inTELs = [
        '最近山贼活动频繁，出行要小心',
        '听说某地发现了秘境入口',
        '坊市的物价最近有所上涨',
        '有个修士在附近猎杀了妖兽王',
        '某门派正在招收弟子',
        '远处有妖兽出没的传闻',
        '某处灵药园需要采集工人',
        '黑市最近到了些好东西'
    ];
    return inTELs[Math.floor(Math.random() * inTELs.length)];
}

// ============ 使用建筑效果 ============
function useBuildingEffect(buildingId, action) {
    const effect = buildingEffectsRegistry[buildingId];
    if (!effect) {
        showMessage(`找不到建筑效果：${buildingId}`, 'error');
        return false;
    }
    
    const actionFn = effect[action];
    if (typeof actionFn === 'function') {
        // v20.7：支持带参动作（如 teleport 的目的地）；旧调用不传参不受影响
        return actionFn.apply(effect, Array.prototype.slice.call(arguments, 2));
    }
    
    showMessage(`建筑 ${buildingId} 没有 ${action} 功能`, 'warning');
    return false;
}

// ============ 打开建筑界面 ============
function openBuildingUI(buildingId) {
    const effect = buildingEffectsRegistry[buildingId];
    if (effect && effect.open) {
        effect.open();
    } else if (typeof window.showMessage === 'function') {
        // v20.17 断开回弹：此函数只被 useBuilding 的兜底分支调用，
        // 旧代码在这里再调回 useBuilding 会无限互跳直至栈溢出（点击表现为无声无息）。
        window.showMessage('此处暂无可为，且往别处看看', 'info');
    }
}

// ============ 显示消息（直接使用全局消息系统） ============
// 不再声明函数，避免覆盖 global-utils.js 中的 window.showMessage
// 所有调用直接使用 window.showMessage()

// ============ 更新状态面板 ============
function updateStatusPanel() {
    if (window.updateCharacterStatus) {
        window.updateCharacterStatus();
    }
}

// ============ 显示建筑效果对话框 ============
function showBuildingEffectDialog(title, content) {
    const modal = document.createElement('div');
    modal.id = 'building-effect-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50';
    
    modal.innerHTML = `
        <div class="bg-gray-900 border border-yellow-600 rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 class="text-xl font-bold text-yellow-400 mb-4">${title}</h3>
            <div class="mb-4">${content}</div>
            <button onclick="closeBuildingDialog()" class="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded w-full">
                关闭
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// ============ 关闭建筑对话框 ============
function closeBuildingDialog() {
    const modal = document.getElementById('building-effect-modal');
    if (modal) {
        modal.remove();
    }
}

// ============ 获取境界层名称 ============
function getLayerName(layer) {
    return ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'][layer] || layer;
}

// ============ 导出到全局 ============
window.buildingEffects = {
    buildingEffectsRegistry,
    useBuildingEffect,
    openBuildingUI,
    showBuildingEffectDialog,
    closeBuildingDialog,
    showMessage,
    getLayerName
};
