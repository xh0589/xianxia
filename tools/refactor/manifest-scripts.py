#!/usr/bin/env python3
# ==================== 第2步 · script 清单 manifest 化 ====================
# 三件合一：
#   extract  从 仙侠.html 抽出现状加载序列 → scripts.manifest.json（首次建账，无损）
#   gen      读 manifest 重建 script 区段 → 写回 HTML（默认需 --force 才覆盖；首次迁移后
#            直跑即应「已同步」——extract→render 保真由机器逐字节验证）
#   check    校验 HTML 区段 == manifest 重建（忘了跑 gen 时在此报警，exit 1）
#
# 纪律（不可妥协）：
#   1) 加载顺序 = defer 执行顺序 = 文档出现顺序。manifest 的 entries 顺序就是唯一真源。
#   2) 行格式完全规整（实测 316 个标签 0 变体）：<script defer src="…"></script>[<!-- 行尾注释 -->]
#   3) extract 后立即 gen 必须「无变化」——这是生成器保真的机器证明；做不到就停下修生成器。
#
# 用法：
#   python3 tools/manifest-scripts.py extract
#   python3 tools/manifest-scripts.py gen [--force]
#   python3 tools/manifest-scripts.py check
import json, os, re, sys

def _find_root():
    # 从脚本所在目录向上找含 仙侠.html 的目录（工具放在 tools/refactor/ 也能定位项目根）
    d = os.path.dirname(os.path.abspath(__file__))
    for _ in range(6):
        if os.path.exists(os.path.join(d, '仙侠.html')): return d
        d = os.path.dirname(d)
    raise SystemExit('找不到含 仙侠.html 的项目根目录')

ROOT = _find_root()
HTML = os.path.join(ROOT, '仙侠.html')
MANIFEST = os.path.join(ROOT, 'scripts.manifest.json')
MARK_BEGIN = '<!-- SCRIPTS:BEGIN 加载序列唯一真源 scripts.manifest.json · 改清单后跑 tools/manifest-scripts.py gen -->'
MARK_END = '<!-- SCRIPTS:END -->'
ORDER_NOTE = '<!-- 加载顺序：按依赖关系分层排列     -->'

SCRIPT_RE = re.compile(r'<script defer src="([^"]+)"></script>(?:<!--(.*?)-->)?\s*$')

def read_lines():
    with open(HTML, encoding='utf-8') as f:
        return f.read().split('\n')

def find_block(lines):
    """定位 script 区（含层标题注释块）：起点=「加载顺序」注释上方的 ===== 行，终点=最后一个 src script 行。"""
    note_i = next(i for i, l in enumerate(lines) if ORDER_NOTE.strip() in l)
    start = note_i - 1
    assert lines[start].strip().startswith('<!-- ===='), '层标题块上方不是 ===== 注释: ' + lines[start]
    end = max(i for i, l in enumerate(lines) if '<script' in l and 'src=' in l)
    return start, end

def parse_segment(seg):
    entries = []
    for line in seg:
        stripped = line.strip()
        indent = line[:len(line) - len(line.lstrip())]
        if not stripped:
            entries.append({'kind': 'blank', 'indent': indent})
        elif stripped.startswith('<!--') and stripped.endswith('-->'):
            entries.append({'kind': 'comment', 'indent': indent, 'text': stripped[4:-3]})
        else:
            m = SCRIPT_RE.match(stripped)
            if not m:
                raise SystemExit('无法解析的行（格式漂移，先人工检查）: ' + stripped[:100])
            entries.append({'kind': 'script', 'indent': indent, 'src': m.group(1), 'comment': m.group(2)})
    return entries

def render_segment(entries):
    out = []
    for e in entries:
        if e['kind'] == 'blank':
            out.append(e.get('indent', ''))
        elif e['kind'] == 'comment':
            out.append(e['indent'] + '<!--' + e['text'] + '-->')
        else:
            line = e['indent'] + '<script defer src="' + e['src'] + '"></script>'
            if e.get('comment'):
                line += '<!--' + e['comment'] + '-->'
            out.append(line)
    return out

def find_markers(lines):
    b = next((i for i, l in enumerate(lines) if MARK_BEGIN in l), None)
    e = next((i for i, l in enumerate(lines) if l.strip() == MARK_END), None)
    return b, e

def stats(entries):
    scripts = [e for e in entries if e['kind'] == 'script']
    layers = sum(1 for e in entries if e['kind'] == 'comment' and '层' in e['text'] and '：' in e['text'])
    return len(scripts), layers

