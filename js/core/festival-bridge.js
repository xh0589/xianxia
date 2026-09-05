/**
 * festival-bridge.js — 节日的帖（v20.28）
 *
 * 设计动机：情侣撞破彼此本就极不现实，吃醋的根应当是"时间挤不出双倍"。
 * 于是节日一年定点四场（上元灯节/七夕/中秋/除夕），节前两天，名册上
 * 每一位道侣各发一帖——人人有帖、一夜只有一人陪得到，其余人收的是
 * 一句真话，不是一次随机穿帮。
 *
 * 世界规则（无一例"日限"型配额；v20.29 现实化：游玩本身不榨精力）：
 *   陪 Ta 过节   占一整日时辰、好感+8（比平日湖上一约重——节是节；
 *                Ta 若在别处，出发的力气由正常赶路账去结，点帖不重复收税）
 *   好言推掉     好感-3（推辞是清白账）
 *   已许别人     好感-4（帖子你先递，夜你自己说不要的）
 *   装死不回     好感-5（从日头等到掌灯，连一句推辞都没有）
 *   两头都应     好感-6 且第二场不许赴（原来你的节是拆开卖的）
 *
 * 存档纪律：账本只写进 bonds 既有条目内部的 festival 格（与 lastMetDay
 * 同一间屋，按 节_年 分格），零新增存档键；帖子走 WorldCalendar
 * 'npc_appointment' 既有通道。
 */
