/**
 * dao-bridge.js — 道侣名册的桥（v20.24）
 *
 * 背景（审计 D1）：全游戏"结为道侣"有三条路——八条主角线终章落 dao_companion 旗、
 * 深谈 bond_dao 落旗、（理论上）formBond 写名册——但前两条只落旗、从不写
 * currentCharData.bonds；而双修/合击/随行护持/渡劫护法/子嗣/洞府同居/情缘成就/
 * 混沌之主结局全读 bonds。两半从未焊上，婚后制度整栋悬空。
 *
 * 本桥只做三件事：
 *   ① ensureDaoBond(npcId)：结契落笔的单一写点——幂等补写 bonds + 请 NPC 家谱系统记名，
 *      不做好感门槛（门槛属于求婚路径，这里只是记账）；
 *   ② daoCompanionSweep()：旧档补票——存档里旗已落、册上无名的，进门时照写
 *      （补票不补酒钱：只把既有旗翻译成名册条目，不另发任何奖励）；
 *   ③ 道侣相约：有名册有道侣后，偶有帖子递到（日历"约定"栏），到期赴约涨好感、
 *      爽约伤好感——约会占时辰，不是白点。
 *
 * 存档纪律：只写既有 bonds 字段内的对象，零新增存档键；日历走 WorldCalendar 既有通道。
 */
