// ==================== origin-talent.js - v20.1 开局出身 + 天赋 ====================
// 对标鬼谷八荒：开局选出身（寒门/世家/散修/弃徒）影响起始资源 + 选天赋（永久 buff）
// 出身资源在 collectCharacterData 一次性写入既有字段；天赋存 charData.talent，战斗/修炼时读取
// 依赖：collectCharacterData、buildPlayerBattleEntity、cultivationMeditate、getQiDeviationPenalty

(function () {

var ORIGINS = [
    {
        id: 'humble', name: '寒门子弟', icon: '🌾',
        desc: '出身清寒，意志坚韧。起灵石少、铜钱薄，但气运略高、根骨扎实。',
        apply: function (cd) {
            cd.spiritStones = (cd.spiritStones || 0) + 0;
            cd.copper = (cd.copper || 0) + 200;
            cd.luck = Math.min(100, (cd.luck || 50) + 5);
            cd.tempering = (cd.tempering || 0) + 10;
        }
    },
    {
        id: 'noble', name: '世家子弟', icon: '🏯',
        desc: '名门之后，资源丰厚。起灵石多、铜钱足，初始有名望，但娇贵气运略低。',
        apply: function (cd) {
            // F-19 修：走 DataManager 同步双源 inventory.currency（否则读档后只剩 10 灵石）
            var _dm = (window.XianXia && window.XianXia.DataManager) || (window.DataManager);
            if (_dm && _dm.addSpiritStones) _dm.addSpiritStones(300); else cd.spiritStones = (cd.spiritStones || 0) + 300;
            if (_dm && _dm.addCopper) _dm.addCopper(1000); else cd.copper = (cd.copper || 0) + 1000;
            cd.fame = (cd.fame || 0) + 30;
            cd.luck = Math.max(0, (cd.luck || 50) - 5);
        }
    },
    {
        id: 'wanderer', name: '散修传人', icon: '🌿',
        desc: '师门早逝，独自修行。资源平平，但阅世渐深，气运中平、历练略丰。',
        apply: function (cd) {
            // F-19 修：同步双源
            var _dm = (window.XianXia && window.XianXia.DataManager) || (window.DataManager);
            if (_dm && _dm.addSpiritStones) _dm.addSpiritStones(50); else cd.spiritStones = (cd.spiritStones || 0) + 50;
            if (_dm && _dm.addCopper) _dm.addCopper(50); else cd.copper = (cd.copper || 0) + 50;
            cd.luck = (cd.luck || 50);
            cd.tempering = (cd.tempering || 0) + 30;
        }
    },
    {
        id: 'exile', name: '弃徒之后', icon: '⚔️',
        desc: '背负旧案，江湖漂泊。名声负、资源寡，但阅历深厚、历练丰厚，逆境中成长更快。',
        apply: function (cd) {
            // F-19 修：同步双源
            var _dm = (window.XianXia && window.XianXia.DataManager) || (window.DataManager);
            if (_dm && _dm.addSpiritStones) _dm.addSpiritStones(10); else cd.spiritStones = (cd.spiritStones || 0) + 10;
            if (_dm && _dm.addCopper) _dm.addCopper(50); else cd.copper = (cd.copper || 0) + 50;
            cd.fame = (cd.fame || 0) - 20;
            cd.tempering = (cd.tempering || 0) + 60;
            cd.luck = (cd.luck || 50);
        }
    }
];

var TALENTS = [
    { id: 'sword',  name: '剑骨',  icon: '🗡️', desc: '攻击 +10%（天生剑修胚子）' },
    { id: 'iron',   name: '铁骨',  icon: '🛡️', desc: '防御 +10%（筋骨坚如铁石）' },
    { id: 'qi',     name: '灵机',  icon: '✨',  desc: '修炼真元 +10%（悟性过人）' },
    { id: 'dao',    name: '道心',  icon: '🧘', desc: '走火入魔概率 -30%（心性通明）' },
    { id: 'luck',   name: '福星',  icon: '🍀', desc: '初始气运 +15（天生命好）' }
];

var _selectedOrigin = null;
var _selectedTalent = null;

function getOrigin(id) { return ORIGINS.find(function (o) { return o.id === id; }) || null; }
function getTalent(id) { return TALENTS.find(function (t) { return t.id === id; }) || null; }

function selectOrigin(id) {
    _selectedOrigin = id;
    document.querySelectorAll('.origin-option').forEach(function (el) {
        var on = el.dataset.origin === id;
        el.classList.toggle('selected', on);
        el.classList.toggle('border-yellow-500', on);
        el.classList.toggle('border-gray-600', !on);
    });
}

function selectTalent(id) {
    _selectedTalent = id;
    document.querySelectorAll('.talent-option').forEach(function (el) {
        var on = el.dataset.talent === id;
        el.classList.toggle('selected', on);
        el.classList.toggle('border-yellow-500', on);
        el.classList.toggle('border-gray-600', !on);
    });
}

// 在 collectCharacterData 调用：把出身资源写入既有字段 + 存 origin/talent 标识
function applyToCharData(cd) {
    if (!cd) return;
    // 默认出身：寒门（未选时）
    var origin = getOrigin(_selectedOrigin) || ORIGINS[0];
    try { origin.apply(cd); } catch (e) {}
    cd.origin = origin.id;

    // 天赋：未选则无（cd.talent 为 null）
    var talent = getTalent(_selectedTalent);
    cd.talent = talent ? talent.id : null;
    // 福星：初始气运 +15
    if (talent && talent.id === 'luck') {
        cd.luck = Math.min(100, (cd.luck || 50) + 15);
    }
}

// 战斗攻击倍率（剑骨 +10%）
function talentAtkMul(cd) {
    if (cd && cd.talent === 'sword') return 1.10;
    return 1.0;
}
// 战斗防御倍率（铁骨 +10%）
function talentDefMul(cd) {
    if (cd && cd.talent === 'iron') return 1.10;
    return 1.0;
}
// 修炼真元倍率（灵机 +10%）
function talentEssenceMul(cd) {
    if (cd && cd.talent === 'qi') return 1.10;
    return 1.0;
}
// 走火入魔概率减免（道心 -30%）
function talentHeartDemonMul(cd) {
    if (cd && cd.talent === 'dao') return 0.70;
    return 1.0;
}

function describeOrigin(id) { var o = getOrigin(id); return o ? o.icon + ' ' + o.name : '—'; }
function describeTalent(id) { var t = getTalent(id); return t ? t.icon + ' ' + t.name + '：' + t.desc : '无'; }

window.ORIGINS = ORIGINS;
window.TALENTS = TALENTS;
window.selectOrigin = selectOrigin;
window.selectTalent = selectTalent;
window.applyOriginTalentToCharData = applyToCharData;
window.talentAtkMul = talentAtkMul;
window.talentDefMul = talentDefMul;
window.talentEssenceMul = talentEssenceMul;
window.talentHeartDemonMul = talentHeartDemonMul;
window.describeOrigin = describeOrigin;
window.describeTalent = describeTalent;

})();
