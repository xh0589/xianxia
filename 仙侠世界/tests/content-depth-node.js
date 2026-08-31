'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
let passed = 0;
function assert(cond, msg) { if (!cond) throw new Error(msg); passed++; }
function load(rel) { vm.runInThisContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), { filename: rel }); }

global.window = global;
global.document = {
  querySelector(){ return null; }, querySelectorAll(){ return []; }, getElementById(){ return null; },
  addEventListener(){}, createElement(){ return {className:'',style:{},innerHTML:'',querySelector(){return null;}}; },
  body:{appendChild(){}}
};
global.localStorage = { _s:{}, getItem(k){return this._s[k]||null;}, setItem(k,v){this._s[k]=String(v);}, removeItem(k){delete this._s[k];} };
global.showMessage = function(){};
global.confirm = function(){ return true; };
global.XianXia = {};

// 1) 修罗宫/百花谷个人线资格门禁
load('js/npcs/npc-personal-events.js');
load('js/npcs/baihua-events-main.js');
load('js/npcs/baihua-events-extra.js');
load('js/npcs/baihua-personal-events.js');
const feilei = { memory:{firstMet:false,meetCount:0}, relationship:{affection:20} };
const wenheng = { memory:{firstMet:false,meetCount:0}, relationship:{affection:30} };
global.npcManager = { getNPC(id){ return id === 'sect_leader_修罗宫' ? feilei : (id === 'sect_leader_百花谷' ? wenheng : null); } };
global.currentCharData = { location:'修罗宫' };
global.discipleState = { isInSect:false, sectId:null };
global.timeSystem = { gameTime:{currentHour:0,currentDay:1,totalMinutes:0}, onNewDaySubscribe(){} };
assert(canPlayerAccessPersonalEvent(NPC_PERSONAL_EVENTS.xl_event_001, feilei) === false, '游客未见面竟可进入修罗宫主个人线');
assert(maybeAutoTriggerFeiLeiEvent('sect') === false, '游客进入修罗宫仍会排队自动事件');
feilei.memory.firstMet = true; feilei.memory.meetCount = 1;
assert(canPlayerAccessPersonalEvent(NPC_PERSONAL_EVENTS.xl_event_001, feilei) === false, '仅见过但未入门竟可进入个人线');
global.discipleState = { isInSect:true, sectId:'百花谷' };
assert(canPlayerAccessPersonalEvent(NPC_PERSONAL_EVENTS.xl_event_001, feilei) === false, '异派弟子竟可进入修罗宫主个人线');
global.discipleState = { isInSect:true, sectId:'修罗宫' };
assert(canPlayerAccessPersonalEvent(NPC_PERSONAL_EVENTS.xl_event_001, feilei) === true, '本门已见面弟子被错误拦截');
global.currentCharData.location = '洛阳';
assert(canPlayerAccessPersonalEvent(NPC_PERSONAL_EVENTS.xl_event_001, feilei) === false, '离开修罗宫后仍可触发宫内个人线');
assert(triggerPersonalEvent('xl_event_001') === false, '底层直接调用绕过地点门禁');

// 2) 宗门资源：专属产能真实进入库存，日结幂等且状态可存档
global.currentCharData = { location:'少林寺', spiritStones:0 };
global.timeSystem = { gameTime:{currentHour:6,currentDay:2,totalMinutes:1800}, onNewDaySubscribe(){} };
global.mapData = {'中州':{},'东荒':{},'南疆':{},'西漠':{},'北冥':{},'蜀地':{},'东南海域':{}};
load('js/core/state-registry.js');
load('js/sects/sects.js');
load('js/sects/sects-deep-data.js');
load('js/sects/sects-system.js');
load('js/sects/sect-internal.js');
let econ = getSectEconomySnapshot('少林寺');
assert(econ && econ.gross === 30, '少林三项特色资源日产未汇总为30');
SECT_INTERNAL['少林寺'].resources = 100;
delete SECT_INTERNAL['少林寺'].lastEconomyDay;
econ = getSectEconomySnapshot('少林寺');
const expected = 100 + econ.net;
processAllSectDailyEconomy(2);
assert(SECT_INTERNAL['少林寺'].resources === expected, '宗门日产未进入真实库存');
processAllSectDailyEconomy(2);
assert(SECT_INTERNAL['少林寺'].resources === expected, '同一天宗门资源被重复结算');
const snap = StateRegistry.exportAll();
SECT_INTERNAL['少林寺'].resources = 1;
StateRegistry.importAll(snap);
assert(SECT_INTERNAL['少林寺'].resources === expected, '宗门内部状态未通过StateRegistry恢复');

// 俸禄每日只可领一次，且日结与个人俸禄分开
Object.assign(window.discipleState, {isInSect:true,sectId:'少林寺',rank:5,_lastSalaryDay:null});
global.inventory = {currency:{spiritStones:0}};
assert(collectSectResources() === true, '首次俸禄领取失败');
const salaryAfter = inventory.currency.spiritStones;
assert(salaryAfter > 0, '俸禄没有进入灵石');
assert(collectSectResources() === false && inventory.currency.spiritStones === salaryAfter, '同日俸禄可重复领取');

// 3) 长期闭关：真实按天推进世界，不新增平行时间；普通日常不会在此测试环境打断
global.currentCharData = {realm:'炼气',essence:0,health:100,maxHealth:100,qi:50,maxQi:50,energy:50,maxEnergy:100,mutatedRoots:{}};
global.inventory = {currency:{spiritStones:1000}};
global.currentSkills = {skill_main:'skill_test'};
let advanced = 0, profCalls = 0;
global.timeSystem = {
  gameTime:{currentDay:10,currentSeason:'spring'},
  getSeasonBonus(){ return {cultivation:1.1}; },
  advanceTime(mins){ advanced += mins; this.gameTime.currentDay += Math.floor(mins/1440); }
};
global.getRealmIndex = ()=>0;
global.getEssenceGainByRealm = ()=>5;
global.getRootCultivationBonus = ()=>1;
global.getHouseBonus = ()=>1;
global.getCultivationSpeedBonusFromQi = ()=>1;
global.addProficiencyExp = ()=>{ profCalls++; };
load('js/cultivation/long-retreat.js');
const retreat = startLongRetreat(7);
assert(retreat && retreat.days === 7, '七日闭关未成功');
assert(advanced === 7*1440 && timeSystem.gameTime.currentDay === 17, '闭关没有按天真实推进世界时间');
assert(retreat.essence > 0 && currentCharData.essence === retreat.essence, '闭关没有获得真元');
assert(profCalls === 7, '主修功法没有逐日获得闭关熟练度');
assert(inventory.currency.spiritStones === 965, '七日闭关阵法费用错误');

console.log('OK: ' + passed + ' content-depth assertions passed');
