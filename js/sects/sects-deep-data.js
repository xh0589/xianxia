// ==================== sects-deep-data.js - 门派深度数据（v10.0） ====================
// 包含第一梯队+第二梯队共16个门派的深度数据
// 数据驱动：师徒/职务/派系/任务/事件/掌门
// 加载顺序：在sects-system.js之后，sect-visit.js之前

var SECT_DEEP_DATA = {};

// ============ 通用职务体系（所有门派共用） ============
var COMMON_RANKS = [
    { id: 7, name: '杂役弟子', desc: '纯后勤劳动力（挑水、砍柴）',
      privileges: ['基础住宿', '公共食堂', '藏经阁一层'], duties: ['打扫庭院', '挑水劈柴', '厨房帮工'], // 特权表跟真门对齐：一层·外门阁本就对杂役开（maxRank 7），此前表上漏写
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
              skills: ['太祖长拳', '丐帮通背拳'],
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
            { id: 'tsg_master_1', name: '归藏子', title: '阁主', realm: '渡劫', layer: 9, age: 150,
              desc: '天书阁阁主，白发长须，仙风道骨。骨子里却是天下第一藏书癖雅贼，以抢救典籍为名潜入各大门派抄录功法。', personality: '混乱善良，老狐狸',
              skills: ['万卷书藏', '天罡步', '归藏诀'],
              acceptStudent: true, maxStudents: 2, requirement: { realm: '渡劫', layer: 1, contribution: 0, karma: 100 } }
        ],
        specialResources: [
            { id: 'tsg_resource_library', name: '天书阁藏书', type: 'culture', output: 10, desc: '天下最全的功法典籍收藏' }
        ]
    };

    // ============ v20.94 补齐：其余 17 派的师徒/派系深度数据（36 派全数落户） ============
    SECT_DEEP_DATA['武当派'] = {
        desc: '内家拳剑之宗，以柔克刚，以静制动。真武大帝道场，山上道人个个绵里藏针。',
        masters: [
            { id: 'wud_master_1', name: '张三丰', title: '太上祖师', realm: '渡劫', layer: 5, age: 160,
              desc: '武当开山祖师，太极之道自成天地。百年不出紫霄宫，出则天下震动。', personality: '冲淡谦和，深不可测',
              skills: ['太极剑意', '太极推手', '纯阳无极功'],
              acceptStudent: false, maxStudents: 0, requirement: {} },
            { id: 'wud_master_2', name: '宋远桥', title: '掌院长老', realm: '金丹', layer: 9, age: 58,
              desc: '代掌门执掌山中事务，为人端方，弟子有过必罚、有功必录。', personality: '端方持重',
              skills: ['太极拳', '绵掌', '梯云纵'],
              acceptStudent: true, maxStudents: 2, requirement: { realm: '筑基', layer: 6, contribution: 500 } },
            { id: 'wud_master_3', name: '俞莲舟', title: '执法长老', realm: '金丹', layer: 7, age: 55,
              desc: '外冷内热的执法长老，手上功夫全派第二，罚人从不留情面。', personality: '冷面热心',
              skills: ['神门十三剑', '虎爪手'],
              acceptStudent: true, maxStudents: 2, requirement: { realm: '筑基', layer: 4, contribution: 400 } }
        ],
        factions: [
            { id: 'wud_faction_zixiao', name: '紫霄讲席', icon: '☯️', desc: '主张以太极养天下，广收门徒、开坛讲学。', leader: '宋远桥', members: [], stance: { open: 30, orthodox: 15 }, influence: 40 },
            { id: 'wud_faction_houshan', name: '后山守静', icon: '🌙', desc: '主张闭门守拙，真武之道不在人多。', leader: '俞莲舟', members: [], stance: { orthodox: 30, open: 8 }, influence: 30 }
        ],
        specialResources: [
            { id: 'wud_resource_zhenwu', name: '真武道场香火', type: 'culture', output: 8, desc: '真武大帝道场，四方香客不绝' }
        ]
    };

    SECT_DEEP_DATA['峨眉派'] = {
        desc: '金顶佛光与剑影并存的门派，弟子多为女子，出手却比男儿更利落。',
        masters: [
            { id: 'em_master_1', name: '风陵师太', title: '太上长老', realm: '元婴', layer: 5, age: 96,
              desc: '峨眉辈分最高的师太，金顶闭关多年，一句话能定派中大议。', personality: '方正严厉',
              skills: ['峨眉剑法', '四象掌', '金顶佛光'],
              acceptStudent: false, maxStudents: 0, requirement: {} },
            { id: 'em_master_2', name: '静玄师太', title: '掌事长老', realm: '金丹', layer: 8, age: 62,
              desc: '主持峨眉日常事务，对弟子严、对山下百姓宽。', personality: '严而不苛',
              skills: ['峨眉剑法', '飘雪穿云掌'],
              acceptStudent: true, maxStudents: 2, requirement: { realm: '筑基', layer: 5, contribution: 500 } },
            { id: 'em_master_3', name: '明霞师太', title: '知客长老', realm: '金丹', layer: 5, age: 48,
              desc: '接待各方来客的知客长老，笑脸背后一双眼睛毒得很。', personality: '外圆内方',
              skills: ['九阳功', '截手九式'],
              acceptStudent: true, maxStudents: 3, requirement: { realm: '筑基', layer: 2, contribution: 300 } }
        ],
        factions: [
            { id: 'em_faction_jinding', name: '金顶持律', icon: '⛰️', desc: '守金顶戒律，主张峨眉剑不出则已、出则必正。', leader: '风陵师太', members: [], stance: { orthodox: 32, open: 6 }, influence: 42 },
            { id: 'em_faction_baisui', name: '百岁行走', icon: '🚶', desc: '主张弟子下山行走济世，剑在人间才算活。', leader: '明霞师太', members: [], stance: { open: 28, orthodox: 12 }, influence: 30 }
        ],
        specialResources: [
            { id: 'em_resource_jinding', name: '金顶香火', type: 'culture', output: 8, desc: '金顶佛光，香客供奉常年不断' }
        ]
    };

    SECT_DEEP_DATA['华山派'] = {
        desc: '西岳剑派，剑气之争吵了三十年——气宗说内力为本，剑宗说招式为锋。',
        masters: [
            { id: 'hua_master_1', name: '风清扬', title: '思过崖剑祖', realm: '渡劫', layer: 3, age: 130,
              desc: '隐居思过崖的剑宗前辈，无招胜有招的活祖宗，二十年不下崖。', personality: '孤高洒脱',
              skills: ['独孤九剑', '华山剑法', '太岳三青峰'],
              acceptStudent: false, maxStudents: 0, requirement: {} },
            { id: 'hua_master_2', name: '宁中则', title: '女侠长老', realm: '元婴', layer: 2, age: 52,
              desc: '华山上下敬重的女侠，剑法端正，待弟子如儿女。', personality: '刚正温厚',
              skills: ['华山剑法', '无双无对宁氏剑'],
              acceptStudent: true, maxStudents: 2, requirement: { realm: '筑基', layer: 6, contribution: 500 } },
            { id: 'hua_master_3', name: '白云生', title: '传剑长老', realm: '金丹', layer: 8, age: 55,
              desc: '专授外门弟子剑招的传剑长老，嘴上刻薄，手上不藏私。', personality: '嘴硬心软',
              skills: ['华山剑法', '玉女十九剑'],
              acceptStudent: true, maxStudents: 3, requirement: { realm: '筑基', layer: 2, contribution: 300 } }
        ],
        factions: [
            { id: 'hua_faction_qi', name: '气宗一脉', icon: '🌬️', desc: '主张以气御剑，内力为本。', leader: '宁中则', members: [], stance: { orthodox: 30, open: 10 }, influence: 38 },
            { id: 'hua_faction_jian', name: '剑宗遗脉', icon: '⚔️', desc: '主张剑走偏锋，招式为锋。', leader: '白云生', members: [], stance: { open: 26, orthodox: 14 }, influence: 28 }
        ],
        specialResources: [
            { id: 'hua_resource_siguo', name: '思过崖石壁剑痕', type: 'culture', output: 6, desc: '石壁上历代剑痕，参悟者络绎不绝' }
        ]
    };

    SECT_DEEP_DATA['恒山派'] = {
        desc: '五岳中的女尼门派，白云庵钟声一响，山下恶人先怯三分。',
        masters: [
            { id: 'hen_master_1', name: '定闲师太', title: '太上长老', realm: '元婴', layer: 4, age: 88,
              desc: '恒山辈分最高的师太，慈悲是面，剑是里。', personality: '慈悲果决',
              skills: ['恒山剑法', '万花剑阵'],
              acceptStudent: false, maxStudents: 0, requirement: {} },
            { id: 'hen_master_2', name: '定静师太', title: '掌戒长老', realm: '金丹', layer: 9, age: 70,
              desc: '执掌戒律的老师太，庵里谁的针线短了一寸都瞒不过她。', personality: '一丝不苟',
              skills: ['恒山剑法', '白云剑意'],
              acceptStudent: true, maxStudents: 2, requirement: { realm: '筑基', layer: 4, contribution: 400 } },
            { id: 'hen_master_3', name: '一清师太', title: '知客长老', realm: '金丹', layer: 6, age: 50,
              desc: '管迎来送往的知客，说话轻声细语，账目分毫不差。', personality: '温和精细',
              skills: ['恒山剑法', '回风拂柳剑'],
              acceptStudent: true, maxStudents: 3, requirement: { realm: '炼气', layer: 8, contribution: 250 } }
        ],
        factions: [
            { id: 'hen_faction_baiyun', name: '白云持戒', icon: '🛕', desc: '守庵中清规，修行先修心。', leader: '定静师太', members: [], stance: { orthodox: 32, open: 5 }, influence: 40 },
            { id: 'hen_faction_jianxing', name: '见性行走', icon: '🚶', desc: '主张入世救苦，剑随人走。', leader: '一清师太', members: [], stance: { open: 25, orthodox: 14 }, influence: 28 }
        ],
        specialResources: [
            { id: 'hen_resource_zhongsheng', name: '白云庵钟声', type: 'culture', output: 6, desc: '晨钟暮鼓，闻者心静，香火自聚' }
        ]
    };

    SECT_DEEP_DATA['泰山派'] = {
        desc: '东岳剑派，登高望远，剑势如十八盘石阶——一步一个脚印，一步比一步高。',
        masters: [
            { id: 'tai_master_1', name: '天门道人', title: '退隐掌门', realm: '元婴', layer: 5, age: 90,
              desc: '上一代掌门，把位子让给年轻人后在岱顶观日，一观三十年。', personality: '沉稳如山',
              skills: ['泰山剑法', '岱宗如何'],
              acceptStudent: false, maxStudents: 0, requirement: {} },
            { id: 'tai_master_2', name: '天松道人', title: '掌律长老', realm: '金丹', layer: 8, age: 66,
              desc: '执掌门规的老道人，罚弟子先罚自己戒斋三日。', personality: '律己律人',
              skills: ['泰山剑法', '五大夫剑'],
              acceptStudent: true, maxStudents: 2, requirement: { realm: '筑基', layer: 4, contribution: 450 } },
            { id: 'tai_master_3', name: '天乙道人', title: '知观长老', realm: '金丹', layer: 6, age: 54,
              desc: '管山下道观香火的知观，算盘打得比剑快。', personality: '精明周到',
              skills: ['泰山剑法', '快活三剑'],
              acceptStudent: true, maxStudents: 3, requirement: { realm: '炼气', layer: 8, contribution: 250 } }
        ],
        factions: [
            { id: 'tai_faction_daiding', name: '岱顶观日', icon: '🌄', desc: '守泰山正统剑路，稳字当头。', leader: '天松道人', members: [], stance: { orthodox: 30, open: 8 }, influence: 40 },
            { id: 'tai_faction_xianghuo', name: '山下香火', icon: '🏮', desc: '主张广结善缘，香火养剑。', leader: '天乙道人', members: [], stance: { open: 26, orthodox: 12 }, influence: 28 }
        ],
        specialResources: [
            { id: 'tai_resource_xianghuo', name: '岱庙香火', type: 'culture', output: 7, desc: '东岳大庙香火甲于天下' }
        ]
    };

    SECT_DEEP_DATA['嵩山派'] = {
        desc: '五岳盟主旧地，嵩山十三太保名震江湖——如今旗号还在，锋芒收敛了几分。',
        masters: [
            { id: 'song_master_1', name: '左冷禅', title: '退隐掌门', realm: '元婴', layer: 8, age: 78,
              desc: '当年力压五岳的盟主，闭死关多年。有人说他放下了，有人说他在等一个翻盘的机会。', personality: '枭雄迟暮',
              skills: ['嵩山剑法', '寒冰神掌', '大嵩阳神掌'],
              acceptStudent: false, maxStudents: 0, requirement: {} },
            { id: 'song_master_2', name: '费彬', title: '大嵩阳手', realm: '金丹', layer: 9, age: 60,
              desc: '十三太保里硕果仅存的老资格，掌法沉雄，最讲门面。', personality: '好胜要面子',
              skills: ['大嵩阳神掌', '嵩山剑法'],
              acceptStudent: true, maxStudents: 2, requirement: { realm: '筑基', layer: 6, contribution: 550 } },
            { id: 'song_master_3', name: '丁坚', title: '执法长老', realm: '金丹', layer: 6, age: 48,
              desc: '执法堂出身，条文背得比谁都熟，罚单开得比谁都稳。', personality: '刻板公正',
              skills: ['嵩山剑法', '执法棍'],
              acceptStudent: true, maxStudents: 3, requirement: { realm: '筑基', layer: 2, contribution: 350 } }
        ],
        factions: [
            { id: 'song_faction_mengzhu', name: '盟主旧部', icon: '🏛️', desc: '念着五岳盟主的旧旗号，主张重执牛耳。', leader: '费彬', members: [], stance: { orthodox: 20, expansion: 25 }, influence: 38 },
            { id: 'song_faction_zhifa', name: '执法堂一脉', icon: '⚖️', desc: '主张先立规矩再谈雄图，条文即门规。', leader: '丁坚', members: [], stance: { orthodox: 30, open: 6 }, influence: 30 }
        ],
        specialResources: [
            { id: 'song_resource_wuyue', name: '五岳盟会旧例', type: 'culture', output: 7, desc: '五岳议事旧地，各方仍认这块招牌' }
        ]
    };

    SECT_DEEP_DATA['青城派'] = {
        desc: '青城天下幽。道门剑派藏在林泉深处，剑招也带着三分雾气。',
        masters: [
            { id: 'qc_master_1', name: '清阳道人', title: '太上长老', realm: '元婴', layer: 3, age: 92,
              desc: '天师洞里最老的一位，幽居不出，出言必中。', personality: '清静无为',
              skills: ['青城剑法', '松风剑意'],
              acceptStudent: false, maxStudents: 0, requirement: {} },
            { id: 'qc_master_2', name: '玄真道人', title: '掌剑长老', realm: '金丹', layer: 8, age: 60,
              desc: '掌青城剑炉的长老，铸剑如修道，火候差一分都不行。', personality: '严谨寡言',
              skills: ['青城剑法', '鹤唳九霄'],
              acceptStudent: true, maxStudents: 2, requirement: { realm: '筑基', layer: 4, contribution: 450 } },
            { id: 'qc_master_3', name: '松风道人', title: '知客长老', realm: '金丹', layer: 5, age: 46,
              desc: '迎来送往的知客，笑声爽朗，茶里功夫比剑里深。', personality: '爽朗机变',
              skills: ['青城剑法', '松风掌'],
              acceptStudent: true, maxStudents: 3, requirement: { realm: '炼气', layer: 8, contribution: 250 } }
        ],
        factions: [
            { id: 'qc_faction_tianshi', name: '天师洞清修', icon: '🍃', desc: '守幽字诀，清修剑心。', leader: '玄真道人', members: [], stance: { orthodox: 30, open: 6 }, influence: 38 },
            { id: 'qc_faction_shancha', name: '山茶结缘', icon: '🍵', desc: '主张以茶剑会友，广结四方善缘。', leader: '松风道人', members: [], stance: { open: 28, orthodox: 10 }, influence: 28 }
        ],
        specialResources: [
            { id: 'qc_resource_youlin', name: '青城幽林道场', type: 'culture', output: 6, desc: '天下幽境，修行者慕名借宿不绝' }
        ]
    };

    SECT_DEEP_DATA['衡山派'] = {
        desc: '琴剑双修的南岳门派，潇湘烟雨里长大的剑，出手都带着节拍。',
        masters: [
            { id: 'xiang_master_1', name: '莫大先生', title: '琴剑祖师', realm: '元婴', layer: 6, age: 85,
              desc: '胡琴一拉，剑已封喉。江湖上都说莫大的琴里藏着衡山最利的剑。', personality: '落拓孤高',
              skills: ['衡山剑法', '潇湘夜雨', '琴中剑'],
              acceptStudent: false, maxStudents: 0, requirement: {} },
            { id: 'xiang_master_2', name: '刘正风', title: '琴剑长老', realm: '金丹', layer: 9, age: 58,
              desc: '金盆洗手洗了一半又收回来的长老，琴艺全派第一，剑也不差。', personality: '雅量高致',
              skills: ['衡山剑法', '笑傲江湖曲'],
              acceptStudent: true, maxStudents: 2, requirement: { realm: '筑基', layer: 5, contribution: 500 } },
            { id: 'xiang_master_3', name: '云松居士', title: '传艺长老', realm: '金丹', layer: 6, age: 50,
              desc: '教弟子先学打拍子再学出剑的传艺长老，门下节奏感都是一等一。', personality: '循循善诱',
              skills: ['衡山剑法', '回风落雁剑'],
              acceptStudent: true, maxStudents: 3, requirement: { realm: '筑基', layer: 2, contribution: 300 } }
        ],
        factions: [
            { id: 'xiang_faction_qinjian', name: '琴剑堂', icon: '🎻', desc: '琴剑合璧为衡山正宗，先懂音律再谈剑。', leader: '刘正风', members: [], stance: { orthodox: 28, open: 12 }, influence: 40 },
            { id: 'xiang_faction_xiaoxiang', name: '潇湘行走', icon: '🌧️', desc: '主张剑走江湖，烟雨里练出来的才算数。', leader: '云松居士', members: [], stance: { open: 30, orthodox: 8 }, influence: 26 }
        ],
        specialResources: [
            { id: 'xiang_resource_qinpu', name: '衡山琴谱刊印', type: 'culture', output: 6, desc: '琴剑双谱刊行四方，文人剑客都买账' }
        ]
    };

    SECT_DEEP_DATA['昆仑派'] = {
        desc: '西域剑派，山高路远，剑法里带着雪线的寒气与戈壁的开阔。',
        masters: [
            { id: 'kl_master_1', name: '何太冲', title: '退隐掌门', realm: '元婴', layer: 4, age: 75,
              desc: '把掌门位传了出去的老剑客，如今只在雪线以上练剑。', personality: '孤傲自省',
              skills: ['昆仑剑法', '两仪剑阵'],
              acceptStudent: false, maxStudents: 0, requirement: {} },
            { id: 'kl_master_2', name: '西华子', title: '掌剑长老', realm: '金丹', layer: 8, age: 62,
              desc: '昆仑剑阵的执剑人，双剑合璧天下少见，脾气也少见。', personality: '孤僻严苛',
              skills: ['昆仑剑法', '两仪剑阵'],
              acceptStudent: true, maxStudents: 2, requirement: { realm: '筑基', layer: 6, contribution: 500 } },
            { id: 'kl_master_3', name: '班虚道人', title: '知观长老', realm: '金丹', layer: 5, age: 50,
              desc: '管昆仑山门道观的知观，待人宽和，账目如山。', personality: '宽和持重',
              skills: ['昆仑剑法', '大漠孤烟剑'],
              acceptStudent: true, maxStudents: 3, requirement: { realm: '炼气', layer: 8, contribution: 250 } }
        ],
        factions: [
            { id: 'kl_faction_xuexian', name: '雪线剑庐', icon: '🏔️', desc: '剑在雪线以上练，苦寒出真锋。', leader: '西华子', members: [], stance: { orthodox: 30, open: 6 }, influence: 38 },
            { id: 'kl_faction_shamen', name: '沙门商路', icon: '🐪', desc: '主张剑派也要吃饭，商路护航换资源。', leader: '班虚道人', members: [], stance: { open: 28, orthodox: 10 }, influence: 26 }
        ],
        specialResources: [
            { id: 'kl_resource_shanglu', name: '西域商路护金', type: 'trade', output: 7, desc: '丝路商队常年聘昆仑护镖' }
        ]
    };

    SECT_DEEP_DATA['霹雳堂'] = {
        desc: '火器与暗器的行家里手，堂里终年硝烟不散——惊雷落地处，就是他们的练场。',
        masters: [
            { id: 'pli_master_1', name: '雷老太君', title: '堂主之母', realm: '元婴', layer: 5, age: 95,
              desc: '霹雳堂真正的定海神针，八十岁还能一枪打落百步外的香头。', personality: '火爆明理',
              skills: ['霹雳雷火弹', '惊雷枪'],
              acceptStudent: false, maxStudents: 0, requirement: {} },
            { id: 'pli_master_2', name: '雷震北', title: '掌堂长老', realm: '金丹', layer: 8, age: 58,
              desc: '管火药库的掌堂长老，堂里规矩第一条：火药库前谁抽烟谁挨罚——他自己烟瘾最大，戒了三十年。', personality: '外爆内细',
              skills: ['霹雳雷火弹', '连环弩'],
              acceptStudent: true, maxStudents: 2, requirement: { realm: '筑基', layer: 4, contribution: 500 } },
            { id: 'pli_master_3', name: '火千金', title: '烟火司正', realm: '金丹', layer: 6, age: 40,
              desc: '霹雳堂唯一的烟火女司正，做出来的烟火能卖钱，做出来的雷火能要命。', personality: '心灵手辣',
              skills: ['烟火术', '袖箭'],
              acceptStudent: true, maxStudents: 3, requirement: { realm: '筑基', layer: 2, contribution: 350 } }
        ],
        factions: [
            { id: 'pli_faction_junhuo', name: '军火一脉', icon: '🧨', desc: '雷火是立堂之本，货卖三方、钱养全堂。', leader: '雷震北', members: [], stance: { trade: 30, orthodox: 10 }, influence: 42 },
            { id: 'pli_faction_yanhuo', name: '烟火一脉', icon: '🎆', desc: '主张以烟火铺路，霹雳堂不只会炸。', leader: '火千金', members: [], stance: { open: 26, trade: 16 }, influence: 24 }
        ],
        specialResources: [
            { id: 'pli_resource_huoyao', name: '雷火药坊', type: 'forge', output: 9, desc: '硝石硫磺自成一脉，雷火弹畅销江湖' }
        ]
    };

    SECT_DEEP_DATA['大旗门'] = {
        desc: '军伍出身的门派，旗在人在。门中不讲辈分讲军令，一杆大旗压得住江湖风浪。',
        masters: [
            { id: 'dq_master_1', name: '铁犁', title: '老帅', realm: '元婴', layer: 3, age: 80,
              desc: '大旗门最后一位上过战阵的老帅，军令状比门规牌挂得高。', personality: '铁血沉稳',
              skills: ['大旗枪法', '破阵刀'],
              acceptStudent: false, maxStudents: 0, requirement: {} },
            { id: 'dq_master_2', name: '石敢当', title: '执法头', realm: '金丹', layer: 9, age: 55,
              desc: '执法如军法，二十军棍打下去从不看人脸。', personality: '铁面无私',
              skills: ['大旗枪法', '石锁功'],
              acceptStudent: true, maxStudents: 2, requirement: { realm: '筑基', layer: 5, contribution: 500 } },
            { id: 'dq_master_3', name: '蓝旗', title: '旗卫头', realm: '金丹', layer: 6, age: 42,
              desc: '掌大旗的旗卫头，旗杆比他的命重——这话他自己说的，也真做到过。', personality: '忠勇憨直',
              skills: ['护旗枪', '行军步'],
              acceptStudent: true, maxStudents: 3, requirement: { realm: '筑基', layer: 2, contribution: 300 } }
        ],
        factions: [
            { id: 'dq_faction_junling', name: '军令堂', icon: '🎖️', desc: '门中一切照军法办，旗令即门令。', leader: '石敢当', members: [], stance: { orthodox: 32, open: 4 }, influence: 42 },
            { id: 'dq_faction_huqi', name: '护旗营', icon: '🚩', desc: '大旗所在即门户所在，人在旗在。', leader: '蓝旗', members: [], stance: { orthodox: 24, open: 14 }, influence: 28 }
        ],
        specialResources: [
            { id: 'dq_resource_biaoying', name: '军旅镖营', type: 'trade', output: 8, desc: '军伍出身的镖队，官道商路都认这杆旗' }
        ]
    };

    SECT_DEEP_DATA['血手门'] = {
        desc: '名字最难听、规矩却最严的门派——血手血手，血债血偿，从不滥杀。',
        masters: [
            { id: 'xsm_master_1', name: '赤十三', title: '血衣长老', realm: '元婴', layer: 4, age: 70,
              desc: '血手门辈分最高的长老，一身红衣洗了又洗，还是红的。', personality: '冷峻重诺',
              skills: ['血手印', '赤影身法'],
              acceptStudent: false, maxStudents: 0, requirement: {} },
            { id: 'xsm_master_2', name: '聂无咎', title: '执法判官', realm: '金丹', layer: 8, age: 52,
              desc: '判人生死也判自己人生死的执法判官，门里没人敢在他面前撒谎。', personality: '铁面孤直',
              skills: ['血手印', '判官笔'],
              acceptStudent: true, maxStudents: 2, requirement: { realm: '筑基', layer: 5, contribution: 500 } },
            { id: 'xsm_master_3', name: '雪乌鸦', title: '暗卫头领', realm: '金丹', layer: 6, age: 38,
              desc: '带暗卫的头领，白天睡在房梁上，夜里替全门看门。', personality: '沉默警觉',
              skills: ['夜行术', '血影剑'],
              acceptStudent: true, maxStudents: 3, requirement: { realm: '筑基', layer: 2, contribution: 350 } }
        ],
        factions: [
            { id: 'xsm_faction_xuezhai', name: '血债堂', icon: '🩸', desc: '有债必偿、有仇必报，血手门的规矩之源。', leader: '聂无咎', members: [], stance: { orthodox: 30, revenge: 20 }, influence: 40 },
            { id: 'xsm_faction_anwei', name: '暗卫房', icon: '🌑', desc: '主张少动手多探路，情报比刀快。', leader: '雪乌鸦', members: [], stance: { open: 22, orthodox: 16 }, influence: 26 }
        ],
        specialResources: [
            { id: 'xsm_resource_suozhai', name: '索债行当', type: 'trade', output: 7, desc: '替人讨血债的行当，报酬从来不少' }
        ]
    };

    SECT_DEEP_DATA['飞蝎坞'] = {
        desc: '大漠船坞立起来的门派，明面上走船护航，暗地里毒针无影。',
        masters: [
            { id: 'fxw_master_1', name: '蝎母', title: '老祖', realm: '元婴', layer: 5, age: 100,
              desc: '飞蝎坞的老祖，养了一辈子蝎子，也看了一辈子人心。', personality: '阴柔通透',
              skills: ['蝎尾针法', '万蝎噬心'],
              acceptStudent: false, maxStudents: 0, requirement: {} },
            { id: 'fxw_master_2', name: '沙千里', title: '铁蝎镖头', realm: '金丹', layer: 8, age: 50,
              desc: '走大漠商路的镖头，沙暴里能辨方向，毒虫里能睡安稳觉。', personality: '豪爽谨慎',
              skills: ['蝎尾针法', '大漠刀'],
              acceptStudent: true, maxStudents: 2, requirement: { realm: '筑基', layer: 4, contribution: 450 } },
            { id: 'fxw_master_3', name: '红娘子', title: '毒房头', realm: '金丹', layer: 6, age: 36,
              desc: '掌毒房的红娘子，配毒先配解药——坞里的规矩是她立的。', personality: '细心狠辣',
              skills: ['毒雾弥漫', '蝎毒淬针'],
              acceptStudent: true, maxStudents: 3, requirement: { realm: '筑基', layer: 2, contribution: 300 } }
        ],
        factions: [
            { id: 'fxw_faction_mingbiao', name: '明镖行', icon: '🐫', desc: '走明路护商队，坞里的饭一半是镖钱。', leader: '沙千里', members: [], stance: { trade: 30, open: 10 }, influence: 38 },
            { id: 'fxw_faction_andu', name: '暗毒房', icon: '🦂', desc: '守毒房暗艺，人不犯我针不出袖。', leader: '红娘子', members: [], stance: { orthodox: 26, revenge: 14 }, influence: 28 }
        ],
        specialResources: [
            { id: 'fxw_resource_shanglu', name: '大漠商路抽成', type: 'trade', output: 8, desc: '坞外商路走谁的地盘，谁就得留下买路钱' }
        ]
    };

    SECT_DEEP_DATA['烈日教'] = {
        desc: '拜圣火的教门，教义只有一句：火照四方，焚尽尘妄。仪轨森严，一步不乱。',
        masters: [
            { id: 'lrj_master_1', name: '烈日真人', title: '退位教主', realm: '元婴', layer: 7, age: 110,
              desc: '把教主之位传了下去的老真人，如今只在圣火台守夜。', personality: '威仪深沉',
              skills: ['圣火诀', '焚天掌'],
              acceptStudent: false, maxStudents: 0, requirement: {} },
            { id: 'lrj_master_2', name: '赤焰', title: '圣火使', realm: '金丹', layer: 9, age: 55,
              desc: '掌圣火台的火使，三十年没让火熄过一瞬。', personality: '虔诚执拗',
              skills: ['圣火诀', '火焰喷射'],
              acceptStudent: true, maxStudents: 2, requirement: { realm: '筑基', layer: 5, contribution: 500 } },
            { id: 'lrj_master_3', name: '晦明', title: '焰咏执事', realm: '金丹', layer: 6, age: 44,
              desc: '领教众诵焰经的执事，嗓子哑了三次，仪轨一次没错。', personality: '一丝不苟',
              skills: ['焰咏经', '烈火护盾'],
              acceptStudent: true, maxStudents: 3, requirement: { realm: '炼气', layer: 8, contribution: 250 } }
        ],
        factions: [
            { id: 'lrj_faction_yigui', name: '仪轨堂', icon: '🔥', desc: '圣火仪轨一字不可错，教立之本。', leader: '晦明', members: [], stance: { orthodox: 34, open: 4 }, influence: 42 },
            { id: 'lrj_faction_shanglu', name: '商路火棚', icon: '🏮', desc: '沿丝路设火棚供商旅取暖，火照四方先照路人。', leader: '赤焰', members: [], stance: { open: 26, trade: 16 }, influence: 26 }
        ],
        specialResources: [
            { id: 'lrj_resource_shenghuo', name: '圣火台供奉', type: 'culture', output: 8, desc: '西域商旅路过必献供奉，求圣火照路' }
        ]
    };

    SECT_DEEP_DATA['神机门'] = {
        desc: '机关术的祖师庙，门里弟子个个手上带油、袖里带簧。',
        masters: [
            { id: 'sjm_master_1', name: '公输班', title: '退位老门主', realm: '元婴', layer: 6, age: 98,
              desc: '神机门上一代门主，造过会飞的木鸢，也造过拆不掉的门锁。', personality: '痴迷机巧',
              skills: ['木鸢术', '连环机枢'],
              acceptStudent: false, maxStudents: 0, requirement: {} },
            { id: 'sjm_master_2', name: '墨齿', title: '总工头', realm: '金丹', layer: 8, age: 52,
              desc: '掌全门工造的总工头，图纸比命重，误差比仇大。', personality: '苛刻精准',
              skills: ['机关术', '齿轮弩'],
              acceptStudent: true, maxStudents: 2, requirement: { realm: '筑基', layer: 4, contribution: 500 } },
            { id: 'sjm_master_3', name: '铜雀', title: '机枢师', realm: '金丹', layer: 5, age: 35,
              desc: '最年轻的机枢师，拆过的锁比开过的多。', personality: '好奇跳脱',
              skills: ['开锁术', '铜雀机'],
              acceptStudent: true, maxStudents: 3, requirement: { realm: '筑基', layer: 2, contribution: 300 } }
        ],
        factions: [
            { id: 'sjm_faction_junji', name: '军机营', icon: '⚙️', desc: '造守城器械，接官家订单，门里饭碗最稳的一脉。', leader: '墨齿', members: [], stance: { trade: 28, orthodox: 14 }, influence: 40 },
            { id: 'sjm_faction_qiwu', name: '奇物斋', icon: '🔩', desc: '造好玩的新鲜物件卖江湖，赚得多也惹得眼红。', leader: '铜雀', members: [], stance: { open: 30, trade: 14 }, influence: 24 }
        ],
        specialResources: [
            { id: 'sjm_resource_qixie', name: '机关器械坊', type: 'forge', output: 9, desc: '守城器械与江湖奇物两线开工，订单排到明年' }
        ]
    };

    SECT_DEEP_DATA['侠隐阁'] = {
        desc: '替江湖记档的阁楼——谁家弟子几时下山、哪桩仇怨几时了结，阁里都有一笔。',
        masters: [
            { id: 'xyg_master_1', name: '燕十三', title: '退隐阁主', realm: '元婴', layer: 5, age: 88,
              desc: '上一代阁主，建了侠隐阁的档库，也立了「档不妄改」的阁规。', personality: '孤直守诺',
              skills: ['侠隐剑', '听风辨位'],
              acceptStudent: false, maxStudents: 0, requirement: {} },
            { id: 'xyg_master_2', name: '铁笔判官', title: '执法头', realm: '金丹', layer: 8, age: 56,
              desc: '掌档库执法的头儿，一支铁笔改过生死簿，也从不改档。', personality: '铁笔无私',
              skills: ['判官笔法', '侠隐剑'],
              acceptStudent: true, maxStudents: 2, requirement: { realm: '筑基', layer: 5, contribution: 500 } },
            { id: 'xyg_master_3', name: '闻不倦', title: '掌籍先生', realm: '金丹', layer: 6, age: 45,
              desc: '管天下侠名册的掌籍，记性好到吓人，眼睛毒到吓人。', personality: '博闻细致',
              skills: ['鉴人术', '快笔功'],
              acceptStudent: true, maxStudents: 3, requirement: { realm: '炼气', layer: 8, contribution: 250 } }
        ],
        factions: [
            { id: 'xyg_faction_dangku', name: '档库守旧', icon: '📚', desc: '档不妄改、秘不外泄，阁立的根。', leader: '铁笔判官', members: [], stance: { orthodox: 32, open: 4 }, influence: 42 },
            { id: 'xyg_faction_xiaming', name: '侠名外发', icon: '✉️', desc: '主张侠名册有限外发，让江湖少些冒名顶替。', leader: '闻不倦', members: [], stance: { open: 26, orthodox: 12 }, influence: 24 }
        ],
        specialResources: [
            { id: 'xyg_resource_xiaming', name: '侠名册抄录', type: 'culture', output: 7, desc: '各方势力重金求购侠名册抄本' }
        ]
    };

    SECT_DEEP_DATA['天涯海阁'] = {
        desc: '掌天下路引与驿路的阁门——地图在他们手里，路也在他们手里。',
        masters: [
            { id: 'tyg_master_1', name: '海无涯', title: '退位老阁主', realm: '元婴', layer: 6, age: 90,
              desc: '走过天下所有驿路的老阁主，退位前把三十六条秘径的口诀烧了——他说路该自己走。', personality: '豁达念旧',
              skills: ['天涯步', '观星辨路'],
              acceptStudent: false, maxStudents: 0, requirement: {} },
            { id: 'tyg_master_2', name: '陆明舟', title: '听潮长老', realm: '金丹', layer: 8, age: 54,
              desc: '掌海路驿站的长老，听潮声就知道明天几级风。', personality: '沉稳多谋',
              skills: ['天涯步', '海图志'],
              acceptStudent: true, maxStudents: 2, requirement: { realm: '筑基', layer: 4, contribution: 450 } },
            { id: 'tyg_master_3', name: '过千山', title: '驿丞头', realm: '金丹', layer: 6, age: 44,
              desc: '管陆路驿丞的驿丞头，一张嘴能把三百里驿站说得跟一条街似的。', personality: '热络可靠',
              skills: ['驿路刀', '快马鞭'],
              acceptStudent: true, maxStudents: 3, requirement: { realm: '炼气', layer: 8, contribution: 250 } }
        ],
        factions: [
            { id: 'tyg_faction_hailu', name: '海路一脉', icon: '⛵', desc: '海路驿栈与航线图，阁里的钱袋子。', leader: '陆明舟', members: [], stance: { trade: 30, open: 10 }, influence: 40 },
            { id: 'tyg_faction_lulu', name: '陆路一脉', icon: '🐎', desc: '陆路驿站与路引签发，阁里的人脉网。', leader: '过千山', members: [], stance: { open: 28, trade: 14 }, influence: 28 }
        ],
        specialResources: [
            { id: 'tyg_resource_luyin', name: '路引签发', type: 'trade', output: 9, desc: '天下行商过关都要天涯海阁的路引' }
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
    ],
    '嵩山派': [
        { id: 'se_sgs_mengshi', icon: '🏵️', name: '五岳盟使巡山', text: '盟中使者持五岳令旗上山，点名要核验弟子名册与库甲。', choices: [
            { label: '全程陪同核验', effects: { contribution: 35 }, reply: '名册库甲分毫不差，使者临走时朝你拱了拱手。' },
            { label: '只安排食宿', effects: { points: 8 }, reply: '使者挑不出错，也记不住你的脸。' } ] },
        { id: 'se_sgs_jianpu', icon: '📖', name: '峻极剑谱夜讲', text: '传功长老在峻极殿开讲嵩山剑谱总纲，许内门弟子旁听。', choices: [
            { label: '秉笔记诵一夜', effects: { buff: { name: '剑理通明', effects: { intelligence: 5 }, hours: 8 } }, reply: '十七路剑招的"势"字诀，你忽然听懂了三分。' },
            { label: '听半截回去练剑', effects: { contribution: 15 }, reply: '练是练了，可总觉得自己漏了最要紧的一句。' } ] },
        { id: 'se_sgs_diaoke', icon: '🦅', name: '太室雕窠', text: '崖顶老雕叼走了晒场上的一柄制式铁剑。', choices: [
            { label: '攀崖取回', effects: { contribution: 30, fame: 3 }, reply: '你从雕窠里捞回铁剑，顺带捡了三根好翎毛。' },
            { label: '报执事补领', effects: {}, reply: '补领要写检讨——"为何连剑都看不住"。' } ] }
    ],
    '大旗门': [
        { id: 'se_dq_biaoche', icon: '🚩', name: '镖车缺好手', text: '门里接了趟远镖，走到半路人手病倒两个，旗头点名补缺。', choices: [
            { label: '随镖走一趟', effects: { contribution: 40, fame: 3 }, reply: '一路无事，过卡子时你的大旗门腰牌比银子好使。' },
            { label: '留守看门', effects: { points: 5 }, reply: '镖回来那天，弟兄们讲了一路的山口夜话。' } ] },
        { id: 'se_dq_jiuqi', icon: '🪡', name: '祖旗破旧', text: '传了三代的门旗被山风撕开一道大口子。', choices: [
            { label: '亲手缝补', effects: { contribution: 30 }, reply: '针脚歪歪扭扭，旗头却把它挂在了最显眼处。' },
            { label: '出钱做面新的', effects: { contribution: 20, fame: -2 }, reply: '新旗鲜亮，老弟兄们看了直摇头："旗是旧的硬气。"' } ] },
        { id: 'se_dq_zhenfa', icon: '🥁', name: '旗鼓阵操演', text: '五风十雨旗阵缺一名鼓手，操演就在明日。', choices: [
            { label: '顶上鼓位', effects: { buff: { name: '鼓荡血气', effects: { strength: 4 }, hours: 8 } }, reply: '鼓点一响，全场旗浪翻涌——你的腕子酸了三日，值。' } ] }
    ],
    '恒山派': [
        { id: 'se_hsb_qinpu', icon: '🎼', name: '潇湘烟雨谱', text: '师太在无色庵整理《潇湘烟雨》琴谱，缺人誊抄。', choices: [
            { label: '静室誊谱三日', effects: { contribution: 30, points: 8 }, reply: '抄到"烟雨中"一节，笔意不自觉慢了半拍。' },
            { label: '请习一段', effects: { buff: { name: '琴音洗心', effects: { meridian: 4 }, hours: 8 } }, reply: '一曲终了，胸中块垒随音散了大半。' } ] },
        { id: 'se_hsb_yaopu', icon: '🌿', name: '见性峰药圃', text: '峰后药圃的白云草熟了，师太许弟子自采自用。', choices: [
            { label: '采一篓', effects: { item: { id: 'spirit_grass', count: 3 } }, reply: '叶上晨露未干，是入药的好时辰。' },
            { label: '替师太晒药', effects: { contribution: 25 }, reply: '师太念了声佛号，把最大的一包药材赠了你。' } ] }
    ],
    '华山派': [
        { id: 'se_hsp_zhandao', icon: '🪵', name: '苍龙岭栈道朽断', text: '通向后山的木栈道朽了三根横梁，夜里巡山险出人命。', choices: [
            { label: '悬空换梁', effects: { contribution: 45 }, reply: '脚下千丈深渊，手上不敢有半分抖。换完梁，掌门的嘉许令到了。' },
            { label: '封道报修', effects: { points: 5 }, reply: '工事房排期到了下月——后山晨练的师弟们绕了半月远路。' } ] },
        { id: 'se_hsp_lunjian', icon: '⚔️', name: '云台论剑', text: '云台峰设擂，同门以剑会友，胜者留名石壁。', choices: [
            { label: '下场比剑', effects: { buff: { name: '剑兴正酣', effects: { dexterity: 5 }, hours: 8 }, fame: 3 }, reply: '三胜一负，石壁上多了一道新刻痕。' },
            { label: '台下观剑记招', effects: { points: 10, buff: { name: '观剑有得', effects: { intelligence: 3 }, hours: 8 } }, reply: '看懂了师兄那手"白云出岫"的起手破绽。' } ] },
        { id: 'se_hsp_songfeng', icon: '🌲', name: '松风夜读', text: '夜半松涛大作，吵得值夜弟子无心练功。', choices: [
            { label: '借涛声练内息', effects: { buff: { name: '涛声入定', effects: { meridian: 5 }, hours: 8 } }, reply: '松涛起伏暗合呼吸，一夜行功抵得平日三夜。' } ] }
    ],
    '侠隐阁': [
        { id: 'se_xiy_mingxin', icon: '✉️', name: '无名侠客托信', text: '一位蒙面客在阁外石匣留信托你转交山下遗孤，酬银一封。', choices: [
            { label: '千里送信', effects: { fame: 6, contribution: 20 }, reply: '孩子捧着信哭了。你没收那封银子。' },
            { label: '转交阁主处置', effects: { points: 8 }, reply: '阁主照办了，只在册上记了"侠隐某转呈"五个字。' } ] },
        { id: 'se_xiy_anpu', icon: '🗡️', name: '暗格刀谱', text: '整理旧架时在夹层发现半册无名刀谱，页脚写着"侠隐者，藏锋也"。', choices: [
            { label: '献入阁库', effects: { contribution: 35, points: 10 }, reply: '阁主抚页良久："前人藏锋，今人扬锋——都是侠。"' },
            { label: '私下参详', effects: { buff: { name: '藏锋刀意', effects: { strength: 4 }, hours: 8 } }, reply: '刀谱只练了个起手式，但"藏"字你记住了。' } ] }
    ],
    '天涯海阁': [
        { id: 'se_tyhg_hangci', icon: '⛵', name: '南海航次', text: '阁中商船队下南洋，缺一位压舱的修行者随行护航。', choices: [
            { label: '随船出海', effects: { contribution: 30, item: { id: 'spirit_stone', count: 50 } }, reply: '风浪里护住满船货，返航时分红外加一袋南海晶石。' },
            { label: '留守整理航志', effects: { points: 10 }, reply: '你把三十年航志理出了目录，老船工说这是功德。' } ] },
        { id: 'se_tyhg_jixin', icon: '🕯️', name: '海客急信', text: '一封火漆急信要在潮汛前送到三百里外的分舵。', choices: [
            { label: '星夜疾驰', effects: { fame: 4, contribution: 25 }, reply: '信到时潮头刚好落——你抢出了半日。' },
            { label: '按班次递送', effects: {}, reply: '信迟了三日，分舵错失了一批紧俏货。没人怪你，但账上记了一笔。' } ] }
    ],
    '泰山派': [
        { id: 'se_tsn_richu', icon: '🌄', name: '日观峰观旭', text: '掌门率弟子登日观峰观日出，以采东升紫气。', choices: [
            { label: '峰顶吐纳', effects: { buff: { name: '紫气东来', effects: { meridian: 5 }, hours: 8 } }, reply: '第一缕日光落在眉心，周身百骸都暖了。' },
            { label: '睡到日上三竿', effects: {}, reply: '同门下山时讲峰顶云海，你只能跟着点头。' } ] },
        { id: 'se_tsn_shibi', icon: '🪨', name: '摩崖碑拓', text: '岱庙残碑需人重拓，碑文是泰山剑意总诀。', choices: [
            { label: '亲手椎拓', effects: { contribution: 30, points: 8 }, reply: '拓到"重如岳"三字，手腕沉了下去——剑意透碑而来。' } ] }
    ],
    '神机门': [
        { id: 'se_sjm_muniu', icon: '⚙️', name: '木牛瘫痪', text: '运粮的木牛流马在山道上散了架，齿轮撒了一地。', choices: [
            { label: '当场拆解重装', effects: { buff: { name: '机心入扣', effects: { intelligence: 6 }, hours: 8 }, contribution: 20 }, reply: '重装后木牛走得比原先还稳——你顺手改了个传动比。' },
            { label: '扛回去找师傅', effects: { contribution: 10 }, reply: '师傅瞥了一眼："又是你扛回来的。拆过没有？"' } ] },
        { id: 'se_sjm_nuli', icon: '🏹', name: '连弩验机', text: '新造的八矢连弩等着验机，弩房缺个眼疾手快的。', choices: [
            { label: '下场试机', effects: { buff: { name: '机簧手感', effects: { dexterity: 4 }, hours: 8 } }, reply: '八矢连发全数上靶，你摸清了卡簧的脾气。' } ] }
    ],
    '霹雳堂': [
        { id: 'se_plt_huoyao', icon: '🧨', name: '火药返潮', text: '梅雨天药库返潮，三百斤火药眼看要废。', choices: [
            { label: '连夜翻晒焙干', effects: { contribution: 35 }, reply: '焙房里呛得直流泪，火药救回来了。' },
            { label: '封库报损', effects: { contribution: -10 }, reply: '堂主批了损，也批了你一顿"早干嘛去了"。' } ] },
        { id: 'se_plt_shilei', icon: '💥', name: '雷火新弹试爆', text: '后山试爆新型雷火弹，观爆台上还有空位。', choices: [
            { label: '抢头排观爆', effects: { buff: { name: '胆魄淬雷', effects: { strength: 4 }, hours: 8 }, fame: 2 }, reply: '冲击波掀了帽子，你盯着火球看了个饱——值。' },
            { label: '远远看着', effects: {}, reply: '只听见一声闷响。头排的师弟们讲细节时你插不上话。' } ] }
    ],
    '大隐阁': [
        { id: 'se_dayn_chaju', icon: '🍵', name: '隐士茶局', text: '三位不世出的老隐士在阁中手谈煮茶，缺一位添水的童子。', choices: [
            { label: '执壶侍茶', effects: { fame: 4, points: 8 }, reply: '棋到中盘，一位老者忽然问你"水开了没有"——你答"心静则水自开"。老者大笑。' },
            { label: '推辞勿扰', effects: {}, reply: '事后听说那局棋下了三天，茶童得了半卷手稿。' } ] },
        { id: 'se_dayn_cangshu', icon: '📚', name: '地窖藏书翻检', text: '阁中地窖藏书受潮，需人逐册翻检晾晒。', choices: [
            { label: '翻检一窖', effects: { contribution: 30, buff: { name: '故纸余香', effects: { intelligence: 4 }, hours: 8 } }, reply: '晒书时顺手读了半册残卷，讲的居然是失传的吐纳法。' } ] }
    ],
    '天书阁': [
        { id: 'se_tsg_xingxiang', icon: '🌠', name: '星象异动', text: '司天台奏报：荧惑守心，星轨偏移三度。', choices: [
            { label: '通宵推演星盘', effects: { buff: { name: '星轨在胸', effects: { intelligence: 5 }, hours: 8 }, points: 10 }, reply: '推演到天明，偏移的三度里藏着一段被遗忘的古历。' },
            { label: '如实录档', effects: { contribution: 20 }, reply: '档录得很工整。阁主说："录是本职，推是本事。"' } ] },
        { id: 'se_tsg_shudu', icon: '🐛', name: '蠹鱼蚀典', text: '镇阁的《周天度厄经》被蠹虫咬穿了封皮。', choices: [
            { label: '捉虫补经', effects: { contribution: 35 }, reply: '樟脑布囊、桑皮纸补洞——三个月后虫绝经全。' } ] }
    ],
    '衡山派': [
        { id: 'se_hns_shoudai', icon: '🙏', name: '南岳寿诞大典', text: '山下信众为老观主做九十大寿，缺人手张罗法事。', choices: [
            { label: '执礼司仪', effects: { fame: 5, contribution: 20 }, reply: '寿宴上老观主拉着你的手说"这孩子有福相"。' },
            { label: '后厨帮忙', effects: { points: 8 }, reply: '三百碗长寿面，一碗没洒。' } ] },
        { id: 'se_hns_xuangui', icon: '🐢', name: '玄龟碑夜光', text: '祖师殿前的玄龟驮碑半夜泛起青光。', choices: [
            { label: '拓碑悟字', effects: { buff: { name: '龟碑古意', effects: { meridian: 4 }, hours: 8 } }, reply: '青光下碑文浮动，你记下了七个不认识却忘不掉的古字。' },
            { label: '报知掌门', effects: { contribution: 15 }, reply: '掌门看完只说四个字："衡山有灵。"' } ] }
    ],
    '铁掌帮': [
        { id: 'se_tzg_dukou', icon: '💰', name: '渡口抽头', text: '帮里控制的渡口来了支肥羊商队，按例该抽三成水钱。', choices: [
            { label: '照例抽头', effects: { contribution: 35, fame: -2 }, reply: '商队骂骂咧咧交了钱。帮里的账好看，你的名声难看。' },
            { label: '只收一成放走', effects: { fame: 4, contribution: -10 }, reply: '商队头子深深一揖。月底帮主问责时，水寨的弟兄替你说了话。' } ] },
        { id: 'se_tzg_neihong', icon: '🥊', name: '水寨内讧', text: '两堂口为一批沉货的归属在水寨动了手。', choices: [
            { label: '下场压住', effects: { contribution: 25, fame: -2 }, reply: '你把两边的头按进水里各三息，火气就消了。' },
            { label: '请帮主裁断', effects: { points: 5 }, reply: '帮主裁得干脆，只是两堂口都觉得你"不够义气"。' } ] }
    ],
    '百花谷': [
        { id: 'se_bhg_huaqi', icon: '🌸', name: '百花早发', text: '谷中奇花比花历早开了半月，花信错乱恐有地气之变。', choices: [
            { label: '逐圃记录花期', effects: { contribution: 30, buff: { name: '花气养神', effects: { meridian: 4 }, hours: 8 } }, reply: '记完最后一圃，你发现自己站在花海里站了一个时辰没舍得走。' },
            { label: '掘土验地气', effects: { points: 10 }, reply: '地脉温升三度——谷主依你的记录调了灌溉阵。' } ] },
        { id: 'se_bhg_fengmi', icon: '🍯', name: '灵蜂酿蜜', text: '药蜂采了新品种的灵花，头一批蜜该起封了。', choices: [
            { label: '帮手摇蜜', effects: { item: { id: 'qi_recovery_pill', count: 2 } }, reply: '蜜色琥珀，蜂后难得没蜇人。管事姐姐塞给你两丸蜜炼的回气丹。' } ] }
    ],
    '五仙教': [
        { id: 'se_wxc_shengshe', icon: '🐍', name: '圣蛇出走', text: '蛇窟的白鳞圣蛇半夜溜了，教中规矩：寻不回者罚入蛊房一月。', choices: [
            { label: '入林寻蛇', effects: { contribution: 40 }, reply: '你在榕树洞里找到了它——正蜕皮。它认得你的气味了。' },
            { label: '守坛等它回来', effects: { points: 8 }, reply: '三天后圣蛇自己回了窟，路过你身边时停了停。' } ] },
        { id: 'se_wxc_gufang', icon: '🏺', name: '蛊房月检', text: '蛊房月检缺人手，进去的人要喂蛊、清罐、抄蛊谱。', choices: [
            { label: '进蛊房当值', effects: { buff: { name: '百蛊不侵', effects: { constitution: 4 }, hours: 8 }, contribution: 20 }, reply: '出来时袖口爬过一只金蚕，你面不改色把它放了回去。' },
            { label: '告病回避', effects: {}, reply: '同教姐妹笑你："中原人的胆子。"' } ] }
    ],
    '阎罗殿': [
        { id: 'se_yld_shadan', icon: '🗡️', name: '暗杀令存疑', text: '殿里接了张暗杀令，可目标名字旁的批注被人涂掉了。', choices: [
            { label: '暗查令源', effects: { contribution: 40, points: 15, fame: -2 }, reply: '查到发令人是殿内一位判官，要杀的是自己欠债的证人。你把证据摆到了殿主案头。' },
            { label: '照单执行不问', effects: { contribution: 20 }, reply: '刀很快，事很干净。只是那夜你梦见被涂掉的名字。' } ] },
        { id: 'se_yld_guishi', icon: '🏮', name: '鬼门市集', text: '殿属鬼门市集今夜开张，三教九流的黑货都在。', choices: [
            { label: '逛一趟市集', effects: { item: { id: 'spirit_stone', count: 40 } }, reply: '你用低价收了一批没人识货的晶石，转手赚头不小。' } ] }
    ],
    '昆仑派': [
        { id: 'se_klp_jianzhen', icon: '⚔️', name: '两仪剑阵合练', text: '剑阵缺一名入阵弟子，阵眼之位空缺。', choices: [
            { label: '入阵合练', effects: { buff: { name: '两仪剑势', effects: { dexterity: 5 }, hours: 8 }, contribution: 20 }, reply: '一入阵便知阴阳互济之妙，收剑时手心全是汗。' },
            { label: '阵外观势', effects: { points: 10, buff: { name: '观阵识势', effects: { intelligence: 3 }, hours: 8 } }, reply: '看出剑阵转换时有半息的滞涩，报给掌阵长老被记了一功。' } ] },
        { id: 'se_klp_daxue', icon: '❄️', name: '大雪封山道', text: '一夜暴雪封了昆仑山口，山下香客的粮道断了。', choices: [
            { label: '带队清雪开路', effects: { contribution: 35, fame: 3 }, reply: '铁锹挖断三把，山口重开时香客们朝山上叩首。' } ] }
    ],
    '天龙教': [
        { id: 'se_tlc_shenghuo', icon: '🔥', name: '圣火夜祭', text: '教中圣火百年不熄，今夜大祭需一名护火弟子彻夜值守。', choices: [
            { label: '守护圣火', effects: { buff: { name: '圣火淬心', effects: { meridian: 5 }, hours: 8 } }, reply: '火光映了一夜，教众诵经声里你的内息竟自行走了一个大周天。' },
            { label: '协助布置祭坛', effects: { points: 8, fame: 2 }, reply: '坛成那刻，教主亲自点了第一炷香。' } ] },
        { id: 'se_tlc_zhengzhi', icon: '💢', name: '教众火并', text: '两堂教众为教产在殿前拔刀相向。', choices: [
            { label: '强力弹压', effects: { contribution: 30, fame: -2 }, reply: '你打落了双方的兵刃。教主的批示："可用。"' },
            { label: '飞报教主', effects: { points: 5 }, reply: '教主驾到时人已散了——你只捞了个"传信之功"。' } ] }
    ],
    '烈日教': [
        { id: 'se_lrj_shangdui', icon: '🐫', name: '大漠商队遇袭', text: '教中庇护的商队在沙暴口遇马匪围困，烽烟已起。', choices: [
            { label: '驰援商队', effects: { contribution: 40, item: { id: 'spirit_stone', count: 30 } }, reply: '你顶着沙暴杀散马匪，商队酬谢之外，教中另记大功。' },
            { label: '留守圣坛', effects: { points: 8 }, reply: '商队丢了两成货。坛前诵经时，你总听见沙暴口方向的风声。' } ] },
        { id: 'se_lrj_rixing', icon: '☀️', name: '烈日苦修', text: '正午大日当空，教规：敢入日曝台者，得"烈日淬体"之法。', choices: [
            { label: '登台暴晒', effects: { buff: { name: '烈日淬体', effects: { strength: 5 }, hours: 8 } }, reply: '皮脱了一层，筋骨却像被大日重新锻过。' },
            { label: '檐下观摩', effects: {}, reply: '观摩也是修行——至少你是这么跟师兄说的。' } ] }
    ],
    '血手门': [
        { id: 'se_xsm_xuechi', icon: '🩸', name: '血池试炼', text: '门中血池十年一开，入池者以血气淬体，出池者或废或强。', choices: [
            { label: '入池淬体', effects: { buff: { name: '血气冲霄', effects: { strength: 6 }, hours: 8 }, fame: -3 }, reply: '池水滚烫如沸，你在里面咬碎了后槽牙——出来时双臂青筋如蟒。' },
            { label: '婉拒试炼', effects: { contribution: -10 }, reply: '门主盯了你三息，什么也没说。这三息比血池还冷。' } ] },
        { id: 'se_xsm_fenzang', icon: '🪙', name: '猎物分赃', text: '一票大买卖到手，分赃堂上你的份额被人压了一成。', choices: [
            { label: '拍案力争', effects: { contribution: 20, fame: -2 }, reply: '你把压份额的人按在桌上数了三声，钱回来了，仇也结下了。' },
            { label: '忍让与人', effects: { fame: 2, points: 5 }, reply: '让出去的一成，换来分赃堂一句"这小子识相"。' } ] }
    ],
    '青城派': [
        { id: 'se_qcp_songfeng', icon: '🌲', name: '松风晨课', text: '青城天下幽——晨课设在松风亭，以松涛和太极。', choices: [
            { label: '随松涛走拳', effects: { buff: { name: '松风入拳', effects: { meridian: 4 }, hours: 8 } }, reply: '拳意随松涛起伏，一套走完，呼吸绵长得像换了个人。' },
            { label: '扫亭前落叶', effects: { points: 8 }, reply: '扫完落叶，早课也散了。师兄说你把"幽"字扫走了半边。' } ] },
        { id: 'se_qcp_shixi', icon: '🍚', name: '下山施斋', text: '山下遭了雹灾，观里开仓施斋，缺弟子押粮。', choices: [
            { label: '押粮施粥', effects: { fame: 5, contribution: 15 }, reply: '粥棚前排起长队，老灾民朝青城山的方向作了个揖。' } ] }
    ],
    '峨眉派': [
        { id: 'se_emp_hounao', icon: '🐒', name: '猴群袭斋堂', text: '后山猴群第三次下山抢斋堂的馒头，管事的师太头疼不已。', choices: [
            { label: '提剑驱猴', effects: { contribution: 25, fame: 2 }, reply: '剑未出鞘，猴王先退了——它认得峨眉的剑穗。' },
            { label: '以果易馒', effects: { item: { id: 'spirit_grass', count: 2 } }, reply: '你拿灵果跟猴王谈了笔买卖。它临走丢给你两株崖上才有的药草。' } ] },
        { id: 'se_emp_yunhai', icon: '☁️', name: '金顶云海坐忘', text: '金顶云海翻涌，正是坐忘观心的好时辰，掌门许弟子各占一峰。', choices: [
            { label: '云海前坐忘', effects: { buff: { name: '云海观心', effects: { meridian: 5 }, hours: 8 } }, reply: '云起云落间，心头那点杂念自己散了。' },
            { label: '值守山门', effects: { contribution: 20, points: 5 }, reply: '香客如潮，你扶了三位险些被挤下台阶的老菩萨。' } ] }
    ],
    '飞蝎坞': [
        { id: 'se_fxw_haidao', icon: '🏴‍☠️', name: '海盗夜袭', text: '一伙黑帆海盗趁夜摸向坞外的船坞，哨塔已鸣螺。', choices: [
            { label: '登墙御敌', effects: { contribution: 45, fame: 4 }, reply: '你砍断了第一个爬上墙头的钩索，海盗退潮而去。坞主在晨会上点了你的名。' },
            { label: '加固坞防', effects: { contribution: 20 }, reply: '你把三处松动的墙垛连夜砌实——第二天海盗正是从那里试的钩索。' } ] },
        { id: 'se_fxw_xiefang', icon: '🦂', name: '蝎房躁动', text: '养蛊蝎的蝎房集体躁动，钳子声密得像下雨。', choices: [
            { label: '入房安抚', effects: { buff: { name: '蝎胆沉稳', effects: { dexterity: 4 }, hours: 8 } }, reply: '你按坞里的法子压住了蝎王，满房钳声渐息——手背上添了道白痕。' },
            { label: '请坞主处置', effects: { points: 8 }, reply: '坞主来了，撒了把药粉就没事了。他瞥你一眼："下回自己来。"' } ] }
    ]
};
window.SECT_EVENTS = SECT_EVENTS;
window.SECT_DEEP_DATA = SECT_DEEP_DATA;
window.COMMON_RANKS = COMMON_RANKS;
window.COMMON_TASKS = COMMON_TASKS;
window.initSectsDeepData = initSectsDeepData;