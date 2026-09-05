// ==================== sect-internal.js - 宗门内部生态（v7.3 全门派扩展） ====================
// 弟子群体、竞争合作、门派会议、决策影响
// 依赖：sects-system.js

// ============ 全门派内部数据 ============
var SECT_INTERNAL = {};

// 自动生成所有门派的内部数据
function initAllSectInternal() {
    var sects = window.sectsData || {};
    for (var name in sects) {
        if (!SECT_INTERNAL[name]) {
            var sect = sects[name];
            var powerMap = { '巨擘': 1.5, '大派': 1.3, '中等偏上': 1.15, '中等': 1.0, '小': 0.7, '极小': 0.5, '未知': 0.8 };
            var mul = powerMap[sect.power] || 1.0;
            SECT_INTERNAL[name] = {
                disciples: Math.floor(15 + Math.random() * 20 * mul), // 弟子数受实力影响
                morale: 50 + Math.floor(Math.random() * 30),
                meetings: [],
                decisions: [],
                influence: Math.floor(50 * mul),   // 门派影响力
                resources: Math.floor(100 * mul),   // 门派资源储备
                founded: Math.floor(100 + Math.random() * 900) + '年' // 立派时间
            };
        }
    }
}

// sects-system.js/sectsData 在本文件之前加载，直接初始化，避免时间竞态。
if (typeof window !== 'undefined') initAllSectInternal();

// ============ v18.8 宗门资源日结 ============
function getSectEconomySnapshot(sectName) {
    var internal = SECT_INTERNAL[sectName];
    if (!internal) return null;
    var deep = window.SECT_DEEP_DATA && window.SECT_DEEP_DATA[sectName];
    var special = deep && Array.isArray(deep.specialResources) ? deep.specialResources : [];
    var gross = special.reduce(function(sum, r) { return sum + Math.max(0, Number(r.output) || 0); }, 0);
    // 没有专属资源配置的门派仍有香火、杂役与基础产业，但产能明显更低。
    if (gross <= 0) gross = Math.max(5, Math.floor((Number(internal.influence) || 50) / 10));
    var upkeep = Math.max(1, Math.ceil((Number(internal.disciples) || 1) / 4));
    return {
        stock: Math.max(0, Math.floor(Number(internal.resources) || 0)),
        gross: gross,
        upkeep: upkeep,
        net: gross - upkeep,
        disciples: Number(internal.disciples) || 0,
        morale: Number(internal.morale) || 0
    };
}

function processAllSectDailyEconomy(day) {
    day = Number(day) || ((window.timeSystem && window.timeSystem.gameTime && window.timeSystem.gameTime.currentDay) || 1);
    var results = {};
    Object.keys(SECT_INTERNAL).forEach(function(sectName) {
        var internal = SECT_INTERNAL[sectName];
        if (!internal || internal.lastEconomyDay === day) return;
        var snap = getSectEconomySnapshot(sectName);
        if (!snap) return;
        internal.resources = Math.max(0, snap.stock + snap.net);
        if (snap.net < 0) internal.morale = Math.max(0, (Number(internal.morale) || 50) - 2);
        else if (internal.resources >= 500 && snap.net >= 10) internal.morale = Math.min(100, (Number(internal.morale) || 50) + 1);
        internal.lastEconomyDay = day;
        // v19.2 收尾：清理过期 policyBuffs
        if (Array.isArray(internal.policyBuffs)) {
            internal.policyBuffs = internal.policyBuffs.filter(function (b) {
                if (!b || typeof b.appliedAtDay !== 'number' || typeof b.durationDays !== 'number') return true;
                return (day - b.appliedAtDay) < b.durationDays;
            });
        }
        results[sectName] = { gross: snap.gross, upkeep: snap.upkeep, net: snap.net, stock: internal.resources };
    });
    // v19.0 P0-3 批次 C2：年度宗门目标日结推进 + 跨年检测
    if (window.SectYearGoal && typeof window.SectYearGoal.tickDay === 'function') {
        Object.keys(SECT_INTERNAL).forEach(function (sectName) {
            try { window.SectYearGoal.tickDay(sectName, day); } catch (e) { /* 不阻塞经济日结 */ }
        });
    }
    // v19.0 P0-3 批次 D4：每周（day%7==0）自动开 1 个普通投票
    if (window.tryAutoOpenWeeklyVote && day % 7 === 0) {
        Object.keys(SECT_INTERNAL).forEach(function (sectName) {
            try { window.tryAutoOpenWeeklyVote(sectName, day); } catch (e) { /* 不阻塞经济日结 */ }
        });
    }
    // v19.1 P0-4：每季小比 / 每年大比周期调度
    if (window.Tournament && typeof window.Tournament.tickDay === 'function' && (day % 90 === 0 || day % 360 === 0)) {
        Object.keys(SECT_INTERNAL).forEach(function (sectName) {
            try { window.Tournament.tickDay(sectName, day); } catch (e) { /* 不阻塞 */ }
        });
    }
    // v19.2 P0-5：每日 NPC 自主人生（5~20 NPC 抽样行动）
    if (window.NPCLife && typeof window.NPCLife.tickDay === 'function') {
        try { window.NPCLife.tickDay(day); } catch (e) { /* 不阻塞经济日结 */ }
    }
    // v19.3 P0-6：NPC 婚姻/后代/衣钵（道侣按年概率 haveChild）
    if (window.NpcLineage && typeof window.NpcLineage.tickDay === 'function') {
        try { window.NpcLineage.tickDay(day); } catch (e) { /* 不阻塞 */ }
    }
    return results;
}

// 宗门内部状态此前只活在内存里，事件造成的资源/士气变化读档即丢。
// v18.8 起纳入 StateRegistry，旧档没有该段时按原规则初始化即可，无需迁移。
if (typeof window !== 'undefined' && window.StateRegistry && typeof window.StateRegistry.register === 'function') {
    window.StateRegistry.register('sectInternal', {
        version: 1,
        export: function() { return SECT_INTERNAL; },
        import: function(data) {
            Object.keys(SECT_INTERNAL).forEach(function(k) { delete SECT_INTERNAL[k]; });
            if (data && typeof data === 'object') {
                Object.keys(data).forEach(function(k) { SECT_INTERNAL[k] = data[k]; });
            }
            initAllSectInternal();
        },
        reset: function() {
            Object.keys(SECT_INTERNAL).forEach(function(k) { delete SECT_INTERNAL[k]; });
            initAllSectInternal();
        }
    });
}

