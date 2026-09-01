'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
let passed = 0;
function assert(cond, msg) { if (!cond) throw new Error(msg); passed++; }
function load(rel) { vm.runInThisContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), { filename: rel }); }

// Browser-like minimal globals
global.window = global;
global.document = { getElementById(){ return null; }, addEventListener(){}, body:{ appendChild(){} } };
const _storage = Object.create(null);
global.localStorage = {
  getItem(k){ return Object.prototype.hasOwnProperty.call(_storage,k) ? _storage[k] : null; },
  setItem(k,v){ _storage[k]=String(v); },
  removeItem(k){ delete _storage[k]; },
  clear(){ Object.keys(_storage).forEach(k=>delete _storage[k]); }
};
global.XianXia = {};
global.showMessage = function(){};
global.gameLog = { add(){} };

// Core state + time scheduler
load('js/core/balance-config.js');
load('js/core/state-registry.js');
load('js/core/event-bus.js');
global.timeSystem = { gameTime: { totalMinutes: 100, currentDay: 1 } };
load('js/core/game-scheduler.js');
let fired = 0;
GameScheduler.registerHandler('test:once', payload => { fired += payload.n; return true; });
GameScheduler.schedule('test:once', 120, {n: 3}, {id:'t1'});
assert(GameScheduler.processDue(119) === 0 && fired === 0, 'scheduler fired early');
assert(GameScheduler.processDue(120) === 1 && fired === 3, 'scheduler did not fire at due minute');
GameScheduler.schedule('test:once', 160, {n: 2}, {id:'t2'});
const schedSnap = GameScheduler.serialize();
GameScheduler.reset();
assert(GameScheduler.getTasks().length === 0, 'scheduler reset failed');
GameScheduler.deserialize(schedSnap);
assert(GameScheduler.getTasks().length === 1, 'scheduler deserialize failed');

// State registry round-trip
let moduleValue = 7;
StateRegistry.register('testModule', { export:()=>({v:moduleValue}), import:d=>{moduleValue=d.v;}, reset:()=>{moduleValue=0;} });
const stateSnap = StateRegistry.exportAll();
moduleValue = 99; StateRegistry.importAll(stateSnap);
assert(moduleValue === 7, 'StateRegistry import failed');
StateRegistry.resetAll();
assert(moduleValue === 0, 'StateRegistry reset failed');

// Economy transaction rollback
class FakeItem {
  constructor(templateId,count){ this.templateId=templateId; this.count=count; this.uid='uid_'+templateId; this.customProps={}; }
  toJSON(){ return {uid:this.uid, templateId:this.templateId, count:this.count, customProps:{}}; }
}
global.ItemInstance = FakeItem;
global.inventory = { maxSlots:3, slots:[new FakeItem('mat_a',3),null,null], currency:{spiritStones:100,copper:0} };
global.currentCharData = {spiritStones:100,copper:0,qi:50,maxQi:100,energy:20,maxEnergy:100};
load('js/economy/economy-transaction.js');
const failed = EconomyTransaction.run(()=>{ EconomyTransaction.debit('spiritStones',20); EconomyTransaction.removeByTemplate('mat_a',2); return false; });
assert(failed === false, 'transaction false result mismatch');
assert(inventory.currency.spiritStones === 100 && inventory.slots[0].count === 3, 'transaction rollback failed');
const success = EconomyTransaction.run(()=> EconomyTransaction.debit('spiritStones',20));
assert(success === true && inventory.currency.spiritStones === 80, 'transaction commit failed');

// RewardService: currency + item rewards are atomic; signed resource costs validate before commit.
global.itemById = { reward_item: { id:'reward_item', name:'测试奖励' } };
global.addItem = function(id,count){
  for (let i=0;i<inventory.slots.length;i++) {
    if (!inventory.slots[i]) { inventory.slots[i]=new FakeItem(id,count||1); return true; }
  }
  return false;
};
load('js/core/reward-service.js');
inventory.maxSlots = 1; inventory.slots = [new FakeItem('occupied',1)]; inventory.currency.spiritStones = 80;
currentCharData.spiritStones = 80; currentCharData.tempering = 0; currentCharData.energy = 5; currentCharData.maxEnergy = 100;
let rewardFail = RewardService.apply({spiritStones:25,items:[{id:'reward_item',count:1}]},{source:'test'});
assert(rewardFail.success === false && inventory.currency.spiritStones === 80, 'RewardService failed to rollback partial reward');
let costFail = RewardService.apply({spiritStones:10,energy:-10},{source:'test'});
assert(costFail.success === false && costFail.reason === 'energy' && inventory.currency.spiritStones === 80, 'RewardService committed economy before resource validation');
inventory.slots = [null];
let rewardOk = RewardService.apply({spiritStones:25,items:[{id:'reward_item',count:1}],exp:5},{source:'test'});
assert(rewardOk.success === true && inventory.currency.spiritStones === 105 && inventory.slots[0].templateId === 'reward_item' && currentCharData.tempering === 5, 'RewardService atomic success failed');
delete global.addItem;

// City reputation semantics: fame is separate; permit is earned at 6000 city rep and then becomes a role credential.
global.mapData = {};
currentCharData.flags = {}; currentCharData.fame = 100; currentCharData.location = '测试城';
load('js/reputation-system.js');
setReputation('测试城', 100, {notify:false});
assert(useSpecialPermit('测试城') === false, 'role fame incorrectly bypassed special-permit city reputation');
assert(getRoyalAuctionAccess('测试城').allowed === false, 'royal auction incorrectly allowed at city rep 100');
setReputation('测试城', 3000, {notify:false});
assert(getRoyalAuctionAccess('测试城').allowed === true && hasGlobalSpecialPermit() === false, 'royal auction city-reputation threshold failed');
setReputation('测试城', 6000, {notify:false});
assert(useSpecialPermit('测试城') === true && hasGlobalSpecialPermit() === true, 'special permit was not granted at city rep 6000');
setReputation('另一城', 0, {notify:false});
assert(getRoyalAuctionAccess('另一城').allowed === true, 'global special permit not recognized by royal auction in another city');
const repRef = window.cityReputation;
localStorage.setItem('xianxia_reputation', JSON.stringify({'导入城':{value:6000,flags:[],unlockedFeatures:[]}}));
initReputationSystem();
assert(window.cityReputation === repRef && getReputationValue('导入城') === 6000, 'reputation import broke exported object reference');

