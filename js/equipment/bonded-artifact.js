// ==================== bonded-artifact.js - v20.0 1.8 本命法宝/法宝成长 ====================
// 金丹+可炼制本命法宝（绑定不可易主），喂材料升级，战斗加成随等级
// 觉醒技能/化形留后续扩展。依赖：0.2.2 五行（法宝元素随主功法）

(function () {

function getBA() {
    var cd = window.currentCharData;
    if (!cd) return null;
    if (!cd._bondedArtifact) cd._bondedArtifact = null;
    return cd._bondedArtifact;
}

// 炼制本命法宝：金丹+，扣材料+灵石，绑定
function forgeBondedArtifact(name) {
    var cd = window.currentCharData;
    if (!cd) { if (window.showMessage) window.showMessage('请先创建角色', 'warning'); return false; }
    var tier = (typeof window.getRealmTier === 'function') ? window.getRealmTier(cd.realm) : 0;
    if (tier < 3) { if (window.showMessage) window.showMessage('需金丹以上方可凝聚本命法宝。', 'warning'); return false; }
    if (cd._bondedArtifact) { if (window.showMessage) window.showMessage('你已有本命法宝「' + cd._bondedArtifact.name + '」，性命相连不可易主。', 'warning'); return false; }
    // 扣灵石
    var cost = 300;
    if (window.DataManager && window.DataManager.deductSpiritStones && !window.DataManager.deductSpiritStones(cost)) {
        if (window.showMessage) window.showMessage('炼制需 ' + cost + ' 灵石。', 'warning');
        return false;
    }
    // 取主功法元素
    var element = 'neutral';
    try { if (typeof window._getMainTechniqueElement === 'function') element = window._getMainTechniqueElement(); } catch (e) {}
    cd._bondedArtifact = {
        name: name || '本命法宝',
        level: 1, exp: 0, expMax: 50,
        durability: 100, maxDurability: 100,
        element: element
    };
    if (window.showMessage) window.showMessage('🔱 你凝聚本命法宝「' + cd._bondedArtifact.name + '」，与其性命相连！', 'success');
    if (window.updateCharacterStatus) window.updateCharacterStatus();
    return true;
}

// 喂材料升级：消耗背包1个材料→exp+10，达阈值升级
function feedArtifact() {
    var cd = window.currentCharData;
    if (!cd || !cd._bondedArtifact) { if (window.showMessage) window.showMessage('你尚未炼制本命法宝。', 'warning'); return false; }
    var ba = cd._bondedArtifact;
    // 找背包第一个材料
    var matUid = null, slotIdx = -1;
    try {
        if (window.inventory && window.inventory.slots) {
            for (var i = 0; i < window.inventory.slots.length; i++) {
                var sl = window.inventory.slots[i];
                if (sl && sl.templateId && window.itemById && window.itemById[sl.templateId] && window.itemById[sl.templateId].type === 'material') {
                    matUid = sl.uid; slotIdx = i; break;
                }
            }
        }
    } catch (e) {}
    if (!matUid) { if (window.showMessage) window.showMessage('背包无材料可喂。', 'warning'); return false; }
    if (typeof window.removeItem === 'function') window.removeItem(matUid, 1);
    ba.exp = (ba.exp || 0) + 10;
    var leveled = false;
    while (ba.exp >= ba.expMax && ba.level < 10) {
        ba.exp -= ba.expMax;
        ba.level += 1;
        ba.expMax = 50 + ba.level * 30;
        leveled = true;
    }
    if (leveled) {
        if (window.showMessage) window.showMessage('🔱 本命法宝「' + ba.name + '」升阶至 ' + ba.level + ' 阶！', 'success');
    } else {
        if (window.showMessage) window.showMessage('本命法宝吸纳材料，经验 +10（' + ba.exp + '/' + ba.expMax + '）', 'info');
    }
    // v25.5 器灵同沾：法宝吃东西，器灵也跟着长见识
    if (ba.spirit && ba.spirit.awakened) {
        ba.spirit.exp = (ba.spirit.exp || 0) + 3;
        _spiritCheckLevelUp(ba);
    }
    if (window.updateCharacterStatus) window.updateCharacterStatus();
    return true;
}

// ==================== v25.5 器灵养成 ====================
// 文件头那句「觉醒技能/化形留后续扩展」的口子，这批接上：法宝攒到 3 阶可唤醒器灵，
// 唤醒后能交感（器灵随交感与喂料成长），器灵等级进战斗乘区（与法宝本体同一管道
// artifactCombatMul → battle.js _artifactMul），并解锁器灵声口。账挂 _bondedArtifact.spirit，
// 随本命法宝整体走 game-state.js 存档白名单（深拷贝往返），不新开键。
var SPIRIT_AWAKEN_COST = 200;      // 唤醒灵石
var SPIRIT_AWAKEN_MIN_LEVEL = 3;   // 法宝 3 阶起才可唤醒
var SPIRIT_MAX_LEVEL = 5;
var SPIRIT_NAMES = { neutral: '器灵', metal: '庚金之灵', wood: '青木之灵', water: '玄水之灵', fire: '离火之灵', earth: '后土之灵' };
// 声口按器灵等级递进：初醒只会哼，养深了能说整句
var SPIRIT_VOICES = [
    ['（器身微微震颤，一缕意念蹭过你的识海，还不成话。）', '「……嗡。」'],
    ['「主人。」器灵的声音清晰了些，「再来。」', '「我梦见了我还是一块矿石的时候。」'],
    ['「你的剑气比昨天稳。」器灵评点道，「不过收势还是急了半拍。」', '「等闲器物见了我，都要矮三分。」'],
    ['「我与性命相连，你伤则我伤。」器灵难得正经，「所以——别再拿我去挡刀了。」', '「什么时候带我去斩一条真龙？」'],
    ['「五百年后，或许我能化形。」器灵的声音里有笑意，「到时候，换我护你。」', '「天下器物千千万，我只认你一个主人。」']
];

function _spiritCheckLevelUp(ba) {
    if (!ba.spirit || !ba.spirit.awakened) return false;
    var leveled = false;
    while ((ba.spirit.exp || 0) >= (ba.spirit.expMax || 30) && ba.spirit.level < SPIRIT_MAX_LEVEL) {
        ba.spirit.exp -= ba.spirit.expMax;
        ba.spirit.level += 1;
        ba.spirit.expMax = 30 + ba.spirit.level * 20;
        leveled = true;
    }
    if (ba.spirit.level >= SPIRIT_MAX_LEVEL) ba.spirit.exp = Math.min(ba.spirit.exp || 0, (ba.spirit.expMax || 30) - 1);
    if (leveled && window.showMessage) {
        window.showMessage('✨ 器灵「' + ba.spirit.name + '」成长至 ' + ba.spirit.level + ' 级——法宝攻防加成又深一层（器灵 +' + (ba.spirit.level * 2) + '%）！', 'success');
    }
    return leveled;
}

// 唤醒器灵：法宝 3 阶起，灵石 200，耗时一个时辰
function awakenArtifactSpirit() {
    var cd = window.currentCharData;
    var ba = getBA();
    if (!cd || !ba) { if (window.showMessage) window.showMessage('你尚未炼制本命法宝。', 'warning'); return false; }
    if (ba.spirit && ba.spirit.awakened) { if (window.showMessage) window.showMessage('器灵「' + ba.spirit.name + '」早已醒着。', 'info'); return false; }
    if ((ba.level || 1) < SPIRIT_AWAKEN_MIN_LEVEL) {
        if (window.showMessage) window.showMessage('法宝才 ' + ba.level + ' 阶，灵性未足——喂材料升到 ' + SPIRIT_AWAKEN_MIN_LEVEL + ' 阶，器灵才唤得醒。', 'warning');
        return false;
    }
    if (window.DataManager && window.DataManager.deductSpiritStones && !window.DataManager.deductSpiritStones(SPIRIT_AWAKEN_COST)) {
        if (window.showMessage) window.showMessage('唤醒器灵需 ' + SPIRIT_AWAKEN_COST + ' 灵石（引灵入器），钱袋不够。', 'warning');
        return false;
    }
    var mins = 60;   // 回执的时长由它生成
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') window.timeSystem.advanceTime(mins, '唤醒器灵');
    ba.spirit = {
        awakened: true,
        name: SPIRIT_NAMES[ba.element] || SPIRIT_NAMES.neutral,
        level: 1, exp: 0, expMax: 50
    };
    if (window.showMessage) {
        window.showMessage('🔱 你以灵石为引、心血为媒——「' + ba.name + '」周身光华流转，一缕灵性睁开了眼！\n器灵「' + ba.spirit.name + '」苏醒（1 级）：法宝攻防 +' + (ba.spirit.level * 2) + '%，往后常与它交感，它会长大。', 'success');
    }
    if (window.updateCharacterStatus) window.updateCharacterStatus();
    return true;
}

// 与器灵交感：耗时半个时辰，器灵长经验，附一句声口（按等级）
function communeWithSpirit() {
    var ba = getBA();
    if (!ba || !ba.spirit || !ba.spirit.awakened) { if (window.showMessage) window.showMessage('器灵未醒，交感无从谈起。', 'warning'); return false; }
    var mins = 30;   // 回执的时长由它生成
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') window.timeSystem.advanceTime(mins, '与器灵交感');
    var gain = 10 + (ba.level || 1) * 2;
    ba.spirit.exp = (ba.spirit.exp || 0) + gain;
    var leveled = _spiritCheckLevelUp(ba);
    var pool = SPIRIT_VOICES[Math.min(SPIRIT_VOICES.length - 1, (ba.spirit.level || 1) - 1)];
    var voice = pool[Math.floor(Math.random() * pool.length)];
    if (window.showMessage && !leveled) {
        window.showMessage('🧘 你与器灵「' + ba.spirit.name + '」心意交感（经验 +' + gain + '，' + ba.spirit.exp + '/' + ba.spirit.expMax + '）。\n' + voice, 'info');
    }
    if (window.updateCharacterStatus) window.updateCharacterStatus();
    return true;
}

// 战斗加成倍率（供 buildPlayerBattleEntity 调用）：法宝每阶 +5% 攻防；v25.5 器灵每级再 +2%
function artifactCombatMul() {
    var ba = getBA();
    if (!ba) return 1.0;
    var mul = 1 + (ba.level - 1) * 0.05;
    if (ba.spirit && ba.spirit.awakened) mul += (ba.spirit.level || 0) * 0.02;
    return mul;
}

window.forgeBondedArtifact = forgeBondedArtifact;
window.feedArtifact = feedArtifact;
window.artifactCombatMul = artifactCombatMul;
window.getBA = getBA;
window.awakenArtifactSpirit = awakenArtifactSpirit;
window.communeWithSpirit = communeWithSpirit;
window.SPIRIT_AWAKEN_COST = SPIRIT_AWAKEN_COST;
window.SPIRIT_AWAKEN_MIN_LEVEL = SPIRIT_AWAKEN_MIN_LEVEL;

})();
