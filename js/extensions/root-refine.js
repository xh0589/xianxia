// ==================== root-refine.js — v20.16 重塑灵根（后天改命线） ====================
// 玩家服用重塑灵根丹 → 本命主根占比 +6，其余五行按比例摊薄，饼总和恒 100（族谱 _pieRoots 同一把尺）。
// 设计宪法：
//   - 不新增平行状态：灵根唯一真源 currentCharData.spiritualRoots；重塑次数 `_rootRefines` 走角色存档白名单
//   - 无每日配额：成本=仙品丹药（稀有药材炼制）+丹毒+两个时辰；主根占比封顶 60，摊薄机制天然收益递减
//   - 不动任何判定：修炼倍率/单元素匹配/功法兼容全部原样读饼，丹只是挪份额
(function (global) {
    'use strict';

    var MAIN_CAP = 60;    // 主根占比上限（六成）：先天定六成，后天改不动最后四成
    var STEP = 6;         // 每丹主根占比目标增量（经配平摊薄后实际增量递减）

    function _pie(roots) {
        // 与族谱面板同一把尺；族谱缺载时本地兜底配平（口径一致：按占比缩放到 100）
        if (global.NpcLineage && typeof global.NpcLineage._pieRoots === 'function') {
            try { return global.NpcLineage._pieRoots(roots); } catch (e) {}
        }
        var keys = ['metal', 'wood', 'water', 'fire', 'earth'];
        var out = {}, sum = 0;
        keys.forEach(function (k) { out[k] = Math.max(0, Math.round(Number(roots[k]) || 0)); sum += out[k]; });
        if (sum <= 0) { keys.forEach(function (k) { out[k] = 20; }); return out; }
        if (sum === 100) return out;
        // 最大余数法配平到 100（与族谱口径同法：整数、无取整漂移）
        var assigned = 0;
        keys.forEach(function (k) {
            var exact = out[k] * 100 / sum;
            out[k] = Math.floor(exact);
            out[k + '_frac'] = exact - out[k];
            assigned += out[k];
        });
        keys.slice().sort(function (a, b) { return out[b + '_frac'] - out[a + '_frac']; }).slice(0, 100 - assigned)
            .forEach(function (k) { out[k] += 1; });
        keys.forEach(function (k) { delete out[k + '_frac']; });
        return out;
    }

    /**
     * 服丹重塑灵根。成功返回 { fromMain, toMain, count }（调用方负责扣丹与播报）；
     * 拒绝返回 { error: '...' }（丹药不白扣）。
     */
    function refineRootByPill() {
        var cd = global.currentCharData;
        if (!cd) return { error: '请先创建角色' };
        if (!cd.spiritualRoots || !Object.keys(cd.spiritualRoots).length) return { error: '灵根未定，无从重塑' };
        var before = _pie(cd.spiritualRoots);
        var keys = ['metal', 'wood', 'water', 'fire', 'earth'];
        var mainKey = null, mainVal = 0;
        keys.forEach(function (k) {
            var v = Math.round(Number(before[k]) || 0);
            if (v > mainVal) { mainVal = v; mainKey = k; }
        });
        if (!mainKey) return { error: '灵根未定，无从重塑' };
        if (mainVal >= MAIN_CAP) {
            return { error: '本命灵根已纯（主根占比已达六成），再服无益——药力不会白受，但饼挪不动了' };
        }
        // 挪饼：主根目标 +STEP（先加后配平，摊薄自动发生；越接近上限实际增量越小）
        var after = {};
        keys.forEach(function (k) { after[k] = Math.round(Number(before[k]) || 0); });
        after[mainKey] = after[mainKey] + STEP;
        after = _pie(after);
        var newMain = Math.round(Number(after[mainKey]) || 0);
        if (newMain > MAIN_CAP) {
            // 配平后越界（理论不发生：60+6 摊回 <60），硬钳位并如实播报实际值
            var excess = newMain - MAIN_CAP;
            after[mainKey] = MAIN_CAP;
            var others = keys.filter(function (k) { return k !== mainKey; });
            var oSum = 0;
            others.forEach(function (k) { oSum += Math.max(0, Number(after[k]) || 0); });
            var add = oSum > 0 ? excess / others.length : 0;
            others.forEach(function (k) { after[k] = (Number(after[k]) || 0) + add; });
            after = _pie(after);
            newMain = Math.round(Number(after[mainKey]) || 0);
        }
        cd.spiritualRoots = after;
        cd._rootRefines = (Number(cd._rootRefines) || 0) + 1;
        if (global.timeSystem && typeof global.timeSystem.advanceTime === 'function') {
            global.timeSystem.advanceTime(120, '服丹重塑灵根');
        }
        var elName = { metal: '金', wood: '木', water: '水', fire: '火', earth: '土' }[mainKey] || '本';
        return { fromMain: mainVal, toMain: newMain, element: elName, count: cd._rootRefines };
    }

    // 供面板/测试读取的只读口径
    function rootRefineInfo() {
        var cd = global.currentCharData;
        if (!cd || !cd.spiritualRoots) return null;
        var before = _pie(cd.spiritualRoots);
        var mainVal = 0, mainKey = null;
        ['metal', 'wood', 'water', 'fire', 'earth'].forEach(function (k) {
            var v = Math.round(Number(before[k]) || 0);
            if (v > mainVal) { mainVal = v; mainKey = k; }
        });
        return {
            mainKey: mainKey,
            mainRatio: mainVal,
            cap: MAIN_CAP,
            refines: Number(cd._rootRefines) || 0
        };
    }

    global.refineRootByPill = refineRootByPill;
    global.rootRefineInfo = rootRefineInfo;
})(typeof window !== 'undefined' ? window : this);
