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
        // 第十二波 · 流派不碰字：按掌握度从高到低逐本看——武功书按「类型字段」定流派
        //（剑/刀法→剑修，拳掌/炼体/长兵→体修，内功/法术→法修），轻功/奇门/医术/符箓跳过不驱动流派。
        // 旧口径按功法名碰字：「百炼铸剑录」碰个剑字成剑修、「药王丹经」碰个经字成法修——非武之书白嫖战斗流派，此弊一并根除。
        var ds = window.discipleState;
        if (ds && ds.artInsights) {
            var list = [];
            for (var aid in ds.artInsights) {
                var rec = ds.artInsights[aid];
                if (rec && rec.m > 0) list.push({ id: aid, m: rec.m });
            }
            list.sort(function (a, b) { return b.m - a.m; });
            var TYPE_SCHOOL = { '剑法': 'sword', '刀法': 'sword', '拳掌': 'body', '炼体': 'body', '长兵': 'body', '内功': 'caster', '法术': 'caster' };
            var allArts = window.SECT_SPECIFIC_ARTS;
            for (var li = 0; li < list.length; li++) {
                var artObj = null;
                var artName = list[li].id;
                if (allArts) {
                    for (var sectName in allArts) {
                        var arts = allArts[sectName];
                        if (!Array.isArray(arts)) continue;
                        for (var i = 0; i < arts.length; i++) {
                            if (arts[i].id === list[li].id) { artObj = arts[i]; break; }
                        }
                        if (artObj) break;
                    }
                }
                if (artObj) {
                    if (artObj.type && TYPE_SCHOOL[artObj.type]) return TYPE_SCHOOL[artObj.type];
                    if (artObj.type) continue; // 轻功/奇门/医术/符箓：非武之书，看下一本
                    artName = artObj.name;
                }
                // 无类型字段的旧书，照名字老规矩兜底
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
