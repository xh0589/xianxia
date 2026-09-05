// ==================== sect-join-flow.js - 门派五阶段加入流程 ====================
// 门派加入流程：发现→门槛条件→入门试炼→分配身份→试用期
// 正派无敲门砖，凭门槛条件（灵根/资质/性别）即可参加入门试炼
// v9.9：杂役弟子无境界要求——凡人可入，joinSect 仍固定 rank=7 杂役
// v10.1：添加入门试炼事件系统，增加沉浸感

// ============ 门派加入状态 ============
var sectJoinState = {
    currentPhase: 0,           // 当前阶段（0-4）
    discoveredSects: [],       // 已发现的门派列表
    sectInfo: {},              // 对各门派的详细了解
    trialScore: 0,             // 试炼得分
    assignedIdentity: null,    // 分配的身份
    master: null,              // 师父
    oath: null,                // 誓约类型
    trialResult: null          // 试炼结果（TRIAL_RESULT 枚举值）
};

// ============ 入门考核结果枚举 ============
// 统一各门派考核的判断逻辑，未知值按失败处理
var TRIAL_RESULT = {
    PASS: 'pass',      // 通过考核
    FAIL: 'fail',      // 未通过考核
    ABORT: 'abort'     // 中途退出/放弃
};

// v18.7：入门结果直接使用 sects-system.js 的真实职位ID，禁止再用 0/1 表示“杂役/弟子”。
// 真实映射：4=内门、5=外门、6=记名、7=杂役；0/1 分别是掌门/副掌门。
var ENTRY_RANK = Object.freeze({
    INNER: 4,
    OUTER: 5,
    REGISTERED: 6,
    CHORE: 7
});

function makeEntryEval(rankId, reason) {
    var result = rankId === ENTRY_RANK.INNER ? '内门弟子'
        : rankId === ENTRY_RANK.OUTER ? '外门弟子'
        : rankId === ENTRY_RANK.REGISTERED ? '记名弟子' : '杂役';
    return { result: result, reason: reason || '通过入门考核', rank: rankId };
}

function markSectLeaderMetFromTrial(sectId) {
    var npc = window.npcManager && window.npcManager.getNPC ? window.npcManager.getNPC('sect_leader_' + sectId) : null;
    if (!npc || !npc.memory) return false;
    if (typeof npc.recordPlayerAction === 'function') {
        npc.recordPlayerAction('greet', 'neutral');
    } else {
        npc.memory.firstMet = true;
        npc.memory.meetCount = Math.max(1, npc.memory.meetCount || 0);
    }
    return true;
}

// 辅助函数：设置考核结果并返回布尔值（兼容旧代码分支）
function setTrialResult(result) {
    sectJoinState.trialResult = result;
    return result === TRIAL_RESULT.PASS;
}

// ============ 初始化 ============
function initSectJoinFlow() {
    var saved = localStorage.getItem('xianxia_sect_join_state');
    if (saved) {
        try { sectJoinState = JSON.parse(saved); } catch(e) {}
    }
    console.log('[门派加入] 引擎初始化完成');
}

// ============ 保存状态 ============
function saveSectJoinState() {
    try { localStorage.setItem('xianxia_sect_join_state', JSON.stringify(sectJoinState)); } catch(e) {}
}

// ============ 入口：申请入门（v10.0 加入守卫对话+试炼流程） ============
function startSectJoinFlow(sectId) {
    var ds = window.discipleState || {};
    if (ds.isInSect && ds.sectId === sectId) {
        if (typeof window.showMessage === 'function') window.showMessage('你已是该门派弟子', 'warning');
        return;
    }
    if (ds.isInSect) {
        if (typeof window.showConfirm === 'function') {
            window.showConfirm('叛离门派', '你当前是 ' + ds.sectId + ' 的弟子，确定要叛离并加入 ' + sectId + ' 吗？').then(function(ok) {
                if (ok) {
                    if (typeof window.leaveSect === 'function') window.leaveSect(true);
                    _startJoinDialog(sectId);
                }
            });
        } else {
            if (!confirm('你当前是 ' + ds.sectId + ' 的弟子，确定要叛离并加入 ' + sectId + ' 吗？')) return;
            if (typeof window.leaveSect === 'function') window.leaveSect(true);
            _startJoinDialog(sectId);
        }
        return;
    }
    _startJoinDialog(sectId);
}

// 加入流程对话
function _startJoinDialog(sectId) {
    var sect = window.sectsData?.[sectId];
    if (!sect) return;
    var player = window.currentCharData || {};
    
    // 百花谷：守卫在修剪花枝，不知如何应对男的入门请求
    if (sectId === '百花谷') {
        showBaihuaGuardDialog();
        return;
    }
    
    // 大隐阁/天书阁：没有门卫，直接见阁主
    if (sectId === '大隐阁') {
        showDayingeDialog();
        return;
    }
    if (sectId === '天书阁') {
        showTianshugeDialog();
        return;
    }
    
    // 有守卫考核的门派：完整考核 + v18.7 轻量特色问。
    // 邪派不再靠“type===邪派”裸兜底，避免无配置门派打开空白考核框。
    if (hasSectGuardTrial(sectId)) {
        showSectGuardTrial(sectId);
        return;
    }
    
    var guardDialogue = '';
    var guardLabel = '🚶 山门守卫：';
    var extraLine = '';
    
    // 修罗宫特殊守卫对话
    var isFemale = player.gender === 'female';
    if (sectId === '修罗宫') {
        var title = isFemale ? '姑娘' : '公子';
        guardDialogue = '一位清冷的守卫拦住你：「' + title + '请留步」';
        extraLine = '你向守卫说明来意，想要加入修罗宫。';
        if (isFemale) {
            extraLine += '<br>守卫颈项微垂：「入门需经过宫主考核，你可愿意？」';
        } else {
            // 男玩家：明拒 + 暗示有苛刻破例路径（应宫主情伤之问，非恶名）——避免玩家以为死路
            extraLine += '<br>守卫愕然瞠目：「这……公子此言不妥，还是请回吧」';
            extraLine += '<br><span class="text-amber-400 text-xs">守卫又压低声：「不过……宫主曾立过一条不成文的规矩——凡男子答得出宫主亲出的『情伤之问』者，宫主或肯破例收留。门槛比女子苛刻得多，但确有此路。」</span>';
            extraLine += '<br><span class="text-pink-400 text-xs">（这条路靠的是答得出她的问，不是别的——公子可愿一试？）</span>';
        }
    } else if (sect.type === '正道') {
        guardDialogue = '山门守卫打量了你一番：「这位道友，来我' + sectId + '何事？」';
    } else if (sect.type === '邪派') {
        guardDialogue = '一个阴冷的守卫拦住你：「知道这是什么地方吗？想清楚了再说话。」';
    } else {
        guardDialogue = '守卫拱手道：「阁下到此，有何贵干？」';
    }
    
    var html = '<div class="space-y-4">';
    html += '<div class="bg-gray-800/60 p-3 rounded border-l-4 border-yellow-500">';
    html += '<p class="text-xs text-gray-400 mb-1">' + guardLabel + '</p>';
    html += '<p class="text-sm text-gray-200 italic">' + guardDialogue + '</p>';
    html += '</div>';
    if (extraLine) {
        html += '<p class="text-sm text-gray-300">' + extraLine + '</p>';
    } else {
        html += '<p class="text-sm text-gray-300">你向守卫说明来意，想要加入' + sectId + '。</p>';
        html += '<p class="text-sm text-gray-400">守卫点头道：「入门需经过考核，你可愿意？」</p>';
    }
    // 修罗宫男性：可应宫主情伤之问破例（非恶名，靠答得出考题），否则离开（但有提示）
    if (sectId === '修罗宫' && !isFemale) {
        html += '<div class="flex gap-2 justify-end mt-4">';
        html += '<button onclick="xiuluoMaleTrialAttempt()" class="bg-pink-700 hover:bg-pink-600 text-white px-4 py-2 rounded text-sm font-bold">应宫主情伤之问（求见）</button>';
        html += '<button onclick="document.getElementById(\'xianxia-modal-overlay\').remove()" class="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">离开</button>';
        html += '</div>';
    } else {
        html += '<div class="flex gap-2 justify-end mt-4">';
        html += '<button onclick="showJoinRequirements(\'' + sectId + '\')" class="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm font-bold">愿意接受考核</button>';
        html += '<button onclick="document.getElementById(\'xianxia-modal-overlay\').remove()" class="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">我再考虑一下</button>';
        html += '</div>';
    }
    html += '</div>';
    
    if (typeof window.showModal === 'function') {
        window.showModal('📝 申请入门 · ' + sectId, html);
    } else {
        window.showMessage('守卫：' + guardDialogue, 'info');
        var req = checkSectRequirements(sectId);
        if (req.pass) {
            if (typeof window.joinSect === 'function') window.joinSect(sectId);
        } else {
            window.showMessage('❌ ' + req.msg, 'error');
        }
    }
}

// 显示入门评估结果 + 守卫对话（含修罗宫特殊对话）
function showJoinRequirements(sectId) {
    var player = window.currentCharData || {};
    var sect = window.sectsData?.[sectId];
    if (!sect) return;
    
    // 使用完整评估系统
    var evalResult = evaluateSectEntry(sectId, player);
    
    if (evalResult.result === '拒绝') {
        if (typeof window.showMessage === 'function') window.showMessage('❌ ' + evalResult.reason, 'error');
        return;
    }
    
    var fameLevel = getFameLevel(player);
    var alignment = assessMomentaryAlignment(player);
    var alignmentName = alignment === 'good' ? '正道倾向' : (alignment === 'evil' ? '邪道倾向' : '中立');
    
    var html = '<div class="space-y-4">';
    html += '<div class="grid grid-cols-2 gap-2 text-xs mb-2">';
    html += '<div class="bg-gray-800/40 p-2 rounded"><span class="text-gray-400">名气：</span><span class="text-purple-400">' + fameLevel.name + '</span></div>';
    html += '<div class="bg-gray-800/40 p-2 rounded"><span class="text-gray-400">心性：</span><span class="text-yellow-400">' + alignmentName + '</span></div>';
    html += '</div>';
    
    // 修罗宫特殊：修罗女出场 + 问答
    if (sectId === '修罗宫') {
        markSectLeaderMetFromTrial('修罗宫');
        var isConcubine = evalResult.isConcubine;
        html += '<div class="bg-gray-800/60 p-3 rounded border-l-4 border-pink-500">';
        html += '<p class="text-xs text-gray-400 mb-1">🚶 修罗女：</p>';
        html += '<p class="text-sm text-gray-200 italic">一名身着黑红纱衣的女子走到你面前，凝眸细审。</p>';
        html += '<p class="text-sm text-pink-300 mt-2 italic">「你……为何而来？」</p>';
        html += '</div>';
        
        // 保存评估结果供后续使用
        window._xiuluoEvalResult = evalResult;
        
        html += '<div class="mt-3 space-y-2">';
        html += '<button onclick="xiuluoAnswer(\'shelter\')" class="w-full bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded text-sm">「求宫主收留」</button>';
        html += '<button onclick="xiuluoAnswer(\'power\')" class="w-full bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded text-sm">「想变强」</button>';
        html += '<button onclick="xiuluoAnswer(\'despair\')" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">「走投无路」</button>';
        html += '<button onclick="xiuluoAnswer(\'curiosity\')" class="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm">「不知道」</button>';
        html += '</div>';
    } else {
        // 通用守卫对话
        var guardDialogue = '';
        var resultIcon = '';
        if (evalResult.result === '入门弟子') {
            guardDialogue = '守卫拱手道：「' + evalResult.reason + '」';
            resultIcon = '🎉';
        } else {
            guardDialogue = '守卫点头道：「' + evalResult.reason + '」';
            resultIcon = '📋';
        }
        html += '<div class="bg-gray-800/60 p-3 rounded border-l-4 border-green-500">';
        html += '<p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p>';
        html += '<p class="text-sm text-gray-200 italic">' + guardDialogue + '</p>';
        html += '</div>';
        html += '<p class="text-sm text-gray-300">' + resultIcon + ' 你被登记为' + evalResult.result + '，开始了在' + sectId + '的修行之路。</p>';
    }
    
    // 修罗宫使用新问答系统，不显示旧"正式入门"按钮
    if (sectId !== '修罗宫') {
        html += '<div class="flex gap-2 justify-end mt-4">';
        html += '<button onclick="tryJoinSect(\'' + sectId + '\')" class="bg-yellow-600 hover:bg-yellow-500 text-gray-900 px-4 py-2 rounded text-sm font-bold">正式入门</button>';
        html += '<button onclick="document.getElementById(\'xianxia-modal-overlay\').remove()" class="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">再考虑一下</button>';
        html += '</div>';
    }
    html += '</div>';
    
    if (typeof window.showModal === 'function') {
        window.showModal('📝 入门评估 · ' + sectId, html);
    } else {
        tryJoinSect(sectId);
    }
}

// 修罗宫问答积分
var xiuluoScore = 0;

// 第一问：为何而来
function xiuluoAnswer(answer) {
    var evalResult = window._xiuluoEvalResult;
    var responses = {
        'shelter': '修罗女注视着你，眸色微动：「求收留……倒是直接。」',
        'power': '修罗女眉梢微挑：「想变强？来修罗宫的人，都是这个理由。」',
        'despair': '修罗女静默一息：「走投无路……修罗宫从不缺这样的人。」',
        'curiosity': '修罗女唇角微扬：「不知道？连自己为何而来都不清楚，倒是有些意思。」'
    };
    var scores = { 'shelter': 10, 'power': 5, 'despair': 15, 'curiosity': 0 };
    xiuluoScore += scores[answer] || 0;
    
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    
    // 直接进入第二问
    var html = '<div class="space-y-4">';
    html += '<div class="bg-gray-800/60 p-3 rounded border-l-4 border-pink-500">';
    html += '<p class="text-xs text-gray-400 mb-1">🚶 修罗女：</p>';
    html += '<p class="text-sm text-gray-200 italic">' + (responses[answer] || '修罗女打量着你：「进来吧。」') + '</p>';
    html += '<p class="text-sm text-pink-300 mt-2 italic">「你……怎么看待我？」</p>';
    html += '</div>';
    html += '<div class="mt-3 space-y-2">';
    html += '<button onclick="xiuluoAnswer2(\'awe\')" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">「令人敬畏」</button>';
    html += '<button onclick="xiuluoAnswer2(\'beauty\')" class="w-full bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded text-sm">「您很美」</button>';
    html += '<button onclick="xiuluoAnswer2(\'mystery\')" class="w-full bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded text-sm">「看不透」</button>';
    html += '<button onclick="xiuluoAnswer2(\'scary\')" class="w-full bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded text-sm">「有点可怕」</button>';
    html += '<button onclick="xiuluoAnswer2(\'dunno\')" class="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm">「不知道」</button>';
    html += '</div></div>';
    
    if (typeof window.showModal === 'function') {
        window.showModal('📝 修罗宫 · 问答', html);
    }
}

// 第二问：怎么看待我
function xiuluoAnswer2(answer) {
    var responses = {
        'awe': '修罗女目色一沉：「敬畏……很多人都这么说。」',
        'beauty': '修罗女眼中闪过一丝复杂：「美……倒是很久没人敢这么直说了。」',
        'mystery': '修罗女微怔，随即轻笑：「看不透……有意思。」',
        'scary': '修罗女微微一怔，随即如常：「你倒是敢说。」',
        'dunno': '修罗女睫毛颤了颤：「不知道也无妨。」'
    };
    var scores = { 'awe': -5, 'beauty': 15, 'mystery': 20, 'scary': 5, 'dunno': 0 };
    xiuluoScore += scores[answer] || 0;
    
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    
    // 进入第三问：可有心上人
    var html = '<div class="space-y-4">';
    html += '<div class="bg-gray-800/60 p-3 rounded border-l-4 border-pink-500">';
    html += '<p class="text-xs text-gray-400 mb-1">🚶 修罗女：</p>';
    html += '<p class="text-sm text-gray-200 italic">' + (responses[answer] || '修罗女打量着你。') + '</p>';
    html += '<p class="text-sm text-pink-300 mt-2 italic">「你……可有心上人？」</p>';
    html += '</div>';
    html += '<div class="mt-3 space-y-2">';
    html += '<button onclick="xiuluoAnswer3(\'none\')" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">「没有」</button>';
    html += '<button onclick="xiuluoAnswer3(\'past\')" class="w-full bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded text-sm">「有，但已是过去」</button>';
    html += '<button onclick="xiuluoAnswer3(\'present\')" class="w-full bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded text-sm">「有，就在眼前」</button>';
    html += '<button onclick="xiuluoAnswer3(\'refuse\')" class="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm">「不愿说」</button>';
    html += '<button onclick="xiuluoAnswer3(\'dao\')" class="w-full bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded text-sm">「心中只有大道」</button>';
    html += '</div></div>';
    
    if (typeof window.showModal === 'function') {
        window.showModal('📝 修罗宫 · 问答', html);
    }
}

// 第三问：可有心上人
function xiuluoAnswer3(answer) {
    var responses = {
        'none': '修罗女的视线落在你的眼底，停了很久：「没有……便好。」',
        'past': '修罗女若有所思：「过去……便让它过去吧。」',
        'present': '修罗女微微一怔，唇角那抹弧度敛了三分：「油嘴滑舌。」',
        'refuse': '修罗女神色淡淡：「不愿说，便不说。」',
        'dao': '修罗女近身察你瞳中影：「大道无情……倒不知是不是空话。」'
    };
    var scores = { 'none': 10, 'past': 5, 'present': -5, 'refuse': 0, 'dao': 5 };
    xiuluoScore += scores[answer] || 0;
    
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    
    var responseText = responses[answer] || '修罗女打量着你。';
    
    // 进入第四问：触碰反应
    var html = '<div class="space-y-4">';
    html += '<div class="bg-gray-800/60 p-3 rounded border-l-4 border-pink-500">';
    html += '<p class="text-xs text-gray-400 mb-1">🚶 修罗女：</p>';
    html += '<p class="text-sm text-gray-200 italic">' + responseText + '</p>';
    html += '<p class="text-sm text-gray-400 mt-3 italic">她上前一步，伸出手指捏住你的手心，观察你的反应。</p>';
    html += '</div>';
    html += '<div class="mt-3 space-y-2">';
    html += '<button onclick="xiuluoAnswer4(\'calm\')" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">平静</button>';
    html += '<button onclick="xiuluoAnswer4(\'confused\')" class="w-full bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded text-sm">疑惑</button>';
    html += '<button onclick="xiuluoAnswer4(\'stunned\')" class="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm">呆住</button>';
    html += '<button onclick="xiuluoAnswer4(\'shy\')" class="w-full bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded text-sm">害羞</button>';
    html += '<button onclick="xiuluoAnswer4(\'disgust\')" class="w-full bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded text-sm">反感</button>';
    html += '</div></div>';
    
    if (typeof window.showModal === 'function') {
        window.showModal('📝 修罗宫 · 问答', html);
    }
}