// Protection uses game time and survives serialization
global.timeSystem.gameTime.totalMinutes = 200;
load('js/gameplay/protection-system.js');
PlayerProtectionService.grant({id:'npc_a',name:'甲'} , 60);
assert(PlayerProtectionService.getActive().endGameMinute === 260, 'protection wrong game-time expiry');
global.timeSystem.gameTime.totalMinutes = 259;
assert(!!PlayerProtectionService.getActive(), 'protection expired too early');
global.timeSystem.gameTime.totalMinutes = 260;
GameScheduler.processDue(260);
assert(PlayerProtectionService.getActive() === null, 'protection did not expire on game time');

// Lifespan changes only on an actual major-realm breakthrough success event.
load('js/lifespan-system.js');
playerLifespan.maxAge = 100; playerLifespan.currentAge = 18; playerLifespan.isImmortal = false;
EventBus.emit('cultivation:breakthrough', {fromRealm:'炼气',toRealm:'炼气',fromLayer:1,toLayer:2,realmChanged:false});
assert(playerLifespan.maxAge === 100, 'minor-layer breakthrough incorrectly increased lifespan');
EventBus.emit('cultivation:breakthrough', {fromRealm:'炼气',toRealm:'筑基',fromLayer:9,toLayer:1,realmChanged:true});
assert(playerLifespan.maxAge === 200, 'major-realm breakthrough did not update lifespan');

// Crafting data + consume all materials/currency, not just first one.
// Reset data-ish globals used by item/crafting scripts.
global.timeSystem.gameTime.totalMinutes = 300;
load('js/items.js');
const ext = ['01-pills','02-weapons','03-armor','04-materials','05-talismans','06-arts','07-food','08-special'];
ext.forEach(x=>load('js/items-extended/'+x+'.js'));
load('js/items-extended.js');
load('js/items-extended/13-missing-ids.js');
load('js/items-extended/14-ability-manuals.js'); // v13.1 绝技秘籍（纳入下方 ContentValidator 校验）
load('js/crafting.js');
load('js/items-extended/10-crafting-extensions.js');
// hand-crafted recipe so count semantics are deterministic
inventory.slots = [new FakeItem('mat_spirit_grass',5), new FakeItem('mat_fire_crystal',2), null];
inventory.currency.spiritStones = 50; currentCharData.spiritStones = 50;
const consumeRecipe = { materials:[{itemId:'mat_spirit_grass',count:2},{itemId:'mat_fire_crystal',count:1}], currency:{spiritStones:10} };
assert(checkMaterials(consumeRecipe) === true, 'crafting checkMaterials setup failed');
assert(consumeMaterials(consumeRecipe) === true, 'consumeMaterials returned false');
assert(inventory.slots[0].count === 3 && inventory.slots[1].count === 1, 'crafting failed to consume every material');
assert(inventory.currency.spiritStones === 40, 'crafting currency consumption failed');

// Breakthrough ritual uses template-aware material consumption and lower layers cannot skip a whole realm.
load('js/cultivation/breakthrough-ritual.js');
inventory.slots = [new FakeItem('mat_spirit_grass',2), new FakeItem('mat_fire_crystal',1), null];
assert(consumeRitualItems([{id:'mat_spirit_grass',count:1},{id:'mat_fire_crystal',count:1}]) === true, 'ritual material consumption failed');
assert(inventory.slots[0].count === 1 && inventory.slots[1] === null, 'ritual did not consume materials by template across requirements');
let standardBreakthroughRouted = 0;
window._performBreakthroughNew = function(){ standardBreakthroughRouted++; return true; };
window.currentCharData.realm = '炼气'; window.currentCharData.layer = 1;
assert(window.performBreakthrough() === true && standardBreakthroughRouted === 1, 'minor-layer breakthrough did not route to standard progression');

// Content references: active content must have no broken links / duplicate IDs.
load('js/core/content-validator.js');
const report = ContentValidator.run();
assert(report.counts.errors === 0, 'content validator has errors: '+JSON.stringify(report.issues));
assert(report.counts.warnings === 0, 'content validator has warnings: '+JSON.stringify(report.issues));

// Battle health chain: save keeps authoritative health key; app.js exposes unified player battle entity builder.
load('js/core/game-state.js');
const saveSnap = GameState.collectFullGameState({ charData: { name: '链路测试', health: 77 } });
assert(saveSnap && saveSnap.health === 77, 'collectFullGameState lost charData.health key');
assert(saveSnap.maxHealth === 100, 'collectFullGameState maxHealth default mismatch');
// app.js assumes js/economy/auction-service.js loaded first (browser order); stub it like the browser globals above.
global.openAuctionHouse = global.openAuctionHouse || function(){};
load('js/app.js');
assert(typeof window.buildPlayerBattleEntity === 'function', 'buildPlayerBattleEntity not exposed on window');

// ===== v13.0 战斗AI行为/毒素循环回归 =====
load('js/battle.js');
assert(typeof window.generateRandomEnemy === 'function' && typeof window.Entity === 'function' && typeof window.Battle === 'function', 'battle.js exports missing');
load('js/loot-system.js'); // v13.1：浏览器顺序 battle→loot；秘籍掉落闭环断言需要该模块

