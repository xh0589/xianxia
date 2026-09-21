// ==================== combat-stats.js - v9.8 动态战斗属性统一计算 ====================
// 面板与战斗必须共用本文件，禁止再读 combatStats.default

(function () {
    'use strict';

    function _clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    function _getCombatBonuses() {
        try {
            if (typeof window.getCombatBonuses === 'function') {
                return window.getCombatBonuses({}) || {};
            }
        } catch (e) {}
        return {};
    }

    function _getWeaponSkill(entity) {
        if (entity && entity.type === 'player' && typeof window.getPlayerWeaponSkill === 'function') {
            return window.getPlayerWeaponSkill() || 0;
        }
        if (entity && entity.skills) {
            var best = 0;
            for (var sk in entity.skills) {
                if (entity.skills.hasOwnProperty(sk) && entity.skills[sk] > best) best = entity.skills[sk];
            }
            return best;
        }
        return 0;
    }

    function _getSkill(entity, name) {
        if (!entity || !entity.skills) return 0;
        return entity.skills[name] || 0;
    }

    function _getAttrs(entity) {
        if (entity && typeof entity.getEffectiveAttrs === 'function') {
            return entity.getEffectiveAttrs();
        }
        if (entity && entity.attrs) return entity.attrs;
        return { strength: 10, dexterity: 10, intelligence: 10, willpower: 10, constitution: 10, meridian: 10 };
    }

    function _meridianMul(meridian) {
        meridian = meridian || 10;
        return 1 + meridian / 500;
    }

    /**
     * 统一派生战斗属性（面板 + 战斗唯一数据源）
     * @param {object} entity Entity 或 null（玩家面板时用 currentCharData 构造伪实体）
     * @param {object} [opts]
     */
    function getDerivedCombatStats(entity, opts) {
        opts = opts || {};
        var isPlayer = entity && entity.type === 'player';

        // 无 entity 时从角色数据构造面板用快照
        if (!entity && typeof window.getCurrentCharData === 'function') {
            var cd = window.getCurrentCharData();
            if (cd) {
                if (typeof window.syncCharAttrsFromMain === 'function') window.syncCharAttrsFromMain(cd);
                entity = {
                    type: 'player',
                    attrs: cd.attrs || {},
                    skills: cd.combatSkills || {},
                    toughness: null
                };
                isPlayer = true;
            }
        }
        if (!entity) {
            return _emptyStats();
        }

        var eff = _getAttrs(entity);
        var str = eff.strength || 10;
        var dex = eff.dexterity || 10;
        var intel = eff.intelligence || 10;
        var will = eff.willpower || 10;
        var con = eff.constitution || 10;
        var mer = eff.meridian || 10;

        var neigong = _getSkill(entity, '内功');
        var qinggong = _getSkill(entity, '轻功');
        var jueji = _getSkill(entity, '绝技');
        var weaponSkill = _getWeaponSkill(entity);
        var cb = isPlayer ? _getCombatBonuses() : {};

        // v20.81（BUG-L）：旧公式完全没有境界项——突破后攻防速一丝不变，"境界"沦为面板装饰。
        // 这里给玩家补境界派生加成（纯派生计算，不写存档；面板与战斗同走这个入口，突破即生效）。
        var realmAtk = 0, realmDef = 0, realmSpd = 0, realmTgh = 0;
        if (isPlayer) {
            var _REALM_ORDER = ['炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'];
            var _rcd = (typeof window.getCurrentCharData === 'function') ? window.getCurrentCharData() : window.currentCharData;
            var _ri = _rcd ? _REALM_ORDER.indexOf(_rcd.realm) : -1;
            if (_ri >= 0) {
                var _ly = Math.max(1, Math.min(9, Number(_rcd.layer) || 1));
                realmAtk = _ri * 4 + _ly;
                realmDef = _ri * 3 + Math.ceil(_ly / 2);
                realmSpd = _ri * 2 + Math.floor(_ly / 3);
                realmTgh = _ri * 2;
            }
        }

        // —— 攻击 ——
        var meridianMul = _meridianMul(mer);
        var attack = Math.floor(str * 1.0 + neigong * 0.1 * meridianMul);
        if (isPlayer) {
            var wsb = weaponSkill * 0.15;
            if (weaponSkill === 0 && window.currentEquipment && window.currentEquipment.mainHand) wsb = -5;
            attack += Math.floor(wsb);
            if (cb.attack) attack += cb.attack;
            attack += realmAtk;
        } else if (entity.skills) {
            // 非玩家：已在 getAttack 用最高技能；此处与力量对齐
            attack = Math.floor(str * 1.0 + weaponSkill * 0.12);
        }

        // —— 防御 ——
        var defense = Math.floor(con * 0.4 + will * 0.2);
        if (cb.defense) defense += cb.defense;
        defense += realmDef;

        // —— 速度（负荷修正在批次四接入，此处预留 loadMul） ——
        var loadMul = (opts.loadSpeedMul != null) ? opts.loadSpeedMul : 1;
        var speed = Math.floor((dex * 0.7 + qinggong * 0.1 + (cb.speed || 0)) * loadMul) + realmSpd;

        // —— 韧性 ——
        var toughness = entity.toughness != null ? entity.toughness : con * 0.3;
        if (cb.toughness) toughness += cb.toughness;
        toughness += realmTgh;

        // —— 毒抗 ——
        var poisonRes = _clamp(con * 0.15 + (cb.poisonRes || 0), 0, 50);

        // —— 命中 ——
        var hit = 85 + (dex - 10) * 0.3 + weaponSkill * 0.1 + (cb.hit || 0);
        hit = _clamp(hit, 5, 95);

        // —— 闪避（上限 35%）——
        var dodge = 10 + speed * 0.15 + qinggong * 0.03 + (cb.dodge || 0);
        if (opts.loadDodgeBonus) dodge += opts.loadDodgeBonus;
        dodge = _clamp(dodge, 1, 35);

        // —— 格挡（有条件；无条件时仍算理论值供面板，canBlock 标记）——
        var canBlock = _canBlock(entity, isPlayer);
        var block = 5 + speed * 0.05 + str * 0.1 + weaponSkill * 0.05 + (cb.block || 0);
        if (isPlayer && window.currentEquipment && window.currentEquipment.offHand) {
            var off = window.currentEquipment.offHand;
            var tpl = window.itemById ? window.itemById[off.templateId || off.id] : null;
            if (tpl && tpl.weaponType === 'shield') {
                block += 15 + (off.defense || tpl.defense || 0) * 0.5;
                canBlock = true;
            }
        }
        if (opts.loadBlockBonus) block += opts.loadBlockBonus;
        block = canBlock ? _clamp(block, 0, 45) : 0;

        var blockReduction = _clamp(0.5 + toughness * 0.005, 0.5, 0.7);

        // —— 化解 ——
        var parry = 10 + speed * 0.05 + intel * 0.08 + neigong * 0.03 + (cb.parry || 0);
        parry = _clamp(parry, 1, 35);

        // —— 暴击 / 倍率 ——
        var crit = 5 + weaponSkill * 0.03 + (cb.crit || 0) - toughness * 0.1;
        crit = _clamp(crit, 1, 30);
        var critDmg = 150 + jueji * 0.2 + (cb.critDmg || cb.crit_damage || 0);
        critDmg = _clamp(critDmg, 150, 220);

        // —— 反击 / 破甲 ——
        var counter = _clamp(weaponSkill * 0.02 + (cb.counter || 0), 0, 20);
        var penetrate = _clamp(cb.penetrate || 0, 0, 40);

        // —— 精确部位惩罚减免（神识）——
        var precisePenalty = 20 - Math.min(10, intel * 0.1);

        // —— 真气（经脉）——
        var qiBonus = Math.floor(mer * 1.5);
        var qiRegenMul = 1 + mer / 200;

        return {
            attack: attack,
            defense: defense,
            speed: speed,
            hit: Math.round(hit * 10) / 10,
            dodge: Math.round(dodge * 10) / 10,
            block: Math.round(block * 10) / 10,
            blockReduction: blockReduction,
            canBlock: canBlock,
            parry: Math.round(parry * 10) / 10,
            crit: Math.round(crit * 10) / 10,
            critDmg: Math.round(critDmg * 10) / 10,
            counter: Math.round(counter * 10) / 10,
            penetrate: Math.round(penetrate * 10) / 10,
            toughness: Math.round(toughness * 10) / 10,
            poisonRes: Math.round(poisonRes * 10) / 10,
            precisePenalty: Math.round(precisePenalty * 10) / 10,
            qiBonus: qiBonus,
            qiRegenMul: Math.round(qiRegenMul * 100) / 100,
            meridianMul: Math.round(meridianMul * 1000) / 1000,
            weaponSkill: weaponSkill
        };
    }

    function _canBlock(entity, isPlayer) {
        if (!isPlayer) return true; // 敌人简化：允许格挡
        if (window.currentEquipment) {
            if (window.currentEquipment.offHand) {
                var off = window.currentEquipment.offHand;
                var t = window.itemById ? window.itemById[off.templateId || off.id] : null;
                if (t && t.weaponType === 'shield') return true;
            }
            if (window.currentEquipment.mainHand) {
                var mh = window.currentEquipment.mainHand;
                var mt = window.itemById ? window.itemById[mh.templateId || mh.id] : null;
                // 近战武器默认可格挡（弓弩除外）
                if (mt) {
                    var wt = mt.weaponType || mt.subtype || '';
                    if (wt !== 'bow' && wt !== 'crossbow') return true;
                } else {
                    return true;
                }
            }
        }
        // 拳掌 ≥ 20 可空手格挡
        var fist = _getSkill(entity, '拳掌');
        if (fist >= 20) return true;
        return false;
    }

    function _emptyStats() {
        return {
            attack: 10, defense: 6, speed: 7,
            hit: 85, dodge: 10, block: 0, blockReduction: 0.5, canBlock: false,
            parry: 10, crit: 5, critDmg: 150, counter: 0, penetrate: 0,
            toughness: 3, poisonRes: 1.5, precisePenalty: 19,
            qiBonus: 15, qiRegenMul: 1.05, meridianMul: 1.02, weaponSkill: 0
        };
    }

    /** 面板展示用列表（替代 combatStats.default） */
    function getCombatStatsForPanel(entity) {
        var s = getDerivedCombatStats(entity);
        return [
            { id: 'attack', name: '攻击', icon: '⚔️', value: s.attack, suffix: '' },
            { id: 'defense', name: '防御', icon: '🛡️', value: s.defense, suffix: '' },
            { id: 'speed', name: '速度', icon: '💨', value: s.speed, suffix: '' },
            { id: 'hit', name: '命中', icon: '🎯', value: s.hit, suffix: '%' },
            { id: 'dodge', name: '闪避', icon: '💨', value: s.dodge, suffix: '%' },
            { id: 'block', name: '格挡', icon: '🛡️', value: s.block, suffix: '%', note: s.canBlock ? '' : '（当前不可格挡）' },
            { id: 'parry', name: '化解', icon: '🌀', value: s.parry, suffix: '%' },
            { id: 'crit', name: '暴击', icon: '⚡', value: s.crit, suffix: '%' },
            { id: 'critDmg', name: '暴击倍率', icon: '💥', value: s.critDmg, suffix: '%' },
            { id: 'counter', name: '反击', icon: '↩️', value: s.counter, suffix: '%' },
            { id: 'penetrate', name: '破甲', icon: '🔨', value: s.penetrate, suffix: '%' },
            { id: 'toughness', name: '韧性', icon: '💪', value: s.toughness, suffix: '' },
            { id: 'poisonRes', name: '毒抗', icon: '🧪', value: s.poisonRes, suffix: '%' }
        ];
    }

    // ========== v9.8 装备负荷 ==========
    var SLOT_DEFAULT_WEIGHT = {
        head: 2, neck: 0.5, body: 8, waist: 1,
        hands: 2, handL: 1, handR: 1, feet: 2,
        mainHand: 4, offHand: 3, ring: 0.1, accessory: 0.5,
        armor: 8, weapon: 4
    };

    function getItemWeight(item) {
        if (!item) return 0;
        if (item.weight != null) return Number(item.weight) || 0;
        var tpl = window.itemById ? window.itemById[item.templateId || item.id] : null;
        if (tpl && tpl.weight != null) return Number(tpl.weight) || 0;
        var slot = item.slot || (tpl && tpl.slot) || '';
        if (SLOT_DEFAULT_WEIGHT[slot] != null) return SLOT_DEFAULT_WEIGHT[slot];
        return 2;
    }

    function getLoadCapacity(charData) {
        charData = charData || (typeof window.getCurrentCharData === 'function' ? window.getCurrentCharData() : window.currentCharData);
        if (!charData) return 20;
        if (typeof window.syncCharAttrsFromMain === 'function') window.syncCharAttrsFromMain(charData);
        var str = (charData.attrs && charData.attrs.strength) || (charData.mainAttributes && charData.mainAttributes['力量']) || 10;
        var con = (charData.attrs && charData.attrs.constitution) || (charData.mainAttributes && charData.mainAttributes['体质']) || 10;
        return 20 + str * 1.2 + con * 0.3;
    }

    function getCurrentLoad() {
        var total = 0;
        if (!window.currentEquipment) return 0;
        Object.keys(window.currentEquipment).forEach(function(slot) {
            var item = window.currentEquipment[slot];
            if (!item) return;
            // 若物品无 weight，按槽位默认
            var w = getItemWeight(item);
            if (w === 2 && !item.weight) {
                var tpl = window.itemById ? window.itemById[item.templateId || item.id] : null;
                if (!tpl || tpl.weight == null) {
                    w = SLOT_DEFAULT_WEIGHT[slot] != null ? SLOT_DEFAULT_WEIGHT[slot] : 2;
                }
            }
            total += w;
        });
        return Math.round(total * 10) / 10;
    }

    function getLoadInfo(charData) {
        var cap = getLoadCapacity(charData);
        var cur = getCurrentLoad();
        var rate = cap > 0 ? (cur / cap) * 100 : 100;
        var tier = '轻装';
        var icon = '🚶';
        var loadSpeedMul = 1;
        var loadDodgeBonus = 0;
        var loadBlockBonus = 0;
        var staminaMul = 1;
        var overloaded = false;
        if (rate > 100) {
            tier = '超载'; icon = '⚠️'; loadSpeedMul = 0.7; loadDodgeBonus = -12; overloaded = true;
        } else if (rate > 80) {
            tier = '重装'; icon = '🛡️'; loadSpeedMul = 0.85; loadDodgeBonus = -7; loadBlockBonus = 4; staminaMul = 0.8;
        } else if (rate > 55) {
            tier = '中装'; icon = '🏋️'; loadSpeedMul = 0.94; loadDodgeBonus = -3; loadBlockBonus = 2;
        } else if (rate > 30) {
            tier = '轻装'; icon = '🚶';
        } else {
            tier = '简装'; icon = '🏃'; loadSpeedMul = 1.05; loadDodgeBonus = 2;
        }
        return {
            capacity: Math.round(cap * 10) / 10,
            current: cur,
            rate: Math.round(rate * 10) / 10,
            tier: tier,
            icon: icon,
            loadSpeedMul: loadSpeedMul,
            loadDodgeBonus: loadDodgeBonus,
            loadBlockBonus: loadBlockBonus,
            staminaMul: staminaMul,
            overloaded: overloaded
        };
    }

    // 包装 getDerivedCombatStats：自动并入负荷修正
    var _rawGetDerived = getDerivedCombatStats;
    getDerivedCombatStats = function(entity, opts) {
        opts = opts || {};
        if (opts.loadSpeedMul == null || opts.loadDodgeBonus == null) {
            try {
                var isP = !entity || entity.type === 'player';
                if (isP) {
                    var li = getLoadInfo();
                    if (opts.loadSpeedMul == null) opts.loadSpeedMul = li.loadSpeedMul;
                    if (opts.loadDodgeBonus == null) opts.loadDodgeBonus = li.loadDodgeBonus;
                    if (opts.loadBlockBonus == null) opts.loadBlockBonus = li.loadBlockBonus;
                }
            } catch (e) {}
        }
        var s = _rawGetDerived(entity, opts);
        try {
            var load = getLoadInfo();
            s.load = load;
        } catch (e2) {
            s.load = null;
        }
        return s;
    };

    window.getDerivedCombatStats = getDerivedCombatStats;
    window.getCombatStatsForPanel = getCombatStatsForPanel;
    window.getLoadInfo = getLoadInfo;
    window.getLoadCapacity = getLoadCapacity;
    window.getCurrentLoad = getCurrentLoad;
    window.getItemWeight = getItemWeight;

    // ============ v21.6 全境界数值实测批：敌人强度接回境界 ============
    // 此前 charData.level 恒为 1（创角写死后无任何正常玩法更新它），主战斗入口
    // `level = charData.level || layer` 永远出 1 级怪——筑基起敌人只打得动 1 点血，
    // 金丹起彻底沦为木桩；胜利奖励也被钉死在 +2 历练 +1 真元，与指数级修为需求差 5-8 个数量级。
    var REALM_TIERS = ['凡人', '炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'];
    function _realmTierOf(realm) {
        try {
            if (typeof window.getRealmTier === 'function') {
                var t = window.getRealmTier(realm);
                if (isFinite(t)) return t;
            }
        } catch (e) {}
        var i = REALM_TIERS.indexOf(realm);
        return i >= 0 ? i : 1;
    }
    // 敌人等级 = 境界连续刻度：炼气1层→1，渡劫9层→65。斜率 7/境（不是 9——渡劫怪六维
    // 若顶到 base=2L+5=167，对满装玩家每击 50+ 太狠；7 落 135，伤害带 20-40 正好）。
    // 境界边界允许 1 级回落（炼气9=9 > 筑基1=8）：刚突破的人碾压上一层，符合体感。
    window.realmScaledEnemyLevel = function (cd) {
        cd = cd || {};
        var tier = _realmTierOf(cd.realm);
        if (tier < 1) tier = 1;
        var layer = Math.max(1, Math.min(9, Number(cd.layer) || 1));
        return Math.max(1, (tier - 1) * 7 + layer);
    };
    // 无六维敌人兜底合成：手造 {level,attack,defense,speed} 的敌人（心魔/势力刺客/部分剧情boss）
    // Entity 只认 attrs——此前它们全部六维=10 进场，写好的等级/攻击全是死字段，boss 皆木桩。
    // 按 generateRandomEnemy 同款曲线合成（base=2L+5），手写 attack/defense/speed 作偏置（钳 0.5~2 倍）。
    window.synthesizeEnemyAttrs = function (data) {
        data = data || {};
        var L = Math.max(1, Number(data.level) || 1);
        var base = L * 2 + 5;
        function bias(v) { v = Number(v); return (isFinite(v) && v > 0) ? Math.min(2, Math.max(0.5, v / base)) : 1; }
        var a = bias(data.attack), d = bias(data.defense), s = bias(data.speed);
        return {
            strength: Math.max(5, Math.floor(base * a)),
            dexterity: Math.max(5, Math.floor(base * s)),
            intelligence: Math.max(5, base),
            willpower: Math.max(5, Math.floor(base * d * 0.8)),
            constitution: Math.max(5, Math.floor(base * d * 1.2)),
            meridian: Math.max(5, base)
        };
    };
    // 敌人血肉随等级长：10 级以下不动（新手节奏不变），10 级以上每级 +12% 血量与部位耐久——
    // 高境界玩家攻击四五百，此前敌人血肉恒 100，一刀一个没有战斗可言。
    window.scaleEnemyEntityToLevel = function (entity, data) {
        try {
            if (!entity || (data && data.physiology)) return entity; // 调用方自带生理账的不越权
            var L = Math.max(1, Number(entity.level) || 1);
            var mul = 1 + Math.max(0, L - 10) * 0.12;
            if (mul <= 1) return entity;
            if (entity.physiology) {
                entity.physiology.bloodVolume = Math.round((entity.physiology.bloodVolume || 100) * mul);
                entity.physiology.health = entity.physiology.bloodVolume;
            }
            if (entity.durabilities) {
                Object.keys(entity.durabilities).forEach(function (p) {
                    entity.durabilities[p] = Math.round(entity.durabilities[p] * mul);
                });
                entity.maxDurabilities = Object.assign({}, entity.durabilities);
            }
            return entity;
        } catch (e) { return entity; }
    };

    console.log('[combat-stats] 动态战斗属性+负荷模块已加载');
})();
