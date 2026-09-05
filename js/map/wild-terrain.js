// ==================== wild-terrain.js - 野外地图地形生成器 ====================
// v20.56 野外重做第一块：把「逐格掷骰的随机表格」换成「有结构的真地皮」。
//   · 种子化分形噪声（值噪声 + 多倍频）出高度/湿度/温度三场，按阈值分层成片：
//     水域 / 沼泽 / 雪线 / 山地 / 荒漠 / 林海 / 平原 / 冻土 / 火山 / 灵泉
//   · 多数表决平滑两遍，去掉棋盘噪点，让山脉连成脉、林海连成片
//   · 河流自高处走向低处，山脊成脉、河谷成线
//   · POI 先行：村镇 / 坊市 / 洞府 / 遗迹 / 资源点 / 秘境入口 先落位，再按 POI 反推路网
//   · 古道连 POI，穿水成浅滩；最后做连通性验收，到不了的地标自动挪到能走到的地方
// 纯函数模块：不读 DOM、不依赖加载顺序； landmark / 资源点 / 秘境 由调用方注入。
// 依赖：无（可在 node 单测中直接运行）。

(function (global) {
    'use strict';

    // ============ 地形表 ============
    // moveCost 单位：刻（1 刻 = advanceTime 10 分钟），与旧表同量纲
    // qi：地块灵气系数（相对「普通区域 0.8」的世界基准）
    var TERRAIN = {
        PLAIN:    { name: '平原',   base: '#6f9e42', accent: '#83b551', moveCost: 1,   symbol: '',  passable: true,  qi: 1.0,  kind: 'plain' },
        FOREST:   { name: '林海',   base: '#2f6b34', accent: '#3d8040', moveCost: 2,   symbol: '',  passable: true,  qi: 1.2,  kind: 'forest' },
        MOUNTAIN: { name: '山地',   base: '#7d6a58', accent: '#957f6a', moveCost: 3,   symbol: '',  passable: true,  qi: 1.3,  kind: 'mountain' },
        SNOW:     { name: '雪线',   base: '#d7e0e8', accent: '#eef3f7', moveCost: 3,   symbol: '',  passable: true,  qi: 1.1,  kind: 'snow' },
        FROZEN:   { name: '冻土',   base: '#8ba0ac', accent: '#a3b6c0', moveCost: 2,   symbol: '',  passable: true,  qi: 0.7,  kind: 'frozen' },
        WATER:    { name: '水域',   base: '#2f6f9e', accent: '#4a8ab5', moveCost: 99,  symbol: '',  passable: false, qi: 1.1,  kind: 'water' },
        FORD:     { name: '浅滩',   base: '#5a8aa8', accent: '#7fa8c0', moveCost: 3,   symbol: '',  passable: true,  qi: 1.0,  kind: 'ford' },
        DESERT:   { name: '荒漠',   base: '#d3bb7a', accent: '#e2cd92', moveCost: 2,   symbol: '',  passable: true,  qi: 0.6,  kind: 'desert' },
        SWAMP:    { name: '沼泽',   base: '#4c5f34', accent: '#5d7240', moveCost: 3,   symbol: '',  passable: true,  qi: 0.8,  kind: 'swamp' },
        VOLCANO:  { name: '火山',   base: '#8b3a2c', accent: '#c25a3a', moveCost: 3,   symbol: '',  passable: true,  qi: 1.4,  kind: 'volcano' },
        SPRING:   { name: '灵泉',   base: '#2fb0bd', accent: '#63d3dc', moveCost: 1,   symbol: '',  passable: true,  qi: 2.2,  kind: 'spring' },
        ROAD:     { name: '古道',   base: '#a08a6d', accent: '#b39b7c', moveCost: 0.5, symbol: '',  passable: true,  qi: 0.9,  kind: 'road' },
        // ---- 独有地貌（v20.60）：一地一貌，是「这是哪」的第一眼 ----
        MIASMA:    { name: '瘴沼',   base: '#4a5a2a', accent: '#7a8a3a', moveCost: 3,   symbol: '', passable: true,  qi: 0.5, kind: 'miasma' },
        OASIS:     { name: '绿洲',   base: '#5f9e4a', accent: '#86c46a', moveCost: 1,   symbol: '', passable: true,  qi: 1.8, kind: 'oasis' },
        QUICKSAND: { name: '流沙',   base: '#c9b06a', accent: '#e0cc8c', moveCost: 3,   symbol: '', passable: true,  qi: 0.4, kind: 'quicksand' },
        CREVASSE:  { name: '冰隙',   base: '#b9ccd8', accent: '#e2eef5', moveCost: 99,  symbol: '', passable: false, qi: 0.6, kind: 'crevasse' },
        GLACIER:   { name: '冰川',   base: '#a8c4d4', accent: '#cbdeea', moveCost: 3,   symbol: '', passable: true,  qi: 1.2, kind: 'glacier' },
        SWORDTOMB: { name: '剑冢',   base: '#6a6a74', accent: '#9a9aa6', moveCost: 2,   symbol: '', passable: true,  qi: 1.6, kind: 'swordtomb' },
        OLDFIELD:  { name: '古战场', base: '#7a6a4a', accent: '#967f57', moveCost: 2,   symbol: '', passable: true,  qi: 0.9, kind: 'oldfield' },
        PRIMFOREST:{ name: '荒古林', base: '#22481f', accent: '#2f6329', moveCost: 3,   symbol: '', passable: true,  qi: 1.4, kind: 'primforest' },
        WRECK:     { name: '沉船',   base: '#4a4036', accent: '#7a664e', moveCost: 2,   symbol: '', passable: true,  qi: 1.1, kind: 'wreck' },
        WHIRLPOOL: { name: '漩涡',   base: '#1e4258', accent: '#3f7898', moveCost: 99,  symbol: '', passable: false, qi: 1.0, kind: 'whirlpool' },
        QIPOOL:    { name: '灵池',   base: '#2fa8b8', accent: '#7fe0e8', moveCost: 1,   symbol: '', passable: true,  qi: 2.0, kind: 'qipool' },
        BONEFIELD: { name: '骨原',   base: '#6b6355', accent: '#c9c2b0', moveCost: 2,   symbol: '', passable: true,  qi: 0.4, kind: 'bonefield' }
    };

    // ============ 地区风貌 ============
    // sea/mount：水位与山线阈值偏移（越大水越多/山越多）
    // forest：成林湿度阈值（越低林越多）  cold：降温（越高越冷）
    // arid：湿度偏移（越低越旱）  swamp：沼泽倾向  volcano：火山概率  spring：灵泉数
    // rivers：河数  roads：古道数  tint：渲染色调
    var REGION_PROFILES = {
        '中州':   { sea: -0.04, mount: 0.02, forest: 0.56, cold: 0.0,  arid: 0.0,  swamp: 0.4, volcano: 0,     spring: 2, rivers: 2, roads: 5, tint: '#8fb35a' },
        '东荒':   { sea: 0.02,  mount: 0.04, forest: 0.34, cold: 0.02, arid: 0.02, swamp: 0.5, volcano: 0,     spring: 3, rivers: 3, roads: 4, tint: '#4f9450' },
        '南疆':   { sea: 0.0,   mount: -0.02, forest: 0.42, cold: 0.22, arid: 0.0, swamp: 0.9, volcano: 0.035, spring: 2, rivers: 3, roads: 3, tint: '#b0563c' },
        '西漠':   { sea: -0.10, mount: 0.03, forest: 0.88, cold: 0.10, arid: -0.22, swamp: 0.1, volcano: 0,    spring: 1, rivers: 1, roads: 4, tint: '#d8bd7c' },
        '北冥':   { sea: 0.0,   mount: 0.0,  forest: 0.70, cold: -0.42, arid: 0.0, swamp: 0.1, volcano: 0,     spring: 1, rivers: 2, roads: 3, tint: '#cddbe4' },
        '蜀地':   { sea: -0.02, mount: -0.14, forest: 0.44, cold: 0.04, arid: 0.0, swamp: 0.3, volcano: 0,     spring: 2, rivers: 3, roads: 4, tint: '#8a9a6a' },
        '东南海域': { sea: 0.24, mount: 0.06, forest: 0.40, cold: 0.12, arid: 0.04, swamp: 0.5, volcano: 0,    spring: 3, rivers: 2, roads: 3, tint: '#5aa7c4' },
        // 高位面也该有自己的地皮：灵界清透、魔界赤浊
        '灵界':   { sea: 0.08,  mount: -0.04, forest: 0.36, cold: 0.06, arid: 0.0, swamp: 0.2, volcano: 0,     spring: 5, rivers: 3, roads: 3, tint: '#7fd6d0' },
        '魔界':   { sea: -0.06, mount: -0.06, forest: 0.62, cold: 0.16, arid: -0.04, swamp: 0.8, volcano: 0.05, spring: 1, rivers: 2, roads: 3, tint: '#a2464a' },
        'default': { sea: 0.0,  mount: 0.0,  forest: 0.52, cold: 0.0,  arid: 0.0,  swamp: 0.4, volcano: 0,     spring: 2, rivers: 2, roads: 4, tint: '#8fb35a' }
    };

    // ============ 地物命名素材（按地区风味取用） ============
    var NAME_POOLS = {
        town: ['青溪镇', '落霞集', '白石村', '柳渡口', '云水镇', '枯藤店', '半山驿', '芦花渡', '古井村', '石桥铺'],
        market: ['野坊市', '露水市集', '散修集市', '山货市'],
        cave: ['无名洞府', '枯坐崖', '旧修洞府', '石室遗迹'],
        ruin: ['残破遗迹', '古战场遗址', '塌陷古观', '无名古冢'],
        spring: ['灵泉眼', '洗髓泉'],
        ferry: ['古渡', '野渡', '芦花渡', '青竹渡', '老渡头'],
        prefix: {
            '中州': ['河阳', '洛北', '太虚'], '东荒': ['青木', '苍梧', '临海'],
            '南疆': ['炎堡', '毒瘴', '赤水'], '西漠': ['黄沙', '金城', '佛塔'],
            '北冥': ['冰原', '寒潭', '朔风'], '蜀地': ['剑门', '青城', '蜀冈'],
            '东南海域': ['海角', '鲛人', '渔火'], '灵界': ['仙境', '罡风', '云阶'],
            '魔界': ['九幽', '血漠', '骨原']
        }
    };

    // ============ 种子随机数（Mulberry32） ============
    function hashStringToSeed(str) {
        var hash = 0;
        str = String(str == null ? '' : str);
        for (var i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash) || 1;
    }

    function createSeededRandom(seed) {
        var s = typeof seed === 'number' ? seed : hashStringToSeed(seed);
        return function () {
            s |= 0;
            s = s + 0x6D2B79F5 | 0;
            var t = Math.imul(s ^ s >>> 15, 1 | s);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }

    // ============ 分形值噪声 ============
    // 返回 [0,1) 的连续场：粗格点随机值 + 双线性插值 + 多倍频叠加
    function makeNoise(rng, w, h, baseCells, octaves, persistence) {
        var fields = [];
        var step = Math.max(2, Math.round(Math.max(w, h) / baseCells));
        for (var o = 0; o < octaves; o++) {
            var s = Math.max(2, Math.round(step / Math.pow(2, o)));
            var gw = Math.ceil(w / s) + 3, gh = Math.ceil(h / s) + 3;
            var lat = new Array(gw * gh);
            for (var i = 0; i < lat.length; i++) lat[i] = rng();
            fields.push({ s: s, gw: gw, lat: lat });
        }
        return function (x, y) {
            var amp = 1, sum = 0, norm = 0;
            for (var k = 0; k < fields.length; k++) {
                var f = fields[k];
                var fx = x / f.s, fy = y / f.s;
                var x0 = Math.floor(fx), y0 = Math.floor(fy);
                var tx = fx - x0, ty = fy - y0;
                tx = tx * tx * (3 - 2 * tx);
                ty = ty * ty * (3 - 2 * ty);
                var i00 = y0 * f.gw + x0;
                var v00 = f.lat[i00], v10 = f.lat[i00 + 1];
                var v01 = f.lat[i00 + f.gw], v11 = f.lat[i00 + f.gw + 1];
                var v = (v00 * (1 - tx) + v10 * tx) * (1 - ty) + (v01 * (1 - tx) + v11 * tx) * ty;
                sum += v * amp;
                norm += amp;
                amp *= persistence;
            }
            return norm ? sum / norm : 0;
        };
    }

    function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

    // ============ 地形分类 ============
    function buildFields(rng, rows, cols, prof) {
        var elevN = makeNoise(rng, cols, rows, 4.5, 4, 0.52);
        var moistN = makeNoise(rng, cols, rows, 5.5, 3, 0.55);
        var qiN = makeNoise(rng, cols, rows, 7, 2, 0.5);
        var grid = [];
        var edgeW = Math.max(2, Math.round(Math.min(rows, cols) * 0.12));

        for (var y = 0; y < rows; y++) {
            var row = [];
            for (var x = 0; x < cols; x++) {
                // 边界抬升成山，天然屏障围出这一域
                var dEdge = Math.min(x, y, cols - 1 - x, rows - 1 - y);
                var wall = dEdge < edgeW ? (1 - dEdge / edgeW) : 0;
                var elev = clamp01(elevN(x, y) * 0.92 + wall * 0.30);
                var moist = clamp01(moistN(x, y) + prof.arid);
                var temp = clamp01(0.86 - (y / Math.max(1, rows - 1)) * 0.42 + prof.cold + (rng() * 0.04));

                var t;
                var seaLevel = 0.33 + prof.sea;
                var mountLevel = 0.60 + prof.mount;
                // 雪线恒在山线之上：越冷越低（贴着山线），越热越高（雪只留峰顶）
                var snowLine = mountLevel + 0.13 + (temp - 0.5) * 0.25;

                if (elev < seaLevel) t = 'WATER';
                else if (elev < seaLevel + 0.05 && moist > 0.60 && prof.swamp > 0.2) t = 'SWAMP';
                else if (elev > snowLine) t = 'SNOW';
                else if (elev > mountLevel) t = (prof.volcano > 0 && rng() < prof.volcano) ? 'VOLCANO' : 'MOUNTAIN';
                else if (moist < 0.30 && temp > 0.60) t = 'DESERT';
                else if (temp < 0.30) t = 'FROZEN';
                else if (moist > prof.forest) t = 'FOREST';
                else t = 'PLAIN';

                row.push({
                    t: t,
                    e: Math.round(elev * 100) / 100,
                    m: Math.round(moist * 100) / 100,
                    q: Math.round(clamp01(qiN(x, y)) * 100) / 100,
                    d: Math.floor(rng() * 1000)   // 渲染装饰用的逐格变体
                });
            }
            grid.push(row);
        }
        return grid;
    }

    // ============ 多数表决平滑：消棋盘噪点，让地形成片 ============
    function smooth(grid, passes) {
        var rows = grid.length, cols = grid[0].length;
        var kinds = Object.keys(TERRAIN);
        for (var p = 0; p < passes; p++) {
            var flips = [];
            for (var y = 0; y < rows; y++) {
                for (var x = 0; x < cols; x++) {
                    var counts = {};
                    var total = 0;
                    for (var dy = -1; dy <= 1; dy++) {
                        for (var dx = -1; dx <= 1; dx++) {
                            if (!dy && !dx) continue;
                            var ny = y + dy, nx = x + dx;
                            if (ny < 0 || ny >= rows || nx < 0 || nx >= cols) continue;
                            var k = grid[ny][nx].t;
                            counts[k] = (counts[k] || 0) + 1;
                            total++;
                        }
                    }
                    var best = null, bestN = 0;
                    for (var kk in counts) if (counts[kk] > bestN) { best = kk; bestN = counts[kk]; }
                    // 与 7 个以上邻居都不同 → 孤子，归入多数
                    if (best && grid[y][x].t !== best && bestN >= total - 1) flips.push([y, x, best]);
                }
            }
            for (var i = 0; i < flips.length; i++) grid[flips[i][0]][flips[i][1]].t = flips[i][2];
            if (!flips.length) break;
        }
        return grid;
    }

    // ============ 灵泉：灵气场峰值处涌出 ============
    function carveSprings(grid, rng, count) {
        var rows = grid.length, cols = grid[0].length;
        var cand = [];
        for (var y = 1; y < rows - 1; y++) {
            for (var x = 1; x < cols - 1; x++) {
                var c = grid[y][x];
                if (c.t === 'WATER' || c.t === 'SNOW') continue;
                cand.push(c);
            }
        }
        cand.sort(function (a, b) { return b.q - a.q; });
        var made = 0;
        for (var i = 0; i < cand.length && made < count; i++) {
            if (cand[i].t === 'SPRING') continue;
            cand[i].t = 'SPRING';
            made++;
        }
        return grid;
    }

    // ============ 河流：自高处下行，遇水而止 ============
    function carveRivers(grid, rng, count) {
        var rows = grid.length, cols = grid[0].length;
        var springs = [];
        for (var i = 0; i < count; i++) {
            var best = null;
            for (var trY = 0; trY < 40; trY++) {
                var y = 1 + Math.floor(rng() * (rows - 2));
                var x = 1 + Math.floor(rng() * (cols - 2));
                var c = grid[y][x];
                if (c.t === 'WATER' || c.t === 'SPRING') continue;
                if (c.e < 0.55) continue;
                if (!best || c.e > best.e) best = { x: x, y: y, e: c.e };
            }
            if (best) springs.push(best);
        }

        springs.forEach(function (src) {
            var cx = src.x, cy = src.y;
            for (var step = 0; step < 220; step++) {
                var cell = grid[cy] && grid[cy][cx];
                if (!cell) break;
                if (cell.t === 'WATER') break;
                if (cell.t !== 'SPRING') cell.t = 'WATER';
                // 找最低的邻格下行（加入少量随机避免直线）
                var lowest = null;
                for (var dy = -1; dy <= 1; dy++) {
                    for (var dx = -1; dx <= 1; dx++) {
                        if (!dy && !dx) continue;
                        var ny = cy + dy, nx = cx + dx;
                        var n = grid[ny] && grid[ny][nx];
                        if (!n) continue;
                        var score = n.e + rng() * 0.06;
                        if (!lowest || score < lowest.score) lowest = { x: nx, y: ny, score: score, t: n.t };
                    }
                }
                if (!lowest) break;
                cx = lowest.x; cy = lowest.y;
            }
        });
        return grid;
    }

    // ============ 独有地貌（v20.60） ============
    // 一地一貌：南疆的瘴沼、西漠的流沙绿洲、北冥的冰川冰隙、蜀地的剑冢、
    // 东海的沉船漩涡…… 换一张图，第一眼就该知道「这是哪」。
    //   n: 成几处   size: 每处多少格   where: 长在什么样的地方
    var SIGNATURE_LANDFORMS = {
        '南疆':   [{ t: 'MIASMA', n: [1, 2], size: [4, 10], where: 'wet' }],
        '西漠':   [{ t: 'OASIS', n: [1, 2], size: [2, 5], where: 'arid' }, { t: 'QUICKSAND', n: [1, 2], size: [4, 9], where: 'arid' }],
        '北冥':   [{ t: 'GLACIER', n: [1, 2], size: [5, 12], where: 'cold' }, { t: 'CREVASSE', n: [1, 3], size: [2, 5], where: 'cold' }],
        '蜀地':   [{ t: 'SWORDTOMB', n: [1, 1], size: [3, 6], where: 'high' }],
        '中州':   [{ t: 'OLDFIELD', n: [1, 1], size: [4, 8], where: 'plain' }],
        '东荒':   [{ t: 'PRIMFOREST', n: [1, 2], size: [5, 10], where: 'forest' }],
        '东南海域': [{ t: 'WRECK', n: [1, 2], size: [1, 2], where: 'water' }, { t: 'WHIRLPOOL', n: [1, 2], size: [1, 1], where: 'water' }],
        '灵界':   [{ t: 'QIPOOL', n: [1, 2], size: [2, 4], where: 'any' }],
        '魔界':   [{ t: 'BONEFIELD', n: [1, 2], size: [4, 8], where: 'any' }]
    };

    // where 的安土：只在合适的地方扎根，瘴沼不长在雪线上
    function landformSuitable(grid, x, y, where) {
        var cell = grid[y][x];
        var rows = grid.length, cols = grid[0].length;
        var dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
        function near(t) {
            return dirs.some(function (d) {
                var n = grid[y + d[1]] && grid[y + d[1]][x + d[0]];
                return n && n.t === t;
            });
        }
        switch (where) {
            case 'wet': return cell.t === 'SWAMP' || cell.m > 0.62 || near('WATER');
            case 'arid': return cell.t === 'DESERT' || cell.m < 0.34;
            case 'cold': return cell.t === 'SNOW' || cell.t === 'FROZEN';
            case 'high': return cell.t === 'MOUNTAIN' || cell.t === 'VOLCANO' || near('MOUNTAIN');
            case 'plain': return cell.t === 'PLAIN';
            case 'forest': return cell.t === 'FOREST';
            case 'water': return cell.t === 'WATER';
            default: return true;
        }
    }

    // 从种子格向外长一小片
    function growBlob(grid, rng, sx, sy, target, size, where) {
        var rows = grid.length, cols = grid[0].length;
        var frontier = [{ x: sx, y: sy }], made = 0, guard = 0;
        while (frontier.length && made < size && guard++ < 200) {
            var idx = Math.floor(rng() * frontier.length);
            var cur = frontier.splice(idx, 1)[0];
            var cell = grid[cur.y] && grid[cur.y][cur.x];
            if (!cell) continue;
            if (cell.t !== target && !landformSuitable(grid, cur.x, cur.y, where)) continue;
            if (cell.t !== target) cell.t = target;
            made++;
            var dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
            dirs.forEach(function (d) {
                var nx = cur.x + d[0], ny = cur.y + d[1];
                if (nx < 1 || ny < 1 || nx >= cols - 1 || ny >= rows - 1) return;
                frontier.push({ x: nx, y: ny });
            });
        }
        return made;
    }

    function carveSignatures(grid, rng, region) {
        var specs = SIGNATURE_LANDFORMS[region];
        if (!specs) return grid;
        var rows = grid.length, cols = grid[0].length;
        specs.forEach(function (spec) {
            var count = spec.n[0] + Math.floor(rng() * (spec.n[1] - spec.n[0] + 1));
            for (var i = 0; i < count; i++) {
                var size = spec.size[0] + Math.floor(rng() * (spec.size[1] - spec.size[0] + 1));
                for (var trY = 0; trY < 60; trY++) {
                    var x = 1 + Math.floor(rng() * (cols - 2));
                    var y = 1 + Math.floor(rng() * (rows - 2));
                    if (!landformSuitable(grid, x, y, spec.where)) continue;
                    growBlob(grid, rng, x, y, spec.t, size, spec.where);
                    break;
                }
            }
        });
        return grid;
    }

    // ============ POI 清单 ============
    function pickName(rng, pool, used) {
        for (var i = 0; i < 20; i++) {
            var n = pool[Math.floor(rng() * pool.length)];
            if (!used[n]) { used[n] = true; return n; }
        }
        return pool[0] + '·' + Math.floor(rng() * 90 + 10);
    }

    function buildPoiWishlist(rng, region, injected) {
        var used = {};
        var prof = REGION_PROFILES[region] || REGION_PROFILES['default'];
        var pre = (NAME_POOLS.prefix[region] || ['野'])[Math.floor(rng() * (NAME_POOLS.prefix[region] || ['野']).length)];
        var list = [];

        // 村镇 1~2：落脚、打尖、补给
        list.push({ type: 'town', name: pickName(rng, NAME_POOLS.town, used), icon: '🏘️', prefer: ['PLAIN', 'ROAD'], label: '村镇' });
        if (rng() < 0.6) list.push({ type: 'town', name: pre + pickName(rng, NAME_POOLS.town, used), icon: '🏘️', prefer: ['PLAIN'], label: '村镇' });

        // 坊市 1：野市，交易
        list.push({ type: 'market', name: pre + pickName(rng, NAME_POOLS.market, used), icon: '🏪', prefer: ['PLAIN', 'ROAD'], label: '坊市' });

        // 洞府 1：闭关修炼
        list.push({ type: 'cave', name: pickName(rng, NAME_POOLS.cave, used), icon: '🕳️', prefer: ['MOUNTAIN', 'FOREST'], label: '洞府' });

        // 遗迹 1~2：本地区有名地标优先（来自图鉴表），凑不满用无名遗迹
        var named = (injected.landmarks || []).slice(0, 2);
        named.forEach(function (lm) {
            list.push({ type: 'landmark', name: lm.name, refId: lm.id, icon: lm.icon || '🗡️', prefer: lm.prefer || ['MOUNTAIN', 'FOREST'], label: '地标' });
        });
        list.push({ type: 'ruin', name: pickName(rng, NAME_POOLS.ruin, used), icon: '🏛️', prefer: ['MOUNTAIN', 'DESERT', 'SWAMP', 'FROZEN'], label: '遗迹' });
        if (rng() < 0.5) list.push({ type: 'ruin', name: pre + pickName(rng, NAME_POOLS.ruin, used), icon: '🏛️', prefer: ['DESERT', 'MOUNTAIN'], label: '遗迹' });

        // 灵泉 POI：涌出的那口泉眼可炼化
        if (prof.spring > 0) list.push({ type: 'spring', name: pickName(rng, NAME_POOLS.spring, used), icon: '⛲', prefer: ['SPRING', 'FOREST', 'PLAIN'], label: '灵泉' });

        // 渡口（v20.59）：临水而设，可行舟往来。海区两处成渡网，内河一处
        var ferryCount = prof.sea > 0.1 ? 2 : (prof.rivers > 0 ? 1 : 0);
        for (var fi = 0; fi < ferryCount; fi++) {
            list.push({ type: 'ferry', name: pre + pickName(rng, NAME_POOLS.ferry, used), icon: '⛴️', prefer: ['PLAIN', 'ROAD', 'FORD'], label: '渡口', waterside: true });
        };

        // 真实资源点（灵脉/矿脉/药园）
        (injected.resources || []).slice(0, 3).forEach(function (rp) {
            var prefer = rp.type === 'mine' ? ['MOUNTAIN', 'DESERT'] : rp.type === 'herb_garden' ? ['FOREST', 'SWAMP'] : ['MOUNTAIN', 'SPRING'];
            list.push({ type: 'resource', name: rp.name, refId: rp.id, icon: rp.type === 'mine' ? '⛏️' : rp.type === 'herb_garden' ? '🌿' : '💎', prefer: prefer, label: '资源点' });
        });

        // 秘境入口（每日生成的动态秘境）
        (injected.dungeons || []).slice(0, 1).forEach(function (dg) {
            list.push({ type: 'dungeon', name: dg.name || '秘境', refId: dg.id, icon: '🌀', prefer: ['MOUNTAIN', 'FOREST', 'SWAMP', 'VOLCANO'], label: '秘境' });
        });

        return list;
    }

    // ============ 可通行判定 ============
    function passable(cell) {
        return !!(cell && TERRAIN[cell.t] && TERRAIN[cell.t].passable);
    }

    // ============ 从起点洪泛，得可达集合 ============
    function floodFill(grid, start) {
        var rows = grid.length, cols = grid[0].length;
        var seen = {};
        var queue = [start];
        seen[start.y * cols + start.x] = true;
        var count = 0;
        while (queue.length) {
            var cur = queue.shift();
            count++;
            var dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
            for (var i = 0; i < 4; i++) {
                var nx = cur.x + dirs[i][0], ny = cur.y + dirs[i][1];
                if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
                var key = ny * cols + nx;
                if (seen[key]) continue;
                if (!passable(grid[ny][nx])) continue;
                seen[key] = true;
                queue.push({ x: nx, y: ny });
            }
        }
        return { seen: seen, count: count };
    }

    // ============ 最大连通陆块 ============
    // 群岛海域里，主角落脚点必须在主陆上，否则地标全在对面
    function largestComponent(grid) {
        var rows = grid.length, cols = grid[0].length;
        var visited = {}, best = null;
        for (var sy = 0; sy < rows; sy++) {
            for (var sx = 0; sx < cols; sx++) {
                var k0 = sy * cols + sx;
                if (visited[k0] || !passable(grid[sy][sx])) continue;
                var seen = {}, queue = [{ x: sx, y: sy }];
                seen[k0] = true;
                var count = 0, sumX = 0, sumY = 0;
                while (queue.length) {
                    var cur = queue.shift();
                    count++; sumX += cur.x; sumY += cur.y;
                    var dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
                    for (var i = 0; i < 4; i++) {
                        var nx = cur.x + dirs[i][0], ny = cur.y + dirs[i][1];
                        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
                        var key = ny * cols + nx;
                        if (seen[key] || !passable(grid[ny][nx])) continue;
                        seen[key] = true;
                        queue.push({ x: nx, y: ny });
                    }
                }
                if (!best || count > best.count) {
                    best = { seen: seen, count: count, cx: Math.round(sumX / count), cy: Math.round(sumY / count) };
                }
            }
        }
        return best || { seen: {}, count: 0, cx: 0, cy: 0 };
    }

    // ============ 跨海礁路 ============
    // 群岛不连主陆就是一片废地：把成块的孤岛用浅滩牵回主陆
    function bridgeIslands(grid, rng) {
        var rows = grid.length, cols = grid[0].length;
        var label = new Array(rows * cols).fill(-1);
        var comps = [];
        for (var sy = 0; sy < rows; sy++) {
            for (var sx = 0; sx < cols; sx++) {
                var k0 = sy * cols + sx;
                if (label[k0] >= 0 || !passable(grid[sy][sx])) continue;
                var id = comps.length;
                var cells = [], queue = [{ x: sx, y: sy }];
                label[k0] = id;
                while (queue.length) {
                    var cur = queue.shift();
                    cells.push(cur);
                    var dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
                    for (var i = 0; i < 4; i++) {
                        var nx = cur.x + dirs[i][0], ny = cur.y + dirs[i][1];
                        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
                        var key = ny * cols + nx;
                        if (label[key] >= 0 || !passable(grid[ny][nx])) continue;
                        label[key] = id;
                        queue.push({ x: nx, y: ny });
                    }
                }
                comps.push({ id: id, cells: cells, size: cells.length });
            }
        }
        if (comps.length < 2) return grid;
        comps.sort(function (a, b) { return b.size - a.size; });
        var mainId = comps[0].id;
        var bridges = 0;

        comps.slice(1).forEach(function (comp) {
            if (comp.size < 6 || bridges >= 6) return;
            var mainCells = comps[0].cells;
            var bestA = null, bestB = null, bestD = 1e9;
            for (var i = 0; i < comp.cells.length; i += Math.max(1, Math.floor(comp.cells.length / 12))) {
                for (var j = 0; j < mainCells.length; j += Math.max(1, Math.floor(mainCells.length / 24))) {
                    var a = comp.cells[i], b = mainCells[j];
                    var d = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
                    if (d < bestD) { bestD = d; bestA = a; bestB = b; }
                }
            }
            if (!bestA || !bestB || bestD > 14) return;
            // 沿直线铺礁路：过水成浅滩
            var x = bestA.x, y = bestA.y, guard = 0;
            while ((x !== bestB.x || y !== bestB.y) && guard++ < 60) {
                if (Math.abs(bestB.x - x) > Math.abs(bestB.y - y)) x += Math.sign(bestB.x - x);
                else y += Math.sign(bestB.y - y);
                var cell = grid[y] && grid[y][x];
                if (!cell) break;
                if (!passable(cell)) cell.t = 'FORD';
            }
            bridges++;
            // 并入主陆，后续孤岛可以借这条路
            comps[0].cells = comps[0].cells.concat(comp.cells);
            mainId = comps[0].id;
        });
        return grid;
    }

    // ============ POI 落位 ============
    // 只落主陆：地标放到孤岛上，玩家永远到不了
    function placePois(grid, rng, wishlist, mainMass) {
        var rows = grid.length, cols = grid[0].length;
        var pois = [];
        var usedCells = {};

        function farEnough(x, y) {
            for (var i = 0; i < pois.length; i++) {
                if (Math.abs(pois[i].x - x) + Math.abs(pois[i].y - y) < 4) return false;
            }
            return true;
        }

        // 渡口的立身之本：脚边得有水，不然摆什么渡
        function nearWater(x, y) {
            var dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
            for (var i = 0; i < dirs.length; i++) {
                var n = grid[y + dirs[i][1]] && grid[y + dirs[i][1]][x + dirs[i][0]];
                if (n && n.t === 'WATER') return true;
            }
            return false;
        }

        wishlist.forEach(function (wish, idx) {
            var placed = null;
            // 前段只挑地形合意的主陆格；后段放宽地形偏好，但绝不放宽可达性与渡口的临水
            for (var trY = 0; trY < 140 && !placed; trY++) {
                var x = 1 + Math.floor(rng() * (cols - 2));
                var y = 1 + Math.floor(rng() * (rows - 2));
                var cell = grid[y][x];
                if (!passable(cell)) continue;
                if (!mainMass.seen[y * cols + x]) continue;
                if (usedCells[y * cols + x]) continue;
                if (!farEnough(x, y)) continue;
                if (wish.waterside && !nearWater(x, y)) continue;
                if (trY < 90 && wish.prefer.indexOf(cell.t) < 0) continue;
                placed = { x: x, y: y };
            }
            if (!placed) return;
            usedCells[placed.y * cols + placed.x] = true;
            pois.push({
                id: wish.type + '_' + idx,
                type: wish.type,
                name: wish.name,
                refId: wish.refId || null,
                icon: wish.icon,
                label: wish.label,
                x: placed.x,
                y: placed.y,
                discovered: false
            });
        });

        return pois;
    }

    // ============ 古道：连起点与各地标，穿水成浅滩 ============
    function carveRoads(grid, pois, start, rng, maxRoads) {
        function carvePath(a, b) {
            var x = a.x, y = a.y;
            var guard = 0;
            while ((x !== b.x || y !== b.y) && guard++ < 400) {
                var dx = Math.sign(b.x - x), dy = Math.sign(b.y - y);
                if (dx && dy && rng() < 0.5) dx = 0;
                x += dx; y += dy;
                var cell = grid[y] && grid[y][x];
                if (!cell) break;
                if (cell.t === 'WATER') cell.t = 'FORD';
                else if (cell.t !== 'SPRING' && cell.t !== 'FORD') cell.t = 'ROAD';
            }
        }

        var anchor = pois.slice(0, maxRoads);
        // 洞府是闭关要地，路再多修一条也要通到
        var cave = pois.filter(function (p) { return p.type === 'cave'; })[0];
        if (cave && anchor.indexOf(cave) < 0) anchor.push(cave);
        // 渡口是水陆门户，也得有道能到
        pois.filter(function (p) { return p.type === 'ferry'; }).slice(0, 2).forEach(function (f) {
            if (anchor.indexOf(f) < 0) anchor.push(f);
        });
        anchor.forEach(function (p, i) {
            var from = i === 0 ? start : anchor[i - 1];
            carvePath(from, p);
        });
        return grid;
    }

    // ============ 寻路（Dijkstra，按地形耗时加权） ============
    function findPath(grid, from, to) {
        var rows = grid.length, cols = grid[0].length;
        if (!grid[to.y] || !grid[to.y][to.x] || !passable(grid[to.y][to.x])) return null;
        var dist = {}, prev = {}, visited = {};
        var key = function (x, y) { return y * cols + x; };
        dist[key(from.x, from.y)] = 0;
        var open = [{ x: from.x, y: from.y, c: 0 }];
        var dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];

        while (open.length) {
            // 小图直接线性取最小，省一个堆
            var bi = 0;
            for (var i = 1; i < open.length; i++) if (open[i].c < open[bi].c) bi = i;
            var cur = open.splice(bi, 1)[0];
            var ck = key(cur.x, cur.y);
            if (visited[ck]) continue;
            visited[ck] = true;
            if (cur.x === to.x && cur.y === to.y) break;
            for (var d = 0; d < 4; d++) {
                var nx = cur.x + dirs[d][0], ny = cur.y + dirs[d][1];
                if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
                if (!passable(grid[ny][nx])) continue;
                var nk = key(nx, ny);
                if (visited[nk]) continue;
                var nd = cur.c + (TERRAIN[grid[ny][nx].t].moveCost || 1);
                if (dist[nk] === undefined || nd < dist[nk]) {
                    dist[nk] = nd;
                    prev[nk] = ck;
                    open.push({ x: nx, y: ny, c: nd });
                }
            }
        }
        if (dist[key(to.x, to.y)] === undefined) return null;
        var path = [];
        var k = key(to.x, to.y);
        while (k !== undefined && k !== key(from.x, from.y)) {
            path.unshift({ x: k % cols, y: Math.floor(k / cols) });
            k = prev[k];
        }
        return { path: path, cost: Math.round(dist[key(to.x, to.y)] * 10) / 10 };
    }

    // ============ 主入口：生成一张地区野外图 ============
    // opts: { seed, region, rows, cols, landmarks, resources, dungeons }
    function generate(opts) {
        opts = opts || {};
        var rows = opts.rows || 20, cols = opts.cols || 26;
        var region = opts.region || '中州';
        var prof = REGION_PROFILES[region] || REGION_PROFILES['default'];
        var seedStr = String(opts.seed == null ? '仙路长青' : opts.seed);
        var injected = {
            landmarks: opts.landmarks || [],
            resources: opts.resources || [],
            dungeons: opts.dungeons || []
        };

        var best = null, bestScore = -1;
        for (var salt = 0; salt < 8; salt++) {
            var rng = createSeededRandom(seedStr + '|' + region + '|' + salt);
            var grid = buildFields(rng, rows, cols, prof);
            smooth(grid, 2);
            carveSprings(grid, rng, prof.spring);
            carveRivers(grid, rng, prof.rivers);
            // 独有地貌在成陆之后、连通验收之前落笔——冰隙漩涡会切断地皮，
            // 后面的主陆验收自会把不合格的切面刷掉
            carveSignatures(grid, rng, region);
            bridgeIslands(grid, rng);

            // 主陆先行：起点落在最大陆块最靠中心处，地标只在主陆上落
            var main = largestComponent(grid);
            if (main.count < rows * cols * (salt < 6 ? 0.40 : 0.25)) continue;   // 碎成孤岛的不算数，换个切面
            var start = { x: main.cx, y: main.cy };
            // 质心可能恰好落在水面上，就近挪到主陆上
            if (!passable(grid[start.y][start.x])) {
                var bestD = 1e9;
                for (var sy2 = 0; sy2 < rows; sy2++) {
                    for (var sx2 = 0; sx2 < cols; sx2++) {
                        if (!main.seen[sy2 * cols + sx2]) continue;
                        var dd = Math.abs(sx2 - main.cx) + Math.abs(sy2 - main.cy);
                        if (dd < bestD) { bestD = dd; start = { x: sx2, y: sy2 }; }
                    }
                }
            }
            for (var dy = -1; dy <= 1; dy++) {
                for (var dx = -1; dx <= 1; dx++) {
                    var ny = start.y + dy, nx = start.x + dx;
                    if (grid[ny] && grid[ny][nx] && grid[ny][nx].t !== 'WATER') grid[ny][nx].t = 'PLAIN';
                }
            }

            var wish = buildPoiWishlist(rng, region, injected);
            var pois = placePois(grid, rng, wish, main);
            carveRoads(grid, pois, start, rng, prof.roads);
            // 修路只会添浅滩、只会更通，重算一次做最终验收
            var reach = floodFill(grid, start);

            var passableCount = 0;
            for (var y = 0; y < rows; y++) {
                for (var x = 0; x < cols; x++) {
                    if (passable(grid[y][x])) passableCount++;
                }
            }

            // 验收：地标全部可达 + 绝大多数可走之地连成一片
            var allReach = pois.length > 0 && pois.every(function (p) { return reach.seen[p.y * cols + p.x]; });
            var cohesion = passableCount ? reach.count / passableCount : 0;
            var ok = allReach && cohesion >= 0.8;
            var score = cohesion * 1000 + pois.length;
            if (score > bestScore) {
                bestScore = score;
                best = { grid: grid, pois: pois, start: start, ok: ok, stats: { passable: passableCount, reachable: reach.count, salt: salt } };
            }
            if (ok) break;
        }
        return best;
    }

    var api = {
        TERRAIN: TERRAIN,
        REGION_PROFILES: REGION_PROFILES,
        createSeededRandom: createSeededRandom,
        hashStringToSeed: hashStringToSeed,
        generate: generate,
        findPath: findPath,
        passable: passable,
        floodFill: floodFill
    };

    global.WildTerrain = api;
    if (global.XianXia) global.XianXia.WildTerrain = api;
})(typeof window !== 'undefined' ? window : this);
