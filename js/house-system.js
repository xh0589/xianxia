/**
 * house-system.js - 洞府系统 v7.1 P0-4
 * 购买/升级/储物扩容/修炼加成/灵田种植
 */

var HOUSE_TYPES = {
    // 第一百零四波·山居：最开始只有破山洞——免费占山落脚，石壁漏风；修缮全走下面的工料图样
    ruin: { name: '破山洞', icon: '🪨', price: 0, level: 0, bonuses: { cultivation: 1.0, storage: 5 }, plotSlots: 1 },
    cave: { name: '简易洞府', icon: '🕳️', price: 1000, level: 1, bonuses: { cultivation: 1.1, storage: 10 }, plotSlots: 2 },
    courtyard: { name: '庭院洞府', icon: '🏡', price: 5000, level: 2, bonuses: { cultivation: 1.2, storage: 20, herb: 1.1 }, plotSlots: 4 },
    mansion: { name: '灵山庄园', icon: '🏯', price: 20000, level: 3, bonuses: { cultivation: 1.3, storage: 40, herb: 1.2, forging: 1.1 }, plotSlots: 6 },
    palace: { name: '仙府', icon: '🏰', price: 100000, level: 4, bonuses: { cultivation: 1.5, storage: 80, herb: 1.3, forging: 1.2, alchemy: 1.2 }, plotSlots: 8 }
};

// 可种植作物
var HOUSE_CROPS = {
    lingzhi: { name: '灵芝', icon: '🍄', growDays: 3, seedId: 'mat_lingzhi', yieldId: 'mat_lingzhi', yieldCount: 2, herbBonus: true },
    ginseng: { name: '人参', icon: '🌿', growDays: 4, seedId: 'mat_ginseng', yieldId: 'mat_ginseng', yieldCount: 2, herbBonus: true },
    spirit_grass: { name: '灵草', icon: '🌱', growDays: 2, seedId: null, yieldId: 'mat_spirit_grass', yieldCount: 3, free: true },
    snow_lotus: { name: '雪莲', icon: '💮', growDays: 5, seedId: 'mat_snow_lotus', yieldId: 'mat_snow_lotus', yieldCount: 1, herbBonus: true }
};

// v20.44 及时收成：熟后三日不采即蔫——灵植不等懒汉
var CROP_GRACE_DAYS = 3;

// v20.44 家具：死字段通电——每件家具一份实在的加成，随 playerHouse 整体随档走
var HOUSE_FURNITURE = {
    mat: { name: '聚灵蒲团', icon: '🧘', price: 800, desc: '洞府修炼效率+5%', bonus: { cultivation: 0.05 } },
    stove: { name: '暖玉炉', icon: '🔥', price: 1200, desc: '灵田地温足，生长期缩短（herb+0.25）', bonus: { herb: 0.25 } },
    lamp: { name: '聚灵灯', icon: '🏮', price: 600, desc: '储物+5格', bonus: { storage: 5 } }
};

var playerHouse = null; // { type, upgrades, furniture, planted: [{cropId, plantDay, readyDay}], storageApplied }

function exportHouseState() {
    return playerHouse ? JSON.parse(JSON.stringify(playerHouse)) : null;
}

function importHouseState(data) {
    playerHouse = data ? JSON.parse(JSON.stringify(data)) : null;
    _normalizeCaveSite();   // 第一百零三波：轮回/转档进来也把坐落认到洞天上
    window.playerHouse = playerHouse;
    try {
        if (playerHouse) localStorage.setItem('xianxia_house', JSON.stringify(playerHouse));
        else localStorage.removeItem('xianxia_house');
    } catch (e) {}
    if (typeof applyHouseStorageBonus === 'function') applyHouseStorageBonus();
    _syncCaveLevel();
}

function initHouseSystem() {
    try {
        var saved = localStorage.getItem('xianxia_house');
        if (saved) playerHouse = JSON.parse(saved);
    } catch (e) {}
    // 第一百零三波 · 老档归一：旧存档没有 location（或存的是一百零二波的城名）——统统认到对应州的洞天
    _normalizeCaveSite();
    // 同步储物扩容
    applyHouseStorageBonus();
    _syncCaveLevel();
    window.playerHouse = playerHouse;
    if (playerHouse && playerHouse.location) { try { saveHouseData(); } catch (e2) {} }
}

function saveHouseData() {
    try { localStorage.setItem('xianxia_house', JSON.stringify(playerHouse)); } catch (e) {}
    window.playerHouse = playerHouse;
}

