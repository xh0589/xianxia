// ==================== npc-daily-life.js - NPC日程可见性 ====================
// 地图上显示NPC路径+状态、NPC之间互动
// 依赖：npcs/npc-system.js (NPCManager, NPC)
// 加载顺序：在 npc-system.js 之后

// ============ NPC状态描述 ============
function getNPCActivityDescription(npc) {
    if (!npc) return '';
    var activity = npc.state?.currentActivity || '空闲';
    var location = npc.state?.location || npc.location || '未知';
    var mood = npc.state?.mood ?? 50;
    var moodStr = mood > 70 ? '心情不错' : (mood < 30 ? '情绪低落' : '平静');
    return npc.name + '（' + moodStr + '）在' + location + '【' + activity + '】';
}

// ============ 获取附近NPC列表 ============
function getNearbyNPCsDescription(currentLocation) {
    if (!window.npcManager) return [];
    var all = window.npcManager.getAllNPCs() || [];
    return all.filter(function(n) {
        return n.location === currentLocation || n.state?.location === currentLocation;
    });
}

// ============ NPC之间互动检测 ============
var npcMeetingLog = {};

function checkNPCMeetings() {
    if (!window.npcManager) return;
    var npcs = window.npcManager.getAllNPCs() || [];
    // 按地点分组
    var byLocation = {};
    for (var i = 0; i < npcs.length; i++) {
        var loc = npcs[i].state?.location || npcs[i].location || 'unknown';
        if (!byLocation[loc]) byLocation[loc] = [];
        byLocation[loc].push(npcs[i]);
    }
    // 检查同一地点是否有多个NPC
    for (var loc in byLocation) {
        var group = byLocation[loc];
        if (group.length >= 2) {
            var pairKey = group[0].id + '_' + group[1].id;
            var lastMeeting = npcMeetingLog[pairKey] || 0;
            var gameDay = window.gameTime ? window.gameTime.currentDay : 0;
            if (gameDay > lastMeeting) {
                npcMeetingLog[pairKey] = gameDay;
                var meetingText = group[0].name + '和' + group[1].name + '在' + loc + '相遇了。';
                if (window.showMessage) {
                    // 10%概率显示
                    if (Math.random() < 0.1) {
                        window.showMessage('👥 ' + meetingText, 'info');
                    }
                }
                // 轻微影响情绪
                if (group[0].state) group[0].state.mood = Math.min(100, (group[0].state.mood ?? 50) + 1);
                if (group[1].state) group[1].state.mood = Math.min(100, (group[1].state.mood ?? 50) + 1);
            }
        }
    }
}

// ============ 在地图上渲染NPC位置 ============
function renderNPCMapIcons(mapContainer) {
    if (!mapContainer || !window.npcManager) return;
    var npcs = window.npcManager.getAllNPCs() || [];
    var currentLoc = window.currentCharData?.location || '';
    for (var i = 0; i < npcs.length; i++) {
        var n = npcs[i];
        if (n.location === currentLoc || n.state?.location === currentLoc) {
            var icon = document.createElement('div');
            icon.className = 'absolute text-lg cursor-pointer hover:scale-125 transition-transform';
            icon.style.left = (10 + Math.random() * 80) + '%';
            icon.style.top = (10 + Math.random() * 80) + '%';
            icon.title = n.name + ' - ' + (n.state?.currentActivity || '空闲');
            icon.textContent = n.appearance?.icon || '👤';
            icon.onclick = function() { if (typeof window.showNPCDialog === 'function') window.showNPCDialog(n.id); };
            mapContainer.appendChild(icon);
        }
    }
}

// ============ W-3 接线：把上面这层图标真正挂到野外地图上 ============
// 动手前查清的三件事：
//   ① 签名：renderNPCMapIcons(mapContainer) 吃的是**元素**（不是 id 字符串），无返回值，只 append 子节点。
//   ② 容器：野外地图本体是 <svg id="random-map-svg">（randomMap.js initRandomMap :4666 把 mapContainer
//      指向它）。**HTML 的 div 塞进 SVG 里浏览器不画**（SVG 只渲染 SVG 命名空间的子节点），
//      所以不能直接把 svg 传进去——另起一层 HTML 覆层，贴着 SVG 的盒子摆。
//      仙侠.html 属禁改清单，覆层由本文件运行时建，不动 HTML。
//   ③ 时机：randomMap.js（仙侠.html:1993）先于本文件（:2096）加载，window.renderMap 在本文件装载时已在。
//      openWildernessMap 先 section.classList.remove('hidden')（:4688）后 initRandomMap→renderMap（:4720），
//      所以钩子跑的时候地图已经可见，量得到真实宽高。
//   ⚠️ 两处必须自己兜住、renderNPCMapIcons 自己不管的：
//      · 它用 (10 + Math.random()*80)% 随机撒点且只 append 不清——每次刷新都调会把图标叠成一堆、
//        而且每 pan 一下位置就重掷、图标乱跳。故按「本城 NPC 名单签名」判重，名单没变就不重画。
//      · 覆层若不吃指针事件，会把地图自己的左键规划路线／右键看脚下全吃掉；
//        整层 pointer-events:none，单个图标再单独打开。
var NPC_ICON_LAYER_ID = 'npc-map-icon-layer';

