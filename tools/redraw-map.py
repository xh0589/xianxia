#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""v20.67 舆图重绘：把纯色多边形升级成有山海质感的老地图。
保留全部 polygon 几何/id/data-province/onclick、城市与门派标记原样回植。"""
import io, re, sys

P = '仙侠.html'
s = io.open(P, encoding='utf-8').read()

START = '<svg viewBox="0 0 800 600" class="w-full" id="world-map">'
i0 = s.index(START)
i1 = s.index('</svg>', i0) + len('</svg>')
block = s[i0:i1]

# ---- 抽取现有元素 ----
polys = re.findall(
    r'<polygon class="map-province" id="(prov-[a-z]+)" points="([^"]+)"\s*\n?\s*fill="([^"]+)" data-province="([^"]+)" onclick="([^"]+)"/>',
    block)
assert len(polys) == 7, f'省份多边形应有7个，抽到{len(polys)}'

labels = re.findall(
    r'<text x="(\d+)" y="(\d+)" fill="#d1d5db" font-size="1[3-6]" text-anchor="middle" pointer-events="none" font-weight="bold">([^<]+)</text>',
    block)
assert len(labels) == 7, f'省份名应有7个，抽到{len(labels)}'

cities = re.findall(r'<g class="map-city".*?</g>', block, re.S)
assert len(cities) == 19, f'城市标记应有19个，抽到{len(cities)}'

sects = re.findall(r'<g class="map-sect".*?</g>', block, re.S)
assert len(sects) == 36, f'门派标记应有36个，抽到{len(sects)}'
# 门派/城市文字加深色描边光晕，花底上也看得清
sects = [re.sub(r'<text ', '<text style="paint-order:stroke;stroke:rgba(10,14,22,.85);stroke-width:2.5px;stroke-linejoin:round" ', g) for g in sects]
cities = [re.sub(r'<text ', '<text style="paint-order:stroke;stroke:rgba(10,14,22,.85);stroke-width:2.5px;stroke-linejoin:round" ', g) for g in cities]

GRAD = {
    'prov-zhongzhou': 'wmGradZZ', 'prov-donghuang': 'wmGradDH', 'prov-nanjiang': 'wmGradNJ',
    'prov-ximo': 'wmGradXM', 'prov-beiming': 'wmGradBM', 'prov-shudi': 'wmGradSD',
    'prov-dongnan': 'wmGradDN',
}
COAST = {'prov-donghuang', 'prov-beiming', 'prov-nanjiang', 'prov-dongnan'}
LABEL_SIZE = {'中州': 19, '东荒': 19, '南疆': 19, '西漠': 19, '北冥': 19, '蜀地': 18, '东南海域': 16}

out = []
A = out.append
A(START)

# ============ defs：渐变 / 地形符号 ============
A('''
                        <defs>
                            <radialGradient id="wmOcean" cx="48%" cy="40%" r="82%">
                                <stop offset="0%" stop-color="#243349"/>
                                <stop offset="60%" stop-color="#1a2436"/>
                                <stop offset="100%" stop-color="#0e1420"/>
                            </radialGradient>
                            <radialGradient id="wmVignette" cx="50%" cy="45%" r="72%">
                                <stop offset="55%" stop-color="#000000" stop-opacity="0"/>
                                <stop offset="100%" stop-color="#000000" stop-opacity="0.42"/>
                            </radialGradient>
                            <linearGradient id="wmGradZZ" x1="0.2" y1="0" x2="0.8" y2="1">
                                <stop offset="0%" stop-color="#4d6349"/><stop offset="100%" stop-color="#313d2f"/>
                            </linearGradient>
                            <linearGradient id="wmGradDH" x1="0.2" y1="0" x2="0.8" y2="1">
                                <stop offset="0%" stop-color="#3d6140"/><stop offset="100%" stop-color="#21361e"/>
                            </linearGradient>
                            <linearGradient id="wmGradNJ" x1="0.2" y1="0" x2="0.8" y2="1">
                                <stop offset="0%" stop-color="#5e3a37"/><stop offset="100%" stop-color="#37201e"/>
                            </linearGradient>
                            <linearGradient id="wmGradXM" x1="0.2" y1="0" x2="0.8" y2="1">
                                <stop offset="0%" stop-color="#61543a"/><stop offset="100%" stop-color="#3a3222"/>
                            </linearGradient>
                            <linearGradient id="wmGradBM" x1="0.2" y1="0" x2="0.8" y2="1">
                                <stop offset="0%" stop-color="#3c5263"/><stop offset="100%" stop-color="#1f2c38"/>
                            </linearGradient>
                            <linearGradient id="wmGradSD" x1="0.2" y1="0" x2="0.8" y2="1">
                                <stop offset="0%" stop-color="#4d3b4d"/><stop offset="100%" stop-color="#2b202b"/>
                            </linearGradient>
                            <linearGradient id="wmGradDN" x1="0.2" y1="0" x2="0.8" y2="1">
                                <stop offset="0%" stop-color="#2a5165"/><stop offset="100%" stop-color="#132935"/>
                            </linearGradient>
                            <!-- 地形符号：雪山 / 青峦 / 松林 / 沙丘 / 水波 / 瘴泽 / 祥云 -->
                            <g id="wmMtnSnow">
                                <path d="M-16 9 L-5 -9 L1 -1 L7 -11 L20 9 Z" fill="#26313f" opacity="0.75"/>
                                <path d="M-5 -9 L-1.5 -3.5 L-8.5 -3.5 Z" fill="#e8eef5" opacity="0.85"/>
                                <path d="M7 -11 L10.5 -5 L3.5 -5 Z" fill="#e8eef5" opacity="0.85"/>
                                <path d="M-16 9 L20 9" stroke="#0e141d" stroke-width="1" opacity="0.4"/>
                            </g>
                            <g id="wmMtnGreen">
                                <path d="M-15 8 L-4 -7 L3 1 L9 -8 L19 8 Z" fill="#1c2b1c" opacity="0.7"/>
                                <path d="M-15 8 L19 8" stroke="#0d130d" stroke-width="1" opacity="0.35"/>
                            </g>
                            <g id="wmPine">
                                <path d="M0 -11 L5.5 -3 L2.5 -3 L6.5 4 L-6.5 4 L-2.5 -3 L-5.5 -3 Z" fill="#152912" opacity="0.8"/>
                                <rect x="-1" y="4" width="2" height="3.5" fill="#2c1d10" opacity="0.8"/>
                            </g>
                            <g id="wmDune">
                                <path d="M-17 6 Q-9 -7 -1 3 Q7 -9 17 6 Z" fill="#b29457" opacity="0.22"/>
                                <path d="M-11 7 Q-3 -3 5 7" stroke="#d8bd82" stroke-width="1" fill="none" opacity="0.35"/>
                            </g>
                            <g id="wmWave">
                                <path d="M-10 0 Q-5 -5 0 0 Q5 5 10 0" stroke="#8fe3dc" stroke-width="1.2" fill="none" opacity="0.45"/>
                                <path d="M-6 5.5 Q-1 0.5 4 5.5" stroke="#8fe3dc" stroke-width="1" fill="none" opacity="0.3"/>
                            </g>
                            <g id="wmMarsh">
                                <path d="M-9 2 Q-4.5 -2 0 2 Q4.5 6 9 2" stroke="#7ea06e" stroke-width="1" fill="none" opacity="0.4"/>
                                <circle cx="-4" cy="-3" r="1" fill="#8fae7e" opacity="0.4"/>
                                <circle cx="5" cy="-4" r="1.2" fill="#8fae7e" opacity="0.3"/>
                            </g>
                            <g id="wmCloud">
                                <ellipse cx="-6" cy="0" rx="7" ry="3.2" fill="#dfe7f0" opacity="0.10"/>
                                <ellipse cx="2" cy="-2" rx="8" ry="3.8" fill="#dfe7f0" opacity="0.12"/>
                                <ellipse cx="9" cy="1" rx="6" ry="2.8" fill="#dfe7f0" opacity="0.09"/>
                            </g>
                        </defs>''')

# ============ 海：底渐变 + 经纬细线 ============
A('''
                        <!-- 背景：海 -->
                        <rect width="800" height="600" fill="url(#wmOcean)" rx="8"/>
                        <g stroke="#9db4d0" stroke-opacity="0.05" stroke-width="1" pointer-events="none">''')
for x in range(80, 760, 80):
    A(f'                            <line x1="{x}" y1="8" x2="{x}" y2="592"/>')
for y in range(75, 560, 75):
    A(f'                            <line x1="8" y1="{y}" x2="792" y2="{y}"/>')
A('                        </g>')

# ============ 省份：渐变填充（几何/点击判定原样） ============
A('\n                        <!-- 九州 -->')
for pid, pts, _fill, prov, onclick in polys:
    A(f'''                        <polygon class="map-province" id="{pid}" points="{pts}"
                            fill="url(#{GRAD[pid]})" data-province="{prov}" onclick="{onclick}"/>''')

# ============ 海岸线：虚点浪花（只描沿海四州） ============
A('                        <g pointer-events="none" fill="none" stroke="#cfe8f5" stroke-opacity="0.2" stroke-width="2.6" stroke-dasharray="1 6" stroke-linecap="round">')
for pid, pts, _f, _p, _o in polys:
    if pid in COAST:
        A(f'                            <polygon points="{pts}"/>')
A('                        </g>')

# ============ 省份名：金字 + 深色光晕 + 卷云饰线 ============
for xs, ys, name in labels:
    x, y = int(xs), int(ys)
    fs = LABEL_SIZE[name]
    A(f'''                        <text x="{x}" y="{y}" fill="#f3e3c0" font-size="{fs}" text-anchor="middle" pointer-events="none" font-weight="bold" letter-spacing="4" style="paint-order:stroke;stroke:rgba(8,12,20,.9);stroke-width:4px;stroke-linejoin:round">{name}</text>
                        <path d="M{x-24} {y+9} Q{x} {y+14} {x+24} {y+9}" stroke="#caa96a" stroke-opacity="0.45" stroke-width="1.2" fill="none" pointer-events="none"/>''')

# ============ 水系：寒江 / 洛水 / 赤水 ============
A('''
                        <!-- 水系 -->
                        <g pointer-events="none" fill="none" stroke-linecap="round">
                            <path d="M78 96 C 140 126, 210 150, 268 186" stroke="#3f6f96" stroke-width="2.4" opacity="0.45"/>
                            <path d="M78 96 C 140 126, 210 150, 268 186" stroke="#9fcbe0" stroke-width="1" opacity="0.5"/>
                            <path d="M196 182 C 240 220, 290 250, 338 306 C 380 356, 430 420, 470 480 C 505 505, 535 500, 566 486" stroke="#3f6f96" stroke-width="3" opacity="0.5"/>
                            <path d="M196 182 C 240 220, 290 250, 338 306 C 380 356, 430 420, 470 480 C 505 505, 535 500, 566 486" stroke="#7fb6d6" stroke-width="1.2" opacity="0.55"/>
                            <path d="M300 372 C 330 420, 380 460, 430 498" stroke="#8a4a3a" stroke-width="2.4" opacity="0.5"/>
                            <path d="M300 372 C 330 420, 380 460, 430 498" stroke="#c47a5e" stroke-width="1" opacity="0.4"/>
                            <text x="120" y="140" font-size="8.5" fill="#9fcbe0" opacity="0.7" style="paint-order:stroke;stroke:rgba(8,12,20,.8);stroke-width:2px">寒江</text>
                            <text x="368" y="342" font-size="8.5" fill="#7fb6d6" opacity="0.7" style="paint-order:stroke;stroke:rgba(8,12,20,.8);stroke-width:2px">洛水</text>
                            <text x="352" y="447" font-size="8.5" fill="#c47a5e" opacity="0.7" style="paint-order:stroke;stroke:rgba(8,12,20,.8);stroke-width:2px">赤水</text>
                        </g>''')

# ============ 地形符号：各州点缀 ============
def uses(sym, spots):
    for x, y, sc in spots:
        A(f'                            <use href="#{sym}" transform="translate({x},{y}) scale({sc})"/>')

A('''
                        <!-- 地形：山林沙漠浪 -->
                        <g pointer-events="none">''')
A('                            <!-- 北冥·雪山 -->'); uses('wmMtnSnow', [(78,168,1.0),(138,178,1.15),(170,160,0.8),(218,172,0.9),(272,182,1.05)])
A('                            <!-- 蜀地·剑山 -->'); uses('wmMtnSnow', [(112,452,1.1),(152,488,0.95),(232,466,1.05),(252,440,0.8)])
A('                            <!-- 东荒·林海 -->'); uses('wmPine', [(548,330,1.0),(556,318,0.8),(600,336,1.1),(628,306,0.9),(642,322,1.0),(676,352,0.85)])
A('                            <!-- 东荒·青峦 -->'); uses('wmMtnGreen', [(700,330,0.9)])
A('                            <!-- 西漠·沙丘 -->'); uses('wmDune', [(66,258,1.0),(196,296,1.15),(230,330,0.9),(248,238,1.0),(160,376,0.95),(280,308,0.85)])
A('                            <!-- 南疆·瘴林 -->'); uses('wmPine', [(262,492,1.0),(486,436,0.9),(508,402,0.8)])
A('                            <!-- 南疆·沼泽 -->'); uses('wmMarsh', [(270,438,1.0),(330,508,1.1),(400,516,0.9),(452,498,1.0)])
A('                            <!-- 中州·平野 -->'); uses('wmCloud', [(475,232,1.0),(303,338,0.9),(240,62,0.8)])
A('                            <!-- 中州·太虚山 -->'); uses('wmMtnGreen', [(462,340,0.85),(488,305,0.7)])
A('                            <!-- 东南海域·浪 -->'); uses('wmWave', [(615,462,1.0),(695,498,0.9),(762,452,1.0),(640,408,0.8),(588,492,0.9),(726,344,0.85),(770,505,0.8)])
A('                        </g>')

# ============ 城市（原样回植） ============
A('\n                        <!-- 城市 -->')
for g in cities:
    A('                        ' + g.strip())

# ============ 门派（原样回植） ============
A('''
                        <!-- 门派标记点（v10.0 按地区分配）-->''')
for g in sects:
    A('                        ' + g.strip())

# ============ 海外浪花 + 罗盘 + 计里尺 + 图框 + 暗角 ============
A('''
                        <!-- 海面浪花 -->
                        <g pointer-events="none">
                            <use href="#wmWave" transform="translate(775,55) scale(0.9)"/>
                            <use href="#wmWave" transform="translate(62,48) scale(0.8)"/>
                            <use href="#wmWave" transform="translate(36,305) scale(0.85)"/>
                            <use href="#wmWave" transform="translate(432,572) scale(0.9)"/>
                            <use href="#wmWave" transform="translate(252,566) scale(0.8)"/>
                            <use href="#wmWave" transform="translate(92,552) scale(0.9)"/>
                            <use href="#wmWave" transform="translate(788,248) scale(0.8)"/>
                            <use href="#wmWave" transform="translate(560,548) scale(0.85)"/>
                            <use href="#wmWave" transform="translate(170,572) scale(0.8)"/>
                        </g>
                        <!-- 罗盘 -->
                        <g transform="translate(752,92)" pointer-events="none">
                            <circle r="26" fill="#0d1420" opacity="0.55" stroke="#caa96a" stroke-opacity="0.55"/>
                            <circle r="20" fill="none" stroke="#caa96a" stroke-opacity="0.3" stroke-dasharray="2 3"/>
                            <path d="M0 -18 L4.5 -4.5 L18 0 L4.5 4.5 L0 18 L-4.5 4.5 L-18 0 L-4.5 -4.5 Z" fill="#caa96a" opacity="0.5"/>
                            <path d="M0 -18 L4.5 -4.5 L0 0 Z M0 18 L-4.5 4.5 L0 0 Z" fill="#f3e3c0" opacity="0.9"/>
                            <path d="M0 -18 L-4.5 -4.5 L0 0 Z M0 18 L4.5 4.5 L0 0 Z" fill="#8a6f3d" opacity="0.9"/>
                            <text y="-30" text-anchor="middle" font-size="9" fill="#f3e3c0" opacity="0.9" style="paint-order:stroke;stroke:#0b0f18;stroke-width:2px">北</text>
                        </g>
                        <!-- 计里尺 -->
                        <g transform="translate(640,565)" pointer-events="none">
                            <path d="M0 0 H100" stroke="#caa96a" stroke-opacity="0.7" stroke-width="1.5"/>
                            <path d="M0 -4 V4 M25 -3 V3 M50 -4 V4 M75 -3 V3 M100 -4 V4" stroke="#caa96a" stroke-opacity="0.7"/>
                            <text x="0" y="-8" font-size="8" fill="#caa96a" opacity="0.85">0</text>
                            <text x="100" y="-8" font-size="8" fill="#caa96a" opacity="0.85" text-anchor="end">百里</text>
                        </g>
                        <!-- 图框 -->
                        <g pointer-events="none">
                            <rect x="5" y="5" width="790" height="590" rx="10" fill="none" stroke="#caa96a" stroke-opacity="0.38" stroke-width="1.5"/>
                            <rect x="11" y="11" width="778" height="578" rx="7" fill="none" stroke="#caa96a" stroke-opacity="0.16"/>
                            <path d="M5 34 L5 5 L34 5 M766 5 L795 5 L795 34 M795 566 L795 595 L766 595 M34 595 L5 595 L5 566" fill="none" stroke="#caa96a" stroke-opacity="0.65" stroke-width="2.5"/>
                        </g>
                        <!-- 暗角 -->
                        <rect width="800" height="600" rx="8" fill="url(#wmVignette)" pointer-events="none"/>
                    </svg>''')

new_block = '\n'.join(out)
s = s[:i0] + new_block + s[i1:]
io.open(P, 'w', encoding='utf-8').write(s)

# ---- XML 良构校验 ----
import xml.etree.ElementTree as ET
try:
    ET.fromstring(new_block.replace('href=', 'xlink:href=').replace('<svg ', '<svg xmlns:xlink="http://www.w3.org/1999/xlink" ', 1))
    print('SVG XML 良构 OK')
except ET.ParseError as e:
    print('SVG XML 解析失败：', e)
    sys.exit(1)
print(f'重绘完成：7州渐变 + 海岸虚线 + 3水系 + 地形符号 + 罗盘/计里尺/图框/暗角；城市{len(cities)} 门派{len(sects)} 原样回植')