// ==================== 第一百零二波 · 择地而居（第一百零三波改定：洞府在野不在城） ====================
// 洞府扎根在野外的固定洞天——每州一处，天下共七处；州与州的路程全走「天下疆界」的关隘账
//（WorldMap：接壤/里数/时辰/脚力/关隘上的事），不另造一本。
// 第一百零六波 · 七处洞天各有脾气：每座山一条地脉，脉气只养一桩营生——
// 落户与迁址从此是真抉择（想炼丹去丹霞、想炼器去玉门、灵兽安家去雾屿……），不再只是换个地名。
// 地脉是山的性子，随洞天走、不入存档——宅基落在哪座山，就吃哪条脉，迁址即换脉。
var CAVE_SITES = {
    taixu:     { id: 'taixu',     name: '太虚山麓', region: '中州',     desc: '中脉山麓，云海退时能望见上古石门的轮廓。', ley: { kind: 'cultivation', pct: 5,  name: '中脉', text: '中脉地气贯通山麓，吐纳格外顺畅（修炼 +5%）' } },
    canglin:   { id: 'canglin',   name: '苍林深谷', region: '东荒',     desc: '林海深处古木蔽天，涧边灵药自生自灭。', ley: { kind: 'herb',        pct: 15, name: '药香', text: '涧边灵药自生自灭，拨草采药多得几分（采药 +15%）' } },
    danxia:    { id: 'danxia',    name: '丹霞洞天', region: '南疆',     desc: '赤崖里的洞天，火云终年暖谷，丹气不散。', ley: { kind: 'alchemy',     pct: 8,  name: '丹火', text: '火云终年暖谷，丹炉得了地火之利（炼丹 +8%）' } },
    yumen:     { id: 'yumen',     name: '玉门隐峡', region: '西漠',     desc: '古道外的隐峡，黄沙不入谷底，一线泉水穿峡。', ley: { kind: 'forging',   pct: 8,  name: '金气', text: '古道金气沁入峡壁，锤砧上顺手几分（炼器 +8%）' } },
    hanshuang: { id: 'hanshuang', name: '寒霜崖窟', region: '北冥',     desc: '冰原上的崖窟，寒玉为床，极光入窗。', ley: { kind: 'mining',      pct: 15, name: '矿脉', text: '冰原之下矿脉凝而不散，镐下多得（采矿 +15%）' } },
    qingcheng: { id: 'qingcheng', name: '青城后山', region: '蜀地',     desc: '道门祖庭的后山，剑气擦着松梢过，云雾锁石阶。', ley: { kind: 'wood',   pct: 15, name: '林海', text: '云雾养松柏，斧落木应（伐木 +15%）' } },
    wuyu:      { id: 'wuyu',      name: '雾屿岛',   region: '东南海域', desc: '烟波外的小屿，潮信守门，渔火点点。', ley: { kind: 'beast',       pct: 20, name: '兽缘', text: '雾障拢着岛屿，灵兽住得安心（灵兽训练 +20%）' } }
};
var SITE_BY_REGION = {};
(function () { for (var k in CAVE_SITES) SITE_BY_REGION[CAVE_SITES[k].region] = k; })();

function _normCityName(s) { return String(s || '').replace(/\s+/g, ''); }

/** 这座城归哪一州（借天下舆图的城池名录） */
function _regionOfCity(city) {
    var norm = _normCityName(city);
    if (!norm) return null;
    var md = window.mapData || {};
    for (var r in md) {
        var cs = (md[r] && md[r].cities) || [];
        for (var i = 0; i < cs.length; i++) {
            if (_normCityName(cs[i]) === norm) return r;
        }
    }
    return null;
}

/** 人此刻在哪一州——优先问天下疆界的账（它认得野外/城池/位面），问不着就自己按城池名录翻 */
function currentRegionOfPlayer() {
    try {
        if (window.WorldMap && typeof window.WorldMap.currentRegion === 'function') {
            var r = window.WorldMap.currentRegion();
            if (r) return r;
        }
    } catch (e) {}
    var loc = null;
    try {
        if (window.locationSystem && typeof window.locationSystem.getCurrentLocation === 'function') {
            loc = window.locationSystem.getCurrentLocation();
        }
    } catch (e2) {}
    if (!loc) { try { loc = window.currentCharData && window.currentCharData.location; } catch (e3) {} }
    if (!loc) return null;
    var s = String(loc).replace(/\s+/g, '');
    if (/^灵界/.test(s)) return '灵界';
    if (/^魔界/.test(s)) return '魔界';
    return _regionOfCity(loc);
}

/** 没指明山场时的落脚：人在哪一州，宅基就落哪一州的山里；再判不出就落太虚山麓 */
function defaultCaveSite() {
    var reg = currentRegionOfPlayer();
    return (reg && SITE_BY_REGION[reg]) || 'taixu';
}

/** 把「城名/州名/洞天id」都认成洞天id——老档（一百零二波存的是城名）也从这里归一 */
function _resolveSiteId(v) {
    if (!v) return null;
    var s = String(v);
    if (CAVE_SITES[s]) return s;
    var reg = _regionOfCity(s);          // 老档存的是城名
    if (!reg) reg = SITE_BY_REGION[s] ? s : null;   // 存的是州名
    if (reg && SITE_BY_REGION[reg]) return SITE_BY_REGION[reg];
    return null;
}

function getHouseLocation() {
    return (playerHouse && playerHouse.location) || null;
}

/** 洞府坐落的洞天（{id,name,region,desc}），没有宅子返回 null */
function getHouseSite() {
    var loc = getHouseLocation();
    return (loc && CAVE_SITES[loc]) || null;
}

/** 老档归一：一百零二波存的城名、更早的没有坐落——统统认到对应州的洞天上，其余分毫不动 */
function _normalizeCaveSite() {
    if (!playerHouse || !playerHouse.type) return;
    var resolved = _resolveSiteId(playerHouse.location);
    if (!resolved) {
        var reg = playerHouse.location ? _regionOfCity(playerHouse.location) : null;
        if (!reg) reg = currentRegionOfPlayer();
        resolved = (reg && SITE_BY_REGION[reg]) || 'taixu';
    }
    playerHouse.location = resolved;
}

/** 人是否在自家洞府所在州（洞府在野，同城同州都算「在山脚下」；判不出人在哪儿一律按在家算，不拦旧行为） */
function isAtHome() {
    var site = getHouseSite();
    if (!site) return true;
    var reg = currentRegionOfPlayer();
    if (!reg) return true;
    return reg === site.region;
}

