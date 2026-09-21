#!/usr/bin/env python3
"""Chromium DOM smoke test.
Uses a real Chromium/V8/DOM, but injects the project HTML/scripts into about:blank because
this managed test container blocks localhost/file navigation by administrator policy.
Requires: chromium and websocket-client.
"""
import subprocess, tempfile, shutil, time as _time, urllib.request as _ur, os, signal, atexit
_chromium=shutil.which('chromium') or shutil.which('chromium-browser')
if not _chromium:
    # 环境性跳过不是失败：无 chromium 时以 0 退出，让 run-all.sh 的退出码只反映真实测试结果
    print('SKIP: chromium not found')
    raise SystemExit(0)
_profile=tempfile.mkdtemp(prefix='xianxia_browser_')
_proc=subprocess.Popen([_chromium,'--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--disable-component-update','--disable-default-apps','--disable-extensions','--disable-sync','--no-first-run','--remote-allow-origins=*','--remote-debugging-address=127.0.0.1','--remote-debugging-port=9333','--user-data-dir='+_profile,'about:blank'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
def _cleanup():
    try: _proc.terminate(); _proc.wait(timeout=3)
    except Exception:
        try: _proc.kill()
        except Exception: pass
    shutil.rmtree(_profile,ignore_errors=True)
atexit.register(_cleanup)
for _ in range(40):
    try:
        _ur.urlopen('http://127.0.0.1:9333/json/version',timeout=.3).read(); break
    except Exception: _time.sleep(.15)
else:
    raise SystemExit('FAIL: chromium DevTools did not start')

import json, urllib.request, websocket, time, re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'仙侠.html').read_text('utf-8')
# Create a blank target; org policy blocks navigation, but Runtime-injected DOM + classic scripts still uses real Chromium/V8/DOM.
req=urllib.request.Request('http://127.0.0.1:9333/json/new?about:blank',method='PUT')
t=json.load(urllib.request.urlopen(req,timeout=5))
ws=websocket.create_connection(t['webSocketDebuggerUrl'],timeout=10,origin='http://127.0.0.1:9333')
seq=0; events=[]
def cmd(method,params=None,timeout=30):
    global seq
    seq+=1; i=seq
    ws.send(json.dumps({'id':i,'method':method,'params':params or {}}))
    end=time.time()+timeout
    while time.time()<end:
        msg=json.loads(ws.recv())
        if msg.get('id')==i: return msg
        events.append(msg)
    raise TimeoutError(method)
def evaljs(expr, timeout=30):
    r=cmd('Runtime.evaluate',{'expression':expr,'returnByValue':True,'awaitPromise':True},timeout)
    rr=r.get('result',{})
    if 'exceptionDetails' in rr:
        d=rr['exceptionDetails']
        raise RuntimeError((d.get('exception') or {}).get('description') or d.get('text'))
    return rr.get('result',{}).get('value')
cmd('Runtime.enable'); cmd('Log.enable')
# Install source HTML without any script elements. Keep real DOM structure and IDs.
base=re.sub(r'<script\b[^>]*>.*?</script>','',HTML,flags=re.I|re.S)
evaljs("document.open();document.write("+json.dumps(base)+");document.close(); true;")
evaljs("""(()=>{var store={}; var fake={getItem:function(k){return Object.prototype.hasOwnProperty.call(store,k)?store[k]:null;},setItem:function(k,v){store[k]=String(v);},removeItem:function(k){delete store[k];},clear:function(){store={};},key:function(i){return Object.keys(store)[i]||null;}};Object.defineProperty(fake,'length',{get:function(){return Object.keys(store).length;}});try{Object.defineProperty(window,'localStorage',{value:fake,configurable:true});}catch(e){window.__fakeLocalStorage=fake;}return true;})()""")
# Execute every local script in the exact HTML order as classic script elements. Skip remote Tailwind + its config.
pat=re.compile(r'<script\b([^>]*)>(.*?)</script>',re.I|re.S)
loaded=[]; script_fail=[]
for idx,m in enumerate(pat.finditer(HTML),1):
    attrs,body=m.group(1),m.group(2)
    sm=re.search(r'src=[\"\']([^\"\']+)[\"\']',attrs,re.I)
    if sm:
        src=sm.group(1)
        if src.startswith('http://') or src.startswith('https://'):
            continue
        code=(ROOT/src).read_text('utf-8')
        label=src
    else:
        # only current inline script is tailwind.config and remote dependency is intentionally skipped
        if 'tailwind.config' in body: continue
        code=body; label=f'inline#{idx}'
    # Classic script element gives browser-accurate global declaration semantics.
    expr="(()=>{var s=document.createElement('script');s.dataset.testSource="+json.dumps(label)+";s.textContent="+json.dumps(code)+";document.head.appendChild(s);return true;})()"
    try:
        evaljs(expr,60); loaded.append(label)
    except Exception as e:
        script_fail.append((label,str(e)))
# allow queued microtasks/timeouts that initialize UI
for _ in range(10):
    time.sleep(0.1)
    # drain any queued events briefly by running no-op command
    try: evaljs('true')
    except: pass

results={}
results['readiness']=evaljs("({title:document.title,hasSwitch:typeof switchPanel,hasRep:typeof setReputation,hasPermit:typeof useSpecialPermit,hasAuction:typeof AuctionService,hasPanelLifecycle:typeof PanelLifecycle,hasReward:typeof RewardService,scriptNodes:document.querySelectorAll('script[data-test-source]').length})")
results['quest']=evaljs("""(()=>{var before=document.querySelectorAll('#quest-panel').length; switchPanel('quests'); var p=document.getElementById('panel-quests'); return {beforeGhost:before,afterGhost:document.querySelectorAll('#quest-panel').length,staticCount:document.querySelectorAll('#panel-quests').length,visible:!!p&&!p.classList.contains('hidden'),activeListCount:document.querySelectorAll('#active-quest-list').length};})()""")
results['reputation']=evaljs("""(()=>{var city='帝都·长安'; currentCharData=currentCharData||{}; window.currentCharData=currentCharData; currentCharData.name='admin'; currentCharData.location=city; currentCharData.fame=100; currentCharData.flags={}; setReputation(city,100,{notify:false}); var low={permit:useSpecialPermit(city),royal:getRoyalAuctionAccess(city)}; setReputation(city,3000,{notify:false}); var mid=getRoyalAuctionAccess(city); setReputation(city,6000,{notify:false}); var permit=useSpecialPermit(city); setReputation('洛阳',0,{notify:false}); var globalRoyal=getRoyalAuctionAccess('洛阳'); return {low:low,mid:mid,permit:permit,globalPermit:hasGlobalSpecialPermit(),globalRoyal:globalRoyal,fame:currentCharData.fame};})()""")
# Ensure minimal inventory/current character are present before opening auction UIs.
results['auction']=evaljs("""(()=>{document.getElementById('auction-modal')?.remove(); document.getElementById('royal-auction-modal')?.remove(); currentCharData.location='帝都·长安'; setReputation('帝都·长安',3000,{notify:false}); window.inventory=inventory; if(!inventory.currency) inventory.currency={spiritStones:5000,copper:0}; inventory.currency.spiritStones=Math.max(5000,inventory.currency.spiritStones||0); var n=openAuctionHouse(); var normal=!!document.getElementById('auction-modal'); document.getElementById('auction-modal')?.remove(); var r=AuctionService.openRoyal('帝都·长安'); var royal=!!document.getElementById('royal-auction-modal'); document.getElementById('royal-auction-modal')?.remove(); return {normal:normal,royal:royal,normalReturnType:typeof n,royalReturn:r};})()""")
results['panels']=evaljs("""(()=>{switchPanel('map'); var sp=ensureSectPanel(); sp.classList.remove('hidden'); switchPanel('character'); var ids=[...document.querySelectorAll('[id]')].map(e=>e.id); var c={}; ids.forEach(x=>c[x]=(c[x]||0)+1); return {sectHidden:sp.classList.contains('hidden'),sectCount:document.querySelectorAll('#sect-panel').length,duplicateIds:Object.entries(c).filter(x=>x[1]>1)};})()""")
# v18.9 世界日程面板：switchPanel('calendar') 不抛错、容器存在、WorldCalendarUI 已挂载
results['calendar']=evaljs("""(()=>{var hasUI=typeof window.WorldCalendarUI==='object' && typeof window.WorldCalendarUI.renderCalendarPanel==='function'; var hasPanel=!!document.getElementById('panel-calendar'); var hasBadge=!!document.getElementById('calendar-next-auction-badge'); var before=window.WorldCalendar?window.WorldCalendar.list().length:0; var rendered={ok:false, listChildren:0}; try { switchPanel('calendar'); rendered.ok=true; var list=document.getElementById('calendar-list'); rendered.listChildren=list?list.children.length:0; } catch(e) { rendered.ok=false; rendered.err=e.message; } return {hasUI:hasUI, hasPanel:hasPanel, hasBadge:hasBadge, rendered:rendered, worldCalendarEvents:window.WorldCalendar?window.WorldCalendar.list().length:before};})()""")
# Evaluate debug panel controls exist after rendering for admin.
results['debug']=evaljs("""(()=>{if(window.DebugPanel&&DebugPanel.renderDebugPanel) DebugPanel.renderDebugPanel(); return {cityRepInput:!!document.getElementById('debug-city-reputation'),fameInput:!!document.getElementById('debug-fame'),labelText:(document.getElementById('debug-panel')||{}).innerText||''};})()""")
# Exact regression for the reported bug: a tourist entering 修罗宫 must not even ask the romance auto-trigger to run.
results['xiuluo_gate']=evaljs("""(()=>{var old=window.maybeAutoTriggerFeiLeiEvent,calls=0; window.maybeAutoTriggerFeiLeiEvent=function(){calls++;return true;}; Object.assign(window.discipleState,{isInSect:false,sectId:null}); currentCharData=currentCharData||{}; window.currentCharData=currentCharData; currentCharData.location='修罗宫'; showSectGateScene('修罗宫'); window.maybeAutoTriggerFeiLeiEvent=old; var npc=window.npcManager&&window.npcManager.getNPC?window.npcManager.getNPC('sect_leader_修罗宫'):null; var access=false; if(npc){npc.memory=npc.memory||{};npc.memory.firstMet=false;npc.memory.meetCount=0;access=canPlayerAccessPersonalEvent(NPC_PERSONAL_EVENTS['xl_event_001'],npc);} return {autoCalls:calls,access:access,hasGate:!!document.getElementById('sect-panel')};})()""")
# v22.0 沉浸模式审计：个人事件全池可达性 + 开关默认关 + 远程不弹 + 交谈拦面板
results['event_reach']=evaljs("""(()=>{
 var pool=window.NPC_PERSONAL_EVENTS||{}; var keys=Object.keys(pool);
 var flagged=0,unflagged=0,ambient=0,noNpc=[],npcIds={};
 keys.forEach(function(k){var ev=pool[k];
  if(ev.autoTrigger)flagged++;else unflagged++;
  if(ev.ambient)ambient++;
  npcIds[ev.npcId]=(npcIds[ev.npcId]||0)+1;
  var npc=(window.npcManager&&window.npcManager.getNPC)?window.npcManager.getNPC(ev.npcId):null;
  if(!npc)noNpc.push(k+'->'+ev.npcId);});
 var sep=document.getElementById('setting-social-event-panel');
 var xl=(window.npcManager&&window.npcManager.getNPC)?window.npcManager.getNPC('sect_leader_修罗宫'):null;
 window._settings=window._settings||{};
 var hadSep=Object.prototype.hasOwnProperty.call(window._settings,'socialEventPanel');
 var savedSep=window._settings.socialEventPanel;
 delete window._settings.socialEventPanel;
 var offHtml=xl?getPersonalEventButtons(xl,'sect_leader_修罗宫'):'ERR';
 window._settings.socialEventPanel=true;
 var onHtml=xl?getPersonalEventButtons(xl,'sect_leader_修罗宫'):'';
 if(hadSep){window._settings.socialEventPanel=savedSep;}else{delete window._settings.socialEventPanel;}
 var remoteGuard=(function(){window._npcDialogIsRemote=true;var r=maybeAutoTriggerPersonalEvent('sect_leader_修罗宫','greet');window._npcDialogIsRemote=false;return r;})();
 return {total:keys.length,npcCount:Object.keys(npcIds).length,flagged:flagged,unflagged:unflagged,ambient:ambient,
  noNpcCount:noNpc.length,noNpcSample:noNpc.slice(0,10),
  hasToggle:!!sep,toggleUnchecked:sep?!sep.checked:null,
  offEmpty:offHtml==='',onNonEmpty:onHtml.length>50,
  gateFns:[typeof window.personalEventGreetGate,typeof window.tryInterceptPersonalEvent,typeof window.isEventReadyNow,typeof window.isPersonalLineFinished],
  remoteGuardFalse:remoteGuard===false};})()""")
# v22.0 交谈即入戏（确定性）：就绪的低门槛事件直接开场并拦住社交面板
results['intercept']=evaljs("""(()=>{
 var id='sect_leader_修罗宫';
 var npc=window.npcManager.getNPC(id);
 npc.memory=npc.memory||{};npc.memory.firstMet=true;npc.memory.meetCount=1;
 npc.relationship=npc.relationship||{};npc.relationship.affection=25;
 currentCharData.location='修罗宫';
 var pool=window.NPC_PERSONAL_EVENTS,expected=null,bestRank=null;
 Object.keys(pool).forEach(function(k){var ev=pool[k];
  if(ev.npcId!==id)return;
  if(!((ev.minAffection||0)<=20||!ev.autoTrigger))return;
  if(!isEventReadyNow(npc,ev,25))return;
  var m=ev.id.match(/_event_(s|d)?(\\d+)/i);var r0=ev.ambient?1:0,r1=m?parseInt(m[2],10):0;
  if(!expected||r0<bestRank[0]||(r0===bestRank[0]&&r1<bestRank[1])){expected=ev.id;bestRank=[r0,r1];}});
 document.querySelectorAll('.personal-event-modal').forEach(function(m){m.remove();});
 document.querySelectorAll('.npc-dialog-modal').forEach(function(m){m.remove();});
 window._pendingEventComplete=null;
 showNPCDialog(id);
 var modal=document.querySelector('.personal-event-modal');
 var res={expected:expected,modal:!!modal,pending:window._pendingEventComplete||null,dialogAbsent:!document.querySelector('.npc-dialog-modal')};
 if(modal)modal.remove();
 document.querySelectorAll('.npc-dialog-modal').forEach(function(m){m.remove();});
 window._pendingEventComplete=null;window._currentPersonalEvent=null;
 return res;})()""")
# Collect browser exceptions from script execution and interactions.
exceptions=[]
for e in events:
    if e.get('method')=='Runtime.exceptionThrown':
        d=e['params']['exceptionDetails']; ex=(d.get('exception') or {}).get('description') or d.get('text')
        exceptions.append({'url':d.get('url'),'line':d.get('lineNumber'),'text':ex})
    elif e.get('method')=='Log.entryAdded' and e['params']['entry'].get('level')=='error':
        en=e['params']['entry']; exceptions.append({'url':en.get('url'),'line':en.get('lineNumber'),'text':en.get('text')})
report={'loadedScripts':len(loaded),'scriptFailures':script_fail,'results':results,'browserErrors':exceptions}
checks = [
    (len(script_fail)==0, 'script injection failures'),
    (len(exceptions)==0, 'browser runtime errors'),
    (results['quest']['afterGhost']==0 and results['quest']['staticCount']==1 and results['quest']['visible'], 'quest panel lifecycle'),
    (results['reputation']['low']['permit'] is False and results['reputation']['low']['royal']['allowed'] is False, 'low city reputation gate'),
    (results['reputation']['mid']['allowed'] is True, 'royal 3000 city reputation gate'),
    (results['reputation']['permit'] is True and results['reputation']['globalPermit'] is True and results['reputation']['globalRoyal']['allowed'] is True, 'special permit/global credential'),
    (results['auction']['normal'] is True and results['auction']['royal'] is True, 'normal/royal auction UI'),
    (results['panels']['sectHidden'] is True and results['panels']['sectCount']==1 and not results['panels']['duplicateIds'], 'dynamic panel lifecycle/unique IDs'),
    (results['debug']['cityRepInput'] is True and results['debug']['fameInput'] is True, 'debug reputation controls'),
    (results['xiuluo_gate']['autoCalls']==0 and results['xiuluo_gate']['access'] is False, 'xiuluo tourist personal-event gate'),
    (results['event_reach']['total']>0 and results['event_reach']['noNpcCount']==0, 'every personal event maps to a live NPC (sample: %s)' % results['event_reach']['noNpcSample']),
    (results['event_reach']['hasToggle'] is True and results['event_reach']['toggleUnchecked'] is True, 'social-event-panel toggle exists and defaults off'),
    (results['event_reach']['offEmpty'] is True and results['event_reach']['onNonEmpty'] is True, 'event list hidden in immersive mode, restored when toggled on'),
    (results['event_reach']['gateFns']==['function','function','function','function'], 'conversation event gate functions exported'),
    (results['event_reach']['remoteGuardFalse'] is True, 'remote profile view never pops greet events'),
    (results['intercept']['expected'] is not None and results['intercept']['modal'] is True and results['intercept']['dialogAbsent'] is True and results['intercept']['pending']==results['intercept']['expected'], 'ready low-gate event intercepts the social panel on conversation'),
    (results['calendar']['hasUI'] is True and results['calendar']['hasPanel'] is True and results['calendar']['hasBadge'] is True, 'world-calendar UI loaded'),
    (results['calendar']['rendered']['ok'] is True and results['calendar']['rendered']['err'] is None, 'switchPanel(calendar) renders without error'),
]
failed=[name for ok,name in checks if not ok]
if failed:
    print(json.dumps(report,ensure_ascii=False,indent=2))
    ws.close()
    raise SystemExit('FAIL: '+', '.join(failed))
print('OK: Chromium DOM smoke passed; local scripts=%d; browser errors=0; quest/permit/auction/panel/debug/xiuluo/calendar/immersion gates passed; personal events: total=%d flagged=%d unflagged=%d ambient=%d, all mapped to live NPCs' % (len(loaded), results['event_reach']['total'], results['event_reach']['flagged'], results['event_reach']['unflagged'], results['event_reach']['ambient']))
ws.close()