// ============ 生成门派弟子（v8.6 使用随机命名系统） ============
function generateSectDisciples(sectName) {
    var data = SECT_INTERNAL[sectName];
    if (!data) return [];
    var count = 3 + Math.floor(Math.random() * 5);
    var disciples = [];
    var positions = ['外门弟子', '内门弟子', '亲传弟子', '长老', '掌门'];
    var realms = ['炼气', '筑基', '金丹', '元婴'];
    var usedNames = [];
    
    // 使用名字生成器（回退到编号）
    function getRandomName() {
        if (typeof window.nameGenerator?.generateName === 'function') {
            for (var attempt = 0; attempt < 20; attempt++) {
                var nameObj = window.nameGenerator.generateName();
                var fullName = nameObj.full || nameObj;
                // 避免同名
                if (usedNames.indexOf(fullName) < 0) {
                    usedNames.push(fullName);
                    return fullName;
                }
            }
        }
        return '弟子' + (disciples.length + 1);
    }
    
    for (var i = 0; i < count; i++) {
        var realmIdx = Math.min(i < 2 ? 0 : (i < 4 ? 1 : (i < 6 ? 2 : 3)), realms.length - 1);
        disciples.push({
            id: 'disciple_' + sectName + '_' + i,
            name: getRandomName(),
            realm: realms[realmIdx],
            layer: 1 + Math.floor(Math.random() * 7),
            position: positions[Math.min(i, positions.length - 1)],
            morale: 50 + Math.floor(Math.random() * 30)
        });
    }
    return disciples;
}

// ============ 获取门派描述摘要 ============
function getSectSummary(sectName) {
    var data = SECT_INTERNAL[sectName];
    var sect = window.sectsData?.[sectName];
    if (!data || !sect) return '暂无数据';
    
    return '立派' + data.founded + '，弟子' + data.disciples + '人，' +
        '士气' + (data.morale >= 70 ? '高昂' : data.morale >= 50 ? '平稳' : '低落') +
        '，影响力' + data.influence;
}

// ============ 召开门派会议 ============
function holdSectMeeting(sectName) {
    var data = SECT_INTERNAL[sectName];
    if (!data) return false;
    // v20.8：开会不再免费——你张罗这场会要出20贡献（茶水、封场、执事应酬都是公中出的）。
    // 议事频率的约束是世界性的：一桩事务一天只够议一次（机构节奏，非玩家次数配额）。
    var ds = window.discipleState || {};
    var contrib = Number(ds.contribution) || 0;
    if (contrib < 20) {
        if (typeof window.showMessage === 'function') window.showMessage('张罗一场门派议事要应承20贡献的开销，你的贡献还不够。', 'warning');
        return false;
    }
    var today = (window.timeSystem && window.timeSystem.gameTime && window.timeSystem.gameTime.currentDay) || 1;
    if (data._lastMeetingDay === today) {
        if (typeof window.showMessage === 'function') window.showMessage('今日该议的事已经议过了——执事们抱着茶碗摆手：明日请早。', 'info');
        return false;
    }
    if (ds.contribution != null) ds.contribution = contrib - 20;
    data._lastMeetingDay = today;
    if (typeof window.showMessage === 'function') {
        window.showMessage('🏛️ 你出贡献20张罗了' + sectName + '的门派议事，众人齐心，士气+5。', 'info');
    }
    data.morale = Math.min(100, data.morale + 5);
    data.meetings.push({ time: Date.now(), topic: '宗门事务' });
    if (data.meetings.length > 20) data.meetings.shift();
    return true;
}

// ============ 获取门派弟子士气 ============
function getSectMorale(sectName) {
    var data = SECT_INTERNAL[sectName];
    return data ? data.morale : 50;
}

// ============ 门派专属NPC注册（P2） ============
// 为每个门派生成掌门/长老/弟子NPC，可对话、互动

var SECT_NPC_TEMPLATES = {
    '正道': { leaderTitle: '掌门', elderTitle: '长老', leaderTraits: ['威严', '慈祥', '睿智'], elderTraits: ['严肃', '温和', '博学'] },
    '邪派': { leaderTitle: '教主', elderTitle: '护法', leaderTraits: ['阴鸷', '狂傲', '深沉'], elderTraits: ['冷酷', '狡诈', '残忍'] },
    '中立': { leaderTitle: '谷主', elderTitle: '执事', leaderTraits: ['随和', '神秘', '精明'], elderTraits: ['中立', '务实', '圆滑'] }
};

var SECT_LEADER_NAMES = {
    '少林寺':'释玄慈','武当派':'张三丰','全真教':'王重阳','华山派':'岳不群',
    '嵩山派':'左冷禅','恒山派':'定逸师太','衡山派':'莫大先生','泰山派':'天门道人',
    '峨眉派':'灭绝师太','丐帮':'洪七公','大旗门':'铁中棠','侠隐阁':'燕南天',
    '药王谷':'药老人','天山派':'天山童姥','铸剑山庄':'欧冶子','茅山派':'林九叔',
    '大隐阁':'观虚子','天书阁':'归藏子','天涯海阁':'花无缺','神机门':'鲁妙子',
    '霹雳堂':'雷震天','昆仑派':'何足道','金刚宗':'鸠摩智','青城派':'余沧海',
    '蓬莱派':'白眉真人','五仙教':'蓝凤凰','逍遥派':'无崖子','唐门':'唐老太太',
    '百花谷':'温蘅','铁掌帮':'裘千仞','修罗宫':'修罗女','阎罗殿':'阎罗王',
    '血手门':'血手人屠','飞蝎坞':'蝎母','烈日教':'烈日法王','天龙教':'天龙王'
};

var SECT_ELDER_SURNAMES = ['赵','钱','孙','李','周','吴','郑','王','冯','陈','褚','卫','蒋','沈','韩','杨','朱','秦','尤','许'];

