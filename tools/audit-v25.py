# -*- coding: utf-8 -*-
"""v25.0 全仓一次性体检：多病族交叉机扫
A. window 幽灵读（读 window.X 但 X 从未挂上 window：let/const/class 词法全局不算挂）
B. getElementById 死 id（字面 id 在 HTML 与全部 JS 模板文本里都不存在）
C. localStorage 键失配（读了从不写的键 / 写了从不读的键）
D. HTML 内联事件处理器指向不存在的函数
E. 顶层同名函数重复定义（后加载静默覆盖前一个）
"""
import os, re, json, sys
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP_DIRS = {'node_modules', '.git', 'tests', 'tools', 'dist', 'project', 'src', 'public', 'styles', '计划', 'logs', 'vendor'}

def collect_files():
    js, html = [], []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for fn in filenames:
            p = os.path.join(dirpath, fn)
            rel = os.path.relpath(p, ROOT)
            if fn.endswith('.js'):
                js.append(rel)
            elif fn.endswith('.html'):
                html.append(rel)
    return sorted(js), sorted(html)

def strip_comments(text):
    # 粗剥：整行 // 注释与整行 * 开头的行（与既有测试同款口径）
    out = []
    for line in text.split('\n'):
        t = line.strip()
        if t.startswith('//') or t.startswith('*') or t.startswith('/*'):
            continue
        out.append(line)
    return '\n'.join(out)

JS_FILES, HTML_FILES = collect_files()
SRC = {}
CLEAN = {}
for f in JS_FILES + HTML_FILES:
    with open(os.path.join(ROOT, f), encoding='utf-8', errors='replace') as fh:
        SRC[f] = fh.read()
for f in JS_FILES:
    CLEAN[f] = strip_comments(SRC[f])
ALL_JS_CLEAN = '\n'.join(CLEAN.values())
ALL_RAW = '\n'.join(SRC.values())

findings = defaultdict(list)

# ---------- A. window 幽灵读 ----------
# 写方集合：window.X = / window['X'] = / 顶层 var X / 顶层 function X( / X: 挂进某 window 对象字面量(近似不收)
win_writes = set(re.findall(r"window\.([A-Za-z_$][\w$]*)\s*=[^=]", ALL_JS_CLEAN))
win_writes |= set(re.findall(r"window\[['\"]([A-Za-z_$][\w$]*)['\"]\]\s*=", ALL_JS_CLEAN))
top_vars = set()
top_funcs = set()
for f in JS_FILES:
    for m in re.finditer(r"^(?:var|let|const)\s+([A-Za-z_$][\w$]*)", CLEAN[f], re.M):
        top_vars.add(m.group(1))   # var 挂 window；let/const 只是词法全局——分开处理
    for m in re.finditer(r"^function\s+([A-Za-z_$][\w$]*)\s*\(", CLEAN[f], re.M):
        top_funcs.add(m.group(1))
# 顶层 var / function 真挂 window；let/const/class 不挂
top_let = set()
for f in JS_FILES:
    for m in re.finditer(r"^(?:let|const|class)\s+([A-Za-z_$][\w$]*)", CLEAN[f], re.M):
        top_let.add(m.group(1))
top_var_only = set()
for f in JS_FILES:
    for m in re.finditer(r"^var\s+([A-Za-z_$][\w$]*)", CLEAN[f], re.M):
        top_var_only.add(m.group(1))

# 浏览器自带 window 属性白名单（不穷举，常见即可）
BUILTIN = set("""location document navigator localStorage sessionStorage history screen
innerWidth innerHeight outerWidth outerHeight scrollX scrollY pageXOffset pageYOffset
devicePixelRatio matchMedia getComputedStyle requestAnimationFrame cancelAnimationFrame
setTimeout clearTimeout setInterval clearInterval alert confirm prompt open close focus blur
console performance crypto fetch WebSocket Worker Audio Image Event CustomEvent URL
addEventListener removeEventListener dispatchEvent postMessage structuredClone
speechSynthesis AudioContext webkitAudioContext IndexedDB indexedDB caches
isSecureContext origin protocol host hostname pathname search hash href
screenX screenY moveTo resizeTo scrollTo scrollBy getSelection frameElement
visualViewport onbeforeunload onerror onload onresize onscroll""".split())

win_reads = defaultdict(list)  # name -> [(file, line)]
for f in JS_FILES:
    for i, line in enumerate(CLEAN[f].split('\n'), 1):
        for m in re.finditer(r"window\.([A-Za-z_$][\w$]*)", line):
            name = m.group(1)
            # 排除写方（window.X = ...）
            rest = line[m.end():]
            if re.match(r"\s*=[^=]", rest):
                continue
            win_reads[name].append((f, i, line.strip()[:120]))

ghost_a = []
for name, locs in win_reads.items():
    if name in BUILTIN: continue
    if name in win_writes: continue
    if name in top_funcs or name in top_var_only: continue
    # 也可能挂在 window 对象字面量或经变量间接挂——粗筛后人工复核
    ghost_a.append((name, locs, name in top_let))
