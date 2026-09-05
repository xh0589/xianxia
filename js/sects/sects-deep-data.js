// ==================== sects-deep-data.js - 门派深度数据（v10.0） ====================
// 包含第一梯队+第二梯队共16个门派的深度数据
// 数据驱动：师徒/职务/派系/任务/事件/掌门
// 加载顺序：在sects-system.js之后，sect-visit.js之前

var SECT_DEEP_DATA = {};

// ============ 通用职务体系（所有门派共用） ============
var COMMON_RANKS = [
    { id: 7, name: '杂役弟子', desc: '纯后勤劳动力（挑水、砍柴）',
      privileges: ['基础住宿', '公共食堂'], duties: ['打扫庭院', '挑水劈柴', '厨房帮工'],
      dailyTaskCount: 1, salary: { copper: 10, spiritStones: 0 }, contributionPerTask: 5 },
    { id: 6, name: '记名弟子', desc: '试用期/预备役（没有正式师承）',
      privileges: ['基础住宿', '公共食堂', '藏经阁一层'],
      duties: ['自学打杂', '表现好升外门'],
      dailyTaskCount: 2, salary: { copper: 20, spiritStones: 1 }, contributionPerTask: 8,
      promoteCondition: { contribution: 100 } },
    { id: 5, name: '外门弟子', desc: '普通班（门派的基础门面）',
      privileges: ['基础住宿', '公共食堂', '藏经阁一层', '演武场'],
      duties: ['日常巡逻', '采集物资', '协助杂务'],
      dailyTaskCount: 2, salary: { copper: 30, spiritStones: 2 }, contributionPerTask: 10,
      promoteCondition: { contribution: 300 } },
    { id: 4, name: '内门弟子', desc: '重点班精英（门派中坚力量）',
      privileges: ['单间住宿', '小灶食堂', '藏经阁二层', '演武场', '修炼洞府'],
      duties: ['教导外门弟子', '外出执行任务', '参加门派活动'],
      dailyTaskCount: 2, salary: { copper: 60, spiritStones: 5 }, contributionPerTask: 20,
      promoteCondition: { contribution: 800 } },
    { id: 3, name: '亲传弟子', desc: '核心种子（掌门/长老关门弟子）',
      privileges: ['独立院落', '专属修炼室', '藏经阁三层', '丹药供应', '兵器库'],
      duties: ['代表门派出战', '协助长老理事', '培养新弟子'],
      dailyTaskCount: 1, salary: { copper: 100, spiritStones: 15 }, contributionPerTask: 35,
      promoteCondition: { contribution: 2000 } },
    { id: 2, name: '长老', desc: '各部门负责人（传功/戒律/兵器）',
      privileges: ['长老院', '收徒资格', '决策投票权', '所有资源优先'],
      duties: ['教导弟子', '参与决策', '守卫门派'],
      dailyTaskCount: 0, salary: { copper: 300, spiritStones: 60 },
      promoteCondition: { contribution: 6000 } },
    { id: 1, name: '副掌门', desc: '核心管理层（管刑罚/财政）',
      privileges: ['副掌门殿', '管理权限', '传承功法', '所有资源优先'],
      duties: ['协助掌门', '管理门派', '外交决策'],
      dailyTaskCount: 0, salary: { copper: 400, spiritStones: 80 },
      promoteCondition: { contribution: 12000 } },
    { id: 0, name: '掌门', desc: '精神领袖+最终决策者（不可通过晋升获得）',
      privileges: ['掌门大殿', '最高决策权', '传承功法', '所有资源无限'],
      duties: ['统领门派', '外交决策', '传承道统'],
      dailyTaskCount: 0, salary: { copper: 500, spiritStones: 100 },
      promoteCondition: null }
];

// ============ 通用日常任务模板 ============
// v20.53：每桩差事都有真实的工夫——耗时与精力写进条目，执行时照扣。
// 之前是"点击即完成"，无成本无复核，点十下白拿十份贡献。
var COMMON_TASKS = [
    { id: 'task_clean', name: '打扫庭院', desc: '保持门派环境整洁', minRank: 7, cost: { energy: 10, minutes: 40 }, reward: { contribution: 5, exp: 10 } },
    { id: 'task_chores', name: '杂务帮工', desc: '协助厨房/仓库等杂务', minRank: 7, cost: { energy: 15, minutes: 60 }, reward: { contribution: 5, exp: 8 } },
    { id: 'task_patrol', name: '山门巡逻', desc: '在山门周围巡逻', minRank: 6, cost: { energy: 20, minutes: 60 }, reward: { contribution: 10, exp: 15 } },
    { id: 'task_gather', name: '采集物资', desc: '采集门派所需物资', minRank: 6, cost: { energy: 20, minutes: 90 }, reward: { contribution: 10, exp: 20 } },
    { id: 'task_teach', name: '教导新弟子', desc: '指导新入门弟子修炼', minRank: 5, cost: { energy: 15, minutes: 60 }, reward: { contribution: 20, exp: 30 } },
    { id: 'task_hunt', name: '下山除妖', desc: '处理附近的妖患', minRank: 5, cost: { energy: 30, minutes: 120 }, reward: { contribution: 25, exp: 40, spiritStones: 20 } },
    { id: 'task_train', name: '演练武艺', desc: '在演武场演练门派武学', minRank: 4, cost: { energy: 25, minutes: 90 }, reward: { contribution: 35, exp: 50 } },
    { id: 'task_manage', name: '管理事务', desc: '协助处理门派日常管理', minRank: 3, cost: { energy: 15, minutes: 60 }, reward: { contribution: 50, exp: 60, spiritStones: 30 } },
    { id: 'task_lecture', name: '开坛讲道', desc: '为弟子们讲解道法武学', minRank: 2, cost: { energy: 25, minutes: 120 }, reward: { contribution: 80, exp: 100, spiritStones: 50 } },
    { id: 'task_diplomacy', name: '外交出访', desc: '代表门派前往其他门派交流', minRank: 2, cost: { energy: 35, minutes: 240 }, reward: { contribution: 100, exp: 120, fame: 3 } }
];

