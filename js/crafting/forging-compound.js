// ==================== forging-compound.js - 炼器·材料词缀 (v19.5 P1-2) ====================
// 对标 v18.8 路线图 §4 P1-2：法器 = 器胚 + 主材 + 辅材 + 铭纹/阵纹，材料标签决定 1~3 词缀。
// 不动 crafting.js 旧 fixed 路径；新走 executeCompoundForging。
// 第二十六波 · 锻器品质段：器有品相——炉火（锻造技能±20）六成 + 工法（词缀/铭纹）四成，评出五档；
//   品相真动数值（劣质七折、极品翻倍），极品出炉成双（同款多一件），名品定模（同款器的模子按最精的一件记）；
//   洞府炼器台的「品质+1段」从此有处兑现。

(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    // ============== 1. 材料标签映射（v19.5 P1-2） ==============
    // 基于 04-materials.js 既有 mat_* 名称推断；新标签通过 tags 数组描述其对应词缀类型
    var MATERIAL_TAGS = {
        // 玄铁类
        mat_iron_ore:        ['metal-basic'],
        mat_refined_iron:    ['metal-basic', 'magnetic'],
        mat_dark_iron:       ['xuantie', 'metal-heavy'],
        mat_cold_iron:       ['xuantie', 'frost', 'metal-heavy'],
        mat_mithril:         ['xuantie', 'luminance', 'light'],
        mat_meteorite:       ['meteor', 'star', 'metal-heavy'],
        mat_fire_crystal:    ['fenghuang', 'fire'],
        mat_purple_gold:     ['long', 'metal-heavy', 'noble'],
        mat_dragon_scale_iron:['long', 'xuantie'],
        mat_sky_iron:        ['meteor', 'xuantie'],
        mat_star_iron:       ['star', 'meteor'],
        // 雷晶
        mat_thunder_crystal: ['leijing', 'thunder'],  // 可能不存在
        // 凤羽
        mat_phoenix_feather: ['fenghuang', 'fire'],     // 可能不存在
        mat_phoenix_blood:   ['fenghuang', 'fire'],
        // 阴魂（暂无 mat_，但允许兽类/灵草等替代）
        mat_beast_soul:      ['yinhun'],                // 预留
        mat_demon_beast_core:['yinhun', 'fire'],
        mat_demon_beast_bone:['yinhun', 'beast'],
        // 龙类
        mat_dragon_scale:    ['long'],
        mat_dragon_bone:     ['long', 'beast'],
        mat_dragon_blood:    ['long', 'fire'],
        mat_dragon_crystal:  ['long', 'leijing'],
        // 兽类基础
        mat_beast_skin:      ['beast'],
        mat_beast_bone:      ['beast'],
        mat_demon_beast_skin:['beast', 'yinhun'],
        // 矿/铜
        mat_copper_ore:      ['metal-basic'],
        mat_refined_copper:  ['metal-basic', 'luminance'],
        mat_tin_ore:         ['metal-basic'],
        // 五行精华
        mat_five_element_essence:['noble', 'luminance']
    };

    // ============== 2. 词缀池（第六十波重做：五池 · 三档 · 确定性） ==============
    // 走 combatBonus 还是走 attrs：这一份键表就是判据。键名一律取项目既有字段，不新造。
    var COMBAT_BONUS_KEYS = ['attack', 'defense', 'hp', 'speed', 'critRate', 'thunderDmg', 'fireDmg', 'divine', 'qiRegen'];
    // 玩家四条定策（第六十波）：材料只给自家池的词缀 / 条数自挑但受技能封顶 / 强度零随机 /
    //   每条词缀的属性点由玩家在池里分配。本节只放「词缀账」，算式全在第 5 节。
    // attrKey 一律复用项目既有字段（attack/defense/hp/speed/divine/weight/fireDmg/thunderDmg/
    //   critRate/qiRegen），不新造英文键——这样词缀产出的数值能直接接进 combat-stats 的既有计算链。
    // tier：三档（凡品/灵品/仙品），造价 = 1/2/3 点；灵品要锻造 30、仙品要锻造 60（低技能拿不到仙品）。
    var TIER_ORDER = ['fan', 'ling', 'xian'];
    var TIER_META = {
        fan:  { id:'fan',  name:'凡品', points:1, mult:1.0,  skillGate:0  },
        ling: { id:'ling', name:'灵品', points:2, mult:2.2,  skillGate:30 },
        xian: { id:'xian', name:'仙品', points:3, mult:3.6,  skillGate:60 }
    };

    // 五池：按 MATERIAL_TAGS 既有标签归类（metal-basic/xuantie/heavy/meteor 等一个不删、一个不加）
    var AFFIX_POOLS = {
        metal:  { id:'metal',  name:'金石池', tags:['metal-basic','xuantie','metal-heavy','meteor'], desc:'金石之属：锻打、增重、坚壁' },
        fire:   { id:'fire',   name:'雷火池', tags:['leijing','thunder','fenghuang','fire'],        desc:'雷火之属：炽烈、寒凝、雷殛' },
        star:   { id:'star',   name:'星辰池', tags:['star','luminance','noble'],                    desc:'星辰之属：聚气、定神、星垂' },
        beast:  { id:'beast',  name:'兽材池', tags:['beast','yinhun'],                             desc:'兽材之属：撕咬、循血、噬魂' },
        dragon: { id:'dragon', name:'龙凤池', tags:['long'],                                       desc:'龙凤之属：龙鳞、凤羽、龙息' }
    };
    var POOL_ORDER = ['metal','fire','star','beast','dragon'];

    // 已有标签里不归任何池的三个：它们是别的池的旁注（材质倾向），本身不单独开池。
    // 照实记在这里，别让「这个标签去哪了」变成口头禅——带这些标签的材料靠同料的其他标签进池。
    var UNPOOLED_TAGS = {
        magnetic: 'refined_iron 的另一个标签；同一材料的 metal-basic 已把它送进金石池',
        frost:    'mat_cold_iron 的寒性旁注；同料的 xuantie / metal-heavy 已进金石池（冷凝走环境加成，不走标签）',
        light:    'mat_mithril 的轻盈旁注；同料的 xuantie 已进金石池（轻身是通用词缀，不靠标签）'
    };

    // 触发型词缀登记簿 —— 战斗侧接线口（第六十一波接上：js/battle.js 的 _forgeProcs）
    // 接线是怎么走的（全工程唯一一条路，不要在别处另开口子）：
    //   battle.js 的 readPlayerForgeProcs() 惰性调 registerForgeProc(id, handler) 把七条实现登记进来，
    //   登记成功 wired 翻 true；战斗结算时由 Battle.prototype._forgeProcs 按阶段调 handler。
    // **handler 为 null（没登记 / 被 registerForgeProc(id, null) 摘掉）＝ 这条术在战斗里彻底不发生**，
    // 连开战播报的名单都进不去。机制与数值全在 battle.js 的 FORGE_PROC_TUNING 一张表里，
    // 本模块只管「哪条词缀带哪条术」——分账清楚，改战斗数值不必来动炼器。
    var FORGE_PROCS = {
        reflect:  { id:'reflect',  name:'反震', flavor:'受击回震两成', wired:false, note:'战斗侧接线：battle.js _procReflect（受击之后，回震实际伤害的一部分）' },
        stun:     { id:'stun',     name:'麻痹', flavor:'雷殛手足，一息不解', wired:false, note:'战斗侧接线：battle.js _procStun（出手门 + 受击蓄势，每 N 下吃一次出手）' },
        rebirth:  { id:'rebirth',  name:'涅槃', flavor:'凤羽浴火，重塑残躯', wired:false, note:'战斗侧接线：battle.js _procRebirth（致死判定之前，一场一次）' },
        curse:    { id:'curse',    name:'诅咒', flavor:'血食者伤身三成', wired:false, note:'战斗侧接线：battle.js _procCurse（命中段逐层叠，削命中不削伤害——主公式不动）' },
        aoe:      { id:'aoe',      name:'陨星', flavor:'星陨落处，四周俱伤', wired:false, note:'战斗侧接线：battle.js _procAoe（命中之后溅射，只打已在场的其余敌人）' },
        wild:     { id:'wild',     name:'狂血', flavor:'兽性上涌，不留余力', wired:false, note:'战斗侧接线：battle.js _procWild（回合边界，气血越低越凶）' },
        roar:     { id:'roar',     name:'龙吟', flavor:'龙吟三声，方寸俱乱', wired:false, note:'战斗侧接线：battle.js _procRoar（回合边界，主敌耐久破三档各响一声）' }
    };
    var _forgeProcHandlers = {};
    // 战斗侧接线口（现在没人调；调了 handler 就真的生效，注释与实现同一条路）
    function registerForgeProc(procId, handler) {
        if (!FORGE_PROCS[procId]) return false;
        _forgeProcHandlers[procId] = typeof handler === 'function' ? handler : null;
        FORGE_PROCS[procId].wired = typeof handler === 'function';
        return true;
    }
    function getForgeProc(procId) {
        var meta = FORGE_PROCS[procId];
        if (!meta) return null;
        return { id: meta.id, name: meta.name, flavor: meta.flavor, wired: meta.wired, note: meta.note, handler: _forgeProcHandlers[procId] || null };
    }

    // 造词缀：三档数值由 base × 固定档系数（1 / 2.2 / 3.6）取整生成——查表，非随机；
    // 每档所需锻造技能 = 词缀门槛 gate + 该档 skillGate（技能低则高档自然够不着）。
    // 触发型词缀没有属性键（战斗侧待接线），base 记 0：三档造价照样随点数涨，档位值这一栏空着（不写 NaN）。
    function _affix(d) {
        var base = d.attrKey ? (Number(d.base) || 0) : 0;
        var tiers = [];
        for (var ti = 0; ti < TIER_ORDER.length; ti++) {
            var tm = TIER_META[TIER_ORDER[ti]];
            tiers.push({
                id: tm.id, name: tm.name, points: tm.points,
                val: Math.round(base * tm.mult),
                minForgeSkill: d.gate + tm.skillGate
            });
        }
        return {
            key: d.key, name: d.name, flavor: d.flavor,
            pool: d.pool, pools: d.pools,
            tag: d.tags[0],
            tags: d.tags,
            attrKey: d.attrKey || null,
            base: base,
            inverse: !!d.inverse,
            proc: d.proc || null,
            gate: d.gate,
            minForgeSkill: d.gate,
            tiers: tiers,
            rank: 0
        };
    }

    // 五池 + 通用，共 38 条。命名走仙侠造物的路子（锋锐·开刃见血 / 龙威·龙鳞覆体），
    // 属性键一律复用既有字段；数值是设计值，未做实测平衡。
    var AFFIX_POOL = [
        // ---- 金石池（metal）：metal-basic / xuantie / metal-heavy / meteor ----
        _affix({ key:'edge',      name:'锋锐', flavor:'开刃见血', pool:'metal', pools:['metal'], tags:['xuantie','metal-basic','metal-heavy','meteor'], attrKey:'attack',   base:8,  gate:5  }),
        _affix({ key:'tough',     name:'坚韧', flavor:'锻打密实', pool:'metal', pools:['metal','dragon'], tags:['xuantie','metal-basic','metal-heavy','meteor','long'], attrKey:'defense', base:8, gate:10 }),
        _affix({ key:'heavy',     name:'沉重', flavor:'压秤坠手', pool:'metal', pools:['metal'], tags:['xuantie','metal-heavy','meteor'], attrKey:'weight',   base:2,  gate:15, inverse:true }),
        _affix({ key:'gale',      name:'破风', flavor:'袭杀迅捷', pool:'metal', pools:['metal','fire','beast'], tags:['xuantie','metal-basic','metal-heavy','meteor','leijing','thunder','fenghuang','fire','beast','yinhun'], attrKey:'speed', base:4, gate:5  }),
        _affix({ key:'solid',     name:'固元', flavor:'养气护脉', pool:'metal', pools:['metal','star'], tags:['xuantie','metal-basic','metal-heavy','meteor','star','luminance','noble'], attrKey:'hp',      base:18, gate:10 }),
        _affix({ key:'starbreak', name:'碎星', flavor:'裂石开岩', pool:'metal', pools:['metal'], tags:['meteor'], attrKey:'critRate', base:4, gate:30 }),
        _affix({ key:'reflect',   name:'反震', flavor:'受击回震两成', pool:'metal', pools:['metal'], tags:['xuantie','metal-heavy'], proc:'reflect', gate:30 }),
        // ---- 雷火池（fire）：leijing / thunder / fenghuang / fire ----
        _affix({ key:'quench',    name:'淬火', flavor:'炽烈',     pool:'fire', pools:['fire'], tags:['leijing','thunder','fenghuang','fire'], attrKey:'fireDmg',    base:10,  gate:20 }),
        _affix({ key:'chill',     name:'冷凝', flavor:'寒彻',     pool:'fire', pools:['fire'], tags:['leijing','thunder','fenghuang','fire'], attrKey:'fireDmg',    base:-8,  gate:25, inverse:true }),
        _affix({ key:'thunder',   name:'雷击', flavor:'天雷过隙', pool:'fire', pools:['fire'], tags:['leijing','thunder'], attrKey:'thunderDmg', base:8,  gate:20 }),
        _affix({ key:'drawqi',    name:'引灵', flavor:'聚气蓄势', pool:'fire', pools:['fire','star','beast'], tags:['leijing','thunder','fenghuang','fire','star','luminance','noble','beast','yinhun'], attrKey:'qiRegen', base:2, gate:20 }),
        _affix({ key:'float',     name:'轻身', flavor:'借势踏影', pool:'fire', pools:['fire','star'], tags:['leijing','thunder','fenghuang','fire','star','luminance','noble'], attrKey:'weight', base:-1, gate:15, inverse:true }),
        _affix({ key:'paralysis', name:'麻痹', flavor:'雷殛手足', pool:'fire', pools:['fire'], tags:['leijing','thunder'], proc:'stun', gate:35 }),
        // ---- 星辰池（star）：star / luminance / noble ----
        _affix({ key:'soulcalm',  name:'镇魂', flavor:'定神',     pool:'star', pools:['star','dragon'], tags:['star','luminance','noble','long'], attrKey:'divine',  base:8,  gate:25 }),
        _affix({ key:'starstrike',name:'星垂', flavor:'星坠当头', pool:'star', pools:['star'], tags:['star','luminance'], attrKey:'attack',  base:7,  gate:25 }),
        _affix({ key:'lumina',    name:'通明', flavor:'照彻幽眇', pool:'star', pools:['star'], tags:['star','luminance','noble'], attrKey:'divine', base:12, gate:30 }),
        _affix({ key:'meteorshatter',name:'陨星', flavor:'星陨落处，四周俱伤', pool:'star', pools:['star'], tags:['star','meteor'], proc:'aoe', gate:45 }),
        // ---- 兽材池（beast）：beast / yinhun ----
        _affix({ key:'rend',      name:'锐嗜', flavor:'利爪撕咬', pool:'beast', pools:['beast'], tags:['beast','yinhun'], attrKey:'attack',  base:6,  gate:15 }),
        _affix({ key:'hunt',      name:'追猎', flavor:'循血而逐', pool:'beast', pools:['beast'], tags:['beast','yinhun'], attrKey:'speed',   base:3,  gate:15 }),
        _affix({ key:'devour',    name:'噬魂', flavor:'夺人生魂', pool:'beast', pools:['beast'], tags:['yinhun','beast'],  attrKey:'divine',  base:6,  gate:25 }),
        _affix({ key:'frenzy',    name:'狂血', flavor:'兽性上涌', pool:'beast', pools:['beast'], tags:['beast','yinhun'], proc:'wild',  gate:30 }),
        _affix({ key:'hex',       name:'诅咒', flavor:'血食者伤身三成', pool:'beast', pools:['beast'], tags:['yinhun'], proc:'curse', gate:40 }),
        // ---- 龙凤池（dragon）：long ----
        _affix({ key:'dragonmight',name:'龙威', flavor:'龙鳞覆体', pool:'dragon', pools:['dragon'], tags:['long'], attrKey:'defense', base:12, gate:30 }),
        _affix({ key:'dragonbreath',name:'龙息', flavor:'龙息灼原', pool:'dragon', pools:['dragon'], tags:['long'], attrKey:'fireDmg', base:6, gate:40 }),
        _affix({ key:'dragongait',name:'龙行', flavor:'龙步无声', pool:'dragon', pools:['dragon'], tags:['long'], attrKey:'speed',   base:3,  gate:30 }),
        _affix({ key:'rebirth',   name:'涅槃', flavor:'凤羽浴火', pool:'dragon', pools:['dragon'], tags:['long'], proc:'rebirth', gate:55 }),
        _affix({ key:'roar',      name:'龙吟', flavor:'龙吟三声', pool:'dragon', pools:['dragon'], tags:['long'], proc:'roar', gate:45 }),
        // ---- 通用（tag '*'）：什么料都能出，比专属弱一档，走同一个分配体系 ----
        _affix({ key:'sharp',   name:'锋利', flavor:'刃口薄一分', pool:'*', pools:['*'], tags:['*'], attrKey:'attack',  base:4, gate:5  }),
        _affix({ key:'agile',   name:'轻灵', flavor:'器身轻三分', pool:'*', pools:['*'], tags:['*'], attrKey:'weight',  base:-1, gate:15, inverse:true }),
        _affix({ key:'precise', name:'精密', flavor:'分毫不差',   pool:'*', pools:['*'], tags:['*'], attrKey:'critRate', base:2, gate:20 })
    ];
    // rank = 词缀账里的名次（确定性排序用：同池内按名次先后，不看任何随机源）
    for (var _ri = 0; _ri < AFFIX_POOL.length; _ri++) AFFIX_POOL[_ri].rank = _ri;

    var AFFIX_BY_KEY = (function () {
        var m = {};
        for (var i = 0; i < AFFIX_POOL.length; i++) m[AFFIX_POOL[i].key] = AFFIX_POOL[i];
        return m;
    })();

    // 标签 → 词缀数组（缓存）。一个词缀可归多池，故按 tags 逐个挂。
    var AFFIX_BY_TAG = (function () {
        var m = {};
        for (var i = 0; i < AFFIX_POOL.length; i++) {
            var a = AFFIX_POOL[i];
            if (a.tag === '*') continue;
            for (var t = 0; t < a.tags.length; t++) (m[a.tags[t]] = m[a.tags[t]] || []).push(a);
        }
        return m;
    })();

    // 池 → 词缀数组（缓存）。通用词缀（tag '*'）不进池子：它不属于任何材料池，单独走 listAffixOptions 的兜底位。
    var AFFIX_BY_POOL = (function () {
        var m = {};
        for (var p = 0; p < POOL_ORDER.length; p++) {
            var arr = [];
            for (var i = 0; i < AFFIX_POOL.length; i++) {
                if (AFFIX_POOL[i].pools.indexOf(POOL_ORDER[p]) >= 0) arr.push(AFFIX_POOL[i]);
            }
            m[POOL_ORDER[p]] = arr;
        }
        return m;
    })();

    // ============== 2.5 材料品阶与等级（第六十波：总点数的第一项因子） ==============
    // 品阶 grade 0~5（粗铁→五行精华），材料等级 level。
    // 36 级以上是后期料，全部挂高阶妖兽（beast-ecosystem.js 的模板账 id 逐个对得上）；
    // 全项目玩家可用材料到 36 级为止——36 级以上靠灵界/魔界高阶妖兽产出，见 LATE_MATERIAL_DROPS。
    var MATERIAL_GRADE = {
        mat_copper_ore:           { grade:0, level:1  },
        mat_tin_ore:              { grade:0, level:1  },
        mat_iron_ore:             { grade:0, level:2  },
        mat_beast_skin:           { grade:0, level:2  },
        mat_beast_bone:           { grade:1, level:4  },
        mat_refined_copper:       { grade:1, level:5  },
        mat_refined_iron:         { grade:1, level:6  },
        mat_cold_iron:            { grade:2, level:12 },
        mat_fire_crystal:         { grade:2, level:14 },
        mat_dark_iron:            { grade:2, level:15 },
        mat_demon_beast_skin:     { grade:2, level:20 },
        mat_demon_beast_bone:     { grade:2, level:22 },
        mat_beast_soul:           { grade:2, level:12 },
        mat_mithril:              { grade:3, level:28 },
        mat_thunder_crystal:      { grade:3, level:26 },
        mat_demon_beast_core:     { grade:3, level:25 },
        mat_dragon_bone:          { grade:3, level:35 },
        mat_meteorite:            { grade:3, level:30 },
        mat_dragon_crystal:       { grade:4, level:44 },
        mat_dragon_scale:         { grade:4, level:42 },
        mat_sky_iron:             { grade:4, level:36 },
        mat_star_iron:            { grade:4, level:38 },
        mat_dragon_scale_iron:    { grade:4, level:46 },
        mat_dragon_blood:         { grade:4, level:45 },
        mat_phoenix_feather:      { grade:4, level:40 },
        mat_phoenix_blood:        { grade:4, level:48 },
        mat_purple_gold:          { grade:4, level:50 },
        mat_five_element_essence: { grade:5, level:60 }
    };
    // 后期料从哪来（第六十一波：把「表」接成「产出」）
    // 全项目玩家可用材料到 36 级为止——36 级以上靠灵界/魔界高阶妖兽、深脉矿工与秘境产出。
    //
    // ⚠️ 零骰：本作材料**没有掉率**，只有**周期**。
    //   「每 N 次必掉」＝ 掉率 100%、周期 N，与掷骰无关：同一串条件连打一百遍，第 N 次、第 2N 次… 出的料逐字节相同。
    //   计数按档记在 _moduleState.lateMatTally，随 forgingConfig 落档（读档不清零）。
    //
    // 妖兽 id 逐个对得上 js/extensions/beast-ecosystem.js 的分布表（本表不新造任何 id）；
    // 材料 id 逐个对得上 js/items-extended/04-materials.js 的实物（不新造任何 id）。
    //
    // ★ 分档判据现在**先认 id、再认等级带**（原判断据见 lateMaterialTier 那一段）。
    //   本表每一档本来就带着 beastId/beastName/beastLevel（云角鹿/血鬃魔犬/罡风鹤/幽脉蟒），
    //   LATE_MATERIAL_DROPS 也把它逐行摊出来了——**料表一直支持 ID 粒度**，缺的只是取档那一判据。
    //   四跳链路（山海经新兽批接通，此前全断）：
    //     app.js:9476 attackWildBeast(beastId) → startBattle('wild_beast', beastId)
    //       → app.js:10606 globalStartBattle 把第二参接住 → spawnOpts.beastId
    //       → battle.js:2184 点名（lookupBeastTemplate 实调在 :2186）换名与天生技
    //         → :2403 写 enemyData._beastTemplateId（★不是 :2390，那一行是 physiologyType）
    //       → battle.js:567 实体存下 → battle.js:5375 结算口透给本函数（实调 :5376）
    //         → 下面 `var wantId = c.beastId` 那段 ID 分支认到它自己那一档。
    //   ⚠️ 这几行的行号是 2026-10-04 按实测定下来的，别再照抄旧注记里的数：原注记写的是
    //     app.js:10607（那儿现在是注释 banner）、battle.js:2390（physiologyType）、battle.js:5363
    //     （_consumeFormationBuff），三个都指着不相干的地方——照着找会走空。
    //   认不中（无名野兽 / 表外新兽）仍按「击杀等级取 fromLevel ≤ 等级里最高的一档」，
    //   与改前逐字节一致——**无名野兽那条路一步没变窄**。
    var LATE_MATERIAL_TIERS = [
        {
            key: 'beast_60', kind: 'beast', fromLevel: 60,
            beastId: 'beast_cloudhorndeer', beastName: '云角鹿', beastLevel: 60, plane: '灵界',
            everyN: 2, note: '灵界云角鹿：角化铁、翎凝星，60 级起的高阶灵兽',
            drops: [ { matId: 'mat_sky_iron', count: 1 } ]
        },
        {
            key: 'beast_72', kind: 'beast', fromLevel: 72,
            beastId: 'beast_bloodmarehound', beastName: '血鬃魔犬', beastLevel: 72, plane: '魔界',
            everyN: 2, note: '魔界血鬃魔犬：心口凝核、髓里生血，72 级起',
            drops: [ { matId: 'mat_demon_beast_core', count: 1 }, { matId: 'mat_dragon_blood', count: 1 } ]
        },
        {
            key: 'beast_78', kind: 'beast', fromLevel: 78,
            beastId: 'beast_gangwindcrane', beastName: '罡风鹤', beastLevel: 78, plane: '灵界',
            everyN: 3, note: '灵界罡风鹤：翎落星砂、翼生凤羽，78 级起',
            drops: [ { matId: 'mat_star_iron', count: 1 }, { matId: 'mat_phoenix_feather', count: 1 } ]
        },
        {
            key: 'beast_85', kind: 'beast', fromLevel: 85,
            beastId: 'beast_netherveinserpent', beastName: '幽脉蟒', beastLevel: 85, plane: '魔界',
            everyN: 3, note: '魔界幽脉蟒：蜕鳞、凝晶、化血，85 级起（魔界顶档）',
            drops: [ { matId: 'mat_dragon_scale', count: 2 }, { matId: 'mat_dragon_crystal', count: 1 },
                     { matId: 'mat_dragon_scale_iron', count: 1 } ]
        },
        {
            key: 'mine_80', kind: 'mine', fromSkill: 80,
            sourceId: 'ley_vein_deep', sourceName: '高阶矿脉·深脉', everyN: 8,
            note: '采伐/锻造到天人（80）才认得出深脉；每 8 趟必出一件紫金',
            drops: [ { matId: 'mat_purple_gold', count: 1 } ]
        },
        {
            key: 'secret_48', kind: 'secret', everyN: 3,
            sourceId: 'secret_realm', sourceName: '秘境·古战场一线', everyNNote: '每 3 次秘境通关必出',
            note: '秘境通关出凤血（dungeon:completed 事件）；每 3 次通关必出',
            drops: [ { matId: 'mat_phoenix_blood', count: 1 } ]
        },
        {
            key: 'secret_60', kind: 'secret', everyN: 10,
            sourceId: 'secret_realm_deep', sourceName: '秘境·星陨古域一线', everyNNote: '每 10 次秘境通关必出',
            note: '秘境深处的五行归一（10 次通关一个大轮）',
            drops: [ { matId: 'mat_five_element_essence', count: 2 } ]
        }
    ];
    // 展平成「材料 ← 妖兽/矿脉/秘境」的逐条表（面板/验收/测试读这张；口径与 TIERS 同一份，不另写数）
    var LATE_MATERIAL_DROPS = (function () {
        var rows = [];
        for (var i = 0; i < LATE_MATERIAL_TIERS.length; i++) {
            var t = LATE_MATERIAL_TIERS[i];
            for (var d = 0; d < t.drops.length; d++) {
                rows.push({
                    matId: t.drops[d].matId,
                    count: t.drops[d].count,
                    kind: t.kind,
                    tierKey: t.key,
                    beastId: t.beastId || null,
                    beastName: t.beastName || null,
                    beastLevel: t.beastLevel != null ? t.beastLevel : null,
                    fromLevel: t.fromLevel != null ? t.fromLevel : null,
                    plane: t.plane || null,
                    sourceId: t.sourceId || null,
                    sourceName: t.sourceName || null,
                    fromSkill: t.fromSkill != null ? t.fromSkill : null,
                    everyN: t.everyN,
                    chance: 1,                       // 没有掉率这回事：必掉，周期 everyN
                    guaranteed: true,
                    cadence: '每 ' + t.everyN + (t.kind === 'beast' ? ' 只' : (t.kind === 'mine' ? ' 趟' : ' 次')) + '必掉',
                    note: t.note
                });
            }
        }
        return rows;
    })();

    // ---- 后期料的落袋口（零骰，周期必掉）----
    // 取档：beast 按击杀等级取「fromLevel ≤ 等级」里最高的一档；mine 按手艺档；secret 认 key 点名的那一档。
    //   取不到档 = 这一次不属于任何后期档 = 不给料（不是「掉了但没捡到」）。
    function lateMaterialTier(kind, ctx) {
        var c = ctx || {};
        var best = null;
        for (var i = 0; i < LATE_MATERIAL_TIERS.length; i++) {
            var t = LATE_MATERIAL_TIERS[i];
            if (t.kind !== kind) continue;
            if (kind === 'secret') {
                // 秘境有两档（凤血 3 次 / 五行精华 10 次），同一次通关两档各走各的计数——必须点名取，不许合并
                if (c.key && c.key !== t.key) continue;
                best = t;
                break;
            }
            if (kind === 'beast') {
                if (c.isBeast === false) return null;
                // ★★ ID 优先（这一段此前没有，是「按具体妖兽给料」与「按等级档给料」的分界）★★
                //
                // 先说清「料表支不支持 ID 粒度」这个前置问题的实测答案：**支持，数据早就在表里**。
                //   上面 LATE_MATERIAL_TIERS 的每一档 beast 行本来就带着 beastId / beastName /
                //   beastLevel（云角鹿/血鬃魔犬/罡风鹤/幽脉蟒四只，逐只对得上生态分布表与灵兽账），
                //   展平后的 LATE_MATERIAL_DROPS 也把 beastId 逐行摊出来了（8/11 行带 id）。
                //   缺的只是这一处**取档判据**：它从头到尾只读 c.level，从来没读过 id。
                //   ⇒ 所以这是名实一致缺陷，不是「料表只到等级档、要先加细」——不需要新表。
                //
                // 改前后的差别，逐条列清（只在这四只**有名有姓**的兽上生效）：
                //   打死 幽脉蟒 85 级  →  beast_85（与改前同）
                //   打死 云角鹿 60 级  →  beast_60（与改前同）
                //   打死 云角鹿 85 级  →  ★ beast_60（改前给 beast_85）
                //       这一笔是**修正**：改前一只 85 级的云角鹿刮下龙鳞/龙晶/龙鳞铁，而游戏在
                //       图鉴与尸体面板（beast-ecosystem.js forgeDropHint）对云角鹿明说的是天外玄铁。
                //       表承诺与实际给料本来就不一致，现在对上了。
                //   打死 幽脉蟒 40 级  →  ★ beast_85（改前不给料）
                //       点名的那只就是它自己，不该被等级门拦在外面。
                //   无名野兽 85 级     →  beast_85（与改前逐字节一致：点不中任何一档就走等级带）
                // ★ 无名野兽那条路一步没变窄：点不中就是回等级带，谁都没少拿一份。
                // ★ 认档两种写法都收：beastId（生态 id 或模板 id）与 beastName（展示名）。
                //   实体上带的是**模板 id**（battle.js:567 存的是 _beastTemplateId），
                //   而表里记的是**生态 id**，两者不是同一套命名（beast_cloudhorndeer ↔ cloud_horn_deer），
                //   所以名也要认——战斗结算口本来就把 name 传过来了（battle.js:5380 `name: this.enemy.name,`
    //   那一行，在 :5376 那次 settleLateMaterial('beast', …) 的实参里；原注记写的 :5363 是
    //   _consumeFormationBuff，与此无关，照着找会走空）。
                var wantId = c.beastId ? String(c.beastId) : '';
                var wantName = (c.name && c.beastName === undefined) ? String(c.name) : '';
                if (wantId || wantName) {
                    for (var bi = 0; bi < LATE_MATERIAL_TIERS.length; bi++) {
                        var bt = LATE_MATERIAL_TIERS[bi];
                        if (bt.kind !== 'beast') continue;
                        if ((wantId && bt.beastId === wantId) || (wantName && bt.beastName === wantName)) {
                            return bt;
                        }
                    }
                }
                // 点不中（无名野兽 / 表外新兽）：按击杀等级取「fromLevel ≤ 等级」里最高的一档——与改前逐字节一致
                var lv = Number(c.level) || 0;
                if (lv < (t.fromLevel || 0)) continue;
                if (!best || (t.fromLevel || 0) >= (best.fromLevel || 0)) best = t;
            } else if (kind === 'mine') {
                if ((Number(c.skill) || 0) < (t.fromSkill || 0)) continue;
                best = t;
            } else {
                best = t;
            }
        }
        return best;
    }
    // 结算一次后期料产出。返回 { given:[{id,name,count}], tierKey, kills, beastName, cadence }。
    // 计数落在 _moduleState.lateMatTally（随 forgingConfig 落档）；计数达周期倍数才给——给不满就是不给，不掷骰。
    function settleLateMaterial(kind, ctx) {
        var out = { given: [], tierKey: null, kills: 0, beastName: null, cadence: null };
        try {
            var t = lateMaterialTier(kind, ctx || {});
            if (!t) return out;
            var tally = _moduleState.lateMatTally || (_moduleState.lateMatTally = {});
            var n = (Number(tally[t.key]) || 0) + 1;
            tally[t.key] = n;
            out.tierKey = t.key;
            out.kills = n;
            out.beastName = t.beastName || t.sourceName || '';
            out.cadence = '每 ' + t.everyN + (kind === 'beast' ? ' 只' : (kind === 'mine' ? ' 趟' : ' 次')) + '必掉';
            if (n % t.everyN !== 0) return out;   // 未达周期：这一只也有账，只是这一笔没轮到
            for (var i = 0; i < t.drops.length; i++) {
                var d = t.drops[i];
                var got = 0;
                if (typeof window.addItem === 'function') got = Number(window.addItem(d.matId, d.count)) || 0;
                else if (window.addResultItem) got = Number(window.addResultItem(d.matId, d.count)) || 0;
                if (got > 0) {
                    // v27.13：产出登记——后期料是猎兽/矿趟的副产出而非炉中炼出，按「loot」章入簿。
                    // 登记失败不拦获得。
                    try {
                        if (window.ItemProvenance && typeof window.ItemProvenance.note === 'function') {
                            window.ItemProvenance.note('loot', d.matId, got);
                        }
                    } catch (ePrv) { console.warn('[静默失败] js/crafting/forging-compound.js · settleLateMaterial：后期料产出登记未入簿（物品照常到手）', ePrv && ePrv.message); }
                    var nm = (window.itemById && window.itemById[d.matId] && window.itemById[d.matId].name) || d.matId;
                    out.given.push({ id: d.matId, name: nm, count: got });
                }
            }
            // 一件也没落袋（行囊满）就明说，别让屏上「必掉」两个字空响
            if (!out.given.length) out.blocked = true;
        } catch (eLate) {
            console.warn('[炼器] 后期料结算出错（这一笔没进账）：', eLate && eLate.message);
        }
        return out;
    }
    // 秘境通关口：dungeon:completed 是既有事件（app.js 两处 emit），本模块订阅它，不改那些文件。
    try {
        if (window.EventBus && typeof window.EventBus.on === 'function') {
            window.EventBus.on('dungeon:completed', function (payload) {
                try {
                    var nm = (payload && (payload.dungeonName || payload.dungeonId)) || '秘境';
                    var got = [];
                    // 两档秘境料各走各的计数（凤血 3 次一轮、五行精华 10 次一轮），别并成一份
                    var sec = LATE_MATERIAL_TIERS.filter(function (t) { return t.kind === 'secret'; });
                    for (var si = 0; si < sec.length; si++) {
                        var r = settleLateMaterial('secret', { key: sec[si].key });
                        if (r.given && r.given.length) {
                            got = got.concat(r.given.map(function (g) { return g.name + ' ×' + g.count; }));
                        }
                    }
                    if (got.length && window.showMessage) {
                        window.showMessage('🏛 ' + nm + '通关，深处石匣里取出：' + got.join('、')
                            + '（秘境料按通关次数给，周期必掉，不掷骰）', 'success');
                    }
                } catch (eSec) {
                    console.warn('[炼器] 秘境后期料结算出错（这一笔没进账）：', eSec && eSec.message);
                }
            });
        }
    } catch (eSecSub) {
        // EventBus 读不到（无头/旧档）：秘境这一路不发生，其余两路照旧
    }

    // ============== 2.7 妖兽部位档位账（第七批：把「档位」铺到玩家真会打的等级段） ==============
    //
    // ★ 为什么这一段**只记账、不发料**——这是实测出来的，不是省事：
    //   全工程每一只兽的专属材料**只有一条正门**，就是尸体携带物：
    //     beast-ecosystem.js BODY_PARTS_DROPS → partsAsCarried(:1070)
    //       → buildWildBeastData(:1592) 挂 carriedInventory
    //       → battle.js:545 存实体 → app.js:4275 applyCorpse 进 corpseData.inventory
    //       → app.js:4666 dissectCorpse → 逐件入囊 ⇒ 真落背包
    //   照 仙侠.html 真实 script 顺序 eval 全 352 个 js 实测（.scratch/forge-materials-progress/_probe.js）：
    //     黑熊 lv6  → carriedInventory ["mat_beast_bone","mat_copper_ore"]
    //     雷鹰 lv12 → ["mat_beast_bone","mat_thunder_crystal"]
    //     曼陀罗花妖 lv29 → ["mat_tin_ore"]                     ★ 早就在掉料
    //     夜来香妖  lv46 → ["mat_beast_bone","mat_thunder_crystal"]  ★ 早就在掉料
    //   而 settleLateMaterial('beast', …) 对这四只一律回 null——**两条路给的是同一味料**。
    //   在这儿再补一档 = 同一味料两条正门发，也就是 beast-ecosystem.js:1610 明文骂过的
    //   「打死一只云角鹿拿两份天外玄铁——那不叫后期强度，那叫记账记两遍」。
    //   ⇒ 所以本段**不发料**，只把「打哪只 → 哪个部位 → 炼成什么」这张账铺出来、铺到每一个等级，
    //     并接进下面 5.4e 的产地账（见 buildMaterialOrigins）与知情口（beastPartReport）。
    //   真要给「无部位的兽」补料，缺口在 BODY_PARTS_DROPS 那张表本身（54 只里 28 只一条也没有），
    //   那一处在禁改簿上；本表一旦那边加了部位件，**下一帧就自动长出对应档位行**，不用返工。
    //
    // ★ 数据一律**运行时现读**，不抄一份：
    //   BODY_PARTS_DROPS 与 BEAST_DISTRIBUTION 都在 beast-ecosystem.js（仙侠.html:2264），
    //   比本文件（:2074）晚 ⇒ 必须惰性读（同一趟坑，5.4e 的 ResourcePoints 已经踩过一次）。
    //   本表**不新造任何 matId / beastId**：品阶、炉料点数、词缀池全部现问本文件的 MATERIAL_GRADE。
    var _beastPartTierCache = null;
    function _beastEco() {
        // 生态账缺席（无头/加载未到）：如实回空，档位账返回空数组——不拿本地数冒充
        try { return window.BeastEcosystem || null; } catch (eEco) { return null; }
    }
    // 一行 = 一只兽身上的一个部位件（部位件才是「打哪只掉哪个部位」的本钱，料是从部位炼出来的）
    function buildBeastPartTiers() {
        var rows = [];
        var eco = _beastEco();
        if (!eco || !eco.BODY_PARTS_DROPS) return rows;
        var dist = Array.isArray(eco.BEAST_DISTRIBUTION) ? eco.BEAST_DISTRIBUTION : [];
        for (var bi = 0; bi < dist.length; bi++) {
            var e = dist[bi];
            var parts = eco.BODY_PARTS_DROPS[e.id] || [];
            for (var pi = 0; pi < parts.length; pi++) {
                var p = parts[pi];
                var g = MATERIAL_GRADE[p.matId] || null;
                rows.push({
                    key: 'beastpart_' + String(e.id).replace(/^beast_/, '') + '_' + pi,
                    kind: 'beast-part',
                    beastId: e.id,
                    beastName: e.name,
                    beastLevel: Number(e.level) || 0,
                    region: (e.regions && e.regions[0]) || '',
                    terrains: (e.terrains && e.terrains[0]) || '',
                    part: p.part,
                    why: p.why || '',
                    matId: p.matId,
                    count: 1,
                    forgeable: !!g,                       // 没有品阶的件不进炼器出口
                    grade: g ? g.grade : null,
                    matLevel: g ? g.level : null,
                    points: (typeof materialPoints === 'function') ? materialPoints(p.matId) : null,
                    pools: (typeof getPoolsForMat === 'function') ? getPoolsForMat(p.matId) : [],
                    basis: 'js/extensions/beast-ecosystem.js BODY_PARTS_DROPS[' + e.id + '][' + pi + ']「' + p.part
                        + ' → ' + p.matId + '」（' + (p.why || '无注') + '）；兽的等级/州/地形取同文件 BEAST_DISTRIBUTION'
                });
            }
        }
        return rows;
    }
    function beastPartTiers(refresh) {
        if (refresh || !_beastPartTierCache) _beastPartTierCache = buildBeastPartTiers();
        return _beastPartTierCache;
    }
    // 生态账变了（那边加了/改了部位件）就调它，档位账下一帧重建——不设 watcher，不猜
    function refreshBeastPartTiers() { _beastPartTierCache = null; return beastPartTiers(true); }
    // 这只兽身上挂着哪几条部位档（认 id 也认展示名；认不中回空数组，不硬套同级那一档）
    function beastPartTiersOf(beastIdOrName) {
        var key = String(beastIdOrName || '');
        if (!key) return [];
        var eco = _beastEco();
        var resolved = key;
        if (eco && typeof eco.resolveBeastKey === 'function') {
            try { var rk = eco.resolveBeastKey(key); if (rk) resolved = rk; } catch (eKey) { resolved = key; }
        }
        var rows = beastPartTiers();
        return rows.filter(function (r) { return r.beastId === resolved || r.beastName === key; });
    }
    // 知情口（禁止设计 #2：条件不满足要写清原因，不许整栏静默）
    //   有部位 ⇒ 逐条报「哪个部位 → 炼成什么 → 品阶/炉料/词缀池」，并说清这一路是尸体解剖入包
    //   没部位 ⇒ 明写「这只兽在部位件账里一条也没有」，并把玩家能做的下一步说清（不编一个假档位占位）
    function beastPartReport(beastIdOrName) {
        var key = String(beastIdOrName || '');
        var rows = beastPartTiersOf(key);
        var out = { beastId: null, beastName: key, beastLevel: null, region: '', rows: [], miss: null };
        var eco = _beastEco();
        if (eco && Array.isArray(eco.BEAST_DISTRIBUTION)) {
            for (var i = 0; i < eco.BEAST_DISTRIBUTION.length; i++) {
                if (eco.BEAST_DISTRIBUTION[i].id === key || eco.BEAST_DISTRIBUTION[i].name === key) {
                    out.beastId = eco.BEAST_DISTRIBUTION[i].id;
                    out.beastName = eco.BEAST_DISTRIBUTION[i].name;
                    out.beastLevel = eco.BEAST_DISTRIBUTION[i].level;
                    out.region = (eco.BEAST_DISTRIBUTION[i].regions || [])[0] || '';
                    break;
                }
            }
        }
        out.rows = rows;
        if (!rows.length) {
            out.miss = out.beastId
                ? out.beastName + '（lv' + out.beastLevel + '）在 js/extensions/beast-ecosystem.js 的 BODY_PARTS_DROPS 里一条部位件也没有'
                  + '⇒ 打它掉不进任何炼器料（这不是掉率，是这只兽没有可解剖的部位登记）。'
                  + '补档要动那张表（不在本文件的账上）；那边一加，本表下一帧自动长出对应档位行。'
                : '查无此兽（连 BEAST_DISTRIBUTION 都没有这一条）⇒ 不判部位档，不编一个占位档给你。';
        }
        return out;
    }
    // 部位档的来路 id：一炉全用同一只兽的同一部位 ⇒ 同出一处（真的同源）；两只要混 ⇒ 如实说分属
    function _beastPartOriginId(r) { return 'beastpart:' + r.beastId + ':' + r.part; }

    // ============== 3. 器胚（5 类） ==============
    // 甲胚的 slot 必须是 equipment.js equipmentSlots 里真实存在的 id（旧账写的是 'armor'，
    // 十二槽里没有这一格 → 面板无处安放、equipItemFromInventory 取不到 targetSlot）。
    // 'body'＝身体槽（slotType: 'armor'），battle.js 的 SLOT_TO_PART_MAP.body 也正是它接躯干伤。
    var EMBRYOS = {
        sword:    { id:'emp_sword',    name:'剑胚',    slot:'mainHand', subtype:'sword',   baseDamage:'slash',  baseAttrs:{ attack:5,  speed:2 } },
        blade:    { id:'emp_blade',    name:'刀胚',    slot:'mainHand', subtype:'blade',   baseDamage:'slash',  baseAttrs:{ attack:7,  speed:1 } },
        armor:    { id:'emp_armor',    name:'甲胚',    slot:'body',     subtype:'armor',   baseDamage:null,      baseAttrs:{ defense:8, hp:20 } },
        flying:   { id:'emp_flying',   name:'飞剑胚',  slot:'mainHand', subtype:'sword',   baseDamage:'pierce', baseAttrs:{ attack:4,  speed:5, qiRegen:2 } },
        heavy:    { id:'emp_heavy',    name:'重兵胚',  slot:'mainHand', subtype:'heavy',   baseDamage:'crush',  baseAttrs:{ attack:10, defense:3 } }
    };

    // ============== 3b. 器形账（护具：coverage / resistance） ==============
    // battle.js getArmorData 只认 equipped item 上的 resistance+coverage（js/battle.js:257），
    // 自炼护具不写这两个字段 → 护甲整体判 0，applyArmorToWound 每刀都当没盖住。
    // 数值口径照 03-armor.js 的现成梯度取（皮甲 slash12/pierce8/blunt15/耐久30；
    // 玄铁甲 35/25/30/耐久80），自炼甲落在两者之间，不另开一套尺。
    // coverage 的键只写 battle.js 真会查的 BODY_PARTS id（躯干六处：chest/abdomen/dantian/
    // waist/pelvis/neck）——旧账里那个 'back' 不是部位，battle.js 永远读不到，写了等于没写。
    // 盖不盖得住由器形（形制）定，品相只真动 resistance 与 armorDurability：料好≠甲形变大。
    var ARMOR_FORMS = {
        plate: {
            id: 'plate', name: '甲胄',
            coverage: { chest: 0.75, abdomen: 0.65, dantian: 0.55, waist: 0.60, pelvis: 0.55, neck: 0.35 },
            resistance: { slash: 22, pierce: 14, blunt: 20 },
            armorDurability: 60
        },
        soft: {
            id: 'soft', name: '软甲',
            coverage: { chest: 0.55, abdomen: 0.45, dantian: 0.35, waist: 0.40, pelvis: 0.35, neck: 0.25 },
            resistance: { slash: 10, pierce: 7, blunt: 12 },
            armorDurability: 30
        }
    };
    var ARMOR_METAL_TAGS = ['metal-basic', 'xuantie', 'metal-heavy', 'meteor'];
    // 主材是金石才出甲胄，其余（皮/丝/角/灵晶）一律软甲——「非金石即软」是一条可查的规矩，
    // 不按玩家想不想要给软甲硬编一套好看的覆盖率。
    function armorFormOf(mainIds) {
        var metal = false;
        (mainIds || []).forEach(function (mid) {
            var tags = getMaterialTags(mid) || [];
            for (var i = 0; i < tags.length; i++) if (ARMOR_METAL_TAGS.indexOf(tags[i]) >= 0) metal = true;
        });
        return metal ? ARMOR_FORMS.plate : ARMOR_FORMS.soft;
    }

    // ============== 4. 开放炼器方（5 张关键） ==============
    var COMPOUND_FORGING_RECIPES = [
        {
            id: 'recipe_sword_open',  name: '长剑·开放',    category: 'forging', tags: ['开放配方', '武器', '剑'],
            requiredSkills: { '锻造': 20 },
            slots: { embryo:{type:'sword'},  main:{count:1, minForgeSkill:20}, assist:{count:2}, rune:{count:1, optional:true, minForgeSkill:40}, affixSlots:3 },
            result: { itemId: 'wpn_compound_sword', count: 1, namePrefix: true, allowImprint: true },
            qiCost: 50, timeCost: 40
        },
        {
            id: 'recipe_blade_open',  name: '长刀·开放',    category: 'forging', tags: ['开放配方', '武器', '刀'],
            requiredSkills: { '锻造': 30 },
            slots: { embryo:{type:'blade'},  main:{count:1, minForgeSkill:30}, assist:{count:2}, rune:{count:1, optional:true, minForgeSkill:50}, affixSlots:3 },
            result: { itemId: 'wpn_compound_blade', count: 1, namePrefix: true, allowImprint: true },
            qiCost: 60, timeCost: 45
        },
        {
            id: 'recipe_armor_open',  name: '护甲·开放',    category: 'forging', tags: ['开放配方', '护甲'],
            requiredSkills: { '锻造': 25 },
            slots: { embryo:{type:'armor'},  main:{count:1, minForgeSkill:25}, assist:{count:2}, rune:{count:1, optional:true, minForgeSkill:45}, affixSlots:3 },
            result: { itemId: 'arm_compound_armor', count: 1, namePrefix: true, allowImprint: true },
            qiCost: 70, timeCost: 50
        },
        {
            id: 'recipe_flying_open', name: '飞剑·开放',    category: 'forging', tags: ['开放配方', '武器', '飞剑'],
            requiredSkills: { '锻造': 50 },
            slots: { embryo:{type:'flying'}, main:{count:1, minForgeSkill:50}, assist:{count:2}, rune:{count:1, optional:true, minForgeSkill:60}, affixSlots:3 },
            result: { itemId: 'wpn_compound_flying', count: 1, namePrefix: true, allowImprint: true },
            qiCost: 120, timeCost: 90
        },
        {
            id: 'recipe_heavy_open',  name: '重兵·开放',    category: 'forging', tags: ['开放配方', '武器', '重兵'],
            requiredSkills: { '锻造': 40 },
            slots: { embryo:{type:'heavy'},  main:{count:1, minForgeSkill:40}, assist:{count:2}, rune:{count:1, optional:true, minForgeSkill:55}, affixSlots:3 },
            result: { itemId: 'wpn_compound_heavy', count: 1, namePrefix: true, allowImprint: true },
            qiCost: 90, timeCost: 70
        }
    ];

    // ============== 5. 工具（第六十波：全确定性，零随机源） ==============
    // 本节所有函数都不读 Math.random、也没有别的随机源：同一份材料 + 同一手锻造技能 + 同一环境，
    // 连调一百次结果逐字节相同（tests/legacy-forge-determinism-node.js 是这条的守门人）。

    function getMaterialTags(matId) {
        return MATERIAL_TAGS[matId] || [];
    }

    // ---- 5.1 材料 → 词缀池 ----
    // 按材料自己声明的标签顺序取池（mat_dragon_blood 的标签是 ['long','fire']，龙凤池自然排在雷火池前头），
    // 不是按 POOL_ORDER 重排——老抽取也是跟着标签顺序走的，改了这口径，材料就换了味道。
    function getPoolsForMat(matId) {
        var tags = getMaterialTags(matId);
        var out = [], seen = {};
        for (var t = 0; t < tags.length; t++) {
            for (var p = 0; p < POOL_ORDER.length; p++) {
                var pool = AFFIX_POOLS[POOL_ORDER[p]];
                if (!seen[pool.id] && pool.tags.indexOf(tags[t]) >= 0) { seen[pool.id] = 1; out.push(pool.id); }
            }
        }
        return out;
    }

    // ---- 5.2 锻造技能档：总点数加成 + 条数上限 ----
    // 条数上限 f(锻造技能等级)：学徒 2 槽、匠人 3、大师 4、宗师 5、天人 6。
    var FORGE_SKILL_TIERS = [
        { min: 0,  label: '学徒', pointBonus: 0,   slots: 2 },
        { min: 20, label: '匠人', pointBonus: 0.25, slots: 3 },
        { min: 40, label: '大师', pointBonus: 0.5,  slots: 4 },
        { min: 60, label: '宗师', pointBonus: 0.8,  slots: 5 },
        { min: 80, label: '天人', pointBonus: 1.2,  slots: 6 }
    ];
    function forgeSkillTier(skill) {
        var sk = Number(skill) || 0;
        var out = FORGE_SKILL_TIERS[0];
        for (var i = 0; i < FORGE_SKILL_TIERS.length; i++) if (sk >= FORGE_SKILL_TIERS[i].min) out = FORGE_SKILL_TIERS[i];
        return out;
    }
    // 条数上限：技能档给的槽，再被配方自身的槽位封顶（open 方是一主二辅的三槽制）
    function affixSlotLimit(skill) { return forgeSkillTier(skill).slots; }

    // 每条词缀能投的点数上限＝技能能压住的最高档（与 TIER_META.skillGate 同源，不另写魔法数）
    function maxPointsPerAffix(skill) {
        var sk = Number(skill) || 0;
        if (sk >= TIER_META.xian.skillGate) return TIER_META.xian.points;
        if (sk >= TIER_META.ling.skillGate) return TIER_META.ling.points;
        return TIER_META.fan.points;
    }

    // ---- 5.2b 槽位随料品阶增长（第六十一波：仙品要 6 槽才铺得满）----
    // 问题：五张开放方都是 affixSlots:3，而仙品档 3 点/条 ⇒ 3 槽最多投 9 点。
    //   实测炎城那一炉总点数 12 —— 3 点整被槽位挡在门外（overflow 记 3 点，屏上白说「工评」）。
    // 两条路里选 B（不改配方槽、不新增任何 item id）：
    //   A 案＝加高阶配方 ⇒ 要新造 item id、还要改挂载与文档，风险与收益不成比例；
    //   B 案＝让槽位随**主材品阶**增长 ⇒ 一个数都没多造：料越好，炉子铺得越开。
    //   并且仍被锻造技能档封顶（affixSlotLimit：学徒 2 … 天人 6）——料再好，手艺不够也铺不开。
    var GRADE_SLOT_BONUS = [0, 0, 0, 0, 1, 2]; // 品阶 0~3 不加；4（四阶料）＋1 槽；5（五行精华）＋2 槽
    function gradeSlotBonus(mainMats) {
        var g = 0;
        var list = mainMats || [];
        for (var i = 0; i < list.length; i++) {
            var row = MATERIAL_GRADE[list[i]];
            if (row && (Number(row.grade) || 0) > g) g = Number(row.grade) || 0;
        }
        return GRADE_SLOT_BONUS[Math.max(0, Math.min(GRADE_SLOT_BONUS.length - 1, g))] || 0;
    }
    // 实际条数上限 = 配方槽 + 品阶加槽，再被技能档封顶（两个上限都要，别只留一个）
    function effectiveAffixSlots(recipeSlots, skill, mainMats) {
        var base = (recipeSlots == null) ? 3 : Math.max(0, Math.floor(Number(recipeSlots) || 0));
        var withGrade = base + gradeSlotBonus(mainMats);
        return Math.max(0, Math.min(affixSlotLimit(skill), withGrade));
    }

    // ---- 5.3 总点数 = f(材料品阶, 材料等级) × (1 + 锻造技能段加成) × (1 + 环境加成) ----
    var GRADE_BASE_POINTS = [3, 4, 6, 8, 11, 15]; // 品阶 0~5 的炉料份量（粗铁 3 → 五行精华 15）
    var POINT_SCALE = 6;   // 6 份炉料 = 1 点属性点。标定口径（主材一件 + 辅材两件的常规一炉，
                            // 炉料 24 份）：匠人 5 点（全凡品）、大师 6 点（三条灵品）、
                            // 宗师 7 点（一仙二灵）、天人 9 点（三条全仙品）。
                            // 想要仙品，手艺要到 60；点数永远不会多到槽位与档位吃不下（吃不下就记 overflow）。
    var ROLE_POINT_MULT = { main: 1, assist: 0.5, rune: 1.5 }; // 主材全额、辅材半额、铭纹一个半
    var ROLE_ORDER = ['main', 'assist', 'rune'];

    function materialPoints(matId) {
        var g = MATERIAL_GRADE[matId] || { grade: 0, level: 1 };
        var grade = Math.max(0, Math.min(GRADE_BASE_POINTS.length - 1, Number(g.grade) || 0));
        return GRADE_BASE_POINTS[grade] + Math.floor(Math.max(1, Number(g.level) || 1) / 4);
    }

    function computeForgeBudget(mainMats, assistMats, runeMats, skill, env) {
        var byRole = { main: mainMats || [], assist: assistMats || [], rune: runeMats || [] };
        var breakdown = { main: 0, assist: 0, rune: 0 }, raw = 0;
        for (var r = 0; r < ROLE_ORDER.length; r++) {
            var role = ROLE_ORDER[r], list = byRole[role], sum = 0;
            for (var i = 0; i < list.length; i++) sum += materialPoints(list[i]);
            breakdown[role] = Math.round(sum * ROLE_POINT_MULT[role]);
            raw += sum * ROLE_POINT_MULT[role];
        }
        var tier = forgeSkillTier(skill);
        var e = env || null;
        // ★ 第六十二波：淬火介质与择日两轴在这里就地补进 env。
        //   补在这道门上，是因为这道门同时被面板（先算点数）与开炉（再算候选数值）调用，
        //   而且面板拿到的是**同一个 env 对象**——补在它上面，两边显示与实得才同数。
        if (e) withMaterialAxes(e, byRole.main, byRole.assist);
        var skillMult = 1 + tier.pointBonus;
        var envMult = 1 + (e ? (Number(e.pointMult) || 0) : 0);
        return {
            totalPoints: Math.max(1, Math.round(raw * skillMult * envMult / POINT_SCALE)),
            rawPoints: Math.round(raw),
            skillMult: skillMult,
            envMult: envMult,
            tier: tier,
            breakdown: breakdown
        };
    }

    // ---- 5.4 环境加成：查表，零骰 ----
    // 时辰/季节查 time-system.js 既有账（TIME_PERIODS / SEASONS，走 getCurrentPeriod/getSeasonBonus 的 id，
    //   绝不自己拿小时数 /60 口算时辰）；天气查 weather-effects.js 的 getCurrentWeather().id；地点查角色所在地名。
    var ENV_BONUS_TABLE = [
        { id:'env_period_noon_fire', kind:'period', key:'noon', label:'火云时（中午）',
          attrMult:{ fireDmg:0.15 }, pointMult:0.10,
          basis:'time-system.js TIME_PERIODS 中午段 11-13 点是全天火气最盛的一刻——火云当头，淬火这条词缀借得到势' },
        { id:'env_period_night_qi', kind:'period', key:'night', label:'夜锻',
          attrMult:{ qiRegen:0.10 }, pointMult:0.10,
          basis:'TIME_PERIODS 深夜段 21-23 点 bonus.stealth 1.2，夜气最沉——聚气蓄势（引灵）在夜锻里更稳' },
        { id:'env_season_winter_tough', kind:'season', key:'winter', label:'冬锻',
          attrMult:{ defense:0.15 }, pointMult:0.10,
          basis:'time-system.js SEASONS 冬 bonus{defense:1.10, qiRetention:1.15}——冬里铁性收，打出来的器紧实' },
        { id:'env_season_summer_chill', kind:'season', key:'summer', label:'夏锻',
          attrMult:{ fireDmg:-0.10 }, pointMult:0.10,
          basis:'SEASONS 夏 bonus{firePower:1.15}——火旺则燥气压不住，冷凝（寒彻）这条词缀正对症' },
        { id:'env_weather_storm_thunder', kind:'weather', key:'stormy', label:'雷雨天锻',
          attrMult:{ thunderDmg:0.20 }, pointMult:0.10,
          basis:'weather-effects.js WEATHER_TYPES stormy 雷雨：qiElement water、combat.fire 压到 0.5，天雷却最盛' },
        { id:'env_weather_snow_tough', kind:'weather', key:'snowy', label:'雪天锻',
          attrMult:{ defense:0.10 }, pointMult:0.05,
          basis:'WEATHER_TYPES snowy 下雪：combat.ice 1.2，寒气护体，坚韧这条词缀吃得到' },
        { id:'env_loc_fire', kind:'location', key:'炎城', label:'炎城（熔岩为河）',
          attrMult:{ fireDmg:0.15 }, pointMult:0.10,
          basis:'location-system.js 炎城「建于火山之巅的钢铁之城，熔岩为河」；qi-environment.js 炎城 base 1.4 type fire' },
        { id:'env_loc_frost', kind:'location', key:'寒潭', label:'寒潭',
          attrMult:{ fireDmg:-0.10, defense:0.10 }, pointMult:0.10,
          basis:'location-system.js 冰宫 specialFeatures 含「寒潭」；南疆 sects-deep-data 寒潭剑鸣——潭水淬性，寒彻与坚韧同涨' },
        { id:'env_loc_leylines', kind:'location', key:'灵脉', label:'灵脉旁',
          attrMult:{ qiRegen:0.15, divine:0.15 }, pointMult:0.20,
          basis:'qi-environment.js 按地名给灵气浓度，灵脉旁浓度最高——地灵到位，器里能多存一口气' },

        // ============== 5.4b 淬火介质（第六十二波：《天工开物·五金》） ==============
        // ★ 为什么这一轴挂在**辅材槽**上，不挂在地点/时辰上：
        //   上面 9 条里时辰 2、季节 2、天气 2、地点 3 都已经算「你此刻站在哪、什么时候」，
        //   再往那两根轴上加条目，玩家一点感知也没有——那不叫机制，叫查表。
        //   而辅材槽本来就是玩家每炉都要点的一步（slotPick.assist），并且只记半额炉料
        //   （ROLE_POINT_MULT.assist = 0.5）——**「辅材第一件放什么」＝「这一炉走哪种淬口」**，
        //   换淬口的价钱（半额炉料）天生就写在既有公式里，不用另发明惩罚。
        // 判据只用 MATERIAL_TAGS 里**既有**的标签，不新造字段。
        { id:'env_quench_clear', kind:'quench', key:'clear', label:'清水淬（常法）',
          attrMult:{ defense:0.10 }, pointMult:0.05,
          basis:'「入清水淬之，名曰健钢健铁」——★转引：该句见于《古今图书集成·食货典》引录，未在《天工开物·五金》铁卷原文逐字核到，故此条只挂 defense 一项浅加成，不给它 0.10 以上' },
        { id:'env_quench_dishou', kind:'quench', key:'dishou', label:'地溲淬',
          attrMult:{ attack:0.15 }, pointMult:0.10,
          basis:'《天工开物·五金》「夷人又有以地溲淬刀剑者」——地溲淬出的刃口既利且韧，故 attack 与炉料份量同涨' },
        { id:'env_quench_char', kind:'quench', key:'char', label:'炭火淬（炭十七·木炭十三）',
          attrMult:{ fireDmg:0.15 }, pointMult:0.10,
          basis:'《天工开物·五金》载燃料配比「炭居十七，木炭居十三」——炭多则火猛器坚，故只抬火伤与炉料，不动别的' },

        // ============== 5.4c 择日（第六十二波：《吴越春秋·阖闾内传》） ==============
        // 干将三月不成，《吴越春秋》把原因归给**天时地气**，不是匠人状态：
        //   「候天伺地，阴阳同光，百神临观，天气下降」——「择日」的正统依据就在这十六个字里。
        // ★ 为什么这一轴挂在**日子**上：时辰/季节/天气/地点四条都不看日子，这是第 5 根轴，零重合。
        // ★ 判据零新表：日序奇偶定阴阳（农历朔日起、阴阳相配，通例），
        //   料的阴阳从 MATERIAL_TAGS **既有**标签读——升扬者为阳（fire/leijing/thunder/fenghuang/
        //   long/star/meteor），沉降者为阴（yinhun/beast/frost），两者都不是的叫常料。
        //   常料既不给也不罚 ⇒ 不是「选了没反应的坑」，只是吃不到这一项。
        { id:'env_day_yang', kind:'day', key:'yang', label:'择日·阳日同光',
          attrMult:{ attack:0.10 }, pointMult:0.15,
          basis:'《吴越春秋·阖闾内传》「候天伺地，阴阳同光……天气下降」：阳日配阳料即同光，器里那口气与天时相得，炉料多认 15%' },
        { id:'env_day_yin', kind:'day', key:'yin', label:'择日·阴日同光',
          attrMult:{ defense:0.10 }, pointMult:0.15,
          basis:'同上「阴阳同光」：阴日配阴料。这一项一炉只能吃一个日子——阳料阴料都要，就得开两炉（两���材料、两份真气、两段时辰），这是它的价钱' }
    ];

    function _envMatch(entry, ctx) {
        if (entry.kind === 'location') return !!ctx.location && String(ctx.location).indexOf(entry.key) >= 0;
        return !!ctx[entry.kind] && ctx[entry.kind] === entry.key;
    }

    // ---- 5.4d 阴阳与淬口：判据全部读既有账，不新造表 ----
    var POLARITY_YANG_TAGS = ['fire','leijing','thunder','fenghuang','long','star','meteor']; // 其性升扬、明
    var POLARITY_YIN_TAGS  = ['yinhun','beast','frost'];                                   // 其性沉降、幽
    var POLARITY_TEXT = { yang: '阳', yin: '阴', plain: '常（无阴阳之性）' };
    // 按材料**自己声明的标签顺序**取第一个阴阳标签（与 getPoolsForMat 同一个口径：
    // mat_demon_beast_core 声明 ['yinhun','fire'] ⇒ 阴，不是阳）。
    function matPolarity(matId) {
        var tags = getMaterialTags(matId);
        for (var i = 0; i < tags.length; i++) {
            if (POLARITY_YANG_TAGS.indexOf(tags[i]) >= 0) return 'yang';
            if (POLARITY_YIN_TAGS.indexOf(tags[i]) >= 0) return 'yin';
        }
        return 'plain';
    }
    // 日之阴阳：朔日起、阴阳相配（历法通例，不是新编的名目）。读不到日序就返回 null。
    function dayPolarity(dayNo) {
        var d = Number(dayNo);
        if (!isFinite(d)) return null;
        return (Math.floor(d) % 2 === 0) ? 'yin' : 'yang';
    }
    // 淬口＝辅材第一件的阴阳（阳料走炭火、阴料走地溲、其余走清水常法）
    var QUENCH_BY_POLARITY = { yang: 'char', yin: 'dishou', plain: 'clear' };
    var QUENCH_LABEL = { clear: '清水淬（常法）', dishou: '地溲淬', char: '炭火淬（炭十七·木炭十三）' };

    // ============== 5.4c-2 候天伺地：把「等阳日」改成「选阳日」（第七批） ==============
    //
    // ★ 为什么走 B（候天），不走 A（择时）也不走 C（投料养炉）：
    //   A（择时）：时辰这一轴**已经在表里了**——ENV_BONUS_TABLE 里 env_period_noon_fire（火云时·中午）
    //     与 env_period_night_qi（夜锻）两条，时刻辰只是把 5.4c 第 1 行那句「这是第 5 根轴，零重合」
    //     自己推翻一遍：同一件事两个入口，玩家只会觉得是查表。
    //   C（投料养炉）：淬火那一轴已经占了辅材第一件（半额炉料当价钱），再要一份「养炉料」
    //     就是同一个槽位收两次钱，且新造的料没有典据——那是发明，不是落地。
    //   B（候天）：**「候」本身就是等的动作**，典据就在本文件 5.4c 引的那十六个字里：
    //     「候天伺地，阴阳同光，百神临观，天气下降」——干将三月不成，《吴越春秋》把原因归给天时地气。
    //     历法上玩家不能凭空造日子，但**玩家能决定要不要把炉子封起来等**。这就是「选」。
    //
    // ★ 等待的价钱（**消耗的是游戏内时间本身，不新造任何资源**）：
    //   ① 时间：world.timeSystem.advanceTime(候N日 × 1440 分)。世界真的过 N 天——
    //      秘境窗口会关、债会到期、日课会走、NPC 会老会死（time-system.js:141-155 逐日跑 onNewDay）。
    //      这是「时间就是资源」的字面兑现，不是虚拟惩罚。
    //   ② 真气：封炉那 N 日炉子空烧 ⇒ 这一炉的真气按 (1 + N) 倍付（recipe.qiCost × (1+N)）。
    //      候 1 日双份、候 2 日三份。钱是玩家已有的真气，不新造单位、不改任何倍率。
    // ★ 为什么候期只给 0/1/2 日：日之阴阳是「朔日起、阴阳相配」（5.4c 的判据），
    //   逐日交替 ⇒ 候 1 日阴阳必翻面、候 2 日必翻回。给到 7 日也只是这两结果的重复，
    //   那是把三个按钮伪装成七个，纯占版面。0/1/2 已经是全部互不相同的走法。
    var HOU_MAX_DAYS = 2;
    function houDaysOf(v) {
        var n = Math.floor(Number(v) || 0);
        if (!isFinite(n) || n < 0) n = 0;
        return Math.min(HOU_MAX_DAYS, n);
    }
    // 候期档位账（只读，不改世界）：面板与测试读这张。每一档都写得出「候到哪天、那天什么阴阳、
    //   同不同光、锁不锁、锁的理由」——不许出现一个点了没反应的空档。
    function forgeHouOptions(spec) {
        var s = spec || {};
        var main = s.main || [];
        var env = forgeEnvFor(s);
        var ctx = env.ctx || {};
        var mMat = main.length ? main[0] : null;
        var mp = mMat ? matPolarity(mMat) : null;
        var dp = (ctx.dayNo != null) ? dayPolarity(ctx.dayNo) : null;
        var today = (ctx.dayNo != null) ? ctx.dayNo : null;
        var out = [];
        for (var d = 0; d <= HOU_MAX_DAYS; d++) {
            var land = (today != null) ? dayPolarity(today + d) : null;
            var same = !!(mp && land && mp !== 'plain' && mp === land);
            var o = {
                days: d,
                qiMult: 1 + d,
                label: (d === 0) ? '今日开炉' : ('候 ' + d + ' 日开炉'),
                cadence: (d === 0) ? '不候' : ('封炉 ' + d + ' 日（世界真的过 ' + d + ' 天）'),
                fromDay: today,
                landDay: (today != null) ? (today + d) : null,
                landPolarity: land,
                landText: land ? (land === 'yang' ? '阳日' : '阴日') : '？',
                sameLight: same,
                craftBonus: same ? 0.15 : 0,     // 与 ENV_BONUS_TABLE 里的 env_day_* 同一个数，不是新倍率
                lock: null
            };
            // 禁止设计 #2：不候不了就把原因写出来，并亮锁；不写「暂不可用」四个字糊过去
            if (today == null) o.lock = '历书读不到日子（WorldCalendar 缺席）⇒ 候不了，也不判择日';
            else if (!mMat) o.lock = '主材未定：择日要拿「日之阴阳」对「料之阴阳」，主材都没选，候了也判不了';
            else if (mp === 'plain') o.lock = '主材「' + mMat + '」是常料，无阴阳之性 ⇒ 候到哪一天都不同光（候了纯亏）';
            else if (d === 0 && same) o.lock = null;
            out.push(o);
        }
        return out;
    }
    // 这一炉若按某档候期开炉，总真气是多少（唯一口径：面板、锁定、实扣都走这一处，不许各算各的）
    function houQiCost(baseQiCost, houDays) {
        var base = Number(baseQiCost) || 0;
        if (!base) return 0;
        return Math.round(base * (1 + houDaysOf(houDays)));
    }
    // 真把炉子封起来等 N 日。返回 { ok, days, fromDay, toDay, warn } 或 { ok:false, reason }。
    // ★ 先判真气够不够再封炉：封了炉真气不够开不成，那几日就是纯白等——不能让玩家为一次误点买单。
    // ★ 判「候成了没有」**以日号为准，不以 advanceTime 抛不抛为准**：翻日先落账、
    //   随后的日结子账（气血/真气自然回满那一笔）才可能抛。两件事都照实报：
    //   日号没动 ⇒ 候不成；日号动了但子账抛了 ⇒ 候成了，并把这笔没走完的账写进 warn 交给 notes。
    //   （不许出现「日过了、嘴上说炉没封」——那是账记两遍的另一种形态。）
    function holdForgeForDays(days, baseQiCost, cd) {
        var d = houDaysOf(days);
        if (!d) return { ok: true, days: 0, fromDay: null, toDay: null, warn: null };
        var need = houQiCost(baseQiCost, d);
        if (cd && need && (Number(cd.qi) || 0) < need) {
            return { ok: false, reason: 'qi-low-for-hou', days: d, need: need, have: Number(cd.qi) || 0 };
        }
        var ts = window.timeSystem;
        if (!ts || typeof ts.advanceTime !== 'function') {
            // 没有钟表＝世界不会走 ⇒ 候不了（不许假装候过了）。这一条明说，不静默。
            return { ok: false, reason: 'no-clock', days: d };
        }
        function 日子() {
            try { return (typeof window.getAbsoluteDay === 'function') ? (Number(window.getAbsoluteDay()) || null) : null; }
            catch (eD) { return null; }
        }
        var from = 日子(), threw = [];
        // ★ 一天一天地过，不是一次 advanceTime(d*1440)。
        //   time-system.js:144 的翻日循环里，子账（气血/真气自然回满那一笔，naturalRecovery:441）
        //   一旦抛，整个 advanceTime 就中断在当天——那 N 日只过了一日，价钱却按 N 日付了。
        //   逐日调用把「过到第几天」与「付了几分」对齐；哪一天的子账抛了，如实记进 warn。
        for (var dd = 0; dd < d; dd++) {
            try {
                ts.advanceTime(1440, '候天伺地（第 ' + (dd + 1) + '/' + d + ' 日）');
            } catch (eAdv) {
                threw.push((eAdv && eAdv.message) ? eAdv.message : String(eAdv));
            }
        }
        var to = 日子();
        if (from == null || to == null || to === from) {
            return { ok: false, reason: threw.length ? ('advance-failed:' + threw[0]) : 'no-day-advance', days: d };
        }
        return {
            ok: true, days: d, fromDay: from, toDay: to, waitedDays: to - from,
            warn: (threw.length || (to - from) !== d)
                ? ('封炉那几日里有一笔日结子账没走完：' + (threw.join('；') || '（无报错，但日子没走满）')
                  + '　⇒ 实际只过了 ' + (to - from) + '/' + d + ' 日（日子是真过了的，真气按约定的 ' + (1 + d) + ' 倍照付）')
                : null
        };
    }

    // 把「淬火介质 / 择日」两轴就地补进一份 env 账。
    // **为什么要就地补**：compound-ui.js:272 先取一次 env，:273 拿它算预算，之后 :345/:358 又拿同一
    //   份对象渲染命中条目与候选数值。它是纯只读方，我改不了它；所以补账必须发生在那份对象上，
    //   否则屏上显示的「环境 ×1.10」与开炉实得（含淬口与择日）对不上——那就是我自己造的口径不一致。
    // 已补过的不重复补（envPointMult 记着补了几次）。
    function withMaterialAxes(env, mainMats, assistMats, houDays, houFromDay) {
        if (!env || typeof env !== 'object') return env;
        if (env.__axesDone) return env;
        // ★ 没有世界上下文就不判。调用方手递一份裸账（{ pointMult:0, attrMult:{} }）过来，
        //   意思是「时辰/季节/天气/地点我一律不认」——那它同样也不认淬口与择日，
        //   否则「环境乘数 = 0」这句明说的话会被这两根轴偷偷顶起来。
        //   面板与开炉走的是 getCurrentForgeEnv()/forgeEnvFor()，那份账自带 ctx，两轴照判。
        if (!env.ctx || typeof env.ctx !== 'object') return env;
        env.__axesDone = true;
        // 老调用点递的账可能没有 hits / attrMult（那两个字段不是它们写的）——补齐再动，不让只读方炸掉
        if (!Array.isArray(env.hits)) env.hits = [];
        if (!env.attrMult || typeof env.attrMult !== 'object') env.attrMult = {};
        var ctx = env.ctx;
        var qMat = (assistMats && assistMats.length) ? assistMats[0] : null;
        var qPol = qMat ? matPolarity(qMat) : 'plain';
        ctx.quenchMat = qMat;
        ctx.assistPolarity = qPol;
        ctx.quench = qMat ? (QUENCH_BY_POLARITY[qPol] || 'clear') : null;
        var mMat = (mainMats && mainMats.length) ? mainMats[0] : null;
        ctx.matId = mMat;
        ctx.matPolarity = mMat ? matPolarity(mMat) : null;
        // 第七批：候天伺地记了几日。0＝不候（与改前逐字节相同）；>0 那一炉是把炉子封起来等过的。
        ctx.houDays = houDaysOf(houDays);
        ctx.houQiMult = 1 + ctx.houDays;
        ctx.houFromDay = (ctx.houDays > 0 && houFromDay != null) ? houFromDay : null;
        var dp = dayPolarity(ctx.dayNo);
        ctx.dayPolarity = dp;
        ctx.day = (dp && ctx.matPolarity && ctx.matPolarity !== 'plain' && dp === ctx.matPolarity) ? dp : null;
        var fresh = getEnvBonus(ctx);
        // 命中集与原账的差＝这两轴新认的加成（时辰/季节/天气/地点那些已经在原账里，不重复搬）
        for (var i = 0; i < fresh.hits.length; i++) {
            var h = fresh.hits[i];
            if (h.kind === 'quench' || h.kind === 'day') env.hits.push(h);
        }
        env.pointMult += fresh.pointMult;
        for (var k in fresh.attrMult) env.attrMult[k] = (env.attrMult[k] || 0) + fresh.attrMult[k];
        return env;
    }
    // ★ 禁止设计 #2：不满足条件不许静默——把「为什么没生效、怎么办」逐条写出来，交给炼器台播报。
    function envMissNotes(env) {
        var ctx = (env && env.ctx) || {}, out = [];
        // ① 淬火介质
        if (ctx.quench == null) {
            out.push('未择淬料（辅材第一件是「' + (ctx.quenchMat || '空') + '」）：这一炉按清水淬的常法算，'
                + '想要地溲淬就放阴料（兽材/幽冥/寒铁），想要炭火淬就放阳料（火晶/雷晶/凤羽/龙材/星铁/陨铁）到辅材第一件');
        } else {
            out.push('淬口＝' + QUENCH_LABEL[ctx.quench] + '：由辅材第一件「' + ctx.quenchMat + '」（' + POLARITY_TEXT[ctx.assistPolarity] + '）定，'
                + '辅材只记半额炉料，这就是换淬口的价钱');
        }
        // ② 择日
        if (ctx.dayNo == null) {
            out.push('历书读不到日子（WorldCalendar 缺席）：择日这一轴不判，其余各轴照常');
        } else if (ctx.matPolarity == null) {
            out.push('无主材可比：择日要拿「日之阴阳」对「料之阴阳」，主材未定，判不了');
        } else if (ctx.matPolarity === 'plain') {
            out.push('主材「' + ctx.matId + '」是常料，无阴阳之性，择日对它不判（既不给也不罚）；'
                + '想吃这一项就换阳料（今日为' + (ctx.dayPolarity === 'yang' ? '阳' : '阴') + '日）或阴料（' + (ctx.dayPolarity === 'yang' ? '阴' : '阳') + '日再来）');
        } else if (ctx.day != null) {
            out.push('择日：第 ' + ctx.dayNo + ' 日为' + (ctx.dayPolarity === 'yang' ? '阳日' : '阴日')
                + '，主材「' + ctx.matId + '」属' + POLARITY_TEXT[ctx.matPolarity] + ' ⇒ 同光，认下 15% 炉料份量'
                + '（一炉只吃一个日子，想要阴阳两头的加成就得开两炉）');
        } else {
            out.push('择日不合光：第 ' + ctx.dayNo + ' 日为' + (ctx.dayPolarity === 'yang' ? '阳日' : '阴日')
                + '，主材「' + ctx.matId + '」属' + POLARITY_TEXT[ctx.matPolarity] + '，阴阳不同光 ⇒ 这一项没算上'
                + '（等' + (ctx.dayPolarity === 'yang' ? '阴日' : '阳日') + '再来，或换成'
                + (ctx.dayPolarity === 'yang' ? '阳' : '阴') + '料）');
        }
        // ③ 候天伺地（第七批）：先念候没候、候了几天、付了多少真气——玩家 anytime 都能查这一炉为什么是这个数
        if (ctx.houDays > 0) {
            out.push('候天伺地：封炉 ' + ctx.houDays + ' 日（第 ' + ctx.houFromDay + ' → 第 ' + ctx.dayNo + ' 日，'
                + ctx.houDays + ' 日里世界照走：秘境窗口会关、债会到期、日课会走），炉子空烧 ⇒ 这一炉真气按 '
                + ctx.houQiMult + ' 倍付；候到的这天是'
                + (ctx.dayPolarity === 'yang' ? '阳日' : '阴日')
                + (ctx.day != null ? '，与主材同光' : '，与主材不同光（这一项没算上——候日候错了，价钱照付）'));
        } else {
            out.push('未候天：今日开炉（不封炉、不占日子）。想拿「阴阳同光」那 15% 炉料份量，就点炼器台上的'
                + '「候 1 日 / 候 2 日」——代价是真气按倍数付 + 世界真的过那几天');
        }
        return out;
    }
    // 纯函数：给一份环境上下文（{period, season, weather, location}），返回命中的加成账。
    // 同一 ctx 永远同一结果——时辰/季节/天气/地点都是查表，不掷骰。
    function getEnvBonus(ctx) {
        var c = ctx || {};
        var pointMult = 0, attrMult = {}, hits = [];
        for (var i = 0; i < ENV_BONUS_TABLE.length; i++) {
            var e = ENV_BONUS_TABLE[i];
            if (!_envMatch(e, c)) continue;
            pointMult += e.pointMult || 0;
            for (var k in e.attrMult) attrMult[k] = (attrMult[k] || 0) + e.attrMult[k];
            hits.push({ id: e.id, kind: e.kind, label: e.label, basis: e.basis, attrMult: e.attrMult, pointMult: e.pointMult });
        }
        return { pointMult: pointMult, attrMult: attrMult, hits: hits, ctx: c };
    }
    // 从世界状态读环境（时辰/季节/天气/地点/日子）；读不到哪一项就当那一项没有加成，不掷骰、不猜。
    function readForgeEnvCtx() {
        var ctx = { period: null, season: null, weather: null, location: null, dayNo: null };
        try {
            if (window.timeSystem && typeof window.timeSystem.getCurrentPeriod === 'function') {
                var p = window.timeSystem.getCurrentPeriod();
                if (p && p.id) ctx.period = p.id;
            }
            if (window.gameTime && window.gameTime.currentSeason) ctx.season = window.gameTime.currentSeason;
        } catch (ePeriod) {
            // 时辰表读不到（timeSystem 尚未初始化）：按「无时辰加成」算，判定结果照样确定
        }
        try {
            var w = (typeof window.getCurrentWeather === 'function') ? window.getCurrentWeather() : window.currentWeather;
            if (w && w.id) ctx.weather = w.id;
        } catch (eWeather) {
            // 天气账读不到：按「无天气加成」算，不影响确定性
        }
        try {
            var cd = (typeof window.getCurrentCharData === 'function') ? window.getCurrentCharData() : window.currentCharData;
            if (cd && cd.location) ctx.location = String(cd.location);
        } catch (eLoc) {
            // 角色数据读不到：按「无地点加成」算
        }
        // 第六十二波：择日要用的「日」。历书读不到就留 null，择日不判（envMissNotes 会明写为什么）。
        try {
            var wcal = window.WorldCalendar;
            if (wcal && typeof wcal.day === 'number' && isFinite(wcal.day)) ctx.dayNo = Math.floor(wcal.day);
            else if (wcal && wcal.getDay && typeof wcal.getDay() === 'number') ctx.dayNo = Math.floor(wcal.getDay());
        } catch (eDay) {
            // 历书半路抛了：按「不知日子」算，不掷骰
        }
        return ctx;
    }
    function getCurrentForgeEnv() {
        return getEnvBonus(readForgeEnvCtx());
    }
    // 开炉真正走的那一份：把淬口与择日按这一炉的料补进同一张账。
    // 面板（compound-ui.js）拿不到材料时仍用 getCurrentForgeEnv()，那 4 根轴照样准；
    // 一旦手上有料（面板算预算时、开炉时都算），两轴就地补齐 ⇒ 屏上与实得同数。
    function forgeEnvFor(spec) {
        var s = spec || {};
        return withMaterialAxes(getCurrentForgeEnv(), s.main || [], s.assist || [], houDaysOf(s.houDays), s.houFromDay);
    }

    // ============== 5.4e 材料产地（第六十二波：《考工记》） ==============
    // 「郑之刀，宋之斤，鲁之削，吴粤之剑，★迁乎其地而弗能为良★」
    //   —— 这一句说的是**器形与地**，不是「哪块料好」。但它有一个可落地的推论：
    //      同出一处的料，工整；料从各处凑来，就得逐料考工。
    //
    // ★ 产地数据**不在本文件，也不在物品表里**，它早就在项目里：
    //   js/extensions/resource-points.js:9-45 的 INITIAL_POINTS 30 个资源点，每个带
    //   region（西荒/东海/南疆/极北/中州/天空/北冥/秘境虚空）、tier、output:{matId:count}。
    //   另有本文件自己的 LATE_MATERIAL_TIERS（灵界/魔界妖兽、深脉矿、秘境）那 7 档。
    //   所以这里**运行时读、就地派生**，不抄一份表、不写死一份 id——不新造任何材料，
    //   也不占位（资源点账里查不到的材料就明写「来路不明」，绝不编一个产地给它）。
    //   ⚠️ resource-points.js 在 仙侠.html:2255，比本文件 :2067 晚 ⇒ 必须惰性读，不能在加载期建表。
    var _materialOriginCache = null;
    function buildMaterialOrigins() {
        var map = {};
        function add(matId, row) { if (!matId) return; (map[matId] = map[matId] || []).push(row); }
        try {
            var RP = window.ResourcePoints;
            var pts = null;
            if (RP && Array.isArray(RP.INITIAL_POINTS)) pts = RP.INITIAL_POINTS;
            else if (RP && typeof RP.getState === 'function' && RP.getState() && Array.isArray(RP.getState().points)) pts = RP.getState().points;
            if (pts) {
                for (var i = 0; i < pts.length; i++) {
                    var p = pts[i];
                    if (!p || !p.output) continue;
                    for (var k in p.output) {
                        if (String(k).indexOf('mat_') !== 0) continue;   // 灵脉出的是 spiritStone/waterEssence 那一类，不进炼器表
                        add(k, {
                            id: p.id, name: p.name, region: p.region || '', tier: Number(p.tier) || 0,
                            kind: p.type || '',
                            basis: 'js/extensions/resource-points.js INITIAL_POINTS「' + p.name + '」（' + (p.region || '未标州') + '·tier ' + (p.tier || 0) + '）'
                        });
                    }
                }
            }
        } catch (eRP) {
            // 资源点账读不到（模块缺席/结构被动过）：这一炉按「来路不明」判，不猜、不补
        }
        for (var t = 0; t < LATE_MATERIAL_TIERS.length; t++) {
            var lt = LATE_MATERIAL_TIERS[t];
            var lregion = lt.plane || (lt.kind === 'secret' ? '秘境' : (lt.kind === 'mine' ? '矿脉' : ''));
            for (var d = 0; d < lt.drops.length; d++) {
                add(lt.drops[d].matId, {
                    id: 'late:' + lt.key, name: lt.beastName || lt.sourceName || lt.key,
                    region: lregion, tier: 0, kind: lt.kind,
                    basis: '本文件 LATE_MATERIAL_TIERS「' + lt.key + '」：' + (lt.note || '')
                });
            }
        }
        // ---------- 5.4e-2 妖兽部位件 / 秘境宝藏这两路的产地（第七批） ----------
        // ★ 为什么这一段非接不可：妖兽部位件（黑熊掌骨、夜来香妖香囊、曼陀罗毒种荚……）发在尸体解剖上，
        //   秘境宝藏发在秘境通关上，可它们在炼器账里**从来没有产地记录** ⇒ forgeOriginReport 一律判
        //   「来路不明」，于是「一炉全用同一处出的料」这种最工整的配法**永远拿不到同出一处的工整 +8**。
        //
        // ⚠️ 一处诚实边界（材料级账本的固有限制，必须写出来而不是糊过去）：
        //   背包里一件材料**不记它是从哪儿来的**，账本只能列出「这一味料全工程有哪些出处」。
        //   所以新增的出处行按下面两条判 ambiguous（=不配当同源证据）：
        //     (a) 同一类里这一味料有 2 个以上出处（妖兽骨挂 5 只兽、星辰铁出 2 座秘境）；
        //     (b) 这一味料**本来就已经有别的出处**（资源点或后期料档）——那玩家手里这件
        //         到底是从矿里挖的还是从兽身上剥的，账上分不出。
        //   两条都不满足（全工程独此一家、且此前无别处出处）才算来路确定，才允许它认同源。
        //   ——宁可少给工整，也不给一个查无实据的工整；notes 里把「分不出」逐条念给玩家听。
        // ★ 既有行（资源点 / 后期料档）的 ambiguous 一律不碰：老口径逐字节不变，
        //   否则这一段会把「三块铁矿石同出一座矿」那种本来判得对的情况改判掉。
        var 新增 = [];                                   // { matId, kindKey, ownerKey, row }
        function 记新(matId, kindKey, ownerKey, row) { 新增.push({ matId: matId, kindKey: kindKey, ownerKey: ownerKey, row: row }); }

        var bpt = beastPartTiers();
        for (var bp = 0; bp < bpt.length; bp++) {
            var br = bpt[bp];
            记新(br.matId, 'beast-part', br.beastId, {
                id: _beastPartOriginId(br),
                name: br.beastName + '·' + br.part,
                region: br.region || '未标州',
                tier: 0,
                kind: 'beast-part',
                basis: br.basis
            });
        }
        // 秘境宝藏（第七批事 2）：产地绝迹标签由秘境自己表里的真实数字推出来，不另编一套稀有度
        try {
            var DD = window.DungeonDynamic;
            var tres = (DD && typeof DD.treasureLedger === 'function') ? DD.treasureLedger() : null;
            if (tres && tres.length) {
                for (var tp = 0; tp < tres.length; tp++) {
                    var tr = tres[tp];
                    记新(tr.matId, 'secret', tr.dungeonId, {
                        id: 'secret:' + tr.dungeonId,
                        name: tr.dungeonName + '·' + tr.extinctLabel,
                        region: tr.region || '秘境',
                        tier: 0,
                        kind: 'secret',
                        extinct: tr.extinct,
                        extinctLabel: tr.extinctLabel,
                        basis: tr.basis
                    });
                }
            }
        } catch (eSec) {
            // 秘境模块读不到（无头/加载未到）：这一路不发生，其余各路照旧
        }

        var 同类主 = {};    // kindKey+'|'+matId → { owner:1 }   同一类里这一味料有几家
        var 早就有 = {};    // matId → 1                        这一味料此前有没有别的出处
        for (var mi2 = 0; mi2 < 新增.length; mi2++) {
            var mk = 新增[mi2].kindKey + '|' + 新增[mi2].matId;
            (同类主[mk] = 同类主[mk] || {})[新增[mi2].ownerKey] = 1;
        }
        for (var mk2 in map) 早就有[mk2] = 1;
        for (var mj = 0; mj < 新增.length; mj++) {
            var nx = 新增[mj];
            var owners = 同类主[nx.kindKey + '|' + nx.matId];
            var nOwn = owners ? Object.keys(owners).length : 0;
            var 歧 = nOwn > 1 || !!早就有[nx.matId];
            nx.row.ambiguous = 歧;
            if (歧) {
                nx.row.basis += (nOwn > 1
                    ? '　⚠️ 同类里这一味料有 ' + nOwn + ' 处出处（' + Object.keys(owners).join('、')
                      + '）⇒ 你手里这件是哪一处来的，材料级账本分不出'
                    : '')
                    + (早就有[nx.matId] ? '　⚠️ 这一味料在资源点账/后期料档里本来就有出处 ⇒ 分不出是这一处还是那一处' : '')
                    + ' ⇒ 本炉不硬套「同出一处」';
            } else {
                nx.row.basis += '　（同类里独此一家，且此前无别处出处 ⇒ 来路确定）';
            }
            add(nx.matId, nx.row);
        }
        _materialOriginCache = map;
        return map;
    }
    function refreshMaterialOrigins() { _materialOriginCache = null; return buildMaterialOrigins(); }
    function materialOrigins(matId) {
        var map = _materialOriginCache || buildMaterialOrigins();
        return map[matId] || null;
    }
    // 一炉的来路报告。规则只有一条：**同一座来路出的料 ⇒ 工整**。
    //   有任何一件料来路不明 ⇒ 不判（不硬套，也不罚）——那是「账上查不到」，不是「不是本地」。
    // ★ 第七批加的一档「来路分得出但分不出是哪一只」：部位件有一料多兽共挂的（妖兽骨挂 5 只兽），
    //   材料级账本分不出你手里那一块原本是谁的 ⇒ 归到 ambiguous，**不硬套同源**，notes 里写明。
    //   只认「全工程独此一家」的那个部位（来路确定）——宁可少给工整，也不给查无实据的工整。
    function forgeOriginReport(mats) {
        var out = { samePoint: false, pointId: null, pointName: '', region: '', sources: [], unknown: [], ambiguous: [], total: 0 };
        var list = mats || [], srcs = [], ids = {}, seen = {}, i, k;
        for (i = 0; i < list.length; i++) {
            var os = materialOrigins(list[i]);
            if (!os || !os.length) { out.unknown.push(list[i]); continue; }
            var use = [], amb = null;
            for (k = 0; k < os.length; k++) {
                if (os[k].ambiguous) { amb = os[k]; continue; }   // 分不出的那一条不当同源证据
                use.push(os[k]);
            }
            if (!use.length) {
                // 这一味料只有「分不出是谁」的那一条来路：不算同源，但要如实报出来，不当查无此物
                if (amb) { out.ambiguous.push(list[i]); if (!seen['amb:' + amb.id]) { seen['amb:' + amb.id] = 1; out.sources.push(amb); } }
                else out.unknown.push(list[i]);
                continue;
            }
            out.total++;
            for (k = 0; k < use.length; k++) { srcs.push(use[k]); ids[use[k].id] = (ids[use[k].id] || 0) + 1; }
            if (amb && !seen['amb:' + amb.id]) { seen['amb:' + amb.id] = 1; out.sources.push(amb); }
        }
        for (i = 0; i < srcs.length; i++) { if (!seen[srcs[i].id]) { seen[srcs[i].id] = 1; out.sources.push(srcs[i]); } }
        if (out.unknown.length || out.ambiguous.length || out.total < 2) return out;
        var bestId = null, bestN = 0;
        for (var id in ids) { if (ids[id] > bestN) { bestN = ids[id]; bestId = id; } }   // 插入序＝材料顺序，同分取先者，全序
        if (bestId && bestN === out.total) {
            out.samePoint = true; out.pointId = bestId;
            for (i = 0; i < srcs.length; i++) if (srcs[i].id === bestId) { out.pointName = srcs[i].name; out.region = srcs[i].region; break; }
        }
        return out;
    }
    var ORIGIN_CRAFT_BONUS = 8;   // 同出一处 ⇒ 工整 +8（品相更容易高一档；混料则无此项加成，notes 里写明）
    function originNote(report) {
        var r = report || {};
        var unk = (r.unknown && r.unknown.length)
            ? '　⚠️ ' + r.unknown.join('、') + ' 在资源点账与后期料档里查不到出处（材料表本来就没有产地字段），本炉按「来路不明」判，不硬套同源。'
            : '';
        var amb = (r.ambiguous && r.ambiguous.length)
            ? '　⚠️ ' + r.ambiguous.join('、') + ' 是妖兽部位炼出来的料，这一味全工程有多只兽的部位都炼得出，'
              + '背包里这一件原本是哪一只，材料级账本分不出 ⇒ 不硬套「同出一处」（宁可不给工整，也不给查无实据的工整）。'
            : '';
        if (!r.sources || !r.sources.length) {
            return '来路不明：这几件料在资源点账与后期料档里都查不到出处（材料表本来就没有产地字段）'
                + '⇒ 本炉不判「同出一处」，工整无从加起；这不是罚，是账上查不到。' + unk + amb;
        }
        var names = r.sources.map(function (s) { return s.name + '（' + (s.region || '未标州') + '）'; }).join('、');
        if (r.samePoint) return '来路同出一处：' + r.pointName + '（' + (r.region || '未标州') + '）⇒ 料同源，工整 +' + ORIGIN_CRAFT_BONUS + '（《考工记》「郑之刀……迁乎其地而弗能为良」：料不出这一处，才算一处的手艺）' + unk + amb;
        return '来路分属 ' + names + ' ⇒ 须逐料考工，不享「同出一处」的工整 +' + ORIGIN_CRAFT_BONUS
            + '（《考工记》「迁乎其地而弗能为良」）——想要工整就把主辅材凑成同一座来路，'
            + '代价是料种少、炉料份量也跟着少（混料那一份点数是可换的）。' + unk + amb;
    }

    // ---- 5.5 词缀解析：点数 + 技能 → 档位 → 数值（环境按属性键抬数值） ----
    function resolveAffix(entry, points, skill, env) {
        var maxP = maxPointsPerAffix(skill);
        var want = Math.max(0, Math.floor(Number(points) || 0));
        var pts = Math.min(want, maxP);
        var tierIndex = pts >= TIER_META.xian.points ? 2 : (pts >= TIER_META.ling.points ? 1 : (pts >= TIER_META.fan.points ? 0 : -1));
        var tier = tierIndex >= 0 ? entry.tiers[tierIndex] : null;
        var out = {
            key: entry.key, name: entry.name, flavor: entry.flavor,
            pool: entry.pool, pools: entry.pools, tag: entry.tag, tags: entry.tags,
            attrKey: entry.attrKey, proc: entry.proc,
            points: pts, askedPoints: want, clamped: want > pts,
            tierId: tier ? tier.id : null, tierName: tier ? tier.name : null,
            minForgeSkill: tier ? tier.minForgeSkill : entry.gate,
            attrVal: 0
        };
        if (tier && entry.attrKey) {
            var m = 1 + ((env && env.attrMult && env.attrMult[entry.attrKey]) || 0);
            out.attrVal = Math.round(tier.val * m);
        }
        return out;
    }

    // ---- 5.6 候选列表（炼器台拿它渲染「池」，玩家在池里挑条数、投点数） ----
    function listAffixOptionsForMat(matId, skill) {
        var sk = Number(skill) || 0;
        var pools = getPoolsForMat(matId);
        var out = [], seen = {};
        for (var p = 0; p < pools.length; p++) {
            var arr = AFFIX_BY_POOL[pools[p]] || [];
            for (var i = 0; i < arr.length; i++) {
                var e = arr[i];
                if (seen[e.key] || e.gate > sk) continue;
                seen[e.key] = 1;
                out.push(e);
            }
        }
        var uni = [];
        for (var u = 0; u < AFFIX_POOL.length; u++) {
            if (AFFIX_POOL[u].tag === '*' && AFFIX_POOL[u].gate <= sk) uni.push(AFFIX_POOL[u]);
        }
        return { matId: matId, pools: pools, affixes: out, universal: uni, maxPoints: maxPointsPerAffix(sk) };
    }

    // 候选排序键：材料声明的池序 → 词缀在池里的名次 → key。全序，不留任何并列的随机余数。
    function _sortCandidates(list) {
        var order = {};
        for (var o = 0; o < list.pools.length; o++) order[list.pools[o]] = o;
        return list.affixes.concat(list.universal).sort(function (a, b) {
            var pa = (order[a.pool] == null) ? 90 : order[a.pool];
            var pb = (order[b.pool] == null) ? 90 : order[b.pool];
            if (pa !== pb) return pa - pb;
            if (a.rank !== b.rank) return a.rank - b.rank;
            return a.key < b.key ? -1 : (a.key > b.key ? 1 : 0);
        });
    }

    // ---- 5.7 确定性抽取（旧签名原样保留，maxCount 条；第 4 参 pointsPerAffix 不传＝每条都投到技能上限） ----
    // 老规矩是「随机排序后切前 N 条」，现在换成全序排序后切前 N 条——同料同技必出同一条，无一例外。
    function pickAffixesForMat(matId, maxCount, skill, pointsPerAffix) {
        var sk = Number(skill) || 0;
        var list = listAffixOptionsForMat(matId, sk);
        var sorted = _sortCandidates(list);
        var n = Math.max(0, Math.min(Number(maxCount) || 0, sorted.length));
        var pts = (pointsPerAffix == null) ? list.maxPoints : pointsPerAffix;
        var out = [];
        for (var i = 0; i < n; i++) out.push(resolveAffix(sorted[i], pts, sk, null));
        return out;
    }

    // 候选清单（材料槽 → 有序词缀表）：主材在前、辅材次之、铭纹最后，同 key 只留第一次出现的位置。
    // collectForgeAffixes 与炼器台 UI 共用这一份，两边看到的顺序永远一致。
    function listForgeCandidates(mainMats, assistMats, runeMats, skill) {
        var sk = Number(skill) || 0;
        var mats = (mainMats || []).concat(assistMats || [], runeMats || []);
        var out = [], seen = {};
        for (var mi = 0; mi < mats.length; mi++) {
            var sorted = _sortCandidates(listAffixOptionsForMat(mats[mi], sk));
            for (var ci = 0; ci < sorted.length; ci++) {
                if (seen[sorted[ci].key]) continue;
                seen[sorted[ci].key] = 1;
                out.push({ entry: sorted[ci], from: mats[mi] });
            }
        }
        return out;
    }

    // ---- 5.8 一次开炉的结算：材料槽 + 玩家分配 → 词缀清单 ----
    // spec: { main:[], assist:[], rune:[], skill, maxAffixes, allocation:{key:points}|null, env }
    // allocation 为 null 时按「轮流均摊」自动投点（同样确定性）；给了就按玩家填的来，没填的＝0 点＝不出这条。
    function collectForgeAffixes(spec) {
        var s = spec || {};
        var sk = Number(s.skill) || 0;
        var main = s.main || [], assist = s.assist || [], rune = s.rune || [];
        var env = s.env || forgeEnvFor(s);
        var budget = computeForgeBudget(main, assist, rune, sk, env);
        var slotLimit = affixSlotLimit(sk);
        var gradeBonus = gradeSlotBonus(main);
        // 条数上限（第六十一波 B 案）：配方槽 + 品阶加槽，再被技能档封顶。
        //   maxAffixes 的语义仍是「配方自带的槽数」，不是硬上限——硬上限是技能档那条线。
        var recipeSlots = (s.maxAffixes == null) ? 3 : Math.max(0, Math.floor(Number(s.maxAffixes) || 0));
        var cap = effectiveAffixSlots(recipeSlots, sk, main);
        var maxP = maxPointsPerAffix(sk);
        var candList = listForgeCandidates(main, assist, rune, sk);
        var cands = candList.map(function (c) { return c.entry; });
        // ★ 禁止设计 #2：先把这炉「淬火介质/择日」的判定结果与落空原因写进 notes，
        //   后面槽位/档位/点数的话再接在后面——玩家任何时候都看得见「为什么没生效」。
        var notes = envMissNotes(env).slice(), chosen = [], pts = [];
        if (s.allocation && typeof s.allocation === 'object') {
            // 玩家分配：只认候选表里的 key，顺序仍按候选表（名字前缀稳定），点数按玩家填的，超上限的截断并记账
            for (var ai = 0; ai < cands.length; ai++) {
                var k = cands[ai].key;
                if (!Object.prototype.hasOwnProperty.call(s.allocation, k)) continue;
                var p = Math.max(0, Math.floor(Number(s.allocation[k]) || 0));
                if (p <= 0) continue;
                if (chosen.length >= cap) { notes.push('槽位已满（上限 ' + cap + ' 条），' + cands[ai].name + ' 的点数没投进去'); break; }
                chosen.push(cands[ai]); pts.push(p); // 原始点数交给 resolveAffix 去截断，它会记 askedPoints/clamped
                if (p > maxP) notes.push(cands[ai].name + ' 投了 ' + p + ' 点，锻造 ' + sk + ' 只压得住 ' + maxP + ' 点（档位封顶）');
            }
        } else {
            // 自动均摊：先每条 1 点，再一轮一轮往上加，直到总点数用完或都到档位上限
            var n = Math.min(cap, cands.length);
            for (var ai2 = 0; ai2 < n; ai2++) { chosen.push(cands[ai2]); pts.push(0); }
            var left = budget.totalPoints;
            for (var round = 1; round <= maxP && left > 0; round++) {
                for (var q = 0; q < chosen.length && left > 0; q++) {
                    if (pts[q] < round) { pts[q]++; left--; }
                }
            }
            if (chosen.length === 0) notes.push('材料不入池（未知料或技能太低），这一炉出的是素胚');
        }
        var spent = 0, affixes = [];
        for (var fi = 0; fi < chosen.length; fi++) {
            // 0 点＝没投这条：不出现在器上（名字前缀、属性、品相词缀数都当它不存在）
            if (pts[fi] <= 0) continue;
            spent += pts[fi];
            affixes.push(resolveAffix(chosen[fi], pts[fi], sk, env));
        }
        if (spent > budget.totalPoints) notes.push('点数超账（分配 ' + spent + ' > 可用 ' + budget.totalPoints + '），超出的部分不生效');
        // 第六十二波：来路报告跟着这一炉一起交出去（开炉时并进工评，notes 里也有原因）
        var origin = forgeOriginReport(main.concat(assist, rune || []));
        notes.push(originNote(origin));
        return {
            affixes: affixes,
            spentPoints: spent,
            overflowPoints: Math.max(0, budget.totalPoints - spent),
            slotLimit: slotLimit,
            gradeSlotBonus: gradeBonus,
            maxAffixes: cap,
            budget: budget,
            env: env,
            origin: origin,
            notes: notes
        };
    }

    // ============== 5.5 第二十六波 · 锻器品质段（同料同技同工，出炉品相高下由手艺定，不再掷骰） ==============
    var QUALITY_LADDER = [
        { id: 'poor', name: '劣质', mult: 0.7, color: 'gray' },
        { id: 'normal', name: '普通', mult: 1.0, color: 'white' },
        { id: 'good', name: '优良', mult: 1.2, color: 'blue' },
        { id: 'excellent', name: '杰出', mult: 1.5, color: 'gold' },
        { id: 'imperial', name: '极品', mult: 2.0, color: 'purple' }
    ];
    function qualityIndex(id) {
        for (var i = 0; i < QUALITY_LADDER.length; i++) if (QUALITY_LADDER[i].id === id) return i;
        return 1;
    }
    // 炉火＝锻造技能 +20（与炼丹火候同一把尺，封顶 100）。第六十波起这里不再掷骰：
    //   老规矩是 sk + 随机(-20..+20)，同料同技能炼出不同品相，玩家说了不算；
    //   现在炉火只由手艺决定——「技能高就一定能炼成最强的」，工评再叠词缀条数、铭纹与点数利用率。
    // 第二十九波 · 锻火试炼：玩家亲自控火的得分可替代炉火（fire-qte 写 _forgingFireBonus，消费即清）；
    // 受锻造手艺封顶（不超过 手艺+20）——低手艺绕不过去，高手艺控火才出极品。
    function judgeQuality(skill, affixCount, isImprint, pointUse, originInfo) {
        var sk = Number(skill) || 0;
        var fire;
        if (typeof window._forgingFireBonus === 'number' && window._forgingFireBonus >= 0) {
            fire = Math.max(0, Math.min(100, Math.min(window._forgingFireBonus, sk + 20)));
            window._forgingFireBonus = null; // 消费即清——一炉火只管一炉
        } else {
            fire = Math.max(0, Math.min(100, sk + 20));
        }
        // 工法＝词缀条数（每 3 条算满 70 分）+ 铭纹 30 分，另按点数利用率（spent/total）加最多 20 分，
        //     再加上第六十二波的「同出一处」工整（来路同源 ⇒ 料是一处的手艺）。后三样都封在 100 以内。
        var origin = (originInfo && originInfo.samePoint) ? ORIGIN_CRAFT_BONUS : 0;
        var craft = Math.min(100, Math.round((Number(affixCount) || 0) / 3 * 70) + (isImprint ? 30 : 0) + origin);
        if (pointUse && Number(pointUse.total) > 0) {
            craft = Math.min(100, craft + Math.round(Math.min(1, Number(pointUse.spent) / Number(pointUse.total)) * 20));
        }
        var score = Math.round(fire * 0.6 + craft * 0.4);
        var qi = score >= 85 ? 4 : score >= 70 ? 3 : score >= 50 ? 2 : score >= 30 ? 1 : 0;
        var boost = 0;
        try {
            if (window.CaveFacilities && typeof window.CaveFacilities.getBuff === 'function') {
                var qb = Math.floor(Number(window.CaveFacilities.getBuff('player', 'qualityBoost')) || 0);
                if (qb > 0) { boost = qb; qi = Math.min(QUALITY_LADDER.length - 1, qi + qb); }
            }
        } catch (eBoost) {
            // 洞府设施账读不到：按「无品质加段」算，判定照样确定（不吞错也不猜）
        }
        return { quality: QUALITY_LADDER[qi], score: score, fire: fire, craft: craft, boost: boost, origin: origin, originInfo: originInfo || null };
    }
    // 旧名保留：老调用点（含 tests/forging-compound-node.js）继续可用，语义已是「手艺定档」
    function rollQuality(skill, affixCount, isImprint, pointUse, originInfo) {
        return judgeQuality(skill, affixCount, isImprint, pointUse, originInfo);
    }

    // ============== 6. executeCompoundForging ==============

    function executeCompoundForging(recipeId, slotPick, options) {
        // 第六十波：options.randomSource 作废——炼器强度路径已无随机源（留参数只为不打断老调用点）。
        // 传什么都不影响结果，这正是本轮要的那件事。
        return _forgingInner(recipeId, slotPick);
    }
    function _forgingInner(recipeId, slotPick) {
        var houFromDay = null;
        var recipe = null;
        for (var i = 0; i < COMPOUND_FORGING_RECIPES.length; i++) if (COMPOUND_FORGING_RECIPES[i].id === recipeId) { recipe = COMPOUND_FORGING_RECIPES[i]; break; }
        if (!recipe) return { ok: false, reason: 'recipe-not-found' };
        if (!slotPick || !slotPick.embryo) return { ok: false, reason: 'empty-embryo' };
        // 器胚校验
        var embryo = EMBRYOS[slotPick.embryo];
        if (!embryo) return { ok: false, reason: 'embryo-not-found' };
        if (recipe.slots.embryo.type !== slotPick.embryo) return { ok: false, reason: 'embryo-type-mismatch(need ' + recipe.slots.embryo.type + ')' };
        // 技能检查
        if (recipe.requiredSkills) {
            for (var sk in recipe.requiredSkills) {
                var lv = (typeof window.getLifeSkill === 'function') ? window.getLifeSkill(sk) : ((window.currentCharData && window.currentCharData.lifeSkills) ? (window.currentCharData.lifeSkills[sk] || 0) : 0);
                if (lv < recipe.requiredSkills[sk]) return { ok: false, reason: 'skill-low(' + sk + ':' + lv + '<' + recipe.requiredSkills[sk] + ')' };
            }
        }
        var skill = (typeof window.getLifeSkill === 'function') ? window.getLifeSkill('锻造') : 0;
        // 槽位校验
        var slots = recipe.slots;
        if (!slotPick.main || slotPick.main.length !== slots.main.count) return { ok: false, reason: 'main-count-mismatch(need ' + slots.main.count + ',got ' + (slotPick.main ? slotPick.main.length : 0) + ')' };
        if (!slotPick.assist || slotPick.assist.length !== slots.assist.count) return { ok: false, reason: 'assist-count-mismatch' };
        if (!slots.rune.optional) {
            if (!slotPick.rune || slotPick.rune.length !== slots.rune.count) return { ok: false, reason: 'rune-count-mismatch' };
        } else if (slotPick.rune && slotPick.rune.length > 0 && skill < slots.rune.minForgeSkill) {
            return { ok: false, reason: 'rune-skill-low(' + skill + '<' + slots.rune.minForgeSkill + ')' };
        }
        // ---- 第七批·候天伺地：把「等阳日再来」改成「选候几日」 ----
        //   判据：slotPick.houDays（0~2，面板上的三个按钮给的就是这三个值）。
        //   houDays=0 时这一段逐字节等于改前：不候、不占日子、真气原价——老调用点与老存档不受影响。
        var houDays = houDaysOf(slotPick.houDays);
        var qiTotal = houQiCost(recipe.qiCost, houDays);
        var cd = (typeof window.getCurrentCharData === 'function') ? window.getCurrentCharData() : window.currentCharData;
        // ① 先判真气够不够——封了炉真气不够开不成，那几日就是纯白等，不让玩家为一次误点买单
        if (cd && qiTotal && (cd.qi || 0) < qiTotal) {
            return { ok: false, reason: 'qi-low', houDays: houDays, qiNeed: qiTotal, qiHave: Number(cd.qi) || 0 };
        }
        // ② 封炉候日：世界真的前进 N 天（秘境窗口/债期/日课/NPC 生死都照走——这就是等待的价钱）
        var houRes = holdForgeForDays(houDays, recipe.qiCost, cd);
        if (!houRes.ok) {
            var whyHou = (houRes.reason === 'qi-low-for-hou')
                ? '候 ' + houRes.days + ' 日要真气 ' + houRes.need + '，你只有 ' + houRes.have + '——炉没封，天也没过'
                : (houRes.reason === 'no-clock'
                    ? '没有钟表（timeSystem 未初始化）⇒ 世界不会走，候不了——这一炉按今日开炉算'
                    : '候日不成（' + houRes.reason + '）——炉没封，天也没过');
            return { ok: false, reason: houRes.reason, houNote: whyHou, houDays: houDays };
        }
        if (houDays > 0 && houRes.fromDay != null && houRes.toDay != null) {
            houFromDay = houRes.fromDay;
        }
        // 封炉那几日的日结子账若有没走完的，notes 里如实念一句（日子照过，不许当成没等）
        var houWarn = houRes.warn || null;
        // v23.0 材料实扣：旧版器胚与材标签全白嫖（只扣真气）——现在主材/辅材/铭纹照单入账，
        // 扣不起整炉不开（真气分文不动）；器胚是形制不是实物，不入账。
        var _forgMats = slotPick.main.concat(slotPick.assist).concat(slotPick.rune || []);
        if (window.compoundMat && typeof window.compoundMat.consume === 'function') {
            if (!window.compoundMat.consume(_forgMats)) return { ok: false, reason: 'material-short' };
        }
        // 第六十波：抽词缀＝一次性结算（材料池 + 条数上限 + 属性点分配），零随机
        var forgeRes = collectForgeAffixes({
            main: slotPick.main, assist: slotPick.assist, rune: slotPick.rune,
            skill: skill,
            maxAffixes: (recipe.slots && recipe.slots.affixSlots != null) ? recipe.slots.affixSlots : 3,
            allocation: slotPick.allocation,
            houDays: houDays,
            houFromDay: houFromDay
        });
        if (houWarn) forgeRes.notes.push(houWarn);
        var finalAffixes = forgeRes.affixes;
        var isImprint = !!(slotPick.rune && slotPick.rune.length > 0);
        // 品相＝手艺定档（不再掷骰）：工评分里带上点数利用率与第六十二波的「同出一处」工整
        var qr = judgeQuality(skill, finalAffixes.length, isImprint, { spent: forgeRes.spentPoints, total: forgeRes.budget.totalPoints }, forgeRes.origin);
        var quality = qr.quality;
        // 计算最终 attrs / combatBonus
        var finalAttrs = Object.assign({}, embryo.baseAttrs);
        var finalCombatBonus = {};
        var procTags = [];
        for (var fa = 0; fa < finalAffixes.length; fa++) {
            var aff = finalAffixes[fa];
            // 触发型词缀只登记标签（战斗侧待接线，见 FORGE_PROCS：本轮不产生任何战斗效果）
            if (aff.proc) { if (procTags.indexOf(aff.proc) < 0) procTags.push(aff.proc); }
            if (aff.attrKey && aff.attrVal != null) {
                if (COMBAT_BONUS_KEYS.indexOf(aff.attrKey) >= 0) {
                    finalCombatBonus[aff.attrKey] = (finalCombatBonus[aff.attrKey] || 0) + aff.attrVal;
                } else {
                    finalAttrs[aff.attrKey] = (finalAttrs[aff.attrKey] || 0) + aff.attrVal;
                }
            }
        }
        // 品相真动数值：劣质是糟蹋料，极品是绝世兵（重量不动——铁有多沉就是多沉）
        if (quality.mult !== 1) {
            for (var qk in finalCombatBonus) finalCombatBonus[qk] = Math.max(1, Math.round(finalCombatBonus[qk] * quality.mult));
            for (var qa in finalAttrs) { if (qa !== 'weight') finalAttrs[qa] = Math.max(1, Math.round((Number(finalAttrs[qa]) || 0) * quality.mult)); }
        }
        // 轻身/轻灵是往下降重量，但器不能轻到没有——下限 0.5（负重量会让战斗侧算不出出手速度）
        if (finalAttrs.weight != null && Number(finalAttrs.weight) < 0.5) finalAttrs.weight = 0.5;
        // 命名（劣/优/杰/极带品相字头，普通不加——中不溜才是常态）
        var prefix = finalAffixes.length > 0 ? finalAffixes.map(function (a) { return a.name; }).join('·') + '·' : '';
        var qTag = quality.id === 'normal' ? '' : quality.name + '·';
        var finalName = qTag + prefix + embryo.name;
        // 护具的器形：主材是金石出甲胄，其余出软甲（coverage/resistance/耐久由 ARMOR_FORMS 定，
        // coverage 不随品相放大——形制是形制，料好只是甲更挡得住，见 armorFormOf）
        var armorForm = (embryo.subtype === 'armor') ? armorFormOf(slotPick.main) : null;
        // 扣真气
        if (cd && qiTotal) cd.qi = (cd.qi || 0) - qiTotal;
        // 一炉一器：这一炉炼出来的就是这一件（同 id 写全局模板＝后炼的精货静默改写背包里旧那件）。
        // 产物 id 每炉一份（基名 + 实例号），背包格各挂各的模板；基名那份留在 itemById 里只作
        // 「方子品鉴＝这一炉配方历史上最好的一件」（compound-ui 读它显示成品名），不进背包。
        var baseId = recipe.result.itemId;
        var templateId = _nextInstanceId(baseId);
        if (window.itemById) {
            // v25.1·试-08：模子同时记进 _moduleState.compoundTemplates——它随 StateRegistry('forgingConfig')
            // 落档，读档时回填 window.itemById；此前只写内存，重载后背包里的名炉兵器全变「来历不明的一格」
            var _compoundTpl = {
                id: templateId,
                name: finalName,
                type: 'equipment',
                subtype: embryo.subtype,
                slot: embryo.slot,
                category: 'equipment',
                quality: 'PIN9',
                level: 1,
                price: Math.round(100 * quality.mult),
                attrs: finalAttrs,
                combatBonus: finalCombatBonus,
                damageType: embryo.baseDamage || 'slash',
                weight: finalAttrs.weight || 1.5,
                _forgeQuality: quality.id,
                // 第六十波：把「投了几点、落在哪一档、环境抬了多少」一并记进器里（纯数据，随档往返）
                procTags: procTags,
                _forgeBaseId: baseId,   // 这一件属哪张方子（品鉴/图鉴回查用，装备战斗都不读它）
                _forgePlan: {
                    points: forgeRes.spentPoints,
                    totalPoints: forgeRes.budget.totalPoints,
                    skill: skill,
                    // 第六十二波：淬口与择日的判定结果一并记进器里（随档往返，玩家日后能查这一炉为什么是这个数）
                    quench: (forgeRes.env && forgeRes.env.ctx) ? (forgeRes.env.ctx.quench || null) : null,
                    quenchMat: (forgeRes.env && forgeRes.env.ctx) ? (forgeRes.env.ctx.quenchMat || null) : null,
                    dayPolarity: (forgeRes.env && forgeRes.env.ctx) ? (forgeRes.env.ctx.dayPolarity || null) : null,
                    matPolarity: (forgeRes.env && forgeRes.env.ctx) ? (forgeRes.env.ctx.matPolarity || null) : null,
                    // 第七批：这一炉候了几天、真气按几倍付的，都记进器里（玩家日后翻得出「为什么这天开的炉」）
                    houDays: houDays,
                    houQiMult: 1 + houDays,
                    houFromDay: houFromDay,
                    houQiCost: qiTotal,
                    origin: forgeRes.origin ? {
                        samePoint: !!forgeRes.origin.samePoint,
                        pointId: forgeRes.origin.pointId || null,
                        pointName: forgeRes.origin.pointName || '',
                        region: forgeRes.origin.region || '',
                        sources: forgeRes.origin.sources.map(function (s) { return s.name; })
                    } : null,
                    affixes: finalAffixes.map(function (a) { return { key: a.key, points: a.points, tier: a.tierId, val: a.attrVal }; })
                },
                desc: '由' + slotPick.main.concat(slotPick.assist).join('/') + '炼成的' + finalName + '（' + quality.name + '·工评' + qr.score + (forgeRes.env.hits.length ? '·' + forgeRes.env.hits.map(function (h) { return h.label; }).join('/') : '') + (forgeRes.origin && forgeRes.origin.samePoint ? '·出' + forgeRes.origin.pointName : '') + '）'
            };
            // 护具：把器形的 coverage/resistance/耐久真写进器里，battle.js 的 getArmorData 才认得（:257）
            if (armorForm) {
                var _cov = {};
                Object.keys(armorForm.coverage).forEach(function (part) { _cov[part] = armorForm.coverage[part]; });
                var _res = {};
                Object.keys(armorForm.resistance).forEach(function (k) {
                    // 品相真动抗性：料越讲究甲越挡得住（与 finalAttrs/finalCombatBonus 同一把 mult）
                    _res[k] = Math.max(1, Math.round(armorForm.resistance[k] * quality.mult));
                });
                _compoundTpl.coverage = _cov;
                _compoundTpl.resistance = _res;
                _compoundTpl.armorDurability = Math.max(1, Math.round(armorForm.armorDurability * quality.mult));
                _compoundTpl.armorForm = armorForm.id;
                // defense 另写一份在器身上：inventory.js:2069 与 combat-stats 都读顶层 defense，
                // 只写进 attrs 的话战斗侧读不到（attrs.defense 全库无人读）
                _compoundTpl.defense = Math.max(0, Math.round(finalAttrs.defense || 0));
            }
            window.itemById[templateId] = _compoundTpl;
            _moduleState.compoundTemplates[templateId] = JSON.parse(JSON.stringify(_compoundTpl));
            _compoundLoadedIds[templateId] = 1;
            // 方子品鉴：基名（wpn_compound_sword 等）那份按「只记最好的一件」更新——
            // compound-ui 的配方行读它显示成品名（compound-ui.js:134）。新开炉的背包格一律挂实例 id，
            // 永不挂它（挂了就是「后炼的精货静默改写背包里旧那件」的老病灶）。
            // 旧档里的基名条目是货不是档案（没有 _forgeCatalogOnly 标记）：那种一律不再改写，
            // 只发新的实例号——改它等于改玩家的旧装备。
            var _baseTpl = window.itemById[baseId];
            var _baseIsArchive = !_baseTpl || _baseTpl._forgeCatalogOnly === true;
            var _baseQ = (_baseTpl && _baseTpl._forgeQuality != null) ? qualityIndex(_baseTpl._forgeQuality) : -1;
            if (_baseIsArchive && qualityIndex(quality.id) >= _baseQ) {
                window.itemById[baseId] = JSON.parse(JSON.stringify(_compoundTpl));
                window.itemById[baseId].id = baseId;
                window.itemById[baseId]._forgeCatalogOnly = true;
                _moduleState.compoundTemplates[baseId] = JSON.parse(JSON.stringify(window.itemById[baseId]));
                _compoundLoadedIds[baseId] = 1;
            }
        }
        // 极品出炉成双：同款多一件（可赠可卖）
        var outCount = Math.max(1, recipe.result.count || 1) + (quality.id === 'imperial' ? 1 : 0);
        // 落物品到背包
        // DES-72 同族：addResultItem 报的是行囊**实收件数**，旧写法只判真假 ⇒「成双」那句可以凭空说
        var addedGot = outCount;
        if (typeof window.addResultItem === 'function') {
            addedGot = Number(window.addResultItem(templateId, outCount)) || 0;
        }
        if (!addedGot) {
            if (cd && qiTotal) cd.qi = (cd.qi || 0) + qiTotal;
            // v23.0 炉没开成，材料原路退回
            var _rf = null;
            if (window.compoundMat && typeof window.compoundMat.refund === 'function') {
                try { _rf = window.compoundMat.refund(_forgMats); } catch (eRf) { _rf = null; }
            }
            return {
                ok: false, reason: 'inventory-full',
                failReason: (typeof window.addItemFailReason === 'string') ? window.addItemFailReason : null,
                refundBack: _rf ? _rf.back : null, refundAsked: _rf ? _rf.asked : null
            };
        }
        // v27.13：产出登记——复合锻造出炉盖「craft」章（记实收件数，含极品成双；
        // 章盖在调用点而非 addResultItem 内——悬赏领赏等非炉中货也走那根管）。登记失败不拦获得。
        try {
            if (window.ItemProvenance && typeof window.ItemProvenance.note === 'function') {
                window.ItemProvenance.note('craft', templateId, addedGot);
            }
        } catch (ePrv) { console.warn('[静默失败] js/crafting/forging-compound.js · _forgingInner：产出登记未入簿（物品照常到手）', ePrv && ePrv.message); }
        // 时间推进
        if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') {
            try { window.timeSystem.advanceTime(recipe.timeCost || 10, 'forging-compound'); } catch (eTime) { /* 时间账推进失败（timeSystem 未初始化）：器已出炉，不回滚 */ }
        }
        // 事件总线
        if (typeof window.EventBus !== 'undefined') {
            var evtName = isImprint ? 'forging:compound:imprint' : 'forging:compound:success';
            window.EventBus.emit(evtName, {
                recipeId: recipeId, itemId: templateId, name: finalName,
                affixes: finalAffixes.map(function (a) { return a.key; }),
                imprint: isImprint, quality: quality.id, score: qr.score,
                points: forgeRes.spentPoints, totalPoints: forgeRes.budget.totalPoints
            });
        }
        // v20.94 熟能生巧：锻兵落地长锻造（铭纹是大活，长得多）
        if (typeof window.growLifeSkill === 'function') {
            window.growLifeSkill('锻造', isImprint ? 3 : 2, { reason: isImprint ? '铭纹锻兵' : '复合锻造' });
        }
        // StateRegistry
        try {
            _moduleState.lastWeapons.unshift({ recipeId: recipeId, name: finalName, affixes: finalAffixes.map(function (a) { return a.key; }), imprint: isImprint, quality: quality.id, day: (window.WorldCalendar ? window.WorldCalendar.day : 0) });
            if (_moduleState.lastWeapons.length > 20) _moduleState.lastWeapons.pop();
            if (isImprint) _moduleState.imprintCount++;
            // 第六十波：记的是池（不是标签）——玩家做的选择就是「从哪一池里挑」
            for (var fa2 = 0; fa2 < finalAffixes.length; fa2++) {
                var poolAff = finalAffixes[fa2].pool || 'common';
                _moduleState.preferTags[poolAff] = (_moduleState.preferTags[poolAff] || 0) + 1;
            }
        } catch (eState) {
            // 记账写不进去（存档结构被动过）不带坏这一炉的成品——器已出炉，账本这笔丢了就丢了
        }
        return {
            ok: true, itemId: templateId, name: finalName, affixes: finalAffixes,
            combatBonus: finalCombatBonus, imprint: isImprint, quality: quality, score: qr.score,
            count: addedGot, asked: outCount,
            // 第六十波：把整份「配方账」交回炼器台（总点数/已投/条数上限/环境加成/备注）
            plan: {
                points: forgeRes.spentPoints,
                totalPoints: forgeRes.budget.totalPoints,
                rawPoints: forgeRes.budget.rawPoints,
                skillMult: forgeRes.budget.skillMult,
                envMult: forgeRes.budget.envMult,
                skillTier: forgeRes.budget.tier.label,
                slotLimit: forgeRes.slotLimit,
                gradeSlotBonus: forgeRes.gradeSlotBonus,
                maxAffixes: forgeRes.maxAffixes,
                overflowPoints: forgeRes.overflowPoints,
                env: forgeRes.env,
                origin: forgeRes.origin,
                notes: forgeRes.notes,
                procTags: procTags,
                // 第七批：候天伺地的账一并交回炼器台（候了几天 / 候前第几日 / 真气付了几倍）
                houDays: houDays,
                houQiMult: 1 + houDays,
                houFromDay: houFromDay,
                houQiCost: qiTotal
            }
        };
    }

    // ============== 7. 模块级状态（StateRegistry 兼容） ==============
    // v25.1·试-08：本页面会话里注册进 window.itemById 的模子 id 账（读档/reset 时对账摘幽灵用）
    var _compoundLoadedIds = {};
    var _moduleState = {
        lastWeapons: [],
        imprintCount: 0,
        preferTags: {}, // tag -> count
        compoundTemplates: {}, // v25.1·试-08：templateId -> 动态注册的名炉兵器模子（纯数据，随档往返）
        // 一炉一器：实例号账（基名 -> 已开过的炉数）。落档，读档后继续往上发号，绝不与旧实例撞号。
        forgeSeq: {},
        // 第六十一波：后期料周期计数（档 key -> 已发生的次数）。读档不清零，否则「每 N 必掉」变成「每场必掉」。
        lateMatTally: {}
    };

    // 每炉一份产物 id：<基名>#<炉号>。同款两把剑因此是两个 id、两张模板、两个背包格，
    // 改第二件动不了第一件（旧账写死基名＝后炼的精货静默改写背包里旧那件）。
    // 发号前先撞一次 itemById：读档回填的旧实例、或本页会话里已发出的号，都不许重发。
    function _nextInstanceId(baseId) {
        var seq = Math.floor(Number(_moduleState.forgeSeq[baseId]) || 0) + 1;
        var candidate = baseId + '#' + seq;
        while (window.itemById && window.itemById[candidate]) { seq++; candidate = baseId + '#' + seq; }
        _moduleState.forgeSeq[baseId] = seq;
        return candidate;
    }

    function _exportState() { return JSON.parse(JSON.stringify(_moduleState)); }
    function _importState(s) {
        if (!s) return;
        if (Array.isArray(s.lastWeapons)) _moduleState.lastWeapons = s.lastWeapons.slice(0, 20);
        _moduleState.imprintCount = s.imprintCount || 0;
        _moduleState.preferTags = s.preferTags || {};
        // v25.1·试-08：读档回填动态模子——背包格只存 templateId，itemById 查无模子即成「来历不明的一格」。
        // 模子内容全是数据字段（attrs/combatBonus 为普通对象），JSON 往返无损，无需补函数引用。
        _moduleState.compoundTemplates = (s.compoundTemplates && typeof s.compoundTemplates === 'object') ? s.compoundTemplates : {};
        // 一炉一器：实例号账随档往返。读档后先按已回填的模子 id 把号抬到最高（老档没有 forgeSeq 时也不撞号）
        _moduleState.forgeSeq = (s.forgeSeq && typeof s.forgeSeq === 'object') ? s.forgeSeq : {};
        // 第六十一波：后期料周期计数随档往返（键都是本表里的 tier key，别的键原样放过不认）
        _moduleState.lateMatTally = (s.lateMatTally && typeof s.lateMatTally === 'object') ? s.lateMatTally : {};
        if (window.itemById) {
            // 先摘掉本局已注册、但这份档里没有的旧模子（读旧档不夹带上一局的幽灵货）
            Object.keys(_compoundLoadedIds).forEach(function (tid) {
                if (!_moduleState.compoundTemplates[tid] && window.itemById[tid] && window.itemById[tid]._forgeQuality) {
                    delete window.itemById[tid];
                }
            });
            Object.keys(_moduleState.compoundTemplates).forEach(function (tid) {
                var t = _moduleState.compoundTemplates[tid];
                if (t && t.id) { window.itemById[tid] = JSON.parse(JSON.stringify(t)); _compoundLoadedIds[tid] = 1; }
            });
            // 实例号抬到档里已有的最高号之上：老档没有 forgeSeq，靠模子 id 里的 #号 反推
            Object.keys(window.itemById).forEach(function (tid) {
                if (!window.itemById[tid] || !window.itemById[tid]._forgeQuality) return;
                var h = String(tid).lastIndexOf('#');
                if (h < 0) return;
                var base = String(tid).slice(0, h);
                var n = parseInt(String(tid).slice(h + 1), 10);
                if (!isFinite(n) || n <= 0) return;
                if (n > (Number(_moduleState.forgeSeq[base]) || 0)) _moduleState.forgeSeq[base] = n;
            });
        }
    }
    function _resetState() {
        // v25.1·试-08：新开局把上一世动态注册的模子从物品表摘干净，不留幽灵货
        if (window.itemById) {
            Object.keys(_compoundLoadedIds).forEach(function (tid) {
                if (window.itemById[tid] && window.itemById[tid]._forgeQuality) delete window.itemById[tid];
            });
        }
        _compoundLoadedIds = {};
        _moduleState.lastWeapons = [];
        _moduleState.imprintCount = 0;
        _moduleState.preferTags = {};
        _moduleState.compoundTemplates = {};
        _moduleState.forgeSeq = {};
        _moduleState.lateMatTally = {};
    }

    if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
        try {
            window.StateRegistry.register('forgingConfig', { version: 1, export: _exportState, import: _importState, reset: _resetState });
        } catch (eReg) {
            // 存档账挂不上：本模块退化成不落档的老样子（成品照出，只是读档后摸不到历史）
        }
    }

    // ============== 8. 导出 ==============
    window.ForgingCompound = {
        // 账
        MATERIAL_TAGS: MATERIAL_TAGS,
        MATERIAL_GRADE: MATERIAL_GRADE,
        LATE_MATERIAL_TIERS: LATE_MATERIAL_TIERS,
        LATE_MATERIAL_DROPS: LATE_MATERIAL_DROPS,
        lateMaterialTier: lateMaterialTier,
        settleLateMaterial: settleLateMaterial,
        // 妖兽部位档位账（第七批：档位铺到每一个等级段的只读账 + 知情口；不发料，见 2.7 那段注）
        // ★ 只给函数不给快照：BEAST_PART_TIERS 的数据源在 beast-ecosystem.js（仙侠.html:2264），
        //   比本文件（:2074）晚 ⇒ 在导出那一刻现读必然是空数组。快照属性在下面用 defineProperty 挂活读 getter。
        beastPartTiers: beastPartTiers,
        refreshBeastPartTiers: refreshBeastPartTiers,
        beastPartTiersOf: beastPartTiersOf,
        beastPartReport: beastPartReport,
        AFFIX_POOL: AFFIX_POOL,
        AFFIX_BY_TAG: AFFIX_BY_TAG,
        AFFIX_BY_POOL: AFFIX_BY_POOL,
        AFFIX_BY_KEY: AFFIX_BY_KEY,
        AFFIX_POOLS: AFFIX_POOLS,
        POOL_ORDER: POOL_ORDER,
        UNPOOLED_TAGS: UNPOOLED_TAGS,
        TIER_META: TIER_META,
        TIER_ORDER: TIER_ORDER,
        FORGE_PROCS: FORGE_PROCS,
        FORGE_SKILL_TIERS: FORGE_SKILL_TIERS,
        ENV_BONUS_TABLE: ENV_BONUS_TABLE,
        EMBRYOS: EMBRYOS,
        // 器形账（护具 coverage/resistance 的唯一出处）
        ARMOR_FORMS: ARMOR_FORMS,
        ARMOR_METAL_TAGS: ARMOR_METAL_TAGS,
        armorFormOf: armorFormOf,
        COMPOUND_FORGING_RECIPES: COMPOUND_FORGING_RECIPES,
        QUALITY_LADDER: QUALITY_LADDER,
        COMBAT_BONUS_KEYS: COMBAT_BONUS_KEYS,
        // 材料 → 池 / 候选
        getMaterialTags: getMaterialTags,
        getPoolsForMat: getPoolsForMat,
        listAffixOptionsForMat: listAffixOptionsForMat,
        listForgeCandidates: listForgeCandidates,
        pickAffixesForMat: pickAffixesForMat,
        // 技能档 / 总点数 / 分配
        forgeSkillTier: forgeSkillTier,
        affixSlotLimit: affixSlotLimit,
        GRADE_SLOT_BONUS: GRADE_SLOT_BONUS,
        gradeSlotBonus: gradeSlotBonus,
        effectiveAffixSlots: effectiveAffixSlots,
        maxPointsPerAffix: maxPointsPerAffix,
        materialPoints: materialPoints,
        computeForgeBudget: computeForgeBudget,
        collectForgeAffixes: collectForgeAffixes,
        resolveAffix: resolveAffix,
        // 环境
        getEnvBonus: getEnvBonus,
        getCurrentForgeEnv: getCurrentForgeEnv,
        forgeEnvFor: forgeEnvFor,
        readForgeEnvCtx: readForgeEnvCtx,
        withMaterialAxes: withMaterialAxes,
        envMissNotes: envMissNotes,
        // 淬火介质 / 择日（第六十二波）
        matPolarity: matPolarity,
        dayPolarity: dayPolarity,
        // 候天伺地（第七批）：「等阳日再来」→「选候几日」。代价＝真气按倍数付 + 世界真的过那几天
        HOU_MAX_DAYS: HOU_MAX_DAYS,
        houDaysOf: houDaysOf,
        forgeHouOptions: forgeHouOptions,
        houQiCost: houQiCost,
        holdForgeForDays: holdForgeForDays,
        QUENCH_BY_POLARITY: QUENCH_BY_POLARITY,
        QUENCH_LABEL: QUENCH_LABEL,
        POLARITY_YANG_TAGS: POLARITY_YANG_TAGS,
        POLARITY_YIN_TAGS: POLARITY_YIN_TAGS,
        POLARITY_TEXT: POLARITY_TEXT,
        // 材料产地（第六十二波：运行时派生自 ResourcePoints / LATE_MATERIAL_TIERS）
        materialOrigins: materialOrigins,
        refreshMaterialOrigins: refreshMaterialOrigins,
        forgeOriginReport: forgeOriginReport,
        originNote: originNote,
        ORIGIN_CRAFT_BONUS: ORIGIN_CRAFT_BONUS,
        // 品相 / 开炉
        judgeQuality: judgeQuality,
        rollQuality: rollQuality,
        qualityIndex: qualityIndex,
        registerForgeProc: registerForgeProc,
        getForgeProc: getForgeProc,
        executeCompoundForging: executeCompoundForging,
        getState: function () { return _moduleState; }
    };
    // 部位档位账挂**活读 getter**，不挂快照：数据源在 beast-ecosystem.js，比本文件晚加载，
    //   导出那一刻现读是空的；挂快照就会永久留一份空表（那正是「注册表留占位假值」）。
    try {
        Object.defineProperty(window.ForgingCompound, 'BEAST_PART_TIERS', {
            enumerable: true, configurable: true,
            get: function () { return beastPartTiers(); }
        });
    } catch (eLive) {
        // 定义不了（老宿主）：函数口 beastPartTiers() 仍然可用，不因此少一条路
    }
    if (window.XianXia) window.XianXia.ForgingCompound = window.ForgingCompound;
    try {
        console.log('[ForgingCompound] v3 · 第六十二波补齐四要素：淬火介质（辅材槽定淬口）+ 择日（日序阴阳同光）+ 材料产地（ResourcePoints 派生，工整 +' + ORIGIN_CRAFT_BONUS + '）· ' + POOL_ORDER.length + ' 池 / ' + AFFIX_POOL.length + ' 条词缀 / ' + ENV_BONUS_TABLE.length + ' 条环境加成，零随机');
    } catch (eLog) {
        // 控制台都没有（无头测试环境）：初始化日志打不出来不影响功能
    }
})();
