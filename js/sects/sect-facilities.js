// ==================== sect-facilities.js - 门派设施系统（B3 修复版） ====================
// 修复内容：
//   B3-1: 设施使用游戏时间而非现实时间
//   B3-2: 设施从DOM读写真气 → 改为 currentCharData.qi
//   B3-3: 设施效果从描述改为可执行 actions
//   B3-4: 议事厅70%无结果 → 固定结果 + 30%随机追加
//   B3-5: 设施状态进入 GameState 统一存档

// ============ 设施动作类型注册表 ============
const VALID_ACTION_TYPES = {
    restoreQi: true,       // 恢复真气
    spendQi: true,         // 消耗真气
    skillBoost: true,      // 技能提升
    restoreHealth: true,   // 恢复部位耐久
    addPoints: true,       // 增加修炼领悟
    addSkillExp: true,     // 增加技能经验
    rewardMaterials: true, // 领取物资
    addRelation: true,     // 增加关系
    addInfo: true,         // 获取情报
    advanceTime: true,     // 推进游戏时间
    openLibrary: true,     // v15.4 打开藏经阁分层阅览面板
    spendContribution: true, // v15.5 消耗门派贡献（诊金类制度成本）
    openCrafting: true,    // 第十二波 · 门中炉火：就地打开全局炼丹/锻造界面（场地加成由 useFacility 挂时间窗）
    openCourt: true,       // 第十三波 · 戒律堂：坐堂/早朝/批账在此办理（职位与时辰由坐堂模块自管）
    sectFarm: true,        // 第十三波 · 灵田：督耕/帮工的实体入口（产出入公库，日限由灵田账自管）
    tempBuff: true         // v15.8 临时增益（effects=六维加成，durationHours 小时后经 GameScheduler 到期）
};

// ============ 门派设施类型 ============
// v15.5 设计宪法：先合乎逻辑，再谈平衡。禁用无叙事依据的人为计数器——
// 自然约束=时间(advanceTime)+自身状态(真气)+资源(贡献/配给)；保留的每日限制必须有制度理由并写进desc。
const FACILITY_TYPES = {
    TRAINING: 'training',
    CULTIVATION: 'cultivation',
    MEDICAL: 'medical',
    STORAGE: 'storage',
    SOCIAL: 'social',
    SPECIAL: 'special'
};

// ============ 设施定义 ============
const facilities = [
    {
        id: 'sect_training_ground',
        name: '演武场',
        type: FACILITY_TYPES.TRAINING,
        icon: '⚔️',
        desc: '练习武艺——练到真气见底为止，场子不赶人',
        // 结构化动作，禁止自由填写效果字段
        actions: [
            { type: 'spendQi', value: 15 },
            { type: 'skillBoost', skills: ['内功', '拳掌', '剑法', '刀法', '射术'], value: 2 },
            { type: 'advanceTime', value: 90 }
        ],
        rankReq: null
    },
    {
        id: 'sect_cave',
        name: '修炼洞府',
        type: FACILITY_TYPES.CULTIVATION,
        icon: '🧘',
        desc: '静室打坐——一坐便是一个半时辰，坐多久恢复多少',
        actions: [
            { type: 'restoreQi', value: 50 },
            { type: 'advanceTime', value: 120 }
        ],
        rankReq: null
    },
    {
        id: 'sect_medical',
        name: '医馆',
        type: FACILITY_TYPES.MEDICAL,
        icon: '💊',
        desc: '门派医者施诊治伤——药材出自公中，例收诊金贡献十点',
        actions: [
            { type: 'spendContribution', value: 10 },
            { type: 'restoreHealth', value: 100 },
            { type: 'advanceTime', value: 30 }
        ],
        rankReq: null
    },
    {
        id: 'sect_alchemy_room',
        name: '炼丹房',
        type: FACILITY_TYPES.SPECIAL,
        icon: '⚗️',
        desc: '门中的丹炉，内门以上方可借火——开炉之后炉火顺手，一个时辰内炼丹成功率见长',
        actions: [
            { type: 'spendQi', value: 10 },
            { type: 'advanceTime', value: 60 },
            { type: 'openCrafting', craft: 'pilfer' }
        ],
        rankReq: 4,
        dailyUses: 2
    },
    {
        id: 'sect_forge_room',
        name: '锻造坊',
        type: FACILITY_TYPES.SPECIAL,
        icon: '🔨',
        desc: '炉火不熄，铁砧常温——门中弟子借炉锻器，开炉之后锤感顺手，一个时辰内锻造成功率见长',
        actions: [
            { type: 'spendQi', value: 10 },
            { type: 'advanceTime', value: 60 },
            { type: 'openCrafting', craft: 'forging' }
        ],
        rankReq: 4,
        dailyUses: 2
    },
    {
        id: 'sect_precept_hall',
        name: '戒律堂',
        type: FACILITY_TYPES.SPECIAL,
        icon: '⚖️',
        desc: '门规所在——长老以上在此坐堂断案、批阅账目，掌门在此早朝（堂规与时辰由堂上自定）',
        actions: [
            { type: 'openCourt' },
            { type: 'advanceTime', value: 30 }
        ],
        rankReq: 2
    },
    {
        id: 'sect_spirit_field',
        name: '灵田',
        type: FACILITY_TYPES.STORAGE,
        icon: '🌾',
        desc: '门中灵粮都出自这几亩地——帮工半日或长老督耕，谷入公库',
        actions: [
            { type: 'sectFarm' }
        ],
        rankReq: null,
        dailyUses: 1
    },
    {
        id: 'sect_bathhouse',
        name: '浴池',
        type: FACILITY_TYPES.SOCIAL,
        icon: '♨️',
        desc: '练完功泡一场热水——乏气散了，旧伤松了，池边还能跟同门闲话两句',
        actions: [
            { type: 'restoreQi', value: 30 },
            { type: 'restoreHealth', value: 15 },
            { type: 'addRelation', value: 1, target: 'sectMembers' },
            { type: 'advanceTime', value: 60 }
        ],
        rankReq: null,
        dailyUses: 1
    },
    {
        id: 'sect_guest_house',
        name: '客房',
        type: FACILITY_TYPES.SOCIAL,
        icon: '🏮',
        desc: '盟家使者与行脚商人歇脚的地方——陪客坐坐，江湖上的消息能拣着听',
        actions: [
            { type: 'addInfo', chance: 0.5 },
            { type: 'advanceTime', value: 30 }
        ],
        rankReq: null,
        dailyUses: 2
    },
    {
        id: 'sect_beast_pen',
        name: '兽栏',
        type: FACILITY_TYPES.STORAGE,
        icon: '🐾',
        desc: '护山灵兽圈养在此——搭手添食扫栏，管事的分你一份灵材',
        actions: [
            { type: 'spendQi', value: 5 },
            { type: 'rewardMaterials' },
            { type: 'advanceTime', value: 60 }
        ],
        rankReq: null,
        dailyUses: 1
    },
    {
        id: 'sect_library',
        name: '藏经阁',
        type: FACILITY_TYPES.CULTIVATION,
        icon: '📚',
        desc: '查阅功法典籍——「📖 阅览」可入分层书阁（地位越高可入层数越多）',
        actions: [
            { type: 'spendQi', value: 30 },
            { type: 'addPoints', value: 10 },
            { type: 'addSkillExp', value: 5 },
            { type: 'advanceTime', value: 60 }
        ],
        rankReq: 7
    },
    {
        id: 'sect_armory',
        name: '兵器库',
        type: FACILITY_TYPES.STORAGE,
        icon: '🗡️',
        desc: '军械配给制——每名弟子每日限领一次，以均资用',
        actions: [
            { type: 'spendQi', value: 50 },
            { type: 'rewardMaterials', value: 1 },
            { type: 'advanceTime', value: 30 }
        ],
        rankReq: 4, // v20.8：与访问权限表对齐（兵器库=内门弟子+，此前 rankReq:3 比权限表更严）
        dailyUses: 1 // 配给制：制度性每日一次（有据的规则）
    },
    {
        id: 'sect_chat',
        name: '议事厅',
        type: FACILITY_TYPES.SOCIAL,
        icon: '🏛️',
        desc: '与同门闲坐交谈，偶有所闻——话头长短随缘',
        actions: [
            { type: 'addRelation', value: 1, target: 'sectMembers' },
            { type: 'addInfo', chance: 0.3 },
            { type: 'advanceTime', value: 30 }
        ],
        rankReq: null
    },
    {
        id: 'sect_canteen',
        name: '膳堂',
        type: FACILITY_TYPES.SOCIAL,
        icon: '🍚',
        desc: '一日两膳，灶火不通宵——和同门围桌吃饭，也是修行',
        actions: [
            { type: 'restoreQi', value: 15 },
            { type: 'addRelation', value: 1, target: 'sectMembers' },
            { type: 'advanceTime', value: 30 }
        ],
        rankReq: null,
        dailyUses: 2 // 制度性限次：早膳晚膳各一顿（灶火封了就没有第三顿）
    },
    {
        id: 'sect_leader',
        name: '掌门大殿',
        type: FACILITY_TYPES.SPECIAL,
        icon: '👑',
        desc: '掌门每日晨课后升殿受贺。奉贡献礼可求掌门亲口指点一二——亲传之谊，全在这一点拨里',
        actions: [
            { type: 'spendContribution', value: 20 },
            { type: 'addPoints', value: 25 },
            { type: 'advanceTime', value: 15 }
        ],
        rankReq: 2, // v20.8：与访问权限表对齐（大殿=长老/掌门，此前 rankReq:5 形同虚设）
        trackVisits: true, // 内部行为记录（供反应链判定），非玩家可见配额
        // 无每日计数：擅闯后果由下方世界反应链处理（v15.5 宪法：逻辑优先，惩罚来自世界而非计数器）
    }
];