/** 迁址：拆阵、搬灵田都是钱——收现价三成的迁址费，灵植以法宝收移一株不损 */
function relocateHouse(siteId) {
    if (!playerHouse || !playerHouse.type) {
        if (window.showMessage) window.showMessage('尚未拥有洞府', 'warning');
        return false;
    }
    var site = CAVE_SITES[_resolveSiteId(siteId) || ''];
    if (!site) {
        if (window.showMessage) window.showMessage('天下洞天就那七处，没有这个地方。', 'error');
        return false;
    }
    if (site.id === playerHouse.location) {
        if (window.showMessage) window.showMessage('洞府已经坐落此地，无须再迁。', 'info');
        return false;
    }
    var t = HOUSE_TYPES[playerHouse.type];
    var cost = Math.round(((t && t.price) || 1000) * 0.3);
    if (!window.inventory || window.inventory.currency.spiritStones < cost) {
        if (window.showMessage) window.showMessage('灵石不足（迁址需 ' + cost + '——拆阵、搬运灵田都要钱）', 'error');
        return false;
    }
    window.inventory.currency.spiritStones -= cost;
    playerHouse.location = site.id;
    if (window.updateCurrencyUI) window.updateCurrencyUI();
    saveHouseData();
    if (window.showMessage) window.showMessage('🏡 洞府迁至「' + site.region + ' · ' + site.name + '」——灵田灵植以法宝收移，一株未损。（迁址费 ' + cost + ' 灵石）', 'success');
    if (typeof window.renderHouseStatus === 'function') window.renderHouseStatus();
    return true;
}

// ==================== 第一百零四波 · 山居营造（破山洞起步，材料修出宅院） ====================
// 修缮图样：一级一级修——灵石 + 工料（材料真扣）+ 工期（时辰真进世界钟）
var UPGRADE_RECIPES = {
    cave:      { from: 'ruin',      stones: 300,   minutes: 240,  label: '砌墙架梁，把漏风的石壁收拾成洞府',
                 materials: [{ itemId: 'mat_wood', count: 20 }, { itemId: 'mat_iron_ore', count: 10 }] },
    courtyard: { from: 'cave',      stones: 4000,  minutes: 480,  label: '扩出院落，栽竹引泉',
                 materials: [{ itemId: 'mat_spirit_wood', count: 5 }, { itemId: 'mat_refined_iron', count: 5 }] },
    mansion:   { from: 'courtyard', stones: 15000, minutes: 720,  label: '依山起楼，灵脉入户',
                 materials: [{ itemId: 'mat_refined_iron', count: 10 }, { itemId: 'mat_spirit_wood', count: 10 }, { itemId: 'mat_ice_crystal', count: 3 }] },
    palace:    { from: 'mansion',   stones: 80000, minutes: 1440, label: '移山为屏，点石成宫',
                 materials: [{ itemId: 'mat_meteorite', count: 5 }, { itemId: 'mat_star_iron', count: 3 }, { itemId: 'mat_spirit_wood', count: 20 }] }
};

function _matName(itemId) {
    try {
        var t = (window.itemById || {})[itemId];
        if (t && t.name) return t.name;
    } catch (e) {}
    var fallback = { mat_wood: '木材', mat_spirit_wood: '灵木', mat_iron_ore: '铁矿石', mat_copper_ore: '铜矿石', mat_refined_iron: '精铁', mat_ice_crystal: '冰晶', mat_meteorite: '陨铁', mat_star_iron: '星辰铁' };
    return fallback[itemId] || itemId;
}

function _countMat(itemId) {
    try {
        var slots = (window.inventory && window.inventory.slots) || [];
        var c = 0;
        for (var i = 0; i < slots.length; i++) {
            var s = slots[i];
            if (s && s.templateId === itemId) c += Number(s.count) || 0;
        }
        return c;
    } catch (e) { return 0; }
}

function _consumeMat(itemId, need) {
    if (_countMat(itemId) < need) return false;
    try {
        var slots = window.inventory.slots;
        for (var i = 0; i < slots.length && need > 0; i++) {
            var s = slots[i];
            if (s && s.templateId === itemId) {
                var take = Math.min(Number(s.count) || 0, need);
                s.count -= take;
                need -= take;
                if (s.count <= 0) window.inventory.slots[i] = null;
            }
        }
    } catch (e) { return false; }
    return true;
}

/** 当前宅型对应的下一张修缮图样（没有下一级返回 null） */
function getRepairRecipe(fromType) {
    var cur = fromType || (playerHouse && playerHouse.type);
    for (var target in UPGRADE_RECIPES) {
        if (UPGRADE_RECIPES[target].from === cur) {
            return { target: target, targetName: HOUSE_TYPES[target] ? HOUSE_TYPES[target].name : target, recipe: UPGRADE_RECIPES[target] };
        }
    }
    return null;
}

/** 占山：免费领一处破山洞落脚（没宅子的人才占得了） */
function _syncCaveLevel() {
    // 第一百零四波：宅型一改，设施位档位当场跟上（不等世界日结）
    try {
        if (window.CaveFacilities && typeof window.CaveFacilities.ensureCave === 'function' && playerHouse && playerHouse.type) {
            var map = { ruin: 'ruin_cave', cave: 'grass_hut', courtyard: 'stone_room', mansion: 'spirit_manor', palace: 'immortal_manor' };
            window.CaveFacilities.ensureCave('player', map[playerHouse.type] || 'grass_hut');
        }
    } catch (e) {}
}

function claimRuin() {
    if (playerHouse && playerHouse.type) {
        if (window.showMessage) window.showMessage('你已经有落脚处了，占两处的山没意义。', 'warning');
        return false;
    }
    playerHouse = { type: 'ruin', upgrades: {}, furniture: [], planted: [], storageApplied: 0, location: defaultCaveSite() };
    applyHouseStorageBonus();
    _syncCaveLevel();
    saveHouseData();
    if (window.showMessage) window.showMessage('⛰️ 你寻着前人弃置的破山洞，扫去碎石枯叶，先落脚了——石壁漏风，灵田就一畦，材料齐了再一步步修成真宅院。', 'success');
    if (typeof window.renderHouseStatus === 'function') window.renderHouseStatus();
    return true;
}

