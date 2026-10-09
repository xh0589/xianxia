// ==================== tests/status-titles-node.js ====================
// status-titles 结构与契约断言（Node 直跑，零依赖）
'use strict';

var path = require('path');
var mod = require(path.join(__dirname, '..', 'js', 'adult', 'content', 'status-titles.js'));

var fail = 0;
var ok = 0;
function check(name, cond, extra) {
  if (cond) { ok++; return; }
  fail++;
  console.log('FAIL: ' + name + (extra ? ' -> ' + extra : ''));
}

var REQUIRED_FIELDS = ['key', 'title', 'addressBy', 'attitude', 'source', 'judge'];
var ALLOWED_ATTITUDES = ['敌对', '冷淡', '中立', '友好', '崇敬', '传奇'];

check('module exports api', !!mod);
check('OWNER is AdultStatusTitles', mod && mod.OWNER === 'AdultStatusTitles', mod && mod.OWNER);
check('TITLES is array', mod && Array.isArray(mod.TITLES));
check('globalThis.AdultStatusTitles installed', typeof globalThis.AdultStatusTitles === 'object');

var T = (mod && mod.TITLES) || [];
check('TITLES >= 6 tiers', T.length >= 6, 'len=' + T.length);

var seenKeys = {};
T.forEach(function (t, i) {
  var label = 'TITLES[' + i + '](' + (t && t.key) + ')';
  REQUIRED_FIELDS.forEach(function (f) {
    check(label + ' has ' + f, t && t[f] !== undefined && t[f] !== null && t[f] !== '');
  });
  check(label + '.attitude in allowed set',
    ALLOWED_ATTITUDES.indexOf(t.attitude) !== -1, t.attitude);
  check(label + '.source non-empty text', typeof t.source === 'string' && t.source.length > 0);
  check(label + '.judge is function', typeof t.judge === 'function');
  if (typeof t.judge === 'function') {
    var r;
    try { r = t.judge(); } catch (e) { r = 'threw: ' + e.message; }
    check(label + '.judge returns boolean', typeof r === 'boolean', String(r));
  }
  check(label + '.key unique', !seenKeys[t.key]);
  seenKeys[t.key] = true;
});

check('has 艺妓/卖艺 tier',
  T.some(function (t) { return /艺妓|卖艺/.test(t.title); }));

var srcBlob = T.map(function (t) { return t.source; }).join(' | ');
['getLifeSkill', 'getFameLevel', 'cd.fame', 'cityReputation', 'factionRelations',
 'discipleState.rank', 'getPlayerRankAuthority', 'playerRumorAttitude']
  .forEach(function (port) {
    check('source references real body port: ' + port, srcBlob.indexOf(port) !== -1);
  });

var atts = T.map(function (t) { return t.attitude; });
ALLOWED_ATTITUDES.forEach(function (a) {
  check('attitude variety: ' + a + ' used', atts.indexOf(a) !== -1);
});

console.log('ok=' + ok + ' fail=' + fail);
process.exit(fail === 0 ? 0 : 1);
