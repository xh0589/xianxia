// ==================== 仙路长青 - 门派数据 ====================

// 门派详细数据
const sectsData = {
    // ===== 中州（中原地区）=====
    '少林寺': { type: '正道', location: '中州', desc: '佛门正宗，位于嵩山，禅武合一。', power: '巨擘', weapons: '棍棒、拳脚' },
    '嵩山派': { type: '正道', location: '中州', desc: '五岳剑派之首，位于嵩山，剑法雄浑。', power: '中等', weapons: '剑' },
    '大旗门': { type: '正道', location: '中州', desc: '位于汴京，专研军阵杀伐之术。', power: '巨擘', weapons: '长兵' },
    '恒山派': { type: '正道', location: '中州', desc: '五岳剑派之一，位于恒山，多为女尼。', power: '中等', weapons: '剑' },
    '全真教': { type: '正道', location: '中州', desc: '位于终南山，内丹功法集大成者。', power: '大派', weapons: '剑' },
    '华山派': { type: '正道', location: '中州', desc: '五岳剑派之一，位于华山，剑法轻灵。', power: '中等', weapons: '剑' },
    '武当派': { type: '正道', location: '中州', desc: '位于武当山，道门正宗，以柔克刚。', power: '大派', weapons: '剑、拂尘' },
    '侠隐阁': { type: '正道', location: '中州', desc: '位于武昌，教授江湖武功。', power: '中等', weapons: '各种' },
    '天涯海阁': { type: '正道', location: '中州', desc: '位于江陵，文人才子云集处。', power: '中等', weapons: '笔、乐器' },
    // ===== 东荒（东部/华东地区）=====
    '泰山派': { type: '正道', location: '东荒', desc: '五岳剑派之一，位于泰山。', power: '中等', weapons: '剑' },
    '药王谷': { type: '正道', location: '东荒', desc: '位于泰山附近，医者仁心。', power: '小', weapons: '银针、药锄' },
    '神机门': { type: '正道', location: '东荒', desc: '位于滕州，擅长机关术。', power: '中等', weapons: '机关术' },
    '霹雳堂': { type: '正道', location: '东荒', desc: '位于寿春，擅长火器。', power: '中等', weapons: '火器' },
    '茅山派': { type: '正道', location: '东荒', desc: '位于茅山，以符箓道法闻名。', power: '中等', weapons: '符纸、桃木剑' },
    '大隐阁': { type: '正道', location: '东荒', desc: '位于九华山，隐退高人聚集地。', power: '未知', weapons: '各类兵刃' },
    '天书阁': { type: '正道', location: '东荒', desc: '位于云台山，收罗天下书籍。', power: '未知', weapons: '各类兵刃' },
    '蓬莱派': { type: '正道', location: '东荒', desc: '位于蓬莱仙岛，擅水法与幻术。', power: '中等', weapons: '法宝、拂尘' },
    // ===== 南疆（西南/南方地区）=====
    '衡山派': { type: '正道', location: '南疆', desc: '五岳剑派之一，位于衡山。', power: '中等', weapons: '剑' },
    '丐帮': { type: '正道', location: '南疆', desc: '位于岳阳，天下第一大帮。', power: '巨擘', weapons: '棍棒、拳脚' },
    '铁掌帮': { type: '中立', location: '南疆', desc: '位于洞庭湖，铁掌功威震江湖。', power: '中等偏上', weapons: '掌、棍棒' },
    '百花谷': { type: '中立', location: '南疆', desc: '位于白鹿泽，医武双修。', power: '小', weapons: '暗器、剑' },
    '五仙教': { type: '中立', location: '南疆', desc: '位于大理，南疆巫蛊之术正统。', power: '中等', weapons: '蛊术、短笛' },
    '修罗宫': { type: '邪派', location: '南疆', desc: '位于遵义，只收受情伤女子。', power: '中等', weapons: '双刺、剑' },
    '阎罗殿': { type: '邪派', location: '南疆', desc: '位于雷公山，刀法霸道。', power: '大派', weapons: '刀' },
    // ===== 西漠（西北地区）=====
    '昆仑派': { type: '正道', location: '西漠', desc: '位于昆仑山，西域玄门活化石。', power: '大派', weapons: '剑、法宝' },
    '金刚宗': { type: '正道', location: '西漠', desc: '位于吐蕃，密宗苦行，炼体无双。', power: '中等', weapons: '金刚杵、拳脚' },
    '天龙教': { type: '邪派', location: '西漠', desc: '位于大漠深处，西域魔教。', power: '大派', weapons: '刀法、掌法' },
    '烈日教': { type: '邪派', location: '西漠', desc: '位于西北边陲，崇拜烈日。', power: '中等偏上', weapons: '火焰类功法' },
    // ===== 北冥（北方/天山一带）=====
    '天山派': { type: '正道', location: '北冥', desc: '位于天山，擅水属性功法。', power: '中等', weapons: '剑、飘带' },
    '逍遥派': { type: '中立', location: '北冥', desc: '位于天山缥缈峰，隐世高人。', power: '极小', weapons: '各种奇门兵刃' },
    '血手门': { type: '邪派', location: '北冥', desc: '位于关外，行事残忍。', power: '中等', weapons: '爪、毒' },
    // ===== 蜀地（四川地区）=====
    '青城派': { type: '正道', location: '蜀地', desc: '位于青城山，蜀中剑派。', power: '中等', weapons: '剑' },
    '峨眉派': { type: '正道', location: '蜀地', desc: '位于峨眉山，佛道兼修。', power: '大派', weapons: '剑' },
    '唐门': { type: '中立', location: '蜀地', desc: '位于蜀中，暗器与机关术极致。', power: '中等偏上', weapons: '暗器、机关傀儡' },
    // ===== 东南海域=====
    '铸剑山庄': { type: '正道', location: '东南海域', desc: '位于浙江龙泉，天下锻造师聚集地。', power: '中等', weapons: '各类刀剑、锤' },
    '飞蝎坞': { type: '邪派', location: '东南海域', desc: '位于江南水乡隐秘据点。', power: '小', weapons: '毒针、匕首' }
};

