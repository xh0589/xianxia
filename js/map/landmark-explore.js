// ==================== landmark-explore.js - 地标探索系统 ====================
// 探索度、隐藏内容、图鉴系统
// 依赖：map-markers.js (LANDMARKS)
// 加载顺序：在 map-markers.js 之后，app.js 之前
// 第三十四波 · 查账修讫：①野外图上点地标从此真进探索（旧账传英文键对不上中文名录，永远「未知的地标」还白扣一个半时辰）；
//   ②十二处地标全有探索数据（旧账只有六处）；③奖励真账——属性落战斗真源（attrs 与主属性两本同记）、
//   功法感悟落真元、名号落名望、淬体名目如实（旧账写的是没人读的假字段）；④已领的奖励与隐藏内容随档存——读档不再重领（旧账是白嫖漏洞）。

// ============ 地标探索数据 ============
const LANDMARK_EXPLORE_DATA = {
    '古剑峰': {
        id: 'gu_jian_feng',
        name: '古剑峰',
        desc: '传说中上古剑修留下的剑峰，万剑插于山体之上',
        icon: '🗡️',
        exploreProgress: 0,
        maxProgress: 100,
        rewards: [
            { progress: 20, reward: { type: 'item', id: 'mat_ancient_sword_fragment', count: 1 }, msg: '你发现了上古剑器的碎片！' },
            { progress: 40, reward: { type: 'exp', value: 500 }, msg: '你在剑峰上感悟到一丝剑意——筋骨为之一壮！（淬体+500）' },
            { progress: 60, reward: { type: 'item', id: 'mat_spirit_steel', count: 3 }, msg: '你找到了一块珍贵的灵钢！' },
            { progress: 80, reward: { type: 'skill', name: '古剑诀' }, msg: '你参悟了「古剑诀」的剑意——无法门正授，剑意已入骨血。（淬体+150）' },
            { progress: 100, reward: { type: 'title', name: '古剑传承者' }, msg: '你得了「古剑传承者」的名号——茶棚里都开始这么叫你。（名望+15）' }
        ],
        hidden: {
            condition: { realm: '筑基' },   // 第三十四波：旧账门禁物品 mat_ancient_key 全仓不存在 → 隐藏内容永不可达；改境界门（筑基方可探入剑冢深处）
            content: '你以筑基修为踏入剑峰深处，发现了一个隐藏的剑冢！',
            reward: { type: 'skill', name: '万剑归宗', msg: '隐藏剑冢的传承灌顶——「万剑归宗」的剑意涌入识海！（淬体+150）' }
        },
        events: [
            { text: '你发现了一柄插在岩石中的古剑，似乎可以拔出来……', prob: 0.3, action: 'pull_sword' },
            { text: '山风吹过，剑峰上传来阵阵剑鸣。', prob: 0.5 },
            { text: '你在剑峰上看到了一处古老的剑痕，蕴含着深奥的剑意。', prob: 0.4 }
        ]
    },
    '龙脉': {
        id: 'dragon_vein',
        name: '龙脉',
        desc: '一条沉睡的龙脉，蕴含着强大的龙气',
        icon: '🐉',
        exploreProgress: 0,
        maxProgress: 100,
        rewards: [
            { progress: 25, reward: { type: 'item', id: 'mat_dragon_scale', count: 1 }, msg: '你捡到了一片龙鳞！' },
            { progress: 50, reward: { type: 'attr', name: '体质', value: 3 }, msg: '龙气淬体，体质+3！' },
            { progress: 75, reward: { type: 'item', id: 'mat_dragon_bone', count: 1 }, msg: '你发现了一根龙骨！' },
            { progress: 100, reward: { type: 'skill', name: '龙象般若功' }, msg: '你从龙脉中参悟了「龙象般若功」的劲路——龙气入骨。（淬体+150）' }
        ],
        hidden: {
            condition: { realm: '金丹' },
            content: '你以金丹之力引动龙脉深处的龙魂！',
            reward: { type: 'item', id: 'mat_dragon_soul', count: 1, msg: '你得到了一枚龙魂！' }
        }
    },
    '魂殿': {
        id: 'hun_dian',
        name: '魂殿',
        desc: '上古灵魂修行者的遗址，阴气森森',
        icon: '👻',
        exploreProgress: 0,
        maxProgress: 100,
        rewards: [
            { progress: 30, reward: { type: 'attr', name: '意志', value: 5 }, msg: '你在魂殿中磨练了意志！' },
            { progress: 60, reward: { type: 'item', id: 'pill_soul_strengthen', count: 1 }, msg: '你找到了一瓶炼魂丹！' },
            { progress: 100, reward: { type: 'skill', name: '魂术' }, msg: '你参透了上古「魂术」的门径——神魂为之一凝。（淬体+150）' }
        ],
        hidden: {
            condition: { realm: '元婴' },   // 第三十四波：旧账门禁物品 spec_soul_token 全仓不存在 → 隐藏内容永不可达；改境界门（元婴神魂方可开密室）
            content: '你以元婴神魂震开魂殿深处的密室！',
            reward: { type: 'item', id: 'pill_soul_rebirth', count: 1, msg: '密室里供着一瓶炼魂重生丹！' }
        }
    },
    '寒冰深渊': {
        id: 'han_bing',
        name: '寒冰深渊',
        desc: '万年不化的冰川深渊，极寒之地',
        icon: '❄️',
        exploreProgress: 0,
        maxProgress: 100,
        rewards: [
            { progress: 25, reward: { type: 'item', id: 'mat_ice_crystal', count: 3 }, msg: '你采集到了冰晶！' },
            { progress: 50, reward: { type: 'attr', name: '经脉', value: 3 }, msg: '寒冰淬脉，经脉+3！' },
            { progress: 75, reward: { type: 'item', id: 'pill_ice_core', count: 1 }, msg: '你发现了一枚冰心丹！' },
            { progress: 100, reward: { type: 'skill', name: '玄冰诀' }, msg: '你从深渊中参悟了「玄冰诀」的寒意——呼出的气都结了霜。（淬体+150）' }
        ]
    },
    '雷音峰': {
        id: 'lei_yin',
        name: '雷音峰',
        desc: '常年被雷云笼罩的山峰，雷灵气充沛',
        icon: '⚡',
        exploreProgress: 0,
        maxProgress: 100,
        rewards: [
            { progress: 20, reward: { type: 'item', id: 'mat_lightning_stone', count: 3 }, msg: '你收集到了雷石！' },
            { progress: 40, reward: { type: 'exp', value: 800 }, msg: '雷音灌体——筋骨被雷声淬过一遍！（淬体+800）' },
            { progress: 60, reward: { type: 'attr', name: '灵巧', value: 5 }, msg: '雷电淬体，灵巧+5！' },
            { progress: 80, reward: { type: 'item', id: 'pill_lightning_core', count: 1 }, msg: '你找到了一枚雷核丹！' },
            { progress: 100, reward: { type: 'skill', name: '雷法' }, msg: '你领悟了「雷法」的起手——指尖有电光跳动。（淬体+150）' }
        ]
    },
    '幻海绿洲': {
        id: 'huan_hai',
        name: '幻海绿洲',
        desc: '沙漠中的幻境绿洲，虚实难辨',
        icon: '🏝️',
        exploreProgress: 0,
        maxProgress: 100,
        rewards: [
            { progress: 30, reward: { type: 'item', id: 'mat_spirit_flower', count: 5 }, msg: '你采到了幻海灵花！' },
            { progress: 60, reward: { type: 'attr', name: '智力', value: 5 }, msg: '幻境历练，智力+5！' },
            { progress: 100, reward: { type: 'skill', name: '幻术' }, msg: '你悟透了幻海真谛，掌了「幻术」的入门诀——看什么都多留半分疑。（淬体+150）' }
        ]
    },
    '天池': {
        id: 'heavenly_pool',
        name: '天池',
        desc: '云端之上的一泓碧水，传说是仙人洗浴之处',
        icon: '🏞️',
        exploreProgress: 0,
        maxProgress: 100,
        rewards: [
            { progress: 30, reward: { type: 'item', id: 'mat_ice_crystal', count: 2 }, msg: '你在池底摸到了两枚冰晶！' },
            { progress: 60, reward: { type: 'attr', name: '意志', value: 3 }, msg: '寒潭浸骨，你在池边坐了一夜——意志+3！' },
            { progress: 100, reward: { type: 'item', id: 'pill_qi_gather', count: 2 }, msg: '池心的荷叶下藏着前人留下的两炉聚气丹！' }
        ]
    },
    '剑冢': {
        id: 'sword_grave',
        name: '剑冢',
        desc: '万剑埋骨之地，剑气冲霄，寻常人不敢近前',
        icon: '⚔️',
        exploreProgress: 0,
        maxProgress: 100,
        rewards: [
            { progress: 30, reward: { type: 'item', id: 'mat_spirit_steel', count: 2 }, msg: '你从断剑堆里拣出了两块灵钢！' },
            { progress: 60, reward: { type: 'exp', value: 400 }, msg: '冢中剑气淬体——皮开肉绽之后，筋骨更坚。（淬体+400）' },
            { progress: 100, reward: { type: 'skill', name: '冢中剑意' }, msg: '你在万剑悲鸣里参悟了一丝「冢中剑意」。（淬体+150）' }
        ]
    },
    '灵泉古井': {
        id: 'spirit_well',
        name: '灵泉古井',
        desc: '一口不知深浅的古井，井水清冽，灵气氤氲',
        icon: '🕳️',
        exploreProgress: 0,
        maxProgress: 100,
        rewards: [
            { progress: 30, reward: { type: 'item', id: 'pill_qi_gather', count: 3 }, msg: '井壁的壁龛里供着三炉聚气丹——前人留下的香火！' },
            { progress: 60, reward: { type: 'attr', name: '经脉', value: 3 }, msg: '你用井水冲洗经脉，灵泉入体——经脉+3！' },
            { progress: 100, reward: { type: 'exp', value: 300 }, msg: '你在井底坐了一日，泉眼咕嘟之声如道音。（淬体+300）' }
        ]
    },
    '魔渊裂隙': {
        id: 'demon_abyss',
        name: '魔渊裂隙',
        desc: '大地裂开的一道伤口，魔气从中渗出',
        icon: '🕳️',
        exploreProgress: 0,
        maxProgress: 100,
        rewards: [
            { progress: 30, reward: { type: 'item', id: 'mat_demon_beast_core', count: 2 }, msg: '裂隙边的兽尸里挖出了两枚兽核！' },
            { progress: 60, reward: { type: 'attr', name: '力量', value: 3 }, msg: '你顶着魔气搬开了封石——膀子上的力气见长（力量+3）！' },
            { progress: 100, reward: { type: 'item', id: 'mat_meteorite', count: 1 }, msg: '裂隙深处嵌着一块陨铁——不知是哪年从天上落下来的。' }
        ],
        hidden: {
            condition: { realm: '元婴' },
            content: '你以元婴之力压住魔气，探入了裂隙最深处！',
            reward: { type: 'item', id: 'mat_star_iron', count: 1, msg: '裂隙最深处嵌着一块星辰铁——归你了！' }
        }
    },
    '凤凰巢': {
        id: 'phoenix_nest',
        name: '凤凰巢',
        desc: '绝壁上的巨巢，焦痕犹在，传说曾有凤凰在此涅槃',
        icon: '🔥',
        exploreProgress: 0,
        maxProgress: 100,
        rewards: [
            { progress: 30, reward: { type: 'item', id: 'mat_star_iron', count: 2 }, msg: '巢底的灰烬里筛出了两块星辰铁！' },
            { progress: 60, reward: { type: 'attr', name: '灵巧', value: 3 }, msg: '你学着凤翼的姿态在绝壁上攀了一遭——灵巧+3！' },
            { progress: 100, reward: { type: 'skill', name: '凤鸣身法' }, msg: '你在凤鸣的余韵里悟出了一路身法。（淬体+150）' }
        ],
        hidden: {
            condition: { realm: '金丹' },
            content: '巢心的焦土下，你挖到了一滴未干的凤血！',
            reward: { type: 'item', id: 'mat_phoenix_blood', count: 1, msg: '一滴凤血在掌心滚圆发亮——得之我幸！' }
        }
    },
    '上古战场': {
        id: 'ancient_battlefield',
        name: '上古战场',
        desc: '一望无际的焦土，断戟残甲半埋在土里，夜里有金铁之声',
        icon: '🛡️',
        exploreProgress: 0,
        maxProgress: 100,
        rewards: [
            { progress: 30, reward: { type: 'item', id: 'mat_dark_iron', count: 3 }, msg: '你从断戟堆里挑出了三块还能用的玄铁！' },
            { progress: 60, reward: { type: 'exp', value: 500 }, msg: '你在战场上凭吊了一夜——杀气入骨，也是淬炼。（淬体+500）' },
            { progress: 100, reward: { type: 'skill', name: '百战枪意' }, msg: '万军厮杀的幻景里，你抓住了一缕「百战枪意」。（淬体+150）' }
        ],
        hidden: {
            condition: { hasItem: 'wpn_dark_iron_sword', count: 1 },
            content: '你腰间的玄铁古剑忽然震鸣——战场认出了它！剑主旧部的遗蜕就在戟堆之下。',
            reward: { type: 'item', id: 'mat_dragon_bone', count: 1, msg: '戟堆之下埋着一根龙骨——古剑的旧主不是凡人！' }
        }
    }
};