// 第四问：触碰反应
function xiuluoAnswer4(answer) {
    var responses = {
        'calm': '你神色如常，任由她捏着你的手心，目光不闪不避。',
        'confused': '你微微皱眉，不解地看着她。',
        'stunned': '你整个人僵在原地，不知所措。',
        'shy': '你脸颊一热，下意识想缩回手。修罗女却握紧了几分。',
        'disgust': '你猛地抽回手，面露不悦。'
    };
    var reactions = {
        'calm': '修罗女眸中掠过一丝欣赏：「定力不错。」',
        'confused': '修罗女松开手，淡淡道：「试探而已。」',
        'stunned': '修罗女看着你的窘态，唇角微扬：「呆住了？」',
        'shy': '她低声道：「躲什么。」',
        'disgust': '修罗女也不恼，收回手：「戒心挺重。」'
    };
    var scores = { 'calm': 15, 'confused': 5, 'stunned': 15, 'shy': 20, 'disgust': -5 };
    xiuluoScore += scores[answer] || 0;
    // 害羞选项额外加10好感度（直接设置，绕过里程碑检查）
    if (answer === 'shy') {
        var xiuluoNpc = window.npcManager?.getNPC('sect_leader_修罗宫');
        if (xiuluoNpc && xiuluoNpc.relationship) {
            xiuluoNpc.relationship.affection = Math.min(100, Math.max(-100, (xiuluoNpc.relationship.affection || 0) + 10));
        }
    }
    
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    
    var responseText = responses[answer] || '';
    var reactionText = reactions[answer] || '修罗女打量着你。';

    // 男线破例：复用同一套情伤问答，但门槛更高（≥40 通过），且无侍妾（男不可侍妾）
    if (window._xiuluoMaleApplicant) {
        window._xiuluoMaleApplicant = false;
        if (xiuluoScore >= 40) {
            setTrialResult(TRIAL_RESULT.PASS);
            xiuluoFinalResult = 'male_exception';
            var mhtml = '<div class="space-y-4">';
            mhtml += '<div class="bg-gray-800/60 p-3 rounded border-l-4 border-green-500">';
            mhtml += '<p class="text-xs text-gray-400 mb-1">🚶 修罗女：</p>';
            mhtml += '<p class="text-sm text-gray-200 italic">' + reactionText + '</p>';
            mhtml += '<p class="text-sm text-green-300 mt-2 italic">「……四问，你答得出来。」她许久没说话，侧身让开一步，「修罗宫不收男人——但你可以，做我的试情弟子。宫规对你更苛，你受着。」</p>';
            mhtml += '</div>';
            mhtml += '<p class="text-sm text-gray-300">你以「试情弟子」身份入修罗宫。这条路比女子苛刻得多——但宫主的眼，对你不同。</p>';
            mhtml += '<div class="flex gap-2 justify-end mt-4">';
            mhtml += '<button onclick="finishXiuluoMaleJoin()" class="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm font-bold">正式入门</button>';
            mhtml += '</div></div>';
            if (typeof window.showModal === 'function') window.showModal('✅ 修罗宫 · 破例', mhtml);
        } else {
            setTrialResult(TRIAL_RESULT.FAIL);
            xiuluoFinalResult = 'rejected';
            var fhtml = '<div class="space-y-4">';
            fhtml += '<div class="bg-gray-800/60 p-3 rounded border-l-4 border-red-500">';
            fhtml += '<p class="text-xs text-gray-400 mb-1">🚶 修罗女：</p>';
            fhtml += '<p class="text-sm text-gray-200 italic">' + reactionText + '</p>';
            fhtml += '<p class="text-sm text-red-300 mt-2 italic">「答不出宫主的情伤之问，便不是我要找的人。」她转身，「男子的路本就苛刻——他日想清楚了，再来。我不杀送上门的人。」</p>';
            fhtml += '</div>';
            fhtml += '<p class="text-sm text-gray-400">你被拒之门外——但你知道了：这条路靠的是答得出她的问，不是别的。</p>';
            fhtml += '<div class="flex gap-2 justify-end mt-4">';
            fhtml += '<button onclick="document.getElementById(\'xianxia-modal-overlay\').remove()" class="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">离开</button>';
            fhtml += '</div></div>';
            if (typeof window.showModal === 'function') window.showModal('❌ 修罗宫 · 落选', fhtml);
        }
        xiuluoScore = 0;
        return;
    }

    // 总分判定（使用 TRIAL_RESULT 枚举）
    if (xiuluoScore < 20) {
        setTrialResult(TRIAL_RESULT.FAIL);
        // 拒绝
        xiuluoFinalResult = 'rejected';
        var html = '<div class="space-y-4">';
        html += '<div class="bg-gray-800/60 p-3 rounded border-l-4 border-red-500">';
        html += '<p class="text-xs text-gray-400 mb-1">🚶 修罗女：</p>';
        html += '<p class="text-sm text-gray-200 italic">' + responseText + '</p>';
        html += '<p class="text-sm text-red-300 mt-2 italic">「你……还不够格。回去吧。」</p>';
        html += '</div>';
        html += '<p class="text-sm text-gray-300">修罗女转身离去，不再看你一眼。</p>';
        if (typeof window.showModal === 'function') {
            window.showModal('❌ 修罗宫 · 拒绝', html);
        }
        xiuluoScore = 0;
    } else if (xiuluoScore >= 60) {
        setTrialResult(TRIAL_RESULT.PASS);
        // 达到侍妾门槛 → 询问是否愿意服侍
        xiuluoFinalResult = 'pending_concubine';
        var html = '<div class="space-y-4">';
        html += '<div class="bg-gray-800/60 p-3 rounded border-l-4 border-pink-500">';
        html += '<p class="text-xs text-gray-400 mb-1">🚶 修罗女：</p>';
        html += '<p class="text-sm text-gray-200 italic">' + responseText + '</p>';
        html += '<p class="text-sm text-pink-300 mt-2 italic">修罗女嫣然一笑：「姑娘想不想服侍本宫主？」</p>';
        html += '</div>';
        html += '<div class="flex gap-2 justify-end mt-4">';
        html += '<button onclick="xiuluoAcceptConcubine()" class="bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded text-sm font-bold">点头</button>';
        html += '<button onclick="xiuluoRejectConcubine()" class="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">摇头</button>';
        html += '</div></div>';
        if (typeof window.showModal === 'function') {
            window.showModal('💕 修罗宫 · 邀约', html);
        }
        xiuluoScore = 0;
    } else {
        // 普通弟子（20~59分）
        setTrialResult(TRIAL_RESULT.PASS);
        xiuluoFinalResult = 'normal';
        var html = '<div class="space-y-4">';
        html += '<div class="bg-gray-800/60 p-3 rounded border-l-4 border-green-500">';
        html += '<p class="text-xs text-gray-400 mb-1">🚶 修罗女：</p>';
        html += '<p class="text-sm text-gray-200 italic">' + responseText + '</p>';
        html += '<p class="text-sm text-green-300 mt-2 italic">「罢了，先留在宫里做事吧。」</p>';
        html += '</div>';
        html += '<p class="text-sm text-gray-300">你被登记为修罗宫杂役弟子。</p>';
        html += '<div class="flex gap-2 justify-end mt-4">';
        html += '<button onclick="finishXiuluoJoin()" class="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm font-bold">正式入门</button>';
        html += '</div></div>';
        if (typeof window.showModal === 'function') {
            window.showModal('📝 修罗宫 · 入门', html);
        }
        xiuluoScore = 0;
    }
}

// 点头接受侍妾
function xiuluoAcceptConcubine() {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    xiuluoFinalResult = 'concubine';
    // 加20宠爱度
    if (typeof window.addFavor === 'function') {
        window.addFavor(20);
    }
    // 加20好感度（修罗女NPC好感，直接设置绕过里程碑检查）
    var xiuluoNpc = window.npcManager?.getNPC('sect_leader_修罗宫');
    if (xiuluoNpc && xiuluoNpc.relationship) {
        xiuluoNpc.relationship.affection = Math.min(100, Math.max(-100, (xiuluoNpc.relationship.affection || 0) + 20));
    }
    var html = '<div class="space-y-4">';
    html += '<div class="bg-gray-800/60 p-3 rounded border-l-4 border-pink-500">';
    html += '<p class="text-xs text-gray-400 mb-1">👑 修罗宫宫主 · 修罗女：</p>';
    html += '<p class="text-sm text-gray-200 italic">修罗女注视你良久，目光中闪过一丝不易察觉的波动。</p>';
    html += '<p class="text-sm text-pink-300 mt-2 italic">「……你留下，跟我。」</p>';
    html += '<p class="text-xs text-gray-400 mt-2">侍女们低头行礼，你被带往内宫深处。</p>';
    html += '</div>';
    html += '<p class="text-sm text-pink-400">💕 你被修罗女收为侍妾，开始了在修罗宫的别样生活。</p>';
    html += '<div class="flex gap-2 justify-end mt-4">';
    html += '<button onclick="finishXiuluoJoin()" class="bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded text-sm font-bold">正式入门</button>';
    html += '</div></div>';
    if (typeof window.showModal === 'function') {
        window.showModal('💕 修罗宫 · 侍妾', html);
    }
}

// 摇头拒绝侍妾
function xiuluoRejectConcubine() {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    xiuluoFinalResult = 'normal';
    var html = '<div class="space-y-4">';
    html += '<div class="bg-gray-800/60 p-3 rounded border-l-4 border-green-500">';
    html += '<p class="text-xs text-gray-400 mb-1">🚶 修罗女：</p>';
    html += '<p class="text-sm text-gray-200 italic">修罗女神色淡了几分：「也罢，先留在宫里做事吧。」</p>';
    html += '</div>';
    html += '<p class="text-sm text-gray-300">你被登记为修罗宫杂役弟子。</p>';
    html += '<div class="flex gap-2 justify-end mt-4">';
    html += '<button onclick="finishXiuluoJoin()" class="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm font-bold">正式入门</button>';
    html += '</div></div>';
    if (typeof window.showModal === 'function') {
        window.showModal('📝 修罗宫 · 入门', html);
    }
}

// 保存最终结果类型：'concubine' 或 'normal'
var xiuluoFinalResult = null;

function finishXiuluoJoin() {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    if (typeof window.joinSect === 'function') {
        // 根据分数结果决定传入的评估结果
        if (xiuluoFinalResult === 'concubine') {
            window.joinSect('修罗宫', window._xiuluoEvalResult);
        } else {
            // 普通弟子/杂役，不传特殊身份
            window.joinSect('修罗宫', null);
        }
    }
}

// ============ 修罗宫男线：苛刻破例（复用情伤问答考题，门槛更高） ============
// 男玩家不可走正常女线考核；但可应宫主亲出的情伤之问（与女线同套 4 问）。
// 男线门槛更高（≥40 通过，女线 ≥20 即可），且无侍妾（男不可侍妾）。
// 通过 → 以「试情弟子」入派，绯泪主线对其开放；不通过 → 拒收，可他日再应。
function xiuluoMaleTrialAttempt() {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    if (typeof window.markSectLeaderMetFromTrial === 'function') window.markSectLeaderMetFromTrial('修罗宫');
    xiuluoScore = 0;
    window._xiuluoMaleApplicant = true; // 标记走男线破例评分（在 xiuluoAnswer4 终分处分流）
    var html = '<div class="space-y-4">';
    html += '<div class="bg-gray-800/60 p-3 rounded border-l-4 border-pink-500">';
    html += '<p class="text-xs text-gray-400 mb-1">👑 修罗宫宫主 · 修罗女：</p>';
    html += '<p class="text-sm text-gray-200 italic">你应宫主亲出的情伤之问求见。一道黑红身影不知何时立在你面前——修罗女凝眸细审，绯红眼底翻涌着你读不懂的东西。</p>';
    html += '<p class="text-sm text-pink-300 mt-2 italic">「……男人。修罗宫不收男人。」她许久没说话，「但修罗宫收情伤。你若答得出我四问——男子的门槛更高，但我破例一次。」</p>';
    html += '</div>';
    html += '<p class="text-sm text-gray-400">情伤四问：为何而来、怎么看待我、可有心上人、触碰反应。答得够真，方可留下。</p>';
    html += '<p class="text-sm text-pink-300 mt-2 italic">「你……为何而来？」</p>';
    html += '<div class="mt-3 space-y-2">';
    html += '<button onclick="xiuluoAnswer(\'shelter\')" class="w-full bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded text-sm">「求宫主收留」</button>';
    html += '<button onclick="xiuluoAnswer(\'power\')" class="w-full bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded text-sm">「想变强」</button>';
    html += '<button onclick="xiuluoAnswer(\'despair\')" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">「走投无路」</button>';
    html += '<button onclick="xiuluoAnswer(\'curiosity\')" class="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm">「不知道」</button>';
    html += '<button onclick="document.getElementById(\'xianxia-modal-overlay\').remove()" class="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm">退下</button>';
    html += '</div></div>';
    if (typeof window.showModal === 'function') window.showModal('🩸 修罗宫 · 破例应考', html);
}

function finishXiuluoMaleJoin() {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    if (typeof window.joinSect === 'function') {
        // 男线破例：以普通弟子身份入派（非侍妾），设 male 破例标记
        window.joinSect('修罗宫', null);
        if (window.discipleState) {
            window.discipleState._maleException = true; // 标记：男破例弟子
            window.discipleState.rankName = '试情弟子';
        }
    }
}

// ============ 百花谷入门流程 ============
// 百花谷全是女子，守卫不知如何应对男的入门请求
// 门主温蘅：三十余岁，外表柔弱温婉，说话轻声细语，永远笑眼弯弯
// 能看透人心，每一句温柔询问都精准扎在软处
// 满谷的花，都能在她一个眼神下，从良药变成剧毒

var baihuaScore = 0;

function showBaihuaGuardDialog() {
    var player = window.currentCharData || {};
    markSectLeaderMetFromTrial('百花谷');
    var isMale = player.gender === 'male';
    
    var html = '<div class="space-y-4">';
    html += '<div class="bg-gray-800/60 p-3 rounded border-l-4 border-pink-500">';
    html += '<p class="text-xs text-gray-400 mb-1">🚶 谷口守卫：</p>';
    if (isMale) {
        html += '<p class="text-sm text-gray-200 italic">你走到百花谷口，花木掩映间一道竹门，一位穿青布衣裳的年轻女子在修剪花枝。</p>';
        html += '<p class="text-sm text-gray-200 italic mt-2">她先抬了头，没急着说话，上下打量了你一圈后微微歪了歪头：</p>';
        html += '<p class="text-sm text-pink-300 mt-2 italic">「派中皆为女子，公子所言实为首次，还请待我问询。」</p>';
        html += '<p class="text-sm text-gray-200 italic mt-2">她转身往里走。没过一会儿，谷里传来一个声音，隔着一片花丛，软软的、不急不慢的——</p>';
        html += '<p class="text-sm text-pink-200 italic mt-2">「让他进来吧。」</p>';
        html += '<p class="text-sm text-gray-200 italic mt-2">修花女子冲你点头：「谷主让你进去。」</p>';
    } else {
        html += '<p class="text-sm text-gray-200 italic">你走到百花谷口，花木掩映间一道竹门，一位穿青布衣裳的年轻女子在修剪花枝。</p>';
        html += '<p class="text-sm text-gray-200 italic mt-2">守卫打量一番，微微笑道：</p>';
        html += '<p class="text-sm text-pink-300 mt-2 italic">「姑娘请进吧。」</p>';
        html += '<p class="text-sm text-gray-200 italic mt-2">她侧身让开：「进去直走，过那片紫藤就是了。」</p>';
    }
    html += '</div>';
    
    html += '<div class="bg-gray-800/60 p-3 rounded border-l-4 border-teal-500">';
    html += '<p class="text-xs text-gray-400 mb-1">🌸 百花谷谷主 · 温蘅：</p>';
    html += '<p class="text-sm text-gray-200 italic">你穿过花丛，一个身着淡青纱衣的女子坐在花圃边的竹椅上，</p>';
    html += '<p class="text-sm text-gray-200 italic">手里拈着一朵芍药。她没起身，抬头看了看你，目光从脸移到手，又移回脸。</p>';
    html += '<p class="text-sm text-teal-200 italic mt-2">她笑了一下，把芍药举到胸前，顿了顿，摇了摇手里的芍药：</p>';
    html += '<p class="text-sm text-teal-300 italic mt-2">「你猜猜看——我手里这朵花，是真的，还是我用真气凝的？」</p>';
    html += '</div>';
    html += '<div class="mt-3 space-y-2">';
    html += '<button onclick="baihuaAnswer1(\'real\')" class="w-full bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded text-sm">「是真的」</button>';
    html += '<button onclick="baihuaAnswer1(\'fake\')" class="w-full bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded text-sm">「是假的，真气凝的」</button>';
    html += '<button onclick="baihuaAnswer1(\'both\')" class="w-full bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded text-sm">「花是真的，但被谷主动了手脚」</button>';
    html += '<button onclick="baihuaAnswer1(\'dunno\')" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">「看不出来」</button>';
    html += '</div></div>';
    
    if (typeof window.showModal === 'function') {
        window.showModal('🌸 百花谷 · 入门', html);
    }
}

function baihuaAnswer1(answer) {
    var responses = {
        'real': '温蘅低头看了看花，笑了：「猜对了。不过——」她把花凑近自己鼻尖，轻轻一嗅，「真的花，有时候比假的更危险。这句话你记着。」',
        'fake': '她眉梢微微一动，指尖一用力，那朵芍药化作点点光尘散在空气里——是真的化掉了。「猜错了。但我喜欢敢猜的人。百花谷需要的不全是老实人。」',
        'both': '她微微一怔，低头看了看手里的芍药，沉默了两息，然后笑出声来：「……你怎么看出来的？这花里藏了一缕蜂尾毒，是我方才涂的。你眼力不错。」她把花放在桌上，正色了一瞬：「百花谷需要这种人。」',
        'dunno': '她把花放下，没恼，只是说：「看不出来，就多看。眼力是练出来的——不是算出来的。」语气不重，但也没再追问。'
    };
    var scores = { 'real': 5, 'fake': 10, 'both': 20, 'dunno': 0 };
    baihuaScore += scores[answer] || 0;
    
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    
    var html = '<div class="space-y-4">';
    html += '<div class="bg-gray-800/60 p-3 rounded border-l-4 border-teal-500">';
    html += '<p class="text-xs text-gray-400 mb-1">🌸 百花谷谷主 · 温蘅：</p>';
    html += '<p class="text-sm text-gray-200 italic">' + (responses[answer] || '温蘅笑而不语。') + '</p>';
    html += '<p class="text-sm text-teal-300 mt-3 italic">她随手把那朵芍药搁在桌上，往后靠在椅背上，</p>';
    html += '<p class="text-sm text-teal-200 italic mt-2">目光闲闲地扫了一圈周围，忽然问：</p>';
    html += '<p class="text-sm text-teal-300 italic mt-2">「那你从进谷到现在，一共看到了多少种不同的花？」</p>';
    html += '<p class="text-xs text-teal-400 italic">她问得很随意，像在聊天气。但那双琥珀色的眼睛已经收了笑，安静地看着你。</p>';
    html += '</div>';
    html += '<div class="mt-3 space-y-2">';
    html += '<button onclick="baihuaAnswer2(\'seven\')" class="w-full bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded text-sm">「六种——芍药、牡丹、月季、兰草、茉莉、紫藤」</button>';
    html += '<button onclick="baihuaAnswer2(\'few\')" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">「大概四五种吧」</button>';
    html += '<button onclick="baihuaAnswer2(\'many\')" class="w-full bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded text-sm">「很多，数不过来」</button>';
    html += '<button onclick="baihuaAnswer2(\'flirt\')" class="w-full bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded text-sm">「没注意花，光注意谷主了」</button>';
    html += '</div></div>';
    
    if (typeof window.showModal === 'function') {
        window.showModal('🌸 百花谷 · 问答', html);
    }
}

