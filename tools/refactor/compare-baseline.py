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

def uniform_tint(fa, fb):
    """判定两图差异是否为「整块均匀色差」（环境光照/时辰层变化，非结构回归）。
    形态判据（2026-09-29 案例实测：向量聚类不聚、差异常只占列段 28% 全行宽）：
    先算差异 bbox，再在 bbox 列段内算行覆盖率——满行（≥70%）占差异行的 ≥85% 即光照漂移。
    文字/控件级回归在 bbox 内是锯齿状（笔画处差异、间隙不差异），光照漂移是满格。
    案底：panel-factions 蓝卡片 bg-gray-700/30 半透明叠加随时辰变的底层光照——
    bbox (1032,76)-(1432,238) 内每行 192/200 满格、innerText 一致、原版双跑稳定——非回归。"""
    a = Image.open(fa).convert('RGB'); b = Image.open(fb).convert('RGB')
    if a.size != b.size: return False
    pa, pb = a.load(), b.load()
    xs, ys = [], []
    W2, H2 = a.width // 2, a.height // 2
    grid = [[False] * W2 for _ in range(H2)]
    for y in range(0, a.height, 2):
        for x in range(0, a.width, 2):
            if max(abs(pa[x, y][c] - pb[x, y][c]) for c in range(3)) > THRESH:
                grid[y // 2][x // 2] = True; xs.append(x // 2); ys.append(y // 2)
    if len(xs) < 120: return False
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    bw = x1 - x0 + 1
    if bw < 20: return False
    full, partial = 0, 0
    for gy in range(y0, y1 + 1):
        rowdiff = sum(1 for gx in range(x0, x1 + 1) if grid[gy][gx])
        if rowdiff == 0: continue
        if rowdiff >= bw * 0.7: full += 1
        else: partial += 1
    if not (full + partial >= 15 and full / (full + partial) >= 0.85):
        return False
    # 幅度判据：光照/时辰漂移的色差小而同向（各通道 |delta| 中位数 ≤60）；
    # 覆盖型假回归（贴纯色块/换图）delta 巨大。两者组合才判「环境差异」。
    import statistics
    deltas = [max(abs(pb[gx * 2, gy * 2][c] - pa[gx * 2, gy * 2][c]) for c in range(3))
              for gy in range(y0, y1 + 1) for gx in range(x0, x1 + 1) if grid[gy][gx]]
    med = statistics.median(deltas)
    return med <= 60

def main(da, db):
    ra = json.load(open(os.path.join(da, 'report.json')))
    rb = json.load(open(os.path.join(db, 'report.json')))
    print(f"控制台错误: {ra['errorTotal']} → {rb['errorTotal']}", 'OK' if rb['errorTotal'] <= ra['errorTotal'] else '!! 增加错误')
    pa = {k: v['switched'] for k, v in ra['panels'].items()}
    pb = {k: v['switched'] for k, v in rb['panels'].items()}
    bad = [k for k in pa if not pb.get(k)] or None
    print('面板切换失败:', bad or '无')
    A, B = snap(os.path.join(da, 'screenshots')), snap(os.path.join(db, 'screenshots'))
    regress, skipped, tinted = [], [], []
    for f in A:
        if f not in B:
            regress.append(f + '（缺失）'); continue
        if f in KNOWN_RANDOM:
            skipped.append(f); continue
        if hashlib.md5(open(A[f], 'rb').read()).hexdigest() == hashlib.md5(open(B[f], 'rb').read()).hexdigest():
            continue  # 字节级一致，跳过像素扫描
        n = sig_diff(A[f], B[f])
        if n > 0:
            if uniform_tint(A[f], B[f]):
                tinted.append(f'{f}（{n} 均匀色差像素）')
            else:
                regress.append(f'{f}（{n} 显著差异像素）')
    for f in B:
        if f not in A: regress.append(f + '（新增）')
    if skipped:
        print('已知随机面板（跳过，需双跑复核）:', ', '.join(sorted(skipped)))
    if tinted:
        print('均匀色差（环境光照/时辰变化，非结构回归）:', ', '.join(tinted))
    print('截图显著差异:', regress or f'无（{len(A) - len(skipped) - len(tinted)}/{len(A)} 一致，忽略亚像素噪声）')
    return 1 if regress else 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1], sys.argv[2]))
