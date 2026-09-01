// ==================== reincarnation-integration.js - 轮回集成 (v19.14) ====================
// v19.13 提供 API；v19.14 把 API 接入：onPlayerDeath → 模态 → applyInheritanceToNewLife → applyLegacyToNewWorld

(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    // ============== 1. 模块级状态 ==============
    var _state = {
        pendingSelections: [],       // 模态选中的继承 [{type, choice, cost}]
        appliedThisLife: [],         // 当前存档已应用
        legacyWorldEffects: {        // 跨存档已应用
            descendants: [],          // [{npcId, name, parentName, refDay}]
            steles: [],               // [{text, location, refDay}]
            flags: {}                 // {flagName: refDay}
        }
    };

    // ============== 2. 工具 ==============
    function getPlayerData() {
        return (typeof window.getCurrentCharData === 'function')
            ? window.getCurrentCharData()
            : window.currentCharData;
    }

    function emit(name, payload) {
        if (window.EventBus && typeof window.EventBus.emit === 'function') {
            window.EventBus.emit(name, payload);
        }
    }

    function isInheritanceOK(selections) {
        var total = _state.pendingSelections.reduce(function (a, s) { return a + s.cost; }, 0);
        var pool = (window.Reincarnation && window.Reincarnation.getState) ? window.Reincarnation.getState().inheritancePool : 0;
        return { ok: total <= pool, total: total, pool: pool };
    }

    // ============== 3. 公开 API ==============

    // A. 死亡集成
    function onPlayerDeath(reason) {
        reason = reason || 'death-combat';
        if (!window.Reincarnation) return { ok: false, reason: 'reincarnation-not-loaded' };
        var playerData = getPlayerData();
        if (!playerData) return { ok: false, reason: 'no-player' };
        var startResult = window.Reincarnation.startReincarnation(playerData, reason);
        if (!startResult.ok) return startResult;
        // 写前世传说
        window.Reincarnation.preserveWorldMemory(playerData);
        // 弹模态
        openReincarnationModal(startResult);
        return { ok: true, summary: startResult, legacyPoints: startResult.legacyPoints };
    }

    // B. 模态
    function openReincarnationModal(summary) {
        if (!summary) return;
        _state.pendingSelections = [];
        // 兼容：summary 可能是 {summary:breakdown,legacyPoints} 或直接是 startResult
        var breakdown = summary.summary && summary.summary.realm ? summary.summary : (summary.summary || summary);
        var legacyPoints = summary.legacyPoints || (summary.summary && summary.summary.legacyPoints);
        if (!breakdown || !breakdown.realm) {
            emit('reincarnation:modalOpened', { summary: summary });
            return;
        }
        var doc = (typeof document !== 'undefined') ? document : (window.document || null);
        var modal = doc && doc.getElementById ? doc.getElementById('reincarnation-modal') : null;
        if (!modal) {
            // 没有 DOM（测试/SSR）：仅写状态
            emit('reincarnation:modalOpened', { summary: summary });
            return;
        }
        // 渲染详细
        var sumDiv = doc.getElementById('reincarnation-summary');
        if (sumDiv) {
            var rows = ['境界 ' + (breakdown.realm.realm || '?') + ' +' + breakdown.realm.points,
                '关系 +' + breakdown.relationship.points,
                '职位 ' + (breakdown.sectPosition.position || '?') + ' +' + breakdown.sectPosition.points,
                '大事件 +' + breakdown.keyEvents.points,
                '炼丹/炼器 +' + breakdown.craft.points,
                '死法 ' + (breakdown.deathReason.reason || '?') + ' +' + breakdown.deathReason.points];
            sumDiv.innerHTML = '<div class="text-yellow-300 text-lg">前世遗产点: ' + legacyPoints + '</div>'
                + '<div class="text-sm text-gray-400 mt-2 grid grid-cols-2 gap-1">' + rows.map(function (r) { return '<div>• ' + r + '</div>'; }).join('') + '</div>';
        }
        // 渲染 5 选项
        var optDiv = doc.getElementById('reincarnation-options');
        if (optDiv && window.Reincarnation) {
            var opts = window.Reincarnation.listInheritOptions();
            optDiv.innerHTML = opts.map(function (o) {
                return '<div class="bg-gray-700 p-3 rounded cursor-pointer hover:bg-gray-600 border-2 border-transparent" data-type="' + o.type + '" onclick="window.ReincarnationIntegration.toggleOption(\'' + o.type + '\')">'
                    + '<div class="flex justify-between"><span class="font-bold text-yellow-200">' + o.name + '</span><span class="text-red-300">' + o.cost + ' 遗产</span></div>'
                    + '<div class="text-xs text-gray-400 mt-1">' + o.desc + '</div>'
                    + '</div>';
            }).join('');
        }
        var ptsDiv = doc.getElementById('reincarnation-points');
        if (ptsDiv) ptsDiv.textContent = '当前选择: 0 / ' + legacyPoints;
        modal.classList.remove('hidden');
        emit('reincarnation:modalOpened', { summary: summary });
    }

    function closeReincarnationModal() {
        var doc = (typeof document !== 'undefined') ? document : (window.document || null);
        var modal = doc && doc.getElementById ? doc.getElementById('reincarnation-modal') : null;
        if (modal) modal.classList.add('hidden');
        _state.pendingSelections = [];
    }

    function toggleOption(type) {
        if (!window.Reincarnation) return { ok: false, reason: 'reincarnation-not-loaded' };
        var opt = window.Reincarnation.listInheritOptions().find(function (o) { return o.type === type; });
        if (!opt) return { ok: false, reason: 'unknown-type' };
        var idx = _state.pendingSelections.findIndex(function (s) { return s.type === type; });
        if (idx >= 0) {
            _state.pendingSelections.splice(idx, 1);
        } else {
            // 检查预算
            var currentTotal = _state.pendingSelections.reduce(function (a, s) { return a + s.cost; }, 0);
            var pool = window.Reincarnation.getState().inheritancePool;
            if (currentTotal + opt.cost > pool) return { ok: false, reason: 'insufficient-points', need: currentTotal + opt.cost, have: pool };
            // 默认选择参数（玩家可在 UI 细化）
            var choice = {};
            if (type === 'memory') choice = { skill: '炼制', currentLevel: 100 };
            else if (type === 'bond') choice = { npcId: 'sect_leader_少林寺' };
            else if (type === 'fortune') choice = { fortuneId: '变异灵根' };
            else if (type === 'cave') choice = { caveId: 'cave_former_life' };
            _state.pendingSelections.push({ type: type, choice: choice, cost: opt.cost });
        }
        // 刷新 UI
        var doc2 = (typeof document !== 'undefined') ? document : (window.document || null);
        var ptsDiv = doc2 && doc2.getElementById ? doc2.getElementById('reincarnation-points') : null;
        if (ptsDiv) {
            var total = _state.pendingSelections.reduce(function (a, s) { return a + s.cost; }, 0);
            ptsDiv.textContent = '当前选择: ' + total + ' / ' + window.Reincarnation.getState().inheritancePool;
        }
        // 高亮已选
        var doc2 = (typeof document !== 'undefined') ? document : (window.document || null);
        var cards = doc2 && doc2.querySelectorAll ? doc2.querySelectorAll('#reincarnation-options [data-type]') : [];
        for (var ci = 0; ci < cards.length; ci++) {
            var c = cards[ci];
            var t = c.getAttribute('data-type');
            if (_state.pendingSelections.find(function (s) { return s.type === t; })) c.classList.add('border-yellow-400');
            else c.classList.remove('border-yellow-400');
        }
        emit('reincarnation:selectionChanged', { selections: _state.pendingSelections.slice() });
        return { ok: true };
    }

    function confirmReincarnation() {
        if (!window.Reincarnation) return { ok: false, reason: 'reincarnation-not-loaded' };
        if (_state.pendingSelections.length === 0) return { ok: false, reason: 'no-selection' };
        var total = _state.pendingSelections.reduce(function (a, s) { return a + s.cost; }, 0);
        var pool = window.Reincarnation.getState().inheritancePool;
        if (total > pool) return { ok: false, reason: 'insufficient-points' };
        // 逐个 grantInheritance
        var applied = [];
        for (var i = 0; i < _state.pendingSelections.length; i++) {
            var sel = _state.pendingSelections[i];
            // 构造 nextLife 占位
            var nextLife = { name: '二世', lifeSkills: {} };
            var r = window.Reincarnation.grantInheritance(nextLife, { type: sel.type, ...sel.choice });
            if (r.ok) {
                applied.push(r);
                _state.appliedThisLife.push(r);
            }
        }
        // 关闭模态
        closeReincarnationModal();
        // 调用 NG+
        var startNG = window.startNewGamePlus || window._origStartNewGamePlus;
        if (typeof startNG === 'function') {
            try { startNG(); } catch (e) { /* SSR/no-op */ }
        }
        emit('reincarnation:confirmed', { applied: applied, total: total });
        return { ok: true, applied: applied };
    }

    // C. 应用到新生命
    function applyInheritanceToNewLife(newChar, selections) {
        if (!newChar) return { ok: false, reason: 'no-newChar' };
        if (!Array.isArray(selections)) selections = [];
        if (!window.Reincarnation) return { ok: false, reason: 'reincarnation-not-loaded' };
        var applied = [];
        for (var i = 0; i < selections.length; i++) {
            var sel = selections[i];
            // 兼容：sel.choice 是对象（含 skill/npcId 等），否则 sel 自身就是选项
            var choiceData = sel.choice || sel;
            var r = window.Reincarnation.grantInheritance(newChar, choiceData);
            if (r.ok) applied.push(r);
        }
        return { ok: true, newChar: newChar, applied: applied };
    }

    // D. 前世传说 → 新世界
    function applyLegacyToNewWorld(records) {
        if (!Array.isArray(records)) return { ok: false, reason: 'no-records' };
        var descendants = [];
        var steles = [];
        var flags = {};
        for (var i = 0; i < records.length; i++) {
            var r = records[i];
            if (!r) continue;
            // 1. had-children → 创建子嗣
            if ((r.deeds || []).indexOf('had-children') >= 0) {
                var d = createNPCDescendant(r, i);
                descendants.push(d);
                flags['legacy-descendant-' + r.recordDay + '-' + i] = d.npcId;
            }
            // 2. founded-sect → 碑文 + 标记
            if ((r.deeds || []).indexOf('founded-sect') >= 0) {
                var st = markStele(r, '传说：' + r.playerName + '曾创一宗', '宗门旧址');
                steles.push(st);
                flags['legacy-founder-' + r.recordDay] = r.playerName;
            }
            // 3. saved-sect → 碑文
            if ((r.deeds || []).indexOf('saved-sect') >= 0) {
                var st2 = markStele(r, '前代' + r.playerName + '曾救此宗于危亡', '宗门大殿');
                steles.push(st2);
            }
            // 4. discovered → 秘境发现
            if ((r.deeds || []).indexOf('discovered') >= 0) {
                flags['legacy-discoverer-' + r.recordDay] = r.playerName;
            }
            // 5. won-tournament → 宗门大比
            if ((r.deeds || []).indexOf('won-tournament') >= 0) {
                flags['legacy-champion-' + r.recordDay] = r.playerName;
            }
            // 6. mastered-pill / mastered-weapon → 丹/器 NPC 致敬
            if ((r.deeds || []).indexOf('mastered-pill') >= 0) {
                flags['legacy-alchemy-grandmaster'] = r.playerName;
            }
            if ((r.deeds || []).indexOf('mastered-weapon') >= 0) {
                flags['legacy-forging-grandmaster'] = r.playerName;
            }
            // 7. married → 伴侣纪念
            if ((r.deeds || []).indexOf('married') >= 0) {
                flags['legacy-married-' + r.recordDay] = r.playerName;
            }
        }
        _state.legacyWorldEffects.descendants = _state.legacyWorldEffects.descendants.concat(descendants);
        _state.legacyWorldEffects.steles = _state.legacyWorldEffects.steles.concat(steles);
        Object.keys(flags).forEach(function (k) { _state.legacyWorldEffects.flags[k] = flags[k]; });
        // 尝试通过 npcManager 真实创建
        if (window.npcManager && typeof window.npcManager.createNPC === 'function') {
            descendants.forEach(function (d) {
                try { window.npcManager.createNPC(d); } catch (e) {}
            });
        }
        emit('reincarnation:legacyApplied', { descendants: descendants, steles: steles, flags: flags });
        return { ok: true, descendants: descendants, steles: steles, flags: flags };
    }

    function createNPCDescendant(record, idx) {
        // 子嗣境界比 record 降 1 大境界（更现实：子孙不一定能继承全部天赋）
        var realmOrder = ['练气', '筑基', '金丹', '元婴', '化神', '渡劫', '大乘'];
        var recLevel = realmOrder.indexOf(record.finalRealm || '练气');
        var descLevel = Math.max(0, recLevel - 1);
        var age = 15 + Math.floor(Math.random() * 10);
        var surNames = ['叶', '苏', '林', '陈', '周', '吴', '徐', '孙', '马', '朱'];
        var sur = surNames[Math.floor(Math.random() * surNames.length)];
        var desc = {
            npcId: 'descendant_' + record.recordDay + '_' + (idx || 0),
            name: sur + '氏' + (record.playerName || '无名') + '之后',
            age: age,
            realm: realmOrder[descLevel],
            sectId: null,
            affection: 0,
            legacy: '前代' + (record.playerName || '无名') + '之' + (age < 25 ? '孙' : '后人'),
            _legacyRef: record.recordDay
        };
        return desc;
    }

    function markStele(record, text, location) {
        return {
            steleId: 'stele_' + record.recordDay + '_' + Math.random().toString(36).slice(2, 8),
            text: text || ('传说：' + (record.playerName || '无名') + '曾留迹于此'),
            location: location || '野外',
            refDay: record.recordDay,
            refPlayer: record.playerName
        };
    }

    // ============== 4. StateRegistry ==============
    function _exportState() { return JSON.parse(JSON.stringify(_state)); }
    function _importState(s) {
        if (!s) return;
        if (Array.isArray(s.appliedThisLife)) _state.appliedThisLife = s.appliedThisLife;
        if (s.legacyWorldEffects) _state.legacyWorldEffects = s.legacyWorldEffects;
        _state.pendingSelections = []; // 不持久化临时选择
    }
    function _resetState() {
        _state.pendingSelections = [];
        _state.appliedThisLife = [];
        _state.legacyWorldEffects = { descendants: [], steles: [], flags: {} };
    }

    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        try {
            window.StateRegistry.register('reincarnationIntegration', { version: 1, export: _exportState, import: _importState, reset: _resetState });
        } catch (e) {}
    }

    // ============== 5. 导出 ==============
    window.ReincarnationIntegration = {
        onPlayerDeath: onPlayerDeath,
        openReincarnationModal: openReincarnationModal,
        closeReincarnationModal: closeReincarnationModal,
        toggleOption: toggleOption,
        confirmReincarnation: confirmReincarnation,
        applyInheritanceToNewLife: applyInheritanceToNewLife,
        applyLegacyToNewWorld: applyLegacyToNewWorld,
        createNPCDescendant: createNPCDescendant,
        markStele: markStele,
        getState: function () { return _state; }
    };
    if (window.XianXia) window.XianXia.ReincarnationIntegration = window.ReincarnationIntegration;
    try { console.log('[ReincarnationIntegration] initialized v1 (onPlayerDeath + modal + applyLegacyToNewWorld)'); } catch (e) {}
})();