function baihuaAnswer2(answer) {
    var responses = {
        'seven': '她的眼睛亮了一下，身体微微前倾，脸上浮出真切的赞许：「你不仅看了，还记住了，很棒。」',
        'few': '她点点头：「差不多，不过你漏了些不算显眼的，可惜。下次路过，低头多看看吧。」语气平和，像在教学生。',
        'many': '她脸上的笑意淡了：「数不过来，说明你根本没认真看。来百花谷的人，如果连路边的花都懒得看一眼，那我这满谷的花，就算开给你看也是白开。请回吧。」',
        'flirt': '她愣了一瞬，然后失笑，但眼里没有笑意：「你猜我听过多少次这种话了？」说完低头整理袖口，语气淡了几分：「油嘴滑舌的人，百花谷不缺。」'
    };
    var scores = { 'seven': 20, 'few': 10, 'many': 0, 'flirt': 5 };
    baihuaScore += scores[answer] || 0;
    
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    
    var responseText = responses[answer] || '温蘅笑而不语。';
    var isFail = (answer === 'many');
    if (isFail) setTrialResult(TRIAL_RESULT.FAIL);
    
    var html = '<div class="space-y-4">';
    html += '<div class="bg-gray-800/60 p-3 rounded border-l-4 border-teal-500">';
    html += '<p class="text-xs text-gray-400 mb-1">🌸 百花谷谷主 · 温蘅：</p>';
    html += '<p class="text-sm text-gray-200 italic">' + responseText + '</p>';
    html += '</div>';
    
    if (isFail) {
        html += '<p class="text-sm text-red-400 mt-2">守卫上前一步，礼貌地做了个「请」的手势。</p>';
        html += '<p class="text-sm text-gray-400 italic mt-1">你走到门口时，守卫在身后补了一句：</p>';
        html += '<p class="text-xs text-gray-500 italic">「公子走好。不起眼的花，也可多低头看看。」</p>';
        if (typeof window.showModal === 'function') {
            window.showModal('❌ 百花谷 · 拒绝', html);
        }
        baihuaScore = 0;
        return;
    }
    
    html += '<p class="text-sm text-teal-300 mt-3 italic">温蘅站起身，走到花圃边，背对着你拨弄一片叶子，安静了一会儿。</p>';
    html += '<p class="text-sm text-teal-200 italic mt-2">然后她转过身，笑意又浮上来，像刚才什么都没发生一样，声音柔柔地问：</p>';
    html += '<p class="text-sm text-teal-300 italic mt-2">「最后一问——你觉得，我是个什么样的人？」</p>';
    html += '<p class="text-xs text-teal-400 italic">她歪了歪头，认真看着你，像真的很在意答案。</p>';
    html += '<div class="mt-3 space-y-2">';
    html += '<button onclick="baihuaAnswer3(\'kind\')" class="w-full bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded text-sm">「温柔善良，与世无争的高人」</button>';
    html += '<button onclick="baihuaAnswer3(\'sharp\')" class="w-full bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded text-sm">「表面温柔，但心里什么都清楚」</button>';
    html += '<button onclick="baihuaAnswer3(\'danger\')" class="w-full bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded text-sm">「深不可测，我不想得罪你」</button>';
    html += '<button onclick="baihuaAnswer3(\'dare\')" class="w-full bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded text-sm">「你在笑，但你在试探我——你并不信任任何人」</button>';
    html += '<button onclick="baihuaAnswer3(\'dunno\')" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">「不敢妄加评判」</button>';
    html += '</div></div>';
    
    if (typeof window.showModal === 'function') {
        window.showModal('🌸 百花谷 · 问答', html);
    }
}

function baihuaAnswer3(answer) {
    var responses = {
        'kind': '她笑了一下，但笑意只浮在嘴角，没到眼里：「哦？你是第一个这么评价我的人。」她没多说什么，转回身继续拨叶子。',
        'sharp': '她转过头来，笑容多了一丝温度：「你倒是敢说。很多人只看到第一层，就以为那是全部了。」她轻轻点了一下头：「能看穿这一层，不算容易。」',
        'danger': '她像是被逗到了，弯了弯眼睛：「不想得罪我？那你有没有想过——」她故意顿了一下，「这句话本身就已经得罪我了？」然后摆摆手：「逗你的，进来喝茶吧。」',
        'dare': '她的笑容消失了。安静了很久。她转过身去，背对着你，声音比之前轻了许多，像花瓣落在水面：「……你胆子很大。不过——你说得对。」她沉默了一会儿，然后回过头来，眼里那层温温的光没有散，但多了一点别的东西，像是被人翻开了一页没打算给人看的书。「敢说真话，你留下吧。」',
        'dunno': '她笑了笑，语气温和但没有任何商量余地：「来百花谷的人，要是连话都不敢说，那还学什么？请回吧。」'
    };
    var scores = { 'kind': 5, 'sharp': 15, 'danger': 10, 'dare': 20, 'dunno': 0 };
    baihuaScore += scores[answer] || 0;
    
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    
    var responseText = responses[answer] || '温蘅笑而不语。';
    var trialResult = (answer !== 'dunno') ? TRIAL_RESULT.PASS : TRIAL_RESULT.FAIL;
    setTrialResult(trialResult);
    var passed = (trialResult === TRIAL_RESULT.PASS);
    var isDare = (answer === 'dare');
    
    var html = '<div class="space-y-4">';
    html += '<div class="bg-gray-800/60 p-3 rounded border-l-4 border-teal-500">';
    html += '<p class="text-xs text-gray-400 mb-1">🌸 百花谷谷主 · 温蘅：</p>';
    html += '<p class="text-sm text-gray-200 italic">' + responseText + '</p>';
    html += '</div>';
    
    if (passed) {
        if (isDare) {
            html += '<p class="text-sm text-green-400">🎉 你通过了温蘅的考验，被登记为百花谷弟子。</p>';
        } else {
            html += '<p class="text-sm text-green-400">🎉 温蘅点了点头，你被登记为百花谷弟子。</p>';
        }
        html += '<div class="flex gap-2 justify-end mt-4">';
        html += '<button onclick="finishBaihuaJoin()" class="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded text-sm font-bold">正式入门</button>';
        html += '</div>';
        html += '<p class="text-xs text-gray-500 italic mt-3">出门时，守卫笑着递过一包花种：</p>';
        html += "<p class=\"text-xs text-gray-500 italic\">「谷主让给的，说'以后就是自己人了'。」</p>";
    } else {
        html += '<p class="text-sm text-red-400 mt-2">守卫上前一步，礼貌地做了个「请」的手势。</p>';
        html += '<p class="text-sm text-gray-400 italic mt-1">你走到门口时，守卫在身后补了一句：</p>';
        html += '<p class="text-xs text-gray-500 italic">「公子走好。不起眼的花，也可多低头看看。」</p>';
    }
    html += '</div>';
    
    if (typeof window.showModal === 'function') {
        window.showModal(passed ? '🎉 百花谷 · 入门' : '❌ 百花谷 · 拒绝', html);
    }
    baihuaScore = 0;
}

function finishBaihuaJoin() {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    if (typeof window.joinSect === 'function') {
        window.joinSect('百花谷', null);
    }
}

// ============ 大隐阁入门流程 ============
// 大隐阁没有门卫，只有阁主/副阁主/成员三级
// 门主：清癯中年，慧黠爱笑，洞察力强

var dayingeScore = 0;

function showDayingeDialog() {
    var player = window.currentCharData || {};
    var html = '<div class="space-y-4">';
    html += '<div class="bg-gray-800/60 p-3 rounded border-l-4 border-teal-500">';
    html += '<p class="text-xs text-gray-400 mb-1">🏛️ 大隐阁 · 庭院</p>';
    html += '<p class="text-sm text-gray-200 italic">你走进大隐阁，庭院清幽，石桌上摆着一壶茶、一盘残局。</p>';
    html += '<p class="text-sm text-gray-200 italic mt-2">一个清癯的中年男子正坐在石凳上，手中捻着一枚白子，若有所思。</p>';
    html += '<p class="text-sm text-gray-200 italic mt-2">听到脚步声，他抬起头，目光在你身上停了一瞬，随即露出一个慧黠的笑容。</p>';
    html += '<p class="text-sm text-teal-300 mt-3 italic">「能走进这里，说明你已经过了自己那一关。坐。」</p>';
    html += '</div>';
    html += '<div class="mt-3 space-y-2">';
    html += '<button onclick="dayingeAnswer1(\'admire\')" class="w-full bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded text-sm">「晚辈仰慕大隐阁已久，恳请门主收留」</button>';
    html += '<button onclick="dayingeAnswer1(\'guidance\')" class="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm">「想求门主指点修行」</button>';
    html += '<button onclick="dayingeAnswer1(\'silent\')" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">沉默，看他下棋</button>';
    html += '</div></div>';
    
    if (typeof window.showModal === 'function') {
        window.showModal('🏛️ 大隐阁 · 入门', html);
    }
}

function dayingeAnswer1(answer) {
    var responses = {
        'admire': '门主笑而不语，给你斟了杯茶：「金丹以上了？嗯，根基不错。」',
        'guidance': '门主挑眉，眼中带着笑意：「指点？我可闲得很。不过你既然来了，先陪我下一局。」',
        'silent': '门主看了你一眼，也不说话，继续落子。半晌：「能沉住气，不错。」'
    };
    
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    
    var html = '<div class="space-y-4">';
    html += '<div class="bg-gray-800/60 p-3 rounded border-l-4 border-teal-500">';
    html += '<p class="text-xs text-gray-400 mb-1">🏛️ 大隐阁 · 门主</p>';
    html += '<p class="text-sm text-gray-200 italic">' + (responses[answer] || '门主笑而不语。') + '</p>';
    html += '<p class="text-sm text-teal-300 mt-3 italic">门主落下一子，随口问：「你觉得修行路上，什么最重要？」</p>';
    html += '</div>';
    html += '<div class="mt-3 space-y-2">';
    html += '<button onclick="dayingeAnswer2(\'talent\')" class="w-full bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded text-sm">「天赋」</button>';
    html += '<button onclick="dayingeAnswer2(\'mind\')" class="w-full bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded text-sm">「心性」</button>';
    html += '<button onclick="dayingeAnswer2(\'fortune\')" class="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm">「机缘」</button>';
    html += '<button onclick="dayingeAnswer2(\'dunno\')" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">「不知道」</button>';
    html += '</div></div>';
    
    if (typeof window.showModal === 'function') {
        window.showModal('🏛️ 大隐阁 · 问答', html);
    }
}

function dayingeAnswer2(answer) {
    var responses = {
        'talent': '门主摇头笑了笑：「天赋？我见过太多天赋好的，走不远的也大有人在。」',
        'mind': '门主眼中闪过一丝赞许：「心性……倒是个明白人。」',
        'fortune': '门主若有所思：「机缘确实重要，但光等机缘可不行。」',
        'dunno': '门主笑道：「不知道就多看看，看多了就知道了。」'
    };
    var scores = { 'talent': 5, 'mind': 15, 'fortune': 10, 'dunno': 0 };
    dayingeScore += scores[answer] || 0;
    
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    
    var html = '<div class="space-y-4">';
    html += '<div class="bg-gray-800/60 p-3 rounded border-l-4 border-teal-500">';
    html += '<p class="text-xs text-gray-400 mb-1">🏛️ 大隐阁 · 门主</p>';
    html += '<p class="text-sm text-gray-200 italic">' + (responses[answer] || '门主笑而不语。') + '</p>';
    html += '<p class="text-sm text-teal-300 mt-3 italic">他又落一子：「那你觉得，我为何叫大隐阁？」</p>';
    html += '</div>';
    html += '<div class="mt-3 space-y-2">';
    html += '<button onclick="dayingeAnswer3(\'city\')" class="w-full bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded text-sm">「大隐隐于市」</button>';
    html += '<button onclick="dayingeAnswer3(\'hermit\')" class="w-full bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded text-sm">「隐世高人」</button>';
    html += '<button onclick="dayingeAnswer3(\'escape\')" class="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm">「避世修行」</button>';
    html += '<button onclick="dayingeAnswer3(\'dunno2\')" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">「不知道」</button>';
    html += '</div></div>';
    
    if (typeof window.showModal === 'function') {
        window.showModal('🏛️ 大隐阁 · 问答', html);
    }
}

function dayingeAnswer3(answer) {
    var responses = {
        'city': '门主抚掌轻笑：「果然是个通透人。」',
        'hermit': '门主摇头：「隐世？我只是懒得出门罢了。」',
        'escape': '门主看了你一眼：「避世？修行在心不在形。」',
        'dunno2': '门主笑着指了指棋盘：「不知道就下棋，下着下着就明白了。」'
    };
    var scores = { 'city': 15, 'hermit': 5, 'escape': 10, 'dunno2': 0 };
    dayingeScore += scores[answer] || 0;
    
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    
    // 检查金丹境界
    var player = window.currentCharData || {};
    var realmTier = (typeof window.getRealmTier === 'function') ? window.getRealmTier(player.realm) : 0;
    
    if (realmTier < 4) {
        // 金丹以下 → 拒绝
        var html = '<div class="space-y-4">';
        html += '<div class="bg-gray-800/60 p-3 rounded border-l-4 border-red-500">';
        html += '<p class="text-xs text-gray-400 mb-1">🏛️ 大隐阁 · 门主</p>';
        html += '<p class="text-sm text-gray-200 italic">' + (responses[answer] || '门主笑而不语。') + '</p>';
        html += '<p class="text-sm text-red-300 mt-2 italic">「大隐阁只收金丹以上，你……还得再磨砺磨砺。」</p>';
        html += '</div>';
        html += '<p class="text-sm text-gray-300">门主歉意一笑，拱手送客。</p>';
        if (typeof window.showModal === 'function') {
            window.showModal('❌ 大隐阁 · 拒绝', html);
        }
    } else {
        // 金丹以上 → 入门，分数影响好感
        var affectionText = '';
        if (dayingeScore >= 20) {
            affectionText = '门主笑得更深了：「果然是个有趣的人。从今以后，你就是大隐阁的成员了。」\n你感到门主对你的好感增加了。';
        } else {
            affectionText = '门主点头：「嗯，还算不错。从今以后，你就是大隐阁的成员了。」';
        }
        
        var html = '<div class="space-y-4">';
        html += '<div class="bg-gray-800/60 p-3 rounded border-l-4 border-teal-500">';
        html += '<p class="text-xs text-gray-400 mb-1">🏛️ 大隐阁 · 门主</p>';
        html += '<p class="text-sm text-gray-200 italic">' + (responses[answer] || '门主笑而不语。') + '</p>';
        html += '<p class="text-sm text-teal-300 mt-2 italic">' + affectionText + '</p>';
        html += '</div>';
        html += '<div class="flex gap-2 justify-end mt-4">';
        html += '<button onclick="finishDayingeJoin()" class="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded text-sm font-bold">正式入门</button>';
        html += '</div></div>';
        if (typeof window.showModal === 'function') {
            window.showModal('🏛️ 大隐阁 · 入门', html);
        }
    }
    dayingeScore = 0;
}

function finishDayingeJoin() {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    if (typeof window.joinSect === 'function') {
        window.joinSect('大隐阁', null);
    }
}

// ============ 天书阁入门流程 ============
// 天书阁没有门卫，只有阁主/副阁主/成员三级
// 门主归藏子：渡劫9层，白发长须，笑容可掬，爱书如命

var tianshugeScore = 0;

function showTianshugeDialog() {
    var html = '<div class="space-y-4">';
    html += '<div class="bg-gray-800/60 p-3 rounded border-l-4 border-indigo-500">';
    html += '<p class="text-xs text-gray-400 mb-1">📚 天书阁</p>';
    html += '<p class="text-sm text-gray-200 italic">你走进天书阁，只见阁内书卷如山，满室墨香。</p>';
    html += '<p class="text-sm text-gray-200 italic mt-2">一个白发长须的老者正背对着你，踮脚从高架上取下一本书。</p>';
    html += '<p class="text-sm text-gray-200 italic mt-2">他转过身来，道袍飘飘，仙风道骨，笑容可掬。</p>';
    html += '<p class="text-sm text-indigo-300 mt-3 italic">「哦？有客人来了。老夫归藏子，天书阁阁主。」</p>';
    html += '</div>';
    html += '<div class="mt-3 space-y-2">';
    html += '<button onclick="tianshugeAnswer1(\'admire\')" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-sm">「晚辈慕名而来，想拜入门下」</button>';
    html += '<button onclick="tianshugeAnswer1(\'books\')" class="w-full bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded text-sm">「听说天书阁收罗天下典籍，特来求书」</button>';
    html += '<button onclick="tianshugeAnswer1(\'thief\')" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">「听说阁主是个雅贼」</button>';
    html += '</div></div>';
    
    if (typeof window.showModal === 'function') {
        window.showModal('📚 天书阁 · 入门', html);
    }
}

function tianshugeAnswer1(answer) {
    var responses = {
        'admire': '归藏子抚须而笑：「慕名？老夫有何名可言？不过是爱书之人罢了。」',
        'books': '归藏子眼睛一亮：「求书？好说好说，不过只借不送。」',
        'thief': '归藏子一愣，随即大笑：「雅贼？哈哈哈……老夫是"抢救濒危武学典籍"！可不敢乱说。」'
    };
    
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    
    var html = '<div class="space-y-4">';
    html += '<div class="bg-gray-800/60 p-3 rounded border-l-4 border-indigo-500">';
    html += '<p class="text-xs text-gray-400 mb-1">📚 天书阁 · 归藏子</p>';
    html += '<p class="text-sm text-gray-200 italic">' + (responses[answer] || '归藏子笑而不语。') + '</p>';
    html += '<p class="text-sm text-indigo-300 mt-3 italic">归藏子打量着你，忽然问：「你说说，读书人最要紧的是什么？」</p>';
    html += '</div>';
    html += '<div class="mt-3 space-y-2">';
    html += '<button onclick="tianshugeAnswer2(\'principle\')" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-sm">「明理」</button>';
    html += '<button onclick="tianshugeAnswer2(\'utility\')" class="w-full bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded text-sm">「致用」</button>';
    html += '<button onclick="tianshugeAnswer2(\'heritage\')" class="w-full bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded text-sm">「传承」</button>';
    html += '<button onclick="tianshugeAnswer2(\'dunno\')" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">「不知道」</button>';
    html += '</div></div>';
    
    if (typeof window.showModal === 'function') {
        window.showModal('📚 天书阁 · 问答', html);
    }
}

