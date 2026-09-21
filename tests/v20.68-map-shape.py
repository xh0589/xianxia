#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""v20.68-map-shape.py — 舆图大陆几何校验（防穿模回归门禁）

七州改用共享边界曲线后，用真实几何断言：
  S1 19 座城市、36 个门派标记，圆心必须落在自己声称的州界内、且不在任何别的州里
  S2 world-map.js REGION_ANCHORS 的 7 个「你在此」锚点必须落在本州界内
  S3 全图网格扫描：任何一个采样点不得同时落在两个州里（穿模 = 双重归属）
  S4 哨兵：舆图内不再有 polygon（全部为曲线路径）；东南海域诸岛存在

运行：python3 tests/v20.68-map-shape.py
"""
import io, re, sys, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
html = io.open(os.path.join(ROOT, '仙侠.html'), encoding='utf-8').read()

passed = 0
failed = 0
def ok(cond, msg):
    global passed, failed
    if cond:
        passed += 1
    else:
        failed += 1
        print('[FAIL] ' + msg)

# ---------- 抽 SVG 块 ----------
i0 = html.index('<svg viewBox="0 0 800 600" class="w-full" id="world-map">')
i1 = html.index('</svg>', i0)
blk = html[i0:i1]

# ---------- 路径展平 ----------
def parse_d(d):
    """解析 M/L/C/Z 路径 → 多边形点列（三次贝塞尔按 24 段展平）"""
    toks = re.findall(r'[MLCZ]|-?\d+\.?\d*', d)
    pts, cur, start = [], (0.0, 0.0), (0.0, 0.0)
    i = 0
    while i < len(toks):
        t = toks[i]
        if t == 'M':
            cur = start = (float(toks[i+1]), float(toks[i+2])); i += 3
        elif t == 'L':
            cur = (float(toks[i+1]), float(toks[i+2])); pts.append(cur); i += 3
        elif t == 'C':
            p3 = (float(toks[i+5]), float(toks[i+6]))
            p1 = (float(toks[i+1]), float(toks[i+2])); p2 = (float(toks[i+3]), float(toks[i+4]))
            for k in range(1, 25):
                u = k / 24.0; w = 1 - u
                x = w**3*cur[0] + 3*w*w*u*p1[0] + 3*w*u*u*p2[0] + u**3*p3[0]
                y = w**3*cur[1] + 3*w*w*u*p1[1] + 3*w*u*u*p2[1] + u**3*p3[1]
                pts.append((x, y))
            cur = p3; i += 7
        elif t == 'Z':
            pts.append(start); i += 1
        else:
            i += 1
    return pts

def inside(pt, poly):
    x, y = pt; n = len(poly); hit = False
    j = n - 1
    for i in range(n):
        xi, yi = poly[i]; xj, yj = poly[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi + 1e-12) + xi:
            hit = not hit
        j = i
    return hit

# ---------- 七州路径 ----------
provs = {}
for m in re.finditer(r'<path class="map-province" id="(prov-[a-z]+)" d="([^"]+)"[^>]*data-province="([^"]+)"', blk):
    provs[m.group(3)] = parse_d(m.group(2))
ok(len(provs) == 7, f'应有7州路径，实到{len(provs)}')

def which_regions(pt):
    return [name for name, poly in provs.items() if inside(pt, poly)]

# ---------- S1 城市与门派落界 ----------
print('\n[S1] 城市/门派落界')
cities = re.findall(r'<g class="map-city" onclick="selectCity\(\'([^\']+)\', \'([^\']+)\'\)">\s*<circle cx="(\d+)" cy="(\d+)"', blk)
ok(len(cities) == 19, f'城市标记应19个，实到{len(cities)}')
for name, prov, cx, cy in cities:
    pt = (float(cx), float(cy))
    regs = which_regions(pt)
    ok(prov in regs, f'城市「{name}」({cx},{cy}) 应落在{prov}界内，实测：{regs or ["界外(海里)"]}')
    ok(all(r == prov for r in regs), f'城市「{name}」({cx},{cy}) 不应同时落进别州：{regs}')

sects = re.findall(r'<g class="map-sect" onclick="selectSect\(\'([^\']+)\'\)[^>]*><circle cx="(\d+)" cy="(\d+)"', blk)
ok(len(sects) == 36, f'门派标记应36个，实到{len(sects)}')
# 门派 → 所在州（v10.0 地区分配表）
SECT_REGION = {}
for r, names in {
    '中州': ['少林寺','嵩山派','大旗门','恒山派','全真教','华山派','武当派','侠隐阁','天涯海阁'],
    '东荒': ['泰山派','药王谷','神机门','霹雳堂','茅山派','大隐阁','天书阁','蓬莱派'],
    '南疆': ['衡山派','丐帮','铁掌帮','百花谷','五仙教','修罗宫','阎罗殿'],
    '西漠': ['昆仑派','金刚宗','天龙教','烈日教'],
    '北冥': ['天山派','逍遥派','血手门'],
    '蜀地': ['青城派','峨眉派','唐门'],
    '东南海域': ['铸剑山庄','飞蝎坞'],
}.items():
    for n in names:
        SECT_REGION[n] = r
for name, cx, cy in sects:
    prov = SECT_REGION.get(name)
    if not prov:
        ok(False, f'门派「{name}」找不到所属州注释段'); continue
    pt = (float(cx), float(cy))
    regs = which_regions(pt)
    # 东南海域门派允许落在岛链水面（陆架路径内即可）
    ok(prov in regs, f'门派「{name}」({cx},{cy}) 应落在{prov}界内，实测：{regs or ["界外"]}')
    ok(all(r == prov for r in regs), f'门派「{name}」({cx},{cy}) 不应同时落进别州：{regs}')

# ---------- S2 「你在此」锚点落界（与 world-map.js REGION_ANCHORS 同步） ----------
print('\n[S2] 锚点落界')
wm = io.open(os.path.join(ROOT, 'js/map/world-map.js'), encoding='utf-8').read()
anch_blk = wm[wm.index('REGION_ANCHORS'):wm.index('};', wm.index('REGION_ANCHORS'))]
anchors = {m[0]: (m[1], m[2]) for m in re.findall(r"'([^']+)': \{ x: (\d+), y: (\d+) \}", anch_blk)}
ok(len(anchors) == 7, f'REGION_ANCHORS 应7个，实到{len(anchors)}')
for name, (ax, ay) in anchors.items():
    pt = (float(ax), float(ay))
    ok(name in which_regions(pt), f'锚点「{name}」({ax},{ay}) 应落在本州界内')

# ---------- S3 全图网格扫描：双重归属 = 穿模 ----------
print('\n[S3] 穿模扫描')
def dist_to_seg(p, a, b):
    px, py = p; ax, ay = a; bx, by = b
    dx, dy = bx - ax, by - ay
    L2 = dx*dx + dy*dy
    if L2 == 0:
        return ((px-ax)**2 + (py-ay)**2) ** 0.5
    t = max(0.0, min(1.0, ((px-ax)*dx + (py-ay)*dy) / L2))
    qx, qy = ax + t*dx, ay + t*dy
    return ((px-qx)**2 + (py-qy)**2) ** 0.5

def on_border(pt, eps=0.75):
    """点贴着任何一州的边界线（含三州交点）：零面积接触，不算穿模"""
    for poly in provs.values():
        for i in range(len(poly) - 1):
            if dist_to_seg(pt, poly[i], poly[i+1]) < eps:
                return True
    return False

double = []
for gx in range(3, 800, 5):
    for gy in range(2, 600, 5):
        pt = (float(gx), float(gy))
        regs = which_regions(pt)
        if len(regs) > 1 and not on_border(pt):
            double.append((gx, gy, regs))
ok(len(double) == 0, f'存在穿模：{len(double)} 个采样点双重归属，例如 {double[:5]}')

# ---------- S4 哨兵 ----------
print('\n[S4] 哨兵')
ok('<polygon' not in blk, '舆图内不应再有 polygon（全部曲线化）')
ok(blk.count('<path class="map-province"') == 7, '7州全为曲线路径')
ok('东南海域·诸岛' in blk and blk.count('stroke="#d6c49a"') >= 1, '东南海域岛链存在')
ok('fill-opacity="0.55"' in blk, '东南海域为半透明陆架')

print(f'\n========== 结果：{passed} 通过 / {failed} 失败 ==========')
sys.exit(1 if failed else 0)