// ============ 门派深度数据配置 ============
function initSectsDeepData() {
    // 少林寺
    SECT_DEEP_DATA['少林寺'] = {
        desc: '佛门正宗，天下武学之源。禅武合一，以慈悲为怀，普度众生。',
        masters: [
            { id: 'sl_master_1', name: '释玄慈', title: '方丈', realm: '金丹', layer: 9, age: 75,
              desc: '少林寺方丈，佛法精深，武功深不可测。', personality: '慈悲为怀，公正严明',
              skills: ['少林长拳', '达摩剑法', '易筋经', '金刚不坏神功'],
              acceptStudent: true, maxStudents: 2, requirement: { realm: '筑基', layer: 5, contribution: 800 } },
            { id: 'sl_master_2', name: '释玄苦', title: '达摩院首座', realm: '金丹', layer: 6, age: 68,
              desc: '达摩院首座，精研佛法与武学，教导弟子极为严格。', personality: '严谨刚直，一丝不苟',
              skills: ['少林长拳', '达摩剑法', '易筋经'],
              acceptStudent: true, maxStudents: 3, requirement: { realm: '筑基', layer: 3, contribution: 500 } },
            { id: 'sl_master_3', name: '释玄悲', title: '戒律院首座', realm: '金丹', layer: 5, age: 65,
              desc: '戒律院首座，执掌少林戒律，铁面无私。', personality: '铁面无私，刚正不阿',
              skills: ['少林长拳', '金刚掌', '金钟罩'],
              acceptStudent: true, maxStudents: 2, requirement: { realm: '筑基', layer: 2, contribution: 400 } },
            { id: 'sl_master_4', name: '释玄痛', title: '般若堂首座', realm: '金丹', layer: 4, age: 62,
              desc: '般若堂首座，精通天下武学，博闻强识。', personality: '博学多闻，循循善诱',
              skills: ['少林长拳', '拈花指', '多罗叶指'],
              acceptStudent: true, maxStudents: 3, requirement: { realm: '炼气', layer: 8, contribution: 300 } },
            { id: 'sl_master_5', name: '释慧明', title: '罗汉堂首座', realm: '筑基', layer: 9, age: 55,
              desc: '罗汉堂首座，武功刚猛，擅长老拳。', personality: '豪爽直率，热心助人',
              skills: ['少林长拳', '韦陀掌', '伏虎拳'],
              acceptStudent: true, maxStudents: 4, requirement: { realm: '炼气', layer: 5, contribution: 150 } }
        ],
        factions: [
            { id: 'sl_faction_chan', name: '禅宗派', icon: '🧘', desc: '主张以佛法为本，武功为末，注重心性修持。',
              leader: '释玄慈', members: ['释玄苦'], stance: { expansion: -20, reform: -10, orthodox: 30 }, influence: 45 },
            { id: 'sl_faction_wu', name: '武宗派', icon: '⚔️', desc: '主张武学济世，降妖伏魔，积极参与江湖事务。',
              leader: '释玄痛', members: ['释慧明'], stance: { expansion: 20, reform: 10, orthodox: 10 }, influence: 30 },
            { id: 'sl_faction_law', name: '戒律派', icon: '📜', desc: '主张严守戒律，维护少林清规。',
              leader: '释玄悲', members: [], stance: { expansion: -10, reform: -20, orthodox: 40 }, influence: 25 }
        ],
        specialResources: [
            { id: 'sl_resource_damojie', name: '达摩洞', type: 'training', output: 15, desc: '达摩面壁之地，修炼圣地' },
            { id: 'sl_resource_sutra', name: '藏经阁', type: 'knowledge', output: 10, desc: '收藏天下武学典籍' },
            { id: 'sl_resource_tower', name: '塔林', type: 'herb', output: 5, desc: '历代高僧安息之地，灵气浓郁' }
        ],
        events: [
            { id: 'sl_event_1', name: '达摩诞辰', icon: '🧘', desc: '达摩祖师诞辰，全寺举行法会。',
              condition: { season: 'autumn' }, stages: [
                { stage: 1, text: '达摩诞辰日，少林寺举行盛大法会，香客云集。',
                  choices: [{ text: '参加法会，聆听方丈讲经', effect: 'exp+80, contribution+30', next: 2 },
                            { text: '在寺中帮忙接待香客', effect: 'contribution+40', next: -1 }] },
                { stage: 2, text: '方丈讲经完毕，众人皆有所悟。',
                  choices: [{ text: '闭关参悟所得', effect: 'exp+50', next: -1 },
                            { text: '与同门交流心得', effect: 'contribution+20', next: -1 }] }
              ] },
            { id: 'sl_event_2', name: '魔教犯境', icon: '⚔️', desc: '魔教企图攻占少林。',
              condition: { random: 0.08 }, stages: [
                { stage: 1, text: '魔教大举来犯，少林寺紧急召集全寺弟子！',
                  choices: [{ text: '随罗汉堂出寺迎敌', effect: 'contribution+80, exp+50', next: 2 },
                            { text: '守护藏经阁', effect: 'contribution+40', next: -1 }] },
                { stage: 2, text: '经过激战，魔教被击退。',
                  choices: [{ text: '救治受伤弟子', effect: 'contribution+30', next: -1 },
                            { text: '打扫战场', effect: 'item_random', next: -1 }] }
              ] }
        ]
    };

    // 药王谷
    SECT_DEEP_DATA['药王谷'] = {
        desc: '医者仁心，精研药理。不问世事，只救世人。谷中遍植灵药，乃天下医修圣地。',
        masters: [
            { id: 'yw_master_1', name: '孙思邈', title: '谷主', realm: '金丹', layer: 7, age: 85,
              desc: '药王谷谷主，医术通神，人称"活神仙"。', personality: '慈祥和蔼，悲天悯人',
              skills: ['回春术', '金针渡穴', '九转还魂'],
              acceptStudent: true, maxStudents: 2, requirement: { realm: '筑基', layer: 3, contribution: 600, medicine: 40 } },
            { id: 'yw_master_2', name: '李时珍', title: '长老', realm: '金丹', layer: 4, age: 70,
              desc: '药王谷长老，遍尝百草，著有《本草纲目》。', personality: '严谨求实，精益求精',
              skills: ['草药辨识', '炼丹术', '针灸术'],
              acceptStudent: true, maxStudents: 3, requirement: { realm: '炼气', layer: 7, contribution: 300, medicine: 25 } },
            { id: 'yw_master_3', name: '华若兰', title: '长老', realm: '筑基', layer: 8, age: 50,
              desc: '药王谷长老，擅治疑难杂症，尤其精通毒术。', personality: '温婉沉静，心思细腻',
              skills: ['解毒术', '炼丹术', '金针渡穴'],
              acceptStudent: true, maxStudents: 3, requirement: { realm: '炼气', layer: 4, contribution: 150, medicine: 15 } },
            // v20.3 男主·芩木（谷主继承人，医毒双修）——与孙思邈（masters 教学线）并存；不收徒，承载秘密
            { id: 'yw_master_4', name: '芩木', title: '谷主继承人', realm: '金丹', layer: 5, age: 28,
              desc: '药王谷谷主继承人，人称「温润毒医」。医毒双修，性温润却眼底不达底。', personality: '温润锋芒，一诺千金',
              skills: ['青囊经', '百毒不侵体', '金针渡穴'],
              secrets: {
                  'su_secret_01': {
                      id: 'su_secret_01', title: '温润的来历',
                      content: '芩木的温润是修行戒律——七岁那场瘟，他师父临终说「医者不能带情绪，笑一个给我看」。他笑到现在。这温润底下，藏着一场没救回来的命。',
                      desc: '温润是戒律，也是藏毒的壳', type: 'personal',
                      unlockConditions: [ { type: 'affection', min: 50 }, { type: 'event_completed', eventId: 'su_event_005', eventName: '旧方' } ],
                      effects: { affectionGain: 8 }, unlocked: false
                  },
                  'su_secret_02': {
                      id: 'su_secret_02', title: '他学毒的真正缘由',
                      content: '芩木学毒，是因为他师父。师父救不了那场瘟的最后一个人，病倒走了。他若懂毒、以毒攻毒，那个人能活。他学毒，是想补上师父那场没救回来的命。',
                      desc: '学毒是为了补那场没救回来的命',
                      type: 'personal',
                      unlockConditions: [ { type: 'affection', min: 65 }, { type: 'event_completed', eventId: 'su_event_008', eventName: '毒与医' } ],
                      effects: { affectionGain: 6 },
                      exposureRisk: { useAgainst: { affectionPenalty: -40, npcReaction: 'betrayal' } },
                      unlocked: false
                  },
                  'su_secret_03': {
                      id: 'su_secret_03', title: '十八遍方子的来历',
                      content: '那张改到十八遍的方，本是芩木师父留下的「无效」方。他改了二十年，只为等一个能让他把「无效」改成「有效」的人。你在的那天，他改成了。',
                      desc: '改了二十年，只为等一个人',
                      type: 'personal',
                      unlockConditions: [ { type: 'affection', min: 80 }, { type: 'event_completed', eventId: 'su_event_013', eventName: '终章·一张为你开的方' } ],
                      effects: { affectionGain: 10 }, unlocked: false
                  }
              }
            }
        ],
        factions: [
            { id: 'yw_faction_treat', name: '仁心派', icon: '💊', desc: '主张免费救治天下病患，广积善缘。',
              leader: '孙思邈', members: ['华若兰'], stance: { expansion: -10, charity: 40 }, influence: 50 },
            { id: 'yw_faction_research', name: '钻研派', icon: '🔬', desc: '主张深入研究药理，追求医术极致。',
              leader: '李时珍', members: [], stance: { expansion: 10, research: 40 }, influence: 30 }
        ],
        specialResources: [
            { id: 'yw_resource_garden', name: '百草园', type: 'herb', output: 20, desc: '种植天下灵药的药圃' },
            { id: 'yw_resource_lab', name: '丹房', type: 'alchemy', output: 15, desc: '炼制丹药的丹房' }
        ],
        events: [
            { id: 'yw_event_1', name: '瘟疫来袭', icon: '🏥', desc: '山下爆发瘟疫，药王谷全力救治。',
              condition: { random: 0.1 }, stages: [
                { stage: 1, text: '山下村庄爆发瘟疫，药王谷弟子紧急集合！',
                  choices: [{ text: '随谷主下山救治', effect: 'contribution+80, exp+50', next: 2 },
                            { text: '在谷中炼制药物', effect: 'contribution+40, medicine+5', next: -1 }] },
                { stage: 2, text: '瘟疫得到控制，村民感激涕零。',
                  choices: [{ text: '总结经验，撰写医案', effect: 'exp+40, medicine+3', next: -1 },
                            { text: '继续观察疫情', effect: 'contribution+20', next: -1 }] }
              ] }
        ]
    };

    // 修罗宫
    SECT_DEEP_DATA['修罗宫'] = {
        desc: '只收受情伤女子的门派，武功狠辣，门规极端。宫主修罗女武功深不可测，无人知其真名。',
        masters: [
            { id: 'xl_master_1', name: '修罗女', title: '宫主', realm: '金丹', layer: 9, age: '?',
              desc: '修罗宫宫主，无人知其真名与来历。武功诡异狠辣，深不可测。',
              secret: '真名绯泪',
              personality: '冷若冰霜，杀伐果断', isFemale: true,
              skills: ['修罗杀意', '血影剑法', '天魔舞'],
              acceptStudent: false, maxStudents: 0,
              secrets: {
                  'xl_secret_01': {
                      id: 'xl_secret_01',
                      title: '真名·绯泪',
                      content: '她的真名叫「绯泪」，是上任修罗宫圣女之女，为复仇而活。',
                      desc: '修罗宫宫主的真名',
                      type: 'personal',
                      unlockConditions: [
                          { type: 'affection', min: 40 },
                          { type: 'event_completed', eventId: 'xl_event_s001', eventName: '梳头' }
                      ],
                      effects: {
                          unlockDialogueOptions: ['call_true_name'],
                          unlockEvent: 'xl_event_true_name',
                          affectionGain: 10
                      },
                      exposureRisk: {
                          tellOthers: { affectionPenalty: -20, npcReaction: 'anger' },
                          useAgainst: { affectionPenalty: -30, npcReaction: 'betrayal' }
                      },
                      unlocked: false
                  },
                  'xl_secret_02': {
                      id: 'xl_secret_02',
                      title: '过往·寒烟门',
                      content: '江南世族出身，为郗寒舟踏入修仙路。寒烟门灭门后亲手杀了他，创立修罗宫。',
                      desc: '她的过去',
                      type: 'personal',
                      unlockConditions: [
                          { type: 'affection', min: 50 },
                          { type: 'event_completed', eventId: 'xl_event_s002', eventName: '留宿' }
                      ],
                      effects: {
                          affectionGain: 8
                      },
                      unlocked: false
                  },
                  'xl_secret_03': {
                      id: 'xl_secret_03',
                      title: '弱点·冰火失衡',
                      content: '冰火双灵根运功过度会短暂失衡，此时是她最脆弱的时候。',
                      desc: '她的弱点',
                      type: 'personal',
                      unlockConditions: [
                          { type: 'affection', min: 60 },
                          { type: 'event_completed', eventId: 'xl_event_s003', eventName: '吃醋' }
                      ],
                      effects: {
                          affectionGain: 5,
                          unlockDialogueOptions: ['care_weakness']
                      },
                      exposureRisk: {
                          useAgainst: { affectionPenalty: -40, npcReaction: 'betrayal' }
                      },
                      unlocked: false
                  }
              } },
            { id: 'xl_master_2', name: '血影', title: '左护法', realm: '金丹', layer: 4, age: 35,
              desc: '修罗宫左护法，性格冷厉。对宫主忠心耿耿。', personality: '冷厉寡言，忠心耿耿',
              skills: ['血影剑法', '修罗杀意', '暗影步'], isFemale: true,
              acceptStudent: true, maxStudents: 2, requirement: { realm: '筑基', layer: 2, contribution: 400 } },
            { id: 'xl_master_3', name: '幽兰', title: '右护法', realm: '金丹', layer: 3, age: 32,
              desc: '修罗宫右护法，表面温婉，实则心狠手辣。', personality: '外柔内狠，智计百出',
              skills: ['天魔舞', '幻音术', '软鞭'], isFemale: true,
              acceptStudent: true, maxStudents: 3, requirement: { realm: '炼气', layer: 7, contribution: 250 } },
            { id: 'xl_master_4', name: '霜月', title: '长老', realm: '筑基', layer: 9, age: 28,
              desc: '修罗宫最年轻的长老，因情伤入宫，剑法已臻化境。', personality: '清冷孤傲，外冷内热',
              skills: ['霜月剑法', '修罗杀意', '冰心诀'], isFemale: true,
              acceptStudent: true, maxStudents: 4, requirement: { realm: '炼气', layer: 4, contribution: 100 } }
        ],
        factions: [
            { id: 'xl_faction_hate', name: '绝情派', icon: '💔', desc: '主张绝情断爱，专心修炼杀伐之道。',
              leader: '血影', members: ['霜月'], stance: { expansion: 20, ruthless: 30 }, influence: 40 },
            { id: 'xl_faction_control', name: '掌控派', icon: '🎭', desc: '主张利用感情操控他人，以达到复仇目的。',
              leader: '幽兰', members: [], stance: { expansion: 10, cunning: 30 }, influence: 30 }
        ],
        specialResources: [
            { id: 'xl_resource_bloodpool', name: '血池', type: 'training', output: 12, desc: '修炼修罗杀意的血池' },
            { id: 'xl_resource_weapon', name: '兵器库', type: 'forge', output: 8, desc: '收藏各种奇门兵器' }
        ],
        events: [
            { id: 'xl_event_1', name: '宫主召见', icon: '👑', desc: '修罗女突然召集全宫弟子。',
              condition: { random: 0.06 }, stages: [
                { stage: 1, text: '修罗女高坐宫主之位，冰冷的目光扫过众人。',
                  choices: [{ text: '恭敬行礼，听候差遣', effect: 'contribution+50, affection+10', next: 2 },
                            { text: '低头不语，避免直视', effect: 'contribution+20', next: -1 }] },
                { stage: 2, text: '修罗女下令剿灭一个负心汉的满门。',
                  choices: [{ text: '主动请缨前往', effect: 'contribution+80, quest_combat', next: -1 },
                            { text: '沉默不语', effect: 'contribution+10', next: -1 }] }
              ] },
            { id: 'xl_event_2', name: '仇家上门', icon: '⚔️', desc: '有仇家找上修罗宫寻仇。',
              condition: { random: 0.08 }, stages: [
                { stage: 1, text: '一群修士在山门外叫嚣，要与修罗宫算账。',
                  choices: [{ text: '出山迎战', effect: 'contribution+60, exp+40', next: 2 },
                            { text: '禀报护法处理', effect: 'contribution+20', next: -1 }] },
                { stage: 2, text: '来犯者被击退，领头的被押入宫中。',
                  choices: [{ text: '建议宫主饶他一命', effect: 'affection+5, karma+5', next: -1 },
                            { text: '冷眼旁观', effect: 'contribution+10', next: -1 }] }
              ] }
        ],
        // 修罗宫特殊：入门需女性
        joinRequirement: { gender: 'female' }
    };

    // 逍遥派
    SECT_DEEP_DATA['逍遥派'] = {
        desc: '隐世高人，武学飘逸出尘。门人需惊才绝艳，行事随心。人数极少，但个个都是人中龙凤。',
        masters: [
            { id: 'xy_master_1', name: '逍遥子', title: '掌门', realm: '元婴', layer: 2, age: 120,
              desc: '逍遥派掌门，已臻化境。行踪飘忽，神龙见首不见尾。', personality: '超然物外，游戏人间',
              skills: ['北冥神功', '凌波微步', '天山折梅手', '八荒六合唯我独尊功'],
              acceptStudent: true, maxStudents: 1, requirement: { realm: '筑基', layer: 5, contribution: 1000, talent: 80 } },
            { id: 'xy_master_2', name: '天琴', title: '长老', realm: '金丹', layer: 7, age: 60,
              desc: '逍遥派长老，精通音律与武学，以琴音伤人于无形。', personality: '风雅脱俗，不拘一格',
              skills: ['七弦琴音', '凌波微步', '北冥神功'],
              acceptStudent: true, maxStudents: 2, requirement: { realm: '筑基', layer: 1, contribution: 500, talent: 60 } },
            { id: 'xy_master_3', name: '棋圣', title: '长老', realm: '金丹', layer: 5, age: 65,
              desc: '逍遥派长老，以棋入道，棋盘即是战场。', personality: '沉默寡言，深不可测',
              skills: ['棋盘困阵', '凌波微步', '天山折梅手'],
              acceptStudent: true, maxStudents: 2, requirement: { realm: '炼气', layer: 9, contribution: 300, talent: 50 } }
        ],
        factions: [
            { id: 'xy_faction_leisure', name: '逍遥派', icon: '🦅', desc: '逍遥派本无派系，随心所欲，各行其道。',
              leader: '逍遥子', members: [], stance: { expansion: -30, orthodox: -20 }, influence: 60 }
        ],
        specialResources: [
            { id: 'xy_resource_huangshan', name: '琅嬛福地', type: 'knowledge', output: 18, desc: '收藏天下武学秘籍的福地' },
            { id: 'xy_resource_jiuxian', name: '酒仙池', type: 'training', output: 12, desc: '以灵泉酿酒，饮酒修炼' }
        ]
    };

    // 唐门
    SECT_DEEP_DATA['唐门'] = {
        desc: '暗器与机关术的极致，刺客与匠人的结合。家族式管理，门规森严。',
        masters: [
            { id: 'tm_master_1', name: '唐无痕', title: '门主', realm: '金丹', layer: 6, age: 58,
              desc: '唐门门主，暗器手法天下无双。', personality: '深藏不露，心思缜密',
              skills: ['暴雨梨花针', '唐门暗器手法', '机关术'],
              acceptStudent: true, maxStudents: 2, requirement: { realm: '筑基', layer: 3, contribution: 600 } },
            { id: 'tm_master_2', name: '唐影', title: '长老', realm: '金丹', layer: 3, age: 48,
              desc: '唐门长老，轻功绝世，擅长暗杀。', personality: '阴沉寡言，行踪不定',
              skills: ['影子刺', '唐门暗器手法', '幽冥步'],
              acceptStudent: true, maxStudents: 3, requirement: { realm: '筑基', layer: 1, contribution: 350 } },
            { id: 'tm_master_3', name: '唐铸', title: '机关长老', realm: '筑基', layer: 9, age: 55,
              desc: '唐门机关长老，精研机关术数十年。', personality: '沉默寡言，手艺精湛',
              skills: ['机关术', '傀儡术', '锻造术'],
              acceptStudent: true, maxStudents: 3, requirement: { realm: '炼气', layer: 6, contribution: 200 } }
        ],
        factions: [
            { id: 'tm_faction_old', name: '守旧派', icon: '🛡️', desc: '主张保持唐门传统，暗器为主机关为辅。',
              leader: '唐无痕', members: ['唐影'], stance: { expansion: -10, reform: -20 }, influence: 45 },
            { id: 'tm_faction_new', name: '革新派', icon: '⚙️', desc: '主张大力发展机关术，让唐门与时俱进。',
              leader: '唐铸', members: [], stance: { expansion: 20, reform: 30 }, influence: 30 }
        ],
        specialResources: [
            { id: 'tm_resource_workshop', name: '机关工坊', type: 'forge', output: 15, desc: '制作机关暗器的工坊' },
            { id: 'tm_resource_lab', name: '毒药房', type: 'alchemy', output: 10, desc: '炼制毒药的密室' }
        ]
    };

    // 丐帮
    SECT_DEEP_DATA['丐帮'] = {
        desc: '天下第一大帮，弟子遍布天下，消息最为灵通。看似落魄，实则暗藏龙虎。',
        masters: [
            { id: 'gb_master_1', name: '萧峰', title: '帮主', realm: '金丹', layer: 8, age: 45,
              desc: '丐帮帮主，豪气干云，武功盖世。', personality: '豪迈仗义，义薄云天',
              skills: ['降龙十八掌', '打狗棒法', '逍遥游'],
              acceptStudent: true, maxStudents: 2, requirement: { realm: '筑基', layer: 4, contribution: 700 } },
            { id: 'gb_master_2', name: '洪七公', title: '传功长老', realm: '金丹', layer: 5, age: 70,
              desc: '丐帮传功长老，贪吃好酒，武功登峰造极。', personality: '风趣幽默，不拘小节',
              skills: ['降龙十八掌', '打狗棒法', '逍遥游'],
              acceptStudent: true, maxStudents: 3, requirement: { realm: '筑基', layer: 2, contribution: 400 } },
            { id: 'gb_master_3', name: '鲁有脚', title: '执法长老', realm: '金丹', layer: 3, age: 55,
              desc: '丐帮执法长老，铁面无私，掌管帮规。', personality: '刚正不阿，秉公执法',
              skills: ['打狗棒法', '太祖长拳'],
              acceptStudent: true, maxStudents: 3, requirement: { realm: '炼气', layer: 6, contribution: 200 } }
        ],
        factions: [
            { id: 'gb_faction_clean', name: '净衣派', icon: '👔', desc: '主张丐帮弟子应注重仪容，融入主流。',
              leader: '萧峰', members: [], stance: { reform: 30, orthodox: 10 }, influence: 35 },
            { id: 'gb_faction_dirty', name: '污衣派', icon: '🫡', desc: '主张保持丐帮本色，不忘本。',
              leader: '洪七公', members: ['鲁有脚'], stance: { reform: -20, tradition: 30 }, influence: 40 }
        ],
        specialResources: [
            { id: 'gb_resource_network', name: '消息网', type: 'intel', output: 20, desc: '遍布天下的丐帮弟子提供情报' },
            { id: 'gb_resource_treasury', name: '义仓', type: 'storage', output: 10, desc: '丐帮储备的物资' }
        ]
    };

    // 铸剑山庄
    SECT_DEEP_DATA['铸剑山庄'] = {
        desc: '兵器谱的制定者，天下顶尖的锻造师聚集地。庄中炉火终年不熄，锤声不绝于耳。',
        masters: [
            { id: 'zj_master_1', name: '欧冶子', title: '庄主', realm: '金丹', layer: 5, age: 80,
              desc: '铸剑山庄庄主，天下第一铸剑师。', personality: '沉默寡言，专注铸剑',
              skills: ['铸造术', '炼器术', '锻造术'],
              acceptStudent: true, maxStudents: 2, requirement: { realm: '筑基', layer: 2, contribution: 500, forging: 50 } },
            { id: 'zj_master_2', name: '干将', title: '大匠师', realm: '金丹', layer: 3, age: 50,
              desc: '铸剑山庄大匠师，擅长铸造神兵利器。', personality: '热情豪爽，乐于传授',
              skills: ['铸造术', '锻造术', '淬火术'],
              acceptStudent: true, maxStudents: 3, requirement: { realm: '炼气', layer: 7, contribution: 300, forging: 30 } },
            { id: 'zj_master_3', name: '莫邪', title: '大匠师', realm: '筑基', layer: 9, age: 45,
              desc: '铸剑山庄大匠师，干将之妻，铸剑技艺不输丈夫。', personality: '细致入微，精益求精',
              skills: ['铸造术', '雕刻术', '镶嵌术'], isFemale: true,
              acceptStudent: true, maxStudents: 3, requirement: { realm: '炼气', layer: 5, contribution: 200, forging: 20 } },
            // v20.3 男主·冶砚（少庄主，铸剑师）——与欧冶子（masters 教学线）并存；不收徒，承载可解锁秘密
            { id: 'zj_master_4', name: '冶砚', title: '少庄主', realm: '金丹', layer: 4, age: 26,
              desc: '铸剑山庄少庄主，人称「炉火少主」。欧冶子义子，铸剑天才，性如炉火。', personality: '火性赤诚，一诺千金',
              skills: ['天工锻诀', '炉火内功', '玄铁剑法'],
              secrets: {
                  'lu_secret_01': {
                      id: 'lu_secret_01', title: '炉火秘诀的真正来源',
                      content: '冶砚的炉火内功并非欧冶子所授，而是他幼年在炉灰里挨冻时自己悟的——他怕冷，便学着把炉火吞进丹田。这身火，是被冷逼出来的。',
                      desc: '火是被冷逼出来的', type: 'personal',
                      unlockConditions: [ { type: 'affection', min: 45 }, { type: 'event_completed', eventId: 'lu_event_004', eventName: '冷夜添柴' } ],
                      effects: { affectionGain: 8 }, unlocked: false
                  },
                  'lu_secret_02': {
                      id: 'lu_secret_02', title: '三年未成之剑的真相',
                      content: '那柄铸了三年未成的剑，他照的是欧冶子之女（早夭的师姐）的虎口茧型。师姐走后，他想铸一柄她用不上的剑——剑成不了，是因为人不在了。',
                      desc: '剑成不了，是因为等的人不在了',
                      type: 'personal',
                      unlockConditions: [ { type: 'affection', min: 60 }, { type: 'event_completed', eventId: 'lu_event_007', eventName: '断剑' } ],
                      effects: { affectionGain: 6 },
                      exposureRisk: { useAgainst: { affectionPenalty: -40, npcReaction: 'betrayal' } },
                      unlocked: false
                  },
                  'lu_secret_03': {
                      id: 'lu_secret_03', title: '他怕冷的来历',
                      content: '冶砚五岁前的事他不记得，但欧冶子记得——那年是铸剑山庄一场炉塌，他生父母为护住一炉玄铁，把他塞进炉灰坑里。他在灰里埋了三天，活下来，从此怕冷，也从此能把炉火吞进身体。',
                      desc: '怕冷，是因为曾在炉灰里埋了三天',
                      type: 'personal',
                      unlockConditions: [ { type: 'affection', min: 78 }, { type: 'event_completed', eventId: 'lu_event_008', eventName: '怕冷' } ],
                      effects: { affectionGain: 10 }, unlocked: false
                  }
              }
            }
        ],
        factions: [
            { id: 'zj_faction_traditional', name: '古法派', icon: '🔨', desc: '主张遵循古法铸剑，追求品质极致。',
              leader: '欧冶子', members: [], stance: { reform: -20, quality: 40 }, influence: 40 },
            { id: 'zj_faction_innovative', name: '革新派', icon: '⚡', desc: '主张尝试新方法，融入灵气淬炼。',
              leader: '干将', members: ['莫邪'], stance: { reform: 30, research: 20 }, influence: 35 }
        ],
        specialResources: [
            { id: 'zj_resource_furnace', name: '天工炉', type: 'forge', output: 20, desc: '天下第一铸剑炉' },
            { id: 'zj_resource_mine', name: '玄铁矿脉', type: 'mine', output: 15, desc: '出产珍稀矿脉' }
        ]
    };

    // 茅山派
    SECT_DEEP_DATA['茅山派'] = {
        desc: '以符箓道法闻名，擅驱鬼除妖、堪舆风水。茅山道士行走天下，降妖伏魔。',
        masters: [
            { id: 'ms_master_1', name: '茅山老祖', title: '掌门', realm: '金丹', layer: 7, age: 90,
              desc: '茅山派掌门，符箓道法通神。', personality: '仙风道骨，神秘莫测',
              skills: ['符箓术', '驱鬼术', '天雷正法'],
              acceptStudent: true, maxStudents: 2, requirement: { realm: '筑基', layer: 3, contribution: 500 } },
            { id: 'ms_master_2', name: '张天师', title: '长老', realm: '金丹', layer: 4, age: 65,
              desc: '茅山派长老，驱鬼除妖，威名赫赫。', personality: '正直刚烈，嫉恶如仇',
              skills: ['符箓术', '驱鬼术', '掌心雷'],
              acceptStudent: true, maxStudents: 3, requirement: { realm: '筑基', layer: 1, contribution: 300 } },
            { id: 'ms_master_3', name: '诸葛青', title: '长老', realm: '筑基', layer: 8, age: 50,
              desc: '茅山派长老，精通风水堪舆，寻龙点穴。', personality: '博学多才，温文尔雅',
              skills: ['符箓术', '风水术', '阵法'],
              acceptStudent: true, maxStudents: 3, requirement: { realm: '炼气', layer: 6, contribution: 150 } },
            // v20.3 男主·昴既明（伏魔首席，阴阳眼）——与茅山老祖（masters 教学线）并存；不收徒，承载秘密
            { id: 'ms_master_4', name: '昴既明', title: '伏魔首席', realm: '金丹', layer: 5, age: 27,
              desc: '茅山派伏魔首席，人称「阴阳道士」。天生阴阳眼，专司伏魔渡魂。', personality: '清冷寡言，见惯生死',
              skills: ['天罡伏魔诀', '阴阳瞳', '渡魂符'],
              secrets: {
                  'ms_secret_01': {
                      id: 'ms_secret_01', title: '阴阳眼的来历',
                      content: '昴既明的阴阳眼，是他七岁那年高烧死过三天后醒来才开的。那三天他在跟看不见的人说话——被丢回来时，左眼就留着那一眼银光。',
                      desc: '阴阳眼是被丢回来时留下的', type: 'personal',
                      unlockConditions: [ { type: 'affection', min: 50 }, { type: 'event_completed', eventId: 'ms_event_007', eventName: '死过一次' } ],
                      effects: { affectionGain: 8 }, unlocked: false
                  },
                  'ms_secret_02': {
                      id: 'ms_secret_02', title: '未画完的渡魂符',
                      content: '那道画了三年没画完的渡魂符，是替他师兄画的。三年前师兄伏魔魂散，他画符想聚——画不成，因为魂散了聚不回。他画着，是觉得画着，师兄就还在。',
                      desc: '画着，是觉得他还在',
                      type: 'personal',
                      unlockConditions: [ { type: 'affection', min: 65 }, { type: 'event_completed', eventId: 'ms_event_005', eventName: '未画完的符' } ],
                      effects: { affectionGain: 6 },
                      exposureRisk: { useAgainst: { affectionPenalty: -40, npcReaction: 'betrayal' } },
                      unlocked: false
                  },
                  'ms_secret_03': {
                      id: 'ms_secret_03', title: '他为何只渡不灭',
                      content: '昴既明只渡魂，不灭魂——哪怕对厉鬼。因为他死过那三天里，是那些看不见的「人」把他送回来的。他欠他们一条命。他渡，是还。',
                      desc: '只渡不灭，是因为欠一条命',
                      type: 'personal',
                      unlockConditions: [ { type: 'affection', min: 78 }, { type: 'event_completed', eventId: 'ms_event_008', eventName: '渡你' } ],
                      effects: { affectionGain: 10 }, unlocked: false
                  }
              }
            }
        ],
        factions: [
            { id: 'ms_faction_zheng', name: '正一派', icon: '⚡', desc: '主张以天雷正法诛邪，积极降妖伏魔。',
              leader: '张天师', members: [], stance: { expansion: 20, combat: 30 }, influence: 40 },
            { id: 'ms_faction_feng', name: '风水派', icon: '🧭', desc: '主张以风水堪舆为主，趋吉避凶。',
              leader: '诸葛青', members: [], stance: { expansion: -10, knowledge: 30 }, influence: 30 }
        ],
        specialResources: [
            { id: 'ms_resource_talisman', name: '符箓阁', type: 'craft', output: 15, desc: '绘制符箓的阁楼' },
            { id: 'ms_resource_tomb', name: '古墓群', type: 'explore', output: 8, desc: '历代祖师安息之地' }
        ]
    };

    // 全真教
    SECT_DEEP_DATA['全真教'] = {
        desc: '玄门正宗，内丹功法的集大成者，注重心性修炼。全真七子名扬天下。',
        masters: [
            { id: 'qz_master_1', name: '王重阳', title: '掌教', realm: '金丹', layer: 9, age: 80,
              desc: '全真教掌教，中神通，武功天下无双。', personality: '超然物外，道骨仙风',
              skills: ['先天功', '全真剑法', '金雁功', '一阳指'],
              acceptStudent: false, maxStudents: 0 },
            { id: 'qz_master_2', name: '马钰', title: '掌教代行', realm: '金丹', layer: 5, age: 65,
              desc: '全真七子之首，代掌教行事，为人谦和。', personality: '谦和稳重，教导有方',
              skills: ['先天功', '全真剑法', '金雁功'],
              acceptStudent: true, maxStudents: 3, requirement: { realm: '筑基', layer: 2, contribution: 400 } },
            { id: 'qz_master_3', name: '丘处机', title: '长老', realm: '金丹', layer: 4, age: 60,
              desc: '全真七子之一，武功高强，性子刚烈。', personality: '刚直不阿，嫉恶如仇',
              skills: ['全真剑法', '金雁功', '天罡北斗阵'],
              acceptStudent: true, maxStudents: 3, requirement: { realm: '筑基', layer: 1, contribution: 300 } },
            { id: 'qz_master_4', name: '孙不二', title: '长老', realm: '金丹', layer: 2, age: 55,
              desc: '全真七子之一，唯一的女弟子，道法高深。', personality: '清心寡欲，道心坚定', isFemale: true,
              skills: ['全真剑法', '清心咒', '天罡北斗阵'],
              acceptStudent: true, maxStudents: 3, requirement: { realm: '炼气', layer: 7, contribution: 200 } }
        ],
        factions: [
            { id: 'qz_faction_neidan', name: '内丹派', icon: '⚗️', desc: '主张以内丹修炼为主，追求长生。',
              leader: '马钰', members: ['孙不二'], stance: { expansion: -10, cultivation: 40 }, influence: 45 },
            { id: 'qz_faction_waiwu', name: '外务派', icon: '⚔️', desc: '主张积极入世，降妖伏魔。',
              leader: '丘处机', members: [], stance: { expansion: 20, combat: 30 }, influence: 30 }
        ],
        specialResources: [
            { id: 'qz_resource_quanzhen', name: '重阳宫', type: 'training', output: 15, desc: '全真教祖庭，灵气充沛' },
            { id: 'qz_resource_array', name: '天罡北斗阵', type: 'formation', output: 10, desc: '全真镇教大阵' }
        ]
    };

    // 天山派
    SECT_DEEP_DATA['天山派'] = {
        desc: '位于极寒之地，擅长水属性功法，只收灵根含水的弟子。天山派弟子个个冰清玉洁。',
        masters: [
            { id: 'ts_master_1', name: '天山童姥', title: '掌门', realm: '金丹', layer: 7, age: 96,
              desc: '天山派掌门，虽已近百岁高龄，但外表如少女。', personality: '喜怒无常，童真未泯', isFemale: true,
              skills: ['天山六阳掌', '天山折梅手', '生死符', '八荒六合唯我独尊功'],
              acceptStudent: true, maxStudents: 2, requirement: { realm: '筑基', layer: 4, contribution: 600, waterRoot: true } },
            { id: 'ts_master_2', name: '李秋水', title: '长老', realm: '金丹', layer: 5, age: 75,
              desc: '天山派长老，武功诡异，擅长幻术。', personality: '妩媚动人，心机深沉', isFemale: true,
              skills: ['白虹掌', '传音搜魂', '小无相功'],
              acceptStudent: true, maxStudents: 3, requirement: { realm: '筑基', layer: 2, contribution: 350, waterRoot: true } },
            { id: 'ts_master_3', name: '巫行云', title: '长老', realm: '金丹', layer: 3, age: 65,
              desc: '天山派长老，性烈如火，擅长冰火双修。', personality: '性烈如火，直来直去', isFemale: true,
              skills: ['天山六阳掌', '火焰刀', '寒冰真气'],
              acceptStudent: true, maxStudents: 3, requirement: { realm: '炼气', layer: 6, contribution: 200, waterRoot: true } },
            // v20.2 琤霄凌：代掌门首席，剑道核心；不收徒（剑道一对一），仅承载可解锁秘密
            { id: 'ts_master_4', name: '琤霄凌', title: '代掌门首席', realm: '金丹', layer: 5, age: 30,
              desc: '天山派代掌门首席，江湖称"雪隐剑姬"，守师姐遗剑霜鸣十二年。', personality: '外冷内热，守一道而活', isFemale: true,
              skills: ['天山剑诀', '霜鸣剑法', '雪隐步'],
              secrets: {
                  'ts_secret_01': {
                      id: 'ts_secret_01',
                      title: '霜鸣的裂纹',
                      content: '霜鸣剑上那道最深的裂纹，不是岁月磨出来的——是十八岁那年，师姐琤青鸾替她挡刀时，血溅剑身，干在剑里的。她擦了十二年，擦不掉。',
                      desc: '裂纹是师姐留的，她舍不得修',
                      type: 'personal',
                      unlockConditions: [
                          { type: 'affection', min: 40 },
                          { type: 'event_completed', eventId: 'ts_event_004', eventName: '师姐的剑' }
                      ],
                      effects: { affectionGain: 8 },
                      unlocked: false
                  },
                  'ts_secret_02': {
                      id: 'ts_secret_02',
                      title: '从不拔剑的真相',
                      content: '她从不拔霜鸣出鞘——因为师姐临终说"等我把它练成"。她练了十二年没成，便觉得是自己在拖累这柄剑。她怕拔出来，剑会怨她。',
                      desc: '不拔剑，是因为剑还没等到被练成',
                      type: 'personal',
                      unlockConditions: [
                          { type: 'affection', min: 62 },
                          { type: 'event_completed', eventId: 'ts_event_008', eventName: '月下剑舞' }
                      ],
                      effects: { affectionGain: 6 },
                      exposureRisk: {
                          useAgainst: { affectionPenalty: -40, npcReaction: 'betrayal' }
                      },
                      unlocked: false
                  },
                  'ts_secret_03': {
                      id: 'ts_secret_03',
                      title: '守剑等的人',
                      content: '霜鸣的裂纹能愈合，前提是剑认了一个人。她守剑十二年，等的不是剑成，是一个能让霜鸣出鞘、又不让它见血的人——一个配得上拔这柄剑的人。',
                      desc: '她等的不是解药，是一个敢接剑的人',
                      type: 'personal',
                      unlockConditions: [
                          { type: 'affection', min: 78 },
                          { type: 'event_completed', eventId: 'ts_event_011', eventName: '心障' }
                      ],
                      effects: { affectionGain: 10 },
                      unlocked: false
                  }
              }
            }
        ],
        specialResources: [
            { id: 'ts_resource_ice', name: '天池', type: 'training', output: 18, desc: '天山顶上的灵池，水灵气充沛' },
            { id: 'ts_resource_snow', name: '雪莲谷', type: 'herb', output: 12, desc: '生长天山雪莲的幽谷' }
        ]
    };

    // 金刚宗
    SECT_DEEP_DATA['金刚宗'] = {
        desc: '密宗苦行，讲究即身成佛，炼体之术天下无双，肉身强横。',
        masters: [
            { id: 'jg_master_1', name: '鸠摩智', title: '法王', realm: '金丹', layer: 6, age: 60,
              desc: '金刚宗法王，佛法精深，武功霸道。', personality: '霸道强势，自信十足',
              skills: ['火焰刀', '金刚不坏神功', '大手印'],
              acceptStudent: true, maxStudents: 2, requirement: { realm: '筑基', layer: 3, contribution: 500, constitution: 40 } },
            { id: 'jg_master_2', name: '密宗金刚', title: '护法', realm: '金丹', layer: 3, age: 50,
              desc: '金刚宗护法，身材魁梧，力大无穷。', personality: '沉默寡言，忠心护教',
              skills: ['金刚不坏神功', '大摔碑手', '龙象般若功'],
              acceptStudent: true, maxStudents: 3, requirement: { realm: '炼气', layer: 8, contribution: 250, constitution: 30 } },
            // v20.3 男主·赫渊（法名净渊，苦行僧）——与鸠摩智（masters 教学线）并存；不收徒，承载秘密
            { id: 'jg_master_3', name: '赫渊', title: '法王继承人', realm: '金丹', layer: 5, age: 29,
              desc: '金刚宗法王继承人，法名净渊，人称「苦行尊者」。修闭口禅+苦行，肉身证道。', personality: '沉默寡言，守戒极严',
              skills: ['金刚不坏神功', '龙象般若功', '闭口禅'],
              secrets: {
                  'jg_secret_01': {
                      id: 'jg_secret_01', title: '闭口禅的真正来历',
                      content: '赫渊修闭口禅不是修行，是怕——他五岁那年师父替他挡刀而死，他哭了一夜，第二日立誓不开口，怕一开口就乱道心。闭口禅是他给自己立的戒，不是佛门的。',
                      desc: '闭口禅是怕开口乱道心', type: 'personal',
                      unlockConditions: [ { type: 'affection', min: 50 }, { type: 'event_completed', eventId: 'jg_event_008', eventName: '沉默的真相' } ],
                      effects: { affectionGain: 8 }, unlocked: false
                  },
                  'jg_secret_02': {
                      id: 'jg_secret_02', title: '心口旧疤的来历',
                      content: '赫渊心口那道极旧的疤，是他五岁那年金刚塔下，有人想取他的血炼魔，他师父（一位苦行僧）替他挡的刀。师父死了。他苦行，是想把这条命还给师父。',
                      desc: '苦行是为还师父替他挡的那条命',
                      type: 'personal',
                      unlockConditions: [ { type: 'affection', min: 65 }, { type: 'event_completed', eventId: 'jg_event_005', eventName: '旧伤' } ],
                      effects: { affectionGain: 6 },
                      exposureRisk: { useAgainst: { affectionPenalty: -40, npcReaction: 'betrayal' } },
                      unlocked: false
                  },
                  'jg_secret_03': {
                      id: 'jg_secret_03', title: '金刚线的真正含义',
                      content: '赫渊右臂缠了二十年的金刚线，是金刚宗守戒僧的标志——也是他给自己上的枷。他缠着，是怕自己破了戒律伤了修为；解下，意味着他为人破了最后一道戒，甘愿伤修为。',
                      desc: '解线即破最后一戒',
                      type: 'personal',
                      unlockConditions: [ { type: 'affection', min: 80 }, { type: 'event_completed', eventId: 'jg_event_013', eventName: '终章·为你破最后一戒' } ],
                      effects: { affectionGain: 10 }, unlocked: false
                  }
              }
            }
        ],
        factions: [
            { id: 'jg_faction_ku', name: '苦行派', icon: '🏔️', desc: '主张艰苦修行，以肉身证道。',
              leader: '鸠摩智', members: [], stance: { asceticism: 40, expansion: 10 }, influence: 50 }
        ],
        specialResources: [
            { id: 'jg_resource_stupa', name: '金刚塔', type: 'training', output: 15, desc: '修炼金刚不坏之身的宝塔' },
            { id: 'jg_resource_arya', name: '苦行崖', type: 'training', output: 12, desc: '苦行僧面壁断欲的悬崖，磨砺心志' },
            { id: 'jg_resource_sutra', name: '伏魔藏', type: 'knowledge', output: 10, desc: '收藏降魔伏妖密典的石窟' }
        ]
    };

    // 蓬莱派
    SECT_DEEP_DATA['蓬莱派'] = {
        desc: '海外仙山，珍宝与资源最多，擅水法与幻术。蓬莱仙境，仙人辈出。',
        masters: [
            { id: 'pl_master_1', name: '蓬莱仙人', title: '掌门', realm: '元婴', layer: 1, age: 150,
              desc: '蓬莱派掌门，已半只脚踏入仙道。', personality: '仙风道骨，超然物外',
              skills: ['蓬莱剑法', '水月幻术', '碧波真经'],
              acceptStudent: true, maxStudents: 1, requirement: { realm: '筑基', layer: 5, contribution: 800 } },
            { id: 'pl_master_2', name: '东华子', title: '长老', realm: '金丹', layer: 4, age: 70,
              desc: '蓬莱派长老，精通水属性功法。', personality: '温文尔雅，风度翩翩',
              skills: ['蓬莱剑法', '碧波真经', '水遁术'],
              acceptStudent: true, maxStudents: 3, requirement: { realm: '筑基', layer: 1, contribution: 300 } }
        ],
        specialResources: [
            { id: 'pl_resource_sea', name: '碧波潭', type: 'training', output: 15, desc: '海底灵脉汇聚之处' },
            { id: 'pl_resource_pearl', name: '珍珠滩', type: 'herb', output: 10, desc: '出产珍珠灵药的海滩' }
        ]
    };

    // 阎罗殿
    SECT_DEEP_DATA['阎罗殿'] = {
        desc: '专研军阵杀伐之术，刀法霸道，纪律森严。殿主阎罗王武功深不可测，无人知其真名。',
        masters: [
            { id: 'yl_master_1', name: '阎罗王', title: '殿主', realm: '金丹', layer: 9, age: '?',
              desc: '阎罗殿殿主，无人知其真名与来历。杀气滔天，麾下十万阴兵。', personality: '冷酷无情，杀伐果断',
              secret: '真名秦广',
              skills: ['阎罗刀法', '阴兵借道', '修罗杀道'],
              acceptStudent: false, maxStudents: 0 },
            { id: 'yl_master_2', name: '判官', title: '左判官', realm: '金丹', layer: 5, age: 55,
              desc: '阎罗殿左判官，掌管生死簿，武功诡异。', personality: '阴沉寡言，城府极深',
              skills: ['判官笔法', '阎罗刀法', '鬼影步'],
              acceptStudent: true, maxStudents: 2, requirement: { realm: '筑基', layer: 3, contribution: 500 } },
            { id: 'yl_master_3', name: '孟婆', title: '右判官', realm: '金丹', layer: 4, age: 70,
              desc: '阎罗殿右判官，掌管孟婆汤，精通毒术。', personality: '慈眉善目，心狠手辣', isFemale: true,
              skills: ['毒术', '幻术', '阎罗刀法'],
              acceptStudent: true, maxStudents: 3, requirement: { realm: '筑基', layer: 1, contribution: 300 } }
        ],
        factions: [
            { id: 'yl_faction_military', name: '军武派', icon: '⚔️', desc: '主张以武力征服，扩大势力。',
              leader: '判官', members: [], stance: { expansion: 30, militarism: 40 }, influence: 45 },
            { id: 'yl_faction_covert', name: '暗影派', icon: '🌑', desc: '主张暗中行事，以阴谋诡计取胜。',
              leader: '孟婆', members: [], stance: { cunning: 30, expansion: 10 }, influence: 30 }
        ],
        specialResources: [
            { id: 'yl_resource_army', name: '阴兵营', type: 'military', output: 20, desc: '训练阴兵的大营' },
            { id: 'yl_resource_prison', name: '炼狱', type: 'torture', output: 10, desc: '折磨敌人的地牢' }
        ]
    };

    // 天龙教
    SECT_DEEP_DATA['天龙教'] = {
        desc: '崛起于西域的魔教，野心勃勃，是正道的心腹大患。教中高手如云。',
        masters: [
            { id: 'tl_master_1', name: '天龙教主', title: '教主', realm: '金丹', layer: 8, age: '?',
              desc: '天龙教教主，从不以真面目示人。武功深不可测。', personality: '深藏不露，雄才大略',
              skills: ['天龙八部功', '龙爪手', '天魔大法'],
              acceptStudent: false, maxStudents: 0 },
            { id: 'tl_master_2', name: '龙啸天', title: '左护法', realm: '金丹', layer: 5, age: 50,
              desc: '天龙教左护法，刀法霸道，性烈如火。', personality: '豪爽暴躁，重情重义',
              skills: ['龙啸刀法', '天龙八部功', '烈焰掌'],
              acceptStudent: true, maxStudents: 2, requirement: { realm: '筑基', layer: 3, contribution: 500 } },
            { id: 'tl_master_3', name: '白凤', title: '右护法', realm: '金丹', layer: 4, age: 35,
              desc: '天龙教右护法，轻功绝世，擅使暗器。', personality: '冷艳高傲，智计过人', isFemale: true,
              skills: ['凤舞九天', '天龙八部功', '暗器术'],
              acceptStudent: true, maxStudents: 3, requirement: { realm: '筑基', layer: 1, contribution: 300 } }
        ],
        factions: [
            { id: 'tl_faction_conquer', name: '征伐派', icon: '⚔️', desc: '主张大举进攻中原，一统武林。',
              leader: '龙啸天', members: [], stance: { expansion: 40, aggression: 30 }, influence: 40 },
            { id: 'tl_faction_consolidate', name: '稳固派', icon: '🛡️', desc: '主张先稳固西域根基，再图中原。',
              leader: '白凤', members: [], stance: { expansion: 10, consolidation: 30 }, influence: 30 }
        ],
        specialResources: [
            { id: 'tl_resource_palace', name: '天龙殿', type: 'training', output: 18, desc: '天龙教总坛，灵气充沛' },
            { id: 'tl_resource_treasury', name: '宝库', type: 'storage', output: 15, desc: '天龙教掠夺的珍宝' }
        ]
    };

    // 五仙教
    SECT_DEEP_DATA['五仙教'] = {
        desc: '南疆巫蛊之术的正统，驭使毒虫，擅长咒术与下毒。',
        masters: [
            { id: 'wx_master_1', name: '蓝凤凰', title: '教主', realm: '金丹', layer: 5, age: 45,
              desc: '五仙教教主，驭蛊之术天下无双。', personality: '妖媚动人，心狠手辣', isFemale: true,
              skills: ['蛊术', '毒术', '咒术'],
              acceptStudent: true, maxStudents: 2, requirement: { realm: '筑基', layer: 2, contribution: 400 },
              secrets: {
                  'wx_secret_01': {
                      id: 'wx_secret_01',
                      title: '心蛊的来历',
                      content: '她锁骨下的蝶形黑纹，是十八岁那年那人死后第三日自己养出来的——那只蛊以她的真情为食，自此她再不敢动情。',
                      desc: '动情即喂蛊，蛊成则心死',
                      type: 'personal',
                      unlockConditions: [
                          { type: 'affection', min: 45 },
                          { type: 'event_completed', eventId: 'wx_event_004', eventName: '心蛊' }
                      ],
                      effects: { affectionGain: 8 },
                      unlocked: false
                  },
                  'wx_secret_02': {
                      id: 'wx_secret_02',
                      title: '忘情散的代价',
                      content: '忘情散压得住心蛊，压不住寿元。每服一丸，她便少一岁阳寿。这十年她已少活十年——她从不在乎，直到遇见你。',
                      desc: '续命之药，亦是催命之药',
                      type: 'personal',
                      unlockConditions: [
                          { type: 'affection', min: 60 },
                          { type: 'event_completed', eventId: 'wx_event_008', eventName: '忘情散断' }
                      ],
                      effects: { affectionGain: 6 },
                      exposureRisk: {
                          useAgainst: { affectionPenalty: -40, npcReaction: 'betrayal' }
                      },
                      unlocked: false
                  },
                  'wx_secret_03': {
                      id: 'wx_secret_03',
                      title: '养蛊等的人',
                      content: '她养心蛊十八年不杀它，是因为蛊成蝶那日，便是养蛊之人能再动情之时。她等的不是蛊死，是蛊化蝶——等一个能让蛊认主的人。',
                      desc: '她在等的，从来不是解药，是一个敢选她的人',
                      type: 'personal',
                      unlockConditions: [
                          { type: 'affection', min: 78 },
                          { type: 'event_completed', eventId: 'wx_event_011', eventName: '破蛊前夜' }
                      ],
                      effects: { affectionGain: 10 },
                      unlocked: false
                  }
              }
            },
            { id: 'wx_master_2', name: '毒娘子', title: '长老', realm: '金丹', layer: 3, age: 55,
              desc: '五仙教长老，精研天下奇毒。', personality: '阴冷毒辣，不近人情', isFemale: true,
              skills: ['毒术', '蛊术', '蛇行术'],
              acceptStudent: true, maxStudents: 3, requirement: { realm: '炼气', layer: 7, contribution: 200 } }
        ],
        specialResources: [
            { id: 'wx_resource_gu', name: '万蛊窟', type: 'training', output: 15, desc: '饲养毒虫的洞穴' },
            { id: 'wx_resource_poison', name: '毒药园', type: 'herb', output: 12, desc: '种植毒草的药园' }
        ]
    };

    // 百花谷（v12.3：谷主定名温蘅，36岁天赋异禀；新增感情线秘密定义）
    SECT_DEEP_DATA['百花谷'] = {
        desc: '医武双修，谷中多为女子，擅长迷幻功法与疗伤圣术。谷主温蘅人称"花仙子"，容貌似二十许人。',
        masters: [
            { id: 'bh_master_1', name: '温蘅', title: '谷主', realm: '金丹', layer: 4, age: 36,
              desc: '百花谷谷主，人称"花仙子"。天赋异禀，三十余岁已至金丹，容貌如二十许人。永远笑眼弯弯，洞察人心。',
              secret: '温柔的来历；精通毒术的真正缘由',
              personality: '温柔似水，洞察人心（笑容之下不信任任何人）', isFemale: true,
              skills: ['百花医经', '迷幻术', '百花剑法'],
              acceptStudent: true, maxStudents: 2, requirement: { realm: '筑基', layer: 2, contribution: 400 },
              secrets: {
                  'bh_secret_01': {
                      id: 'bh_secret_01',
                      title: '温柔的来历',
                      content: '少年时性情冷厉，十九岁那年师父临终告诫"医者手里握着人命，不能带情绪"。他咽气前最后一句话是："笑一个给我看看。"她就笑了——笑着送师父走的。',
                      desc: '她的温柔不是天性，是戒律',
                      type: 'personal',
                      unlockConditions: [
                          { type: 'affection', min: 50 },
                          { type: 'event_completed', eventId: 'bh_event_007', eventName: '恩将仇报' }
                      ],
                      effects: { affectionGain: 8 },
                      unlocked: false
                  },
                  'bh_secret_02': {
                      id: 'bh_secret_02',
                      title: '医者的刀',
                      content: '十六年前黑风寨来"借粮"，她往首领酒里下了一味"七日醉"——不死，就是躺七天。从此黑风寨绕着白鹿泽走。医术是她的善，毒是她的刀。',
                      desc: '小门派的生存之道',
                      type: 'personal',
                      unlockConditions: [
                          { type: 'affection', min: 65 },
                          { type: 'event_completed', eventId: 'bh_event_010', eventName: '面具' }
                      ],
                      effects: { affectionGain: 5 },
                      exposureRisk: {
                          useAgainst: { affectionPenalty: -40, npcReaction: 'betrayal' }
                      },
                      unlocked: false
                  },
                  'bh_secret_03': {
                      id: 'bh_secret_03',
                      title: '看穿孤独',
                      content: '她能看穿所有人——三句话就知道对方想要什么、怕什么、瞒着什么。可二十年里，从来没有人试着看穿过她。她怕的不是被识破，是被看穿之后再没人敢靠近。',
                      desc: '她的孤独',
                      type: 'personal',
                      unlockConditions: [
                          { type: 'affection', min: 80 },
                          { type: 'event_completed', eventId: 'bh_event_013', eventName: '看穿我' }
                      ],
                      effects: { affectionGain: 10 },
                      unlocked: false
                  }
              } },
            { id: 'bh_master_2', name: '牡丹', title: '长老', realm: '金丹', layer: 2, age: 28,
              desc: '百花谷长老，八岁时全家死于兵灾被温蘅所救，精通迷幻术与毒术。刀子嘴豆腐心，最看不惯别人欺负谷主。', personality: '热情似火，敢爱敢恨', isFemale: true,
              skills: ['迷幻术', '百花剑法', '毒术'],
              acceptStudent: true, maxStudents: 3, requirement: { realm: '炼气', layer: 6, contribution: 200 } }
        ],
        specialResources: [
            { id: 'bh_resource_garden', name: '百花圃', type: 'herb', output: 18, desc: '种植天下奇花的园圃' },
            { id: 'bh_resource_alchemy', name: '百草庐', type: 'alchemy', output: 14, desc: '谷主亲设的炼药庐，以花入药' },
            { id: 'bh_resource_retreat', name: '隐花径', type: 'training', output: 12, desc: '花深处的隐修炼地，花气助人定心' },
            { id: 'bh_resource_library', name: '医典阁', type: 'knowledge', output: 10, desc: '收藏天下医书与毒经的小阁' }
        ]
    };

    // 铁掌帮
    SECT_DEEP_DATA['铁掌帮'] = {
        desc: '水上实力强横，铁掌功威震江湖。帮中弟子多为水上豪杰。',
        masters: [
            { id: 'tz_master_1', name: '铁掌水上漂', title: '帮主', realm: '金丹', layer: 5, age: 58,
              desc: '铁掌帮帮主，铁掌功登峰造极，轻功水上漂。', personality: '豪爽仗义，重情重义',
              skills: ['铁掌功', '水上漂', '分水刺法'],
              acceptStudent: true, maxStudents: 2, requirement: { realm: '筑基', layer: 2, contribution: 400 } },
            { id: 'tz_master_2', name: '翻江蛟', title: '长老', realm: '金丹', layer: 2, age: 50,
              desc: '铁掌帮长老，水战无敌。', personality: '粗犷豪放，不拘小节',
              skills: ['铁掌功', '水上漂', '分水刺法'],
              acceptStudent: true, maxStudents: 3, requirement: { realm: '炼气', layer: 6, contribution: 200 } }
        ],
        specialResources: [
            { id: 'tz_resource_boat', name: '铁掌船坞', type: 'military', output: 12, desc: '打造战船的船坞' }
        ]
    };

    // 大隐阁
    SECT_DEEP_DATA['大隐阁'] = {
        desc: '隐世高人的聚集地，阁主观虚子，修为深不可测。门人虽少，但个个都是金丹以上的高手。',
        masters: [
            { id: 'dy_master_1', name: '观虚子', title: '阁主', realm: '渡劫', layer: 5, age: 120,
              desc: '大隐阁阁主，清癯慧黠，平日里最爱下棋品茶。看似闲散，实则洞察一切。', personality: '慧黠通透，洞察力强',
              skills: ['天机棋术', '逍遥游', '大衍诀'],
              acceptStudent: true, maxStudents: 3, requirement: { realm: '金丹', layer: 1, contribution: 0, talent: 60 } }
        ],
        specialResources: [
            { id: 'dy_resource_tea', name: '观虚茶苑', type: 'culture', output: 5, desc: '品茶论道之地' }
        ]
    };

    // 天书阁
    SECT_DEEP_DATA['天书阁'] = {
        desc: '收罗天下典籍之地，阁主归藏子以"抢救濒危武学典籍"为名收藏天下功法。',
        masters: [
            { id: 'ts_master_1', name: '归藏子', title: '阁主', realm: '渡劫', layer: 9, age: 150,
              desc: '天书阁阁主，白发长须，仙风道骨。骨子里却是天下第一藏书癖雅贼，以抢救典籍为名潜入各大门派抄录功法。', personality: '混乱善良，老狐狸',
              skills: ['万卷书藏', '天罡步', '归藏诀'],
              acceptStudent: true, maxStudents: 2, requirement: { realm: '渡劫', layer: 1, contribution: 0, karma: 100 } }
        ],
        specialResources: [
            { id: 'ts_resource_library', name: '天书阁藏书', type: 'culture', output: 10, desc: '天下最全的功法典籍收藏' }
        ]
    };
}