function tianshugeAnswer2(answer) {
    var responses = {
        'principle': '归藏子点头：「书以载道，道以明理。不错。」',
        'utility': '归藏子摇头晃脑：「致用？读书只为用，那与工匠何异？」',
        'heritage': '归藏子眼中精光一闪：「传承……好！老夫最爱的就是传承二字。」',
        'dunno': '归藏子笑道：「不知道就多读。」'
    };
    var scores = { 'principle': 10, 'utility': 5, 'heritage': 20, 'dunno': 0 };
    tianshugeScore += scores[answer] || 0;
    
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    
    var html = '<div class="space-y-4">';
    html += '<div class="bg-gray-800/60 p-3 rounded border-l-4 border-indigo-500">';
    html += '<p class="text-xs text-gray-400 mb-1">📚 天书阁 · 归藏子</p>';
    html += '<p class="text-sm text-gray-200 italic">' + (responses[answer] || '归藏子笑而不语。') + '</p>';
    html += '<p class="text-sm text-indigo-300 mt-3 italic">归藏子凑近你，压低声音：「你可知，天下功法最妙的一门是什么？」</p>';
    html += '</div>';
    html += '<div class="mt-3 space-y-2">';
    html += '<button onclick="tianshugeAnswer3(\'secret\')" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-sm">「是不传之秘」</button>';
    html += '<button onclick="tianshugeAnswer3(\'lost\')" class="w-full bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded text-sm">「是失传古法」</button>';
    html += '<button onclick="tianshugeAnswer3(\'self\')" class="w-full bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded text-sm">「是自创的」</button>';
    html += '<button onclick="tianshugeAnswer3(\'yours\')" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">「是阁主收集的那些」</button>';
    html += '</div></div>';
    
    if (typeof window.showModal === 'function') {
        window.showModal('📚 天书阁 · 问答', html);
    }
}

function tianshugeAnswer3(answer) {
    var responses = {
        'secret': '归藏子神秘一笑：「不传之秘？老夫这里多的是。」',
        'lost': '归藏子抚掌：「失传的古法……老夫正在抢救中。」',
        'self': '归藏子若有所思：「自创？年轻人有志气。」',
        'yours': '归藏子哈哈大笑：「聪明！老夫最喜欢聪明人。」'
    };
    var scores = { 'secret': 10, 'lost': 15, 'self': 5, 'yours': 20 };
    tianshugeScore += scores[answer] || 0;
    
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    
    var html = '<div class="space-y-4">';
    html += '<div class="bg-gray-800/60 p-3 rounded border-l-4 border-indigo-500">';
    html += '<p class="text-xs text-gray-400 mb-1">📚 天书阁 · 归藏子</p>';
    html += '<p class="text-sm text-gray-200 italic">' + (responses[answer] || '归藏子笑而不语。') + '</p>';
    html += '<p class="text-sm text-indigo-300 mt-3 italic">归藏子正色道：「入我天书阁，需守规矩：不得以书中功法为非作歹。你可能做到？」</p>';
    html += '</div>';
    html += '<div class="mt-3 space-y-2">';
    html += '<button onclick="tianshugeAnswer4(\'obey\')" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-sm">「弟子谨记」</button>';
    html += '<button onclick="tianshugeAnswer4(\'selfdefense\')" class="w-full bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded text-sm">「若他人欺我太甚呢？」</button>';
    html += '<button onclick="tianshugeAnswer4(\'maybe\')" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">「我尽量」</button>';
    html += '</div></div>';
    
    if (typeof window.showModal === 'function') {
        window.showModal('📚 天书阁 · 问答', html);
    }
}

function tianshugeAnswer4(answer) {
    var responses = {
        'obey': '归藏子满意点头：「善。」',
        'selfdefense': '归藏子点头：「自卫无妨，但不可主动为恶。」',
        'maybe': '归藏子皱眉：「尽量？天书阁不收含糊之人。」'
    };
    var scores = { 'obey': 15, 'selfdefense': 10, 'maybe': -999 };
    tianshugeScore += scores[answer] || 0;
    
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    
    var responseText = responses[answer] || '归藏子笑而不语。';
    
    if (answer === 'maybe') {
        var html = '<div class="space-y-4">';
        html += '<div class="bg-gray-800/60 p-3 rounded border-l-4 border-red-500">';
        html += '<p class="text-xs text-gray-400 mb-1">📚 天书阁 · 归藏子</p>';
        html += '<p class="text-sm text-gray-200 italic">' + responseText + '</p>';
        html += '</div>';
        if (typeof window.showModal === 'function') {
            window.showModal('❌ 天书阁 · 拒绝', html);
        }
        tianshugeScore = 0;
        return;
    }
    
    // 检查条件：大善+渡劫
    var player = window.currentCharData || {};
    var karma = player.karma || 0;
    var realmTier = (typeof window.getRealmTier === 'function') ? window.getRealmTier(player.realm) : 0;
    
    if (karma < 100 || realmTier < 9) {
        var html = '<div class="space-y-4">';
        html += '<div class="bg-gray-800/60 p-3 rounded border-l-4 border-red-500">';
        html += '<p class="text-xs text-gray-400 mb-1">📚 天书阁 · 归藏子</p>';
        html += '<p class="text-sm text-gray-200 italic">' + responseText + '</p>';
        html += '<p class="text-sm text-red-300 mt-2 italic">「道友功德/修为尚欠火候，待时机成熟再来。」</p>';
        html += '</div>';
        if (typeof window.showModal === 'function') {
            window.showModal('❌ 天书阁 · 拒绝', html);
        }
        tianshugeScore = 0;
        return;
    }
    
    // 入门成功
    var affectionText = '';
    if (tianshugeScore >= 60) {
        affectionText = '归藏子窃笑如狐：「是个可造之材，改天带你去"抢救"几本好书。」<br>归藏子对你挤了挤眼，你感到他好感大增。';
    } else if (tianshugeScore >= 40) {
        affectionText = '归藏子满意颔首：「不错，从今以后你就是天书阁的成员了。」<br>你感到归藏子对你的好感增加了。';
    } else {
        affectionText = '归藏子点头：「嗯，还算不错。从今以后你就是天书阁的成员了。」';
    }
    
    var html = '<div class="space-y-4">';
    html += '<div class="bg-gray-800/60 p-3 rounded border-l-4 border-indigo-500">';
    html += '<p class="text-xs text-gray-400 mb-1">📚 天书阁 · 归藏子</p>';
    html += '<p class="text-sm text-gray-200 italic">' + responseText + '</p>';
    html += '<p class="text-sm text-indigo-300 mt-2 italic">' + affectionText + '</p>';
    html += '</div>';
    html += '<div class="flex gap-2 justify-end mt-4">';
    html += '<button onclick="finishTianshugeJoin()" class="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-sm font-bold">正式入门</button>';
    html += '</div></div>';
    if (typeof window.showModal === 'function') {
        window.showModal('📚 天书阁 · 入门', html);
    }
    tianshugeScore = 0;
}

function finishTianshugeJoin() {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    if (typeof window.joinSect === 'function') {
        window.joinSect('天书阁', null);
    }
}

// ============ 守卫考核系统 ============
// 完整考核：旧有 19 派；轻量特色问：v18.7 为其余 14 个此前通用/空白门派补齐。

var FULL_GUARD_TRIAL_SECTS = [
    '金刚宗','铸剑山庄','蓬莱派','天山派','少林寺','武当派','太虚剑宗','丐帮','药王谷','阎罗殿',
    '大旗门','侠隐阁','天涯海阁','神机门','霹雳堂','峨眉派','五仙教','唐门','逍遥派'
];

// 单问式考核：不设隐藏分数，只按玩家明确回答给出有叙事依据的职位结果。
// preferred=外门，tolerated=杂役，reject=拒绝；正道恶名硬门槛仍由 checkSectRequirements 统一检查。
var SECT_LIGHT_ENTRY_QUESTIONS = {
    '嵩山派': { speaker:'嵩山执事', color:'yellow', question:'「五岳同盟议事时若各派争执不下，你当如何？」', options:[
        { key:'preferred', text:'「先守盟约，再据理分说」', reply:'执事点头：「知进退，也知大局。可入外门。」' },
        { key:'tolerated', text:'「谁拳头硬就听谁的」', reply:'执事皱眉：「有胆气，少了分寸。先从杂役学规矩。」' },
        { key:'reject', text:'「趁乱挑拨，坐收渔利」', reply:'执事冷下脸：「本门不收这种心思的人。」' }
    ]},
    '恒山派': { speaker:'恒山女尼', color:'pink', question:'「上山途中若见陌生人负伤倒地，你先做什么？」', options:[
        { key:'preferred', text:'「先验伤救人，再问来历」', reply:'女尼合十：「慈悲不等于糊涂。可入外门。」' },
        { key:'tolerated', text:'「先回山门叫人，再一同救治」', reply:'女尼点头：「谨慎些也好，先从杂役做起。」' },
        { key:'reject', text:'「与我无关，绕过去」', reply:'女尼摇头：「心中无恻隐，不必入恒山。」' }
    ]},
    '全真教': { speaker:'知客道人', color:'green', question:'「修道之人，第一件要修的是什么？」', options:[
        { key:'preferred', text:'「先修心性，再谈术法」', reply:'道人抚须：「根本不差。可入外门。」' },
        { key:'tolerated', text:'「先把吐纳与内丹练扎实」', reply:'道人道：「知其术，尚需明其心。先做杂役听经。」' },
        { key:'reject', text:'「找一条最快长生的捷径」', reply:'道人摇头：「只逐捷径，容易走火入魔。请回。」' }
    ]},
    '华山派': { speaker:'守山弟子', color:'purple', question:'「练剑与练气若一时难以兼顾，你怎么选？」', options:[
        { key:'preferred', text:'「先打根基，剑气相济」', reply:'弟子一笑：「不偏不倚，像个练剑的人。可入外门。」' },
        { key:'tolerated', text:'「先练自己更擅长的一边」', reply:'弟子道：「也算实在。先从杂役练基本功。」' },
        { key:'reject', text:'「哪边能压过同门就练哪边」', reply:'弟子收起笑意：「为争胜而入门，华山不收。」' }
    ]},
    '泰山派': { speaker:'守山剑客', color:'yellow', question:'「登十八盘遇暴雨，前路湿滑，你会怎么走？」', options:[
        { key:'preferred', text:'「稳住脚步，一阶一阶上」', reply:'剑客点头：「泰山剑重势更重稳。可入外门。」' },
        { key:'tolerated', text:'「找条近路，能快则快」', reply:'剑客道：「机变有余，根基不足。先做杂役。」' },
        { key:'reject', text:'「既然难走，改日再来」', reply:'剑客摆手：「连山门都不肯登，何谈修行。」' }
    ]},
    '茅山派': { speaker:'黄冠道人', color:'amber', question:'「符箓法术，最该用在什么地方？」', options:[
        { key:'preferred', text:'「镇邪护生，解厄救急」', reply:'道人颔首：「知道符为何而画。可入外门。」' },
        { key:'tolerated', text:'「驱鬼看宅，也可换些盘缠」', reply:'道人笑骂：「倒也现实。先做杂役学规矩。」' },
        { key:'reject', text:'「拿来咒人最方便」', reply:'道人脸色一沉：「术先正心。你走吧。」' }
    ]},
    '衡山派': { speaker:'衡山弟子', color:'cyan', question:'「琴音与剑招都讲究一个“节”，你觉得节是什么？」', options:[
        { key:'preferred', text:'「收放有度，快慢有时」', reply:'弟子击节而笑：「听得出门道。可入外门。」' },
        { key:'tolerated', text:'「出剑够快就行」', reply:'弟子道：「先把步子和拍子练稳。做杂役吧。」' },
        { key:'reject', text:'「花架子而已，不如蛮力」', reply:'弟子摇头：「道不同，不必勉强。」' }
    ]},
    '铁掌帮': { speaker:'铁掌执事', color:'orange', question:'「练铁掌，先练什么？」', options:[
        { key:'preferred', text:'「先站桩养力，把根基练稳」', reply:'执事点头：「知道掌力从脚下起。可入外门。」' },
        { key:'tolerated', text:'「先劈石头，练出胆气」', reply:'执事哼道：「有劲没根。先做杂役磨桩功。」' },
        { key:'reject', text:'「先学最狠的杀招」', reply:'执事摆手：「连根基都不顾，早晚废了手。走吧。」' }
    ]},
    '昆仑派': { speaker:'昆仑道人', color:'blue', question:'「雪线上同伴失足，你离山门只差百步，会怎么做？」', options:[
        { key:'preferred', text:'「回身救人，晚到山门也无妨」', reply:'道人点头：「道法再高，也不能丢了人心。可入外门。」' },
        { key:'tolerated', text:'「先示警山门，再回去救人」', reply:'道人道：「尚知担当。先从杂役做起。」' },
        { key:'reject', text:'「机缘在前，不能为旁人耽误」', reply:'道人拂袖：「只见机缘，不见同道。请回。」' }
    ]},
    '青城派': { speaker:'青城剑客', color:'green', question:'「蜀道狭窄，前方林中疑有埋伏，你会如何？」', options:[
        { key:'preferred', text:'「先察地势，再决定出剑」', reply:'剑客点头：「剑快，眼要更快。可入外门。」' },
        { key:'tolerated', text:'「拔剑闯过去再说」', reply:'剑客道：「胆子够，心还粗。先做杂役。」' },
        { key:'reject', text:'「抓个路人替我探路」', reply:'剑客冷笑：「青城剑不教这种手段。」' }
    ]},
    '天龙教': { speaker:'黑袍教众', color:'red', question:'「教中同伴负伤，追兵将至，你怎么选？」', options:[
        { key:'preferred', text:'「能带走就一起带走，不能就断后」', reply:'黑袍人盯你片刻：「至少不是只顾自己。进外坛吧。」' },
        { key:'tolerated', text:'「先保住任务，再回来收拾残局」', reply:'黑袍人哼了一声：「够冷静。先做杂役听令。」' },
        { key:'reject', text:'「把伤者丢给追兵拖时间」', reply:'黑袍人冷笑：「连自己人都卖，谁敢收你？」' }
    ]},
    '烈日教': { speaker:'赤袍祭司', color:'orange', question:'「烈日当空，修行最忌什么？」', options:[
        { key:'preferred', text:'「畏火却逞强，烧坏根基」', reply:'祭司点头：「知道敬畏火，才配驭火。入外坛。」' },
        { key:'tolerated', text:'「怕苦怕热」', reply:'祭司道：「话糙理不糙。先做杂役晒够三旬。」' },
        { key:'reject', text:'「火越大越好，烧死谁算谁倒霉」', reply:'祭司沉下脸：「疯火不是圣火。滚。」' }
    ]},
    '血手门': { speaker:'血衣守卫', color:'red', question:'「血手门练的是狠功，但出手前最该看什么？」', options:[
        { key:'preferred', text:'「看清敌我与退路，再下狠手」', reply:'守卫咧嘴：「狠而不蠢。可入外门。」' },
        { key:'tolerated', text:'「先看对方强不强」', reply:'守卫道：「至少知道惜命。先做杂役。」' },
        { key:'reject', text:'「见血就兴奋，哪管是谁」', reply:'守卫反而后退半步：「疯狗不算门人。滚。」' }
    ]},
    '飞蝎坞': { speaker:'蒙面女子', color:'purple', question:'「毒针藏在袖里，什么时候最该出手？」', options:[
        { key:'preferred', text:'「敌人露出破绽、非出手不可时」', reply:'女子点头：「藏得住，才叫暗器。可入外门。」' },
        { key:'tolerated', text:'「先下手为强」', reply:'女子道：「太急。先做杂役学藏锋。」' },
        { key:'reject', text:'「拿同门试毒最方便」', reply:'女子袖口一抖：「你敢进来，先被试毒的就是你。走。」' }
    ]}
};

function hasSectGuardTrial(sectId) {
    return FULL_GUARD_TRIAL_SECTS.indexOf(sectId) >= 0 || !!SECT_LIGHT_ENTRY_QUESTIONS[sectId];
}

var _guardTrialSectId = null;

