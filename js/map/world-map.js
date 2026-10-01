// ==================== world-map.js - 天下疆界（v20.63） ====================
// 九张地区野外图此前彼此不认识：列表里点哪张就开哪张，跑图跑不出「天下」的感觉。
// 这里把九州拼回一块大陆：谁与谁接壤、走哪道关隘、隔多少里、路上会出什么事。
// 位面（灵界/魔界）不入疆界——寻常脚力到不了，只走位面之门（map/high-planes.js）。
// 纯数据 + 结账 + 上图；不读存档、不改城池归属（人在野外跨境，只挪脚下那片山河）。

(function (global) {
    'use strict';

    // ============ 疆界：谁与谁接壤 ============
    // li：两地关隘之间的里数。折算只此一处（journeyMinutes＝里×2 分钟；1 时辰＝120 分钟 ⇒ 60 里＝一个时辰）。
    //   第一百三十一批更正：这一行旧写法写作「60 里≈两个时辰」，比真账大一倍——下面那句出关回执的写死时长就是被它带歪的。
    // kind：这条路是什么走法，决定路上会出什么事
    var WORLD_BORDERS = [
        { a: '中州', b: '东荒', route: '青木官道', li: 240, kind: 'road',   blurb: '官道两边古木成荫，越往东林子越密，兽吼也越近。' },
        { a: '中州', b: '北冥', route: '寒江关', li: 360, kind: 'pass',   blurb: '出关便是风雪，戍卒换了三班，剑气在关外成雾。' },
        { a: '中州', b: '西漠', route: '玉门古道', li: 300, kind: 'road',   blurb: '出了玉门，草木一年比一年少，驼铃比人声多。' },
        { a: '中州', b: '南疆', route: '赤水廊桥', li: 300, kind: 'bridge', blurb: '过桥水色转赤，瘴气贴着水面走，廊柱上挂满旧符。' },
        { a: '中州', b: '蜀地', route: '剑阁栈道', li: 180, kind: 'cliff',  blurb: '栈道钉在崖壁上，底下是云，剑冢余气顺着崖缝往上冒。' },
        { a: '东荒', b: '北冥', route: '朔风山道', li: 300, kind: 'pass',   blurb: '山道一年冻大半年，朔风把人往崖下推。' },
        { a: '东荒', b: '东南海域', route: '蓬莱渡海', li: 200, kind: 'sea',   blurb: '海雾里看得见仙岛影子，潮信比时辰还准。' },
        { a: '南疆', b: '西漠', route: '瘴沙古道', li: 260, kind: 'road',   blurb: '瘴林尽头是沙，一路上没人烟，只有中间一线水。' },
        { a: '南疆', b: '蜀地', route: '青羌栈道', li: 200, kind: 'cliff',  blurb: '栈道在河谷里绕，蛊歌顺着水声飘上来。' },
        { a: '南疆', b: '东南海域', route: '鲛人海路', li: 220, kind: 'sea',   blurb: '渔火帮的船只在夜里出海，海图得用珍珠粉才看得清。' },
        { a: '西漠', b: '蜀地', route: '流沙栈道', li: 240, kind: 'cliff',  blurb: '栈道半截埋在流沙里，走得比官道慢，也比官道静。' }
    ];

    // ============ 九州在舆图上的落笔点（与仙侠大陆那张图的位置对齐） ============
    var REGION_ANCHORS = {
        '中州': { x: 400, y: 285 }, '东荒': { x: 610, y: 275 }, '南疆': { x: 380, y: 445 },
        '西漠': { x: 170, y: 285 }, '北冥': { x: 175, y: 145 }, '蜀地': { x: 175, y: 440 },
        '东南海域': { x: 690, y: 430 }
    };

    // ============ 关隘上的事 ============
    // time：多花（负数是省下）的分钟数，念出来一律走 shichenText 现推
    //   （第一百三十一批 DES-54：旧写法在三句文案里写死「半个时辰／一个时辰」，与真落笔的 30/30/60 分钟差一倍——
    //    牌面各算各的正是这一族的病根，时辰数字不许再进文案，只进回执那一句）
    // hp/energy：掉的血与力气  stones：破财  gain：捡着的好物
    var BORDER_INCIDENTS = {
        pass: [
            { text: '关卒盘查行囊，一件件抖开看。', time: 30, energy: 4 },
            { text: '关外风雪扑面，眉毛上都结了霜。', energy: 8 },
            { text: '关口外兽啸连声，多绕了半条山路。', energy: 6, hp: 3 }
        ],
        road: [
            { text: '一伙马贼远远缀着，绕小路才甩脱。', energy: 9 },
            { text: '同路商队搭了段伙，分了你一囊干粮。', gain: 'pill_small_recovery' },
            { text: '风沙起时迷了道，多走了几里冤枉路。', time: 40, energy: 5 }
        ],
        cliff: [
            { text: '栈板朽了一块，踩空半步才稳住。', hp: 5 },
            { text: '崖风一阵阵往上灌，手脚都僵了。', energy: 8 },
            { text: '崖缝里溢出剑冢余气，擦着臂膀过去。', hp: 4 }
        ],
        bridge: [
            { text: '桥头瘴气贴着水漫上来，呛得人头晕。', hp: 3, energy: 5 },
            { text: '廊柱旧符被风掀起，你顺手替它贴了回去。', gain: 'mat_lingzhi' },
            { text: '桥面湿滑，一步一步踩得小心。', time: 30, energy: 3 }
        ],
        sea: [
            { text: '半途起了风浪，船身颠得人站不稳。', hp: 4, energy: 6 },
            { text: '夜里渔火引路，船走得顺。', time: -40 },   // 第一百三十一批登记：这支的「省」从未进账（passTime 下限 0），要真减时辰属待裁
            { text: '海雾里迷了方向，兜兜转转才找着水道。', time: 60, energy: 6 }
        ]
    };

    function say(msg, type) {
        if (global.showMessage) global.showMessage(msg, type || 'info');
    }

    function passTime(minutes, reason) {
        if (global.timeSystem && typeof global.timeSystem.advanceTime === 'function') {
            global.timeSystem.advanceTime(Math.max(0, Math.round(minutes)), reason);
        }
    }

    // ============ 疆界问询 ============
    function isPlane(region) { return region === '灵界' || region === '魔界'; }

    function knownRegion(region) {
        var md = global.mapData || {};
        return !!md[region];
    }

    function borderBetween(a, b) {
        if (!a || !b || a === b) return null;
        for (var i = 0; i < WORLD_BORDERS.length; i++) {
            var bd = WORLD_BORDERS[i];
            if ((bd.a === a && bd.b === b) || (bd.a === b && bd.b === a)) return bd;
        }
        return null;
    }

    function neighborsOf(region) {
        var out = [];
        for (var i = 0; i < WORLD_BORDERS.length; i++) {
            var bd = WORLD_BORDERS[i];
            if (bd.a === region) out.push({ region: bd.b, route: bd.route, li: bd.li, kind: bd.kind });
            else if (bd.b === region) out.push({ region: bd.a, route: bd.route, li: bd.li, kind: bd.kind });
        }
        return out;
    }

    // 取道：跨不了境就得一站一站走（BFS，里数只作提示）
    function pathBetween(from, to) {
        if (!knownRegion(from) || !knownRegion(to) || isPlane(from) || isPlane(to)) return null;
        if (from === to) return [from];
        var prev = {}, seen = {}, queue = [from];
        seen[from] = true;
        while (queue.length) {
            var cur = queue.shift();
            var ns = neighborsOf(cur);
            for (var i = 0; i < ns.length; i++) {
                var nx = ns[i].region;
                if (seen[nx]) continue;
                seen[nx] = true;
                prev[nx] = cur;
                if (nx === to) {
                    var path = [to];
                    var k = to;
                    while (prev[k] !== undefined && prev[k] !== from) { path.unshift(prev[k]); k = prev[k]; }
                    path.unshift(from);
                    return path;
                }
                queue.push(nx);
            }
        }
        return null;
    }

    function journeyMinutes(border) { return Math.round((border.li || 60) * 2); }
    function journeyEnergy(border) { return Math.max(2, Math.round((border.li || 60) / 25)); }

    // DES-54（第一百三十一批）：时长话只借 time-system 那一处折（全仓一把尺）；真源没就绪就念分钟，
    //   绝不在这条支路自己除 120——牌面各算各的正是这一族的病根。
    function shichenText(minutes) {
        var m = Math.max(0, Math.round(Number(minutes) || 0));
        return (typeof global.formatShichen === 'function') ? global.formatShichen(m) : (m + ' 分钟');
    }

    // ============ 人此刻在哪一州 ============
    // 野外图开着，人就站在那片山河里；回城落脚了，就看那座城归哪一州
    // v25.1·试-21：「在野外」从一条判据收成两条——野图 section 未隐藏，且城市面板没开着。
    //   旧版只看 section 可见性：进城没人收野图时（location-system 已改进城即收，这里是双保险），
    //   人在洛阳城，脚下却按上一回的野区域结算，点旧区域关隘就能「出旧区域」瞬移。
    //   ⚠️ 不能改成「城池名匹配无条件优先」：进野图从不改写 location（randomMap 全程不碰它），
    //   人站在东荒野外时 location 还写着上一座的城——城名优先会把野外的人错判回城里那州。
    function currentRegion() {
        var loc = null;
        try {
            if (global.locationSystem && typeof global.locationSystem.getCurrentLocation === 'function') {
                loc = global.locationSystem.getCurrentLocation();
            }
        } catch (e) {}
        if (!loc && global.currentCharData) loc = global.currentCharData.location;
        // 位面住客：人在灵界魔界，脚下就是位面，不看上一回开的是哪张图
        if (loc && (String(loc).indexOf('灵界') === 0 || String(loc).indexOf('魔界') === 0)) {
            return String(loc).indexOf('灵界') === 0 ? '灵界' : '魔界';
        }
        var inWild = false;
        try {
            var sec = global.document && global.document.getElementById ? global.document.getElementById('random-map-section') : null;
            inWild = !!(sec && sec.classList && !sec.classList.contains('hidden'));
        } catch (e2) {}
        // v25.1·试-21：城市面板开着（或大地图为进城让过位）＝人坐在城里，残影野图不作数
        var inCity = false;
        try {
            var doc = global.document && global.document.getElementById ? global.document : null;
            var cp = doc ? doc.getElementById('city-panel') : null;
            var mp = doc ? doc.getElementById('panel-map') : null;
            inCity = !!(cp && cp.style && cp.style.display === 'block') || !!(mp && mp._hiddenForCity);
        } catch (e3) {}
        if (inWild && !inCity && global.currentRegionForMap && global.currentMap && global.currentMap.length) {
            return global.currentRegionForMap;
        }
        if (!loc) return null;
        var clean = function (s) { return String(s || '').replace(/\s+/g, ''); };
        var want = clean(loc);
        var md = global.mapData || {};
        for (var r in md) {
            var cs = md[r].cities || [];
            for (var i = 0; i < cs.length; i++) {
                var c = clean(cs[i]);
                if (c === want || c.indexOf(want) >= 0 || want.indexOf(c) >= 0) return r;
            }
        }
        // v25.1·试-21 兜底：城名匹不上而野图确实开着、人也不在城里（进城闸刚收过图之类的边角），仍认脚下那片山河
        if (!inCity && inWild && global.currentRegionForMap && global.currentMap && global.currentMap.length) {
            return global.currentRegionForMap;
        }
        return null;
    }

    // ============ 关隘上会出的事 ============
    function rollIncident(border) {
        var pool = BORDER_INCIDENTS[border.kind] || [];
        if (!pool.length || Math.random() >= 0.45) return null;
        return pool[Math.floor(Math.random() * pool.length)];
    }

    function applyIncident(inc) {
        var cd = global.currentCharData;
        if (!inc) return;
        if (inc.time) passTime(inc.time, '关隘耽搁');
        if (cd) {
            if (inc.hp) cd.health = Math.max(0, (cd.health || 0) - inc.hp);
            if (inc.energy) cd.energy = Math.max(0, (cd.energy || 0) - inc.energy);
        }
        if (inc.gain && typeof global.addItemToInventory === 'function') global.addItemToInventory(inc.gain, 1);
        if (typeof global.updateCharacterStatus === 'function') global.updateCharacterStatus();
    }

    function incidentText(inc) {
        if (!inc) return '';
        var bits = [];
        // DES-54（第一百三十一批）：本行只说光景，那笔耽搁由时间通道那句「关隘耽搁耗时X」念——在这儿再念一遍是 DES-42
        if (inc.hp) bits.push('气血 -' + inc.hp);
        if (inc.energy) bits.push('力气 -' + inc.energy);
        if (inc.gain) bits.push('得' + itemName(inc.gain) + '×1');
        return '　·　' + inc.text + (bits.length ? '（' + bits.join('，') + '）' : '');
    }

    function itemName(id) {
        try {
            var t = (global.itemById || {})[id];
            if (t && t.name) return t.name;
        } catch (e) {}
        return '干粮杂物';
    }

    // ============ 起身赶路 ============
    // 同一州：直接开那片山河。邻州：结里数与时辰的账，路上出点事，到对岸开图。
    // 不接壤 / 位面：走不通，说清楚该怎么走。
    function setOut(target, opts) {
        opts = opts || {};
        var from = currentRegion();
        // v20.65：位面闸门前置——旧版「不知身在何方」的兜底会直开位面野外图，
        // 等于境界闸门被绕开；位面住客出门探野是另一回事，照常放行。
        if (isPlane(target)) {
            if (from === target) {
                if (!opts.quiet) global.openWildernessMap(target);
                return true;
            }
            say('「' + target + '」不是脚力能到的地方，得寻位面之门。', 'info');
            return false;
        }
        if (!from) {
            // 不知身在何方：照旧直开，别把人锁在野外门外
            if (typeof global.openWildernessMap === 'function') global.openWildernessMap(target);
            return true;
        }
        if (!knownRegion(target)) { say('没听说过这个地方。', 'warning'); return false; }
        if (target === from) {
            if (!opts.quiet) global.openWildernessMap(target);
            return true;
        }
        var border = borderBetween(from, target);
        if (!border) {
            var path = pathBetween(from, target);
            say('「' + target + '」与' + from + '不接壤' +
                (path && path.length > 2 ? '，得先取道' + path.slice(1, -1).join('、') + '，一站一站走。' : '，天下没有这条路直达。'), 'info');
            return false;
        }

        var cost = journeyEnergy(border);
        var cd = global.currentCharData;
        if (cd && (cd.energy || 0) < cost) {
            say('🧭 脚力不济（走' + border.route + '要 ' + cost + ' 点力气），先打尖歇一晚再上路。', 'warning');
            return false;
        }

        var mins = journeyMinutes(border);
        var inc = rollIncident(border);
        passTime(mins, '取道' + border.route + '往' + target);
        applyIncident(inc);
        if (cd) cd.energy = Math.max(0, (cd.energy || 0) - cost);   // 脚力按里数结，关口上的事另算
        if (typeof global.updateCharacterStatus === 'function') global.updateCharacterStatus();

        // DES-54（第一百三十一批）：这句旧写法把时长写死成「约两个时辰十里」——真账在 mins 里（60 里＝120 分钟＝一个时辰），
        //   可 180 里的剑阁栈道要三个时辰、360 里的寒江关要六个，屏上却人人念同一句。改吃 mins，折法只借 time-system 那一处。
        say('🧭 出' + from + '，走' + border.route + '（' + border.li + ' 里 · 约 ' + shichenText(mins) + '）……' + border.blurb, 'info');
        if (inc) say('⛰️ ' + incidentText(inc), inc.gain ? 'success' : 'warning');
        say('🗺️ 出了' + border.route + '，脚下已是' + target + '地界。', 'success');

        if (typeof global.openWildernessMap === 'function') global.openWildernessMap(target);
        return true;
    }

    // ============ 地图标记开关（v20.66） ============
    // 距离线与关隘标注有人嫌吵：收进一个图层整体显隐，偏好记在本地，默认关（图面清爽）。
    // 「你在此」不在此列——那是定位，不是标注，永远画。
    var OVERLAY_KEY = 'xianxia_map_overlay';
    function overlayVisible() {
        try { return global.localStorage.getItem(OVERLAY_KEY) === '1'; } catch (e) { return false; }
    }
    function applyOverlayVisibility() {
        var doc = global.document;
        if (!doc || !doc.getElementById) return;
        var on = overlayVisible();
        var svg = doc.getElementById('world-map');
        if (svg && svg.querySelector) {
            var g = svg.querySelector('#world-overlay');
            if (g && g.style) g.style.display = on ? '' : 'none';
        }
        var btn = doc.getElementById('btn-map-overlay');
        if (btn) {
            btn.textContent = on ? '🧭 路线标记：开' : '🧭 路线标记：关';
            btn.className = 'text-xs px-2 py-1 rounded border transition ' +
                (on ? 'bg-yellow-900/60 border-yellow-600 text-yellow-300 hover:bg-yellow-800/60'
                    : 'bg-gray-800/80 border-gray-600 text-gray-400 hover:text-yellow-400 hover:border-yellow-600');
        }
        var cb = doc.getElementById('setting-map-overlay');
        if (cb) cb.checked = on;
    }
    function setOverlayVisible(on, quiet) {
        try { if (global.saveToStorage) global.saveToStorage(OVERLAY_KEY, on ? '1' : '0'); else global.localStorage.setItem(OVERLAY_KEY, on ? '1' : '0'); } catch (e) {}
        applyOverlayVisibility();
        if (!quiet) say(on ? '🧭 路线标记已开：九州关隘与里数上图。' : '🧭 路线标记已关：舆图恢复清爽。', 'info');
    }
    global.toggleMapOverlay = function () { setOverlayVisible(!overlayVisible()); };
    global.toggleMapOverlayFromSettings = function () {
        var cb = global.document && global.document.getElementById ? global.document.getElementById('setting-map-overlay') : null;
        setOverlayVisible(cb ? !!cb.checked : !overlayVisible());
    };

    // ============ 上图：九州之间画出路来 ============
    function framePathD(x, y, w, h) { return 'M' + x + ' ' + y + ' H' + (x + w) + ' V' + (y + h) + ' H' + x + ' Z'; }

    function svgEl(doc, tag, attrs) {
        var e = doc.createElementNS('http://www.w3.org/2000/svg', tag);
        for (var k in (attrs || {})) e.setAttribute(k, attrs[k]);
        return e;
    }

    function renderRoutes(svgId) {
        var doc = global.document;
        if (!doc) return;
        var svg = doc.getElementById(svgId || 'world-map');
        if (!svg) return;
        if (svg._worldRoutesBound) return;
        svg._worldRoutesBound = true;

        // v20.66：所有标注（路线 + 关名 + 位面注记）收进一个图层，由「路线标记」开关整体显隐
        var overlay = svg.querySelector ? svg.querySelector('#world-overlay') : null;
        if (!overlay) {
            overlay = svgEl(doc, 'g', { id: 'world-overlay' });
            svg.appendChild(overlay);
        }

        // 路：一弯细线连两地，关名落在半途
        WORLD_BORDERS.forEach(function (bd, i) {
            var A = REGION_ANCHORS[bd.a], B = REGION_ANCHORS[bd.b];
            if (!A || !B) return;
            var mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
            var dx = B.x - A.x, dy = B.y - A.y;
            var len = Math.sqrt(dx * dx + dy * dy) || 1;
            var nx = -dy / len, ny = dx / len;
            var off = ((i % 3) - 1) * 18;
            var qx = mx + nx * off, qy = my + ny * off;

            var g = svgEl(doc, 'g', { 'class': 'world-route-g', 'data-route': bd.route, 'style': 'cursor:pointer;' });
            g.appendChild(svgEl(doc, 'path', {
                d: 'M' + A.x + ' ' + A.y + ' Q' + qx + ' ' + qy + ' ' + B.x + ' ' + B.y,
                fill: 'none', stroke: '#caa96a', 'stroke-width': 1.6, opacity: 0.45, 'class': 'world-route'
            }));
            var label = bd.route + ' · ' + bd.li + ' 里';
            var tw = label.length * 8 + 10;
            g.appendChild(svgEl(doc, 'path', {
                d: framePathD(qx - tw / 2, qy - 9, tw, 16), fill: 'rgba(15,12,6,0.6)', opacity: 0.85
            }));
            var t = svgEl(doc, 'text', { x: qx, y: qy + 2.5, 'font-size': 8.5, 'text-anchor': 'middle', fill: '#f3e3c0', opacity: 0.95 });
            t.textContent = label;
            g.appendChild(t);
            g.addEventListener('click', function () {
                var from = currentRegion();
                if (from !== bd.a && from !== bd.b) {
                    say('这条路连着' + bd.a + '与' + bd.b + '，与' + (from || '你所在之地') + '不相干。', 'info');
                    return;
                }
                setOut(from === bd.a ? bd.b : bd.a);
            });
            overlay.appendChild(g);
        });

        // 位面不在九州之列，图上只留一句话
        var planeNote = svgEl(doc, 'text', { x: 690, y: 26, 'font-size': 9, fill: '#7fd6d0', opacity: 0.7, 'text-anchor': 'middle' });
        planeNote.textContent = '位面之上 · 灵界（须走位面之门）';
        overlay.appendChild(planeNote);
        var abyssNote = svgEl(doc, 'text', { x: 110, y: 585, 'font-size': 9, fill: '#a2464a', opacity: 0.7, 'text-anchor': 'middle' });
        abyssNote.textContent = '位面之下 · 魔界（须走位面之门）';
        overlay.appendChild(abyssNote);

        applyOverlayVisibility();
        drawHereMarker(doc, svg);
    }

    function drawHereMarker(doc, svg) {
        var here = currentRegion();
        var old = svg.querySelector ? svg.querySelector('.world-here') : null;
        if (old && old.parentNode) old.parentNode.removeChild(old);
        if (!here || !REGION_ANCHORS[here]) return;
        var a = REGION_ANCHORS[here];
        var g = svgEl(doc, 'g', { 'class': 'world-here', 'pointer-events': 'none' });
        g.appendChild(svgEl(doc, 'circle', { cx: a.x, cy: a.y, r: 13, fill: 'none', stroke: '#fbbf24', 'stroke-width': 1.2, opacity: 0.65, 'class': 'world-here-pulse' }));
        g.appendChild(svgEl(doc, 'circle', { cx: a.x, cy: a.y, r: 4.5, fill: '#fbbf24', stroke: '#fff', 'stroke-width': 1.2 }));
        // v25.1·P20：三层文字叠字——旧落笔 (a.x, a.y-18) 居中，正压在州名（仙侠.html 静态层，与锚点同坐标）头上，
        //   中州还与城名「长安」(400,238) 挤成一条竖排。挪到金圈右上、改左对齐起笔，逐州核过七处锚点：
        //   与城名/州名/山门幡/洞府幡/关名牌均不再交叠（州名与城名同列的静态层根子在仙侠.html，此处只动自己这层）。
        var t = svgEl(doc, 'text', { x: a.x + 18, y: a.y - 20, 'font-size': 10, 'text-anchor': 'start', fill: '#fbbf24', 'font-weight': 'bold',
            style: 'paint-order:stroke;stroke:rgba(8,12,20,.85);stroke-width:3px;stroke-linejoin:round' });
        t.textContent = '你在此';
        g.appendChild(t);
        svg.appendChild(g);
    }

    // v35 自家山门上图：立了宗，世界图的所在域上就插一面 🏯 幡——点它走正常关隘路回去
    function drawSectMarkers(doc, svg) {
        var old = svg.querySelector ? svg.querySelector('.world-home-sect') : null;
        if (old && old.parentNode) old.parentNode.removeChild(old);
        var home = null;
        try { if (global.PSectWorld && typeof global.PSectWorld.homeName === 'function') home = global.PSectWorld.homeName(); } catch (e) {}
        if (!home) return;
        var sd = (global.sectsData || {})[home];
        var reg = sd && sd.location;
        if (!reg || !REGION_ANCHORS[reg]) return;
        var a = REGION_ANCHORS[reg];
        var x = a.x + 26, y = a.y + 14;
        var g = svgEl(doc, 'g', { 'class': 'world-home-sect', 'style': 'cursor:pointer;' });
        g.appendChild(svgEl(doc, 'circle', { cx: x, cy: y, r: 9, fill: 'rgba(15,12,6,0.6)', stroke: '#fde68a', 'stroke-width': 1, opacity: 0.9 }));
        var ico = svgEl(doc, 'text', { x: x, y: y + 3.5, 'font-size': 10, 'text-anchor': 'middle' });
        ico.textContent = '🏯';
        g.appendChild(ico);
        var t = svgEl(doc, 'text', { x: x, y: y + 20, 'font-size': 8.5, 'text-anchor': 'middle', fill: '#fde68a', opacity: 0.9 });
        t.textContent = home;
        g.appendChild(t);
        g.addEventListener('click', function () {
            if (currentRegion() === reg) {
                if (typeof global.openWildernessMap === 'function') global.openWildernessMap(reg);
            } else {
                setOut(reg);   // 隔州的回山也走关隘路——不绕脚力账
            }
        });
        svg.appendChild(g);
    }

    // 第一百零三波 自家洞府上图：洞府扎在野外的固定洞天（每州一座），世界图的所在州上挂一面 🏠 幡——
    // 点它走正常关隘路回山（与 v35 山门幡同一套路，脚力/时辰/关隘上的事全按疆界的账）
    function drawCaveMarkers(doc, svg) {
        var old = svg.querySelector ? svg.querySelector('.world-home-cave') : null;
        if (old && old.parentNode) old.parentNode.removeChild(old);
        var site = null;
        try { if (global.getHouseSite && typeof global.getHouseSite === 'function') site = global.getHouseSite(); } catch (e) {}
        if (!site || !site.region) return;
        var reg = site.region;
        if (!REGION_ANCHORS[reg]) return;
        var a = REGION_ANCHORS[reg];
        var x = a.x - 26, y = a.y + 14;
        var g = svgEl(doc, 'g', { 'class': 'world-home-cave', 'style': 'cursor:pointer;' });
        g.appendChild(svgEl(doc, 'circle', { cx: x, cy: y, r: 9, fill: 'rgba(15,12,6,0.6)', stroke: '#a7f3d0', 'stroke-width': 1, opacity: 0.9 }));
        var ico = svgEl(doc, 'text', { x: x, y: y + 3.5, 'font-size': 10, 'text-anchor': 'middle' });
        ico.textContent = '🏠';
        g.appendChild(ico);
        var t = svgEl(doc, 'text', { x: x, y: y + 20, 'font-size': 8.5, 'text-anchor': 'middle', fill: '#a7f3d0', opacity: 0.9 });
        t.textContent = site.name;
        g.appendChild(t);
        g.addEventListener('click', function () {
            setOut(reg);   // 同州直接开那片山河（出城上山便到家），隔州走关隘路——不绕脚力账
        });
        svg.appendChild(g);
    }

    // 重画「你在此」（换了州就要挪窝）；路只画一遍
    function refresh(svgId) {
        var doc = global.document;
        if (!doc) return;
        var svg = doc.getElementById(svgId || 'world-map');
        if (!svg) return;
        renderRoutes(svgId);
        applyOverlayVisibility();
        drawHereMarker(doc, svg);
        drawSectMarkers(doc, svg);
        drawCaveMarkers(doc, svg);
    }

    // ============ 野外栏「出此境往」 ============
    function renderExits() {
        var doc = global.document;
        if (!doc) return;
        var el = doc.getElementById('wild-exit-list');
        if (!el) return;
        var from = currentRegion();
        if (!from || isPlane(from) || !knownRegion(from)) {
            el.innerHTML = '<p class="text-xs text-gray-500 text-center">此地不在九州之列，寻常脚力出不去。</p>';
            return;
        }
        var ns = neighborsOf(from);
        el.innerHTML = '<p class="text-[10px] text-gray-500 mb-1">出此境往：</p>' + ns.map(function (n) {
            return '<button data-act="world-exit" data-exit="' + n.region + '" ' +
                'class="w-full text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 py-1 rounded transition text-left px-2">' +
                '🧭 往' + n.region + '（' + n.route + ' · ' + n.li + ' 里）</button>';
        }).join('');
    }

    var api = {
        borders: WORLD_BORDERS,
        anchors: REGION_ANCHORS,
        isPlane: isPlane,
        knownRegion: knownRegion,
        borderBetween: borderBetween,
        neighborsOf: neighborsOf,
        pathBetween: pathBetween,
        journeyMinutes: journeyMinutes,
        journeyEnergy: journeyEnergy,
        shichenText: shichenText,
        currentRegion: currentRegion,
        setOut: setOut,
        renderRoutes: renderRoutes,
        refresh: refresh,
        renderExits: renderExits,
        overlayVisible: overlayVisible,
        setOverlayVisible: setOverlayVisible,
        applyOverlayVisibility: applyOverlayVisibility
    };

    global.WorldMap = api;
    if (global.XianXia) global.XianXia.WorldMap = api;
})(typeof window !== 'undefined' ? window : this);