/** 修缮扩建：按图样扣灵石+工料+工期，宅型升一级——一级一级修，不许跳 */
function repairHouse(targetType) {
    if (!playerHouse || !playerHouse.type) {
        if (window.showMessage) window.showMessage('你还没有落脚处——先占一处破山洞，或置办一处现成宅院。', 'warning');
        return false;
    }
    var recipe = UPGRADE_RECIPES[targetType];
    var t = HOUSE_TYPES[targetType];
    if (!recipe || !t) {
        if (window.showMessage) window.showMessage('没有这张修缮图样。', 'error');
        return false;
    }
    if (playerHouse.type !== recipe.from) {
        var fromName = HOUSE_TYPES[recipe.from] ? HOUSE_TYPES[recipe.from].name : recipe.from;
        if (window.showMessage) window.showMessage('修缮得一级一级来——这张图样是从「' + fromName + '」修起，你现在是「' + (HOUSE_TYPES[playerHouse.type] || {}).name + '」。', 'warning');
        return false;
    }
    if (!window.inventory || window.inventory.currency.spiritStones < recipe.stones) {
        if (window.showMessage) window.showMessage('灵石不足（修缮需 ' + recipe.stones + '）', 'error');
        return false;
    }
    var missing = [];
    recipe.materials.forEach(function (m) {
        var have = _countMat(m.itemId);
        if (have < m.count) missing.push(_matName(m.itemId) + ' ' + have + '/' + m.count);
    });
    if (missing.length) {
        if (window.showMessage) window.showMessage('工料不齐：' + missing.join('、') + '——伐木采矿攒齐了再动工。', 'error');
        return false;
    }
    window.inventory.currency.spiritStones -= recipe.stones;
    recipe.materials.forEach(function (m) { _consumeMat(m.itemId, m.count); });
    playerHouse.type = targetType;
    if (window.updateCurrencyUI) window.updateCurrencyUI();
    applyHouseStorageBonus();
    _syncCaveLevel();
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        try { window.timeSystem.advanceTime(recipe.minutes, '修缮洞府'); } catch (eT) {}
    }
    saveHouseData();
    if (window.showMessage) window.showMessage('🏗️ 动工' + Math.round(recipe.minutes / 60) + '个时辰——「' + t.name + '」落成！' + recipe.label + '。', 'success');
    if (typeof window.renderHouseStatus === 'function') window.renderHouseStatus();
    return true;
}

function buyHouse(type, siteId) {
    var house = HOUSE_TYPES[type];
    if (!house) return false;
    if (type === 'ruin') return claimRuin();   // 破山洞不走买卖——占山是免费的
    if (playerHouse && playerHouse.type) {
        // 允许升级换购：补差价
        var old = HOUSE_TYPES[playerHouse.type];
        if (old && house.level <= old.level) {
            if (window.showMessage) window.showMessage('已拥有同级或更高级洞府', 'warning');
            return false;
        }
        var diff = house.price - (old ? old.price : 0);
        if (!window.inventory || window.inventory.currency.spiritStones < diff) {
            if (window.showMessage) window.showMessage('灵石不足（需差价 ' + diff + '）', 'error');
            return false;
        }
        window.inventory.currency.spiritStones -= diff;
        playerHouse.type = type;
        if (window.showMessage) window.showMessage('洞府升级为「' + house.name + '」！', 'success');
    } else {
        // 择山营造：指明洞天就落那儿；没指明落当前所在州的山里；再判不出落太虚山麓。
        // 老口子传城名也认（一百零二波的调用）——认到那座城所在州的洞天。
        var sid = siteId ? _resolveSiteId(siteId) : null;
        if (siteId && !sid) {
            if (window.showMessage) window.showMessage('天下洞天就那七处，「' + siteId + '」扎不下宅基。', 'error');
            return false;
        }
        if (!sid) sid = defaultCaveSite();
        if (!window.inventory || window.inventory.currency.spiritStones < house.price) {
            if (window.showMessage) window.showMessage('灵石不足', 'error');
            return false;
        }
        window.inventory.currency.spiritStones -= house.price;
        playerHouse = { type: type, upgrades: {}, furniture: [], planted: [], storageApplied: 0, location: sid };
        var _site = CAVE_SITES[sid];
        if (window.showMessage) window.showMessage('购得「' + house.name + '」，宅基落在「' + (_site ? _site.region + ' · ' + _site.name : sid) + '」！', 'success');
    }
    if (window.updateCurrencyUI) window.updateCurrencyUI();
    applyHouseStorageBonus();
    _syncCaveLevel();
    saveHouseData();
    if (typeof window.renderHouseStatus === 'function') window.renderHouseStatus();
    return true;
}

function upgradeHouse(upgradeType) {
    if (!playerHouse) {
        if (window.showMessage) window.showMessage('尚未拥有洞府', 'warning');
        return false;
    }
    var cost = 500 * (Object.keys(playerHouse.upgrades || {}).length + 1);
    if (window.inventory && window.inventory.currency.spiritStones >= cost) {
        window.inventory.currency.spiritStones -= cost;
        playerHouse.upgrades = playerHouse.upgrades || {};
        playerHouse.upgrades[upgradeType] = (playerHouse.upgrades[upgradeType] || 0) + 1;
        if (window.updateCurrencyUI) window.updateCurrencyUI();
        if (upgradeType === 'storage') applyHouseStorageBonus();
        saveHouseData();
        if (window.showMessage) window.showMessage('洞府「' + upgradeType + '」升级成功', 'success');
        if (typeof window.renderHouseStatus === 'function') window.renderHouseStatus();
        return true;
    }
    if (window.showMessage) window.showMessage('灵石不足（需要' + cost + '）', 'error');
    return false;
}

// v20.44 家具加成合计（死字段通电：每件家具一份实在的数）
function getFurnitureBonus(bonusType) {
    var furn = (playerHouse && playerHouse.furniture) || [];
    var total = 0;
    for (var i = 0; i < furn.length; i++) {
        var f = HOUSE_FURNITURE[furn[i]];
        if (f && f.bonus && f.bonus[bonusType]) total += f.bonus[bonusType];
    }
    return total;
}