// ==================== v15.8 门派专属设施（F2）：每派一座有身份的场所 ====================
// 与基础设施同 schema，经 visibleFacilities() 按弟子所属门派叠加；约束全按宪法：
// 时间/真气/贡献自然成本；仅"草木一日一熟""气血需回养"两处制度性限次且写明缘由。
const SECT_FACILITY_EXTRAS = {
    // ---- 参禅悟道组：真气20 + 一个时辰 + 神识/意志增益(12小时) ----
    '少林寺': [{ id: 'fx_sl_damo', name: '达摩洞', type: FACILITY_TYPES.CULTIVATION, icon: '⛰️', rankReq: null,
        desc: '达摩面壁九年之地——蒲团犹带旧时体温',
        actions: [ { type: 'spendQi', value: 20 }, { type: 'advanceTime', value: 120 },
            { type: 'tempBuff', buffId: 'fxb_damo', name: '达摩禅意', effects: { intelligence: 6, willpower: 4 }, durationHours: 12 } ] }],
    '武当派': [{ id: 'fx_wd_zhenwu', name: '真武后山', type: FACILITY_TYPES.CULTIVATION, icon: '🌙', rankReq: null,
        desc: '真武大帝夜观星斗的后崖，夜气最清',
        actions: [ { type: 'spendQi', value: 20 }, { type: 'advanceTime', value: 120 },
            { type: 'tempBuff', buffId: 'fxb_zhenwu', name: '星斗清气', effects: { meridian: 6, intelligence: 4 }, durationHours: 12 } ] }],
    '恒山派': [{ id: 'fx_heng_jianxing', name: '见性峰静室', type: FACILITY_TYPES.CULTIVATION, icon: '🛕', rankReq: null,
        desc: '晨钟暮鼓之间的一方静室',
        actions: [ { type: 'spendQi', value: 20 }, { type: 'advanceTime', value: 120 },
            { type: 'tempBuff', buffId: 'fxb_jianxing', name: '明心见性', effects: { willpower: 6, intelligence: 4 }, durationHours: 12 } ] }],
    '全真教': [{ id: 'fx_qz_chongyang', name: '重阳殿静室', type: FACILITY_TYPES.CULTIVATION, icon: '☯️', rankReq: null,
        desc: '祖师遗训刻于梁上，坐忘其中',
        actions: [ { type: 'spendQi', value: 20 }, { type: 'advanceTime', value: 120 },
            { type: 'tempBuff', buffId: 'fxb_chongyang', name: '坐忘遗训', effects: { meridian: 6, intelligence: 4 }, durationHours: 12 } ] }],
    '华山派': [{ id: 'fx_hs_siguo', name: '思过崖面壁洞', type: FACILITY_TYPES.CULTIVATION, icon: '🕳️', rankReq: null,
        desc: '崖风如刀，最宜面壁思过',
        actions: [ { type: 'spendQi', value: 20 }, { type: 'advanceTime', value: 120 },
            { type: 'tempBuff', buffId: 'fxb_siguo', name: '面壁澄神', effects: { dexterity: 5, willpower: 4 }, durationHours: 12 } ] }],
    '青城派': [{ id: 'fx_qc_tianshi', name: '天师洞', type: FACILITY_TYPES.CULTIVATION, icon: '🍃', rankReq: null,
        desc: '青城天下幽，幽处最宜坐忘',
        actions: [ { type: 'spendQi', value: 20 }, { type: 'advanceTime', value: 120 },
            { type: 'tempBuff', buffId: 'fxb_tianshidong', name: '幽谷清气', effects: { intelligence: 5, constitution: 4 }, durationHours: 12 } ] }],
    // ---- 淬体炼身组：真气25 + 一个半时辰 + 体魄增益(8小时) ----
    '金刚宗': [{ id: 'fx_jgz_luohan', name: '罗汉堂', type: FACILITY_TYPES.TRAINING, icon: '💪', rankReq: null,
        desc: '五百罗汉的拳印刻在四壁，掌掌都是功课',
        actions: [ { type: 'spendQi', value: 25 }, { type: 'advanceTime', value: 90 },
            { type: 'tempBuff', buffId: 'fxb_luohan', name: '金刚拳印', effects: { strength: 6, constitution: 5 }, durationHours: 8 } ] }],
    '血手门': [{ id: 'fx_xsm_xuechi', name: '血池', type: FACILITY_TYPES.TRAINING, icon: '🩸', rankReq: null, dailyUses: 1,
        desc: '浸过三七日的血池水，腥气刺骨——一日一浸，气血需回养',
        actions: [ { type: 'spendQi', value: 25 }, { type: 'advanceTime', value: 90 },
            { type: 'tempBuff', buffId: 'fxb_xuechi', name: '血池淬身', effects: { strength: 7, constitution: 5 }, durationHours: 8 } ] }],
    '修罗宫': [{ id: 'fx_xlg_hantan', name: '寒潭', type: FACILITY_TYPES.TRAINING, icon: '🧊', rankReq: null,
        desc: '宫主罚人思过的寒潭，潭水刺骨却炼体',
        actions: [ { type: 'spendQi', value: 25 }, { type: 'advanceTime', value: 90 },
            { type: 'tempBuff', buffId: 'fxb_hantan', name: '寒潭淬体', effects: { constitution: 6, dexterity: 5 }, durationHours: 8 } ] }],
    '阎罗殿': [{ id: 'fx_yl_lianyu', name: '炼狱廊', type: FACILITY_TYPES.TRAINING, icon: '🔥', rankReq: null,
        desc: '长廊两侧炭火不熄，刀客在此练胆',
        actions: [ { type: 'spendQi', value: 25 }, { type: 'advanceTime', value: 90 },
            { type: 'tempBuff', buffId: 'fxb_lianyu', name: '炼狱行', effects: { strength: 6, willpower: 5 }, durationHours: 8 } ] }],
    // ---- 采集产出组：一个时辰 + 本派物产（草木矿脉一日一熟——制度性每日一次） ----
    '药王谷': [{ id: 'fx_yw_baicao', name: '百草园', type: FACILITY_TYPES.STORAGE, icon: '🌿', rankReq: null, dailyUses: 1,
        desc: '谷主亲辟的药圃，四时花草不断——草木一日一熟',
        actions: [ { type: 'advanceTime', value: 60 },
            { type: 'rewardMaterials', items: [ { itemId: 'spirit_grass', count: 6 }, { itemId: 'spirit_stone', count: 10 } ] } ] }],
    '五仙教': [{ id: 'fx_wxj_gutian', name: '蛊田', type: FACILITY_TYPES.STORAGE, icon: '🐛', rankReq: null, dailyUses: 1,
        desc: '竹匾里养着七彩的虫——蛊虫一日一喂',
        actions: [ { type: 'advanceTime', value: 60 },
            { type: 'rewardMaterials', items: [ { itemId: 'spirit_grass', count: 4 }, { itemId: 'spirit_stone', count: 20 } ] } ] }],
    '霹雳堂': [{ id: 'fx_pili_xiaoyao', name: '硝窑', type: FACILITY_TYPES.STORAGE, icon: '🧨', rankReq: null, dailyUses: 1,
        desc: '堂中引以为傲的火药窑口——硝土每日一刮',
        actions: [ { type: 'advanceTime', value: 60 },
            { type: 'rewardMaterials', items: [ { itemId: 'iron_ore', count: 4 }, { itemId: 'spirit_stone', count: 25 } ] } ] }],
    '神机门': [{ id: 'fx_sj_jihuang', name: '机簧房', type: FACILITY_TYPES.STORAGE, icon: '⚙️', rankReq: null, dailyUses: 1,
        desc: '满墙齿轮与簧片的滴答声——铁件每日一批',
        actions: [ { type: 'advanceTime', value: 60 },
            { type: 'rewardMaterials', items: [ { itemId: 'iron_ore', count: 6 }, { itemId: 'spirit_grass', count: 2 } ] } ] }],
    '铁掌帮': [{ id: 'fx_tz_caishi', name: '采石场', type: FACILITY_TYPES.STORAGE, icon: '⛏️', rankReq: null, dailyUses: 1,
        desc: '帮众日日凿石的湖畔石场——石料每日一车',
        actions: [ { type: 'advanceTime', value: 60 },
            { type: 'rewardMaterials', items: [ { itemId: 'iron_ore', count: 8 }, { itemId: 'spirit_stone', count: 10 } ] } ] }],
    // ---- 耳目情报组：半个时辰闲谈，消息比别处灵通 ----
    '丐帮': [{ id: 'fx_gb_xiaoxi', name: '消息网', type: FACILITY_TYPES.SOCIAL, icon: '📰', rankReq: null,
        desc: '八袋弟子的耳朵遍及九州',
        actions: [ { type: 'addRelation', value: 1, target: 'sectMembers' }, { type: 'addInfo', chance: 0.5 }, { type: 'advanceTime', value: 30 } ] }],
    '天涯海阁': [{ id: 'fx_ty_fengxun', name: '风讯楼', type: FACILITY_TYPES.SOCIAL, icon: '🗼', rankReq: null,
        desc: '江陵码头的风声都先到这儿',
        actions: [ { type: 'addRelation', value: 1, target: 'sectMembers' }, { type: 'addInfo', chance: 0.5 }, { type: 'advanceTime', value: 30 } ] }],
    '大隐阁': [{ id: 'fx_dy_tingyu', name: '听雨轩', type: FACILITY_TYPES.SOCIAL, icon: '🌧️', rankReq: null,
        desc: '九华山的隐士们，什么都听过一些',
        actions: [ { type: 'addRelation', value: 1, target: 'sectMembers' }, { type: 'addInfo', chance: 0.5 }, { type: 'advanceTime', value: 30 } ] }],
    // ---- 领料制造组（批次二）：贡献+耗时换本派物产，炉坊一日一开 ----
    '铸剑山庄': [{ id: 'fx_zj_dulu', name: '锻炉', type: FACILITY_TYPES.STORAGE, icon: '🔨', rankReq: null, dailyUses: 1,
        desc: '庄中七十二座锻炉昼夜不熄——炉火一日一开',
        actions: [ { type: 'spendContribution', value: 15 }, { type: 'advanceTime', value: 45 },
            { type: 'rewardMaterials', items: [ { itemId: 'iron_ore', count: 8 }, { itemId: 'spirit_stone', count: 15 } ] } ] }],
    '茅山派': [{ id: 'fx_ms_fuzhi', name: '符纸坊', type: FACILITY_TYPES.STORAGE, icon: '📜', rankReq: null, dailyUses: 1,
        desc: '黄纸朱砂皆要亲手裁制——纸料每日一裁',
        actions: [ { type: 'spendContribution', value: 15 }, { type: 'advanceTime', value: 45 },
            { type: 'rewardMaterials', items: [ { itemId: 'spirit_grass', count: 5 }, { itemId: 'spirit_stone', count: 12 } ] } ] }],
    '唐门': [{ id: 'fx_tm_cuidu', name: '淬毒房', type: FACILITY_TYPES.STORAGE, icon: '🧪', rankReq: null, dailyUses: 1,
        desc: '毒物配伍讲究时辰——毒材一日一炼',
        actions: [ { type: 'spendContribution', value: 15 }, { type: 'advanceTime', value: 45 },
            { type: 'rewardMaterials', items: [ { itemId: 'spirit_grass', count: 4 }, { itemId: 'iron_ore', count: 3 }, { itemId: 'spirit_stone', count: 10 } ] } ] }],
    // ---- 轻身提气组（批次二）：真气15 + 一个时辰 + 灵巧增益(8小时) ----
    '逍遥派': [{ id: 'fx_xy_lingbo', name: '凌波榭', type: FACILITY_TYPES.TRAINING, icon: '🌊', rankReq: null,
        desc: '凌波微步的水上榭道，踏浪而行',
        actions: [ { type: 'spendQi', value: 15 }, { type: 'advanceTime', value: 60 },
            { type: 'tempBuff', buffId: 'fxb_lingbo', name: '凌波微步', effects: { dexterity: 7 }, durationHours: 8 } ] }],
    '天山派': [{ id: 'fx_ts_piaoxue', name: '飘雪坪', type: FACILITY_TYPES.TRAINING, icon: '❄️', rankReq: null,
        desc: '终年不化的雪坪之上练步，足下生风',
        actions: [ { type: 'spendQi', value: 15 }, { type: 'advanceTime', value: 60 },
            { type: 'tempBuff', buffId: 'fxb_piaoxue', name: '踏雪无痕', effects: { dexterity: 6, constitution: 4 }, durationHours: 8 } ] }],
    '飞蝎坞': [{ id: 'fx_fx_shuidun', name: '水遁场', type: FACILITY_TYPES.TRAINING, icon: '💧', rankReq: null,
        desc: '水网纵横的暗桩训练场',
        actions: [ { type: 'spendQi', value: 15 }, { type: 'advanceTime', value: 60 },
            { type: 'tempBuff', buffId: 'fxb_shuidun', name: '水遁身法', effects: { dexterity: 6, intelligence: 3 }, durationHours: 8 } ] }],
    '峨眉派': [{ id: 'fx_em_qingfeng', name: '清风亭', type: FACILITY_TYPES.TRAINING, icon: '🎐', rankReq: null,
        desc: '金顶清风穿亭而过，拂尘随气',
        actions: [ { type: 'spendQi', value: 15 }, { type: 'advanceTime', value: 60 },
            { type: 'tempBuff', buffId: 'fxb_qingfeng', name: '清风拂穴', effects: { dexterity: 5, willpower: 4 }, durationHours: 8 } ] }],
    // ---- 水系参禅组（批次二）----
    '昆仑派': [{ id: 'fx_kl_yaochi', name: '瑶池畔', type: FACILITY_TYPES.CULTIVATION, icon: '🏞️', rankReq: null,
        desc: '昆仑瑶池的雪水千年不涸',
        actions: [ { type: 'spendQi', value: 20 }, { type: 'advanceTime', value: 120 },
            { type: 'tempBuff', buffId: 'fxb_yaochi', name: '瑶池映月', effects: { meridian: 7, intelligence: 4 }, durationHours: 12 } ] }],
    '蓬莱派': [{ id: 'fx_pl_guanchao', name: '观潮台', type: FACILITY_TYPES.CULTIVATION, icon: '🌊', rankReq: null,
        desc: '潮起潮落皆是道，坐看三日亦不觉久',
        actions: [ { type: 'spendQi', value: 20 }, { type: 'advanceTime', value: 120 },
            { type: 'tempBuff', buffId: 'fxb_guanchao', name: '观潮悟道', effects: { meridian: 5, intelligence: 6 }, durationHours: 12 } ] }],
    // ---- 书香文修组（批次二）：耗时即可，读书人不必耗真气 ----
    '天书阁': [{ id: 'fx_tsg_wanjuan', name: '万卷楼', type: FACILITY_TYPES.CULTIVATION, icon: '📚', rankReq: null,
        desc: '天下书籍尽入此楼，读一卷便有一卷的好处',
        actions: [ { type: 'advanceTime', value: 60 },
            { type: 'tempBuff', buffId: 'fxb_wanjuan', name: '腹有诗书', effects: { intelligence: 7 }, durationHours: 8 } ] }],
    '侠隐阁': [{ id: 'fx_xia_jiangwu', name: '讲武堂', type: FACILITY_TYPES.CULTIVATION, icon: '🏯', rankReq: null,
        desc: '师父们轮番登台讲武，听者各有领悟',
        actions: [ { type: 'advanceTime', value: 60 },
            { type: 'tempBuff', buffId: 'fxb_jiangwu', name: '讲武所闻', effects: { strength: 4, intelligence: 5 }, durationHours: 8 } ] }],
    '衡山派': [{ id: 'fx_hy_qintai', name: '回雁琴台', type: FACILITY_TYPES.CULTIVATION, icon: '🎻', rankReq: null,
        desc: '莫大先生的胡琴声曾在此彻夜不绝',
        actions: [ { type: 'advanceTime', value: 60 },
            { type: 'tempBuff', buffId: 'fxb_qintai', name: '弦外之音', effects: { intelligence: 6, dexterity: 4 }, durationHours: 8 } ] }],
    // ---- 杀伐淬体组（批次二）----
    '嵩山派': [{ id: 'fx_ss_mengqi', name: '盟旗演武台', type: FACILITY_TYPES.TRAINING, icon: '🚩', rankReq: null,
        desc: '五岳盟旗之下练剑，气势自壮三分',
        actions: [ { type: 'spendQi', value: 25 }, { type: 'advanceTime', value: 90 },
            { type: 'tempBuff', buffId: 'fxb_mengqi', name: '盟旗之势', effects: { strength: 6, dexterity: 4 }, durationHours: 8 } ] }],
    '泰山派': [{ id: 'fx_ta_shibapan', name: '十八盘道', type: FACILITY_TYPES.TRAINING, icon: '🪨', rankReq: null,
        desc: '沿石阶负重登降，登顶之人腿如铁铸',
        actions: [ { type: 'spendQi', value: 25 }, { type: 'advanceTime', value: 90 },
            { type: 'tempBuff', buffId: 'fxb_shibapan', name: '登盘练力', effects: { constitution: 6, strength: 4 }, durationHours: 8 } ] }],
    '大旗门': [{ id: 'fx_dq_dianjiang', name: '点将台', type: FACILITY_TYPES.TRAINING, icon: '🏴', rankReq: null,
        desc: '旗下点将，令出如山',
        actions: [ { type: 'spendQi', value: 25 }, { type: 'advanceTime', value: 90 },
            { type: 'tempBuff', buffId: 'fxb_dianjiang', name: '将令在身', effects: { strength: 6, willpower: 5 }, durationHours: 8 } ] }],
    '天龙教': [{ id: 'fx_tl_wanmo', name: '万魔窟', type: FACILITY_TYPES.TRAINING, icon: '👹', rankReq: null, dailyUses: 1,
        desc: '窟中魔气侵体，须隔一日调息方可再入',
        actions: [ { type: 'spendQi', value: 25 }, { type: 'advanceTime', value: 90 },
            { type: 'tempBuff', buffId: 'fxb_wanmo', name: '魔气淬魂', effects: { strength: 6, intelligence: 5 }, durationHours: 8 } ] }],
    '烈日教': [{ id: 'fx_lj_puriya', name: '曝日崖', type: FACILITY_TYPES.TRAINING, icon: '☀️', rankReq: null,
        desc: '正午烈日直射的赤岩，站上一个时辰胜练一月',
        actions: [ { type: 'spendQi', value: 25 }, { type: 'advanceTime', value: 90 },
            { type: 'tempBuff', buffId: 'fxb_puri', name: '曝日真火', effects: { constitution: 6, intelligence: 5 }, durationHours: 8 } ] }],
    // ---- 医香组（批次二）----
    '百花谷': [{ id: 'fx_bh_huafang', name: '花房', type: FACILITY_TYPES.MEDICAL, icon: '🌸', rankReq: null,
        desc: '四时花开不败，药香沁人心脾',
        actions: [ { type: 'advanceTime', value: 60 },
            { type: 'tempBuff', buffId: 'fxb_huafang', name: '药香涤神', effects: { intelligence: 5, constitution: 4 }, durationHours: 8 } ] }]
};

