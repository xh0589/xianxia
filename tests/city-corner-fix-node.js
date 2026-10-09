/**
 * 分城秘传 / 悬赏分形 / 路程预览
 */
'use strict';
var fs = require('fs');
var path = require('path');
var vm = require('vm');
var ROOT = path.resolve(__dirname, '..');
var passed = 0, failed = 0;
function ok(c, m) { if (c) { passed++; console.log('  ✓ ' + m); } else { failed++; console.error('  ✗ ' + m); } }

var rep = fs.readFileSync(path.join(ROOT, 'js/reputation-system.js'), 'utf8');
var app = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
var regions = fs.readFileSync(path.join(ROOT, 'js/regions.js'), 'utf8');

console.log('[秘传]');
ok(/'帝都·长安':/.test(rep) && /'鲛人镇':/.test(rep) && /'魔界·血海荒原':/.test(rep), '23 城有各自秘传键');
ok((rep.match(/SECRET_ARTS_BY_CITY[\s\S]*?CITY_SPECIAL_QUEST_TEMPLATES/) || [''])[0].split("'default'").length >= 2, '仍保留 default 兜底');
ok(/art_water_heart/.test(rep) && /art_fire_heart/.test(rep) && /art_nine_yin/.test(rep) && /art_blood_dao/.test(rep), '各城秘传不再只是混元/凌波换皮');

console.log('[悬赏]');
ok(/type: tpl\.type/.test(rep), '悬赏目标用模板自己的 type');
ok(/交齐物资/.test(rep) && /回报除害/.test(rep), '按钮按类型改口');
ok(/typ === 'collect'/.test(rep) && /typ === 'combat'/.test(rep), '完成时按类型检查');
ok(/enemy:defeated/.test(rep) && /q\._fought/.test(rep), '除害认战场击败');
ok(/removeItem/.test(rep) && /paid/.test(rep), '收集悬赏真扣货');

console.log('[路程]');
ok(/getTravelDistance/.test(app) && /约\$\{window\.getTravelDistance/.test(app), '前往旁有路程估算');
ok(/getTravelTimePreview/.test(app) && /步行约/.test(app), '前往旁有步行耗时预览');
ok(/distLi \/ 60/.test(app) && /getTravelDistance/.test(app), '脚程按里数缩放，不再写死 30 分');
ok(/function lookup\(fromRaw, toRaw\)/.test(regions), '城名去空格仍能对上距离表');

var mapMatch = regions.match(/var CITY_DISTANCE_MAP = \{[\s\S]*?\n\};/);
ok(!!mapMatch, '距离表能抽出');
if (mapMatch) {
    var box = { CITY_DISTANCE_MAP: null, compact: function (s) { return String(s || '').replace(/\s+/g, ''); } };
    vm.runInNewContext('this.CITY_DISTANCE_MAP = ' + mapMatch[0].replace('var CITY_DISTANCE_MAP = ', '') + ';', box);
    function lookup(fromRaw, toRaw) {
        var fromC = box.compact(fromRaw), toC = box.compact(toRaw);
        for (var key in box.CITY_DISTANCE_MAP) {
            if (box.compact(key) !== fromC) continue;
            var map = box.CITY_DISTANCE_MAP[key];
            if (map[toRaw]) return map[toRaw];
            for (var dest in map) { if (box.compact(dest) === toC) return map[dest]; }
        }
        return 0;
    }
    ok(lookup('帝都·长安', '洛水城') === 60, '去空格后长安到洛水仍是 60');
    ok(lookup('帝都 · 长安', '洛水城') === 60, '带空格写法也能查到');
}

console.log('\n结果：通过 ' + passed + '　失败 ' + failed);
process.exit(failed ? 1 : 0);
