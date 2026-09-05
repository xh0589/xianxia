// ==================== world-map.js - 天下疆界（v20.63） ====================
// 九张地区野外图此前彼此不认识：列表里点哪张就开哪张，跑图跑不出「天下」的感觉。
// 这里把九州拼回一块大陆：谁与谁接壤、走哪道关隘、隔多少里、路上会出什么事。
// 位面（灵界/魔界）不入疆界——寻常脚力到不了，只走位面之门（map/high-planes.js）。
// 纯数据 + 结账 + 上图；不读存档、不改城池归属（人在野外跨境，只挪脚下那片山河）。

(function (global) {
    'use strict';

    // ============ 疆界：谁与谁接壤 ============
    // li：两地关隘之间的里数（进城赶路用的旧里表也以 60 里≈两个时辰折算，这里同一把尺）
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
    // time：多花的时辰（负数是省下的）  hp/energy：掉的血与力气  stones：破财  gain：捡着的好物
    var BORDER_INCIDENTS = {
        pass: [
            { text: '关卒盘查行囊，磨了半个时辰。', time: 30, energy: 4 },
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
            { text: '桥面湿滑，走得比寻常慢了半个时辰。', time: 30, energy: 3 }
        ],
        sea: [
            { text: '半途起了风浪，船身颠得人站不稳。', hp: 4, energy: 6 },
            { text: '夜里渔火引路，省了大半行程。', time: -40 },
            { text: '海雾里迷了方向，多漂了一个时辰。', time: 60, energy: 6 }
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

    // ============ 人此刻在哪一州 ============
    // 野外图开着，人就站在那片山河里；回城落脚了，就看那座城归哪一州
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
        if (inWild && global.currentRegionForMap && global.currentMap && global.currentMap.length) {
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
        if (!from) {
            // 不知身在何方：照旧直开，别把人锁在野外门外
            if (typeof global.openWildernessMap === 'function') global.openWildernessMap(target);
            return true;
        }
        if (isPlane(target)) { say('「' + target + '」不是脚力能到的地方，得寻位面之门。', 'info'); return false; }
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

        say('🧭 出' + from + '，走' + border.route + '（' + border.li + ' 里 · 约两个时辰十里）……' + border.blurb, 'info');
        if (inc) say('⛰️ ' + incidentText(inc), inc.gain ? 'success' : 'warning');
        say('🗺️ 出了' + border.route + '，脚下已是' + target + '地界。', 'success');

        if (typeof global.openWildernessMap === 'function') global.openWildernessMap(target);
        return true;
    }

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
            svg.appendChild(g);
        });

        // 位面不在九州之列，图上只留一句话
        var planeNote = svgEl(doc, 'text', { x: 690, y: 26, 'font-size': 9, fill: '#7fd6d0', opacity: 0.7, 'text-anchor': 'middle' });
        planeNote.textContent = '位面之上 · 灵界（须走位面之门）';
        svg.appendChild(planeNote);
        var abyssNote = svgEl(doc, 'text', { x: 110, y: 585, 'font-size': 9, fill: '#a2464a', opacity: 0.7, 'text-anchor': 'middle' });
        abyssNote.textContent = '位面之下 · 魔界（须走位面之门）';
        svg.appendChild(abyssNote);

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
        var t = svgEl(doc, 'text', { x: a.x, y: a.y - 18, 'font-size': 10, 'text-anchor': 'middle', fill: '#fbbf24', 'font-weight': 'bold' });
        t.textContent = '你在此';
        g.appendChild(t);
        svg.appendChild(g);
    }

    // 重画「你在此」（换了州就要挪窝）；路只画一遍
    function refresh(svgId) {
        var doc = global.document;
        if (!doc) return;
        var svg = doc.getElementById(svgId || 'world-map');
        if (!svg) return;
        renderRoutes(svgId);
        drawHereMarker(doc, svg);
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
        currentRegion: currentRegion,
        setOut: setOut,
        renderRoutes: renderRoutes,
        refresh: refresh,
        renderExits: renderExits
    };

    global.WorldMap = api;
    if (global.XianXia) global.XianXia.WorldMap = api;
})(typeof window !== 'undefined' ? window : this);