// ============ 玩家探索状态 ============
var playerLandmarkProgress = {};

// 加载探索进度
function loadLandmarkProgress() {
    try {
        var saved = localStorage.getItem('xianxia_landmarks');
        if (saved) {
            var data = JSON.parse(saved);
            playerLandmarkProgress = data;
            // 同步到LANDMARK_EXPLORE_DATA
            for (var key in playerLandmarkProgress) {
                if (LANDMARK_EXPLORE_DATA[key]) {
                    LANDMARK_EXPLORE_DATA[key].exploreProgress = playerLandmarkProgress[key].progress || 0;
                    LANDMARK_EXPLORE_DATA[key]._swordPulled = !!playerLandmarkProgress[key].swordPulled;
                    // 第三十四波：已领的奖励与已揭的隐藏随档回填——读档不再重领（旧账是白嫖漏洞）
                    LANDMARK_EXPLORE_DATA[key]._hiddenFound = !!playerLandmarkProgress[key].hiddenFound;
                    var claimed = playerLandmarkProgress[key].claimed || [];
                    (LANDMARK_EXPLORE_DATA[key].rewards || []).forEach(function (rw, i) { rw._claimed = claimed.indexOf(i) >= 0; });
                }
            }
        }
    } catch (e) {}
}

function saveLandmarkProgress() {
    var data = {};
    for (var key in LANDMARK_EXPLORE_DATA) {
        var lm = LANDMARK_EXPLORE_DATA[key];
        var claimed = [];
        (lm.rewards || []).forEach(function (rw, i) { if (rw._claimed) claimed.push(i); });
        data[key] = { progress: lm.exploreProgress, hiddenFound: lm._hiddenFound || false, swordPulled: lm._swordPulled || false, claimed: claimed };
    }
    // 第一百四十四批：原式是 `try { … } catch (e) {}`。接入 saveToStorage 后那层 catch 成为死支（单源自己吞异常、返回布尔、从不抛）——留着它等于假装还有一层守卫。已拆。
    window.saveToStorage('xianxia_landmarks', JSON.stringify(data));
}

