// ==================== build-school.js - v20.0 2.5 剑/体/法修 build 分化 ====================
// 主功法判定流派→流派被动（剑修连击/体修反震/法修元素），与 1.2 招式配合
// 派生自主功法名，不入存档。依赖：1.2 招式、currentSkills

(function () {

// 判定流派：剑修（剑/刀）/体修（掌/拳/体）/法修（诀/功/法/印）
// F-52 v15.4 藏经阁接线：优先用 artInsights 掌握度最高的功法（v15.4 sectLibStudy 涨掌握度）
// fallback 到 currentSkills.main（v9.x equipSkill 装备）— 旧玩家兼容
function getBuildSchool() {
    try {
        // v15.4 藏经阁：artInsights 里找掌握度最高的功法
        var ds = window.discipleState;
        if (ds && ds.artInsights) {
            var best = null;
            for (var aid in ds.artInsights) {
                var rec = ds.artInsights[aid];
                if (!rec || !(rec.m > 0)) continue;
                if (!best || rec.m > best.m) best = { id: aid, m: rec.m };
            }
            if (best) {
                // artId → SECT_SPECIFIC_ARTS 反查名称
                var arts = (window.SECT_SPECIFIC_ARTS && ds.sectId) ? window.SECT_SPECIFIC_ARTS[ds.sectId] : null;
                var artName = best.id;
                if (arts) {
                    for (var i = 0; i < arts.length; i++) {
                        if (arts[i].id === best.id) { artName = arts[i].name; break; }
                    }
                }
                if (/(剑|刀|锋)/.test(artName)) return 'sword';
                if (/(掌|拳|体|骨|皮)/.test(artName)) return 'body';
                if (/(诀|功|法|印|经)/.test(artName)) return 'caster';
            }
        }
        // v9.x fallback：currentSkills.main
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