function buyFurniture(fid) {
    var f = HOUSE_FURNITURE[fid];
    if (!f) return false;
    if (!playerHouse) { if (window.showMessage) window.showMessage('尚未拥有洞府', 'warning'); return false; }
    playerHouse.furniture = playerHouse.furniture || [];
    if (playerHouse.furniture.indexOf(fid) >= 0) { if (window.showMessage) window.showMessage('已置办过「' + f.name + '」', 'info'); return false; }
    if (!window.inventory || window.inventory.currency.spiritStones < f.price) {
        if (window.showMessage) window.showMessage('灵石不足（需 ' + f.price + '）', 'error'); return false;
    }
    window.inventory.currency.spiritStones -= f.price;
    playerHouse.furniture.push(fid);
    if (window.updateCurrencyUI) window.updateCurrencyUI();
    if (f.bonus.storage) applyHouseStorageBonus();
    saveHouseData();
    if (window.showMessage) window.showMessage('置办了「' + f.name + '」——' + f.desc, 'success');
    if (typeof window.renderHouseStatus === 'function') window.renderHouseStatus();
    return true;
}

// ==================== 第一百零六波 · 地脉 ====================
/** 某处洞天的地脉（不给 sid 就取自家宅基那座山）——{kind,pct,name,text} 或 null */
function getCaveLey(siteId) {
    var sid = siteId ? (_resolveSiteId(siteId) || '') : getHouseLocation();
    var site = sid ? CAVE_SITES[sid] : null;
    return (site && site.ley) || null;
}

/** 地脉给某桩营生的加成倍率（采矿/伐木/采药/灵兽训练等消费端统一问这里）——没宅、没这条脉都如实回 1 */
function getCaveLeyBonus(kind) {
    if (!playerHouse || !playerHouse.type) return 1;
    var ley = getCaveLey();
    if (!ley || ley.kind !== kind) return 1;
    return 1 + (Number(ley.pct) || 0) / 100;
}

function getHouseBonus(bonusType) {
    if (!playerHouse || !playerHouse.type) {
        if (bonusType === 'storage') return 0;
        return 1.0;
    }
    var house = HOUSE_TYPES[playerHouse.type];
    if (bonusType === 'storage') {
        var base = (house && house.bonuses && house.bonuses.storage) || 0;
        var up = (playerHouse.upgrades && playerHouse.upgrades.storage) || 0;
        var storage = base + up * 5;
        storage += getFurnitureBonus('storage'); // v20.44 聚灵灯等家具的储物
        // v20.0：龙龟 carry 加成（洞府储物 +10%/只）
        try {
            if (window.BeastEcosystem && typeof window.BeastEcosystem.getActiveBeastBuff === 'function') {
                var carry = window.BeastEcosystem.getActiveBeastBuff('carry') || 0;
                if (carry) storage = Math.floor(storage * (1 + carry));
            }
        } catch (eCarry) {}
        return storage;
    }
    var baseMul = (house && house.bonuses && house.bonuses[bonusType]) || 1.0;
    var upgradeLevel = (playerHouse.upgrades && playerHouse.upgrades[bonusType]) || 0;
    var result = baseMul + upgradeLevel * 0.05;
    result += getFurnitureBonus(bonusType); // v20.44 蒲团/暖玉炉等家具的加成
    // v20.0：洞府设施加成（接 v19.16 CaveFacilities）
    try {
        if (window.CaveFacilities && typeof window.CaveFacilities.getBuff === 'function') {
            if (bonusType === 'cultivation') {
                var expPct = window.CaveFacilities.getBuff('player', 'expBoostPct') || 0;
                result *= (1 + expPct / 100);
            }
            if (bonusType === 'alchemy') {
                result += (window.CaveFacilities.getBuff('player', 'alchemySkill') || 0) / 100;
            }
            if (bonusType === 'forging') {
                result += (window.CaveFacilities.getBuff('player', 'forgingSkill') || 0) / 100;
            }
        }
        // v20.0：火凤 craftFire 提升炼丹/炼器
        if ((bonusType === 'alchemy' || bonusType === 'forging') && window.BeastEcosystem && typeof window.BeastEcosystem.getActiveBeastBuff === 'function') {
            var fire = window.BeastEcosystem.getActiveBeastBuff('craftFire') || 0;
            if (fire) result += fire;
        }
        // 第二十四波：洞府地阵不再是死账——field 阵位布下的「聚灵阵」真提修炼效率（此前布了全仓无人读）
        if (bonusType === 'cultivation' && window.FormationSystem && typeof window.FormationSystem.getBuff === 'function') {
            var fExp = Number(window.FormationSystem.getBuff('field', 'expBoostPct')) || 0;
            if (fExp > 0) result *= (1 + fExp / 100);
        }
        // 第一百零六波：宅基那座山的地脉——中脉养修炼、丹火养丹炉、金气养锤砧，住在哪条脉上吃哪条脉
        var _ley = getCaveLey();
        if (_ley && _ley.kind === bonusType) {
            if (bonusType === 'cultivation') result *= (1 + (_ley.pct || 0) / 100);
            else result += (_ley.pct || 0) / 100;
        }
    } catch (eBuff) {}
    return result;
}

/** 将洞府储物加成应用到背包 maxSlots */
function applyHouseStorageBonus() {
    if (!window.inventory) return;
    var bonus = Math.floor(getHouseBonus('storage') || 0);
    var prev = (playerHouse && playerHouse.storageApplied) || 0;
    var delta = bonus - prev;
    if (delta !== 0) {
        window.inventory.maxSlots = (window.inventory.maxSlots || 30) + delta;
        // 扩展 slots 数组
        while (window.inventory.slots.length < window.inventory.maxSlots) {
            window.inventory.slots.push(null);
        }
        if (playerHouse) playerHouse.storageApplied = bonus;
        saveHouseData();
    }
}

