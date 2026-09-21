// ==================== v23.0 深水区接线：开放炼丹 / 词缀炼器 / 洞府设施 / 护持阵法 / 傀儡工坊 ====================
// 审计发现三套做了深度却没有门的系统：开放炼丹（药性四维+品质五段+毒性瑕疵）、词缀炼器（19词缀池+动态命名）、
// 火候QTE（得分没有任何可达路径消费）；外加三套整体死代码：洞府设施、阵法、傀儡（傀儡日结在跑，玩家却造不出第一只）。
// 本文件给它们全部门户：合成面板炼丹/锻造页签挂深水入口，洞府面板挂「洞府深作」。
// 同时补两笔旧账：①开放炼制此前不扣背包材料（白嫖）——compoundMat 真扣真退；
// ②阵石阵旗从未注册进物品账（想买买不到）——此处注册并挂进门派坊市货源。
'use strict';

(function () {
    // ============ 材料账：开放炼制共用（实扣 + 失败退回） ============
    function _slots() { return (window.inventory && Array.isArray(window.inventory.slots)) ? window.inventory.slots : null; }
    function _idOf(s) { return (s && (s.itemId || s.templateId)) || null; }
    function _nameOf(id) { return (window.itemById && window.itemById[id] && window.itemById[id].name) || id; }

    window.compoundMat = {
        consume: function (ids) {
            var slots = _slots();
            if (!slots) return true; // 无背包世界（测试沙盒）不拦
            var need = {};
            for (var i = 0; i < ids.length; i++) need[ids[i]] = (need[ids[i]] || 0) + 1;
            var have = {};
            for (var j = 0; j < slots.length; j++) {
                var s = slots[j];
                var id = _idOf(s);
                if (id && s.count > 0) have[id] = (have[id] || 0) + s.count;
            }
            var short = [];
            for (var nk in need) if ((have[nk] || 0) < need[nk]) short.push(_nameOf(nk) + '×' + need[nk] + '（有' + (have[nk] || 0) + '）');
            if (short.length) {
                if (window.showMessage) window.showMessage('🧺 材料不齐：' + short.join('、'), 'warning');
                return false;
            }
            for (var dk in need) {
                var left = need[dk];
                for (var k = 0; k < slots.length && left > 0; k++) {
                    var sl = slots[k];
                    if (!sl || _idOf(sl) !== dk || sl.count <= 0) continue;
                    var take = Math.min(sl.count, left);
                    if (typeof sl.removeCount === 'function') sl.removeCount(take); else sl.count -= take;
                    left -= take;
                    if (sl.count <= 0) slots[k] = null;
                }
            }
            if (typeof window.updateInventoryUI === 'function') { try { window.updateInventoryUI(); } catch (e) {} }
            return true;
        },
        refund: function (ids) {
            for (var i = 0; i < ids.length; i++) {
                if (typeof window.addItemToInventory === 'function') window.addItemToInventory(ids[i], 1);
                else if (typeof window.addItem === 'function') window.addItem(ids[i], 1);
            }
        }
    };

    // ============ 阵材兜底注册：formation-system 自带注册为准，此处兜底缺载场景；货源缺口由门派坊市补上 ============
    function registerFormationItems() {
        if (!window.FormationSystem || !window.FormationSystem.FORMATION_STONES) return;
        if (!window.itemById) window.itemById = {};
        var icons = { stone: '🪨', flag: '🚩', eye: '👁️', core: '💠' };
        window.FormationSystem.FORMATION_STONES.forEach(function (st) {
            if (window.itemById[st.id]) return;
            var it = {
                id: st.id, name: st.name, type: 'material', subtype: 'material', category: 'material',
                quality: st.tier >= 3 ? 'PIN5' : (st.tier === 2 ? 'PIN7' : 'PIN9'),
                level: st.tier * 5, price: st.tier * 60, stackable: true, maxStack: 50,
                desc: st.desc + '（布阵材料）', icon: icons[st.type] || '🪨'
            };
            window.itemById[st.id] = it;
            if (window.allItems && Array.isArray(window.allItems)) window.allItems.push(it);
            if (window.materials && Array.isArray(window.materials)) window.materials.push(it);
        });
    }
    registerFormationItems();

    // ============ 通用弹层 ============
    function _modal(title, bodyHtml) {
        var old = document.getElementById('compound-ui-modal');
        if (old) old.remove();
        var m = document.createElement('div');
        m.id = 'compound-ui-modal';
        m.className = 'fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4';
        m.onclick = function (e) { if (e.target === m) m.remove(); };
        m.innerHTML = '<div class="bg-gray-800 border-2 border-purple-600/50 rounded-xl p-4 max-w-2xl w-full max-h-[85vh] overflow-y-auto">' +
            '<div class="flex justify-between items-center mb-3"><h3 class="text-lg font-bold text-purple-300">' + title + '</h3>' +
            '<button onclick="document.getElementById(\'compound-ui-modal\').remove()" class="text-gray-400 hover:text-white text-2xl leading-none">&times;</button></div>' +
            '<div id="compound-ui-body">' + bodyHtml + '</div></div>';
        document.body.appendChild(m);
        return document.getElementById('compound-ui-body');
    }
    function _body() { return document.getElementById('compound-ui-body'); }
    function _redraw(html) { var b = _body(); if (b) b.innerHTML = html; }
    function _stones() {
        if (window.XianXia && window.XianXia.DataManager && typeof window.XianXia.DataManager.getSpiritStones === 'function') return window.XianXia.DataManager.getSpiritStones();
        return (window.inventory && window.inventory.currency && window.inventory.currency.spiritStones) || 0;
    }
    function _payStones(n) {
        if (window.XianXia && window.XianXia.DataManager && typeof window.XianXia.DataManager.deductSpiritStones === 'function') return window.XianXia.DataManager.deductSpiritStones(n);
        if (window.inventory && window.inventory.currency) {
            if ((window.inventory.currency.spiritStones || 0) < n) return false;
            window.inventory.currency.spiritStones -= n;
            if (typeof window.updateCurrencyUI === 'function') window.updateCurrencyUI();
            return true;
        }
        return false;
    }
    function _haveCount(itemId) {
        var slots = _slots(); if (!slots) return 0;
        var n = 0;
        for (var i = 0; i < slots.length; i++) { var s = slots[i]; if (s && _idOf(s) === itemId && s.count > 0) n += s.count; }
        return n;
    }

    // ============ 开放炼丹（AlchemyCompound） ============
    var _cp = null; // { recipeId, pick: {main:[],assist:[],balancer:[]} }
    window.openCompoundPilfarUI = function () {
        if (!window.AlchemyCompound) { if (window.showMessage) window.showMessage('开放丹方系统未就绪。', 'error'); return; }
        _cp = null;
        var recipes = window.AlchemyCompound.COMPOUND_PILFAR_RECIPES || [];
        var html = '<p class="text-xs text-gray-400 mb-3">不按死方子抓药——主/辅/调三槽自选药材，药性四维（五行·寒热·主效·毒性）现场评分，火候决定品质五段。毒性超标出瑕疵丹还伤身。</p>';
        html += recipes.map(function (r) {
            var sk = r.requiredSkills ? Object.keys(r.requiredSkills).map(function (k) { return k + '≥' + r.requiredSkills[k]; }).join(' ') : '无';
            return '<div class="bg-gray-700/40 p-3 rounded border border-gray-600 mb-2">' +
                '<div class="flex justify-between items-center"><span class="font-bold text-sm text-white">' + (r.name || r.id) + '</span>' +
                '<button onclick="window._cpSelect(\'' + r.id + '\')" class="text-xs px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white">选方开炉</button></div>' +
                '<div class="text-xs text-gray-400 mt-1">' + (r.desc || '') + '</div>' +
                '<div class="text-xs text-gray-500 mt-1">槽位：主' + r.slots.main.count + ' 辅' + r.slots.assist.count + ' 调' + r.slots.balancer.count +
                ' ｜ 门槛：' + sk + ' ｜ 真气 ' + (r.qiCost || 0) + ' ｜ 耗时 ' + (r.timeCost || 10) + '分钟 ｜ 成品 ' + _nameOf(r.result.itemId) + '×' + r.result.count + '</div>' +
                '</div>';
        }).join('');
        _modal('🌌 开放丹方 · 药性四维', html);
    };
    window._cpSelect = function (recipeId) {
        _cp = { recipeId: recipeId, pick: { main: [], assist: [], balancer: [] } };
        _cpRender();
    };
    function _cpRecipe() {
        var rs = window.AlchemyCompound.COMPOUND_PILFAR_RECIPES || [];
        for (var i = 0; i < rs.length; i++) if (rs[i].id === _cp.recipeId) return rs[i];
        return null;
    }
    function _cpRender() {
        var r = _cpRecipe(); if (!r) return;
        var html = '<button onclick="openCompoundPilfarUI()" class="text-xs text-gray-400 hover:text-white mb-2">← 换方子</button>' +
            '<h4 class="font-bold text-white mb-1">' + r.name + '</h4>';
        [['main', '主药'], ['assist', '辅药'], ['balancer', '调和']].forEach(function (pair) {
            var key = pair[0], label = pair[1];
            var need = r.slots[key].count;
            var picked = _cp.pick[key];
            html += '<div class="mb-3"><p class="text-xs text-amber-300 mb-1">' + label + '（' + picked.length + '/' + need + '）' +
                (r.slots[key].accept ? ' <span class="text-gray-500">收：' + r.slots[key].accept.join('/') + '</span>' : '') + '</p>';
            // 已选（点×撤）
            html += '<div class="flex flex-wrap gap-1 mb-1">' + (picked.length ? picked.map(function (id, idx) {
                return '<span class="text-xs bg-purple-800 text-purple-100 px-2 py-0.5 rounded">' + _nameOf(id) +
                    ' <button onclick="window._cpUnpick(\'' + key + '\',' + idx + ')" class="text-purple-300 hover:text-white">×</button></span>';
            }).join('') : '<span class="text-xs text-gray-500">尚未选材</span>') + '</div>';
            // 可选（背包里有且合槽）
            if (picked.length < need) {
                var avail = window.AlchemyCompound.listAvailableMatsForSlot(r.slots[key], _slots() || []) || [];
                html += '<div class="flex flex-wrap gap-1">' + (avail.length ? avail.map(function (m) {
                    return '<button onclick="window._cpPick(\'' + key + '\',\'' + m.itemId + '\')" class="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-2 py-0.5 rounded border border-gray-600">' +
                        _nameOf(m.itemId) + '×' + m.count + ' <span class="text-amber-400">评' + m.score + '</span></button>';
                }).join('') : '<span class="text-xs text-gray-500">背包里没有合这槽的药材</span>') + '</div>';
            }
            html += '</div>';
        });
        var fireReady = typeof window._alchemyFireBonus === 'number' && window._alchemyFireBonus >= 0;
        html += '<div class="flex flex-wrap gap-2 mt-2">' +
            '<button onclick="window._cpFire()" class="text-xs px-3 py-1.5 rounded font-bold ' + (fireReady ? 'bg-yellow-700 text-yellow-100' : 'bg-orange-600 hover:bg-orange-500 text-white') + '">' +
            (fireReady ? '🔥 火候已试：' + window._alchemyFireBonus + '分（开炉即用）' : '🔥 火候试炼（亲可控火，定品质）') + '</button>' +
            '<button onclick="window._cpRun()" class="text-xs px-3 py-1.5 rounded font-bold bg-purple-600 hover:bg-purple-500 text-white">⚗️ 开炉（真气' + (r.qiCost || 0) + '·耗材料）</button>' +
            '</div><p class="text-xs text-gray-500 mt-2">没试火也能开炉——火候按炼制技能±随机浮动。</p>';
        _redraw(html);
    }
    window._cpPick = function (key, itemId) {
        var r = _cpRecipe(); if (!r || !key) return;
        if (_cp.pick[key].length >= r.slots[key].count) return;
        // 背包存量约束：同材多选不得超过持有数
        var used = 0;
        for (var k in _cp.pick) _cp.pick[k].forEach(function (x) { if (x === itemId) used++; });
        if (used >= _haveCount(itemId)) { if (window.showMessage) window.showMessage('背包里的' + _nameOf(itemId) + '都下锅了。', 'info'); return; }
        _cp.pick[key].push(itemId);
        _cpRender();
    };
    window._cpUnpick = function (key, idx) {
        _cp.pick[key].splice(idx, 1);
        _cpRender();
    };
    window._cpFire = function () {
        if (typeof window.openFireQTE === 'function') {
            window.openFireQTE();
            // QTE 收火后回来刷新按钮状态
            setTimeout(function () { if (_cp) _cpRender(); }, 100);
        } else if (window.showMessage) window.showMessage('火候试炼未就绪。', 'warning');
    };
    window._cpRun = function () {
        var r = _cpRecipe(); if (!r) return;
        var res = window.AlchemyCompound.executeCompoundPilfar(_cp.recipeId, _cp.pick);
        if (!res || !res.ok) {
            var reasons = { 'recipe-not-found': '方子不对', 'empty-pick': '还没选材', 'material-short': '材料不齐', 'inventory-full': '背包满了，丹没地方放（材料已退回）' };
            var reason = (res && res.reason) || '';
            var msg = reasons[reason] || reason;
            if (reason.indexOf('skill-low') === 0) msg = '炼制手艺不到火候（' + reason.replace('skill-low', '').replace(/[()]/g, ' ') + '）';
            if (reason.indexOf('qi-low') === 0) msg = '真气不足，压不住丹火';
            if (reason.indexOf('count-mismatch') >= 0 || reason.indexOf('slot-') === 0) msg = '槽位选材不合方子';
            if (window.showMessage) window.showMessage('❌ 开炉未成：' + msg, 'warning');
            return;
        }
        var q = res.quality || {};
        _redraw('<div class="text-center py-4">' +
            '<p class="text-3xl mb-2">' + (q.id === 'imperial' ? '🌟' : (res.toxic >= 40 ? '☣️' : '⚗️')) + '</p>' +
            '<p class="font-bold text-white text-lg">' + _nameOf(res.itemId) + '</p>' +
            '<p class="text-sm mt-1" style="color:' + (q.color === 'purple' ? '#c084fc' : q.color === 'gold' ? '#fbbf24' : q.color === 'blue' ? '#60a5fa' : '#d1d5db') + '">品质：' + (q.name || '?') + '（评分 ' + Math.round(res.score) + '，毒性 ' + Math.round(res.toxic) + '）</p>' +
            '<p class="text-xs text-gray-400 mt-2">' + (q.id === 'imperial' ? '御品出炉，丹香十里！' : (res.toxic >= 40 ? '毒性偏重——丹成瑕疵，下回选药材长个心眼。' : '丹成，收入囊中。')) + '</p>' +
            '<button onclick="openCompoundPilfarUI()" class="mt-4 text-xs px-4 py-2 rounded bg-purple-600 hover:bg-purple-500 text-white">再开一炉</button></div>');
    };

    // ============ 词缀炼器（ForgingCompound） ============
    var _cf = null; // { recipeId, embryo, main:[], assist:[], rune:[] }
    window.openCompoundForgingUI = function () {
        if (!window.ForgingCompound) { if (window.showMessage) window.showMessage('词缀炼器系统未就绪。', 'error'); return; }
        _cf = null;
        var recipes = window.ForgingCompound.COMPOUND_FORGING_RECIPES || [];
        var html = '<p class="text-xs text-gray-400 mb-3">器胚定形、材料定词缀——每件材料的标签从十九词缀池里抽词，锻造手艺越高留下的越多。主材/辅材必配，铭纹槽（手艺40+）可选。<br>出炉的器有品相（劣质/普通/优良/杰出/极品）：炉火看手艺、工法看词缀铭纹——品相真动数值，极品出炉成双；装了炼器台，品相再抬一段。炉火还能亲手试炼：控火得分替代随机浮动，盯准黄区收火，好手艺配好火才出极品。</p>';
        html += recipes.map(function (r) {
            var sk = r.requiredSkills ? Object.keys(r.requiredSkills).map(function (k) { return k + '≥' + r.requiredSkills[k]; }).join(' ') : '无';
            return '<div class="bg-gray-700/40 p-3 rounded border border-gray-600 mb-2">' +
                '<div class="flex justify-between items-center"><span class="font-bold text-sm text-white">' + (r.name || r.id) + '</span>' +
                '<button onclick="window._cfSelect(\'' + r.id + '\')" class="text-xs px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white">选坯开锻</button></div>' +
                '<div class="text-xs text-gray-400 mt-1">' + (r.desc || '') + '</div>' +
                '<div class="text-xs text-gray-500 mt-1">器胚：' + r.slots.embryo.type + ' ｜ 主材' + r.slots.main.count + ' 辅材' + r.slots.assist.count +
                (r.slots.rune.optional ? ' 铭纹0~' + r.slots.rune.count + '（锻造≥' + r.slots.rune.minForgeSkill + '）' : '') +
                ' ｜ 门槛：' + sk + ' ｜ 真气 ' + (r.qiCost || 0) + '</div></div>';
        }).join('');
        _modal('🗡️ 词缀炼器 · 自由锻', html);
    };
    window._cfSelect = function (recipeId) {
        var r = null;
        (window.ForgingCompound.COMPOUND_FORGING_RECIPES || []).forEach(function (x) { if (x.id === recipeId) r = x; });
        _cf = { recipeId: recipeId, embryo: r ? r.slots.embryo.type : 'sword', main: [], assist: [], rune: [] };
        _cfRender();
    };
    function _cfRecipe() {
        var rs = window.ForgingCompound.COMPOUND_FORGING_RECIPES || [];
        for (var i = 0; i < rs.length; i++) if (rs[i].id === _cf.recipeId) return rs[i];
        return null;
    }
    function _taggedMats() {
        var slots = _slots() || [];
        var seen = {}, out = [];
        for (var i = 0; i < slots.length; i++) {
            var s = slots[i], id = _idOf(s);
            if (!id || s.count <= 0 || seen[id]) continue;
            var tags = window.ForgingCompound.getMaterialTags(id) || [];
            if (tags.length) { seen[id] = 1; out.push({ itemId: id, count: s.count, tags: tags }); }
        }
        return out;
    }
    function _cfRender() {
        var r = _cfRecipe(); if (!r) return;
        var html = '<button onclick="openCompoundForgingUI()" class="text-xs text-gray-400 hover:text-white mb-2">← 换器坯</button>' +
            '<h4 class="font-bold text-white mb-1">' + r.name + ' <span class="text-xs text-gray-400">（' + _cf.embryo + '胚）</span></h4>';
        var mats = _taggedMats();
        [['main', '主材'], ['assist', '辅材'], ['rune', '铭纹（可选）']].forEach(function (pair) {
            var key = pair[0], label = pair[1];
            var need = r.slots[key].count;
            var isRune = key === 'rune' && r.slots.rune.optional;
            var picked = _cf[key];
            html += '<div class="mb-3"><p class="text-xs text-amber-300 mb-1">' + label + '（' + picked.length + '/' + need + (isRune ? '，可空' : '') + '）</p>';
            html += '<div class="flex flex-wrap gap-1 mb-1">' + (picked.length ? picked.map(function (id, idx) {
                return '<span class="text-xs bg-purple-800 text-purple-100 px-2 py-0.5 rounded">' + _nameOf(id) +
                    ' <button onclick="window._cfUnpick(\'' + key + '\',' + idx + ')" class="text-purple-300 hover:text-white">×</button></span>';
            }).join('') : '<span class="text-xs text-gray-500">尚未选材</span>') + '</div>';
            var cap = isRune ? need : need;
            if (picked.length < cap) {
                html += '<div class="flex flex-wrap gap-1">' + (mats.length ? mats.map(function (m) {
                    return '<button onclick="window._cfPick(\'' + key + '\',\'' + m.itemId + '\')" class="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-2 py-0.5 rounded border border-gray-600">' +
                        _nameOf(m.itemId) + '×' + m.count + ' <span class="text-cyan-400">' + m.tags.join('·') + '</span></button>';
                }).join('') : '<span class="text-xs text-gray-500">背包里没有带词缀标签的材料</span>') + '</div>';
            }
            html += '</div>';
        });
        var forgeFireReady = typeof window._forgingFireBonus === 'number' && window._forgingFireBonus >= 0;
        html += '<div class="flex flex-wrap gap-2 mt-2">' +
            '<button onclick="window._cfFire()" class="text-xs px-3 py-1.5 rounded font-bold ' + (forgeFireReady ? 'bg-yellow-700 text-yellow-100' : 'bg-orange-600 hover:bg-orange-500 text-white') + '">' +
            (forgeFireReady ? '🔥 锻火已试：' + window._forgingFireBonus + '分（开锻即用）' : '🔥 火候试炼（亲可控火，定品相）') + '</button>' +
            '<button onclick="window._cfRun()" class="text-xs px-3 py-1.5 rounded font-bold bg-purple-600 hover:bg-purple-500 text-white">⚒️ 开锻（真气' + (r.qiCost || 0) + '·耗材料）</button>' +
            '</div><p class="text-xs text-gray-500 mt-2">没试火也能开锻——炉火按锻造手艺±随机浮动；控火得分顶不了手艺的封顶（手艺+20）。</p>';
        _redraw(html);
    }
    window._cfFire = function () {
        if (typeof window.openForgeFireQTE === 'function') {
            window.openForgeFireQTE();
            // 收火后回来刷新按钮状态
            setTimeout(function () { if (_cf) _cfRender(); }, 100);
        } else if (window.showMessage) window.showMessage('火候试炼未就绪。', 'warning');
    };
    window._cfPick = function (key, itemId) {
        var r = _cfRecipe(); if (!r) return;
        if (_cf[key].length >= r.slots[key].count) return;
        var used = 0;
        ['main', 'assist', 'rune'].forEach(function (k) { _cf[k].forEach(function (x) { if (x === itemId) used++; }); });
        if (used >= _haveCount(itemId)) { if (window.showMessage) window.showMessage('库存的' + _nameOf(itemId) + '都用上了。', 'info'); return; }
        _cf[key].push(itemId);
        _cfRender();
    };
    window._cfUnpick = function (key, idx) { _cf[key].splice(idx, 1); _cfRender(); };
    window._cfRun = function () {
        var res = window.ForgingCompound.executeCompoundForging(_cf.recipeId, {
            embryo: _cf.embryo, main: _cf.main, assist: _cf.assist, rune: _cf.rune
        });
        if (!res || !res.ok) {
            var reason = (res && res.reason) || '';
            var msgs = { 'empty-embryo': '还没定器胚', 'material-short': '材料不齐', 'qi-low': '真气不足，抡不动锤', 'inventory-full': '背包满了（材料已退回）' };
            var msg = msgs[reason] || reason;
            if (reason.indexOf('skill-low') === 0) msg = '锻造手艺不到（' + reason.replace('skill-low', '').replace(/[()]/g, ' ') + '）';
            if (reason.indexOf('count-mismatch') >= 0 || reason.indexOf('-count') >= 0) msg = '槽位选材数不合器谱';
            if (reason.indexOf('rune-skill-low') === 0) msg = '铭纹是大活——锻造手艺不够，铭纹槽用不得';
            if (window.showMessage) window.showMessage('❌ 开锻未成：' + msg, 'warning');
            return;
        }
        var affTxt = (res.affixes || []).map(function (a) { return a.name || a.key; }).join('、') || '（素器——材料没抽出词缀）';
        // 第二十六波：出炉的器有品相——品质字头、工评、极品成双都亮给玩家看
        var _qId = (res.quality && res.quality.id) || 'normal';
        var _qColor = { poor: 'text-gray-400', normal: 'text-gray-300', good: 'text-blue-300', excellent: 'text-yellow-300', imperial: 'text-purple-300' }[_qId] || 'text-gray-300';
        _redraw('<div class="text-center py-4">' +
            '<p class="text-3xl mb-2">' + (res.imprint ? '🌟' : '🗡️') + '</p>' +
            '<p class="font-bold text-white text-lg">' + (res.name || _nameOf(res.itemId)) + '</p>' +
            '<p class="text-sm ' + _qColor + ' mt-1">品相：' + ((res.quality && res.quality.name) || '普通') + '（工评 ' + (res.score != null ? res.score : '？') + '/100' + (_qId === 'imperial' ? '·极品出炉成双，同款多一件' : '') + '）</p>' +
            '<p class="text-sm text-cyan-300 mt-1">词缀：' + affTxt + '</p>' +
            (res.imprint ? '<p class="text-xs text-purple-300 mt-1">铭纹入器——这一炉是大活。</p>' : '') +
            '<button onclick="openCompoundForgingUI()" class="mt-4 text-xs px-4 py-2 rounded bg-purple-600 hover:bg-purple-500 text-white">再锻一件</button></div>');
    };

    // ============ 洞府深作：设施 / 阵法 / 傀儡 ============
    window.openCaveWorksUI = function () {
        if (!window.playerHouse) { if (window.showMessage) window.showMessage('尚未开辟洞府——先置办一处产业再来装点。', 'warning'); return; }
        var html = '<div class="flex flex-wrap gap-2 mb-3">' +
            '<button onclick="window._cwTab(\'fac\')" class="text-xs px-3 py-1 rounded bg-purple-600 text-white font-bold">🧰 设施布置</button>' +
            '<button onclick="window._cwTab(\'fmt\')" class="text-xs px-3 py-1 rounded bg-gray-700 text-gray-300">🌀 护持阵法</button>' +
            '<button onclick="window._cwTab(\'pup\')" class="text-xs px-3 py-1 rounded bg-gray-700 text-gray-300">🤖 傀儡工坊</button>' +
            '</div><div id="cw-tab-body"></div>';
        _modal('🏔️ 洞府深作', html);
        window._cwTab('fac');
    };
    window._cwTab = function (tab) {
        var host = document.getElementById('cw-tab-body');
        if (!host) {
            // 第一百零一波·洞府翻新：深作三门已并入洞府页「阵工坊」页签一级——弹窗宿主不在时回头刷新洞府页
            if (window.HousePanelUI && typeof window.HousePanelUI.refresh === 'function') window.HousePanelUI.refresh();
            return;
        }
        if (tab === 'fac') host.innerHTML = _facHtml();
        else if (tab === 'fmt') host.innerHTML = _fmtHtml();
        else host.innerHTML = _pupHtml();
    };
    // 第一百零一波·洞府翻新：把三间的账目 HTML 直接借给洞府页「阵工坊」页签用（不再套弹窗）
    window._cwSection = function (tab) {
        if (tab === 'fac') return _facHtml();
        if (tab === 'fmt') return _fmtHtml();
        return _pupHtml();
    };
    // ---- 设施 ----
    var FAC_COST = 200;
    // 第一百零四波·山居：设施是「修」出来的——安置除工料费外真扣材料（工料单挂在设施账上）
    function _facMats(facId) {
        var FAC = (window.CaveFacilities && window.CaveFacilities.FACILITIES) || {};
        return (FAC[facId] && FAC[facId].materials) || [];
    }
    function _matsMissing(mats) {
        var miss = [];
        (mats || []).forEach(function (m) {
            var have = _haveCount(m.itemId);
            if (have < m.count) miss.push({ itemId: m.itemId, have: have, need: m.count - have });
        });
        return miss;
    }
    function _matsConsume(mats) {
        var okAll = true;
        (mats || []).forEach(function (m) {
            var need = m.count;
            var slots = (window.inventory && window.inventory.slots) || [];
            for (var i = 0; i < slots.length && need > 0; i++) {
                var s = slots[i];
                if (s && s.templateId === m.itemId) {
                    var take = Math.min(Number(s.count) || 0, need);
                    s.count -= take; need -= take;
                    if (s.count <= 0) slots[i] = null;
                }
            }
            if (need > 0) okAll = false;
        });
        return okAll;
    }
    function _facHtml() {
        if (!window.CaveFacilities) return '<p class="text-xs text-gray-400">设施系统未就绪。</p>';
        var caveId = 'player';
        var maxSlots = window.CaveFacilities.getAvailableSlots(caveId) || 0;
        var installed = window.CaveFacilities.getFacilities(caveId) || [];
        var html = '<p class="text-xs text-gray-400 mb-2">洞府等级决定设施位（当前 ' + installed.length + '/' + maxSlots + '）。安置一处：工料费 ' + FAC_COST + ' 灵石 + 图样上的材料（伐木采矿攒来的真料）、工期两个时辰——加成从安置当日起真算进修炼/炼制/灵兽的账。</p>';
        if (installed.length) {
            html += '<div class="mb-3">' + installed.map(function (f) {
                return '<div class="flex justify-between items-center bg-gray-700/40 p-2 rounded mb-1">' +
                    '<span class="text-xs text-white">' + (f.name || f.facilityId) + ' <span class="text-gray-500">［位' + (f.slot + 1) + '］</span></span>' +
                    '<button onclick="window._caveUninstall(' + f.slot + ')" class="text-xs px-2 py-0.5 rounded bg-gray-600 hover:bg-red-700 text-white">拆除</button></div>';
            }).join('') + '</div>';
        }
        if (window.playerHouse && window.playerHouse.type === 'ruin' && maxSlots === 0) {
            return html + '<p class="text-xs text-amber-300/90 bg-gray-700/30 rounded p-2">🪨 石壁漏风，设施无处安放——先把山洞修缮起来（洞府页门牌上「🏗️ 修缮扩建」里备着图样，木材铁矿石齐了就能动工）。</p>';
        }
        if (installed.length < maxSlots) {
            var FAC = window.CaveFacilities.FACILITIES || {};
            html += '<div class="space-y-1">' + Object.keys(FAC).map(function (fid) {
                var f = FAC[fid];
                var mats = f.materials || [];
                var matLine = mats.map(function (m) {
                    var have = _haveCount(m.itemId);
                    return '<span class="' + (have >= m.count ? 'text-green-400' : 'text-red-400') + '">' + _nameOf(m.itemId) + ' ' + have + '/' + m.count + '</span>';
                }).join(' ');
                var ready = _matsMissing(mats).length === 0;
                return '<div class="flex justify-between items-center bg-gray-700/30 p-2 rounded border border-gray-600">' +
                    '<div><p class="text-xs text-white font-bold">' + f.name + '</p><p class="text-[10px] text-gray-400">' + f.desc + '</p>' +
                    (matLine ? '<p class="text-[10px] mt-0.5">工料：' + matLine + '</p>' : '') + '</div>' +
                    '<button onclick="window._caveInstall(\'' + fid + '\')" class="text-xs px-2 py-1 rounded shrink-0 ' +
                    (ready ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-gray-700 text-gray-500') + '">安置</button></div>';
            }).join('') + '</div>';
        } else {
            html += '<p class="text-xs text-gray-500">设施位已满——修缮扩建洞府可开新位。</p>';
        }
        return html;
    }
    window._caveInstall = function (facId) {
        // 第一百零四波·山居：先点工料——材料不齐不动工；材料在安置落定后真扣
        var mats = _facMats(facId);
        var miss = _matsMissing(mats);
        if (miss.length) {
            if (window.showMessage) window.showMessage('工料不齐：' + miss.map(function (m) { return _nameOf(m.itemId) + '缺' + m.need; }).join('、') + '——伐木采矿攒齐了再动工。', 'error');
            return;
        }
        if (!_payStones(FAC_COST)) { if (window.showMessage) window.showMessage('工料费不足（' + FAC_COST + '灵石）。', 'error'); return; }
        var res = window.CaveFacilities.install('player', facId);
        if (!res || !res.ok) {
            _payRefund(FAC_COST);
            var reasons = { 'no-available-slot': '设施位已满', 'slot-busy': '该位已有设施', 'unknown-facility': '没有这种设施' };
            if (window.showMessage) window.showMessage('安置未成：' + (reasons[res && res.reason] || (res && res.reason) || '未知'), 'warning');
            return;
        }
        _matsConsume(mats);   // 落位成功才耗料——不成的活儿不费料
        if (window.timeSystem && window.timeSystem.advanceTime) { try { window.timeSystem.advanceTime(120, '安置洞府设施'); } catch (e) {} }
        if (window.showMessage) window.showMessage('🧰 设施安置妥当，工料入账——从今日起生效。', 'success');
        window._cwTab('fac');
    };
    window._caveUninstall = function (slot) {
        var res = window.CaveFacilities.uninstall('player', slot);
        if (res && res.ok) { if (window.showMessage) window.showMessage('已拆除，料件收进库房。', 'info'); }
        window._cwTab('fac');
    };
    function _payRefund(n) {
        if (window.XianXia && window.XianXia.DataManager && typeof window.XianXia.DataManager.addSpiritStones === 'function') window.XianXia.DataManager.addSpiritStones(n);
        else if (window.inventory && window.inventory.currency) window.inventory.currency.spiritStones = (window.inventory.currency.spiritStones || 0) + n;
    }
    // ---- 阵法 ----
    function _fmtHtml() {
        if (!window.FormationSystem) return '<p class="text-xs text-gray-400">阵法系统未就绪。</p>';
        var FS = window.FormationSystem;
        var html = '<p class="text-xs text-gray-400 mb-2">布阵耗阵材与灵石。战阵随你出战（攻/防/暴加成，耐久逐场磨损），地脉阵养修炼，护山阵保宗门。阵材坊市有售。</p>';
        [['combat', '随身战阵'], ['field', '洞府地阵'], ['sect', '护山阵']].forEach(function (pair) {
            var st = FS.getState ? FS.getState() : {};
            var slot = st[pair[0]] || {};
            var act = slot.formationId ? FS.getFormation(slot.formationId) : null;
            html += '<p class="text-xs text-amber-300 mt-2 mb-1">' + pair[1] + '：' + (act
                ? '<span class="text-green-400">' + act.name + '（耐久 ' + (slot.durability || 0) + '/' + act.maxDurability + '）</span> <button onclick="window._fmtWithdraw(\'' + act.id + '\')" class="text-[10px] px-2 py-0.5 rounded bg-gray-600 text-white ml-2">撤阵</button>'
                : '<span class="text-gray-500">虚位以待</span>') + '</p>';
            if (!act) {
                html += '<div class="space-y-1">' + (FS.listFormations(pair[0]) || []).map(function (f) {
                    var miss = (f.materials || []).map(function (m) {
                        var have = _haveCount(m.itemId);
                        return '<span class="' + (have >= m.count ? 'text-green-400' : 'text-red-400') + '">' + _nameOf(m.itemId) + ' ' + have + '/' + m.count + '</span>';
                    }).join(' ');
                    return '<div class="bg-gray-700/30 p-2 rounded border border-gray-600">' +
                        '<div class="flex justify-between items-center"><span class="text-xs text-white font-bold">' + f.name + ' <span class="text-gray-500">T' + f.tier + '</span></span>' +
                        '<button onclick="window._fmtDeploy(\'' + f.id + '\')" class="text-xs px-2 py-0.5 rounded bg-cyan-700 hover:bg-cyan-600 text-white">布阵（首期灵石' + f.spiritStonesPerTurn + '）</button></div>' +
                        '<p class="text-[10px] text-gray-400 mt-0.5">' + f.desc + ' ｜ 耐久' + f.maxDurability + '</p>' +
                        '<p class="text-[10px] mt-0.5">' + miss + '</p></div>';
                }).join('') + '</div>';
            }
        });
        return html;
    }
    window._fmtDeploy = function (fid) {
        var FS = window.FormationSystem;
        FS.setSpiritStones(_stones()); // 账房同步：系统内账 = 真实钱包
        var res = FS.deployFormation(fid);
        if (!res || !res.ok) {
            var reasons = { 'materials-missing': '阵材不齐', 'spiritStones-low': '灵石不够首期阵费', 'slot-busy': '此位已有阵在', 'formation-not-found': '没有这门阵法' };
            var msg = reasons[res && res.reason] || (res && res.reason) || '未知';
            if (res && res.missing) msg += '：' + res.missing.map(function (m) { return _nameOf(m.itemId) + '缺' + (m.need - m.have); }).join('、');
            if (window.showMessage) window.showMessage('布阵未成：' + msg, 'warning');
            return;
        }
        var f = FS.getFormation(fid);
        // 第二十三波：首期阵费已在 deployFormation 里从真钱包扣讫（账目一处结清，不再双扣）
        if (window.showMessage) window.showMessage('🌀 阵成——旗门落位，灵光升起。' + (f ? '（首期阵费灵石' + f.spiritStonesPerTurn + '已出，往后按日维持）' : ''), 'success');
        window._cwTab('fmt');
    };
    window._fmtWithdraw = function (formationId) {
        var FS = window.FormationSystem;
        if (typeof FS.withdrawFormation === 'function') FS.withdrawFormation(formationId);
        if (window.showMessage) window.showMessage('撤阵——旗卷石收，阵位空出。', 'info');
        window._cwTab('fmt');
    };
    // ---- 傀儡 ----
    function _pupHtml() {
        if (!window.PuppetSystem) return '<p class="text-xs text-gray-400">傀儡系统未就绪。</p>';
        var PS = window.PuppetSystem;
        var st = PS.getState ? PS.getState() : { puppets: [] };
        var html = '<p class="text-xs text-gray-400 mb-2">四部件（核心/躯干/兵装/图纹）拼傀儡，工费灵石。造出的傀儡每日耗真气灵石化，出战/采集/运输各有产出——日结账已在世界里跑着，就差你造出第一只。</p>';
        if (st.puppets && st.puppets.length) {
            html += '<div class="mb-3">' + st.puppets.map(function (p) {
                return '<div class="flex justify-between items-center bg-gray-700/40 p-2 rounded mb-1">' +
                    '<span class="text-xs text-white">🤖 ' + p.name + ' <span class="text-gray-500">耐久' + p.durability + '/' + p.maxDurability + (p.deployed ? ' · 已启用' : '') + '</span></span>' +
                    '<span>' + (p.deployed
                        ? '<button onclick="window._pupRecall(\'' + p.id + '\')" class="text-xs px-2 py-0.5 rounded bg-gray-600 text-white">收起</button>'
                        : '<button onclick="window._pupDeploy(\'' + p.id + '\')" class="text-xs px-2 py-0.5 rounded bg-green-700 text-white">启用</button>') +
                    ' <button onclick="window._pupRepair(\'' + p.id + '\')" class="text-xs px-2 py-0.5 rounded bg-yellow-700 text-white ml-1">修缮</button></span></div>';
            }).join('') + '</div>';
        }
        html += '<div class="space-y-1">' + (PS.PUPPETS || []).map(function (t) {
            var need = PS.getRequiredMaterials(t.id) || [];
            var partsTxt = need.map(function (m) {
                var have = _haveCount(m.itemId);
                return '<span class="' + (have >= m.count ? 'text-green-400' : 'text-red-400') + '">' + _nameOf(m.itemId) + ' ' + have + '/' + m.count + '</span>';
            }).join(' ');
            return '<div class="bg-gray-700/30 p-2 rounded border border-gray-600">' +
                '<div class="flex justify-between items-center"><span class="text-xs text-white font-bold">' + t.name + ' <span class="text-gray-500">' + t.role + '</span></span>' +
                '<button onclick="window._pupCraft(\'' + t.id + '\')" class="text-xs px-2 py-0.5 rounded bg-purple-600 hover:bg-purple-500 text-white">制造（' + t.cost + '灵石）</button></div>' +
                '<p class="text-[10px] mt-0.5">' + partsTxt + '</p></div>';
        }).join('') + '</div>';
        return html;
    }
    window._pupCraft = function (pid) {
        var PS = window.PuppetSystem;
        PS.setSpiritStones(_stones());
        var t = PS.getPuppetTemplate(pid);
        var res = PS.craft(pid);
        if (!res || !res.ok) {
            var reasons = { 'materials-missing': '部件不齐', 'spiritStones-low': '灵石不够工费', 'puppet-not-found': '没有这种傀儡' };
            if (window.showMessage) window.showMessage('制造未成：' + (reasons[res && res.reason] || (res && res.reason) || '未知'), 'warning');
            return;
        }
        if (t) _payStones(t.cost); // 工费从真钱包出
        if (window.showMessage) window.showMessage('🤖 「' + res.puppet.name + '」组装完毕，眼窝里的灵光亮了起来。', 'success');
        window._cwTab('pup');
    };
    window._pupDeploy = function (iid) {
        var res = window.PuppetSystem.deploy(iid);
        if (window.showMessage) window.showMessage((res && res.ok) ? '傀儡领命上岗。' : ('启用未成：' + ((res && res.reason) || '未知')), (res && res.ok) ? 'success' : 'warning');
        window._cwTab('pup');
    };
    window._pupRecall = function (iid) {
        window.PuppetSystem.recall(iid);
        if (window.showMessage) window.showMessage('傀儡归库待命。', 'info');
        window._cwTab('pup');
    };
    window._pupRepair = function (iid) {
        var res = window.PuppetSystem.repair(iid);
        if (window.showMessage) window.showMessage((res && res.ok !== false) ? '修缮完毕，关节重新上了灵油。' : ('修缮未成：' + ((res && (res.reason || res.msg)) || '未知')), 'info');
        window._cwTab('pup');
    };

    console.log('[深水区] v23.0 接线完成：开放炼丹/词缀炼器/洞府设施/阵法/傀儡 门户俱开');
})();
