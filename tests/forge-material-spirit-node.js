// forge-material-spirit-node.js —— 炼器四要素与器灵资格的断言套件
//
// 这一套钉的是本批（第六十二波）补齐的四件事，外加三条不许犯的毛病：
//   ① 四要素齐全 —— 材料档位 / 技能等级 / 气候地点 / 淬火介质 / 择日，五项都在 ENV_BONUS_TABLE 口径里；
//   ② 器灵看材料 —— 只喂过凡铁级料的器身唤不醒（不是看阶数+灵石）；
//   ③ 条件不满足**写明原因**（禁止设计 #2：锁要亮锁 + 说清为什么，不许静默无效）；
//   ④ 无全局缩放 —— 既有倍率一个没动；
//   ⑤ 材料产地绑定 —— 材质→词缀类型→属性点这条链本来就在（本套把它钉死，免得当成"还没做"又重做一遍），
//      产地层是运行时从 ResourcePoints 派生的，不新造任何材料 id、不占位。
//
// 跑法：node tests/forge-material-spirit-node.js
// 回归验证：把 js/crafting/forging-compound.js 的 ENV_BONUS_TABLE 里三条 kind:'quench' 摘掉，
//   本套会红在 [A] 段「五要素齐全」与 [B] 段「淬口真的换得出属性」上。

'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const FORGE_SRC = 'js/crafting/forging-compound.js';
const BA_SRC = 'js/equipment/bonded-artifact.js';

