// ==================== qi-environment.js - 灵气环境系统 ====================
// 地点灵气浓度、引导灵气修炼、灵气枯竭
// 加载顺序：在 regions.js 之后
// v20.43 做深：天时地灵共鸣（天气五行合地灵+10%，读取方在 weather-effects）；
// 枯竭警示有纪律（跌破一档报一次，回春再报一次，不刷屏）。
// v27.13：①-漏洞-3 浓度表铺全（23 城+荒野域名+秘境十二座，default 兜底抬到凡城档 1.0）——
// 分档依据与归巢口径见 QI_CONCENTRATION 头注；枯竭纪律一字未动。

// ============ 地点灵气浓度 ============
// v27.13：①-漏洞-3 浓度表只 7 地 → 按地区铺全静态表（主档口径：世界 23 城+荒野+秘境都要有值）。
// 分档五条带（主档修法）：仙山 1.8-2.0 / 灵城 1.3-1.5 / 凡城 1.0 / 荒野 0.8-1.2 / 秘境 1.6-2.2。
// 归巢口径（每条落档依据见行尾注）：
//   · 23 城＝人间 19（regions.js 五域在册）+位面 4（灵界 2+魔界 2）。旧表已有的 17 条**数值一律不挪**
//     （含越出五带的旧档：青城山 1.7 介于仙山/灵城之间；东海龙宫 1.6 是水府秘境级、凤凰巢 1.6 是巢穴
//     秘境级——都按"旧值不挪"记档，不强掰进带）；
//   · 补登缺的两座（regions.js 在册而旧表漏登，均在东南海域）：碧落仙宫=仙山档 1.8、鲛人镇=凡城档 1.0；
//   · 荒野档：键=大域名——randomMap.buildWildMap(region) 拿域名直查本表（此前九域全跌 default 0.8，
//     名山大川无灵气、穷乡僻壤同浓度的洞就在这）；天界域 v44 已有专条 2.5，不另设；
//   · 秘境档：泛键 '秘境' 兜动态生成的无名秘境；dungeon-dynamic.js DUNGEON_TEMPLATES 十二座逐座落带
//     （低阶煞地 1.6 起，幻境/星陨/混沌等大机之地 2.2 封带；type 沿用本表六种元素键供天时共鸣）；
//   · 查无此地的键（宗门名、室内所等）：default 兜底从 0.8 抬到**凡城档 1.0**——在册野地已各自有键，
//     剩下未登记的多是宗门/居所，按凡城算比按荒野算贴；旧值 0.8 记档于此，不算丢账。
// 枯竭纪律照旧不动：globalQiLevel 总闸、depleteQi/restoreWorldQi 警示与 qi-world.js 枯脉改写
// （qc.base×0.25）都作用于本表活对象，新条目自动同闸同警示，本批一个字没碰。
var QI_CONCENTRATION = {
    // —— 仙山档 1.8-2.0 ——
    '太虚山': { base: 1.8, type: 'earth', desc: '仙山福地，灵气充沛', color: 'text-purple-400' },
    '蓬莱仙岛': { base: 2.0, type: 'water', desc: '海上仙山，灵气浓郁', color: 'text-cyan-400' },
    '青城山': { base: 1.7, type: 'earth', desc: '清幽宁静，灵气内敛', color: 'text-green-400' }, // 旧值不挪：道门祖庭，介于仙山/灵城之间
    // —— 灵城档 1.3-1.5（东海龙宫 1.6 旧值不挪：水府秘境级，非城档）——
    '青木城': { base: 1.5, type: 'wood', desc: '木灵之气浓郁', color: 'text-green-400' },
    '东海龙宫': { base: 1.6, type: 'water', desc: '深海龙宫，水灵汇聚', color: 'text-blue-400' },
    '炎城': { base: 1.4, type: 'fire', desc: '火山之地，火灵充沛', color: 'text-red-400' },
    '金城': { base: 1.3, type: 'metal', desc: '金铁之城，金灵旺盛', color: 'text-yellow-400' },
    '剑阁': { base: 1.5, type: 'metal', desc: '万剑归宗，剑气化灵', color: 'text-gray-300' },
    '冰原城': { base: 1.3, type: 'water', desc: '冰雪之地，水灵凝聚', color: 'text-indigo-400' },
    '万剑宗': { base: 1.5, type: 'metal', desc: '万剑立林，剑气化灵', color: 'text-slate-300' },
    // —— 凡城档 1.0（洛水城 1.1 旧值不挪）——
    '帝都·长安': { base: 1.0, type: 'mixed', desc: '繁华帝都，灵气混杂', color: 'text-yellow-400' },
    '洛水城': { base: 1.1, type: 'water', desc: '洛水之畔，灵气平和', color: 'text-blue-400' },
    '鲛人镇': { base: 1.0, type: 'water', desc: '海隅渔镇，珍珠是货不是灵', color: 'text-blue-300' }, // v27.13 补登：凡城档
    '碧落仙宫': { base: 1.8, type: 'water', desc: '海外仙宫，散修福地', color: 'text-cyan-300' }, // v27.13 补登：仙山档
    // —— 野地/非城散档（旧值不挪：谷地、孤城、遗址、异象地本就非城，落在荒野带上下沿）——
    '极寒之地': { base: 1.4, type: 'water', desc: '极寒之地，灵气冰封', color: 'text-blue-300' },
    '万毒谷': { base: 1.2, type: 'wood', desc: '毒瘴弥漫，灵气浑浊', color: 'text-green-600' },
    '大漠孤城': { base: 0.8, type: 'fire', desc: '沙漠之地，灵气稀薄', color: 'text-yellow-600' },
    '凤凰巢': { base: 1.6, type: 'fire', desc: '熔火之巢，火精凝羽', color: 'text-orange-400' }, // 旧值不挪：巢穴秘境级
    '佛国遗址': { base: 1.1, type: 'earth', desc: '佛气沉沙，静而定慧', color: 'text-amber-300' },
    // —— 荒野档 0.8-1.2：键=大域名（randomMap.buildWildMap 按域名查这条；天界域 v44 已另有专条）——
    '中州': { base: 1.0, type: 'mixed', desc: '中原旷野，人多气散', color: 'text-gray-400' },
    '东荒': { base: 1.2, type: 'wood', desc: '苍茫林海，木灵偏盛', color: 'text-green-400' },
    '南疆': { base: 1.1, type: 'fire', desc: '烈焰毒瘴之地，气浊而旺', color: 'text-orange-400' },
    '西漠': { base: 0.8, type: 'earth', desc: '黄沙万里，灵气稀薄', color: 'text-yellow-600' },
    '北冥': { base: 1.0, type: 'water', desc: '冰封旷野，气凝不散', color: 'text-indigo-300' },
    '蜀地': { base: 1.2, type: 'metal', desc: '蜀道灵秀，剑气滋养', color: 'text-slate-300' },
    '东南海域': { base: 1.1, type: 'water', desc: '碧波万顷，水灵随风聚散', color: 'text-cyan-400' },
    '荒野': { base: 1.0, type: 'mixed', desc: '无名野地，灵气随缘', color: 'text-gray-400' }, // 泛键兜底
    '灵界': { base: 4.0, type: 'mixed', desc: '位面野域，灵气凝雾', color: 'text-cyan-300' }, // 同域位面城 4.5/5.5 之野档
    '魔界': { base: 3.4, type: 'fire', desc: '浊气弥野，浓而不纯', color: 'text-purple-400' }, // 同域位面城 3.6/4.0 之野档
    // —— 秘境档 1.6-2.2：泛键 + dungeon-dynamic 十二座（低阶煞地 1.6 起，大机之地封带 2.2）——
    '秘境': { base: 1.8, type: 'mixed', desc: '洞天别境，灵机自成一时', color: 'text-fuchsia-300' },
    '雷泽洞天': { base: 2.0, type: 'metal', desc: '雷泽灵暴，罡雷养气', color: 'text-yellow-200' },
    '古战场': { base: 1.6, type: 'earth', desc: '煞气沉沉，灵机被杀意压着', color: 'text-red-300' },
    '药王遗府': { base: 1.8, type: 'wood', desc: '药灵满府，草木含气', color: 'text-green-300' },
    '海底龙宫': { base: 2.0, type: 'water', desc: '沉渊旧殿，水灵如潮', color: 'text-blue-300' },
    '枯骨渊': { base: 1.6, type: 'earth', desc: '死气盘踞，地脉僵寒', color: 'text-gray-500' },
    '九幽幻境': { base: 2.2, type: 'mixed', desc: '幻境灵机，最盛也最骗人', color: 'text-purple-300' },
    '云海仙阙': { base: 2.0, type: 'wood', desc: '天阙灵云，沐之成雾', color: 'text-sky-300' },
    '五行禁地': { base: 2.1, type: 'mixed', desc: '五行冲激，灵机乱而有劲', color: 'text-orange-300' },
    '星陨古域': { base: 2.2, type: 'metal', desc: '星辉坠地，陨铁犹热', color: 'text-indigo-200' },
    '古神葬地': { base: 1.8, type: 'earth', desc: '神骸入土，余威养灵', color: 'text-stone-400' },
    '天墟遗宫': { base: 2.0, type: 'metal', desc: '天墟遗泽，宫阙半悬', color: 'text-sky-200' },
    '混沌潮眼': { base: 2.2, type: 'mixed', desc: '混沌未分，一息一造化', color: 'text-fuchsia-200' },
    // v20.53 高位面：灵界灵气凝成实质，魔界是浊气（浓而不纯，久留蚀体）——旧值不挪
    '灵界·蓬莱仙境': { base: 4.5, type: 'water', desc: '灵气凝雾，吐纳一口抵人间一日', color: 'text-cyan-300' },
    '灵界·九天罡风带': { base: 5.5, type: 'metal', desc: '罡风裹灵气，浓烈却割人', color: 'text-slate-300' },
    '魔界·九幽深渊': { base: 3.6, type: 'fire', desc: '浊气上涌，炼之快，染之亦快', color: 'text-purple-400' },
    '魔界·血海荒原': { base: 4.0, type: 'fire', desc: '血气弥天，魔物逐血而行', color: 'text-red-500' },
    // v44 天界野外：灵气如潮——打坐吐纳一口，抵得凡间三口（野外图按域名查这条）
    '天界': { base: 2.5, type: 'mixed', desc: '九天灵气如潮，吐纳皆成膏泽', color: 'text-amber-300' },
    'default': { base: 1.0, type: 'mixed', desc: '未在册之地，灵气平平', color: 'text-gray-400' } // v27.13：兜底从 0.8 抬到凡城档 1.0
};