function registerSectNPCs(sectName) {
    if (typeof window.NPC !== 'function' || typeof window.npcManager?.addNPC !== 'function') return;
    var sect = window.sectsData?.[sectName];
    if (!sect) return;
    var templates = SECT_NPC_TEMPLATES[sect.type] || SECT_NPC_TEMPLATES['中立'];
    var leaderName = SECT_LEADER_NAMES[sectName] || (sectName + '掌门');
    var leaderTitle = templates.leaderTitle;
    var elderTitle = templates.elderTitle;
    var leaderId = 'sect_leader_' + sectName;
    if (window.npcManager.getNPC(leaderId)) return;

    // === P0-4: 优先读取 SPECIAL_NPC_DEFINITIONS 中的固定定义 ===
    var fixedDef = window.SPECIAL_NPC_DEFINITIONS && window.SPECIAL_NPC_DEFINITIONS[leaderId];
    if (fixedDef) {
        var leaderNPC = new window.NPC(leaderId, fixedDef.name, {
            gender: fixedDef.gender || 'male',
            age: fixedDef.age || 40,
            occupation: fixedDef.occupation || leaderTitle,
            location: fixedDef.location || sectName,
            icon: fixedDef.icon || '👤',
            appearance: fixedDef.appearance || {},
            background: fixedDef.background || { origin: sectName, family: '门派传承', history: leaderName + '是' + sectName + '的现任' + leaderTitle, goal: '统领门派', secret: '…' },
            personalityBig5: fixedDef.personalityBig5 || { openness: 60, conscientiousness: 70, extraversion: 50, agreeableness: 40, neuroticism: 30 },
            combat: fixedDef.combat || { level: 50, realm: '金丹', layer: 5, attack: 60, defense: 60, speed: 50, skills: ['内功', '剑法'] },
            state: fixedDef.state || { mood: 50, stress: 30 }
        });
        leaderNPC.relationship.affection = (fixedDef.relationship && fixedDef.relationship.affection != null) ? fixedDef.relationship.affection : 20;
        leaderNPC.relationship.trust = (fixedDef.relationship && fixedDef.relationship.trust != null) ? fixedDef.relationship.trust : 15;
        leaderNPC.relationship.respect = (fixedDef.relationship && fixedDef.relationship.respect != null) ? fixedDef.relationship.respect : 0;
        leaderNPC.relationship.favor = (fixedDef.relationship && fixedDef.relationship.favor != null) ? fixedDef.relationship.favor : 0;
        leaderNPC._isFixedDefinition = true;
        window.npcManager.addNPC(leaderNPC);
        console.log('[固定NPC] 已注册固定定义:', leaderId, fixedDef.name);
    } else {
        // 旧随机生成逻辑（非核心NPC）
        var leaderRealm = '金丹';
        if (sect.power === '巨擘') leaderRealm = '元婴';
        else if (sect.power === '大派') leaderRealm = '金丹';
        
        var leaderNPC = new window.NPC(leaderId, leaderName, {
            gender: Math.random() > 0.5 ? 'male' : 'female',
            age: 40 + Math.floor(Math.random() * 40),
            occupation: leaderTitle,
            location: sectName,
            combat: { level: 50 + Math.floor(Math.random() * 30), realm: leaderRealm, layer: 3 + Math.floor(Math.random() * 5), attack: 60, defense: 60, speed: 50, skills: ['内功', '剑法', '拳掌'] },
            personalityBig5: { openness: 60, conscientiousness: 70, extraversion: 50, agreeableness: 40, neuroticism: 30 },
            background: { origin: sectName, family: '门派传承', history: leaderName + '是' + sectName + '的现任' + leaderTitle + '，统领全派上下。', goal: '带领门派走向繁荣', secret: '…' }
        });
        leaderNPC.relationship.affection = 20;
        window.npcManager.addNPC(leaderNPC);
    }
    
    var elderCount = 1 + Math.floor(Math.random() * 2);
    for (var i = 0; i < elderCount; i++) {
        var elderId = 'sect_elder_' + sectName + '_' + i;
        var elderSurname = SECT_ELDER_SURNAMES[Math.floor(Math.random() * SECT_ELDER_SURNAMES.length)];
        var elderNPC = new window.NPC(elderId, elderSurname + '长老', {
            gender: 'male', age: 35 + Math.floor(Math.random() * 30), occupation: elderTitle, location: sectName,
            combat: { level: 30 + Math.floor(Math.random() * 20), realm: '筑基', layer: 5 + Math.floor(Math.random() * 5), attack: 40, defense: 40, speed: 35, skills: ['内功', '剑法'] },
            personalityBig5: { openness: 50, conscientiousness: 60, extraversion: 40, agreeableness: 50, neuroticism: 40 },
            background: { origin: sectName, family: '', history: '辅佐掌门处理门派事务。', goal: '培养优秀弟子', secret: '…' }
        });
        window.npcManager.addNPC(elderNPC);
    }
    
    var discipleCount = 3 + Math.floor(Math.random() * 3);
    var usedNames = [];
    function getDiscipleName() {
        if (typeof window.nameGenerator?.generateName === 'function') {
            for (var attempt = 0; attempt < 20; attempt++) {
                var nameObj = window.nameGenerator.generateName();
                var fullName = nameObj.full || nameObj;
                if (usedNames.indexOf(fullName) < 0) {
                    usedNames.push(fullName);
                    return fullName;
                }
            }
        }
        return '弟子' + (usedNames.length + 1);
    }
    for (var j = 0; j < discipleCount; j++) {
        var discipleNPC = new window.NPC('sect_disciple_' + sectName + '_' + j, getDiscipleName(), {
            gender: Math.random() > 0.5 ? 'male' : 'female', age: 16 + Math.floor(Math.random() * 14), occupation: '弟子', location: sectName,
            combat: { level: 10 + Math.floor(Math.random() * 20), realm: j < 2 ? '炼气' : '筑基', layer: 1 + Math.floor(Math.random() * 7), attack: 20, defense: 20, speed: 20, skills: ['基础修炼诀'] },
            personalityBig5: { openness: 60, conscientiousness: 50, extraversion: 60, agreeableness: 60, neuroticism: 50 }
        });
        window.npcManager.addNPC(discipleNPC);
    }
}

function registerAllSectNPCs() {
    var sects = window.sectsData || {};
    for (var name in sects) registerSectNPCs(name);
    var total = Object.keys(sects).length;
    // 静默注册，不打扰玩家
    console.log('🏛️ 已为' + total + '个门派注册NPC');
}

function getSectNPCs(sectName) {
    if (!window.npcManager) return [];
    return window.npcManager.getAllNPCs().filter(function(n) { return n.location === sectName; });
}

// ============ 门派专属装备与功法（P3） ============
var SECT_SPECIFIC_EQUIPMENT = {
    '少林寺': { weapon: { id: 'wpn_shaolin_staff', name: '少林棍', quality: 'RARE', level: 10, attrs: { strength: 8, constitution: 5 }, combatBonus: { attack: 25, block: 10 }, icon: '⚔️' }, armor: { id: 'arm_shaolin_robe', name: '少林袈裟', quality: 'RARE', level: 10, defense: 20, attrs: { constitution: 6, willpower: 4 }, icon: '👘' } },
    '武当派': { weapon: { id: 'wpn_wudang_sword', name: '真武剑', quality: 'RARE', level: 10, attrs: { strength: 6, dexterity: 8, intelligence: 4 }, combatBonus: { attack: 28, hit: 5 }, icon: '⚔️' } },
    '峨眉派': { weapon: { id: 'wpn_emei_sword', name: '倚天剑', quality: 'EPIC', level: 18, attrs: { strength: 12, dexterity: 10, intelligence: 8 }, combatBonus: { attack: 45, crit: 8, hit: 5 }, icon: '⚔️' } },
    '丐帮': { weapon: { id: 'wpn_gaibang_staff', name: '打狗棒', quality: 'RARE', level: 12, attrs: { strength: 9, dexterity: 7 }, combatBonus: { attack: 30, crit: 5, block: 5 }, icon: '🔱' } },
    '铸剑山庄': { weapon: { id: 'wpn_zhujian_sword', name: '铸剑', quality: 'EPIC', level: 16, attrs: { strength: 15, dexterity: 8 }, combatBonus: { attack: 40, crit: 10 }, icon: '⚔️' } },
    '唐门': { weapon: { id: 'wpn_tangmen_dart', name: '唐门暗器', quality: 'RARE', level: 10, attrs: { dexterity: 12 }, combatBonus: { attack: 28, hit: 8, crit: 5 }, icon: '🗡️' } },
    '茅山派': { weapon: { id: 'wpn_maoshan_sword', name: '桃木剑', quality: 'UNCOMMON', level: 6, attrs: { intelligence: 8, willpower: 4 }, combatBonus: { attack: 18, hit: 3 }, icon: '⚔️' } }
};