// ============ 导出 ============
// 在导出前显式初始化，确保 SECT_DEEP_DATA 包含所有门派数据
initSectsDeepData();

// ==================== v16.3 门派每日事件池（D2 泛化引擎数据） ====================
// effects 词表：contribution/points/fame/item{id,count}/buff{name,effects,hours}/repSelf(本派声望)
// 触发：入派弟子每日首次开门派面板 roll 50%；无事件日安静；同日不重弹
const SECT_EVENTS = {
    '少林寺': [
        { id: 'se_sl_yu', icon: '🌧️', name: '藏经阁夜雨', text: '夜雨漏湿了阁顶，一册《洗髓经》抄本岌岌可危。', choices: [
            { label: '冒雨抢修', effects: { contribution: 40 }, reply: '方丈赞你护经有功。' },
            { label: '明日再报修缮司', effects: {}, reply: '翌日抄本已生了霉斑——知客僧的脸色很不好看。' } ] },
        { id: 'se_sl_xiangke', icon: '🙏', name: '香客闹事', text: '一名醉汉在大殿撒泼，香客们敢怒不敢言。', choices: [
            { label: '上前劝解', effects: { fame: 5, contribution: 20 }, reply: '武僧们向你合十致意。' },
            { label: '袖手旁观', effects: { fame: -3 }, reply: '最终是戒律院出面，看了你一眼没说话。' } ] },
        { id: 'se_sl_jielv', icon: '⚠️', name: '戒律院失物', text: '戒律院丢了一串念珠，正在排查当值弟子。', choices: [
            { label: '协助彻查', effects: { points: 10 }, reply: '你从柴房夹层寻出了念珠——是松鼠干的。' },
            { label: '不趟浑水', effects: {}, reply: '多一事不如少一事。' } ] },
        { id: 'se_sl_jing', icon: '🍵', name: '井水泛甘', text: '寺中老井的水忽然泛起回甘，僧众称奇。', choices: [
            { label: '打水共饮', effects: { buff: { name: '甘泉沁体', effects: { constitution: 4 }, hours: 8 } }, reply: '一股清气自丹田升起。' } ] }
    ],
    '武当派': [
        { id: 'se_wd_jiangdao', icon: '📿', name: '紫霄宫讲道', text: '今日紫霄宫有长老开讲《太上感应篇》。', choices: [
            { label: '拂晓占座听讲', effects: { buff: { name: '道音灌耳', effects: { intelligence: 5 }, hours: 8 } }, reply: '一夜未散的妙义仍在耳边。' },
            { label: '补觉', effects: {}, reply: '醒来时讲道已散，殿前只剩扫帚声。' } ] },
        { id: 'se_wd_tashi', icon: '⛰️', name: '山道塌石', text: '夜雨冲塌了上山道的半壁碎石。', choices: [
            { label: '连夜清障', effects: { contribution: 40 }, reply: '天亮时山道复通，监院记下了你的名字。' },
            { label: '绕行报官', effects: {}, reply: '官府说山道归武当管。' } ] },
        { id: 'se_wd_jiesu', icon: '🏮', name: '道友借宿', text: '一位风尘仆仆的游方道人叩门求宿。', choices: [
            { label: '让出厢房', effects: { fame: 5 }, reply: '他留下一句"心善则近道"，飘然而去。' },
            { label: '婉拒', effects: {}, reply: '道人在山门外坐了一夜。你有点后悔。' } ] },
        { id: 'se_wd_lingque', icon: '🕊️', name: '太和灵雀', text: '一只灵雀落在你肩头，啄了啄你的衣领。', choices: [
            { label: '随它绕峰一周', effects: { buff: { name: '灵雀引路', effects: { dexterity: 4 }, hours: 8 } }, reply: '这一圈走完，脚下轻了不少。' } ] }
    ],
    '药王谷': [
        { id: 'se_yw_yibing', icon: '💊', name: '疫病征兆', text: '山下村落有人高热不退，症状蹊跷。', choices: [
            { label: '报备谷主并下山施药', effects: { contribution: 50, fame: 5 }, reply: '谷主亲自配伍，你掌针——病人退热时天刚亮。' },
            { label: '独自采药试方', effects: { item: { id: 'spirit_grass', count: 6 } }, reply: '试出了新配比，也蹭破了两袖子。' } ] },
        { id: 'se_yw_yedao', icon: '🌙', name: '药圃夜盗', text: '圃里的七叶一枝花被人齐根挖走了几株。', choices: [
            { label: '守夜捉贼', effects: { points: 10 }, reply: '贼是一只獾。你把它扔出了篱笆外。' },
            { label: '补种了事', effects: {}, reply: '补种的苗蔫头耷脑。' } ] },
        { id: 'se_yw_zhenyin', icon: '🌱', name: '珍稀药引', text: '崖缝里发现一株野生雪莲参。', choices: [
            { label: '冒险攀采', effects: { item: { id: 'spirit_grass', count: 4 } }, reply: '衣袍刮破了，值。' } ] },
        { id: 'se_yw_binguan', icon: '🧾', name: '病患赖账', text: '痊愈的山匪扬长而去，药钱分文未付。', choices: [
            { label: '追到山下去讨', effects: { contribution: 30 }, reply: '他把钱袋扔过来就跑——算他识相。' },
            { label: '记在账上', effects: { fame: -2 }, reply: '谷规：坏账从经手人份例里扣。' } ] }
    ],
    '修罗宫': [
        { id: 'se_xlg_gongzhu', icon: '🌹', name: '宫主召见', text: '宫主深夜召见，烛影摇红。', choices: [
            { label: '应召前往', effects: { contribution: 30, fame: 3 }, reply: '宫主只问了三个问题，然后挥退了你。你答得还行。' },
            { label: '称病不去', effects: { contribution: -10 }, reply: '"病了？"传话的姐姐笑得很轻。"宫主记下了。"' } ] },
        { id: 'se_xlg_zhengzhi', icon: '💢', name: '姐妹争执', text: '两名师姐为一柄短刃几乎动手。', choices: [
            { label: '居中调停', effects: { points: 10 }, reply: '刀断案平，两人各得了台阶下。' },
            { label: '助阵一方', effects: { fame: -2 }, reply: '赢是赢了，另一位记住了你。' } ] },
        { id: 'se_xlg_xueyue', icon: '🌙', name: '血月之夜', text: '血月当空，宫中杀气躁动。', choices: [
            { label: '趁月演刀', effects: { buff: { name: '血月杀意', effects: { strength: 5 }, hours: 8 } }, reply: '刀势比平日快了三分。' } ] },
        { id: 'se_xlg_shixin', icon: '🧂', name: '盐船误期', text: '购盐的船被税卡扣在了乌江渡。', choices: [
            { label: '带姐妹去"讲道理"', effects: { contribution: 35 }, reply: '税吏看见修罗宫的腰牌，盐船当场放行。' },
            { label: '加价走黑市', effects: { contribution: -15 }, reply: '黑市就是黑，但货到了。' } ] }
    ],
    '逍遥派': [
        { id: 'se_xy_qiju', icon: '⚫', name: '棋局残谱', text: '石桌上有前人留下的半局残棋。', choices: [
            { label: '参悟一日', effects: { buff: { name: '棋悟', effects: { intelligence: 6 }, hours: 8 } }, reply: '落子时忽然懂了那手"倒脱靴"。' },
            { label: '复原原局', effects: { points: 10 }, reply: '与阁中旧谱对上了——分毫不差。' } ] },
        { id: 'se_xy_beiyin', icon: '🎶', name: '北冥遗音', text: '深潭底传来若有若无的琴音。', choices: [
            { label: '屏息聆听', effects: { buff: { name: '潭底遗音', effects: { meridian: 5 }, hours: 8 } }, reply: '内息随琴韵自行流转了一个周天。' } ] },
        { id: 'se_xy_fangke', icon: '🎒', name: '山中访客', text: '一名自称故人之后的少年求见。', choices: [
            { label: '以礼相待', effects: { fame: 5 }, reply: '他磕了三个头，留下一段木刻走了。' },
            { label: '闭门不见', effects: {}, reply: '门外的脚步声久久没有离开。' } ] }
    ],
    '唐门': [
        { id: 'se_tm_zoushui', icon: '🔥', name: '毒炉走水', text: '淬毒房的炉子炸了膛，火舌卷向配方架。', choices: [
            { label: '抢救配方', effects: { contribution: 40 }, reply: '眉毛燎了一半，《百毒配伍》保住了。' },
            { label: '先撤再报', effects: {}, reply: '半间房没了。堂主没骂你，只是叹气。' } ] },
        { id: 'se_tm_shishe', icon: '🎯', name: '新式暗器试射', text: '工坊新造了一批子母飞蝗镖，缺人试射。', choices: [
            { label: '下场试射', effects: { buff: { name: '手感火热', effects: { dexterity: 5 }, hours: 8 } }, reply: '三连发全中靶心，工坊师傅直咂嘴。' } ] },
        { id: 'se_tm_heishi', icon: '💰', name: '黑市询价', text: '有神秘人愿出高价买一份旧图纸。', choices: [
            { label: '卖出图纸', effects: { contribution: 60, fame: -3 }, reply: '钱进了公账，可总觉得被人盯上了。' },
            { label: '烧毁图纸', effects: { fame: 4 }, reply: '火盆里卷起的灰烬像一句祖训。' } ] }
    ],
    '丐帮': [
        { id: 'se_gb_jingyi', icon: '📜', name: '净衣派请柬', text: '净衣派长老下帖，邀你去赴城南酒楼之宴。', choices: [
            { label: '赴宴', effects: { contribution: 30 }, reply: '席间净衣长老记住了你这个后辈。' },
            { label: '辞谢', effects: { fame: 3 }, reply: '污衣派的弟兄朝你竖起了大拇指。' } ] },
        { id: 'se_gb_wuyi', icon: '🥊', name: '污衣兄弟挨欺', text: '城西恶霸当街踢翻了污衣弟兄的破碗。', choices: [
            { label: '出头', effects: { fame: 6, points: 10 }, reply: '恶霸挨了三拳，围观人群里叫好声一片。' },
            { label: '报官府', effects: { contribution: 20 }, reply: '官差收了钱，只把恶霸劝走了。——也算办成了事？' } ] },
        { id: 'se_gb_shizhou', icon: '🍚', name: '城南沙粥棚', text: '帮里在城南支了施粥棚，缺人手。', choices: [
            { label: '去搅粥', effects: { buff: { name: '热粥暖身', effects: { constitution: 4 }, hours: 8 } }, reply: '一天下来浑身米香，心里踏实。' } ] },
        { id: 'se_gb_dagou', icon: '🐕', name: '打狗棒失窃疑云', text: '看棒的长老喝多了，坚称打狗棒被人换了假的。', choices: [
            { label: '帮他找回来', effects: { contribution: 35 }, reply: '棒子在当铺柜台后面——是他自己上周当的。大家都装作不知道。' },
            { label: '陪他喝酒', effects: { fame: 2 }, reply: '酒醒了，棒也"找回来"了。' } ] }
    ],
    '铸剑山庄': [
        { id: 'se_zj_jinghuo', icon: '🔥', name: '锻炉竞火', text: '庄内两位锻造师为一批军单争炉。', choices: [
            { label: '通宵助锻', effects: { item: { id: 'iron_ore', count: 6 }, contribution: 30 }, reply: '出炉那一刻，两边的锤声都为你停了一拍。' },
            { label: '旁观学艺', effects: { buff: { name: '观锤得悟', effects: { strength: 4 }, hours: 8 } }, reply: '看完这一夜，抡锤的腕子都会发力了。' } ] },
        { id: 'se_zh_mingjian', icon: '⚔️', name: '名剑认主', text: '炉中一柄新剑成色异样，剑胚似有心跳。', choices: [
            { label: '献于庄主', effects: { contribution: 60 }, reply: '庄主抚剑良久："此剑择主，尚需火候。"' },
            { label: '申请留用', effects: { points: 15 }, reply: '批下来了——但要签生死状。你签了。' } ] }
    ],
    '茅山派': [
        { id: 'se_ms_yizhuang', icon: '⚰️', name: '义庄异动', text: '镇外义庄传来棺木板挪动的声响。', choices: [
            { label: '连夜镇守', effects: { fame: 6, points: 10 }, reply: '钉子加固了三遍，鸡鸣时分动静停了。' },
            { label: '天亮再探', effects: {}, reply: '天亮去看——棺材板整整齐齐，像什么都没发生过。' } ] },
        { id: 'se_ms_fuzhi_shouchao', icon: '📜', name: '符纸受潮', text: '梅雨浸透了半库黄纸。', choices: [
            { type: null, label: '炭火焙干', effects: { contribution: 25 }, reply: '焙了一夜，纸角微卷但能用。' } ] }
    ],
    '全真教': [
        { id: 'se_qz_fahui', icon: '🕊️', name: '重阳宫法会', text: '重阳宫大法会缺一名执灯弟子。', choices: [
            { label: '主动执灯', effects: { buff: { name: '法会熏习', effects: { meridian: 5 }, hours: 8 } }, reply: '灯火通明处，呼吸自己慢了下来。' },
            { label: '殿外守夜', effects: { points: 8 }, reply: '夜里没什么事，除了猫。' } ] },
        { id: 'se_qz_jiufen', icon: '⚖️', name: '山下道观纠纷', text: '两家小道观为供奉归属闹到了山上。', choices: [
            { label: '前往调处', effects: { fame: 5, contribution: 25 }, reply: '你把供像判给了年长的观——两家都服了。' },
            { label: '推给掌院', effects: {}, reply: '掌院的批复只有两个字：自理。' } ] }
    ],
    '天山派': [
        { id: 'se_ts_hantan', icon: '❄️', name: '寒潭剑鸣', text: '寒潭底传来剑鸣，一夜未歇。', choices: [
            { label: '凌晨潜探', effects: { buff: { name: '寒潭剑气', effects: { dexterity: 5 }, hours: 8 } }, reply: '潭底无剑——但你的剑快了。' },
            { label: '记录在案', effects: { points: 8 }, reply: '册子上添了一笔，墨都冻住了。' } ] },
        { id: 'se_ts_pixue', icon: '⛷️', name: '飘雪坪比试', text: '同门在飘雪坪约战，缺一个对手。', choices: [
            { label: '下场切磋', effects: { buff: { name: '雪坪激战', effects: { strength: 4 }, hours: 8 }, fame: 3 }, reply: '三十招不败，观战的师兄点了点头。' },
            { label: '观礼', effects: {}, reply: '看别人打架也是学问。' } ] }
    ],
    '金刚宗': [
        { id: 'se_jgz_hufa', icon: '🧘', name: '长老闭关护法', text: '护法长老闭关，需人值守洞口四十九日轮值。', choices: [
            { label: '主动值守', effects: { contribution: 45 }, reply: '出关那日，长老只对你一人颔首。' },
            { label: '排班回避', effects: {}, reply: '你被排到了最后一天——还是雨天。' } ] },
        { id: 'se_jgz_tiaozhan', icon: '🥊', name: '外僧挑战', text: '一名云游武僧在山门外擂台叫阵。', choices: [
            { label: '应战', effects: { buff: { name: '擂台血勇', effects: { strength: 5 }, hours: 8 }, fame: 4 }, reply: '胜负难分，武僧笑着留下一句"三年后再来"。' },
            { label: '让场', effects: {}, reply: '让给了师兄——他赢了，也替你接下了那句"三年"。' } ] }
    ],
    '蓬莱派': [
        { id: 'se_pl_haishi', icon: '🌊', name: '海市蜃楼', text: '海面浮起亭台楼阁的倒影，转瞬即逝。', choices: [
            { label: '出海查探', effects: { item: { id: 'spirit_stone', count: 40 }, fame: 4 }, reply: '礁石缝里卡着一块晶石——蜃楼留下的？' },
            { label: '图录记载', effects: { points: 10 }, reply: '你的手绘被掌门夸了一句"有几分意思"。' } ] },
        { id: 'se_pl_chaoxin', icon: '🐚', name: '潮信失调', text: '环岛潮汐阵的阵眼被海草缠死了。', choices: [
            { label: '潜水修复', effects: { contribution: 35 }, reply: '上来时耳朵疼了三天，潮信准了。' } ] }
    ]
};
window.SECT_EVENTS = SECT_EVENTS;
window.SECT_DEEP_DATA = SECT_DEEP_DATA;
window.COMMON_RANKS = COMMON_RANKS;
window.COMMON_TASKS = COMMON_TASKS;
window.initSectsDeepData = initSectsDeepData;