var globalQiLevel = 100; // 世界灵气水平（0-100）

// 地点地灵属性（供天时共鸣判断）
function getQiLocElement(locationName) {
    var data = QI_CONCENTRATION[locationName] || QI_CONCENTRATION['default'];
    return data.type;
}

// 获取地点灵气浓度（v20.43：天时合地灵则共鸣+10%）
function getQiConcentration(locationName) {
    var data = QI_CONCENTRATION[locationName] || QI_CONCENTRATION['default'];
    var conc = data.base * (globalQiLevel / 100);
    if (typeof window.getWeatherQiResonance === 'function') {
        try { conc *= window.getWeatherQiResonance(data.type); } catch (e) {}
    }
    return conc;
}

// 获取修炼速度加成
function getCultivationSpeedBonusFromQi() {
    var loc = window.currentCharData?.location || '';
    var conc = getQiConcentration(loc);
    return conc;
}

// 引导灵气修炼（小游戏）
function guideQiCultivation() {
    if (typeof document !== 'undefined' && document.body) {
        openGuideQiMiniGame();
        return window._lastQiGuideBonus || 1.0;
    }
    var target = 50 + Math.floor(Math.random() * 30);
    var playerChoice = Math.floor(Math.random() * 100);
    var diff = Math.abs(playerChoice - target);
    var bonus = 1.0;
    if (diff < 10) { bonus = 1.5; if (window.showMessage) showMessage('✨ 灵气引导完美！修炼效率+50%', 'success'); }
    else if (diff < 25) { bonus = 1.2; if (window.showMessage) showMessage('👍 灵气引导成功，修炼效率+20%', 'success'); }
    else { if (window.showMessage) showMessage('灵气引导不够精准，无额外加成。', 'info'); }
    window._lastQiGuideBonus = bonus;
    return bonus;
}