// v15.4 藏经阁分层阅览体系：tier=楼层准入（1外门阁rank≤7 / 2内门阁rank≤5 / 3核心阁rank≤4 / 4镇派阁rank≤3）
// bonus=满掌握时的属性加成（实战按掌握度百分比缩放）；wuxingReq=镇派参悟神识门槛（不足进度减半）；copyPrice=请抄本贡献价
// 批次一16派；其余20派待批次二补全
var SECT_SPECIFIC_ARTS = {
    '少林寺': [
        { id: 'art_shaolin_quan', name: '少林长拳', type: '拳掌', grade: '良品', tier: 1, bonus: { strength: 5 }, copyPrice: 300, desc: '少林入门拳法，刚猛朴实' },
        { id: 'art_sl_luohan', name: '罗汉伏魔功', type: '内功', grade: '上品', tier: 2, bonus: { constitution: 8, willpower: 3 }, copyPrice: 800, desc: '十八罗汉桩合炼的内壮功法' },
        { id: 'art_yi_jin_jing', name: '易筋经', type: '内功', grade: '仙品', tier: 4, wuxingReq: 28, bonus: { constitution: 15, willpower: 8 }, copyPrice: 3000, desc: '少林无上内功，脱胎换骨' }
    ],
    '武当派': [
        { id: 'art_taiji_quan', name: '太极拳', type: '拳掌', grade: '良品', tier: 1, bonus: { willpower: 5 }, copyPrice: 300, desc: '以柔克刚的入门拳法' },
        { id: 'art_wd_chunyang', name: '纯阳无极功', type: '内功', grade: '珍品', tier: 2, bonus: { meridian: 9 }, copyPrice: 800, desc: '武当内丹正宗' },
        { id: 'art_wd_taiji_jian', name: '太极剑意', type: '剑法', grade: '仙品', tier: 4, wuxingReq: 26, bonus: { dexterity: 14, intelligence: 8 }, copyPrice: 3000, desc: '以意驭剑，绵绵不绝' }
    ],
    '峨眉派': [
        { id: 'art_em_jiuyang', name: '峨眉九阳功', type: '内功', grade: '良品', tier: 1, bonus: { constitution: 5 }, copyPrice: 300, desc: '脱胎于九阳神文的入门内功' },
        { id: 'art_em_piaoxue', name: '飘雪穿云掌', type: '拳掌', grade: '珍品', tier: 2, bonus: { dexterity: 9 }, copyPrice: 800, desc: '掌如飞雪，绵里藏针' },
        { id: 'art_em_yitian', name: '倚天屠龙功', type: '剑法', grade: '仙品', tier: 4, wuxingReq: 28, bonus: { strength: 13, dexterity: 10 }, copyPrice: 3000, desc: '峨眉立派的至高剑学' }
    ],
    '丐帮': [
        { id: 'art_gb_tongbei', name: '丐帮通背拳', type: '拳掌', grade: '良品', tier: 1, bonus: { strength: 5 }, copyPrice: 300, desc: '叫花子们赖以防身的粗浅拳脚' },
        { id: 'art_gaibang_staff', name: '打狗棒法', type: '长兵', grade: '珍品', tier: 2, bonus: { strength: 9, dexterity: 5 }, copyPrice: 800, desc: '丐帮帮主嫡传棒法' },
        { id: 'art_gb_xianglong', name: '降龙十八掌·残篇', type: '拳掌', grade: '仙品', tier: 4, wuxingReq: 25, bonus: { strength: 18, constitution: 6 }, copyPrice: 3000, desc: '天下第一刚猛掌力（仅存十五式）' }
    ],
    '唐门': [
        { id: 'art_tm_cuidu', name: '淬毒手法', type: '奇门', grade: '良品', tier: 1, bonus: { dexterity: 5 }, copyPrice: 300, desc: '蜀中暗器手的必修基本功' },
        { id: 'art_tangmen_hidden', name: '唐门暗器术', type: '奇门', grade: '珍品', tier: 2, bonus: { dexterity: 10 }, copyPrice: 800, desc: '唐门不传之秘' },
        { id: 'art_tm_wangu', name: '万蛊噬心术', type: '奇门', grade: '仙品', tier: 4, wuxingReq: 27, bonus: { intelligence: 12, dexterity: 10 }, copyPrice: 3000, desc: '蛊毒暗器合一的禁术' }
    ],
    '逍遥派': [
        { id: 'art_xy_yufeng', name: '逍遥御风诀', type: '轻功', grade: '良品', tier: 1, bonus: { meridian: 5 }, copyPrice: 300, desc: '缥缈峰入门身法' },
        { id: 'art_xiaoyao_zhang', name: '逍遥掌法', type: '拳掌', grade: '珍品', tier: 2, bonus: { intelligence: 6, dexterity: 6 }, copyPrice: 800, desc: '潇洒写意的掌中雅趣' },
        { id: 'art_xy_xiaowuxiang', name: '小无相功', type: '内功', grade: '仙品', tier: 4, wuxingReq: 30, bonus: { intelligence: 15, meridian: 8 }, copyPrice: 3000, desc: '道家清静无为的至高内功' }
    ],
    '修罗宫': [
        { id: 'art_xlg_xuesha', name: '修罗血煞劲', type: '内功', grade: '良品', tier: 1, bonus: { constitution: 5 }, copyPrice: 300, desc: '以痛楚淬炼体魄的入门功' },
        { id: 'art_xiuluo_dao', name: '修罗刀法', type: '刀法', grade: '珍品', tier: 2, bonus: { strength: 11 }, copyPrice: 800, desc: '修罗宫杀戮刀法' },
        { id: 'art_xlg_tianmo', name: '天魔解体大法', type: '内功', grade: '仙品', tier: 4, wuxingReq: 25, bonus: { strength: 16, willpower: 8 }, copyPrice: 3000, desc: '燃血催力的搏命绝学' }
    ],
    '铸剑山庄': [
        { id: 'art_zj_duanti', name: '锻体锤法', type: '拳掌', grade: '良品', tier: 1, bonus: { strength: 5, constitution: 3 }, copyPrice: 300, desc: '打铁先打身的庄内基本功' },
        { id: 'art_zj_xinfa', name: '铸剑心法', type: '内功', grade: '珍品', tier: 2, bonus: { willpower: 9 }, copyPrice: 800, desc: '观炉火三千日方得的心法' },
        { id: 'art_zj_wanjian', name: '万剑归宗诀', type: '剑法', grade: '仙品', tier: 4, wuxingReq: 27, bonus: { strength: 12, dexterity: 12 }, copyPrice: 3000, desc: '剑冢千柄同鸣的传说剑诀' }
    ],
    '茅山派': [
        { id: 'art_ms_jingshen', name: '净身咒', type: '符箓', grade: '良品', tier: 1, bonus: { willpower: 5 }, copyPrice: 300, desc: '茅山弟子的第一道符课' },
        { id: 'art_ms_wulei', name: '五雷符法', type: '符箓', grade: '珍品', tier: 2, bonus: { intelligence: 9 }, copyPrice: 800, desc: '召雷敕鬼的正统符术' },
        { id: 'art_ms_tianshi', name: '天师正印', type: '符箓', grade: '仙品', tier: 4, wuxingReq: 26, bonus: { intelligence: 14, willpower: 10 }, copyPrice: 3000, desc: '茅山历代天师印信之学' }
    ],
    '全真教': [
        { id: 'art_qz_tuna', name: '全真吐纳术', type: '内功', grade: '良品', tier: 1, bonus: { meridian: 5 }, copyPrice: 300, desc: '终南山入门调息之法' },
        { id: 'art_qz_xiantian', name: '先天功', type: '内功', grade: '珍品', tier: 2, bonus: { intelligence: 10 }, copyPrice: 800, desc: '返本归元的道门玄功' },
        { id: 'art_qz_yiqi', name: '一气化三清', type: '内功', grade: '仙品', tier: 4, wuxingReq: 29, bonus: { meridian: 14, intelligence: 9 }, copyPrice: 3000, desc: '全真玄门最高绝学' }
    ],
    '天山派': [
        { id: 'art_ts_zhemei', name: '天山折梅手·基础', type: '拳掌', grade: '良品', tier: 1, bonus: { dexterity: 5 }, copyPrice: 300, desc: '三路折梅手的基础三十六式' },
        { id: 'art_ts_shengsi', name: '生死符秘要', type: '奇门', grade: '珍品', tier: 2, bonus: { intelligence: 9 }, copyPrice: 800, desc: '寒冰薄片的制御之要' },
        { id: 'art_ts_liuyang', name: '天山六阳掌', type: '拳掌', grade: '仙品', tier: 4, wuxingReq: 27, bonus: { dexterity: 13, intelligence: 10 }, copyPrice: 3000, desc: '阳春白雪与雷霆并蓄' }
    ],
    '金刚宗': [
        { id: 'art_jgz_zhuang', name: '金刚桩功', type: '炼体', grade: '良品', tier: 1, bonus: { constitution: 6 }, copyPrice: 300, desc: '密宗苦行的第一桩' },
        { id: 'art_jgz_longxiang_c', name: '龙象般若功·初卷', type: '炼体', grade: '珍品', tier: 2, bonus: { strength: 10 }, copyPrice: 800, desc: '十三层龙象的前七层' },
        { id: 'art_jgz_longxiang', name: '龙象般若功·圆满', type: '炼体', grade: '仙品', tier: 4, wuxingReq: 24, bonus: { strength: 17, constitution: 10 }, copyPrice: 3000, desc: '十龙十象之力，密宗炼体极诣' }
    ],
    '蓬莱派': [
        { id: 'art_pl_guanlan', name: '观澜心法', type: '内功', grade: '良品', tier: 1, bonus: { meridian: 5 }, copyPrice: 300, desc: '观海听涛而悟的入门心法' },
        { id: 'art_pl_canglang', name: '沧浪水诀', type: '法术', grade: '珍品', tier: 2, bonus: { intelligence: 9, meridian: 4 }, copyPrice: 800, desc: '驭水行舟的岛居秘传' },
        { id: 'art_pl_haishi', name: '海市蜃楼幻术', type: '法术', grade: '仙品', tier: 4, wuxingReq: 28, bonus: { intelligence: 13, willpower: 9 }, copyPrice: 3000, desc: '虚实颠倒的海上大幻' }
    ],
    '药王谷': [
        { id: 'art_yw_baicao', name: '百草辨识', type: '医道', grade: '良品', tier: 1, bonus: { constitution: 5 }, copyPrice: 300, desc: '尝百草识药性的谷中童子功课' },
        { id: 'art_yw_qihuang', name: '岐黄之术', type: '医道', grade: '珍品', tier: 2, bonus: { intelligence: 10 }, copyPrice: 800, desc: '医武同源的谷主亲传' },
        { id: 'art_yw_taisu', name: '太素神针', type: '医道', grade: '仙品', tier: 4, wuxingReq: 26, bonus: { intelligence: 12, constitution: 11 }, copyPrice: 3000, desc: '一针定生死的谷中圣手之学' }
    ],
    '华山派': [
        { id: 'art_hs_jianchu', name: '华山剑法·基础', type: '剑法', grade: '良品', tier: 1, bonus: { dexterity: 5 }, copyPrice: 300, desc: '五岳剑派的正统入门剑' },
        { id: 'art_hs_zixia', name: '紫霞神功', type: '内功', grade: '珍品', tier: 2, bonus: { willpower: 10 }, copyPrice: 800, desc: '华山气宗立派之本' },
        { id: 'art_hs_dugu', name: '独孤九剑·总诀式', type: '剑法', grade: '仙品', tier: 4, wuxingReq: 30, bonus: { dexterity: 16, intelligence: 8 }, copyPrice: 3000, desc: '无招胜有招的剑道至理' }
    ],
    '昆仑派': [
        { id: 'art_kl_liangyi_c', name: '昆仑两仪剑·基础', type: '剑法', grade: '良品', tier: 1, bonus: { dexterity: 5 }, copyPrice: 300, desc: '西域玄门的阴阳初剑' },
        { id: 'art_kl_xiangji', name: '两仪相济诀', type: '内功', grade: '珍品', tier: 2, bonus: { willpower: 9, dexterity: 4 }, copyPrice: 800, desc: '阴阳互济的调和之道' },
        { id: 'art_kl_tianqing', name: '天清诀', type: '内功', grade: '仙品', tier: 4, wuxingReq: 28, bonus: { meridian: 13, intelligence: 10 }, copyPrice: 3000, desc: '昆仑镇山的清微玄功' }
    ],
    '嵩山派': [
        { id: 'art_ss_jianchu', name: '嵩山剑法·基础', type: '剑法', grade: '良品', tier: 1, bonus: { dexterity: 5 }, copyPrice: 300, desc: '十七路嵩山剑，长枪大戟般堂皇' },
        { id: 'art_ss_dasongyang', name: '大嵩阳神掌', type: '拳掌', grade: '珍品', tier: 2, bonus: { strength: 9, willpower: 4 }, copyPrice: 800, desc: '五岳盟主威震群雄的掌力' },
        { id: 'art_ss_hanbing', name: '寒冰真气', type: '内功', grade: '仙品', tier: 4, wuxingReq: 27, bonus: { intelligence: 13, willpower: 10 }, copyPrice: 3000, desc: '真气所至，寒霜凝结的左氏秘传' }
    ],
    '泰山派': [
        { id: 'art_ta_jianchu', name: '泰山剑法·基础', type: '剑法', grade: '良品', tier: 1, bonus: { dexterity: 5 }, copyPrice: 300, desc: '五岳剑派的厚重入门剑' },
        { id: 'art_ta_shibapan', name: '泰山十八盘', type: '剑法', grade: '珍品', tier: 2, bonus: { dexterity: 8, strength: 4 }, copyPrice: 800, desc: '越盘越高，越行越险' },
        { id: 'art_ta_daizong', name: '岱宗如何', type: '剑法', grade: '仙品', tier: 4, wuxingReq: 30, bonus: { intelligence: 14, dexterity: 11 }, copyPrice: 3000, desc: '算尽敌我方位方能出手——难学无比' }
    ],
    '恒山派': [
        { id: 'art_heng_jianchu', name: '恒山剑法·基础', type: '剑法', grade: '良品', tier: 1, bonus: { dexterity: 5 }, copyPrice: 300, desc: '绵密严谨，以守代攻' },
        { id: 'art_heng_mianlizhen', name: '绵里藏针', type: '剑法', grade: '珍品', tier: 2, bonus: { dexterity: 7, willpower: 4 }, copyPrice: 800, desc: '棉里裹针，后发制人' },
        { id: 'art_heng_wanhua', name: '万花剑法', type: '剑法', grade: '仙品', tier: 4, wuxingReq: 26, bonus: { dexterity: 12, willpower: 10 }, copyPrice: 3000, desc: '恒山诸尼镇寺之宝' }
    ],
    '衡山派': [
        { id: 'art_hy_jianchu', name: '衡山剑法·基础', type: '剑法', grade: '良品', tier: 1, bonus: { dexterity: 5 }, copyPrice: 300, desc: '潇湘夜雨的前三十六路' },
        { id: 'art_hy_huifeng', name: '回风落雁剑', type: '剑法', grade: '珍品', tier: 2, bonus: { dexterity: 9, intelligence: 4 }, copyPrice: 800, desc: '一剑落九雁' },
        { id: 'art_hy_wushen', name: '衡山五神剑', type: '剑法', grade: '仙品', tier: 4, wuxingReq: 29, bonus: { dexterity: 13, intelligence: 10 }, copyPrice: 3000, desc: '天柱紫盖芙蓉石廪祝融，五剑相辅，森罗万象' }
    ],
    '大旗门': [
        { id: 'art_dq_changquan', name: '大旗门长拳', type: '拳掌', grade: '良品', tier: 1, bonus: { strength: 5, constitution: 3 }, copyPrice: 300, desc: '旗门子弟白日扛旗、夜里练拳' },
        { id: 'art_dq_tiexue', name: '铁血旗功', type: '内功', grade: '珍品', tier: 2, bonus: { strength: 10 }, copyPrice: 800, desc: '霸烈刚猛的旗门内功' },
        { id: 'art_dq_fengyun', name: '大旗风云掌', type: '拳掌', grade: '仙品', tier: 4, wuxingReq: 25, bonus: { strength: 16, constitution: 8 }, copyPrice: 3000, desc: '掌出如旗卷风雷' }
    ],
    '侠隐阁': [
        { id: 'art_xia_zhengqi', name: '侠隐正气功', type: '内功', grade: '良品', tier: 1, bonus: { willpower: 5 }, copyPrice: 300, desc: '书院弟子晨课必修' },
        { id: 'art_xia_jianfa', name: '侠隐剑法', type: '剑法', grade: '珍品', tier: 2, bonus: { dexterity: 8, willpower: 3 }, copyPrice: 800, desc: '阁中所授的江湖实用剑技' },
        { id: 'art_xia_zhida', name: '侠之大者诀', type: '内功', grade: '仙品', tier: 4, wuxingReq: 28, bonus: { willpower: 14, constitution: 9 }, copyPrice: 3000, desc: '侠之大者，为国为民' }
    ],
    '天涯海阁': [
        { id: 'art_ty_xianyin', name: '弦音入定', type: '音律', grade: '良品', tier: 1, bonus: { intelligence: 5 }, copyPrice: 300, desc: '以琴音凝神的雅乐入门' },
        { id: 'art_ty_luoxia', name: '落霞笔法', type: '奇门', grade: '珍品', tier: 2, bonus: { dexterity: 9 }, copyPrice: 800, desc: '笔走龙蛇，点石成锋' },
        { id: 'art_ty_gaoshan', name: '高山流水曲', type: '音律', grade: '仙品', tier: 4, wuxingReq: 28, bonus: { intelligence: 13, meridian: 9 }, copyPrice: 3000, desc: '一曲既罢，敌胆自寒' }
    ],
    '神机门': [
        { id: 'art_sj_qianji', name: '千机匣·初制', type: '奇门', grade: '良品', tier: 1, bonus: { dexterity: 5 }, copyPrice: 300, desc: '机关弟子的第一具暗匣' },
        { id: 'art_sj_kuilei', name: '傀儡线操控术', type: '奇门', grade: '珍品', tier: 2, bonus: { intelligence: 9, dexterity: 4 }, copyPrice: 800, desc: '十指悬丝，傀儡如生' },
        { id: 'art_sj_wanji', name: '万机归一术', type: '奇门', grade: '仙品', tier: 4, wuxingReq: 28, bonus: { intelligence: 15, dexterity: 9 }, copyPrice: 3000, desc: '百械同鸣的机关至境' }
    ],
    '霹雳堂': [
        { id: 'art_pili_tiaoyao', name: '调药引火术', type: '奇门', grade: '良品', tier: 1, bonus: { intelligence: 5 }, copyPrice: 300, desc: '硝硫配比的看家本事' },
        { id: 'art_pili_leihuo', name: '雷火掌', type: '拳掌', grade: '珍品', tier: 2, bonus: { strength: 9 }, copyPrice: 800, desc: '掌中蕴火，触之即燃' },
        { id: 'art_pili_jiuxiao', name: '九霄霹雳诀', type: '奇门', grade: '仙品', tier: 4, wuxingReq: 26, bonus: { intelligence: 12, strength: 10 }, copyPrice: 3000, desc: '雷火倾天的堂中至宝' }
    ],
    '大隐阁': [
        { id: 'art_dy_cangfeng', name: '藏锋养气功', type: '内功', grade: '良品', tier: 1, bonus: { willpower: 5 }, copyPrice: 300, desc: '大隐隐于市的养气之道' },
        { id: 'art_dy_wuhen', name: '无痕剑意', type: '剑法', grade: '珍品', tier: 2, bonus: { dexterity: 9 }, copyPrice: 800, desc: '出剑无痕，收剑无迹' },
        { id: 'art_dy_chaoshi', name: '大隐朝市诀', type: '内功', grade: '仙品', tier: 4, wuxingReq: 29, bonus: { intelligence: 13, willpower: 10 }, copyPrice: 3000, desc: '隐于朝市而天下知' }
    ],
    '天书阁': [
        { id: 'art_tsg_qimeng', name: '天书启蒙录', type: '文道', grade: '良品', tier: 1, bonus: { intelligence: 5 }, copyPrice: 300, desc: '万卷楼童子的开蒙课本' },
        { id: 'art_tsg_baijia', name: '百家杂学', type: '文道', grade: '珍品', tier: 2, bonus: { intelligence: 10 }, copyPrice: 800, desc: '医卜星相，无一不窥' },
        { id: 'art_tsg_canjuan', name: '天书残卷·总纲', type: '文道', grade: '仙品', tier: 4, wuxingReq: 30, bonus: { intelligence: 16, willpower: 8 }, copyPrice: 3000, desc: '传说中失落的天书总纲' }
    ],
    '铁掌帮': [
        { id: 'art_tz_tiesha_c', name: '铁砂掌·粗功', type: '拳掌', grade: '良品', tier: 1, bonus: { strength: 6 }, copyPrice: 300, desc: '插沙三百日的帮众底子' },
        { id: 'art_tz_tiezhang', name: '铁掌功', type: '拳掌', grade: '珍品', tier: 2, bonus: { strength: 10 }, copyPrice: 800, desc: '裘氏一门立帮之技' },
        { id: 'art_tz_heisha', name: '黑煞掌', type: '拳掌', grade: '仙品', tier: 4, wuxingReq: 25, bonus: { strength: 17, constitution: 7 }, copyPrice: 3000, desc: '掌风过处，金石俱裂' }
    ],
    '百花谷': [
        { id: 'art_bh_tuna', name: '花间吐纳', type: '内功', grade: '良品', tier: 1, bonus: { constitution: 5 }, copyPrice: 300, desc: '伴花而息的谷中功课' },
        { id: 'art_bh_chunni', name: '春泥护元术', type: '医道', grade: '珍品', tier: 2, bonus: { intelligence: 9, constitution: 4 }, copyPrice: 800, desc: '落红化春泥的疗愈之学' },
        { id: 'art_bh_wenhua', name: '百花缭乱剑', type: '剑法', grade: '仙品', tier: 4, wuxingReq: 27, bonus: { dexterity: 13, intelligence: 10 }, copyPrice: 3000, desc: '万花丛中过，片叶不沾身' }
    ],
    '五仙教': [
        { id: 'art_wxj_yuchong', name: '驭虫小术', type: '奇门', grade: '良品', tier: 1, bonus: { intelligence: 5 }, copyPrice: 300, desc: '苗疆孩童也会的两手驱虫咒' },
        { id: 'art_wxj_gujing', name: '五仙蛊经', type: '奇门', grade: '珍品', tier: 2, bonus: { intelligence: 10 }, copyPrice: 800, desc: '南疆巫蛊正统的蛊经' },
        { id: 'art_wxj_wanshi', name: '千蛊万噬天', type: '奇门', grade: '仙品', tier: 4, wuxingReq: 27, bonus: { intelligence: 14, willpower: 9 }, copyPrice: 3000, desc: '放蛊成云，遮天蔽日' }
    ],
    '阎罗殿': [
        { id: 'art_yl_kaishan', name: '开山路刀法', type: '刀法', grade: '良品', tier: 1, bonus: { strength: 5 }, copyPrice: 300, desc: '殿前开路弟子的劈山刀' },
        { id: 'art_yl_shengsi', name: '生死判', type: '刀法', grade: '珍品', tier: 2, bonus: { strength: 11 }, copyPrice: 800, desc: '一笔判生死的大殿刑刀' },
        { id: 'art_yl_shidian', name: '十殿阎罗刀', type: '刀法', grade: '仙品', tier: 4, wuxingReq: 24, bonus: { strength: 18, willpower: 7 }, copyPrice: 3000, desc: '十殿齐开，恶鬼让路' }
    ],
    '天龙教': [
        { id: 'art_tl_mizhou', name: '天龙密咒', type: '内功', grade: '良品', tier: 1, bonus: { willpower: 5 }, copyPrice: 300, desc: '西域魔教的持咒功夫' },
        { id: 'art_tl_dashouyin', name: '天龙大手印', type: '拳掌', grade: '珍品', tier: 2, bonus: { strength: 10, willpower: 4 }, copyPrice: 800, desc: '一印压一城' },
        { id: 'art_tl_huaxue', name: '化血魔功', type: '内功', grade: '仙品', tier: 4, wuxingReq: 26, bonus: { strength: 14, constitution: 9 }, copyPrice: 3000, desc: '饮血催功的魔教禁术' }
    ],
    '烈日教': [
        { id: 'art_lj_puri', name: '曝日桩', type: '炼体', grade: '良品', tier: 1, bonus: { constitution: 6 }, copyPrice: 300, desc: '烈日下站桩的教中苦行' },
        { id: 'art_lj_zhenyan', name: '烈日真焰', type: '法术', grade: '珍品', tier: 2, bonus: { intelligence: 9, strength: 4 }, copyPrice: 800, desc: '掌心凝出一簇不灭日光' },
        { id: 'art_lj_fentian', name: '大日焚天功', type: '内功', grade: '仙品', tier: 4, wuxingReq: 25, bonus: { intelligence: 13, strength: 12 }, copyPrice: 3000, desc: '焚天之焰，教主亲传' }
    ],
    '血手门': [
        { id: 'art_xsm_fugu_c', name: '腐骨掌·粗功', type: '拳掌', grade: '良品', tier: 1, bonus: { strength: 5 }, copyPrice: 300, desc: '浸药水泡出的第一层阴劲' },
        { id: 'art_xsm_xuesha', name: '血煞爪', type: '拳掌', grade: '珍品', tier: 2, bonus: { strength: 9, dexterity: 4 }, copyPrice: 800, desc: '五指见血，创口难愈' },
        { id: 'art_xsm_xuehai', name: '万劫血海功', type: '内功', grade: '仙品', tier: 4, wuxingReq: 24, bonus: { strength: 15, constitution: 9 }, copyPrice: 3000, desc: '血海翻涌，生生不息的邪功' }
    ],
    '青城派': [
        { id: 'art_qc_jianchu', name: '青城剑法·基础', type: '剑法', grade: '良品', tier: 1, bonus: { dexterity: 5 }, copyPrice: 300, desc: '蜀中剑派的看门剑' },
        { id: 'art_qc_songfeng', name: '松风剑法', type: '剑法', grade: '珍品', tier: 2, bonus: { dexterity: 9, willpower: 4 }, copyPrice: 800, desc: '如松之劲，如风之迅' },
        { id: 'art_qc_cuixin', name: '摧心掌', type: '拳掌', grade: '仙品', tier: 4, wuxingReq: 26, bonus: { strength: 13, intelligence: 10 }, copyPrice: 3000, desc: '震碎人心，不露痕迹' }
    ],
    '飞蝎坞': [
        { id: 'art_fx_fushui', name: '水乡凫水诀', type: '轻功', grade: '良品', tier: 1, bonus: { dexterity: 5 }, copyPrice: 300, desc: '江南水网里的保命泳技' },
        { id: 'art_fx_xiewei', name: '蝎尾针法', type: '奇门', grade: '珍品', tier: 2, bonus: { dexterity: 10 }, copyPrice: 800, desc: '针出如蝎尾摆尾，专挑筋缝' },
        { id: 'art_fx_xiewang', name: '蝎王噬心刺', type: '奇门', grade: '仙品', tier: 4, wuxingReq: 27, bonus: { dexterity: 13, intelligence: 10 }, copyPrice: 3000, desc: '坞主亲传的一刺封喉' }
    ]
};

