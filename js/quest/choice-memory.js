// ==================== choice-memory.js - 选择记忆系统 ====================
// 记录玩家的重要选择，NPC会引用历史选择，累积影响结局
// 依赖：quest-system.js (GAME_ENDINGS, showEndingScreen)
// 加载顺序：在 quest-system.js 之后，app.js 之前

// ============ 选择记录 ============
let playerChoices = {
    history: [],      // 所有选择历史
    stats: {          // 关键抉择统计
        mercy_count: 0,      // 仁慈次数
        ruthless_count: 0,   // 冷酷次数
        helper_count: 0,     // 帮助他人次数
        selfish_count: 0,    // 自私次数
        wisdom_count: 0,     // 明智选择次数
        reckless_count: 0,   // 鲁莽次数
        dao_heart_count: 0,  // 道心坚定次数
        demon_heart_count: 0 // 入魔倾向次数
    }
};

// ============ 重要选择定义 ============
const IMPORTANT_CHOICES = {
    // v25.0《灵气之尽》批一：序幕四场戏 + 长生牌位拍 + 选路（批七：旧终局 main_010~021 死条目已清，main_025 宗门守卫战存活保留）
    'qi_route_oppose': { id: 'qi_route_oppose', questId: 'main_010', description: '在灵气之尽前选择了对抗——不能让她这么干下去', tags: ['decisive'] },
    'qi_route_ignore': { id: 'qi_route_ignore', questId: 'main_010', description: '在灵气之尽前选择了无视——天塌了先砸高个的，你过日子', tags: ['selfish'] },
    'qi_route_follow': { id: 'qi_route_follow', questId: 'main_010', description: '在灵气之尽前选择了追随——想看看她怎么拆这把梯子', tags: ['reckless'] },
    'qi_chen_sit': { id: 'qi_chen_sit', questId: 'main_010', description: '陪卡在金丹三百年的散修陈五久坐了半个时辰', tags: ['mercy'] },
    'qi_chen_stone': { id: 'qi_chen_stone', questId: 'main_010', description: '给路边的陈五久塞了一枚灵石', tags: ['helpful'] },
    'qi_chen_pass': { id: 'qi_chen_pass', questId: 'main_010', description: '从陈五久面前什么也没说地走过去', tags: ['selfish'] },
    'qi_liu_buy': { id: 'qi_liu_buy', questId: 'main_010', description: '买下药农柳四娘一整篓不值钱的枯药', tags: ['helpful'] },
    'qi_liu_move': { id: 'qi_liu_move', questId: 'main_010', description: '帮柳四娘把还活着的苗移进背阴的沟', tags: ['helpful'] },
    'qi_liu_pass': { id: 'qi_liu_pass', questId: 'main_010', description: '从枯死的灵田边路过', tags: ['selfish'] },
    'qi_yu_guard': { id: 'qi_yu_guard', questId: 'main_010', description: '替七霞派守住了阵眼最后小半块灵石', tags: ['helpful', 'loyal'] },
    'qi_yu_pass': { id: 'qi_yu_pass', questId: 'main_010', description: '没有上山——七霞派的大阵当夜灭了', tags: ['selfish'] },
    'qi_zhou_redeem': { id: 'qi_zhou_redeem', questId: 'main_010', description: '花三百灵石从仙师手里赎回了周小满', tags: ['mercy', 'helpful'] },
    'qi_zhou_name': { id: 'qi_zhou_name', questId: 'main_010', description: '把周来福、周小满父子的名字写进了搁浅列', tags: ['wise'] },
    'qi_zhou_pass': { id: 'qi_zhou_pass', questId: 'main_010', description: '从田埂小镇走开——打谷场的血渗进石板缝里', tags: ['selfish'] },
    'qi_tablet_bow': { id: 'qi_tablet_bow', questId: 'main_011', description: '对着她的长生牌位作了个揖', tags: ['wise'] },
    'qi_tablet_pass': { id: 'qi_tablet_pass', questId: 'main_011', description: '从她的长生牌位前沉默走过', tags: [] },
    'qi_motive_life': { id: 'qi_motive_life', questId: 'main_013', description: '回答她「图什么」：为那些被截断的命', tags: ['mercy'] },
    'qi_motive_city': { id: 'qi_motive_city', questId: 'main_013', description: '回答她「图什么」：为账上那些城', tags: ['wise'] },
    'qi_motive_curious': { id: 'qi_motive_curious', questId: 'main_013', description: '回答她「图什么」：为想知道破栏之后她要干什么', tags: ['reckless'] },
    'qi_motive_unclear': { id: 'qi_motive_unclear', questId: 'main_013', description: '回答她「图什么」：说不清', tags: [] },
    // v25.0《灵气之尽》批二：占脉者四仗斩/放、盟帖三选、天秘二选、中幕加信二选
    'qi_boss1_slay': { id: 'qi_boss1_slay', questId: 'main_012', description: '斩了毒谷药主杜无忧——生意做到人头上，就不是生意了', stat: 'ruthless_count', tags: ['ruthless', 'decisive'] },
    'qi_boss1_spare': { id: 'qi_boss1_spare', questId: 'main_012', description: '废了杜无忧修为留他命——药仓开了，丹给最该吃的人', stat: 'mercy_count', tags: ['mercy', 'wise'] },
    'qi_boss2_slay': { id: 'qi_boss2_slay', questId: 'main_014', description: '斩了炎城税主霍无霜——半城跪谢，另一半当夜上了山', stat: 'ruthless_count', tags: ['ruthless', 'decisive'] },
    'qi_boss2_spare': { id: 'qi_boss2_spare', questId: 'main_014', description: '砸了税册留霍无霜命——炎城头一座公炉是她自己点的', stat: 'mercy_count', tags: ['mercy', 'wise'] },
    'qi_boss3_slay': { id: 'qi_boss3_slay', questId: 'main_015', description: '斩了噬骨佣军头目沙量——矿场的枷你亲手砸开', stat: 'ruthless_count', tags: ['ruthless', 'decisive'] },
    'qi_boss3_spare': { id: 'qi_boss3_spare', questId: 'main_015', description: '留沙量命给他派差事——拆矿、遣人，送一个苦力还乡算一笔功', stat: 'mercy_count', tags: ['mercy', 'wise'] },
    'qi_boss4_slay': { id: 'qi_boss4_slay', questId: 'main_016', description: '斩了藏风真人——库门当众破开，灵石按人头分', stat: 'ruthless_count', tags: ['ruthless', 'decisive'] },
    'qi_boss4_spare': { id: 'qi_boss4_spare', questId: 'main_016', description: '留藏风真人命——他自己开了库门，如今给人写家书', stat: 'mercy_count', tags: ['mercy', 'wise'] },
    'qi_alliance_sign': { id: 'qi_alliance_sign', questId: 'main_017', description: '签了守脉盟的盟帖——交出名册，听调遣，名字刻上盟碑', stat: 'selfish_count', tags: ['selfish', 'pragmatic'] },
    'qi_alliance_refuse': { id: 'qi_alliance_refuse', questId: 'main_017', description: '拒签守脉盟的盟帖——帖子推回去，换来三日构陷传闻', tags: ['wise', 'cautious'] },
    'qi_alliance_tear': { id: 'qi_alliance_tear', questId: 'main_017', description: '当面撕了守脉盟的盟帖——我的名字，我自己写', stat: 'dao_heart_count', tags: ['dao_heart', 'loyal'] },
    'qi_preceptor_condemn': { id: 'qi_preceptor_condemn', questId: 'main_017', description: '朱雀门外拦住国师问罪——构陷的每一笔亲手讨回来', stat: 'ruthless_count', tags: ['ruthless', 'decisive'] },
    'qi_preceptor_press': { id: 'qi_preceptor_press', questId: 'main_017', description: '朱雀门外追内情——问出盟替谁守什么，两笔内情到手', stat: 'wisdom_count', tags: ['wise', 'curious'] },
    'qi_preceptor_pass': { id: 'qi_preceptor_pass', questId: 'main_017', description: '放国师走了——话到朱雀门为止', tags: ['cautious'] },
    'qi_truth_publish': { id: 'qi_truth_publish', questId: 'main_017', description: '公示了《天锁论》——印一千份，撒遍九州', stat: 'wisdom_count', tags: ['wise', 'brave'] },
    'qi_truth_burn': { id: 'qi_truth_burn', questId: 'main_017', description: '烧了《天锁论》——真相太重，独握了它', tags: ['cautious'] },
    'qi_interlude_answer': { id: 'qi_interlude_answer', questId: 'main_018', description: '答了她的信实话——会来，但我会为你多难过一天', stat: 'dao_heart_count', tags: ['dao_heart', 'honest'] },
    'qi_interlude_silent': { id: 'qi_interlude_silent', questId: 'main_018', description: '没答她的信——凑到烛火上烧了；不答，也是答', tags: ['cautious'] },
    // v25.0《灵气之尽》批三：无视线（历书小决策/三回叩门/终拍）
    'qi_kin_took': { id: 'qi_kin_took', questId: 'main_051', description: '收留了来投奔的废掉旧识——家里多一双筷子', stat: 'mercy_count', tags: ['mercy', 'helpful'] },
    'qi_kin_turned': { id: 'qi_kin_turned', questId: 'main_051', description: '婉拒了来投奔的废掉旧识——自家也有自家的难处', tags: ['cautious'] },
    'qi_knock1_went': { id: 'qi_knock1_went', questId: 'main_052', description: '去看了守脉盟的名册——看完什么也没说', tags: ['curious'] },
    'qi_knock1_returned': { id: 'qi_knock1_returned', questId: 'main_052', description: '把守脉盟的帖子原样退回——门里是日子，门外是世道', tags: ['cautious'] },
    'qi_knock2_escort': { id: 'qi_knock2_escort', questId: 'main_052', description: '提剑护送灯下三百口过了佣军地界——那盏灯还了', stat: 'mercy_count', tags: ['mercy', 'loyal'] },
    'qi_knock2_closed': { id: 'qi_knock2_closed', questId: 'main_052', description: '关上了门——三年前那盏灯，没还', tags: ['selfish'] },
    'qi_knock3_wine': { id: 'qi_knock3_wine', questId: 'main_052', description: '接了她的酒——上屋顶陪血海之主坐到天亮', stat: 'dao_heart_count', tags: ['dao_heart', 'brave'] },
    'qi_knock3_window': { id: 'qi_knock3_window', questId: 'main_052', description: '关了窗装睡——窗台上多了一坛没字条的酒', tags: ['cautious'] },
    'qi_ignore_go': { id: 'qi_ignore_go', questId: 'main_055', description: '灵气之尽那夜去了脉尽头——最后看一眼', tags: ['brave'] },
    'qi_ignore_stay': { id: 'qi_ignore_stay', questId: 'main_055', description: '灵气之尽那夜没去——关上门，日子还长', tags: ['detached'] },
    // v25.0《灵气之尽》批四：追随线（差事三办/点兵两落/夜话/债册/危机拍）
    'qi_task_lenient': { id: 'qi_task_lenient', questId: 'main_041', description: '拆坝差事宽办——拆闸不伤人，下游百村回一口气', stat: 'mercy_count', tags: ['mercy', 'wise'] },
    'qi_task_strict': { id: 'qi_task_strict', questId: 'main_041', description: '拆坝差事严办——标准答案，坝照拆挡路的扫开', stat: 'ruthless_count', tags: ['ruthless'] },
    'qi_task_refuse': { id: 'qi_task_refuse', questId: 'main_041', description: '差事不办——「坝是他们修的，凭什么你拆？」', stat: 'dao_heart_count', tags: ['dao_heart', 'defiant'] },
    'qi_muster_divert': { id: 'qi_muster_divert', questId: 'main_042', description: '点兵改道——把刀引向更恶的占脉盟，旧门派保住', stat: 'wisdom_count', tags: ['wise', 'loyal'] },
    'qi_muster_vanguard': { id: 'qi_muster_vanguard', questId: 'main_042', description: '点兵亲自做先锋——两家都打下来，两家都保', stat: 'dao_heart_count', tags: ['dao_heart', 'brave'] },
    'qi_talk_earnest': { id: 'qi_talk_earnest', questId: 'main_043', description: '崖边夜话认真答——「冷饭的世界里，那勺汤是唯一的热的」', tags: ['honest'] },
    'qi_talk_tease': { id: 'qi_talk_tease', questId: 'main_043', description: '崖边夜话逗她——挨了个脑瓜崩，她把「汤面」收进袖子', tags: ['reckless'] },
    'qi_debt_write': { id: 'qi_debt_write', questId: 'main_043', description: '替她在债册最后一页写了她的名字——笔比剑沉', stat: 'dao_heart_count', tags: ['dao_heart', 'devoted'] },
    'qi_debt_skip': { id: 'qi_debt_skip', questId: 'main_043', description: '没写——那是她自己的页，该她自己写', tags: ['wise'] },
    'qi_crisis_detour': { id: 'qi_crisis_detour', questId: 'main_044', description: '危机拍劝她改道——三千口人，这本账绕不过去', stat: 'mercy_count', tags: ['mercy', 'wise'] },
    'qi_crisis_silent': { id: 'qi_crisis_silent', questId: 'main_044', description: '危机拍沉默——她的账，她定；三千个名字当你的面写完', tags: ['cautious'] },
    // v25.0《灵气之尽》批五：三幕前夜改道 / 犹豫拍 / 四结局
    'qi_eve_keep': { id: 'qi_eve_keep', questId: 'main_056', description: '三幕前夜没换路——脚下的路，就是要走完的路', tags: ['dao_heart'] },
    'qi_eve_switch': { id: 'qi_eve_switch', questId: 'main_056', description: '三幕前夜换了路——只此一夜，过期不候', stat: 'reckless_count', tags: ['reckless', 'decisive'] },
    'qi_hesitation_strike': { id: 'qi_hesitation_strike', questId: 'main_057', description: '漩涡底下，这一剑刺下去了——她死前是笑的', stat: 'ruthless_count', tags: ['ruthless', 'decisive'] },
    'qi_hesitation_wait': { id: 'qi_hesitation_wait', questId: 'main_057', description: '漩涡底下，你犹豫了一瞬——「犹豫就对了」', stat: 'mercy_count', tags: ['mercy', 'honest'] },
    'qi_ending_slay': { id: 'qi_ending_slay', questId: 'main_058', description: '灵气之尽 · 结局「斩」——坝溃气归脉，末法时代，梯子还在', stat: 'ruthless_count', tags: ['ruthless'] },
    'qi_ending_ferry': { id: 'qi_ending_ferry', questId: 'main_058', description: '灵气之尽 · 结局「渡」——废她修为囚她：你要负责', stat: 'dao_heart_count', tags: ['dao_heart', 'devoted'] },
    'qi_ending_release': { id: 'qi_ending_release', questId: 'main_058', description: '灵气之尽 · 结局「放」——让开路，仙路终结，她把差距拉平到零', stat: 'mercy_count', tags: ['mercy', 'detached'] },
    'qi_ending_stay': { id: 'qi_ending_stay', questId: 'main_058', description: '灵气之尽 · 结局「不飞升」——账，不是非清不可；日子还长', stat: 'dao_heart_count', tags: ['dao_heart', 'detached'] },
    'main_025_protect': {
        id: 'main_025_protect',
        questId: 'main_025',
        description: '在宗门守卫战中誓死守护宗门',
        stat: 'dao_heart_count',
        tags: ['loyal', 'brave'],
        npcDialogue: {
            'elder_01': '你在守卫战中的表现，我们都看在眼里。宗门以你为荣！',
            'warrior_01': '好样的！与你并肩作战是我的荣幸！'
        }
    },
    'main_025_flee': {
        id: 'main_025_flee',
        questId: 'main_025',
        description: '在宗门守卫战中选择了撤退',
        stat: 'demon_heart_count',
        tags: ['cowardly', 'survival'],
        npcDialogue: {
            'elder_01': '你……你竟然临阵脱逃！',
            'warrior_01': '我看错你了。'
        }
    }
};

