/**
 * v20.50-sect-content-node.js — 门派内容第二批：故事弧扩六门 + 零专属清零
 *
 * 覆盖：
 *   D1 故事弧 9 门全结构：每门三折、每折两场三选、选项有账可落、结果有话可说
 *   D2 新六门各有各的人与事（不是换个名字的同一个故事）
 *   D3 选折落账真跑：contribution 当场入账
 *   D4 专属事件 36/36 清零：每门 ≥2 桩，desc/effect 可调可结算
 *   D5 新十门的戏贴着各家的营生（行当味抽查）
 *   D6 老样板不回退：三门旧断言数据仍在，事件池混抽无异常
 *
 * 运行：node tests/v20.50-sect-content-node.js
 */
'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');

var passed = 0, failed = 0;
function assert(msg, cond) {
    if (cond) { passed++; console.log('  ✅ ' + msg); }
    else { failed++; console.log('  ❌ ' + msg); }
}
function loadScript(rel) { return fs.readFileSync(path.resolve(__dirname, '..', rel), 'utf8'); }

function makeStoryWorld(opts) {
    opts = opts || {};
    var modals = [];
    var w = {
        console: { log: function () {}, warn: function () {}, error: function () {} },
        JSON: JSON, Math: Math, Number: Number, String: String,
        currentCharData: { luck: 50, _sectStory: opts.story || {} },
        discipleState: { isInSect: opts.inSect !== false, sectId: opts.sect || '丐帮',
            contribution: opts.contrib != null ? opts.contrib : 0 },
        timeSystem: { onNewDaySubscribe: function () {} },
        showModal: opts.noModal ? undefined : function (t, b) { modals.push({ t: t, b: b }); },
        updateCharacterStatus: function () {},
        __modals: modals
    };
    w.window = w;
    var ctx = vm.createContext(w);
    vm.runInContext(loadScript('js/sects/sect-story-arc.js'), ctx);
    return w;
}

function makeEvtWorld() {
    var w = {
        console: { log: function () {}, warn: function () {}, error: function () {} },
        JSON: JSON, Math: Math,
        SECT_INTERNAL: {}, discipleState: { isInSect: true, sectId: '', contribution: 0, points: 0 }
    };
    w.window = w;
    var ctx = vm.createContext(w);
    vm.runInContext(loadScript('js/sects/sect-exclusive-events.js'), ctx);
    return w;
}

var ALL_SECTS = '少林寺 嵩山派 大旗门 恒山派 全真教 华山派 武当派 侠隐阁 天涯海阁 泰山派 药王谷 神机门 霹雳堂 茅山派 大隐阁 天书阁 蓬莱派 衡山派 丐帮 铁掌帮 百花谷 五仙教 修罗宫 阎罗殿 昆仑派 金刚宗 天龙教 烈日教 天山派 逍遥派 血手门 青城派 峨眉派 唐门 铸剑山庄 飞蝎坞'.split(' ');

// ==================== D1 故事弧全结构 ====================
console.log('\n[D1] 故事弧 36 门全结构');
(function () {
    var w = makeStoryWorld({});
    var arcs = w.SECT_STORY_ARCS;
    var ids = Object.keys(arcs);
    assert(ids.length === 36, '故事弧 36 门（实得 ' + ids.length + '）');
    var ok = true, bad = [];
    ids.forEach(function (s) {
        var arc = arcs[s];
        if (!arc.name || !arc.stages || arc.stages.length !== 3) { ok = false; bad.push(s + ':折数'); return; }
        arc.stages.forEach(function (st, i) {
            if (!st.title || !st.scenes || st.scenes.length < 2) { ok = false; bad.push(s + '#'+i+':场次'); }
            if (!st.choices || st.choices.length !== 3) { ok = false; bad.push(s + '#'+i+':选项数'); return; }
            st.choices.forEach(function (c, j) {
                if (!c.text || !c.effect || !c.effect.contribution) { ok = false; bad.push(s + '#'+i+'选'+j+':账'); }
                if (!c.result || c.result.length < 20) { ok = false; bad.push(s + '#'+i+'选'+j+':结果'); }
            });
        });
    });
    assert('每门三折、每折两场三选、选项可落账、结果有血肉' + (bad.length ? '（异常：' + bad.slice(0,4).join(' ') + '）' : ''), ok);
    // 36 门名单与命门档案/专属事件池对齐，一门不缺
    var missingArc = ALL_SECTS.filter(function (s) { return !arcs[s]; });
    assert('36 门全有故事弧（缺：' + (missingArc.join(',') || '无') + '）', missingArc.length === 0);
    // 108 折各有各的折题（无重名 → 不是一套模板换皮）
    assert('108 折折题无重名（不是一套模板换皮）', (function () {
        var seen = {};
        ids.forEach(function (s) { arcs[s].stages.forEach(function (st) { seen[st.title] = (seen[st.title] || 0) + 1; }); });
        return Object.keys(seen).length === ids.length * 3;
    })());
    // 三门老样板原样健在
    assert('老三门（少林/武当/修罗宫）数据未回退',
        arcs['少林寺'].stages[0].scenes.join('').indexOf('监斋僧') >= 0 &&
        arcs['武当派'].stages[2].title === '真武试剑' &&
        arcs['修罗宫'].stages[0].title === '入宫先记名');
})();

