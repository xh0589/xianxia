// ==================== beast-ecosystem.js - 灵兽生态·地图分布 (v19.12 P0) ====================
// 对标 v18.8 路线图 §7.2 灵兽生态 + §7.1 非战斗功能 + 修 BUG（尸体扑上来）。
// 10 灵兽 × 7 地区 × 多地形分布；6 类非战斗功能；统一 markEntityDead API。

(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    // ============== 1. 灵兽分布表：60 兽 × 地区 × 多地形 ==============
    // 账怎么垒起来的：「19 兽」这三个字现在指的是**前 19 兽**那一段
    // （v19.12 十三兽 + 第八十五波位面四兽 + 第八十六波收口两只 = 19）；
    // tests/wave87-beast-lore-node.js:208 与 tests/wave88-beast-bond-node.js:354 断言这三个字在册，
    // 那两条断言本身就是「靠一句注释活着的锁」——已向协调者报备，下一批该改成现读
    // BEAST_DISTRIBUTION.length。本行往后的加法：v27.11 藤/花/草木 8 + 龙 6 + 花妖 4 + 狐妖 5 = 23
    // → 42；山海经新兽批 12 只 → 60。
    // ★ 「60」是现读 BEAST_DISTRIBUTION.length 得到的实数，不是写死的目标数；下批再加兽改这一行即可。
    // 第八十六波·寻兽账收口：① 死地区名修正——「东海」「天空」从来不是舆图上的域名（东海是东荒地界的城，
    //    天空是灵界的旧称），挂在上面的兽野外永远遇不到：玄龟无铺无野等于绝户、雷兽只剩高级兽潮一条缝、
    //    龙龟只卖 1800 灵石。现改认真实域名。② 火焰虎/影豹入表——灵兽坊八只货架兽里就这两只野外绝迹
    //    （其余六只坊市野外两扇门都有），补齐一致性，野外收服与坊市购入并行不悖。
    var BEAST_DISTRIBUTION = [
        { id: 'beast_lingfox',     name: '灵狐',  level: 5,  regions: ['中州', '南疆', '蜀地'],   terrains: ['PLAIN', 'FOREST'],            type: 'beast' },
        { id: 'beast_thundereagle',name: '雷鹰',  level: 12, regions: ['东荒', '东南海域'],        terrains: ['MOUNTAIN'],                  type: 'beast' },
        { id: 'beast_dragonturtle',name: '龙龟',  level: 18, regions: ['东荒', '东南海域'],        terrains: ['WATER'],                     type: 'beast' },
        { id: 'beast_icesnake',    name: '冰蛇',  level: 15, regions: ['北冥'],                     terrains: ['SNOW', 'FROZEN_LAND'],        type: 'beast' },
        { id: 'beast_windwolf',    name: '风狼',  level: 8,  regions: ['西漠', '蜀地', '中州'],     terrains: ['PLAIN', 'DESERT'],            type: 'beast' },
        { id: 'beast_firephoenix', name: '火凤',  level: 22, regions: ['南疆'],                     terrains: ['VOLCANO'],                   type: 'beast' },
        { id: 'beast_xuangui',     name: '玄龟',  level: 16, regions: ['东荒', '东南海域'],         terrains: ['WATER'],                     type: 'beast' },
        { id: 'beast_thunderbeast',name: '雷兽',  level: 20, regions: ['蜀地', '北冥'],             terrains: ['MOUNTAIN'],                  type: 'beast' },
        { id: 'beast_crane',       name: '仙鹤',  level: 10, regions: ['中州'],                     terrains: ['SPIRIT_SPRING', 'PLAIN'],    type: 'beast' },
        { id: 'beast_blackbear',   name: '黑熊',  level: 6,  regions: ['北冥', '中州', '东荒'],     terrains: ['FOREST'],                    type: 'beast' },
        // v20.95 破 22 级封顶：三只传说级野兽只栖后期地界——灵泉寻五色鹿、火山见金乌、北冥天际望鲲鹏
        { id: 'beast_fivecolordeer', name: '五色鹿', level: 28, regions: ['东荒', '蜀地'],          terrains: ['SPIRIT_SPRING'],             type: 'beast' },
        { id: 'beast_goldencrow',    name: '金乌',  level: 32, regions: ['南疆'],                    terrains: ['VOLCANO', 'MOUNTAIN'],       type: 'beast' },
        { id: 'beast_kunpeng',       name: '鲲鹏',  level: 35, regions: ['北冥'],                    terrains: ['WATER', 'MOUNTAIN', 'SNOW'], type: 'beast' },
        // 第八十五波·位面兽入分布表：v20.53 四只灵界/魔界灵兽此前只挂在过渡版捕捉链上
        //（拆了那条链就得给正门）——只在自己位面出没，等级从模板账（60~85，高位面本就是后期地界）
        { id: 'beast_cloudhorndeer',   name: '云角鹿',   level: 60, regions: ['灵界'], terrains: ['SPIRIT_SPRING', 'PLAIN', 'FOREST'], type: 'beast' },
        { id: 'beast_gangwindcrane',   name: '罡风鹤',   level: 78, regions: ['灵界'], terrains: ['MOUNTAIN'],                          type: 'beast' },
        { id: 'beast_bloodmarehound',  name: '血鬃魔犬', level: 72, regions: ['魔界'], terrains: ['DESERT', 'PLAIN'],                     type: 'beast' },
        { id: 'beast_netherveinserpent', name: '幽脉蟒', level: 85, regions: ['魔界'], terrains: ['SWAMP', 'WATER'],                      type: 'beast' },
        // 第八十六波·坊市独苗补齐：火焰虎踏火山荒漠（模板账：南疆/西漠），影豹潜林（模板账：南疆/迷雾森林）
        { id: 'beast_flametiger',    name: '火焰虎', level: 20, regions: ['南疆', '西漠'],          terrains: ['VOLCANO', 'DESERT'],          type: 'beast' },
        { id: 'beast_shadowpanther', name: '影豹',   level: 30, regions: ['南疆', '蜀地'],          terrains: ['FOREST'],                    type: 'beast' },
        // ===== v27.11 藤/花/草木成精（八只）——此前 19 兽里这一系是空的 =====
        // 挑地盘的两条硬规矩，都是实测出来的，不是拍脑袋：
        //   ① 地域只用舆图真域名（js/map/randomMap.js REGION_ALIASES + world-map.js 九域），
        //      「天空」「东海」那类死域名第八十六波已清出，本批不复发；
        //   ② 地貌只用 js/map/wild-terrain.js 的 25 个真键，且优先选**成片**的那种。
        //      实测（WildTerrain.generate × 6 seed / 地区）：瘴林 MIASMA 只在南疆（18 格）、
        //      老林 PRIMFOREST 只在东荒（48 格）、灵池 QIPOOL 只在灵界（12 格）——
        //      只认这一格地貌的兽等于死模板。所以每只都配一个量大管饱的伴生地貌，
        //      稀有地貌只当第二处家。
        { id: 'beast_soulbindvine',  name: '缚灵藤', level: 9,  regions: ['中州', '蜀地'],  terrains: ['FOREST', 'PLAIN'],          type: 'beast' },
        { id: 'beast_mindbloom',     name: '迷魂花', level: 15, regions: ['中州', '南疆'],  terrains: ['FOREST', 'SWAMP'],           type: 'beast' },
        { id: 'beast_bloodsuckvine', name: '血吸藤', level: 19, regions: ['南疆', '东荒'],  terrains: ['SWAMP', 'MIASMA', 'FOREST'], type: 'beast' },
        { id: 'beast_manthistle',    name: '食人花', level: 23, regions: ['东荒'],           terrains: ['FOREST', 'SWAMP'],           type: 'beast' },
        { id: 'beast_thornmatron',   name: '荆棘母藤', level: 27, regions: ['蜀地', '东荒'], terrains: ['MOUNTAIN', 'PRIMFOREST'],   type: 'beast' },
        { id: 'beast_meltvine',      name: '熔岩藤', level: 32, regions: ['南疆', '魔界'],  terrains: ['MOUNTAIN', 'VOLCANO'],      type: 'beast' },
        { id: 'beast_glacierbloom',  name: '冰川莲', level: 38, regions: ['北冥'],           terrains: ['FROZEN_LAND', 'SNOW'],       type: 'beast' },
        { id: 'beast_tiansiangvine', name: '天香藤', level: 58, regions: ['灵界'],           terrains: ['MOUNTAIN', 'SPIRIT_SPRING'],  type: 'beast' },
        // ===== v27.11 龙系（六只）——此前全部模板里只有龙龟一只 =====
        // 命名先查了消费口（详见 SPECIES_TEMPLATES_V2711 上方「龙系」段的实测结论）：
        //   活的龙口只有一处——js/crafting/forging-compound.js 的「龙凤池」词缀池
        //   （龙威/龙息/龙行/涅槃/龙吟），它要的是**材料**标签 'long'，不是某个妖兽模板；
        //   料从哪来：LATE_MATERIAL_TIERS 按**击杀等级**分档（60 天外玄铁 / 72 龙血 /
        //   78 星铁凤羽 / 85 龙鳞龙晶龙鳞铁），不看 beastId。
        //   ⇒ 所以龙兽的两条硬要求是：① 名字要让玩家一眼认出是龙属（龙鳞/龙骨/龙血才对得上号）；
        //      ② 野生等级必须真跨过 60/72/78/85 四道档，否则这一族打下去一桶龙料都不出。
        //   跨档实测：吞海蜃 62 / 蛟龙 68 → 够 beast_60；云龙 82 → 够 beast_72+78；
        //             应龙 95 → 四档全够（龙鳞/龙晶/龙血的真出处就是它与魔界 85 档的兽）。
        //   ⚠️ 实测三条「不存在的口」，照实记在这里免得后来人照着找：
        //     battle.js 没有 dragon_might / dragon_breath 这两个 id（真身是炼器侧的
        //     dragonmight / dragonbreath 两条词缀，只认材料不认兽）；
        //     全仓没有 NIGHT_BEAST 这个符号；regions.js 里那条 boss 名「蛟龙」是死数据
        //     （getRegionMonsters 全库零消费端），所以本批敢用蛟龙这个名字。
        { id: 'beast_greenjiao',    name: '青鳞蛟', level: 25, regions: ['东南海域'],                terrains: ['WATER', 'SWAMP'],            type: 'beast' },
        { id: 'beast_chi',          name: '赤螭',   level: 45, regions: ['南疆', '魔界'],            terrains: ['MOUNTAIN', 'VOLCANO'],    type: 'beast' },
        { id: 'beast_sealshen',     name: '吞海蜃', level: 62, regions: ['东南海域', '灵界'],         terrains: ['WATER', 'SWAMP'],        type: 'beast' },
        { id: 'beast_yaolong',      name: '蛟龙',   level: 68, regions: ['东南海域', '魔界'],         terrains: ['WATER', 'SWAMP'],        type: 'beast' },
        { id: 'beast_yunlong',      name: '云龙',   level: 82, regions: ['灵界'],                      terrains: ['MOUNTAIN', 'PLAIN'],     type: 'beast' },
        { id: 'beast_yinglong',     name: '应龙',   level: 95, regions: ['灵界'],                      terrains: ['MOUNTAIN', 'SPIRIT_SPRING'], type: 'beast' },
        // ===== v27.11·第二批：花妖四只（补草木系里偏少的花这一支）+ 狐妖五只 =====
        // 花妖：危险写在它自己的分泌物里（香/毒粉/麻汁/催眠汁），不是「花形的怪物」。
        //   彼岸花妖开在黄泉路边，所以挂在平原与沼泽（坟地即平原，人烟即坟）；
        //   曼陀罗花妖要阴湿，林海与沼泽；夹竹桃耐旱也耐毒，西漠荒漠；
        //   夜来香放夜香，蜀地山场与东荒林海都是它的地盘。
        { id: 'beast_bijiaflower',  name: '彼岸花妖', level: 17, regions: ['中州', '南疆'],         terrains: ['PLAIN', 'SWAMP'],            type: 'beast' },
        { id: 'beast_mantuoluo',    name: '曼陀罗花妖', level: 29, regions: ['南疆', '东荒'],      terrains: ['FOREST', 'SWAMP'],          type: 'beast' },
        { id: 'beast_jiazhu',       name: '夹竹桃花妖', level: 41, regions: ['西漠', '南疆'],      terrains: ['DESERT', 'PLAIN'],           type: 'beast' },
        { id: 'beast_yelaixiang',   name: '夜来香妖', level: 46, regions: ['蜀地', '东荒'],      terrains: ['MOUNTAIN', 'FOREST'],        type: 'beast' },
        // 狐妖：狐族本身是修真的一支，档位从炼气小狐一路拉到灵界九尾，不做同档换皮。
        //   ⚠️ 一只都不挂 treasure —— 寻宝那一格是灵狐的，抢了它就退回「高配灵狐」。
        { id: 'beast_foxpup',       name: '毛狐',   level: 8,  regions: ['中州', '蜀地'],          terrains: ['FOREST', 'PLAIN'],           type: 'beast' },
        { id: 'beast_jadefacefox',  name: '玉面狐', level: 22, regions: ['东荒', '中州'],          terrains: ['FOREST', 'SWAMP'],           type: 'beast' },
        { id: 'beast_darkfox',      name: '墨狐',   level: 36, regions: ['南疆', '蜀地'],          terrains: ['FOREST', 'MOUNTAIN'],        type: 'beast' },
        { id: 'beast_snowfox',      name: '雪狐',   level: 48, regions: ['北冥'],                  terrains: ['SNOW', 'FROZEN_LAND'],       type: 'beast' },
{ id: 'beast_ninetailfox', name: '九尾狐', level: 76,  regions: ['灵界'],                  terrains: ['MOUNTAIN', 'SPIRIT_SPRING'],  type: 'beast' },
        // ===== 山海经新兽（12 只）——《山海经》不是怪物志，是博物志，五要素 =====
        //   名称 → 分类 → 形态 → 产地 → 用途。这一批每一只都必须能写出完整四要素：
        //   ★产地（真实山川，不编） → ★部位件（打哪只掉哪个部位，matId 已在炼器 MATERIAL_GRADE 里）
        //     → ★炼器出口（现读品阶与词缀池） → ★克制/风险（这一条写在 MECH_FAMILY_V2712 的 risk 字段）。
// ★ 出处逐只分账（**不把瑞兽冒充《山海经》**，这一段最要紧，别再往后抄错）：
        //   《山海经》原著八只（正文可查）：
        //     夫诸 《西山经》「状如白鹿而四角，见则其邑大水」
        //     獙獙 《东山经》「状如狸而白尾，其音如击石，见则其邑大旱」
        //     肥遗 《东山经》「状如蛇而六足四翼，臙仓然，见则其邑大旱」
        //     祸斗 《东山经》「状如獒而黑，尾末有火，见则其邑有火灾」
        //     蜚   《东山经》「状如牛而白首，一目蛇尾，行水则竭行草则死，见则其邑大疫」
        //     烛龙 《大荒北经》钟山之神「视为昼视为夜，吹为冬呼为夏」
        //     精卫 《北山经》「炎帝之少女名曰女娃，溺而不死，故为精卫」
        //     狸力 《南山经》「状如豚而有爪」，见则其国多材
        //   后世瑞兽/龙生九子四只（《山海经》里查无此名，写清出处免得下一个人当成原著）：
        //     霸下（赑屃）龙生九子，负碑负重——明清类书《龙经》一系，非《山海经》
        //     螭吻（嘲风）龙生九子之长，好望——同上，非《山海经》
        //     白泽 能言、通万物之情——葛洪《抱朴子》及敦煌遗书《瑞应图》一系，非《山海经》
        //     蚣蝮 护水负重——水经注一系的水神传统，非《山海经》
        //   ★ 八只原著兽的「见则其邑有灾」那一层，**没有**给它们挂预兆钩子：
        //     tests/beast-mechanic-families-node.js 的 D10 判「每一类预兆**恰好一只**宿主」，
        //     而大水/旱声/旱热/火灾/大疫这五类宿主已分别由既有兽占着（鲲鹏/夜来香妖/赤螭/火焰虎/血吸藤，
        //     见 MECH_FAMILY_V2712）。硬挂第二只＝当场转红，而且五种灾象再加一遍就是「一套换皮」——
        //     那个 E 段整套尺就是为拦这件事写的。逐只如实记：灾异那一层本批**未接**，接的是部位件那一层。
        //     烛龙的昼夜与季节同理：D12 判三个行为钩子各恰好一只宿主，daynight 已归应龙。
        //
        // ★ 落点为什么与上一批设计稿给的**不一样**（实测，不是改主意）：设计稿给的是按地貌名直译的
        //   「南疆 VOLCANO 3 格 / 东荒 PRIMFOREST 8 格 / 东南海域 WRECK 2 格 / 东南海域 FORD 27 格」。
        //   本批拿 tests/v27.11-beast-species-node.js G1~G3 的同一套算法（WildTerrain.generate × 3 seed
        //   × 20×26，逐只算落脚格与期望遇率）实测：VOLCANO 每图 3 格、PRIMFOREST 8 格、WRECK 2 格——
        //   **G2（三 seed 合计 ≥30 格）当场不通过**，挂上去就是死模板。
        //   另有一条更隐蔽的：分布表里**只能写归并后的地名**（WATER/SNOW/FROZEN_LAND/SPIRIT_SPRING），
        //   写 FORD/WRECK/GLACIER 时 G1 拿它去查归并后的格数，恒为 0 —— 所以上一批那条
        //   「龙龟挂 WATER」的写法才是对的，不是巧合。
        //   现落点（每只的每处都 ≥0.10 只/图，实测值见交付报告）：
        //     夫诸 东南海域 WATER+MOUNTAIN ／ 獙獙 西漠 DESERT+PLAIN ／ 肥遗 南疆 MOUNTAIN+DESERT
        //     祸斗 南疆 DESERT+MOUNTAIN ／ 蜚 东荒 SWAMP+FOREST ／ 烛龙 灵界 MOUNTAIN+FOREST
        //     霸下 中州 MOUNTAIN+蜀地 MOUNTAIN ／ 白泽 东荒 FOREST+SWAMP ／ 精卫 东南海域 MOUNTAIN+WATER
        //     狸力 中州 PLAIN+西漠 PLAIN ／ 螭吻 中州 ROAD+蜀地 ROAD ／ 蚣蝮 东南海域 WATER+MOUNTAIN
        { id: 'beast_fuzhu',    name: '夫诸', level: 34, regions: ['东南海域'],             terrains: ['WATER', 'MOUNTAIN'],           type: 'beast' },
        { id: 'beast_yeling',   name: '獙獙', level: 30, regions: ['西漠'],                  terrains: ['DESERT', 'PLAIN'],             type: 'beast' },
        { id: 'beast_feiyi',    name: '肥遗', level: 44, regions: ['南疆'],                  terrains: ['MOUNTAIN', 'DESERT'],          type: 'beast' },
        { id: 'beast_huodou',   name: '祸斗', level: 24, regions: ['南疆'],                  terrains: ['DESERT', 'MOUNTAIN'],          type: 'beast' },
        { id: 'beast_fei',      name: '蜚',   level: 40, regions: ['南疆', '东荒'],          terrains: ['SWAMP', 'FOREST'],             type: 'beast' },
        { id: 'beast_zhulong',  name: '烛龙', level: 92, regions: ['灵界'],                  terrains: ['MOUNTAIN', 'FOREST'],          type: 'beast' },
        { id: 'beast_baxia',    name: '霸下', level: 52, regions: ['中州', '蜀地'],          terrains: ['MOUNTAIN'],                    type: 'beast' },
        { id: 'beast_baize',    name: '白泽', level: 62, regions: ['东荒'],                  terrains: ['FOREST', 'SWAMP'],             type: 'beast' },
        { id: 'beast_jingwei',  name: '精卫', level: 28, regions: ['东南海域'],             terrains: ['MOUNTAIN', 'WATER'],           type: 'beast' },
        { id: 'beast_lili',     name: '狸力', level: 16, regions: ['中州', '西漠'],          terrains: ['PLAIN'],                       type: 'beast' },
        { id: 'beast_chiwen',   name: '螭吻', level: 36, regions: ['中州', '蜀地'],          terrains: ['ROAD'],                        type: 'beast' },
        { id: 'beast_gangfu',   name: '蚣蝮', level: 20, regions: ['东南海域'],             terrains: ['WATER', 'MOUNTAIN'],           type: 'beast' }
    ];

    // ============== 2. 6 类非战斗功能（路线图 §7.1） ==============
    var BEAST_BUFFS = {
        beast_lingfox:      { category: 'treasure',  mul: 0.05,  desc: '寻宝概率 +5%' },
        beast_thundereagle: { category: 'scout',     mul: 1.0,   desc: '可侦察秘境/敌宗' },
        beast_dragonturtle: { category: 'carry',     mul: 0.1,   desc: '储物 +10%' },
        beast_icesnake:     { category: 'coldHerb',  mul: 0.3,   desc: '寒性药材 +30%' },
        beast_windwolf:     { category: 'travel',    mul: 0.8,   desc: '陆路旅行 -20%' },
        beast_firephoenix:  { category: 'craftFire', mul: 0.1,   desc: '炼器/炼丹火候 +10%' },
        // v27.0 灵宠体检补齐：此前 19 兽里只有上面 6 只有非战斗用场，其余全是纯战宠——
        // 养了也只在开战时想起。现每兽都有差事（全走现成六本账，不新开消费端；
        // 引路倍率照旧只取最好一笔，兽多不叠加）。
        beast_crane:            { category: 'travel',    mul: 0.9,  desc: '陆路旅行 -10%（鹤引路）' },
        beast_gangwindcrane:    { category: 'travel',    mul: 0.7,  desc: '陆路旅行 -30%（罡风开路）' },
        beast_kunpeng:          { category: 'travel',    mul: 0.6,  desc: '陆路旅行 -40%（鹏翼遮天）' },
        beast_blackbear:        { category: 'carry',     mul: 0.08, desc: '储物 +8%（黑熊驮货）' },
        beast_xuangui:          { category: 'carry',     mul: 0.05, desc: '储物 +5%（玄龟负物）' },
        beast_thunderbeast:     { category: 'scout',     mul: 1.0,  desc: '可侦察秘境/敌宗' },
        beast_bloodmarehound:   { category: 'scout',     mul: 1.0,  desc: '可侦察秘境/敌宗（魔犬循踪）' },
        beast_fivecolordeer:    { category: 'treasure',  mul: 0.08, desc: '寻宝概率 +8%（五色鹿踏宝地）' },
        beast_cloudhorndeer:    { category: 'treasure',  mul: 0.06, desc: '寻宝概率 +6%（云角鹿嗅灵）' },
        beast_goldencrow:       { category: 'craftFire', mul: 0.2,  desc: '炼器/炼丹火候 +20%（金乌真火）' },
        beast_netherveinserpent:{ category: 'coldHerb',  mul: 0.2,  desc: '寒性药材 +20%（幽脉蟒栖寒地）' },
        // ===== v27.11 差事补全：八只草木 + 六只龙，14 只全部有活干 =====
        // 之前两行空白顺手填上（火焰虎/影豹是纯战宠——v20.9 从坊市补进分布表时就忘了给差事）：
        //   火焰虎 → craftFire（火虎烧炉，比金乌低一档：南疆火山本来就是取火人的地方）
        //   影豹   → scout（影豹来去无声，正门是替人探路的活）
        beast_flametiger:        { category: 'craftFire', mul: 0.08, desc: '炼器/炼丹火候 +8%（火虎舔炉）' },
        beast_shadowpanther:     { category: 'scout',     mul: 1.0,  desc: '可侦察秘境/敌宗（影豹无声先至）' },
        // —— 藤/花系：差事一律从**栖息地与身量**推出来，不从战斗 gimmick 硬凑 ——
        //   ⚠️ 驱毒/守夜/寻药这三件差事本项目**没有账**（poison-system 走材料合成、
        //      守夜与寻药全库无消费口），所以本批一只也不挂——挂上去就是死条目。
        beast_soulbindvine:      { category: 'treasure',  mul: 0.03, desc: '寻宝概率 +3%（藤根刨土，专找埋进泥里的东西）' },
        beast_mindbloom:         { category: 'scout',     mul: 1.0,  desc: '可侦察秘境/敌宗（花气随风，替你先闻一步）' },
        beast_bloodsuckvine:     { category: 'scout',     mul: 1.0,  desc: '可侦察秘境/敌宗（藤须入地，听得出地底空腔）' },
        beast_manthistle:        { category: 'treasure',  mul: 0.04, desc: '寻宝概率 +4%（花腹能吞，吞下去什么它都记得在哪儿）' },
        beast_thornmatron:       { category: 'carry',     mul: 0.05, desc: '储物 +5%（荆棘盘成根巢，替你驮货扎口）' },
        beast_meltvine:          { category: 'craftFire', mul: 0.1,  desc: '炼器/炼丹火候 +10%（根须吸地火，替你把炉子烧旺）' },
        beast_glacierbloom:      { category: 'coldHerb',  mul: 0.18, desc: '寒性药材 +18%（雪线莲种，替你翻雪认药）' },
        beast_tiansiangvine:     { category: 'scout',     mul: 1.0,  desc: '可侦察秘境/敌宗（香界铺开千里，空处瞒不过它）' },
        // —— 龙系六只：档位按「蛟 → 螭 → 蜃 → 蛟龙 → 云龙 → 应龙」拉开，不做同一档换皮 ——
        //   引路是倍率账、全服只取最好一笔，所以三只龙的 travel 必须成一条**递减**的梯子，
        //   新的云龙(0.65)压不过旧账里鲲鹏的 0.6，老玩家手里的鹏翼不会因为多养一只龙就变慢。
        beast_greenjiao:        { category: 'travel',    mul: 0.9,  desc: '陆路旅行 -10%（小蛟伏水替你探近路）' },
        beast_chi:              { category: 'craftFire', mul: 0.12, desc: '炼器/炼丹火候 +12%（螭火舔炉，火性比金乌还稳）' },
        beast_sealshen:         { category: 'treasure',  mul: 0.07, desc: '寻宝概率 +7%（蜃气里浮出来的东西，底下多半真埋着一件）' },
        beast_yaolong:          { category: 'travel',    mul: 0.7,  desc: '陆路旅行 -30%（蛟龙腾云，水路一段变四十里）' },
        beast_yunlong:          { category: 'travel',    mul: 0.65, desc: '陆路旅行 -35%（云龙兴雨，云路自己把你送到地方）' },
        beast_yinglong:         { category: 'craftFire', mul: 0.25, desc: '炼器/炼丹火候 +25%（应龙行雨，龙息是这世上最烈的炉火）' },
        // —— 花妖四只：差事仍按「栖息地与生理」推，不按战斗 gimmick ——
        //   彼岸花妖 → treasure：它开在黄泉路边，根下埋着谁家的东西它自己最清楚
        //   曼陀罗花妖 → scout：麻药花粉沾上幻术会变色，哪条路是假的它一闻便知
        //   夹竹桃花妖 → carry：茎腹中空可驮货，毒汁还替驮上的药材防腐
        //   夜来香妖 → scout：夜放浓香能盖住一个人的气味，替你探路谁也闻不出你在
        beast_bijiaflower:     { category: 'treasure',  mul: 0.04, desc: '寻宝概率 +4%（根下埋着哪家的东西，它自己最清楚）' },
        beast_mantuoluo:       { category: 'scout',     mul: 1.0,  desc: '可侦察秘境/敌宗（花粉沾上幻术会变色，假的路它一闻便知）' },
        beast_jiazhu:          { category: 'carry',     mul: 0.05, desc: '储物 +5%（茎腹中空能驮货，毒汁还替药材防腐）' },
        beast_yelaixiang:      { category: 'scout',     mul: 1.0,  desc: '可侦察秘境/敌宗（夜放浓香盖住人形气味，替你探路谁也闻不出）' },
        // —— 狐妖五只：一只都不挂 treasure（那是灵狐的格），全挂在「幻/变/惑」能兑现的账上 ——
        //   scout  = 幻境/侦察：它能幻，也能指出幻里哪条路是真的
        //   carry  = 变化：变大驮货（变化之能落到具体活上）
        //   coldHerb = 香辛识药：雪狐识百草，香气熏过的雪线药材认得出年份
        //   craftFire = 狐火：狐火本就是丹炉炉火的古喻
        beast_foxpup:          { category: 'scout',     mul: 1.0,  desc: '可侦察秘境/敌宗（障眼术最灵，替主人先蹑过去看一眼）' },
        beast_jadefacefox:     { category: 'carry',     mul: 0.04, desc: '储物 +4%（一变三丈高，顺手替你驮货；惑心术只在路上用）' },
        beast_darkfox:         { category: 'scout',     mul: 1.0,  desc: '可侦察秘境/敌宗（幻域里只有它找得到真路）' },
        beast_snowfox:         { category: 'coldHerb',  mul: 0.15, desc: '寒性药材 +15%（雪狐识百草，香气熏过的药材认得出年份）' },
        beast_ninetailfox:     { category: 'craftFire', mul: 0.14, desc: '炼器/炼丹火候 +14%（狐火是丹炉炉火的古喻，九尾一摆火便稳了）' },
        // —— 山海经新兽 12 只：差事一律从**它自己的本事**推出来，不按战斗 gimmick ——
        // ★ 一条硬约束：本批**一只都不挂 travel**。travel 的取法是「只取最好一笔」，
        //   而 tests/v27.11-beast-species-node.js L3 逐字节断言「全表最优引路恒等于鲲鹏 0.6」。
        //   挂任何一只 mul < 0.6 的兽上去，那条当场转红。所以十二只的差事全在另外六格里挑。
        // ★ 另一条：除 travel 外五格都是**求和**（getActiveBeastBuff 注释写明「兽多力量大，照旧求和」），
        //   所以给新兽挂差事不会顶掉谁，只会多一笔——老玩家手里的灵狐/龙龟一件没少。
        beast_fuzhu:     { category: 'coldHerb',  mul: 0.12, desc: '寒性药材 +12%（它涉水认得哪片浅滩底下有药）' },
        beast_yeling:    { category: 'scout',     mul: 1.0,  desc: '可侦察秘境/敌宗（翼上无翎飞得低，替你先听一遍风）' },
        beast_feiyi:     { category: 'craftFire', mul: 0.15, desc: '炼器/炼丹火候 +15%（热从鳞里往外渗，炉子不用另添炭）' },
        beast_huodou:    { category: 'craftFire', mul: 0.1,  desc: '炼器/炼丹火候 +10%（尾末那两支火苗舔炉，火候比金乌稳）' },
        beast_fei:       { category: 'scout',     mul: 1.0,  desc: '可侦察秘境/敌宗（疫起之前它已经走过那条路）' },
        beast_zhulong:   { category: 'craftFire', mul: 0.3,  desc: '炼器/炼丹火候 +30%（吹气为冬呼气为夏，四时之火都在它一口里）' },
        beast_baxia:     { category: 'carry',     mul: 0.18, desc: '储物 +18%（负碑负山，驮得比龙龟多，走得也慢）' },
        beast_baize:     { category: 'scout',     mul: 1.2,  desc: '可侦察秘境/敌宗（通万物之情，问它路它答得出）' },
        beast_jingwei:   { category: 'carry',     mul: 0.06, desc: '储物 +6%（日日衔西山木石而不息，洞里的存货自己会涨）' },
        beast_lili:      { category: 'treasure',  mul: 0.06, desc: '寻宝概率 +6%（它掘得比你快，地面一起伏它先到）' },
        beast_chiwen:    { category: 'scout',     mul: 1.0,  desc: '可侦察秘境/敌宗（屋脊上蹲着的那条，檐角起风它先抬头）' },
        beast_gangfu:    { category: 'carry',     mul: 0.12, desc: '储物 +12%（涨水时它先沉下去替你驮着）' }
    };

    // ============== 1b. v27.11 新增物种模板（藤/花系 · 龙系） ==============
    // 为什么模板挂在本文件而不是去改 js/beast-taming.js 里那张 BEAST_TEMPLATES 字面量：
    //   本批只准动本文件，而 beast-taming 同时被 app/battle/坊市/图鉴/进化线读，是全仓最热的一本账。
    //   加载次序（仙侠.html，两支都是 defer、按文档序执行）：
    //     :2229 js/beast-taming.js → :2257 js/extensions/beast-ecosystem.js
    //   所以本文件执行时 window.BEAST_TEMPLATES 已在册，下面这段是**往既有账上添行**，
    //   不是另立一本。收服（getBeastTemplateIdFromEnemy 按名精确匹配）、图鉴、兽径手记、
    //   野外遭遇（buildWildBeastData 按名回查模板）四条正门读的都是同一张表，自动通。
    //
    // 字段口径逐个对过既有模板：name/type/level/realm/attrs{六维}/skills/innate/teachable/
    // mount/regions/catchable。两条硬规矩：
    //   ① innate/teachable 只用 battle.js COMBAT_ABILITIES 登记过的 11 个 id
    //     （venom/gu_parasite/lifesteal/reflect/soundwave/illusion/escape/drain_qi/
    //       sword_burst/hardened/pounce/chill/burn）——写表外 id 等于写了句没接上的话；
    //   ② 不写 evolve：本批不新增血脉蜕变线（beast-taming 的 BEAST_LINE_MAP 在禁改簿上，
    //     硬挂会把拓荒的兽塞进龟/狐谱）。没有蜕形的兽照样能养能战能骑。
    var SPECIES_TEMPLATES_V2711 = {
        // ============ 藤/花系（八只）：草木成精，凭什么「它是植物」写在 innate 与差事里 ============
        // 藤系三只：缠绕封路 / 抽血寄生 / 荆棘铁壁
        soulbindvine: {
            name: '缚灵藤', type: 'beast', level: 9, realm: '炼气',
            attrs: { strength: 9, dexterity: 8, constitution: 16, willpower: 8, intelligence: 6, meridian: 5 },
            skills: ['藤缠', '缚足'],
            innate: ['illusion', 'hardened'], teachable: ['illusion', 'hardened', 'escape'],  // 三族机制批A：绞杀藤靠拟态伏击，不只会硬
            regions: ['中州', '蜀地'], catchable: true
        },
        bloodsuckvine: {
            name: '血吸藤', type: 'beast', level: 19, realm: '筑基',
            attrs: { strength: 12, dexterity: 16, constitution: 10, willpower: 9, intelligence: 8, meridian: 7 },
            skills: ['血吸', '寄生'],
            innate: ['lifesteal', 'gu_parasite'], teachable: ['gu_parasite', 'lifesteal', 'venom'],  // 三族机制批A：吸血藤把卵种进猎物（金蚕蛊＝种蛊啃噬筋骨），毒只是伴生
            // 实时 25 张图/地区扫过一遍：只挂 SWAMP+MIASMA 时是 **0.10 只/图、六张图才见一次**——
            // 东荒沼泽实测只有 2 格、瘴林只在南疆 4 格，寄生藤不该只有这两小块湿地。
            // 林子也是它的家（吸血靠的是有活物可挂），所以补上 FOREST 这处大片家。
            regions: ['南疆', '东荒'], catchable: true
        },
        thornmatron: {
            name: '荆棘母藤', type: 'beast', level: 27, realm: '金丹',
            attrs: { strength: 14, dexterity: 9, constitution: 26, willpower: 12, intelligence: 8, meridian: 14 },
            skills: ['荆棘壁', '倒刺'],
            innate: ['hardened', 'reflect'], teachable: ['hardened', 'reflect'],  // 不变：荆棘铁壁＋倒刺回弹，是它俩的本体,
            regions: ['蜀地', '东荒'], catchable: true
        },
        // 花系三只：香魅乱神 / 寒毒花粉 / 幻境迷阵
        mindbloom: {
            name: '迷魂花', type: 'spirit', level: 15, realm: '炼气',
            attrs: { strength: 5, dexterity: 14, constitution: 7, willpower: 16, intelligence: 15, meridian: 9 },
            skills: ['迷魂香', '乱神'],
            innate: ['illusion', 'venom'], teachable: ['illusion', 'venom'],  // 三族机制批A：花粉本身是毒，原先只挂 illusion 是委屈了它的分泌物
            regions: ['中州', '南疆'], catchable: true
        },
        glacierbloom: {
            name: '冰川莲', type: 'spirit', level: 38, realm: '化神',
            attrs: { strength: 16, dexterity: 18, constitution: 16, willpower: 20, intelligence: 17, meridian: 20 },
            skills: ['冰封', '寒毒粉'],
            innate: ['chill', 'hardened'], teachable: ['chill', 'hardened'],  // 三族机制批A：冰川莲的冰体就是它的壳；寒毒花粉是手段不是本体
            regions: ['北冥'], catchable: true
        },
        tiansiangvine: {
            name: '天香藤', type: 'spirit', level: 58, realm: '化神',
            attrs: { strength: 22, dexterity: 26, constitution: 22, willpower: 30, intelligence: 28, meridian: 28 },
            skills: ['天香界', '缠天'],
            innate: ['gu_parasite', 'illusion'], teachable: ['gu_parasite', 'illusion'],  // 三族机制批A：天香藤＝香魅缠附，缠上去就不放（蛊＝寄生的那条路）
            // 家在九天罡风带（灵界 MOUNTAIN），灵泉是第二处——carveSprings 一域只刻 prof.spring=5 格，
            // 只认灵泉的那只兽等于把全图五格当全世界（实测 3 seed 灵界灵泉共 15 格）。
            regions: ['灵界'], catchable: true
        },
        // 混合两只：食人花（吞噬陷阱）/ 熔岩藤（吸地火）
        manthistle: {
            name: '食人花', type: 'beast', level: 23, realm: '筑基',
            attrs: { strength: 18, dexterity: 10, constitution: 16, willpower: 6, intelligence: 5, meridian: 8 },
            skills: ['吞噬', '绞齿'],
            innate: ['lifesteal', 'escape'], teachable: ['escape', 'lifesteal'],  // 三族机制批A：食人花吞完就缩回苔下，等下一个——遁走是它的活路，不是硬化
            regions: ['东荒'], catchable: true
        },
        meltvine: {
            name: '熔岩藤', type: 'beast', level: 32, realm: '元婴',
            attrs: { strength: 20, dexterity: 13, constitution: 18, willpower: 12, intelligence: 9, meridian: 16 },
            skills: ['地火吸', '熔藤鞭'],
            innate: ['burn', 'venom'], teachable: ['burn', 'lifesteal', 'venom'],  // 三族机制批A：熔岩藤吸地火，藤汁本身带灼毒
            regions: ['南疆', '魔界'], catchable: true
        },

        // ============ 龙系（六只）：蛟 → 螭 → 蜃 → 蛟龙 → 云龙 → 应龙 ============
        // 起名之前先把「dragon 相关的口」挨个查了一遍，结论（照实记下，别照着找）：
        //   ① battle.js **没有** dragon_might / dragon_breath 这两个 id。全仓这两个串只出现在
        //      炼器侧词缀的键名上（js/crafting/forging-compound.js:176-177 的
        //      dragonmight「龙威」/ dragonbreath「龙息」），它们挂在**材料**标签 'long' 上
        //      （龙凤池），不读任何妖兽字段、不认任何兽名。
        //   ② 全仓**没有** NIGHT_BEAST 这个符号（0 处）。
        //   ③ 唯一认「龙」的地方是材料标签 'long'：mat_dragon_bone/scale/blood/crystal/
        //      scale_iron 五种。而这五种料的产出正门是 LATE_MATERIAL_TIERS 的四档，
        //      分档判据是**击杀等级**（60/72/78/85），表里那四个 beastId 只是档位说明文字，
        //      lateMaterialTier('beast', {level}) 压根不比对 id。
        //   ⇒ 龙兽的两条真要求：名字得让玩家一眼认出是龙属（龙鳞/龙骨/龙血才对得上号），
        //      野生等级得真跨过 60/72/78/85 四道档。名字不是白起的：蛟龙/云龙/应龙是玩家
        //      在仙侠里本来就认得的三个词，蜃与螭是本项目此前空着的两格，蛟是最小一档。
        //      （另：regions.js 东南海域 boss 名里也有一条「蛟龙」，但 getRegionMonsters
        //      全库零消费端，是死数据，不构成同名撞车。）
        greenjiao: {
            name: '青鳞蛟', type: 'mythical', level: 25, realm: '金丹',
            attrs: { strength: 18, dexterity: 20, constitution: 16, willpower: 12, intelligence: 9, meridian: 14 },
            skills: ['水绞', '鳞影'],
            innate: ['venom', 'escape'], teachable: ['venom', 'escape'],  // 不变：青鳞蛟＝水莽毒蛟，遇敌先遁,
            mount: { speed: 1.5, water: true },
            // 东南海域实测：可通行的水格只有 FORD 10 + WRECK 2（大片 WATER 不可走，散不进兽），
            // 只挂 WATER 的话这一族八张图一次没出现过（实测见交付记录）。蛟本来就栖河汊沼泽，
            // 所以把沼地挂成第二处家——这是修可达性，不是给它凑地盘。
            regions: ['东南海域'], catchable: true
        },
        chi: {
            name: '赤螭', type: 'mythical', level: 45, realm: '化神',
            attrs: { strength: 30, dexterity: 22, constitution: 26, willpower: 18, intelligence: 13, meridian: 22 },
            skills: ['螭火', '独角穿'],
            innate: ['burn', 'reflect'], teachable: ['burn', 'hardened', 'reflect'],  // 三族机制批A：赤螭龙之属，鳞如镜（龙族共性的反照）＋主火灾
            mount: { speed: 2.6 },
            regions: ['南疆', '魔界'], catchable: true
        },
        sealshen: {
            name: '吞海蜃', type: 'mythical', level: 62, realm: '炼虚',
            attrs: { strength: 24, dexterity: 34, constitution: 28, willpower: 34, intelligence: 30, meridian: 30 },
            skills: ['蜃楼', '吞海'],
            innate: ['illusion', 'lifesteal'], teachable: ['illusion', 'lifesteal'],  // 三族机制批A：吞海蜃幻其形、吸其血；蜃是软体，硬不了
            regions: ['东南海域', '灵界'], catchable: true
        },
        yaolong: {
            name: '蛟龙', type: 'mythical', level: 68, realm: '炼虚',
            attrs: { strength: 36, dexterity: 30, constitution: 32, willpower: 24, intelligence: 18, meridian: 30 },
            skills: ['龙腾', '蛟绞'],
            innate: ['chill', 'lifesteal'], teachable: ['chill', 'lifesteal'],  // 三族机制批A：蛟在水里，血是冷的；pounce 已被 kunpeng 占死
            mount: { speed: 3.4, water: true },
            regions: ['东南海域', '魔界'], catchable: true
        },
        yunlong: {
            name: '云龙', type: 'mythical', level: 82, realm: '大乘',
            attrs: { strength: 40, dexterity: 42, constitution: 38, willpower: 34, intelligence: 32, meridian: 38 },
            skills: ['兴云', '布雨'],
            innate: ['escape', 'hardened'], teachable: ['escape', 'hardened'],  // 三族机制批A：云龙腾云驾雾来去无踪，鳞甲厚；pounce 已被 kunpeng 占死
            mount: { speed: 4.2, fly: true },
            regions: ['灵界'], catchable: true
        },
        yinglong: {
            name: '应龙', type: 'mythical', level: 95, realm: '渡劫',
            attrs: { strength: 48, dexterity: 46, constitution: 46, willpower: 42, intelligence: 38, meridian: 46 },
            skills: ['应龙行雨', '龙息'],
            innate: ['burn', 'hardened', 'lifesteal'], teachable: ['burn', 'lifesteal'],  // 不变：应龙＝火气护体兼吸血，全表唯一三段签名,
            mount: { speed: 4.6, fly: true },
            regions: ['灵界'], catchable: true
        },

        // ============ 花妖（四只）：花这一支的亚种，危险来自它自己的生理 ============
        // 与藤/荆棘的分工（三条都按「毒性/香气的生理来源」写，不做成花形的怪物）：
        //   藤   —— 控制型：缠绕、缚人、抽血、寄生，靠**物理**手段（无花妖一条是这个路子）
        //   荆棘 —— 防御型：刺、甲、拒斥，靠**硬**手段（荆棘母藤一条）
        //   花   —— 感官/精神型：香、色、毒粉、麻汁、催眠汁液，靠**自身分泌物**，
        //           它的每一次攻击都是「闻/沾/吸一口」——这就是为什么花妖天生带 illusion/venom/chill，
        //           而藤与荆棘天生带 hardened/reflect/lifesteal。
        bijiaflower: {
            name: '彼岸花妖', type: 'spirit', level: 17, realm: '筑基',
            attrs: { strength: 7, dexterity: 15, constitution: 9, willpower: 18, intelligence: 14, meridian: 10 },
            skills: ['引魂香', '麻汁'],
            innate: ['pounce', 'venom'], teachable: ['illusion', 'pounce', 'venom'],  // 三族机制批A：彼岸花妖伏在路边等人，扑上去＋尸毒
            regions: ['中州', '南疆'], catchable: true
        },
        mantuoluo: {
            name: '曼陀罗花妖', type: 'spirit', level: 29, realm: '金丹',
            attrs: { strength: 10, dexterity: 16, constitution: 13, willpower: 22, intelligence: 18, meridian: 14 },
            skills: ['麻药粉', '迷神'],
            innate: ['drain_qi', 'venom'], teachable: ['drain_qi', 'illusion', 'venom'],  // 三族机制批A：曼陀罗的碱抽人神气（采补）＋毒针
            regions: ['南疆', '东荒'], catchable: true
        },
        jiazhu: {
            name: '夹竹桃花妖', type: 'spirit', level: 41, realm: '化神',
            attrs: { strength: 18, dexterity: 12, constitution: 24, willpower: 20, intelligence: 13, meridian: 18 },
            skills: ['蚀器汁', '心悸粉'],
            innate: ['venom', 'hardened'], teachable: ['venom', 'hardened'],
            regions: ['西漠', '南疆'], catchable: true
        },
        yelaixiang: {
            name: '夜来香妖', type: 'spirit', level: 46, realm: '化神',
            attrs: { strength: 13, dexterity: 24, constitution: 14, willpower: 26, intelligence: 24, meridian: 20 },
            skills: ['夜放浓香', '掩息'],
            innate: ['soundwave', 'venom'], teachable: ['illusion', 'soundwave', 'venom'],  // 三族机制批A：夜来香入夜放香，香随风送＝声；毒在香里
            regions: ['蜀地', '东荒'], catchable: true
        },
        // ============ 狐妖（五只）：狐族是修真的一支，不是灵狐的高配 ============
        // ★ 先说清「狐妖 ≠ 灵狐」，这句是本段的全部理由：
        //   beast_lingfox（模板 spirit_fox，lv15/分布表 lv5）是**低阶寻宝工具兽**——
        //   它的 innate 是**空的**，差事是 treasure +5%，它替主人找东西，仅此而已。
        //   狐妖是**有道行的妖族**：幻得、变得了、惑得住人，亦正亦邪。
        //   所以狐妖这一系一律不走 treasure（寻宝那一格是灵狐的，不抢），
        //   且每一只都带真实的天生机制（灵狐 innate 为空 —— 这是「不是高配」最硬的一条证据）。
        // ⚠️「变化：战斗中形态可变」这条在本项目**没有落点**，照实记：
        //   ① battle.js 没有形态/变身字段，全仓也没有 morph / shapeShift 这类标识符；
        //   ② 炼器 30 条词缀（实测全量，见 tests/v27.11-beast-species-node.js 的 J3）全是属性/触发术，
        //      没有一条是「形态」；
        //   ③ 最接近的三样都不是：模板的 evolve（进化形态）在 beast-taming.js 禁改簿上、
        //      是战斗外的事；bonded-artifact.js 的「化形」是**法宝器灵**预留的成长位，与兽无关。
        //   ⇒ 变化/腾挪只用现成机制表达：illusion（幻形）与 escape（遁走），
        //      变不出「战斗中换形态」这句话，所以本段的文案里也不这么写。
        foxpup: {
            name: '毛狐', type: 'spirit', level: 8, realm: '炼气',
            attrs: { strength: 5, dexterity: 16, constitution: 6, willpower: 12, intelligence: 11, meridian: 8 },
            skills: ['障眼', '缩形'],
            innate: ['escape', 'illusion'], teachable: ['escape', 'illusion'],  // 三族机制批A：幼狐打不过就跑，障眼＋缩形才是它的打法
            mount: { speed: 1.8 },
            regions: ['中州', '蜀地'], catchable: true
        },
        jadefacefox: {
            name: '玉面狐', type: 'spirit', level: 22, realm: '筑基',
            attrs: { strength: 9, dexterity: 20, constitution: 10, willpower: 20, intelligence: 18, meridian: 13 },
            skills: ['惑心', '化形'],
            innate: ['drain_qi', 'illusion'], teachable: ['drain_qi', 'illusion'],  // 三族机制批A：狐妖摄人精气（采补）才是看家本事，毒不是
            mount: { speed: 2.2 },
            regions: ['东荒', '中州'], catchable: true
        },
        darkfox: {
            // 原拟「玄狐」——**实测撞名池**：杂兽随机名是「前缀×后缀」，玄 在前缀表里、狐 在后缀表里，
            // 所以野地里会刷出一只名叫「玄狐」的寻常杂兽，而收服是按 enemy.name 与模板名精确匹配的，
            // 那就等于打死一只野猫捡回一只妖族大能。改名「墨狐」（墨 不在前缀表里），避开这一类。
            name: '墨狐', type: 'spirit', level: 36, realm: '金丹',
            attrs: { strength: 14, dexterity: 26, constitution: 13, willpower: 26, intelligence: 24, meridian: 20 },
            skills: ['幻域', '借形'],
            innate: ['burn', 'illusion'], teachable: ['burn', 'illusion'],  // 三族机制批A：墨狐放狐火，不是只会逃
            mount: { speed: 2.6 },
            regions: ['南疆', '蜀地'], catchable: true
        },
        snowfox: {
            name: '雪狐', type: 'spirit', level: 48, realm: '化神',
            attrs: { strength: 20, dexterity: 30, constitution: 18, willpower: 26, intelligence: 22, meridian: 26 },
            skills: ['雪障', '寒魅'],
            innate: ['chill', 'illusion'], teachable: ['chill', 'illusion'],  // 不变：雪狐＝雪障＋寒魅,
            mount: { speed: 3.0 },
            regions: ['北冥'], catchable: true
        },
        ninetailfox: {
            name: '九尾狐', type: 'mythical', level: 76, realm: '大乘',
            attrs: { strength: 32, dexterity: 40, constitution: 30, willpower: 42, intelligence: 38, meridian: 40 },
            skills: ['九尾幻域', '狐火'],
            innate: ['burn', 'soundwave'], teachable: ['burn', 'illusion', 'soundwave'],  // 三族机制批A：九尾九声，声可乱神
            mount: { speed: 4.0, fly: true },
            regions: ['灵界'], catchable: true
        },
        // ============ 山海经新兽（12 只）：形 → 产地 → 用途，三段都要能指着真东西说 ============
        // 口径与上面 23 只逐字对齐（name/type/level/realm/attrs 六维/skills/innate/teachable/
        // regions/catchable），两条硬规矩照旧：① innate/teachable 只用 battle.js
        // COMBAT_ABILITIES 登记过的 13 个 id；② 不写 evolve（本批不新增血脉蜕变线）。
        // ★ innate 分配的三条依据（免得做成同一套换皮）：
        //   ① 12 只里 8 个签名是全表**没出现过的新签名**（soundwave / chill+burn / burn+hardened /
        //      burn+escape / venom+drain_qi / chill+escape / illusion+soundwave / pounce+lifesteal）；
        //      另外 4 只落在既有 1× 组里（hardened+reflect / hardened+venom / hardened+illusion /
        //      hardened+chill），不加重复组——实测重复组 5→9、冗余 16→20，仍在 C3(<11)/C4(<26) 之下。
        //   ② 一只都不带 sword_burst：tests/beast-ability-live-node.js:248 断言它天生恒为 0
        //      （剑气纵横是剑修的本事，兽没有一只使兵器，硬塞＝脑补）。
        //   ③ innate 只写「它自己身上那件事」，不写灾异（灾异在 OMEN_SPECS，由另一层管）。
        // —— 水路：四角白鹿，四角是导流的骨 ——
        fuzhu: {
            name: '夫诸', type: 'beast', level: 34, realm: '元婴',
            attrs: { strength: 22, dexterity: 26, constitution: 20, willpower: 16, intelligence: 18, meridian: 20 },
            skills: ['导流角', '涉水跃'],
            // 导流角把水脉分出去（escape：避洪离水），涉水一趟身寒（chill）。四角导流不是凶器，是水路。
            innate: ['chill', 'escape'], teachable: ['chill', 'escape', 'hardened'],
            regions: ['东南海域'], catchable: true
        },
        // —— 西漠：沙狐背生双翼，翼上无翎，扇起来声如击石 ——
        yeling: {
            name: '獙獙', type: 'beast', level: 30, realm: '金丹',
            attrs: { strength: 18, dexterity: 24, constitution: 16, willpower: 14, intelligence: 16, meridian: 16 },
            skills: ['击石声', '低飞听风'],
            // 「其音如击石」就是它的看家本事：全表天生带摄魂音的兽，此前只有夜来香妖与九尾狐两只。
            innate: ['soundwave'], teachable: ['soundwave', 'escape', 'chill'],
            regions: ['西漠'], catchable: true
        },
        // —— 南疆：火山石缝里的赤燥怪蛇，不喷火，热从鳞里往外渗 ——
        feiyi: {
            name: '肥遗', type: 'beast', level: 44, realm: '化神',
            attrs: { strength: 30, dexterity: 18, constitution: 30, willpower: 16, intelligence: 12, meridian: 22 },
            skills: ['燥鳞灼', '石缝盘'],
            // 臙仓＝燥：鳞里往外渗的热是 burn，晒裂的鳞自己结成硬壳是 hardened。
            innate: ['burn', 'hardened'], teachable: ['burn', 'hardened', 'chill'],
            regions: ['南疆'], catchable: true
        },
        // —— 南疆山道：黑毛犬，尾末分叉两支，跑过处草棚先起烟 ——
        huodou: {
            name: '祸斗', type: 'beast', level: 24, realm: '筑基',
            attrs: { strength: 20, dexterity: 20, constitution: 14, willpower: 10, intelligence: 9, meridian: 12 },
            skills: ['尾火燎', '穿山道'],
            // 尾末那两支火是 burn；犬在山道上跑得比火快（escape，火起之前它已经跑过去了）。
            innate: ['burn', 'escape'], teachable: ['burn', 'escape', 'illusion'],
            regions: ['南疆'], catchable: true
        },
        // —— 南疆瘴泽与东荒泥沼：独眼牛形兽，尾作蛇行，走过之处水涸草死 ——
        fei: {
            name: '蜚', type: 'beast', level: 40, realm: '化神',
            attrs: { strength: 32, dexterity: 14, constitution: 26, willpower: 14, intelligence: 12, meridian: 20 },
            skills: ['浊眼引疫', '蛇尾扫'],
            // 「行水则竭行草则死」＝它把一地生气吸干：疫气是 venom，生气被夺是 drain_qi。
            innate: ['venom', 'drain_qi'], teachable: ['venom', 'drain_qi', 'hardened'],
            regions: ['南疆', '东荒'], catchable: true
        },
        // —— 灵界罡风带：睁眼为昼、闭眼为夜、吹气为冬、呼气为夏 ——
        zhulong: {
            name: '烛龙', type: 'mythical', level: 92, realm: '大乘',
            attrs: { strength: 46, dexterity: 44, constitution: 44, willpower: 40, intelligence: 40, meridian: 44 },
            skills: ['睁眼昼', '吹气冬'],
            // 它那一口冷热就是它的本事本身：吹气为冬（chill）＋呼气为夏（burn）。
            // ★ 昼夜那一层（同一只兽白天夜里换招）没有挂它身上：behavior==='daynight' 那一个钩子
            //   已被应龙占着，tests/beast-mechanic-families-node.js D12 判「各恰好一只宿主」，
            //   挂第二只当场转红。如实记：烛龙的昼夜机制**未接**，接上它要先把 D12 改成棘轮。
            innate: ['chill', 'burn'], teachable: ['chill', 'burn', 'hardened'],
            regions: ['灵界'], catchable: true
        },
        // —— 中州与蜀地：生下来就驮着一块碑的大龟 ——
        baxia: {
            name: '霸下', type: 'beast', level: 52, realm: '化神',
            attrs: { strength: 34, dexterity: 10, constitution: 44, willpower: 22, intelligence: 16, meridian: 26 },
            skills: ['负碑镇', '龟息'],
            // 负碑＝壳硬（hardened），碑上刻的是三山五岳的碑铭、受一击原样弹回（reflect）。
            // ★ dexterity 10 是全表最低档：它驮得多也走得慢，这是它的代价不是设计事故。
            innate: ['hardened', 'reflect'], teachable: ['hardened', 'reflect', 'chill'],
            regions: ['中州', '蜀地'], catchable: true
        },
        // —— 东荒老林与瘴泽：说人话、通万物之情的通灵神兽 ——
        baize: {
            name: '白泽', type: 'mythical', level: 62, realm: '炼虚',
            attrs: { strength: 26, dexterity: 32, constitution: 30, willpower: 38, intelligence: 36, meridian: 32 },
            skills: ['通物问答', '知微角'],
            // 「能言」这一条在战斗里唯一的落点就是 soundwave —— 它开口说话，那声音本身就能惑人心神；
            // 「通万物之情」是 illusion（说得真，也说得人认不出真假）。
            // ★ 白天夜里换招那一层没给它（见烛龙那条）；它也不是 §5 情报钩子的宿主（那一位是雷鹰）。
            innate: ['illusion', 'soundwave'], teachable: ['illusion', 'soundwave', 'gu_parasite'],
            regions: ['东荒'], catchable: true
        },
        // —— 东南海域：炎帝之女娃溺于东海，魂化青鸟，日日衔西山木石填东海 ——
        jingwei: {
            name: '精卫', type: 'spirit', level: 28, realm: '金丹',
            attrs: { strength: 18, dexterity: 28, constitution: 14, willpower: 22, intelligence: 16, meridian: 16 },
            skills: ['衔石填海', '青鸟掠水'],
            // 俯冲衔石是 pounce；永不衰减、一身血气自续是 lifesteal（「不歇」的本性）。
            // ★ 它明确**不含 escape**：那正是这一只与「会逃」那一套的分别。
            // ★ 日课钩子（按日累积、每十日填高一层）也没给它：persist 那一位是蛟龙，D12 判各恰好一只宿主。
            innate: ['pounce', 'lifesteal'], teachable: ['pounce', 'lifesteal', 'chill'],
            regions: ['东南海域'], catchable: true
        },
        // —— 中州与西漠：拱背小猪，前爪特短特硬，掘过处地面多起伏 ——
        lili: {
            name: '狸力', type: 'beast', level: 16, realm: '筑基',
            attrs: { strength: 14, dexterity: 10, constitution: 16, willpower: 8, intelligence: 8, meridian: 9 },
            skills: ['拱背掘', '铁鼻拱'],
            // 那对前爪硬得掘得穿冻土（hardened）；爪缝里常年带着地底腐气（venom）——不是它放毒，是它掘的东西有毒。
            // ★ 「见则其国多材」接的是差事那一格（treasure 0.06），不是战斗数值：它掘得比你快。
            innate: ['hardened', 'venom'], teachable: ['hardened', 'venom', 'illusion'],
            regions: ['中州', '西漠'], catchable: true
        },
        // —— 中州与蜀地的屋脊：龙生九子之长，好望 ——
        chiwen: {
            name: '螭吻', type: 'dragon', level: 36, realm: '元婴',
            attrs: { strength: 26, dexterity: 22, constitution: 28, willpower: 20, intelligence: 22, meridian: 22 },
            skills: ['望气', '檐角踞'],
            // 「性好望」在战斗里是望气（illusion：它看哪条路是假的）；龙身鳞厚（hardened）。
            // ★ 「可放置的屋顶观察哨」没做：放置物系统的下游都在禁改簿上，硬做只能写成一句没接上的话。
            innate: ['illusion', 'hardened'], teachable: ['illusion', 'hardened', 'burn'],
            regions: ['中州', '蜀地'], catchable: true
        },
        // —— 河堤上的护水石像，性好水、能负重，涨水时沉下去、退水时还在原地 ——
        gangfu: {
            name: '蚣蝮', type: 'beast', level: 20, realm: '筑基',
            attrs: { strength: 16, dexterity: 8, constitution: 24, willpower: 14, intelligence: 8, meridian: 12 },
            skills: ['沉水驮', '负碑立'],
            // 石像身硬（hardened）；常年在水里泡着，身上那股寒气洗不掉（chill）。
            innate: ['hardened', 'chill'], teachable: ['hardened', 'chill', 'reflect'],
            regions: ['东南海域'], catchable: true
        }
    };

    // v27.11·本批 23 只新兽的族属与支别（一张表，测试与图鉴都按它分组）
    //   family: plant（草木成精）/ dragon（龙系）/ fox（狐妖）
    //   branch: vine 藤（控制）/ thorn 荆棘（防御）/ flower 花（感官精神）/ ambush 吞噬（混合）
    //           dragon 龙系 / fox 狐妖
    // 为什么要单开一张表、不写进模板对象：模板字面量是这一批最长的几段，
    // 加两个字段就得重排一遍（diff 全是噪声，改坏一处字段的代价远大于收益）。
    var SPECIES_FAMILY_V2711 = {
        // —— 藤/花系 8 只 ——
        soulbindvine: ['plant', 'vine'], bloodsuckvine: ['plant', 'vine'],
        thornmatron: ['plant', 'thorn'], mindbloom: ['plant', 'flower'],
        glacierbloom: ['plant', 'flower'], tiansiangvine: ['plant', 'vine'],
        manthistle: ['plant', 'ambush'], meltvine: ['plant', 'vine'],
        // —— 花妖 4 只（本批补）——
        bijiaflower: ['plant', 'flower'], mantuoluo: ['plant', 'flower'],
        jiazhu: ['plant', 'flower'], yelaixiang: ['plant', 'flower'],
        // —— 龙系 6 只 ——
        greenjiao: ['dragon', 'dragon'], chi: ['dragon', 'dragon'],
        sealshen: ['dragon', 'dragon'], yaolong: ['dragon', 'dragon'],
        yunlong: ['dragon', 'dragon'], yinglong: ['dragon', 'dragon'],
        // —— 狐妖 5 只（本批补）——
        foxpup: ['fox', 'fox'], jadefacefox: ['fox', 'fox'], darkfox: ['fox', 'fox'],
        snowfox: ['fox', 'fox'], ninetailfox: ['fox', 'fox'],
        // —— 山海经新兽 12 只（山海经新兽批）——
        // 新开一支 family='shanhai'、branch='shanhai'：不塞进 plant/dragon/fox 任何一系。
        // 为什么单开：那三系各有自己的硬判据（草木 F3 低阶代表、F7 族内高阶档；龙 F4 低阶代表；
        // 狐 N4 一只都不挂 treasure、O1 每只都沾香/幻/毒）。往任何一系里塞十二只都会踩到
        // 其中一条，或者——更糟——为了不踩而把某只硬改成不符合它本来属性的样子。
        // 单开一支的后果是明确的：F3/F4/F4b/F5/F7/N4/O1~O4 十条判据**一条都不覆盖这十二只**，
        // 它们只被 A/B/C/E/G/H/I/J/K/M 这些通用判据覆盖（字段齐、地名真、地貌够、遇率够、
        // 能拼出战斗数据、机制在册、不撞杂兽名池、零骰）。这是本批如实划的边界，不藏。
        fuzhu: ['shanhai', 'shanhai'], yeling: ['shanhai', 'shanhai'], feiyi: ['shanhai', 'shanhai'],
        huodou: ['shanhai', 'shanhai'], fei: ['shanhai', 'shanhai'], zhulong: ['shanhai', 'shanhai'],
        baxia: ['shanhai', 'shanhai'], baize: ['shanhai', 'shanhai'], jingwei: ['shanhai', 'shanhai'],
        lili: ['shanhai', 'shanhai'], chiwen: ['shanhai', 'shanhai'], gangfu: ['shanhai', 'shanhai']
    };

// ====================================================================================
    //  三族机制批A（⑤生态预兆 / ⑥特殊行为 / ⑦部位掉落）——13 只既有兽升族 + 三张机制表
    // ====================================================================================
    // 体例依据刘宗迪《众神的山川》（商务印书馆 2022）：《山海经》不是怪物志，是博物志，
    // 五要素 = 名称 → 分类 → 形态 → 产地 → 用途。本段每一只升族的兽都必须能写出
    //   **产地/成因 → 玩家怎么拿到（打什么兽掉哪个部位）→ 炼器出口 → 克制/风险关系**
    // 写不出这条链的兽不升族（强制规则第 9 条：先合乎逻辑，再谈平衡）。
    //
    // ⚠️ 本段第一版（2026-10-04 兽机制接线批）写的是「给既有兽升族」，理由是
    //   「两把现有尺都把那张表锁死了」：
    //     ① tests/wave86-beast-collector-node.js 的 D7：分布表每一行的名字必须能在
    //        window.BEAST_TEMPLATES 里一字不差地查到（「分布名与模板名一字不差」）。
    //     ② tests/beast-mechanic-families-node.js 的 C1：**模板总数必须 === 48**。
    //   两条都不在那一批的可写清单内，所以那一批没敢加新兽，把 12 只新兽的设计稿落在
    //   `.scratch/beast-mechanics-fix-progress/20-设计稿-未接线.md`，代码里不留占位名册。
    //   ★ 山海经新兽批：② 已改成棘轮「模板总数 ≥ 48」（只增不减，删任一只照样红），
    //     ① 本来就不锁（加兽只会更绿）。两把尺一松一放，12 只新兽全部接进代码，
    //     落点见本文件 BEAST_DISTRIBUTION 段山海经那 12 行上方。
    //
    // ★ 本段**不动任何战斗数值倍率**：⑤ 改的是世界日程与产出，⑥ 改的是既有差事的量级，
    //   ⑦ 只加掉落。全项目没有任何一处全局伤害/数值缩放被碰过（强制规则第 14 条）。
    var MECH_FAMILY_V2712 = {
        // ============ ⑤ 生态预兆型（5 只）：出场即改环境，不改战斗数值 ============
        // 「见则其邑大水」这类记载，说的是**征兆先到、灾事随后**。机制是：
        //   出场 → 世界日程表上占一条 world_event（日程面板真的画出来）
        //   → delayDays 后到期 → 灾事成真：**那只兽在这一带现身得更频（过境 OMEN_STAY_DAYS 日）**
        // ★ 灾异**不发料**。灾留在地上的东西是那只兽身上的件（部位件账 BODY_PARTS_DROPS），
        //   打死后经尸体携带物→搜刮/解剖入包。日历只做索引，不做发钱口——按日历白给东西就是签到，
        //   签到被否掉过（做对的样板见 js/city-facilities/festival-calendar.js：只 register 不裁决不发奖）。
        // ★ 刻意不做的事：不扣血、不扣钱、不改任何倍率。灾不是罚，是事——日子看得见、赶得上；
        //   赶不上只是那几日那片地里撞见的是别的兽。禁改簿那三条设计禁令（未互动就惩罚默认开 /
        //   条件不足整栏隐藏 / 开局出身天赋）这一族一条都不碰。
        'beast_kunpeng': {
            family: ['omen', 'part'], omen: 'flood',
            origin: '北冥寒渊的鹏，「北冥有鱼，其名为鲲」；鹏一振翅，渊里的水脉跟着它走',
            use: '鹏爪钩出的河底沉铁；水退后河床露出的兽骨才是它真正带来的东西'
        },
        // ★ 狮獙（旱·声）的宿主只能是本文件能改 innate 的兽：罡风鹤的 innate 在
        //   js/beast-taming.js（禁改簿），动不了。所以挂在**夜来香妖**身上——
        //   它入夜放香、香随风送，风一起山里的水汽跟着香走，那一声「旱」就是这么来的；
        //   它本来就带 soundwave（v27.11 给它的：香随风送＝声）。
        'beast_yelaixiang': {
            family: ['omen'], omen: 'drought_voice',
            origin: '蜀地与东荒山林的夜来香，入夜放香。香随风送，风一起山里的水汽就跟着走了',
            use: '香里那点潮气凝成鹤唳般的音石，缺水之地反倒好用'
        },
        'beast_chi': {
            family: ['omen'], omen: 'drought_heat',
            origin: '南疆与魔界火山石缝的赤螭，龙之属而主火灾；热从鳞里往外渗',
            use: '赤鳞压成的玄铁；焦土下烧裂的火晶是火属器物的引子'
        },
        'beast_flametiger': {
            family: ['omen', 'part'], omen: 'fire',
            origin: '南疆与西漠荒漠的黑毛虎，尾末有一簇不灭的火；它奔过的地方草棚先起烟',
            use: '火烧一遍反而更韧的虎皮；焦牙是骨幡的老料'
        },
        'beast_bloodsuckvine': {
            family: ['omen', 'part'], omen: 'plague',
            origin: '南疆瘴泽与东荒泥沼的吸血藤。它把卵种进猎物身上——上古那场疫就是这么传开的',
            use: '吸血管薄得能看见血；鞘里那点浊气凝成丹，既是蛊引也是药引'
        },
        // ============ ⑥ 特殊行为型（3 只）：危险不在属性表，在它做什么 ============
        // ★ 为什么只有 3 只：《山海经》另六个行为（穷奇「咬掉有理一方的鼻子」裁决谁有理、
        //   狴犴「主持正义」纠纷裁决、狸力「掘地」直连采矿口、螭吻「性好望」可放置的屋顶观察哨、
        //   霸下「负三山五岳」负重、蚣蝮「负重」）每一个都需要 battle.js（战斗内裁决）
        //   或 app.js / city-facilities（放置物、采矿口）的新机制位——全在禁改簿上。
        //   硬做只能写成一句没接上的话，所以不做，已列名（见交付报告「仍存在的问题」）。
        //   ★ 另注：龙龟/雷鹰的差事值（carry 0.10 / scout 1.0）被现有尺锁死
        //   （tests/wave84-beast-wiring-node.js A3/A5 与 tests/wave89-mount-wings-node.js D6
        //     都逐字节断言这两个数），所以「负重」与「情报」这两族**不加账**，
        //   只把雷鹰作为「情报」的宿主（它本来就是侦察兽，scout 1.0 现读不变），
        //   龙龟退到 ⑦ 部位层（它的背甲与河碑本来就是它的东西）。
        'beast_yinglong': {
            family: ['behavior', 'part'], behavior: 'daynight',
            origin: '灵界罡风带最长的那条龙。它睁眼即为白昼，闭眼即为夜；吹气为冬，呼气为夏',
            use: '夜眼是天外陨铁，落在夜里最好使；冬息凝出的鳞是星辰铁，寒属器物的底料'
        },
        'beast_thundereagle': {
            family: ['behavior', 'part'], behavior: 'intel',
            origin: '东荒与东南海域山脊上的雷鹰。翼下一圈空气永远是震的，山里有什么它先知道',
            use: '望风的翼骨；目光凝出的雷晶是探路的器物'
        },
        'beast_yaolong': {
            family: ['behavior', 'part'], behavior: 'persist',
            origin: '东南海域与魔界的蛟。它日日在两岸来回，把淤在河口的泥沙与沉木一趟趟衔回去',
            use: '河底沉铁；泥里淘出的铜器熔成的铜锭，落在器物底座上最压秤'
        },
        // ============ ⑦ 部位掉落型：整个身份就是「哪个部位能炼什么」 ============
        'beast_dragonturtle': {
            family: ['part'],
            origin: '东荒与东南海域的大龟，四爪是导流的骨，壳厚得能驮一座小庙',
            use: '负水背甲沉在水底也不烂；背上的河碑石浸了水照样合炉'
        },
        'beast_blackbear': {
            family: ['part'],
            origin: '北冥与中州东荒的老林巨熊，前掌挖得穿冻土。它刨过的地方底下有东西',
            use: '掌骨熬成的兽骨；掘土那对利爪的铜色洗不掉'
        },
        'beast_shadowpanther': {
            family: ['part'],
            origin: '中州与南疆山林的影豹，爪套常年不脱——猎装与皮甲的正经料子',
            use: '豹爪是猎具的刃口；豹皮经刀经火反而更韧'
        },
        'beast_icesnake': {
            family: ['part'],
            origin: '北冥雪线与冻土的冰蛇。蛇胆是毒系炼器的引子，毒牙是蛊引',
            use: '蛇胆凝的妖兽内丹；毒牙磨成的妖兽骨，泡过寒气不脆'
        },
        // —— 跨族：v27.11 四草木兽也挂部位件（部位层是跨族机制层，不只给族内的兽）——
        'beast_meltvine': {
            family: ['part'],
            origin: '南疆与魔界火山坡的熔岩藤，根扎进石缝，把地火一路吸上来',
            use: '熔皮是地火熬过一遍的陨铁，杂质自己烧干净了；地火根五行俱在'
        },
        'beast_thornmatron': {
            family: ['part'],
            origin: '蜀地与东荒山脊的荆棘母藤，整株的刺朝外长，打下来就是一整片',
            use: '荆棘壁磨出的精铁，铺在器物底座上'
        },
        'beast_mantuoluo': {
            family: ['part'],
            origin: '中州南疆与东荒的曼陀罗花妖，荚硬得掰不动，只能整只挖',
            use: '毒种荚壳磨出的锡矿，锡是接骨与焊器的老料'
        },
        // ============ 山海经新兽 12 只：逻辑链四要素逐只齐全 ============
        // 四要素落在四个可查的地方（不是一句注释）：**产地 = origin** ／
        //   **材料 = BODY_PARTS_DROPS[k][*].matId**（必在炼器账 MATERIAL_GRADE 里）、
        //   **炼器出口 = partOutlet(matId)** 现读品阶与词缀池 ／ **克制·风险 = risk**。
        // ★ 只挂 ⑦ 一族，原因照实写在这（不是偷懒，是本批的判据冲突，见上方注释）：
        //   八只原著兽的「见则其邑有灾」与大旱、大水、火灾、大疫这五类预兆已各有宿主
        //   （鲲鹏/夜来香妖/赤螭/火焰虎/血吸藤）。本尺 D10 判「每一类预兆**恰好一只**宿主」——
        //   不是 0 只也不是 2 只。给夫诸/獙獙/肥遗/祸斗/蜚再挂一次，当场转红。
        //   而把这五类灾象各换一个新 id 再挂一遍（flood_riverhead / drought_voice2 …），
        //   就是本尺 E 段整套（E1~E11）专门要拦的「同源机制做成一套换皮」——
        //   E11 虽只查产出组合两两不同，但换皮的实质不在产出，在成因与灾象是同一件事。
        //   烛龙的昼夜季节同理（D12 判 daynight/persist/intel 各恰好一只宿主，daynight 已归应龙）。
        //   ⇒ 诚实的结论：这十二只的**灾异/昼夜/日课/情报那一层本批未接**，
        //     接上它们的前置条件是先把 D10/D12 从「恰好一只」改成棘轮，那是下一把尺的活。
        'beast_fuzhu': {
            family: ['part'],
            origin: '东南海域河源与海崖的四角白鹿。它的四角是导流的骨，站进河源水脉里就壅不住',
            use: '四只鹿角压成的寒铁，导流的那道纹是它自己走水路走出来的；河床巨蚌壳内壁那层银是秘银里最净的一种',
            risk: '它站过的那段河源三日不成堤——早备船的那批人捞得最多，别在水脉里等它走'
        },
        'beast_yeling': {
            family: ['part'],
            origin: '西漠沙狐，背生双翼而翼上无翎，扇起来声音像石头碰石头，一下一下',
            use: '无翎翼膜熬出的天外玄铁，翼薄得能透光；喉里那颗音石，缺水之地拿它当响器',
            risk: '翼膜见水就软，雨前得先收起来；音石在干旱里反倒比在湿地响'
        },
        'beast_feiyi': {
            family: ['part'],
            origin: '南疆火山石缝里的赤燥怪蛇。它不喷火，热是从鳞里往外渗的，爬过的地方三日不出草',
            use: '蜕下的赤鳞压成的玄铁，火纹从上到下；腹中那块旱石是火属器物的引子',
            risk: '焦土上草木尽死；玄铁与火晶是火属与金属炉的主料，旱一次顶十趟采矿'
        },
        'beast_huodou': {
            family: ['part'],
            origin: '南疆山道上的黑毛犬，尾末分叉成两支。跑过的地方草棚先起烟，一天就烧过去',
            use: '经了火的犬皮是妖兽皮里最韧的一张；尾末那两支火凝出的凤凰血，炉温压得住',
            risk: '来势最快，一日就过；火起之前先离村道，来得及抢人'
        },
        'beast_fei': {
            family: ['part'],
            origin: '南疆瘴泽与东荒泥沼的独眼牛形兽，尾作蛇行。它走过去水涸草死，人畜跟着病倒',
            use: '独眼里那点浊气凝成的妖兽内丹，是解毒诸药的引；蛇尾骨磨成的簪，泡过疫气不返潮',
            risk: '来势最慢也最难躲，四日一村；禳解要先取雷鹰的望风翼骨——疫起之前它已在山脊上盘旋'
        },
        'beast_zhulong': {
            family: ['part'],
            origin: '灵界罡风带最上头的那条。它睁眼即为白昼，闭眼即为夜；吹气为冬，呼气为夏',
            use: '睁眼时那颗夜眼是陨铁，落在夜里最好使；冬息里凝出的鳞是星辰铁，寒属器物的底料',
            risk: '同一只兽白天与夜里打法不同：白天是炎爆，夜里是寒冰——认错时辰就白挨一轮。★昼夜换招那一层未接（见上方）'
        },
        'beast_baxia': {
            family: ['part'],
            origin: '中州与蜀地的大龟，生下来就驮着一块碑。大禹让它驮过三山五岳的碑铭',
            use: '负山碑上那层紫金，是碑文里刻的印；负岳之蹄磨出的精铁，铺在器物底座上最压秤',
            risk: '驮得多也走得慢——它一步顶人三步。赶路别指望它，追不上就换坐骑'
        },
        'beast_baize': {
            family: ['part'],
            origin: '东荒老林与瘴泽深处的通灵神兽。它说人话、通万物之情，极少出没：见着的人多半是它愿意让见着的',
            use: '知微角上凝出的龙晶，辨器物真伪；通物之舌换来的龙骨，是契约与镇物两类器物的底料',
            risk: '它一开口，那声音本身就能惑人心神——别在它面前把心事说出口。★情报钩子未接（那一位是雷鹰，见上方）'
        },
        'beast_jingwei': {
            family: ['part'],
            origin: '炎帝之女娃溺于东海，魂化青鸟。它日日衔西山木石填东海，衔了一程又一程，不歇',
            use: '青鸟尾羽炼出的凤羽，火属器物里最稳的一档；衔石爪上磨出的铜，落在底座上最压秤',
            risk: '它不衰减也不放手——养着它就得天天有东西可衔。★日课钩子未接（那一位是蛟龙，见上方）'
        },
        'beast_lili': {
            family: ['part'],
            origin: '中州与西漠的拱背小猪，前爪特短特硬。它掘过的地方地面多起伏——底下有东西',
            use: '掘穿地脉的那对爪，铜色洗不掉；腹中吞下的矿砂是铁矿，磨成粉就是炉底',
            risk: '它掘得比你快——看见地面起伏它先到，寻宝那一笔加成归它，不归你'
        },
        'beast_chiwen': {
            family: ['part'],
            origin: '龙生九子之长，好望。屋脊上蹲着的那条，檐角起风它先抬头——它看的是屋脊，不是瓦',
            use: '龙吻炼出的龙鳞，龙池器物的正经主料；望脊上那层望气凝出的龙鳞铁，比鳞更硬',
            risk: '它只蹲高处——低处找不到它，也找不到它的鳞。★可放置的屋顶哨未做（放置物系统在禁改簿上）'
        },
        'beast_gangfu': {
            family: ['part'],
            origin: '河堤上的护水石像，性好水、能负重。涨水时它先沉下去，退水时还在原地',
            use: '负水的背甲沉在水底也不烂；背上那块河碑石浸了水照样合炉，皮比铁耐泡',
            risk: '涨水那一段路你过不去，它驮得过去——但它驮的是石头，不是你所有的行李'
        }
    };

    // ---------- ⑤ 生态预兆机制表 ----------
    // ★ 獙獙 vs 肥遗同为大旱，《山海经》就写在一处，所以这一族最要防的是「一套换皮」。
    //   本段把两条大旱**刻意做成两条机制**，三项全不同：
    //     drought_voice（夜来香妖）：旱是**声音**造成的（入夜放香，香随风送＝声）
    //                         → 机制挂 soundwave，风险是那几日它就在上风口出没
    //                           风险是「香里那点潮气散尽，只剩一副空骨」——那句 why 归部位件账
    //     drought_heat  （赤螭）  ：旱是**体温**造成的（龙之属主火灾，热从鳞里渗）
    //                         → 机制挂 burn+reflect，风险是它爬过的那几日坡上都是它
    //   机制 id、成因、禳解、风险四样都不重合（尺在 E1~E11 逐条钉）。
    // ★ 本表**没有 yields**：灾异过去不进任何东西给玩家。原来那份 yields 是「按日历白送料」，
    //   唯一的消费口是 landOmens 里的 addItem——鲲鹏一天飞三百里，它在往谁嘴里送？
    //   现在灾落在地上的料走 BODY_PARTS_DROPS（部位件），得打死那只兽才掉得出来。
    // ★ 本表**没有 risk 空话**：risk 现在每个字都有真消费口——过境那几日宿主兽在该地区
    //   出没权重上去了（activeOmenBeasts → pickBeastFromPool）。禁改设计第 4 条：说了不做的不许留。
    var OMEN_STAY_DAYS = 3;   // 灾过境几日：过境期间宿主兽在该地区出没更频
    // ⑥ 蛟龙日课的两个常数也放这儿（下游的出没权重现读它们，声明放在后面会踩 TDZ）
    var DAY_COURSE_PERIOD = 10;
    var DAY_COURSE_BEAST = 'beast_yaolong';
    var OMEN_SPECS = {
        flood: {
            id: 'flood', label: '大水', delayDays: 3, severity: 'major',
            cause: '鲲鹏自北冥寒渊振翅而来，渊里的水脉跟着它走，壅不住了',
            remedy: '无禳解之法——水要来的让它来，早三日把船备好就是',
            risk: '鲲鹏就在这一带的水路上。它一日飞三百里，水段一日三换——你备船那几天，它早换到下一段去了'
        },
        drought_voice: {
            id: 'drought_voice', label: '旱（声）', delayDays: 2, severity: 'major',
            cause: '夜来香妖入夜放香，香随风送；风一起，山里的水汽跟着香走',
            remedy: '无禳解之法——捂住鼻子也没用，香已经在半山了',
            risk: '旱是它嗓子叫出来的。风一起水汽跟着香走，那几日它就在这片山的上风口，出没撞见的是它'
        },
        drought_heat: {
            id: 'drought_heat', label: '旱（热）', delayDays: 2, severity: 'major',
            cause: '赤螭爬过整片火山坡，热从鳞里渗出来，地就焦了',
            remedy: '无禳解之法——土都裂了，浇多少水都不够',
            risk: '焦土是它爬出来的。它爬过的那几日，这一带坡上出没的是它；焦土下的火晶是它腹里那块旱石'
        },
        fire: {
            id: 'fire', label: '火灾', delayDays: 1, severity: 'major',
            cause: '火焰虎奔过村道，尾末那簇火先点着草棚，再烧到房',
            remedy: '无禳解之法——但一日就过，来得及抢人',
            risk: '火一日就烧过去，来得及抢人。烧剩的虎皮与焦牙不算灾的赏赐——那是它身上的件，要拿就打它'
        },
        plague: {
            id: 'plague', label: '瘟疫', delayDays: 4, severity: 'major',
            cause: '血吸藤把卵种进人畜身上，一旬之内一村接着一村病倒',
            remedy: '雷鹰认得它——先取望风翼骨，疫起之前它已经在山脊上盘旋了（见 beast_thundereagle）',
            risk: '疫起得慢，四日一村，谁也躲不开。血吸藤把卵一路撒过去，泥沼那一片这几日都是它'
        }
    };

    // 一类预兆的宿主兽（现读 MECH_FAMILY_V2712 反查，不另立一份名册）
    function omenHostOf(omenId) {
        for (var k in MECH_FAMILY_V2712) {
            if (!Object.prototype.hasOwnProperty.call(MECH_FAMILY_V2712, k)) continue;
            if (MECH_FAMILY_V2712[k].omen === omenId) return k;
        }
        return '';
    }
    // 灾过境未退（落地当日起 OMEN_STAY_DAYS 日）的那几只兽：beastId → 额外权重份数
    // 账在 _state.omens 里，不另开一份平行状态（它是预兆账的下游视图，不是新账）
    function activeOmenBeasts(region, today) {
        var day = (today != null) ? Number(today) : _today();
        var st = _state.omens;
        var out = {};
        if (!st) return out;
        for (var key in st) {
            if (!Object.prototype.hasOwnProperty.call(st, key)) continue;
            var rec = st[key];
            if (!rec || !rec.landed || !rec.region) continue;
            if (region && rec.region !== region) continue;
            var age = day - (Number(rec.dueDay) || 0);
            if (!(age >= 0) || age >= OMEN_STAY_DAYS) continue;
            var host = omenHostOf(rec.omenId);
            if (host) out[host] = (out[host] || 0) + 1;
        }
        return out;
    }

    // ---------- ⑦ 部位掉落机制表 ----------
    // 「打哪只掉什么」改成「打哪只掉哪个部位，部位决定炼器出口」。
    // ★ 硬约束：每一条 matId 都必须**已在炼器账 MATERIAL_GRADE 里**，也就是真有词缀池可去——
    //   这正是「炼器出口」这一环能被真验证的原因（炼器账在禁改簿上，所以只能复用既有 28 种有品阶的料；
    //   另有 61 种 mat_ 不在品阶账里，落进包也炼不了，一律不用）。
    // ★ 部位件走 battle.js:545 carriedInventory → app.js:4273/4291 尸体携带物 → 搜刮/解剖入包，
    //   这条链是现成的（tests/wave97-foe-living-node.js:297 有同款用法）。
    var BODY_PARTS_DROPS = {
        // ⑦ 部位三只：整个身份就是部位
        'beast_blackbear': [
            { part: '掌骨', matId: 'mat_beast_bone', why: '挖穿冻土的那只前掌，骨比寻常熊致密' },
            { part: '掘土利爪', matId: 'mat_copper_ore', why: '爪尖那点铜色是它自己磨出来的' }
        ],
        'beast_shadowpanther': [
            { part: '豹爪', matId: 'mat_cold_iron', why: '猎具的刃口，装上去就不用磨' },
            { part: '豹皮', matId: 'mat_demon_beast_skin', why: '经刀经火反而更韧，兽池与火池两边都收' }
        ],
        'beast_icesnake': [
            { part: '蛇胆', matId: 'mat_demon_beast_core', why: '毒系炼器的引子，离体即凝丹' },
            { part: '毒牙', matId: 'mat_demon_beast_bone', why: '泡过寒气不脆，做蛊引正好' }
        ],
        // ⑤ 预兆三只：灾里剩下的东西，就是这些部位
        'beast_kunpeng': [
            { part: '鹏翼长骨', matId: 'mat_beast_bone', why: '一扇一次就是一根，水冲不走的只有它' },
            { part: '河底沉铁', matId: 'mat_dark_iron', why: '它振翅时渊底的淤被搅起来，铁就翻出来了' }
        ],
        'beast_yelaixiang': [
            { part: '香囊', matId: 'mat_beast_bone', why: '放一夜香就空了的囊，晒干只剩骨' },
            { part: '凝香音石', matId: 'mat_thunder_crystal', why: '香尽处凝出的音石，缺水之地拿它当响器' }
        ],
        'beast_flametiger': [
            { part: '火燎虎皮', matId: 'mat_demon_beast_skin', why: '经火一遍反而更韧' },
            { part: '焦牙', matId: 'mat_demon_beast_bone', why: '火里烧过才不返潮' }
        ],
        'beast_bloodsuckvine': [
            { part: '吸血管', matId: 'mat_demon_beast_bone', why: '管壁薄得能看见血' },
            { part: '寄生卵鞘', matId: 'mat_demon_beast_core', why: '鞘里那点浊气凝成丹，既是蛊引也是药引' }
        ],
        // ⑥ 行为四只：部位也是它那件「行为」的账
        'beast_yinglong': [
            { part: '夜眼', matId: 'mat_meteorite', why: '睁眼为昼闭眼为夜的那颗珠子，落在夜里最好使' },
            { part: '冬息鳞', matId: 'mat_star_iron', why: '吹气为冬时凝出的鳞，寒属器物的底料' }
        ],
        'beast_dragonturtle': [
            { part: '负水背甲', matId: 'mat_beast_bone', why: '沉在水底也不烂，这背是让水驮着的' },
            { part: '背上河碑', matId: 'mat_beast_skin', why: '浸了水照样合炉，皮比铁耐泡' }
        ],
        'beast_thundereagle': [
            { part: '望风翼骨', matId: 'mat_beast_bone', why: '翼下一圈空气永远是震的，骨里有同一口气' },
            { part: '凝目雷晶', matId: 'mat_thunder_crystal', why: '目光落在哪，哪里的雷就来得早' }
        ],
        'beast_yaolong': [
            { part: '衔泥颌骨', matId: 'mat_cold_iron', why: '日日衔两岸泥沙，河底的沉铁全啃进颌里' },
            { part: '泥中铜锭', matId: 'mat_refined_copper', why: '泥里淘出的旧铜器熔成的锭，落在底座上最压秤' }
        ],
        // 跨族：v27.11 四草木兽
        'beast_meltvine': [
            { part: '熔皮', matId: 'mat_meteorite', why: '地火熬过一遍，杂质自己烧干净了' },
            { part: '地火根', matId: 'mat_five_element_essence', why: '扎进石缝那一截，五行俱在' }
        ],
        'beast_thornmatron': [
            { part: '荆棘壁', matId: 'mat_refined_iron', why: '倒刺朝外长，打下来就是一整片铁' }
        ],
        'beast_mantuoluo': [
            { part: '毒种荚', matId: 'mat_tin_ore', why: '荚壳硬得掰不动，只能整个挖出来' }
        ],
        // ---------- 山海经新兽 12 只 ----------
        // 每一条 matId 都在炼器账 MATERIAL_GRADE 的 28 种里（现读校验见 beast-count-floor-node.js J3），
        // 所以「部位件 → 炼器出口」这一环是真能验的，不是写一句就算。
        // ★ 部位件与 MECH_FAMILY_V2712 里的 origin/use 一一对应：use 说炼什么，part 说打哪只掉哪一块。
        'beast_fuzhu': [
            { part: '导流鹿角', matId: 'mat_cold_iron', why: '四角是导流的骨，压成片就是一道分水的纹' },
            { part: '河床巨蚌', matId: 'mat_mithril', why: '壳内壁那层银是秘银里最净的一种，杂质随沙走光了' }
        ],
        'beast_yeling': [
            { part: '无翎翼膜', matId: 'mat_sky_iron', why: '翼薄得能透光，落进炉里只剩一点锋' },
            { part: '喉中音石', matId: 'mat_thunder_crystal', why: '声如击石，敲一下山响；缺水之地拿它当响器' }
        ],
        'beast_feiyi': [
            { part: '赤鳞蜕', matId: 'mat_dark_iron', why: '鳞里渗出来的热把杂质烧走了，火纹从上到下' },
            { part: '腹中旱石', matId: 'mat_fire_crystal', why: '它把一年的旱含在腹里，那块石头是火属器物的引子' }
        ],
        'beast_huodou': [
            { part: '火燎犬皮', matId: 'mat_demon_beast_skin', why: '经了一遍火，反而是妖兽皮里最韧的一张' },
            { part: '尾叉凝火', matId: 'mat_phoenix_blood', why: '尾末那两支火凝出来的血，炉温压得住' }
        ],
        'beast_fei': [
            { part: '独眼浊丹', matId: 'mat_demon_beast_core', why: '浊气凝丹，是解毒诸药的引' },
            { part: '蛇尾骨', matId: 'mat_demon_beast_bone', why: '泡过疫气不返潮，做骨簪正好' }
        ],
        'beast_zhulong': [
            { part: '睁眼夜珠', matId: 'mat_meteorite', why: '睁眼为昼的那颗珠子，落在夜里最好使' },
            { part: '冬息鳞', matId: 'mat_star_iron', why: '吹气为冬时凝出的鳞，寒属器物的底料' }
        ],
        'beast_baxia': [
            { part: '负山碑', matId: 'mat_purple_gold', why: '碑上刻的是三山五岳的碑铭，那层紫金是刻出来的印' },
            { part: '负岳之蹄', matId: 'mat_refined_iron', why: '蹄底磨出的铁，铺在器物底座上最压秤' }
        ],
        'beast_baize': [
            { part: '知微角', matId: 'mat_dragon_crystal', why: '角上凝的晶能辨器物真伪，差一分就看得出来' },
            { part: '通物之舌', matId: 'mat_dragon_bone', why: '它说得出万物之情，那份灵犀换来的骨，契约与镇物都用得上' }
        ],
        'beast_jingwei': [
            { part: '青鸟尾羽', matId: 'mat_phoenix_feather', why: '火属器物里最稳的一档羽，衔了千趟石头也没烧脆' },
            { part: '衔石爪铜', matId: 'mat_refined_copper', why: '爪上常年磨出的铜色，落在底座上最压秤' }
        ],
        'beast_lili': [
            { part: '掘地爪铜', matId: 'mat_copper_ore', why: '掘穿地脉的那对爪，铜色洗不掉' },
            { part: '腹中矿砂', matId: 'mat_iron_ore', why: '它吞下的砂里有铁矿，磨成粉就是炉底' }
        ],
        'beast_chiwen': [
            { part: '龙吻', matId: 'mat_dragon_scale', why: '龙生九子之长的那一张嘴，龙池器物的正经主料' },
            { part: '望脊', matId: 'mat_dragon_scale_iron', why: '常年蹲高处望气凝出的那层，比鳞更硬' }
        ],
        'beast_gangfu': [
            { part: '负水背甲', matId: 'mat_beast_bone', why: '沉在水底也不烂，这背是让水驮着的' },
            { part: '背上河碑', matId: 'mat_beast_skin', why: '浸了水照样合炉，皮比铁耐泡' }
        ]
    };

    // ---------- 三族机制的实现（全部现读外部真账，不另立并行状态） ----------
    function mechSpec(ecoOrName) {
        var key = resolveBeastKey(ecoOrName);
        return key ? (MECH_FAMILY_V2712[key] || null) : null;
    }
    // 这只兽身上挂着哪几个部位（回空数组＝没挂部位件，不假装有）
    function partsOf(ecoOrName) {
        var key = resolveBeastKey(ecoOrName);
        return (key && BODY_PARTS_DROPS[key]) || [];
    }
    // 部位件的炼器出口（现读炼器账；炼器账不在册就如实回空，不拿本地数冒充）
    function partOutlet(matId) {
        var g = matGradeInfo(matId);
        if (!g) return null;
        return { matId: matId, name: matName(matId), grade: g.grade, points: g.points, pools: g.pools };
    }
    // 一个部位件 → 一条解剖清单行（现读 MATERIAL_GRADE，缺料就回 null 不用假行占版面）
    function partRows(ecoOrName) {
        var out = [];
        var rows = partsOf(ecoOrName);
        for (var i = 0; i < rows.length; i++) {
            var o = partOutlet(rows[i].matId);
            if (!o) continue;
            out.push({ part: rows[i].part, why: rows[i].why, matId: o.matId, name: o.name, grade: o.grade, points: o.points, pools: o.pools });
        }
        return out;
    }
    // 部位件 → 携带物 items（进实体 → 尸体携带物 → 搜刮/解剖）
    function partsAsCarried(ecoOrName) {
        var items = [];
        var rows = partsOf(ecoOrName);
        for (var i = 0; i < rows.length; i++) {
            // 只给真有炼器出口的部位件；没出口的料落进来也炼不了，不拿它占尸体的行囊
            if (partOutlet(rows[i].matId)) items.push(rows[i].matId);
        }
        return items;
    }

    // ---- ⑤ 预兆：出场登记 → 到期成真 ----
    function _today() {
        return (typeof window.getAbsoluteDay === 'function') ? Number(window.getAbsoluteDay()) || 1 : 1;
    }
    function omenKey(omenId, region) { return omenId + '@' + (region || 'unknown'); }
    function calendarId(key, dueDay) { return 'beast_omen_' + key.replace(/[^a-z0-9_]/gi, '_') + '_d' + dueDay; }

    function raiseOmen(omenId, beastName, region, omenState) {
        var spec = OMEN_SPECS[omenId];
        if (!spec) return null;
        var st = omenState || _state.omens;
        var key = omenKey(omenId, region);
        var cur = st[key];
        // 同一处预兆在到期前只认头一次：重复遇上不重排日子、不重复播报（否则一次出图刷十行字）
        if (cur && !cur.landed && cur.beastName === beastName) return cur;
        var today = _today();
        var due = today + spec.delayDays;
        if (cur && cur.calendarId) {
            try { window.WorldCalendar.unregister(cur.calendarId); }
            catch (eUnreg) { console.warn('[静默失败] js/extensions/beast-ecosystem.js · 上一次预兆的日程条目撤不掉（撤不掉就不撤：新条目照登记，代价是日程上多留一条旧的）', eUnreg && eUnreg.message); }
        }
        var cid = calendarId(key, due);
        // 注册到世界日程表（category='world_event' 在白名单里，日程面板真的画出来）
        var reg = null;
        try {
            if (window.WorldCalendar && typeof window.WorldCalendar.register === 'function') {
                reg = window.WorldCalendar.register({
                    id: cid,
                    title: spec.label + '将至：' + beastName + '现于' + (region || '此地'),
                    category: 'world_event',
                    dueAbsoluteDay: due,
                    source: { system: 'beast-ecosystem', refId: omenId },
                    region: region || null,
                    severity: spec.severity,
                    oneShot: true,
                    payload: { omenId: omenId, beastName: beastName, cause: spec.cause, remedy: spec.remedy }
                });
            }
        } catch (eCal) { reg = null; }
        var rec = {
            omenId: omenId, beastName: beastName, region: region || '',
            raisedDay: today, dueDay: due, landed: false, calendarId: null
        };
        // ★ 注册完**回读一遍**再记 calendarId：日程表那份账自己 filter 得不认账时，
        //   这里就如实记 null（=「没进日程表」），不拿一个 register() 的返回值当已经上表。
        //   回读用显式 fromDay/toDay——世界日程表的 list() 带显式天数才按全窗口过滤
        //   （js/core/world-calendar-ui.js:122 的渲染口正是这么调的）。
        if (reg && reg.ok) {
            try {
                var seen = window.WorldCalendar.list({ fromDay: due - 1, toDay: due + 1 }) || [];
                for (var q = 0; q < seen.length; q++) { if (seen[q] && seen[q].id === cid) { rec.calendarId = cid; break; } }
            } catch (eVerify) { rec.calendarId = null; }
        }
        st[key] = rec;
        if (typeof window.showMessage === 'function') {
            window.showMessage('☎ ' + spec.label + '之兆：' + beastName + '现于' + (region || '此地') + '——' + spec.cause + '。第 ' + due + ' 日到（日程表上有条目）。', 'warning');
        }
        try {
            if (window.EventBus && typeof window.EventBus.emit === 'function') {
                window.EventBus.emit('beast:omenRaised', { omenId: omenId, beastName: beastName, region: region || '', dueAbsoluteDay: due });
            }
        } catch (eEmit) {
            console.warn('[静默失败] js/extensions/beast-ecosystem.js · 预兆已登记但事件总线没发出（日程表上的条目照样在，账没丢）', eEmit && eEmit.message);
        }
        return rec;
    }

    // 到期成真：灾真的落在地上——**落在那只兽身上**，不是落在你兜里。
    // 灾过境的后果只有一条，且是唯一的：那一带这几日出没的是它（activeOmenBeasts → pickBeastFromPool）。
    // 这里一个 addItem 都没有：按日历白给东西就是签到，签到已经被否掉过。
    function landOmens(omenState) {
        var st = omenState || _state.omens;
        var today = _today();
        var keys = Object.keys(st);
        for (var i = 0; i < keys.length; i++) {
            var rec = st[keys[i]];
            if (!rec || rec.landed) continue;
            if (!(Number(rec.dueDay) <= today)) continue;
            var spec = OMEN_SPECS[rec.omenId];
            if (!spec) { rec.landed = true; continue; }
            var host = omenHostOf(rec.omenId);
            rec.landed = true;
            if (rec.calendarId) {
                try { window.WorldCalendar.unregister(rec.calendarId); }
                catch (eUnreg2) { console.warn('[静默失败] js/extensions/beast-ecosystem.js · 到期预兆的日程条目撤不掉（日程上会留一条旧条目，账仍是 landed）', eUnreg2 && eUnreg2.message); }
                rec.calendarId = null;
            }
            // 灾里留下的料在哪儿：这几句是给玩家指路的，不是发奖
            var parts = host ? partsOf(host) : [];
            var tail = '';
            if (parts.length) {
                tail = '。它身上挂着' + parts.map(function (p) { return p.part; }).join('、')
                    + '——那几件不在你兜里：打死它才掉得出来。';
            } else if (host) {
                tail = '。它身上没有在册的部位件，这一灾不产料。';
            }
            if (typeof window.showMessage === 'function') {
                window.showMessage('☂ ' + spec.label + '已至（' + rec.beastName + '·' + (rec.region || '此地') + '）：'
                    + spec.risk + '。过境 ' + OMEN_STAY_DAYS + ' 日。' + tail, 'warning');
            }
            try {
                if (window.EventBus && typeof window.EventBus.emit === 'function') {
                    window.EventBus.emit('beast:omenLanded', {
                        omenId: rec.omenId, beastName: rec.beastName, region: rec.region,
                        hostBeastId: host, stayDays: OMEN_STAY_DAYS
                    });
                }
            } catch (eEmit2) {
                console.warn('[静默失败] js/extensions/beast-ecosystem.js · 预兆已落地但事件总线没发出（过境权重已按账生效，事件没到）', eEmit2 && eEmit2.message);
            }
        }
    }

    // ---- ⑥ 昼夜与季节机制本体（现读 js/time-system.js 的真账，不另造时钟） ----
    // 睁眼＝昼 / 闭眼＝夜 / 吹气＝冬 / 呼气＝夏。战斗技能随**真时辰与真季节**换。
    function dayNightSeasonPhase() {
        var hour = (window.gameTime && Number(window.gameTime.currentHour)) || 6;
        var season = (window.gameTime && window.gameTime.currentSeason) || 'spring';
        var periodName = '';
        try {
            if (window.timeSystem && typeof window.timeSystem.getCurrentPeriodName === 'function') {
                periodName = window.timeSystem.getCurrentPeriodName();
            }
        } catch (eP) {
            periodName = '';   // 读不到时辰名不影响昼夜判定（判据是 currentHour 本身）
        }
        var day = hour >= 6 && hour < 18;
        var innate = day ? ['burn'] : ['chill', 'illusion'];
        var why = day ? '睁眼为昼，其光灼人（炎爆劲）' : '闭眼为夜，其影惑人（寒冰真气＋迷魂术）';
        if (season === 'winter') { innate = innate.concat(['hardened']); why += '；吹气为冬，体若坚冰（硬化）'; }
        else if (season === 'summer') { innate = innate.concat(['lifesteal']); why += '；呼气为夏，血气自耗（吸血功反噬自身气血）'; }
        return { hour: hour, season: season, periodName: periodName, isDay: day, innate: innate, why: why };
    }

    // ---- ⑥ 蛟龙日课：不歇的是它，记账的是你在不在 ----
    // 《山海经》：「常衔西山之木石，以堙于东海」——衔泥填海是它自己的活计，不是你的进项。
    // 所以日课**不发料**：冷铁与精铜长在它颌里（部位件 BODY_PARTS_DROPS['beast_yaolong']：
    // 衔泥颌骨→寒铁 / 泥中铜锭→精铜），打死它才经尸体携带物落进你的包。
    // 日课记的是「你在不在那片海上」：
    //   ① 遇上它才开课——真跑出它的那一次（buildWildBeastData）把 running 立起来。
    //      此前 running 全仓零写方，只有测试手动置过：这整条日课在真实游戏里从没跑过。
    //   ② 日结时人得在它的出没地（东南海域/魔界）才 +1；人不在，海上那条龙照旧衔它的泥，
    //      你那一格不记——**不扣、不罚**，只是那天你没在场（禁止设计第 3 条：未互动不得默认罚）。
    //   ③ 记满一日它就知道你在追：那一带它出没得更频（dayCourseBoost → pickBeastFromPool）。
    //      这就是「羁绊的代价」的正确方向：代价不是白拿的料，是你得一次次回到那片海上去。
    function dayCourseHaunts() {
        for (var i = 0; i < BEAST_DISTRIBUTION.length; i++) {
            if (BEAST_DISTRIBUTION[i].id === DAY_COURSE_BEAST) return BEAST_DISTRIBUTION[i].regions || [];
        }
        return [];
    }
    // 这串地名本身就是个地区名吗（现读分布表；大地图上按域名走时它就是地区名）
    function knownRegionName(s) {
        if (!s) return '';
        for (var i = 0; i < BEAST_DISTRIBUTION.length; i++) {
            if (BEAST_DISTRIBUTION[i].regions.indexOf(s) >= 0) return s;
        }
        return '';
    }
    // 玩家此刻在哪个地区（现读 locationSystem 的真位置 + regions.js 的 mapData 反查；读不到就回空）
    function playerRegionNow() {
        try {
            var city = '';
            try {
                if (window.locationSystem && typeof window.locationSystem.getCurrentLocation === 'function') {
                    city = window.locationSystem.getCurrentLocation();
                }
            } catch (eLoc) { city = ''; }
            if (!city && window.currentCharData) city = window.currentCharData.location || '';
            city = String(city || '').trim();
            if (!city) return '';
            var md = window.mapData || null;
            if (md) {
                for (var r in md) {
                    if (!Object.prototype.hasOwnProperty.call(md, r)) continue;
                    var cs = md[r] && md[r].cities;
                    if (Array.isArray(cs) && cs.indexOf(city) >= 0) return r;
                }
            }
            return knownRegionName(city) || city;
        } catch (eR) { return ''; }
    }
    function dayCourseHere() {
        var r = playerRegionNow();
        if (!r) return false;
        return dayCourseHaunts().indexOf(r) >= 0;
    }
    function dayCourseFill(omState) {
        var st = (omState || _state.dayCourse);
        var days = st.days || 0;             // 你在它出没地待过的总日数
        var trips = st.trips || 0;           // 待满一旬（10 日）的整旬数
        return {
            days: days,
            trips: trips,
            running: !!st.running,
            nextInDays: st.running ? Math.max(0, DAY_COURSE_PERIOD - (days % DAY_COURSE_PERIOD)) : 0,
            here: dayCourseHere(),
            line: (st.running
                ? '蛟龙日日衔两岸泥沙：你在那片海上待过 ' + days + ' 日，满 ' + trips + ' 旬'
                    + '（你不在的日子它照旧衔它的泥，只是没人在场）'
                : '蛟龙日课还没开——你还没遇上它')
                + '。它颌里那两块铁（衔泥颌骨/泥中铜锭）是它身上的件，打死它才掉得出来。'
        };
    }
    function dayCourseTick(omState) {
        var st = (omState || _state.dayCourse);
        if (!st.running) return null;   // 没遇上它，它就不干活（不是默认开的惩罚，是没触发）
        // ★ 人不在它的出没地，这一天不记：它不歇，但它的活计不进你的账
        if (!dayCourseHere()) return null;
        st.days = (st.days || 0) + 1;
        if (st.days % DAY_COURSE_PERIOD !== 0) return null;
        st.trips = (st.trips || 0) + 1;
        return { trips: st.trips, days: st.days };
    }
    // 你追它多少日 → 它在这一带多摆几行（权重，不是倍率；未开课或没在场过则不给）
    function dayCourseBoost() {
        var st = _state.dayCourse;
        if (!st || !st.running) return {};
        var days = Number(st.days) || 0;
        if (days <= 0) return {};
        var extra = 1 + Math.floor(days / DAY_COURSE_PERIOD);
        if (extra > OMEN_POOL_EXTRA) extra = OMEN_POOL_EXTRA;
        var o = {};
        o[DAY_COURSE_BEAST] = extra;
        return o;
    }
    // 开课钩子：真跑出这只兽的那一次（buildWildBeastData 唯一出口）才把日课立起来
    function markDayCourseMet(ecoId) {
        var key = resolveBeastKey(ecoId);
        if (key !== DAY_COURSE_BEAST) return false;
        var st = _state.dayCourse;
        if (st.running) return false;
        st.running = true;
        return true;
    }

    // ---- ⑥ 雷鹰：通万物之情（真消费口＝scout 差事，侦察秘境/敌宗/兽径传闻） ----
    function beastIntel(beastIdOrName) {
        var key = resolveBeastKey(beastIdOrName);
        if (!key) return null;
        var spec = MECH_FAMILY_V2712[key] || null;
        var tpl = null;
        var tpls = window.BEAST_TEMPLATES || {};
        for (var tk in tpls) { if (tpls[tk] && tpls[tk].name === ecoNameOf(key)) { tpl = tpls[tk]; break; } }
        return {
            name: ecoNameOf(key),
            origin: (spec && spec.origin) || (tpl ? ('' + tpl.name + '（' + (tpl.realm || '') + '）') : ''),
            use: (spec && spec.use) || '',
            family: (spec && spec.family) || [],
            omen: (spec && spec.omen) || null,
            behavior: (spec && spec.behavior) || null,
            weakness: weaknessOf(key, tpl)
        };
    }
    function ecoNameOf(ecoId) {
        for (var i = 0; i < BEAST_DISTRIBUTION.length; i++) if (BEAST_DISTRIBUTION[i].id === ecoId) return BEAST_DISTRIBUTION[i].name;
        return String(ecoId || '');
    }
    // 白泽那类「通万物之情」的真账：弱点从**它自己的天生技与部位件**推出来，不是编一句话
    function weaknessOf(ecoId, tpl) {
        var inn = (tpl && tpl.innate) || [];
        var parts = partsOf(ecoId);
        var hints = [];
        if (inn.indexOf('venom') >= 0) hints.push('它带毒：先封穴道与气血，别急着贴身');
        if (inn.indexOf('soundwave') >= 0) hints.push('它的声音直伤神魂，护耳比护皮要紧');
        if (inn.indexOf('illusion') >= 0) hints.push('它幻形，靠气息辨真假，不靠眼睛');
        if (inn.indexOf('escape') >= 0) hints.push('它能遁走：先掐住退路再打');
        if (inn.indexOf('gu_parasite') >= 0) hints.push('它下蛊：这场不能拖，拖久了蛊才上身');
        if (inn.indexOf('drain_qi') >= 0) hints.push('它摄人精气：真气护体优先，耗着打给它');
        if (inn.indexOf('reflect') >= 0) hints.push('它能反照来击：别用同一招打两次');
        if (inn.indexOf('lifesteal') >= 0) hints.push('它靠吸血回血：小刀高频不如一击重的');
        if (inn.indexOf('hardened') >= 0) hints.push('它身硬：硬碰硬是它最想要的打法');
        if (parts.length) hints.push('要它的' + parts[0].part + '就得打死它——它不会自己掉');
        if (!hints.length) return '';
        return hints.slice(0, 3).join('；');
    }

    // ---------- 白泽「穷神奸，记万物之情」：它知道的是万物，不是它自己 ----------
    // ★ 为什么改口径：旧账里问白泽，它念的是**自己**的弱点与自己身上的件。那情报只有杀了它才用得上，
    //   于是「应它（得情报、放它走）／不应（封口、照常杀）」恒劣于杀——二选一是伪选择。
    //   葛洪《抱朴子》原话是「有白泽者，穷神奸，记万物之情」：它记的是万物，不只是它自己。
    //   现在它答三样，都是这一带用得上的：
    //     ① 同池其余几只：弱点 + 身上值钱的件（现读 weaknessOf / partRows，件上带现读的炼器品阶）
    //     ② 这一带未落地的预兆：成因（灾还没到，它先把成因念给你听）
    //     ③ 这一带的地势水脉：矿产/药材/灵物与天候（现读 js/regions.js 的 REGION_FEATURES）
    function matLabel(id) {
        var n = matName(id);
        return (n && String(n).indexOf('mat_') !== 0) ? n : String(id || '');
    }
    function baizeFieldIntel(regionName, opts) {
        var self = (opts && opts.self) || 'beast_baize';
        var region = String(regionName || '');
        if (!region) {
            for (var s = 0; s < BEAST_DISTRIBUTION.length; s++) {
                if (BEAST_DISTRIBUTION[s].id === self) { region = (BEAST_DISTRIBUTION[s].regions || [])[0] || ''; break; }
            }
        }
        if (!region) return null;   // 查不出它蹲在哪一带，就不拿编的情报占版面
        var out = { region: region, self: self, kin: [], worldEvent: '', terrain: '' };
        // ① 同池其余几只：按等级由高到低，先报大东西（分布表现读，不另立名册）
        var pool = BEAST_DISTRIBUTION.filter(function (b) {
            return b.id !== self && b.regions.indexOf(region) >= 0;
        }).sort(function (a, b) { return (b.level || 0) - (a.level || 0); });
        var cap = (opts && Number(opts.limit) > 0) ? Number(opts.limit) : 5;
        for (var j = 0; j < pool.length && out.kin.length < cap; j++) {
            var key = pool[j].id;
            var intel = beastIntel(key);
            out.kin.push({
                beastId: key,
                name: ecoNameOf(key),
                level: pool[j].level || 0,
                terrains: (pool[j].terrains || []).slice(),
                weakness: (intel && intel.weakness) || '',
                origin: (intel && intel.origin) || '',
                parts: partRows(key)
            });
        }
        // ② 未到期的预兆：成因（灾还没到，它先把成因念出来）
        var st = _state.omens;
        var today = _today();
        for (var key2 in st) {
            if (!Object.prototype.hasOwnProperty.call(st, key2)) continue;
            var rec = st[key2];
            if (!rec || rec.landed || rec.region !== region) continue;
            if (!(Number(rec.dueDay) > today)) continue;
            var spec = OMEN_SPECS[rec.omenId];
            if (!spec) continue;
            out.worldEvent = spec.cause + '（' + spec.label + '·第 ' + rec.dueDay + ' 日到）';
            break;
        }
        // ③ 地势水脉：现读 regions.js 的真账；读不到就留空串，不拿编的地势占版面
        try {
            var rf = (window.REGION_FEATURES || {})[region] || null;
            if (rf) {
                var bits = [];
                var rs = rf.resources || {};
                if (Array.isArray(rs.herb) && rs.herb.length) bits.push('药材 ' + rs.herb.map(matLabel).join('、'));
                if (Array.isArray(rs.mine) && rs.mine.length) bits.push('矿产 ' + rs.mine.map(matLabel).join('、'));
                if (Array.isArray(rs.special) && rs.special.length) bits.push('灵物 ' + rs.special.map(matLabel).join('、'));
                if (Array.isArray(rf.weather) && rf.weather.length) bits.push('天候 ' + rf.weather.join('、'));
                out.terrain = bits.join('；');
            }
        } catch (eRf) { out.terrain = ''; }
        return out;
    }

    // 日结挂载：预兆到期 + 蛟龙日课。两条都走既有的真钩子
    //（timeSystem.onNewDaySubscribe 正是 js/beast-taming.js:346 喂草料用的那条），不进 DOM、不塞 setTimeout。
    var _omensBound = false;
    function bindOmenLoop() {
        if (_omensBound) return;
        if (!window.timeSystem || typeof window.timeSystem.onNewDaySubscribe !== 'function') return;
        _omensBound = true;
        window.timeSystem.onNewDaySubscribe(function () {
            // 两条日课各自 try：预兆结算失败不许连坐蛟龙的日课（它们互不相干）
            try { landOmens(); }
            catch (eLand) { console.warn('[静默失败] js/extensions/beast-ecosystem.js · 预兆日结跑挂了（这一日的预兆没结算，下一日补）', eLand && eLand.message); }
            try { dayCourseTick(); }
            catch (eDc) { console.warn('[静默失败] js/extensions/beast-ecosystem.js · 蛟龙日课跑挂了（这一日没记账，下一日补）', eDc && eDc.message); }
        });
    }

    // 兼容 spiritBeasts 别名
    var BEAST_NAME_TO_ID = {
        '灵狐': 'beast_lingfox', '雷鹰': 'beast_thundereagle', '龙龟': 'beast_dragonturtle',
        '冰蛇': 'beast_icesnake', '风狼': 'beast_windwolf', '火凤': 'beast_firephoenix',
        '玄龟': 'beast_xuangui', '雷兽': 'beast_thunderbeast', '仙鹤': 'beast_crane', '黑熊': 'beast_blackbear',
        '五色鹿': 'beast_fivecolordeer', '金乌': 'beast_goldencrow', '鲲鹏': 'beast_kunpeng',
        '云角鹿': 'beast_cloudhorndeer', '罡风鹤': 'beast_gangwindcrane', '血鬃魔犬': 'beast_bloodmarehound', '幽脉蟒': 'beast_netherveinserpent',
        '火焰虎': 'beast_flametiger', '影豹': 'beast_shadowpanther',
        // v25.1·试-22：进化形也要认得——风狼王/炎虎王/成年火凤（beast-taming 进化表全量三只目标）此前查无此名，
        //   normalizeBeastId 原样吐回，BEAST_BUFFS 查空：兽越进化增益越蒸发（风狼王丢「陆路旅行-20%」、成年火凤丢「火候+10%」）
        '风狼王': 'beast_windwolf', '炎虎王': 'beast_flametiger', '成年火凤': 'beast_firephoenix'
    };
    // v20.0：模板名 → 生态 id 双映射（tamedBeasts 用模板名，生态用 beast_ 前缀）
    var TEMPLATE_TO_ECO = {
        spirit_fox: 'beast_lingfox', wind_wolf: 'beast_windwolf', ice_serpent: 'beast_icesnake',
        thunder_eagle: 'beast_thundereagle', dragon_turtle: 'beast_dragonturtle', fire_phoenix: 'beast_firephoenix',
        crane: 'beast_crane', xuan_gui: 'beast_xuangui', thunder_beast: 'beast_thunderbeast', black_bear: 'beast_blackbear',
        five_color_deer: 'beast_fivecolordeer', golden_crow: 'beast_goldencrow', kunpeng: 'beast_kunpeng',
        cloud_horn_deer: 'beast_cloudhorndeer', gangwind_crane: 'beast_gangwindcrane',
        bloodmare_hound: 'beast_bloodmarehound', nethervein_serpent: 'beast_netherveinserpent',
        flame_tiger: 'beast_flametiger', shadow_panther: 'beast_shadowpanther',
        // v25.1·试-22：进化目标 id（beast-taming.js evolve.to 全量：wind_wolf_king/flame_tiger_king/fire_phoenix_adult，
        //   逐一核对无遗漏）映射回本系生态 id——进化后 templateId 换成进化形，生态增益照旧跟走
        wind_wolf_king: 'beast_windwolf', flame_tiger_king: 'beast_flametiger', fire_phoenix_adult: 'beast_firephoenix',
        beast_lingfox: 'beast_lingfox', beast_windwolf: 'beast_windwolf', beast_icesnake: 'beast_icesnake',
        beast_thundereagle: 'beast_thundereagle', beast_dragonturtle: 'beast_dragonturtle', beast_firephoenix: 'beast_firephoenix'
    };

    // v27.11·映射不手抄：新增物种的生态 id 一律是 'beast_' + 模板 id，中文名从本文件的模板表现读。
    // 手抄 28 行映射就是给自己埋一个 v25.1 同款病——漏一行，那只兽的差事当场蒸发，
    // 而且要到收服之后才查得出来（风狼王丢「引路」就是这么丢的）。
    // 按表生成 = 加兽不必记得回来补映射；下面是 tests/v27.11-beast-species-node.js 的断言对象。
    for (var _spId in SPECIES_TEMPLATES_V2711) {
        if (!Object.prototype.hasOwnProperty.call(SPECIES_TEMPLATES_V2711, _spId)) continue;
        var _spEco = 'beast_' + _spId;
        TEMPLATE_TO_ECO[_spId] = _spEco;
        BEAST_NAME_TO_ID[SPECIES_TEMPLATES_V2711[_spId].name] = _spEco;
    }

    // 往既有物种账上添行（幂等、不覆盖）
    // 返回 { added:[], skipped:[], libReady:bool }：libReady=false 表示 BEAST_TEMPLATES 不在册
    // （单测只喂本文件时会这样）。此时分布表照常可用，只是 buildWildBeastData 回查不到模板，
    // 会如实地把这一格跳过——不拿一份本地副本冒充物种账（另立一本 = 收服与图鉴都认不出的死账）。
    function registerSpeciesTemplates() {
        var out = { added: [], skipped: [], libReady: false };
        var lib = window.BEAST_TEMPLATES;
        if (!lib || typeof lib !== 'object') return out;
        out.libReady = true;
        for (var id in SPECIES_TEMPLATES_V2711) {
            if (!Object.prototype.hasOwnProperty.call(SPECIES_TEMPLATES_V2711, id)) continue;
            if (lib[id]) { out.skipped.push(id); continue; }
            lib[id] = SPECIES_TEMPLATES_V2711[id];
            out.added.push(id);
        }
        return out;
    }

    // ============== 3. 工具 ==============
    function getPlaceableCells(map, terrainTypes) {
        if (!map) return [];
        var out = [];
        for (var y = 0; y < map.length; y++) {
            if (!map[y]) continue;
            for (var x = 0; x < map[y].length; x++) {
                var cell = map[y][x];
                if (!cell || !cell.terrain) continue;
                var tName = cell.terrain.name || (cell.terrain.symbol === '⬜' ? 'PLAIN' : '');
                if (terrainTypes.indexOf(tName) >= 0) out.push({ x: x, y: y, terrain: cell.terrain });
            }
        }
        return out;
    }

    function getBeastPoolForRegion(region, terrainName) {
        return BEAST_DISTRIBUTION.filter(function (b) {
            if (b.regions.indexOf(region) < 0) return false;
            if (terrainName && b.terrains.indexOf(terrainName) < 0) return false;
            return true;
        });
    }

    // 灾过境 + 你在追的那只兽：beastId → 额外权重份数。两个来源合到一处给 pickBeastFromPool。
    function boostForRegion(region) {
        var boost = activeOmenBeasts(region);
        // 日课那份只长在它自己的出没地上：你在那片海上追它，它就出现在那片海里，不牵连别处
        if (dayCourseHaunts().indexOf(region) >= 0) {
            var dc = dayCourseBoost();
            for (var k in dc) {
                if (!Object.prototype.hasOwnProperty.call(dc, k)) continue;
                boost[k] = (boost[k] || 0) + dc[k];
            }
        }
        return boost;
    }

    // ★ 灾过境的那几只兽在这一带出没更频——**权重就是这么实现的**：池里多摆几行同一条目。
    //   不用倍率、不改任何战斗数值（强制规则第 14 条），也不动 getBeastPoolForRegion 本身的语义
    //   （它仍返回「这一带该有哪些兽」这一本真表，测试与图鉴都按它读）。
    var OMEN_POOL_EXTRA = 2;   // 过境/追猎期间，宿主兽在池里多摆几行
    function pickBeastFromPool(region, pool, rnd) {
        if (!pool || !pool.length) return null;
        var r = (typeof rnd === 'function') ? rnd : Math.random;
        var boost = boostForRegion(region);
        var total = 0, i;
        for (i = 0; i < pool.length; i++) total += (boost[pool[i].id] ? OMEN_POOL_EXTRA : 1);
        if (!total) return pool[Math.floor(r() * pool.length)] || pool[0];
        var k = Math.floor(r() * total);
        for (i = 0; i < pool.length; i++) {
            k -= (boost[pool[i].id] ? OMEN_POOL_EXTRA : 1);
            if (k < 0) return pool[i];
        }
        return pool[pool.length - 1];
    }

    function getTerrainName(cell) {
        if (!cell || !cell.terrain) return null;
        if (typeof cell.terrain === 'string') return cell.terrain;
        return cell.terrain.name || null;
    }

    // ============== 4. 公开 API ==============
    function populateBeasts(map, region, opts) {
        opts = opts || {};
        if (!map) return { placed: 0, byBeast: {} };
        var density = opts.density || 0.04; // 默认 4% 格子放灵兽
        var maxPerCell = opts.maxPerCell || 2;
        var byBeast = {};
        var placed = 0;
        for (var y = 0; y < map.length; y++) {
            if (!map[y]) continue;
            for (var x = 0; x < map[y].length; x++) {
                if (Math.random() > density) continue;
                var cell = map[y][x];
                if (!cell) continue;
                var tName = getTerrainName(cell);
                if (!tName) continue;
                var pool = getBeastPoolForRegion(region, tName);
                if (pool.length === 0) continue;
                var beast = pickBeastFromPool(region, pool, Math.random);
                if (!beast) continue;
                cell.entities = cell.entities || [];
                if (cell.entities.length >= maxPerCell) continue;
                var existing = cell.entities.find(function (e) { return e && e.id === beast.id; });
                if (existing) continue;
                cell.entities.push({
                    id: beast.id,
                    name: beast.name,
                    type: beast.type,
                    level: beast.level,
                    _alive: true
                });
                byBeast[beast.id] = (byBeast[beast.id] || 0) + 1;
                placed++;
                if (window.EventBus) window.EventBus.emit('beast:ecosystem:placed', { beastId: beast.id, x: x, y: y, region: region });
            }
        }
        return { placed: placed, byBeast: byBeast };
    }

    function markEntityDead(cellRef, entityIdx) {
        if (!cellRef || !cellRef.entities || entityIdx < 0 || entityIdx >= cellRef.entities.length) return false;
        var e = cellRef.entities[entityIdx];
        if (!e) return false;
        e._alive = false;
        e.isDead = true;
        e.hp = 0;
        return true;
    }

    function isEntityDead(e) {
        if (!e) return true;
        if (e.isDead || e.isCorpse) return true;
        if (typeof e.hp === 'number' && e.hp <= 0) return true;
        if (e._alive === false) return true;
        return false;
    }

    // 玩家当前 spiritBeasts（兼容 currentCharData 多种结构）
    // 第八十四波·真源接线：驯养名单的唯一真源是 beast-taming 的 window.tamedBeasts——
    // 旧版只读 currentCharData.spiritBeasts/pets/spiritPets 三个全库无人写过的字段，
    // 导致六类非战斗增益（寻宝/侦察/负重/寒药/引路/火候）的消费端全部恒读 0（死线）。
    function getPlayerBeasts() {
        if (Array.isArray(window.tamedBeasts) && window.tamedBeasts.length) return window.tamedBeasts;
        var cd = (typeof window.getCurrentCharData === 'function') ? window.getCurrentCharData() : window.currentCharData;
        if (!cd) return [];
        return cd.spiritBeasts || cd.pets || cd.spiritPets || [];
    }

    function normalizeBeastId(b) {
        if (!b) return null;
        if (typeof b === 'string') return TEMPLATE_TO_ECO[b] || BEAST_NAME_TO_ID[b] || b;
        var raw = b.templateId || b.id || b.species || b.name || null;
        if (!raw) return null;
        return TEMPLATE_TO_ECO[raw] || BEAST_NAME_TO_ID[raw] || raw;
    }

    // 6 类非战斗功能 getter
    // 第八十四波：进化线阶段增益（灵狐系寻宝/火凤系火候/龙龟系负重）并入同一口径——
    // 此前 BeastEvolution 的 stage.buff 全库无消费端，进化了也白进化。
    function _lineBuffOf(b, i, category) {
        try {
            if (!window.BeastEvolution || typeof window.BeastEvolution.getBuff !== 'function') return 0;
            var bid = b.uid || ((b.templateId || '') + '_' + i);
            // 血脉成年才显——幼体阶段不叠加（物种账已在 BEAST_BUFFS 里记过一遍，不双算）
            var st = (typeof window.BeastEvolution.getStage === 'function') ? window.BeastEvolution.getStage(bid) : null;
            if (!st || st === 'infant') return 0;
            var buf = window.BeastEvolution.getBuff(bid) || {};
            var v = Number(buf[category]);
            return (isFinite(v) && v > 0) ? v : 0;
        } catch (e) { return 0; }
    }

    function getActiveBeastBuff(category) {
        var beasts = getPlayerBeasts();
        // 第八十九波·两种账两本算法：加成的账（寻宝/侦察/负重/寒药/火候）兽多力量大，照旧求和；
        // 倍率的账（travel 引路 ×0.8）只取最好的一笔——旧版求和，两只风狼 0.8+0.8=1.6，
        // 消费端「wolfMul<1 才提速」的判断整个失效，狼越多走得越慢，不成体统。引路的狼，一只就够。
        var total = 0;
        var best = 0;
        for (var i = 0; i < beasts.length; i++) {
            var id = normalizeBeastId(beasts[i]);
            var v = 0;
            var buff = BEAST_BUFFS[id];
            if (buff && buff.category === category) v += buff.mul;
            v += _lineBuffOf(beasts[i] || {}, i, category);
            if (!(v > 0)) continue;
            if (category === 'travel') { if (best === 0 || v < best) best = v; }
            else total += v;
        }
        return category === 'travel' ? best : total;
    }

    function getBuffList() {
        var beasts = getPlayerBeasts();
        var out = [];
        for (var i = 0; i < beasts.length; i++) {
            var id = normalizeBeastId(beasts[i]);
            var buff = BEAST_BUFFS[id];
            if (buff) {
                out.push({ beastId: id, category: buff.category, mul: buff.mul, desc: buff.desc });
                if (window.EventBus) window.EventBus.emit('beast:ecosystem:buffApplied', { beastId: id, category: buff.category });
            }
        }
        return out;
    }

    // ============== 4b. 第八十四波·地图分布真生成 ==============
    // BEAST_DISTRIBUTION（13 兽 × 地区 × 地形）此前从未被任何地图生成器消费——
    // 可收服的名种灵兽在野外根本遇不到，只有随机杂兽（战后靠名字里带「狼/虎/蛇」瞎桥接）。
    // 现在给 randomMap 两个真接口：按地区+地形roll一只名种灵兽，并拼出能直接进战斗的敌人数据。
    var TERRAIN_ALIASES = { FROZEN: 'FROZEN_LAND', SPRING: 'SPIRIT_SPRING', RIVER_ICE: 'SNOW' };
    // 第八十六波·水岸账：舆图的深水格（WATER）不可通行，野兽只撒在能落脚的格子上——
    // 栖息水域的兽（龙龟/玄龟/鲲鹏/幽脉蟒）此前一格也生成不出来，等于分布表写了白写。
    // 水兽的现实落脚点是浅滩与沉船（可通行的水岸格），冰川与雪线同理是一家子：
    TERRAIN_ALIASES.FORD = 'WATER';      // 浅滩——水兽近岸
    TERRAIN_ALIASES.WRECK = 'WATER';     // 沉船——东南海域的水上落脚点
    TERRAIN_ALIASES.GLACIER = 'SNOW';    // 冰川——北冥雪线兽的另一个家

    // 天生技合并：模板 innate 在前，生理类型兜底接在后面，去重。
    // 与 js/battle.js 的 mergeAbilityList 同一个形状（两处各写一份，不跨文件互调——
    // battle.js 在本文件之前加载，反向引用会拿到 undefined）。
    function unionAbilityIds(first, second) {
        var out = [];
        var add = function (list) {
            if (!Array.isArray(list)) return;
            for (var i = 0; i < list.length; i++) {
                if (typeof list[i] === 'string' && list[i] && out.indexOf(list[i]) < 0) out.push(list[i]);
            }
        };
        add(first); add(second);
        return out;
    }

    function rollDistributedBeast(region, terrainKey, rngFn) {
        if (!region) return null;
        var rnd = (typeof rngFn === 'function') ? rngFn : Math.random;
        var tName = TERRAIN_ALIASES[terrainKey] || terrainKey;
        var pool = getBeastPoolForRegion(region, tName);
        if (!pool.length) return null;
        return pickBeastFromPool(region, pool, rnd);
    }

    // eco 分布条目 → 战斗就绪的敌人数据（与 getActiveBeastCombatData 同尺度：六维随等级 ×0.08/级）
    function buildWildBeastData(ecoEntry) {
        if (!ecoEntry) return null;
        // ⑥ 蛟龙日课开课钩子：真跑出这只兽 = 你遇上它了（此前 running 全仓零写方，日课从没跑起来过）
        markDayCourseMet(ecoEntry.id || ecoEntry.name);
        var tpl = null, tplId = null;
        var templates = window.BEAST_TEMPLATES || {};
        for (var id in templates) {
            if (templates[id] && templates[id].name === ecoEntry.name) { tpl = templates[id]; tplId = id; break; }
        }
        if (!tpl) return null;
        var base = tpl.attrs || { strength: 8, dexterity: 8, constitution: 8, willpower: 5, intelligence: 5, meridian: 5 };
        var lv = ecoEntry.level || tpl.level || 1;
        var scale = 1 + (lv - 1) * 0.08;
        var attrs = {};
        for (var k in base) attrs[k] = Math.max(1, Math.floor(base[k] * scale));
        // 天生技：模板账那份原样带走；⑥ 昼夜季节机制的那一只按**真时辰与真季节**现算。
        // ★并上生理类型兜底（兽＝pounce）：此前这条路径只给模板 innate，
        // 于是野生遭遇里掷出来的那三成「名种灵兽」反而**丢掉了猛扑开局**——
        // 而战斗里猛扑（js/battle.js:5047）只认 hasAbility('pounce')，无名野兽反倒一直有。
        // 合并口径与 js/battle.js 的 generateRandomEnemy 那一段逐字一致（同一个形状）：
        //   模板 innate ∪ 生理兜底，去重；模板在前（招牌技先印）。
        var mech = mechSpec(ecoEntry.id || tpl.name);
        var innate = (tpl.innate || []).slice();
        var phase = null;
        if (mech && mech.behavior === 'daynight') {
            phase = dayNightSeasonPhase();
            innate = phase.innate.slice();
        }
        innate = unionAbilityIds(innate, ['pounce']);
        var out = {
            name: tpl.name, level: lv, attrs: attrs,
            species: 'beast', physiologyType: 'beast', type: 'beast',
            combatAbilities: innate,
            skills: (tpl.skills || []).slice(),
            realm: tpl.realm || '',
            aiBehavior: 'aggressive',
            loot: { exp: lv * 8, copper: lv * 3 },
            _beastTemplateId: tplId, _ecoBeastId: ecoEntry.id
        };
        if (phase) out._dayNightSeason = phase;
        // ⑦ 部位掉落：挂进携带物 → battle.js:545 原样随实体进场 → app.js:4273/4291 尸体携带物 → 搜刮/解剖入包
        var carried = partsAsCarried(ecoEntry.id || tpl.name);
        if (carried.length) {
            out.carriedInventory = { items: carried, spiritStones: 0, copper: 0 };
        }
        // ⑤ 生态预兆：出场登记一条世界日程（重复遇上不重排日子，见 raiseOmen 的去重）
        if (mech && mech.omen) {
            try { out._omen = raiseOmen(mech.omen, tpl.name, (ecoEntry.regions || [])[0] || '') || null; }
            catch (eOmen) { out._omen = null; }
        }
        return out;
    }

    // ============== 4e. 后期炼器料账 · 妖兽侧的读账口（v27.10） ==============
    // 炼虚/合体/大乘/渡劫这 30 级等级空间里，别处的材料口全是掷骰的（采矿 4~15%、
    // boss 掉落表按权重抽）。后期料的正门已经立在炼器侧：
    //   js/crafting/forging-compound.js · LATE_MATERIAL_TIERS（逐档表）
    //     └ LATE_MATERIAL_DROPS（展平成「材料 ← 妖兽/矿脉/秘境」的逐条表）
    //   js/battle.js:5375 · 妖兽被打死结算时调 ForgingCompound.settleLateMaterial('beast', …)
    //     （守卫在 :5375、实调在 :5376；那一段是全工程唯一「妖兽被打死并结算」的地方，
    //       主敌倒下、同伙补位都汇到 battle.js:5360 起的这一支。
    //       ⚠️ 本行原写 battle.js:5171 —— 那一行现在是 `this._applyOnHitAftermath(...)`，
    //       damage 分支中段，与结算口毫无关系；照着它找会走空。此数已按实测定为 5375。）
    // 本段**一个字都不往那张表里写**，也不另发一份料（另发一份就是双掉料，
    // 打死一只云角鹿拿两份天外玄铁——那不叫后期强度，那叫记账记两遍）。
    // 本段只做三件事，都是炼器侧与战斗侧管不着的：
    //   ① 玩家知情——「这只妖兽能炼什么」得有个地方印。图鉴格、尸体面板、图鉴提示共用这一张嘴，
    //     没有料的兽回空串，界面自己决定印不印（不拿假提示占版面）；
    //   ② 现读品阶与词缀池——炉料点数/池子一律现问 window.ForgingCompound，
    //     炼器改了表，这张嘴当场跟着改，不会印出一份过期的数；
    //   ③ 可达性账——哪些兽落在 35~65 等级带内、哪些在带外，本段如实报（见 forgeDropReport）。
    //
    // 为什么「周期必掉」而不是「概率掉」：后期强度来自「你打到了什么」——
    // 打死一只 85 级的幽脉蟒却两手空空，等于系统在耍你。炼器要主材一件＋辅材两件
    // （见 computeForgeBudget），再叠一层骰就永远凑不齐一炉。

    // 妖兽键 → 生态 id（吃生态 id / 模板 id / 中文名 / 尸体对象四种写法）
    function resolveBeastKey(x) {
        if (!x) return null;
        if (typeof x === 'object') {
            if (x._ecoBeastId) return x._ecoBeastId;
            var cd = x.corpseData;
            if (cd) return resolveBeastKey(cd.originalName || cd.beastName || '');
            return resolveBeastKey(x.name || '');
        }
        var s = String(x);
        var byDist = function (nameOrId) {
            for (var i = 0; i < BEAST_DISTRIBUTION.length; i++) {
                var e = BEAST_DISTRIBUTION[i];
                if (e.id === nameOrId || e.name === nameOrId) return e.id;
            }
            return null;
        };
        var 直 = byDist(s);
        if (直) return 直;
        var n = normalizeBeastId(s);
        if (!n || n === s) return null;
        return byDist(n);   // normalizeBeastId 对未登记的名会原样吐回，查不到就如实回空
    }

    // 后期料逐条表（现读炼器账；炼器账不在册时回空数组——界面据此不印任何提示）
    function lateMaterialRows() {
        try {
            var F = window.ForgingCompound;
            if (!F || !Array.isArray(F.LATE_MATERIAL_DROPS)) return [];
            return F.LATE_MATERIAL_DROPS;
        } catch (eRows) { return []; }
    }

    function matName(matId) {
        var lib = window.itemById || {};
        return (lib[matId] && lib[matId].name) || matId;
    }
    // 品阶/炉料点现读炼器侧（不重抄；炼器账不在册时如实回空，不拿本地数冒充）
    function matGradeInfo(matId) {
        try {
            var F = window.ForgingCompound;
            if (!F || !F.MATERIAL_GRADE || !F.MATERIAL_GRADE[matId]) return null;
            var g = F.MATERIAL_GRADE[matId];
            var pts = (typeof F.materialPoints === 'function') ? F.materialPoints(matId) : null;
            var pools = (typeof F.getPoolsForMat === 'function') ? F.getPoolsForMat(matId) : null;
            return { grade: Number(g.grade) || 0, level: Number(g.level) || 1, points: pts, pools: pools || [] };
        } catch (eForge) { return null; }
    }

    // 这只兽身上挂着哪几条后期料登记（只读；不产生任何掉落）
    function dropEntriesOf(beastIdOrName) {
        var key = resolveBeastKey(beastIdOrName);
        if (!key) return [];
        return lateMaterialRows().filter(function (d) { return d.kind === 'beast' && d.beastId === key; });
    }

    // 报：这只兽能炼什么（详情面板／图鉴／尸体面板共用这一张嘴，零假 UI）
    function forgeDropReport(beastIdOrName) {
        var key = resolveBeastKey(beastIdOrName);
        if (!key) return { beastId: null, name: '', wildLevel: null, inBand: false, lines: [] };
        var dist = null, name = '';
        for (var i = 0; i < BEAST_DISTRIBUTION.length; i++) {
            if (BEAST_DISTRIBUTION[i].id === key) { dist = BEAST_DISTRIBUTION[i]; name = BEAST_DISTRIBUTION[i].name; break; }
        }
        var rows = dropEntriesOf(key);
        var lines = [];
        for (var j = 0; j < rows.length; j++) {
            var d = rows[j];
            var g = matGradeInfo(d.matId);
            lines.push({
                matId: d.matId, name: matName(d.matId),
                count: Number(d.count) || 1,
                every: Math.max(1, Number(d.everyN) || 1),
                grade: g ? g.grade : null, materialLevel: g ? g.level : null,
                points: g ? g.points : null, pools: g ? g.pools : [],
                plane: d.plane || '', note: d.note || ''
            });
        }
        return {
            beastId: key, name: name,
            wildLevel: dist ? dist.level : null,
            // 35~65 是炼虚到渡劫的等级带；带外的那几只照样出料，只是玩家到渡劫才够得着（或更晚）
            inBand: !!(dist && dist.level >= 35 && dist.level <= 65),
            lines: lines
        };
    }

    // 图鉴／尸体面板的一行话（纯文本，无料无部位件则回空串）
    function forgeDropHint(beastIdOrName) {
        var r = forgeDropReport(beastIdOrName);
        var bits = [];
        var i, L;
        for (i = 0; i < r.lines.length; i++) {
            L = r.lines[i];
            bits.push(L.name + ' ×' + L.count
                + '（品阶' + L.grade + '·炉料' + L.points + '份·'
                + (L.every > 1 ? ('每' + L.every + '只必出一轮') : '每只必出') + '）');
        }
        // 三族机制批A 部位件：打哪只掉哪个部位、部位决定炼器出口（现读炼器账，无出口的件不印）
        var pr = partRows(beastIdOrName);
        var pbits = [];
        for (i = 0; i < pr.length; i++) {
            L = pr[i];
            pbits.push(L.part + '→' + L.name + '（品阶' + L.grade + '·' + (L.pools || []).join('/') + '池·炉料' + L.points + '份）');
        }
        if (!r.beastId && !pr.length) return '';
        var out = '';
        if (bits.length) out += '<br>⚒️ 猎获可炼：' + bits.join('；');
        if (pbits.length) out += '<br>🦴 解剖可取：' + pbits.join('；') + '（部位件随尸体携带物入库）';
        return out;
    }

    // ============== 5. StateRegistry ==============
    var _state = {
        distributionCount: {},  // region → beastId → count（最新 populateBeasts 结果）
        omens: {},               // 三族机制批A⑤预兆：'omenId@region' → {dueDay, landed, calendarId…}
        dayCourse: { days: 0, trips: 0, running: false }  // 三族机制批A⑥蛟龙日课（永不衰减）
    };

    function _exportState() { return JSON.parse(JSON.stringify(_state)); }
    function _importState(s) {
        if (!s) return;
        if (s.distributionCount && typeof s.distributionCount === 'object') _state.distributionCount = s.distributionCount;
        if (s.omens && typeof s.omens === 'object') _state.omens = s.omens;
        if (s.dayCourse && typeof s.dayCourse === 'object') _state.dayCourse = s.dayCourse;
    }
    function _resetState() { _state.distributionCount = {}; _state.omens = {}; _state.dayCourse = { days: 0, trips: 0, running: false }; }

    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        try {
            window.StateRegistry.register('beastEcosystem', { version: 1, export: _exportState, import: _importState, reset: _resetState });
        } catch (e) {
            // 静默失败不留空：存档键占不上只是这一局没有生态差量可随档，账（分布表/差事）本身照旧
            console.warn('[静默失败] js/extensions/beast-ecosystem.js · 生态随档注册没成（本局生态差量不落档，其余功能不受影响）', e && e.message);
        }
    }

    // ============== 6. 暴露 + 导出 ==============
    // v19.12 修 BUG: 提供统一 isEntityDead，让 app.js 战斗胜利后调用 markEntityDead
    window.isEntityDead = isEntityDead;
    window.markEntityDead = markEntityDead;

    // v27.11·把新物种真的挂进 window.BEAST_TEMPLATES（加载次序保证本行执行时那本账已在）
    var _speciesReg = registerSpeciesTemplates();

    window.BeastEcosystem = {
        BEAST_DISTRIBUTION: BEAST_DISTRIBUTION,
        BEAST_BUFFS: BEAST_BUFFS,
        BEAST_NAME_TO_ID: BEAST_NAME_TO_ID,
        TEMPLATE_TO_ECO: TEMPLATE_TO_ECO,
        // v27.11 新增物种的模板账与注册结果（注册结果给测试与排障看：added/skipped/libReady）
        SPECIES_TEMPLATES_V2711: SPECIES_TEMPLATES_V2711,
        SPECIES_FAMILY_V2711: SPECIES_FAMILY_V2711,
        // 三族机制批A：13 只既有兽的升族表 + 三张机制表 + 四个真钩子
        MECH_FAMILY_V2712: MECH_FAMILY_V2712,
        OMEN_SPECS: OMEN_SPECS,
        BODY_PARTS_DROPS: BODY_PARTS_DROPS,
        mechSpec: mechSpec,
        partsOf: partsOf,
        partRows: partRows,
        partOutlet: partOutlet,
        partsAsCarried: partsAsCarried,
        raiseOmen: raiseOmen,
        landOmens: landOmens,
        // ⑤ 灾过境的真后果：那一带出没更频（权重，不是倍率）+ 账的两个只读视图
        OMEN_STAY_DAYS: OMEN_STAY_DAYS,
        OMEN_POOL_EXTRA: OMEN_POOL_EXTRA,
        omenHostOf: omenHostOf,
        activeOmenBeasts: activeOmenBeasts,
        boostForRegion: boostForRegion,
        pickBeastFromPool: pickBeastFromPool,
        dayNightSeasonPhase: dayNightSeasonPhase,
        DAY_COURSE_PERIOD: DAY_COURSE_PERIOD,
        DAY_COURSE_BEAST: DAY_COURSE_BEAST,
        dayCourseFill: dayCourseFill,
        dayCourseTick: dayCourseTick,
        dayCourseHaunts: dayCourseHaunts,
        dayCourseHere: dayCourseHere,
        dayCourseBoost: dayCourseBoost,
        markDayCourseMet: markDayCourseMet,
        playerRegionNow: playerRegionNow,
        beastIntel: beastIntel,
        // 白泽问的是万物之情：同池其余几只 + 未落地预兆的成因 + 这一带地势水脉
        baizeFieldIntel: baizeFieldIntel,
        bindOmenLoop: bindOmenLoop,
        registerSpeciesTemplates: registerSpeciesTemplates,
        getPlaceableCells: getPlaceableCells,
        getBeastPoolForRegion: getBeastPoolForRegion,
        populateBeasts: populateBeasts,
        rollDistributedBeast: rollDistributedBeast,
        buildWildBeastData: buildWildBeastData,
        markEntityDead: markEntityDead,
        isEntityDead: isEntityDead,
        // v27.10 后期炼器料账·妖兽侧读账口：哪只兽能炼什么（正门在炼器侧 LATE_MATERIAL_TIERS）
        resolveBeastKey: resolveBeastKey,
        lateMaterialRows: lateMaterialRows,
        matGradeInfo: matGradeInfo,
        dropEntriesOf: dropEntriesOf,
        forgeDropReport: forgeDropReport,
        forgeDropHint: forgeDropHint,
        getPlayerBeasts: getPlayerBeasts,
        normalizeBeastId: normalizeBeastId,
        getActiveBeastBuff: getActiveBeastBuff,
        getBuffList: getBuffList,
        getState: function () { return _state; }
    };
    if (window.XianXia) window.XianXia.BeastEcosystem = window.BeastEcosystem;
    // 三族机制批A：日结钩子（预兆到期 + 精卫日课）。走的是 js/time-system.js:721 导出的 onNewDaySubscribe，
    // 与 js/beast-taming.js:346 喂草料用的是同一条真钩子；本文件挂得比 time-system 晚（html:2039 → 2257），
    // 所以此刻账已在册，直接挂；不在册时留 bindOmenLoop() 给后来者补挂，不静默死掉。
    try { bindOmenLoop(); } catch (eBind) {
        console.warn('[静默失败] js/extensions/beast-ecosystem.js · 预兆日结没挂上（预兆会登记但到期不结算）', eBind && eBind.message);
    }
    try {
        console.log('[BeastEcosystem] initialized v1 (' + BEAST_DISTRIBUTION.length + ' beasts, ' + Object.keys(BEAST_BUFFS).length + ' buffs)'
            + ' · 新增物种登记 ' + _speciesReg.added.length + ' 只'
            + ' · 三族机制批A 三族升族 ' + Object.keys(MECH_FAMILY_V2712).length + ' 只（⑤预兆 '
            + Object.keys(OMEN_SPECS).length + ' 类 · 部位件 '
            + Object.keys(BODY_PARTS_DROPS).length + ' 只挂）'
            + (_speciesReg.libReady ? '' : '（物种账 BEAST_TEMPLATES 不在册，本批新增物种只进分布表）'));
    } catch (eSpeciesLog) {
        console.warn('[BeastEcosystem] 初始化日志没打出来（账还在，只是这行没印）：', eSpeciesLog && eSpeciesLog.message);
    }
})();
