/**
 * beast-taming.js - 灵兽系统 v7.1 P0-3
 * 捕捉（地点限制）/ 培养 / 出战 / 骑乘 / 进化
 */

var BEAST_TEMPLATES = {
    wind_wolf: {
        name: '风狼', type: 'beast', level: 10, realm: '炼气',
        attrs: { strength: 8, dexterity: 15, constitution: 6, willpower: 5, intelligence: 4, meridian: 3 },
        skills: ['风刃', '急速'],
        evolve: { to: 'wind_wolf_king', level: 30, item: 'mat_wind_essence' },
        mount: { speed: 1.5 },
                innate: ["pounce"],
        teachable: ["pounce"],
regions: ['东荒', '中州', 'default']
    },
    flame_tiger: {
        name: '火焰虎', type: 'beast', level: 20, realm: '炼气',
        attrs: { strength: 15, dexterity: 10, constitution: 12, willpower: 6, intelligence: 5, meridian: 4 },
        skills: ['火焰爪', '咆哮'],
        evolve: { to: 'flame_tiger_king', level: 40, item: 'mat_fire_essence' },
        mount: { speed: 1.8 },
                innate: ["burn"],
        teachable: ["burn","lifesteal"],
regions: ['南疆', '西漠', '炎城']
    },
    ice_serpent: {
        name: '冰蛇', type: 'beast', level: 25, realm: '筑基',
        attrs: { strength: 10, dexterity: 18, constitution: 8, willpower: 8, intelligence: 6, meridian: 5 },
        skills: ['冰锥', '冻结'],
        mount: { speed: 1.3 },
                innate: ["chill"],
        teachable: ["chill"],
regions: ['北域', '冰原城', '极寒之地']
    },
    thunder_eagle: {
        name: '雷鹰', type: 'mythical', level: 35, realm: '筑基',
        attrs: { strength: 12, dexterity: 22, constitution: 10, willpower: 10, intelligence: 8, meridian: 8 },
        skills: ['雷击', '俯冲'],
        mount: { speed: 2.5, fly: true },
                innate: ["pounce"],
        teachable: ["pounce"],
regions: ['中州', '太虚山', '剑阁']
    },
    spirit_fox: {
        name: '灵狐', type: 'spirit', level: 15, realm: '炼气',
        attrs: { strength: 5, dexterity: 20, constitution: 5, willpower: 12, intelligence: 14, meridian: 10 },
        skills: ['魅惑', '灵光'],
        mount: { speed: 1.6 },
                innate: [],
        teachable: ["illusion","venom"],
regions: ['东荒', '青木城', '青城山']
    },
    dragon_turtle: {
        name: '龙龟', type: 'mythical', level: 50, realm: '金丹',
        attrs: { strength: 25, dexterity: 5, constitution: 30, willpower: 15, intelligence: 10, meridian: 12 },
        skills: ['龟甲', '水炮'],
        mount: { speed: 0.8, water: true },
                innate: ["hardened"],
        teachable: ["hardened"],
regions: ['东海', '蓬莱仙岛', '洛水城']
    },
    fire_phoenix: {
        name: '火凤', type: 'mythical', level: 60, realm: '金丹',
        attrs: { strength: 22, dexterity: 25, constitution: 18, willpower: 18, intelligence: 16, meridian: 15 },
        skills: ['涅槃之火', '凤鸣'],
        evolve: { to: 'fire_phoenix_adult', level: 80, item: 'mat_phoenix_feather' },
        mount: { speed: 3.0, fly: true },
                innate: ["burn"],
        teachable: ["burn","lifesteal"],
regions: ['南疆', '炎城', '凤凰巢']
    },
    shadow_panther: {
        name: '影豹', type: 'beast', level: 30, realm: '筑基',
        attrs: { strength: 18, dexterity: 25, constitution: 10, willpower: 8, intelligence: 7, meridian: 6 },
        skills: ['暗影突袭', '隐身'],
        mount: { speed: 2.2 },
                innate: ["pounce"],
        teachable: ["pounce","venom"],
regions: ['南疆', '万毒谷', '迷雾森林']
    },
    // 进化形态（不可直接捕捉）
    wind_wolf_king: {
        name: '风狼王', type: 'beast', level: 40, realm: '筑基',
        attrs: { strength: 18, dexterity: 28, constitution: 14, willpower: 12, intelligence: 10, meridian: 10 },
        skills: ['风刃', '急速', '风暴嚎'],
        mount: { speed: 2.0 },
                innate: ["pounce"],
        teachable: ["pounce","lifesteal"],
regions: [], catchable: false
    },
    flame_tiger_king: {
        name: '炎虎王', type: 'beast', level: 50, realm: '金丹',
        attrs: { strength: 30, dexterity: 18, constitution: 22, willpower: 14, intelligence: 12, meridian: 12 },
        skills: ['火焰爪', '咆哮', '焚天'],
        mount: { speed: 2.2 },
                innate: ["burn"],
        teachable: ["burn","lifesteal"],
regions: [], catchable: false
    },
    fire_phoenix_adult: {
        name: '成年火凤', type: 'mythical', level: 90, realm: '元婴',
        attrs: { strength: 35, dexterity: 40, constitution: 28, willpower: 30, intelligence: 28, meridian: 25 },
        skills: ['涅槃之火', '凤鸣', '浴火重生'],
        mount: { speed: 4.0, fly: true },
                innate: ["burn"],
        teachable: ["burn","lifesteal"],
regions: [], catchable: false
    }
};

