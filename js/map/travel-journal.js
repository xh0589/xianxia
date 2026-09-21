/**
 * travel-journal.js — v36 游历见闻：散修走过的每一步都算数
 * 三本一次性小账，全记在角色数据 _travel 上（随存档走）：
 *   一、初至一域（九州 + 灵界魔界，一地只记一回）→ +1 悟道点
 *   二、亲至地标（十二处有名有姓的大地标，脚踩上去才算）→ +2 悟道点
 *   三、步数里程碑（百里 / 五百里 / 两千里 / 八千里，各一回）→ +1 悟道点
 * 悟道点走 window.insightPoints（v36 合账后真源在角色数据上），喂悟道树是真消费口。
 * 全账封顶 9 + 12×2 + 4 = 37 点——游历撑起悟道树的半壁，剩下靠突破与闭关，不会刷穿。
 * 记账全程不吃随机数：野外建图时调用也不挪动山河一格（零漂移铁律）。
 * v39 见闻成就与称号：账落即递成就墙查一轮（五枚游历成就读同一本账的派生快照）；
 *     侧栏称号纯派生不落档、不带属性——名分而已，不开新的战力口子。
 */
(function () {
    'use strict';

    var REGIONS = ['中州', '东荒', '南疆', '西漠', '北冥', '蜀地', '东南海域', '灵界', '魔界'];

    var STEP_MILESTONES = [
        { n: 100, msg: '行百里者，脚下有了路数' },
        { n: 500, msg: '行五百里，山河入了梦来' },
        { n: 2000, msg: '行两千里，散修走成了名号' },
        { n: 8000, msg: '行八千里，九州都踩在脚下' }
    ];

    // v39 见闻称号：纯派生不落档——按快照现算最高一档，没出门就是空。
    // 只是名分不带属性（不开新的战力口子）。排序即优先级：先比大再比小。
    var TITLE_LADDER = [
        { t: '踏遍九州', hit: function (s) { return s.regions >= 9; } },
        { t: '万里独行', hit: function (s) { return s.steps >= 8000; } },
        { t: '见多识广', hit: function (s) { return s.landmarks >= 6; } },
        { t: '行走山河', hit: function (s) { return s.regions >= 5; } },
        { t: '初出茅庐', hit: function (s) { return s.steps >= 100; } }
    ];
    function travelTitle() {
        var s = summary();
        for (var i = 0; i < TITLE_LADDER.length; i++) {
            if (TITLE_LADDER[i].hit(s)) return TITLE_LADDER[i].t;
        }
        return '';
    }

    function charData() {
        var cd = null;
        try { cd = (typeof window.getCurrentCharData === 'function') ? window.getCurrentCharData() : null; } catch (e) {}
        return cd || window.currentCharData || null;
    }

    function absDay() {
        try {
            if (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') {
                return Number(window.timeSystem.getAbsoluteDay()) || 0;
            }
        } catch (e) {}
        return 0;
    }

    function journal(cd) {
        const j = cd._travel || (cd._travel = {});
        if (!j.regions || typeof j.regions !== 'object') j.regions = {};
        if (!j.marks || typeof j.marks !== 'object') j.marks = {};
        if (typeof j.steps !== 'number' || !isFinite(j.steps) || j.steps < 0) j.steps = 0;
        return j;
    }

    function say(msg, type) {
        try { if (window.showMessage) window.showMessage(msg, type || 'info'); } catch (e) {}
    }

    // 记一笔并发悟道点——只此一个口子，账与钱永远对得上
    function grant(cd, n, msg) {
        try { window.insightPoints = (Number(window.insightPoints) || 0) + n; } catch (e) {}
        say('🧭 ' + msg + '（悟道点 +' + n + '）', 'success');
        try { if (typeof window.updateInsightUI === 'function') window.updateInsightUI(); } catch (e) {}
        // v39 见闻成就：账一落成就墙当场查一轮（点亮与否成就系统自己判，这边只管递账）
        try { if (typeof window.checkAchievementsNow === 'function') window.checkAchievementsNow(); } catch (e) {}
        render();
    }

    // 通用一次性记账：灵池初出等外场小账也走这里，防止两处各记各的
    function markOnce(key, n, msg) {
        const cd = charData();
        if (!cd || !key) return false;
        const j = journal(cd);
        if (j.marks[key]) return false;
        j.marks[key] = 1;
        grant(cd, n, msg);
        return true;
    }

    // 初至一域（建图时调用，零随机零漂移）
    function noteRegion(region) {
        const cd = charData();
        if (!cd || !region) return false;
        // v44 守卫：只认名录内的九州地界——天界是仙界，不进「域 x/9」的见闻账，不发初至悟道点
        if (REGIONS.indexOf(region) < 0) return false;
        const j = journal(cd);
        if (j.regions[region]) return false;
        j.regions[region] = absDay();
        grant(cd, 1, '初至「' + region + '」——山河新异，心生感悟');
        return true;
    }

    // 亲至地标（脚下踩上地标 POI 才算，雾里看见的不计）
    function noteLandmark(poi) {
        const cd = charData();
        if (!cd || !poi || poi.type !== 'landmark' || !poi.id) return false;
        return markOnce('lm_' + poi.id, 2, '亲至地标「' + (poi.name || poi.id) + '」——百闻不如一见');
    }

    // 走一步记一步；到里程碑发点（每档一生只发一回）
    function noteStep() {
        const cd = charData();
        if (!cd) return false;
        const j = journal(cd);
        j.steps += 1;
        var fired = false;
        for (var i = 0; i < STEP_MILESTONES.length; i++) {
            var m = STEP_MILESTONES[i];
            if (j.steps >= m.n && !j.marks['step_' + m.n]) {
                j.marks['step_' + m.n] = 1;
                grant(cd, 1, m.msg);
                fired = true;
            }
        }
        if (!fired) {
            // v39 步数门槛（百里 / 八千里）不落在里程碑上的那几步也要能当场点亮成就
            try { if (typeof window.checkAchievementsNow === 'function') window.checkAchievementsNow(); } catch (e) {}
            render();
        }
        return fired;
    }

    function summary() {
        const cd = charData();
        const landmarkTotal = (window.LANDMARKS && typeof window.LANDMARKS === 'object') ? Object.keys(window.LANDMARKS).length : 12;
        if (!cd) return { regions: 0, regionTotal: REGIONS.length, landmarks: 0, landmarkTotal: landmarkTotal, steps: 0, marks: 0 };
        const j = journal(cd);
        var lm = 0, mk = 0;
        for (var k in j.marks) {
            mk++;
            if (k.indexOf('lm_') === 0) lm++;
        }
        return {
            regions: Object.keys(j.regions).length, regionTotal: REGIONS.length,
            landmarks: lm, landmarkTotal: landmarkTotal,
            steps: j.steps, marks: mk
        };
    }

    // 侧栏一行小账：见闻称号 + 走过几域、见过几处地标、脚下多少步
    function render() {
        try {
            const el = (typeof document !== 'undefined' && document.getElementById) ? document.getElementById('wild-travel-journal') : null;
            if (!el) return;
            const s = summary();
            const t = travelTitle();
            el.innerHTML = '<span class="text-gray-300">游历见闻</span>' +
                (t ? ' · <span class="text-amber-300">' + t + '</span>' : '') +
                ' · 域 ' + s.regions + '/' + s.regionTotal +
                ' · 地标 ' + s.landmarks + '/' + s.landmarkTotal + ' · 步 ' + s.steps;
        } catch (e) {}
    }

    window.TravelJournal = {
        noteRegion: noteRegion,
        noteLandmark: noteLandmark,
        noteStep: noteStep,
        markOnce: markOnce,
        summary: summary,
        render: render,
        travelTitle: travelTitle,
        TITLE_LADDER: TITLE_LADDER,
        REGIONS: REGIONS,
        STEP_MILESTONES: STEP_MILESTONES
    };
    window.renderTravelJournal = render;
})();