const CRAFT_WORKSHOPS = { fx_zj_dulu: 1, fx_ms_fuzhi: 1, fx_tm_cuidu: 1 }; // v18.6 工坊研习设施

// 当前弟子可见的设施全集 = 基础8座 ∪ 本派专属
function visibleFacilities() {
    const ds = window.discipleState || {};
    const extra = (ds.isInSect && ds.sectId && SECT_FACILITY_EXTRAS[ds.sectId]) || [];
    return extra.length ? facilities.concat(extra) : facilities;
}

// ==================== v16.1 F3 设施升级线：门派修葺（贡献→规制提升） ====================
// 制度：修葺乃大事，由长老（rank≤2）在掌门大殿定夺；效果=真实动作值增强，非配额放水。
// 批三扩至八座基础建筑，修葺费出自公中：贡献 + 灵石双料（大工程不是喊一嗓子就能动的）。
const FACILITY_UPGRADES = {
    sect_training_ground: {
        lv2: { cost: 300, stones: 150, label: '添置石锁木桩', mod: { skillBoost: 1 } },
        lv3: { cost: 800, stones: 400, label: '聘请武师驻场', mod: { skillBoost: 1 } }
    },
    sect_cave: {
        lv2: { cost: 300, stones: 150, label: '引聚灵阵入洞', mod: { restoreQi: 20 } },
        lv3: { cost: 800, stones: 400, label: '深凿洞窟直通灵脉', mod: { restoreQi: 30 } }
    },
    sect_medical: {
        lv2: { cost: 300, stones: 150, label: '后山自辟药圃（诊金-3）', mod: { spendContribution: -3 } },
        lv3: { cost: 800, stones: 400, label: '延请名医坐堂（诊金再-3、疗伤+50）', mod: { spendContribution: -3, restoreHealth: 50 } }
    },
    sect_library: {
        lv2: { cost: 300, stones: 150, label: '增抄副册流通', mod: { addPoints: 4 } },
        lv3: { cost: 800, stones: 400, label: '广收孤本秘抄', mod: { addPoints: 6 } }
    },
    sect_chat: {
        lv2: { cost: 300, stones: 150, label: '常备茶点果盘', mod: { addInfoChance: 0.1 } },
        lv3: { cost: 800, stones: 400, label: '座上常有行商游侠', mod: { addInfoChance: 0.1 } }
    },
    sect_canteen: {
        lv2: { cost: 200, stones: 100, label: '再添一名火工，膳单见荤（饭气+8）', mod: { restoreQi: 8 } },
        lv3: { cost: 600, stones: 300, label: '开小灶日夜煨汤（饭气再+12）', mod: { restoreQi: 12 } }
    },
    sect_armory: {
        lv2: { cost: 250, stones: 150, label: '聘库官专司养护（淬火养护费 15→10 贡献）', mod: {} },
        lv3: { cost: 700, stones: 400, label: '重砌炉膛扩械架（淬火养护费 →5 贡献）', mod: {} }
    },
    sect_leader: {
        lv2: { cost: 400, stones: 200, label: '大殿修葺，晨课延长（指点+8）', mod: { addPoints: 8 } },
        lv3: { cost: 1000, stones: 500, label: '掌门于殿中亲传心法（指点再+12）', mod: { addPoints: 12 } }
    }
};

function facLevel(fid) { return (facilityState.levels && facilityState.levels[fid]) || 1; }

function effectiveActions(facility) {
    const lv = facLevel(facility.id);
    let list = facility.actions;
    if (lv > 1) {
        const cfg = FACILITY_UPGRADES[facility.id];
        if (cfg) {
            // v16.1 修正：各级 mod 逐级累加（如藏经阁 Lv3 = 基础+4+6 → 领悟20），而非只套当前档
            const mods = {};
            [2, 3].forEach(function (l) {
                if (lv >= l) {
                    const t = (l === 2 ? cfg.lv2 : cfg.lv3) || {};
                    for (const k in (t.mod || {})) mods[k] = (mods[k] || 0) + t.mod[k];
                }
            });
            list = list.map(a => {
                const c = Object.assign({}, a);
                for (const mk in mods) {
                    if (mk === 'addInfoChance') {
                        if (c.type === 'addInfo') c.chance = Math.min(0.9, Math.round(((c.chance || 0) + mods[mk]) * 100) / 100);
                    } else if (c.type === mk) {
                        c.value = Math.max(mk === 'spendContribution' ? 1 : 0, (c.value || 0) + mods[mk]);
                    }
                }
                return c;
            });
        }
    }
    // v16.4 污衣派待遇：丐帮消息网情报率+15%（讨饭网耳目）——恒定生效，与修葺等级无关
    if (facility.id === 'fx_gb_xiaoxi'
        && window.discipleState && window.discipleState._gbFaction
        && window.discipleState._gbFaction.side === 'dirty') {
        list = list.map(function (a) {
            if (a.type !== 'addInfo') return a;
            const c2 = Object.assign({}, a);
            c2.chance = Math.min(0.9, Math.round(((c2.chance || 0) + 0.15) * 100) / 100);
            return c2;
        });
    }
    // 批三 · 地标熟识：fx_ 地标常去则熟——tempBuff 效果与物产随熟识加成增厚（生0/熟+15%/密+30%/知交+45%）
    if (facility.id.indexOf('fx_') === 0 && typeof window.landmarkBondBonus === 'function') {
        var _bBonus = Number(window.landmarkBondBonus(facility.id)) || 0;
        if (_bBonus > 0) {
            list = list.map(function (a) {
                if (a.type === 'tempBuff' && a.effects) {
                    var c3 = Object.assign({}, a);
                    var eff3 = {};
                    Object.keys(a.effects).forEach(function (k) { eff3[k] = typeof a.effects[k] === 'number' ? Math.round(a.effects[k] * (1 + _bBonus) * 10) / 10 : a.effects[k]; });
                    c3.effects = eff3;
                    return c3;
                }
                if (a.type === 'rewardMaterials' && Array.isArray(a.items)) {
                    var c4 = Object.assign({}, a);
                    c4.items = a.items.map(function (m) { return { itemId: m.itemId, count: Math.max(1, Math.round((m.count || 1) * (1 + _bBonus))) }; });
                    return c4;
                }
                return a;
            });
        }
    }
    return list;
}