// ============ 探索地标 ============
// 第三十四波：认中文名、认英文键、认旧别名——野外图传什么都能对上名录（旧账传英文键永远「未知的地标」）
var LANDMARK_ALIASES = { '魂殿遗迹': '魂殿' };
function _resolveLandmark(key) {
    if (!key) return null;
    if (LANDMARK_EXPLORE_DATA[key]) return { lm: LANDMARK_EXPLORE_DATA[key], name: key };
    if (LANDMARK_ALIASES[key] && LANDMARK_EXPLORE_DATA[LANDMARK_ALIASES[key]]) return { lm: LANDMARK_EXPLORE_DATA[LANDMARK_ALIASES[key]], name: LANDMARK_ALIASES[key] };
    try {
        if (window.LANDMARKS && window.LANDMARKS[key] && window.LANDMARKS[key].name) {
            var cn = window.LANDMARKS[key].name;
            if (LANDMARK_EXPLORE_DATA[cn]) return { lm: LANDMARK_EXPLORE_DATA[cn], name: cn };
            if (LANDMARK_ALIASES[cn] && LANDMARK_EXPLORE_DATA[LANDMARK_ALIASES[cn]]) return { lm: LANDMARK_EXPLORE_DATA[LANDMARK_ALIASES[cn]], name: LANDMARK_ALIASES[cn] };
        }
    } catch (e) {}
    return null;
}
// v25.1·试-19：本函数现在报账——成行返回 true，被三道闸（未知地标/已探满/精力不济）拦下返回 false。
//   调用侧（野外图 exploreWildRuin）凭返回值决定那笔 90 分钟的路费收不收：旧写法先扣 90 再进闸，
//   「已完全探索」再点一次也白烧一个半时辰。
function exploreLandmark(landmarkName) {
    var resolved = _resolveLandmark(landmarkName);
    if (!resolved) { showMessage('未知的地标', 'warning'); return false; }   // v25.1·试-19
    var landmark = resolved.lm;
    landmarkName = resolved.name;

    if (landmark.exploreProgress >= landmark.maxProgress) {
        showMessage('这个地标已经被你完全探索了。', 'info');
        return false;   // v25.1·试-19：探满了就是没成行，调用侧不许收时辰
    }
    // v23.0 探索是力气活：精力不足寸步难行（旧版零成本连点刷进度）
    var cdE = window.currentCharData;
    if (cdE && (cdE.energy || 0) < 15) {
        showMessage('你已精疲力竭，攀岩涉水皆要力气——先歇息或服些丹药再来。', 'warning');
        return false;   // v25.1·试-19
    }
    if (cdE) {
        cdE.energy = Math.max(0, (cdE.energy || 0) - 15);
        if (typeof window.updateCharacterStatus === 'function') { try { window.updateCharacterStatus(); } catch (e) {} }
    }

    // 消耗时间
    if (window.timeSystem) window.timeSystem.advanceTime(30, '探索地标');

    // 增加探索度
    var gain = 10 + Math.floor(Math.random() * 15);
    landmark.exploreProgress = Math.min(landmark.maxProgress, landmark.exploreProgress + gain);

    // 触发探索事件
    var eventText = '';
    var firedEvent = null;
    if (landmark.events && landmark.events.length > 0) {
        var validEvents = landmark.events.filter(function(e) { return Math.random() < e.prob; });
        if (validEvents.length > 0) {
            firedEvent = validEvents[Math.floor(Math.random() * validEvents.length)];
            eventText = firedEvent.text;
        }
    }
    if (!eventText) {
        var texts = ['你仔细搜索了' + landmarkName + '，发现了新的线索。', '你小心翼翼地探索着' + landmarkName + '。', '你在' + landmarkName + '中发现了有趣的东西。'];
        eventText = texts[Math.floor(Math.random() * texts.length)];
    }
    showMessage('🔍 ' + eventText, 'info');

    // v23.0 死文本兑现：「古剑似乎可以拔出来」现在真能拔——成败凭力，一生一地标只有一次
    if (firedEvent && firedEvent.action === 'pull_sword' && !landmark._swordPulled) {
        _offerPullSword(landmarkName);
    }

    // 检查奖励
    checkLandmarkRewards(landmark);

    // 检查隐藏内容
    checkLandmarkHidden(landmark);

    // 保存
    saveLandmarkProgress();

    // 显示探索结果
    showLandmarkProgressUI(landmark);
    return true;   // v25.1·试-19：真探索了一趟（30 分钟已在 :285 扣过），调用侧据此再收 90 分钟脚程
}

