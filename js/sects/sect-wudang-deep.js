// ==================== sect-wudang-deep.js - 武当派深度样板 v10.0 ====================
// 包含：师徒系统、内部派系、资源与事件链、加入考核流程
// 职务晋升已委托给通用系统（showSectRanks）
// 加载顺序：在 sects-system.js 之后

// ============ 武当派内部数据 ============
var WUDANG_DATA = {
    // 门派基本信息
    name: '武当派',
    style: '道门正宗·太极',
    desc: '武当派乃道门正宗，讲究阴阳平衡，以柔克刚。张三丰真人创立，历经千年薪火相传。',
    
    // 师父列表
    masters: [
        { id: 'wd_master_1', name: '张三丰', title: '开派祖师', realm: '化神', layer: 5, age: 200,
          desc: '武当派创始人，太极拳剑的开创者。已闭关多年，极少现身。',
          personality: '超然物外，和蔼可亲', skills: ['太极拳', '太极剑', '纯阳无极功'], 
          acceptStudent: false, maxStudents: 0 },
        { id: 'wd_master_2', name: '宋远桥', title: '掌门', realm: '金丹', layer: 8, age: 70,
          desc: '武当派现任掌门，张三丰的大弟子。为人正直，处事公允。',
          personality: '沉稳老练，公正严明', skills: ['太极拳', '太极剑', '武当九阳功'],
          acceptStudent: true, maxStudents: 3, requirement: { realm: '筑基', layer: 3, contribution: 500 } },
        { id: 'wd_master_3', name: '俞莲舟', title: '长老', realm: '金丹', layer: 5, age: 60,
          desc: '武当七侠之二，武功卓绝，尤擅剑法。性格刚直，嫉恶如仇。',
          personality: '刚直不阿，嫉恶如仇', skills: ['太极剑', '绕指柔剑', '武当九阳功'],
          acceptStudent: true, maxStudents: 2, requirement: { realm: '筑基', layer: 1, contribution: 300 } },
        { id: 'wd_master_4', name: '俞岱岩', title: '长老', realm: '金丹', layer: 3, age: 55,
          desc: '武当七侠之三，精通拳法。性格温和，教导耐心。',
          personality: '温和敦厚，循循善诱', skills: ['太极拳', '绵掌', '武当九阳功'],
          acceptStudent: true, maxStudents: 2, requirement: { realm: '炼气', layer: 7, contribution: 200 } },
        { id: 'wd_master_5', name: '张松溪', title: '长老', realm: '金丹', layer: 2, age: 52,
          desc: '武当七侠之四，足智多谋。擅长阵法与谋略。',
          personality: '足智多谋，风趣幽默', skills: ['太极拳', '真武七截阵', '武当九阳功'],
          acceptStudent: true, maxStudents: 2, requirement: { realm: '炼气', layer: 5, contribution: 150 } },
        { id: 'wd_master_6', name: '殷梨亭', title: '长老', realm: '筑基', layer: 9, age: 48,
          desc: '武当七侠之六，性情温和，剑法飘逸。',
          personality: '温文尔雅，谦逊有礼', skills: ['太极剑', '武当剑法', '武当九阳功'],
          acceptStudent: true, maxStudents: 3, requirement: { realm: '炼气', layer: 3, contribution: 100 } },
        { id: 'wd_master_7', name: '莫声谷', title: '长老', realm: '筑基', layer: 7, age: 45,
          desc: '武当七侠之七，性格豪爽，好打抱不平。',
          personality: '豪爽仗义，热血正直', skills: ['太极拳', '武当剑法', '武当九阳功'],
          acceptStudent: true, maxStudents: 3, requirement: { realm: '炼气', layer: 1, contribution: 50 } }
    ],
    
    // 职务等级（保留数据供参考，实际晋升使用通用系统）
    ranks: [
        { id: 7, name: '杂役弟子', desc: '负责门派日常杂务', 
          privileges: ['基础住宿', '公共食堂'], duties: ['打扫庭院', '挑水劈柴', '厨房帮工'],
          dailyTaskCount: 1, salary: { copper: 10, spiritStones: 0 }, contributionPerTask: 5 },
        { id: 6, name: '外门弟子', desc: '正式入门，可习练基础功法',
          privileges: ['基础住宿', '公共食堂', '藏经阁一层', '演武场'],
          duties: ['日常巡逻', '采集物资', '协助杂务'], 
          dailyTaskCount: 2, salary: { copper: 30, spiritStones: 2 }, contributionPerTask: 10,
          promoteCondition: { contribution: 200, realm: '炼气', layer: 3 } },
        { id: 5, name: '内门弟子', desc: '核心弟子，可拜师学艺',
          privileges: ['单间住宿', '小灶食堂', '藏经阁二层', '演武场', '修炼洞府'],
          duties: ['教导外门弟子', '外出执行任务', '参加门派活动'],
          dailyTaskCount: 2, salary: { copper: 60, spiritStones: 5 }, contributionPerTask: 20,
          promoteCondition: { contribution: 500, realm: '炼气', layer: 6 } },
        { id: 4, name: '亲传弟子', desc: '长老亲传，可习练核心功法',
          privileges: ['独立院落', '专属修炼室', '藏经阁三层', '丹药供应', '兵器库'],
          duties: ['代表门派出战', '协助长老理事', '培养新弟子'],
          dailyTaskCount: 1, salary: { copper: 100, spiritStones: 15 }, contributionPerTask: 35,
          promoteCondition: { contribution: 1000, realm: '筑基', layer: 1 } },
        { id: 3, name: '执事', desc: '管理门派事务',
          privileges: ['执事院', '调派外门弟子', '藏经阁全层', '丹药优先供应'],
          duties: ['管理门派资源', '分配弟子任务', '处理日常事务'],
          dailyTaskCount: 1, salary: { copper: 150, spiritStones: 30 }, contributionPerTask: 50,
          promoteCondition: { contribution: 2000, realm: '筑基', layer: 4 } },
        { id: 2, name: '长老', desc: '门派核心决策层',
          privileges: ['长老院', '收徒资格', '决策投票权', '所有资源优先'],
          duties: ['教导弟子', '参与决策', '守卫门派'],
          dailyTaskCount: 0, salary: { copper: 300, spiritStones: 60 },
          promoteCondition: { contribution: 5000, realm: '金丹', layer: 1 } },
        { id: 1, name: '掌门', desc: '一派之主',
          privileges: ['掌门大殿', '最高决策权', '传承功法', '所有资源无限'],
          duties: ['统领门派', '外交决策', '传承道统'],
          dailyTaskCount: 0, salary: { copper: 500, spiritStones: 100 },
          promoteCondition: { contribution: 10000, realm: '金丹', layer: 5 } }
    ],
    
    // 内部派系
    factions: [
        { id: 'wd_faction_conservative', name: '守成派', icon: '🛡️',
          desc: '主张固守武当基业，不轻易参与江湖纷争，专注修炼。',
          leader: '宋远桥', members: ['俞莲舟', '俞岱岩'],
          stance: { expansion: -20, reform: -10, orthodox: 30 },
          influence: 40, playerRelation: 0 },
        { id: 'wd_faction_reform', name: '革新派', icon: '⚡',
          desc: '主张武当应该与时俱进，广纳贤才，扩大影响力。',
          leader: '张松溪', members: ['殷梨亭'],
          stance: { expansion: 20, reform: 30, orthodox: -10 },
          influence: 25, playerRelation: 0 },
        { id: 'wd_faction_action', name: '行动派', icon: '⚔️',
          desc: '主张武当应该积极除魔卫道，维护武林正义。',
          leader: '莫声谷', members: [],
          stance: { expansion: 10, reform: 0, orthodox: 20 },
          influence: 20, playerRelation: 0 }
    ],
    
    // 门派资源
    resources: {
        spiritStones: 5000,     // 灵石储备
        herbs: 200,              // 药材储备
        ores: 150,               // 矿石储备
        food: 800,               // 粮食储备
        morale: 70,              // 士气
        influence: 65,           // 影响力
        disciples: 80,           // 弟子总数
        // 特殊资源点
        specialResources: [
            { id: 'wd_resource_mine', name: '武当灵矿', type: 'mine', output: 10, interval: 'daily', desc: '出产灵石的矿脉' },
            { id: 'wd_resource_herb', name: '药王谷', type: 'herb', output: 8, interval: 'daily', desc: '种植灵药的药圃' },
            { id: 'wd_resource_training', name: '紫霄宫', type: 'training', output: 15, interval: 'daily', desc: '修炼圣地，提升修炼效率' },
            { id: 'wd_resource_library', name: '藏经阁', type: 'knowledge', output: 5, interval: 'daily', desc: '收藏武学典籍' }
        ]
    },
    
        // 事件玩法已并入通用 SECT_EVENTS 引擎（v16.3，sects-deep-data.js）
};