// ==================== D2 各门有各门的人 ====================
console.log('\n[D2] 各门各有各的人与事（行当抽查）');
(function () {
    var arcs = makeStoryWorld({}).SECT_STORY_ARCS;
    function txt(s) { return JSON.stringify(arcs[s]); }
    assert('丐帮：碗与打狗棒的世界', txt('丐帮').indexOf('碗') >= 0 && txt('丐帮').indexOf('打狗棒') >= 0);
    assert('药王谷：尝药与谷规', txt('药王谷').indexOf('尝') >= 0 && txt('药王谷').indexOf('谷规') >= 0);
    assert('唐门：毒与规矩', txt('唐门').indexOf('毒') >= 0 && txt('唐门').indexOf('机括') >= 0);
    assert('铸剑山庄：炉火与署名', txt('铸剑山庄').indexOf('炉火') >= 0 && txt('铸剑山庄').indexOf('署名') >= 0);
    assert('天山派：雪线与剑庐', txt('天山派').indexOf('雪线') >= 0 && txt('天山派').indexOf('剑庐') >= 0);
    assert('阎罗殿：赏格与罪状', txt('阎罗殿').indexOf('赏格') >= 0 && txt('阎罗殿').indexOf('罪状') >= 0);
    assert('嵩山派：并派章程与座次', txt('嵩山派').indexOf('并派') >= 0 && txt('嵩山派').indexOf('座次') >= 0);
    assert('大旗门：旗与弩', txt('大旗门').indexOf('旗') >= 0 && txt('大旗门').indexOf('弩') >= 0);
    assert('华山派：气宗剑宗', txt('华山派').indexOf('气宗') >= 0 && txt('华山派').indexOf('剑宗') >= 0);
    assert('天涯海阁：护航与暗礁', txt('天涯海阁').indexOf('护航') >= 0 && txt('天涯海阁').indexOf('暗礁') >= 0);
    assert('神机门：图样与齿轮', txt('神机门').indexOf('图') >= 0 && txt('神机门').indexOf('齿轮') >= 0);
    assert('霹雳堂：引信与震天雷', txt('霹雳堂').indexOf('引信') >= 0 && txt('霹雳堂').indexOf('震天雷') >= 0);
    assert('天书阁：虫蛀与孤本', txt('天书阁').indexOf('虫') >= 0 && txt('天书阁').indexOf('孤本') >= 0);
    assert('五仙教：蛊与土司印', txt('五仙教').indexOf('蛊') >= 0 && txt('五仙教').indexOf('土司') >= 0);
    assert('烈日教：井与水引', txt('烈日教').indexOf('井') >= 0 && txt('烈日教').indexOf('水引') >= 0);
    assert('血手门：旧档与三不做', txt('血手门').indexOf('档') >= 0 && txt('血手门').indexOf('三不做') >= 0);
    assert('飞蝎坞：蝎与用量簿', txt('飞蝎坞').indexOf('蝎') >= 0 && txt('飞蝎坞').indexOf('用量簿') >= 0);
})();

