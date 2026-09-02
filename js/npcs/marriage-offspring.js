// ==================== marriage-offspring.js - v20.0 2.8 玩家婚姻/后代/家族 ====================
// 道侣 bond>=2 可诞育后代，后代继承玩家1门功法/血脉；家族传承
// 依赖：1.4 NPC、1.7 转世（后代继承可联动）、bonds（dao_companion）

(function () {

// 取玩家道侣 bond
function getDaoCompanionBond() {
    var cd = window.currentCharData;
    if (!cd || !cd.bonds) return null;
    for (var k in cd.bonds) {
        if (cd.bonds[k] && cd.bonds[k].type === 'dao_companion') return { id: k, bond: cd.bonds[k] };
    }
    return null;
}

// 诞育后代：道侣 bond>=2，扣灵石，后代继承玩家主功法
function haveChild() {
    var cd = window.currentCharData;
    if (!cd) { if (window.showMessage) window.showMessage('请先创建角色', 'warning'); return false; }
    var dc = getDaoCompanionBond();
    if (!dc) { if (window.showMessage) window.showMessage('你尚无道侣，无从诞育后代。', 'warning'); return false; }
    if ((dc.bond.level || 1) < 2) { if (window.showMessage) window.showMessage('道侣情分未深（需 bond≥2），暂难孕育灵胎。', 'warning'); return false; }
    if (!Array.isArray(cd._children)) cd._children = [];
    if (cd._children.length >= 3) { if (window.showMessage) window.showMessage('子嗣已满（上限3）。', 'info'); return false; }
    var cost = 200;
    if (window.DataManager && window.DataManager.deductSpiritStones && !window.DataManager.deductSpiritStones(cost)) {
        if (window.showMessage) window.showMessage('诞育灵胎需 ' + cost + ' 灵石调养。', 'warning');
        return false;
    }
    // 继承玩家主修功法（F-62 v15.4 藏经阁接线：artInsights 掌握度最高的 art_xx）
    var skills = window.currentSkills || {};
    var inheritSkill = null;
    for (var s in skills) { if (skills[s]) { inheritSkill = { id: skills[s].id, name: skills[s].name }; break; } }
    // F-62 v15.4 藏经阁：玩家没装备通用功法时，从 artInsights 找掌握度最高的 art_xx 跨门派反查
    if (!inheritSkill) {
        var ds = window.discipleState;
        if (ds && ds.artInsights) {
            var best = null;
            for (var aid in ds.artInsights) {
                var rec = ds.artInsights[aid];
                if (!rec || !(rec.m > 0)) continue;
                if (!best || rec.m > best.m) best = { id: aid, m: rec.m };
            }
            if (best) {
                var allArts = window.SECT_SPECIFIC_ARTS;
                if (allArts) {
                    for (var sn in allArts) {
                        var arr = allArts[sn];
                        if (!Array.isArray(arr)) continue;
                        for (var i = 0; i < arr.length; i++) {
                            if (arr[i].id === best.id) {
                                inheritSkill = { id: arr[i].id, name: arr[i].name };
                                break;
                            }
                        }
                        if (inheritSkill) break;
                    }
                }
            }
        }
    }
    // 后代名（取父母名各一字 + 灵）
    var npc = window.npcManager && window.npcManager.getNPC(dc.id);
    var childName = (cd.name || '无').charAt(0) + ((npc && npc.name) || '侣').charAt(0) + '灵';
    var child = {
        name: childName,
        parentNpcId: dc.id,
        inheritSkill: inheritSkill,
        bornDay: (window.timeSystem && window.timeSystem.getAbsoluteDay) ? window.timeSystem.getAbsoluteDay() : 0,
        grown: false
    };
    cd._children.push(child);
    dc.bond.level = (dc.bond.level || 2) + 1; // 诞育增进道侣情分
    if (window.showMessage) window.showMessage('👶 你与道侣诞下灵胎「' + childName + '」' + (inheritSkill ? '，承你' + inheritSkill.name + '之脉' : '') + '。', 'success');
    return true;
}

// 后代成年（出生 N 天后 grown=true，可参与世界）
function checkChildrenGrown() {
    try {
        var cd = window.currentCharData;
        if (!cd || !cd._children || !cd._children.length) return;
        var day = (window.timeSystem && window.timeSystem.getAbsoluteDay) ? window.timeSystem.getAbsoluteDay() : 0;
        for (var i = 0; i < cd._children.length; i++) {
            var c = cd._children[i];
            if (!c.grown && (day - (c.bornDay || 0)) >= 360) {
                c.grown = true;
                if (window.gameLog && window.gameLog.add) window.gameLog.add('子嗣「' + c.name + '」已长成。', 'info');
            }
        }
    } catch (e) {}
}

if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') {
    window.timeSystem.onNewDaySubscribe(checkChildrenGrown);
}

window.haveChild = haveChild;
window.getDaoCompanionBond = getDaoCompanionBond;

})();