var tamedBeasts = []; // { templateId, name, level, exp, affection, skills, mount, active? }
var activeBeastIndex = -1;
var activeMountIndex = -1;

// ==================== v17.1 灵兽改良：个体天赋 / 喂食 / 绝技传授 ====================
// 调研落地（修仙品类「资质×技能×羁绊」共识的轻量版）：天赋=个体差异；喂食=灵草换好感经验；
// 传授=玩家已掌握绝技按物种白名单教给灵兽（每兽上限2门）。全部接真实数值链，零平行状态。
const BEAST_TRAITS = [
    { id: 'fierce',    name: '凶猛', attr: 'strength',     mul: 1.12 },
    { id: 'swift',     name: '迅捷', attr: 'dexterity',    mul: 1.12 },
    { id: 'tenacious', name: '坚韧', attr: 'constitution', mul: 1.12 },
    { id: 'wise',      name: '慧根', attr: 'intelligence', mul: 1.12 }
];
function rollBeastTrait() {
    return BEAST_TRAITS[Math.floor(Math.random() * BEAST_TRAITS.length)].id;
}
function ensureBeastTrait(b) { if (!b.trait) b.trait = rollBeastTrait(); return b.trait; }

function exportBeastState() {
    return {
        beasts: JSON.parse(JSON.stringify(tamedBeasts)),
        activeBeastIndex: activeBeastIndex,
        activeMountIndex: activeMountIndex
    };
}

function importBeastState(data) {
    if (!data) {
        tamedBeasts = [];
        activeBeastIndex = -1;
        activeMountIndex = -1;
    } else if (Array.isArray(data)) {
        tamedBeasts = data;
        activeBeastIndex = -1;
        activeMountIndex = -1;
    } else {
        tamedBeasts = Array.isArray(data.beasts) ? data.beasts : [];
        activeBeastIndex = data.activeBeastIndex != null ? data.activeBeastIndex : -1;
        activeMountIndex = data.activeMountIndex != null ? data.activeMountIndex : -1;
    }
    window.tamedBeasts = tamedBeasts;
    window.activeBeastIndex = activeBeastIndex;
    window.activeMountIndex = activeMountIndex;
    try {
        localStorage.setItem('xianxia_beasts', JSON.stringify({
            beasts: tamedBeasts,
            activeBeastIndex: activeBeastIndex,
            activeMountIndex: activeMountIndex
        }));
    } catch (e) {}
}

function initBeastTaming() {
    try {
        var saved = localStorage.getItem('xianxia_beasts');
        if (saved) {
            importBeastState(JSON.parse(saved));
            return;
        }
    } catch (e) {}
    window.tamedBeasts = tamedBeasts;
    window.activeBeastIndex = activeBeastIndex;
    window.activeMountIndex = activeMountIndex;
}

function saveBeastData() {
    try {
        localStorage.setItem('xianxia_beasts', JSON.stringify({
            beasts: tamedBeasts,
            activeBeastIndex: activeBeastIndex,
            activeMountIndex: activeMountIndex
        }));
    } catch (e) {}
    window.tamedBeasts = tamedBeasts;
    window.activeBeastIndex = activeBeastIndex;
    window.activeMountIndex = activeMountIndex;
}

