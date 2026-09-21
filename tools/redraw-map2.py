#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""v20.68 舆图大陆重构：七州从各自为政的多边形改成共享边界曲线的有机大陆。
相邻两州引用的交界曲线是同一段（反向遍历），从数学上杜绝穿模与缝隙；
海岸线全部换成贝塞尔曲线；东南海域改为半透明陆架 + 真实岛屿。
城市/门派/点击判定/渐变 id 全保留；个别贴边标记微调数像素保证落在界内。"""
import io, re, sys
import xml.etree.ElementTree as ET

P = '仙侠.html'
s = io.open(P, encoding='utf-8').read()
orig_len = len(s)

# ============ 边界曲线库：每段只定义一次 ============
# 格式 id: (p0, c1, c2, p3)
SEG = {
    # —— 海岸线 ——
    'cN1': ((40,178), (52,125), (72,88), (122,62)),     # 北冥北岸·西
    'cN2': ((122,62), (145,50), (160,46), (182,46)),    # 北冥北岸·顶
    'cN3': ((182,46), (240,50), (285,76), (318,108)),   # 北冥北岸·东
    'cN4': ((318,108), (326,116), (330,124), (332,134)),# 北冥东北角
    'cB1': ((332,134), (340,152), (350,172), (365,190)),# 海湾西岸 → A
    'cC1': ((365,190), (410,196), (462,192), (505,190)),# 中州北岸（湾底）A → B
    'cE1': ((505,190), (545,178), (600,160), (655,152)),# 东荒北岸·西
    'cE2': ((655,152), (695,147), (730,158), (752,185)),# 东荒北岸·东
    'cE3': ((752,185), (766,203), (770,225), (764,252)),# 东荒东角
    'cE4': ((764,252), (752,290), (720,345), (678,382)),# 东荒东南岸 → P_eh
    'cE5': ((522,372), (560,382), (620,388), (678,382)),# 东荒湾岸 T3 → P_eh
    'cS1': ((522,372), (534,412), (548,452), (556,486)),# 南疆东岸 T3 → 南
    'cS2': ((556,486), (530,516), (490,536), (445,542)),# 南疆南岸·东
    'cS3': ((445,542), (390,548), (330,540), (280,528)),# 南疆南岸·中
    'cS4': ((280,528), (255,522), (235,528), (218,532)),# 南疆南岸·西 → P_ss
    'cU1': ((112,506), (142,530), (180,540), (218,532)),# 蜀地南岸
    'cU2': ((92,432), (84,462), (92,488), (112,506)),   # 蜀地西岸 P_wu → 南
    'cW1': ((92,432), (72,424), (54,410), (40,392)),    # 西漠西南岸 P_wu → 图边
    'cXN': ((764,252), (780,262), (792,274), (800,290)),# 海域西北界 → 图边
    'cXS': ((800,505), (740,516), (668,524), (612,524)),# 海域南界
    'cSW': ((612,524), (590,508), (570,496), (556,486)),# 海域西南界 → 南疆岸
    # —— 州界 ——
    'iNE':  ((300,215), (322,208), (344,198), (365,190)),  # 北冥/中州 T1 → A
    'iNW1': ((40,186), (80,199), (130,212), (175,218)),    # 北冥/西漠·西
    'iNW2': ((175,218), (225,224), (268,224), (300,215)),  # 北冥/西漠·东 → T1
    'iWC':  ((300,215), (312,260), (288,320), (298,370)),  # 西漠/中州 T1 → T2
    'iCSa': ((298,370), (340,368), (360,352), (398,352)),  # 中州/南疆·西 T2 →
    'iCSb': ((398,352), (440,352), (485,368), (522,372)),  # 中州/南疆·东 → T3
    'iCE':  ((505,190), (514,250), (516,310), (522,372)),  # 中州/东荒 B → T3
    'iWS':  ((298,370), (285,382), (272,393), (258,402)),  # 西漠/南疆 T2 → T4
    'iWUa': ((92,432), (130,400), (170,372), (212,372)),   # 西漠/蜀地·西 P_wu →
    'iWUb': ((212,372), (235,372), (248,388), (258,402)),  # 西漠/蜀地·东 → T4
    'iSU':  ((258,402), (248,445), (232,490), (218,532)),  # 蜀地/南疆 T4 → P_ss
}

def seg_d(sid, rev):
    p0, c1, c2, p3 = SEG[sid]
    if rev:
        p0, c1, c2, p3 = p3, c2, c1, p0
    return p0, f'C{c1[0]} {c1[1]} {c2[0]} {c2[1]} {p3[0]} {p3[1]}'

def build_path(start, steps):
    """steps: [(segId, rev)] 或 ('L', x, y)；每段起点必须接住上一段终点"""
    d = [f'M{start[0]} {start[1]}']
    cur = (start[0], start[1])
    for st in steps:
        if st[0] == 'L':
            d.append(f'L{st[1]} {st[2]}')
            cur = (st[1], st[2])
        else:
            sid, rev = st
            p0, c1, c2, p3 = SEG[sid]
            if rev:
                p0, c1, c2, p3 = p3, c2, c1, p0
            assert p0 == cur, f'接缝断裂：{sid}{"(反)" if rev else ""} 起点{p0} != 当前点{cur}'
            d.append(f'C{c1[0]} {c1[1]} {c2[0]} {c2[1]} {p3[0]} {p3[1]}')
            cur = p3
    return ' '.join(d) + ' Z'

# ============ 七州路径（顺时针） ============
PROV = {
    'prov-beiming': (((40,178)), [('cN1',0),('cN2',0),('cN3',0),('cN4',0),('cB1',0),
                                  ('iNE',1),('iNW2',1),('iNW1',1),('L',40,178)]),
    'prov-ximo':    (((40,186)), [('iNW1',0),('iNW2',0),('iWC',0),('iWS',0),
                                  ('iWUb',1),('iWUa',1),('cW1',0),('L',40,186)]),
    'prov-zhongzhou': (((365,190)), [('cC1',0),('iCE',0),('iCSb',1),('iCSa',1),
                                     ('iWC',1),('iNE',0)]),
    'prov-donghuang': (((505,190)), [('cE1',0),('cE2',0),('cE3',0),('cE4',0),
                                     ('cE5',1),('iCE',1)]),
    'prov-nanjiang': (((298,370)), [('iCSa',0),('iCSb',0),('cS1',0),('cS2',0),('cS3',0),('cS4',0),
                                    ('iSU',1),('iWS',1)]),
    'prov-shudi':   (((92,432)), [('iWUa',0),('iWUb',0),('iSU',0),('cU1',1),('cU2',1)]),
    'prov-dongnan': (((522,372)), [('cE5',0),('cE4',1),('cXN',0),('L',800,505),
                                   ('cXS',0),('cSW',0),('cS1',1)]),
}

for pid, (start, steps) in PROV.items():
    d = build_path(start, steps)
    pat = re.compile(
        r'<polygon class="map-province" id="' + pid + r'" points="[^"]+"\s*\n\s*fill="(url\(#wmGrad\w+\))" data-province="([^"]+)" onclick="([^"]+)"/>')
    m = pat.search(s)
    assert m, f'未找到多边形 {pid}'
    extra = ''
    if pid == 'prov-dongnan':
        extra = ' fill-opacity="0.55" stroke="#7fd6d0" stroke-opacity="0.35" stroke-dasharray="6 4"'
        repl = (f'<path class="map-province" id="{pid}" d="{d}"\n'
                f'                            fill="{m.group(1)}"{extra} data-province="{m.group(2)}" onclick="{m.group(3)}"/>')
    else:
        repl = (f'<path class="map-province" id="{pid}" d="{d}"\n'
                f'                            fill="{m.group(1)}" data-province="{m.group(2)}" onclick="{m.group(3)}"/>')
    s = pat.sub(lambda _: repl, s, count=1)

# ============ 海岸浪花虚线：换成新海岸曲线 ============
COAST_PATHS = [
    ('北冥', (40,178), [('cN1',0),('cN2',0),('cN3',0),('cN4',0),('cB1',0)]),
    ('中州', (365,190), [('cC1',0)]),
    ('东荒', (505,190), [('cE1',0),('cE2',0),('cE3',0),('cE4',0),('cE5',1)]),
    ('南疆', (522,372), [('cS1',0),('cS2',0),('cS3',0),('cS4',0)]),
    ('西漠', (92,432), [('cW1',0)]),
    ('蜀地', (92,432), [('cU2',0),('cU1',0)]),
]
coast_g = ['                        <g pointer-events="none" fill="none" stroke="#cfe8f5" stroke-opacity="0.2" stroke-width="2.6" stroke-dasharray="1 6" stroke-linecap="round">']
for name, start, steps in COAST_PATHS:
    d = build_path(start, steps)[:-2]  # 去掉 ' Z'
    coast_g.append(f'                            <path d="{d}"/>')
coast_g.append('                        </g>')
coast_new = '\n'.join(coast_g)
pat = re.compile(r'<g pointer-events="none" fill="none" stroke="#cfe8f5".*?</g>', re.S)
assert pat.search(s), '未找到海岸虚线组'
s = pat.sub(lambda _: coast_new, s, count=1)

# ============ 水系改道：寒江入湾、洛水穿中州入海、赤水出南疆南岸 ============
RIVERS = '''<!-- 水系 -->
                        <g pointer-events="none" fill="none" stroke-linecap="round">
                            <path d="M78 96 C150 130 240 162 298 180 C326 190 344 190 366 188" stroke="#3f6f96" stroke-width="2.4" opacity="0.45"/>
                            <path d="M78 96 C150 130 240 162 298 180 C326 190 344 190 366 188" stroke="#9fcbe0" stroke-width="1" opacity="0.5"/>
                            <path d="M222 152 C260 178 288 196 318 214 C336 240 332 278 340 308 C350 338 372 352 396 372 C428 402 500 436 556 480" stroke="#3f6f96" stroke-width="3" opacity="0.5"/>
                            <path d="M222 152 C260 178 288 196 318 214 C336 240 332 278 340 308 C350 338 372 352 396 372 C428 402 500 436 556 480" stroke="#7fb6d6" stroke-width="1.2" opacity="0.55"/>
                            <path d="M302 376 C342 416 396 466 447 538" stroke="#8a4a3a" stroke-width="2.4" opacity="0.5"/>
                            <path d="M302 376 C342 416 396 466 447 538" stroke="#c47a5e" stroke-width="1" opacity="0.4"/>
                            <text x="150" y="138" font-size="8.5" fill="#9fcbe0" opacity="0.7" style="paint-order:stroke;stroke:rgba(8,12,20,.8);stroke-width:2px">寒江</text>
                            <text x="358" y="332" font-size="8.5" fill="#7fb6d6" opacity="0.7" style="paint-order:stroke;stroke:rgba(8,12,20,.8);stroke-width:2px">洛水</text>
                            <text x="352" y="442" font-size="8.5" fill="#c47a5e" opacity="0.7" style="paint-order:stroke;stroke:rgba(8,12,20,.8);stroke-width:2px">赤水</text>
                        </g>'''
pat = re.compile(r'<!-- 水系 -->\s*<g pointer-events="none" fill="none" stroke-linecap="round">.*?</g>', re.S)
assert pat.search(s), '未找到水系组'
s = pat.sub(lambda _: RIVERS, s, count=1)

# ============ 东南海域诸岛（城市标记各归其岛） ============
ISLANDS = '''                            <!-- 东南海域·诸岛 -->
                            <g stroke="#d6c49a" stroke-opacity="0.55" stroke-width="2" fill="#3a5440">
                                <path d="M656 402 C658 390 672 384 686 388 C700 392 710 400 706 410 C702 420 682 424 668 418 C658 414 654 410 656 402 Z"/>
                                <path d="M724 368 C742 362 758 380 752 402 C748 420 756 438 746 452 C736 462 722 456 724 440 C726 424 714 404 716 388 C717 376 716 371 724 368 Z"/>
                                <path d="M646 458 C650 448 668 448 674 456 C680 464 670 474 658 472 C648 470 642 466 646 458 Z"/>
                                <path d="M612 428 C618 422 628 426 626 434 C624 440 612 440 610 434 Z"/>
                                <path d="M775 332 C782 326 792 332 788 340 C784 346 772 344 772 338 Z"/>
                                <path d="M640 494 C646 489 654 492 652 498 C650 503 638 502 640 494 Z"/>
                            </g>'''
anchor = '                            <use href="#wmWave" transform="translate(770,505) scale(0.8)"/>'
assert anchor in s, '未找到海域浪纹锚点'
s = s.replace(anchor, anchor + '\n' + ISLANDS, 1)

# ============ 东南海域州名挪到湾内开阔水面（原位置压岛） ============
old_label = re.search(r'<text x="690" y="430" fill="#f3e3c0" font-size="16"[^>]*>东南海域</text>\s*<path d="M666 439 Q690 444 714 439"[^/]*/>', s)
assert old_label, '未找到东南海域州名'
s = s[:old_label.start()] + ('<text x="598" y="432" fill="#f3e3c0" font-size="16" text-anchor="middle" pointer-events="none" font-weight="bold" letter-spacing="4" style="paint-order:stroke;stroke:rgba(8,12,20,.9);stroke-width:4px;stroke-linejoin:round">东南海域</text>\n'
    '                        <path d="M574 441 Q598 446 622 441" stroke="#caa96a" stroke-opacity="0.45" stroke-width="1.2" fill="none" pointer-events="none"/>') + s[old_label.end():]

# ============ 贴边标记微调（几像素，保证落在新界内） ============
NUDGE_CITY = {  # 名: (新cx, 新cy)；文本 y = cy-12
    '极寒之地': (102, 90),
    '佛国遗址': (216, 362),
}
NUDGE_SECT = {  # 名: (新cx, 新cy)；文本 y = cy-15
    '烈日教': (80, 208),
    '峨眉派': (180, 380),
    '唐门': (248, 396),
    '蓬莱派': (716, 204),
}
def nudge(s, kind, name, nx, ny, tdy):
    fn = 'selectCity' if kind == 'city' else 'selectSect'
    gpat = re.compile(r'<g class="map-' + kind + r'" onclick="' + fn + r"\('" + re.escape(name) + r"'.*?</g>", re.S)
    m = gpat.search(s)
    assert m, f'未找到{kind}标记 {name}'
    blk = m.group(0)
    blk2 = re.sub(r'<circle cx="\d+" cy="\d+"', f'<circle cx="{nx}" cy="{ny}"', blk, count=1)
    blk2 = re.sub(r'<text x="\d+" y="\d+"', f'<text x="{nx}" y="{ny - tdy}"', blk2, count=1)
    return s[:m.start()] + blk2 + s[m.end():]
for name, (nx, ny) in NUDGE_CITY.items():
    s = nudge(s, 'city', name, nx, ny, 12)
for name, (nx, ny) in NUDGE_SECT.items():
    s = nudge(s, 'sect', name, nx, ny, 15)

# ============ 地形符号落位微调（新边界下挪出界外的三个点） ============
s = s.replace('translate(240,62) scale(0.8)', 'translate(240,75) scale(0.8)')    # 北冥祥云离北岸太近
s = s.replace('translate(252,440) scale(0.8)', 'translate(240,438) scale(0.8)')  # 蜀地雪山压南疆界
s = s.replace('translate(160,376) scale(0.95)', 'translate(160,368) scale(0.95)')# 西漠沙丘压蜀地界

io.open(P, 'w', encoding='utf-8').write(s)

# ============ 校验 ============
START = '<svg viewBox="0 0 800 600" class="w-full" id="world-map">'
i0 = s.index(START); i1 = s.index('</svg>', i0) + 6
blk = s[i0:i1]
try:
    ET.fromstring(blk.replace('href=', 'xlink:href=').replace('<svg ', '<svg xmlns:xlink="http://www.w3.org/1999/xlink" ', 1))
    print('SVG XML 良构 OK')
except ET.ParseError as e:
    print('SVG XML 解析失败：', e); sys.exit(1)
assert blk.count('class="map-province"') == 7
assert blk.count('class="map-city"') == 19
assert blk.count('class="map-sect"') == 36
assert blk.count('<polygon') == 0, '不应再有 polygon'
assert blk.count('data-province=') == 7 and blk.count('selectCity(') == 19 and blk.count('selectSect(') == 36
print(f'重构完成：7州全部换共享边界曲线路径，0 polygon；城市19 门派36 点击判定完整；HTML {orig_len} → {len(s)} 字节')