let 通过 = 0, 失败 = 0;
function ok(c, m) { if (c) { 通过++; console.log('  ✓ ' + m); } else { 失败++; console.log('  [FAIL] ' + m); } }
function section(s) { console.log('\n=========== ' + s + ' ==========='); }
function load(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// ---- 资源点账：逐字抄自 js/extensions/resource-points.js:9-45 的矿脉那 10 行 ----
// 抄它是因为它就是**项目里真实存在的那份账**；抄来的每一行都能在源文件里对到字，
// 本套 [E] 段会拿源文件做交叉核对，对不上就红。
const REAL_MINES = [
  { id: 'mine_xuantie_01',   type: 'mine', name: '玄铁矿脉', region: '西荒', tier: 3, output: { mat_dark_iron: 5, mat_iron_ore: 10 } },
  { id: 'mine_leijing_01',  type: 'mine', name: '雷晶矿',   region: '东海', tier: 4, output: { mat_meteorite: 3, mat_thunder_crystal: 2 } },
  { id: 'mine_miying_01',   type: 'mine', name: '秘银矿',   region: '北冥', tier: 3, output: { mat_mithril: 4, mat_refined_silver: 8 } },
  { id: 'mine_zhuque_01',   type: 'mine', name: '朱雀矿',   region: '南疆', tier: 4, output: { mat_fire_crystal: 5, mat_phoenix_blood: 1 } },
  { id: 'mine_hantie_01',   type: 'mine', name: '寒铁矿',   region: '极北', tier: 3, output: { mat_cold_iron: 4, mat_refined_iron: 6 } },
  { id: 'mine_fenghuang_01',type: 'mine', name: '凤凰矿',   region: '南疆', tier: 5, output: { mat_phoenix_blood: 2, mat_fire_crystal: 8 } },
  { id: 'mine_zijin_01',    type: 'mine', name: '紫金矿',   region: '中州', tier: 3, output: { mat_purple_gold: 3, mat_refined_copper: 6 } },
  { id: 'mine_yunshi_01',   type: 'mine', name: '陨铁矿',   region: '天空', tier: 4, output: { mat_meteorite: 5, mat_star_iron: 2 } },
  { id: 'mine_xingchen_01', type: 'mine', name: '星辰矿',   region: '天空', tier: 5, output: { mat_star_iron: 4, mat_sky_iron: 3 } },
  { id: 'mine_longlin_01',  type: 'mine', name: '龙鳞矿',   region: '东海', tier: 4, output: { mat_dragon_scale: 3, mat_dragon_scale_iron: 5 } }
];

function 建炉窗(opts) {
  opts = opts || {};
  const W = {
    console: { log() {}, warn() {}, error() {} },
    currentCharData: { qi: 999999, hp: 100, location: '中州·少林寺', lifeSkills: { '锻造': 60 }, karma: 0 },
    itemById: {},
    addItem: (id, c) => c || 1,
    addResultItem: (id, c) => c || 1,
    getLifeSkill: k => W.currentCharData.lifeSkills[k] || 0,
    getCurrentCharData: () => W.currentCharData,
    EventBus: { emit() {}, on() {} },
    StateRegistry: { register() {} },
    timeSystem: { advanceTime() {}, getCurrentPeriod: () => ({ id: opts.period || 'afternoon' }) },
    gameTime: { currentSeason: opts.season || 'spring' },
    getCurrentWeather: () => ({ id: opts.weather || 'sunny' }),
    WorldCalendar: { day: opts.day == null ? 3 : opts.day },
    ResourcePoints: { INITIAL_POINTS: REAL_MINES }
  };
  W.window = W;
  eval('(function(window){' + load(FORGE_SRC) + '})(W);');
  return W;
}
function 炼(W, o) {
  o = o || {};
  W.currentCharData.lifeSkills['锻造'] = o.skill == null ? 60 : o.skill;
  W.WorldCalendar.day = o.day == null ? 3 : o.day;
  if (o.loc) W.currentCharData.location = o.loc;
  return W.ForgingCompound.executeCompoundForging('recipe_sword_open', {
    embryo: 'sword',
    main: o.main || ['mat_dark_iron'],
    assist: o.assist || ['mat_mithril', 'mat_meteorite'],
    rune: o.rune || [],
    allocation: o.alloc || null
  });
}
const notesOf = r => (r && r.plan && r.plan.notes) || [];
const hitsOf = r => ((r.plan && r.plan.env && r.plan.env.hits) || []).map(h => h.id);

// =====================================================================
section('[A] 四要素齐全：五项都进 ENV_BONUS_TABLE 口径');
// =====================================================================
const WF = 建炉窗();
const F = WF.ForgingCompound;
{
  const kinds = {};
  F.ENV_BONUS_TABLE.forEach(e => { kinds[e.kind] = (kinds[e.kind] || 0) + 1; });
  console.log('  · ENV_BONUS_TABLE ' + F.ENV_BONUS_TABLE.length + ' 条，kind 分布 ' + JSON.stringify(kinds));
  // ① 材有美（材料档位）
  ok(F.MATERIAL_GRADE && Object.keys(F.MATERIAL_GRADE).length >= 20,
      '材有美：MATERIAL_GRADE ' + Object.keys(F.MATERIAL_GRADE).length + ' 种材料有档位（品阶 0~5）');
  // ② 工有巧（技能等级）
  ok(F.FORGE_SKILL_TIERS.length === 5 && F.forgeSkillTier(80).label === '天人',
      '工有巧：FORGE_SKILL_TIERS 五档（学徒…天人），锻造 80 → ' + F.forgeSkillTier(80).label);
  // ③ 天时·地气（时辰/季节/天气/地点）
  ok(kinds.period === 2 && kinds.season === 2 && kinds.weather === 2 && kinds.location === 3,
      '天时·地气：时辰 ' + kinds.period + ' / 季节 ' + kinds.season + ' / 天气 ' + kinds.weather + ' / 地点 ' + kinds.location
      + '（原有 9 条一条没删）');
  // ④ 淬火介质
  ok(kinds.quench === 3, '淬火介质：ENV_BONUS_TABLE 里 kind:quench ' + kinds.quench + ' 条（清水/地溲/炭火）');
  // ⑤ 择日
  ok(kinds.day === 2, '择日：ENV_BONUS_TABLE 里 kind:day ' + kinds.day + ' 条（阳日同光/阴日同光）');
  // 五项每一条都必须自带 pointMult 口径 + 依据，且 pointMult 能进总点数（envMult）
  const 五项 = F.ENV_BONUS_TABLE.filter(e => ['quench', 'day'].indexOf(e.kind) >= 0);
  ok(五项.every(e => typeof e.pointMult === 'number' && e.pointMult > 0),
      '新五项全部有正 pointMult（沿用 env.pointMult 口径，不是另开一套乘子）');
  ok(五项.every(e => e.basis && e.basis.length > 8),
      '新五项每条自带依据（basis）——清水淬那条标了「转引」：'
      + (() => { const q = 五项.filter(e => e.id === 'env_quench_clear')[0]; return q && q.basis ? q.basis.indexOf('转引') >= 0 : '(清水淬条已被摘掉)'; })());
  // 口径真的接到总点数上：envMult = 1 + pointMult
  // ⚠️ 补轴是**就地**补进那份 env 对象的（面板 compound-ui.js:272~358 拿的是同一个对象），
  //   所以这里必须拿同一份 env 比，不能再取一次新的。
  const env0 = F.getCurrentForgeEnv();
  const 补轴前 = env0.pointMult;
  const 基线 = F.computeForgeBudget(['mat_dark_iron'], ['mat_iron_ore'], [], 60, env0);
  const 轴账 = 基线.envMult;
  ok(Math.abs(轴账 - (1 + env0.pointMult)) < 1e-9,
      '口径接上了：computeForgeBudget 的 envMult = 1 + env.pointMult（实测 ' + 轴账.toFixed(3) + '）');
  ok(env0.pointMult > 补轴前,
      '补轴就地生效：同一份 env 的 pointMult 由 ' + 补轴前 + ' 涨到 ' + env0.pointMult
      + ' ⇒ 面板显示与开炉实得同数（不然屏上写 ×1.10、实得 ×1.26）');
  // 总点数公式本身没被改：totalPoints = round(raw × skillMult × envMult / 6)
  const tier = F.forgeSkillTier(60);
  const want = Math.max(1, Math.round(基线.rawPoints * (1 + tier.pointBonus) * 轴账 / 6));
  ok(基线.totalPoints === want,
      '总点数 = 炉料 × (1+手艺段) × (1+环境) ÷ 6 仍成立（' + 基线.totalPoints + ' = ' + want + '）');
}

// =====================================================================
section('[B] 淬火介质：辅材第一件＝淬口，玩家点得到、数值真的动');
// =====================================================================
{
  ok(F.matPolarity('mat_fire_crystal') === 'yang', '火晶＝阳（读既有 MATERIAL_TAGS 的 fire 标签）');
  ok(F.matPolarity('mat_cold_iron') === 'yin', '寒铁＝阴（既有标签 frost）');
  ok(F.matPolarity('mat_dark_iron') === 'plain', '玄铁＝常（xuantie/metal-heavy 都不在阴阳表里 → 不硬判）');
  ok(F.matPolarity('mat_demon_beast_core') === 'yin',
      '妖芯＝阴：标签声明序是 [\'yinhun\',\'fire\']，按声明序取第一个 ⇒ 阴（与 getPoolsForMat 同口径）');

  const 阳炉 = 炼(WF, { main: ['mat_star_iron'], assist: ['mat_fire_crystal', 'mat_mithril'] });
  const 阴炉 = 炼(WF, { main: ['mat_cold_iron'], assist: ['mat_cold_iron', 'mat_refined_iron'] });
  const 常炉 = 炼(WF, { main: ['mat_dark_iron'], assist: ['mat_iron_ore', 'mat_iron_ore'] });
  ok(hitsOf(阳炉).indexOf('env_quench_char') >= 0, '阳料辅材 → 炭火淬（炭居十七，木炭居十三）');
  ok(hitsOf(阴炉).indexOf('env_quench_dishou') >= 0, '阴料辅材 → 地溲淬（「夷人又有以地溲淬刀剑者」）');
  ok(hitsOf(常炉).indexOf('env_quench_clear') >= 0, '常料辅材 → 清水淬（常法）');

  // ★ 玩家真能改：同一个主材、同一手艺、同一日子，只换辅材第一件 ⇒ 三种淬口
  ok(hitsOf(常炉).indexOf('env_quench_char') < 0 && hitsOf(阳炉).indexOf('env_quench_clear') < 0,
      '同主材换辅材 ⇒ 淬口确实跟着换（玩家有一个可点的开关，不是纯随机）');
  // 数值真的动：三条淬口给的属性键各不相同，且都进了 env.attrMult
  const cEnv = F.getEnvBonus({ quench: 'clear' });
  const dEnv = F.getEnvBonus({ quench: 'dishou' });
  const fEnv = F.getEnvBonus({ quench: 'char' });
  ok(cEnv.attrMult.defense === 0.10 && dEnv.attrMult.attack === 0.15 && fEnv.attrMult.fireDmg === 0.15,
      '三种淬口给三种属性键：清水→defense .10 / 地溲→attack .15 / 炭火→fireDmg .15');
  // resolveAffix 真吃到淬口的抬值（不是只挂个标签）
  const 无 = F.resolveAffix(F.AFFIX_BY_KEY.tough, 1, 60, { attrMult: {} }).attrVal;
  const 水 = F.resolveAffix(F.AFFIX_BY_KEY.tough, 1, 60, cEnv).attrVal;
  ok(水 > 无, '清水淬真的抬高了坚韧的数值（' + 无 + ' → ' + 水 + '）');
}

// =====================================================================
section('[C] 择日：日子×阴阳同光，玩家挑日子与挑料');
// =====================================================================
{
  ok(F.dayPolarity(3) === 'yang' && F.dayPolarity(4) === 'yin',
      '日序奇偶定阴阳：第 3 日阳、第 4 日阴（历法通例，零骰）');
  ok(F.dayPolarity('x') === null && F.dayPolarity(undefined) === null,
      '日序读不到就返回 null（不猜、不掷骰）');

  const 阳料阳日 = 炼(WF, { day: 3, main: ['mat_star_iron'], assist: ['mat_fire_crystal', 'mat_mithril'] });
  const 阴料阴日 = 炼(WF, { day: 4, main: ['mat_cold_iron'], assist: ['mat_cold_iron', 'mat_refined_iron'] });
  const 阳料阴日 = 炼(WF, { day: 4, main: ['mat_star_iron'], assist: ['mat_fire_crystal', 'mat_mithril'] });
  ok(hitsOf(阳料阳日).indexOf('env_day_yang') >= 0, '阳料 + 阳日 ⇒ 择日同光');
  ok(hitsOf(阴料阴日).indexOf('env_day_yin') >= 0, '阴料 + 阴日 ⇒ 择日同光');
  ok(hitsOf(阳料阴日).indexOf('env_day_yin') < 0 && hitsOf(阳料阴日).indexOf('env_day_yang') < 0,
      '阳料 + 阴日 ⇒ 不同光，两条择日都不命中');

  // 数值：同光那一炉的炉料份量比不同光的高（+15%）
  const 多 = 阳料阳日.plan.totalPoints, 少 = 阳料阴日.plan.totalPoints;
  ok(多 > 少, '同光比不同光多认炉料份量（' + 多 + ' > ' + 少 + '）');
  // ★ 代价可写出来：一炉只吃一个日子 ⇒ 两头都要就得开两炉
  const 两炉材料 = 阳料阳日.plan.totalPoints + 阳料阴日.plan.totalPoints;
  ok(两炉材料 > 多, '两头都要就得开两炉（两炉合计 ' + 两炉材料 + ' 点 > 一炉 ' + 多 + ' 点）——这是择日的价钱，不是白送');
  // 常料：既不给也不罚
  const 常 = 炼(WF, { day: 3, main: ['mat_dark_iron'], assist: ['mat_iron_ore', 'mat_iron_ore'] });
  ok(hitsOf(常).indexOf('env_day_yang') < 0 && hitsOf(常).indexOf('env_day_yin') < 0,
      '常料不吃择日（既不给也不罚，不是「点了没反应」的坑）');
}

// =====================================================================
section('[D] 条件不满足必须写明原因（禁止设计 #2）');
// =====================================================================
{
  const 阳料阴日 = 炼(WF, { day: 4, main: ['mat_star_iron'], assist: ['mat_fire_crystal', 'mat_mithril'] });
  const txt = notesOf(阳料阴日).join('｜');
  ok(txt.indexOf('择日不合光') >= 0, '择日不合光：notes 里点名了「不合光」（不是静默不生效）');
  ok(txt.indexOf('阴阳不同光') >= 0 && txt.indexOf('第 4 日为阴日') >= 0,
      '原因写全了：第几日、什么日、主材属什么、差在哪 —— ' + notesOf(阳料阴日).filter(n => n.indexOf('择日') >= 0)[0].slice(0, 60) + '…');
  ok(txt.indexOf('等阳日再来') >= 0 || txt.indexOf('或换成阳料') >= 0,
      '还给了下一步怎么办（等阳日 / 换阳料）——「锁要亮锁 + 写清原因」，不许只显示一个 0');

  const 常 = 炼(WF, { day: 3, main: ['mat_dark_iron'], assist: ['mat_iron_ore', 'mat_iron_ore'] });
  const ctxt = notesOf(常).join('｜');
  ok(ctxt.indexOf('常料') >= 0 && ctxt.indexOf('择日对它不判') >= 0,
      '常料那条也写明「择日对它不判」，不静默');
  ok(ctxt.indexOf('淬口＝') >= 0, '淬口每次都播报（辅材第一件是什么、属什么）');
  // 无主材 ⇒ 判不了，也得说
  const 无主 = F.forgeEnvFor({ assist: ['mat_fire_crystal'] });
  const 无主txt = F.envMissNotes(无主).join('｜');
  ok(无主txt.indexOf('无主材可比') >= 0, '没有主材时择日也写原因：「' + 无主txt.split('｜').filter(n => n.indexOf('主材') >= 0)[0] + '」');
  // 没有淬料
  const 无淬 = F.forgeEnvFor({ main: ['mat_star_iron'], assist: [] });
  const 无淬txt = F.envMissNotes(无淬).join('｜');
  ok(无淬txt.indexOf('未择淬料') >= 0, '没放淬料时写明「未择淬料」并给出怎么放');
  // 历书缺席
  const 没历 = { ctx: { dayNo: null, quench: 'clear', quenchMat: 'mat_iron_ore', assistPolarity: 'plain' }, hits: [], attrMult: {}, pointMult: 0.05 };
  const 没历txt = F.envMissNotes(没历).join('｜');
  ok(没历txt.indexOf('历书读不到日子') >= 0, '历书读不到时写明「历书读不到日子（WorldCalendar 缺席）」，其余各轴照常');
}

// =====================================================================
section('[E] 材料产地绑定：材质→词缀类型→属性点这条链本来就在（钉死，免得重做一遍）');
// =====================================================================
{
  // 5 池 30 词缀这条链，每一段都要真通
  const 玄铁池 = F.getPoolsForMat('mat_dark_iron');
  ok(玄铁池.join(',') === 'metal', '材质 → 类型：玄铁落「' + 玄铁池.join('/') + '」池（金石池）');
  const 龙血池 = F.getPoolsForMat('mat_dragon_blood');
  ok(龙血池.join(',') === 'dragon,fire', '材质 → 类型：龙血落「' + 龙血池.join('/') + '」（按标签声明序，不重排）');
  const 候选 = F.listAffixOptionsForMat('mat_dark_iron', 100);
  ok(候选.affixes.length > 0 && 候选.affixes.every(a => 玄铁池.indexOf(a.pool) >= 0),
      '类型 → 候选词缀：玄铁的 ' + 候选.affixes.length + ' 条候选全在金石池内（池外一条也没有）');
  const 投点 = F.collectForgeAffixes({ main: ['mat_dark_iron'], assist: ['mat_iron_ore'], skill: 60, allocation: { edge: 3, tough: 2 } });
  ok(投点.affixes.length === 2 && 投点.affixes[0].points === 3 && 投点.affixes[0].tierId === 'xian',
      '玩家 → 属性点：分配 {edge:3, tough:2} 真落成 仙品3点 + 灵品2点（这不是"只有池子"，分配早就在链上）');
  ok(F.AFFIX_POOL.length === 30, '池子规模：AFFIX_POOL ' + F.AFFIX_POOL.length + ' 条 / 五池 ' + F.POOL_ORDER.length + ' 池（原有的一条没删）');

  // 产地层：运行时从 ResourcePoints 派生，零新造 id
  const 玄铁来路 = F.materialOrigins('mat_dark_iron');
  ok(!!玄铁来路 && 玄铁来路[0].name === '玄铁矿脉' && 玄铁来路[0].region === '西荒',
      '产地层：mat_dark_iron 的来路＝' + (玄铁来路 ? 玄铁来路.map(s => s.name + '（' + s.region + '·tier' + s.tier + '）').join('/') : '查不到')
      + '，逐字取自 resource-points.js');
  ok(F.materialOrigins('mat_cold_iron')[0].name === '寒铁矿', '寒铁 → 寒铁矿（极北·tier3）');
  ok(F.materialOrigins('mat_sky_iron')[0].name === '星辰矿', '天铁 → 星辰矿（天空·tier5）');
  // 占位禁令：查不到出处的料必须返回 null，绝不编一个产地
  ok(F.materialOrigins('mat_nothing_like_this') === null, '查不到出处的料返回 null（禁止设计 #4：不留占位假值）');
  // ★ 如实量一次覆盖率：材料表本来就没有产地字段，能对上真实资源点/后期料档的只有一部分。
  //   对不上的**必须**是「来路不明」而不是被编一个产地——这一条把覆盖率钉住，也把缺口留在账上。
  const 无来路 = Object.keys(F.MATERIAL_GRADE).filter(m => !F.materialOrigins(m));
  console.log('  · MATERIAL_GRADE 28 种材料中，' + (28 - 无来路.length) + ' 种查得到真实来路，'
    + 无来路.length + ' 种查不到（' + 无来路.join('、') + '）——查不到就是查不到，不编');
  ok(无来路.length > 0 && 无来路.every(m => F.materialOrigins(m) === null),
      '对不上来路的 ' + 无来路.length + ' 种材料全部返回 null（诚实缺口，不是占位假值）');
  // 交叉核对：抄来的那 10 行矿脉必须逐字对得上源文件
  const rp = load('js/extensions/resource-points.js');
  const 对不上 = REAL_MINES.filter(m => rp.indexOf("id: '" + m.id + "'") < 0 || rp.indexOf("name: '" + m.name + "'") < 0 || rp.indexOf("region: '" + m.region + "'") < 0);
  ok(对不上.length === 0, '本套抄的 10 条矿脉逐字对得上 resource-points.js（对不上 ' + (对不上.map(m => m.name).join(',') || '0 条') + '）');

  // 产地影响产出：同出一处 ⇒ 工整 +8（《考工记》「迁乎其地而弗能为良」）
  const 同矿 = 炼(WF, { main: ['mat_dark_iron'], assist: ['mat_iron_ore', 'mat_iron_ore'], day: 4 });
  const 混矿 = 炼(WF, { main: ['mat_dark_iron'], assist: ['mat_mithril', 'mat_star_iron'], day: 4 });
  ok(同矿.plan.origin.samePoint === true && 同矿.plan.origin.pointName === '玄铁矿脉',
      '同出一处：主辅材全出自玄铁矿脉 ⇒ 工整 +' + F.ORIGIN_CRAFT_BONUS);
  ok(混矿.plan.origin.samePoint === false && 混矿.plan.origin.sources.length > 1,
      '料出多处：' + 混矿.plan.origin.sources.map(s => s.name).join('、') + ' ⇒ 不享工整');
  ok(同矿.score > 混矿.score - 8 && 同矿.score >= 混矿.score,
      '同矿那炉的工评不吃亏（' + 同矿.score + ' ≥ ' + 混矿.score + '）——产地是加成不是暗扣');
  // ★ 取舍：同矿 ⇒ 料种少 ⇒ 炉料份量少；混料 ⇒ 份量多但无工整
  ok(混矿.plan.totalPoints > 同矿.plan.totalPoints,
      '代价写得出来：混料那一炉炉料份量更多（' + 混矿.plan.totalPoints + ' > ' + 同矿.plan.totalPoints + '），同矿换的是工评不是白赚');
  // 来路不明的那一件必须点名（不静默）—— mat_beast_bone 在资源点账与后期料档里都查不到
  const 含不明 = 炼(WF, { main: ['mat_dark_iron'], assist: ['mat_beast_bone', 'mat_iron_ore'], day: 4 });
  ok(notesOf(含不明).some(n => n.indexOf('mat_beast_bone') >= 0 && n.indexOf('查不到出处') >= 0),
      '来路含不明料时 notes 点名是哪一件（mat_beast_bone）：'
      + notesOf(含不明).filter(n => n.indexOf('查不到出处') >= 0)[0].slice(0, 46) + '…');
}

// =====================================================================
section('[F] 无全局缩放：既有倍率一个没动');
// =====================================================================
{
  const src = load(FORGE_SRC);
  // 既有九条一条没删、参数逐字未改
  const 旧九条 = [
    ['env_period_noon_fire', 'fireDmg', 0.15, 0.10], ['env_period_night_qi', 'qiRegen', 0.10, 0.10],
    ['env_season_winter_tough', 'defense', 0.15, 0.10], ['env_season_summer_chill', 'fireDmg', -0.10, 0.10],
    ['env_weather_storm_thunder', 'thunderDmg', 0.20, 0.10], ['env_weather_snow_tough', 'defense', 0.10, 0.05],
    ['env_loc_fire', 'fireDmg', 0.15, 0.10], ['env_loc_frost', 'fireDmg', -0.10, 0.10],
    ['env_loc_leylines', 'qiRegen', 0.15, 0.20]
  ];
  let 旧九条全对 = true, 细节 = [];
  旧九条.forEach(([id, k, am, pm]) => {
    const e = F.ENV_BONUS_TABLE.filter(x => x.id === id)[0];
    const good = !!e && e.attrMult[k] === am && e.pointMult === pm;
    if (!good) { 旧九条全对 = false; 细节.push(id); }
  });
  ok(旧九条全对, '原有 9 条环境加成 id/属性/pointMult 逐字未改（对不上 ' + (细节.join(',') || '0 条') + '）');
  ok(F.ENV_BONUS_TABLE.length === 9 + 5, 'ENV_BONUS_TABLE 只增不改：9 → ' + F.ENV_BONUS_TABLE.length + '（新增 5 条，未删未改）');

  // 工有巧那条链（技能段加成/槽位/每条点数上限）一个没动
  ok(F.FORGE_SKILL_TIERS.map(t => t.pointBonus).join(',') === '0,0.25,0.5,0.8,1.2',
      'FORGE_SKILL_TIERS 的 pointBonus 原样（0 / .25 / .5 / .8 / 1.2）');
  ok(F.FORGE_SKILL_TIERS.map(t => t.slots).join(',') === '2,3,4,5,6', '技能档的条数上限原样（2…6）');
  ok(src.indexOf('var POINT_SCALE = 6;') >= 0, 'POINT_SCALE 仍是 6（没有把总点数偷偷调大）');
  ok(src.indexOf('var GRADE_BASE_POINTS = [3, 4, 6, 8, 11, 15]') >= 0, 'GRADE_BASE_POINTS 原样（3,4,6,8,11,15）');
  ok(src.indexOf('var ROLE_POINT_MULT = { main: 1, assist: 0.5, rune: 1.5 }') >= 0,
      'ROLE_POINT_MULT 原样（主 1 / 辅 0.5 / 铭纹 1.5）——辅材半额炉料正是淬口的价钱，没被改');
  // 品相阶梯没动
  ok(src.indexOf("var QUALITY_LADDER = [") >= 0 && F.QUALITY_LADDER.map(q => q.mult).join(',') === '0.7,1,1.2,1.5,2',
      'QUALITY_LADDER 原样（0.7 / 1 / 1.2 / 1.5 / 2）——新机制没有加第六档');
  ok(src.indexOf('var ORIGIN_CRAFT_BONUS = 8') >= 0,
      '产地工整只进 judgeQuality 的 craft 分（+' + F.ORIGIN_CRAFT_BONUS + '，封在 100 以内），没动品相阶梯、没动战斗乘区');
  // 工评里没有「无脑乘一个东西」的痕迹
  ok(F.judgeQuality(60, 2, false, { spent: 4, total: 8 }).origin === 0 &&
     F.judgeQuality(60, 2, false, { spent: 4, total: 8 }, { samePoint: true }).origin === F.ORIGIN_CRAFT_BONUS,
      'judgeQuality 的第 5 参不给就不加、给了才加 —— 老调用点（四参）数值一位不差');
  // 确定性零骰
  const r1 = 炼(WF, { day: 3, main: ['mat_star_iron'], assist: ['mat_fire_crystal', 'mat_mithril'] });
  const r2 = 炼(WF, { day: 3, main: ['mat_star_iron'], assist: ['mat_fire_crystal', 'mat_mithril'] });
  ok(r1.name === r2.name && r1.score === r2.score && r1.plan.totalPoints === r2.plan.totalPoints,
      '新机制全确定性：同料同技同日连炼两炉逐字相同（' + r1.name + ' / 工评' + r1.score + '）');
  ok(src.indexOf('Math.random()') < 0, '炼器模块仍然零 Math.random');
}

// =====================================================================
section('[G] 器灵觉醒看材料档位，不看阶数+灵石（★本批最重要的一条）');
// =====================================================================
const BA = load(BA_SRC);
function 建器灵世界(opts) {
  opts = opts || {};
  const msgs = [], times = [], removed = [];
  let stones = opts.stones == null ? 1000 : opts.stones;
  const W = {
    console: { log() {}, warn() {}, error() {} },
    showMessage: (t, k) => msgs.push({ text: String(t), kind: k }),
    currentCharData: { level: 30, realm: '金丹', health: 100, maxHealth: 100, karma: opts.karma == null ? 0 : opts.karma, _bondedArtifact: opts.ba || null },
    timeSystem: { advanceTime: (m, l) => times.push([m, l]) },
    DataManager: { deductSpiritStones: (n) => { if (stones < n) return false; stones -= n; return true; } },
    inventory: { slots: opts.slots || [] },
    itemById: opts.itemById || {},
    removeItem: (uid) => removed.push(uid),
    updateCharacterStatus() {},
    getRealmTier: () => 3,
    _getMainTechniqueElement: () => opts.element || 'metal',
    // 材料档位的权威表在 forging-compound.js（真实游戏里它是同一个对象）
    ForgingCompound: W0.ForgingCompound
  };
  W.window = W;
  eval('(function(window){' + BA + '})(W);');
  return { W, msgs, times, removed, stones: () => stones, text: () => msgs.map(m => m.text).join('\n') };
}
const W0 = 建炉窗();   // 先把真实的 MATERIAL_GRADE 装出来给器灵世界用
{
  // 粗铁级（grade 0）喂出来的器身 → 唤不醒
  const 铁料 = {
    slots: [{ uid: 'u1', templateId: 'mat_iron_ore', count: 9 }],
    itemById: { mat_iron_ore: { id: 'mat_iron_ore', name: '粗铁矿石', type: 'material', quality: 'pin9' } }
  };
  const 凡铁 = 建器灵世界({
    ba: { name: '试炼剑', level: 3, exp: 0, expMax: 140, element: 'metal', durability: 100, maxDurability: 100 },
    slots: 铁料.slots, itemById: 铁料.itemById
  });
  for (let i = 0; i < 3; i++) 凡铁.W.feedArtifact();     // 喂三次，把「只吃过粗铁」这件事做实
  const 凡铁档 = 凡铁.W.currentCharData._bondedArtifact.mats;
  ok(!!凡铁档 && 凡铁档.topGrade === 0 && 凡铁档.topMat === 'mat_iron_ore',
      '喂料记账：粗铁（品阶 0）喂进去，器身材料账 topGrade=' + (凡铁档 && 凡铁档.topGrade) + ' topMat=' + (凡铁档 && 凡铁档.topMat));
  ok(凡铁.W.awakenArtifactSpirit() === false,
      '★ 凡铁级材料炼出的器物不会觉醒灵（品阶 0 < 门槛 ' + 凡铁.W.SPIRIT_AWAKEN_MIN_GRADE + '）');
  ok(凡铁.stones() === 1000, '唤不醒 ⇒ 分文不扣（既有口径没被破坏）');
  ok(/凡铁不该有灵/.test(凡铁.text()) && /秘银/.test(凡铁.text()),
      '★ 不静默：屏上写明「凡铁不该有灵」，并点名哪几样料够格（秘银/雷晶/妖丹/龙骨/陨铁）');

  // 喂进一件上品级（grade 3：秘银）→ 唤得醒
  const 银料 = {
    slots: [{ uid: 'u1', templateId: 'mat_mithril', count: 9 }],
    itemById: { mat_mithril: { id: 'mat_mithril', name: '秘银', type: 'material', quality: 'pin7' } }
  };
  const 秘银 = 建器灵世界({
    ba: { name: '试炼剑', level: 3, exp: 0, expMax: 140, element: 'metal', durability: 100, maxDurability: 100 },
    slots: 银料.slots, itemById: 银料.itemById
  });
  秘银.W.feedArtifact();
  const 银档 = 秘银.W.currentCharData._bondedArtifact.mats;
  ok(银档.topGrade === 3, '秘银品阶 3 记进器身账（topGrade=' + 银档.topGrade + '）');
  ok(秘银.W.awakenArtifactSpirit() === true, '★ 吃进上品级材料 ⇒ 器灵觉醒成行');
  const sp = 秘银.W.currentCharData._bondedArtifact.spirit;
  ok(!!sp && sp.awakened && sp.origin && sp.origin.topMat === 'mat_mithril',
      '灵醒的来路随器灵记下：' + (sp.origin && sp.origin.gradeName + '·' + sp.origin.topMatName));
  ok(秘银.stones() === 800 && 秘银.times[0][0] === 60, '代价照旧：200 灵石 + 一个时辰（只是多了一道资格门，不是涨价）');

  // 只喂粗铁但阶数够 ⇒ 唤不醒；同样只喂粗铁但阶数不够 ⇒ 也是唤不醒（两道门都在）
  const 低阶 = 建器灵世界({
    ba: { name: '试炼剑', level: 2, exp: 0, expMax: 110, element: 'metal' },
    slots: 银料.slots, itemById: 银料.itemById
  });
  低阶.W.feedArtifact();
  ok(低阶.W.awakenArtifactSpirit() === false && /才 2 阶/.test(低阶.text()),
      '阶数门仍在（第 62 波没有拿掉既有那道门）');
  const rdy = 凡铁.W.spiritAwakenReadiness();
  ok(rdy.reason === 'mat-low' && rdy.gradeOk === false && rdy.levelOk === true && rdy.why.length > 20,
      'readiness 把两道门分开报：levelOk=' + rdy.levelOk + ' gradeOk=' + rdy.gradeOk + ' reason=' + rdy.reason);

  // ★ 只喂过粗铁的器，把品阶顶上去也不能唤醒（不许有绕过路径）
  const 满阶铁 = 建器灵世界({
    ba: { name: '试炼剑', level: 10, exp: 0, expMax: 350, element: 'metal' },
    slots: 铁料.slots, itemById: 铁料.itemById
  });
  满阶铁.W.feedArtifact();
  ok(满阶铁.W.awakenArtifactSpirit() === false,
      '★ 阶数顶到 10 也救不了：材料仍是凡铁级 ⇒ 不觉醒（没有「阶数+灵石」旁路）');

  // ★ 主人德行（karma）这一道门
  const 善器 = (karma) => {
    const w = 建器灵世界({
      ba: { name: '试炼剑', level: 3, exp: 0, expMax: 140, element: 'metal', durability: 100, maxDurability: 100 },
      slots: 银料.slots, itemById: 银料.itemById, karma: karma
    });
    w.W.feedArtifact();
    return w;
  };
  const 逆道 = 善器(-60);
  ok(逆道.W.awakenArtifactSpirit() === false && 逆道.stones() === 1000,
      '★ 主人有逆理之谋 ⇒ 不醒（「人君有逆理之谋，其剑即出」），分文不扣');
  ok(/逆理之谋/.test(逆道.text()) && /去无道以就有道/.test(逆道.text()),
      '德行这道门也写明原因与出路，不是静默拒绝');
  const 正道 = 善器(0);
  ok(正道.W.awakenArtifactSpirit() === true, '因果 0（中立，app.js:3439 的档）⇒ 照常唤醒');
  const 善念 = 善器(60);
  ok(善念.W.awakenArtifactSpirit() === true, '因果 60（善）⇒ 照常唤醒');
  ok(善器(-50).W.awakenArtifactSpirit() === true,
      '阈值就是 app.js:2074 / building-effects.js:561 同一条线：karma = −50 仍放行，−51 才拦');
  // 器灵出走：德行跌进逆道 ⇒ 只收走器灵每级 +2%，本体每阶 +5% 与器物分毫未动
  const 出走 = 善器(0);
  出走.W.awakenArtifactSpirit();
  出走.W.currentCharData._bondedArtifact.spirit.level = 3;
  const 有道时 = 出走.W.artifactCombatMul();
  出走.W.currentCharData.karma = -70;
  const 逆道时 = 出走.W.artifactCombatMul();
  ok(Math.abs(有道时 - 1.16) < 1e-9, '有道时：3 阶本体 1.10 + 器灵 3 级 0.06 = ' + 有道时.toFixed(4));
  ok(Math.abs(逆道时 - 1.10) < 1e-9, '★ 逆道时器灵出走：只收走器灵那 0.06，本体每阶 +5% 分毫未动（' + 逆道时.toFixed(4) + '）');
  出走.W.currentCharData.karma = 20;
  ok(Math.abs(出走.W.artifactCombatMul() - 1.16) < 1e-9,
      '★ 德行回来器灵就回来（可逆，不是永久损失，也不是剥装备）');
  const 闭目 = 出走.W.currentCharData.karma = -70;
  ok(出走.W.communeWithSpirit() === false && /闭目不睁/.test(出走.text()),
      '逆道时交感不成，且明写「闭目不睁」（时辰与经验一概未动）');

  // ★ 禁止改成好感度阈值：把注释剥掉之后，代码里不许出现好感/亲密度一类的计数器
  const 代码 = BA.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').map(l => l.replace(/^\s*\/\/.*$/, '')).join('\n');
  ok(!/affinity|favor|好感|亲密度|trust/.test(代码),
      '剥掉注释后源码里没有好感度/亲密度一类的计数器（德行＝karma 既有字段）');
  ok(/currentCharData[\s\S]{0,40}karma/.test(BA), '德行读的是既有字段 currentCharData.karma，不是新造的一套道德系统');
  ok(BA.indexOf('karma-retribution') >= 0 && /karma: charData\.karma|karma/.test(load('js/core/game-state.js')),
      'karma 本来就在存档白名单里（core/game-state.js），本批不开新键');
  ok(!/localStorage/.test(BA), '本文件没新增任何 localStorage 键（器灵账随 _bondedArtifact 整包往返）');
}

console.log('\n=========================================');
console.log('forge-material-spirit: ' + 通过 + ' passed, ' + 失败 + ' failed');
console.log('=========================================');
process.exit(失败 ? 1 : 0);