function getCurrentRegionName() {
    if (typeof window.getCurrentRegionForGathering === 'function') {
        try { return window.getCurrentRegionForGathering() || ''; } catch (e) {}
    }
    var loc = window.currentCharData && window.currentCharData.location;
    if (window.locationSystem && window.locationSystem.getCurrentLocation) {
        loc = loc || window.locationSystem.getCurrentLocation();
    }
    if (window.currentLocation) loc = loc || window.currentLocation;
    // 尝试从 mapData 反查区域
    if (loc && window.mapData) {
        for (var region in window.mapData) {
            var cities = window.mapData[region].cities || [];
            if (cities.indexOf(loc) >= 0) return region;
        }
    }
    return loc || 'default';
}

function canCaptureInCurrentLocation(templateId) {
    var t = BEAST_TEMPLATES[templateId];
    if (!t || t.catchable === false) return false;
    if (!t.regions || t.regions.length === 0) return true;
    var region = getCurrentRegionName();
    var loc = (window.currentCharData && window.currentCharData.location) || '';
    for (var i = 0; i < t.regions.length; i++) {
        var r = t.regions[i];
        // B4：default 仅当当前区域无法识别时匹配，避免处处可捕
        if (r === region || (loc && loc.indexOf(r) >= 0) || (region && region.indexOf(r) >= 0)) return true;
        if (r === 'default' && (!region || region === 'default' || region === '')) return true;
    }
    return false;
}

function getCatchableBeastsHere() {
    var list = [];
    for (var id in BEAST_TEMPLATES) {
        if (canCaptureInCurrentLocation(id)) list.push(id);
    }
    return list;
}

function captureBeast(templateId) {
    var template = BEAST_TEMPLATES[templateId];
    // v17.3 境界压制：灵兽不服弱者——目标境界高出玩家两大境及以上，根本不屑臣服
    try {
        var pR = window.currentCharData && window.currentCharData.realm;
        var tR = template.realm;
        if (pR && tR && typeof window.getRealmIndex === 'function' && window.REALM_CONFIG) {
            var pi = window.getRealmIndex(pR);
            var ti = window.getRealmIndex(tR);
            if (pi > -1 && ti > -1 && ti - pi >= 2) {
                if (window.showMessage) window.showMessage('「' + template.name + '」俯视着你，眼中尽是不屑——' + tR + '级的威压之下，你连靠近都难。（境界差距过大）', 'error');
                return false;
            }
        }
    } catch (eRealmGate) {}
    if (!template) {
        if (window.showMessage) window.showMessage('未知灵兽', 'error');
        return false;
    }
    if (template.catchable === false) {
        if (window.showMessage) window.showMessage('该形态无法直接捕捉', 'warning');
        return false;
    }
    if (!canCaptureInCurrentLocation(templateId)) {
        if (window.showMessage) window.showMessage('此处没有「' + template.name + '」出没', 'warning');
        return false;
    }
    // B4：捕捉有时间/精力成本（完整战斗收服仍待深化）
    if (window.showMessage) {
        window.showMessage('提示：理想流程为野外战斗削弱后收服；当前为过渡版捕捉。', 'info');
    }
    var cd2 = window.currentCharData;
    if (cd2 && (cd2.energy == null ? 100 : cd2.energy) < 8) {
        if (window.showMessage) window.showMessage('精力不足', 'warning');
        return false;
    }
    if (cd2) cd2.energy = (cd2.energy != null ? cd2.energy : 100) - 8;
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(15, '尝试捕捉');
    }
    var chance = 0.2 + Math.random() * 0.2;
    var tplLv = template.level || template.realmTier || 1;
    chance -= Math.min(0.15, tplLv * 0.02);
    chance *= 1 + ((typeof window.getLifeSkill === 'function' ? getLifeSkill('驭兽') : 0)) * 0.002; // v18.0 驭兽生活技能（与战后收服同式）
    chance = Math.max(0.05, Math.min(0.75, chance));
    if (Math.random() < chance) {
        tamedBeasts.push({
            templateId: templateId,
            name: template.name,
            level: 1,
            exp: 0,
            affection: 50,
            skills: (template.skills || []).slice(),
            combatAbilities: [], // v17.1 已传授绝技（白名单见模板 teachable）
            trait: rollBeastTrait(), // v17.1 个体天赋
            mount: template.mount ? Object.assign({}, template.mount) : null
        });
        saveBeastData();
        if (window.showMessage) window.showMessage('🐾 成功驯服「' + template.name + '」！', 'success');
            if (typeof window.renderBeastList === 'function') window.renderBeastList();
        return true;
    }
    if (window.showMessage) window.showMessage('捕捉失败，灵兽逃走了…', 'info');
    return false;
}

