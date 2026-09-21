/**
 * beast-taming.js - 灵兽系统 v7.1 P0-3
 * 收服（战后正门）/ 培养 / 出战 / 骑乘 / 进化（第八十五波：过渡版主动捕捉已拆除）
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
    },
    // ==================== v20.53 高位面灵兽（灵界/魔界）====================
    // 人间名册到元婴就断了，位面兽补上高阶档，只在自己位面出没
    cloud_horn_deer: {
        name: '云角鹿', type: 'beast', level: 60, realm: '元婴',
        attrs: { strength: 22, dexterity: 34, constitution: 26, willpower: 24, intelligence: 22, meridian: 26 },
        skills: ['踏云', '灵愈', '雾隐'],
        mount: { speed: 3.2, fly: true },
        innate: ["chill"],
        teachable: ["chill"],
        regions: ['灵界'], catchable: true
    },
    gangwind_crane: {
        name: '罡风鹤', type: 'beast', level: 78, realm: '化神',
        attrs: { strength: 28, dexterity: 42, constitution: 30, willpower: 30, intelligence: 30, meridian: 30 },
        skills: ['罡风刃', '风隐', '长唳'],
        mount: { speed: 4.4, fly: true },
        innate: ["chill"],
        teachable: ["chill", "sword_burst"],
        regions: ['灵界'], catchable: true
    },
    bloodmare_hound: {
        name: '血鬃魔犬', type: 'beast', level: 72, realm: '化神',
        attrs: { strength: 36, dexterity: 32, constitution: 32, willpower: 26, intelligence: 18, meridian: 24 },
        skills: ['血噬', '凶嚎', '追踪'],
        mount: { speed: 3.6 },
        innate: ["burn"],
        teachable: ["burn", "lifesteal"],
        regions: ['魔界'], catchable: true
    },
    nethervein_serpent: {
        name: '幽脉蟒', type: 'beast', level: 85, realm: '炼虚',
        attrs: { strength: 40, dexterity: 28, constitution: 38, willpower: 32, intelligence: 24, meridian: 30 },
        skills: ['幽脉缠', '毒雾', '蜕鳞'],
        mount: { speed: 2.8 },
        innate: ["venom"],
        teachable: ["venom"],
        regions: ['魔界'], catchable: true
    },

    // ===== v20.95 兽潮名册落地：仙劫潮点名了它们三年，灵兽谱上却一直查无此兽 =====
    crane: {
        name: '仙鹤', type: 'beast', level: 18, realm: '筑基',
        attrs: { strength: 8, dexterity: 22, constitution: 12, willpower: 14, intelligence: 12, meridian: 10 },
        skills: ['风刃', '轻身'],
        mount: { speed: 2.0 },
        innate: ["escape"],
        teachable: ["escape"],
        regions: ['中州', '天空', '东荒'], catchable: true
    },
    xuan_gui: {
        name: '玄龟', type: 'beast', level: 24, realm: '金丹',
        attrs: { strength: 18, dexterity: 6, constitution: 30, willpower: 20, intelligence: 10, meridian: 12 },
        skills: ['水流护体', '铁壁防御'],
        mount: { speed: 0.9 },
        innate: ["reflect"],
        teachable: ["reflect"],
        regions: ['东海', '东南海域'], catchable: true
    },
    thunder_beast: {
        name: '雷兽', type: 'beast', level: 26, realm: '金丹',
        attrs: { strength: 24, dexterity: 20, constitution: 18, willpower: 12, intelligence: 10, meridian: 14 },
        skills: ['天雷降世', '雷蛇乱舞'],
        mount: { speed: 2.2 },
        innate: ["burn"],
        teachable: ["burn", "pounce"],
        regions: ['天空', '北冥'], catchable: true
    },
    black_bear: {
        name: '黑熊', type: 'beast', level: 22, realm: '筑基',
        attrs: { strength: 26, dexterity: 8, constitution: 24, willpower: 12, intelligence: 8, meridian: 8 },
        skills: ['金刚推掌', '铜皮铁骨'],
        innate: ["pounce"],
        teachable: ["pounce", "reflect"],
        regions: ['北冥', '东荒', '中州'], catchable: true
    },
    five_color_deer: {
        name: '五色鹿', type: 'beast', level: 28, realm: '元婴',
        attrs: { strength: 12, dexterity: 24, constitution: 18, willpower: 22, intelligence: 20, meridian: 18 },
        skills: ['木灵缠绕', '生生回复'],
        mount: { speed: 2.4 },
        innate: ["escape"],
        teachable: ["escape"],
        regions: ['东荒', '蜀地'], catchable: true
    },
    golden_crow: {
        name: '金乌', type: 'beast', level: 32, realm: '化神',
        attrs: { strength: 28, dexterity: 26, constitution: 24, willpower: 20, intelligence: 18, meridian: 20 },
        skills: ['火焰喷射', '烈火护盾', '焚天振翼'],
        mount: { speed: 3.0 },
        innate: ["burn"],
        teachable: ["burn", "sword_burst"],
        regions: ['南疆', '天空'], catchable: true
    },
    kunpeng: {
        name: '鲲鹏', type: 'beast', level: 35, realm: '化神',
        attrs: { strength: 32, dexterity: 30, constitution: 30, willpower: 26, intelligence: 24, meridian: 26 },
        skills: ['风卷残云', '踏云飞行', '北冥吞天'],
        mount: { speed: 3.5 },
        innate: ["pounce", "escape"],
        teachable: ["pounce", "escape"],
        regions: ['北冥', '天空', '东南海域'], catchable: true
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

// 第八十八波·小名：物种名是账上的名，小名是你叫它的名——面板、话术、战报都用这个口。
// 改的只是 petName 展示层，b.name（物种账）不动——收服桥、图鉴、繁育全按物种账走，零牵连。
function beastDisplayName(b) {
    if (!b) return '';
    return b.petName ? b.petName + '·' + b.name : (b.name || '');
}

// 第八十八波·兽栏魂印上限：收服灵兽须以灵识烙魂印，能分几道随境界走——
// 炼气3道、筑基4道、金丹5道、元婴6道、化神7道、炼虚8道。约束来自修为本身，不是人为配额。
function getBeastPenCap() {
    var ri = 0;
    try {
        var r = window.currentCharData && window.currentCharData.realm;
        if (r && typeof window.getRealmIndex === 'function') {
            var idx = window.getRealmIndex(r);
            if (idx > 0) ri = idx;
        }
    } catch (eCap) {}
    return 3 + ri;
}

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
        } else {
            window.tamedBeasts = tamedBeasts;
            window.activeBeastIndex = activeBeastIndex;
            window.activeMountIndex = activeMountIndex;
        }
    } catch (e) {}
    try { sweepInvalidBeastLines(); } catch (eSweep) {}   // 第八十五波：错挂血脉的旧档开机洗册
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

// 第八十五波·残留清理：v17.4 过渡版「主动捕捉」三件套（canCaptureInCurrentLocation/getCatchableBeastsHere/captureBeast）整体拆除。
// 绕过战斗白手擒兽不成体统，且进化形态 regions 为空反而处处可捕（等于绕过进化链白拿狼王/成年火凤）。
// 收服只走正门：野外遇上（名种真分布，第八十四波）→ 战斗削弱 → 战胜界面收服（captureBeastAfterBattle）；或灵兽坊买幼兽。

function trainBeast(index) {
    var beast = tamedBeasts[index];
    if (!beast) return false;
    // v20.9：培养成本=精力+时辰（世界真实约束）。旧"每日3次"是人为计数器，已删——
    // 精力与游戏时辰本身就是天花板：一天满精力也练不出多少级。
    var cd = window.currentCharData;
    if (cd && (cd.energy == null ? 100 : cd.energy) < 5) {
        if (window.showMessage) window.showMessage('精力不足，无法培养', 'warning');
        return false;
    }
    if (cd) cd.energy = (cd.energy != null ? cd.energy : 100) - 5;
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(30, '培养灵兽');
    }
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
    // 第八十八波·进化不再偷吃材料：旧版培养/喂食路过这里就自动扣掉进化材料当场变身——
    // 风之精华攒着别有用途，喂口灵草兽就自己把材料吞了，问都没问过一声。
    // 要吃材料的进化一律走面板「进化」按钮（evolveBeast）手动确认；这里只放行无材料的蜕变。
    if (ev.item) return false;
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
            // 第八十八波·说人话：旧版这里直接把 mat_wind_essence 之类的账房 id 甩给玩家
            var _itemName = (window.itemById && window.itemById[itemId] && window.itemById[itemId].name) || itemId;
            if (window.showMessage) window.showMessage('缺少进化材料：' + _itemName, 'error');
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
        // 第八十四波·力竭的兽不应战：出战口如实拦下（不再默默带了个不上场的挂件）
        try {
            var _b = tamedBeasts[index];
            var _bid = _b.uid || (_b.templateId + '_' + index);
            if (window.BeastEvolution && typeof window.BeastEvolution.getWoundStatus === 'function' &&
                window.BeastEvolution.getWoundStatus(_bid) && window.BeastEvolution.getHp(_bid) <= 0) {
                if (window.showMessage) window.showMessage(beastDisplayName(_b) + ' 伤重力竭，趴着不肯起身——先喂还伤丹或让它静养几日。', 'warning');
                return false;
            }
        } catch (eWoundSet) {}
        activeBeastIndex = index;
        if (window.showMessage) window.showMessage('出战灵兽：' + beastDisplayName(tamedBeasts[index]), 'success');
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
        // 第八十八波·力竭的兽载不动人：出战口早拦了，骑乘口却还放行——
        // 重伤趴窝的兽被翻身骑上去撒腿就跑，不成体统。同一本伤账，两个口一个规矩。
        try {
            var _bidM = b.uid || (b.templateId + '_' + index);
            if (window.BeastEvolution && typeof window.BeastEvolution.getWoundStatus === 'function' &&
                window.BeastEvolution.getWoundStatus(_bidM) && window.BeastEvolution.getHp(_bidM) <= 0) {
                if (window.showMessage) window.showMessage((b.petName ? b.petName + '（' + b.name + '）' : b.name) + ' 伤重力竭，驮不动你——先喂还伤丹或让它静养几日。', 'warning');
                return false;
            }
        } catch (eWoundMount) {}
        activeMountIndex = index;
        // v17.3 骑乘同行：朝夕相处生情（陪伴即羁绊）
        // 第八十五波·逻辑收口：陪伴按「天」算不按「次」算——旧版每点一次骑乘按钮亲密+2，
        // 连点几十下就能白刷到心意相通。如今每日头一回骑乘才记陪伴（_lastMountPetDay 随档）。
        var _todayM = (typeof window.getAbsoluteDay === 'function') ? window.getAbsoluteDay() : null;
        if (_todayM != null && b._lastMountPetDay !== _todayM) {
            b._lastMountPetDay = _todayM;
            b.affection = Math.min(100, (b.affection || 0) + 2);
        }
        if (window.showMessage) window.showMessage('骑乘：' + beastDisplayName(b) + '（速度×' + (b.mount.speed || 1) + '）——它显得很高兴。开战时它会驮你入阵、随你一同出手。', 'success');
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
    return _beastCombatDataAt(activeBeastIndex, false);
}

// 第八十九/九十波·一份账两个口：出战兽与坐骑拼战斗数据是同一套算法
//（属性缩放/天赋/亲密度档/绝技全都一样），只有报名与标记不同。
function _beastCombatDataAt(index, asMount) {
    var beast = (index >= 0 && index < tamedBeasts.length) ? tamedBeasts[index] : null;
    if (!beast) return null;
    if (asMount && !beast.mount) return null;
    // 第八十四波·伤势真账：力竭（气血归零）的兽不听号令——旧版受伤 API 全库零调用，
    // 灵兽倒下等于没事；现在战倒记重伤、日结疗养回一成、可喂丹药，力竭期间不再出战（坐骑也不驮人上阵）。
    try {
        if (window.BeastEvolution && typeof window.BeastEvolution.getWoundStatus === 'function') {
            var _bidG = beast.uid || (beast.templateId + '_' + index);
            var _wst = window.BeastEvolution.getWoundStatus(_bidG);
            if (_wst && window.BeastEvolution.getHp(_bidG) <= 0) return null;
        }
    } catch (eWoundGate) {}
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
        name: (beast.petName ? beast.petName + '·' : '') + beast.name + (asMount ? '（坐骑）' : '（灵兽）'),
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
        _tamedIndex: index,
        _isMount: !!asMount,
        _mountSpeed: (beast.mount && beast.mount.speed) || 1
    };
}

/** 第九十波·坐骑战斗数据：骑着的兽驮你入阵，也能替你出手（力竭的不驮） */
function getMountCombatData() {
    if (!getActiveMount()) return null;
    return _beastCombatDataAt(activeMountIndex, true);
}