// ============ v23.0 岩中古剑：死文本兑现成真交互 ============
function _offerPullSword(landmarkName) {
    var modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
    modal.innerHTML = '<div class="bg-gray-800 border-2 border-yellow-600/50 rounded-xl p-6 max-w-md w-full mx-4 max-h-[85vh] overflow-y-auto text-center">' +
        '<h3 class="text-lg font-bold text-yellow-400 mb-2">⚔️ 岩中古剑</h3>' +
        '<p class="text-sm text-gray-300 mb-4">剑身没入岩中三寸，隐有剑鸣。你握上剑柄——拔，还是不拔？（力气越大，越拔得动）</p>' +
        '<button onclick="this.closest(\'.fixed\').remove(); window._landmarkPullSword && window._landmarkPullSword(\'' + landmarkName + '\')" class="w-full mb-2 bg-yellow-700 hover:bg-yellow-600 text-white py-2 rounded">奋力拔剑</button>' +
        '<button onclick="this.closest(\'.fixed\').remove(); if(window.showMessage)window.showMessage(\'你松开了剑柄。剑鸣渐歇——它还会在这里等你。\',\'info\')" class="w-full bg-gray-600 hover:bg-gray-500 text-white py-2 rounded">暂且记下，改日再来</button></div>';
    document.body.appendChild(modal);
}
window._landmarkPullSword = function(landmarkName) {
    var landmark = LANDMARK_EXPLORE_DATA[landmarkName];
    if (!landmark || landmark._swordPulled) {
        if (typeof window.showMessage === 'function') window.showMessage('岩中已无剑可拔。', 'info');
        return;
    }
    var cd = window.currentCharData;
    var str = (cd && cd.attrs && cd.attrs.strength) || (cd && cd.mainAttributes && cd.mainAttributes['力量']) || 10;
    var chance = Math.min(0.85, Math.max(0.1, 0.3 + (Number(str) - 10) * 0.03));
    if (Math.random() < chance) {
        // DES-86：真拔出来了、且剑真落进行囊，才收这道闸门——旧写法在掷骰前就 saveLandmarkProgress，满包时这柄唯一的剑当场永久消失
        var _剑收 = (typeof window.addItemToInventory === 'function') ? (Number(window.addItemToInventory('wpn_dark_iron_sword', 1)) || 0) : 1;
        if (!_剑收) {
            if (typeof window.showMessage === 'function') window.showMessage('⚔️ 古剑应手而出，却又落回岩中——它还在等你。' + ((typeof window.addItemFailText === 'function' && window.addItemFailText('古剑')) || '这一件先还留在原处。'), 'warning');
            return;
        }
        landmark._swordPulled = true; // 剑已认主入囊，此后再来岩中已无剑
        saveLandmarkProgress();
        if (typeof window.showMessage === 'function') window.showMessage('⚔️ 剑鸣如龙吟——古剑应手而出！你得一柄「玄铁古剑」。', 'success');
    } else {
        landmark._swordPulled = true; // 无论成败，此剑认过一回人——失手也不再来
        saveLandmarkProgress();
        if (cd) cd.health = Math.max(1, (cd.health ?? 100) - 8);
        if (typeof window.showMessage === 'function') window.showMessage('古剑纹丝不动，反震之力撕开了你的虎口！（健康-8）——它不认你。', 'error');
        if (typeof window.updateCharacterStatus === 'function') { try { window.updateCharacterStatus(); } catch (e) {} }
    }
};