function trainBeast(index) {
    var beast = tamedBeasts[index];
    if (!beast) return false;
    // B4：培养有成本与日限
    var cd = window.currentCharData;
    var day = (typeof window.getAbsoluteDay === 'function') ? window.getAbsoluteDay() : 1;
    if (!beast._trainDay || beast._trainDay !== day) {
        beast._trainDay = day;
        beast._trainCount = 0;
    }
    if ((beast._trainCount || 0) >= 3) {
        if (window.showMessage) window.showMessage('该灵兽今日培养次数已满（3次）', 'warning');
        return false;
    }
    if (cd && (cd.energy == null ? 100 : cd.energy) < 5) {
        if (window.showMessage) window.showMessage('精力不足，无法培养', 'warning');
        return false;
    }
    if (cd) cd.energy = (cd.energy != null ? cd.energy : 100) - 5;
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(30, '培养灵兽');
    }
    beast._trainCount = (beast._trainCount || 0) + 1;
    beast.exp += 10;
    beast.affection = Math.min(100, (beast.affection || 50) + 1);
    var needed = beast.level * 50;
    while (beast.exp >= needed) {
        beast.exp -= needed;
        beast.level++;
        needed = beast.level * 50;
        if (window.showMessage) window.showMessage(beast.name + ' 升到 Lv.' + beast.level + '！', 'success');
    }
    // 尝试进化
    tryEvolveBeast(index);
    saveBeastData();
    if (typeof window.renderBeastList === 'function') window.renderBeastList();
    return true;
}

function tryEvolveBeast(index) {
    var beast = tamedBeasts[index];
    if (!beast) return false;
    var template = BEAST_TEMPLATES[beast.templateId];
    if (!template || !template.evolve) return false;
    var ev = template.evolve;
    if (beast.level < (ev.level || 99)) return false;
    // 检查材料
    var hasItem = false;
    if (ev.item && window.inventory && window.inventory.slots) {
        for (var i = 0; i < window.inventory.slots.length; i++) {
            var s = window.inventory.slots[i];
            if (s && s.templateId === ev.item && s.count >= 1) {
                s.count -= 1;
                if (s.count <= 0) window.inventory.slots[i] = null;
                hasItem = true;
                break;
            }
        }
    }
    // 无材料要求或材料不足：仅提示
    if (ev.item && !hasItem) {
        // 静默：培养时不强制
        return false;
    }
    var next = BEAST_TEMPLATES[ev.to];
    if (!next) return false;
    beast.templateId = ev.to;
    beast.name = next.name;
    beast.skills = (next.skills || []).slice();
    beast.mount = next.mount ? Object.assign({}, next.mount) : beast.mount;
    if (window.showMessage) window.showMessage('✨ 「' + template.name + '」进化为「' + next.name + '」！', 'success');
    if (window.showEffect) window.showEffect('level_up');
    saveBeastData();
    return true;
}

function evolveBeast(index) {
    var beast = tamedBeasts[index];
    if (!beast) return false;
    var template = BEAST_TEMPLATES[beast.templateId];
    if (!template || !template.evolve) {
        if (window.showMessage) window.showMessage('无法进化', 'warning');
        return false;
    }
    if (beast.level < template.evolve.level) {
        if (window.showMessage) window.showMessage('需要等级 ' + template.evolve.level, 'warning');
        return false;
    }
    // P1-6：只扣一次材料，然后直接进化（不再调 tryEvolveBeast 重复扣）
    var itemId = template.evolve.item;
    if (itemId) {
        var ok = false;
        if (window.inventory && window.inventory.slots) {
            for (var i = 0; i < window.inventory.slots.length; i++) {
                var s = window.inventory.slots[i];
                if (s && s.templateId === itemId && s.count >= 1) {
                    s.count -= 1;
                    if (s.count <= 0) window.inventory.slots[i] = null;
                    ok = true;
                    break;
                }
            }
        }
        if (!ok) {
            if (window.showMessage) window.showMessage('缺少进化材料：' + itemId, 'error');
            return false;
        }
    }
    // 材料已扣，直接进化
    var next = BEAST_TEMPLATES[template.evolve.to];
    if (!next) {
        if (window.showMessage) window.showMessage('进化目标未定义：' + template.evolve.to, 'error');
        return false;
    }
    beast.templateId = template.evolve.to;
    beast.name = next.name;
    beast.skills = (next.skills || []).slice();
    beast.mount = next.mount ? Object.assign({}, next.mount) : null;
    saveBeastData();
    if (window.showMessage) window.showMessage('✨ 进化成功：' + next.name, 'success');
    return true;
}

