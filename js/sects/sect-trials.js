// ==================== sect-trials.js - 山门后的试炼（改造批·第一梯队） ====================
// 三十六座地标此前只是「点一下拿增益」——但每派山门后都该有一座试炼之地：
// 少林的木人巷、剑阁的剑冢、修罗宫的血池。本模块把地标变成真闯关：
//   五层，每层两场真仗（守关的不是野怪，是这座地标自己的「影」——阵影/心魔/剑意残识）；
//   进层要境界（三层起金丹、五层起元婴）+ 入阵费贡献（走账本）；
//   通层有奖（贡献/丹药/材料），首通第五层开「山门宝库」：本派专属兵刃+编年记名+名望。
// 纪律：败不罚（入阵费已付，可再战）；奖励全走真接口（账本/物品/编年）；零冷却句式。
(function () {
    'use strict';
    var W = window;

    function ds() { return W.discipleState || null; }
    function cd() { return W.currentCharData || null; }
    function flags() { return (W.eventFlags = W.eventFlags || {}); }
    function log(m, t) { try { if (W.gameLog && W.gameLog.add) W.gameLog.add(m); } catch (e) {} }
    function msg(m, t) { if (typeof W.showMessage === 'function') W.showMessage(m, t || 'info'); }
    function modal(t, b) { if (typeof W.showModal === 'function') W.showModal(t, b); }
    function para(t) { return '<p class="text-sm text-gray-300 leading-relaxed mb-2">' + t + '</p>'; }
    function btn(label, onclick, cls) { return '<button onclick="' + onclick + '" class="' + (cls || 'bg-yellow-700 hover:bg-yellow-600') + ' text-xs px-3 py-2 rounded text-left">' + label + '</button>'; }
    function btns(arr) { return '<div style="display:flex;flex-direction:column;gap:8px;margin-top:12px">' + arr.join('') + '</div>'; }
    function _close() { try { var ov = document.getElementById('xianxia-modal-overlay'); if (ov) ov.remove(); } catch (e) {} }
    W._closeModal = W._closeModal || _close;
    function realmTier() { try { return typeof W.getRealmTier === 'function' ? W.getRealmTier((cd() || {}).realm) : 1; } catch (e) { return 1; } }
    function addC(n, r) { try { if (typeof W.sectAddContribution === 'function') return W.sectAddContribution(n, r); } catch (e) {} var d = ds(); if (d) d.contribution = (Number(d.contribution) || 0) + n; }
    function spendC(n, r) { try { if (typeof W.sectSpendContribution === 'function') return W.sectSpendContribution(n, r); } catch (e) {} var d = ds(); if (!d || (Number(d.contribution) || 0) < n) return false; d.contribution -= n; return true; }
    function addStones(n) {
        try { if (W.XianXia && W.XianXia.DataManager && W.XianXia.DataManager.addSpiritStones) { W.XianXia.DataManager.addSpiritStones(n); return; } } catch (e) {}
        if (W.inventory && W.inventory.currency) W.inventory.currency.spiritStones = (Number(W.inventory.currency.spiritStones) || 0) + n;
    }
    function chron(sect, text) { try { if (W.SectGov && W.SectGov.chronicle) W.SectGov.chronicle(sect, text); } catch (e) {} }
    function landmarkName(fid) {
        try {
            var ex = W.SECT_FACILITY_EXTRAS || {};
            for (var s in ex) { for (var i = 0; i < ex[s].length; i++) { if (ex[s][i].id === fid) return ex[s][i].name; } }
        } catch (e) {}
        return '试炼之地';
    }
    function trialState(fid) {
        var f = flags();
        var k = 'sect_trial_' + fid;
        if (!f[k]) f[k] = { cleared: 0 };
        return f[k];
    }
    // 每层的守关者名目（地标的「影」，不是野怪）
    var GUARDIAN = {
        1: '第一层 · 阵影', 2: '第二层 · 执念', 3: '第三层 · 心魔', 4: '第四层 · 残识', 5: '第五层 · 开山之意'
    };
    function floorGate(floor) {
        if (floor >= 5) return { tier: 4, word: '元婴' };
        if (floor >= 3) return { tier: 3, word: '金丹' };
        return null;
    }
    function entryCost(floor) { return 20 * floor; }

    W.openTrialPanel = function (fid) {
        var d = ds();
        if (!d || !d.isInSect) { msg('还没入门。', 'warning'); return; }
        var st = trialState(fid);
        var nm = landmarkName(fid);
        var html = '<div class="text-left">';
        html += para('「' + nm + '」深处藏着开山祖师留下的试炼——守关的不是人，是这座地自己的影。已通 <b class="text-amber-300">' + st.cleared + '</b> 层。');
        for (var f = 1; f <= 5; f++) {
            var cleared = st.cleared >= f;
            var gate = floorGate(f);
            var lockedPrev = st.cleared < f - 1;
            var lockedRealm = gate && realmTier() < gate.tier;
            var label;
            if (cleared) label = '<span class="text-green-400">✓ 已通</span>';
            else if (lockedRealm) label = '<span class="text-gray-500">🔒 需' + gate.word + '修为</span>';
            else if (lockedPrev) label = '<span class="text-gray-500">🔒 先通上一层</span>';
            else label = '<button onclick="window.startTrialFloor(\'' + fid + '\',' + f + ')" class="text-xs bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded">入阵（贡献' + entryCost(f) + '）</button>';
            html += '<div class="flex justify-between items-center bg-gray-800/60 p-2 rounded mb-1">'
                + '<span class="text-sm text-gray-200">' + GUARDIAN[f] + '</span>' + label + '</div>';
        }
        html += '<p class="text-[11px] text-gray-500 mt-2">每层两场真仗，败了不罚——入阵费买的是这一次机会，本事得自己带。首通第五层，开山门宝库。</p>';
        html += '</div>';
        modal('🌫️ ' + nm + ' · 试炼', html);
    };

    function buildGuardian(fid, floor, wave) {
        var c = cd() || {};
        var tier = Math.max(1, realmTier());
        var mul = (1 + 0.25 * (floor - 1)) * (wave === 2 ? 1.1 : 1);
        var nm = landmarkName(fid);
        return {
            name: nm + '·' + (wave === 1 ? '前影' : '后影') + '（第' + floor + '层）',
            type: 'enemy', physiologyType: 'humanoid',
            level: Math.max(1, (typeof W.realmScaledEnemyLevel === 'function' ? W.realmScaledEnemyLevel(c) : tier * 3)),
            attack: Math.round((32 + tier * 6) * mul), defense: Math.round((16 + tier * 4) * mul), speed: Math.round(18 + tier * 2),
            maxDurability: Math.round((95 + tier * 16) * mul), durabilities: { chest: Math.round((95 + tier * 16) * mul) },
            combatAbilities: [],
            description: '「' + nm + '」试炼第' + floor + '层的守关之影——它用的是你自己的路数。'
        };
    }
    W.startTrialFloor = function (fid, floor) {
        var d = ds();
        if (!d || !d.isInSect) { msg('还没入门。', 'warning'); return false; }
        var st = trialState(fid);
        if (st.cleared >= floor) { msg('这一层你已经走过了。', 'info'); return false; }
        var gate = floorGate(floor);
        if (gate && realmTier() < gate.tier) { msg('第' + floor + '层的威压，' + gate.word + '之下站不住。', 'warning'); return false; }
        if (st.cleared < floor - 1) { msg('先通上一层——试炼不跳级。', 'warning'); return false; }
        var cost = entryCost(floor);
        if (!spendC(cost, '试炼·入阵第' + floor + '层')) { msg('入阵费要贡献' + cost + '——不够。', 'error'); return false; }
        if (typeof W.startBattle !== 'function') { msg('战端未就绪。', 'error'); return false; }
        var b = W.startBattle(buildGuardian(fid, floor, 1));
        if (b) { b._isSectTrialBattle = true; b._trialFid = fid; b._trialFloor = floor; b._trialWave = 1; }
        _close();
        log('🌫️ 你踏入「' + landmarkName(fid) + '」第' + floor + '层——光影扭动，守关的「影」站了起来，用的是你自己的架势。（真仗，每层两场）', 'danger');
        return true;
    };
    // 战后结算（app.js _isSectTrialBattle 分支调用）
    W.settleSectTrial = function (win) {
        var b = W.currentBattle || {};
        var fid = b._trialFid, floor = b._trialFloor, wave = b._trialWave;
        if (!fid || !floor) return;
        if (win && wave === 1) {
            // 前影破，后影起——同一层的第二场
            log('🌫️ 前影散了。深处传来第二声脚步——这一层的「影」有两个。', 'warning');
            var b2 = W.startBattle(buildGuardian(fid, floor, 2));
            if (b2) { b2._isSectTrialBattle = true; b2._trialFid = fid; b2._trialFloor = floor; b2._trialWave = 2; }
            return;
        }
        if (!win) {
            log('💧 你被「影」送了出来，膝头还麻着。试炼不罚败者——入阵费买的就是这一次机会，练好了再来。（可再战）', 'info');
            msg('试炼败了——不罚，可再战。', 'info');
            return;
        }
        // 通层
        var st = trialState(fid);
        var first = st.cleared < floor;
        st.cleared = Math.max(st.cleared, floor);
        var nm = landmarkName(fid);
        var sect = (ds() || {}).sectName || (ds() || {}).sectId;
        addC(40 * floor, '试炼·通第' + floor + '层');
        try { if (typeof W.sectPassiveTrain === 'function') W.sectPassiveTrain('battle'); } catch (e) {}
        if (floor < 5) {
            var pills = ['pill_qi_gather', 'mat_lingzhi', 'iron_ore'];
            try { if (typeof W.addItem === 'function') W.addItem(pills[floor % pills.length], 1 + Math.floor(floor / 2)); } catch (e) {}
            var line = '✨ 「' + nm + '」第' + floor + '层通了——影散处留下一份祖师余泽（贡献+' + (40 * floor) + '，物件入行囊）。下一层的门开了。';
            log(line, 'success'); msg(line, 'success');
        } else {
            // 首通第五层：山门宝库
            addStones(200);
            var line5;
            if (first) {
                var wpn = null;
                try { wpn = W.getSectEquipment && W.getSectEquipment(sect); } catch (e) {}
                var wpnId = (wpn && wpn.weapon && wpn.weapon.id) || 'wpn_spirit_sword';
                try { if (typeof W.addItem === 'function') W.addItem(wpnId, 1); } catch (e) {}
                try { if (W.currentCharData) W.currentCharData.fame = Math.min(99999, (W.currentCharData.fame || 0) + 5); } catch (e) {}
                chron(sect, '有弟子通了「' + nm + '」试炼的五层——开山以来头一遭。祖师宝库为他开了一次：专属兵刃出匣，全门传观。');
                line5 = '🏆 第五层的「开山之意」向你低头了。「' + nm + '」深处石门开——祖师宝库：灵石二百、本派专属兵刃一柄出匣认你。（名望+5，编年记名：开山以来头一遭）';
            } else {
                line5 = '🏆 你又一次走通了五层——宝库的门认得你了，兵刃不重复出匣，灵石照给。（灵石+200）';
            }
            log(line5, 'success'); msg(line5, 'success');
        }
    };

    W.sectTrialProbe = function (fid) { return JSON.parse(JSON.stringify(trialState(fid))); };
    console.log('[sect-trials] 山门试炼已注册：地标五层闯关（每层两场真仗）+ 境界门 + 入阵费走账本 + 第五层山门宝库（专属兵刃+编年记名）');
})();