// ============ 检查奖励 ============
// 第三十四波 · 修存量错位：旧账把整个奖励条目（含 progress/reward/msg）传进 applyLandmarkReward，
//   而它读的是 reward.type——条目没有 type，进度奖励永远发不出（只有隐藏奖励走 .hidden.reward 扁平结构才侥幸生效）。
//   现在传条目里的真奖励规格（entry.reward），话术单独递（entry.msg）。
function checkLandmarkRewards(landmark) {
    for (var i = 0; i < landmark.rewards.length; i++) {
        var entry = landmark.rewards[i];
        if (landmark.exploreProgress >= entry.progress && !entry._claimed) {
            // DES-86（第一百三十批）：这道旗挪到落袋之后——旧写法先立旗再发货、又把返回值丢了，这一份奖励从此不再补发
            if (applyLandmarkReward(entry.reward, entry.msg)) entry._claimed = true;
        }
    }
}

// ============ 应用奖励 ============
// 第三十四波 · 奖励真账：属性落战斗真源（addMainAttribute 中英双写）、功法落淬体、名号落名望——
//   旧账把属性写进没人读的顶层字段、把功法/名号塞进零读取的死数组（纯假账），如今每一笔都进真账。
// 返回 false ＝ 这一份货一件没落袋，调用方那道一次性闸门（_claimed／_hiddenFound）不许烧。
function applyLandmarkReward(reward, msg) {
    if (!reward) return true;
    var cd = window.currentCharData;
    var 少发 = '';
    switch (reward.type) {
        case 'item': {
            var 要 = reward.count || 1;
            // DES-72＋DES-86（第一百三十批）：旧写法丢了返回值，旗先烧、货没落袋就永久蒸发
            var 收 = typeof window.giveWithReceipt === 'function'
                ? window.giveWithReceipt(reward.id, 要, { quiet: true })
                : (typeof window.addItemToInventory === 'function'
                    ? { got: Number(window.addItemToInventory(reward.id, 要)) || 0, count: 要, name: (window.itemById && window.itemById[reward.id] && window.itemById[reward.id].name) || reward.id }
                    : { got: 要, count: 要, name: reward.id });
            if (收.got <= 0) {
                if (typeof window.showMessage === 'function') {
                    // DES-90（第一百三十九批）：问不到账时不许由站点断言满包——旧句在问账之前就把因写死成「你行囊装不下」。
                    // 「先留在原地没有取走」是代码真做的事，留着；断言与黑话串一起撤。
                    window.showMessage('🎁 这一份奖励是 ' + 收.name + '×' + 收.count + '，先留在原地没有取走：'
                        + ((typeof window.addItemFailText === 'function' && window.addItemFailText(收.name)) || '这一件先还留在原处。'), 'warning');
                }
                return false;
            }
            if (收.got < 收.count) 少发 = '——行囊只塞得下 ' + 收.got + '/' + 收.count + ' 件，另 ' + (收.count - 收.got) + ' 件留在了原地。';
            break;
        }
        case 'exp':
            if (cd) cd.tempering = (cd.tempering || 0) + (reward.value || 0);
            break;
        case 'attr':
            // 真战斗源：addMainAttribute 中英双写、读档同步；缺它则退回 attrs 直写（仍进战斗读的那本）
            if (cd) {
                if (typeof window.addMainAttribute === 'function') {
                    try { window.addMainAttribute(reward.name, reward.value || 0, cd); } catch (eA) {}
                } else {
                    var attrMap = { '力量': 'strength', '灵巧': 'dexterity', '体质': 'constitution', '智力': 'intelligence', '神识': 'intelligence', '意志': 'willpower', '经脉': 'meridian' };
                    var en = attrMap[reward.name] || reward.name;
                    cd.attrs = cd.attrs || {};
                    cd.attrs[en] = (cd.attrs[en] || 10) + (reward.value || 0);
                }
                if (typeof window.syncCharAttrsFromMain === 'function') { try { window.syncCharAttrsFromMain(cd); } catch (eS) {} }
                if (typeof window.updateCharacterStatus === 'function') { try { window.updateCharacterStatus(); } catch (eU) {} }
            }
            break;
        case 'skill':
            // 功法感悟落真账：淬体（修为积累的真货币，突破时消费）——不再塞死数组
            if (cd) cd.tempering = (cd.tempering || 0) + 150;
            break;
        case 'title':
            // 名号落真账：名望（江湖脸面的真字段）——不再塞死数组
            if (cd) cd.fame = Math.min(99999, (cd.fame || 0) + 15);
            break;
    }
    showMessage('🎉 ' + (msg || reward.msg || '探索有所收获！') + 少发, 'success');
    return true;
}