function openGuideQiMiniGame() {
    var old = document.getElementById('qi-guide-modal');
    if (old) old.remove();
    var target = 40 + Math.floor(Math.random() * 40);
    var modal = document.createElement('div');
    modal.id = 'qi-guide-modal';
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
    modal.innerHTML = '<div class="bg-gray-800 border-2 border-cyan-500 rounded-xl p-6 max-w-sm w-full mx-4 text-center">' +
        '<h3 class="text-xl font-bold text-cyan-400 mb-2">🌊 引导灵气</h3>' +
        '<p class="text-xs text-gray-400 mb-3">指针接近高亮区时点击「定息」</p>' +
        '<div class="relative h-4 bg-gray-700 rounded mb-2 overflow-hidden">' +
        '<div class="absolute h-full bg-cyan-600/40" style="left:' + (target - 10) + '%;width:20%"></div>' +
        '<div id="qi-pointer" class="absolute top-0 h-full w-1 bg-yellow-400" style="left:0%"></div></div>' +
        '<button id="qi-guide-btn" class="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded font-bold">定息</button>' +
        '<button id="qi-guide-cancel" class="ml-2 text-gray-400 text-sm">取消</button></div>';
    document.body.appendChild(modal);
    var pos = 0, dir = 1;
    var timer = setInterval(function() {
        pos += dir * 2;
        if (pos >= 100) dir = -1;
        if (pos <= 0) dir = 1;
        var ptr = document.getElementById('qi-pointer');
        if (ptr) ptr.style.left = pos + '%';
    }, 30);
    // v20.87 取消钮此前只删弹窗不清定时器——每取消一次就泄漏一个 30ms 的空转 interval
    var cancelBtn = document.getElementById('qi-guide-cancel');
    if (cancelBtn) cancelBtn.onclick = function() {
        clearInterval(timer);
        modal.remove();
    };
    var btn = document.getElementById('qi-guide-btn');
    if (btn) btn.onclick = function() {
        clearInterval(timer);
        var diff = Math.abs(pos - target);
        var bonus = 1.0;
        if (diff < 8) { bonus = 1.5; if (window.showMessage) showMessage('✨ 灵气引导完美！+50%', 'success'); }
        else if (diff < 18) { bonus = 1.25; if (window.showMessage) showMessage('👍 引导成功 +25%', 'success'); }
        else { if (window.showMessage) showMessage('引导偏了', 'info'); }
        window._lastQiGuideBonus = bonus;
        if (bonus >= 1.25 && typeof window.restoreWorldQi === 'function') window.restoreWorldQi(1);
        else if (typeof window.depleteQi === 'function') window.depleteQi(0.5);
        modal.remove();
        if (window.currentCharData && bonus > 1) {
            var gain = Math.floor(15 * bonus);
            window.currentCharData.essence = (window.currentCharData.essence || 0) + gain;
            if (window.showMessage) showMessage('引导修炼 +' + gain + ' 经验', 'success');
        }
        if (typeof window.updateWeatherDisplay === 'function') window.updateWeatherDisplay();
    };
}