function getHousePlotSlots() {
    if (!playerHouse || !playerHouse.type) return 0;
    var house = HOUSE_TYPES[playerHouse.type];
    var base = (house && house.plotSlots) || 0;
    var up = (playerHouse.upgrades && playerHouse.upgrades.herb) || 0;
    return base + up;
}

function getHouseGameDay() {
    // B3：统一读 currentDay / getAbsoluteDay
    if (typeof window.getAbsoluteDay === 'function') {
        return window.getAbsoluteDay();
    }
    if (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') {
        return window.timeSystem.getAbsoluteDay();
    }
    if (window.timeSystem && window.timeSystem.gameTime) {
        var gt = window.timeSystem.gameTime;
        return gt.currentDay || gt.totalDays || gt.day || 0;
    }
    if (window.gameTime) {
        return window.gameTime.currentDay || window.gameTime.totalDays || window.gameTime.day || 0;
    }
    return 0;
}

function plantCrop(cropId) {
    if (!playerHouse) {
        if (window.showMessage) window.showMessage('请先购买洞府', 'warning');
        return false;
    }
    var crop = HOUSE_CROPS[cropId];
    if (!crop) {
        if (window.showMessage) window.showMessage('未知作物', 'error');
        return false;
    }
    playerHouse.planted = playerHouse.planted || [];
    if (playerHouse.planted.length >= getHousePlotSlots()) {
        if (window.showMessage) window.showMessage('灵田已满', 'warning');
        return false;
    }
    // 消耗种子（free 作物不需要）
    if (crop.seedId && !crop.free) {
        var has = false;
        if (window.inventory && window.inventory.slots) {
            for (var i = 0; i < window.inventory.slots.length; i++) {
                var s = window.inventory.slots[i];
                if (s && s.templateId === crop.seedId && s.count >= 1) {
                    s.count -= 1;
                    if (s.count <= 0) window.inventory.slots[i] = null;
                    has = true;
                    break;
                }
            }
        }
        if (!has) {
            if (window.showMessage) window.showMessage('缺少种子：' + crop.seedId, 'error');
            return false;
        }
    }
    var day = getHouseGameDay();
    var grow = crop.growDays || 3;
    // 灵植师/洞府 herb 加速
    var herbMul = getHouseBonus('herb') || 1;
    grow = Math.max(1, Math.ceil(grow / herbMul));
    // v9.8: planting skill shortens grow time (1 - skill/500)
    var plantSkill = (typeof window.getLifeSkill === 'function') ? window.getLifeSkill('种植') : 0;
    if (plantSkill > 0) {
        grow = Math.max(1, Math.ceil(grow * (1 - plantSkill / 500)));
    }
    // 第二十四波：育灵阵与洞府「灵田」设施不再是死账——灵田作物真提速（两处的 fieldSpeedPct 都算数）
    var fieldPct = 0;
    try { if (window.FormationSystem && typeof window.FormationSystem.getBuff === 'function') fieldPct += Number(window.FormationSystem.getBuff('field', 'fieldSpeedPct')) || 0; } catch (eFa) {}
    try { if (window.CaveFacilities && typeof window.CaveFacilities.getBuff === 'function') fieldPct += Number(window.CaveFacilities.getBuff('player', 'fieldSpeedPct')) || 0; } catch (eFc) {}
    if (fieldPct > 0) grow = Math.max(1, Math.ceil(grow / (1 + fieldPct / 100)));
    var baseYield = crop.yieldCount || 1;
    // v9.8: yield * (1 + planting/200)
    var yieldCount = Math.max(1, Math.floor(baseYield * (1 + plantSkill / 200)));
    playerHouse.planted.push({
        cropId: cropId,
        name: crop.name,
        icon: crop.icon,
        plantDay: day,
        readyDay: day + grow,
        yieldId: crop.yieldId,
        yieldCount: yieldCount
    });
    saveHouseData();
    if (window.showMessage) window.showMessage('种植了「' + crop.name + '」，约 ' + grow + ' 天后成熟', 'success');
    if (typeof window.growLifeSkill === 'function') window.growLifeSkill('种植', 1, { reason: '下种育苗' }); // v20.94 熟能生巧
    // 第一百一十波 · NEW-103：addProfessionExp 全库无定义（幽灵调用），真账是上一行的 growLifeSkill
    if (typeof window.renderHouseStatus === 'function') window.renderHouseStatus();
    return true;
}

// v20.53 洒扫：洞府的日常活计。这是「打扫洞府」门派日常真正能落的地方——
// 此前该任务要的 clean:completed 事件全库无人发出，任务接了就永远完不成。
function cleanDwelling() {
    if (!playerHouse || !playerHouse.type) {
        if (window.showMessage) window.showMessage('你连个洞府都没有，扫哪儿去？', 'warning');
        return false;
    }
    var cd = window.currentCharData;
    if (!cd) return false;
    // 第一百零四波：灵泉浴池的账——泡过泉的身子不畏劳作，洒扫省力气（没有浴池照旧 15）
    var cost = 15;
    try {
        if (window.CaveFacilities && typeof window.CaveFacilities.getBuff === 'function') {
            var disc = Number(window.CaveFacilities.getBuff('player', 'cleanDiscount')) || 0;
            if (disc > 0) cost = Math.max(5, cost - disc);
        }
    } catch (eDisc) {}
    if ((Number(cd.energy) || 0) < cost) {
        if (window.showMessage) window.showMessage('精力不足（需 ' + cost + '），改日再扫吧。', 'warning');
        return false;
    }
    cd.energy = (Number(cd.energy) || 0) - cost;
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(30, '洒扫洞府');
    }
    if (window.EventBus && typeof window.EventBus.emit === 'function') {
        try { window.EventBus.emit('clean:completed', { target: '洞府', count: 1 }); } catch (e) {}
    }
    // 第一百一十波 · NEW-103：addProfessionExp 幽灵调用已删（全库无定义）
    if (window.showMessage) window.showMessage('🧹 你把洞府里外洒扫了一遍，灵田边的水渠也通了一回。', 'success');
    if (typeof window.updateCharacterStatus === 'function') window.updateCharacterStatus();
    return true;
}
window.cleanDwelling = cleanDwelling;