ghost_a.sort(key=lambda x: -len(x[1]))
findings['A_window幽灵读'] = [
    {'name': n, 'lexical': lex, 'hits': len(l), 'where': [f'{f}:{i}' for f, i, _ in l[:6]], 'sample': l[0][2]}
    for n, l, lex in ghost_a
]

# ---------- B. getElementById 死 id ----------
static_ids = set(re.findall(r'id="([^"{$]+)"', ALL_RAW))          # HTML 静态
static_ids |= set(re.findall(r"id='([^'{$]+)'", ALL_RAW))
static_ids |= set(re.findall(r'id=\\?"([\w-]+)', ALL_RAW))          # JS 模板串里的 id=\"...\"
static_ids |= set(re.findall(r"id=\\\\?['\"]([\w-]+)", ALL_RAW))
gets = defaultdict(list)
for f in JS_FILES:
    for i, line in enumerate(CLEAN[f].split('\n'), 1):
        for m in re.finditer(r"getElementById\(\s*['\"]([\w-]+)['\"]\s*\)", line):
            gets[m.group(1)].append((f, i, line.strip()[:120]))
dead_b = [(gid, locs) for gid, locs in gets.items() if gid not in static_ids]
dead_b.sort(key=lambda x: -len(x[1]))
findings['B_getElementById死id'] = [
    {'id': g, 'hits': len(l), 'where': [f'{f}:{i}' for f, i, _ in l[:6]], 'sample': l[0][2]}
    for g, l in dead_b
]

# ---------- C. localStorage 键失配 ----------
sets, gts = defaultdict(list), defaultdict(list)
for f in JS_FILES:
    for i, line in enumerate(CLEAN[f].split('\n'), 1):
        for m in re.finditer(r"(?:localStorage|storage)\.setItem\(\s*['\"]([^'\"]+)['\"]", line):
            sets[m.group(1)].append(f'{f}:{i}')
        for m in re.finditer(r"(?:localStorage|storage)\.getItem\(\s*['\"]([^'\"]+)['\"]", line):
            gts[m.group(1)].append(f'{f}:{i}')
# 也算上带前缀封装（如 saveToStorage('key',...)）——粗口径只扫原生
read_never_written = {k: v for k, v in gts.items() if k not in sets}
written_never_read = {k: v for k, v in sets.items() if k not in gts}
findings['C_读从不写的键'] = [{'key': k, 'where': v[:6]} for k, v in sorted(read_never_written.items())]
findings['C_写从不读的键'] = [{'key': k, 'where': v[:6]} for k, v in sorted(written_never_read.items())]

# ---------- D. HTML 内联处理器 ----------
handler_defs = set(top_funcs) | set(re.findall(r"window\.([A-Za-z_$][\w$]*)\s*=\s*(?:function|\(|async|[A-Za-z_$][\w$]*\s*=>)", ALL_JS_CLEAN))
# var X = function / =>
for f in JS_FILES:
    for m in re.finditer(r"^var\s+([A-Za-z_$][\w$]*)\s*=\s*(?:function|async function|\()", CLEAN[f], re.M):
        handler_defs.add(m.group(1))
handlers = defaultdict(list)
for f in HTML_FILES:
    for m in re.finditer(r'on(?:click|change|input|submit|keydown|keyup|mouseover|mouseout|load|error)="([A-Za-z_$][\w$]*)\s*\(', SRC[f]):
        handlers[m.group(1)].append(f)
# HTML 内联 <script> 里定义的也算
inline_defs = set()
for f in HTML_FILES:
    for m in re.finditer(r"function\s+([A-Za-z_$][\w$]*)\s*\(", SRC[f]):
        inline_defs.add(m.group(1))
dead_d = {h: fs for h, fs in handlers.items() if h not in handler_defs and h not in inline_defs}
findings['D_内联处理器无定义'] = [{'handler': h, 'files': sorted(set(fs))[:4]} for h, fs in sorted(dead_d.items())]

# ---------- E. 顶层同名函数重复定义 ----------
defs = defaultdict(list)
for f in JS_FILES:
    for m in re.finditer(r"^function\s+([A-Za-z_$][\w$]*)\s*\(", CLEAN[f], re.M):
        defs[m.group(1)].append(f)
dup_e = {n: fs for n, fs in defs.items() if len(fs) > 1 or (len(fs) == 1 and len(re.findall(r"^function\s+%s\s*\(" % re.escape(n), CLEAN[fs[0]], re.M)) > 1)}
# 同文件重复也抓
same_file_dup = []
for f in JS_FILES:
    cnt = defaultdict(int)
    for m in re.finditer(r"^function\s+([A-Za-z_$][\w$]*)\s*\(", CLEAN[f], re.M):
        cnt[m.group(1)] += 1
    for n, c in cnt.items():
        if c > 1:
            same_file_dup.append({'name': n, 'file': f, 'times': c})
cross = [{'name': n, 'files': fs} for n, fs in sorted(dup_e.items()) if len(set(fs)) > 1]
findings['E_跨文件同名顶层函数'] = cross
findings['E_同文件重复定义'] = same_file_dup

print(json.dumps(findings, ensure_ascii=False, indent=1))
print('\n==== 汇总 ====')
for k, v in findings.items():
    print(f'{k}: {len(v)}')