// ============ 检查隐藏内容 ============
function checkLandmarkHidden(landmark) {
    if (!landmark.hidden || landmark._hiddenFound) return;
    var cond = landmark.hidden.condition;

    if (cond.hasItem) {
        if (hasInventoryItem(cond.hasItem, cond.count || 1)) {
            showMessage('🔓 ' + landmark.hidden.content, 'success');
            // DES-86（第一百三十批）：先验货落袋再立这道旗——旧写法一揭就永不再来，满包时这份隐藏奖励蒸发
            if (applyLandmarkReward(landmark.hidden.reward)) {
                landmark._hiddenFound = true;
                saveLandmarkProgress();
            }
        }
    }
    if (cond.realm) {
        var charData = window.currentCharData;
        // DES-92（第一百三十二批）：门槛是「至少这个境界」，不是「恰好这个境界」——旧写法用 === 判，
        //   于是金仙探不开写着「筑基」的剑冢（境界比门槛高反而开不了）。尺只此一把：window.realmAtLeast。
        // ⚠️ 尺未就绪 ⇒ false（判不了就是不够格）；旧回落 `!!charData` 是大开的一条敞口（凡人照揭）。
        var 够 = (typeof window.realmAtLeast === 'function') && window.realmAtLeast(charData && charData.realm, cond.realm);
        if (够) {
            showMessage('🔓 ' + landmark.hidden.content, 'success');
            if (applyLandmarkReward(landmark.hidden.reward)) {
                landmark._hiddenFound = true;
                saveLandmarkProgress();
            }
        }
    }
}