(function (global) {
    'use strict';

    var FEST_SYSTEM = 'dao_companion_festival';
    var LEAD_DAYS = 2;      // 节前两天发帖
    var ACCEPT_TIME = 60;   // 时辰——一整日（唯一的真代价：一夜只有这一夜）

    // 世界历：每 30 天一月，12 月一年。month/day 折成岁内日序。
    var FESTIVALS = [
        { key: 'shangyuan', name: '上元灯节', doy: 1,
          accept: '上元灯节，满城花灯。{name}提着走马灯在人堆里等你——灯影里{ta}眼里只有你这一盏。',
          lonely: '推了帖子的当晚，灯市依旧喧闹。{name}一个人提着灯从东市走到西市，灯里的蜡烛烧到了底。' },
        { key: 'qixi', name: '七夕', doy: (7 - 1) * 30 + 7,
          accept: '七夕今宵。{name}在鹊桥下摆了两盏茶，另有一盏是给月老的。',
          lonely: '七夕夜，{name}把两盏茶都喝了——{ta}说，月老那盏{ta}替它喝。' },
        { key: 'zhongqiu', name: '中秋', doy: (8 - 1) * 30 + 15,
          accept: '中秋月满。{name}把月饼切成两半，大的那半推给你。',
          lonely: '中秋的月亮很圆。{name}把月饼切了两半，小的那半留给自己，大的那半搁了三天没动。' },
        { key: 'chuxi', name: '除夕', doy: 360,
          accept: '除夕守岁。{name}陪你坐到爆竹声歇，新年的头一炷香是两个人一起上的。',
          lonely: '除夕的爆竹响起来时，{name}面前摆着两副碗筷。收走一副的时候，{ta}的手很稳。' }
    ];

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

    function _ta(npc) { return (npc && npc.gender === 'male') ? '他' : '她'; }

    function _daoIds() {
        var bonds = (global.currentCharData && global.currentCharData.bonds) || {};
        var out = [];
        for (var id in bonds) { if (bonds[id] && bonds[id].type === 'dao_companion') out.push(id); }
        out.sort();
        return out;
    }

    function _fmt(tpl, npc, name) {
        return String(tpl).replace(/\{name\}/g, name || '你的道侣').replace(/\{ta\}/g, _ta(npc));
    }

    function _yearIdx(d) { return Math.floor((d - 1) / 360); }

    function _fkey(key, yearIdx) { return key + '_' + yearIdx; }

    function _defOf(fkey) {
        var key = String(fkey).split('_')[0];
        for (var k = 0; k < FESTIVALS.length; k++) { if (FESTIVALS[k].key === key) return FESTIVALS[k]; }
        return null;
    }

    function _npcOf(id) {
        return (global.npcManager && global.npcManager.getNPC) ? global.npcManager.getNPC(id) : null;
    }

    /** 名册条目里的节日账格：按「节_年」分格，只留当年与上年，不涨存单 */
    function _festLedger(bond, year) {
        if (!bond.festival || typeof bond.festival !== 'object') bond.festival = {};
        for (var k in bond.festival) {
            var y = parseInt(String(k).split('_')[1], 10);
            if (isFinite(y) && y < year - 1) delete bond.festival[k];
        }
        return bond.festival;
    }

    // ============ 每日钩子 ============

    function _festivalSweep() {
        // 上一场节已过、帖还悬着没回——人从日头等到掌灯，这是最重的一档
        var today = _day(), n = 0;
        var ids = _daoIds();
        for (var i = 0; i < ids.length; i++) {
            var fes = global.currentCharData.bonds[ids[i]].festival || {};
            for (var k in fes) {
                var ent = fes[k];
                if (!ent || ent.status !== 'invited') continue;
                if (!(ent.dueDay > 0 && ent.dueDay < today)) continue;
                var npc = _npcOf(ids[i]);
                var fname = ent.fname || '那个节';
                if (npc && typeof npc.changeAffection === 'function') npc.changeAffection(-5);
                ent.status = 'stood';
                _log(fname + '那日从日头正中等到掌灯上檐，帖子上的时辰过了又过。你终究没来，连一句推辞都没有。' + ((npc && npc.name) || '') + '（好感-5）', 'warning');
                n++;
            }
        }
        return n;
    }

    function festivalTick() {
        _festivalSweep();
        var W = global.WorldCalendar;
        if (!W || typeof W.register !== 'function') return false;
        var today = _day(), year = _yearIdx(today), posted = false;
        var ids = _daoIds();
        if (!ids.length) return false;
        for (var f = 0; f < FESTIVALS.length; f++) {
            var fest = FESTIVALS[f];
            var festYear = year, abs = year * 360 + fest.doy;
            if (abs - today < 1) { festYear = year + 1; abs = festYear * 360 + fest.doy; } // 岁尾也看得见来年开年的节
            var lead = abs - today;
            if (lead < 1 || lead > LEAD_DAYS) continue;
            for (var i = 0; i < ids.length; i++) {
                var npcId = ids[i];
                var bond = global.currentCharData.bonds[npcId];
                var ledger = _festLedger(bond, year);
                var fkey = _fkey(fest.key, festYear);
                if (ledger[fkey]) continue; // 本年此节已有账（请过/陪过/推过）
                var npc = _npcOf(npcId);
                var name = (npc && npc.name) || (bond.name || '你的道侣');
                var r = W.register({
                    id: 'fest_' + festYear + '_' + fest.key + '_' + npcId,
                    title: fest.name + '之约：' + name + ' 邀你同过',
                    category: 'npc_appointment',
                    dueAbsoluteDay: abs,
                    source: { system: FEST_SYSTEM, refId: npcId },
                    severity: 'remind',
                    payload: { npcId: npcId, name: name, fkey: fest.key, fname: fest.name, year: festYear, dueDay: abs }
                });
                if (r && r.ok) {
                    ledger[fkey] = { status: 'invited', dueDay: abs, fname: fest.name };
                    _log('🏮 ' + name + ' 遣人送来' + fest.name + '的帖子：那夜想与你同过，帖到在先，去留随你。', 'info');
                    posted = true;
                }
            }
        }
        return posted;
    }

    // ============ 裁决 ============

    var _lastModalKey = '';

    function _invitedOf(fkey) {
        var out = [];
        var ids = _daoIds();
        for (var i = 0; i < ids.length; i++) {
            var ent = (global.currentCharData.bonds[ids[i]].festival || {})[fkey];
            if (ent && ent.status === 'invited') out.push(ids[i]);
        }
        return out;
    }

    function _resolveOthers(fkey, exceptId) {
        var ids = _invitedOf(fkey);
        for (var i = 0; i < ids.length; i++) {
            if (ids[i] === exceptId) continue;
            var npc = _npcOf(ids[i]);
            var name = (npc && npc.name) || ids[i];
            if (npc && typeof npc.changeAffection === 'function') npc.changeAffection(-4);
            global.currentCharData.bonds[ids[i]].festival[fkey].status = 'declined';
            _log('你的回信随后送到' + name + '案头：那夜的节，你已许给了别人。' + name + '只回了两个字：「应该。」（好感-4）', 'warning');
        }
    }

    function festivalAccept(npcId, fkey) {
        var cd = global.currentCharData;
        if (!cd || !cd.bonds || !cd.bonds[npcId]) return false;
        var bond = cd.bonds[npcId];
        var fes = (bond.festival || {})[fkey];
        if (!fes || fes.status !== 'invited') return false;
        var npc = _npcOf(npcId);
        var name = (npc && npc.name) || bond.name || '你的道侣';
        // 两头都应的闸：这一夜的节已许了别人，就不该再来赴第二场
        var spentBy = null, ids = _daoIds();
        for (var i = 0; i < ids.length; i++) {
            var ob = (cd.bonds[ids[i]].festival || {})[fkey];
            if (ob && ob.status === 'spent') { spentBy = ids[i]; break; }
        }
        if (spentBy) {
            if (npc && typeof npc.changeAffection === 'function') npc.changeAffection(-6);
            fes.status = 'declined';
            _log('你收拾停当才想起，这一夜的帖子你早许给了别人。' + name + '把灯收了：「原来你的节，是拆开卖的。」（好感-6）', 'warning');
            return false;
        }
        if (npc && typeof npc.changeAffection === 'function') npc.changeAffection(8);
        // v20.33 信任涨路：节是当众之约，陪到底比平日一约更真——信任+2（0~100 同井）
        if (npc && npc.relationship) npc.relationship.trust = Math.max(0, Math.min(100, (Number(npc.relationship.trust) || 0) + 2));
        // v20.36 深情涨路：当众之约陪到底，是真诚里程碑——深情+1
        if (npc && npc.relationship) npc.relationship.love = Math.min(100, (Number(npc.relationship.love) || 0) + 1);
        if (npc && npc._companionData) npc._companionData.lastInteraction = _day();
        fes.status = 'spent';
        bond.lastMetDay = _day();
        _resolveOthers(fkey, npcId);
        var def = _defOf(fkey);
        _log(_fmt(def ? def.accept : '{name}与你同过了这一节。', npc, name) + '（占一整天，好感+8，信任+2，深情+1）', 'success');
        if (global.timeSystem && typeof global.timeSystem.advanceTime === 'function') global.timeSystem.advanceTime(ACCEPT_TIME, '与' + name + '过' + (fes.fname || '节'));
        return true;
    }

    function festivalDecline(npcId, fkey) {
        var cd = global.currentCharData;
        if (!cd || !cd.bonds || !cd.bonds[npcId]) return false;
        var bond = cd.bonds[npcId];
        var fes = (bond.festival || {})[fkey];
        if (!fes || fes.status !== 'invited') return false;
        var npc = _npcOf(npcId);
        var name = (npc && npc.name) || bond.name || '你的道侣';
        if (npc && typeof npc.changeAffection === 'function') npc.changeAffection(-3);
        fes.status = 'declined';
        var def = _defOf(fkey);
        _log(_fmt(def ? def.lonely : '{name}一个人过了这个节。', npc, name) + '（好感-3）', 'warning');
        return true;
    }

    function festivalDeclineAll(fkey) {
        var ids = _invitedOf(fkey), n = 0;
        for (var i = 0; i < ids.length; i++) { if (festivalDecline(ids[i], fkey)) n++; }
        return n;
    }

    // ============ 到期弹窗 ============

    function _festivalChoice(event) {
        var p = (event && event.payload) || {};
        var fkey = _fkey(p.fkey, p.year);
        var invited = _invitedOf(fkey);
        if (!invited.length) return; // 已有人做主（弹窗环境外的先到先得）
        if (typeof global.showModal === 'function') {
            if (_lastModalKey === fkey) return; // 同节多人帖合成一张帖面，不刷 N 遍
            _lastModalKey = fkey;
            var safeKey = String(fkey).replace(/[^A-Za-z0-9_]/g, '');
            var rows = '';
            for (var i = 0; i < invited.length; i++) {
                var id = invited[i];
                var npc = _npcOf(id);
                var name = (npc && npc.name) || global.currentCharData.bonds[id].name || '你的道侣';
                var sid = String(id).replace(/[^A-Za-z0-9_一-鿿\-]/g, '');
                rows += '<button onclick="festivalAcceptBy(\'' + sid + '\',\'' + safeKey + '\')" class="bg-rose-800 hover:bg-rose-700 text-xs px-3 py-2 rounded">🏮 陪' + name + '过节（一整天·好感+8·信任+2·深情+1）</button>' +
                    '<button onclick="festivalDeclineBy(\'' + sid + '\',\'' + safeKey + '\')" class="bg-stone-700 hover:bg-stone-600 text-xs px-3 py-2 rounded">✉ 好言回绝' + name + '（好感-3）</button>';
            }
            var allBtn = invited.length > 1 ? '<button onclick="festivalDeclineAllBy(\'' + safeKey + '\')" class="bg-stone-800 hover:bg-stone-700 text-xs px-3 py-2 rounded">🌙 这一夜谁也不陪（各-3）</button>' : '';
            var body = '<p class="text-xs text-gray-400 mb-2">' + (event.title || '节帖到期') + '——名册上 ' + invited.length + ' 人都邀你同过，一夜只陪得一个。</p>' +
                '<div style="display:flex;flex-direction:column;gap:6px">' + rows + allBtn + '</div>';
            global.showModal('🏮 ' + (p.fname || '节日') + '帖', body);
            return;
        }
        // 无弹窗环境（自动化/测试）：不做主会让帖悬着——夜只有一夜，
        // 就陪此刻情面最重的一个，其余如实回绝。两头都不留悬账。
        var best = null, bestAff = -1;
        for (var b = 0; b < invited.length; b++) {
            var nb = _npcOf(invited[b]);
            var af = (nb && nb.relationship && typeof nb.relationship.affection === 'number') ? nb.relationship.affection : 0;
            if (af > bestAff) { bestAff = af; best = invited[b]; }
        }
        if (best) { festivalAccept(best, fkey); return; }
        festivalDeclineAll(fkey);
    }

    /** 弹窗按钮薄封装 */
    function festivalAcceptBy(npcId, fkey) { return festivalAccept(npcId, fkey); }
    function festivalDeclineBy(npcId, fkey) { return festivalDecline(npcId, fkey); }
    function festivalDeclineAllBy(fkey) { return festivalDeclineAll(fkey); }

    if (global.WorldCalendar && typeof global.WorldCalendar.subscribe === 'function') {
        global.WorldCalendar.subscribe(function (event) {
            if (!event) return;
            if (event.category !== 'npc_appointment') return;
            if (!event.source || event.source.system !== FEST_SYSTEM) return;
            try { _festivalChoice(event); } catch (e) {}
        });
    }
    if (global.EventBus && typeof global.EventBus.on === 'function') {
        global.EventBus.on('newDay', function () { try { festivalTick(); } catch (e) {} });
    }

    global.festivalTick = festivalTick;
    global.festivalAccept = festivalAccept;
    global.festivalDecline = festivalDecline;
    global.festivalDeclineAll = festivalDeclineAll;
    global.festivalAcceptBy = festivalAcceptBy;
    global.festivalDeclineBy = festivalDeclineBy;
    global.festivalDeclineAllBy = festivalDeclineAllBy;
    global.FESTIVAL_DEFS = FESTIVALS.map(function (f) { return { key: f.key, name: f.name, doy: f.doy }; });
})(typeof window !== 'undefined' ? window : this);