// v20.8：核心阁（tier3，亲传弟子准入，见 canAccessScriptureTier）此前全派空置——
// 每派补一部"承脉要诀"，属性加成取本派二/四层功法的中段，填补 良→珍→仙 的成长台阶。
(function fillTier3Arts() {
    var seq = 0;
    for (var sectName in SECT_SPECIFIC_ARTS) {
        var arts = SECT_SPECIFIC_ARTS[sectName];
        if (!Array.isArray(arts) || !arts.length) continue;
        var has3 = false, t2 = null, t4 = null;
        for (var i = 0; i < arts.length; i++) {
            if (arts[i].tier === 3) has3 = true;
            if (arts[i].tier === 2) t2 = arts[i];
            if (arts[i].tier === 4) t4 = arts[i];
        }
        if (has3) continue;
        var bonus = {};
        var src = [t2, t4];
        for (var s = 0; s < src.length; s++) {
            var b = src[s] && src[s].bonus;
            if (!b) continue;
            for (var k in b) bonus[k] = Math.max(bonus[k] || 0, Math.round(b[k] * (s === 0 ? 1.3 : 0.6)));
        }
        seq++;
        arts.push({
            id: 'art_core_' + seq,
            name: sectName + '·承脉要诀',
            type: (t4 && t4.type) || (t2 && t2.type) || '内功',
            grade: '珍品',
            tier: 3,
            bonus: bonus,
            copyPrice: 1500,
            desc: '历代执堂长老接续补注的本派要诀，接了本派的脉才读得懂。'
        });
    }
})();