function setActiveBeast(index) {
    if (index < 0 || index >= tamedBeasts.length) {
        activeBeastIndex = -1;
    } else {
        activeBeastIndex = index;
        if (window.showMessage) window.showMessage('出战灵兽：' + tamedBeasts[index].name, 'success');
    }
    saveBeastData();
    if (typeof window.renderBeastList === 'function') window.renderBeastList();
    return true;
}

function setActiveMount(index) {
    if (index < 0 || index >= tamedBeasts.length) {
        activeMountIndex = -1;
        if (window.showMessage) window.showMessage('已取消骑乘', 'info');
    } else {
        var b = tamedBeasts[index];
        if (!b.mount) {
            if (window.showMessage) window.showMessage(b.name + ' 不可骑乘', 'warning');
            return false;
        }
        activeMountIndex = index;
        // v17.3 骑乘同行：朝夕相处生情（陪伴即羁绊）
        b.affection = Math.min(100, (b.affection || 0) + 2);
        if (window.showMessage) window.showMessage('骑乘：' + b.name + '（速度×' + (b.mount.speed || 1) + '）——它显得很高兴。', 'success');
    }
    window.activeMountIndex = activeMountIndex;
    saveBeastData();
    return true;
}

function getActiveBeast() {
    if (activeBeastIndex < 0 || activeBeastIndex >= tamedBeasts.length) return null;
    return tamedBeasts[activeBeastIndex];
}

function getActiveMount() {
    if (activeMountIndex < 0 || activeMountIndex >= tamedBeasts.length) return null;
    var b = tamedBeasts[activeMountIndex];
    return b && b.mount ? b : null;
}

/** 骑乘对旅行时间的倍率（<1 更快） */
function getMountTravelTimeMultiplier() {
    var m = getActiveMount();
    if (!m || !m.mount || !m.mount.speed) return 1.0;
    return 1 / m.mount.speed;
}

/** 将出战灵兽转为战斗 Entity 数据 */
function getActiveBeastCombatData() {
    var beast = getActiveBeast();
    if (!beast) return null;
    var template = BEAST_TEMPLATES[beast.templateId] || {};
    var base = template.attrs || { strength: 8, dexterity: 8, constitution: 8, willpower: 5, intelligence: 5, meridian: 5 };
    var lv = beast.level || 1;
    var scale = 1 + (lv - 1) * 0.08;
    // 驭兽师战力加成
    var powerMul = 1;
    powerMul = 1 + ((typeof window.getLifeSkill === 'function' ? getLifeSkill('驭兽') : 0)) * 0.01; // v18.0 驭兽生活技能
    // v17.1 个体天赋
    ensureBeastTrait(beast);
    var traitDef = BEAST_TRAITS.find(function (t) { return t.id === beast.trait; }) || null;
    // v17.1 好感档（调研：仙侣奇缘忠诚度分档）——心意相通/平淡/貌合神离
    var aff = beast.affection || 50;
    var affMul = aff >= 80 ? 1.08 : (aff < 40 ? 0.92 : 1);
    var affTier = aff >= 80 ? '心意相通' : (aff < 40 ? '貌合神离' : '平淡');
    var attrs = {};
    Object.keys(base).forEach(function (k) {
        var v = Math.floor((base[k] || 5) * scale * powerMul);
        if (traitDef && traitDef.attr === k) v = Math.floor(v * traitDef.mul);
        attrs[k] = Math.max(1, Math.floor(v * affMul));
    });
    var skillsObj = {};
    (beast.skills || template.skills || []).forEach(function (s) {
        skillsObj[s] = Math.min(100, 20 + lv * 2);
    });
    // v17.1 战斗技能：物种天生技 ∪ 已传授绝技（机制唯一判定来源）
    var abilities = (template.innate || []).slice();
    (beast.combatAbilities || []).forEach(function (id) { if (abilities.indexOf(id) < 0) abilities.push(id); });
    return {
        name: beast.name + '（灵兽）',
        level: lv,
        species: 'beast',
        type: 'beast',
        physiologyType: 'beast', // v17.1 补生理标：走野兽模板（血量×1.5 等）
        attrs: attrs,
        skills: skillsObj,
        combatAbilities: abilities,
        _traitName: traitDef ? traitDef.name : '',
        _affectionTier: affTier,
        loot: { exp: 0, copper: 0 },
        aiBehavior: aff < 40 ? 'balanced' : 'aggressive',
        _tamedIndex: activeBeastIndex
    };
}