function showSectGuardTrial(sectId) {
    _guardTrialSectId = sectId;
    var player = window.currentCharData || {};
    var sect = window.sectsData?.[sectId] || {};
    var html = '';
    
    if (sectId === '金刚宗') {
        html += '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-orange-500">';
        html += '<p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p>';
        html += '<p class="text-sm text-gray-200 italic">一个赤膊僧人正在练拳，放下拳头打量你。</p>';
        html += '<p class="text-sm text-orange-300 mt-2 italic">「想入金刚宗？先举起这尊石锁。」</p></div>';
        html += '<div class="mt-3 space-y-2">';
        html += '<button onclick="jinGangLift()" class="w-full bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded text-sm">「好，我试试」</button>';
        html += '<button onclick="jinGangLiftFail()" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">「这也太轻了」</button></div></div>';
    } else if (sectId === '铸剑山庄') {
        html += '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-red-500">';
        html += '<p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p>';
        html += '<p class="text-sm text-gray-200 italic">一个铁匠正抡锤打铁，火星四溅。</p>';
        html += '<p class="text-sm text-red-300 mt-2 italic">「来铸剑山庄？先打块铁看看手艺。」</p></div>';
        html += '<div class="mt-3 space-y-2">';
        html += '<button onclick="zhuJianForge()" class="w-full bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded text-sm">「好，我试试」</button>';
        html += '<button onclick="zhuJianForgeFail()" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">「我擅长的是铸剑」</button></div></div>';
    } else if (sectId === '蓬莱派') {
        html += '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-blue-500">';
        html += '<p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p>';
        html += '<p class="text-sm text-gray-200 italic">你来到蓬莱仙岛，海雾缭绕，一个白衣守卫站在岸边。</p>';
        html += '<p class="text-sm text-blue-300 mt-2 italic">「来者何人？引水入镜，让我看看你的灵根。」</p></div>';
        html += '<div class="mt-3 space-y-2">';
        html += '<button onclick="pengLaiTest()" class="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm">「好，我测」</button>';
        html += '<button onclick="pengLaiTestFail()" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">「我不用测」</button></div></div>';
    } else if (sectId === '天山派') {
        html += '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-cyan-500">';
        html += '<p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p>';
        html += '<p class="text-sm text-gray-200 italic">你登上天山，寒风刺骨，一个蓝衣女守卫站在雪中。</p>';
        html += '<p class="text-sm text-cyan-300 mt-2 italic">「天山派，非有缘者不得入。让我看看你的冰灵根。」</p></div>';
        html += '<div class="mt-3 space-y-2">';
        html += '<button onclick="tianShanTest()" class="w-full bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded text-sm">「好，你看」</button>';
        html += '<button onclick="tianShanTestFail()" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">「不必了」</button></div></div>';
    } else if (sectId === '少林寺') {
        html += '<div class="space-y-4">';
        html += '<div class="bg-gray-800/60 p-3 rounded border-l-4 border-yellow-500">';
        html += '<p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p>';
        html += '<p class="text-sm text-gray-200 italic">一个武僧双手合十，拦住了你的去路。</p>';
        html += '<p class="text-sm text-yellow-300 mt-2 italic">「施主，入我少林需过两关。先接我三招，不退即为过关。」</p>';
        html += '</div>';
        html += '<div class="mt-3 space-y-2">';
        html += '<button onclick="shaoLinFight()" class="w-full bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded text-sm">「请赐教」</button>';
        html += '<button onclick="shaoLinFail()" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">「我认输」</button>';
        html += '</div></div>';
    } else if (sectId === '武当派') {
        html += '<div class="space-y-4">';
        html += '<div class="bg-gray-800/60 p-3 rounded border-l-4 border-blue-500">';
        html += '<p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p>';
        html += '<p class="text-sm text-gray-200 italic">一个道童正在扫地，见你来了，放下扫帚。</p>';
        html += '<p class="text-sm text-blue-300 mt-2 italic">「道友可是来入门的？先答我两个问题。」</p>';
        html += '<p class="text-sm text-blue-300 italic">「武当以柔克刚，你觉得什么最柔？」</p>';
        html += '</div>';
        html += '<div class="mt-3 space-y-2">';
        html += '<button onclick="wuDangQ1(\'water\')" class="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm">「水」</button>';
        html += '<button onclick="wuDangQ1(\'wind\')" class="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm">「风」</button>';
        html += '<button onclick="wuDangQ1(\'heart\')" class="w-full bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded text-sm">「人心」</button>';
        html += '<button onclick="wuDangQ1(\'dunno\')" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">「不知道」</button>';
        html += '</div></div>';
    } else if (sectId === '太虚剑宗') {
        html += '<div class="space-y-4">';
        html += '<div class="bg-gray-800/60 p-3 rounded border-l-4 border-purple-500">';
        html += '<p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p>';
        html += '<p class="text-sm text-gray-200 italic">一个背剑弟子拦住了你的去路，手按剑柄。</p>';
        html += '<p class="text-sm text-purple-300 mt-2 italic">「想入太虚剑宗？先接我一剑，不退即过。」</p>';
        html += '</div>';
        html += '<div class="mt-3 space-y-2">';
        html += '<button onclick="taiXuFight()" class="w-full bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded text-sm">「请」</button>';
        html += '<button onclick="taiXuFail()" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">「我认输」</button>';
        html += '</div></div>';
    } else if (sectId === '丐帮') {
        html += '<div class="space-y-4">';
        html += '<div class="bg-gray-800/60 p-3 rounded border-l-4 border-green-500">';
        html += '<p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p>';
        html += '<p class="text-sm text-gray-200 italic">一个老乞丐躺在路中间，伸出破碗。</p>';
        html += '<p class="text-sm text-green-300 mt-2 italic">「想入丐帮？先给口饭吃。」</p>';
        html += '</div>';
        html += '<div class="mt-3 space-y-2">';
        html += '<button onclick="gaiBangGive()" class="w-full bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm">给钱（10灵石）</button>';
        html += '<button onclick="gaiBangGiveFood()" class="w-full bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm">给食物</button>';
        html += '<button onclick="gaiBangRefuse()" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">不给</button>';
        html += '</div></div>';
    } else if (sectId === '阎罗殿') {
        html += '<div class="space-y-4">';
        html += '<div class="bg-gray-800/60 p-3 rounded border-l-4 border-red-500">';
        html += '<p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p>';
        html += '<p class="text-sm text-gray-200 italic">一个身穿铁甲的守卫拦住你，目光如刀。</p>';
        html += '<p class="text-sm text-red-300 mt-2 italic">「阎罗殿不是儿戏之地，你可知军法如山？」</p>';
        html += '<p class="text-sm text-red-300 italic">「站好，不许动。我让你动你才能动。」</p>';
        html += '</div>';
        html += '<div class="mt-3 space-y-2">';
        html += '<button onclick="yanLuoDiscipline()" class="w-full bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded text-sm">站着不动</button>';
        html += '<button onclick="yanLuoFail()" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">「好了没？」</button>';
        html += '</div></div>';
    } else if (sectId === '大旗门') {
        html += '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-red-500">';
        html += '<p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p>';
        html += '<p class="text-sm text-gray-200 italic">一个军士模样的守卫站在营门前，身板笔直。</p>';
        html += '<p class="text-sm text-red-300 mt-2 italic">「大旗门以军法治派，令行禁止。先站一炷香，不许动。」</p></div>';
        html += '<div class="mt-3 space-y-2">';
        html += '<button onclick="daQiMenStand()" class="w-full bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded text-sm">站着不动</button>';
        html += '<button onclick="daQiMenStand()" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">「这也太简单了」</button></div></div>';
    } else if (sectId === '侠隐阁') {
        html += '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-blue-500">';
        html += '<p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p>';
        html += '<p class="text-sm text-gray-200 italic">一个麻衣年轻人靠在门边，双手抱胸。</p>';
        html += '<p class="text-sm text-blue-300 mt-2 italic">「想入侠隐阁？先说说，你觉得什么是侠？」</p></div>';
        html += '<div class="mt-3 space-y-2">';
        html += '<button onclick="xiaYiGeQ1(\'help\')" class="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm">「路见不平，拔刀相助」</button>';
        html += '<button onclick="xiaYiGeQ1(\'country\')" class="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm">「为国为民，侠之大者」</button>';
        html += '<button onclick="xiaYiGeQ1(\'free\')" class="w-full bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded text-sm">「随心所欲，快意恩仇」</button>';
        html += '<button onclick="xiaYiGeQ1(\'dunno\')" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">「不知道」</button></div></div>';
    } else if (sectId === '天涯海阁') {
        html += '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-indigo-500">';
        html += '<p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p>';
        html += '<p class="text-sm text-gray-200 italic">一个书生打扮的年轻人正在吟诗。</p>';
        html += '<p class="text-sm text-indigo-300 mt-2 italic">「海内存知己，下一句？」</p></div>';
        html += '<div class="mt-3 space-y-2">';
        html += '<button onclick="tianYaQ1(\'right\')" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-sm">「天涯若比邻」</button>';
        html += '<button onclick="tianYaQ1(\'close\')" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-sm">「万里尚为邻」</button>';
        html += '<button onclick="tianYaQ1(\'fail\')" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">「对不出来」</button></div></div>';
    } else if (sectId === '神机门') {
        html += '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-teal-500">';
        html += '<p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p>';
        html += '<p class="text-sm text-gray-200 italic">一个弟子正在捣鼓一个机关匣子。</p>';
        html += '<p class="text-sm text-teal-300 mt-2 italic">「会解机关吗？这个匣子，你试试打开。」</p></div>';
        html += '<div class="mt-3 space-y-2">';
        html += '<button onclick="shenJiQ1(\'try\')" class="w-full bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded text-sm">「我试试」</button>';
        html += '<button onclick="shenJiQ1(\'good\')" class="w-full bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded text-sm">「我擅长机关术」</button></div></div>';
    } else if (sectId === '霹雳堂') {
        html += '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-orange-500">';
        html += '<p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p>';
        html += '<p class="text-sm text-gray-200 italic">一个壮汉正在调试火药，身边放着几个铁管。</p>';
        html += '<p class="text-sm text-orange-300 mt-2 italic">「霹雳堂玩的是火药，怕不怕爆炸？」</p></div>';
        html += '<div class="mt-3 space-y-2">';
        html += '<button onclick="piLiQ1(\'brave\')" class="w-full bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded text-sm">「不怕，干大事哪能畏首畏尾」</button>';
        html += '<button onclick="piLiQ1(\'scared\')" class="w-full bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded text-sm">「有点怕，但我想学」</button>';
        html += '<button onclick="piLiQ1(\'coward\')" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">「怕」</button></div></div>';
    } else if (sectId === '峨眉派') {
        html += '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-pink-500">';
        html += '<p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p>';
        html += '<p class="text-sm text-gray-200 italic">一个青衣女尼站在山门前，手持拂尘，目光平和。</p>';
        html += '<p class="text-sm text-pink-300 mt-2 italic">「峨眉山中有猴，你方才上山时，可曾注意到什么？」</p></div>';
        html += '<div class="mt-3 space-y-2">';
        html += '<button onclick="eMeiQ1(\'nit\')" class="w-full bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded text-sm">「有只老猴在给幼猴捉虱子」</button>';
        html += '<button onclick="eMeiQ1(\'fruit\')" class="w-full bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded text-sm">「几只猴子在抢果子」</button>';
        html += '<button onclick="eMeiQ1(\'nothing\')" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">「没注意」</button>';
        html += '<button onclick="eMeiQ1(\'fight\')" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">「猴子在打架」</button></div></div>';
    } else if (sectId === '五仙教') {
        html += '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-green-500">';
        html += '<p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p>';
        html += '<p class="text-sm text-gray-200 italic">一个身着彩衣的少女正在逗弄一只五彩斑斓的虫子。</p>';
        html += '<p class="text-sm text-green-300 mt-2 italic">「入五仙教，先得不怕虫子。你怕吗？」</p></div>';
        html += '<div class="mt-3 space-y-2">';
        html += '<button onclick="wuXianQ1(\'holy\')" class="w-full bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm">「不怕，蛊术是圣术」</button>';
        html += '<button onclick="wuXianQ1(\'ok\')" class="w-full bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm">「有点发毛，但能接受」</button>';
        html += '<button onclick="wuXianQ1(\'disgust\')" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">「恶心，拿开」</button></div></div>';
    } else if (sectId === '唐门') {
        html += '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-purple-500">';
        html += '<p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p>';
        html += '<p class="text-sm text-gray-200 italic">一个黑衣人坐在树上，手里把玩着一枚飞镖。</p>';
        html += '<p class="text-sm text-purple-300 mt-2 italic">「能接住我的飞镖，就让你进门。」</p></div>';
        html += '<div class="mt-3 space-y-2">';
        html += '<button onclick="tangMenQ1(\'try\')" class="w-full bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded text-sm">「我试试」</button>';
        html += '<button onclick="tangMenQ1(\'good\')" class="w-full bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded text-sm">「我擅长暗器」</button></div></div>';
    } else if (sectId === '逍遥派') {
        html += '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-cyan-500">';
        html += '<p class="text-xs text-gray-400 mb-1">🏔️ 逍遥派</p>';
        html += '<p class="text-sm text-gray-200 italic">山门前空无一人，只有一块石碑刻着「来者自便，去者不留」。</p>';
        html += '<p class="text-sm text-cyan-300 mt-2 italic">树上传来一个懒洋洋的声音：「哦？有人来了。你想入逍遥派？」</p></div>';
        html += '<div class="mt-3 space-y-2">';
        html += '<button onclick="xiaoYaoQ1(\'join\')" class="w-full bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded text-sm">「是的，请前辈收留」</button>';
        html += '<button onclick="xiaoYaoQ1(\'pass\')" class="w-full bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded text-sm">「不，我只是路过」</button>';
        html += '<button onclick="xiaoYaoQ1(\'dunno\')" class="w-full bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded text-sm">「逍遥派？没听说过」</button></div></div>';
    } else if (sectId === '药王谷') {
        // v20.47：门槛不再是一行"医术达标"的红字，而是药童当场认草——
        // 认对入谷（医术扎实进内门，不懂医理先做杂役），认错才有回话。
        html += '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-green-500">';
        html += '<p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p>';
        html += '<p class="text-sm text-gray-200 italic">一个背着药篓的药童拦住你。他从篓里取出三株草，一字排开，拍了拍手上的泥。</p>';
        html += '<p class="text-sm text-green-300 mt-2 italic">「想入药王谷？先认草。这三株里有一株是断肠草——指给我看。」</p></div>';
        html += '<div class="mt-3 space-y-2">';
        html += '<button onclick="yaoWangHerb(\'left\')" class="w-full bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm">「左边这株，叶背带紫纹」</button>';
        html += '<button onclick="yaoWangHerb(\'middle\')" class="w-full bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm">「中间这株，茎断处有白浆」</button>';
        html += '<button onclick="yaoWangHerb(\'right\')" class="w-full bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm">「右边这株，气味辛烈」</button></div></div>';
    } else if (SECT_LIGHT_ENTRY_QUESTIONS[sectId]) {
        html = renderLightSectQuestion(sectId);
    } else {
        // 防御性兜底：未知配置不再打开空白弹窗，退回通用评估。
        showJoinRequirements(sectId);
        return;
    }
    
    if (typeof window.showModal === 'function') {
        window.showModal('📝 ' + sectId + ' · 入门考核', html);
    }
}

function _finishGuardTrialAtRank(rankId, reason) {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    if (typeof window.joinSect === 'function') {
        window.joinSect(_guardTrialSectId, makeEntryEval(rankId, reason));
    }
}

function finishGuardTrialJoin() {
    _finishGuardTrialAtRank(ENTRY_RANK.CHORE, '通过考核，先从杂役做起');
}

function finishGuardTrialAsDisciple() {
    _finishGuardTrialAtRank(ENTRY_RANK.OUTER, '通过考核，录为外门弟子');
}

function finishGuardTrialAsInnerDisciple() {
    _finishGuardTrialAtRank(ENTRY_RANK.INNER, '考核表现出众，录为内门弟子');
}

function renderLightSectQuestion(sectId) {
    var cfg = SECT_LIGHT_ENTRY_QUESTIONS[sectId];
    if (!cfg) return '';
    var html = '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-' + cfg.color + '-500">';
    html += '<p class="text-xs text-gray-400 mb-1">🚶 ' + cfg.speaker + '：</p>';
    html += '<p class="text-sm text-gray-200 italic">' + cfg.question + '</p></div><div class="mt-3 space-y-2">';
    cfg.options.forEach(function(opt) {
        html += '<button onclick="resolveLightSectQuestion(\'' + sectId + '\',\'' + opt.key + '\')" class="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm">' + opt.text + '</button>';
    });
    html += '</div></div>';
    return html;
}

function resolveLightSectQuestion(sectId, key) {
    var cfg = SECT_LIGHT_ENTRY_QUESTIONS[sectId];
    if (!cfg) return false;
    var opt = cfg.options.find(function(x) { return x.key === key; });
    if (!opt) return false;
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });

    var req = checkSectRequirements(sectId);
    if (!req.pass) {
        if (typeof window.showMessage === 'function') window.showMessage('❌ ' + req.msg, 'error');
        return false;
    }
    if (key === 'reject') {
        setTrialResult(TRIAL_RESULT.FAIL);
        if (typeof window.showModal === 'function') {
            window.showModal('❌ ' + sectId + ' · 未通过', '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-red-500"><p class="text-sm text-gray-200 italic">' + opt.reply + '</p></div></div>');
        }
        return false;
    }

    setTrialResult(TRIAL_RESULT.PASS);
    var rankId = key === 'preferred' ? ENTRY_RANK.OUTER : ENTRY_RANK.CHORE;
    var evalResult = makeEntryEval(rankId, opt.reply);
    var rankLabel = rankId === ENTRY_RANK.OUTER ? '外门弟子' : '杂役弟子';
    var html = '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-green-500"><p class="text-sm text-gray-200 italic">' + opt.reply + '</p></div>';
    html += '<p class="text-sm text-green-300">你将以「' + rankLabel + '」身份入门。</p>';
    html += '<div class="flex gap-2 justify-end mt-4"><button onclick="finishLightSectEntry(\'' + sectId + '\',' + rankId + ')" class="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm font-bold">正式入门</button></div></div>';
    window._pendingLightSectEval = { sectId: sectId, evalResult: evalResult };
    if (typeof window.showModal === 'function') window.showModal('🎉 ' + sectId + ' · 入门', html);
    return true;
}

function finishLightSectEntry(sectId, rankId) {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    var pending = window._pendingLightSectEval;
    var evalResult = pending && pending.sectId === sectId ? pending.evalResult : makeEntryEval(rankId, '通过特色问答');
    window._pendingLightSectEval = null;
    if (typeof window.joinSect === 'function') return window.joinSect(sectId, evalResult);
    return false;
}

// === 少林寺 ===
function shaoLinFight() {
    var player = window.currentCharData || {};
    var con = (player.attrs && player.attrs.constitution) || (player.mainAttributes && player.mainAttributes['体质']) || 0;
    var dex = (player.attrs && player.attrs.dexterity) || (player.mainAttributes && player.mainAttributes['灵巧']) || 0;
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    var isStrong = (con + dex) >= 30;
    var html = '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-yellow-500"><p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p>';
    if (isStrong) {
        html += '<p class="text-sm text-gray-200 italic">你扎稳马步，硬接了武僧三掌，纹丝不动。</p><p class="text-sm text-yellow-300 mt-2 italic">武僧点头：「根基扎实，可入内门。」</p>';
        html += '<p class="text-sm text-yellow-300 mt-2 italic">他正色道：「少林戒律森严，可能持戒？」</p></div>';
        html += '<div class="mt-3 space-y-2"><button onclick="shaoLinResolve(true)" class="w-full bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded text-sm">「弟子愿持戒」</button>';
        html += '<button onclick="shaoLinResolve(false)" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">「我尽量」</button></div></div>';
    } else {
        html += '<p class="text-sm text-gray-200 italic">你咬牙硬接了三掌，后退了好几步。</p><p class="text-sm text-yellow-300 mt-2 italic">武僧：「底子尚浅，先做杂役磨砺。」</p>';
        html += '<p class="text-sm text-yellow-300 mt-2 italic">他正色道：「少林戒律森严，可能持戒？」</p></div>';
        html += '<div class="mt-3 space-y-2"><button onclick="shaoLinResolveMisc()" class="w-full bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded text-sm">「弟子愿持戒」</button>';
        html += '<button onclick="shaoLinResolve(false)" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">「我尽量」</button></div></div>';
    }
    if (typeof window.showModal === 'function') window.showModal('📝 少林寺 · 考核', html);
}
function shaoLinFail() {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    var html = '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-red-500"><p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p><p class="text-sm text-gray-200 italic">武僧摇头：「连试都不敢试，如何修禅？」</p></div></div>';
    if (typeof window.showModal === 'function') window.showModal('❌ 少林寺', html);
}
function shaoLinResolve(passed) {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    setTrialResult(passed ? TRIAL_RESULT.PASS : TRIAL_RESULT.FAIL);
    if (passed) {
        var html = '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-green-500"><p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p><p class="text-sm text-gray-200 italic">武僧双手合十：「阿弥陀佛。从今以后你就是少林弟子了。」</p></div><div class="flex gap-2 justify-end mt-4"><button onclick="finishGuardTrialAsInnerDisciple()" class="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded text-sm font-bold">正式入门</button></div></div>';
        if (typeof window.showModal === 'function') window.showModal('🎉 少林寺 · 入门', html);
    } else {
        var html = '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-red-500"><p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p><p class="text-sm text-gray-200 italic">武僧摇头：「少林不收含糊之人。」</p></div></div>';
        if (typeof window.showModal === 'function') window.showModal('❌ 少林寺', html);
    }
}
function shaoLinResolveMisc() {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    var html = '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-green-500"><p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p><p class="text-sm text-gray-200 italic">武僧点头：「有心向佛，先从杂役做起吧。」</p></div><div class="flex gap-2 justify-end mt-4"><button onclick="finishGuardTrialJoin()" class="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded text-sm font-bold">正式入门</button></div></div>';
    if (typeof window.showModal === 'function') window.showModal('📝 少林寺 · 杂役', html);
}

