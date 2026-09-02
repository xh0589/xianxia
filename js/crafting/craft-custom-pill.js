// ==================== craft-custom-pill.js - v20.0 2.12 自创丹方 ====================
// 消耗材料+灵石自创丹方，按材料毒性/品质映射效果，记 _customPills 图鉴
// 依赖：1.9 丹毒（毒性映射效果）、inventory、DataManager

(function () {

// 找背包第一个材料
function _findMat() {
    try {
        var slots = window.inventory && window.inventory.slots;
        if (!slots) return null;
        for (var i = 0; i < slots.length; i++) {
            var sl = slots[i];
            if (sl && sl.templateId && window.itemById && window.itemById[sl.templateId] &&
                window.itemById[sl.templateId].type === 'material') {
                return { uid: sl.uid, templateId: sl.templateId, name: window.itemById[sl.templateId].name };
            }
        }
    } catch (e) {}
    return null;
}

// 自创丹方：消耗1材料+50灵石，按材料毒性映射效果，立即生效，记丹方
function craftCustomPill() {
    var cd = window.currentCharData;
    if (!cd) { if (window.showMessage) window.showMessage('请先创建角色', 'warning'); return false; }
    var mat = _findMat();
    if (!mat) { if (window.showMessage) window.showMessage('背包无材料可供炼制。', 'warning'); return false; }
    var cost = 50;
    if (window.DataManager && window.DataManager.deductSpiritStones && !window.DataManager.deductSpiritStones(cost)) {
        if (window.showMessage) window.showMessage('自创丹方需 ' + cost + ' 灵石。', 'warning');
        return false;
    }
    // 扣材料
    if (typeof window.removeItem === 'function') window.removeItem(mat.uid, 1);
    // 按材料毒性映射效果（毒性越高材料越烈→效果越强但更易丹毒）
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
    return true;
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

})();