// a) 连续50次生成：恒有 subtype 且 aiBehavior ∈ 五值集合；v13.0 起恒有合法 combatAbilities 数组
const AI_BEHAVIORS = ['aggressive', 'balanced', 'defensive', 'opportunist', 'poisoner'];
for (let gi = 0; gi < 50; gi++) {
  const g = window.generateRandomEnemy(3, gi % 2 === 0 ? 'enemy' : 'beast');
  assert(typeof g.subtype === 'string' && g.subtype.length > 0, 'generateRandomEnemy missing subtype');
  assert(AI_BEHAVIORS.indexOf(g.aiBehavior) >= 0, 'aiBehavior out of set: ' + g.aiBehavior);
  // v13.0：combatAbilities 必为数组且全部属于注册表合法 id
  assert(Array.isArray(g.combatAbilities), 'combatAbilities not array on: ' + g.subtype);
  g.combatAbilities.forEach(function (aid) {
    assert(window.COMBAT_ABILITIES[aid], 'unknown ability id: ' + aid);
  });
  if (g.type === 'beast') assert(g.combatAbilities.indexOf('pounce') >= 0, 'beast innate pounce missing');
}
// b) elite 路径名字以「精英·」开头；boss 以「魔头·」开头且自带1层硬化（v13.0：并补 hardened 天生技）
const eliteData = window.generateRandomEnemy(5, 'elite');
assert(eliteData.name.indexOf('精英·') === 0, 'elite name prefix missing: ' + eliteData.name);
const bossData = window.generateRandomEnemy(5, 'boss');
assert(bossData.name.indexOf('魔头·') === 0, 'boss name prefix missing: ' + bossData.name);
assert(bossData._hardenedCharges === 1, 'boss should carry 1 hardened charge');
assert(bossData.combatAbilities.indexOf('hardened') >= 0, 'boss should hold hardened innate');

// c) construct 硬化：两次受击×0.75后第三次无减免（Entity 直接构造验证充能递减）
const stoneGolem = new window.Entity({
  name: '测试魔像', level: 5, physiologyType: 'construct',
  attrs: { strength: 20, dexterity: 10, intelligence: 5, willpower: 10, constitution: 20, meridian: 5 },
  _hardenedCharges: 2
}, 'enemy');
assert(stoneGolem._hardenedCharges === 2, 'hardened charges not copied onto Entity');
const h1 = stoneGolem.takeDamage('chest', 10, 'slash');
assert(h1 === 7 && stoneGolem._hardenedCharges === 1 && stoneGolem._lastHitHardened === true, 'first hardened hit wrong: ' + h1);
const h2 = stoneGolem.takeDamage('chest', 10, 'slash');
assert(h2 === 7 && stoneGolem._hardenedCharges === 0, 'second hardened hit wrong: ' + h2);
const h3 = stoneGolem.takeDamage('chest', 10, 'slash');
assert(h3 === 10 && stoneGolem._lastHitHardened === false, 'third hit must be unreduced: ' + h3);

// d) poisonLoad tick：_processRoundPhysiology 后血量下降且负荷40→36
const poisonedHero = new window.Entity({
  name: '中毒者', level: 5, physiologyType: 'humanoid',
  attrs: { strength: 10, dexterity: 10, intelligence: 10, willpower: 10, constitution: 10, meridian: 10 }
}, 'ally');
poisonedHero.physiology.poisonLoad = 40;
poisonedHero.physiology.bloodVolume = 100;
poisonedHero.physiology.health = 100;
const dummyFoe = new window.Entity({
  name: '木桩', level: 1, physiologyType: 'humanoid',
  attrs: { strength: 10, dexterity: 10, intelligence: 10, willpower: 10, constitution: 10, meridian: 10 }
}, 'enemy');
const miniBattle = new window.Battle(poisonedHero, dummyFoe);
miniBattle._processRoundPhysiology();
assert(poisonedHero.physiology.poisonLoad === 36, 'poisonLoad decay wrong: ' + poisonedHero.physiology.poisonLoad);
assert(poisonedHero.physiology.bloodVolume === 98, 'poison blood drain wrong: ' + poisonedHero.physiology.bloodVolume);
assert(miniBattle.log.some(function(l){ return /毒素侵蚀着/.test(l.msg); }), 'poison high-load log missing');

// ===== 九类新增敌人回归（v12.9 引入；v13.0 起原机制布尔断言就地改写为能力断言）=====
// 套件不加载 battle-injuries.js：桩掉重伤判定入口，让人形实体可安全走 takeDamage 全链路
global.shouldCheckCriticalInjury = function () { return false; };
// 套件同样未加载 physiology-config.js：补最小伤害类型表，避免 createWound 在 dt 缺失时抛错
window.DAMAGE_TYPE_EFFECTS = {
  blunt: { externalBleed: 2, internalBleed: 1, pain: 3, structuralDamage: 2, neuralShock: 1 },
  slash: { externalBleed: 4, internalBleed: 2, pain: 3, structuralDamage: 2, neuralShock: 1 },
  pierce: { externalBleed: 3, internalBleed: 3, pain: 2, structuralDamage: 2, neuralShock: 2 }
};
const BASE_ATTRS = { strength: 10, dexterity: 10, intelligence: 10, willpower: 10, constitution: 10, meridian: 10 };
function mkEnt(name, type, extra) {
  const data = Object.assign({ name: name, level: 5, physiologyType: 'humanoid', attrs: Object.assign({}, BASE_ATTRS) }, extra || {});
  return new window.Entity(data, type);
}

// 注册表导出与只读性（v13.0）
assert(window.COMBAT_ABILITIES && typeof window.COMBAT_ABILITIES === 'object', 'COMBAT_ABILITIES registry missing');
assert(Object.isFrozen(window.COMBAT_ABILITIES), 'COMBAT_ABILITIES must be frozen (read-only view)');
['venom','gu_parasite','lifesteal','reflect','soundwave','illusion','escape','drain_qi','sword_burst','hardened','pounce','chill','burn'].forEach(function (id) {
  assert(window.COMBAT_ABILITIES[id] && window.COMBAT_ABILITIES[id].name, 'registry entry incomplete: ' + id);
});

// ① 吸血功（原血修吸血）：实际受伤后按30%回血（上限100），本场仅首次记日志 —— 原布尔断言改能力断言
const bloodFiend = mkEnt('血修·测试', 'enemy', { combatAbilities: ['lifesteal'] });
assert(bloodFiend.hasAbility('lifesteal') === true, 'lifesteal ability not held');
bloodFiend.physiology.bloodVolume = 50; bloodFiend.physiology.health = 50;
const bloodBag = mkEnt('血袋', 'ally');
const bloodBattle = new window.Battle(bloodBag, bloodFiend);
let drainMsg1 = bloodBattle._applyOnHitAftermath(bloodFiend, bloodBag, 20);
assert(bloodFiend.physiology.bloodVolume === 56, 'blood drain amount wrong: ' + bloodFiend.physiology.bloodVolume);
assert(/吸血功/.test(drainMsg1) && /汲取你的鲜血/.test(drainMsg1), 'first lifesteal log missing: ' + drainMsg1);
let drainMsg2 = bloodBattle._applyOnHitAftermath(bloodFiend, bloodBag, 20);
assert(!/吸血功/.test(drainMsg2), 'lifesteal log must fire only once per battle');
bloodFiend.physiology.bloodVolume = 97;
bloodBattle._applyOnHitAftermath(bloodFiend, bloodBag, 20);
assert(bloodFiend.physiology.bloodVolume === 100, 'blood drain cap failed: ' + bloodFiend.physiology.bloodVolume);