// ============ 加载/保存 ============
function loadChoiceMemory() {
    try {
        var saved = localStorage.getItem('xianxia_choices');
        if (saved) {
            var data = JSON.parse(saved);
            playerChoices.history = data.history || [];
            playerChoices.stats = data.stats || playerChoices.stats;
        }
    } catch (e) {
        playerChoices = { history: [], stats: { mercy_count: 0, ruthless_count: 0, helper_count: 0, selfish_count: 0, wisdom_count: 0, reckless_count: 0, dao_heart_count: 0, demon_heart_count: 0 } };
    }
}

function saveChoiceMemory() {
    try {
        localStorage.setItem('xianxia_choices', JSON.stringify(playerChoices));
    } catch (e) {}
}

// ============ 记录选择 ============
function recordChoice(choiceId, questTitle) {
    var choiceDef = IMPORTANT_CHOICES[choiceId];
    if (!choiceDef) { showMessage('选择记录失败：无效的选择ID', 'warning'); return; }

    // 记录到历史
    playerChoices.history.push({
        choiceId: choiceId,
        questId: choiceDef.questId,
        description: choiceDef.description,
        timestamp: window.gameTime ? window.gameTime.totalMinutes : Date.now(),
        day: window.gameTime ? window.gameTime.currentDay : 1
    });

    // 更新统计
    if (choiceDef.stat && playerChoices.stats[choiceDef.stat] !== undefined) {
        playerChoices.stats[choiceDef.stat]++;
    }

    // 保存
    saveChoiceMemory();

    // 显示记录提示
    var tagNames = {
        mercy: '慈悲', ruthless: '冷酷', helpful: '善良', selfish: '自私',
        wise: '明智', reckless: '鲁莽', loyal: '忠诚', cowardly: '怯懦',
        decisive: '果决', cautious: '谨慎', pragmatic: '权宜', dao_heart: '道心',
        brave: '孤勇', honest: '实话', compassionate: '悲悯', curious: '好奇'
    };
    var tags = choiceDef.tags || [];
    var tagText = tags.map(function(t) { return '#' + (tagNames[t] || '抉择'); }).join(' ');

    if (window.showMessage) {
        window.showMessage('📜 选择已记录：' + choiceDef.description + ' ' + tagText, 'info');
    }

    // 检查是否触发结局变化
    checkEndingFromChoices();
}

