/**
 * fengshui.js — v25.5 风水布置（第一百四十七批 · 玩法立项批）
 *
 * 静室八方位各秉一股方位之气（后天八卦配五行）：把法器摆件安到同气吉位，修炼提速；
 * 安到相克煞位，器物之气与方位之气互冲，反噬气机紊乱。账挂 playerHouse.fengshui，
 * 随洞府整档走 saveHouseData()——不新开 localStorage 键（v25.3 存档扫描铁律）。
 *
 * 消费点：house-system.js getHouseBonus('cultivation') 末段乘 window.getFengshuiMul()；
 * 明细签：house-panel.js _bonusChips() 挂「风水」一枚签；入口在库房页家具区。
 *
 * 口径（数值集中在此，调整只动这几个常量）：
 *   同气吉位 +6% / 位生物器·小吉 +3% / 器物生位·泄气 0 / 任一相克·煞位 -4%
 *   总倍率 clamp [0.8, 1.5]；有煞位每日 15% 气机紊乱 +3。
 */
(function () {
    'use strict';

    // 后天八卦八方位（UI 按 3×3 九宫排：巽离坤 / 震·兑 / 艮坎乾，中宫不放物）
    var FENGSHUI_POSITIONS = {
        xun: { id: 'xun', name: '巽位', dir: '东南', element: 'wood',  icon: '☴' },
        li:  { id: 'li',  name: '离位', dir: '正南', element: 'fire',  icon: '☲' },
        kun: { id: 'kun', name: '坤位', dir: '西南', element: 'earth', icon: '☷' },
        zhen:{ id: 'zhen',name: '震位', dir: '正东', element: 'wood',  icon: '☳' },
        dui: { id: 'dui', name: '兑位', dir: '正西', element: 'metal', icon: '☱' },
        gen: { id: 'gen', name: '艮位', dir: '东北', element: 'earth', icon: '☶' },
        kan: { id: 'kan', name: '坎位', dir: '正北', element: 'water', icon: '☵' },
        qian:{ id: 'qian',name: '乾位', dir: '西北', element: 'metal', icon: '☰' }
    };
    // 九宫排版序（中宫留白）
    var GRID_ORDER = ['xun', 'li', 'kun', 'zhen', null, 'dui', 'gen', 'kan', 'qian'];

    var ELEM_NAME = { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' };
    var ELEM_GENERATES = { wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood' };
    var ELEM_OVERCOMES = { wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood' };

    // 风水法器（铺子里置办，五行属各其器）
    var FENGSHUI_ITEMS = {
        fs_qinglong: { id: 'fs_qinglong', name: '青龙案', icon: '🐉', element: 'wood',  price: 500, desc: '古木案几，青藤自生——木气郁郁' },
        fs_zhuque:  { id: 'fs_zhuque',  name: '朱雀灯', icon: '🪔', element: 'fire',  price: 500, desc: '赤铜灯盏，焰色如翎——火气炎炎' },
        fs_huanglin:{ id: 'fs_huanglin',name: '黄玉镇', icon: '🟡', element: 'earth', price: 500, desc: '厚土黄玉，压宅定气——土气沉沉' },
        fs_baihu:   { id: 'fs_baihu',   name: '白玉琥', icon: '🐅', element: 'metal', price: 500, desc: '白玉雕琥，锋芒内敛——金气肃肃' },
        fs_xuanwu:  { id: 'fs_xuanwu',  name: '玄武石', icon: '🐢', element: 'water', price: 500, desc: '寒潭黑石，水润无声——水气泠泠' }
    };
    // 既有家具的五行（买过就能挪去当摆件，不必另置）
    var FURNITURE_ELEMENT = { mat: 'wood', stove: 'fire', lamp: 'metal' };

    function _house() { return window.playerHouse || null; }

    function _data() {
        var h = _house();
        if (!h) return null;
        if (!h.fengshui || typeof h.fengshui !== 'object') h.fengshui = { placements: {}, owned: [] };
        if (!h.fengshui.placements || typeof h.fengshui.placements !== 'object') h.fengshui.placements = {};
        if (!Array.isArray(h.fengshui.owned)) h.fengshui.owned = [];
        return h.fengshui;
    }

    function _elemOf(itemId) {
        if (FENGSHUI_ITEMS[itemId]) return FENGSHUI_ITEMS[itemId].element;
        if (FURNITURE_ELEMENT[itemId]) return FURNITURE_ELEMENT[itemId];
        return null;
    }

    function _nameOf(itemId) {
        if (FENGSHUI_ITEMS[itemId]) return FENGSHUI_ITEMS[itemId].name;
        var f = window.HOUSE_FURNITURE && window.HOUSE_FURNITURE[itemId];
        return f ? f.name : itemId;
    }

    function _iconOf(itemId) {
        if (FENGSHUI_ITEMS[itemId]) return FENGSHUI_ITEMS[itemId].icon;
        var f = window.HOUSE_FURNITURE && window.HOUSE_FURNITURE[itemId];
        return f ? f.icon : '📦';
    }

    /** 单件摆件在某方位的断语：{verdict:'吉'|'小吉'|'泄'|'煞', pct, why} */
    function judgePlacement(posId, itemId) {
        var pos = FENGSHUI_POSITIONS[posId];
        var ie = _elemOf(itemId);
        if (!pos || !ie) return { verdict: '平', pct: 0, why: '气机平平' };
        var pe = pos.element;
        if (ie === pe) return { verdict: '吉', pct: 6, why: ELEM_NAME[ie] + '器居' + ELEM_NAME[pe] + '位，同气相求' };
        if (ELEM_GENERATES[pe] === ie) return { verdict: '小吉', pct: 3, why: ELEM_NAME[pe] + '位生' + ELEM_NAME[ie] + '器，位气养物' };
        if (ELEM_GENERATES[ie] === pe) return { verdict: '泄', pct: 0, why: ELEM_NAME[ie] + '器生' + ELEM_NAME[pe] + '位，气泄无得' };
        if (ELEM_OVERCOMES[ie] === pe || ELEM_OVERCOMES[pe] === ie) return { verdict: '煞', pct: -4, why: ELEM_NAME[ie] + '器与' + ELEM_NAME[pe] + '位相冲，互克成煞' };
        return { verdict: '平', pct: 0, why: '气机平平' };
    }

    /** 全盘断语（面板与明细签共用）：[{posId, pos, itemId, item, verdict, pct, why}]，只列摆了东西的位 */
    function getFengshuiReport() {
        var d = _data();
        if (!d) return [];
        var out = [];
        for (var posId in d.placements) {
            var itemId = d.placements[posId];
            if (!itemId || !FENGSHUI_POSITIONS[posId]) continue;
            var j = judgePlacement(posId, itemId);
            out.push({ posId: posId, pos: FENGSHUI_POSITIONS[posId], itemId: itemId, item: { name: _nameOf(itemId), icon: _iconOf(itemId) }, verdict: j.verdict, pct: j.pct, why: j.why });
        }
        return out;
    }

    /** 修炼总倍率（getHouseBonus('cultivation') 末段乘它）：没宅、破山洞、没摆东西都如实回 1 */
    function getFengshuiMul() {
        var h = _house();
        if (!h || !h.type || h.type === 'ruin') return 1;
        var d = _data();
        if (!d) return 1;
        var sum = 0;
        getFengshuiReport().forEach(function (r) { sum += r.pct; });
        if (!sum) return 1;
        var mul = 1 + sum / 100;
        return Math.max(0.8, Math.min(1.5, Math.round(mul * 1000) / 1000));
    }

    function _countSha() {
        return getFengshuiReport().filter(function (r) { return r.verdict === '煞'; }).length;
    }

    /** 置办风水法器：走灵石单一真源，落 playerHouse.fengshui.owned，随洞府整档走 */
    function buyFengshuiItem(itemId) {
        var def = FENGSHUI_ITEMS[itemId];
        if (!def) { if (window.showMessage) window.showMessage('铺子里没这件法器。', 'warning'); return false; }
        var h = _house();
        if (!h || !h.type || h.type === 'ruin') { if (window.showMessage) window.showMessage('破山洞四面漏风，摆什么都是白摆——先修缮洞府。', 'warning'); return false; }
        var d = _data();
        if (d.owned.indexOf(itemId) >= 0) { if (window.showMessage) window.showMessage('「' + def.name + '」已置办过了。', 'info'); return false; }
        if (window.DataManager && window.DataManager.deductSpiritStones && !window.DataManager.deductSpiritStones(def.price)) {
            if (window.showMessage) window.showMessage('置办「' + def.name + '」需 ' + def.price + ' 灵石，钱袋不够。', 'warning');
            return false;
        }
        d.owned.push(itemId);
        if (typeof window.saveHouseData === 'function') window.saveHouseData();
        if (window.showMessage) window.showMessage('🧭 置办了「' + def.icon + ' ' + def.name + '」（' + ELEM_NAME[def.element] + '属）——去八方位上安个吉位。', 'success');
        return true;
    }

    /** 安放/挪位/收起：itemId 传 null 或空串 = 从该位收回（收回不毁物） */
    function placeFengshui(posId, itemId) {
        var h = _house();
        if (!h || !h.type || h.type === 'ruin') { if (window.showMessage) window.showMessage('破山洞立不住方位——先修缮洞府。', 'warning'); return false; }
        if (!FENGSHUI_POSITIONS[posId]) { if (window.showMessage) window.showMessage('没有这个方位。', 'warning'); return false; }
        var d = _data();
        itemId = itemId || null;
        if (itemId) {
            // 得先有这件东西：铺子置办的法器，或已摆进屋的家具
            var ownedFurn = (h.furniture || []);
            var hasIt = d.owned.indexOf(itemId) >= 0 || ownedFurn.indexOf(itemId) >= 0;
            if (!hasIt) { if (window.showMessage) window.showMessage('你手里没有「' + _nameOf(itemId) + '」——先置办。', 'warning'); return false; }
            // 一件东西只能安一个位：先把它从别处收回来
            for (var p in d.placements) { if (d.placements[p] === itemId) delete d.placements[p]; }
            d.placements[posId] = itemId;
        } else {
            delete d.placements[posId];
        }
        if (typeof window.saveHouseData === 'function') window.saveHouseData();
        var j = itemId ? judgePlacement(posId, itemId) : null;
        if (window.showMessage) {
            window.showMessage(itemId
                ? ('🧭 「' + _iconOf(itemId) + ' ' + _nameOf(itemId) + '」安上' + FENGSHUI_POSITIONS[posId].name + '（' + FENGSHUI_POSITIONS[posId].dir + '）——' + j.verdict + '：' + j.why + (j.pct ? '（修炼 ' + (j.pct > 0 ? '+' : '') + j.pct + '%）' : ''))
                : ('已把' + FENGSHUI_POSITIONS[posId].name + '上的摆件收回。'),
                itemId && j.verdict === '煞' ? 'warning' : 'info');
        }
        try { if (typeof window.HousePanelUI === 'object' && window.HousePanelUI && typeof window.HousePanelUI.refresh === 'function') window.HousePanelUI.refresh(); } catch (eUI) {}
        return true;
    }

    /** 可安放的物件清单：置办过的法器 + 已摆进屋的家具（带五行与图标） */
    function getPlaceableItems() {
        var h = _house();
        var d = _data();
        if (!h || !d) return [];
        var out = [];
        d.owned.forEach(function (id) { out.push({ id: id, name: _nameOf(id), icon: _iconOf(id), element: _elemOf(id) }); });
        (h.furniture || []).forEach(function (id) {
            if (FURNITURE_ELEMENT[id]) out.push({ id: id, name: _nameOf(id), icon: _iconOf(id), element: FURNITURE_ELEMENT[id] });
        });
        return out;
    }

    // ==================== UI ====================
    function openFengshuiUI() {
        var h = _house();
        if (!h || !h.type) { if (window.showMessage) window.showMessage('尚未拥有洞府，无处立方位。', 'warning'); return; }
        if (h.type === 'ruin') { if (window.showMessage) window.showMessage('破山洞四面漏风，八卦方位立不住——先去静室看图样修缮。', 'warning'); return; }
        var old = document.getElementById('fengshui-modal');
        if (old) old.remove();
        var d = _data();
        var placeables = getPlaceableItems();
        var mul = getFengshuiMul();
        var sha = _countSha();

        // 九宫格：每格一个方位，select 换摆件（空位 + 可安放的物件）
        var cells = GRID_ORDER.map(function (posId) {
            if (!posId) {
                return '<div class="bg-gray-900/60 rounded p-2 flex items-center justify-center text-gray-600 text-xs">中宫<br>太极</div>';
            }
            var pos = FENGSHUI_POSITIONS[posId];
            var cur = d.placements[posId] || '';
            var j = cur ? judgePlacement(posId, cur) : null;
            var vColor = !j ? 'text-gray-500' : (j.verdict === '吉' ? 'text-green-400' : (j.verdict === '小吉' ? 'text-lime-300' : (j.verdict === '煞' ? 'text-red-400' : 'text-gray-400')));
            var opts = '<option value="">（空位）</option>' + placeables.map(function (it) {
                return '<option value="' + it.id + '"' + (it.id === cur ? ' selected' : '') + '>' + it.icon + ' ' + it.name + '·' + (ELEM_NAME[it.element] || '?') + '</option>';
            }).join('');
            return '<div class="bg-gray-800/80 rounded p-2 border ' + (j && j.verdict === '煞' ? 'border-red-700' : 'border-gray-700') + '">' +
                '<div class="text-xs text-gray-300 font-bold">' + pos.icon + ' ' + pos.name + ' <span class="text-gray-500">' + pos.dir + '·' + ELEM_NAME[pos.element] + '</span></div>' +
                '<select onchange="window.placeFengshui(\'' + posId + '\', this.value); window.openFengshuiUI();" class="w-full mt-1 bg-gray-900 text-gray-200 text-xs rounded p-1 border border-gray-600">' + opts + '</select>' +
                (j ? '<div class="text-[11px] mt-1 ' + vColor + '">' + j.verdict + (j.pct ? '（' + (j.pct > 0 ? '+' : '') + j.pct + '%）' : '') + ' · ' + j.why + '</div>' : '<div class="text-[11px] mt-1 text-gray-600">空着——摆件合气的法器</div>') +
                '</div>';
        }).join('');

        // 铺子：还没置办的法器
        var shopKeys = Object.keys(FENGSHUI_ITEMS).filter(function (id) { return d.owned.indexOf(id) < 0; });
        var shopHtml = shopKeys.length
            ? '<div class="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">' + shopKeys.map(function (id) {
                var f = FENGSHUI_ITEMS[id];
                return '<div class="bg-gray-800/60 rounded p-2 border border-gray-700">' +
                    '<div class="text-sm text-gray-200">' + f.icon + ' ' + f.name + ' <span class="text-xs text-gray-500">' + ELEM_NAME[f.element] + '属 · ' + f.price + ' 灵石</span></div>' +
                    '<div class="text-[11px] text-gray-500">' + f.desc + '</div>' +
                    '<button onclick="window.buyFengshuiItem(\'' + id + '\'); window.openFengshuiUI();" class="mt-1 bg-amber-700 hover:bg-amber-600 text-white text-xs px-2 py-1 rounded">置办</button></div>';
            }).join('') + '</div>'
            : '<p class="text-xs text-gray-500 mt-3">五行法器已置办齐全。</p>';

        var html = '<div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" id="fengshui-modal">' +
            '<div class="bg-gray-800 border-2 border-amber-600 rounded-xl p-5 max-w-lg w-full max-h-[85vh] overflow-y-auto">' +
            '<h2 class="text-xl font-bold text-amber-400 mb-1">🧭 风水布置 · 静室八方位</h2>' +
            '<p class="text-xs text-gray-400 mb-2">同气吉位 +6%，位生物器 +3%，相冲煞位 -4% 且每日有几率反噬气机。当前风水：<span class="' + (mul > 1 ? 'text-green-400' : mul < 1 ? 'text-red-400' : 'text-gray-300') + '">修炼 ×' + mul.toFixed(2) + '</span>' + (sha > 0 ? '<span class="text-red-400">（煞位 ' + sha + ' 处，小心反噬）</span>' : '') + '</p>' +
            '<div class="grid grid-cols-3 gap-2">' + cells + '</div>' +
            '<h3 class="text-sm font-bold text-amber-300 mt-4">🏪 法器铺子</h3>' + shopHtml +
            '<button onclick="document.getElementById(\'fengshui-modal\').remove()" class="mt-4 w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 rounded">关闭</button>' +
            '</div></div>';
        document.body.insertAdjacentHTML('beforeend', html);
    }

    // ==================== 每日反噬：煞位不是白摆的 ====================
    function fengshuiDailyTick() {
        try {
            var h = _house();
            if (!h || !h.type || h.type === 'ruin') return;
            var sha = _countSha();
            if (sha <= 0) return;
            // 一处煞位每日 15% 反噬，多处叠加、封顶六成
            if (Math.random() >= Math.min(0.6, 0.15 * sha)) return;
            if (typeof window.addQiDeviation === 'function') window.addQiDeviation(3);
            if (window.showMessage) window.showMessage('🧭 夜里静室方位之气互冲（煞位 ' + sha + ' 处），你调息良久才压住翻腾的气机——气机紊乱 +3。挪一挪摆件的方位吧。', 'warning');
        } catch (e) { console.warn('[静默失败] js/extensions/fengshui.js · 每日煞气反噬：这一笔没接住，今日反噬未落账', e && e.message); }
    }
    if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') {
        try { window.timeSystem.onNewDaySubscribe(fengshuiDailyTick); } catch (e) {}
    }

    window.FENGSHUI_POSITIONS = FENGSHUI_POSITIONS;
    window.FENGSHUI_ITEMS = FENGSHUI_ITEMS;
    window.getFengshuiMul = getFengshuiMul;
    window.getFengshuiReport = getFengshuiReport;
    window.getPlaceableItems = getPlaceableItems;
    window.judgeFengshuiPlacement = judgePlacement;
    window.placeFengshui = placeFengshui;
    window.buyFengshuiItem = buyFengshuiItem;
    window.openFengshuiUI = openFengshuiUI;
    window.fengshuiDailyTick = fengshuiDailyTick;
})();