function hasInventoryItem(itemId, count) {
    if (!window.inventory || !window.inventory.slots) return false;
    var total = 0;
    for (var i = 0; i < window.inventory.slots.length; i++) {
        var s = window.inventory.slots[i];
        if (s && s.templateId === itemId) total += s.count || 1;
    }
    return total >= (count || 1);
}

// ============ 显示探索进度UI ============
function showLandmarkProgressUI(landmark) {
    var modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
    modal.onclick = function(e) { if (e.target === modal) modal.remove(); };

    var rewardsHtml = '';
    // 第九十六波·NEW-15：没到手的机缘不再全文剧透——只亮档位与类别，到了探索度才见真章；
    // 已领的照旧全文展示（那是你自己的履历）
    var TYPE_HINT = { item: '似有俗世珍宝', attr: '似有淬体机缘', exp: '似有淬体机缘', skill: '似有功法感悟', title: '似有一段名望' };
    for (var i = 0; i < landmark.rewards.length; i++) {
        var r = landmark.rewards[i];
        var progressNeeded = r.progress + '%';
        if (r._claimed) {
            rewardsHtml += '<div class="flex items-center gap-2 text-xs text-green-400"><span>✅</span><span>' + progressNeeded + '</span><span>' + r.msg + '</span></div>';
        } else {
            rewardsHtml += '<div class="flex items-center gap-2 text-xs text-gray-500"><span>🔒</span><span>' + progressNeeded + '</span><span>' + ((r.reward && TYPE_HINT[r.reward.type]) || '此处另有机缘') + '——探到方才揭晓</span></div>';
        }
    }

    var hiddenHtml = '';
    if (landmark.hidden) {
        hiddenHtml = '<div class="mt-2 text-xs ' + (landmark._hiddenFound ? 'text-yellow-400' : 'text-gray-500') + '">🔒 隐藏内容：' + (landmark._hiddenFound ? '✅已发现' : '探索度达到后可解锁') + '</div>';
    }

    // v24 第六十批 · UI-25：卡片高度帽与 js/global-utils.js showModal 那张同一支笔（max-h-[85vh] + overflow-y-auto）。
    // 不写帽，特大档「描述＋奖励名册」会顶穿视口，连这张卡自己的关闭叉都被推到屏外。
    modal.innerHTML = '<div class="bg-gray-800 border-2 border-yellow-600/50 rounded-xl p-6 max-w-md w-full mx-4 max-h-[85vh] overflow-y-auto">' +
        '<div class="flex items-center gap-3 mb-4"><span class="text-3xl">' + landmark.icon + '</span><h3 class="text-xl font-bold text-yellow-500">' + landmark.name + '</h3><button onclick="this.closest(\'.fixed\').remove()" class="text-gray-400 hover:text-white text-2xl ml-auto">&times;</button></div>' +
        '<p class="text-sm text-gray-400 mb-4">' + landmark.desc + '</p>' +
        '<div class="mb-4"><div class="flex justify-between text-xs text-gray-400 mb-1"><span>探索度</span><span>' + landmark.exploreProgress + '%</span></div><div class="w-full bg-gray-700 rounded h-2"><div class="h-2 rounded bg-gradient-to-r from-yellow-500 to-red-500 transition-all" style="width:' + landmark.exploreProgress + '%"></div></div></div>' +
        '<div class="bg-gray-900/50 rounded-lg p-3"><h4 class="text-sm font-bold text-gray-300 mb-2">🎁 探索奖励</h4>' + rewardsHtml + hiddenHtml + '</div>' +
        '<div class="flex justify-center mt-4"><button onclick="this.closest(\'.fixed\').remove()" class="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded-lg">关闭</button></div>' +
    '</div>';
    document.body.appendChild(modal);
}

// ============ 图鉴的「知道多少」三态（v24 第五十九批 · UI-06）============
// 旧版十二条一律真名＋空进度条：既把没去过的地方全剧透了一遍，又十二条印不出一条信息。
// 现按成就页/兽径手记那条老规矩落笔——名录上只写脚走到过的与手里有进度的一本账。
// 反查：图鉴数据按中文名录键（'魂殿'），野外图 POI 的 id 是 map-markers 的英文键（soul_temple/'魂殿遗迹'）。
function _landmarkMarkerKey(cnName) {
    try {
        var all = window.LANDMARKS || {};
        for (var k in all) {
            var nm = all[k] && all[k].name;
            if (nm && (nm === cnName || LANDMARK_ALIASES[nm] === cnName)) return k;
        }
    } catch (e) {}
    return null;
}

