// ==================== scenario-engine.js - 情境事件链引擎 ====================
// 独立核心模块，不依赖任何游戏模块
// 用法：定义情境数据 → 注册到引擎 → 点击"使用"自动弹出面板

// ============ 情境引擎 ============
const scenarioEngine = {
    // 已注册的设施配置
    facilities: {},
    // 当前激活的情境状态
    activeState: null,
    // 情境进度存档
    progress: {},

    // 注册设施
    register: function(id, config) {
        this.facilities[id] = config;
        return this;
    },

    // 获取设施信息
    getInfo: function(id) {
        var f = this.facilities[id];
        if (!f) return null;
        return {
            id: f.id, name: f.name, icon: f.icon, desc: f.desc,
            scenarios: f.scenarios
        };
    },

    // 开始情境（返回第一个节点）
    start: function(facilityId, scenarioId) {
        var f = this.facilities[facilityId];
        if (!f) return null;
        var s = null;
        for (var i = 0; i < f.scenarios.length; i++) {
            if (f.scenarios[i].id === scenarioId) { s = f.scenarios[i]; break; }
        }
        if (!s) return null;

        var key = facilityId + '_' + scenarioId;
        var saved = this.progress[key];

        if (saved && saved.currentNode && !saved.done) {
            this.activeState = {
                facilityId: facilityId, scenarioId: scenarioId,
                scenario: s, currentNode: saved.currentNode,
                history: saved.history || [], vars: saved.vars || {}
            };
            return this.getState();
        }

        this.activeState = {
            facilityId: facilityId, scenarioId: scenarioId,
            scenario: s, currentNode: s.startNode,
            history: [], vars: {}
        };
        this.progress[key] = { currentNode: s.startNode, history: [], vars: {}, done: false };
        return this.getState();
    },

    // 执行选择
    choose: function(index) {
        if (!this.activeState) return null;
        var s = this.activeState.scenario;
        var node = s.nodes[this.activeState.currentNode];
        if (!node || index < 0 || index >= node.choices.length) return null;

        var choice = node.choices[index];

        // 检查条件
        if (choice.require) {
            var check = this._check(choice.require);
            if (!check.ok) return { error: check.msg };
        }

        // 执行效果。涉及交易时必须原子成功，否则本次选择不落历史/不推进节点。
        if (choice.effects) {
            var applied = this._apply(choice.effects);
            if (!applied || applied.success === false) {
                var reasonMap = {
                    spiritStones: '灵石不足', copper: '铜钱不足',
                    inventory_full_or_invalid_item: '背包空间不足或物品无效',
                    qi: '真气不足', energy: '精力不足', health: '生命不足',
                    transaction_unavailable: '经济事务模块未加载',
                    no_character: '角色状态未初始化'
                };
                return { error: '结算失败：' + (reasonMap[applied && applied.reason] || '资源或背包状态异常') };
            }
        }

        // 记录历史
        this.activeState.history.push({ node: this.activeState.currentNode, choice: index, text: choice.text });

        // 设置变量
        if (choice.setVars) {
            for (var k in choice.setVars) this.activeState.vars[k] = choice.setVars[k];
        }

        var key = this.activeState.facilityId + '_' + this.activeState.scenarioId;
        var next = choice.next;

        if (next && s.nodes[next]) {
            this.activeState.currentNode = next;
            this.progress[key] = {
                currentNode: next, history: this.activeState.history.slice(),
                vars: JSON.parse(JSON.stringify(this.activeState.vars)), done: false
            };
            return this.getState();
        }

        // 情境结束
        this.activeState.currentNode = null;
        this.progress[key] = {
            currentNode: null, history: this.activeState.history.slice(),
            vars: JSON.parse(JSON.stringify(this.activeState.vars)), done: true
        };
        var result = this.getState();
        this.activeState = null;
        return result;
    },

    // 获取当前状态
    getState: function() {
        if (!this.activeState || !this.activeState.currentNode) {
            return { done: true, message: '事件已结束' };
        }
        var s = this.activeState.scenario;
        var node = s.nodes[this.activeState.currentNode];
        if (!node) return { done: true, message: '事件已结束' };

        var desc = typeof node.desc === 'function' ? node.desc(this.activeState.vars) : node.desc;
        var choices = node.choices.map(function(c, i) {
            var disabled = false, reason = '';
            if (c.require) {
                var check = this._check(c.require);
                if (!check.ok) { disabled = true; reason = check.msg; }
            }
            return { index: i, text: c.text, disabled: disabled, reason: reason, hint: c.hint || '' };
        }.bind(this));

        return {
            done: false,
            facilityId: this.activeState.facilityId,
            scenarioName: s.name,
            facilityName: this.facilities[this.activeState.facilityId]?.name || '',
            desc: desc,
            choices: choices,
            step: this.activeState.history.length + 1,
            totalSteps: Object.keys(s.nodes).length
        };
    },

    // 取消当前情境
    cancel: function() {
        if (!this.activeState) return;
        var key = this.activeState.facilityId + '_' + this.activeState.scenarioId;
        delete this.progress[key];
        this.activeState = null;
    },

    // 检查条件
    _check: function(req) {
        var p = window.currentCharData || {};
        var inv = window.inventory || {};
        if (req.realm) {
            // 0.2.7：角色用 realm(字符串)+layer，无 realmLevel 字段→此前 lv 恒 0，境界门控永远 disabled
            var lv = (typeof window.getRealmTier === 'function') ? window.getRealmTier(p.realm) : (p.realmLevel || 0);
            if (lv < req.realm) return { ok: false, msg: '境界不足' };
        }
        if (req.stones) {
            var s = (inv.currency?.spiritStones) || 0;
            if (s < req.stones) return { ok: false, msg: '需要' + req.stones + '灵石' };
        }
        if (req.qi) {
            var q = p.qi || 0;
            if (q < req.qi) return { ok: false, msg: '真气不足' };
        }
        if (req.energy) {
            var e = p.energy || 0;
            if (e < req.energy) return { ok: false, msg: '精力不足' };
        }
        return { ok: true, msg: '' };
    },

    // 执行效果
    _apply: function(eff) {
        eff = eff || {};
        var log = window.gameLog || { add: function() {} };
        var city = (typeof window.getCurrentCityName === 'function' && window.getCurrentCityName()) ||
            (window.locationSystem && window.locationSystem.getCurrentLocation && window.locationSystem.getCurrentLocation()) ||
            (window.currentCharData && window.currentCharData.location) || '';

        var result;
        if (window.RewardService) {
            result = window.RewardService.apply(eff, { source: 'scenario', city: city });
            if (!result || result.success === false) return result || { success: false, reason: 'reward_failed' };
            (result.messages || []).forEach(function(m) { log.add(m, 'info'); });
        } else {
            // RewardService 是核心依赖；缺失时宁可失败，也不再进行半事务式结算。
            return { success: false, reason: 'reward_service_unavailable' };
        }

        if (eff.msg) log.add(eff.msg, eff.msgType || 'info');
        if (eff.time && window.advanceTime) window.advanceTime(eff.time, '设施交互');
        return result || { success: true, messages: [] };
    },

    // 存档
    save: function() {
        try { localStorage.setItem('xianxia_scenario_progress', JSON.stringify(this.progress)); } catch(e) {}
    },
    load: function() {
        try {
            var d = localStorage.getItem('xianxia_scenario_progress');
            if (d) this.progress = JSON.parse(d);
        } catch(e) {}
    }
};