window.openSectUpgradePanel = function () {
    var ds = window.discipleState || {};
    if (!ds.isInSect) { if (window.showMessage) window.showMessage('需先加入门派', 'warning'); return; }
    if ((ds.rank == null ? 7 : ds.rank) > 2) { if (window.showMessage) window.showMessage('门派修葺乃大事——须长老（含）以上在掌门大殿定夺。', 'warning'); return; }
    var html = '<p class="text-xs text-gray-400 mb-2">门派修葺由长老层定夺，费用出自公中：贡献 + 灵石双料。规制一旦提升，阖门弟子同沾其利。</p>';
    Object.keys(FACILITY_UPGRADES).forEach(function (fid) {
        var base = facilities.find(function (f) { return f.id === fid; });
        if (!base) return;
        var lv = facLevel(fid);
        var cfg = FACILITY_UPGRADES[fid];
        html += '<div class="bg-gray-900 rounded p-2 mb-1"><div class="flex justify-between items-center">'
            + '<span class="text-sm text-white">' + base.icon + ' ' + base.name + '</span>'
            + '<span class="text-xs text-sky-300">' + (lv >= 3 ? '已是最高规制' : ('当前 Lv' + lv)) + '</span></div>';
        if (lv < 3) {
            var nxt = lv === 1 ? cfg.lv2 : cfg.lv3;
            var stoneTxt = nxt.stones ? ('+灵石' + nxt.stones) : '';
            html += '<div class="flex justify-between items-center mt-1"><span class="text-xs text-gray-500">下一步：' + nxt.label + '</span>'
                + '<button onclick="doUpgradeFacility(\'' + fid + '\')" class="text-xs bg-amber-700 hover:bg-amber-600 text-white px-2 py-1 rounded">修葺（贡献' + nxt.cost + stoneTxt + '）</button></div>';
        }
        html += '</div>';
    });
    html += '<p class="text-[11px] text-gray-500 mt-2">演武场切磋、兵器库淬火、膳堂用膳、医馆旧伤、议事厅账本各有深作，不在此表。</p>';
    if (typeof window.showModal === 'function') window.showModal('🏗️ 门派修葺', html);
};

// 批三：灵石读取/扣减（与特色身份层同一口径——优先 DataManager，回落 inventory.currency）
function _facStones() {
    try { if (window.XianXia && window.XianXia.DataManager && window.XianXia.DataManager.getSpiritStones) return Number(window.XianXia.DataManager.getSpiritStones()) || 0; } catch (e) {}
    return (window.inventory && window.inventory.currency && Number(window.inventory.currency.spiritStones)) || 0;
}
function _facPayStones(n) {
    if (_facStones() < n) return false;
    try { if (window.XianXia && window.XianXia.DataManager && window.XianXia.DataManager.deductSpiritStones) { window.XianXia.DataManager.deductSpiritStones(n); return true; } } catch (e) {}
    if (window.inventory && window.inventory.currency) { window.inventory.currency.spiritStones -= n; return true; }
    return false;
}

window.doUpgradeFacility = function (fid) {
    var ds = window.discipleState || {};
    if (!ds.isInSect || (ds.rank == null ? 7 : ds.rank) > 2) { if (window.showMessage) window.showMessage('须长老（含）以上方可主持修葺', 'warning'); return; }
    var cfg = FACILITY_UPGRADES[fid];
    var lv = facLevel(fid);
    if (!cfg || lv >= 3) return;
    var nxt = lv === 1 ? cfg.lv2 : cfg.lv3;
    if ((ds.contribution || 0) < nxt.cost) { if (window.showMessage) window.showMessage('门派贡献不足（需' + nxt.cost + '，当前' + (ds.contribution || 0) + '）', 'error'); return; }
    var stoneNeed = Number(nxt.stones || 0);
    if (stoneNeed > 0 && _facStones() < stoneNeed) { if (window.showMessage) window.showMessage('公中灵石不足（需' + stoneNeed + '，当前' + _facStones() + '）', 'error'); return; }
    ds.contribution -= nxt.cost;
    try { if (window.sectLedgerNote) window.sectLedgerNote(-nxt.cost, '门派修葺·' + ((facilities.find(f => f.id === fid) || {}).name || fid)); } catch (e) {}
    if (stoneNeed > 0) _facPayStones(stoneNeed);
    facilityState.levels[fid] = lv + 1;
    if (window.showMessage) window.showMessage('🏗️ ' + (facilities.find(f => f.id === fid) || {}).name + '修葺完工：' + nxt.label + '（升至 Lv' + (lv + 1) + '）', 'success');
    updateFacilityUI();
    window.openSectUpgradePanel();
};

// ============ 设施使用状态（基于游戏时间） ============
let facilityState = {
    lastResetGameDay: 0,           // 上次重置的游戏天数（gameTime.currentDay）
    dailyUsage: {},                // { facilityId: 今日使用次数 }
    cooldownUntilMinute: {},       // { facilityId: 冷却到哪个游戏分钟 }
    levels: {},                    // v16.1 { facilityId: 设施等级1-3 }——门派修葺成果，随档持久化
    lastUsedGameMinute: {}         // { facilityId: 上次使用的游戏分钟 }
};

// ============ 从 GameState 恢复设施状态 ============
function loadFacilityStateFromSave(savedState) {
    if (!savedState) {
        facilityState = {
            lastResetGameDay: 0,
            dailyUsage: {},
            cooldownUntilMinute: {},
            lastUsedGameMinute: {},
            levels: {}
        };
        return;
    }
    facilityState.lastResetGameDay = savedState.lastResetGameDay || 0;
    facilityState.dailyUsage = savedState.dailyUsage || {};
    facilityState.cooldownUntilMinute = savedState.cooldownUntilMinute || {};
    facilityState.lastUsedGameMinute = savedState.lastUsedGameMinute || {};
    facilityState.levels = savedState.levels || {}; // v16.1
}

// ============ 获取设施状态序列化快照（供 GameState 存档） ============
function getFacilityStateSnapshot() {
    return {
        lastResetGameDay: facilityState.lastResetGameDay,
        dailyUsage: Object.assign({}, facilityState.dailyUsage),
        cooldownUntilMinute: Object.assign({}, facilityState.cooldownUntilMinute),
        lastUsedGameMinute: Object.assign({}, facilityState.lastUsedGameMinute),
        levels: Object.assign({}, facilityState.levels || {}) // v16.1
    };
}

// ============ 获取当前游戏分钟 ============
function getGameMinute() {
    if (window.timeSystem && window.timeSystem.gameTime && typeof window.timeSystem.gameTime.totalMinutes === 'number') {
        return window.timeSystem.gameTime.totalMinutes;
    }
    return 0;
}

// ============ 获取当前游戏天数 ============
function getFacilityGameDay() {
    if (window.timeSystem && window.timeSystem.gameTime && typeof window.timeSystem.gameTime.currentDay === 'number') {
        return window.timeSystem.gameTime.currentDay;
    }
    return 1;
}

// ============ 初始化设施状态（基于游戏天数重置） ============
function initFacilityState() {
    const currentDay = getFacilityGameDay();

    if (facilityState.lastResetGameDay !== currentDay) {
        // 新的一天，重置使用次数
        facilityState.dailyUsage = {};
        facilityState.lastResetGameDay = currentDay;
    }
}

// ============ 启动时校验设施定义 ============
function validateFacilities() {
    const errors = [];
    let allF = facilities.slice();
    Object.keys(SECT_FACILITY_EXTRAS).forEach(k => { allF = allF.concat(SECT_FACILITY_EXTRAS[k]); });
    allF.forEach(facility => {
        if (!facility.actions || !Array.isArray(facility.actions) || facility.actions.length === 0) {
            errors.push(`设施 [${facility.id}] ${facility.name}：缺少 actions 数组`);
            return;
        }
        facility.actions.forEach((action, idx) => {
            if (!action.type) {
                errors.push(`设施 [${facility.id}] ${facility.name} actions[${idx}]：缺少 type`);
                return;
            }
            if (!VALID_ACTION_TYPES[action.type]) {
                errors.push(`设施 [${facility.id}] ${facility.name} actions[${idx}]：未知动作类型 "${action.type}"`);
            }
        });
        // 检查 rankReq 语义
        if (facility.rankReq === 0) {
            errors.push(`设施 [${facility.id}] ${facility.name}：rankReq 为 0（掌门），请使用 null 表示不限职位`);
        }
    });
    if (errors.length > 0) {
        console.error('[Facilities] ⚠️ 设施定义校验失败：' + errors.join('；'));
        if (window.showMessage) {
            window.showMessage('⚠️ 设施定义有 ' + errors.length + ' 个错误，详见控制台', 'error');
        }
    }
    return errors.length === 0;
}

