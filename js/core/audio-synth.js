// ==================== audio-synth.js - v20.1 音效合成（Web Audio API） ====================
// 纯代码合成短促提示音：突破/战斗胜利/收火/炼丹/任务完成，无需音频资产文件
// 监听 EventBus 关键事件自动触发；静音偏好存 localStorage（用户偏好，非角色状态）
// 浏览器策略：首次用户交互后 resume AudioContext

(function () {

var _ctx = null;
var _muted = false;
try { _muted = localStorage.getItem('xianxia_sfx_muted') === '1'; } catch (e) {}

function _ctxGet() {
    if (_ctx) return _ctx;
    try { _ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
    return _ctx;
}

// 首次用户交互 resume AudioContext（浏览器自动播放策略）
function _resume() {
    var c = _ctxGet();
    if (c && c.state === 'suspended') { try { c.resume(); } catch (e) {} }
}
document.addEventListener('click', _resume);
document.addEventListener('keydown', _resume);

// 单音：freq 频率，dur 秒，type 波形，vol 音量，delay 延迟
function _tone(freq, dur, type, vol, delay) {
    if (_muted) return;
    var c = _ctxGet(); if (!c) return;
    try {
        var t0 = c.currentTime + (delay || 0);
        var osc = c.createOscillator();
        var g = c.createGain();
        osc.type = type || 'sine';
        osc.frequency.value = freq;
        osc.connect(g); g.connect(c.destination);
        var v = vol || 0.15;
        g.gain.setValueAtTime(0, t0);
        g.gain.linearRampToValueAtTime(v, t0 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
        osc.start(t0); osc.stop(t0 + dur + 0.02);
    } catch (e) {}
}

var SFX = {
    breakthrough: function () { // 上行琶音 C-E-G
        _tone(523, 0.15, 'triangle', 0.18, 0);
        _tone(659, 0.15, 'triangle', 0.18, 0.12);
        _tone(784, 0.30, 'triangle', 0.20, 0.24);
    },
    victory: function () { // 战斗胜利 G-C
        _tone(392, 0.12, 'square', 0.10, 0);
        _tone(523, 0.25, 'square', 0.12, 0.10);
    },
    defeat: function () { // 战败下行
        _tone(220, 0.20, 'sawtooth', 0.12, 0);
        _tone(165, 0.30, 'sawtooth', 0.12, 0.18);
    },
    fire: function () { // 收火清脆叮
        _tone(880, 0.12, 'sine', 0.18, 0);
        _tone(1320, 0.15, 'sine', 0.13, 0.05);
    },
    alchemy: function () { // 炼丹柔和
        _tone(440, 0.20, 'sine', 0.12, 0);
        _tone(554, 0.25, 'sine', 0.12, 0.15);
    },
    quest: function () { // 任务完成
        _tone(659, 0.10, 'triangle', 0.13, 0);
        _tone(880, 0.20, 'triangle', 0.13, 0.08);
    }
};

function playSfx(name) { if (SFX[name]) SFX[name](); }

function setMuted(m) {
    _muted = !!m;
    try { localStorage.setItem('xianxia_sfx_muted', _muted ? '1' : '0'); } catch (e) {}
}

function isMuted() { return _muted; }

// 设置面板开关
function toggleSfx() {
    var cb = document.getElementById('setting-sfx');
    setMuted(cb ? !cb.checked : false);
}

// 初始化 checkbox 反映当前静音偏好
function _syncCheckbox() {
    var cb = document.getElementById('setting-sfx');
    if (cb) cb.checked = !_muted;
}

// EventBus 监听关键事件自动触发音效
if (window.EventBus && typeof window.EventBus.on === 'function') {
    try {
        window.EventBus.on('cultivation:breakthrough', function () { playSfx('breakthrough'); });
        window.EventBus.on('enemy:defeated', function () { playSfx('victory'); });
        window.EventBus.on('quest:completed', function () { playSfx('quest'); });
        window.EventBus.on('item:crafted', function (d) { if (d && d.recipeId) playSfx('alchemy'); });
    } catch (e) {}
}

// 同步 checkbox（DOM 就绪后）
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _syncCheckbox);
} else {
    _syncCheckbox();
}

window.playSfx = playSfx;
window.setSfxMuted = setMuted;
window.isSfxMuted = isMuted;
window.toggleSfx = toggleSfx;

})();