// ============ 情境UI面板 ============
var scenarioModal = null;

function createScenarioModal() {
    if (document.getElementById('scenario-modal')) return;
    var m = document.createElement('div');
    m.id = 'scenario-modal';
    m.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 hidden';
    m.innerHTML = '<div class="bg-gray-900 border border-amber-700 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">' +
        '<div class="flex items-center justify-between mb-4">' +
            '<div><h3 id="sm-title" class="text-xl font-bold text-amber-400"></h3><p id="sm-sub" class="text-sm text-gray-500"></p></div>' +
            '<button onclick="closeScenarioModal()" class="text-gray-500 hover:text-white text-2xl">&times;</button>' +
        '</div>' +
        '<div id="sm-desc" class="text-gray-300 mb-6 whitespace-pre-line leading-relaxed"></div>' +
        '<div id="sm-choices" class="space-y-2"></div>' +
        '<div id="sm-foot" class="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-600"></div>' +
    '</div>';
    document.body.appendChild(m);
    scenarioModal = m;
}

// 打开设施情境
function openFacilityScenario(facilityId) {
    var engine = window.scenarioEngine;
    var info = engine.getInfo(facilityId);
    if (!info || !info.scenarios || info.scenarios.length === 0) {
        showMessage('该设施暂无可触发的事件', 'info');
        return;
    }

    createScenarioModal();
    var m = document.getElementById('scenario-modal');
    if (!m) return;

    document.getElementById('sm-title').textContent = info.name;
    document.getElementById('sm-sub').textContent = '选择一个事件';

    var descHtml = '<p class="text-gray-400">' + info.desc + '</p>';
    document.getElementById('sm-desc').innerHTML = descHtml;

    var choicesDiv = document.getElementById('sm-choices');
    choicesDiv.innerHTML = '';

    info.scenarios.forEach(function(s) {
        var key = facilityId + '_' + s.id;
        var done = engine.progress[key] && engine.progress[key].done;
        var btn = document.createElement('button');
        btn.className = 'w-full text-left p-3 bg-gray-800 rounded border ' + (done ? 'border-gray-600 opacity-60' : 'border-gray-700 hover:border-amber-600') + ' transition flex items-center gap-3';
        var icon = s.icon || '📌';
        btn.innerHTML = '<span class="text-xl">' + icon + '</span><div><p class="font-bold ' + (done ? 'text-gray-500' : 'text-amber-300') + '">' + s.name + (done ? ' ✅' : '') + '</p><p class="text-xs text-gray-500">' + (s.desc || '') + '</p></div>';
        if (!done) {
            btn.onclick = function() { startScenario(facilityId, s.id); };
        }
        choicesDiv.appendChild(btn);
    });

    document.getElementById('sm-foot').textContent = '';
    m.classList.remove('hidden');
}

