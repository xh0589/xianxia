/**
 * 战败跨日不得叠门派故事
 */
'use strict';
var fs = require('fs');
var path = require('path');
var ROOT = path.resolve(__dirname, '..');
var passed = 0, failed = 0;
function ok(c, m) { if (c) { passed++; console.log('  ✓ ' + m); } else { failed++; console.error('  ✗ ' + m); } }
var arc = fs.readFileSync(path.join(ROOT, 'js/sects/sect-story-arc.js'), 'utf8');
var app = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');

ok(/function _sectStoryBlocked/.test(arc), '有战败占座判定');
ok(/currentBattle/.test(arc) && /_pendingDefeatRevival/.test(arc), '认战斗与待演战败后续');
ok(/_pendingSectStory/.test(arc) && /flushPendingSectStory/.test(arc), '挡下的戏会挂起');
ok(!/flushPendingSectStory\(\)/.test(app), '关战败窗不立刻补演门派戏（避免和日界环境戏叠窗）');
ok(/flushPendingSectStory/.test(arc), '挂起的戏仍可由 flushPendingSectStory 在平安日补演');
ok(/入宫先记名/.test(arc), '修罗宫第一折仍在');

console.log('\n结果：通过 ' + passed + '　失败 ' + failed);
process.exit(failed ? 1 : 0);
