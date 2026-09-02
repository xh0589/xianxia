// ==================== build-school.js - v20.0 2.5 剑/体/法修 build 分化 ====================
// 主功法判定流派→流派被动（剑修连击/体修反震/法修元素），与 1.2 招式配合
// 派生自主功法名，不入存档。依赖：1.2 招式、currentSkills

(function () {

// 判定流派：剑修（剑/刀）/体修（掌/拳/体）/法修（诀/功/法/印）
function getBuildSchool() {
    try {
        var skills = window.currentSkills || {};
        var main = skills.main || skills.neigong || skills.inner;
        if (!main) return 'none';
        var name = String(main.name || '');
        if (/(剑|刀|锋)/.test(name)) return 'sword';
        if (/(掌|拳|体|骨|皮)/.test(name)) return 'body';
        if (/(诀|功|法|印|经)/.test(name)) return 'caster';
        return 'none';
    } catch (e) { return 'none'; }
}

// 流派被动 buff（供 buildPlayerBattleEntity 读取）
function getSchoolBonus() {
    var s = getBuildSchool();
    if (s === 'sword') return { crit: 10, counter: 10, label: '剑修·连击灵动' };
    if (s === 'body') return { defenseMul: 0.15, counter: 15, label: '体修·反震硬抗' };
    if (s === 'caster') return { attackMul: 0.10, label: '法修·元素凌厉' };
    return null;
}

window.getBuildSchool = getBuildSchool;
window.getSchoolBonus = getSchoolBonus;

})();