// === 武当派 ===
var wuDangScore = 0;
function wuDangQ1(answer) {
    var scores = { 'water': 1, 'wind': 1, 'heart': 1, 'dunno': 0 };
    wuDangScore = scores[answer] || 0;
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    var responses = { 'water': '道童点头：「上善若水，不错。」', 'wind': '道童微笑：「风无影无形，也算对。」', 'heart': '道童一愣：「……你倒是会想。」', 'dunno': '道童摇头：「那回去想想。」' };
    var html = '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-blue-500"><p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p><p class="text-sm text-gray-200 italic">' + (responses[answer] || '') + '</p><p class="text-sm text-blue-300 mt-2 italic">「第二问：修道之人，最忌什么？」</p></div><div class="mt-3 space-y-2">';
    html += '<button onclick="wuDangQ2(\'restless\')" class="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm">「浮躁」</button>';
    html += '<button onclick="wuDangQ2(\'greed\')" class="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm">「贪欲」</button>';
    html += '<button onclick="wuDangQ2(\'lazy\')" class="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm">「懒惰」</button>';
    html += '<button onclick="wuDangQ2(\'other\')" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">「其他」</button></div></div>';
    if (typeof window.showModal === 'function') window.showModal('📝 武当派 · 第二问', html);
}
function wuDangQ2(answer) {
    var isCorrect = answer === 'restless' || answer === 'greed' || answer === 'lazy';
    wuDangScore += isCorrect ? 1 : 0;
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    if (wuDangScore >= 2) {
        setTrialResult(TRIAL_RESULT.PASS);
        var html = '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-blue-500"><p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p><p class="text-sm text-gray-200 italic">道童点头：「道心通透，可入内门。」</p></div><div class="flex gap-2 justify-end mt-4"><button onclick="finishGuardTrialAsInnerDisciple()" class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-bold">正式入门</button></div></div>';
        if (typeof window.showModal === 'function') window.showModal('🎉 武当派 · 入门', html);
    } else if (wuDangScore === 1) {
        setTrialResult(TRIAL_RESULT.PASS);
        var html = '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-blue-500"><p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p><p class="text-sm text-gray-200 italic">道童：「还算有点悟性，先做杂役慢慢学吧。」</p></div><div class="flex gap-2 justify-end mt-4"><button onclick="finishGuardTrialJoin()" class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-bold">正式入门</button></div></div>';
        if (typeof window.showModal === 'function') window.showModal('📝 武当派 · 杂役', html);
    } else {
        setTrialResult(TRIAL_RESULT.FAIL);
        var html = '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-red-500"><p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p><p class="text-sm text-gray-200 italic">道童摇头：「道心未明，回去好好想想再来。」</p></div></div>';
        if (typeof window.showModal === 'function') window.showModal('❌ 武当派', html);
    }
    wuDangScore = 0;
}

// === 太虚剑宗 ===
function taiXuFight() {
    var player = window.currentCharData || {};
    var dex = (player.attrs && player.attrs.dexterity) || (player.mainAttributes && player.mainAttributes['灵巧']) || 0;
    var sword = (player.combatSkills && player.combatSkills['剑法']) || 0;
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    var isStrong = (dex + sword) >= 30;
    var html = '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-purple-500"><p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p>';
    if (isStrong) {
        html += '<p class="text-sm text-gray-200 italic">你侧身避开剑势，稳稳站住。</p><p class="text-sm text-purple-300 mt-2 italic">弟子收剑：「剑心已备，可入内门。」</p><p class="text-sm text-purple-300 mt-2 italic">「剑道为何？」</p></div>';
        html += '<div class="mt-3 space-y-2"><button onclick="taiXuResolve(true)" class="w-full bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded text-sm">「斩妖除魔」</button>';
        html += '<button onclick="taiXuResolve(true)" class="w-full bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded text-sm">「守护所爱」</button>';
        html += '<button onclick="taiXuResolve(false)" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">「为了变强」</button></div></div>';
    } else {
        html += '<p class="text-sm text-gray-200 italic">你勉强躲过剑势，略显狼狈。</p><p class="text-sm text-purple-300 mt-2 italic">弟子收剑：「剑术尚浅，先从杂役练起。」</p><p class="text-sm text-purple-300 mt-2 italic">「剑道为何？」</p></div>';
        html += '<div class="mt-3 space-y-2"><button onclick="taiXuResolveMisc()" class="w-full bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded text-sm">「斩妖除魔」</button>';
        html += '<button onclick="taiXuResolveMisc()" class="w-full bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded text-sm">「守护所爱」</button>';
        html += '<button onclick="taiXuResolve(false)" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">「为了变强」</button></div></div>';
    }
    if (typeof window.showModal === 'function') window.showModal('📝 太虚剑宗 · 考核', html);
}
function taiXuFail() {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    var html = '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-red-500"><p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p><p class="text-sm text-gray-200 italic">弟子收剑：「剑者，当勇往直前。连剑都不敢拔，不配入我剑宗。」</p></div></div>';
    if (typeof window.showModal === 'function') window.showModal('❌ 太虚剑宗', html);
}
function taiXuResolve(passed) {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    setTrialResult(passed ? TRIAL_RESULT.PASS : TRIAL_RESULT.FAIL);
    if (passed) {
        var html = '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-purple-500"><p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p><p class="text-sm text-gray-200 italic">弟子点头：「剑心已明。从今以后你就是太虚剑宗弟子了。」</p></div><div class="flex gap-2 justify-end mt-4"><button onclick="finishGuardTrialAsInnerDisciple()" class="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded text-sm font-bold">正式入门</button></div></div>';
        if (typeof window.showModal === 'function') window.showModal('🎉 太虚剑宗 · 入门', html);
    } else {
        var html = '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-red-500"><p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p><p class="text-sm text-gray-200 italic">弟子摇头：「剑不是用来逞凶的。你走吧。」</p></div></div>';
        if (typeof window.showModal === 'function') window.showModal('❌ 太虚剑宗', html);
    }
}
function taiXuResolveMisc() {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    var html = '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-purple-500"><p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p><p class="text-sm text-gray-200 italic">弟子点头：「剑心尚可，先做杂役练剑吧。」</p></div><div class="flex gap-2 justify-end mt-4"><button onclick="finishGuardTrialJoin()" class="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded text-sm font-bold">正式入门</button></div></div>';
    if (typeof window.showModal === 'function') window.showModal('📝 太虚剑宗 · 杂役', html);
}

// === 丐帮 ===
function gaiBangGive() {
    var player = window.currentCharData || {};
    var stones = 0; if (typeof window.DataManager !== 'undefined' && window.DataManager.getSpiritStones) stones = window.DataManager.getSpiritStones();
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    if (stones < 10) {
        var html = '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-red-500"><p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p><p class="text-sm text-gray-200 italic">你摸了摸口袋，发现灵石不够。</p><p class="text-sm text-red-300 mt-2 italic">老乞丐嗤笑：「穷鬼还想学人充大方？」</p></div></div>';
        if (typeof window.showModal === 'function') window.showModal('❌ 丐帮', html); return;
    }
    if (window.DataManager && window.DataManager.deductSpiritStones) window.DataManager.deductSpiritStones(10);
    gaiBangGetIn();
}
function gaiBangGiveFood() {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    gaiBangGetIn();
}
function gaiBangRefuse() {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    gaiBangGetIn();
}
function gaiBangGetIn() {
    var html = '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-green-500"><p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p>';
    html += '<p class="text-sm text-gray-200 italic">老乞丐笑着摆摆手：「行了，进去吧。丐帮不问出身，来得都是兄弟！」</p></div>';
    html += '<div class="flex gap-2 justify-end mt-4"><button onclick="finishGuardTrialAsDisciple()" class="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm font-bold">正式入门</button></div></div>';
    if (typeof window.showModal === 'function') window.showModal('🎉 丐帮 · 入门', html);
}

// === 阎罗殿 ===
function yanLuoDiscipline() {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    var html = '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-red-500"><p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p><p class="text-sm text-gray-200 italic">你纹丝不动地站着，等待指令。</p>';
    html += '<p class="text-sm text-red-300 mt-2 italic">守卫眼中闪过一丝赞许：「能听令，不错。」</p>';
    html += '<p class="text-sm text-red-300 mt-2 italic">「阎罗殿弟子，随时可能战死沙场。你怕死吗？」</p></div>';
    html += '<div class="mt-3 space-y-2">';
    html += '<button onclick="yanLuoResolve(true)" class="w-full bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded text-sm">「怕，但更怕懦弱偷生」</button>';
    html += '<button onclick="yanLuoResolve(true)" class="w-full bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded text-sm">「不怕」</button>';
    html += '<button onclick="yanLuoResolve(false)" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">「我怕」</button></div></div>';
    if (typeof window.showModal === 'function') window.showModal('📝 阎罗殿 · 第二关', html);
}
function yanLuoFail() {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    var html = '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-red-500"><p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p><p class="text-sm text-gray-200 italic">守卫皱眉：「连站都站不住，怎么上阵杀敌？」</p></div></div>';
    if (typeof window.showModal === 'function') window.showModal('❌ 阎罗殿', html);
}
function yanLuoResolve(passed) {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    setTrialResult(passed ? TRIAL_RESULT.PASS : TRIAL_RESULT.FAIL);
    if (passed) {
        var html = '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-red-500"><p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p><p class="text-sm text-gray-200 italic">守卫点头：「好，是个战士。从今以后你就是阎罗殿弟子了。」</p></div><div class="flex gap-2 justify-end mt-4"><button onclick="finishGuardTrialAsDisciple()" class="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded text-sm font-bold">正式入门</button></div></div>';
        if (typeof window.showModal === 'function') window.showModal('🎉 阎罗殿 · 入门', html);
    } else {
        var html = '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-red-500"><p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p><p class="text-sm text-gray-200 italic">守卫摇头：「那你不适合阎罗殿。」</p></div></div>';
        if (typeof window.showModal === 'function') window.showModal('❌ 阎罗殿', html);
    }
}

// === 金刚宗 ===
function jinGangLift() {
    var player = window.currentCharData || {};
    var strength = (player.attrs && player.attrs.strength) || (player.mainAttributes && player.mainAttributes['力量']) || 0;
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    if (strength < 30) {
        if (typeof window.showModal === 'function') window.showModal('❌ 金刚宗', '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-red-500"><p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p><p class="text-sm text-gray-200 italic">你咬紧牙关，石锁纹丝不动。</p><p class="text-sm text-red-300 mt-2 italic">「底子太弱，练几年再来。」</p></div></div>');
        return;
    }
    if (typeof window.showModal === 'function') window.showModal('📝 金刚宗 · 第二关', '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-orange-500"><p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p><p class="text-sm text-gray-200 italic">你大喝一声，将石锁稳稳举起。</p><p class="text-sm text-orange-300 mt-2 italic">僧人眼中闪过赞许：「不错，有把力气。」</p><p class="text-sm text-orange-300 mt-2 italic">他正色道：「金刚宗修行极苦，你可能受得住？」</p></div><div class="mt-3 space-y-2"><button onclick="jinGangResolve(true)" class="w-full bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded text-sm">「弟子不怕苦」</button><button onclick="jinGangResolve(false)" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">「我试试看」</button></div></div>');
}
function jinGangLiftFail() {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    var player = window.currentCharData || {};
    var strength = (player.attrs && player.attrs.strength) || (player.mainAttributes && player.mainAttributes['力量']) || 0;
    if (strength < 30) {
        if (typeof window.showModal === 'function') window.showModal('❌ 金刚宗', '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-red-500"><p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p><p class="text-sm text-gray-200 italic">僧人挑眉：「口气不小，你倒是举起来看看。」</p><p class="text-sm text-red-300 mt-2 italic">你试了试，石锁纹丝不动。僧人摇头：「走吧。」</p></div></div>');
        return;
    }
    jinGangLift();
}
function jinGangResolve(passed) {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    setTrialResult(passed ? TRIAL_RESULT.PASS : TRIAL_RESULT.FAIL);
    if (passed) {
        if (typeof window.showModal === 'function') window.showModal('🎉 金刚宗 · 入门', '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-orange-500"><p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p><p class="text-sm text-gray-200 italic">僧人满意点头：「好，从今天起你就是金刚宗弟子了。」</p></div><div class="flex gap-2 justify-end mt-4"><button onclick="finishGuardTrialJoin()" class="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded text-sm font-bold">正式入门</button></div></div>');
    } else {
        if (typeof window.showModal === 'function') window.showModal('❌ 金刚宗', '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-red-500"><p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p><p class="text-sm text-gray-200 italic">僧人摇头：「试试看？金刚宗不收试试看的人。」</p></div></div>');
    }
}

// === 铸剑山庄 ===
function zhuJianForge() {
    var player = window.currentCharData || {};
    var forging = (player.lifeSkills && player.lifeSkills['锻造']) || 0;
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    if (forging < 20) {
        if (typeof window.showModal === 'function') window.showModal('❌ 铸剑山庄', '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-red-500"><p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p><p class="text-sm text-gray-200 italic">你抡起锤子打了几块铁，但火候力道都不够。</p><p class="text-sm text-red-300 mt-2 italic">铁匠皱眉：「这打的什么？回去练练再来。」</p></div></div>');
        return;
    }
    if (typeof window.showModal === 'function') window.showModal('📝 铸剑山庄 · 第二关', '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-red-500"><p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p><p class="text-sm text-gray-200 italic">你熟练地抡锤打铁，锻出一块好铁坯。</p><p class="text-sm text-red-300 mt-2 italic">铁匠：「嗯，有点功底。铸剑山庄的规矩：每一把剑都要对得起自己的良心。你能做到吗？」</p></div><div class="mt-3 space-y-2"><button onclick="zhuJianResolve(true)" class="w-full bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded text-sm">「能，剑乃君子之器」</button><button onclick="zhuJianResolve(false)" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">「看情况」</button></div></div>');
}
function zhuJianForgeFail() {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    var player = window.currentCharData || {};
    var forging = (player.lifeSkills && player.lifeSkills['锻造']) || 0;
    if (forging < 20) {
        if (typeof window.showModal === 'function') window.showModal('❌ 铸剑山庄', '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-red-500"><p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p><p class="text-sm text-gray-200 italic">铁匠挑眉：「口气不小，先打块铁看看。」</p><p class="text-sm text-red-300 mt-2 italic">你打了几块铁，火候力道都不够。铁匠摇头：「走吧。」</p></div></div>');
        return;
    }
    zhuJianForge();
}
function zhuJianResolve(passed) {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    setTrialResult(passed ? TRIAL_RESULT.PASS : TRIAL_RESULT.FAIL);
    if (passed) {
        if (typeof window.showModal === 'function') window.showModal('🎉 铸剑山庄 · 入门', '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-red-500"><p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p><p class="text-sm text-gray-200 italic">铁匠点头：「好，从今以后你就是铸剑山庄的弟子了。」</p></div><div class="flex gap-2 justify-end mt-4"><button onclick="finishGuardTrialJoin()" class="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded text-sm font-bold">正式入门</button></div></div>');
    } else {
        if (typeof window.showModal === 'function') window.showModal('❌ 铸剑山庄', '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-red-500"><p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p><p class="text-sm text-gray-200 italic">铁匠摇头：「铸剑不是儿戏，你走吧。」</p></div></div>');
    }
}

// === 蓬莱派 ===
function pengLaiTest() {
    var player = window.currentCharData || {};
    var roots = player.spiritualRoots || {};
    var waterRoot = roots.water || 0;
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    if (waterRoot < 20) {
        if (typeof window.showModal === 'function') window.showModal('❌ 蓬莱派', '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-red-500"><p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p><p class="text-sm text-gray-200 italic">你将真气注入水镜，镜面毫无反应。</p><p class="text-sm text-red-300 mt-2 italic">白衣守卫摇头：「灵根不合，请回吧。」</p></div></div>');
        return;
    }
    if (typeof window.showModal === 'function') window.showModal('📝 蓬莱派 · 第二关', '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-blue-500"><p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p><p class="text-sm text-gray-200 italic">你将真气注入水镜，镜面泛起幽幽蓝光。</p><p class="text-sm text-blue-300 mt-2 italic">白衣守卫点头：「确实是水灵根。你为何修仙？」</p></div><div class="mt-3 space-y-2"><button onclick="pengLaiResolve(true)" class="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm">「求长生之道」</button><button onclick="pengLaiResolve(true)" class="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm">「想保护重要的人」</button><button onclick="pengLaiResolve(false)" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">「为了变强」</button></div></div>');
}
function pengLaiTestFail() {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    var player = window.currentCharData || {};
    var roots = player.spiritualRoots || {};
    var waterRoot = roots.water || 0;
    if (waterRoot < 20) {
        if (typeof window.showModal === 'function') window.showModal('❌ 蓬莱派', '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-red-500"><p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p><p class="text-sm text-gray-200 italic">白衣守卫皱眉：「蓬莱派不收自大之人。」</p></div></div>');
        return;
    }
    pengLaiTest();
}
function pengLaiResolve(passed) {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    setTrialResult(passed ? TRIAL_RESULT.PASS : TRIAL_RESULT.FAIL);
    if (passed) {
        if (typeof window.showModal === 'function') window.showModal('🎉 蓬莱派 · 入门', '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-blue-500"><p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p><p class="text-sm text-gray-200 italic">白衣守卫微笑：「心性不错，从今以后你就是蓬莱派弟子了。」</p></div><div class="flex gap-2 justify-end mt-4"><button onclick="finishGuardTrialJoin()" class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-bold">正式入门</button></div></div>');
    } else {
        if (typeof window.showModal === 'function') window.showModal('❌ 蓬莱派', '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-red-500"><p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p><p class="text-sm text-gray-200 italic">白衣守卫摇头：「水虽柔却能穿石，但只为变强而来，蓬莱不适合你。」</p></div></div>');
    }
}