/** 战后成长 */
function onBeastBattleEnd(won) {
    var beast = getActiveBeast();
    if (!beast) return;
    if (won) {
        beast.exp += 20;
        beast.affection = Math.min(100, (beast.affection || 50) + 2);
    } else {
        beast.affection = Math.max(0, (beast.affection || 50) - 1);
    }
    var needed = beast.level * 50;
    while (beast.exp >= needed) {
        beast.exp -= needed;
        beast.level++;
        needed = beast.level * 50;
    }
    tryEvolveBeast(activeBeastIndex);
    saveBeastData();
}

// ============ v10.0 战斗后收服灵兽 ============
function canCaptureDefeatedEnemy(enemy) {
    if (!enemy) return false;
    var species = enemy.species || (enemy.type === 'beast' ? 'beast' : 'human');
    if (species !== 'beast') return false;
    var phys = enemy.physiology;
    if (phys && phys.isUnconscious) return true;
    if (enemy.durabilities) {
        var total = 0, maxTotal = 0;
        for (var k in enemy.durabilities) {
            total += enemy.durabilities[k];
            maxTotal += enemy.maxDurabilities ? enemy.maxDurabilities[k] : 100;
        }
        if (maxTotal > 0 && (total / maxTotal) < 0.35) return true;
    }
    return false;
}

function getBeastTemplateIdFromEnemy(enemy) {
    if (!enemy) return null;
    for (var id in BEAST_TEMPLATES) {
        var t = BEAST_TEMPLATES[id];
        if (t.name === enemy.name) return id;
    }
    if (enemy.name && enemy.name.indexOf('狼') >= 0) return 'wind_wolf';
    if (enemy.name && enemy.name.indexOf('虎') >= 0) return 'flame_tiger';
    if (enemy.name && enemy.name.indexOf('蛇') >= 0) return 'ice_serpent';
    if (enemy.name && enemy.name.indexOf('鹰') >= 0) return 'thunder_eagle';
    if (enemy.name && enemy.name.indexOf('狐') >= 0) return 'spirit_fox';
    if (enemy.name && enemy.name.indexOf('龟') >= 0) return 'dragon_turtle';
    if (enemy.name && enemy.name.indexOf('凤') >= 0) return 'fire_phoenix';
    if (enemy.name && enemy.name.indexOf('豹') >= 0) return 'shadow_panther';
    return null;
}

function captureBeastAfterBattle(enemy) {
    var templateId = getBeastTemplateIdFromEnemy(enemy);
    if (!templateId) {
        if (window.showMessage) window.showMessage('这只野兽无法收服', 'warning');
        return false;
    }
    var template = BEAST_TEMPLATES[templateId];
    if (!template || template.catchable === false) {
        if (window.showMessage) window.showMessage('该灵兽无法收服', 'warning');
        return false;
    }
        // v17.3 境界压制：灵兽不服弱者——目标境界高出玩家两大境及以上，根本不屑臣服
    try {
        var pR = window.currentCharData && window.currentCharData.realm;
        var tR = template.realm;
        if (pR && tR && typeof window.getRealmIndex === 'function' && window.REALM_CONFIG) {
            var pi = window.getRealmIndex(pR);
            var ti = window.getRealmIndex(tR);
            if (pi > -1 && ti > -1 && ti - pi >= 2) {
                if (window.showMessage) window.showMessage('「' + template.name + '」俯视着你，眼中尽是不屑——' + tR + '级的威压之下，你连靠近都难。（境界差距过大）', 'error');
                return false;
            }
        }
    } catch (eRealmGate) {}
    var hasTrap = false;
    if (window.inventory && window.inventory.slots) {
        for (var i = 0; i < window.inventory.slots.length; i++) {
            var s = window.inventory.slots[i];
            if (s && (s.templateId === 'spec_beast_trap' || s.templateId === 'special_mechanism')) {
                hasTrap = true;
                s.count -= 1;
                if (s.count <= 0) window.inventory.slots[i] = null;
                break;
            }
        }
    }
    var chance = 0.3;
    if (hasTrap) chance += 0.25;
    var phys = enemy.physiology;
    if (phys && phys.isUnconscious) chance += 0.2;
    var enemyLv = enemy.level || 1;
    chance -= Math.min(0.3, enemyLv * 0.01);
    if (typeof window.getLifeSkill === 'function') {
        var beastSkill = window.getLifeSkill('驭兽') || 0;
        chance += beastSkill * 0.002;
    }
    chance = Math.max(0.05, Math.min(0.85, chance));
    if (Math.random() < chance) {
        var beastObj = {
            templateId: templateId,
            name: template.name,
            level: 1,
            exp: 0,
            affection: 50,
            skills: (template.skills || []).slice(),
            combatAbilities: [], // v17.1 已传授绝技（白名单见模板 teachable）
            trait: rollBeastTrait(), // v17.1 个体天赋
            mount: template.mount ? Object.assign({}, template.mount) : null
        };
        tamedBeasts.push(beastObj);
        saveBeastData();
        // v20.0：图鉴 + 进化线注册（抽函数，世界循环也会调）
        tryRegisterTamedBeast(tamedBeasts.length - 1);
        if (window.showMessage) window.showMessage('🐾 成功收服「' + template.name + '」！', 'success');
        if (typeof window.renderBeastList === 'function') window.renderBeastList();
        return true;
    } else {
        if (window.showMessage) window.showMessage('😤 收服失败！' + template.name + ' 挣脱了束缚', 'warning');
        return false;
    }
}

