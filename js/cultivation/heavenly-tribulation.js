// ==================== heavenly-tribulation.js - v20.0 1.1 天劫/渡劫战 ====================
// 渡劫期满触发：多波雷劫战斗 + 中段心魔劫 + 道侣护法分担 + 失败转世/残魂 + 成功飞升
// 复用兽潮清剿的多波战斗 UI 模式（_isBeastTideRaid + continueBeastTideRaid），不重造轮子
// 依赖：0.2.1 境界质变、0.2.3 心魔、0.2.6 道侣护法、core/soul-state 残魂态

(function () {

// 雷劫波数：3 + tier/2，上限9（渡劫期 tier=9 → 7 道；鬼谷/觅长生多波雷劫是标配）
function calcTribWaves(tier) {
    return Math.min(9, 3 + Math.floor(tier / 2));
}

// 触发天劫（渡劫台地点 / 突破至渡劫期调用）
function triggerHeavenlyTribulation() {
    var cd = window.currentCharData;
    if (!cd) { if (window.showMessage) window.showMessage('请先创建角色', 'warning'); return false; }
    var realm = cd.realm || '';
    var tier = (typeof window.getRealmTier === 'function') ? window.getRealmTier(realm) : 0;
    if (tier < 9) {
        if (window.showMessage) window.showMessage('天劫唯有渡劫期方会降临，你修为尚浅。', 'info');
        return false;
    }
    var waves = calcTribWaves(tier);
    window._trib = {
        wave: 1, waves: waves,
        heartDemonWave: Math.floor(waves / 2), // 中段心魔劫
        ended: false, failed: false
    };
    if (window.showMessage) window.showMessage('⚡⚡⚡ 天劫降临！共 ' + waves + ' 道雷劫，中段伴有心魔劫。', 'warning');
    return startTribWave();
}

// 道侣护法：有道侣 bond 则雷劫攻击减免30%（0.2.6 双修合击的护法体现）
function hasDaoCompanionGuard() {
    try {
        var bonds = (window.currentCharData && window.currentCharData.bonds) || {};
        for (var k in bonds) if (bonds[k] && bonds[k].type === 'dao_companion') return true;
    } catch (e) {}
    return false;
}

function makeLightningEnemy(wave, tier) {
    var guardMul = hasDaoCompanionGuard() ? 0.7 : 1.0;
    var baseAtk = Math.round((18 + wave * 7 + tier * 4) * guardMul);
    var baseHp = 70 + wave * 18 + tier * 12;
    return {
        name: '第' + wave + '道天雷',
        type: 'elemental',
        species: 'elemental',
        physiologyType: 'elemental',
        _elementType: 'fire', // 雷劫归火系，受 0.2.2 #2 五行相克影响
        level: tier * 3 + wave,
        attack: baseAtk,
        defense: 8 + wave,
        speed: 12 + wave * 2,
        maxDurability: baseHp,
        durabilities: { chest: baseHp },
        combatAbilities: ['burn']
    };
}

// 心魔化身：攻防略随波数+tier（一票否决：败即走火入魔——仙侠设定心魔最险）
function makeHeartDemonEnemy(wave, tier) {
    var baseAtk = 25 + wave * 6 + tier * 5;
    var baseHp = 100 + wave * 25 + tier * 20;
    return {
        name: '心魔化身',
        type: 'boss',
        physiologyType: 'humanoid',
        level: tier * 3 + wave,
        attack: baseAtk,
        defense: 15,
        speed: 18,
        maxDurability: baseHp,
        durabilities: { chest: baseHp },
        combatAbilities: []
    };
}

// 启动一道雷劫 / 心魔劫
function startTribWave() {
    var t = window._trib;
    if (!t || t.ended) return false;
    var cd = window.currentCharData || {};
    var tier = (typeof window.getRealmTier === 'function') ? window.getRealmTier(cd.realm) : 9;
    var isHD = (t.wave === t.heartDemonWave + 1);
    var enemyData = isHD ? makeHeartDemonEnemy(t.wave, tier) : makeLightningEnemy(t.wave, tier);
    if (isHD && window.showMessage) {
        window.showMessage('💀 心魔劫！你的心魔化身现身，欲取你而代之。', 'error');
    }
    if (typeof window.closeBattle === 'function') { try { window.closeBattle(); } catch (e) {} }
    var battle = window.startBattle && window.startBattle(enemyData);
    if (battle) {
        battle._isHeavenlyTribulation = true;
        battle._tribWave = t.wave;
        battle._tribWaves = t.waves;
        battle._tribIsHeartDemon = isHD;
    }
    return true;
}

// 玩家点"迎接下一道天雷"按钮
function continueTribWave() {
    var t = window._trib;
    if (!t || t.ended) return false;
    if (t.wave >= t.waves) { settleTribulation(true); return true; }
    t.wave += 1;
    return startTribWave();
}

// 战后结算（胜利/失败由 app.js 战斗结束分支调用）
function settleTribulation(won) {
    var t = window._trib;
    if (!t || t.ended) return;
    if (won) {
        if (t.wave >= t.waves) { t.ended = true; tribulationSuccess(); }
        // 否则等待玩家点"下一道天雷"（continueTribWave）
    } else {
        t.ended = true; t.failed = true;
        // 残魂态/转世由 app.js 既有战败流程（maybeEnterSoulState + handleDefeatRevival）处理，此处不重复
        if (window.showMessage) window.showMessage('渡劫失败，天威如狱，形神将灭……', 'error');
    }
}

// 渡劫成功 → 飞升（1.3 ascension-epilogue 接管：香火+天界）
function tribulationSuccess() {
    var cd = window.currentCharData || {};
    cd._foundationBonus = (cd._foundationBonus || 0) + 20;
    // 1.3 香火系统初始化（替代直接设 realm，由 onAscension 统一处理飞升态）
    if (typeof window.onAscension === 'function') {
        try { window.onAscension(); } catch (e) { cd.realm = '飞升'; cd.layer = 1; }
    } else {
        cd.realm = '飞升';
        cd.layer = 1;
    }
    if (window.showMessage) window.showMessage('⚡⚡⚡ 渡劫成功！天门大开，你白日飞升，步入仙班！', 'success');
    // 雷劫产物（用既有雷系材料代指；雷劫液正式物品待后续物品扩展）
    if (typeof window.addItem === 'function') {
        try { window.addItem('mat_sky_iron', 2); window.addItem('mat_chaos_stone', 1); } catch (e) {}
    }
    if (window.updateCharacterStatus) window.updateCharacterStatus();
}

window.triggerHeavenlyTribulation = triggerHeavenlyTribulation;
window.continueTribWave = continueTribWave;
window.settleTribulation = settleTribulation;
window.startTribWave = startTribWave;
window._hasDaoCompanionGuard = hasDaoCompanionGuard;

})();