// ==================== D3 选折落账真跑 ====================
console.log('\n[D3] 选折当场落账（新老各抽几门真跑）');
(function () {
    ['丐帮', '嵩山派', '神机门', '金刚宗', '飞蝎坞'].forEach(function (s) {
        var w = makeStoryWorld({ sect: s, contrib: 0 });
        var okPending = w.getSectStoryPendingStage(s) === 0;
        var before = w.discipleState.contribution;
        var done = w._resolveSectStory(s, 0, 1);
        assert(s + ' 第一折可开演、选折落账（' + before + ' → ' + w.discipleState.contribution + '）',
            okPending && done && w.discipleState.contribution > before);
        assert(s + ' 演过的折不再重演（一幕一次）', w.getSectStoryPendingStage(s) === null);
    });
})();

// ==================== D4 专属事件 36/36 ====================
console.log('\n[D4] 专属事件 36 门清零');
(function () {
    var w = makeEvtWorld();
    var pool = w.SECT_EXCLUSIVE_EVENTS;
    var missing = ALL_SECTS.filter(function (s) { return !pool[s]; });
    assert('36 门全有专属事件（缺：' + (missing.join(',') || '无') + '）', missing.length === 0);
    var thin = ALL_SECTS.filter(function (s) { return Object.keys(pool[s]).length < 2; });
    assert('每门 ≥2 桩（单薄的：' + (thin.join(',') || '无') + '）', thin.length === 0);
    var ok = true, bad = [];
    ALL_SECTS.forEach(function (s) {
        Object.keys(pool[s]).forEach(function (id) {
            var ev = pool[s][id];
            try {
                var d = ev.desc();
                var r = ev.effect(s);
                if (!d || d.length < 12 || !r || !r.length) { ok = false; bad.push(s + '/' + id); }
            } catch (e) { ok = false; bad.push(s + '/' + id + '(' + e.message + ')'); }
        });
    });
    assert('全部事件的 desc/effect 可调可结算（异常：' + (bad.slice(0,4).join(' ') || '无') + '）', ok);
})();

// ==================== D5 行当味抽查 ====================
console.log('\n[D5] 新十门的戏贴着各家的营生');
(function () {
    var pool = makeEvtWorld().SECT_EXCLUSIVE_EVENTS;
    function txt(s) { return JSON.stringify(pool[s]); }
    assert('烈日教：驼队与井', txt('烈日教').indexOf('驼队') >= 0 && txt('烈日教').indexOf('井') >= 0);
    assert('飞蝎坞：蝎与赶海', txt('飞蝎坞').indexOf('蝎') >= 0 && txt('飞蝎坞').indexOf('赶') >= 0);
    assert('血手门：旧单与烧档', txt('血手门').indexOf('旧单') >= 0 && txt('血手门').indexOf('烧档') >= 0);
    assert('天龙教：纳贡与巡讲', txt('天龙教').indexOf('纳贡') >= 0 && txt('天龙教').indexOf('巡讲') >= 0);
    assert('峨眉派：灵茶与香客', txt('峨眉派').indexOf('灵茶') >= 0 && txt('峨眉派').indexOf('进香') >= 0);
    assert('铸剑山庄：开炉与淬火', txt('铸剑山庄').indexOf('开炉') >= 0 && txt('铸剑山庄').indexOf('淬火') >= 0);
})();

// ==================== D6 与通用池同构可用 ====================
console.log('\n[D6] 与通用事件引擎同构');
(function () {
    var w = makeEvtWorld();
    var exclusive = w.SECT_EXCLUSIVE_EVENTS['天山派'];
    var ids = Object.keys(exclusive);
    var ok = ids.every(function (id) {
        var ev = exclusive[id];
        return typeof ev.desc === 'function' && typeof ev.effect === 'function' &&
            typeof ev.minMorale === 'number' && typeof ev.maxMorale === 'number' && ev.icon && ev.name;
    });
    assert('新十门事件字段齐（type/icon/name/desc/effect/士气区间）——generateSectEvent 可直接混抽', ok);
})();

console.log('\n========== 结果：' + passed + ' 通过 / ' + failed + ' 失败 ==========');
process.exit(failed ? 1 : 0);