// 门派位置映射 (SVG坐标) - v10.0 按地区分配
const sectPositions = {
    // ===== 中州（中原）=====
    '少林寺': { x: 390, y: 230, color: '#fbbf24' },      // 嵩山
    '嵩山派': { x: 400, y: 240, color: '#a78bfa' },      // 嵩山
    '大旗门': { x: 430, y: 250, color: '#fbbf24' },      // 汴京
    '恒山派': { x: 380, y: 210, color: '#fb7185' },      // 恒山
    '全真教': { x: 350, y: 290, color: '#34d399' },      // 终南山
    '华山派': { x: 460, y: 270, color: '#f472b6' },      // 华山
    '武当派': { x: 420, y: 280, color: '#60a5fa' },      // 武当山
    '侠隐阁': { x: 450, y: 290, color: '#fbbf24' },      // 武昌
    '天涯海阁': { x: 440, y: 310, color: '#fbbf24' },    // 江陵
    // ===== 东荒（华东）=====
    '泰山派': { x: 520, y: 240, color: '#fbbf24' },      // 泰山
    '药王谷': { x: 530, y: 260, color: '#34d399' },      // 泰山附近
    '神机门': { x: 560, y: 240, color: '#a78bfa' },      // 滕州
    '霹雳堂': { x: 590, y: 280, color: '#fbbf24' },      // 寿春
    '茅山派': { x: 620, y: 260, color: '#a78bfa' },      // 茅山
    '大隐阁': { x: 600, y: 220, color: '#fbbf24' },      // 九华山
    '天书阁': { x: 580, y: 200, color: '#a78bfa' },      // 云台山
    '蓬莱派': { x: 700, y: 190, color: '#60a5fa' },      // 蓬莱仙岛
    // ===== 南疆（西南/南方）=====
    '衡山派': { x: 360, y: 380, color: '#22d3ee' },      // 衡山
    '丐帮': { x: 380, y: 360, color: '#fbbf24' },         // 岳阳
    '铁掌帮': { x: 370, y: 390, color: '#fbbf24' },      // 洞庭湖
    '百花谷': { x: 340, y: 410, color: '#f472b6' },      // 白鹿泽
    '五仙教': { x: 300, y: 460, color: '#a78bfa' },      // 大理
    '修罗宫': { x: 420, y: 440, color: '#ef4444' },      // 遵义
    '阎罗殿': { x: 400, y: 470, color: '#ef4444' },      // 雷公山
    // ===== 西漠（西北）=====
    '昆仑派': { x: 120, y: 280, color: '#60a5fa' },      // 昆仑山
    '金刚宗': { x: 90, y: 320, color: '#fbbf24' },       // 吐蕃
    '天龙教': { x: 140, y: 220, color: '#ef4444' },      // 大漠深处
    '烈日教': { x: 80, y: 200, color: '#ef4444' },       // 西北边陲
    // ===== 北冥（北方/天山）=====
    '天山派': { x: 180, y: 120, color: '#60a5fa' },      // 天山
    '逍遥派': { x: 200, y: 100, color: '#22d3ee' },      // 天山缥缈峰
    '血手门': { x: 300, y: 140, color: '#ef4444' },      // 关外
    // ===== 蜀地（四川）=====
    '青城派': { x: 210, y: 400, color: '#34d399' },      // 青城山
    '峨眉派': { x: 180, y: 370, color: '#f472b6' },      // 峨眉山
    '唐门': { x: 250, y: 390, color: '#a78bfa' },         // 蜀中
    // ===== 东南海域=====
    '铸剑山庄': { x: 730, y: 380, color: '#fbbf24' },    // 浙江龙泉
    '飞蝎坞': { x: 660, y: 460, color: '#ef4444' }       // 江南水乡
};

