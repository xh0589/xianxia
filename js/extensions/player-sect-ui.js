// ==================== player-sect-ui.js - 玩家宗门界面（v20.52） ====================
// 立派做庄：起自己的宗名、定阵营、择山门（山/城/水/漠/岛），立派当日各色人等上门。
// 宗门总册：资源产耗一目了然、政策随时切换、招收弟子、职位任命、宗门史。
// 只复用 PlayerSect / master-teach / npcManager 的既有状态，不复制平行数据。
// 依赖：player-sect.js（先载）、master-teach.js、global-utils.js（showModal）

(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    // ============ 工具 ============
    function _mine() {
        try {
            return (window.PlayerSect && typeof window.PlayerSect.listMySects === 'function')
                ? (window.PlayerSect.listMySects() || [])[0] || null : null;
        } catch (e) { return null; }
    }
    function _msg(t, type) { if (window.showMessage) window.showMessage(t, type || 'info'); }
    function _r2(n) { return Math.round((Number(n) || 0) * 100) / 100; }
    function _tier() {
        try { var cd = window.currentCharData; return cd && typeof window.getRealmTier === 'function' ? window.getRealmTier(cd.realm) : 0; }
        catch (e) { return 0; }
    }
    function _today() {
        // 第九波·明面修：这个界面还在用假钟——「立派第 N 天」永远停在第 1 天。统一改真钟。
        try {
            if (typeof window.getAbsoluteDay === 'function') { var g = window.getAbsoluteDay(); if (g) return Math.floor(g); }
            var t = window.timeSystem;
            if (t) {
                if (typeof t.getAbsoluteDay === 'function') { var g2 = t.getAbsoluteDay(); if (g2) return Math.floor(g2); }
                if (t.gameTime && t.gameTime.currentDay) return Math.floor(t.gameTime.currentDay);
                if (t.totalDays) return Math.floor(t.totalDays);
            }
            if (window.WorldCalendar && window.WorldCalendar.day) return Math.floor(window.WorldCalendar.day);
        } catch (e) {}
        return 0;
    }
    // 第九波·明面：灵石取整、其余至多一位小数——不再满屏 92.5 / +0.05 的表格长尾
    function _fmtN(n) {
        var v = Number(n) || 0;
        if (Math.abs(v) >= 10) return String(Math.round(v));
        return String(Math.round(v * 10) / 10);
    }
    function _fmtChange(n) {
        var v = Number(n) || 0;
        if (v > 0) return '<span class="text-green-400">' + (v < 0.05 ? '微增' : '+' + _fmtN(v)) + '</span>';
        if (v < 0) return '<span class="text-red-400">' + (v > -0.05 ? '微损' : _fmtN(v)) + '</span>';
        return '<span class="text-gray-500">持平</span>';
    }

    // 立派草稿（选阵营/择址在面板里点选，名字留在输入框）
    var _draft = { alignment: '正道', siteId: null, name: '' };

    var SITE_TERRAIN_TAG = { '山': '⛰️', '城': '🏙️', '水': '🌊', '漠': '🏜️', '岛': '🏝️' };

    // ============ 备选宗名 ============
    var NAME_POOL = ['青霞剑宗', '白云观', '凌霄山房', '沧浪水榭', '通衢阁', '落日刀盟', '浮玉仙府', '烟水居', '黄沙教', '栖霞谷'];
    function _pickNames() {
        var pool = NAME_POOL.slice();
        var out = [];
        for (var i = 0; i < 3 && pool.length; i++) {
            out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
        }
        return out;
    }

    // ============ 立派流程 ============
    window.openFoundSectPanel = function () {
        var cd = window.currentCharData;
        if (!cd) { _msg('请先创建角色进入游戏。', 'warning'); return; }
        if (window.PlayerSect && window.PlayerSect.listMySects && window.PlayerSect.listMySects().length) {
            window.openPlayerSectPanel();
            return;
        }
        var tierOk = _tier() >= 4; // 白手起家改造：元婴不再是立宗门槛，只是「开山买地」的门槛——没修为也能插旗草创
        var sites = (window.PlayerSect && window.PlayerSect.FOUND_SITES) || [];
        var stones = (window.DataManager && typeof window.DataManager.getSpiritStones === 'function')
            ? window.DataManager.getSpiritStones() : (cd.spiritStones || 0);
        var names = _pickNames();

        var html = '<p class="text-xs text-gray-400 mb-3">立宗两条路：<b class="text-gray-200">插旗草创</b>——任何境界都行，一面幡三炷香，家底是空的，没人会主动来投，全靠自己登门去说；' +
            '<b class="text-gray-200">开山立宗</b>——元婴修为 + 置地安家，立起来就是个正经山门。</p>';

        // 白手起家：插旗草创
        var BC = (window.PSBoot && window.PSBoot.BANNER_COST) || 30;
        html += '<div class="mb-3 border border-yellow-700/60 bg-yellow-900/20 rounded p-2">' +
            '<p class="text-sm text-yellow-300 mb-1">🚩 插旗草创（' + BC + ' 灵石：幡布、香烛、官府登记）</p>' +
            '<p class="text-xs text-gray-400 mb-2">就在当前城里立幡。无片瓦、无进项、无人来投——但名分今天就是你的。往后赁屋、招人、挣家底，一步步来。</p>' +
            '<button onclick="window._psDoFoundCheap()" class="w-full bg-yellow-700 hover:bg-yellow-600 text-white text-sm font-bold py-2 rounded">白手起家，插旗立宗</button></div>';

        // 一、宗名
        html += '<div class="mb-3"><p class="text-sm text-amber-400 mb-1">宗名（自拟，或挑一个）</p>' +
            '<input id="ps-found-name" value="' + (_draft.name || '') + '" maxlength="10" placeholder="起个响亮的名号" ' +
            'class="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-gray-100 w-full">' +
            '<div class="flex gap-2 mt-2">' + names.map(function (n) {
                return '<button onclick="document.getElementById(\'ps-found-name\').value=\'' + n + '\'" ' +
                    'class="bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs px-2 py-1 rounded">' + n + '</button>';
            }).join('') + '</div></div>';

        // 二、出身
        html += '<div class="mb-3"><p class="text-sm text-amber-400 mb-1">出身（往后谁对你先行礼，谁先拔剑）</p><div class="grid grid-cols-3 gap-2">' +
            ['正道', '中立', '邪派'].map(function (a) {
                var sel = _draft.alignment === a;
                var note = a === '正道' ? '名门正派与你论资排辈' : (a === '邪派' ? '黑道奉你为座上宾' : '两边都跟你做买卖');
                return '<button onclick="window._psDraftAlign(\'' + a + '\')" class="' +
                    (sel ? 'bg-amber-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-200') +
                    ' text-xs px-2 py-2 rounded text-left"><b>' + a + '</b><br><span class="text-gray-400">' + note + '</span></button>';
            }).join('') + '</div></div>';

        // 三、山门（第九波·明面：未到元婴不再满屏五张灰卡——一行灰字指路就够）
        if (tierOk) {
            html += '<div class="mb-3"><p class="text-sm text-amber-400 mb-1">开山立宗 · 择山门（地形定了，往后怕什么、来什么）</p><div class="space-y-2">' +
                sites.map(function (s) {
                    var sel = _draft.siteId === s.id;
                    var afford = stones >= s.cost;
                    return '<button onclick="window._psDraftSite(\'' + s.id + '\')" class="w-full text-left px-3 py-2 rounded border ' +
                        (sel ? 'border-amber-500 bg-amber-900/40' : 'border-gray-600 bg-gray-800/60 hover:bg-gray-700/60') + '">' +
                        '<div class="flex justify-between items-center"><span class="text-sm text-gray-100">' + (SITE_TERRAIN_TAG[s.terrain] || '') + ' ' + s.name +
                        '</span><span class="text-xs ' + (afford ? 'text-yellow-400' : 'text-red-400') + '">安家费 ' + s.cost + ' 灵石</span></div>' +
                        '<p class="text-xs text-gray-400 mt-1">' + s.desc + '</p></button>';
                }).join('') + '</div></div>';
            html += '<button onclick="window._psDoFound()" class="w-full bg-amber-600 hover:bg-amber-500 text-gray-900 font-bold py-2 rounded mt-1">择吉日，开山门</button>';
        } else {
            html += '<p class="text-xs text-gray-500 mb-1">开山立宗——修到元婴、置地安家，才算正经山门。先插旗草创，挣下家底不耽误。</p>';
        }
        html += '<p class="text-xs text-gray-500 mt-2 text-center">立派之日起，宗门进出、招人用度，皆入宗门史，日后可查。</p>';
        if (typeof window.showModal === 'function') window.showModal('🏯 开山立宗', html);
    };

    window._psDraftAlign = function (a) { _draft.alignment = a; _keepName(); window.openFoundSectPanel(); };
    window._psDraftSite = function (siteId) { _draft.siteId = siteId; _keepName(); window.openFoundSectPanel(); };
    window._psDraftState = _draft;           // 白手起家模块读取「出身」草稿
    window._psKeepFoundName = _keepName;     // 立幡前先把输入框里的宗名收进草稿
    function _keepName() {
        try {
            var el = document.getElementById('ps-found-name');
            if (el) _draft.name = el.value;
        } catch (e) {}
    }

    window._psDoFound = function () {
        _keepName();
        var cd = window.currentCharData;
        var name = (_draft.name || '').trim();
        if (!name || name.length < 2) { _msg('宗名总得有两三个字。', 'warning'); return; }
        var site = null;
        ((window.PlayerSect && window.PlayerSect.FOUND_SITES) || []).forEach(function (s) { if (s.id === _draft.siteId) site = s; });
        if (!site) { _msg('山门还没定——五处地界挑一处。', 'warning'); return; }
        if (_tier() < 4) { _msg('元婴方可开山。', 'warning'); return; }
        if (window.DataManager && typeof window.DataManager.deductSpiritStones === 'function') {
            if (!window.DataManager.deductSpiritStones(site.cost)) {
                _msg('安家费还差一截——「' + site.name + '」要 ' + site.cost + ' 灵石，先去凑齐。', 'warning');
                return;
            }
        }
        var r = window.PlayerSect.create({ name: name, alignment: _draft.alignment, location: site.name, terrain: site.terrain });
        if (!r || !r.ok) { _msg('立宗未成。', 'error'); return; }
        window.PlayerSect.addHistory(r.sectId, '安家费 ' + site.cost + ' 灵石，落在' + site.name + '。');
        _msg('🏯 开山立宗，「' + name + '」自此立于' + site.name + '！', 'success');
        if (window.updateCultivationUI) window.updateCultivationUI();
        _foundingDay(r.instance);
    };

    // 开山当日：来不来人、送不送礼，看你自己的脸面（名望）——没名望，开山也只是自己的事
    function _foundingDay(sect) {
        var rows = [];
        var P = window.PlayerSect;
        var fame = Number((window.currentCharData && window.currentCharData.fame) || 0);
        var gift = fame >= 60 ? 100 : (fame >= 20 ? 10 : 0);
        if (gift > 0) {
            P.addResource(sect.id, 'spiritStones', gift);
            P.addHistory(sect.id, '开山当日，坊间邻里送来贺礼，折银' + (gift === 100 ? '百两' : '十两') + '。');
            rows.push(gift === 100
                ? '你在江湖上有头有脸——坊间邻里抬着礼盒上门，开山是大事，谁都不想失礼。<span class="text-yellow-400">（宗库灵石 +100）</span>'
                : '邻里念着你的薄名，凑了一份薄礼。<span class="text-yellow-400">（宗库灵石 +10）</span>');
        } else {
            P.addHistory(sect.id, '开山当日冷冷清清——没名望的山门，连贺礼都收不到。');
            rows.push('<span class="text-gray-400">开山当日冷冷清清：没几个人认得你，贺礼自然也没有。名声要自己挣。</span>');
        }
        if (sect.alignment === '正道') {
            P.addResource(sect.id, 'reputation', 3);
            P.addHistory(sect.id, '城中名宿携礼登门贺喜，宗门声望 +3。');
            rows.push('城中一位隐居的老修士亲自登门：「立宗是善事，老朽来讨杯喜酒。」<span class="text-green-400">（宗门声望 +3）</span>');
            rows.push('邻山道门遣人递帖：「改日登门拜访。」帖子留在案上，人没来——是观望，也是提点。');
            P.addHistory(sect.id, '远处黑影在山道尽头站了半炷香，记下了山门的样子。');
            rows.push('<span class="text-red-300">暮色里，山道尽头有黑影站了半炷香才走——记下你山门的，未必都是来贺喜的。</span>');
        } else if (sect.alignment === '邪派') {
            var darkGift = fame >= 60 ? 200 : (fame >= 20 ? 50 : 0);
            if (darkGift > 0) P.addResource(sect.id, 'spiritStones', darkGift);
            P.addResource(sect.id, 'reputation', 2);
            if (window.currentCharData) window.currentCharData.fame = Math.max(0, (window.currentCharData.fame || 0) - 1);
            P.addHistory(sect.id, '道上来贺的尽是黑道朋友，礼' + (darkGift > 0 ? '厚' : '薄') + '，名也臭了三分。');
            rows.push(darkGift > 0
                ? '道上来贺的尽是黑道朋友，礼抬了一进门。<span class="text-yellow-400">（宗库灵石 +' + darkGift + '、宗门声望 +2）</span><span class="text-red-400">（你在正道眼中臭了三分，声望 -1）</span>'
                : '黑道上倒是来了两个人，空着手转了一圈就走——你还没让他们觉得值得下注。<span class="text-yellow-400">（宗门声望 +2）</span><span class="text-red-400">（你在正道眼中臭了三分，声望 -1）</span>');
            P.addHistory(sect.id, '官府衙役上门登记造册：「邪派立宗，例册在案。」');
            rows.push('官府衙役上门登记造册，笔录了每一位登门客人的名姓：「邪派立宗，例册在案。」——这笔账，早晚有人来翻。');
        } else {
            P.addResource(sect.id, 'reputation', 1);
            P.addHistory(sect.id, '中立立宗，两边都派人来探底。');
            rows.push('正邪两道都派了人来「道贺」——其实是探底。你一一接待，两边都摸不清你的深浅。<span class="text-green-400">（宗门声望 +1）</span>');
        }
        rows.push('<span class="text-gray-400">另有一名散修在山门外徘徊了一上午，欲言又止——门中招收弟子的事，往后在宗门总册里办。</span>');
        var html = '<p class="text-sm text-amber-400 mb-2">「' + sect.name + '」开山第一日</p>' +
            rows.map(function (r) { return '<p class="text-sm text-gray-200 mb-2">' + r + '</p>'; }).join('');
        if (typeof window.showModal === 'function') window.showModal('开山当日', html);
    }

    // ============ 宗门总册 ============
    // 每日净额预估（与 tickDay 同口径：政策乘数 + 职位加成 − 日常消耗）
    function _prodPreview(sect) {
        var prodMul = 1, consMul = 1, weaponMul = 1;
        if (sect.policy === 'expand') { consMul = 1.5; }
        else if (sect.policy === 'internal') { prodMul = 1.3; }
        else if (sect.policy === 'militarize') { weaponMul = 2.0; }
        var elders = 0, stewards = 0;
        (sect.disciples || []).forEach(function (d) {
            if (d.position === '长老') elders++;
            else if (d.position === '堂主') stewards++;
        });
        var p = sect.production || {}, c = sect.consumption || {};
        return {
            spiritStones: _r2((p.spiritStones || 0) * prodMul + elders * 1 - (c.spiritStones || 0) * consMul),
            reputation: _r2((p.reputation || 0) * prodMul + elders * 0.05),
            elixir: _r2((p.elixir || 0) * prodMul + stewards * 0.5),
            weapon: _r2((p.weapon || 0) * weaponMul + stewards * 0.5)
        };
    }

    window.openPlayerSectPanel = function () {
        var cd = window.currentCharData;
        var sect = _mine();
        if (!cd) { _msg('请先创建角色进入游戏。', 'warning'); return; }
        if (!sect) { window.openFoundSectPanel(); return; }
        var P = window.PlayerSect;
        var pv = _prodPreview(sect);
        var dayN = sect.createdDay ? Math.max(1, _today() - sect.createdDay + 1) : 0; // 第九波·明面：旧档缺立宗日就如实不显示天数，不硬编假数

        var html = '<p class="text-xs text-gray-400 mb-2">' + (sect.alignment || '中立') + ' · ' + (sect.location || '山门未定') +
            (dayN ? ' · 立派第 ' + dayN + ' 天' : '') + '</p>';

        // 山门未定（旧档）：补录择址，不再收钱——白手起家新立的不算（stage 字段是新档标记）
        if (!sect.terrain && sect.stage == null) {
            html += '<div class="bg-yellow-900/30 border border-yellow-600/50 rounded p-2 mb-3">' +
                '<p class="text-xs text-yellow-300 mb-2">山门还没落址——当年立宗仓促。补录一处（不另收钱）：</p><div class="flex flex-wrap gap-2">' +
                (P.FOUND_SITES || []).map(function (s) {
                    return '<button onclick="window._psChooseSite(\'' + s.id + '\')" class="bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs px-2 py-1 rounded">' +
                        (SITE_TERRAIN_TAG[s.terrain] || '') + ' ' + s.name + '</button>';
                }).join('') + '</div></div>';
        }

        // 白手起家一栏（建筑成长 / 游说招徒 / 门客 / 虚名债）
        try { if (window.PSBoot && typeof window.PSBoot.panelBlock === 'function') html += window.PSBoot.panelBlock(sect); } catch (e) {}

        // 资源五行（第九波·明面：窄屏三格换行，数字取整/一位小数）
        html += '<div class="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">' +
            [['灵石', _fmtN(sect.resources.spiritStones), pv.spiritStones],
             ['弟子', sect.disciples.length, null],
             ['声望', _fmtN(sect.resources.reputation), pv.reputation],
             ['丹药', _fmtN(sect.resources.elixir), pv.elixir],
             ['兵器', _fmtN(sect.resources.weapon), pv.weapon]].map(function (x) {
                return '<div class="bg-gray-900/60 p-2 rounded text-center">' +
                    '<p class="text-xs text-gray-400">' + x[0] + '</p>' +
                    '<p class="text-sm font-bold text-amber-300">' + x[1] + '</p>' +
                    (x[2] != null ? '<p class="text-xs">' + _fmtChange(x[2]) + '/日</p>' : '') + '</div>';
            }).join('') + '</div>';

        // 政策
        html += '<p class="text-sm text-amber-400 mb-1">门中方针</p><div class="grid grid-cols-3 gap-2 mb-3">' +
            (P.POLICIES || []).map(function (p) {
                var sel = sect.policy === p;
                return '<button onclick="window._psSetPolicy(\'' + p + '\')" class="' +
                    (sel ? 'bg-amber-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-200') +
                    ' text-xs px-2 py-2 rounded text-left">' + ({ expand: '扩张', internal: '内政', militarize: '备战' }[p]) +
                    '<br><span class="' + (sel ? 'text-amber-100' : 'text-gray-400') + '">' + (P.POLICY_DESC[p] || '') + '</span></button>';
            }).join('') + '</div>';

        // 镇山秘艺（第二十一波）：自家门的看家功夫——立了就是根本，传功更疾，战阵折敌
        try {
            var art = sect.art;
            html += '<div class="bg-indigo-900/30 border border-indigo-700/50 rounded p-2 mb-3 flex justify-between items-center gap-2">' +
                (art
                    ? '<p class="text-xs text-indigo-200">📜 镇山秘艺「' + art.name + '」· 第' + art.level + '阶——传功进境+' + (art.level * 10) + '%，战阵折敌' + (art.level * 3) + '分' + (art.level < 3 ? '' : '（已臻大成）') + '</p>'
                      + (art.level < 3 ? '<button onclick="window.PSectLife && window.PSectLife.upgradeArt()" class="bg-indigo-700 hover:bg-indigo-600 text-white text-xs px-3 py-1 rounded whitespace-nowrap">晋阶（宗库' + [0, 100, 220][art.level] + '石）</button>' : '')
                      + '<div class="mt-1 flex gap-1 items-center"><input id="ps-art-rename-input" maxlength="12" class="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-gray-200 w-44" placeholder="新碑名（十二字内）">'
                      + '<button onclick="window.PSectLife && window.PSectLife.renameArt(document.getElementById(\'ps-art-rename-input\').value)" class="bg-stone-700 hover:bg-stone-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap" title="碑名掌门亲题——战阵、传功、编年都认新名">题碑名</button></div>'
                    : '<p class="text-xs text-indigo-200">📜 尚无镇山秘艺——没有看家功夫的门，像没有祖牌的户。掌门闭关创艺，碑立演武场。</p>'
                      + '<button onclick="window.PSectLife && window.PSectLife.composeArt()" class="bg-indigo-700 hover:bg-indigo-600 text-white text-xs px-3 py-1 rounded whitespace-nowrap">创镇山秘艺（宗库150石）</button>') +
                '</div>';
        } catch (eArt) {}

        // 弟子
        html += '<div class="flex justify-between items-center mb-1"><p class="text-sm text-amber-400">门中弟子（' + sect.disciples.length + '/' + P.POSITION_SLOTS['弟子'] + '）</p>' +
            '<span class="flex gap-1"><button onclick="window.PSectLife && window.PSectLife.openBondBoard()" class="bg-stone-700 hover:bg-stone-600 text-white text-xs px-3 py-1 rounded" title="同门之间处出来的交情与疙瘩，都在江湖关系图的真账上">🤝 同门交情</button>' +
            '<button onclick="window._psOpenRecruit()" class="bg-green-700 hover:bg-green-600 text-white text-xs px-3 py-1 rounded">招收弟子</button></span></div>';
        var roster = (typeof window.getDiscipleRoster === 'function') ? (window.getDiscipleRoster() || []) : [];
        var posMap = {};
        (sect.disciples || []).forEach(function (d) { posMap[d.npcId] = d.position; });
        var inSectMap = {};
        (sect.disciples || []).concat(sect.guests || []).forEach(function (d) { if (d && d.npcId) inSectMap[d.npcId] = 1; });
        if (!roster.length) {
            html += '<p class="text-xs text-gray-500 mb-3">门中还没有弟子——开宗之初，先收几个人。</p>';
        } else {
            html += '<div class="space-y-1 mb-3">' + roster.map(function (d) {
                var pos = posMap[d.npcId] || '弟子';
                var ops = '';
                if (d.away) {
                    ops = '<span class="text-sky-300 text-xs whitespace-nowrap">🚶 下山' + (d.away.name || '办事') + '·还有' + Math.max(1, (Number(d.away.back) || 0) - _today()) + '日回</span>';
                } else {
                    if (d.graduated) {
                        ops = '<span class="text-green-400 text-xs">已出师·云游</span>';
                    } else {
                        ops = '<button onclick="window._psTeach(\'' + d.npcId + '\')" class="bg-yellow-700 hover:bg-yellow-600 text-gray-900 text-xs px-2 py-1 rounded">传功</button>' +
                              (d.canGraduate ? '<button onclick="window._psGraduate(\'' + d.npcId + '\')" class="bg-green-700 hover:bg-green-600 text-white text-xs px-2 py-1 rounded">出师</button>' : '');
                    }
                    if (inSectMap[d.npcId] && window.PSectLife) {
                        ops += '<button onclick="window.PSectLife.openDispatch(\'' + d.npcId + '\')" class="bg-sky-800 hover:bg-sky-700 text-white text-xs px-2 py-1 rounded" title="遣他下山办差：押镖/历练/采买">遣</button>';
                    }
                    ops += '<button onclick="window._psOpenAssign(\'' + d.npcId + '\')" class="bg-purple-800 hover:bg-purple-700 text-white text-xs px-2 py-1 rounded">任</button>';
                }
                // 第二十八波：道侣红灯——名册上一眼看出谁和谁是一家
                var daoWord = '';
                try {
                    var nRow = (window.npcManager && window.npcManager.getNPC) ? window.npcManager.getNPC(d.npcId) : null;
                    if (nRow && nRow.daoMate) {
                        var pRow = window.npcManager.getNPC(nRow.daoMate);
                        if (pRow && !pRow.isDead) daoWord = ' <span class="text-xs text-pink-300" title="道侣：同修、结伴、生死同记">🏮道侣·' + pRow.name + '</span>';
                    }
                } catch (eDao) {}
                // 第三十三波：首座金徽——门里有传人，一眼看得见
                var heirWord = (sect._heir && sect._heir === d.npcId) ? ' <span class="text-xs text-amber-300" title="首座弟子：月结时在山门压阵，门中声望暗涨、弟子心气高">🎖首座</span>' : '';
                if (!d.away && !d.graduated && window.PSectLife && sect._heir !== d.npcId) {
                    ops += '<button onclick="window.PSectLife.appointHeir(\'' + d.npcId + '\')" class="bg-amber-800 hover:bg-amber-700 text-white text-xs px-2 py-1 rounded" title="立为首座弟子——月结压阵，门中有传人">首</button>';
                }
                return '<div class="bg-gray-900/50 px-3 py-2 rounded border border-gray-700 flex justify-between items-center">' +
                    '<div><span class="text-gray-100 text-sm">' + d.name + '</span> <span class="text-xs text-blue-300">[' + (d.realm || '') + ']</span> <span class="text-xs text-cyan-400">' + (d.rootTier || '') + '</span>' +
                    ' <span class="text-xs text-yellow-400">[' + d.stage + ']</span> <span class="text-xs text-purple-300">[' + pos + ']</span>' + daoWord + heirWord + '</div>' +
                    '<div class="flex gap-1">' + ops + '</div></div>';
            }).join('') + '</div>';
        }

        // 护山阵（第二十三波）：宗门阵布没布、还剩几分灵光，总册上一眼看见
        try {
            var gf = (window.FormationSystem && typeof window.FormationSystem.getSectFormationActive === 'function') ? window.FormationSystem.getSectFormationActive() : null;
            var gdur = gf ? ((window.FormationSystem.getState().sect || {}).durability || 0) : 0;
            html += '<div class="bg-cyan-900/30 border border-cyan-700/50 rounded p-2 mb-3">' +
                (gf
                    ? '<p class="text-xs text-cyan-200">🌀 宗门阵「' + gf.name + '」护着山门——耐久 ' + gdur + '/' + gf.maxDurability + '，维持灵石' + (gf.spiritStonesPerTurn || 0) + '/日' +
                      ((gf.buff && gf.buff.sectAttackReducePct) ? '（守山之战，敌攻势挫' + gf.buff.sectAttackReducePct + '%，每战阵旗磨损）' : '') +
                      ((gf.buff && gf.buff.sectGrudgeReducePct) ? '（死仇寻山的骰子被压' + gf.buff.sectGrudgeReducePct + '%）' : '') + '</p>'
                    : '<p class="text-xs text-cyan-200">🌀 尚未布宗门阵——坊市深作可布「护山阵」（守山挫敌攻势）或「迷踪阵」（压死仇寻山）；布下才真护这座山门，阵费按日从行囊出。</p>') +
                '</div>';
        } catch (eGf) {}

        // 进山演阵（第九波·明面：文案跟按钮对齐——这就是主动进山练一场，不是干等妖兽来）
        var wpn = Math.floor(sect.resources.weapon || 0);
        html += '<div class="bg-red-900/30 border border-red-700/50 rounded p-2 mb-3 flex justify-between items-center">' +
            '<p class="text-xs text-red-200">进山演阵：把库中兵器（现有 ' + wpn + ' 件）发给弟子，实打一场妖兽——战后兵器折损；不足十件，就只剩你自己。</p>' +
            '<span class="flex gap-1 whitespace-nowrap"><button onclick="window._defendSectRaid()" class="bg-red-700 hover:bg-red-600 text-white text-xs px-3 py-1 rounded">⚔️ 进山演阵</button>' +
            '<button onclick="window.openPlayerSectDiplomacy && window.openPlayerSectDiplomacy()" class="bg-sky-800 hover:bg-sky-700 text-white text-xs px-3 py-1 rounded">江湖外交</button></span></div>';

        // 宗门史
        var hist = (sect.history || []).slice(-12).reverse();
        html += '<p class="text-sm text-amber-400 mb-1">宗门史</p><div class="bg-gray-900/50 rounded p-2 mb-3 max-h-40 overflow-y-auto">' +
            (hist.length ? hist.map(function (h) {
                // 第九波·明面：宗门史跟头部统一口径「立派第 N 天」——不再同屏两套时间
                var dn = (h.day && sect.createdDay && h.day >= sect.createdDay) ? ('立派第' + (h.day - sect.createdDay + 1) + '天 · ') : '';
                return '<p class="text-xs text-gray-400">' + dn + h.text + '</p>';
            }).join('') : '<p class="text-xs text-gray-500">尚无记录。</p>') + '</div>';

        html += '<button onclick="window._psDissolveAsk()" class="w-full bg-gray-700 hover:bg-red-900 text-gray-300 text-xs py-1 rounded">解散宗门（弟子散尽，库房清空）</button>';
        if (typeof window.showModal === 'function') window.showModal('🏯 ' + sect.name + ' · 宗门总册', html);
    };

    window._psSetPolicy = function (p) {
        var sect = _mine();
        if (!sect) return;
        var r = window.PlayerSect.focusPolicy(sect.id, p);
        if (r && r.ok) {
            _msg('门中议定新策：' + ({ expand: '扩张', internal: '内政', militarize: '备战' }[p]) + '。', 'info');
            window.openPlayerSectPanel();
        }
    };

    window._psChooseSite = function (siteId) {
        var sect = _mine();
        if (!sect) return;
        var r = window.PlayerSect.chooseSite(sect.id, siteId);
        if (r && r.ok) {
            _msg('山门补录：「' + r.site.name + '」。', 'success');
            window.openPlayerSectPanel();
        }
    };

    // ============ 招收弟子 ============
    // 第九波·明面：招弟子曾经有两个打架的入口——旧「好感≥20」面板是一条摆在明面上的死路，
    // 白手起家的「游说招徒」才是活路。现在合成一个：有游说就走游说（故人带标记），缺模块才回落旧面板。
    var RECRUIT_AFFECTION = 20;
    function _rootLabel(npc) {
        try {
            if (window.NPCLife && typeof window.NPCLife.npcRootGrowthMul === 'function') {
                var m = Number(window.NPCLife.npcRootGrowthMul(npc));
                if (isFinite(m) && m > 0) {
                    if (m >= 2) return '天灵根';
                    if (m >= 1.2) return '上品灵根';
                    if (m >= 0.8) return '中庸之资';
                    if (m >= 0.5) return '下品灵根';
                    return '杂灵根';
                }
            }
        } catch (e) {}
        return '';
    }
    window._psOpenRecruit = function () {
        if (window.PSBoot && typeof window._psOpenDrive === 'function') { window._psOpenDrive(); return; }
        var sect = _mine();
        if (!sect) return;
        var P = window.PlayerSect;
        var cap = P.POSITION_SLOTS['弟子'];
        var inSect = {};
        (sect.disciples || []).forEach(function (d) { inSect[d.npcId] = 1; });
        var all = (window.npcManager && typeof window.npcManager.getAllNPCs === 'function') ? (window.npcManager.getAllNPCs() || []) : [];
        var cands = all.filter(function (n) { return n && !inSect[n.id] && !n._graduated; }).map(function (n) {
            return {
                id: n.id, name: n.name,
                realm: (n.combat && n.combat.realm) || '修士',
                aff: Math.round((n.relationship && n.relationship.affection) || 0),
                root: _rootLabel(n),
                ok: ((n.relationship && n.relationship.affection) || 0) >= RECRUIT_AFFECTION
            };
        }).filter(function (c) { return !!c.id; }).sort(function (a, b) { return b.aff - a.aff; }).slice(0, 12);

        var html = '<p class="text-xs text-gray-400 mb-2">拜山门的规矩：肯投你门下的人，总得先跟你打过交道（好感 ≥ ' + RECRUIT_AFFECTION + '）。' +
            '资质越好的弟子，传功进境越快。</p>';
        if (sect.disciples.length >= cap) {
            html += '<p class="text-sm text-red-300 mb-2">山门就这么大，弟子满 ' + cap + ' 人了——先送走几个，或者把山门扩一扩。</p>';
        } else if (!cands.length) {
            html += '<p class="text-sm text-gray-500 mb-2">眼下江湖上还没跟你相熟的人——多结交，再开山门。</p>';
        } else {
            html += cands.map(function (c) {
                return '<div class="bg-gray-900/50 px-3 py-2 rounded border border-gray-700 mb-2 flex justify-between items-center">' +
                    '<div><span class="text-gray-100 text-sm">' + c.name + '</span> <span class="text-xs text-blue-300">[' + c.realm + ']</span>' +
                    (c.root ? ' <span class="text-xs text-cyan-400">' + c.root + '</span>' : '') +
                    ' <span class="text-xs ' + (c.ok ? 'text-green-400' : 'text-gray-500') + '">好感 ' + c.aff + '</span></div>' +
                    (c.ok
                        ? '<button onclick="window._psRecruit(\'' + c.id + '\')" class="bg-green-700 hover:bg-green-600 text-white text-xs px-3 py-1 rounded">收录</button>'
                        : '<span class="text-xs text-gray-500">不熟——先结识再说</span>') + '</div>';
            }).join('');
        }
        if (typeof window.showModal === 'function') window.showModal('招收弟子 · ' + sect.name, html);
    };

    window._psRecruit = function (npcId) {
        var sect = _mine();
        if (!sect || !npcId) return;
        var r = window.PlayerSect.recruitDisciple(sect.id, npcId);
        if (r && r.ok) {
            var npc = window.npcManager && window.npcManager.getNPC ? window.npcManager.getNPC(npcId) : null;
            _msg(((npc && npc.name) || '一名修士') + ' 拜入「' + sect.name + '」门下，记名弟子。', 'success');
            window._psOpenRecruit();
        } else if (r && r.reason === 'already-disciple') {
            _msg('此人已在门中。', 'warning');
        }
    };

    // ============ 职位任命 ============
    // 长老座镇山门（灵石 +1、声望 +0.05/日·位）；堂主管库（兵器、丹药各 +0.5/日·位）——有名有据，非空衔
    window._psOpenAssign = function (npcId) {
        var sect = _mine();
        if (!sect || !npcId) return;
        var P = window.PlayerSect;
        var npc = window.npcManager && window.npcManager.getNPC ? window.npcManager.getNPC(npcId) : null;
        var cur = P.getDisciple(sect.id, npcId);
        var curPos = (cur && cur.position) || '弟子';
        var html = '<p class="text-xs text-gray-400 mb-3">' + ((npc && npc.name) || '弟子') + ' 现任「' + curPos + '」。' +
            '职有专职——不是虚衔：</p><div class="space-y-2">' +
            [['长老', P.POSITION_SLOTS['长老'], '座镇山门：每日灵石 +1、声望 +0.05'],
             ['堂主', P.POSITION_SLOTS['堂主'], '执掌库房：每日兵器 +0.5、丹药 +0.5'],
             ['弟子', P.POSITION_SLOTS['弟子'], '记名修行，专心用功']].map(function (x) {
                var cnt = (sect.disciples || []).filter(function (d) { return d.position === x[0]; }).length;
                var isCur = curPos === x[0];
                return '<button onclick="window._psAssign(\'' + npcId + '\',\'' + x[0] + '\')" class="w-full text-left px-3 py-2 rounded border ' +
                    (isCur ? 'border-purple-400 bg-purple-900/40' : 'border-gray-600 bg-gray-800/60 hover:bg-gray-700/60') + '">' +
                    '<div class="flex justify-between"><span class="text-sm text-gray-100">' + x[0] + '</span>' +
                    '<span class="text-xs text-gray-400">' + cnt + '/' + x[1] + ' 席' + (isCur ? ' · 现任' : '') + '</span></div>' +
                    '<p class="text-xs text-gray-400 mt-1">' + x[2] + '</p></button>';
            }).join('') + '</div>';
        if (typeof window.showModal === 'function') window.showModal('职位任命', html);
    };

    window._psAssign = function (npcId, position) {
        var sect = _mine();
        if (!sect || !npcId) return;
        var r = window.PlayerSect.assignPosition(sect.id, npcId, position);
        if (r && r.ok) {
            var npc = window.npcManager && window.npcManager.getNPC ? window.npcManager.getNPC(npcId) : null;
            _msg(((npc && npc.name) || '弟子') + ' 就任「' + position + '」。', 'success');
            window.openPlayerSectPanel();
        } else if (r && r.reason === 'slot-full') {
            _msg('「' + position + '」的席位坐满了（' + r.current + '/' + r.slot + '）。', 'warning');
        } else if (r && r.reason === 'founder-already-leader') {
            _msg('掌门之位是你的——你是立宗之人。', 'info');
        }
    };

    // ============ 传功（优先用宗门丹药布置）/ 出师 ============
    window._psTeach = function (npcId) {
        if (typeof window.teachDisciple === 'function') window.teachDisciple(npcId, true);
        window.openPlayerSectPanel();
    };
    window._psGraduate = function (npcId) {
        if (typeof window.tryGraduateDisciple === 'function') window.tryGraduateDisciple(npcId);
        window.openPlayerSectPanel();
    };

    // 第九波·明面：解散确认改游戏内弹窗——浏览器原生灰框是全游戏最出戏的一处，退役
    window._psDissolveAsk = function () {
        var sect = _mine();
        if (!sect) return;
        var n = sect.disciples.length;
        var body = '<p class="text-sm text-gray-200 mb-3">确定解散「' + sect.name + '」？' + (n ? n + ' 名弟子就地遣散，' : '') + '库房清空，此事记入江湖。</p>' +
            '<div class="flex gap-2">' +
            '<button onclick="window._psDissolveConfirm()" class="flex-1 bg-red-800 hover:bg-red-700 text-white text-sm py-2 rounded">解散</button>' +
            '<button onclick="window._psDissolveCancel()" class="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm py-2 rounded">再想想</button></div>';
        if (typeof window.showModal === 'function') window.showModal('解散宗门', body);
    };
    window._psDissolveCancel = function () {
        try { var ov = document.getElementById('xianxia-modal-overlay'); if (ov) ov.remove(); } catch (e) {}
        window.openPlayerSectPanel();
    };
    window._psDissolveConfirm = function () {
        try { var ov = document.getElementById('xianxia-modal-overlay'); if (ov) ov.remove(); } catch (e) {}
        window._psDissolve();
    };
    window._psDissolve = function () {
        var sect = _mine();
        if (!sect) return;
        var r = window.PlayerSect.dissolve(sect.id);
        if (r && r.ok) {
            _msg('「' + sect.name + '」自此除名——江湖上还会念叨几年。', 'info');
            if (window.updateCultivationUI) window.updateCultivationUI();
        }
    };

    // ============ 进山演阵（v20.52 接武库） ============
    // 主动进山练一场：库中兵器发给门中弟子列阵迎敌——兵器越多，妖兽进场攻势越挫（每件分担 0.5%，封顶三成），
    // 恶战之后兵器必有折损；库空（不足 10 件）则无人分担，只能掌门一人赤手迎敌。
    window._defendSectRaid = function () {
        var cd = window.currentCharData;
        if (!cd) { _msg('请先创建角色进入游戏。', 'warning'); return; }
        var P = window.PlayerSect;
        var tier = _tier() || 4;
        var enemyData = {
            name: '攻山妖兽', type: 'beast', species: 'beast', physiologyType: 'beast',
            level: tier * 4 + 10,
            attack: 40 + tier * 6, defense: 20 + tier * 3, speed: 25,
            maxDurability: 120 + tier * 20, durabilities: { chest: 120 + tier * 20 },
            combatAbilities: []
        };
        var sect = _mine();
        if (sect) {
            var wpn = Math.floor((sect.resources && sect.resources.weapon) || 0);
            if (wpn >= 10) {
                var easePct = Math.min(0.3, wpn * 0.005);
                enemyData.attack = Math.round(enemyData.attack * (1 - easePct));
                enemyData.maxDurability = Math.round(enemyData.maxDurability * (1 - easePct));
                enemyData.durabilities = { chest: enemyData.maxDurability };
                var used = Math.floor(wpn * 0.3);
                P.consumeResource(sect.id, 'weapon', used);
                P.addHistory(sect.id, '掌门带弟子进山演阵，与妖兽实打一场——发下 ' + used + ' 件兵器，恶战之后折损无算。');
                _msg('⚔️ 进山演阵！库中兵器发放下去，弟子列阵迎敌（妖兽攻势 −' + Math.round(easePct * 100) + '%，战后折损兵器 ' + used + ' 件）', 'warning');
            } else {
                P.addHistory(sect.id, '进山演阵，库中无兵器可发——弟子们只能看着掌门一人迎敌。');
                _msg('⚔️ 妖兽当道，库中连件像样的兵刃都没有（不足 10 件），只能靠你自己。', 'warning');
            }
        }
        if (typeof window.startBattle === 'function') window.startBattle(enemyData);
    };

    try { console.log('[PlayerSectUI] initialized (立派流程 + 宗门总册 + 招收弟子 + 第二十一波镇山秘艺/派遣下山入口)'); } catch (e) {}
})();
