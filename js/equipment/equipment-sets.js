// ==================== 第七十七波 · 套装有名有魂（凑齐一身，才算个样子） ====================
// 九品谱（v20.91）把一品毕业线铺齐了：十三件「全身成套」。可凑齐了什么也没发生——
// 攻防是各件各算的散账，穿齐毕业套和穿着七拼八凑，走起路来没有半分不同。
// 本账把毕业装立成三个名号（剑修「问天」四件 / 法修「合道」五件 / 体修「开天」四件——
// 十三件各归各套，一件不落），两件起感应、三件更壮、凑齐一套有名有姓的说法。
// 纪律：①零新物品（套装成员全是毕业线现成的货——物品库老账一字不动）；
//       ②零新存档字段（套装状况从装备十三格现推，脱下即散，不落任何账）；
//       ③零骰、零经济（回响只进战斗派生表——没穿套装货时一分不添，老基线原样）；
//       ④回响只认「穿着」——套装塞在行囊里不算数，穿在身上才算。
(function () {
    'use strict';

    var SETS = [
        {
            id: 'heaven_ask', name: '问天套', icon: '⚔️', school: '剑修',
            pieces: ['wpn_heaven_ask', 'arm_heaven_ring', 'arm_heaven_crown', 'arm_cloud_shoes'],
            thresholds: [
                { n: 2, bonus: { crit: 8 }, line: '问天两件：剑与戒相呼应，剑意生了锐气（暴击+8）' },
                { n: 3, bonus: { attack: 40, hit: 10 }, line: '问天三件：冠带履随，一身剑气不衰（攻击+40、命中+10）' },
                { n: 4, bonus: { attack: 80, crit: 12, penetrate: 10 }, line: '问天全套：剑出如问天，天不敢答——剑鸣自响（攻击+80、暴击+12、破防+10）' }
            ],
            full: '问天剑出鞘一声鸣，问天戒应之，凌霄冠整其威仪，步霄履轻其脚步。传说里那位剑修的全身行头，原是一套。'
        },
        {
            id: 'dao_merge', name: '合道套', icon: '🪄', school: '法修',
            pieces: ['wpn_nirvana_staff', 'arm_dao_ring', 'arm_nine_turn_robe', 'arm_primordial_pendant', 'arm_immortal_seal'],
            thresholds: [
                { n: 2, bonus: { block: 12 }, line: '合道两件：杖与戒相守，道韵内守（格挡+12）' },
                { n: 3, bonus: { defense: 40 }, line: '合道三件：仙衣九重，心湖不起风（防御+40）' },
                { n: 4, bonus: { defense: 60, hit: 12 }, line: '合道四件：玉佩定风，仙印护法（防御+60、命中+12）' },
                { n: 5, bonus: { defense: 80, block: 15, dodge: 10 }, line: '合道全套：万法过印不侵，与天地同息（防御+80、格挡+15、闪避+10）' }
            ],
            full: '涅槃杖焰色微明，九转仙衣垂其道韵，合道戒同其呼吸，玉佩仙印分左右而立。修道人的毕业一身，穿上即是道场。'
        },
        {
            id: 'pangu_open', name: '开天套', icon: '🛡️', school: '体修',
            pieces: ['arm_pangu_shield', 'arm_starry_necklace', 'arm_xuan_belt', 'arm_jiao_gauntlets'],
            thresholds: [
                { n: 2, bonus: { defense: 30 }, line: '开天两件：盾立如壁，气机不外泄（防御+30）' },
                { n: 3, bonus: { block: 15 }, line: '开天三件：蛟鳞覆手，星河绕身（格挡+15）' },
                { n: 4, bonus: { defense: 60, block: 20, attack: 30 }, line: '开天全套：开天辟地的一片盾，立起来就是一堵天（防御+60、格挡+20、攻击+30）' }
            ],
            full: '开天盾在前，玄玉带束气，蛟鳞手笼接白刃，星河颈链绕身。体修的毕业一身，一身即城墙。'
        }
    ];

    // 身上穿着的货（只认装备十三格——塞在行囊里不算数）
    function equippedIds() {
        var ids = [];
        try {
            var eq = window.currentEquipment || {};
            for (var slot in eq) {
                var it = eq[slot];
                if (!it) continue;
                var id = it.id || it.templateId;
                if (id) ids.push(id);
            }
        } catch (e) {}
        return ids;
    }
    // 成套的账（两件起感应；档位是累积的——四件拿满二三四件的账）
    function activeSets() {
        var ids = equippedIds();
        var out = [];
        SETS.forEach(function (s) {
            var count = 0;
            var worn = [];
            s.pieces.forEach(function (pid) {
                if (ids.indexOf(pid) >= 0) { count++; worn.push(pid); }
            });
            if (count >= 2) {
                out.push({
                    id: s.id, name: s.name, icon: s.icon, school: s.school,
                    count: count, total: s.pieces.length, worn: worn, set: s,
                    achieved: s.thresholds.filter(function (t) { return count >= t.n; })
                });
            }
        });
        return out;
    }
    // 战斗派生表吃的那一口（无套装时是空表——老基线一分不添）
    function combatBonus() {
        var out = {};
        activeSets().forEach(function (a) {
            a.achieved.forEach(function (t) {
                for (var k in t.bonus) {
                    if (Object.prototype.hasOwnProperty.call(t.bonus, k)) out[k] = (out[k] || 0) + t.bonus[k];
                }
            });
        });
        return out;
    }
    function statusLine() {
        var acts = activeSets();
        if (!acts.length) return '';
        return acts.map(function (a) {
            return a.icon + ' ' + a.name + '（' + a.count + '/' + a.total + (a.count >= a.total ? ' · 成套' : '') + '）';
        }).join('　');
    }

    // 成套提点（运行时本地账，读档清零——提点是一次性的礼，不入存档）
    var _lastSig = null;
    function noteChange() {
        try {
            var acts = activeSets();
            var sig = acts.map(function (a) { return a.id + ':' + a.count; }).join('|');
            if (_lastSig === null) { _lastSig = sig; return; }   // 头一回对账只记不报（读档穿着的不算新凑）
            if (sig === _lastSig) return;
            var prev = _lastSig;
            _lastSig = sig;
            if (!window.showMessage) return;
            acts.forEach(function (a) {
                var before = 0;
                prev.split('|').forEach(function (p) {
                    if (p.indexOf(a.id + ':') === 0) before = Number(p.split(':')[1]) || 0;
                });
                if (a.count > before && a.achieved.length) {
                    var t = a.achieved[a.achieved.length - 1];
                    window.showMessage(a.icon + ' ' + t.line, 'success');
                    if (a.count >= a.total) window.showMessage('✨ ' + a.set.full, 'info');
                }
            });
        } catch (e) {}
    }

    window.EquipmentSets = {
        SETS: SETS,
        equippedIds: equippedIds,
        activeSets: activeSets,
        combatBonus: combatBonus,
        statusLine: statusLine,
        noteChange: noteChange
    };
})();
