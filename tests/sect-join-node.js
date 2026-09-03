'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
let passed = 0;
function assert(cond, msg) { if (!cond) throw new Error(msg); passed++; }
function load(rel) { vm.runInThisContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), { filename: rel }); }

global.window = global;
global.mapData = { 中州:{}, 东荒:{}, 南疆:{}, 西漠:{}, 北冥:{}, 蜀地:{}, 东南海域:{} };
global.document = { querySelectorAll(){ return []; }, getElementById(){ return null; } };
global.localStorage = { getItem(){ return null; }, setItem(){} };
let lastModal = null;
let joined = null;
let messages = [];
global.showModal = (title, html) => { lastModal = { title, html }; };
global.showMessage = (msg, type) => { messages.push({ msg, type }); };
global.currentCharData = {
  gender: 'male',
  mainAttributes: { '灵巧':25, '悟性':25, '体质':35, '力量':35 },
  attrs: { dexterity:25, constitution:35, strength:35 },
  combatSkills: { '长兵':25, '剑法':25 },
  lifeSkills: { '锻造':25, '医术':25 },
  spiritualRoots: { water:30 }, mutatedRoots: { ice:true },
  fame:0, karma:0, notoriety:0
};
load('js/sects/sects.js');
global.joinSect = (id, evalResult) => { joined = { id, evalResult }; return true; };
load('js/sects/sect-join-flow.js');

// v18.7 D4：此前走通用/空白的 14 派全部有轻量特色问，且不再出现空白弹窗。
const lightSects = ['嵩山派','恒山派','全真教','华山派','泰山派','茅山派','衡山派','铁掌帮','昆仑派','青城派','天龙教','烈日教','血手门','飞蝎坞'];
assert(Object.keys(SECT_LIGHT_ENTRY_QUESTIONS).length === lightSects.length, 'light question sect count drift');
lightSects.forEach(id => {
  lastModal = null;
  showSectGuardTrial(id);
  assert(lastModal && lastModal.html && lastModal.html.length > 80, id + ' rendered an empty guard trial');
});

const specialSects = ['百花谷','大隐阁','天书阁','修罗宫'];
const covered = new Set(specialSects.concat(FULL_GUARD_TRIAL_SECTS.filter(id => !!sectsData[id]), lightSects));
assert(covered.size === Object.keys(sectsData).length, 'not every current sect has an explicit entry-flow route');
Object.keys(sectsData).forEach(id => assert(covered.has(id), id + ' missing from explicit entry-flow coverage'));

// 9门派旧计划中此前只有按钮、没有函数的 8 派全部接通。
['daQiMenStand','daQiMenResolve','xiaYiGeQ1','xiaYiGeQ2','tianYaQ1','tianYaQ2','shenJiQ1','shenJiQ2','piLiQ1','piLiQ2','eMeiQ1','eMeiQ2','wuXianQ1','wuXianQ2','tangMenQ1','tangMenQ2'].forEach(name => {
  assert(typeof global[name] === 'function', name + ' is not exported');
});

// 职位ID必须对齐 sects-system：4内门 / 5外门 / 7杂役，禁止再误发掌门/副掌门(0/1)。
resolveLightSectQuestion('嵩山派', 'preferred');
joined = null;
finishLightSectEntry('嵩山派', ENTRY_RANK.OUTER);
assert(joined && joined.evalResult.rank === 5, 'preferred light answer must join as outer disciple rank=5');
resolveLightSectQuestion('嵩山派', 'tolerated');
joined = null;
finishLightSectEntry('嵩山派', ENTRY_RANK.CHORE);
assert(joined && joined.evalResult.rank === 7, 'tolerated light answer must join as chore disciple rank=7');

let ev = evaluateSectEntry('华山派', currentCharData);
assert(ev.rank === 7, 'low-fame generic evaluation must be chore rank=7');
currentCharData.fame = 60; currentCharData.karma = 50;
ev = evaluateSectEntry('华山派', currentCharData);
assert(ev.rank === 5, 'aligned famous generic evaluation must be outer rank=5');

global._guardTrialSectId = '少林寺';
joined = null;
finishGuardTrialAsInnerDisciple();
assert(joined && joined.evalResult.rank === 4, 'inner-trial helper must join at rank=4');

// 灵根读取必须走 currentCharData 的权威字段，不得再读创建页临时 rootValues。
lastModal = null;
pengLaiTest();
assert(lastModal && /第二关/.test(lastModal.title), 'Penglai did not recognize authoritative water root');
lastModal = null;
tianShanTest();
assert(lastModal && /第二关/.test(lastModal.title), 'Tianshan did not recognize authoritative ice root');

// 关键旧计划链路至少走到下一步，不得再 ReferenceError。
lastModal = null; daQiMenStand(); assert(lastModal && /长兵试/.test(lastModal.title), 'Daqimen chain broken');
lastModal = null; xiaYiGeQ1('help'); assert(lastModal && /第二问/.test(lastModal.title), 'Xiayinge chain broken');
lastModal = null; tianYaQ1('right'); assert(lastModal && /论道/.test(lastModal.title), 'Tianyahaige chain broken');
lastModal = null; shenJiQ1('try'); assert(lastModal && /工匠之道/.test(lastModal.title), 'Shenjimen chain broken');
lastModal = null; piLiQ1('brave'); assert(lastModal && /火器试/.test(lastModal.title), 'Piliting chain broken');
lastModal = null; eMeiQ1('nit'); assert(lastModal && /悟性/.test(lastModal.title), 'Emei chain broken');
lastModal = null; wuXianQ1('holy'); assert(lastModal && /识蛊/.test(lastModal.title), 'Wuxian chain broken');
lastModal = null; tangMenQ1('try'); assert(lastModal && /暗器之道/.test(lastModal.title), 'Tangmen chain broken');

console.log(`OK: ${passed} sect-join assertions passed`);