function getSectEquipment(sectName) { return SECT_SPECIFIC_EQUIPMENT[sectName] || null; }
function getSectArts(sectName) { return SECT_SPECIFIC_ARTS[sectName] || []; }

// v19.0 P0-3 批次 B1：按玩家职位过滤可阅览的本派功法（藏经阁分层阅览体系）
// 长老（id<=2）= tier 4 镇派；亲传=3；内门=2；外门/记名/杂役=1
// 未入宗或侍妾/同参 → 空数组（不开放）
function getReadableSectArts(sectName) {
    var arts = getSectArts(sectName);
    if (!Array.isArray(arts) || !arts.length) return [];
    var can = window.canAccessScriptureTier;
    if (typeof can !== 'function') return arts; // 守卫：v19.0 工具函数未加载时退化为全部可见
    return arts.filter(function (art) { return can(Number(art.tier) || 1); });
}

function registerSectSpecificItems(sectName) {
    var equip = getSectEquipment(sectName);
    var arts = getSectArts(sectName);
    if (equip) {
        [equip.weapon, equip.armor].forEach(function(item) {
            if (item && !window.itemById[item.id]) {
                window.allItems.push(Object.assign({}, { type: 'equipment', slot: item.slot || 'mainHand', category: 'equipment', stackable: false }, item));
                window.itemById[item.id] = item;
            }
        });
    }
    arts.forEach(function(art) {
        if (!window.itemById[art.id]) {
            var artItem = { id: art.id, name: art.name, type: 'secret_art', subtype: 'sect_art', category: 'secret_art', quality: art.grade === '仙品' ? 'LEGENDARY' : 'RARE', level: art.tier || 1, price: art.copyPrice || 300, effect: {}, desc: art.desc, icon: '📖' };
            window.allItems.push(artItem);
            window.itemById[art.id] = artItem;
        }
    });
}