/** 战后成长 */
function onBeastBattleEnd(won) {
    // 第八十七波·亲遇成识：跟名种灵兽真打过一场（不论胜负、不论自己带没带兽），
    // 兽径手记就落一笔确讯——它住哪个地界、什么地皮，图鉴从此有账可查。
    try {
        var _en = window.currentBattle && window.currentBattle.enemy;
        if (_en && _en._beastTemplateId && _en._ecoRegion && window.BeastLore && typeof window.BeastLore.learnFromSighting === 'function') {
            window.BeastLore.learnFromSighting(_en._beastTemplateId, _en._ecoRegion, _en._ecoTerrain || '', '亲自交手');
        }
    } catch (eLore) {}
    // 第九十波·谁打的谁长阅历：真上过场的那只（出战兽或坐骑）才结账——
    // 旧版只认出战位，骑着坐骑打完全场，阅历亲密全记在了蹲在家里的兽头上（没出战兽就谁都不记）。
    var beast = null, beastIdx = -1;
    try {
        var _ab = window.currentBattle && window.currentBattle.allyBeast;
        if (_ab && _ab._tamedIndex != null && _ab._tamedIndex >= 0 && tamedBeasts[_ab._tamedIndex]) {
            beastIdx = _ab._tamedIndex;
            beast = tamedBeasts[beastIdx];
        }
    } catch (eWho) {}
    if (!beast) { beast = getActiveBeast(); beastIdx = activeBeastIndex; }
    if (!beast) return;
    if (won) {
        beast.exp += 20;
        beast.affection = Math.min(100, (beast.affection || 50) + 2);
    } else {
        beast.affection = Math.max(0, (beast.affection || 50) - 1);
    }
    // 第八十四波·伤势真账：灵兽在本场战倒（不支退出）→ 记重伤进进化模块的伤账
    //（日结疗养 +1% 气血、可喂还伤丹；力竭期间 getActiveBeastCombatData 拒其出战）
    try {
        var _bt = window.currentBattle;
        var _fell = _bt && _bt.allyBeast && _bt.allyBeast.isAlive === false;
        if (_fell && window.BeastEvolution && typeof window.BeastEvolution.damage === 'function') {
            var _bid = beast.uid || (beast.templateId + '_' + beastIdx);
            var _w = window.BeastEvolution.damage(_bid, 120);
            if (_w && _w.ok && window.showMessage) {
                window.showMessage('🩸 ' + beastDisplayName(beast) + '此战伤重——需静养些时日，或喂还伤丹替它疗伤（力竭期间不会应战）。', 'warning');
            }
        }
    } catch (eWound) {}
    var needed = beast.level * 50;
    while (beast.exp >= needed) {
        beast.exp -= needed;
        beast.level++;
        needed = beast.level * 50;
    }
    tryEvolveBeast(beastIdx);
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
    // 第八十五波·物种账：只认名字精确匹配——旧版「名里带狼就算风狼」的瞎猜桥摘除。
    // 杂兽（野狼/雪狼/沙狼）是寻常野味不是灵兽；名种灵兽自第八十四波起按分布表真出没，
    // 名字与模板精确一致，用不着猜。
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
    // 第八十八波·兽栏魂印：收服灵兽须以灵识烙一道魂印，境界越高灵识越能分——
    // 兽栏不是无底洞（魂印 3+境界序数）。旧档超额的既往不咎，只是烙不进新的了。
    if (tamedBeasts.length >= getBeastPenCap()) {
        if (window.showMessage) window.showMessage('你的灵识已分不出更多——兽栏满了（魂印 ' + tamedBeasts.length + '/' + getBeastPenCap() + '，随境界增长）。放生一只，才烙得进新的。', 'warning');
        return false;
    }
    var hasTrap = false;
    if (window.inventory && window.inventory.slots) {
        for (var i = 0; i < window.inventory.slots.length; i++) {
            var s = window.inventory.slots[i];
            // 第八十八波·缚兽符实体化：tal_beast_seal（灵兽坊有售的驭兽符纸）入账；
            // spec_beast_trap/beast_trap 是死账（前者全库查无此物，后者当日即废）留着兼容旧档，机关件照旧算数。
            if (s && (s.templateId === 'tal_beast_seal' || s.templateId === 'beast_trap' || s.templateId === 'spec_beast_trap' || s.templateId === 'special_mechanism')) {
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
    // 第八十四波·兽潮「收服略易」落地：此前详情牌面写着这句话，账上却没人兑现——
    // 潮来的兽被潮气扰了心性，收服成功率随潮的稀有度上浮（+5%/级，封顶仍是 0.85）
    try {
        if (window.BeastTide && typeof window.BeastTide.isRaidActive === 'function' && window.BeastTide.isRaidActive()) {
            var _tb = (typeof window.BeastTide.getRarityBoost === 'function') ? (window.BeastTide.getRarityBoost() || 1) : 1;
            chance += 0.05 * Math.max(1, _tb);
        }
    } catch (eTideCap) {}
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
        if (typeof window.growLifeSkill === 'function') window.growLifeSkill('驭兽', 2, { reason: '战后收服' }); // v20.94 熟能生巧
        if (typeof window.renderBeastList === 'function') window.renderBeastList();
        return true;
    } else {
        if (window.showMessage) window.showMessage('😤 收服失败！' + template.name + ' 挣脱了束缚', 'warning');
        if (typeof window.growLifeSkill === 'function') window.growLifeSkill('驭兽', 1, { reason: '让它挣脱了，长了记性' }); // v20.94 熟能生巧
        return false;
    }
}

// 物种 ↔ 进化线谱表（第八十五波）：玄龟归龙龟线（幼龟→灵龟→玄龙本就是龟的谱），
// 成年火凤接续凤线；其余物种无对应血脉线，不入册。
var BEAST_LINE_MAP = {
    spirit_fox: 'line_fox',
    fire_phoenix: 'line_phoenix', fire_phoenix_adult: 'line_phoenix',
    dragon_turtle: 'line_dragon', xuan_gui: 'line_dragon'
};

// 第八十五波·旧档洗册：被老版兜底错挂进狐线的兽（黑熊/仙鹤/风狼之流）开机清册——
// 错挂的血脉账（羁绊日数/阶段）本就是笔糊涂账，清掉后这些兽照旧能养能战，只是没有蜕形谱可走。
function sweepInvalidBeastLines() {
    if (!window.BeastEvolution || typeof window.BeastEvolution.forget !== 'function') return 0;
    var n = 0;
    for (var i = 0; i < tamedBeasts.length; i++) {
        var b = tamedBeasts[i];
        if (!b || !b.templateId) continue;
        var tmpl = String(b.templateId).replace(/^beast_/, '');
        if (BEAST_LINE_MAP[tmpl] || BEAST_LINE_MAP[b.templateId]) continue;
        var bid = b.uid || (b.templateId + '_' + i);
        var r = window.BeastEvolution.forget(bid);
        if (r && r.ok) n++;
    }
    return n;
}

// v20.0：驯服成功后注册到 v19.19 进化线 + v19.17 图鉴
function tryRegisterTamedBeast(index) {
    var beast = tamedBeasts[index];
    if (!beast) return;
    try {
        var bid = beast.uid || (beast.templateId + '_' + index);
        beast.uid = bid;
        if (window.BeastEvolution && typeof window.BeastEvolution.initBeast === 'function') {
            // 第八十五波·血脉谱收口：狐线只收狐、凤线只收凤、龟线只收龟——
            // 旧版风狼也塞狐线（狼蜕九尾灵狐？），兜底更是把黑熊仙鹤鲲鹏全记成狐线。
            // 对不上谱的物种不入线（没有血脉可讲），兼容 beast_ 前缀长名。
            var tmpl = (beast.templateId || '').replace(/^beast_/, '');
            var line = BEAST_LINE_MAP[tmpl] || BEAST_LINE_MAP[beast.templateId];
            if (line) window.BeastEvolution.initBeast(bid, line);
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
    if ((b.affection || 0) >= 100) { if (window.showMessage) window.showMessage(beastDisplayName(b) + ' 蹭了蹭你——亲密度已满。', 'info'); return; }
    // 第八十四波·灵草双账合一：野外采药出的是 mat_spirit_grass，坊市卖的是 spirit_grass——
    // 同名同实两本 id，旧版喂食只认后者，采了一筐灵草的玩家喂不了兽。两本都收，先扣野外账。
    var fed = false;
    if (beastCountItem('mat_spirit_grass') >= 2) fed = beastConsumeItem('mat_spirit_grass', 2);
    if (!fed && beastCountItem('spirit_grass') >= 2) fed = beastConsumeItem('spirit_grass', 2);
    if (!fed && beastCountItem('mat_spirit_grass') + beastCountItem('spirit_grass') >= 2) {
        var need = 2;
        ['mat_spirit_grass', 'spirit_grass'].forEach(function (gid) {
            if (need <= 0) return;
            var have = beastCountItem(gid);
            var take = Math.min(have, need);
            if (take > 0) { beastConsumeItem(gid, take); need -= take; }
        });
        fed = need <= 0;
    }
    if (!fed) { if (window.showMessage) window.showMessage('喂食需要灵草×2——野外采药、百草园或坊市可得。', 'error'); return; }
    b.affection = Math.min(100, (b.affection || 0) + 8);
    b.exp = (b.exp || 0) + 15;
    tryEvolveBeast(index);
    saveBeastData();
    if (window.showMessage) window.showMessage('🍖 你把灵草嚼碎了喂给' + beastDisplayName(b) + '——亲密度+8，经验+15。', 'success');
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
    // 第八十四波顺手修：旧版这行的字符串拼接写在了括号外——只弹出兽名，后半句被丢在风里
    if ((tpl.teachable || []).indexOf(abilityId) < 0) { if (window.showMessage) window.showMessage((tpl.name || '此兽') + ' 学不会这门技艺。', 'warning'); return; }
    var mine = (window.currentCharData && window.currentCharData.combatAbilities) || [];
    if (mine.indexOf(abilityId) < 0) { if (window.showMessage) window.showMessage('你自己尚未掌握这门绝技，无从教起。', 'warning'); return; }
    if ((b.combatAbilities || []).length >= 2) { if (window.showMessage) window.showMessage(b.name + ' 已学会两门外来绝技——兽脑装不下了。', 'warning'); return; }
    if ((b.combatAbilities || []).indexOf(abilityId) >= 0) return;
    if ((b.affection || 0) < 60) { if (window.showMessage) window.showMessage('亲密度不足60——先喂到心意相通再说。', 'warning'); return; }
    // 第八十四波顺手修：谢师礼走统一扣款口（双写钱包）——旧版直写背包真账，角色镜像分叉
    var _paid300 = false;
    if (window.XianXia && window.XianXia.DataManager && typeof window.XianXia.DataManager.deductSpiritStones === 'function') {
        _paid300 = !!window.XianXia.DataManager.deductSpiritStones(300);
    } else {
        var cur = (window.inventory && window.inventory.currency) ? window.inventory.currency.spiritStones : 0;
        if (cur >= 300) {
            window.inventory.currency.spiritStones -= 300;
            if (window.currentCharData) window.currentCharData.spiritStones = window.inventory.currency.spiritStones;
            _paid300 = true;
        }
    }
    if (!_paid300) { if (window.showMessage) window.showMessage('传授要备下谢师礼灵石300。', 'error'); return; }
    if (!b.combatAbilities) b.combatAbilities = [];
    b.combatAbilities.push(abilityId);
    saveBeastData();
    var nm = (window.COMBAT_ABILITIES && window.COMBAT_ABILITIES[abilityId]) ? window.COMBAT_ABILITIES[abilityId].name : abilityId;
    if (window.showMessage) window.showMessage('🎓 你以灵识为桥，将「' + nm + '」的门道渡进了' + b.name + '的血脉。', 'success');
    if (typeof window.renderBeastList === 'function') window.renderBeastList();
};

// ==================== 第八十四波·进化线执行 + 疗伤喂丹 + 血脉繁育 ====================
// v19.19 进化模块的三笔烂账今天接通：
// ① evolve() 全库零调用——面板只亮「✨可进化」的提示却不给按钮，纯骗玩家；
// ② 受伤/丹药治疗 API 写好没人调——灵兽战倒等于没事；
// ③ 变异只在 tryMutate 里自嗨、繁育 breed() 造的是无人认领的孤儿账。
function _beastEvoBid(index) {
    var b = tamedBeasts[index];
    if (!b) return null;
    var bid = b.uid || (b.templateId + '_' + index);
    b.uid = bid;   // 与 tryRegisterTamedBeast 同口径：uid 一次认领终身不变
    return bid;
}

window.evolveBeastLine = function (index) {
    var b = tamedBeasts[index];
    if (!b || !window.BeastEvolution) return;
    var bid = _beastEvoBid(index);
    var can = window.BeastEvolution.canEvolve(bid);
    if (!can || !can.ok) {
        // 差什么说人话（canEvolve 的 missing 是机器账：bondDays/level/exp/affection）
        var _cn = { bondDays: '羁绊日数', level: '等级', exp: '历练', affection: '亲密度' };
        var miss = (can && can.missing && can.missing.length)
            ? can.missing.map(function (m) {
                return String(m).replace(/^(bondDays|level|exp|affection)/, function (k) { return _cn[k] || k; });
            }).join('、')
            : '血脉未入册';
        if (window.showMessage) window.showMessage('蜕变火候未到（' + miss + '）。', 'warning');
        return;
    }
    var r = window.BeastEvolution.evolve(bid);
    if (!r || !r.ok) { if (window.showMessage) window.showMessage('蜕变未成——血脉还差一线。', 'warning'); return; }
    var stageName = (typeof window.BeastEvolution.getStageName === 'function' && window.BeastEvolution.getStageName(bid)) || r.toStage;
    if (window.showMessage) window.showMessage('✨ ' + b.name + '周身灵光大放——形貌一变，蜕为「' + stageName + '」！伴生的增益也随之深了一层。', 'success');
    // 蜕变引动血脉：一次变异机会（金睛/火翼/冰鳞…，变异兽增益 ×1.5）
    try {
        var m = window.BeastEvolution.tryMutate(bid);
        if (m && m.ok && window.showMessage) window.showMessage('🌈 异象降临——' + b.name + '觉醒变异血脉「' + m.newTrait + '」，天赋增益更上一层！', 'success');
    } catch (eMut) {}
    saveBeastData();
    if (typeof window.renderBeastList === 'function') window.renderBeastList();
};

// 还伤丹三档 ↔ 现成疗伤丹（小还丹/大还丹/回春丹——药铺与炼丹都出）
var BEAST_PILL_TIERS = [
    { item: 'pill_spring_recovery', tier: 'major', name: '回春丹', heal: '疗伤六成' },
    { item: 'pill_big_recovery', tier: 'medium', name: '大还丹', heal: '疗伤四成' },
    { item: 'pill_small_recovery', tier: 'minor', name: '小还丹', heal: '疗伤两成' }
];

window.openBeastHealModal = function (index) {
    var b = tamedBeasts[index];
    if (!b || !window.BeastEvolution) return;
    var bid = _beastEvoBid(index);
    var st = window.BeastEvolution.getWoundStatus(bid);
    var hp = window.BeastEvolution.getHp(bid), mhp = window.BeastEvolution.getMaxHp(bid);
    var stTxt = st === 'critical' ? '伤重（力竭不应战）' : st === 'wounded' ? '带伤' : '完好';
    var html = '<p class="text-xs text-gray-400 mb-2">伤势：' + stTxt + ' · 气血 ' + Math.floor(hp) + '/' + mhp + '（静养每日自回一成）</p>';
    var any = false;
    BEAST_PILL_TIERS.forEach(function (p) {
        var n = beastCountItem(p.item);
        if (n > 0) {
            any = true;
            html += '<button onclick="healBeastWithPill(' + index + ', \'' + p.tier + '\')" class="w-full text-left bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm mb-1">💊 ' + p.name + ' ×' + n + '（' + p.heal + '）</button>';
        }
    });
    if (!any) html += '<p class="text-sm text-gray-500">手头没有疗伤丹药——药铺有售，或让它静养些时日。</p>';
    if (typeof window.showModal === 'function') window.showModal('🩹 灵兽疗伤 · ' + b.name, html);
};

window.healBeastWithPill = function (index, tier) {
    var b = tamedBeasts[index];
    if (!b || !window.BeastEvolution) return;
    var pill = null;
    BEAST_PILL_TIERS.forEach(function (p) { if (p.tier === tier) pill = p; });
    if (!pill) return;
    if (!beastConsumeItem(pill.item, 1)) { if (window.showMessage) window.showMessage('行囊里没有' + pill.name + '。', 'error'); return; }
    var bid = _beastEvoBid(index);
    var r = window.BeastEvolution.consumePill(bid, tier);
    if (!r || !r.ok) { if (window.showMessage) window.showMessage('丹药喂不进去——它没伤。', 'info'); return; }
    if (window.showMessage) window.showMessage('💊 ' + b.name + '把' + pill.name + '吞了，伤气渐平（气血 ' + Math.floor(r.hp) + '/' + r.maxHp + (r.full ? '，已无大碍）' : '）'), 'success');
    if (typeof window.renderBeastList === 'function') window.renderBeastList();
};

// 繁育：同进化线、双方成年以上、亲密度≥60；灵石500 + 一个时辰；每兽三十日一次
window.openBreedModal = function (index) {
    var b = tamedBeasts[index];
    if (!b || !window.BeastEvolution) return;
    var bidA = _beastEvoBid(index);
    var lineA = window.BeastEvolution.getLine(bidA);
    var stageA = window.BeastEvolution.getStage(bidA);
    if (!lineA) { if (window.showMessage) window.showMessage(b.name + ' 的血脉尚未入册。', 'warning'); return; }
    if (stageA !== 'adult' && stageA !== 'king') { if (window.showMessage) window.showMessage('须成年以上的灵兽方可配对。', 'warning'); return; }
    if ((b.affection || 0) < 60) { if (window.showMessage) window.showMessage(b.name + '与你还不算心意相通（亲密度需≥60）。', 'warning'); return; }
    var lineName = '';
    try { lineName = (window.BeastEvolution.listLines().filter(function (l) { return l.id === lineA; })[0] || {}).name || lineA; } catch (eL) { lineName = lineA; }
    var html = '<p class="text-xs text-gray-400 mb-2">' + lineName + '血脉配对：须同线成年以上、亲密度≥60；灵石500、耗时一个时辰、每兽三十日一次。子代随亲本物种，出壳即亲人，血脉特性半数遗传。</p>';
    var cands = 0;
    tamedBeasts.forEach(function (o, j) {
        if (j === index) return;
        var bidB = _beastEvoBid(j);
        if (window.BeastEvolution.getLine(bidB) !== lineA) return;
        var stB = window.BeastEvolution.getStage(bidB);
        if (stB !== 'adult' && stB !== 'king') return;
        if ((o.affection || 0) < 60) return;
        cands++;
        html += '<button onclick="breedBeasts(' + index + ',' + j + ')" class="w-full text-left bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm mb-1">💞 ' + o.name + '（Lv.' + (o.level || 1) + ' · 亲密' + (o.affection || 0) + '）</button>';
    });
    if (!cands) html += '<p class="text-sm text-gray-500">同系里没有合适的伴侣（同线、成年以上、亲密度≥60）。</p>';
    if (typeof window.showModal === 'function') window.showModal('💞 灵兽配对 · ' + b.name, html);
};

window.breedBeasts = function (ia, ib) {
    var a = tamedBeasts[ia], o = tamedBeasts[ib];
    if (!a || !o || ia === ib || !window.BeastEvolution) return;
    // 第八十八波·兽栏魂印：崽出壳也要烙魂印——满栏没窝，先拦后收钱
    if (tamedBeasts.length >= getBeastPenCap()) {
        if (window.showMessage) window.showMessage('兽栏满了（魂印 ' + tamedBeasts.length + '/' + getBeastPenCap() + '）——崽出壳也没窝安置，先放生一只再配对。', 'warning'); return;
    }
    var bidA = _beastEvoBid(ia), bidB = _beastEvoBid(ib);
    if (window.BeastEvolution.getLine(bidA) !== window.BeastEvolution.getLine(bidB)) { if (window.showMessage) window.showMessage('血脉不同线，配不成对。', 'warning'); return; }
    // 硬条件在执行口再验一遍（面板按钮只是入口，账不能只信门口）
    var _stA = window.BeastEvolution.getStage(bidA), _stB = window.BeastEvolution.getStage(bidB);
    if ((_stA !== 'adult' && _stA !== 'king') || (_stB !== 'adult' && _stB !== 'king')) { if (window.showMessage) window.showMessage('须成年以上的灵兽方可配对。', 'warning'); return; }
    if ((a.affection || 0) < 60 || (o.affection || 0) < 60) { if (window.showMessage) window.showMessage('亲密不足60，兽不肯配。', 'warning'); return; }
    var today = (typeof window.getAbsoluteDay === 'function') ? window.getAbsoluteDay() : 0;
    if ((a._lastBreedDay != null && today - a._lastBreedDay < 30) || (o._lastBreedDay != null && today - o._lastBreedDay < 30)) {
        if (window.showMessage) window.showMessage('它们刚育过一窝——三十日内不再配对。', 'warning'); return;
    }
    // 安家费走统一扣款口（双写钱包）
    var paid = false;
    if (window.XianXia && window.XianXia.DataManager && typeof window.XianXia.DataManager.deductSpiritStones === 'function') {
        paid = !!window.XianXia.DataManager.deductSpiritStones(500);
    } else {
        var curS = (window.inventory && window.inventory.currency) ? window.inventory.currency.spiritStones : 0;
        if (curS >= 500) {
            window.inventory.currency.spiritStones -= 500;
            if (window.currentCharData) window.currentCharData.spiritStones = window.inventory.currency.spiritStones;
            paid = true;
        }
    }
    if (!paid) { if (window.showMessage) window.showMessage('灵兽安家费要灵石500——钱不够，兽栏不肯腾窝。', 'error'); return; }
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') window.timeSystem.advanceTime(60, '灵兽配对');
    // 子代：物种随亲本甲、出壳即亲（70）、天赋半数随亲
    var tpl = BEAST_TEMPLATES[a.templateId] || BEAST_TEMPLATES[o.templateId] || {};
    var childTrait = (Math.random() < 0.5 && a.trait) ? a.trait : ((Math.random() < 0.5 && o.trait) ? o.trait : rollBeastTrait());
    tamedBeasts.push({
        templateId: a.templateId || o.templateId,
        name: tpl.name || a.name,
        level: 1, exp: 0, affection: 70,
        skills: (tpl.skills || []).slice(),
        combatAbilities: [],
        trait: childTrait,
        mount: tpl.mount ? Object.assign({}, tpl.mount) : null
    });
    a._lastBreedDay = today; o._lastBreedDay = today;
    saveBeastData();
    var childIdx = tamedBeasts.length - 1;
    tryRegisterTamedBeast(childIdx);   // 图鉴 + 进化线入册（uid 一并认领）
    // 血脉特性遗传：借 breed() 的继承账，落到子代真身，孤儿账当场销掉
    try {
        var br = window.BeastEvolution.breed(bidA, bidB);
        if (br && br.ok) {
            if (typeof window.BeastEvolution.grantTraits === 'function') {
                window.BeastEvolution.grantTraits(tamedBeasts[childIdx].uid, br.inherited);
            }
            if (typeof window.BeastEvolution.forget === 'function') window.BeastEvolution.forget(br.childId);
        }
    } catch (eBreed) {}
    if (window.showMessage) window.showMessage('💞 一窝新崽——' + (tpl.name || '幼兽') + '出壳就认了你，蹭着你的手心不肯撒口。', 'success');
    if (typeof window.renderBeastList === 'function') window.renderBeastList();
};

// ==================== v20.9 灵兽坊·真实购入 ====================
// 此前灵兽坊只跳面板不卖兽。店铺卖的是各家驯兽行当养大的幼兽——血脉是好的，
// 但都从 Lv.1 养起（付的是血脉钱不是战力钱），与野外收服同一起跑线；
// 买兽吃灵石（ DataManager 真源）+ 安顿时辰，不设日限。进化形态不外卖。
var BEAST_SHOP_STOCK = {
    wind_wolf:    { price: 200,  gloss: '山场放养大的猎兽，认主快' },
    spirit_fox:   { price: 260,  gloss: '狐崽眼里有灵气，亲近人' },
    flame_tiger:  { price: 400,  gloss: '南疆火种，毛下温热的' },
    ice_serpent:  { price: 550,  gloss: '冰窖里孵出来的，性子凉' },
    shadow_panther: { price: 750, gloss: '自幼蒙眼养大的，只认一个影子' },
    thunder_eagle: { price: 1200, gloss: '雏鹰剪了翅，肯载人' },
    dragon_turtle: { price: 1800, gloss: '洛水牧场养了三十年的种，难得有崽' },
    fire_phoenix: { price: 2600, gloss: '一生只见一次的凤雏，铺子也攒了半辈子运气' }
};

function buyBeast(templateId) {
    var tpl = BEAST_TEMPLATES[templateId];
    var stock = BEAST_SHOP_STOCK[templateId];
    if (!tpl || !stock || tpl.catchable === false) {
        if (window.showMessage) window.showMessage('铺子掌柜摇头：这兽，铺子里没有。', 'warning');
        return false;
    }
    // 第八十八波·兽栏魂印：满栏买不进（先拦后收钱——钱货两讫前把话说清）
    if (tamedBeasts.length >= getBeastPenCap()) {
        if (window.showMessage) window.showMessage('掌柜看了看你身后的兽群，摆手道：「客官，您的灵识分不出更多魂印了（' + tamedBeasts.length + '/' + getBeastPenCap() + '）——先安置好现有的，再来接新崽。」', 'warning');
        return false;
    }
    var price = stock.price;
    // 灵石真源：DataManager 优先，退回背包现金/角色数据（与全城买账同一口径）
    var paid = false;
    if (window.XianXia && window.XianXia.DataManager && typeof window.XianXia.DataManager.deductSpiritStones === 'function') {
        paid = !!window.XianXia.DataManager.deductSpiritStones(price);
    } else if (window.inventory && window.inventory.currency && (window.inventory.currency.spiritStones || 0) >= price) {
        window.inventory.currency.spiritStones -= price;
        if (window.currentCharData) window.currentCharData.spiritStones = window.inventory.currency.spiritStones;
        paid = true;
    } else if (window.currentCharData && (window.currentCharData.spiritStones || 0) >= price) {
        window.currentCharData.spiritStones -= price;
        paid = true;
    }
    if (!paid) {
        if (window.showMessage) window.showMessage('灵石不够——「' + tpl.name + '」幼兽要 ' + price + ' 灵石，钱不够兽不松手。', 'warning');
        return false;
    }
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(15, '灵兽坊买兽');
    }
    tamedBeasts.push({
        templateId: templateId,
        name: tpl.name,
        level: 1,
        exp: 0,
        affection: 45, // 驯化过的幼兽：亲人，但还没到你疼它的份上
        skills: (tpl.skills || []).slice(),
        combatAbilities: [],
        trait: rollBeastTrait(),
        mount: tpl.mount ? Object.assign({}, tpl.mount) : null
    });
    saveBeastData();
    // 第八十八波顺手修：买来的兽此前不入图鉴、不认 uid、不挂血脉线——
    // 铺子买的灵狐永远走不了狐线蜕变，图鉴上也查无此兽。银货两讫就该入册，与野外收服同口径。
    tryRegisterTamedBeast(tamedBeasts.length - 1);
    if (window.showMessage) window.showMessage('🐾 银货两讫，「' + tpl.name + '」幼兽拿草茎戳了戳你的手背。', 'success');
    if (typeof window.renderBeastList === 'function') window.renderBeastList();
    return true;
}

// 面板重开用（showModal 按钮回调走 window 全局）
window.buyBeastFromShop = function (templateId) {
    var okBuy = buyBeast(templateId);
    if (okBuy && typeof window.openBeastShop === 'function') window.openBeastShop();
    return okBuy;
};

// ==================== 第八十八波·兽栏同栖录：放生 / 小名 / 缚兽符 ====================
// 散修的兽栏不是仓库：养不下的送回山野（放生），养着的叫得出名字（小名），
// 抓的时候有正经家什（缚兽符——此前收服账上的 spec_beast_trap 全库查无此物，+25% 是句空话）。

// 灵兽坊捎带卖缚兽符（80灵石）——驯兽行当的符纸铺子里自然有
window.BEAST_SEAL_PRICE = 80;
window.buyBeastSealFromShop = function () {
    var price = window.BEAST_SEAL_PRICE;
    var paid = false;
    if (window.XianXia && window.XianXia.DataManager && typeof window.XianXia.DataManager.deductSpiritStones === 'function') {
        paid = !!window.XianXia.DataManager.deductSpiritStones(price);
    } else if (window.inventory && window.inventory.currency && (window.inventory.currency.spiritStones || 0) >= price) {
        window.inventory.currency.spiritStones -= price;
        if (window.currentCharData) window.currentCharData.spiritStones = window.inventory.currency.spiritStones;
        paid = true;
    } else if (window.currentCharData && (window.currentCharData.spiritStones || 0) >= price) {
        window.currentCharData.spiritStones -= price;
        paid = true;
    }
    if (!paid) {
        if (window.showMessage) window.showMessage('缚兽符要 ' + price + ' 灵石——钱不够，掌柜把符纸收回了柜里。', 'warning');
        return false;
    }
    var got = 0;
    if (typeof window.addItem === 'function') got = window.addItem('tal_beast_seal', 1) ? 1 : 0;
    if (!got) {
        // 背包满：钱已扣就得给货——塞不进货架原样退钱，不能吞客人的灵石
        if (window.XianXia && window.XianXia.DataManager && typeof window.XianXia.DataManager.addSpiritStones === 'function') {
            window.XianXia.DataManager.addSpiritStones(price);
        } else if (window.inventory && window.inventory.currency) {
            window.inventory.currency.spiritStones += price;
            if (window.currentCharData) window.currentCharData.spiritStones = window.inventory.currency.spiritStones;
        }
        if (window.showMessage) window.showMessage('行囊满了，符纸塞不下——灵石退回。', 'error');
        return false;
    }
    if (typeof window.updateInventoryUI === 'function') window.updateInventoryUI();
    if (window.showMessage) window.showMessage('📜 买下一道缚兽符——收服时掷出，符力成缚，兽挣脱不得（成功率+25%）。', 'success');
    if (typeof window.openBeastShop === 'function') window.openBeastShop();
    return true;
};

// 小名：确认弹窗 + 落账（改的只是 petName 展示层，物种账 b.name 不动）
window.openRenameBeastModal = function (index) {
    var b = tamedBeasts[index];
    if (!b) return;
    var html = '<p class="text-xs text-gray-400 mb-2">给它起个小名——往后你唤它，它应的是这个名字。（至多六个字，留空则唤回本名「' + b.name + '」）</p>'
        + '<input id="beast-rename-input" type="text" maxlength="6" value="' + (b.petName || '') + '" placeholder="' + b.name + '" class="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm mb-3">'
        + '<button onclick="confirmRenameBeast(' + index + ')" class="w-full bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-2 rounded text-sm">就这么叫它</button>';
    if (typeof window.showModal === 'function') window.showModal('✏️ 起个小名 · ' + b.name, html);
};
window.confirmRenameBeast = function (index) {
    var b = tamedBeasts[index];
    if (!b) return false;
    var el = (typeof document !== 'undefined' && document.getElementById) ? document.getElementById('beast-rename-input') : null;
    var v = el && el.value ? String(el.value).trim() : '';
    // 只留能看的字：去首尾空白、截六个字；物种账不许碰
    v = v.replace(/\s+/g, '').slice(0, 6);
    if (v) b.petName = v; else delete b.petName;
    saveBeastData();
    if (window.showMessage) window.showMessage(v ? '🐾 你唤了声「' + v + '」——' + b.name + '竖起的耳朵动了动，应下了这个名字。' : '🐾 还是唤它本名「' + b.name + '」。', 'success');
    if (typeof window.renderBeastList === 'function') window.renderBeastList();
    return true;
};

// 放生：先弹确认（放走就回不来了），再落账
window.openReleaseBeastModal = function (index) {
    var b = tamedBeasts[index];
    if (!b) return;
    var nm = beastDisplayName(b);
    var html = '<p class="text-sm text-gray-300 mb-2">把「' + nm + '」放回山野？</p>'
        + '<p class="text-xs text-gray-400 mb-3">放走就回不来了。若在它家乡的地界放生，它认得回家的路——兽径手记会记下这条确讯，驭兽阅历也长得更多。</p>'
        + '<button onclick="releaseBeastNow(' + index + ')" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded text-sm mb-1">🕊️ 打开兽栏，放它走</button>'
        + '<button onclick="this.closest(\'#xianxia-modal-overlay\') && this.closest(\'#xianxia-modal-overlay\').remove()" class="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded text-sm">再养养</button>';
    if (typeof window.showModal === 'function') window.showModal('🕊️ 放生 · ' + nm, html);
};
window.releaseBeastNow = function (index) {
    var b = tamedBeasts[index];
    if (!b) return false;
    var bid = b.uid || (b.templateId + '_' + index);
    var nm = beastDisplayName(b);
    // 家乡地界判定：当前地区在它分布账上（进化形态无分布账，走寻常放生）
    var homeRegion = null, homeTerrain = null;
    try {
        var regionNow = getCurrentRegionName();
        var dist = (window.BeastLore && typeof window.BeastLore.distOfTemplate === 'function') ? window.BeastLore.distOfTemplate(b.templateId) : null;
        if (dist && regionNow && dist.regions && dist.regions.indexOf(regionNow) >= 0) {
            homeRegion = regionNow;
            if (window.WildGround && typeof window.WildGround.cell === 'function') {
                var cell = window.WildGround.cell();
                if (cell && cell.terrainKey) homeTerrain = cell.terrainKey;
            }
        }
    } catch (eHome) {}
    tamedBeasts.splice(index, 1);
    // 出战/骑乘指针跟着挪（放走的若是当值兽，摘牌）
    if (activeBeastIndex === index) activeBeastIndex = -1;
    else if (activeBeastIndex > index) activeBeastIndex--;
    if (activeMountIndex === index) activeMountIndex = -1;
    else if (activeMountIndex > index) activeMountIndex--;
    // 清账：血脉账销册、灵兽园除名——不留孤儿账
    try { if (window.BeastEvolution && typeof window.BeastEvolution.forget === 'function') window.BeastEvolution.forget(bid); } catch (eForget) {}
    try {
        if (window.BeastGarden && typeof window.BeastGarden.listGardens === 'function') {
            window.BeastGarden.listGardens().forEach(function (g) {
                if ((g.beasts || []).indexOf(bid) >= 0 && typeof window.BeastGarden.removeBeast === 'function') {
                    window.BeastGarden.removeBeast(g.gardenId, bid);
                }
            });
        }
    } catch (eGarden) {}
    saveBeastData();
    if (homeRegion) {
        // 家乡放生：它认得路——手记落一笔确讯，驭兽阅历+4
        try {
            if (window.BeastLore && typeof window.BeastLore.learnFromSighting === 'function') {
                window.BeastLore.learnFromSighting(b.templateId, homeRegion, homeTerrain || null, '亲手放生');
            }
        } catch (eLearn) {}
        if (typeof window.growLifeSkill === 'function') window.growLifeSkill('驭兽', 4, { reason: '送兽归山' });
        if (window.showMessage) window.showMessage('🕊️ 你在' + homeRegion + '打开兽栏——' + nm + '绕着你转了两圈，一步三回头地奔入山野。它认得回家的路，手记记下：往后这里就是它的家。（驭兽阅历+4）', 'success');
    } else {
        if (typeof window.growLifeSkill === 'function') window.growLifeSkill('驭兽', 1, { reason: '放生灵兽' });
        if (window.showMessage) window.showMessage('🕊️ 你放走了' + nm + '——它原地站了一会儿，转身没入草丛，没有回头。（在它的家乡地界放生，手记才记得下去处）', 'info');
    }
    if (typeof window.renderBeastList === 'function') window.renderBeastList();
    return true;
};

// 导出
window.BEAST_TEMPLATES = BEAST_TEMPLATES;
window.BEAST_SHOP_STOCK = BEAST_SHOP_STOCK;
window.buyBeast = buyBeast;
window.tamedBeasts = tamedBeasts;
window.activeBeastIndex = activeBeastIndex;
window.initBeastTaming = initBeastTaming;
window.trainBeast = trainBeast;
window.evolveBeast = evolveBeast;
window.tryEvolveBeast = tryEvolveBeast;
window.setActiveBeast = setActiveBeast;
window.setActiveMount = setActiveMount;
window.getActiveBeast = getActiveBeast;
window.getActiveMount = getActiveMount;
window.getMountTravelTimeMultiplier = getMountTravelTimeMultiplier;
window.getActiveBeastCombatData = getActiveBeastCombatData;
window.getMountCombatData = getMountCombatData;
window.onBeastBattleEnd = onBeastBattleEnd;
window.sweepInvalidBeastLines = sweepInvalidBeastLines;
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
// 第八十八波·兽栏同栖录
window.beastDisplayName = beastDisplayName;
window.getBeastPenCap = getBeastPenCap;