// v20.0：驯服成功后注册到 v19.19 进化线 + v19.17 图鉴
function tryRegisterTamedBeast(index) {
    var beast = tamedBeasts[index];
    if (!beast) return;
    try {
        var bid = beast.uid || (beast.templateId + '_' + index);
        beast.uid = bid;
        if (window.BeastEvolution && typeof window.BeastEvolution.initBeast === 'function') {
            // 模板名 → 进化线
            var lineMap = {
                spirit_fox: 'line_fox', wind_wolf: 'line_fox',
                fire_phoenix: 'line_phoenix', dragon_turtle: 'line_dragon'
            };
            // 兼容 beast_lingfox / beast_windwolf 等长名
            var tmpl = (beast.templateId || '').replace(/^beast_/, '');
            window.BeastEvolution.initBeast(bid, lineMap[tmpl] || lineMap[beast.templateId] || 'line_fox');
        }
        if (window.Codex && typeof window.Codex.discover === 'function') {
            window.Codex.discover('codex_beast', beast.templateId, { name: beast.name });
        }
    } catch (eReg) {}
}

// ==================== v17.1 喂食与绝技传授 ====================
function beastCountItem(itemId) {
    var inv = window.inventory;
    if (!inv || !inv.slots) return 0;
    return inv.slots.reduce(function (n, s) { return n + (s && s.templateId === itemId ? (s.count || 0) : 0); }, 0);
}
function beastConsumeItem(itemId, count) {
    var inv = window.inventory;
    if (!inv || !inv.slots || beastCountItem(itemId) < count) return false;
    var left = count;
    for (var i = 0; i < inv.slots.length && left > 0; i++) {
        var s = inv.slots[i];
        if (s && s.templateId === itemId) {
            var take = Math.min(left, s.count || 0);
            s.count -= take; left -= take;
            if (s.count <= 0) inv.slots[i] = null;
        }
    }
    return true;
}
window.feedBeast = function (index) {
    var b = tamedBeasts[index];
    if (!b) return;
    ensureBeastTrait(b);
    if ((b.affection || 0) >= 100) { if (window.showMessage) window.showMessage(b.name + ' 蹭了蹭你——亲密度已满。', 'info'); return; }
    if (!beastConsumeItem('spirit_grass', 2)) { if (window.showMessage) window.showMessage('喂食需要灵草×2——百草园或坊市可得。', 'error'); return; }
    b.affection = Math.min(100, (b.affection || 0) + 8);
    b.exp = (b.exp || 0) + 15;
    tryEvolveBeast(index);
    saveBeastData();
    if (window.showMessage) window.showMessage('🍖 你把灵草嚼碎了喂给' + b.name + '——亲密度+8，经验+15。', 'success');
    if (typeof window.renderBeastList === 'function') window.renderBeastList();
};
window.openTeachModal = function (index) {
    var b = tamedBeasts[index]; if (!b) return;
    var tpl = BEAST_TEMPLATES[b.templateId] || {};
    var teachable = tpl.teachable || [];
    var mine = (window.currentCharData && window.currentCharData.combatAbilities) || [];
    var known = b.combatAbilities || [];
    var opts = teachable.filter(function (id) { return mine.indexOf(id) >= 0 && known.indexOf(id) < 0; });
    function nm(id) { return (window.COMBAT_ABILITIES && window.COMBAT_ABILITIES[id]) ? window.COMBAT_ABILITIES[id].name : id; }
    var html = '<p class="text-xs text-gray-400 mb-2">传授需：亲密度≥60｜灵石300｜每兽至多2门外来绝技。</p>';
    if (!opts.length) {
        html += '<p class="text-sm text-gray-500">暂无可传授的绝技（你尚未掌握它可学的新技）。</p>';
    } else {
        opts.forEach(function (id) {
            html += '<button onclick="teachBeastAbility(' + index + ', \'' + id + '\')" class="w-full text-left bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm mb-1">' + nm(id) + '（灵石300）</button>';
        });
    }
    if (known.length) {
        html += '<p class="text-xs text-gray-400 mt-3">已授：' + known.map(nm).join('、') + '</p>';
    }
    if (typeof window.showModal === 'function') window.showModal('🎓 传授绝技 · ' + b.name, html);
};
window.teachBeastAbility = function (index, abilityId) {
    var ds = window.discipleState || {};
    var gb = ds._gbFaction || null;
    var b = tamedBeasts[index]; if (!b) return;
    var tpl = BEAST_TEMPLATES[b.templateId] || {};
    if ((tpl.teachable || []).indexOf(abilityId) < 0) { if (window.showMessage) window.showMessage(tpl.name || '此兽') + ' 学不会这门技艺。'; return; }
    var mine = (window.currentCharData && window.currentCharData.combatAbilities) || [];
    if (mine.indexOf(abilityId) < 0) { if (window.showMessage) window.showMessage('你自己尚未掌握这门绝技，无从教起。', 'warning'); return; }
    if ((b.combatAbilities || []).length >= 2) { if (window.showMessage) window.showMessage(b.name + ' 已学会两门外来绝技——兽脑装不下了。', 'warning'); return; }
    if ((b.combatAbilities || []).indexOf(abilityId) >= 0) return;
    if ((b.affection || 0) < 60) { if (window.showMessage) window.showMessage('亲密度不足60——先喂到心意相通再说。', 'warning'); return; }
    var cur = (window.inventory && window.inventory.currency) ? window.inventory.currency.spiritStones : 0;
    if (cur < 300) { if (window.showMessage) window.showMessage('传授要备下谢师礼灵石300。', 'error'); return; }
    window.inventory.currency.spiritStones -= 300;
    if (!b.combatAbilities) b.combatAbilities = [];
    b.combatAbilities.push(abilityId);
    saveBeastData();
    var nm = (window.COMBAT_ABILITIES && window.COMBAT_ABILITIES[abilityId]) ? window.COMBAT_ABILITIES[abilityId].name : abilityId;
    if (window.showMessage) window.showMessage('🎓 你以灵识为桥，将「' + nm + '」的门道渡进了' + b.name + '的血脉。', 'success');
    if (typeof window.renderBeastList === 'function') window.renderBeastList();
};