function harvestCrop(index) {
    if (!playerHouse || !playerHouse.planted) return false;
    var plot = playerHouse.planted[index];
    if (!plot) return false;
    var day = getHouseGameDay();
    if (day < plot.readyDay) {
        if (window.showMessage) window.showMessage('尚未成熟（还需 ' + (plot.readyDay - day) + ' 天）', 'info');
        return false;
    }
    // v20.44 灵植不等懒汉：熟后三日不采即蔫——蔫了收成减半，地里的账不会自己销
    var withered = day > plot.readyDay + CROP_GRACE_DAYS;
    var count = plot.yieldCount || 1;
    if (!withered) {
        var qualityMul = getHouseBonus('herb') || 1;
        if (qualityMul > 1.2 && Math.random() < 0.3) count += 1;
        // 第一百零九波：年目标政策真管到灵田——「积谷」的 harvest_30 收成 +30%、「开疆拓土」的 expansion +10%
        try {
            if (window.SectYearGoal && typeof window.SectYearGoal.hasPolicyBuff === 'function') {
                var _pbMul = 1;
                if (window.SectYearGoal.hasPolicyBuff('harvest_30')) _pbMul += 0.3;
                if (window.SectYearGoal.hasPolicyBuff('expansion')) _pbMul += 0.1;
                if (_pbMul > 1) count = Math.max(1, Math.round(count * _pbMul));
            }
        } catch (ePB) {}
    } else {
        count = Math.max(1, Math.floor(count / 2));
    }
    if (typeof window.addItem === 'function' && plot.yieldId) {
        window.addItem(plot.yieldId, count);
    }
    playerHouse.planted.splice(index, 1);
    saveHouseData();
    if (window.showMessage) window.showMessage('收获 ' + (plot.name || '') + ' x' + count + (withered ? '（蔫后才收，收成减半）' : ''), withered ? 'warning' : 'success');
    if (typeof window.growLifeSkill === 'function') window.growLifeSkill('种植', withered ? 1 : 2, { reason: withered ? '蔫了才收，长了记性' : '颗粒归仓' }); // v20.94 熟能生巧
    // 第一百一十波 · NEW-103：addProfessionExp 幽灵调用已删（真账是上一行的 growLifeSkill）
    if (typeof window.renderHouseStatus === 'function') window.renderHouseStatus();
    return true;
}

function harvestAllReady() {
    if (!playerHouse || !playerHouse.planted) return 0;
    var day = getHouseGameDay();
    var n = 0;
    for (var i = playerHouse.planted.length - 1; i >= 0; i--) {
        if (playerHouse.planted[i].readyDay <= day) {
            if (harvestCrop(i)) n++;
        }
    }
    return n;
}

