#!/usr/bin/env python3
# ==================== 基线对比工具（第0步配套） ====================
# 对比两份冒烟基线：
#   1) report.json：控制台错误数、面板切换状态
#   2) 截图：只报「显著差异」像素（任一通道差 > THRESH，默认 8/255）——
#      Chromium headless 的字体光栅化存在 1~2/255 的亚像素噪声（实测：同代码两次运行
#      0.63% 像素有 ≤2/255 噪声、DOM innerText 完全一致），这类噪声不构成回归。
# 用法：python3 tools/compare-baseline.py baselineA baselineB
import json, os, sys, hashlib
from PIL import Image, ImageChops

THRESH = 8
# 已知跑间随机面板（2026-09-28 实测：未重构的原版自己两跑 sub-attr 即有 836 显著差异像素
# ——创角属性 roll 的会话级随机，与重构无关。innerText 复核两版一致）。
# 对比时跳过并提示人工复核（双跑取交集最稳）。
KNOWN_RANDOM = {'sub-attr.png'}

def snap(d):
    return {f: os.path.join(d, f) for f in sorted(os.listdir(d)) if f.endswith('.png')}

def sig_diff(fa, fb):
    a = Image.open(fa).convert('RGB'); b = Image.open(fb).convert('RGB')
    if a.size != b.size: return -1
    pa, pb = a.load(), b.load()
    n = 0
    for y in range(0, a.height, 2):
        for x in range(0, a.width, 2):
            if max(abs(pa[x, y][c] - pb[x, y][c]) for c in range(3)) > THRESH: n += 1
    return n

def main(da, db):
    ra = json.load(open(os.path.join(da, 'report.json')))
    rb = json.load(open(os.path.join(db, 'report.json')))
    print(f"控制台错误: {ra['errorTotal']} → {rb['errorTotal']}", 'OK' if rb['errorTotal'] <= ra['errorTotal'] else '!! 增加错误')
    pa = {k: v['switched'] for k, v in ra['panels'].items()}
    pb = {k: v['switched'] for k, v in rb['panels'].items()}
    bad = [k for k in pa if not pb.get(k)] or None
    print('面板切换失败:', bad or '无')
    A, B = snap(os.path.join(da, 'screenshots')), snap(os.path.join(db, 'screenshots'))
    regress, skipped = [], []
    for f in A:
        if f not in B:
            regress.append(f + '（缺失）'); continue
        if f in KNOWN_RANDOM:
            skipped.append(f); continue
        if hashlib.md5(open(A[f], 'rb').read()).hexdigest() == hashlib.md5(open(B[f], 'rb').read()).hexdigest():
            continue  # 字节级一致，跳过像素扫描
        n = sig_diff(A[f], B[f])
        if n > 0: regress.append(f'{f}（{n} 显著差异像素）')
    for f in B:
        if f not in A: regress.append(f + '（新增）')
    if skipped:
        print('已知随机面板（跳过，需双跑复核）:', ', '.join(sorted(skipped)))
    print('截图显著差异:', regress or f'无（{len(A) - len(skipped)}/{len(A)} 一致，忽略亚像素噪声）')
    return 1 if regress else 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1], sys.argv[2]))
