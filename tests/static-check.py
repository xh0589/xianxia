#!/usr/bin/env python3
from pathlib import Path
import collections, re, subprocess, sys
root=Path(__file__).resolve().parents[1]
js=sorted((root/'js').rglob('*.js'))
errors=[]
for f in js:
    r=subprocess.run(['node','--check',str(f)],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
    if r.returncode: errors.append(f'{f.relative_to(root)}: {r.stderr.strip()}')

# Classic <script> files share one global lexical/function namespace. Duplicate top-level declarations are forbidden.
symbols=collections.defaultdict(list)
decl=re.compile(r'^(?:function|class|const|let|var)\s+([A-Za-z_$][\w$]*)\b')
for f in js:
    for lineno,line in enumerate(f.read_text(encoding='utf-8',errors='ignore').splitlines(),1):
        m=decl.match(line)
        if m: symbols[m.group(1)].append((f.relative_to(root),lineno))
dup_globals={k:v for k,v in symbols.items() if len(v)>1}
for name,locs in dup_globals.items():
    errors.append('duplicate top-level global '+name+': '+' | '.join(f'{p}:{n}' for p,n in locs))

# Critical public APIs must have exactly one module owner; prevents silent window.xxx overwrites.
owners={
    'buyFromShop':'js/enhanced-shop.js',
    'performBreakthrough':'js/cultivation/breakthrough-ritual.js',
    'cultivateSkill':'js/cultivation/cultivation.js',
    'startBattle':'js/app.js',
    'showStoryDialogue':'js/quest/quest-system.js',
    'openShop':'js/inventory.js',
    'equipSkill':'js/equipment.js',
    'restoreWorldQi':'js/qi-environment.js',
}
for name,owner in owners.items():
    pat=re.compile(r'window\.'+re.escape(name)+r'\s*=(?!=)')
    hits=[]
    for f in js:
        for lineno,line in enumerate(f.read_text(encoding='utf-8',errors='ignore').splitlines(),1):
            if pat.search(line): hits.append((str(f.relative_to(root)),lineno))
    # 路径归一化：Windows 路径转 POSIX 风格（Path 在 Win 上默认返回反斜杠，owner 是正斜杠）
    if len(hits)!=1 or str(Path(hits[0][0])).replace('\\', '/')!=owner.replace('\\', '/'):
        errors.append(f'public API owner mismatch {name}: expected {owner}, got {hits}')

html=(root/'仙侠.html').read_text(encoding='utf-8')
refs=re.findall(r'<script[^>]+src=["\']([^"\']+)["\']',html)
missing=[r for r in refs if not (r.startswith('http://') or r.startswith('https://')) and not (root/r).exists()]

# UI structure gates: unique static IDs and no dynamic literal that collides with a static ID.
html_ids=re.findall(r'\bid=["\']([^"\']+)["\']',html)
for idv,count in collections.Counter(html_ids).items():
    if count>1: errors.append(f'duplicate HTML id {idv}: {count} occurrences')
static_ids=set(html_ids)
for f in js:
    text=f.read_text(encoding='utf-8',errors='ignore')
    for m in re.finditer(r'\.id\s*=\s*["\']([^"\']+)["\']',text):
        if m.group(1) in static_ids:
            errors.append(f'dynamic id collides with static HTML id {m.group(1)}: {f.relative_to(root)}:{text.count(chr(10),0,m.start())+1}')

# Regression for v12.1 ghost task panel: the static #panel-quests is the only task-page owner.
quest=(root/'js/quest/quest-system.js').read_text(encoding='utf-8')
app=(root/'js/app.js').read_text(encoding='utf-8')
if len(re.findall(r'\bid=["\']panel-quests["\']',html)) != 1:
    errors.append('quest page must have exactly one static #panel-quests')
if re.search(r'\.id\s*=\s*["\']quest-panel["\']',quest):
    errors.append('quest-system dynamically creates legacy #quest-panel')
m=re.search(r"if \(panelId === 'quests'\) \{(.*?)\n\s*\}",app,re.S)
if not m or 'showQuestPanel' in m.group(1):
    errors.append('switchPanel(quests) must not recursively create/show a second quest panel')

# Auction entry ownership: normal city auction must route to AuctionService; royal is a separate tier on same service.
if not re.search(r"['\"]auction_house['\"]\s*:\s*\{[^\n]*action:\s*['\"]openAuctionHouse['\"]",app):
    errors.append('city auction_house does not route to openAuctionHouse')
auction=(root/'js/economy/auction-service.js').read_text(encoding='utf-8')
if 'global.openAuctionHouse = open;' not in auction or 'openRoyal: openRoyal' not in auction:
    errors.append('AuctionService does not own both normal and royal auction entry points')

# Dynamic sect panel has one creation owner even though multiple modules render into it.
sect_creations=[]
for f in js:
    text=f.read_text(encoding='utf-8',errors='ignore')
    for m in re.finditer(r'\.id\s*=\s*["\']sect-panel["\']',text):
        sect_creations.append((str(f.relative_to(root)),text.count(chr(10),0,m.start())+1))
if len(sect_creations)!=1:
    errors.append(f'#sect-panel must have exactly one DOM creation owner, got {sect_creations}')

# Semantic gates: keep reputation dimensions explicit and respect configured zero daily-task counts.
for f in js:
    text=f.read_text(encoding='utf-8',errors='ignore')
    if re.search(r'currentCharData\.reputation\s*=', text) and f.name != 'reward-service.js':
        errors.append(f'ambiguous currentCharData.reputation assignment: {f.relative_to(root)}')
for rel in ['js/sects/sects-deep-ui.js','js/sects/sect-wudang-deep.js']:
    text=(root/rel).read_text(encoding='utf-8',errors='ignore')
    if re.search(r'dailyTaskCount\s*\|\|\s*1', text):
        errors.append(f'{rel} converts explicit dailyTaskCount=0 into 1')

# Core next-step architecture modules must be loaded before their consumers.
local_refs=[r for r in refs if not (r.startswith('http://') or r.startswith('https://'))]
def ref_index(path):
    try: return local_refs.index(path)
    except ValueError: return -1
for required in ['js/core/panel-lifecycle.js','js/core/reward-service.js','js/economy/auction-service.js']:
    if ref_index(required)<0: errors.append(f'missing core script ref: {required}')
if ref_index('js/core/reward-service.js') > ref_index('js/core/scenario-engine.js') >= 0:
    errors.append('RewardService must load before ScenarioEngine consumer')

if errors or missing:
    print('FAIL')
    for e in errors: print(e)
    for m in missing: print('missing script:',m)
    sys.exit(1)
print(f'OK: {len(js)} JS files pass node --check; {len(refs)} script refs checked; missing=0; duplicate top-level globals=0; HTML IDs unique; dynamic/static ID collisions=0; critical API owners={len(owners)}')
