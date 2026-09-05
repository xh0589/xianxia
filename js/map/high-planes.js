// ==================== high-planes.js - 高位面：灵界/魔界 ====================
// v20.0 起有「御剑飞行 + 跨界按钮」，但位面只有一个空壳：改个 location 字符串，
// 城市面板打不开、回不来、灵气按"普通区域0.8"算——比人间还稀薄。
// v20.53 做实：位面地点进 locationSystem 真源，跨界走 enterCity（同步 currentLocation/事件），
// 位面自己的营生（采撷/探幽/魔功阁/血池）与每日结算（灵机涤尘/魔气蚀体）都在这里。
// 依赖：location-system.js（cityData）、regions.js（灵界/魔界区域）、qi-environment.js（位面灵气）。

(function () {

var PLANE_LOCATIONS = {
    '灵界': ['灵界·蓬莱仙境', '灵界·九天罡风带'],
    '魔界': ['魔界·九幽深渊', '魔界·血海荒原']
};

function planeOf(locationName) {
    if (!locationName) return null;
    if (locationName.indexOf('灵界') === 0) return '灵界';
    if (locationName.indexOf('魔界') === 0) return '魔界';
    return null;
}

function realmTierOf() {
    var cd = window.currentCharData;
    if (!cd) return 0;
    return (typeof window.getRealmTier === 'function') ? (window.getRealmTier(cd.realm) || 0) : 0;
}

function say(msg, type) {
    if (window.showMessage) window.showMessage(msg, type || 'info');
}

// 真气/时间是一个动作的世界成本，不是数值开关
function spendQi(cost) {
    var cd = window.currentCharData;
    if (!cd) return false;
    if ((Number(cd.qi) || 0) < cost) {
        say('真气不足（需 ' + cost + '），强行催动怕是要经脉受损。', 'warning');
        return false;
    }
    cd.qi = Math.max(0, (Number(cd.qi) || 0) - cost);
    return true;
}

function passTime(minutes, reason) {
    if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
        window.timeSystem.advanceTime(minutes, reason);
    }
}

// ==================== 御剑飞行 ====================
function flyTravel(dest) {
    var cd = window.currentCharData;
    if (!cd) { say('请先创建角色', 'warning'); return false; }
    if (realmTierOf() < 2) { say('筑基方可御剑飞行。', 'warning'); return false; }
    if (planeOf(cd.location) && !planeOf(dest)) { say('位面屏障不是剑能劈开的，先渡界回去。', 'warning'); return false; }
    if (planeOf(dest) && !planeOf(cd.location)) { say('那位面得走位面之门，御剑飞不上去。', 'warning'); return false; }
    if ((cd.qi || 0) < 20) { say('真气不足御剑（需≥20）。', 'warning'); return false; }
    if (!dest) { say('未指定目的地。', 'warning'); return false; }
    cd.qi = Math.max(0, (cd.qi || 0) - 20);
    cd.location = dest;
    // 御剑比步行快一倍（30分钟 vs 60分钟）
    passTime(30, '御剑飞行');
    say('🗡️ 你御剑腾空，飞往 ' + dest + '。', 'success');
    if (window.updateCharacterStatus) window.updateCharacterStatus();
    return true;
}

// ==================== 跨越位面（人间 ↔ 灵界/魔界）====================
// 记下出发地，回程才知道往哪落（存档字段 currentCharData._mortalOrigin，随角色整体存取）
var CROSS_QI = 80;      // 撕开界膜的真气成本
var CROSS_MINUTES = 120;

function enterPlane(plane, sub) {
    var cd = window.currentCharData;
    if (!cd) { say('请先创建角色', 'warning'); return false; }
    var tier = realmTierOf();
    var target = null;
    if (plane === '灵界') {
        if (tier < 4) { say('灵界气机就在头顶，可你境界未至元婴，感应不到那道界膜。', 'warning'); return false; }
        target = sub || PLANE_LOCATIONS['灵界'][0];
    } else if (plane === '魔界') {
        if (tier < 5) { say('魔界浊气太重，化神以下进去就是给魔物送血食。', 'warning'); return false; }
        target = sub || PLANE_LOCATIONS['魔界'][0];
    } else {
        say('未知位面。', 'warning'); return false;
    }
    if (planeOf(cd.location) === plane) { say('你已在' + plane + '。', 'info'); return false; }

    if (!spendQi(CROSS_QI)) return false;
    // 记下来时的人间落脚点，回程用
    if (!planeOf(cd.location)) cd._mortalOrigin = cd.location;

    var ok = false;
    if (window.locationSystem && typeof window.locationSystem.enterCity === 'function') {
        ok = window.locationSystem.enterCity(target);
    }
    if (!ok) {
        // 进不去（不该发生：位面地点已入真源）——把真气退回去，别白扣
        cd.qi = (Number(cd.qi) || 0) + CROSS_QI;
        say('界膜未破，你被弹了回来。', 'error');
        return false;
    }
    passTime(CROSS_MINUTES, '跨越位面');
    if (plane === '魔界') {
        say('🌀 你咬牙渡界。浊气扑面而来，先是一阵恶心，然后是说不出的餍足——此地灵气比人间浓得多，只是不太干净。', 'success');
    } else {
        say('🌀 你破开界膜，灵气如潮涌来。吐纳一口，抵得上人间打坐一日。', 'success');
    }
    if (window.updateCharacterStatus) window.updateCharacterStatus();
    return true;
}

// 渡回人间
function returnToMortal() {
    var cd = window.currentCharData;
    if (!cd) return false;
    var here = planeOf(cd.location);
    if (!here) { say('你本就在人间。', 'info'); return false; }
    if (!spendQi(CROSS_QI)) return false;
    var dest = cd._mortalOrigin || '帝都·长安';
    var ok = false;
    if (window.locationSystem && typeof window.locationSystem.enterCity === 'function') {
        ok = window.locationSystem.enterCity(dest);
    }
    if (!ok) { cd.qi = (Number(cd.qi) || 0) + CROSS_QI; say('界膜未破，你被弹了回来。', 'error'); return false; }
    passTime(CROSS_MINUTES, '跨越位面');
    say('🌀 你循着来路渡回人间，落在 ' + dest + '。', 'success');
    return true;
}

// 位面内部移动（灵界/魔界各自两处，走过去就行，但路不好走）
function planeTravel(dest) {
    var cd = window.currentCharData;
    if (!cd) return false;
    var here = planeOf(cd.location);
    if (!here || planeOf(dest) !== here) { say('那条路不通。', 'warning'); return false; }
    if (dest === cd.location) { say('你已在此地。', 'info'); return false; }
    if (!spendQi(20)) return false;
    if (window.locationSystem && typeof window.locationSystem.enterCity === 'function') {
        if (!window.locationSystem.enterCity(dest)) { cd.qi = (Number(cd.qi) || 0) + 20; return false; }
    }
    passTime(90, '位面跋涉');
    say('🚶 你在' + here + '赶路 ' + dest + '——此地一步十里，全凭真元托身。', 'success');
    return true;
}

// ==================== 位面营生：采撷（仙田/魔材矿脉）====================
// 位面特产不入人间货架：灵界出仙品，魔界出魔材，都得靠真元护身才采得动
var PLANE_GATHER = {
    '灵界': {
        minutes: 90, qi: 25,
        loot: [
            { id: 'mat_nine_leaf_lingzhi', w: 3, n: 1 },
            { id: 'mat_heaven_heart_flower', w: 3, n: 1 },
            { id: 'mat_five_element_essence', w: 2, n: 1 },
            { id: 'mat_moon_stone', w: 2, n: 2 }
        ],
        msg: '你在仙田间俯身采撷，指尖灵气凝而不散——这里的草木自己是会修行的。'
    },
    '魔界': {
        minutes: 90, qi: 30,
        loot: [
            { id: 'mat_chaos_stone', w: 3, n: 1 },
            { id: 'mat_dragon_crystal', w: 2, n: 1 },
            { id: 'mat_meteorite', w: 2, n: 1 },
            { id: 'mat_dark_iron', w: 3, n: 2 }
        ],
        msg: '你撬下一块魔材，裂缝里渗出的浊气熏得你头晕。此地矿脉是魔物尸骸养的，采多了怕引来主家。'
    }
};

function _pickWeighted(list) {
    var total = 0, i;
    for (i = 0; i < list.length; i++) total += list[i].w;
    var roll = Math.random() * total;
    for (i = 0; i < list.length; i++) { roll -= list[i].w; if (roll <= 0) return list[i]; }
    return list[list.length - 1];
}

function planeGather(plane) {
    var cd = window.currentCharData;
    if (!cd) return false;
    var cfg = PLANE_GATHER[plane || planeOf(cd.location)];
    if (!cfg || planeOf(cd.location) !== (plane || planeOf(cd.location))) { say('此地没有那样的田。', 'warning'); return false; }
    if (!spendQi(cfg.qi)) return false;
    var drops = [];
    var count = 1 + (Math.random() < 0.4 ? 1 : 0);
    for (var i = 0; i < count; i++) {
        var pick = _pickWeighted(cfg.loot);
        if (window.addItem) window.addItem(pick.id, pick.n);
        drops.push(pick.n + ' 份灵材');
    }
    passTime(cfg.minutes, '位面采撷');
    say('🌿 ' + cfg.msg + '（得 ' + drops.join('、') + '）', 'success');
    if (window.updateCharacterStatus) window.updateCharacterStatus();
    return true;
}

// ==================== 位面营生：探幽（高位面遭遇）====================
// 位面的强敌不是按玩家 layer 重掷出来的，是写死的档位：灵界从元婴起，魔界从化神起。
function planeExplore() {
    var cd = window.currentCharData;
    if (!cd) return false;
    var here = planeOf(cd.location);
    if (!here) { say('此地无幽可探。', 'warning'); return false; }
    if (!spendQi(40)) return false;

    // 主线决战（v20.53）：魔仙玄冥子遁入魔界血海荒原——正主在这儿，别处探不到
    if (here === '魔界' && window.QuestRegistry && typeof window.QuestRegistry.get === 'function') {
        var m9 = window.QuestRegistry.get('main_009');
        if (m9 && m9.accepted && !m9.completed && typeof window.startMainStoryBoss === 'function') {
            passTime(60, '位面探幽');
            say('🩸 血海尽头站着一个不该站在这里的人。他回头看你，语气像在叙旧：「你来了。」', 'danger');
            window.startMainStoryBoss('xuanming_immortal');
            return true;
        }
    }

    var tier = realmTierOf();
    // 敌档：灵界 元婴(level 45)~化神(60)；魔界 化神(60)~炼虚(75)
    var baseLevel = here === '灵界' ? 45 : 60;
    var enemyLevel = baseLevel + (Math.random() < 0.3 ? 15 : 0);
    var roll = Math.random();

    if (roll < 0.42) {
        var isBeast = here === '灵界';
        var enemy = {
            name: here === '灵界' ? '仙域妖禽' : '血原魔物',
            type: isBeast ? 'beast' : 'enemy',
            species: isBeast ? 'beast' : 'enemy',
            level: enemyLevel,
            attack: 60 + enemyLevel * 1.2,
            defense: 30 + enemyLevel * 0.8,
            speed: 28,
            maxHp: 400 + enemyLevel * 30,
            hp: 400 + enemyLevel * 30,
            combatAbilities: []
        };
        passTime(45, '位面探幽');
        say(here === '灵界'
            ? '🕊️ 你循着灵气往深处走，头顶云层裂开——一只妖禽俯冲而下，翅风先到，剑气后至。'
            : '🩸 荒原上的血气突然朝你涌过来——有东西闻到你的血了。', 'danger');
        if (window.startBattle) window.startBattle(enemy);
        return true;
    }
    if (roll < 0.75) {
        var lootPlane = here === '灵界' ? '灵界' : '魔界';
        var gain = [];
        var got = 2;
        for (var i = 0; i < got; i++) {
            var pick = _pickWeighted(PLANE_GATHER[lootPlane].loot);
            if (window.addItem) window.addItem(pick.id, pick.n);
            gain.push((window.itemById && window.itemById[pick.id] && window.itemById[pick.id].name) || pick.id);
        }
        passTime(60, '位面探幽');
        say('🏺 你摸进一处无人问津的' + (here === '灵界' ? '仙府残迹' : '塌陷窟室') + '，寻得 ' + gain.join('、') + '。', 'success');
        return true;
    }
    if (roll < 0.9) {
        // 仙缘/魔缘：顿悟
        var insight = 1 + (tier >= 5 ? 1 : 0);
        if (typeof window.addInsightPoints === 'function') window.addInsightPoints(insight);
        else if (typeof window.insightPoints === 'number') window.insightPoints += insight;
        passTime(120, '位面悟道');
        say(here === '灵界'
            ? '🌊 你在灵气潮汐里枯坐两时辰，忽有所悟——此地灵气自己会流动，照着它的路子走，比你过去二十年苦修都顺。（领悟 +' + insight + '）'
            : '🩸 你看着血海里一具枯骨坐化的姿势，忽然懂了他临死前在守什么。（领悟 +' + insight + '）', 'success');
        return true;
    }
    // 遇人不淑：位面修士不讲人间规矩
    var rival = {
        name: here === '灵界' ? '巡界仙官' : '夺食魔修',
        type: 'enemy',
        level: enemyLevel + 5,
        attack: 70 + enemyLevel * 1.3,
        defense: 35 + enemyLevel,
        speed: 30,
        maxHp: 500 + enemyLevel * 35,
        hp: 500 + enemyLevel * 35,
        combatAbilities: []
    };
    passTime(45, '位面探幽');
    say(here === '灵界'
        ? '⚖️ 「此地灵物，岂容你个下界修士随手拿取？」巡界仙官落在你面前，袖子已经挽起来了。'
        : '🔪 「你身上那点血，倒比这荒原上的干净。」那魔修舔了舔刀。', 'danger');
    if (window.startBattle) window.startBattle(rival);
    return true;
}

// ==================== 魔功阁（九幽深渊）====================
// 魔界立市的另一桩买卖：魔功不白给，要么拿魔材换，要么拿寿元换
function openDemonArts() {
    var cd = window.currentCharData;
    if (!cd) return false;
    if (planeOf(cd.location) !== '魔界') { say('此地没有魔功阁。', 'warning'); return false; }
    var trade = function () {
        if (!window.inventory || !window.inventory.currency) return false;
        if ((window.inventory.currency.spiritStones || 0) < 600) { say('管秤的老魔翻了个白眼：「六百灵石，少一文都不开柜。」', 'warning'); return false; }
        var res = window.RewardService ? window.RewardService.apply({ stones: -600, items: [{ itemId: 'mat_chaos_stone', count: 1 }], take: [{ itemId: 'mat_dragon_crystal', count: 1 }] },
            { source: 'demon-arts' }) : null;
        if (res && res.success === false) { say('你的货不齐，柜子不开。', 'warning'); return false; }
        passTime(30, '魔功阁交易');
        say('📖 老魔从柜底摸出一卷以皮纸抄的功法残页塞给你：「魔道不养闲人，学不学得会看你造化。」', 'success');
        return true;
    };
    if (typeof window.showModal === 'function') {
        window.showModal('魔功阁', '<p class="text-sm text-gray-300 mb-3">守炉老魔把一摞皮纸推到你面前："魔功不白给。六百灵石换一卷残页，外加一块龙晶作抵押——魔道讲究个投名状。"</p>'
            + '<button onclick="this.closest(\'.modal-overlay\') && this.closest(\'.modal-overlay\').remove(); window._demonArtsTrade()" class="bg-purple-700 hover:bg-purple-600 text-white px-3 py-1 rounded text-xs mr-2">拿灵石换残页</button>'
            + '<button onclick="this.closest(\'.modal-overlay\') && this.closest(\'.modal-overlay\').remove()" class="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded text-xs">只是看看</button>');
        window._demonArtsTrade = trade;
    } else {
        trade();
    }
    return true;
}

// ==================== 血池（血海荒原）====================
// 以血肉养魔气：短时大涨修为，代价是寿元与浊气入体
function planeBloodPool() {
    var cd = window.currentCharData;
    if (!cd) return false;
    if (planeOf(cd.location) !== '魔界') { say('此地没有血池。', 'warning'); return false; }
    if ((Number(cd.qi) || 0) < 50) { say('你需要至少 50 点真气护住心脉，才能在血池里泡着。', 'warning'); return false; }
    cd.qi = Math.max(0, (Number(cd.qi) || 0) - 50);
    if (typeof window.addExp === 'function') window.addExp(400 + realmTierOf() * 200);
    if (typeof window.spendLifespan === 'function') window.spendLifespan(1);
    passTime(180, '血池淬体');
    say('🩸 你沉入血池，浊气顺着毛孔往里钻——修为涨得飞快，代价是你能听见自己的寿元在滴漏。（寿元 -1）', 'success');
    if (window.updateCharacterStatus) window.updateCharacterStatus();
    return true;
}

// ==================== 位面打坐（风眼灵穴等）====================
function planeCultivate() {
    var cd = window.currentCharData;
    if (!cd) return false;
    if (!planeOf(cd.location)) { say('此地无穴可坐。', 'warning'); return false; }
    if (!spendQi(30)) return false;
    passTime(120, '位面悟道');
    var gain = 300 + realmTierOf() * 150;
    if (typeof window.addExp === 'function') window.addExp(gain);
    say('🧘 你在' + cd.location + '入定两时辰，此地灵气自己往你经脉里钻。（修为 +' + gain + '）', 'success');
    return true;
}

// ==================== 每日结算：灵机涤尘 / 魔气蚀体 ====================
// 位面的日常代价与馈赠——灵界灵气养人，魔界浊气蚀体，都是世界本身，不是次数配额
function onPlaneNewDay() {
    var cd = window.currentCharData;
    if (!cd) return;
    var here = planeOf(cd.location);
    if (!here) return;
    var maxQi = (typeof window.getEffectiveMax === 'function') ? window.getEffectiveMax('maxQi') : (cd.maxQi || 100);
    if (here === '灵界') {
        cd.qi = Math.min(maxQi, (Number(cd.qi) || 0) + Math.round(maxQi * 0.2));
        say('🌫️ 一夜灵机涤尘，醒来时真气已恢复了大半——此地灵气是自己会往人身体里走的。', 'success');
    } else {
        var drain = Math.round(maxQi * 0.15);
        cd.qi = Math.max(0, (Number(cd.qi) || 0) - drain);
        var msg = '🌑 浊气入体，一夜过去真气反而亏了 ' + drain + '——魔界的空气在吃你。';
        // 正道弟子在魔界久留，宗门那边会有耳目
        var ds = window.discipleState;
        if (ds && ds.isInSect && ds._faction === '正道') {
            msg += '（正道门中已有耳目，你在此地的行止瞒不住太久。）';
        }
        say(msg, 'warning');
    }
    if (window.updateCharacterStatus) window.updateCharacterStatus();
}

// ==================== 位面总览面板 ====================
function openPlanePanel() {
    var cd = window.currentCharData;
    if (!cd) return false;
    var here = planeOf(cd.location);
    var tier = realmTierOf();
    var html = '<div class="space-y-3 text-sm">';
    html += '<p class="text-gray-300">界膜之上另有天地。灵界灵气凝雾，元婴方可感应；魔界浊气蚀体，化神以下进去就是送血食。</p>';
    html += '<p class="text-xs ' + (here ? 'text-cyan-300' : 'text-gray-500') + '">当前位置：' + (here ? cd.location + '（位面内）' : '人间') + '</p>';
    if (!here) {
        html += '<div class="border-t border-gray-700 pt-2 space-y-2">';
        html += '<div class="flex items-center justify-between"><span class="text-gray-300">灵界·蓬莱仙境（元婴+）</span>'
            + '<button onclick="window.closeModalSoft && window.closeModalSoft(); window.enterPlane(\'灵界\')" class="' + (tier >= 4 ? 'bg-teal-600 hover:bg-teal-500' : 'bg-gray-700 text-gray-500') + ' text-white px-3 py-1 rounded text-xs">渡界</button></div>';
        html += '<div class="flex items-center justify-between"><span class="text-gray-300">魔界·九幽深渊（化神+）</span>'
            + '<button onclick="window.closeModalSoft && window.closeModalSoft(); window.enterPlane(\'魔界\')" class="' + (tier >= 5 ? 'bg-purple-700 hover:bg-purple-600' : 'bg-gray-700 text-gray-500') + ' text-white px-3 py-1 rounded text-xs">渡界</button></div>';
        html += '<p class="text-xs text-gray-500">渡界耗真气 ' + CROSS_QI + '、行程 ' + CROSS_MINUTES + ' 分钟。回程走这里，别指望御剑能劈开界膜。</p>';
        html += '</div>';
    } else {
        var others = PLANE_LOCATIONS[here].filter(function (n) { return n !== cd.location; });
        html += '<div class="border-t border-gray-700 pt-2 space-y-2">';
        others.forEach(function (n) {
            html += '<div class="flex items-center justify-between"><span class="text-gray-300">' + n + '</span>'
                + '<button onclick="window.closeModalSoft && window.closeModalSoft(); window.planeTravel(\'' + n + '\')" class="bg-cyan-700 hover:bg-cyan-600 text-white px-3 py-1 rounded text-xs">前往</button></div>';
        });
        html += '<div class="flex items-center justify-between"><span class="text-gray-300">位面探幽（真气 40，遭遇未可知）</span>'
            + '<button onclick="window.closeModalSoft && window.closeModalSoft(); window.planeExplore()" class="bg-amber-700 hover:bg-amber-600 text-white px-3 py-1 rounded text-xs">探幽</button></div>';
        html += '<div class="flex items-center justify-between"><span class="text-gray-300">渡回人间（真气 ' + CROSS_QI + '）</span>'
            + '<button onclick="window.closeModalSoft && window.closeModalSoft(); window.returnToMortal()" class="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded text-xs">渡界</button></div>';
        html += '</div>';
    }
    html += '</div>';
    if (typeof window.showModal === 'function') window.showModal('🌀 位面之门', html);
    else say('位面之门未开。', 'warning');
    return true;
}

function closeModalSoft() {
    var ov = document.getElementById('xianxia-modal-overlay');
    if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
}

window.flyTravel = flyTravel;
window.enterPlane = enterPlane;
window.returnToMortal = returnToMortal;
window.planeTravel = planeTravel;
window.planeGather = planeGather;
window.planeExplore = planeExplore;
window.planeCultivate = planeCultivate;
window.planeBloodPool = planeBloodPool;
window.openDemonArts = openDemonArts;
window.openPlanePanel = openPlanePanel;
window.closeModalSoft = closeModalSoft;
window.getPlaneOf = planeOf;

// 每日结算：位面在时才开口，不打扰人间日结
if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') {
    window.timeSystem.onNewDaySubscribe(onPlaneNewDay);
} else {
    window._planeNewDayHook = onPlaneNewDay;
}

})();
