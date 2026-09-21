// ==================== marriage-offspring.js - v20.0 2.8 玩家婚姻/后代/家族 ====================
// 道侣 bond>=2 可诞育后代，后代继承玩家1门功法/血脉；家族传承
// 依赖：1.4 NPC、1.7 转世（后代继承可联动）、bonds（dao_companion）

(function () {

// 取玩家道侣 bond
function getDaoCompanionBond() {
    var cd = window.currentCharData;
    if (!cd || !cd.bonds) return null;
    for (var k in cd.bonds) {
        if (cd.bonds[k] && cd.bonds[k].type === 'dao_companion') return { id: k, bond: cd.bonds[k] };
    }
    return null;
}

// 诞育后代：道侣 bond>=2，扣灵石，后代继承玩家主功法
function haveChild() {
    var cd = window.currentCharData;
    if (!cd) { if (window.showMessage) window.showMessage('请先创建角色', 'warning'); return false; }
    var dc = getDaoCompanionBond();
    if (!dc) { if (window.showMessage) window.showMessage('你尚无道侣，无从诞育后代。', 'warning'); return false; }
    if ((dc.bond.level || 1) < 2) { if (window.showMessage) window.showMessage('道侣情分未深（需 bond≥2），暂难孕育灵胎。', 'warning'); return false; }
    if (!Array.isArray(cd._children)) cd._children = [];
    if (cd._children.length >= 3) { if (window.showMessage) window.showMessage('子嗣已满（上限3）。', 'info'); return false; }
    var cost = 200;
    if (window.DataManager && window.DataManager.deductSpiritStones && !window.DataManager.deductSpiritStones(cost)) {
        if (window.showMessage) window.showMessage('诞育灵胎需 ' + cost + ' 灵石调养。', 'warning');
        return false;
    }
    // 继承玩家主修功法（F-62 v15.4 藏经阁接线：artInsights 掌握度最高的 art_xx）
    var skills = window.currentSkills || {};
    var inheritSkill = null;
    for (var s in skills) { if (skills[s]) { inheritSkill = { id: skills[s].id, name: skills[s].name }; break; } }
    // F-62 v15.4 藏经阁：玩家没装备通用功法时，从 artInsights 找掌握度最高的 art_xx 跨门派反查
    if (!inheritSkill) {
        var ds = window.discipleState;
        if (ds && ds.artInsights) {
            var best = null;
            for (var aid in ds.artInsights) {
                var rec = ds.artInsights[aid];
                if (!rec || !(rec.m > 0)) continue;
                if (!best || rec.m > best.m) best = { id: aid, m: rec.m };
            }
            if (best) {
                var allArts = window.SECT_SPECIFIC_ARTS;
                if (allArts) {
                    for (var sn in allArts) {
                        var arr = allArts[sn];
                        if (!Array.isArray(arr)) continue;
                        for (var i = 0; i < arr.length; i++) {
                            if (arr[i].id === best.id) {
                                inheritSkill = { id: arr[i].id, name: arr[i].name };
                                break;
                            }
                        }
                        if (inheritSkill) break;
                    }
                }
            }
        }
    }
    // 后代名（取父母名各一字 + 灵）
    var npc = window.npcManager && window.npcManager.getNPC(dc.id);
    var childName = (cd.name || '无').charAt(0) + ((npc && npc.name) || '侣').charAt(0) + '灵';
    var child = {
        name: childName,
        parentNpcId: dc.id,
        inheritSkill: inheritSkill,
        bornDay: (window.timeSystem && window.timeSystem.getAbsoluteDay) ? window.timeSystem.getAbsoluteDay() : 0,
        grown: false
    };
    cd._children.push(child);
    dc.bond.level = (dc.bond.level || 2) + 1; // 诞育增进道侣情分
    if (window.showMessage) window.showMessage('👶 你与道侣诞下灵胎「' + childName + '」' + (inheritSkill ? '，承你' + inheritSkill.name + '之脉' : '') + '。', 'success');
    return true;
}

// 后代成年（出生 N 天后 grown=true，可参与世界）
function checkChildrenGrown() {
    try {
        var cd = window.currentCharData;
        if (!cd || !cd._children || !cd._children.length) return;
        var day = (window.timeSystem && window.timeSystem.getAbsoluteDay) ? window.timeSystem.getAbsoluteDay() : 0;
        for (var i = 0; i < cd._children.length; i++) {
            var c = cd._children[i];
            if (!c.grown && (day - (c.bornDay || 0)) >= 360) {
                c.grown = true;
                if (window.gameLog && window.gameLog.add) window.gameLog.add('子嗣「' + c.name + '」已长成——从此可以亲自教导、放出去历练，或留在身边。（修炼面板「会见子嗣」）', 'success');
            }
        }
    } catch (e) {}
}

// ==================== v21.9 子嗣长线：长成之后不再只是一行日志 ====================
// grown 标记此前全库零读取——孩子「长成」二字之后没有任何下文。
// 现在：亲自传功（等级+反哺）、放出去历练（三十日带回行囊与见闻）、留在身边（心情与天伦）。
var CHILD_TITLES = ['', '入门弟子', '小有所成', '出师之姿', '独当一面', '开枝散叶'];

function _today() {
    return (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') ? window.timeSystem.getAbsoluteDay() : 0;
}
function _addStones(n) {
    try {
        if (window.DataManager && typeof window.DataManager.addSpiritStones === 'function') window.DataManager.addSpiritStones(n);
        else if (window.currentCharData) window.currentCharData.spiritStones = (window.currentCharData.spiritStones || 0) + n;
    } catch (e) {}
}

function childAction(idx, act) {
    var cd = window.currentCharData;
    if (!cd || !cd._children || !cd._children[idx]) return false;
    var c = cd._children[idx];
    if (!c.grown) { if (window.showMessage) window.showMessage('孩子还未长成，再等等。', 'info'); return false; }
    // 第三十二波：入了门的孩子吃门里的饭——传功走总册的名分，不再是「在家从父母」的口径
    if (c.inSect) { if (window.showMessage) window.showMessage('孩子已在门中修行——传功、派遣、结伴，都在宗门总册的名分里。', 'info'); return false; }
    if (act === 'teach') {
        c.level = (c.level || 0) + 1;
        c.path = 'taught';
        var title = CHILD_TITLES[Math.min(c.level, CHILD_TITLES.length - 1)] || '一代宗师';
        cd.essence = (cd.essence || 0) + 20;
        var bond = getDaoCompanionBond();
        if (bond && bond.bond) bond.bond.progress = Math.min(100, (bond.bond.progress || 0) + 5);
        if (window.gameLog && window.gameLog.add) {
            window.gameLog.add('📖 你亲自传功——「' + c.name + '」进境一层，如今是「' + title + '」。教学相长，你自己的道也澄澈了一分。（真元+20，子嗣每日孝敬灵石 ' + (c.level * 3) + '）', 'success');
        }
        if (c.level >= 5) {
            try { if (window.WorldJournal && window.WorldJournal.record) window.WorldJournal.record({ type: 'family', title: '开枝散叶', text: '「' + c.name + '」学成自立，开枝散叶——你的道统有了下一代传人。' }); } catch (e) {}
        }
        if (window.showMessage) window.showMessage('📖 传功完毕——「' + c.name + '」如今是「' + title + '」。', 'success');
    } else if (act === 'venture') {
        c.path = 'ventured';
        c.awayUntilDay = _today() + 30;
        if (window.gameLog && window.gameLog.add) window.gameLog.add('🎒 「' + c.name + '」背起行囊出门历练去了——三十日后回来。儿行千里，你嘴上说放心，夜里还是醒了两回。', 'info');
        if (window.showMessage) window.showMessage('🎒 孩子出门历练了，三十日后回来。', 'info');
    } else if (act === 'home') {
        c.path = 'home';
        cd.mood = Math.min(100, (cd.mood || 50) + 10);
        if (window.gameLog && window.gameLog.add) window.gameLog.add('🏡 「' + c.name + '」留在你身边。晚课一起上，饭桌多一副碗筷——天伦之乐，心情+10。', 'success');
        if (window.showMessage) window.showMessage('🏡 天伦之乐，心情+10。', 'success');
    } else return false;
    if (window.updateCharacterStatus) window.updateCharacterStatus();
    openChildPanel();
    return true;
}

// 每日：历练归来 + 孝敬反哺
function dailyChildrenLife() {
    try {
        var cd = window.currentCharData;
        if (!cd || !cd._children || !cd._children.length) return;
        var day = _today();
        var tribute = 0;
        for (var i = 0; i < cd._children.length; i++) {
            var c = cd._children[i];
            if (!c.grown) continue;
            if (c.path === 'ventured' && day >= (c.awayUntilDay || 0)) {
                c.path = 'home';
                c.level = (c.level || 0) + 1;
                var loot = 100 + (c.level || 1) * 60;
                _addStones(loot);
                var title = CHILD_TITLES[Math.min(c.level, CHILD_TITLES.length - 1)] || '一代宗师';
                if (window.gameLog && window.gameLog.add) {
                    window.gameLog.add('🎒 「' + c.name + '」历练回来了——风尘满面，眼睛发亮，行囊里塞着 ' + loot + ' 灵石的见闻与收获。江湖把 Ta 磨成了「' + title + '」，也把 Ta 还给了你。', 'success');
                }
            }
            if ((c.level || 0) > 0 && c.path !== 'ventured' && !c.inSect) tribute += c.level * 3; // 第三十二波：入了门的孩子吃门里的饭，不再往家里捎钱（一份人不能吃两份）
        }
        if (tribute > 0) _addStones(tribute);
    } catch (e) {}
}

// ==================== 第三十二波 · 血脉归山门：孩子长成了自己来敲门 ====================
// 掌门自家立着山门时，长成的孩子可「送去山门求学」——真入门：
// 先成为名册上的人（血肉档：灵根承你八九分、境界随亲传的层数、好感生来就亲），
// 再走与一切弟子同一道入门口（记名/宗谱/同门边全生效）；传功、派遣、结伴、婚配，从此都在门里。
// 守恒：入了门的孩子吃门里的饭——每日孝敬停发（一份人不能吃两份）；人在门里，家里的三条路数不再走。
function _homeName() { try { return (window.PSectWorld && window.PSectWorld.homeName) ? window.PSectWorld.homeName() : null; } catch (e) { return null; } }
function _chronOf(sect, text) {
    try { if (window.SectGov && window.SectGov.chronicle) { window.SectGov.chronicle(sect, text); return; } } catch (e) {}
    try {
        var it = (window.SECT_INTERNAL || {})[sect];
        if (!it) return;
        if (!it.chronicle) it.chronicle = [];
        it.chronicle.push({ day: _today(), text: String(text) });
    } catch (e2) {}
}
function _streetOf(text) {
    try {
        var f = (window.eventFlags = window.eventFlags || {});
        if (!f['qi_street'] || !f['qi_street'].push) f['qi_street'] = [];
        f['qi_street'].push({ day: _today(), text: String(text) });
        if (f['qi_street'].length > 60) f['qi_street'].splice(0, f['qi_street'].length - 60);
    } catch (e) {}
}
function sendChildToSect(idx) {
    var cd = window.currentCharData;
    if (!cd || !cd._children || !cd._children[idx]) return false;
    var c = cd._children[idx];
    if (!c.grown) { if (window.showMessage) window.showMessage('孩子还未长成——山门不收稚子。', 'info'); return false; }
    if (c.inSect) { if (window.showMessage) window.showMessage('孩子早就入门了。', 'info'); return false; }
    if (c.path === 'ventured') { if (window.showMessage) window.showMessage('孩子正在外历练——等回了山，再谈入门。', 'info'); return false; }
    var home = _homeName();
    if (!home) { if (window.showMessage) window.showMessage('还没立宗——送孩子去哪里求学。', 'warning'); return false; }
    var ps = null;
    try { ps = window.PSectWorld.byName(home); } catch (e0) {}
    if (!ps || !window.PlayerSect || !window.PlayerSect.recruitDisciple) return false;
    var npcId = 'kid_' + idx + '_' + (c.bornDay || 0);
    try { if (window.npcManager && window.npcManager.getNPC && window.npcManager.getNPC(npcId)) { if (window.showMessage) window.showMessage('名册上已有此人。', 'info'); return false; } } catch (e0b) {}
    // 灵根承你八九分——不是复印，是血脉
    var roots = { metal: 20, wood: 20, water: 20, fire: 20, earth: 20 };
    try {
        var pr = cd.spiritualRoots || {};
        ['metal', 'wood', 'water', 'fire', 'earth'].forEach(function (k) {
            var v = Number(pr[k]) || 0;
            if (v > 0) roots[k] = Math.max(1, Math.round(v * (0.8 + Math.random() * 0.4)));
        });
    } catch (e1) {}
    var gender = ((c.name || '').charCodeAt(0) % 2 === 0) ? 'female' : 'male';
    var layer = Math.max(1, Math.min(9, 1 + Math.floor((c.level || 0) / 2)));
    var newNpc = {
        id: npcId, name: c.name || '掌门之子', gender: gender, age: 18,
        location: home,
        spiritualRoots: roots,
        combat: { realm: '炼气', layer: layer, attack: 10 + (c.level || 0) * 2, defense: 10, health: 100, speed: 10 },
        relationship: { affection: 80 },
        appearance: '眉眼间有掌门之影',
        personality: c.inheritSkill ? ('承「' + c.inheritSkill.name + '」之脉') : '家学渊源',
        occupation: home + '弟子',
        isPlayer: false,
        _purse: 0,
        lineage: { parents: c.parentNpcId ? ['player', c.parentNpcId] : ['player'], children: [], master: null, inheritor: null, daoCompanion: null, birthDay: c.bornDay || 0, isFounder: false }
    };
    var added = false;
    try {
        if (window.npcManager && typeof window.npcManager.addNPC === 'function') { window.npcManager.addNPC(newNpc); added = true; }
        else if (window.npcManager && Array.isArray(window.npcManager.npcs)) { window.npcManager.npcs.push(newNpc); added = true; }
    } catch (e2) {}
    if (!added) { if (window.showMessage) window.showMessage('人物名册未就绪——改日再来。', 'warning'); return false; }
    var r = null;
    try { r = window.PlayerSect.recruitDisciple(ps.id, npcId); } catch (e3) {}
    if (!r || !r.ok) { if (window.showMessage) window.showMessage('入门的口没走通——改日再试。', 'warning'); return false; }
    c.inSect = npcId;
    c.path = 'sect';
    // 亲生的孩子，心境生来就是死心塌地
    try {
        var member = null;
        var all = ps.disciples || [];
        for (var i = 0; i < all.length; i++) { if (all[i] && all[i].npcId === npcId) { member = all[i]; break; } }
        if (member && window.PSectVenture && window.PSectVenture.bumpMood) window.PSectVenture.bumpMood(member, 15);
    } catch (e4) {}
    _chronOf(home, '掌门亲子「' + newNpc.name + '」上山叩门——嫡系二代入了名册，自今日始在门中修行家传之道。');
    _streetOf('「' + home + '」的一桩稀罕事：掌门把自己的孩子送进门里当了弟子——茶棚里说，这是家学渊源，道统有人了。');
    if (window.gameLog && window.gameLog.add) window.gameLog.add('🏯 「' + newNpc.name + '」背着剑匣上了你的山门——嫡系二代入门为徒（炼气' + layer + '层，心境死心塌地）。传功、派遣、结伴，都在你的名分里了。', 'success');
    if (window.showMessage) window.showMessage('🏯 血脉归山门——「' + newNpc.name + '」入门了！（每日孝敬自此停发：孩子吃门里的饭）', 'success');
    if (window.updateCharacterStatus) window.updateCharacterStatus();
    openChildPanel();
    return true;
}

function openChildPanel() {
    var cd = window.currentCharData;
    if (!cd || !cd._children || !cd._children.length) {
        if (window.showMessage) window.showMessage('尚无子嗣。', 'info');
        return;
    }
    var day = _today();
    var html = '<div class="space-y-3">';
    cd._children.forEach(function (c, idx) {
        var age = Math.max(0, day - (c.bornDay || 0));
        html += '<div class="bg-gray-800/60 rounded-lg p-3 border border-gray-700">';
        html += '<p class="font-bold text-pink-300">👤 ' + c.name + ' <span class="text-xs text-gray-500">（' + age + ' 天' + (c.inheritSkill ? ' · 承' + c.inheritSkill.name + '之脉' : '') + '）</span></p>';
        if (!c.grown) {
            html += '<p class="text-xs text-gray-400 mt-1">尚在成长——长成还需 ' + Math.max(0, 360 - age) + ' 天。</p>';
        } else {
            var title = CHILD_TITLES[Math.min(c.level || 0, CHILD_TITLES.length - 1)] || (c.level ? '一代宗师' : '初长成的少年');
            var pathText = c.inSect ? ('🏯 已入「' + (_homeName() || '山门') + '」——嫡系二代，名册在案')
                : c.path === 'ventured' ? ('🎒 历练中（还有 ' + Math.max(0, (c.awayUntilDay || day) - day) + ' 天归来）')
                : c.path === 'taught' ? '📖 随你修行'
                : c.path === 'home' ? '🏡 承欢膝下' : '🌱 还没定下路数';
            html += '<p class="text-xs text-gray-300 mt-1">「' + title + '」 · ' + pathText + (((c.level || 0) > 0 && !c.inSect) ? ' · 每日孝敬灵石 ' + (c.level * 3) : '') + '</p>';
            if (!c.inSect && c.path !== 'ventured') {
                html += '<div class="flex gap-2 mt-2 flex-wrap">' +
                    '<button onclick="childAction(' + idx + ',\'teach\')" class="bg-purple-700 hover:bg-purple-600 text-white px-3 py-1 rounded text-xs">📖 亲自传功</button>' +
                    '<button onclick="childAction(' + idx + ',\'venture\')" class="bg-blue-700 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs">🎒 放 Ta 历练</button>' +
                    '<button onclick="childAction(' + idx + ',\'home\')" class="bg-pink-700 hover:bg-pink-600 text-white px-3 py-1 rounded text-xs">🏡 留在身边</button>' +
                    (_homeName() ? '<button onclick="sendChildToSect(' + idx + ')" class="bg-amber-800 hover:bg-amber-700 text-white px-3 py-1 rounded text-xs" title="真入门：嫡系二代入弟子名册，传功派遣结伴都在门里；入了门吃门里的饭，每日孝敬停发">🏯 送去山门求学（入门为徒）</button>' : '') +
                    '</div>';
            }
        }
        html += '</div>';
    });
    html += '</div>';
    if (typeof window.showModal === 'function') window.showModal('👨‍👩‍👧 会见子嗣', html);
}

if (window.timeSystem && typeof window.timeSystem.onNewDaySubscribe === 'function') {
    window.timeSystem.onNewDaySubscribe(checkChildrenGrown);
    window.timeSystem.onNewDaySubscribe(dailyChildrenLife);
}

window.haveChild = haveChild;
window.getDaoCompanionBond = getDaoCompanionBond;
window.openChildPanel = openChildPanel;
window.childAction = childAction;
window.sendChildToSect = sendChildToSect; // 第三十二波 · 血脉归山门

})();
