/**
 * 坐骑赶路 + 凡人驿站 + 秘境久枯再涌
 */
'use strict';
var fs = require('fs');
var path = require('path');
var ROOT = path.resolve(__dirname, '..');
var passed = 0, failed = 0;
function ok(c, m) { if (c) { passed++; console.log('  ✓ ' + m); } else { failed++; console.error('  ✗ ' + m); } }
function src(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

var app = src('js/app.js');
var loc = src('js/location-system.js');
var taming = src('js/beast-taming.js');
var travel = src('js/travel-system.js');
var dyn = src('js/extensions/dungeon-dynamic.js');

console.log('[坐骑]');
ok(/function getMountTravelTimeMultiplier/.test(taming), '灵兽侧有骑乘倍率');
ok(/return 1 \/ sp/.test(taming), '倍率 = 1/speed（越快越短）');
ok(/getMountTravelTimeMultiplier/.test(app) && /footMinutes = 30/.test(app), '地图前往底账 30 分钟，乘同一支倍率');
ok(/getMountTravelTimeMultiplier/.test(travel), 'travel-system 赶路也乘坐骑');

console.log('[驿站]');
ok(/id: 'post_station'/.test(loc) && /name: '驿站'/.test(loc), '建筑类型有驿站');
ok(/listed\.push\('post_station'\)/.test(loc), '凡人城有客栈则列出驿站');
ok(/buildingId === 'post_station'/.test(loc) && /openPostStation/.test(loc), '点击走 openPostStation');
ok(/function openPostStation/.test(app) && /function hirePostTravel/.test(app), '驿站面板与雇马函数在');
ok(/你已骑乘/.test(app) && /驿马是没坐骑的人雇的/.test(app), '有坐骑时驿站亮锁说明原因');
ok(/startTravel\(cityName, method/.test(app), '雇马走 travel-system，不另造第二本赶路账');

console.log('[秘境枯竭]');
ok(/DUNGEON_COOLDOWN_DAYS = 90/.test(app), '常驻秘境枯竭 90 日');
ok(/dungeonClearedAt\[dungeonState\.id\]/.test(app), '两条通关路径都记通关日');
ok(/约九十日后复涌/.test(app), '通关文案不再写「不会重开」');
ok(/灵气枯竭/.test(app) && /须等它下次再现/.test(app), '动态窗走通后仍说枯竭再涌，不是永久关门');
ok(/already-completed/.test(dyn), '动态窗同一扇窗内仍不让连刷');

console.log('\n结果：通过 ' + passed + '　失败 ' + failed);
process.exit(failed ? 1 : 0);