// === 天山派 ===
function tianShanTest() {
    var player = window.currentCharData || {};
    var roots = player.spiritualRoots || {};
    var mutated = player.mutatedRoots || {};
    var waterRoot = roots.water || 0;
    var iceRoot = !!mutated.ice;
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    if (waterRoot < 20 || !iceRoot) {
        if (typeof window.showModal === 'function') window.showModal('❌ 天山派', '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-red-500"><p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p><p class="text-sm text-gray-200 italic">你催动真气，掌心只凝结出几滴露珠。</p><p class="text-sm text-red-300 mt-2 italic">女守卫淡淡道：「灵根不合。」</p></div></div>');
        return;
    }
    if (typeof window.showModal === 'function') window.showModal('📝 天山派 · 第二关', '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-cyan-500"><p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p><p class="text-sm text-gray-200 italic">你催动真气，掌心凝结出一朵冰花，在雪光中晶莹剔透。</p><p class="text-sm text-cyan-300 mt-2 italic">女守卫：「嗯，可以。天山派弟子常年与冰雪为伴，孤独清冷。你耐得住吗？」</p></div><div class="mt-3 space-y-2"><button onclick="tianShanResolve(true)" class="w-full bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded text-sm">「我心如冰雪，清净自在」</button><button onclick="tianShanResolve(true)" class="w-full bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded text-sm">「有师姐妹相伴，何来孤独」</button><button onclick="tianShanResolve(false)" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">「我耐不住，但我可以学」</button></div></div>');
}
function tianShanTestFail() {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    var player = window.currentCharData || {};
    var roots = player.spiritualRoots || {};
    var mutated = player.mutatedRoots || {};
    var waterRoot = roots.water || 0;
    var iceRoot = !!mutated.ice;
    if (waterRoot < 20 || !iceRoot) {
        if (typeof window.showModal === 'function') window.showModal('❌ 天山派', '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-red-500"><p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p><p class="text-sm text-gray-200 italic">女守卫神色更冷了几分：「既无诚意，何必来此。」</p></div></div>');
        return;
    }
    tianShanTest();
}
function tianShanResolve(passed) {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    setTrialResult(passed ? TRIAL_RESULT.PASS : TRIAL_RESULT.FAIL);
    if (passed) {
        if (typeof window.showModal === 'function') window.showModal('🎉 天山派 · 入门', '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-cyan-500"><p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p><p class="text-sm text-gray-200 italic">女守卫回头看了你一眼：「……你跟我来。」</p></div><div class="flex gap-2 justify-end mt-4"><button onclick="finishGuardTrialJoin()" class="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded text-sm font-bold">正式入门</button></div></div>');
    } else {
        if (typeof window.showModal === 'function') window.showModal('❌ 天山派', '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-red-500"><p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p><p class="text-sm text-gray-200 italic">女守卫：「天山派不教"学"，只收"本是"之人。你走吧。」</p></div></div>');
    }
}

// === 药王谷 ===
function yaoWangHerb(answer) {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    var player = window.currentCharData || {};
    var medicine = (player.lifeSkills && player.lifeSkills['医术']) || (player.medicine) || 0;
    var trialResult = (answer === 'middle') ? TRIAL_RESULT.PASS : TRIAL_RESULT.FAIL;
    setTrialResult(trialResult);
    var passed = (trialResult === TRIAL_RESULT.PASS);
    
    if (passed) {
        // 答对
        if (medicine >= 20) {
            if (typeof window.showModal === 'function') window.showModal('🎉 药王谷 · 入门', '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-green-500"><p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p><p class="text-sm text-gray-200 italic">药童点头：「不错，是断肠草。医术也扎实，可入内门。」</p></div><div class="flex gap-2 justify-end mt-4"><button onclick="finishGuardTrialAsInnerDisciple()" class="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm font-bold">正式入门</button></div></div>');
        } else {
            if (typeof window.showModal === 'function') window.showModal('📝 药王谷 · 入门', '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-green-500"><p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p><p class="text-sm text-gray-200 italic">药童点头：「认得毒草却不懂医理，先做杂役学吧。」</p></div><div class="flex gap-2 justify-end mt-4"><button onclick="finishGuardTrialJoin()" class="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm font-bold">接受</button></div></div>');
        }
    } else {
        if (typeof window.showModal === 'function') window.showModal('❌ 药王谷', '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-red-500"><p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p><p class="text-sm text-gray-200 italic">药童摇头：「错了，回去多看看医书。」</p></div></div>');
    }
}


// === 大旗门 ===
function daQiMenStand() {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    var player = window.currentCharData || {};
    var longWeapon = (player.combatSkills && (player.combatSkills['长兵'] || player.combatSkills['枪法'] || player.combatSkills['棍法'])) || 0;
    var html = '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-red-500"><p class="text-xs text-gray-400 mb-1">🚩 大旗门军士：</p><p class="text-sm text-gray-200 italic">一炷香烧尽，你始终站在原地。军士绕你一圈，终于点头。</p><p class="text-sm text-red-300 mt-2 italic">「军纪这一关算过。大旗门弟子使长兵，你会什么兵器？」</p></div><div class="mt-3 space-y-2">';
    if (longWeapon >= 20) html += '<button onclick="daQiMenResolve(\'skilled\')" class="w-full bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded text-sm">「我练过长兵，愿请校尉验看」</button>';
    html += '<button onclick="daQiMenResolve(\'learn\')" class="w-full bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded text-sm">「不会，但我愿从头学」</button>';
    html += '<button onclick="daQiMenResolve(\'other\')" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">「我只会别的兵器」</button></div></div>';
    if (typeof window.showModal === 'function') window.showModal('📝 大旗门 · 长兵试', html);
}
function daQiMenResolve(answer) {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    setTrialResult(TRIAL_RESULT.PASS);
    var rankId = answer === 'skilled' ? ENTRY_RANK.INNER : (answer === 'other' ? ENTRY_RANK.OUTER : ENTRY_RANK.CHORE);
    var text = answer === 'skilled' ? '校尉验过你的架势：「长兵根底够，直接入内门操练。」' : (answer === 'other' ? '军士道：「兵器路数不同，但身手可用，先列外门。」' : '军士点头：「肯从头学就行，先从杂役跟队列操练。」');
    _showRankedTrialFinish('大旗门', text, rankId, 'red');
}

// === 侠隐阁 ===
function xiaYiGeQ1(answer) {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    if (answer === 'dunno') { setTrialResult(TRIAL_RESULT.FAIL); _showTrialReject('侠隐阁', '麻衣青年摇头：「连自己为何学武都没想过，先去江湖里走走吧。」'); return; }
    var response = answer === 'country' ? '青年肃然抱拳：「这句话分量不轻。」' : (answer === 'help' ? '青年点头：「至少心里装着别人。」' : '青年挑眉：「快意恩仇也得分清恩仇。」');
    var html = '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-blue-500"><p class="text-sm text-gray-200 italic">' + response + '</p><p class="text-sm text-blue-300 mt-2 italic">「若见弱者被恶霸欺辱，你当如何？」</p></div><div class="mt-3 space-y-2"><button onclick="xiaYiGeQ2(\'help\')" class="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm">「出手相助，管定了」</button><button onclick="xiaYiGeQ2(\'watch\')" class="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm">「先看清情况再动手」</button><button onclick="xiaYiGeQ2(\'report\')" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">「报官解决」</button></div></div>';
    if (typeof window.showModal === 'function') window.showModal('📝 侠隐阁 · 第二问', html);
}
function xiaYiGeQ2(answer) {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    if (answer === 'report') { setTrialResult(TRIAL_RESULT.FAIL); _showTrialReject('侠隐阁', '青年摇头：「能报官当然好，可江湖人总有官差赶不到的时候。」'); return; }
    setTrialResult(TRIAL_RESULT.PASS);
    if (answer === 'help') _showRankedTrialFinish('侠隐阁', '青年一拍你肩：「这才像侠隐阁的人。入外门吧。」', ENTRY_RANK.OUTER, 'blue');
    else _showRankedTrialFinish('侠隐阁', '青年点头：「谨慎不是坏事，先从杂役跟着前辈们走几趟江湖。」', ENTRY_RANK.CHORE, 'blue');
}

// === 天涯海阁 ===
function tianYaQ1(answer) {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    if (answer === 'fail') { setTrialResult(TRIAL_RESULT.PASS); _showRankedTrialFinish('天涯海阁', '书生笑道：「诗都接不上，先去书楼做杂役，多读几年书。」', ENTRY_RANK.CHORE, 'indigo'); return; }
    var html = '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-indigo-500"><p class="text-sm text-gray-200 italic">书生击掌：「句子接得上。再问一句——诗词文章为何而作？」</p></div><div class="mt-3 space-y-2"><button onclick="tianYaQ2(\'world\')" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-sm">「为天地立心」</button><button onclick="tianYaQ2(\'heart\')" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-sm">「为抒发胸臆」</button><button onclick="tianYaQ2(\'rice\')" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">「为稻粱谋」</button></div></div>';
    if (typeof window.showModal === 'function') window.showModal('📝 天涯海阁 · 论道', html);
}
function tianYaQ2(answer) {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    setTrialResult(TRIAL_RESULT.PASS);
    if (answer === 'rice') _showRankedTrialFinish('天涯海阁', '书生失笑：「倒也诚实。先在书楼做杂役，别把字写错就成。」', ENTRY_RANK.CHORE, 'indigo');
    else _showRankedTrialFinish('天涯海阁', '书生拱手：「有文章心气。请入外门。」', ENTRY_RANK.OUTER, 'indigo');
}

// === 神机门 ===
function shenJiQ1(answer) {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    var player = window.currentCharData || {};
    var knowledge = (player.mainAttributes && (player.mainAttributes['悟性'] || player.mainAttributes['学识'])) || player.knowledge || 0;
    var forging = (player.lifeSkills && player.lifeSkills['锻造']) || 0;
    var capable = knowledge >= 20 || forging >= 20;
    if (!capable) {
        if (answer === 'good') { setTrialResult(TRIAL_RESULT.FAIL); _showTrialReject('神机门', '你摆弄半天，机关匣纹丝不动。弟子挑眉：「不会不可耻，装会才麻烦。」'); }
        else { setTrialResult(TRIAL_RESULT.PASS); _showRankedTrialFinish('神机门', '机关匣没打开。弟子却把它收起：「肯试也肯认不会，先做杂役学拆件。」', ENTRY_RANK.CHORE, 'teal'); }
        return;
    }
    var html = '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-teal-500"><p class="text-sm text-gray-200 italic">你循着机括声找到暗簧，匣盖“咔”地弹开。弟子眼睛一亮：「手不笨。工匠之道为何？」</p></div><div class="mt-3 space-y-2"><button onclick="shenJiQ2(\'people\')" class="w-full bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded text-sm">「造福百姓」</button><button onclick="shenJiQ2(\'truth\')" class="w-full bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded text-sm">「探索天地奥秘」</button><button onclick="shenJiQ2(\'money\')" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">「赚钱最快」</button></div></div>';
    if (typeof window.showModal === 'function') window.showModal('📝 神机门 · 工匠之道', html);
}
function shenJiQ2(answer) {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    if (answer === 'money') { setTrialResult(TRIAL_RESULT.FAIL); _showTrialReject('神机门', '弟子把机关匣抱回怀里：「想发财去商会，别拿机关害人。」'); return; }
    setTrialResult(TRIAL_RESULT.PASS);
    _showRankedTrialFinish('神机门', '弟子笑道：「这才是做机关的心思。入外门吧。」', ENTRY_RANK.OUTER, 'teal');
}

// === 霹雳堂 ===
function piLiQ1(answer) {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    if (answer === 'coward') { setTrialResult(TRIAL_RESULT.FAIL); _showTrialReject('霹雳堂', '壮汉哈哈一笑：「怕火没事，怕到不敢碰就别进霹雳堂。」'); return; }
    var html = '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-orange-500"><p class="text-sm text-gray-200 italic">壮汉把一撮黑色药末摊在掌心：「有胆还得有脑子。火药里最要紧的引火料，你认哪个？」</p></div><div class="mt-3 space-y-2"><button onclick="piLiQ2(\'nitrate\')" class="w-full bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded text-sm">「硝石」</button><button onclick="piLiQ2(\'sulfur\')" class="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm">「硫磺」</button><button onclick="piLiQ2(\'charcoal\')" class="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm">「木炭」</button></div></div>';
    if (typeof window.showModal === 'function') window.showModal('📝 霹雳堂 · 火器试', html);
}
function piLiQ2(answer) {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    var player = window.currentCharData || {};
    var knowledge = (player.mainAttributes && (player.mainAttributes['悟性'] || player.mainAttributes['学识'])) || player.knowledge || 0;
    var expert = knowledge >= 15 || answer === 'nitrate';
    setTrialResult(TRIAL_RESULT.PASS);
    if (expert) _showRankedTrialFinish('霹雳堂', '壮汉拍掌大笑：「识货！胆识和脑子都有，直接入内门火器房。」', ENTRY_RANK.INNER, 'orange');
    else _showRankedTrialFinish('霹雳堂', '壮汉摇摇头又笑：「认错了也没炸。先做杂役，从配药学起。」', ENTRY_RANK.CHORE, 'orange');
}

// === 峨眉派 ===
function eMeiQ1(answer) {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    if (answer === 'nothing' || answer === 'fight') { setTrialResult(TRIAL_RESULT.FAIL); _showTrialReject('峨眉派', answer === 'nothing' ? '女尼轻叹：「一路只顾赶路，心不在眼前。改日再来吧。」' : '女尼摇头：「山中有争也有亲，你眼里若只见争斗，暂不适合留下。」'); return; }
    var html = '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-pink-500"><p class="text-sm text-gray-200 italic">女尼微微颔首：「你看见了。那你说，它捉虱子时，可曾想过为什么要捉？」</p></div><div class="mt-3 space-y-2"><button onclick="eMeiQ2(\'harmony\')" class="w-full bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded text-sm">「为了族群和睦」</button><button onclick="eMeiQ2(\'instinct\')" class="w-full bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded text-sm">「本能而已，不妄加深意」</button><button onclick="eMeiQ2(\'survive\')" class="w-full bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded text-sm">「为了生存」</button></div></div>';
    if (typeof window.showModal === 'function') window.showModal('📝 峨眉派 · 悟性', html);
}
function eMeiQ2(answer) {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    setTrialResult(TRIAL_RESULT.PASS);
    var text = answer === 'instinct' ? '女尼眼中露出笑意：「不妄加揣测，便是慧根。可入外门。」' : (answer === 'harmony' ? '女尼合十：「你心中有善，可入我门。」' : '女尼点头：「倒也实在。留下吧。」');
    _showRankedTrialFinish('峨眉派', text, ENTRY_RANK.OUTER, 'pink');
}

// === 五仙教 ===
function wuXianQ1(answer) {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    if (answer === 'disgust') { setTrialResult(TRIAL_RESULT.FAIL); _showTrialReject('五仙教', '彩衣少女把蛊虫收回袖中，脸也冷了：「怕可以，嫌恶不行。你走吧。」'); return; }
    var html = '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-green-500"><p class="text-sm text-gray-200 italic">少女把五彩蛊托到你面前：「那你说，蛊是什么？」</p></div><div class="mt-3 space-y-2"><button onclick="wuXianQ2(\'symbiosis\')" class="w-full bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm">「蛊是共生」</button><button onclick="wuXianQ2(\'tool\')" class="w-full bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm">「是一种手段」</button><button onclick="wuXianQ2(\'fear\')" class="w-full bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm">「很可怕的东西」</button><button onclick="wuXianQ2(\'heritage\')" class="w-full bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm">「是一种传承」</button><button onclick="wuXianQ2(\'bug\')" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">「不就是虫子吗」</button></div></div>';
    if (typeof window.showModal === 'function') window.showModal('📝 五仙教 · 识蛊', html);
}
function wuXianQ2(answer) {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    if (answer === 'bug') { setTrialResult(TRIAL_RESULT.FAIL); _showTrialReject('五仙教', '少女脸色一沉：「……你出去。」'); return; }
    setTrialResult(TRIAL_RESULT.PASS);
    var lines = { symbiosis:'少女眼睛一亮：「我娘说过一模一样的话。你留下来。」', tool:'少女点头：「这话也对。以后你会明白——蛊不只是手段，它是命。」', fear:'少女笑了：「可怕就对了。可怕的东西，用对地方最安全。」', heritage:'少女歪头：「文绉绉的，不过我们更爱读虫。留下吧。」' };
    _showRankedTrialFinish('五仙教', lines[answer] || '少女点头：「留下吧。」', ENTRY_RANK.OUTER, 'green');
}

// === 唐门 ===
function tangMenQ1(answer) {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    var player = window.currentCharData || {};
    var dex = (player.attrs && player.attrs.dexterity) || (player.mainAttributes && player.mainAttributes['灵巧']) || 0;
    if (dex < 20) {
        if (answer === 'good') { setTrialResult(TRIAL_RESULT.FAIL); _showTrialReject('唐门', '飞镖擦着指尖钉进门柱。黑衣人淡淡道：「不会接没关系，吹牛就不行。」'); }
        else { setTrialResult(TRIAL_RESULT.PASS); _showRankedTrialFinish('唐门', '飞镖从你指间滑落。黑衣人道：「手慢了点。先做杂役，练眼和手。」', ENTRY_RANK.CHORE, 'purple'); }
        return;
    }
    var html = '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-purple-500"><p class="text-sm text-gray-200 italic">你两指一夹，飞镖稳稳停在指间。黑衣人点头：「唐门暗器从不虚发。你何时会用暗器？」</p></div><div class="mt-3 space-y-2"><button onclick="tangMenQ2(\'protect\')" class="w-full bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded text-sm">「保护重要的人时」</button><button onclick="tangMenQ2(\'deserve\')" class="w-full bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded text-sm">「对付该杀之人时」</button><button onclick="tangMenQ2(\'annoy\')" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">「看谁不顺眼就用」</button></div></div>';
    if (typeof window.showModal === 'function') window.showModal('📝 唐门 · 暗器之道', html);
}
function tangMenQ2(answer) {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    if (answer === 'annoy') { setTrialResult(TRIAL_RESULT.FAIL); _showTrialReject('唐门', '黑衣人收起飞镖：「暗器不是拿来耍威风的。你走吧。」'); return; }
    setTrialResult(TRIAL_RESULT.PASS);
    _showRankedTrialFinish('唐门', '黑衣人从树上一跃而下：「手稳，心也不乱。入外门。」', ENTRY_RANK.OUTER, 'purple');
}

function _showTrialReject(sectId, text) {
    if (typeof window.showModal === 'function') window.showModal('❌ ' + sectId, '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-red-500"><p class="text-sm text-gray-200 italic">' + text + '</p></div></div>');
}

function _showRankedTrialFinish(sectId, text, rankId, color) {
    var label = rankId === ENTRY_RANK.INNER ? '内门弟子' : (rankId === ENTRY_RANK.OUTER ? '外门弟子' : '杂役弟子');
    var html = '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-' + (color || 'green') + '-500"><p class="text-sm text-gray-200 italic">' + text + '</p></div><p class="text-sm text-green-300">入门身份：' + label + '</p><div class="flex gap-2 justify-end mt-4"><button onclick="finishGuardTrialAtRank(' + rankId + ')" class="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm font-bold">正式入门</button></div></div>';
    if (typeof window.showModal === 'function') window.showModal('🎉 ' + sectId + ' · 入门', html);
}

function finishGuardTrialAtRank(rankId) {
    _finishGuardTrialAtRank(rankId, '通过门派特色考核');
}