// 灵气枯竭（v20.43：跌破一档只报一次，回春再报一次——灾讯不刷屏）
function depleteQi(amount) {
    globalQiLevel = Math.max(0, globalQiLevel - (amount || 1));
    if (typeof window !== 'undefined') window.globalQiLevel = globalQiLevel; // 外部读的是活值，不是快照
    if (globalQiLevel < 30 && !_qiWarned && window.showMessage) {
        _qiWarned = true;
        showMessage('⚠️ 世界灵气正在枯竭，修炼效率大幅降低！', 'warning');
    }
}

function restoreWorldQi(amount) {
    var before = globalQiLevel;
    globalQiLevel = Math.min(100, globalQiLevel + (amount || 5));
    if (typeof window !== 'undefined') window.globalQiLevel = globalQiLevel;
    if (_qiWarned && before < 30 && globalQiLevel >= 30 && window.showMessage) {
        _qiWarned = false;
        showMessage('🌱 天地灵气回春，修炼的涩感散了些。', 'success');
    }
}
var _qiWarned = false;

// 导出
if (typeof window !== 'undefined') {
    window.QI_CONCENTRATION = QI_CONCENTRATION;
    window.getQiConcentration = getQiConcentration;
    window.getQiLocElement = getQiLocElement;
    window.getCultivationSpeedBonusFromQi = getCultivationSpeedBonusFromQi;
    window.guideQiCultivation = guideQiCultivation;
    window.openGuideQiMiniGame = openGuideQiMiniGame;
    window.depleteQi = depleteQi;
    window.restoreWorldQi = restoreWorldQi;
    window.globalQiLevel = globalQiLevel;
}