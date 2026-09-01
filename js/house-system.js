/**
 * house-system.js - 洞府系统 v7.1 P0-4
 * 购买/升级/储物扩容/修炼加成/灵田种植
 */

var HOUSE_TYPES = {
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

var playerHouse = null; // { type, upgrades, furniture, planted: [{cropId, plantDay, readyDay}], storageApplied }

function exportHouseState() {
    return playerHouse ? JSON.parse(JSON.stringify(playerHouse)) : null;
}

function importHouseState(data) {
    playerHouse = data ? JSON.parse(JSON.stringify(data)) : null;
    window.playerHouse = playerHouse;
    try {
        if (playerHouse) localStorage.setItem('xianxia_house', JSON.stringify(playerHouse));
        else localStorage.removeItem('xianxia_house');
    } catch (e) {}
    if (typeof applyHouseStorageBonus === 'function') applyHouseStorageBonus();
}

function initHouseSystem() {
    try {
        var saved = localStorage.getItem('xianxia_house');
        if (saved) playerHouse = JSON.parse(saved);
    } catch (e) {}
    // 同步储物扩容
    applyHouseStorageBonus();
    window.playerHouse = playerHouse;
}

function saveHouseData() {
    try { localStorage.setItem('xianxia_house', JSON.stringify(playerHouse)); } catch (e) {}
    window.playerHouse = playerHouse;
}

function buyHouse(type) {
    var house = HOUSE_TYPES[type];
    if (!house) return false;
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
        if (!window.inventory || window.inventory.currency.spiritStones < house.price) {
            if (window.showMessage) window.showMessage('灵石不足', 'error');
            return false;
        }
        window.inventory.currency.spiritStones -= house.price;
        playerHouse = { type: type, upgrades: {}, furniture: [], planted: [], storageApplied: 0 };
        if (window.showMessage) window.showMessage('购得「' + house.name + '」！', 'success');
    }
    if (window.updateCurrencyUI) window.updateCurrencyUI();
    applyHouseStorageBonus();
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
    if (typeof window.addProfessionExp === 'function') window.addProfessionExp('herbalist', 5);
    if (typeof window.renderHouseStatus === 'function') window.renderHouseStatus();
    return true;
}

function harvestCrop(index) {
    if (!playerHouse || !playerHouse.planted) return false;
    var plot = playerHouse.planted[index];
    if (!plot) return false;
    var day = getHouseGameDay();
    if (day < plot.readyDay) {
        if (window.showMessage) window.showMessage('尚未成熟（还需 ' + (plot.readyDay - day) + ' 天）', 'info');
        return false;
    }
    var count = plot.yieldCount || 1;
    var qualityMul = getHouseBonus('herb') || 1;
    if (qualityMul > 1.2 && Math.random() < 0.3) count += 1;
    if (typeof window.addItem === 'function' && plot.yieldId) {
        window.addItem(plot.yieldId, count);
    }
    playerHouse.planted.splice(index, 1);
    saveHouseData();
    if (window.showMessage) window.showMessage('收获 ' + (plot.name || '') + ' x' + count, 'success');
    if (typeof window.addProfessionExp === 'function') window.addProfessionExp('herbalist', 8);
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
        '<button onclick="harvestAllReady()" class="text-xs bg-yellow-700 hover:bg-yellow-600 text-white px-2 py-1 rounded">一键收获</button></div>';

    // 灵田
    status += '<p class="text-sm text-green-400 font-bold mb-1">🌱 灵田</p>';
    var planted = playerHouse.planted || [];
    if (planted.length === 0) {
        status += '<p class="text-xs text-gray-500 mb-2">空闲中</p>';
    } else {
        planted.forEach(function(plot, i) {
            var left = Math.max(0, plot.readyDay - day);
            var ready = left <= 0;
            status += '<div class="bg-gray-800/50 p-2 rounded mb-1 flex justify-between items-center">' +
                '<span>' + (plot.icon || '🌱') + ' ' + plot.name +
                (ready ? ' <span class="text-green-400">可收获</span>' : ' <span class="text-gray-500">' + left + '天后</span>') +
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
window.playerHouse = playerHouse;
window.initHouseSystem = initHouseSystem;
window.buyHouse = buyHouse;
window.upgradeHouse = upgradeHouse;
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