function npcIconLayer() {
    var svg = document.getElementById('random-map-svg');
    if (!svg || !svg.parentNode) return null;
    var host = svg.parentNode;
    if (!host.style) return null;
    if (!host.style.position) host.style.position = 'relative'; // 覆层需要定位祖先；只设一次，不覆盖已有定位
    var layer = document.getElementById(NPC_ICON_LAYER_ID);
    if (!layer) {
        layer = document.createElement('div');
        layer.id = NPC_ICON_LAYER_ID;
        layer.className = 'absolute';
        layer.style.pointerEvents = 'none';
        host.insertBefore(layer, svg.nextSibling);
    }
    // 贴着 SVG 的盒子摆，别盖住 SVG 下面那行说明文字。
    // ⚠️ 必须用 getBoundingClientRect，**不能用 offsetLeft/offsetWidth**：
    //   那几个是 HTMLElement 的属性，<svg> 是 SVGElement（继承 Element），**压根没有**，
    //   读出来是 undefined ⇒ `undefined + 'px'` 是非法 CSS，浏览器把整条赋值默默丢掉，
    //   覆层就成了没有宽高的 0×0 空壳——DOM 里有节点、屏幕上什么都没有，正是「看不见」的一种。
    //   （假 DOM 里给 svg 补上 offset* 会把这条盖掉，别补。）
    // ⚠️ 地图还没排版时（面板还藏着）量到的是 0×0，此时不画：位置是百分比，画在 0 尺寸的层上没有意义。
    var hostRect = host.getBoundingClientRect ? host.getBoundingClientRect() : null;
    var svgRect = svg.getBoundingClientRect ? svg.getBoundingClientRect() : null;
    if (!svgRect || !svgRect.width || !svgRect.height) return null;
    layer.style.left = (svgRect.left - (hostRect ? hostRect.left : 0) + (host.scrollLeft || 0)) + 'px';
    layer.style.top = (svgRect.top - (hostRect ? hostRect.top : 0) + (host.scrollTop || 0)) + 'px';
    layer.style.width = svgRect.width + 'px';
    layer.style.height = svgRect.height + 'px';
    return layer;
}

// 本城 NPC 的可见签名（含心情读数）：只有这串变了才重画
function npcIconSignature() {
    if (!window.npcManager) return '';
    var npcs = window.npcManager.getAllNPCs() || [];
    var cur = window.currentCharData?.location || '';
    var seen = [];
    for (var i = 0; i < npcs.length; i++) {
        var n = npcs[i];
        if (n.location === cur || n.state?.location === cur) {
            seen.push(n.id + ':' + Math.round(n.state?.mood ?? 50));
        }
    }
    seen.sort();
    return cur + '|' + seen.join(',');
}

function refreshNPCMapIcons() {
    var layer = npcIconLayer();
    if (!layer) return;
    var sig = npcIconSignature();
    // 地图还没排版（0×0）时 npcIconLayer 已返回 null；这里再判一次「层是空的」，
    //   免得上一帧的名单签名留着、这一帧地图刚打开却不再画。
    if (layer.dataset && layer.dataset.npcSig === sig) return; // 同一批人：不重掷位置，免得图标乱跳
    if (layer.dataset) layer.dataset.npcSig = sig;
    layer.innerHTML = ''; // renderNPCMapIcons 只 append 不清，不清会叠成一堆
    renderNPCMapIcons(layer);
    var kids = layer.children || [];
    for (var i = 0; i < kids.length; i++) {
        if (kids[i].style) kids[i].style.pointerEvents = 'auto'; // 整层不吃指针，图标要吃
    }
}

// 接在 renderMap 后面（与本文件上方 patchNPCUpdate 同一个写法）
(function patchRenderMapForNPCIcons() {
    var orig = window.renderMap;
    if (typeof orig !== 'function') return;
    window.renderMap = function () {
        var out = orig.apply(this, arguments);
        try { refreshNPCMapIcons(); } catch (e) { console.warn('[NPC地图图标] 覆层刷新失败:', e); }
        return out;
    };
})();

// ============ 集成到NPC AI更新中 ============
(function patchNPCUpdate() {
    var origUpdate = window.npcManager?.updateAll;
    if (origUpdate) {
        var manager = window.npcManager;
        manager.updateAll = function(deltaTime) {
            var result = origUpdate.call(this, deltaTime);
            try { checkNPCMeetings(); } catch(e) {}
            return result;
        };
    }
})();

// ============ 导出 ============
if (typeof window !== 'undefined') {
    window.getNPCActivityDescription = getNPCActivityDescription;
    window.getNearbyNPCsDescription = getNearbyNPCsDescription;
    window.checkNPCMeetings = checkNPCMeetings;
    window.renderNPCMapIcons = renderNPCMapIcons;
    window.refreshNPCMapIcons = refreshNPCMapIcons;
}