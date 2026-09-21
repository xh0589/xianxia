// ==================== spirit-vein.js - v20.0 2.13 灵脉/灵石矿经营 ====================
// 金丹+可占据灵脉，每日被动产灵石；可升级提升产出
// v35：野外图上的「灵脉之眼」可亲自布阵夺取——与菜单占脉合成一本账（任何时刻只有一处灵脉），
//      地图脉按灵蕴定产（一重25/二重35/三重50），已有菜单脉再夺地图脉按「迁脉」折价办理
// 依赖：DataManager、timeSystem.onNewDaySubscribe

(function () {

// 地图脉眼按灵蕴定基础日产——比菜单托管的小脉（20）高，高的部分是脚钱和风险钱
var MAP_LEY_OUTPUT = { 1: 25, 2: 35, 3: 50 };
var CLAIM_COST = 1000;      // 布阵造价（菜单脉与地图脉同价）
var MOVE_COST = 600;        // 已占菜单小脉、再夺地图脉：迁脉折价

function getVein() {
    var cd = window.currentCharData;
    if (!cd) return null;
    if (!cd._spiritVein) cd._spiritVein = null;
    return cd._spiritVein;
}

function absDay() {
    return (window.timeSystem && window.timeSystem.getAbsoluteDay) ? window.timeSystem.getAbsoluteDay() : 0;
}

// 占据灵脉（菜单版）：金丹+，扣灵石——托底的远处小脉，没有地点
function claimSpiritVein() {
    var cd = window.currentCharData;
    if (!cd) { if (window.showMessage) window.showMessage('请先创建角色', 'warning'); return false; }
    var tier = (typeof window.getRealmTier === 'function') ? window.getRealmTier(cd.realm) : 0;
    if (tier < 3) { if (window.showMessage) window.showMessage('需金丹以上方可占据灵脉。', 'warning'); return false; }
    if (cd._spiritVein) { if (window.showMessage) window.showMessage('你已占据一处灵脉。', 'info'); return false; }
    if (window.DataManager && window.DataManager.deductSpiritStones && !window.DataManager.deductSpiritStones(CLAIM_COST)) {
        if (window.showMessage) window.showMessage('占据灵脉需 ' + CLAIM_COST + ' 灵石安顿阵法。', 'warning');
        return false;
    }
    cd._spiritVein = { tier: 1, dailyOutput: 20, claimedDay: absDay() };
    if (window.showMessage) window.showMessage('💎 你布阵占据一处灵脉，每日可得 20 灵石。（野外图上的「灵脉之眼」灵气更盛，亲自去占产出更高）', 'success');
    return true;
}

// v35 夺脉：站在野外图的脉眼上布阵——金丹+、真扣灵石、任何时刻只有一处灵脉
// loc = { region, x, y, ley }；已有菜单小脉则折价迁脉（保留已升的阶数）
function claimMapLey(loc) {
    var cd = window.currentCharData;
    if (!cd) { if (window.showMessage) window.showMessage('请先创建角色', 'warning'); return false; }
    if (!loc || !loc.region) { if (window.showMessage) window.showMessage('此处寻不到脉眼。', 'warning'); return false; }
    var ley = Math.max(1, Math.min(3, Number(loc.ley) || 1));
    var tier = (typeof window.getRealmTier === 'function') ? window.getRealmTier(cd.realm) : 0;
    if (tier < 3) { if (window.showMessage) window.showMessage('脉眼灵气太盛，需金丹以上方可布阵镇住。', 'warning'); return false; }
    var old = cd._spiritVein;
    var isMove = !!(old && !old.location);           // 菜单小脉 → 迁脉
    if (old && old.location) {
        if (window.showMessage) window.showMessage('你已在' + old.location.region + '占得灵脉——一处根基足矣，贪多嚼不烂。', 'info');
        return false;
    }
    var cost = isMove ? MOVE_COST : CLAIM_COST;
    if (window.DataManager && window.DataManager.deductSpiritStones && !window.DataManager.deductSpiritStones(cost)) {
        if (window.showMessage) window.showMessage((isMove ? '迁脉重布阵法' : '布阵夺脉') + '需 ' + cost + ' 灵石。', 'warning');
        return false;
    }
    var keepTier = isMove ? (old.tier || 1) : 1;     // 迁脉带走已升的阶数
    var base = MAP_LEY_OUTPUT[ley] || 25;
    cd._spiritVein = {
        tier: keepTier,
        baseOutput: base,
        dailyOutput: base + (keepTier - 1) * 15,
        claimedDay: absDay(),
        location: { region: loc.region, x: Number(loc.x) || 0, y: Number(loc.y) || 0, ley: ley }
    };
    if (window.showMessage) {
        window.showMessage('💎 你在' + loc.region + '（' + cd._spiritVein.location.x + ',' + cd._spiritVein.location.y + '）的脉眼上布下护脉大阵——' +
            ley + ' 重灵蕴的灵脉归了你，每日可得 ' + cd._spiritVein.dailyOutput + ' 灵石。' +
            (isMove ? '原先托管的小脉已并作一处。' : ''), 'success');
    }
    if (window.gameLog && window.gameLog.add) window.gameLog.add('夺占' + ley + '重灵脉（' + loc.region + '），日产 ' + cd._spiritVein.dailyOutput + ' 灵石', 'info');
    return true;
}

// 升级灵脉：扣灵石提 tier/dailyOutput（基数按脉的出身：地图脉看灵蕴，菜单脉是 20）
function upgradeVein() {
    var cd = window.currentCharData;
    if (!cd || !cd._spiritVein) { if (window.showMessage) window.showMessage('你尚未占据灵脉。', 'warning'); return false; }
    var v = cd._spiritVein;
    if (v.tier >= 5) { if (window.showMessage) window.showMessage('灵脉已臻极盛。', 'info'); return false; }
    var cost = v.tier * 800;
    if (window.DataManager && window.DataManager.deductSpiritStones && !window.DataManager.deductSpiritStones(cost)) {
        if (window.showMessage) window.showMessage('升级需 ' + cost + ' 灵石。', 'warning');
        return false;
    }
    v.tier += 1;
    v.dailyOutput = (v.baseOutput || 20) + (v.tier - 1) * 15;
    if (window.showMessage) window.showMessage('💎 灵脉升级至 ' + v.tier + ' 阶，日产 ' + v.dailyOutput + ' 灵石。', 'success');
    return true;
}

// 每日产出
function dailyVeinOutput() {
    try {
        var cd = window.currentCharData;
        if (!cd || !cd._spiritVein) return;
        var v = cd._spiritVein;
        var gain = v.dailyOutput || 20;
        // v23.0 灵脉不是点击回本机：产出随灵潮涨落（±20%），且有一成概率被散修夜袭分流——
        // 阵法升到三阶方可镇住宵小（升级第一次有了防御意义）
        gain = Math.max(1, Math.round(gain * (0.8 + Math.random() * 0.4)));
        if ((v.tier || 1) < 3 && Math.random() < 0.1) {
            gain = Math.floor(gain / 2);
            if (window.showMessage) window.showMessage('⚠️ 有散修夜里来灵脉偷采，护脉阵法勉强将其惊走——今日产出折半。（升级阵法至三阶可绝此后患）', 'warning');
            if (window.gameLog && window.gameLog.add) window.gameLog.add('灵脉遭宵小光顾，产出折半', 'warning');
        }
        if (window.DataManager && window.DataManager.addSpiritStones) {
            window.DataManager.addSpiritStones(gain);
            if (window.gameLog && window.gameLog.add) window.gameLog.add('灵脉产出灵石 +' + gain, 'info');
        }
    } catch (e) {}
}

// 给 UI 用的一句话：脉在哪（菜单脉没有地点）
function veinLocationText(v) {
    v = v || getVein();
    if (!v) return '';
    if (!v.location) return '远处托管的小脉';
    return v.location.region + '（' + v.location.x + ',' + v.location.y + '）· ' + (v.location.ley || 1) + ' 重灵蕴';
}

if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') {
    window.timeSystem.onNewDaySubscribe(dailyVeinOutput);
}

window.claimSpiritVein = claimSpiritVein;
window.claimMapLey = claimMapLey;
window.upgradeVein = upgradeVein;
window.getSpiritVein = getVein;
window.veinLocationText = veinLocationText;
window.MAP_LEY_OUTPUT = MAP_LEY_OUTPUT;

})();