// ============ 检查是否可以访问设施 ============
function checkFacilityAccess(facilityId) {
    const ds = window.discipleState || {};
    if (!ds.isInSect) {
        return { accessible: false, reason: '你还没有加入任何门派！' };
    }

    const facility = visibleFacilities().find(f => f.id === facilityId);
    if (!facility) {
        return { accessible: false, reason: '无效的设施！' };
    }

    // 检查职位要求（数值越小职位越高：0=掌门，7=杂役）
    if (facility.rankReq !== null && facility.rankReq !== undefined) {
        const playerRank = ds.rank != null ? ds.rank : 7;
        if (playerRank > facility.rankReq) {
            const RANKS = window.RANKS || [];
            const minRank = RANKS.find(r => r.id === facility.rankReq);
            return {
                accessible: false,
                reason: `需要 ${minRank?.name || '更高职位'} 才能访问此设施！`
            };
        }
    }

    // 检查每日使用次数——拒绝文案走世界叙事（v15.5：不弹"次数用完"式系统腔）
    if (facility.dailyUses > 0) {
        const used = facilityState.dailyUsage[facilityId] || 0;
        if (used >= facility.dailyUses) {
            const NARRATIVE = {
                sect_armory: '库吏摆手："你的份例今日已经领过了，明日请早。"',
                sect_canteen: '膳堂灶上封了火，笼屉洗得干干净净——一日两膳是门规，夜里值房自有干粮。',
                sect_alchemy_room: '丹炉今日的火已经封了——养炉如养气，明日再开。',
                sect_forge_room: '炉膛今日烧透了，铁砧也要歇——明日再开炉。',
                sect_spirit_field: '灵田今日的活计干完了——田把头扛着锄头回屋了，明日请早。',
                sect_bathhouse: '浴池的水放凉了——再烧一锅得些时辰，明日再来泡。',
                sect_guest_house: '客人们都歇下了——客房的灯灭了，不好再打扰。',
                sect_beast_pen: '灵兽今日喂过扫过了——畜生也要歇晌，明日再来。',
                fx_xsm_xuechi: '你的气血还未回养过来——血池一日一浸，贪多伤身。',
                fx_yw_baicao: '草木一日一熟，今日的药草已经采过了。',
                fx_wxj_gutian: '蛊虫今日已经喂过了，再喂要撑坏它们。',
                fx_pili_xiaoyao: '今日的硝土已经刮完了，窑口要歇一夜。',
                fx_sj_jihuang: '机簧房的铁件每日只出一批，师父们已经收工。',
                fx_tz_caishi: '今日的石料已经装车运走了，明日请早。',
                fx_zj_dulu: '炉火今日已经封了——铁料要焖一夜才能开炉。',
                fx_ms_fuzhi: '今日裁好的纸料已经入了朱砂房，明日再来。',
                fx_tm_cuidu: '毒炉的火候今日已足，再炼就要走水。',
                fx_tl_wanmo: '你眼中魔气未散——再入窟，怕是要走火入魔了。'
            };
            return {
                accessible: false,
                // v23.3 兜底也讲人话：份例制度有名有据，不报「次数已用完」（设计宪法）
                reason: NARRATIVE[facilityId] || '管事执事收了牌子，拱手道："此处份例今日已尽——门规如此，明日请早。"'
            };
        }
    }

    // 检查冷却时间（基于游戏时间）
    if (facility.cooldownMinutes > 0) {
        const cooldownUntil = facilityState.cooldownUntilMinute[facilityId] || 0;
        const now = getGameMinute();
        if (now < cooldownUntil) {
            const remainingMinutes = cooldownUntil - now;
            const remainingHours = Math.ceil(remainingMinutes / 60);
            return {
                accessible: false,
                reason: `设施冷却中，还需等待 ${remainingHours} 小时（游戏时间）`
            };
        }
    }

    return { accessible: true, reason: '' };
}

// ============ 执行单条动作 ============
function executeAction(action, resultMsgs, facilityId) {
    const cd = window.currentCharData;
    if (!cd) return;

    switch (action.type) {
        case 'openCourt': {
            // 第十三波 · 戒律堂：坐堂/早朝/批账都在此办理（职位与时辰由坐堂模块自管）
            try {
                if (typeof window.openCourtPanel === 'function') window.openCourtPanel();
                else resultMsgs.push('・戒律堂门开着，堂上却空着——升堂的人还不到位。');
            } catch (e) {}
            break;
        }
        case 'sectFarm': {
            // 第十三波 · 灵田：督耕/帮工的实体入口（产出入公库走既有账，日限由灵田账自管）
            try {
                if (typeof window.doSectFarmWork === 'function') window.doSectFarmWork();
                else resultMsgs.push('・田里没人应声。');
            } catch (e2) {}
            break;
        }
        case 'openCrafting': {
            // 第十二波 · 门中炉火：就地开全局炼制界面（场地加成的时间窗由 useFacility 挂）
            try {
                var _ck = action.craft === 'forging' ? 'forging' : 'pilfer';
                if (typeof window.openCraftingUI === 'function') window.openCraftingUI(_ck);
            } catch (e) {}
            break;
        }
        case 'spendContribution': {
            const dsFee = window.discipleState || {};
            dsFee.contribution = Math.max(0, (dsFee.contribution || 0) - (action.value || 0));
            resultMsgs.push(`・门派贡献 -${action.value}`);
            break;
        }
        case 'tempBuff': {
            if (typeof window.applyBuff === 'function') {
                window.applyBuff(action.buffId || ('fxb_' + (action.name || 'x')), action.effects || {}, action.durationHours || 12);
                const effTxt = Object.keys(action.effects || {}).map(k => k + '+' + action.effects[k]).join(' ');
                resultMsgs.push(`・${action.name || '气息萦绕'}：${effTxt}（持续${action.durationHours || 12}小时）`);
            } else {
                resultMsgs.push('・此地气息萦绕，却无处安放。');
            }
            break;
        }
        case 'restoreQi': {
            const before = cd.qi || 0;
            const maxQi = cd.maxQi || 100;
            cd.qi = Math.min(maxQi, before + action.value);
            const actual = cd.qi - before;
            if (actual > 0) resultMsgs.push(`・真气 +${actual}`);
            break;
        }
        case 'spendQi': {
            const before = cd.qi || 0;
            cd.qi = Math.max(0, before - action.value);
            const actual = before - cd.qi;
            if (actual > 0) resultMsgs.push(`・消耗真气 ${actual}`);
            break;
        }
        case 'skillBoost': {
            if (action.skills && Array.isArray(action.skills)) {
                action.skills.forEach(skill => {
                    if (cd.combatSkills && cd.combatSkills[skill] !== undefined) {
                        cd.combatSkills[skill] = Math.min(100, cd.combatSkills[skill] + action.value);
                        resultMsgs.push(`・${skill} +${action.value}`);
                    }
                });
            }
            break;
        }
        case 'restoreHealth': {
            if (typeof window.restoreBodyDurability === 'function') {
                window.restoreBodyDurability(action.value);
                resultMsgs.push(`・恢复伤势 +${action.value}`);
            } else {
                resultMsgs.push(`・恢复伤势 +${action.value}（函数未加载，效果已记录）`);
            }
            break;
        }
        case 'addPoints': {
            const ds = window.discipleState || {};
            ds.points = (ds.points || 0) + action.value;
            resultMsgs.push(`・修炼领悟 +${action.value}`);
            break;
        }
        case 'addSkillExp': {
            // F-33：此前只 push 文案不写数据（"技能经验+5"是空操作）。
            // 接 addProficiencyExp 到玩家主修功法（currentSkills.skill_main），无主修则提示
            var _mainSkill = window.currentSkills && window.currentSkills.skill_main;
            if (_mainSkill && typeof window.addProficiencyExp === 'function') {
                window.addProficiencyExp(_mainSkill, action.value);
                resultMsgs.push(`・主修功法熟练度 +${action.value}`);
            } else {
                resultMsgs.push(`・需先装备主修功法方可参悟（技能经验 +${action.value} 未生效）`);
            }
            break;
        }
        case 'rewardMaterials': {
            // v15.8 主题化产出：action.items 可指定本派物产配比（须为已存在 itemId），缺省走通用配给
            const materials = (Array.isArray(action.items) && action.items.length)
                ? action.items
                : [
                    { itemId: 'iron_ore', count: 5 },
                    { itemId: 'spirit_grass', count: 3 },
                    { itemId: 'spirit_stone', count: 50 }
                ];
            let added = 0;
            const gotTxt = [];
            materials.forEach(m => {
                if (typeof window.addItem === 'function') {
                    const ok = window.addItem(m.itemId, m.count);
                    if (ok) added++;
                    const nm = (window.itemById && window.itemById[m.itemId] && window.itemById[m.itemId].name) || m.itemId;
                    gotTxt.push(nm + 'x' + m.count);
                }
            });
            resultMsgs.push(`・获得物资: ` + gotTxt.join(', '));
            // 改造批 · 守恒来路做实：本派地标工坊干出来的活，产出半数入公库（编年偶尔记一笔「弟子捐工」）
            try {
                if (facilityId && String(facilityId).indexOf('fx_') === 0 && window.SectGov && window.SectGov.titheWorkshop) {
                    var _tTotal = materials.reduce(function (sum, m) { return sum + (Number(m.count) || 0); }, 0);
                    var _tithe = window.SectGov.titheWorkshop(_tTotal);
                    if (_tithe > 0) resultMsgs.push('・半数入公库（材料+' + _tithe + '）——门里记你一功');
                }
            } catch (eTithe) {}
            break;
        }
        case 'addRelation': {
            // 门派好感 +1（简易实现：修改 discipleState 中的关系标记）
            const ds = window.discipleState || {};
            ds._sectRelation = (ds._sectRelation || 0) + action.value;
            resultMsgs.push(`・门派好感 +${action.value}`);
            break;
        }
        case 'addInfo': {
            // 按概率触发情报
            // 第十二波 · 开山秘艺情报域：千耳百目功——耳目练出来了，听人说话自会拣要紧的
            var _intelB = 0;
            try { if (typeof window.sectSignatureIntelBonus === 'function') _intelB = window.sectSignatureIntelBonus() || 0; } catch (eIntel) {}
            const chance = Math.min(0.95, (action.chance != null ? action.chance : 1.0) + _intelB);
            if (Math.random() < chance) {
                const infos = [
                    '听说附近出现了强大的妖兽…',
                    '某地发现了珍贵的灵药',
                    '其他门派正在招募弟子',
                    '最近有商队路过，可以去做任务',
                    '门派长老近期将举办讲法大会',
                    '有弟子发现了一处秘境入口'
                ];
                const info = infos[Math.floor(Math.random() * infos.length)];
                resultMsgs.push(`・获得情报: ${info}`);
                // v20.8：情报不只进日志——顺手递进传闻池，同门与茶馆会把话头带走（此前情报是死文本）
                if (window.playerPushDeed) {
                    try { window.playerPushDeed('neutral', '议事厅里传开：' + info); } catch (eRm) {}
                }
            }
            break;
        }
        case 'advanceTime': {
            if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
                window.timeSystem.advanceTime(action.value, '使用门派设施');
            }
            break;
        }
        default: {
            resultMsgs.push(`・[未知动作: ${action.type}]`);
            console.warn('[Facilities] 未注册的动作类型:', action.type);
            break;
        }
    }
}

