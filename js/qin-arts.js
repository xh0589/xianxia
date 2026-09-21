// ==================== qin-arts.js — 音律琴心（v20.90） ====================
// 「音律」生活技能的两本账：
//   1) 兵册：主手持琴类兵器（subtype 'qin'）时，音律折进攻击/命中（getCombatBonuses 接线）
//   2) 艺册：勾栏瓦舍登台卖艺，打赏多少、长进快慢全看音律与手中琴的品相
// 依赖：getLifeSkill(global-utils) / getEquippedItem(equipment) / itemById——调用时取，加载序不挑
(function (global) {
    'use strict';

    // v20.91 九品制品相梯：九品最涩、一品最灵；「特殊」信物琴（若有）压轴。旧品质串折算兼容。
    var QUALITY_TIER = { PIN9: 1, PIN8: 2, PIN7: 3, PIN6: 4, PIN5: 5, PIN4: 6, PIN3: 7, PIN2: 8, PIN1: 9, UNIQUE: 10,
                         COMMON: 1, UNCOMMON: 2, RARE: 3, EPIC: 5, LEGENDARY: 7, MYTHIC: 9 };

    /** 音律等级（0~100），读不到系统就按 0 */
    function level() {
        return (typeof global.getLifeSkill === 'function') ? (global.getLifeSkill('音律') || 0) : 0;
    }

    /** 主手是不是琴：是则给 {item, tpl, quality, tier}，不是给 null */
    function equippedQin() {
        var mh = (typeof global.getEquippedItem === 'function' && global.getEquippedItem('mainHand'))
            || (global.currentEquipment && global.currentEquipment.mainHand) || null;
        if (!mh) return null;
        var tpl = global.itemById ? global.itemById[mh.templateId || mh.id] : null;
        var t = mh.subtype || mh.weaponType || (tpl && (tpl.subtype || tpl.weaponType)) || '';
        if (t !== 'qin') return null;
        var q = mh.quality || (tpl && tpl.quality) || 'PIN9';
        return { item: mh, tpl: tpl, quality: q, tier: QUALITY_TIER[q] || 1 };
    }

    /** 兵册：琴在手 + 音律在心，攻击命中一起涨；空手或持别家伙不给一文 */
    function combatBonus() {
        var qin = equippedQin();
        if (!qin) return {};
        var lv = level();
        return {
            attack: Math.round(lv * 0.6) + qin.tier,
            hit: Math.round(lv * 0.2)
        };
    }

    /** 艺册底分：清唱也有几分薄赏，带琴才把音律全数唱活 */
    function performanceScore() {
        var lv = level();
        var base = 10 + lv * 2;
        var qin = equippedQin();
        if (qin) base += lv * qin.tier;
        return Math.round(base);
    }

    var api = {
        level: level,
        equippedQin: equippedQin,
        combatBonus: combatBonus,
        performanceScore: performanceScore,
        QUALITY_TIER: QUALITY_TIER
    };
    global.QinArts = api;
    global.window && (global.window.QinArts = api);
})(typeof window !== 'undefined' ? window : this);