// ② 铁体功反震（原体修反震）：攻击者反受 floor(dmg×20%) 钝伤且不连锁（双方都有 reflect 时防守方不多掉血）
const bodyAtk = mkEnt('体攻方', 'ally', { combatAbilities: ['reflect'] });
const bodyDef = mkEnt('体守方', 'enemy', { combatAbilities: ['reflect'] });
assert(bodyAtk.hasAbility('reflect') && bodyDef.hasAbility('reflect'), 'reflect ability not held');
const reflectBattle = new window.Battle(bodyAtk, bodyDef);
const defChestBefore = bodyDef.durabilities.chest;
const reflectMsg = reflectBattle._applyOnHitAftermath(bodyAtk, bodyDef, 20);
assert(bodyAtk.durabilities.chest === 96, 'reflect did not hurt attacker: ' + bodyAtk.durabilities.chest);
assert(bodyDef.durabilities.chest === defChestBefore, 'defender took extra chain damage from attacker reflect');
assert(/铁体功/.test(reflectMsg), 'reflect log missing: ' + reflectMsg);

// ③ 摄魂音（原音修神魂震荡）：neuralShock 受 spiritResist 减免（下限4）、painLoad+6、首次记日志
const qinMage = mkEnt('琴魔·测试', 'enemy', { level: 10, combatAbilities: ['soundwave'] });
const hearerLow = mkEnt('低灵抗者', 'ally'); hearerLow.spiritResist = 40;
const hearerZero = mkEnt('零灵抗者', 'ally'); hearerZero.spiritResist = 0;
const soundBattle = new window.Battle(hearerLow, qinMage);
soundBattle._applyContactEffects(qinMage, hearerLow);
soundBattle._applyContactEffects(qinMage, hearerZero);
const expectShockLow = Math.max(4, Math.round((10 + 10 * 0.5) * (1 - 40 / 100)));
assert(hearerLow.physiology.neuralShock === expectShockLow, 'spiritResist reduction failed: ' + hearerLow.physiology.neuralShock);
assert(hearerZero.physiology.neuralShock === 15, 'zero-resist shock wrong: ' + hearerZero.physiology.neuralShock);
assert(expectShockLow === 9 && expectShockLow < 15, 'shock formula sanity failed');
assert(hearerLow.physiology.painLoad === 6, 'sound painLoad+6 missing: ' + hearerLow.physiology.painLoad);
assert(soundBattle.log.some(function (l) { return /摄魂音直入识海/.test(l.msg); }), 'soundwave first-hit log missing');

// ④ 迷魂术迷扰（原幻术）：命中叠加层数上限2；攻击时每层命中率-15并消耗（两次消耗）
const illuder = mkEnt('幻术师·测试', 'enemy', { combatAbilities: ['illusion'] });
const dupedHero = mkEnt('中术者', 'ally');
const illusionBattle = new window.Battle(dupedHero, illuder);
illusionBattle._applyContactEffects(illuder, dupedHero);
illusionBattle._applyContactEffects(illuder, dupedHero);
illusionBattle._applyContactEffects(illuder, dupedHero);
assert(dupedHero._illusionHits === 2, 'illusion stack cap failed: ' + dupedHero._illusionHits);
window.getDerivedCombatStats = function () {
  return { hit: 100, dodge: 0, block: 0, canBlock: false, parry: 0, penetrate: 0, crit: 0, critDmg: 150, toughness: 0, counter: 0 };
};
illusionBattle._executeAttack(dupedHero, illuder, 'chest', 'slash');
assert(dupedHero._illusionHits === 1, 'illusion consumption #1 failed: ' + dupedHero._illusionHits);
illusionBattle._executeAttack(dupedHero, illuder, 'chest', 'slash');
assert(dupedHero._illusionHits === 0, 'illusion consumption #2 failed: ' + dupedHero._illusionHits);

// ⑤ 遁术遁逃（原遁修）：低血触发尝试；成功→_fled/noSpoils/winner=player；失败→空过不结束
function queueRandom(seq) {
  const orig = Math.random; let idx = 0;
  Math.random = function () { const v = seq[Math.min(idx, seq.length - 1)]; idx++; return v; };
  return orig;
}
const fleer = mkEnt('滑头散修·测试', 'enemy', { combatAbilities: ['escape'] });
fleer.physiology.bloodVolume = 20; fleer.physiology.health = 20;
const heroEsc = mkEnt('追击侠客', 'ally');
const escWin = new window.Battle(heroEsc, fleer);
let origRand = queueRandom([0.01, 0.01]);
escWin.enemyTurn();
Math.random = origRand;
assert(escWin.isFinished === true && escWin.winner === 'player', 'escapee flee should end battle as player win');
assert(escWin.noSpoils === true && escWin.enemy._fled === true, 'noSpoils/_fled markers missing');
assert(escWin.log.some(function (l) { return /遁走了/.test(l.msg); }), 'flee success log missing');
const fleer2 = mkEnt('滑头散修·测试二', 'enemy', { combatAbilities: ['escape'] });
fleer2.physiology.bloodVolume = 20; fleer2.physiology.health = 20;
const heroEsc2 = mkEnt('追击侠客二', 'ally');
const escFail = new window.Battle(heroEsc2, fleer2);
origRand = queueRandom([0.01, 0.95]);
escFail.enemyTurn();
Math.random = origRand;
assert(escFail.isFinished === false && escFail.noSpoils !== true, 'failed escape must not end battle');
assert(escFail.log.some(function (l) { return /被你截住了/.test(l.msg); }), 'escape-block log missing');
// v13.0：无 escape 技者即使残血也不进入遁逃分支
const stubborn = mkEnt('硬骨头·测试', 'enemy', {});
stubborn.physiology.bloodVolume = 5; stubborn.physiology.health = 5;
const heroStub = mkEnt('追击侠客三', 'ally');
const escNone = new window.Battle(heroStub, stubborn);
origRand = queueRandom([0.01, 0.01]);
escNone.enemyTurn();
Math.random = origRand;
assert(escNone.isFinished !== true || escNone.winner !== 'player' || escNone.noSpoils !== true, 'non-escape holder must never flee');
assert(!escNone.log.some(function (l) { return /遁走了/.test(l.msg); }), 'non-escape holder produced flee log');

