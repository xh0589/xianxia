// ==================== craft-custom-pill.js - v20.0 2.12 自创丹方 ====================
// 消耗材料+灵石自创丹方，按材料毒性/品质映射效果，记 _customPills 图鉴
// 依赖：1.9 丹毒（毒性映射效果）、inventory、DataManager
// v20.41 做深：不再抓背包第一个材料——列出全部材料由玩家选，
// 每味材的毒性与成丹去向都摆在面板上（账不藏）。

(function () {

// 列出背包全部材料
function _listMats() {
    var out = [];
    try {
        var slots = window.inventory && window.inventory.slots;
        if (!slots) return out;
        for (var i = 0; i < slots.length; i++) {
            var sl = slots[i];
            if (sl && sl.templateId && window.itemById && window.itemById[sl.templateId] &&
                window.itemById[sl.templateId].type === 'material') {
                out.push({ uid: sl.uid, templateId: sl.templateId, name: window.itemById[sl.templateId].name, count: sl.count || 1 });
            }
        }
    } catch (e) {}
    return out;
}

// 按材料毒性映射效果（毒性越高材料越烈→效果越强但更易丹毒）
function _applyPillResult(mat) {
    var cd = window.currentCharData;
    var tox = (typeof window.getPillToxicity === 'function') ? window.getPillToxicity(mat.templateId) : 5;
    var effect, pillName;
    if (tox >= 35) { // 传奇材料
        cd._customPillBuff = { allAttr: 10, days: 1 };
        effect = '全属性+10（1日）'; pillName = '混沌归元丹';
    } else if (tox >= 20) { // 珍品材料
        cd._customPillBuff = { attack: 5, days: 1 };
        effect = '攻击+5（1日）'; pillName = '锋锐凝元丹';
    } else if (tox >= 10) { // 良品材料
        cd.luck = Math.min(100, (cd.luck || 50) + 3);
        effect = '气运+3'; pillName = '机缘感应丹';
    } else { // 凡品材料
        cd.essence = (cd.essence || 0) + 30;
        effect = '真元+30'; pillName = '聚气培元丹';
    }
    // 丹毒+（自创丹方更易丹毒，体现实验性）
    if (typeof window.addPillPoison === 'function') window.addPillPoison(mat.templateId, 1);
    if (!Array.isArray(cd._customPills)) cd._customPills = [];
    if (cd._customPills.indexOf(pillName) < 0) cd._customPills.push(pillName);
    if (window.showMessage) window.showMessage('⚗️ 你以' + mat.name + '自创「' + pillName + '」！' + effect + '。', 'success');
    if (window.updateCharacterStatus) window.updateCharacterStatus();
    return pillName;
}

// v20.41 选料面板：把每味材的毒性与成丹去向摆出来，任选一味
function openPillMaterialPicker() {
    var cd = window.currentCharData;
    if (!cd) { if (window.showMessage) window.showMessage('请先创建角色', 'warning'); return false; }
    var mats = _listMats();
    if (!mats.length) { if (window.showMessage) window.showMessage('背包无材料可供炼制。', 'warning'); return false; }
    if (typeof window.showModal !== 'function') {
        return craftCustomPillWith(mats[0].uid); // 无弹窗兜底：第一味
    }
    var btn = 'class="bg-lime-800 hover:bg-lime-700 text-lime-100 text-xs px-3 py-2 rounded text-left w-full"';
    var rows = mats.map(function (m) {
        var tox = (typeof window.getPillToxicity === 'function') ? window.getPillToxicity(m.templateId) : 5;
        var grade = tox >= 35 ? '烈·混沌归元' : (tox >= 20 ? '珍·锋锐凝元' : (tox >= 10 ? '良·机缘感应' : '凡·聚气培元'));
        return '<button onclick="window.craftCustomPillWith(\'' + m.uid + '\'); this.closest(\'#xianxia-modal-overlay\').remove();" ' + btn + '>'
            + '🌿 ' + m.name + ' ×' + m.count
            + '<span class="text-lime-300/70 ml-2">毒性' + tox + ' → ' + grade + '</span></button>';
    }).join('');
    window.showModal('⚗️ 自创丹方 · 选一味材料',
        '<p class="text-xs text-gray-400 mb-3">耗材料 1 份 + 灵石 50。材性越烈，成丹越猛，丹毒也越重——账都摆在面上。</p>'
        + '<div style="display:flex;flex-direction:column;gap:8px">' + rows + '</div>');
    return true;
}

// 指定材料炼制（选料面板与旧入口共用）
function craftCustomPillWith(uid) {
    var cd = window.currentCharData;
    if (!cd) { if (window.showMessage) window.showMessage('请先创建角色', 'warning'); return false; }
    var mat = null;
    var list = _listMats();
    for (var i = 0; i < list.length; i++) if (String(list[i].uid) === String(uid)) { mat = list[i]; break; }
    if (!mat) { if (window.showMessage) window.showMessage('所选材料已不在背包。', 'warning'); return false; }
    var cost = 50;
    if (window.DataManager && window.DataManager.deductSpiritStones && !window.DataManager.deductSpiritStones(cost)) {
        if (window.showMessage) window.showMessage('自创丹方需 ' + cost + ' 灵石。', 'warning'); return false;
    }
    if (typeof window.removeItem === 'function') window.removeItem(mat.uid, 1);
    _applyPillResult(mat);
    return true;
}

// 自创丹方：旧入口保留——有面板开选料，无面板用第一味
function craftCustomPill() {
    if (typeof window.showModal === 'function') return openPillMaterialPicker();
    var mats = _listMats();
    if (!mats.length) { if (window.showMessage) window.showMessage('背包无材料可供炼制。', 'warning'); return false; }
    return craftCustomPillWith(mats[0].uid);
}

// 每日清除临时自创丹方 buff（days=1 即当日有效）
function _clearCustomPillBuff() {
    try {
        var cd = window.currentCharData;
        if (!cd || !cd._customPillBuff) return;
        cd._customPillBuff.days = (cd._customPillBuff.days || 1) - 1;
        if (cd._customPillBuff.days <= 0) delete cd._customPillBuff;
    } catch (e) {}
}
if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') {
    window.timeSystem.onNewDaySubscribe(_clearCustomPillBuff);
}

window.craftCustomPill = craftCustomPill;
window.craftCustomPillWith = craftCustomPillWith;
window.openPillMaterialPicker = openPillMaterialPicker;

})();