def cmd_extract():
    lines = read_lines()
    b, e = find_markers(lines)
    if b is not None:
        raise SystemExit('HTML 已有 marker——extract 只做一次，之后请直接改 manifest。')
    start, end = find_block(lines)
    entries = parse_segment(lines[start:end + 1])
    # 保真机器验证：解析→重建 必须逐字节一致
    rebuilt = render_segment(entries)
    assert rebuilt == lines[start:end + 1], '保真校验失败：parse→render 与原文不一致，修生成器而不是绕过'
    mf = {
        'version': 1,
        'generated': '2026-09-28',
        'note': 'script 加载序列唯一真源。entries 顺序=defer 执行顺序=文档出现顺序。'
                '行格式：<script defer src="…"></script> 可带行尾注释；comment 条目=分层注释。'
                '改完跑 tools/manifest-scripts.py gen 写回 HTML，check 校验同步。',
        'stats': {'scripts': stats(entries)[0], 'layerComments': stats(entries)[1]},
        'entries': entries,
    }
    with open(MANIFEST, 'w', encoding='utf-8') as f:
        json.dump(mf, f, ensure_ascii=False, indent=1)
    # HTML 插入 marker（内容不动）
    new_lines = lines[:start] + ['    ' + MARK_BEGIN] + lines[start:end + 1] + ['    ' + MARK_END] + lines[end + 1:]
    with open(HTML, 'w', encoding='utf-8') as f:
        f.write('\n'.join(new_lines))
    n, l = stats(entries)
    print(f'extract 完成：{n} 个 script、{l} 条层注释入账 scripts.manifest.json；HTML 已插 marker（区段内容零改动）。')
    print('保真校验：parse→render 与原文逐字节一致 ✓')

def _load():
    with open(MANIFEST, encoding='utf-8') as f:
        mf = json.load(f)
    return mf, render_segment(mf['entries'])

def cmd_gen(force=False):
    mf, rebuilt = _load()
    lines = read_lines()
    b, e = find_markers(lines)
    if b is None:
        raise SystemExit('HTML 无 marker，请先 extract。')
    current = lines[b + 1:e]
    if current == rebuilt:
        print('已同步：HTML 区段与 manifest 重建逐字节一致，无需写入。')
        return
    if not force:
        print('检测到漂移（HTML ≠ manifest 重建），差异预览：')
        for i, (a, c) in enumerate(zip(current, rebuilt)):
            if a != c:
                print(f'  行{i}: HTML: {a[:80]}')
                print(f'  行{i}: 生成: {c[:80]}')
                if i - b > 5: break
        raise SystemExit('确认写入请加 --force（写入后立即跑 check 与冒烟基线）。')
    new_lines = lines[:b + 1] + rebuilt + lines[e:]
    with open(HTML, 'w', encoding='utf-8') as f:
        f.write('\n'.join(new_lines))
    print(f'gen 写入完成：{len(rebuilt)} 行（{mf["stats"]["scripts"]} 个 script）。立即跑 check 与冒烟基线。')

def cmd_check():
    mf, rebuilt = _load()
    lines = read_lines()
    b, e = find_markers(lines)
    if b is None:
        raise SystemExit('HTML 无 marker，请先 extract。')
    current = lines[b + 1:e]
    if current != rebuilt:
        diffs = [(i, a, c) for i, (a, c) in enumerate(zip(current, rebuilt)) if a != c]
        print(f'[manifest] 不同步！差异 {len(diffs)} 行（HTML 与 scripts.manifest.json 不一致——改了清单没跑 gen？）')
        for i, a, c in diffs[:10]:
            print(f'  HTML : {a[:90]}')
            print(f'  生成 : {c[:90]}')
        sys.exit(1)
    # 附加校验：src 文件存在；body 内 defer script 无漏网
    missing = [e['src'] for e in mf['entries'] if e['kind'] == 'script' and not os.path.exists(os.path.join(ROOT, e['src']))]
    if missing:
        print('[manifest] 清单引用了不存在的文件:', missing[:5]); sys.exit(1)
    body_start = next(i for i, l in enumerate(lines) if '</head>' in l)
    # 只认真实生效的标签行（strip 后以 <script 开头）——注释掉的僵尸标签（如 09-loot-sources.js
    # 与 loot-system.js 重复被禁）不算加载序列，但顺带报告出来提醒清理
    zombies = []
    body_scripts = []
    for l in lines[body_start:]:
        s = l.strip()
        if s.startswith('<!--') and '<script' in s and 'src=' in s and 'vendor/tailwind' not in s:
            zombies.append(s[:90])
        elif s.startswith('<script') and 'src=' in s and 'vendor/tailwind' not in s:
            body_scripts.append(re.search(r'src="([^"]+)"', l).group(1))
    if zombies:
        print('[manifest] 提示：发现被注释的僵尸标签（未加载，建议择日清理）:')
        for z in zombies: print('        ', z)
    mf_scripts = [e['src'] for e in mf['entries'] if e['kind'] == 'script']
    if body_scripts != mf_scripts:
        print('[manifest] HTML body 里的 script 序列与清单不一致（marker 之外有漏网 script）'); sys.exit(1)
    print(f'[manifest] 同步校验通过：{mf["stats"]["scripts"]} 个 script / {mf["stats"]["layerComments"]} 条层注释，'
          f'HTML == manifest，全部文件存在，无漏网标签。')

if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else ''
    if cmd == 'extract':
        cmd_extract()
    elif cmd == 'gen':
        cmd_gen('--force' in sys.argv)
    elif cmd == 'check':
        cmd_check()
    else:
        raise SystemExit('用法: manifest-scripts.py extract | gen [--force] | check')
