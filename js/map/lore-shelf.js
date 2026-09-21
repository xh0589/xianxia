// ==================== 第七十五波 · 游历残页册（拾得的旧事，收成一册随时重读） ====================
// 洞天开匣、三张拼一段的旧事（五十七/五十八波）都是「到手那一刻现出」——飘过眼前就没了，
// 捡了三十张残页的人和没捡过的人，行囊一样空。本账把册子立起来：
// 开匣账（wildState.regions[*].grottoLoot）本就在档，匣中之物按「坐标+地域」定数可倒推——
// **册子是纯读端**：一页一页把拾过的残页原样重演（与石室里看到的一字不差），拼齐的域收起完整旧事。
// 纪律：①零新存档字段（册子不记账，账是开匣账的老账）；②零骰（倒推与残页同一条定数哈希）；
//       ③零经济、零悟道点（旧事不换钱不换点——册子只是让你重读）；④对野图账只读不写。
(function () {
    'use strict';

    // 九域正册（与游历见闻同一本域单）；另有天界等化外之地走仙家遗宝回退池，册子照收
    var REGIONS = ['中州', '东荒', '南疆', '西漠', '北冥', '蜀地', '东南海域', '灵界', '魔界'];

    function api() { return window.wildMapApi || null; }
    function say(m, t) { try { if (window.showMessage) window.showMessage(m, t || 'info'); } catch (e) {} }
    function wildState() {
        try { var a = api(); return (a && typeof a.state === 'function') ? a.state() : null; } catch (e) { return null; }
    }
    function capOf() {
        try { var a = api(); return Number(a && a.lore && a.lore.ECHO_CFG && a.lore.ECHO_CFG.CAP) || 3; } catch (e) { return 3; }
    }
    function hashOf(s) {
        try { var a = api(); return a.lore.hash(s); } catch (e) { return 0; }
    }
    function itemName(id) {
        try { return (window.itemById && window.itemById[id] && window.itemById[id].name) || '旧物'; } catch (e) { return '旧物'; }
    }
    // 匣中之物倒推：与开匣选件同一条定数公式（坐标×17/31 加地域哈希，模货池）——册子与石室一本账
    function deriveItem(region, cellKey) {
        var a = api();
        if (!a) return null;
        var pool = (a.grotto && a.grotto.LOOT && a.grotto.LOOT[region]) || (a.grotto && a.grotto.LOOT_FALLBACK) || [];
        if (!pool.length) return null;
        var xy = String(cellKey).split(',');
        var gx = Number(xy[0]) || 0, gy = Number(xy[1]) || 0;
        var h = hashOf(region);
        return pool[(gx * 17 + gy * 31 + h) % pool.length];
    }
    // 残页重演：与到手即现同一条播种（货名|地域|）——同一件旧物永远配同一段旧事
    function storyFor(itemId, region) {
        var a = api();
        if (!a || !a.lore) return null;
        var C = a.lore.CFG;
        var seed = String(itemId || '') + '|' + String(region || '') + '|';
        return {
            owner: C.OWNERS[hashOf(seed + 'owner') % C.OWNERS.length],
            why: C.GROTTO_WHY[hashOf(seed + 'why') % C.GROTTO_WHY.length],
            echo: C.ECHOES[hashOf(seed + 'echo') % C.ECHOES.length]
        };
    }
    // 一域拾过的残页（按匣位排定，册页不乱翻）
    function pagesOf(region) {
        var st = wildState();
        if (!st || !st.regions) return [];
        var gl = (st.regions[region] || {}).grottoLoot || {};
        var out = [];
        for (var k in gl) {
            if (!Object.prototype.hasOwnProperty.call(gl, k)) continue;
            var id = deriveItem(region, k);
            if (!id) continue;
            var s = storyFor(id, region) || { owner: '', why: '', echo: '' };
            out.push({ cell: k, day: Number(gl[k]) || 0, itemId: id, name: itemName(id), owner: s.owner, why: s.why, echo: s.echo });
        }
        out.sort(function (x, y) { return x.cell < y.cell ? -1 : (x.cell > y.cell ? 1 : 0); });
        return out;
    }
    // 走过的域（正册九域 + 化外之地，只要开过匣就算）
    function walkedRegions() {
        var st = wildState();
        var list = [];
        var seen = {};
        REGIONS.forEach(function (r) { seen[r] = 1; list.push(r); });
        if (st && st.regions) {
            for (var r in st.regions) {
                if (!Object.prototype.hasOwnProperty.call(st.regions, r)) continue;
                if (seen[r]) continue;
                var gl = (st.regions[r] || {}).grottoLoot || {};
                if (Object.keys(gl).length) list.push(r);
            }
        }
        return list.filter(function (r) { return pagesOf(r).length > 0; });
    }
    function summary() {
        var cap = capOf();
        var walked = walkedRegions();
        var pages = 0, full = 0;
        walked.forEach(function (r) {
            var n = pagesOf(r).length;
            pages += n;
            if (n >= cap) full++;
        });
        return { pages: pages, full: full, walked: walked.length, cap: cap, regions: REGIONS.length, capTotal: REGIONS.length * cap };
    }
    function fullStory(region) {
        var a = api();
        var opened = pagesOf(region).length;
        var cap = capOf();
        if (opened < cap) return { complete: false, missing: cap - opened, text: '' };
        var text = '';
        try { text = (a.lore.FULL && a.lore.FULL[region]) || a.lore.FULL_FALLBACK || ''; } catch (e) {}
        return { complete: true, missing: 0, text: text };
    }

    // ============ 册子本体 ============
    function open() {
        var a = api();
        if (!a || !a.lore || !a.grotto) { say('📜 游历的账还没立起来——册子翻不开。', 'info'); return false; }
        var s = summary();
        var html = '<p class="text-sm text-gray-300 mb-2">崖壁洞天的匣底压着前辈的残页。你拾过的都收在这本册子里——共 <b class="text-amber-300">' + s.pages + '</b> 张，拼成完整旧事 <b class="text-amber-300">' + s.full + '</b> 域（九域满册 ' + s.capTotal + ' 张）。</p>';
        var walked = walkedRegions();
        if (!walked.length) {
            html += '<p class="text-xs text-gray-500 mb-3">册子还空着——去山野里寻崖壁洞天（白顶高山处打坐，山风穿石自有缘法），前辈的旧事等在匣底。</p>';
        } else {
            walked.forEach(function (r) {
                var pages = pagesOf(r);
                var fs = fullStory(r);
                html += '<div class="bg-gray-800/60 rounded-lg p-3 mb-2 border border-gray-700">';
                html += '<p class="font-bold text-amber-400 text-sm">🏔️ ' + r + ' <span class="text-xs text-gray-500 font-normal">（已拾 ' + pages.length + '/' + s.cap + '）</span></p>';
                pages.forEach(function (p) {
                    html += '<p class="text-xs text-gray-300 mt-1 leading-relaxed">📜 【' + p.name + '】原是' + p.owner + '之物，' + p.why + '。页尾一行小字：「' + p.echo + '」' + (p.day ? ' <span class="text-gray-600">（第 ' + p.day + ' 天拾得）</span>' : '') + '</p>';
                });
                if (fs.complete) {
                    html += '<p class="text-xs text-emerald-300/90 mt-2 leading-relaxed border-t border-gray-700 pt-2">🎐 ' + fs.text + '</p>';
                } else {
                    html += '<p class="text-xs text-gray-500 mt-1">还差 ' + fs.missing + ' 张，这域的旧事就拼齐了。</p>';
                }
                html += '</div>';
            });
        }
        html += '<p class="text-[11px] text-gray-600 mt-2">仇家赃物上的残页随事一现，册子收不住——江湖事，记在心里。旧事不换钱不换悟道点，册子只是让你重读。</p>';
        if (typeof window.showModal === 'function') { window.showModal('📜 游历残页册', html); return true; }
        return false;
    }

    window.LoreShelf = {
        REGIONS: REGIONS,
        deriveItem: deriveItem,
        storyFor: storyFor,
        pagesOf: pagesOf,
        walkedRegions: walkedRegions,
        summary: summary,
        fullStory: fullStory,
        open: open
    };
    window.openLoreShelf = function () { return open(); };
})();