// ============ NPC引用历史选择 ============
function getReferencedDialogue(npcId, baseDialogue) {
    // 遍历玩家选择历史，查找与当前NPC相关的引用
    var references = [];

    for (var i = 0; i < playerChoices.history.length; i++) {
        var choice = playerChoices.history[i];
        var choiceDef = IMPORTANT_CHOICES[choice.choiceId];
        if (!choiceDef) continue;

        // 检查是否有当前NPC的对话引用
        var npcDialogue = choiceDef.npcDialogue;
        if (npcDialogue && npcDialogue[npcId]) {
            references.push(npcDialogue[npcId]);
        }
    }

    if (references.length > 0) {
        // 随机选择一条引用附加到对话中
        var ref = references[Math.floor(Math.random() * references.length)];
        return baseDialogue + '\n\n（' + ref + '）';
    }

    return baseDialogue;
}

// ============ 选择累积影响结局 ============
function checkEndingFromChoices() {
    var stats = playerChoices.stats;

    // 仁慈 vs 冷酷决定结局倾向
    var mercyRatio = stats.mercy_count > 0 || stats.ruthless_count > 0 ?
        stats.mercy_count / Math.max(1, stats.mercy_count + stats.ruthless_count) : 0.5;

    var helperRatio = stats.helper_count > 0 || stats.selfish_count > 0 ?
        stats.helper_count / Math.max(1, stats.helper_count + stats.selfish_count) : 0.5;

    var daoRatio = stats.dao_heart_count > 0 || stats.demon_heart_count > 0 ?
        stats.dao_heart_count / Math.max(1, stats.dao_heart_count + stats.demon_heart_count) : 0.5;

    // v21.9：明智 vs 鲁莽此前只记不算——现在也进结局倾向
    var wisdomRatio = stats.wisdom_count > 0 || stats.reckless_count > 0 ?
        stats.wisdom_count / Math.max(1, stats.wisdom_count + stats.reckless_count) : 0.5;

    // v21.9：一句可展示的「此生之路」判词（结局画面读取）
    var tendency = '中庸行者';
    if (mercyRatio >= 0.75 && daoRatio >= 0.6) tendency = '仁心证道';
    else if (mercyRatio <= 0.25) tendency = '杀伐果断';
    else if (daoRatio <= 0.4) tendency = '道心有隙';
    else if (wisdomRatio >= 0.75) tendency = '步步为营';
    else if (wisdomRatio <= 0.25) tendency = '一往无前';

    // 存储结局修正因子（供结局系统读取）
    if (typeof window !== 'undefined') {
        window._endingModifiers = {
            mercyRatio: mercyRatio,
            helperRatio: helperRatio,
            daoRatio: daoRatio,
            wisdomRatio: wisdomRatio,
            tendency: tendency,
            totalChoices: playerChoices.history.length
        };
    }
}