// 导出
window.BEAST_TEMPLATES = BEAST_TEMPLATES;
window.tamedBeasts = tamedBeasts;
window.activeBeastIndex = activeBeastIndex;
window.initBeastTaming = initBeastTaming;
window.captureBeast = captureBeast;
window.trainBeast = trainBeast;
window.evolveBeast = evolveBeast;
window.tryEvolveBeast = tryEvolveBeast;
window.setActiveBeast = setActiveBeast;
window.setActiveMount = setActiveMount;
window.getActiveBeast = getActiveBeast;
window.getActiveMount = getActiveMount;
window.getMountTravelTimeMultiplier = getMountTravelTimeMultiplier;
window.getActiveBeastCombatData = getActiveBeastCombatData;
window.onBeastBattleEnd = onBeastBattleEnd;
window.canCaptureInCurrentLocation = canCaptureInCurrentLocation;
window.getCatchableBeastsHere = getCatchableBeastsHere;
window.saveBeastData = saveBeastData;
window.exportBeastState = exportBeastState;
window.importBeastState = importBeastState;
window.canCaptureDefeatedEnemy = canCaptureDefeatedEnemy;
window.getBeastTemplateIdFromEnemy = getBeastTemplateIdFromEnemy;
window.captureBeastAfterBattle = captureBeastAfterBattle;
window.tryRegisterTamedBeast = tryRegisterTamedBeast;
window.BEAST_TRAITS = BEAST_TRAITS;
window.feedBeast = feedBeast;
window.openTeachModal = openTeachModal;
window.teachBeastAbility = teachBeastAbility;