function _landmarkHears(cnName) {
    var k = _landmarkMarkerKey(cnName);
    return (k && window.LANDMARKS[k] && window.LANDMARKS[k].region) || null;
}

// 「亲至」只有一本账：游历见闻里的 lm_<英文键>（野外图脚踩上地标时落的印）
function _landmarkTouched(cnName) {
    var k = _landmarkMarkerKey(cnName);
    if (!k) return false;
    try {
        if (window.TravelJournal && typeof window.TravelJournal.hasMark === 'function') {
            return !!window.TravelJournal.hasMark('lm_' + k);
        }
    } catch (e) {}
    return false;
}

// ============ 打开地标图鉴 ============
function showLandmarkBestiary() {
    var total = Object.keys(LANDMARK_EXPLORE_DATA).length;
    var discovered = 0;
    for (var key in LANDMARK_EXPLORE_DATA) {
        if (LANDMARK_EXPLORE_DATA[key].exploreProgress > 0) discovered++;
    }
    var progress = total > 0 ? Math.round(discovered / total * 100) : 0;

    var modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
    modal.onclick = function(e) { if (e.target === modal) modal.remove(); };

    var listHtml = '';
    for (var key in LANDMARK_EXPLORE_DATA) {
        var lm = LANDMARK_EXPLORE_DATA[key];
        var pct = lm.exploreProgress;
        // v23.0 图鉴只看不探：旧版在图鉴里点任意地标即可远程「探索」，人不在场也能刷进度——
        // 探索地标必须亲至（野外地图上的地标 POI 才是入口），图鉴仅供回看进度。
        if (pct > 0) {
            listHtml += '<div class="flex items-center gap-2 p-2 bg-gray-700/30 rounded">' +
                '<span class="text-lg">' + lm.icon + '</span>' +
                '<span class="text-sm text-white">' + lm.name + '</span>' +
                '<div class="flex-1 mx-2 bg-gray-700 rounded h-1.5"><div class="h-1.5 rounded bg-yellow-500" style="width:' + pct + '%"></div></div>' +
                '<span class="text-xs text-gray-400">' + pct + '%</span>' +
            '</div>';
        } else if (_landmarkTouched(key)) {
            listHtml += '<div class="flex items-center gap-2 p-2 bg-gray-700/30 rounded">' +
                '<span class="text-lg">' + lm.icon + '</span>' +
                '<span class="text-sm text-white">' + lm.name + '</span>' +
                '<div class="flex-1 mx-2 text-xs text-yellow-600">已亲至 · 尚未探索</div>' +
            '</div>';
        } else {
            var hearsRegion = _landmarkHears(key);
            listHtml += '<div class="flex items-center gap-2 p-2 bg-gray-700/30 rounded">' +
                '<span class="text-lg">❓</span>' +
                '<span class="text-sm text-gray-500">？ ？ ？</span>' +
                '<div class="flex-1 mx-2 text-xs text-gray-500">' + (hearsRegion ? '传闻在' + hearsRegion + '一带' : '出处无从可考') + '</div>' +
            '</div>';
        }
    }

    // v24 第五十九批量出的 UI-25：特大档十二条一行 55px，这张卡 960px 高而视口只有 800 —— 卡顶 −80、关闭叉 −49，
    // 玩家点不到 × 也看不见标题。帽与滚法仍取 js/global-utils.js showModal 那张的同一支笔。
    modal.innerHTML = '<div class="bg-gray-800 border-2 border-yellow-600/50 rounded-xl p-6 max-w-lg w-full mx-4 max-h-[85vh] overflow-y-auto">' +
        '<div class="flex items-center justify-between mb-4"><h3 class="text-xl font-bold text-yellow-500">🗺️ 地标图鉴</h3><button onclick="this.closest(\'.fixed\').remove()" class="text-gray-400 hover:text-white text-2xl">&times;</button></div>' +
        '<div class="mb-4"><div class="flex justify-between text-sm text-gray-400 mb-1"><span>探索进度</span><span>' + discovered + '/' + total + ' (' + progress + '%)</span></div><div class="w-full bg-gray-700 rounded h-2"><div class="h-2 rounded bg-gradient-to-r from-green-500 to-yellow-500" style="width:' + progress + '%"></div></div></div>' +
        '<div class="space-y-1">' + listHtml + '</div>' +
        '<p class="text-xs text-gray-500 mt-3 text-center">地标须亲至方能探索——未走到的那一处在名录上只落方位，真名要脚走到了才认得。</p></div>';
    document.body.appendChild(modal);
}

// ============ 初始化 ============
function initLandmarkExplore() {
    loadLandmarkProgress();
    if (typeof window !== 'undefined') {
        window.LANDMARK_EXPLORE_DATA = LANDMARK_EXPLORE_DATA;
        window.exploreLandmark = exploreLandmark;
        window.showLandmarkBestiary = showLandmarkBestiary;
        window.initLandmarkExplore = initLandmarkExplore;
    }
}

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLandmarkExplore);
    } else {
        initLandmarkExplore();
    }
}