// ============ 使用设施 ============
// v20.86 沉浸层：注册过情境剧本的设施，点「使用/进入」先入戏（scenarioEngine 面板），
// 戏里的「例行走一遍」等选项再经 eff.facility 钩子回到本函数结算——经济口径一份账。
// opts.fromScenario=true 时跳过剧本入口直落结算；opts.quiet=true 时不弹 toast，
// 返回 {ok, text|reason} 供剧本层把结算原文记进戏文。
function useFacility(facilityId, opts) {
    opts = opts || {};
    const quiet = !!opts.quiet;
    function fail(reason, kind) {
        if (quiet) return { ok: false, reason: reason };
        if (window.showMessage) {
            window.showMessage(reason, kind || 'error');
        } else {
            alert(reason);
        }
        return false;
    }

    // 剧本入口（掌门大殿除外：它的守卫反应链本身就是戏，不再套一层面板）
    if (!opts.fromScenario && facilityId !== 'sect_leader'
        && window.scenarioEngine && window.scenarioEngine.facilities
        && window.scenarioEngine.facilities[facilityId]
        && (window.scenarioEngine.facilities[facilityId].scenarios || []).length
        && typeof window.openFacilityScenario === 'function') {
        window.openFacilityScenario(facilityId);
        return true;
    }

    const accessCheck = checkFacilityAccess(facilityId);
    if (!accessCheck.accessible) {
        return fail(accessCheck.reason);
    }

    const facility = visibleFacilities().find(f => f.id === facilityId);
    if (!facility) return fail('无效的设施！');

    const cd = window.currentCharData;
    if (!cd) return fail('角色状态未初始化');

    // 检查真气（从 currentCharData 读取，不再依赖 DOM）
    const totalQiCost = facility.actions
        .filter(a => a.type === 'spendQi')
        .reduce((sum, a) => sum + (a.value || 0), 0);
    if (totalQiCost > 0) {
        const currentQi = cd.qi || 0;
        if (currentQi < totalQiCost) {
            return fail('真气不足！需要 ' + totalQiCost + ' 真气');
        }
    }

    // v15.5 贡献预检（诊金类制度成本）——v16.1 起读修葺后的实际值
    const effActions = effectiveActions(facility);
    const contribCost = effActions
        .filter(a => a.type === 'spendContribution')
        .reduce((sum, a) => sum + (a.value || 0), 0);
    if (contribCost > 0) {
        const dsFee = window.discipleState || {};
        if ((dsFee.contribution || 0) < contribCost) {
            return fail('门派贡献不足！需要 ' + contribCost + ' 点（当前' + (dsFee.contribution || 0) + '）');
        }
    }

    // v15.5 世界反应链：掌门大殿擅闯（替代人为每日计数——惩罚来自世界，非计数器）
    initFacilityState();
    if (facilityId === 'sect_leader') {
        // v22.1 掌门下山游历：大殿虚位，只留字条——人在山下城里，不在殿中
        var _awaySect = (window.discipleState || {}).sectId;
        if (_awaySect && typeof window.isLeaderAway === 'function' && window.isLeaderAway(_awaySect)) {
            var _awayCity = (typeof window.leaderAwayCity === 'function' && window.leaderAwayCity(_awaySect)) || '';
            try { if (window.timeSystem && window.timeSystem.advanceTime) window.timeSystem.advanceTime(10, '在大殿外驻足'); } catch (e) {}
            return fail('大殿虚位，案上压着执事留的字条：「掌门下山游历，不日即回。」' + (_awayCity ? '（听说此刻人在' + _awayCity + '）' : ''), 'info');
        }
        const visitsToday = facilityState.dailyUsage['sect_leader'] || 0;
        if (visitsToday === 1) {
            // 第二次：守卫拦下劝返（劝返同样记入滋扰——再犯即论处）
            try { if (window.timeSystem && window.timeSystem.advanceTime) window.timeSystem.advanceTime(10, '在殿外徘徊'); } catch (e) {}
            facilityState.dailyUsage['sect_leader'] = visitsToday + 1;
            updateFacilityUI();
            return fail('守卫拦住你："晨课受贺已毕，掌门正在处理教务——无事请回。"', 'warning');
        }
        if (visitsToday >= 2) {
            // 第三次起：以冒犯尊长论处，逐次加重
            const fine = 10 * (visitsToday - 1);
            const dsPen = window.discipleState || {};
            if (dsPen.contribution != null) dsPen.contribution = Math.max(0, dsPen.contribution - fine);
            try { if (window.timeSystem && window.timeSystem.advanceTime) window.timeSystem.advanceTime(30, '被守卫架去思过'); } catch (e) {}
            if (window.showMessage) {
                window.showMessage('你又硬闯大殿，被守卫架了出来——以冒犯尊长论处：罚扣贡献' + fine + '点，禁足思过半个时辰！', 'error');
            }
            facilityState.dailyUsage['sect_leader'] = visitsToday + 1;
            updateFacilityUI();
            return true;
        }
        // 首次拜见：走下方正常受贺流程
    }

    // 执行设施所有动作
    const resultMsgs = [];
    resultMsgs.push(`使用了 ${facility.name}，获得以下效果：\n`);

    effActions.forEach(action => {
        executeAction(action, resultMsgs, facilityId);
    });
    // 更新使用次数（基于游戏天数）——仅制度性限次/冷却设施需要记录（v15.5：无配额设施不写计数）
    initFacilityState();
    const currentDay = getFacilityGameDay();
    if (facilityState.lastResetGameDay !== currentDay) {
        facilityState.lastResetGameDay = currentDay;
        facilityState.dailyUsage = {};
    }
    if ((facility.dailyUses > 0 || facility.cooldownMinutes > 0 || facility.trackVisits)) {
        facilityState.dailyUsage[facilityId] = (facilityState.dailyUsage[facilityId] || 0) + 1;

        // 设置冷却（基于游戏时间）
        const now = getGameMinute();
        facilityState.lastUsedGameMinute[facilityId] = now;
        if (facility.cooldownMinutes > 0) {
            facilityState.cooldownUntilMinute[facilityId] = now + facility.cooldownMinutes;
        }
    }

    // 批三 · 地标熟识：常去则熟——每用一次本派地标，熟识长一分（生→熟→密→知交，增益逐档加厚）
    if (facilityId.indexOf('fx_') === 0 && typeof window.touchLandmark === 'function') {
        try { window.touchLandmark(facilityId); } catch (eLm) {}
    }

    // v18.6 门派工坊研习：领料/制作用途附带工匠指点——8小时窗内制作灵石费×0.6
    if (CRAFT_WORKSHOPS[facilityId]) {
        var wsNow = getGameMinute();
        window._craftDiscountUntil = wsNow + 480;
        resultMsgs.push('・🛠️ 师傅看你勤快，多教了两手省钱门路——8小时内制作灵石费用六折。');
        if (!quiet && window.showMessage) window.showMessage('🛠️ 师傅看你勤快，多教了两手省钱门路——8小时内制作灵石费用六折。', 'info');
    }

    // 第十二波 · 门中炉火：炼丹房/锻造坊开炉——8小时窗内对应制作成功率+8%（crafting.js 消费）
    if (facilityId === 'sect_alchemy_room' || facilityId === 'sect_forge_room') {
        var isForge = facilityId === 'sect_forge_room';
        window._sectCraftBuff = { kind: isForge ? 'forging' : 'pilfer', until: getGameMinute() + 480 };
        var fireText = isForge
            ? '・🔥 炉温上来了，锤感正顺——8个时辰内锻造成功率见长。'
            : '・⚗️ 丹炉养好了火——8个时辰内炼丹成功率见长。';
        resultMsgs.push(fireText);
        if (!quiet && window.showMessage) window.showMessage(fireText, 'info');
    }

    // 更新 UI（真气显示）
    if (typeof window.updateAllStatDisplays === 'function') {
        window.updateAllStatDisplays();
    } else if (typeof window.updateCharacterUI === 'function') {
        window.updateCharacterUI();
    }

    // 更新设施 UI
    updateFacilityUI();

    // 显示结果（quiet=剧本层结算：原文交回，不另弹 toast）
    const resultText = resultMsgs.join('\n');
    if (quiet) return { ok: true, text: resultText };
    if (window.showMessage) {
        window.showMessage(resultText, 'success');
    } else {
        alert(resultText);
    }

    return true;
}

