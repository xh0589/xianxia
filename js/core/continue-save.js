/**
 * continue-save.js — 续档快照（DES-28：把「继续仙途」和「保存存档」解耦）
 *
 * 病灶：整局进展只有玩家手动点「💾 保存存档」才进 xianxia_save，而世界侧十几个子系统
 * 各自实时落盘。手滑刷新一下，信还在盘里、却没有角色去读它，「↩ 继续仙途」整枚消失。
 *
 * 口径：
 *   - 只写 xianxia_save：走 saveGame({autoMode,silent}) 的正门，不占手动档槽、不弹 toast；
 *     7 游戏日保底档（auto-save.js）与手动档各自照旧，三笔互不覆盖。
 *   - 什么算「有事发生」＝世界时间推进。本作百艺皆有时辰代价，时辰动一格就是有账要落，
 *     故只订 EventBus，不设现实定时器（全库纪律：期限只听游戏时间）。
 *   - 「● 未存档」必须说真话：写盘成败由 saveGame 亲口回话（onSaved），失败就继续挂着红点。
 *   - 节流按真实毫秒而非游戏分钟：一次闭关能连跨 30 天，1MB 快照落一次就够。
 *
 * 加载顺序：第 7 层，须在 time-system.js / event-bus.js / app.js / auto-save.js 之后。
 */