// ============ 武当派拜师系统 ============
function wudangShowMasters() {
    var masters = WUDANG_DATA.masters.filter(function(m) { return m.acceptStudent; });
    var player = window.currentCharData || {};
    var playerRealm = player.realm || '炼气';
    var playerLayer = player.layer || 1;
    var playerContribution = (window.discipleState && window.discipleState.contribution) || 0;
    
    var html = '<div class="space-y-3">';
    html += '<h3 class="text-lg font-bold text-yellow-400">📖 武当拜师</h3>';
    html += '<p class="text-sm text-gray-400">选择一位师父，你可以向他学习武当绝学。</p>';
    
    masters.forEach(function(m) {
        var req = m.requirement || {};
        var meetRealm = getRealmTier(playerRealm) >= getRealmTier(req.realm || '炼气') && (playerLayer || 1) >= (req.layer || 1);
        var meetContribution = (playerContribution || 0) >= (req.contribution || 0);
        var canLearn = meetRealm && meetContribution;
        var hasMaster = window.discipleState && window.discipleState._masterId;
        
        html += '<div class="bg-gray-800 rounded-lg p-3 border border-gray-600">';
        html += '<div class="flex justify-between items-start">';
        html += '<div>';
        html += '<p class="font-bold text-white">' + m.name + ' <span class="text-xs text-gray-400">' + m.title + '</span></p>';
        html += '<p class="text-xs text-gray-400">' + m.desc + '</p>';
        html += '<p class="text-xs text-yellow-400 mt-1">' + m.realm + '·' + m.layer + '层 | ' + m.personality + '</p>';
        html += '<p class="text-xs text-gray-500">可传：' + m.skills.join('、') + '</p>';
        if (!canLearn) {
            html += '<p class="text-xs text-red-400 mt-1">需要：' + (req.realm || '炼气') + (req.layer || 1) + '层，贡献' + (req.contribution || 0) + '</p>';
        }
        html += '</div>';
        if (hasMaster) {
            html += '<span class="text-xs text-gray-500">已拜师</span>';
        } else if (canLearn) {
            html += '<button onclick="wudangBecomeStudent(\'' + m.id + '\')" class="bg-yellow-600 hover:bg-yellow-500 text-gray-900 px-3 py-1 rounded text-xs font-bold">拜师</button>';
        } else {
            html += '<span class="text-xs text-gray-500">条件不足</span>';
        }
        html += '</div></div>';
    });
    html += '</div>';
    
    // 显示当前师父
    if (window.discipleState && window.discipleState._masterId) {
        var master = WUDANG_DATA.masters.find(function(m) { return m.id === window.discipleState._masterId; });
        if (master) {
            html += '<div class="mt-4 bg-gray-800 rounded-lg p-3 border border-green-600">';
            html += '<p class="text-sm text-green-400">当前师父：' + master.name + '（' + master.title + '）</p>';
            html += '<p class="text-xs text-gray-400">' + master.desc + '</p>';
            html += '<button onclick="wudangLeaveMaster()" class="mt-2 bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-xs">离开师门</button>';
            html += '</div>';
        }
    }
    
    window.showModal('武当·拜师', html);
}