function registerAllSectSpecificItems() {
    for (var name in SECT_SPECIFIC_EQUIPMENT) registerSectSpecificItems(name);
    for (var name in SECT_SPECIFIC_ARTS) registerSectSpecificItems(name);
}

// ============ 门派声望互斥系统（P4） ============
var SECT_REPUTATION_EFFECTS = {
    '正道': { self: 30, opposite: -30, neutral: -10 },
    '邪派': { self: 30, opposite: -30, neutral: -10 },
    '中立': { self: 10, opposite: -5, neutral: 5 }
};

function applySectReputationEffects(sectName, sectType) {
    if (!window.changeFactionReputation || !window.sectsData) return;
    var effects = SECT_REPUTATION_EFFECTS[sectType] || SECT_REPUTATION_EFFECTS['中立'];
    var sects = window.sectsData;
    var selfChanged = false, oppChanged = false;
    for (var name in sects) {
        if (name === sectName) continue;
        var otherType = sects[name].type;
        if (otherType === sectType) { window.changeFactionReputation(name, effects.self); selfChanged = true; }
        else if ((sectType === '正道' && otherType === '邪派') || (sectType === '邪派' && otherType === '正道')) { window.changeFactionReputation(name, effects.opposite); oppChanged = true; }
        else { window.changeFactionReputation(name, effects.neutral); }
    }
    var msg = '🏛️ 门派声望变化：';
    if (selfChanged) msg += '同门声望+' + effects.self + ' ';
    if (oppChanged) msg += '敌对声望' + effects.opposite + ' ';
    if (typeof window.showMessage === 'function') window.showMessage(msg, 'info');
}

