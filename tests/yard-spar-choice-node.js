/**
 * 城里演武场：打木桩 / 跟人切磋 二选一
 */
'use strict';
var fs = require('fs');
var path = require('path');
var ROOT = path.resolve(__dirname, '..');
var passed = 0, failed = 0;
function ok(c, m) { if (c) { passed++; console.log('  ✓ ' + m); } else { failed++; console.error('  ✗ ' + m); } }
function src(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

var be = src('js/building-effects.js');
var app = src('js/app.js');

console.log('[面板]');
ok(/useBuildingEffect\('training', 'train'\)/.test(be) && /🪵 打木桩/.test(be), '面板有打木桩');
ok(/useBuildingEffect\('training', 'spar'\)/.test(be) && /跟人切磋/.test(be), '面板有跟人切磋');
ok(/useBuildingEffect\('training', 'meditate'\)/.test(be), '静心修炼仍在');
ok(!/可能遭遇训练对手/.test(be) && !/Math\.random\(\) < 0\.3/.test(be.slice(be.indexOf("buildingEffectsRegistry['training']"), be.indexOf("buildingEffectsRegistry['teleport']"))), '演武场不再 30% 掷骰开战');

console.log('[木桩]');
var train = be.slice(be.indexOf('train: function()'), be.indexOf('spar: function()'));
ok(/startBattle\('training_dummy'\)/.test(train), '打桩必开木人桩');
ok(!/advanceQuestObjectivesFromEvent/.test(train), '打桩不推进切磋任务');

console.log('[切磋]');
var spar = be.slice(be.indexOf('spar: function()'), be.indexOf('meditate: function()'));
ok(/openSparPanel/.test(spar), '入门走同门真切磋');
ok(/startCityYardSpar/.test(spar), '城里走场上散修');
ok(/function startCityYardSpar/.test(app), '城里切磋函数在');
ok(/_isSpar = true/.test(app) && /noSpoils = true/.test(app), '城里切磋点到为止、不搜刮');
ok(/advanceQuestObjectivesFromEvent\('sparring'/.test(app), '跟人切磋推进 daily_003');

console.log('[入口]');
ok(/openBuildingUI\('training'\)/.test(app), 'startTraining 打开选择面板，不再闷头加历练');

console.log('\n结果：通过 ' + passed + '　失败 ' + failed);
process.exit(failed ? 1 : 0);