// 开始情境
function startScenario(facilityId, scenarioId) {
    var engine = window.scenarioEngine;
    var state = engine.start(facilityId, scenarioId);
    renderScenario(state);
}

// 渲染情境节点
function renderScenario(state) {
    if (!state || state.done) {
        document.getElementById('sm-title').textContent = '事件已结束';
        document.getElementById('sm-desc').textContent = state?.message || '事件已结束';
        document.getElementById('sm-choices').innerHTML = '<button onclick="closeScenarioModal()" class="w-full p-3 bg-gray-800 rounded border border-gray-700 hover:border-amber-600 text-center text-amber-400 font-bold">关闭</button>';
        document.getElementById('sm-foot').textContent = '';
        return;
    }

    document.getElementById('sm-title').textContent = state.facilityName + ' · ' + state.scenarioName;
    document.getElementById('sm-sub').textContent = '第 ' + state.step + '/' + state.totalSteps + ' 步';
    document.getElementById('sm-desc').textContent = state.desc;

    var choicesDiv = document.getElementById('sm-choices');
    choicesDiv.innerHTML = '';

    if (state.choices.length === 0) {
        choicesDiv.innerHTML = '<button onclick="closeScenarioModal()" class="w-full p-3 bg-gray-800 rounded border border-gray-700 hover:border-amber-600 text-center text-amber-400 font-bold">关闭</button>';
    } else {
        state.choices.forEach(function(c) {
            var btn = document.createElement('button');
            if (c.disabled) {
                btn.className = 'w-full text-left p-3 bg-gray-800 rounded border border-gray-700 opacity-50 cursor-not-allowed flex items-center justify-between';
                btn.innerHTML = '<span class="text-gray-500">' + c.text + '</span><span class="text-xs text-gray-600">' + c.reason + '</span>';
            } else {
                btn.className = 'w-full text-left p-3 bg-gray-800 rounded border border-gray-700 hover:border-amber-600 hover:bg-gray-750 transition flex items-center justify-between';
                btn.innerHTML = '<span class="text-gray-200">' + c.text + '</span>' + (c.hint ? '<span class="text-xs text-gray-500">' + c.hint + '</span>' : '');
                btn.onclick = function() { doScenarioChoice(c.index); };
            }
            choicesDiv.appendChild(btn);
        });
    }

    document.getElementById('sm-foot').textContent = '';
}

// 执行选择
function doScenarioChoice(index) {
    var engine = window.scenarioEngine;
    var result = engine.choose(index);
    if (result && result.error) {
        showMessage(result.error, 'warning');
        return;
    }
    var state = engine.getState();
    renderScenario(state);
    engine.save();
}

// 关闭
function closeScenarioModal() {
    var m = document.getElementById('scenario-modal');
    if (m) m.classList.add('hidden');
    // 0.2.7：关闭只隐藏弹窗，保留 progress 供续关（此前调 cancel() 删 progress 致续关路径形同虚设）
    // 显式"放弃"才应调 scenarioEngine.cancel()
}

// 初始化
function initScenarioEngine() {
    createScenarioModal();
    window.scenarioEngine.load();
    console.log('[情境引擎] 初始化完成');
}

// 导出
window.scenarioEngine = scenarioEngine;
window.openFacilityScenario = openFacilityScenario;
window.closeScenarioModal = closeScenarioModal;
window.startScenario = startScenario;
window.doScenarioChoice = doScenarioChoice;
window.initScenarioEngine = initScenarioEngine;