// ⑥ 采补功摄气（原采补邪修）：命中玩家摄取真气（6+level），转化为自身气血；日志每场最多2次；非玩家目标退化
window.currentCharData.qi = 50;
const essFiend = mkEnt('采补邪修·测试', 'enemy', { combatAbilities: ['drain_qi'] });
essFiend.physiology.bloodVolume = 80; essFiend.physiology.health = 80;
const cauldron = mkEnt('炉鼎', 'ally');
const essBattle = new window.Battle(cauldron, essFiend);
essBattle._applyOnHitAftermath(essFiend, cauldron, 10);
assert(window.currentCharData.qi === 39, 'essence qi drain wrong: ' + window.currentCharData.qi);
assert(essFiend.physiology.bloodVolume === 85, 'essence blood conversion wrong: ' + essFiend.physiology.bloodVolume);
essBattle._applyOnHitAftermath(essFiend, cauldron, 10);
essBattle._applyOnHitAftermath(essFiend, cauldron, 10);
assert(window.currentCharData.qi === 17, 'essence repeated drain wrong: ' + window.currentCharData.qi);
const essenceLogs = essBattle.log.filter(function (l) { return /摄取你的真气/.test(l.msg); }).length;
assert(essenceLogs <= 2, 'essence log throttle failed: ' + essenceLogs);
const bystander = mkEnt('路人甲', 'beast');
essBattle._applyOnHitAftermath(essFiend, bystander, 10);
assert(window.currentCharData.qi === 17, 'essence must degenerate on non-player target');

// ⑦ 金蚕蛊（原蛊婆）：种蛊标记+上毒×1.5；此后每回合随机非致命部位耐久-3、疼痛+2
// v13.0：蛊=招牌 gu_parasite 且必携 venom（机制随能力组合走，不再依赖 aiBehavior）
const guCrone = mkEnt('蛊婆·测试', 'enemy', { level: 6, combatAbilities: ['gu_parasite', 'venom'] });
const cursedOne = mkEnt('中蛊者', 'ally');
const guBattle = new window.Battle(cursedOne, guCrone);
guBattle._applyContactEffects(guCrone, cursedOne);
assert(cursedOne._guMarked === true, 'gu mark missing');
assert(cursedOne.physiology.poisonLoad === Math.round((6 + 6) * 1.5), 'gu poison x1.5 failed: ' + cursedOne.physiology.poisonLoad);
const durSnap = Object.assign({}, cursedOne.durabilities);
guBattle._tickPoisonLoads();
let totalLoss = 0;
for (const dk in durSnap) totalLoss += (durSnap[dk] - cursedOne.durabilities[dk]);
assert(totalLoss === 3, 'gu tick durability loss wrong: ' + totalLoss);
['brain', 'head', 'chest', 'neck', 'dantian'].forEach(function (p) {
  assert(cursedOne.durabilities[p] === durSnap[p], 'gu worm must spare fatal part ' + p);
});
assert(guBattle.log.some(function (l) { return /金蚕蛊入体/.test(l.msg); }), 'gu first-tick log missing');

// ⑧ 剑气纵横（原剑修）：暴击加成随能力生效；第3击伤害×1.25 并记「剑气纵横」
const swordMaster = mkEnt('剑修·测试', 'enemy', {
  level: 8, strength: 60, combatAbilities: ['sword_burst'], skills: { '剑法': 70 }
});
assert(swordMaster.hasAbility('sword_burst') === true && swordMaster._attackCount === 0, 'sword_burst ability/counter init failed');
const sandbag = mkEnt('木桩乙', 'ally');
const swordBattle = new window.Battle(sandbag, swordMaster);
// 命中率钳制上限95%存在未命中概率：按计数推进攻击（未命中不计数），只对计数节点做断言
function strikeUntil(targetCount) {
  let lastMsg = '', guard = 0;
  while (swordMaster._attackCount < targetCount && guard < 60) {
    const r = swordBattle._executeAttack(swordMaster, sandbag, 'abdomen', 'slash');
    if (!r.missed) lastMsg = r.msg;
    guard++;
  }
  return lastMsg;
}
const msg1 = strikeUntil(1);
assert(!/剑气纵横/.test(msg1), 'combo misfired before strike 3');
strikeUntil(2);
assert(swordMaster._attackCount === 2, 'combo counter drift at strike 2');
const msg3 = strikeUntil(3);
assert(swordMaster._attackCount === 3 && /剑气纵横/.test(msg3), '3rd strike combo missing');

