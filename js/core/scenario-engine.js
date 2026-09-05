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
            // v20.18：账本类结算自带如实报错文案（"欠条未销，钱庄不再放贷"等），优先原样上屏
            if (applied && applied.error) return { error: applied.error };
            if (!applied || applied.success === false) {
                var reasonMap = {
                    spiritStones: '灵石不足', copper: '铜钱不足',
                    inventory_full_or_invalid_item: '背包空间不足或物品无效',
                    qi: '真气不足', energy: '精力不足', health: '生命不足',
                    transaction_unavailable: '经济事务模块未加载',
                    no_character: '角色状态未初始化',
                    missing_item: '行囊里没有要交割的物件'
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
        // v20.8：req.items = { itemId, count }——当铺/抵押等"交货换钱"选项的前置门（与 removeByTemplate 同一套数法）
        if (req.items && req.items.itemId) {
            var need = Math.max(1, req.items.count || 1), have = 0;
            var slots = (window.inventory && window.inventory.slots) || [];
            for (var si = 0; si < slots.length; si++) {
                var slot = slots[si];
                if (slot && (slot.templateId || slot.id) === req.items.itemId) have += Number(slot.count) || 1;
            }
            if (have < need) {
                var tpl = window.itemById && window.itemById[req.items.itemId];
                return { ok: false, msg: '缺少' + ((tpl && tpl.name) || req.items.itemId) };
            }
        }
        return { ok: true, msg: '' };
    },

    // 随机源：默认 Math.random，测试可注入 window.__scenarioRng 复现成败分支
    _rng: function() {
        if (typeof window.__scenarioRng === 'function') return window.__scenarioRng();
        return Math.random();
    },

    // v20.19：效果表支持"现算"函数值——数值/文案字段可写成函数，结算一刻才取值
    // （卖价随本城物价系数、赔率随本城声望浮动都靠它）。roll 交给掷签逻辑原样处理；
    // bank.amount 也解析。始终返回新对象，绝不回写剧本配置（配置会被反复复用）。
    _resolveVals: function(eff) {
        var out = {};
        for (var k in eff) {
            if (!Object.prototype.hasOwnProperty.call(eff, k)) continue;
            var v = eff[k];
            if (k === 'roll' || k === 'cost') { out[k] = v; }
            else if (k === 'bank' && v && typeof v === 'object') {
                var b = {};
                for (var bk in v) b[bk] = (typeof v[bk] === 'function') ? v[bk]() : v[bk];
                out.bank = b;
            }
            else if (typeof v === 'function') out[k] = v();
            else out[k] = v;
        }
        return out;
    },

    // v20.19：eff.cost = {qi:30, energy:25, stones:40…}（正数=要付出的）。
    // 代价折进命中分支、同一笔事务结算——杜绝"白拿没扣本"与"扣了本没拿到"两头空。
    // 分支里若是函数值报价，包一层"先现算再扣本"。
    _foldCost: function(eff) {
        var out = {}, k;
        for (k in eff) { if (k !== 'cost') out[k] = eff[k]; }
        var neg = {};
        for (k in (eff.cost || {})) {
            var n = Number(eff.cost[k]) || 0;
            if (n > 0) neg[k] = -n;
        }
        if (out.roll) {
            var nr = {};
            for (var rk in out.roll) nr[rk] = out.roll[rk];
            nr.win = this._mergeCost(out.roll.win || {}, neg);
            nr.lose = this._mergeCost(out.roll.lose || {}, neg);
            out.roll = nr;
            return out;
        }
        return this._mergeCost(out, neg);
    },

    _mergeCost: function(branch, neg) {
        var out = {};
        for (var k in branch) out[k] = branch[k];
        for (var nk in neg) {
            var orig = out[nk];
            if (typeof orig === 'function') {
                out[nk] = (function(f, add) {
                    return function() { var v = Number(f()); return (isFinite(v) ? v : 0) + add; };
                })(orig, neg[nk]);
            } else {
                out[nk] = (Number(orig) || 0) + neg[nk];
            }
        }
        return out;
    },

    // 执行效果
    _apply: function(eff) {
        eff = this._resolveVals(eff || {});
        if (eff.cost) eff = this._foldCost(eff);
        // v20.8：eff.roll = { prob(数字或函数), win:{...}, lose:{...} }——成败分支。
        // win/lose 是与 choice.effects 同构的完整效果表（可含 msg/time/stones/take…），
        // 抽签后只结算命中分支，杜绝"选项写什么就必胜白拿"的印钞机。
        if (eff.roll) {
            var roll = eff.roll;
            var prob = typeof roll.prob === 'function' ? roll.prob() : Number(roll.prob);
            if (!isFinite(prob)) prob = 0.5;
            prob = Math.max(0, Math.min(1, prob));
            var branch = this._rng() < prob ? (roll.win || {}) : (roll.lose || {});
            var merged = {};
            for (var bk in branch) { if (bk !== 'roll') merged[bk] = branch[bk]; }
            return this._apply(merged);
        }
        var log = window.gameLog || { add: function() {} };
        var city = (typeof window.getCurrentCityName === 'function' && window.getCurrentCityName()) ||
            (window.locationSystem && window.locationSystem.getCurrentLocation && window.locationSystem.getCurrentLocation()) ||
            (window.currentCharData && window.currentCharData.location) || '';

        // v20.18：eff.bank = {op:'deposit'|'withdraw'|'borrow'|'repay', amount}——钱庄账本操作。
        // 账本银钱本就经统一结算通道走；账本失败整笔不成交，其余键（karma/noto…）照常结算。
        if (eff.bank && typeof eff.bank === 'object') {
            var BS = window.BankService;
            if (!BS) return { success: false, reason: 'reward_service_unavailable' };
            var bankResult = null;
            if (eff.bank.op === 'deposit') bankResult = BS.deposit(eff.bank.amount);
            else if (eff.bank.op === 'withdraw') bankResult = BS.withdraw();
            else if (eff.bank.op === 'borrow') bankResult = BS.borrow(eff.bank.amount);
            else if (eff.bank.op === 'repay') bankResult = BS.repay();
            else return { success: false, reason: 'reward_service_unavailable' };
            if (!bankResult || bankResult.success === false || bankResult.error) {
                return { success: false, reason: 'bank', error: (bankResult && bankResult.error) || '钱庄交割未成' };
            }
            (bankResult.messages || []).forEach(function (m) { log.add(m, 'info'); });
            var rest = [];
            for (var rk in eff) { if (rk !== 'bank' && rk !== 'msg' && rk !== 'msgType' && rk !== 'time') rest.push(rk); }
            if (rest.length === 0) {
                if (eff.msg) log.add(eff.msg, eff.msgType || 'info');
                if (eff.time && window.advanceTime) window.advanceTime(eff.time, '设施交互');
                return { success: true, messages: bankResult.messages || [] };
            }
        }

        // v20.20：eff.pawn = {op:'pawn', itemId, count, base} | {op:'redeem'}——当铺当票操作。
        // 货与银钱本就同笔交割（统一结算事务），账本失败整笔不成交、文案原样上屏。
        if (eff.pawn && typeof eff.pawn === 'object') {
            var PS = window.PawnService;
            if (!PS) return { success: false, reason: 'reward_service_unavailable' };
            var pawnResult = null;
            if (eff.pawn.op === 'pawn') pawnResult = PS.pawnItem(eff.pawn.itemId, eff.pawn.count, eff.pawn.base);
            else if (eff.pawn.op === 'redeem') pawnResult = PS.redeem();
            else return { success: false, reason: 'reward_service_unavailable' };
            if (!pawnResult || pawnResult.success === false || pawnResult.error) {
                return { success: false, reason: 'pawn', error: (pawnResult && pawnResult.error) || '当铺交割未成' };
            }
            (pawnResult.messages || []).forEach(function (m) { log.add(m, 'info'); });
            var prest = [];
            for (var pk in eff) { if (pk !== 'pawn' && pk !== 'msg' && pk !== 'msgType' && pk !== 'time') prest.push(pk); }
            if (prest.length === 0) {
                if (eff.msg) log.add(eff.msg, eff.msgType || 'info');
                if (eff.time && window.advanceTime) window.advanceTime(eff.time, '设施交互');
                return { success: true, messages: pawnResult.messages || [] };
            }
        }

        // v20.21：eff.fence = {op:'trust', delta, kind} | {op:'deal', min} | {op:'settle'}——黑市信用簿。
        // 黑市认的是成交实惠与信用前科，不是恶名；账本拦下则整笔不成交、文案原样上屏。
        if (eff.fence && typeof eff.fence === 'object') {
            var FC = window.FenceCredit;
            if (!FC) return { success: false, reason: 'reward_service_unavailable' };
            var fenceResult = null;
            if (eff.fence.op === 'trust') fenceResult = FC.adjust(eff.fence.delta, eff.fence.kind);
            else if (eff.fence.op === 'deal') fenceResult = FC.deal(eff.fence.min);
            else if (eff.fence.op === 'settle') fenceResult = FC.settle();
            else return { success: false, reason: 'reward_service_unavailable' };
            if (!fenceResult || fenceResult.error) {
                return { success: false, reason: 'fence', error: (fenceResult && fenceResult.error) || '黑市交割未成' };
            }
            var fres = [];
            for (var fk in eff) { if (fk !== 'fence' && fk !== 'msg' && fk !== 'msgType' && fk !== 'time') fres.push(fk); }
            if (fres.length === 0) {
                if (eff.msg) log.add(eff.msg, eff.msgType || 'info');
                if (eff.time && window.advanceTime) window.advanceTime(eff.time, '设施交互');
                return { success: true, messages: [] };
            }
        }

        var result;
        // 账本键（bank/pawn/fence）已在上方钩子成交，不得再随 eff 进统一结算
        //（RewardService 认不得这些键会整笔失败）——剥掉后传净表。
        var plain = {};
        for (var qk in eff) {
            if (qk === 'bank' || qk === 'pawn' || qk === 'fence') continue;
            plain[qk] = eff[qk];
        }
        if (window.RewardService) {
            result = window.RewardService.apply(plain, { source: 'scenario', city: city });
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
        // v20.19：做过的事不是永久关上的门——✅ 只是"来过的记号"，戏随时可以再入（代价每次照付）
        btn.className = 'w-full text-left p-3 bg-gray-800 rounded border border-gray-700 hover:border-amber-600 transition flex items-center gap-3';
        var icon = s.icon || '📌';
        btn.innerHTML = '<span class="text-xl">' + icon + '</span><div><p class="font-bold text-amber-300">' + s.name + (done ? ' ✅' : '') + '</p><p class="text-xs text-gray-500">' + (s.desc || '') + '</p></div>';
        btn.onclick = function() { startScenario(facilityId, s.id); };
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