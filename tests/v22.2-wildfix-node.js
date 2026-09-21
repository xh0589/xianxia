// ==================== v22.2 野外三修验收 ====================
// 玩家报三 BUG：①野外格子上的实体图标吃掉点击——必须像素级瞄准图标外的地块才能走路；
// ②小概率走一格就弹出社交面板；③野外遇到的人点交谈被判「你与某某并不在一处——隔空喊话是听不见的」。
// 根因：①实体图标/POI/玩家棋子画在可点击格子组之外的上层，SVG 命中即吞点击；
//       ②情绪主动行为（寻求安慰）零地点校验——赶路跨 6 小时档，天下任何角落一个心情低落者都能隔空顶开面板；
//       ③野外临时 NPC 构造时不传 location，默认落 'unknown'，同地校验必判异地。
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');

let passed = 0; const failures = [];
function ok(cond, msg) { if (cond) { passed++; } else { failures.push(msg); console.log('  ✗ ' + msg); } }
function eq(a, b, msg) { ok(a === b, msg + '（实得 ' + a + '，期望 ' + b + '）'); }
function read(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// ============ A 点击穿透：图上每一层叠在格子上的东西都不许吃点击 ============
{
    const rm = read('js/map/randomMap.js');
    // 实体图标（含 +N 角标）
    ok(/const t = svgEl\('text', \{ x: ex, y: ey[^}]*'pointer-events': 'none' \}\);/.test(rm), 'A1 实体图标点击穿透');
    ok(/const b = svgEl\('text', \{ x: x \* size \+ size - 6[^}]*'pointer-events': 'none' \}\);/.test(rm), 'A2 「+N」角标点击穿透');
    // POI 图标组
    ok(/function drawPoi[\s\S]{0,800}const g = svgEl\('g', \{ 'pointer-events': 'none' \}\);/.test(rm), 'A3 POI 图标组点击穿透');
    // 玩家棋子
    ok(/const g = svgEl\('g', \{ 'class': 'wild-player', 'pointer-events': 'none' \}\);/.test(rm), 'A4 「我」的棋子点击穿透（点自己=查看脚下格）');
    // 原有穿透层未被误伤：天象/路径预览/天时题跋仍在
    ok((rm.match(/'pointer-events': 'none'/g) || []).length >= 10, 'A5 穿透层总数≥10（天象/路径/题跋等原有穿透未被误删）');
    // 格子本体仍可点：第九十五波·NEW-07 把逐格监听改成 svg 一处委托（落在图标/缝隙/合成事件也能反算到格子），
    // 保证不变的是「点格子必达 onCellClick」——格子组打上 data-cx/cy，委托处理器 closest 命中后转调 onCellClick
    ok(rm.indexOf("g.setAttribute('data-cx', x)") >= 0 && rm.indexOf('_bindMapDelegation') >= 0
        && rm.indexOf("closest('g[data-cx]')") >= 0 && rm.indexOf('onCellClick(c.x, c.y)') >= 0,
        'A6 格子点击改委托后仍必达 onCellClick（NEW-07）');
}

// ============ B 情绪主动行为的同地闸（源码 + 运行时） ============
{
    const em = read('js/npcs/npc-emotions.js');
    ok(/function executeEmotionAction\(npc\) \{[\s\S]{0,700}npcNotCoLocated\(npc\)\) return;/.test(em),
        'B1 情绪主动行为先过同地闸');

    // 运行时：异地的低落者不再隔空顶开社交面板，同地的照常
    const sb = {
        console: { log() {}, warn() {}, error() {} },
        Math, JSON, Date, Object, Array, String, Number, Boolean, RegExp, Error, parseInt, parseFloat, isNaN, isFinite
    };
    sb.window = sb; sb.globalThis = sb;
    sb.__random = 0.01; // 强制命中 20% 寻求安慰分支
    sb.Math = Object.assign(Object.create(Math), { random: () => sb.__random });
    sb.__dialogs = [];
    sb.showNPCDialog = function (id) { sb.__dialogs.push(id); };
    sb.__msgs = [];
    sb.showMessage = function (t) { sb.__msgs.push(String(t)); };
    sb.currentCharData = { name: '测试修士', location: '洛水城' };
    sb.timeSystem = { advanceTime() {}, gameTime: { currentHour: 12 } };
    // 同地判定：与 npc-system.js 的 npcNotCoLocated 同口径（简化版）
    sb.npcNotCoLocated = function (npc) {
        if (!npc || !sb.currentCharData || !sb.currentCharData.location) return false;
        if (npc.isFollowing) return false;
        var pl = String(sb.currentCharData.location), nl = String(npc.location || '');
        if (!nl) return false;
        if (pl === nl) return false;
        if (pl.indexOf(nl) >= 0 || nl.indexOf(pl) >= 0) return false;
        return true;
    };
    vm.createContext(sb);
    vm.runInContext(read('js/npcs/npc-emotions.js'), sb, { filename: 'npc-emotions.js' });

    function sadNpc(id, loc) {
        return {
            id: id, name: '某人', location: loc, isFollowing: false,
            state: { mood: 30, stress: 40 },
            recordPlayerAction() {}, changeAffection() {}
        };
    }
    sb.__dialogs.length = 0;
    sb.executeEmotionAction(sadNpc('far_1', '帝都 · 长安'));
    eq(sb.__dialogs.length, 0, 'B2 异地的低落者：社交面板不弹（旧版此处必弹）');
    sb.executeEmotionAction(sadNpc('near_1', '洛水城'));
    eq(sb.__dialogs.length, 1, 'B3 同在洛水城的低落者：照常来寻安慰');
    eq(sb.__dialogs[0], 'near_1', 'B3b 弹的正是眼前这位');
    // 位置为空的 NPC（旧档脏数据）不被同地闸误杀——npcNotCoLocated 对空位置放行
    sb.__dialogs.length = 0;
    sb.executeEmotionAction(sadNpc('null_loc', ''));
    eq(sb.__dialogs.length, 1, 'B4 位置缺失者不误杀（与全局同地口径一致：空位置放行）');
}

// ============ C 野外临时 NPC 的位置钉扎 ============
{
    const app = read('js/app.js');
    // 构造时带 location
    ok(/function openNpcDeepTalk\(\)[\s\S]{0,1600}new window\.NPC\(tempId, name, \{[\s\S]{0,600}location: \(window\.currentCharData && window\.currentCharData\.location\)/.test(app),
        'C1 野外详谈建的临时 NPC 构造即钉在玩家所在处');
    // 旧档 'unknown' 归位
    ok(/openNpcDeepTalk[\s\S]{0,2600}npc\.location === 'unknown'[\s\S]{0,300}npc\.location = /.test(app),
        'C2 旧档里 location=unknown 的临时人就地归位');
    // NPC 构造默认值确为 'unknown'（钉扎必要性的根证）
    ok(read('js/npcs/npc-system.js').indexOf("this.location = options.location || 'unknown';") >= 0,
        'C3 根证：NPC 构造不传位置默认落 unknown（同地校验必判异地）');
    // 深谈入口的同地校验仍在（不误伤真人远程防线）
    ok(read('js/npcs/npc-system.js').indexOf('if (npcNotCoLocated(npc)) { showMessage(\'你与\' + npc.name + \'并不在一处——隔空喊话是听不见的。\'') >= 0,
        'C4 深谈同地校验原样保留（只修位置数据，不拆防线）');
}

// ============ 汇总 ============
console.log('v22.2-wildfix: ' + passed + ' passed, ' + failures.length + ' failed');
if (failures.length > 0) process.exit(1);
console.log('v22.2-wildfix: all green');