// ⑨ 叛门弟子门控：isInSect 两态 stub；在门派才进权重池；名字/阵营/行为/台词标记正确
const NEW_SUB_PREFIX = {
  blood: ['血修', '炼血魔修'], body: ['体修', '炼体士'], sound: ['音修', '琴魔'],
  illusion: ['幻术师', '幻影师'], escapee: ['遁修', '滑头散修'], essence: ['采补邪修'],
  gu: ['蛊婆', '蛊师'], sword: ['剑修', '剑客'], renegade: ['叛徒']
};
window.discipleState = { isInSect: true, sectId: '青城剑派' };
let sawRenegade = false, sawNewSub = false;
for (let gi9 = 0; gi9 < 400; gi9++) {
  const g9 = window.generateRandomEnemy(6, 'enemy');
  if (NEW_SUB_PREFIX[g9.subtype]) {
    sawNewSub = true;
    const okName = NEW_SUB_PREFIX[g9.subtype].some(function (pf) { return g9.name.replace(/^(狂徒|护法|堂主)·/, '').indexOf(pf + '·') === 0; });
    assert(okName, 'new subtype name prefix wrong: ' + g9.name + ' (' + g9.subtype + ')');
    if (g9.subtype === 'renegade') {
      sawRenegade = true;
      assert(g9.faction === '邪道', 'renegade faction wrong');
      assert(g9.aiBehavior === 'aggressive' || g9.aiBehavior === 'balanced', 'renegade behavior split wrong');
      assert(g9._renegadeTauntPending === true, 'renegade taunt pending flag missing');
    }
    if (g9.subtype === 'sword') {
      // v13.0：剑修恒含 sword_burst（原 _critBonus/_attackCount 布尔断言就地改写为能力断言；
      // 连击计数改在 Entity 构造时按能力初始化，生成器裸数据不再携带）
      assert(g9.combatAbilities.indexOf('sword_burst') >= 0, 'generated sword sig missing');
      const entSword = new window.Entity(g9, 'enemy');
      assert(entSword.hasAbility('sword_burst') && entSword._attackCount === 0, 'sword combo counter not ability-initialized');
    }
    if (g9.subtype === 'body') assert(g9.combatAbilities.indexOf('reflect') >= 0, 'generated body sig missing');
  }
  // v13.0：毒师招牌恒为 venom；所有能力id必须属于注册表
  if (g9.subtype === 'poisoner') assert(g9.combatAbilities.indexOf('venom') >= 0, 'generated poisoner sig missing');
  g9.combatAbilities.forEach(function (aid) { assert(window.COMBAT_ABILITIES[aid], 'unknown ability id: ' + aid); });
}
assert(sawRenegade, 'renegade never generated while in sect (400 rolls)');
assert(sawNewSub, 'no new subtype surfaced in 400 rolls');
window.discipleState = { isInSect: false };
for (let go9 = 0; go9 < 400; go9++) {
  const h9 = window.generateRandomEnemy(6, 'enemy');
  assert(h9.subtype !== 'renegade', 'renegade generated while not in sect');
}
window.discipleState = null;
delete window.discipleState;
for (let gl9 = 0; gl9 < 300; gl9++) {
  const l9 = window.generateRandomEnemy(3, 'enemy');
  assert(['sound', 'illusion', 'essence'].indexOf(l9.subtype) < 0, 'level-gated subtype appeared below minLevel: ' + l9.subtype);
}
// 叛门弟子首见台词：第0回合插入一次
const renE = mkEnt('叛徒·某某', 'enemy', { _renegadeTauntPending: true });
const tauntBattle = new window.Battle(mkEnt('前同门', 'ally'), renE);
tauntBattle.enemyTurn();
assert(tauntBattle.log.some(function (l) { return /师门？早就是笑话了/.test(l.msg); }), 'renegade taunt missing');
assert(renE._renegadeTauntPending === false, 'taunt must fire only once');

// ===== v13.0 战斗技能系统新增回归 =====
// a) 同亚型抽样差异：连续收集40个 bandit（无招牌），至少出现两种不同 combatAbilities 组合
// （lv≥8 规则保底1抽，组合空间为8种单技+若干双技；全同概率 <1e-30，宽松防flake）
const seenCombos = {};
let banditFound = 0, guardA = 0;
while (banditFound < 40 && guardA < 4000) {
  guardA++;
  const gA = window.generateRandomEnemy(10, 'enemy');
  if (gA.subtype !== 'bandit') continue;
  banditFound++;
  assert(Array.isArray(gA.combatAbilities), 'bandit combatAbilities not array');
  assert(gA.combatAbilities.length >= 1, 'lv10 bandit should draw at least 1 shared ability');
  gA.combatAbilities.forEach(function (aid) { assert(window.COMBAT_ABILITIES[aid], 'unknown ability id: ' + aid); });
  seenCombos[gA.combatAbilities.slice().sort().join(',')] = true;
}
assert(banditFound === 40, 'not enough bandits sampled: ' + banditFound);
assert(Object.keys(seenCombos).length >= 2, 'same-subtype ability variety missing: ' + JSON.stringify(seenCombos));

// b) 种系天生：undead 天生含 venom；construct 含 hardened 且 charges=2
let undeadG = null, constructG = null, guardB = 0;
while ((!undeadG || !constructG) && guardB < 5000) {
  guardB++;
  const gB = window.generateRandomEnemy(6, 'enemy');
  if (!undeadG && gB.subtype === 'undead') undeadG = gB;
  if (!constructG && gB.subtype === 'construct') constructG = gB;
}
assert(undeadG, 'no undead generated in 5000 rolls');
assert(undeadG.combatAbilities.indexOf('venom') >= 0, 'undead innate venom missing');
assert(constructG, 'no construct generated in 5000 rolls');
assert(constructG.combatAbilities.indexOf('hardened') >= 0 && constructG._hardenedCharges === 2, 'construct innate hardened/charges wrong');

// c) 招牌恒定：poisoner 亚型恒含 venom；gu 亚型恒含 gu_parasite+venom
let poisonerG = null, guG = null, guardC = 0;
while ((!poisonerG || !guG) && guardC < 8000) {
  guardC++;
  const gC = window.generateRandomEnemy(6, 'enemy');
  if (!poisonerG && gC.subtype === 'poisoner') poisonerG = gC;
  if (!guG && gC.subtype === 'gu') guG = gC;
}
assert(poisonerG && poisonerG.combatAbilities.indexOf('venom') >= 0, 'poisoner must always hold venom sig');
assert(guG && guG.combatAbilities.indexOf('gu_parasite') >= 0 && guG.combatAbilities.indexOf('venom') >= 0, 'gu must hold gu_parasite+venom');

// d) hasAbility 工具存在且对无技能实体返回 false
assert(typeof window.Entity.prototype.hasAbility === 'function', 'hasAbility tool missing');
const plainEnt = new window.Entity({ name: '白板', level: 1 }, 'ally');
assert(Array.isArray(plainEnt.combatAbilities) && plainEnt.combatAbilities.length === 0, 'default combatAbilities should be empty array');
assert(plainEnt.hasAbility('venom') === false, 'ability-less entity must report false');
const markedEnt = mkEnt('持技者', 'ally', { combatAbilities: ['venom'] });
assert(markedEnt.hasAbility('venom') === true && markedEnt.hasAbility('lifesteal') === false, 'hasAbility true/false split wrong');