(function (global) {
    'use strict';

    var FLUSH_GAME_MINUTES = 120;  // 攒够一个时辰（120 分钟，口径同 formatShichen）的世界流逝就落一次盘
    var MIN_REAL_MS = 8000;        // 两次落盘之间的最短真实间隔

    var _pendingMinutes = 0;       // 上次落盘后累积的游戏分钟
    var _dirty = false;            // 有未落档的进展
    var _lastSnapAt = 0;           // 上次成功落盘的真实时间戳
    var _failWarned = false;
    // v25.1·P1：「这一世到底落过档没有」。建号不耗时辰、四路世界事件一路都不发的玩家，
    // 刷新即丢角色——HUD 得如实说「尚未落档」，落过一次（或读档而来）就不再喊。
    var _everSaved = false;

    function inGame() { return !!global.currentCharData; }

    // 时长口径归 time-system.js（1 时辰 = 120 分钟）；缺位时回落分钟数而非抛错
    function _dur(minutes) {
        return global.formatShichen ? global.formatShichen(minutes) : (Math.max(0, Math.round(Number(minutes) || 0)) + '分钟');
    }

    function hudEl() {
        try { return document.getElementById('continue-save-state'); } catch (e) { return null; }
    }

    function renderHud() {
        var el = hudEl();
        if (!el) return;
        wireHud(el);
        if (!inGame()) { el.className = 'text-xs text-gray-500 mt-1'; el.textContent = ''; return; }
        if (_dirty) {
            el.className = 'text-xs text-amber-400 mt-1 cursor-pointer';
            el.textContent = '● 未存档（已行 ' + _dur(_pendingMinutes) + '，点此落档）';
        } else if (!_everSaved) {
            // v25.1·P1：已建号但这一世从未落过档——不脏也要说真话，给一次可点的补救入口
            el.className = 'text-xs text-amber-400 mt-1 cursor-pointer';
            el.textContent = '● 尚未落档（点此保存）';
        } else {
            el.className = 'text-xs text-gray-500 mt-1';
            el.textContent = _lastSnapAt ? '✓ 已落档' : '';
        }
    }

    function wireHud(el) {
        if (el._continueSaveClick || typeof el.addEventListener !== 'function') return;
        el._continueSaveClick = function () {
            if (!_dirty) {
                // v25.1·P1：从未落过档的新角色，点这里也走 saveGame 正门补一笔
                if (!_everSaved && inGame() && typeof global.saveGame === 'function') { global.saveGame(); return; }
                if (global.showMessage) global.showMessage('本局进展已经落档，不必再存。', 'info');
                return;
            }
            // 玩家主动点＝要一份带回执的手动档，交回 saveGame 正门，不在这里另写一笔
            if (typeof global.saveGame === 'function') { global.saveGame(); return; }
            snap('click');
        };
        el.addEventListener('click', el._continueSaveClick);
    }

    /** 落一次续档快照。成败不在此判定——saveGame 写完盘会回调 onSaved。 */
    function snap(reason) {
        if (!inGame()) return false;
        if (typeof global.saveGame !== 'function') return false;
        _pendingMinutes = 0;
        try {
            global.saveGame({ autoMode: true, silent: true, trigger: 'continue:' + (reason || 'world') });
        } catch (e) { return false; }
        return !_dirty;
    }

    function maybeSnap(reason) {
        if (!_dirty) return false;
        var force = reason === 'unload' || reason === 'click';
        if (!force && global.Date && global.Date.now() - _lastSnapAt < MIN_REAL_MS) return false;
        return snap(reason);
    }

    function markDirty(minutes) {
        _dirty = true;
        if (minutes > 0) _pendingMinutes += minutes;
        // v25.1·P1：外部调用方（如 app.js startGame 建号处）只喊一声 markDirty，
        // HUD 红点当场刷新，不再等下一次世界事件才亮
        renderHud();
    }

    // ============ 事件：世界动了 ============
    function onTimeAdvanced(ev) {
        var m = Number(ev && ev.minutes) || 0;
        if (m <= 0) return;
        markDirty(m);
        // 落盘门槛：攒够一个时辰才写，零碎分钟只记账（一次 1MB 快照不该一刻一写）
        if (_pendingMinutes >= FLUSH_GAME_MINUTES) maybeSnap('time');
        renderHud();
    }

    function onWorldEvent(reason) {
        markDirty(0);
        maybeSnap(reason);
        renderHud();
    }

    // ============ saveGame 的回话 ============
    /** ts 非 0＝xianxia_save 已写成功；0＝写盘失败（多半是存储满了），红点继续挂着 */
    function onSaved(ts) {
        if (!ts) {
            _dirty = true;
            if (!_failWarned && global.showMessage) {
                _failWarned = true;
                try { global.showMessage('⚠️ 续档未能写入：浏览器存储空间可能已满，删掉旧存档才能继续落档', 'error'); } catch (e) {}
            }
            renderHud();
            return false;
        }
        _lastSnapAt = Number(ts) || (global.Date ? global.Date.now() : 0);
        _dirty = false;
        _pendingMinutes = 0;
        _everSaved = true;   // v25.1·P1：这一世落过档了，「尚未落档」提示从此收声
        renderHud();
        return true;
    }

    /** 载入完成＝盘上的就是手上的 */
    function onLoaded() {
        _dirty = false;
        _pendingMinutes = 0;
        _lastSnapAt = 0;
        _everSaved = true;   // v25.1·P1：能从盘里读出来＝世上已有这一世的档，不算「从未落档」
        renderHud();
    }

    function onBeforeUnload(e) {
        if (!_dirty || !inGame()) return undefined;
        snap('unload');
        if (!_dirty) return undefined;         // 落档成功，不必拦人
        var tip = '本局有未落档的进展，且浏览器存储写入失败——此刻离开将丢失这部分进度。';
        try { if (e) e.returnValue = tip; } catch (err) {}
        return tip;
    }

    // 具名处理函数：EventBus.on 按函数身份去重，subscribe 走两次也不会重复挂
    function onNewDayEvent() { onWorldEvent('day'); }
    function onArriveEvent() { onWorldEvent('arrive'); }
    function onBattleEvent() { onWorldEvent('battle'); }
    // v25.1·P1：以下全是「零时辰但有价值」的变更——建号后接任务/拜师/得宝/合成/突破/通关/受赏
    // 一格时辰都不动，旧订阅表一路都听不见，_dirty 恒 false ⇒ beforeunload 首行 return，刷新即丢角色。
    // 标脏只是让离开前补落一次盘，宁可多接，无副作用。
    function onQuestAcceptedEvent() { onWorldEvent('quest'); }
    function onSectJoinedEvent() { onWorldEvent('sect'); }
    function onItemObtainedEvent() { onWorldEvent('item'); }
    function onItemCraftedEvent() { onWorldEvent('craft'); }
    function onBreakthroughEvent() { onWorldEvent('breakthrough'); }
    function onCultivationDoneEvent() { onWorldEvent('cultivation'); }
    function onDungeonDoneEvent() { onWorldEvent('dungeon'); }
    function onRewardEvent() { onWorldEvent('reward'); }

    function subscribe() {
        if (global._continueSaveSubscribed) return;
        global._continueSaveSubscribed = true;
        var B = global.EventBus;
        if (B && typeof B.on === 'function') {
            B.on('time:advanced', onTimeAdvanced);
            B.on('newDay', onNewDayEvent);
            B.on('location:visited', onArriveEvent);
            B.on('enemy:defeated', onBattleEvent);
            // v25.1·P1：零时辰变更也标脏（事件名均为全仓真实 emit 点，quest:accepted 由本批在 acceptQuest 补发）
            B.on('quest:accepted', onQuestAcceptedEvent);
            B.on('sect:joined', onSectJoinedEvent);
            B.on('item:obtained', onItemObtainedEvent);
            B.on('item:crafted', onItemCraftedEvent);
            B.on('cultivation:breakthrough', onBreakthroughEvent);
            B.on('cultivation:completed', onCultivationDoneEvent);
            B.on('dungeon:completed', onDungeonDoneEvent);
            B.on('reward:applied', onRewardEvent);
        }
        if (global.addEventListener && !global._continueSaveUnloadWired) {
            global._continueSaveUnloadWired = true;
            global.addEventListener('beforeunload', onBeforeUnload);
        }
    }

    global.ContinueSave = {
        snap: snap,
        maybeSnap: maybeSnap,
        markDirty: markDirty,
        isDirty: function () { return _dirty; },
        everSaved: function () { return _everSaved; },   // v25.1·P1：给回归测试与 HUD 判「从未落档」用
        pendingMinutes: function () { return _pendingMinutes; },
        lastSnapshotAt: function () { return _lastSnapAt; },
        onSaved: onSaved,
        onLoaded: onLoaded,
        renderHud: renderHud,
        FLUSH_GAME_MINUTES: FLUSH_GAME_MINUTES,
        MIN_REAL_MS: MIN_REAL_MS
    };

    // 本模块排在 event-bus.js 之后，载入时总线已在；HUD 元素要等 DOM 齐
    subscribe();
    if (global.document && typeof global.document.addEventListener === 'function') {
        global.document.addEventListener('DOMContentLoaded', renderHud);
    }
})(typeof window !== 'undefined' ? window : this);