// ============ 查看选择历史 ============
function showChoiceHistory() {
    var stats = playerChoices.stats;
    var history = playerChoices.history;

    var modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
    modal.onclick = function(e) { if (e.target === modal) modal.remove(); };

    var statNames = {
        mercy_count: { name: '仁慈', icon: '🕊️', color: 'text-green-400' },
        ruthless_count: { name: '冷酷', icon: '⚔️', color: 'text-red-400' },
        helper_count: { name: '助人', icon: '🤝', color: 'text-blue-400' },
        selfish_count: { name: '自私', icon: '🙅', color: 'text-gray-400' },
        wisdom_count: { name: '明智', icon: '🧠', color: 'text-purple-400' },
        reckless_count: { name: '鲁莽', icon: '💥', color: 'text-orange-400' },
        dao_heart_count: { name: '道心', icon: '💎', color: 'text-yellow-400' },
        demon_heart_count: { name: '入魔', icon: '👹', color: 'text-red-600' }
    };

    var statsHtml = '';
    for (var key in stats) {
        if (stats[key] > 0 && statNames[key]) {
            var s = statNames[key];
            statsHtml += '<div class="flex items-center gap-2 ' + s.color + '"><span>' + s.icon + '</span><span class="text-sm">' + s.name + '</span><span class="text-xs ml-auto">' + stats[key] + '次</span></div>';
        }
    }

    var historyHtml = '';
    if (history.length === 0) {
        historyHtml = '<p class="text-gray-500 text-sm text-center">暂无选择记录</p>';
    } else {
        // 只显示最近20条
        var recent = history.slice(-20).reverse();
        for (var i = 0; i < recent.length; i++) {
            var h = recent[i];
            historyHtml += '<div class="flex items-center gap-2 text-xs text-gray-400 border-b border-gray-700/50 pb-1"><span class="text-yellow-400">📜</span><span>' + h.description + '</span><span class="text-gray-500 ml-auto">第' + h.day + '天</span></div>';
        }
    }

    modal.innerHTML = '<div class="bg-gray-800 border-2 border-yellow-600/50 rounded-xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">' +
        '<div class="flex items-center justify-between mb-4"><h3 class="text-xl font-bold text-yellow-500">📜 选择记忆</h3><button onclick="this.closest(\'.fixed\').remove()" class="text-gray-400 hover:text-white text-2xl">&times;</button></div>' +
        '<div class="mb-4"><h4 class="text-sm font-bold text-gray-300 mb-2">📊 抉择统计</h4><div class="grid grid-cols-2 gap-2">' + (statsHtml || '<p class="text-gray-500 text-sm">暂无统计</p>') + '</div></div>' +
        '<div><h4 class="text-sm font-bold text-gray-300 mb-2">📋 选择记录</h4><div class="space-y-1">' + historyHtml + '</div></div>' +
        '<div class="flex justify-end mt-4"><button onclick="this.closest(\'.fixed\').remove()" class="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded-lg">关闭</button></div>' +
    '</div>';

    document.body.appendChild(modal);
}

// ============ 初始化 ============
function initChoiceMemorySystem() {
    loadChoiceMemory();
    if (typeof window !== 'undefined') {
        window.IMPORTANT_CHOICES = IMPORTANT_CHOICES;
        window.playerChoices = playerChoices;
        window.recordChoice = recordChoice;
        window.getReferencedDialogue = getReferencedDialogue;
        window.showChoiceHistory = showChoiceHistory;
        window.checkEndingFromChoices = checkEndingFromChoices;
        window.initChoiceMemorySystem = initChoiceMemorySystem;
    }
}

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initChoiceMemorySystem);
    } else {
        initChoiceMemorySystem();
    }
}