function wudangBecomeStudent(masterId) {
    if (window.discipleState && window.discipleState._masterId) {
        if (window.showMessage) window.showMessage('你已有师父，不能同时拜多人为师', 'warning');
        return;
    }
    var master = WUDANG_DATA.masters.find(function(m) { return m.id === masterId; });
    if (!master) return;
    // v16.0：离师之人，师父不再收徒——世界记得
    var dsW = window.discipleState || {};
    if (dsW._leftMasters && dsW._leftMasters[masterId]) {
        if (window.showMessage) window.showMessage(master.name + '淡淡看你一眼："当年你执意离去，如今何必再来。"此人不会再收你为徒了。', 'error');
        return;
    }
    if (!window.discipleState) {
        if (window.showMessage) window.showMessage('请先加入武当派', 'warning');
        return;
    }
    window.discipleState._masterId = masterId;
    window.discipleState._masterName = master.name;
    // 好感度变化
    if (window.npcManager) {
        var npc = window.npcManager.getNPC('wudang_' + master.name);
        if (npc) npc.changeAffection(20);
    }
    if (window.showMessage) window.showMessage('你正式拜入' + master.name + '门下！', 'success');
    // v15.4 裁决：拜师不送功法——功法须经本派藏经阁参悟获得（分层阅览体系）
    wudangShowMasters();
}