// ============ 渲染设施UI ============
function updateFacilityUI() {
    const container = document.getElementById('sect-facilities-container');
    if (!container) return;

    initFacilityState();

    container.innerHTML = visibleFacilities().map(facility => {
        const accessCheck = checkFacilityAccess(facility.id);
        const canUse = accessCheck.accessible;
        const ds = window.discipleState || {};

        let statusText = '';
        let statusClass = '';
        let buttonClass = '';

        if (!ds.isInSect) {
            statusText = '需要先加入门派';
            statusClass = 'text-red-400';
            buttonClass = 'bg-gray-600 cursor-not-allowed';
        } else if (!canUse) {
            statusText = accessCheck.reason;
            statusClass = accessCheck.reason.includes('冷却') ? 'text-yellow-400' : 'text-red-400';
            buttonClass = 'bg-gray-600 cursor-not-allowed';
        } else {
            if (!(facility.dailyUses > 0)) {
                statusText = '随时可用';
            } else {
                const used = facilityState.dailyUsage[facility.id] || 0;
                statusText = `今日剩余 ${facility.dailyUses - used} 次`;
            }
            statusClass = 'text-green-400';
            buttonClass = 'bg-yellow-600 hover:bg-yellow-500 cursor-pointer';
        }

        // 构建动作描述（v16.1：按修葺等级显示实际效果值）
        const actionDesc = effectiveActions(facility)
            .filter(a => a.type !== 'advanceTime')
            .map(a => {
                switch (a.type) {
                    case 'restoreQi': return `恢复真气 ${a.value}`;
                    case 'spendQi': return `消耗真气 ${a.value}`;
                    case 'spendContribution': return `贡献 -${a.value}`;
                    case 'skillBoost': return `技能+${a.value}`;
                    case 'restoreHealth': return `疗伤 ${a.value}`;
                    case 'addPoints': return `领悟+${a.value}`;
                    case 'addSkillExp': return `技能经验+${a.value}`;
                    case 'rewardMaterials': return `领取物资`;
                    case 'addRelation': return `好感+${a.value}`;
                    case 'addInfo': return a.chance ? `情报(${Math.round(a.chance*100)}%)` : '情报';
                    case 'openCrafting': return a.craft === 'forging' ? '开炉锻器' : '开炉炼丹';
                    case 'openCourt': return '升堂办事';
                    case 'sectFarm': return '下田耕作';
                    default: return '';
                }
            })
            .filter(Boolean)
            .join(' | ');

        return `
            <div class="bg-gray-700/30 p-3 rounded border ${canUse ? 'border-green-600' : 'border-gray-600'}">
                <div class="flex items-center gap-3 mb-2">
                    <span class="text-2xl">${facility.icon}</span>
                    <div class="flex-1">
                        <h4 class="font-bold text-white text-sm">${facility.name}</h4>
                        <p class="text-xs text-gray-400">${facility.desc}</p>
                        ${actionDesc ? `<p class="text-xs text-blue-300 mt-1">${actionDesc}</p>` : ''}
                    </div>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-xs ${statusClass}">${statusText}</span>
                    <div class="flex gap-1">
                        ${facility.id === 'sect_library' ? `<button onclick="openSectLibraryPanel()" class="bg-sky-700 hover:bg-sky-600 text-white px-2 py-1 rounded text-xs font-bold transition" title="分层阅览：地位越高可入层数越多">📖 阅览</button>` : ''}
                        ${facility.id === 'sect_leader' && (window.discipleState || {}).rank != null && window.discipleState.rank <= 2 ? `<button onclick="openSectUpgradePanel()" class="bg-purple-700 hover:bg-purple-600 text-white px-2 py-1 rounded text-xs font-bold transition" title="门派修葺：长老定夺，贡献扩建">🏗️ 修葺</button>` : ''}
                        <button onclick="useFacility('${facility.id}')"
                            class="${buttonClass} text-white px-3 py-1 rounded text-sm font-bold transition"
                            ${canUse ? '' : 'disabled'}>
                            ${window.sectFacilityActionLabel ? window.sectFacilityActionLabel(facility.id) : '前往'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ============ 打开设施界面 ============
function openFacilityUI() {
    const ds = window.discipleState || {};
    if (!ds.isInSect) {
        if (window.showMessage) {
            window.showMessage('你还没有加入任何门派，无法访问门派设施！', 'error');
        } else {
            alert('你还没有加入任何门派，无法访问门派设施！');
        }
        return;
    }

    // 启动时校验设施定义
    validateFacilities();

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

    modal.innerHTML = `
        <div class="bg-gray-800 border-2 border-yellow-500 rounded-xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto mx-4">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-yellow-500">🏛️ 门派设施 - ${ds.sectId || '未知'}</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>

            <div class="mb-4 p-3 bg-gray-700/50 rounded">
                <p class="text-sm text-gray-400">当前职位：<span class="text-purple-400 font-bold">${ds.rankName || '未知'}</span></p>
                <p class="text-xs text-gray-500 mt-1">使用设施可以提升自己的实力，但会受到使用次数和冷却限制</p>
            </div>

            <div id="sect-facilities-container" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- 动态生成 -->
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // 初始化并更新UI
    initFacilityState();
    updateFacilityUI();
}

// ============ 重置设施状态（新游戏时调用） ============
function resetFacilityState() {
    // v16.1：levels（门派修葺成果）跨天/跨局保留——建筑不会一夜塌回去；此处原样整体重赋会丢等级
    const keepLevels = facilityState.levels || {};
    facilityState = {
        lastResetGameDay: 0,
        dailyUsage: {},
        cooldownUntilMinute: {},
        lastUsedGameMinute: {},
        levels: keepLevels
    };
}

// ============ 导出 ============
window.FACILITY_TYPES = FACILITY_TYPES;
window.facilities = facilities;
window.SECT_FACILITY_EXTRAS = SECT_FACILITY_EXTRAS; // v20.86：剧本层按门派专属清单挨个入戏
window.facilityState = facilityState;
window.VALID_ACTION_TYPES = VALID_ACTION_TYPES;
// v20.86：注册过情境剧本的设施，按钮文案「进入」（先入戏再结算）；其余仍「使用」
window.sectFacilityActionLabel = function (fid) {
    try {
        if (fid !== 'sect_leader' && window.scenarioEngine && window.scenarioEngine.facilities
            && window.scenarioEngine.facilities[fid]
            && (window.scenarioEngine.facilities[fid].scenarios || []).length) return '进入';
    } catch (e) {}
    return '前往';
};
window.initFacilityState = initFacilityState;
window.getFacilityLevel = facLevel; // 批三：兵器库淬火养护费随修葺等级递减，需读等级
window.checkFacilityAccess = checkFacilityAccess;
window.useFacility = useFacility;
window.updateFacilityUI = updateFacilityUI;
window.openFacilityUI = openFacilityUI;
window.validateFacilities = validateFacilities;
window.loadFacilityStateFromSave = loadFacilityStateFromSave;
window.getFacilityStateSnapshot = getFacilityStateSnapshot;
window.resetFacilityState = resetFacilityState;

// ==================== v15.4 藏经阁·分层阅览体系 ====================
// 设计（行业调研后定稿）：地位=准入证（楼层按职级开放，可见不可入）· 时间=主要成本（参悟耗时+真气）
// · 贡献=加速器（请抄本不绕职级门）· 神识=效率阀。
// 掌握度曲线：成长速率 = max(0.1, 1 - m/100)——0%时1.0倍、60%时0.4倍；功法威力按掌握度百分比发挥。
// v20.9 口径统一：maxRank 与 canAccessScriptureTier 完全对齐（tier2=内门≤4、tier3=亲传≤3、tier4=长老≤2）。
// 此前 tier2 写 5、tier3 写 4、tier4 写 3，各比真门槛松一级，导致分层面板与可读典籍列表观感不一致。
var LIB_TIERS = [
    { tier: 1, floor: '一层·外门阁', maxRank: 7, insightBase: 40, studyMinutes: 120 },
    { tier: 2, floor: '二层·内门阁', maxRank: 4, insightBase: 25, studyMinutes: 150 },
    { tier: 3, floor: '三层·核心阁', maxRank: 3, insightBase: 15, studyMinutes: 180 },
    { tier: 4, floor: '四层·镇派阁', maxRank: 2, insightBase: 10, studyMinutes: 210 }
];
var LIB_TIER_COPYPRICE = { 1: 300, 2: 800, 3: 1500, 4: 3000 };
var LIB_RANK_NAMES = { 7: '杂役弟子', 6: '记名弟子', 5: '外门弟子', 4: '内门弟子', 3: '亲传弟子', 2: '长老', 1: '副掌门', 0: '掌门' };
// 唯一准入判定：真源 canAccessScriptureTier 在则用它（与 getReadableSectArts 同门），
// 缺载（独立加载/测试桩）才退回 maxRank 数值——两者数值已对齐，口径不再分叉。
function libTierUnlocked(tier) {
    if (typeof window.canAccessScriptureTier === 'function') return !!window.canAccessScriptureTier(tier);
    var ds = window.discipleState;
    var rank = (ds && ds.rank != null) ? ds.rank : 7;
    if (rank === -1 || rank === -2) return false; // 侍妾/同参弟子无职位，与真源同口径（对齐 canAccessScriptureTier）
    return rank <= libTierCfg(tier).maxRank;
}

// ============ v20.93 镇派亲传 ============
// 四层镇派阁的地位门照旧（长老可入、可见书目），但镇派神功大多不落纸册——
//   transmit:'leader' 历代掌门亲传独承（如丐帮打狗棒法，帮主之位传谁棒法传谁）；
//   transmit:'direct' 掌门/副掌门天然在传，长老须先请掌门亲传（好感与贡献双门）；
//   无标记（少林/天书阁/大隐阁/侠隐阁/全真五家的藏书门派）照旧阁中可读。
// 受传账记在 ds.artTransmits，随弟子状态存档持久。
function libRankNow() {
    var ds = window.discipleState;
    return (ds && ds.rank != null) ? ds.rank : 7;
}
function libTransmitOK(art) {
    if (!art || !art.transmit) return true;
    var rank = libRankNow();
    if (art.transmit === 'leader') return rank === 0;
    if (rank <= 1) return true;   // 掌门/副掌门自己就是传人
    var ds = window.discipleState;
    return !!(ds && ds.artTransmits && ds.artTransmits[art.id]);
}
window.sectArtTransmitOK = libTransmitOK;

function libArtsOf(sectName) {
    return (window.SECT_SPECIFIC_ARTS && window.SECT_SPECIFIC_ARTS[sectName]) || [];
}
function libInsights() {
    var ds = window.discipleState;
    if (!ds) return null;
    if (!ds.artInsights) ds.artInsights = {};
    return ds.artInsights;
}
function libTierCfg(tier) {
    for (var i = 0; i < LIB_TIERS.length; i++) if (LIB_TIERS[i].tier === tier) return LIB_TIERS[i];
    return LIB_TIERS[0];
}
function libToday() { return getFacilityGameDay(); }
// 满掌握属性加成聚合（按掌握度百分比缩放）——buildPlayerBattleEntity 消费
window.getSectArtAttrBonuses = function () {
    var ds = window.discipleState;
    if (!ds || !ds.isInSect || !ds.sectId || !ds.artInsights) return null;
    var arts = libArtsOf(ds.sectId);
    if (!arts.length) return null;
    var out = {};
    arts.forEach(function (a) {
        var rec = ds.artInsights[a.id];
        if (!rec || !(rec.m > 0)) return;
        var scale = Math.min(100, rec.m) / 100;
        for (var k in (a.bonus || {})) out[k] = Math.round(((out[k] || 0) + a.bonus[k] * scale) * 10) / 10;
    });
    return Object.keys(out).length ? out : null;
};

window.openSectLibraryPanel = function () {
    var ds = window.discipleState;
    if (!ds || !ds.isInSect || !ds.sectId) { if (window.showMessage) window.showMessage('需先拜入门派方可入藏经阁', 'warning'); return; }
    var sectName = ds.sectId;
    var rank = ds.rank == null ? 7 : ds.rank;
    var arts = libArtsOf(sectName);
    if (!arts.length) { if (window.showMessage) window.showMessage(sectName + '的藏经阁尚在整理典籍。', 'info'); return; }
    var ins = libInsights();
    var intAttr = 10;
    try {
        var pa = (window.currentCharData && (window.currentCharData.attrs || window.currentCharData.mainAttributes)) || {};
        intAttr = pa.intelligence || pa['神识'] || 10;
    } catch (e) {}
    var html = '<p class="text-xs text-gray-400 mb-2">' + sectName + '·藏经阁——你的职位：<span class="text-amber-300">' + (ds.rankName || ('rank' + rank)) + '</span>　神识：<span class="text-cyan-300">' + intAttr + '</span></p>';
    LIB_TIERS.forEach(function (t) {
        html += '<div class="mt-3 pt-2 border-t border-gray-700"><p class="text-xs font-bold text-sky-300 mb-1">' + t.floor + '</p>';
        if (!libTierUnlocked(t.tier)) {
            html += '<p class="text-xs text-gray-600 px-2 py-2 bg-gray-900/60 rounded">🔒 ' + (LIB_RANK_NAMES[t.maxRank] || '高位弟子') + '及以上方可入内</p></div>';
            return;
        }
        var books = arts.filter(function (a) { return (a.tier || 1) === t.tier; });
        if (!books.length) { html += '<p class="text-xs text-gray-600">本层典籍整理中……</p></div>'; return; }
        books.forEach(function (a) {
            var rec = (ins && ins[a.id]) || {};
            var m = Math.min(100, rec.m || 0);
            // v20.93 镇派亲传：阁中可见书名，神功不落纸册——掌门亲传方能翻阅参悟
            if (!libTransmitOK(a)) {
                html += '<div class="bg-gray-900/70 rounded p-2 mb-1 border border-amber-900/40">'
                    + '<div class="flex justify-between items-center gap-2"><span class="text-sm text-gray-400 font-bold">📕 ' + a.name + '</span>'
                    + '<span class="text-[11px] text-amber-600">' + (a.transmit === 'leader' ? '🔒 历代掌门亲传独承——阁中无册' : '🔒 镇派神功不落纸册——须掌门亲传') + '</span></div>'
                    + '<p class="text-xs text-gray-600 mt-0.5">' + (a.type || '') + ' · ' + (a.grade || '') + ' · ' + (a.desc || '') + '</p>';
                if (a.transmit === 'direct' && rank === 2) {
                    html += '<div class="flex gap-1 mt-1"><button onclick="sectLibRequestTransmit(\'' + a.id + '\')" class="text-xs bg-rose-800 hover:bg-rose-700 px-2 py-1 rounded">请掌门亲传（好感60·贡献' + (a.copyPrice || LIB_TIER_COPYPRICE[t.tier]) + '）</button></div>';
                } else if (a.transmit === 'direct') {
                    html += '<p class="text-[11px] text-gray-600 mt-1">位至长老，方可入镇派阁请掌门亲传。</p>';
                }
                html += '</div>';
                return;
            }
            var stateTxt = m >= 100 ? '<span class="text-green-400">已大成</span>'
                : rec.heard ? ('<span class="text-yellow-400">掌握 ' + m + '%</span>（威力' + m + '%）')
                : '<span class="text-gray-500">未翻阅</span>';
            html += '<div class="bg-gray-900 rounded p-2 mb-1">'
                + '<div class="flex justify-between items-center"><span class="text-sm text-white font-bold">📖 ' + a.name + '</span><span class="text-xs">' + stateTxt + '</span></div>'
                + '<p class="text-xs text-gray-500 mt-0.5">' + (a.type || '') + ' · ' + (a.grade || '') + ' · ' + (a.desc || '') + '</p>'
                + '<div class="flex gap-1 mt-1 flex-wrap">';
            if (!rec.heard) {
                html += '<button onclick="sectLibBrowse(\'' + a.id + '\')" class="text-xs bg-cyan-700 hover:bg-cyan-600 px-2 py-1 rounded">翻阅（30分钟）</button>';
            } else {
                html += '<button onclick="sectLibStudy(\'' + a.id + '\')" class="text-xs bg-indigo-700 hover:bg-indigo-600 px-2 py-1 rounded"' + (m >= 100 ? ' disabled' : '') + '>参悟（' + t.studyMinutes + '分钟·真气20）</button>';
                if (!a.transmit) {
                    html += '<button onclick="sectLibCopy(\'' + a.id + '\')" class="text-xs bg-amber-700 hover:bg-amber-600 px-2 py-1 rounded">请抄本（贡献' + (a.copyPrice || LIB_TIER_COPYPRICE[t.tier]) + '）</button>';
                } else {
                    html += '<span class="text-[11px] text-gray-600 self-center">亲传口授心传，不落抄本</span>';
                }
                if (m > 0) {
                    var parts = [];
                    for (var k in (a.bonus || {})) parts.push(k + '+' + (Math.round(a.bonus[k] * m) / 100));
                    html += '<span class="text-[11px] text-emerald-400 self-center">当前加成 ' + parts.join(' ') + '</span>';
                }
            }
            html += '</div></div>';
        });
        html += '</div>';
    });
    html += '<p class="text-[11px] text-gray-500 mt-3">参悟速率随掌握度递减（0%时最快，60%时仅四成）；镇派层需神识深厚方能全速参悟。镇派神功多为掌门亲传，阁中只见书名不见册。</p>';
    if (typeof window.showModal === 'function') window.showModal('📚 藏经阁 · ' + sectName, html);
    else if (window.showMessage) window.showMessage('藏经阁面板不可用', 'error');
};

window.sectLibBrowse = function (artId) {
    var ds = window.discipleState;
    var art = libArtsOf(ds.sectId).find(function (a) { return a.id === artId; });
    if (!art) return;
    var t = libTierCfg(art.tier || 1);
    if (!libTierUnlocked(art.tier || 1)) { if (window.showMessage) window.showMessage('你尚未获准进入' + t.floor, 'warning'); return; }
    if (!libTransmitOK(art)) {
        if (window.showMessage) window.showMessage(art.transmit === 'leader'
            ? '《' + art.name + '》历代掌门亲传独承——阁中无册，你连书名都是听来的。'
            : '《' + art.name + '》是镇派神功，不落纸册——须掌门亲传方可修习。', 'warning');
        return;
    }
    var ins = libInsights();
    if (!ins[artId]) ins[artId] = { heard: true, m: 0, lastDay: 0 }; // v15.7 修复：翻阅不占参悟日——lastDay 置 0 使当日即可首参
    else { ins[artId].heard = true; }
    try { if (window.timeSystem && window.timeSystem.advanceTime) window.timeSystem.advanceTime(30, '藏经阁翻阅'); } catch (e) {}
    if (window.showMessage) window.showMessage('你翻阅了《' + art.name + '》——' + (art.desc || '') + '（可在阁中参悟以提升掌握度）', 'info');
    if (typeof window.growLifeSkill === 'function') window.growLifeSkill('学识', 1, { reason: '阁中读书' }); // v20.94 熟能生巧
    window.openSectLibraryPanel();
};

window.sectLibStudy = function (artId) {
    var cd = window.currentCharData;
    var ds = window.discipleState;
    if (!cd || !ds) return;
    var art = libArtsOf(ds.sectId).find(function (a) { return a.id === artId; });
    if (!art) return;
    var t = libTierCfg(art.tier || 1);
    if (!libTierUnlocked(art.tier || 1)) { if (window.showMessage) window.showMessage('你尚未获准进入' + t.floor, 'warning'); return; }
    if (!libTransmitOK(art)) {
        if (window.showMessage) window.showMessage(art.transmit === 'leader'
            ? '《' + art.name + '》非掌门之身不可参悟——棒在人在，位在人传。'
            : '《' + art.name + '》须掌门亲传方可参悟——口授心传，阁中无册。', 'warning');
        return;
    }
    var ins = libInsights();
    var rec = ins[artId];
    if (!rec || !rec.heard) { if (window.showMessage) window.showMessage('先翻阅此书方可参悟', 'warning'); return; }
    var today = libToday();
    if (rec.lastDay === today) { if (window.showMessage) window.showMessage('《' + art.name + '》今日已参悟过——文武之道，一张一弛。', 'warning'); return; }
    if ((cd.qi || 0) < 20) { if (window.showMessage) window.showMessage('真气不足（参悟需20点）', 'error'); return; }
    cd.qi -= 20;
    // 掌握度成长：base × 递减速率(max(0.1,1-m/100)) × 神识系数(0.75+int/200)；镇派神识不足减半
    var m = Math.min(100, rec.m || 0);
    var rate = Math.max(0.1, 1 - m / 100);
    var pa = cd.attrs || cd.mainAttributes || {};
    var intAttr = pa.intelligence || pa['神识'] || 10;
    var gain = t.insightBase * rate * (0.75 + intAttr / 200);
    // 第十二波 · 开山秘艺典籍域：会读书的人参悟更深（天书读神术，掌握度折成参悟效率）
    try {
        var _tomeMul = (typeof window.sectSignatureStudyMul === 'function') ? (window.sectSignatureStudyMul() || 1) : 1;
        if (_tomeMul > 1) gain *= _tomeMul;
    } catch (eTome) {}
    // v16.0 师徒咬合：师父指点（请益）使当次参悟翻倍，用后即耗
    var blessed = false;
    if (ds._masterId && ds._masterBlessDay === today) {
        gain *= 2; blessed = true; delete ds._masterBlessDay;
        // v16.4 污衣长老传艺：污衣弟子请益再×1.5（义气人脉的分量）
        if (ds._gbFaction && ds._gbFaction.side === 'dirty') { gain *= 1.5; blessed = 'dirty'; }
    }
    var halved = false;
    if ((art.tier || 1) === 4 && art.wuxingReq && intAttr < art.wuxingReq) { gain *= 0.5; halved = true; }
    gain = Math.max(1, Math.round(gain));
    var before = m;
    rec.m = Math.min(100, Math.round((m + gain) * 10) / 10);
    rec.lastDay = today;
    try { if (window.timeSystem && window.timeSystem.advanceTime) window.timeSystem.advanceTime(t.studyMinutes, '藏经阁参悟'); } catch (e) {}
    var msg = '参悟《' + art.name + '》：掌握度 ' + before + '% → ' + rec.m + '%（本次+' + gain + (blessed ? '，师父指点翻倍' : '') + (halved ? '，神识不足进度减半' : '') + '）';
    if (typeof window.growLifeSkill === 'function') window.growLifeSkill('学识', 1, { reason: '阁中参悟' }); // v20.94 熟能生巧
    if (before < 100 && rec.m >= 100) msg += ' 🎉 功法大成！威力全额发挥';
    if (window.showMessage) window.showMessage(msg, rec.m >= 100 ? 'success' : 'info');
    window.openSectLibraryPanel();
};

window.sectLibCopy = function (artId) {
    var ds = window.discipleState;
    if (!ds) return;
    var art = libArtsOf(ds.sectId).find(function (a) { return a.id === artId; });
    if (!art) return;
    var t = libTierCfg(art.tier || 1);
    if (!libTierUnlocked(art.tier || 1)) { if (window.showMessage) window.showMessage('你尚未获准进入' + t.floor, 'warning'); return; }
    if (art.transmit) { if (window.showMessage) window.showMessage('《' + art.name + '》口授心传，不落纸册——没有抄本可请。', 'warning'); return; }
    var price = art.copyPrice || LIB_TIER_COPYPRICE[t.tier];
    if ((ds.contribution || 0) < price) { if (window.showMessage) window.showMessage('门派贡献不足（需' + price + '，当前' + (ds.contribution || 0) + '）', 'error'); return; }
    if (typeof window.addItem !== 'function') { if (window.showMessage) window.showMessage('背包系统未就绪', 'error'); return; }
    if (!window.addItem(artId, 1)) { if (window.showMessage) window.showMessage('背包装不下抄本了', 'error'); return; }
    ds.contribution -= price;
    if (typeof window.saveSectData === 'function') window.saveSectData();
    if (window.showMessage) window.showMessage('花' + price + '贡献请出《' + art.name + '》抄本一册（研读可助参悟，威能仍看掌握度）', 'success');
    window.openSectLibraryPanel();
};

// v20.93 请掌门亲传：长老入得了镇派阁、见得到书名，神功却要掌门点头口授。
// 三道门：职位（长老）· 掌门好感（60，看得上你才传）· 贡献（抄本同价，公中的礼数）。
window.sectLibRequestTransmit = function (artId) {
    var ds = window.discipleState;
    if (!ds || !ds.isInSect || !ds.sectId) return;
    var art = libArtsOf(ds.sectId).find(function (a) { return a.id === artId; });
    if (!art || art.transmit !== 'direct') { if (window.showMessage) window.showMessage('此功非掌门亲传之例。', 'warning'); return; }
    if (libTransmitOK(art)) { if (window.showMessage) window.showMessage('你已得《' + art.name + '》亲传。', 'info'); return; }
    var rank = libRankNow();
    if (rank > 2) { if (window.showMessage) window.showMessage('位至长老，方有资格请掌门亲传。', 'warning'); return; }
    var price = art.copyPrice || LIB_TIER_COPYPRICE[4];
    if ((ds.contribution || 0) < price) { if (window.showMessage) window.showMessage('门派贡献不足（需' + price + '，当前' + (ds.contribution || 0) + '）——亲传是大礼，公中的礼数不能缺。', 'error'); return; }
    var leader = null;
    try {
        if (window.npcManager && window.npcManager.getNPC) leader = window.npcManager.getNPC('sect_leader_' + ds.sectId);
    } catch (e) {}
    var aff = leader && leader.relationship ? (Number(leader.relationship.affection) || 0) : 0;
    if (aff < 60) {
        if (window.showMessage) window.showMessage((leader ? '掌门' : '掌门') + '看了你很久，摇了摇头：「此功干系重大，你我还不到那份上。」（掌门好感需60，当前' + aff + '）', 'warning');
        return;
    }
    ds.contribution -= price;
    if (!ds.artTransmits) ds.artTransmits = {};
    ds.artTransmits[artId] = { day: libToday(), from: (leader && leader.name) || '掌门' };
    var ins = libInsights();
    if (ins && !ins[artId]) ins[artId] = { heard: true, m: 0, lastDay: 0 };   // 亲传即「已阅」——口授心传，回来即可参悟
    if (leader && typeof leader.changeAffection === 'function') { try { leader.changeAffection(3); } catch (e) {} }
    try { if (window.timeSystem && window.timeSystem.advanceTime) window.timeSystem.advanceTime(240, '掌门亲传'); } catch (e) {}
    if (typeof window.saveSectData === 'function') window.saveSectData();
    if (window.showMessage) window.showMessage('📜 ' + ((leader && leader.name) || '掌门') + '屏退左右，于祖师堂前口授《' + art.name + '》要诀——四个时辰，一字不落。「阁中无册，册在你心里。传你，是信你。」（贡献-' + price + '，掌门好感+3）', 'success');
    if (window.gameLog && window.gameLog.add) window.gameLog.add('掌门亲传《' + art.name + '》——镇派神功自此有你的份。', 'success');
    window.openSectLibraryPanel();
};