// === 逍遥派 ===
var xiaoYaoScore = 0;
function xiaoYaoQ1(answer) {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    var texts = { 'join': '白衣人躺在树上，懒洋洋地看了你一眼：「无趣。求来的，不逍遥。」', 'pass': '白衣人：「那你还站着干嘛？」', 'dunno': '白衣人大笑：「不知道就来，有意思！」' };
    xiaoYaoScore = (answer === 'dunno') ? 1 : 0;
    var html = '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-cyan-500"><p class="text-xs text-gray-400 mb-1">\u{1f3d4}ufe0f 逍遥派</p><p class="text-sm text-gray-200 italic">' + (texts[answer] || '') + '</p><p class="text-sm text-cyan-300 mt-2 italic">白衣人跳下来，递给你一壶酒：「喝不喝？」</p></div><div class="mt-3 space-y-2">';
    html += '<button onclick="xiaoYaoQ2(\'drink\')" class="w-full bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded text-sm">「喝！」</button>';
    html += '<button onclick="xiaoYaoQ2(\'no\')" class="w-full bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded text-sm">「我不喝酒」</button>';
    html += '<button onclick="xiaoYaoQ2(\'ask\')" class="w-full bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded text-sm">「这是什么酒？」</button></div></div>';
    if (typeof window.showModal === 'function') window.showModal('\u{1f4dd} 逍遥派 · 第二关', html);
}
function xiaoYaoQ2(answer) {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    var texts = { 'drink': '白衣人满意：「能饮者，性情中人。」', 'no': '白衣人：「不喝酒也无妨，心逍遥即可。」', 'ask': '白衣人：「问那么多干嘛，喝就完了。」' };
    var html = '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-cyan-500"><p class="text-xs text-gray-400 mb-1">\u{1f3d4}ufe0f 逍遥派</p><p class="text-sm text-gray-200 italic">' + (texts[answer] || '') + '</p><p class="text-sm text-cyan-300 mt-2 italic">「逍遥派没有规矩，没有门规，想走就走，想来就来。你受得了吗？」</p></div><div class="mt-3 space-y-2">';
    html += '<button onclick="xiaoYaoQ3(\'yes\')" class="w-full bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded text-sm">「正合我意」</button>';
    html += '<button onclick="xiaoYaoQ3(\'no\')" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">「那也太随意了吧」</button>';
    html += '<button onclick="xiaoYaoQ3(\'think\')" class="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">「我考虑一下」</button></div></div>';
    if (typeof window.showModal === 'function') window.showModal('\u{1f4dd} 逍遥派 · 第三关', html);
}
function xiaoYaoQ3(answer) {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    if (answer === 'yes') {
        if (typeof window.showModal === 'function') window.showModal('\u{1f389} 逍遥派 · 入门', '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-cyan-500"><p class="text-xs text-gray-400 mb-1">\u{1f3d4}ufe0f 逍遥派</p><p class="text-sm text-gray-200 italic">白衣人微笑：「好，从今以后你就是逍遥派的人了——不过，你随时可以走。」</p></div><div class="flex gap-2 justify-end mt-4"><button onclick="finishGuardTrialAsDisciple()" class="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded text-sm font-bold">正式入门</button></div></div>');
    } else if (answer === 'no') {
        if (typeof window.showModal === 'function') window.showModal('\u274c 逍遥派', '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-red-500"><p class="text-xs text-gray-400 mb-1">\u{1f3d4}ufe0f 逍遥派</p><p class="text-sm text-gray-200 italic">白衣人：「那你去别的门派吧。」</p></div></div>');
    } else {
        if (typeof window.showModal === 'function') window.showModal('\u{1f4dd} 逍遥派', '<div class="space-y-4"><div class="bg-gray-800/60 p-3 rounded border-l-4 border-cyan-500"><p class="text-xs text-gray-400 mb-1">\u{1f3d4}ufe0f 逍遥派</p><p class="text-sm text-gray-200 italic">白衣人：「想好了再来。」</p></div></div>');
    }
    xiaoYaoScore = 0;
}

// 简化版直接加入（旧版逐句试炼事件已废弃删除）
function tryJoinSect(sectId) {
    document.querySelectorAll('#xianxia-modal-overlay').forEach(function(el) { el.remove(); });
    if (typeof window.joinSect === 'function') {
        var evalResult = evaluateSectEntry(sectId, window.currentCharData || {});
        if (evalResult && evalResult.result === '拒绝') {
            if (typeof window.showMessage === 'function') window.showMessage('❌ ' + evalResult.reason, 'error');
            return false;
        }
        return window.joinSect(sectId, evalResult);
    }
    return false;
}

// ============ 境界档位（兼容字符串/数字/凡人） ============
// 0=凡人，1=炼气…；申请入门不卡境界（joinSect 固定杂役）
// 供升职 P1 与日常事件条件复用
function getRealmTier(realm) {
    var order = ['凡人', '炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'];
    if (realm == null || realm === '') return 0;
    if (typeof realm === 'number') {
        if (realm <= 0) return 0;
        return Math.min(realm, order.length - 1);
    }
    var i = order.indexOf(String(realm));
    if (i >= 0) return i;
    // 未知字符串：偏保守按炼气处理（不影响入门）
    return 1;
}

// ============ 阶段2：基础门槛检查 ============
// 杂役弟子无条件——取消所有属性考核，仅保留特殊门派限制
// 性别/灵根/恶名等限制由特殊门派规则处理
function checkSectRequirements(sectId) {
    var player = window.currentCharData || {};
    var sect = window.sectsData?.[sectId];
    if (!sect) return { pass: false, msg: '门派不存在' };
    
    // 仅保留特殊门派硬性限制（性别、灵根、恶名等）
    if (sectId === '修罗宫' && player.gender !== 'female') return { pass: false, msg: '修罗宫仅限女性弟子' };
    if (sectId === '蓬莱派' && !hasWaterRoot(player)) return { pass: false, msg: '蓬莱派只招收水灵根弟子（需≥20%）' };
    if (sectId === '天山派' && !hasIceRoot(player)) return { pass: false, msg: '天山派只招收含冰变异灵根的弟子' };
    if (sectId === '金刚宗' && (player.mainAttributes?.['体质'] || 0) < 30) return { pass: false, msg: '金刚宗体质要求较高' };
    // v20.47：药王谷不再立"医术达标"的牌子——门槛交给药童认草的考核，
    // 医术高低定职位（内门/杂役），不由一行红字吓人。门禁由测试守住。
    if (sectId === '铸剑山庄' && (player.lifeSkills?.['锻造'] || 0) < 20) return { pass: false, msg: '铸剑山庄要求锻造达标' };
    if (sect.type === '正道' && (player.notoriety || 0) > 30) return { pass: false, msg: '恶名过高，正道门派不会接纳' };
    
    // 杂役无条件：通过基础限制即可入门
    return { pass: true, msg: '符合基础条件，可加入为杂役弟子' };
}

function hasWaterRoot(player) {
    var roots = player.spiritualRoots || {};
    return (roots.water || 0) >= 20;
}

function hasIceRoot(player) {
    var roots = player.spiritualRoots || {};
    var mutated = player.mutatedRoots || {};
    // 水灵根≥20% 且 冰变异灵根存在
    return (roots.water || 0) >= 20 && mutated.ice;
}

// ============ 阵营定义 ============
var ALIGNMENTS = {
    GOOD: 'good',
    NEUTRAL: 'neutral',
    EVIL: 'evil'
};

// 评估玩家当前心性（基于善恶值）
function assessMomentaryAlignment(player) {
    var karma = (player && player.karma) || 0;
    if (karma > 30) return ALIGNMENTS.GOOD;
    if (karma < -30) return ALIGNMENTS.EVIL;
    return ALIGNMENTS.NEUTRAL;
}

// 完整入门评估：名气+心性 → 决定入门身份
function evaluateSectEntry(sectId, player) {
    var sect = window.sectsData?.[sectId];
    if (!sect) return { result: '拒绝', reason: '门派不存在', rank: null };
    
    // 特殊门派处理（优先于通用逻辑）
    // 大隐阁：只收金丹以上
    if (sectId === '大隐阁' && getRealmTier(player.realm) < 4) {
        return { result: '拒绝', reason: '大隐阁只接待金丹以上修士', rank: null };
    }
    // 丐帮：来者不拒，杂役就是入门弟子
    if (sectId === '丐帮') {
        return makeEntryEval(ENTRY_RANK.OUTER, '丐帮不问出身，来得都是兄弟');
    }
    // 天书阁：大善+渡劫
    if (sectId === '天书阁') {
        var karma = (player && player.karma) || 0;
        if (karma < 100) return { result: '拒绝', reason: '天书阁只接纳大善之人', rank: null };
        if (getRealmTier(player.realm) < 9) return { result: '拒绝', reason: '天书阁只收渡劫以上修士', rank: null };
        return { result: '入门弟子', reason: '道友功德圆满，请入阁一观', rank: 2 };
    }
    
    // 修罗宫特殊：修罗女亲自考核，可能直接收为侍妾（取代通用职位）
    if (sectId === '修罗宫') {
        if (player.gender !== 'female') return { result: '拒绝', reason: '修罗宫只收女子', rank: null };
        // 侍妾判定：主角天生丽质，只要女性角色即可成为侍妾
        // 除非恶名昭彰或心性邪恶，才降为杂役
        var karma = player.karma || 0;
        if (karma < -50) {
            // 心性邪恶 → 收留为普通弟子
            return makeEntryEval(ENTRY_RANK.CHORE, '修罗女淡淡道：「留在宫里做事吧。」');
        } else {
            // 主角天生丽质 → 可直接成为侍妾
            return { result: '侍妾', reason: '修罗女注视你良久，眼中闪过一丝惊艳：「……你留下，跟我。」', rank: -1, isConcubine: true };
        }
    }
    
    // 基础门槛检查（性别/灵根等）
    var baseReq = checkSectRequirements(sectId);
    if (!baseReq.pass) {
        return { result: '拒绝', reason: baseReq.msg, rank: null };
    }
    
    // D-13 名声×善恶→门派考核认出（4档名声 + 善恶契合，世界反应式非计数器）
    var fame = (player && player.fame) || 0;
    var karma = (player && player.karma) || 0;
    var alignment = assessMomentaryAlignment(player);
    var sectAlignment = sect.type === '正道' ? ALIGNMENTS.GOOD :
                        sect.type === '邪派' ? ALIGNMENTS.EVIL :
                        ALIGNMENTS.NEUTRAL;
    // 善恶相悖：门派有倾向、玩家倾向相反且非中立
    var _clash = (sectAlignment !== ALIGNMENTS.NEUTRAL &&
                  alignment !== sectAlignment && alignment !== ALIGNMENTS.NEUTRAL);

    // 善恶相悖 + 低名声 → 拒收有叙事文案（不弹"次数用完"，符合现实：考核者不信任你）
    if (_clash && fame < 50) {
        var _clashMsg = sectAlignment === ALIGNMENTS.GOOD
            ? '考核者冷言：「你身上魔气隐现，与本门正道相悖，恕不接待。」'
            : '魔头冷笑：「一身伪善正气，本座看不顺眼，滚。」';
        return { result: '拒绝', reason: _clashMsg, rank: null };
    }

    // 名声 4 档门槛
    if (fame > 90) {
        // 久仰大名：掌门亲迎
        if (!_clash) return makeEntryEval(ENTRY_RANK.INNER, '掌门亲迎：「久仰大名，请入内门！」');
        return makeEntryEval(ENTRY_RANK.OUTER, '掌门审视良久：「声名赫赫，先入外门观察。」');
    }
    if (fame >= 50) {
        // 小有名气：礼遇免考核直入外门
        if (!_clash) return makeEntryEval(ENTRY_RANK.OUTER, '考核者礼遇：「久仰，请入外门。」');
        return makeEntryEval(ENTRY_RANK.CHORE, '道不同，先从杂役做起观察');
    }
    if (fame >= 20) {
        // 略有耳闻：正常考核
        return makeEntryEval(ENTRY_RANK.CHORE, '考核者打量你一番，先从杂役做起考察品性。');
    }
    // 无名之辈：考核者不识，难度+1（杂役+冷淡），名门尤其
    return makeEntryEval(ENTRY_RANK.CHORE, '考核者不识你，冷淡道：「先做杂役，做出名堂再说。」');
}

// ============ 名气系统 ============
// 名气等级定义
var FAME_LEVELS = [
    { id: 0, name: '无名之辈', min: 0,   max: 25,  desc: '门派对你一无所知，只看表面' },
    { id: 1, name: '小有名气', min: 26,  max: 50,  desc: '部分门派听说过你的传闻' },
    { id: 2, name: '名动一方', min: 51,  max: 75,  desc: '大部分门派知道你的倾向' },
    { id: 3, name: '天下皆知', min: 76,  max: 100, desc: '所有人都知道你的立场' }
];

// 获取当前名气等级
function getFameLevel(player) {
    var fame = (player && player.fame) || 0;
    for (var i = FAME_LEVELS.length - 1; i >= 0; i--) {
        if (fame >= FAME_LEVELS[i].min) return FAME_LEVELS[i];
    }
    return FAME_LEVELS[0];
}

// 获取名气等级名称
function getFameName(player) {
    return getFameLevel(player).name;
}

// 增加名气值（通过 currentCharData 持久化到存档）
function addFame(amount) {
    var player = window.currentCharData;
    if (!player) return;
    player.fame = Math.min(100, Math.max(0, (player.fame || 0) + amount));
}

// 名气值获取途径（由外部系统调用）：
// 完成任务: addFame(1~3) 按难度
// 击败敌人: addFame(1) 每场
// 击败BOSS: addFame(5)
// 突破境界: addFame(10)
// 完成主线: addFame(15)
// 行善: addFame(2)
// 做恶: addFame(-3)

// ============ 身份晋升系统 ============
// 通用职位体系已迁移至 sects-deep-data.js（COMMON_RANKS）
// 晋升面板已迁移至 sects-deep-ui.js（showSectRanks/sectPromote）
// 以下仅保留修罗宫侍妾系统（供 join flow 使用）

// 特殊职位：修罗宫侍妾（取代通用职位，独立体系）
var CONCUBINE_FAVOR_LEVELS = [
    { id: 0, name: '冷遇',   min: 0,   max: 19,  desc: '仅保留侍妾名分，无实际特权' },
    { id: 1, name: '寻常',   min: 20,  max: 39,  desc: '可自由进出寝宫，额外灵石俸禄' },
    { id: 2, name: '得宠',   min: 40,  max: 59,  desc: '可调遣低级弟子，获得独门功法指点' },
    { id: 3, name: '宠爱',   min: 60,  max: 79,  desc: '参与内部决策，代宫主传令，获得保命底牌' },
    { id: 4, name: '专宠',   min: 80,  max: 99,  desc: '代管门派事务，修罗女会为你出手' },
    { id: 5, name: '挚爱',   min: 100, max: 100, desc: '共享全部秘密，可查看宫主真名' }
];

// 获取侍妾宠爱等级
function getFavorLevel(favor) {
    favor = favor || 0;
    for (var i = CONCUBINE_FAVOR_LEVELS.length - 1; i >= 0; i--) {
        if (favor >= CONCUBINE_FAVOR_LEVELS[i].min) return CONCUBINE_FAVOR_LEVELS[i];
    }
    return CONCUBINE_FAVOR_LEVELS[0];
}

// 增加宠爱度
function addFavor(amount) {
    var player = window.currentCharData;
    if (!player) return;
    player.concubineFavor = Math.min(100, Math.max(0, (player.concubineFavor || 0) + amount));
}

// 导出
window.sectJoinState = sectJoinState;
window.initSectJoinFlow = initSectJoinFlow;
window.saveSectJoinState = saveSectJoinState;
window.getRealmTier = getRealmTier;
window.checkSectRequirements = checkSectRequirements;
window.startSectJoinFlow = startSectJoinFlow;
window.FAME_LEVELS = FAME_LEVELS;
window.getFameLevel = getFameLevel;
window.getFameName = getFameName;
window.addFame = addFame;
window.ALIGNMENTS = ALIGNMENTS;
window.assessMomentaryAlignment = assessMomentaryAlignment;
window.evaluateSectEntry = evaluateSectEntry;
window.TRIAL_RESULT = TRIAL_RESULT;
window.setTrialResult = setTrialResult;
window.CONCUBINE_FAVOR_LEVELS = CONCUBINE_FAVOR_LEVELS;
window.getFavorLevel = getFavorLevel;
window.addFavor = addFavor;

window.showSectGuardTrial = showSectGuardTrial;
window.finishGuardTrialJoin = finishGuardTrialJoin;
window.finishGuardTrialAsDisciple = finishGuardTrialAsDisciple;
window.finishGuardTrialAsInnerDisciple = finishGuardTrialAsInnerDisciple;
window.finishGuardTrialAtRank = finishGuardTrialAtRank;
window.resolveLightSectQuestion = resolveLightSectQuestion;
window.finishLightSectEntry = finishLightSectEntry;
window.SECT_LIGHT_ENTRY_QUESTIONS = SECT_LIGHT_ENTRY_QUESTIONS;
window.ENTRY_RANK = ENTRY_RANK;
window.jinGangLift = jinGangLift;
window.jinGangLiftFail = jinGangLiftFail;
window.jinGangResolve = jinGangResolve;
window.zhuJianForge = zhuJianForge;
window.zhuJianForgeFail = zhuJianForgeFail;
window.zhuJianResolve = zhuJianResolve;
window.pengLaiTest = pengLaiTest;
window.pengLaiTestFail = pengLaiTestFail;
window.pengLaiResolve = pengLaiResolve;
window.tianShanTest = tianShanTest;
window.tianShanTestFail = tianShanTestFail;
window.tianShanResolve = tianShanResolve;
window.yaoWangHerb = yaoWangHerb;
window.tianshugeAnswer1 = tianshugeAnswer1;
window.tianshugeAnswer2 = tianshugeAnswer2;
window.tianshugeAnswer3 = tianshugeAnswer3;
window.tianshugeAnswer4 = tianshugeAnswer4;
window.finishTianshugeJoin = finishTianshugeJoin;

window.shaoLinFight = shaoLinFight;
window.shaoLinFail = shaoLinFail;
window.shaoLinResolve = shaoLinResolve;
window.shaoLinResolveMisc = shaoLinResolveMisc;
window.wuDangQ1 = wuDangQ1;
window.wuDangQ2 = wuDangQ2;
window.taiXuFight = taiXuFight;
window.taiXuFail = taiXuFail;
window.taiXuResolve = taiXuResolve;
window.taiXuResolveMisc = taiXuResolveMisc;
window.gaiBangGive = gaiBangGive;
window.gaiBangGiveFood = gaiBangGiveFood;
window.gaiBangRefuse = gaiBangRefuse;
window.yanLuoDiscipline = yanLuoDiscipline;
window.yanLuoFail = yanLuoFail;
window.yanLuoResolve = yanLuoResolve;

// v18.7：9门派旧计划函数全部接通，避免 inline onclick 指向未定义函数。
window.daQiMenStand = daQiMenStand;
window.daQiMenResolve = daQiMenResolve;
window.xiaYiGeQ1 = xiaYiGeQ1;
window.xiaYiGeQ2 = xiaYiGeQ2;
window.tianYaQ1 = tianYaQ1;
window.tianYaQ2 = tianYaQ2;
window.shenJiQ1 = shenJiQ1;
window.shenJiQ2 = shenJiQ2;
window.piLiQ1 = piLiQ1;
window.piLiQ2 = piLiQ2;
window.eMeiQ1 = eMeiQ1;
window.eMeiQ2 = eMeiQ2;
window.wuXianQ1 = wuXianQ1;
window.wuXianQ2 = wuXianQ2;
window.tangMenQ1 = tangMenQ1;
window.tangMenQ2 = tangMenQ2;
window.xiaoYaoQ1 = xiaoYaoQ1;
window.xiaoYaoQ2 = xiaoYaoQ2;
window.xiaoYaoQ3 = xiaoYaoQ3;