function wudangLeaveMaster() {
    if (!window.discipleState || !window.discipleState._masterId) return;
    if (!confirm('确定要离开师门？师父会记得这件事的。')) return;
    var masterName = window.discipleState._masterName;
    var masterIdW = window.discipleState._masterId;
    // v16.0：离师入册——此人此后不再收你（世界记忆，非计数器）
    window.discipleState._leftMasters = window.discipleState._leftMasters || {};
    window.discipleState._leftMasters[masterIdW] = true;
    delete window.discipleState._masterId;
    delete window.discipleState._masterName;
    delete window.discipleState._masterBlessDay;
    if (window.showMessage) window.showMessage('你离开了' + masterName + '门下。他淡淡点头，眼里的失望却藏不住——此人不会再收你为徒。', 'info');
    wudangShowMasters();
}

// ============ 武当派职务晋升（委托给通用系统） ============
function wudangShowRankInfo() {
    if (typeof window.showSectRanks === 'function') {
        window.showSectRanks('武当派');
    }
}

// ============ 武当派日常任务 ============
var WUDANG_DAILY_TASKS = [
    { id: 'wd_task_1', name: '打扫三清殿', desc: '打扫三清殿，保持道观整洁', minRank: 7, reward: { contribution: 5, exp: 10 } },
    { id: 'wd_task_2', name: '挑水劈柴', desc: '为厨房准备足够的柴火和水', minRank: 7, reward: { contribution: 5, exp: 8 } },
    { id: 'wd_task_3', name: '山门巡逻', desc: '在山门周围巡逻，防范宵小', minRank: 6, reward: { contribution: 10, exp: 15 } },
    { id: 'wd_task_4', name: '采集灵药', desc: '在后山采集灵药', minRank: 6, reward: { contribution: 10, exp: 20, items: [{ id: 'mat_lingzhi', count: 2 }] } },
    { id: 'wd_task_5', name: '教导新弟子', desc: '指导新入门的外门弟子修炼', minRank: 5, reward: { contribution: 20, exp: 30 } },
    { id: 'wd_task_6', name: '下山除妖', desc: '下山处理附近的妖患', minRank: 5, reward: { contribution: 25, exp: 40, spiritStones: 20 } },
    { id: 'wd_task_7', name: '太极演武', desc: '在演武场演示太极拳剑', minRank: 4, reward: { contribution: 35, exp: 50 } },
    { id: 'wd_task_8', name: '管理门派事务', desc: '协助处理门派日常管理', minRank: 3, reward: { contribution: 50, exp: 60, spiritStones: 30 } },
    { id: 'wd_task_9', name: '主持论道', desc: '为弟子们讲解道法', minRank: 2, reward: { contribution: 80, exp: 100, spiritStones: 50 } },
    { id: 'wd_task_10', name: '外交出访', desc: '代表武当前往其他门派交流', minRank: 2, reward: { contribution: 100, exp: 120, fame: 3 } }
];