(function (global) {
    'use strict';

    function _day() {
        try {
            if (typeof global.getAbsoluteDay === 'function') {
                var d = Number(global.getAbsoluteDay());
                if (isFinite(d) && d > 0) return d;
            }
            if (global.timeSystem && typeof global.timeSystem.getAbsoluteDay === 'function') {
                var t = Number(global.timeSystem.getAbsoluteDay());
                if (isFinite(t) && t > 0) return t;
            }
        } catch (e) {}
        return 1;
    }

    function _log(msg, type) {
        if (global.gameLog && typeof global.gameLog.add === 'function') global.gameLog.add(msg, type || 'info');
    }

    /** v20.25 人称随人走：道侣是男子就写"他"——旧版硬编码女字旁，男主道侣全被写成"她" */
    function _ta(npc) {
        return (npc && npc.gender === 'male') ? '他' : '她';
    }

    function ensureDaoBond(npcId, opts) {
        opts = opts || {};
        if (!npcId || !global.currentCharData || !global.npcManager) return false;
        var npc = global.npcManager.getNPC(npcId);
        if (!npc) return false;
        var cd = global.currentCharData;
        cd.bonds = cd.bonds || {};
        var existing = cd.bonds[npcId];
        if (existing && existing.type === 'dao_companion') return false; // 册上已有名，幂等
        cd.bonds[npcId] = {
            type: 'dao_companion',
            name: npc.name || String(npcId),
            since: (typeof Date !== 'undefined' && Date.now) ? Date.now() : 0,
            day: _day(),
            lastMetDay: _day()
        };
        if (typeof npc.setFlag === 'function') { try { npc.setFlag('dao_companion'); } catch (e) {} }
        // v20.36 深情账：许下终身的一刻，深情自有底（后续靠真诚里程碑往上积）
        if (npc.relationship) npc.relationship.love = Math.max(Number(npc.relationship.love) || 0, 30);
        // v20.48 修断线：族谱导出名是 NpcLineage（npc-lineage.js），此前误拼 NPCLineage —— 恒 undefined，
        // 结契永远登不进族谱，「道侣婚配/开枝散叶」整条链空转。两拼写都认，兼容未来改名。
        var _lineage = global.NpcLineage || global.NPCLineage;
        if (_lineage && typeof _lineage.recordPlayerDaoCompanion === 'function') {
            try { _lineage.recordPlayerDaoCompanion(npcId); } catch (e) {}
        }
        if (!opts.silent) _log('📜 道侣名册落笔：' + (npc.name || npcId) + '——自今日起，双修、随行、护法诸事俱有凭据。', 'success');
        return true;
    }

    /** 旧档补票：旗已落、册无名的，翻译成名册条目（幂等，不发现金） */
    function daoCompanionSweep() {
        if (!global.npcManager || typeof global.npcManager.getAllNPCs !== 'function') return 0;
        var fixed = 0;
        var all = global.npcManager.getAllNPCs() || [];
        for (var i = 0; i < all.length; i++) {
            var npc = all[i];
            if (!npc) continue;
            var flagged = false;
            try {
                if (typeof npc.hasFlag === 'function') flagged = npc.hasFlag('dao_companion');
                else if (npc.relationship && npc.relationship.flags) {
                    flagged = npc.relationship.flags.has ? npc.relationship.flags.has('dao_companion') : !!npc.relationship.flags['dao_companion'];
                }
            } catch (e) {}
            if (!flagged) continue;
            if (ensureDaoBond(npc.id || npc.npcId, { silent: true })) fixed++;
        }
        if (fixed > 0) _log('旧档补记：' + fixed + ' 段早年的道侣之盟补登名册——婚礼旧账，今日认讫。', 'info');
        return fixed;
    }

    // ============ 道侣相约（日历"约定"栏的第一位常客） ============
    var DATE_SYSTEM = 'dao_companion_date';

    function _pendingDate() {
        var W = global.WorldCalendar;
        if (!W || typeof W.getNextByCategory !== 'function') return null;
        try { return W.getNextByCategory('npc_appointment'); } catch (e) { return null; }
    }

    /** 每日钩子：册上有道侣、且没有待赴的约——偶有帖子递到（rng 可注入测试） */
    function daoDateTick() {
        var W = global.WorldCalendar;
        if (!W || typeof W.register !== 'function') return false;
        var bonds = (global.currentCharData && global.currentCharData.bonds) || {};
        var daoIds = [];
        for (var id in bonds) { if (bonds[id] && bonds[id].type === 'dao_companion') daoIds.push(id); }
        if (!daoIds.length) return false;
        if (_pendingDate()) return false; // 已有约在身，不叠帖
        var rng = (typeof global.__dateRng === 'function') ? global.__dateRng() : Math.random();
        if (rng >= 0.18) return false;
        // v20.25 多位道侣轮着发（按日轮转，不掷骰子）——旧版只请得动名册头一位，余者无名无分
        daoIds.sort();
        var npcId = daoIds[_day() % daoIds.length];
        var npc = global.npcManager && global.npcManager.getNPC ? global.npcManager.getNPC(npcId) : null;
        var name = (npc && npc.name) || (bonds[npcId] && bonds[npcId].name) || '你的道侣';
        var r = W.register({
            id: 'dao_date_' + npcId + '_' + _day(),
            title: '赴约：' + name + ' 邀你湖上同游',
            category: 'npc_appointment',
            dueAbsoluteDay: _day() + 2,
            source: { system: DATE_SYSTEM, refId: npcId },
            severity: 'remind',
            payload: { npcId: npcId, name: name }
        });
        if (r && r.ok) {
            _log('💌 ' + name + ' 遣人送来一帖：后日湖上相候，同看春水。', 'info');
            return true;
        }
        return false;
    }

    /** 赴约：只占时辰，换实打实的好感与"记得你来过"。
     *  v20.29 现实化：游玩本身不榨精力——若道侣在别处，出发的力气
     *  由正常赶路账（步行/骑马/御剑/传送阵）去结，点帖子不重复收税。 */
    function daoDateAccept(payload) {
        var p = payload || {};
        var cd = global.currentCharData;
        if (!cd) return false;
        var npc = global.npcManager && p.npcId ? global.npcManager.getNPC(p.npcId) : null;
        if (!npc) return false;
        if (typeof npc.changeAffection === 'function') npc.changeAffection(5);
        // v20.33 信任涨路：赴约即到场，到场即真——信任+1（0~100 同井）
        if (npc.relationship) npc.relationship.trust = Math.max(0, Math.min(100, (Number(npc.relationship.trust) || 0) + 1));
        var bond = (cd.bonds && cd.bonds[p.npcId]) || null;
        if (bond) bond.lastMetDay = _day();
        if (npc._companionData) npc._companionData.lastInteraction = _day();
        _log('湖上烟水如织。' + _ta(npc) + '说到第三刻你还在赶来——终究是来了，伞下两人并肩走了整段苏堤。（耗时半日，好感+5，信任+1）', 'success');
        if (global.timeSystem && typeof global.timeSystem.advanceTime === 'function') global.timeSystem.advanceTime(30, '湖上赴约');
        return true;
    }

    /** 爽约：人等到散灯，好感真掉——帖子上没有的事不发生 */
    function daoDateStand(payload, reasonMsg) {
        var p = payload || {};
        var npc = global.npcManager && p.npcId ? global.npcManager.getNPC(p.npcId) : null;
        if (!npc) return false;
        if (typeof npc.changeAffection === 'function') npc.changeAffection(-4);
        _log(reasonMsg || ('帖子上的时辰过了。下人回话说你不在，' + _ta(npc) + '在亭里坐到散灯。（好感-4）'), 'warning');
        return true;
    }

    function _dateChoice(event) {
        var payload = (event && event.payload) || {};
        if (typeof global.showModal === 'function') {
            var safeId = String(payload.npcId || '').replace(/[^A-Za-z0-9_一-鿿\-]/g, '');
            var body = '<p class="text-xs text-gray-400 mb-2">' + ((event && event.title) || '道侣之约') + '——帖子上的时辰到了。</p>' +
                '<div style="display:flex;gap:8px"><button onclick="daoDateAcceptBy(\'' + safeId + '\')" class="bg-rose-800 hover:bg-rose-700 text-xs px-3 py-2 rounded">🛶 收拾一下就赴约（耗时半日，好感+5·信任+1）</button>' +
                '<button onclick="daoDateStandBy(\'' + safeId + '\')" class="bg-stone-700 hover:bg-stone-600 text-xs px-3 py-2 rounded">📄 俗务缠身，帖子误了（好感-4）</button></div>';
            global.showModal('💌 湖上有约', body);
            return true;
        }
        // 无弹窗环境（如自动化环境）：玩得起时辰就去——不留悬账
        return daoDateAccept(payload); // v20.25 误帖走爽约通道（人称随道侣性别说），赴约不再看精力
    }

    /** 弹窗按钮用的薄封装（onclick 只传 NPC id） */
    function daoDateAcceptBy(npcId) { return daoDateAccept({ npcId: npcId }); }
    function daoDateStandBy(npcId) { return daoDateStand({ npcId: npcId }); }

    // 到期裁决：日历说日子到了，这里决定"赴"与"误"
    if (global.WorldCalendar && typeof global.WorldCalendar.subscribe === 'function') {
        global.WorldCalendar.subscribe(function (event) {
            if (!event) return;
            if (event.category !== 'npc_appointment') return;
            if (!event.source || event.source.system !== DATE_SYSTEM) return;
            _dateChoice(event);
        });
    }
    // 每日发帖钩子：有 EventBus 就挂日历同频的新日钩，另导出供测试/无总线环境直调
    if (global.EventBus && typeof global.EventBus.on === 'function') {
        global.EventBus.on('newDay', function () { try { daoDateTick(); } catch (e) {} });
    }

    global.ensureDaoBond = ensureDaoBond;
    global.daoCompanionSweep = daoCompanionSweep;
    global.daoDateTick = daoDateTick;
    global.daoDateAccept = daoDateAccept;
    global.daoDateStand = daoDateStand;
    global.daoDateAcceptBy = daoDateAcceptBy;
    global.daoDateStandBy = daoDateStandBy;
})(typeof window !== 'undefined' ? window : this);