// e) 剑修恒含 sword_burst；其 crit 加成仅在 hasAb 时生效（同参数桩验证：暴击roll=0.10 落在 (0.05, 0.17] 区间）
let swordG = null, guardE = 0;
while (!swordG && guardE < 8000) {
  guardE++;
  const gE = window.generateRandomEnemy(6, 'enemy');
  if (gE.subtype === 'sword') swordG = gE;
}
assert(swordG && swordG.combatAbilities.indexOf('sword_burst') >= 0, 'sword must always hold sword_burst sig');
function critProbe(withSword) {
  const probeAtk = mkEnt('暴击探针', 'enemy', withSword ? { combatAbilities: ['sword_burst'] } : {});
  const probeDef = mkEnt('沙包丙', 'ally');
  const probeBattle = new window.Battle(probeDef, probeAtk);
  // roll序列：命中(0.5→过，命中率钳制上限95)/闪避(0.99→不过)/化解(0.99→不过)/伤害抖动(0.5)/暴击(0.10)
  // 基线暴击率0.05、剑技后0.17：0.10 恰落在两者之间，可单发区分加成是否生效
  const origR = queueRandom([0.5, 0.99, 0.99, 0.5, 0.10]);
  const rE = probeBattle._executeAttack(probeAtk, probeDef, 'chest', 'slash');
  Math.random = origR;
  return rE.crit === true;
}
assert(critProbe(false) === false, 'crit bonus leaked without sword_burst');
assert(critProbe(true) === true, 'sword_burst crit bonus not applied');

// f) 开战播报：敌方 combatAbilities 非空时 log 明示技能名；undead 的 venom 显示「尸毒」
const annBattle = new window.Battle(mkEnt('观察者', 'ally'), mkEnt('绝技者', 'enemy', { combatAbilities: ['lifesteal', 'soundwave'] }));
assert(annBattle.log.some(function (l) { return /气息驳杂/.test(l.msg) && /吸血功、摄魂音/.test(l.msg); }), 'ability announcement missing: ' + JSON.stringify(annBattle.log));
const corpseKing = mkEnt('枯亡灵', 'enemy', { physiologyType: 'undead', combatAbilities: ['venom'] });
const annBattle2 = new window.Battle(mkEnt('驱魔人', 'ally'), corpseKing);
assert(annBattle2.log.some(function (l) { return /气息驳杂/.test(l.msg) && /尸毒/.test(l.msg); }), 'undead venom display name 尸毒 missing');
const quietBattle = new window.Battle(mkEnt('旁观者', 'ally'), mkEnt('白板敌', 'enemy', {}));
assert(!quietBattle.log.some(function (l) { return /气息驳杂/.test(l.msg); }), 'ability-less enemy must not trigger announcement');

// ===== v13.1 玩家绝技系统回归 =====
// 前置：秘籍物品库 + 背包（inventory.js 顶层声明 let inventory/ItemInstance 等，晚加载以词法绑定遮蔽同名全局属性，
// 此后一律经 window.inventory / window.ItemInstance 访问背包，避免混用两套对象）

// e) 秘籍9件全部存在于物品库且 effect.learn_ability 合法（对照 COMBAT_ABILITIES 键集）
const V131_LEARNABLE = ['venom','lifesteal','reflect','soundwave','illusion','escape','drain_qi','gu_parasite','sword_burst'];
V131_LEARNABLE.forEach(function (ab) {
  const mid = 'manual_' + ab;
  const tpl = window.itemById[mid];
  assert(tpl, 'missing manual item: ' + mid);
  assert(tpl.type === 'consumable' && tpl.subtype === 'manual' && tpl.category === 'consumable', 'manual template shape wrong: ' + mid);
  assert(tpl.effect && tpl.effect.learn_ability === ab, 'manual learn_ability mismatch: ' + mid);
  assert(window.COMBAT_ABILITIES[tpl.effect.learn_ability], 'manual points outside registry: ' + mid);
  assert(tpl.stackable === false, 'manual must not stack: ' + mid);
  assert(tpl.icon === '📜' && typeof tpl.price === 'number' && tpl.price > 0, 'manual icon/price wrong: ' + mid);
  // 入库恰好一次（自注册 + 聚合器双路径不得产生重复）
  const occurrences = window.allItems.filter(function (it) { return it && it.id === mid; }).length;
  assert(occurrences === 1, 'manual duplicated in allItems: ' + mid + ' x' + occurrences);
});
// 种系天生4项绝无秘籍
['hardened', 'pounce', 'chill', 'burn'].forEach(function (innate) {
  assert(!window.itemById['manual_' + innate], 'innate ability must have no manual: ' + innate);
});

// a) useItem learn_ability：未知→数组入且返回true；重复→不重复添加、不消耗、返回false
load('js/inventory.js');
window.currentCharData = { name: '习技者', qi: 50, maxQi: 100 }; // 故意缺 combatAbilities → 走兜底建数组路径
window.inventory.maxSlots = 6;
window.inventory.slots = [
  new window.ItemInstance('manual_lifesteal', 1),
  new window.ItemInstance('manual_lifesteal', 1),
  null, null, null, null
];
const rLearn = window.useItem(window.inventory.slots[0].uid);
assert(rLearn === true, 'learn_ability first read must succeed');
assert(Array.isArray(window.currentCharData.combatAbilities)
  && window.currentCharData.combatAbilities.length === 1
  && window.currentCharData.combatAbilities[0] === 'lifesteal', 'learned ability missing from charData');
assert(window.inventory.slots[0] === null, 'manual must be consumed on successful learning');
const rDup = window.useItem(window.inventory.slots[1].uid);
assert(rDup === false, 'duplicate manual must be refused');
assert(window.currentCharData.combatAbilities.length === 1, 'duplicate manual must not add twice');
assert(window.inventory.slots[1] && window.inventory.slots[1].count === 1, 'duplicate manual must not be consumed');