function wudangShowDailyTasks() {
    var ds = window.discipleState || {};
    var rank = ds.rank || 7;
    var day = (typeof window.getAbsoluteDay === 'function') ? window.getAbsoluteDay() : 1;
    if (ds._wudangTaskDay !== day) {
        ds._wudangTaskDay = day;
        ds._wudangTaskCompleted = 0;
    }
    
    var rankCfg = WUDANG_DATA.ranks.find(function(r) { return r.id === rank; });
    var maxTasks = rankCfg && rankCfg.dailyTaskCount != null ? rankCfg.dailyTaskCount : 1;
    var completed = ds._wudangTaskCompleted || 0;
    var remaining = maxTasks - completed;
    
    var html = '<div class="space-y-3">';
    html += '<h3 class="text-lg font-bold text-yellow-400">📋 武当·日常任务</h3>';
    html += '<p class="text-sm text-gray-400">今日可完成：' + remaining + '/' + maxTasks + ' 个任务</p>';
    html += '<hr class="border-gray-600">';
    
    WUDANG_DAILY_TASKS.forEach(function(task) {
        if (task.minRank > rank) return;
        var done = ds._wudangTaskDone && ds._wudangTaskDone.indexOf(task.id) >= 0;
        if (done) return;
        if (remaining <= 0) return;
        
        var rewards = '';
        if (task.reward.contribution) rewards += '贡献+' + task.reward.contribution + ' ';
        if (task.reward.exp) rewards += '经验+' + task.reward.exp + ' ';
        if (task.reward.spiritStones) rewards += '灵石+' + task.reward.spiritStones + ' ';
        if (task.reward.fame) rewards += '名气+' + task.reward.fame + ' ';
        if (task.reward.items) {
            task.reward.items.forEach(function(item) {
                var itemName = (window.itemById && window.itemById[item.id] && window.itemById[item.id].name) || item.id;
                rewards += itemName + 'x' + item.count + ' ';
            });
        }
        
        html += '<div class="bg-gray-800 rounded-lg p-3 border border-gray-600">';
        html += '<div class="flex justify-between items-start">';
        html += '<div>';
        html += '<p class="font-bold text-white">' + task.name + '</p>';
        html += '<p class="text-xs text-gray-400">' + task.desc + '</p>';
        html += '<p class="text-xs text-yellow-400 mt-1">' + rewards + '</p>';
        html += '</div>';
        html += '<button onclick="wudangCompleteTask(\'' + task.id + '\')" class="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-xs">执行</button>';
        html += '</div></div>';
        remaining--;
    });
    
    if (completed >= maxTasks) {
        html += '<p class="text-sm text-green-400">今日任务已全部完成！</p>';
    }
    html += '</div>';
    
    window.showModal('武当日常', html);
}

function wudangCompleteTask(taskId) {
    var ds = window.discipleState || {};
    var task = WUDANG_DAILY_TASKS.find(function(t) { return t.id === taskId; });
    if (!task) return false;
    if (!ds._wudangTaskDone) ds._wudangTaskDone = [];
    if (ds._wudangTaskDone.indexOf(taskId) >= 0) return false;
    if (!window.RewardService) {
        if (window.showMessage) window.showMessage('奖励结算服务未就绪，任务未消耗', 'error');
        return false;
    }
    var reward = task.reward || {};
    var result = window.RewardService.apply({
        exp: reward.exp,
        spiritStones: reward.spiritStones,
        items: reward.items,
        contribution: reward.contribution,
        fame: reward.fame
    }, { source: 'wudang-daily:' + taskId });
    if (!result || result.success === false) {
        if (window.showMessage) window.showMessage('任务奖励无法完整结算，任务仍保留', 'error');
        return false;
    }
    ds._wudangTaskDone.push(taskId);
    ds._wudangTaskCompleted = (ds._wudangTaskCompleted || 0) + 1;
    if (window.showMessage) window.showMessage('✅ 完成：' + task.name + (result.messages.length ? '（' + result.messages.join('、') + '）' : ''), 'success');
    wudangShowDailyTasks();
    return true;
}

// 武当事件链已退役（v16.3）：原三函数无调用方且 sectName 笔误致从未触发；玩法并入通用 SECT_EVENTS。
// ============ 导出 ============
window.WUDANG_DATA = WUDANG_DATA;
window.wudangShowMasters = wudangShowMasters;
window.wudangBecomeStudent = wudangBecomeStudent;
window.wudangLeaveMaster = wudangLeaveMaster;
window.wudangShowRankInfo = wudangShowRankInfo;
window.wudangShowDailyTasks = wudangShowDailyTasks;
window.wudangCompleteTask = wudangCompleteTask;