// ============ 导出 ============
if (typeof window !== 'undefined') {
    window.SECT_INTERNAL = SECT_INTERNAL;
    window.getSectEconomySnapshot = getSectEconomySnapshot;
    window.processAllSectDailyEconomy = processAllSectDailyEconomy;
    window.generateSectDisciples = generateSectDisciples;
    window.holdSectMeeting = holdSectMeeting;
    window.getSectSummary = getSectSummary;
    window.getSectMorale = getSectMorale;
    window.initAllSectInternal = initAllSectInternal;
    window.registerSectNPCs = registerSectNPCs;
    window.registerAllSectNPCs = registerAllSectNPCs;
    window.getSectNPCs = getSectNPCs;
    window.SECT_LEADER_NAMES = SECT_LEADER_NAMES;
    window.SECT_SPECIFIC_EQUIPMENT = SECT_SPECIFIC_EQUIPMENT;
    window.SECT_SPECIFIC_ARTS = SECT_SPECIFIC_ARTS;
    window.getSectEquipment = getSectEquipment;
    window.getSectArts = getSectArts;
    window.getReadableSectArts = getReadableSectArts;
    window.registerSectSpecificItems = registerSectSpecificItems;
    window.registerAllSectSpecificItems = registerAllSectSpecificItems;
    window.applySectReputationEffects = applySectReputationEffects;
    window.SECT_REPUTATION_EFFECTS = SECT_REPUTATION_EFFECTS;
}

// v18.9 路线图 P0-2：宗门资源真实日结由 newDay 事件统一驱动，
// 与门派日结、寿元、世界日历共享 newDay chokepoint，避免多模块互相包装。
// processAllSectDailyEconomy 内部已用 lastEconomyDay 幂等，重放安全。
if (typeof window !== 'undefined' && window.EventBus && typeof window.EventBus.on === 'function' && typeof window.processAllSectDailyEconomy === 'function') {
    window.EventBus.on('newDay', function (payload) {
        try {
            var day = payload && typeof payload.newDay === 'number' ? payload.newDay : ((window.timeSystem && window.timeSystem.gameTime) ? window.timeSystem.gameTime.currentDay : null);
            if (day == null) return;
            window.processAllSectDailyEconomy(day);
        } catch (e) { /* 静默：资源日结失败不应阻塞世界推进 */ }
    });
}