// 按地区分组的门派列表（用于侧边栏门派视图）
const sectsByRegion = {};
Object.keys(mapData).forEach(region => { sectsByRegion[region] = []; });
Object.entries(sectsData).forEach(([name, data]) => {
    if (sectsByRegion[data.location]) {
        sectsByRegion[data.location].push(name);
    }
});

// ==================== 访问权限配置（P0-三层访问体系） ====================

// 访问等级
const SECT_ACCESS_LEVEL = {
    TOURIST: 0,      // 游客/过客-可进入山门、外院
    VISITOR: 1,      // 访客/盟友-可进入部分内院
    DISCIPLE: 2,     // 杂役/外门弟子-可进入内院
    INNER: 3,        // 内门弟子-可进入核心区域
    ELDER: 4,        // 长老/掌门-全部区域
    ALL: 99
};

// 设施访问权限表
const SECT_FACILITY_ACCESS = {
    // 公共区域 - 游客可访问
    'sect_bulletin': { minAccess: 0, name: '📋 公告栏', desc: '查看门派告示与公告', area: 'outer', icon: '📋' },
    'sect_market': { minAccess: 0, name: '🏪 坊市', desc: '与门派弟子交易物资', area: 'outer', icon: '🏪' },
    'sect_public_task': { minAccess: 0, name: '📜 任务堂', desc: '接取门派发布的公共任务', area: 'outer', icon: '📜' },
    // 内院 - 弟子可访问
    'sect_training_ground': { minAccess: 2, name: '⚔️ 演武场', desc: '练习武艺，提升战斗技能', area: 'inner', icon: '⚔️' },
    'sect_cave': { minAccess: 2, name: '🧘 修炼洞府', desc: '静心修炼，恢复真气', area: 'inner', icon: '🧘' },
    'sect_medical': { minAccess: 2, name: '💊 医馆', desc: '治疗伤势，恢复部位耐久', area: 'inner', icon: '💊' },
    'sect_chat': { minAccess: 2, name: '🏛️ 议事厅', desc: '与其他弟子交流，获取情报', area: 'inner', icon: '🏛️' },
    // 核心区域 - 内门弟子+
    'sect_library': { minAccess: 3, name: '📚 藏经阁', desc: '查阅功法，提升修炼领悟', area: 'inner', icon: '📚' },
    'sect_armory': { minAccess: 3, name: '🗡️ 兵器库', desc: '领取门派装备和材料', area: 'inner', icon: '🗡️' },
    'sect_leader': { minAccess: 4, name: '👑 掌门大殿', desc: '拜见掌门，处理门派事务', area: 'core', icon: '👑' }
};

// 获取玩家对门派访问等级
function getSectAccessLevel(sectName) {
    var ds = (typeof window.discipleState !== 'undefined') ? window.discipleState : { isInSect: false };
    if (!ds.isInSect || ds.sectId !== sectName) return SECT_ACCESS_LEVEL.TOURIST;
    var rank = (typeof ds.rank !== 'undefined') ? ds.rank : 7;
    if (rank <= 2) return SECT_ACCESS_LEVEL.ELDER;   // 掌门/长老
    if (rank <= 4) return SECT_ACCESS_LEVEL.INNER;    // 内门/亲传
    return SECT_ACCESS_LEVEL.DISCIPLE;                 // 外门/杂役
}

// 判断设施是否可访问
function canAccessFacility(facilityId) {
    var access = SECT_FACILITY_ACCESS[facilityId];
    if (!access) return false;
    var ds = (typeof window.discipleState !== 'undefined') ? window.discipleState : { isInSect: false };
    if (!ds.isInSect) return access.minAccess <= 0; // 游客只能访问公共设施
    var lvl = getSectAccessLevel(ds.sectId);
    return access.minAccess <= lvl;
}

// ==================== 导出到 window 对象 ====================
window.sectsData = sectsData;
window.sectPositions = sectPositions;
window.sectsByRegion = sectsByRegion;
window.SECT_ACCESS_LEVEL = SECT_ACCESS_LEVEL;
window.SECT_FACILITY_ACCESS = SECT_FACILITY_ACCESS;
window.getSectAccessLevel = getSectAccessLevel;
window.canAccessFacility = canAccessFacility;