// b) GameState round-trip：collect 带 combatAbilities → apply 还原相等；缺省→[]
window.updateInventoryUI = function () {}; // apply 恢复背包后会刷新UI，桩掉避免 DOM 访问
window.updateCurrencyUI = function () {};
const abSnap = GameState.collectFullGameState({ charData: { name: '绝技存档', health: 80, combatAbilities: ['venom'] } });
assert(Array.isArray(abSnap.combatAbilities) && abSnap.combatAbilities.length === 1 && abSnap.combatAbilities[0] === 'venom',
  'collectFullGameState lost combatAbilities');
assert(GameState.applyFullGameState(abSnap) === true, 'applyFullGameState rejected valid snapshot');
assert(Array.isArray(global.currentCharData.combatAbilities)
  && global.currentCharData.combatAbilities.length === 1
  && global.currentCharData.combatAbilities[0] === 'venom', 'combatAbilities round-trip mismatch');
const legacySnap = GameState.collectFullGameState({ charData: { name: '旧档角色' } });
assert(Array.isArray(legacySnap.combatAbilities) && legacySnap.combatAbilities.length === 0, 'missing combatAbilities must collect as []');
assert(GameState.applyFullGameState({ charName: '旧档角色' }) === true, 'legacy save without combatAbilities must still apply');
assert(Array.isArray(global.currentCharData.combatAbilities) && global.currentCharData.combatAbilities.length === 0,
  'legacy apply must default combatAbilities to []');

// c) buildPlayerBattleEntity 透传：charData.combatAbilities → 实体 hasAbility
currentCharData = { name: '血修玩家', health: 90, combatAbilities: ['lifesteal'] }; // 写 app.js 内部 let（共享全局词法环境）
window.currentCharData = currentCharData;
const v13PlayerEnt = window.buildPlayerBattleEntity();
assert(v13PlayerEnt && typeof v13PlayerEnt.hasAbility === 'function', 'player battle entity build failed');
assert(v13PlayerEnt.hasAbility('lifesteal') === true, 'buildPlayerBattleEntity did not pass through combatAbilities');
assert(v13PlayerEnt.combatAbilities.length === 1, 'player entity combatAbilities length drift');
// 缺省字段不炸且为空数组
currentCharData = { name: '无技玩家', health: 90 };
window.currentCharData = currentCharData;
const v13PlainEnt = window.buildPlayerBattleEntity();
assert(Array.isArray(v13PlainEnt.combatAbilities) && v13PlainEnt.combatAbilities.length === 0, 'default player entity abilities must be []');

// d) battleFlee 加成：持 escape 技 baseChance=0.72；否则 0.5（桩 TalismanSystem 捕获入参）
let capturedFleeBase = null;
window.TalismanSystem = {
  getEscapeChance: function (base) { capturedFleeBase = base; return base; },
  consumeEscapeBoost: function () {}
};
window.updateBattleUI = function () {}; // 屏蔽 DOM 渲染
const escHero = new window.Entity({
  name: '遁修玩家', level: 5, physiologyType: 'humanoid',
  attrs: Object.assign({}, BASE_ATTRS), combatAbilities: ['escape']
}, 'player');
currentBattle = { // 写 app.js 内部 let
  log: [], player: escHero, enemy: null, isPlayerTurn: true,
  getState: function () {
    return { player: { durabilities: {}, maxDurabilities: {} }, enemy: { durabilities: {}, maxDurabilities: {} }, log: this.log, isFinished: false };
  },
  enemyTurn: function () {}
};
let origRandD = queueRandom([0.99]); // 固定逃跑失败分支：避开 closeBattle 的 DOM 访问
window.battleFlee();
Math.random = origRandD;
assert(capturedFleeBase === 0.72, 'escape holder flee base must be 0.72, got: ' + capturedFleeBase);
currentBattle.player = new window.Entity({ name: '凡人玩家', level: 5, physiologyType: 'humanoid', attrs: Object.assign({}, BASE_ATTRS) }, 'player');
currentBattle.log.length = 0;
origRandD = queueRandom([0.99]);
window.battleFlee();
Math.random = origRandD;
assert(capturedFleeBase === 0.5, 'non-escape flee base must stay 0.5, got: ' + capturedFleeBase);
// 注意：失败分支的 300ms 定时器回调引用 currentBattle.enemyTurn（桩为空函数），
// 故此处不复位 currentBattle=null，避免定时器触发时对 null 取属性抛未捕获异常。

// f) generateEnemyInventory：传 ['sword_burst','gu_parasite'] 多次抽样，出现秘籍时其id必属于输入集合
const fParams = { name: '剑蛊测试', level: 8, type: 'enemy', species: 'human', physiologyType: 'humanoid', faction: '邪道' };
let manualHits = 0;
for (let fi = 0; fi < 300; fi++) {
  const invF = window.generateEnemyInventory(Object.assign({ combatAbilities: ['sword_burst', 'gu_parasite'] }, fParams));
  const manualsF = invF.items.filter(function (iid) { return String(iid).indexOf('manual_') === 0; });
  assert(manualsF.length <= 1, 'manual drop cap (1/场) violated');
  manualsF.forEach(function (mid2) {
    manualHits++;
    const ownerAb = mid2.replace(/^manual_/, '');
    assert(ownerAb === 'sword_burst' || ownerAb === 'gu_parasite', 'dropped manual outside input set: ' + mid2);
  });
}
assert(manualHits > 0, 'no manual dropped in 300 samples of dual-ability holder (p≈0 per run)');
// 非可学持有者与未传参者绝不掉秘籍
for (let fj = 0; fj < 200; fj++) {
  const invInnate = window.generateEnemyInventory(Object.assign({ combatAbilities: ['hardened', 'pounce'] }, fParams));
  assert(invInnate.items.every(function (iid) { return String(iid).indexOf('manual_') !== 0; }), 'innate ability must never drop a manual');
  const invNone = window.generateEnemyInventory(Object.assign({}, fParams));
  assert(invNone.items.every(function (iid) { return String(iid).indexOf('manual_') !== 0; }), 'ability-less enemy must never drop a manual');
}

console.log(`OK: ${passed} regression assertions passed; active items=${report.counts.items}, recipes=${report.counts.recipes}`);