/** 洞府面板 HTML（供 app.renderHouseStatus 或直接调用） */
function getHouseStatusHtml() {
    if (!playerHouse || !playerHouse.type) {
        var shop = '';
        for (var tid in HOUSE_TYPES) {
            var h = HOUSE_TYPES[tid];
            shop += '<div class="bg-gray-700/30 p-3 rounded-lg border border-gray-600 mb-2">' +
                '<div class="flex items-center mb-1"><span class="text-2xl mr-2">' + h.icon + '</span>' +
                '<span class="font-bold text-white">' + h.name + '</span></div>' +
                '<p class="text-xs text-gray-400">价格: ' + h.price + ' 灵石 · 修炼×' + h.bonuses.cultivation +
                ' · 储物+' + h.bonuses.storage + ' · 灵田' + h.plotSlots + '格</p>' +
                '<button onclick="buyHouse(\'' + tid + '\')" class="mt-2 text-xs bg-yellow-600 hover:bg-yellow-500 text-white px-2 py-1 rounded">购买</button></div>';
        }
        return { status: '<p class="text-gray-400 text-sm">尚未拥有洞府</p>', shop: shop };
    }
    var htype = HOUSE_TYPES[playerHouse.type];
    var day = getHouseGameDay();
    var status = '<div class="mb-3"><div class="flex items-center"><span class="text-2xl mr-2">' + (htype.icon || '🏡') + '</span>' +
        '<div><p class="font-bold text-white">' + htype.name + '</p>' +
        '<p class="text-xs text-gray-400">修炼×' + getHouseBonus('cultivation').toFixed(2) +
        ' · 储物+' + Math.floor(getHouseBonus('storage')) +
        ' · 灵田 ' + (playerHouse.planted || []).length + '/' + getHousePlotSlots() + '</p></div></div></div>';

    // 升级按钮
    status += '<div class="flex flex-wrap gap-2 mb-3">' +
        '<button onclick="upgradeHouse(\'cultivation\')" class="text-xs bg-purple-700 hover:bg-purple-600 text-white px-2 py-1 rounded">升级修炼</button>' +
        '<button onclick="upgradeHouse(\'storage\')" class="text-xs bg-blue-700 hover:bg-blue-600 text-white px-2 py-1 rounded">升级储物</button>' +
        '<button onclick="upgradeHouse(\'herb\')" class="text-xs bg-green-700 hover:bg-green-600 text-white px-2 py-1 rounded">升级灵田</button>' +
        '<button onclick="harvestAllReady()" class="text-xs bg-yellow-700 hover:bg-yellow-600 text-white px-2 py-1 rounded">一键收获</button>' +
        '<button onclick="cleanDwelling()" class="text-xs bg-teal-700 hover:bg-teal-600 text-white px-2 py-1 rounded">洒扫</button>' +
        // v23.0 洞府深作：设施布置/护持阵法/傀儡工坊三套写好却没门的系统从这里进
        '<button onclick="openCaveWorksUI()" class="text-xs bg-indigo-700 hover:bg-indigo-600 text-white px-2 py-1 rounded font-bold">🧰 洞府深作</button></div>';

    // 灵田
    status += '<p class="text-sm text-green-400 font-bold mb-1">🌱 灵田</p>';
    var planted = playerHouse.planted || [];
    if (planted.length === 0) {
        status += '<p class="text-xs text-gray-500 mb-2">空闲中</p>';
    } else {
        planted.forEach(function(plot, i) {
            var left = Math.max(0, plot.readyDay - day);
            var ready = left <= 0;
            // v20.44 蔫了就是蔫了——面板上红给你看
            var withered = ready && day > plot.readyDay + CROP_GRACE_DAYS;
            status += '<div class="bg-gray-800/50 p-2 rounded mb-1 flex justify-between items-center">' +
                '<span>' + (plot.icon || '🌱') + ' ' + plot.name +
                (withered ? ' <span class="text-red-400">已蔫·收成减半</span>'
                    : ready ? ' <span class="text-green-400">可收获</span>'
                    : ' <span class="text-gray-500">' + left + '天后</span>') +
                '</span>' +
                (ready
                    ? '<button onclick="harvestCrop(' + i + ')" class="text-xs bg-green-600 text-white px-2 py-0.5 rounded">收获</button>'
                    : '') +
                '</div>';
        });
    }
    // 种植
    if (planted.length < getHousePlotSlots()) {
        status += '<p class="text-xs text-gray-400 mt-2 mb-1">种植：</p><div class="flex flex-wrap gap-1">';
        for (var cid in HOUSE_CROPS) {
            var c = HOUSE_CROPS[cid];
            status += '<button onclick="plantCrop(\'' + cid + '\')" class="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded">' +
                c.icon + c.name + '</button>';
        }
        status += '</div>';
    }

    // v20.44 家具：置办过的列出来，没置办的摆个小铺
    status += '<p class="text-sm text-amber-400 font-bold mb-1 mt-3">🪑 家具</p>';
    var owned = playerHouse.furniture || [];
    if (owned.length) {
        status += '<p class="text-xs text-gray-400 mb-1">已置办：' + owned.map(function (fid) {
            var f = HOUSE_FURNITURE[fid];
            return f ? (f.icon + f.name) : fid;
        }).join('、') + '</p>';
    }
    var furnShop = Object.keys(HOUSE_FURNITURE).filter(function (fid) { return owned.indexOf(fid) < 0; });
    if (furnShop.length) {
        status += '<div class="flex flex-wrap gap-1">';
        furnShop.forEach(function (fid) {
            var f = HOUSE_FURNITURE[fid];
            status += '<button onclick="buyFurniture(\'' + fid + '\')" title="' + f.desc + '" class="text-xs bg-amber-800 hover:bg-amber-700 text-white px-2 py-1 rounded">' +
                f.icon + f.name + '(' + f.price + ')</button>';
        });
        status += '</div>';
    }

    // 换购更高级
    var shop = '<p class="text-xs text-gray-500 mb-2">可换购更高级洞府（补差价）</p>';
    for (var tid2 in HOUSE_TYPES) {
        var h2 = HOUSE_TYPES[tid2];
        if (htype && h2.level <= htype.level) continue;
        shop += '<button onclick="buyHouse(\'' + tid2 + '\')" class="mr-2 mb-1 text-xs bg-yellow-700 text-white px-2 py-1 rounded">' +
            h2.icon + h2.name + ' (' + h2.price + ')</button>';
    }
    return { status: status, shop: shop };
}

// 导出
window.HOUSE_TYPES = HOUSE_TYPES;
window.HOUSE_CROPS = HOUSE_CROPS;
window.HOUSE_FURNITURE = HOUSE_FURNITURE;
window.playerHouse = playerHouse;
window.initHouseSystem = initHouseSystem;
window.buyHouse = buyHouse;
window.upgradeHouse = upgradeHouse;
window.buyFurniture = buyFurniture;
window.getFurnitureBonus = getFurnitureBonus;
window.getHouseBonus = getHouseBonus;
window.applyHouseStorageBonus = applyHouseStorageBonus;
window.plantCrop = plantCrop;
window.harvestCrop = harvestCrop;
window.harvestAllReady = harvestAllReady;
window.getHouseStatusHtml = getHouseStatusHtml;
window.getHousePlotSlots = getHousePlotSlots;
window.saveHouseData = saveHouseData;
window.exportHouseState = exportHouseState;
window.importHouseState = importHouseState;
// 第一百零二波 · 择地而居（第一百零三波改定：洞府在野——七处固定洞天）
window.CAVE_SITES = CAVE_SITES;
window.SITE_BY_REGION = SITE_BY_REGION;
window.getHouseLocation = getHouseLocation;
window.getHouseSite = getHouseSite;
window.relocateHouse = relocateHouse;
window.isAtHome = isAtHome;
window.currentRegionOfPlayer = currentRegionOfPlayer;
window.defaultCaveSite = defaultCaveSite;
// 第一百零六波 · 七处洞天各有脾气（地脉）
window.getCaveLey = getCaveLey;
window.getCaveLeyBonus = getCaveLeyBonus;
// 第一百零四波 · 山居营造
window.UPGRADE_RECIPES = UPGRADE_RECIPES;
window.claimRuin = claimRuin;
window.repairHouse = repairHouse;
window.getRepairRecipe = getRepairRecipe;
